const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write('  ✓ ' + name + '\n');
  } catch (err) {
    failed++;
    failures.push({ name, err });
    process.stdout.write('  ✗ ' + name + '\n    ' + (err && err.stack ? err.stack : err) + '\n');
  }
}

function makeStorage() {
  const store = {};
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    clear() { Object.keys(store).forEach((k) => delete store[k]); },
    _dump() { return Object.assign({}, store); }
  };
}

function parseAttrs(attrText) {
  const attrs = {};
  const re = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m;
  while ((m = re.exec(attrText)) !== null) {
    attrs[m[1]] = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
  }
  if (/\bchecked\b/i.test(attrText) && attrs.checked === undefined) attrs.checked = 'checked';
  if (/\bselected\b/i.test(attrText) && attrs.selected === undefined) attrs.selected = 'selected';
  return attrs;
}

function matchesSelector(el, selector) {
  let s = selector.trim();
  const requireChecked = s.endsWith(':checked');
  if (requireChecked) {
    if (!el.checked) return false;
    s = s.slice(0, -8).trim();
  }
  if (s.startsWith('#')) {
    return el.id === s.slice(1);
  }
  if (s.startsWith('.')) {
    const classes = (el.className || '').split(/\s+/);
    return classes.includes(s.slice(1));
  }
  const attrOnlyMatch = s.match(/^\[([a-zA-Z0-9_:-]+)(?:="([^"]*)")?\]$/);
  if (attrOnlyMatch) {
    const attrName = attrOnlyMatch[1];
    const attrVal = attrOnlyMatch[2];
    const actual = el.getAttribute(attrName);
    if (actual === null) return false;
    return attrVal === undefined ? true : actual === attrVal;
  }
  const tagAttrMatch = s.match(/^([a-zA-Z0-9]+)\[([a-zA-Z0-9_:-]+)(?:="([^"]*)")?\]$/);
  if (tagAttrMatch) {
    if (el.tagName.toLowerCase() !== tagAttrMatch[1].toLowerCase()) return false;
    const actual = el.getAttribute(tagAttrMatch[2]);
    if (actual === null) return false;
    return tagAttrMatch[3] === undefined ? true : actual === tagAttrMatch[3];
  }
  return el.tagName.toLowerCase() === s.toLowerCase();
}

function parseElements(html, containerRef) {
  const elements = [];
  const tagRe = /<(button|input|select|textarea|form|div|span|a|table|tr|td|th)\b([^>]*)>/gi;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    const attrs = parseAttrs(m[2]);
    let value = attrs.value !== undefined ? attrs.value : '';
    let innerHTML = '';

    if (tag === 'select' || tag === 'textarea' || tag === 'button') {
      const closeRe = new RegExp('</' + tag + '\\s*>', 'ig');
      closeRe.lastIndex = tagRe.lastIndex;
      const closeMatch = closeRe.exec(html);
      if (closeMatch) {
        innerHTML = html.slice(tagRe.lastIndex, closeMatch.index);
        if (tag === 'select') {
          const optRe = /<option\b([^>]*)>/gi;
          let om;
          let firstVal = null;
          let selectedVal = null;
          while ((om = optRe.exec(innerHTML)) !== null) {
            const oa = parseAttrs(om[1]);
            if (firstVal === null && oa.value !== undefined) firstVal = oa.value;
            if (oa.selected !== undefined && oa.value !== undefined) selectedVal = oa.value;
          }
          value = selectedVal !== null ? selectedVal : (firstVal !== null ? firstVal : '');
        } else if (tag === 'textarea' && !value) {
          value = innerHTML;
        }
      }
    }

    const listeners = {};
    const dataset = {};
    Object.keys(attrs).forEach((k) => {
      if (k.startsWith('data-')) {
        const camel = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        dataset[camel] = attrs[k];
      }
    });

    const el = {
      tagName: tag.toUpperCase(),
      id: attrs.id || '',
      className: attrs.class || '',
      name: attrs.name || '',
      type: attrs.type || '',
      value,
      checked: attrs.checked !== undefined,
      innerHTML,
      textContent: innerHTML.replace(/<[^>]*>/g, ''),
      attrs,
      dataset,
      style: {},
      scrollTop: 0,
      scrollHeight: 240,
      focus() {},
      querySelector(sel) {
        return containerRef ? containerRef.querySelector(sel) : null;
      },
      querySelectorAll(sel) {
        return containerRef ? containerRef.querySelectorAll(sel) : [];
      },
      getAttribute(attrName) {
        return Object.prototype.hasOwnProperty.call(attrs, attrName) ? attrs[attrName] : null;
      },
      setAttribute(attrName, val) {
        attrs[attrName] = String(val);
      },
      addEventListener(type, handler) {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(handler);
      },
      trigger(type, extraEvent) {
        const list = listeners[type] || [];
        const evt = Object.assign({
          type,
          target: el,
          currentTarget: el,
          preventDefault() {},
          stopPropagation() {}
        }, extraEvent || {});
        list.forEach((fn) => fn.call(el, evt));
      },
      click() {
        el.trigger('click');
      }
    };
    elements.push(el);
  }
  return elements;
}

function createHarness() {
  const localStorage = makeStorage();
  const vfsFiles = {};
  const launchedGames = [];
  const steamShown = [];
  const cdShown = [];
  const notepadOpened = [];
  const ownedGames = new Set();
  const installedGames = new Set();
  const downloadingGames = new Map();
  const gmListeners = [];

  const env = {
    localStorage,
    vfsFiles,
    launchedGames,
    steamShown,
    cdShown,
    notepadOpened,
    ownedGames,
    installedGames,
    downloadingGames,
    gmListeners,
    currentUrl: 'http://www.bioware98.com',
    html: '',
    els: []
  };

  const container = {
    get innerHTML() {
      return env.html;
    },
    set innerHTML(val) {
      env.html = String(val || '');
      env.els = parseElements(env.html, container);
    },
    querySelector(sel) {
      for (let i = 0; i < env.els.length; i++) {
        if (matchesSelector(env.els[i], sel)) return env.els[i];
      }
      return null;
    },
    querySelectorAll(sel) {
      const parts = sel.split(',').map((p) => p.trim()).filter(Boolean);
      return env.els.filter((el) => parts.some((p) => matchesSelector(el, p)));
    }
  };

  const win = {
    id: 'win-ie-test',
    querySelector(sel) {
      if (sel === '.ie-Status-Text') return { textContent: '' };
      if (sel === '#ie-address-bar') return { value: env.currentUrl };
      return container.querySelector(sel);
    },
    querySelectorAll(sel) {
      return container.querySelectorAll(sel);
    }
  };

  global.localStorage = localStorage;
  global.window = global;
  global.navigator = { language: 'ru-RU' };
  global.t = (key) => key;

  global.vfs = {
    exists(folderPath, fileName) {
      const k = folderPath.join('/') + '/' + fileName;
      return Object.prototype.hasOwnProperty.call(vfsFiles, k);
    },
    createFile(folderPath, fileName, content) {
      const k = folderPath.join('/') + '/' + fileName;
      vfsFiles[k] = content;
    },
    writeFile(folderPath, fileName, content) {
      const k = folderPath.join('/') + '/' + fileName;
      vfsFiles[k] = content;
    },
    getFileContent(folderPath, fileName) {
      const k = folderPath.join('/') + '/' + fileName;
      return vfsFiles[k] || null;
    }
  };

  global.appNotepad = {
    openFile(folderPath, fileName) {
      notepadOpened.push({ folderPath, fileName });
    }
  };

  global.gameManager = {
    isInstalled(id) { return installedGames.has(id); },
    isPurchased(id) { return ownedGames.has(id) || installedGames.has(id); },
    isOwned(id) { return ownedGames.has(id) || installedGames.has(id); },
    ownsOnSteam(id) { return ownedGames.has(id) || installedGames.has(id); },
    isDownloading(id) { return downloadingGames.has(id); },
    getDownloadProgress(id) { return downloadingGames.get(id) || 0; },
    showInSteam(id) { steamShown.push(id); },
    showOnCd(id) { cdShown.push(id); },
    launchGame(id) { launchedGames.push(id); },
    onChange(cb) { gmListeners.push(cb); }
  };

  global.appIE = {
    currentUrl: env.currentUrl,
    navigate(w, url) {
      const targetUrl = typeof w === 'string' ? w : url;
      this.renderPage(win, targetUrl);
    },
    renderPage(w, url) {
      const targetUrl = typeof w === 'string' ? w : url;
      env.currentUrl = targetUrl;
      this.currentUrl = targetUrl;
      const site = global.biowareSite;
      container.innerHTML = site.renderSite(targetUrl);
      site.attachEvents(win, container, this);
    }
  };

  delete require.cache[require.resolve('../js/apps/bioware-data.js')];
  delete require.cache[require.resolve('../js/apps/bioware-site.js')];
  require('../js/apps/bioware-data.js');
  require('../js/apps/bioware-site.js');

  env.win = win;
  env.container = container;
  env.navigate = (url) => global.appIE.renderPage(win, url);
  return env;
}

console.log('\n=== BioWare Edmonton 1998 Portal Test Suite ===\n');

const env = createHarness();
const data = global.BIOWARE_DATA;
const site = global.biowareSite;
const dao = data.getDao();
const kotor = data.getKotor();

console.log('1. Маршрутизация и интеграция с системой (IE, WebSeeker, Yandex, WebRing, Clippy, Outlook)');

test('Данные и экземпляр портала BioWare загружаются в глобальную область', () => {
  assert.ok(data, 'BIOWARE_DATA должен быть определён');
  assert.ok(site && typeof site.renderSite === 'function', 'biowareSite должен иметь метод renderSite');
  assert.ok(dao && dao.ORIGINS && dao.AB, 'Движок Dao98 должен быть подгружен');
  assert.ok(kotor && kotor.AREAS && kotor.FEATS && kotor.Pazaak, 'Движок Kotor98 должен быть подгружен');
});

test('parseRoute корректно распознаёт домены и разделы портала BioWare Edmonton', () => {
  assert.strictEqual(site.parseRoute('http://www.bioware98.com').page, 'home');
  assert.strictEqual(site.parseRoute('http://bioware.com/').page, 'home');
  assert.strictEqual(site.parseRoute('http://www.bioware98.com/ferelden').page, 'ferelden');
  assert.strictEqual(site.parseRoute('http://www.bioware98.com/tactics').page, 'tactics');
  assert.strictEqual(site.parseRoute('http://www.bioware98.com/taris').page, 'taris');
  assert.strictEqual(site.parseRoute('http://www.bioware98.com/d20').page, 'd20');
  assert.strictEqual(site.parseRoute('http://www.bioware98.com/studio').page, 'studio');
  assert.strictEqual(site.parseRoute('http://www.bioware98.com/guestbook').page, 'guestbook');
  const searchRoute = site.parseRoute('http://www.bioware98.com/search?q=Морриган');
  assert.strictEqual(searchRoute.page, 'search');
  assert.strictEqual(searchRoute.params.q, 'Морриган');
});

test('Internet Explorer (js/apps/ie.js) маршрутизирует bioware98, ferelden98, kotor98 и индексирует сайт в WebSeeker 98', () => {
  const ieCode = fs.readFileSync(path.join(ROOT, 'js', 'apps', 'ie.js'), 'utf8');
  assert.ok(ieCode.includes("clean.includes('bioware98')"), 'ie.js должен распознавать bioware98');
  assert.ok(ieCode.includes("clean.includes('ferelden98')"), 'ie.js должен распознавать ferelden98');
  assert.ok(ieCode.includes("clean.includes('kotor98')"), 'ie.js должен распознавать kotor98');
  assert.ok(ieCode.includes("pageKey === 'bioware'"), 'ie.js должен обрабатывать pageKey === bioware');
  assert.ok(ieCode.includes('http://www.bioware98.com'), 'WebSeeker 98 должен содержать ссылку на http://www.bioware98.com');
});

test('RetroSites (js/apps/retro-sites.js) включает bioware98.com в WebRing и каталог Яndex', () => {
  const retroCode = fs.readFileSync(path.join(ROOT, 'js', 'apps', 'retro-sites.js'), 'utf8');
  assert.ok(retroCode.includes('http://www.bioware98.com'), 'WebRing должен включать bioware98.com');
  assert.ok(retroCode.includes("qLower.includes('bioware')"), 'Поисковик Яndex должен обрабатывать прямые запросы bioware/ферелден/тарис');
});

test('Clippy Help, Clippy Tips, Outlook Express и index.html интегрированы с порталом BioWare Edmonton', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('css/apps/bioware-site.css'), 'index.html должен подключать css/apps/bioware-site.css');
  assert.ok(indexHtml.includes('js/apps/bioware-data.js'), 'index.html должен подключать js/apps/bioware-data.js');
  assert.ok(indexHtml.includes('js/apps/bioware-site.js'), 'index.html должен подключать js/apps/bioware-site.js');

  const helpCode = fs.readFileSync(path.join(ROOT, 'js', 'apps', 'clippy-help.js'), 'utf8');
  assert.ok(helpCode.includes("id: 'bioware-site'"), 'clippy-help.js должен содержать справку bioware-site');

  const tipsCode = fs.readFileSync(path.join(ROOT, 'js', 'apps', 'clippy-tips.js'), 'utf8');
  assert.ok(tipsCode.includes("'bioware-rpg'"), 'clippy-tips.js должен содержать совет bioware-rpg');

  const outlookCode = fs.readFileSync(path.join(ROOT, 'js', 'apps', 'outlook-mail.js'), 'utf8');
  assert.ok(outlookCode.includes("addr: 'support@bioware98.com'"), 'outlook-mail.js должен содержать корреспондента support@bioware98.com');
  assert.ok(outlookCode.includes("id: 'dao_origins'"), 'outlook-mail.js должен содержать тему dao_origins');
  assert.ok(outlookCode.includes("id: 'kotor_taris'"), 'outlook-mail.js должен содержать тему kotor_taris');
});

