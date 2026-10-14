const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  vfs: {
    writeFile: () => true
  },
  soundSys: {
    playDing: () => {},
    playClick: () => {}
  },
  winManager: {
    windows: new Map(),
    openDialog: () => {},
    createWindow: () => ({})
  },
  appNotepad: {
    open: () => {}
  }
};

const mockStorage = new Map();
global.localStorage = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear()
};

function createMockEl() {
  return {
    appendChild: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {},
    querySelector: () => createMockEl(),
    querySelectorAll: () => []
  };
}
global.document = {
  createElement: () => createMockEl(),
  body: {
    appendChild: () => {}
  },
  querySelector: () => createMockEl(),
  querySelectorAll: () => []
};

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const indexHtml = read('index.html');
const dataScripts = [...indexHtml.matchAll(/<script src="(js\/apps\/interpedia[^"]*)"><\/script>/g)].map(m => m[1]);
const dataDir = path.join(root, 'js/apps/interpedia');
const dataFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.js')).sort();

assert.strictEqual(dataScripts[0], 'js/apps/interpedia-data.js', 'index.html must load the article registry first');
assert.strictEqual(dataScripts[dataScripts.length - 1], 'js/apps/interpedia-site.js', 'index.html must load the renderer after the articles');
dataFiles.forEach(f => assert(dataScripts.includes(`js/apps/interpedia/${f}`), `index.html must load js/apps/interpedia/${f}`));
dataScripts.forEach(src => eval(read(src)));
eval(read('js/apps/ie.js'));
eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/clippy.js'));

console.log('--- Testing Interpedia (The Free Encyclopedia) for Internet Explorer 5.0 ---');

const engine = window.interpediaSite;
assert(engine, 'window.interpediaSite should be defined');
assert.strictEqual(engine.activeArticleId, 'main', 'Default activeArticleId should be "main"');
console.log('PASS 1: InterpediaSiteEngine initialized');

const i18n = engine.getI18n();
assert(i18n.ru && i18n.en, 'Both Russian and English dictionaries must exist');
assert.strictEqual(i18n.ru.brandTitle, 'Интерпедия');
assert.strictEqual(i18n.en.brandTitle, 'Interpedia');
assert.strictEqual(i18n.ru.tocTitle, 'Содержание');
assert.strictEqual(i18n.en.tocTitle, 'Contents');
console.log('PASS 2: Dual language dictionary verified');

const articles = engine.getArticles();
const ids = engine.uniqueArticles();
assert(Object.keys(articles).length >= 100, `Article repository must contain >= 100 entries, found: ${Object.keys(articles).length}`);
assert(ids.length >= 100, `There must be at least 100 distinct articles, found: ${ids.length}`);
const portals = ['os', 'games', 'hardware', 'software', 'internet', 'culture', 'project'];
const wordsOf = c => (engine.plainText([c.lead, ...c.sections.map(s => s.content)].join(' ')).match(/[A-Za-zА-Яа-яЁё0-9]+/g) || []).length;
ids.forEach(id => {
  const art = articles[id];
  assert(portals.includes(art.category), `Article ${id} must belong to a portal`);
  ['ru', 'en'].forEach(lang => {
    const c = art[lang];
    assert(c && c.title && c.lead, `Article ${id} must have a ${lang} title and lead`);
    assert(Array.isArray(c.sections) && c.sections.length >= 4, `Article ${id} (${lang}) must have at least 4 sections`);
    assert(new Set(c.sections.map(s => s.id)).size === c.sections.length, `Article ${id} (${lang}) section ids must be unique`);
    assert(c.infobox && c.infobox.fields.length >= 5, `Article ${id} (${lang}) must have an infobox with at least 5 fields`);
    assert(c.references && c.references.length >= 2, `Article ${id} (${lang}) must cite at least 2 sources`);
    assert(c.categories && c.categories.length >= 2, `Article ${id} (${lang}) must have categories`);
    assert(c.seeAlso && c.seeAlso.length >= 3 && c.seeAlso.every(s => articles[s]), `Article ${id} (${lang}) must have valid See also links`);
    assert(wordsOf(c) >= 250, `Article ${id} (${lang}) is too short: ${wordsOf(c)} words`);
  });
  assert.deepStrictEqual(art.ru.sections.map(s => s.id), art.en.sections.map(s => s.id), `Article ${id} must have the same sections in both languages`);
});
console.log(`PASS 3: ${ids.length} full bilingual articles validated`);

const intentionalRedLinks = ['encarta', 'warcraft2'];
const allText = id => {
  const art = articles[id];
  return ['ru', 'en'].map(lang => {
    const c = art[lang];
    return [c.hatnote, c.lead, ...c.sections.map(s => s.content), ...c.infobox.fields.map(f => f.value), ...(c.references || [])].join('\n');
  }).join('\n');
};
const mainText = JSON.stringify(articles.main);
ids.map(allText).concat(mainText).forEach(text => {
  for (const m of text.matchAll(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g)) {
    const target = m[1].trim().toLowerCase();
    assert(articles[target] || intentionalRedLinks.includes(target), `Broken internal link [[${m[1]}]]`);
  }
});
console.log('PASS 4: Internal wiki links resolve (red links only where intended)');

