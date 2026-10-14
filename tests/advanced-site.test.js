/**
 * Tests for the 3ADVANCED SOFTWORKS site (http://www.3advanced.com) in Internet Explorer.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const opened = [];
const wizards = [];
global.localStorage = { store: {}, getItem(k) { return this.store[k] || null; }, setItem(k, v) { this.store[k] = String(v); } };
global.window = {
  addEventListener: () => {},
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) },
  gameManager: { isInstalled: id => id === 'doom', openSetupWizard: id => wizards.push(id) },
  appNotepad: { open: (...a) => opened.push(['notepad', a]) },
  appExplorer: { open: (...a) => opened.push(['explorer', a]) },
  appDoom: { open: () => opened.push(['doom', []]) }
};

eval(fs.readFileSync(path.join(__dirname, '../js/apps/advanced-site.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/apps/ie.js'), 'utf8'));

const site = window.advancedSite;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

test('IE routes 3advanced.com to the site', () => {
  const ie = window.appIE;
  assert.strictEqual(ie.identifyPageKey('http://www.3advanced.com'), 'advanced');
  assert.strictEqual(ie.identifyPageKey('http://www.3advanced.com/program/blender'), 'advanced');
  assert.ok(ie.getPageTitle('advanced').includes('3ADVANCED'));
});

test('URL parsing picks section and program', () => {
  assert.deepStrictEqual(site.parseUrl('http://www.3advanced.com'), { section: 'home' });
  assert.deepStrictEqual(site.parseUrl('http://www.3advanced.com/games'), { section: 'games' });
  assert.deepStrictEqual(site.parseUrl('http://www.3advanced.com/program/doom'), { section: 'games', programId: 'doom' });
  assert.deepStrictEqual(site.parseUrl('http://www.3advanced.com/program/paint'), { section: 'software', programId: 'paint' });
});

test('every section renders', () => {
  for (const s of ['', '/profile', '/software', '/games', '/archive', '/contact', '/program/winamp']) {
    const html = site.renderSite('http://www.3advanced.com' + s);
    assert.ok(html.includes('adv-root') && html.includes('3ADVANCED SOFTWORKS'), s);
  }
});

test('program ids are unique and categories valid', () => {
  const ids = site.programs.map(p => p.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  const cats = new Set(site.categories.map(c => c.id).concat('games'));
  site.programs.forEach(p => assert.ok(cats.has(p.cat), p.id));
});

test('launch opens installed apps with args, wizard for missing ones', () => {
  site.launch('explorer');
  assert.deepStrictEqual(opened.pop(), ['explorer', [['My Computer']]]);
  site.launch('doom');
  assert.deepStrictEqual(opened.pop(), ['doom', []]);
  site.launch('diablo');
  assert.deepStrictEqual(wizards, ['diablo']);
});

test('program hero shows install button for missing game', () => {
  const html = site.renderSite('http://www.3advanced.com/program/diablo');
  assert.ok(html.includes('УСТАНОВИТЬ') && html.includes('NOT.INSTALLED'));
});

test('mailing list stores subscribers', () => {
  assert.strictEqual(site.addSubscriber('neo@zion.net'), 1);
  assert.strictEqual(site.addSubscriber('neo@zion.net'), 1);
});

console.log(`\nALL ${passed} 3ADVANCED SITE TESTS PASSED!`);
