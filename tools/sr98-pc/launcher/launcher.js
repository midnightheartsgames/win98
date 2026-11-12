(() => {
  const api = window.win98Launcher;
  const $ = id => document.getElementById(id);
  const LANG_KEY = 'sr98.launcher.lang';
  const lang = (() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'ru' || saved === 'en') return saved;
    } catch (err) {}
    return /^ru\b|^ru-/i.test(navigator.language || '') ? 'ru' : 'en';
  })();
  const L = (ru, en) => (lang === 'en' ? en : ru);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mb = n => (n < 1048576 ? Math.max(1, Math.round(n / 1024)) + L(' КБ', ' KB') : L((n / 1048576).toFixed(1).replace('.', ','), (n / 1048576).toFixed(1)) + L(' МБ', ' MB'));
  const pick = o => (lang === 'en' && o && o.en ? Object.assign({}, o, o.en) : o);
  const num = v => String(v || '').split('.').map(n => (/^\d+$/.test(n) ? Number(n) : -1));
  const cmp = (a, b) => {
    const pa = num(a), pb = num(b);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] === undefined ? 0 : pa[i]) - (pb[i] === undefined ? 0 : pb[i]);
      if (d) return d;
    }
    return 0;
  };
  const plural = (n, one, few, many) => {
    if (lang === 'en') return n === 1 ? 'file' : 'files';
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };

  let info = null;
  let result = null;
  let texts = null;
  let view = { name: 'home' };
  let state = 'check';
  let busy = false;
  let progress = 0;
  let lastProgress = null;
  let taps = 0;
  let tapAt = 0;

  const local = () => (info && info.local ? info.local.version : '');
  const remote = () => (result && result.remote ? result.remote.version : texts && texts.pointer ? texts.pointer.version : '');
  const versions = () => ((texts && texts.notes && texts.notes.versions) || []).map(pick).filter(v => !remote() || cmp(v.version, remote()) <= 0).sort((a, b) => cmp(a.version, b.version));
  const pending = () => versions().filter(v => local() && local() !== 'dev' && cmp(v.version, local()) > 0);
  const news = () => ((texts && texts.news && texts.news.items) || []).map(pick);

  function myReports() {
    try {
      return new Set(JSON.parse(localStorage.getItem('sr98.bugs.sent') || '[]').map(r => r && r.id).filter(Boolean));
    } catch (err) {
      return new Set();
    }
  }

  function renderRoute() {
    const all = versions();
    const ahead = pending();
    const here = all.filter(v => cmp(v.version, local()) <= 0);
    let stops;
    if (ahead.length) {
      const mid = ahead.length > 4 ? [ahead[0], ahead[1], { gap: true }, ahead[ahead.length - 1]] : ahead;
      stops = [{ version: local(), here: true }].concat(mid);
    } else {
      stops = here.slice(-4).map(v => ({ version: v.version }));
      if (!stops.length) stops = [{ version: local() || '?' }];
      stops[stops.length - 1].here = true;
    }
    const last = ahead.length ? ahead[ahead.length - 1].version : '';
    const fill = state === 'download' || state === 'apply' ? '<div class="lw-rail-fill" style="width:calc((100% - 36px) * ' + progress + ')"></div><div class="lw-train" style="left:calc(18px + (100% - 36px) * ' + progress + ')"></div>' : '';
    $('route').innerHTML = fill + stops.map(s => {
      if (s.gap) return '<span class="hsrs-stop is-gap"><i></i><span>···</span></span>';
      const target = s.version === last;
      const label = s.here ? L('вы здесь', 'you are here') : target ? L('новая', 'new') : '';
      return '<a class="hsrs-stop' + (s.here ? ' is-here' : '') + (target ? ' is-target' : '') + '" data-version="' + esc(s.version) + '"><i></i><span>' + esc(s.version) + '</span><small>' + label + '</small></a>';
    }).join('');
  }

  function notesHtml(v) {
    const mine = myReports();
    let html = '<h1 class="hsrs-h1">' + L('Версия ', 'Version ') + esc(v.version) + '</h1><p class="hsrs-date-line">' + esc(v.date || '') + (cmp(v.version, local()) > 0 ? L(' · не установлена', ' · not installed') : '') + '</p>';
    html += '<p class="hsrs-article-lead">' + esc(v.title) + '</p><p>' + esc(v.summary) + '</p>';
    for (const s of v.sections || []) html += '<h2 class="hsrs-h2">' + esc(s.title) + '</h2><ul>' + s.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul>';
    if ((v.fixed || []).length) html += '<h2 class="hsrs-h2">' + L('Исправлено по отчётам игроков', 'Fixed from player reports') + '</h2><ul>' + v.fixed.map(f => '<li>' + (f.id ? '<b>' + esc(f.id) + '</b>: ' : '') + esc(f.text) + (f.id && mine.has(f.id) ? ' <span class="lw-mine">' + L('ваш отчёт', 'your report') + '</span>' : '') + '</li>').join('') + '</ul>';
    return html;
  }

  function newsRows(list, withTag) {
    return '<table class="hsrs-newslist" cellspacing="0">' + list.map((n, i) =>
      '<tr><td class="hsrs-date">' + esc(n.dateText || n.date.split('-').reverse().join('.')) + '</td>' + (withTag ? '<td class="hsrs-tag">' + esc(n.tag || '') + '</td>' : '') +
      '<td>' + (i === 0 && !withTag ? '<span class="hsrs-new">NEW!</span> ' : '') + '<b><a data-news="' + esc(n.id) + '">' + esc(n.title) + '</a></b><br><span class="hsrs-lead">' + esc(n.lead) + '</span></td></tr>').join('') + '</table>';
  }

  function renderMain() {
    const box = $('main');
    let html = '';
    if (view.name === 'home') {
      const ahead = pending();
      if (ahead.length) html += notesHtml(ahead[ahead.length - 1]).replace('<h1 class="hsrs-h1">' + L('Версия', 'Version'), '<h1 class="hsrs-h1">' + L('Что нового в', 'What\'s new in'));
      html += '<h2 class="hsrs-h2">' + L('Новости', 'News') + '</h2>' + (news().length ? newsRows(news().slice(0, 10), false) + '<p class="hsrs-more"><a data-view="news">' + L('Все новости', 'All news') + '</a></p>' : '<p class="hsrs-small">' + (texts ? L('Новостей пока нет.', 'No news yet.') : L('Новости появятся после первой проверки обновлений.', 'News will appear after the first update check.')) + '</p>');
      if (!ahead.length) {
        const cur = versions().find(v => v.version === local());
        if (cur) html += '<h2 class="hsrs-h2">' + L('Что было в ', 'What came in ') + esc(cur.version) + '</h2><p><b>' + esc(cur.title) + '</b>. ' + esc(cur.summary) + ' <a data-version="' + esc(cur.version) + '">' + L('Подробнее', 'More') + '</a></p>';
      }
    } else if (view.name === 'news') {
      html = '<p class="hsrs-crumbs"><a data-view="home">' + L('Главная', 'Home') + '</a> &gt; ' + L('Новости', 'News') + '</p><h1 class="hsrs-h1">' + L('Новости', 'News') + '</h1>' + newsRows(news(), true);
    } else if (view.name === 'article') {
      const n = news().find(x => x.id === view.id);
      if (n) {
        html = '<p class="hsrs-crumbs"><a data-view="news">‹ ' + L('Все новости', 'All news') + '</a> &gt; ' + esc(n.tag || L('Новость', 'News')) + '</p><h1 class="hsrs-h1">' + esc(n.title) + '</h1><p class="hsrs-date-line">' + esc(n.dateText || n.date) + '</p><p class="hsrs-article-lead">' + esc(n.lead) + '</p>';
        for (const p of n.body || []) html += p.startsWith('- ') ? '<ul><li>' + esc(p.slice(2)) + '</li></ul>' : '<p>' + esc(p) + '</p>';
      }
    } else if (view.name === 'version') {
      const v = versions().find(x => x.version === view.version);
      html = '<p class="hsrs-crumbs"><a data-view="home">‹ ' + L('Главная', 'Home') + '</a></p>' + (v ? notesHtml(v) : '<p>' + L('Для версии ' + esc(view.version) + ' пока нет описания.', 'No description for version ' + esc(view.version) + ' yet.') + '</p>');
    } else if (view.name === 'settings') {
      const s = info.settings;
      const back = info.backups && info.backups[0];
      html = '<p class="hsrs-crumbs"><a data-view="home">‹ ' + L('Главная', 'Home') + '</a></p><h1 class="hsrs-h1">' + L('Настройки', 'Settings') + '</h1><div class="lw-settings">' +
        '<h2 class="hsrs-h2">' + L('Язык', 'Language') + '</h2>' +
        '<label><input type="radio" name="p-lang" value="ru"' + (lang === 'ru' ? ' checked' : '') + '> Русский</label>' +
        '<label><input type="radio" name="p-lang" value="en"' + (lang === 'en' ? ' checked' : '') + '> English</label>' +
        '<h2 class="hsrs-h2">' + L('При запуске', 'On start') + '</h2>' +
        '<label><input type="checkbox" id="p-check"' + (s.checkOnStart !== false ? ' checked' : '') + '> ' + L('Проверять обновления', 'Check for updates') + '</label>' +
        '<label><input type="checkbox" id="p-skip"' + (s.skipLauncher ? ' checked' : '') + '> ' + L('Сразу открывать игру, если обновлений нет', 'Open the game right away if there are no updates') + '</label>' +
        '<h2 class="hsrs-h2">' + L('Файлы игры', 'Game files') + '</h2><span class="lw-path">' + esc(info.installDir) + '</span>' +
        '<p><a class="hsrs-btn" id="p-open">' + L('Открыть папку', 'Open folder') + '</a> ' + (info.dev ? '' : '<a class="hsrs-btn" id="p-repair">' + L('Проверить файлы', 'Verify files') + '</a> ') + (back ? '<a class="hsrs-btn" id="p-back">' + L('Вернуть версию ', 'Roll back to ') + esc(back) + '</a>' : '') + '</p>' +
        '<p class="hsrs-small">' + L('Сохранения лежат отдельно (' + esc(info.userData) + ') и при обновлении не меняются.', 'Saves are kept separately (' + esc(info.userData) + ') and are not changed by updates.') + '</p>' +
        '<p class="lw-version" id="p-ver">' + L('Установлена версия ', 'Installed version ') + esc(local() || 'dev') + (s.channel === 'test' ? L(' · канал test', ' · test channel') : '') + '</p></div>';
    }
    box.innerHTML = html;
    box.scrollTop = 0;
    if (view.name === 'settings') bindSettings();
  }

  function bindSettings() {
    const save = () => api.settings({ checkOnStart: $('p-check').checked, skipLauncher: $('p-skip').checked }).then(s => { info.settings = s; });
    $('p-check').addEventListener('change', save);
    $('p-skip').addEventListener('change', save);
    $('p-open').addEventListener('click', () => api.openFolder());
    document.querySelectorAll('input[name="p-lang"]').forEach(r => r.addEventListener('change', () => {
      try { localStorage.setItem(LANG_KEY, r.value); } catch (err) {}
      location.reload();
    }));
    if ($('p-repair')) $('p-repair').addEventListener('click', () => { go({ name: 'home' }); check({ repair: true }); });
    if ($('p-back')) $('p-back').addEventListener('click', async () => {
      const back = info.backups[0];
      if (!confirm(L('Вернуть версию ' + back + '? Игра перезапустится.', 'Roll back to version ' + back + '? The game will restart.'))) return;
      setTicket({ state: 'apply', note: L('Возвращаем версию ' + back + '...', 'Rolling back to version ' + back + '...'), lock: true });
      const r = await api.rollback();
      if (!r.ok) showError(r);
    });
    $('p-ver').addEventListener('click', async () => {
      const now = Date.now();
      taps = now - tapAt < 1500 ? taps + 1 : 1;
      tapAt = now;
      if (taps < 5) return;
      taps = 0;
      info.settings = await api.settings({ channel: info.settings.channel === 'test' ? 'stable' : 'test' });
      renderMain();
      check();
    });
  }

  function go(next) {
    view = next;
    renderMain();
  }

  function button(label, fn, small, id) {
    const b = document.createElement(small ? 'a' : 'button');
    if (id) b.id = id;
    b.className = small ? '' : 'hsrs-btn hsrs-btn-big';
    b.textContent = label;
    b.addEventListener('click', fn);
    return b;
  }

  function setTicket(o) {
    state = o.state;
    $('t-no').textContent = '№ 0981-' + (o.no || remote() || local() || 'dev');
    $('t-rows').innerHTML = (o.rows || []).map(([a, b]) => '<tr><td>' + esc(a) + '</td><td><b>' + esc(b) + '</b></td></tr>').join('');
    $('t-bar').hidden = !o.bar;
    $('t-note').textContent = o.note || '';
    $('t-note').className = 'lw-note' + (o.bad ? ' is-bad' : '');
    const box = $('t-actions');
    box.innerHTML = '';
    for (const b of o.actions || []) box.appendChild(b);
    renderRoute();
  }

  const playButton = () => button(L('Играть', 'Play'), startGame, false, 'b-start');
  const youRow = v => [L('У вас', 'Installed'), v];

  function showResult() {
    const r = result;
    const st = r.state;
    const rows = [youRow(local() || 'dev')];
    if (st === 'dev') return setTicket({ state: st, rows, note: L('Сборка для разработки: обновления выключены.', 'Development build: updates are off.'), actions: [playButton()] });
    if (st === 'latest') return setTicket({ state: st, rows, note: afterNote() || L('У вас последняя версия.', 'You have the latest version.'), actions: [playButton()] });
    if (st === 'update' || st === 'repair') {
      if (!info.writable) return setTicket({ state: 'readonly', rows, bad: true, note: L('Игра лежит в папке, куда нельзя записывать: ' + info.installDir + '. Перенесите папку, например в D:\\Games.', 'The game is in a folder that cannot be written to: ' + info.installDir + '. Move the folder, for example to D:\\Games.'), actions: [button(L('Открыть папку', 'Open folder'), () => api.openFolder()), playButton()] });
      const n = r.plan.files;
      const size = n + ' ' + plural(n, 'файл', 'файла', 'файлов') + ', ' + mb(r.plan.bytes);
      if (st === 'repair') return setTicket({ state: st, rows: rows.concat([[L('Повреждено', 'Damaged'), size]]), actions: [button(L('Восстановить', 'Repair'), startDownload), playButton()] });
      return setTicket({ state: st, rows: rows.concat([[L('Доступна', 'Available'), r.remote.version], [L('Загрузка', 'Download'), size]]), note: L('Сохранения не затрагиваются.', 'Saves are not affected.'), actions: [button(L('Обновить', 'Update'), startDownload), button(L('Играть без обновления', 'Play without updating'), startGame, true, 'b-start')] });
    }
    if (st === 'full') return setTicket({ state: st, rows: rows.concat([[L('Доступна', 'Available'), r.remote.version]]), bad: true, note: L('Новая версия меняет саму программу. Скачайте StarRail98-PC.zip с сайта, сохранения останутся.', 'The new version changes the program itself. Download StarRail98-PC.zip from the site; your saves will stay.'), actions: [button(L('Страница загрузки', 'Download page'), () => api.openUrl(info.downloadPage)), button(L('Играть', 'Play'), startGame, true, 'b-start')] });
    if (st === 'offline') return setTicket({ state: st, rows, bad: true, note: L('Станция связи молчит. Играть можно в ' + (local() || 'установленную версию') + '.', 'The relay station is silent. You can play ' + (local() || 'the installed version') + '.'), actions: [playButton(), button(L('Повторить', 'Retry'), () => check(), true)] });
    return showError(r.error);
  }

  function errorText(err) {
    if (!err) return L('Неизвестная ошибка.', 'Unknown error.');
    if (err.code === 'corrupt') return L('Файл ' + String(err.message).replace(/ arrived damaged$/, '') + ' трижды пришёл повреждённым.', 'File ' + String(err.message).replace(/ arrived damaged$/, '') + ' arrived damaged three times.');
    if (err.code === 'signature') return L('Сервер прислал неподписанное обновление. Оно не установлено.', 'The server sent an unsigned update. It was not installed.');
    if (err.code === 'http') return L('Сервер ответил ошибкой (HTTP ' + err.status + ').', 'The server returned an error (HTTP ' + err.status + ').');
    if (err.code === 'offline') return L('Связь оборвалась.', 'The connection dropped.');
    if (err.code === 'write') return L('Не удалось заменить файл: его держит другая программа.', 'Could not replace a file: another program is using it.');
    return err.message || String(err.code);
  }

  function showError(err) {
    setTicket({ state: 'error', rows: [youRow(local() || 'dev')], bad: true, note: errorText(err), actions: [playButton(), button(L('Повторить', 'Retry'), () => check(), true)] });
  }

  function afterNote() {
    const a = info.after, rec = info.recovered;
    if (a && a.rolledBack) return L('Возвращена версия ' + a.version + '.', 'Rolled back to version ' + a.version + '.');
    if (a && a.repaired) return L('Файлы восстановлены.', 'Files repaired.');
    if (a) return L('Star Rail 98 обновлена до ' + a.version + '.', 'Star Rail 98 updated to ' + a.version + '.');
    if (rec && rec.recovered === 'apply') return L('Прошлое обновление прервалось и доделано.', 'The previous update was interrupted and has been finished.');
    if (rec && rec.recovered === 'rollback') return L('Прошлое обновление прервалось, возвращена версия ' + rec.version + '.', 'The previous update was interrupted; rolled back to version ' + rec.version + '.');
    return '';
  }

  async function check(opts) {
    if (busy) return;
    busy = true;
    setTicket({ state: 'check', rows: [youRow(local() || 'dev')], note: opts && opts.repair ? L('Проверяем файлы...', 'Verifying files...') : L('Связываемся со станцией...', 'Contacting the station...'), bar: !!(opts && opts.repair), actions: [playButton()] });
    try {
      const r = await api.check(opts || {});
      result = r.result;
      if (r.texts) texts = r.texts;
      info.writable = r.writable;
    } catch (err) {
      result = { state: 'error', error: { code: 'error', message: err.message } };
    }
    busy = false;
    progress = 0;
    if (opts && opts.repair && result.state === 'latest') setTicket({ state: 'latest', rows: [youRow(local())], note: L('Файлы в порядке.', 'Files are OK.'), actions: [playButton()] });
    else showResult();
    renderMain();
  }

  api.onProgress(p => {
    lastProgress = p;
    progress = p.total ? Math.min(1, p.done / p.total) : 0;
    $('t-fill').style.width = progress * 100 + '%';
    if (p.phase === 'download') $('t-note').textContent = mb(p.done) + L(' из ', ' of ') + mb(p.total);
    if (p.phase === 'scan') $('t-note').textContent = L('Проверено ', 'Checked ') + mb(p.done) + L(' из ', ' of ') + mb(p.total);
    if (p.phase === 'apply') $('t-note').textContent = L('Устанавливаем файлы: ', 'Installing files: ') + p.done + L(' из ', ' of ') + p.total;
    if (p.phase !== 'scan') renderRoute();
  });

  async function startDownload() {
    if (busy) return;
    busy = true;
    progress = 0;
    const repair = result.state === 'repair';
    setTicket({ state: 'download', rows: [youRow(local()), [repair ? L('Ремонт', 'Repair') : L('Едем в', 'Heading to'), repair ? L('файлы', 'files') : result.remote.version]], bar: true, note: L('Загрузка...', 'Downloading...'), actions: [button(L('Пауза', 'Pause'), () => api.pause()), button(L('Отмена', 'Cancel'), cancel, true)] });
    const r = await api.download();
    busy = false;
    if (r.ok) return applyUpdate(repair);
    if (r.code === 'aborted') {
      if (state === 'cancelled') return check();
      const p = lastProgress && lastProgress.phase === 'download' ? lastProgress : null;
      return setTicket({ state: 'paused', rows: [youRow(local()), [L('Доступна', 'Available'), result.remote ? result.remote.version : '']], note: L('Загрузка на паузе', 'Download paused') + (p ? ': ' + mb(p.done) + L(' из ', ' of ') + mb(p.total) : '') + L('. Скачанное сохранится.', '. Downloaded data is kept.'), actions: [button(L('Продолжить', 'Resume'), startDownload), button(L('Отмена', 'Cancel'), cancel, true)] });
    }
    if (r.code === 'space') return setTicket({ state: 'space', rows: [youRow(local())], bad: true, note: L('Для обновления нужно ещё ' + mb(r.need - r.free) + ' на диске ' + String(r.drive || '').replace(/\\$/, '') + '.', 'The update needs ' + mb(r.need - r.free) + ' more on drive ' + String(r.drive || '').replace(/\\$/, '') + '.'), actions: [button(L('Повторить', 'Retry'), startDownload), button(L('Играть', 'Play'), startGame, true, 'b-start')] });
    if (r.code === 'write') { info.writable = false; return showResult(); }
    showError(r);
  }

  async function cancel() {
    state = 'cancelled';
    await api.cancel();
    if (!busy) check();
  }

  async function applyUpdate(repair) {
    busy = true;
    progress = 1;
    setTicket({ state: 'apply', rows: [youRow(local())], bar: true, note: L('Устанавливаем файлы...', 'Installing files...') });
    const r = await api.apply({ start: false });
    if (!r.ok) {
      busy = false;
      return showError(r);
    }
    setTicket({ state: 'restart', rows: [youRow(local())], note: repair ? L('Готово. Перезапускаем...', 'Done. Restarting...') : L('Прибыли. Перезапускаем Star Rail 98...', 'Arrived. Restarting Star Rail 98...') });
  }

  function startGame() {
    if (['download', 'apply', 'restart'].includes(state)) return;
    state = 'starting';
    api.start();
  }

  async function closeLauncher() {
    if (state === 'apply' || state === 'restart') return;
    if (state === 'download') {
      if (!confirm(L('Прервать загрузку? Скачанное сохранится, продолжить можно при следующем запуске.', 'Stop the download? Downloaded data is kept; you can resume on the next start.'))) return;
      await api.pause();
    }
    api.close();
  }

  function bind() {
    $('b-min').addEventListener('click', () => api.minimize());
    $('b-close').addEventListener('click', closeLauncher);
    $('l-settings').addEventListener('click', () => go({ name: 'settings' }));
    document.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (!a) return;
      if (a.dataset.url) api.openUrl(a.dataset.url);
      else if (a.dataset.news) go({ name: 'article', id: a.dataset.news });
      else if (a.dataset.view) go({ name: a.dataset.view });
      else if (a.dataset.version) go({ name: 'version', version: a.dataset.version });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (view.name !== 'home') go({ name: view.name === 'article' ? 'news' : 'home' });
        else closeLauncher();
        return;
      }
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
        const b = $('t-actions').querySelector('button');
        if (b) { e.preventDefault(); b.click(); }
      }
    });
  }

  function applyStatic() {
    if (lang !== 'en') return;
    document.documentElement.lang = 'en';
    for (const el of document.querySelectorAll('[data-en]')) el.textContent = el.dataset.en;
    for (const el of document.querySelectorAll('[data-en-title]')) el.title = el.dataset.enTitle;
    for (const el of document.querySelectorAll('[data-en-html]')) el.innerHTML = el.dataset.enHtml;
  }

  async function boot() {
    info = await api.init();
    texts = info.settings.cache;
    bind();
    $('f-left').textContent = L('версия ', 'version ') + (local() || 'dev');
    applyStatic();
    renderMain();
    api.ready();
    document.body.dataset.ready = '1';
    if (info.dev) {
      result = { state: 'dev' };
      return showResult();
    }
    if (info.settings.checkOnStart === false) return setTicket({ state: 'idle', rows: [youRow(local())], note: afterNote() || L('Проверка обновлений при запуске выключена.', 'Update check on start is off.'), actions: [playButton(), button(L('Проверить', 'Check'), () => check(), true)] });
    await check();
  }

  boot().catch(err => {
    document.body.textContent = 'Launcher error: ' + err.message;
  });
})();
