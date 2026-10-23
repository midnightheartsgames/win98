const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

let lastNotepadDoc = null;
const vfsFiles = new Map();
const winampTracks = [];
let winampOpened = 0;

global.window = {
  isOnline: true,
  addEventListener: () => {},
  webGif: name => `<span class="gif-${name}"></span>`,
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) },
  vfs: {
    mkdir: () => {},
    writeFile: (folder, name, content) => { vfsFiles.set(folder.join('\\') + '\\' + name, content); return true; }
  },
  appNotepad: { open: (title, content) => { lastNotepadDoc = { title, content }; } },
  appWinamp: { open: () => { winampOpened++; }, addTrack: t => winampTracks.push(t) - 1, play: () => {} }
};

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/muzzone-site.js'));
eval(read('js/apps/prodigy-data.js'));
eval(read('js/apps/prodigy-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));
eval(read('js/apps/outlook-mail.js'));

const ie = window.appIE;
const site = window.prodigySite;
const data = window.prodigyData;
const base = 'http://www.prodigy99.ru';
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

const routes = ['', '/news', '/article?id=castbreeder-gorbushka', '/albums', '/album?id=fat', '/album?id=fat&track=1', '/pirates', '/pirates?id=dealing', '/antifaq', '/sampler', '/sampler?id=smp-voodoo', '/manezhka', '/manezhka?sector=roof', '/midi', '/lineup', '/lineup?id=liam', '/guestbook'];
const dayNum = d => { const [dd, mm, yy] = d.slice(0, 10).split('.').map(Number); return yy * 10000 + mm * 100 + dd; };
const camel = s => s.replace(/-([a-z])/g, (m, c) => c.toUpperCase());

function env(url) {
  const state = { html: '', inputs: {}, checked: null, handler: null };
  const rootEl = {
    dataset: {},
    addEventListener(evt, fn) { if (evt === 'click') state.handler = fn; },
    querySelector(sel) {
      if (sel === 'input[name="prd-poll"]:checked') return state.checked ? { value: state.checked } : null;
      if (sel.startsWith('#')) {
        const id = sel.slice(1);
        if (!state.html.includes(`id="${id}"`)) return null;
        return {
          get value() { return state.inputs[id] || ''; },
          set value(v) { state.inputs[id] = v; }
        };
      }
      return null;
    },
    querySelectorAll() { return []; }
  };
  const container = {
    scrollTop: 0,
    querySelector(sel) { return sel === '.prd-site' ? rootEl : null; }
  };
  const mockIe = {
    currentUrl: url,
    renderPage(w, next) {
      this.currentUrl = next || this.currentUrl;
      state.html = site.renderSite(this.currentUrl);
      const m = state.html.match(/data-prd-path="([^"]*)"/);
      rootEl.dataset = { prdPath: m ? m[1] : '/' };
      state.handler = null;
      site.attachEvents({}, container, mockIe);
    }
  };
  mockIe.renderPage({}, url);
  return {
    state,
    get html() { return state.html; },
    set(id, v) { state.inputs[id] = v; },
    click(attr, value) {
      const needle = `data-prd-${attr}="${value}"`;
      assert.ok(state.html.includes(needle), `button ${needle} is on the page`);
      const dataset = { [camel(`prd-${attr}`)]: String(value) };
      state.handler({ target: { closest: () => ({ dataset }) } });
    }
  };
}

test('index.html loads prodigy-data.js before prodigy-site.js and links the stylesheet', () => {
  const html = read('index.html');
  assert.ok(html.includes('css/apps/prodigy-site.css'));
  const d = html.indexOf('js/apps/prodigy-data.js');
  const s = html.indexOf('js/apps/prodigy-site.js');
  assert.ok(d > 0 && s > d);
});

test('IE routes every prodigy99.ru address by host, lists the site in catalogs, search and the web ring', () => {
  routes.concat(['/nothing-here']).forEach(p => {
    assert.strictEqual(ie.identifyPageKey(base + p), 'prodigy', p);
  });
  const music = ie.searchDirectory.find(c => c.title === 'Музыка и MP3');
  assert.ok(music && music.sites.some(([u]) => u === base));
  ['prodigy', 'хоулетт', 'castbreeder', 'манежка', 'smack my bitch up'].forEach(q => {
    assert.ok(ie.performSearch(q).some(r => r.url === base), q);
  });
  assert.ok(ie.renderRambler().includes(base));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/search?q=prodigy').includes(base));
});

test('every route renders inside the site chrome; unknown paths give a raw Apache 404', () => {
  routes.forEach(p => {
    const html = site.renderSite(base + p);
    assert.ok(html.includes('class="prd-shell"'), p);
    assert.ok(html.includes('prd-mast'), p);
    assert.ok(!site.getPageTitle(base + p).includes('404'), p);
  });
  const nf = site.renderSite(base + '/tour99');
  assert.ok(nf.includes('Not Found') && nf.includes('Apache/1.3.9') && !nf.includes('prd-shell'));
  assert.ok(site.renderSite(base + '/article?id=nope').includes('Not Found'));
  assert.ok(site.renderSite(base + '/album?id=nope').includes('Not Found'));
});

test('discography lists the real albums with tracklists', () => {
  const ids = data.albums.map(a => a.id);
  ['experience', 'jilted', 'fat', 'dirtchamber'].forEach(id => assert.ok(ids.includes(id), id));
  data.albums.forEach(a => {
    assert.ok(a.tracks.length >= 5, a.id);
    a.tracks.forEach(t => assert.ok(/^\d{1,2}:\d{2}$/.test(t.duration), `${a.id} ${t.title} ${t.duration}`));
  });
  const html = site.renderSite(base + '/albums');
  data.albums.forEach(a => assert.ok(html.includes(a.id), a.id));
  const lyrics = data.albums.find(a => a.id === 'fat').tracks.find(t => t.lyrics);
  assert.ok(site.renderSite(`${base}/album?id=fat&track=${lyrics.num}`).includes('prd-lyrics'));
  assert.ok(!site.renderSite(`${base}/album?id=fat`).includes('prd-lyrics'));
});

test('rave board and track pages link to real albums and samples', () => {
  data.raveBoard.forEach(r => assert.ok(site.album(r.albumId), r.id));
  assert.ok(site.renderSite(base).includes('/sampler?id=smp-voodoo'));
  assert.ok(site.renderSite(`${base}/album?id=jilted`).includes('/sampler?id=smp-voodoo'));
});

test('Manezhka map puts every sector on its own cell inside the grid', () => {
  const m = data.manezhkaMap;
  const cells = new Set();
  m.sectors.forEach(s => {
    assert.ok(s.x >= 0 && s.x < m.width && s.y >= 0 && s.y < m.height, s.id);
    const key = `${s.x}:${s.y}`;
    assert.ok(!cells.has(key), `${s.id} shares a cell`);
    cells.add(key);
  });
  const html = site.renderSite(base + '/manezhka?sector=roof');
  assert.ok(html.includes('prd-pin-on'));
  assert.strictEqual((html.match(/class="prd-pin[ "]/g) || []).length, m.sectors.length);
  const e = env(base + '/manezhka');
  e.click('notepad', 'manezhka:1');
  assert.strictEqual(lastNotepadDoc.title, 'MANEZHKA_97.TXT');
  assert.ok(lastNotepadDoc.content.includes(m.setlist[0].title));
  e.click('save', 'manezhka:1');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\MANEZHKA_97.TXT'));
});

