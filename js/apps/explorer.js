class AppExplorer {
  constructor() {
    this.currentPath = ['My Computer'];
    this.history = [];
    this.historyIndex = -1;
    this.lastBounds = null;
    this.viewMode = 'large';
    this.sortBy = 'name';
    this.sortAsc = true;
    this.showFoldersTree = false;
    this.expandedTreePaths = new Set(['Desktop', 'My Computer', 'My Computer/C:', 'Network Neighborhood']);
    this.folderOptions = this.loadFolderOptions();
    if (window.addEventListener) window.addEventListener('net98-changed', () => this.netChanged());
  }

  netChanged() {
    const wm = window.winManager;
    if (this.currentPath[0] !== 'Network Neighborhood' || !wm || !wm.windows.has('app_explorer') || !window.Net98Shell) return;
    const print = window.Net98Shell.fingerprint();
    if (print === this.netPrint) return;
    this.netPrint = print;
    const win = wm.windows.get('app_explorer');
    if (window.vfs.resolvePath(this.currentPath)) this.renderFolder(win);
    else this.navigateTo(win, ['Network Neighborhood']);
  }

  loadFolderOptions() {
    try {
      const raw = localStorage.getItem('win98_folder_options');
      if (raw) {
        return Object.assign({ style: 'web', singleClick: false, showAllFiles: true, hideKnownExt: false }, JSON.parse(raw));
      }
    } catch (e) {}
    return { style: 'web', singleClick: false, showAllFiles: true, hideKnownExt: false };
  }

  saveFolderOptions() {
    try {
      localStorage.setItem('win98_folder_options', JSON.stringify(this.folderOptions));
    } catch (e) {}
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

  open(initialPath = ['My Computer'], options = {}) {
    if (options && typeof options.showTree === 'boolean') {
      this.showFoldersTree = options.showTree;
    }
    if (initialPath && initialPath[initialPath.length - 1] === 'A:' && window.soundSys && window.soundSys.playFloppySeekSound) {
      window.soundSys.playFloppySeekSound();
    }
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
    const width = savedBounds ? savedBounds.width : 580;
    const height = savedBounds ? savedBounds.height : 400;
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

  refresh() {
    if (window.winManager && window.winManager.windows.has('app_explorer')) {
      const win = window.winManager.windows.get('app_explorer');
      this.renderFolder(win);
    }
  }

  isEn() {
    return !!(window.i18n && window.i18n.getLanguage && window.i18n.getLanguage() === 'en');
  }

  localizeSize(str) {
    if (!str || this.isEn()) return str || '';
    return String(str)
      .replace(/(\d)\.(\d)/g, '$1,$2')
      .replace(/\bKB\b/g, 'КБ')
      .replace(/\bMB\b/g, 'МБ')
      .replace(/\bGB\b/g, 'ГБ')
      .replace(/\bbytes\b/g, 'байт');
  }

  localizeFontVersion(str) {
    if (!str || this.isEn()) return str || '';
    return String(str).replace(/^Version /, 'Версия ').replace(/^Raster Font /, 'Растровый шрифт ');
  }

  propertiesTitle(name) {
    return this.isEn() ? `${name} Properties` : `Свойства: ${name}`;
  }

  getPathDisplay() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    if (this.currentPath.length === 1 && this.currentPath[0] === 'My Computer') {
      return t('app.myComputer');
    }
    if (this.currentPath.length === 1 && this.currentPath[0] === 'Network Neighborhood') {
      return t('app.network');
    }
    const mapped = this.currentPath.map(p => {
      if (p === 'My Computer') return t('app.myComputer');
      if (p === 'Network Neighborhood') return t('app.network');
      if (p === 'Control Panel') return t('cpanel.title');
      if (p === 'My Documents') return t('app.myDocs');
      if (p === 'Мои рисунки') return t('app.myPictures');
      if (p === 'Моя музыка') return t('app.myMusic');
      if (p === 'Мои видео') return t('app.myVideos');
      if (p === 'Downloads' || p === 'downloads') return t('app.myDownloads');
      if (p === 'Accessories') return t('start.accessories');
      if (p === 'Games') return t('start.games');
      if (p === 'Start Menu') return t('startmenu.rootName');
      return p;
    });
    if (this.currentPath[0] === 'Network Neighborhood' && this.currentPath.length > 1) {
      return '\\\\' + this.currentPath.slice(1).join('\\');
    }
    return mapped.slice(1).join('\\') || mapped[0];
  }

  getFolderName() {
    const display = this.getPathDisplay();
    return display.split('\\').filter(Boolean).pop() || display;
  }

  describeItem(item, labelText) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const isEn = this.isEn();
    const title = `<div class="explorer-sidebar-item">${labelText}</div>`;
    if (item.key === 'A:' || item.driveType === 'floppy') {
      return `${title}<div>${isEn ? '3½-Inch Floppy Disk' : 'Дисковод гибких дисков 3,5"'}</div>
        <div>${t('explorer.capacity', this.localizeSize('1.44 MB'))}</div>
        <div class="explorer-disk-pie" style="--used: 18%"></div>
        <div class="explorer-disk-legend"><span class="swatch used"></span>${t('explorer.usedSpace', this.localizeSize('256 KB'))}</div>
        <div class="explorer-disk-legend"><span class="swatch free"></span>${t('explorer.freeSpace', this.localizeSize('1.18 MB'))}</div>`;
    }
    if (item.key === 'C:') {
      return `${title}<div>${t('explorer.typeLocalDisk')}</div>
        <div>${t('explorer.capacity', t('explorer.capacityC'))}</div>
        <div class="explorer-disk-pie" style="--used: 29%"></div>
        <div class="explorer-disk-legend"><span class="swatch used"></span>${t('explorer.usedSpace', t('explorer.usedC'))}</div>
        <div class="explorer-disk-legend"><span class="swatch free"></span>${t('explorer.freeSpace', t('explorer.freeC'))}</div>`;
    }
    if (item.key === 'D:' || item.driveType === 'cdrom') return `${title}<div>${t('explorer.typeCdrom')}</div>`;
    if (item.comment) return `${title}<div>${item.comment}</div>`;
    if (item.type === 'action') {
      const descMap = {
        'display-properties': 'cpanel.displayDesc',
        'regional-settings': 'cpanel.regionalDesc',
        'timedate-properties': 'cpanel.timedateDesc',
        'system-properties': 'cpanel.systemDesc',
        'mouse-properties': 'cpanel.mouseDesc',
        'multimedia-properties': 'cpanel.multimediaDesc',
        'appwiz-properties': 'cpanel.appwizDesc',
        'internet-properties': 'cpanel.inetDesc',
        'taskbar-properties': 'cpanel.taskbarDesc',
        'power-properties': 'cpanel.powerDesc'
      };
      const descKey = descMap[item.action];
      if (descKey) return `${title}<div>${t(descKey)}</div>`;
      const extraDesc = {
        'sounds-properties': isEn ? 'Assigns sounds to system events.' : 'Назначение звуков системным событиям.',
        'keyboard-properties': isEn ? 'Customizes keyboard repeat rate and input locales.' : 'Настройка скорости повтора и раскладок клавиатуры.',
        'fonts-folder': isEn ? 'Views, adds, and removes TrueType and raster fonts.' : 'Просмотр и установка шрифтов TrueType и растровых шрифтов.',
        'printers-folder': isEn ? 'Adds, removes, and configures local and network printers.' : 'Установка и настройка локальных и сетевых принтеров.',
        'network-properties': isEn ? 'Configures network adapters, protocols, and workgroup.' : 'Настройка сетевых адаптеров, протоколов TCP/IP и рабочей группы.',
        'accessibility-properties': isEn ? 'Adjusts StickyKeys, SoundSentry, and High Contrast.' : 'Настройка залипания клавиш и высокой контрастности.',
        'joystick-properties': isEn ? 'Adds, calibrates, and tests game controllers.' : 'Добавление, проверка и калибровка джойстиков и геймпадов.',
        'modem-properties': isEn ? 'Installs a new modem and changes modem properties.' : 'Установка нового модема и диагностика AT-команд.',
        'passwords-properties': isEn ? 'Changes passwords and sets security options.' : 'Изменение паролей входа и параметров безопасности.',
        'users-properties': isEn ? 'Sets up and manages multiple users on your computer.' : 'Настройка профилей пользователей компьютера.',
        'scheduled-tasks': isEn ? 'Schedules computer tasks to run automatically.' : 'Планирование автоматического запуска программ обслуживания.'
      };
      if (extraDesc[item.action]) return `${title}<div>${extraDesc[item.action]}</div>`;
    }
    if (item.type === 'folder' || (!item.type && item.children)) return `${title}<div>${t('explorer.typeFolder')}</div>`;
    if (item.fontName) return `${title}<div>${item.fontName}</div><div>${this.localizeFontVersion(item.version)}</div><div>${this.localizeSize(item.size)}</div>`;
    const size = typeof item.content === 'string' ? item.content.length : 0;
    return `${title}<div>${t('explorer.typeFile')}</div>${size ? `<div>${t('explorer.fileSize', size.toLocaleString('ru-RU'))}</div>` : ''}`;
  }

  getPathIcon() {
    if (this.currentPath.length === 1 && this.currentPath[0] === 'My Computer') {
      return 'my-computer';
    }
    if (this.currentPath[0] === 'Network Neighborhood') {
      return this.currentPath.length === 1 ? 'network' : 'network-pc';
    }
    const last = this.currentPath[this.currentPath.length - 1];
    if (last === 'A:') return 'drive-floppy';
    if (last === 'C:') return 'drive-c';
    if (last === 'D:') return 'drive-d';
    if (last === 'Control Panel') return 'control-panel';
    if (last === 'Fonts') return 'fonts';
    if (last === 'Мои рисунки') return 'folder-pictures';
    if (last === 'Моя музыка') return 'folder-music';
    if (last === 'Мои видео') return 'folder-videos';
    if (last === 'Downloads' || last === 'downloads') return 'folder-downloads';
    return 'folder';
  }

  buildHTML() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const isEn = this.isEn();
    return `
      <div class="explorer-container">
        <div class="win-menubar">
          <div class="win-menu-item">
            ${t('explorer.menuFile')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option exp-opt-new-folder">${t('explorer.newFolder')}</div>
              <div class="win-dropdown-option exp-opt-new-doc">${t('explorer.newDoc')}</div>
              <div class="win-dropdown-option exp-opt-new-briefcase">${isEn ? 'New Briefcase' : 'Создать портфель'}</div>
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
              <div class="win-dropdown-option exp-opt-paste-shortcut">${isEn ? 'Paste Shortcut' : 'Вставить ярлык'}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option exp-opt-selectall">${t('explorer.selectAll')} <span>Ctrl+A</span></div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('explorer.menuView')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option exp-toggle-folders">${isEn ? 'Folders Bar' : 'Панель папок'}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option exp-view-large">${isEn ? 'Large Icons' : 'Крупные значки'}</div>
              <div class="win-dropdown-option exp-view-small">${isEn ? 'Small Icons' : 'Мелкие значки'}</div>
              <div class="win-dropdown-option exp-view-list">${isEn ? 'List' : 'Список'}</div>
              <div class="win-dropdown-option exp-view-details">${isEn ? 'Details' : 'Таблица'}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option exp-sort-name">${isEn ? 'Arrange by Name' : 'Упорядочить по имени'}</div>
              <div class="win-dropdown-option exp-sort-type">${isEn ? 'Arrange by Type' : 'Упорядочить по типу'}</div>
              <div class="win-dropdown-option exp-sort-size">${isEn ? 'Arrange by Size' : 'Упорядочить по размеру'}</div>
              <div class="win-dropdown-option exp-sort-date">${isEn ? 'Arrange by Date' : 'Упорядочить по дате'}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option exp-opt-refresh">${t('explorer.refresh')} <span>F5</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option exp-opt-folder-options">${isEn ? 'Folder Options...' : 'Свойства папки...'}</div>
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
              <div class="win-dropdown-option exp-nav-net">${t('app.network')}</div>
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
          <div class="explorer-tool-sep"></div>
          <button class="explorer-tool-btn btn-folders">${Icons['tb-folders'] || Icons['folder']}<span>${isEn ? 'Folders' : 'Папки'}</span></button>
          <button class="explorer-tool-btn btn-views">${Icons['tb-views'] || Icons['folder']}<span>${isEn ? 'Views' : 'Вид'}</span></button>
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
          <div class="explorer-tree-pane" style="display:none;"></div>
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
    const btnFolders = el.querySelector('.btn-folders');
    const btnViews = el.querySelector('.btn-views');

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

    if (btnFolders) {
      btnFolders.addEventListener('click', () => {
        this.showFoldersTree = !this.showFoldersTree;
        this.renderFolder(win);
      });
    }

    if (btnViews) {
      btnViews.addEventListener('click', () => {
        const order = ['large', 'small', 'list', 'details'];
        const idx = order.indexOf(this.viewMode);
        this.viewMode = order[(idx + 1) % order.length];
        this.renderFolder(win);
      });
    }

    [['.btn-cut', '.exp-opt-cut'], ['.btn-copy', '.exp-opt-copy'], ['.btn-paste', '.exp-opt-paste'], ['.btn-delete', '.exp-opt-del'], ['.btn-props', '.exp-opt-props']].forEach(([button, option]) => {
      const btn = el.querySelector(button);
      const opt = el.querySelector(option);
      if (btn && opt) btn.addEventListener('click', () => opt.click());
    });

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const bindMenu = (sel, fn) => {
      const opt = el.querySelector(sel);
      if (opt) opt.addEventListener('click', fn);
    };

    bindMenu('.exp-opt-new-folder', () => this.createNewItem('folder', win));
    bindMenu('.exp-opt-new-doc', () => this.createNewItem('txt', win));
    bindMenu('.exp-opt-new-briefcase', () => this.createNewItem('briefcase', win));

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
          title: this.isEn() ? 'Explorer' : 'Проводник',
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
          title: this.isEn() ? 'Explorer' : 'Проводник',
          icon: 'info',
          message: t('explorer.selectToRename')
        });
      }
    });

    bindMenu('.exp-opt-props', () => {
      if (this.selectedItem) {
        this.openPropertiesDialog(this.selectedItem, this.currentPath, win);
        return;
      }
      if (this.currentPath.length === 1 && (this.currentPath[0] === 'My Computer' || this.currentPath[0] === 'Мой компьютер')) {
        if (window.appCPanel) window.appCPanel.openSystemProperties();
        return;
      }
      const curNode = window.vfs ? window.vfs.resolvePath(this.currentPath) : null;
      if (curNode) {
        const key = this.currentPath[this.currentPath.length - 1];
        this.openPropertiesDialog({ key, ...curNode }, this.currentPath.slice(0, -1), win);
      }
    });

    bindMenu('.exp-opt-close', () => window.winManager.closeWindow(win.id));

    bindMenu('.exp-opt-cut', () => {
      if (this.selectedItem) {
        this.clipboardItem = { item: this.selectedItem, path: [...this.currentPath], isCut: true };
        window.sharedFileClipboard = this.clipboardItem;
      }
    });

    bindMenu('.exp-opt-copy', () => {
      if (this.selectedItem) {
        this.clipboardItem = { item: this.selectedItem, path: [...this.currentPath], isCut: false };
        window.sharedFileClipboard = this.clipboardItem;
      }
    });

    bindMenu('.exp-opt-paste', () => this.pasteFromClipboard(win, false));
    bindMenu('.exp-opt-paste-shortcut', () => this.pasteFromClipboard(win, true));

    bindMenu('.exp-opt-selectall', () => {
      el.querySelectorAll('.explorer-item').forEach(itemEl => itemEl.classList.add('selected'));
    });

    bindMenu('.exp-toggle-folders', () => {
      this.showFoldersTree = !this.showFoldersTree;
      this.renderFolder(win);
    });
    bindMenu('.exp-view-large', () => { this.viewMode = 'large'; this.renderFolder(win); });
    bindMenu('.exp-view-small', () => { this.viewMode = 'small'; this.renderFolder(win); });
    bindMenu('.exp-view-list', () => { this.viewMode = 'list'; this.renderFolder(win); });
    bindMenu('.exp-view-details', () => { this.viewMode = 'details'; this.renderFolder(win); });

    bindMenu('.exp-sort-name', () => { this.sortBy = 'name'; this.sortAsc = true; this.renderFolder(win); });
    bindMenu('.exp-sort-type', () => { this.sortBy = 'type'; this.sortAsc = true; this.renderFolder(win); });
    bindMenu('.exp-sort-size', () => { this.sortBy = 'size'; this.sortAsc = false; this.renderFolder(win); });
    bindMenu('.exp-sort-date', () => { this.sortBy = 'modified'; this.sortAsc = false; this.renderFolder(win); });

    bindMenu('.exp-opt-refresh', () => this.renderFolder(win));
    bindMenu('.exp-opt-folder-options', () => this.openFolderOptions(win));

    bindMenu('.exp-opt-back', () => btnBack.click());
    bindMenu('.exp-opt-forward', () => btnForward.click());
    bindMenu('.exp-opt-up', () => btnUp.click());

    bindMenu('.exp-nav-mycomp', () => this.navigateTo(win, ['My Computer']));
    bindMenu('.exp-nav-net', () => this.navigateTo(win, ['Network Neighborhood']));
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

  pasteFromClipboard(win, asShortcut = false) {
    const clip = window.sharedFileClipboard || this.clipboardItem;
    if (!clip || !clip.item || !window.vfs) return;
    const targetNode = window.vfs.resolvePath(this.currentPath);
    if (!targetNode || !targetNode.children) return;
    if (asShortcut) {
      const baseName = clip.item.name || clip.item.key || 'Shortcut';
      const scName = (this.isEn() ? 'Shortcut to ' : 'Ярлык для ') + baseName + '.lnk';
      const targetPath = [...(clip.path || []), baseName].join('\\');
      targetNode.children[scName] = {
        type: 'file',
        name: scName,
        icon: clip.item.icon || 'file-exe',
        app: clip.item.app || 'notepad',
        isShortcut: true,
        shortcutTarget: targetPath,
        content: clip.item.content || ''
      };
    } else {
      let destName = clip.item.name || clip.item.key;
      if (!clip.isCut && targetNode.children[destName] && JSON.stringify(clip.path) === JSON.stringify(this.currentPath)) {
        destName = (this.isEn() ? 'Copy of ' : 'Копия ') + destName;
      }
      const cloned = JSON.parse(JSON.stringify(clip.item));
      cloned.name = destName;
      delete cloned.key;
      targetNode.children[destName] = cloned;
      if (clip.isCut && clip.path) {
        window.vfs.deleteItem(clip.path, clip.item.key || clip.item.name, false);
        this.clipboardItem = null;
        window.sharedFileClipboard = null;
      }
    }
    window.vfs.saveToStorage();
    if (window.desktop && window.desktop.renderIcons) window.desktop.renderIcons();
    if (win) this.renderFolder(win);
  }

  createNewItem(kind, win, targetPath = null) {
    const pathParts = targetPath || this.currentPath;
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const isEn = this.isEn();
    if (kind === 'folder') {
      window.winManager.openPromptDialog({
        title: t('desktop.newFolder'),
        icon: 'folder',
        message: t('explorer.promptNewFolder'),
        value: isEn ? 'New Folder' : 'Новая папка',
        onOk: (name) => {
          if (name && name.trim() && window.vfs) {
            window.vfs.createFolder(pathParts, name.trim());
            if (window.desktop && window.desktop.renderIcons) window.desktop.renderIcons();
            if (win) this.renderFolder(win);
          }
        }
      });
    } else if (kind === 'shortcut') {
      window.winManager.openPromptDialog({
        title: isEn ? 'Create Shortcut' : 'Создание ярлыка',
        icon: 'folder',
        message: isEn ? 'Type the location of the item (command line or path):' : 'Укажите командную строку или путь к объекту:',
        value: 'C:\\WINDOWS\\NOTEPAD.EXE',
        onOk: (cmdLine) => {
          if (cmdLine && cmdLine.trim() && window.vfs) {
            const base = cmdLine.trim().split('\\').pop().replace(/\.exe$/i, '') || 'Program';
            const scName = base + '.lnk';
            window.vfs.writeFile(pathParts, scName, {
              type: 'executable',
              name: scName,
              icon: 'file-exe',
              app: base.toLowerCase(),
              isShortcut: true,
              shortcutTarget: cmdLine.trim(),
              content: cmdLine.trim()
            });
            if (win) this.renderFolder(win);
          }
        }
      });
    } else if (kind === 'bmp') {
      const name = isEn ? 'New Bitmap Image.bmp' : 'Точечный рисунок.bmp';
      window.vfs.writeFile(pathParts, name, '');
      if (win) this.renderFolder(win);
    } else if (kind === 'wav') {
      const name = isEn ? 'New Wave Sound.wav' : 'Звукозапись.wav';
      window.vfs.writeFile(pathParts, name, '[PCM Wave Audio 22050Hz 8-bit Mono]');
      if (win) this.renderFolder(win);
    } else if (kind === 'briefcase') {
      const name = isEn ? 'My Briefcase.bfc' : 'Мой портфель.bfc';
      window.vfs.writeFile(pathParts, name, {
        type: 'file',
        name,
        icon: 'briefcase',
        app: 'briefcase',
        content: 'WIN98_BRIEFCASE_SYNC'
      });
      if (win) this.renderFolder(win);
    } else {
      window.winManager.openPromptDialog({
        title: t('desktop.newTextDoc'),
        icon: 'file-txt',
        message: t('explorer.promptNewDoc'),
        value: isEn ? 'New Text Document.txt' : 'Текстовый документ.txt',
        onOk: (name) => {
          if (name && name.trim() && window.vfs) {
            window.vfs.writeFile(pathParts, name.trim(), '');
            if (win) this.renderFolder(win);
          }
        }
      });
    }
  }

  sendToTarget(target, item, fromPath, win) {
    if (!item || !window.vfs) return;
    const isEn = this.isEn();
    const itemName = item.name || item.key || 'Item';
    if (target === 'floppy') {
      if (window.soundSys && window.soundSys.playFloppySeekSound) window.soundSys.playFloppySeekSound();
      const driveA = window.vfs.resolvePath(['My Computer', 'A:']);
      if (driveA) {
        if (!driveA.children) driveA.children = {};
        const copy = JSON.parse(JSON.stringify(item));
        delete copy.key;
        driveA.children[itemName] = copy;
        window.vfs.saveToStorage();
        window.winManager.openDialog({
          title: isEn ? 'Copying to 3½ Floppy (A:)' : 'Копирование на Диск 3,5 (A:)',
          icon: 'drive-floppy',
          message: isEn ? `File "${itemName}" copied to A:\\.` : `Файл «${itemName}» успешно скопирован на дискету A:\\.`
        });
      }
    } else if (target === 'desktop') {
      const scName = (isEn ? 'Shortcut to ' : 'Ярлык для ') + itemName;
      window.vfs.writeFile(['Desktop'], scName, {
        type: item.type || 'file',
        name: scName,
        icon: item.icon || 'file-txt',
        app: item.app || 'notepad',
        isShortcut: true,
        shortcutTarget: [...(fromPath || []), itemName].join('\\'),
        content: item.content || ''
      });
    } else if (target === 'mydocs') {
      const myDocs = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents']);
      if (myDocs && myDocs.children) {
        const copy = JSON.parse(JSON.stringify(item));
        delete copy.key;
        myDocs.children[itemName] = copy;
        window.vfs.saveToStorage();
      }
    } else if (target === 'mail') {
      if (window.appOutlook) window.appOutlook.open();
    } else if (target === 'notepad') {
      if (window.appNotepad) window.appNotepad.open(itemName, item.content || '', fromPath || this.currentPath);
    }
    if (win) this.renderFolder(win);
  }

  navigateTo(win, newPath) {
    if (newPath && newPath[newPath.length - 1] === 'A:' && window.soundSys && window.soundSys.playFloppySeekSound) {
      window.soundSys.playFloppySeekSound();
    }
    this.currentPath = [...newPath];
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push([...this.currentPath]);
    this.historyIndex = this.history.length - 1;
    this.renderFolder(win);
  }

  getItemIconKey(item) {
    if (item.app === 'neko' && item.isShortcut && window.appNeko && window.appNeko.isClawd()) return 'clawd';
    if (item.icon && Icons[item.icon]) return item.icon;
    const nm = (item.name || item.key || '').toLowerCase();
    if (nm.endsWith('.ttf')) return 'file-ttf';
    if (nm.endsWith('.fon')) return 'file-fon';
    if (nm.endsWith('.bfc')) return 'briefcase';
    if (nm.endsWith('.exe')) return nm === 'totally_not_a_virus.exe' ? 'file-virus' : 'file-exe';
    if (nm.endsWith('.mp3') || nm.endsWith('.wav') || nm.endsWith('.mid')) return 'file-music';
    if (nm.endsWith('.avi') || nm.endsWith('.mp4')) return 'file-video';
    if (nm.endsWith('.bmp')) return 'file-bmp';
    if (nm.endsWith('.xls')) return 'file-xls';
    if (nm.endsWith('.txt') || nm.endsWith('.ini') || nm.endsWith('.bat') || nm.endsWith('.sys') || nm.endsWith('.inf')) return 'file-txt';
    if (item.type === 'folder' || item.children) return 'folder';
    return item.icon || 'file-txt';
  }

  getItemTypeDesc(item) {
    const isEn = this.isEn();
    if (item.comment) return item.comment;
    if (item.key === 'A:' || item.driveType === 'floppy') return isEn ? '3½-Inch Floppy Disk' : 'Диск 3,5"';
    if (item.key === 'C:' || item.type === 'drive') return item.driveType === 'cdrom' ? (isEn ? 'CD-ROM Drive' : 'CD-ROM дисковод') : (isEn ? 'Local Disk' : 'Локальный диск');
    if (item.type === 'special' || item.type === 'action') return isEn ? 'System Folder' : 'Системная папка';
    if (item.type === 'folder' || item.children) return isEn ? 'File Folder' : 'Папка с файлами';
    if (item.isShortcut || (item.name || '').toLowerCase().endsWith('.lnk')) return isEn ? 'Shortcut' : 'Ярлык';
    const nm = (item.name || '').toLowerCase();
    if (nm.endsWith('.exe') || nm.endsWith('.com')) return isEn ? 'Application' : 'Приложение';
    if (nm.endsWith('.ttf')) return isEn ? 'TrueType Font file' : 'Файл шрифта TrueType';
    if (nm.endsWith('.fon')) return isEn ? 'Font file' : 'Растровый шрифт';
    if (nm.endsWith('.bfc')) return isEn ? 'Win 98 Briefcase' : 'Портфель Win 98';
    if (nm.endsWith('.txt')) return isEn ? 'Text Document' : 'Текстовый документ';
    if (nm.endsWith('.bmp')) return isEn ? 'Bitmap Image' : 'Точечный рисунок';
    if (nm.endsWith('.wav') || nm.endsWith('.mp3') || nm.endsWith('.mid')) return isEn ? 'Sound Clip' : 'Звукозапись';
    if (nm.endsWith('.avi') || nm.endsWith('.mp4')) return isEn ? 'Video Clip (ActiveMovie)' : 'Видеоклип';
    if (nm.endsWith('.zip') || nm.endsWith('.rar')) return isEn ? 'Compressed Archive' : 'Архив WinRAR';
    if (nm.endsWith('.pdf')) return isEn ? 'Adobe Acrobat Document' : 'Документ PDF';
    if (nm.endsWith('.bas')) return isEn ? 'QBasic Program' : 'Программа QBasic';
    if (nm.endsWith('.ini') || nm.endsWith('.sys') || nm.endsWith('.inf')) return isEn ? 'Configuration Settings' : 'Параметры конфигурации';
    if (nm.endsWith('.bat')) return isEn ? 'MS-DOS Batch File' : 'Пакетный файл MS-DOS';
    return isEn ? 'File' : 'Файл';
  }

  getItemSizeBytes(item) {
    if (item.key === 'A:') return 1457664;
    if (item.key === 'C:') return 2147483648;
    if (item.key === 'D:') return 681574400;
    if (item.type === 'folder' || item.type === 'special' || item.type === 'action' || item.children) return -1;
    if (typeof item.size === 'string') {
      const m = item.size.match(/(\d+(?:\.\d+)?)\s*(KB|MB|B)/i);
      if (m) {
        const val = parseFloat(m[1]);
        const unit = m[2].toUpperCase();
        if (unit === 'MB') return Math.round(val * 1048576);
        if (unit === 'KB') return Math.round(val * 1024);
        return Math.round(val);
      }
    }
    if (typeof item.content === 'string') return Math.max(1024, item.content.length);
    if (item.type === 'executable') return 65536;
    return 4096;
  }

  getItemSizeStr(item) {
    if (item.key === 'A:') return this.localizeSize('1.44 MB');
    if (item.key === 'C:') return this.localizeSize('2.00 GB');
    if (item.key === 'D:') return (window.vfs && window.vfs.isCdRomInserted()) ? this.localizeSize('650 MB') : '';
    if (item.type === 'folder' || item.type === 'special' || item.type === 'action' || item.children) return '';
    if (item.size) return this.localizeSize(item.size);
    const bytes = this.getItemSizeBytes(item);
    return this.localizeSize(Math.max(1, Math.ceil(bytes / 1024)) + ' KB');
  }

  getItemModifiedStr(item) {
    if (item.date) return item.date;
    if (item.type === 'drive' || item.type === 'special' || item.type === 'action') return '';
    const nm = item.name || item.key || '';
    let hash = 0;
    for (let i = 0; i < nm.length; i++) hash = ((hash << 5) - hash) + nm.charCodeAt(i);
    const day = (Math.abs(hash) % 27) + 1;
    const month = ((Math.abs(hash >> 3)) % 11) + 1;
    const hour = ((Math.abs(hash >> 6)) % 14) + 8;
    const min = (Math.abs(hash >> 9)) % 60;
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.98 ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  renderTreePane(win) {
    const el = win.element;
    const treePane = el.querySelector('.explorer-tree-pane');
    if (!treePane) return;
    if (!this.showFoldersTree) {
      treePane.style.display = 'none';
      return;
    }
    treePane.style.display = 'flex';
    const isEn = this.isEn();
    const curKey = this.currentPath.join('/');

    const buildNodeRows = (pathArr, label, iconKey, depth) => {
      const pathKey = pathArr.join('/');
      const node = pathArr[0] === 'Desktop' && pathArr.length === 1
        ? window.vfs.root
        : window.vfs.resolvePath(pathArr);
      const subFolders = [];
      if (node && node.children) {
        Object.keys(node.children).forEach(k => {
          const child = node.children[k];
          if (child && (child.type === 'folder' || child.type === 'drive' || child.type === 'special' || child.children)) {
            subFolders.push({ key: k, node: child });
          }
        });
      }
      const hasChildren = subFolders.length > 0;
      const isExpanded = this.expandedTreePaths.has(pathKey);
      const isActive = curKey === pathKey;
      let html = `
        <div class="explorer-tree-row${isActive ? ' active' : ''}" data-tree-path="${pathKey}" style="padding-left:${depth * 14 + 2}px;">
          ${hasChildren
            ? `<span class="explorer-tree-toggle" data-toggle-path="${pathKey}">${isExpanded ? '-' : '+'}</span>`
            : `<span class="explorer-tree-spacer"></span>`}
          <span class="explorer-tree-icon">${Icons[iconKey] || Icons['folder']}</span>
          <span class="explorer-tree-label">${label}</span>
        </div>
      `;
      if (hasChildren && isExpanded) {
        subFolders.forEach(({ key, node: ch }) => {
          const childPath = pathArr[0] === 'Desktop' && pathArr.length === 1 ? [key] : [...pathArr, key];
          const disp = window.vfs.getNodeDisplayName(ch, key);
          const ic = ch.icon || (ch.type === 'drive' ? 'drive-c' : 'folder');
          html += buildNodeRows(childPath, disp, ic, depth + 1);
        });
      }
      return html;
    };

    treePane.innerHTML = `
      <div class="explorer-tree-header">
        <span>${isEn ? 'All Folders' : 'Все папки'}</span>
        <button class="explorer-tree-close" title="${isEn ? 'Close' : 'Закрыть'}">&#10005;</button>
      </div>
      <div class="explorer-tree-list">
        ${buildNodeRows(['Desktop'], isEn ? 'Desktop' : 'Рабочий стол', 'desktop', 0)}
      </div>
    `;

    const closeBtn = treePane.querySelector('.explorer-tree-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.showFoldersTree = false;
        this.renderFolder(win);
      });
    }

    treePane.querySelectorAll('.explorer-tree-toggle').forEach(tog => {
      tog.addEventListener('click', (e) => {
        e.stopPropagation();
        const pk = tog.getAttribute('data-toggle-path');
        if (this.expandedTreePaths.has(pk)) this.expandedTreePaths.delete(pk);
        else this.expandedTreePaths.add(pk);
        this.renderTreePane(win);
      });
    });

    treePane.querySelectorAll('.explorer-tree-row').forEach(row => {
      row.addEventListener('click', () => {
        const pk = row.getAttribute('data-tree-path');
        if (!pk) return;
        const parts = pk.split('/');
        if (parts.length === 1 && parts[0] === 'Recycle Bin') {
          if (window.appRecycleBin) window.appRecycleBin.open();
          return;
        }
        this.expandedTreePaths.add(pk);
        this.navigateTo(win, parts);
      });
    });
  }

  renderFolder(win) {
    const el = win.element;
    const fileView = el.querySelector('.explorer-file-view');
    const addrInput = el.querySelector('.explorer-address-input');
    const sidebar = el.querySelector('.explorer-sidebar');
    const sidebarTitle = el.querySelector('.explorer-sidebar-title');
    const statusItems = el.querySelector('.explorer-status-items');
    const btnBack = el.querySelector('.btn-back');
    const btnForward = el.querySelector('.btn-forward');
    const btnUp = el.querySelector('.btn-up');
    const btnFolders = el.querySelector('.btn-folders');

    const pathText = this.getPathDisplay();
    if (this.currentPath.length === 1 && this.currentPath[0] === 'Network Neighborhood' && window.appClippy && typeof window.appClippy.onNetworkNeighborhood === 'function') {
      window.appClippy.onNetworkNeighborhood();
    }
    const pathIcon = Icons[this.getPathIcon()] || Icons['folder'];
    addrInput.value = pathText;
    sidebarTitle.textContent = this.getFolderName();
    el.querySelector('.explorer-address-icon').innerHTML = pathIcon;
    el.querySelector('.explorer-sidebar-icon').innerHTML = pathIcon;
    const sidebarDetails = el.querySelector('.explorer-sidebar-details');
    sidebarDetails.textContent = (window.i18n ? window.i18n.t('explorer.sidebarDesc') : '');
    if (this.currentPath[0] === 'Network Neighborhood' && window.Net98Shell && window.Net98Shell.note()) sidebarDetails.textContent = window.Net98Shell.note();
    this.selectedItem = null;
    win.titleElement.textContent = pathText;
    if (window.winManager.setTitle) window.winManager.setTitle(win.id, pathText);

    btnBack.disabled = this.historyIndex <= 0;
    btnForward.disabled = this.historyIndex >= this.history.length - 1;
    btnUp.disabled = this.currentPath.length <= 1;
    if (btnFolders) btnFolders.classList.toggle('active-toggle', !!this.showFoldersTree);

    if (sidebar) {
      sidebar.style.display = this.folderOptions.style === 'classic' ? 'none' : '';
    }
    this.renderTreePane(win);

    let items = window.vfs.list(this.currentPath)
      .filter(it => !it.requiresInstalled || !window.gameManager || window.gameManager.isInstalled(it.requiresInstalled));
    if (!this.folderOptions.showAllFiles) {
      items = items.filter(it => !(it.attributes && it.attributes.hidden) && !/\.(sys|ini)$/i.test(it.name || ''));
    }

    items.sort((a, b) => {
      const aGroup = a.type === 'drive' ? 0 : (a.type === 'folder' || a.type === 'special' || a.children ? 1 : 2);
      const bGroup = b.type === 'drive' ? 0 : (b.type === 'folder' || b.type === 'special' || b.children ? 1 : 2);
      if (aGroup !== bGroup) return aGroup - bGroup;
      let cmp = 0;
      if (this.sortBy === 'size') {
        cmp = this.getItemSizeBytes(a) - this.getItemSizeBytes(b);
      } else if (this.sortBy === 'type') {
        cmp = this.getItemTypeDesc(a).localeCompare(this.getItemTypeDesc(b));
      } else if (this.sortBy === 'modified') {
        cmp = this.getItemModifiedStr(a).localeCompare(this.getItemModifiedStr(b));
      } else {
        cmp = (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '');
      }
      return this.sortAsc ? cmp : -cmp;
    });

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const isEn = this.isEn();

    statusItems.textContent = t('explorer.objectsCount', items.length);
    fileView.className = `explorer-file-view view-${this.viewMode}${this.folderOptions.singleClick ? ' single-click-mode' : ''}`;
    fileView.innerHTML = '';

    if (this.viewMode === 'details') {
      const header = document.createElement('div');
      header.className = 'explorer-details-header';
      const cols = [
        { id: 'name', label: isEn ? 'Name' : 'Имя', right: false },
        { id: 'size', label: isEn ? 'Size' : 'Размер', right: true },
        { id: 'type', label: isEn ? 'Type' : 'Тип', right: false },
        { id: 'modified', label: isEn ? 'Modified' : 'Изменен', right: false }
      ];
      cols.forEach(c => {
        const colEl = document.createElement('div');
        colEl.className = `explorer-details-col${c.right ? ' align-right' : ''}`;
        const arrow = this.sortBy === c.id ? (this.sortAsc ? ' ▲' : ' ▼') : '';
        colEl.textContent = c.label + arrow;
        colEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.sortBy === c.id) this.sortAsc = !this.sortAsc;
          else {
            this.sortBy = c.id;
            this.sortAsc = c.id !== 'size';
          }
          this.renderFolder(win);
        });
        header.appendChild(colEl);
      });
      fileView.appendChild(header);
    }

    fileView.onclick = (e) => {
      if (e.target !== fileView) return;
      fileView.querySelectorAll('.explorer-item').forEach(i => i.classList.remove('selected'));
      this.selectedItem = null;
      sidebarDetails.textContent = t('explorer.sidebarDesc');
    };

    fileView.oncontextmenu = (e) => {
      if (e.target !== fileView) return;
      e.preventDefault();
      e.stopPropagation();

      if (window.contextMenu) {
        const hasClip = !!(window.sharedFileClipboard || this.clipboardItem);
        window.contextMenu.show(e.clientX, e.clientY, [
          {
            label: isEn ? 'View' : 'Вид',
            submenu: [
              { label: (this.viewMode === 'large' ? '• ' : '') + (isEn ? 'Large Icons' : 'Крупные значки'), action: () => { this.viewMode = 'large'; this.renderFolder(win); } },
              { label: (this.viewMode === 'small' ? '• ' : '') + (isEn ? 'Small Icons' : 'Мелкие значки'), action: () => { this.viewMode = 'small'; this.renderFolder(win); } },
              { label: (this.viewMode === 'list' ? '• ' : '') + (isEn ? 'List' : 'Список'), action: () => { this.viewMode = 'list'; this.renderFolder(win); } },
              { label: (this.viewMode === 'details' ? '• ' : '') + (isEn ? 'Details' : 'Таблица'), action: () => { this.viewMode = 'details'; this.renderFolder(win); } }
            ]
          },
          {
            label: isEn ? 'Arrange Icons' : 'Упорядочить значки',
            submenu: [
              { label: isEn ? 'by Name' : 'по имени', action: () => { this.sortBy = 'name'; this.sortAsc = true; this.renderFolder(win); } },
              { label: isEn ? 'by Type' : 'по типу', action: () => { this.sortBy = 'type'; this.sortAsc = true; this.renderFolder(win); } },
              { label: isEn ? 'by Size' : 'по размеру', action: () => { this.sortBy = 'size'; this.sortAsc = false; this.renderFolder(win); } },
              { label: isEn ? 'by Date' : 'по дате', action: () => { this.sortBy = 'modified'; this.sortAsc = false; this.renderFolder(win); } }
            ]
          },
          { label: t('desktop.refresh'), action: () => this.renderFolder(win) },
          { separator: true },
          { label: t('explorer.paste'), disabled: !hasClip, action: () => this.pasteFromClipboard(win, false) },
          { label: isEn ? 'Paste Shortcut' : 'Вставить ярлык', disabled: !hasClip, action: () => this.pasteFromClipboard(win, true) },
          { separator: true },
          {
            label: isEn ? 'New' : 'Создать',
            submenu: [
              { label: t('desktop.newFolder'), action: () => this.createNewItem('folder', win) },
              { label: isEn ? 'Shortcut' : 'Ярлык', action: () => this.createNewItem('shortcut', win) },
              { separator: true },
              { label: t('desktop.newTextDoc'), action: () => this.createNewItem('txt', win) },
              { label: isEn ? 'Bitmap Image' : 'Точечный рисунок', action: () => this.createNewItem('bmp', win) },
              { label: isEn ? 'Wave Sound' : 'Звукозапись', action: () => this.createNewItem('wav', win) },
              { label: isEn ? 'Briefcase' : 'Портфель', action: () => this.createNewItem('briefcase', win) }
            ]
          },
          { separator: true },
          {
            label: t('desktop.properties'),
            action: () => {
              if (this.currentPath.length === 1 && (this.currentPath[0] === 'My Computer' || this.currentPath[0] === 'Мой компьютер')) {
                if (window.appCPanel) window.appCPanel.openSystemProperties();
                return;
              }
              const curNode = window.vfs ? window.vfs.resolvePath(this.currentPath) : null;
              if (curNode) {
                const key = this.currentPath[this.currentPath.length - 1];
                this.openPropertiesDialog({ key, ...curNode }, this.currentPath.slice(0, -1), win);
              }
            }
          }
        ]);
      }
    };

    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'explorer-item' + (this.viewMode === 'details' ? ' details-row' : '');
      let labelText = item.displayName || item.name;
      if (this.folderOptions.hideKnownExt && item.type === 'file') {
        labelText = labelText.replace(/\.(txt|bmp|wav|mp3|mid|avi|mp4|rtf|doc|xls|pdf|zip|rar|lnk|htm|html|url|bfc)$/i, '');
      }
      const iconKey = this.getItemIconKey(item);
      const shortcutOverlay = item.isShortcut ? `<span class="shortcut-overlay">${Icons['shortcut-overlay']}</span>` : '';
      if (this.viewMode === 'details') {
        itemEl.innerHTML = `
          <div class="explorer-details-name">
            <div class="explorer-item-icon">${Icons[iconKey] || Icons[item.icon] || Icons['folder']}${shortcutOverlay}</div>
            <div class="explorer-item-label">${labelText}</div>
          </div>
          <div class="explorer-details-cell align-right">${this.getItemSizeStr(item)}</div>
          <div class="explorer-details-cell">${this.getItemTypeDesc(item)}</div>
          <div class="explorer-details-cell">${this.getItemModifiedStr(item)}</div>
        `;
      } else {
        itemEl.innerHTML = `
          <div class="explorer-item-icon">${Icons[iconKey] || Icons[item.icon] || Icons['folder']}${shortcutOverlay}</div>
          <div class="explorer-item-label">${labelText}</div>
        `;
      }

      const selectThis = () => {
        fileView.querySelectorAll('.explorer-item').forEach(i => i.classList.remove('selected'));
        itemEl.classList.add('selected');
        this.selectedItem = item;
        sidebarDetails.innerHTML = this.describeItem(item, labelText);
      };

      itemEl.addEventListener('mouseenter', () => {
        if (this.folderOptions.singleClick) selectThis();
      });

      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        selectThis();
        if (this.folderOptions.singleClick) {
          this.openItem(win, item);
        }
      });

      itemEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (!this.folderOptions.singleClick) {
          this.openItem(win, item);
        }
      });

      itemEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectThis();

        if (window.contextMenu) {
          const isSpecial = item.type === 'drive' || item.type === 'special' || item.type === 'action';
          if (item.key === 'A:' || item.driveType === 'floppy') {
            window.contextMenu.show(e.clientX, e.clientY, [
              { label: t('menu.open'), bold: true, action: () => this.openItem(win, item) },
              { label: isEn ? 'Explore' : 'Проводник', action: () => { this.showFoldersTree = true; this.navigateTo(win, [...this.currentPath, item.key]); } },
              { separator: true },
              { label: isEn ? 'Format...' : 'Форматировать...', action: () => this.openFormatFloppyDialog(win) },
              { label: isEn ? 'Copy Disk...' : 'Копировать диск...', action: () => this.openFormatFloppyDialog(win) },
              { separator: true },
              { label: t('menu.properties'), action: () => this.openPropertiesDialog(item, this.currentPath, win) }
            ]);
            return;
          }
          if (item.key === 'D:' || item.driveType === 'cdrom') {
            const isInserted = window.vfs && window.vfs.isCdRomInserted();
            const discId = window.vfs && window.vfs.cdRomState && window.vfs.cdRomState.discId;
            const cdMenuItems = [];
            if (isInserted) {
              cdMenuItems.push({
                label: t('explorer.autoPlay'),
                bold: true,
                action: () => window.vfs.openDiscShell(discId)
              });
              cdMenuItems.push({
                label: t('menu.open'),
                action: () => this.navigateTo(win, [...this.currentPath, item.key])
              });
              cdMenuItems.push({ separator: true });
              window.vfs.getDiscCatalog().filter(d => d.id !== discId).forEach(d => {
                cdMenuItems.push({
                  label: d.insertLabel,
                  action: () => window.vfs.insertCdRom('D:', d.id)
                });
              });
              cdMenuItems.push({ separator: true });
              cdMenuItems.push({
                label: t('explorer.eject'),
                action: () => {
                  if (window.vfs) window.vfs.ejectCdRom();
                }
              });
            } else {
              window.vfs.getDiscCatalog().slice().reverse().forEach((d, i) => {
                cdMenuItems.push({
                  label: d.insertLabel,
                  bold: i === 0,
                  action: () => window.vfs.insertCdRom('D:', d.id)
                });
              });
            }
            cdMenuItems.push({ separator: true });
            cdMenuItems.push({
              label: t('menu.properties'),
              action: () => this.openPropertiesDialog(item, this.currentPath, win)
            });
            window.contextMenu.show(e.clientX, e.clientY, cdMenuItems);
            return;
          }

          window.contextMenu.show(e.clientX, e.clientY, [
            { label: t('menu.open'), bold: true, action: () => this.openItem(win, item) },
            ...(item.type === 'folder' || item.type === 'drive' ? [{
              label: isEn ? 'Explore' : 'Проводник',
              action: () => {
                this.showFoldersTree = true;
                this.navigateTo(win, [...this.currentPath, item.key]);
              }
            }] : []),
            { separator: true },
            {
              label: isEn ? 'Send To' : 'Отправить',
              submenu: [
                { label: isEn ? '3½ Floppy (A:)' : 'Диск 3,5 (A:)', action: () => this.sendToTarget('floppy', item, this.currentPath, win) },
                { label: isEn ? 'Desktop (create shortcut)' : 'Рабочий стол (создать ярлык)', action: () => this.sendToTarget('desktop', item, this.currentPath, win) },
                { label: isEn ? 'Mail Recipient' : 'Адресат почты', action: () => this.sendToTarget('mail', item, this.currentPath, win) },
                { label: t('app.myDocs'), action: () => this.sendToTarget('mydocs', item, this.currentPath, win) },
                { label: t('app.notepad'), action: () => this.sendToTarget('notepad', item, this.currentPath, win) }
              ]
            },
            { separator: true },
            {
              label: t('menu.cut'),
              disabled: isSpecial,
              action: () => {
                this.clipboardItem = { item, path: [...this.currentPath], isCut: true };
                window.sharedFileClipboard = this.clipboardItem;
              }
            },
            {
              label: t('menu.copy'),
              disabled: isSpecial,
              action: () => {
                this.clipboardItem = { item, path: [...this.currentPath], isCut: false };
                window.sharedFileClipboard = this.clipboardItem;
              }
            },
            { separator: true },
            {
              label: isEn ? 'Create Shortcut' : 'Создать ярлык',
              disabled: isSpecial,
              action: () => {
                this.clipboardItem = { item, path: [...this.currentPath], isCut: false };
                window.sharedFileClipboard = this.clipboardItem;
                this.pasteFromClipboard(win, true);
              }
            },
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
                this.openPropertiesDialog(item, this.currentPath, win);
              }
            }
          ]);
        }
      });

      fileView.appendChild(itemEl);
    });
  }

  openFolderOptions(win) {
    const isEn = this.isEn();
    const id = 'app_folder_options';
    if (window.winManager.windows.has(id)) {
      window.winManager.bringToTop(id);
      return;
    }
    const fo = this.folderOptions;
    const dlg = window.winManager.createWindow({
      id,
      title: isEn ? 'Folder Options' : 'Свойства папки',
      icon: 'folder',
      width: 370,
      height: 350,
      resizable: false,
      maximizable: false,
      minimizable: false,
      content: `
        <div style="display:flex;flex-direction:column;height:100%;background:var(--win-bg);padding:6px;font-size:11px;">
          <div class="win98-props-tabs">
            <button class="win98-props-tab active" data-fotab="general">${isEn ? 'General' : 'Общие'}</button>
            <button class="win98-props-tab" data-fotab="view">${isEn ? 'View' : 'Вид'}</button>
          </div>
          <div class="win98-props-sheet" style="flex:1;">
            <div class="fo-pane" data-fopane="general">
              <fieldset style="padding:8px;margin-bottom:10px;">
                <legend>${isEn ? 'Win Desktop Update' : 'Стиль рабочего стола и папок Win 98'}</legend>
                <label style="display:block;margin-bottom:6px;">
                  <input type="radio" name="fo_style" value="web" ${fo.style === 'web' ? 'checked' : ''}>
                  <b>${isEn ? 'Web style' : 'Стиль Интернета'}</b> — ${isEn ? 'Left HTML panel & single-click navigation' : 'Левая инфо-панель HTML и веб-обзор папок'}
                </label>
                <label style="display:block;margin-bottom:6px;">
                  <input type="radio" name="fo_style" value="classic" ${fo.style === 'classic' ? 'checked' : ''}>
                  <b>${isEn ? 'Classic style' : 'Классический стиль'}</b> — ${isEn ? 'Traditional Win 95 folder layout' : 'Классический вид папок без веб-панели'}
                </label>
              </fieldset>
              <fieldset style="padding:8px;">
                <legend>${isEn ? 'Click items as follows' : 'Щелчки мышью по значкам'}</legend>
                <label style="display:block;margin-bottom:6px;">
                  <input type="radio" name="fo_click" value="single" ${fo.singleClick ? 'checked' : ''}>
                  ${isEn ? 'Single-click to open an item (point to select)' : 'Открывать одиночным щелчком (выделять наведением)'}
                </label>
                <label style="display:block;">
                  <input type="radio" name="fo_click" value="double" ${!fo.singleClick ? 'checked' : ''}>
                  ${isEn ? 'Double-click to open an item (single-click to select)' : 'Открывать двойным щелчком (выделять одиночным)'}
                </label>
              </fieldset>
            </div>
            <div class="fo-pane" data-fopane="view" style="display:none;">
              <fieldset style="padding:8px;">
                <legend>${isEn ? 'Advanced settings' : 'Дополнительные параметры'}</legend>
                <label style="display:block;margin-bottom:8px;">
                  <input type="checkbox" class="fo-show-all" ${fo.showAllFiles ? 'checked' : ''}>
                  ${isEn ? 'Show all files (including hidden and .SYS/.INI)' : 'Показывать все файлы (включая скрытые и системные)'}
                </label>
                <label style="display:block;margin-bottom:8px;">
                  <input type="checkbox" class="fo-hide-ext" ${fo.hideKnownExt ? 'checked' : ''}>
                  ${isEn ? 'Hide file extensions for known file types' : 'Скрывать расширения для зарегистрированных типов файлов'}
                </label>
              </fieldset>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:6px;padding:4px 6px;">
            <button class="win-btn fo-ok" style="min-width:72px;">OK</button>
            <button class="win-btn fo-cancel" style="min-width:72px;">${isEn ? 'Cancel' : 'Отмена'}</button>
          </div>
        </div>
      `
    });
    const el = dlg.element;
    el.querySelectorAll('.win98-props-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.win98-props-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-fotab');
        el.querySelectorAll('.fo-pane').forEach(p => {
          p.style.display = p.getAttribute('data-fopane') === tab ? 'block' : 'none';
        });
      });
    });
    el.querySelector('.fo-ok').addEventListener('click', () => {
      const styleRadio = el.querySelector('input[name="fo_style"]:checked');
      const clickRadio = el.querySelector('input[name="fo_click"]:checked');
      this.folderOptions.style = styleRadio ? styleRadio.value : 'web';
      this.folderOptions.singleClick = clickRadio ? clickRadio.value === 'single' : false;
      this.folderOptions.showAllFiles = !!el.querySelector('.fo-show-all').checked;
      this.folderOptions.hideKnownExt = !!el.querySelector('.fo-hide-ext').checked;
      this.saveFolderOptions();
      window.winManager.closeWindow(id);
      if (win) this.renderFolder(win);
    });
    el.querySelector('.fo-cancel').addEventListener('click', () => window.winManager.closeWindow(id));
  }

  openPropertiesDialog(item, pathParts = [], win = null) {
    if (!item) return;
    const isEn = this.isEn();
    const key = item.key || item.name || 'Item';
    const id = 'app_props_' + key.replace(/[^a-z0-9]/gi, '_');
    if (window.winManager.windows.has(id)) {
      window.winManager.bringToTop(id);
      return;
    }

    const isDrive = item.type === 'drive' || key === 'A:' || key === 'C:' || key === 'D:';
    if (isDrive) {
      const driveInfo = key === 'A:'
        ? { label: item.volumeLabel || 'BOOT98_FD', fs: 'FAT12', type: isEn ? '3½-Inch Floppy Disk' : 'Дисковод гибких дисков 3,5"', usedBytes: '262,144', usedHuman: '256 KB', freeBytes: '1,195,520', freeHuman: '1.18 MB', capBytes: '1,457,664', capHuman: '1.44 MB', usedPct: '18%' }
        : (key === 'D:' || item.driveType === 'cdrom')
        ? { label: (window.vfs && window.vfs.cdRomState && window.vfs.cdRomState.volumeLabel) || 'IGROMANIA_98', fs: 'CDFS', type: isEn ? 'CD-ROM Drive' : 'Дисковод CD-ROM', usedBytes: '671,088,640', usedHuman: '640 MB', freeBytes: '0', freeHuman: '0 bytes', capBytes: '671,088,640', capHuman: '640 MB', usedPct: '100%' }
        : { label: item.volumeLabel || 'WIN98_SE', fs: 'FAT32', type: isEn ? 'Local Disk' : 'Локальный диск', usedBytes: '622,770,257', usedHuman: '594 MB', freeBytes: '1,524,713,391', freeHuman: '1.41 GB', capBytes: '2,147,483,648', capHuman: '2.00 GB', usedPct: '29%' };
      if (!isEn) {
        ['usedBytes', 'freeBytes', 'capBytes'].forEach(f => { driveInfo[f] = driveInfo[f].replace(/,/g, ' '); });
        ['usedHuman', 'freeHuman', 'capHuman'].forEach(f => { driveInfo[f] = this.localizeSize(driveInfo[f]); });
      }

      const dlg = window.winManager.createWindow({
        id,
        title: this.propertiesTitle(item.displayName || item.name || key),
        icon: this.getItemIconKey(item),
        width: 350,
        height: 410,
        resizable: false,
        maximizable: false,
        minimizable: false,
        content: `
          <div style="display:flex;flex-direction:column;height:100%;background:var(--win-bg);padding:6px;font-size:11px;">
            <div class="win98-props-tabs">
              <button class="win98-props-tab active" data-ptab="general">${isEn ? 'General' : 'Общие'}</button>
              <button class="win98-props-tab" data-ptab="tools">${isEn ? 'Tools' : 'Сервис'}</button>
            </div>
            <div class="win98-props-sheet" style="flex:1;">
              <div class="props-pane" data-ppane="general">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                  <div style="width:32px;height:32px;">${Icons[this.getItemIconKey(item)] || Icons['drive-c']}</div>
                  <div style="flex:1;">
                    <div style="margin-bottom:2px;">${isEn ? 'Label:' : 'Метка:'}</div>
                    <input type="text" class="win-input props-vol-label" value="${driveInfo.label}" style="width:100%;padding:2px 4px;">
                  </div>
                </div>
                <div style="margin-bottom:4px;">${isEn ? 'Type:' : 'Тип:'} &nbsp; <b>${driveInfo.type}</b></div>
                <div style="margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #808080;">${isEn ? 'File system:' : 'Файловая система:'} &nbsp; <b>${driveInfo.fs}</b></div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <span style="width:11px;height:11px;background:#0000ff;border:1px solid #000;display:inline-block;"></span>
                  <span style="width:85px;">${isEn ? 'Used space:' : 'Занято:'}</span>
                  <span style="flex:1;text-align:right;">${driveInfo.usedBytes} ${isEn ? 'bytes' : 'байт'}</span>
                  <b style="width:58px;text-align:right;">${driveInfo.usedHuman}</b>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #808080;">
                  <span style="width:11px;height:11px;background:#ff00ff;border:1px solid #000;display:inline-block;"></span>
                  <span style="width:85px;">${isEn ? 'Free space:' : 'Свободно:'}</span>
                  <span style="flex:1;text-align:right;">${driveInfo.freeBytes} ${isEn ? 'bytes' : 'байт'}</span>
                  <b style="width:58px;text-align:right;">${driveInfo.freeHuman}</b>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <span style="width:11px;"></span>
                  <span style="width:85px;">${isEn ? 'Capacity:' : 'Емкость:'}</span>
                  <span style="flex:1;text-align:right;">${driveInfo.capBytes} ${isEn ? 'bytes' : 'байт'}</span>
                  <b style="width:58px;text-align:right;">${driveInfo.capHuman}</b>
                </div>
                <div class="win98-props-pie3d" style="--used:${driveInfo.usedPct};"></div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span>${isEn ? 'Drive' : 'Диск'} ${key}</span>
                  <button class="win-btn props-cleanmgr" style="padding:2px 8px;">${isEn ? 'Disk Cleanup...' : 'Очистка диска...'}</button>
                </div>
              </div>
              <div class="props-pane" data-ppane="tools" style="display:none;">
                <fieldset style="padding:8px;margin-bottom:8px;">
                  <legend>${isEn ? 'Error-checking status' : 'Проверка диска'}</legend>
                  <div style="margin-bottom:6px;">${isEn ? 'This option will check the volume for errors.' : 'Проверка тома на наличие ошибок файловой системы.'}</div>
                  <div style="text-align:right;"><button class="win-btn props-scandisk" style="padding:2px 10px;">${isEn ? 'Check Now...' : 'Выполнить проверку...'}</button></div>
                </fieldset>
                <fieldset style="padding:8px;margin-bottom:8px;">
                  <legend>${isEn ? 'Backup status' : 'Архивация'}</legend>
                  <div style="margin-bottom:6px;">${isEn ? 'This option will back up the files on the volume.' : 'Резервное копирование файлов на выбранном томе.'}</div>
                  <div style="text-align:right;"><button class="win-btn props-backup" style="padding:2px 10px;">${isEn ? 'Backup Now...' : 'Выполнить архивацию...'}</button></div>
                </fieldset>
                <fieldset style="padding:8px;">
                  <legend>${isEn ? 'Defragmentation status' : 'Дефрагментация'}</legend>
                  <div style="margin-bottom:6px;">${isEn ? 'This option will defragment the files on the volume.' : 'Оптимизация расположения файлов и свободного места.'}</div>
                  <div style="text-align:right;"><button class="win-btn props-defrag" style="padding:2px 10px;">${isEn ? 'Defragment Now...' : 'Выполнить дефрагментацию...'}</button></div>
                </fieldset>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:6px;padding:4px 6px;">
              <button class="win-btn props-ok" style="min-width:72px;">OK</button>
              <button class="win-btn props-cancel" style="min-width:72px;">${isEn ? 'Cancel' : 'Отмена'}</button>
            </div>
          </div>
        `
      });
      const el = dlg.element;
      el.querySelectorAll('.win98-props-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          el.querySelectorAll('.win98-props-tab').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tab = btn.getAttribute('data-ptab');
          el.querySelectorAll('.props-pane').forEach(p => {
            p.style.display = p.getAttribute('data-ppane') === tab ? 'block' : 'none';
          });
        });
      });
      el.querySelector('.props-cleanmgr').addEventListener('click', () => {
        if (window.appSysTools) window.appSysTools.openCleanMgr();
      });
      el.querySelector('.props-scandisk').addEventListener('click', () => {
        if (window.appSysTools) window.appSysTools.openScanDisk();
      });
      el.querySelector('.props-backup').addEventListener('click', () => {
        if (window.appBackup) window.appBackup.open('backup');
      });
      el.querySelector('.props-defrag').addEventListener('click', () => {
        if (window.appSysTools) window.appSysTools.openDefrag();
      });
      el.querySelector('.props-ok').addEventListener('click', () => {
        const vol = el.querySelector('.props-vol-label').value.trim();
        const vfsNode = window.vfs && window.vfs.resolvePath([...pathParts, key]);
        if (vfsNode) {
          vfsNode.volumeLabel = vol;
          window.vfs.saveToStorage();
        }
        window.winManager.closeWindow(id);
      });
      el.querySelector('.props-cancel').addEventListener('click', () => window.winManager.closeWindow(id));
      return;
    }

    window.appFileProperties.openForItem(item, pathParts, win);
  }

  openFormatFloppyDialog(win = null) {
    const isEn = this.isEn();
    const id = 'app_format_floppy';
    if (window.winManager.windows.has(id)) {
      window.winManager.bringToTop(id);
      return;
    }
    const driveA = window.vfs ? window.vfs.resolvePath(['My Computer', 'A:']) : null;
    const curLabel = (driveA && driveA.volumeLabel) || 'BOOT98_FD';

    const dlg = window.winManager.createWindow({
      id,
      title: isEn ? 'Format - 3½ Floppy (A:)' : 'Форматирование — Диск 3,5 (A:)',
      icon: 'drive-floppy',
      width: 340,
      height: 365,
      resizable: false,
      maximizable: false,
      minimizable: false,
      content: `
        <div style="display:flex;flex-direction:column;height:100%;background:var(--win-bg);padding:10px;font-size:11px;gap:8px;">
          <div style="display:flex;gap:10px;">
            <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
              <div>
                <div style="margin-bottom:3px;">${isEn ? 'Capacity:' : 'Емкость:'}</div>
                <select class="win-input fmt-cap" style="width:100%;padding:2px;">
                  <option value="1.44">${isEn ? '1.44 Mb (3.5")' : '1,44 Мб (3,5")'}</option>
                  <option value="0.72">${isEn ? '720 Kb (3.5")' : '720 Кб (3,5")'}</option>
                </select>
              </div>
              <fieldset style="padding:6px 8px;">
                <legend>${isEn ? 'Format type' : 'Способ форматирования'}</legend>
                <label style="display:block;margin-bottom:4px;"><input type="radio" name="fmt_type" value="quick" checked> ${isEn ? 'Quick (erase)' : 'Быстрое (очистка оглавления)'}</label>
                <label style="display:block;margin-bottom:4px;"><input type="radio" name="fmt_type" value="full"> ${isEn ? 'Full' : 'Полное'}</label>
                <label style="display:block;"><input type="radio" name="fmt_type" value="sys"> ${isEn ? 'Copy system files only' : 'Только копирование системных файлов'}</label>
              </fieldset>
              <fieldset style="padding:6px 8px;">
                <legend>${isEn ? 'Other options' : 'Другие параметры'}</legend>
                <div style="margin-bottom:3px;">${isEn ? 'Label:' : 'Метка:'}</div>
                <input type="text" class="win-input fmt-label" value="${curLabel}" maxlength="11" style="width:100%;padding:2px 4px;margin-bottom:6px;">
                <label style="display:block;margin-bottom:4px;"><input type="checkbox" class="fmt-summary" checked> ${isEn ? 'Display summary when finished' : 'Вывести отчет о результатах'}</label>
                <label style="display:block;"><input type="checkbox" class="fmt-copysys"> ${isEn ? 'Copy system files' : 'Скопировать системные файлы'}</label>
              </fieldset>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;width:82px;">
              <button class="win-btn fmt-start" style="width:100%;font-weight:bold;">${isEn ? 'Start' : 'Начать'}</button>
              <button class="win-btn fmt-close" style="width:100%;">${isEn ? 'Close' : 'Закрыть'}</button>
            </div>
          </div>
          <div style="margin-top:auto;">
            <div style="margin-bottom:3px;" class="fmt-status-text">${isEn ? 'Formatting progress:' : 'Ход форматирования:'}</div>
            <div style="height:18px;background:#fff;box-shadow:inset 1px 1px 0 #808080,inset -1px -1px 0 #fff;padding:2px;">
              <div class="fmt-bar" style="height:100%;width:0%;background:#000080;"></div>
            </div>
          </div>
        </div>
      `
    });
    const el = dlg.element;
    el.querySelector('.fmt-close').addEventListener('click', () => window.winManager.closeWindow(id));
    el.querySelector('.fmt-start').addEventListener('click', () => {
      const startBtn = el.querySelector('.fmt-start');
      const bar = el.querySelector('.fmt-bar');
      const statusTxt = el.querySelector('.fmt-status-text');
      const fmtType = (el.querySelector('input[name="fmt_type"]:checked') || {}).value || 'quick';
      const copySys = fmtType === 'sys' || el.querySelector('.fmt-copysys').checked;
      const showSummary = el.querySelector('.fmt-summary').checked;
      const newLabel = el.querySelector('.fmt-label').value.trim().toUpperCase() || 'WIN98_FD';

      startBtn.disabled = true;
      if (window.soundSys && window.soundSys.playFloppySeekSound) window.soundSys.playFloppySeekSound();
      let pct = 0;
      const timer = setInterval(() => {
        pct += 25;
        bar.style.width = Math.min(100, pct) + '%';
        statusTxt.textContent = (isEn ? 'Formatting... ' : 'Форматирование... ') + Math.min(100, pct) + '%';
        if (pct >= 100) {
          clearInterval(timer);
          startBtn.disabled = false;
          statusTxt.textContent = isEn ? 'Formatting complete.' : 'Форматирование завершено.';
          if (driveA) {
            driveA.volumeLabel = newLabel;
            if (fmtType !== 'sys') driveA.children = {};
            if (copySys) {
              driveA.children['COMMAND.COM'] = {
                type: 'file',
                name: 'COMMAND.COM',
                icon: 'file-sys',
                size: '92 KB',
                content: 'Microslop(R) Win 98 Command Interpreter Version 4.10.1998'
              };
            }
            window.vfs.saveToStorage();
          }
          if (win) this.renderFolder(win);
          if (window.appClippy && typeof window.appClippy.onFloppyFormatted === 'function') {
            window.appClippy.onFloppyFormatted({ system: Boolean(copySys) });
          }
          if (showSummary) {
            window.winManager.openDialog({
              title: isEn ? 'Format Results - 3½ Floppy (A:)' : 'Результаты форматирования — Диск 3,5 (A:)',
              icon: 'info',
              message: isEn
                ? `<b>1,457,664</b> bytes total disk space<br><b>${copySys ? '94,208' : '0'}</b> bytes used by system files<br><b>0</b> bytes in bad sectors<br><b>${copySys ? '1,363,456' : '1,457,664'}</b> bytes available on disk<br><br>512 bytes in each allocation unit<br>Volume serial number is <b>1998-09FE</b>`
                : `Общий объем диска: <b>1 457 664</b> байт<br>Занято системными файлами: <b>${copySys ? '94 208' : '0'}</b> байт<br>В поврежденных секторах: <b>0</b> байт<br>Доступно на диске: <b>${copySys ? '1 363 456' : '1 457 664'}</b> байт<br><br>Размер кластера: 512 байт<br>Серийный номер тома: <b>1998-09FE</b>`
            });
          }
        }
      }, 150);
    });
  }

  openBriefcaseWindow(item) {
    const isEn = this.isEn();
    const id = 'app_briefcase';
    if (window.winManager.windows.has(id)) {
      window.winManager.bringToTop(id);
      return;
    }
    const dlg = window.winManager.createWindow({
      id,
      title: (item && item.name) || (isEn ? 'My Briefcase' : 'Мой портфель'),
      icon: 'briefcase',
      width: 440,
      height: 290,
      content: `
        <div style="display:flex;flex-direction:column;height:100%;background:var(--win-bg);font-size:11px;">
          <div class="win-menubar">
            <div class="win-menu-item">${isEn ? 'Briefcase' : 'Портфель'}
              <div class="win-menu-dropdown">
                <div class="win-dropdown-option bfc-update-all">${isEn ? 'Update All' : 'Обновить все'}</div>
              </div>
            </div>
          </div>
          <div style="padding:6px 8px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #808080;">
            <div style="width:32px;height:32px;">${Icons['briefcase']}</div>
            <div style="flex:1;">${isEn ? 'Keep files synchronized between your desktop PC and floppy disk A:.' : 'Синхронизация рабочих документов между компьютером и дискетой 3,5 (A:).'}</div>
            <button class="win-btn bfc-sync-btn" style="padding:3px 10px;font-weight:bold;">${isEn ? 'Update All' : 'Обновить все'}</button>
          </div>
          <div style="flex:1;background:#fff;margin:4px;box-shadow:inset 1px 1px 0 #808080;padding:6px;overflow:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:11px;">
              <thead>
                <tr style="background:#d4d0c8;text-align:left;">
                  <th style="padding:2px 6px;border:1px outset #fff;">${isEn ? 'Name' : 'Имя'}</th>
                  <th style="padding:2px 6px;border:1px outset #fff;">${isEn ? 'Sync Copy In' : 'Исходная папка'}</th>
                  <th style="padding:2px 6px;border:1px outset #fff;">${isEn ? 'Status' : 'Состояние'}</th>
                </tr>
              </thead>
              <tbody class="bfc-rows">
                <tr>
                  <td style="padding:3px 6px;">HOMEWORK.BAS</td>
                  <td style="padding:3px 6px;">C:\\My Documents</td>
                  <td style="padding:3px 6px;" class="bfc-stat-1">${isEn ? 'Needs updating' : 'Требует обновления'}</td>
                </tr>
                <tr>
                  <td style="padding:3px 6px;">NOTES98.TXT</td>
                  <td style="padding:3px 6px;">A:\\</td>
                  <td style="padding:3px 6px;" class="bfc-stat-2">${isEn ? 'Up-to-date' : 'Не требует обновления'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="win-statusbar">
            <div class="win-status-pane bfc-status grow">${isEn ? '1 of 2 files needs updating' : 'Файлов, требующих обновления: 1'}</div>
          </div>
        </div>
      `
    });
    const el = dlg.element;
    const doSync = () => {
      if (window.soundSys && window.soundSys.playFloppySeekSound) window.soundSys.playFloppySeekSound();
      el.querySelector('.bfc-stat-1').textContent = isEn ? 'Up-to-date' : 'Не требует обновления';
      el.querySelector('.bfc-status').textContent = isEn ? 'All files are up-to-date.' : 'Все файлы в портфеле синхронизированы.';
    };
    el.querySelector('.bfc-sync-btn').addEventListener('click', doSync);
    el.querySelector('.bfc-update-all').addEventListener('click', doSync);
  }

  openItem(win, item) {
    if (window.soundSys) window.soundSys.playClick();
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    if (item.app === 'shortcut' && window.taskbar) {
      window.taskbar.openStartMenuLink({ ref: item.content, name: item.name || item.key });
      return;
    }
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
            ...window.vfs.getDiscCatalog().slice().reverse().map(d => ({
              text: d.insertButton,
              isDefault: d.id === 'igromania_09_1998',
              primary: d.id === 'igromania_09_1998',
              action: () => {
                window.vfs.insertCdRom('D:', d.id);
                this.renderFolder(win);
              }
            })),
            { text: t('btn.cancel'), action: () => {} }
          ]
        });
        return;
      }
      if (this.currentPath.length === 1 && this.currentPath[0] === 'My Computer') {
        window.vfs.openDiscShell(discId);
        return;
      }
      this.navigateTo(win, [...this.currentPath, item.key]);
      return;
    }

    if (item.type === 'folder' || item.type === 'drive' || item.type === 'special') {
      this.navigateTo(win, [...this.currentPath, item.key]);
    } else if (item.type === 'executable') {
      if (item.app === 'igroman' || item.name === 'igroman.exe') {
        if (window.appIgroman) window.appIgroman.open();
      } else if (window.Og2 && window.Og2.isOg2App(item.app)) {
        window.Og2.openApp(item.app);
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
      else if (item.app === 'bliss' && window.appBliss) window.appBliss.open();
      else if (item.app === 'wolf3d') {
        if (window.gameManager && !window.gameManager.isInstalled('wolf3d')) {
          window.winManager.openDialog({ title: 'Wolfenstein 3D', icon: 'error', message: t('store.gameNotInstalled', 'Wolfenstein 3D') });
        } else if (window.appWolf3D) window.appWolf3D.open();
      }
      else if (item.app === 'quest_demo') {
        if (window.gameManager && !window.gameManager.isInstalled('quest_demo')) {
          window.gameManager.showOnCd('quest_demo');
        } else if (window.appScummQuest) window.appScummQuest.open();
      }
      else if (item.app === 'stalker') {
        if (window.gameManager && !window.gameManager.isInstalled('stalker')) {
          window.winManager.openDialog({ title: 'S.T.A.L.K.E.R.', icon: 'error', message: t('store.gameNotInstalled', 'S.T.A.L.K.E.R.') });
        } else if (window.appStalker) window.appStalker.open();
      }
      else if (item.app === 'fallout98_demo' || item.name === 'FALLOUT2.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('fallout98_demo')) {
          window.gameManager.showOnCd('fallout98_demo');
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
      else if (item.app === 'hockey' || item.name === 'HOCKEY98.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('hockey')) {
          const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
          window.winManager.openDialog({
            title: 'NHL 98',
            icon: 'error',
            message: isRu
              ? 'Игра NHL 98 не установлена.<br>Вы можете установить её с компакт-диска «Игромания» (D:\\demo\\nhl98demo.exe).'
              : 'Game NHL 98 is not installed.<br>You can install it from the Igromania disc (D:\\demo\\nhl98demo.exe).'
          });
        } else if (window.appHockey) window.appHockey.open();
      }
      else if (item.app === 'worldcup98' || item.name === 'WORLDCUP98.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('worldcup98')) {
          const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
          window.winManager.openDialog({
            title: 'World Cup 98',
            icon: 'error',
            message: isRu
              ? 'Игра World Cup 98 не установлена.<br>Вы можете установить её с компакт-диска «Игромания» (D:\\demo\\worldcup98.exe).'
              : 'Game World Cup 98 is not installed.<br>You can install it from the Igromania disc (D:\\demo\\worldcup98.exe).'
          });
        } else if (window.appWorldCup98) window.appWorldCup98.open();
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
      else if (item.app === 'moh98_demo' || item.name === 'MOH.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('moh98_demo')) {
          window.gameManager.showOnCd('moh98_demo');
        } else if (window.appMoh98) window.appMoh98.open();
      }
      else if (item.app === 'cop98' || item.name === 'ZATON.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('cop98')) {
          window.winManager.openDialog({ title: 'S.T.A.L.K.E.R.: Зов Припяти 98', icon: 'error', message: t('store.gameNotInstalled', 'S.T.A.L.K.E.R.: Зов Припяти 98') });
        } else if (window.appCop98) window.appCop98.open();
      }
      else if (item.app === 'tekken98_demo' || item.name === 'TEKKEN3.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('tekken98_demo')) {
          window.gameManager.showOnCd('tekken98_demo');
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
      else if (item.app === 'sammax202_demo' || item.name === 'SAMMAX22.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('sammax202_demo')) {
          window.gameManager.showOnCd('sammax202_demo');
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
      else if (item.app === 'xiii_demo' || item.name === 'XIII.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('xiii_demo')) {
          window.gameManager.showOnCd('xiii_demo');
        } else if (window.appXiii) window.appXiii.open();
      }
      else if (item.app === 'maxpayne_demo' || item.name === 'MAXPAYNE.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('maxpayne_demo')) {
          window.gameManager.showOnCd('maxpayne_demo');
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
      else if (item.app === 'homm1_demo' || item.name === 'HEROES.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('homm1_demo')) {
          window.gameManager.showOnCd('homm1_demo');
        } else if (window.appHomm1) window.appHomm1.open();
      }
      else if (item.app === 'falloutzp_demo' || item.name === 'FALLOUTZP.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('falloutzp_demo')) {
          window.gameManager.showOnCd('falloutzp_demo');
        } else if (window.appFalloutZP) window.appFalloutZP.open();
      }
      else if (item.app === 'anotherwar' || item.name === 'AW.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('anotherwar')) {
          window.gameManager.showInSteam('anotherwar');
        } else if (window.appAnotherWar) window.appAnotherWar.open();
      }
      else if (item.app === 'korovany_demo' || item.name === 'KOROVANY.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('korovany_demo')) {
          window.gameManager.showOnCd('korovany_demo');
        } else if (window.appKorovany) window.appKorovany.open();
      }
      else if (item.app === 'kirill98' || item.name === 'KIRILL98.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('kirill98')) {
          window.gameManager.showInSteam('kirill98');
        } else if (window.appKirill98) window.appKirill98.open();
      }
      else if (item.app === 'catniss' || item.name === 'CATNISS.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('catniss')) {
          window.gameManager.showInSteam('catniss');
        } else if (window.appCatniss) window.appCatniss.open();
      }
      else if (item.app === 'plov' || item.name === 'PLOV.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('plov')) {
          window.gameManager.showInSteam('plov');
        } else if (window.appPlov) window.appPlov.open();
      }
      else if (item.app === 'sims3_demo' || item.name === 'SIMS3.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('sims3_demo')) {
          window.gameManager.showOnCd('sims3_demo');
        } else if (window.appSims3) window.appSims3.open();
      }
      else if (item.app === 'forza' || item.name === 'FORZA.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('forza')) {
          window.gameManager.showInSteam('forza');
        } else if (window.appForza) window.appForza.open();
      }
      else if (item.app === 'dmc98_demo' || item.name === 'DMC4.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('dmc98_demo')) {
          window.gameManager.showOnCd('dmc98_demo');
        } else if (window.appDmc98) window.appDmc98.open();
      }
      else if (item.app === 'dao98_demo' || item.name === 'DAORIGINS.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('dao98_demo')) {
          window.gameManager.showOnCd('dao98_demo');
        } else if (window.appDao98) window.appDao98.open();
      }
      else if (item.app === 'hl2_demo' || item.name === 'HL2.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('hl2_demo')) {
          window.gameManager.showOnCd('hl2_demo');
        } else if (window.appHl2) window.appHl2.open();
      }
      else if (item.app === 'gta90' || item.name === 'GTA90.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('gta90')) {
          window.winManager.openDialog({ title: "Grand Theft Auto: Екатеринбург '90", icon: 'error', message: t('store.gameNotInstalled', "Grand Theft Auto: Екатеринбург '90") });
        } else if (window.appGta90) window.appGta90.open();
      }
      else if (item.app === 'kotor98_demo' || item.name === 'KOTOR.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('kotor98_demo')) {
          window.gameManager.showOnCd('kotor98_demo');
        } else if (window.appKotor98) window.appKotor98.open();
      }
      else if (item.app === 'hsr98' || item.name === 'STARRAIL.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('hsr98')) {
          window.winManager.openDialog({ title: 'Honkai: Star Rail 98', icon: 'error', message: t('store.gameNotInstalled', 'Honkai: Star Rail 98') });
        } else if (window.appHsr98) window.appHsr98.open();
      }
      else if (item.app === 'mc98_demo' || item.name === 'MINECRAFT.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('mc98_demo')) {
          window.gameManager.showOnCd('mc98_demo');
        } else if (window.appMc98) window.appMc98.open();
      }
      else if (item.app === 'stalker98_demo' || item.name === 'XR98.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('stalker98_demo')) {
          window.gameManager.showOnCd('stalker98_demo');
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
      else if (item.app === 'esheep' || item.name === 'SHEEP.EXE' || item.name === 'ESHEEP.EXE') {
        if (window.gameManager && !window.gameManager.isInstalled('esheep')) {
          window.winManager.openDialog({ title: 'eSheep 98', icon: 'error', message: t('store.appNotInstalled', 'eSheep 98') });
        } else if (window.appESheep) window.appESheep.open();
      }
      else if (item.app === 'neko' || item.name === 'NEKO.EXE') {
        if (window.appNeko) window.appNeko.open();
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
      } else if ((item.app === 'msbackup' || item.name === 'MSBACKUP.EXE') && window.appBackup) {
        window.appBackup.open();
      } else if ((item.app === 'bugreport' || item.name === 'BUGREPORT.EXE') && window.appBugReport) {
        window.appBugReport.open();
      } else if ((item.app === 'cleanmgr' || item.name === 'CLEANMGR.EXE') && window.appSysTools) {
        window.appSysTools.openCleanMgr();
      } else if ((item.app === 'command' || item.name === 'COMMAND.COM') && window.appSysTools) {
        window.appSysTools.openDosPromptWindow();
      } else if ((item.app === 'clippy' || item.name === 'CLIPPY.EXE') && window.appClippy) {
        window.appClippy.launch('exe');
      } else if ((item.app === 'qbasic' || item.name === 'QBASIC.EXE') && window.appQBasic) {
        window.appQBasic.open();
      } else if ((item.app === 'mon_test' || item.name === 'mon_test.exe' || item.name === 'MON_TEST.EXE') && window.appMonTest) {
        window.appMonTest.open();
      } else if ((item.app === 'cdex' || item.name === 'cdex014.exe' || item.name === 'CDEX014.EXE') && window.appCDex) {
        window.appCDex.open();
      } else if ((item.app === 'wintune' || item.name === 'wintn975_616.exe' || item.name === 'WINTUNE.EXE') && window.appWintune) {
        window.appWintune.open('wintune');
      } else if ((item.app === 'clibench' || item.name === 'clibench.exe' || item.name === 'CLIBENCH.EXE') && window.appWintune) {
        window.appWintune.open('clibench');
      } else if ((item.app === 'cdplayer' || item.name === 'CDPLAYER.EXE' || item.name === 'cdplayer.exe') && window.appCDPlayer) {
        window.appCDPlayer.open();
      } else if ((item.app === 'sysmon' || item.name === 'SYSMON.EXE' || item.name === 'sysmon.exe') && window.appSysMon) {
        window.appSysMon.open();
      } else if ((item.app === 'hypertrm' || item.name === 'HYPERTRM.EXE' || item.name === 'hypertrm.exe') && window.appHyperTerminal) {
        window.appHyperTerminal.open();
      } else if ((item.app === 'clipbrd' || item.name === 'CLIPBRD.EXE' || item.name === 'clipbrd.exe') && window.appClipboardViewer) {
        window.appClipboardViewer.open();
      } else if ((item.app === 'mirc' || item.name === 'MIRC32.EXE' || item.name === 'mirc32.exe') && window.appMIRC) {
        window.appMIRC.open();
      } else if ((item.app === 'fasttracker' || item.name === 'FT2.EXE' || item.name === 'ft2.exe') && window.appFastTracker) {
        window.appFastTracker.open();
      } else if ((item.app === 'acrobat' || item.name === 'AR32E301.EXE' || item.name === 'ar32e301.exe') && window.appAcrobat) {
        window.appAcrobat.open();
      } else if ((item.app === 'acdsee' || item.name === 'ACDC3223.EXE' || item.name === 'acdc3223.exe') && window.appACDSee) {
        window.appACDSee.open();
      } else if ((item.app === 'emulator' || /^(emuland98|nesticle|genecyst|zsnesw|vgb98)\.exe$/i.test(item.name || '')) && window.appEmulator) {
        window.appEmulator.open(item.core || null);
      } else if ((item.app === 'welcome' || item.name === 'WELCOME.EXE') && window.appDialogs && window.appDialogs.openWelcomeApp) {
        window.appDialogs.openWelcomeApp();
      } else if ((item.app === 'winipcfg' || item.name === 'WINIPCFG.EXE') && window.appSysTools && window.appSysTools.openWinIpCfg) {
        window.appSysTools.openWinIpCfg();
      } else if ((item.app === 'msinfo32' || item.name === 'MSINFO32.EXE') && window.appSysTools && window.appSysTools.openMsInfo32) {
        window.appSysTools.openMsInfo32();
      } else if ((item.app === 'sfc' || item.name === 'SFC.EXE') && window.appSysTools && window.appSysTools.openSfc) {
        window.appSysTools.openSfc();
      } else if ((item.app === 'scanreg' || item.name === 'SCANREGW.EXE') && window.appSysTools && window.appSysTools.openScanReg) {
        window.appSysTools.openScanReg();
      } else if ((item.app === 'drvspace' || item.name === 'DRVSPACE.EXE') && window.appSysTools && window.appSysTools.openDriveSpace) {
        window.appSysTools.openDriveSpace();
      } else if ((item.app === 'hearts' || item.name === 'MSHEARTS.EXE') && window.appHearts) {
        window.appHearts.open();
      } else if ((item.app === 'fontview' || item.name === 'FONTVIEW.EXE') && window.appCPanel && window.appCPanel.openFontViewer) {
        window.appCPanel.openFontViewer();
      }
    } else if (item.type === 'file') {
      if (window.taskbar && Array.isArray(this.currentPath)) window.taskbar.addRecentDocument(this.currentPath, item);
      const nameLower = (item.name || '').toLowerCase();
      if (item.app === 'fontview' || nameLower.endsWith('.ttf') || nameLower.endsWith('.fon')) {
        if (window.appCPanel && window.appCPanel.openFontViewer) window.appCPanel.openFontViewer(item);
      } else if (item.app === 'briefcase' || nameLower.endsWith('.bfc')) {
        this.openBriefcaseWindow(item);
      } else if (item.app === 'emulator' || /\.(nes|bin|smd|gen|smc|sfc|gb|gbc|sta)$/.test(nameLower)) {
        if (window.appEmulator) window.appEmulator.open(item.name, item.content, this.currentPath);
      } else if (item.app === 'qbasic' || nameLower.endsWith('.bas')) {
        if (window.appQBasic) window.appQBasic.open(item.name, item.content, this.currentPath);
      } else if (item.app === 'hypertrm' || nameLower.endsWith('.ht')) {
        if (window.appHyperTerminal) window.appHyperTerminal.open(item.stationId || item.name);
      } else if (item.app === 'clipbrd' || nameLower.endsWith('.clp')) {
        if (window.appClipboardViewer) window.appClipboardViewer.open(item.name, item.content);
      } else if (item.app === 'fasttracker' || nameLower.endsWith('.xm') || nameLower.endsWith('.mod')) {
        if (window.appFastTracker) window.appFastTracker.open(item.name);
      } else if (item.app === 'acrobat' || nameLower.endsWith('.pdf')) {
        if (window.appAcrobat) window.appAcrobat.open(item.name);
      } else if (item.app === 'acdsee') {
        if (window.appACDSee) window.appACDSee.open(item.name);
      } else if (item.app === 'blender204' || /\.blend\d*$/.test(nameLower)) {
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
      } else if (nameLower.endsWith('.txt') || nameLower.endsWith('.ini') || nameLower.endsWith('.log') || nameLower.endsWith('.bat') || nameLower.endsWith('.sys') || nameLower.endsWith('.inf')) {
        if (window.appNotepad) window.appNotepad.open(item.name, item.content, this.currentPath);
      } else {
        window.winManager.openDialog({
          title: item.name,
          icon: 'info',
          message: this.isEn()
            ? `File: ${item.name}<br>Size: 12.4 KB<br>Preview: ${item.content || 'Binary data'}`
            : `Файл: ${item.name}<br>Размер: 12,4 КБ<br>Содержимое: ${item.content || 'Двоичные данные'}`
        });
      }
    } else if (item.type === 'action') {
      if (item.action === 'net98' && window.Net98Shell) {
        window.Net98Shell.run(item);
      } else if (item.action === 'display-properties' && window.appDialogs) {
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
      } else if (item.action === 'taskbar-properties' && window.appTaskbarProps) {
        window.appTaskbarProps.open();
      } else if (item.action === 'power-properties' && window.appCPanel) {
        window.appCPanel.openPowerProperties();
      } else if (item.action === 'sounds-properties' && window.appCPanel && window.appCPanel.openSoundsProperties) {
        window.appCPanel.openSoundsProperties();
      } else if (item.action === 'keyboard-properties' && window.appCPanel && window.appCPanel.openKeyboardProperties) {
        window.appCPanel.openKeyboardProperties();
      } else if (item.action === 'fonts-folder') {
        this.navigateTo(win, ['My Computer', 'C:', 'WINDOWS', 'Fonts']);
      } else if (item.action === 'printers-folder' && window.appCPanel && window.appCPanel.openPrintersFolder) {
        window.appCPanel.openPrintersFolder();
      } else if (item.action === 'network-properties' && window.appCPanel && window.appCPanel.openNetworkProperties) {
        window.appCPanel.openNetworkProperties();
      } else if (item.action === 'accessibility-properties' && window.appCPanel && window.appCPanel.openAccessibilityProperties) {
        window.appCPanel.openAccessibilityProperties();
      } else if (item.action === 'joystick-properties' && window.appCPanel && window.appCPanel.openJoystickProperties) {
        window.appCPanel.openJoystickProperties();
      } else if (item.action === 'modem-properties' && window.appCPanel && window.appCPanel.openModemProperties) {
        window.appCPanel.openModemProperties();
      } else if (item.action === 'passwords-properties' && window.appCPanel && window.appCPanel.openPasswordsProperties) {
        window.appCPanel.openPasswordsProperties();
      } else if (item.action === 'users-properties' && window.appCPanel && window.appCPanel.openUsersProperties) {
        window.appCPanel.openUsersProperties();
      } else if (item.action === 'scheduled-tasks' && window.appSysTools && window.appSysTools.openScheduledTasks) {
        window.appSysTools.openScheduledTasks();
      }
    }
  }
}

window.appExplorer = new AppExplorer();
