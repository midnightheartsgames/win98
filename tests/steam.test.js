const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const PREINSTALLED_BEFORE_STEAM = ['fallout2', 'lol', 'mc98', 'doom', 'avatar98', 'hsr98', 'serioussam', 'dota', 'dao98', 'stalker98', 'diablo', 'kotor98', 'moh98', 'cop98', 'gta90'];

function mockElement(id = '') {
  return {
    id,
    dataset: {},
    style: {},
    value: '',
    checked: false,
    disabled: false,
    textContent: '',
    innerHTML: '',
    scrollTop: 0,
    scrollHeight: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { return c; },
    addEventListener() {},
    removeEventListener() {},
    contains() { return false; },
    focus() {},
    querySelector() { return mockElement(); },
    querySelectorAll() { return []; },
    getContext() { return new Proxy({}, { get: () => () => ({ addColorStop() {} }) }); },
    toDataURL() { return 'data:image/bmp;base64,mock'; }
  };
}

function createSystem(savedState) {
  const storage = new Map();
  if (savedState) storage.set('win98_game_state', JSON.stringify(savedState));
  const localStorage = {
    getItem: k => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k)
  };
  const opened = { dialogs: [], ie: [], windows: [] };
  const winManager = {
    windows: new Map(),
    createWindow(opts) {
      if (this.windows.has(opts.id)) return this.windows.get(opts.id);
      const win = { id: opts.id, opts, element: mockElement(opts.id), bodyElement: mockElement(), titleElement: mockElement() };
      this.windows.set(opts.id, win);
      opened.windows.push(opts.id);
      return win;
    },
    closeWindow(id) { this.windows.delete(id); },
    setTitle(id, title) { this.windows.get(id).title = title; },
    openDialog(opts) { opened.dialogs.push(opts); }
  };
  const ctx = {
    console,
    localStorage,
    innerWidth: 1024,
    innerHeight: 768,
    setTimeout: fn => { fn(); return 0; },
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    addEventListener() {},
    removeEventListener() {},
    document: {
      activeElement: null,
      createElement: () => mockElement(),
      getElementById: id => mockElement(id),
      addEventListener() {},
      removeEventListener() {}
    }
  };
  ctx.window = ctx;
  ctx.winManager = winManager;
  ctx.appIE = { open: url => opened.ie.push(url) };
  vm.createContext(ctx);
  vm.runInContext(read('js/i18n.js') + '; window.i18n = new I18nManager();', ctx);
  vm.runInContext(read('js/icons.js') + '; window.Icons = Icons;', ctx);
  vm.runInContext(read('js/filesystem.js'), ctx);
  vm.runInContext(read('js/game-manager.js'), ctx);
  vm.runInContext(read('js/desktop.js'), ctx);
  vm.runInContext(read('js/apps/steam.js'), ctx);
  vm.runInContext(read('js/apps/steam-site.js'), ctx);
  return { ctx, gm: ctx.gameManager, steam: ctx.appSteam, site: ctx.steamSite, vfs: ctx.vfs, desktop: ctx.desktop, opened };
}

function runDownloadToEnd(steam) {
  for (let i = 0; i < 60 && steam.downloads.size; i++) {
    steam.lastTick = Date.now() - 1000;
    steam.tick();
  }
}

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
}

console.log('--- Steam client, steampowered.com and games distribution ---');

test('fresh system ships without any of the former preinstalled games and without Steam', () => {
  const { gm, desktop } = createSystem();
  for (const id of PREINSTALLED_BEFORE_STEAM) {
    assert.equal(gm.isInstalled(id), false, `${id} must not be installed initially`);
    assert.equal(gm.ownsOnSteam(id), false, `${id} must not be owned initially`);
  }
  assert.equal(gm.isInstalled('steam'), false, 'Steam must not be preinstalled');
  const iconIds = desktop.computeCurrentIcons().map(i => i.id);
  for (const id of PREINSTALLED_BEFORE_STEAM.concat(['steam'])) assert.ok(!iconIds.includes(id), `no desktop icon for ${id}`);
  assert.ok(gm.isInstalled('minesweeper') && gm.isInstalled('winamp'), 'system programs stay installed');
});

