class AppTaskbarProps {
  constructor() {
    this.winId = 'app_taskbar_props';
    this.wizardId = 'app_tbp_wizard';
    this.removeId = 'app_tbp_remove';
    this.optionKeys = ['alwaysOnTop', 'autoHide', 'smallIcons', 'showClock'];
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  esc(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  clippy() {
    return window.appClippy || null;
  }

  open(tabId = 'options') {
    const wm = window.winManager;
    const taskbar = window.taskbar;
    if (!wm || !taskbar) return;
    if (wm.windows.has(this.winId)) {
      wm.bringToTop(this.winId);
      if (this.selectTab) this.selectTab(tabId);
      return;
    }

    let saved = { ...taskbar.settings };
    const working = { ...saved };
    let activeTab = tabId === 'programs' ? 'programs' : 'options';

    const option = (key, labelKey) => `
      <label class="win-label-row tbp-check">
        <input type="checkbox" data-opt="${key}" ${working[key] ? 'checked' : ''}>
        <span>${this.t(labelKey)}</span>
      </label>`;

    const content = document.createElement('div');
    content.className = 'tbp-root';
    content.innerHTML = `
      <div class="win-tabs">
        <div class="win-tab tbp-tab" data-tab="options">${this.t('tbp.tabOptions')}</div>
        <div class="win-tab tbp-tab" data-tab="programs">${this.t('tbp.tabPrograms')}</div>
      </div>
      <div class="win-tab-panel tbp-panel">
        <div class="tbp-page" data-page="options">
          ${this.previewHtml()}
          <div class="tbp-checks">
            ${option('alwaysOnTop', 'tbp.alwaysOnTop')}
            ${option('autoHide', 'tbp.autoHide')}
            ${option('smallIcons', 'tbp.smallIcons')}
            ${option('showClock', 'tbp.showClock')}
          </div>
        </div>
        <div class="tbp-page" data-page="programs">
          <fieldset class="tbp-group">
            <legend>${this.t('tbp.customizeGroup')}</legend>
            <div class="tbp-group-row">
              <div class="tbp-group-icon">${Icons['programs']}</div>
              <div class="tbp-group-text">${this.t('tbp.customizeText')}</div>
            </div>
            <div class="tbp-group-buttons">
              <button class="win-btn" data-act="add">${this.t('tbp.add')}</button>
              <button class="win-btn" data-act="remove">${this.t('tbp.remove')}</button>
              <button class="win-btn" data-act="advanced">${this.t('tbp.advanced')}</button>
            </div>
          </fieldset>
          <fieldset class="tbp-group">
            <legend>${this.t('tbp.documentsGroup')}</legend>
            <div class="tbp-group-row">
              <div class="tbp-group-icon">${Icons['recycle-bin']}</div>
              <div class="tbp-group-text">${this.t('tbp.documentsText')}</div>
            </div>
            <div class="tbp-group-buttons is-right">
              <button class="win-btn" data-act="clear">${this.t('tbp.clear')}</button>
            </div>
          </fieldset>
        </div>
      </div>
      <div class="win-dialog-buttons tbp-buttons">
        <button class="win-btn is-default" data-act="ok">${this.t('btn.ok')}</button>
        <button class="win-btn" data-act="cancel">${this.t('btn.cancel')}</button>
        <button class="win-btn" data-act="apply" disabled>${this.t('btn.apply')}</button>
      </div>`;

    const dialog = wm.createWindow({
      id: this.winId,
      title: this.t('tbp.title'),
      icon: 'taskbar-props',
      width: 366,
      height: 418,
      resizable: false,
      minimizable: false,
      maximizable: false,
      helpButton: true,
      onHelp: () => this.help(activeTab),
      isDialog: true,
      content,
      onClose: () => {
        this.selectTab = null;
        this.syncSettings = () => {};
      }
    });

    const el = dialog.element;
    const preview = el.querySelector('.tbp-preview');
    const btnApply = el.querySelector('[data-act="apply"]');
    const btnClear = el.querySelector('[data-act="clear"]');

    const sameAsSaved = () => this.optionKeys.every(key => working[key] === saved[key]);
    const refresh = () => {
      this.paintPreview(preview, working);
      btnApply.disabled = sameAsSaved();
    };

    this.selectTab = (id) => {
      activeTab = id === 'programs' ? 'programs' : 'options';
      el.querySelectorAll('.tbp-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === activeTab));
      el.querySelectorAll('.tbp-page').forEach(page => { page.hidden = page.dataset.page !== activeTab; });
    };
    this.syncSettings = () => {
      saved = { ...taskbar.settings };
      Object.assign(working, saved);
      el.querySelectorAll('input[data-opt]').forEach(box => { box.checked = Boolean(working[box.dataset.opt]); });
      refresh();
    };

    el.querySelectorAll('.tbp-tab').forEach(tab => tab.addEventListener('click', () => this.selectTab(tab.dataset.tab)));
    el.querySelectorAll('input[data-opt]').forEach(box => {
      box.addEventListener('change', () => {
        working[box.dataset.opt] = box.checked;
        refresh();
      });
    });

    const commit = () => {
      if (sameAsSaved()) return;
      const previous = taskbar.saveSettings(working);
      saved = { ...working };
      btnApply.disabled = true;
      const clippy = this.clippy();
      if (clippy && typeof clippy.onTaskbarChanged === 'function') clippy.onTaskbarChanged(previous, { ...saved });
    };

    el.querySelector('[data-act="ok"]').addEventListener('click', () => {
      commit();
      wm.closeWindow(this.winId);
    });
    el.querySelector('[data-act="cancel"]').addEventListener('click', () => wm.closeWindow(this.winId));
    btnApply.addEventListener('click', commit);
    el.querySelector('[data-act="add"]').addEventListener('click', () => this.openAddWizard());
    el.querySelector('[data-act="remove"]').addEventListener('click', () => this.openRemoveDialog());
    el.querySelector('[data-act="advanced"]').addEventListener('click', () => this.openAdvanced());
    btnClear.addEventListener('click', () => this.clearDocuments(btnClear));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        wm.closeWindow(this.winId);
      }
    });

    this.selectTab(activeTab);
    btnClear.disabled = !taskbar.hasPersonalHistory();
    refresh();
    if (window.clippySystem) window.clippySystem.onTaskbarDialogOpened();
  }

