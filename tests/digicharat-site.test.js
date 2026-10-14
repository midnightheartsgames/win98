const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = { store: {}, getItem(k) { return k in this.store ? this.store[k] : null; }, setItem(k, v) { this.store[k] = String(v); } };
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
load('js/apps/digicharat-site.js');
load('js/apps/ie.js');

const site = window.diGiCharatSite;
const base = 'http://www.digicharat.net';
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

test('IE routes every fan club page to the site', () => {
  ['', '/episodes?ep=5', '/gallery?pic=2', '/music', '/about', '/guestbook', '/news?id=news_2'].forEach(p => {
    assert.strictEqual(window.appIE.identifyPageKey(base + p), 'digicharat', p);
  });
});

test('URLs pick the section, episode, picture and article', () => {
  assert.deepStrictEqual(site.parseUrl(base), { section: 'news', ep: NaN, pic: NaN, article: '' });
  assert.strictEqual(site.parseUrl(base + '/episodes?ep=5').ep, 5);
  assert.strictEqual(site.parseUrl(base + '/video').section, 'episodes');
  assert.strictEqual(site.parseUrl(base + '/gallery?pic=2').pic, 2);
  assert.strictEqual(site.parseUrl(base + '/mp3').section, 'music');
  assert.strictEqual(site.parseUrl(base + '/news?id=news_3').article, 'news_3');
});

test('the four characters are the main navigation and mark the current page', () => {
  const html = site.renderSite(base + '/music');
  ['dejiko', 'puchiko', 'gema', 'rabi'].forEach(name => assert.ok(window.Icons['gif-' + name], name));
  [base, `${base}/episodes`, `${base}/music`, `${base}/gallery`, `${base}/about`, `${base}/guestbook`].forEach(url => {
    assert.ok(html.includes(`data-url="${url}"`), url);
  });
  assert.ok(/dg-cast-link is-current" data-url="http:\/\/www\.digicharat\.net\/music"/.test(html));
});

test('the cast page shows six characters with drawn portraits', () => {
  const html = site.renderSite(base + '/about');
  const pics = [...html.matchAll(/content\/digi\/pic\/(profile_[a-z]+\.jpg)/g)].map(m => m[1]);
  assert.deepStrictEqual(pics, ['dejiko', 'puchiko', 'gema', 'rabienrose', 'otaku', 'manager'].map(id => `profile_${id}.jpg`));
  pics.forEach(file => assert.ok(fs.existsSync(path.join(__dirname, '..', 'content/digi/pic', file)), file));
  assert.ok(html.includes('<b class="dg-char-name">Mr. Manager</b>'));
  assert.ok(!/Abarenbou|store manager/i.test(html));
  const portraits = require('../tools/digi-portraits.cjs');
  assert.deepStrictEqual(Object.keys(portraits.PORTRAITS), ['dejiko', 'puchiko', 'gema', 'rabienrose', 'otaku', 'manager']);
  Object.keys(portraits.PORTRAITS).forEach(id => assert.ok(/^<svg [^>]*viewBox="0 0 192 192">[\s\S]*<\/svg>$/.test(portraits.svgFor(id)), id));
});

test('old guestbook favorites show the new manager name', () => {
  const html = site.renderGuestbookEntries([{ name: 'Old', loc: 'Tokyo', date: '01.12.1999', fav: 'Store Manager', msg: 'Hi' }]);
  assert.ok(html.includes('Favorite: Mr. Manager'));
  assert.ok(site.renderSite(base + '/guestbook').includes('<option value="Mr. Manager">Mr. Manager</option>'));
});

test('episode pages have their own URL, list and neighbours', () => {
  const html = site.renderSite(base + '/episodes?ep=5');
  assert.strictEqual(site.currentEpisode, 5);
  assert.ok(html.includes('Episode 05: She&#39;s Long and Thin-nyo') || html.includes("Episode 05: She's Long and Thin-nyo"));
  assert.ok(html.includes(`data-url="${base}/episodes?ep=4"`) && html.includes(`data-url="${base}/episodes?ep=6"`));
  assert.strictEqual((html.match(/<tr class="is-current">/g) || []).length, 1);
  assert.ok(html.includes('DiGi%20Charat%20-%2005_144p.mkv'));
});

test('episode and music players share one volume slider value', () => {
  site.playerVolume = 0.35;
  assert.ok(site.renderSite(base + '/episodes?ep=2').includes('id="digi_vol" min="0" max="1" step="0.05" value="0.35"'));
  assert.ok(site.renderSite(base + '/music').includes('id="digi_m_vol" min="0" max="1" step="0.05" value="0.35"'));
  site.playerVolume = 0.8;
});

test('gallery opens pictures as pages instead of a popup', () => {
  const index = site.renderSite(base + '/gallery');
  assert.ok(!index.includes('lightbox'));
  site.galleryImages.forEach(img => assert.ok(index.includes(`data-url="${base}/gallery?pic=${img.id}"`)));
  const pic = site.renderSite(base + '/gallery?pic=2');
  assert.ok(pic.includes('Rabi~en~Rose (Hikaru Usada) Standee'));
  assert.ok(pic.includes(`gallery?pic=1"`) && pic.includes(`gallery?pic=3"`));
  assert.ok(pic.includes('id="dg_save_pic"'));
});

test('news articles keep their comments on a separate page', () => {
  const html = site.renderSite(base + '/news?id=news_2');
  assert.ok(html.includes('PARTY NIGHT') && html.includes('id="dg_news_form"'));
  assert.ok(html.includes('EurobeatFiend'));
});

test('visitor texts are escaped', () => {
  site.saveGuestbookEntry('<img src=x onerror=alert(1)>', 'Tokyo', '', 'Dejiko', '<script>boom()</script>');
  const html = site.renderSite(base + '/guestbook');
  assert.ok(!html.includes('<script>boom'));
  assert.ok(html.includes('&lt;script&gt;boom()&lt;/script&gt;'));
  assert.ok(!html.includes('<img src=x'));
  site.saveVideoComment(1, 'A<b>', 'x<i>y');
  assert.ok(site.renderComments(site.getVideoComments(1)).includes('A&lt;b&gt;'));
});

test('the visitor counter counts only the front page', () => {
  const before = site.visitCount(false);
  site.renderSite(base);
  assert.strictEqual(site.visitCount(false), before + 1);
  site.renderSite(base + '/news?id=news_1');
  site.renderSite(base + '/music');
  assert.strictEqual(site.visitCount(false), before + 1);
});

test('no comments in the site sources', () => {
  ['js/apps/digicharat-site.js', 'css/apps/digicharat.css'].forEach(rel => {
    const src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
    assert.ok(!/\/\*[\s\S]*?\*\//.test(src), `${rel} has a block comment`);
    assert.ok(!/(^|[^:'"])\/\/\s/m.test(src), `${rel} has a line comment`);
    assert.ok(!/<!--/.test(src), `${rel} has an HTML comment`);
  });
});

console.log(`digicharat-site: ${passed} tests passed`);