test('every game of the catalog except Igromania CD demos is distributed through Steam', () => {
  const { gm } = createSystem();
  const games = Object.values(gm.catalog).filter(g => !g.isApp);
  const cdDemos = ['burnout', 'hockey'];
  for (const g of games) {
    assert.equal(!!g.steam, !cdDemos.includes(g.id), `${g.id} steam flag`);
  }
  for (const id of PREINSTALLED_BEFORE_STEAM) assert.ok(gm.isSteamGame(id), `${id} is sold in Steam`);
  assert.ok(gm.catalog.steam && gm.catalog.steam.isApp, 'Steam client itself is an installable app');
});

test('old saves are migrated: preinstalled games removed, paid licenses kept', () => {
  const { gm, vfs } = createSystem({
    purchased: ['fallout2', 'winamp', 'diablo', 'doom', 'half-life', 'lol'],
    downloaded: ['fallout2', 'winamp', 'diablo', 'doom', 'half-life', 'lol'],
    installed: ['minesweeper', 'fallout2', 'winamp', 'diablo', 'doom', 'half-life', 'lol'],
    doomGranted: true,
    lolGranted: true,
    diabloGranted: true
  });
  for (const id of ['fallout2', 'diablo', 'doom', 'half-life', 'lol']) assert.equal(gm.isInstalled(id), false, `${id} uninstalled by migration`);
  assert.equal(gm.ownsOnSteam('half-life'), true, 'bought Half-Life license stays in the Steam library');
  for (const id of ['fallout2', 'diablo', 'doom', 'lol']) assert.equal(gm.ownsOnSteam(id), false, `granted ${id} license removed`);
  assert.ok(gm.isInstalled('winamp'), 'winamp untouched');
  assert.ok(!Object.keys(gm.state).some(k => k.endsWith('Granted')), 'grant flags cleaned');
  const downloads = vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Downloads']);
  assert.ok(!downloads.children['Setup_Doom.exe'] && !downloads.children['Setup_HalfLife.exe'], 'Steam game installers removed from Downloads');
  const again = createSystem(gm.state);
  assert.equal(again.gm.ownsOnSteam('half-life'), true, 'migration runs only once');
});

test('steampowered.com offers the client download, then setup, then launch', () => {
  const { gm, site, desktop } = createSystem();
  assert.ok(site.renderSite('http://www.steampowered.com').includes('data-sps="download"'));
  gm.state.downloaded.push('steam');
  assert.ok(site.renderSite('http://www.steampowered.com').includes('data-sps="setup"'));
  gm.finishInstallation('steam');
  assert.ok(gm.isInstalled('steam'));
  assert.ok(site.renderSite('http://www.steampowered.com/games').includes('data-sps="launch"'));
  assert.ok(desktop.computeCurrentIcons().some(i => i.id === 'steam'), 'Steam desktop icon');
  const games = site.renderSite('http://www.steampowered.com/games');
  for (const id of PREINSTALLED_BEFORE_STEAM) assert.ok(games.includes(gm.catalog[id].title), `site lists ${id}`);
});

test('own games are paid with distinct prices, Fallout 2 Demo and Star Rail 98 are free', () => {
  const { gm } = createSystem();
  const ownGames = ['doom', 'serioussam', 'stalker98', 'lol', 'dota', 'avatar98', 'moh98', 'cop98', 'mc98', 'dao98', 'kotor98', 'gta90', 'hl2', 'tekken3', 'sammax', 'sammax102', 'sammax103', 'sammax104', 'sammax105', 'sammax106', 'sammax201', 'ow98', 'diablo2', 'forza', 'sims3', 'xiii', 'gtann', 'maxpayne', 'legion', 'plov', 'anotherwar', 'fallout', 'falloutzp'];
  const prices = ownGames.map(id => gm.catalog[id].price);
  assert.ok(prices.every(p => p > 0), 'every own game costs money');
  assert.equal(new Set(prices).size, prices.length, 'prices differ');
  ownGames.forEach(id => assert.equal(gm.catalog[id].priceDisplay, `$${gm.catalog[id].price.toFixed(2)}`, `${id} price label`));
  assert.equal(gm.catalog.fallout2.price, 0);
  assert.equal(gm.ownsOnSteam('fallout2'), false, 'free game still has to be added to the library');
  assert.equal(gm.catalog.hsr98.price, 0, 'Star Rail 98 is free to play like on its site');
  assert.equal(gm.ownsOnSteam('hsr98'), false, 'Star Rail 98 is not in the library until the player gets it');
});

