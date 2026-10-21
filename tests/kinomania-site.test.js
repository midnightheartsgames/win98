const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = { store: {}, getItem(k) { return k in this.store ? this.store[k] : null; }, setItem(k, v) { this.store[k] = String(v); }, removeItem(k) { delete this.store[k]; } };
global.fetch = async () => ({ ok: false });
global.window = {
  addEventListener: () => {},
  location: { href: 'http://localhost:8080/' },
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) }
};

const load = (rel) => eval(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '..', 'js/icons.js'), 'utf8') + '; window.Icons = Icons;');
load('js/apps/retro-sites.js');
load('js/apps/kinomania-site.js');
load('js/apps/ie.js');

const site = window.kinomaniaSite;
const base = 'http://www.kinomania98.ru';
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

test('IE routes every page of the site to it', () => {
  ['', '/premieres', '/article/3', '/thread/2#msg-2', '/forum?cat=vhs', '/forum/new', '/boxoffice', '/zal', '/about'].forEach(p => {
    assert.strictEqual(window.appIE.identifyPageKey(base + p), 'kinomania', p);
  });
  assert.strictEqual(window.appIE.identifyPageKey('http://forum.kinomania98.ru'), 'kinomania');
});

test('the URL alone decides the page', () => {
  const r = (u) => site.parseUrl(u);
  assert.strictEqual(r(base).view, 'home');
  assert.deepStrictEqual([r(base + '/series').view, r(base + '/series').rubric], ['rubric', 'series']);
  assert.deepStrictEqual([r(base + '/article/3').view, r(base + '/article/3').id], ['article', 3]);
  assert.deepStrictEqual([r(base + '/?article=4').view, r(base + '/?article=4').id], ['article', 4]);
  assert.deepStrictEqual([r(base + '/thread/2#msg-2').id, r(base + '/thread/2#msg-2').anchor], [2, 'msg-2']);
  assert.strictEqual(r(base + '/forum?cat=vhs').cat, 'vhs');
  assert.strictEqual(r(base + '/forum?cat=nonsense').cat, 'all');
  assert.strictEqual(r(base + '/forum/new').view, 'newthread');
  assert.strictEqual(r('http://forum.kinomania98.ru').view, 'forum');
  assert.strictEqual(r(base + '/?tab=boxoffice').view, 'boxoffice');
  assert.strictEqual(r(base + '/zal').view, 'zal');
  assert.strictEqual(r(base + '/about').view, 'about');
});

test('a page does not inherit the previous page', () => {
  site.renderSite(base + '/article/1');
  const html = site.renderSite(base + '/thread/3');
  assert.ok(html.includes('В каком переводе «Титаник» лучше на кассетах?'));
  assert.ok(!html.includes('km-standfirst'));
  assert.ok(site.renderSite(base + '/forum').includes('km-tree'));
});

test('the current section is plain text, its pages keep the link', () => {
  const home = site.renderSite(base);
  assert.ok(/<li class="km-menu-here">.*? Главная<\/li>/.test(home));
  assert.ok(!home.includes(`<li><a data-url="${base}">Главная</a></li>`));
  const article = site.renderSite(base + '/article/2');
  assert.ok(article.includes(`<li class="km-menu-open"><a data-url="${base}/series">Сериалы</a></li>`));
});

