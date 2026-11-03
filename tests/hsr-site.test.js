const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const HOST = 'http://hsr.hoyoverse.com';

const HSR_MODULES = ['hsr-core', 'hsr-data', 'hsr-battle', 'hsr-inaba', 'hsr-fours', 'hsr-conton', 'hsr-hares', 'hsr-fives', 'hsr-world', 'hsr-story', 'hsr-game', 'hsr-traces-data', 'hsr-traces', 'hsr-echoes', 'hsr-trace-fx', 'hsr-su-data', 'hsr-su-battle', 'hsr-su-story', 'hsr-su', 'hsr-chat', 'hsr-missions', 'hsr-shop', 'hsr-hook', 'hsr-section6', 'hsr-info', 'hsr-fours-info', 'hsr-conton-info', 'hsr-hares-info', 'hsr-fives-info', 'hsr-express', 'hsr-herta', 'hsr-herta-life', 'hsr-seclusion', 'hsr-jarilo-story', 'hsr-jarilo-life', 'hsr-museum', 'hsr-boulder', 'hsr-rivet', 'hsr-settle', 'hsr-restricted', 'hsr-corridor', 'hsr-hill', 'hsr-pillars', 'hsr-velvet', 'hsr-badge', 'hsr-axel-maps', 'hsr-axel-story', 'hsr-luofu-foes', 'hsr-luofu-field', 'hsr-luofu-maps', 'hsr-luofu-story', 'hsr-luofu-story2', 'hsr-luofu-life', 'hsr-conductor', 'hsr-pf-data', 'hsr-pf-battle', 'hsr-pf', 'hsr-pf-story', 'hsr-gfx', 'hsr-art', 'hsr-icons', 'hsr-cones', 'hsr-tiles', 'hsr-foes', 'hsr-midi', 'hsr-audio', 'hsr-ui', 'hsr-train', 'hsr-station', 'hsr-jarilo', 'hsr-axel', 'hsr-luofu', 'hsr-magflow', 'hsr-carts', 'hsr-3d', 'hsr-pompom', 'hsr-warp', 'hsr-title', 'hsr-cine', 'hsr-cines', 'hsr-luofu-cines', 'hsr-ults', 'hsr-fusions', 'hsr-warp-intro', 'hsr-signal', 'hsr-signal-tv', 'hsr-convene', 'hsr-explosion', 'hsr-personas', 'hsr-midnight', 'hsr-spotlight', 'hsr-ui-menu', 'hsr-ui-velvet', 'hsr-eidolons', 'hsr-eidolon-scenes', 'hsr-inaba-scenes', 'hsr-fours-scenes', 'hsr-conton-scenes', 'hsr-pf-art'];

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
  const timers = new Map();
  let timerId = 0;
  const opened = { dialogs: [], ie: [], notepad: [], launched: 0 };
  const winManager = {
    windows: new Map(),
    createWindow(opts) {
      if (this.windows.has(opts.id)) return this.windows.get(opts.id);
      const win = { id: opts.id, opts, element: mockElement(), bodyElement: mockElement(), titleElement: mockElement() };
      this.windows.set(opts.id, win);
      return win;
    },
    closeWindow(id) { const w = this.windows.get(id); this.windows.delete(id); if (w && w.opts.onClose) w.opts.onClose(); },
    bringToTop() {},
    setTitle(id, title) { const w = this.windows.get(id); if (w) w.title = title; },
    openDialog(opts) { opened.dialogs.push(opts); }
  };
  const ctx = {
    console, Date, Math, JSON, performance: { now: () => 0 },
    localStorage: { getItem: k => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) },
    innerWidth: 1024, innerHeight: 768,
    setTimeout: fn => { fn(); return 0; }, clearTimeout() {},
    setInterval: fn => { timers.set(++timerId, fn); return timerId; },
    clearInterval: id => timers.delete(id),
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    matchMedia: () => ({ matches: true }),
    addEventListener() {}, removeEventListener() {},
    document: { activeElement: null, createElement: tag => (tag === 'canvas' ? makeCanvas() : mockElement()), getElementById: () => mockElement(), addEventListener() {}, removeEventListener() {} },
    soundSys: { playClick() {}, playDing() {}, playError() {} },
    appNotepad: { open: (name, text) => opened.notepad.push([name, text]) }
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
  vm.runInContext(read('js/desktop.js'), ctx);
  vm.runInContext(read('js/apps/steam.js'), ctx);
  vm.runInContext(read('js/apps/hsr-site.js'), ctx);
  ctx.appIE = { open: url => opened.ie.push(url), identifyPageKey: () => 'hsr', renderPage() {} };
  ctx.gameManager.catalog.hsr98.launch = () => { opened.launched++; };
  const runTimers = (n = 100) => { for (let i = 0; i < n && timers.size; i++) [...timers.values()].forEach(fn => fn()); };
  return { ctx, H: ctx.Hsr98, gm: ctx.gameManager, site: ctx.hsrSite, steam: ctx.appSteam, vfs: ctx.vfs, desktop: ctx.desktop, opened, storage, runTimers };
}

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
}

console.log('--- hsr.hoyoverse.com ---');

