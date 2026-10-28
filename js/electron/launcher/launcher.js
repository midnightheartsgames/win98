(() => {
  const api = window.win98Launcher;
  const lang = (() => {
    try { return localStorage.getItem('win98_language') === 'en' ? 'en' : 'ru'; } catch (err) { return 'ru'; }
  })();
  const L = (ru, en) => (lang === 'en' ? en : ru);
  const $ = id => document.getElementById(id);
  const icon = name => (window.Icons && window.Icons[name]) || '';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ver = v => (v && v.version ? v.version + (v.build ? ' (' + v.build + ')' : '') : '');
  const num = v => String(v || '').split('.').map(n => (/^\d+$/.test(n) ? Number(n) : -1));
  const cmp = (a, b) => {
    const pa = num(a), pb = num(b);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] === undefined ? 0 : pa[i]) - (pb[i] === undefined ? 0 : pb[i]);
      if (d) return d;
    }
    return 0;
  };
  const size = n => {
    if (n < 1048576) return Math.max(1, Math.round(n / 1024)) + L(' КБ', ' KB');
    const mb = n / 1048576;
    const t = mb >= 100 ? String(Math.round(mb)) : mb.toFixed(1);
    return (lang === 'en' ? t : t.replace('.', ',')) + L(' МБ', ' MB');
  };
  const plural = (n, one, few, many) => {
    if (lang === 'en') return n === 1 ? one : many;
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };
  const isoToShort = iso => (iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) : '');
  const dmyToIso = d => {
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d || '');
    return m ? m[3] + '-' + m[2] + '-' + m[1] : d || '';
  };

  let info = null;
  let result = null;
  let texts = null;
  let entries = [];
  let selected = '';
  let readSet = new Set();
  let state = 'check';
  let busy = false;
  let samples = [];
  let lastProgress = null;
  let clickCount = 0;
  let clickTimer = null;

  function myReports() {
    try {
      const list = JSON.parse(localStorage.getItem('win98.bugs.sent') || '[]');
      return new Set(list.map(r => r && r.id).filter(Boolean));
    } catch (err) {
      return new Set();
    }
  }

  function markup(text) {
    return esc(text)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/https:\/\/pennygachi\.men\/[^\s<]*/g, url => '<a data-url="' + url + '">' + url + '</a>');
  }

  function remoteVersion() {
    if (result && result.remote) return result.remote.version;
    return texts && texts.pointer ? texts.pointer.version : '';
  }

  function buildEntries() {
    const local = info.local ? info.local.version : '';
    const limit = remoteVersion();
    const out = [];
    for (const v of (texts && texts.notes && texts.notes.versions) || []) {
      if (limit && cmp(v.version, limit) > 0) continue;
      out.push({ id: 'v:' + v.version, kind: 'version', date: dmyToIso(v.date), data: v, installed: !!local && local !== 'dev' && cmp(v.version, local) <= 0 });
    }
    for (const n of (texts && texts.news && texts.news.items) || []) out.push({ id: 'n:' + n.id, kind: 'news', date: n.date, data: n, installed: true });
    out.sort((a, b) => b.date.localeCompare(a.date) || (a.kind === 'version' && b.kind === 'version' ? cmp(b.data.version, a.data.version) : 0));
    entries = out;
  }

  function pickInitial() {
    const pending = entries.find(e => e.kind === 'version' && !e.installed);
    const unread = entries.find(e => !readSet.has(e.id));
    const current = entries.find(e => e.kind === 'version' && info.local && e.data.version === info.local.version);
    const updated = info.after && entries.find(e => e.id === 'v:' + info.after.version);
    const pick = pending || updated || unread || current || entries[0];
    return pick ? pick.id : '';
  }

  function renderList() {
    const list = $('list');
    if (!entries.length) {
      list.innerHTML = '<div class="lw-empty">' + L('Пока пусто. Записи появятся после проверки обновлений.', 'Nothing yet. Entries appear after an update check.') + '</div>';
      $('text').innerHTML = '';
      updateUnread();
      return;
    }
    list.innerHTML = entries.map(e => {
      const title = e.kind === 'version' ? L('Версия ', 'Version ') + e.data.version : e.data.title;
      const note = e.kind === 'version' && !e.installed ? '<span class="lw-item-note">' + L('не установлена', 'not installed') + '</span>' : '';
      return '<div class="lw-item' + (readSet.has(e.id) ? '' : ' is-unread') + (e.id === selected ? ' is-selected' : '') + '" role="option" data-id="' + esc(e.id) + '">' +
        '<span>' + esc(isoToShort(e.date)) + '</span><span class="lw-item-icon icon-small">' + icon(e.kind === 'version' ? 'drive-floppy' : 'internet-explorer') + '</span>' +
        '<span><span class="lw-item-title">' + esc(title) + '</span>' + note + '</span></div>';
    }).join('');
    updateUnread();
  }

  function updateUnread() {
    const n = entries.filter(e => !readSet.has(e.id)).length;
    $('st-right').textContent = n ? L('Новых записей: ', 'New entries: ') + n : L('Новых записей нет', 'No new entries');
  }

  function renderText() {
    const e = entries.find(x => x.id === selected);
    const box = $('text');
    if (!e) { box.innerHTML = ''; return; }
    let html = '';
    if (e.kind === 'version') {
      const v = e.data;
      const mine = myReports();
      html += '<h3>' + L('Версия ', 'Version ') + esc(v.version + (v.build ? ' (' + v.build + ')' : '')) + '</h3>';
      html += '<div class="lw-date">' + esc(v.date || '') + '</div>';
      if (!e.installed) {
        const plan = result && result.plan && result.remote && result.remote.version === v.version ? result.plan : null;
        html += '<p class="lw-pending">' + L('Не установлена.', 'Not installed.') + (plan ? ' ' + L('Обновление: ', 'Update: ') + plan.files + ' ' + plural(plan.files, L('файл', 'file'), L('файла', 'files'), L('файлов', 'files')) + ', ' + size(plan.bytes) + '.' : '') + '</p>';
      }
      html += '<p><b>' + markup(v.title) + '</b></p><p>' + markup(v.summary) + '</p>';
      for (const s of v.sections || []) html += '<h4>' + markup(s.title) + '</h4><ul>' + s.items.map(i => '<li>' + markup(i) + '</li>').join('') + '</ul>';
      if ((v.fixed || []).length) {
        html += '<h4>' + L('Исправлено по отчётам игроков', 'Fixed from player reports') + '</h4><ul>' + v.fixed.map(f => '<li>' + (f.id ? '<b>' + esc(f.id) + '</b>: ' : '') + markup(f.text) + (f.id && mine.has(f.id) ? ' <span class="lw-mine">' + L('(ваш отчёт)', '(your report)') + '</span>' : '') + '</li>').join('') + '</ul>';
      }
    } else {
      const n = e.data;
      html += '<h3>' + markup(n.title) + '</h3><div class="lw-date">' + esc(n.date.split('-').reverse().join('.')) + '</div>';
      if (n.image) html += '<img alt="" src="' + esc(new URL('win98/' + n.image, info.updateUrl).href) + '">';
      html += '<p>' + markup(n.lead) + '</p>';
      let list = [];
      const flush = () => { if (list.length) { html += '<ul>' + list.map(i => '<li>' + markup(i) + '</li>').join('') + '</ul>'; list = []; } };
      for (const b of n.body || []) {
        if (b.startsWith('- ')) list.push(b.slice(2));
        else { flush(); html += '<p>' + markup(b) + '</p>'; }
      }
      flush();
    }
    box.innerHTML = html;
    box.scrollTop = 0;
  }

  function select(id) {
    selected = id;
    if (id && !readSet.has(id)) {
      readSet.add(id);
      api.read([id]);
    }
    renderList();
    renderText();
    const el = $('list').querySelector('.is-selected');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function button(label, accel, fn, isDefault) {
    const b = document.createElement('button');
    b.className = 'win-btn' + (isDefault ? ' is-default' : '');
    const i = accel ? label.toLowerCase().indexOf(accel.toLowerCase()) : -1;
    b.innerHTML = '<span>' + (i >= 0 ? esc(label.slice(0, i)) + '<span class="win-accel">' + esc(label[i]) + '</span>' + esc(label.slice(i + 1)) : esc(label)) + '</span>';
    if (accel) b.dataset.accel = accel.toLowerCase();
    b.addEventListener('click', fn);
    return b;
  }

  function setStatusIcon(kind) {
    const box = $('s-icon');
    if (kind === 'download') {
      box.innerHTML = '<div class="lw-anim"><span class="lw-from icon-small">' + icon('internet-explorer') + '</span><i class="lw-page"></i><span class="lw-to icon-small">' + icon('folder') + '</span></div>';
    } else {
      box.innerHTML = icon(kind === 'error' ? 'error' : kind === 'warning' ? 'warning' : 'win-update');
    }
  }

  function show(o) {
    state = o.state;
    setStatusIcon(o.icon || 'update');
    $('s-head').textContent = o.head || '';
    $('s-line').textContent = o.line || '';
    $('s-sub').textContent = o.sub || '';
    $('s-progress').hidden = !o.progress;
    $('s-run-row').hidden = !o.runToggle;
    const box = $('s-buttons');
    box.innerHTML = '';
    for (const b of o.buttons || []) box.appendChild(b);
    const startDefault = !(o.buttons || []).some(b => b.classList.contains('is-default'));
    $('b-start').classList.toggle('is-default', startDefault);
    $('b-start').disabled = !!o.lockStart;
    $('b-params').disabled = !!o.lockStart;
    const warn = [];
    if (info && info.portBusy) warn.push(L('Порт 39898 занят другой программой. Win 98 запустится, но сохранения будут не видны, пока порт не освободится.', 'Port 39898 is used by another program. Win 98 will start, but saves stay hidden until the port is free.'));
    if (o.warn) warn.push(o.warn);
    $('s-warn').textContent = warn.join(' ');
    $('s-warn').hidden = !warn.length;
  }

  function installedLine() {
    return info.local && info.local.version !== 'dev' ? L('Установлена версия ', 'Installed version ') + ver(info.local) : L('Сборка для разработки', 'Development build');
  }

  function versionsBetween() {
    if (!texts || !texts.notes || !info.local) return [];
    const target = remoteVersion();
    return texts.notes.versions.filter(v => cmp(v.version, info.local.version) > 0 && (!target || cmp(v.version, target) <= 0)).map(v => v.version).sort(cmp);
  }

  function showResult() {
    const r = result;
    const st = r.state;
    if (st === 'dev') return show({ state: st, icon: 'info', head: L('Запуск из папки проекта: обновления выключены', 'Running from the project folder: updates are off'), line: L('Новости и изменения показываются из последней проверки.', 'News and changes come from the last check.') });
    if (st === 'latest') return show({ state: st, head: L('Установлена последняя версия ', 'You have the latest version ') + ver(r.local), line: L('Сохранения лежат отдельно и при обновлении не меняются.', 'Saves are kept separately and never change on update.'), sub: afterNote() });
    if (st === 'update' || st === 'repair') {
      if (!info.writable) return show({ state: 'readonly', icon: 'warning', head: L('Win 98 лежит в папке, куда нельзя записывать:', 'Win 98 is in a folder that cannot be written:'), line: info.installDir, sub: L('Перенесите папку, например в D:\\Games, и запустите Win98.exe оттуда.', 'Move the folder, for example to D:\\Games, and start Win98.exe from there.'), buttons: [button(L('Открыть папку', 'Open folder'), L('п', 'o'), () => api.openFolder())] });
      const list = versionsBetween();
      const head = st === 'repair'
        ? L('Повреждено файлов: ', 'Damaged files: ') + r.plan.files
        : list.length > 1 ? L('Доступно ' + list.length + ' ' + plural(list.length, 'обновление', 'обновления', 'обновлений') + ': ', list.length + ' updates available: ') + list.join(L(' и ', ' and ')) : L('Доступна версия ', 'Version available: ') + ver(r.remote);
      const line = r.plan.files + ' ' + plural(r.plan.files, L('файл', 'file'), L('файла', 'files'), L('файлов', 'files')) + ', ' + size(r.plan.bytes) + '. ' + L('Сохранения не затрагиваются.', 'Saves are not touched.');
      return show({ state: st, head, line, sub: installedLine(), buttons: [button(st === 'repair' ? L('Восстановить', 'Repair') : L('Обновить', 'Update'), L('о', 'u'), startDownload, true)] });
    }
    if (st === 'full') return show({ state: st, icon: 'warning', head: L('Версия ', 'Version ') + ver(r.remote) + L(' меняет саму программу.', ' changes the program itself.'), line: L('Скачайте архив Win98.zip (1,7 ГБ) и распакуйте его поверх. Сохранения останутся.', 'Download Win98.zip (1.7 GB) and unpack it over this folder. Saves stay.'), sub: installedLine(), buttons: [button(L('Страница загрузки', 'Download page'), L('с', 'd'), () => api.openUrl(info.downloadPage))] });
    if (st === 'offline') return show({ state: st, icon: 'warning', head: L('Сервер обновлений не отвечает.', 'The update server does not answer.'), line: info.local ? L('Можно играть в установленную версию ', 'You can play the installed version ') + ver(info.local) + '.' : '', sub: lastCheckText(), buttons: [button(L('Повторить', 'Retry'), L('п', 'r'), check)] });
    return showError(r.error || { code: 'error', message: st });
  }

  function errorText(err) {
    if (!err) return L('Неизвестная ошибка.', 'Unknown error.');
    if (err.code === 'corrupt') return L('Файл ' + err.message.replace(/ arrived damaged$/, '') + ' трижды пришёл повреждённым.', 'File ' + err.message.replace(/ arrived damaged$/, '') + ' arrived damaged three times.');
    if (err.code === 'signature') return L('Сервер прислал неподписанное обновление. Оно не установлено.', 'The server sent an unsigned update. It was not installed.');
    if (err.code === 'http') return L('Сервер ответил ошибкой (HTTP ' + err.status + ').', 'The server answered with an error (HTTP ' + err.status + ').');
    if (err.code === 'offline') return L('Связь оборвалась.', 'The connection was lost.');
    if (err.code === 'write') return L('Не удалось заменить файл: его держит другая программа.', 'A file could not be replaced: another program holds it.');
    if (err.code === 'local') return L('Нет файла release.json: эту сборку обновить нельзя.', 'release.json is missing: this build cannot be updated.');
    return err.message || String(err.code);
  }

  function showError(err) {
    show({ state: 'error', icon: 'error', head: errorText(err), line: info.local ? L('Можно играть в установленную версию ', 'You can play the installed version ') + ver(info.local) + '.' : '', buttons: [button(L('Повторить', 'Retry'), L('п', 'r'), check)] });
  }

  function lastCheckText() {
    if (!info.settings.checkedAt) return '';
    return L('Новости от ', 'News from ') + new Date(info.settings.checkedAt).toLocaleString(lang === 'en' ? 'en-GB' : 'ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function afterNote() {
    const a = info.after;
    const rec = info.recovered;
    if (a && a.rolledBack) return L('Возвращена версия ', 'Returned to version ') + ver(a) + '.';
    if (a && a.repaired) return L('Файлы восстановлены.', 'Files repaired.');
    if (a) return L('Win 98 обновлена до ', 'Win 98 was updated to ') + ver(a) + '.';
    if (rec && rec.recovered === 'apply') return L('Прошлое обновление прервалось и доделано.', 'The last update was interrupted and has been finished.');
    if (rec && rec.recovered === 'rollback') return L('Прошлое обновление прервалось, возвращена версия ', 'The last update was interrupted, version restored: ') + rec.version + '.';
    return '';
  }

  function updateStatusLeft() {
    const parts = [];
    if (info.settings.channel === 'test') parts.push(L('Канал: test', 'Channel: test'));
    if (info.settings.checkedAt) {
      const d = new Date(info.settings.checkedAt);
      const today = new Date().toDateString() === d.toDateString();
      const time = d.toLocaleTimeString(lang === 'en' ? 'en-GB' : 'ru-RU', { hour: '2-digit', minute: '2-digit' });
      parts.push(today ? L('Проверено сегодня в ', 'Checked today at ') + time : L('Проверено ', 'Checked ') + d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'ru-RU') + ' ' + time);
    }
    $('st-left').textContent = parts.join(' · ') || installedLine();
  }

  async function check(opts) {
    if (busy) return;
    busy = true;
    show({ state: 'check', head: opts && opts.repair ? L('Проверяем файлы...', 'Checking files...') : L('Проверяем обновления...', 'Checking for updates...'), line: installedLine(), progress: !!(opts && opts.repair) });
    $('s-fill').style.width = '0';
    $('s-count').textContent = '';
    try {
      const r = await api.check(opts || {});
      result = r.result;
      if (r.texts) texts = r.texts;
      info.settings.checkedAt = r.checkedAt;
      info.writable = r.writable;
    } catch (err) {
      result = { state: 'error', error: { code: 'error', message: err.message } };
    }
    busy = false;
    const before = selected;
    buildEntries();
    if (!before || !entries.some(e => e.id === before) || result.state === 'update') selected = pickInitial();
    renderList();
    renderText();
    if (selected && !readSet.has(selected)) select(selected);
    if (opts && opts.repair && result.state === 'latest') {
      show({ state: 'latest', head: L('Файлы в порядке', 'All files are fine'), line: installedLine() });
    } else showResult();
    updateStatusLeft();
    if (info.autoUpdate && result.state === 'update' && info.writable) {
      info.autoUpdate = false;
      startDownload();
    }
  }

  function speedText(p) {
    const now = Date.now();
    samples.push([now, p.done]);
    while (samples.length > 2 && now - samples[0][0] > 3000) samples.shift();
    const [t0, d0] = samples[0];
    const rate = now > t0 ? (p.done - d0) / ((now - t0) / 1000) : 0;
    let text = size(p.done) + L(' из ', ' of ') + size(p.total);
    if (rate > 0) {
      const left = Math.max(0, Math.round((p.total - p.done) / rate));
      text += ' · ' + size(rate) + L('/с', '/s') + ' · ' + L('осталось около ', 'about ') + (left < 60 ? left + L(' с', ' s') : Math.ceil(left / 60) + L(' мин', ' min')) + L('', ' left');
    }
    return text;
  }

  api.onProgress(p => {
    lastProgress = p;
    if (p.phase === 'scan' || p.phase === 'download') {
      $('s-fill').style.width = (p.total ? Math.min(100, (p.done / p.total) * 100) : 0) + '%';
      $('s-count').textContent = p.phase === 'scan' ? size(p.done) + L(' из ', ' of ') + size(p.total) : speedText(p);
    } else if (p.phase === 'apply') {
      $('s-fill').style.width = (p.total ? (p.done / p.total) * 100 : 0) + '%';
      $('s-head').textContent = L('Устанавливаем файлы: ', 'Installing files: ') + p.done + L(' из ', ' of ') + p.total;
    }
  });

  async function startDownload() {
    if (busy) return;
    busy = true;
    samples = [];
    const target = result.state === 'repair' ? L('Восстанавливаем файлы', 'Repairing files') : L('Загружаем версию ', 'Downloading version ') + ver(result.remote);
    show({ state: 'download', icon: 'download', head: target, progress: true, runToggle: result.state !== 'repair', lockStart: true, buttons: [button(L('Пауза', 'Pause'), L('п', 'p'), () => api.pause()), button(L('Отмена', 'Cancel'), L('о', 'c'), cancelDownload)] });
    const r = await api.download();
    busy = false;
    if (r.ok) return applyUpdate();
    if (r.code === 'aborted') {
      const p = lastProgress && lastProgress.phase === 'download' ? lastProgress : null;
      if (state === 'cancelled') return check();
      return show({ state: 'paused', icon: 'update', head: L('Загрузка приостановлена', 'Download paused') + (p ? ': ' + size(p.done) + L(' из ', ' of ') + size(p.total) : ''), line: L('Скачанное сохранится, продолжить можно и после перезапуска.', 'Downloaded parts are kept, you can continue after a restart.'), buttons: [button(L('Продолжить', 'Resume'), L('р', 'r'), startDownload, true), button(L('Отмена', 'Cancel'), L('о', 'c'), cancelDownload)] });
    }
    if (r.code === 'space') return show({ state: 'space', icon: 'warning', head: L('Для обновления нужно ещё ', 'The update needs another ') + size(r.need - r.free) + L(' на диске ', ' on drive ') + String(r.drive || '').replace(/\\$/, '') + '.', line: L('Освободите место и нажмите «Повторить».', 'Free some space and press Retry.'), buttons: [button(L('Повторить', 'Retry'), L('п', 'r'), startDownload, true)] });
    if (r.code === 'write') { info.writable = false; return showResult(); }
    showError(r);
  }

  async function cancelDownload() {
    state = 'cancelled';
    await api.cancel();
    if (!busy) check();
  }

  async function applyUpdate() {
    busy = true;
    show({ state: 'apply', head: L('Устанавливаем файлы...', 'Installing files...'), line: L('Не выключайте компьютер. Это займёт несколько секунд.', 'Do not turn off the computer. This takes a few seconds.'), progress: true, lockStart: true });
    $('s-fill').style.width = '0';
    $('s-count').textContent = '';
    const r = await api.apply({ start: result.state !== 'repair' && $('s-run').checked });
    if (!r.ok) {
      busy = false;
      return showError(r);
    }
    show({ state: 'restart', head: L('Готово. Перезапускаем Win 98...', 'Done. Restarting Win 98...'), lockStart: true });
  }

  function modal(html, onReady) {
    const m = $('modal');
    m.innerHTML = html;
    m.hidden = false;
    const close = () => { m.hidden = true; m.innerHTML = ''; };
    onReady(m, close);
    const first = m.querySelector('.is-default') || m.querySelector('button');
    if (first) first.focus();
    return close;
  }

  function dialogShell(title, body) {
    return '<div class="win-window active is-dialog lw-dialog"><div class="win-titlebar"><div class="win-titlebar-left"><div class="win-titlebar-title">' + esc(title) + '</div></div></div><div class="win-window-body">' + body + '</div></div>';
  }

  function confirmBox(text, yes, no) {
    return new Promise(resolve => {
      modal(dialogShell('Microslop Win 98', '<div class="lw-msg">' + icon('warning') + '<div>' + esc(text) + '</div></div><div class="lw-buttons"><button class="win-btn is-default" data-r="1">' + esc(yes) + '</button><button class="win-btn" data-r="0">' + esc(no) + '</button></div>'), (m, close) => {
        m.querySelectorAll('button[data-r]').forEach(b => b.addEventListener('click', () => { close(); resolve(b.dataset.r === '1'); }));
      });
    });
  }

  function openParams() {
    const s = info.settings;
    const back = info.backups && info.backups[0];
    const body =
      '<fieldset class="lw-group"><legend>' + L('При запуске', 'On start') + '</legend>' +
      '<label class="lw-row"><input type="checkbox" id="p-check"' + (s.checkOnStart ? ' checked' : '') + '> ' + L('Проверять обновления', 'Check for updates') + '</label>' +
      '<label class="lw-row"><input type="checkbox" id="p-skip"' + (s.skipLauncher ? ' checked' : '') + '> ' + L('Сразу запускать Win 98, если обновлений нет', 'Start Win 98 at once when there are no updates') + '</label></fieldset>' +
      '<fieldset class="lw-group"><legend>' + L('Файлы Win 98', 'Win 98 files') + '</legend>' +
      '<div class="lw-row"><div class="lw-path bevel-inset">' + esc(info.installDir) + '</div><button class="win-btn" id="p-open">' + L('Открыть папку', 'Open folder') + '</button></div>' +
      '<div class="lw-row"><button class="win-btn" id="p-repair"' + (info.dev ? ' disabled' : '') + '>' + L('Проверить файлы...', 'Check files...') + '</button>' +
      (back ? '<button class="win-btn" id="p-back">' + L('Вернуть версию ', 'Return to version ') + esc(back) + '</button>' : '') + '</div>' +
      '<div>' + L('Сохранения лежат отдельно (' + esc(info.userData) + ') и при обновлении не меняются.', 'Saves are kept separately (' + esc(info.userData) + ') and never change on update.') + '</div></fieldset>' +
      '<div class="lw-buttons"><span class="lw-version" id="p-ver">' + esc(installedLine() + (s.channel === 'test' ? ' · test' : '')) + '</span><span style="flex:1"></span><button class="win-btn is-default" id="p-ok">OK</button><button class="win-btn" id="p-cancel">' + L('Отмена', 'Cancel') + '</button></div>';
    modal(dialogShell(L('Параметры', 'Settings'), body), (m, close) => {
      let channel = s.channel;
      m.querySelector('#p-open').addEventListener('click', () => api.openFolder());
      m.querySelector('#p-cancel').addEventListener('click', close);
      m.querySelector('#p-ok').addEventListener('click', async () => {
        const changed = channel !== s.channel;
        info.settings = await api.settings({ checkOnStart: m.querySelector('#p-check').checked, skipLauncher: m.querySelector('#p-skip').checked, channel });
        close();
        updateStatusLeft();
        if (changed) check();
      });
      const repair = m.querySelector('#p-repair');
      if (repair) repair.addEventListener('click', () => { close(); check({ repair: true }); });
      const backBtn = m.querySelector('#p-back');
      if (backBtn) backBtn.addEventListener('click', async () => {
        close();
        if (!(await confirmBox(L('Вернуть версию ' + back + '? Win 98 перезапустится.', 'Return to version ' + back + '? Win 98 will restart.'), L('Да', 'Yes'), L('Нет', 'No')))) return;
        show({ state: 'apply', head: L('Возвращаем версию ', 'Returning to version ') + back + '...', lockStart: true });
        const r = await api.rollback();
        if (!r.ok) showError(r);
      });
      m.querySelector('#p-ver').addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clickCount = 0; }, 1500);
        if (clickCount >= 5) {
          clickCount = 0;
          channel = channel === 'test' ? 'stable' : 'test';
          m.querySelector('#p-ver').textContent = installedLine() + (channel === 'test' ? ' · test' : '');
        }
      });
    });
  }

  async function closeLauncher() {
    if (state === 'apply' || state === 'restart') return;
    if (state === 'download') {
      if (!(await confirmBox(L('Прервать загрузку? Скачанное сохранится, продолжить можно при следующем запуске.', 'Stop the download? Downloaded parts are kept, you can continue next time.'), L('Да', 'Yes'), L('Нет', 'No')))) return;
      await api.pause();
    }
    api.close();
  }

  function startSystem() {
    if ($('b-start').disabled) return;
    $('b-start').disabled = true;
    api.start();
  }

  function bind() {
    $('t-icon').innerHTML = icon('start-logo');
    $('b-min').innerHTML = icon('cap-min');
    $('b-close').innerHTML = icon('cap-close');
    $('b-min').title = L('Свернуть', 'Minimize');
    $('b-close').title = L('Закрыть', 'Close');
    $('l-state').textContent = L('Состояние', 'Status');
    $('l-feed').textContent = L('Новости и изменения', 'News and changes');
    $('s-run-text').textContent = L('Запустить Win 98 после обновления', 'Start Win 98 after the update');
    $('s-run').checked = info.settings.runAfterUpdate !== false;
    $('s-run').addEventListener('change', () => api.settings({ runAfterUpdate: $('s-run').checked }));
    const params = button(L('Параметры...', 'Settings...'), L('а', 's'), openParams);
    params.id = 'b-params';
    $('b-params').replaceWith(params);
    const start = button(L('Запустить Win 98', 'Start Win 98'), L('з', 't'), startSystem, true);
    start.id = 'b-start';
    $('b-start').replaceWith(start);
    $('b-min').addEventListener('click', () => api.minimize());
    $('b-close').addEventListener('click', closeLauncher);
    $('list').addEventListener('click', e => {
      const item = e.target.closest('.lw-item');
      if (item) select(item.dataset.id);
    });
    $('list').addEventListener('keydown', e => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const i = entries.findIndex(x => x.id === selected);
      const next = entries[Math.max(0, Math.min(entries.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
      if (next) select(next.id);
    });
    $('text').addEventListener('click', e => {
      const a = e.target.closest('a[data-url]');
      if (a) api.openUrl(a.dataset.url);
    });
    document.addEventListener('keydown', e => {
      const modalOpen = !$('modal').hidden;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (modalOpen) { const c = $('modal').querySelector('#p-cancel, [data-r="0"]'); if (c) c.click(); }
        else closeLauncher();
        return;
      }
      if (e.altKey && e.key && e.key.length === 1) {
        const scope = modalOpen ? $('modal') : document;
        const b = [...scope.querySelectorAll('button[data-accel]')].find(x => x.dataset.accel === e.key.toLowerCase() && !x.disabled && x.offsetParent);
        if (b) { e.preventDefault(); b.click(); }
        return;
      }
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement) && e.target.tagName !== 'INPUT') {
        const scope = modalOpen ? $('modal') : document.getElementById('lw');
        const d = [...scope.querySelectorAll('.win-btn.is-default')].find(x => !x.disabled && x.offsetParent);
        if (d) { e.preventDefault(); d.click(); }
      }
    });
  }

  async function boot() {
    info = await api.init();
    readSet = new Set(info.settings.read || []);
    texts = info.settings.cache;
    bind();
    buildEntries();
    selected = pickInitial();
    renderList();
    renderText();
    updateStatusLeft();
    api.ready();
    document.body.dataset.ready = '1';
    if (info.dev) {
      result = { state: 'dev', local: info.local };
      showResult();
      return;
    }
    if (info.settings.checkOnStart === false) {
      show({ state: 'idle', head: installedLine(), line: L('Проверка обновлений при запуске выключена.', 'Update check on start is off.'), sub: afterNote(), buttons: [button(L('Проверить', 'Check'), L('п', 'c'), () => check())] });
      return;
    }
    await check();
  }

  boot().catch(err => {
    document.body.textContent = 'Launcher error: ' + err.message;
  });
})();
