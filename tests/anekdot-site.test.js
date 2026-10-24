const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

global.window = {
  isOnline: true,
  addEventListener: () => {},
  webGif: (name) => `<span class="gif-${name}"></span>`,
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) },
  vfs: { mkdir: () => {}, writeFile: () => true }
};

const root = path.join(__dirname, '..');
eval(fs.readFileSync(path.join(root, 'js/apps/retro-sites.js'), 'utf8'));
eval(fs.readFileSync(path.join(root, 'js/apps/ie.js'), 'utf8'));

const ie = window.appIE;
const home = 'http://www.anekdot98.ru';
const countCards = html => (html.match(/class="anekdot-card"/g) || []).length;
const page = url => ie.renderAnekdot(ie.parseAnekdotUrl(url));

const jokes = ie.getAnekdotList();
assert.strictEqual(jokes.length, 100);

const categories = ie.getAnekdotCategories();
const assigned = categories.flatMap(c => c.ids).sort((a, b) => a - b);
assert.deepStrictEqual(assigned, jokes.map(j => j.id).sort((a, b) => a - b));
assert.strictEqual(new Set(assigned).size, assigned.length);

[
  home,
  `${home}/`,
  `${home}/all.html`,
  `${home}/joke/7.html`,
  ...categories.map(c => `${home}/cat/${c.key}.html`)
].forEach(url => assert.strictEqual(ie.identifyPageKey(url), 'anekdot', url));

assert.strictEqual(ie.parseAnekdotUrl(home).view, 'home');
assert.strictEqual(ie.parseAnekdotUrl(`${home}/all.html`).view, 'all');
assert.strictEqual(ie.parseAnekdotUrl(`${home}/cat/newrus.html`).view, 'category');
assert.strictEqual(ie.parseAnekdotUrl(`${home}/cat/nothing.html`).view, 'home');
assert.strictEqual(ie.parseAnekdotUrl(`${home}/joke/7.html`).view, 'joke');
assert.strictEqual(ie.parseAnekdotUrl(`${home}/joke/9999.html`).view, 'home');

const homeHtml = page(home);
assert.strictEqual(countCards(homeHtml), 10);
assert.ok(homeHtml.includes(`data-url="${home}/all.html"`));
assert.ok(homeHtml.includes('Последние 10 анекдотов'));
categories.filter(c => c.ids.length).forEach(c => {
  assert.ok(homeHtml.includes(`data-url="${home}/cat/${c.key}.html"`), c.key);
});
assert.ok(!homeHtml.includes(`data-url="${home}/cat/readers.html"`));

assert.strictEqual(countCards(page(`${home}/all.html`)), 100);

categories.filter(c => c.ids.length).forEach(c => {
  const html = page(`${home}/cat/${c.key}.html`);
  assert.strictEqual(countCards(html), c.ids.length, c.key);
  assert.ok(html.includes(c.title));
});

const single = page(`${home}/joke/7.html`);
assert.strictEqual(countCards(single), 1);
assert.ok(single.includes('id="joke-7"'));

ie.publishAnekdot('Тестовый анекдот от читателя', 'Только что');
const afterPublish = page(home);
assert.ok(afterPublish.includes('Тестовый анекдот от читателя'));
assert.strictEqual(countCards(afterPublish), 10);
assert.strictEqual(countCards(page(`${home}/all.html`)), 101);
assert.ok(afterPublish.includes(`data-url="${home}/cat/readers.html"`));
assert.strictEqual(countCards(page(`${home}/cat/readers.html`)), 1);
assert.strictEqual(countCards(page(`${home}/cat/newrus.html`)), categories.find(c => c.key === 'newrus').ids.length);

console.log('anekdot-site tests passed');