test('news, comments and guestbook dates never run past the site day', () => {
  const today = dayNum(data.siteDay);
  const dates = data.articles.map(a => dayNum(a.date));
  dates.forEach(d => assert.ok(d <= today));
  assert.deepStrictEqual(dates, dates.slice().sort((a, b) => b - a));
  data.guestbook.forEach(g => assert.ok(dayNum(g.date) <= today, g.name));
  Object.values(data.articleComments).flat().forEach(c => assert.ok(dayNum(c.date) <= today));
});

test('article page saves to Notepad and My Documents and keeps escaped reader comments', () => {
  localStorage.store = {};
  const art = data.articles[0];
  const e = env(`${base}/article?id=${art.id}`);
  e.click('notepad', `article:${art.id}`);
  assert.strictEqual(lastNotepadDoc.title, site.articleFile(art));
  assert.ok(lastNotepadDoc.content.includes(art.title));
  e.click('save', `article:${art.id}`);
  assert.ok(vfsFiles.has(`My Computer\\C:\\My Documents\\${site.articleFile(art)}`));
  assert.ok(e.html.includes('prd-notice'));
  const before = site.comments(art.id).length;
  e.set('prd-c-name', 'Рейвер<script>');
  e.set('prd-c-text', 'Fire <b>всем</b>');
  e.click('comment', art.id);
  assert.ok(e.html.includes('Рейвер&lt;script&gt;') && e.html.includes('Fire &lt;b&gt;всем&lt;/b&gt;'));
  assert.ok(!e.html.includes('<script>'));
  assert.strictEqual(site.comments(art.id).length, before + 1);
});