console.log('\n2. Полнота и достоверность данных движков Dao98 и Kotor98');

test('Данные Dragon Age: Origins 98 синхронизированы с движком Dao98 (6 предысторий, 18 веток, 79 способностей, 12 рецептов, 16 условий, 25 локаций)', () => {
  const origins = Object.keys(dao.ORIGINS);
  assert.strictEqual(origins.length, 6, 'Должно быть ровно 6 предысторий DAO');
  ['hn', 'mage', 'ce', 'de', 'dn', 'dc'].forEach((id) => {
    assert.ok(dao.ORIGINS[id], 'Предыстория ' + id + ' должна существовать в движке Dao98');
  });

  assert.strictEqual(Object.keys(dao.LINES).length, 18, 'Должно быть 18 веток талантов и заклинаний DAO');
  assert.strictEqual(Object.keys(dao.AB).length, 79, 'Должно быть 79 способностей в DAO');
  assert.strictEqual(dao.RECIPES.length, 12, 'Должно быть 12 рецептов травничества DAO');
  assert.strictEqual(Object.keys(dao.TAC_COND).length, 16, 'Должно быть 16 условий тактических слотов DAO');
  assert.strictEqual(Object.keys(dao.AREAS).length, 25, 'Должно быть 25 локаций Ферелдена в DAO');
});

