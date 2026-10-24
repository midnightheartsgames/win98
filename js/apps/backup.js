class AppBackup {
  constructor() {
    this.win = null;
    this.sizes = {};
    this.archives = [];
    this.loose = [];
    this.current = null;
    this.busy = false;
    this.tab = 'backup';
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
    if (!bytes) return this.L('0 КБ', '0 KB');
    const kb = Math.max(1, Math.ceil(bytes / 1024));
    if (kb < 1024) return kb.toLocaleString(this.ru ? 'ru-RU' : 'en-US') + this.L(' КБ', ' KB');
    return (kb / 1024).toLocaleString(this.ru ? 'ru-RU' : 'en-US', { maximumFractionDigits: 1 }) + this.L(' МБ', ' MB');
  }

  date(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString(this.ru ? 'ru-RU' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  defaultLabel(prefix) {
    return (prefix || this.L('Архив', 'Backup')) + ' ' + this.date(new Date().toISOString());
  }

  open(tab) {
    if (this.win && window.winManager.windows.has('app_backup')) {
      window.winManager.createWindow({ id: 'app_backup' });
      if (tab) this.showTab(tab);
      return;
    }
    const L = (r, e) => this.L(r, e);
    this.tab = tab || 'backup';
    this.win = window.winManager.createWindow({
      id: 'app_backup',
      title: L('Архивация данных', 'Backup'),
      icon: 'backup',
      width: 560,
      height: 540,
      minWidth: 520,
      minHeight: 470,
      content: `
        <div class="bk-app">
          <div class="win-tabs bk-tabs">
            <div class="win-tab" data-tab="backup">${L('Архивация', 'Backup')}</div>
            <div class="win-tab" data-tab="restore">${L('Восстановление', 'Restore')}</div>
            <div class="win-tab" data-tab="reset">${L('Сброс', 'Reset')}</div>
          </div>
          <div class="win-tab-panel bk-panel" data-panel="backup">
            <div class="bk-head">
              <div class="bk-head-icon">${Icons['backup']}</div>
              <div>${L('Отметьте, что сохранить. Архив можно оставить на диске C: или записать в файл и перенести на другой компьютер.', 'Tick what to save. Keep the backup on drive C: or write it to a file to move it to another computer.')}</div>
            </div>
            <div class="bk-label">${L('Что архивировать:', 'What to back up:')}</div>
            <div class="bk-tree" data-tree="backup"></div>
            <div class="bk-row-line">
              <button class="win-btn bk-all">${L('Выделить все', 'Select All')}</button>
              <button class="win-btn bk-none">${L('Снять выделение', 'Clear All')}</button>
              <span class="bk-total"></span>
            </div>
            <fieldset class="bk-where">
              <legend>${L('Куда', 'Where to')}</legend>
              <label><input type="radio" name="bk-target" value="store" checked> ${L('Хранилище архивов на диске C:', 'Backup storage on drive C:')}</label>
              <label><input type="radio" name="bk-target" value="file"> ${L('Файл для переноса на другой компьютер (*.bkf)', 'File to move to another computer (*.bkf)')}</label>
              <div class="bk-name-line">${L('Имя архива:', 'Backup name:')} <input type="text" class="win-input bk-name" maxlength="60"></div>
            </fieldset>
            <div class="bk-actions"><button class="win-btn is-default bk-start">${L('Начать архивацию', 'Start Backup')}</button></div>
          </div>
          <div class="win-tab-panel bk-panel" data-panel="restore">
            <div class="bk-row-line bk-row-top">
              <span class="bk-label">${L('Архивы:', 'Backups:')}</span>
              <span class="bk-grow"></span>
              <button class="win-btn bk-open-file">${L('Открыть файл...', 'Open File...')}</button>
            </div>
            <div class="bk-list">
              <div class="bk-list-head"><span>${L('Название', 'Name')}</span><span>${L('Создан', 'Created')}</span><span>${L('Размер', 'Size')}</span></div>
              <div class="bk-list-body"></div>
            </div>
            <div class="bk-row-line">
              <button class="win-btn bk-keep" disabled>${L('В хранилище', 'Keep')}</button>
              <button class="win-btn bk-export" disabled>${L('Сохранить в файл...', 'Save to File...')}</button>
              <button class="win-btn bk-rename" disabled>${L('Переименовать', 'Rename')}</button>
              <button class="win-btn bk-delete" disabled>${L('Удалить', 'Delete')}</button>
            </div>
            <div class="bk-label">${L('Что восстановить из архива:', 'What to restore:')}</div>
            <div class="bk-tree bk-tree-short" data-tree="restore"></div>
            <label class="bk-check"><input type="checkbox" class="bk-safety" checked> ${L('Перед восстановлением сохранить текущие данные в архив', 'Back up current data before restoring')}</label>
            <div class="bk-actions"><button class="win-btn is-default bk-restore" disabled>${L('Восстановить', 'Restore')}</button></div>
          </div>
          <div class="win-tab-panel bk-panel" data-panel="reset">
            <div class="bk-head">
              <div class="bk-head-icon">${Icons['warning']}</div>
              <div>${L('Сброс удаляет данные без возврата. Сначала программа может сохранить архив, из которого все можно будет восстановить.', 'Reset deletes data for good. The program can save a backup first, so everything can be restored later.')}</div>
            </div>
            <label class="bk-check"><input type="radio" name="bk-reset" value="all" checked> <b>${L('Вернуть Win 98 к первому запуску', 'Return Win 98 to its first start')}</b></label>
            <div class="bk-note">${L('Удаляются файлы, настройки, реестр, почта, установленные игры и все сохранения.', 'Files, settings, registry, mail, installed games and all saves are deleted.')}</div>
            <label class="bk-check"><input type="radio" name="bk-reset" value="some"> <b>${L('Удалить данные отдельных программ', 'Delete data of selected programs')}</b></label>
            <div class="bk-tree bk-tree-short" data-tree="reset"></div>
            <label class="bk-check"><input type="checkbox" class="bk-reset-safety" checked> ${L('Перед сбросом сохранить архив удаляемых данных', 'Back up the deleted data first')}</label>
            <label class="bk-check"><input type="checkbox" class="bk-reset-archives"> ${L('Удалить и хранилище архивов', 'Also delete the backup storage')}</label>
            <div class="bk-actions"><button class="win-btn is-default bk-reset-go">${L('Сбросить...', 'Reset...')}</button></div>
          </div>
          <div class="win-statusbar bk-status"><div class="win-status-pane bk-status-text"></div></div>
        </div>`,
      onClose: () => { this.win = null; }
    });
    this.el = this.win.element;
    this.bind();
    this.showTab(this.tab);
    this.el.querySelector('.bk-name').value = this.defaultLabel();
    this.refresh();
  }

  q(sel) {
    return this.el.querySelector(sel);
  }

  bind() {
    this.el.querySelectorAll('.bk-tabs .win-tab').forEach(tab => tab.addEventListener('click', () => this.showTab(tab.dataset.tab)));
    this.q('.bk-all').addEventListener('click', () => this.checkAll('backup', true));
    this.q('.bk-none').addEventListener('click', () => this.checkAll('backup', false));
    this.q('.bk-start').addEventListener('click', () => this.startBackup());
    this.q('.bk-open-file').addEventListener('click', () => this.openFile());
    this.q('.bk-keep').addEventListener('click', () => this.keepLoose());
    this.q('.bk-export').addEventListener('click', () => this.exportCurrent());
    this.q('.bk-rename').addEventListener('click', () => this.renameCurrent());
    this.q('.bk-delete').addEventListener('click', () => this.deleteCurrent());
    this.q('.bk-restore').addEventListener('click', () => this.startRestore());
    this.q('.bk-reset-go').addEventListener('click', () => this.startReset());
    this.el.querySelectorAll('input[name="bk-reset"]').forEach(r => r.addEventListener('change', () => this.syncReset()));
    this.el.querySelectorAll('input[name="bk-target"]').forEach(r => r.addEventListener('change', () => this.syncTarget()));
  }

  showTab(id) {
    this.tab = id;
    this.el.querySelectorAll('.bk-tabs .win-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    this.el.querySelectorAll('.bk-panel').forEach(p => { p.style.display = p.dataset.panel === id ? '' : 'none'; });
  }

  status(text) {
    if (this.el) this.q('.bk-status-text').textContent = text;
  }

  async refresh() {
    this.status(this.L('Подсчет данных...', 'Counting data...'));
    const [sizes, archives] = await Promise.all([window.BackupStore.measure(), window.BackupStore.list().catch(() => [])]);
    if (!this.el) return;
    this.sizes = sizes;
    this.archives = archives;
    this.renderTree('backup', this.sizes, null);
    this.renderTree('reset', this.sizes, new Set());
    this.renderList();
    this.syncReset();
    this.syncTarget();
    this.updateTotal();
    const stored = archives.reduce((n, a) => n + (a.size || 0), 0);
    this.status(this.L('Архивов в хранилище: ', 'Backups in storage: ') + archives.length + ' · ' + this.L('занято ', 'used ') + this.size(stored));
  }

  renderTree(name, sizes, checked) {
    const cat = window.BackupCatalog;
    const box = this.q(`[data-tree="${name}"]`);
    const ids = Object.keys(sizes).filter(id => sizes[id] > 0);
    const groups = cat.groups.map(g => ({ g, items: cat.components.filter(c => c.group === g.id && ids.includes(c.id)) })).filter(x => x.items.length);
    if (!groups.length) {
      box.innerHTML = `<div class="bk-empty">${this.L('Нет данных', 'No data')}</div>`;
      return;
    }
    const L = (r, e) => this.L(r, e);
    box.innerHTML = groups.map(({ g, items }) => {
      const total = items.reduce((n, c) => n + sizes[c.id], 0);
      return `
        <div class="bk-node bk-group" data-group="${g.id}">
          <span class="bk-toggle">−</span>
          <input type="checkbox">
          <span class="bk-icon">${Icons[g.icon] || ''}</span>
          <span class="bk-name-cell">${this.esc(L(g.ru, g.en))}</span>
          <span class="bk-size">${this.size(total)}</span>
        </div>
        <div class="bk-children" data-group-body="${g.id}">
          ${items.map(c => `
            <label class="bk-node bk-leaf" data-comp="${c.id}">
              <input type="checkbox" ${!checked || checked.has(c.id) ? 'checked' : ''}>
              <span class="bk-icon">${Icons[cat.iconOf(c)] || ''}</span>
              <span class="bk-name-cell">${this.esc(cat.nameOf(c, this.ru))}</span>
              <span class="bk-size">${this.size(sizes[c.id])}</span>
            </label>`).join('')}
        </div>`;
    }).join('');
    box.querySelectorAll('.bk-group').forEach(row => {
      const gid = row.dataset.group;
      const body = box.querySelector(`[data-group-body="${gid}"]`);
      const groupBox = row.querySelector('input');
      row.querySelector('.bk-toggle').addEventListener('click', () => {
        const hide = body.style.display !== 'none';
        body.style.display = hide ? 'none' : '';
        row.querySelector('.bk-toggle').textContent = hide ? '+' : '−';
      });
      groupBox.addEventListener('change', () => {
        body.querySelectorAll('input').forEach(i => { i.checked = groupBox.checked; });
        this.syncGroups(name);
      });
      row.querySelector('.bk-name-cell').addEventListener('click', () => { groupBox.checked = !groupBox.checked; groupBox.dispatchEvent(new Event('change')); });
    });
    box.querySelectorAll('.bk-leaf input').forEach(i => i.addEventListener('change', () => this.syncGroups(name)));
    this.syncGroups(name);
  }

  syncGroups(name) {
    const box = this.q(`[data-tree="${name}"]`);
    box.querySelectorAll('.bk-group').forEach(row => {
      const boxes = [...box.querySelectorAll(`[data-group-body="${row.dataset.group}"] input`)];
      const on = boxes.filter(i => i.checked).length;
      const input = row.querySelector('input');
      input.checked = on === boxes.length && on > 0;
      input.indeterminate = on > 0 && on < boxes.length;
    });
    if (name === 'backup') this.updateTotal();
    if (name === 'restore') this.syncRestore();
  }

  checked(name) {
    return [...this.q(`[data-tree="${name}"]`).querySelectorAll('.bk-leaf')].filter(r => r.querySelector('input').checked).map(r => r.dataset.comp);
  }

  checkAll(name, on) {
    this.q(`[data-tree="${name}"]`).querySelectorAll('.bk-leaf input').forEach(i => { i.checked = on; });
    this.syncGroups(name);
  }

  updateTotal() {
    const ids = this.checked('backup');
    const total = ids.reduce((n, id) => n + (this.sizes[id] || 0), 0);
    this.q('.bk-total').textContent = this.L('Выбрано: ', 'Selected: ') + ids.length + ' · ' + this.size(total);
    this.q('.bk-start').disabled = !ids.length || this.busy;
  }

  syncTarget() {
    const toFile = this.q('input[name="bk-target"]:checked').value === 'file';
    this.q('.bk-start').textContent = toFile ? this.L('Записать файл...', 'Write File...') : this.L('Начать архивацию', 'Start Backup');
  }

  syncReset() {
    const some = this.q('input[name="bk-reset"]:checked').value === 'some';
    const tree = this.q('[data-tree="reset"]');
    tree.classList.toggle('is-disabled', !some);
    tree.querySelectorAll('input').forEach(i => { i.disabled = !some; });
    this.q('.bk-reset-archives').disabled = some;
    if (some) this.q('.bk-reset-archives').checked = false;
  }

  renderList() {
    const body = this.q('.bk-list-body');
    const rows = [...this.loose.map(a => ({ a, loose: true })), ...this.archives.map(a => ({ a, loose: false }))];
    if (!rows.length) {
      body.innerHTML = `<div class="bk-empty">${this.L('Архивов пока нет. Создайте архив на вкладке «Архивация» или откройте файл .bkf.', 'No backups yet. Make one on the Backup tab or open a .bkf file.')}</div>`;
    } else {
      body.innerHTML = rows.map(({ a, loose }) => `
        <div class="bk-list-row${this.current && this.current.id === a.id ? ' is-selected' : ''}${loose ? ' is-loose' : ''}" data-id="${a.id}">
          <span><span class="bk-icon">${Icons[loose ? 'drive-floppy' : 'backup'] || ''}</span>${this.esc(a.label || this.L('Без имени', 'Untitled'))}</span>
          <span>${this.date(a.created)}</span>
          <span>${this.size(a.size)}</span>
        </div>`).join('');
      body.querySelectorAll('.bk-list-row').forEach(r => {
        r.addEventListener('click', () => this.select(r.dataset.id));
        r.addEventListener('dblclick', () => { this.select(r.dataset.id); });
      });
    }
    this.syncRestore();
  }

  async select(id) {
    const loose = this.loose.find(a => a.id === id);
    const archive = loose || await window.BackupStore.load(id);
    if (!this.el || !archive) return;
    this.current = Object.assign(archive, { loose: !!loose });
    this.q('.bk-list-body').querySelectorAll('.bk-list-row').forEach(r => r.classList.toggle('is-selected', r.dataset.id === id));
    this.renderTree('restore', archive.sizes || {}, null);
    this.syncRestore();
  }

  syncRestore() {
    const a = this.current;
    this.q('.bk-keep').disabled = !a || !a.loose;
    this.q('.bk-export').disabled = !a;
    this.q('.bk-rename').disabled = !a || a.loose;
    this.q('.bk-delete').disabled = !a;
    this.q('.bk-restore').disabled = !a || !this.checked('restore').length || this.busy;
    if (!a) this.q('[data-tree="restore"]').innerHTML = `<div class="bk-empty">${this.L('Выберите архив в списке.', 'Select a backup in the list.')}</div>`;
  }

  progress(title, text) {
    const L = (r, e) => this.L(r, e);
    const id = 'app_backup_progress';
    if (window.winManager.windows.has(id)) window.winManager.closeWindow(id);
    const w = window.winManager.createWindow({
      id,
      title,
      icon: 'backup',
      width: 360,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="bk-progress">
          <div class="bk-progress-anim">${Icons['backup']}<div class="bk-reel"></div><div class="bk-reel"></div></div>
          <div class="bk-progress-text">${this.esc(text)}</div>
          <div class="bk-bar"><div class="bk-bar-fill"></div></div>
          <div class="bk-progress-note">${L('Не выключайте компьютер.', 'Do not turn off the computer.')}</div>
        </div>`
    });
    const fill = w.element.querySelector('.bk-bar-fill');
    let p = 0;
    const timer = setInterval(() => { p = Math.min(92, p + Math.max(1, (92 - p) / 12)); fill.style.width = p + '%'; }, 120);
    if (window.soundSys && window.soundSys.playDefragTick) window.soundSys.playDefragTick();
    return {
      text: t => { const el = w.element.querySelector('.bk-progress-text'); if (el) el.textContent = t; },
      done: () => new Promise(resolve => {
        clearInterval(timer);
        fill.style.width = '100%';
        setTimeout(() => { if (window.winManager.windows.has(id)) window.winManager.closeWindow(id); resolve(); }, 350);
      })
    };
  }

  message(icon, text, buttons) {
    window.winManager.openDialog({
      title: this.L('Архивация данных', 'Backup'),
      icon,
      message: text,
      buttons: buttons || [{ text: 'OK', primary: true }],
      width: 400
    });
  }

  ask(icon, text, yesText, onYes) {
    this.message(icon, text, [{ text: yesText, primary: true, onClick: onYes }, { text: 'Cancel' }]);
  }

  compNames(ids) {
    const cat = window.BackupCatalog;
    return ids.map(id => this.esc(cat.nameOf(cat.byId(id), this.ru))).join(', ');
  }

  fileName(label) {
    const base = String(label || 'Win98')
      .replace(/[.:]/g, '-')
      .replace(/[\\/*?"<>|,]+/g, ' ')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 60);
    return (base || 'Win98') + '.bkf';
  }

  downloadArchive(archive) {
    const text = window.BackupStore.toFileText(archive);
    const url = URL.createObjectURL(new Blob([text], { type: 'application/octet-stream' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = this.fileName(archive.label);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    return a.download;
  }

  async startBackup() {
    const ids = this.checked('backup');
    if (!ids.length || this.busy) return;
    const toFile = this.q('input[name="bk-target"]:checked').value === 'file';
    const label = this.q('.bk-name').value.trim() || this.defaultLabel();
    this.busy = true;
    this.updateTotal();
    const pr = this.progress(this.L('Архивация', 'Backup'), this.L('Копирование данных: ', 'Copying data: ') + ids.length + this.L(' компонентов', ' components'));
    try {
      const archive = await window.BackupStore.snapshot(ids, label);
      let where;
      if (toFile) {
        where = this.L('Файл: ', 'File: ') + this.esc(this.downloadArchive(archive));
      } else {
        pr.text(this.L('Запись в хранилище архивов...', 'Writing to backup storage...'));
        await window.BackupStore.save(archive);
        where = this.L('Хранилище архивов на диске C:', 'Backup storage on drive C:');
      }
      await pr.done();
      this.message('info', `<b>${this.L('Архивация завершена.', 'Backup complete.')}</b><br><br>${this.L('Архив', 'Backup')}: ${this.esc(label)}<br>${where}<br>${this.L('Компонентов', 'Components')}: ${archive.components.length}, ${this.L('объем', 'size')}: ${this.size(archive.size)}`);
      this.q('.bk-name').value = this.defaultLabel();
    } catch (e) {
      await pr.done();
      this.message('error', this.L('Не удалось создать архив: ', 'Could not create the backup: ') + this.esc(e && e.message || e));
    }
    this.busy = false;
    if (this.el) this.refresh();
  }

  openFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.bkf,.json';
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (!f) return;
      f.text().then(text => {
        const archive = window.BackupStore.fromFileText(text);
        if (!archive) {
          this.message('error', this.L('Файл «', 'The file "') + this.esc(f.name) + this.L('» не является архивом Win 98.', '" is not a Win 98 backup.'));
          return;
        }
        if (!archive.label) archive.label = f.name.replace(/\.[^.]+$/, '');
        archive.id = 'file_' + Date.now().toString(36);
        this.loose = [archive, ...this.loose.filter(a => a.label !== archive.label)];
        this.showTab('restore');
        this.renderList();
        this.select(archive.id);
      });
    };
    input.click();
  }

  async keepLoose() {
    const a = this.current;
    if (!a || !a.loose) return;
    const copy = Object.assign({}, a, { id: 'set_' + Date.now().toString(36) });
    delete copy.loose;
    await window.BackupStore.save(copy);
    this.loose = this.loose.filter(x => x.id !== a.id);
    this.current = null;
    await this.refresh();
    this.select(copy.id);
  }

  exportCurrent() {
    if (!this.current) return;
    const name = this.downloadArchive(this.current);
    this.status(this.L('Записан файл ', 'Saved file ') + name);
  }

  renameCurrent() {
    const a = this.current;
    if (!a || a.loose) return;
    const id = 'app_backup_rename';
    const w = window.winManager.createWindow({
      id,
      title: this.L('Переименование архива', 'Rename Backup'),
      icon: 'backup',
      width: 330,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="bk-rename-box">
          <div>${this.L('Новое имя архива:', 'New backup name:')}</div>
          <input type="text" class="win-input bk-rename-input" maxlength="60" value="${this.esc(a.label)}">
          <div class="bk-rename-buttons"><button class="win-btn is-default bk-rename-ok">OK</button><button class="win-btn bk-rename-cancel">${this.L('Отмена', 'Cancel')}</button></div>
        </div>`
    });
    const input = w.element.querySelector('.bk-rename-input');
    const ok = async () => {
      const label = input.value.trim();
      window.winManager.closeWindow(id);
      if (!label) return;
      await window.BackupStore.rename(a.id, label);
      await this.refresh();
      this.select(a.id);
    };
    w.element.querySelector('.bk-rename-ok').addEventListener('click', ok);
    w.element.querySelector('.bk-rename-cancel').addEventListener('click', () => window.winManager.closeWindow(id));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    setTimeout(() => { input.focus(); input.select(); }, 0);
  }

  deleteCurrent() {
    const a = this.current;
    if (!a) return;
    if (a.loose) {
      this.loose = this.loose.filter(x => x.id !== a.id);
      this.current = null;
      this.renderList();
      return;
    }
    this.ask('warning', this.L('Удалить архив «', 'Delete the backup "') + this.esc(a.label) + this.L('» из хранилища?', '" from storage?'), 'Yes', async () => {
      await window.BackupStore.remove(a.id);
      this.current = null;
      this.refresh();
    });
  }

  rebootNotice(text) {
    if (window.winManager && window.winManager.windows) [...window.winManager.windows.keys()].forEach(id => window.winManager.closeWindow(id));
    const boot = document.getElementById('boot-screen');
    const footer = document.querySelector('.boot-footer');
    if (footer) footer.textContent = text;
    if (boot) { boot.style.display = 'flex'; boot.classList.remove('fade-out'); }
    if (window.soundSys && window.soundSys.playShutdown) window.soundSys.playShutdown();
    window.BackupStore.reboot();
  }

  startRestore() {
    const a = this.current;
    const ids = this.checked('restore');
    if (!a || !ids.length || this.busy) return;
    const safety = this.q('.bk-safety').checked;
    const text = `${this.L('Будут заменены текущие данные:', 'Current data will be replaced:')}<br><b>${this.compNames(ids)}</b><br><br>${safety ? this.L('Текущие данные сначала будут сохранены в архив.', 'Current data will be backed up first.') + '<br>' : ''}${this.L('После восстановления Win 98 перезагрузится.', 'Win 98 will restart after restoring.')}`;
    this.ask('question', text, this.L('Восстановить', 'Restore'), async () => {
      this.busy = true;
      this.syncRestore();
      const pr = this.progress(this.L('Восстановление', 'Restore'), this.L('Подготовка...', 'Preparing...'));
      try {
        if (safety) {
          pr.text(this.L('Сохранение текущих данных...', 'Backing up current data...'));
          const before = await window.BackupStore.snapshot(ids, this.defaultLabel(this.L('Перед восстановлением', 'Before restore')));
          if (before.components.length) await window.BackupStore.save(before);
        }
        pr.text(this.L('Восстановление файлов...', 'Restoring files...'));
        const res = await window.BackupStore.restore(a, ids);
        await pr.done();
        if (!res.ok) {
          this.busy = false;
          this.syncRestore();
          this.message('error', this.L('На диске C: не хватает места для восстановления. Текущие данные не изменены.', 'Drive C: is out of space for the restore. Current data was not changed.'));
          return;
        }
        this.rebootNotice(this.L('Восстановление данных...', 'Restoring data...'));
      } catch (e) {
        await pr.done();
        this.busy = false;
        this.syncRestore();
        this.message('error', this.L('Ошибка восстановления: ', 'Restore failed: ') + this.esc(e && e.message || e));
      }
    });
  }

  startReset() {
    if (this.busy) return;
    const some = this.q('input[name="bk-reset"]:checked').value === 'some';
    const ids = some ? this.checked('reset') : null;
    if (some && !ids.length) {
      this.message('info', this.L('Отметьте программы, данные которых нужно удалить.', 'Tick the programs whose data should be deleted.'));
      return;
    }
    const safety = this.q('.bk-reset-safety').checked;
    const dropArchives = !some && this.q('.bk-reset-archives').checked;
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const text = some
      ? `${this.L('Будут удалены данные:', 'This data will be deleted:')}<br><b>${this.compNames(ids)}</b><br><br>${this.L('После этого Win 98 перезагрузится. Продолжить?', 'Win 98 will restart afterwards. Continue?')}`
      : t('run.resetConfirm') + (safety ? '<br><br>' + this.L('Перед сбросом будет создан архив текущего состояния.', 'A backup of the current state will be made first.') : '') + (dropArchives ? '<br><br><b>' + this.L('Хранилище архивов тоже будет удалено.', 'The backup storage will be deleted too.') + '</b>' : '');
    this.ask('warning', text, 'Yes', async () => {
      this.busy = true;
      const pr = this.progress(this.L('Сброс', 'Reset'), this.L('Подготовка...', 'Preparing...'));
      try {
        if (safety) {
          pr.text(this.L('Сохранение архива...', 'Saving a backup...'));
          const before = await window.BackupStore.snapshot(ids, this.defaultLabel(some ? this.L('Перед удалением', 'Before delete') : this.L('Перед сбросом', 'Before reset')));
          if (before.components.length) {
            if (dropArchives) this.downloadArchive(before);
            else await window.BackupStore.save(before);
          }
        }
        pr.text(this.L('Удаление данных...', 'Deleting data...'));
        await window.BackupStore.wipe(ids, { dropArchives });
        await pr.done();
        this.rebootNotice(some ? this.L('Удаление данных программ...', 'Deleting program data...') : t('run.resetting'));
      } catch (e) {
        await pr.done();
        this.busy = false;
        this.message('error', this.L('Ошибка сброса: ', 'Reset failed: ') + this.esc(e && e.message || e));
      }
    });
  }

  showReport(report) {
    if (!report || report.kind === 'reset') return;
    const ids = report.components || [];
    const head = report.kind === 'restore' ? this.L('Восстановление завершено.', 'Restore complete.') : this.L('Данные программ удалены.', 'Program data deleted.');
    const from = report.kind === 'restore' && report.label ? `${this.L('Архив', 'Backup')}: ${this.esc(report.label)}<br>` : '';
    const failed = report.failed && report.failed.length ? `<br><br>${this.L('Не удалось восстановить базы: ', 'Could not restore databases: ')}${this.esc(report.failed.join(', '))}` : '';
    this.message(failed ? 'warning' : 'info', `<b>${head}</b><br><br>${from}${this.compNames(ids)}${failed}`);
  }

  watchBoot() {
    const ready = window.BackupStore && window.BackupStore.ready;
    if (!ready) return;
    ready.then(() => {
      const report = window.BackupStore.takeReport();
      if (!report) return;
      const timer = setInterval(() => {
        const boot = document.getElementById('boot-screen');
        const post = document.getElementById('bios-post-screen');
        const booting = (boot && boot.style.display !== 'none') || (post && post.classList.contains('active'));
        if (booting || !window.winManager || !window.BackupCatalog) return;
        clearInterval(timer);
        setTimeout(() => this.showReport(report), 800);
      }, 500);
    });
  }
}

window.appBackup = new AppBackup();
window.appBackup.watchBoot();
