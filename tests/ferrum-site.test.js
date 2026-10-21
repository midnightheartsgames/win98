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
  removeEventListener: () => {},
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
eval(read('js/apps/ferrum-data.js'));
eval(read('js/apps/ferrum-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));
eval(read('js/apps/outlook-mail.js'));

const ie = window.appIE;
const site = window.ferrumSite;
const base = 'http://www.ferrum98.ru';
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

function createMockContainer(initialUrl) {
  const state = {
    url: initialUrl,
    html: site.renderSite(initialUrl),
    inputs: {},
    checked: {}
  };

  const makeEl = (key, attrs = {}) => {
    const listeners = {};
    return {
      get value() { return state.inputs[key] !== undefined ? state.inputs[key] : (attrs.value || ''); },
      set value(v) { state.inputs[key] = v; },
      get checked() { return state.checked[key] !== undefined ? state.checked[key] : Boolean(attrs.checked); },
      set checked(v) { state.checked[key] = Boolean(v); },
      getAttribute(name) { return attrs[name] !== undefined ? attrs[name] : null; },
      addEventListener(evt, fn) { listeners[evt] = fn; },
      trigger(evt, eventObj = { preventDefault: () => {} }) {
        if (listeners[evt]) listeners[evt](eventObj);
      }
    };
  };

  const elementsBySel = new Map();
  const listBySel = new Map();

  const registerList = (sel, items) => {
    listBySel.set(sel, items.map((attrs, idx) => makeEl(`${sel}:${idx}`, attrs)));
  };

  const win = { id: 'app_ie' };

  const rebuild = () => {
    elementsBySel.clear();
    listBySel.clear();

    const singleMap = {
      '#btn-ferrum-next-banner': {},
      '#btn-ferrum-poll-vote': {},
      'input[name="ferrum-poll-choice"]:checked': { value: 'cel300a', checked: true },
      '#ferrum-comment-author': { value: 'Инженер_МСК' },
      '#ferrum-comment-text': { value: '' },
      '#btn-ferrum-add-comment': { 'data-article-id': 'celeron-300a-b21' },
      '#ferrum-bench-cpu': { value: site.getBenchState().cpu },
      '#ferrum-bench-gpu': { value: site.getBenchState().gpu },
      '#ferrum-bench-mode': { value: site.getBenchState().mode },
      '#btn-ferrum-run-bench': {},
      '#btn-ferrum-bench-notepad': {},
      '#btn-ferrum-bench-save': {},
      '#ferrum-jmp-fsb': { value: String(site.getJumperState().fsb) },
      '#ferrum-jmp-mult': { value: String(site.getJumperState().mult) },
      '#ferrum-jmp-vcore': { value: String(site.getJumperState().vcore) },
      '#ferrum-jmp-b21': { checked: site.getJumperState().b21Taped },
      '#ferrum-jmp-jp1': { checked: site.getJumperState().jp1Protected },
      '#ferrum-sec-bo': { checked: site.getJumperState().closeBo31337 },
      '#ferrum-sec-nb': { checked: site.getJumperState().closeNb12345 },
      '#ferrum-sec-netbios': { checked: site.getJumperState().unbindNetbios139 },
      '#btn-ferrum-jmp-notepad': {},
      '#btn-ferrum-jmp-save': {},
      '#btn-ferrum-rig-notepad': {},
      '#btn-ferrum-rig-save': {},
      '#ferrum-chip-select': { value: site.chipCheckCode },
      '#ferrum-newthread-cat': { value: 'oc' },
      '#ferrum-newthread-author': { value: 'Инженер_98' },
      '#ferrum-newthread-title': { value: '' },
      '#ferrum-newthread-text': { value: '' },
      '#btn-ferrum-create-thread': {},
      '#ferrum-reply-author': { value: 'Оверклокер_МСК' },
      '#ferrum-reply-text': { value: '' },
      '#btn-ferrum-send-reply': { 'data-thread-id': 'celeron-300a-oc' },
      '#btn-ferrum-ask-clippy': {}
    };

    Object.keys(singleMap).forEach(sel => {
      elementsBySel.set(sel, makeEl(sel, singleMap[sel]));
    });

    registerList('[data-ferrum-enc]', [
      { 'data-ferrum-enc': 'win1251' },
      { 'data-ferrum-enc': 'koi8r' },
      { 'data-ferrum-enc': 'translit' }
    ]);
    registerList('[data-ferrum-notepad-art]', [
      { 'data-ferrum-notepad-art': 'celeron-300a-b21' }
    ]);
    registerList('[data-ferrum-save-art]', [
      { 'data-ferrum-save-art': 'celeron-300a-b21' }
    ]);
    registerList('.ferrum-rig-select', [
      { 'data-slot': 'cpu', value: site.getRigState().cpu },
      { 'data-slot': 'video', value: site.getRigState().video }
    ]);
    registerList('input[name="ferrum-rig-market"]', [
      { value: 'mit', checked: site.getRigState().market === 'mit' },
      { value: 'sav', checked: site.getRigState().market === 'sav' }
    ]);
    registerList('[data-ferrum-toggle]', [
      { 'data-ferrum-toggle': 'b21' },
      { 'data-ferrum-toggle': 'jp1' }
    ]);
    registerList('.ferrum-banner[data-url], button[data-url]', [
      { 'data-url': `${base}/jumpers` }
    ]);
    registerList('a[data-url]', []);
  };

  const container = {
    get innerHTML() { return state.html; },
    set innerHTML(v) {
      state.html = v;
      rebuild();
    },
    querySelector(sel) { return elementsBySel.get(sel) || null; },
    querySelectorAll(sel) { return listBySel.get(sel) || []; }
  };

  window.appIE.navigate = (w, nextUrl) => {
    state.url = nextUrl;
    site.lastUrl = nextUrl;
    container.innerHTML = site.renderSite(nextUrl);
    site.bindEvents(w, container);
  };

  rebuild();
  site.bindEvents(win, container);

  return {
    state,
    container,
    win,
    getEl(sel) { return elementsBySel.get(sel); },
    getList(sel) { return listBySel.get(sel) || []; }
  };
}

console.log('--- Testing FerrumLab 98 (Железный Цех \'98) Web 1.0 Site ---');

test('IE routes all FerrumLab 98 URLs and preserves existing hardware/security/forum routes', () => {
  [
    '',
    '/',
    '/news',
    '/news?cat=cpu',
    '/news?cat=video',
    '/news?cat=sec',
    '/article?id=voodoo3-comdex',
    '/article/celeron-300a-b21',
    '/bench',
    '/jumpers',
    '/security',
    '/prices',
    '/forum',
    '/forum?cat=oc',
    '/thread?id=celeron-300a-oc'
  ].forEach(p => {
    assert.strictEqual(ie.identifyPageKey(base + p), 'ferrum', `Expected ferrum for ${base + p}`);
  });
  assert.strictEqual(ie.identifyPageKey('http://www.3dfx-zone.com'), 'hardware');
  assert.strictEqual(ie.identifyPageKey('http://www.antivirus98.com'), 'antivirus');
  assert.strictEqual(ie.identifyPageKey('http://www.y2k-countdown.org'), 'y2k');
  assert.strictEqual(ie.identifyPageKey('http://forum.games98.com'), 'forum');
  assert.ok(ie.getPageTitle('ferrum').includes("Железный Цех '98"));
  assert.ok(ie.getPageTitle('ferrum').includes('25 ноября 1998'));
});

test('Search directory (Железо и безопасность), Favorites, performSearch, Rambler, Yandex and WebRing include FerrumLab 98', () => {
  const hwCat = ie.searchDirectory.find(c => c.title === 'Железо и безопасность');
  assert.ok(hwCat, 'Железо и безопасность category exists');
  assert.ok(hwCat.sites.some(([u, name]) => u === base && name.includes("Железный Цех '98")));
  assert.ok(ie.performSearch('celeron 300a').some(r => r.url === base));
  assert.ok(ie.performSearch('железный цех').some(r => r.url === base));
  assert.ok(ie.performSearch('савёловский прайс').some(r => r.url === base));
  assert.ok(ie.performSearch('back orifice').some(r => r.url === base));
  assert.ok(ie.renderRambler().includes(base));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/search?q=celeron').includes(base));
});

test('Home page and News rubric filter render November 25, 1998 hardware & security dossier and 22 articles', () => {
  const html = site.renderSite(base);
  assert.ok(html.includes("ЖЕЛЕЗНЫЙ ЦЕХ '98"));
  assert.ok(html.includes('Среда, 25 ноября 1998 г.'));
  assert.ok(html.includes('1 у.е. = 20.60 руб.'));
  assert.ok(html.includes('COMDEX'));
  assert.ok(html.includes('STB Systems'));
  assert.ok(html.includes('Celeron 300A'));
  assert.ok(html.includes('Win95.CIH'));
  assert.ok(html.includes('UDP 31337'));
  assert.strictEqual(site.articles.length, 22);

  const secNews = site.renderSite(base + '/news?cat=sec');
  assert.ok(secNews.includes('Win95.CIH'));
  assert.ok(secNews.includes('Back Orifice'));
  assert.ok(secNews.includes('варистор'));
  assert.ok(secNews.includes('MC146818A'));
  assert.ok(!secNews.includes('КС170А'));
  assert.ok(!secNews.includes('Aureal Vortex 2'));
});

test('Full article view renders specs, ASCII schematic, exports to Notepad/VFS, and saves HTML-escaped comments with engineer reply', () => {
  const env = createMockContainer(base + '/article?id=celeron-300a-b21');
  assert.ok(env.state.html.includes('Убийца флагманов: разгон Intel Celeron 300A'));
  assert.ok(env.state.html.includes('Контакт B21 (BSEL#)'));

  env.getList('[data-ferrum-notepad-art]')[0].trigger('click');
  assert.ok(lastNotepadDoc && lastNotepadDoc.title === 'FERRUM_CELERON_300A_B21.TXT');
  assert.ok(lastNotepadDoc.content.includes('450 МГц'));

  env.getList('[data-ferrum-save-art]')[0].trigger('click');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\FERRUM_CELERON_300A_B21.TXT'));

  env.getEl('#ferrum-comment-author').value = 'Overclocker<script>';
  env.getEl('#ferrum-comment-text').value = 'Разогнал Celeron 300A до 450 МГц с пастой КПТ-8! <b>Супер!</b>';
  env.getEl('#btn-ferrum-add-comment').trigger('click');

  assert.ok(env.state.html.includes('Overclocker&lt;script&gt;'));
  assert.ok(env.state.html.includes('Разогнал Celeron 300A до 450 МГц с пастой КПТ-8! &lt;b&gt;Супер!&lt;/b&gt;'));
  assert.ok(env.state.html.includes('Инж. Воробьёв: Главное при разгоне Celeron 300A до 450 МГц'));
  assert.ok(!env.state.html.includes('<script>'));
});

test('Interactive Hardware Test Bench calculates FPS, enforces 16-bit buffer limit on Voodoo2, and exports report', () => {
  const env = createMockContainer(base + '/bench');
  assert.ok(env.state.html.includes('Стенд FPS: прогон timedemo'));
  assert.ok(env.state.html.includes(']timedemo 1'));

  const resDefault = site.computeBenchmark({ cpu: 'cel300a_450', gpu: 'tnt', mode: '800x600x16' });
  assert.ok(resDefault.q2Fps > 60);
  assert.strictEqual(resDefault.warning, '');

  env.getEl('#ferrum-bench-cpu').value = 'pii450';
  env.getEl('#ferrum-bench-gpu').value = 'voodoo2';
  env.getEl('#ferrum-bench-mode').value = '800x600x32';
  env.getEl('#ferrum-bench-mode').trigger('change');

  assert.ok(env.state.html.includes('АППАРАТНОЕ ОГРАНИЧЕНИЕ'));
  assert.ok(env.state.html.includes('только 16 бит'));
  assert.strictEqual(site.computeBenchmark(site.getBenchState()).q2Fps, 0);

  env.getEl('#ferrum-bench-mode').value = '800x600x16';
  env.getEl('#ferrum-bench-mode').trigger('change');
  env.getEl('#btn-ferrum-run-bench').trigger('click');
  assert.ok(site.getBenchState().runs >= 1);

  env.getEl('#btn-ferrum-bench-notepad').trigger('click');
  assert.ok(lastNotepadDoc && lastNotepadDoc.title === 'FERRUM_BENCH_98.TXT');

  env.getEl('#btn-ferrum-bench-save').trigger('click');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\FERRUM_BENCH_98.TXT'));
});

test('Interactive Slot 1 Pin B21, FSB/PCI Divider & Flash BIOS JP1 / Port Security Lab diagnoses risks and exports memo', () => {
  const env = createMockContainer(base + '/jumpers');
  assert.ok(env.state.html.includes('Монтажный стол'));
  assert.ok(env.state.html.includes('Защита в норме.'));
  assert.ok(env.state.html.includes('netstat -an'));

  env.getEl('#ferrum-jmp-b21').checked = false;
  env.getEl('#ferrum-jmp-jp1').checked = false;
  env.getEl('#ferrum-sec-bo').checked = false;
  env.getEl('#ferrum-jmp-b21').trigger('change');

  assert.ok(env.state.html.includes('КОНТАКТ B21 НЕ ИЗОЛИРОВАН'));
  assert.ok(env.state.html.includes('Найдено уязвимостей: 2.'));
  assert.ok(env.state.html.includes('0.0.0.0:31337'));
  assert.ok(env.state.html.includes('Win95.CIH'));
  assert.ok(env.state.html.includes('UDP 31337'));

  env.getEl('#ferrum-jmp-fsb').value = '83.3';
  env.getEl('#ferrum-jmp-b21').checked = true;
  env.getEl('#ferrum-jmp-fsb').trigger('change');
  assert.ok(env.state.html.includes('41.6 МГц'));

  env.getEl('#btn-ferrum-jmp-notepad').trigger('click');
  assert.ok(lastNotepadDoc && lastNotepadDoc.title === 'HARDEN_WIN98_NOV98.TXT');

  env.getEl('#btn-ferrum-jmp-save').trigger('click');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\HARDEN_WIN98_NOV98.TXT'));
});

test('Savyolovsky & Mitino Price List calculates PC build in USD/RUB, detects fake SDRAM/CPUs, and exports invoice', () => {
  const env = createMockContainer(base + '/prices');
  assert.ok(env.state.html.includes('Прайс Савёловского и Митинского радиорынков'));
  assert.ok(env.state.html.includes('ТОВАРНЫЙ ЧЕК'));

  const mitCalc = site.calculateRig();
  assert.strictEqual(mitCalc.market, 'mit');
  assert.ok(mitCalc.totalUsd > 0);
  assert.strictEqual(mitCalc.totalRub, Math.round(mitCalc.totalUsd * 20.60));

  const savRadio = env.getList('input[name="ferrum-rig-market"]')[1];
  savRadio.checked = true;
  savRadio.trigger('change');
  const savCalc = site.calculateRig();
  assert.strictEqual(savCalc.market, 'sav');
  assert.ok(savCalc.totalUsd > mitCalc.totalUsd);

  env.getEl('#ferrum-chip-select').value = 'GM72V66841CT10-8';
  env.getEl('#ferrum-chip-select').trigger('change');
  assert.ok(env.state.html.includes('ПОДДЕЛКА! ПЕРЕМАРКИРОВАННАЯ PC66'));

  env.getEl('#btn-ferrum-rig-notepad').trigger('click');
  assert.ok(lastNotepadDoc && lastNotepadDoc.title === 'SMETA_25_11_98.TXT');

  env.getEl('#btn-ferrum-rig-save').trigger('click');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\SMETA_25_11_98.TXT'));
});

test('Technical Conference supports viewing threads, posting replies, and creating new threads with HTML escaping', () => {
  const env = createMockContainer(base + '/forum');
  assert.ok(env.state.html.includes('Эха FERRUM.98'));
  assert.ok(env.state.html.includes('FERRUM.MARKET'));
  assert.ok(site.getThreads('all').length >= 6);

  env.getEl('#ferrum-newthread-author').value = 'Tester<script>';
  env.getEl('#ferrum-newthread-title').value = 'Разгон Celeron 300A на плате ASUS P2B';
  env.getEl('#ferrum-newthread-text').value = 'Заклеил пин B21 скотчем, работает на 450 МГц!';
  env.getEl('#btn-ferrum-create-thread').trigger('click');

  assert.ok(env.state.url.includes('/thread?id=user_'));
  assert.ok(env.state.html.includes('Tester&lt;script&gt;'));
  assert.ok(env.state.html.includes('Разгон Celeron 300A на плате ASUS P2B'));
  assert.ok(env.state.html.includes('Мастер_Паяльник'));
  assert.ok(!env.state.html.includes('<script>'));

  const threadEnv = createMockContainer(base + '/thread?id=celeron-300a-oc');
  threadEnv.getEl('#ferrum-reply-author').value = 'Мастер_БХ6<b>';
  threadEnv.getEl('#ferrum-reply-text').value = 'Поднял напряжение до 2.10В, Quake II перестал виснуть на 450 МГц!';
  threadEnv.getEl('#btn-ferrum-send-reply').trigger('click');
  assert.ok(threadEnv.state.html.includes('Мастер_БХ6&lt;b&gt;'));
  assert.ok(threadEnv.state.html.includes('Поднял напряжение до 2.10В'));
});

test('Poll voting, banner rotation, 404 page, and Win-1251 / KOI8-R / Translit encoding switcher work properly', () => {
  const env = createMockContainer(base);
  const beforeVotes = site.getPollState().counts.cel300a;
  env.getEl('#btn-ferrum-poll-vote').trigger('click');
  assert.strictEqual(site.getPollState().counts.cel300a, beforeVotes + 1);

  const beforeBanner = site.bannerIndex;
  env.getEl('#btn-ferrum-next-banner').trigger('click');
  assert.notStrictEqual(site.bannerIndex, beforeBanner);

  const encButtons = env.getList('[data-ferrum-enc]');
  encButtons[2].trigger('click');
  assert.strictEqual(site.getEncoding(), 'translit');
  assert.ok(env.state.html.includes('Sreda, 25 noyabrya 1998'));

  encButtons[0].trigger('click');
  assert.strictEqual(site.getEncoding(), 'win1251');
  assert.ok(env.state.html.includes('Среда, 25 ноября 1998 г.'));

  const notFoundHtml = site.renderSite(base + '/unknown-route-98');
  assert.ok(notFoundHtml.includes('Not Found'));
  assert.ok(notFoundHtml.includes('Apache/1.3.3 Server at www.ferrum98.ru Port 80'));
  assert.ok(!notFoundHtml.includes('ferrum-nav'));
});

test('Clippy Help, Clippy Tips, and Outlook Mail include FerrumLab 98 integrations', () => {
  const helpHits = window.clippyHelp.search('железный цех разгон celeron b21');
  assert.ok(helpHits.some(h => h.entry.id === 'ferrum-site'));
  assert.ok(window.clippyTips.catalog['ferrum-lab']);
  assert.ok(window.OutlookMail.people.some(p => p.addr === 'lab@ferrum98.ru'));
});

test('Every page has its own form: jumper header navigation, protocol head, Q2 console, DOS window, receipt, GoldED messages, lab page', () => {
  const home = site.renderSite(base);
  assert.ok(home.includes('ferrum-jp is-active'));
  assert.ok(home.includes('ferrum-cal-day">26<'));
  assert.ok(home.includes('Журнал испытаний'));
  const art = site.renderSite(base + '/article?id=voodoo3-comdex');
  assert.ok(art.includes('Протокол №'));
  assert.ok(art.includes('47-01'));
  assert.ok(art.includes('ОТК'));
  assert.ok(art.includes('Замечания к протоколу'));
  const thread = site.renderSite(base + '/thread?id=celeron-300a-oc');
  assert.ok(thread.includes('Msg 1 of '));
  assert.ok(thread.includes('From :'));
  assert.ok(thread.includes('25 Nov 98  14:15:00'));
  assert.ok(thread.includes('2:5020/1998.14'));
  assert.ok(thread.includes('* Origin:'));
  const about = site.renderSite(base + '/about');
  assert.ok(about.includes('Сергей Воробьёв'));
  assert.ok(about.includes('Мастер_Паяльник'));
  assert.ok(about.includes('С1-99'));
  assert.ok(about.includes('mailto:lab@ferrum98.ru'));
  assert.strictEqual(site.parseUrl(base + '/lab').page, 'about');
  site.banners.forEach(b => {
    assert.ok(b.title.length <= 42, `Banner title fits 468x60: ${b.title}`);
    assert.ok(b.sub.length <= 46, `Banner sub fits 468x60: ${b.sub}`);
  });
});

test('Board diagram toggles B21 tape and JP1 cap, the header fingers follow the B21 state', () => {
  site.setJumperState({ fsb: 100, b21Taped: true, jp1Protected: true, closeBo31337: true, closeNb12345: true, unbindNetbios139: true });
  const env = createMockContainer(base + '/jumpers');
  assert.ok(env.state.html.includes('B21 (скотч)'));
  env.getList('[data-ferrum-toggle]')[0].trigger('click');
  assert.strictEqual(site.getJumperState().b21Taped, false);
  assert.ok(env.state.html.includes('КОНТАКТ B21 НЕ ИЗОЛИРОВАН'));
  assert.ok(!env.state.html.includes('B21 (скотч)'));
  env.getList('[data-ferrum-toggle]')[1].trigger('click');
  assert.strictEqual(site.getJumperState().jp1Protected, false);
  assert.ok(env.state.html.includes('Win95.CIH'));
  site.setJumperState({ b21Taped: true, jp1Protected: true });
});

test('Status line belongs to the page where the action happened', () => {
  const env = createMockContainer(base + '/bench');
  env.getEl('#btn-ferrum-run-bench').trigger('click');
  assert.ok(env.state.html.includes('Протокол стенда:'));
  const other = site.renderSite(base + '/prices');
  assert.ok(!other.includes('Протокол стенда:'));
});

test('Facts on 25.11.1998: STB deal is only a rumour, Voodoo3 3000 announced at 183 MHz, no anachronistic games, no zener line protection', () => {
  const all = JSON.stringify(window.ferrumData);
  assert.ok(!/купила STB|покупает фабрику STB/.test(all));
  assert.ok(all.includes('183 МГц'));
  assert.ok(!all.includes('166 МГц (V3 3000)'));
  assert.ok(!all.includes('Kingpin'));
  assert.ok(!all.includes('Thief'));
  assert.ok(!all.includes('КС170А'));
  assert.ok(!all.includes('архитекura'));
  assert.ok(!all.includes('EAX 4.0'));
  const sb = site.getArticle('sblive-vs-vortex2');
  assert.ok(!JSON.stringify(sb).includes('Half-Life'), 'Half-Life came out on 19.11, after the 16.11 sound card protocol');
  assert.ok(!read('js/apps/clippy.js').includes('только что купила STB'));
});

test('All 22 protocols link to valid multi-post forum threads and all 21 threads have seeded discussions', () => {
  const allThreads = site.getThreads('all');
  assert.ok(allThreads.length >= 21, `Expected at least 21 threads, found ${allThreads.length}`);

  site.articles.forEach(art => {
    assert.ok(art.threadId, `Article ${art.id} has threadId`);
    const linked = site.getThread(art.threadId);
    assert.ok(linked, `Article ${art.id} links to existing thread ${art.threadId}`);
    assert.ok(linked.posts.length >= 4, `Thread ${linked.id} has at least 4 posts`);
    assert.ok(Array.isArray(window.ferrumData.commentSeeds[art.id]) && window.ferrumData.commentSeeds[art.id].length >= 1, `Article ${art.id} has seeded comments`);
  });

  window.ferrumData.seedThreads.forEach(th => {
    assert.ok(th.posts.length >= 4, `Seed thread ${th.id} has >= 4 posts`);
    th.posts.forEach(m => {
      assert.ok(window.ferrumData.nodes[m.author], `Author ${m.author} in thread ${th.id} has node entry`);
    });
  });
});

test('All routes obey Web 1.0 CSS rules, zero emojis, Microslop/Win naming, and zero comments policy', () => {
  const routes = [
    base,
    base + '/news',
    base + '/news?cat=cpu',
    base + '/news?cat=video',
    base + '/news?cat=mb',
    base + '/news?cat=storage',
    base + '/news?cat=sec',
    base + '/bench',
    base + '/jumpers',
    base + '/prices',
    base + '/forum',
    base + '/about',
    ...site.articles.map(a => `${base}/article?id=${a.id}`),
    ...window.ferrumData.seedThreads.map(t => `${base}/thread?id=${t.id}`)
  ];
  routes.forEach(u => {
    const html = site.renderSite(u);
    assert.ok(!EMOJI.test(html), `No emoji allowed on ${u}`);
    assert.ok(!/\bMicrosoft\b/i.test(html), `No Microsoft allowed on ${u}`);
    assert.ok(!/\bWindows\b/i.test(html), `No Windows allowed on ${u}`);
  });

  const css = read('css/apps/ferrum.css');
  ['border-radius', 'box-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition'].forEach(prop => {
    assert.ok(!css.includes(prop), `Forbidden modern CSS property ${prop} in ferrum.css`);
  });
  assert.ok(!/\/\*|\*\//.test(css), 'Zero comments in ferrum.css');

  ['js/apps/ferrum-site.js', 'js/apps/ferrum-data.js'].forEach(rel => {
    assert.ok(!/\/\*|\*\/|^\s*\/\//m.test(read(rel)), `Zero comments in ${rel}`);
  });

  const testJs = read('tests/ferrum-site.test.js');
  assert.ok(!/\/\*|\*\/|^\s*\/\//m.test(testJs), 'Zero comments in ferrum-site.test.js');
});

console.log(`\nALL ${passed} FERRUMLAB '98 TESTS PASSED!`);