test('album page opens a fixed-width cassette inlay and saves it to disk', () => {
  const e = env(base + '/album?id=fat');
  e.click('notepad', 'album:fat');
  assert.strictEqual(lastNotepadDoc.title, 'PRD_JC_FAT.TXT');
  const lines = lastNotepadDoc.content.split('\r\n').filter(l => l.startsWith('|') || l.startsWith('+'));
  assert.ok(lines.length > 10);
  lines.forEach(l => assert.strictEqual(l.length, 62, l));
  e.click('save', 'album:fat');
  assert.ok(vfsFiles.get('My Computer\\C:\\My Documents\\PRD_JC_FAT.TXT').includes(site.album('fat').tracks[0].title));
});

test('pirate detector hides the real author until the track is analysed, then remembers it', () => {
  localStorage.store = {};
  const fake = data.pirateFakes[0];
  const e = env(`${base}/pirates?id=${fake.id}`);
  const card = html => html.slice(html.indexOf('prd-scan-body'), html.indexOf('class="prd-fakes"'));
  const table = html => html.slice(html.indexOf('class="prd-fakes"'), html.indexOf('data-prd-notepad'));
  assert.ok(!card(e.html).includes(fake.realArtist) && !table(e.html).includes(fake.realArtist));
  assert.ok(card(e.html).includes('???'));
  e.click('scan', fake.id);
  assert.ok(card(e.html).includes(fake.realArtist) && card(e.html).includes(fake.realTitle) && card(e.html).includes('FAKE'));
  assert.deepStrictEqual(site.scannedIds(), [fake.id]);
  site.scanFake(fake.id);
  site.scanFake('nonsense');
  assert.strictEqual(site.scannedIds().length, 1);
  data.pirateFakes.forEach(f => site.scanFake(f.id));
  const all = env(base + '/pirates');
  assert.ok(all.html.includes('Диплом антипирата'));
  all.click('notepad', 'pirates:all');
  assert.strictEqual(lastNotepadDoc.title, 'PRD_ANTIFAKE.TXT');
  data.pirateFakes.forEach(f => assert.ok(lastNotepadDoc.content.includes(f.realArtist), f.id));
  all.click('save', 'pirates:all');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\PRD_ANTIFAKE.TXT'));
});

test('sampler records up to sixteen pad hits, clears them and exports the beat', () => {
  localStorage.store = {};
  const e = env(base + '/sampler');
  ['bass', 'break', 'acid', 'siren'].forEach(k => e.click('pad', k));
  assert.deepStrictEqual(site.loadUser().pattern, ['bass', 'break', 'acid', 'siren']);
  for (let i = 0; i < 20; i++) e.click('pad', 'bass');
  assert.strictEqual(site.loadUser().pattern.length, 16);
  site.playPad('nonsense');
  assert.strictEqual(site.loadUser().pattern.length, 16);
  e.click('playpat', '1');
  assert.strictEqual(site.synthPlayingId, 'pattern');
  e.click('stop', '1');
  assert.strictEqual(site.synthPlayingId, null);
  e.click('notepad', 'beat:1');
  assert.strictEqual(lastNotepadDoc.title, 'PRD_BEAT.TXT');
  assert.ok(lastNotepadDoc.content.includes('BASSLINE'));
  e.click('save', 'beat:1');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\PRD_BEAT.TXT'));
  e.click('clearpat', '1');
  assert.strictEqual(site.loadUser().pattern.length, 0);
});

