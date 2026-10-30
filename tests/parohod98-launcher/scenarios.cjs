'use strict';
const games = require('../../tools/parohod98-game.cjs');

const MB = 1e6;
const SIZES = { serioussam: [494000, 240000], forza: [2122000, 782000], gtann: [3400000, 1300000] };

function entry(id, version, extra) {
  const info = games.storeInfo(id);
  const parts = id === 'gtann' ? { radio: { title: 'Радио в машинах', files: 8, bytes: 113400000, download: 113400000 } } : {};
  return Object.assign({
    version, date: '2026-10-29', minApk: '1.0', manifest: id + '/manifest-' + version + '.json', notes: id + '/notes.json', digest: 'd',
    files: 20, bytes: SIZES[id][0], download: SIZES[id][1],
    title: info.title, subtitle: info.subtitle, genre: info.genre, tags: info.tags, desc: info.desc, credit: 'Игра проекта Win 98 · фанатский проект Midnight Hearts',
    icon: id + '-icon', shots: info.shots.map((s, i) => ({ sha256: id + '-' + (i + 1), caption: s.caption })), parts,
    needs: games.GAMES[id].needs || []
  }, extra || {});
}

function catalog(versions, apk) {
  const out = { format: 'win98-update', v: 1, product: 'parohod98', channel: 'test', date: '2026-10-29', commit: 'abc1234', blobs: '../blobs/', games: {} };
  for (const [id, v] of Object.entries(versions)) out.games[id] = entry(id, v);
  if (apk) out.apk = apk;
  return out;
}

const installed = (id, version, extra) => Object.assign({ version, parts: [], missing: 0, bytes: SIZES[id][0] }, extra || {});
const job = (id, extra) => Object.assign({ version: '1.0', parts: [], paused: false, wifi: false, error: null, detail: null, done: 0, total: SIZES[id][1], ready: false }, extra || {});

function state(over) {
  return Object.assign({
    catalog: catalog({ forza: '1.0', gtann: '1.0', serioussam: '1.1' }),
    games: { forza: {}, gtann: {}, serioussam: {} },
    queue: [], free: 41.3e9, channel: 'stable', network: 'wifi', current: null, playing: null, speed: 0, checking: false,
    app: { versionName: '1.2', versionCode: 434000, update: { state: 'idle' } }, notifications: 'granted', mobile: 'ask', last: ''
  }, over);
}

function notes() {
  const v = (version, date, title, summary, items, fixed) => ({ version, build: '', date, title, summary, sections: items ? [{ title: 'Новое', items }] : [], fixed: fixed || [] });
  return {
    launcher: { format: 'win98-notes', v: 1, product: 'parohod98', versions: [
      v('1.2', '30.10.2026', 'Пароход 98 1.2', 'настоящий лаунчер: библиотека, страницы игр, «Что нового» и настройки.', ['Библиотека с плакатами игр, страница каждой игры со снимками и описанием.', 'Настройки загрузок по мобильной сети и пульта в играх.']),
      v('1.1', '29.10.2026', 'Пароход 98 1.1', 'исправлена загрузка маленьких игр.', null, ['Пароход 98 мог закрыться, если игра скачивалась быстрее, чем Android успевал показать уведомление о загрузке.'])
    ] },
    serioussam: { format: 'win98-notes', v: 1, product: 'parohod98/serioussam', versions: [
      v('1.1', '29.10.2026', 'Serious Sam 98 1.1', 'в главном меню видна версия игры.', ['Внизу справа в главном меню написана версия, например «v1.1».']),
      v('1.0', '29.10.2026', 'Serious Sam 98 на телефоне', 'первая версия для Пароход 98, вся игра проходится касаниями.', ['Управление касаниями: стик под левым пальцем, обзор правым пальцем.', 'Помощь прицела «Слабая», «Обычная» или выключена.'])
    ] },
    forza: { format: 'win98-notes', v: 1, product: 'parohod98/forza', versions: [
      v('1.0', '29.10.2026', 'Forza Horizon: Рига на телефоне', 'первая версия для Пароход 98.', ['Игра запускается на телефоне, управление касаниями появится в следующих версиях.'])
    ] }
  };
}

