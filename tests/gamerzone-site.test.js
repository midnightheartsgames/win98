const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
global.localStorage = { store: {}, getItem(k) { return k in this.store ? this.store[k] : null; }, setItem(k, v) { this.store[k] = String(v); }, removeItem(k) { delete this.store[k]; } };
global.fetch = async () => ({ ok: false });
global.window = {
  addEventListener: () => {},
  location: { href: 'http://localhost:8080/' },
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) }
};

const load = (rel) => eval(fs.readFileSync(path.join(root, rel), 'utf8'));
eval(fs.readFileSync(path.join(root, 'js/icons.js'), 'utf8') + '; window.Icons = Icons;');
load('js/apps/retro-sites.js');
load('js/apps/kinomania-site.js');
load('js/apps/gamerzone-site.js');
load('js/apps/ie.js');

const site = window.gamerzoneSite;
const base = 'http://forum.games98.com';
const key = (d) => d.replace(/^(\d\d)\.(\d\d)\.(\d{4}) (\d\d):(\d\d)$/, '$3$2$1$4$5');
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

test('IE routes every forum page here, whatever words the address contains', () => {
  ['', '/forum?id=codes', '/forum?id=hard', '/forum?id=steam', '/thread?id=43', '/post?forum=sim'].forEach(p => {
    assert.strictEqual(window.appIE.identifyPageKey(base + p), 'forum', p);
  });
});

test('the address alone picks the page', () => {
  assert.strictEqual(site.parseUrl(base).view, 'index');
  assert.deepStrictEqual(site.parseUrl(base + '/forum?id=rpg'), { view: 'forum', forum: 'rpg' });
  assert.strictEqual(site.parseUrl(base + '/forum?id=nope').view, 'missing');
  assert.deepStrictEqual(site.parseUrl(base + '/thread?id=24#post-3'), { view: 'thread', id: 24, anchor: 'post-3' });
  assert.deepStrictEqual(site.parseUrl(base + '/post?forum=codes'), { view: 'post', forum: 'codes' });
});

test('seed threads are well formed', () => {
  const ids = new Set();
  site.threads.forEach(t => {
    assert.ok(!ids.has(t.id), `duplicate id ${t.id}`);
    ids.add(t.id);
    assert.ok(site.forums.some(f => f.key === t.forum), `forum of ${t.id}`);
    assert.ok(t.posts.length >= 1);
    t.posts.forEach(([author, date, text], i) => {
      assert.ok(site.users[author], `${author} in the cast`);
      assert.ok(/^\d\d\.\d\d\.1998 \d\d:\d\d$/.test(date), `date ${date}`);
      assert.ok(text && text.length > 2);
      if (i) assert.ok(key(date) >= key(t.posts[i - 1][1]), `posts of ${t.id} go forward in time`);
      assert.ok(key(date) <= '199812032359', `post ${t.id}/${i} is not from the future`);
    });
  });
  assert.ok(site.threads.length >= 40);
  site.forums.forEach(f => assert.ok(site.threads.filter(t => t.forum === f.key).length >= 3, f.key));
});

test('the board index lists every section with counts and fresh posts', () => {
  const html = site.renderSite(base);
  site.forums.forEach(f => assert.ok(html.includes(`${base}/forum?id=${f.key}`), f.key));
  assert.ok(html.includes('Свежие сообщения'));
});

test('sections put pinned topics first and every topic opens', () => {
  const codes = site.renderSite(base + '/forum?id=codes');
  assert.ok(codes.indexOf('Важно:') < codes.indexOf('F7 - это что'));
  site.getThreads().forEach(t => {
    const html = site.renderSite(`${base}/thread?id=${t.id}`);
    assert.ok(html.includes('id="gz-post-1"'), `thread ${t.id}`);
    assert.strictEqual(html.includes('id="gz-reply-send"'), !t.locked, `reply form of ${t.id}`);
  });
  assert.ok(site.renderSite(base + '/thread?id=999').includes('Такой темы'));
});

test('replies and new topics are stored apart from the seed text', () => {
  const n = site.addReply(1, 'Tester', 'привет :)');
  assert.strictEqual(n, site.getThreads().find(t => t.id === 1).posts.length);
  assert.strictEqual(site.addReply(4, 'Tester', 'в закрытую'), 0);
  const id = site.addThread('codes', 'Моя тема', 'Tester', 'текст');
  assert.ok(id > 1000);
  const mine = site.getThreads().find(t => t.id === id);
  assert.strictEqual(mine.forum, 'codes');
  assert.strictEqual(mine.posts[0].posts, 2);
  const saved = JSON.parse(localStorage.getItem('win98_forum_user_v2'));
  assert.ok(saved.replies[1].length === 1 && saved.threads.length === 1);
  delete localStorage.store.win98_forum_user_v2;
});

test('old saved forum moves into the new storage', () => {
  localStorage.setItem('win98_forum_threads', JSON.stringify([
    { id: 4, title: 'old', category: 'Железо и Модемы', posts: [{ author: 'Overclock_98', text: 'x' }, { author: 'Me', date: '05.10.1998 10:00', text: 'мой ответ' }] },
    { id: 9, title: 'Моя тема', category: 'Стратегии', views: 3, posts: [{ author: 'Me', date: '05.10.1998 11:00', text: 'привет' }] }
  ]));
  const threads = site.getThreads();
  const four = threads.find(t => t.id === 4);
  assert.strictEqual(four.posts[four.posts.length - 1].text, 'мой ответ');
  const mine = threads.find(t => t.id === 1009);
  assert.ok(mine && mine.forum === 'strategy' && mine.title === 'Моя тема');
  assert.strictEqual(threads.find(t => t.id === 9).forum, 'hall');
  assert.strictEqual(localStorage.getItem('win98_forum_threads'), null);
  delete localStorage.store.win98_forum_user_v2;
});

test('visitor text is escaped', () => {
  const id = site.addThread('hall', '<img src=x onerror=alert(1)>', '<b>x</b>', '<script>bad()</script>');
  const html = site.renderSite(`${base}/thread?id=${id}`) + site.renderSite(base + '/forum?id=hall') + site.renderSite(base);
  assert.ok(!html.includes('<img src=x') && !html.includes('<script>') && !html.includes('<b>x</b>'));
  delete localStorage.store.win98_forum_user_v2;
});

test('pages follow the Web 1.0 and naming rules', () => {
  const pages = ['', '/forum?id=hall', '/forum?id=codes', '/thread?id=9', '/thread?id=42', '/post'];
  pages.forEach(p => {
    const html = site.renderSite(base + p);
    assert.ok(!/\p{Extended_Pictographic}/u.test(html.replace(/[©®™]/g, '')), `emoji on ${p}`);
    assert.ok(!/Microsoft|Windows/.test(html), `naming on ${p}`);
  });
  const css = fs.readFileSync(path.join(root, 'css/apps/gamerzone.css'), 'utf8');
  assert.ok(!/border-radius|blur|rgba|transition|box-shadow/.test(css));
  const js = fs.readFileSync(path.join(root, 'js/apps/gamerzone-site.js'), 'utf8');
  assert.ok(!/^\s*\/\/|\/\*/m.test(js));
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(index.includes('js/apps/gamerzone-site.js') && index.includes('css/apps/gamerzone.css'));
});

console.log(`gamerzone-site: ${passed} tests passed`);