  syncSettings() {}

  previewHtml() {
    return `
      <div class="tbp-preview" aria-hidden="true">
        <div class="tbp-pv-window">
          <div class="tbp-pv-titlebar"></div>
          <div class="tbp-pv-icons">
            <div class="tbp-pv-icon">${Icons['sound-recorder'] || ''}<span>${this.t('app.soundRecorder')}</span></div>
            <div class="tbp-pv-icon">${Icons['wordpad'] || ''}<span>${this.t('app.wordpad')}</span></div>
          </div>
        </div>
        <div class="tbp-pv-menu">
          <div class="tbp-pv-banner"><span><b>Win</b>98</span></div>
          <div class="tbp-pv-items">
            <div class="tbp-pv-item"><span class="tbp-pv-item-icon">${Icons['help']}</span><span>${this.t('start.help')}</span></div>
            <div class="tbp-pv-item"><span class="tbp-pv-item-icon">${Icons['run']}</span><span>${this.t('start.run')}</span></div>
            <div class="tbp-pv-sep"></div>
            <div class="tbp-pv-item"><span class="tbp-pv-item-icon">${Icons['shut-down']}</span><span>${this.t('start.shutdown')}</span></div>
          </div>
        </div>
        <div class="tbp-pv-taskbar">
          <div class="tbp-pv-start"><span class="tbp-pv-start-icon">${Icons['start-logo']}</span><b>${this.t('taskbar.start')}</b></div>
          <div class="tbp-pv-tray">
            <span class="tbp-pv-tray-icon">${Icons['speaker'] || ''}</span>
            <span class="tbp-pv-clock"></span>
          </div>
        </div>
      </div>`;
  }

