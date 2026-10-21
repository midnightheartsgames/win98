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
let winampOpened = 0;
const winampAdded = [];
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
  },
  appWinamp: {
    open: () => { winampOpened++; },
    addTrack: (track) => {
      winampAdded.push(track);
      return winampAdded.length - 1;
    },
    play: () => {}
  }
};

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/muzzone-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));
eval(read('js/apps/outlook-mail.js'));

const ie = window.appIE;
const site = window.muzzoneSite;
const base = 'http://www.muzzone98.ru';
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

function createMockContainer(initialUrl) {
  const state = {
    url: initialUrl,
    html: site.renderSite(initialUrl),
    inputs: {},
    texts: {}
  };

  const makeEl = (key, dataset = {}) => {
    const listeners = {};
    return {
      dataset,
      get value() { return state.inputs[key] !== undefined ? state.inputs[key] : ''; },
      set value(v) { state.inputs[key] = v; },
      get textContent() { return state.texts[key] || ''; },
      set textContent(v) { state.texts[key] = v; },
      addEventListener(evt, fn) { listeners[evt] = fn; },
      trigger(evt, eventObj = { preventDefault: () => {} }) {
        if (listeners[evt]) listeners[evt](eventObj);
      }
    };
  };

  const elementsBySel = new Map();
  const listBySel = new Map();

  const registerList = (sel, items) => {
    listBySel.set(sel, items.map(item => makeEl(sel + ':' + JSON.stringify(item), item)));
  };

  const mockIe = {
    currentUrl: initialUrl,
    renderPage(w, url) {
      this.currentUrl = url || this.currentUrl;
      state.url = this.currentUrl;
      state.html = site.renderSite(this.currentUrl);
      rebuild();
      site.attachEvents(w, container, mockIe);
    },
    navigate(w, nextUrl) {
      this.renderPage(w, nextUrl);
    }
  };

  const rebuild = () => {
    elementsBySel.clear();
    listBySel.clear();
    [
      '#mz-btn-next-banner', '#mz-btn-clippy', '#mz-search-btn', '#mz-search-input',
      '#mz-btn-poll-vote', 'input[name="mz_poll_choice"]:checked',
      '#mz-btn-art-notepad', '#mz-btn-art-save', '#mz-art-save-msg',
      '#mz-comment-author', '#mz-comment-text', '#mz-comment-submit',
      '#mz-btn-export-m3u', '#mz-m3u-status',
      '#mz-calc-mins', '#mz-calc-bitrate', '#mz-calc-modem', '#mz-calc-run',
      '#mz-tab-save-msg',
      '#mz-forum-author', '#mz-forum-subj', '#mz-forum-body', '#mz-forum-submit'
    ].forEach(sel => {
      const ds = {};
      if (sel === '#mz-btn-art-notepad' || sel === '#mz-btn-art-save' || sel === '#mz-comment-submit') {
        ds.artId = 'cher-believe-vocoder';
      }
      elementsBySel.set(sel, makeEl(sel, ds));
    });

    registerList('[data-mz-enc]', [{ mzEnc: 'win1251' }, { mzEnc: 'koi8' }, { mzEnc: 'translit' }]);
    registerList('[data-vcr]', [{ vcr: 'rew' }, { vcr: 'ff' }, { vcr: '2' }]);
    registerList('[data-chart-vote]', [{ chartVote: 'c2' }, { chartVote: 'c3' }]);
    registerList('[data-winamp-src]', [{ winampTitle: 'The Offspring - Pretty Fly (1998 Radio Rip)', winampArtist: 'The Offspring', winampSrc: 'content/music/Loadsamoney.mp3' }]);
    registerList('[data-clip-vote]', [{ clipVote: 'pretty-fly', verdict: 'hit' }, { clipVote: 'turn-the-page', verdict: 'trash' }]);
    registerList('[data-rev-rate]', [{ revRate: 'rev-garage', stars: '5' }]);
    registerList('[data-tab-notepad]', [{ tabNotepad: 'tab-mtroll' }]);
    registerList('[data-tab-save]', [{ tabSave: 'tab-mtroll' }]);
    registerList('[data-forum-select]', [{ forumSelect: 'f3' }]);
  };

  const container = {
    get innerHTML() { return state.html; },
    set innerHTML(v) { state.html = v; },
    querySelector(sel) { return elementsBySel.get(sel) || null; },
    querySelectorAll(sel) { return listBySel.get(sel) || []; }
  };

  const win = { id: 'app_ie', element: container };
  rebuild();
  site.attachEvents(win, container, mockIe);

  return {
    state,
    container,
    win,
    mockIe,
    getEl(sel) { return elementsBySel.get(sel); },
    findInList(sel, prop, val) {
      return (listBySel.get(sel) || []).find(el => el.dataset[prop] === val);
    }
  };
}