test('news lists run newest first and mark fresh items', () => {
  const html = site.renderSite(base);
  const ids = [...html.matchAll(/class="km-headline" data-url="http:\/\/www\.kinomania98\.ru\/article\/(\d+)"/g)].map(m => +m[1]);
  assert.deepStrictEqual(ids, [25, 16, 15, 9, 13, 11, 21, 10, 24, 18, 4, 22, 5, 8, 12, 14, 7, 3, 2, 17, 19, 23, 6, 20]);
  assert.strictEqual((html.match(/km-new">NEW!/g) || []).length, 11);
});

test('articles link neighbours, the forum topic and the comments', () => {
  const html = site.renderSite(base + '/article/3');
  assert.ok(html.includes(`data-url="${base}/article/7"`) && html.includes(`data-url="${base}/article/2"`));
  assert.ok(html.includes(`data-url="${base}/thread/4"`));
  assert.ok(html.includes('id="km-comments"'));
  const threads = site.getThreads().map(t => t.id);
  assert.strictEqual(site.articles.length, 25);
  site.articles.forEach(a => {
    const m = site.renderSite(`${base}/article/${a.id}`).match(/Обсудить на форуме: <a data-url="http:\/\/www\.kinomania98\.ru\/thread\/(\d+)"/);
    assert.ok(m && threads.includes(+m[1]), `article ${a.id}`);
  });
});

test('missing pages say so instead of showing another page', () => {
  assert.ok(site.renderSite(base + '/article/99').includes('Страница не найдена'));
  assert.ok(site.renderSite(base + '/thread/99').includes('Страница не найдена'));
});

test('forum index is a reply tree with anchors to each message', () => {
  const html = site.renderSite(base + '/forum');
  assert.ok(html.includes(`data-url="${base}/thread/1#msg-2"`) && html.includes(`data-url="${base}/thread/1#msg-3"`));
  assert.strictEqual(site.getThreads().length, 30);
  const thread = site.renderSite(base + '/thread/1');
  assert.ok(thread.includes('id="km-msg-1"') && thread.includes('id="km-msg-3"') && thread.includes('id="km-reply"'));
  const vhs = site.renderSite(base + '/forum?cat=vhs');
  assert.strictEqual((vhs.match(/class="km-tree-topic"/g) || []).length, 7);
});

test('visitor text is escaped', () => {
  const id = site.addThread('flood', '<img src=x onerror=alert(1)>', '<b>x</b>', '<script>bad()</script> :)');
  site.addReply(2, '<i>y</i>', '<script>bad()</script>');
  site.addComment(1, '<b>x</b>', '<img src=x>');
  const html = site.renderSite(`${base}/thread/${id}`) + site.renderSite(base + '/forum') + site.renderSite(base + '/thread/2') + site.renderSite(base + '/article/1');
  assert.ok(!html.includes('<img src=x') && !html.includes('<script>') && !html.includes('<b>x</b>') && !html.includes('<i>y</i>'));
  assert.ok(id > 1000 && site.getThreads()[0].id === id);
  delete localStorage.store.win98_kinomania_user_v2;
});

test('old saved threads and comments move into the new storage', () => {
  localStorage.setItem('win98_kinomania_threads', JSON.stringify([
    { id: 2, title: 'old', catKey: 'series', posts: [{ author: 'a', text: '1' }, { author: 'b', text: '2' }, { author: 'c', text: '3' }, { author: 'Reader', date: '25.11.1998 11:00', text: 'старый ответ' }] },
    { id: 9, title: 'Моя старая тема', catKey: 'flood', posts: [{ author: 'Reader', date: '25.11.1998 10:00', text: 'привет' }] }
  ]));
  localStorage.setItem('win98_kinomania_comments_1', JSON.stringify([{ text: 'a' }, { text: 'b' }, { text: 'c' }, { author: 'Reader', date: '25.11.1998 12:00', text: 'мой отзыв' }]));
  const threads = site.getThreads();
  const x = threads.find(t => t.id === 2);
  assert.ok(x.title.startsWith('Секретные материалы') && x.posts[x.posts.length - 1].text === 'старый ответ');
  assert.ok(threads.find(t => t.id === 1009 && t.title === 'Моя старая тема'));
  assert.ok(threads.some(t => t.id === 15));
  const comments = site.getComments(1);
  assert.strictEqual(comments[comments.length - 1].text, 'мой отзыв');
  assert.strictEqual(localStorage.getItem('win98_kinomania_threads'), null);
  assert.strictEqual(localStorage.getItem('win98_kinomania_comments_1'), null);
  delete localStorage.store.win98_kinomania_user_v2;
});

test('home counts down to Episode I and has the editorial note', () => {
  const html = site.renderSite(base);
  assert.ok(html.includes('km-count-n">177<'));
  assert.ok(html.includes('От редакции') && html.includes('Зрительский зал'));
});

test('reader reviews and the editorial page', () => {
  const zal = site.renderSite(base + '/zal');
  assert.strictEqual((zal.match(/class="km-review"/g) || []).length, site.reviews.length);
  assert.ok(zal.includes('mailto:editor@kinomania98.ru'));
  const about = site.renderSite(base + '/about');
  assert.ok(about.includes('Кирилл Лосев') && about.includes('1 марта 1997'));
});

test('poll shows results with the reader vote counted', () => {
  assert.ok(site.renderSite(base).includes('id="km-poll-vote"'));
  localStorage.setItem('win98_kinomania_poll_vote', 'matrix');
  const html = site.renderSite(base);
  assert.ok(html.includes('Голосов: 3354') && html.includes('<b>Матрица</b>'));
  delete localStorage.store.win98_kinomania_poll_vote;
});

test('KOI and LAT views recode Cyrillic like a mismatched 1998 browser', () => {
  assert.strictEqual(site.recode('koi', 'Кино'), 'йХМН');
  assert.strictEqual(site.recode('lat', 'Жёлтый Щит'), "Zhyoltyj Schit");
  assert.strictEqual(site.recode('win', 'Кино'), 'Кино');
  assert.strictEqual(site.recode('koi', 'VHS 98'), 'VHS 98');
});

test('pages follow the Web 1.0 and naming rules', () => {
  const pages = [
    '', '/premieres', '/series', '/vhs', '/future', '/boxoffice', '/forum', '/forum/new', '/zal', '/about',
    ...site.articles.map(a => `/article/${a.id}`),
    ...site.getThreads().map(t => `/thread/${t.id}`)
  ];
  pages.forEach(p => {
    const html = site.renderSite(base + p);
    assert.ok(!/\p{Extended_Pictographic}/u.test(html.replace(/[©®™]/g, '')), `emoji on ${p}`);
    assert.ok(!/Microsoft|Windows/.test(html), `naming on ${p}`);
    assert.ok(html.includes('class="km-banner'), `banner on ${p}`);
  });
  const css = fs.readFileSync(path.join(__dirname, '..', 'css/apps/kinomania.css'), 'utf8');
  assert.ok(!/border-radius|blur|rgba|transition|box-shadow/.test(css));
  const js = fs.readFileSync(path.join(__dirname, '..', 'js/apps/kinomania-site.js'), 'utf8');
  assert.ok(!/^\s*\/\/|\/\*/m.test(js));
});

console.log(`kinomania-site: ${passed} tests passed`);
