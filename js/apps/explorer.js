class AppExplorer {
  constructor() {
    this.currentPath = ['My Computer'];
    this.history = [];
    this.historyIndex = -1;
    this.lastBounds = null;
  }

  loadBounds() {
    try {
      const raw = localStorage.getItem('win98_explorer_window_bounds') || localStorage.getItem('win98_bounds_app_explorer');
      if (raw) {
        const b = JSON.parse(raw);
        if (b && typeof b.width === 'number' && typeof b.height === 'number') {
          return b;
        }
      }
    } catch (e) {}
    return null;
  }

  saveBounds(b) {
    try {
      localStorage.setItem('win98_explorer_window_bounds', JSON.stringify(b));
      localStorage.setItem('win98_bounds_app_explorer', JSON.stringify(b));
    } catch (e) {}
  }

  open(initialPath = ['My Computer']) {
    if (window.winManager && window.winManager.windows.has('app_explorer')) {
      const existing = window.winManager.windows.get('app_explorer');
      if (existing.isMinimized) {
        window.winManager.restoreWindow('app_explorer');
      } else {
        window.winManager.bringToTop('app_explorer');
      }
      this.navigateTo(existing, initialPath);
      return;
    }

    this.currentPath = [...initialPath];
    this.history = [ [...this.currentPath] ];
    this.historyIndex = 0;

    const savedBounds = this.lastBounds || this.loadBounds();
    const width = savedBounds ? savedBounds.width : 540;
    const height = savedBounds ? savedBounds.height : 380;
    const x = savedBounds && typeof savedBounds.x === 'number'
      ? Math.max(0, Math.min((window.innerWidth || 1024) - 100, savedBounds.x))
      : (60 + (window.winManager.windows.size * 25) % 250);
    const y = savedBounds && typeof savedBounds.y === 'number'
      ? Math.max(0, Math.min((window.innerHeight || 768) - 100, savedBounds.y))
      : (50 + (window.winManager.windows.size * 25) % 180);

    const win = window.winManager.createWindow({
      id: 'app_explorer',
      title: this.getPathDisplay(),
      icon: this.getPathIcon(),
      width,
      height,
      x,
      y,
      content: this.buildHTML(),
      onClose: () => {
        if (win && win.element) {
          let bW = width, bH = height, bX = x, bY = y;
          if (win.isMaximized && win.prevBounds) {
            bW = win.prevBounds.width;
            bH = win.prevBounds.height;
            bX = win.prevBounds.x;
            bY = win.prevBounds.y;
          } else {
            const rect = win.element.getBoundingClientRect();
            bW = rect.width || width;
            bH = rect.height || height;
            bX = rect.left || x;
            bY = rect.top || y;
          }
          this.lastBounds = {
            width: Math.round(bW),
            height: Math.round(bH),
            x: Math.round(bX),
            y: Math.round(bY),
            isMaximized: !!win.isMaximized
          };
          this.saveBounds(this.lastBounds);
        }
      }
    });

    this.attachEvents(win);
    this.renderFolder(win);

    if (window.i18n) {
      window.i18n.addListener(() => {
        if (window.winManager && window.winManager.windows.has('app_explorer')) {
          this.renderFolder(win);
        }
      });
    }
  }

  getPathDisplay() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    if (this.currentPath.length === 1 && this.currentPath[0] === 'My Computer') {
      return t('app.myComputer');
    }
    const mapped = this.currentPath.map(p => {
      if (p === 'My Computer') return t('app.myComputer');
      if (p === 'Control Panel') return t('cpanel.title');
      if (p === 'My Documents') return t('app.myDocs');
      if (p === 'Мои рисунки') return t('app.myPictures');
      if (p === 'Моя музыка') return t('app.myMusic');
      if (p === 'Мои видео') return t('app.myVideos');
      if (p === 'Downloads' || p === 'downloads') return t('app.myDownloads');
      if (p === 'Accessories') return t('start.accessories');
      if (p === 'Games') return t('start.games');
      return p;
    });
    return mapped.slice(1).join('\\') || mapped[0];
  }

  getFolderName() {
    const display = this.getPathDisplay();
    return display.split('\\').pop() || display;
  }

  describeItem(item, labelText) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const title = `<div class="explorer-sidebar-item">${labelText}</div>`;
    if (item.key === 'C:') {
      return `${title}<div>${t('explorer.typeLocalDisk')}</div>
        <div>${t('explorer.capacity', t('explorer.capacityC'))}</div>
        <div class="explorer-disk-pie" style="--used: 29%"></div>
        <div class="explorer-disk-legend"><span class="swatch used"></span>${t('explorer.usedSpace', t('explorer.usedC'))}</div>
        <div class="explorer-disk-legend"><span class="swatch free"></span>${t('explorer.freeSpace', t('explorer.freeC'))}</div>`;
    }
    if (item.key === 'D:' || item.driveType === 'cdrom') return `${title}<div>${t('explorer.typeCdrom')}</div>`;
    if (item.type === 'folder' || (!item.type && item.children)) return `${title}<div>${t('explorer.typeFolder')}</div>`;
    const size = typeof item.content === 'string' ? item.content.length : 0;
    return `${title}<div>${t('explorer.typeFile')}</div>${size ? `<div>${t('explorer.fileSize', size.toLocaleString('ru-RU'))}</div>` : ''}`;
  }

  getPathIcon() {
    if (this.currentPath.length === 1 && this.currentPath[0] === 'My Computer') {
      return 'my-computer';
    }
    const last = this.currentPath[this.currentPath.length - 1];
    if (last === 'C:') return 'drive-c';
    if (last === 'D:') return 'drive-d';
    if (last === 'Control Panel') return 'control-panel';
    if (last === 'Мои рисунки') return 'folder-pictures';
    if (last === 'Моя музыка') return 'folder-music';
    if (last === 'Мои видео') return 'folder-videos';
    if (last === 'Downloads' || last === 'downloads') return 'folder-downloads';
    return 'folder';
  }

  buildHTML() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    return `
      <div class="explorer-container">
        <div class="win-menubar">
          <div class="win-menu-item">
            ${t('explorer.menuFile')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option exp-opt-new-folder">${t('explorer.newFolder')}</div>
              <div class="win-dropdown-option exp-opt-new-doc">${t('explorer.newDoc')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option exp-opt-del">${t('explorer.delete')}</div>
              <div class="win-dropdown-option exp-opt-rename">${t('explorer.rename')}</div>
              <div class="win-dropdown-option exp-opt-props">${t('explorer.properties')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option exp-opt-close">${t('explorer.close')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('explorer.menuEdit')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option exp-opt-cut">${t('explorer.cut')} <span>Ctrl+X</span></div>
              <div class="win-dropdown-option exp-opt-copy">${t('explorer.copy')} <span>Ctrl+C</span></div>
              <div class="win-dropdown-option exp-opt-paste">${t('explorer.paste')} <span>Ctrl+V</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option exp-opt-selectall">${t('explorer.selectAll')} <span>Ctrl+A</span></div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('explorer.menuView')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option exp-opt-refresh">${t('explorer.refresh')} <span>F5</span></div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('explorer.menuGo')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option exp-opt-back">${t('explorer.back')} <span>Alt+Left</span></div>
              <div class="win-dropdown-option exp-opt-forward">${t('explorer.forward')} <span>Alt+Right</span></div>
              <div class="win-dropdown-option exp-opt-up">${t('explorer.upOneLevel')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option exp-nav-mycomp">${t('app.myComputer')}</div>
              <div class="win-dropdown-option exp-nav-mydocs">${t('app.myDocs')}</div>
              <div class="win-dropdown-option exp-nav-mypics">${t('app.myPictures')}</div>
              <div class="win-dropdown-option exp-nav-mydownloads">${t('app.myDownloads')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('explorer.menuFavorites')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option exp-fav-softstore">&#128187; ${t('explorer.favSoftstore')}</div>
              <div class="win-dropdown-option exp-fav-gamestore">&#127918; ${t('explorer.favGamestore')}</div>
              <div class="win-dropdown-option exp-nav-mypics">&#128193; ${t('app.myPictures')}</div>
              <div class="win-dropdown-option exp-nav-mydownloads">&#128190; ${t('explorer.favDownloads')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('explorer.menuHelp')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option exp-opt-about">${t('explorer.about')}</div>
            </div>
          </div>
        </div>

        <div class="explorer-toolbar">
          <button class="explorer-tool-btn btn-back">${Icons['tb-back']}<span>${t('explorer.back')}</span></button>
          <button class="explorer-tool-btn btn-forward">${Icons['tb-forward']}<span>${t('explorer.forward')}</span></button>
          <button class="explorer-tool-btn btn-up">${Icons['tb-up']}<span>${t('explorer.up')}</span></button>
          <div class="explorer-tool-sep"></div>
          <button class="explorer-tool-btn btn-cut">${Icons['tb-cut']}<span>${t('explorer.cut')}</span></button>
          <button class="explorer-tool-btn btn-copy">${Icons['tb-copy']}<span>${t('explorer.copy')}</span></button>
          <button class="explorer-tool-btn btn-paste">${Icons['tb-paste']}<span>${t('explorer.paste')}</span></button>
          <div class="explorer-tool-sep"></div>
          <button class="explorer-tool-btn btn-delete">${Icons['tb-delete']}<span>${t('explorer.delete')}</span></button>
          <button class="explorer-tool-btn btn-props">${Icons['tb-properties']}<span>${t('menu.properties')}</span></button>
        </div>

        <div class="explorer-address-bar">
          <div class="explorer-address-label">${t('explorer.address')}</div>
          <div class="explorer-address-box">
            <span class="explorer-address-icon icon-small">${Icons[this.getPathIcon()] || Icons['folder']}</span>
            <input type="text" class="explorer-address-input" readonly value="${this.getPathDisplay()}">
            <span class="explorer-address-drop"></span>
          </div>
        </div>

        <div class="explorer-body">
          <div class="explorer-sidebar">
            <div class="explorer-sidebar-icon">${Icons[this.getPathIcon()] || Icons['folder']}</div>
            <div class="explorer-sidebar-title">${this.getFolderName()}</div>
            <div class="explorer-sidebar-rule"></div>
            <div class="explorer-sidebar-details">${t('explorer.sidebarDesc')}</div>
          </div>
          <div class="explorer-file-view"></div>
        </div>

        <div class="win-statusbar">
          <div class="win-status-pane explorer-status-items" style="width:120px;">${t('explorer.objectsCount', 0)}</div>
          <div class="win-status-pane explorer-status-space grow">${t('explorer.diskFree')}</div>
        </div>
      </div>
    `;
  }

  attachEvents(win) {
    const el = win.element;
    const btnBack = el.querySelector('.btn-back');
    const btnForward = el.querySelector('.btn-forward');
    const btnUp = el.querySelector('.btn-up');

    btnBack.addEventListener('click', () => {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.currentPath = [...this.history[this.historyIndex]];
        this.renderFolder(win);
      }
    });

    btnForward.addEventListener('click', () => {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.currentPath = [...this.history[this.historyIndex]];
        this.renderFolder(win);
      }
    });

    btnUp.addEventListener('click', () => {
      if (this.currentPath.length > 1) {
        this.navigateTo(win, this.currentPath.slice(0, -1));
      }
    });

    [['.btn-cut', '.exp-opt-cut'], ['.btn-copy', '.exp-opt-copy'], ['.btn-paste', '.exp-opt-paste'], ['.btn-delete', '.exp-opt-del'], ['.btn-props', '.exp-opt-props']].forEach(([button, option]) => {
      el.querySelector(button).addEventListener('click', () => el.querySelector(option).click());
    });

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const bindMenu = (sel, fn) => {
      const opt = el.querySelector(sel);
      if (opt) opt.addEventListener('click', fn);
    };

    bindMenu('.exp-opt-new-folder', () => {
      window.winManager.openPromptDialog({
        title: t('desktop.newFolder'),
        icon: 'folder',
        message: t('explorer.promptNewFolder'),
        value: 'New Folder',
        onOk: (name) => {
          if (name && name.trim() && window.vfs) {
            window.vfs.createFolder(this.currentPath, name.trim());
            this.renderFolder(win);
          }
        }
      });
    });

    bindMenu('.exp-opt-new-doc', () => {
      window.winManager.openPromptDialog({
        title: t('desktop.newTextDoc'),
        icon: 'file-txt',
        message: t('explorer.promptNewDoc'),
        value: 'New Document.txt',
        onOk: (name) => {
          if (name && name.trim() && window.vfs) {
            window.vfs.writeFile(this.currentPath, name.trim(), '');
            this.renderFolder(win);
          }
        }
      });
    });

    bindMenu('.exp-opt-del', () => {
      if (this.selectedItem && window.vfs) {
        window.winManager.openDialog({
          title: t('explorer.confirmDeleteTitle'),
          icon: 'warning',
          message: t('explorer.confirmRecycle', this.selectedItem.name),
          buttons: [
            {
              text: t('btn.yes'),
              primary: true,
              isDefault: true,
              action: () => {
                window.vfs.deleteItem(this.currentPath, this.selectedItem.key || this.selectedItem.name, true);
                this.selectedItem = null;
                this.renderFolder(win);
              }
            },
            { text: t('btn.no'), action: () => {} }
          ]
        });
      } else {
        window.winManager.openDialog({
          title: 'Explorer',
          icon: 'info',
          message: t('explorer.selectToDelete')
        });
      }
    });

    bindMenu('.exp-opt-rename', () => {
      if (this.selectedItem && window.vfs) {
        window.winManager.openPromptDialog({
          title: t('menu.rename'),
          icon: 'folder',
          message: t('explorer.promptRename'),
          value: this.selectedItem.name,
          onOk: (newName) => {
            if (newName && newName.trim() && newName.trim() !== this.selectedItem.name) {
              window.vfs.renameItem(this.currentPath, this.selectedItem.key || this.selectedItem.name, newName.trim());
              this.renderFolder(win);
            }
          }
        });
      } else {
        window.winManager.openDialog({
          title: 'Explorer',
          icon: 'info',
          message: t('explorer.selectToRename')
        });
      }
    });

    bindMenu('.exp-opt-props', () => {
      if (this.currentPath.length === 1 && (this.currentPath[0] === 'My Computer' || this.currentPath[0] === 'Мой компьютер')) {
        if (window.appCPanel) window.appCPanel.openSystemProperties();
        return;
      }
      window.winManager.openDialog({
        title: t('explorer.folderProps'),
        icon: 'folder',
        message: t('explorer.folderPropsDesc', this.getPathDisplay())
      });
    });

    bindMenu('.exp-opt-close', () => window.winManager.closeWindow(win.id));

    bindMenu('.exp-opt-cut', () => {
      if (this.selectedItem) {
        this.clipboardItem = { item: this.selectedItem, path: [...this.currentPath], isCut: true };
      }
    });

    bindMenu('.exp-opt-copy', () => {
      if (this.selectedItem) {
        this.clipboardItem = { item: this.selectedItem, path: [...this.currentPath], isCut: false };
      }
    });

    bindMenu('.exp-opt-paste', () => {
      if (this.clipboardItem && window.vfs) {
        const targetNode = window.vfs.resolvePath(this.currentPath);
        if (targetNode && targetNode.children) {
          targetNode.children[this.clipboardItem.item.name] = JSON.parse(JSON.stringify(this.clipboardItem.item));
          if (this.clipboardItem.isCut) {
            window.vfs.deleteItem(this.clipboardItem.path, this.clipboardItem.item.key || this.clipboardItem.item.name, false);
            this.clipboardItem = null;
          }
          window.vfs.saveToStorage();
          this.renderFolder(win);
        }
      }
    });

    bindMenu('.exp-opt-selectall', () => {
      el.querySelectorAll('.explorer-item').forEach(itemEl => itemEl.classList.add('selected'));
    });

    bindMenu('.exp-opt-refresh', () => this.renderFolder(win));

    bindMenu('.exp-opt-back', () => btnBack.click());
    bindMenu('.exp-opt-forward', () => btnForward.click());
    bindMenu('.exp-opt-up', () => btnUp.click());

    bindMenu('.exp-nav-mycomp', () => this.navigateTo(win, ['My Computer']));
    bindMenu('.exp-nav-mydocs', () => this.navigateTo(win, ['My Computer', 'C:', 'My Documents']));
    bindMenu('.exp-nav-mypics', () => this.navigateTo(win, ['My Computer', 'C:', 'My Documents', 'Мои рисунки']));
    bindMenu('.exp-nav-mydownloads', () => this.navigateTo(win, ['My Computer', 'C:', 'My Documents', 'Downloads']));

    bindMenu('.exp-fav-softstore', () => {
      if (window.appIE) window.appIE.open('http://www.softstore98.com');
    });

    bindMenu('.exp-fav-gamestore', () => {
      if (window.appIE) window.appIE.open('http://www.steampowered.com');
    });

    bindMenu('.exp-opt-about', () => {
      if (window.appDialogs) window.appDialogs.openAboutWindows();
    });
  }

  navigateTo(win, newPath) {
    this.currentPath = [...newPath];
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push([...this.currentPath]);
    this.historyIndex = this.history.length - 1;
    this.renderFolder(win);
  }

  renderFolder(win) {
    const el = win.element;
    const fileView = el.querySelector('.explorer-file-view');
    const addrInput = el.querySelector('.explorer-address-input');
    const sidebarTitle = el.querySelector('.explorer-sidebar-title');
    const statusItems = el.querySelector('.explorer-status-items');
    const btnBack = el.querySelector('.btn-back');
    const btnForward = el.querySelector('.btn-forward');
    const btnUp = el.querySelector('.btn-up');

    const pathText = this.getPathDisplay();
    const pathIcon = Icons[this.getPathIcon()] || Icons['folder'];
    addrInput.value = pathText;
    sidebarTitle.textContent = this.getFolderName();
    el.querySelector('.explorer-address-icon').innerHTML = pathIcon;
    el.querySelector('.explorer-sidebar-icon').innerHTML = pathIcon;
    const sidebarDetails = el.querySelector('.explorer-sidebar-details');
    sidebarDetails.textContent = (window.i18n ? window.i18n.t('explorer.sidebarDesc') : '');
    this.selectedItem = null;
    win.titleElement.textContent = pathText;

    btnBack.disabled = this.historyIndex <= 0;
    btnForward.disabled = this.historyIndex >= this.history.length - 1;
    btnUp.disabled = this.currentPath.length <= 1;

    const items = window.vfs.list(this.currentPath);
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

    statusItems.textContent = t('explorer.objectsCount', items.length);
    fileView.innerHTML = '';
    fileView.onclick = (e) => {
      if (e.target !== fileView) return;
      fileView.querySelectorAll('.explorer-item').forEach(i => i.classList.remove('selected'));
      this.selectedItem = null;
      sidebarDetails.textContent = t('explorer.sidebarDesc');
    };

    fileView.addEventListener('contextmenu', (e) => {
      if (e.target !== fileView) return;
      e.preventDefault();
      e.stopPropagation();

      if (window.contextMenu) {
        window.contextMenu.show(e.clientX, e.clientY, [
          { label: t('desktop.refresh'), action: () => this.renderFolder(win) },
          { separator: true },
          {
            label: t('desktop.newTextDoc'),
            action: () => {
              window.winManager.openPromptDialog({
                title: t('desktop.newTextDoc'),
                icon: 'file-txt',
                message: t('explorer.promptNewDoc'),
                value: 'New Document.txt',
                onOk: (fileName) => {
                  if (fileName && fileName.trim() && window.vfs) {
                    window.vfs.writeFile(this.currentPath, fileName.trim(), '');
                    this.renderFolder(win);
                  }
                }
              });
            }
          },
          {
            label: t('desktop.newFolder'),
            action: () => {
              window.winManager.openPromptDialog({
                title: t('desktop.newFolder'),
                icon: 'folder',
                message: t('explorer.promptNewFolder'),
                value: 'New Folder',
                onOk: (folderName) => {
                  if (folderName && folderName.trim() && window.vfs) {
                    window.vfs.createFolder(this.currentPath, folderName.trim());
                    this.renderFolder(win);
                  }
                }
              });
            }
          },
          { separator: true },
          {
            label: t('desktop.properties'),
            action: () => {
              if (this.currentPath.length === 1 && (this.currentPath[0] === 'My Computer' || this.currentPath[0] === 'Мой компьютер')) {
                if (window.appCPanel) window.appCPanel.openSystemProperties();
                return;
              }
              window.winManager.openDialog({
                title: `${this.getPathDisplay()} ${t('menu.properties')}`,
                icon: this.getPathIcon(),
                message: `<b>${this.getPathDisplay()}</b><br>${t('explorer.containsItems', items.length)}`
              });
            }
          }
        ]);
      }
    });

    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'explorer-item';
      const labelText = item.displayName || item.name;
      const iconKey = item.icon || (item.name && item.name.endsWith('.exe') ? (item.name === 'totally_not_a_virus.exe' ? 'file-virus' : 'file-exe') : (item.name && (item.name.endsWith('.mp3') || item.name.endsWith('.wav') || item.name.endsWith('.mid')) ? 'file-music' : (item.name && (item.name.endsWith('.avi') || item.name.endsWith('.mp4')) ? 'file-video' : (item.name && item.name.endsWith('.bmp') ? 'file-bmp' : (item.name && item.name.endsWith('.xls') ? 'file-xls' : (item.name && item.name.endsWith('.txt') ? 'file-txt' : 'folder'))))));
      itemEl.innerHTML = `
        <div class="explorer-item-icon">${Icons[iconKey] || Icons[item.icon] || Icons['folder']}</div>
        <div class="explorer-item-label">${labelText}</div>
      `;

      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        fileView.querySelectorAll('.explorer-item').forEach(i => i.classList.remove('selected'));
        itemEl.classList.add('selected');
        this.selectedItem = item;
        sidebarDetails.innerHTML = this.describeItem(item, labelText);
      });

      itemEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.openItem(win, item);
      });

      itemEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileView.querySelectorAll('.explorer-item').forEach(i => i.classList.remove('selected'));
        itemEl.classList.add('selected');
        this.selectedItem = item;
        sidebarDetails.innerHTML = this.describeItem(item, labelText);

        if (window.contextMenu) {
          const isSpecial = item.type === 'drive' || item.type === 'special' || item.type === 'action';
          if (item.key === 'D:' || item.driveType === 'cdrom') {
            const isInserted = window.vfs && window.vfs.isCdRomInserted();
            const discId = window.vfs && window.vfs.cdRomState && window.vfs.cdRomState.discId;
            const cdMenuItems = [];
            if (isInserted) {
              cdMenuItems.push({
                label: t('explorer.autoPlay'),
                bold: true,
                action: () => {
                  if (discId === 'office_games_98') {
                    if (window.appOfficeLauncher) window.appOfficeLauncher.open();
                  } else if (window.appIgroman) {
                    window.appIgroman.open();
                  }
                }
              });
              cdMenuItems.push({
                label: t('menu.open'),
                action: () => this.navigateTo(win, [...this.currentPath, item.key])
              });
              cdMenuItems.push({ separator: true });
              if (discId === 'office_games_98') {
                cdMenuItems.push({
                  label: t('cdrom.insertIgromania'),
                  action: () => {
                    if (window.vfs) window.vfs.insertCdRom('D:', 'igromania_09_1998');
                  }
                });
              } else {
                cdMenuItems.push({
                  label: t('cdrom.insertOffice'),
                  action: () => {
                    if (window.vfs) window.vfs.insertCdRom('D:', 'office_games_98');
                  }
                });
              }
              cdMenuItems.push({ separator: true });
              cdMenuItems.push({
                label: t('explorer.eject'),
                action: () => {
                  if (window.vfs) window.vfs.ejectCdRom();
                }
              });
            } else {
              cdMenuItems.push({
                label: t('cdrom.insertOffice'),
                bold: true,
                action: () => {
                  if (window.vfs) window.vfs.insertCdRom('D:', 'office_games_98');
                }
              });
              cdMenuItems.push({
                label: t('cdrom.insertIgromania'),
                action: () => {
                  if (window.vfs) window.vfs.insertCdRom('D:', 'igromania_09_1998');
                }
              });
            }
            cdMenuItems.push({ separator: true });
            cdMenuItems.push({
              label: t('menu.properties'),
              action: () => {
                const statusStr = isInserted
                  ? (discId === 'office_games_98' ? t('cdrom.statusOfficeInserted') : t('cdrom.propsInserted'))
                  : t('cdrom.propsEjected');
                window.winManager.openDialog({
                  title: `${labelText} ${t('menu.properties')}`,
                  icon: item.icon || 'drive-cd',
                  message: `<b>${labelText}</b><br>${t('cdrom.propsType')}<br>${t('disp.status')}: ${statusStr}`
                });
              }
            });
            window.contextMenu.show(e.clientX, e.clientY, cdMenuItems);
            return;
          }

          window.contextMenu.show(e.clientX, e.clientY, [
            { label: t('menu.open'), bold: true, action: () => this.openItem(win, item) },
            { separator: true },
            { label: t('menu.cut'), disabled: true },
            { label: t('menu.copy'), disabled: true },
            { separator: true },
            {
              label: t('menu.delete'),
              disabled: isSpecial,
              action: () => {
                window.winManager.openDialog({
                  title: t('explorer.confirmDeleteTitle'),
                  icon: 'warning',
                  message: t('explorer.confirmDelete', labelText),
                  buttons: [
                    {
                      text: t('btn.yes'),
                      isDefault: true,
                      primary: true,
                      action: () => {
                        window.vfs.deleteItem(this.currentPath, item.key || item.name);
                        this.renderFolder(win);
                      }
                    },
                    { text: t('btn.no'), action: () => {} }
                  ]
                });
              }
            },
            {
              label: t('menu.rename'),
              disabled: isSpecial,
              action: () => {
                window.winManager.openPromptDialog({
                  title: t('menu.rename'),
                  icon: item.icon || 'folder',
                  message: t('explorer.promptRename'),
                  value: labelText,
                  onOk: (newName) => {
                    if (newName && newName.trim() && newName.trim() !== labelText) {
                      window.vfs.renameItem(this.currentPath, item.key || item.name, newName.trim());
                      this.renderFolder(win);
                    }
                  }
                });
              }
            },
            { separator: true },
            {
              label: t('menu.properties'),
              action: () => {
                if (item.key === 'My Computer' || item.name === 'My Computer' || item.name === 'Мой компьютер' || item.action === 'system-properties') {
                  if (window.appCPanel) window.appCPanel.openSystemProperties();
                  return;
                }
                window.winManager.openDialog({
                  title: `${labelText} ${t('menu.properties')}`,
                  icon: item.icon || 'folder',
                  message: `<b>${labelText}</b><br>Location: \\${this.currentPath.join('\\')}`
                });
              }
            }
          ]);
        }
      });

      fileView.appendChild(itemEl);
    });
  }

  openItem(win, item) {
    if (window.soundSys) window.soundSys.playClick();
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    if (item.type === 'file' && /\.sav$/i.test(item.name || '') && typeof item.content === 'string' && item.content.startsWith('AVATAR98SAV') && window.appAvatar98) {
      window.appAvatar98.open({ importText: item.content });
      return;
    }

    if (item.key === 'D:' || item.driveType === 'cdrom') {
      const isInserted = window.vfs && window.vfs.isCdRomInserted();
      const discId = window.vfs && window.vfs.cdRomState && window.vfs.cdRomState.discId;
      if (!isInserted) {
        window.winManager.openDialog({
          title: t('cdrom.notReadyTitle'),
          icon: 'warning',
          message: t('cdrom.notReadyMsg'),
          buttons: [
            {
              text: t('cdrom.insertOfficeBtn'),
              action: () => {
                window.vfs.insertCdRom('D:', 'office_games_98');
                this.renderFolder(win);
              }
            },
            {
              text: t('cdrom.insertIgromaniaBtn'),
              isDefault: true,
              primary: true,
              action: () => {
                window.vfs.insertCdRom('D:', 'igromania_09_1998');
                this.renderFolder(win);
              }
            },
            { text: t('btn.cancel'), action: () => {} }
          ]
        });
        return;
      }
      if (this.currentPath.length === 1 && this.currentPath[0] === 'My Computer') {
        if (discId === 'office_games_98') {
          if (window.appOfficeLauncher) {
            window.appOfficeLauncher.open();
            return;
          }
        } else if (window.appIgroman) {
          window.appIgroman.open();
          return;
        }
      }
      this.navigateTo(win, [...this.currentPath, item.key]);
      return;
    }

    if (item.type === 'folder' || item.type === 'drive' || item.type === 'special') {
      this.navigateTo(win, [...this.currentPath, item.key]);
    } else if (item.type === 'executable') {
      if (item.app === 'igroman' || item.name === 'igroman.exe') {
        if (window.appIgroman) window.appIgroman.open();
      } else if (item.app === 'office_launcher' || item.name === 'LAUNCHER.EXE') {
        if (window.appOfficeLauncher) window.appOfficeLauncher.open();
      } else if (item.app === 'og_snake3d' || item.name === 'SNAKE3D.EXE') {
        if (window.appOgSnake3d) window.appOgSnake3d.open();
      } else if (item.app === 'og_arkanoid' || item.name === 'ARKANOID.EXE') {
        if (window.appOgArkanoid) window.appOgArkanoid.open();
      } else if (item.app === 'og_rush' || item.name === 'OFFICERUN.EXE') {
        if (window.appOgRush) window.appOgRush.open();
      } else if (item.app === 'og_hunt' || item.name === 'MOORHUNT.EXE') {
        if (window.appOgHunt) window.appOgHunt.open();
      } else if (item.app === 'og_gems' || item.name === 'GEMS98.EXE') {
        if (window.appOgGems) window.appOgGems.open();
      } else if (item.app === 'og_lines' || item.name === 'LINES98.EXE') {
        if (window.appOgLines) window.appOgLines.open();
      } else if (item.app === 'og_tetris' || item.name === 'TETRIS.EXE') {
        if (window.appOgTetris) window.appOgTetris.open();
      } else if (item.app === 'og_chairs' || item.name === 'CHAIRS.EXE') {
        if (window.appOgChairs) window.appOgChairs.open();
      } else if (item.app === 'hsrsetup') {
        if (window.hsrSite) window.hsrSite.openSetup();
      } else if (item.app === 'setup' && (item.gameId || item.name === 'Winamp192.exe' || item.name === 'Setup_Winamp.exe' || item.name === 'Setup_Blender160.exe') && window.gameManager) {
        window.gameManager.openSetupWizard(item.gameId || (item.name === 'Setup_Blender160.exe' ? 'blender' : 'winamp'));
      } else if (item.app === 'notepad' && window.appNotepad) window.appNotepad.open();
      else if (item.app === 'paint' && window.appPaint) window.appPaint.open();
      else if (item.app === 'calculator' && window.appCalculator) window.appCalculator.open();
      else if (item.app === 'minesweeper' && window.appMinesweeper) window.appMinesweeper.open();
      else if (item.app === 'wolf3d') {
        if (window.gameManager && !window.gameManager.isInstalled('wolf3d')) {
          window.winManager.openDialog({ title: 'Wolfenstein 3D', icon: 'error', message: t('store.gameNotInstalled', 'Wolfenstein 3D') });
        } else if (window.appWolf3D) window.appWolf3D.open();
      }
      else if (item.app === 'quest') {
        if (window.gameManager && !window.gameManager.isInstalled('quest')) {
          window.winManager.openDialog({ title: 'LucasQuest 98', icon: 'error', message: t('store.gameNotInstalled', 'LucasQuest 98') });
        } else if (window.appScummQuest) window.appScummQuest.open();
      }
      else if (item.app === 'stalker') {
        if (window.gameManager && !window.gameManager.isInstalled('stalker')) {
          window.winManager.openDialog({ title: 'S.T.A.L.K.E.R.', icon: 'error', message: t('store.gameNotInstalled', 'S.T.A.L.K.E.R.') });
        } else if (window.appStalker) window.appStalker.open();
      }
      else if (item.app === 'fallout2' || item.name === 'FALLOUT2.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('fallout2')) {
          window.winManager.openDialog({ title: 'Fallout 2 Demo', icon: 'error', message: t('store.gameNotInstalled', 'Fallout 2 Demo') });
        } else if (window.appFallout2) window.appFallout2.open();
      }
      else if (item.app === 'burnout' || item.name === 'BURNDEMO.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('burnout')) {
          const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
          window.winManager.openDialog({
            title: 'Burnout Demo',
            icon: 'error',
            message: isRu
              ? 'Демо-версия игры Burnout: Championship Drag Racing не установлена.<br>Вы можете установить её с диска «Игромании» (D:\\demo\\burndemo.exe)'
              : 'Demo of Burnout: Championship Drag Racing is not installed.<br>You can install it from the Igromania CD (D:\\demo\\burndemo.exe)'
          });
        } else if (window.appBurnout) window.appBurnout.open();
      }
      else if (item.app === 'ie' && window.appIE) window.appIE.open();
      else if (item.app === 'imaging' || item.name === 'KODAKIMG.EXE') {
        if (window.appImageViewer) window.appImageViewer.open();
      }
      else if (item.app === 'videoplayer' || item.name === 'MPLAYER.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('videoplayer')) {
          window.winManager.openDialog({ title: 'ActiveMovie Player', icon: 'error', message: t('store.appNotInstalled', 'ActiveMovie Player') });
        } else if (window.appVideoPlayer) window.appVideoPlayer.open();
      }
      else if (item.app === 'photoshop' || item.name === 'PHOTOSHOP.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('photoshop')) {
          window.winManager.openDialog({ title: 'RetroShop 98', icon: 'error', message: t('store.appNotInstalled', 'RetroShop 98') });
        } else if (window.appPhotoshop) window.appPhotoshop.open();
      }
      else if (item.app === 'wincommander' || item.name === 'WINCMD.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('wincommander')) {
          window.winManager.openDialog({ title: 'WinCommander 98', icon: 'error', message: t('store.appNotInstalled', 'WinCommander 98') });
        } else if (window.appWinCommander) window.appWinCommander.open();
      }
      else if (item.app === 'winamp' || item.name === 'WINAMP.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('winamp')) {
          window.winManager.openDialog({ title: 'WinAmp 98 Pro', icon: 'error', message: t('store.appNotInstalled', 'WinAmp 98 Pro') });
        } else if (window.appWinamp) window.appWinamp.open();
      }
      else if (item.app === 'doom' || item.name === 'DOOM.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('doom')) {
          window.winManager.openDialog({ title: 'DOOM 98', icon: 'error', message: t('store.gameNotInstalled', 'DOOM 98') });
        } else if (window.appDoom) window.appDoom.open();
      }
      else if (item.app === 'avatar98' || item.name === 'SILENT.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('avatar98')) {
          window.winManager.openDialog({ title: 'Аватар: Тихий цикл', icon: 'error', message: t('store.gameNotInstalled', 'Аватар: Тихий цикл') });
        } else if (window.appAvatar98) window.appAvatar98.open();
      }
      else if (item.app === 'dota' || item.name === 'DOTA.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('dota')) {
          window.winManager.openDialog({ title: 'Dota 98', icon: 'error', message: t('store.gameNotInstalled', 'Dota 98') });
        } else if (window.appDota) window.appDota.open();
      }
      else if (item.app === 'lol' || item.name === 'LOL.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('lol')) {
          window.winManager.openDialog({ title: 'League of Legends 98', icon: 'error', message: t('store.gameNotInstalled', 'League of Legends 98') });
        } else if (window.appLoL) window.appLoL.open();
      }
      else if (item.app === 'moh98' || item.name === 'MOH.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('moh98')) {
          window.winManager.openDialog({ title: 'Medal of Honor 98', icon: 'error', message: t('store.gameNotInstalled', 'Medal of Honor 98') });
        } else if (window.appMoh98) window.appMoh98.open();
      }
      else if (item.app === 'cop98' || item.name === 'ZATON.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('cop98')) {
          window.winManager.openDialog({ title: 'S.T.A.L.K.E.R.: Зов Припяти 98', icon: 'error', message: t('store.gameNotInstalled', 'S.T.A.L.K.E.R.: Зов Припяти 98') });
        } else if (window.appCop98) window.appCop98.open();
      }
      else if (item.app === 'tekken3' || item.name === 'TEKKEN3.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('tekken3')) {
          window.gameManager.showInSteam('tekken3');
        } else if (window.appTekken3) window.appTekken3.open();
      }
      else if (item.app === 'ow98' || item.name === 'OVERWATCH.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('ow98')) {
          window.gameManager.showInSteam('ow98');
        } else if (window.appOw98) window.appOw98.open();
      }
      else if (item.app === 'sammax106' || item.name === 'SAMMAX6.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('sammax106')) {
          window.gameManager.showInSteam('sammax106');
        } else if (window.appSamMax106) window.appSamMax106.open();
      }
      else if (item.app === 'sammax202' || item.name === 'SAMMAX22.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('sammax202')) {
          window.gameManager.showInSteam('sammax202');
        } else if (window.appSamMax202) window.appSamMax202.open();
      }
      else if (item.app === 'bttf' || item.name === 'BTTF.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('bttf')) {
          window.gameManager.showInSteam('bttf');
        } else if (window.appBTTF) window.appBTTF.open();
      }
      else if (item.app === 'sammax201' || item.name === 'SAMMAX21.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('sammax201')) {
          window.gameManager.showInSteam('sammax201');
        } else if (window.appSamMax201) window.appSamMax201.open();
      }
      else if (item.app === 'sammax105' || item.name === 'SAMMAX5.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('sammax105')) {
          window.gameManager.showInSteam('sammax105');
        } else if (window.appSamMax105) window.appSamMax105.open();
      }
      else if (item.app === 'sammax104' || item.name === 'SAMMAX4.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('sammax104')) {
          window.gameManager.showInSteam('sammax104');
        } else if (window.appSamMax104) window.appSamMax104.open();
      }
      else if (item.app === 'sammax103' || item.name === 'SAMMAX3.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('sammax103')) {
          window.gameManager.showInSteam('sammax103');
        } else if (window.appSamMax103) window.appSamMax103.open();
      }
      else if (item.app === 'sammax102' || item.name === 'SAMMAX2.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('sammax102')) {
          window.gameManager.showInSteam('sammax102');
        } else if (window.appSamMax102) window.appSamMax102.open();
      }
      else if (item.app === 'sammax' || item.name === 'SAMMAX.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('sammax')) {
          window.gameManager.showInSteam('sammax');
        } else if (window.appSamMax) window.appSamMax.open();
      }
      else if (item.app === 'quake3' || item.name === 'QUAKE3.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('quake3')) {
          window.gameManager.showInSteam('quake3');
        } else if (window.appQuake3) window.appQuake3.open();
      }
      else if (item.app === 'diablo2' || item.name === 'DIABLO2.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('diablo2')) {
          window.gameManager.showInSteam('diablo2');
        } else if (window.appDiablo2) window.appDiablo2.open();
      }
      else if (item.app === 'xiii' || item.name === 'XIII.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('xiii')) {
          window.gameManager.showInSteam('xiii');
        } else if (window.appXiii) window.appXiii.open();
      }
      else if (item.app === 'maxpayne' || item.name === 'MAXPAYNE.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('maxpayne')) {
          window.gameManager.showInSteam('maxpayne');
        } else if (window.appMaxPayne) window.appMaxPayne.open();
      }
      else if (item.app === 'gtann' || item.name === 'GTANN.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('gtann')) {
          window.gameManager.showInSteam('gtann');
        } else if (window.appGtaNN) window.appGtaNN.open();
      }
      else if (item.app === 'legion' || item.name === 'ARENA.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('legion')) {
          window.gameManager.showInSteam('legion');
        } else if (window.appLegion) window.appLegion.open();
      }
      else if (item.app === 'falloutzp' || item.name === 'FALLOUTZP.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('falloutzp')) {
          window.gameManager.showInSteam('falloutzp');
        } else if (window.appFalloutZP) window.appFalloutZP.open();
      }
      else if (item.app === 'anotherwar' || item.name === 'AW.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('anotherwar')) {
          window.gameManager.showInSteam('anotherwar');
        } else if (window.appAnotherWar) window.appAnotherWar.open();
      }
      else if (item.app === 'plov' || item.name === 'PLOV.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('plov')) {
          window.gameManager.showInSteam('plov');
        } else if (window.appPlov) window.appPlov.open();
      }
      else if (item.app === 'sims3' || item.name === 'SIMS3.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('sims3')) {
          window.gameManager.showInSteam('sims3');
        } else if (window.appSims3) window.appSims3.open();
      }
      else if (item.app === 'forza' || item.name === 'FORZA.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('forza')) {
          window.gameManager.showInSteam('forza');
        } else if (window.appForza) window.appForza.open();
      }
      else if (item.app === 'dmc98' || item.name === 'DMC4.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('dmc98')) {
          window.gameManager.showInSteam('dmc98');
        } else if (window.appDmc98) window.appDmc98.open();
      }
      else if (item.app === 'dao98' || item.name === 'DAORIGINS.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('dao98')) {
          window.winManager.openDialog({ title: 'Dragon Age: Origins 98', icon: 'error', message: t('store.gameNotInstalled', 'Dragon Age: Origins 98') });
        } else if (window.appDao98) window.appDao98.open();
      }
      else if (item.app === 'hl2' || item.name === 'HL2.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('hl2')) {
          window.winManager.openDialog({ title: 'Half-Life 2', icon: 'error', message: t('store.gameNotInstalled', 'Half-Life 2') });
        } else if (window.appHl2) window.appHl2.open();
      }
      else if (item.app === 'gta90' || item.name === 'GTA90.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('gta90')) {
          window.winManager.openDialog({ title: "Grand Theft Auto: Екатеринбург '90", icon: 'error', message: t('store.gameNotInstalled', "Grand Theft Auto: Екатеринбург '90") });
        } else if (window.appGta90) window.appGta90.open();
      }
      else if (item.app === 'kotor98' || item.name === 'KOTOR.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('kotor98')) {
          window.winManager.openDialog({ title: 'Star Wars: KOTOR 98', icon: 'error', message: t('store.gameNotInstalled', 'Star Wars: KOTOR 98') });
        } else if (window.appKotor98) window.appKotor98.open();
      }
      else if (item.app === 'hsr98' || item.name === 'STARRAIL.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('hsr98')) {
          window.winManager.openDialog({ title: 'Honkai: Star Rail 98', icon: 'error', message: t('store.gameNotInstalled', 'Honkai: Star Rail 98') });
        } else if (window.appHsr98) window.appHsr98.open();
      }
      else if (item.app === 'mc98' || item.name === 'MINECRAFT.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('mc98')) {
          window.winManager.openDialog({ title: 'Minecraft 98', icon: 'error', message: t('store.gameNotInstalled', 'Minecraft 98') });
        } else if (window.appMc98) window.appMc98.open();
      }
      else if (item.app === 'stalker98' || item.name === 'XR98.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('stalker98')) {
          window.winManager.openDialog({ title: 'S.T.A.L.K.E.R. 98', icon: 'error', message: t('store.gameNotInstalled', 'S.T.A.L.K.E.R. 98') });
        } else if (window.appStalker98) window.appStalker98.open();
      }
      else if (item.app === 'serioussam' || item.name === 'SAM.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('serioussam')) {
          window.winManager.openDialog({ title: 'Serious Sam 98', icon: 'error', message: t('store.gameNotInstalled', 'Serious Sam 98') });
        } else if (window.appSeriousSam) window.appSeriousSam.open();
      }
      else if (item.app === 'diablo' || item.name === 'DIABLO.EXE') {
        if (window.appDiablo) window.appDiablo.open();
      }
      else if (item.app === 'steam' || item.name === 'STEAM.EXE') {
        if (window.gameManager) window.gameManager.showInSteam();
      }
      else if (item.app === 'blender204') {
        if (window.gameManager && !window.gameManager.isInstalled('blender204')) {
          window.winManager.openDialog({ title: 'Blender 2.04', icon: 'error', message: t('store.appNotInstalled', 'Blender 2.04') });
        } else if (window.appBlender204) window.appBlender204.open();
      }
      else if (item.app === 'blender' || item.name === 'BLENDER.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('blender')) {
          window.winManager.openDialog({ title: 'Blender 1.60', icon: 'error', message: t('store.appNotInstalled', 'Blender 1.60') });
        } else if (window.appBlender) window.appBlender.open();
      }
      else if ((item.app === 'virus' || item.name === 'totally_not_a_virus.exe') && window.appVirus) {
        window.appVirus.open();
      } else if ((item.app === 'msconfig' || item.name === 'MSCONFIG.EXE') && window.appSysTools) {
        window.appSysTools.openMSConfig();
      } else if ((item.app === 'dxdiag' || item.name === 'DXDIAG.EXE') && window.appSysTools) {
        window.appSysTools.openDxDiag();
      } else if ((item.app === 'sysedit' || item.name === 'SYSEDIT.EXE') && window.appSysTools) {
        window.appSysTools.openSysEdit();
      } else if ((item.app === 'charmap' || item.name === 'CHARMAP.EXE') && window.appSysTools) {
        window.appSysTools.openCharMap();
      } else if ((item.app === 'scandisk' || item.name === 'SCANDISK.EXE') && window.appSysTools) {
        window.appSysTools.openScanDisk();
      } else if ((item.app === 'sndvol32' || item.name === 'SNDVOL32.EXE') && window.appSysTools) {
        window.appSysTools.openVolumeControl();
      } else if ((item.app === 'cleanmgr' || item.name === 'CLEANMGR.EXE') && window.appSysTools) {
        window.appSysTools.openCleanMgr();
      } else if ((item.app === 'command' || item.name === 'COMMAND.COM') && window.appSysTools) {
        window.appSysTools.openDosPromptWindow();
      } else if ((item.app === 'clippy' || item.name === 'CLIPPY.EXE') && window.appClippy) {
        window.appClippy.launch('exe');
      }
    } else if (item.type === 'file') {
      const nameLower = (item.name || '').toLowerCase();
      if (item.app === 'blender204' || /\.blend\d*$/.test(nameLower)) {
        if (window.gameManager && !window.gameManager.isInstalled('blender204')) window.winManager.openDialog({ title: 'Blender 2.04', icon: 'error', message: t('store.appNotInstalled', 'Blender 2.04') });
        else if (window.appBlender204) window.appBlender204.open({ dir: this.currentPath.slice(), name: item.key || item.name });
      } else if (item.app === 'winamp' || nameLower.endsWith('.mp3') || nameLower.endsWith('.wav') || nameLower.endsWith('.mid') || nameLower.endsWith('.ogg')) {
        if (window.appWinamp) window.appWinamp.open(item.name, item.content || item.path, this.currentPath);
      } else if (item.app === 'imaging' || nameLower.endsWith('.bmp') || nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) {
        if (window.appImageViewer) window.appImageViewer.open(item.name, item.content, this.currentPath);
      } else if (item.app === 'videoplayer' || nameLower.endsWith('.avi') || nameLower.endsWith('.mp4') || nameLower.endsWith('.mpg') || nameLower.endsWith('.mpeg') || nameLower.endsWith('.mov')) {
        if (window.appVideoPlayer) window.appVideoPlayer.open(item.name, item.content, true);
      } else if (item.app === 'photoshop' || nameLower.endsWith('.psd')) {
        if (window.appPhotoshop) window.appPhotoshop.open(item.name, item.content, this.currentPath);
      } else if (item.app === 'paint') {
        if (window.appPaint) window.appPaint.open(item.name, item.content, this.currentPath);
      } else if (item.app === 'excel' || nameLower.endsWith('.xls')) {
        if (window.appExcel) window.appExcel.open(item.name, item.content, this.currentPath);
      } else if ((item.app === 'virus' || nameLower === 'totally_not_a_virus.exe') && window.appVirus) {
        window.appVirus.open();
      } else if (item.app === 'ie' || nameLower.endsWith('.url') || nameLower.endsWith('.htm') || nameLower.endsWith('.html')) {
        let targetUrl = 'http://www.search98.com';
        if (item.content && (item.content.startsWith('http://') || item.content.startsWith('https://'))) {
          targetUrl = item.content;
        } else if (typeof item.content === 'string' && item.content.includes('URL=')) {
          const match = item.content.match(/URL=(https?:\/\/[^\r\n]+)/i);
          if (match) targetUrl = match[1];
        }
        if (window.appIE) window.appIE.open(targetUrl);
      } else if (item.app === 'wordpad' || nameLower.endsWith('.rtf') || nameLower.endsWith('.doc')) {
        if (window.appWordPad) window.appWordPad.open(item.name, item.content, this.currentPath);
      } else if (item.app === 'actor' || nameLower.endsWith('.acs') || nameLower.endsWith('.act')) {
        if (window.appClippy) window.appClippy.onActorFile(item.name);
      } else if (nameLower.endsWith('.txt') || nameLower.endsWith('.ini') || nameLower.endsWith('.log') || nameLower.endsWith('.bat') || nameLower.endsWith('.sys')) {
        if (window.appNotepad) window.appNotepad.open(item.name, item.content, this.currentPath);
      } else {
        window.winManager.openDialog({
          title: item.name,
          icon: 'info',
          message: `File: ${item.name}<br>Size: 12.4 KB<br>Preview: ${item.content || 'Binary data'}`
        });
      }
    } else if (item.type === 'action') {
      if (item.action === 'display-properties' && window.appDialogs) {
        window.appDialogs.openDisplayProperties();
      } else if (item.action === 'regional-settings' && window.appDialogs) {
        window.appDialogs.openRegionalSettings();
      } else if (item.action === 'timedate-properties' && window.appCPanel) {
        window.appCPanel.openTimeDateProperties();
      } else if (item.action === 'system-properties' && window.appCPanel) {
        window.appCPanel.openSystemProperties();
      } else if (item.action === 'mouse-properties' && window.appCPanel) {
        window.appCPanel.openMouseProperties();
      } else if (item.action === 'multimedia-properties' && window.appCPanel) {
        window.appCPanel.openMultimediaProperties();
      } else if (item.action === 'appwiz-properties' && window.appCPanel) {
        window.appCPanel.openAppWizProperties();
      } else if (item.action === 'internet-properties' && window.appCPanel) {
        window.appCPanel.openInternetProperties();
      }
    }
  }
}

window.appExplorer = new AppExplorer();