test('IE routes all MuzZone 98 URLs and preserves mp3vault routing', () => {
  ['', '/news', '/news?cat=rock', '/clips', '/clip?id=pretty-fly', '/charts', '/reviews', '/tabs', '/forum', '/article?id=garage-inc', '/search?q=metallica'].forEach(p => {
    assert.strictEqual(ie.identifyPageKey(base + p), 'muzzone', p);
  });
  assert.strictEqual(ie.identifyPageKey('http://www.mp3vault98.com'), 'mp3vault');
  assert.ok(ie.getPageTitle('muzzone').includes("МузЗона '98"));
});

test('Search directory (Музыка и MP3), Favorites, performSearch, Rambler, Yandex and WebRing include MuzZone 98', () => {
  const musicCat = ie.searchDirectory.find(c => c.title === 'Музыка и MP3');
  assert.ok(musicCat, 'Музыка и MP3 category exists');
  assert.ok(musicCat.sites.some(([u, name]) => u === base && name.includes('МузЗона')));
  assert.ok(ie.performSearch('metallica').some(r => r.url === base));
  assert.ok(ie.performSearch('клип mtv').some(r => r.url === base));
  assert.ok(ie.performSearch('земфира').some(r => r.url === base));
  assert.ok(ie.renderRambler().includes(base));
  assert.ok(ie.renderMp3Vault().includes(base));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/search?q=metallica').includes(base));
});

test('Home page and News rubric filter render November 25, 1998 music news, lead story and cassette masthead', () => {
  const html = site.renderSite(base);
  assert.ok(html.includes('class="mz-cassette"'));
  assert.ok(html.includes("МУЗЗОНА '98"));
  assert.ok(html.includes('Сегодня на 38 ТВК'));
  assert.ok(html.includes('Что нового на сервере'));
  assert.ok(html.includes('Среда, 25 ноября 1998 г.'));
  assert.ok(html.includes('Garage Inc.'));
  assert.ok(html.includes('Pretty Fly (for a White Guy)'));
  assert.ok(html.includes('Два месяца в дециметровом эфире'));
  assert.ok(html.includes('Diamond Rio PMP300'));
  assert.ok(html.includes('Земфира'));
  assert.strictEqual(site.articles.length, 10);

  const rusNews = site.renderSite(base + '/news?cat=rus');
  assert.ok(rusNews.includes('Гранатовый альбом'));
  assert.ok(rusNews.includes('Кассета из Уфы'));
  assert.ok(!rusNews.includes('Diamond Rio PMP300'));
});

test('Full article view renders paragraphs, exports to Notepad/VFS, and saves reader comments with HTML escaping', () => {
  const env = createMockContainer(base + '/article?id=cher-believe-vocoder');
  assert.ok(env.state.html.includes('Тайна «железного голоса» Шер в хите «Believe»'));
  assert.ok(env.state.html.includes('Antares Auto-Tune'));

  env.getEl('#mz-btn-art-notepad').trigger('click');
  assert.ok(lastNotepadDoc && lastNotepadDoc.title === 'CHER_BELIEVE_DSP_98.TXT');

  env.getEl('#mz-btn-art-save').trigger('click');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\CHER_BELIEVE_DSP_98.TXT'));

  env.getEl('#mz-comment-author').value = 'DJ_Groove<script>';
  env.getEl('#mz-comment-text').value = 'Auto-Tune звучит круто! <b>1998</b>';
  env.getEl('#mz-comment-submit').trigger('click');
  assert.ok(env.state.html.includes('DJ_Groove&lt;script&gt;'));
  assert.ok(env.state.html.includes('Auto-Tune звучит круто! &lt;b&gt;1998&lt;/b&gt;'));
  assert.ok(!env.state.html.includes('<script>'));
});

test('Clips section renders 8 MTV video breakdowns with 3-frame ASCII storyboards, voting and Winamp trigger', () => {
  const env = createMockContainer(base + '/clips');
  assert.ok(env.state.html.includes('Видеоклипы и телеэфир'));
  assert.strictEqual((env.state.html.match(/class="mz-clip-card"/g) || []).length, 8);
  assert.ok(env.state.html.includes('Йонас Окерлунд'));
  assert.ok(env.state.html.includes('Уолтер Стерн'));

  const beforeHits = site.getClipVotes('pretty-fly').hits;
  env.findInList('[data-clip-vote]', 'clipVote', 'pretty-fly').trigger('click');
  assert.strictEqual(site.getClipVotes('pretty-fly').hits, beforeHits + 1);

  const detailHtml = site.renderSite(base + '/clip?id=pretty-fly');
  assert.ok(detailHtml.includes('Вы выбрали: ХИТ!'));

  const beforeWinamp = winampOpened;
  env.findInList('[data-winamp-src]', 'winampArtist', 'The Offspring').trigger('click');
  assert.ok(winampOpened > beforeWinamp);
});

