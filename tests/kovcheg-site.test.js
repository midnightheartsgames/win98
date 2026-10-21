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

let lastSteam = null;
const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

global.window = {
  isOnline: true,
  addEventListener: () => {},
  webGif: name => `<span class="gif-${name}"></span>`,
  getIcon: name => `<svg data-icon="${name}"></svg>`,
  soundSys: { playClick: () => {}, playDing: () => {}, playError: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) },
  vfs: { mkdir: () => {}, writeFile: () => true }
};

eval(read('js/game-manager.js'));
window.gameManager.showInSteam = id => { lastSteam = id; };
eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/ie.js'));

const bench = require(path.join(root, 'tools/kovcheg-bench.cjs'));
const H = bench.H;
eval(read('js/apps/kovcheg-data.js'));
eval(read('js/apps/kovcheg-hsr.js'));
eval(read('js/apps/kovcheg-hsr-bench.js'));
eval(read('js/apps/kovcheg-hsr-guides.js'));
eval(read('js/apps/kovcheg-hsr-articles.js'));
eval(read('js/apps/kovcheg-site.js'));
eval(read('js/apps/kovcheg-site-ref.js'));
eval(read('js/apps/kovcheg-sim.js'));
eval(read('js/apps/kovcheg-site-builder.js'));
eval(read('js/apps/kovcheg-site-guest.js'));
eval(read('js/apps/kovcheg-site-mine.js'));

const ie = window.appIE;
const site = window.kovchegSite;
const D = window.kovchegData;
const K = window.kovchegHsr;
const R = window.kovchegBench;
const base = 'http://www.kovcheg98.ru';
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

const links = html => [...html.matchAll(/data-url="([^"]+)"/g)].map(m => m[1]);
const pages = [base, base + '/', base + '/hsr98/', base + '/hsr98', base + '/hsr98/index.html', base + '/hsr98/tier', base + '/hsr98/tier?mode=boss&cone=std', base + '/hsr98/tier?mode=su', base + '/hsr98/tier?mode=start&rar=4', base + '/hsr98/tier?free=1&path=hunt', base + '/hsr98/crew', base + '/hsr98/crew?sort=tier&role=amp', base + '/hsr98/char?id=seele', base + '/hsr98/char?id=trail', base + '/hsr98/char?id=lynx', base + '/hsr98/teams', base + '/hsr98/teams?arch=dot', base + '/hsr98/team?id=seele_wings', base + '/hsr98/team?id=free_express', base + '/about', base + '/hsr98/hall', base + '/hsr98/hall?stage=12', base + '/hsr98/su?world=3', base + '/hsr98/bosses', base + '/hsr98/bosses?id=gepard_b', base + '/hsr98/guide', base + '/hsr98/guide?id=pulls', base + '/hsr98/cones', base + '/hsr98/relics', base + '/hsr98/fusions', base + '/hsr98/banners', base + '/hsr98/builder', base + '/hsr98/builder?team=seele,silverwolf,bronya,lynx&goal=h12-2', base + '/guestbook', base + '/hsr98/mycrew', base + '/nowhere'];

test('routes resolve to their views', () => {
  assert.strictEqual(site.parseUrl(base).view, 'home');
  assert.strictEqual(site.parseUrl(base + '/').view, 'home');
  assert.strictEqual(site.parseUrl('www.kovcheg98.ru/hsr98/').view, 'hub');
  assert.strictEqual(site.parseUrl(base + '/HSR98/index.html').view, 'hub');
  for (const p of Object.keys(D.sections)) {
    const r = site.parseUrl(base + p + '?id=seele');
    assert.strictEqual(r.view, 'soon', p);
    assert.strictEqual(r.title, D.sections[p]);
  }
  assert.strictEqual(site.parseUrl(base + '/hsr98/nothing').view, 'missing');
  assert.strictEqual(site.parseUrl(base + '/hsr98/char').params.id, undefined);
  assert.strictEqual(site.parseUrl(base + '/hsr98/char?id=seele&x=1').params.id, 'seele');
});

test('IE routes the site and does not swallow other sites', () => {
  for (const u of pages) assert.strictEqual(ie.identifyPageKey(u), 'kovcheg', u);
  for (const u of ['http://hsr.hoyoverse.com', 'http://www.gsc-game.com', 'http://www.search98.com', 'http://www.interpedia.org']) assert.notStrictEqual(ie.identifyPageKey(u), 'kovcheg', u);
  assert.strictEqual(ie.getPageTitle('kovcheg'), 'Ковчег: гайды и тир-листы');
  assert.ok(!ie.favorites.some(([u]) => u === base), 'Favorites keep only the three portal sites');
  const portals = ie.searchDirectory.find(c => c.title === 'Поиск и порталы');
  assert.ok(portals && portals.sites.some(([u]) => u === base), 'listed in «Поиск и порталы»');
  for (const q of ['тир-лист', 'гайд по зеле', 'кого крутить', 'ковчег']) assert.ok(ie.performSearch(q).some(r => r.url === base), q);
});

test('home page: pier, log, poll, counter', () => {
  const html = site.renderSite(base);
  for (const g of D.games) {
    assert.ok(window.gameManager.catalog[g.id], 'game exists in the catalog ' + g.id);
    assert.ok(html.includes(site.esc(window.gameManager.catalog[g.id].title)), 'pier shows ' + g.id);
  }
  assert.ok(D.games.filter(g => g.open).length === 1 && D.games.find(g => g.open).id === 'hsr98');
  for (const e of D.log) assert.ok(html.includes(e.date));
  assert.ok(html.includes('name="kv-poll"'));
  assert.ok(html.includes('kv-counter'));
  const dates = D.log.map(e => e.date.split('.').reverse().join(''));
  assert.deepStrictEqual(dates.slice().sort().reverse(), dates, 'log is newest first');
  assert.strictEqual(D.log[0].date, D.updated);
  assert.strictEqual(D.log[D.log.length - 1].date, D.opened);
});

test('poll keeps the vote and lets you vote again', () => {
  localStorage.setItem(site.pollKey, 'kafka');
  let html = site.renderSite(base);
  const total = D.poll.options.reduce((a, o) => a + o.votes, 0) + 1;
  assert.ok(html.includes('Всего голосов: ' + total));
  assert.ok(html.includes('Кафка <b>(ваш)</b>'));
  localStorage.setItem(site.pollKey, '');
  html = site.renderSite(base);
  assert.ok(html.includes('data-kv-poll="1"'));
});

const fakeContainer = (els = {}) => ({
  scrollTop: 0,
  querySelector: sel => (els[sel] && els[sel][0]) || null,
  querySelectorAll: sel => els[sel] || []
});

test('visit counter counts the home page once per session', () => {
  localStorage.removeItem(site.hitsKey);
  site.hitCounted = false;
  const before = site.visits();
  site.attachEvents({}, fakeContainer(), { currentUrl: base, renderPage: () => {} });
  site.attachEvents({}, fakeContainer(), { currentUrl: base, renderPage: () => {} });
  assert.strictEqual(site.visits(), before + 1);
});

test('hub shows live game data, leaders from the bench and every banner', () => {
  const html = site.renderSite(base + '/hsr98/');
  assert.ok(html.includes('версия ' + site.gameVersion(H)) && site.gameVersion(H) === '1.5');
  assert.ok(html.includes('персонажей ' + Object.keys(H.CHARS).length));
  assert.ok(html.includes('Слияний ' + Object.keys(H.FUSIONS).length));
  const rows = site.banners(H);
  for (const key of ['ev', 'std', 'sig', 'conv', 'guild', 'mid', 'con']) assert.ok(rows.some(r => r.key === key), 'banner ' + key);
  assert.ok(!rows.some(r => ['cone', 'amp', 'forge', 'wiz', 'comp', 'alley'].includes(r.key)), 'cone banners are not listed');
  for (const r of rows) {
    assert.ok(html.includes(site.esc(r.name)) && html.includes(site.esc(r.pass)), 'banner row ' + r.key);
    for (const id of r.five) assert.ok(H.CHARS[id], id);
  }
  const lead = site.leaders();
  assert.strictEqual(lead.length, 4);
  for (const l of lead) {
    const sc = R.scores.hall.sig[l.col.id];
    assert.strictEqual(sc[l.id], Math.max(...Object.values(sc)), 'leader of ' + l.col.id);
    assert.ok(html.includes('data-kv-art="bust:' + l.id + '"'));
  }
  for (const h of D.hatches) assert.ok(html.includes(base + h.path));
});

