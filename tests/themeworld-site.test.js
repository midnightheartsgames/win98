const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

const vfsFiles = new Map();
const opened = [];
const sounds = [];
const started = [];
let display = { wallpaper: 'none', wallpaperMode: 'stretch', bgColor: '#008080', screensaverMode: 'pipes', themeId: 'classic' };
const downloaded = { wallpaper: [], screensaver: [], theme: [] };
const intervals = [];

global.setInterval = fn => { intervals.push(fn); return intervals.length; };
global.clearInterval = () => {};
const flushIntervals = () => {
  while (intervals.length) {
    const fn = intervals.shift();
    for (let i = 0; i < 12; i++) fn();
  }
};

const windows = new Map();
const dialogEls = [];
function fakeDialogElement() {
  const els = {};
  const make = sel => {
    const listeners = {};
    const el = {
      sel,
      disabled: sel !== '[data-tw-dl-close]',
      textContent: '',
      style: {},
      addEventListener(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
      fire(evt) { (listeners[evt] || []).forEach(fn => fn({ preventDefault() {} })); }
    };
    els[sel] = el;
    return el;
  };
  ['[data-tw-dl-bar]', '[data-tw-dl-status]', '[data-tw-dl-apply]', '[data-tw-dl-props]', '[data-tw-dl-close]'].forEach(make);
  return { querySelector: sel => els[sel] || null, els };
}

global.window = {
  addEventListener: () => {},
  webGif: name => `<span class="gif-${name}"></span>`,
  soundSys: {
    playClick: () => {},
    playDing: () => {},
    playPlusSound: (scheme, evt) => sounds.push(`${scheme}:${evt}`)
  },
  appScreensaver: { start: id => started.push(id) },
  winManager: {
    windows,
    openDialog: () => {},
    createWindow(opts) {
      const element = fakeDialogElement();
      windows.set(opts.id, { element });
      dialogEls.push({ opts, element });
      return { element };
    },
    closeWindow(id) { windows.delete(id); }
  },
  vfs: {
    writeFile: (folder, name, content) => { vfsFiles.set(folder.join('\\') + '\\' + name, content); return true; }
  },
  appDialogs: {
    getDisplaySettings: () => ({ ...display }),
    saveDisplaySettings: patch => { display = { ...display, ...patch }; return { ...display }; },
    applyDisplaySettings: () => {},
    getDownloadedWallpapers: () => downloaded.wallpaper.slice(),
    getDownloadedScreensavers: () => downloaded.screensaver.slice(),
    getDownloadedThemes: () => downloaded.theme.slice(),
    markDownloaded: (type, id) => { if (downloaded[type] && !downloaded[type].includes(id)) downloaded[type].push(id); },
    openDisplayProperties: tab => opened.push(tab || 'bg'),
    getMatrixWallpaperUrl: () => 'data:image/png;base64,MATRIX'
  }
};

eval(read('js/apps/themes.js'));
const applied = [];
const realApply = window.appThemes.applyTheme;
window.appThemes.applyTheme = function (id) {
  applied.push(id);
  this.currentThemeId = id;
  display.themeId = id;
};
eval(read('js/apps/themeworld-data.js'));
eval(read('js/apps/themeworld-site.js'));
eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/ie.js'));

const site = window.themeWorldSite;
const data = window.themeworldData;
const base = 'http://www.themeworld98.com';
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

function parseElements(html) {
  const els = [];
  const tagRe = /<([a-zA-Z0-9]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:="[^"]*")?)*)\s*\/?>/g;
  let m;
  while ((m = tagRe.exec(html))) {
    const attrs = {};
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:="([^"]*)")?/g;
    let a;
    while ((a = attrRe.exec(m[2]))) {
      attrs[a[1]] = a[2] === undefined ? '' : a[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    }
    const dataset = {};
    Object.keys(attrs).filter(k => k.startsWith('data-')).forEach(k => {
      dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = attrs[k];
    });
    const listeners = {};
    els.push({
      tag: m[1].toLowerCase(),
      attrs,
      dataset,
      classList: (attrs.class || '').split(/\s+/).filter(Boolean),
      value: attrs.value || '',
      disabled: 'disabled' in attrs,
      addEventListener(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
      fire(evt) { (listeners[evt] || []).forEach(fn => fn({ preventDefault() {} })); }
    });
  }
  return els;
}

function matches(el, sel) {
  if (sel.startsWith('#')) return el.attrs.id === sel.slice(1);
  const attrVal = sel.match(/^\[([-a-zA-Z0-9_]+)="([^"]+)"\]$/);
  if (attrVal) return el.attrs[attrVal[1]] === attrVal[2];
  const attrOnly = sel.match(/^\[([-a-zA-Z0-9_]+)\]$/);
  if (attrOnly) return attrOnly[1] in el.attrs;
  const classOnly = sel.match(/^\.([-a-zA-Z0-9_]+)$/);
  if (classOnly) return el.classList.includes(classOnly[1]);
  throw new Error('Unsupported selector ' + sel);
}

function browse(url) {
  const env = { url, html: '', els: [] };
  const container = {
    scrollTop: 0,
    querySelector: sel => env.els.find(el => matches(el, sel)) || null,
    querySelectorAll: sel => env.els.filter(el => matches(el, sel))
  };
  const ie = {
    currentUrl: url,
    renderPage(w, next) {
      this.currentUrl = next || this.currentUrl;
      env.url = this.currentUrl;
      env.html = site.renderSite(this.currentUrl);
      env.els = parseElements(env.html);
      site.attachEvents(w, container, this);
    },
    navigate(w, next) { this.renderPage(w, next); }
  };
  ie.renderPage({ id: 'app_ie' }, url);
  env.find = (sel, key, val) => {
    const list = container.querySelectorAll(sel);
    return key ? list.find(e => e.dataset[key] === val) : list[0];
  };
  env.click = (sel, key, val) => {
    const el = env.find(sel, key, val);
    assert.ok(el, `no element ${sel} ${key || ''}=${val || ''} on ${env.url}`);
    el.fire('click');
  };
  return env;
}

function allRoutes() {
  const r = ['/', '/wallpapers', '/wallpapers?cat=kino', '/wallpapers?cat=anime&res=640&sort=new', '/screensavers', '/themes', '/packs', '/help', '/guestbook', '/search?q=матрица', '/search?q=', '/search?q=zzzz'];
  data.wallpapers.forEach(w => r.push(`/wallpaper?id=${w.id}`, `/wallpaper?id=${w.id}&res=640`));
  data.screensavers.forEach(s => r.push(`/screensavers?id=${s.id}`));
  data.themes.forEach(t => r.push(`/theme?id=${t.id}`));
  return r.map(p => base + p);
}

test('IE routes every ThemeWorld address here and legacy aliases still work', () => {
  const ie = window.appIE;
  ['http://www.themeworld98.com', `${base}/help`, `${base}/search?q=millennium`, `${base}/wallpaper?id=gold`, `${base}/packs`, `${base}/guestbook`, 'http://www.matrix-screensaver.com', 'http://www.win98themes.com'].forEach(u => {
    assert.strictEqual(ie.identifyPageKey(u), 'themeworld', u);
  });
  assert.strictEqual(site.parseUrl('http://www.matrix-screensaver.com').section, 'screensavers');
  assert.strictEqual(site.parseUrl('http://www.matrix-screensaver.com').params.id, 'matrix');
  assert.strictEqual(site.parseUrl('http://www.win98themes.com').section, 'themes');
  assert.strictEqual(site.parseUrl(`${base}/?tab=packs`).section, 'packs');
  assert.strictEqual(site.parseUrl(`${base}/?q=pipes`).section, 'search');
  assert.ok(site.renderSite('screensavers').includes('tw-channels'), 'legacy tab argument');
  const ieSrc = read('js/apps/ie.js');
  assert.ok(ieSrc.includes('window.themeWorldSite.renderSite(url)'));
  assert.ok(ieSrc.includes('window.themeWorldSite.attachEvents(win, contentFrame, this)'));
});

test('every page renders with its own title and no broken values', () => {
  allRoutes().forEach(u => {
    const html = site.renderSite(u);
    assert.ok(!/undefined|NaN|\[object|null</.test(html), `bad value on ${u}`);
    assert.ok(html.includes('tw-shell'), `no shell on ${u}`);
    assert.ok(site.getPageTitle(u).startsWith("ThemeWorld '98"), u);
  });
  const nf = site.renderSite(`${base}/files/secret`);
  assert.ok(nf.includes('Not Found') && !nf.includes('tw-shell'));
  assert.strictEqual(site.getPageTitle(`${base}/files/secret`), '404 Not Found');
  assert.ok(site.renderSite(`${base}/wallpaper?id=nope`).includes('Файл не найден'));
  assert.ok(site.renderSite(`${base}/theme?id=nope`).includes('Файл не найден'));
});

test('pages use different forms, not one template', () => {
  const marks = {
    '/': ['Тема недели', 'Хит-парад загрузок', 'tw-log'],
    '/wallpapers': ['tw-sheet', 'tw-filter'],
    '/wallpaper?id=gold': ['tw-view', 'Сделать фоновым рисунком'],
    '/screensavers': ['tw-monitor', 'tw-ss-canvas', 'tw-channels'],
    '/themes': ['tw-compare', 'tw-chip'],
    '/theme?id=matrix': ['tw-mini', 'tw-pre', '[Control Panel\\Desktop]'],
    '/packs': ['tw-dos', 'PKUNZIP (R)'],
    '/help': ['tw-steps', 'tw-faq'],
    '/guestbook': ['tw-gb-form', 'Подписать книгу']
  };
  Object.keys(marks).forEach(p => {
    const html = site.renderSite(base + p);
    marks[p].forEach(m => assert.ok(html.includes(m), `${m} missing on ${p}`));
  });
  assert.ok(!site.renderSite(`${base}/wallpapers`).includes('tw-monitor'));
  assert.ok(!site.renderSite(`${base}/themes`).includes('tw-sheet'));
});

test('catalog matches Display Properties, themes and screen savers in the OS', () => {
  const dialogs = read('js/apps/dialogs.js');
  const i18n = read('js/i18n.js');
  const saverSrc = read('js/apps/screensaver.js');
  const artSrc = read('js/apps/wallpaper-art.js');
  const ids = name => JSON.parse(dialogs.match(new RegExp(`const ${name} = (\\[[^\\]]*\\])`))[1].replace(/'/g, '"'));
  const builtWalls = ids('builtInWallIds');
  const builtSavers = ids('builtInSaverIds');
  const builtThemes = ids('builtInThemeIds');

  data.wallpapers.forEach(w => {
    assert.ok(w.id === 'matrix' || new RegExp(`\\n    ${w.id}\\(ctx`).test(artSrc), `no painter for ${w.id}`);
    assert.ok(dialogs.includes(`{ id: '${w.id}', name: '${w.listName}' }`), `list name ${w.listName}`);
    assert.strictEqual(!!w.builtin, builtWalls.includes(w.id), `builtin flag ${w.id}`);
  });
  data.screensavers.forEach(s => {
    assert.ok(saverSrc.includes(`mode === '${s.id}'`) || s.id === 'pipes', `screen saver ${s.id}`);
    assert.ok(i18n.includes(`': '${s.listName}'`), `saver list name ${s.listName}`);
    assert.strictEqual(!!s.builtin, builtSavers.includes(s.id), `builtin saver ${s.id}`);
  });
  data.themes.forEach(t => {
    assert.ok(window.appThemes.themes[t.id], `theme ${t.id}`);
    assert.ok(i18n.includes(`'theme.${t.id}.name': '${t.listName}'`), `theme name ${t.listName}`);
    assert.strictEqual(!!t.official, builtThemes.includes(t.id), `official ${t.id}`);
  });

  const s = id => data.screensavers.find(x => x.id === id).desc;
  assert.ok(saverSrc.includes('const numFlags = 28;') && s('flying_win').includes('28 '));
  assert.ok(saverSrc.includes('const numStars = 400;') && s('starfield').includes('400 '));
  assert.ok(saverSrc.includes('[createPolygon(0), createPolygon(180)]') && s('mystify').startsWith('Два '));
  assert.ok(saverSrc.includes('length: 12 + Math.floor(Math.random() * 20)') && s('matrix').includes('от 12 до 31'));
  assert.ok(data.wallpapers.find(w => w.id === 'matrix').desc.includes('16 точек') && saverSrc.includes('const fontSize = 16;'));

  const cursors = data.cursorNames;
  data.themes.forEach(t => assert.ok(cursors[window.appThemes.themes[t.id].cursor], `cursor name ${t.id}`));
  assert.ok(data.themes.find(t => t.id === 'gold').sounds.includes('обычные'));
  assert.strictEqual(window.appThemes.themes.gold.soundScheme, 'classic');
});

test('file sizes, modem times and the .THEME file come from real numbers', () => {
  const r1024 = site.res('1024');
  assert.strictEqual(site.bmpBytes(r1024), 1024 * 768 * 3 + 54);
  assert.ok(data.faq.find(f => f.id === 'size').a.includes('2 359 296'));
  assert.strictEqual(Math.round(site.bmpBytes(site.res('640')) / 1024), 900);
  assert.ok(data.faq.find(f => f.id === 'size').a.includes('900 КБ'));
  const m56 = data.modems.find(m => m.id === '56k');
  assert.strictEqual(Math.round(site.bmpBytes(r1024) / m56.bytesPerSec / 60), 8);
  assert.ok(data.guestbook[0].text.includes('восемь минут на 56K'));
  const m336 = data.modems.find(m => m.id === '336');
  assert.ok(site.bmpBytes(r1024) / m336.bytesPerSec > 11 * 60);
  assert.ok(read('js/apps/clippy.js').includes('на модеме 33.6K это больше 11 минут'));
  assert.strictEqual(site.duration(59), '59 с');
  assert.strictEqual(site.duration(125), '2 мин 5 с');
  assert.strictEqual(site.duration(3725), '1 ч 2 мин');

  const red = data.themes.find(t => t.id === 'redalert');
  const ini = site.themeIni(red);
  assert.ok(ini.includes('ActiveTitle=94 5 5') && ini.includes('GradientActiveTitle=230 34 0'));
  assert.ok(ini.includes('Background=23 3 3'));
  assert.ok(ini.includes('Wallpaper=%ThemeDir%REDALERT.BMP'));
  assert.ok(ini.includes('Arrow=%ThemeDir%REDAL.CUR'));
  const gold = site.themeIni(data.themes.find(t => t.id === 'gold'));
  assert.ok(!gold.includes('[Control Panel\\Cursors]') && !gold.includes('AppEvents'));
  const files = site.themeFiles(red);
  assert.strictEqual(site.themeBytes(red), files.reduce((a, f) => a + f.bytes, 0));
  assert.strictEqual(files.find(f => f.kind === 'BMP').bytes, site.bmpBytes(site.res('800')));
  assert.ok(files.every(f => /^[A-Z0-9_]{1,8}\.[A-Z]{3,5}$/.test(f.name)), 'short file names');
});

test('PKUNZIP listings line up and add up', () => {
  data.packs.forEach(p => {
    const lines = site.zipListing(p).split('\n');
    const head = lines.findIndex(l => l.trim().startsWith('Length'));
    const nameCol = lines[head].indexOf('Name');
    const rows = lines.filter(l => l.includes('DeflatN'));
    const files = site.packFiles(p);
    assert.strictEqual(rows.length, files.length);
    rows.forEach((l, i) => assert.strictEqual(l.slice(nameCol), files[i].name, `column in ${p.file}`));
    const total = lines[lines.length - 1].trim().split(/\s+/);
    assert.strictEqual(Number(total[0]), files.reduce((a, f) => a + f.bytes, 0));
    assert.strictEqual(Number(total[1]), files.reduce((a, f) => a + f.packed, 0));
    assert.strictEqual(Number(total[3]), files.length);
    assert.ok(site.packBytes(p) < total[0] * 1);
    const names = files.map(f => f.name);
    assert.strictEqual(new Set(names).size, names.length, 'no duplicate files in a pack');
  });
});

test('download writes the file, marks it, and the dialog can apply it', () => {
  dialogEls.length = 0;
  const env = browse(`${base}/wallpaper?id=cyberpunk&res=640`);
  env.click('[data-tw-dl]', 'twDl', 'wallpaper:cyberpunk:640');
  assert.strictEqual(dialogEls.length, 1);
  assert.ok(dialogEls[0].opts.content.includes('C:\\My Documents\\Мои рисунки'));
  assert.ok(dialogEls[0].opts.content.includes('900 КБ'));
  flushIntervals();
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\Мои рисунки\\NEON98.BMP'));
  assert.ok(downloaded.wallpaper.includes('cyberpunk'));
  assert.ok(env.html.includes('скачано'), 'page refreshed with the new state');
  const dlg = dialogEls[0].element.els;
  assert.strictEqual(dlg['[data-tw-dl-apply]'].disabled, false);
  vfsFiles.delete('My Computer\\C:\\My Documents\\Мои рисунки\\NEON98.BMP');
  dlg['[data-tw-dl-apply]'].fire('click');
  assert.strictEqual(display.wallpaper, 'cyberpunk');
  assert.ok(!vfsFiles.has('My Computer\\C:\\My Documents\\Мои рисунки\\NEON98.BMP'), 'apply after download keeps the chosen size');
  assert.ok(env.html.includes('стоит у вас'));
  assert.ok(env.html.includes('NEON98.BMP</span>'), 'header monitor shows the wallpaper');
});

test('screen saver page: test, download, then make it the screen saver', () => {
  const env = browse(`${base}/screensavers?id=matrix`);
  const applyBtn = env.find('[data-tw-apply]');
  assert.ok(applyBtn.disabled, 'cannot apply before download');
  env.click('[data-tw-test]', 'twTest', 'matrix');
  assert.deepStrictEqual(started.slice(-1), ['matrix']);
  env.click('[data-tw-dl]', 'twDl', 'screensaver:matrix');
  flushIntervals();
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\Downloads\\MATRIX.SCR'));
  assert.ok(!env.find('[data-tw-apply]').disabled);
  env.click('[data-tw-apply]', 'twApply', 'screensaver:matrix');
  assert.strictEqual(display.screensaverMode, 'matrix');
  assert.ok(env.html.includes('Заставка выбрана'));
  env.click('[data-tw-props]', 'twProps', 'screensaver');
  assert.strictEqual(opened.slice(-1)[0], 'screensaver');
  const built = browse(`${base}/screensavers?id=starfield`);
  assert.ok(!built.find('[data-tw-apply]').disabled, 'built-in savers can be chosen at once');
});

test('themes: official ones apply at once, downloaded ones after download, sound plays', () => {
  const env = browse(`${base}/theme?id=space`);
  assert.ok(!env.find('[data-tw-dl]'), 'Plus! 98 themes are not offered for download');
  env.click('[data-tw-apply]', 'twApply', 'theme:space');
  assert.deepStrictEqual(applied.slice(-1), ['space']);
  const red = browse(`${base}/theme?id=redalert`);
  assert.ok(red.find('[data-tw-apply]').disabled);
  red.click('[data-tw-sound]', 'twSound', 'redalert');
  assert.strictEqual(sounds.slice(-1)[0], 'redalert:startup');
  red.click('[data-tw-dl]', 'twDl', 'theme:redalert');
  flushIntervals();
  assert.ok(String(vfsFiles.get('My Computer\\C:\\My Documents\\Downloads\\REDALERT.THEME')).startsWith('[Control Panel\\Desktop]'));
  assert.ok(downloaded.theme.includes('redalert') && downloaded.wallpaper.includes('redalert'));
  red.click('[data-tw-apply]', 'twApply', 'theme:redalert');
  assert.deepStrictEqual(applied.slice(-1), ['redalert']);
  assert.ok(!browse(`${base}/theme?id=gold`).find('[data-tw-sound]'), 'no sound button for the standard scheme');
});

test('packs mark every file inside', () => {
  const env = browse(`${base}/packs`);
  env.click('[data-tw-dl]', 'twDl', 'pack:pack_century');
  flushIntervals();
  ['cyberpunk', 'redalert', 'gold'].forEach(id => {
    assert.ok(downloaded.theme.includes(id), id);
    assert.ok(downloaded.wallpaper.includes(id), id);
  });
  assert.ok(downloaded.screensaver.includes('flying_win'));
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\Downloads\\CENTURY.ZIP'));
});

test('modem choice changes every estimate and is remembered', () => {
  const env = browse(`${base}/`);
  assert.ok(env.html.includes('на модеме 33.6K'));
  const sel = env.find('#tw-modem');
  sel.value = 'isdn';
  sel.fire('change');
  assert.ok(env.html.includes('на модеме ISDN 64K'));
  assert.ok(site.renderSite(`${base}/wallpapers`).includes('на ISDN 64K'));
  assert.strictEqual(localStorage.getItem('win98_themeworld_modem'), 'isdn');
  sel.value = 'bogus';
  assert.strictEqual(site.setModem('bogus'), false);
  site.setModem('336');
});

test('guestbook: inline error, escaping, legacy migration', () => {
  localStorage.setItem('win98_themeworld_guestbook', JSON.stringify([
    { name: 'Mine', from: 'Тула', date: '01 Jan 2026', text: 'моя старая запись' },
    { name: 'Neo_99', from: 'Zion / Moscow', date: '18 Nov 1999', text: 'старый текст' }
  ]));
  const env = browse(`${base}/guestbook`);
  assert.ok(env.html.includes('моя старая запись'));
  assert.ok(!env.html.includes('старый текст'));
  assert.strictEqual(localStorage.getItem('win98_themeworld_guestbook'), null);
  env.find('#tw-gb-name').value = 'Хакер';
  env.find('#tw-gb-text').value = '   ';
  env.find('#tw-gb').fire('submit');
  assert.ok(env.html.includes('Запись не добавлена'));
  assert.ok(env.html.includes('value="Хакер"'), 'draft kept after error');
  env.find('#tw-gb-text').value = '<script>alert(1)</script> привет';
  env.find('#tw-gb').fire('submit');
  assert.ok(env.html.includes('Запись добавлена'));
  assert.ok(env.html.includes('&lt;script&gt;alert(1)&lt;/script&gt; привет'));
  assert.ok(!env.html.includes('<script>alert'));
  const stored = JSON.parse(localStorage.getItem('win98_themeworld_user_v2'));
  assert.strictEqual(stored.guestbook.length, 2);
  assert.strictEqual(stored.guestbook[1].date, data.site.day);
});

test('search finds files and help, header form navigates', () => {
  const env = browse(`${base}/`);
  env.find('#tw-q').value = 'OpenGL';
  env.find('#tw-search').fire('submit');
  assert.ok(env.url.endsWith('/search?q=OpenGL'));
  assert.ok(env.html.includes('SSPIPES.SCR') && env.html.includes('SSFLWBOX.SCR'));
  const none = site.renderSite(`${base}/search?q=quake`);
  assert.ok(none.includes('Ничего не нашлось'));
  assert.ok(site.renderSite(`${base}/search?q=${encodeURIComponent('модем')}`).includes('[помощь]'));
});

test('Clippy actions call site methods that exist and work', () => {
  const clippy = read('js/apps/clippy.js');
  const block = clippy.slice(clippy.indexOf("'themeworld': {"), clippy.indexOf("'fargus': {"));
  assert.ok(block.includes("site.applyScreensaver('matrix')"));
  assert.ok(block.includes("site.applyWallpaper('spacecadet')"));
  assert.ok(site.applyScreensaver('matrix'));
  assert.ok(site.applyWallpaper('spacecadet'));
  assert.strictEqual(display.wallpaper, 'spacecadet');
  assert.strictEqual(site.applyWallpaper('space'), false, 'theme-only wallpapers are not catalog files');
  assert.ok(read('js/apps/outlook-mail.js').includes('архивом ZIP, до 1 МБ'));
  assert.ok(data.faq.find(f => f.id === 'send').a.includes('ZIP до 1 МБ'));
  window.appThemes.applyTheme = realApply;
});

test('Web 1.0 rules: no emoji, Microslop and Win naming, web-safe flat CSS, zero comments', () => {
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  const badMs = new RegExp('\\bMicro' + 'soft\\b', 'i');
  const badWin = new RegExp('\\bWin' + 'dows\\b', 'i');
  allRoutes().forEach(u => {
    const html = site.renderSite(u);
    assert.ok(!EMOJI.test(html), `emoji on ${u}`);
    assert.ok(!badMs.test(html), `vendor name on ${u}`);
    assert.ok(!badWin.test(html), `OS name on ${u}`);
  });
  const css = read('css/apps/themeworld.css');
  ['border-radius', 'box-shadow', 'text-shadow', 'rgba(', 'gradient', 'blur(', 'transition', 'animation', 'opacity'].forEach(p => {
    assert.ok(!css.includes(p), `forbidden ${p}`);
  });
  (css.match(/#[0-9a-fA-F]{6}\b/g) || []).forEach(c => assert.ok(/^#([0369cf])\1([0369cf])\2([0369cf])\3$/i.test(c), `not web-safe ${c}`));
  assert.ok(!/\/\*|\*\//.test(css), 'comments in css');
  ['js/apps/themeworld-data.js', 'js/apps/themeworld-site.js', 'tests/themeworld-site.test.js'].forEach(f => {
    assert.ok(!/\/\*|\*\/|^\s*\/\//m.test(read(f)), `comments in ${f}`);
  });
  const index = read('index.html');
  assert.ok(index.indexOf('js/apps/themeworld-data.js') > 0 && index.indexOf('js/apps/themeworld-data.js') < index.indexOf('js/apps/themeworld-site.js'));
  assert.ok(read('js/apps/themeworld-site.js').includes('mailto:admin@themeworld98.com'));
});

console.log(`\nALL ${passed} THEMEWORLD SITE TESTS PASSED`);