test('Charts section renders 12 tracks, supports voting and exports MUZZONE_TOP98.M3U to VFS', () => {
  const env = createMockContainer(base + '/charts');
  assert.ok(env.state.html.includes('Сводный хит-парад «МузЗоны \'98»'));
  assert.strictEqual(site.chartTracks.length, 12);

  env.findInList('[data-chart-vote]', 'chartVote', 'c2').trigger('click');
  assert.ok(env.state.html.includes('(Ваш +)'));

  env.getEl('#mz-btn-export-m3u').trigger('click');
  const m3u = vfsFiles.get('My Computer\\C:\\My Documents\\MUZZONE_TOP98.M3U');
  assert.ok(m3u && m3u.includes('#EXTM3U') && m3u.includes('The Offspring - Pretty Fly'));
});

test('Reviews section renders 6 album reviews with Gorbushka CD inspection and persistent ratings', () => {
  const env = createMockContainer(base + '/reviews');
  assert.ok(env.state.html.includes('Разбор дисков: фирма против Горбушки'));
  assert.ok(env.state.html.includes('mz-vs-pirate'));
  assert.strictEqual(site.reviews.length, 6);

  env.findInList('[data-rev-rate]', 'revRate', 'rev-garage').trigger('click');
  assert.strictEqual(site.getReviewRates()['rev-garage'], 5);
  assert.ok(env.state.html.includes('Ваша оценка диска: 5 из 5!'));
});

test('Tabs & MP3 section saves guitar chord sheets to VFS/Notepad and calculates MP3 size & dial-up time', () => {
  const env = createMockContainer(base + '/tabs');
  assert.ok(env.state.html.includes('Калькулятор MP3-риппера и модема'));
  assert.ok(env.state.html.includes('<span class="mz-chord">'));
  assert.ok(env.state.html.includes('Сплин — «Выхода нет'));
  assert.ok(env.state.html.includes('Мумий Тролль — «Владивосток 2000'));

  env.findInList('[data-tab-notepad]', 'tabNotepad', 'tab-mtroll').trigger('click');
  assert.ok(lastNotepadDoc && lastNotepadDoc.title === 'CHORDS_MTROLL_VLADIVOSTOK2000.TXT');

  env.findInList('[data-tab-save]', 'tabSave', 'tab-mtroll').trigger('click');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\CHORDS_MTROLL_VLADIVOSTOK2000.TXT'));

  env.getEl('#mz-calc-mins').value = '50';
  env.getEl('#mz-calc-bitrate').value = '160';
  env.getEl('#mz-calc-modem').value = '56';
  env.getEl('#mz-calc-run').trigger('click');
  assert.strictEqual(site.calcState.mins, 50);
  assert.strictEqual(site.calcState.bitrate, 160);
  assert.ok(env.state.html.includes('58.6 МБ'));
});

test('Forum supports selecting threads and posting new topics with auto-reply and HTML escaping', () => {
  const env = createMockContainer(base + '/forum');
  assert.ok(env.state.html.includes('Тусовка: музыкальная конференция'));

  env.findInList('[data-forum-select]', 'forumSelect', 'f3').trigger('click');
  assert.strictEqual(site.selectedForumId, 'f3');
  assert.ok(env.state.html.includes('Как поймать MTV Россия на 38-м канале без снега на экране?'));

  env.getEl('#mz-forum-author').value = 'Raver_97<script>';
  env.getEl('#mz-forum-subj').value = 'Чем лучше жать MP3 для Winamp?';
  env.getEl('#mz-forum-body').value = 'Хочу перегнать диск The Prodigy в 128 kbps!';
  env.getEl('#mz-forum-submit').trigger('click');
  assert.ok(env.state.html.includes('Raver_97&lt;script&gt;'));
  assert.ok(env.state.html.includes('Чем лучше жать MP3 для Winamp?'));
  assert.ok(env.state.html.includes('Fraunhofer_128'));
  site.selectedForumId = site.selectedForumId + '_reply';
  assert.ok(site.renderSite(base + '/forum').includes('Fraunhofer IIS'));
  assert.ok(!env.state.html.includes('<script>'));
});