test('Данные Star Wars: KOTOR 98 синхронизированы с движком Kotor98 (13 секторов Тариса, 6 спутников, 16 черт, 4 Силы, 4 магазина, 7 квестов)', () => {
  assert.strictEqual(Object.keys(kotor.AREAS).length, 13, 'Должно быть 13 секторов Тариса');
  assert.strictEqual(kotor.PARTY_IDS.length, 6, 'Должно быть 6 спутников отряда KOTOR');
  assert.strictEqual(Object.keys(kotor.FEATS).length, 16, 'Должно быть 16 боевых черт (Feats)');
  assert.strictEqual(Object.keys(kotor.POWERS).length, 4, 'Должно быть 4 Силы Джедаев');
  assert.strictEqual(Object.keys(kotor.SHOPS).length, 4, 'Должно быть 4 магазина Тариса');
  assert.strictEqual(Object.keys(kotor.QUESTS).length, 7, 'Должно быть 7 основных квестов Тариса');
});

console.log('\n3. Демоверсии dao98_demo и kotor98_demo на CD «Игромании»');

test('Витрина демоверсий для dao98_demo и kotor98_demo отражает состояния CD -> Installed и не упоминает Steam', () => {
  env.ownedGames.clear();
  env.installedGames.clear();
  env.cdShown.length = 0;
  env.steamShown.length = 0;
  env.launchedGames.length = 0;

  env.navigate('http://www.bioware98.com/');
  assert.ok(env.html.includes('ДЕМОВЕРСИЯ НА CD «ИГРОМАНИИ»'), 'По умолчанию обе демоверсии лежат на диске «Игромании»');
  assert.ok(env.html.includes('D:\\demo\\dao98demo.exe') && env.html.includes('D:\\demo\\kotor98demo.exe'), 'Кнопки называют установщики на диске D:');
  assert.ok(!/steam/i.test(env.html), 'На главной странице не должно быть упоминаний Steam');
  assert.ok(!/\$\d/.test(env.html), 'У демоверсий нет цены');
  assert.ok(!/href="[^"]*\.(exe|zip|msi)"/i.test(env.html), 'На сайте не должно быть прямых ссылок на скачивание .exe/.zip');

  const cdBtnDao = env.container.querySelector('[data-bw-open-cd="dao98_demo"]');
  const cdBtnKotor = env.container.querySelector('[data-bw-open-cd="kotor98_demo"]');
  assert.ok(cdBtnDao && cdBtnKotor, 'Кнопки демоверсий на диске должны присутствовать для обеих игр');

  cdBtnDao.click();
  cdBtnKotor.click();
  assert.deepStrictEqual(env.cdShown, ['dao98_demo', 'kotor98_demo'], 'Клик по кнопкам должен вызывать gameManager.showOnCd');
  assert.deepStrictEqual(env.steamShown, [], 'Steam не открывается');

  env.installedGames.add('kotor98_demo');
  env.navigate('http://www.bioware98.com/');

  assert.ok(env.html.includes('ДЕМОВЕРСИЯ НА CD «ИГРОМАНИИ»'), 'Неустановленная dao98_demo по-прежнему на диске');
  assert.ok(env.html.includes('ДЕМОВЕРСИЯ УСТАНОВЛЕНА'), 'Установленная kotor98_demo должна отображать статус готовности к запуску');

  const launchBtnKotor = env.container.querySelector('[data-bw-launch-game="kotor98_demo"]');
  assert.ok(launchBtnKotor, 'Для установленной kotor98_demo должна появиться кнопка запуска');
  assert.ok(!env.container.querySelector('[data-bw-open-cd="kotor98_demo"]'), 'У установленной демоверсии нет кнопки диска');
  launchBtnKotor.click();
  assert.deepStrictEqual(env.launchedGames, ['kotor98_demo'], 'Клик по кнопке запуска должен вызывать gameManager.launchGame("kotor98_demo")');
});

