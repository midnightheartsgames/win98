const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const BASE = 'http://www.astralwiki98.ru';
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

const HSR_MODULES = ['hsr-core', 'hsr-data', 'hsr-battle', 'hsr-inaba', 'hsr-fours', 'hsr-conton', 'hsr-hares', 'hsr-fives', 'hsr-world', 'hsr-story', 'hsr-game', 'hsr-traces-data', 'hsr-traces', 'hsr-echoes', 'hsr-trace-fx', 'hsr-su-data', 'hsr-su-battle', 'hsr-su-story', 'hsr-su', 'hsr-chat', 'hsr-missions', 'hsr-shop', 'hsr-hook', 'hsr-section6', 'hsr-info', 'hsr-fours-info', 'hsr-conton-info', 'hsr-hares-info', 'hsr-fives-info', 'hsr-express', 'hsr-herta', 'hsr-herta-life', 'hsr-seclusion', 'hsr-jarilo-story', 'hsr-jarilo-life', 'hsr-museum', 'hsr-boulder', 'hsr-rivet', 'hsr-settle', 'hsr-restricted', 'hsr-corridor', 'hsr-hill', 'hsr-pillars', 'hsr-velvet', 'hsr-badge', 'hsr-axel-maps', 'hsr-axel-story', 'hsr-conductor', 'hsr-gfx', 'hsr-art', 'hsr-icons', 'hsr-cones', 'hsr-tiles', 'hsr-foes', 'hsr-midi', 'hsr-audio', 'hsr-ui', 'hsr-train', 'hsr-station', 'hsr-jarilo', 'hsr-axel', 'hsr-magflow', 'hsr-carts', 'hsr-3d', 'hsr-pompom', 'hsr-warp', 'hsr-title', 'hsr-cine', 'hsr-cines', 'hsr-ults', 'hsr-fusions', 'hsr-warp-intro', 'hsr-signal', 'hsr-signal-tv', 'hsr-convene', 'hsr-explosion', 'hsr-personas', 'hsr-midnight', 'hsr-spotlight', 'hsr-ui-menu', 'hsr-ui-velvet', 'hsr-eidolons', 'hsr-eidolon-scenes', 'hsr-inaba-scenes', 'hsr-fours-scenes', 'hsr-conton-scenes'];

const noop = () => {};
function makeCanvas(w = 300, h = 150) {
  const cv = { width: w, height: h, style: {}, dataset: {}, className: '', isConnected: false, addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h }), toDataURL: () => 'data:image/png;base64,stub' };
  const grad = () => ({ addColorStop: noop });
  const ctx = {
    canvas: cv, lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', globalAlpha: 1, globalCompositeOperation: 'source-over', font: '10px x', textAlign: 'left', textBaseline: 'alphabetic', imageSmoothingEnabled: true, fillStyle: '#000', strokeStyle: '#000',
    save: noop, restore: noop, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop, arc: noop, rect: noop, fill: noop, stroke: noop, clip: noop, ellipse: noop,
    fillRect: noop, strokeRect: noop, clearRect: noop, fillText: noop, strokeText: noop, translate: noop, rotate: noop, scale: noop, setLineDash: noop, drawImage: noop, putImageData: noop, setTransform: noop,
    measureText: s => ({ width: String(s).length * 6 }), createPattern: () => ({}), createLinearGradient: grad, createRadialGradient: grad,
    getImageData: (x, y, gw, gh) => ({ data: new Uint8ClampedArray(Math.max(1, gw * gh) * 4), width: gw, height: gh }),
    createImageData: (gw, gh) => ({ data: new Uint8ClampedArray(gw * gh * 4), width: gw, height: gh })
  };
  cv.getContext = () => ctx;
  return cv;
}

function mockElement() {
  return {
    dataset: {}, style: {}, value: '', checked: false, disabled: false, textContent: '', innerHTML: '', width: 150, height: 300,
    getContext: () => makeCanvas(150, 300).getContext('2d'),
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { return c; }, addEventListener() {}, removeEventListener() {}, focus() {},
    querySelector() { return mockElement(); }, querySelectorAll() { return []; }
  };
}

