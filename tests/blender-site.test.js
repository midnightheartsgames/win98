const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Blender 3D Website (2.04) & Download/Setup System ---');

const storage = new Map();
const mockLocalStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

function createMockEl(tag = 'div') {
  const children = [];
  const classes = new Set();
  const listeners = {};
  return {
    tagName: tag.toUpperCase(),
    dataset: {},
    style: {},
    children,
    childNodes: children,
    innerHTML: '',
    textContent: '',
    appendChild: (c) => { children.push(c); return c; },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (evt, fn) => {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c)
    }
  };
}

const mockWindow = {
  localStorage: mockLocalStorage,
  innerWidth: 1024,
  innerHeight: 768,
  document: {
    getElementById: () => createMockEl(),
    createElement: (tag) => createMockEl(tag),
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  CustomEvent: class { constructor(t, d) { this.type = t; this.detail = d; } },
  addEventListener: () => {},
  removeEventListener: () => {}
};

const ctx = {
  window: mockWindow,
  document: mockWindow.document,
  localStorage: mockLocalStorage,
  console
};
vm.createContext(ctx);

const load = (rel) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'), ctx, { filename: rel });
load('js/icons.js');
load('js/game-manager.js');
load('js/desktop.js');
load('js/apps/blender-site.js');
load('js/apps/ie.js');

const gm = ctx.window.gameManager;
const Icons = ctx.window.Icons;
const ie = ctx.window.appIE;
const blenderSite = ctx.window.blenderSite;
const Desktop = ctx.window.Desktop;

assert.ok(Icons['blender'] && Icons['blender'].includes('<svg'), 'Icons must contain the Blender 1.60 icon');
assert.ok(Icons['blender204'] && Icons['blender204'].includes('<svg'), 'Icons must contain the Blender 2.04 icon');
assert.ok(Icons['file-blend204'], 'Icons must contain the .blend file icon of 2.04');
console.log('PASS 1. Blender icons present');

assert.strictEqual(gm.isInstalled('blender'), false, 'Blender 1.60 must not be installed initially');
assert.strictEqual(gm.isInstalled('blender204'), false, 'Blender 2.04 must not be installed initially');
const baseIcons = Desktop.prototype.getBaseIcons.call({ t: (k) => k });
assert.ok(!baseIcons.some(i => i.id === 'blender' || i.id === 'blender204'), 'Blender must not be in Desktop.getBaseIcons');
const computedInitial = Desktop.prototype.computeCurrentIcons.call({ getBaseIcons: () => baseIcons });
assert.ok(!computedInitial.some(i => i.id === 'blender' || i.id === 'blender204'), 'Blender must not be on the desktop before installation');
console.log('PASS 2. Blender is not preinstalled');

const old = gm.catalog['blender'];
assert.ok(old, 'Blender 1.60 must stay in the catalog');
assert.strictEqual(old.isApp, true);
assert.strictEqual(old.price, 0);
assert.strictEqual(old.priceDisplay, 'FREEWARE');
assert.strictEqual(old.setupExe, 'Setup_Blender160.exe');
assert.strictEqual(old.targetExe, 'BLENDER.EXE');
assert.strictEqual(old.downloadUrl, 'http://www.blender3d.com');
const cur = gm.catalog['blender204'];
assert.ok(cur, 'Blender 2.04 must be in the catalog');
assert.strictEqual(cur.isApp, true);
assert.strictEqual(cur.price, 0);
assert.strictEqual(cur.priceDisplay, 'FREEWARE');
assert.strictEqual(cur.setupExe, 'blender2.04-windows.exe');
assert.strictEqual(cur.targetExe, 'Blender.exe');
assert.strictEqual(cur.folder, 'Blender 2.04');
assert.strictEqual(cur.downloadUrl, 'http://www.blender3d.com');
assert.ok(!cur.steam, 'Blender is freeware from its own site, not a Steam game');
assert.strictEqual(gm.isPurchased('blender204'), true, 'Freeware must count as purchased');
console.log('PASS 3. Catalog defines Blender 1.60 and Blender 2.04 as freeware');

['http://www.blender3d.com', 'http://www.blender.nl', 'http://www.blender.org', 'http://www.blender3d.com/download', 'http://www.blender3d.com/features', 'http://www.blender3d.com/gallery', 'http://www.blender3d.com/tutorials', 'http://www.blender3d.com/guestbook', 'http://www.blender3d.com/faq', 'http://www.blender3d.com/shop'].forEach(u => assert.strictEqual(ie.identifyPageKey(u), 'blender', u));
assert.ok(ie.getPageTitle('blender').includes('Blender 2.04'), 'Page title must name Blender 2.04');
console.log('PASS 4. IE routes and page title');

assert.ok(ie.performSearch('blender').some(r => r.url === 'http://www.blender3d.com'));
assert.ok(ie.performSearch('3d моделирование').some(r => r.url === 'http://www.blender3d.com'));
const hit = ie.performSearch('nan render').find(r => r.url === 'http://www.blender3d.com');
assert.ok(hit && hit.snippet.includes('2.04'), 'Search snippet must describe 2.04');
console.log('PASS 5. WebSeeker 98 search');

const bannedNames = new RegExp(['Micro', 'soft|Win', 'dows'].join(''));
const pages = {};
['', '/news?id=2', '/download', '/features', '/gallery', '/gallery?id=halo', '/tutorials', '/faq', '/shop', '/community', '/about', '/guestbook'].forEach(p => { pages[p] = blenderSite.renderSite('http://www.blender3d.com' + p); });
Object.entries(pages).forEach(([p, html]) => {
  assert.ok(html.includes('b3d-frame') && html.includes('b3d-menubar'), 'table layout on ' + p);
  assert.ok(!bannedNames.test(html), 'only Microslop and Win names on ' + p);
  assert.ok(!/border-radius|linear-gradient|box-shadow/.test(html), 'no modern inline styles on ' + p);
});
const home = pages[''];
assert.ok(home.includes('Blender 2.04 released'), 'Home page must announce 2.04');
assert.ok(home.includes('Ton Roosendaal') && home.includes('Not a Number'));
assert.ok(home.includes('System requirements'));
assert.ok(home.includes('b3d-render-wait'), 'Home page must queue a live render');
assert.ok(pages['/news?id=2'].includes('Blender 2.03 and the first game demos'));
const dl = pages['/download'];
assert.ok(dl.includes('blender2.04-windows.exe'), 'Download page must offer blender2.04-windows.exe');
assert.ok(dl.includes('data-act="dl204"'), 'Download page must have 2.04 mirror buttons');
assert.ok(dl.includes('is not installed'), 'Download page must show not installed status');
assert.ok(dl.includes('Previous releases') && dl.includes('Setup_Blender160.exe') && dl.includes('data-act="dl160"'), 'Download page must keep 1.60 in the archive');
assert.ok(pages['/features'].includes('Game engine') && pages['/features'].includes('Metaballs'));
assert.strictEqual((pages['/gallery'].match(/b3d-render-wait/g) || []).length, 6, 'Gallery must render six pictures');
assert.ok(pages['/gallery?id=halo'].includes('Halo Lights'));
assert.ok(pages['/tutorials'].includes('your first game') && pages['/tutorials'].includes('b3d-key'));
assert.ok(pages['/shop'].includes('(31) 40 247 5707'));
assert.ok(pages['/guestbook'].includes('b3d-gb-form'));
console.log('PASS 6. Site pages render');

blenderSite.saveGuestbookEntry('Tester', 'Moscow', 'Hello <b>NaN</b>');
const gb = blenderSite.renderSite('http://www.blender3d.com/guestbook');
assert.ok(gb.includes('Hello &lt;b&gt;NaN&lt;/b&gt;'), 'Guestbook entries must be escaped');
assert.ok(gb.indexOf('Tester') < gb.indexOf('Ton Roosendaal'), 'New entry goes on top');
console.log('PASS 7. Guestbook stores and escapes entries');

gm.finishInstallation('blender204');
assert.strictEqual(gm.isInstalled('blender204'), true);
const after204 = Desktop.prototype.computeCurrentIcons.call({ getBaseIcons: () => baseIcons });
const icon204 = after204.find(i => i.id === 'blender204');
assert.ok(icon204, 'Blender 2.04 must appear on the desktop after installation');
assert.strictEqual(icon204.title, 'Blender 2.04');
assert.strictEqual(icon204.icon, 'blender204');
assert.ok(!after204.some(i => i.id === 'blender'), 'Installing 2.04 must not install 1.60');
const dl204 = blenderSite.renderSite('http://www.blender3d.com/download');
assert.ok(dl204.includes('Blender 2.04 is installed') && dl204.includes('data-act="launch204"'));
assert.ok(dl204.includes('data-act="dl160"'), '1.60 archive must still offer its download');
console.log('PASS 8. Blender 2.04 installation and live site status');

gm.finishInstallation('blender');
assert.strictEqual(gm.isInstalled('blender'), true);
const afterBoth = Desktop.prototype.computeCurrentIcons.call({ getBaseIcons: () => baseIcons });
const icon160 = afterBoth.find(i => i.id === 'blender');
assert.ok(icon160 && icon160.title === 'Blender 1.60' && icon160.icon === 'blender');
assert.ok(blenderSite.renderSite('http://www.blender3d.com/download').includes('data-act="launch160"'));
console.log('PASS 9. Blender 1.60 archive install still works');

console.log('\nALL BLENDER 3D WEBSITE & SETUP TESTS PASSED!\n');