  paintPreview(preview, settings) {
    if (!preview) return;
    preview.classList.toggle('is-below', !settings.alwaysOnTop);
    preview.classList.toggle('is-autohide', settings.autoHide);
    preview.classList.toggle('is-small', settings.smallIcons);
    preview.classList.toggle('no-clock', !settings.showClock);
    const clock = preview.querySelector('.tbp-pv-clock');
    const live = document.getElementById('tray-clock');
    if (clock) clock.textContent = live && live.textContent ? live.textContent : '12:45';
  }

  help(tab) {
    const clippy = this.clippy();
    const enabled = !window.clippyOptions || window.clippyOptions.get('enabled') !== false;
    if (!clippy || !enabled) {
      if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp();
      return;
    }
    if (!clippy.isRunning()) clippy.launch('help');
    else if (!clippy.visible) clippy.show();
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const text = tab === 'programs'
      ? (isRu
        ? '«Добавить» создаёт ярлык в меню «Пуск». «Удалить» отправляет ярлык в Корзину, оттуда его можно вернуть. «Дополнительно» открывает папку меню в Проводнике. «Очистить» стирает список недавних документов и историю «Выполнить».'
        : 'Add creates a shortcut in the Start menu. Remove sends a shortcut to the Recycle Bin, where you can restore it. Advanced opens the menu folder in Explorer. Clear empties the recent documents list and the Run history.')
      : (isRu
        ? 'Галочки меняют только картинку сверху. Панель на экране изменится после «Применить» или «ОК». Если включить автоскрытие, панель вернётся, когда вы подведёте указатель к нижнему краю экрана.'
        : 'The check boxes change only the picture above. The real taskbar changes after Apply or OK. With auto hide on, the taskbar comes back when you move the pointer to the bottom edge of the screen.');
    clippy.speak(text, [], tab === 'programs' ? '📁' : '📎', 12000);
  }

  openAdvanced() {
    const taskbar = window.taskbar;
    if (!taskbar || !window.appExplorer) return;
    taskbar.renderStartMenuContent();
    window.appExplorer.open(taskbar.startMenuFolderPath());
  }

  clearDocuments(button) {
    const taskbar = window.taskbar;
    if (!taskbar) return;
    const had = taskbar.clearPersonalHistory();
    if (button) button.disabled = true;
    if (window.soundSys && window.soundSys.playRecycle) window.soundSys.playRecycle();
    const clippy = this.clippy();
    if (clippy && typeof clippy.onStartMenuChanged === 'function') clippy.onStartMenuChanged('clear', { had });
  }

  rootNode() {
    return window.taskbar ? window.taskbar.ensureStartMenuFolder() : null;
  }

  collectTree(foldersOnly) {
    const taskbar = window.taskbar;
    const root = this.rootNode();
    if (!taskbar || !root) return null;
    const rootPath = taskbar.startMenuFolderPath();
    const build = (node, parentPath, key, depth) => {
      const path = key === null ? rootPath : parentPath.concat(key);
      const isFolder = Boolean(node.children);
      const children = isFolder
        ? Object.keys(node.children)
          .filter(childKey => node.children[childKey] && (!foldersOnly || node.children[childKey].children))
          .map(childKey => build(node.children[childKey], path, childKey, depth + 1))
          .sort((a, b) => Number(b.folder) - Number(a.folder))
        : [];
      return {
        id: path.join('\\'),
        key,
        parentPath,
        path,
        depth,
        folder: isFolder,
        name: key === null ? this.t('startmenu.rootName') : (node.name || key),
        icon: key === null ? 'taskbar-props' : (isFolder ? 'programs' : (node.icon || 'file-exe')),
        ref: typeof node.content === 'string' ? node.content : '',
        children
      };
    };
    return build(root, rootPath.slice(0, -1), null, 0);
  }

  findTreeNode(tree, id) {
    if (!tree) return null;
    if (tree.id === id) return tree;
    for (const child of tree.children) {
      const found = this.findTreeNode(child, id);
      if (found) return found;
    }
    return null;
  }