function createSystem() {
  const storage = new Map();
  const opened = { dialogs: [], ie: [], notepad: [], steam: null };
  const winManager = {
    windows: new Map(),
    createWindow(opts) {
      if (this.windows.has(opts.id)) return this.windows.get(opts.id);
      const win = { id: opts.id, opts, element: mockElement(), bodyElement: mockElement(), titleElement: mockElement() };
      this.windows.set(opts.id, win);
      return win;
    },
    closeWindow(id) { this.windows.delete(id); },
    bringToTop() {},
    setTitle() {},
    openDialog(opts) { opened.dialogs.push(opts); }
  };
  const ctx = {
    console, Date, Math, JSON, performance: { now: () => 0 },
    localStorage: { getItem: k => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) },
    innerWidth: 1024, innerHeight: 768,
    setTimeout: fn => { fn(); return 0; }, clearTimeout() {},
    setInterval: () => 1, clearInterval() {},
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    matchMedia: () => ({ matches: true }),
    addEventListener() {}, removeEventListener() {},
    document: { activeElement: null, createElement: tag => (tag === 'canvas' ? makeCanvas() : mockElement()), getElementById: () => mockElement(), addEventListener() {}, removeEventListener() {} },
    soundSys: { playClick() {}, playDing() {}, playError() {} },
    appNotepad: { open: (name, text) => opened.notepad.push([name, text]) },
    webGif: name => `<span class="gif-${name}"></span>`,
    getIcon: name => `<svg data-icon="${name}"></svg>`
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.winManager = winManager;
  vm.createContext(ctx);
  for (const f of HSR_MODULES) vm.runInContext(read(`js/apps/hsr98/${f}.js`), ctx, { filename: f });
  vm.runInContext(read('js/i18n.js') + '; window.i18n = new I18nManager();', ctx);
  vm.runInContext(read('js/icons.js') + '; window.Icons = Icons;', ctx);
  vm.runInContext(read('js/filesystem.js'), ctx);
  vm.runInContext(read('js/game-manager.js'), ctx);
  ctx.gameManager.showInSteam = id => { opened.steam = id; };
  vm.runInContext(read('js/apps/retro-sites.js'), ctx);
  vm.runInContext(read('js/apps/ie.js'), ctx);
  vm.runInContext(read('js/apps/hsr-site.js'), ctx);
  vm.runInContext(read('js/apps/hsr-wiki-data.js'), ctx);
  vm.runInContext(read('js/apps/hsr-wiki-site.js'), ctx);
  return { ctx, H: ctx.Hsr98, D: ctx.hsrWikiData, site: ctx.hsrWikiSite, ie: ctx.appIE, hsrSite: ctx.hsrSite, storage, opened };
}

const sys = createSystem();
const { H, D, site, ie, hsrSite, storage, opened } = sys;

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
}

console.log('--- astralwiki98.ru (HSR 98 Fan Wiki) ---');

const sampleUrls = [
  BASE,
  BASE + '/',
  BASE + '/index.html',
  BASE + '/systems',
  ...D.systems.map(s => `${BASE}/system?id=${s.id}`),
  BASE + '/factions',
  ...D.factions.map(f => `${BASE}/faction?id=${f.id}`),
  ...D.worlds.map(w => `${BASE}/world?id=${w.id}`),
  BASE + '/themes',
  ...D.themes.controllingIdeas.map(c => `${BASE}/theme?id=${c.id}`),
  ...D.themes.antagonists.map(a => `${BASE}/theme?id=${a.id}`),
  ...D.themes.motifs.map(m => `${BASE}/theme?id=${m.id}`),
  BASE + '/chars',
  ...site.characterIds().map(id => `${BASE}/char?id=${id}`),
  BASE + '/quests',
  ...site.questIds().map(id => `${BASE}/quest?id=${id}`),
  ...D.puzzles.map(p => `${BASE}/puzzle?id=${p.id}`),
  BASE + '/atlas',
  ...site.mapIds().map(id => `${BASE}/atlas?map=${id}`),
  ...site.docIds().map(id => `${BASE}/doc?id=${id}`),
  BASE + '/artifacts',
  BASE + '/recent',
  BASE + '/search?q=' + encodeURIComponent('Стелларон'),
  BASE + '/system?id=paths_aeons&mode=talk',
  BASE + '/system?id=paths_aeons&mode=history',
  BASE + '/system?id=paths_aeons&mode=edit',
  BASE + '/nowhere'
];

