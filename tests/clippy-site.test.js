const fs = require('fs');
const path = require('path');
const assert = require('assert');

const files = [];
const spoken = [];
global.localStorage = { store: {}, getItem(k) { return k in this.store ? this.store[k] : null; }, setItem(k, v) { this.store[k] = String(v); } };
global.window = {
  addEventListener: () => {},
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) },
  vfs: { writeFile: (dir, name, content) => files.push([dir.join('/'), name]) }
};

const clippy = {
  visible: true,
  persistentGlasses: false,
  quizHighScore: 0,
  quizQuestions: [1, 2, 3],
  applied: 0,
  setGlasses(v) { this.persistentGlasses = v; if (v) window.clippyWardrobe.clearEyesForGlasses(); },
  applyWardrobe() { this.applied++; },
  speak(text) { spoken.push(text); },
  wearRandomOutfit() {},
  startQuiz() {}
};

eval(fs.readFileSync(path.join(__dirname, '../js/apps/clippy-wardrobe.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/apps/clippy-site.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/apps/ie.js'), 'utf8'));
window.appClippy = clippy;

const w = window.clippyWardrobe;
const site = window.clippySite;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

test('IE routes clippy98.com to the site', () => {
  const ie = window.appIE;
  assert.strictEqual(ie.identifyPageKey('http://www.clippy98.com'), 'clippy');
  assert.strictEqual(ie.identifyPageKey('http://www.clippy98.com/wardrobe'), 'clippy');
  assert.strictEqual(ie.identifyPageKey('http://www.skrepysh.ru'), 'clippy');
  assert.ok(ie.getPageTitle('clippy').includes('Скрепыш'));
});

test('URL parsing picks the section', () => {
  assert.strictEqual(site.parseUrl('http://www.clippy98.com'), 'home');
  assert.strictEqual(site.parseUrl('http://www.clippy98.com/wardrobe'), 'wardrobe');
  assert.strictEqual(site.parseUrl('http://www.clippy98.com/download/tophat'), 'wardrobe');
  assert.strictEqual(site.parseUrl('http://www.clippy98.com/faq'), 'faq');
});

test('every section renders', () => {
  for (const s of ['', '/wardrobe', '/colleagues', '/faq', '/guestbook']) {
    const html = site.renderSite('http://www.clippy98.com' + s);
    assert.ok(html.includes('cc-root') && html.includes('СКРЕПЫШ'), s);
  }
  const html = site.renderSite('http://www.clippy98.com/wardrobe');
  w.items.forEach(i => assert.ok(html.includes(`data-item="${i.id}"`), i.id));
});

test('catalog: unique ids, valid slots, svg for each item', () => {
  const ids = w.items.map(i => i.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  const slots = new Set(w.slots.map(s => s.id));
  w.items.forEach(i => {
    assert.ok(slots.has(i.slot), i.id);
    assert.ok(i.svg.startsWith('<') && i.file.endsWith('.ACS') && i.sizeKb > 0, i.id);
  });
  w.slots.forEach(s => assert.ok(w.getItems(s.id).length > 0, s.id));
});

test('items must be downloaded before they can be worn', () => {
  assert.strictEqual(w.isOwned('tophat'), false);
  assert.strictEqual(w.equip('tophat'), false);
  assert.strictEqual(w.markOwned('tophat'), true);
  assert.strictEqual(w.equip('tophat'), true);
  assert.strictEqual(w.getEquippedId('head'), 'tophat');
  assert.ok(clippy.applied > 0);
});

test('one item per slot, slots combine', () => {
  ['party', 'tie', 'mustache', 'monocle'].forEach(id => w.markOwned(id));
  w.equip('party');
  w.equip('tie');
  w.equip('mustache');
  w.equip('monocle');
  assert.deepStrictEqual(w.getOutfit(), { head: 'party', eyes: 'monocle', mouth: 'mustache', neck: 'tie' });
  w.unequip('mouth');
  assert.strictEqual(w.getEquippedId('mouth'), null);
});

test('outfit persists in localStorage', () => {
  const fresh = new w.constructor();
  assert.ok(fresh.state.owned.includes('tophat'));
  assert.strictEqual(fresh.state.equipped.head, 'party');
  assert.strictEqual(fresh.state.equipped.neck, 'tie');
});

test('sunglasses share the eyes slot with the built-in glasses accessory', () => {
  w.markOwned('sunglasses');
  w.equip('sunglasses');
  assert.strictEqual(clippy.persistentGlasses, true);
  assert.strictEqual(w.state.equipped.eyes, null);
  assert.strictEqual(w.getEquippedId('eyes'), 'sunglasses');
  w.equip('monocle');
  assert.strictEqual(clippy.persistentGlasses, false);
  assert.strictEqual(w.getEquippedId('eyes'), 'monocle');
  clippy.setGlasses(true);
  assert.strictEqual(w.getEquippedId('eyes'), 'sunglasses');
});

test('crown is locked until the quiz is aced', () => {
  assert.strictEqual(w.isLocked('crown'), true);
  assert.strictEqual(w.markOwned('crown'), false);
  assert.ok(site.renderSite('http://www.clippy98.com/wardrobe').includes('cc-quiz'));
  clippy.quizHighScore = 3;
  assert.strictEqual(w.isLocked('crown'), false);
  assert.strictEqual(w.markOwned('crown'), true);
});

test('finished download saves an .ACS file and Clippy offers to wear it', () => {
  site.finishDownload(w.getItem('ushanka'));
  assert.ok(w.isOwned('ushanka'));
  assert.deepStrictEqual(files.pop(), ['My Computer/C:/My Documents/Downloads', 'USHANKA.ACS']);
  assert.ok(spoken.pop().includes('Ушанка'));
});

test('unequipAll clears every slot including sunglasses', () => {
  w.unequipAll();
  assert.deepStrictEqual(w.getOutfit(), { head: null, eyes: null, mouth: null, neck: null });
  assert.strictEqual(clippy.persistentGlasses, false);
});

test('preview svg draws the outfit layers', () => {
  const svg = w.previewSvg({ head: 'tophat', neck: 'bowtie' }, 80);
  assert.ok(svg.startsWith('<svg') && svg.includes(w.getItem('tophat').svg) && svg.includes(w.getItem('bowtie').svg));
});

test('guestbook stores escaped entries', () => {
  assert.strictEqual(site.addGuestbookEntry('', 'x'), false);
  assert.strictEqual(site.addGuestbookEntry('<b>Hacker</b>', 'Привет, Скрепыш!'), true);
  const html = site.renderSite('http://www.clippy98.com/guestbook');
  assert.ok(html.includes('&lt;b&gt;Hacker&lt;/b&gt;') && html.includes('Привет, Скрепыш!'));
});

console.log(`\nALL ${passed} CLIPPY SITE TESTS PASSED!`);
