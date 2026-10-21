class AppClipboardViewer {
  constructor() {
    this.winId = 'win-clipbrd';
    this.displayMode = 'auto';
    this.pollTimer = null;
    this.lastExplorerRef = null;
    this.lastPaintRef = null;

    this.state = {
      type: 'text',
      format: 'CF_TEXT',
      source: 'Система Microslop Win 98 SE',
      timestamp: '15.10.1998 14:22:08',
      text: [
        '=== БУФЕР ОБМЕНА MICROSLOP WIN 98 SE (CLIPBRD.EXE) ===',
        'Попробуй скопировать любой текст (Ctrl+C), файл в Проводнике',
        'или выделенный фрагмент в графическом редакторе Paint!',
        'Также доступна кнопка [Снимок экрана PrtScn], передающая',
        'скриншот рабочего стола напрямую в буфер Paint.'
      ].join('\n'),
      bitmapCanvas: null,
      hdrop: null
    };

    this.bindGlobalClipboardHooks();
  }

  bindGlobalClipboardHooks() {
    if (typeof document === 'undefined' || !document.addEventListener) return;

    document.addEventListener('copy', () => {
      try {
        const sel = window.getSelection ? String(window.getSelection()) : '';
        if (sel && sel.trim()) {
          this.setText(sel, 'Системный буфер (Ctrl+C)');
        }
      } catch (e) {}
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        this.captureScreenSnapshot(e.altKey);
      }
    });
  }

  nowStamp() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `15.10.1998 ${hh}:${mm}:${ss}`;
  }

  syncExternalClipboards() {
    if (window.appExplorer && window.appExplorer.clipboardItem && window.appExplorer.clipboardItem !== this.lastExplorerRef) {
      this.lastExplorerRef = window.appExplorer.clipboardItem;
      this.setHdrop(this.lastExplorerRef);
    }
    if (window.appPaint && window.appPaint.clipboard && window.appPaint.clipboard !== this.lastPaintRef) {
      this.lastPaintRef = window.appPaint.clipboard;
      this.setBitmap(this.lastPaintRef, 'Графический редактор Paint (Ctrl+C)');
    }
  }

  setText(text, source = 'Прикладная программа Win 98') {
    this.state = {
      type: 'text',
      format: 'CF_TEXT',
      source,
      timestamp: this.nowStamp(),
      text: String(text || ''),
      bitmapCanvas: null,
      hdrop: null
    };
    this.refreshUI();
  }

  setHdrop(clipObj) {
    if (!clipObj || !clipObj.item) return;
    const fullPath = [...(clipObj.path || ['My Computer', 'C:']), clipObj.item.name].join('\\');
    this.state = {
      type: 'hdrop',
      format: 'CF_HDROP',
      source: clipObj.isCut ? 'Проводник Win 98 (Вырезать)' : 'Проводник Win 98 (Копировать)',
      timestamp: this.nowStamp(),
      text: `${fullPath}\nОперация: ${clipObj.isCut ? 'Перемещение (DROPEFFECT_MOVE)' : 'Копирование (DROPEFFECT_COPY)'}`,
      bitmapCanvas: null,
      hdrop: {
        name: clipObj.item.name,
        fullPath,
        isCut: !!clipObj.isCut,
        type: clipObj.item.type || 'file',
        size: clipObj.item.size || '4 КБ',
        preview: clipObj.item.content ? String(clipObj.item.content).slice(0, 320) : ''
      }
    };
    this.refreshUI();
  }

  setBitmap(canvasEl, source = 'Точечный рисунок GDI (CF_DIB)') {
    if (!canvasEl) return;
    this.state = {
      type: 'bitmap',
      format: 'CF_DIB',
      source,
      timestamp: this.nowStamp(),
      text: `[Точечный рисунок DIB ${canvasEl.width || 320}x${canvasEl.height || 240} • 24-бит RGB]`,
      bitmapCanvas: canvasEl,
      hdrop: null
    };
    if (window.appPaint) {
      this.lastPaintRef = canvasEl;
      window.appPaint.clipboard = canvasEl;
    }
    this.refreshUI();
  }

  clearClipboard() {
    this.state = {
      type: 'empty',
      format: 'CF_NONE',
      source: 'Буфер обмена очищен',
      timestamp: this.nowStamp(),
      text: '',
      bitmapCanvas: null,
      hdrop: null
    };
    if (window.appExplorer) window.appExplorer.clipboardItem = null;
    if (window.appPaint) window.appPaint.clipboard = null;
    this.lastExplorerRef = null;
    this.lastPaintRef = null;
    this.refreshUI();
  }

  captureScreenSnapshot(activeWindowOnly = false) {
    const canvas = document.createElement('canvas');
    const w = activeWindowOnly ? 360 : 480;
    const h = activeWindowOnly ? 250 : 320;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#008080';
    ctx.fillRect(0, 0, w, h);

    if (!activeWindowOnly) {
      const iconLabels = ['Мой компьютер', 'Мои документы', 'Корзина', 'Internet Explorer', 'Игромания CD'];
      iconLabels.forEach((lbl, idx) => {
        const y = 14 + idx * 46;
        ctx.fillStyle = '#ffff55';
        ctx.fillRect(16, y, 20, 18);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(16, y, 20, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px Tahoma, sans-serif';
        ctx.fillText(lbl, 6, y + 30);
      });
    }

    const wins = (window.winManager && window.winManager.windows)
      ? Array.from(window.winManager.windows.values())
      : [];

    const drawWinBox = (wx, wy, ww, wh, title, active) => {
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.fillStyle = active ? '#000080' : '#808080';
      ctx.fillRect(wx + 3, wy + 3, ww - 6, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Tahoma, sans-serif';
      ctx.fillText(String(title || 'Окно Win 98').slice(0, 32), wx + 8, wy + 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(wx + 5, wy + 22, ww - 10, wh - 28);
      ctx.fillStyle = '#000080';
      ctx.font = '10px monospace';
      ctx.fillText('Microslop Win 98 SE GDI Snapshot', wx + 12, wy + 42);
    };

    if (activeWindowOnly) {
      const lastWin = wins.length ? wins[wins.length - 1] : null;
      const title = (lastWin && lastWin.opts && lastWin.opts.title) || 'Активное окно Win 98';
      drawWinBox(10, 10, w - 20, h - 20, title, true);
    } else {
      wins.slice(-3).forEach((winObj, idx) => {
        const title = (winObj && winObj.opts && winObj.opts.title) || `Окно #${idx + 1}`;
        drawWinBox(88 + idx * 28, 26 + idx * 24, 290, 195, title, idx === Math.min(2, wins.length - 1));
      });

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(0, h - 22, w, 22);
      ctx.fillStyle = '#008000';
      ctx.fillRect(3, h - 19, 46, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Tahoma, sans-serif';
      ctx.fillText('Пуск', 12, h - 7);
    }

    this.setBitmap(
      canvas,
      activeWindowOnly ? 'Снимок активного окна (Alt+PrtScn)' : 'Снимок экрана Рабочего стола (Print Screen)'
    );
    return canvas;
  }

  formatToHexDump(str) {
    const text = String(str || '');
    if (!text.length) return '00000000  [Буфер пуст]';
    const lines = [];
    for (let offset = 0; offset < Math.min(text.length, 512); offset += 16) {
      const slice = text.slice(offset, offset + 16);
      const hexCols = [];
      let asciiCols = '';
      for (let i = 0; i < 16; i++) {
        if (i < slice.length) {
          const code = slice.charCodeAt(i) & 0xff;
          hexCols.push(code.toString(16).toUpperCase().padStart(2, '0'));
          asciiCols += (code >= 32 && code < 127) ? slice[i] : '.';
        } else {
          hexCols.push('  ');
          asciiCols += ' ';
        }
      }
      const addr = offset.toString(16).toUpperCase().padStart(8, '0');
      lines.push(`${addr}  ${hexCols.slice(0, 8).join(' ')}  ${hexCols.slice(8).join(' ')}  |${asciiCols}|`);
    }
    return lines.join('\n');
  }

  open(clpFileName = null, clpContent = null) {
    if (clpFileName || clpContent) {
      this.loadFromClpData(clpFileName, clpContent);
    }

    if (window.winManager && window.winManager.windows.has(this.winId)) {
      const existing = window.winManager.windows.get(this.winId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.winId);
      else window.winManager.bringToTop(this.winId);
      this.syncExternalClipboards();
      this.refreshUI();
      return existing;
    }

    const content = `
      <div class="clp-shell" id="${this.winId}-shell">
        <div class="clp-menubar">
          <div class="clp-menu-item" data-menu="file">
            <span><u>Ф</u>айл</span>
            <div class="clp-dropdown">
              <div class="clp-menu-opt" data-cmd="open-secret"><span>Открыть SECRET_CLIP.CLP...</span></div>
              <div class="clp-menu-opt" data-cmd="save-clp"><span>Сохранить буфер как BUFFER98.CLP</span></div>
              <div class="clp-menu-sep"></div>
              <div class="clp-menu-opt" data-cmd="exit"><span>Выход</span></div>
            </div>
          </div>
          <div class="clp-menu-item" data-menu="edit">
            <span><u>П</u>равка</span>
            <div class="clp-dropdown">
              <div class="clp-menu-opt" data-cmd="prtscn"><span>Снимок всего экрана (Print Screen)</span></div>
              <div class="clp-menu-opt" data-cmd="alt-prtscn"><span>Снимок активного окна (Alt+PrtScn)</span></div>
              <div class="clp-menu-sep"></div>
              <div class="clp-menu-opt" data-cmd="clear"><span>Удалить (Очистить буфер обмена)</span></div>
            </div>
          </div>
          <div class="clp-menu-item" data-menu="display">
            <span><u>Э</u>кран</span>
            <div class="clp-dropdown">
              <div class="clp-menu-opt checked" id="${this.winId}-m-auto" data-cmd="disp-auto"><span>Авто (Формат источника)</span></div>
              <div class="clp-menu-sep"></div>
              <div class="clp-menu-opt" id="${this.winId}-m-ansi" data-cmd="disp-ansi"><span>Текст ANSI (CF_TEXT)</span></div>
              <div class="clp-menu-opt" id="${this.winId}-m-oem" data-cmd="disp-oem"><span>Текст OEM DOS CP866 (CF_OEMTEXT)</span></div>
              <div class="clp-menu-opt" id="${this.winId}-m-hex" data-cmd="disp-hex"><span>Шестнадцатеричный дамп (Hex Dump)</span></div>
              <div class="clp-menu-opt" id="${this.winId}-m-bmp" data-cmd="disp-bitmap"><span>Точечный рисунок (CF_DIB)</span></div>
            </div>
          </div>
          <div class="clp-menu-item" data-menu="help">
            <span><u>С</u>правка</span>
            <div class="clp-dropdown">
              <div class="clp-menu-opt" data-cmd="about"><span>О программе «Просмотр буфера обмена»</span></div>
            </div>
          </div>
        </div>

        <div class="clp-toolbar">
          <button class="clp-tb-btn" data-cmd="open-secret" title="Открыть файл буфера .CLP">&#128194; Открыть .CLP</button>
          <button class="clp-tb-btn" data-cmd="save-clp" title="Сохранить содержимое в C:\\My Documents\\BUFFER98.CLP">&#128190; Сохранить .CLP</button>
          <div class="clp-tb-sep"></div>
          <button class="clp-tb-btn" data-cmd="prtscn" title="Сделать снимок экрана в буфер обмена">&#128247; Снимок экрана</button>
          <button class="clp-tb-btn" data-cmd="open-paint" title="Открыть Paint для вставки снимка">&#127912; В Paint</button>
          <div class="clp-tb-sep"></div>
          <button class="clp-tb-btn" data-cmd="disp-auto" id="${this.winId}-tb-auto">Авто</button>
          <button class="clp-tb-btn" data-cmd="disp-oem" id="${this.winId}-tb-oem">OEM 866</button>
          <button class="clp-tb-btn" data-cmd="disp-hex" id="${this.winId}-tb-hex">HEX</button>
          <div class="clp-tb-sep"></div>
          <button class="clp-tb-btn" data-cmd="clear" title="Очистить системный буфер обмена">&#10006; Очистить</button>
        </div>

        <div class="clp-format-strip">
          <div class="clp-format-badges" id="${this.winId}-badges"></div>
          <span id="${this.winId}-source-label" style="color:#000080;font-weight:bold;"></span>
        </div>

        <div class="clp-mdi-workspace">
          <div class="clp-child-window">
            <div class="clp-child-titlebar">
              <span id="${this.winId}-child-title">Буфер обмена (Локальный компьютер)</span>
              <span id="${this.winId}-child-time">15.10.1998</span>
            </div>
            <div class="clp-viewport" id="${this.winId}-viewport"></div>
          </div>
        </div>

        <div class="clp-statusbar">
          <div class="clp-status-cell" id="${this.winId}-st-left">Готово</div>
          <div class="clp-status-cell" id="${this.winId}-st-mid">Формат: CF_TEXT</div>
          <div class="clp-status-cell" id="${this.winId}-st-right">Размер: 0 байт</div>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.winId,
      title: 'Просмотр буфера обмена',
      icon: 'clipbrd',
      width: 550,
      height: 390,
      minWidth: 430,
      minHeight: 300,
      resizable: true,
      maximizable: true,
      minimizable: true,
      content,
      onClose: () => this.cleanup()
    });

    this.bindEvents();
    this.syncExternalClipboards();
    this.refreshUI();
    this.startPolling();
    return win;
  }

  bindEvents() {
    const shell = document.getElementById(`${this.winId}-shell`);
    if (!shell) return;

    const menuItems = shell.querySelectorAll('.clp-menu-item');
    menuItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.clp-menu-opt')) return;
        const wasOpen = item.classList.contains('open');
        menuItems.forEach((m) => m.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });

    shell.addEventListener('click', (e) => {
      if (!e.target.closest('.clp-menu-item')) {
        menuItems.forEach((m) => m.classList.remove('open'));
      }
      const cmdNode = e.target.closest('[data-cmd]');
      if (cmdNode) {
        menuItems.forEach((m) => m.classList.remove('open'));
        this.handleCommand(cmdNode.dataset.cmd);
      }
    });
  }

  handleCommand(cmd) {
    switch (cmd) {
      case 'open-secret':
        this.openSecretClpFromVfs();
        break;
      case 'save-clp':
        this.saveCurrentToClp();
        break;
      case 'prtscn':
        this.captureScreenSnapshot(false);
        break;
      case 'alt-prtscn':
        this.captureScreenSnapshot(true);
        break;
      case 'open-paint':
        if (!this.state.bitmapCanvas) {
          this.captureScreenSnapshot(false);
        }
        if (window.appPaint && typeof window.appPaint.open === 'function') {
          window.appPaint.open();
        }
        break;
      case 'clear':
        this.clearClipboard();
        break;
      case 'disp-auto':
        this.setDisplayMode('auto');
        break;
      case 'disp-ansi':
        this.setDisplayMode('ansi');
        break;
      case 'disp-oem':
        this.setDisplayMode('oem');
        break;
      case 'disp-hex':
        this.setDisplayMode('hex');
        break;
      case 'disp-bitmap':
        this.setDisplayMode('bitmap');
        break;
      case 'exit':
        if (window.winManager) window.winManager.closeWindow(this.winId);
        break;
      case 'about':
        if (window.winManager && typeof window.winManager.openDialog === 'function') {
          window.winManager.openDialog({
            title: 'О программе «Просмотр буфера обмена»',
            icon: 'clipbrd',
            message: 'Просмотр буфера обмена Microslop Win 98 SE (CLIPBRD.EXE v4.10.1998)\nОтображение форматов CF_TEXT, CF_OEMTEXT, CF_DIB и CF_HDROP, сохранение файлов .CLP и снимки экрана.'
          });
        }
        break;
    }
  }

  setDisplayMode(mode) {
    this.displayMode = mode;
    this.refreshUI();
  }

  openSecretClpFromVfs() {
    if (window.vfs) {
      const node = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'SECRET_CLIP.CLP']);
      if (node && node.content) {
        this.loadFromClpData('SECRET_CLIP.CLP', node.content);
        return;
      }
    }
    this.loadFromClpData(
      'SECRET_CLIP.CLP',
      '=== ДАМП БУФЕРА ОБМЕНА WIN 98 (SECRET_CLIP.CLP) ===\nПароль архиватора: 1998\nУзел FidoNet: Night Owl BBS 2:5020/98 (т. 095-932-4812)\nЧастота разгона шины FSB в BIOS: 112 МГц (CAS Latency 2)'
    );
  }

  loadFromClpData(fileName, content) {
    this.state = {
      type: 'text',
      format: 'CF_OEMTEXT',
      source: `Файл буфера: ${fileName || 'BUFFER98.CLP'}`,
      timestamp: this.nowStamp(),
      text: String(content || ''),
      bitmapCanvas: null,
      hdrop: null
    };
    this.refreshUI();
  }

  saveCurrentToClp() {
    if (!window.vfs) return;
    const myDocs = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents']);
    if (myDocs && myDocs.children) {
      const body = [
        `[CLIPBRD.EXE DUMP • ${this.state.timestamp}]`,
        `Format=${this.state.format}`,
        `Source=${this.state.source}`,
        '',
        this.state.text || '[Двоичные данные буфера обмена]'
      ].join('\n');

      myDocs.children['BUFFER98.CLP'] = {
        type: 'file',
        icon: 'file-clp',
        app: 'clipbrd',
        size: `${body.length} байт`,
        content: body
      };
      if (typeof window.vfs.save === 'function') window.vfs.save();
    }
    if (window.appExplorer && typeof window.appExplorer.refresh === 'function') {
      window.appExplorer.refresh();
    }
    const stLeft = document.getElementById(`${this.winId}-st-left`);
    if (stLeft) stLeft.textContent = 'Сохранено в C:\\My Documents\\BUFFER98.CLP';
  }

  refreshUI() {
    const vp = document.getElementById(`${this.winId}-viewport`);
    if (!vp) return;

    const badgesEl = document.getElementById(`${this.winId}-badges`);
    const srcEl = document.getElementById(`${this.winId}-source-label`);
    const timeEl = document.getElementById(`${this.winId}-child-time`);
    const stLeft = document.getElementById(`${this.winId}-st-left`);
    const stMid = document.getElementById(`${this.winId}-st-mid`);
    const stRight = document.getElementById(`${this.winId}-st-right`);

    const syncCheck = (id, cond) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.toggle('checked', cond);
        el.classList.toggle('active', cond);
      }
    };
    syncCheck(`${this.winId}-m-auto`, this.displayMode === 'auto');
    syncCheck(`${this.winId}-m-ansi`, this.displayMode === 'ansi');
    syncCheck(`${this.winId}-m-oem`, this.displayMode === 'oem');
    syncCheck(`${this.winId}-m-hex`, this.displayMode === 'hex');
    syncCheck(`${this.winId}-m-bmp`, this.displayMode === 'bitmap');
    syncCheck(`${this.winId}-tb-auto`, this.displayMode === 'auto');
    syncCheck(`${this.winId}-tb-oem`, this.displayMode === 'oem');
    syncCheck(`${this.winId}-tb-hex`, this.displayMode === 'hex');

    const formats = ['CF_TEXT', 'CF_OEMTEXT', 'CF_DIB', 'CF_HDROP'];
    if (badgesEl) {
      badgesEl.innerHTML = formats.map((f) => (
        `<span class="clp-fmt-pill ${this.state.format === f ? 'active' : ''}">${f}</span>`
      )).join('');
    }
    if (srcEl) srcEl.textContent = this.state.source;
    if (timeEl) timeEl.textContent = this.state.timestamp;

    vp.className = 'clp-viewport';
    vp.innerHTML = '';

    if (this.state.type === 'empty') {
      vp.textContent = '[Буфер обмена Microslop Win 98 пуст]';
      if (stLeft) stLeft.textContent = 'Буфер обмена пуст';
      if (stMid) stMid.textContent = 'Формат: CF_NONE';
      if (stRight) stRight.textContent = 'Размер: 0 байт';
      return;
    }

    if (this.displayMode === 'hex') {
      vp.classList.add('hex');
      vp.textContent = this.formatToHexDump(this.state.text);
    } else if (this.displayMode === 'oem') {
      vp.classList.add('oem');
      vp.textContent = `╔══ КОДИРОВКА OEM DOS CP866 ══╗\n${this.state.text}`;
    } else if ((this.displayMode === 'auto' || this.displayMode === 'bitmap') && this.state.type === 'bitmap' && this.state.bitmapCanvas) {
      const wrap = document.createElement('div');
      wrap.className = 'clp-bitmap-wrap';
      const info = document.createElement('div');
      info.textContent = `${this.state.text} — Доступно для вставки (Ctrl+V) в Paint!`;
      this.state.bitmapCanvas.className = 'clp-bitmap-canvas';
      wrap.appendChild(info);
      wrap.appendChild(this.state.bitmapCanvas);
      vp.appendChild(wrap);
    } else if (this.displayMode === 'auto' && this.state.type === 'hdrop' && this.state.hdrop) {
      const h = this.state.hdrop;
      vp.innerHTML = `
        <div class="clp-hdrop-card">
          <div><strong>Дескриптор файлов Проводника (CF_HDROP):</strong></div>
          <div>Файл / Папка: <strong>${h.name}</strong> (${h.size})</div>
          <div>Полный путь VFS: <code>${h.fullPath}</code></div>
          <div>Режим буфера: <strong>${h.isCut ? 'Вырезать (Перемещение)' : 'Копировать'}</strong></div>
          ${h.preview ? `<hr style="border:0;border-top:1px dashed #808080;width:100%;"><div><strong>Предпросмотр содержимого:</strong><br><code>${h.preview}</code></div>` : ''}
        </div>
      `;
    } else {
      vp.textContent = this.state.text;
    }

    const byteSize = this.state.bitmapCanvas
      ? (this.state.bitmapCanvas.width * this.state.bitmapCanvas.height * 3)
      : (this.state.text ? this.state.text.length : 0);

    if (stLeft) stLeft.textContent = `Источник: ${this.state.source}`;
    if (stMid) stMid.textContent = `Формат: ${this.state.format}`;
    if (stRight) stRight.textContent = `Размер: ${byteSize} байт`;
  }

  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.syncExternalClipboards();
    }, 800);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  cleanup() {
    this.stopPolling();
  }
}

window.appClipboardViewer = new AppClipboardViewer();
window.systemClipboard = window.appClipboardViewer;
