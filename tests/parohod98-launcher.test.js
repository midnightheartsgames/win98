const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const L = require('../tools/parohod98/launcher/launcher-state.js');
const { scenarios } = require('./parohod98-launcher/scenarios.cjs');

let passed = 0;
const check = (name, fn) => {
  try {
    fn();
  } catch (err) {
    err.message = name + ': ' + err.message;
    throw err;
  }
  passed++;
};

const t = L.texts('ru-RU');
const en = L.texts('en-US');
const entry = (over) => Object.assign({ version: '1.2', minApk: '1.0', download: 400000, title: 'Игра', parts: {}, needs: [] }, over || {});
const base = (over) => Object.assign({ network: 'wifi', current: null, playing: null, app: { versionName: '1.2', versionCode: 1 } }, over || {});
const poster = (e, g, ctx) => L.poster('game', e, g, Object.assign({ t, S: base(), progress: {}, notes: {}, webgl2: true }, ctx || {}));
const job = (over) => Object.assign({ version: '1.2', parts: [], paused: false, wifi: false, error: null, detail: null, done: 700000, total: 1100000, ready: false }, over || {});
const inst = (over) => Object.assign({ version: '1.2', parts: [], missing: 0, bytes: 3400000 }, over || {});

check('every state of the table gets its line and button', () => {
  const rows = [
    ['none', poster(entry(), {}), '0,4 МБ', 'Скачать', 'download'],
    ['offline', poster(entry(), {}, { S: base({ network: 'none' }) }), 'Нужен интернет', 'Скачать', 'download'],
    ['queued', poster(entry(), { job: job() }), 'В очереди', 'Отмена', 'cancel'],
    ['wifi', poster(entry(), { job: job({ wifi: true }) }, { S: base({ network: 'mobile' }) }), 'Ждём Wi-Fi', 'Отмена', 'cancel'],
    ['downloading', poster(entry(), { job: job() }, { S: base({ current: 'game' }) }), '0,7 МБ из 1,1 МБ', 'Пауза', 'pause'],
    ['paused', poster(entry(), { job: job({ paused: true }) }), 'Пауза · 0,7 МБ из 1,1 МБ', 'Продолжить', 'resume'],
    ['installing', poster(entry(), { job: job({ ready: true }) }), 'Устанавливаем...', null, null],
    ['waiting', poster(entry(), { installed: inst({ version: '1.1' }), job: job({ ready: true }) }, { S: base({ playing: 'game' }) }), 'Обновление встанет после выхода из игры', null, null],
    ['ready', poster(entry(), { installed: inst() }), 'Версия 1.2', 'Играть', 'play'],
    ['update', poster(entry({ version: '1.3' }), { installed: inst(), update: { version: '1.3', bytes: 200000 } }), 'Обновление 1.3 · 0,2 МБ', 'Обновить', 'update'],
    ['apk', poster(entry({ version: '1.3', minApk: '1.4' }), { installed: inst() }), 'Нужен Пароход 98 1.4', 'Обновить Пароход 98', 'apk'],
    ['error', poster(entry(), { job: job({ error: 'corrupt', detail: 'js/a.js', paused: true }) }), 'Файл трижды пришёл повреждённым: js/a.js', 'Повторить', 'resume'],
    ['error', poster(entry(), { job: job({ error: 'http', detail: '503 js/a.js', paused: true }) }), 'Сервер не отвечает (503 js/a.js)', 'Повторить', 'resume'],
    ['space', poster(entry(), { job: job({ error: 'space', detail: '120000000', paused: true }) }), 'Нужно ещё 120 МБ', 'Повторить', 'resume'],
    ['damaged', poster(entry(), { installed: inst({ missing: 3 }) }), 'Повреждено файлов: 3', 'Починить', 'repair'],
    ['crashed', poster(entry(), { installed: inst() }, { crash: { game: 'game', crashed: false } }), 'Игра закрылась: не хватило памяти', 'Играть', 'play'],
    ['crashed', poster(entry(), { installed: inst() }, { crash: { game: 'game', crashed: true } }), 'Игра закрылась с ошибкой', 'Играть', 'play'],
    ['unsupported', poster(entry({ needs: ['webgl2', 'memory'] }), {}, { webgl2: false }), 'Нужна графика WebGL 2', null, null]
  ];
  for (const [state, p, line, label, act] of rows) {
    assert.equal(p.state, state, line);
    assert.equal(p.line, line, state);
    assert.equal(p.main ? p.main.label : null, label, state);
    assert.equal(p.main ? p.main.act : null, act, state);
  }
});