test('IE routes every page of the site here, whatever words the address contains', () => {
  const src = read('js/apps/ie.js').replace(/\r\n/g, '\n');
  const body = src.slice(src.indexOf('  identifyPageKey(url) {'), src.indexOf('\n  }\n', src.indexOf('  identifyPageKey(url) {')) + 4);
  const fn = new Function(`return { ${body} }`)();
  ['', '/', '/download', '/news', '/news?id=v12', '/characters?id=march', '/worlds', '/play', '/gallery?pic=3', '/support', '/guestbook', '/nowhere'].forEach(p => {
    assert.equal(fn.identifyPageKey(HOST + p), 'hsr', p);
  });
  assert.equal(fn.identifyPageKey('http://www.steampowered.com'), 'steam');
  assert.ok(src.includes("case 'hsr': return"), 'site has a window title');
  assert.ok(/pageKey === 'hsr'\) \{/.test(src), 'IE re-renders the site when the game state changes');
});

test('the address alone picks the page', () => {
  const { site } = createSystem();
  assert.deepEqual({ ...site.parseUrl(HOST) }, { view: 'home' });
  assert.equal(site.parseUrl(HOST + '/index.html').view, 'home');
  assert.equal(site.parseUrl(HOST + '/download').view, 'download');
  assert.deepEqual({ ...site.parseUrl(HOST + '/news?id=v11') }, { view: 'article', id: 'v11' });
  assert.equal(site.parseUrl(HOST + '/news?id=nope').view, 'missing');
  assert.deepEqual({ ...site.parseUrl(HOST + '/characters?id=ruanmei') }, { view: 'character', id: 'ruanmei' });
  assert.equal(site.parseUrl(HOST + '/characters?id=trail_p').view, 'missing', 'the second Trailblazer kit lives on the Trailblazer page');
  assert.deepEqual({ ...site.parseUrl(HOST + '/gallery?pic=2') }, { view: 'picture', n: 2 });
  assert.equal(site.parseUrl(HOST + '/gallery?pic=999').view, 'missing');
  assert.equal(site.parseUrl(HOST + '/guestbook').view, 'guestbook');
  assert.equal(site.parseUrl(HOST + '/secret').view, 'missing');
});

const allUrls = (site) => [
  '', '/download', '/news', ...site.news.map(n => `/news?id=${n.id}`), '/characters', ...site.characterIds().map(id => `/characters?id=${id}`),
  '/worlds', '/play', '/gallery', ...site.galleryItems().map((_, i) => `/gallery?pic=${i}`), '/support', '/guestbook', '/nowhere'
].map(p => HOST + p);

