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
  appWinamp: { open: () => {}, addTrack: t => winampTracks.push(t) - 1, play: () => {} }
};

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/muzzone-site.js'));
eval(read('js/apps/kish-data.js'));
eval(read('js/apps/kish-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));
eval(read('js/apps/outlook-mail.js'));

const ie = window.appIE;
const site = window.kishSite;
const data = window.kishData;
const base = 'http://www.kish99.ru';
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

const routes = ['', '/news', '/article?id=geroi-i-zlodei-studio', '/albums', '/album?id=akustik', '/tales', '/tales?place=cliff', '/bestiary', '/chords', '/chords?id=tab-kukla', '/tabs', '/lineup', '/lineup?id=balu', '/midi', '/guestbook'];
const dayNum = d => { const [dd, mm, yy] = d.slice(0, 10).split('.').map(Number); return yy * 10000 + mm * 100 + dd; };
const camel = s => s.replace(/-([a-z])/g, (m, c) => c.toUpperCase());

function env(url) {
  const state = { html: '', inputs: {}, checked: null, handler: null };
  const rootEl = {
    dataset: {},
    addEventListener(evt, fn) { if (evt === 'click') state.handler = fn; },
    querySelector(sel) {
      if (sel === 'input[name="ks-poll"]:checked') return state.checked ? { value: state.checked } : null;
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
    querySelector(sel) { return sel === '.ks-site' ? rootEl : null; }
  };
  const mockIe = {
    currentUrl: url,
    renderPage(w, next) {
      this.currentUrl = next || this.currentUrl;
      state.html = site.renderSite(this.currentUrl);
      const m = state.html.match(/data-ks-path="([^"]*)"/);
      rootEl.dataset = { ksPath: m ? m[1] : '/' };
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
      const needle = `data-ks-${attr}="${value}"`;
      assert.ok(state.html.includes(needle), `button ${needle} is on the page`);
      const dataset = { [camel(`ks-${attr}`)]: String(value) };
      state.handler({ target: { closest: () => ({ dataset }) } });
    }
  };
}

test('index.html loads kish-data.js before kish-site.js and links the stylesheet', () => {
  const html = read('index.html');
  assert.ok(html.includes('css/apps/kish-site.css'));
  const d = html.indexOf('js/apps/kish-data.js');
  const s = html.indexOf('js/apps/kish-site.js');
  assert.ok(d > 0 && s > d);
});

test('IE routes every kish99.ru address by host, lists the site in catalogs, search and the web ring', () => {
  routes.concat(['/nothing-here']).forEach(p => {
    assert.strictEqual(ie.identifyPageKey(base + p), 'kish', p);
  });
  const music = ie.searchDirectory.find(c => c.title === 'Музыка и MP3');
  assert.ok(music && music.sites.some(([u]) => u === base));
  ['король и шут', 'горшок', 'трактир', 'кукла колдуна', 'акустический альбом'].forEach(q => {
    assert.ok(ie.performSearch(q).some(r => r.url === base), q);
  });
  assert.ok(ie.renderRambler().includes(base));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/search?q=король и шут').includes(base));
});

test('every route renders inside the site chrome; unknown paths give a raw Apache 404', () => {
  routes.forEach(p => {
    const html = site.renderSite(base + p);
    assert.ok(html.includes('class="ks-shell"'), p);
    assert.ok(html.includes('ks-mast'), p);
    assert.ok(!site.getPageTitle(base + p).includes('404'), p);
  });
  const nf = site.renderSite(base + '/tour99');
  assert.ok(nf.includes('Not Found') && nf.includes('Apache/1.3.9') && !nf.includes('ks-shell'));
  assert.ok(site.renderSite(base + '/article?id=nope').includes('Not Found'));
  assert.ok(site.renderSite(base + '/album?id=nope').includes('Not Found'));
});

test('discography lists real albums with tracklists and printable details', () => {
  const ids = data.albums.map(a => a.id);
  ['istinny-ubiytsa', 'lyubov-negodyaya', 'kamnem', 'putnik', 'akustik', 'muzhiki'].forEach(id => assert.ok(ids.includes(id), id));
  data.albums.forEach(a => {
    assert.ok(a.tracks.length >= 5, a.id);
    a.tracks.forEach(([t, d]) => assert.ok(/^\d{1,2}:\d{2}$/.test(d), `${a.id} ${t} ${d}`));
  });
  const html = site.renderSite(base + '/albums');
  data.albums.forEach(a => assert.ok(html.includes(a.title.replace(/&/g, '&amp;')) || html.includes(a.id), a.id));
});

test('bestiary map places each hero on its own cell and links songs to real albums', () => {
  const m = data.forestMap;
  assert.strictEqual(m.rows.length, m.height);
  m.rows.forEach(r => assert.strictEqual(r.length, m.width));
  const cells = new Set();
  data.tales.forEach(p => {
    const key = `${p.row}:${p.col}`;
    assert.ok(!cells.has(key), `${p.id} shares a cell`);
    cells.add(key);
    p.songs.forEach(([, albumId]) => assert.ok(site.album(albumId), `${p.id} ${albumId}`));
    if (p.tabId) assert.ok(site.songTab(p.tabId), p.tabId);
  });
  assert.strictEqual(new Set(data.tales.map(p => p.mark)).size, data.tales.length);
  const html = site.renderSite(base + '/tales?place=cliff');
  assert.ok(html.includes('ks-pin-on'));
  assert.strictEqual((html.match(/class="ks-pin[ "]/g) || []).length, data.tales.length);
});

test('lineup spans stay inside 1988-1999 and dossiers belong to known members', () => {
  data.people.forEach(p => p.spans.forEach(([a, b]) => assert.ok(a >= 1988 && b <= 1999 && a <= b, p.id)));
  Object.keys(data.dossiers).forEach(id => assert.ok(data.people.some(p => p.id === id), id));
  assert.ok(site.renderSite(base + '/lineup?id=balu').includes('ks-dossier'));
});

test('news, comments and guestbook dates never run past the site day', () => {
  const today = dayNum(data.siteDay);
  const dates = data.articles.map(a => dayNum(a.date));
  dates.forEach(d => assert.ok(d <= today));
  assert.deepStrictEqual(dates, dates.slice().sort((a, b) => b - a));
  data.guestbook.forEach(g => assert.ok(dayNum(g.date) <= today, g.name));
  Object.values(data.articleComments).flat().forEach(c => assert.ok(dayNum(c[1]) <= today));
});

test('article page saves to Notepad and My Documents and keeps escaped reader comments', () => {
  localStorage.store = {};
  const id = data.articles[0].id;
  const e = env(`${base}/article?id=${id}`);
  e.click('notepad', `article:${id}`);
  assert.strictEqual(lastNotepadDoc.title, data.articles[0].file);
  assert.ok(lastNotepadDoc.content.includes(data.articles[0].title));
  e.click('save', `article:${id}`);
  assert.ok(vfsFiles.has(`My Computer\\C:\\My Documents\\${data.articles[0].file}`));
  assert.ok(e.html.includes('ks-notice'));
  const before = site.comments(id).length;
  e.set('ks-c-name', 'Панк<script>');
  e.set('ks-c-text', 'Хой <b>всем</b>');
  e.click('comment', id);
  assert.ok(e.html.includes('Панк&lt;script&gt;') && e.html.includes('Хой &lt;b&gt;всем&lt;/b&gt;'));
  assert.ok(!e.html.includes('<script>'));
  assert.strictEqual(site.comments(id).length, before + 1);
});

test('album page opens a fixed-width cassette inlay and saves it to disk', () => {
  const e = env(base + '/album?id=akustik');
  e.click('notepad', 'album:akustik');
  assert.strictEqual(lastNotepadDoc.title, 'KISH_AKUSTIK.TXT');
  const lines = lastNotepadDoc.content.split('\r\n').filter(l => l.startsWith('|') || l.startsWith('+'));
  assert.ok(lines.length > 10);
  lines.forEach(l => assert.strictEqual(l.length, 62, l));
  e.click('save', 'album:akustik');
  assert.ok(vfsFiles.get('My Computer\\C:\\My Documents\\KISH_AKUSTIK.TXT').includes(site.album('akustik').tracks[0][0]));
});

test('songbook transposes chords by a tone and exports the current key', () => {
  const spec = data.songbook[0];
  site.transposeSemis = 0;
  const original = site.chordText(spec);
  const e = env(`${base}/chords?id=${spec.id}`);
  e.click('transpose', '-2');
  assert.strictEqual(site.transposeSemis, -2);
  const lower = site.chordText(spec);
  assert.notStrictEqual(lower, original);
  e.click('transpose', '0');
  assert.strictEqual(site.chordText(spec), original);
  e.click('save', `chord:${spec.id}`);
  assert.ok(vfsFiles.has(`My Computer\\C:\\My Documents\\${spec.file}`));
  e.click('notepad', `chord:${spec.id}`);
  assert.strictEqual(lastNotepadDoc.title, spec.file);
  site.transposeSemis = 0;
});

test('poll accepts one vote per visitor and remembers it', () => {
  localStorage.store = {};
  const e = env(base);
  const before = site.pollState().total;
  e.state.checked = 'akustik';
  e.click('poll', '1');
  assert.strictEqual(site.pollState().voted, 'akustik');
  assert.strictEqual(site.pollState().total, before + 1);
  site.savePollVote('kamnem');
  assert.strictEqual(site.pollState().voted, 'akustik');
  site.savePollVote('nonsense');
  assert.strictEqual(site.pollState().total, before + 1);
});

test('guestbook rejects empty posts, escapes new ones and answers by keyword', () => {
  localStorage.store = {};
  const e = env(base + '/guestbook');
  const before = site.allGuestbook().length;
  e.click('gb', '1');
  assert.strictEqual(site.allGuestbook().length, before);
  e.set('ks-gb-name', 'Илья<img src=x>');
  e.set('ks-gb-from', 'Самара');
  e.set('ks-gb-fav', 'kamnem');
  e.set('ks-gb-text', 'Когда выйдет «Герои и злодеи»? <b>!</b>');
  e.click('gb', '1');
  const list = site.allGuestbook();
  assert.strictEqual(list.length, before + 1);
  assert.strictEqual(list[0].fav, 'kamnem');
  assert.ok(list[0].reply.includes('2000'));
  assert.ok(e.html.includes('Илья&lt;img src=x&gt;') && e.html.includes('&lt;b&gt;!&lt;/b&gt;'));
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
  assert.ok(read('js/apps/ie.js').includes('window.kishSite.stopSynth()'));
});

test('WIN / KOI / LAT switch recodes page text but keeps markup', () => {
  const e = env(base);
  e.click('enc', 'translit');
  assert.strictEqual(site.encoding, 'translit');
  assert.ok(/Korol/i.test(e.html) && e.html.includes('class="ks-shell"'));
  e.click('enc', 'koi8');
  assert.strictEqual(site.encoding, 'koi8');
  e.click('enc', 'win1251');
  assert.ok(e.html.includes('Король'));
});

test('Clippy help, tips and Outlook correspondent point at existing pages', () => {
  assert.ok(window.clippyHelp.search('король и шут горшок').some(h => h.entry.id === 'kish-site'));
  assert.ok(window.clippyTips.catalog['kish-99']);
  const mail = window.OutlookMail.people.find(p => p.addr === 'webmaster@kish99.ru');
  assert.ok(mail);
  (JSON.stringify(mail).match(/http:\/\/www\.kish99\.ru[^\s`"'\\]*/g) || []).forEach(u => {
    assert.ok(!site.renderSite(u.replace(/[.,]$/, '')).includes('Not Found'), u);
  });
  assert.ok(read('js/apps/kish-site.js').includes('mailto:webmaster@kish99.ru'));
});

test('Web 1.0 rules: no emoji, Microslop/Win naming, flat CSS, zero comments', () => {
  routes.forEach(p => {
    const html = site.renderSite(base + p);
    assert.ok(!EMOJI.test(html), p);
    assert.ok(!/\bMicrosoft\b|\bWindows\b/.test(html), p);
  });
  const css = read('css/apps/kish-site.css');
  ['border-radius', 'box-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition', 'display: flex', 'columns:', 'opacity'].forEach(prop => {
    assert.ok(!css.includes(prop), prop);
  });
  ['css/apps/kish-site.css', 'js/apps/kish-site.js', 'js/apps/kish-data.js'].forEach(f => {
    const src = read(f);
    assert.ok(!/\/\*|\*\//.test(src), f);
    assert.ok(!/^\s*\/\//m.test(src), f);
  });
});

console.log(`\nALL ${passed} KING AND JESTER '99 TESTS PASSED!`);
