class AppWordPad {
  constructor() {
    this.currentFileName = 'Реферат по истории 1998.rtf';
    this.currentPath = ['My Computer', 'C:', 'My Documents'];
    this.fonts = ['Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia', 'Impact', 'Lucida Console', 'MS Sans Serif', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'];
    this.sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    this.colors = [
      ['#000000', 'black'], ['#800000', 'maroon'], ['#008000', 'green'], ['#808000', 'olive'],
      ['#000080', 'navy'], ['#800080', 'purple'], ['#008080', 'teal'], ['#808080', 'gray'],
      ['#c0c0c0', 'silver'], ['#ff0000', 'red'], ['#00ff00', 'lime'], ['#ffff00', 'yellow'],
      ['#0000ff', 'blue'], ['#ff00ff', 'fuchsia'], ['#00ffff', 'aqua'], ['#ffffff', 'white']
    ];
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  saveFile(content, fileName = null, path = null) {
    if (fileName) this.currentFileName = fileName;
    if (path) this.currentPath = path;
    if (window.vfs) window.vfs.writeFile(this.currentPath, this.currentFileName, content);
  }

  displayName(doc) {
    return doc.fileName ? doc.fileName.replace(/\.(rtf|doc|txt|wri)$/i, '') : this.t('wordpad.docName');
  }

  titleFor(doc) {
    return `${this.displayName(doc)} - ${this.t('wordpad.title')}`;
  }

  getDefaultContent() {
    return `
      <p style="text-align:center"><span style="font-size:16pt; color:#000080"><b>РЕФЕРАТ ПО ИСТОРИИ И ИНФОРМАТИКЕ</b></span></p>
      <p style="text-align:center"><i>Тема: Развитие компьютерных технологий в конце XX века (1998 год)</i></p>
      <p><br></p>
      <p><b>1. Введение</b></p>
      <p>Операционная система <i>Microslop Win 98</i> ознаменовала переход к эпохе полноценного мультимедиа и всемирной сети Интернет. Встроенная поддержка шины USB, архитектура драйверов WDM и ускорение 3D-графики DirectX открыли невиданные ранее возможности для персональных компьютеров.</p>
      <p><br></p>
      <p><b>2. Основные компоненты мультимедийного ПК 1998 года:</b></p>
      <ul>
        <li><b>Процессор:</b> Intel Pentium II Deschutes 300–450 МГц</li>
        <li><b>3D-ускоритель:</b> 3dfx Voodoo2 12 МБ (Glide API)</li>
        <li><b>Оперативная память:</b> 64–128 МБ SDRAM PC100</li>
        <li><b>Звуковая карта:</b> Creative Sound Blaster AWE64 Gold / Live!</li>
        <li><b>Модем:</b> USRobotics Sportster 56k V.90 Faxmodem</li>
      </ul>
      <p><br></p>
      <p><b>3. Заключение</b></p>
      <p>Таким образом, персональный компьютер 1998 года стал универсальным центром для работы, учёбы, трёхмерных игр и общения по электронной почте и ICQ.</p>
    `;
  }

  toHtml(content) {
    if (/^\[RTF Document/.test(String(content || ''))) return this.getDefaultContent();
    const text = String(content || '');
    if (/<[a-z][\s\S]*>/i.test(text)) return text;
    if (!text) return '<p><br></p>';
    return text.split(/\r?\n/).map(line => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;') || '<br>'}</p>`).join('');
  }

  open(fileName = null, content = null, path = null) {
    if (fileName) this.currentFileName = fileName;
    if (path) this.currentPath = path;
    const doc = {
      fileName: fileName || null,
      path: (path || this.currentPath).slice(),
      saved: ''
    };
    const winId = 'app_wordpad_' + Date.now();
    const holder = document.createElement('div');
    holder.className = 'wordpad-window';
    holder.innerHTML = this.buildHTML();
    const win = window.winManager.createWindow({
      id: winId,
      title: this.titleFor(doc),
      icon: 'wordpad',
      width: 680,
      height: 480,
      minWidth: 360,
      minHeight: 240,
      content: holder
    });
    const page = win.element.querySelector('.wordpad-page');
    page.innerHTML = this.toHtml(content);
    doc.saved = page.innerHTML;
    this.buildRuler(win.element.querySelector('.wordpad-ruler-scale'));
    this.attachEvents(win, winId, doc);
    setTimeout(() => page.focus(), 0);
    return win;
  }

  menuItem(cmd, label, shortcut = '', extra = '') {
    return `<div class="win-dropdown-option${extra}" data-cmd="${cmd}">${label}${shortcut ? ` <span>${shortcut}</span>` : ''}</div>`;
  }

  buildHTML() {
    const t = (k, ...a) => this.t(k, ...a);
    const m = (...a) => this.menuItem(...a);
    const sep = '<div class="win-menu-separator"></div>';
    const tool = (cmd, icon, tip) => `<button class="wp-tool" data-cmd="${cmd}" title="${tip}">${Icons[icon]}</button>`;
    const toolSep = '<span class="wp-tool-sep"></span>';
    const fontOptions = this.fonts.map(f => `<div class="wp-combo-item" data-value="${f}" style="font-family:'${f}'">${f}</div>`).join('');
    const sizeOptions = this.sizes.map(s => `<div class="wp-combo-item" data-value="${s}">${s}</div>`).join('');
    const colorOptions = this.colors.map(([hex, name]) => `<div class="wp-color-item" data-color="${hex}"><span class="wp-color-swatch" style="background:${hex}"></span>${t('wordpad.color.' + name)}</div>`).join('');
    return `
      <div class="win-menubar wp-menubar">
        <div class="win-menu-item">${t('wordpad.menuFile')}
          <div class="win-menu-dropdown">
            ${m('new', t('wordpad.menuNew'), 'Ctrl+N')}
            ${m('open', t('wordpad.menuOpen'), 'Ctrl+O')}
            ${m('save', t('wordpad.menuSave'), 'Ctrl+S')}
            ${m('saveas', t('wordpad.menuSaveAs'))}
            ${sep}
            ${m('print', t('wordpad.menuPrint'), 'Ctrl+P')}
            ${m('preview', t('wordpad.menuPreview'))}
            ${sep}
            ${m('exit', t('wordpad.menuExit'))}
          </div>
        </div>
        <div class="win-menu-item">${t('wordpad.menuEdit')}
          <div class="win-menu-dropdown">
            ${m('undo', t('wordpad.menuUndo'), 'Ctrl+Z')}
            ${sep}
            ${m('cut', t('wordpad.menuCut'), 'Ctrl+X')}
            ${m('copy', t('wordpad.menuCopy'), 'Ctrl+C')}
            ${m('paste', t('wordpad.menuPaste'), 'Ctrl+V')}
            ${m('clear', t('wordpad.menuClear'), 'Del')}
            ${m('selectall', t('wordpad.menuSelectAll'), 'Ctrl+A')}
            ${sep}
            ${m('find', t('wordpad.menuFind'), 'Ctrl+F')}
            ${m('findnext', t('wordpad.menuFindNext'), 'F3')}
          </div>
        </div>
        <div class="win-menu-item">${t('wordpad.menuView')}
          <div class="win-menu-dropdown">
            ${m('view-toolbar', t('wordpad.menuToolbar'), '', ' is-checked')}
            ${m('view-formatbar', t('wordpad.menuFormatBar'), '', ' is-checked')}
            ${m('view-ruler', t('wordpad.menuRuler'), '', ' is-checked')}
            ${m('view-statusbar', t('wordpad.menuStatusBar'), '', ' is-checked')}
          </div>
        </div>
        <div class="win-menu-item">${t('wordpad.menuInsert')}
          <div class="win-menu-dropdown">
            ${m('datetime', t('wordpad.menuDateTime'))}
          </div>
        </div>
        <div class="win-menu-item">${t('wordpad.menuFormat')}
          <div class="win-menu-dropdown">
            ${m('bold', t('wordpad.btnBold'), 'Ctrl+B')}
            ${m('italic', t('wordpad.btnItalic'), 'Ctrl+I')}
            ${m('underline', t('wordpad.btnUnderline'), 'Ctrl+U')}
            ${sep}
            ${m('bullets', t('wordpad.menuBullet'))}
            ${sep}
            ${m('left', t('wordpad.btnLeft'))}
            ${m('center', t('wordpad.btnCenter'))}
            ${m('right', t('wordpad.btnRight'))}
          </div>
        </div>
        <div class="win-menu-item">${t('wordpad.menuHelp')}
          <div class="win-menu-dropdown">
            ${m('help', t('wordpad.menuHelpTopics'))}
            ${sep}
            ${m('about', t('wordpad.menuAbout'))}
          </div>
        </div>
      </div>
      <div class="wp-bar wp-toolbar">
        ${tool('new', 'tb16-new', t('wordpad.tipNew'))}
        ${tool('open', 'tb16-open', t('wordpad.tipOpen'))}
        ${tool('save', 'tb16-save', t('wordpad.tipSave'))}
        ${toolSep}
        ${tool('print', 'tb16-print', t('wordpad.tipPrint'))}
        ${tool('preview', 'tb16-preview', t('wordpad.tipPreview'))}
        ${toolSep}
        ${tool('find', 'tb16-find', t('wordpad.tipFind'))}
        ${toolSep}
        ${tool('cut', 'tb16-cut', t('wordpad.tipCut'))}
        ${tool('copy', 'tb16-copy', t('wordpad.tipCopy'))}
        ${tool('paste', 'tb16-paste', t('wordpad.tipPaste'))}
        ${tool('undo', 'tb16-undo', t('wordpad.tipUndo'))}
        ${toolSep}
        ${tool('datetime', 'tb16-datetime', t('wordpad.tipDateTime'))}
      </div>
      <div class="wp-bar wp-formatbar">
        <div class="wp-combo wp-font">
          <input type="text" class="wp-combo-input" value="Times New Roman" spellcheck="false">
          <button class="wp-combo-drop" tabindex="-1"></button>
          <div class="wp-combo-list">${fontOptions}</div>
        </div>
        <div class="wp-combo wp-script">
          <input type="text" class="wp-combo-input" value="${t('wordpad.scriptCyrillic')}" readonly>
          <button class="wp-combo-drop" tabindex="-1"></button>
          <div class="wp-combo-list">
            <div class="wp-combo-item" data-value="${t('wordpad.scriptCyrillic')}">${t('wordpad.scriptCyrillic')}</div>
            <div class="wp-combo-item" data-value="${t('wordpad.scriptWestern')}">${t('wordpad.scriptWestern')}</div>
          </div>
        </div>
        <div class="wp-combo wp-size">
          <input type="text" class="wp-combo-input" value="10" spellcheck="false">
          <button class="wp-combo-drop" tabindex="-1"></button>
          <div class="wp-combo-list">${sizeOptions}</div>
        </div>
        ${toolSep}
        ${tool('bold', 'tb16-bold', t('wordpad.btnBold'))}
        ${tool('italic', 'tb16-italic', t('wordpad.btnItalic'))}
        ${tool('underline', 'tb16-underline', t('wordpad.btnUnderline'))}
        <div class="wp-color-wrap">
          ${tool('color', 'tb16-color', t('wordpad.btnColor'))}
          <div class="wp-color-list">${colorOptions}</div>
        </div>
        ${toolSep}
        ${tool('left', 'tb16-align-left', t('wordpad.btnLeft'))}
        ${tool('center', 'tb16-align-center', t('wordpad.btnCenter'))}
        ${tool('right', 'tb16-align-right', t('wordpad.btnRight'))}
        ${toolSep}
        ${tool('bullets', 'tb16-bullets', t('wordpad.btnList'))}
      </div>
      <div class="wp-ruler">
        <div class="wordpad-ruler-scale"></div>
      </div>
      <div class="wordpad-editor-wrap">
        <div class="wordpad-page" contenteditable="true" spellcheck="false"></div>
      </div>
      <div class="win-statusbar wp-statusbar">
        <div class="win-status-pane grow wp-status-text">${t('wordpad.statusHelp')}</div>
        <div class="win-status-pane wp-status-num">NUM</div>
      </div>
    `;
  }

  buildRuler(scale) {
    if (!scale) return;
    const pxPerCm = 96 / 2.54;
    let marks = '';
    for (let i = 0; i <= 64; i++) {
      const x = Math.round(i * pxPerCm / 4);
      const kind = i % 4 === 0 ? 'num' : i % 2 === 0 ? 'half' : 'quarter';
      if (kind === 'num' && i > 0) marks += `<span class="wp-ruler-num" style="left:${x}px">${i / 4}</span>`;
      else if (kind !== 'num') marks += `<span class="wp-ruler-tick ${kind}" style="left:${x}px"></span>`;
    }
    const width = Math.round(16.5 * pxPerCm);
    scale.innerHTML = `<div class="wp-ruler-white" style="width:${width}px">${marks}</div>
      <span class="wp-ruler-indent first"></span><span class="wp-ruler-indent hanging"></span><span class="wp-ruler-indent right" style="left:${width}px"></span>`;
  }

  attachEvents(win, winId, doc) {
    const t = (k, ...a) => this.t(k, ...a);
    const el = win.element;
    const page = el.querySelector('.wordpad-page');
    const setTitle = () => window.winManager.setTitle(winId, this.titleFor(doc));
    let savedRange = null;

    const rememberSelection = () => {
      const sel = window.getSelection();
      if (sel.rangeCount && page.contains(sel.anchorNode)) savedRange = sel.getRangeAt(0).cloneRange();
    };
    const restoreSelection = () => {
      page.focus();
      if (!savedRange) return;
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    };
    const exec = (cmd, val = null) => {
      restoreSelection();
      document.execCommand('styleWithCSS', false, true);
      document.execCommand(cmd, false, val);
      rememberSelection();
      syncState();
    };
    const setFontSize = (pt) => {
      restoreSelection();
      document.execCommand('styleWithCSS', false, false);
      document.execCommand('fontSize', false, '7');
      page.querySelectorAll('font[size="7"]').forEach(font => {
        const span = document.createElement('span');
        span.style.fontSize = pt + 'pt';
        while (font.firstChild) span.appendChild(font.firstChild);
        font.replaceWith(span);
      });
      rememberSelection();
      syncState();
    };

    const modified = () => page.innerHTML !== doc.saved;
    const writeTo = (path, name) => {
      if (!window.vfs.writeFile(path, name, page.innerHTML)) return false;
      doc.fileName = name;
      doc.path = path;
      doc.saved = page.innerHTML;
      this.currentFileName = name;
      this.currentPath = path;
      setTitle();
      if (window.appClippy && window.appClippy.onDocumentSaved) window.appClippy.onDocumentSaved('wordpad', name, page.textContent || '', winId);
      return true;
    };
    win.isModified = modified;
    const filters = [
      { label: t('wordpad.filterRtf'), exts: ['rtf'] },
      { label: t('wordpad.filterDoc'), exts: ['doc'] },
      { label: t('wordpad.filterTxt'), exts: ['txt'] },
      { label: t('fdlg.allFiles'), exts: ['*'] }
    ];
    const saveAs = (then) => window.fileDialog.show({
      mode: 'save',
      path: doc.path,
      fileName: doc.fileName || this.t('wordpad.docName'),
      filters,
      onOk: (path, name) => { if (writeTo(path, name) && then) then(); }
    });
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
        title: t('wordpad.title'),
        icon: 'warning',
        message: t('wordpad.saveChanges', this.displayName(doc)),
        buttons: [
          { text: 'Yes', primary: true, onClick: () => setTimeout(() => save(then), 0) },
          { text: 'No', onClick: () => {
            if (window.appClippy && window.appClippy.onDocumentDiscarded) window.appClippy.onDocumentDiscarded('wordpad', this.displayName(doc));
            then();
          } },
          { text: 'Cancel' }
        ]
      });
    };
    const load = (path, name) => {
      const content = window.vfs.readFile(path, name);
      if (content === null || content === undefined) return;
      page.innerHTML = this.toHtml(content);
      doc.saved = page.innerHTML;
      doc.fileName = name;
      doc.path = path;
      this.currentFileName = name;
      this.currentPath = path;
      setTitle();
    };

    const toggleBar = (cmd, selector) => {
      const bar = el.querySelector(selector);
      const hidden = bar.classList.toggle('hidden');
      el.querySelector(`.wp-menubar [data-cmd="${cmd}"]`).classList.toggle('is-checked', !hidden);
    };

    const actions = {
      new: () => confirmDiscard(() => {
        page.innerHTML = '<p><br></p>';
        doc.saved = page.innerHTML;
        doc.fileName = null;
        setTitle();
      }),
      open: () => confirmDiscard(() => window.fileDialog.show({ mode: 'open', path: doc.path, filters, onOk: load })),
      save: () => save(),
      saveas: () => saveAs(),
      print: () => this.printDialog(doc),
      preview: () => this.openPreview(win, doc, page),
      exit: () => window.winManager.closeWindow(winId),
      undo: () => exec('undo'),
      cut: () => exec('cut'),
      copy: () => exec('copy'),
      paste: () => {
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(text => { if (text) exec('insertText', text); }).catch(() => exec('paste'));
        } else {
          exec('paste');
        }
      },
      clear: () => exec('delete'),
      selectall: () => exec('selectAll'),
      find: () => this.openFind(win, page),
      findnext: () => {
        if (this.findText) this.findNext(page);
        else this.openFind(win, page);
      },
      'view-toolbar': () => toggleBar('view-toolbar', '.wp-toolbar'),
      'view-formatbar': () => toggleBar('view-formatbar', '.wp-formatbar'),
      'view-ruler': () => toggleBar('view-ruler', '.wp-ruler'),
      'view-statusbar': () => toggleBar('view-statusbar', '.wp-statusbar'),
      datetime: () => this.openDateTime(win, (text) => exec('insertText', text)),
      bold: () => exec('bold'),
      italic: () => exec('italic'),
      underline: () => exec('underline'),
      left: () => exec('justifyLeft'),
      center: () => exec('justifyCenter'),
      right: () => exec('justifyRight'),
      bullets: () => exec('insertUnorderedList'),
      color: () => el.querySelector('.wp-color-wrap').classList.toggle('open'),
      help: () => { if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp(); },
      about: () => window.winManager.openDialog({ title: t('wordpad.aboutTitle'), icon: 'wordpad', message: t('wordpad.aboutText') })
    };

    el.querySelectorAll('[data-cmd]').forEach(node => {
      node.addEventListener('mousedown', e => {
        if (node.classList.contains('wp-tool')) e.preventDefault();
      });
      node.addEventListener('click', () => {
        const fn = actions[node.dataset.cmd];
        if (fn) fn();
      });
    });

    el.querySelectorAll('.wp-color-item').forEach(item => {
      item.addEventListener('mousedown', e => e.preventDefault());
      item.addEventListener('click', () => {
        el.querySelector('.wp-color-wrap').classList.remove('open');
        exec('foreColor', item.dataset.color);
      });
    });

    const closeCombos = (except) => el.querySelectorAll('.wp-combo.open').forEach(c => { if (c !== except) c.classList.remove('open'); });
    el.querySelectorAll('.wp-combo').forEach(combo => {
      const input = combo.querySelector('.wp-combo-input');
      const apply = (value) => {
        input.value = value;
        combo.classList.remove('open');
        if (combo.classList.contains('wp-font')) exec('fontName', value);
        else if (combo.classList.contains('wp-size')) {
          const pt = parseInt(value, 10);
          if (pt > 0 && pt <= 1638) setFontSize(pt);
        } else restoreSelection();
      };
      combo.querySelector('.wp-combo-drop').addEventListener('mousedown', e => {
        e.preventDefault();
        closeCombos(combo);
        combo.classList.toggle('open');
        const current = combo.querySelector(`.wp-combo-item[data-value="${CSS.escape(input.value)}"]`);
        combo.querySelectorAll('.wp-combo-item.selected').forEach(i => i.classList.remove('selected'));
        if (current) {
          current.classList.add('selected');
          current.scrollIntoView({ block: 'nearest' });
        }
      });
      combo.querySelectorAll('.wp-combo-item').forEach(item => {
        item.addEventListener('mousedown', e => e.preventDefault());
        item.addEventListener('click', () => apply(item.dataset.value));
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          apply(input.value.trim());
        } else if (e.key === 'Escape') {
          combo.classList.remove('open');
          restoreSelection();
        }
      });
    });
    el.addEventListener('mousedown', e => {
      if (!e.target.closest('.wp-combo')) closeCombos(null);
      if (!e.target.closest('.wp-color-wrap')) el.querySelector('.wp-color-wrap').classList.remove('open');
    });