test('parseUrl resolves every view, query parameter, and mode', () => {
  assert.equal(site.parseUrl(BASE).view, 'home');
  assert.equal(site.parseUrl(BASE + '/').view, 'home');
  assert.equal(site.parseUrl(BASE + '/index.html').view, 'home');
  assert.equal(site.parseUrl(BASE + '/systems').view, 'systems');
  assert.equal(site.parseUrl(BASE + '/system?id=stellaron_fragmentum').id, 'stellaron_fragmentum');
  assert.equal(site.parseUrl(BASE + '/factions').view, 'factions');
  assert.equal(site.parseUrl(BASE + '/faction?id=ipc_market').id, 'ipc_market');
  assert.equal(site.parseUrl(BASE + '/world?id=w_belobog_over').id, 'w_belobog_over');
  assert.equal(site.parseUrl(BASE + '/themes').view, 'themes');
  assert.equal(site.parseUrl(BASE + '/theme?id=ci_belobog').id, 'ci_belobog');
  assert.equal(site.parseUrl(BASE + '/chars').view, 'chars');
  assert.equal(site.parseUrl(BASE + '/char?id=march').id, 'march');
  assert.equal(site.parseUrl(BASE + '/quests').view, 'quests');
  assert.equal(site.parseUrl(BASE + '/puzzle?id=puz_carts').id, 'puz_carts');
  assert.equal(site.parseUrl(BASE + '/atlas?map=hs_supply').id, 'hs_supply');
  const firstDoc = site.docIds()[0];
  assert.equal(site.parseUrl(`${BASE}/doc?id=${firstDoc}`).id, firstDoc);
  assert.equal(site.parseUrl(BASE + '/artifacts').view, 'artifacts');
  assert.equal(site.parseUrl(BASE + '/recent').view, 'recent');
  assert.equal(site.parseUrl(BASE + '/search?q=Кафка').params.q, 'Кафка');
  assert.equal(site.parseUrl(BASE + '/system?id=paths_aeons&mode=talk').mode, 'talk');
  assert.equal(site.parseUrl(BASE + '/system?id=paths_aeons&mode=history').mode, 'history');
  assert.equal(site.parseUrl(BASE + '/system?id=paths_aeons&mode=edit').mode, 'edit');
  assert.equal(site.parseUrl(BASE + '/unknown').view, 'missing');
});

test('IE routes astralwiki98.ru, lists it in directory and search, and hsr.hoyoverse.com links to it', () => {
  for (const u of sampleUrls) assert.equal(ie.identifyPageKey(u), 'hsrwiki', u);
  for (const u of ['http://hsr.hoyoverse.com', 'http://www.kovcheg98.ru', 'http://www.interpedia.org']) {
    assert.notEqual(ie.identifyPageKey(u), 'hsrwiki', u);
  }
  assert.ok(ie.getPageTitle('hsrwiki').includes("АстралВики '98"));
  assert.ok(!ie.favorites.some(([u]) => u === BASE), 'Favorites remain untouched');
  const books = ie.searchDirectory.find(c => c.title === 'Книги, справки и юмор');
  assert.ok(books && books.sites.some(([u]) => u === BASE), 'listed in WebSeeker directory');
  for (const q of ['астралвики', 'стелларон', 'лор хонкай', 'записки белобог']) {
    assert.ok(ie.performSearch(q).some(r => r.url === BASE), `search matches ${q}`);
  }
  const officialHome = hsrSite.renderSite('http://hsr.hoyoverse.com');
  assert.ok(officialHome.includes('data-url="http://www.astralwiki98.ru"') && officialHome.includes("АстралВики '98"), 'official HSR 98 site links to AstralWiki 98');
});