test('every page renders with the route bar, the current station and clean text', () => {
  const { site } = createSystem();
  for (const url of allUrls(site)) {
    const html = site.renderSite(url);
    assert.ok(html.includes('hsrs-route') && html.includes('hsrs-foot'), `${url} has the frame`);
    assert.equal((html.match(/hsrs-stop is-here/g) || []).length, site.parseUrl(url).view === 'missing' ? 0 : 1, `${url} marks one station`);
    assert.ok(!/undefined|NaN|\[object Object\]/.test(html), `${url} has no broken values`);
    assert.ok(!/Microsoft|Windows|MICROSOFT|WINDOWS/.test(html), `${url} follows the naming rule`);
    assert.ok(!/&#x1F|[\u{1F300}-\u{1FAFF}]/u.test(html), `${url} has no emoji`);
  }
});

test('every picture on every page can be painted from the game art', () => {
  const { site } = createSystem();
  const specs = new Set();
  for (const url of allUrls(site)) for (const m of site.renderSite(url).matchAll(/data-art="([^"]+)"/g)) specs.add(m[1]);
  assert.ok(specs.size > 60, `many distinct pictures (${specs.size})`);
  for (const spec of specs) {
    const [kind] = spec.split(':');
    assert.ok(['fig', 'figf', 'path', 'item', 'foe', 'still', 'eid', 'title'].includes(kind), spec);
    const cv = makeCanvas(64, 64);
    cv.dataset.art = spec;
    site.paintArt(cv);
  }
});

test('characters come from the game data, grouped by Path, with kits and sources', () => {
  const { site, H } = createSystem();
  const ids = site.characterIds();
  assert.deepEqual([...ids].sort(), Object.keys(H.CHARS).filter(id => id !== 'trail_p').sort());
  const list = site.renderSite(HOST + '/characters');
  Object.values(H.PATHS).forEach(p => assert.ok(list.includes(p.name), p.name));
  for (const id of ids) {
    const c = H.CHARS[id];
    const html = site.renderSite(`${HOST}/characters?id=${id}`);
    for (const k of ['basic', 'skill', 'ult']) assert.ok(html.includes(c[k].name.replace(/"/g, '&quot;')), `${id} ${k}`);
    assert.ok(html.includes(H.PATHS[c.path].name) && html.includes(H.ELEMENTS[c.elem].name), `${id} path and element`);
    assert.ok(/Как получить: [^<]+\./.test(html), `${id} source`);
    if (H.Eidolons.has(id)) assert.ok(html.includes(H.Eidolons.SCENES[id].frags[5][0]), `${id} Eidolon picture fragments`);
  }
  const trail = site.renderSite(HOST + '/characters?id=trail');
  assert.ok(trail.includes(H.CHARS.trail_p.ult.name), 'the Trailblazer page shows the Preservation kit too');
  assert.ok(site.source('march').includes('сюжету') && site.source('ruanmei').includes('события') && site.source('bailu').includes('5★') && site.source('pela').includes('4★'));
});

test('game facts on the site match the game', () => {
  const { site, H, gm } = createSystem();
  const play = site.renderSite(HOST + '/play');
  assert.ok(play.includes(`не больше ${H.TUNING.spMax}`) && play.includes(`${H.TUNING.warpCost} звёздного нефрита`) && play.includes(`${H.TUNING.pity5}-го прыжка`));
  Object.values(H.FUSIONS).forEach(f => assert.ok(play.includes(f.name), f.name));
  H.ELEMENT_KEYS.forEach(k => assert.ok(play.includes(H.BREAK_EFFECT[k]), k));
  const worlds = site.renderSite(HOST + '/worlds');
  H.WORLDS.forEach(w => assert.ok(worlds.includes(w.name.replace(/"/g, '&quot;')), w.id));
  Object.values(H.ENEMIES).filter(e => !e.spoiler).forEach(e => assert.ok(worlds.includes(e.name), e.name));
  assert.ok(!worlds.includes('Мастер Дань Шу'), 'the worlds page does not spoil the Disciples of Luofu');
  assert.ok(worlds.includes('Переулок ауруматонов') && worlds.includes('still:lfs_alley'), 'the areas of Luofu are on the worlds page with their pictures');
  const v18 = site.news.find(n => n.id === 'v18');
  assert.ok(v18 && site.news[0] === v18, 'version 1.8 is the newest article');
  assert.ok(!/Фантил|Опустошител/.test(v18.lead + v18.body.join(' ')) && !/Тинъюнь/.test(v18.lead + v18.body.join(' ')), 'the news of version 1.8 keeps the reveal of Luofu');
  const v18Text = v18.body.join(' '), PFT = H.PF.TUN;
  assert.ok(v18Text.includes('Чистый вымысел'), 'the news of version 1.8 names the new trial');
  assert.ok(PFT.stars.every(v => v18Text.includes(H.fmt(v))) && v18Text.includes(PFT.days + ' дня'), 'with the numbers of the mode');
  assert.ok(v18Text.includes(H.PF.STAR_TIERS.reduce((a, t) => a + t.jade, 0) + ' звёздного нефрита') && v18Text.includes(H.PF.STAR_TIERS.reduce((a, t) => a + t.feather, 0) + ' нефритовых перьев'), 'and the rewards of a season');
  const rumors = site.news.find(n => n.id === 'rumors').body.join(' ').toLowerCase();
  assert.ok(H.RUMORS.some(r => rumors.includes(r.title.toLowerCase())), 'the rumor article names a real rumor');
  const v11 = site.news.find(n => n.id === 'v11').body.join(' ');
  assert.ok(v11.includes(`${H.COMET_GIFT.slice(0, -1).join(', ')} и ${H.COMET_GIFT[H.COMET_GIFT.length - 1]}`) && H.TRAIL_WILL.slice(0, 4).every(s => v11.includes(String(s.lvl))), 'version 1.1 notes match the events');
  const v16w = site.news.find(n => n.id === 'v16w').body.join(' '), willTop = H.TRAIL_WILL[H.TRAIL_WILL.length - 1];
  assert.ok(H.TRAIL_WILL.slice(4).every(s => v16w.includes(s.lvl + ' уров')) && v16w.includes('«' + H.OUTFITS[willTop.give.outfit].name + '»') && v16w.includes(H.OUTFITS[willTop.give.outfit].price + ' звёздного нефрита') && willTop.lvl === H.TL_MAX, 'the Will patch notes match the new stations and the outfit');
  const v12 = site.news.find(n => n.id === 'v12').body.join(' ');
  H.BANNERS.std.fresh.forEach(id => assert.ok(v12.includes(H.CHARS[id].name), id));
  assert.ok(v12.includes(H.CHAT.DAILY_GIVE.jade + ' звёздного нефрита') && v12.includes('Виртуальной вселенной'), 'version 1.2 notes cover the Simulated Universe and the daily message reward');
  assert.ok(v12.includes('«Сообщения»') && site.news.filter(n => n.id === 'v14').length === 1, 'Messages stay in the 1.2 notes, version 1.4 is the nine heroes update');
  const v14 = site.news.find(n => n.id === 'v14').body.join(' ');
  H.FOURS.IDS.forEach(id => assert.ok(v14.includes(H.CHARS[id].name) && site.source(id).includes('Стандартный прыжок'), 'version 1.4 notes name ' + id));
  Object.keys(H.FOURS.FUSIONS).forEach(id => assert.ok(v14.includes(H.FUSIONS[id].name), 'version 1.4 notes name the Fusion ' + id));
  assert.ok(v14.includes(H.MAIL.find(m => m.id === 'v14_fours').give.items.pass + ' звёздных пропусков') && v14.includes('станцию «Герта»'.replace('станцию', 'Станцию')), 'version 1.4 notes match the letter and the station rework');
  const con = H.BANNERS.con, conMail = H.MAIL.find(m => m.id === 'v14_conton');
  Object.keys(con.stars).forEach(id => assert.ok(v14.includes(H.CHARS[id].fullName) && site.source(id).includes('Кон-Тон') && site.source(id).includes(con.stars[id].name), 'version 1.4 notes and the source name ' + id));
  Object.values(H.BANNERS.alley.stars).forEach(s => assert.ok(v14.includes('«' + H.CONES[s.cone].name + '»'), 'version 1.4 notes name the cone ' + s.cone));
  ['f_ccc3', 'f_duel', 'f_started', 'f_shut'].forEach(id => assert.ok(v14.includes('«' + H.FUSIONS[id].name + '»'), 'version 1.4 notes name the Fusion ' + id));
  const conDays = H.CONTON_BANNER.DAYS.reduce((a, d) => a + d[1], 0);
  assert.ok(v14.includes(Math.round(H.TUNING.conFeatured * 100) + '% случаев') && v14.includes(H.TUNING.pity5 + '-го прыжка') && v14.includes(H.TUNING.warpCost + ' звёздного нефрита') && v14.includes(Math.round(H.TUNING.coneFeatured * 100) + '% случаев') && v14.includes(H.TUNING.conePity5 + ' покупок'), 'version 1.4 notes match the Con-Ton tuning');
  assert.ok(H.TUNING.conRegBadges === 1 && v14.includes('Первый бейдж') && v14.includes('даёт ещё ' + conDays) && v14.includes('«' + conMail.title + '» с ' + conMail.give.items.badge + ' бейджами') && v14.includes('Казума'), 'version 1.4 notes match the Con-Ton badges and the letter');
  assert.ok(v14.includes('«KonoSuba x HSR 98: Обмен отрядами»') && v14.includes('Белзерг') && v14.includes('Прототип Разрушителя') && H.MAIL.find(m => m.id === 'v14_konosuba').need === 'jarilo_done|ks_early', 'version 1.4 notes describe the KonoSuba event and its letter waits for the event');
  const hm = H.MAIL.find(m => m.id === 'v14_hares');
  H.HARES.IDS.forEach(id => assert.ok(v14.includes(H.CHARS[id].fullName) && site.source(id).includes('Поиск сигнала') && Object.values(H.BANNERS.sig.stars).every(s => s.four.includes(id)), 'version 1.4 notes and the source name the hare ' + id));
  Object.values(H.BANNERS.amp.stars).flatMap(s => s.four).forEach(c => assert.ok(v14.includes('«' + H.CONES[c.slice(5)].name + '»'), 'version 1.4 notes name the amplifier ' + c));
  Object.keys(H.HARES.FUSIONS).forEach(id => assert.ok(v14.includes('«' + H.FUSIONS[id].name.replace(/«(.*)»/, '„$1“') + '»'), 'version 1.4 notes name the Fusion ' + id));
  assert.ok(v14.includes('Избранный агент A выпадает в ' + Math.round(H.TUNING.sigFeatured * 100) + '% случаев') && v14.includes('«' + hm.title + '» с ' + hm.give.items.tape + ' шифрокопиями') && v14.includes('Дань Хэн в Поиске сигнала больше не выпадает'), 'version 1.4 notes match the Signal Search rules and the letter');
  const v15 = site.news.find(n => n.id === 'v15').body.join(' '), v15mail = H.MAIL.find(m => m.id === 'v15_supply');
  assert.ok(v15.includes('наряд «' + H.OUTFITS[v15mail.give.outfit].name + '» для Март 7 и ' + v15mail.give.jade + ' звёздного нефрита'), 'version 1.5 is the newest article and matches its letter');
  ['march_spring', 'megumin_bakuen', 'ruanmei_plum', 'welt_idol', 'darkness_bride', 'aqua_beach', 'miyabi_blossom', 'nicole_bunny', 'kazuma_jersey'].forEach(id => assert.ok(v15.includes('«' + H.OUTFITS[id].name + '» для ' + H.CHARS[H.OUTFITS[id].char].name.slice(0, 3)), 'version 1.5 notes name the outfit ' + id));
  H.SUPPLY.starlight.filter(e => e.cone).forEach(e => assert.ok(v15.includes('«' + H.CONES[e.cone].name + '»') && v15.includes('по ' + e.price), 'version 1.5 notes name the Supply cone ' + e.cone));
  assert.ok(v15.includes(H.GLOW.dup[4] + ' или ' + H.GLOW.dup[5]) && v15.includes('до ' + H.TL_MAX) && ['pc_rewards', 'pc_home', 'pc_disc', 'pc_guests'].every(id => v15.includes('«' + H.QUESTS[id].name + '»')), 'version 1.5 notes match Starlight, the Trailblaze Level cap and the Express missions');
  const v16o = site.news.find(n => n.id === 'v16o').body.join(' ');
  const v17g = site.news.find(n => n.id === 'v17g').body.join(' '), v17p = site.news.find(n => n.id === 'v17p').body.join(' ');
  assert.ok(v17g.includes('15, 20, 30, 40, 50 и 60'), 'version 1.7 notes name the Level gates');
  const v17n = site.news.find(n => n.id === 'v17n').body.join(' ');
  assert.ok(site.news[1].id === 'v17n' && ['согласия', 'UID', '2 000', '«2–4 ИГРОКА»', 'Сетевом окружении'].every(t => v17n.includes(t)), 'the ether link comes right after version 1.8');
  assert.ok(site.faq.some(([q]) => q === 'Что игра отправляет в сеть?'), 'the FAQ says what goes to the network');
  assert.ok(['STARRAILGIFT', 'POMPOM98'].every(code => v17p.includes(code)) && !v17p.includes('TROLLEY98'), 'the news names the public codes and keeps the Express one secret');
  const v16h = site.news.find(n => n.id === 'v16h'), v16hb = v16h.body.join(' '), HV = H.OUTFITS.himeko_vermilion;
  assert.ok(HV.rarity === 5 && v16h.title.includes('«' + HV.name + '»') && v16h.lead.includes(HV.price + ' звёздного нефрита') && v16hb.includes('«' + H.CHARS.himeko.skill.name + '»') && v16hb.includes('«' + H.FUSIONS.f_singularity.name + '»'), 'the first 5★ outfit patch matches the game');
  assert.ok(v16o.includes(H.OUTFIT_TIER[4].price + ' звёздного нефрита') && v16o.includes(H.OUTFIT_TIER[5].price + ' звёздного нефрита') && H.OUTFIT_REFUND.every(id => v16o.includes('«' + H.OUTFITS[id].name + '»')) && v16o.includes('«' + H.OUTFITS.himeko_vermilion.name + '» Химико'), 'the outfit class patch matches the tiers and the refund list');
  const v16 = site.news.find(n => n.id === 'v16').body.join(' '), v16mail = H.MAIL.find(m => m.id === 'v16_fives');
  assert.ok(site.news.filter(n => n.tag === 'Обновление')[1].id === 'v16' && v16.includes(v16mail.give.items.spass + ' особых звёздных пропусков и ' + v16mail.give.jade + ' звёздного нефрита'), 'version 1.6 is the update before Luofu and matches its letter');
  H.FIVES.IDS.forEach(id => assert.ok(v16.includes(H.CHARS[id].name) && v16.includes('«' + H.BANNERS.ev.stars[id].name + '»') && v16.includes('«' + H.CONES[H.BANNERS.cone.stars[id].cone].name + '»') && site.source(id).includes('Прыжок события'), 'version 1.6 notes name ' + id + ', the banner and the cone'));
  Object.keys(H.FIVES.FUSIONS).forEach(id => assert.ok(v16.includes('«' + H.FUSIONS[id].name + '»'), 'version 1.6 notes name the Fusion ' + id));
  const v13 = site.news.find(n => n.id === 'v13').body.join(' ');
  ['miyabi', 'yanagi'].forEach(id => assert.ok(v13.includes(H.CHARS[id].name) && v13.includes(H.CONES[H.BANNERS.amp.stars[id].cone].name), 'version 1.3 notes name ' + id + ' and the signature cone'));
  assert.ok(v13.includes(Math.round(H.TUNING.sigFeatured * 100) + '%') && v13.includes(H.TUNING.pity5 + ' поисков') && v13.includes(H.TUNING.conePity5 + ' на канале') && v13.includes(H.TUNING.warpCost + ' звёздного'), 'version 1.3 notes match the Signal Search tuning');
  assert.ok(v13.includes(H.MAIL.find(m => m.id === 'v13_signal').give.items.tape + ' шифрокопий'), 'version 1.3 notes match the letter');
  ['phrolova', 'scar'].forEach(id => assert.ok(v13.includes(H.CHARS[id].name.replace(/а$/, '')) && v13.includes(H.CONES[H.BANNERS.forge.stars[id].cone].name), 'version 1.3 notes name ' + id + ' and the forge cone'));
  const give = H.MAIL.find(m => m.id === 'v13_signal').give.items;
  assert.ok(v13.includes(give.rtide + ' сияющих') && v13.includes(give.ftide + ' кующих') && v13.includes(Math.round(H.TUNING.convFeatured * 100) + '%') && v13.includes(H.TUNING.pity5 + ' призывов') && v13.includes(H.TUNING.conePity5 + ' призывов'), 'version 1.3 notes match the Convene rules and the letter');
  assert.ok(site.source('phrolova').includes('Призыв') && site.source('miyabi').includes('Поиск сигнала'), 'the Convene and Signal Search heroes name their banners');
  ['aqua', 'megumin', 'darkness', 'kazuma'].forEach(id => assert.ok(v13.includes(H.CHARS[id].name) && site.source(id).includes('Гильдия'), 'version 1.3 notes and the source name ' + id));
  assert.ok(v13.includes('Лавка Виз') && ['hagoromo', 'manastaff', 'adamantite', 'chunchunmaru'].every(id => v13.includes('«' + H.CONES[id].name + '»')) && v13.includes(H.TUNING.conePity5 + ' покупок'), 'version 1.3 notes describe the Wiz shop');
  assert.ok(v13.includes(give.mana + ' манатитов') && v13.includes(Math.round(H.TUNING.guildFeatured * 100) + '% случаев') && v13.includes(H.TUNING.pity5 + ' наборов'), 'version 1.3 notes match the Guild rules and the letter');
  ['yu', 'kanji', 'rise', 'yosuke', 'chie', 'yukiko'].forEach(id => assert.ok(v13.includes(H.CHARS[id].name) && site.source(id).includes('Полуночный канал'), 'version 1.3 notes and the source name ' + id));
  Object.values(H.BANNERS.comp.stars).forEach(s => assert.ok(v13.includes(H.CONES[s.cone].name), 'version 1.3 notes name the cone ' + s.cone));
  H.BANNERS.comp.stars.yu.four.map(c => H.CONES[c.slice(5)]).forEach(c => assert.ok(v13.includes(c.name.replace(/«(.*)»/, '„$1“')) && v13.includes(H.CHARS[c.sig].name), 'version 1.3 notes name the 4★ cone ' + c.name));
  assert.ok(v13.includes(give.vkey + ' бархатных ключей') && v13.includes(Math.round(H.TUNING.midFeatured * 100) + '% случаев') && v13.includes(H.TUNING.pity5 + ' прыжков') && v13.includes('всего ' + H.TUNING.midnightKeys) && v13.includes(Math.round(H.TUNING.coneFeatured * 100) + '% случаев'), 'version 1.3 notes match the Midnight Channel rules and the letter');
  ['f_partners', 'f_friends', 'f_emperor', 'f_fools'].forEach(id => assert.ok(v13.includes(H.FUSIONS[id].name), 'version 1.3 notes name the Fusion ' + id));
  assert.equal(gm.catalog.hsr98.price, 0, 'the game is free in Steam too');
  const home = site.renderSite(HOST);
  Object.keys(H.BANNERS.ev.stars).forEach(id => assert.ok(home.includes(`/characters?id=${id}`), `warp box shows ${id}`));
});

test('news go from new to old and are never from the future', () => {
  const { site } = createSystem();
  const key = d => d.split('.').reverse().join('');
  site.news.forEach((n, i) => {
    assert.ok(/^\d\d\.\d\d\.(1999|2000|2001)$/.test(n.date), n.id);
    if (i) assert.ok(key(n.date) <= key(site.news[i - 1].date), `${n.id} is older than the one above`);
    assert.ok(!n.body.join(' ').includes('—'), `${n.id} has no em dash`);
  });
  assert.equal(new Set(site.news.map(n => n.id)).size, site.news.length);
});

test('download from the site: mirror, installer in Downloads, setup wizard, game in Steam library', () => {
  const { site, gm, vfs, steam, desktop, runTimers, opened } = createSystem();
  assert.equal(site.gameState(), 'none');
  assert.ok(site.renderSite(HOST + '/download').includes('data-hsrs="download"'));
  const dl = site.startDownload('fra');
  assert.equal(dl.mirror.city, 'Франкфурт');
  assert.equal(site.gameState(), 'downloading');
  assert.equal(site.startDownload('msk'), dl, 'a second click shows the running download');
  assert.ok(site.downloadSeconds(dl.mirror) >= 6 && site.downloadSeconds(dl.mirror) <= 30);
  site.tickDownload(dl, 0.5);
  assert.ok(!site.installerFile(), 'nothing is saved halfway');
  site.tickDownload(dl, 1);
  const file = site.installerFile();
  assert.ok(file && file.app === 'hsrsetup' && file.name === 'StarRail98_Setup.exe');
  assert.equal(site.gameState(), 'installer');
  assert.ok(!gm.isInstalled('hsr98') && !gm.ownsOnSteam('hsr98'), 'a downloaded installer does not install anything');
  assert.ok(site.renderSite(HOST + '/download').includes('data-hsrs="setup"'));
  gm.removeSteamInstallersFromDownloads();
  assert.ok(site.installerFile(), 'the Steam cleanup keeps the site installer');

  const win = site.openSetup();
  const wiz = site.wiz;
  assert.equal(wiz.step, 'welcome');
  site.wizardNext(wiz);
  assert.equal(wiz.step, 'license');
  site.wizardNext(wiz);
  assert.equal(wiz.step, 'license', 'the license must be accepted');
  wiz.accepted = true;
  site.wizardNext(wiz);
  assert.equal(wiz.step, 'folder');
  site.wizardBack(wiz);
  assert.equal(wiz.step, 'license');
  site.wizardNext(wiz);
  site.wizardNext(wiz);
  assert.equal(wiz.step, 'copy');
  assert.ok(!gm.isInstalled('hsr98'), 'still copying');
  runTimers();
  assert.equal(wiz.step, 'done');
  assert.ok(gm.isInstalled('hsr98') && gm.ownsOnSteam('hsr98'), 'installed and in the Steam library');
  assert.ok(win);
  const dir = vfs.resolvePath(['My Computer', 'C:', 'Games', 'StarRail98']);
  assert.ok(dir && dir.children['STARRAIL.EXE'] && dir.children['README.TXT']);
  assert.ok(desktop.computeCurrentIcons().some(i => i.id === 'hsr98'), 'desktop icon appears');
  assert.equal(steam.getGameState('hsr98'), 'installed');
  assert.equal(site.gameState(), 'installed');
  assert.ok(site.renderSite(HOST).includes('data-hsrs="play"'));
  site.openReadme();
  assert.equal(opened.notepad[0][0], 'README.TXT');
  site.wizardNext(wiz);

  site.openSetup();
  assert.equal(site.wiz.step, 'already', 'running setup again offers to play');
  site.wizardNext(site.wiz);
  assert.equal(opened.launched, 1);

  gm.uninstallGame('hsr98');
  assert.equal(site.gameState(), 'installer', 'after uninstall the installer is still there');
});

test('closing the download window cancels it and saves nothing', () => {
  const { site, ctx } = createSystem();
  const dl = site.startDownload('sha');
  ctx.winManager.closeWindow(dl.winId);
  assert.equal(site.dl, null);
  assert.equal(site.gameState(), 'none');
  site.tickDownload(dl, 1);
  assert.ok(!site.installerFile(), 'a cancelled download never lands in Downloads');
});

test('cancelling setup asks first and leaves the game uninstalled', () => {
  const { site, gm, opened, runTimers } = createSystem();
  site.startDownload('msk');
  site.tickDownload(site.dl, 1);
  site.openSetup();
  const wiz = site.wiz;
  wiz.accepted = true;
  ['welcome', 'license', 'folder'].forEach(() => site.wizardNext(wiz));
  assert.equal(wiz.step, 'copy');
  site.wizardCancel(wiz);
  const ask = opened.dialogs.pop();
  assert.ok(ask.message.includes('Прервать установку'));
  ask.buttons[1].onClick();
  ask.buttons[0].onClick();
  runTimers();
  assert.ok(!gm.isInstalled('hsr98') && !gm.ownsOnSteam('hsr98'));
});

test('guestbook keeps visitor entries, rejects empty ones and escapes text', () => {
  const { site, storage } = createSystem();
  assert.equal(site.addGuestbookEntry('', 'Тверь', 'текст', '01.01.2000'), null);
  assert.equal(site.addGuestbookEntry('Аня', '', '   ', '01.01.2000'), null);
  site.addGuestbookEntry('<b>Аня</b>', 'Тверь', 'Привет <script>', '01.01.2000');
  assert.ok(storage.has('win98_hsrsite_guestbook_v1'));
  const html = site.renderSite(HOST + '/guestbook');
  assert.ok(html.includes('&lt;b&gt;Аня&lt;/b&gt;') && html.includes('Привет &lt;script&gt;'));
  assert.ok(html.indexOf('Аня') < html.indexOf(site.guestbookSeed[0].name), 'new entries go first');
  site.guestbookSeed.forEach(e => assert.ok(/^\d\d\.\d\d\.(1999|2000)$/.test(e.date) && e.text.length > 10));
});

test('the installer opens from Explorer and the desktop, Outlook knows the support address', () => {
  assert.ok(read('js/apps/explorer.js').includes("item.app === 'hsrsetup'"));
  assert.ok(read('js/desktop.js').includes("file.app === 'hsrsetup'"));
  assert.ok(read('js/apps/outlook-mail.js').includes("addr: 'support@hoyoverse.com'"));
  const index = read('index.html');
  assert.ok(index.includes('js/apps/hsr-site.js') && index.includes('css/apps/hsr-site.css'));
  assert.ok(read('AGENTS.md').includes('hsr.hoyoverse.com'), 'the exception to the Steam rule is written down');
});

function clippyFor(sys) {
  const { ctx } = sys;
  if (!ctx.AppClippyClass) vm.runInContext(read('js/apps/clippy.js').replace('window.appClippy = new AppClippy();', 'window.AppClippyClass = AppClippy;'), ctx);
  const c = Object.create(ctx.AppClippyClass.prototype);
  c.spoken = [];
  c.visible = true;
  c.annoyance = 'normal';
  c.opt = () => true;
  c.speak = (text, actions = [], mood = '') => c.spoken.push({ text, actions, mood });
  c.asked = 0;
  c.ask = () => { c.asked++; };
  const visited = [];
  const nav = (u) => visited.push(u);
  const react = (path) => c.hsrSiteReaction(HOST + path, nav);
  return { c, visited, react };
}
const press = (reaction, label) => {
  const a = reaction.actions.find(x => x.text.includes(label));
  assert.ok(a, `no action "${label}" in ${reaction.actions.map(x => x.text).join(' | ')}`);
  a.action();
};

test('Clippy speaks once per page of the site and keeps quiet on re-renders', () => {
  const sys = createSystem();
  const { c, react } = clippyFor(sys);
  const views = ['', '/download', '/characters', '/characters?id=march', '/worlds', '/play', '/gallery', '/news?id=steam', '/support', '/guestbook', '/nowhere'];
  views.forEach(p => {
    const r = react(p);
    assert.ok(r && r.text && r.mood, `reaction on ${p || '/'}`);
    assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(r.text) && !/Microsoft|Windows/.test(r.text), `clean text on ${p || '/'}`);
    react('/');
    assert.equal(react(p), null, `no second reaction on ${p || '/'}`);
  });
  assert.equal(react('/gallery?pic=3'), null, 'a picture counts as the gallery');
  assert.equal(react('/news?id=v12'), null, 'ordinary news are left alone');
  assert.equal(react('/characters?id=gepard'), null, 'characters without a line are left alone');
  const fresh = clippyFor(createSystem());
  fresh.react('/play');
  assert.equal(fresh.react('/play'), null, 'the same address twice is a re-render');
});

test('Clippy helps with the download, install and play in turn', () => {
  const sys = createSystem();
  const { c, visited, react } = clippyFor(sys);
  const home = react('');
  press(home, 'Помогите загрузить');
  assert.ok(visited.pop().endsWith('/download'));
  press(c.spoken.pop(), 'Загрузить с Москвы');
  assert.equal(sys.site.gameState(), 'downloading');
  assert.equal(sys.site.dl.mirror.id, 'msk');
  assert.equal(react('/download'), null, 'the mirror tip already covered the download page');
  sys.ctx.appClippy = c;
  sys.site.tickDownload(sys.site.dl, 1);
  const done = c.spoken.pop();
  assert.ok(done.text.includes('StarRail98_Setup.exe'), 'Clippy notices the finished download');
  assert.equal(react('/download'), null, 'and does not repeat it on the download page');
  press(done, 'Установить');
  assert.ok(sys.site.wiz && sys.site.wiz.step === 'welcome');
  const setup = c.getAppReactions().find(r => r.match('hsrs_setup'));
  assert.ok(setup && setup.text.includes('Пом-Пом'), 'Clippy meets Pom-Pom in the setup wizard');
  sys.site.install();
  const again = clippyFor(sys);
  press(again.react(''), 'Играть');
  assert.equal(sys.opened.launched, 1);
});

test('«Я сам разберусь» silences Clippy on the site for the session', () => {
  const { c, react } = clippyFor(createSystem());
  press(react(''), 'Я сам разберусь');
  assert.ok(c.spoken.pop().text.includes('молчу'));
  ['/download', '/characters', '/play', '/guestbook'].forEach(p => assert.equal(react(p), null, p));
});

test('Clippy signs the guestbook once and remembers it', () => {
  const sys = createSystem();
  const { c, react } = clippyFor(sys);
  press(react('/guestbook'), 'Распишись');
  const mine = sys.site.readGuestbook().filter(e => e.name === 'Скрепыш');
  assert.equal(mine.length, 1);
  assert.ok(mine[0].text.includes('сохраняйтесь'));
  assert.ok(sys.site.renderSite(HOST + '/guestbook').includes('Редмонд'));
  const later = clippyFor(sys);
  const r = later.react('/guestbook');
  assert.ok(r && !r.actions.length && r.text.includes('запись'), 'next session he only notes his entry');
  assert.ok(c.spoken.length >= 1);
});

test('Clippy character lines point at real characters and real numbers', () => {
  const sys = createSystem();
  const src = read('js/apps/clippy.js');
  const block = src.slice(src.indexOf('const CHAR_LINES = {'), src.indexOf('};', src.indexOf('const CHAR_LINES = {')));
  const ids = [...block.matchAll(/^\s+([a-z_]+): \[/gm)].map(m => m[1]);
  assert.ok(ids.length >= 8);
  ids.forEach(id => {
    assert.ok(sys.H.CHARS[id], id);
    const r = clippyFor(sys).react(`/characters?id=${id}`);
    assert.ok(r && r.text.length > 20, id);
  });
  const pity = (sys.H.TUNING.pity5 * sys.H.TUNING.warpCost).toLocaleString('ru-RU');
  assert.ok(clippyFor(sys).react('/characters?id=ruanmei').text.includes(pity));
  ['yu', 'kanji', 'rise', 'yosuke', 'chie', 'yukiko', 'makoto', 'amanda', 'talleah'].forEach(id => assert.ok(ids.includes(id), 'Clippy has a line for ' + id));
  assert.ok(clippyFor(sys).react('/characters?id=makoto').text.includes((sys.H.TUNING.pity5 * sys.H.TUNING.warpCost / sys.H.TUNING.conFeatured).toLocaleString('ru-RU')));
  assert.ok(clippyFor(sys).react('/characters?id=yu').text.includes((sys.H.TUNING.pity5 * sys.H.TUNING.warpCost * 2).toLocaleString('ru-RU')));
  const list = clippyFor(sys).react('/characters').text;
  assert.ok(list.includes(sys.site.characterIds().length + ' геро') && ['natasha', 'yukiko'].every(id => list.includes(sys.H.CHARS[id].name)), 'the roster line counts every hero and names the healers');
});

test('Clippy help answers where to download the game', () => {
  const src = read('js/apps/clippy-help.js');
  assert.ok(/id: 'hsr-site'[^\n]+go: 'url:http:\/\/hsr\.hoyoverse\.com\/download'/.test(src));
  assert.ok(read('js/apps/hsr-site.js').includes('appClippy.onHsrDownloaded'));
});

test('site files contain no comments', () => {
  const js = read('js/apps/hsr-site.js').replace(/https?:\/\/[^\s'"`]+/g, '');
  assert.ok(!/\/\/|\/\*/.test(js), 'hsr-site.js has no comments');
  assert.ok(!read('css/apps/hsr-site.css').includes('/*'), 'hsr-site.css has no comments');
  const test = read('tests/hsr-site.test.js').replace(/https?:\/\/[^\s'"`]+/g, '');
  assert.ok(!/^\s*\/\//m.test(test), 'test has no comments');
});

console.log(`\nALL ${passed} HSR SITE TESTS PASSED!`);