    const syncState = () => {
      const q = (cmd) => { try { return document.queryCommandState(cmd); } catch (e) { return false; } };
      const pressed = { bold: q('bold'), italic: q('italic'), underline: q('underline'), bullets: q('insertUnorderedList'), left: q('justifyLeft'), center: q('justifyCenter'), right: q('justifyRight') };
      if (!pressed.center && !pressed.right) pressed.left = true;
      Object.keys(pressed).forEach(cmd => {
        const btn = el.querySelector(`.wp-formatbar .wp-tool[data-cmd="${cmd}"]`);
        if (btn) btn.classList.toggle('pressed', !!pressed[cmd]);
      });
      const sel = window.getSelection();
      const node = sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
      const target = node && page.contains(node) ? (node.nodeType === 1 ? node : node.parentElement) : null;
      if (!target) return;
      const style = getComputedStyle(target);
      const family = style.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      const fontInput = el.querySelector('.wp-font .wp-combo-input');
      const sizeInput = el.querySelector('.wp-size .wp-combo-input');
      if (document.activeElement !== fontInput) fontInput.value = family;
      if (document.activeElement !== sizeInput) sizeInput.value = String(Math.round(parseFloat(style.fontSize) * 0.75));
    };

    const onSelection = () => {
      if (!el.isConnected) {
        document.removeEventListener('selectionchange', onSelection);
        return;
      }
      const sel = window.getSelection();
      if (sel.rangeCount && page.contains(sel.anchorNode)) {
        rememberSelection();
        syncState();
      }
    };
    document.addEventListener('selectionchange', onSelection);