console.log('\n4. Интерактивность главной страницы (новости, экспорт в Блокнот, опрос сообщества)');

test('Фильтрация дев-журналов, чтение статей и экспорт в Блокнот работают корректно', () => {
  env.navigate('http://www.bioware98.com/');

  const kotorFilterBtn = env.container.querySelector('[data-bw-news-filter="kotor98"]');
  assert.ok(kotorFilterBtn, 'Кнопка фильтра новостей KOTOR 98 должна существовать');
  kotorFilterBtn.click();
  assert.strictEqual(site.newsFilter, 'kotor98');

  const newsBtn = env.container.querySelector('[data-bw-news-open="pazaak-swoop-guide"]');
  assert.ok(newsBtn, 'Кнопка статьи pazaak-swoop-guide должна существовать');
  newsBtn.click();
  assert.strictEqual(site.activeNewsId, 'pazaak-swoop-guide');
  assert.ok(env.html.includes('Секреты кантин Тариса'), 'Полный текст статьи должен отобразиться');

  const exportBtn = env.container.querySelector('[data-bw-news-export="pazaak-swoop-guide"]');
  assert.ok(exportBtn, 'Кнопка экспорта статьи в Блокнот должна существовать');
  exportBtn.click();
  assert.ok(
    env.vfsFiles['My Computer/C:/My Documents/BioWare_pazaak-swoop-guide.txt'],
    'Файл статьи должен быть сохранён в C:\\My Documents'
  );
});

