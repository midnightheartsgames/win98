class AppIE {
  constructor() {
    this.defaultUrl = 'http://www.search98.com';
    this.currentUrl = this.defaultUrl;
    this.history = [this.defaultUrl];
    this.historyIndex = 0;
    this.guestbookStorageKey = 'win98_retro_guestbook';
    this.lastSearchQuery = '';
    this.activeNewsArticleId = null;
    this.activeSoftStorePaymentId = null;
    this.activeDetailItemId = null;
    this.promoCodeApplied = false;
    this.storePromoDiscount = 0;

    this.newsPollStorageKey = 'win98_news_poll_vote';
    this.newsCommentsKey = 'win98_news_comments';
    this.chatMessagesKey = 'win98_krovatka_messages';
    this.activeChatRoom = 'general';
    this.anekdotVotesKey = 'win98_anekdot_votes';
    this.geocitiesPagesKey = 'win98_geocities_pages';
    this.voodooBenchResult = null;
    this.webCinemaCurrentVideoIdx = 0;
    this.webCinemaCurrentFilter = 'all';
    this.webCinemaCommentsKey = 'win98_webcinema_comments';

    this.msftUiLang = 'ru';
    this.msftForumBoard = 'ru';
    this.activeMsftThreadId = null;
    this.msftForumStorageKey = 'win98_msft_forum_threads_v2';
    this.msftActiveTab = 'home';
    this.msftCategoryFilter = 'all';
    this.msftSearchFilter = '';

    this.dimaActiveTab = 'home';
    this.dimaBabySpeed = 'normal';
    this.dimaMidiPlaying = false;
    this._dimaHitCounted = false;

    this.lastSelectedText = '';
    this.lastBounds = null;
    this.gameManagerListenerAttached = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('connectivity-changed', (e) => {
        if (e.detail && e.detail.isOnline && this.currentWin && window.winManager && window.winManager.windows.has('app_ie')) {
          this.renderPage(this.currentWin, this.currentUrl);
        }
      });
    }
  }

  copyToClipboard(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  }

  gif(name, scale = 1) {
    return window.webGif ? window.webGif(name, scale) : '';
  }

  mailLink(addr) {
    return `<a class="web-mail-link" href="mailto:${addr}">${this.gif('mail')}${addr}</a>`;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  loadBounds() {
    try {
      const raw = localStorage.getItem('win98_ie_window_bounds') || localStorage.getItem('win98_bounds_app_ie');
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
      localStorage.setItem('win98_ie_window_bounds', JSON.stringify(b));
      localStorage.setItem('win98_bounds_app_ie', JSON.stringify(b));
    } catch (e) {}
  }

  open(initialUrl = 'http://www.search98.com') {
    if (window.winManager && window.winManager.windows.has('app_ie')) {
      const existing = window.winManager.windows.get('app_ie');
      if (existing.isMinimized) {
        window.winManager.restoreWindow('app_ie');
      } else {
        window.winManager.bringToTop('app_ie');
      }
      this.navigate(existing, initialUrl);
      return;
    }

    this.currentUrl = initialUrl;
    this.history = [initialUrl];
    this.historyIndex = 0;

    const savedBounds = this.lastBounds || this.loadBounds();
    const width = savedBounds ? savedBounds.width : 680;
    const height = savedBounds ? savedBounds.height : 480;
    const x = savedBounds && typeof savedBounds.x === 'number'
      ? Math.max(0, Math.min((window.innerWidth || 1024) - 100, savedBounds.x))
      : (50 + (window.winManager.windows.size * 25) % 250);
    const y = savedBounds && typeof savedBounds.y === 'number'
      ? Math.max(0, Math.min((window.innerHeight || 768) - 100, savedBounds.y))
      : (40 + (window.winManager.windows.size * 25) % 180);

    const win = window.winManager.createWindow({
      id: 'app_ie',
      title: 'Microslop Internet Explorer',
      icon: 'internet-explorer',
      width,
      height,
      x,
      y,
      content: this.buildHTML(),
      onClose: () => {
        this.dimaMidiPlaying = false;
        if (window.soundSys && typeof window.soundSys.stopDimaMidi === 'function') {
          window.soundSys.stopDimaMidi();
        }
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

    if (window.gameManager && !this.gameManagerListenerAttached) {
      this.gameManagerListenerAttached = true;
      window.gameManager.addListener(() => {
        if (this.currentWin && window.winManager && window.winManager.windows.has('app_ie')) {
          const pageKey = this.identifyPageKey(this.currentUrl);
          if (pageKey === 'steam' || pageKey === 'softstore' || pageKey === 'blender' || pageKey === 'hsr') {
            this.renderPage(this.currentWin, this.currentUrl);
          }
        }
      });
    }

    this.currentWin = win;
    this.attachEvents(win);
    this.renderPage(win, this.currentUrl);
  }

  get favorites() {
    return [
      ['http://www.interpedia.org', 'Интерпедия (Свободная энциклопедия)'],
      ['http://www.lib.ru', 'Lib.ru: Библиотека Мошкова'],
      ['http://www.igromania.ru', "Журнал «Игромания» '98"],
      ['http://www.cheatcc.com', 'Cheat Code Central (Читы)'],
      ['http://skins.winamp.com', 'Winamp Skins Archive'],
      ['http://www.spacejam.com', 'Space Jam (1996) Official'],
      ['http://www.icq.com', 'Mirabilis ICQ Web-Pager'],
      ['http://www.y2k-countdown.org', 'Y2K Bug Survival Center'],
      ['http://fido.relcom.ru', 'FidoNet Web-Шлюз 2:5020'],
      ['http://www.yandex.ru', "Яndex '98 (Поиск)"],
      ['http://www.themeworld98.com', "ThemeWorld '98 (Обои, Заставки, Темы)"],
      ['http://www.3advanced.com', '3ADVANCED Softworks (Каталог программ)'],
      ['http://www.clippy98.com', "Скрепыш '98 (Гардероб Помощника)"],
      ['http://www.poligon3d.ru', 'ПОЛИГОН (Клипы в 3D)'],
      ['http://www.youvid.com', 'YouVid (Видео от каждого)'],
      ['http://www.microslop.com', 'Microslop Win 98 Portal'],
      ['http://www.search98.com', 'WebSeeker 98 (Поиск)'],
      ['http://www.rambler98.ru', "Рамблер '98 (Портал Рунета)"],
      ['http://www.softstore98.com', "SoftStore '98 (Магазин программ)"],
      ['http://www.steampowered.com', 'Steam (Игры с доставкой по Сети)'],
      ['http://hsr.hoyoverse.com', 'Honkai: Star Rail 98 (Официальный сайт)'],
      ['http://www.mp3vault98.com', "MP3 Vault '98 (Архив музыки)"],
      ['http://www.kinomania98.ru', "Киномания '98 (Новости кино и Форум)"],
      ['http://www.webcinema98.com', "WebCinema '98 (Видеоархив)"],
      ['http://forum.games98.com', 'GamerZone Forum (Форум)'],
      ['http://chat.krovatka98.ru', "Кроватка '98 (Веб-чат)"],
      ['http://www.retro-news98.com', 'Cyberspace Times (Новости)'],
      ['http://www.anekdot98.ru', 'Анекдот.ru 1998 (Юмор)'],
      ['http://www.3dfx-zone.com', '3dfx Voodoo Zone (Оверклокинг)'],
      ['http://www.antivirus98.com', 'AntiVirus Lab (Безопасность)'],
      ['http://www.blender3d.com', 'Blender 3D (Blender 2.04)'],
      ['http://www.digicharat.net', 'Di Gi Charat Fan Club (Official Fansite)'],
      ['http://www.geocities.com', "GeoCities '98 (Персональные страницы)"],
      ['http://www.retro-web.net', 'Retro-Web Portal'],
      ['http://www.goldfargus.ru', '«Фаргус Мультимедиа» (Переводы игр)'],
      ['http://www.molotok98.ru', "Молоток '98 (Интернет-аукцион)"],
      ['http://www.xakep98.ru', "Журнал «Хакер '98»"],
      ['http://www.mult98.ru', 'Мульт.ру (Масяня)'],
      ['http://www.emuland98.ru', "Emu-Land (Эмуляторы и ROM'ы)"],
      ['http://www.xfiles98.ru', 'Истина где-то рядом (Архив НЛО)']
    ];
  }

  buildHTML() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    return `
      <div class="ie-container">
        <div class="win-menubar ie-menubar">
          <div class="win-menu-item">
            Файл
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option ie-opt-open">Открыть адрес... <span>Ctrl+O</span></div>
              <div class="win-dropdown-option ie-opt-save">Сохранить как... <span>Ctrl+S</span></div>
              <div class="win-dropdown-option ie-opt-print">Печать... <span>Ctrl+P</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option ie-opt-exit">Закрыть</div>
            </div>
          </div>
          <div class="win-menu-item">
            Правка
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option ie-opt-copy">Копировать <span>Ctrl+C</span></div>
              <div class="win-dropdown-option ie-opt-selectall">Выделить всё <span>Ctrl+A</span></div>
              <div class="win-dropdown-option ie-opt-find">Найти на этой странице... <span>Ctrl+F</span></div>
            </div>
          </div>
          <div class="win-menu-item">
            Вид
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option ie-opt-back">Назад <span>Alt+Left</span></div>
              <div class="win-dropdown-option ie-opt-forward">Вперед <span>Alt+Right</span></div>
              <div class="win-dropdown-option ie-opt-refresh">Обновить <span>F5</span></div>
              <div class="win-dropdown-option ie-opt-stop">Остановить <span>Esc</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option ie-opt-source">Просмотр HTML-кода</div>
            </div>
          </div>
          <div class="win-menu-item">
            Избранное
            <div class="win-menu-dropdown ie-fav-menu">
              ${this.favorites.map(([url, label]) => `<div class="win-dropdown-option ie-fav-option" data-url="${url}"><span class="ie-fav-icon">${Icons['ie-page']}</span>${label}</div>`).join('')}
            </div>
          </div>
          <div class="win-menu-item">
            Справка
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option ie-opt-about">О программе Internet Explorer...</div>
            </div>
          </div>
          <div class="ie-throbber">${Icons['start-logo']}</div>
        </div>

        <div class="explorer-toolbar ie-toolbar">
          <button class="explorer-tool-btn ie-btn-back">${Icons['tb-back']}<span>${t('ie.back')}</span></button>
          <button class="explorer-tool-btn ie-btn-forward">${Icons['tb-forward']}<span>${t('ie.forward')}</span></button>
          <button class="explorer-tool-btn ie-btn-stop">${Icons['tb-stop']}<span>${t('ie.stop')}</span></button>
          <button class="explorer-tool-btn ie-btn-refresh">${Icons['tb-refresh']}<span>${t('ie.refresh')}</span></button>
          <button class="explorer-tool-btn ie-btn-home">${Icons['tb-home']}<span>${t('ie.home')}</span></button>
          <div class="explorer-tool-sep"></div>
          <button class="explorer-tool-btn ie-btn-search">${Icons['tb-search']}<span>${t('ie.search')}</span></button>
          <button class="explorer-tool-btn ie-btn-favorites">${Icons['tb-favorites']}<span>${t('ie.favorites')}</span></button>
          <button class="explorer-tool-btn ie-btn-history">${Icons['tb-history']}<span>${t('ie.history')}</span></button>
          <div class="explorer-tool-sep"></div>
          <button class="explorer-tool-btn ie-btn-mail">${Icons['tb-mail']}<span>${t('ie.mail')}</span></button>
          <button class="explorer-tool-btn ie-btn-print">${Icons['tb-print']}<span>${t('ie.print')}</span></button>
        </div>
        <div class="explorer-address-bar ie-address-row">
          <div class="explorer-address-label">${t('ie.address')}</div>
          <div class="explorer-address-box">
            <span class="explorer-address-icon icon-small">${Icons['ie-page']}</span>
            <input type="text" class="explorer-address-input ie-address-input" value="${this.currentUrl}">
            <span class="explorer-address-drop"></span>
          </div>
          <button class="ie-btn-go">${Icons['ie-go']}<span>${t('ie.go')}</span></button>
        </div>
        <div class="ie-main">
          <div class="ie-side hidden">
            <div class="ie-side-title"><span class="ie-side-name"></span><button class="ie-side-close" title="${t('win.close')}">${Icons['cap-close']}</button></div>
            <div class="ie-side-list"></div>
          </div>
          <div class="ie-content-frame" style="position:relative;"></div>
        </div>
        <div class="win-statusbar">
          <div class="win-status-pane grow ie-status-text"><span class="ie-status-icon icon-small">${Icons['ie-page']}</span><span class="ie-status-msg">${t('ie.done')}</span></div>
          <div class="win-status-pane ie-zone-pane"><span class="ie-status-icon icon-small">${Icons['ie-zone']}</span>${t('ie.zone')}</div>
        </div>
      </div>
    `;
  }

  attachEvents(win) {
    const el = win.element;
    const btnBack = el.querySelector('.ie-btn-back');
    const btnForward = el.querySelector('.ie-btn-forward');
    const btnStop = el.querySelector('.ie-btn-stop');
    const btnRefresh = el.querySelector('.ie-btn-refresh');
    const btnHome = el.querySelector('.ie-btn-home');
    const btnGo = el.querySelector('.ie-btn-go');
    const addrInput = el.querySelector('.ie-address-input');

    btnBack.addEventListener('click', () => {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.currentUrl = this.history[this.historyIndex];
        this.renderPage(win, this.currentUrl);
      }
    });

    btnForward.addEventListener('click', () => {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.currentUrl = this.history[this.historyIndex];
        this.renderPage(win, this.currentUrl);
      }
    });

    btnRefresh.addEventListener('click', () => {
      this.renderPage(win, this.currentUrl);
    });

    btnHome.addEventListener('click', () => {
      this.navigate(win, this.defaultUrl);
    });

    btnGo.addEventListener('click', () => {
      this.navigate(win, addrInput.value.trim());
    });

    addrInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigate(win, addrInput.value.trim());
      }
    });

    const tr = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const side = el.querySelector('.ie-side');
    const sideList = el.querySelector('.ie-side-list');
    const syncSideButtons = () => {
      ['favorites', 'history'].forEach(kind => {
        el.querySelector('.ie-btn-' + kind).classList.toggle('pressed', !side.classList.contains('hidden') && side.dataset.kind === kind);
      });
    };
    const openSide = (kind) => {
      if (!side.classList.contains('hidden') && side.dataset.kind === kind) {
        side.classList.add('hidden');
        syncSideButtons();
        return;
      }
      side.dataset.kind = kind;
      side.classList.remove('hidden');
      el.querySelector('.ie-side-name').textContent = tr(kind === 'favorites' ? 'ie.favorites' : 'ie.history');
      const links = kind === 'favorites'
        ? [...el.querySelectorAll('.ie-menubar [data-url]')].map(o => ({ url: o.dataset.url, label: o.textContent.trim() }))
        : [...new Set(this.history.slice().reverse())].map(u => ({ url: u, label: u.replace(/^https?:\/\//, '') }));
      const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      sideList.innerHTML = links.map(l => `<div class="ie-side-item" data-url="${esc(l.url)}"><span class="ie-side-icon icon-small">${Icons['ie-page']}</span><span class="ie-side-label">${esc(l.label)}</span></div>`).join('');
      syncSideButtons();
    };
    this.refreshSide = () => {
      if (!side.classList.contains('hidden') && side.dataset.kind === 'history') {
        side.classList.add('hidden');
        openSide('history');
      }
    };
    el.querySelector('.ie-btn-favorites').addEventListener('click', () => openSide('favorites'));
    el.querySelector('.ie-btn-history').addEventListener('click', () => openSide('history'));
    el.querySelector('.ie-side-close').addEventListener('click', () => {
      side.classList.add('hidden');
      syncSideButtons();
    });
    sideList.addEventListener('click', (e) => {
      const item = e.target.closest('.ie-side-item');
      if (item) this.navigate(win, item.dataset.url);
    });
    el.querySelector('.ie-btn-search').addEventListener('click', () => this.navigate(win, 'http://www.search98.com'));
    el.querySelector('.ie-btn-mail').addEventListener('click', () => {
      if (window.appOutlook) window.appOutlook.open();
    });
    el.querySelector('.ie-btn-print').addEventListener('click', () => {
      const opt = el.querySelector('.ie-opt-print');
      if (opt) opt.click();
    });
    btnStop.addEventListener('click', () => this.setStatus(win, false));

    const contentFrame = el.querySelector('.ie-content-frame');

    contentFrame.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="mailto:"]');
      if (!link) return;
      e.preventDefault();
      if (window.appOutlook) window.appOutlook.composeTo(link.getAttribute('href'));
    });

    const updateSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const anchor = sel.anchorNode;
        if (anchor && contentFrame && contentFrame.contains(anchor)) {
          const str = sel.toString();
          this.lastSelectedText = str;
        }
      }
    };

    if (contentFrame) {
      contentFrame.addEventListener('mouseup', updateSelection);
      contentFrame.addEventListener('keyup', updateSelection);
    }

    document.addEventListener('selectionchange', () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const anchor = sel.anchorNode;
        if (anchor && contentFrame && contentFrame.contains(anchor)) {
          const str = sel.toString();
          if (str) {
            this.lastSelectedText = str;
          }
        }
      }
    });

    if (contentFrame) {
      contentFrame.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const sel = window.getSelection();
      const currentSelection = (sel && sel.toString()) ? sel.toString() : this.lastSelectedText;
      const hasSelection = Boolean(currentSelection && currentSelection.trim().length > 0);

      const menuItems = [];

      if (hasSelection) {
        menuItems.push({
          label: 'Копировать',
          shortcut: 'Ctrl+C',
          action: () => {
            this.copyToClipboard(currentSelection);
          }
        });
        menuItems.push({ separator: true });
      }

      menuItems.push(
        { label: 'Назад', disabled: this.historyIndex <= 0, action: () => btnBack.click() },
        { label: 'Вперед', disabled: this.historyIndex >= this.history.length - 1, action: () => btnForward.click() },
        { separator: true },
        { label: 'Обновить', action: () => btnRefresh.click() },
        { label: 'Остановить', action: () => btnStop.click() },
        { separator: true },
        {
          label: 'Выделить всё',
          shortcut: 'Ctrl+A',
          action: () => {
            const range = document.createRange();
            range.selectNodeContents(contentFrame);
            const s = window.getSelection();
            s.removeAllRanges();
            s.addRange(range);
            this.lastSelectedText = s.toString();
          }
        },
        {
          label: 'Просмотр HTML-кода',
          action: () => {
            if (window.appNotepad) {
              window.appNotepad.open('Source.txt', contentFrame.innerHTML);
            }
          }
        },
        { separator: true },
        {
          label: 'Свойства',
          action: () => {
            window.winManager.openDialog({
              title: 'Свойства страницы',
              icon: 'internet-explorer',
              message: `<b>Адрес:</b> ${this.currentUrl}<br><b>Зона:</b> Узел Интернета<br><b>Протокол:</b> HTTP/1.1 (Retro 1998)`
            });
          }
        }
      );

      if (window.contextMenu) {
        window.contextMenu.show(e.clientX, e.clientY, menuItems);
      }
      });
    }

    const bindMenu = (sel, fn) => {
      const opt = el.querySelector(sel);
      if (opt) opt.addEventListener('click', fn);
    };

    el.querySelectorAll('.win-dropdown-option').forEach(opt => {
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
    });

    const showOpenDialog = () => {
      window.winManager.openPromptDialog({
        title: 'Открыть',
        icon: 'internet-explorer',
        message: 'Введите адрес документа или веб-страницы в Интернете, и Internet Explorer откроет его:',
        value: this.currentUrl,
        okText: 'ОК',
        cancelText: 'Отмена',
        onOk: (url) => {
          if (url && url.trim()) {
            this.navigate(win, url.trim());
          }
        }
      });
    };
    bindMenu('.ie-opt-open', showOpenDialog);

    const showSaveAsDialog = () => {
      let defaultName = 'Webpage.htm';
      try {
        const titleText = (win.titleElement ? win.titleElement.textContent : '').replace(' - Microslop Internet Explorer', '').trim();
        if (titleText) {
          defaultName = titleText.replace(/[\\/*?:"<>|]/g, '').slice(0, 40) + '.htm';
        }
      } catch (e) {}

      window.winManager.openPromptDialog({
        title: 'Сохранить как',
        icon: 'folder',
        message: 'Имя HTML-файла для сохранения в папку «Мои документы» (C:\\Мои документы):',
        value: defaultName,
        okText: 'Сохранить',
        cancelText: 'Отмена',
        onOk: (fileName) => {
          const finalName = (fileName || '').trim() || defaultName;
          if (window.vfs) {
            window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], finalName, contentFrame.innerHTML);
            if (window.soundSys) window.soundSys.playDing();
            window.winManager.openDialog({
              title: 'Internet Explorer',
              icon: 'info',
              message: `Страница успешно сохранена как <b>${finalName}</b> в папке «Мои документы».`
            });
          }
        }
      });
    };
    bindMenu('.ie-opt-save', showSaveAsDialog);

    bindMenu('.ie-opt-print', () => {
      window.winManager.openDialog({
        title: 'Печать',
        icon: 'printer',
        message: `<b>Печать веб-страницы:</b> ${win.titleElement.textContent}<br>Отправка 1 страницы на сетевой принтер HP LaserJet...`
      });
    });

    bindMenu('.ie-opt-exit', () => window.winManager.closeWindow(win.id));

    bindMenu('.ie-opt-copy', () => {
      const sel = window.getSelection();
      const textToCopy = (sel && sel.toString()) ? sel.toString() : (this.lastSelectedText || this.currentUrl);
      this.copyToClipboard(textToCopy);
    });

    bindMenu('.ie-opt-selectall', () => {
      const range = document.createRange();
      range.selectNodeContents(contentFrame);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      this.lastSelectedText = sel.toString();
    });

    const showFindDialog = () => {
      if (window.winManager.windows.has('app_ie_find')) {
        window.winManager.bringToTop('app_ie_find');
        return;
      }

      const findContent = document.createElement('div');
      findContent.className = 'win-dialog-content';
      findContent.style.padding = '12px 14px';
      findContent.style.width = '360px';

      findContent.innerHTML = `
        <div style="display:flex; gap:12px; align-items:flex-start;">
          <div style="width:32px; height:32px; flex-shrink:0;">${Icons['find'] || Icons['help']}</div>
          <div style="flex:1;">
            <div style="font-size:11px; margin-bottom:4px;">Что искать:</div>
            <input type="text" class="ie-find-input" style="width:100%; box-sizing:border-box; font-family:var(--win-font); font-size:11px; padding:3px 4px; border:2px inset #ffffff; background:#ffffff;" value="${this.lastSelectedText || ''}">
            <div style="margin-top:10px; font-size:11px; color:#555;">
              Поиск текста на текущей открытой странице или во Всемирной Паутине.
            </div>
          </div>
        </div>
        <div class="win-dialog-buttons" style="margin-top:14px; display:flex; justify-content:flex-end; gap:6px;">
          <button class="win-btn btn-find-next" style="font-weight:bold; min-width:85px;">Найти далее</button>
          <button class="win-btn btn-find-web" style="min-width:95px;">Искать в Сети</button>
          <button class="win-btn btn-find-cancel" style="min-width:70px;">Отмена</button>
        </div>
      `;

      const findWin = window.winManager.createWindow({
        id: 'app_ie_find',
        title: 'Найти на этой странице',
        icon: 'find',
        width: 390,
        height: 'auto',
        resizable: false,
        minimizable: false,
        maximizable: false,
        isDialog: true,
        content: findContent
      });

      const findInput = findWin.element.querySelector('.ie-find-input');
      const btnNext = findWin.element.querySelector('.btn-find-next');
      const btnWeb = findWin.element.querySelector('.btn-find-web');
      const btnCancel = findWin.element.querySelector('.btn-find-cancel');

      setTimeout(() => {
        if (findInput) {
          findInput.focus();
          findInput.select();
        }
      }, 50);

      const doSearchInPage = () => {
        const query = (findInput ? findInput.value : '').trim();
        if (!query) return;

        let found = false;
        if (window.find && typeof window.find === 'function') {
          found = window.find(query, false, false, true, false, false, false);
        }

        if (!found) {
          const walker = document.createTreeWalker(contentFrame, NodeFilter.SHOW_TEXT, null, false);
          let node;
          while ((node = walker.nextNode())) {
            const idx = node.nodeValue.toLowerCase().indexOf(query.toLowerCase());
            if (idx !== -1) {
              const parentEl = node.parentElement;
              if (parentEl) {
                parentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const range = document.createRange();
                range.setStart(node, idx);
                range.setEnd(node, idx + query.length);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                found = true;
                break;
              }
            }
          }
        }

        if (!found) {
          window.winManager.openDialog({
            title: 'Internet Explorer',
            icon: 'info',
            message: `Не удалось найти строку «${query}».<br>Вы можете выполнить поиск этой фразы в поисковой системе WebSeeker 98.`,
            buttons: [
              {
                text: 'Искать в Сети',
                primary: true,
                onClick: () => {
                  window.winManager.closeWindow('app_ie_find');
                  this.navigate(win, `http://www.search98.com/search?q=${encodeURIComponent(query)}`);
                }
              },
              { text: 'ОК', onClick: null }
            ]
          });
        }
      };

      btnNext.addEventListener('click', doSearchInPage);
      btnWeb.addEventListener('click', () => {
        const query = (findInput ? findInput.value : '').trim();
        window.winManager.closeWindow('app_ie_find');
        if (query) {
          this.navigate(win, `http://www.search98.com/search?q=${encodeURIComponent(query)}`);
        }
      });
      btnCancel.addEventListener('click', () => {
        window.winManager.closeWindow('app_ie_find');
      });
      findInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doSearchInPage();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          window.winManager.closeWindow('app_ie_find');
        }
      });
    };

    bindMenu('.ie-opt-find', showFindDialog);

    bindMenu('.ie-opt-back', () => btnBack.click());
    bindMenu('.ie-opt-forward', () => btnForward.click());
    bindMenu('.ie-opt-refresh', () => btnRefresh.click());
    bindMenu('.ie-opt-stop', () => btnStop.click());

    bindMenu('.ie-opt-source', () => {
      if (window.appNotepad) {
        window.appNotepad.open('Source.txt', contentFrame.innerHTML);
      }
    });

    bindMenu('.ie-opt-about', () => {
      window.winManager.openDialog({
        title: 'О программе Internet Explorer',
        icon: 'internet-explorer',
        message: `<b>Microslop (R) Internet Explorer 5.0</b><br>Версия 5.00.2919.6307<br>Шифрование: 128-bit<br>Copyright © 1995-1998 Microslop Corp.<br>Создано для Win 98 Second Edition.`
      });
    });

    el.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        const sel = window.getSelection();
        const textToCopy = (sel && sel.toString()) ? sel.toString() : this.lastSelectedText;
        if (textToCopy) {
          this.copyToClipboard(textToCopy);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        const range = document.createRange();
        range.selectNodeContents(contentFrame);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        this.lastSelectedText = sel.toString();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        showFindDialog();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        showOpenDialog();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        showSaveAsDialog();
      }
    });

    el.querySelectorAll('.win-dropdown-option[data-url]').forEach(opt => {
      opt.addEventListener('click', () => {
        this.navigate(win, opt.dataset.url);
      });
    });
  }

  navigate(win, url) {
    if (!url) url = this.defaultUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    this.currentUrl = url;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(url);
    this.historyIndex = this.history.length - 1;
    this.renderPage(win, url);
  }

  identifyPageKey(url) {
    const clean = url.toLowerCase();
    if (clean.includes('hoyoverse') || clean.includes('starrail98') || clean.includes('mihoyo')) {
      return 'hsr';
    }
    if (clean.includes('goldfargus') || clean.includes('fargus')) {
      return 'fargus';
    }
    if (clean.includes('molotok')) {
      return 'molotok';
    }
    if (clean.includes('xakep') || clean.includes('xaker') || clean.includes('keygen98')) {
      return 'xakep';
    }
    if (clean.includes('mult98') || clean.includes('mult.ru') || clean.includes('masyanya')) {
      return 'mult';
    }
    if (clean.includes('emuland') || clean.includes('emu-land') || clean.includes('dendy.ru')) {
      return 'emuland';
    }
    if (clean.includes('xfiles') || clean.includes('ufo98') || clean.includes('alien98')) {
      return 'xfiles';
    }
    if (clean.includes('forum.games98.com')) {
      return 'forum';
    }
    if (clean.includes('cheatcc.com')) {
      return 'cheatcc';
    }
    if (clean.includes('youvid')) {
      return 'youvid';
    }
    if (clean.includes('poligon3d') || clean.includes('poligon')) {
      return 'poligon';
    }
    if (clean.includes('steampowered') || clean.includes('steamgames')) {
      return 'steam';
    }
    if (clean.includes('clippy98') || clean.includes('skrepysh') || clean.includes('clippit')) {
      return 'clippy';
    }
    if (clean.includes('3advanced') || clean.includes('2advanced')) {
      return 'advanced';
    }
    if (clean.includes('interpedia') || clean.includes('/wiki') || clean.includes('wikipedia')) {
      return 'interpedia';
    }
    if (clean.includes('lib.ru') || clean.includes('moshkow') || clean.includes('libru')) {
      return 'libru';
    }
    if (clean.includes('igromania.ru') || clean.includes('igromania')) {
      return 'igromania';
    }
    if (clean.includes('cheatcc') || clean.includes('cheats') || clean.includes('cheatcodes')) {
      return 'cheatcc';
    }
    if (clean.includes('skins.winamp') || clean.includes('winampskins') || clean.includes('winamp.com/skins') || clean.includes('winamp.com')) {
      return 'winampskins';
    }
    if (clean.includes('spacejam') || clean.includes('space-jam')) {
      return 'spacejam';
    }
    if (clean.includes('icq.com') || clean.includes('mirabilis') || clean.includes('icqportal')) {
      return 'icqportal';
    }
    if (clean.includes('y2k') || clean.includes('millennium') || clean.includes('2000bug')) {
      return 'y2k';
    }
    if (clean.includes('fido.relcom') || clean.includes('fido7') || clean.includes('fidonet') || clean.includes('fido')) {
      return 'fidonet';
    }
    if (clean.includes('yandex') || clean.includes('ya.ru')) {
      return 'yandex';
    }
    if (clean.includes('themeworld') || clean.includes('win98themes') || clean.includes('themes98') || clean.includes('screensaver') || clean.includes('wallpapers98') || clean.includes('matrix-screensaver') || clean.includes('plus98') || clean.includes('desktop98')) {
      return 'themeworld';
    }
    if (clean.includes('blender3d') || clean.includes('blender.nl') || clean.includes('blender.org') || clean.includes('blender')) {
      return 'blender';
    }
    if (clean.includes('digi') || clean.includes('charat') || clean.includes('dejiko') || clean.includes('puchiko') || clean.includes('gamers-dejiko')) {
      return 'digicharat';
    }
    if (clean.includes('microslop') || clean.includes('msft') || clean.includes('windows98.com') || clean.includes('win98clone') || clean.includes('windows.com')) {
      return 'microslop';
    }
    if (clean.includes('rambler') || clean.includes('aport')) {
      return 'rambler';
    }
    if (clean.includes('mp3') || clean.includes('music') || clean.includes('mp3vault')) {
      return 'mp3vault';
    }
    if (clean.includes('kinomania') || clean.includes('kinonet') || clean.includes('kino98') || clean.includes('film98') || clean.includes('kino') || clean.includes('film') || clean.includes('movieforum') || clean.includes('cinemaworld')) {
      return 'kinomania';
    }
    if (clean.includes('webcinema') || clean.includes('cinema') || clean.includes('webvideo') || clean.includes('videonet') || clean.includes('retrovideo') || clean.includes('movietheater')) {
      return 'webvideo';
    }
    if (clean.includes('antivirus') || clean.includes('virus') || clean.includes('retrocure')) {
      return 'antivirus';
    }
    if (clean.includes('anekdot')) {
      return 'anekdot';
    }
    if (clean.includes('chat') || clean.includes('krovatka')) {
      return 'chat';
    }
    if (clean.includes('dima_web') || clean.includes('dima-webmaster') || clean.includes('dima.html') || clean.includes('/~dima') || clean.includes('dima98')) {
      return 'dima_webmaster';
    }
    if (clean.includes('geocities') || clean.includes('narod') || clean.includes('coolhacker')) {
      return 'geocities';
    }
    if (clean.includes('3dfx') || clean.includes('voodoo') || clean.includes('hardware') || clean.includes('overclock')) {
      return 'hardware';
    }
    if (clean.includes('softstore') || clean.includes('buysoft') || clean.includes('winsoft') || clean.includes('softmarket') || clean.includes('software')) {
      return 'softstore';
    }
    if (clean.includes('forum') || clean.includes('gamezone')) {
      return 'forum';
    }
    if (clean.includes('news') || clean.includes('times')) {
      return 'news';
    }
    if (clean.includes('retro-web.net')) {
      if (clean.includes('/games')) return 'retro-games';
      if (clean.includes('/about')) return 'retro-about';
      if (clean.includes('/guestbook')) return 'retro-guestbook';
      return 'retro-home';
    }
    return 'search';
  }

  setStatus(win, loading, url) {
    const el = win.element;
    const msg = el.querySelector('.ie-status-msg');
    const throbber = el.querySelector('.ie-throbber');
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    clearTimeout(this.statusTimer);
    if (msg) msg.textContent = loading ? t('ie.opening', url) : t('ie.done');
    if (throbber) throbber.classList.toggle('busy', !!loading);
    if (loading) this.statusTimer = setTimeout(() => this.setStatus(win, false), 450);
  }

  renderPage(win, url) {
    const el = win.element;
    this.setStatus(win, true, url);
    if (this.refreshSide) this.refreshSide();
    const contentFrame = el.querySelector('.ie-content-frame');
    const addrInput = el.querySelector('.ie-address-input');
    const btnBack = el.querySelector('.ie-btn-back');
    const btnForward = el.querySelector('.ie-btn-forward');

    contentFrame.scrollTop = 0;
    contentFrame.scrollLeft = 0;

    addrInput.value = url;
    btnBack.disabled = this.historyIndex <= 0;
    btnForward.disabled = this.historyIndex >= this.history.length - 1;

    const pageKey = this.identifyPageKey(url);
    if (pageKey !== 'dima_webmaster') {
      this._dimaHitCounted = false;
      this.dimaMidiPlaying = false;
      if (window.soundSys && typeof window.soundSys.stopDimaMidi === 'function') {
        window.soundSys.stopDimaMidi();
      }
    }
    if (pageKey !== 'xakep' && window.xakepSite && typeof window.xakepSite.stopChiptune === 'function') {
      window.xakepSite.stopChiptune();
    }
    if (pageKey !== 'mult' && window.multSite && typeof window.multSite.stopAnimation === 'function') {
      window.multSite.stopAnimation();
    }
    if (pageKey !== 'xfiles' && window.xFilesSite && typeof window.xFilesSite.stopSpookyTone === 'function') {
      window.xFilesSite.stopSpookyTone();
    }

    if (window.isOnline === false) {
      win.titleElement.textContent = 'Автономный режим - Microslop Internet Explorer';
      contentFrame.innerHTML = this.renderOfflinePage(url);
      this.attachOfflineEvents(win, contentFrame, url);
      return;
    }

    win.titleElement.textContent = `${this.getPageTitle(pageKey)} - Microslop Internet Explorer`;

    if (window.appClippy) {
      window.appClippy.onNavigateIE(url, pageKey, this.getPageTitle(pageKey));
    }

    if (pageKey === 'microslop') {
      contentFrame.innerHTML = this.renderMicroslopPage(url);
      this.attachMicroslopEvents(win, contentFrame, url);
    } else if (pageKey === 'rambler') {
      contentFrame.innerHTML = this.renderRambler();
      this.attachRamblerEvents(win, contentFrame);
    } else if (pageKey === 'mp3vault') {
      contentFrame.innerHTML = this.renderMp3Vault();
      this.attachMp3VaultEvents(win, contentFrame);
    } else if (pageKey === 'kinomania') {
      contentFrame.innerHTML = window.kinomaniaSite.renderSite(url);
      window.kinomaniaSite.attachEvents(win, contentFrame, url);
    } else if (pageKey === 'webvideo') {
      contentFrame.innerHTML = this.renderWebVideo();
      this.attachWebVideoEvents(win, contentFrame);
    } else if (pageKey === 'antivirus') {
      contentFrame.innerHTML = this.renderAntiVirus();
      this.attachAntiVirusEvents(win, contentFrame);
    } else if (pageKey === 'anekdot') {
      contentFrame.innerHTML = this.renderAnekdot();
      this.attachAnekdotEvents(win, contentFrame);
    } else if (pageKey === 'chat') {
      contentFrame.innerHTML = this.renderChat();
      this.attachChatEvents(win, contentFrame);
    } else if (pageKey === 'dima_webmaster') {
      contentFrame.innerHTML = this.renderDimaWebmasterPage();
      this.attachDimaWebmasterEvents(win, contentFrame);
    } else if (pageKey === 'geocities') {
      contentFrame.innerHTML = this.renderGeoCities(url);
      this.attachGeoCitiesEvents(win, contentFrame);
    } else if (pageKey === 'hardware') {
      contentFrame.innerHTML = this.renderHardware3dfx();
      this.attachHardware3dfxEvents(win, contentFrame);
    } else if (pageKey === 'search') {
      contentFrame.innerHTML = this.renderSearchEngine(url);
      this.attachSearchEvents(win, contentFrame);
    } else if (pageKey === 'hsr') {
      if (window.hsrSite) {
        contentFrame.innerHTML = window.hsrSite.renderSite(url);
        window.hsrSite.attachEvents(win, contentFrame, url);
      }
    } else if (pageKey === 'steam') {
      if (window.steamSite) {
        contentFrame.innerHTML = window.steamSite.renderSite(url);
        window.steamSite.attachEvents(win, contentFrame);
      }
    } else if (pageKey === 'softstore') {
      contentFrame.innerHTML = this.renderSoftStore(url);
      this.attachSoftStoreEvents(win, contentFrame);
    } else if (pageKey === 'forum') {
      contentFrame.innerHTML = window.gamerzoneSite.renderSite(url);
      window.gamerzoneSite.attachEvents(win, contentFrame, url);
    } else if (pageKey === 'news') {
      contentFrame.innerHTML = this.renderNews(url);
      this.attachNewsEvents(win, contentFrame);
    } else if (pageKey === 'digicharat') {
      if (window.diGiCharatSite) {
        contentFrame.innerHTML = window.diGiCharatSite.renderSite(url);
        window.diGiCharatSite.attachEvents(contentFrame);
      }
    } else if (pageKey === 'blender') {
      if (window.blenderSite) {
        contentFrame.innerHTML = window.blenderSite.renderSite(url);
        window.blenderSite.attachEvents(win, contentFrame);
      }
    } else if (pageKey === 'youvid') {
      if (window.youvidSite) {
        contentFrame.innerHTML = window.youvidSite.renderSite(url);
        win.titleElement.textContent = `${window.youvidSite.pageTitle(url)} - Microslop Internet Explorer`;
        window.youvidSite.attachEvents(win, contentFrame);
      }
    } else if (pageKey === 'poligon') {
      if (window.poligonSite) {
        contentFrame.innerHTML = window.poligonSite.renderSite(url);
        window.poligonSite.attachEvents(win, contentFrame);
      }
    } else if (pageKey === 'clippy') {
      if (window.clippySite) {
        contentFrame.innerHTML = window.clippySite.renderSite(url);
        window.clippySite.attachEvents(win, contentFrame);
      }
    } else if (pageKey === 'advanced') {
      if (window.advancedSite) {
        contentFrame.innerHTML = window.advancedSite.renderSite(url);
        window.advancedSite.attachEvents(win, contentFrame);
      }
    } else if (pageKey === 'themeworld') {
      const clean = (url || '').toLowerCase();
      const hint = clean.replace('themeworld', '');
      const targetTab = hint.includes('screensaver') || hint.includes('matrix') ? 'screensavers' :
                        hint.includes('theme') ? 'themes' :
                        hint.includes('pack') ? 'packs' :
                        hint.includes('/guestbook') ? 'guestbook' : 'wallpapers';
      let targetQuery = '';
      if (url.includes('?q=')) {
        try {
          targetQuery = decodeURIComponent(url.split('?q=')[1].split('&')[0]);
        } catch (e) {}
      }
      if (window.themeWorldSite) {
        contentFrame.innerHTML = window.themeWorldSite.renderSite(targetTab, targetQuery);
        window.themeWorldSite.attachEvents(win, contentFrame);
      }
    } else if (pageKey === 'libru') {
      if (window.retroSites) {
        contentFrame.innerHTML = window.retroSites.renderLibRu(url);
        window.retroSites.attachLibRuEvents(win, contentFrame);
      }
    } else if (pageKey === 'igromania') {
      if (window.retroSites) {
        contentFrame.innerHTML = window.retroSites.renderIgromania(url);
        window.retroSites.attachIgromaniaEvents(win, contentFrame);
      }
    } else if (pageKey === 'cheatcc') {
      contentFrame.innerHTML = window.cheatccSite.renderSite(url);
      window.cheatccSite.attachEvents(win, contentFrame, url);
    } else if (pageKey === 'winampskins') {
      if (window.retroSites) {
        contentFrame.innerHTML = window.retroSites.renderWinampSkins(url);
        window.retroSites.attachWinampSkinsEvents(win, contentFrame);
      }
    } else if (pageKey === 'spacejam') {
      if (window.retroSites) {
        contentFrame.innerHTML = window.retroSites.renderSpaceJam(url);
        window.retroSites.attachSpaceJamEvents(win, contentFrame);
      }
    } else if (pageKey === 'icqportal') {
      if (window.retroSites) {
        contentFrame.innerHTML = window.retroSites.renderIcqPortal(url);
        window.retroSites.attachIcqPortalEvents(win, contentFrame);
      }
    } else if (pageKey === 'y2k') {
      if (window.retroSites) {
        contentFrame.innerHTML = window.retroSites.renderY2K(url);
        window.retroSites.attachY2KEvents(win, contentFrame);
      }
    } else if (pageKey === 'fidonet') {
      if (window.retroSites) {
        contentFrame.innerHTML = window.retroSites.renderFidoNet(url);
        window.retroSites.attachFidoNetEvents(win, contentFrame);
      }
    } else if (pageKey === 'yandex') {
      if (window.retroSites) {
        contentFrame.innerHTML = window.retroSites.renderYandex(url);
        window.retroSites.attachYandexEvents(win, contentFrame);
      }
    } else if (pageKey === 'interpedia') {
      if (window.interpediaSite) {
        contentFrame.innerHTML = window.interpediaSite.renderSite(url);
        window.interpediaSite.attachEvents(win, contentFrame, url);
      }
    } else if (pageKey === 'fargus') {
      if (window.fargusSite) {
        contentFrame.innerHTML = window.fargusSite.renderSite(url);
        window.fargusSite.attachEvents(win, contentFrame, url);
      }
    } else if (pageKey === 'molotok') {
      if (window.molotokSite) {
        contentFrame.innerHTML = window.molotokSite.renderSite(url);
        window.molotokSite.attachEvents(win, contentFrame, url);
      }
    } else if (pageKey === 'xakep') {
      if (window.xakepSite) {
        contentFrame.innerHTML = window.xakepSite.renderSite(url);
        window.xakepSite.attachEvents(win, contentFrame, url);
      }
    } else if (pageKey === 'mult') {
      if (window.multSite) {
        contentFrame.innerHTML = window.multSite.renderSite(url);
        window.multSite.attachEvents(win, contentFrame, url);
      }
    } else if (pageKey === 'emuland') {
      if (window.emuLandSite) {
        contentFrame.innerHTML = window.emuLandSite.renderSite(url);
        window.emuLandSite.attachEvents(win, contentFrame, url);
      }
    } else if (pageKey === 'xfiles') {
      if (window.xFilesSite) {
        contentFrame.innerHTML = window.xFilesSite.renderSite(url);
        window.xFilesSite.attachEvents(win, contentFrame, url);
      }
    } else {
      contentFrame.innerHTML = this.renderRetroWeb(pageKey);
      this.attachRetroWebEvents(win, contentFrame);
    }

    contentFrame.querySelectorAll('a[data-url]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(win, link.dataset.url);
      });
    });
  }

  getPageTitle(pageKey) {
    switch (pageKey) {
      case 'fargus': return '«ФАРГУС Мультимедиа» — Только полный и качественный перевод';
      case 'molotok': return 'Интернет-аукцион «Молоток.ру» (1998) — Компьютерное железо и раритеты';
      case 'xakep': return 'XAKEP.RU — сетевой журнал «Хакер \'98»';
      case 'mult': return 'Мульт.ру — Масяня и Хрюндель';
      case 'emuland': return 'Emu-Land — архив картриджей Dendy, Sega, SNES и Game Boy';
      case 'xfiles': return 'ИСТИНА ГДЕ-ТО РЯДОМ — архив необъяснённых случаев';
      case 'interpedia': return 'Interpedia: The Free Internet Encyclopedia (Интерпедия: Свободная Энциклопедия)';
      case 'libru': return 'Lib.ru: Библиотека Максима Мошкова (1998)';
      case 'igromania': return 'Журнал «Игромания» 1998 - Официальный веб-сайт и CD';
      case 'cheatcc': return 'Cheat Code Central (CheatCC.com) - The #1 Video Game Cheats Site';
      case 'winampskins': return 'Nullsoft Winamp Skins Archive & Audio Depot (1998)';
      case 'spacejam': return 'Warner Bros. Space Jam (1996) - Official Movie Website';
      case 'icqportal': return 'Mirabilis ICQ World & Web-Pager (1998)';
      case 'y2k': return 'Y2K Millennium Bug Survival Center & BIOS Compliance Test';
      case 'fidonet': return 'FidoNet Web-Gateway (Relcom / Fido7 Node 2:5020)';
      case 'yandex': return 'Яndex 1998 - Поисковая машина: Найдётся всё!';
      case 'youvid': return 'YouVid - Покажи себя';
      case 'poligon': return 'ПОЛИГОН - Музыкальные клипы, собранные заново в 3D';
      case 'clippy': return "Скрепыш '98 - Официальный сайт и Гардероб Помощника Office";
      case 'advanced': return '3ADVANCED SOFTWORKS // Progressive Software Technology - Каталог программ Win 98';
      case 'themeworld': return "ThemeWorld '98 - Темы, Обои и Заставки для Win 98";
      case 'blender': return 'Blender 3D - Blender 2.04: free 3D creation and interactive 3D';
      case 'microslop': return 'Microslop(R) Win 98 Portal - Official Knowledge Base & Forum';
      case 'rambler': return "Рамблер '98 - Первая российская поисковая система и каталог";
      case 'mp3vault': return "MP3 Vault '98 - Цифровой архив музыки в формате MP3";
      case 'kinomania': return "Киномания '98 - Новости кино и сериалов, КиноФорум (Ноябрь 1998)";
      case 'webvideo': return "WebCinema '98 - Всемирный каталог и архив видеоклипов Всемирной Паутины";
      case 'antivirus': return 'AntiVirus Lab 1998 - Лаборатория защиты от киберугроз';
      case 'anekdot': return 'Anekdot.ru 1998 - Ежедневные анекдоты из России';
      case 'chat': return "Чат Кроватка '98 - Самый популярный веб-чат Рунета";
      case 'dima_webmaster': return "Домашняя страничка Вебмастера Димы (GeoCities / SiliconValley '98)";
      case 'geocities': return "GeoCities '98 - Home of Free Personal Web Pages";
      case 'hardware': return '3dfx Voodoo Zone & Hardware Overclockers 1998';
      case 'search': return 'WebSeeker 98 - Поисковая система Интернета';
      case 'steam': return 'Steam - steampowered.com';
      case 'hsr': return 'Honkai: Star Rail 98 - Официальный сайт';
      case 'softstore': return 'SoftStore 98 - Каталог и покупка программ для Win 98';
      case 'forum': return 'GamerZone Forum 1998 - Всероссийский форум геймеров';
      case 'news': return 'Cyberspace Times 1998 - Новости Сети и Технологий';
      case 'digicharat': return '★ Di Gi Charat (1999) — Official English Fan Club ★';
      case 'retro-games': return 'Retro Web Games 1998';
      case 'retro-about': return 'About The 1998 Web';
      case 'retro-guestbook': return 'Sign My Guestbook!';
      default: return 'Welcome to the World Wide Web 1998';
    }
  }

  renderOfflinePage(url) {
    const iconSvg = window.getIcon ? window.getIcon('dialup', 32) : '';
    return `
      <div class="ie-offline-container">
        <table class="ie-offline-table" cellspacing="0">
          <tr>
            <td class="ie-offline-icon">${iconSvg}</td>
            <td>
              <h2 class="ie-offline-title">Веб-страница недоступна в автономном режиме</h2>
              <p>Для просмотра страницы <b>${this.escapeHtml(url)}</b> нужно подключение к Интернету. Сейчас компьютер работает в автономном режиме.</p>
              <hr>
              <p>Попробуйте следующее:</p>
              <ul>
                <li>Нажмите кнопку <b>Подключиться</b>, выберите провайдера и дождитесь соединения по модему.</li>
                <li>Нажмите <b>Работать автономно</b>, чтобы остаться без соединения.</li>
              </ul>
              <p class="ie-offline-buttons">
                <button class="win-btn ie-btn-offline-connect">Подключиться...</button>
                <button class="win-btn ie-btn-offline-stay">Работать автономно</button>
              </p>
              <p class="ie-offline-foot">Удаленный доступ к сети<br>Microslop Internet Explorer 5.0</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  attachOfflineEvents(win, container, url) {
    const btnConnect = container.querySelector('.ie-btn-offline-connect');
    if (btnConnect) {
      btnConnect.addEventListener('click', () => {
        if (window.soundSys) window.soundSys.playClick();
        if (window.appDialUp) {
          window.appDialUp.open();
        }
      });
    }
    const btnStay = container.querySelector('.ie-btn-offline-stay');
    if (btnStay) {
      btnStay.addEventListener('click', () => {
        if (window.soundSys) window.soundSys.playClick();
      });
    }
  }

  get searchDirectory() {
    return [
      { title: 'Поиск и порталы', sites: [
        ['http://www.yandex.ru', 'Яndex', 'поисковая машина с учётом русской морфологии'],
        ['http://www.rambler98.ru', 'Рамблер', 'российский портал: поиск, курсы валют, погода и Top100'],
        ['http://www.microslop.com', 'Microslop.com', 'официальный портал Win 98: база знаний, программы, форум'],
        ['http://www.retro-web.net', 'Retro-Web', 'всё о Всемирной Паутине 1998 года']
      ] },
      { title: 'Компьютерные игры', sites: [
        ['http://www.steampowered.com', 'Steam', 'покупка и загрузка игр через клиент Steam'],
        ['http://hsr.hoyoverse.com', 'Honkai: Star Rail 98', 'официальный сайт: бесплатная загрузка, персонажи, новости'],
        ['http://www.goldfargus.ru', 'Фаргус', 'золотая коллекция полных русских версий'],
        ['http://www.emuland98.ru', 'Emu-Land', 'дампы картриджей Dendy и Sega'],
        ['http://www.igromania.ru', 'Игромания', 'журнал: ролики с CD, горячая линия, читерский уголок'],
        ['http://www.cheatcc.com', 'Cheat Code Central', 'проверенные коды и меню F7 к играм из Steam'],
        ['http://forum.games98.com', 'GamerZone', 'всероссийский форум геймеров']
      ] },
      { title: 'Кино и видео', sites: [
        ['http://www.mult98.ru', 'Мульт.ру', 'народная веб-анимация и Масяня'],
        ['http://www.kinomania98.ru', "Киномания '98", 'новости кино, кассовые сборы и КиноФорум'],
        ['http://www.webcinema98.com', 'WebCinema', 'видеоархив клипов в MPEG-1'],
        ['http://www.poligon3d.ru', 'ПОЛИГОН', 'музыкальные клипы, собранные заново в 3D'],
        ['http://www.youvid.com', 'YouVid', 'видео от авторов: каналы, подписки, комментарии'],
        ['http://www.spacejam.com', 'Space Jam', 'официальный сайт фильма 1996 года']
      ] },
      { title: 'Музыка и MP3', sites: [
        ['http://www.mp3vault98.com', 'MP3 Vault', 'архив музыки в формате MP3'],
        ['http://skins.winamp.com', 'Скины Winamp', 'архив скинов для Winamp и примерочная']
      ] },
      { title: 'Программы', sites: [
        ['http://www.softstore98.com', 'SoftStore', 'магазин программ для Win 98'],
        ['http://www.3advanced.com', '3ADVANCED', 'каталог программ Win 98'],
        ['http://www.xakep98.ru', 'Хакер', 'электронный журнал и KeyGen Lab'],
        ['http://www.blender3d.com', 'Blender 3D', 'бесплатный пакет трёхмерной графики'],
        ['http://www.themeworld98.com', 'Темы и обои', 'темы Plus!, обои и заставки'],
        ['http://www.clippy98.com', "Скрепыш '98", 'гардероб помощника Office']
      ] },
      { title: 'Железо и безопасность', sites: [
        ['http://www.3dfx-zone.com', '3dfx Voodoo Zone', 'разгон, тесты и калькулятор FPS'],
        ['http://www.antivirus98.com', 'AntiVirus Lab', 'база вирусов и проверка диска'],
        ['http://www.y2k-countdown.org', 'Проблема 2000', 'таймер и тест BIOS на ошибку 2000 года']
      ] },
      { title: 'Общение и аукционы', sites: [
        ['http://www.molotok98.ru', 'Молоток.ру', 'первый российский интернет-аукцион'],
        ['http://chat.krovatka98.ru', 'Чат Кроватка', 'веб-чат Рунета'],
        ['http://www.icq.com', 'ICQ', 'web-пейджер: сообщение на любой UIN'],
        ['http://fido.relcom.ru', 'FidoNet', 'эхоконференции узла 2:5020 через WWW'],
        ['http://www.geocities.com', 'GeoCities', 'бесплатные домашние страницы']
      ] },
      { title: 'Книги, справки и юмор', sites: [
        ['http://www.interpedia.org', 'Интерпедия', 'свободная энциклопедия'],
        ['http://www.lib.ru', 'Lib.ru', 'библиотека Максима Мошкова'],
        ['http://www.xfiles98.ru', 'Истина рядом', 'рассекреченные дела об НЛО'],
        ['http://www.anekdot98.ru', 'Анекдоты', 'анекдоты из России каждый день'],
        ['http://www.retro-news98.com', 'Cyberspace Times', 'новости Сети и технологий'],
        ['http://www.digicharat.net', 'Di Gi Charat', 'фан-клуб аниме']
      ] }
    ];
  }

  renderSearchEngine(url = '') {
    const readParam = (name) => {
      const match = new RegExp(`[?&]${name}=([^&#]*)`).exec(url);
      if (!match) return '';
      try {
        return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim();
      } catch (e) {
        return '';
      }
    };
    const q = readParam('q');
    const directory = this.searchDirectory;
    const category = directory[parseInt(readParam('cat'), 10)];
    const esc = (v) => this.escapeHtml(v);
    const popular = [['интерпедия', 'Интерпедия'], ['кино', 'Кино'], ['игромания', 'Игромания'], ['книги', 'Lib.ru'], ['читы', 'Читы'], ['скины', 'Скины Winamp'], ['mp3', 'MP3'], ['программы', 'Софт'], ['icq', 'ICQ'], ['y2k', 'Y2K'], ['обои', 'Обои'], ['анекдоты', 'Анекдоты'], ['3dfx', '3dfx'], ['аниме', 'Аниме']];

    const searchForm = (value) => `
      <table class="search98-bar" cellspacing="0">
        <tr>
          <td class="search98-bar-label">Искать</td>
          <td><select class="search98-scope"><option>во всём Интернете</option><option>только в Рунете</option><option>в каталоге WebSeeker</option></select></td>
          <td class="search98-bar-field"><input type="text" class="search98-input" id="search-input" value="${esc(value)}"></td>
          <td><button class="win-btn search98-go" id="btn-search">Найти!</button></td>
        </tr>
      </table>`;

    let body;
    if (q) {
      const results = this.performSearch(q);
      body = `
        ${searchForm(q)}
        <p class="search98-found">Найдено документов: <b>${results.length}</b>. Запрос: <b>${esc(q)}</b></p>
        ${results.length ? `<ol class="search98-results">
          ${results.map(r => `
            <li>
              <a class="search98-result-title" data-url="${r.url}">${r.title}</a><br>
              <span class="search98-result-snippet">${r.snippet}</span><br>
              <span class="search98-result-url">${r.url}</span>
            </li>`).join('')}
        </ol>` : `<p class="search98-none">Документов, соответствующих запросу, не найдено. Проверьте написание слов или загляните в <a data-url="http://www.search98.com">каталог WebSeeker</a>.</p>`}
        <p class="search98-back"><a data-url="http://www.search98.com">&lt;&lt; Вернуться в каталог</a></p>`;
    } else if (category) {
      body = `
        ${searchForm('')}
        <p class="search98-crumbs"><a data-url="http://www.search98.com">Каталог</a> &gt; <b>${category.title}</b></p>
        <p class="search98-found">Сайтов в разделе: <b>${category.sites.length}</b></p>
        <ul class="search98-listing">
          ${category.sites.map(([siteUrl, name, desc]) => `<li><a data-url="${siteUrl}">${name}</a> - ${desc}</li>`).join('')}
        </ul>
        <p class="search98-back"><a data-url="http://www.search98.com">&lt;&lt; Все разделы каталога</a></p>`;
    } else {
      const cell = (cat, index) => `
            <td>
              <a class="search98-cat" data-url="http://www.search98.com/?cat=${index}">${cat.title}</a><br>
              <span class="search98-sub">${cat.sites.map(([siteUrl, name]) => `<a data-url="${siteUrl}">${name}</a>`).join(', ')}...</span>
            </td>`;
      body = `
        ${searchForm('')}
        <div class="search98-tags">Часто ищут: ${popular.map(([query, label]) => `<a data-query="${query}">${label}</a>`).join(' | ')}</div>
        <table class="search98-news" cellspacing="0">
          <tr>
            <td>${this.gif('star')} <b>Сайт дня:</b> <a data-url="http://www.poligon3d.ru">ПОЛИГОН</a> — клипы, собранные заново в 3D</td>
            <td class="search98-news-new"><span class="web-new">NEW!</span> <a data-url="http://www.steampowered.com">Steam</a> — игры по модему</td>
          </tr>
        </table>
        <table class="search98-directory" cellspacing="0" cellpadding="0">
          ${[0, 2, 4, 6].map(i => `
          <tr>${cell(directory[i], i)}${cell(directory[i + 1], i + 1)}
          </tr>`).join('')}
        </table>
        <p class="search98-lucky">Не знаете, что искать? <button class="win-btn" id="btn-lucky">Случайный сайт</button></p>`;
    }

    return `
      <div class="search98-page">
        <div class="search98-container">
          <a class="search98-banner" data-url="http://www.steampowered.com">
            <span class="search98-banner-art">${this.gif('joy', 2)}</span>
            <span class="search98-banner-text"><b>STEAM</b> — купите игру, и она сама приедет по модему!<br><small>Half-Life, DOOM, Diablo и ещё 20 игр</small></span>
            <span class="search98-banner-btn web-blink">ЖМИ!</span>
          </a>
          <table class="search98-head" cellspacing="0">
            <tr>
              <td class="search98-logo"><a data-url="http://www.search98.com">${this.gif('search', 2)}<span class="search98-logo-web">Web</span><span class="search98-logo-seeker">Seeker</span><span class="search98-logo-year">'98</span></a></td>
              <td class="search98-toplinks"><a data-url="http://www.search98.com">Каталог</a> | <a data-url="http://www.retro-web.net/about">О WebSeeker</a> | <a data-url="http://www.retro-web.net/guestbook">Добавить сайт</a></td>
            </tr>
          </table>
          ${body}
          <hr>
          <div class="search98-footer">
            <a data-url="http://www.search98.com">Каталог</a> | <a data-url="http://www.retro-web.net/about">О компании</a> | <a data-url="http://www.retro-web.net/guestbook">Добавить сайт</a> | <a data-url="http://www.microslop.com">Помощь</a><br>
            Copyright &copy; 1998 WebSeeker Inc. В индексе 64&nbsp;800 страниц.<br>
            Добавить сайт: ${this.mailLink('addurl@search98.com')} &middot; Рассылка WebSeeker Digest: ${this.mailLink('digest@search98.com')}<br>
            Лучше всего смотреть в Microslop Internet Explorer 5.0 при 800x600.
          </div>
        </div>
      </div>
    `;
  }

  attachSearchEvents(win, container) {
    const input = container.querySelector('#search-input');
    const btnSearch = container.querySelector('#btn-search');
    const btnLucky = container.querySelector('#btn-lucky');

    const executeSearch = (text) => {
      this.lastSearchQuery = text.trim();
      this.navigate(win, `http://www.search98.com/search?q=${encodeURIComponent(this.lastSearchQuery)}`);
    };

    if (btnSearch) btnSearch.addEventListener('click', () => executeSearch(input.value));
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeSearch(input.value);
      });
    }

    if (btnLucky) {
      btnLucky.addEventListener('click', () => {
        const pool = this.favorites.map(([url]) => url).filter(url => url !== this.defaultUrl);
        const randomUrl = pool[Math.floor(Math.random() * pool.length)];
        if (window.soundSys) window.soundSys.playClick();
        this.navigate(win, randomUrl);
      });
    }

    container.querySelectorAll('a[data-query]').forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        executeSearch(tag.dataset.query);
      });
    });
  }

  performSearch(query) {
    const q = query.toLowerCase();
    const results = [];

    if (q.includes('фаргус') || q.includes('fargus') || q.includes('перевод') || q.includes('дубляж') || q.includes('озвучк') || q.includes('потрачено') || q.includes('охлади')) {
      results.push({
        title: '«ФАРГУС Мультимедиа» — Только полный и качественный перевод',
        url: 'http://www.goldfargus.ru',
        snippet: 'Каталог изданий «Полностью на русском языке»: «Период полураспада», «Рок: Ад на Марсе», «Великий автоугон: Свердловск». Голоса озвучки, патчи, техподдержка и гостевая книга.'
      });
    }

    if (q.includes('молоток') || q.includes('molotok') || q.includes('аукцион') || q.includes('барахолк') || q.includes('ставк') || q.includes('у.е.') || q.includes('voodoo') || q.includes('вуду') || q.includes('awe64')) {
      results.push({
        title: 'Интернет-аукцион «Молоток.ру» (1998) — Торги компьютерным железом',
        url: 'http://www.molotok98.ru',
        snippet: 'Видеокарты, звуковые карты, Celeron 300A, модемы US Robotics и ZyXEL, приставки Dendy и Sega. Ставки в у.е., автоставки других участников, блиц-цена и квитанции.'
      });
    }

    if (q.includes('хакер') || q.includes('xakep') || q.includes('взлом') || q.includes('кейген') || q.includes('keygen') || q.includes('серийник') || q.includes('чиптюн') || q.includes('chiptune') || q.includes('чернобыль') || q.includes('cih')) {
      results.push({
        title: 'Электронный журнал «Хакер \'98» — Underground Web-Zine',
        url: 'http://www.xakep98.ru',
        snippet: 'Пилотный сетевой номер: коды DOOM 98, модем на плохой линии, вирус CIH, Celeron 300A на 450 МГц, ФидоНет для поинтов. Х-Почта и KeyGen 98 с музыкой.'
      });
    }

    if (q.includes('мульт') || q.includes('масян') || q.includes('masyanya') || q.includes('хрюндел') || q.includes('анимаци') || q.includes('mult')) {
      results.push({
        title: 'Студия «Мульт.ру» (1998) — Народная интернет-анимация',
        url: 'http://www.mult98.ru',
        snippet: 'Мультики про Масяню и Хрюнделя: «Модем», «Понедельник», «Радиорынок», «Проблема 2000». Сценарии серий, цитатник, обои на рабочий стол и гостевая книга.'
      });
    }

    if (q.includes('эмул') || q.includes('денди') || q.includes('dendy') || q.includes('sega') || q.includes('сега') || q.includes('rom') || q.includes('nes') || q.includes('танчик') || q.includes('контр') || q.includes('emuland')) {
      results.push({
        title: 'Emu-Land (1998) — Главный архив консольных игр Dendy и Sega',
        url: 'http://www.emuland98.ru',
        snippet: 'Дампы картриджей Dendy, Sega, SNES и Game Boy со скриншотами: Battle City, Contra, Super Mario Bros., Sonic 2, Mortal Kombat 3, Tetris. Коды и эмуляторы NESticle, Genecyst, ZSNES.'
      });
    }

    if (q.includes('нло') || q.includes('ufo') || q.includes('истин') || q.includes('пришельц') || q.includes('аномал') || q.includes('x-files') || q.includes('секретн') || q.includes('roswell') || q.includes('area51')) {
      results.push({
        title: 'Архив «Истина где-то рядом» — UFO & Paranormal Investigations',
        url: 'http://www.xfiles98.ru',
        snippet: 'Дела об НЛО и аномалиях: Молёбка, вспышки в небе, голос в модеме в 3:33. Чёрные полосы в документах снимает дешифратор. Рассказы очевидцев и мнение скептика.'
      });
    }

    if (q.includes('interpedia') || q.includes('интерпеди') || q.includes('википеди') || q.includes('wikipedia') || q.includes('энциклопеди') || q.includes('wiki') || q.includes('стать') || q.includes('знания') || q.includes('справка')) {
      results.push({
        title: 'Интерпедия (Interpedia) — Свободная Интернет-Энциклопедия 1998',
        url: 'http://www.interpedia.org',
        snippet: 'Свободная двуязычная (русский и английский) интернет-энциклопедия. Подробные статьи об операционной системе Win 98, Half-Life, Wolfenstein 3D, 3dfx Voodoo, Blender 1.60, Award BIOS, Winamp, FidoNet и истории Интернета. Интерактивные правки, обсуждения и экспорт в Блокнот!'
      });
    }

    if (q.includes('книг') || q.includes('литератур') || q.includes('мошков') || q.includes('lib.ru') || q.includes('библиотек') || q.includes('стругацк') || q.includes('лукьяненк') || q.includes('гибсон') || q.includes('нейромант') || q.includes('манифест') || q.includes('мерфи')) {
      results.push({
        title: 'Lib.ru: Библиотека Максима Мошкова (Электронная библиотека Рунета)',
        url: 'http://www.lib.ru',
        snippet: 'Старейшая и крупнейшая электронная библиотека русскоязычного интернета. Русская и зарубежная фантастика, киберпанк, Манифест хакера, законы Мёрфи для программистов, чтение и сохранение в Блокнот (Notepad)!'
      });
    }

    if (q.includes('игромани') || q.includes('журнал') || q.includes('igromania') || q.includes('turok') || q.includes('avp') || q.includes('диск') || q.includes('cd-приложен') || q.includes('видеоархив')) {
      results.push({
        title: 'Журнал «Игромания» 1998 - Официальный веб-сайт и CD-приложение',
        url: 'http://www.igromania.ru',
        snippet: 'Ведущий российский журнал о видеоиграх. Видеоролики с компакт-диска (Aliens vs Predator, Turok 2, Heretic II), Горячая линия экспертов по железу и патчам, Читерский уголок и запуск Macromedia Director CD Shell!'
      });
    }

    if (q.includes('чит') || q.includes('cheat') || q.includes('код') || q.includes('code') || q.includes('парол') || q.includes('cheatcc') || q.includes('прохожден') || q.includes('сапер') || q.includes('косынк') || q.includes('пинбол')) {
      results.push({
        title: 'Cheat Code Central (CheatCC.com) - Все читы и коды к играм',
        url: 'http://www.cheatcc.com',
        snippet: 'Коды, которые проверены руками: IDDQD в DOOM 98, TANK в GTA: Екатеринбург \'90, консоль Quake III, меню F7 в «Нижнем Сити», Forza и «Зове Припяти». Отдельный раздел про коды, которые не работают.'
      });
    }

    if (q.includes('skin') || q.includes('скин') || q.includes('winamp') || q.includes('винамп') || q.includes('llama') || q.includes('nullsoft') || q.includes('плеер') || q.includes('wsz')) {
      results.push({
        title: 'Nullsoft Winamp Skins Archive & Audio Depot (1998)',
        url: 'http://skins.winamp.com',
        snippet: 'Официальный архив скинов Winamp 2.x ("It really whips the llama\'s ass!"). Темы Matrix Digital Rain, Luxury Gold, Cobalt Hi-Fi, Di Gi Charat Anime. Мгновенное применение скинов в плеере и загрузка MP3 в плейлист!'
      });
    }

    if (q.includes('space') || q.includes('jam') || q.includes('джем') || q.includes('джордан') || q.includes('багз') || q.includes('лола') || q.includes('луни') || q.includes('tunes') || q.includes('баскетбол')) {
      results.push({
        title: 'Warner Bros. Space Jam (1996) - Official Movie Website',
        url: 'http://www.spacejam.com',
        snippet: 'Культовый оригинальный промо-сайт фильма «Космический джем» со звездным небом и орбитальной навигацией: Planet B-Ball, TuneSquad ростер, сувенирные обои и раскраски для Win 98!'
      });
    }

    if (q.includes('icq') || q.includes('аськ') || q.includes('пейджер') || q.includes('pager') || q.includes('uin') || q.includes('мирабилис') || q.includes('white pages') || q.includes('о-оу')) {
      results.push({
        title: 'Mirabilis ICQ World & Web-Pager (Мгновенные сообщения)',
        url: 'http://www.icq.com',
        snippet: 'Всемирный портал ICQ: отправка сообщений через Web-Pager на любой UIN со звуковым сигналом "О-оу!", каталог пользователей White Pages и загрузка клиента ICQ 98a!'
      });
    }

    if (q.includes('y2k') || q.includes('2000') || q.includes('миллениум') || q.includes('баг') || q.includes('ошибк') || q.includes('апокалипсис') || q.includes('коллапс') || q.includes('выживан')) {
      results.push({
        title: 'Y2K Millennium Bug Survival Center & BIOS Compliance Test',
        url: 'http://www.y2k-countdown.org',
        snippet: 'Всемирная служба тревоги по проблеме 2000 года: живой счетчик обратного отсчета до перехода часов, интерактивное тестирование BIOS и RTC ПК, памятка по выживанию при падении серверов!'
      });
    }

    if (q.includes('фидо') || q.includes('fido') || q.includes('fidonet') || q.includes('эхоконференц') || q.includes('5020') || q.includes('поинт') || q.includes('нода') || q.includes('сисоп') || q.includes('кащенк')) {
      results.push({
        title: 'FidoNet Web-Gateway (Relcom / Fido7 Node 2:5020)',
        url: 'http://fido.relcom.ru',
        snippet: 'Веб-шлюз некоммерческой компьютерной сети Фидонет. Чтение популярных эхоконференций RU.GAME, RU.ANEKDOT, SU.KASCHENKO.LOCAL и отправка писем с сохранением!'
      });
    }

    if (q.includes('яндекс') || q.includes('yandex') || q.includes('ya.ru') || q.includes('найдется') || q.includes('морфолог')) {
      results.push({
        title: 'Яndex 1998 - Поисковая машина с русской морфологией',
        url: 'http://www.yandex.ru',
        snippet: 'Российская поисковая система Яndex («Найдётся всё!»): поиск с учетом падежей и склонений русского языка, цитата дня, народные приметы и каталог ресурсов Рунета 1998 года!'
      });
    }

    if (q.includes('скрепыш') || q.includes('clippy') || q.includes('clippit') || q.includes('помощник') || q.includes('assistant') || q.includes('гардероб') || q.includes('шляп') || q.includes('галстук') || q.includes('скрепк')) {
      results.push({
        title: "Скрепыш '98 - Официальный сайт Помощника Office: биография, коллеги и Гардероб",
        url: 'http://www.clippy98.com',
        snippet: 'Всё о Скрепыше (Clippit) из Office 97: досье, FAQ, гостевая книга и бесплатные образы для помощника — цилиндр, ушанка, кепка с пропеллером, галстук, бабочка, монокль, усы гусара. Скачивайте .ACS и надевайте прямо на рабочем столе!'
      });
    }

    if (q.includes('youvid') || q.includes('ютуб') || q.includes('youtube') || q.includes('видео') || q.includes('video') || q.includes('zoo') || q.includes('зоопарк') || q.includes('jawed') || q.includes('hayato') || q.includes('хаято') || q.includes('хср') || q.includes('star rail') || q.includes('гармони') || q.includes('влад') || q.includes('савельев') || q.includes('одеял') || q.includes('ебатори') || q.includes('найс') || q.includes('nice') || q.includes('караоке') || q.includes('slay') || q.includes('бакс') || q.includes('барбершоп') || q.includes('стрижк')) {
      results.push({
        title: 'YouVid - Покажи себя: видео от каждого',
        url: 'http://www.youvid.com',
        snippet: 'Смотрите видео прямо в браузере: «Me at the zoo» от jawed, «Смогу ли Я пройти ХСР только ГАРМОНИСТАМИ» от Hayato, «Влад Савельев ложится спать» и «verynicegoodnice» с канала Планета Ебатории, «Теперь я extremely slay, меньше волос» от Мистера Бакса. Картинку рисует 3D-ускоритель, звук идёт из оригинальной записи. Каналы, подписки, оценки и комментарии.'
      });
    }

    if (q.includes('клип') || q.includes('полигон') || q.includes('poligon') || q.includes('3d') || q.includes('3д') || q.includes('rick') || q.includes('astley') || q.includes('эстли') || q.includes('never gonna') || q.includes('video clip')) {
      results.push({
        title: 'ПОЛИГОН - Музыкальные клипы, собранные заново в 3D',
        url: 'http://www.poligon3d.ru',
        snippet: 'Выпуск №1: Rick Astley, Never Gonna Give You Up (1987). Студия, аркада, двор у сетки и зал с окнами построены из полигонов, картинку рисует ваш 3D-ускоритель, звук идёт из MP3. Полоса перемотки раскрашена по местам съёмки.'
      });
    }

    if (q.includes('программ') || q.includes('софт') || q.includes('program') || q.includes('software') || q.includes('приложен') || q.includes('3advanced') || q.includes('2advanced') || q.includes('каталог')) {
      results.push({
        title: '3ADVANCED SOFTWORKS - Progressive Software Technology: каталог программ Win 98',
        url: 'http://www.3advanced.com',
        snippet: 'Стильный портал о всех программах вашей системы: Проводник, Блокнот, WinAmp, Blender, ICQ, Outlook Express и 40 модулей в каталоге. Запуск и установка прямо со страницы. Optimized for IE 5.0 // 800x600.'
      });
    }

    if (q.includes('обои') || q.includes('заставк') || q.includes('скринсейвер') || q.includes('матриц') || q.includes('тем') || q.includes('matrix') || q.includes('wallpaper') || q.includes('screensaver') || q.includes('theme') || q.includes('фон') || q.includes('plus') || q.includes('плюс') || q.includes('персонализац')) {
      results.push({
        title: "ThemeWorld '98 - Обои на рабочий стол, Заставки (The Matrix Code) и Темы Plus! для Win 98",
        url: 'http://www.themeworld98.com',
        snippet: 'Огромный архив персонализации Win 98: культовая экранная заставка с падающими зелеными буквами матрицы (The Matrix Code 1999), 3D Pipes, Starfield, коллекция обоев высокого разрешения .BMP и темы Plus! со звуковыми схемами и курсорами!'
      });
    }

    if (q.includes('blender') || q.includes('блендер') || q.includes('3d') || q.includes('3д') || q.includes('моделир') || q.includes('рендер') || q.includes('render') || q.includes('nan') || q.includes('neogeo') || q.includes('график') || q.includes('mesh')) {
      results.push({
        title: 'Blender 3D - Blender 2.04: free 3D creation and interactive 3D',
        url: 'http://www.blender3d.com',
        snippet: 'Официальный сайт Blender от Not a Number (NaN). Новая версия 2.04 (2.9 МБ): игровой движок с логическими блоками, NURBS, метаболы, 3D-текст, рендер с тенями и контурами, IPO-анимация. Бесплатная загрузка для Win 95/98/NT, галерея, уроки, гостевая книга.'
      });
    }

    if (q.includes('digi') || q.includes('charat') || q.includes('dejiko') || q.includes('puchiko') || q.includes('деджико') || q.includes('пучико') || q.includes('диги') || q.includes('чарат') || q.includes('аниме') || q.includes('anime') || q.includes('party night') || q.includes('gamers') || q.includes('usada') || q.includes('gema') || q.includes('rabi')) {
      results.push({
        title: "★ Di Gi Charat (1999) — Official English Fan Club ★",
        url: 'http://www.digicharat.net',
        snippet: 'The ultimate English-language portal for the 1999 Madhouse anime phenomenon! All 16 episodes streaming with MKV multi-subtitles (English, Director Commentary, Russian), full "Party Night" MP3 music player with lyrics, art gallery, anime lore & creator bios, and vintage guestbook!'
      });
    }

    if (q.includes('кино') || q.includes('фильм') || q.includes('сериал') || q.includes('киномания') || q.includes('kinomania') || q.includes('x-files') || q.includes('секретные материалы') || q.includes('звездные войны') || q.includes('star wars') || q.includes('титаник') || q.includes('брэд питт') || q.includes('хопкинс') || q.includes('друзья') || q.includes('friends') || q.includes('менты') || q.includes('улицы разбитых фонарей') || q.includes('матрица') || q.includes('горбушка') || q.includes('vhs') || q.includes('бокс-офис') || q.includes('кассовые сборы') || q.includes('кинофорум')) {
      results.push({
        title: "Киномания '98 - Новости кино и сериалов, КиноФорум (Ноябрь 1998)",
        url: 'http://www.kinomania98.ru',
        snippet: 'Главный портал киноманов Рунета: премьера тизера Star Wars Episode 1, старт 6 сезона The X-Files, Брэд Питт в «Знакомьтесь, Джо Блэк», рейтинг VHS Горбушки и горячий КиноФорум с обсуждением фильмов!'
      });
    }

    if (q.includes('rambler') || q.includes('рамблер') || q.includes('рунет') || q.includes('погода') || q.includes('курс') || q.includes('валют') || q.includes('доллар') || q.includes('дефолт') || q.includes('top100') || q.includes('апорт')) {
      results.push({
        title: "Рамблер '98 - Информационно-поисковая система Рунета",
        url: 'http://www.rambler98.ru',
        snippet: 'Главная страница российского интернета 1998 года. Официальный курс ЦБ РФ (USD = 20.80 руб.), прогноз погоды по городам СНГ, гороскопы и популярнейший каталог Top 100 сайтов Рунета!'
      });
    }

    if (q.includes('видео') || q.includes('video') || q.includes('кино') || q.includes('cinema') || q.includes('клип') || q.includes('трейлер') || q.includes('trailer') || q.includes('фильм') || q.includes('ролик') || q.includes('prodigy') || q.includes('продиджи') || q.includes('half-life') || q.includes('fallout') || q.includes('berserk') || q.includes('берсерк') || q.includes('мультимедиа') || q.includes('activemovie')) {
      results.push({
        title: "WebCinema '98 - Цифровой архив видеоклипов Всемирной Паутины",
        url: 'http://www.webcinema98.com',
        snippet: 'Смотрите онлайн и скачивайте видеоролики эпохи MPEG-1 и QuickTime: легендарный концерт The Prodigy в Москве (1997), официальные трейлеры Half-Life, Fallout 1 & 2, аниме Berserk TV. Встроенный плеер ActiveMovie DirectShow!'
      });
    }

    if (q.includes('mp3') || q.includes('музык') || q.includes('песн') || q.includes('music') || q.includes('audio') || q.includes('prodigy') || q.includes('скачать mp3') || q.includes('трек')) {
      results.push({
        title: "MP3 Vault '98 - Цифровой архив музыки в формате MP3",
        url: 'http://www.mp3vault98.com',
        snippet: 'Сотни культовых треков 1998 года: The Prodigy, The Offspring, Fatboy Slim, русский рок и саундтреки. Скачивание файлов прямо в папку «Моя музыка» и мгновенное воспроизведение в Winamp!'
      });
    }

    if (q.includes('антивирус') || q.includes('вирус') || q.includes('virus') || q.includes('чернобыль') || q.includes('cih') || q.includes('заражен') || q.includes('лечение') || q.includes('cure') || q.includes('totally')) {
      results.push({
        title: 'AntiVirus Lab 1998 - Центр защиты от киберугроз и вирусов',
        url: 'http://www.antivirus98.com',
        snippet: 'Оповещение об опасных угрозах: вирус «Totally Not A Virus», Чернобыль CIH. Симптомы заражения, онлайн-проверка системы и загрузка бесплатной лечащей утилиты RetroCure.exe!'
      });
    }

    if (q.includes('анекдот') || q.includes('юмор') || q.includes('шутк') || q.includes('прикол') || q.includes('смех') || q.includes('вернер')) {
      results.push({
        title: 'Anekdot.ru 1998 - Ежедневные анекдоты из России Дмитрия Вернера',
        url: 'http://www.anekdot98.ru',
        snippet: 'Культовый сайт Рунета с ежедневными выпусками юмора: анекдоты про новых русских, Билла Гейтса и Win 98, сисадминов и медленные модемы. Голосование за лучшие шутки!'
      });
    }

    if (q.includes('чат') || q.includes('кроватка') || q.includes('chat') || q.includes('общение') || q.includes('знакомств') || q.includes('разговор')) {
      results.push({
        title: "Чат «Кроватка '98» - Главное место онлайн-общения Рунета",
        url: 'http://chat.krovatka98.ru',
        snippet: 'Живой веб-чат эпохи 1998 года: тематические комнаты «Разговоры», «Компьютерщики», «Флирт», десятки пользователей онлайн, быстрый обмен репликами со звуковыми оповещениями!'
      });
    }

    if (q.includes('geocities') || q.includes('геоситис') || q.includes('страничк') || q.includes('сайт') || q.includes('народ') || q.includes('хостинг') || q.includes('html')) {
      results.push({
        title: "GeoCities '98 - Каталог персональных домашних страниц Сети",
        url: 'http://www.geocities.com',
        snippet: 'Мир веб-дизайна 90-х: неоновые фоны, анимированные гифки с пламенем, баннеры «Сделано в Блокноте». Интерактивный конструктор для создания собственной страницы!'
      });
    }

    if (q.includes('3dfx') || q.includes('voodoo') || q.includes('разгон') || q.includes('железо') || q.includes('fps') || q.includes('celeron') || q.includes('видеокарт') || q.includes('riva') || q.includes('overclock')) {
      results.push({
        title: '3dfx Voodoo Zone & Hardware Overclockers 1998',
        url: 'http://www.3dfx-zone.com',
        snippet: 'Тестирование 3D-ускорителей Voodoo 2 в режиме SLI, разгон процессора Celeron 300A до 450 МГц, интерактивный калькулятор FPS в играх и советы по оптимизации DOS-памяти.'
      });
    }

    if (q.includes('microslop') || q.includes('майкрослоп') || q.includes('windows') || q.includes('виндовс') || q.includes('win98') || q.includes('новости') || q.includes('news') || q.includes('билл') || q.includes('гейтс') || q.includes('клон') || q.includes('clone') || q.includes('команд') || q.includes('command') || q.includes('выполнить') || q.includes('run') || q.includes('msconfig') || q.includes('dxdiag') || q.includes('sysedit') || q.includes('scandisk') || q.includes('форум') || q.includes('forum') || q.includes('справка') || q.includes('help') || q.includes('support')) {
      results.push({
        title: 'Microslop Corporation - Win 98 Official Portal',
        url: 'http://www.microslop.com',
        snippet: 'Официальный портал Microslop: глобальный запуск Win 98, корпоративные новости компании, каталог стандартных приложений (MSConfig, DxDiag, SysEdit, Paint, WordPad), справочник команд и форум поддержки!'
      });
    }

    if (q.includes('программ') || q.includes('софт') || q.includes('soft') || q.includes('видео') || q.includes('плеер') || q.includes('фотошоп') || q.includes('photoshop') || q.includes('командер') || q.includes('commander') || q.includes('wincmd') || q.includes('утилит') || q.includes('winzip')) {
      results.push({
        title: 'SoftStore 98 - Каталог программного обеспечения для Win 98',
        url: 'http://www.softstore98.com',
        snippet: 'Купить и скачать программы для Win 98: ActiveMovie Video Player 98, графический редактор RetroShop 98 Pro со слоями, двухпанельный менеджер файлов WinCommander 98, архиватор WinZip. Оплата по картам Visa/MasterCard!'
      });
    }

    if (q.includes('видео') || q.includes('плеер') || q.includes('video') || q.includes('mplayer') || q.includes('кино') || q.includes('фильм')) {
      results.push({
        title: 'ActiveMovie Video Player 98 (Microslop) - Купить и скачать',
        url: 'http://www.softstore98.com',
        snippet: 'Полнофункциональный видеоплеер для Win 98. Воспроизведение роликов AVI, MPEG-1, Cinepak, покадровая перемотка, таймкод. Лицензия $19.99 на SoftStore 98.'
      });
    }

    if (q.includes('фотошоп') || q.includes('photoshop') || q.includes('retroshop') || q.includes('рисун') || q.includes('редактор') || q.includes('слои') || q.includes('фильтр')) {
      results.push({
        title: 'RetroShop 98 (Adobe Systems Inc.) - Растровый редактор со слоями',
        url: 'http://www.softstore98.com',
        snippet: 'Профессиональный редактор со слоями, прозрачностью, фильтрами Гаусса, пикселизации, тиснения, штампом и градиентами. Значительно превосходит стандартный Paint! Лицензия $39.99 на SoftStore 98.'
      });
    }

    if (q.includes('тотал') || q.includes('командер') || q.includes('total') || q.includes('commander') || q.includes('wincmd') || q.includes('файл') || q.includes('менеджер')) {
      results.push({
        title: 'WinCommander 98 (C. Ghisler & Co.) - Двухпанельный файловый менеджер',
        url: 'http://www.softstore98.com',
        snippet: 'Классический файловый коммандер для Win 98. Две панели, клавиши F3-F8, диски C: и D:, встроенная командная строка. Лицензия $24.99 на SoftStore 98.'
      });
    }

    if (q.includes('картинк') || q.includes('фото') || q.includes('imaging') || q.includes('kodak') || q.includes('просмотр')) {
      results.push({
        title: 'Imaging for Win 98 (Eastman Kodak) - Просмотрщик картинок',
        url: 'http://www.microslop.com',
        snippet: 'Встроенный в Win 98 инструмент для просмотра изображений .bmp, .jpg, .png. Масштабирование, поворот на 90°, слайд-шоу. Бесплатно в системе!'
      });
    }

    if (q.includes('winamp') || q.includes('винамп') || q.includes('музык') || q.includes('песн') || q.includes('music') || q.includes('mp3') || q.includes('аудио') || q.includes('audio') || q.includes('звук')) {
      results.push({
        title: 'WinAmp 98 Pro (Nullsoft) - Купить культовый MP3 плеер',
        url: 'http://www.softstore98.com',
        snippet: 'Winamp, it really whips the llama\'s ass! Легендарный плеер с 10-полосным эквалайзером, анализатором спектра, осциллографом и поддержкой MP3. Лицензия $14.99 на SoftStore 98.'
      });
    }

    if (q.includes('honkai') || q.includes('хонкай') || q.includes('star rail') || q.includes('starrail') || q.includes('звёздный экспресс') || q.includes('звездный экспресс') || q.includes('hoyoverse') || q.includes('mihoyo') || q.includes('jrpg') || q.includes('март 7')) {
      results.push({
        title: 'Honkai: Star Rail 98 - Официальный сайт',
        url: 'http://hsr.hoyoverse.com',
        snippet: 'Пошаговая ролевая игра о Звёздном экспрессе и ледяной планете Ярило-VI. Полная версия 1.4 бесплатно: установщик 3,1 МБ, зеркала в Москве, Франкфурте и Шанхае. Персонажи, новости, галерея.'
      });
    }

    if (q.includes('игр') || q.includes('магаз') || q.includes('купи') || q.includes('game') || q.includes('shop') || q.includes('buy') || q.includes('скача') || q.includes('steam') || q.includes('стим') || q.includes('valve') || q.includes('установ')) {
      results.push({
        title: 'Steam - Игры, которые приходят сами',
        url: 'http://www.steampowered.com',
        snippet: 'Клиент Steam от Valve: покупайте игры картой, загружайте их напрямую с серверов контента и запускайте с Рабочего стола. Бесплатная загрузка SteamInstall.exe (1.3 МБ).'
      });
    }

    if (q.includes('форум') || q.includes('клуб') || q.includes('forum') || q.includes('обсужд') || q.includes('чит') || q.includes('секрет') || q.includes('cheat') || q.includes('half-life') || q.includes('starcraft') || q.includes('fallout')) {
      results.push({
        title: 'GamerZone Forum 1998 - Всероссийский форум геймеров',
        url: 'http://forum.games98.com',
        snippet: 'Восемь разделов и десятки тем: Half-Life, StarCraft, «Нижний Сити», Fallout: Запорожье, загрузка из Steam по модему, читы и меню F7, разгон Celeron и флейм «Voodoo против TNT».'
      });
    }

    if (q.includes('новост') || q.includes('news') || q.includes('событи') || q.includes('газет') || q.includes('пресс') || q.includes('стать')) {
      results.push({
        title: 'Cyberspace Times 1998 - Новости Сети и Высоких Технологий',
        url: 'http://www.retro-news98.com',
        snippet: 'Главное информационное агентство Сети. Релиз Win 98 Second Edition, революция 3D-графики, выход Half-Life, суд вокруг плееров Diamond Rio MP3 и опрос читателей.'
      });
    }

    if (q.includes('wolf') || q.includes('вольф') || q.includes('3d action') || q.includes('шутер')) {
      results.push({
        title: 'Wolfenstein 3D (id Software) - Купить в Steam',
        url: 'http://www.steampowered.com',
        snippet: 'Легендарный хит от Джона Кармака и id Software. Сразитесь за свободу в замке Вольфенштейн. $14.99 в клиенте Steam.'
      });
      results.push({
        title: 'Форум: Секретные комнаты в Wolfenstein 3D',
        url: 'http://forum.games98.com/thread?id=2',
        snippet: 'Есть ли в версии из Steam потайные стены и работает ли старый код M+L+I. Отвечают те, кто проверял.'
      });
    }

    if (q.includes('stalker') || q.includes('сталкер') || q.includes('зон') || q.includes('чернобыль') || q.includes('аномал')) {
      results.push({
        title: 'S.T.A.L.K.E.R.: Чернобыль 1998 - Цифровая копия игры в Steam',
        url: 'http://www.steampowered.com',
        snippet: 'Атмосферный шутер о выживании в Чернобыльской Зоне Отчуждения. Аномалии, мутанты и артефакты. $29.99 в клиенте Steam.'
      });
      results.push({
        title: 'Новости: Экспедиция в Чернобыльскую Зону столкнулась с аномалиями',
        url: 'http://www.retro-news98.com',
        snippet: 'Сенсационные отчеты ученых и очевидцев из района Чернобыльской АЭС о гравитационных аномалиях.'
      });
    }

    if (q.includes('quest') || q.includes('квест') || q.includes('scumm') || q.includes('guybrush') || q.includes('приключ')) {
      results.push({
        title: 'LucasQuest 98 - Графический квест на движке SCUMM',
        url: 'http://www.steampowered.com',
        snippet: 'Пиратские приключения Гайбраша Байтвуда в замке Редмонд! Классический юмор и головоломки. $19.99 в клиенте Steam.'
      });
    }

    if (results.length === 0) {
      results.push({
        title: "Рамблер '98 - Главная страница российского Интернета",
        url: 'http://www.rambler98.ru',
        snippet: 'Новости, курсы доллара ЦБ РФ, прогноз погоды и Топ-100 сайтов Рунета.'
      });
      results.push({
        title: 'Steam - Игры, которые приходят сами',
        url: 'http://www.steampowered.com',
        snippet: 'Покупка и загрузка игр через клиент Steam: DOOM 98, Half-Life 98, Diablo, Dota 98 и ещё полтора десятка игр.'
      });
      results.push({
        title: "MP3 Vault '98 - Цифровой архив музыки в формате MP3",
        url: 'http://www.mp3vault98.com',
        snippet: 'Культовые MP3 треки 1998 года с прямой загрузкой для плеера Winamp.'
      });
      results.push({
        title: 'GamerZone Forum 1998 - Всероссийский форум геймеров',
        url: 'http://forum.games98.com',
        snippet: 'Обсуждение видеоигр, прохождений, секретов и компьютерного железа 1998 года.'
      });
      results.push({
        title: 'Cyberspace Times 1998 - Ежедневная газета цифрового века',
        url: 'http://www.retro-news98.com',
        snippet: 'Свежие события в мире персональных компьютеров, анонсы игр и обзоры 3D-видеокарт.'
      });
    }

    return results;
  }

  getDetailItemData(id) {
    const details = {
      videoplayer: {
        title: 'ActiveMovie Video Player 98',
        developer: 'Microslop Multimedia Systems',
        genre: 'Media Player / AVI & MPEG-1 Engine',
        specs: { cpu: 'Pentium 133 MHz', ram: '16 MB RAM', disk: '10 MB', vga: 'PCI DirectDraw 2MB', audio: '16-bit Stereo' },
        rating: '4.9/5 ★★★★★',
        review: '«Плавное воспроизведение видео в разрешении 320x240 со скоростью 30 кадров в секунду без выпадения кадров!»'
      },
      photoshop: {
        title: 'RetroShop 98 Pro (Photo Editor)',
        developer: 'Adobe Systems Inc.',
        genre: 'Professional Graphic Editor / Layers & Filters',
        specs: { cpu: 'Pentium II 233 MHz', ram: '64 MB RAM', disk: '120 MB', vga: 'True Color 1024x768 24-bit', audio: 'Optional' },
        rating: '5/5 ★★★★★',
        review: '«Прорыв в обработке растровой графики. Независимые слои с прозрачностью, фильтры Гаусса и штамп клонирования!»'
      },
      wincommander: {
        title: 'WinCommander 98',
        developer: 'C. Ghisler & Co.',
        genre: 'Dual-Pane File Manager',
        specs: { cpu: 'Any 486 or Pentium', ram: '8 MB RAM', disk: '3 MB', vga: 'VGA / SVGA', audio: 'None' },
        rating: '5/5 ★★★★★',
        review: '«Идеальный инструмент для работы с дисками C: и D:. Клавиши F3-F8 экономят часы времени сисадминам.»'
      },
      winamp: {
        title: 'WinAmp 98 Pro 2.81',
        developer: 'Nullsoft, Inc.',
        genre: 'MP3 / Audio Player',
        specs: { cpu: 'Pentium 100 MHz (для декодирования MP3)', ram: '16 MB RAM', disk: '5 MB', vga: 'VGA', audio: 'Sound Blaster Pro 16' },
        rating: '5/5 ★★★★★',
        review: '«It really whips the llama\'s ass! Зеленый дисплей спектра и 10-полосный эквалайзер — икона 90-х.»'
      },
      winzip: {
        title: 'WinZip 7.0',
        developer: 'Nico Mak Computing',
        genre: 'File Compression Utility',
        specs: { cpu: '486DX', ram: '8 MB RAM', disk: '4 MB', vga: 'VGA', audio: 'None' },
        rating: '4.9/5 ★★★★★',
        review: '«Сжимает документы и программы на дискетах до 70%, незаменим при работе с интернетом 56K.»'
      },
      retroav: {
        title: 'RetroAV 98 Pro',
        developer: 'CyberSecurity Lab',
        genre: 'AntiVirus Shield & Heuristic Scanner',
        specs: { cpu: 'Pentium 120 MHz', ram: '16 MB RAM', disk: '12 MB', vga: 'VGA', audio: 'PC Speaker Alert' },
        rating: '4.8/5 ★★★★★',
        review: '«Надежно блокирует трояны, вирус Totally-Not-A-Virus и защищает загрузочный сектор MBR.»'
      },
      avp: {
        title: 'Антивирус Касперского AVP 3.0',
        developer: 'Лаборатория Касперского',
        genre: 'Антивирусный комплекс / Защита в реальном времени',
        specs: { cpu: '486DX4 / Pentium 75 MHz', ram: '16 MB RAM', disk: '15 MB', vga: 'VGA / SVGA', audio: 'Sound Blaster / PC Speaker (для звука визга)' },
        rating: '5/5 ★★★★★',
        review: '«Лучший отечественный антивирус. Мощный эвристический анализатор, перехват вирусов на лету и знаменитый визг при обнаружении зараженных файлов.» — Компьютерра'
      }
    };
    return details[id] || null;
  }

  get softStoreApps() {
    return [
      { id: 'videoplayer', title: 'ActiveMovie Video Player 98', vendor: 'Microslop Multimedia Systems', category: 'Мультимедиа', price: '$19.99', icon: 'video-player', badge: 'хит продаж', desc: 'Видеоплеер для Win 98: AVI, MPEG-1 и Cinepak, полноэкранный режим, покадровая перемотка и таймкод.' },
      { id: 'photoshop', title: 'RetroShop 98 Photo Editor', vendor: 'Adobe Systems Inc.', category: 'Графика', price: '$39.99', icon: 'photoshop', badge: 'выбор редакции', desc: 'Слои с прозрачностью, размытие по Гауссу, тиснение, яркость и контраст, градиенты, штамп и история действий.' },
      { id: 'wincommander', title: 'WinCommander 98', vendor: 'C. Ghisler & Co.', category: 'Утилиты', price: '$24.99', icon: 'wincommander', badge: '', desc: 'Двухпанельный файловый менеджер: F3 просмотр, F5 копирование, F6 перенос, F7 папка, F8 удаление.' },
      { id: 'winamp', title: 'WinAmp 98 Pro', vendor: 'Nullsoft, Inc.', category: 'Мультимедиа', price: '$14.99', icon: 'winamp', badge: 'хит', desc: 'MP3, WAV и MIDI. 10-полосный эквалайзер, анализатор спектра и плейлист. It really whips the llama\'s ass!' },
      { id: 'winzip', title: 'WinZip 7.0', vendor: 'Nico Mak Computing', category: 'Утилиты', price: '$14.99', icon: 'folder', badge: '', desc: 'Сжимает файлы и папки в ZIP. Экономит место на диске и время на модеме.' },
      { id: 'avp', title: 'Антивирус Касперского AVP 3.0', vendor: 'Лаборатория Касперского', category: 'Безопасность', price: '$24.99', icon: 'avp', badge: 'новинка', desc: 'Проверка памяти, загрузочных секторов, дисков и дискет. Эвристика, карантин и знаменитый сигнал тревоги.' }
    ];
  }

  renderSoftStore(url = '') {
    const gm = window.gameManager;
    const apps = this.softStoreApps;
    const clean = (url || '').toLowerCase();
    const idMatch = /[?&]id=([a-z0-9_-]+)/.exec(clean);
    const pageId = idMatch ? idMatch[1] : null;
    this.activeDetailItemId = clean.includes('/product') ? pageId : null;
    this.activeSoftStorePaymentId = clean.includes('/order') ? pageId : null;

    const categories = [...new Set(apps.map(a => a.category))];
    const statusCell = (a) => {
      if (gm && gm.isInstalled(a.id)) {
        return `<span class="store98-owned">${this.gif('check')} установлено</span><br><button class="win-btn store98-btn-installed" data-soft-launch="${a.id}">Запустить</button>`;
      }
      if (gm && gm.isPurchased(a.id)) {
        return `<span class="store98-owned">${this.gif('check')} куплено</span><br><button class="win-btn store98-btn-download" data-soft-download="${a.id}">Скачать .EXE</button>`;
      }
      return `<span class="store98-card-price">${a.price}</span><br><button class="win-btn store98-btn-buy" data-soft-buy="${a.id}">Купить</button>`;
    };

    const shell = (crumb, body) => `
      <div class="store98-container">
        <table class="store98-header" cellspacing="0">
          <tr>
            <td class="store98-title"><a data-url="http://www.softstore98.com">${this.gif('disk', 2)}SoftStore<span>'98</span></a></td>
            <td class="store98-header-right">${this.gif('lock')} Защищённые заказы<br>Доставка по модему за минуты</td>
          </tr>
        </table>
        <div class="store98-info-bar">${crumb}</div>
        <table class="store98-layout" cellspacing="0">
          <tr>
            <td class="store98-side">
              <div class="store98-side-title">Разделы</div>
              ${categories.map(c => `<div>${this.gif('ball-blue')} ${c} (${apps.filter(a => a.category === c).length})</div>`).join('')}
              <div>${this.gif('ball-red')} <a data-url="http://www.steampowered.com">Игры &mdash; в Steam</a></div>
              <div class="store98-side-title">Оплата</div>
              <div class="store98-side-note">Visa, MasterCard.<br>Промокод <b>WIN98SE</b> &mdash; скидка $5!</div>
            </td>
            <td class="store98-main">${body}</td>
          </tr>
        </table>
        <div class="store98-footer">SoftStore '98 &middot; Все цены в долларах США &middot; Установщики сохраняются в &laquo;Мои документы\\Downloads&raquo; &middot; Отдел продаж: ${this.mailLink('orders@softstore98.com')}</div>
      </div>`;

    if (this.activeDetailItemId) {
      const a = apps.find(x => x.id === this.activeDetailItemId);
      const item = this.getDetailItemData(this.activeDetailItemId);
      if (a && item) {
        return shell(`<a data-url="http://www.softstore98.com">Каталог</a> &raquo; ${a.category} &raquo; <b>${a.title}</b>`, `
          <table class="store98-product" cellspacing="0">
            <tr>
              <td class="store98-product-icon">${Icons[a.icon] || Icons['folder']}</td>
              <td>
                <h2 class="store98-product-title">${a.title}</h2>
                <div class="store98-card-sub">${item.developer} &middot; ${item.genre}</div>
                <div class="store98-rating">Оценка покупателей: ${item.rating}</div>
                <p>${a.desc}</p>
              </td>
              <td class="store98-product-buy">${statusCell(a)}</td>
            </tr>
          </table>
          <h3 class="store98-h">Системные требования</h3>
          <table class="store98-spec-table" cellspacing="1">
            <tr><th>Процессор</th><td>${item.specs.cpu}</td></tr>
            <tr><th>Память</th><td>${item.specs.ram}</td></tr>
            <tr><th>Место на диске</th><td>${item.specs.disk}</td></tr>
            <tr><th>Видео</th><td>${item.specs.vga}</td></tr>
            <tr><th>Звук</th><td>${item.specs.audio}</td></tr>
          </table>
          <h3 class="store98-h">Пресса о программе</h3>
          <blockquote class="store98-review">${item.review}</blockquote>
          <p><a data-url="http://www.softstore98.com">&laquo; Вернуться в каталог</a></p>`);
      }
    }

    if (this.activeSoftStorePaymentId) {
      const a = apps.find(x => x.id === this.activeSoftStorePaymentId);
      const p = gm ? (gm.catalog[this.activeSoftStorePaymentId] || { title: a ? a.title : this.activeSoftStorePaymentId, price: 14.99 }) : { title: a ? a.title : this.activeSoftStorePaymentId, price: 14.99 };
      let finalPrice = p.price || 14.99;
      if (this.promoCodeApplied) finalPrice = Math.max(0.99, finalPrice - 5.00);
      return shell(`<a data-url="http://www.softstore98.com">Каталог</a> &raquo; <b>Оформление заказа</b>`, `
        <h2 class="store98-h2">${this.gif('lock')} Защищённый бланк заказа</h2>
        <table class="store98-spec-table store98-order-table" cellspacing="1">
          <tr><th>Программа</th><td><b>${p.title}</b></td></tr>
          <tr><th>К оплате</th><td><span class="store98-card-price">$${finalPrice.toFixed(2)}</span> ${this.promoCodeApplied ? '<span class="store98-owned">(скидка $5 по промокоду)</span>' : ''}</td></tr>
          <tr><th>Промокод</th><td><input type="text" id="soft_promo_input" size="14"> <button class="win-btn" id="btn-soft-promo" type="button">Применить</button> <span id="soft-promo-msg" class="store98-owned">${this.promoCodeApplied ? 'Промокод принят.' : ''}</span></td></tr>
          <tr><th>Номер карты</th><td><input type="text" id="softpay_num" size="22" maxlength="19"></td></tr>
          <tr><th>Действует до</th><td><input type="text" id="softpay_exp" size="5" maxlength="5"> ММ/ГГ</td></tr>
          <tr><th>CVV</th><td><input type="password" id="softpay_cvv" size="4" maxlength="3"></td></tr>
          <tr><th>Имя на карте</th><td><input type="text" id="softpay_name" size="26"></td></tr>
        </table>
        <p class="store98-note">Реквизиты карты лежат в файле &laquo;Банковская карта и сайты.txt&raquo; в папке &laquo;Мои документы&raquo;. <button class="win-btn" id="btn-soft-autofill">Вставить из файла</button></p>
        <p id="softpay-status-msg" class="store98-status"></p>
        <p><button class="win-btn store98-btn-main" id="btn-softpay-submit">Оплатить заказ</button> <button class="win-btn" id="btn-softpay-cancel">Отмена</button></p>`);
    }

    return shell(`Добро пожаловать! Сегодня в каталоге <b>${apps.length}</b> программ. Игры продаются в <a data-url="http://www.steampowered.com">Steam</a>.`, `
      <table class="store98-card-grid" cellspacing="0">
        ${apps.map(a => `
        <tr class="store98-card">
          <td class="store98-card-icon">${Icons[a.icon] || Icons['folder']}</td>
          <td class="store98-card-details">
            <a class="store98-card-title" data-soft-detail="${a.id}">${a.title}</a> ${a.badge ? `<span class="web-new">${a.badge}</span>` : ''}<br>
            <span class="store98-card-sub">${a.vendor} &middot; ${a.category}</span><br>
            <span class="store98-card-desc">${a.desc}</span>
          </td>
          <td class="store98-card-action">${statusCell(a)}</td>
        </tr>`).join('')}
      </table>
      <h3 class="store98-h">Как купить программу</h3>
      <ol class="store98-howto">
        <li>Нажмите &laquo;Купить&raquo; и введите промокод <b>WIN98SE</b>.</li>
        <li>Реквизиты карты возьмите из &laquo;Моих документов&raquo;.</li>
        <li>После оплаты нажмите &laquo;Скачать .EXE&raquo; и запустите установщик.</li>
      </ol>`);
  }

  attachSoftStoreEvents(win, container) {
    const gm = window.gameManager;

    container.querySelectorAll('[data-soft-launch]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.softLaunch;
        if (id === 'videoplayer' && window.appVideoPlayer) window.appVideoPlayer.open();
        else if (id === 'photoshop' && window.appPhotoshop) window.appPhotoshop.open();
        else if (id === 'wincommander' && window.appWinCommander) window.appWinCommander.open();
        else if (id === 'winamp' && window.appWinamp) window.appWinamp.open();
        else if (id === 'avp' && window.appAVP) window.appAVP.open();
        else if (id === 'winzip' || id === 'retroav') {
          window.winManager.openDialog({
            title: 'SoftStore 98',
            icon: 'info',
            message: `Утилита <b>${id.toUpperCase()}</b> успешно запущена и работает в фоновом режиме.`
          });
        }
        else if (gm && gm.catalog[id]) gm.catalog[id].launch();
      });
    });

    const saveInstaller = (id) => {
      if (gm && gm.catalog[id]) {
        gm.startDownload(id);
        return;
      }
      if (window.vfs) {
        window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Downloads'], `Setup_${id}.exe`, `[Setup installer for ${id}]`);
      }
      window.winManager.openDialog({
        title: 'Загрузка через модем 56K',
        icon: 'info',
        message: `Файл <b>Setup_${id}.exe</b> успешно сохранен в папку «Мои документы\\Downloads»!`
      });
    };

    container.querySelectorAll('[data-soft-download]').forEach(btn => {
      btn.addEventListener('click', () => saveInstaller(btn.dataset.softDownload));
    });

    container.querySelectorAll('[data-soft-buy]').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(win, `http://www.softstore98.com/order?id=${btn.dataset.softBuy}`));
    });

    container.querySelectorAll('[data-soft-detail]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.soundSys) window.soundSys.playClick();
        this.navigate(win, `http://www.softstore98.com/product?id=${link.dataset.softDetail}`);
      });
    });

    const btnPay = container.querySelector('#btn-softpay-submit');
    if (!btnPay) return;

    const statusMsg = container.querySelector('#softpay-status-msg');
    const numInput = container.querySelector('#softpay_num');
    const expInput = container.querySelector('#softpay_exp');
    const cvvInput = container.querySelector('#softpay_cvv');
    const nameInput = container.querySelector('#softpay_name');
    const promoInput = container.querySelector('#soft_promo_input');
    const promoMsg = container.querySelector('#soft-promo-msg');
    const setStatus = (text, color) => {
      statusMsg.textContent = text;
      statusMsg.style.color = color;
    };

    container.querySelector('#btn-soft-promo').addEventListener('click', () => {
      const val = promoInput.value.trim().toUpperCase();
      if (val === 'WIN98SE' || val === 'CYBER1998') {
        this.promoCodeApplied = true;
        if (window.soundSys) window.soundSys.playDing();
        this.renderPage(win, this.currentUrl);
      } else {
        promoMsg.textContent = 'Неверный промокод. Попробуйте WIN98SE';
        promoMsg.style.color = '#cc0000';
        if (window.soundSys) window.soundSys.playError();
      }
    });

    container.querySelector('#btn-softpay-cancel').addEventListener('click', () => this.navigate(win, 'http://www.softstore98.com'));

    container.querySelector('#btn-soft-autofill').addEventListener('click', () => {
      numInput.value = '4276 3800 1998 2024';
      expInput.value = '12/28';
      cvvInput.value = '777';
      nameInput.value = 'RETRO USER';
      setStatus('Реквизиты вставлены из «Моих документов».', '#008000');
    });

    btnPay.addEventListener('click', () => {
      const num = numInput.value.replace(/\s+/g, '');
      const exp = expInput.value.trim();
      const cvv = cvvInput.value.trim();
      const name = nameInput.value.trim();

      if (num.length < 16) {
        setStatus('Ошибка: введите 16-значный номер карты.', '#cc0000');
        if (window.soundSys) window.soundSys.playError();
        return;
      }
      if (cvv.length < 3) {
        setStatus('Ошибка: введите 3-значный CVV код.', '#cc0000');
        if (window.soundSys) window.soundSys.playError();
        return;
      }

      btnPay.disabled = true;
      setStatus('Связываемся с банком через модем 56K...', '#000080');
      const appId = this.activeSoftStorePaymentId;

      setTimeout(() => {
        setStatus('Оплата одобрена. Оформляем лицензию...', '#000080');
        setTimeout(() => {
          if (window.soundSys) window.soundSys.playDing();
          if (gm && gm.catalog[appId]) gm.purchaseGame(appId, { num, exp, cvv, name });
          this.navigate(win, 'http://www.softstore98.com');
          window.winManager.openDialog({
            title: 'Покупка успешно завершена!',
            icon: 'info',
            message: 'Лицензия на программу успешно активирована!<br>Нажмите кнопку ниже для загрузки установщика в папку «Мои документы\\Downloads».',
            buttons: [
              { text: 'Скачать установщик (.EXE)', bold: true, action: () => saveInstaller(appId) },
              { text: 'Позже' }
            ]
          });
        }, 700);
      }, 600);
    });
  }

  getNewsArticles() {
    return [
      {
        id: 1,
        title: 'Win 98 Second Edition: новая эра для персональных компьютеров',
        date: '03 сентября 1998',
        author: 'Алекс Компьютерман',
        snippet: 'Корпорация Microslop представила обновленную операционную систему Win 98. Улучшенная поддержка шины USB, оптимизация виртуальной памяти и новый Internet Explorer 5.0 делают ее абсолютным лидером рынка.',
        body: `
          <p>Корпорация Microslop официально представила миру операционную систему Win 98 Second Edition. Новая версия вобрала в себя сотни исправлений, полноценную поддержку универсальной последовательной шины USB, встроенный стек протоколов TCP/IP для модемного интернета и новый веб-браузер Internet Explorer 5.0.</p>
          <p>«Мы создали операционную систему, которая стирает грань между локальным компьютером и глобальной паутиной Интернет», — заявили представители компании на презентации в Редмонде.</p>
          <p>Геймеры и энтузиасты отмечают значительный прирост быстродействия в мультимедийных приложениях и играх благодаря новейшему графическому интерфейсу DirectX 6.0.</p>
        `
      },
      {
        id: 2,
        title: 'Прорыв в онлайн-торговле: Valve запускает сервис цифровых игр Steam',
        date: '01 сентября 1998',
        author: 'Мария Сетевая',
        snippet: 'Теперь геймерам больше не обязательно стоять в очередях за компакт-дисками в киосках. Клиент Steam позволяет купить игру по банковской карте и загрузить её прямо по модему.',
        body: `
          <p>Компания Valve открыла Steam — программу для покупки и загрузки компьютерных игр через Интернет (адрес: http://www.steampowered.com).</p>
          <p>Пользователь устанавливает небольшой клиент, выбирает игру из каталога — будь то Wolfenstein 3D, пиратский квест LucasQuest 98 или загадочный S.T.A.L.K.E.R. — вводит данные кредитной карты, и Steam сам загружает и устанавливает игру.</p>
          <p>«Цифровая дистрибуция — это будущее игровой индустрии», — отмечают эксперты рынка.</p>
        `
      },
      {
        id: 3,
        title: 'Революция 3D-графики: как чипсет Voodoo 2 от 3dfx меняет правила игры',
        date: '28 августа 1998',
        author: 'Дмитрий Пиксель',
        snippet: 'Появление ускорителей 3dfx Voodoo 2 ознаменовало закат эпохи плоской пиксельной графики. Разрешение 800x600 при 60 кадрах в секунду стало новой реальностью.',
        body: `
          <p>Компания 3dfx Interactive совершила настоящий переворот на рынке графических адаптеров, выпустив чипсет Voodoo 2. Благодаря собственной библиотеке Glide API, трёхмерные миры обрели невиданную ранее глубину, фильтрацию текстур и плавность движения.</p>
          <p>Энтузиасты на портале 3dfx Voodoo Zone (http://www.3dfx-zone.com) уже публикуют инструкции по связке двух видеокарт в режим SLI и замеряют невиданный FPS в Quake II.</p>
        `
      },
      {
        id: 4,
        title: 'Загадочные отчеты из Чернобыля: исследователи столкнулись с гравитационными аномалиями',
        date: '24 августа 1998',
        author: 'Специальный корреспондент',
        snippet: 'Научная экспедиция в окрестностях Чернобыльской АЭС зафиксировала необъяснимые физические феномены и световые вспышки.',
        body: `
          <p>Из зоны вокруг Чернобыльской атомной электростанции поступают тревожные и интригующие известия. Исследовательские группы сообщают о возникновении локальных гравитационных возмущений и обнаружении минералов с необычными свойствами.</p>
          <p>По мотивам этих событий студия GSC уже подготовила интерактивную игру S.T.A.L.K.E.R., доступную в Steam.</p>
        `
      },
      {
        id: 5,
        title: 'Состоялся релиз Half-Life: интерактивный триллер от студии Valve',
        date: '19 ноября 1998',
        author: 'Дмитрий Пиксель',
        snippet: 'Студия Valve и издатель Sierra Studios совершили революцию: Half-Life доказал, что трехмерный шутер может иметь глубокий сюжет без единой кинематографической вставки.',
        body: `
          <p>19 ноября мир ПК-игр навсегда изменился: дебютная работа никому не известной команды Valve под руководством Гейба Ньюэлла установила новый золотой стандарт для видеоигр.</p>
          <p>Игрок в роли физика-теоретика Гордона Фримена оказывается в эпицентре катастрофического каскадного резонанса в исследовательском комплексе «Чёрная Меза». Сражения с пришельцами из параллельного мира Зен и правительственным спецназом HECU разворачиваются непрерывно прямо на глазах игрока.</p>
          <p>Критики ведущих журналов PC Gamer и Game.EXE выставили игре высшие баллы — 96% из 100.</p>
        `
      },
      {
        id: 6,
        title: 'Битва за MP3: ассоциация звукозаписи RIAA подала иск против плеера Diamond Rio PMP300',
        date: '16 октября 1998',
        author: 'Игорь Сетевой',
        snippet: 'Музыкальная индустрия в панике: появление портативных цифровых плееров с флеш-памятью 32 МБ и форматом MP3 ставит под угрозу традиционную продажу аудиокассет и компакт-дисков.',
        body: `
          <p>Американская ассоциация звукозаписывающих компаний (RIAA) обратилась в федеральный суд с требованием запретить продажи портативного MP3-плеера Diamond Rio PMP300, обвиняя компанию Diamond Multimedia в пособничестве пиратству.</p>
          <p>Между тем пользователи интернета массово переходят на цифровое сжатие музыки MPEG-1 Layer 3. В Сети открылся крупнейший каталог цифровых композиций MP3 Vault 98 (адрес: http://www.mp3vault98.com), позволяющий бесплатно скачивать треки The Prodigy, Fatboy Slim и The Offspring прямо на ПК и воспроизводить их через плеер Winamp.</p>
        `
      },
      {
        id: 7,
        title: 'Проблема 2000 года (Y2K): угрожает ли цифровой апокалипсис компьютерам?',
        date: '10 октября 1998',
        author: 'Сергей Системный',
        snippet: 'Двузначное представление года в старых базах данных и BIOS грозит вызвать глобальный сбой на серверах и банкоматах в полночь 1 января 2000 года. Microslop заявляет о безопасности Win 98.',
        body: `
          <p>Приближение третьего тысячелетия вызывает растущее беспокойство среди мировых ИТ-экспертов. Из-за исторической экономии памяти многие программы обрабатывают год как две последние цифры (например «98»), и с наступлением 2000 года могут ошибочно определить время как 1900 год.</p>
          <p>Представители корпорации Microslop официально заверили пользователей: «Операционная система Win 98 Second Edition полностью совместима с исчислением XXI века (Y2K Compliant)». Пользователям рекомендовано установить официальные пакеты обновлений с портала Microslop (http://www.microslop.com).</p>
        `
      },
      {
        id: 8,
        title: 'Российский интернет после дефолта: бум новых веб-ресурсов и чатов',
        date: '15 сентября 1998',
        author: 'Анна Рунетова',
        snippet: 'Несмотря на финансовый кризис августа 1998 года и скачок доллара до 20 рублей, аудитория российского сегмента Сети стремительно растет.',
        body: `
          <p>После событий «черного понедельника» в августе 1998 года, когда курс доллара подскочил с 6.20 руб. до 20.80 руб., пользователи в поисках оперативной информации заполнили электронные узлы связи.</p>
          <p>Особую популярность приобрели поисковая машина Рамблер (http://www.rambler98.ru) со сводками погоды и котировками валют, юмористический портал Дмитрия Вернера Anekdot.ru (http://www.anekdot98.ru) и главный ночной чат страны «Кроватка '98» (http://chat.krovatka98.ru), где одновременно собираются тысячи русскоязычных пользователей.</p>
        `
      }
    ];
  }

  getNewsComments(articleId) {
    try {
      const data = localStorage.getItem(`${this.newsCommentsKey}_${articleId}`);
      if (data) return JSON.parse(data);
    } catch (e) {}

    const defaults = {
      1: [
        { author: 'DialUp_Guy', date: '03.09.1998 15:10', text: 'Поставил Win 98 SE на свой Pentium 166 MMX — работает намного стабильнее первой редакции! И модем US Robotics перестал отваливаться.' },
        { author: 'WinFanatic', date: '04.09.1998 11:20', text: 'Поддержка USB это будущее. Скоро все мышки и клавиатуры перейдут на этот стандарт.' }
      ],
      5: [
        { author: 'BlackMesaScientist', date: '20.11.1998 14:00', text: 'Сцена в вагонетке монорельса в самом начале погружает в игру на 100%! Никаких роликов, ты сам ходишь и смотришь. 10 из 10.' },
        { author: 'CrowbarMaster', date: '21.11.1998 09:30', text: 'Умный ИИ спецназовцев это что-то с чем-то: они бросают гранаты и обходят с флангов!' }
      ],
      6: [
        { author: 'MusicLover98', date: '17.10.1998 18:45', text: 'RIAA не сможет остановить MP3. Я скачал альбом Fatboy Slim с сайта MP3 Vault 98 всего за 40 минут по модему и слушаю в Winamp без всяких CD!' }
      ]
    };

    return defaults[articleId] || [
      { author: 'Сетевой Читатель', date: '12.10.1998 16:30', text: 'Отличная статья! Cyberspace Times как всегда на передовой цифровых событий.' }
    ];
  }

  saveNewsComments(articleId, comments) {
    try {
      localStorage.setItem(`${this.newsCommentsKey}_${articleId}`, JSON.stringify(comments));
    } catch (e) {}
  }

  renderNews(url = '') {
    const articles = this.getNewsArticles();
    const idMatch = /article\?id=(\d+)/.exec((url || '').toLowerCase());
    this.activeNewsArticleId = idMatch ? parseInt(idMatch[1], 10) : null;
    const sections = [['Компьютеры', 1], ['Интернет', 2], ['Железо', 3], ['Игры', 5], ['Музыка', 6], ['Проблема 2000', 7], ['Россия', 8], ['Загадки', 4]];

    const masthead = `
      <div class="news98-newspaper-header">
        <div class="news98-masthead">Cyberspace Times</div>
        <table class="news98-edition-row" cellspacing="0">
          <tr>
            <td>Электронная газета Сети</td>
            <td class="news98-center">Четверг, 12 ноября 1998 г. &middot; № 42</td>
            <td class="news98-right">Москва: +8&deg;C, облачно</td>
          </tr>
        </table>
      </div>`;

    const art = this.activeNewsArticleId ? articles.find(a => a.id === this.activeNewsArticleId) : null;
    if (art) {
      const comments = this.getNewsComments(art.id);
      return `
        <div class="news98-container">
          <div class="news98-page">
            ${masthead}
            <p class="news98-back"><a href="#" id="btn-news-back">&laquo; На первую полосу</a></p>
            <div class="news98-article">
              <h1 class="news98-article-title">${art.title}</h1>
              <p class="news98-byline">${art.author} &middot; ${art.date}</p>
              <p class="news98-lede">${art.snippet}</p>
              <div class="news98-article-body">${art.body}</div>

              <h3 class="news98-comments-title">Отклики читателей (${comments.length})</h3>
              <div class="news98-comments-list">
                ${comments.map(c => `
                <div class="news98-comment-item">
                  <div class="news98-comment-meta">${this.gif('user')} <b>${this.escapeHtml(c.author)}</b>, ${c.date}</div>
                  <div>${this.escapeHtml(c.text)}</div>
                </div>`).join('')}
              </div>
              <div class="news98-comments-box">
                <b>Написать отклик</b><br>
                Имя: <input type="text" id="news-comment-author" value="Читатель '98" size="24"><br>
                <textarea id="news-comment-text" rows="4" cols="60"></textarea><br>
                <button class="win-btn" id="btn-news-comment-submit">Отправить</button>
              </div>
              <p class="news98-see-also">Смотрите также: <a data-url="http://www.steampowered.com">Steam</a> | <a data-url="http://forum.games98.com">Форум GamerZone</a> | <a data-url="http://www.mp3vault98.com">MP3 Vault '98</a></p>
            </div>
          </div>
        </div>
      `;
    }

    const lead = articles[0];
    const rest = articles.slice(1);
    const userPollVote = localStorage.getItem(this.newsPollStorageKey);
    const pollRows = [['Half-Life', 46], ['StarCraft', 29], ['Fallout 2', 16], ['Wolfenstein 3D', 9]];
    const pollHTML = userPollVote ? `
      <div class="news98-poll-box">
        <div class="news98-poll-title">Итоги опроса</div>
        <p><b>Главная игра 1998 года?</b></p>
        <table class="news98-poll-table" cellspacing="0">
          ${pollRows.map(([name, pct]) => `
          <tr><td>${name}</td><td class="news98-poll-pct">${pct}%</td></tr>
          <tr><td colspan="2"><div class="news98-poll-bar-fill" style="width:${pct}%"></div></td></tr>`).join('')}
        </table>
        <p class="news98-poll-done">${this.gif('check')} Ваш голос учтён. Всего: 1&nbsp;842</p>
      </div>` : `
      <div class="news98-poll-box">
        <div class="news98-poll-title">Опрос</div>
        <p><b>Какая игра 1998 года лучшая?</b></p>
        <label><input type="radio" name="news_poll" value="hl" checked> Half-Life</label><br>
        <label><input type="radio" name="news_poll" value="sc"> StarCraft</label><br>
        <label><input type="radio" name="news_poll" value="fo"> Fallout 2</label><br>
        <label><input type="radio" name="news_poll" value="wolf"> Wolfenstein 3D</label><br>
        <button class="win-btn" id="btn-news-poll-vote">Голосовать</button>
      </div>`;

    return `
      <div class="news98-container">
        <div class="news98-page">
          ${masthead}
          <marquee class="news98-ticker" scrollamount="4">СРОЧНО: Valve выпустила Half-Life &nbsp;&bull;&nbsp; RIAA судится с создателями плеера Diamond Rio &nbsp;&bull;&nbsp; Steam: игры по кредитной карте &nbsp;&bull;&nbsp; Проблема 2000 года: Win 98 SE безопасна</marquee>
          <table class="news98-layout" cellspacing="0">
            <tr>
              <td class="news98-nav-col">
                <div class="news98-nav-head">Рубрики</div>
                ${sections.map(([name, id]) => `<a data-article-id="${id}">${name}</a>`).join('')}
                <div class="news98-nav-note">Подписка на рассылку &mdash; бесплатно!</div>
              </td>
              <td class="news98-main-col">
                <div class="news98-lead-card">
                  <a class="news98-lead-headline" data-article-id="${lead.id}">${lead.title}</a>
                  <p class="news98-byline">${lead.author} &middot; ${lead.date}</p>
                  <p class="news98-snippet">${lead.snippet} <a data-article-id="${lead.id}">Полный текст &raquo;</a></p>
                </div>
                <div class="news98-also">Также в выпуске</div>
                <ul class="news98-also-list">
                  <li><a data-article-id="5">Обзор Half-Life: почему Гордон Фримен покорил весь мир</a></li>
                  <li><a data-article-id="6">Война форматов: RIAA против свободного MP3</a></li>
                  <li><a data-article-id="7">Y2K: как пережить наступление 2000 года</a></li>
                  <li><a data-article-id="8">Посещаемость Рунета удвоилась: Рамблер, Кроватка и Анекдоты</a></li>
                </ul>
              </td>
              <td class="news98-side-col">
                <div class="news98-side-head">Лента событий</div>
                ${rest.map(a => `
                <div class="news98-side-item">
                  <a class="news98-side-title" data-article-id="${a.id}">${a.title}</a>
                  <div class="news98-side-date">${a.date}</div>
                </div>`).join('')}
                ${pollHTML}
              </td>
            </tr>
          </table>
          <div class="news98-footer">&copy; 1998 Cyberspace Times Online. Перепечатка только со ссылкой на источник. Письма в редакцию: ${this.mailLink('editor@retro-news98.com')}</div>
        </div>
      </div>
    `;
  }

  attachNewsEvents(win, container) {
    const btnBack = container.querySelector('#btn-news-back');
    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(win, 'http://www.retro-news98.com');
      });
    }

    container.querySelectorAll('[data-article-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(win, `http://www.retro-news98.com/article?id=${parseInt(el.dataset.articleId, 10)}`);
      });
    });

    const btnPoll = container.querySelector('#btn-news-poll-vote');
    if (btnPoll) {
      btnPoll.addEventListener('click', () => {
        const checked = container.querySelector('input[name="news_poll"]:checked');
        localStorage.setItem(this.newsPollStorageKey, checked ? checked.value : 'hl');
        if (window.soundSys) window.soundSys.playDing();
        this.renderPage(win, this.currentUrl);
      });
    }

    const btnComment = container.querySelector('#btn-news-comment-submit');
    if (btnComment && this.activeNewsArticleId) {
      btnComment.addEventListener('click', () => {
        const author = container.querySelector('#news-comment-author').value.trim() || 'Гость';
        const text = container.querySelector('#news-comment-text').value.trim();
        if (!text) return;

        const comments = this.getNewsComments(this.activeNewsArticleId);
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.1998 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        comments.push({ author, date: dateStr, text });
        this.saveNewsComments(this.activeNewsArticleId, comments);

        if (window.soundSys) window.soundSys.playDing();
        this.renderPage(win, this.currentUrl);
      });
    }
  }

  renderMicroslopPage(url) {
    const clean = url.toLowerCase();
    if (clean.includes('/programs')) {
      this.msftActiveTab = 'programs';
      this.activeMsftThreadId = null;
    } else if (clean.includes('/commands') || clean.includes('/run')) {
      this.msftActiveTab = 'commands';
      this.activeMsftThreadId = null;
    } else if (clean.includes('/forum')) {
      this.msftActiveTab = 'forum';
      if (clean.includes('board=en')) this.msftForumBoard = 'en';
      if (clean.includes('board=ru')) this.msftForumBoard = 'ru';
      this.activeMsftThreadId = null;
      if (clean.includes('thread=')) {
        const parts = url.split('thread=')[1];
        if (parts) this.activeMsftThreadId = parts.split('&')[0];
      }
    } else {
      this.msftActiveTab = 'home';
      this.activeMsftThreadId = null;
    }

    const isRu = this.msftUiLang === 'ru';
    const activeTab = this.msftActiveTab || 'home';
    const tabs = [
      ['home', isRu ? 'Главная' : 'Home'],
      ['programs', isRu ? 'Каталог программ' : 'Software Catalog'],
      ['commands', isRu ? 'Справочник команд' : 'Commands Reference'],
      ['forum', isRu ? 'Форум поддержки' : 'Support Forum']
    ];
    const crumb = tabs.find(([id]) => id === activeTab)[1];

    return `
      <div class="msft-portal">
        <table class="msft-topbar" cellspacing="0">
          <tr>
            <td class="msft-topbar-logo"><a data-msft-tab="home">Microslop<sup>&reg;</sup></a></td>
            <td class="msft-topbar-links">
              <a data-msft-tab="programs">${isRu ? 'Все продукты' : 'All Products'}</a> |
              <a data-msft-tab="forum">${isRu ? 'Поддержка' : 'Support'}</a> |
              <a data-url="http://www.search98.com">${isRu ? 'Поиск' : 'Search'}</a> |
              <a data-msft-tab="commands">${isRu ? 'Путеводитель' : 'Guide'}</a>
            </td>
            <td class="msft-topbar-lang"><a id="msft-lang-toggle" title="${isRu ? 'Switch to English' : 'Переключить на русский'}">${isRu ? 'English' : 'Русский'}</a></td>
          </tr>
        </table>
        <div class="msft-slogan">${isRu ? 'Где вы хотите оказаться сегодня?' : 'Where do you want to go today?'}<sup>&reg;</sup></div>
        <table class="msft-layout" cellspacing="0">
          <tr>
            <td class="msft-leftnav">
              ${tabs.map(([id, label]) => `<a class="msft-tab-item ${activeTab === id ? 'active' : ''}" data-msft-tab="${id}">${label}</a>`).join('')}
              <div class="msft-leftnav-box">
                <b>Win 98</b><br>${isRu ? 'Операционная система для Интернета' : 'The operating system for the Internet'}<br>
                <a data-msft-tab="programs">${isRu ? 'Подробнее' : 'Learn more'}</a>
              </div>
              <div class="msft-leftnav-small">
                <a data-url="http://www.softstore98.com">SoftStore</a><br>
                <a data-url="http://www.y2k-countdown.org">${isRu ? 'Проблема 2000' : 'Year 2000'}</a><br>
                <a data-url="http://www.antivirus98.com">${isRu ? 'Безопасность' : 'Security'}</a>
              </div>
            </td>
            <td class="msft-main">
              <div class="msft-subbar">microslop.com &gt; Win 98 &gt; <b>${crumb}</b></div>
              <div class="msft-body-content">
                ${activeTab === 'home' ? this.renderMicroslopHome(isRu) :
                  activeTab === 'programs' ? this.renderMicroslopPrograms(isRu) :
                  activeTab === 'commands' ? this.renderMicroslopCommands(isRu) :
                  this.renderMicroslopForum(isRu)}
              </div>
            </td>
          </tr>
        </table>
        <div class="msft-footer">
          ${tabs.map(([id, label]) => `<a data-msft-tab="${id}">${label}</a>`).join(' | ')}<br>
          &copy; 1998 Microslop Corporation. ${isRu ? 'Все права защищены.' : 'All rights reserved.'} ${isRu ? 'Лучше всего смотреть в Internet Explorer 5.0.' : 'Best viewed with Internet Explorer 5.0.'}<br>
          ${isRu ? 'Техническая поддержка' : 'Technical support'}: ${this.mailLink('support@microslop.com')}
        </div>
      </div>
    `;
  }

  renderMicroslopHome(isRu) {
    const news = [
      ['25.06.1998', isRu ? 'Мировой старт продаж Win 98' : 'Win 98 launches worldwide', isRu ? 'Более 12 000 магазинов в 40 странах.' : 'Over 12,000 stores in 40 countries.'],
      ['18.08.1998', isRu ? 'Вышел Visual Studio 6.0' : 'Visual Studio 6.0 released', isRu ? 'Visual Basic 6.0, Visual C++ 6.0 и Visual InterDev.' : 'Visual Basic 6.0, Visual C++ 6.0 and Visual InterDev.'],
      ['15.09.1998', isRu ? 'Запущен Win Update' : 'Win Update goes live', isRu ? 'Драйверы и исправления прямо из Сети.' : 'Drivers and patches straight from the Web.'],
      ['22.10.1998', isRu ? 'Рекордный квартал' : 'Record quarter', isRu ? 'Выручка $3.95 млрд.' : 'Revenue of $3.95 billion.'],
      ['12.11.1998', isRu ? 'Первый взгляд на Office 2000' : 'First look at Office 2000', isRu ? 'HTML-документы и новые меню.' : 'HTML documents and new menus.']
    ];
    const tech = [
      ['globe', isRu ? 'Веб-интеграция' : 'Web integration', isRu ? 'Internet Explorer 5.0, каналы на рабочем столе и папки в виде веб-страниц.' : 'Internet Explorer 5.0, desktop channels and Web-style folders.'],
      ['pc', 'USB', isRu ? 'Мыши, джойстики и сканеры подключаются без перезагрузки.' : 'Mice, joysticks and scanners connect without a restart.'],
      ['disk', 'FAT32', isRu ? 'Кластеры по 4 КБ экономят до 28% диска, разделы больше 2 ГБ.' : '4 KB clusters save up to 28% of disk space, partitions over 2 GB.'],
      ['tv', isRu ? 'Несколько мониторов' : 'Multiple monitors', isRu ? 'До 9 видеоадаптеров одновременно.' : 'Up to 9 display adapters at once.'],
      ['tools', isRu ? 'Надёжность' : 'Reliability', isRu ? 'Мастер обслуживания, ScanDisk, дефрагментация и ACPI.' : 'Maintenance Wizard, ScanDisk, Defragmenter and ACPI.'],
      ['joy', 'DirectX 6.1', isRu ? 'Direct3D, DirectSound, Сапёр, Косынка и 3D Pinball.' : 'Direct3D, DirectSound, Minesweeper, Solitaire and 3D Pinball.']
    ];
    const products = [
      [isRu ? 'Операционные системы' : 'Operating systems', ['Win 98 Second Edition', 'Win NT 4.0 Workstation', 'Win NT 4.0 Server', 'Win 95 OSR 2.5']],
      [isRu ? 'Офис' : 'Office', ['Office 97 Professional', 'Office 2000 Preview', 'FrontPage 98', 'Outlook 98']],
      [isRu ? 'Разработчикам' : 'Developers', ['Visual Studio 6.0', 'Visual C++ 6.0 и VB 6.0', 'MSDN Library 1998', 'DirectX 6.1 SDK']],
      [isRu ? 'Поддержка' : 'Support', ['Win Update', 'Knowledge Base', isRu ? 'Драйверы DirectX' : 'DirectX drivers', isRu ? 'Центр Y2K' : 'Y2K center']]
    ];
    const specs = [
      [isRu ? 'Операционная система' : 'Operating system', 'Microslop Win 98 Second Edition (4.10.2222 A)'],
      [isRu ? 'Обозреватель' : 'Browser', 'Microslop Internet Explorer 5.0'],
      [isRu ? '3D-графика' : '3D graphics', 'DirectX 6.1 Direct3D'],
      [isRu ? 'Файловая система' : 'File system', isRu ? 'FAT32, диски C: и D:' : 'FAT32, drives C: and D:'],
      [isRu ? 'Звук' : 'Sound', 'Sound Blaster Pro, sndvol32'],
      [isRu ? 'Оболочка' : 'Shell', isRu ? 'Панель задач и Диспетчер задач (Ctrl+Alt+Del)' : 'Taskbar and Task Manager (Ctrl+Alt+Del)']
    ];
    return `
      <table class="msft-main-showcase" cellspacing="0">
        <tr>
          <td class="msft-lead-story">
            <div class="msft-lead-tag">${isRu ? 'Главное' : 'Feature story'}</div>
            <h1 class="msft-lead-title">${isRu ? 'Win 98: операционная система, созданная для Интернета' : 'Win 98: the operating system designed for the Internet'}</h1>
            <p class="msft-lead-sub">${isRu ? 'Билл Гейтс объявил о выходе Win 98 по всему миру' : 'Bill Gates announces worldwide availability of Win 98'}</p>
            <div class="msft-lead-content">
              <p>${isRu ? 'Корпорация Microslop выпустила <b>Win 98</b>. Система объединяет 32-разрядную производительность, удобный интерфейс и встроенный доступ к Всемирной Паутине.' : 'Microslop Corporation has released <b>Win 98</b>. It combines 32-bit performance, an easy interface and built-in access to the World Wide Web.'}</p>
              <p>${isRu ? '&laquo;С Win 98 работать в Сети так же просто, как открыть папку на своём диске&raquo;, &mdash; сказал Билл Гейтс.' : '"With Win 98, the Web is as easy to use as a folder on your own hard disk," said Bill Gates.'}</p>
            </div>
            <ul class="msft-lead-bullets">
              <li><b>${isRu ? 'Интернет' : 'Internet'}:</b> Internet Explorer 5.0, Outlook Express, Active Desktop.</li>
              <li><b>${isRu ? 'Оборудование' : 'Hardware'}:</b> ${isRu ? 'USB и IEEE 1394.' : 'USB and IEEE 1394.'}</li>
              <li><b>${isRu ? 'Диск' : 'Storage'}:</b> ${isRu ? 'FAT32 освобождает до 28% места.' : 'FAT32 recovers up to 28% of disk space.'}</li>
              <li><b>${isRu ? 'Мультимедиа' : 'Multimedia'}:</b> DirectX 6.1.</li>
            </ul>
            <p class="msft-lead-links">
              <a data-msft-tab="programs">${isRu ? 'Каталог программ' : 'Software catalog'}</a> &nbsp;|&nbsp;
              <a data-msft-tab="commands">${isRu ? 'Справочник команд' : 'Commands reference'}</a> &nbsp;|&nbsp;
              <a data-msft-tab="forum">${isRu ? 'Форум поддержки' : 'Support forum'}</a>
            </p>
          </td>
          <td class="msft-sidebar-news">
            <div class="msft-side-box-header">${isRu ? 'Новости Microslop' : 'Microslop news'}</div>
            ${news.map(([date, head, desc]) => `
            <div class="msft-news-item">
              <div class="msft-news-date">${date}</div>
              <div class="msft-news-headline">${head}</div>
              <div class="msft-news-desc">${desc}</div>
            </div>`).join('')}
          </td>
        </tr>
      </table>

      <h2 class="msft-h2">${isRu ? 'Что нового в Win 98' : "What's new in Win 98"}</h2>
      <table class="msft-tech-grid" cellspacing="0">
        ${[0, 2, 4].map(i => `
        <tr>
          ${tech.slice(i, i + 2).map(([icon, title, desc]) => `
          <td class="msft-tech-icon">${this.gif(icon)}</td>
          <td class="msft-tech-card"><div class="msft-tech-title">${title}</div><div class="msft-tech-desc">${desc}</div></td>`).join('')}
        </tr>`).join('')}
      </table>

      <h2 class="msft-h2">${isRu ? 'Продукты Microslop' : 'Microslop products'}</h2>
      <table class="msft-products-grid" cellspacing="0">
        <tr>${products.map(([title]) => `<th>${title}</th>`).join('')}</tr>
        <tr>${products.map(([, items]) => `<td><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul></td>`).join('')}</tr>
      </table>

      <h2 class="msft-h2">${isRu ? 'Ваш компьютер' : 'Your computer'}</h2>
      <table class="msft-table" cellspacing="1">
        ${specs.map(([key, value]) => `<tr><th>${key}</th><td>${value}</td></tr>`).join('')}
      </table>
    `;
  }

  renderMicroslopPrograms(isRu) {
    const progs = this.getMsftProgramsList();
    const currentCat = this.msftCategoryFilter || 'all';
    const filtered = currentCat === 'all' ? progs : progs.filter(p => p.category === currentCat);
    const countFor = (cat) => cat === 'all' ? progs.length : progs.filter(p => p.category === cat).length;
    const categories = [
      ['all', isRu ? 'Все' : 'All'],
      ['standard', isRu ? 'Стандартные' : 'Accessories'],
      ['system', isRu ? 'Служебные' : 'System Tools'],
      ['cpanel', isRu ? 'Панель управления' : 'Control Panel'],
      ['net', isRu ? 'Интернет и связь' : 'Internet'],
      ['media', isRu ? 'Мультимедиа' : 'Multimedia'],
      ['games', isRu ? 'Игры' : 'Games']
    ];

    return `
      <h1 class="msft-page-title">${isRu ? 'Каталог программ Win 98' : 'Win 98 software catalog'}</h1>
      <p class="msft-intro">${isRu ? 'Стандартные приложения, служебные программы и значки Панели управления, которые входят в Win 98. Запускайте их из меню &laquo;Пуск&raquo; или командой в окне &laquo;Выполнить&raquo; (Win+R).' : 'Accessories, system tools and Control Panel items that come with Win 98. Start them from the Start menu or type the command in the Run box (Win+R).'}</p>
      <p class="msft-catalog-filters">
        ${categories.map(([id, label]) => currentCat === id
          ? `<b class="msft-cat-filter-btn active" data-category="${id}">${label} (${countFor(id)})</b>`
          : `<a class="msft-cat-filter-btn" data-category="${id}">${label} (${countFor(id)})</a>`).join(' | ')}
      </p>
      <p class="msft-catalog-search">${isRu ? 'Найти по названию:' : 'Find by name:'} <input type="text" id="msft-prog-search" size="24"></p>
      <table class="msft-table msft-catalog-grid" id="msft-programs-grid" cellspacing="1">
        <tr>
          <th class="msft-prog-icon-box"></th>
          <th>${isRu ? 'Программа' : 'Program'}</th>
          <th>${isRu ? 'Описание' : 'Description'}</th>
          <th>${isRu ? 'Команда' : 'Command'}</th>
        </tr>
        ${filtered.map(p => {
          const iconSvg = (window.Icons && window.Icons[p.icon]) ? window.Icons[p.icon] : (window.Icons ? window.Icons['programs'] : '');
          const title = isRu ? p.nameRu : p.nameEn;
          const desc = isRu ? p.descRu : p.descEn;
          return `
        <tr class="msft-prog-card" data-prog-title="${title.toLowerCase()}" data-prog-exe="${p.exe.toLowerCase()}">
          <td class="msft-prog-icon-box">${iconSvg}</td>
          <td class="msft-prog-meta"><b class="msft-prog-name">${title}</b><br><span class="msft-prog-exe">${p.exe}</span></td>
          <td class="msft-prog-desc">${desc}</td>
          <td class="msft-prog-run-badge"><code>${p.runCmd}</code></td>
        </tr>`;
        }).join('')}
      </table>
    `;
  }

  renderMicroslopCommands(isRu) {
    const runRows = [
      ['notepad c:\\autoexec.bat', isRu ? 'Программа с параметром' : 'Program with a file', isRu ? 'Открывает Блокнот с указанным файлом.' : 'Opens Notepad with the given file.'],
      ['control desk.cpl', isRu ? 'Значок Панели управления' : 'Control Panel item', isRu ? 'Сразу открывает нужные свойства: экран, время, мышь, звук.' : 'Opens Display, Date/Time, Mouse or Sounds directly.'],
      ['http://www.microslop.com', isRu ? 'Адрес в Сети' : 'Web address', isRu ? 'Открывает страницу в Internet Explorer.' : 'Opens the page in Internet Explorer.'],
      ['c:\\windows', isRu ? 'Папка' : 'Folder', isRu ? 'Открывает папку в Проводнике.' : 'Opens the folder in Explorer.'],
      ['command', isRu ? 'Сеанс MS-DOS' : 'MS-DOS prompt', isRu ? 'Открывает командную строку.' : 'Opens a command prompt.']
    ];
    const dosRows = [
      ['DIR', 'DIR [диск:][путь] [/P] [/W]', isRu ? 'Список файлов и папок с размером и датой.' : 'Lists files and folders with sizes and dates.'],
      ['CD', 'CD [путь] | CD ..', isRu ? 'Сменить текущую папку.' : 'Changes the current folder.'],
      ['TYPE', 'TYPE [файл]', isRu ? 'Показать текстовый файл.' : 'Shows a text file.'],
      ['COPY', 'COPY [откуда] [куда]', isRu ? 'Скопировать файлы.' : 'Copies files.'],
      ['DEL', 'DEL [файл]', isRu ? 'Удалить файл.' : 'Deletes a file.'],
      ['CLS', 'CLS', isRu ? 'Очистить экран.' : 'Clears the screen.'],
      ['VER', 'VER', isRu ? 'Версия Win 98 [4.10.2222 A].' : 'Win 98 version [4.10.2222 A].'],
      ['HELP', 'HELP', isRu ? 'Список команд.' : 'Lists the commands.']
    ];
    const keys = [
      ['Win + R', isRu ? 'Окно &laquo;Выполнить&raquo;' : 'Run box'],
      ['Win + E', isRu ? 'Проводник (Мой компьютер)' : 'Explorer (My Computer)'],
      ['Win + D', isRu ? 'Свернуть все окна' : 'Minimize all windows'],
      ['Alt + Tab', isRu ? 'Переключение окон' : 'Switch windows'],
      ['Alt + F4', isRu ? 'Закрыть окно' : 'Close the window'],
      ['Ctrl + Esc', isRu ? 'Меню &laquo;Пуск&raquo;' : 'Start menu'],
      ['Ctrl + Alt + Del', isRu ? 'Диспетчер задач' : 'Task Manager']
    ];
    return `
      <h1 class="msft-page-title">${isRu ? 'Справочник команд' : 'Commands reference'}</h1>
      <p class="msft-intro">${isRu ? 'Чтобы открыть окно &laquo;Выполнить&raquo;, нажмите <b>Win+R</b> или выберите <b>Пуск &gt; Выполнить...</b> Введите имя программы, папку, адрес в Сети или команду MS-DOS и нажмите OK.' : 'To open the Run box, press <b>Win+R</b> or choose <b>Start &gt; Run...</b> Type a program, folder, Web address or MS-DOS command and click OK.'}</p>
      <h2 class="msft-h2">${isRu ? 'Окно &laquo;Выполнить&raquo;' : 'The Run box'}</h2>
      <table class="msft-table" cellspacing="1">
        <tr><th>${isRu ? 'Пример' : 'Example'}</th><th>${isRu ? 'Что это' : 'What it is'}</th><th>${isRu ? 'Что происходит' : 'What happens'}</th></tr>
        ${runRows.map(([cmd, what, result]) => `<tr><td><code>${cmd}</code></td><td>${what}</td><td>${result}</td></tr>`).join('')}
      </table>
      <h2 class="msft-h2">${isRu ? 'Команды MS-DOS' : 'MS-DOS commands'}</h2>
      <table class="msft-table" cellspacing="1">
        <tr><th>${isRu ? 'Команда' : 'Command'}</th><th>${isRu ? 'Синтаксис' : 'Syntax'}</th><th>${isRu ? 'Действие' : 'Action'}</th></tr>
        ${dosRows.map(([cmd, syntax, action]) => `<tr><td><b>${cmd}</b></td><td><code>${syntax}</code></td><td>${action}</td></tr>`).join('')}
      </table>
      <h2 class="msft-h2">${isRu ? 'Сочетания клавиш' : 'Keyboard shortcuts'}</h2>
      <table class="msft-table" cellspacing="1">
        ${keys.map(([combo, action]) => `<tr><td><b>${combo}</b></td><td>${action}</td></tr>`).join('')}
      </table>
    `;
  }

  renderMicroslopForum(isRu) {
    const threads = this.getMsftForumThreads();
    const activeBoard = this.msftForumBoard || 'ru';
    const boardThreads = threads.filter(t => t.lang === activeBoard);
    const boardName = (lang) => lang === 'ru' ? (isRu ? 'Русскоязычный раздел' : 'Russian board') : (isRu ? 'Англоязычный раздел' : 'English board');

    if (this.activeMsftThreadId) {
      const thread = threads.find(t => t.id === this.activeMsftThreadId);
      if (thread) {
        return `
          <p class="msft-forum-crumbs"><a id="btn-msft-forum-back">${boardName(thread.lang)}</a> &gt; ${thread.category}</p>
          <h1 class="msft-page-title">${this.gif('chat')} ${this.escapeHtml(thread.title)}</h1>
          <table class="msft-table msft-forum-posts" cellspacing="1">
            ${thread.posts.map((p, idx) => `
            <tr>
              <td class="msft-post-author-pane"><b>${this.escapeHtml(p.author)}</b><br><span>${p.rank || (isRu ? 'Участник' : 'Member')}</span></td>
              <td class="msft-post-text-pane"><div class="msft-post-card-header">${p.date} &middot; ${idx === 0 ? (isRu ? 'вопрос' : 'question') : (isRu ? 'ответ' : 'reply')}</div>${p.text}</td>
            </tr>`).join('')}
          </table>
          <div class="msft-reply-form">
            <b>${isRu ? 'Ответить' : 'Reply'}</b><br>
            ${isRu ? 'Имя:' : 'Name:'} <input type="text" id="msft-reply-author" value="${isRu ? 'Пользователь98' : 'Win98User'}" size="20"><br>
            <textarea id="msft-reply-text" rows="4" cols="60"></textarea><br>
            <button class="win-btn" id="btn-msft-reply-send">${isRu ? 'Отправить ответ' : 'Post reply'}</button>
          </div>
        `;
      }
    }

    const totalPostsCount = boardThreads.reduce((acc, t) => acc + t.posts.length, 0);
    return `
      <h1 class="msft-page-title">${isRu ? 'Форум поддержки Win 98' : 'Win 98 support forum'}</h1>
      <p class="msft-intro">${isRu ? 'Вопросы о системе, команды, настройка MSConfig, DirectX и игры. Выберите раздел:' : 'Questions about the system, commands, MSConfig, DirectX and games. Choose a board:'}</p>
      <p class="msft-forum-board-tabs">
        ${activeBoard === 'ru' ? `<b>${boardName('ru')}</b>` : `<a id="btn-board-ru">${boardName('ru')}</a>`} (${threads.filter(t => t.lang === 'ru').length}) |
        ${activeBoard === 'en' ? `<b>${boardName('en')}</b>` : `<a id="btn-board-en">${boardName('en')}</a>`} (${threads.filter(t => t.lang === 'en').length})
      </p>
      <table class="msft-forum-bar" cellspacing="0">
        <tr>
          <td>${isRu ? `Тем: <b>${boardThreads.length}</b>, сообщений: <b>${totalPostsCount}</b>, на сайте: <b>184</b>` : `Topics: <b>${boardThreads.length}</b>, posts: <b>${totalPostsCount}</b>, online: <b>184</b>`}</td>
          <td class="msft-forum-bar-right"><button class="win-btn" id="btn-msft-new-thread">${isRu ? 'Новая тема' : 'New topic'}</button></td>
        </tr>
      </table>
      <div id="msft-new-topic-box" class="msft-new-topic" style="display:none;">
        <table class="msft-table" cellspacing="1">
          <tr><th colspan="2">${isRu ? 'Новая тема' : 'New topic'}: ${boardName(activeBoard)}</th></tr>
          <tr><td class="msft-form-label">${isRu ? 'Тема:' : 'Subject:'}</td><td><input type="text" id="new-topic-title" size="50"></td></tr>
          <tr><td class="msft-form-label">${isRu ? 'Раздел:' : 'Category:'}</td><td><select id="new-topic-cat">
            ${(isRu ? ['Общие вопросы', 'Системные утилиты', 'DirectX & Игры', 'Команды и Run', 'Звук и Аудио'] : ['General Discussion', 'System Utilities', 'DirectX & Gaming', 'Commands & Run', 'Audio & Multimedia']).map(c => `<option value="${c}">${c}</option>`).join('')}
          </select></td></tr>
          <tr><td class="msft-form-label">${isRu ? 'Имя:' : 'Name:'}</td><td><input type="text" id="new-topic-author" value="${isRu ? 'Пользователь98' : 'Win98User'}" size="20"></td></tr>
          <tr><td class="msft-form-label">${isRu ? 'Сообщение:' : 'Message:'}</td><td><textarea id="new-topic-content" rows="4" cols="50"></textarea></td></tr>
          <tr><td></td><td><button class="win-btn" id="btn-new-topic-submit">${isRu ? 'Опубликовать' : 'Post topic'}</button> <button class="win-btn" id="btn-new-topic-cancel">${isRu ? 'Отмена' : 'Cancel'}</button></td></tr>
        </table>
      </div>
      <table class="msft-table" cellspacing="1">
        <tr>
          <th>${isRu ? 'Тема' : 'Subject'}</th>
          <th>${isRu ? 'Раздел' : 'Category'}</th>
          <th>${isRu ? 'Автор' : 'Author'}</th>
          <th class="msft-num">${isRu ? 'Ответов' : 'Replies'}</th>
          <th class="msft-num">${isRu ? 'Просмотров' : 'Views'}</th>
        </tr>
        ${boardThreads.map(t => `
        <tr>
          <td>${this.gif('chat')} <a class="msft-forum-thread-title" data-thread-id="${t.id}">${this.escapeHtml(t.title)}</a></td>
          <td class="msft-small">${t.category}</td>
          <td><b>${this.escapeHtml(t.author)}</b></td>
          <td class="msft-num">${t.posts.length - 1}</td>
          <td class="msft-num">${t.views || 300}</td>
        </tr>`).join('')}
      </table>
    `;
  }

  attachMicroslopEvents(win, container, url) {
    const langBtn = container.querySelector('#msft-lang-toggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        this.msftUiLang = this.msftUiLang === 'ru' ? 'en' : 'ru';
        if (window.soundSys) window.soundSys.playClick();
        this.renderPage(win, this.currentUrl);
      });
    }

    container.querySelectorAll('[data-msft-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const t = tab.dataset.msftTab;
        if (window.soundSys) window.soundSys.playClick();
        if (t === 'home') this.navigate(win, 'http://www.microslop.com');
        else if (t === 'programs') this.navigate(win, 'http://www.microslop.com/programs');
        else if (t === 'commands') this.navigate(win, 'http://www.microslop.com/commands');
        else if (t === 'forum') this.navigate(win, `http://www.microslop.com/forum?board=${this.msftForumBoard}`);
      });
    });

    container.querySelectorAll('.msft-cat-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.msftCategoryFilter = btn.dataset.category;
        if (window.soundSys) window.soundSys.playClick();
        this.renderPage(win, this.currentUrl);
      });
    });

    const progSearch = container.querySelector('#msft-prog-search');
    if (progSearch) {
      progSearch.addEventListener('input', () => {
        const term = progSearch.value.trim().toLowerCase();
        container.querySelectorAll('.msft-prog-card').forEach(card => {
          const t = card.dataset.progTitle || '';
          const e = card.dataset.progExe || '';
          card.style.display = !term || t.includes(term) || e.includes(term) ? '' : 'none';
        });
      });
    }

    const btnBoardRu = container.querySelector('#btn-board-ru');
    if (btnBoardRu) {
      btnBoardRu.addEventListener('click', () => {
        this.msftForumBoard = 'ru';
        this.activeMsftThreadId = null;
        if (window.soundSys) window.soundSys.playClick();
        this.navigate(win, 'http://www.microslop.com/forum?board=ru');
      });
    }

    const btnBoardEn = container.querySelector('#btn-board-en');
    if (btnBoardEn) {
      btnBoardEn.addEventListener('click', () => {
        this.msftForumBoard = 'en';
        this.activeMsftThreadId = null;
        if (window.soundSys) window.soundSys.playClick();
        this.navigate(win, 'http://www.microslop.com/forum?board=en');
      });
    }

    container.querySelectorAll('.msft-forum-thread-title').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.activeMsftThreadId = link.dataset.threadId;
        if (window.soundSys) window.soundSys.playClick();
        this.navigate(win, `http://www.microslop.com/forum?thread=${this.activeMsftThreadId}`);
      });
    });

    const btnForumBack = container.querySelector('#btn-msft-forum-back');
    if (btnForumBack) {
      btnForumBack.addEventListener('click', (e) => {
        e.preventDefault();
        this.activeMsftThreadId = null;
        if (window.soundSys) window.soundSys.playClick();
        this.navigate(win, `http://www.microslop.com/forum?board=${this.msftForumBoard}`);
      });
    }

    const btnReplySend = container.querySelector('#btn-msft-reply-send');
    if (btnReplySend) {
      btnReplySend.addEventListener('click', () => {
        const authorEl = container.querySelector('#msft-reply-author');
        const textEl = container.querySelector('#msft-reply-text');
        const author = authorEl ? (authorEl.value.trim() || 'User98') : 'User98';
        const text = textEl ? textEl.value.trim() : '';

        if (!text) return;

        const threads = this.getMsftForumThreads();
        const t = threads.find(x => x.id === this.activeMsftThreadId);
        if (t) {
          const now = new Date();
          const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.1998 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          t.posts.push({
            author: author,
            rank: this.msftUiLang === 'ru' ? 'Участник сообщества' : 'Community Member',
            date: dateStr,
            text: this.escapeHtml(text).replace(/\n/g, '<br>')
          });
          this.saveMsftForumThreads(threads);
          if (window.soundSys) window.soundSys.playDing();
          this.renderPage(win, this.currentUrl);
        }
      });
    }

    const btnNewThread = container.querySelector('#btn-msft-new-thread');
    const newTopicBox = container.querySelector('#msft-new-topic-box');
    const btnCancelTopic = container.querySelector('#btn-new-topic-cancel');
    const btnSubmitTopic = container.querySelector('#btn-new-topic-submit');

    if (btnNewThread && newTopicBox) {
      btnNewThread.addEventListener('click', () => {
        newTopicBox.style.display = newTopicBox.style.display === 'none' ? 'block' : 'none';
        if (window.soundSys) window.soundSys.playClick();
      });
    }

    if (btnCancelTopic && newTopicBox) {
      btnCancelTopic.addEventListener('click', () => {
        newTopicBox.style.display = 'none';
      });
    }

    if (btnSubmitTopic) {
      btnSubmitTopic.addEventListener('click', () => {
        const titleEl = container.querySelector('#new-topic-title');
        const catEl = container.querySelector('#new-topic-cat');
        const authorEl = container.querySelector('#new-topic-author');
        const contentEl = container.querySelector('#new-topic-content');

        const title = titleEl ? titleEl.value.trim() : '';
        const cat = catEl ? catEl.value : 'General';
        const author = authorEl ? (authorEl.value.trim() || 'User98') : 'User98';
        const content = contentEl ? contentEl.value.trim() : '';

        if (!title || !content) {
          window.winManager.openDialog({
            title: 'Microslop',
            icon: 'warning',
            message: this.msftUiLang === 'ru' ? 'Заполните тему и текст сообщения.' : 'Please fill in both the subject and the message.'
          });
          return;
        }

        const threads = this.getMsftForumThreads();
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.1998 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const newId = `msft_${this.msftForumBoard}_${Date.now()}`;

        threads.unshift({
          id: newId,
          lang: this.msftForumBoard,
          title: title,
          category: cat,
          author: author,
          views: 1,
          posts: [
            {
              author: author,
              rank: this.msftUiLang === 'ru' ? 'Автор темы' : 'Topic Starter',
              date: dateStr,
              text: this.escapeHtml(content).replace(/\n/g, '<br>')
            }
          ]
        });

        this.saveMsftForumThreads(threads);
        this.activeMsftThreadId = newId;
        if (window.soundSys) window.soundSys.playDing();
        this.navigate(win, `http://www.microslop.com/forum?thread=${newId}`);
      });
    }
  }

  saveMsftForumThreads(threads) {
    try {
      localStorage.setItem(this.msftForumStorageKey, JSON.stringify(threads));
    } catch (e) {
      console.warn('saveMsftForumThreads error:', e);
    }
  }

  getMsftForumThreads() {
    try {
      const raw = localStorage.getItem(this.msftForumStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return [
      {
        id: 'msft_ru_1',
        lang: 'ru',
        title: 'Как настроить автозагрузку программ через MSConfig?',
        category: 'Системные утилиты',
        author: 'Petrovich98',
        rank: 'Постоянный участник',
        date: '14.10.1998 12:30',
        views: 482,
        posts: [
          {
            author: 'Petrovich98',
            rank: 'Постоянный участник',
            date: '14.10.1998 12:30',
            text: 'Привет всем! После установки нескольких новых утилит компьютер стал заметно дольше грузиться. Слышал, что в Win 98 появилась специальная утилита MSConfig. Как её запустить в нашем клоне и отключить лишние программы из автозапуска?'
          },
          {
            author: 'MS_Support_Alex',
            rank: 'Microslop MVP',
            date: '14.10.1998 12:45',
            text: 'Здравствуйте, Petrovich98!<br><br>В клоне Win 98 утилита конфигурации системы полностью реализована. Чтобы её открыть:<br>1. Нажмите <b>Пуск &gt; Выполнить</b> (или горячие клавиши <b>Win + R</b>).<br>2. Введите команду <code>msconfig</code> и нажмите Enter.<br>3. В открывшемся окне перейдите на вкладку <b>«Автозагрузка» (Startup)</b>.<br>4. Снимите флажки напротив программ, которые вам не нужны при старте Win, и нажмите кнопку «Применить».<br><br>Также в MSConfig доступны вкладки для просмотра и правки директив файлов <code>WIN.INI</code>, <code>SYSTEM.INI</code> и <code>AUTOEXEC.BAT</code>!'
          },
          {
            author: 'Petrovich98',
            rank: 'Постоянный участник',
            date: '14.10.1998 13:02',
            text: 'Спасибо огромное! Запустил msconfig, отключил парочку фоновых агентов, теперь система грузится моментально!'
          }
        ]
      },
      {
        id: 'msft_ru_2',
        lang: 'ru',
        title: 'Где найти тест куба Direct3D в Средстве диагностики DxDiag?',
        category: 'DirectX & Графика',
        author: '3D_Voodoo_Fan',
        rank: 'Завсегдатай',
        date: '15.10.1998 16:10',
        views: 615,
        posts: [
          {
            author: '3D_Voodoo_Fan',
            rank: 'Завсегдатай',
            date: '15.10.1998 16:10',
            text: 'Народ, подскажите: в dxdiag есть знаменитый тест вращающегося 3D-кубика с логотипом DirectX? Как его протестировать?'
          },
          {
            author: 'VoodooMaster_98',
            rank: 'Модератор',
            date: '15.10.1998 16:25',
            text: 'Да, тест Direct3D куба работает в реальном времени на HTML5 Canvas/WebGL!<br><br>Инструкция:<br>1. Выполните команду <code>dxdiag</code>.<br>2. Перейдите на вкладку <b>«Дисплей» (Display)</b>.<br>3. В блоке возможностей DirectX нажмите кнопку <b>«Проверка Direct3D»</b>.<br>4. Откроется отдельное окно с вращающимся текстурированным кубом с логотипом DirectX 6.1. Можно наглядно убедиться в работоспособности 3D-ускорителя!'
          }
        ]
      },
      {
        id: 'msft_ru_3',
        lang: 'ru',
        title: 'Полный список апплетов Панели управления .CPL для быстрого запуска',
        category: 'Команды и Выполнить',
        author: 'SysAdmin_Vasya',
        rank: 'Системный инженер',
        date: '16.10.1998 10:15',
        views: 740,
        posts: [
          {
            author: 'SysAdmin_Vasya',
            rank: 'Системный инженер',
            date: '16.10.1998 10:15',
            text: 'Всем привет! Собрал для всех системных администраторов шпаргалку по всем поддерживаемым апплетам Панели управления (файлы <code>.cpl</code>), которые можно запускать прямо из диалога «Выполнить» (Win+R):<br><br>• <code>sysdm.cpl</code> — Свойства системы (процессор, RAM, устройства)<br>• <code>timedate.cpl</code> — Дата и время (часы, календарь, часовой пояс)<br>• <code>main.cpl</code> — Свойства мыши (скорость, шлейфы, кнопки)<br>• <code>mmsys.cpl</code> — Звуки и аудио (звуковые схемы Win)<br>• <code>appwiz.cpl</code> — Установка и удаление программ<br>• <code>inetcpl.cpl</code> — Свойства обозревателя Internet Explorer<br>• <code>desk.cpl</code> — Свойства экрана (обои, заставки, темы)<br>• <code>intl.cpl</code> — Язык и региональные настройки<br><br>Команды также работают с префиксом <code>control</code>, например: <code>control sysdm.cpl</code>!'
          },
          {
            author: 'Win98_Lover',
            rank: 'Участник сообщества',
            date: '16.10.1998 11:40',
            text: 'Шикарный список! Добавил страницу себе в закладки Избранного в Internet Explorer.'
          }
        ]
      },
      {
        id: 'msft_ru_4',
        lang: 'ru',
        title: 'Регулятор громкости sndvol32 и Web Audio: как это устроено?',
        category: 'Звук и Аудио',
        author: 'SoundBlaster_Fan',
        rank: 'Аудиофил',
        date: '17.10.1998 14:05',
        views: 390,
        posts: [
          {
            author: 'SoundBlaster_Fan',
            rank: 'Аудиофил',
            date: '17.10.1998 14:05',
            text: 'Заметил, что при вызове регулятора громкости через <code>sndvol32</code> ползунок Master Volume действительно приглушает звук во всей системе. Это работает через Web Audio API?'
          },
          {
            author: 'DevLead_Win98',
            rank: 'Microslop MVP',
            date: '17.10.1998 14:32',
            text: 'Именно так! Регулятор громкости <code>sndvol32</code> синхронизирован с Master Gain Node в звуковой подсистеме. Когда вы двигаете ползунок или ставите флажок «Выключить все» (Mute), уровень звука моментально меняется в плеере Winamp, играх и системных эффектах.'
          }
        ]
      },
      {
        id: 'msft_ru_5',
        lang: 'ru',
        title: 'Редактирование AUTOEXEC.BAT и CONFIG.SYS в SysEdit',
        category: 'Файлы и MS-DOS',
        author: 'DOS_Veteran',
        rank: 'Ветеран DOS',
        date: '18.10.1998 09:20',
        views: 520,
        posts: [
          {
            author: 'DOS_Veteran',
            rank: 'Ветеран DOS',
            date: '18.10.1998 09:20',
            text: 'Хочу отредактировать пути PATH в AUTOEXEC.BAT и параметры HIMEM в CONFIG.SYS. Какая встроенная утилита позволяет делать это удобнее всего?'
          },
          {
            author: 'MS_Support_Alex',
            rank: 'Microslop MVP',
            date: '18.10.1998 09:45',
            text: 'Рекомендуем воспользоваться системным редактором <code>sysedit</code>. Введите <code>sysedit</code> в окне «Выполнить». Откроется классический интерфейс с 4 каскадными окнами для одновременного редактирования AUTOEXEC.BAT, CONFIG.SYS, WIN.INI и SYSTEM.INI. При сохранении изменения записываются прямо в файлы на диске C:!'
          }
        ]
      },
      {
        id: 'msft_ru_6',
        lang: 'ru',
        title: 'Стандартные игры и развлечения в Win 98',
        category: 'Игры и Мультимедиа',
        author: 'Gamer_1998',
        rank: 'Новичок',
        date: '19.10.1998 18:00',
        views: 890,
        posts: [
          {
            author: 'Gamer_1998',
            rank: 'Новичок',
            date: '19.10.1998 18:00',
            text: 'Какие стандартные игры поставляются вместе с системой Win 98 и как их запустить?'
          },
          {
            author: 'RetroMaster',
            rank: 'Завсегдатай',
            date: '19.10.1998 18:22',
            text: 'В состав Win 98 входит классический набор встроенных игр:<br>• <b>Сапёр</b> (команда <code>winmine</code> или меню Пуск &gt; Программы &gt; Стандартные &gt; Игры)<br>• <b>Косынка</b> (команда <code>sol</code>)<br>• <b>3D Pinball: Space Cadet</b> (команда <code>pinball</code>)<br><br>Все эти игры являются системными компонентами Win 98 и открываются непосредственно через меню «Пуск» или диалог «Выполнить»!'
          }
        ]
      },

      {
        id: 'msft_en_1',
        lang: 'en',
        title: 'How to manage Win 98 startup programs using MSConfig?',
        category: 'System Utilities',
        author: 'Voodoo2_Gamer',
        rank: 'Power User',
        date: '14.10.1998 14:10',
        views: 520,
        posts: [
          {
            author: 'Voodoo2_Gamer',
            rank: 'Power User',
            date: '14.10.1998 14:10',
            text: 'Hello everyone! I have too many background utilities launching on system startup. How can I selectively disable startup entries in this Win 98 clone using MSConfig?'
          },
          {
            author: 'Bill_G_Official',
            rank: 'Microslop MVP',
            date: '14.10.1998 14:35',
            text: 'Hi Voodoo2_Gamer!<br><br>The System Configuration Utility is fully supported in this clone. Here is how to use it:<br>1. Press <b>Win + R</b> or click <b>Start &gt; Run</b>.<br>2. Type <code>msconfig</code> and press Enter.<br>3. Switch to the <b>Startup</b> tab.<br>4. Uncheck any background tasks you do not want loading during boot, then click Apply.<br><br>You can also use the WIN.INI and SYSTEM.INI tabs to inspect and edit standard 16-bit and 32-bit Win configuration blocks!'
          },
          {
            author: 'Voodoo2_Gamer',
            rank: 'Power User',
            date: '14.10.1998 14:50',
            text: 'Worked like a charm! Boot time is noticeably faster now. Thanks!'
          }
        ]
      },
      {
        id: 'msft_en_2',
        lang: 'en',
        title: 'Testing Direct3D hardware acceleration: rotating cube in DxDiag',
        category: 'DirectX & Gaming',
        author: 'RetroGraphicsFan',
        rank: 'Enthusiast',
        date: '15.10.1998 11:20',
        views: 680,
        posts: [
          {
            author: 'RetroGraphicsFan',
            rank: 'Enthusiast',
            date: '15.10.1998 11:20',
            text: 'Does dxdiag include the authentic spinning 3D DirectX cube test to verify Direct3D acceleration?'
          },
          {
            author: 'DirectX_Guru',
            rank: 'Microslop MVP',
            date: '15.10.1998 11:42',
            text: 'Yes! Simply run <code>dxdiag</code> in the Run dialog or MS-DOS prompt. Click on the <b>Display</b> tab, and click the <b>Test Direct3D</b> button. A dialog will render the iconic spinning 3D DirectX textured cube in real-time using WebGL / Canvas!'
          }
        ]
      },
      {
        id: 'msft_en_3',
        lang: 'en',
        title: 'Run dialog ultimate cheat sheet: commands, arguments, and .CPL applets',
        category: 'Run & Commands',
        author: 'WinTech98',
        rank: 'Senior Admin',
        date: '16.10.1998 13:00',
        views: 890,
        posts: [
          {
            author: 'WinTech98',
            rank: 'Senior Admin',
            date: '16.10.1998 13:00',
            text: 'Here is the complete reference for the enhanced Run prompt in our Win98 clone:<br><br><b>System Tools:</b><br>• <code>msconfig</code> — System Configuration Utility<br>• <code>dxdiag</code> — DirectX Diagnostics & 3D Test<br>• <code>sysedit</code> — Multi-file System Editor<br>• <code>scandisk</code> — FAT32 Drive Scanner<br>• <code>defrag</code> — Disk Defragmenter<br>• <code>cleanmgr</code> — Disk Cleanup Utility<br>• <code>sndvol32</code> — Sound Blaster Volume Control<br>• <code>charmap</code> — Character Map Font Glyphs<br>• <code>command</code> or <code>cmd</code> — MS-DOS Command Prompt<br><br><b>Control Panel:</b><br>• <code>sysdm.cpl</code> (System), <code>timedate.cpl</code> (Clock), <code>main.cpl</code> (Mouse), <code>mmsys.cpl</code> (Sounds), <code>appwiz.cpl</code> (Add/Remove), <code>inetcpl.cpl</code> (Internet Options), <code>desk.cpl</code> (Display).<br><br><b>Arguments & URLs:</b><br>You can pass arguments like <code>notepad C:\\autoexec.bat</code> or type any URL directly like <code>http://www.microslop.com</code>!'
          }
        ]
      },
      {
        id: 'msft_en_4',
        lang: 'en',
        title: 'Supported command-line utilities in command.com terminal',
        category: 'MS-DOS Prompt',
        author: 'DOS_Master',
        rank: 'Terminal Wizard',
        date: '17.10.1998 08:30',
        views: 450,
        posts: [
          {
            author: 'DOS_Master',
            rank: 'Terminal Wizard',
            date: '17.10.1998 08:30',
            text: 'What commands can I run in the windowed MS-DOS prompt (`command.com`)?'
          },
          {
            author: 'RetroDev_98',
            rank: 'Microslop MVP',
            date: '17.10.1998 09:05',
            text: 'The MS-DOS prompt supports: <code>DIR</code> (lists files with sizes and timestamps), <code>CD</code> (directory traversal), <code>TYPE</code> (outputs file content), <code>COPY</code>, <code>DEL</code>, <code>CLS</code> (clears screen), <code>VER</code> (Win 98 Version 4.10.2222), <code>HELP</code>, <code>ECHO</code>, and direct app launching (typing <code>calc</code>, <code>notepad</code>, <code>winmine</code> launches the app window immediately).'
          }
        ]
      },
      {
        id: 'msft_en_5',
        lang: 'en',
        title: 'SndVol32 volume mixer and Web Audio API integration',
        category: 'Audio Subsystem',
        author: 'SoundEnthusiast',
        rank: 'Audiophile',
        date: '18.10.1998 15:40',
        views: 380,
        posts: [
          {
            author: 'SoundEnthusiast',
            rank: 'Audiophile',
            date: '18.10.1998 15:40',
            text: 'Does the Volume Control applet (`sndvol32`) genuinely adjust browser audio volume for Winamp and system events?'
          },
          {
            author: 'DevLead_Win98',
            rank: 'Microslop MVP',
            date: '18.10.1998 16:12',
            text: 'Yes! The Master Volume slider in <code>sndvol32</code> connects directly to the Web Audio Master Gain node. Moving the slider or clicking Mute dynamically adjusts sound output across all clone components.'
          }
        ]
      },
      {
        id: 'msft_en_6',
        lang: 'en',
        title: 'Standard Win 98 Games and Entertainment Accessories',
        category: 'Gaming & Media',
        author: 'ClassicSurfer',
        rank: 'Junior Member',
        date: '19.10.1998 17:15',
        views: 610,
        posts: [
          {
            author: 'ClassicSurfer',
            rank: 'Junior Member',
            date: '19.10.1998 17:15',
            text: 'What games and entertainment accessories are bundled with Win 98 and how do I open them?'
          },
          {
            author: 'SystemAdmin_98',
            rank: 'Microslop MVP',
            date: '19.10.1998 17:38',
            text: 'Win 98 includes the beloved built-in entertainment suite:<br>• <b>Minesweeper</b> (<code>winmine</code>)<br>• <b>Solitaire</b> (<code>sol</code>)<br>• <b>3D Pinball: Space Cadet</b> (<code>pinball</code>)<br><br>You can launch any of these via Start &gt; Programs &gt; Accessories &gt; Games or via the Run prompt (Win + R)!'
          }
        ]
      }
    ];
  }

  getMsftProgramsList() {
    return [
      {
        id: 'notepad',
        nameRu: 'Блокнот',
        nameEn: 'Notepad',
        exe: 'notepad.exe',
        category: 'standard',
        icon: 'notepad',
        descRu: 'Классический текстовый редактор с поддержкой кодировок Win-1251/UTF-8 и сохранением файлов в виртуальную файловую систему (VFS).',
        descEn: 'Classic text editor supporting TXT/INI/BAT/SYS files with persistence in the virtual FAT32 file system.',
        runCmd: 'notepad'
      },
      {
        id: 'paint',
        nameRu: 'Paint',
        nameEn: 'Paintbrush',
        exe: 'mspaint.exe',
        category: 'standard',
        icon: 'paint',
        descRu: 'Графический растровый редактор: кисти, карандаш, заливка, палитра цветов, фигуры и экспорт рисунков в BMP.',
        descEn: 'Bitmap graphics editor with brushes, pencil, flood fill, 90s color palette, and BMP export.',
        runCmd: 'paint'
      },
      {
        id: 'calc',
        nameRu: 'Калькулятор',
        nameEn: 'Calculator',
        exe: 'calc.exe',
        category: 'standard',
        icon: 'calculator',
        descRu: 'Арифметический и научный калькулятор для быстрых вычислений, тригонометрических функций и конвертации чисел.',
        descEn: 'Standard and scientific calculator for arithmetic, trigonometry, and base conversion.',
        runCmd: 'calc'
      },
      {
        id: 'charmap',
        nameRu: 'Таблица символов',
        nameEn: 'Character Map',
        exe: 'charmap.exe',
        category: 'standard',
        icon: 'charmap',
        descRu: 'Утилита для просмотра специальных символов, знаков валют, диакритики и копирования их в буфер обмена.',
        descEn: 'Utility for inspecting font glyphs, special symbols, and copying characters to clipboard.',
        runCmd: 'charmap'
      },
      {
        id: 'sndrec32',
        nameRu: 'Звукозапись',
        nameEn: 'Sound Recorder',
        exe: 'sndrec32.exe',
        category: 'standard',
        icon: 'sndrec32',
        descRu: 'Запись звука через микрофон, отображение осциллограммы, добавление эха, реверса и изменение скорости.',
        descEn: 'Audio waveform recorder and editor with echo effect, reverse playback, and speed adjustment.',
        runCmd: 'sndrec32'
      },
      {
        id: 'kodakimg',
        nameRu: 'Просмотр изображений Kodak',
        nameEn: 'Imaging for Win',
        exe: 'kodakimg.exe',
        category: 'standard',
        icon: 'imaging',
        descRu: 'Просмотрщик графических файлов BMP, JPEG, GIF с масштабированием, поворотом и полноэкранным показом.',
        descEn: 'Image viewer for BMP, JPEG, and GIF formats with zoom, rotation, and full-screen view.',
        runCmd: 'kodakimg'
      },
      {
        id: 'wordpad',
        nameRu: 'WordPad',
        nameEn: 'WordPad',
        exe: 'wordpad.exe',
        category: 'standard',
        icon: 'wordpad',
        descRu: 'Текстовый процессор для форматирования текста, изменения шрифтов, списков и сохранения документов RTF/DOC.',
        descEn: 'Rich text word processor with font styling, bullet lists, and document editing.',
        runCmd: 'write'
      },

      {
        id: 'msconfig',
        nameRu: 'Настройка системы (MSConfig)',
        nameEn: 'System Configuration Utility',
        exe: 'msconfig.exe',
        category: 'system',
        icon: 'msconfig',
        descRu: 'Управление автозагрузкой программ, выборочный запуск, редактирование директив WIN.INI, SYSTEM.INI и AUTOEXEC.BAT.',
        descEn: 'Startup manager, selective boot configuration, and interactive WIN.INI/SYSTEM.INI/AUTOEXEC.BAT editor.',
        runCmd: 'msconfig'
      },
      {
        id: 'dxdiag',
        nameRu: 'Диагностика DirectX (DxDiag)',
        nameEn: 'DirectX Diagnostic Tool',
        exe: 'dxdiag.exe',
        category: 'system',
        icon: 'dxdiag',
        descRu: 'Сведения об аппаратном обеспечении, видеоадаптере, DirectDraw и интерактивный 3D-тест вращающегося куба Direct3D.',
        descEn: 'Hardware diagnostics, DirectDraw verification, and interactive real-time spinning Direct3D cube test.',
        runCmd: 'dxdiag'
      },
      {
        id: 'sysedit',
        nameRu: 'Редактор конфигурации (SysEdit)',
        nameEn: 'System Configuration Editor',
        exe: 'sysedit.exe',
        category: 'system',
        icon: 'sysedit',
        descRu: 'Многооконный редактор для одновременного редактирования AUTOEXEC.BAT, CONFIG.SYS, WIN.INI и SYSTEM.INI.',
        descEn: 'Multi-window cascaded editor for simultaneous editing of AUTOEXEC.BAT, CONFIG.SYS, WIN.INI, and SYSTEM.INI.',
        runCmd: 'sysedit'
      },
      {
        id: 'scandisk',
        nameRu: 'Проверка диска (ScanDisk)',
        nameEn: 'ScanDisk',
        exe: 'scandisk.exe',
        category: 'system',
        icon: 'scandisk',
        descRu: 'Диагностика файловой системы FAT32, сканирование поверхности диска C: на сбойные кластеры и исправление ошибок.',
        descEn: 'FAT32 file system analysis, surface cluster scan for drive C:, and file allocation table repair.',
        runCmd: 'scandisk'
      },
      {
        id: 'defrag',
        nameRu: 'Дефрагментация диска',
        nameEn: 'Disk Defragmenter',
        exe: 'defrag.exe',
        category: 'system',
        icon: 'defrag',
        descRu: 'Графическая карта кластеров диска, перемещение фрагментированных блоков и оптимизация быстродействия накопителя.',
        descEn: 'Visual disk cluster map, reallocation of fragmented files, and hard drive speed optimization.',
        runCmd: 'defrag'
      },
      {
        id: 'cleanmgr',
        nameRu: 'Очистка диска (CleanMgr)',
        nameEn: 'Disk Cleanup',
        exe: 'cleanmgr.exe',
        category: 'system',
        icon: 'cleanmgr',
        descRu: 'Освобождение места на жестком диске, удаление временных файлов интернета, корзины и временных дампов.',
        descEn: 'Frees hard drive space by removing temporary files, browser cache, and emptying Recycle Bin.',
        runCmd: 'cleanmgr'
      },
      {
        id: 'sndvol32',
        nameRu: 'Регулятор громкости',
        nameEn: 'Volume Control',
        exe: 'sndvol32.exe',
        category: 'system',
        icon: 'sndvol32',
        descRu: 'Микшер громкости Win: регулировка Master Volume, Wave, CD Audio и MIDI с мгновенной привязкой к Web Audio.',
        descEn: 'Win audio mixer: master volume, Wave, balance sliders, and mute controls wired to Web Audio API.',
        runCmd: 'sndvol32'
      },
      {
        id: 'regedit',
        nameRu: 'Редактор реестра',
        nameEn: 'Registry Editor',
        exe: 'regedit.exe',
        category: 'system',
        icon: 'regedit',
        descRu: 'Дерево системного реестра: HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER, создание и редактирование строковых и DWORD ключей.',
        descEn: 'Hierarchical registry editor for HKEY keys, DWORD parameters, and system tweaks.',
        runCmd: 'regedit'
      },
      {
        id: 'taskmgr',
        nameRu: 'Диспетчер задач',
        nameEn: 'Task Manager',
        exe: 'taskmgr.exe',
        category: 'system',
        icon: 'taskmgr',
        descRu: 'Список активных процессов, мониторинг загрузки процессора и оперативной памяти, завершение зависших задач.',
        descEn: 'Process list, CPU and memory utilization graphs, and forceful task termination.',
        runCmd: 'taskmgr'
      },
      {
        id: 'command',
        nameRu: 'Сеанс MS-DOS',
        nameEn: 'MS-DOS Prompt',
        exe: 'command.com',
        category: 'system',
        icon: 'dos',
        descRu: 'Оконный эмулятор терминала DOS 7.1: выполнение команд DIR, CD, TYPE, COPY, DEL, CLS, HELP и запуск программ.',
        descEn: 'Windowed MS-DOS 7.1 command prompt interpreter supporting standard file and system utilities.',
        runCmd: 'command'
      },
      {
        id: 'explorer',
        nameRu: 'Проводник Win',
        nameEn: 'Win Explorer',
        exe: 'explorer.exe',
        category: 'system',
        icon: 'explorer',
        descRu: 'Файловый менеджер: дерево дисков, просмотр папок «Мой компьютер», «C:», «Мои документы», перемещение и создание файлов.',
        descEn: 'Primary file navigation shell: drives C: and D:, folder browsing, file creation and management.',
        runCmd: 'explorer'
      },

      {
        id: 'sysdm.cpl',
        nameRu: 'Свойства системы',
        nameEn: 'System Properties',
        exe: 'sysdm.cpl',
        category: 'cpanel',
        icon: 'cpanel-sysdm',
        descRu: 'Информация о процессоре Pentium II, объеме RAM, версия Win 98 SE и диспетчер устройств.',
        descEn: 'Processor specifications, RAM size, OS build version, and Hardware Device Manager.',
        runCmd: 'sysdm.cpl'
      },
      {
        id: 'timedate.cpl',
        nameRu: 'Дата и время',
        nameEn: 'Date/Time Properties',
        exe: 'timedate.cpl',
        category: 'cpanel',
        icon: 'cpanel-timedate',
        descRu: 'Интерактивные аналоговые часы с тикающей секундной стрелкой, календарь и выбор часового пояса GMT.',
        descEn: 'Analog ticking clock face, interactive calendar picker, and global time zone settings.',
        runCmd: 'timedate.cpl'
      },
      {
        id: 'main.cpl',
        nameRu: 'Свойства мыши',
        nameEn: 'Mouse Properties',
        exe: 'main.cpl',
        category: 'cpanel',
        icon: 'cpanel-main',
        descRu: 'Настройка скорости перемещения указателя, шлейфа мыши, скорости двойного щелчка и смена кнопок.',
        descEn: 'Cursor speed adjustment, pointer trail effect, double-click test area, and button orientation.',
        runCmd: 'main.cpl'
      },
      {
        id: 'mmsys.cpl',
        nameRu: 'Звуки и мультимедиа',
        nameEn: 'Sounds and Multimedia',
        exe: 'mmsys.cpl',
        category: 'cpanel',
        icon: 'cpanel-mmsys',
        descRu: 'Назначение звуковых эффектов для событий Win (Запуск, Ошибка, Клик) и тестирование динамиков.',
        descEn: 'Sound event scheme manager (Startup sound, Asterisk, Chord, Exit) and audio device testing.',
        runCmd: 'mmsys.cpl'
      },
      {
        id: 'appwiz.cpl',
        nameRu: 'Установка и удаление программ',
        nameEn: 'Add/Remove Programs',
        exe: 'appwiz.cpl',
        category: 'cpanel',
        icon: 'cpanel-appwiz',
        descRu: 'Список установленного ПО и игр, отображение размера на диске и функция деинсталляции.',
        descEn: 'Catalog of installed games and utilities with storage footprint and uninstall capabilities.',
        runCmd: 'appwiz.cpl'
      },
      {
        id: 'inetcpl.cpl',
        nameRu: 'Свойства обозревателя',
        nameEn: 'Internet Properties',
        exe: 'inetcpl.cpl',
        category: 'cpanel',
        icon: 'cpanel-inetcpl',
        descRu: 'Настройка домашней страницы Internet Explorer, очистка кэша временных файлов и параметры безопасности зон.',
        descEn: 'Default browser start page configuration, temporary web file cache cleaner, and security zones.',
        runCmd: 'inetcpl.cpl'
      },
      {
        id: 'desk.cpl',
        nameRu: 'Свойства экрана',
        nameEn: 'Display Properties',
        exe: 'desk.cpl',
        category: 'cpanel',
        icon: 'cpanel-desk',
        descRu: 'Выбор обоев рабочего стола, заставки (Экранная заставка «Трубопровод 3D», «Звездное поле»), цветовые схемы.',
        descEn: 'Wallpaper gallery, screensaver switcher (3D Pipes, Starfield, Flying Win), and color themes.',
        runCmd: 'desk.cpl'
      },
      {
        id: 'intl.cpl',
        nameRu: 'Язык и стандарты',
        nameEn: 'Regional Settings',
        exe: 'intl.cpl',
        category: 'cpanel',
        icon: 'cpanel-intl',
        descRu: 'Переключение системного языка интерфейса клона (Русский / English) с автоматической сменой меню и надписей.',
        descEn: 'System-wide language toggle (Russian / English) updating menus, labels, and dialog titles.',
        runCmd: 'intl.cpl'
      },

      {
        id: 'iexplore',
        nameRu: 'Internet Explorer 5.0',
        nameEn: 'Internet Explorer 5.0',
        exe: 'iexplore.exe',
        category: 'net',
        icon: 'internet-explorer',
        descRu: 'Веб-браузер с историей посещений, адресной строкой, избранным, контекстным меню и встроенными сайтами 1998 года.',
        descEn: 'Retro web browser with URL bar, navigation history, bookmarks, and genuine 1998 web experience.',
        runCmd: 'iexplore'
      },
      {
        id: 'outlook',
        nameRu: 'Outlook Express',
        nameEn: 'Outlook Express',
        exe: 'msimn.exe',
        category: 'net',
        icon: 'outlook',
        descRu: 'Почтовый клиент с папками «Входящие», «Отправленные», чтением писем и написанием новых сообщений.',
        descEn: 'Email client with Inbox, Outbox, email composer, and retro mailing interface.',
        runCmd: 'outlook'
      },

      {
        id: 'mplayer',
        nameRu: 'ActiveMovie Video Player',
        nameEn: 'ActiveMovie Video Player',
        exe: 'mplayer.exe',
        category: 'media',
        icon: 'mplayer',
        descRu: 'Проигрыватель видеороликов Microslop: воспроизведение клипов AVI, шкала перемотки и таймкоды.',
        descEn: 'Microslop video playback utility supporting AVI clips, scrubbing bar, and frame-accurate timing.',
        runCmd: 'mplayer'
      },

      {
        id: 'winmine',
        nameRu: 'Сапёр',
        nameEn: 'Minesweeper',
        exe: 'winmine.exe',
        category: 'games',
        icon: 'minesweeper',
        descRu: 'Классическая логическая головоломка: уровни «Новичок», «Любитель», «Профессионал» со смайликом в шапке.',
        descEn: 'Legendary mine clearance game with Beginner, Intermediate, and Expert grid modes.',
        runCmd: 'winmine'
      },
      {
        id: 'sol',
        nameRu: 'Косынка',
        nameEn: 'Solitaire',
        exe: 'sol.exe',
        category: 'games',
        icon: 'solitaire',
        descRu: 'Карточный пасьянс с перетаскиванием карт, подсчетом очков и победным каскадным водопадом колоды.',
        descEn: 'Classic Klondike card game with drag-and-drop mechanics and bouncing card cascade upon victory.',
        runCmd: 'sol'
      },
      {
        id: 'pinball',
        nameRu: '3D Pinball: Space Cadet',
        nameEn: '3D Pinball: Space Cadet',
        exe: 'pinball.exe',
        category: 'games',
        icon: 'pinball',
        descRu: 'Космический аркадный пинбол с бамперами, рампами, звуковыми эффектами и повышением звания кадета.',
        descEn: 'Space cadet arcade pinball with realistic physics bumpers, ramps, and cadet promotion missions.',
        runCmd: 'pinball'
      }
    ];
  }

  renderRetroWeb(pageKey) {
    const esc = (v) => this.escapeHtml(v);
    const nav = [
      ['http://www.retro-web.net', 'home', 'Home'],
      ['http://www.retro-web.net/games', 'joy', 'Games'],
      ['http://www.retro-web.net/about', 'globe', 'About Web \'98'],
      ['http://www.retro-web.net/guestbook', 'pencil', 'Guestbook'],
      ['http://www.search98.com', 'search', 'WebSeeker']
    ];
    const page = (title, icon, subtitle, content) => `
      <div class="retro-web-body">
        <div class="retro-web-band">
          ${nav.map(([url, navIcon, label]) => `<a data-url="${url}">${this.gif(navIcon)}<br>${label}</a>`).join('')}
          <div class="retro-web-band-note">Best viewed<br>at 800x600</div>
        </div>
        <div class="retro-web-main">
          <div class="retro-header">
            <h1>${this.gif(icon, 2)} ${title} ${this.gif(icon, 2)}</h1>
            <p>${subtitle}</p>
          </div>
          <hr>
          ${content}
          <hr>
          <p class="retro-web-foot">[ ${nav.map(([url, , label]) => `<a data-url="${url}">${label}</a>`).join(' | ')} ]<br>
          This page was made with Notepad. Last updated: November 12, 1998.</p>
        </div>
      </div>`;

    if (pageKey === 'retro-games') {
      return page('Retro Web Arcade', 'joy', 'The premier interactive entertainment zone on the World Wide Web!', `
        <h3>${this.gif('ball-red')} Featured Desktop Games:</h3>
        <ul class="retro-web-list">
          <li><b>Minesweeper 98</b> &mdash; classic 9x9 board with 10 mines! <a class="ie-launch-game" data-app="minesweeper">[Launch Minesweeper]</a></li>
          <li><b>Wolfenstein 3D</b> &mdash; classic 1992 raycasting shooter! <a data-url="http://www.steampowered.com">[Get it on Steam]</a> <span class="web-new">NEW!</span></li>
          <li><b>LucasQuest 98</b> &mdash; graphic SCUMM adventure quest! <a data-url="http://www.steampowered.com">[Get it on Steam]</a></li>
          <li><b>S.T.A.L.K.E.R.</b> &mdash; survival in the Zone! <a data-url="http://www.steampowered.com">[Get it on Steam]</a></li>
        </ul>
        <p>Looking for cheat codes? Visit <a data-url="http://www.cheatcc.com">Cheat Code Central</a>!</p>`);
    }

    if (pageKey === 'retro-about') {
      return page('About The 1998 Web', 'globe', 'A fond look at dial-up modems, HTML 3.2 and webrings!', `
        <p>In 1998 the Web was personal, quirky and full of animated GIFs, construction signs and MIDI tunes.
        Browsers connected through 56k dial-up modems, and every homepage had a guestbook and a visitor counter.</p>
        <h3>${this.gif('ball-blue')} Things every homepage needs:</h3>
        <ul class="retro-web-list">
          <li>A hit counter ${this.gif('check')}</li>
          <li>An &laquo;Under Construction&raquo; sign ${this.gif('construct')}</li>
          <li>A guestbook ${this.gif('pencil')}</li>
          <li>Links to your friends' pages ${this.gif('globe')}</li>
        </ul>`);
    }

    if (pageKey === 'retro-guestbook') {
      const entries = this.getGuestbookEntries();
      return page('Sign My Guestbook!', 'pencil', 'Leave a friendly greeting for all web surfers!', `
        <form class="retro-guestbook-form" id="guestbook-form">
          <table cellspacing="0">
            <tr><td><b>Name:</b></td><td><input type="text" id="gb-name" required size="30"></td></tr>
            <tr><td><b>Message:</b></td><td><input type="text" id="gb-msg" required size="50"></td></tr>
            <tr><td></td><td><button type="submit" class="win-btn">Sign Guestbook!</button> <button type="reset" class="win-btn">Clear</button></td></tr>
          </table>
        </form>
        <h3>${this.gif('book')} Guestbook Entries (${entries.length}):</h3>
        <div class="retro-guestbook-entries" id="gb-entries">
          ${entries.map(e => `
          <div class="retro-entry-card">
            <b>${esc(e.name)}</b> <i>(${esc(e.date)})</i><br>
            ${esc(e.message)}
          </div>`).join('<hr class="retro-entry-hr">')}
        </div>`);
    }

    const visits = '0048921';
    return page('Cyberspace Portal \'98', 'star', 'Your nostalgic gateway to information, games and retro software!', `
      <marquee class="retro-web-marquee" scrollamount="4">*** Welcome to the World Wide Web in 1998! *** Optimized for Microslop Internet Explorer and Win 98 ***</marquee>
      <div class="retro-construct">
        ${this.gif('construct', 2)}
        <div><b>UNDER CONSTRUCTION</b><br>Pardon our digital dust while we update our hyperlinks!</div>
        ${this.gif('construct', 2)}
      </div>
      <div class="web-construct"></div>
      <p>Welcome, traveler of the digital highway! You have reached the central portal.
      Use our <a data-url="http://www.search98.com">WebSeeker 98</a> to find games, install <a data-url="http://www.steampowered.com">Steam</a>
      to buy games by credit card, or join the discussions on the <a data-url="http://forum.games98.com">GamerZone forum</a>.</p>
      <h3>${this.gif('ball-green')} Cool links:</h3>
      <ul class="retro-web-list">
        <li><a data-url="http://www.geocities.com">GeoCities</a> &mdash; get your free homepage <span class="web-new">NEW!</span></li>
        <li><a data-url="http://www.spacejam.com">Space Jam</a> &mdash; the coolest movie site ever</li>
        <li><a data-url="http://www.anekdot98.ru">Анекдоты из России</a> &mdash; laugh every day</li>
      </ul>
      <p class="retro-center">You are visitor number<br><span class="web-counter">${[...visits].map(d => `<span>${d}</span>`).join('')}</span></p>
      <p class="retro-center">
        <span class="web-88 retro-88-ie">Microslop<br><b>IE 5.0</b></span>
        <span class="web-88 retro-88-note">made with<br><b>NOTEPAD</b></span>
        <a class="web-88 retro-88-mail" href="mailto:webmaster@retro-web.net">${this.gif('mail')}<br>email me!</a>
      </p>`);
  }

  attachRetroWebEvents(win, container) {
    container.querySelectorAll('.ie-launch-game').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const app = btn.dataset.app;
        if (app === 'minesweeper' && window.appMinesweeper) window.appMinesweeper.open();
      });
    });

    const form = container.querySelector('#guestbook-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = container.querySelector('#gb-name');
        const msgInput = container.querySelector('#gb-msg');
        const name = nameInput.value.trim() || 'Anonymous';
        const message = msgInput.value.trim() || 'Hello from 1998!';

        const entries = this.getGuestbookEntries();
        const now = new Date();
        const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/1998`;

        entries.unshift({ name, date: dateStr, message });
        this.saveGuestbookEntries(entries);

        if (window.soundSys) window.soundSys.playDing();
        this.renderPage(win, this.currentUrl);
      });
    }
  }

  getGuestbookEntries() {
    try {
      const data = localStorage.getItem(this.guestbookStorageKey);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [
      { name: 'Neo98', date: '06/15/1998', message: 'Awesome website! Dial-up loaded this page super fast!' },
      { name: 'RetroGamer', date: '08/22/1998', message: 'Bought Wolfenstein 3D on the new store, installed like a charm!' },
      { name: 'WebMaster', date: '11/04/1998', message: 'Thanks for stopping by! Keep surfing!' }
    ];
  }

  saveGuestbookEntries(entries) {
    try {
      localStorage.setItem(this.guestbookStorageKey, JSON.stringify(entries));
    } catch (e) {}
  }

  renderRambler() {
    const top100 = [
      { title: 'Компьютеры и Интернет', sites: [
        ['http://www.search98.com', 'WebSeeker 98', 'поисковая система', 12450, 48910],
        ['http://www.microslop.com', 'Microslop Win 98 Portal', 'база знаний и форум', 9870, 31200],
        ['http://www.steampowered.com', 'Steam', 'игры с доставкой по Сети', 7310, 26540],
        ['http://www.softstore98.com', 'SoftStore 98', 'программы для Win', 5120, 14830],
        ['http://www.themeworld98.com', "ThemeWorld '98", 'темы, обои и заставки', 4480, 17020],
        ['http://www.3advanced.com', '3ADVANCED Softworks', 'каталог программ', 3960, 11250],
        ['http://www.blender3d.com', 'Blender 3D', 'бесплатная 3D-графика', 2210, 7640],
        ['http://www.clippy98.com', "Скрепыш '98", 'гардероб помощника Office', 1870, 6120],
        ['http://www.goldfargus.ru', '«Фаргус Мультимедиа»', 'полностью на русском языке', 11420, 39800],
        ['http://www.xakep98.ru', 'Журнал «Хакер»', 'электронный андерграунд', 8340, 29150],
        ['http://www.emuland98.ru', 'Emu-Land', 'дампы картриджей Dendy и Sega', 6890, 24100]
      ] },
      { title: 'Развлечения и досуг', sites: [
        ['http://chat.krovatka98.ru', 'Чат Кроватка', 'главный веб-чат', 15230, 88460],
        ['http://www.mult98.ru', 'Студия «Мульт.ру»', 'серии Масяни и мультфильмы', 13200, 52100],
        ['http://www.anekdot98.ru', 'Анекдоты из России', 'свежие анекдоты', 11980, 40310],
        ['http://www.molotok98.ru', 'Молоток.ру', 'первый онлайн-аукцион', 9450, 34200],
        ['http://www.kinomania98.ru', "Киномания '98", 'новости кино и КиноФорум', 6540, 22870],
        ['http://forum.games98.com', 'GamerZone Forum', 'форум геймеров', 4120, 19350],
        ['http://www.3dfx-zone.com', '3dfx Voodoo Zone', 'разгон железа', 2890, 9420]
      ] },
      { title: 'СМИ, музыка и безопасность', sites: [
        ['http://www.retro-news98.com', 'Cyberspace Times', 'ежедневные новости', 8770, 25100],
        ['http://www.mp3vault98.com', 'MP3 Vault 98', 'архив MP3', 7650, 30480],
        ['http://www.xfiles98.ru', 'Истина где-то рядом', 'секретные досье и НЛО', 5720, 18900],
        ['http://www.webcinema98.com', 'WebCinema 98', 'видеоархив клипов', 3340, 12090],
        ['http://www.antivirus98.com', 'AntiVirus Lab', 'борьба с вирусами', 2760, 8330],
        ['http://www.geocities.com', 'GeoCities', 'домашние страницы', 2240, 6980]
      ] }
    ];
    const num = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;');
    return `
      <div class="rambler98-container">
        <div class="rambler98-page">
          <table class="rambler98-head" cellspacing="0">
            <tr>
              <td class="rambler98-logo-cell">
                <div class="rambler98-logo">Rambler</div>
                <div class="rambler98-tagline">информационно-поисковая система</div>
              </td>
              <td class="rambler98-search-cell">
                <form class="rambler98-search-form" id="rambler-search-form">
                  <input type="text" id="rambler-query" class="rambler98-input" value="">
                  <button type="submit" class="win-btn rambler98-find">Найти!</button>
                </form>
                <div class="rambler98-search-links">
                  Популярно сегодня:
                  <a class="rambler-quick-link" data-q="курсы валют">курс доллара</a>,
                  <a class="rambler-quick-link" data-q="игры 1998">новые игры</a>,
                  <a class="rambler-quick-link" data-q="mp3 музыку">скачать MP3</a>,
                  <a class="rambler-quick-link" data-q="анекдоты">анекдоты</a>,
                  <a class="rambler-quick-link" data-q="чат кроватка">чат</a>
                </div>
              </td>
            </tr>
          </table>
          <div class="rambler98-date-bar">Четверг, 12 ноября 1998 г. &nbsp;|&nbsp; Серверов в индексе: 18&nbsp;420 &nbsp;|&nbsp; Документов: 1&nbsp;240&nbsp;000</div>

          <table class="rambler98-layout" cellspacing="0">
            <tr>
              <td class="rambler98-side">
                <div class="rambler98-box-title">Курсы ЦБ РФ</div>
                <table class="rambler98-grid rambler98-currency-table" cellspacing="1">
                  <tr><th></th><th>12.11</th><th>до 17.08</th></tr>
                  <tr><td>USD</td><td class="rambler98-up">20,80</td><td>6,20</td></tr>
                  <tr><td>DEM</td><td class="rambler98-up">12,45</td><td>3,40</td></tr>
                </table>
                <div class="rambler98-converter">
                  <input type="number" id="rambler-rubles" value="1000"> руб. =<br>
                  <b id="rambler-usd-result">$48.08</b>
                </div>

                <div class="rambler98-box-title">Погода</div>
                <table class="rambler98-grid rambler98-weather-table" cellspacing="1">
                  <tr><td>Москва</td><td>+7</td><td>дождь</td></tr>
                  <tr><td>С.-Петербург</td><td>+5</td><td>ветер</td></tr>
                  <tr><td>Новосибирск</td><td>-4</td><td>снег</td></tr>
                  <tr><td>Киев</td><td>+10</td><td>ясно</td></tr>
                </table>

                <div class="rambler98-box-title">Полезные ссылки</div>
                <div class="rambler98-projects">
                  <a data-url="http://www.yandex.ru">Поиск Яndex</a><br>
                  <a data-url="http://www.lib.ru">Библиотека</a><br>
                  <a data-url="http://fido.relcom.ru">FidoNet</a><br>
                  <a data-url="http://www.icq.com">ICQ-пейджер</a>
                </div>
              </td>
              <td class="rambler98-main">
                <div class="rambler98-top100-header">Rambler's Top100 &mdash; рейтинг сайтов Рунета <span>участников: 3&nbsp;420</span></div>
                ${top100.map(group => `
                <table class="rambler98-grid rambler98-top100-table" cellspacing="1">
                  <tr><th colspan="2" class="rambler98-cat-heading">${group.title}</th><th>Хосты</th><th>Хиты</th></tr>
                  ${group.sites.map(([url, name, desc, hosts, hits], i) => `
                  <tr>
                    <td class="rambler98-rank">${i + 1}.</td>
                    <td><a data-url="${url}">${name}</a> <span class="rambler98-desc">- ${desc}</span></td>
                    <td class="rambler98-count">${num(hosts)}</td>
                    <td class="rambler98-count">${num(hits)}</td>
                  </tr>`).join('')}
                </table>`).join('')}
                <p class="rambler98-top100-note">Статистика за 11.11.1998. Добавьте счётчик Top100 на свой сайт &mdash; <a data-url="http://www.geocities.com">это бесплатно</a>.</p>
              </td>
            </tr>
          </table>

          <div class="rambler98-footer">
            <span class="web-88 rambler98-counter"><b>Rambler's</b><br>Top100</span>
            <span class="web-88 rambler98-counter rambler98-counter-alt">1&nbsp;240&nbsp;000<br><b>документов</b></span>
            <p>&copy; 1996-1998 &laquo;Рамблер&raquo;. Оптимизировано для Internet Explorer 5.0 при 800x600.</p>
            <p>Зарегистрировать сайт в Rambler's Top100: ${this.mailLink('top100@rambler98.ru')}</p>
          </div>
        </div>
      </div>
    `;
  }

  attachRamblerEvents(win, container) {
    const searchForm = container.querySelector('#rambler-search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = container.querySelector('#rambler-query').value.trim();
        if (q) this.navigate(win, `http://www.search98.com/search?q=${encodeURIComponent(q)}`);
      });
    }

    container.querySelectorAll('.rambler-quick-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(win, `http://www.search98.com/search?q=${encodeURIComponent(link.dataset.q)}`);
      });
    });

    const rublesInput = container.querySelector('#rambler-rubles');
    const usdResult = container.querySelector('#rambler-usd-result');
    if (rublesInput && usdResult) {
      rublesInput.addEventListener('input', () => {
        const r = parseFloat(rublesInput.value) || 0;
        const usd = (r / 20.80).toFixed(2);
        usdResult.textContent = `$${usd}`;
      });
    }
  }

  getMp3TrackList() {
    return [
      { id: 'prodigy', artist: 'The Prodigy', title: 'Breathe', size: '3.8 MB', bitrate: '128 kbps', time: '3:59', genre: 'Big Beat / Electronic' },
      { id: 'offspring', artist: 'The Offspring', title: 'Pretty Fly (for a White Guy)', size: '3.2 MB', bitrate: '128 kbps', time: '3:08', genre: 'Punk Rock' },
      { id: 'fatboy', artist: 'Fatboy Slim', title: 'The Rockafeller Skank', size: '3.9 MB', bitrate: '128 kbps', time: '4:00', genre: 'Big Beat' },
      { id: 'splin', artist: 'Сплин', title: 'Выхода нет', size: '3.4 MB', bitrate: '128 kbps', time: '3:47', genre: 'Русский рок' },
      { id: 'mumiytroll', artist: 'Мумий Тролль', title: 'Владивосток 2000', size: '3.1 MB', bitrate: '128 kbps', time: '2:38', genre: 'Рокапопс' },
      { id: 'beastie', artist: 'Beastie Boys', title: 'Intergalactic', size: '3.5 MB', bitrate: '128 kbps', time: '3:32', genre: 'Hip Hop / Electro' },
      { id: 'madonna', artist: 'Madonna', title: 'Ray of Light', size: '4.2 MB', bitrate: '128 kbps', time: '4:35', genre: 'Dance / Pop' },
      { id: 'scooter', artist: 'Scooter', title: 'How Much Is The Fish?', size: '3.6 MB', bitrate: '128 kbps', time: '3:45', genre: 'Happy Hardcore' }
    ];
  }

  renderMp3Vault() {
    const tracks = this.getMp3TrackList();
    return `
      <div class="mp3vault-container">
        <div class="mp3vault-page">
          <table class="mp3vault-header" cellspacing="0">
            <tr>
              <td>
                <div class="mp3vault-logo">MP3<span>VAULT</span>'98</div>
                <div class="mp3vault-sub">underground audio archive &middot; MPEG-1 Layer-3 &middot; 128 kbps &middot; без регистрации</div>
              </td>
              <td class="mp3vault-badges">
                <a class="web-88 mp3vault-88" data-url="http://skins.winamp.com">${this.gif('bolt')}<br>GET WINAMP</a>
              </td>
            </tr>
          </table>
          <div class="mp3vault-menu">
            [ <a data-url="http://www.mp3vault98.com">Новые треки</a> ] [ <a data-url="http://skins.winamp.com">Скины Winamp</a> ] [ <a data-url="http://www.webcinema98.com">Клипы</a> ] [ <a data-url="http://chat.krovatka98.ru">Чат</a> ]
          </div>
          <p class="mp3vault-dialup-warning">${this.gif('warn')} <b>Модемщикам:</b> MP3 сжат в 11 раз по сравнению с Audio-CD. Трек в 3.5&nbsp;МБ качается по модему 56K примерно 8-12 минут. Слушайте в <b>Winamp 2.x</b>!</p>
          <table class="mp3vault-table" cellspacing="1">
            <tr>
              <th>#</th>
              <th>Исполнитель - Название</th>
              <th>Стиль</th>
              <th>Размер</th>
              <th>Время</th>
              <th>Файл</th>
            </tr>
            ${tracks.map((t, i) => `
            <tr>
              <td class="mp3vault-num">${String(i + 1).padStart(2, '0')}</td>
              <td><b>${t.artist}</b> - ${t.title}</td>
              <td class="mp3vault-genre">${t.genre}</td>
              <td class="mp3vault-size">${t.size}<br><span>${t.bitrate}</span></td>
              <td class="mp3vault-size">${t.time}</td>
              <td class="mp3vault-dl"><button class="btn-mp3-download" data-track-id="${t.id}">скачать</button></td>
            </tr>`).join('')}
          </table>
          <div class="mp3vault-player-info">
            ${this.gif('cd')} Все треки сохраняются в <code>C:\\My Documents\\Моя музыка</code> и сразу играют в Winamp.<br>
            Проигрыватель: Nullsoft Winamp 2.05 &mdash; <i>&laquo;It really whips the llama's ass!&raquo;</i>
          </div>
          <div class="mp3vault-footer">MP3 Vault '98 &middot; сервер в Сан-Хосе &middot; канал T3 &middot; Все треки &mdash; только для ознакомления! &middot; Заявки: ${this.mailLink('upload@mp3vault98.com')}</div>
        </div>
      </div>
    `;
  }

  attachMp3VaultEvents(win, container) {
    const tracks = this.getMp3TrackList();
    container.querySelectorAll('.btn-mp3-download').forEach(btn => {
      btn.addEventListener('click', () => {
        const trackId = btn.dataset.trackId;
        const track = tracks.find(t => t.id === trackId);
        if (!track) return;

        btn.disabled = true;
        btn.textContent = 'загрузка...';

        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = 'скачать';

          const fileName = `${track.artist} - ${track.title}.mp3`;
          const fileContent = `[ID3v1 MP3 Audio Track]\nTitle: ${track.title}\nArtist: ${track.artist}\nYear: 1998\nBitrate: 128 kbps\nSize: ${track.size}\nAudio Engine: Win 98 WaveOut`;

          if (window.vfs) {
            try {
              window.vfs.mkdir(['My Computer', 'C:', 'My Documents'], 'Моя музыка');
            } catch (e) {}
            window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Моя музыка'], fileName, fileContent);
          }

          if (window.soundSys) window.soundSys.playDing();

          window.winManager.openDialog({
            title: 'Загрузка MP3 завершена!',
            icon: 'info',
            message: `Файл <b>${fileName}</b> успешно скачан и сохранен в папку:<br><code>C:\\My Documents\\Моя музыка\\</code>`,
            buttons: [
              {
                text: 'Открыть в Winamp',
                bold: true,
                action: () => {
                  if (window.appWinamp) window.appWinamp.open();
                }
              },
              { text: 'ОК' }
            ]
          });
        }, 600);
      });
    });
  }

  renderAntiVirus() {
    const viruses = [
      ['Trojan.Win32.NotAVirus', 'троян', 'критический', 'файл totally_not_a_virus.exe на Рабочем столе, системные сбои'],
      ['Win95.CIH (Chernobyl)', 'файловый', 'катастрофический', 'стирает Flash BIOS и диски 26 апреля'],
      ['Macro.Word.Concept', 'макро', 'средний', 'заражает шаблон Normal.dot в Microslop Word'],
      ['OneHalf.3544', 'загрузочный', 'высокий', 'постепенно шифрует сектора жёсткого диска']
    ];
    return `
      <div class="antivirus-container">
        <table class="antivirus-header" cellspacing="0">
          <tr>
            <td class="antivirus-logo">${this.gif('shield', 2)} AntiVirus<span>Lab</span></td>
            <td class="antivirus-sub">Базы сигнатур от <b>15.11.1998</b><br>Известно вирусов: <b>17&nbsp;402</b></td>
          </tr>
        </table>
        <table class="antivirus-layout" cellspacing="0">
          <tr>
            <td class="antivirus-nav">
              <a data-url="http://www.antivirus98.com">Главная</a>
              <a data-url="http://www.antivirus98.com">Энциклопедия вирусов</a>
              <a data-url="http://www.antivirus98.com">Скачать</a>
              <a data-url="http://www.softstore98.com">Купить</a>
              <a data-url="http://fido.relcom.ru">Поддержка в FidoNet</a>
              <div class="antivirus-nav-note">Вирусная тревога:<br><b>812-555-0199</b></div>
            </td>
            <td class="antivirus-main">
              <div class="antivirus-alert-box">
                <div class="antivirus-alert-title">${this.gif('warn')} Вирусная тревога!</div>
                <p>В Рунете и сетях FidoNet распространяется троян <b>totally_not_a_virus.exe</b>. Он выдаёт себя за утилиту или подарок, а после запуска переименовывает системные файлы.</p>
                <p>Не забывайте о вирусе <b>CIH (&laquo;Чернобыль&raquo;)</b>: 26 апреля он стирает Flash BIOS материнской платы.</p>
              </div>

              <h3 class="antivirus-h">Онлайн-проверка диска C:</h3>
              <div class="antivirus-scan-card">
                <p>Проверяются загрузочный сектор, папка WINDOWS, Рабочий стол и &laquo;Мои документы&raquo;.</p>
                <div id="antivirus-scan-progress" class="antivirus-progress" style="display:none;">
                  <div class="antivirus-progress-row"><span id="antivirus-scan-status">Сканирование: C:\\WINDOWS\\SYSTEM...</span><span id="antivirus-scan-pct">0%</span></div>
                  <div class="antivirus-progress-track"><div id="antivirus-progress-bar" class="antivirus-progress-bar"></div></div>
                </div>
                <div id="antivirus-scan-result" class="antivirus-result" style="display:none;"></div>
                <button class="win-btn antivirus-btn-main" id="btn-antivirus-scan">Проверить диск C:</button>
                <button class="win-btn" id="btn-antivirus-download-cure">Скачать RetroCure.exe (412 КБ)</button>
              </div>

              <h3 class="antivirus-h">Энциклопедия вирусов</h3>
              <table class="antivirus-db-table" cellspacing="1">
                <tr><th>Имя</th><th>Тип</th><th>Опасность</th><th>Симптомы</th></tr>
                ${viruses.map(([name, type, level, symptoms]) => `
                <tr>
                  <td><b>${name}</b></td>
                  <td>${type}</td>
                  <td class="antivirus-level-${level === 'средний' ? 'mid' : 'high'}">${level}</td>
                  <td>${symptoms}</td>
                </tr>`).join('')}
              </table>
            </td>
          </tr>
        </table>
        <div class="antivirus-footer">&copy; 1998 AntiVirus Lab. Проверено нашим антивирусом &mdash; вирусов нет. Подозрительные файлы и письма: ${this.mailLink('virus@antivirus98.com')}</div>
      </div>
    `;
  }

  attachAntiVirusEvents(win, container) {
    const btnScan = container.querySelector('#btn-antivirus-scan');
    const progBox = container.querySelector('#antivirus-scan-progress');
    const progStatus = container.querySelector('#antivirus-scan-status');
    const progPct = container.querySelector('#antivirus-scan-pct');
    const progBar = container.querySelector('#antivirus-progress-bar');
    const resBox = container.querySelector('#antivirus-scan-result');

    if (btnScan) {
      btnScan.addEventListener('click', () => {
        btnScan.disabled = true;
        progBox.style.display = 'block';
        resBox.style.display = 'none';

        const steps = [
          { pct: 15, msg: 'Проверка системной памяти и загрузочной области MBR...' },
          { pct: 35, msg: 'Сканирование файлов ядра C:\\WINDOWS\\SYSTEM.DAT...' },
          { pct: 60, msg: 'Анализ исполняемых файлов в C:\\Program Files...' },
          { pct: 85, msg: 'Проверка файлов Рабочего стола C:\\Desktop...' },
          { pct: 100, msg: 'Анализ завершен.' }
        ];

        let i = 0;
        const interval = setInterval(() => {
          if (i >= steps.length) {
            clearInterval(interval);
            btnScan.disabled = false;

            const desktopItems = window.vfs && window.vfs.getDesktopItems ? window.vfs.getDesktopItems() : [];
            const virusItem = desktopItems.find(f => String(f.name || f.key).toLowerCase().includes('virus'));
            const foundVirus = !!virusItem;

            resBox.style.display = 'block';
            if (foundVirus) {
              if (window.soundSys) window.soundSys.playError();
              resBox.className = 'antivirus-result is-bad';
              resBox.innerHTML = `
                <b>${this.gif('warn')} Обнаружен вирус!</b><br>
                Файл <b>C:\\Desktop\\totally_not_a_virus.exe</b> заражён: Trojan.Win32.NotAVirus.<br>
                <button class="win-btn" id="btn-antivirus-cure-now">Удалить вирус</button>
              `;
              const btnCure = resBox.querySelector('#btn-antivirus-cure-now');
              if (btnCure) {
                btnCure.addEventListener('click', () => {
                  if (window.vfs && window.vfs.deleteItem) window.vfs.deleteItem([], virusItem.key);
                  if (window.soundSys) window.soundSys.playDing();
                  resBox.className = 'antivirus-result is-good';
                  resBox.innerHTML = `<b>${this.gif('check')} Вирус удалён.</b> Файл totally_not_a_virus.exe стёрт с Рабочего стола.`;
                });
              }
            } else {
              if (window.soundSys) window.soundSys.playDing();
              resBox.className = 'antivirus-result is-good';
              resBox.innerHTML = `<b>${this.gif('check')} Вирусов не найдено.</b><br>Проверено файлов: 1&nbsp;492. Резидентная защита активна.`;
            }
            return;
          }

          const s = steps[i];
          progBar.style.width = `${s.pct}%`;
          progPct.textContent = `${s.pct}%`;
          progStatus.textContent = s.msg;
          i++;
        }, 400);
      });
    }

    const btnDownloadCure = container.querySelector('#btn-antivirus-download-cure');
    if (btnDownloadCure) {
      btnDownloadCure.addEventListener('click', () => {
        if (window.vfs) {
          window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Downloads'], 'RetroCure.exe', '[RetroCure 98 Pro Antivirus Utility]');
        }
        if (window.soundSys) window.soundSys.playDing();
        window.winManager.openDialog({
          title: 'RetroCure 98 Pro',
          icon: 'info',
          message: 'Антивирусная утилита <b>RetroCure.exe</b> успешно сохранена в папку «Мои документы\\Downloads»!'
        });
      });
    }
  }

  publishAnekdot(text, date) {
    const jokes = this.getAnekdotList();
    jokes.unshift({ id: Date.now(), date, score: 1, text });
    try {
      localStorage.setItem(this.anekdotVotesKey + '_custom', JSON.stringify(jokes));
    } catch (e) {
      return false;
    }
    if (this.currentWin && this.currentUrl && this.identifyPageKey(this.currentUrl) === 'anekdot' && window.winManager && window.winManager.windows.has('app_ie')) {
      this.renderPage(this.currentWin, this.currentUrl);
    }
    return true;
  }

  getAnekdotList() {
    try {
      const custom = localStorage.getItem(this.anekdotVotesKey + '_custom');
      if (custom) return JSON.parse(custom);
    } catch (e) {}

    return [
      {
        id: 1,
        date: '15 ноября 1998',
        score: 142,
        text: 'Новый русский хвастается перед приятелем:\n— Слышь, брателло, вчера модем себе купил за тыщу баксов! На 56 килобит!\n— Ну и как, летает?\n— Да ваще ураган! Вчера целый час открывал фотографию «Мерседеса», так она сверху вниз полосками загружалась — прямо как жалюзи в офисе открываются!'
      },
      {
        id: 2,
        date: '10 ноября 1998',
        score: 98,
        text: 'Презентация Win 98. Билл Гейтс вставляет сканер в USB-порт, и на огромном экране перед многотысячным залом внезапно вылетает Синий Экран Смерти (BSOD).\nГейтс улыбается и говорит:\n— Должно быть, именно поэтому мы пока еще не выпустили Win 98 в продажу!'
      },
      {
        id: 3,
        date: '04 ноября 1998',
        score: 185,
        text: 'Звонок в службу техподдержки:\n— Здравствуйте, у меня на компьютере выдвижная подставка для кофе сломалась!\n— Какая еще подставка для кофе?!\n— Ну эта, кнопочку нажимаешь, из системника лоток выезжает, я туда чашку ставлю, а сегодня он внутрь уехал и чашку расколотил!\n— Женщина... это дисковод для лазерных компакт-дисков CD-ROM!!'
      },
      {
        id: 4,
        date: '28 октября 1998',
        score: 120,
        text: 'Сентябрь 1998 года. Разговаривают двое:\n— Слушай, ты доллары по 6 рублей успел сдать?\n— Нет, я держал их.\n— Молодец! А я успел поменять по 6.20, теперь сижу в деревянных рублях по курсу 20.80 и читаю экономические новости на Рамблере!'
      },
      {
        id: 5,
        date: '20 октября 1998',
        score: 76,
        text: 'Бабушка смотрит, как внук сидит за новеньким Pentium II:\n— Вовочка, а почему ты эту серую коробочку по резиновому коврику возишь?\n— Бабуля, это мышка!\n— Господи помилуй, до чего техника дошла! Живую мышку в пластмассу замуровали и хвостом к монитору привязали!'
      },
      {
        id: 6,
        date: '12 октября 1998',
        score: 154,
        text: 'Геймер возвращается под утро домой с красными глазами после ночи в компьютерном клубе за Quake II. Жена:\n— Ты где был?!\n— На третьем уровне строггов зачищал!\n— А почему от тебя пивом пахнет?!\n— Это аптечки +100 к здоровью!'
      }
    ];
  }

  renderAnekdot() {
    const jokes = this.getAnekdotList();
    let votesMap = {};
    try {
      votesMap = JSON.parse(localStorage.getItem(this.anekdotVotesKey)) || {};
    } catch (e) {}

    return `
      <div class="anekdot-container">
        <div class="anekdot-page">
          <div class="anekdot-header">
            <div class="anekdot-logo">${this.gif('laugh', 2)} Анекдоты из России</div>
            <div class="anekdot-sub">ежедневный выпуск &middot; составитель Дмитрий Вернер &middot; с 1995 года</div>
            <div class="anekdot-nav">Выпуск от 15 ноября 1998 г. &nbsp;|&nbsp; В выпуске анекдотов: <b>${jokes.length}</b> &nbsp;|&nbsp; <a id="btn-random-joke">Случайный анекдот</a> &nbsp;|&nbsp; <a id="anekdot-to-form">Прислать свой</a></div>
          </div>
          <div id="anekdot-cards-list">
            ${jokes.map((j, idx) => {
              const currentScore = j.score + (votesMap[j.id] || 0);
              return `
              <div class="anekdot-card" id="joke-${j.id}">
                <div class="anekdot-card-header"><b>${idx + 1}.</b> <i>${j.date}</i></div>
                <div class="anekdot-card-body">${this.escapeHtml(j.text).replace(/\n/g, '<br>')}</div>
                <div class="anekdot-vote-box">
                  Рейтинг: <b id="score-${j.id}">${currentScore}</b> &nbsp;
                  <button class="btn-joke-vote" data-id="${j.id}" data-delta="1" title="Смешно">+1</button>
                  <button class="btn-joke-vote" data-id="${j.id}" data-delta="-1" title="Баян">-1</button>
                </div>
              </div>
              <hr class="anekdot-hr">`;
            }).join('')}
          </div>
          <div class="anekdot-submit-box" id="anekdot-form">
            <b>Прислать анекдот в следующий выпуск</b><br>
            <textarea id="anekdot-new-text" rows="4" cols="60"></textarea><br>
            <button class="win-btn" id="btn-anekdot-submit">Отправить</button>
            <span class="anekdot-note">Баяны и анекдоты с матом не публикуются. Можно прислать и по почте: ${this.mailLink('anekdot@anekdot98.ru')}</span>
          </div>
          <div class="anekdot-footer">
            <span class="web-88 anekdot-88">Rambler's<br>Top100</span>
            <p>Анекдоты из России &copy; 1995-1998. Перепечатка с разрешения составителя.</p>
          </div>
        </div>
      </div>
    `;
  }

  attachAnekdotEvents(win, container) {
    container.querySelectorAll('.btn-joke-vote').forEach(btn => {
      btn.addEventListener('click', () => {
        const jokeId = parseInt(btn.dataset.id, 10);
        const delta = parseInt(btn.dataset.delta, 10);

        let votesMap = {};
        try {
          votesMap = JSON.parse(localStorage.getItem(this.anekdotVotesKey)) || {};
        } catch (e) {}

        votesMap[jokeId] = (votesMap[jokeId] || 0) + delta;
        localStorage.setItem(this.anekdotVotesKey, JSON.stringify(votesMap));

        if (window.soundSys) window.soundSys.playDing();
        this.renderPage(win, this.currentUrl);
      });
    });

    const btnRandom = container.querySelector('#btn-random-joke');
    if (btnRandom) {
      btnRandom.addEventListener('click', () => {
        const jokes = this.getAnekdotList();
        const rand = jokes[Math.floor(Math.random() * jokes.length)];
        const el = container.querySelector(`#joke-${rand.id}`);
        if (el) {
          el.scrollIntoView({ block: 'center' });
          el.style.backgroundColor = '#ffffc0';
          setTimeout(() => { el.style.backgroundColor = ''; }, 1200);
        }
      });
    }

    const toForm = container.querySelector('#anekdot-to-form');
    if (toForm) {
      toForm.addEventListener('click', () => {
        const form = container.querySelector('#anekdot-form');
        if (form) form.scrollIntoView({ block: 'start' });
        const field = container.querySelector('#anekdot-new-text');
        if (field) field.focus();
      });
    }

    const btnSubmit = container.querySelector('#btn-anekdot-submit');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        const textInput = container.querySelector('#anekdot-new-text');
        const text = textInput.value.trim();
        if (!text) return;

        this.publishAnekdot(text, 'Только что');

        if (window.soundSys) window.soundSys.playDing();
        this.renderPage(win, this.currentUrl);
      });
    }
  }

  getChatRoomMessages(room) {
    try {
      const data = localStorage.getItem(`${this.chatMessagesKey}_${room}`);
      if (data) return JSON.parse(data);
    } catch (e) {}

    const defaults = {
      general: [
        { user: 'Kitten98', color: '#cc0066', time: '14:20', text: 'Всем приветик в этом чате! Как настроение?' },
        { user: 'Vano_Pentium', color: '#0000cc', time: '14:21', text: 'Привет! Дозванивался до провайдера МТУ-Информ полчаса, всё занято было.' },
        { user: 'Admin_Dimon', color: '#008000', time: '14:22', text: 'Не флудите, народ. Напоминаю: мат запрещен, реклама бан.' },
        { user: 'Kitten98', color: '#cc0066', time: '14:23', text: 'Кто сегодня вечером в Фидо или в IRC сидеть будет?' }
      ],
      tech: [
        { user: 'Overclocker', color: '#0000cc', time: '14:10', text: 'Народ, поставил шину 100 МГц на Celeron 300A — завелся на 450 МГц стабильно!' },
        { user: 'SysAdmin_98', color: '#800000', time: '14:12', text: 'Кулер какой? У меня на обычном боксовом грелся до 65 градусов.' },
        { user: 'Voodoo_Boy', color: '#008000', time: '14:15', text: 'Вчера вторую Voodoo 2 в SLI воткнул. Quake II в 1024x768 летает как птица!' }
      ],
      flirt: [
        { user: 'Romantic98', color: '#cc0066', time: '14:05', text: 'Девушки из Москвы, кто хочет погулять на Арбате? Пишите в аську 1829472.' },
        { user: 'Alena_Blonde', color: '#0000cc', time: '14:08', text: 'А сколько тебе лет и какой у тебя комп? :)' },
        { user: 'Romantic98', color: '#cc0066', time: '14:10', text: '19 лет, студент МГТУ Баумана, комп Pentium II 350!' }
      ]
    };

    return defaults[room] || defaults.general;
  }

  saveChatRoomMessages(room, msgs) {
    try {
      localStorage.setItem(`${this.chatMessagesKey}_${room}`, JSON.stringify(msgs));
    } catch (e) {}
  }

  renderChat() {
    const room = this.activeChatRoom || 'general';
    const msgs = this.getChatRoomMessages(room);
    const rooms = [['general', 'Разговоры обо всём'], ['tech', 'Компьютерщики'], ['flirt', 'Знакомства']];
    const users = {
      general: ['Kitten98', 'Vano_Pentium', 'Admin_Dimon', 'WebWanderer', 'Masha_M', 'Neo_Hacker98'],
      tech: ['Overclocker', 'SysAdmin_98', 'Voodoo_Boy', 'Celeron300A'],
      flirt: ['Romantic98', 'Alena_Blonde', 'SweetGirl', 'Prince_Moscow']
    }[room] || [];
    const smileys = (text) => text
      .replace(/:-?\)/g, this.gif('smile'))
      .replace(/:-?\(/g, this.gif('sad'))
      .replace(/:-?D/g, this.gif('grin'));

    return `
      <div class="krovatka-container">
        <table class="krovatka-header" cellspacing="0">
          <tr>
            <td class="krovatka-logo">Кроватка<span>'98</span></td>
            <td class="krovatka-stats">В чате: <b>148</b> человек<br>Комната: <b>${(rooms.find(([id]) => id === room) || rooms[0])[1]}</b></td>
          </tr>
        </table>
        <div class="krovatka-tabs">
          Комнаты:
          ${rooms.map(([id, label]) => `<a class="krovatka-tab ${room === id ? 'active' : ''}" data-room="${id}">${label}</a>`).join(' | ')}
        </div>
        <table class="krovatka-frames" cellspacing="0">
          <tr>
            <td class="krovatka-frame-main">
              <div class="krovatka-messages-stream" id="krovatka-stream">
                ${msgs.map(m => `
                <div class="krovatka-msg-line">
                  <span class="krovatka-time">${m.time}</span>
                  <b class="krovatka-nick" style="color:${m.color || '#000080'};">${this.escapeHtml(m.user)}:</b>
                  <span class="krovatka-text">${smileys(this.escapeHtml(m.text))}</span>
                </div>`).join('')}
              </div>
            </td>
            <td class="krovatka-frame-users">
              <div class="krovatka-users">
                <b>Здесь (${users.length + 1}):</b>
                ${users.concat(['RetroUser98']).map(u => `<div>${this.gif('user')} ${u}</div>`).join('')}
              </div>
            </td>
          </tr>
          <tr>
            <td colspan="2" class="krovatka-frame-input">
              <div class="krovatka-input-area">
                Ник: <input type="text" id="krovatka-nick" value="RetroUser98">
                Сообщение: <input type="text" id="krovatka-msg">
                <button class="win-btn" id="btn-krovatka-send">Сказать</button>
              </div>
            </td>
          </tr>
        </table>
        <div class="krovatka-footer">Правила: не материться, не флудить, рекламу не давать. Нарушителей банит Admin_Dimon (${this.mailLink('admin@krovatka98.ru')}).</div>
      </div>
    `;
  }

  attachChatEvents(win, container) {
    container.querySelectorAll('.krovatka-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeChatRoom = tab.dataset.room;
        this.renderPage(win, this.currentUrl);
      });
    });

    const stream = container.querySelector('#krovatka-stream');
    if (stream) stream.scrollTop = stream.scrollHeight;

    const sendMsg = () => {
      const nickInput = container.querySelector('#krovatka-nick');
      const msgInput = container.querySelector('#krovatka-msg');
      const nick = nickInput.value.trim() || 'Гость';
      const text = msgInput.value.trim();

      if (!text) return;

      const room = this.activeChatRoom || 'general';
      const msgs = this.getChatRoomMessages(room);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      msgs.push({
        user: nick,
        color: '#800080',
        time: timeStr,
        text: text
      });
      this.saveChatRoomMessages(room, msgs);

      if (window.soundSys) window.soundSys.playDing();
      msgInput.value = '';
      this.renderPage(win, this.currentUrl);

      setTimeout(() => {
        const botReplies = {
          general: [
            { user: 'Kitten98', color: '#cc0066', text: `Прикольно сказано, ${nick}!` },
            { user: 'Vano_Pentium', color: '#0000cc', text: 'Согласен, в 98 году интернет был душевнее.' },
            { user: 'WebWanderer', color: '#008000', text: 'Кто знает хороший сайт с MP3? Кроме MP3 Vault?' }
          ],
          tech: [
            { user: 'Overclocker', color: '#0000cc', text: `Точно подмечено, ${nick}! Главное термопасту КПТ-8 не жалеть.` },
            { user: 'SysAdmin_98', color: '#800000', text: 'А я сегодня сервер на Win NT 4.0 настраивал, сказка!' }
          ],
          flirt: [
            { user: 'Alena_Blonde', color: '#0000cc', text: `${nick}, а у тебя пейджер есть? Напиши номер!` },
            { user: 'SweetGirl', color: '#cc0066', text: 'Привет новому гостю нашего чата! :)' }
          ]
        };
        const pool = botReplies[room] || botReplies.general;
        const bot = pool[Math.floor(Math.random() * pool.length)];
        const bNow = new Date();
        const bTime = `${String(bNow.getHours()).padStart(2, '0')}:${String(bNow.getMinutes()).padStart(2, '0')}`;

        const freshMsgs = this.getChatRoomMessages(room);
        freshMsgs.push({
          user: bot.user,
          color: bot.color,
          time: bTime,
          text: bot.text
        });
        this.saveChatRoomMessages(room, freshMsgs);
        if (window.soundSys) window.soundSys.playDing();

        if (this.identifyPageKey(this.currentUrl) === 'chat') {
          this.renderPage(win, this.currentUrl);
        }
      }, 1500);
    };

    const btnSend = container.querySelector('#btn-krovatka-send');
    const msgInput = container.querySelector('#krovatka-msg');
    if (btnSend) btnSend.addEventListener('click', sendMsg);
    if (msgInput) {
      msgInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMsg();
      });
    }
  }

  renderGeoCities(url) {
    const esc = (v) => this.escapeHtml(v);
    let customPages = {};
    try {
      customPages = JSON.parse(localStorage.getItem(this.geocitiesPagesKey)) || {};
    } catch (e) {}

    const cleanUrl = url.toLowerCase();
    for (const pageKey in customPages) {
      if (cleanUrl.includes(pageKey.toLowerCase())) {
        const p = customPages[pageKey];
        const theme = ['space', 'matrix', 'fire'].includes(p.bgStyle) ? p.bgStyle : 'classic';
        const icon = { space: 'alien', matrix: 'pc', fire: 'flame', classic: 'home' }[theme];
        const visits = String(100 + (p.title || '').length * 37).padStart(6, '0');
        return `
          <div class="geocities-user-page geocities-theme-${theme}">
            <div class="geocities-user-inner">
              <a href="#" id="btn-geocities-home" class="geocities-user-back">&laquo; GeoCities / ${esc(p.neighborhood)}</a>
              <marquee scrollamount="4" class="geocities-user-marquee">*** Welcome to ${esc(p.title)} *** Thanks for stopping by! ***</marquee>
              <h1>${this.gif(icon, 2)} ${esc(p.title)} ${this.gif(icon, 2)}</h1>
              <p class="geocities-user-by">by <b>${esc(p.author)}</b></p>
              <div class="web-construct"></div>
              <p class="geocities-user-content">${esc(p.content).replace(/\n/g, '<br>')}</p>
              <div class="web-construct"></div>
              <p class="geocities-user-links">
                ${this.gif('mail')} <a data-url="http://www.retro-web.net/guestbook">Sign my guestbook!</a> &nbsp;
                ${this.gif('star')} <a data-url="http://www.search98.com">Cool links</a>
              </p>
              <p>You are visitor number<br><span class="web-counter">${[...visits].map(d => `<span>${d}</span>`).join('')}</span></p>
              <p class="geocities-user-badges">
                <span class="web-88 geocities-88-ie">Microslop<br><b>IE 5.0</b></span>
                <span class="web-88 geocities-88-note">made with<br><b>NOTEPAD</b></span>
                <span class="web-88 geocities-88-geo">GeoCities<br><b>${esc(p.neighborhood)}</b></span>
              </p>
              <p class="geocities-user-small">Best viewed with Microslop Internet Explorer 5.0 at 800x600.</p>
            </div>
          </div>
        `;
      }
    }

    const hoods = [
      ['SiliconValley', 'pc', 'компьютеры, железо, Win 98 и программирование', 'http://www.geocities.com/SiliconValley/Pico/1998/index.html'],
      ['Area51', 'alien', 'НЛО, Секретные материалы и паранормальное', 'http://www.geocities.com/Area51/Vault/truth.html'],
      ['SunsetStrip', 'guitar', 'рок, металл, MP3 и концерты', 'http://www.geocities.com/SunsetStrip/Rock/tours.html'],
      ['Tokyo', 'joy', 'аниме, манга и японские игры', 'http://www.geocities.com/Tokyo/Arcade/anime.html']
    ];
    const moreHoods = ['Athens', 'CapitolHill', 'Heartland', 'Hollywood', 'MotorCity', 'Paris', 'Pentagon', 'Vienna', 'Yosemite'];

    return `
      <div class="geocities-container">
        <table class="geocities-header" cellspacing="0">
          <tr>
            <td class="geocities-logo">${this.gif('globe', 2)}<span class="geocities-logo-geo">Geo</span><span class="geocities-logo-cities">Cities</span></td>
            <td class="geocities-sub">Бесплатные домашние страницы<br><b>1&nbsp;500&nbsp;000</b> жителей и растём!</td>
          </tr>
        </table>
        <div class="geocities-navbar">
          <a data-url="http://www.geocities.com">Главная</a> |
          <a data-url="http://www.geocities.com">Районы</a> |
          <a id="gc-to-builder">Построить страницу</a> |
          <a data-url="http://www.search98.com">Поиск</a> |
          <a data-url="http://www.microslop.com">Помощь</a>
        </div>
        <table class="geocities-layout" cellspacing="0">
          <tr>
            <td class="geocities-side">
              <div class="geocities-side-title">Районы</div>
              ${hoods.map(([name, icon, , link]) => `<div>${this.gif(icon)} <a class="geocities-sample-link" data-url="${link}">${name}</a></div>`).join('')}
              ${moreHoods.map(name => `<div class="geocities-side-plain">${this.gif('ball-blue')} ${name}</div>`).join('')}
            </td>
            <td class="geocities-main">
              <h2 class="geocities-h">Добро пожаловать в GeoCities!</h2>
              <p>Получите бесплатно <b>2 МБ</b> под свою домашнюю страницу. Выберите район по интересам, вставьте текст &mdash; и через минуту вас увидит весь Интернет.</p>
              <h3 class="geocities-h3">Лучшие страницы недели</h3>
              <table class="geocities-neighborhoods-grid" cellspacing="0">
                ${hoods.map(([name, icon, desc, link]) => `
                <tr>
                  <td class="geocities-nhood-icon">${this.gif(icon, 2)}</td>
                  <td><b>${name}</b> &mdash; ${desc}<br><a class="geocities-sample-link" data-url="${link}">Посетить страницу жителя &raquo;</a></td>
                </tr>`).join('')}
              </table>

              <h3 class="geocities-h3" id="gc-builder">${this.gif('home')} Конструктор домашней страницы</h3>
              <table class="geocities-builder-box" cellspacing="0">
                <tr>
                  <td class="geocities-label">Район:</td>
                  <td><select id="gc-neighborhood">
                    <option value="SiliconValley">SiliconValley (компьютеры)</option>
                    <option value="Area51">Area51 (НЛО и фантастика)</option>
                    <option value="SunsetStrip">SunsetStrip (музыка)</option>
                    <option value="Tokyo">Tokyo (аниме и игры)</option>
                  </select></td>
                </tr>
                <tr>
                  <td class="geocities-label">Заголовок:</td>
                  <td><input type="text" id="gc-title" value="My Awesome Win 98 Lair" size="40"></td>
                </tr>
                <tr>
                  <td class="geocities-label">Автор:</td>
                  <td><input type="text" id="gc-author" value="CyberSurfer98" size="20"></td>
                </tr>
                <tr>
                  <td class="geocities-label">Оформление:</td>
                  <td><select id="gc-theme">
                    <option value="classic">Classic (серый фон)</option>
                    <option value="space">Deep Space (звёзды)</option>
                    <option value="matrix">Matrix (зелёный на чёрном)</option>
                    <option value="fire">Flame (огонь)</option>
                  </select></td>
                </tr>
                <tr>
                  <td class="geocities-label">Текст:</td>
                  <td><textarea id="gc-content" rows="4" cols="46">Welcome to my personal corner on the web! Here you will find my favorite computer games, links to Steam and cool MP3 music downloads. Don't forget to sign my guestbook!</textarea></td>
                </tr>
                <tr>
                  <td></td>
                  <td><button class="win-btn" id="btn-gc-publish">Опубликовать страницу</button></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div class="geocities-footer">GeoCities &copy; 1995-1998 &middot; <a data-url="http://www.geocities.com">Правила</a> &middot; <a data-url="http://www.geocities.com">Реклама</a> &middot; Member Services: ${this.mailLink('support@geocities.com')}</div>
      </div>
    `;
  }

  attachGeoCitiesEvents(win, container) {
    const btnBack = container.querySelector('#btn-geocities-home');
    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(win, 'http://www.geocities.com');
      });
    }

    container.querySelectorAll('.geocities-sample-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const url = link.dataset.url;
        let customPages = {};
        try {
          customPages = JSON.parse(localStorage.getItem(this.geocitiesPagesKey)) || {};
        } catch (e) {}

        if (url.includes('Pico')) {
          customPages['SiliconValley/Pico/1998/index.html'] = {
            neighborhood: 'SiliconValley',
            title: "Hacker Neo's 98 Cyber Dungeon",
            author: 'Neo98',
            bgStyle: 'matrix',
            content: 'Wake up, Neo... The Matrix has you. Follow the white rabbit.\n\nPC Specs: Pentium II 400 MHz, 128 MB SDRAM, Riva TNT 16 MB.\nFavorite OS: Win 98 SE with Internet Explorer 5.0.\nCheck out my cool links: http://www.3dfx-zone.com and http://www.mp3vault98.com!'
          };
        } else if (url.includes('Area51')) {
          customPages['Area51/Vault/truth.html'] = {
            neighborhood: 'Area51',
            title: 'Roswell 1947 & The Truth Behind UFOs',
            author: 'Agent_Mulder',
            bgStyle: 'space',
            content: 'THE TRUTH IS OUT THERE.\nGovernment files leaked in Nevada show alien wreckage in hangar 18. Trust no one. Deny everything.'
          };
        } else if (url.includes('SunsetStrip')) {
          customPages['SunsetStrip/Rock/tours.html'] = {
            neighborhood: 'SunsetStrip',
            title: 'Heavy Metal & 90s Grunge Station',
            author: 'GuitarHero98',
            bgStyle: 'fire',
            content: 'Rock never dies! Check out tour dates for The Offspring and Metallica in 1998-1999! Download free guitar tabs and MP3 riffs.'
          };
        } else if (url.includes('Tokyo')) {
          customPages['Tokyo/Arcade/anime.html'] = {
            neighborhood: 'Tokyo',
            title: 'Neo Tokyo Anime & JRPG Vault',
            author: 'Otaku_Shinji',
            bgStyle: 'classic',
            content: 'Welcome to the best Neon Genesis Evangelion and Final Fantasy VII fansite on GeoCities! Favorite character: Asuka Langley Soryu.'
          };
        }

        localStorage.setItem(this.geocitiesPagesKey, JSON.stringify(customPages));
        this.navigate(win, url);
      });
    });

    const toBuilder = container.querySelector('#gc-to-builder');
    if (toBuilder) {
      toBuilder.addEventListener('click', () => {
        const builder = container.querySelector('#gc-builder');
        if (builder) builder.scrollIntoView({ block: 'start' });
      });
    }

    const btnPublish = container.querySelector('#btn-gc-publish');
    if (btnPublish) {
      btnPublish.addEventListener('click', () => {
        const nhood = container.querySelector('#gc-neighborhood').value;
        const title = container.querySelector('#gc-title').value.trim() || 'My Webpage';
        const author = container.querySelector('#gc-author').value.trim() || 'Anonymous';
        const theme = container.querySelector('#gc-theme').value;
        const content = container.querySelector('#gc-content').value.trim() || 'Hello World!';

        const pageSlug = `${nhood}/${author.toLowerCase().replace(/[^a-z0-9]/g, '_')}_home.html`;
        let customPages = {};
        try {
          customPages = JSON.parse(localStorage.getItem(this.geocitiesPagesKey)) || {};
        } catch (e) {}

        customPages[pageSlug] = {
          neighborhood: nhood,
          title: title,
          author: author,
          bgStyle: theme,
          content: content
        };

        localStorage.setItem(this.geocitiesPagesKey, JSON.stringify(customPages));
        if (window.soundSys) window.soundSys.playDing();

        this.navigate(win, `http://www.geocities.com/${pageSlug}`);
      });
    }
  }

  renderDimaCounterBox(digitsHTML) {
    const mail = window.appOutlook;
    const addr = 'dima@geocities.com';
    if (!mail || !mail.flag(addr, 'nocounter')) {
      return `
            <div class="dima-counter-box">
              <div style="font-size:10px; color:#ffff00; font-weight:bold;">ВЫ ПОСЕТИТЕЛЬ №:</div>
              <div class="dima-counter-digits">
                ${digitsHTML}
              </div>
              <div style="font-size:9px; color:#888; margin-top:2px;">Счетчик на Perl CGI</div>
            </div>`;
    }
    const note = mail.flag(addr, 'took')
      ? 'Днём делаю сайты в студии, страничку обновляю по выходным.'
      : mail.flag(addr, 'stayed')
        ? 'В студию не пошёл. Сайт обновляется каждый вечер!'
        : 'Днём строгие сайты, вечером эта страничка.';
    return `
            <div class="dima-counter-box">
              <div class="dima-counter-gone-title">СЧЁТЧИК СНЯТ</div>
              <div class="dima-counter-gone-note">Он считал щелчки, а не людей. Людей считают письма.</div>
              <div class="dima-counter-gone-note">${note}</div>
              <a class="dima-counter-gone-mail" href="mailto:dima@geocities.com">${this.gif('mail')} Напиши мне!</a>
            </div>`;
  }

  renderDimaWebmasterPage() {
    this.dimaActiveTab = this.dimaActiveTab || 'home';
    this.dimaBabySpeed = this.dimaBabySpeed || 'normal';

    let hits = 542;
    try {
      hits = parseInt(localStorage.getItem('win98_dima_site_hits') || '542', 10);
      if (!this._dimaHitCounted) {
        hits++;
        localStorage.setItem('win98_dima_site_hits', hits.toString());
        this._dimaHitCounted = true;
      }
    } catch (e) {}
    const digits = String(hits).padStart(6, '0').split('');
    const digitsHTML = digits.map(d => `<span class="dima-counter-digit">${d}</span>`).join('');

    let guestbook = [];
    try {
      guestbook = JSON.parse(localStorage.getItem('win98_dima_guestbook') || '[]');
    } catch (e) {}
    if (!Array.isArray(guestbook) || guestbook.length === 0) {
      guestbook = [
        {
          author: 'Сисадмин Борис',
          uin: '777666',
          date: '18.10.1998 16:42',
          message: 'Дима, во фреймах полосы прокрутки разъехались в Netscape 3.0! А танцующий ребенок зачетный, посмеялись всем отделом в серверной :)'
        },
        {
          author: 'Лена_Студентка',
          uin: '554433',
          date: '19.10.1998 12:15',
          message: 'Приветик! Очень красивый сайт получился! Только музыка громко заиграла, я аж испугалась :))) Добавила в закладки!'
        },
        {
          author: 'Neo_Hacker98',
          uin: '133742',
          date: '20.10.1998 01:23',
          message: 'Follow the white rabbit... Неплохо для рукописного HTML без табличной оптимизации. Танцующий ребенок — классика CG.'
        },
        {
          author: 'Серёга (Quake-Мастер)',
          uin: '666999',
          date: '21.10.1998 19:04',
          message: 'Диман, сайт зачетный, но когда в Quake пойдешь? Хватит теги строчить, го на q2dm1 "The Edge" на рельсах рубиться!'
        },
        {
          author: 'Аня_Фидошница',
          uin: '204899',
          date: '22.10.1998 22:30',
          message: 'Привет из Фидонета (2:5020/400.12)! Классная страничка. На пойнтовке покажешь, как на Perl счетчик написал.'
        }
      ];
      try {
        localStorage.setItem('win98_dima_guestbook', JSON.stringify(guestbook));
      } catch (e) {}
    }

    let mainContentHTML = '';
    if (this.dimaActiveTab === 'home') {
      mainContentHTML = `
        <div class="dima-table-box">
          <div class="dima-table-header">Приветствую всех странников Рунета и пользователей ICQ!</div>
          <div class="dima-table-body">
            <p style="margin-top:0;">
              Вы находитесь на <strong>официальной домашней страничке Вебмастера Димы</strong> (Dima_Webmaster / WebLord98),
              размещенной в легендарном квартале <em>SiliconValley</em> на серверах <strong>GeoCities</strong>!
            </p>
            <p>
              Я верстаю этот сайт вручную в Блокноте (Notepad) на чистом <strong>HTML 3.2</strong> с использованием <strong>фреймов и таблиц</strong>.
              Здесь нет тяжеловесных скриптов, только чистый дух эпохи Web 1.0!
            </p>

            <div style="background:#ffffd0; border:2px dashed #cc9900; padding:8px 12px; margin:12px 0; font-size:12px;">
              <strong>${this.gif('lock')} Секретный доступ:</strong><br>
              Этот сайт <u>намеренно не добавлен</u> на главную страницу Internet Explorer или в публичные каталоги.
              Ссылку на него получают <strong>только мои друзья через чат ICQ 98a</strong> (мой UIN: <code>#313370</code>).
              Вы — один из избранных гостей!
            </div>
          </div>
        </div>

        <div class="dima-table-box">
          <div class="dima-table-header dima-table-header-hot">
            ${this.gif('flame')} ГЛАВНЫЙ ЭКСПОНАТ: КУЛЬТОВЫЙ 3D ТАНЦУЮЩИЙ РЕБЕНОК (BABY CHA-CHA)! ${this.gif('flame')}
          </div>
          <div class="dima-table-body" style="text-align:center;">
            <p style="font-size:12px; color:#555; margin-top:0;">
              Анимация Baby Cha-Cha из 3D Studio MAX (1996 год) — главный визуальный мем Интернета 1998 года!
              Я качал этот ролик через модем 33.6k целых 45 минут, конвертировал в GIF и вставил сюда!
            </p>

            <div class="dancing-baby-stage">
              <div class="dancing-baby-speech" id="dima-baby-speech">
                ${this.dimaBabySpeed === 'turbo' ? '*** УУУИИИИ! ТУРБО-ТАНЕЦ! ***' : this.dimaBabySpeed === 'chacha' ? '*** OOGA-CHAKA OOGA-OOGA! ***' : 'Cha-Cha-Cha! Танцуем под 90-е!'}
              </div>
              <div class="dancing-baby-wrapper ${this.dimaBabySpeed}" id="dima-baby-wrapper">
                <svg class="dancing-baby-svg ${this.dimaBabySpeed}" id="dima-baby-actor" viewBox="0 0 140 180" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="dimaBabySkin" cx="40%" cy="35%" r="65%">
                      <stop offset="0%" stop-color="#ffe6d6"/>
                      <stop offset="60%" stop-color="#f5ba9c"/>
                      <stop offset="100%" stop-color="#cb7e58"/>
                    </radialGradient>
                    <radialGradient id="dimaBabyCheek" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#ff7777" stop-opacity="0.6"/>
                      <stop offset="100%" stop-color="#ff7777" stop-opacity="0"/>
                    </radialGradient>
                    <linearGradient id="dimaDiaperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#ffffff"/>
                      <stop offset="70%" stop-color="#dedede"/>
                      <stop offset="100%" stop-color="#aaaaaa"/>
                    </linearGradient>
                  </defs>

                  <g id="dima-baby-group">
                    <ellipse cx="48" cy="148" rx="14" ry="19" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>
                    <ellipse cx="43" cy="163" rx="11" ry="8" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>
                    <ellipse cx="92" cy="148" rx="14" ry="19" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>
                    <ellipse cx="97" cy="163" rx="11" ry="8" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>

                    <path d="M 40 108 Q 70 145 100 108 Q 96 142 70 144 Q 44 142 40 108 Z" fill="url(#dimaDiaperGrad)" stroke="#707070" stroke-width="1.2"/>
                    <ellipse cx="70" cy="114" rx="28" ry="10" fill="none" stroke="#ccc" stroke-width="1"/>
                    <path d="M 82 118 L 92 115" stroke="#e6b800" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="93" cy="115" r="2.5" fill="#ffd700"/>

                    <ellipse cx="70" cy="92" rx="27" ry="24" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>
                    <circle cx="70" cy="98" r="1.5" fill="#ab6644"/>

                    <path d="M 45 78 Q 22 84 20 62 Q 26 56 36 68 Z" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>
                    <circle cx="20" cy="62" r="6.5" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>
                    <path d="M 95 78 Q 118 84 120 62 Q 114 56 104 68 Z" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>
                    <circle cx="120" cy="62" r="6.5" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>

                    <circle cx="70" cy="46" r="28" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>
                    <circle cx="42" cy="46" r="6" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>
                    <circle cx="98" cy="46" r="6" fill="url(#dimaBabySkin)" stroke="#9a5a3a" stroke-width="0.8"/>
                    <ellipse cx="56" cy="52" rx="7" ry="4" fill="url(#dimaBabyCheek)"/>
                    <ellipse cx="84" cy="52" rx="7" ry="4" fill="url(#dimaBabyCheek)"/>
                    <ellipse cx="59" cy="42" rx="4.5" ry="6" fill="#fff" stroke="#333" stroke-width="0.8"/>
                    <circle cx="60" cy="43" r="3" fill="#3a6088"/>
                    <circle cx="61" cy="41" r="1.2" fill="#fff"/>
                    <ellipse cx="81" cy="42" rx="4.5" ry="6" fill="#fff" stroke="#333" stroke-width="0.8"/>
                    <circle cx="80" cy="43" r="3" fill="#3a6088"/>
                    <circle cx="81" cy="41" r="1.2" fill="#fff"/>
                    <path d="M 54 35 Q 60 32 64 35" stroke="#84482b" stroke-width="1.2" fill="none"/>
                    <path d="M 76 35 Q 80 32 86 35" stroke="#84482b" stroke-width="1.2" fill="none"/>
                    <ellipse cx="70" cy="49" rx="2" ry="1.5" fill="#bc7754"/>
                    <path d="M 62 55 Q 70 65 78 55 Z" fill="#992222" stroke="#551111" stroke-width="0.8"/>
                    <path d="M 65 55 Q 70 59 75 55" fill="#fff"/>
                    <ellipse cx="70" cy="61" rx="3.5" ry="2" fill="#ff7777"/>
                    <path d="M 70 18 Q 74 10 70 8 Q 66 12 70 18" fill="#84482b"/>
                  </g>
                </svg>
              </div>
              <div class="dancing-baby-shadow"></div>
            </div>

            <div style="display:flex; justify-content:center; gap:6px; margin-top:8px;">
              <button class="win-btn btn-baby-speed" data-speed="normal" style="${this.dimaBabySpeed === 'normal' ? 'font-weight:bold; background:#ffffcc;' : ''}">Обычный танец</button>
              <button class="win-btn btn-baby-speed" data-speed="turbo" style="${this.dimaBabySpeed === 'turbo' ? 'font-weight:bold; background:#ffffcc;' : ''}">Турбо-танец (Faster!)</button>
              <button class="win-btn btn-baby-speed" data-speed="chacha" style="${this.dimaBabySpeed === 'chacha' ? 'font-weight:bold; background:#ffffcc;' : ''}">Cha-Cha Mode!</button>
            </div>
          </div>
        </div>
      `;
    } else if (this.dimaActiveTab === 'about') {
      mainContentHTML = `
        <div class="dima-table-box">
          <div class="dima-table-header">О Вебмастере Диме и моем компьютере</div>
          <div class="dima-table-body">
            <p style="margin-top:0;">
              <strong>Имя:</strong> Дмитрий Соколов (в сети Dima_Webmaster)<br>
              <strong>Возраст:</strong> 21 год (родился в 1977 году)<br>
              <strong>Город:</strong> Санкт-Петербург, Васильевский остров<br>
              <strong>ICQ UIN:</strong> <a href="#" style="color:#000080; font-weight:bold;">#313370</a><br>
              <strong>E-mail:</strong> <a href="mailto:dima@geocities.com">dima@geocities.com</a><br>
              <strong>Учёба:</strong> СПбГУ, Факультет прикладной математики - процессов управления (ПМ-ПУ)<br>
              <strong>Интересы:</strong> HTML 3.2, JavaScript 1.2, фреймы, таблицы, Quake II, группа Руки Вверх, ночной серфинг по модему
            </p>

            <h4 style="color:#000080; border-bottom:1px solid #ccc; padding-bottom:4px; margin-bottom:8px;">Конфигурация моего рабочего компьютера (Монстр 1998 года!):</h4>
            <table style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #808080;" border="1" cellpadding="5">
              <tr style="background:#e0e0f0;">
                <th style="text-align:left; width:130px;">Компонент</th>
                <th style="text-align:left;">Характеристики</th>
              </tr>
              <tr>
                <td><strong>Процессор:</strong></td>
                <td>Intel Pentium II 300 MHz Deschutes (разогнан по шине 100 МГц до 350 МГц!)</td>
              </tr>
              <tr>
                <td><strong>Материнская плата:</strong></td>
                <td>ASUS P2B (легендарный чипсет Intel 440BX, Slot 1)</td>
              </tr>
              <tr>
                <td><strong>Оперативная память:</strong></td>
                <td>64 MB SDRAM PC100 (два модуля SEC по 32 MB)</td>
              </tr>
              <tr>
                <td><strong>Видеоподсистема:</strong></td>
                <td>2D: S3 Trio64V2/DX 2MB PCI + 3D-ускоритель Diamond Monster 3D II 12MB (3dfx Voodoo 2!)</td>
              </tr>
              <tr>
                <td><strong>Звуковая карта:</strong></td>
                <td>Creative Sound Blaster AWE64 Gold (настоящий волновой синтез MIDI!)</td>
              </tr>
              <tr>
                <td><strong>Жесткий диск:</strong></td>
                <td>Quantum Fireball EX 4.3 GB Ultra DMA/33 (хватит на все игры и MP3!)</td>
              </tr>
              <tr>
                <td><strong>Модем:</strong></td>
                <td>USRobotics Sportster Voice 33.6 Flash (прошит в 56k V.90 / x2)</td>
              </tr>
              <tr>
                <td><strong>CD-привод:</strong></td>
                <td>Mitsumi 32x Max E-IDE</td>
              </tr>
              <tr>
                <td><strong>Монитор:</strong></td>
                <td>15" Sony Trinitron Multiscan 100ES (плоский кинескоп, 800x600 @ 85 Hz)</td>
              </tr>
            </table>
          </div>
        </div>
      `;
    } else if (this.dimaActiveTab === 'games') {
      mainContentHTML = `
        <div class="dima-table-box">
          <div class="dima-table-header">Мои любимые компьютерные игры 1998 года</div>
          <div class="dima-table-body">
            <p style="margin-top:0;">
              Когда модем свободен от верстки HTML, я рублюсь в лучшие 3D-игры с графикой Glide на моем 3dfx Voodoo 2:
            </p>

            <ul style="line-height:1.7;">
              <li>
                <strong>Quake II (id Software):</strong><br>
                Моя главная страсть! Любимая карта — <code>q2dm1 "The Edge"</code>.
                Играю с рельсой (Railgun) и рокетницей. В конфиге прописано <code>cl_run 1</code>, <code>fov 110</code>, <code>crosshair 1</code>.
                По выходным ходим с Серёгой и Борисом в компьютерный клуб "Полигон" играть по сети IPX!
              </li>
              <li>
                <strong>Half-Life (Valve / Sierra):</strong><br>
                Жду полную версию со дня на день! Демка "Day One" просто снесла крышу: потрясающий сюжет без видеороликов,
                ученые, охранники Барни и монтировка Гордона Фримена!
              </li>
              <li>
                <strong>StarCraft: Brood War (Blizzard):</strong><br>
                Играю за Протоссов. Зилоты и Темные Тамплиеры решают всё. Battle.net через модем — это космос!
              </li>
              <li>
                <strong>Unreal (Epic MegaGames):</strong><br>
                Самый красивый замок с парящими водопадами на движке Unreal Engine. Цветное освещение на 3dfx Glide просто завораживает.
              </li>
              <li>
                <strong>Fallout 2 (Black Isle):</strong><br>
                Лучшая постапокалиптическая RPG. Пустоши, Нью-Рено, машина Хайвеймен и силовая броня Анклава!
              </li>
            </ul>
          </div>
        </div>
      `;
    } else if (this.dimaActiveTab === 'guestbook') {
      const myNick = (window.appICQ && window.appICQ.profile && window.appICQ.profile.nick) ? window.appICQ.profile.nick : 'Гость_98';
      const myUin = (window.appICQ && window.appICQ.profile && window.appICQ.profile.uin) ? window.appICQ.profile.uin : '749210';
      mainContentHTML = `
        <div class="dima-table-box">
          <div class="dima-table-header">Гостевая Книга Вебмастера Димы (Guestbook)</div>
          <div class="dima-table-body">
            <p style="margin-top:0; font-size:12px;">
              Пожалуйста, черкните пару строк в мою гостевую книгу! Оставьте свой отзыв о сайте, дизайне, танцующем ребенке или передайте привет!
            </p>

            <div style="background:#f0f0f5; border:2px inset #fff; padding:10px; margin-bottom:14px;">
              <div style="font-weight:bold; color:#000080; margin-bottom:8px;">Оставить запись в Гостевой Книге:</div>
              <div style="display:flex; gap:8px; margin-bottom:6px;">
                <input type="text" id="gb-inp-name" placeholder="Ваше Имя / Никнейм" value="${this.escapeHtml(myNick)}" style="flex:1; padding:3px; font-size:11px; border:2px inset #fff;">
                <input type="text" id="gb-inp-uin" placeholder="Ваш ICQ UIN" value="${this.escapeHtml(myUin)}" style="width:110px; padding:3px; font-size:11px; border:2px inset #fff; font-family:'Courier New', monospace;">
              </div>
              <div style="margin-bottom:6px;">
                <textarea id="gb-inp-msg" rows="3" placeholder="Ваш отзыв, пожелания вебмастеру или впечатления о танцующем ребенке..." style="width:100%; box-sizing:border-box; padding:4px; font-family:var(--win-font); font-size:11px; border:2px inset #fff;"></textarea>
              </div>
              <div style="display:flex; justify-content:flex-end;">
                <button class="win-btn" id="btn-gb-submit" style="font-weight:bold; min-width:140px;">Отправить запись!</button>
              </div>
            </div>

            <div style="font-weight:bold; margin-bottom:6px; color:#000080;">Всего записей: ${guestbook.length}</div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${guestbook.map(entry => `
                <div style="border:1px solid #c0c0c0; background:#fff; padding:8px;">
                  <div style="display:flex; justify-content:space-between; border-bottom:1px dotted #ccc; padding-bottom:4px; margin-bottom:4px; font-size:11px;">
                    <span style="font-weight:bold; color:#000080;">
                      ${this.gif('user')} ${this.escapeHtml(entry.author || 'Анонимный гость')} ${entry.uin ? `<span style="color:#777; font-family:'Courier New'; font-weight:normal;">(#${this.escapeHtml(entry.uin)})</span>` : ''}
                    </span>
                    <span style="color:#888; font-size:10px;">${this.escapeHtml(entry.date || '')}</span>
                  </div>
                  <div style="font-size:12px; line-height:1.4;">${this.escapeHtml(entry.message || '')}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else if (this.dimaActiveTab === 'webring') {
      mainContentHTML = `
        <div class="dima-table-box">
          <div class="dima-table-header">Кольцо Сайтов Рунета 1998 года (Russian WebRing)</div>
          <div class="dima-table-body" style="text-align:center;">
            <p style="margin-top:0;">
              Этот сайт является официальным участником <strong>Кольца Сайтов Российских Вебмастеров</strong>
              и <strong>Клуба Любителей Quake & 3dfx Hardware</strong>!
            </p>

            <div style="border:3px double #000080; background:#f0f4ff; padding:15px; margin:15px auto; max-width:440px;">
              <div style="font-weight:bold; color:#000080; font-size:14px; margin-bottom:8px;">
                ${this.gif('star')} РУССКОЕ КОЛЬЦО ВЕБМАСТЕРОВ 1998 ${this.gif('star')}
              </div>
              <div style="font-size:11px; margin-bottom:12px;">
                Сайт принадлежит: <strong>Вебмастеру Диме (#313370)</strong><br>
                Хостинг: GeoCities (SiliconValley Homestead)
              </div>
              <div style="display:flex; justify-content:center; gap:8px; font-size:11px; font-weight:bold;">
                <a href="#" class="dima-webring-link" data-action="prev" style="color:#0000cc;">[ &laquo; Предыдущий ]</a>
                <a href="#" class="dima-webring-link" data-action="list" style="color:#0000cc;">[ Список сайтов ]</a>
                <a href="#" class="dima-webring-link" data-action="random" style="color:#0000cc;">[ Случайный сайт ]</a>
                <a href="#" class="dima-webring-link" data-action="next" style="color:#0000cc;">[ Следующий &raquo; ]</a>
              </div>
            </div>

            <p style="font-size:11px; color:#555;">
              Хотите вступить в кольцо? Отправьте письмо на <a href="mailto:dima@geocities.com">dima@geocities.com</a> с темой "WebRing Join".
            </p>
          </div>
        </div>
      `;
    }

    return `
      <div class="dima-page-container">
        <div class="dima-top-marquee">
          <marquee scrollamount="4">
            *** ДОБРО ПОЖАЛОВАТЬ НА ДОМАШНЮЮ СТРАНИЧКУ ВЕБМАСТЕРА ДИМЫ! *** ОФИЦИАЛЬНО ОТКРЫТО В ОКТЯБРЕ 1998 ГОДА! *** САЙТ НАХОДИТСЯ В РАЗРАБОТКЕ (UNDER CONSTRUCTION) *** ССЫЛКА ТОЛЬКО ДЛЯ ДРУЗЕЙ ИЗ ICQ! ***
          </marquee>
        </div>

        <div class="dima-header-banner">
          <h1 class="dima-wordart-title">${this.gif('star', 2)} DIMA's CYBER LAIR '98 ${this.gif('star', 2)}</h1>
          <div class="dima-header-sub">
            GeoCities Homestead: SiliconValley/Way/1998 • Handmade by Dmitry Sokolov • ICQ UIN: #313370
          </div>
        </div>

        <div class="dima-frameset">
          <div class="dima-sidebar">
            <div class="dima-menu-box">
              <div class="dima-menu-title">╔══ РАЗДЕЛЫ ══╗</div>
              <a class="dima-nav-link ${this.dimaActiveTab === 'home' ? 'active' : ''}" data-tab="home">${this.gif('home')} Главная & Ребенок</a>
              <a class="dima-nav-link ${this.dimaActiveTab === 'about' ? 'active' : ''}" data-tab="about">${this.gif('pc')} Обо мне & Железо</a>
              <a class="dima-nav-link ${this.dimaActiveTab === 'games' ? 'active' : ''}" data-tab="games">${this.gif('joy')} Игры & Quake II</a>
              <a class="dima-nav-link ${this.dimaActiveTab === 'guestbook' ? 'active' : ''}" data-tab="guestbook">${this.gif('pencil')} Гостевая Книга</a>
              <a class="dima-nav-link ${this.dimaActiveTab === 'webring' ? 'active' : ''}" data-tab="webring">${this.gif('globe')} Кольцо Сайтов</a>
            </div>

            ${this.renderDimaCounterBox(digitsHTML)}

            <div class="dima-midi-box">
              <div style="font-weight:bold; color:#ffff00; margin-bottom:3px;">${this.gif('speaker')} Фоновый MIDI:</div>
              <div style="color:#00ff00; font-size:9px; margin-bottom:5px;">&lt;bgsound loop="inf"&gt;</div>
              <div style="font-size:9px; color:#ccc; margin-bottom:4px;">Трек: Руки Вверх - Крошка моя (MIDI)</div>
              <div style="display:flex; gap:4px;">
                <button class="win-btn" id="btn-dima-midi-toggle" style="font-size:10px; padding:2px 5px; flex:1; font-weight:bold;">
                  ${this.dimaMidiPlaying ? '&#9632; Выкл MIDI' : '&#9658; Вкл MIDI'}
                </button>
              </div>
            </div>

            <div>
              <div class="dima-hazard-bar"></div>
              <div style="font-size:9px; color:#ffff00; text-align:center; font-weight:bold;">
                ${this.gif('construct')} UNDER CONSTRUCTION! ${this.gif('construct')}
              </div>
              <div class="dima-hazard-bar"></div>
            </div>

            <div class="dima-badges-grid">
              <div class="dima-badge-88" style="background:#000080; color:#00ff00; border-color:#00ffff;">
                Netscape 4.0<br>NOW!
              </div>
              <div class="dima-badge-88" style="background:#400040; color:#ffff00; border-color:#ff00ff;">
                Best in<br>800x600
              </div>
              <div class="dima-badge-88" style="background:#ffffff; color:#000000; border-color:#808080;">
                Made with<br>Notepad
              </div>
              <div class="dima-badge-88" style="background:#005500; color:#00ff00; border-color:#00aa00;">
                ICQ #313370<br>ONLINE
              </div>
              <div class="dima-badge-88" style="background:#ffcc00; color:#000080; border-color:#cc9900;">
                GeoCities<br>Homestead
              </div>
            </div>
          </div>

          <div class="dima-content-frame" id="dima-content-body">
            ${mainContentHTML}

            <div style="margin-top:20px; border-top:1px dashed #888; padding-top:8px; font-size:11px; color:#666; text-align:center;">
              (C) 1998 Вебмастер Дима. Создано с любовью к HTML 3.2. Все права защищены.<br>
              Hosted for FREE on GeoCities (SiliconValley/Way/1998).
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachDimaWebmasterEvents(win, container) {
    const getFrame = () => {
      if (container && container.classList && container.classList.contains('ie-content-frame')) return container;
      if (container && container.closest) {
        const found = container.closest('.ie-content-frame');
        if (found) return found;
      }
      if (win && win.element) {
        return win.element.querySelector('.ie-content-frame');
      }
      return document.querySelector('.ie-content-frame');
    };

    container.querySelectorAll('.dima-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.dataset.tab;
        this.dimaActiveTab = tab;
        if (window.soundSys) window.soundSys.playClick();
        const frame = getFrame();
        if (frame) {
          frame.scrollTop = 0;
          frame.innerHTML = this.renderDimaWebmasterPage();
          this.attachDimaWebmasterEvents(win, frame);
        }
      });
    });

    container.querySelectorAll('.btn-baby-speed').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const speed = btn.dataset.speed;
        this.dimaBabySpeed = speed;
        if (window.soundSys) window.soundSys.playClick();
        const wrapper = container.querySelector('#dima-baby-wrapper');
        const baby = container.querySelector('#dima-baby-actor');
        const speech = container.querySelector('#dima-baby-speech');
        if (wrapper) {
          wrapper.className = `dancing-baby-wrapper ${speed}`;
        }
        if (baby) {
          baby.setAttribute('class', `dancing-baby-svg ${speed}`);
          if (baby.classList) {
            baby.classList.remove('normal', 'turbo', 'chacha');
            baby.classList.add(speed);
          }
        }
        if (speech) {
          speech.textContent = speed === 'turbo'
            ? '*** УУУИИИИ! ТУРБО-ТАНЕЦ! ***'
            : speed === 'chacha'
            ? '*** OOGA-CHAKA OOGA-OOGA! ***'
            : 'Cha-Cha-Cha! Танцуем под 90-е!';
        }
        container.querySelectorAll('.btn-baby-speed').forEach(b => {
          const isActive = b.dataset.speed === speed;
          b.style.fontWeight = isActive ? 'bold' : 'normal';
          b.style.background = isActive ? '#ffffcc' : '';
        });

        if (window.appClippy && window.appClippy.visible && Math.random() < 0.6) {
          if (speed === 'turbo') {
            window.appClippy.speak('Турбо-скорость! Ребёнок вошел в кураж, держите модем!', [], '🚀');
          } else if (speed === 'chacha') {
            window.appClippy.speak('Ooga-chaka! Ooga-ooga! Главный хит 90-х!', [], '💃');
          }
        }
      });
    });

    const babyActor = container.querySelector('#dima-baby-actor');
    if (babyActor) {
      babyActor.style.cursor = 'pointer';
      babyActor.setAttribute('title', 'Кликните по 3D-малышу!');
      babyActor.addEventListener('click', () => {
        const speeds = ['normal', 'chacha', 'turbo'];
        const currentIdx = speeds.indexOf(this.dimaBabySpeed || 'normal');
        const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
        const nextBtn = container.querySelector(`.btn-baby-speed[data-speed="${nextSpeed}"]`);
        if (nextBtn) {
          nextBtn.click();
        }
        if (window.appClippy && window.appClippy.visible) {
          window.appClippy.speak('Ха-ха, пощекотали 3D-малыша! Смотрите, как он лихо вертит бёдрами под MIDI!', [], '👶');
        }
      });
    }

    const btnMidi = container.querySelector('#btn-dima-midi-toggle');
    if (btnMidi) {
      btnMidi.addEventListener('click', () => {
        if (this.dimaMidiPlaying) {
          this.dimaMidiPlaying = false;
          btnMidi.textContent = '\u25BA Вкл MIDI';
          if (window.soundSys && typeof window.soundSys.stopDimaMidi === 'function') {
            window.soundSys.stopDimaMidi();
          }
        } else {
          this.dimaMidiPlaying = true;
          btnMidi.textContent = '\u25A0 Выкл MIDI';
          if (window.soundSys && typeof window.soundSys.playDimaMidi === 'function') {
            window.soundSys.playDimaMidi();
          }
        }
      });
    }

    const btnGbSubmit = container.querySelector('#btn-gb-submit');
    if (btnGbSubmit) {
      btnGbSubmit.addEventListener('click', () => {
        const nameInp = container.querySelector('#gb-inp-name');
        const uinInp = container.querySelector('#gb-inp-uin');
        const msgInp = container.querySelector('#gb-inp-msg');

        const name = nameInp ? nameInp.value.trim() : '';
        const uin = uinInp ? uinInp.value.trim() : '';
        const message = msgInp ? msgInp.value.trim() : '';

        if (!message) {
          window.winManager.openDialog({
            title: 'Гостевая Книга',
            icon: 'warning',
            message: 'Пожалуйста, введите текст отзыва!'
          });
          return;
        }

        let guestbook = [];
        try {
          guestbook = JSON.parse(localStorage.getItem('win98_dima_guestbook') || '[]');
        } catch (e) {}

        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.1998 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        guestbook.unshift({
          author: name || 'Анонимный гость',
          uin: uin || '',
          date: dateStr,
          message: message
        });

        try {
          localStorage.setItem('win98_dima_guestbook', JSON.stringify(guestbook));
        } catch (e) {}

        if (window.soundSys) window.soundSys.playDing();

        window.winManager.openDialog({
          title: 'Гостевая Книга',
          icon: 'info',
          message: 'Спасибо! Ваша запись успешно добавлена в Гостевую Книгу Вебмастера Димы!'
        });

        const frame = getFrame();
        if (frame) {
          frame.scrollTop = 0;
          frame.innerHTML = this.renderDimaWebmasterPage();
          this.attachDimaWebmasterEvents(win, frame);
        }
      });
    }

    container.querySelectorAll('.dima-webring-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const action = link.dataset.action;
        const ringSites = [
          'http://www.rambler98.ru',
          'http://www.mp3vault98.com',
          'http://chat.krovatka98.ru',
          'http://www.search98.com',
          'http://www.steampowered.com'
        ];
        if (window.soundSys) window.soundSys.playClick();
        if (action === 'random') {
          const rand = ringSites[Math.floor(Math.random() * ringSites.length)];
          this.navigate(win, rand);
        } else if (action === 'next' || action === 'prev') {
          this.navigate(win, ringSites[0]);
        } else {
          this.navigate(win, 'http://www.search98.com');
        }
      });
    });
  }

  get voodooParts() {
    return {
      cpu: [['p166', 'Pentium 166 MMX', 0.6], ['p233', 'Pentium 233 MMX', 0.8], ['p266', 'Pentium II 266', 0.95], ['c450', 'Celeron 300A @ 450 MHz', 1.4], ['p400', 'Pentium II 400', 1.35]],
      gpu: [['s3', 'S3 Trio64V+ 2MB', 0.15], ['mystique', 'Matrox Mystique 4MB', 0.35], ['v1', '3dfx Voodoo 1 4MB', 0.8], ['riva', 'Riva 128 4MB', 0.85], ['v2', '3dfx Voodoo 2 12MB', 1.3], ['v2sli', '2x Voodoo 2 SLI 24MB', 1.8]],
      game: [['Quake II', 'Quake II (Glide)', 38], ['Unreal', 'Unreal (Glide)', 28], ['Half-Life', 'Half-Life (OpenGL)', 32], ['Need for Speed III', 'Need for Speed III', 35], ['Wolfenstein 3D', 'Wolfenstein 3D (DOS)', 70]],
      res: [['640x480', '640x480', 1.2], ['800x600', '800x600', 1.0], ['1024x768', '1024x768 (только SLI)', 0.7]]
    };
  }

  voodooFps(cpu, gpu, game, res) {
    const parts = this.voodooParts;
    const factor = (list, id) => (list.find(item => item[0] === id) || [0, 0, 1])[2];
    const software = game.includes('Wolfenstein');
    const fps = Math.round(factor(parts.game, game) * factor(parts.cpu, cpu) * (software ? 1 : factor(parts.gpu, gpu)) * factor(parts.res, res) * 10) / 10;
    return fps < 4 ? 4.2 : fps;
  }

  renderHardware3dfx() {
    const bench = this.voodooBenchResult;
    const parts = this.voodooParts;
    const selected = bench ? bench.ids : { cpu: 'c450', gpu: 'v2sli', game: 'Quake II', res: '800x600' };
    const options = (list, current) => list.map(([id, label]) => `<option value="${id}"${id === current ? ' selected' : ''}>${label}</option>`).join('');

    let benchResultHTML = '';
    if (bench) {
      const verdict = bench.fps >= 50 ? 'Летает! 60 кадров не за горами' : bench.fps >= 30 ? 'Плавно и играбельно' : bench.fps >= 20 ? 'Терпимо, как на приставке' : 'Слайд-шоу. Пора на апгрейд';
      const rows = parts.gpu.map(([id, label]) => ({ id, label, fps: this.voodooFps(bench.ids.cpu, id, bench.ids.game, bench.ids.res) }));
      const max = Math.max(...rows.map(r => r.fps), 1);
      benchResultHTML = `
        <table class="voodoo-bench-result" cellspacing="0">
          <tr><td colspan="3" class="voodoo-bench-title">${bench.game} &middot; ${bench.res} &middot; ${bench.cpu}</td></tr>
          ${rows.map(r => `
          <tr class="${r.id === bench.ids.gpu ? 'is-yours' : ''}">
            <td class="voodoo-bench-label">${r.label}</td>
            <td class="voodoo-bench-bar"><div style="width:${Math.round(r.fps / max * 100)}%"></div></td>
            <td class="voodoo-bench-fps">${r.fps}</td>
          </tr>`).join('')}
          <tr><td colspan="3" class="voodoo-bench-verdict">Ваша карта: <b>${bench.gpu}</b> &mdash; <b>${bench.fps} FPS</b>. ${verdict}.</td></tr>
        </table>
      `;
    }

    return `
      <div class="voodoo-container">
        <div class="voodoo-page">
          <table class="voodoo-header" cellspacing="0">
            <tr>
              <td class="voodoo-logo">${this.gif('bolt', 2)}VOODOO<span>ZONE</span></td>
              <td class="voodoo-banner">
                <b>Voodoo2 SLI</b> &mdash; две карты, 24 МБ,<br>100 кадров в Quake II!
                <span class="web-blink">Купить!</span>
              </td>
            </tr>
          </table>
          <div class="voodoo-nav">
            <a data-url="http://www.3dfx-zone.com">Новости</a> ::
            <a id="voodoo-to-bench">Бенчмарки</a> ::
            <a id="voodoo-to-oc">Разгон</a> ::
            <a data-url="http://forum.games98.com">Форум</a> ::
            <a data-url="http://www.cheatcc.com">Читы</a>
          </div>
          <table class="voodoo-layout" cellspacing="0">
            <tr>
              <td class="voodoo-main">
                <div class="voodoo-post">
                  <div class="voodoo-post-date">Четверг, 12 ноября 1998</div>
                  <div class="voodoo-post-title">Voodoo2: революция чистой графической мощи</div>
                  <p>12 МБ видеопамяти, мультитекстурирование и SLI-шлейф для двух карт. В Quake II и Unreal &mdash; до 100 кадров в секунду в 1024x768. Драйверы Glide 2.53 уже в разделе загрузок.</p>
                  <div class="voodoo-post-by">написал <b>Scorpion</b> в 14:32 &middot; <a data-url="http://forum.games98.com">комментарии (42)</a></div>
                </div>

                <div class="voodoo-post" id="voodoo-bench">
                  <div class="voodoo-post-title">${this.gif('chart')} Калькулятор FPS</div>
                  <table class="voodoo-calculator-box" cellspacing="0">
                    <tr><td>Процессор:</td><td><select id="voodoo-cpu">${options(parts.cpu, selected.cpu)}</select></td></tr>
                    <tr><td>Видеокарта:</td><td><select id="voodoo-gpu">${options(parts.gpu, selected.gpu)}</select></td></tr>
                    <tr><td>Игра:</td><td><select id="voodoo-game">${options(parts.game, selected.game)}</select></td></tr>
                    <tr><td>Разрешение:</td><td><select id="voodoo-res">${options(parts.res, selected.res)}</select></td></tr>
                    <tr><td></td><td><button class="win-btn" id="btn-voodoo-calc">Посчитать FPS</button></td></tr>
                  </table>
                  ${benchResultHTML}
                </div>

                <div class="voodoo-post" id="voodoo-oc">
                  <div class="voodoo-post-date">Вторник, 10 ноября 1998</div>
                  <div class="voodoo-post-title">Разгон: Celeron 300A до 450 МГц</div>
                  <p>Celeron 300A на ядре Mendocino несёт 128 КБ кэша второго уровня на частоте ядра. Переставьте джампер шины на плате с чипсетом 440BX с 66 на <b>100 МГц</b> &mdash; и получите <b>450 МГц</b>. Это быстрее Pentium II 400 за треть цены.</p>
                  <p class="voodoo-tip">Совет: в <code>CONFIG.SYS</code> пропишите <code>DEVICE=C:\\WINDOWS\\HIMEM.SYS</code> и <code>DOS=HIGH,UMB</code> &mdash; останется 624 КБ базовой памяти.</p>
                  <div class="voodoo-post-by">написал <b>Overclocker</b> в 09:15 &middot; <a data-url="http://forum.games98.com">комментарии (17)</a></div>
                </div>
              </td>
              <td class="voodoo-side">
                <div class="voodoo-side-title">Драйверы</div>
                <div class="voodoo-side-box">Glide 2.53<br>Voodoo2 3.02.02<br>Riva 128 1.52<br>DirectX 6.0</div>
                <div class="voodoo-side-title">Топ карт</div>
                <div class="voodoo-side-box">1. Voodoo2 SLI<br>2. Voodoo2<br>3. Riva TNT<br>4. Voodoo Banshee<br>5. Matrox G200</div>
                <div class="voodoo-side-title">Друзья</div>
                <div class="voodoo-side-box">
                  <a data-url="http://www.igromania.ru">Игромания</a><br>
                  <a data-url="http://www.cheatcc.com">CheatCC</a><br>
                  <a data-url="http://forum.games98.com">GamerZone</a>
                </div>
                <span class="web-88 voodoo-88">3dfx<br><b>POWERED</b></span>
              </td>
            </tr>
          </table>
          <div class="voodoo-footer">Voodoo Zone '98 &middot; не является сайтом 3dfx Interactive &middot; лучше всего смотреть в 800x600 и 16 бит &middot; Вопросы по разгону: ${this.mailLink('overclock@3dfx-zone.com')}</div>
        </div>
      </div>
    `;
  }

  attachHardware3dfxEvents(win, container) {
    const jump = (linkId, targetId) => {
      const link = container.querySelector(linkId);
      if (link) link.addEventListener('click', () => {
        const target = container.querySelector(targetId);
        if (target) target.scrollIntoView({ block: 'start' });
      });
    };
    jump('#voodoo-to-bench', '#voodoo-bench');
    jump('#voodoo-to-oc', '#voodoo-oc');

    const btnCalc = container.querySelector('#btn-voodoo-calc');
    if (btnCalc) {
      btnCalc.addEventListener('click', () => {
        const ids = {
          cpu: container.querySelector('#voodoo-cpu').value,
          gpu: container.querySelector('#voodoo-gpu').value,
          game: container.querySelector('#voodoo-game').value,
          res: container.querySelector('#voodoo-res').value
        };
        const parts = this.voodooParts;
        const label = (list, id) => (list.find(item => item[0] === id) || [id, id])[1];
        this.voodooBenchResult = {
          ids,
          fps: this.voodooFps(ids.cpu, ids.gpu, ids.game, ids.res),
          game: ids.game,
          res: ids.res,
          cpu: label(parts.cpu, ids.cpu),
          gpu: label(parts.gpu, ids.gpu)
        };

        if (window.soundSys) window.soundSys.playDing();
        this.renderPage(win, this.currentUrl);
        const bench = win.element.querySelector('#voodoo-bench');
        if (bench) bench.scrollIntoView({ block: 'start' });
      });
    }
  }

  getWebVideoList() {
    return [
      {
        id: 'prodigy_moscow',
        title: 'The Prodigy - Live @ Manege Square Moscow (1997)',
        titleRu: 'The Prodigy — Концерт на Манежной площади в Москве (27 сентября 1997)',
        fileName: 'The Prodigy - Live @ 27 September 1997 - Russia, Moscow, Manege Square (MTV Proshot).mp4',
        src: 'content/webvideo/The Prodigy - Live @ 27 September 1997 - Russia, Moscow, Manege Square (MTV Proshot).mp4',
        category: 'music',
        categoryName: 'Музыка и Концерты',
        year: '1997',
        duration: '39:56',
        size: '44.1 MB',
        resolution: '480x360',
        codec: 'MPEG-1 Video Stream / 44.1 kHz Hi-Fi Stereo',
        fps: '25 fps',
        rating: '★★★★★',
        dialupTimes: { '28k': '3.4 ч.', '33k': '2.9 ч.', '56k': '1.7 ч.', 'isdn': '46 мин.' },
        badge: 'HOT! РЕЙВ ВЕКА',
        desc: 'Легендарное историческое выступление The Prodigy в самом сердце Москвы, собравшее свыше 250,000 человек прямо под стенами Кремля. Телевизионная съемка MTV Proshot: Кит Флинт, Максим Реалити, Лиам Хоулетт. Треки: Smack My Bitch Up, Breathe, Poison, Firestarter.'
      },
      {
        id: 'halflife',
        title: 'Half-Life 1 - Official E3 Showcase Trailer (1998)',
        titleRu: 'Half-Life 1 — Официальный мировой трейлер шутера века (Sierra / Valve 1998)',
        fileName: 'Half-Life 1 trailer.mp4',
        src: 'content/webvideo/Half-Life 1 trailer.mp4',
        category: 'games',
        categoryName: 'Игровые трейлеры',
        year: '1998',
        duration: '1:44',
        size: '2.3 MB',
        resolution: '320x240',
        codec: 'Cinepak AVI / DirectShow Stream 29.97 fps',
        fps: '29.97 fps',
        rating: '★★★★★',
        dialupTimes: { '28k': '11 мин.', '33k': '9 мин.', '56k': '5.5 мин.', 'isdn': '2.4 мин.' },
        badge: 'GOTY 1998',
        desc: 'Шедевр Гейба Ньюэлла и Valve Software. Физик Гордон Фримен, исследовательский комплекс «Чёрная Меза», каскадный резонанс, нападение инопланетян из мира Зен и зачистка спецназом HECU. Игра года 1998!'
      },
      {
        id: 'fallout1',
        title: 'Fallout: A Post Nuclear Role Playing Game - Intro (1997)',
        titleRu: 'Fallout 1 — Легендарный вступительный ролик («War. War never changes»)',
        fileName: 'Fallout 1 Intro HD.mp4',
        src: 'content/webvideo/Fallout 1 Intro HD.mp4',
        category: 'games',
        categoryName: 'Игровые трейлеры',
        year: '1997',
        duration: '2:48',
        size: '6.3 MB',
        resolution: '640x480',
        codec: 'Interplay MVE Video / The Ink Spots «Maybe»',
        fps: '30 fps',
        rating: '★★★★★',
        dialupTimes: { '28k': '30 мин.', '33k': '25 мин.', '56k': '15 мин.', 'isdn': '6.6 мин.' },
        badge: 'КУЛЬТОВАЯ КЛАССИКА',
        desc: 'Культовое начало эпопеи от Interplay Productions. Звучит бессмертная песня «Maybe» квартета The Ink Spots, черно-белый ламповый телевизор среди ядерных руин мира будущего и выход Выходца из Убежища 13.'
      },
      {
        id: 'fallout2',
        title: 'Fallout 2 - Official World Premiere Trailer (1998)',
        titleRu: 'Fallout 2 — Официальный мировой трейлер (Black Isle Studios 1998)',
        fileName: 'Fallout 2 Trailer.mp4',
        src: 'content/webvideo/Fallout 2 Trailer.mp4',
        category: 'games',
        categoryName: 'Игровые трейлеры',
        year: '1998',
        duration: '1:30',
        size: '3.0 MB',
        resolution: '320x240',
        codec: 'Interplay QuickTime AVI / Stereo Sound',
        fps: '29.97 fps',
        rating: '★★★★★',
        dialupTimes: { '28k': '14 мин.', '33k': '12 мин.', '56k': '7.2 мин.', 'isdn': '3.1 мин.' },
        badge: 'ХИТ СЕЗОНА',
        desc: '«A Post Nuclear Role Playing Game». Деревня Арройо на грани гибели, поиски генератора Эдемских кущ (G.E.C.K.), зловещий Анклав во главе с президентом Ричардсоном и мутанты Пустоши.'
      },
      {
        id: 'berserk',
        title: 'Berserk TV 1997 - Official Nippon Television Trailer',
        titleRu: 'Берсерк (1997) — Официальный трейлер культового аниме-сериала',
        fileName: 'Berserk TV Trailer.mp4',
        src: 'content/webvideo/Berserk TV Trailer.mp4',
        category: 'anime',
        categoryName: 'Аниме и Кино',
        year: '1997',
        duration: '1:40',
        size: '2.6 MB',
        resolution: '320x240',
        codec: 'MPEG-1 Video Stream / NTSC 29.97 fps',
        fps: '29.97 fps',
        rating: '★★★★★',
        dialupTimes: { '28k': '12.5 мин.', '33k': '10.5 мин.', '56k': '6.2 мин.', 'isdn': '2.7 мин.' },
        badge: 'ШЕДЕВР АНИМЕ',
        desc: 'Оригинальный телевизионный промо-ролик экранизации манги Кэнтаро Миуры с японского ТВ (Nippon Television). «Золотой Век»: Гатс, Гриффит, Каска, Отряд Сокола и гипнотический саундтрек Сусуму Хирасавы.'
      },
      {
        id: 'anotherwar',
        title: 'Trailer for Another War - Cinematic Teaser',
        titleRu: 'Another War — Кинематографичный трейлер военной драмы',
        fileName: 'Trailer for Another War.mp4',
        src: 'content/webvideo/Trailer for Another War.mp4',
        category: 'games',
        categoryName: 'Игровые трейлеры',
        year: '1998',
        duration: '1:52',
        size: '2.8 MB',
        resolution: '320x240',
        codec: 'MPEG/AVI Cinepak Video 30 fps',
        fps: '30 fps',
        rating: '★★★★★',
        dialupTimes: { '28k': '13.3 мин.', '33k': '11.2 мин.', '56k': '6.7 мин.', 'isdn': '2.9 мин.' },
        badge: 'EXCLUSIVE',
        desc: 'Драматический кинематографический тизер о суровых реалиях войны, разрушенных городах и выживании в эпицентре масштабного вооруженного конфликта.'
      },
      {
        id: 'captain_jeff',
        title: 'Captain Jeff - Level One (Music Video)',
        titleRu: 'Captain Jeff — Первый Уровень (Официальный клип)',
        fileName: 'Captain Jeff - Первый Уровень.mp4',
        src: 'content/webvideo/Captain Jeff - Первый Уровень.mp4',
        category: 'music',
        categoryName: 'Музыка и Концерты',
        year: '1998',
        duration: '3:24',
        size: '5.3 MB',
        resolution: '192x144',
        codec: 'MPEG-4 Video / Stereo Audio',
        fps: '25 fps',
        rating: '★★★★★',
        dialupTimes: { '28k': '25 мин.', '33k': '21 мин.', '56k': '12.6 мин.', 'isdn': '5.5 мин.' },
        badge: 'NEW! КЛИП',
        desc: 'Культовый музыкальный видеоклип «Первый Уровень» группы Captain Jeff! Олдскульный драйв, гитарный напор и ностальгическая атмосфера 90-х.'
      }
    ];
  }

  renderWebVideo() {
    const videos = this.getWebVideoList();
    const current = videos[this.webCinemaCurrentVideoIdx] || videos[0];
    const filter = this.webCinemaCurrentFilter || 'all';

    let defaultComments = [
      { nick: 'Hacker_Neo_98', modem: 'USRobotics Sportster 33.6', text: 'Качал концерт The Prodigy всю ночь по ночному тарифу! 44 мегабайта — это жесть для телефонной линии, батя чуть модем в окно не выкинул! Но звук и видео просто бомба, Кит Флинт рвет Манежку в клочья!', date: '02.11.1998' },
      { nick: 'Freeman_Gordon', modem: 'ISDN Dual Channel 128K', text: 'Трейлер Half-Life пересмотрел 10 раз! Графика на движке GoldSrc с цветным освещением и скелетной анимацией — это просто космос. Никакой Quake 2 рядом не стоял!', date: '04.11.1998' },
      { nick: 'Chosen_One_Arroyo', modem: 'ZyXEL Omni 56K', text: 'Fallout 2 — игра века! Ролик про поиски G.E.C.K. сохранил в папку Мои документы. Всем поклонникам постапокалипсиса пламенный привет из Убежища 13!', date: '07.11.1998' },
      { nick: 'BlackSwordsman', modem: 'Motorola Lifestyle 28.8', text: 'Наконец-то нашел опенинг/трейлер Berserk 1997 в хорошем качестве! Музыка Сусуму Хирасавы пробирает до мурашек. Спасибо автору за лучший видеоархив Рунета!', date: '10.11.1998' }
    ];

    let userComments = [];
    try {
      userComments = JSON.parse(localStorage.getItem(this.webCinemaCommentsKey) || '[]');
    } catch (e) {}
    const allComments = [...defaultComments, ...userComments];

    return `
      <div class="webcinema-container">
        <div class="webcinema-inner">

          <div class="webcinema-marquee-bar">
            <marquee scrollamount="4" behavior="scroll" direction="left">
              *** ДОБРО ПОЖАЛОВАТЬ В WEBCINEMA '98 — ЦИФРОВОЙ ВИДЕОАРХИВ ВСЕМИРНОЙ ПАУТИНЫ! СВЕЖИЕ ТРЕЙЛЕРЫ HALF-LIFE, FALLOUT 2, НОВЫЙ КЛИП CAPTAIN JEFF И ПОЛНАЯ ЗАПИСЬ КОНЦЕРТА THE PRODIGY В МОСКВЕ (1997) В ФОРМАТЕ MPEG-1! *** ЛУЧШИЙ ПРОСМОТР ЧЕРЕЗ INTERNET EXPLORER 5.0 ПРИ РАЗРЕШЕНИИ 800x600 ***
            </marquee>
          </div>

          <table class="webcinema-header-table">
            <tr>
              <td style="width:60px; text-align:center; vertical-align:middle;">
                ${this.gif('film', 2)}
              </td>
              <td>
                <h1 class="webcinema-title">WEBCINEMA '98</h1>
                <div class="webcinema-subtitle">
                  Всемирный Каталог и Видеотека Эпохи MPEG-1, QuickTime 3.0 & ActiveMovie
                </div>
                <div class="webcinema-meta-bar">
                  Сервер: <code>ftp.webcinema98.net</code> • Зона: <code>Internet zone</code> • Статус: <span style="color:#00ff00;">● STREAMING ONLINE</span>
                </div>
              </td>
              <td style="width:70px; text-align:center; vertical-align:middle;">
                <span class="web-new">NEW!</span>
                <br>${this.gif('vhs', 2)}
              </td>
            </tr>
          </table>

          <div class="webcinema-modem-alert">
            ${this.gif('warn', 2)}
            <div>
              <strong>Справка модемного пользователя:</strong>
              Видеоролики закодированы с битрейтом 400-900 кбит/с. При использовании модема 28.8k - 56k рекомендуется дождаться полной буферизации или сохранить файл в «Мои видео».
            </div>
          </div>

          <table class="webcinema-nav-table">
            <tr>
              <td><a class="webcinema-nav-btn ${filter === 'all' ? 'active' : ''}" data-filter="all">Все видео (${videos.length})</a></td>
              <td><a class="webcinema-nav-btn ${filter === 'games' ? 'active' : ''}" data-filter="games">Игровые трейлеры (${videos.filter(v => v.category === 'games').length})</a></td>
              <td><a class="webcinema-nav-btn ${filter === 'music' ? 'active' : ''}" data-filter="music">Рок и Концерты (${videos.filter(v => v.category === 'music').length})</a></td>
              <td><a class="webcinema-nav-btn ${filter === 'anime' ? 'active' : ''}" data-filter="anime">Аниме и Кино (${videos.filter(v => v.category === 'anime').length})</a></td>
            </tr>
          </table>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">

            <div style="flex:1 1 540px; min-width:320px;">

              <div class="webcinema-player-window" id="wc-player-window">
                <div class="webcinema-player-titlebar">
                  <span id="wc-title-text">ActiveMovie™ Player 98 - ${current.title}</span>
                  <div style="display:flex; gap:2px;">
                    <span style="display:inline-block; width:13px; height:11px; background:#c0c0c0; color:#000; font-size:9px; text-align:center; font-weight:bold; border:1px outset #fff; cursor:default;">_</span>
                    <span style="display:inline-block; width:13px; height:11px; background:#c0c0c0; color:#000; font-size:9px; text-align:center; font-weight:bold; border:1px outset #fff; cursor:default;">□</span>
                    <span style="display:inline-block; width:13px; height:11px; background:#c0c0c0; color:#000; font-size:9px; text-align:center; font-weight:bold; border:1px outset #fff; cursor:default;">×</span>
                  </div>
                </div>

                <div class="webcinema-screen-wrap">
                  <video class="webcinema-video" id="wc-video" src="${current.src}" playsinline preload="metadata"></video>
                  <div class="webcinema-hud" id="wc-hud">STATUS: READY • ${current.resolution} • ${current.fps}</div>
                </div>

                <div class="webcinema-controls-bar">
                  <button class="win-btn" id="wc-btn-play">&#9658; Пуск</button>
                  <button class="win-btn" id="wc-btn-pause">|| Пауза</button>
                  <button class="win-btn" id="wc-btn-stop">■ Стоп</button>
                  <input type="range" class="player-slider webcinema-track" id="wc-slider" min="0" max="100" value="0" step="0.1">
                  <div id="wc-time-disp" style="font-family:monospace; font-size:11px; background:#ffffff; border:1px inset #808080; padding:1px 4px; min-width:85px; text-align:center; color:#000000;">
                    00:00 / ${current.duration}
                  </div>
                  <button class="win-btn" id="wc-btn-mute">${this.gif('speaker')}</button>
                  <input type="range" class="webcinema-track webcinema-vol" id="wc-vol" min="0" max="1" step="0.05" value="0.8">
                  <button class="win-btn" id="wc-btn-fs" title="Во весь экран">Экран</button>
                </div>
              </div>

              <div class="webcinema-info-box">
                <div class="webcinema-info-title">${current.titleRu}</div>
                <div class="webcinema-info-desc">${current.desc}</div>

                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin:8px 0;">
                  <div style="font-size:11px; color:#ffff00;">
                    ${current.categoryName} | ${current.year} | ${current.rating}
                  </div>
                  <div style="display:flex; gap:4px;">
                    <button class="win-btn" id="wc-btn-open-mplayer" style="color:#000080; font-weight:bold;">
                      Открыть в плеере Win98
                    </button>
                    <button class="win-btn" id="wc-btn-vfs-download" style="font-weight:bold;">
                      Скачать (${current.size})
                    </button>
                  </div>
                </div>

                <table class="webcinema-spec-table">
                  <tr>
                    <th>Параметр</th>
                    <th>Значение</th>
                    <th>Параметр</th>
                    <th>Значение</th>
                  </tr>
                  <tr>
                    <td>Имя файла:</td>
                    <td style="color:#00ffcc;">${current.fileName}</td>
                    <td>Разрешение:</td>
                    <td style="color:#ffff00;">${current.resolution}</td>
                  </tr>
                  <tr>
                    <td>Размер файла:</td>
                    <td style="color:#ffff00;">${current.size}</td>
                    <td>Длительность:</td>
                    <td style="color:#00ffcc;">${current.duration}</td>
                  </tr>
                  <tr>
                    <td>Видеопоток:</td>
                    <td style="color:#ffffff;">${current.codec}</td>
                    <td>Частота кадров:</td>
                    <td style="color:#ffffff;">${current.fps}</td>
                  </tr>
                </table>
              </div>

              <div class="webcinema-section-header">
                <span>КАТАЛОГ ВИДЕОЗАПИСЕЙ СЕРВЕРА</span>
                <span style="font-size:10px; font-family:Arial; font-weight:normal;">Щелкните по ролику для воспроизведения</span>
              </div>

              <div id="wc-catalog-list">
                ${videos.map((item, idx) => {
                  if (filter !== 'all' && item.category !== filter) return '';
                  const isActive = (idx === this.webCinemaCurrentVideoIdx);
                  return `
                    <div class="webcinema-card ${isActive ? 'active' : ''}">
                      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
                        <span class="webcinema-card-title" data-idx="${idx}">${this.gif('film')} ${item.titleRu}</span>
                        <span class="webcinema-badge">${item.badge}</span>
                      </div>
                      <div style="font-family:monospace; font-size:10px; color:#66ffcc; margin:3px 0;">
                        ${item.categoryName} &middot; ${item.duration} &middot; ${item.size} &middot; ${item.resolution}
                      </div>
                      <div style="font-size:11px; color:#cccccc; margin-bottom:5px;">${item.desc}</div>
                      <div style="display:flex; gap:6px;">
                        <button class="win-btn wc-btn-select-card" data-idx="${idx}" style="font-weight:bold;">&#9658; Смотреть онлайн</button>
                        <button class="win-btn wc-btn-card-mplayer" data-idx="${idx}">В плеер Win98</button>
                        <button class="win-btn wc-btn-card-dl" data-idx="${idx}">Скачать в Мои документы</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

            </div>

            <div style="flex:1 1 260px; min-width:240px;">

              <div class="webcinema-side-box">
                <div class="webcinema-side-title">Время скачивания ролика</div>
                <div style="font-size:11px; color:#cceeff; margin-bottom:4px;">
                  Расчет для текущего ролика (<strong>${current.size}</strong>):
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:10px; font-family:monospace;">
                  <tr style="background:#0a1122;">
                    <td style="padding:2px 4px; border:1px solid #334466;"><strong>28.8k Modem</strong></td>
                    <td style="padding:2px 4px; border:1px solid #334466; color:#ff9999;">${current.dialupTimes['28k']}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 4px; border:1px solid #334466;"><strong>33.6k USR Sportster</strong></td>
                    <td style="padding:2px 4px; border:1px solid #334466; color:#ffcc66;">${current.dialupTimes['33k']}</td>
                  </tr>
                  <tr style="background:#0a1122;">
                    <td style="padding:2px 4px; border:1px solid #334466;"><strong>56k ZyXEL V.90</strong></td>
                    <td style="padding:2px 4px; border:1px solid #334466; color:#ffff66;">${current.dialupTimes['56k']}</td>
                  </tr>
                  <tr>
                    <td style="padding:2px 4px; border:1px solid #334466;"><strong>ISDN 128K</strong></td>
                    <td style="padding:2px 4px; border:1px solid #334466; color:#66ff66;">${current.dialupTimes['isdn']}</td>
                  </tr>
                  <tr style="background:#0a1122;">
                    <td style="padding:2px 4px; border:1px solid #334466;"><strong>Выделенка 10 Мбит</strong></td>
                    <td style="padding:2px 4px; border:1px solid #334466; color:#00ffff;">Мгновенно</td>
                  </tr>
                </table>
              </div>

              <div class="webcinema-side-box" style="text-align:center;">
                <div class="webcinema-side-title">Совместимое ПО</div>
                <div style="font-size:11px; color:#cccccc; line-height:1.4; margin-bottom:5px;">
                  Клипы оптимизированы для встроенного DirectShow плеера Win 98:
                </div>
                <div style="font-size:10px; font-family:monospace; text-align:left; background:#000000; padding:5px; border:1px solid #334466; color:#00ffcc;">
                  • ActiveMovie Control 1.0<br>
                  • Win Media Player 98<br>
                  • Apple QuickTime 3.0<br>
                  • Intel Video Indeo / Cinepak
                </div>
              </div>

              <div class="webcinema-side-box">
                <div class="webcinema-side-title">Опрос киноманов 1998</div>
                <div style="font-size:11px; color:#ffffff; font-weight:bold; margin-bottom:4px;">
                  Какое видео потрясло вас больше всего?
                </div>
                <div id="wc-poll-box">
                  <form id="wc-poll-form" style="font-size:10px; line-height:1.5;">
                    <label><input type="radio" name="wcpoll" value="prodigy" checked> The Prodigy в Москве 1997</label><br>
                    <label><input type="radio" name="wcpoll" value="halflife"> Трейлер Half-Life 1</label><br>
                    <label><input type="radio" name="wcpoll" value="fallout"> Вступительный ролик Fallout</label><br>
                    <label><input type="radio" name="wcpoll" value="berserk"> Аниме-трейлер Berserk</label><br>
                    <button type="button" class="win-btn" id="wc-btn-poll" style="margin-top:5px; width:100%;">Голосовать</button>
                  </form>
                  <div id="wc-poll-results" style="display:none; font-size:10px; margin-top:5px; color:#ffff00; font-family:monospace;">
                    <div>The Prodigy: <strong>68%</strong> (1,842)</div>
                    <div>Half-Life 1: <strong>18%</strong> (492)</div>
                    <div>Fallout 1/2: <strong>10%</strong> (271)</div>
                    <div>Berserk TV: <strong>4%</strong> (109)</div>
                  </div>
                </div>
              </div>

              <div class="webcinema-side-box">
                <div class="webcinema-side-title">Ссылки порталов '98</div>
                <div style="font-size:11px; display:flex; flex-direction:column; gap:4px;">
                  <a data-url="http://www.mp3vault98.com">${this.gif('cd')} <strong>MP3 Vault '98</strong> — Музыкальный архив</a>
                  <a data-url="http://www.steampowered.com">${this.gif('joy')} <strong>Steam</strong> — Купить Half-Life и Fallout</a>
                  <a data-url="http://www.softstore98.com">${this.gif('disk')} <strong>SoftStore '98</strong> — ActiveMovie Video Player</a>
                  <a data-url="http://chat.krovatka98.ru">${this.gif('chat')} <strong>Чат Кроватка</strong> — Обсудить клипы онлайн</a>
                </div>
              </div>

            </div>

          </div>

          <div class="webcinema-guestbook">
            <div class="webcinema-section-header webcinema-section-header-alt">
              <span>ГОСТЕВАЯ КНИГА ЗРИТЕЛЕЙ '98</span>
              <span style="font-size:10px; font-family:Arial; font-weight:normal;">Найдено записей: ${allComments.length}</span>
            </div>

            <div style="background:#0a122e; border:1px solid #4466aa; padding:6px; margin-bottom:8px;">
              <div style="font-size:11px; font-weight:bold; color:#ffff00; margin-bottom:4px;">
                ${this.gif('pencil')} Написать отзыв в Гостевую книгу:
              </div>
              <div style="display:flex; gap:4px; margin-bottom:4px; align-items:center; font-size:11px;">
                <input type="text" id="wc-gb-nick" class="win-input" placeholder="Ваш ник (например: Neo_98)" style="width:160px; font-size:11px; padding:2px;" value="Зритель_98">
                <select id="wc-gb-modem" style="font-size:11px; padding:2px;">
                  <option value="ZyXEL Omni 56K">ZyXEL 56K V.90</option>
                  <option value="USRobotics Sportster 33.6">USR Sportster 33.6</option>
                  <option value="Motorola 28.8">Motorola 28.8</option>
                  <option value="ISDN 128K">ISDN 128K</option>
                </select>
              </div>
              <div style="display:flex; gap:4px;">
                <input type="text" id="wc-gb-msg" class="win-input" placeholder="Ваше мнение о видеоклипах..." style="flex:1; font-size:11px; padding:2px;">
                <button class="win-btn" id="wc-btn-add-gb" style="min-width:80px; font-weight:bold;">Отправить</button>
              </div>
            </div>

            <div style="max-height:180px; overflow-y:auto; background:#040714; border:1px solid #223366; padding:6px;">
              ${allComments.map(c => `
                <div class="webcinema-gb-item">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#ffff00; font-weight:bold; font-size:11px;">${this.escapeHtml(c.nick)}</span>
                    <span style="font-family:monospace; font-size:9px; color:#00ffaa; background:#002244; padding:1px 3px;">[${c.modem}]</span>
                    <span style="font-size:9px; color:#888;">${c.date}</span>
                  </div>
                  <div style="color:#ffffff; font-size:11px; margin-top:2px;">${this.escapeHtml(c.text)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="text-align:center; margin-top:12px; padding-top:8px; border-top:2px ridge #00ffff; font-size:10px;">
            <div style="font-weight:bold; font-size:11px; color:#ffcc00; margin-bottom:4px;">
              [ Russian WebRing of Multimedia & Video 1998 ]
            </div>
            <div style="font-size:10px; color:#ffffff; margin-bottom:8px;">
              Этот сайт входит в Российское Видеокольцо Всемирной Паутины!<br>
              <a href="#" class="wc-webring-link" data-url="http://www.rambler98.ru">&lt;&lt; Рамблер</a> |
              <a href="#" class="wc-webring-link" data-url="http://www.mp3vault98.com">MP3 Vault '98</a> |
              <a href="#" class="wc-webring-link" data-url="http://www.geocities.com">GeoCities '98</a> |
              <a href="#" class="wc-webring-link" data-url="http://www.steampowered.com">Steam &gt;&gt;</a>
            </div>

            <div style="display:flex; justify-content:center; gap:6px; flex-wrap:wrap; margin:6px 0;">
              <span style="display:inline-block; border:1px outset #fff; padding:2px 6px; background:#003366; color:#fff; font-size:8px; font-weight:bold;">BEST VIEWED IN IE 5.0</span>
              <span style="display:inline-block; border:1px outset #fff; padding:2px 6px; background:#222; color:#0f0; font-size:8px; font-weight:bold;">MADE WITH NOTEPAD</span>
              <span style="display:inline-block; border:1px outset #fff; padding:2px 6px; background:#004422; color:#ff0; font-size:8px; font-weight:bold;">MPEG-1 DIRECTSTREAM</span>
              <span style="display:inline-block; border:1px outset #fff; padding:2px 6px; background:#440022; color:#0ff; font-size:8px; font-weight:bold;">QUICKTIME 3.0 READY</span>
            </div>

            <div style="color:#778899; margin-top:6px;">
              Copyright © 1997-1998 WebCinema '98 Network. Все права защищены. Оптимизировано для разрешения 800x600.<br>
              Связь с редакцией каталога: <a href="mailto:info@webcinema98.com" style="color:#00ffcc;">info@webcinema98.com</a>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  attachWebVideoEvents(win, container) {
    const videos = this.getWebVideoList();
    const current = videos[this.webCinemaCurrentVideoIdx] || videos[0];

    const videoEl = container.querySelector('#wc-video');
    const hudEl = container.querySelector('#wc-hud');
    const titleTextEl = container.querySelector('#wc-title-text');
    const btnPlay = container.querySelector('#wc-btn-play');
    const btnPause = container.querySelector('#wc-btn-pause');
    const btnStop = container.querySelector('#wc-btn-stop');
    const sliderEl = container.querySelector('#wc-slider');
    const timeDispEl = container.querySelector('#wc-time-disp');
    const btnMute = container.querySelector('#wc-btn-mute');
    const volEl = container.querySelector('#wc-vol');
    const btnFs = container.querySelector('#wc-btn-fs');

    const formatSecs = (secs) => {
      if (isNaN(secs) || secs < 0) secs = 0;
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    };

    if (videoEl) {
      videoEl.addEventListener('loadedmetadata', () => {
        if (sliderEl) sliderEl.max = videoEl.duration || 100;
        if (timeDispEl) timeDispEl.textContent = `00:00 / ${formatSecs(videoEl.duration)}`;
        if (hudEl) hudEl.textContent = `READY • ${videoEl.videoWidth || 320}x${videoEl.videoHeight || 240} • DIRECTSTREAM`;
      });

      videoEl.addEventListener('play', () => {
        if (hudEl) hudEl.textContent = `PLAYING • ${videoEl.videoWidth || 320}x${videoEl.videoHeight || 240} • BUFFER OK`;
      });

      videoEl.addEventListener('pause', () => {
        if (hudEl) hudEl.textContent = `PAUSED • ${formatSecs(videoEl.currentTime)}`;
      });

      videoEl.addEventListener('timeupdate', () => {
        if (sliderEl) sliderEl.value = videoEl.currentTime;
        if (timeDispEl) timeDispEl.textContent = `${formatSecs(videoEl.currentTime)} / ${formatSecs(videoEl.duration)}`;
      });

      videoEl.addEventListener('error', () => {
        if (hudEl) hudEl.textContent = `ERROR: VIDEO LOAD FAILED (${videoEl.error ? videoEl.error.code : 'UNKNOWN'})`;
      });

      if (btnPlay) {
        btnPlay.addEventListener('click', () => {
          const p = videoEl.play();
          if (p !== undefined) {
            p.catch(e => {
              console.warn('Play error:', e);
              if (hudEl) hudEl.textContent = 'PLAY ERROR: ' + e.message;
            });
          }
        });
      }
      if (btnPause) btnPause.addEventListener('click', () => videoEl.pause());
      if (btnStop) {
        btnStop.addEventListener('click', () => {
          videoEl.pause();
          videoEl.currentTime = 0;
          if (sliderEl) sliderEl.value = 0;
          if (timeDispEl) timeDispEl.textContent = `00:00 / ${formatSecs(videoEl.duration)}`;
          if (hudEl) hudEl.textContent = `STOPPED • READY`;
        });
      }

      if (sliderEl) {
        sliderEl.addEventListener('input', () => {
          videoEl.currentTime = sliderEl.value;
        });
      }

      if (volEl) {
        volEl.addEventListener('input', () => {
          videoEl.volume = volEl.value;
          videoEl.muted = false;
          if (btnMute) btnMute.innerHTML = window.webGif ? window.webGif(volEl.value > 0 ? 'speaker' : 'mute') : '';
        });
      }

      if (btnMute) {
        btnMute.addEventListener('click', () => {
          videoEl.muted = !videoEl.muted;
          btnMute.innerHTML = window.webGif ? window.webGif(videoEl.muted ? 'mute' : 'speaker') : '';
        });
      }

      if (btnFs) {
        btnFs.addEventListener('click', () => {
          if (videoEl.requestFullscreen) videoEl.requestFullscreen();
          else if (videoEl.webkitRequestFullscreen) videoEl.webkitRequestFullscreen();
        });
      }
    }

    const btnOpenMPlayer = container.querySelector('#wc-btn-open-mplayer');
    if (btnOpenMPlayer) {
      btnOpenMPlayer.addEventListener('click', () => {
        if (window.appVideoPlayer) {
          if (videoEl) videoEl.pause();
          window.appVideoPlayer.open(current.fileName, current.src, true);
        } else {
          window.winManager.openDialog({
            title: 'ActiveMovie Player',
            icon: 'video-player',
            message: 'Плеер ActiveMovie готов к воспроизведению клипа <b>' + current.fileName + '</b>.'
          });
        }
      });
    }

    const btnVfsDownload = container.querySelector('#wc-btn-vfs-download');
    if (btnVfsDownload) {
      btnVfsDownload.addEventListener('click', () => {
        btnVfsDownload.disabled = true;
        btnVfsDownload.textContent = 'Сохранение...';

        setTimeout(() => {
          btnVfsDownload.disabled = false;
          btnVfsDownload.textContent = `Скачать (${current.size})`;

          if (window.vfs) {
            try {
              window.vfs.mkdir(['My Computer', 'C:', 'My Documents'], 'Мои видео');
            } catch (e) {}
            window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Мои видео'], current.fileName, current.src);

            try {
              let dl = JSON.parse(localStorage.getItem('win98_downloaded_videos') || '[]');
              if (!dl.includes(current.fileName)) dl.push(current.fileName);
              localStorage.setItem('win98_downloaded_videos', JSON.stringify(dl));
            } catch (e) {}
          }

          if (window.soundSys) window.soundSys.playDing();

          window.winManager.openDialog({
            title: 'Загрузка видеофайла завершена!',
            icon: 'video-player',
            message: `Видеоролик <b>${current.fileName}</b> (${current.size}) успешно сохранен в папку:<br><code>C:\\My Documents\\Мои видео\\</code>`,
            buttons: [
              {
                text: 'Открыть в ActiveMovie',
                bold: true,
                action: () => {
                  if (window.appVideoPlayer) {
                    window.appVideoPlayer.open(current.fileName, current.src, true);
                  }
                }
              },
              {
                text: 'Открыть папку',
                action: () => {
                  if (window.appExplorer) {
                    window.appExplorer.open(['My Computer', 'C:', 'My Documents', 'Мои видео']);
                  }
                }
              },
              { text: 'Закрыть' }
            ]
          });
        }, 300);
      });
    }

    container.querySelectorAll('.webcinema-nav-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.webCinemaCurrentFilter = btn.dataset.filter;
        this.renderPage(win, this.currentUrl);
      });
    });

    const selectVideoCard = (idx, autoPlay = true) => {
      this.webCinemaCurrentVideoIdx = parseInt(idx, 10) || 0;
      this.renderPage(win, this.currentUrl);
      const newWin = win.element.querySelector('.ie-content-frame');
      if (newWin) newWin.scrollTop = 0;
      const newVid = win.element.querySelector('#wc-video');
      if (newVid && autoPlay) {
        newVid.play().catch(() => {});
      }
    };

    container.querySelectorAll('.webcinema-card-title[data-idx], .wc-btn-select-card[data-idx]').forEach(el => {
      el.addEventListener('click', () => {
        selectVideoCard(el.dataset.idx, true);
      });
    });

    container.querySelectorAll('.wc-btn-card-mplayer[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = videos[parseInt(btn.dataset.idx, 10)];
        if (item && window.appVideoPlayer) {
          window.appVideoPlayer.open(item.fileName, item.src, true);
        }
      });
    });

    container.querySelectorAll('.wc-btn-card-dl[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = videos[parseInt(btn.dataset.idx, 10)];
        if (!item) return;
        if (window.vfs) {
          try {
            window.vfs.mkdir(['My Computer', 'C:', 'My Documents'], 'Мои видео');
          } catch (e) {}
          window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Мои видео'], item.fileName, item.src);

          try {
            let dl = JSON.parse(localStorage.getItem('win98_downloaded_videos') || '[]');
            if (!dl.includes(item.fileName)) dl.push(item.fileName);
            localStorage.setItem('win98_downloaded_videos', JSON.stringify(dl));
          } catch (e) {}
        }
        if (window.soundSys) window.soundSys.playDing();
        window.winManager.openDialog({
          title: 'Сохранение завершено',
          icon: 'video-player',
          message: `Ролик <b>${item.fileName}</b> сохранен в <code>C:\\My Documents\\Мои видео\\</code>`
        });
      });
    });

    const btnPoll = container.querySelector('#wc-btn-poll');
    if (btnPoll) {
      btnPoll.addEventListener('click', () => {
        const form = container.querySelector('#wc-poll-form');
        const results = container.querySelector('#wc-poll-results');
        if (form && results) {
          form.style.display = 'none';
          results.style.display = 'block';
          if (window.soundSys) window.soundSys.playDing();
        }
      });
    }

    const btnAddGb = container.querySelector('#wc-btn-add-gb');
    if (btnAddGb) {
      btnAddGb.addEventListener('click', () => {
        const nickInput = container.querySelector('#wc-gb-nick');
        const modemSelect = container.querySelector('#wc-gb-modem');
        const msgInput = container.querySelector('#wc-gb-msg');

        const nick = (nickInput && nickInput.value.trim()) || 'Аноним_98';
        const modem = (modemSelect && modemSelect.value) || 'ZyXEL 56K';
        const msg = (msgInput && msgInput.value.trim()) || '';

        if (!msg) {
          window.winManager.openDialog({
            title: 'Гостевая книга',
            icon: 'warning',
            message: 'Пожалуйста, введите текст сообщения перед отправкой!'
          });
          return;
        }

        const newComment = {
          nick,
          modem,
          text: msg,
          date: new Date().toLocaleDateString('ru-RU')
        };

        try {
          const saved = JSON.parse(localStorage.getItem(this.webCinemaCommentsKey) || '[]');
          saved.push(newComment);
          localStorage.setItem(this.webCinemaCommentsKey, JSON.stringify(saved));
        } catch (e) {}

        if (window.soundSys) window.soundSys.playDing();
        window.winManager.openDialog({
          title: 'Гостевая книга',
          icon: 'info',
          message: 'Ваш отзыв успешно записан в Гостевую книгу WebCinema \'98!'
        });

        this.renderPage(win, this.currentUrl);
      });
    }

    container.querySelectorAll('.wc-webring-link[data-url]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(win, link.dataset.url);
      });
    });
  }
}

window.appIE = new AppIE();