    page.addEventListener('keydown', e => {
      if (e.key === 'F3') {
        e.preventDefault();
        actions.findnext();
        return;
      }
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      const map = { s: 'save', o: 'open', n: 'new', p: 'print', f: 'find' };
      if (map[key]) {
        e.preventDefault();
        actions[map[key]]();
      }
    });

    const statusText = el.querySelector('.wp-status-text');
    el.querySelectorAll('.wp-tool').forEach(btn => {
      btn.addEventListener('mouseenter', () => { statusText.textContent = btn.title; });
      btn.addEventListener('mouseleave', () => { statusText.textContent = t('wordpad.statusHelp'); });
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
      document.removeEventListener('selectionchange', onSelection);
      ['wp_find_', 'wp_preview_', 'wp_datetime_'].forEach(prefix => {
        if (window.winManager.windows.has(prefix + winId)) window.winManager.closeWindow(prefix + winId);
      });
    };
  }

  printDialog(doc) {
    const dlg = window.winManager.openDialog({
      title: this.t('wordpad.title'),
      icon: 'wordpad',
      message: this.t('notepad.printing', this.displayName(doc)),
      buttons: [{ text: 'Cancel' }]
    });
    setTimeout(() => { if (window.winManager.windows.has(dlg.id)) window.winManager.closeWindow(dlg.id); }, 1600);
  }