test('Опрос сообщества сохраняет голос в localStorage (win98_bioware_poll_v1)', () => {
  env.localStorage.removeItem('win98_bioware_poll_v1');
  env.navigate('http://www.bioware98.com/');

  const pollForm = env.container.querySelector('[data-bw-poll-form]');
  assert.ok(pollForm, 'Форма опроса сообщества должна существовать');
  env.els.forEach((el) => {
    if (el.name === 'bw_poll_choice') el.checked = (el.value === 'kotor_sentinel');
  });

  pollForm.trigger('submit');

  const savedRaw = env.localStorage.getItem('win98_bioware_poll_v1');
  assert.ok(savedRaw, 'Результаты опроса должны сохраняться в localStorage');
  const parsed = JSON.parse(savedRaw);
  assert.strictEqual(parsed.votedId, 'kotor_sentinel');
  assert.ok(env.html.includes('ВАШ ВЫБОР'), 'После голосования должен отображаться статус ВАШ ВЫБОР');
});

console.log('\n5. Архив Ферелдена (/ferelden) — Предыстории, Спутники, Таланты, Бестиарий, Кодекс, Атлас');

test('Переключение всех 6 вкладок Архива Ферелдена и выбор элементов работают без ошибок', () => {
  env.navigate('http://www.bioware98.com/ferelden');
  assert.ok(env.html.includes('Шесть судеб Ферелдена: выбор предыстории героя'), 'По умолчанию открыта вкладка предысторий');

  const mageOriginBtn = env.container.querySelector('[data-bw-origin-pick="mage"]');
  assert.ok(mageOriginBtn, 'Кнопка предыстории Мага Круга должна существовать');
  mageOriginBtn.click();
  assert.strictEqual(site.selectedOriginId, 'mage');
  assert.ok(env.html.includes('Круг магов'), 'Досье Мага Круга должно отображаться');

  const compTab = env.container.querySelector('[data-bw-ferelden-tab="companions"]');
  compTab.click();
  assert.strictEqual(site.fereldenTab, 'companions');
  assert.ok(env.html.includes('Постоянные спутники отряда Серого Стража'), 'Вкладка спутников должна отображать отряд Ферелдена');

  const talentsTab = env.container.querySelector('[data-bw-ferelden-tab="talents"]');
  talentsTab.click();
  assert.strictEqual(site.fereldenTab, 'talents');
  const coneBtn = env.container.querySelector('[data-bw-ab-pick="cone_of_cold"]');
  assert.ok(coneBtn, 'Способность Конус холода должна присутствовать в дереве талантов');
  coneBtn.click();
  assert.strictEqual(site.selectedAbilityId, 'cone_of_cold');
  assert.ok(env.html.includes('Конус холода'), 'Инспектор способности должен отображать Конус холода');

  const bestiaryTab = env.container.querySelector('[data-bw-ferelden-tab="bestiary"]');
  bestiaryTab.click();
  assert.strictEqual(site.fereldenTab, 'bestiary');
  assert.ok(env.html.includes('Фильтр бестиария'), 'Бестиарий Мора должен рендериться');

  const codexTab = env.container.querySelector('[data-bw-ferelden-tab="codex"]');
  codexTab.click();
  assert.strictEqual(site.fereldenTab, 'codex');
  assert.ok(env.html.includes('Свиток Кодекса:'), 'Вкладка Кодекса должна рендериться');

  const areasTab = env.container.querySelector('[data-bw-ferelden-tab="areas"]');
  areasTab.click();
  assert.strictEqual(site.fereldenTab, 'areas');
  assert.ok(env.html.includes('Все 25 тактических локаций прологов, Остагара и Лотеринга'), 'Атлас локаций Ферелдена должен рендериться');
});