const forbiddenNames = /Microsoft|MICROSOFT|Windows|WINDOWS/;
const futureYear = /(?<![\d.,])20(0[1-9]|[1-9]\d)(?!\d)/g;
const fictionYears = ['2002', '2015', '2020', '2068', '2077'];
ids.forEach(id => {
  const visible = engine.plainText(allText(id)) + JSON.stringify([articles[id].ru.title, articles[id].en.title, articles[id].ru.categories, articles[id].en.categories]);
  assert(!forbiddenNames.test(visible), `Article ${id} must use Microslop/Win naming`);
  const years = (visible.match(futureYear) || []).filter(y => !fictionYears.includes(y));
  assert(!years.length, `Article ${id} must be written as of December 1999, found ${years.join(', ')}`);
});
console.log('PASS 5: Microslop/Win naming and the December 1999 timeline hold');

engine.currentLang = 'ru';
const ruHtml = engine.renderSite('http://www.interpedia.org/wiki/windows98');
assert(ruHtml.includes('Интерпедия'), 'Russian render must include Russian brand');
assert(ruHtml.includes('Содержание'), 'Russian render must include Russian TOC');
assert(ruHtml.includes('Microslop Win 98'), 'Russian render must include Win 98');
assert(ruHtml.includes('interpedia-infobox'), 'Rendered article must include an infobox');
assert(ruHtml.includes('#section-history'), 'TOC must link to sections');
assert(ruHtml.includes('<h3 id="section-comdex">'), 'Subsections must render as h3');
assert(ruHtml.includes('>1.1</span>'), 'TOC must number subsections');
assert(ruHtml.includes('id="section-see-also"') && ruHtml.includes('id="section-links"'), 'See also and external links must render');
assert(ruHtml.includes('data-wiki-page="bsod"'), 'Wiki links inside section text must render as links');
assert(ruHtml.includes('data-url="http://www.microslop.com"'), 'External links must use IE navigation');
assert(!ruHtml.includes('[['), 'No raw wiki markup may leak into the article');

engine.currentLang = 'en';
const enHtml = engine.renderSite('http://www.interpedia.org/wiki/windows98');
assert(enHtml.includes('Interpedia') && enHtml.includes('Contents') && enHtml.includes('Microslop Win 98'), 'English render must be in English');
ids.forEach(id => ['ru', 'en'].forEach(lang => {
  engine.currentLang = lang;
  const html = engine.renderSite(`http://www.interpedia.org/wiki/${id}`);
  assert.strictEqual(engine.activeArticleId, id, `URL /wiki/${id} must open ${id}`);
  assert(html.includes(articles[id][lang].title), `Article ${id} (${lang}) must render its title`);
  assert(!html.includes('[[') && !html.includes('undefined'), `Article ${id} (${lang}) must render cleanly`);
}));
console.log('PASS 6: Every article renders in both languages with TOC, subsections and links');

engine.renderSite('http://www.interpedia.org/wiki/quake2');
assert.strictEqual(engine.activeArticleId, 'quake2', 'quake2 must not resolve to quake');
engine.renderSite('http://www.interpedia.org/wiki/diablo2?tab=history');
assert.strictEqual(engine.activeArticleId, 'diablo2', 'diablo2 must not resolve to diablo');
assert.strictEqual(engine.activeTab, 'history');
engine.renderSite('http://www.interpedia.org/wiki/voodoogfx');
assert.strictEqual(articles[engine.activeArticleId], articles.voodoo, 'aliases must open their article');
console.log('PASS 7: URLs resolve to exact article ids and aliases');

const parsed = engine.parseWikitext("== Head ==\n'''Bold''' and ''Italic'' and [[halflife|Half-Life Game]]\n* one\n* two");
assert(parsed.includes('<h2>Head</h2>'), 'Should parse == Head ==');
assert(parsed.includes('<b>Bold</b>'), 'Should parse bold text');
assert(parsed.includes('<i>Italic</i>'), 'Should parse italic text');
assert(parsed.includes('data-wiki-page="halflife"'), 'Should parse wiki links');
assert(parsed.includes('<ul><li>one</li><li>two</li></ul>'), 'Should parse bullet lists');
assert(engine.parseWikitext('[[nosucharticle|Missing]]').includes('interpedia-link-new'), 'Missing articles must render as red links');
console.log('PASS 8: Wikitext parser handles headers, typography, lists and links');