  openPreview(win, doc, page) {
    const id = 'wp_preview_' + win.id;
    if (window.winManager.windows.has(id)) return;
    const t = (k, ...a) => this.t(k, ...a);
    const preview = window.winManager.createWindow({
      id,
      title: this.titleFor(doc),
      icon: 'wordpad',
      width: 520,
      height: 460,
      content: `
        <div class="wp-preview">
          <div class="wp-preview-bar">
            <button class="win-btn wp-pv-print">${t('wordpad.pvPrint')}</button>
            <button class="win-btn" disabled>${t('wordpad.pvNext')}</button>
            <button class="win-btn" disabled>${t('wordpad.pvPrev')}</button>
            <button class="win-btn wp-pv-close">${t('wordpad.pvClose')}</button>
          </div>
          <div class="wp-preview-area"><div class="wp-preview-page"><div class="wp-preview-content">${page.innerHTML}</div></div></div>
          <div class="win-statusbar"><div class="win-status-pane grow">${t('wordpad.pvPage')}</div></div>
        </div>`
    });
    preview.element.querySelector('.wp-pv-close').addEventListener('click', () => window.winManager.closeWindow(id));
    preview.element.querySelector('.wp-pv-print').addEventListener('click', () => {
      window.winManager.closeWindow(id);
      this.printDialog(doc);
    });
  }