console.log('\n6. Матрица тактики и Травничество (/tactics)');

test('Конструктор тактических слотов DAO позволяет менять пресеты, добавлять слоты и экспортировать матрицу в Блокнот', () => {
  env.navigate('http://www.bioware98.com/tactics');
  assert.ok(env.html.includes('КОНСТРУКТОР МАТРИЦЫ ТАКТИКИ ОТРЯДА'), 'Страница тактики должна рендериться');

  const tacCompSel = env.container.querySelector('[data-bw-tac-companion]');
  assert.ok(tacCompSel, 'Селект выбора спутника в конструкторе тактики должен существовать');
  tacCompSel.value = 'morrigan';
  tacCompSel.trigger('change');
  assert.strictEqual(site.tacticsCompanionId, 'morrigan');

  const beforeCount = site.tacticsSlots.length;
  const addSlotBtn = env.container.querySelector('[data-bw-tac-add]');
  assert.ok(addSlotBtn, 'Кнопка добавления тактического слота должна существовать');
  addSlotBtn.click();
  assert.strictEqual(site.tacticsSlots.length, beforeCount + 1, 'Слот должен быть добавлен');

  const exportBtn = env.container.querySelector('[data-bw-tac-export]');
  assert.ok(exportBtn, 'Кнопка экспорта матрицы тактики в Блокнот должна существовать');
  exportBtn.click();
  assert.ok(
    env.vfsFiles['My Computer/C:/My Documents/DAO_Tactics_morrigan.txt'],
    'Файл матрицы тактики DAO_Tactics_morrigan.txt должен сохраняться в C:\\My Documents'
  );
});

test('Калькулятор травничества и ловушек DAO рассчитывает стоимость реагентов на партию', () => {
  env.navigate('http://www.bioware98.com/tactics');

  const recipeSel = env.container.querySelector('[data-bw-recipe-pick]');
  assert.ok(recipeSel, 'Селект выбора рецепта должен существовать');
  recipeSel.value = 'r_lyrium_lesser';
  recipeSel.trigger('change');
  assert.strictEqual(site.selectedRecipeId, 'r_lyrium_lesser');

  const qtyInput = env.container.querySelector('[data-bw-recipe-qty]');
  assert.ok(qtyInput, 'Поле количества партии должно существовать');
  qtyInput.value = '10';
  qtyInput.trigger('change');
  assert.strictEqual(site.recipeBatchQty, 10);
  assert.ok(env.html.includes('На партию (10 шт.)'), 'Калькулятор должен пересчитывать партию на 10 штук');
});

console.log('\n7. Голокрон планеты Тарис (/taris)');

