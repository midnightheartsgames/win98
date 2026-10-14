/**
 * WinCommander 98 (Total Commander / Norton Commander Parody)
 * Classic dual-pane file manager with drive selector, F3-F8 function keys,
 * VFS file copying/moving/deletion/folder creation, and command prompt.
 */
class AppWinCommander {
  constructor() {
    this.leftPath = ['My Computer', 'C:', 'My Documents'];
    this.rightPath = ['My Computer', 'C:', 'Program Files'];
    this.activePane = 'left'; // 'left' or 'right'
    this.leftSelected = new Set();
    this.rightSelected = new Set();
    this.leftCursor = 0;
    this.rightCursor = 0;
  }

  open() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const winId = 'app_wincmd_' + Date.now();
    const win = window.winManager.createWindow({
      id: winId,
      title: `${t('wincmd.title')} - [C:\\My Documents\\*.*]`,
      icon: 'wincommander',
      width: 720,
      height: 480,
      content: this.buildHTML(winId)
    });

    this.initEvents(win, winId);
  }

  buildHTML(winId) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    return `
      <div class="wincmd-container" id="${winId}_root">
        <!-- Menubar -->
        <div class="win-menubar">
          <div class="win-menu-item">
            ${t('wincmd.menuFiles')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option wincmd-opt-view">${t('wincmd.menuView')} <span>F3</span></div>
              <div class="win-dropdown-option wincmd-opt-edit">${t('wincmd.menuEdit')} <span>F4</span></div>
              <div class="win-dropdown-option wincmd-opt-copy">${t('wincmd.menuCopy')} <span>F5</span></div>
              <div class="win-dropdown-option wincmd-opt-move">${t('wincmd.menuMove')} <span>F6</span></div>
              <div class="win-dropdown-option wincmd-opt-mkdir">${t('wincmd.menuMkdir')} <span>F7</span></div>
              <div class="win-dropdown-option wincmd-opt-del">${t('wincmd.menuDelete')} <span>F8</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option wincmd-opt-exit">${t('wincmd.menuExit')} <span>Alt+F4</span></div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('wincmd.menuSelection')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option wincmd-opt-sel-all">${t('wincmd.menuSelectAll')} <span>Ctrl+A</span></div>
              <div class="win-dropdown-option wincmd-opt-unsel-all">${t('wincmd.menuUnselectAll')}</div>
              <div class="win-dropdown-option wincmd-opt-inv-sel">${t('wincmd.menuInvert')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('wincmd.menuCommands')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option wincmd-opt-refresh">${t('wincmd.menuRefresh')} <span>Ctrl+R</span></div>
              <div class="win-dropdown-option wincmd-opt-cmd">${t('wincmd.cmdLaunchDos')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('wincmd.menuHelp')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option wincmd-opt-about">${t('wincmd.menuAbout')}</div>
            </div>
          </div>
        </div>

        <!-- Drive Selector Bar -->
        <div class="wincmd-drive-bar">
          <span style="font-size:11px; margin-right:4px;">${t('wincmd.leftPane')}</span>
          <button class="win-btn wincmd-drive-btn" id="${winId}_l_btn_c">[-C-]</button>
          <button class="win-btn wincmd-drive-btn" id="${winId}_l_btn_d">[-D-]</button>
          <div style="flex:1;"></div>
          <span style="font-size:11px; margin-right:4px;">${t('wincmd.rightPane')}</span>
          <button class="win-btn wincmd-drive-btn" id="${winId}_r_btn_c">[-C-]</button>
          <button class="win-btn wincmd-drive-btn" id="${winId}_r_btn_d">[-D-]</button>
        </div>

        <!-- Dual Panes Area -->
        <div class="wincmd-panes-wrap">
          <!-- Left Pane -->
          <div class="wincmd-pane active" id="${winId}_pane_left">
            <div class="wincmd-pane-header" id="${winId}_left_path">C:\\My Documents\\*.*</div>
            <div class="wincmd-table-head">
              <div>${t('wincmd.colName')}</div>
              <div>${t('wincmd.colExt')}</div>
              <div>${t('wincmd.colSize')}</div>
              <div>${t('wincmd.colDate')}</div>
            </div>
            <div class="wincmd-file-list" id="${winId}_left_list"></div>
            <div class="wincmd-pane-summary" id="${winId}_left_sum"></div>
          </div>

          <!-- Right Pane -->
          <div class="wincmd-pane" id="${winId}_pane_right">
            <div class="wincmd-pane-header" id="${winId}_right_path">C:\\Program Files\\*.*</div>
            <div class="wincmd-table-head">
              <div>${t('wincmd.colName')}</div>
              <div>${t('wincmd.colExt')}</div>
              <div>${t('wincmd.colSize')}</div>
              <div>${t('wincmd.colDate')}</div>
            </div>
            <div class="wincmd-file-list" id="${winId}_right_list"></div>
            <div class="wincmd-pane-summary" id="${winId}_right_sum"></div>
          </div>
        </div>

        <!-- Command Prompt Bar -->
        <div class="wincmd-cmd-row">
          <span class="wincmd-cmd-prompt" id="${winId}_cmd_prompt">C:\\&gt;</span>
          <input type="text" class="wincmd-cmd-input" id="${winId}_cmd_input" placeholder="${t('wincmd.cmdPromptPlaceholder')}">
        </div>

        <!-- Function Keys F3 - F8 -->
        <div class="wincmd-fkeys-row">
          <button class="wincmd-fkey-btn" id="${winId}_f3"><span class="wincmd-fkey-num">F3</span> ${t('wincmd.btnView').replace(/^F3\s*/, '')}</button>
          <button class="wincmd-fkey-btn" id="${winId}_f4"><span class="wincmd-fkey-num">F4</span> ${t('wincmd.btnEdit').replace(/^F4\s*/, '')}</button>
          <button class="wincmd-fkey-btn" id="${winId}_f5"><span class="wincmd-fkey-num">F5</span> ${t('wincmd.btnCopy').replace(/^F5\s*/, '')}</button>
          <button class="wincmd-fkey-btn" id="${winId}_f6"><span class="wincmd-fkey-num">F6</span> ${t('wincmd.btnMove').replace(/^F6\s*/, '')}</button>
          <button class="wincmd-fkey-btn" id="${winId}_f7"><span class="wincmd-fkey-num">F7</span> ${t('wincmd.btnMkdir').replace(/^F7\s*/, '')}</button>
          <button class="wincmd-fkey-btn" id="${winId}_f8"><span class="wincmd-fkey-num">F8</span> ${t('wincmd.btnDelete').replace(/^F8\s*/, '')}</button>
          <button class="wincmd-fkey-btn" id="${winId}_alt_f4"><span class="wincmd-fkey-num">Alt+F4</span> ${t('wincmd.btnExit').replace(/^Alt\+F4\s*/, '')}</button>
        </div>
      </div>
    `;
  }

  initEvents(win, winId) {
    const el = win.element;
    const paneLeftEl = el.querySelector(`#${winId}_pane_left`);
    const paneRightEl = el.querySelector(`#${winId}_pane_right`);
    const cmdInput = el.querySelector(`#${winId}_cmd_input`);
    const cmdPrompt = el.querySelector(`#${winId}_cmd_prompt`);

    const renderPanes = () => {
      this.renderPane(win, winId, 'left');
      this.renderPane(win, winId, 'right');
      cmdPrompt.textContent = this.formatPathForPrompt(this.activePane === 'left' ? this.leftPath : this.rightPath) + '>';
    };

    renderPanes();

    // Switch active pane on click
    paneLeftEl.addEventListener('click', () => {
      this.activePane = 'left';
      paneLeftEl.classList.add('active');
      paneRightEl.classList.remove('active');
      cmdPrompt.textContent = this.formatPathForPrompt(this.leftPath) + '>';
    });

    paneRightEl.addEventListener('click', () => {
      this.activePane = 'right';
      paneRightEl.classList.add('active');
      paneLeftEl.classList.remove('active');
      cmdPrompt.textContent = this.formatPathForPrompt(this.rightPath) + '>';
    });

    // Drive switch buttons
    el.querySelector(`#${winId}_l_btn_c`).addEventListener('click', () => {
      this.leftPath = ['My Computer', 'C:'];
      this.renderPane(win, winId, 'left');
    });
    el.querySelector(`#${winId}_l_btn_d`).addEventListener('click', () => {
      this.leftPath = ['My Computer', 'D:'];
      this.renderPane(win, winId, 'left');
    });
    el.querySelector(`#${winId}_r_btn_c`).addEventListener('click', () => {
      this.rightPath = ['My Computer', 'C:'];
      this.renderPane(win, winId, 'right');
    });
    el.querySelector(`#${winId}_r_btn_d`).addEventListener('click', () => {
      this.rightPath = ['My Computer', 'D:'];
      this.renderPane(win, winId, 'right');
    });

    // Function buttons F3 - F8
    el.querySelector(`#${winId}_f3`).addEventListener('click', () => this.handleF3View(win, winId));
    el.querySelector(`#${winId}_f4`).addEventListener('click', () => this.handleF4Edit(win, winId));
    el.querySelector(`#${winId}_f5`).addEventListener('click', () => this.handleF5Copy(win, winId, renderPanes));
    el.querySelector(`#${winId}_f6`).addEventListener('click', () => this.handleF6Move(win, winId, renderPanes));
    el.querySelector(`#${winId}_f7`).addEventListener('click', () => this.handleF7Mkdir(win, winId, renderPanes));
    el.querySelector(`#${winId}_f8`).addEventListener('click', () => this.handleF8Delete(win, winId, renderPanes));
    el.querySelector(`#${winId}_alt_f4`).addEventListener('click', () => window.winManager.closeWindow(winId));

    // Menubar items
    const setupMenu = (sel, fn) => {
      const opt = el.querySelector(sel);
      if (opt) opt.addEventListener('click', fn);
    };

    setupMenu('.wincmd-opt-view', () => this.handleF3View(win, winId));
    setupMenu('.wincmd-opt-edit', () => this.handleF4Edit(win, winId));
    setupMenu('.wincmd-opt-copy', () => this.handleF5Copy(win, winId, renderPanes));
    setupMenu('.wincmd-opt-move', () => this.handleF6Move(win, winId, renderPanes));
    setupMenu('.wincmd-opt-mkdir', () => this.handleF7Mkdir(win, winId, renderPanes));
    setupMenu('.wincmd-opt-del', () => this.handleF8Delete(win, winId, renderPanes));
    setupMenu('.wincmd-opt-refresh', renderPanes);
    setupMenu('.wincmd-opt-exit', () => window.winManager.closeWindow(winId));
    setupMenu('.wincmd-opt-about', () => {
      const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
      window.winManager.openDialog({
        title: t('wincmd.aboutTitle'),
        icon: 'wincommander',
        message: t('wincmd.aboutMsg')
      });
    });

    // Command Prompt input
    cmdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = cmdInput.value.trim();
        cmdInput.value = '';
        this.executeCommand(cmd, win, winId, renderPanes);
      }
    });
  }

  formatPathForPrompt(pathParts) {
    if (!pathParts || pathParts.length <= 1) return 'C:\\';
    const clean = pathParts.slice(1);
    return clean.join('\\');
  }

  renderPane(win, winId, side) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const isLeft = side === 'left';
    const path = isLeft ? this.leftPath : this.rightPath;
    const listEl = win.element.querySelector(`#${winId}_${side}_list`);
    const pathEl = win.element.querySelector(`#${winId}_${side}_path`);
    const sumEl = win.element.querySelector(`#${winId}_${side}_sum`);
    const selectedSet = isLeft ? this.leftSelected : this.rightSelected;

    pathEl.textContent = this.formatPathForPrompt(path) + '\\*.*';
    listEl.innerHTML = '';

    const items = window.vfs ? window.vfs.list(path) : [];

    // Add [..] parent directory if not at root drive
    if (path.length > 2) {
      const upRow = document.createElement('div');
      upRow.className = 'wincmd-file-row is-folder';
      upRow.innerHTML = `
        <div>[..]</div>
        <div>${t('wincmd.upDir')}</div>
        <div></div>
        <div>--/--/----</div>
      `;
      upRow.addEventListener('dblclick', () => {
        if (isLeft) this.leftPath.pop();
        else this.rightPath.pop();
        this.renderPane(win, winId, side);
      });
      listEl.appendChild(upRow);
    }

    let totalBytes = 0;

    items.forEach((item, idx) => {
      const isFolder = item.type === 'folder' || item.type === 'drive';
      const nameParts = (item.name || item.key).split('.');
      const baseName = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : item.name;
      const ext = nameParts.length > 1 ? nameParts[nameParts.length - 1].toUpperCase() : (isFolder ? t('wincmd.folder') : '');
      const sizeStr = isFolder ? '' : (item.size || '12 KB');

      const isSelected = selectedSet.has(item.name || item.key);
      const isCursor = (isLeft ? this.leftCursor : this.rightCursor) === idx;

      const row = document.createElement('div');
      row.className = `wincmd-file-row ${isFolder ? 'is-folder' : ''} ${isSelected ? 'selected' : ''} ${isCursor ? 'cursor' : ''}`;
      row.innerHTML = `
        <div style="overflow:hidden; text-overflow:ellipsis;">${isFolder ? `[${baseName}]` : baseName}</div>
        <div>${ext}</div>
        <div>${sizeStr}</div>
        <div>18/11/98</div>
      `;

      // Click: set cursor & toggle selection with Space/click
      row.addEventListener('click', (e) => {
        if (isLeft) this.leftCursor = idx;
        else this.rightCursor = idx;
        if (e.ctrlKey || e.shiftKey) {
          if (isSelected) selectedSet.delete(item.name || item.key);
          else selectedSet.add(item.name || item.key);
        }
        this.renderPane(win, winId, side);
      });

      // Double click: open folder or run executable
      row.addEventListener('dblclick', () => {
        if (isFolder) {
          if (isLeft) this.leftPath.push(item.key || item.name);
          else this.rightPath.push(item.key || item.name);
          this.renderPane(win, winId, side);
        } else {
          // Open file
          if (window.appExplorer) {
            window.appExplorer.openItem(win, item);
          }
        }
      });

      listEl.appendChild(row);
      totalBytes += 1024;
    });

    sumEl.textContent = t('wincmd.summary', items.length, selectedSet.size);
  }

  getActiveItem(side) {
    const isLeft = side === 'left';
    const path = isLeft ? this.leftPath : this.rightPath;
    const items = window.vfs ? window.vfs.list(path) : [];
    const cursor = isLeft ? this.leftCursor : this.rightCursor;
    return items[cursor] || null;
  }

  handleF3View(win, winId) {
    const item = this.getActiveItem(this.activePane);
    if (!item) return;

    const nameLower = (item.name || '').toLowerCase();
    if (nameLower && (nameLower.endsWith('.bmp') || nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg'))) {
      if (window.appImageViewer) {
        window.appImageViewer.open(item.name, item.content, this.activePane === 'left' ? this.leftPath : this.rightPath);
      }
      return;
    }

    if (nameLower && (nameLower.endsWith('.mp3') || nameLower.endsWith('.wav') || nameLower.endsWith('.mid') || nameLower.endsWith('.ogg') || nameLower.endsWith('.wsz'))) {
      if (window.appWinamp) {
        window.appWinamp.open(item.name, item.content, this.activePane === 'left' ? this.leftPath : this.rightPath);
      }
      return;
    }

    if (nameLower && (nameLower.endsWith('.avi') || nameLower.endsWith('.mp4') || nameLower.endsWith('.mpg') || nameLower.endsWith('.mpeg') || nameLower.endsWith('.mov'))) {
      if (window.appVideoPlayer) {
        window.appVideoPlayer.open(item.name, item.content, true);
      }
      return;
    }

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const content = item.content || `[${item.name}]\nSize: ${item.size || '32 KB'}\nFormat: Win 98 Portable Executable`;
    window.winManager.openDialog({
      title: t('wincmd.viewTitle', item.name),
      icon: 'file-txt',
      message: `<div style="font-family:var(--win-font-mono); white-space:pre-wrap; max-height:220px; overflow-y:auto; background:#fff; border:2px inset #808080; padding:6px; font-size:11px;">${content}</div>`
    });
  }

  handleF4Edit(win, winId) {
    const item = this.getActiveItem(this.activePane);
    if (!item) return;
    if (window.appNotepad) {
      window.appNotepad.open(item.name, item.content, this.activePane === 'left' ? this.leftPath : this.rightPath);
    }
  }

  handleF5Copy(win, winId, cb) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const srcPath = this.activePane === 'left' ? this.leftPath : this.rightPath;
    const destPath = this.activePane === 'left' ? this.rightPath : this.leftPath;
    const item = this.getActiveItem(this.activePane);
    if (!item) return;

    const confirmCopy = confirm(t('wincmd.confirmCopy', item.name, this.formatPathForPrompt(destPath)));
    if (confirmCopy && window.vfs) {
      const destFolder = window.vfs.resolvePath(destPath);
      if (destFolder && destFolder.children) {
        destFolder.children[item.name] = JSON.parse(JSON.stringify(item));
        window.vfs.saveToStorage();
        if (window.soundSys) window.soundSys.playClick();
        cb();
      }
    }
  }

  handleF6Move(win, winId, cb) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const srcPath = this.activePane === 'left' ? this.leftPath : this.rightPath;
    const destPath = this.activePane === 'left' ? this.rightPath : this.leftPath;
    const item = this.getActiveItem(this.activePane);
    if (!item) return;

    const confirmMove = confirm(t('wincmd.confirmMove', item.name, this.formatPathForPrompt(destPath)));
    if (confirmMove && window.vfs) {
      const destFolder = window.vfs.resolvePath(destPath);
      if (destFolder && destFolder.children) {
        destFolder.children[item.name] = JSON.parse(JSON.stringify(item));
        window.vfs.deleteItem(srcPath, item.key || item.name, false);
        window.vfs.saveToStorage();
        if (window.soundSys) window.soundSys.playClick();
        cb();
      }
    }
  }

  handleF7Mkdir(win, winId, cb) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const path = this.activePane === 'left' ? this.leftPath : this.rightPath;
    const name = prompt(t('wincmd.promptMkdir'), 'New Folder');
    if (name && name.trim() && window.vfs) {
      window.vfs.createFolder(path, name.trim());
      cb();
    }
  }

  handleF8Delete(win, winId, cb) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const path = this.activePane === 'left' ? this.leftPath : this.rightPath;
    const item = this.getActiveItem(this.activePane);
    if (!item) return;

    const confirmDel = confirm(t('wincmd.confirmDel', item.name));
    if (confirmDel && window.vfs) {
      window.vfs.deleteItem(path, item.key || item.name, true);
      cb();
    }
  }

  executeCommand(cmd, win, winId, cb) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    if (!cmd) return;
    const parts = cmd.split(' ');
    const op = parts[0].toLowerCase();

    if (op === 'cls') {
      // Clear
    } else if (op === 'calc' && window.appCalculator) {
      window.appCalculator.open();
    } else if (op === 'notepad' && window.appNotepad) {
      window.appNotepad.open();
    } else if (op === 'winmine' && window.appMinesweeper) {
      window.appMinesweeper.open();
    } else if (op === 'help') {
      alert(t('wincmd.cmdHelp'));
    } else if (op === 'cd') {
      const target = parts.slice(1).join(' ');
      const curPath = this.activePane === 'left' ? this.leftPath : this.rightPath;
      if (target === '..') {
        if (curPath.length > 2) curPath.pop();
      } else if (target) {
        curPath.push(target);
      }
      cb();
    } else if (op === 'exit') {
      window.winManager.closeWindow(winId);
    }
  }
}

window.appWinCommander = new AppWinCommander();
