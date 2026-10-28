const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
global.localStorage = { store: {}, getItem(k) { return k in this.store ? this.store[k] : null; }, setItem(k, v) { this.store[k] = String(v); }, removeItem(k) { delete this.store[k]; } };
global.fetch = async () => ({ ok: false });
global.window = {
  addEventListener: () => {},
  location: { href: 'http://localhost:8080/' },
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) }
};

eval(read('js/icons.js') + '; window.Icons = Icons;');
eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/kinomania-site.js'));
eval(read('js/apps/cheatcc-site.js'));
eval(read('js/apps/ie.js'));

const catalog = (() => {
  const src = read('js/game-manager.js');
  const at = src.indexOf('this.catalog = {');
  let depth = 0;
  let i = src.indexOf('{', at);
  const start = i;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) break;
  }
  return eval('(' + src.slice(start, i + 1) + ')');
})();

const site = window.cheatccSite;
const base = 'http://www.cheatcc.com';
const game = (id) => site.games.find(g => g.id === id);
const codes = (id, kind) => game(id).blocks.filter(b => b.kind === kind).flatMap(b => b.rows.map(r => r[0]));
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

test('IE routes every page of the site here', () => {
  ['', '/pc/doom.html', '/myths.html', '/search?q=f7', '/search?q=youvid'].forEach(p => {
    assert.strictEqual(window.appIE.identifyPageKey(base + p), 'cheatcc', p);
  });
});

test('every game on the site is a Steam game or an Igromania CD demo from the catalog', () => {
  site.games.forEach(g => {
    const entry = catalog[g.cdDemoId || g.id];
    assert.ok(entry, g.id);
    if (g.cdDemoId) {
      assert.ok(entry.cdDemo && !entry.steam, `${g.id} is a CD demo`);
      assert.strictEqual(g.title, entry.title, g.id);
    } else {
      assert.ok(entry.steam, `${g.id} is sold in Steam`);
    }
    assert.ok(g.blocks.length && g.tested.length === 2, g.id);
  });
  assert.deepStrictEqual(site.games.filter(g => g.cdDemoId).map(g => g.cdDemoId), ['falloutzp_demo', 'stalker98_demo', 'mc98_demo', 'tekken98_demo']);
});

test('DOOM 98 codes are the ones the game listens for', () => {
  const ui = read('js/apps/doom/doom-ui.js');
  const core = read('js/apps/doom/doom-core.js');
  const maps = read('js/apps/doom/doom-maps.js');
  codes('doom', 'codes').forEach(c => {
    const low = c.toLowerCase();
    const lev = /^idclev(\d)(\d)$/.exec(low);
    const beh = /^idbehold([a-z])$/.exec(low);
    if (lev) assert.ok(maps.includes(`id: 'E${lev[1]}M${lev[2]}'`), c);
    else if (beh) assert.ok(core.includes('/^idbehold([vsirla])$/') && 'vsirla'.includes(beh[1]), c);
    else assert.ok(ui.includes(`'${low}'`), c);
  });
});

test('typed codes of the other games exist in their sources', () => {
  const sam = read('js/apps/serious-sam/ss-ui.js');
  codes('serioussam', 'codes').forEach(c => assert.ok(sam.includes(`'${c.replace(/\s+/g, '')}'`), c));
  const g90 = read('js/apps/gta90/g90-ui.js');
  codes('gta90', 'codes').forEach(c => assert.ok(new RegExp(`\\b${c}: '`).test(g90), c));
  const nn = read('js/apps/gtann/nn-game.js');
  codes('gtann', 'codes').forEach(c => assert.ok(nn.includes(`hit('${c}')`), c));
});

test('console and chat commands are understood', () => {
  const q3 = read('js/apps/quake3/q3-ui.js');
  codes('quake3', 'console').forEach(c => {
    const word = c.split(' ')[0];
    assert.ok(q3.includes(`'${word}'`), c);
  });
  const maps = game('quake3').blocks[0].extra.rows.map(r => r[0]);
  maps.forEach(m => assert.ok(fs.existsSync(path.join(root, `js/apps/quake3/q3-map-${m}.js`)), m));
  const dota = read('js/apps/dota/dota-core.js');
  codes('dota', 'console').forEach(c => assert.ok(dota.includes(`case '${c.slice(1).split(' ')[0]}'`), c));
});

test('debug keys sit where the site says', () => {
  const where = {
    gtann: ['js/apps/gtann/nn-ui.js', "e.code === 'F7'"],
    dota: ['js/apps/dota/dota-ui.js', "code === 'F7'"],
    lol: ['js/apps/lol/lol-ui.js', "code === 'F7'"],
    ow98: ['js/apps/ow98/ow-ui.js', "e.code === 'F7'"],
    hsr98: ['js/apps/hsr98/hsr-ui.js', "code === 'F7'"],
    legion: ['js/apps/legion/lg-ui.js', "e.code === 'F7'"],
    sims3: ['js/apps/sims3/s3-ui.js', "e.code === 'F7'"],
    forza: ['js/apps/forza/fz-ui.js', "e.code === 'F7'"],
    falloutzp: ['js/apps/falloutzp/zp-input.js', "has('F7')"],
    cop98: ['js/apps/cop98/cp-ui.js', "code === 'F7'"],
    mc98: ['js/apps/mc98/mc-ui.js', "c === 'F3'"]
  };
  Object.entries(where).forEach(([id, [file, needle]]) => {
    assert.ok(game(id).blocks.some(b => b.kind === 'menu'), id);
    assert.ok(read(file).includes(needle), `${id}: ${needle}`);
  });
  assert.ok(read('js/apps/hsr98/hsr-core.js').includes('debugJade: 1600'));
  assert.ok(read('js/apps/legion/lg-ui.js').includes('L.Army.grant(p, 500, 500)'));
  assert.ok(read('js/apps/ow98/ow-ui.js').includes('this.profile.boxes += 5'));
});