test('Все 6 вкладок Голокрона Тариса (Сектора, Экипаж, Дуэльный ринг, Магазины, Арсенал, Квесты) работают корректно', () => {
  env.navigate('http://www.bioware98.com/taris');
  assert.ok(env.html.includes('Тактический скан сектора:'), 'Вкладка секторов Тариса должна рендериться');

  const undercityBtn = env.container.querySelector('[data-bw-sector-pick="undercity"]');
  assert.ok(undercityBtn, 'Кнопка сектора Подгород (undercity) должна существовать');
  undercityBtn.click();
  assert.strictEqual(site.selectedSectorId, 'undercity');
  assert.ok(env.html.includes('undercity'), 'Описание выбранного сектора должно обновиться');

  env.container.querySelector('[data-bw-taris-tab="crew"]').click();
  assert.strictEqual(site.tarisTab, 'crew');
  assert.ok(env.html.includes('Карт Онаси'), 'Досье экипажа должно содержать Карта Онаси');

  env.container.querySelector('[data-bw-taris-tab="duel"]').click();
  assert.strictEqual(site.tarisTab, 'duel');
  assert.ok(env.html.includes('Бендак Старкиллер'), 'Таблица дуэльного ринга должна включать Бендака Старкиллера');

  env.container.querySelector('[data-bw-taris-tab="shops"]').click();
  assert.strictEqual(site.tarisTab, 'shops');
  const bekBtn = env.container.querySelector('[data-bw-shop-pick="bek"]');
  assert.ok(bekBtn, 'Кнопка Интенданта беков должна существовать');
  bekBtn.click();
  assert.strictEqual(site.selectedShopId, 'bek');
  assert.ok(env.html.includes('100%'), 'Интендант беков должен показывать наценку 100%');

  env.container.querySelector('[data-bw-taris-tab="arsenal"]').click();
  assert.strictEqual(site.tarisTab, 'arsenal');
  assert.ok(env.html.includes('Категория снаряжения:'), 'Вкладка арсенала должна рендериться');

  env.container.querySelector('[data-bw-taris-tab="quests"]').click();
  assert.strictEqual(site.tarisTab, 'quests');
  assert.ok(env.html.includes('Хронология этапов задания:'), 'Вкладка квестов Тариса должна рендериться');
});

console.log('\n8. Калькулятор Star Wars d20 и веб-стол Пазаака (/d20)');

test('Калькулятор Star Wars d20 пересчитывает характеристики, запускает симуляцию раунда боя (K.rollAttack) и экспортирует билд в Блокнот', () => {
  env.navigate('http://www.bioware98.com/d20');
  assert.ok(env.html.includes('КАЛЬКУЛЯТОР ПЕРСОНАЖА И БОЕВЫХ БРОСКОВ STAR WARS d20'), 'Страница d20 должна рендериться');

  const strInput = env.container.querySelector('[data-bw-d20-attr="str"]');
  assert.ok(strInput, 'Поле изменения Силы (str) должно существовать');
  strInput.value = '18';
  strInput.trigger('change');
  assert.strictEqual(site.d20State.attrs.str, 18, 'Сила должна обновиться до 18');

  const simBtn = env.container.querySelector('[data-bw-d20-sim]');
  assert.ok(simBtn, 'Кнопка симуляции раунда d20 должна существовать');
  simBtn.click();
  assert.ok(site.d20State.lastCombatSim, 'Результат симуляции раунда боя должен быть вычислен');
  assert.ok(env.html.includes('Журнал раунда d20:'), 'В DOM должен появиться отчёт раунда d20');

  const exportBtn = env.container.querySelector('[data-bw-d20-export]');
  assert.ok(exportBtn, 'Кнопка экспорта билда d20 в Блокнот должна существовать');
  exportBtn.click();
  assert.ok(
    env.vfsFiles['My Computer/C:/My Documents/KOTOR_Build_soldier.txt'],
    'Файл билда KOTOR_Build_soldier.txt должен сохраняться в C:\\My Documents'
  );
});

test('Интерактивный веб-стол Пазаака работает на реальном движке Kotor98.Pazaak', () => {
  env.navigate('http://www.bioware98.com/d20');

  const resetBtn = env.container.querySelector('[data-bw-pazaak-act="reset"]');
  assert.ok(resetBtn, 'Кнопка новой партии Пазаака должна существовать');
  resetBtn.click();
  assert.ok(site.pazaakGame, 'Экземпляр партии Kotor98.Pazaak должен быть создан');
  assert.strictEqual(site.pazaakGame.side.player.cards.length, 1, 'После старта партии на столе игрока должна быть 1 основная карта');

  const endTurnBtn = env.container.querySelector('[data-bw-pazaak-act="endTurn"]');
  assert.ok(endTurnBtn, 'Кнопка завершения хода в Пазааке должна существовать');
  endTurnBtn.click();
  assert.ok(site.pazaakGame.side.player.cards.length >= 1, 'Партия Пазаака должна обрабатывать завершение хода');

  const standBtn = env.container.querySelector('[data-bw-pazaak-act="stand"]');
  assert.ok(standBtn, 'Кнопка ПАС (Stand) должна существовать');
  standBtn.click();
  assert.ok(site.pazaakGame.side.player.stood || site.pazaakGame.phase === 'setEnd' || site.pazaakGame.phase === 'matchEnd', 'Кнопка ПАС должна переводить игрока в состояние Stand или завершать сет');
});