check('the download bar, speed and time left come from the progress', () => {
  const p = poster(entry(), { job: job() }, { S: base({ current: 'game' }), progress: { game: { done: 550000, total: 1100000, speed: 275000 } } });
  assert.equal(p.bar, 0.5);
  assert.equal(p.line, '0,6 МБ из 1,1 МБ');
  assert.equal(p.eta, '2 с');
  assert.equal(poster(entry(), {}, { S: base({ network: 'none' }) }).main.disabled, true);
});

check('an update without a known size still says the version, and the old version stays playable', () => {
  const p = poster(entry({ version: '1.3' }), { installed: inst(), update: { version: '1.2.9', bytes: 5 } });
  assert.equal(p.line, 'Обновление 1.3');
  assert.deepEqual(p.extra, [{ label: 'Играть в 1.2', act: 'play' }]);
});

check('a refused start (no space, newer launcher) shows the reason with a retry', () => {
  assert.deepEqual([poster(entry(), {}, { notes: { game: { code: 'space', detail: '2000000' } } })].map(p => [p.state, p.line, p.main.act])[0], ['space', 'Нужно ещё 2,0 МБ', 'download']);
  assert.equal(poster(entry(), { installed: inst() }, { notes: { game: { code: 'offline', detail: '' } } }).main.act, 'update');
  assert.equal(poster(entry(), {}, { notes: { game: { code: 'apk', detail: '1.5' } } }).main.act, 'apk');
  assert.equal(poster(entry(), { installed: inst() }, { notes: { game: { text: 'filesOk' } } }).line, 'Файлы в порядке');
});

check('no catalog entry and nothing installed: no poster', () => {
  assert.equal(L.poster('x', undefined, {}, { t, S: base() }), null);
});

check('sizes: decimal megabytes, gigabytes above 1000 MB, comma in Russian, dot in English', () => {
  assert.equal(L.size(239670, t), '0,2 МБ');
  assert.equal(L.size(40000, t), '40 КБ');
  assert.equal(L.size(40000, en), '40 KB');
  assert.equal(L.size(113400000, t), '113 МБ');
  assert.equal(L.size(41.3e9, t), '41,3 ГБ');
  assert.equal(L.size(1300000, en), '1.3 MB');
});

check('memory and WebView warnings use the thresholds from the phone measurement', () => {
  const e = entry({ needs: ['memory'] });
  assert.deepEqual(L.warnings(e, { device: { memory: { totalMB: 3700 }, webview: 'com.google.android.webview 124.0.6367.0' } }), []);
  assert.deepEqual(L.warnings(e, { device: { memory: { totalMB: 2800 }, webview: 'com.google.android.webview 100.0.1' } }), ['memoryWarn', 'webviewWarn']);
  assert.deepEqual(L.warnings(entry(), { device: { memory: { totalMB: 2800 } } }), []);
});

check('what is new: launcher notes up to the known launcher, game notes up to the catalog version, newest first', () => {
  const v = (version, date) => ({ version, date, title: 'T' + version, summary: '', sections: [], fixed: [] });
  const S = base({ catalog: { apk: { versionName: '1.3' }, games: { forza: { version: '1.1', title: 'Forza' } } }, games: { gone: { installed: { version: '1.0' } } } });
  const list = L.notesList({ launcher: { versions: [v('1.4', '02.11.2026'), v('1.3', '01.11.2026'), v('1.2', '30.10.2026')] }, forza: { versions: [v('1.2', '03.11.2026'), v('1.1', '31.10.2026')] }, other: { versions: [v('1.0', '01.11.2026')] }, gone: { versions: [v('1.0', '29.10.2026')] } }, S, t);
  assert.deepEqual(list.map(n => n.key), ['launcher@1.3', 'forza@1.1', 'launcher@1.2', 'gone@1.0']);
  assert.equal(list[0].who, 'Пароход 98');
  assert.equal(list[1].who, 'Forza');
});