test('steam button opens HSR 98 in Steam', () => {
  const handlers = [];
  const btn = { dataset: { kvSteam: 'hsr98' }, addEventListener: (t, fn) => handlers.push(fn) };
  site.attachEvents({}, fakeContainer({ '[data-kv-steam]': [btn] }), { currentUrl: base + '/hsr98/', renderPage: () => {} });
  handlers[0]({ preventDefault: () => {} });
  assert.strictEqual(lastSteam, 'hsr98');
});

test('every link goes somewhere real', () => {
  const known = new Set(['hsr']);
  for (const u of pages) {
    const html = site.renderSite(u);
    for (const l of links(html)) {
      const key = ie.identifyPageKey(l);
      if (key === 'kovcheg') assert.notStrictEqual(site.parseUrl(l).view, 'missing', 'dead link ' + l + ' on ' + u);
      else assert.ok(known.has(key), 'unknown external link ' + l);
    }
  }
});

test('missing page escapes the address', () => {
  const html = site.renderSite(base + '/<script>alert(1)</script>');
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('Такого на борту нет'));
});

test('Web 1.0 rules and project text rules', () => {
  for (const u of pages) {
    const html = site.renderSite(u);
    assert.ok(!EMOJI.test(html), 'emoji on ' + u);
    assert.ok(!/\bMicrosoft\b|\bWindows\b/i.test(html), 'forbidden names on ' + u);
    assert.ok(!html.includes('—'), 'em dash on ' + u);
  }
  const css = read('css/apps/kovcheg.css');
  for (const prop of ['border-radius', 'box-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition', 'opacity']) assert.ok(!css.includes(prop), 'forbidden CSS ' + prop);
  const safe = h => /^#([0369cf])\1([0369cf])\2([0369cf])\3$/i.test(h);
  const js = read('js/apps/kovcheg-site.js') + read('js/apps/kovcheg-site-ref.js') + read('js/apps/kovcheg-site-builder.js') + read('js/apps/kovcheg-site-guest.js') + read('js/apps/kovcheg-site-mine.js');
  const off = [...new Set([...(css.match(/#[0-9a-f]{6}\b/gi) || []), ...(js.match(/#[0-9a-f]{6}\b/gi) || [])])].filter(h => !safe(h));
  assert.deepStrictEqual(off, [], 'only the 216 web-safe colours');
  for (const f of ['js/apps/kovcheg-site.js', 'js/apps/kovcheg-site-ref.js', 'js/apps/kovcheg-sim.js', 'js/apps/kovcheg-site-builder.js', 'js/apps/kovcheg-site-guest.js', 'js/apps/kovcheg-site-mine.js', 'js/apps/kovcheg-data.js', 'js/apps/kovcheg-hsr.js', 'js/apps/kovcheg-hsr-guides.js', 'js/apps/kovcheg-hsr-articles.js', 'tools/kovcheg-bench.cjs', 'tests/kovcheg-site.test.js']) {
    const src = read(f).replace(/https?:\/{2}/g, '');
    assert.ok(!/\/\*|\*\/|^\s*\/\/|[^:\\]\/\/\s/m.test(src), 'zero comments in ' + f);
    assert.ok(!/\bMicrosoft\b|\bWindows\b/.test(read(f).replace(/WINDOWS|'Microsoft Sans Serif'/g, '')), 'forbidden names in ' + f);
  }
  assert.ok(!/\/\*|\*\//.test(css), 'zero comments in kovcheg.css');
  for (const t of [...D.log.map(e => e.text), ...Object.values(K.BOT_NOTES), ...D.hatches.map(h => h.text), ...D.games.map(g => g.note)]) assert.ok(!t.includes('—'), 'em dash: ' + t);
});

test('index.html loads the site after the HSR 98 site and data before render', () => {
  const index = read('index.html');
  const at = f => index.indexOf(f);
  for (const f of ['css/apps/kovcheg.css', 'js/apps/kovcheg-data.js', 'js/apps/kovcheg-hsr.js', 'js/apps/kovcheg-hsr-bench.js', 'js/apps/kovcheg-site.js']) assert.ok(at(f) > 0, f);
  assert.ok(at('js/apps/kovcheg-hsr-bench.js') < at('js/apps/kovcheg-hsr-guides.js') && at('js/apps/kovcheg-hsr-guides.js') < at('js/apps/kovcheg-site.js'));
  assert.ok(at('js/apps/kovcheg-hsr-guides.js') < at('js/apps/kovcheg-hsr-articles.js') && at('js/apps/kovcheg-hsr-articles.js') < at('js/apps/kovcheg-site.js') && at('js/apps/kovcheg-site.js') < at('js/apps/kovcheg-site-ref.js') && at('js/apps/kovcheg-site-ref.js') < at('js/apps/kovcheg-sim.js') && at('js/apps/kovcheg-sim.js') < at('js/apps/kovcheg-site-builder.js') && at('js/apps/kovcheg-site-builder.js') < at('js/apps/kovcheg-site-guest.js') && at('js/apps/kovcheg-site-guest.js') < at('js/apps/kovcheg-site-mine.js'));
  assert.ok(at('js/apps/hsr-site.js') < at('js/apps/kovcheg-data.js'));
  assert.ok(at('js/apps/kovcheg-data.js') < at('js/apps/kovcheg-hsr.js') && at('js/apps/kovcheg-hsr.js') < at('js/apps/kovcheg-hsr-bench.js') && at('js/apps/kovcheg-hsr-bench.js') < at('js/apps/kovcheg-site.js'));
});

test('site data covers every character and the bench is complete', () => {
  const ids = Object.keys(H.CHARS);
  const cols = new Set(K.COLUMNS.map(c => c.id));
  for (const id of ids) {
    const c = K.CHARS[id];
    assert.ok(c, 'site data for ' + id);
    assert.ok(c.cols.length >= 1 && c.cols.length <= 2 && c.cols.every(x => cols.has(x)), 'columns of ' + id);
    assert.ok(K.PRESETS[c.build], 'build of ' + id);
    if (c.cols.includes('dps')) assert.ok(H.SU.PATHS[c.su], 'SU path of ' + id);
    if (c.cols.includes('dps')) for (const k of ['best', 'std', 'free']) for (const cone of ['sig', 'std']) for (const mode of ['hall', 'boss']) {
      const t = R.chars[id].teams[k][cone][mode];
      assert.ok(t && t.team.length === 4 && t.team[0] === id && new Set(t.team).size === 4 && t.team.every(x => H.CHARS[x]), 'team ' + id + ' ' + k + ' ' + cone + ' ' + mode);
      assert.ok(t[mode].cyc > 0, 'measured ' + id);
    }
  }
  assert.deepStrictEqual(Object.keys(K.CHARS).sort(), ids.slice().sort());
  assert.ok(K.FREE.every(id => H.CHARS[id]));
  for (const id of Object.keys(K.BOT_NOTES)) assert.ok(H.CHARS[id], 'bot note for ' + id);
  const tierIds = new Set(K.TIERS.map(t => t.id));
  for (const mode of K.MODES.map(m => m.id)) for (const cone of ['sig', 'std']) for (const col of cols) {
    const placed = R.tiers[mode][cone][col];
    const expect = ids.filter(id => K.CHARS[id].cols.includes(col));
    assert.deepStrictEqual(Object.keys(placed).sort(), expect.sort(), 'tier list ' + mode + ' ' + cone + ' ' + col);
    assert.ok(Object.values(placed).every(t => tierIds.has(t)));
  }
});

test('tier list shows every placement in every mode and cone', () => {
  const ids = Object.keys(H.CHARS);
  for (const mode of K.MODES.map(m => m.id)) for (const cone of ['sig', 'std']) {
    const html = site.renderSite(base + '/hsr98/tier?mode=' + mode + '&cone=' + cone);
    const cards = (html.match(/data-kv-art="card:/g) || []).length;
    const expect = ids.reduce((a, id) => a + K.CHARS[id].cols.length, 0);
    assert.strictEqual(cards, expect, 'cards ' + mode + ' ' + cone);
    for (const t of K.TIERS) assert.ok(html.includes('kv-tl kv-tier-' + t.id + '">' + t.name + '<'), 'tier row ' + t.id);
    for (const c of K.COLUMNS) assert.ok(html.includes('>' + c.name + '</th>'), 'column ' + c.id);
  }
  assert.ok(site.renderSite(base + '/hsr98/tier?mode=start').includes('переключатель не действует'));
  assert.strictEqual(site.parseUrl(base + '/hsr98/tier').view, 'tier');
  assert.strictEqual(site.tierQuery({ mode: 'zzz', cone: 'x', rar: '3', path: 'nope', free: '2' }).mode, 'hall');
});

test('tier filters keep only matching characters', () => {
  const cardIds = html => [...html.matchAll(/data-kv-art="card:([a-z_]+)"/g)].map(m => m[1]);
  let ids = cardIds(site.renderSite(base + '/hsr98/tier?rar=4'));
  assert.ok(ids.length && ids.every(id => H.CHARS[id].rarity === 4));
  ids = cardIds(site.renderSite(base + '/hsr98/tier?path=hunt&mode=boss'));
  assert.ok(ids.length && ids.every(id => H.CHARS[id].path === 'hunt'));
  ids = cardIds(site.renderSite(base + '/hsr98/tier?free=1'));
  assert.ok(ids.length && ids.every(id => K.FREE.includes(id)));
  const none = site.renderSite(base + '/hsr98/tier?free=1&rar=5&path=harmony');
  assert.strictEqual(cardIds(none).length, 0);
  assert.ok(none.includes('Никого не нашлось'));
});

test('tier filter form navigates with the chosen values', () => {
  const handlers = [];
  let went = null;
  const els = {
    '[data-kv-filter]': [{ dataset: {}, addEventListener: (t, fn) => handlers.push(fn) }],
    '[data-kv-f="rar"]': [{ value: '5' }],
    '[data-kv-f="path"]': [{ value: 'nihility' }],
    '[data-kv-f="free"]': [{ checked: false }]
  };
  site.attachEvents({}, fakeContainer(els), { currentUrl: base + '/hsr98/tier?mode=boss&cone=std', renderPage: () => {}, navigate: (w, u) => { went = u; } });
  handlers[0]({ preventDefault: () => {} });
  assert.strictEqual(went, base + '/hsr98/tier?mode=boss&cone=std&rar=5&path=nihility');
});

test('editorial shifts and tags follow the rules', () => {
  const order = K.TIERS.map(t => t.id);
  for (const a of K.ADJUST) {
    assert.ok(H.CHARS[a.id] && K.CHARS[a.id].cols.includes(a.col) && K.MODES.some(m => m.id === a.mode), 'adjust target ' + a.id);
    assert.ok(Math.abs(a.shift) >= 1 && Math.abs(a.shift) <= 2 && a.reason.length > 40, 'adjust size and reason ' + a.id);
    for (const cone of ['sig', 'std']) {
      const was = order.indexOf(R.tiers[a.mode][cone][a.col][a.id]);
      const now = order.indexOf(site.placement(a.mode, cone, a.col)[a.id]);
      assert.strictEqual(now, Math.max(0, Math.min(order.length - 1, was - a.shift)), 'adjust applied ' + a.id);
    }
  }
  for (const id of Object.keys(H.CHARS)) {
    const tags = K.CHARS[id].tags;
    assert.ok(tags.length >= 1 && tags.length <= 2 && tags.every(t => K.TAGS[t] && t !== 'spp' && t !== 'spm'), 'tags of ' + id);
    const shown = site.tagsFor(id);
    const sp = R.chars[id].sp.turn;
    assert.ok(shown.length <= 3);
    assert.strictEqual(shown.includes('spp'), sp >= K.SP_TAG.plus, 'SP+ tag ' + id);
    assert.strictEqual(shown.includes('spm'), sp <= K.SP_TAG.minus, 'SP- tag ' + id);
  }
  const dates = K.TIER_LOG.map(e => e.date.split('.').reverse().join(''));
  assert.deepStrictEqual(dates.slice().sort().reverse(), dates, 'tier log is newest first');
  for (const t of [...K.ADJUST.map(a => a.reason), ...K.TIER_LOG.map(e => e.text), ...Object.values(K.TAGS).map(t => t.text)]) assert.ok(!t.includes('—'), 'em dash: ' + t);
});

test('tier card tooltips carry the measured numbers', () => {
  const html = site.renderSite(base + '/hsr98/tier');
  const t = R.chars.seele.teams.best.sig.hall;
  assert.ok(html.includes('Зал: ' + site.num(t.hall.cyc) + ' цикла'), 'Seele hall number');
  assert.ok(html.includes('Вклад четвёртого'), 'support tooltip');
  for (const n of Object.keys(K.BOT_NOTES)) assert.ok(html.includes(site.url('/hsr98/char?id=' + n)), 'bot note link ' + n);
});

test('crew list shows everyone, filters and sorts', () => {
  const rowsOf = html => [...html.matchAll(/class="kv-crew-pic"><a data-url="[^"]*char\?id=([a-z_]+)"/g)].map(m => m[1]);
  const all = rowsOf(site.renderSite(base + '/hsr98/crew'));
  assert.deepStrictEqual(all.slice().sort(), Object.keys(H.CHARS).sort());
  const names = all.map(id => site.charName(id));
  assert.deepStrictEqual(names, names.slice().sort((a, b) => a.localeCompare(b, 'ru')), 'sorted by name');
  let ids = rowsOf(site.renderSite(base + '/hsr98/crew?elem=ice&rar=5'));
  assert.ok(ids.length && ids.every(id => H.CHARS[id].elem === 'ice' && H.CHARS[id].rarity === 5));
  ids = rowsOf(site.renderSite(base + '/hsr98/crew?role=sus'));
  assert.ok(ids.length && ids.every(id => K.CHARS[id].cols.includes('sus')));
  ids = rowsOf(site.renderSite(base + '/hsr98/crew?sort=tier'));
  const order = K.TIERS.map(t => t.id);
  const tiers = ids.map(id => order.indexOf(site.placement('hall', 'sig', K.CHARS[id].cols[0])[id]));
  assert.deepStrictEqual(tiers, tiers.slice().sort((a, b) => a - b), 'sorted by tier');
  const none = site.renderSite(base + '/hsr98/crew?free=1&rar=5&elem=quant');
  assert.strictEqual(rowsOf(none).length, 0);
  assert.ok(none.includes('Никого не нашлось'));
  assert.ok(site.renderSite(base + '/hsr98/crew?elem=ice&rar=5').includes('Найдено: <b>' + Object.values(H.CHARS).filter(c => c.elem === 'ice' && c.rarity === 5).length + '</b>'));
});

test('crew filter form navigates with the chosen values', () => {
  const handlers = [];
  let went = null;
  const els = {
    '[data-kv-crew]': [{ dataset: {}, addEventListener: (t, fn) => handlers.push(fn) }],
    '[data-kv-c="rar"]': [{ value: '' }],
    '[data-kv-c="path"]': [{ value: 'hunt' }],
    '[data-kv-c="elem"]': [{ value: 'ice' }],
    '[data-kv-c="role"]': [{ value: '' }],
    '[data-kv-c="free"]': [{ checked: true }]
  };
  site.attachEvents({}, fakeContainer(els), { currentUrl: base + '/hsr98/crew?sort=rar', renderPage: () => {}, navigate: (w, u) => { went = u; } });
  handlers[0]({ preventDefault: () => {} });
  assert.strictEqual(went, base + '/hsr98/crew?path=hunt&elem=ice&free=1&sort=rar');
});

test('every character has a full dossier built from game data', () => {
  for (const id of Object.keys(H.CHARS)) {
    const c = H.CHARS[id];
    const html = site.renderSite(base + '/hsr98/char?id=' + id);
    assert.ok(html.includes('ЛИЧНОЕ ДЕЛО №'), 'dossier ' + id);
    for (const ab of [c.basic, c.skill, c.ult, c.enhanced, c.tech].filter(Boolean)) assert.ok(html.includes(site.esc(ab.name)), 'ability ' + id + ' ' + ab.name);
    assert.ok(html.includes(site.esc(c.talent)), 'talent ' + id);
    assert.ok(site.sources(id).length >= 1, 'where to get ' + id);
    for (const f of Object.values(H.FUSIONS).filter(x => x.members.includes(id))) assert.ok(html.includes(site.esc(f.name)), 'fusion ' + id + ' ' + f.name);
    for (const m of [...html.matchAll(/data-kv-jump="([^"]+)"/g)].map(x => x[1])) assert.ok(html.includes('id="' + m + '"'), 'toc target ' + id + ' ' + m);
    for (const row of site.abilityRows(id)) assert.ok(row[2] && !/undefined|NaN/.test(row[2]), 'ability text ' + id + ' ' + row[0]);
    assert.ok(!/undefined|NaN/.test(html.replace(/<[^>]+>/g, ' ')), 'no undefined on ' + id);
    const sig = Object.keys(H.CONES).find(k => H.CONES[k].sig === id);
    if (sig) assert.ok(html.includes(site.esc(H.CONES[sig].name)), 'signature cone ' + id);
    assert.ok(html.includes(site.esc(H.CONES[K.STD_CONE[c.path]].name)), 'standard cone ' + id);
    if (K.CHARS[id].cols.includes('dps')) assert.ok(html.includes(site.num(R.chars[id].teams.best.sig.hall.hall.cyc) + '</td>'), 'team numbers ' + id);
  }
  assert.strictEqual(site.parseUrl(base + '/hsr98/char?id=nobody').view, 'missing');
  assert.strictEqual(site.parseUrl(base + '/hsr98/char').view, 'missing');
  const seele = site.renderSite(base + '/hsr98/char?id=seele');
  assert.ok(seele.includes('квантовый урон 220% атаки'), 'skill numbers are read from the kit');
  assert.ok(site.renderSite(base + '/hsr98/char?id=herta').includes(site.esc(K.SOURCE.herta)));
});

test('table of contents scrolls the IE frame', () => {
  const handlers = [];
  const link = { dataset: { kvJump: 'kv-sec-build' }, addEventListener: (t, fn) => handlers.push(fn) };
  const target = { getBoundingClientRect: () => ({ top: 900 }) };
  const frame = fakeContainer({ '[data-kv-jump]': [link] });
  frame.querySelector = sel => (sel === '#kv-sec-build' ? target : null);
  frame.getBoundingClientRect = () => ({ top: 100 });
  frame.scrollTop = 50;
  site.attachEvents({}, frame, { currentUrl: base + '/hsr98/char?id=seele', renderPage: () => {} });
  handlers[0]({ preventDefault: () => {} });
  assert.strictEqual(frame.scrollTop, 50 + 900 - 100 - 6);
});

test('team database is consistent and measured', () => {
  const arch = new Set(K.ARCHETYPES.map(a => a.id));
  const seen = new Set();
  for (const t of K.TEAMS) {
    assert.ok(!seen.has(t.id), 'unique team id ' + t.id);
    seen.add(t.id);
    assert.ok(arch.has(t.arch), 'archetype of ' + t.id);
    assert.ok(t.members.length === 4 && new Set(t.members).size === 4 && t.members.every(id => H.CHARS[id]), 'members of ' + t.id);
    assert.ok(!(t.members.includes('trail') && t.members.includes('trail_p')), 'one Trailblazer in ' + t.id);
    for (const [slot, list] of Object.entries(t.alts)) {
      assert.ok(+slot >= 0 && +slot < 4, 'alt slot ' + t.id);
      for (const a of list) assert.ok(H.CHARS[a] && !t.members.includes(a), 'alt ' + t.id + ' ' + a);
    }
    if (t.arch === 'free') assert.ok(t.members.every(id => K.FREE.includes(id)) && Object.values(t.alts).flat().every(id => K.FREE.includes(id)), 'free team uses free characters ' + t.id);
    assert.ok(t.fear.length > 40 && !t.fear.includes('—'), 'fear text ' + t.id);
    const r = R.teams[t.id];
    assert.ok(r && r.hall.cyc > 0 && r.boss.cyc > 0 && r.log.length >= 5, 'bench of ' + t.id);
    for (const [slot, list] of Object.entries(t.alts)) assert.deepStrictEqual(r.alts[slot].map(a => a.id), list.filter(a => !(a === 'trail' && t.members.includes('trail_p')) && !(a === 'trail_p' && t.members.includes('trail'))), 'alts measured ' + t.id);
  }
  for (const a of K.ARCHETYPES) assert.ok(K.TEAMS.some(t => t.arch === a.id) && !a.text.includes('—'), 'archetype has teams ' + a.id);
  assert.deepStrictEqual(Object.keys(R.teams).sort(), K.TEAMS.map(t => t.id).sort());
});

test('teams page and team pages render from the bench', () => {
  const list = site.renderSite(base + '/hsr98/teams');
  for (const t of K.TEAMS) {
    assert.ok(list.includes(site.url('/hsr98/team?id=' + t.id)), 'listed ' + t.id);
    const html = site.renderSite(base + '/hsr98/team?id=' + t.id);
    assert.ok(html.includes('Отряд «' + site.esc(t.name) + '»'));
    assert.ok(html.includes(site.num(R.teams[t.id].hall.cyc) + ' цикла'), 'hall number ' + t.id);
    for (const id of t.members) assert.ok(html.includes(site.url('/hsr98/char?id=' + id)), 'member link ' + t.id + ' ' + id);
    for (const f of site.teamFusions(t.members)) assert.ok(html.includes(site.esc(f.name)), 'fusion ' + f.name);
    assert.ok(html.includes('Цикл 1'), 'turn log ' + t.id);
    assert.ok(!/undefined|NaN/.test(html.replace(/<[^>]+>/g, ' ')), 'clean ' + t.id);
  }
  const one = site.renderSite(base + '/hsr98/teams?arch=free');
  assert.ok(one.includes(site.url('/hsr98/team?id=free_hook')) && !one.includes(site.url('/hsr98/team?id=seele_wings')));
  assert.strictEqual(site.parseUrl(base + '/hsr98/team?id=nope').view, 'missing');
  assert.ok(site.renderSite(base + '/hsr98/char?id=lynx').includes(site.url('/hsr98/team?id=seele_wings')), 'dossier lists database teams');
});

test('guide texts follow the template and every token resolves', () => {
  const G = window.kovchegGuides;
  assert.deepStrictEqual(Object.keys(G).sort(), Object.keys(H.CHARS).sort(), 'every character has a guide');
  for (const [id, g] of Object.entries(G)) {
    assert.ok(H.CHARS[id], 'guide for a real character ' + id);
    assert.ok(typeof g.short === 'string' && g.short.length > 80 && g.short.length < 400, 'short of ' + id);
    assert.ok(Array.isArray(g.pros) && g.pros.length >= 3 && g.pros.length <= 5, 'pros of ' + id);
    assert.ok(Array.isArray(g.cons) && g.cons.length >= 2 && g.cons.length <= 4, 'cons of ' + id);
    assert.ok(Array.isArray(g.play) && g.play.length >= 1, 'play of ' + id);
    assert.ok(typeof g.compare === 'string' && g.compare.length > 40, 'compare of ' + id);
    const all = [g.short, ...g.pros, ...g.cons, ...g.play, g.compare];
    for (const t of all) {
      assert.ok(!t.includes('\u2014'), 'em dash in ' + id + ': ' + t);
      assert.ok(!/\bMicrosoft\b|\bWindows\b/.test(t), 'names in ' + id);
      const out = site.renderText(t);
      assert.ok(!out.includes('[[') && !/undefined|NaN/.test(out), 'token in ' + id + ': ' + t);
    }
    const html = site.renderSite(base + '/hsr98/char?id=' + id);
    assert.ok(html.includes('id="kv-sec-short"') && html.includes('id="kv-sec-pros"') && html.includes('id="kv-sec-play"'), 'guide sections on ' + id);
  }
  assert.strictEqual(site.renderText('[[k:seele.skill.0.m]]'), '220%');
  assert.ok(site.renderText('[[zz:1]]').includes('[[?'));
  assert.ok(site.renderText('<b>[[n:seele]]</b>').startsWith('&lt;b&gt;<a'));
});

test('hall stages show enemies, turbulence and the bench squads', () => {
  const keyOf = id => (id === 'trail_p' ? 'trail' : id);
  for (const st of H.FH.STAGES) {
    const pick = R.stages[st.n];
    assert.ok(pick && pick.best && pick.std && pick.free, 'stage picks ' + st.n);
    for (const v of ['best', 'std', 'free']) {
      const x = pick[v];
      assert.strictEqual(x.teams.length, st.nodes.length, 'one team per half ' + st.n + v);
      if (x.teams.length === 2) assert.ok(!x.teams[0].some(a => x.teams[1].map(keyOf).includes(keyOf(a))), 'no repeats across halves ' + st.n + v);
      for (const t of x.teams) for (const id of t) {
        assert.ok(H.CHARS[id], 'stage member ' + id);
        if (v === 'free') assert.ok(K.FREE.includes(id), 'free squad is free ' + st.n + ' ' + id);
      }
    }
    const html = site.renderSite(base + '/hsr98/hall?stage=' + st.n);
    assert.ok(html.includes(site.esc(st.turb.text)), 'turbulence ' + st.n);
    assert.ok(html.includes('kv-stage kv-stage-on">' + st.n + '<'), 'current stage tab ' + st.n);
    for (const node of st.nodes) for (const b of node) for (const w of b.waves) for (const id of w) assert.ok(html.includes(site.esc(H.ENEMIES[id].name)), 'enemy ' + id + ' on ' + st.n);
    assert.ok(html.includes(site.num(pick.best.total) + '</td>'), 'best cycles ' + st.n);
  }
  assert.ok(site.renderSite(base + '/hsr98/hall?stage=99').includes('Этап 15.'));
});

test('universe pages cover every world and blessing path', () => {
  for (const [id, c] of Object.entries(K.CHARS)) if (c.su || c.cols.includes('dps')) assert.ok(H.SU.PATHS[c.su], 'SU path of ' + id);
  for (const w of H.SU.WORLDS) {
    const html = site.renderSite(base + '/hsr98/su?world=' + w.id);
    assert.ok(html.includes(site.esc(w.title)) && html.includes(site.esc(w.bossName)), 'world ' + w.id);
    for (const p of Object.values(H.SU.PATHS)) assert.ok(html.includes(site.esc(p.buffText)), 'path ' + p.name);
    if (w.set) assert.ok(html.includes(site.esc(H.RELIC_SETS[w.set].name)), 'planar set ' + w.id);
  }
});

test('boss pages cover every story boss with notes', () => {
  const list = site.bossList();
  const encs = Object.keys(H.ENCOUNTERS).filter(k => H.ENCOUNTERS[k].boss);
  assert.deepStrictEqual(Object.values(list).flat().map(m => m.enc).sort(), encs.slice().sort(), 'every boss fight is on a page');
  assert.deepStrictEqual(Object.keys(K.BOSS_NOTES).sort(), encs.slice().sort(), 'every boss fight has a note');
  for (const t of Object.values(K.BOSS_NOTES)) assert.ok(!t.includes('\u2014') && t.length > 20, t);
  const index = site.renderSite(base + '/hsr98/bosses');
  for (const id of Object.keys(list)) {
    assert.ok(index.includes('/hsr98/bosses?id=' + id), 'wanted card ' + id);
    const html = site.renderSite(base + '/hsr98/bosses?id=' + id);
    for (const sk of H.ENEMIES[id].skills) assert.ok(html.includes(site.esc(sk.n)), 'skill ' + sk.n);
    for (const m of list[id]) assert.ok(html.includes(site.esc(K.BOSS_NOTES[m.enc])), 'note ' + m.enc);
  }
  const proto = site.renderSite(base + '/hsr98/bosses?id=ks_proto');
  for (const id of K.BOSS_NEED.ks_proto) assert.ok(proto.includes('/hsr98/char?id=' + id), 'required ' + id);
  assert.ok(site.renderSite(base + '/hsr98/bosses?id=cocolia1').includes('бой кончается, когда у босса остаётся 50% HP'));
  assert.strictEqual(site.parseUrl(base + '/hsr98/bosses?id=zzz').view, 'missing');
  assert.strictEqual(site.getPageTitle(base + '/hsr98/bosses?id=ks_proto'), 'Ковчег: босс Прототип Разрушителя');
});

test('articles render with tables and every token resolves', () => {
  const A = window.kovchegArticles;
  const index = site.renderSite(base + '/hsr98/guide');
  for (const id of A.list) {
    const a = A[id];
    assert.ok(index.includes('/hsr98/guide?id=' + id), 'index link ' + id);
    for (const t of [a.title, a.intro, ...a.sections.flatMap(x => [x.h, ...x.p])]) {
      assert.ok(!t.includes('\u2014') && !/\bMicrosoft\b|\bWindows\b/.test(t), 'text rules in ' + id);
      const out = site.renderText(t);
      assert.ok(!out.includes('[[') && !/undefined|NaN/.test(out), 'token in ' + id + ': ' + t);
    }
    const html = site.renderSite(base + '/hsr98/guide?id=' + id);
    assert.strictEqual((html.match(/data-kv-jump="kv-art-/g) || []).length, a.sections.length, 'contents of ' + id);
  }
  assert.strictEqual(site.renderText('[[tu:pity5]]'), String(H.TUNING.pity5));
  assert.strictEqual(site.renderText('[[tup:brokenDelay]]'), site.pct(H.TUNING.brokenDelay));
  assert.ok(site.renderText('[[tu:nothing]]').includes('[[?'));
  const newbie = site.renderSite(base + '/hsr98/guide?id=newbie');
  for (const e of Object.values(H.BREAK_EFFECT)) assert.ok(newbie.includes(e), 'break table ' + e);
  const free = site.renderSite(base + '/hsr98/guide?id=free');
  for (const id of K.FREE) assert.ok(free.includes('/hsr98/char?id=' + id), 'free table ' + id);
  for (const st of D.starters) assert.notStrictEqual(site.parseUrl(base + st.path).view, 'missing', st.path);
  assert.strictEqual(site.parseUrl(base + '/hsr98/guide?id=zzz').view, 'missing');
});

test('reference pages list every cone, relic set, fusion and banner', () => {
  const cones = site.renderSite(base + '/hsr98/cones');
  for (const c of Object.values(H.CONES)) assert.ok(cones.includes(site.esc(c.name)), 'cone ' + c.name);
  const relics = site.renderSite(base + '/hsr98/relics');
  for (const id of [...H.CAVERN_SETS, ...H.PLANAR_SETS]) assert.ok(relics.includes(site.esc(H.RELIC_SETS[id].name)), 'set ' + id);
  const fusions = site.renderSite(base + '/hsr98/fusions');
  for (const f of Object.values(H.FUSIONS)) assert.ok(fusions.includes(site.esc(f.name)), 'fusion ' + f.name);
  assert.ok(fusions.includes('<th>Один враг</th>') && fusions.includes('<th>Пять врагов</th>'), 'fusion worth columns');
  assert.ok(relics.includes(site.esc(H.ITEMS.resin.name)), 'resin');
  const banners = site.renderSite(base + '/hsr98/banners');
  for (const b of Object.values(H.BANNERS)) assert.ok(banners.includes(site.esc(b.name)), 'banner ' + b.name);
  assert.strictEqual(site.bannerOdds('ev'), 'всегда избранный');
  assert.strictEqual(site.bannerOdds('forge'), 'всегда избранный');
  assert.ok(site.bannerOdds('sig').startsWith(Math.round(100 * H.TUNING.sigFeatured) + '%'));
  assert.ok(site.bannerOdds('cone').startsWith(Math.round(100 * H.TUNING.coneFeatured) + '%'));
  assert.ok(site.bannerOdds('guild').includes(Math.round(100 * H.TUNING.guildParty) + '% на другого'));
  const about = site.renderSite(base + '/about');
  assert.ok(about.includes('id="method"') && about.includes('Мир ' + R.conditions.su.world + ' целиком'));
  for (const p of ['/hsr98/hall', '/hsr98/su', '/hsr98/bosses', '/hsr98/guide', '/hsr98/cones', '/hsr98/relics', '/hsr98/fusions', '/hsr98/banners', '/hsr98/builder', '/about']) assert.ok(!D.sections[p], 'still under construction ' + p);
});

test('builder reproduces the stand on every hall squad and boss', () => {
  for (const st of H.FH.STAGES) {
    for (const v of ['best', 'std', 'free']) {
      const pick = R.stages[st.n][v];
      pick.teams.forEach((team, i) => {
        const goal = 'h' + st.n + (pick.teams.length > 1 ? '-' + (i + 1) : '');
        const q = site.buildQuery({ team: team.join(','), goal });
        assert.strictEqual(q.goal.id, goal);
        const r = site.runBuild(q);
        assert.strictEqual(Math.round(r.cyc * 10) / 10, pick.res[i].cyc, 'cycles ' + goal + ' ' + v);
        assert.strictEqual(Math.round(r.win * 100) / 100, pick.res[i].win, 'wins ' + goal + ' ' + v);
        const html = site.renderBuildResult(q, r);
        assert.ok(!/undefined|NaN/.test(html), 'result html ' + goal);
      });
    }
  }
  for (const id of ['seele', 'kafka']) {
    const t = R.chars[id].teams.best.sig.boss;
    let cyc = 0;
    for (const enc of R.conditions.boss.encs) cyc += site.runBuild(site.buildQuery({ team: t.team.join(','), goal: 'b-' + enc })).cyc;
    assert.ok(Math.abs(cyc - t.boss.cyc) < 0.051, 'boss cycles of ' + id + ': ' + cyc + ' vs ' + t.boss.cyc);
  }
});

test('builder states: empty, duplicate, unknown, ready', () => {
  const page = u => site.renderSite(base + '/hsr98/builder' + u);
  const blank = page('');
  assert.ok(blank.includes('data-kv-build') && !blank.includes('data-kv-sim') && !blank.includes('kv-warn'), 'blank form');
  assert.ok(blank.includes('value="h11-1" selected'), 'default goal');
  assert.ok(page('?team=').includes('Отряд пуст'), 'empty team');
  for (const t of ['seele,seele', 'trail,trail_p']) {
    const html = page('?team=' + t);
    assert.ok(html.includes('уже в отряде') && !html.includes('data-kv-sim'), 'duplicate ' + t);
  }
  const unknown = page('?team=zzz,seele');
  assert.ok(unknown.includes('Таких персонажей у нас нет: zzz') && unknown.includes('data-kv-sim'), 'unknown id');
  const ready = page('?team=seele,silverwolf,bronya,yanqing&goal=b-ks_proto&cone=std');
  assert.ok(ready.includes('value="b-ks_proto" selected') && ready.includes('value="std" checked'), 'form keeps the choice');
  assert.ok(ready.includes('Нет «Выживания»') && ready.includes('Обработка запроса...'), 'analysis and wait state');
  assert.ok(ready.includes('«Сломанные крылья»') === Object.values(H.FUSIONS).some(f => f.name === 'Сломанные крылья' && f.members.every(m => ['seele', 'silverwolf', 'bronya', 'yanqing'].includes(m))), 'fusion listed');
  const proto = site.renderBuildResult(site.buildQuery({ team: 'seele,silverwolf,bronya,lynx', goal: 'b-ks_proto' }), site.runBuild(site.buildQuery({ team: 'seele,silverwolf,bronya,lynx', goal: 'b-ks_proto' })));
  assert.ok(proto.includes('не выиграл ни одного боя') && proto.includes('/hsr98/bosses?id=ks_proto'), 'lost every fight');
  assert.strictEqual(site.buildQuery({ goal: 'zzz' }).goal.id, 'h11-1');
  assert.strictEqual(site.buildHref({ team: ['seele', 'lynx'], goal: 'h3', cone: 'std' }), '/hsr98/builder?team=seele,lynx&goal=h3&cone=std');
  assert.strictEqual(site.getPageTitle(base + '/hsr98/builder'), 'Ковчег: конструктор отряда');
  assert.ok(!D.sections['/hsr98/builder']);
});

test('builder form navigates and the result fills in after the wait', () => {
  const handlers = [];
  let went = null;
  const slot = v => ({ value: v });
  const els = {
    '[data-kv-build]': [{ dataset: {}, addEventListener: (t, fn) => handlers.push(fn) }],
    '[data-kv-b="slot"]': [slot('seele'), slot(''), slot('lynx'), slot('')],
    '[data-kv-b="goal"]': [{ value: 'h5' }],
    'input[name="kv-b-cone"]:checked': [{ value: 'std' }]
  };
  site.attachEvents({}, fakeContainer(els), { currentUrl: base + '/hsr98/builder', renderPage: () => {}, navigate: (w, u) => { went = u; } });
  handlers[0]({ preventDefault: () => {} });
  assert.strictEqual(went, base + '/hsr98/builder?team=seele,lynx&goal=h5&cone=std');
  const box = { innerHTML: '', querySelectorAll: () => [] };
  const timers = [];
  const realTimeout = global.setTimeout;
  global.setTimeout = fn => { timers.push(fn); return 0; };
  try {
    site.attachEvents({}, fakeContainer({ '[data-kv-sim]': [box] }), { currentUrl: base + '/hsr98/builder?team=seele,lynx&goal=h5', renderPage: () => {} });
  } finally { global.setTimeout = realTimeout; }
  assert.strictEqual(timers.length, 1);
  timers[0]();
  assert.ok(box.innerHTML.includes('Победы') && box.innerHTML.includes('Доля урона'), 'result shown');
  const broken = { innerHTML: '', querySelectorAll: () => [] };
  const run = site.runBuild;
  site.runBuild = () => { throw new Error('проверка'); };
  global.setTimeout = fn => { timers.push(fn); return 0; };
  try {
    site.attachEvents({}, fakeContainer({ '[data-kv-sim]': [broken] }), { currentUrl: base + '/hsr98/builder?team=seele&goal=h5', renderPage: () => {} });
  } finally { global.setTimeout = realTimeout; }
  timers[timers.length - 1]();
  delete site.runBuild;
  assert.ok(broken.innerHTML.includes('Расчёт сорвался: проверка'), 'error state');
  assert.strictEqual(site.runBuild, run);
});

test('guestbook shows the log, signs, escapes and mails Bocman', () => {
  localStorage.removeItem(site.guestbookKey);
  const html = site.renderSite(base + '/guestbook');
  assert.strictEqual(site.parseUrl(base + '/guestbook').view, 'guestbook');
  for (const e of D.guestbook) {
    assert.ok(html.includes(site.esc(e.text)) && html.includes(site.esc(e.reply)), 'seed ' + e.name);
    assert.ok(!e.text.includes('\u2014') && !e.reply.includes('\u2014'), 'em dash in seed ' + e.name);
  }
  assert.ok(html.includes('data-kv-sign') && !html.includes(' disabled'), 'form is open');
  const field = (v, checked) => ({ value: v, checked, textContent: '' });
  const err = field('');
  const mailed = [];
  window.appOutlook = {
    answer: (addr, mail) => [{ delay: 5000, mail: { from: addr, subject: 'Re: ' + mail.subject, body: mail.body } }],
    schedule: (mail, delay) => mailed.push({ mail, delay }),
    save: () => {}
  };
  const fill = (name, text, mail) => fakeContainer({ '#kv-gb-name': [field(name)], '#kv-gb-city': [field('Казань')], '#kv-gb-text': [field(text)], '#kv-gb-mail': [field('', mail)], '#kv-gb-error': [err] });
  assert.strictEqual(site.signGuestbook({}, fill('', 'текст', false), null), null);
  assert.strictEqual(err.textContent, 'Напишите имя и запись.');
  let rendered = 0;
  const entry = site.signGuestbook({}, fill('Вася<script>', 'Зеле <b>лучшая</b>', true), { currentUrl: base + '/guestbook', renderPage: () => { rendered++; } });
  assert.ok(entry && entry.mail && rendered === 1, 'entry saved and page re-rendered');
  assert.strictEqual(mailed.length, 1);
  assert.ok(mailed[0].mail.from === D.mail && mailed[0].mail.body.includes('лучшая'), 'Bocman answers by mail');
  const after = site.renderSite(base + '/guestbook');
  assert.ok(after.includes('Вася&lt;script&gt;') && after.includes('Зеле &lt;b&gt;лучшая&lt;/b&gt;') && after.includes('Боцман ответил письмом.'), 'escaped entry on top');
  assert.ok(after.includes('Записи: ' + (D.guestbook.length + 1)));
  delete window.appOutlook;
  const quiet = site.signGuestbook({}, fill('Петя', 'без почты', true), null);
  assert.ok(quiet && !quiet.mail && !site.readGuestbook()[0].mail, 'no Outlook, no mail flag');
  const store = global.localStorage;
  global.localStorage = { getItem: () => null, setItem: () => { throw new Error('blocked'); }, removeItem: () => {} };
  try {
    const closed = site.renderSite(base + '/guestbook');
    assert.ok(closed.includes('новая запись не сохранится') && closed.includes(' disabled'), 'closed storage');
    assert.ok(closed.includes(site.esc(D.guestbook[0].text)), 'seeds still shown');
  } finally { global.localStorage = store; }
  localStorage.removeItem(site.guestbookKey);
  assert.strictEqual(site.getPageTitle(base + '/guestbook'), 'Ковчег: гостевая книга');
  assert.deepStrictEqual(Object.keys(D.sections), []);
});

test('the world knows about the site', () => {
  const hsr = read('js/apps/hsr-site.js');
  assert.ok(hsr.includes('data-url="http://www.kovcheg98.ru/hsr98/"') && hsr.includes('Фан-сайты'), 'official site links the fan site');
  const gz = read('js/apps/gamerzone-site.js');
  assert.ok(gz.includes("'Тир-лист Ковчега: кто согласен?'") && gz.includes('Bocman_Kovcheg'), 'GamerZone thread');
  const mail = read('js/apps/outlook-mail.js');
  assert.ok(mail.includes("addr: 'bocman@kovcheg98.ru'") && D.mail === 'bocman@kovcheg98.ru', 'Bocman in Outlook');
  assert.ok(site.renderSite(base).includes('mailto:bocman@kovcheg98.ru'), 'address in the footer');
  assert.ok(read('CLIPPY.md').includes('kovchegReaction'));
  eval(read('js/apps/clippy.js').replace('window.appClippy = new AppClippy();', 'window.AppClippyClass = AppClippy;'));
  const c = Object.create(window.AppClippyClass.prototype);
  const said = [];
  c.speak = (text, actions, mood) => said.push({ text, actions, mood });
  const went = [];
  const react = path => c.kovchegReaction(base + path, u => went.push(u));
  const tier = react('/hsr98/tier');
  const t0 = Object.entries(site.placement('hall', 'sig', 'dps')).filter(([, t]) => t === 'T0').map(([id]) => site.charName(id));
  assert.ok(tier && t0.every(n => tier.text.includes(n)), 'names the hall T0');
  assert.strictEqual(react('/hsr98/tier?mode=boss'), null, 'once per session');
  assert.strictEqual(react('/hsr98/crew'), null, 'quiet on other pages');
  tier.actions.find(a => a.text.includes('усилитель')).action();
  assert.ok(said.pop().text.includes(site.charName('silverwolf')));
  tier.actions.find(a => a.text.includes('Собрать')).action();
  assert.strictEqual(went.pop(), base + '/hsr98/builder');
  const builder = react('/hsr98/builder');
  builder.actions[0].action();
  assert.ok(went.pop().startsWith(base + '/hsr98/builder?team=' + R.stages[12].best.teams[0].join(',')));
  localStorage.removeItem(site.guestbookKey);
  const book = react('/guestbook');
  book.actions.find(a => a.text.includes('запись')).action();
  assert.strictEqual(site.readGuestbook()[0].name, 'Скрепыш');
  assert.strictEqual(went.pop(), base + '/guestbook');
  localStorage.removeItem(site.guestbookKey);
  for (const r of [tier, builder, book]) assert.ok(!EMOJI.test(r.text) && !/\bMicrosoft\b|\bWindows\b/.test(r.text) && !r.text.includes('\u2014'), r.text);
});

const fakeVfs = () => {
  const root = { children: { 'My Computer': { children: { 'C:': { children: { Games: { children: {} } } } } } } };
  return {
    root,
    resolvePath: parts => parts.reduce((n, k) => (n && n.children ? n.children[k] : null), root),
    writeFile(parts, name, content) { const dir = this.resolvePath(parts); if (!dir) return false; dir.children[name] = typeof content === 'object' ? Object.assign({ name }, content) : { name, content }; return true; },
    readFile(parts, name) { const dir = this.resolvePath(parts); const f = dir && dir.children[name]; return f ? f.content : null; }
  };
};

const makeSave = (ids, mcPath, cones) => {
  const g = new H.Game({ seed: 3 });
  g.state.roster = {};
  for (const id of ids) g.debugChar(id === 'trail_p' ? 'trail' : id, 40, 2);
  g.state.mcPath = mcPath || 'trail';
  g.state.party = ids.slice(0, 4).map(id => (id === 'trail_p' ? 'trail' : id));
  for (const c of cones || []) g.addCone(c);
  return JSON.stringify({ date: '18.10.2026, 12:00:00', summary: g.summary(), state: g.serialize() });
};

test('the game writes every save into C:\\Games\\StarRail98', () => {
  require(path.join(root, 'js/apps/hsr98/hsr-ui.js'));
  const U = H.UI_CONST;
  const vfs = fakeVfs();
  const was = window.vfs;
  window.vfs = vfs;
  try {
    const ui = { game: { battle: null, summary: () => ({ name: 'Келус', lvl: 12, where: 'Белобог' }), serialize: () => ({ roster: { seele: { lvl: 12, eid: 0 } } }) } };
    assert.strictEqual(U.mirrorSave(1, { state: {} }, false), false, 'no game folder, no file');
    vfs.root.children['My Computer'].children['C:'].children.Games.children.StarRail98 = { children: {} };
    assert.ok(H.UI.prototype.writeSave.call(ui, 2));
    const file = vfs.readFile(U.SAVE_DIR, 'SAVE2.SAV');
    assert.ok(file && JSON.parse(file).state.roster.seele, 'SAVE2.SAV mirrors the slot');
    assert.deepStrictEqual(JSON.parse(localStorage.getItem(U.SAVE_KEY + 2)), JSON.parse(file));
    localStorage.setItem(U.SAVE_KEY + 'auto', JSON.stringify({ state: { roster: { kafka: {} } } }));
    U.mirrorSave('auto', JSON.parse(localStorage.getItem(U.SAVE_KEY + 'auto')), true);
    assert.ok(vfs.readFile(U.SAVE_DIR, 'AUTOSAVE.SAV').includes('kafka'));
    U.mirrorSave('auto', { state: { roster: { seele: {} } } }, true);
    assert.ok(vfs.readFile(U.SAVE_DIR, 'AUTOSAVE.SAV').includes('kafka'), 'an existing file is not overwritten on start');
    localStorage.removeItem(U.SAVE_KEY + 2);
    localStorage.removeItem(U.SAVE_KEY + 'auto');
  } finally { window.vfs = was; }
});

test('my crew: a save marks the tier list and picks squads from own characters', () => {
  site.forgetCrew();
  const empty = site.renderSite(base + '/hsr98/mycrew');
  assert.ok(empty.includes('data-kv-browse') && empty.includes('data-kv-steam="hsr98"'), 'form and Steam when the game is missing');
  assert.ok(!site.renderSite(base + '/hsr98/tier').includes('data-kv-f="mine"'), 'no crew filter without a save');
  assert.ok(site.parseSave('мусор', 'X.SAV').error.includes('не сохранение'));
  assert.ok(site.parseSave(JSON.stringify({ state: { roster: { nobody: {} } } }), 'X.SAV').error.includes('ни одного'));
  const ids = ['seele', 'silverwolf', 'bronya', 'lynx', 'tingyun', 'kafka', 'luka', 'guinaifen', 'natasha', 'march', 'danheng', 'trail_p'];
  const sigs = ['seele', 'silverwolf', 'bronya', 'lynx'].map(id => Object.keys(H.CONES).find(k => H.CONES[k].sig === id)).filter(Boolean);
  const crew = site.loadCrew(makeSave(ids, 'trail_p', sigs), 'SAVE1.SAV');
  assert.ok(!crew.error && crew.chars.trail_p && !crew.chars.trail, 'Trailblazer path from the save');
  assert.deepStrictEqual(Object.keys(crew.chars).sort(), ids.slice().sort());
  assert.deepStrictEqual(crew.cones.slice().sort(), sigs.slice().sort());
  const html = site.renderSite(base + '/hsr98/mycrew');
  assert.ok(html.includes('SAVE1.SAV') && html.includes('В экипаже ' + ids.length + ' из ' + Object.keys(H.CHARS).length), 'summary');
  const hall = site.crewPicks(site.myCrew(), 'hall');
  assert.ok(hall.own.length >= 1, 'at least one own squad');
  for (const r of hall.own) assert.ok(r.team.every(id => ids.includes(id)), 'own squad uses own characters');
  for (const r of hall.near) assert.ok(r.missing.length === 1 && !ids.includes(r.missing[0]), 'near squads miss one');
  const rows = site.crewCandidates(site.myCrew(), 'hall');
  const wings = rows.find(r => r.named && r.named.id === 'seele_wings');
  assert.ok(wings && !wings.missing.length && wings.cone === 'sig', 'the named squad counts when its signature cones are in the save');
  assert.ok(rows.filter(r => r.carrier === 'kafka').every(r => r.cone === 'std'), 'Kafka has no signature cone');
  assert.ok(html.includes('/hsr98/builder?team=' + hall.own[0].team.join(',')), 'builder link');
  const tier = site.renderSite(base + '/hsr98/tier?mine=1');
  assert.ok(tier.includes('data-kv-f="mine" checked') && tier.includes('kv-card-mine'), 'tier marks and filter');
  const cards = (tier.match(/<span class="kv-card kv-r\d/g) || []).length;
  assert.strictEqual(cards, (tier.match(/kv-card-mine/g) || []).length, 'filter keeps only own characters');
  assert.ok(site.renderSite(base + '/hsr98/crew').includes('kv-crew-mine'), 'crew list marks');
  const handlers = [];
  let went = null;
  const els = {
    '[data-kv-filter]': [{ dataset: {}, addEventListener: (t, fn) => handlers.push(fn) }],
    '[data-kv-f="rar"]': [{ value: '' }], '[data-kv-f="path"]': [{ value: '' }], '[data-kv-f="free"]': [{ checked: false }], '[data-kv-f="mine"]': [{ checked: true }]
  };
  site.attachEvents({}, fakeContainer(els), { currentUrl: base + '/hsr98/tier', renderPage: () => {}, navigate: (w, u) => { went = u; } });
  handlers[0]({ preventDefault: () => {} });
  assert.strictEqual(went, base + '/hsr98/tier?mine=1');
  site.forgetCrew();
  assert.ok(!site.renderSite(base + '/hsr98/tier?mine=1').includes('kv-card-mine'), 'forgotten crew');
  assert.strictEqual(site.getPageTitle(base + '/hsr98/mycrew'), 'Ковчег: мой экипаж');
  assert.ok(D.hatches.some(h => h.path === '/hsr98/mycrew') && D.hatches.some(h => h.path === '/hsr98/builder'));
});

test('my crew form: browse, load, errors and forget', () => {
  site.forgetCrew();
  const vfs = fakeVfs();
  vfs.root.children['My Computer'].children['C:'].children.Games.children.StarRail98 = { children: {} };
  vfs.writeFile(['My Computer', 'C:', 'Games', 'StarRail98'], 'SAVE3.SAV', { content: makeSave(['seele', 'lynx', 'march', 'danheng'], 'trail', []) });
  vfs.writeFile(['My Computer', 'C:', 'Games', 'StarRail98'], 'README.TXT', { content: 'readme' });
  const was = { vfs: window.vfs, dlg: window.fileDialog };
  window.vfs = vfs;
  let dialog = null;
  window.fileDialog = { show: o => { dialog = o; } };
  try {
    const handlers = {};
    const field = { value: '' };
    const err = { textContent: '' };
    const btn = key => ({ dataset: {}, addEventListener: (t, fn) => { handlers[key] = fn; } });
    const els = { '[data-kv-browse]': [btn('browse')], '[data-kv-load]': [btn('load')], '[data-kv-forget]': [btn('forget')], '#kv-mine-file': [field], '#kv-mine-error': [err] };
    let renders = 0;
    const ie = { currentUrl: base + '/hsr98/mycrew', renderPage: () => { renders++; } };
    site.attachEvents({}, fakeContainer(els), ie);
    handlers.load({ preventDefault: () => {} });
    assert.ok(err.textContent.includes('Обзор'), 'load before browse');
    handlers.browse({ preventDefault: () => {} });
    assert.deepStrictEqual(dialog.path, ['My Computer', 'C:', 'Games', 'StarRail98']);
    assert.ok(dialog.filters[0].exts.includes('sav'));
    dialog.onOk(['My Computer', 'C:', 'Games', 'StarRail98'], 'README.TXT');
    assert.strictEqual(field.value, 'C:\\Games\\StarRail98\\README.TXT');
    handlers.load({ preventDefault: () => {} });
    assert.ok(err.textContent.includes('не сохранение') && !site.myCrew(), 'wrong file');
    dialog.onOk(['My Computer', 'C:', 'Games', 'StarRail98'], 'SAVE3.SAV');
    handlers.load({ preventDefault: () => {} });
    assert.ok(site.myCrew() && site.myCrew().file === 'SAVE3.SAV' && renders === 1, 'loaded and re-rendered');
    const page = site.renderSite(base + '/hsr98/mycrew');
    assert.ok(!page.includes('data-kv-steam="hsr98"'), 'no Steam hint when the folder exists');
    site.attachEvents({}, fakeContainer(els), ie);
    handlers.forget({ preventDefault: () => {} });
    assert.ok(!site.myCrew() && renders === 2, 'forgotten');
  } finally { window.vfs = was.vfs; window.fileDialog = was.dlg; }
  const crafted = site.parseSave(JSON.stringify({ date: '<b>x</b>', summary: { name: '<script>', where: '<i>' }, state: { roster: { seele: { lvl: '<1>' } }, inv: { cones: [{ id: '<x>' }] } } }), '<f>.SAV');
  site.write(site.crewKey, JSON.stringify(crafted));
  const html = site.renderSite(base + '/hsr98/mycrew');
  assert.ok(!html.includes('<script>') && !html.includes('<b>x</b>') && !html.includes('<f>') && html.includes('&lt;f&gt;.SAV'), 'save strings are escaped');
  assert.strictEqual(crafted.chars.seele.lvl, 1);
  site.forgetCrew();
});

test('bench results are fresh', () => {
  assert.strictEqual(R.fingerprint, bench.fingerprint(), 'game or site data changed: run node tools/kovcheg-bench.cjs');
  assert.deepStrictEqual(bench.control(), R.control, 'battle engine changed: run node tools/kovcheg-bench.cjs');
});

console.log(`kovcheg-site: ${passed} tests passed`);