console.log('\n9. О студии (/studio), Поиск (/search) и Гостевая книга (/guestbook)');

test('Страница О студии (/studio) и Поиск (/search) корректно отображают данные BioWare Edmonton', () => {
  env.navigate('http://www.bioware98.com/studio');
  assert.ok(env.html.includes('Dr. Ray Muzyka'), 'Страница студии должна содержать основателей BioWare');
  assert.ok(env.html.includes('Eclipse 98 Engine'), 'Страница студии должна описывать движок Eclipse 98');
  assert.ok(env.html.includes('Odyssey d20 Engine'), 'Страница студии должна описывать движок Odyssey d20');

  env.navigate('http://www.bioware98.com/search?q=Алистер');
  assert.ok(env.html.includes('Алистер'), 'Поиск по запросу Алистер должен находить спутника DAO');
});

test('Гостевая книга (/guestbook) сохраняет записи в localStorage и экранирует XSS-теги', () => {
  env.localStorage.removeItem('win98_bioware_guestbook_v1');
  env.navigate('http://www.bioware98.com/guestbook');

  const guestForm = env.container.querySelector('[data-bw-guestbook-form]');
  const nameInput = env.container.querySelector('input[name="author"]');
  const cityInput = env.container.querySelector('input[name="city"]');
  const textInput = env.container.querySelector('textarea[name="message"]');

  assert.ok(guestForm && nameInput && cityInput && textInput, 'Форма и поля гостевой книги должны существовать');
  nameInput.value = 'Commander <script>alert(1)</script>';
  cityInput.value = 'Taris Upper City';
  textInput.value = 'Pure Pazaak & Grey Wardens <img src=x onerror=alert(1)>';

  guestForm.trigger('submit');

  assert.ok(!env.html.includes('<script>alert(1)</script>'), 'XSS-скрипт не должен попадать в HTML неэкранированным');
  assert.ok(env.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'XSS-теги должны быть экранированы');
});

console.log('\n10. Аудит правил проекта: Web 1.0 CSS, именование Microslop/Win, Zero Comments Policy');

test('Таблица стилей css/apps/bioware-site.css соблюдает строгий стандарт Web 1.0 (без современных CSS-свойств)', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'apps', 'bioware-site.css'), 'utf8');
  const forbidden = [
    'border-radius',
    'box-shadow',
    'backdrop-filter',
    'linear-gradient',
    'radial-gradient',
    'transition',
    'transform',
    'animation',
    '@keyframes'
  ];
  forbidden.forEach((prop) => {
    assert.ok(!css.includes(prop), 'CSS не должен содержать современное свойство: ' + prop);
  });
});

test('Тексты портала BioWare соблюдают правило именований Microslop и Win (без запрещённых имён)', () => {
  const filesToCheck = [
    path.join(ROOT, 'js', 'apps', 'bioware-data.js'),
    path.join(ROOT, 'js', 'apps', 'bioware-site.js'),
    path.join(ROOT, 'tests', 'bioware-site.test.js')
  ];
  const badMs = new RegExp('\\bMicro' + 'soft\\b', 'i');
  const badWin = new RegExp('\\bWin' + 'dows\\s*(95|98|NT|2000|XP|DirectX)\\b', 'i');

  filesToCheck.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(!badMs.test(content), 'Файл ' + path.basename(filePath) + ' не должен содержать запрещённое имя корпорации');
    assert.ok(!badWin.test(content), 'Файл ' + path.basename(filePath) + ' должен использовать Win вместо полного имени ОС');
  });
});

test('Все созданные файлы соблюдают политику Zero Comments (ноль комментариев в коде)', () => {
  const filesToCheck = [
    path.join(ROOT, 'css', 'apps', 'bioware-site.css'),
    path.join(ROOT, 'js', 'apps', 'bioware-data.js'),
    path.join(ROOT, 'js', 'apps', 'bioware-site.js'),
    path.join(ROOT, 'tests', 'bioware-site.test.js')
  ];
  const blockCommentRe = new RegExp('/' + '\\*');
  const lineCommentRe = new RegExp('(^|\\s)/' + '/');

  filesToCheck.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(!blockCommentRe.test(content), 'Файл ' + path.basename(filePath) + ' не должен содержать блочных комментариев');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const stripped = line.replace(/https?:\/\/[^\s'"]+/g, '');
      assert.ok(!lineCommentRe.test(stripped), 'Файл ' + path.basename(filePath) + ' строка ' + (idx + 1) + ' не должна содержать строчных комментариев');
    });
  });
});

console.log('\n--------------------------------------------------');
console.log('Итого тестов: ' + (passed + failed) + ' | Пройдено: ' + passed + ' | Провалено: ' + failed);
console.log('--------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
}