test('sampler page explains every sample and sends tracks and playlists to Winamp', () => {
  data.samples.forEach(s => {
    assert.ok(s.sources.length >= 2, s.id);
    assert.ok(site.renderSite(`${base}/sampler?id=${s.id}`).includes(site.esc(s.sources[0].original)), s.id);
  });
  const e = env(base + '/sampler');
  assert.ok(e.html.includes('http://skins.winamp.com'));
  const first = data.raveBoard[0];
  const before = winampTracks.length;
  e.click('winamp', first.id);
  assert.strictEqual(winampTracks.length, before + 1);
  assert.ok(winampTracks[before].title.includes(first.title));
  e.click('m3u', '1');
  const m3u = vfsFiles.get('My Computer\\C:\\My Documents\\PRODIGY_RAVE.M3U');
  assert.ok(m3u.startsWith('#EXTM3U'));
  assert.strictEqual((m3u.match(/#EXTINF/g) || []).length, data.raveBoard.length);
  assert.ok(winampOpened > 0);
});

test('poll accepts one vote per visitor and remembers it', () => {
  localStorage.store = {};
  const e = env(base);
  const before = site.pollState().total;
  e.state.checked = 'fat';
  e.click('poll', '1');
  assert.strictEqual(site.pollState().voted, 'fat');
  assert.strictEqual(site.pollState().total, before + 1);
  site.savePollVote('jilted');
  assert.strictEqual(site.pollState().voted, 'fat');
  site.savePollVote('nonsense');
  assert.strictEqual(site.pollState().total, before + 1);
});

test('guestbook rejects empty posts, escapes new ones and answers by keyword', () => {
  localStorage.store = {};
  const e = env(base + '/guestbook');
  const before = site.allGuestbook().length;
  e.click('gb', '1');
  assert.strictEqual(site.allGuestbook().length, before);
  e.set('prd-gb-name', 'Ант<img src=x>');
  e.set('prd-gb-from', 'Тверь');
  e.set('prd-gb-fav', data.favAlbums[1]);
  e.set('prd-gb-text', 'Купил Castbreeder на Горбушке <b>!</b>');
  e.click('gb', '1');
  const list = site.allGuestbook();
  assert.strictEqual(list.length, before + 1);
  assert.strictEqual(list[0].fav, data.favAlbums[1]);
  assert.ok(list[0].reply.includes('Анти-Фейк'));
  assert.ok(e.html.includes('Ант&lt;img src=x&gt;') && e.html.includes('&lt;b&gt;!&lt;/b&gt;'));
  site.addGuestbookEntry({ name: 'X', text: 'привет', fav: 'evil' });
  assert.strictEqual(site.allGuestbook()[0].fav, '');
});

test('MIDI page plays and stops tunes; leaving the site stops the synth', () => {
  const e = env(base + '/midi');
  const id = data.midi[0].id;
  e.click('midi', id);
  assert.strictEqual(site.synthPlayingId, id);
  e.click('stop', '1');
  assert.strictEqual(site.synthPlayingId, null);
  assert.ok(read('js/apps/ie.js').includes('window.prodigySite.stopSynth()'));
});

test('WIN / KOI / LAT switch recodes page text but keeps markup', () => {
  const e = env(base);
  e.click('enc', 'translit');
  assert.strictEqual(site.encoding, 'translit');
  assert.ok(/Dobro pozhalovat/i.test(e.html) && e.html.includes('class="prd-shell"'));
  e.click('enc', 'koi8');
  assert.strictEqual(site.encoding, 'koi8');
  e.click('enc', 'win1251');
  assert.ok(e.html.includes('Добро пожаловать'));
});

test('Clippy help, tips and Outlook correspondent point at existing pages', () => {
  assert.ok(window.clippyHelp.search('prodigy castbreeder').some(h => h.entry.id === 'prodigy-site'));
  assert.ok(window.clippyTips.catalog['prodigy-99']);
  const mail = window.OutlookMail.people.find(p => p.addr === 'webmaster@prodigy99.ru');
  assert.ok(mail);
  (JSON.stringify(mail).match(/http:\/\/www\.prodigy99\.ru[^\s`"'\\]*/g) || []).forEach(u => {
    assert.ok(!site.renderSite(u.replace(/[.,]$/, '')).includes('Not Found'), u);
  });
  assert.ok(read('js/apps/prodigy-site.js').includes('mailto:webmaster@prodigy99.ru'));
});

test('Web 1.0 rules: no emoji, Microslop/Win naming, flat CSS, zero comments', () => {
  routes.forEach(p => {
    const html = site.renderSite(base + p);
    assert.ok(!EMOJI.test(html), p);
    assert.ok(!/\bMicrosoft\b|\bWindows\b/.test(html), p);
  });
  const css = read('css/apps/prodigy-site.css');
  ['border-radius', 'box-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition', 'display: flex', 'columns:', 'opacity'].forEach(prop => {
    assert.ok(!css.includes(prop), prop);
  });
  ['css/apps/prodigy-site.css', 'js/apps/prodigy-site.js', 'js/apps/prodigy-data.js'].forEach(f => {
    const src = read(f);
    assert.ok(!/\/\*|\*\//.test(src), f);
    assert.ok(!/^\s*\/\//m.test(src), f);
  });
});

console.log(`\nALL ${passed} PRODIGY '99 TESTS PASSED!`);
