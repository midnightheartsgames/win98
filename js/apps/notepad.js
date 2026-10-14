class AppNotepad {
  constructor() {
    this.currentFileName = null;
    this.currentPath = ['My Computer', 'C:', 'My Documents'];
    this.findState = { text: '', matchCase: false, down: true };
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  open(fileName = null, initialContent = '', filePath = null) {
    const doc = {
      fileName: fileName && fileName !== this.t('notepad.untitled') ? fileName : null,
      path: filePath ? filePath.slice() : this.currentPath.slice(),
      saved: String(initialContent || ''),
      wrap: false
    };
    this.currentFileName = doc.fileName || this.t('notepad.untitled');
    if (filePath) this.currentPath = filePath;

    const winId = 'app_notepad_' + Date.now();
    const win = window.winManager.createWindow({
      id: winId,
      title: this.titleFor(doc),
      icon: 'notepad',
      width: 480,
      height: 340,
      content: this.buildHTML()
    });
    const textarea = win.element.querySelector('.notepad-textarea');
    textarea.value = doc.saved;
    this.attachEvents(win, winId, doc);
    setTimeout(() => textarea.focus(), 0);
    return win;
  }

  displayName(doc) {
    if (!doc.fileName) return this.t('notepad.untitledName');
    return doc.fileName.replace(/\.txt$/i, '');
  }

  titleFor(doc) {
    return `${this.displayName(doc)} - ${this.t('app.notepad')}`;
  }

  buildHTML() {
    const t = (k, ...a) => this.t(k, ...a);
    return `
      <div class="notepad-container">
        <div class="win-menubar notepad-menubar">
          <div class="win-menu-item">${t('notepad.menuFile')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option" data-cmd="new">${t('notepad.menuNew')}</div>
              <div class="win-dropdown-option" data-cmd="open">${t('notepad.menuOpen')}</div>
              <div class="win-dropdown-option" data-cmd="save">${t('notepad.menuSave')}</div>
              <div class="win-dropdown-option" data-cmd="saveas">${t('notepad.menuSaveAs')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option" data-cmd="print">${t('notepad.menuPrint')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option" data-cmd="exit">${t('notepad.menuExit')}</div>
            </div>
          </div>
          <div class="win-menu-item">${t('notepad.menuEdit')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option" data-cmd="undo">${t('notepad.menuUndo')} <span>Ctrl+Z</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option" data-cmd="cut">${t('notepad.menuCut')} <span>Ctrl+X</span></div>
              <div class="win-dropdown-option" data-cmd="copy">${t('notepad.menuCopy')} <span>Ctrl+C</span></div>
              <div class="win-dropdown-option" data-cmd="paste">${t('notepad.menuPaste')} <span>Ctrl+V</span></div>
              <div class="win-dropdown-option" data-cmd="delete">${t('notepad.menuDelete')} <span>Del</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option" data-cmd="selectall">${t('notepad.menuSelectAll')}</div>
              <div class="win-dropdown-option" data-cmd="datetime">${t('notepad.menuDateTime')} <span>F5</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option notepad-opt-wrap" data-cmd="wrap">${t('notepad.menuWordWrap')}</div>
            </div>
          </div>
          <div class="win-menu-item">${t('notepad.menuSearch')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option" data-cmd="find">${t('notepad.menuFind')}</div>
              <div class="win-dropdown-option" data-cmd="findnext">${t('notepad.menuFindNext')} <span>F3</span></div>
            </div>
          </div>
          <div class="win-menu-item">${t('notepad.menuHelp')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option" data-cmd="help">${t('notepad.menuHelpTopics')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option" data-cmd="about">${t('notepad.menuAbout')}</div>
            </div>
          </div>
        </div>
        <textarea class="notepad-textarea" spellcheck="false" wrap="off"></textarea>
      </div>
    `;
  }

  attachEvents(win, winId, doc) {
    const t = (k, ...a) => this.t(k, ...a);
    const el = win.element;
    const textarea = el.querySelector('.notepad-textarea');
    const modified = () => textarea.value !== doc.saved;
    const setTitle = () => window.winManager.setTitle(winId, this.titleFor(doc));

    const writeTo = (path, name) => {
      if (!window.vfs.writeFile(path, name, textarea.value)) return false;
      doc.fileName = name;
      doc.path = path;
      doc.saved = textarea.value;
      this.currentFileName = name;
      this.currentPath = path;
      setTitle();
      if (window.appClippy && window.appClippy.onDocumentSaved) window.appClippy.onDocumentSaved('notepad', name, textarea.value, winId);
      return true;
    };
    win.isModified = modified;

    const saveAs = (then) => {
      window.fileDialog.show({
        mode: 'save',
        path: doc.path,
        fileName: doc.fileName || '*.txt',
        filters: [{ label: t('notepad.filterText'), exts: ['txt'] }, { label: t('fdlg.allFiles'), exts: ['*'] }],
        onOk: (path, name) => {
          if (writeTo(path, name) && then) then();
        }
      });
    };

    const save = (then) => {
      if (doc.fileName) {
        writeTo(doc.path, doc.fileName);
        if (then) then();
      } else {
        saveAs(then);
      }
    };

    const confirmDiscard = (then) => {
      if (!modified()) {
        then();
        return;
      }
      window.winManager.openDialog({
        title: t('app.notepad'),
        icon: 'warning',
        message: t('notepad.saveChanges', doc.fileName || t('notepad.untitledName')),
        buttons: [
          { text: 'Yes', primary: true, onClick: () => setTimeout(() => save(then), 0) },
          { text: 'No', onClick: () => {
            if (window.appClippy && window.appClippy.onDocumentDiscarded) window.appClippy.onDocumentDiscarded('notepad', doc.fileName || t('notepad.untitledName'));
            then();
          } },
          { text: 'Cancel' }
        ]
      });
    };

    const load = (path, name) => {
      const content = window.vfs.readFile(path, name);
      if (content === null) return;
      textarea.value = content;
      doc.saved = content;
      doc.fileName = name;
      doc.path = path;
      this.currentFileName = name;
      this.currentPath = path;
      setTitle();
      textarea.setSelectionRange(0, 0);
      textarea.scrollTop = 0;
    };

    const insertText = (text) => {
      textarea.focus();
      if (!document.execCommand || !document.execCommand('insertText', false, text)) {
        textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
      }
    };

    const copySelection = () => {
      const sel = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      if (sel && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(sel).catch(() => {});
      return sel;
    };

    const actions = {
      new: () => confirmDiscard(() => {
        textarea.value = '';
        doc.saved = '';
        doc.fileName = null;
        setTitle();
      }),
      open: () => confirmDiscard(() => {
        window.fileDialog.show({
          mode: 'open',
          path: doc.path,
          fileName: '*.txt',
          filters: [{ label: t('notepad.filterText'), exts: ['txt'] }, { label: t('fdlg.allFiles'), exts: ['*'] }],
          onOk: load
        });
      }),
      save: () => save(),
      saveas: () => saveAs(),
      print: () => {
        const dlg = window.winManager.openDialog({
          title: t('app.notepad'),
          icon: 'notepad',
          message: t('notepad.printing', this.displayName(doc)),
          buttons: [{ text: 'Cancel' }]
        });
        setTimeout(() => { if (window.winManager.windows.has(dlg.id)) window.winManager.closeWindow(dlg.id); }, 1600);
      },
      exit: () => window.winManager.closeWindow(winId),
      undo: () => {
        textarea.focus();
        document.execCommand('undo');
      },
      cut: () => {
        if (!copySelection()) return;
        textarea.focus();
        document.execCommand('delete');
      },
      copy: () => copySelection(),
      paste: () => {
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(text => { if (text) insertText(text); }).catch(() => {});
        }
      },
      delete: () => {
        if (textarea.selectionStart === textarea.selectionEnd) return;
        textarea.focus();
        document.execCommand('delete');
      },
      selectall: () => {
        textarea.focus();
        textarea.select();
      },
      datetime: () => {
        const now = new Date();
        const lang = window.i18n && window.i18n.getLanguage() === 'en' ? 'en-US' : 'ru-RU';
        const time = now.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString(lang, { day: '2-digit', month: '2-digit', year: 'numeric' });
        insertText(`${time} ${date}`);
      },
      wrap: () => {
        doc.wrap = !doc.wrap;
        textarea.setAttribute('wrap', doc.wrap ? 'soft' : 'off');
        textarea.classList.toggle('wrap', doc.wrap);
        el.querySelector('.notepad-opt-wrap').classList.toggle('is-checked', doc.wrap);
      },
      find: () => this.openFind(win, textarea),
      findnext: () => {
        if (this.findState.text) this.findNext(win, textarea);
        else this.openFind(win, textarea);
      },
      help: () => { if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp(); },
      about: () => window.winManager.openDialog({
        title: `${t('notepad.menuAbout')} ${t('app.notepad')}`,
        icon: 'notepad',
        message: t('notepad.aboutText')
      })
    };

    el.querySelectorAll('.notepad-menubar [data-cmd]').forEach(opt => {
      opt.addEventListener('click', () => actions[opt.dataset.cmd]());
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
        actions.datetime();
      } else if (e.key === 'F3') {
        e.preventDefault();
        actions.findnext();
      } else if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 's' || key === 'o' || key === 'n') {
          e.preventDefault();
          actions[{ s: 'save', o: 'open', n: 'new' }[key]]();
        }
      }
    });

    textarea.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const hasSelection = textarea.selectionStart !== textarea.selectionEnd;
      if (!window.contextMenu) return;
      window.contextMenu.show(e.clientX, e.clientY, [
        { label: t('notepad.menuUndo'), action: actions.undo },
        { separator: true },
        { label: t('notepad.menuCut'), disabled: !hasSelection, action: actions.cut },
        { label: t('notepad.menuCopy'), disabled: !hasSelection, action: actions.copy },
        { label: t('notepad.menuPaste'), action: actions.paste },
        { label: t('notepad.menuDelete'), disabled: !hasSelection, action: actions.delete },
        { separator: true },
        { label: t('notepad.menuSelectAll'), disabled: !textarea.value.length, action: actions.selectall }
      ]);
    });

    win.beforeClose = () => {
      if (!modified() || doc.closing) return true;
      confirmDiscard(() => {
        doc.closing = true;
        window.winManager.closeWindow(winId);
      });
      return false;
    };
    win.onClose = () => {
      const findId = 'notepad_find_' + winId;
      if (window.winManager.windows.has(findId)) window.winManager.closeWindow(findId);
    };
  }

  openFind(win, textarea) {
    const t = (k, ...a) => this.t(k, ...a);
    const id = 'notepad_find_' + win.id;
    if (window.winManager.windows.has(id)) {
      window.winManager.bringToTop(id);
      return;
    }
    const rect = win.element.getBoundingClientRect();
    const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    if (selected && !selected.includes('\n')) this.findState.text = selected;
    const dlg = window.winManager.createWindow({
      id,
      title: t('notepad.findTitle'),
      icon: 'find',
      width: 360,
      height: 'auto',
      x: Math.max(0, rect.left + 40),
      y: Math.max(0, rect.top + 60),
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="np-find">
          <div class="np-find-main">
            <div class="np-find-row">
              <label>${t('notepad.findWhat')}</label>
              <input type="text" class="np-find-text">
            </div>
            <div class="np-find-row np-find-options">
              <label class="np-find-check"><input type="checkbox" class="np-find-case"${this.findState.matchCase ? ' checked' : ''}> ${t('notepad.matchCase')}</label>
              <fieldset class="np-find-dir">
                <legend>${t('notepad.direction')}</legend>
                <label><input type="radio" name="np-dir-${win.id}" value="up"${this.findState.down ? '' : ' checked'}> ${t('notepad.up')}</label>
                <label><input type="radio" name="np-dir-${win.id}" value="down"${this.findState.down ? ' checked' : ''}> ${t('notepad.down')}</label>
              </fieldset>
            </div>
          </div>
          <div class="np-find-buttons">
            <button class="win-btn is-default np-find-next">${t('notepad.menuFindNext')}</button>
            <button class="win-btn np-find-cancel">${t('btn.cancel')}</button>
          </div>
        </div>`
    });
    const q = s => dlg.element.querySelector(s);
    const input = q('.np-find-text');
    input.value = this.findState.text;
    const sync = () => {
      this.findState.text = input.value;
      this.findState.matchCase = q('.np-find-case').checked;
      const dir = dlg.element.querySelector(`input[name="np-dir-${win.id}"]:checked`);
      this.findState.down = !dir || dir.value === 'down';
      q('.np-find-next').disabled = !input.value;
    };
    sync();
    input.addEventListener('input', sync);
    dlg.element.querySelectorAll('input').forEach(i => i.addEventListener('change', sync));
    q('.np-find-next').addEventListener('click', () => {
      sync();
      if (this.findState.text) this.findNext(win, textarea);
    });
    q('.np-find-cancel').addEventListener('click', () => window.winManager.closeWindow(id));
    dlg.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        q('.np-find-next').click();
      } else if (e.key === 'Escape') {
        window.winManager.closeWindow(id);
      }
    });
    setTimeout(() => { input.focus(); input.select(); }, 0);
  }

  findNext(win, textarea) {
    const { text, matchCase, down } = this.findState;
    const hay = matchCase ? textarea.value : textarea.value.toLowerCase();
    const needle = matchCase ? text : text.toLowerCase();
    const index = down
      ? hay.indexOf(needle, textarea.selectionEnd)
      : hay.lastIndexOf(needle, Math.max(0, textarea.selectionStart - 1));
    if (index < 0 || (!down && index >= textarea.selectionStart)) {
      window.winManager.openDialog({ title: this.t('app.notepad'), icon: 'info', message: this.t('notepad.cannotFind', text) });
      return;
    }
    textarea.focus();
    textarea.setSelectionRange(index, index + text.length);
    const line = textarea.value.slice(0, index).split('\n').length - 1;
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 16;
    const top = line * lineHeight;
    if (top < textarea.scrollTop || top > textarea.scrollTop + textarea.clientHeight - lineHeight) {
      textarea.scrollTop = Math.max(0, top - textarea.clientHeight / 2);
    }
  }
}

window.appNotepad = new AppNotepad();