  renderTree(box, tree, state) {
    const rows = [];
    const walk = (node) => {
      rows.push(node);
      if (node.folder && state.expanded.has(node.id)) node.children.forEach(walk);
    };
    if (tree) walk(tree);
    box.innerHTML = rows.map(node => {
      const toggle = node.folder && node.children.length
        ? `<span class="tbp-tree-toggle" data-toggle="${this.esc(node.id)}">${state.expanded.has(node.id) ? '−' : '+'}</span>`
        : '<span class="tbp-tree-toggle is-blank"></span>';
      const editing = state.editing === node.id;
      const label = editing
        ? `<input type="text" class="tbp-tree-edit" value="${this.esc(node.name)}" spellcheck="false">`
        : `<span class="tbp-tree-label">${this.esc(node.name)}</span>`;
      return `<div class="tbp-tree-row${state.selected === node.id ? ' selected' : ''}" data-id="${this.esc(node.id)}" style="padding-left:${2 + node.depth * 16}px">
        ${toggle}<span class="tbp-tree-icon icon-small">${Icons[node.icon] || Icons['programs']}</span>${label}
      </div>`;
    }).join('');
    const selectedRow = box.querySelector('.tbp-tree-row.selected');
    if (selectedRow && selectedRow.scrollIntoView) selectedRow.scrollIntoView({ block: 'nearest' });
    return rows;
  }

