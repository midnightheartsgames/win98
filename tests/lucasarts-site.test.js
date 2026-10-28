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
let lastCd = null;
let lastLaunch = null;
const vfsFiles = new Map();
const installed = new Set(['sammax']);
const owned = new Set(['sammax', 'quest']);

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

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
  appNotepad: { open: (title, content) => { lastNotepad = { title, content }; } },
  gameManager: {
    addListener: () => {},
    isInstalled: id => installed.has(id),
    ownsOnSteam: id => owned.has(id),
    isPurchased: id => owned.has(id),
    showInSteam: id => { lastSteam = id; },
    showOnCd: id => { lastCd = id; },
    isCdDemo: id => /_demo$/.test(id),
    catalog: {}
  }
};

const gmSource = read('js/game-manager.js');
eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/lucasarts-data.js'));
eval(read('js/apps/lucasarts-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));
eval(read('js/apps/outlook-mail.js'));

const ie = window.appIE;
const site = window.lucasartsSite;
const data = window.lucasartsData;
const base = 'http://www.lucasarts.com';
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

const catalogField = (id, field) => {
  const start = gmSource.indexOf(`\n      ${id}: {`);
  assert.ok(start > 0, `game-manager entry ${id}`);
  const chunk = gmSource.slice(start, start + 4000);
  const m = chunk.match(new RegExp(`${field}: '([^']*)'`));
  return m ? m[1] : null;
};

function parseElements(html) {
  const els = [];
  const tagRe = /<([a-zA-Z]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:="[^"]*")?)*)\s*\/?>/g;
  let m;
  while ((m = tagRe.exec(html))) {
    const attrs = {};
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:="([^"]*)")?/g;
    let a;
    while ((a = attrRe.exec(m[2]))) attrs[a[1]] = a[2] === undefined ? '' : a[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const dataset = {};
    Object.keys(attrs).filter(k => k.startsWith('data-')).forEach(k => {
      dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = attrs[k];
    });
    const listeners = {};
    els.push({
      tag: m[1].toLowerCase(),
      attrs,
      dataset,
      value: attrs.value || '',
      textContent: '',
      addEventListener(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
      fire(evt) { (listeners[evt] || []).forEach(fn => fn({ preventDefault() {}, key: 'Enter' })); }
    });
  }
  return els;
}

function matches(el, sel) {
  if (sel.startsWith('#')) return el.attrs.id === sel.slice(1);
  const input = sel.match(/^input\[name="([^"]+)"\]:checked$/);
  if (input) return el.tag === 'input' && el.attrs.name === input[1] && 'checked' in el.attrs;
  const attr = sel.match(/^\[([-a-z]+)\]$/);
  if (attr) return attr[1] in el.attrs;
  throw new Error('Unsupported selector ' + sel);
}

function browse(url) {
  const env = { url, html: '', els: [] };
  const container = {
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
      site.attachEvents(w, container, mockIe);
    },
    navigate(w, next) { this.renderPage(w, next); }
  };
  mockIe.renderPage({ id: 'app_ie' }, url);
  env.ie = mockIe;
  env.find = (sel, key, val) => {
    const list = container.querySelectorAll(sel);
    const el = key ? list.find(e => e.dataset[key] === val) : list[0];
    assert.ok(el, `element ${sel} ${key || ''}=${val || ''} on ${env.url}`);
    return el;
  };
  env.click = (sel, key, val) => env.find(sel, key, val).fire('click');
  return env;
}

const allRoutes = () => {
  const routes = ['', '/games', '/games?series=s1', '/news', '/hints', '/hints?menu=s1', '/hints?menu=s2', '/scumm', '/letters', '/letters?to=sammax', '/search', '/search?q=линкольн'];
  data.games.forEach(g => routes.push(`/game?id=${g.id}`));
  data.articles.forEach(a => routes.push(`/article?id=${a.id}`));
  Object.keys(data.hintBook).forEach(id => {
    routes.push(`/hints?game=${id}`);
    data.hintBook[id].puzzles.forEach((p, i) => routes.push(`/hints?game=${id}&q=${i + 1}`));
  });
  return routes.map(r => base + r);
};

test('IE routes every LucasArts URL to the site and shows its title', () => {
  allRoutes().forEach(u => assert.strictEqual(ie.identifyPageKey(u), 'lucasarts', u));
  assert.ok(ie.getPageTitle('lucasarts').includes('LucasArts Entertainment Company'));
});

test('Search engines, Favorites, Yandex and the web ring list LucasArts', () => {
  const gamesCat = ie.searchDirectory.find(c => c.title === 'Компьютерные игры');
  assert.ok(gamesCat.sites.some(([u]) => u === base));
  assert.ok(ie.performSearch('lucasarts').some(r => r.url === base));
  assert.ok(ie.performSearch('scumm').some(r => r.url === base));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/search?q=lucasarts').includes(base));
});

test('Game data matches the catalog: Steam games with prices, Igromania CD demos without', () => {
  const siteIds = ['quest', 'sammax', 'sammax102', 'sammax103', 'sammax104', 'sammax105', 'sammax106', 'sammax201', 'sammax202', 'kotor98'];
  const demos = { quest: 'quest_demo', sammax202: 'sammax202_demo', kotor98: 'kotor98_demo' };
  assert.deepStrictEqual(data.games.map(g => g.id).sort(), siteIds.slice().sort());
  data.games.forEach(g => {
    const gmId = g.demo || g.id;
    assert.strictEqual(g.demo, demos[g.id], `demo ${g.id}`);
    assert.strictEqual(g.title, catalogField(gmId, 'title'), `title ${g.id}`);
    assert.strictEqual(g.exe, catalogField(gmId, 'targetExe'), `exe ${g.id}`);
    if (g.demo) {
      assert.strictEqual(g.price, undefined, `no price ${g.id}`);
      assert.strictEqual(g.setup, 'D:\\demo\\' + catalogField(gmId, 'setupExe'), `setup ${g.id}`);
      assert.ok(gmSource.slice(gmSource.indexOf(`\n      ${gmId}: {`), gmSource.indexOf(`\n      ${gmId}: {`) + 200).includes('cdDemo: true'), `cdDemo ${g.id}`);
      assert.ok(fs.existsSync(path.join(root, `content/igromania/demos/${gmId}-1.jpg`)) && fs.existsSync(path.join(root, `content/igromania/demos/${gmId}-2.jpg`)), `shots ${g.id}`);
    } else {
      assert.strictEqual(g.price, catalogField(gmId, 'priceDisplay'), `price ${g.id}`);
      assert.ok(fs.existsSync(path.join(root, `content/steam/${g.id}-1.jpg`)) && fs.existsSync(path.join(root, `content/steam/${g.id}-2.jpg`)), `shots ${g.id}`);
    }
    assert.ok(data.series.some(s => s.id === g.series), `series ${g.id}`);
    assert.strictEqual(g.shots.length, 2);
  });
});

test('Facts that once were wrong stay fixed', () => {
  const quest = data.games.find(g => g.id === 'quest');
  const questText = JSON.stringify([quest, data.hintBook.quest]);
  ['Mug of Hot Java', 'Admin Floppy Disk', 'Copper Wire', 'Win98 Boot CD', 'Rubber Chicken', 'Retro Quest Games'].forEach(w => assert.ok(questText.includes(w), w));
  assert.ok(!/кабел|серебрян|ключ от подвала/i.test(questText), 'no invented cable or silver key puzzles');
  const kotor = JSON.stringify(data.games.find(g => g.id === 'kotor98'));
  assert.ok(!/Дантуин|HK-47|Коррибан/.test(kotor), 'KOTOR 98 is the Taris chapter only');
  const all = JSON.stringify(data);
  assert.ok(!all.includes('Байтпвуд'), 'one spelling of Guybrush');
  assert.ok(!all.includes('UHS'), 'old hint desk name removed');
});

test('Home page is a clickable street scene with text links and a dated news list', () => {
  const env = browse(base);
  ['/news', '/games', '/scumm', '/letters', '/hints', '/games?series=s1'].forEach(p => assert.ok(env.html.includes(`data-la-go="${p}"`), p));
  ['/games', '/news', '/hints', '/scumm', '/letters', '/search'].forEach(p => assert.ok(env.html.includes(`data-url="${base}${p}"`), p));
  assert.ok(env.html.includes('Что нового на сайте'));
  assert.ok(env.html.includes('NEW!'));
  const sentence = env.find('#la-sentence');
  env.find('[data-la-say]', 'laGo', '/hints').fire('mouseover');
  assert.strictEqual(sentence.textContent, 'Позвонить на линию подсказок');
  env.click('[data-la-go]', 'laGo', '/hints');
  assert.strictEqual(env.url, base + '/hints');
});

test('Catalog shows Steam state for Steam games and the Igromania CD for demos', () => {
  const env = browse(base + '/games');
  assert.ok(env.html.includes('Установлено'));
  assert.ok(env.html.includes('Купить в Steam'));
  assert.ok(env.html.includes('$30.49'));
  assert.ok(!env.html.includes('$42.99') && !env.html.includes('$19.99') && !env.html.includes('$30.99'), 'demos have no price');
  assert.ok(!env.html.includes('data-steam-id="kotor98"') && !env.html.includes('data-steam-id="quest"') && !env.html.includes('data-steam-id="sammax202"'), 'demos have no Steam button');
  assert.ok(env.html.includes('content/igromania/demos/kotor98_demo-1.jpg'));
  env.click('[data-steam-id]', 'steamId', 'sammax201');
  assert.strictEqual(lastSteam, 'sammax201');
  env.click('[data-cd-id]', 'cdId', 'kotor98_demo');
  assert.strictEqual(lastCd, 'kotor98_demo');
  installed.add('quest_demo');
  const env2 = browse(base + '/games');
  assert.ok(env2.html.includes('data-launch-id="quest_demo"'));
  assert.ok(!env2.html.includes('data-cd-id="quest_demo"'));
  env2.click('[data-launch-id]', 'launchId', 'quest_demo');
  assert.strictEqual(lastCd, 'quest_demo', 'launch of a demo without launch() falls back to the CD dialog');
  installed.delete('quest_demo');
  env.click('[data-launch-id]', 'launchId', 'sammax');
  assert.strictEqual(lastSteam, 'sammax', 'launch of a game without launch() falls back to Steam');
  window.gameManager.catalog.sammax = { launch: () => { lastLaunch = 'sammax'; } };
  env.click('[data-launch-id]', 'launchId', 'sammax');
  assert.strictEqual(lastLaunch, 'sammax');
  const s1 = site.renderSite(base + '/games?series=s1');
  assert.ok(s1.includes('Culture Shock') && !s1.includes('Moai Better Blues'));
});

test('Game box page swaps screenshots and links to its hints', () => {
  const env = browse(base + '/game?id=sammax202');
  assert.ok(env.html.includes('content/igromania/demos/sammax202_demo-1.jpg'));
  assert.ok(env.html.includes(`${base}/hints?game=sammax202`));
  assert.ok(env.html.includes('Системные требования'));
  assert.ok(env.html.includes('D:\\demo\\sammax202demo.exe'));
  assert.ok(env.html.includes('data-cd-id="sammax202_demo"'));
  assert.ok(!/steam/i.test(env.html.replace(/class="[^"]*"/g, '')), 'demo box page does not mention Steam');
  env.click('[data-shot-game]', 'shotIdx', '1');
  assert.strictEqual(site.activeShot.sammax202, 1);
  assert.ok(env.html.includes('class="la-shot-big" src="content/igromania/demos/sammax202_demo-2.jpg"'));
  const santa = site.renderSite(base + '/game?id=sammax201');
  assert.ok(santa.includes('content/steam/sammax201-1.jpg') && santa.includes('Купить в Steam'));
});

test('The Adventurer lists three issues, opens articles, exports them and keeps escaped replies', () => {
  const news = site.renderSite(base + '/news');
  data.articles.forEach(a => assert.ok(news.includes(`/article?id=${a.id}`), a.id));
  data.articles.forEach(a => assert.ok(data.issues.some(i => i.no === a.issue), a.id));
  const env = browse(base + '/article?id=moai-release');
  assert.ok(env.html.includes('la-dropcap'));
  env.click('#la-btn-art-notepad');
  assert.strictEqual(lastNotepad.title, 'ADV17_MOAI.TXT');
  env.click('#la-btn-art-save');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\ADV17_MOAI.TXT'));
  env.find('#la-reply-author').value = 'Max<script>';
  env.find('#la-reply-text').value = 'Отлично! <b>1998</b>';
  env.click('#la-reply-submit');
  assert.ok(env.html.includes('Max&lt;script&gt;'));
  assert.ok(env.html.includes('Отлично! &lt;b&gt;1998&lt;/b&gt;'));
  assert.ok(!env.html.includes('<script>'));
});

test('Reader poll counts one vote and remembers it', () => {
  const env = browse(base + '/news');
  env.click('#la-btn-poll-vote');
  assert.ok(env.html.includes('ваш голос учтён'));
  assert.strictEqual(site.pollData().voted, 'chicken');
  site.votePoll('goggles');
  assert.strictEqual(site.pollData().voted, 'chicken');
});

test('Hint line: keypad walks the menus and reveals tiers one at a time', () => {
  const env = browse(base + '/hints');
  assert.ok(env.html.includes('1-900-740-JEDI'));
  env.click('[data-la-key]', 'laKey', '3');
  assert.strictEqual(env.url, base + '/hints?menu=s2');
  env.click('[data-la-key]', 'laKey', '1');
  assert.strictEqual(env.url, base + '/hints?game=sammax201');
  env.click('[data-la-key]', 'laKey', '1');
  assert.strictEqual(env.url, base + '/hints?game=sammax201&q=1');
  assert.ok(!env.html.includes('Почему глупцы влюбляются'), 'solution hidden before asking');
  env.click('[data-la-key]', 'laKey', '1');
  env.click('[data-la-key]', 'laKey', '1');
  assert.ok(!env.html.includes('Почему глупцы влюбляются'));
  env.click('[data-la-key-link]', 'laKeyLink', '1');
  assert.strictEqual(site.unlocked().sm201_1, 3);
  assert.ok(env.html.includes('Почему глупцы влюбляются'));
  assert.ok(!env.html.includes('data-la-key-link'), 'no reveal option after the last tier');
  env.click('[data-la-key]', 'laKey', '#');
  assert.strictEqual(lastNotepad.title, 'HINTS_SAMMAX201.TXT');
  env.click('#la-btn-hint-save');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\HINTS_SAMMAX201.TXT'));
  env.click('[data-la-key]', 'laKey', '0');
  assert.strictEqual(env.url, base + '/hints?game=sammax201');
  env.click('[data-la-key]', 'laKey', '*');
  assert.strictEqual(env.url, base + '/hints');
});

test('Every hint book has three tiers per question and fits the phone keypad', () => {
  Object.entries(data.hintBook).forEach(([id, book]) => {
    assert.ok(data.games.some(g => g.id === id), id);
    assert.ok(book.puzzles.length >= 3 && book.puzzles.length <= 9, id);
    book.puzzles.forEach(p => assert.strictEqual(p.tiers.length, 3, p.id));
  });
  const ids = Object.values(data.hintBook).flatMap(b => b.puzzles.map(p => p.id));
  assert.strictEqual(new Set(ids).size, ids.length);
  const menuGames = data.hintMenus.flatMap(m => m.games || [m.game]);
  assert.deepStrictEqual(menuGames.slice().sort(), Object.keys(data.hintBook).sort());
});

test('SCUMM lab: the build can be handed in with verbs, items and room objects', () => {
  site.resetLab();
  const env = browse(base + '/scumm');
  env.click('[data-lab-obj]', 'labObj', 'pc');
  assert.ok(site.lab.say.length > 0);
  env.click('[data-lab-item]', 'labItem', 'disk');
  env.click('[data-lab-obj]', 'labObj', 'pc');
  assert.ok(site.lab.say.includes('завис'));
  env.click('[data-lab-verb]', 'labVerb', 'Использовать');
  env.click('[data-lab-item]', 'labItem', 'mug');
  assert.ok(env.html.includes('id="la-sentence">Использовать Пустая кружка с<'));
  env.click('[data-lab-obj]', 'labObj', 'coffee');
  assert.ok(site.lab.inv.includes('java'));
  env.click('[data-lab-verb]', 'labVerb', 'Дать');
  env.click('[data-lab-item]', 'labItem', 'java');
  env.click('[data-lab-obj]', 'labObj', 'tester');
  assert.ok(site.lab.awake);
  env.click('[data-lab-verb]', 'labVerb', 'Толкать');
  env.click('[data-lab-obj]', 'labObj', 'pc');
  assert.ok(site.lab.rebooted);
  env.click('[data-lab-item]', 'labItem', 'disk');
  env.click('[data-lab-obj]', 'labObj', 'pc');
  assert.ok(site.lab.done);
  assert.ok(env.html.includes('Билд принят в тестирование'));
  env.click('#la-lab-reset');
  assert.ok(!site.lab.done && site.lab.inv.includes('disk'));
  env.click('[data-lab-verb]', 'labVerb', 'Открыть');
  env.click('[data-lab-obj]', 'labObj', 'shelf');
  env.click('[data-lab-verb]', 'labVerb', 'Взять');
  env.click('[data-lab-obj]', 'labObj', 'shelf');
  assert.ok(site.lab.inv.includes('colander'));
  env.click('[data-lab-obj]', 'labObj', 'door');
  assert.strictEqual(env.url, base);
});

test('SCUMM lab answers every verb on every object and item without errors', () => {
  site.resetLab();
  site.verbs.forEach(v => {
    Object.keys(site.labObjects).forEach(o => {
      site.lab.verb = v;
      site.lab.a = '';
      const res = site.labClick('obj', o);
      assert.ok(res && (res.go || typeof res.text === 'string'), `${v} ${o}`);
    });
    ['chicken', 'disk', 'mug'].forEach(item => {
      Object.keys(site.labObjects).forEach(o => {
        site.resetLab();
        site.lab.verb = v;
        site.labClick('item', item);
        const res = site.labClick('obj', o);
        assert.ok(res && (res.go || typeof res.text === 'string'), `${v} ${item} ${o}`);
      });
    });
  });
  site.resetLab();
});

test('Letters: filter, submit with escaping, deterministic in-character reply', () => {
  const env = browse(base + '/letters');
  env.find('#la-letter-to').value = 'sammax';
  env.find('#la-letter-from').value = 'Detective<script>';
  env.find('#la-letter-q').value = 'Где мигалка от Де Сото?';
  env.click('#la-letter-submit');
  assert.ok(env.html.includes('Detective&lt;script&gt;'));
  assert.ok(env.html.includes('Где мигалка от Де Сото?'));
  assert.ok(!env.html.includes('<script>'));
  const mine = site.allLetters()[0];
  assert.ok(data.autoReplies.sammax.some(r => JSON.stringify(r) === JSON.stringify(mine.a)));
  const onlyGuybrush = site.renderSite(base + '/letters?to=guybrush');
  assert.ok(onlyGuybrush.includes('резиновая курица') && !onlyGuybrush.includes('Где мигалка'));
  assert.strictEqual(site.submitLetter('sammax', 'x', '   '), null);
});

test('Site search finds games, articles and hint questions', () => {
  const hits = site.search('линкольн');
  assert.ok(hits.some(h => h.url.includes('/game?id=sammax104')));
  assert.ok(hits.some(h => h.url.includes('/article?id=lincoln-debate')));
  assert.ok(hits.some(h => h.url.includes('/hints?game=sammax104')));
  const env = browse(base);
  const page = browse(base + '/search');
  page.find('#la-search-page-input').value = 'курица';
  page.click('#la-search-page-btn');
  assert.strictEqual(page.url, base + '/search?q=' + encodeURIComponent('курица'));
  assert.ok(page.html.includes('найдено'));
  assert.ok(env.html.includes('la-scene'));
});

test('Clippy help, tips and Outlook describe the current site', () => {
  const helpHits = window.clippyHelp.search('lucasarts сэм и макс scumm');
  assert.ok(helpHits.some(h => h.entry.id === 'lucasarts-site'));
  assert.ok(window.clippyTips.catalog['lucasarts-scumm']);
  assert.ok(window.OutlookMail.people.some(p => p.addr === 'adventurer@lucasarts.com'));
  ['js/apps/clippy.js', 'js/apps/clippy-help.js', 'js/apps/clippy-tips.js', 'js/apps/outlook-mail.js', 'js/apps/ie.js', 'js/apps/retro-sites.js'].forEach(f => {
    assert.ok(!/UHS|Байтпвуд|подъёмного моста/.test(read(f)), f);
  });
});

test('Web 1.0 rules: no emoji, Microslop and Win naming, no modern CSS, zero comments', () => {
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  allRoutes().forEach(u => {
    const html = site.renderSite(u);
    assert.ok(!EMOJI.test(html), `emoji on ${u}`);
    assert.ok(!/\bMicrosoft\b/i.test(html), `Microsoft on ${u}`);
    assert.ok(!/\bWindows\b/i.test(html), `Windows on ${u}`);
    assert.ok(!html.includes('undefined') && !html.includes('NaN'), `bad value on ${u}`);
  });
  const css = read('css/apps/lucasarts-site.css');
  ['border-radius', 'box-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition', 'animation'].forEach(p => {
    assert.ok(!css.includes(p), `forbidden ${p}`);
  });
  assert.ok(!/\/\*|\*\//.test(css));
  ['js/apps/lucasarts-site.js', 'js/apps/lucasarts-data.js'].forEach(f => {
    assert.ok(!/\/\*|\*\/|^\s*\/\//m.test(read(f)), `comments in ${f}`);
  });
  const index = read('index.html');
  assert.ok(index.indexOf('js/apps/lucasarts-data.js') > 0 && index.indexOf('js/apps/lucasarts-data.js') < index.indexOf('js/apps/lucasarts-site.js'));
});

console.log(`\nALL ${passed} LUCASARTS TESTS PASSED`);