test('the myths stay myths', () => {
  assert.ok(!/Backquote|sv_cheats/.test(fs.readdirSync(path.join(root, 'js/apps/half-life')).map(f => read(`js/apps/half-life/${f}`)).join('\n') + read('js/apps/half-life-app.js')));
  assert.ok(!read('js/apps/minesweeper.js').includes('xyzzy'));
  assert.ok(!read('js/apps/pinball.js').toLowerCase().includes('hidden test'));
  assert.ok(read('js/apps/wolf3d/wl-ui.js').includes("this.held.has('KeyM') && this.held.has('KeyL') && this.held.has('KeyI')"));
  assert.ok(read('js/apps/wolf3d/wl-core.js').includes('this.chosen = 3; this.score = 0;'));
  assert.ok(read('js/apps/stalker98/st-ui.js').includes("if (c === 'F9') this.loadFrom('quick')") && read('js/apps/stalker98/st-ui.js').includes("if (c === 'F7') { this.W.spawner(); return; }"));
  assert.ok(site.myths.length >= 8);
});

test('pages render: index, every game, myths, search and a missing page', () => {
  const home = site.renderSite(base);
  site.games.forEach(g => {
    assert.ok(home.includes(`${base}/pc/${g.id}.html`), g.id);
    const html = site.renderSite(`${base}/pc/${g.id}.html`);
    assert.ok(html.includes('ПРОВЕРЕНО') && html.includes(g.title.replace(/'/g, "'")), g.id);
  });
  assert.ok(site.renderSite(base + '/myths.html').includes('НЕ<br>РАБОТАЕТ'));
  assert.deepStrictEqual(site.search('гта').map(g => g.id), ['gta90', 'gtann']);
  assert.ok(site.search('f7').length >= 9);
  assert.ok(site.renderSite(base + '/search?q=zzzz').includes('Ничего не нашлось'));
  assert.ok(site.renderSite(base + '/nope.html').includes('404'));
});

test('the game button launches an installed game and sends the rest to Steam', () => {
  const calls = [];
  window.gameManager = { catalog: { doom: { launch: () => calls.push('launch') } }, isInstalled: () => false, showInSteam: (id) => calls.push('steam:' + id) };
  const html = site.renderSite(`${base}/pc/doom.html`);
  assert.ok(html.includes('Купить в Steam'));
  const handlers = [];
  const btn = { dataset: { game: 'doom' }, addEventListener: (t, fn) => handlers.push(fn) };
  const container = { querySelector: () => null, querySelectorAll: (sel) => (sel === '.ccc-play' ? [btn] : []) };
  site.attachEvents({}, container, `${base}/pc/doom.html`);
  handlers[0]();
  window.gameManager.isInstalled = () => true;
  assert.ok(site.renderSite(`${base}/pc/doom.html`).includes('Запустить игру'));
  handlers[0]();
  assert.deepStrictEqual(calls, ['steam:doom', 'launch']);
  delete window.gameManager;
});

test('a CD demo button sends the player to the Igromania disc, never to Steam', () => {
  const calls = [];
  window.gameManager = { catalog: { tekken98_demo: { launch: () => calls.push('launch') } }, isInstalled: () => false, showInSteam: (id) => calls.push('steam:' + id), showOnCd: (id) => calls.push('cd:' + id) };
  const html = site.renderSite(`${base}/pc/tekken3.html`);
  assert.ok(html.includes('Демоверсия на диске «Игромании»') && html.includes('Tekken 98 Demo'));
  assert.ok(!html.includes('Купить в Steam') && !html.includes('продаётся в Steam') && !html.includes('Tekken 3 98'));
  const handlers = [];
  const btn = { dataset: { game: 'tekken3' }, addEventListener: (t, fn) => handlers.push(fn) };
  const container = { querySelector: () => null, querySelectorAll: (sel) => (sel === '.ccc-play' ? [btn] : []) };
  site.attachEvents({}, container, `${base}/pc/tekken3.html`);
  handlers[0]();
  window.gameManager.isInstalled = (id) => id === 'tekken98_demo';
  assert.ok(site.renderSite(`${base}/pc/tekken3.html`).includes('Запустить игру'));
  handlers[0]();
  assert.deepStrictEqual(calls, ['cd:tekken98_demo', 'launch']);
  const myths = site.renderSite(base + '/myths.html');
  assert.ok(!/Half-Life 98 из Steam/.test(myths) && myths.includes('Fallout 98 Demo'));
  delete window.gameManager;
});

test('pages follow the Web 1.0 and naming rules', () => {
  ['', '/pc/gtann.html', '/pc/quake3.html', '/myths.html', '/search?q=doom'].forEach(p => {
    const html = site.renderSite(base + p);
    assert.ok(!/\p{Extended_Pictographic}/u.test(html.replace(/[©®™]/g, '')), `emoji on ${p}`);
    assert.ok(!/Microsoft|Windows/.test(html), `naming on ${p}`);
  });
  const css = read('css/apps/cheatcc.css');
  assert.ok(!/border-radius|blur|rgba|transition|box-shadow/.test(css));
  assert.ok(!/^\s*\/\/|\/\*/m.test(read('js/apps/cheatcc-site.js')));
  const index = read('index.html');
  assert.ok(index.includes('js/apps/cheatcc-site.js') && index.includes('css/apps/cheatcc.css'));
});

console.log(`cheatcc-site: ${passed} tests passed`);