test('Steam client: buy a game, download it and play from the desktop', () => {
  const { gm, steam, vfs, desktop } = createSystem();
  gm.finishInstallation('steam');
  assert.equal(steam.getGameState('doom'), 'store');
  assert.equal(steam.startDownload('doom'), null, 'cannot download a game that is not in the library');
  gm.purchaseGame('doom');
  assert.equal(steam.getGameState('doom'), 'owned');
  steam.startDownload('doom');
  assert.equal(steam.getGameState('doom'), 'downloading');
  runDownloadToEnd(steam);
  assert.equal(steam.getGameState('doom'), 'installed');
  assert.ok(vfs.resolvePath(['My Computer', 'C:', 'Games', 'Doom', 'DOOM.EXE']), 'game files in C:\\Games');
  assert.ok(desktop.computeCurrentIcons().some(i => i.id === 'doom'), 'desktop shortcut created');
  const downloads = vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Downloads']);
  assert.ok(!downloads.children['Setup_Doom.exe'], 'Steam does not leave installers in Downloads');
});

test('paused download does not progress until resumed', () => {
  const { gm, steam } = createSystem();
  gm.purchaseGame('diablo');
  steam.startDownload('diablo');
  steam.downloads.get('diablo').paused = true;
  runDownloadToEnd(steam);
  assert.equal(steam.downloads.get('diablo').doneKB, 0);
  steam.startDownload('diablo');
  runDownloadToEnd(steam);
  assert.ok(gm.isInstalled('diablo'));
});

test('faster connection finishes a download sooner', () => {
  const { steam } = createSystem();
  const kb = 22.6 * 1024;
  assert.ok(steam.downloadDurationSeconds(kb, 470) < steam.downloadDurationSeconds(kb, 48));
  assert.ok(steam.downloadDurationSeconds(2e6, 26) <= 30 && steam.downloadDurationSeconds(1, 1380) >= 5);
});

test('uninstall keeps the license', () => {
  const { gm, steam, desktop } = createSystem();
  gm.purchaseGame('lol');
  steam.startDownload('lol');
  runDownloadToEnd(steam);
  gm.uninstallGame('lol');
  assert.equal(steam.getGameState('lol'), 'owned');
  assert.ok(!desktop.computeCurrentIcons().some(i => i.id === 'lol'));
});

test('Fallout is installed only through Steam and leaves nothing behind when removed', () => {
  const { gm, steam, vfs, desktop } = createSystem();
  const folder = () => vfs.resolvePath(['My Computer', 'C:', 'Games', 'Fallout']);
  const icon = () => desktop.computeCurrentIcons().some(i => i.id === 'fallout');
  assert.equal(gm.isInstalled('fallout'), false, 'not preinstalled');
  assert.equal(gm.ownsOnSteam('fallout'), false, 'not owned');
  assert.ok(!icon() && !folder(), 'no shortcut and no files before the purchase');
  gm.finishInstallation('steam');
  gm.purchaseGame('fallout');
  steam.startDownload('fallout');
  runDownloadToEnd(steam);
  assert.equal(steam.getGameState('fallout'), 'installed');
  assert.ok(folder() && folder().children['FALLOUTW.EXE'] && folder().children['README.TXT'], 'FALLOUTW.EXE and README.TXT in C:\\Games\\Fallout');
  assert.ok(icon(), 'desktop shortcut');
  gm.uninstallGame('fallout');
  assert.equal(steam.getGameState('fallout'), 'owned');
  assert.ok(!icon() && !folder(), 'shortcut and files removed');
});

test('setup wizard for a Steam game redirects to Steam or to steampowered.com', () => {
  const { gm, opened } = createSystem();
  gm.openSetupWizard('doom');
  assert.ok(!opened.windows.includes('wizard_doom'), 'no classic setup wizard');
  assert.deepEqual(opened.ie, ['http://www.steampowered.com'], 'without Steam the site opens');
  gm.finishInstallation('steam');
  gm.openSetupWizard('doom');
  assert.ok(opened.windows.includes('steam_main') && opened.windows.includes('steam_games'), 'with Steam the Games window opens');
});

