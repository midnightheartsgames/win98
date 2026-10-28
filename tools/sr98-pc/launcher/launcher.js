(() => {
  const api = window.win98Launcher;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mb = n => (n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' КБ' : (n / 1048576).toFixed(1).replace('.', ',') + ' МБ');
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
  const versions = () => ((texts && texts.notes && texts.notes.versions) || []).filter(v => !remote() || cmp(v.version, remote()) <= 0).sort((a, b) => cmp(a.version, b.version));
  const pending = () => versions().filter(v => local() && local() !== 'dev' && cmp(v.version, local()) > 0);
  const news = () => (texts && texts.news && texts.news.items) || [];

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
      const label = s.here ? 'вы здесь' : target ? 'новая' : '';
      return '<a class="hsrs-stop' + (s.here ? ' is-here' : '') + (target ? ' is-target' : '') + '" data-version="' + esc(s.version) + '"><i></i><span>' + esc(s.version) + '</span><small>' + label + '</small></a>';
    }).join('');
  }

  function notesHtml(v) {
    const mine = myReports();
    let html = '<h1 class="hsrs-h1">Версия ' + esc(v.version) + '</h1><p class="hsrs-date-line">' + esc(v.date || '') + (cmp(v.version, local()) > 0 ? ' · не установлена' : '') + '</p>';
    html += '<p class="hsrs-article-lead">' + esc(v.title) + '</p><p>' + esc(v.summary) + '</p>';
    for (const s of v.sections || []) html += '<h2 class="hsrs-h2">' + esc(s.title) + '</h2><ul>' + s.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul>';
    if ((v.fixed || []).length) html += '<h2 class="hsrs-h2">Исправлено по отчётам игроков</h2><ul>' + v.fixed.map(f => '<li>' + (f.id ? '<b>' + esc(f.id) + '</b>: ' : '') + esc(f.text) + (f.id && mine.has(f.id) ? ' <span class="lw-mine">ваш отчёт</span>' : '') + '</li>').join('') + '</ul>';
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
      if (ahead.length) html += notesHtml(ahead[ahead.length - 1]).replace('<h1 class="hsrs-h1">Версия', '<h1 class="hsrs-h1">Что нового в');
      html += '<h2 class="hsrs-h2">Новости</h2>' + (news().length ? newsRows(news().slice(0, 6), false) + '<p class="hsrs-more"><a data-view="news">Все новости</a></p>' : '<p class="hsrs-small">' + (texts ? 'Новостей пока нет.' : 'Новости появятся после первой проверки обновлений.') + '</p>');
      if (!ahead.length) {
        const cur = versions().find(v => v.version === local());
        if (cur) html += '<h2 class="hsrs-h2">Что было в ' + esc(cur.version) + '</h2><p><b>' + esc(cur.title) + '</b>. ' + esc(cur.summary) + ' <a data-version="' + esc(cur.version) + '">Подробнее</a></p>';
      }
    } else if (view.name === 'news') {
      html = '<p class="hsrs-crumbs"><a data-view="home">Главная</a> &gt; Новости</p><h1 class="hsrs-h1">Новости</h1>' + newsRows(news(), true);
    } else if (view.name === 'article') {
      const n = news().find(x => x.id === view.id);
      if (n) {
        html = '<p class="hsrs-crumbs"><a data-view="news">‹ Все новости</a> &gt; ' + esc(n.tag || 'Новость') + '</p><h1 class="hsrs-h1">' + esc(n.title) + '</h1><p class="hsrs-date-line">' + esc(n.dateText || n.date) + '</p><p class="hsrs-article-lead">' + esc(n.lead) + '</p>';
        for (const p of n.body || []) html += p.startsWith('- ') ? '<ul><li>' + esc(p.slice(2)) + '</li></ul>' : '<p>' + esc(p) + '</p>';
      }
    } else if (view.name === 'version') {
      const v = versions().find(x => x.version === view.version);
      html = '<p class="hsrs-crumbs"><a data-view="home">‹ Главная</a></p>' + (v ? notesHtml(v) : '<p>Для версии ' + esc(view.version) + ' пока нет описания.</p>');
    } else if (view.name === 'settings') {
      const s = info.settings;
      const back = info.backups && info.backups[0];
      html = '<p class="hsrs-crumbs"><a data-view="home">‹ Главная</a></p><h1 class="hsrs-h1">Настройки</h1><div class="lw-settings">' +
        '<h2 class="hsrs-h2">При запуске</h2>' +
        '<label><input type="checkbox" id="p-check"' + (s.checkOnStart !== false ? ' checked' : '') + '> Проверять обновления</label>' +
        '<label><input type="checkbox" id="p-skip"' + (s.skipLauncher ? ' checked' : '') + '> Сразу открывать игру, если обновлений нет</label>' +
        '<h2 class="hsrs-h2">Файлы игры</h2><span class="lw-path">' + esc(info.installDir) + '</span>' +
        '<p><a class="hsrs-btn" id="p-open">Открыть папку</a> ' + (info.dev ? '' : '<a class="hsrs-btn" id="p-repair">Проверить файлы</a> ') + (back ? '<a class="hsrs-btn" id="p-back">Вернуть версию ' + esc(back) + '</a>' : '') + '</p>' +
        '<p class="hsrs-small">Сохранения лежат отдельно (' + esc(info.userData) + ') и при обновлении не меняются.</p>' +
        '<p class="lw-version" id="p-ver">Установлена версия ' + esc(local() || 'dev') + (s.channel === 'test' ? ' · канал test' : '') + '</p></div>';
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
    if ($('p-repair')) $('p-repair').addEventListener('click', () => { go({ name: 'home' }); check({ repair: true }); });
    if ($('p-back')) $('p-back').addEventListener('click', async () => {
      const back = info.backups[0];
      if (!confirm('Вернуть версию ' + back + '? Игра перезапустится.')) return;
      setTicket({ state: 'apply', note: 'Возвращаем версию ' + back + '...', lock: true });
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

  const playButton = () => button('Играть', startGame, false, 'b-start');

  function showResult() {
    const r = result;
    const st = r.state;
    const rows = [['У вас', local() || 'dev']];
    if (st === 'dev') return setTicket({ state: st, rows, note: 'Сборка для разработки: обновления выключены.', actions: [playButton()] });
    if (st === 'latest') return setTicket({ state: st, rows, note: afterNote() || 'У вас последняя версия.', actions: [playButton()] });
    if (st === 'update' || st === 'repair') {
      if (!info.writable) return setTicket({ state: 'readonly', rows, bad: true, note: 'Игра лежит в папке, куда нельзя записывать: ' + info.installDir + '. Перенесите папку, например в D:\\Games.', actions: [button('Открыть папку', () => api.openFolder()), playButton()] });
      const n = r.plan.files;
      const size = n + ' ' + plural(n, 'файл', 'файла', 'файлов') + ', ' + mb(r.plan.bytes);
      if (st === 'repair') return setTicket({ state: st, rows: rows.concat([['Повреждено', size]]), actions: [button('Восстановить', startDownload), playButton()] });
      return setTicket({ state: st, rows: rows.concat([['Доступна', r.remote.version], ['Загрузка', size]]), note: 'Сохранения не затрагиваются.', actions: [button('Обновить', startDownload), button('Играть без обновления', startGame, true, 'b-start')] });
    }
    if (st === 'full') return setTicket({ state: st, rows: rows.concat([['Доступна', r.remote.version]]), bad: true, note: 'Новая версия меняет саму программу. Скачайте StarRail98-PC.zip с сайта, сохранения останутся.', actions: [button('Страница загрузки', () => api.openUrl(info.downloadPage)), button('Играть', startGame, true, 'b-start')] });
    if (st === 'offline') return setTicket({ state: st, rows, bad: true, note: 'Станция связи молчит. Играть можно в ' + (local() || 'установленную версию') + '.', actions: [playButton(), button('Повторить', () => check(), true)] });
    return showError(r.error);
  }

  function errorText(err) {
    if (!err) return 'Неизвестная ошибка.';
    if (err.code === 'corrupt') return 'Файл ' + String(err.message).replace(/ arrived damaged$/, '') + ' трижды пришёл повреждённым.';
    if (err.code === 'signature') return 'Сервер прислал неподписанное обновление. Оно не установлено.';
    if (err.code === 'http') return 'Сервер ответил ошибкой (HTTP ' + err.status + ').';
    if (err.code === 'offline') return 'Связь оборвалась.';
    if (err.code === 'write') return 'Не удалось заменить файл: его держит другая программа.';
    return err.message || String(err.code);
  }

  function showError(err) {
    setTicket({ state: 'error', rows: [['У вас', local() || 'dev']], bad: true, note: errorText(err), actions: [playButton(), button('Повторить', () => check(), true)] });
  }

  function afterNote() {
    const a = info.after, rec = info.recovered;
    if (a && a.rolledBack) return 'Возвращена версия ' + a.version + '.';
    if (a && a.repaired) return 'Файлы восстановлены.';
    if (a) return 'Star Rail 98 обновлена до ' + a.version + '.';
    if (rec && rec.recovered === 'apply') return 'Прошлое обновление прервалось и доделано.';
    if (rec && rec.recovered === 'rollback') return 'Прошлое обновление прервалось, возвращена версия ' + rec.version + '.';
    return '';
  }

  async function check(opts) {
    if (busy) return;
    busy = true;
    setTicket({ state: 'check', rows: [['У вас', local() || 'dev']], note: opts && opts.repair ? 'Проверяем файлы...' : 'Связываемся со станцией...', bar: !!(opts && opts.repair), actions: [playButton()] });
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
    if (opts && opts.repair && result.state === 'latest') setTicket({ state: 'latest', rows: [['У вас', local()]], note: 'Файлы в порядке.', actions: [playButton()] });
    else showResult();
    renderMain();
  }

  api.onProgress(p => {
    lastProgress = p;
    progress = p.total ? Math.min(1, p.done / p.total) : 0;
    $('t-fill').style.width = progress * 100 + '%';
    if (p.phase === 'download') $('t-note').textContent = mb(p.done) + ' из ' + mb(p.total);
    if (p.phase === 'scan') $('t-note').textContent = 'Проверено ' + mb(p.done) + ' из ' + mb(p.total);
    if (p.phase === 'apply') $('t-note').textContent = 'Устанавливаем файлы: ' + p.done + ' из ' + p.total;
    if (p.phase !== 'scan') renderRoute();
  });

  async function startDownload() {
    if (busy) return;
    busy = true;
    progress = 0;
    const repair = result.state === 'repair';
    setTicket({ state: 'download', rows: [['У вас', local()], [repair ? 'Ремонт' : 'Едем в', repair ? 'файлы' : result.remote.version]], bar: true, note: 'Загрузка...', actions: [button('Пауза', () => api.pause()), button('Отмена', cancel, true)] });
    const r = await api.download();
    busy = false;
    if (r.ok) return applyUpdate(repair);
    if (r.code === 'aborted') {
      if (state === 'cancelled') return check();
      const p = lastProgress && lastProgress.phase === 'download' ? lastProgress : null;
      return setTicket({ state: 'paused', rows: [['У вас', local()], ['Доступна', result.remote ? result.remote.version : '']], note: 'Загрузка на паузе' + (p ? ': ' + mb(p.done) + ' из ' + mb(p.total) : '') + '. Скачанное сохранится.', actions: [button('Продолжить', startDownload), button('Отмена', cancel, true)] });
    }
    if (r.code === 'space') return setTicket({ state: 'space', rows: [['У вас', local()]], bad: true, note: 'Для обновления нужно ещё ' + mb(r.need - r.free) + ' на диске ' + String(r.drive || '').replace(/\\$/, '') + '.', actions: [button('Повторить', startDownload), button('Играть', startGame, true, 'b-start')] });
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
    setTicket({ state: 'apply', rows: [['У вас', local()]], bar: true, note: 'Устанавливаем файлы...' });
    const r = await api.apply({ start: false });
    if (!r.ok) {
      busy = false;
      return showError(r);
    }
    setTicket({ state: 'restart', rows: [['У вас', local()]], note: repair ? 'Готово. Перезапускаем...' : 'Прибыли. Перезапускаем Star Rail 98...' });
  }

  function startGame() {
    if (['download', 'apply', 'restart'].includes(state)) return;
    state = 'starting';
    api.start();
  }

  async function closeLauncher() {
    if (state === 'apply' || state === 'restart') return;
    if (state === 'download') {
      if (!confirm('Прервать загрузку? Скачанное сохранится, продолжить можно при следующем запуске.')) return;
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

  async function boot() {
    info = await api.init();
    texts = info.settings.cache;
    bind();
    $('f-left').textContent = 'версия ' + (local() || 'dev');
    renderMain();
    api.ready();
    document.body.dataset.ready = '1';
    if (info.dev) {
      result = { state: 'dev' };
      return showResult();
    }
    if (info.settings.checkOnStart === false) return setTicket({ state: 'idle', rows: [['У вас', local()]], note: afterNote() || 'Проверка обновлений при запуске выключена.', actions: [playButton(), button('Проверить', () => check(), true)] });
    await check();
  }

  boot().catch(err => {
    document.body.textContent = 'Launcher error: ' + err.message;
  });
})();