test('Poll voting and Win-1251 / KOI8-R / Translit encoding switcher work properly', () => {
  const env = createMockContainer(base);
  env.getEl('input[name="mz_poll_choice"]:checked').value = 'mp3';
  env.getEl('#mz-btn-poll-vote').trigger('click');
  assert.ok(env.state.html.includes('Ваш голос учтён! Всего голосов:'));

  env.findInList('[data-mz-enc]', 'mzEnc', 'translit').trigger('click');
  assert.strictEqual(site.encoding, 'translit');
  assert.ok(env.state.html.includes('Sreda, 25 noyabrya 1998'));

  env.findInList('[data-mz-enc]', 'mzEnc', 'koi8').trigger('click');
  assert.strictEqual(site.encoding, 'koi8');

  env.findInList('[data-mz-enc]', 'mzEnc', 'win1251').trigger('click');
  assert.strictEqual(site.encoding, 'win1251');
  assert.ok(env.state.html.includes('Среда, 25 ноября 1998 г.'));
});

test('Clippy Help, Clippy Tips, and Outlook Mail include MuzZone 98 integrations', () => {
  const helpHits = window.clippyHelp.search('муззона клипы аккорды');
  assert.ok(helpHits.some(h => h.entry.id === 'muzzone-site'));
  assert.ok(window.clippyTips.catalog['muzzone-mtv']);
  assert.ok(window.OutlookMail.people.some(p => p.addr === 'editor@muzzone98.ru'));
});

test('Clip page plays the storyboard on a TV with VCR buttons and the cassette reels spin after Winamp starts', () => {
  const env = createMockContainer(base + '/clip?id=turn-the-page');
  assert.ok(env.state.html.includes('СЦЕНА 1/3'));
  env.findInList('[data-vcr]', 'vcr', 'ff').trigger('click');
  assert.deepStrictEqual(site.vcr, { clipId: 'turn-the-page', frame: 1 });
  assert.ok(env.state.html.includes('СЦЕНА 2/3'));
  assert.ok(env.state.html.includes('Параллельный монтаж'));
  env.findInList('[data-vcr]', 'vcr', 'ff').trigger('click');
  env.findInList('[data-vcr]', 'vcr', 'ff').trigger('click');
  assert.strictEqual(site.vcr.frame, 2);
  env.findInList('[data-vcr]', 'vcr', 'rew').trigger('click');
  assert.strictEqual(site.vcr.frame, 1);
  assert.ok(site.renderSite(base + '/clip?id=pretty-fly').includes('СЦЕНА 1/3'));
  assert.ok(site.renderSite(base + '/clip?id=nope').includes('Кассета не найдена'));

  site.tapePlaying = false;
  assert.ok(!site.renderSite(base).includes('is-playing'));
  env.findInList('[data-winamp-src]', 'winampArtist', 'The Offspring').trigger('click');
  assert.ok(site.renderSite(base).includes('mz-cassette is-playing'));
});

test('All routes obey Web 1.0 CSS rules, zero emojis, Microslop/Win naming, and zero comments policy', () => {
  const routes = [
    base,
    base + '/news',
    base + '/clips',
    base + '/clip?id=pretty-fly',
    base + '/charts',
    base + '/reviews',
    base + '/tabs',
    base + '/forum',
    base + '/article?id=garage-inc',
    base + '/search?q=metallica'
  ];
  routes.forEach(u => {
    const html = site.renderSite(u);
    assert.ok(!EMOJI.test(html), `No emoji allowed on ${u}`);
    assert.ok(!/\bMicrosoft\b/i.test(html), `No Microsoft allowed on ${u}`);
    assert.ok(!/\bWindows\b/i.test(html), `No Windows allowed on ${u}`);
  });

  const css = read('css/apps/muzzone.css');
  ['border-radius', 'box-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition'].forEach(prop => {
    assert.ok(!css.includes(prop), `Forbidden modern CSS property ${prop} in muzzone.css`);
  });
  assert.ok(!/\/\*|\*\//.test(css), 'Zero comments in muzzone.css');
  const offPalette = [...new Set(css.match(/#[0-9a-f]{6}\b/gi) || [])].filter(h => !/^#([0369cf])\1([0369cf])\2([0369cf])\3$/i.test(h));
  assert.deepStrictEqual(offPalette, [], 'muzzone.css uses only the 216 web-safe colours');

  const js = read('js/apps/muzzone-site.js');
  assert.ok(!/\/\*|\*\/|^\s*\/\//m.test(js), 'Zero comments in muzzone-site.js');
});

console.log(`\nALL ${passed} MUZZONE '98 TESTS PASSED!`);