check('Russian and English have the same texts and placeholders', () => {
  const ru = L.TEXT.ru, enT = L.TEXT.en;
  assert.deepEqual(Object.keys(ru).sort(), Object.keys(enT).sort());
  for (const k of Object.keys(ru)) assert.deepEqual((ru[k].match(/\{\w+\}/g) || []).sort(), (enT[k].match(/\{\w+\}/g) || []).sort(), k);
  assert.equal(L.language('ru'), 'ru');
  assert.equal(L.language('uk-UA'), 'en');
  assert.equal(t('askMobile', { what: 'радио', s: '113 МБ' }), 'Вы в мобильной сети. Скачать радио (113 МБ)?');
});

check('launcher texts: no store words, no prices, Microslop naming', () => {
  const all = JSON.stringify(L.TEXT) + fs.readFileSync(path.join(ROOT, 'tools/parohod98/launcher/launcher.js'), 'utf8') + fs.readFileSync(path.join(ROOT, 'tools/parohod98/launcher/index.html'), 'utf8');
  assert.ok(!/\bSteam\b/.test(all), 'Steam');
  assert.ok(!/Valve|Купить|Купите|\bBuy\b|Цена|\bPrice\b|\$\d|\d ?₽|руб\./.test(all), 'store words or prices');
  assert.ok(!/Microsoft|Windows/.test(all), 'real names');
});

check('the touch settings write the keys the game pads read', () => {
  const pads = fs.readFileSync(path.join(ROOT, 'js/touch-controls.js'), 'utf8');
  const launcher = fs.readFileSync(path.join(ROOT, 'tools/parohod98/launcher/launcher.js'), 'utf8');
  assert.match(pads, /PREFS_KEY = 'parohod98\.touch'/);
  assert.match(launcher, /TOUCH_KEY = 'parohod98\.touch'/);
  const defaults = /DEFAULT_PREFS = (\{[^}]+\})/.exec(pads)[1];
  assert.equal(/TOUCH_DEFAULTS = (\{[^}]+\})/.exec(launcher)[1], defaults);
  for (const k of ['vibrate', 'left', 'opacity', 'scale']) assert.match(launcher, new RegExp("'" + k + "'"), k);
});

const memoryStore = init => {
  const m = new Map(Object.entries(init || {}));
  return { get length() { return m.size; }, key: i => [...m.keys()][i], getItem: k => (m.has(k) ? m.get(k) : null), setItem(k, v) { if (this.full) throw new Error('quota'); m.set(k, String(v)); }, removeItem: k => m.delete(k), dump: () => Object.fromEntries(m), full: false };
};

check('a Win 98 backup gives the phone only the keys of its own game', () => {
  const backup = JSON.stringify({ format: 'Win98Backup', version: 1, data: { ls: { fh_riga_profile_v1: '{"v":1}', fh_photo_probe: '1', ss98_save: 'x', 'ss98-save': 'x', gtann_save_1: 'y', win98_wallpaper: 'z' }, idb: { big: {} } } });
  const r = L.parseSaves('forza', backup);
  assert.equal(r.source, 'win98');
  assert.deepEqual(Object.keys(r.keys).sort(), ['fh_photo_probe', 'fh_riga_profile_v1']);
  assert.deepEqual(Object.keys(L.parseSaves('gtann', backup).keys), ['gtann_save_1']);
  assert.deepEqual(Object.keys(L.parseSaves('serioussam', backup).keys), ['ss98-save']);
  assert.equal(L.parseSaves('forza', JSON.stringify({ format: 'Win98Backup', data: { ls: { win98_x: '1' } } })).error, 'fileNone');
});