test('Worldbuilding: cosmic systems, factions, and worlds have complete structured registries', () => {
  assert.equal(D.systems.length, 6);
  for (const s of D.systems) {
    assert.ok(s.id && s.title && s.summary.length > 40, s.id);
    assert.ok(Array.isArray(s.body) && s.body.length >= 2, `${s.id} body`);
    assert.ok(Array.isArray(s.tableHeaders) && s.tableHeaders.length >= 2, `${s.id} tableHeaders`);
    assert.ok(Array.isArray(s.tableRows) && s.tableRows.length >= 3, `${s.id} tableRows`);
    const html = site.renderSite(`${BASE}/system?id=${s.id}`);
    assert.ok(html.includes(site.esc(s.title)), s.title);
    for (const th of s.tableHeaders) assert.ok(html.includes(site.esc(th)), `${s.id} header ${th}`);
  }
  assert.equal(D.factions.length, 9);
  for (const f of D.factions) {
    assert.ok(f.id && f.name && f.path && f.goal && f.resources && f.methods && f.leader && f.relations && f.body, f.id);
    const html = site.renderSite(`${BASE}/faction?id=${f.id}`);
    assert.ok(html.includes(site.esc(f.name)) && html.includes(site.esc(f.goal)), f.name);
  }
  assert.equal(D.worlds.length, 6);
  for (const w of D.worlds) {
    assert.ok(w.id && w.name && w.region && w.currency && w.hierarchy && w.customs && w.taboos && w.body, w.id);
    assert.ok(Array.isArray(w.timeline) && w.timeline.length >= 3, `${w.id} timeline`);
    const html = site.renderSite(`${BASE}/world?id=${w.id}`);
    assert.ok(html.includes(site.esc(w.name)) && html.includes(site.esc(w.currency)), w.name);
    for (const [era] of w.timeline) assert.ok(html.includes(site.esc(era)), `${w.id} era ${era}`);
  }
});

test('Theme Craft: controlling ideas, antagonist counter-arguments, motifs, and character arcs', () => {
  assert.equal(D.themes.controllingIdeas.length, 8);
  const themesHtml = site.renderSite(`${BASE}/themes`);
  for (const c of D.themes.controllingIdeas) {
    assert.ok(c.id && c.act && c.title && c.controllingIdea && c.counterIdea && c.proofScene, c.id);
    assert.ok(themesHtml.includes(site.esc(c.title)) && themesHtml.includes(site.esc(c.controllingIdea)), c.title);
    const artHtml = site.renderSite(`${BASE}/theme?id=${c.id}`);
    assert.ok(artHtml.includes(site.esc(c.proofScene)), `theme article ${c.id}`);
  }
  assert.equal(D.themes.antagonists.length, 6);
  for (const a of D.themes.antagonists) {
    assert.ok(a.id && a.name && a.role && a.whySheBelievesSheIsRight && a.pressureOnHero && a.downfall, a.id);
    assert.ok(themesHtml.includes(site.esc(a.name)), a.name);
    const antHtml = site.renderSite(`${BASE}/theme?id=${a.id}`);
    assert.ok(antHtml.includes(site.esc(a.downfall)), `antagonist article ${a.id}`);
  }
  assert.equal(D.themes.motifs.length, 8);
  for (const m of D.themes.motifs) {
    assert.ok(m.id && m.name && m.symbol && m.firstSeen && m.transformations && m.climax && m.meaning, m.id);
    assert.ok(themesHtml.includes(site.esc(m.name)) && themesHtml.includes(site.esc(m.meaning)), m.name);
  }
  const ids = site.characterIds();
  assert.equal(ids.length, Object.keys(H.CHARS).filter(id => id !== 'trail_p').length);
  for (const id of ids) {
    const arc = site.deriveCharArc(id);
    assert.ok(arc.arcType && arc.lie && arc.truth && arc.ghostWound && arc.keyRelation, `arc fields for ${id}`);
  }
});