engine.currentLang = 'ru';
engine.activeArticleId = 'windows98';
const editHtml = engine.renderEditView('windows98', articles.windows98.ru, i18n.ru);
assert(editHtml.includes('== История разработки ==') && editHtml.includes('=== Сбой на COMDEX ==='), 'Edit view must show section wikitext');
assert(editHtml.includes('[[bsod|'), 'Edit view must keep wiki links');
const exported = engine.articleText(articles.doom.ru);
assert(!exported.includes('[[') && !/<[a-z]/i.test(exported) && exported.includes('IDDQD'), 'Notepad export must be plain text');
console.log('PASS 9: Edit view and Notepad export use the full article');

const doomHistory = engine.renderHistoryView('doom', articles.doom.ru, i18n.ru);
assert(articles.doom.ru.sections.some(s => doomHistory.includes(s.title)), 'History must mention the article sections');
assert(!doomHistory.includes('COMDEX') && doomHistory.includes('InterpediaBot'), 'History must belong to the article');
assert.strictEqual(doomHistory, engine.renderHistoryView('doom', articles.doom.ru, i18n.ru), 'History must be stable between visits');
const talkHtml = engine.renderTalkView('freebsd', articles.freebsd.ru, i18n.ru);
assert(!talkHtml.includes('COMDEX') && articles.freebsd.ru.sections.some(s => talkHtml.includes(s.title)), 'Talk page must discuss its own article');
engine.saveTalkComment('windows98', { author: 'TestUser98', subject: 'Test Subject', message: 'Test Message', date: '20.09.1998' });
assert(engine.getTalkData('windows98').some(c => c.author === 'TestUser98' && c.message === 'Test Message'), 'Talk comment should persist in storage');
console.log('PASS 10: History and discussion pages are per article; comments persist');

engine.searchQuery = 'voodoo';
engine.activeTab = 'search';
const searchHtml = engine.renderSite('http://www.interpedia.org/wiki/Special:Search?q=voodoo');
assert(searchHtml.includes('3dfx Voodoo'), 'Search for "voodoo" should find the 3dfx Voodoo article');
const firstHit = searchHtml.indexOf('interpedia-search-item-title');
assert(searchHtml.slice(firstHit, firstHit + 300).includes('Voodoo'), 'Best match must come first');
console.log('PASS 11: Search ranks matching articles');

const main = engine.renderSite('http://www.interpedia.org');
assert(engine.activeArticleId === 'main' && !main.includes('120 000+'), 'Main page must count real words');
assert(main.includes(i18n.ru.newsTitle) && main.includes('data-wiki-page="win2000"'), 'Main page must show linked current events');
console.log('PASS 12: Main page shows statistics and December 1999 news');

const appIE = window.appIE;
assert(appIE, 'window.appIE should be defined');
assert.strictEqual(appIE.identifyPageKey('http://www.interpedia.org'), 'interpedia');
assert.strictEqual(appIE.identifyPageKey('http://interpedia.ru'), 'interpedia');
assert.strictEqual(appIE.identifyPageKey('http://en.interpedia.org/wiki/halflife'), 'interpedia');
assert.strictEqual(appIE.getPageTitle('interpedia'), 'Interpedia: The Free Internet Encyclopedia (Интерпедия: Свободная Энциклопедия)');
assert(appIE.performSearch('интерпедия').some(r => r.url === 'http://www.interpedia.org'), 'WebSeeker search should index Interpedia');
const externalUrls = new Set(ids.flatMap(id => ['ru', 'en'].flatMap(lang => (articles[id][lang].links || []).map(l => l[0]))));
externalUrls.forEach(url => assert(url.includes('search98') || appIE.identifyPageKey(url) !== 'search', `External link ${url} must open a real IE site`));
console.log('PASS 13: Internet Explorer routing, titles, search and external links verified');

assert(window.retroSites.getWebRingSites().some(s => s.url === 'http://www.interpedia.org'), 'Interpedia must be a member of the WebRing');
const clippy = window.appClippy;
assert(clippy, 'window.appClippy should be defined');
clippy.speak = () => {};
clippy.visible = true;
clippy._lastIePageKey = null;
clippy._lastIeTime = 0;
clippy.onNavigateIE('http://www.interpedia.org', 'interpedia', 'Interpedia');
console.log('PASS 14: WebRing membership and Clippy reaction verified');

engine.currentLang = 'ru';
const gamesPortal = engine.renderSite('http://www.interpedia.org/wiki/portal:games');
assert(gamesPortal.includes('Half-Life') && gamesPortal.includes('Quake'), 'Games portal must list game titles');
assert(!gamesPortal.includes('[['), 'Portal leads must be plain text');
const hwPortal = engine.renderSite('http://www.interpedia.org/wiki/portal:hardware');
assert(hwPortal.includes('3dfx Voodoo') && hwPortal.includes('RIVA TNT'), 'Hardware portal must list 3D accelerators');
console.log('PASS 15: Thematic portals verified');

console.log('\n========================================');
console.log(`ALL 15 INTERPEDIA TESTS PASSED (${ids.length} FULL ARTICLES)`);
console.log('========================================');
process.exit(0);
