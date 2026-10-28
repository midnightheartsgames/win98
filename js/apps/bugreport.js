class AppBugReport {
  constructor() {
    this.WIN_ID = 'app_bugreport';
    this.MARKS_ID = 'app_bugreport_marks';
    this.LIST_ID = 'app_bugreport_list';
    this.F10_OWNERS = ['app_fallout', 'app_anotherwar'];
    this.SENT_KEY = 'win98.bugs.sent';
    this.NOTICE_KEY = 'win98.bugs.notice';
    this.CHECKED_KEY = 'win98.bugs.checked';
    this.CRASH_MUTE_KEY = 'win98.bugs.crashMute';
    this.crashShown = new Map();
    this.crashCount = 0;
    this.MAX_SENT = 50;
    this.MAX_SAVE_BYTES = 1024 * 1024;
    this.draft = null;
    this.opening = false;
    this.busy = false;
    this.trayEl = null;
    window.addEventListener('keydown', e => this.onKey(e), true);
    window.addEventListener('load', () => setTimeout(() => this.checkInBackground(), 20000));
    window.addEventListener('load', () => {
      const id = this.reproId();
      if (id) this.startRepro(id).catch(err => console.warn('repro: ' + err.message));
    });
    window.addEventListener('bugreport-crash', e => this.onCrash(e.detail || {}));
    ['bugreport-sent', 'bugreport-rejected', 'bugreport-dropped'].forEach(type => window.addEventListener(type, e => this.onQueueEvent(type, e.detail || {})));
  }

  get ru() {
    return !window.i18n || window.i18n.getLanguage() === 'ru';
  }

  L(ru, en) {
    return this.ru ? ru : en;
  }

  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  size(bytes) {
    const kb = Math.max(1, Math.ceil((bytes || 0) / 1024));
    if (kb < 1024) return kb.toLocaleString(this.ru ? 'ru-RU' : 'en-US') + this.L(' КБ', ' KB');
    return (kb / 1024).toLocaleString(this.ru ? 'ru-RU' : 'en-US', { maximumFractionDigits: 1 }) + this.L(' МБ', ' MB');
  }

  date(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString(this.ru ? 'ru-RU' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  isBooting() {
    const post = document.getElementById('bios-post-screen');
    const boot = document.getElementById('boot-screen');
    const bios = window.biosEngine;
    return !!((post && post.classList.contains('active')) || (boot && boot.style.display !== 'none') || (bios && bios.isSetupVisible && bios.isSetupVisible()));
  }

  hotkeyAction(e, activeId, booting) {
    if (e.key !== 'F10' || e.repeat || e.altKey || e.shiftKey || e.metaKey) return null;
    if (booting) return null;
    if (e.ctrlKey) return 'open';
    if (this.F10_OWNERS.includes(activeId)) return null;
    return 'open';
  }

  onKey(e) {
    const active = window.winManager ? window.winManager.activeWindowId : '';
    if (this.hotkeyAction(e, active, this.isBooting()) !== 'open') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    this.open();
  }

  reproId() {
    const m = /[?&]bug=(BR-\d{6}-[0-9A-HJKMNP-TV-Z]{4})(?:&|$)/.exec(location.search);
    return m ? m[1] : '';
  }

  async gunzip(base64) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }

  async startRepro(id) {
    window.bugRepro = { id, ready: false, opened: '' };
    if (sessionStorage.getItem('win98.repro') !== id) {
      const res = await fetch('/api/bugs/repro/' + id, { cache: 'no-store' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'HTTP ' + res.status);
      sessionStorage.setItem('win98.repro', id);
      sessionStorage.setItem('win98.repro.report', JSON.stringify(data.report));
      if (data.save && window.BackupStore) {
        const archive = JSON.parse(await this.gunzip(data.save));
        sessionStorage.setItem('win98.repro.keys', JSON.stringify(Object.keys((archive.data && archive.data.ls) || {})));
        if (archive.live) sessionStorage.setItem('win98.repro.live', JSON.stringify(archive.live));
        const done = await window.BackupStore.restore(archive, archive.components || []);
        if (done.ok) {
          window.BackupStore.reboot();
          return;
        }
      }
    }
    const report = JSON.parse(sessionStorage.getItem('win98.repro.report') || '{}');
    document.title = 'REPRO ' + id + ' — ' + ((report.user && report.user.title) || '');
    while (this.isBooting()) await new Promise(r => setTimeout(r, 300));
    await new Promise(r => setTimeout(r, 1500));
    const keys = JSON.parse(sessionStorage.getItem('win98.repro.keys') || '[]');
    window.bugRepro.restored = keys.filter(k => localStorage.getItem(k) != null);
    window.bugRepro.missing = keys.filter(k => localStorage.getItem(k) == null);
    window.bugRepro.opened = this.openReproTarget(report);
    const live = JSON.parse(sessionStorage.getItem('win98.repro.live') || 'null');
    if (live && window.BugWhere) {
      await new Promise(r => setTimeout(r, 500));
      window.bugRepro.live = window.BugWhere.applyLive(window.bugRepro.opened, live);
    }
    window.bugRepro.ready = true;
  }

  openReproTarget(report) {
    const where = report.where || {};
    const id = where.window || (where.app === 'hsr98' ? 'app_hsr98' : '');
    const details = (report.apps && report.apps[where.app]) || {};
    if (!id) return '';
    if (id === 'app_ie' && window.appIE) window.appIE.open(details.url || undefined);
    else if (id === 'app_netscape' && window.appNetscape) window.appNetscape.open(details.url || undefined);
    else if (id === 'app_explorer' && window.appExplorer) window.appExplorer.open(details.path ? details.path.split('\\') : undefined);
    else if (id.startsWith('app_')) {
      const base = id.slice(4);
      const app = window['app' + base.charAt(0).toUpperCase() + base.slice(1)];
      if (!app || typeof app.open !== 'function') return '';
      app.open();
    } else return '';
    if (window.BugTrace) window.BugTrace.note('repro opened ' + id);
    return id;
  }

  readSent() {
    try {
      const list = JSON.parse(localStorage.getItem(this.SENT_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  writeSent(list) {
    try {
      localStorage.setItem(this.SENT_KEY, JSON.stringify(list.slice(0, this.MAX_SENT)));
    } catch (err) {}
  }

  unseenCount(list) {
    return (list || this.readSent()).filter(r => r.status !== r.seen).length;
  }

  statusText(r) {
    switch (r.status) {
      case 'queued': return this.L('В очереди', 'Queued');
      case 'rejected': return this.L('Не принят сервером', 'Rejected by the server');
      case 'dropped': return this.L('Не отправлен', 'Not sent');
      case 'file': return this.L('Сохранён в файл', 'Saved to a file');
      case 'local': return this.L('Сохранён локально', 'Saved locally');
      case 'accepted': return this.L('Принят', 'Accepted');
      case 'fixed': return r.fixedIn === 'next' ? this.L('Исправлен, будет в следующем обновлении', 'Fixed, coming in the next update') : r.fixedIn ? this.L('Исправлен в версии ', 'Fixed in version ') + r.fixedIn : this.L('Исправлен', 'Fixed');
      case 'duplicate': return this.L('Уже известен', 'Already known');
      case 'notabug': return this.L('Не ошибка', 'Not a bug');
      case 'wontfix': return this.L('Не будет исправлен', "Won't be fixed");
      default: return this.L('Получен', 'Received');
    }
  }

  kindOptions() {
    return [
      ['bug', this.L('Не работает', 'Something does not work')],
      ['crash', this.L('Зависло или закрылось', 'Froze or closed')],
      ['visual', this.L('Графика', 'Graphics')],
      ['text', this.L('Текст или перевод', 'Text or translation')],
      ['sound', this.L('Звук', 'Sound')],
      ['balance', this.L('Баланс', 'Balance')],
      ['idea', this.L('Идея', 'Idea')]
    ];
  }

  repeatOptions() {
    return [
      ['always', this.L('Всегда', 'Always')],
      ['sometimes', this.L('Иногда', 'Sometimes')],
      ['once', this.L('Один раз', 'Once')],
      ['unknown', this.L('Не проверял', 'Did not check')]
    ];
  }

  async open(opts) {
    const wm = window.winManager;
    if (wm.windows.has(this.WIN_ID)) {
      wm.createWindow({ id: this.WIN_ID });
      return;
    }
    if (this.opening || !window.BugReport || !window.BugShot) return;
    this.opening = true;
    document.body.classList.add('br-capturing');
    try {
      const focusId = wm.activeWindowId && ![this.LIST_ID, this.MARKS_ID].includes(wm.activeWindowId) ? wm.activeWindowId : '';
      const focusWin = focusId ? wm.windows.get(focusId) : null;
      const r = focusWin && !focusWin.isMinimized ? focusWin.element.getBoundingClientRect() : null;
      const shot = await window.BugShot.capture();
      const where = window.BugWhere ? window.BugWhere.describe(focusId) : null;
      const apps = where && (where.details || where.state) ? { [where.app || 'desktop']: Object.assign({}, where.details, where.state ? { state: where.state } : {}) } : {};
      const report = await window.BugReport.build({ where: where ? { summary: where.summary, window: where.window, app: where.app } : undefined, apps });
      const comp = window.BugWhere ? window.BugWhere.saveComponent(focusId) : null;
      this.draft = {
        report,
        shot,
        focusRect: r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null,
        marks: [],
        hides: [],
        live: window.BugWhere ? window.BugWhere.liveSave(focusId) : null,
        save: comp ? { id: comp.id, name: window.BackupCatalog.nameOf(comp, this.ru), size: null, on: comp.id === 'game_hsr98' } : null
      };
    } finally {
      document.body.classList.remove('br-capturing');
      this.opening = false;
    }
    this.render();
    if (opts && opts.crash) this.presetCrash(opts.crash);
    if (this.draft.save) this.measureSave();
  }

  presetCrash(detail) {
    const kind = this.q('.br-kind');
    const title = this.q('.br-title');
    if (kind) kind.value = 'crash';
    if (title) {
      title.value = (this.L('Сбой: ', 'Crash: ') + (detail.msg || '')).slice(0, 200);
      title.dispatchEvent(new Event('input'));
    }
  }

  programOf(src) {
    const wm = window.winManager;
    const m = /js\/apps\/([\w-]+?)(?:-app)?(?:\/|\.js)/.exec(src || '');
    const seg = m ? m[1] : '';
    let id = '';
    if (seg && wm) {
      if (wm.windows.has('app_' + seg)) id = 'app_' + seg;
      else for (const k of wm.windows.keys()) if (k.includes(seg)) { id = k; break; }
    }
    if (!id && wm && wm.activeWindowId && wm.windows.has(wm.activeWindowId)) id = wm.activeWindowId;
    const win = id ? wm.windows.get(id) : null;
    return { key: seg || id || 'shell', id, name: win ? win.title : this.L('Оболочка Win 98', 'Win 98 shell') };
  }

  crashMuted() {
    try {
      const list = JSON.parse(localStorage.getItem(this.CRASH_MUTE_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  onCrash(detail) {
    const wm = window.winManager;
    if (!wm || this.isBooting() || this.crashCount >= 3) return false;
    if (/bugreport/.test(String(detail.src || '') + String(detail.stack || '').split('\n').slice(0, 3).join(' '))) return false;
    if (wm.windows.has(this.WIN_ID) || [...wm.windows.keys()].some(k => k.startsWith('dialog_') && wm.windows.get(k).brCrash)) return false;
    const prog = this.programOf(detail.src);
    if (this.crashMuted().includes(prog.key)) return false;
    if (Date.now() - (this.crashShown.get(prog.key) || 0) < 120000) return false;
    this.crashShown.set(prog.key, Date.now());
    this.crashCount++;
    this.showCrash(prog, detail);
    return true;
  }

  showCrash(prog, detail) {
    const wm = window.winManager;
    const L = (r, e) => this.L(r, e);
    let dlg = null;
    const mute = () => {
      const box = dlg && dlg.element && dlg.element.querySelector('.br-crash-mute');
      if (!box || !box.checked) return;
      const list = this.crashMuted();
      if (!list.includes(prog.key)) list.push(prog.key);
      try { localStorage.setItem(this.CRASH_MUTE_KEY, JSON.stringify(list)); } catch (err) {}
    };
    const buttons = [{
      text: L('Отправить отчёт...', 'Send Report...'),
      primary: true,
      onClick: () => {
        mute();
        setTimeout(() => {
          if (prog.id && wm.windows.has(prog.id)) {
            const w = wm.windows.get(prog.id);
            if (w.isMinimized) wm.restoreWindow(prog.id);
            wm.bringToTop(prog.id);
          }
          this.open({ crash: detail });
        }, 60);
      }
    }];
    if (prog.id) buttons.push({ text: L('Закрыть программу', 'Close Program'), onClick: () => { mute(); setTimeout(() => wm.closeWindow(prog.id), 0); } });
    buttons.push({ text: L('Продолжить', 'Continue'), onClick: mute });
    dlg = wm.openDialog({
      title: prog.name,
      icon: 'error',
      width: 440,
      message: L('Программа', 'The program') + ' «' + this.esc(prog.name) + '» ' + L('выполнила недопустимую операцию и, возможно, будет закрыта.', 'has performed an illegal operation and may be shut down.') +
        '<br><br>' + L('Если ошибка мешает, отправьте отчёт разработчику: снимок экрана и подробности приложатся сами.', 'If the error gets in the way, send a report to the developer: the screenshot and details are attached automatically.') +
        '<div class="br-crash-detail">' + this.esc(detail.msg) + (detail.src ? '<br>' + this.esc(detail.src) : '') + '</div>' +
        '<label class="br-crash-mute-row"><input type="checkbox" class="br-crash-mute"> ' + L('Не показывать для этой программы', 'Do not show for this program') + '</label>',
      buttons
    });
    if (dlg) dlg.brCrash = true;
    if (this.crashCount === 1 && window.clippySystem && typeof window.clippySystem.onAppCrashed === 'function') setTimeout(() => window.clippySystem.onAppCrashed(prog.name), 1500);
    return dlg;
  }


  render() {
    const L = (r, e) => this.L(r, e);
    const d = this.draft;
    const sent = this.readSent();
    const unseen = this.unseenCount(sent);
    const noticed = localStorage.getItem(this.NOTICE_KEY) === '1';
    const opts = list => list.map(([v, t]) => `<option value="${v}">${this.esc(t)}</option>`).join('');
    const shotNote = d.shot.canvas ? '' : `<div class="br-shot-missing">${L('Кадр не получился', 'No screenshot')}<br><small>${this.esc(d.shot.error)}</small></div>`;
    this.win = window.winManager.createWindow({
      id: this.WIN_ID,
      title: L('Сообщение об ошибке', 'Report a Problem'),
      icon: 'bugreport',
      width: 572,
      height: 486,
      resizable: false,
      maximizable: false,
      content: `
        <div class="br-app">
          <div class="br-top">
            <div class="br-shot-col">
              <div class="br-shot">${shotNote}<canvas class="br-thumb" width="240" height="180"></canvas></div>
              <div class="br-shot-tools">
                <button class="win-btn br-mark"${d.shot.canvas ? '' : ' disabled'}>${L('Пометить', 'Mark')}</button>
                <button class="win-btn br-hide"${d.shot.canvas ? '' : ' disabled'}>${L('Скрыть', 'Hide')}</button>
                <button class="win-btn br-retake">${L('Переснять', 'Retake')}</button>
              </div>
            </div>
            <div class="br-info">
              <div class="br-label">${L('Где:', 'Where:')}</div>
              <div class="br-where">${this.esc(d.report.where.summary)}</div>
              <label class="br-label" for="br-title">${L('Что случилось?', 'What happened?')} <span class="br-req">*</span></label>
              <input id="br-title" type="text" class="win-input br-title" maxlength="200">
              <div class="br-row">
                <label class="br-label">${L('Тип:', 'Type:')} <select class="win-select br-kind">${opts(this.kindOptions())}</select></label>
                <label class="br-label">${L('Повторяется:', 'Happens:')} <select class="win-select br-repeat">${opts(this.repeatOptions())}</select></label>
              </div>
            </div>
          </div>
          <label class="br-label" for="br-text">${L('Подробности (что делали, что ожидали):', 'Details (what you did, what you expected):')}</label>
          <textarea id="br-text" class="win-input br-text" maxlength="4000"></textarea>
          <button class="br-toggle" type="button">▸ ${L('Что будет отправлено', 'What will be sent')} (<span class="br-count"></span>)</button>
          <div class="br-list" hidden>
            <label><input type="checkbox" data-part="shot"${d.shot.canvas ? ' checked' : ' disabled'}> ${L('Снимок экрана', 'Screenshot')}</label>
            <label><input type="checkbox" data-part="system" checked disabled> ${L('Сведения о системе и окнах', 'System and window details')}</label>
            <label><input type="checkbox" data-part="log" checked> ${L('Журнал ошибок', 'Error log')} (${d.report.errors.length + d.report.missing.length})</label>
            <label><input type="checkbox" data-part="trail" checked> ${L('Последние действия (без набранного текста)', 'Recent actions (no typed text)')}</label>
            ${d.save ? `<label><input type="checkbox" data-part="save"${d.save.on ? ' checked' : ''}> ${L('Сохранение', 'Save data')}: ${this.esc(d.save.name)} <span class="br-save-size"></span></label>` : ''}
            <button class="win-btn br-show">${L('Показать данные', 'Show data')}</button>
          </div>
          <div class="br-row br-contact-row">
            <label class="br-label" for="br-contact">${L('Как с вами связаться (необязательно):', 'How to reach you (optional):')}</label>
            <input id="br-contact" type="text" class="win-input br-contact" maxlength="200">
          </div>
          <div class="br-notice"${noticed ? ' hidden' : ''}>${L('Отчёт получит разработчик на pennygachi.men. Пароли и набранный текст не отправляются.', 'The report goes to the developer at pennygachi.men. Passwords and typed text are not sent.')}</div>
          <div class="br-status" hidden></div>
          <div class="br-buttons">
            <button class="win-btn br-list-btn${unseen ? ' br-unseen' : ''}">${L('Мои отчёты', 'My reports')} (${sent.length})</button>
            <button class="win-btn br-file">${L('В файл...', 'To file...')}</button>
            <span class="br-spacer"></span>
            <button class="win-btn is-default br-send" disabled>${L('Отправить', 'Send')}</button>
            <button class="win-btn br-cancel">${L('Отмена', 'Cancel')}</button>
          </div>
        </div>`,
      onClose: () => { this.draft = null; window.winManager.closeWindow(this.MARKS_ID); }
    });
    this.bind();
  }

  q(sel) {
    const win = window.winManager.windows.get(this.WIN_ID);
    return win ? win.element.querySelector(sel) : null;
  }

  bind() {
    const title = this.q('.br-title');
    const send = this.q('.br-send');
    const update = () => { send.disabled = this.busy || !title.value.trim(); };
    title.addEventListener('input', update);
    this.q('.br-toggle').addEventListener('click', () => {
      const list = this.q('.br-list');
      list.hidden = !list.hidden;
      this.q('.br-toggle').firstChild.nodeValue = (list.hidden ? '▸ ' : '▾ ') + this.L('Что будет отправлено', 'What will be sent') + ' (';
    });
    this.q('.br-list').addEventListener('change', () => this.updateCount());
    this.q('.br-mark').addEventListener('click', () => this.openMarks('mark'));
    this.q('.br-hide').addEventListener('click', () => this.openMarks('hide'));
    this.q('.br-retake').addEventListener('click', () => this.retake());
    this.q('.br-show').addEventListener('click', () => this.showData());
    this.q('.br-list-btn').addEventListener('click', () => this.openList());
    this.q('.br-file').addEventListener('click', () => this.saveToFile());
    send.addEventListener('click', () => this.send());
    this.q('.br-cancel').addEventListener('click', () => this.cancel());
    this.q('.br-app').addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        if (!send.disabled) this.send();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.cancel();
      }
    });
    this.drawThumb();
    this.updateCount();
    setTimeout(() => title.focus(), 0);
  }

  updateCount() {
    const boxes = Array.from(this.q('.br-list').querySelectorAll('input[type=checkbox]'));
    this.q('.br-count').textContent = boxes.filter(b => b.checked).length;
  }

  part(name) {
    const box = this.q(`.br-list input[data-part="${name}"]`);
    return !!(box && box.checked && !box.disabled) || name === 'system';
  }

  drawThumb() {
    const c = this.q('.br-thumb');
    const shot = this.draft && this.draft.shot.canvas;
    if (!c) return;
    const g = c.getContext('2d');
    g.fillStyle = '#808080';
    g.fillRect(0, 0, c.width, c.height);
    if (!shot) {
      c.hidden = true;
      return;
    }
    c.hidden = false;
    const k = Math.min(c.width / shot.width, c.height / shot.height);
    const w = shot.width * k;
    const h = shot.height * k;
    const x = (c.width - w) / 2;
    const y = (c.height - h) / 2;
    g.imageSmoothingEnabled = true;
    g.drawImage(shot, x, y, w, h);
    g.fillStyle = '#000';
    this.draft.hides.forEach(r => g.fillRect(x + r.x * k, y + r.y * k, r.w * k, r.h * k));
    g.strokeStyle = '#f00';
    g.lineWidth = 2;
    this.draft.marks.forEach(r => g.strokeRect(x + r.x * k, y + r.y * k, r.w * k, r.h * k));
  }

  openMarks(mode) {
    const d = this.draft;
    if (!d || !d.shot.canvas) return;
    const shot = d.shot.canvas;
    const k = Math.min(1, 760 / shot.width, 500 / shot.height);
    const cw = Math.round(shot.width * k);
    const ch = Math.round(shot.height * k);
    let current = mode;
    const marks = d.marks.slice();
    const hides = d.hides.slice();
    const history = [];
    const L = (r, e) => this.L(r, e);
    window.winManager.closeWindow(this.MARKS_ID);
    const win = window.winManager.createWindow({
      id: this.MARKS_ID,
      title: L('Пометки на снимке', 'Screenshot marks'),
      icon: 'bugreport',
      width: cw + 24,
      height: ch + 92,
      resizable: false,
      maximizable: false,
      content: `
        <div class="br-marks">
          <div class="br-marks-bar">
            <label><input type="radio" name="br-mode" value="mark"${mode === 'mark' ? ' checked' : ''}> ${L('Красная рамка — где ошибка', 'Red frame: where the problem is')}</label>
            <label><input type="radio" name="br-mode" value="hide"${mode === 'hide' ? ' checked' : ''}> ${L('Чёрный прямоугольник — скрыть', 'Black box: hide')}</label>
          </div>
          <canvas class="br-marks-canvas" width="${cw}" height="${ch}"></canvas>
          <div class="br-buttons">
            <button class="win-btn br-undo">${L('Отменить', 'Undo')}</button>
            <button class="win-btn br-clear">${L('Очистить', 'Clear')}</button>
            <span class="br-spacer"></span>
            <button class="win-btn is-default br-ok">OK</button>
            <button class="win-btn br-marks-cancel">${L('Отмена', 'Cancel')}</button>
          </div>
        </div>`
    });
    const root = win.element;
    const canvas = root.querySelector('.br-marks-canvas');
    const g = canvas.getContext('2d');
    let drag = null;
    const paint = () => {
      g.drawImage(shot, 0, 0, cw, ch);
      g.fillStyle = '#000';
      hides.forEach(r => g.fillRect(r.x * k, r.y * k, r.w * k, r.h * k));
      g.strokeStyle = '#f00';
      g.lineWidth = 2;
      marks.forEach(r => g.strokeRect(r.x * k, r.y * k, r.w * k, r.h * k));
      if (drag && drag.w && drag.h) {
        g.setLineDash([4, 3]);
        g.strokeStyle = current === 'hide' ? '#000' : '#f00';
        g.strokeRect(drag.x, drag.y, drag.w, drag.h);
        g.setLineDash([]);
      }
    };
    const point = e => {
      const r = canvas.getBoundingClientRect();
      return { x: Math.max(0, Math.min(cw, e.clientX - r.left)), y: Math.max(0, Math.min(ch, e.clientY - r.top)) };
    };
    canvas.addEventListener('pointerdown', e => {
      const p = point(e);
      drag = { sx: p.x, sy: p.y, x: p.x, y: p.y, w: 0, h: 0 };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!drag) return;
      const p = point(e);
      drag.x = Math.min(drag.sx, p.x);
      drag.y = Math.min(drag.sy, p.y);
      drag.w = Math.abs(p.x - drag.sx);
      drag.h = Math.abs(p.y - drag.sy);
      paint();
    });
    canvas.addEventListener('pointerup', () => {
      if (drag && drag.w >= 4 && drag.h >= 4) {
        const rect = { x: Math.round(drag.x / k), y: Math.round(drag.y / k), w: Math.round(drag.w / k), h: Math.round(drag.h / k) };
        (current === 'hide' ? hides : marks).push(rect);
        history.push(current);
      }
      drag = null;
      paint();
    });
    root.querySelectorAll('input[name="br-mode"]').forEach(r => r.addEventListener('change', () => { current = r.value; }));
    root.querySelector('.br-undo').addEventListener('click', () => {
      const last = history.pop();
      if (last) (last === 'hide' ? hides : marks).pop();
      paint();
    });
    root.querySelector('.br-clear').addEventListener('click', () => {
      marks.length = 0;
      hides.length = 0;
      history.length = 0;
      paint();
    });
    root.querySelector('.br-ok').addEventListener('click', () => {
      if (this.draft) {
        this.draft.marks = marks;
        this.draft.hides = hides;
        this.drawThumb();
      }
      window.winManager.closeWindow(this.MARKS_ID);
    });
    root.querySelector('.br-marks-cancel').addEventListener('click', () => window.winManager.closeWindow(this.MARKS_ID));
    paint();
  }

  nextFrame() {
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }

  async retake() {
    const win = window.winManager.windows.get(this.WIN_ID);
    if (!win || !this.draft || this.busy) return;
    window.winManager.closeWindow(this.MARKS_ID);
    win.element.style.visibility = 'hidden';
    await this.nextFrame();
    try {
      this.draft.shot = await window.BugShot.capture();
      this.draft.marks = [];
      this.draft.hides = [];
    } finally {
      win.element.style.visibility = '';
    }
    const box = this.q('.br-list input[data-part="shot"]');
    if (box) {
      box.disabled = !this.draft.shot.canvas;
      box.checked = !!this.draft.shot.canvas;
    }
    ['.br-mark', '.br-hide'].forEach(s => { this.q(s).disabled = !this.draft.shot.canvas; });
    const missing = this.q('.br-shot-missing');
    if (missing) missing.remove();
    this.drawThumb();
    this.updateCount();
  }

  async measureSave() {
    const d = this.draft;
    try {
      const archive = await window.BackupStore.snapshot([d.save.id]);
      if (this.draft !== d) return;
      d.save.archive = archive;
      d.save.size = archive.size + (d.live ? JSON.stringify(d.live).length : 0);
      const el = this.q('.br-save-size');
      if (el) el.textContent = '(' + this.size(d.save.size) + (d.live ? this.L(', с текущим состоянием', ', with the current state') : '') + ')';
    } catch (err) {
      const box = this.q('.br-list input[data-part="save"]');
      if (box) {
        box.checked = false;
        box.disabled = true;
      }
    }
  }

  async gzip(text) {
    if (typeof CompressionStream !== 'function') return null;
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Response(stream).blob();
  }

  async collect() {
    const d = this.draft;
    const report = JSON.parse(JSON.stringify(d.report));
    report.user = {
      title: this.q('.br-title').value.trim(),
      text: this.q('.br-text').value.trim(),
      kind: this.q('.br-kind').value,
      repeat: this.q('.br-repeat').value,
      contact: this.q('.br-contact').value.trim()
    };
    if (!this.part('log')) {
      report.errors = [];
      report.missing = [];
      report.log = [];
    }
    if (!this.part('trail')) report.trail = [];
    const files = {};
    if (this.part('shot') && d.shot.canvas) {
      const enc = await window.BugShot.encode(d.shot, { hides: d.hides, marks: d.marks, focus: d.focusRect });
      Object.assign(files, enc.files);
      Object.assign(report.attach, enc.attach);
    } else if (d.shot.error) {
      report.attach.shotError = d.shot.error;
    }
    if (this.part('save') && d.save) {
      const archive = Object.assign({}, d.save.archive || await window.BackupStore.snapshot([d.save.id]));
      if (d.live) archive.live = d.live;
      const gz = await this.gzip(JSON.stringify(archive));
      if (gz && gz.size <= this.MAX_SAVE_BYTES) {
        files['save.json.gz'] = gz;
        report.attach.save = 'save.json.gz';
        report.attach.saveComponent = d.save.id;
        if (d.live) report.attach.live = Object.keys(d.live);
      } else {
        report.attach.saveSkipped = gz ? 'too large: ' + gz.size : 'no gzip';
      }
    }
    return { report, files };
  }

  setBusy(on, text) {
    this.busy = on;
    const status = this.q('.br-status');
    if (status) {
      status.hidden = !text;
      status.innerHTML = text || '';
    }
    ['.br-send', '.br-file', '.br-cancel', '.br-retake', '.br-mark', '.br-hide'].forEach(s => {
      const el = this.q(s);
      if (el) el.disabled = on || ((s === '.br-mark' || s === '.br-hide') && !(this.draft && this.draft.shot.canvas)) || (s === '.br-send' && !this.q('.br-title').value.trim());
    });
  }

  thumbData() {
    const shot = this.draft && this.draft.shot.canvas;
    if (!shot) return '';
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 72;
    const g = c.getContext('2d');
    const k = Math.min(96 / shot.width, 72 / shot.height);
    g.fillStyle = '#808080';
    g.fillRect(0, 0, 96, 72);
    g.drawImage(shot, (96 - shot.width * k) / 2, (72 - shot.height * k) / 2, shot.width * k, shot.height * k);
    g.fillStyle = '#000';
    this.draft.hides.forEach(r => g.fillRect((96 - shot.width * k) / 2 + r.x * k, (72 - shot.height * k) / 2 + r.y * k, r.w * k, r.h * k));
    try {
      return c.toDataURL('image/jpeg', 0.6);
    } catch (err) {
      return '';
    }
  }

  remember(report, status) {
    const list = this.readSent().filter(r => r.id !== report.id);
    list.unshift({ id: report.id, at: report.created, title: report.user.title, where: report.where.summary, thumb: this.thumbData(), status, seen: status });
    this.writeSent(list);
    try { localStorage.setItem(this.NOTICE_KEY, '1'); } catch (err) {}
  }

  async send() {
    if (this.busy || !this.draft) return;
    const L = (r, e) => this.L(r, e);
    this.setBusy(true, `<span class="br-progress"></span>${L('Отправка отчёта...', 'Sending the report...')}`);
    let pack = null;
    try {
      pack = await this.collect();
      let res;
      try {
        res = await window.BugReport.send(pack.report, pack.files);
      } catch (err) {
        if (err.status !== 409) throw err;
        pack.report.id = window.BugReport.newId();
        res = await window.BugReport.send(pack.report, pack.files);
      }
      this.remember(pack.report, res.local ? 'local' : 'received');
      this.done(pack.report.id, false, res.local);
    } catch (err) {
      if (pack && window.BugReport.shouldQueue(err)) {
        try {
          await window.BugReport.queue(pack.report, pack.files);
          this.remember(pack.report, 'queued');
          this.done(pack.report.id, true);
          return;
        } catch (queueErr) {}
      }
      this.setBusy(false, this.failText(err));
    }
  }

  onQueueEvent(type, detail) {
    const list = this.readSent();
    const item = list.find(r => r.id === detail.id);
    if (!item) return;
    if (type === 'bugreport-sent') item.status = detail.local ? 'local' : 'received';
    else if (type === 'bugreport-rejected') {
      item.status = 'rejected';
      item.note = detail.error || '';
    } else item.status = 'dropped';
    this.writeSent(list);
    this.paintList();
  }

  failText(err) {
    const L = (r, e) => this.L(r, e);
    if (!err.status) return `<b>${L('Сервер не ответил.', 'The server did not answer.')}</b> ${L('Сохраните отчёт кнопкой «В файл...» и отправьте позже.', 'Save the report with "To file..." and send it later.')}`;
    if (err.status === 507) return `<b>${L('Сервер переполнен.', 'The server is full.')}</b> ${L('Сохраните отчёт в файл.', 'Save the report to a file.')}`;
    if (err.status === 413) return `<b>${L('Отчёт слишком большой.', 'The report is too large.')}</b> ${L('Снимите галочку «Сохранение» и попробуйте ещё раз.', 'Untick "Save data" and try again.')}`;
    if (err.status === 429) return `<b>${L('Слишком много отчётов за час.', 'Too many reports this hour.')}</b> ${L('Попробуйте позже или сохраните отчёт в файл.', 'Try later or save the report to a file.')}`;
    return `<b>${L('Сервер отказал', 'The server refused')}:</b> ${this.esc(err.message)}. ${L('Сохраните отчёт в файл.', 'Save the report to a file.')}`;
  }

  done(id, queued, local) {
    const L = (r, e) => this.L(r, e);
    const app = this.q('.br-app');
    if (!app) return;
    this.busy = false;
    app.innerHTML = `
      <div class="br-done">
        <div class="br-done-icon">${Icons['bugreport']}</div>
        <div>
          <div class="br-done-title">${queued ? L('Сервер не ответил. Отчёт сохранён.', 'The server did not answer. The report is saved.') : local ? L('Отчёт сохранён в папке проекта.', 'The report is saved in the project folder.') : L('Отчёт отправлен. Спасибо!', 'Report sent. Thank you!')}</div>
          <div>${L('Номер отчёта:', 'Report number:')} <b class="br-done-id">${this.esc(id)}</b></div>
          <div class="br-done-hint">${queued ? L('Он уйдёт сам при следующем запуске, когда появится связь.', 'It will be sent by itself on the next start when the connection is back.') : local ? L('Система запущена из папки проекта, поэтому отчёт лежит в bugreports\\', 'The system runs from the project folder, so the report is in bugreports\\') + this.esc(id) + L(' и не уходит на сервер и в Telegram.', ' and does not go to the server or Telegram.') : L('Статус можно посмотреть в «Моих отчётах».', 'You can follow it in "My reports".')}</div>
        </div>
      </div>
      <div class="br-buttons">
        <button class="win-btn br-copy">${L('Копировать номер', 'Copy number')}</button>
        <button class="win-btn br-list-btn">${L('Мои отчёты', 'My reports')}</button>
        <span class="br-spacer"></span>
        <button class="win-btn is-default br-close">OK</button>
      </div>`;
    app.querySelector('.br-copy').addEventListener('click', () => {
      if (navigator.clipboard) navigator.clipboard.writeText(id).catch(() => {});
    });
    app.querySelector('.br-list-btn').addEventListener('click', () => { window.winManager.closeWindow(this.WIN_ID); this.openList(); });
    const close = app.querySelector('.br-close');
    close.addEventListener('click', () => window.winManager.closeWindow(this.WIN_ID));
    setTimeout(() => close.focus(), 0);
  }

  async saveToFile() {
    if (this.busy || !this.draft) return;
    this.setBusy(true, this.L('Подготовка файла...', 'Preparing the file...'));
    try {
      const pack = await this.collect();
      const data = await window.BugReport.pack(pack.report, pack.files);
      const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pack.report.id + '.bugreport.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      this.remember(pack.report, 'file');
      this.setBusy(false, this.L('Файл сохранён: ', 'File saved: ') + '<b>' + this.esc(a.download) + '</b>');
    } catch (err) {
      this.setBusy(false, this.esc(err.message || err));
    }
  }

  async showData() {
    if (!this.draft) return;
    const pack = await this.collect();
    const text = JSON.stringify(pack.report, null, 2) + '\r\n\r\n' + Object.entries(pack.files).map(([n, b]) => n + ': ' + this.size(b.size)).join('\r\n');
    if (window.appNotepad) window.appNotepad.open(pack.report.id + '.json', text);
  }

  cancel() {
    if (this.busy) return;
    const typed = this.q('.br-title').value.trim() || this.q('.br-text').value.trim();
    if (!typed) {
      window.winManager.closeWindow(this.WIN_ID);
      return;
    }
    window.winManager.openDialog({
      title: this.L('Сообщение об ошибке', 'Report a Problem'),
      icon: 'question',
      message: this.L('Отменить отчёт? Введённый текст пропадёт.', 'Cancel the report? The text you typed will be lost.'),
      buttons: [{ text: 'Yes', primary: true, onClick: () => window.winManager.closeWindow(this.WIN_ID) }, { text: 'No' }]
    });
  }

  async refreshStatuses(list) {
    const remote = list.filter(r => !['file', 'local', 'queued', 'rejected', 'dropped'].includes(r.status));
    if (!remote.length) return { ok: true, changed: [] };
    try {
      const items = await window.BugReport.statuses(remote.map(r => r.id));
      const changed = [];
      list.forEach(r => {
        const s = items[r.id];
        if (!s) return;
        const status = s.status === 'new' ? 'received' : s.status;
        if (status !== r.status || s.fixedIn !== r.fixedIn || s.note !== r.note) {
          r.status = status;
          r.fixedIn = s.fixedIn || '';
          r.note = s.note || '';
          changed.push(r);
        }
      });
      this.writeSent(list);
      try { localStorage.setItem(this.CHECKED_KEY, String(Date.now())); } catch (err) {}
      return { ok: true, changed };
    } catch (err) {
      return { ok: false, changed: [] };
    }
  }

  async checkInBackground() {
    const last = Number(localStorage.getItem(this.CHECKED_KEY) || 0);
    if (Date.now() - last < 24 * 3600 * 1000) return;
    const list = this.readSent();
    if (!list.length) return;
    const res = await this.refreshStatuses(list);
    if (res.ok && res.changed.some(r => r.status === 'fixed')) this.showTray();
  }

  showTray() {
    const tb = window.taskbar;
    if (!tb || !tb.trayEl || this.trayEl) return;
    const el = document.createElement('div');
    el.className = 'tray-icon br-tray';
    el.innerHTML = Icons['bugreport'];
    el.title = this.L('Ваш отчёт об ошибке исправлен', 'Your problem report was fixed');
    el.addEventListener('click', () => this.openList());
    tb.trayEl.insertBefore(el, tb.clockEl);
    this.trayEl = el;
  }

  hideTray() {
    if (this.trayEl) this.trayEl.remove();
    this.trayEl = null;
  }

  openList() {
    const wm = window.winManager;
    this.hideTray();
    if (wm.windows.has(this.LIST_ID)) {
      wm.createWindow({ id: this.LIST_ID });
      return;
    }
    const L = (r, e) => this.L(r, e);
    wm.createWindow({
      id: this.LIST_ID,
      title: L('Мои отчёты об ошибках', 'My Problem Reports'),
      icon: 'bugreport',
      width: 660,
      height: 380,
      minWidth: 520,
      minHeight: 300,
      content: `
        <div class="br-reports">
          <div class="br-reports-main">
            <div class="br-table-wrap win-inset">
              <table class="br-table">
                <colgroup><col class="br-col-id"><col><col class="br-col-date"><col class="br-col-status"></colgroup>
                <thead><tr><th>${L('Номер', 'Number')}</th><th>${L('Что случилось', 'What happened')}</th><th>${L('Дата', 'Date')}</th><th>${L('Статус', 'Status')}</th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
            <div class="br-preview"></div>
          </div>
          <div class="br-reports-status"></div>
          <div class="br-buttons">
            <button class="win-btn br-refresh">${L('Обновить', 'Refresh')}</button>
            <button class="win-btn br-forget" disabled>${L('Убрать из списка', 'Remove from list')}</button>
            <span class="br-spacer"></span>
            <button class="win-btn br-new">${L('Новый отчёт...', 'New report...')}</button>
            <button class="win-btn is-default br-close">${L('Закрыть', 'Close')}</button>
          </div>
        </div>`
    });
    const root = wm.windows.get(this.LIST_ID).element;
    root.querySelector('.br-refresh').addEventListener('click', () => this.refreshList(true));
    root.querySelector('.br-forget').addEventListener('click', () => {
      const id = this.listSelected;
      if (!id) return;
      this.writeSent(this.readSent().filter(r => r.id !== id));
      this.listSelected = null;
      this.paintList();
    });
    root.querySelector('.br-new').addEventListener('click', () => { wm.closeWindow(this.LIST_ID); this.open(); });
    root.querySelector('.br-close').addEventListener('click', () => wm.closeWindow(this.LIST_ID));
    this.listSelected = null;
    this.paintList();
    this.refreshList(false);
  }

  async refreshList(force) {
    const root = window.winManager.windows.get(this.LIST_ID);
    if (!root) return;
    const status = root.element.querySelector('.br-reports-status');
    const list = this.readSent();
    const last = Number(localStorage.getItem(this.CHECKED_KEY) || 0);
    if (!force && Date.now() - last < 10 * 60 * 1000) {
      status.textContent = last ? this.L('Статусы от ', 'Statuses from ') + this.date(new Date(last).toISOString()) : '';
      return;
    }
    status.textContent = this.L('Проверка статусов...', 'Checking statuses...');
    const res = await this.refreshStatuses(list);
    if (!window.winManager.windows.has(this.LIST_ID)) return;
    const at = Number(localStorage.getItem(this.CHECKED_KEY) || 0);
    status.textContent = res.ok
      ? this.L('Статусы обновлены.', 'Statuses updated.')
      : this.L('Нет связи с сервером', 'No connection to the server') + (at ? this.L(', статусы от ', ', statuses from ') + this.date(new Date(at).toISOString()) : '') + '.';
    this.paintList();
  }

  paintList() {
    const win = window.winManager.windows.get(this.LIST_ID);
    if (!win) return;
    const root = win.element;
    const list = this.readSent();
    const body = root.querySelector('.br-table tbody');
    if (!list.length) {
      body.innerHTML = `<tr><td colspan="4" class="br-empty">${this.L('Вы ещё не отправляли отчётов. Нажмите F10 там, где заметили ошибку.', 'You have not sent any reports yet. Press F10 where you see a problem.')}</td></tr>`;
    } else {
      body.innerHTML = list.map(r => `
        <tr data-id="${this.esc(r.id)}" class="${r.id === this.listSelected ? 'is-selected' : ''}${r.status !== r.seen ? ' is-unseen' : ''}">
          <td>${this.esc(r.id)}</td><td>${this.esc(r.title)}</td><td>${this.esc(this.date(r.at))}</td><td>${this.esc(this.statusText(r))}</td>
        </tr>`).join('');
      body.querySelectorAll('tr[data-id]').forEach(tr => tr.addEventListener('click', () => {
        this.listSelected = tr.dataset.id;
        const all = this.readSent();
        const item = all.find(r => r.id === this.listSelected);
        if (item && item.seen !== item.status) {
          item.seen = item.status;
          this.writeSent(all);
        }
        this.paintList();
      }));
    }
    const item = list.find(r => r.id === this.listSelected);
    root.querySelector('.br-forget').disabled = !item;
    root.querySelector('.br-preview').innerHTML = item ? `
      ${item.thumb ? `<img class="br-preview-img" src="${item.thumb}" alt="">` : ''}
      <div class="br-preview-title">${this.esc(item.title)}</div>
      <div class="br-preview-where">${this.esc(item.where)}</div>
      <div class="br-preview-status"><b>${this.esc(this.statusText(item))}</b></div>
      ${item.note ? `<div class="br-preview-note">${this.esc(item.note)}</div>` : ''}` : `<div class="br-preview-empty">${this.L('Выберите отчёт в списке.', 'Pick a report in the list.')}</div>`;
  }
}

window.appBugReport = new AppBugReport();
