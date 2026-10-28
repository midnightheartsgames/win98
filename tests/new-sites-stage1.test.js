const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

localStorage.setItem('win98_molotok_lots_v2', JSON.stringify([
  { id: 'awe64', currentBid: 55, bidsCount: 10, leader: 'Вы', myBid: true, won: false },
  { id: 'trio64', currentBid: 15, bidsCount: 4, leader: 'Вы', myBid: true, won: true }
]));
localStorage.setItem('win98_mult_guestbook_v1', JSON.stringify([
  { name: 'Мой_ник', date: '07.10.1998', text: 'Старая запись пользователя' },
  { name: 'Лёха_Питер', date: '28.11.1998', text: 'Мульты угарные!' }
]));

const vfsFiles = [];
global.window = {
  addEventListener: () => {},
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map() },
  vfs: {
    writeFile: (pathArr, name, content) => {
      vfsFiles.push({ path: pathArr, name, content });
      return true;
    }
  },
  gameManager: {
    showInSteam: () => {}
  }
};

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/apps/fargus-site.js'));
eval(read('js/apps/molotok-site.js'));
eval(read('js/apps/xakep-site.js'));
eval(read('js/apps/mult-site.js'));
eval(read('js/apps/emuland-site.js'));
eval(read('js/apps/xfiles-site.js'));
eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));

const ie = window.appIE;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

const ROUTES = {
  fargus: ['http://www.goldfargus.ru', '', '/catalog', '/quotes', '/support', '/patches', '/guestbook', '/vote', '/game?id=doom', '/game?id=nope'],
  molotok: ['http://www.molotok98.ru', '', '/cat?id=video', '/cat?id=modem', '/lot?id=celeron', '/lot?id=nope', '/search?q=модем', '/mybids', '/rules'],
  xakep: ['http://www.xakep98.ru', '', '/articles', '/article?id=modem', '/article?id=nope', '/mail', '/keygen'],
  mult: ['http://www.mult98.ru', '', '/ep?id=modem', '/ep?id=y2k', '/ep?id=nope', '/quotes', '/downloads', '/guestbook'],
  emuland: ['http://www.emuland98.ru', '', '/roms?sys=nes', '/roms?sys=sega', '/rom?id=contra', '/rom?id=nope', '/cheats', '/emulators', '/history'],
  xfiles: ['http://www.xfiles98.ru', '', '/case?id=molebka', '/case?id=urals', '/decoder', '/reports', '/poll', '/creatures']
};
const SITES = { fargus: 'fargusSite', molotok: 'molotokSite', xakep: 'xakepSite', mult: 'multSite', emuland: 'emuLandSite', xfiles: 'xFilesSite' };
const renderAll = key => {
  const [host, ...paths] = ROUTES[key];
  return paths.map(p => ({ url: host + p, html: window[SITES[key]].renderSite(host + p) }));
};

test('IE correctly routes all 6 site URLs, including sub-pages', () => {
  assert.strictEqual(ie.identifyPageKey('http://www.goldfargus.ru'), 'fargus');
  assert.strictEqual(ie.identifyPageKey('http://www.fargus.com/catalog'), 'fargus');
  assert.strictEqual(ie.identifyPageKey('http://www.goldfargus.ru/game?id=doom'), 'fargus');
  assert.strictEqual(ie.identifyPageKey('http://www.molotok98.ru'), 'molotok');
  assert.strictEqual(ie.identifyPageKey('http://www.molotok98.ru/lot?id=voodoo2'), 'molotok');
  assert.strictEqual(ie.identifyPageKey('http://www.xakep98.ru'), 'xakep');
  assert.strictEqual(ie.identifyPageKey('http://www.xakep98.ru/article?id=modem'), 'xakep');
  assert.strictEqual(ie.identifyPageKey('http://www.mult98.ru'), 'mult');
  assert.strictEqual(ie.identifyPageKey('http://www.mult98.ru/ep?id=office'), 'mult');
  assert.strictEqual(ie.identifyPageKey('http://www.emuland98.ru'), 'emuland');
  assert.strictEqual(ie.identifyPageKey('http://www.emuland98.ru/rom?id=sonic2'), 'emuland');
  assert.strictEqual(ie.identifyPageKey('http://www.xfiles98.ru'), 'xfiles');
  assert.strictEqual(ie.identifyPageKey('http://www.xfiles98.ru/case?id=modem'), 'xfiles');
});