  bindTree(box, getRows, state, handlers) {
    box.addEventListener('mousedown', (e) => {
      if (e.target.closest('.tbp-tree-edit')) return;
      const toggle = e.target.closest('[data-toggle]');
      if (toggle) {
        const id = toggle.dataset.toggle;
        if (state.expanded.has(id)) state.expanded.delete(id);
        else state.expanded.add(id);
        handlers.redraw();
        return;
      }
      const row = e.target.closest('.tbp-tree-row');
      if (!row) return;
      state.selected = row.dataset.id;
      handlers.redraw();
      box.focus();
    });
    box.addEventListener('dblclick', (e) => {
      const row = e.target.closest('.tbp-tree-row');
      if (!row || e.target.closest('[data-toggle]') || e.target.closest('.tbp-tree-edit')) return;
      const node = getRows().find(r => r.id === row.dataset.id);
      if (node && node.folder) {
        if (state.expanded.has(node.id)) state.expanded.delete(node.id);
        else state.expanded.add(node.id);
        handlers.redraw();
      } else if (node && handlers.activate) {
        handlers.activate(node);
      }
    });
    box.addEventListener('keydown', (e) => {
      if (e.target.closest('.tbp-tree-edit')) return;
      const rows = getRows();
      const index = rows.findIndex(r => r.id === state.selected);
      const node = rows[index];
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = rows[Math.max(0, Math.min(rows.length - 1, index + (e.key === 'ArrowDown' ? 1 : -1)))];
        if (next) state.selected = next.id;
        handlers.redraw();
      } else if (e.key === 'ArrowRight' && node && node.folder) {
        e.preventDefault();
        state.expanded.add(node.id);
        handlers.redraw();
      } else if (e.key === 'ArrowLeft' && node) {
        e.preventDefault();
        if (node.folder && state.expanded.has(node.id)) state.expanded.delete(node.id);
        else {
          const parentId = node.parentPath.join('\\');
          if (rows.some(r => r.id === parentId)) state.selected = parentId;
        }
        handlers.redraw();
      } else if (e.key === 'Delete' && handlers.remove) {
        e.preventDefault();
        handlers.remove();
      }
    });
  }

  validName(name) {
    return Boolean(name) && !/[\\/:*?"<>|]/.test(name);
  }

  suggestTitle(command) {
    const text = String(command || '').trim().replace(/^"|"$/g, '');
    const url = text.match(/^(?:https?:\/\/)?(www\.[^/\s]+)/i);
    if (url) return url[1];
    const last = text.split('\\').filter(Boolean).pop() || text;
    return last.replace(/\.(exe|com|bat|lnk)$/i, '') || text;
  }

  openAddWizard() {
    const wm = window.winManager;
    const taskbar = window.taskbar;
    if (!wm || !taskbar || !this.rootNode()) return;
    if (wm.windows.has(this.wizardId)) {
      wm.bringToTop(this.wizardId);
      return;
    }
    taskbar.renderStartMenuContent();

    const tree = this.collectTree(true);
    const programs = tree.children.find(child => child.ref === 'menu:programs');
    const state = {
      step: 0,
      command: '',
      title: '',
      titleTouched: false,
      folder: { selected: programs ? programs.id : tree.id, expanded: new Set([tree.id].concat(programs ? [programs.id] : [])), editing: null }
    };

    const content = document.createElement('div');
    content.className = 'tbp-wizard';
    content.innerHTML = `
      <div class="tbp-wizard-body">
        <div class="tbp-wizard-art">${this.wizardArt()}</div>
        <div class="tbp-wizard-page"></div>
      </div>
      <div class="tbp-wizard-rule"></div>
      <div class="tbp-wizard-buttons">
        <button class="win-btn" data-act="back">${this.t('tbp.back')}</button>
        <button class="win-btn is-default" data-act="next">${this.t('tbp.next')}</button>
        <button class="win-btn tbp-wizard-cancel" data-act="cancel">${this.t('btn.cancel')}</button>
      </div>`;

    const titles = [this.t('tbp.wizardTitle'), this.t('tbp.folderTitle'), this.t('tbp.nameTitle')];
    const dialog = wm.createWindow({
      id: this.wizardId,
      title: titles[0],
      icon: 'programs',
      width: 476,
      height: 316,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });
    const el = dialog.element;
    const page = el.querySelector('.tbp-wizard-page');
    const btnBack = el.querySelector('[data-act="back"]');
    const btnNext = el.querySelector('[data-act="next"]');
    const close = () => wm.closeWindow(this.wizardId);
    let folderRows = [];

    const folderTree = () => this.collectTree(true);

    const renderStep = () => {
      wm.setTitle(this.wizardId, titles[state.step]);
      btnBack.disabled = state.step === 0;
      btnNext.textContent = state.step === 2 ? this.t('tbp.finish') : this.t('tbp.next');
      if (state.step === 0) {
        page.innerHTML = `
          <p class="tbp-wizard-text">${this.t('tbp.commandText')}</p>
          <label class="tbp-wizard-label" for="tbp-cmd">${this.t('tbp.commandLabel')}</label>
          <input type="text" id="tbp-cmd" class="tbp-wizard-input" spellcheck="false" value="${this.esc(state.command)}">
          <div><button class="win-btn tbp-wizard-browse" data-act="browse">${this.t('btn.browse')}</button></div>`;
        const input = page.querySelector('#tbp-cmd');
        const sync = () => {
          state.command = input.value;
          btnNext.disabled = !input.value.trim();
        };
        input.addEventListener('input', sync);
        page.querySelector('[data-act="browse"]').addEventListener('click', () => this.browseForCommand((command) => {
          input.value = command;
          sync();
          input.focus();
        }));
        sync();
        setTimeout(() => input.focus(), 30);
        return;
      }
      if (state.step === 1) {
        page.innerHTML = `
          <p class="tbp-wizard-text">${this.t('tbp.folderText')}</p>
          <div class="tbp-tree" tabindex="0"></div>
          <div class="tbp-wizard-row-right"><button class="win-btn" data-act="newfolder">${this.t('tbp.newFolder')}</button></div>`;
        const box = page.querySelector('.tbp-tree');
        const redraw = () => {
          const current = folderTree();
          if (!this.findTreeNode(current, state.folder.selected)) state.folder.selected = current.id;
          folderRows = this.renderTree(box, current, state.folder);
          btnNext.disabled = !state.folder.selected;
          const edit = box.querySelector('.tbp-tree-edit');
          if (edit) this.bindRename(edit, state.folder, redraw);
        };
        this.bindTree(box, () => folderRows, state.folder, { redraw });
        page.querySelector('[data-act="newfolder"]').addEventListener('click', () => {
          const parent = this.findTreeNode(folderTree(), state.folder.selected);
          if (!parent) return;
          const key = taskbar.createStartMenuFolder(parent.path, this.t('tbp.newFolderName'));
          if (!key) return;
          const id = parent.path.concat(key).join('\\');
          state.folder.expanded.add(parent.id);
          state.folder.selected = id;
          state.folder.editing = id;
          redraw();
        });
        redraw();
        setTimeout(() => {
          if (!state.folder.editing) box.focus();
        }, 30);
        return;
      }
      if (!state.titleTouched) state.title = this.suggestTitle(state.command);
      page.innerHTML = `
        <p class="tbp-wizard-text">${this.t('tbp.nameText')}</p>
        <input type="text" id="tbp-name" class="tbp-wizard-input" spellcheck="false" value="${this.esc(state.title)}">
        <p class="tbp-wizard-hint">${this.t('tbp.nameHint')}</p>`;
      const input = page.querySelector('#tbp-name');
      input.addEventListener('input', () => {
        state.title = input.value;
        state.titleTouched = true;
        btnNext.disabled = !input.value.trim();
      });
      btnNext.disabled = !state.title.trim();
      setTimeout(() => {
        input.focus();
        input.select();
      }, 30);
    };

    const finish = () => {
      const name = state.title.trim();
      if (!this.validName(name)) {
        wm.openDialog({ title: titles[2], icon: 'warning', message: this.t('tbp.badName') });
        return;
      }
      const folderNode = this.findTreeNode(folderTree(), state.folder.selected);
      if (!folderNode) return;
      const command = state.command.trim();
      const key = taskbar.addStartMenuShortcut(folderNode.path, name, command);
      close();
      if (!key) return;
      this.refreshRemoveDialog();
      const clippy = this.clippy();
      if (clippy && typeof clippy.onStartMenuChanged === 'function') {
        clippy.onStartMenuChanged('add', { name: key, folder: folderNode.name, command, inPrograms: folderNode.ref === 'menu:programs' });
      }
    };

    btnBack.addEventListener('click', () => {
      if (state.step === 0) return;
      state.step -= 1;
      renderStep();
    });
    btnNext.addEventListener('click', () => {
      if (state.step === 0) {
        const command = state.command.trim();
        if (!command) return;
        if (/^[a-z]:\\/i.test(command) && !taskbar.resolveVfsCommand(command)) {
          wm.openDialog({ title: titles[0], icon: 'warning', message: this.t('tbp.notFound', this.esc(command)) });
          return;
        }
        state.step = 1;
        renderStep();
        return;
      }
      if (state.step === 1) {
        if (state.folder.editing) return;
        state.step = 2;
        renderStep();
        return;
      }
      finish();
    });
    el.querySelector('[data-act="cancel"]').addEventListener('click', close);
    el.addEventListener('keydown', (e) => {
      if (e.target.closest('.tbp-tree-edit')) return;
      if (e.key === 'Enter' && !e.target.closest('button')) {
        e.preventDefault();
        if (!btnNext.disabled) btnNext.click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    });

    renderStep();
  }

  bindRename(input, state, redraw) {
    const taskbar = window.taskbar;
    setTimeout(() => {
      input.focus();
      input.select();
    }, 20);
    let done = false;
    const commit = (keep) => {
      if (done) return;
      done = true;
      const id = state.editing;
      state.editing = null;
      const parts = id.split('\\');
      const oldKey = parts.pop();
      const name = input.value.trim();
      if (keep && name && name !== oldKey && this.validName(name)) {
        const folder = window.vfs.resolvePath(parts);
        if (folder && folder.children && !folder.children[name]) {
          window.vfs.renameItem(parts, oldKey, name);
          state.selected = parts.concat(name).join('\\');
          taskbar.renderStartMenuContent();
        }
      }
      redraw();
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        commit(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        commit(false);
      }
    });
    input.addEventListener('blur', () => commit(true));
    input.addEventListener('mousedown', (e) => e.stopPropagation());
  }

  browseForCommand(onPick) {
    if (!window.fileDialog || !window.taskbar) return;
    window.fileDialog.show({
      mode: 'open',
      title: this.t('btn.browse').replace(/\.+$/, ''),
      path: ['My Computer', 'C:', 'Program Files'],
      filters: [
        { label: this.t('tbp.filterPrograms'), exts: ['exe', 'com', 'bat'] },
        { label: this.t('fdlg.allFiles'), exts: ['*'] }
      ],
      onOk: (path, key) => onPick(window.taskbar.vfsCommandFor(path, key))
    });
  }

  wizardArt() {
    return `
      <div class="tbp-art-menu">
        <div class="tbp-art-banner"></div>
        <div class="tbp-art-lines">
          <span></span><span></span><span></span><span></span><span class="is-hot"></span><span></span>
        </div>
      </div>
      <div class="tbp-art-sub">
        <span></span><span></span><span></span><span class="is-hot"></span>
      </div>
      <div class="tbp-art-start">${Icons['start-logo']}<span></span></div>
      <div class="tbp-art-file">${Icons['programs']}</div>
      <svg class="tbp-art-arrow" viewBox="0 0 150 120" xmlns="http://www.w3.org/2000/svg">
        <path d="M44 34 C 52 70, 70 80, 104 82" fill="none" stroke="#ff0000" stroke-width="2.5"/>
        <path d="M104 82 l -9 -6 M104 82 l -8 6" fill="none" stroke="#ff0000" stroke-width="2.5"/>
      </svg>`;
  }

  openRemoveDialog() {
    const wm = window.winManager;
    const taskbar = window.taskbar;
    if (!wm || !taskbar || !this.rootNode()) return;
    if (wm.windows.has(this.removeId)) {
      wm.bringToTop(this.removeId);
      return;
    }
    taskbar.renderStartMenuContent();
    const first = this.collectTree(false);
    const programs = first.children.find(child => child.ref === 'menu:programs');
    const state = { selected: null, expanded: new Set([first.id].concat(programs ? [programs.id] : [])), editing: null };
    let rows = [];

    const content = document.createElement('div');
    content.className = 'tbp-remove';
    content.innerHTML = `
      <p class="tbp-remove-text">${this.t('tbp.removeText')}</p>
      <div class="tbp-tree tbp-remove-tree" tabindex="0"></div>
      <div class="tbp-remove-buttons">
        <button class="win-btn" data-act="remove" disabled>${this.t('tbp.removeBtn')}</button>
        <button class="win-btn is-default" data-act="close">${this.t('win.close')}</button>
      </div>`;

    const dialog = wm.createWindow({
      id: this.removeId,
      title: this.t('tbp.removeTitle'),
      icon: 'programs',
      width: 380,
      height: 360,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content,
      onClose: () => { this.refreshRemoveDialog = () => {}; }
    });
    const el = dialog.element;
    const box = el.querySelector('.tbp-tree');
    const btnRemove = el.querySelector('[data-act="remove"]');

    const removable = (node) => Boolean(node) && node.key !== null && node.ref !== 'menu:programs';
    const redraw = () => {
      const tree = this.collectTree(false);
      if (state.selected && !this.findTreeNode(tree, state.selected)) state.selected = null;
      rows = this.renderTree(box, tree, state);
      btnRemove.disabled = !removable(rows.find(r => r.id === state.selected));
    };

    const remove = () => {
      const node = rows.find(r => r.id === state.selected);
      if (!removable(node)) return;
      const doRemove = () => {
        const index = rows.indexOf(node);
        taskbar.removeStartMenuItem(node.parentPath, node.key);
        state.selected = rows[index - 1] ? rows[index - 1].id : null;
        redraw();
        const clippy = this.clippy();
        if (clippy && typeof clippy.onStartMenuChanged === 'function') {
          clippy.onStartMenuChanged('remove', { name: node.name, ref: node.ref, folder: node.folder, binName: node.key });
        }
      };
      if (node.folder && node.children.length) {
        wm.openDialog({
          title: this.t('tbp.removeTitle'),
          icon: 'warning',
          message: this.t('tbp.removeFolderConfirm', this.esc(node.name)),
          buttons: [
            { text: 'Yes', primary: true, onClick: doRemove },
            { text: 'No' }
          ]
        });
        return;
      }
      doRemove();
    };

    this.bindTree(box, () => rows, state, { redraw, remove });
    btnRemove.addEventListener('click', remove);
    el.querySelector('[data-act="close"]').addEventListener('click', () => wm.closeWindow(this.removeId));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        wm.closeWindow(this.removeId);
      }
    });

    this.refreshRemoveDialog = redraw;
    redraw();
    setTimeout(() => box.focus(), 30);
  }

  refreshRemoveDialog() {}
}

window.appTaskbarProps = new AppTaskbarProps();