function scenarios() {
  const list = [];
  const add = (name, sc, steps) => list.push({ name, sc, steps: steps || [] });
  add('library-first-run', { state: state() });
  add('library-downloading', { state: state({
    last: 'forza', current: 'gtann',
    games: { forza: { installed: installed('forza', '1.0') }, gtann: { job: job('gtann', { done: 793000 }) }, serioussam: {} }
  }) }, ['parohod98ui.progress("gtann", 793000, 1300000, 4100000)']);
  add('library-apk-update', { state: state({
    catalog: catalog({ forza: '1.0', gtann: '1.0', serioussam: '1.1' }, { url: 'Parohod98-1.3.apk', versionName: '1.3', versionCode: 435000, bytes: 520000, sha256: 'x' }),
    games: { forza: { installed: installed('forza', '1.0') }, gtann: {}, serioussam: {} }
  }) });
  add('library-update-paused-queued', { state: state({
    catalog: catalog({ forza: '1.1', gtann: '1.0', serioussam: '1.1' }), current: null,
    games: { forza: { installed: installed('forza', '1.0'), update: { version: '1.1', bytes: 213000 } }, gtann: { job: job('gtann', { paused: true, done: 520000 }) }, serioussam: { job: job('serioussam') } }
  }) });
  add('library-errors', { state: state({
    games: { forza: { job: job('forza', { error: 'corrupt', detail: 'js/apps/forza/fz-world.js', paused: true, done: 400000 }) }, gtann: { job: job('gtann', { error: 'space', detail: '120000000', paused: true }) }, serioussam: { installed: installed('serioussam', '1.1', { missing: 3 }) } }
  }) });
  add('library-crash-unsupported-apk', { webgl2: false, crash: JSON.stringify({ game: 'forza', crashed: false }), state: state({
    catalog: (() => { const c = catalog({ forza: '1.0', gtann: '1.0', serioussam: '1.2' }); c.games.serioussam.minApk = '1.4'; return c; })(),
    games: { forza: { installed: installed('forza', '1.0') }, gtann: { installed: installed('gtann', '1.0') }, serioussam: { installed: installed('serioussam', '1.1') } }
  }) });
  add('library-wifi-installing-waiting', { state: state({
    network: 'mobile', playing: 'serioussam',
    games: { forza: { job: job('forza', { wifi: true }) }, gtann: { job: job('gtann', { ready: true, done: 1300000 }) }, serioussam: { installed: installed('serioussam', '1.0'), job: job('serioussam', { version: '1.1', ready: true }) } }
  }) });
  add('library-offline-saved', { state: state({ network: 'none' }) }, ['parohod98ui.offline("offline", "")']);
  add('library-offline-empty', { state: state({ catalog: null, network: 'none', games: {} }) }, ['parohod98ui.offline("offline", "")']);
  add('page-gta-radio-memory', { device: { memory: { totalMB: 2800 }, webview: 'com.google.android.webview 124.0.6367.0' }, notes: notes(), state: state({
    games: { forza: {}, gtann: { installed: installed('gtann', '1.0') }, serioussam: {} }
  }) }, ['document.querySelector(".poster[data-id=gtann] .frame").click()']);
  add('page-forza-update', { notes: notes(), state: state({
    catalog: catalog({ forza: '1.1', gtann: '1.0', serioussam: '1.1' }),
    games: { forza: { installed: installed('forza', '1.0'), update: { version: '1.1', bytes: 213000 } }, gtann: {}, serioussam: {} }
  }) }, ['document.querySelector(".poster[data-id=forza] .frame").click()']);
  add('page-serioussam-new', { notes: notes(), state: state() }, ['document.querySelector(".poster[data-id=serioussam] .frame").click()']);
  add('shot-full', { state: state() }, ['document.querySelector(".poster[data-id=gtann] .frame").click()', 'document.querySelector(".strip img").click()']);
  add('news', { notes: notes(), state: state({
    games: { forza: { installed: installed('forza', '1.0') }, gtann: {}, serioussam: { installed: installed('serioussam', '1.1') } }
  }) }, ['localStorage.setItem("parohod98.read", JSON.stringify(["serioussam@1.0", "launcher@1.1"]))', 'document.querySelector(".tab[data-view=news]").click()']);
  add('settings-apk-available', { state: state({
    channel: 'test', mobile: 'never',
    catalog: catalog({ forza: '1.0', gtann: '1.0', serioussam: '1.1' }, { url: 'Parohod98-1.3.apk', versionName: '1.3', versionCode: 435000, bytes: 2400000, sha256: 'x' }),
    games: { forza: { installed: installed('forza', '1.0') }, gtann: { installed: installed('gtann', '1.0', { parts: ['radio'], bytes: 116800000 }) }, serioussam: {} }
  }) }, ['document.querySelector(".tab[data-view=settings]").click()']);
  add('settings-apk-downloading', { state: state({
    catalog: catalog({ forza: '1.0', gtann: '1.0', serioussam: '1.1' }, { url: 'Parohod98-1.3.apk', versionName: '1.3', versionCode: 435000, bytes: 2400000, sha256: 'x' }),
    app: { versionName: '1.2', versionCode: 434000, update: { state: 'downloading', done: 900000, total: 2400000 } }
  }) }, ['document.querySelector(".tab[data-view=settings]").click()']);
  add('dialog-mobile', { askOnMobile: 113400000, state: state({ network: 'mobile', games: { forza: {}, gtann: { installed: installed('gtann', '1.0') }, serioussam: {} } }) },
    ['document.querySelector(".poster[data-id=gtann] .frame").click()', '[...document.querySelectorAll(".side button")].find(b => /Радио|Radio/.test(b.textContent)).click()']);
  add('dialog-remove', { state: state({ games: { forza: { installed: installed('forza', '1.0') }, gtann: {}, serioussam: {} } }) },
    ['document.querySelector(".poster[data-id=forza] .frame").click()', '[...document.querySelectorAll(".side button")].pop().click()']);
  add('dialog-notifications', { notifications: 'ask', state: state() }, ['document.querySelector(".poster[data-id=serioussam] button.main").click()']);
  add('report-window', { state: state({ games: { forza: { installed: installed('forza', '1.0') }, gtann: {}, serioussam: {} } }) },
    ['document.querySelector(".tab[data-view=settings]").click()', '[...document.querySelectorAll(".group button")].find(b => /ошибк/i.test(b.textContent)).click()', 'new Promise(r => setTimeout(r, 1500))']);
  add('saves', { state: state({ games: { forza: { installed: installed('forza', '1.0') }, gtann: {}, serioussam: {} } }) },
    ['localStorage.setItem("fh_riga_profile_v1", "x".repeat(40000))', 'document.querySelector(".poster[data-id=forza] .frame").click()', '[...document.querySelectorAll(".side button")].find(b => /Сохранения|Saves/.test(b.textContent)).click()']);
  add('saves-replace', { fileText: JSON.stringify({ format: 'Win98Backup', data: { ls: { fh_riga_profile_v1: 'y', ss98_x: 'n' } } }), state: state({ games: { forza: { installed: installed('forza', '1.0') }, gtann: {}, serioussam: {} } }) },
    ['localStorage.setItem("fh_riga_profile_v1", "x")', 'document.querySelector(".poster[data-id=forza] .frame").click()', '[...document.querySelectorAll(".side button")].find(b => /Сохранения|Saves/.test(b.textContent)).click()', '[...document.querySelectorAll(".saves button")].find(b => /Загрузить|Load/.test(b.textContent)).click()']);
  add('english-library', { language: 'en-US', state: state({
    last: 'forza', current: 'gtann',
    games: { forza: { installed: installed('forza', '1.0') }, gtann: { job: job('gtann', { done: 793000 }) }, serioussam: {} }
  }) }, ['parohod98ui.progress("gtann", 793000, 1300000, 4100000)']);
  add('english-settings', { language: 'en-US', state: state() }, ['document.querySelector(".tab[data-view=settings]").click()']);
  add('zoom-library', { textZoom: 1.3, state: state({
    last: 'forza', current: 'gtann',
    games: { forza: { installed: installed('forza', '1.0') }, gtann: { job: job('gtann', { done: 793000 }) }, serioussam: {} }
  }) }, ['parohod98ui.progress("gtann", 793000, 1300000, 4100000)']);
  add('zoom-page', { textZoom: 1.3, notes: notes(), state: state({
    catalog: catalog({ forza: '1.1', gtann: '1.0', serioussam: '1.1' }),
    games: { forza: { installed: installed('forza', '1.0'), update: { version: '1.1', bytes: 213000 } }, gtann: {}, serioussam: {} }
  }) }, ['document.querySelector(".poster[data-id=forza] .frame").click()']);
  add('zoom-settings', { textZoom: 1.3, state: state() }, ['document.querySelector(".tab[data-view=settings]").click()']);
  add('zoom-news', { textZoom: 1.3, notes: notes(), state: state({ games: { forza: { installed: installed('forza', '1.0') }, gtann: {}, serioussam: { installed: installed('serioussam', '1.1') } } }) },
    ['document.querySelector(".tab[data-view=news]").click()']);
  return list;
}

module.exports = { scenarios, MB };