test('every Steam game has a genre, tags and two 640x480 screenshots', () => {
  const { gm, steam } = createSystem();
  const jpegSize = file => {
    const b = fs.readFileSync(path.join(root, file));
    assert.equal(b.readUInt16BE(0), 0xffd8, `${file} is a JPEG`);
    let i = 2;
    while (i < b.length) {
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xc2) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
    return [0, 0];
  };
  for (const id of gm.getSteamGameIds()) {
    const g = gm.catalog[id];
    assert.ok(typeof g.genre === 'string' && g.genre.length > 3, `${id} genre`);
    assert.ok(Array.isArray(g.tags) && g.tags.length >= 3 && g.tags.length <= 5, `${id} has 3-5 tags`);
    assert.equal(new Set(g.tags).size, g.tags.length, `${id} tags are unique`);
    assert.ok(g.tags.every(t => t && t.length <= 24 && t !== g.genre), `${id} tags are short and differ from the genre`);
    assert.ok(Array.isArray(g.shots) && g.shots.length >= 2, `${id} has at least two screenshots`);
    assert.ok(g.shots.every(c => c && c.length <= 32), `${id} screenshot captions fit the thumbnail`);
    const shots = steam.screenshots(id);
    shots.forEach((shot, i) => {
      assert.equal(shot.src, `content/steam/${id}-${i + 1}.jpg`);
      assert.deepEqual(jpegSize(shot.src), [640, 480], `${shot.src} is 640x480`);
    });
    assert.ok(!/Microsoft|Windows/.test([g.genre, ...g.tags, ...g.shots].join(' ')), `${id} store texts follow the naming rule`);
  }
});

test('Details opens a game page of the Buy window size with description, genre, tags and screenshots', () => {
  const { gm, steam, opened } = createSystem();
  gm.finishInstallation('steam');
  const info = steam.renderGameInfo('doom');
  assert.ok(info.includes('data-act="info"') && info.includes('Подробнее'), 'Games window offers Details');
  const details = steam.openDetails('doom');
  assert.ok(opened.windows.includes('steam_details_doom') && !opened.windows.includes('steam_buy_doom'), 'Details does not open the Buy window');
  const buy = steam.openBuy('doom');
  assert.equal(buy.id, 'steam_buy_doom');
  assert.deepEqual([details.opts.width, details.opts.height], [buy.opts.width, buy.opts.height], 'same size as Buy');
  assert.deepEqual([details.opts.width, details.opts.height], [440, 500]);
  const html = details.bodyElement.innerHTML;
  const doom = gm.catalog.doom;
  assert.ok(html.includes(steam.escape(doom.desc)), 'description');
  assert.ok(html.includes('Жанр') && html.includes(doom.genre), 'genre');
  for (const tag of doom.tags) assert.ok(html.includes(`<span class="stm-tag">${tag}</span>`), `tag ${tag}`);
  assert.equal((html.match(/data-shot=/g) || []).length, doom.shots.length, 'one thumbnail per screenshot');
  assert.ok(html.includes('content/steam/doom-1.jpg') && html.includes('content/steam/doom-2.jpg'));
  assert.ok(!html.includes('data-f="num"'), 'no payment form on the game page');
  assert.equal(steam.openDetails('nope'), null);
  assert.equal(steam.openDetails('winamp'), null, 'only Steam games have a page');
});

test('Details follows the game state and installed games keep their page', () => {
  const { gm, steam, opened } = createSystem();
  assert.equal(steam.primaryLabel('doom'), 'Купить');
  assert.equal(steam.primaryLabel('fallout2'), 'Получить');
  assert.ok(steam.statusLabel('doom').includes('$9.99'));
  gm.purchaseGame('doom');
  assert.equal(steam.primaryLabel('doom'), 'Загрузить');
  assert.equal(steam.openBuy('doom').id, 'steam_details_doom', 'an owned game has nothing to buy, its page opens instead');
  assert.ok(!opened.windows.includes('steam_buy_doom'));
  steam.startDownload('doom');
  assert.equal(steam.primaryLabel('doom'), 'Ход загрузки');
  assert.ok(steam.statusLabel('doom').startsWith('Загрузка:'));
  runDownloadToEnd(steam);
  assert.equal(steam.primaryLabel('doom'), 'Играть');
  const info = steam.renderGameInfo('doom');
  assert.ok(info.includes('data-act="info"') && info.includes('data-act="uninstall"'), 'installed game: Details and Uninstall');
});