test('every character dossier combines thematic arc with live H.INFO, skills, cones, outfits and Eidolons', () => {
  for (const id of site.characterIds()) {
    const c = H.CHARS[id];
    const info = H.INFO[id];
    const arc = site.deriveCharArc(id);
    const html = site.renderSite(`${BASE}/char?id=${id}`);
    assert.ok(html.includes(site.esc(c.name)), `name ${id}`);
    assert.ok(html.includes(site.esc(arc.arcType)), `arcType ${id}`);
    assert.ok(html.includes(site.esc(c.basic.name)) && html.includes(site.esc(c.skill.name)) && html.includes(site.esc(c.ult.name)), `kit ${id}`);
    if (info && info.story && info.story.length) {
      assert.ok(html.includes(site.esc(info.story[0].text.split('\n')[0].replace(/^#/, '').trim().slice(0, 25))), `story ${id}`);
    }
    if (H.Eidolons && H.Eidolons.has(id)) {
      assert.ok(html.includes(site.esc(H.Eidolons.SCENES[id].frags[0][0])), `eidolon scene ${id}`);
    }
  }
  const trailHtml = site.renderSite(`${BASE}/char?id=trail`);
  assert.ok(trailHtml.includes(site.esc(H.CHARS.trail_p.ult.name)), 'Trailblazer dossier includes Preservation kit');
});

test('Atlas and Library render all maps and readable documents with ASCII maps and full texts', () => {
  const maps = site.mapIds();
  assert.equal(maps.length, Object.keys(H.MAPS).length);
  const docs = site.docIds();
  assert.equal(docs.length, Object.keys(H.DOCS).length);
  const indexHtml = site.renderSite(`${BASE}/atlas`);
  for (const id of maps) {
    const m = H.MAPS[id];
    assert.ok(indexHtml.includes(`${BASE}/atlas?map=${id}`), `atlas index lists ${id}`);
    const html = site.renderSite(`${BASE}/atlas?map=${id}`);
    assert.ok(html.includes(site.esc(m.name)) && html.includes('hwk-map-ascii') && html.includes(`data-aw-map="${id}"`), `map ${id}`);
    const ascii = site.renderAsciiMap(m);
    assert.equal(ascii.split('\n').length, m.rows.length, `ascii height matches map rows for ${id}`);
  }
  for (const id of docs) {
    const d = H.DOCS[id];
    assert.ok(indexHtml.includes(`${BASE}/doc?id=${id}`), `atlas index lists doc ${id}`);
    const html = site.renderSite(`${BASE}/doc?id=${id}`);
    assert.ok(html.includes(site.esc(d.title)) && html.includes('hwk-doc-pre'), `doc ${id}`);
  }
});

test('map pages read chests, anchors, residents, patrols, exits and notes from the real map layout', () => {
  for (const id of site.mapIds()) {
    const m = H.MAPS[id];
    const s = site.mapStats(id);
    const chestCells = m.rows.join('').split('').filter(ch => ch === 'c' && !m.marks.c && !H.TILES[ch]).length;
    assert.equal(s.chests, chestCells, `chests on ${id}`);
    const expectedDocs = Object.entries(m.marks).filter(([ch, mk]) => mk.doc && m.rows.some(r => r.includes(ch))).length;
    assert.equal(s.docs, expectedDocs, `docs on ${id}`);
    const html = site.renderSite(`${BASE}/atlas?map=${id}`);
    for (const did of s.docList) assert.ok(html.includes(`${BASE}/doc?id=${did}`), `${id} links its note ${did}`);
    for (const e of s.ents.filter(x => x.kind === 'exit' && H.MAPS[x.def.to])) assert.ok(html.includes(`${BASE}/atlas?map=${e.def.to}`), `${id} links exit ${e.def.to}`);
  }
  const base = site.mapStats('hs_base');
  assert.ok(base.chests >= 1 && base.anchors >= 1 && base.npcs >= 1 && base.foes >= 1 && base.exits >= 1, 'hs_base has chests, anchors, residents, patrols and exits');
  const docId = base.docList[0];
  assert.ok(site.docPlaces(docId).includes('hs_base'));
  assert.ok(site.renderSite(`${BASE}/doc?id=${docId}`).includes(`${BASE}/atlas?map=hs_base`), 'note page says where to find it');
});

test('each page type keeps its own layout: gallery, paper, book, terminal, debate, price list, timeline', () => {
  assert.ok(site.renderSite(`${BASE}/chars`).includes('hwk-gallery'));
  assert.ok(site.renderSite(`${BASE}/chars?view=table`).includes('hwk-table'));
  const kinds = { paper: 'hwk-paper', book: 'hwk-book', screen: 'hwk-screen' };
  for (const [kind, cls] of Object.entries(kinds)) {
    const id = site.docIds().find(d => H.DOCS[d].kind === kind);
    assert.ok(site.renderSite(`${BASE}/doc?id=${id}`).includes(cls), `${kind} note uses ${cls}`);
  }
  assert.ok(site.renderSite(`${BASE}/themes`).includes('hwk-debate'));
  assert.ok(site.renderSite(`${BASE}/quests`).includes('hwk-price'));
  assert.ok(site.renderSite(`${BASE}/world?id=${D.worlds[0].id}`).includes('hwk-timeline'));
  assert.ok(site.renderSite(`${BASE}/puzzle?id=${D.puzzles[0].id}`).includes('hwk-ink'));
  const groups = site.charGroups();
  assert.equal(groups.reduce((n, g) => n + g.ids.length, 0), site.characterIds().length, 'every character sits in exactly one gallery group');
});

test('quest checklist stores per-step ticks in the browser', () => {
  const qid = Object.keys(H.QUESTS).find(k => H.QUESTS[k].steps);
  const step = Object.keys(H.QUESTS[qid].steps)[0];
  site.setCheck(qid, step, true);
  assert.ok(site.renderSite(`${BASE}/quest?id=${qid}`).includes(`data-aw-step="${step}" checked`));
  site.setCheck(qid, step, false);
  assert.ok(!site.renderSite(`${BASE}/quest?id=${qid}`).includes(`data-aw-step="${step}" checked`));
});

test('Quests, puzzles, rumors, and artifacts portals render all game entries', () => {
  const questsHtml = site.renderSite(`${BASE}/quests`);
  for (const m of H.TRAIL_MISSIONS) assert.ok(questsHtml.includes(site.esc(m.name)), `trail mission ${m.id}`);
  for (const [qid, q] of Object.entries(H.QUESTS)) assert.ok(questsHtml.includes(site.esc(q.name)), `side quest ${qid}`);
  for (const r of H.RUMORS) assert.ok(questsHtml.includes(site.esc(r.title)), `rumor ${r.id}`);
  for (const p of D.puzzles) {
    assert.ok(questsHtml.includes(site.esc(p.title)), `puzzle ${p.id}`);
    const pzHtml = site.renderSite(`${BASE}/puzzle?id=${p.id}`);
    assert.ok(pzHtml.includes(site.esc(p.reward)), `puzzle article ${p.id}`);
  }
  const appraisalHtml = site.renderSite(`${BASE}/puzzle?id=puz_appraisal`);
  assert.ok(appraisalHtml.includes('Полная таблица показаний Оценивающего пистолета'), 'Appraisal Pistol table rendered');
  const artHtml = site.renderSite(`${BASE}/artifacts`);
  for (const c of Object.values(H.CONES)) assert.ok(artHtml.includes(site.esc(c.name)), `cone ${c.name}`);
  for (const r of Object.values(H.RELIC_SETS)) assert.ok(artHtml.includes(site.esc(r.name)), `relic ${r.name}`);
  for (const f of Object.values(H.FUSIONS)) assert.ok(artHtml.includes(site.esc(f.name)), `fusion ${f.name}`);
  for (const o of Object.values(H.OUTFITS)) assert.ok(artHtml.includes(site.esc(o.name)), `outfit ${o.name}`);
});

test('interactive features: WikiLinks, search, spoiler toggle, user edits, talk page, and save sync', () => {
  const parsed = site.formatWikiText('См. [[world:w_belobog_over|Ярило-VI]] и [[char:march|Март 7]].');
  assert.ok(parsed.includes(`data-url="${BASE}/world?id=w_belobog_over"`) && parsed.includes(`data-url="${BASE}/char?id=march"`));

  const searchResults = site.searchArticles('Коколия');
  assert.ok(searchResults.length >= 2 && searchResults.some(r => r.title.includes('Коколия')));

  assert.equal(site.spoilersOpen(), false);
  const charClosed = site.renderSite(`${BASE}/char?id=march`);
  assert.ok(charClosed.includes('display:none;'));
  site.setSpoilersOpen(true);
  const charOpen = site.renderSite(`${BASE}/char?id=march`);
  assert.ok(!charOpen.includes('display:none;'));
  site.setSpoilersOpen(false);

  const pageId = 'sys:paths_aeons';
  assert.equal(site.getCustomNote(pageId), null);
  const saved = site.saveCustomNote(pageId, 'Архивариус_Тест', 'Первая строка.\nСм. [[world:w_station|Станцию Герта]].');
  assert.ok(saved && saved.author === 'Архивариус_Тест');
  const editedHtml = site.renderSite(`${BASE}/system?id=paths_aeons`);
  assert.ok(editedHtml.includes('Пользовательское дополнение к статье') && editedHtml.includes('Первая строка.'));
  const histHtml = site.renderSite(`${BASE}/system?id=paths_aeons&mode=history`);
  assert.ok(histHtml.includes('Архивариус_Тест'));
  site.clearCustomNote(pageId);
  assert.equal(site.getCustomNote(pageId), null);

  assert.equal(site.addTalkPost(pageId, '', 'текст'), null);
  const talk = site.addTalkPost(pageId, 'Читатель<script>', 'Интересно про [[sys:stellaron_fragmentum|Стелларон]]!');
  assert.ok(talk);
  const talkHtml = site.renderSite(`${BASE}/system?id=paths_aeons&mode=talk`);
  assert.ok(talkHtml.includes('Читатель&lt;script&gt;') && talkHtml.includes(`data-url="${BASE}/system?id=stellaron_fragmentum"`));

  storage.set('win98_hsr98_save_v3', JSON.stringify({
    name: 'Келус',
    tl: 45,
    chars: { march: { lvl: 40 }, danheng: { lvl: 40 }, trail: { lvl: 40 } },
    chests: { c1: 1, c2: 1 },
    quests: { q1: 2, q2: 2 }
  }));
  const syncHome = site.renderSite(BASE);
  assert.ok(syncHome.includes('Бортовой журнал синхронизирован: Келус') && syncHome.includes(`45 / ${H.TL_MAX}`));
  storage.delete('win98_hsr98_save_v3');
});

test('every link on every page resolves and every page obeys Web 1.0 and project rules', () => {
  const knownExternal = new Set(['hsr', 'kovcheg', 'steam', 'interpedia']);
  for (const url of sampleUrls) {
    const html = site.renderSite(url);
    assert.ok(!/undefined|NaN|\[object Object\]/.test(html), `no broken values on ${url}`);
    if (!url.includes('mode=edit')) {
      assert.ok(!html.includes('[['), `no unresolved WikiLinks on ${url}`);
    }
    assert.ok(!EMOJI.test(html), `no emoji on ${url}`);
    assert.ok(!/\bMicrosoft\b|\bWindows\b/i.test(html), `no forbidden names on ${url}`);
    assert.ok(!html.includes('—'), `no em-dash on ${url}`);
    assert.ok(!/class="[^"]*\baw-/.test(html), `no .aw-* CSS class collision on ${url}`);
    for (const m of html.matchAll(/<canvas[^>]*width="(\d+)"[^>]*height="(\d+)"[^>]*data-aw-art="([^"]+)"/g)) {
      const cv = makeCanvas(Number(m[1]), Number(m[2]));
      cv.dataset.awArt = m[3];
      site.paintArt(cv);
      assert.ok(cv.dataset.art, `paintArt assigned art for ${m[3]} on ${url}`);
    }
    for (const m of html.matchAll(/data-url="([^"]+)"/g)) {
      const target = m[1];
      const key = ie.identifyPageKey(target);
      if (key === 'hsrwiki') {
        assert.notEqual(site.parseUrl(target).view, 'missing', `dead internal link ${target} on ${url}`);
      } else {
        assert.ok(knownExternal.has(key), `unexpected external link ${target} on ${url}`);
      }
    }
  }
});

test('CSS uses .hwk-* namespace with zero .aw-* collisions, only 216 web-safe hex colors, zero modern CSS properties, and zero comments', () => {
  const css = read('css/apps/hsr-wiki.css');
  assert.ok(!css.includes('.aw-'), 'zero .aw-* selectors in hsr-wiki.css');
  for (const prop of ['border-radius', 'box-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition', 'opacity']) {
    assert.ok(!css.includes(prop), `forbidden CSS property ${prop}`);
  }
  const safe = h => /^#([0369cf])\1([0369cf])\2([0369cf])\3$/i.test(h);
  const js = read('js/apps/hsr-wiki-data.js') + read('js/apps/hsr-wiki-site.js');
  const off = [...new Set([...(css.match(/#[0-9a-f]{6}\b/gi) || []), ...(js.match(/#[0-9a-f]{6}\b/gi) || [])])].filter(h => !safe(h));
  assert.deepEqual(off, [], 'only 216 web-safe hex colors used');

  const commentRe = new RegExp('\\/\\*|\\*\\/|^[ \\t]*\\/\\/|[^:\\\\]\\/\\/ |<' + '!--', 'm');
  for (const f of ['css/apps/hsr-wiki.css', 'js/apps/hsr-wiki-data.js', 'js/apps/hsr-wiki-site.js', 'tests/hsr-wiki-site.test.js']) {
    const raw = read(f);
    const stripped = raw.replace(/https?:\/{2}/g, '');
    assert.ok(!commentRe.test(stripped), `zero comments in ${f}`);
    assert.ok(!/\bMicrosoft\b|\bWindows\b/.test(raw.replace(/WINDOWS|'Microsoft Sans Serif'/g, '')), `no forbidden names in ${f}`);
  }
});

console.log(`\nALL ${passed} ASTRALWIKI 98 TESTS PASSED!`);