check('own save files round-trip, files of another game and bad files are refused', () => {
  const now = new Date(2026, 9, 30, 12);
  const text = L.packSaves('forza', { fh_riga_profile_v1: 'abc' }, '1.2', now);
  const j = JSON.parse(text);
  assert.deepEqual([j.format, j.v, j.game, j.version], ['Parohod98-saves', 1, 'forza', '1.2']);
  assert.deepEqual(L.parseSaves('forza', text).keys, { fh_riga_profile_v1: 'abc' });
  assert.deepEqual(L.parseSaves('gtann', text), { error: 'fileOther', game: 'forza' });
  assert.equal(L.parseSaves('forza', 'not json').error, 'fileBad');
  assert.equal(L.parseSaves('forza', '[1,2]').error, 'fileBad');
  assert.deepEqual(L.parseSaves('forza', JSON.stringify({ fh_riga_profile_v1: { v: 1 }, other: 'x' })).keys, { fh_riga_profile_v1: '{"v":1}' });
  assert.equal(L.saveFileName('forza', now), 'Parohod98-forza-30102026.json');
});

check('loading replaces only the saves of this game, a full store keeps the old saves', () => {
  const store = memoryStore({ fh_riga_old: '1', gtann_save_1: 'keep', 'parohod98.touch': 'keep' });
  assert.equal(L.writeSaves('forza', { fh_riga_profile_v1: 'new' }, store), true);
  assert.deepEqual(store.dump(), { gtann_save_1: 'keep', 'parohod98.touch': 'keep', fh_riga_profile_v1: 'new' });
  assert.deepEqual(L.readSaves('forza', store), { fh_riga_profile_v1: 'new' });
  assert.equal(L.savesSize({ ab: 'cde' }), 5);
  const failing = memoryStore({ fh_riga_a: 'old', gtann_save_1: 'keep' });
  const real = failing.setItem.bind(failing);
  let tries = 0;
  failing.setItem = (k, v) => { if (tries++ === 0) throw new Error('quota'); real(k, v); };
  assert.equal(L.writeSaves('forza', { fh_riga_a: 'huge' }, failing), false);
  assert.deepEqual(failing.dump(), { gtann_save_1: 'keep', fh_riga_a: 'old' });
  assert.equal(L.writeSaves('forza', {}, store), true);
  assert.deepEqual(L.readSaves('forza', store), {});
});

check('save keys match the Win 98 backup catalog and the report window', () => {
  const catalog = fs.readFileSync(path.join(ROOT, 'js/apps/backup-catalog.js'), 'utf8');
  const report = fs.readFileSync(path.join(ROOT, 'js/parohod98-report.js'), 'utf8');
  for (const [id, prefixes] of Object.entries(L.SAVES)) {
    for (const p of prefixes) assert.ok(catalog.includes("'" + p + (/[_-]$/.test(p) ? '*' : '') + "'"), id + ' ' + p);
    assert.ok(report.includes(id + ': ' + JSON.stringify(prefixes).replace(/"/g, "'").replace(/,/g, ', ')), id + ' in the report window');
  }
});

check('Back closes the dialog, then the full shot, then returns to the library, then leaves', () => {
  const launcher = fs.readFileSync(path.join(ROOT, 'tools/parohod98/launcher/launcher.js'), 'utf8');
  const back = launcher.slice(launcher.indexOf('window.parohod98Back'));
  const order = ["$('dialog').hidden", "$('full').hidden", "view.name !== 'library'", 'return false'].map(s => back.indexOf(s));
  assert.ok(order.every((n, i) => n > 0 && (i === 0 || n > order[i - 1])), order.join(','));
});

check('the shot scenarios cover every poster state and both languages', () => {
  const list = scenarios();
  const states = new Set();
  for (const s of list) {
    const S = s.sc.state;
    const ctx = { t, S, progress: {}, notes: {}, webgl2: s.sc.webgl2 !== false, crash: s.sc.crash ? JSON.parse(s.sc.crash) : null };
    for (const id of L.order(S)) {
      const p = L.poster(id, S.catalog && S.catalog.games[id], S.games[id], ctx);
      if (p) states.add(p.state);
    }
  }
  for (const st of ['none', 'offline', 'queued', 'wifi', 'downloading', 'paused', 'installing', 'waiting', 'ready', 'update', 'apk', 'error', 'space', 'damaged', 'crashed', 'unsupported']) assert.ok(states.has(st), st);
  assert.ok(list.some(s => s.sc.language === 'en-US'));
  assert.ok(list.some(s => s.sc.textZoom === 1.3));
});

console.log('parohod98-launcher: ' + passed + ' checks passed');