test('screenshot viewer steps through the screenshots and stops at both ends', () => {
  const { steam, opened, ctx } = createSystem();
  assert.equal(steam.openScreenshot('doom', 5), null, 'no such screenshot');
  assert.equal(steam.openScreenshot('nope', 0), null, 'no such game');
  const win = steam.openScreenshot('doom', 0);
  assert.ok(opened.windows.includes('steam_shot'));
  assert.ok(win.opts.width <= ctx.innerWidth && win.opts.height <= ctx.innerHeight, 'viewer fits the screen');
  assert.ok(win.title.includes('снимок 1 из 2'));
  steam.stepScreenshot(-1);
  assert.equal(steam.viewer.index, 0);
  steam.stepScreenshot(1);
  steam.stepScreenshot(1);
  assert.equal(steam.viewer.index, 1);
  assert.ok(win.title.includes('снимок 2 из 2'));
  steam.openScreenshot('diablo', 1);
  assert.deepEqual([steam.viewer.id, steam.viewer.index], ['diablo', 1], 'one viewer window is reused for another game');
  assert.equal(opened.windows.filter(id => id === 'steam_shot').length, 1);
});

test('Games window sorts the library and the store by name and by price', () => {
  const { gm, steam } = createSystem();
  gm.finishInstallation('steam');
  const store = gm.getSteamGameIds().filter(id => steam.getGameState(id) === 'store');
  const titles = ids => ids.map(id => gm.catalog[id].title);
  const prices = ids => ids.map(id => gm.catalog[id].price || 0);
  const byName = steam.sortGameIds(store, 'nameAsc');
  assert.deepEqual(titles(byName), titles(store).sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true })), 'A to Z');
  assert.deepEqual(steam.sortGameIds(store, 'nameDesc'), byName.slice().reverse(), 'Z to A');
  const cheap = prices(steam.sortGameIds(store, 'priceAsc'));
  assert.ok(cheap.every((p, i) => i === 0 || cheap[i - 1] <= p), 'cheapest first');
  assert.equal(steam.sortGameIds(store, 'priceAsc')[0], 'fallout2', 'free game comes first');
  const dear = prices(steam.sortGameIds(store, 'priceDesc'));
  assert.ok(dear.every((p, i) => i === 0 || dear[i - 1] >= p), 'most expensive first');
  assert.deepEqual(steam.sortGameIds(store, 'default'), store, 'default keeps the catalog order');
  steam.settings.gamesSort = 'priceDesc';
  const win = steam.openGames();
  assert.ok(win.bodyElement.innerHTML.includes('data-sort') && win.bodyElement.innerHTML.includes('value="priceDesc" selected'), 'sort list shows the saved choice');
});

test('buygames98.com store is gone, IE routes steampowered.com', () => {
  const ie = read('js/apps/ie.js');
  assert.ok(!ie.includes('buygames98') && !ie.includes('renderGameStore'), 'old store removed');
  assert.ok(ie.includes("return 'steam';") && ie.includes('window.steamSite.renderSite(url)'));
  const html = read('index.html');
  assert.ok(html.includes('js/apps/steam.js') && html.includes('js/apps/steam-site.js') && html.includes('css/apps/steam.css'));
  for (const f of ['js/apps/dialogs.js', 'js/i18n.js', 'js/apps/explorer.js', 'js/game-manager.js', 'js/filesystem.js', 'js/apps/retro-sites.js']) {
    assert.ok(!read(f).includes('buygames98'), `${f} has no links to the removed store`);
  }
});

test('new Steam files contain no comments', () => {
  for (const f of ['js/apps/steam.js', 'js/apps/steam-site.js', 'tools/steam-shots.cjs', 'tools/steam-shots-recipes.cjs']) {
    const src = read(f).replace(/https?:\/\/[^\s'"`]+/g, '');
    assert.ok(!/\/\/|\/\*/.test(src), `${f} has no comments`);
  }
  for (const f of ['css/apps/steam.css', 'css/apps/steam-site.css']) assert.ok(!read(f).includes('/*'), `${f} has no comments`);
});

console.log(`\nALL ${passed} STEAM TESTS PASSED!`);
