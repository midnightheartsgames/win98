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
  appNotepad: { open: (title, content) => { lastNotepadDoc = { title, content }; } }
};

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/muzzone-site.js'));
eval(read('js/apps/carman-data.js'));
eval(read('js/apps/carman-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));
eval(read('js/apps/outlook-mail.js'));

const ie = window.appIE;
const site = window.carmanSite;
const data = window.carmanData;
const base = 'http://www.carman99.ru';
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

const routes = ['', '/news', '/news?rubric=История', '/article?id=nazad-v-budushchee', '/albums', '/album?id=karmania', '/atlas', '/atlas?place=london', '/lineup', '/lineup?id=titomir', '/history', '/midi', '/guestbook'];
const norm = t => t.replace(/\s*\[.*$/, '').replace(/\s*\(.*$/, '').toLowerCase().replace(/ё/g, 'е');
const dayNum = d => { const [dd, mm, yy] = d.slice(0, 10).split('.').map(Number); return yy * 10000 + mm * 100 + dd; };
const camel = s => s.replace(/-([a-z])/g, (m, c) => c.toUpperCase());

function env(url) {
  const state = { html: '', inputs: {}, checked: null, handler: null };
  const rootEl = {
    dataset: {},
    addEventListener(evt, fn) { if (evt === 'click') state.handler = fn; },
    querySelector(sel) {
      if (sel === 'input[name="cm-poll"]:checked') return state.checked ? { value: state.checked } : null;
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
    querySelector(sel) { return sel === '.cm-site' ? rootEl : null; }
  };
  const mockIe = {
    currentUrl: url,
    renderPage(w, next) {
      this.currentUrl = next || this.currentUrl;
      state.html = site.renderSite(this.currentUrl);
      const m = state.html.match(/data-cm-path="([^"]*)"/);
      rootEl.dataset = { cmPath: m ? m[1] : '/' };
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
      const needle = `data-cm-${attr}="${value}"`;
      assert.ok(state.html.includes(needle), `button ${needle} is on the page`);
      const dataset = { [camel(`cm-${attr}`)]: String(value) };
      state.handler({ target: { closest: () => ({ dataset }) } });
    }
  };
}

test('index.html loads carman-data.js before carman-site.js and links the stylesheet', () => {
  const html = read('index.html');
  assert.ok(html.includes('css/apps/carman-site.css'));
  const d = html.indexOf('js/apps/carman-data.js');
  const s = html.indexOf('js/apps/carman-site.js');
  assert.ok(d > 0 && s > d);
});

test('IE routes every carman99.ru address by host, lists the site in catalogs, search and the web ring', () => {
  routes.concat(['/songs', '/project', '/nothing-here']).forEach(p => {
    assert.strictEqual(ie.identifyPageKey(base + p), 'carman', p);
  });
  assert.strictEqual(ie.identifyPageKey('http://www.carman99.ru/news?rubric=fido'), 'carman');
  const music = ie.searchDirectory.find(c => c.title === 'Музыка и MP3');
  assert.ok(music && music.sites.some(([u]) => u === base));
  ['кар-мэн', 'лемох', 'титомир', 'лондон гуд-бай', 'кармания', 'поларис'].forEach(q => {
    assert.ok(ie.performSearch(q).some(r => r.url === base), q);
  });
  assert.ok(ie.renderRambler().includes(base));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/search?q=кар-мэн').includes(base));
});

test('every route renders inside the site chrome with its own title; unknown paths give a raw Apache 404', () => {
  routes.forEach(p => {
    const html = site.renderSite(base + p);
    assert.ok(html.includes('class="cm-shell"'), p);
    assert.ok(html.includes('cm-mast'), p);
    assert.ok(!site.getPageTitle(base + p).includes('404'), p);
  });
  assert.ok(site.renderSite(base + '/songs').includes('cm-shelf'));
  assert.ok(site.renderSite(base + '/project').includes('cm-passport'));
  const nf = site.renderSite(base + '/tour99');
  assert.ok(nf.includes('Not Found') && nf.includes('Apache/1.3.9') && !nf.includes('cm-shell'));
  assert.ok(site.renderSite(base + '/article?id=nope').includes('Not Found'));
  assert.ok(site.renderSite(base + '/album?id=nope').includes('Not Found'));
  assert.strictEqual(site.getPageTitle(base + '/album?id=karmania'), "Кар-Мэн '99 :: Кармания (Carmania) (1991)");
});

test('discography matches the real releases: tracklists, labels, dates and credits', () => {
  const ids = data.albums.map(a => a.id);
  assert.deepStrictEqual(ids, ['vokrug-sveta', 'karmania', 'best-of', 'rmza', 'shtuchka', 'polaris', 'korol-diska', 'nazad-v-budushchee', 'zvezdnaya-seriya']);
  const titles = id => site.album(id).tracks.map(t => t[0]);
  assert.strictEqual(titles('vokrug-sveta').length, 10);
  assert.ok(titles('vokrug-sveta').includes('Багама-мама') && titles('vokrug-sveta').includes('Дели'));
  assert.deepStrictEqual(titles('karmania').slice(0, 3), ['Bad Russians', 'В Багдаде всё спокойно', 'Бомбей буги']);
  assert.strictEqual(titles('karmania').length, 9);
  assert.strictEqual(titles('rmza')[0], 'Звуковой агрессор');
  assert.strictEqual(site.album('shtuchka').released, '27 декабря 1996');
  assert.strictEqual(titles('korol-diska').length, 10);
  assert.ok(!titles('korol-diska').some(t => /бомбей|малышка/i.test(t)));
  const nvb = site.album('nazad-v-budushchee');
  assert.strictEqual(nvb.tracks.length, 10);
  assert.ok(nvb.released.includes('декабрь 1999') && nvb.released.includes('010 142-2'));
  assert.ok(nvb.credits.some(([, v]) => v.includes('Роман Рябцев')));
  assert.strictEqual(site.album('zvezdnaya-seriya').tracks.length, 19);
  assert.deepStrictEqual(site.album('zvezdnaya-seriya').tracks.slice(10).map(t => norm(t[0])), nvb.tracks.slice(0, 9).map(t => norm(t[0])));
  data.albums.forEach(a => a.tracks.forEach(([t, d]) => assert.ok(/^\d{1,2}:\d{2}$/.test(d), `${a.id} ${t} ${d}`)));
});

test('the departure board mirrors the remix album and its source albums', () => {
  const nvb = site.album('nazad-v-budushchee');
  assert.strictEqual(data.board.length, nvb.tracks.length);
  data.board.forEach((r, i) => {
    assert.strictEqual(r.no, i + 1);
    assert.strictEqual(r.time, nvb.tracks[i][1]);
    assert.ok(norm(nvb.tracks[i][0]).includes(norm(r.song).replace(/^это /, '')) || norm(nvb.tracks[i][0]) === norm(r.song), r.song);
    if (r.place) assert.ok(site.place(r.place), r.place);
    assert.ok([1997, 1998, 1999].includes(r.rec));
  });
  assert.deepStrictEqual(data.board.filter(r => r.rec === 1997).map(r => r.song), ['Лондон, гуд бай', 'Париж']);
  assert.deepStrictEqual(data.board.filter(r => r.rec === 1999 && r.fromYear).map(r => r.song), ['Это Сан-Франциско', 'Мамайя каннибалз']);
  const html = site.renderSite(base);
  assert.strictEqual((html.match(/class="cm-board-row"/g) || []).length, 10);
  assert.ok(html.includes('data-c="Л"'));
});

test('atlas places point at real songs on real albums and sit on distinct map cells', () => {
  const m = data.map;
  assert.strictEqual(m.rows.length, m.height);
  m.rows.forEach(r => assert.strictEqual(r.length, m.width));
  const cells = new Set();
  data.places.concat(data.offMap).forEach(p => {
    p.songs.forEach(([song, albumId]) => {
      const a = site.album(albumId);
      assert.ok(a, `${p.id} ${albumId}`);
      assert.ok(a.tracks.some(([t]) => norm(t) === norm(song) || norm(t).startsWith(norm(song))), `${song} on ${albumId}`);
    });
  });
  data.places.forEach(p => {
    const { row, col } = site.placeCell(p);
    const key = `${row}:${col}`;
    assert.ok(!cells.has(key), `${p.id} shares a cell`);
    cells.add(key);
  });
  assert.strictEqual(new Set(data.places.map(p => p.mark)).size, data.places.length);
  const html = site.renderSite(base + '/atlas?place=london');
  assert.ok(html.includes('cm-pin-on') && html.includes('Прощай, Лондон') && html.includes('Робин Гуд'));
  assert.strictEqual((html.match(/class="cm-pin[ "]/g) || []).length, data.places.length);
});

test('lineup and history follow the documented chronology', () => {
  data.people.forEach(p => p.spans.forEach(([a, b]) => assert.ok(a >= 1989 && b <= 1999 && a <= b, p.id)));
  const by = id => data.people.find(p => p.id === id);
  assert.deepStrictEqual(by('lemokh').spans, [[1989, 1999]]);
  assert.deepStrictEqual(by('titomir').spans, [[1989, 1991]]);
  assert.deepStrictEqual(by('tarkinsky').spans, [[1991, 1992]]);
  Object.keys(data.dossiers).forEach(id => assert.ok(by(id), id));
  assert.ok(data.dossiers.lemokh.lines.some(([, v]) => v.includes('14 мая 1965')));
  assert.deepStrictEqual(data.history.map(h => h.year), [1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999]);
  assert.ok(data.history.find(h => h.year === 1991).items.some(t => t.includes('12 мая')));
  const lineup = site.renderSite(base + '/lineup?id=titomir');
  assert.ok(lineup.includes('cm-gantt-on') && lineup.includes('Чернигов'));
  assert.ok(site.renderSite(base + '/history').includes('ПАСПОРТ ПУТЕШЕСТВЕННИКА'));
});

test('site texts drop the invented facts of the old version', () => {
  const html = routes.map(p => site.renderSite(base + p)).join('\n') + JSON.stringify(data);
  ['Малышка', 'Полярная станция', 'Подонок', 'Рыбаков', '«Джон»', 'Джуниор', 'ГЦКЗ', 'декабре 1991', 'JP-8000', 'Akai', 'Moroz', 'Мама-анархия', 'Лужник', 'ПРИПЕВ'].forEach(bad => {
    assert.ok(!html.includes(bad), bad);
  });
  const mail = window.OutlookMail.people.find(p => p.addr === 'webmaster@carman99.ru');
  const mailText = JSON.stringify(mail);
  ['ГЦКЗ', 'Джон', 'декабре 1991', 'лето 1999', 'Малышк'].forEach(bad => assert.ok(!mailText.includes(bad), bad));
  ['clippy.js', 'clippy-help.js', 'clippy-tips.js'].forEach(f => {
    const lines = read('js/apps/' + f).split(/\r?\n/).filter(l => l.includes('Кар-Мэн'));
    assert.ok(lines.length, f);
    lines.forEach(l => assert.ok(!/Малышк|Winamp|10-летию|аккорд/.test(l), f));
  });
});

test('news and guestbook dates never run past the site day', () => {
  const today = dayNum(data.siteDay);
  const dates = data.articles.map(a => dayNum(a.date));
  dates.forEach(d => assert.ok(d <= today));
  assert.deepStrictEqual(dates, dates.slice().sort((a, b) => b - a));
  data.guestbook.forEach(g => assert.ok(dayNum(g.date) <= today, g.name));
  Object.values(data.articleComments).flat().forEach(c => assert.ok(dayNum(c[1]) <= today));
  const hist = site.renderSite(base + '/news?rubric=История');
  assert.ok(hist.includes('Десять лет назад') && !hist.includes('добрался до прилавков'));
});

test('article page saves to Notepad and My Documents and keeps escaped reader comments', () => {
  localStorage.store = {};
  const e = env(base + '/article?id=nazad-v-budushchee');
  e.click('notepad', 'article:nazad-v-budushchee');
  assert.strictEqual(lastNotepadDoc.title, 'CARMAN_NAZAD_V_BUDUSHCHEE.TXT');
  assert.ok(lastNotepadDoc.content.includes('010 142-2'));
  e.click('save', 'article:nazad-v-budushchee');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\CARMAN_NAZAD_V_BUDUSHCHEE.TXT'));
  assert.ok(e.html.includes('cm-notice') && e.html.includes('сохранён'));
  e.set('cm-c-name', 'Фан<script>');
  e.set('cm-c-text', 'Турбо микс <b>огонь</b>');
  e.click('comment', 'nazad-v-budushchee');
  assert.ok(e.html.includes('Фан&lt;script&gt;') && e.html.includes('Турбо микс &lt;b&gt;огонь&lt;/b&gt;'));
  assert.ok(!e.html.includes('<script>'));
  assert.strictEqual(JSON.parse(localStorage.store[site.userKey]).comments['nazad-v-budushchee'].length, 1);
  assert.strictEqual(site.comments('nazad-v-budushchee').length, 3);
});

test('album page opens a printable cassette inlay and saves it to disk', () => {
  const e = env(base + '/album?id=nazad-v-budushchee');
  e.click('notepad', 'album:nazad-v-budushchee');
  assert.strictEqual(lastNotepadDoc.title, 'CARMAN_NAZAD_V_BUDUSHCHEE.TXT');
  const lines = lastNotepadDoc.content.split('\r\n').filter(l => l.startsWith('|') || l.startsWith('+'));
  assert.ok(lines.length > 10);
  lines.forEach(l => assert.strictEqual(l.length, 62, l));
  e.click('save', 'album:nazad-v-budushchee');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\CARMAN_NAZAD_V_BUDUSHCHEE.TXT'));
  site.saveDoc('album:karmania');
  assert.ok(vfsFiles.get('My Computer\\C:\\My Documents\\CARMAN_KARMANIA.TXT').includes('Bad Russians'));
  const k = site.renderSite(base + '/album?id=karmania');
  assert.ok(k.includes('/atlas?place=sf') && k.includes('Gala Records'));
});

test('poll accepts one vote per visitor and remembers it', () => {
  localStorage.store = {};
  const e = env(base);
  const before = site.pollState().total;
  e.state.checked = 'sf';
  e.click('poll', '1');
  assert.strictEqual(site.pollState().voted, 'sf');
  assert.strictEqual(site.pollState().total, before + 1);
  assert.ok(e.html.includes('Ваш голос учтён'));
  site.savePollVote('london');
  assert.strictEqual(site.pollState().voted, 'sf');
  site.savePollVote('nonsense');
  assert.strictEqual(site.pollState().total, before + 1);
});

test('guestbook rejects empty posts, escapes new ones and answers by keyword', () => {
  localStorage.store = {};
  const e = env(base + '/guestbook');
  const before = site.allGuestbook().length;
  e.click('gb', '1');
  assert.strictEqual(site.allGuestbook().length, before);
  assert.ok(e.html.includes('пустую запись не сохранить'));
  e.set('cm-gb-name', 'Илья<img src=x>');
  e.set('cm-gb-from', 'Самара');
  e.set('cm-gb-fav', 'karmania');
  e.set('cm-gb-text', 'А Титомир вернётся? <b>!</b>');
  e.click('gb', '1');
  const list = site.allGuestbook();
  assert.strictEqual(list.length, before + 1);
  assert.strictEqual(list[0].fav, 'karmania');
  assert.ok(list[0].reply.includes('Чернигове'));
  assert.ok(e.html.includes('Илья&lt;img src=x&gt;') && e.html.includes('&lt;b&gt;!&lt;/b&gt;'));
  site.addGuestbookEntry({ name: 'X', text: 'привет', fav: 'evil' });
  assert.strictEqual(site.allGuestbook()[0].fav, '');
});

test('old v1 storage is migrated once: user guestbook entries kept, old keys removed', () => {
  localStorage.store = {
    win98_carman_guestbook_v1: JSON.stringify([
      { id: 'gb_user_2_1', name: 'Новый', city: 'Тула', contact: '', text: 'второй' },
      { id: 'gb_user_1_1', name: 'Старый', city: 'Омск', contact: '', text: 'первый' },
      { id: 'gb1', name: 'Seed', city: 'Москва', text: 'seed' }
    ]),
    win98_carman_poll_v1: JSON.stringify({ choice: 'remix99' }),
    win98_carman_songvotes_v1: '{"london":3}',
    'win98_carman_comments_v1_back-to-future-99': '[]'
  };
  const user = site.loadUser();
  assert.deepStrictEqual(user.guestbook.map(g => g.name), ['Старый', 'Новый']);
  assert.strictEqual(user.poll, null);
  ['win98_carman_guestbook_v1', 'win98_carman_poll_v1', 'win98_carman_songvotes_v1', 'win98_carman_comments_v1_back-to-future-99'].forEach(k => assert.ok(!(k in localStorage.store), k));
  assert.ok(site.userKey in localStorage.store);
  assert.strictEqual(site.allGuestbook()[0].name, 'Новый');
});

test('MIDI page plays and stops fan tunes; leaving the site stops the synth', () => {
  const e = env(base + '/midi');
  e.click('midi', 'sakura');
  assert.strictEqual(site.synthPlayingId, 'sakura');
  assert.ok(e.html.includes('SAKURA.MID') && e.html.includes('ИГРАЕТ'));
  e.click('stop', '1');
  assert.strictEqual(site.synthPlayingId, null);
  assert.ok(read('js/apps/ie.js').includes("window.carmanSite.stopSynth()"));
  assert.ok(data.midi.every(m => m.motif.includes('по мотивам') || m.motif.includes('разминка')));
});

test('WIN / KOI / LAT switch recodes page text but keeps markup', () => {
  const e = env(base);
  e.click('enc', 'translit');
  assert.strictEqual(site.encoding, 'translit');
  assert.ok(e.html.includes('Lemokh') && e.html.includes('class="cm-shell"'));
  e.click('enc', 'koi8');
  assert.strictEqual(site.encoding, 'koi8');
  e.click('enc', 'win1251');
  assert.ok(e.html.includes('Лемоха'));
});

test('Clippy help, tips, Clippy page reaction and Outlook correspondent point at existing pages', () => {
  assert.ok(window.clippyHelp.search('кар-мэн лемох').some(h => h.entry.id === 'carman-site'));
  assert.ok(window.clippyTips.catalog['carman-99']);
  const clippy = read('js/apps/clippy.js');
  const urls = (clippy.match(/http:\/\/www\.carman99\.ru\/[a-z?=-]*/g) || []);
  assert.ok(urls.length >= 3);
  urls.forEach(u => assert.ok(!site.renderSite(u).includes('Not Found'), u));
  const mail = window.OutlookMail.people.find(p => p.addr === 'webmaster@carman99.ru');
  assert.ok(mail);
  (JSON.stringify(mail).match(/http:\/\/www\.carman99\.ru[^\s`"'\\]*/g) || []).forEach(u => {
    assert.ok(!site.renderSite(u.replace(/[.,]$/, '')).includes('Not Found'), u);
  });
  assert.ok(read('js/apps/carman-site.js').includes('mailto:webmaster@carman99.ru'));
});

test('Web 1.0 rules: no emoji, Microslop/Win naming, web-safe flat CSS, zero comments', () => {
  routes.forEach(p => {
    const html = site.renderSite(base + p);
    assert.ok(!EMOJI.test(html), p);
    assert.ok(!/\bMicrosoft\b|\bWindows\b/.test(html), p);
  });
  const css = read('css/apps/carman-site.css');
  ['border-radius', 'box-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition', 'display: flex', 'columns:', 'opacity'].forEach(prop => {
    assert.ok(!css.includes(prop), prop);
  });
  const offPalette = [...new Set(css.match(/#[0-9a-f]{6}\b/gi) || [])].filter(h => !/^#([0369cf])\1([0369cf])\2([0369cf])\3$/i.test(h));
  assert.deepStrictEqual(offPalette, []);
  ['css/apps/carman-site.css', 'js/apps/carman-site.js', 'js/apps/carman-data.js'].forEach(f => {
    const src = read(f);
    assert.ok(!/\/\*|\*\//.test(src), f);
    assert.ok(!/^\s*\/\//m.test(src), f);
  });
});

console.log(`\nALL ${passed} CAR-MAN '99 TESTS PASSED!`);