test('IE getPageTitle returns titles for all 6 sites', () => {
  assert.ok(ie.getPageTitle('fargus').includes('ФАРГУС'));
  assert.ok(ie.getPageTitle('molotok').includes('Молоток.ру'));
  assert.ok(ie.getPageTitle('xakep').includes('Хакер'));
  assert.ok(ie.getPageTitle('mult').includes('Мульт.ру'));
  assert.ok(ie.getPageTitle('emuland').includes('Emu-Land'));
  assert.ok(ie.getPageTitle('xfiles').includes('ИСТИНА'));
});

test('Search directory and performSearch find all 6 sites', () => {
  assert.ok(ie.performSearch('фаргус').some(r => r.url === 'http://www.goldfargus.ru'));
  assert.ok(ie.performSearch('молоток').some(r => r.url === 'http://www.molotok98.ru'));
  assert.ok(ie.performSearch('хакер').some(r => r.url === 'http://www.xakep98.ru'));
  assert.ok(ie.performSearch('масяня').some(r => r.url === 'http://www.mult98.ru'));
  assert.ok(ie.performSearch('денди').some(r => r.url === 'http://www.emuland98.ru'));
  assert.ok(ie.performSearch('пришельцы').some(r => r.url === 'http://www.xfiles98.ru'));
});

test('WebRing includes all 6 sites', () => {
  const ring = window.retroSites.getWebRingSites();
  Object.keys(ROUTES).forEach(k => assert.ok(ring.some(s => s.url === ROUTES[k][0]), k));
});

