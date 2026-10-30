(function (root) {
  'use strict';

  const TEXT = {
    ru: {
      library: 'Библио­тека', news: 'Что нового', settings: 'Настрой­ки',
      download: 'Скачать', pause: 'Пауза', resume: 'Продолжить', cancel: 'Отмена', retry: 'Повторить', play: 'Играть',
      update: 'Обновить', repair: 'Починить', updateApp: 'Обновить Пароход 98', playOld: 'Играть в {v}',
      needNet: 'Нужен интернет', queued: 'В очереди', waitWifi: 'Ждём Wi-Fi', installing: 'Устанавливаем...',
      afterGame: 'Обновление встанет после выхода из игры', version: 'Версия {v}', updateTo: 'Обновление {v}',
      needApp: 'Нужен Пароход 98 {v}', damaged: 'Повреждено файлов: {n}', crashedMemory: 'Игра закрылась: не хватило памяти',
      crashed: 'Игра закрылась с ошибкой', webgl2: 'Нужна графика WebGL 2', paused: 'Пауза', of: '{a} из {b}',
      filesOk: 'Файлы в порядке', checkingFiles: 'Проверяем файлы...',
      errCorrupt: 'Файл трижды пришёл повреждённым: {d}', errOffline: 'Нет связи. Загрузка продолжится сама, когда связь вернётся',
      errHttp: 'Сервер не отвечает ({d})', errSpace: 'Нужно ещё {d}', errSignature: 'Подпись файлов не сошлась, загрузка остановлена',
      errMissing: 'Игра не скачана', errWrite: 'Не удалось записать файл: {d}', errOther: 'Ошибка: {d}',
      kb: 'КБ', mb: 'МБ', gb: 'ГБ', perSecond: '/с', seconds: '{n} с', minutes: '{n} мин',
      footerDownload: 'Загрузка: {t} · {a} из {b}', firstRun: 'Игры скачиваются внутри Пароход 98 и работают без интернета.',
      loadingList: 'Загружаем список игр...', noList: 'Список игр не загружен. Нужен интернет.', emptyChannel: 'В этом канале пока нет игр.',
      offlineServer: 'Нет связи с сервером. Показан сохранённый список.', checkFailed: 'Список игр не проверен: {d}',
      back: 'Библиотека', shotOf: 'Кадр {i} из {n}', radio: 'Радио · {s}', radioRemove: 'Удалить радио', remove: 'Удалить',
      verify: 'Проверить файлы', notesOf: 'Что нового', meta: 'Версия {v} · {s}', metaRadio: 'радио {s}', size: '{s}',
      memoryWarn: 'Игре может не хватить памяти телефона.', webviewWarn: 'Обновите Android System WebView в Google Play.',
      askMobile: 'Вы в мобильной сети. Скачать {what} ({s})?', askMobileRadio: 'радио {t}', waitForWifi: 'Подождать Wi-Fi',
      askNotify: 'Чтобы загрузка шла, когда Пароход 98 свёрнут, Android покажет уведомление. Сейчас Android спросит разрешение.',
      understood: 'Понятно', removeAsk: 'Удалить файлы {t} ({s})? Сохранения останутся, игру можно скачать снова.',
      removeRadioAsk: 'Удалить радио {t} ({s})? Его можно скачать снова.',
      noNotes: 'Записей пока нет. Они появятся после проверки списка игр.', launcher: 'Пароход 98', fixed: 'Исправлено',
      downloads: 'Загрузки', mobileData: 'По мобильной сети', mobileAsk: 'Спрашивать', mobileAskHint: 'больше 25 МБ',
      mobileAlways: 'Качать', mobileNever: 'Не качать', controls: 'Управление в играх', vibrate: 'Отдача (вибрация)',
      lefty: 'Левша: пульт зеркально', opacity: 'Прозрачность кнопок', buttonSize: 'Размер кнопок', on: 'Вкл', off: 'Выкл',
      space: 'Место', freeSpace: 'Свободно на телефоне', noGames: 'Скачанных игр нет', app: 'Пароход 98',
      checkUpdate: 'Проверить обновление', upToDate: 'Установлена последняя версия', checkingNow: 'Проверяем...',
      apkAvailable: 'Вышел Пароход 98 {v} · {s}', apkInstall: 'Скачать и установить', apkDownloading: 'Загрузка Пароход 98 {v} · {a} из {b}',
      apkReady: 'Пароход 98 {v} скачан', apkInstallNow: 'Установить', apkPermission: 'Разрешите Пароход 98 устанавливать обновления',
      apkSettings: 'Открыть настройки', apkInstalling: 'Android ставит обновление...', apkError: 'Обновление не скачалось: {d}',
      about: 'О программе', aboutLine: 'Фанатский проект Midnight Hearts', channel: 'Канал: test', outside: 'Эта страница работает внутри приложения Пароход 98.',
      gamesControls: 'Руль, помощь прицела и чувствительность настраиваются в меню каждой игры.',
      report: 'Сообщить об ошибке',
      saves: 'Сохранения', savesOf: 'Сохранения: {t}', savesSize: 'Занято: {s}, записей: {n}', savesNone: 'Сохранений этой игры пока нет.',
      savesNote: 'Сохранения лежат в Пароход 98. Обновление им не мешает, а удаление приложения стирает их. Чтобы не потерять прогресс, сохраните его в файл.',
      saveToFile: 'Сохранить в файл', loadFromFile: 'Загрузить из файла', deleteSaves: 'Удалить сохранения',
      savesPc: 'С ПК: Win 98 → «Архивация данных» → сохранить файл с этой игрой, перенести на телефон и загрузить здесь. На ПК: файл с телефона → Win 98 → «Архивация данных» → «Открыть файл...».',
      savesWritten: 'Файл сохранён.', savesWriteFailed: 'Файл не сохранился.', savesLoaded: 'Сохранения загружены, записей: {n}.', savesDeleted: 'Сохранения удалены.',
      savesLoadAsk: 'Заменить сохранения {t}? Записей в файле: {n}. Сейчас записей: {m}, они будут удалены.', savesReplace: 'Заменить',
      savesDeleteAsk: 'Удалить все сохранения {t}? Это нельзя отменить.', removeAll: 'Удалить и сохранения',
      fileBad: 'Этот файл не похож на сохранения.', fileNone: 'В файле нет сохранений этой игры.', fileOther: 'Это сохранения другой игры: {t}.',
      fileBig: 'Файл больше 32 МБ. В «Архивации данных» выберите только эту игру.', fileError: 'Файл не открылся.', fileFull: 'На сохранения не хватило места в памяти приложения, старые оставлены.',
      spaceFiles: 'файлы {a}', spaceSaves: 'сохранения {b}',
      apkUpdate: 'Обновить'
    },
    en: {
      library: 'Library', news: 'What’s new', settings: 'Settings',
      download: 'Download', pause: 'Pause', resume: 'Resume', cancel: 'Cancel', retry: 'Retry', play: 'Play',
      update: 'Update', repair: 'Repair', updateApp: 'Update Steamer 98', playOld: 'Play {v}',
      needNet: 'Internet needed', queued: 'Queued', waitWifi: 'Waiting for Wi-Fi', installing: 'Installing...',
      afterGame: 'The update installs after you quit the game', version: 'Version {v}', updateTo: 'Update {v}',
      needApp: 'Needs Steamer 98 {v}', damaged: 'Damaged files: {n}', crashedMemory: 'The game closed: out of memory',
      crashed: 'The game closed with an error', webgl2: 'Needs WebGL 2 graphics', paused: 'Paused', of: '{a} of {b}',
      filesOk: 'Files are fine', checkingFiles: 'Checking files...',
      errCorrupt: 'A file arrived damaged three times: {d}', errOffline: 'No connection. The download goes on by itself when it is back',
      errHttp: 'The server does not answer ({d})', errSpace: '{d} more needed', errSignature: 'File signature mismatch, download stopped',
      errMissing: 'The game is not downloaded', errWrite: 'Could not write a file: {d}', errOther: 'Error: {d}',
      kb: 'KB', mb: 'MB', gb: 'GB', perSecond: '/s', seconds: '{n} s', minutes: '{n} min',
      footerDownload: 'Downloading: {t} · {a} of {b}', firstRun: 'Games download inside Steamer 98 and then work offline.',
      loadingList: 'Loading the game list...', noList: 'The game list is not loaded. Internet needed.', emptyChannel: 'No games in this channel yet.',
      offlineServer: 'No connection to the server. Showing the saved list.', checkFailed: 'The game list was not checked: {d}',
      back: 'Library', shotOf: 'Shot {i} of {n}', radio: 'Radio · {s}', radioRemove: 'Remove radio', remove: 'Remove',
      verify: 'Check files', notesOf: 'What’s new', meta: 'Version {v} · {s}', metaRadio: 'radio {s}', size: '{s}',
      memoryWarn: 'The game may run out of phone memory.', webviewWarn: 'Update Android System WebView in Google Play.',
      askMobile: 'You are on mobile data. Download {what} ({s})?', askMobileRadio: 'the radio of {t}', waitForWifi: 'Wait for Wi-Fi',
      askNotify: 'To keep downloading while Steamer 98 is in the background, Android shows a notification. Android will ask for permission now.',
      understood: 'OK', removeAsk: 'Remove the files of {t} ({s})? Saves stay, you can download the game again.',
      removeRadioAsk: 'Remove the radio of {t} ({s})? You can download it again.',
      noNotes: 'No entries yet. They appear after the game list is checked.', launcher: 'Steamer 98', fixed: 'Fixed',
      downloads: 'Downloads', mobileData: 'On mobile data', mobileAsk: 'Ask', mobileAskHint: 'over 25 MB',
      mobileAlways: 'Download', mobileNever: 'Don’t download', controls: 'Game controls', vibrate: 'Haptics (vibration)',
      lefty: 'Left-handed: mirrored pad', opacity: 'Button opacity', buttonSize: 'Button size', on: 'On', off: 'Off',
      space: 'Storage', freeSpace: 'Free on the phone', noGames: 'No downloaded games', app: 'Steamer 98',
      checkUpdate: 'Check for update', upToDate: 'This is the latest version', checkingNow: 'Checking...',
      apkAvailable: 'Steamer 98 {v} is out · {s}', apkInstall: 'Download and install', apkDownloading: 'Downloading Steamer 98 {v} · {a} of {b}',
      apkReady: 'Steamer 98 {v} is downloaded', apkInstallNow: 'Install', apkPermission: 'Allow Steamer 98 to install updates',
      apkSettings: 'Open settings', apkInstalling: 'Android is installing the update...', apkError: 'The update did not download: {d}',
      about: 'About', aboutLine: 'Fan project by Midnight Hearts', channel: 'Channel: test', outside: 'This page works inside the Steamer 98 app.',
      gamesControls: 'Steering, aim assist and sensitivity are set in each game’s menu.',
      report: 'Report a bug',
      saves: 'Saves', savesOf: 'Saves: {t}', savesSize: 'Size: {s}, records: {n}', savesNone: 'No saves for this game yet.',
      savesNote: 'Saves live inside Steamer 98. Updates leave them alone, but removing the app erases them. Save them to a file to keep your progress safe.',
      saveToFile: 'Save to file', loadFromFile: 'Load from file', deleteSaves: 'Delete saves',
      savesPc: 'From a PC: Win 98 → Backup → save a file with this game, copy it to the phone and load it here. To a PC: copy the phone file, then Win 98 → Backup → Open File...',
      savesWritten: 'File saved.', savesWriteFailed: 'The file was not saved.', savesLoaded: 'Saves loaded, records: {n}.', savesDeleted: 'Saves deleted.',
      savesLoadAsk: 'Replace the saves of {t}? Records in the file: {n}. Records now: {m}, they will be deleted.', savesReplace: 'Replace',
      savesDeleteAsk: 'Delete all saves of {t}? This cannot be undone.', removeAll: 'Remove with saves',
      fileBad: 'This file does not look like saves.', fileNone: 'The file has no saves of this game.', fileOther: 'These are saves of another game: {t}.',
      fileBig: 'The file is over 32 MB. Pick only this game in Backup.', fileError: 'The file did not open.', fileFull: 'App storage is full, the old saves are kept.',
      spaceFiles: 'files {a}', spaceSaves: 'saves {b}',
      apkUpdate: 'Update'
    }
  };

  const SAVES = { serioussam: ['ss98-'], forza: ['fh_riga_', 'fh_photo_probe'], gtann: ['gtann_'] };
  const MEMORY_WARN_MB = 3000;
  const WEBVIEW_WARN = 110;

  function language(lang) {
    return /^ru\b/i.test(String(lang || '')) ? 'ru' : 'en';
  }

  function texts(lang) {
    const table = TEXT[language(lang)];
    return (key, vars) => String(table[key] === undefined ? key : table[key]).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
  }

  function compare(a, b) {
    const pa = String(a || '').split('.').map(Number), pb = String(b || '').split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d) return d;
    }
    return 0;
  }

  function size(bytes, t) {
    const v = Number(bytes) / 1e6;
    const comma = x => x.replace('.', t('mb') === 'МБ' ? ',' : '.');
    if (v > 0 && v < 0.1) return Math.max(1, Math.round(v * 1000)) + ' ' + t('kb');
    if (v >= 1000) return comma((v / 1000).toFixed(1)) + ' ' + t('gb');
    return comma(v < 10 ? v.toFixed(1) : String(Math.round(v))) + ' ' + t('mb');
  }

  function errorText(code, detail, t) {
    const d = code === 'space' ? size(detail, t) : detail || '';
    const key = { corrupt: 'errCorrupt', offline: 'errOffline', http: 'errHttp', space: 'errSpace', signature: 'errSignature', missing: 'errMissing', write: 'errWrite', apk: 'needApp' }[code];
    if (code === 'apk') return t('needApp', { v: detail });
    return key ? t(key, { d }) : t('errOther', { d: code + (detail ? ' ' + detail : '') });
  }

  function appVersion(S) {
    return S && S.app ? String(S.app.versionName || '0').split(' ')[0] : '0';
  }

  function eta(left, speed, t) {
    if (!(speed > 0)) return '';
    const s = Math.max(1, Math.round(left / speed));
    return s < 60 ? t('seconds', { n: s }) : t('minutes', { n: Math.round(s / 60) });
  }

  function poster(id, entry, game, ctx) {
    const t = ctx.t;
    const S = ctx.S || {};
    const g = game || {};
    const inst = g.installed;
    const job = g.job;
    const parts = ((inst && inst.parts) || []).join(',');
    const out = { id, state: 'none', line: '', main: null, bar: null, extra: [] };
    const main = (label, act, disabled) => { out.main = { label: t(label), act, disabled: !!disabled }; };
    const needs = (entry && entry.needs) || [];
    if (needs.includes('webgl2') && ctx.webgl2 === false) {
      out.state = 'unsupported';
      out.line = t('webgl2');
      return out;
    }
    if (job) {
      const p = (ctx.progress && ctx.progress[id]) || { done: job.done, total: job.total, speed: 0 };
      const amount = t('of', { a: size(p.done, t), b: size(p.total, t) });
      if (job.error) {
        out.state = job.error === 'space' ? 'space' : 'error';
        out.line = errorText(job.error, job.detail, t);
        main('retry', 'resume');
        out.extra.push({ label: t('cancel'), act: 'cancel' });
      } else if (job.ready) {
        out.state = S.playing === id ? 'waiting' : 'installing';
        out.line = t(S.playing === id ? 'afterGame' : 'installing');
      } else if (job.paused) {
        out.state = 'paused';
        out.line = t('paused') + ' · ' + amount;
        out.bar = p.total ? p.done / p.total : 0;
        main('resume', 'resume');
        out.extra.push({ label: t('cancel'), act: 'cancel' });
      } else if (S.current === id) {
        out.state = 'downloading';
        out.bar = p.total ? Math.min(1, p.done / p.total) : 0;
        out.line = amount;
        out.speed = p.speed || 0;
        out.eta = eta(p.total - p.done, p.speed, t);
        main('pause', 'pause');
        out.extra.push({ label: t('cancel'), act: 'cancel' });
      } else {
        const wifi = job.wifi && S.network !== 'wifi';
        out.state = wifi ? 'wifi' : 'queued';
        out.line = t(wifi ? 'waitWifi' : 'queued');
        main('cancel', 'cancel');
      }
      return out;
    }
    const note = ctx.notes && ctx.notes[id];
    if (note && note.code) {
      out.state = note.code === 'space' ? 'space' : note.code === 'apk' ? 'apk' : 'error';
      out.line = errorText(note.code, note.detail, t);
      if (out.state === 'apk') main('updateApp', 'apk');
      else main('retry', inst ? 'update' : 'download');
      return out;
    }
    if (inst) {
      if (inst.missing > 0) {
        out.state = 'damaged';
        out.line = t('damaged', { n: inst.missing });
        main('repair', 'repair');
        out.parts = parts;
        return out;
      }
      const newer = entry && compare(entry.version, inst.version) > 0;
      if (newer && compare(appVersion(S), entry.minApk) < 0) {
        out.state = 'apk';
        out.line = t('needApp', { v: entry.minApk });
        main('updateApp', 'apk');
        out.extra.push({ label: t('playOld', { v: inst.version }), act: 'play' });
        return out;
      }
      if (newer) {
        out.state = 'update';
        const known = g.update && g.update.version === entry.version ? g.update.bytes : null;
        out.line = t('updateTo', { v: entry.version }) + (known !== null ? ' · ' + size(known, t) : '');
        main('update', 'update');
        out.extra.push({ label: t('playOld', { v: inst.version }), act: 'play' });
        return out;
      }
      const crash = ctx.crash && ctx.crash.game === id ? ctx.crash : null;
      if (crash) {
        out.state = 'crashed';
        out.line = t(crash.crashed ? 'crashed' : 'crashedMemory');
      } else {
        out.state = 'ready';
        out.line = note && note.text ? t(note.text) : t('version', { v: inst.version });
      }
      main('play', 'play');
      return out;
    }
    if (!entry) return null;
    if (compare(appVersion(S), entry.minApk) < 0) {
      out.state = 'apk';
      out.line = t('needApp', { v: entry.minApk });
      main('updateApp', 'apk');
      return out;
    }
    if (S.network === 'none') {
      out.state = 'offline';
      out.line = t('needNet');
      main('download', 'download', true);
      return out;
    }
    out.line = size(entry.download, t);
    main('download', 'download');
    return out;
  }

  function warnings(entry, ctx) {
    const list = [];
    const needs = (entry && entry.needs) || [];
    const mem = ctx.device && ctx.device.memory && ctx.device.memory.totalMB;
    if (needs.includes('memory') && mem && mem < MEMORY_WARN_MB) list.push('memoryWarn');
    const m = /(\d+)\./.exec((ctx.device && ctx.device.webview) || '');
    if (m && Number(m[1]) < WEBVIEW_WARN) list.push('webviewWarn');
    return list;
  }

  function order(S) {
    const games = (S && S.catalog && S.catalog.games) || {};
    const ids = Object.keys(games);
    for (const id of Object.keys((S && S.games) || {})) if (!ids.includes(id) && S.games[id].installed) ids.push(id);
    return ids;
  }

  const isSaveKey = (id, key) => (SAVES[id] || []).some(p => key.startsWith(p));

  function readSaves(id, store) {
    const keys = {};
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && isSaveKey(id, k)) keys[k] = store.getItem(k);
    }
    return keys;
  }

  function savesSize(keys) {
    return Object.entries(keys).reduce((sum, [k, v]) => sum + k.length + String(v).length, 0);
  }

  function saveFileName(id, now) {
    const pad = n => String(n).padStart(2, '0');
    return 'Parohod98-' + id + '-' + pad(now.getDate()) + pad(now.getMonth() + 1) + now.getFullYear() + '.json';
  }

  function packSaves(id, keys, version, now) {
    return JSON.stringify({ format: 'Parohod98-saves', v: 1, game: id, version: version || '', date: now.toISOString(), keys });
  }

  function parseSaves(id, text) {
    let raw;
    try {
      raw = JSON.parse(text);
    } catch (e) {
      return { error: 'fileBad' };
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'fileBad' };
    let from = raw, source = 'plain';
    if (raw.format === 'Parohod98-saves') {
      if (raw.game !== id) return { error: 'fileOther', game: raw.game };
      from = raw.keys;
      source = 'parohod98';
    } else if (raw.format === 'Win98Backup') {
      from = raw.data && raw.data.ls;
      source = 'win98';
    }
    if (!from || typeof from !== 'object') return { error: 'fileBad' };
    const keys = {};
    for (const [k, v] of Object.entries(from)) if (isSaveKey(id, k)) keys[k] = typeof v === 'string' ? v : JSON.stringify(v);
    if (!Object.keys(keys).length) return { error: 'fileNone' };
    return { keys, source };
  }

  function writeSaves(id, keys, store) {
    const old = readSaves(id, store);
    const clear = () => { for (const k of Object.keys(readSaves(id, store))) store.removeItem(k); };
    try {
      clear();
      for (const [k, v] of Object.entries(keys)) store.setItem(k, v);
      return true;
    } catch (e) {
      clear();
      for (const [k, v] of Object.entries(old)) store.setItem(k, v);
      return false;
    }
  }

  function dateKey(d) {
    const m = /^(\d\d)\.(\d\d)\.(\d{4})$/.exec(d || '');
    return m ? m[3] + m[2] + m[1] : '';
  }

  function notesList(notes, S, t) {
    const out = [];
    const catalog = (S && S.catalog) || {};
    const games = catalog.games || {};
    const app = appVersion(S);
    const apk = catalog.apk ? catalog.apk.versionName : app;
    const top = compare(apk, app) > 0 ? apk : app;
    for (const [key, n] of Object.entries(notes || {})) {
      const isApp = key === 'launcher';
      const entry = games[key];
      const installed = S && S.games && S.games[key] && S.games[key].installed;
      if (!isApp && !entry && !installed) continue;
      const limit = isApp ? top : entry ? entry.version : installed.version;
      for (const v of (n && n.versions) || []) {
        if (compare(v.version, limit) > 0) continue;
        out.push({ key: key + '@' + v.version, game: key, who: isApp ? t('launcher') : entry ? entry.title : key, version: v.version, date: v.date || '', title: v.title || '', summary: v.summary || '', sections: v.sections || [], fixed: v.fixed || [] });
      }
    }
    out.sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)) || compare(b.version, a.version) || a.who.localeCompare(b.who));
    return out;
  }

  const api = { SAVES, readSaves, savesSize, saveFileName, packSaves, parseSaves, writeSaves, TEXT, MEMORY_WARN_MB, WEBVIEW_WARN, language, texts, compare, size, errorText, poster, warnings, order, notesList, appVersion };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LauncherState = api;
})(typeof window !== 'undefined' ? window : globalThis);