  dateFormats() {
    const now = new Date();
    const en = window.i18n && window.i18n.getLanguage() === 'en';
    const pad = n => String(n).padStart(2, '0');
    const d = now.getDate();
    const mo = now.getMonth() + 1;
    const y = now.getFullYear();
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const monthsRu = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (en) {
      return [`${mo}/${d}/${String(y).slice(2)}`, `${mo}/${d}/${y}`, `${pad(mo)}/${pad(d)}/${String(y).slice(2)}`, `${monthsEn[mo - 1]} ${d}, ${y}`, time];
    }
    return [`${pad(d)}.${pad(mo)}.${String(y).slice(2)}`, `${pad(d)}.${pad(mo)}.${y}`, `${d} ${monthsRu[mo - 1]} ${y} г.`, `${d}/${mo}/${y}`, time];
  }

  openDateTime(win, insert) {
    const id = 'wp_datetime_' + win.id;
    if (window.winManager.windows.has(id)) return;
    const t = (k, ...a) => this.t(k, ...a);
    const formats = this.dateFormats();
    const dlg = window.winManager.createWindow({
      id,
      title: t('wordpad.dateTitle'),
      icon: 'wordpad',
      width: 290,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="wp-datetime">
          <div class="wp-datetime-main">
            <label>${t('wordpad.dateFormats')}</label>
            <div class="wp-datetime-list" tabindex="0">${formats.map((f, i) => `<div class="wp-datetime-item${i === 0 ? ' selected' : ''}">${f}</div>`).join('')}</div>
          </div>
          <div class="wp-datetime-buttons">
            <button class="win-btn is-default wp-dt-ok">${t('btn.ok')}</button>
            <button class="win-btn wp-dt-cancel">${t('btn.cancel')}</button>
          </div>
        </div>`
    });
    const list = dlg.element.querySelector('.wp-datetime-list');
    const ok = () => {
      const selected = list.querySelector('.selected');
      window.winManager.closeWindow(id);
      if (selected) insert(selected.textContent);
    };
    list.addEventListener('click', e => {
      const item = e.target.closest('.wp-datetime-item');
      if (!item) return;
      list.querySelectorAll('.selected').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });
    list.addEventListener('dblclick', ok);
    dlg.element.querySelector('.wp-dt-ok').addEventListener('click', ok);
    dlg.element.querySelector('.wp-dt-cancel').addEventListener('click', () => window.winManager.closeWindow(id));
  }

  openFind(win, page) {
    const id = 'wp_find_' + win.id;
    if (window.winManager.windows.has(id)) {
      window.winManager.bringToTop(id);
      return;
    }
    const t = (k, ...a) => this.t(k, ...a);
    const dlg = window.winManager.createWindow({
      id,
      title: t('notepad.findTitle'),
      icon: 'find',
      width: 360,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="np-find">
          <div class="np-find-main">
            <div class="np-find-row"><label>${t('notepad.findWhat')}</label><input type="text" class="np-find-text"></div>
            <label class="np-find-check"><input type="checkbox" class="np-find-case"> ${t('notepad.matchCase')}</label>
          </div>
          <div class="np-find-buttons">
            <button class="win-btn is-default np-find-next">${t('notepad.menuFindNext')}</button>
            <button class="win-btn np-find-cancel">${t('btn.cancel')}</button>
          </div>
        </div>`
    });
    const q = s => dlg.element.querySelector(s);
    const input = q('.np-find-text');
    input.value = this.findText || '';
    const run = () => {
      this.findText = input.value;
      this.findCase = q('.np-find-case').checked;
      if (this.findText) this.findNext(page);
    };
    q('.np-find-next').addEventListener('click', run);
    q('.np-find-cancel').addEventListener('click', () => window.winManager.closeWindow(id));
    dlg.element.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); run(); }
      if (e.key === 'Escape') window.winManager.closeWindow(id);
    });
    setTimeout(() => input.focus(), 0);
  }

  findNext(page) {
    const sel = window.getSelection();
    if (!sel.rangeCount || !page.contains(sel.anchorNode)) {
      const range = document.createRange();
      range.setStart(page, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    const found = window.find && window.find(this.findText, !!this.findCase, false, false, false, false, false);
    if (!found || !page.contains(window.getSelection().anchorNode)) {
      window.winManager.openDialog({ title: this.t('wordpad.title'), icon: 'info', message: this.t('wordpad.searchDone') });
    }
  }
}

window.appWordPad = new AppWordPad();