test('Every route of every site renders its own page without emoji', () => {
  const marks = { fargus: 'fargus-page', molotok: 'molotok-page', xakep: 'xakep-page', mult: 'mult-page', emuland: 'emu-page', xfiles: 'xf-page' };
  Object.keys(ROUTES).forEach(key => {
    renderAll(key).forEach(({ url, html }) => {
      assert.ok(html.includes(marks[key]), `${url} has page class`);
      assert.ok(html.includes('webring-widget'), `${url} has webring`);
      assert.ok(!EMOJI.test(html), `${url} has no emoji`);
      assert.ok(!/border-radius|rgba\(|linear-gradient|radial-gradient/.test(html), `${url} has no modern inline styles`);
    });
  });
});

test('Site CSS keeps the Web 1.0 rules', () => {
  ['fargus-site', 'molotok-site', 'xakep-site', 'mult-site', 'emuland-site', 'xfiles-site'].forEach(name => {
    const css = read(`css/apps/${name}.css`);
    assert.ok(!/border-radius|rgba\(|linear-gradient|radial-gradient|blur\(|transition:/.test(css), `${name}.css`);
  });
});

test('The six sites look different from each other', () => {
  const layouts = {
    fargus: 'fargus-shelf', molotok: 'molotok-list', xakep: 'xakep-screen', mult: 'mult-canvas', emuland: 'emu-cart', xfiles: 'xf-cases'
  };
  Object.keys(layouts).forEach(key => {
    const home = window[SITES[key]].renderSite(ROUTES[key][0]);
    assert.ok(home.includes(layouts[key]), key);
    Object.keys(layouts).filter(k => k !== key).forEach(other => assert.ok(!home.includes(layouts[other]), `${key} vs ${other}`));
  });
});

test('Fargus: catalog games are real Steam games or CD demos, votes and patches work', () => {
  const site = window.fargusSite;
  const gm = read('js/game-manager.js');
  site.getGames().forEach(g => {
    const id = g.cdDemoId || g.steamId;
    const at = gm.indexOf(`id: '${id}'`);
    assert.ok(at > 0, `${id} in catalog`);
    assert.ok(gm.slice(at, at + 80).includes(g.cdDemoId ? 'cdDemo: true' : 'steam: true'), `${id} is sold in Steam or ships on the Igromania CD`);
    assert.ok(site.renderSite(`http://www.goldfargus.ru/game?id=${g.id}`).includes(g.num));
  });
  const before = site.getVotes().gta90;
  assert.strictEqual(site.saveVote('gta90').gta90, before + 1);
  assert.ok(site.renderSite('http://www.goldfargus.ru/vote').includes(`value="gta90" checked`));
  const file = site.savePatch('FARGUS_DOOM98_RUS.TXT');
  const saved = vfsFiles.find(f => f.name === file);
  assert.ok(saved && saved.content.includes('IDDQD') && saved.path.includes('Downloads'));
  site.getVoices().forEach(v => assert.ok(!v.game || site.getGames().some(g => g.id === v.game)));
});

test('Fargus guestbook escapes visitor text and answers it', () => {
  const site = window.fargusSite;
  site.addBookEntry('<b>Хакер</b>', 'Где диск 2? <script>alert(1)</script>');
  const html = site.renderSite('http://www.goldfargus.ru/guestbook');
  assert.ok(!html.includes('<script>alert(1)</script>') && html.includes('&lt;script&gt;'));
  assert.ok(html.includes('второй диск лежит под первым'));
});

test('Molotok: legacy lots migrate, bids, proxy bots, blitz and receipts', () => {
  const site = window.molotokSite;
  assert.strictEqual(localStorage.getItem('win98_molotok_lots_v2'), null);
  const awe = site.lot('awe64');
  assert.strictEqual(awe.bid, 55);
  assert.strictEqual(awe.leader, 'Вы');
  assert.ok(site.lot('trio64').won);
  site.renderSite('http://www.molotok98.ru');
  const cel = site.lot('celeron');
  assert.ok(!site.placeBid('celeron', cel.bid).ok, 'bid below the minimum is refused');
  const res = site.placeBid('celeron', cel.bid + cel.step);
  assert.ok(res.ok);
  assert.strictEqual(site.lot('celeron').leader, 'Вы');
  site.state.lots.celeron.pendingBot.at = 0;
  const after = site.lot('celeron');
  assert.notStrictEqual(after.leader, 'Вы', 'robot outbids while under its maximum');
  assert.strictEqual(after.bid, cel.bid + cel.step * 2);
  const high = site.placeBid('celeron', after.botMax + after.step);
  assert.ok(high.ok);
  assert.strictEqual(site.state.lots.celeron.pendingBot, null, 'robot gives up above its maximum');
  const blitz = site.buyNow('genius_mouse');
  assert.ok(blitz.ok);
  assert.ok(site.lot('genius_mouse').won && site.lot('genius_mouse').closed);
  assert.ok(vfsFiles.some(f => f.name === 'AUCTION_RECEIPT_GENIUS_MOUSE.TXT' && f.content.includes('Мышь Genius')));
  assert.ok(!site.buyNow('genius_mouse').ok, 'closed lot cannot be bought twice');
  const mine = site.renderSite('http://www.molotok98.ru/mybids');
  assert.ok(mine.includes('Мышь Genius') && mine.includes('куплен вами'));
});

test('Molotok: auctions end on the site clock and the leader wins', () => {
  const site = window.molotokSite;
  const sb = site.lot('sb16');
  site.placeBid('sb16', sb.botMax + sb.step);
  site.state.start = Date.now() - sb.hours * site.minutePerHour - 1000;
  const closed = site.lot('sb16');
  assert.ok(closed.closed && closed.won);
  assert.ok(vfsFiles.some(f => f.name === 'AUCTION_RECEIPT_SB16.TXT'));
  site.state.start = Date.now() - (site.roundHours + 1) * site.minutePerHour;
  site.renderSite('http://www.molotok98.ru');
  assert.ok(site.lot('genius_mouse').won, 'won lots survive a new round');
  assert.ok(!site.lot('voodoo2').closed, 'a new round reopens other lots');
});

test('Molotok: all 12 categories and 54 lots render with valid sellers and naming rules', () => {
  const site = window.molotokSite;
  const cats = site.getCategories();
  const lots = site.getLots();
  const sellers = site.getSellers();
  assert.strictEqual(cats.length, 12);
  assert.strictEqual(lots.length, 54);
  const home = site.renderSite('http://www.molotok98.ru');
  cats.forEach(c => {
    assert.ok(home.includes(c.name), `Home includes category ${c.id}`);
    const catLots = lots.filter(l => l.cat === c.id);
    assert.ok(catLots.length >= 3, `Category ${c.id} has at least 3 lots`);
    const catHtml = site.renderSite(`http://www.molotok98.ru/cat?id=${c.id}`);
    assert.ok(catHtml.includes(c.name), `Category page ${c.id} renders`);
    assert.ok(!EMOJI.test(catHtml), `Category page ${c.id} has no emoji`);
  });
  const seenIds = new Set();
  lots.forEach(l => {
    assert.ok(!seenIds.has(l.id), `Unique lot id ${l.id}`);
    seenIds.add(l.id);
    assert.ok(cats.some(c => c.id === l.cat), `Lot ${l.id} has valid category`);
    assert.ok(sellers[l.seller], `Lot ${l.id} has valid seller ${l.seller}`);
    assert.ok(l.start <= l.bid && l.bid < l.blitz && l.botMax < l.blitz, `Lot ${l.id} has valid prices`);
    const lotHtml = site.renderSite(`http://www.molotok98.ru/lot?id=${l.id}`);
    assert.ok(lotHtml.includes(site.esc(l.title)), `Lot ${l.id} renders title`);
    assert.ok(!EMOJI.test(lotHtml), `Lot ${l.id} has no emoji`);
    const text = lotHtml.replace(/<[^>]+>/g, ' ');
    assert.ok(!/Microsoft|MICROSOFT|Windows|WINDOWS(?!\\)/.test(text), `Lot ${l.id} follows naming rule`);
  });
});

test('Xakep: articles, keygen, mail', () => {
  const site = window.xakepSite;
  assert.strictEqual(site.getArticles().length, 18);
  site.getArticles().forEach(a => {
    const html = site.renderSite(`http://www.xakep98.ru/article?id=${a.id}`);
    assert.ok(html.includes(a.file), a.id);
    assert.ok(site.articleText(a).includes(a.title));
    const text = html.replace(/<[^>]+>/g, ' ');
    assert.ok(!/Microsoft|MICROSOFT|Windows|(?<!\\)WINDOWS(?!\\)/.test(text), a.id);
  });
  assert.ok(site.generateKey('arjcmd', 'TestUser').includes('XAK98'));
  assert.strictEqual(site.generateKey('arjcmd', 'A'), site.generateKey('arjcmd', 'A'));
  site.addMail('<i>x</i>', 'Как взломать пароль? <img src=x>');
  const mail = site.renderSite('http://www.xakep98.ru/mail');
  assert.ok(!mail.includes('<img src=x>') && mail.includes('Ломать чужое мы не учим'));
  const doom = site.getArticles().find(a => a.id === 'doom');
  const cheats = read('js/apps/cheatcc-site.js');
  ['IDDQD', 'IDKFA', 'IDFA', 'IDCLIP', 'IDCHOPPERS', 'IDBEHOLDV', 'IDBEHOLDA', 'IDDT', 'IDMYPOS'].forEach(code => {
    assert.ok(doom.body.join(' ').includes(code) && cheats.includes(`'${code}'`), code);
  });
});

test('Mult: episodes, guestbook migration and escaping', () => {
  const site = window.multSite;
  const eps = site.getEpisodes();
  assert.ok(eps.length >= 4);
  eps.forEach(ep => {
    assert.ok(site.renderSite(`http://www.mult98.ru/ep?id=${ep.id}`).includes(ep.title));
    ep.frames.forEach(f => assert.ok(site.getCast()[f.who], `${ep.id} speaker ${f.who}`));
  });
  const book = site.getGuestbook();
  assert.ok(book.some(e => e.text === 'Старая запись пользователя'));
  assert.strictEqual(book.filter(e => e.name === 'Лёха_Питер').length, 1, 'old seed copies are dropped');
  assert.strictEqual(localStorage.getItem('win98_mult_guestbook_v1'), null);
  site.addGuestbookEntry('Тестер', 'Отличный мульт <script>x</script>');
  const html = site.renderSite('http://www.mult98.ru/guestbook');
  assert.ok(html.includes('Отличный мульт &lt;script&gt;'));
  assert.ok(site.renderSite('http://www.mult98.ru').includes('МУЛЬТ.РУ'.split('').map((ch, i) => `<span class="mult-l${i % 4}">${ch}</span>`).join('')));
});

test('Emu-Land: ROM pages, downloads and counters', () => {
  const site = window.emuLandSite;
  const roms = site.getRoms();
  assert.ok(roms.length >= 8);
  const systems = site.getSystems().map(s => s.id);
  roms.forEach(r => {
    assert.ok(systems.includes(r.sys), r.id);
    assert.ok(site.renderSite(`http://www.emuland98.ru/rom?id=${r.id}`).includes(r.file), r.id);
  });
  const before = site.downloads(roms[0]);
  const file = site.downloadRom(roms[0].id);
  assert.strictEqual(site.downloads(roms[0]), before + 1);
  assert.ok(vfsFiles.some(f => f.name === file && f.path.includes('Downloads')));
  assert.strictEqual(site.downloadRom('nope'), null);
});

test('XFiles: redactions stay closed until the code word is entered', () => {
  const site = window.xFilesSite;
  const closed = site.renderSite('http://www.xfiles98.ru/case?id=modem');
  assert.ok(!closed.includes('знакомому звукорежиссёру') && closed.includes('xf-black'));
  assert.ok(!site.renderSite('http://www.xfiles98.ru/case?id=urals').includes('Сигнал повторился'));
  assert.ok(!site.tryCode('mulder1'));
  assert.ok(site.tryCode(' roswell '));
  const open = site.renderSite('http://www.xfiles98.ru/case?id=modem');
  assert.ok(open.includes('знакомому звукорежиссёру') && !open.includes('xf-black'));
  assert.ok(site.renderSite('http://www.xfiles98.ru/case?id=urals').includes('Сигнал повторился'));
  assert.strictEqual(JSON.parse(localStorage.getItem('win98_xfiles_decoded_v1')), true);
  assert.ok(!site.dossierText().includes('[['));
  const poll = site.savePollVote('sawUfo');
  assert.ok(poll.sawUfo > 0);
  site.addReport('<u>Я</u>', 'Видел шар <b>!</b>');
  assert.ok(site.renderSite('http://www.xfiles98.ru/reports').includes('Видел шар &lt;b&gt;!&lt;/b&gt;'));
});

test('Favorites menu keeps only the three portal sites', () => {
  assert.deepEqual(ie.favorites.map(f => f[0]), ['http://www.interpedia.org', 'http://www.microslop.com', 'http://www.search98.com']);
});

test('Rambler Top100 and Yandex catalog include all 6 sites', () => {
  const ramblerHtml = ie.renderRambler();
  Object.keys(ROUTES).forEach(k => assert.ok(ramblerHtml.includes(ROUTES[k][0]), k));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru?q=фаргус').includes('http://www.goldfargus.ru'));
});

test('All 6 sites render a Clippy button', () => {
  assert.ok(window.fargusSite.renderSite('http://www.goldfargus.ru').includes('fargus-btn-clippy'));
  assert.ok(window.molotokSite.renderSite('http://www.molotok98.ru').includes('molotok-btn-clippy'));
  assert.ok(window.xakepSite.renderSite('http://www.xakep98.ru').includes('xakep-btn-clippy'));
  assert.ok(window.multSite.renderSite('http://www.mult98.ru').includes('mult-btn-clippy'));
  assert.ok(window.emuLandSite.renderSite('http://www.emuland98.ru').includes('emu-btn-clippy'));
  assert.ok(window.xFilesSite.renderSite('http://www.xfiles98.ru').includes('xf-btn-clippy'));
});

test('Clippy site actions call methods and markup that exist', () => {
  const clippy = read('js/apps/clippy.js');
  const start = clippy.indexOf("      'fargus': {");
  const stage1 = ['fargus', 'molotok', 'xakep', 'mult', 'emuland', 'xfiles'];
  const later = [...clippy.slice(start).matchAll(/^      '([a-z0-9_]+)': \{/gm)].find(m => !stage1.includes(m[1]));
  const close = clippy.indexOf('    };', start);
  const end = later && start + later.index < close ? start + later.index : close;
  const block = clippy.slice(start, end);
  const calls = [...block.matchAll(/window\.(\w+Site)\.(\w+)\(/g)];
  assert.ok(calls.length >= 10);
  calls.forEach(([, obj, method]) => assert.strictEqual(typeof window[obj][method], 'function', `${obj}.${method}`));
  [...block.matchAll(/site\.(\w+)\(/g)].forEach(([, method]) => {
    assert.ok(['tryCode', 'playSpookyTone', 'dossierText', 'getArticles', 'articleText'].includes(method), method);
  });
  [...block.matchAll(/querySelector\('([^']+)'\)/g)].forEach(([, sel]) => {
    const cls = sel.replace(/^[.#]/, '');
    const all = read('js/apps/xakep-site.js') + read('js/apps/mult-site.js');
    assert.ok(all.includes(cls), sel);
  });
  [...block.matchAll(/openInIE\('([^']+)'\)/g)].forEach(([, url]) => {
    const key = ie.identifyPageKey(url);
    assert.ok(SITES[key], url);
    const html = window[SITES[key]].renderSite(url);
    assert.ok(!/не найден|нет такой|Такой серии нет/i.test(html), url);
  });
});

test('Clippy Help search finds topics for all 6 sites', () => {
  assert.strictEqual(window.clippyHelp.search('фаргус')[0].entry.id, 'fargus-site');
  assert.strictEqual(window.clippyHelp.search('молоток')[0].entry.id, 'molotok-site');
  assert.strictEqual(window.clippyHelp.search('хакер')[0].entry.id, 'xakep-site');
  assert.strictEqual(window.clippyHelp.search('масяня')[0].entry.id, 'mult-site');
  assert.strictEqual(window.clippyHelp.search('эмулятор')[0].entry.id, 'emuland-site');
  assert.strictEqual(window.clippyHelp.search('нло')[0].entry.id, 'xfiles-site');
});

test('Clippy Tips catalog contains tips and dispatches on navigation for all 6 sites', () => {
  const tips = window.clippyTips;
  ['fargus-voice', 'molotok-lots', 'xakep-zine', 'mult-episodes', 'emuland-games', 'xfiles-ufo'].forEach(id => assert.ok(tips.catalog[id], id));
  Object.keys(ROUTES).forEach(k => tips.onSiteVisited(k));
  assert.ok(tips.session.sites >= 6);
});

test('Project naming rule: no Microsoft or Windows names in site text', () => {
  Object.keys(ROUTES).forEach(key => {
    renderAll(key).forEach(({ url, html }) => {
      const text = html.replace(/<[^>]+>/g, ' ');
      assert.ok(!/Microsoft|MICROSOFT|Windows|WINDOWS(?!\\)/.test(text), url);
    });
  });
});

test('Strict zero comments policy in all site files', () => {
  const files = [
    'js/apps/fargus-site.js', 'css/apps/fargus-site.css',
    'js/apps/molotok-site.js', 'css/apps/molotok-site.css',
    'js/apps/xakep-site.js', 'css/apps/xakep-site.css',
    'js/apps/mult-site.js', 'css/apps/mult-site.css',
    'js/apps/emuland-site.js', 'css/apps/emuland-site.css',
    'js/apps/xfiles-site.js', 'css/apps/xfiles-site.css',
    'js/apps/clippy.js', 'js/apps/clippy-help.js', 'js/apps/clippy-tips.js',
    'tools/site-shots.cjs', 'tests/new-sites-stage1.test.js'
  ];
  for (const rel of files) {
    read(rel).split('\n').forEach((line, idx) => {
      const trimmed = line.trim();
      assert.ok(!trimmed.startsWith('//'), `Line comment in ${rel}:${idx + 1}`);
      assert.ok(!trimmed.startsWith('/*'), `Block comment in ${rel}:${idx + 1}`);
      assert.ok(!trimmed.startsWith('*'), `Asterisk comment in ${rel}:${idx + 1}`);
    });
  }
});

console.log(`\nALL ${passed} SITE TESTS PASSED!`);
