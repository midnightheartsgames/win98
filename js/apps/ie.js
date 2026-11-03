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
    this.newsCategoryFilter = 'all';
    this.newsSearchQuery = '';
    this.newsActiveThemeAxis = 'autonomy';
    this.chatMessagesKey = 'win98_krovatka_messages';
    this.activeChatRoom = 'general';
    this.anekdotVotesKey = 'win98_anekdot_votes';
    this.geocitiesPagesKey = 'win98_geocities_pages';
    this.voodooBenchResult = null;

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
          if (pageKey === 'steam' || pageKey === 'valve' || pageKey === 'blizzard' || pageKey === 'sunsetvalley' || pageKey === 'bioware' || pageKey === 'softstore' || pageKey === 'blender' || pageKey === 'hsr' || pageKey === 'hsrwiki' || pageKey === 'lucasarts' || pageKey === 'gsc' || pageKey === 'avp') {
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
      ['http://www.microslop.com', 'Microslop Win 98 Portal'],
      ['http://www.search98.com', 'WebSeeker 98 (Поиск)'],
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
    if (clean.replace(/^[a-z]+:\/{2}/, '').split(/[/?#]/)[0].endsWith('themeworld98.com')) {
      return 'themeworld';
    }
    if (clean.includes('webcinema98')) {
      return 'webvideo';
    }
    if (clean.replace(/^[a-z]+:\/{2}/, '').split(/[/?#]/)[0].endsWith('carman99.ru')) {
      return 'carman';
    }
    if (clean.replace(/^[a-z]+:\/{2}/, '').split(/[/?#]/)[0].endsWith('kish99.ru')) {
      return 'kish';
    }
    if (clean.replace(/^[a-z]+:\/{2}/, '').split(/[/?#]/)[0].endsWith('prodigy99.ru')) {
      return 'prodigy';
    }
    if (clean.replace(/^[a-z]+:\/{2}/, '').split(/[/?#]/)[0].endsWith('svodka99.ru')) {
      return 'svodka';
    }
    if (clean.replace(/^[a-z]+:\/{2}/, '').split(/[/?#]/)[0].endsWith('animatrix99.ru')) {
      return 'animatrix';
    }
    if (clean.replace(/^[a-z]+:\/{2}/, '').split(/[/?#]/)[0].endsWith('pereplet99.ru')) {
      return 'pereplet';
    }
    if (clean.replace(/^[a-z]+:\/{2}/, '').split(/[/?#]/)[0].endsWith('lucasarts.com')) {
      return 'lucasarts';
    }
    if (clean.includes('ashroad98') || clean.includes('ashroad') || clean.includes('pepel98') || clean.includes('mmo98')) {
      return 'ashroad';
    }
    if (clean.includes('astralwiki98') || clean.includes('astral-wiki98') || clean.includes('hsrwiki98')) {
      return 'hsrwiki';
    }
    if (clean.includes('kovcheg98')) {
      return 'kovcheg';
    }
    if (clean.includes('sunsetvalley') || clean.includes('sunset-valley') || clean.includes('thesims98') || clean.includes('maxis98') || clean.includes('maxis.com')) {
      return 'sunsetvalley';
    }
    if (clean.includes('bioware98') || clean.includes('bioware.com') || clean.includes('bioware') || clean.includes('ferelden98') || clean.includes('kotor98') || clean.includes('masseffect98')) {
      return 'bioware';
    }
    if (clean.includes('blizzard') || clean.includes('battle.net') || clean.includes('diablo98') || clean.includes('warcraft98')) {
      return 'blizzard';
    }
    if (clean.includes('valvesoftware') || clean.includes('valve.com') || clean.includes('half-life.com') || clean.includes('blackmesa98')) {
      return 'valve';
    }
    if (clean.includes('gsc-game') || clean.includes('gsc.com') || clean.includes('stalker98.com') || clean.includes('xray98')) {
      return 'gsc';
    }
    if (clean.includes('lucasarts') || clean.includes('scumm98') || clean.includes('adventurer98')) {
      return 'lucasarts';
    }
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
    if (clean.includes('ferrum98') || clean.includes('ferrum') || clean.includes('hardlab98')) {
      return 'ferrum';
    }
    if (clean.includes('forum.games98.com')) {
      return 'forum';
    }
    if (clean.includes('krovatka98.ru') || clean.includes('krovatka.ru')) {
      return 'chat';
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
    if (clean.includes('animatrix') || clean.includes('anime99') || clean.includes('animeru') || clean.includes('ranma99') || clean.includes('otaku99')) {
      return 'animatrix';
    }
    if (clean.includes('digi') || clean.includes('charat') || clean.includes('dejiko') || clean.includes('puchiko') || clean.includes('gamers-dejiko')) {
      return 'digicharat';
    }
    if (clean.includes('windowsupdate') || clean.includes('winupdate') || clean.includes('wupdmgr')) {
      return 'winupdate';
    }
    if (clean.includes('microslop') || clean.includes('msft') || clean.includes('windows98.com') || clean.includes('win98clone') || clean.includes('windows.com')) {
      return 'microslop';
    }
    if (clean.includes('rambler') || clean.includes('aport')) {
      return 'rambler';
    }
    if (clean.includes('svodka99') || clean.includes('svodka.ru') || clean.includes('svodka') || clean.includes('lenta99') || clean.includes('gazeta99') || clean.includes('vesti99') || clean.includes('novosti99')) {
      return 'svodka';
    }
    if (clean.includes('pereplet') || clean.includes('lit99') || clean.includes('knigi99') || clean.includes('teneta99') || clean.includes('vavilon99')) {
      return 'pereplet';
    }
    if (clean.includes('zooportal') || clean.includes('zooclub98') || clean.includes('fauna98') || clean.includes('zveromir98')) {
      return 'zooportal';
    }
    if (clean.includes('dima_web') || clean.includes('dima-webmaster') || clean.includes('dima.html') || clean.includes('/~dima') || clean.includes('dima98')) {
      return 'dima_webmaster';
    }
    if (clean.includes('geocities') || clean.includes('narod') || clean.includes('coolhacker')) {
      return 'geocities';
    }
    if (clean.includes('carman') || clean.includes('car-man') || clean.includes('lemokh') || clean.includes('karmen')) {
      return 'carman';
    }
    if (clean.includes('muzzone') || clean.includes('muzoboz') || clean.includes('mtv98') || clean.includes('rock98')) {
      return 'muzzone';
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
    if (clean.includes('avp.ru') || clean.includes('avp98.ru') || clean.includes('kaspersky') || clean.includes('kami.ru')) {
      return 'avp';
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
    if (pageKey !== 'carman' && window.carmanSite && typeof window.carmanSite.stopSynth === 'function') {
      window.carmanSite.stopSynth();
    }
    if (pageKey !== 'kish' && window.kishSite && typeof window.kishSite.stopSynth === 'function') {
      window.kishSite.stopSynth();
    }
    if (pageKey !== 'prodigy' && window.prodigySite && typeof window.prodigySite.stopSynth === 'function') {
      window.prodigySite.stopSynth();
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

    if (pageKey === 'winupdate') {
      contentFrame.innerHTML = this.renderWinUpdatePage(url);
      this.attachWinUpdateEvents(win, contentFrame);
    } else if (pageKey === 'microslop') {
      contentFrame.innerHTML = this.renderMicroslopPage(url);
      this.attachMicroslopEvents(win, contentFrame, url);
    } else if (pageKey === 'rambler') {
      contentFrame.innerHTML = this.renderRambler();
      this.attachRamblerEvents(win, contentFrame);
    } else if (pageKey === 'muzzone') {
      if (window.muzzoneSite) {
        contentFrame.innerHTML = window.muzzoneSite.renderSite(url);
        window.muzzoneSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'carman') {
      if (window.carmanSite) {
        contentFrame.innerHTML = window.carmanSite.renderSite(url);
        win.titleElement.textContent = `${window.carmanSite.getPageTitle(url)} - Microslop Internet Explorer`;
        window.carmanSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'kish') {
      if (window.kishSite) {
        contentFrame.innerHTML = window.kishSite.renderSite(url);
        win.titleElement.textContent = `${window.kishSite.getPageTitle(url)} - Microslop Internet Explorer`;
        window.kishSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'prodigy') {
      if (window.prodigySite) {
        contentFrame.innerHTML = window.prodigySite.renderSite(url);
        win.titleElement.textContent = `${window.prodigySite.getPageTitle(url)} - Microslop Internet Explorer`;
        window.prodigySite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'svodka') {
      if (window.svodkaSite) {
        contentFrame.innerHTML = window.svodkaSite.renderSite(url);
        if (typeof window.svodkaSite.getPageTitle === 'function') {
          win.titleElement.textContent = `${window.svodkaSite.getPageTitle(url)} - Microslop Internet Explorer`;
        }
        window.svodkaSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'pereplet') {
      if (window.perepletSite) {
        contentFrame.innerHTML = window.perepletSite.renderSite(url);
        win.titleElement.textContent = `${window.perepletSite.getPageTitle(url)} - Microslop Internet Explorer`;
        window.perepletSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'animatrix') {
      if (window.animatrixSite) {
        contentFrame.innerHTML = window.animatrixSite.renderSite(url);
        win.titleElement.textContent = `${window.animatrixSite.getPageTitle(url)} - Microslop Internet Explorer`;
        window.animatrixSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'zooportal') {
      if (window.zooportalSite) {
        contentFrame.innerHTML = window.zooportalSite.renderSite(url);
        if (typeof window.zooportalSite.getPageTitle === 'function') {
          win.titleElement.textContent = `${window.zooportalSite.getPageTitle(url)} - Microslop Internet Explorer`;
        }
        window.zooportalSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'lucasarts') {
      if (window.lucasartsSite) {
        contentFrame.innerHTML = window.lucasartsSite.renderSite(url);
        window.lucasartsSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'ashroad') {
      if (window.ashroadSite) {
        contentFrame.innerHTML = window.ashroadSite.renderSite(url);
        window.ashroadSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'kovcheg') {
      if (window.kovchegSite) {
        contentFrame.innerHTML = window.kovchegSite.renderSite(url);
        win.titleElement.textContent = `${window.kovchegSite.getPageTitle(url)} - Microslop Internet Explorer`;
        window.kovchegSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'hsrwiki') {
      if (window.hsrWikiSite) {
        contentFrame.innerHTML = window.hsrWikiSite.renderSite(url);
        win.titleElement.textContent = `${window.hsrWikiSite.getPageTitle(url)} - Microslop Internet Explorer`;
        window.hsrWikiSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'gsc') {
      if (window.gscSite) {
        contentFrame.innerHTML = window.gscSite.renderSite(url);
        window.gscSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'valve') {
      if (window.valveSite) {
        contentFrame.innerHTML = window.valveSite.renderSite(url);
        if (typeof window.valveSite.getPageTitle === 'function') {
          win.titleElement.textContent = `${window.valveSite.getPageTitle(url)} - Microslop Internet Explorer`;
        }
        window.valveSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'blizzard') {
      if (window.blizzardSite) {
        contentFrame.innerHTML = window.blizzardSite.renderSite(url);
        window.blizzardSite.attachEvents(win, contentFrame, url);
      }
    } else if (pageKey === 'sunsetvalley') {
      if (window.sunsetValleySite) {
        contentFrame.innerHTML = window.sunsetValleySite.renderSite(url);
        if (typeof window.sunsetValleySite.getPageTitle === 'function') {
          win.titleElement.textContent = `${window.sunsetValleySite.getPageTitle(url)} - Microslop Internet Explorer`;
        }
        window.sunsetValleySite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'bioware') {
      if (window.biowareSite) {
        contentFrame.innerHTML = window.biowareSite.renderSite(url);
        if (typeof window.biowareSite.getPageTitle === 'function') {
          win.titleElement.textContent = `${window.biowareSite.getPageTitle(url)} - Microslop Internet Explorer`;
        }
        window.biowareSite.attachEvents(win, contentFrame, this);
      }
    } else if (pageKey === 'mp3vault') {
      contentFrame.innerHTML = this.renderMp3Vault();
      this.attachMp3VaultEvents(win, contentFrame);
    } else if (pageKey === 'kinomania') {
      contentFrame.innerHTML = window.kinomaniaSite.renderSite(url);
      window.kinomaniaSite.attachEvents(win, contentFrame, url);
    } else if (pageKey === 'webvideo') {
      if (window.webcinemaSite) {
        contentFrame.innerHTML = window.webcinemaSite.renderSite(url);
        window.webcinemaSite.attachEvents(win, contentFrame);
      }
    } else if (pageKey === 'avp') {
      if (window.avpSite) {
        contentFrame.innerHTML = window.avpSite.render(url);
        window.avpSite.attachEvents(contentFrame, win, url, (nextUrl) => this.navigate(win, nextUrl));
      }
    } else if (pageKey === 'antivirus') {
      contentFrame.innerHTML = this.renderAntiVirus();
      this.attachAntiVirusEvents(win, contentFrame);
    } else if (pageKey === 'anekdot') {
      const anekdotPage = this.parseAnekdotUrl(url);
      contentFrame.innerHTML = this.renderAnekdot(anekdotPage);
      win.titleElement.textContent = `${this.getAnekdotTitle(anekdotPage)} - Microslop Internet Explorer`;
      this.attachAnekdotEvents(win, contentFrame);
    } else if (pageKey === 'chat') {
      contentFrame.innerHTML = this.renderChat(url);
      if (window.krovatkaSite && typeof window.krovatkaSite.getPageTitle === 'function') {
        win.titleElement.textContent = `${window.krovatkaSite.getPageTitle(url)} - Microslop Internet Explorer`;
      }
      this.attachChatEvents(win, contentFrame);
    } else if (pageKey === 'dima_webmaster') {
      contentFrame.innerHTML = this.renderDimaWebmasterPage();
      this.attachDimaWebmasterEvents(win, contentFrame);
    } else if (pageKey === 'geocities') {
      contentFrame.innerHTML = this.renderGeoCities(url);
      if (window.geocitiesSite && typeof window.geocitiesSite.getPageTitle === 'function') {
        win.titleElement.textContent = `${window.geocitiesSite.getPageTitle(url)} - Microslop Internet Explorer`;
      }
      this.attachGeoCitiesEvents(win, contentFrame);
    } else if (pageKey === 'hardware') {
      contentFrame.innerHTML = this.renderHardware3dfx();
      this.attachHardware3dfxEvents(win, contentFrame);
    } else if (pageKey === 'ferrum') {
      if (window.ferrumSite) {
        contentFrame.innerHTML = window.ferrumSite.renderSite(url);
        window.ferrumSite.bindEvents(win, contentFrame);
      }
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
      if (window.themeWorldSite) {
        contentFrame.innerHTML = window.themeWorldSite.renderSite(url);
        if (typeof window.themeWorldSite.getPageTitle === 'function') {
          win.titleElement.textContent = `${window.themeWorldSite.getPageTitle(url)} - Microslop Internet Explorer`;
        }
        window.themeWorldSite.attachEvents(win, contentFrame, this);
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
      case 'ashroad': return "Пепельный Тракт '98 - Многопользовательская игра в браузере";
      case 'kovcheg': return 'Ковчег: гайды и тир-листы';
      case 'hsrwiki': return "АстралВики '98: Народная энциклопедия Звёздного экспресса";
      case 'sunsetvalley': return 'Сансет Вэлли и бюро Maxis (Walnut Creek) — Официальный узел The Sims 3';
      case 'bioware': return 'BioWare Corp. Edmonton (1998) — Dragon Age: Origins 98 & Star Wars: KOTOR 98';
      case 'blizzard': return 'Blizzard Entertainment & Blizzard North (1998) — Diablo, Diablo II и анонс Warcraft';
      case 'valve': return 'Valve Software (Kirkland, WA) — Half-Life 98, Half-Life 2, Steam и Dota 98';
      case 'gsc': return 'GSC Game World (Киев) — Официальный узел S.T.A.L.K.E.R. и движка X-Ray 98';
      case 'lucasarts': return 'LucasArts Entertainment Company — The Adventurer & SCUMM (1998)';
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
      case 'winupdate': return this.winUpdateIsRu() ? 'Обновление Win — Microslop' : 'Microslop Win Update — Product Updates & Critical Patches';
      case 'microslop': return 'Microslop(R) Win 98 Portal - Official Knowledge Base & Forum';
      case 'rambler': return "Рамблер '98 - Первая российская поисковая система и каталог";
      case 'muzzone': return "МузЗона '98 — Музыкальный обозреватель, клипы MTV и MP3 (25 ноября 1998)";
      case 'carman': return "Кар-Мэн '99 - фан-клуб группы «Кар-Мэн»";
      case 'kish': return "Король и Шут '99 - Трактир «Старая Сказка»";
      case 'prodigy': return "The Prodigy '99 - Russian Rave Bunker & Antifaq";
      case 'svodka': return "Сводка.ру '99 — Ежедневная русская интернет-газета и лента новостей (28 декабря 1999)";
      case 'pereplet': return "Переплёт '99 - литературный альманах в Сети, выпуск 12";
      case 'animatrix': return "АниМатрица '99 :: аниме-узел, клубный фонд и фансаб";
      case 'zooportal': return "ЗооПортал '98 — Живая Планета, Заповедники и Домашний Зверинец (Ноябрь 1998)";
      case 'mp3vault': return "MP3 Vault '98 - Цифровой архив музыки в формате MP3";
      case 'kinomania': return "Киномания '98 - Новости кино и сериалов, КиноФорум (Ноябрь 1998)";
      case 'webvideo': return "WebCinema '98 — Интернет-кинотеатр. Зал на одно место";
      case 'avp': return 'Лаборатория Касперского (AVP 3.0) — Антивирусная защита и энциклопедия вирусов (1998)';
      case 'antivirus': return 'AntiVirus Lab 1998 - Лаборатория защиты от киберугроз';
      case 'anekdot': return 'Anekdot.ru 1998 - Ежедневные анекдоты из России';
      case 'chat': return "Чат Кроватка '98 - Самый популярный веб-чат Рунета";
      case 'dima_webmaster': return "Домашняя страничка Вебмастера Димы (GeoCities / SiliconValley '98)";
      case 'geocities': return "GeoCities '98 - Home of Free Personal Web Pages";
      case 'hardware': return '3dfx Voodoo Zone & Hardware Overclockers 1998';
      case 'ferrum': return "Железный Цех '98 — Разгон, тесты и защита ПК (25 ноября 1998)";
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
        ['http://www.retro-news98.com', 'Cyberspace Times', 'новости Сети и технологий: ежедневная газета, 20 статей, репортажи и обзоры'],
        ['http://www.microslop.com', 'Microslop.com', 'официальный портал Win 98: база знаний, программы, форум'],
        ['http://www.retro-web.net', 'Retro-Web', 'всё о Всемирной Паутине 1998 года'],
		['http://www.steampowered.com', 'Steam', 'покупка и загрузка игр через клиент Steam'],
		['http://www.goldfargus.ru', 'Фаргус', 'золотая коллекция полных русских версий'],
        ['http://www.kovcheg98.ru', 'Ковчег', 'гайды, тир-листы и отряды для ролевых игр: Honkai: Star Rail 98'],
        ['http://www.svodka99.ru', "Сводка.ру '99", 'ежедневная интернет-газета конца 1999 г.: лента, справочная, курсы ЦБ и Проблема-2000'],
        ['http://www.zooportal98.ru', "ЗооПортал '98", 'портал о животных и живой природе: атлас 12 видов, радиопеленг 6 заповедников, конструктор аквариума, айболит и клуб зверолюбов']
      ] },
      { title: 'Компьютерные игры', sites: [
        ['http://www.ashroad98.ru', "Пепельный Тракт '98", 'многопользовательская браузерная игра (MMO): поединки в трёх зонах, 12 секторов тракта, кузница и чат Заставы'],
        ['http://www.bioware98.com', 'BioWare Edmonton', 'официальный узел RPG: Dragon Age: Origins 98 (Ферелден, тактика, травничество) и Star Wars: KOTOR 98 (Тарис, калькулятор d20 и Пазаак)'],
        ['http://www.sunsetvalley98.com', 'Сансет Вэлли & Maxis', 'официальный узел The Sims 3: кадастр 39 участков, перепись 10 семей, бюро CAS и альманах'],
        ['http://www.blizzard.com', 'Blizzard Entertainment', 'официальный сайт: Diablo, Diablo II и Overwatch 98 в Steam, анонс Warcraft, кузница рун и Battle.net'],
        ['http://www.valvesoftware.com', 'Valve Software', 'официальный сайт (Киркланд): Half-Life 98, Half-Life 2, Steam, Dota 98 и испытательный стенд λ'],
        ['http://www.gsc-game.com', 'GSC Game World', 'официальный сайт (Киев): все 3 игры S.T.A.L.K.E.R., дневники движка X-Ray 98 и справочник КПК'],
        ['http://www.lucasarts.com', 'LucasArts', 'официальный сайт: The Adventurer, все серии Sam & Max, LucasQuest 98 и лаборатория SCUMM'],
        ['http://hsr.hoyoverse.com', 'Honkai: Star Rail 98', 'официальный сайт: бесплатная загрузка, персонажи, новости'],
        ['http://www.emuland98.ru', 'Emu-Land', 'дампы картриджей Dendy и Sega'],
        ['http://www.igromania.ru', 'Игромания', 'журнал: ролики с CD, горячая линия, читерский уголок'],
        ['http://www.cheatcc.com', 'Cheat Code Central', 'проверенные коды и меню F7 к играм из Steam'],
        ['http://forum.games98.com', 'GamerZone', 'всероссийский форум геймеров']
      ] },
      { title: 'Кино и видео', sites: [
        ['http://www.animatrix99.ru', "АниМатрица '99", 'аниме-узел: клубный фонд кассет, скрипты .SSA, явки и сходка у Большого театра'],
        ['http://www.mult98.ru', 'Мульт.ру', 'народная веб-анимация и Масяня'],
        ['http://www.kinomania98.ru', "Киномания '98", 'новости кино, кассовые сборы и КиноФорум'],
        ['http://www.webcinema98.com', "WebCinema '98", 'интернет-кинотеатр из Самары: 8 роликов, время загрузки под ваш модем, книга отзывов'],
        ['http://www.poligon3d.ru', 'ПОЛИГОН', 'музыкальные клипы, собранные заново в 3D'],
        ['http://www.youvid.com', 'YouVid', 'видео от авторов: каналы, подписки, комментарии'],
        ['http://www.spacejam.com', 'Space Jam', 'официальный сайт фильма 1996 года']
      ] },
      { title: 'Музыка и MP3', sites: [
        ['http://www.muzzone98.ru', "МузЗона '98", 'новости групп, видеоклипы MTV, хит-парад и аккорды'],
        ['http://www.carman99.ru', "Кар-Мэн '99 (Car-Man)", 'фан-клуб экзотик-поп-группы: альбомы с треклистами, атлас песен, состав по годам, история 1989–1999, гостевая'],
        ['http://www.kish99.ru', "Король и Шут '99", 'трактир «Старая Сказка»: карта сказок и бестиарий, дворовый песенник, альбомы и бутлеги, панк-шарманка MIDI, книга жалоб'],
        ['http://www.prodigy99.ru', "The Prodigy '99", 'Russian Rave Bunker: детектор пиратских фейков Горбушки, лаборатория сэмплов Лиама Хоулетта, архив Манежки 27.09.1997, MIDI, гостевая'],
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
        ['http://www.avp.ru', 'Лаборатория Касперского (AVP 3.0)', 'официальный сайт Антивируса Касперского AVP 3.0: покупка лицензии, скачивание Setup_AVP.exe, базы DAILY.AVC, энциклопедия VirusList и эвристик CodeAnalyzer'],
        ['http://www.ferrum98.ru', "Железный Цех '98", 'новости железа на 25.11.1998, стенд разгона, прайсы и защита BIOS'],
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
        ['http://www.astralwiki98.ru', "АстралВики '98", 'народная энциклопедия по лору, мирам, квестам, загадкам и картам Honkai: Star Rail 98'],
        ['http://www.lib.ru', 'Lib.ru', 'библиотека Максима Мошкова'],
        ['http://www.pereplet99.ru', "Переплёт '99", 'литературный альманах, декабрь 1999: книжная полка с каталожными карточками, летопись осени, подшивка толстых журналов, чтение по модему, букинист'],
        ['http://www.xfiles98.ru', 'Истина рядом', 'рассекреченные дела об НЛО'],
        ['http://www.anekdot98.ru', 'Анекдоты', 'анекдоты из России каждый день'],
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
            <span class="search98-banner-text"><b>STEAM</b> — купите игру, и она сама приедет по модему!<br><small>DOOM, Diablo, Dota 98 и ещё 20 игр</small></span>
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

    if (
      q.includes('пепельн') || q.includes('тракт') || q.includes('ashroad') ||
      q.includes('ммо') || q.includes('mmo') || q.includes('mud') ||
      q.includes('браузерн') || q.includes('старый брод') || q.includes('звонар') ||
      q.includes('громов') || q.includes('поединк')
    ) {
      results.push({
        title: "Пепельный Тракт '98 - Многопользовательская игра в браузере (MMO)",
        url: 'http://www.ashroad98.ru',
        snippet: 'Многопользовательская браузерная игра на таблицах без апплетов: застава Старый Брод, одновременные поединки в трёх зонах и четырёх стойках, 12 секторов Пепельного Тракта с короткими путями, кузница Громова, комиссионный ряд и живой чат.'
      });
    }

    if (
      q.includes('bioware') || q.includes('биовар') || q.includes('edmonton') ||
      q.includes('эдмонтон') || q.includes('dragon age') || q.includes('драгон эйдж') ||
      q.includes('dao') || q.includes('ферелден') || q.includes('ferelden') ||
      q.includes('остагар') || q.includes('ostagar') || q.includes('кусланд') ||
      q.includes('морриган') || q.includes('алистер') || q.includes('лелиан') ||
      q.includes('порождения тьмы') || q.includes('серые стражи') || q.includes('kotor') ||
      q.includes('котор') || q.includes('old republic') || q.includes('старой республики') ||
      q.includes('тарис') || q.includes('taris') || q.includes('бастил') ||
      q.includes('bastila') || q.includes('пазаак') || q.includes('pazaak') ||
      q.includes('свуп') || q.includes('кандерус') || q.includes('бендак')
    ) {
      results.push({
        title: 'BioWare Corp. Edmonton (1998) — Официальный портал Dragon Age: Origins 98 & Star Wars: KOTOR 98',
        url: 'http://www.bioware98.com',
        snippet: 'Официальный узел студии BioWare Edmonton: демоверсии DAORIGINS.EXE и KOTOR.EXE на диске «Игромании», архив 6 предысторий и 18 веток способностей Ферелдена, интерактивный конструктор матрицы тактики ИИ (D.TAC_COND) и травничества, голокрон 13 секторов Тариса, калькулятор правил Star Wars d20 и игровой стол Пазаака.'
      });
    }

    if (
      q.includes('sims') || q.includes('симс') || q.includes('maxis') ||
      q.includes('максис') || q.includes('сансет') || q.includes('sunset') ||
      q.includes('гот') || q.includes('goth') || q.includes('ландграаб') ||
      q.includes('landgraab') || q.includes('альто') || q.includes('alto') ||
      q.includes('белла') || q.includes('мортимер') || q.includes('амбрози') ||
      q.includes('ambrosia') || q.includes('рыба-смерть') || q.includes('плод жизни') ||
      q.includes('райдт') || q.includes('wright') || q.includes('симолеон')
    ) {
      results.push({
        title: 'Муниципальный узел Сансет Вэлли и бюро Maxis (1998) — The Sims 3 (SIMS3.EXE)',
        url: 'http://www.sunsetvalley98.com',
        desc: 'Официальный узел мэрии Сансет Вэлли и студии Maxis (Уолнат-Крик): газета «Вестник Сансет Вэлли», интерактивный кадастр 39 участков (160×160), перепись 10 семей (Гот, Ландграаб, Альто, Холостякки), паспортный стол CAS (56 черт и 29 мечт всей жизни с печатью анкеты в Блокнот), каталог 83 объектов с перекраской Create-A-Style и энциклопедия 11 карьер, 22 рецептов и 16 рыб.'
      });
    }

    if (
      q.includes('blizzard') || q.includes('близзард') || q.includes('diablo') ||
      q.includes('диабло') || q.includes('дьябло') || q.includes('warcraft') ||
      q.includes('варкрафт') || q.includes('battle.net') || q.includes('battlenet') ||
      q.includes('тристрам') || q.includes('tristram') || q.includes('санктуари') ||
      q.includes('азерот') || q.includes('лордерон') || q.includes('хорадрим') ||
      q.includes('каин') || q.includes('андариэл') || q.includes('мясник') ||
      q.includes('леорик') || q.includes('пеон') || q.includes('орда') ||
      q.includes('альянс') || q.includes('overwatch') || q.includes('овервотч')
    ) {
      results.push({
        title: 'Blizzard Entertainment & Blizzard North (1998) — Официальный узел Diablo, Diablo II и анонс Warcraft',
        url: 'http://www.blizzard.com',
        snippet: 'Новости Ирвайна и Сан-Матео: Diablo, Diablo II и Overwatch 98 в Steam, превью стратегии Warcraft: Хроники Азерота, Хорадрическая библиотека рун и веб-чат Battle.net.'
      });
    }

    if (
      q.includes('valve') || q.includes('half-life') || q.includes('halflife') ||
      q.includes('hl2') || q.includes('чёрная меза') || q.includes('черная меза') ||
      q.includes('black mesa') || q.includes('сити 17') || q.includes('city 17') ||
      q.includes('гравипушк') || q.includes('рейвенхолм') || q.includes('ravenholm') ||
      q.includes('вортигонт') || q.includes('хедкраб') || q.includes('dota') ||
      q.includes('дота') || q.includes('techies') || q.includes('icefrog') ||
      q.includes('гейб') || q.includes('ньюэлл') || q.includes('cabal') ||
      q.includes('кабал') || q.includes('киркланд')
    ) {
      results.push({
        title: 'Valve Software (Kirkland, WA) — Официальный инженерный узел Half-Life 98, Half-Life 2, Steam и Dota 98',
        url: 'http://www.valvesoftware.com',
        snippet: 'Технические паспорта и доклады разработчиков: Half-Life 98 (HL.EXE, 16 отсеков Чёрной Мезы), Half-Life 2 (HL2.EXE, 14 глав и гравипушка), клиент Steam 1.0 (узлы МТУ-Интел и модемный лимитер) и Dota 98 (DOTA.EXE, The Techies Update). Испытательный стенд λ и атлас уровней.'
      });
    }

    if (
      q.includes('ковчег') || q.includes('kovcheg') || q.includes('гайд') || q.includes('guide') ||
      q.includes('тир-лист') || q.includes('тир лист') || q.includes('tier') || q.includes('сборк') ||
      q.includes('отряд') || q.includes('кого крутить') || q.includes('prydwen') || q.includes('зал забвения') ||
      q.includes('слияни') || q.includes('honkai') || q.includes('star rail') || q.includes('хонкай')
    ) {
      results.push({
        title: 'Ковчег — гайды, тир-листы и отряды для ролевых игр',
        url: 'http://www.kovcheg98.ru',
        snippet: 'Honkai: Star Rail 98: тир-лист по ролям для Зала забвения, боссов и Виртуальной вселенной, личные дела всех персонажей, готовые отряды и разбор пятнадцати этапов Зала. Оценки по замерам, а не на глаз.'
      });
    }

    if (
      q.includes('астралвики') || q.includes('astralwiki') || q.includes('лор') || q.includes('эон') ||
      q.includes('стелларон') || q.includes('ярило') || q.includes('белобог') || q.includes('загадк') ||
      q.includes('записк') || q.includes('атлас') || q.includes('honkai') || q.includes('star rail') || q.includes('хонкай')
    ) {
      results.push({
        title: "АстралВики '98: Народная энциклопедия Звёздного экспресса",
        url: 'http://www.astralwiki98.ru',
        snippet: 'Свободный архив лора и мира Honkai: Star Rail 98: устройство Вселенной, Эоны и Пути, досье фракций и культур, разбор сюжета и мотивов, прохождение загадок, ASCII-атлас 55 секторов и расшифровка 63 записок.'
      });
    }

    if (
      q.includes('gsc') || q.includes('сталкер') || q.includes('stalker') ||
      q.includes('s.t.a.l.k.e.r') || q.includes('припят') || q.includes('затон') ||
      q.includes('x-ray') || q.includes('xray') || q.includes('xr98') ||
      q.includes('сидорович') || q.includes('стрелок') || q.includes('меченый') ||
      q.includes('дегтяр') || q.includes('скадовск') || q.includes('выброс') ||
      q.includes('артефакт') || q.includes('монолит') || q.includes('кордон')
    ) {
      results.push({
        title: 'GSC Game World (Киев) — Официальный узел S.T.A.L.K.E.R. и движка X-Ray 98',
        url: 'http://www.gsc-game.com',
        snippet: 'Новости разработки и досье всех трёх игр серии: S.T.A.L.K.E.R. (1998 Alpha, STALKER.EXE) и S.T.A.L.K.E.R.: Зов Припяти 98 (ZATON.EXE — открытый мир Затона) в Steam, S.T.A.L.K.E.R. 98 (3D-движок XR98.EXE — Кордон и Свалка) демоверсией на диске «Игромании». Инженерные дневники и справочник КПК.'
      });
    }

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

    if (
      q.includes('желез') || q.includes('ferrum') || q.includes('цех') || q.includes('разгон') ||
      q.includes('celeron') || q.includes('300a') || q.includes('b21') || q.includes('voodoo') ||
      q.includes('tnt') || q.includes('riva') || q.includes('abit') || q.includes('bh6') ||
      q.includes('asus') || q.includes('p2b') || q.includes('савёл') || q.includes('савел') ||
      q.includes('митино') || q.includes('прайс') || q.includes('bios') || q.includes('биос') ||
      q.includes('cih') || q.includes('чернобыл') || q.includes('orifice') || q.includes('netbus')
    ) {
      results.push({
        title: '«Железный Цех \'98» (FerrumLab.ru) — Испытания железа, разгон и защита (25.11.1998)',
        url: 'http://www.ferrum98.ru',
        snippet: 'Сводка на 25 ноября 1998 г.: COMDEX Fall \'98 (3dfx Voodoo3 и покупка STB), разгон Celeron 300A до 450 МГц (пин B21), защита BIOS от вируса CIH, интерактивный стенд FPS и прайс Савёловского и Митино.'
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

    if (q.includes('сводка') || q.includes('svodka') || q.includes('лента') || q.includes('газета') || q.includes('телетайп') || q.includes('дефолт') || q.includes('ммвб') || q.includes('цб рф') || q.includes('курс доллар') || q.includes('станция мир') || q.includes('цуп') || q.includes('госкомсвяз') || q.includes('ммтс-9') || q.includes('миллениум') || q.includes('28 декабря') || q.includes('1999') || q.includes('новости')) {
      results.push({
        title: "Сводка.ру '99 — Ежедневная русская интернет-газета и лента новостей (28 декабря 1999)",
        url: 'http://www.svodka99.ru',
        snippet: 'Лента и выпуск № 303 от 28 декабря 1999 г.: новогоднее дежурство связистов и энергетиков, доллар ЦБ по 26,95 руб., станция «Мир» без экипажа, итоги выборов в Госдуму 19 декабря, ночной Рунет, справочная из 18 карточек, калькулятор рубля и редакторская «Правка».'
      });
    }

    if (q.includes('переплет') || q.includes('переплёт') || q.includes('pereplet') || q.includes('литератур') || q.includes('книг') || q.includes('пелевин') || q.includes('generation') || q.includes('акунин') || q.includes('фандорин') || q.includes('лукьяненк') || q.includes('дозор') || q.includes('сорокин') || q.includes('маканин') || q.includes('андеграунд') || q.includes('шишкин') || q.includes('измаил') || q.includes('бутов') || q.includes('букер') || q.includes('мураками') || q.includes('букинист') || q.includes('пушкин') || q.includes('набоков') || q.includes('журнальный зал') || q.includes('новый мир') || q.includes('знамя')) {
      results.push({
        title: "Переплёт '99 - литературный альманах в Сети, выпуск 12 (декабрь 1999)",
        url: 'http://www.pereplet99.ru',
        snippet: 'Декабрьский выпуск: книжная полка с каталожными карточками (Пелевин, Акунин, Лукьяненко, Сорокин, Бутов, Шишкин, Мураками, Маканин), Букер-99 и шорт-лист, летопись осени, годовая подшивка «Нового мира» и «Знамени», чтение по модему, объявления «Букиниста».'
      });
    }

    if (q.includes('зоо') || q.includes('zooportal') || q.includes('животн') || q.includes('звер') || q.includes('природ') || q.includes('фаун') || q.includes('тигр') || q.includes('нерп') || q.includes('байкал') || q.includes('кошк') || q.includes('кот') || q.includes('собак') || q.includes('овчарк') || q.includes('аквариум') || q.includes('рыбк') || q.includes('неон') || q.includes('скаляр') || q.includes('выхухол') || q.includes('бобр') || q.includes('филин') || q.includes('калан') || q.includes('черепах') || q.includes('хомяк') || q.includes('даррелл') || q.includes('заповедник') || q.includes('птичий рынок') || q.includes('калитник') || q.includes('айболит') || q.includes('ветеринар')) {
      results.push({
        title: "ЗооПортал '98 — Живая Планета, Атлас Фауны и Клуб Зверолюбов (Ноябрь 1998)",
        url: 'http://www.zooportal98.ru',
        snippet: 'Всероссийский портал о живой природе и домашних питомцах: интерактивный радиопеленг 6 заповедников (Сихотэ-Алинь, Байкал, Чистый Лес, Хопёр), систематический атлас 12 видов животных с голосами и Красной книгой, конструктор совместимости аквариума по Золотницкому, памятки Дежурного Айболита и клуб Птичьего рынка на Калитниковской!'
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

    if (q.includes('youvid') || q.includes('ютуб') || q.includes('youtube') || q.includes('видео') || q.includes('video') || q.includes('zoo') || q.includes('зоопарк') || q.includes('jawed') || q.includes('хср') || q.includes('star rail') || q.includes('влад') || q.includes('савельев') || q.includes('одеял') || q.includes('ебатори') || q.includes('найс') || q.includes('nice') || q.includes('караоке') || q.includes('slay') || q.includes('бакс') || q.includes('барбершоп') || q.includes('стрижк') || q.includes('m1s3n') || q.includes('phone') || q.includes('linging') || q.includes('телефон') || q.includes('звонит') || q.includes('рингтон') || q.includes('диалин') || q.includes('dialyn') || q.includes('konosuba') || q.includes('коносуб') || q.includes('crunchyroll') || q.includes('чомуске') || q.includes('аква') || q.includes('мегумин') || q.includes('казум') || q.includes('даркнесс') || q.includes('эндинг') || q.includes('головастик') || q.includes('пампарам') || q.includes('приветствую') || q.includes('смотрящих') || q.includes('wake up roman') || q.includes('roman') || q.includes('роман') || q.includes('тору') || q.includes('tohru') || q.includes('sparkle') || q.includes('искорк') || q.includes('monodrama') || q.includes('монодрам') || q.includes('hsr98') || q.includes('стрей') || q.includes('stray') || q.includes('губн') || q.includes('гармошк') || q.includes('стример') || q.includes('усатый') || q.includes('осудил') || q.includes('наполовину') || q.includes('алерт') || q.includes('klee') || /(^|\s)кли(\s|$)/.test(q) || q.includes('та-та-та') || q.includes('ускользающее солнце') || q.includes('прыг-скок') || q.includes('перепутал') || q.includes('трэк') || q.includes('катос') || q.includes('осуждает') || q.includes('маленькая страна') || q.includes('подскочил') || q.includes('подпрыгнул') || q.includes('ультра') || q.includes('гипер') || q.includes('сверхосужден') || q.includes('keanu') || q.includes('reeves') || q.includes('киану') || q.includes('ривз') || q.includes('cyberpunk') || q.includes('киберпанк') || q.includes('nope') || q.includes('ноуп') || q.includes('инженер') || q.includes('engineer') || q.includes('tf2') || q.includes('сиег') || q.includes('страдани') || q.includes('озон') || q.includes('ozon') || q.includes('телевизор') || q.includes('телек') || q.includes('кирюх') || q.includes('кладбищ') || q.includes('yegud') || q.includes('егудна') || q.includes('картинк') || q.includes('слайд-шоу') || q.includes('fabulous') || q.includes('фабулус') || q.includes('kitty0706') || q.includes('team fortress') || q.includes('кафк') || q.includes('kafka') || q.includes('ирония драмы') || q.includes('baldur') || q.includes('балдур') || q.includes('bg3') || q.includes('grub') || q.includes('too real') || q.includes('каламбург') || q.includes('топинамбур') || q.includes('krutoe pike') || q.includes('хогвартс') || q.includes('поттер') || q.includes('potter') || q.includes('германик') || q.includes('волан-де-морт') || q.includes('гермион') || q.includes('вазелин') || q.includes('пятак') || /(^|\s)buffs?(\s|$)/.test(q) || q.includes('бафф') || /(^|\s)бард(а|у|ом|ы|ов)?(\s|$)/.test(q) || q.includes('укулеле') || q.includes('харизм') || q.includes('charisma') || /(^|\s)стс(\s|$)/.test(q) || q.includes('молодёжь') || q.includes('молодежь') || q.includes('мукбанг') || q.includes('mukbang') || q.includes('опенинг') || q.includes('fantastic dreamer') || q.includes('machico') || q.includes('breaking bad') || q.includes('во все тяжкие') || q.includes('heisenberg') || q.includes('хайзенберг') || q.includes('say my name') || q.includes('уолтер уайт') || q.includes('walter white') || q.includes('placeboing') || q.includes('meet the heavy') || q.includes('meet the soldier') || q.includes('meet the demoman') || q.includes('meet the scout') || q.includes('meet the medic') || q.includes('медик') || q.includes('медиган') || q.includes('medigun') || q.includes('убер-заряд') || q.includes('übercharge') || q.includes('архимед') || q.includes('мега-бабуин') || q.includes('meet the sniper') || q.includes('снайпер') || q.includes('кукри') || q.includes('профессионалы') || q.includes('meet the pyro') || q.includes('meet the spy') || q.includes('шпион') || q.includes('chou-fleur') || q.includes('цветная капуста') || q.includes('поджигател') || q.includes('pyroland') || q.includes('пироленд') || q.includes('скаут') || q.includes('разведчик') || q.includes('сила природы') || q.includes('force of nature') || q.includes('бонк') || q.includes('demoman') || q.includes('демоман') || q.includes('подрывник') || q.includes('липучк') || q.includes('сунь-цзы') || q.includes('sun tzu') || q.includes('турел') || q.includes('больше пушек') || q.includes('more gun') || q.includes('ракетомёт') || q.includes('ракетомет') || q.includes('heavy weapons') || q.includes('хэви') || q.includes('пулемётчик') || q.includes('пулеметчик') || q.includes('nagatoro') || q.includes('нагаторо') || q.includes('easy love') || q.includes('ijiranaide') || q.includes('сайр') || q.includes('shosum') || q.includes('posum') || q.includes('хрючев') || q.includes('joker') || q.includes('джокер') || q.includes('stairs dance') || q.includes('танец на лестнице') || q.includes('артур флек') || q.includes('arthur fleck') || q.includes('парад беды') || q.includes('eptable') || q.includes('downgrade') || q.includes('даунгрейд')) {
      results.push({
        title: 'YouVid - Покажи себя: видео от каждого',
        url: 'http://www.youvid.com',
        snippet: 'Смотрите видео прямо в браузере: «Me at the zoo» от jawed, «Влад Савельев ложится спать», «verynicegoodnice», «Пампарам-пампарам,приветствую смотрящих» и «WAKE UP ROMAN» с канала Планета Ебатории, «Теперь я extremely slay, меньше волос» от Мистера Бакса, «yo phone linging» от m1s3n, «KONOSUBA 3 - Ending» от Crunchyroll, «Sparkle Trailer - Monodrama» на канале HSR98, «Стрей Не Оценил Губную Гармошку» и «Стрей Осудил Наполовину» с канала Планета Ебатории, «Стрей Перепутал Трэк», «Стрей Подскочил» и «Стрей Ультра Гипер Осуждает» на канале СТРЕЙ ОСУЖДАЕТ, «Та-та-та!» Кли (Пиро) на канале HSR98, «Keanu Reeves is Extremely Horny» и «When you need a buff» на канале memes/ytp. Картинку рисует 3D-ускоритель, звук идёт из оригинальной записи. Каналы, подписки, оценки и комментарии.'
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
        title: "ThemeWorld '98 - Обои, заставки и темы для Win 98",
        url: 'http://www.themeworld98.com',
        snippet: 'Обои BMP в трёх размерах, заставка «The Matrix Code» с падающим кодом, темы с курсорами и звуками, сборники ZIP. Время загрузки считается для вашего модема.'
      });
    }

    if (q.includes('blender') || q.includes('блендер') || q.includes('3d') || q.includes('3д') || q.includes('моделир') || q.includes('рендер') || q.includes('render') || q.includes('nan') || q.includes('neogeo') || q.includes('график') || q.includes('mesh')) {
      results.push({
        title: 'Blender 3D - Blender 2.04: free 3D creation and interactive 3D',
        url: 'http://www.blender3d.com',
        snippet: 'Официальный сайт Blender от Not a Number (NaN). Новая версия 2.04 (2.9 МБ): игровой движок с логическими блоками, NURBS, метаболы, 3D-текст, рендер с тенями и контурами, IPO-анимация. Бесплатная загрузка для Win 95/98/NT, галерея, уроки, гостевая книга.'
      });
    }

    if (q.includes('аниматриц') || q.includes('animatrix') || q.includes('аниме') || q.includes('anime') || q.includes('манг') || q.includes('отаку') || q.includes('otaku') || q.includes('евангелион') || q.includes('evangelion') || q.includes('синдзи') || q.includes('шинжи') || q.includes('лэйн') || q.includes('lain') || q.includes('бибоп') || q.includes('bebop') || q.includes('триган') || q.includes('trigun') || q.includes('кэнсин') || q.includes('кеншин') || q.includes('kenshin') || q.includes('мононоке') || q.includes('миядзаки') || q.includes('фансаб') || q.includes('субтитр') || q.includes('ssa') || q.includes('videocd') || q.includes('vcd') || q.includes('кино') || q.includes('видео')) {
      results.push({
        title: "АниМатрица '99: аниме-узел, клубный фонд и фансаб",
        url: 'http://www.animatrix99.ru',
        snippet: 'Клубный фонд кассет с очередью (Serial Experiments Lain, Cowboy Bebop, Rurouni Kenshin: Tsuiokuhen, Evangelion, Принцесса Мононоке, Trigun, Берсерк, Утэна), скрипты .SSA от NERV-Sub, статьи, явки в четырёх городах, доска обмена и конвертер имён по Поливанову.'
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

    if (q.includes('видео') || q.includes('video') || q.includes('кино') || q.includes('cinema') || q.includes('клип') || q.includes('трейлер') || q.includes('trailer') || q.includes('фильм') || q.includes('ролик') || q.includes('prodigy') || q.includes('продиджи') || q.includes('half-life') || q.includes('fallout') || q.includes('berserk') || q.includes('берсерк') || q.includes('мультимедиа') || q.includes('activemovie') || q.includes('кинотеатр') || q.includes('назад в будущее') || q.includes('captain jeff')) {
      results.push({
        title: "WebCinema '98 — Интернет-кинотеатр. Зал на одно место",
        url: 'http://www.webcinema98.com',
        snippet: 'Самарский интернет-кинотеатр: концерт The Prodigy на Манежной площади (1997) целиком, трейлеры Half-Life, Fallout, Fallout 2, Another War и «Берсерка», клип Captain Jeff и клип по «Назад в будущее». Время загрузки под ваш модем, книга отзывов.'
      });
    }

    if (q.includes('король и шут') || q.includes('киш') || q.includes('kish') || q.includes('горшок') || q.includes('князь') || q.includes('горшенев') || q.includes('князев') || q.includes('старая сказка') || q.includes('трактир') || q.includes('ели мясо') || q.includes('кукла колдуна') || q.includes('прыгну со скалы') || q.includes('акустический альбом') || q.includes('панк') || q.includes('музык') || q.includes('mp3')) {
      results.push({
        title: "Король и Шут '99 - Трактир «Старая Сказка»",
        url: 'http://www.kish99.ru',
        snippet: 'Питерский фан-узел группы «Король и Шут»: карта сказочного леса и бестиарий, дворовый песенник с аккордами и переключателем тональности, альбомы и магнитоальбомы с кассетными вкладышами, панк-шарманка MIDI и книга жалоб Трактирщика.'
      });
    }

    if (q.includes('prodigy') || q.includes('продиджи') || q.includes('лиам') || q.includes('хоулетт') || q.includes('кит флинт') || q.includes('манежка') || q.includes('манежная') || q.includes('castbreeder') || q.includes('горбушка') || q.includes('пиратск') || q.includes('рейв') || q.includes('муравей') || q.includes('fat of the land') || q.includes('dirtchamber') || q.includes('smack my bitch up') || q.includes('firestarter') || q.includes('voodoo people') || q.includes('музык') || q.includes('mp3')) {
      results.push({
        title: "The Prodigy '99 - Russian Rave Bunker & Antifaq",
        url: 'http://www.prodigy99.ru',
        snippet: 'Рейв-бункер фанатов The Prodigy: детектор пиратских фейков Горбушки (Castbreeder и Electronic Punks II), лаборатория сэмплов Лиама Хоулетта с пэдами, архив Манежной площади 27.09.1997, MIDI-рифы и гостевая книга.'
      });
    }

    if (q.includes('кар-мэн') || q.includes('кармэн') || q.includes('кар мэн') || q.includes('car-man') || q.includes('carman') || q.includes('лемох') || q.includes('огурцов') || q.includes('титомир') || q.includes('богдан') || q.includes('лондон') || q.includes('сан-франциско') || q.includes('чио-чио-сан') || q.includes('багдад') || q.includes('кармания') || q.includes('вокруг света') || q.includes('король диска') || q.includes('поларис') || q.includes('назад в будущее') || q.includes('экзотик-поп') || q.includes('музык') || q.includes('mp3')) {
      results.push({
        title: "Кар-Мэн '99 (Car-Man) - фан-клуб группы",
        url: 'http://www.carman99.ru',
        snippet: 'Неофициальный фан-клуб «Кар-Мэн»: в продаже альбом ремиксов «Назад в будущее» (декабрь 1999). Треклисты всех альбомов с 1990 года, атлас песен на карте мира, состав дэнс-машины по годам, история дуэта Сергея Лемоха и Богдана Титомира, MIDI и гостевая книга.'
      });
    }

    if (q.includes('муззон') || q.includes('muzzone') || q.includes('музык') || q.includes('клип') || q.includes('mtv') || q.includes('мтв') || q.includes('metallica') || q.includes('металлик') || q.includes('offspring') || q.includes('оффспринг') || q.includes('сплин') || q.includes('мумий') || q.includes('земфир') || q.includes('fatboy') || q.includes('cher') || q.includes('auto-tune') || q.includes('аккорд') || q.includes('табулатур') || q.includes('хит-парад') || q.includes('diamond rio') || q.includes('mp3')) {
      results.push({
        title: "МузЗона '98 — Новости музыкальных групп, клипы MTV, Хит-парад и MP3 (25.11.1998)",
        url: 'http://www.muzzone98.ru',
        snippet: 'Главный музыкальный портал осени 1998 года: выход альбома Metallica «Garage Inc.», The Offspring «Americana», 2 месяца вещания MTV Россия, Сплин, Мумий Тролль, слухи о демо-кассете Земфиры, разбор видеоклипов по кадрам, аккорды под гитару и калькулятор MP3!'
      });
    }

    if (q.includes('mp3') || q.includes('музык') || q.includes('песн') || q.includes('music') || q.includes('audio') || q.includes('prodigy') || q.includes('скачать mp3') || q.includes('трек')) {
      results.push({
        title: "MP3 Vault '98 - Цифровой архив музыки в формате MP3",
        url: 'http://www.mp3vault98.com',
        snippet: 'Сотни культовых треков 1998 года: The Prodigy, The Offspring, Fatboy Slim, русский рок и саундтреки. Скачивание файлов прямо в папку «Моя музыка» и мгновенное воспроизведение в Winamp!'
      });
    }

    if (q.includes('avp') || q.includes('касперск') || q.includes('kaspersky') || q.includes('антивирус') || q.includes('вирус') || q.includes('virus') || q.includes('чернобыль') || q.includes('cih') || q.includes('happy99') || q.includes('melissa') || q.includes('onehalf') || q.includes('totally') || q.includes('хрюк') || q.includes('визг') || q.includes('avc') || q.includes('codeanalyzer') || q.includes('ками')) {
      results.push({
        title: 'Лаборатория Касперского (AVP 3.0) — Официальный сервер покупки и загрузки Setup_AVP.exe',
        url: 'http://www.avp.ru',
        snippet: 'Официальный сайт ЗАО «Лаборатория Касперского» (1998): покупка лицензии и скачивание Антивируса Касперского AVP 3.0 (Setup_AVP.exe), ежедневные базы DAILY.AVC, энциклопедия вирусов VirusList (Win95.CIH, TotallyNotAVirus, Happy99, OneHalf), эвристический стенд CodeAnalyzer и конференция RU.ANTIVIRUS!'
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

    if (q.includes('чат') || q.includes('кроватка') || q.includes('krovatka') || q.includes('chat') || q.includes('общение') || q.includes('знакомств') || q.includes('разговор') || q.includes('журфикс') || q.includes('полуночник') || q.includes('kitten98') || q.includes('admin_dimon')) {
      results.push({
        title: "Чат «Кроватка '98» - Главный ночной веб-чат Рунета (8 залов, 26 постояльцев)",
        url: 'http://chat.krovatka98.ru',
        snippet: 'Живой веб-чат ноября 1998 года: 8 комнат («Разговоры обо всём», «Компьютерщики», «Знакомства», «Полуночники», «МузСалон», «Игровой клуб», «Поэтический чердак», «Фидошная курилка»), анкеты 26 постояльцев, пятничный журфикс у Пушкина и кодекс Admin_Dimon!'
      });
    }

    if (
      q.includes('geocities') || q.includes('геоситис') || q.includes('страничк') ||
      q.includes('сайт') || q.includes('народ') || q.includes('хостинг') ||
      q.includes('html') || q.includes('усадьб') || q.includes('homestead') ||
      q.includes('борис') || q.includes('коаксиал') || q.includes('марьиванн') ||
      q.includes('фиалк') || q.includes('солекс') || q.includes('вован') ||
      q.includes('мишка') || q.includes('аня') || q.includes('усаги') ||
      q.includes('вяземск') || q.includes('букинист') || q.includes('106.8') ||
      q.includes('q2dm1') || q.includes('видеопрокат') || q.includes('поклонк')
    ) {
      results.push({
        title: "GeoCities '98 Homesteads — 10 кварталов и 18 персональных домашних страниц жителей",
        url: 'http://www.geocities.com',
        snippet: 'Бесплатные домашние страницы в 10 тематических кварталах (SiliconValley, Area51, SunsetStrip, Tokyo, Athens, Heartland, MotorCity, TimesSquare, Hollywood, Yosemite): бункер Neo98, серверная Сисадмина Бориса, точка Макса_CD-ROM на Горбушке, тетрадь Мишки из 9 «Б», архив Agent_Mulder, поинт Ани_Фидошницы, подвал GuitarHero98, кассеты DJ_Groove_Fan (106.8 FM), терминал Otaku_Shinji, храм Сейлор Мун Кати_Усаги, стихи Лены из МГУ, лавка букиниста Вяземского, фиалки Главбуха МарьИванны, гараж Вована_Авто, конфиг Серёги Quake-Мастера, видеопрокат Антона и споты Денчика_Roller!'
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

    if (q.includes('программ') || q.includes('софт') || q.includes('soft') || q.includes('видео') || q.includes('плеер') || q.includes('фотошоп') || q.includes('photoshop') || q.includes('командер') || q.includes('commander') || q.includes('wincmd') || q.includes('утилит') || q.includes('winzip') || q.includes('esheep') || q.includes('sheep') || q.includes('овечк') || q.includes('овц') || q.includes('бараш')) {
      results.push({
        title: 'SoftStore 98 - Каталог программного обеспечения для Win 98',
        url: 'http://www.softstore98.com',
        snippet: 'Купить и скачать программы для Win 98: бесплатная экранная овечка eSheep 98 (Sheep.exe), ActiveMovie Video Player 98, графический редактор RetroShop 98 Pro со слоями, двухпанельный менеджер файлов WinCommander 98, архиватор WinZip.'
      });
    }

    if (q.includes('esheep') || q.includes('sheep') || q.includes('овечк') || q.includes('овц') || q.includes('бараш') || q.includes('stray') || q.includes('питомец')) {
      results.push({
        title: 'eSheep 98 (Sheep.exe / Stray Sheep Poe) - Скачать бесплатно',
        url: 'http://www.softstore98.com/product?id=esheep',
        snippet: 'Знаменитая экранная овечка По (Stray Sheep) для Win 98! Падает с неба на панель задач и окна, спит, жуёт ромашки, падает метеором в ванну и улетает на НЛО. Бесплатная загрузка Setup_eSheep.exe на SoftStore 98!'
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
        snippet: 'Пошаговая ролевая игра о Звёздном экспрессе и ледяной планете Ярило-VI. Полная версия 1.7 бесплатно: установщик 3,1 МБ, зеркала в Москве, Франкфурте и Шанхае. Персонажи, новости, галерея.'
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

    if (q.includes('новост') || q.includes('news') || q.includes('событи') || q.includes('газет') || q.includes('пресс') || q.includes('стать') || q.includes('cyberspace') || q.includes('times') || q.includes('лаптев') || q.includes('репортаж') || q.includes('comdex') || q.includes('diamond rio') || q.includes('riaa') || q.includes('байконур') || q.includes('заря')) {
      results.push({
        title: 'Cyberspace Times 1998 - Новости Сети и Высоких Технологий',
        url: 'http://www.retro-news98.com',
        snippet: 'Ежедневная газета Сети (выпуск № 48, 20 статей на первой полосе): релиз Win 98 SE, разгон Celeron 300A, 3dfx на COMDEX, выход Half-Life, доставка игр в Steam, суд RIAA против плеера Diamond Rio MP3, вирус CIH, старт модуля МКС «Заря» и жизнь Рунета после дефолта.'
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

    if (q.includes('quest') || q.includes('квест') || q.includes('scumm') || q.includes('guybrush') || q.includes('приключ') || q.includes('lucas') || q.includes('лукас') || q.includes('sam') || q.includes('max') || q.includes('сэм') || q.includes('макс') || q.includes('adventurer') || q.includes('moai')) {
      results.push({
        title: 'LucasArts Entertainment Company (1998) — The Adventurer, Sam & Max и SCUMM',
        url: 'http://www.lucasarts.com',
        snippet: 'Официальный узел студии LucasArts: все 8 эпизодов Sam & Max, LucasQuest 98, линия подсказок 1-900-740-JEDI и SCUMM-лаборатория.'
      });
      results.push({
        title: 'LucasQuest 98 Demo - Графический квест на движке SCUMM',
        url: 'http://www.igromania.ru',
        snippet: 'Пиратские приключения Гайбраша Байтвуда в замке Редмонд! Классический юмор и головоломки. Бесплатная демоверсия на компакт-диске журнала «Игромания».'
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
        snippet: 'Покупка и загрузка игр через клиент Steam: DOOM 98, Diablo, Dota 98, Quake III Arena и ещё полтора десятка игр.'
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
      esheep: {
        title: 'eSheep 98 (Sheep.exe / Stray Sheep Poe)',
        developer: 'Fuji Television / Tatsutoshi Nomura',
        genre: 'Экранный питомец рабочего стола (Freeware)',
        specs: { cpu: '486DX2 66 MHz', ram: '8 MB RAM', disk: '340 KB', vga: 'SVGA 256 цветов', audio: 'Sound Blaster (необязательно)' },
        rating: '5/5 ★★★★★',
        review: '«Очаровательная овечка По падает с неба прямо на панель задач и заголовки окон, спит, жуёт ромашки, чихает, карабкается по краям монитора, встречает чёрную овечку, падает горящим метеором в ванну и улетает на тарелке пришельцев!» — Домашний ПК'
      }
    };
    return details[id] || null;
  }

  get softStoreApps() {
    return [
      { id: 'esheep', title: 'eSheep 98 (Sheep.exe)', vendor: 'Fuji Television / Tatsutoshi Nomura', category: 'Рабочий стол', price: 'Бесплатно', free: true, icon: 'esheep', badge: 'бесплатно', desc: 'Легендарный экранный питомец — овечка По (Stray Sheep)! Бегает по панели задач и заголовкам окон, спит, жуёт цветы, падает метеором в ванну, встречает чёрную овечку и НЛО.' },
      { id: 'videoplayer', title: 'ActiveMovie Video Player 98', vendor: 'Microslop Multimedia Systems', category: 'Мультимедиа', price: '$19.99', icon: 'video-player', badge: 'хит продаж', desc: 'Видеоплеер для Win 98: AVI, MPEG-1 и Cinepak, полноэкранный режим, покадровая перемотка и таймкод.' },
      { id: 'photoshop', title: 'RetroShop 98 Photo Editor', vendor: 'Adobe Systems Inc.', category: 'Графика', price: '$39.99', icon: 'photoshop', badge: 'выбор редакции', desc: 'Слои с прозрачностью, размытие по Гауссу, тиснение, яркость и контраст, градиенты, штамп и история действий.' },
      { id: 'wincommander', title: 'WinCommander 98', vendor: 'C. Ghisler & Co.', category: 'Утилиты', price: '$24.99', icon: 'wincommander', badge: '', desc: 'Двухпанельный файловый менеджер: F3 просмотр, F5 копирование, F6 перенос, F7 папка, F8 удаление.' },
      { id: 'winamp', title: 'WinAmp 98 Pro', vendor: 'Nullsoft, Inc.', category: 'Мультимедиа', price: '$14.99', icon: 'winamp', badge: 'хит', desc: 'MP3, WAV и MIDI. 10-полосный эквалайзер, анализатор спектра и плейлист. It really whips the llama\'s ass!' },
      { id: 'winzip', title: 'WinZip 7.0', vendor: 'Nico Mak Computing', category: 'Утилиты', price: '$14.99', icon: 'folder', badge: '', desc: 'Сжимает файлы и папки в ZIP. Экономит место на диске и время на модеме.' }
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
      if (a.free) {
        return `<span class="store98-card-price">${a.price}</span><br><button class="win-btn store98-btn-download" data-soft-download="${a.id}">Скачать .EXE</button>`;
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
              <div>${this.gif('ball-red')} <a data-url="http://www.avp.ru/store">Антивирус AVP 3.0 &mdash; на AVP.ru</a></div>
              <div class="store98-side-title">Оплата</div>
              <div class="store98-side-note">Visa, MasterCard.<br>Промокод <b>WIN98SE</b> &mdash; скидка $5!</div>
            </td>
            <td class="store98-main">${body}</td>
          </tr>
        </table>
        <div class="store98-footer">SoftStore '98 &middot; Все цены в долларах США &middot; Установщики сохраняются в &laquo;Мои документы\\Downloads&raquo; &middot; Отдел продаж: ${this.mailLink('orders@softstore98.com')}</div>
      </div>`;

    if (pageId === 'avp') {
      return shell('<a data-url="http://www.softstore98.com">Каталог</a> &raquo; <b>Антивирус Касперского AVP 3.0 переехал!</b>', `
        <div style="background:#fffdf0;border:2px solid #8b0000;padding:10px;margin:6px 0;">
          <h3 class="store98-h" style="color:#8b0000;margin-top:0;">Внимание: Покупка и загрузка Антивируса Касперского AVP 3.0 перенесены!</h3>
          <p>По решению ЗАО <b>«Лаборатория Касперского»</b> распространение лицензионных ключей, продажа и скачивание установочного пакета <b>Setup_AVP.exe (Антивирус Касперского AVP 3.0)</b> теперь осуществляются напрямую на официальном сервере компании в рубрике «Железо и безопасность»:</p>
          <p><a data-url="http://www.avp.ru/store" style="font-weight:bold;font-size:13px;color:#8b0000;">Перейти на официальный сайт Лаборатории Касперского (http://www.avp.ru/store) &raquo;</a></p>
        </div>
      `);
    }

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
        else if (id === 'esheep' && window.appESheep) window.appESheep.open();
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

  getNewsCategories() {
    return [
      { id: 'all', label: 'Все полосы номера', leadId: 1 },
      { id: 'os', label: 'Компьютеры и ОС', leadId: 1 },
      { id: 'net', label: 'Интернет и Рунет', leadId: 2 },
      { id: 'hw', label: 'Железо и COMDEX', leadId: 9 },
      { id: 'games', label: 'Игры и Steam', leadId: 5 },
      { id: 'music', label: 'Музыка и MP3', leadId: 6 },
      { id: 'sec', label: 'Безопасность и Y2K', leadId: 10 },
      { id: 'sci', label: 'Репортажи и Наука', leadId: 4 },
      { id: 'col', label: 'Авторские колонки', leadId: 15 }
    ];
  }

  getNewsThemeAxes() {
    return [
      {
        id: 'autonomy',
        code: 'ОСЬ I · ПРЯМОЙ ПРОВОД',
        title: 'Свободный байт против старых посредников',
        premise: 'Прямой модемный канал и открытые форматы дают частному пользователю независимость, потому что программа или песня доходят от автора к читателю без витринной наценки.',
        counterPremise: 'Крупные правообладатели и телефонные монополии пытаются удержать старый порядок через судебные запреты и повременную тарификацию.',
        motif: 'Счётчик докачки 64-килобайтных блоков в Steam в четыре утра и серебристый корпус плеера Diamond Rio на 32 МБ без единой шестерёнки.',
        articleIds: [2, 6, 12, 19]
      },
      {
        id: 'hardware',
        code: 'ОСЬ II · КРЕМНИЙ И ПАЯЛЬНИК',
        title: 'Инженерная смекалка против заводского ценника',
        premise: 'Грамотный расчёт шин, перемычек и конвейеров позволяет собрать дома станцию уровня дорогой лаборатории за половину стоимости из прайс-листа.',
        counterPremise: 'Разгон на грани допуска и открытая запись во флеш-память делают машину беззащитной перед перегревом, наводками и одной разрушительной строкой кода в Ring 0.',
        motif: 'Капля цапонлака на контакте B21 процессора Celeron 300A, шлейф Voodoo2 SLI и перемычка JP1 в положении 2-3 накануне 26-го числа.',
        articleIds: [3, 9, 10, 16]
      },
      {
        id: 'runet',
        code: 'ОСЬ III · СЕТЬ ПОСЛЕ ОБВАЛА',
        title: 'Живое слово и взаимовыручка на фоне двадцатирублёвого доллара',
        premise: 'Августовский кризис не остановил русскоязычную Сеть: наоборот, дефицит дешёвой бумаги и импортных коробок превратил модемные узлы, текстовые библиотеки и чаты в главную площадь страны.',
        counterPremise: 'Разрыв между столичными цифровыми АТС и провинциальными декадно-шаговыми линиями грозит разделить читателей на тех, кто качает мегабайты, и тех, кто считает каждую минуту.',
        motif: 'Табличка обменника «Покупка 19.90 / Продажа 21.40», синий экран GoldED на узле 2:5020 и свежий файл .TXT, открытый в Блокноте.',
        articleIds: [8, 14, 15, 17, 20]
      },
      {
        id: 'threshold',
        code: 'ОСЬ IV · РУБЕЖ ТЫСЯЧЕЛЕТИЯ',
        title: 'Хрупкость старого фундамента перед лицом 2000 года',
        premise: 'Переход в новое столетие требует честной ревизии всего накопленного наследства — от двухзначного счётчика года в CMOS до монопольных привычек софтверных гигантов.',
        counterPremise: 'Соблазн закрыть проблему косметической заплаткой оставляет внутри критических систем скрытые мины, которые сработают в полночь 1 января.',
        motif: 'Зелёные цифры «1999 -> 1900» в окне Award BIOS, первый орбитальный виток модуля «Заря» и треск дозиметра у тридцатикилометрового периметра.',
        articleIds: [1, 4, 5, 7, 11, 13, 18]
      }
    ];
  }

  getNewsWorldData() {
    return {
      issueNo: '№ 48 (214)',
      issueDate: 'Среда, 25 ноября 1998 г.',
      deadline: 'Сдано в модемный пул ММТС-9 в 06:30 МСК',
      editorNote: {
        author: 'Ольга Лаптева, выпускающий редактор',
        title: 'Ноябрь, в котором всё решают две цифры и один провод',
        text: 'Мы сдаём этот номер в среду утром, за сутки до 26 ноября — дня, когда осенняя модификация вируса Win95.CIH снова проверит, кто из нас не поленился снять крышку корпуса и переставить перемычку защиты BIOS. В этом весь конец девяносто восьмого: высокие материи большой индустрии — от антимонопольных допросов в Вашингтоне и слияния 3dfx с заводами STB до запуска первого модуля МКС на Байконуре — сходятся на обычном письменном столе рядом с гудящим модемом USRobotics. В сегодняшнем номере двадцать больших материалов: читайте, сохраняйте в Блокнот для чтения без повремёнки и пишите нам в редакцию.'
      },
      marketIndex: [
        ['Курс ЦБ РФ / ММВБ', '20,80 / 17,88 р.', '1 у.е. на рынках = 21,40 р.'],
        ['Intel Celeron 300A (Mendocino)', '$148 (3 167 р.)', 'Партии SL32A / SL2WM, Slot 1'],
        ['3dfx Voodoo2 12MB PCI', '$185 (3 959 р.)', 'Diamond Monster 3D II, кабель SLI'],
        ['Память 64 MB SDRAM PC100', '$84 (1 798 р.)', 'Чипы Hyundai / SEC 8 нс'],
        ['USRobotics Sportster 56K V.90', '$132 (2 825 р.)', 'Внешний, прошивка ITU V.90'],
        ['Ночной пул (02:00–08:00 МСК)', '$0.35 / час', 'МТУ-Интел, Ситилайн, Релком']
      ],
      bureaus: [
        ['Москва, Мясницкая, 24', 'Центральная редакция, стенд проверки материнских плат и узел связи'],
        ['Редмонд / Киркланд (США)', 'Корпункт по северо-западу США: кампус Microslop и штаб-квартира Valve'],
        ['Лас-Вегас / Сан-Хосе', 'Павильоны COMDEX Fall \'98 и федеральный окружной суд Калифорнии'],
        ['Киев / 30-км периметр', 'Собкор по Украине: лаборатория GSC Game World и сводки экспедиций'],
        ['Узел FidoNet 2:5020/98', 'Ночной шлюз писем читателей и технических эхоконференций']
      ],
      letters: [
        {
          from: 'Инженер АСУ Павел К., Екатеринбург',
          text: 'По вашей методике проверили вчера в цеху двенадцать машин 1995 года выпуска. Четыре платы на старом Award BIOS после 23:59 31.12.1999 молча прыгнули в 1904 год. Статья Сергея Громова сэкономила нам январскую смену.'
        },
        {
          from: 'Влад (Новосибирск, АТС-46)',
          text: 'Качал DOOM 98 через Steam три ночи подряд с двух до шести утра. На третью ночь уборщица на станции дёрнула кросс, связь упала на 87%, но клиент подхватил ровно с того же блока 64 КБ. Коробки в киосках больше не покупаю.'
        },
        {
          from: 'Отдел корректуры Cyberspace Times',
          text: 'Приносим извинения читателям за опечатку в прошлом выпуске («ширина шины 100 мегабайт» вместо «100 мегагерц»). Наш единственный корректор в воскресенье ездил в Раменское на последний тур чемпионата и сдавал полосу с температурой.'
        }
      ]
    };
  }

  getNewsArticles() {
    return [
      {
        id: 1,
        cat: 'os',
        catLabel: 'Компьютеры и ОС',
        pageNum: 'Полоса 1 · Передовица',
        title: 'Win 98 Second Edition: работа над ошибками Редмонда, стек USB и общий модем на две машины',
        subtitle: 'Корпорация Microslop готовит второе издание операционной системы с браузером Internet Explorer 5.0, интерфейсом DirectX 6.1 и встроенной раздачей телефонного соединения.',
        date: '24 ноября 1998',
        dateline: 'РЕДМОНД — МОСКВА',
        author: 'Алексей Корнев, обозреватель ОС',
        keyFact: 'Сборка 4.10.2222A закрывает свыше 300 ошибок первого июньского релиза и включает общий доступ к модему ICS.',
        themeNote: 'Удобство готовой системы «всё в одной коробке» против зависимости пользователя от монопольного стека Редмонда.',
        motif: 'Коаксиальный Т-коннектор на две домашние карточки NE2000 и один гудящий модем на табуретке в прихожей.',
        file: 'CT98_01_WIN98SE.TXT',
        snippet: 'Корпорация Microslop представила обновлённую операционную систему Win 98 Second Edition. Переписанный драйвер шины USB, служба общего модемного доступа Internet Connection Sharing, DirectX 6.1 и новый браузер Internet Explorer 5.0 устраняют главные болезни летнего выпуска.',
        body: `
          <p>Спустя пять месяцев после шумной июньской премьеры первой редакции Win 98 инженеры Microslop в Редмонде признали то, о чём системные администраторы писали в конференциях с середины лета: системе требовался не просто очередной пакет заплаток, а полноценная пересборка ядра и драйверов. Второе издание — Win 98 Second Edition (внутренний номер сборки 4.10.2222A) — задумывалось как работа над аппаратными сбоями, которые преследовали владельцев новых плат на чипсете Intel 440BX и первых периферийных устройств с разъёмом USB.</p>
          <h4>Конец капризам шины USB и утечкам таймера</h4>
          <p>Главный технический узел обновления — полностью переработанный стек универсальной последовательной шины (<tt>uhcd.sys</tt> и <tt>usbhub.sys</tt>). В первой редакции Win 98 оптические мыши и сканеры на платах с южным мостом PIIX4E нередко теряли питание после выхода монитора из спящего режима, заставляя пользователя лезть под стол и перетыкать кабель. Во втором издании опрос портов переведён на новую схему прерываний, а заодно исправлена пресловутая ошибка переполнения системного счётчика миллисекунд в <tt>vtdapi.vxd</tt>.</p>
          <blockquote class="news98-quote">«Мы убрали узкие места там, где домашний компьютер встречается с телефонной линией и локальной сетью. Теперь две машины в квартире или малом офисе могут выходить в Паутину через один модем без покупки отдельного прокси-сервера», — заявил ведущий архитектор сетевого стека на брифинге в Редмонде.</blockquote>
          <h4>Один модем на две комнаты и DirectX 6.1</h4>
          <p>Для российских пользователей самой практичной новинкой стала служба Internet Connection Sharing (ICS). Если раньше для раздачи одного ночного соединения на 33,6 или 56 Кбит/с по коаксиальному кабелю требовалось настраивать сторонний WinGate, то теперь система сама поднимает локальный шлюз с адресом <tt>192.168.0.1</tt> и раздаёт пакеты второй машине. Игровой отдел Редмонда добавил в поставку пакет DirectX 6.1 с ускоренной обработкой геометрии для процессоров с инструкциями MMX и 3DNow!, а также финальную сборку браузера Internet Explorer 5.0, ускорившую отрисовку сложных табличных страниц почти на треть.</p>
          <p>Проверить совместимость своей машины и загрузить системные обновления можно в справочном центре <a data-url="http://www.microslop.com">Microslop Win 98 Portal</a>, а обсудить поведение новых драйверов — на всероссийском форуме <a data-url="http://forum.games98.com">GamerZone</a>.</p>
        `
      },
      {
        id: 2,
        cat: 'net',
        catLabel: 'Интернет и Рунет',
        pageNum: 'Полоса 2 · Сетевая экономика',
        title: 'Прорыв в онлайн-торговле: как клиент Steam от Valve меняет поход за коробками на ночную докачку',
        subtitle: 'Инженеры из Киркланда запустили систему прямой цифровой доставки игр: архив режется на контрольные пакеты по 64 КБ и выдерживает любой обрыв телефонной линии.',
        date: '23 ноября 1998',
        dateline: 'КИРКЛАНД — МЯСНИЦКАЯ',
        author: 'Мария Соколова, отдел сетевой экономики',
        keyFact: 'Установщик SteamInstall.exe весит 1,3 МБ и умеет докачивать дистрибутивы с точного места разрыва связи на АТС.',
        themeNote: 'Прямая доставка игры от разработчика к игроку против цепочки оптовых складов, таможни и рыночных лотков.',
        motif: 'Зелёная полоса прогресса в окне Steam под тихое потрескивание ночной телефонной линии.',
        file: 'CT98_02_VALVE_STEAM.TXT',
        snippet: 'Теперь геймерам больше не обязательно стоять в очередях за компакт-дисками в киосках. Клиент Steam от компании Valve позволяет оплатить лицензию банковской картой, загрузить игру прямо по модему с контролем целостности пакетов и запустить её с Рабочего стола.',
        body: `
          <p>Ещё год назад мысль о том, чтобы покупать и забирать полные версии компьютерных игр по обычному телефонному проводу, вызывала у большинства издателей лишь скептическую улыбку. Любой, кто пытался вытянуть по FTP архив хотя бы на двадцать мегабайт через загруженный вечерний пул, знает классическую драму: на девяносто шестом проценте на районной АТС щёлкает искатель, линия рвётся, и битый файл приходится тянуть с нуля. Открытый компанией Valve сервис цифровой дистрибуции <a data-url="http://www.steampowered.com">Steam</a> решает эту задачу инженерным путём.</p>
          <h4>Пакеты по 64 килобайта против капризов телефонной пары</h4>
          <p>Скачав с официального узла <a data-url="http://www.steampowered.com">http://www.steampowered.com</a> компактный установщик <tt>SteamInstall.exe</tt> объёмом 1,3 МБ, пользователь получает на Рабочем столе прямое окно в каталог контент-серверов Valve. Секрет живучести клиента кроется в протоколе поблочной передачи: каждый игровой архив разбит на фрагменты по 64 килобайта с собственной контрольной суммой CRC32. Если модем теряет несущую частоту или провайдер принудительно разрывает сессию по таймеру, при следующем дозвоне Steam сверяет таблицу уже принятых блоков и продолжает загрузку с последнего целого килобайта.</p>
          <blockquote class="news98-quote">«Мы хотели убрать стену между студией, которая дописала финальную сборку в три часа ночи, и игроком на другом конце материка. Никаких двух месяцев ожидания печати тиража и никакой наценки за картонную коробку», — объясняют разработчики на инженерном узле <a data-url="http://www.valvesoftware.com">Valve Software</a>.</blockquote>
          <h4>От Wolfenstein 3D и DOOM 98 до ночного тарифа</h4>
          <p>В каталоге Steam уже соседствуют классические боевики <b>Wolfenstein 3D</b> и <b>DOOM 98</b>, ролевые экспедиции от <a data-url="http://www.blizzard.com">Blizzard</a>, а также киевский <b>S.T.A.L.K.E.R.</b> и «Зов Припяти 98». Оплата проходит напрямую по картам Visa и MasterCard через защищённый шлюз, после чего игра сама распаковывается в каталог <tt>C:\\Games</tt> и прописывает ярлык в меню «Пуск». В российских реалиях осени 1998 года владельцы модемов ставят закачку в очередь ровно в 02:00, когда у провайдеров включается льготный ночной тариф по 35 центов в час.</p>
        `
      },
      {
        id: 3,
        cat: 'hw',
        catLabel: 'Железо и COMDEX',
        pageNum: 'Полоса 3 · Графические ускорители',
        title: 'Революция 3D-графики: Voodoo2 SLI против RIVA TNT и ва-банк компании 3dfx на выставке COMDEX Fall \'98',
        subtitle: 'В Лас-Вегасе калифорнийский лидер трёхмерных ускорителей объявил о покупке заводов STB Systems за $141 млн и показал кремний Voodoo3.',
        date: '22 ноября 1998',
        dateline: 'ЛАС-ВЕГАС — МОСКВА',
        author: 'Дмитрий Руднев («Железный ряд»)',
        keyFact: 'Две платы Voodoo2 по 12 МБ в связке SLI выдают 1024×768 при 60 кадрах/с, чередуя чётные и нечётные строки растра.',
        themeNote: 'Узкоспециализированное совершенство закрытого API Glide против универсальной 32-битной архитектуры нового поколения.',
        motif: 'Короткий плоский шлейф SLI между двумя горячими платами PCI и толстый внешний переходник VGA на задней стенке корпуса.',
        file: 'CT98_03_3DFX_VOODOO2.TXT',
        snippet: 'Появление ускорителей 3dfx Voodoo2 и осенняя выставка COMDEX Fall \'98 изменили расстановку сил на рынке видеокарт. Пока две платы Voodoo2 в режиме SLI удерживают рекорд скорости в разрешении 1024x768, 3dfx выкупает заводы STB Systems, чтобы выпускать Voodoo3 самостоятельно.',
        body: `
          <p>Завершившаяся 20 ноября в Лас-Вегасе компьютерная ярмарка COMDEX Fall '98 прошла под знаком большой графической войны. На протяжении всего 1998 года чипсет <b>3dfx Voodoo2</b> оставался непререкаемым эталоном для любого серьёзного игрока: три специализированных чипа на текстолите (один растровый процессор FBI и два текстурных блока TMU) позволяли за один такт накладывать базовую текстуру и карту освещения в Quake II и Unreal, не просаживая частоту кадров.</p>
          <h4>Магия чётных и нечётных строк: как работает SLI</h4>
          <p>Настоящим инженерным фетишем года стал режим Scan-Line Interleaving (SLI). Соединив две 12-мегабайтные платы PCI (например, Diamond Monster 3D II) внутренним ленточным шлейфом, владелец компьютера получает удвоенную скорость заполнения сцены: первая карта обсчитывает нечётные горизонтальные линии кадра, вторая — чётные. В результате планка разрешения поднимается с 800×600 до недосягаемых прежде 1024×768 при стабильных 60 кадрах в секунду. Единственная плата за эту мощь — внешний проходной кабель VGA (pass-through), который на дешёвых комплектах слегка мылит мелкий шрифт в Win 98, если проложить его вплотную к блоку питания.</p>
          <blockquote class="news98-quote">«Покупка заводов STB Systems в мексиканском Хуаресе за 141 миллион долларов означает одно: начиная с линейки Voodoo3 2000 и 3000, мы перестаём продавать чипы сторонним сборщикам и берём качество пайки в собственные руки», — объявил глава 3dfx Грег Баллард со сцены в Лас-Вегасе.</blockquote>
          <h4>Ответ NVIDIA и стендовые замеры в Москве</h4>
          <p>Впрочем, решение 3dfx поссориться со своими вчерашними партнёрами — Diamond Multimedia и Creative Labs — играет на руку молодому конкуренту из Санта-Клары. Чип <b>NVIDIA RIVA TNT</b> на шине AGP 2x хоть и уступает паре Voodoo2 в родном для них интерфейсе Glide, но уже умеет работать с 32-битным цветом TrueColor и объединяет 2D и 3D на одной плате. Проверить свою видеокарту на интерактивном стенде и сравнить таблицы кадров можно в лабораториях <a data-url="http://www.3dfx-zone.com">3dfx Voodoo Zone</a> и <a data-url="http://www.ferrum98.ru">«Железный Цех '98»</a>.</p>
        `
      },
      {
        id: 4,
        cat: 'sci',
        catLabel: 'Репортажи и Наука',
        pageNum: 'Полоса 4 · Полевой репортаж',
        title: 'Загадочные отчёты из Чернобыля: экспедиция у тридцатого километра и проект S.T.A.L.K.E.R. киевской студии GSC',
        subtitle: 'Полевые геофизики спорят о природе локальных гравитационных возмущений в районе Рыжего леса, а программисты в Киеве переносят топографию Зоны в трёхмерный движок.',
        date: '21 ноября 1998',
        dateline: 'КИЕВ — ИВАНКОВ — МОСКВА',
        author: 'Илья Воронов, специальный корреспондент',
        keyFact: 'Полевые протоколы осенней смены фиксируют кратковременные отклонения гравиметра до 0,8 мГал и голубое свечение изоляторов на старых подстанциях.',
        themeNote: 'Попытка измерить неизвестное приборами против притяжения закрытой территории, живущей по собственным законам.',
        motif: 'Треск армейского радиометра ДП-5В в сыром ноябрьском тумане и карандашная сетка высот на экране монитора в киевской лаборатории.',
        file: 'CT98_04_CHERNOBYL_GSC.TXT',
        snippet: 'Научная экспедиция в окрестностях Чернобыльской АЭС зафиксировала необъяснимые физические феномены, локальные гравитационные скачки и минеральные образования. По следам полевых тетрадей киевская студия GSC Game World создала проект S.T.A.L.K.E.R.',
        body: `
          <p>В конце октября в распоряжении киевского корпункта <i>Cyberspace Times</i> оказалась копия технического журнала осенней гидрогеологической партии, работавшей вдоль внешней границы тридцатикилометровой зоны отчуждения к западу от Припяти. За сухими таблицами замеров грунта в журнале следуют три страницы, исписанные от руки начальником смены: на участке старой лесной просеки у бывшей подстанции стрелки полевых гравиметров дважды за ночь уходили за пределы шкалы, а в воздухе над воронками в песчанике наблюдалось дрожание, похожее на марево над раскалённым асфальтом при температуре воздуха плюс два градуса.</p>
          <h4>Оплавленный кварц и молчание радиоэфира</h4>
          <p>Участники выезда, с которыми нашему корреспонденту удалось поговорить в Иванкове, избегают громких слов, но подтверждают аппаратную часть отчёта: никель-кадмиевые аккумуляторы радиостанций вблизи просеки теряли заряд за двадцать минут, а на дне неглубоких провалов геологи обнаружили спёкшиеся слоистые конкреции кварца и глины, не характерные для обычного техногенного шлака. В неофициальных разговорах сотрудники охраны периметра называют такие находки «артефактами», хотя в сводках института они проходят как образцы нестандартного остеклования почвы.</p>
          <blockquote class="news98-quote">«Зона не терпит суеты и прямой линии. Там, где вчера проходил лесовоз, сегодня висит холодная линза, от которой компас крутится волчком. Мы просто перенесли эти маршруты и дневники в код», — рассказывают разработчики на официальном узле <a data-url="http://www.gsc-game.com">GSC Game World</a>.</blockquote>
          <h4>Из полевой тетради — в движок X-Ray 98</h4>
          <p>Буквально в ста километрах к югу, в киевской мастерской студии GSC Game World, эти наблюдения уже превратились в цифровую архитектуру. Команда выпустила в каталоге <a data-url="http://www.steampowered.com">Steam</a> тактическую выживалку <b>S.T.A.L.K.E.R.: Чернобыль 1998</b> и сюжетную главу <b>«Зов Припяти 98»</b>, а трёхмерную рейд-экспедицию на движке <b>X-Ray 98</b> показала демоверсией на компакт-диске журнала <a data-url="http://www.igromania.ru">«Игромания»</a>. Ознакомиться со справочником аномалий, картами секторов и инженерными дневниками можно напрямую на сайте студии <a data-url="http://www.gsc-game.com">http://www.gsc-game.com</a>.</p>
        `
      },
      {
        id: 5,
        cat: 'games',
        catLabel: 'Игры и Steam',
        pageNum: 'Полоса 5 · Главная премьера осени',
        title: 'Состоялся релиз Half-Life: почему поездка в вагонетке «Чёрной Мезы» отменила монтажные склейки в боевиках',
        subtitle: 'Гейб Ньюэлл, Майк Харрингтон и сценарист Марк Лэйдлоу доказали, что шутер от первого лица способен держать напряжение без единого пререндеренного видеоролика.',
        date: '20 ноября 1998',
        dateline: 'КИРКЛАНД — СИЭТЛ',
        author: 'Дмитрий Руднев («Железный ряд»)',
        keyFact: 'После переделки проекта осенью 1997 года движок GoldSrc получил скелетную анимацию и 70% нового кода поверх ядра Quake.',
        themeNote: 'Непрерывный взгляд от первого лица и свобода движения игрока против навязанной режиссёром кинокамеры.',
        motif: 'Оранжевый защитный костюм HEV, красный лом-гвоздодёр и пятиминутная тишина утреннего монорельса перед каскадным резонансом.',
        file: 'CT98_05_HALFLIFE_RELEASE.TXT',
        snippet: 'Студия Valve и издатель Sierra Studios совершили переворот в жанре: вышедшая 19 ноября Half-Life доказала, что трёхмерный боевик может рассказывать связную научно-фантастическую драму прямо на глазах игрока без отключения управления.',
        body: `
          <p>Первые пять минут <b>Half-Life</b> не дают выстрелить ни разу — и именно этим обезоруживают любого, кто привык к канонам Doom и Quake. Двадцатисемилетний физик-теоретик Гордон Фримен едет в утреннем вагончике монорельса сквозь подземные уровневые шлюзы научно-исследовательского комплекса «Чёрная Меза» в штате Нью-Мексико. За окном вагона шагают погрузочные роботы, учёные в белых халатах спорят у кофейных автоматов, а спокойный женский голос автоматического диктора напоминает о правилах обращения с материалами третьей степени риска. Игрок в этот момент не смотрит ролик с компакт-диска — он свободно ходит по вагону и сам выбирает, куда повернуть голову.</p>
          <h4>Год, когда Valve выбросила черновик в корзину</h4>
          <p>Мало кто за пределами Киркланда знает, какой ценой далась эта цельность. Осенью 1997 года, за два месяца до первоначально обещанного релиза, основатели студии Гейб Ньюэлл и Майк Харрингтон, вложившие в компанию собственные средства после ухода из Microslop, приняли рискованное решение: забраковать почти готовый, но рыхлый набор уровней и переписать игру с чистого листа. Внутри студии сформировали проектную группу «Кабал» с участием писателя-фантаста Марка Лэйдлоу, которая расписала каждый коридор Сектора C как единую драматическую сцену.</p>
          <blockquote class="news98-quote">«Как только вы отбираете у человека мышь и клавиатуру ради красивой заставки, он перестаёт быть участником катастрофы и превращается в зрителя в кинозале. Мы решили, что в Чёрной Мезе камера никогда не покинет глаз Гордона Фримена», — подчёркивают инженеры в дневниках <a data-url="http://www.valvesoftware.com">Valve Software</a>.</blockquote>
          <h4>Тактика спецназа HECU и скелетная мимика</h4>
          <p>Переработанный движок GoldSrc научил персонажей поворачивать голову вслед за игроком и артикулировать речь в такт звуковой дорожке. Но главный сюрприз ждёт этажом выше после аварии в тестовой камере: прибывшие для «зачистки» пехотинцы корпуса HECU не бегут напролом под пули, а переговариваются по рации, занимают укрытия за стальными ящиками, выкуривают Фримена осколочными гранатами и отступают для перезарядки. Демоверсия <b>Half-Life 98 Demo</b> уже лежит на компакт-диске журнала <a data-url="http://www.igromania.ru">«Игромания»</a>, а тактику прохождения шлюзов обсуждают в прикреплённых ветках форума <a data-url="http://forum.games98.com">GamerZone</a>.</p>
        `
      },
      {
        id: 6,
        cat: 'music',
        catLabel: 'Музыка и MP3',
        pageNum: 'Полоса 6 · Судебный прецедент',
        title: 'Битва за MP3: федеральный суд отклонил иск ассоциации RIAA против карманного плеера Diamond Rio PMP300',
        subtitle: 'Судья Одри Коллинз подтвердила право владельцев ПК переносить сжатые музыкальные файлы на 32-мегабайтную флеш-память без выплаты кассетного сбора.',
        date: '18 ноября 1998',
        dateline: 'САН-ХОСЕ — МОСКВА',
        author: 'Игорь Белов, музыкальный и правовой отдел',
        keyFact: 'Плеер Diamond Rio весит 70 граммов, стоит $199,95 и хранит на 32 МБ флеш-памяти до 9 композиций в потоке 128 Кбит/с.',
        themeNote: 'Право слушателя распоряжаться собственной фонотекой на жёстком диске против монополии пяти звукозаписывающих концернов на физический носитель.',
        motif: 'Зелёный бегунок спектра в окне Winamp 2.x и кабель параллельного порта LPT, по которому треки уходят в карманный плеер.',
        file: 'CT98_06_RIAA_DIAMOND_RIO.TXT',
        snippet: 'Музыкальная индустрия потерпела первое крупное поражение в войне с цифровым звуком: федеральный суд отказался запрещать продажи портативного плеера Diamond Rio PMP300 с флеш-памятью 32 МБ, открыв дорогу формату MP3.',
        body: `
          <p>Попытка Американской ассоциации звукозаписывающих компаний (RIAA) остановить наступление формата MPEG-1 Layer 3 через судебных приставов завершилась в Калифорнии громким провалом. В октябре юристы ассоциации потребовали наложить судебный запрет на отгрузку карманного плеера <b>Diamond Rio PMP300</b>, утверждая, что устройство нарушает закон о домашней аудиозаписи 1992 года (AHRA), поскольку не содержит системы защиты от серийного копирования и не отчисляет процент с каждой проданной штуки в фонд лейблов.</p>
          <h4>Почему жёсткий диск компьютера не считается магнитофоном</h4>
          <p>Рассмотрев технические схемы, федеральный судья Одри Коллинз встала на сторону инженеров Diamond Multimedia. Ключевой аргумент защиты оказался прост и безупречен с точки зрения буквы закона: персональный компьютер под управлением Win 98, с которого плеер получает файлы через параллельный порт LPT, является многоцелевой вычислительной машиной, а не «цифровым аудиомагнитофоном», и сам Rio PMP300 не имеет цифрового входа для перезаписи на другое устройство. Попытка RIAA обложить налогом флеш-память провалилась, а скандал в прессе обеспечил прибору за $199,95 бесплатную рекламу на всех континентах.</p>
          <blockquote class="news98-quote">«Устройство без единой вращающейся детали, которое не зажёвывает плёнку и не сбивается при беге по ступенькам, невозможно отменить судебной бумагой», — прокомментировали решение суда в аналитической сводке <a data-url="http://www.muzzone98.ru">«МузЗоны '98»</a>.</blockquote>
          <h4>Эпоха Winamp и ночных MP3-архивов</h4>
          <p>Пока в Сан-Хосе спорили адвокаты, стандарт сжатия Института Фраунгофера окончательно завоевал студенческие общежития и домашние компьютеры. Трёхминутная песня при потоке 128 Кбит/с и частоте дискретизации 44,1 кГц занимает около трёх мегабайт — это ровно двенадцать минут ночной загрузки по модему 33,6K. Скачать свежие треки The Prodigy, Fatboy Slim и The Offspring можно в цифровом хранилище <a data-url="http://www.mp3vault98.com">MP3 Vault '98</a>, подобрать обложку для проигрывателя Nullsoft — в архиве <a data-url="http://skins.winamp.com">Скинов Winamp</a>, а сверить осенние чарты и аккорды — на страницах <a data-url="http://www.muzzone98.ru">МузЗоны '98</a>.</p>
        `
      },
      {
        id: 7,
        cat: 'sec',
        catLabel: 'Безопасность и Y2K',
        pageNum: 'Полоса 7 · Системная ревизия',
        title: 'Проблема 2000 года (Y2K): редакционный тест шести материнских плат и судьба регистров столетия в CMOS',
        subtitle: 'Мы перевели часы реального времени на 23:59 31 декабря 1999 года и проверили, какие платы сбросят календарь в 1900-й, а какие выдержат переход.',
        date: '17 ноября 1998',
        dateline: 'МОСКВА, СТЕНД РЕДАКЦИИ',
        author: 'Сергей Громов, отдел системной инженерии',
        keyFact: 'Байт столетия в ячейке 32h микросхемы RTC MC146818 на старых платах Socket 7 не обновляется автоматически при переходе с 99 на 00.',
        themeNote: 'Экономия двух байтов памяти тридцатилетней давности против устойчивости мировой инфраструктуры в новогоднюю ночь.',
        motif: 'Зелёная таблица Award BIOS Setup и секундомер, отсчитывающий последние удары до «00:00:00 01-01-1900».',
        file: 'CT98_07_Y2K_BIOS_TEST.TXT',
        snippet: 'Двузначное представление года в старых базах данных и микросхемах CMOS грозит вызвать сбой расчётов в полночь 1 января 2000 года. Мы проверили на стенде поведение реальных плат и патчей для Win 98.',
        body: `
          <p>До полуночи 1 января 2000 года остаётся чуть больше тринадцати месяцев, и разговоры о «Проблеме-2000» (Y2K) наконец перешли из газетных страшилок про падающие лифты в плоскость конкретной инженерной ревизии. Корень ошибки известен каждому программисту: в 1960–1980-х годах, когда каждый байт оперативной памяти и перфокарты стоил дорого, номер года записывали двумя десятичными цифрами (<tt>98</tt> вместо <tt>1998</tt>). Чтобы отделить реальную аппаратную угрозу от слухов, стендовая группа нашей редакции собрала шесть системных блоков разных поколений — от 486DX2-66 1994 года до свежей платы на чипсете Intel 440BX.</p>
          <h4>Что происходит в ячейке 32h в полночь</h4>
          <p>Часы реального времени (RTC) на любой IBM-совместимой плате ведут отсчёт в двоично-десятичном коде внутри совместимой с Motorola MC146818 схемы, доступной через порты ввода-вывода <tt>70h</tt> и <tt>71h</tt>. При переходе секундной стрелки через 23:59:59 31 декабря 1999 года младший регистр года (<tt>09h</tt>) исправно меняется с <tt>99</tt> на <tt>00</tt>, однако регистр столетия (<tt>32h</tt>) на трёх из шести проверенных нами старых платах Socket 7 остаётся равным <tt>19</tt>. Если не перехватить этот момент на уровне BIOS или драйвера операционной системы, после перезагрузки машина рапортует о наступлении 1 января 1900 года — или, после коррекции в старых версиях DOS, прыгает в 4 января 1980-го.</p>
          <blockquote class="news98-quote">«Операционная система Win 98 Second Edition самостоятельно отслеживает переход <tt>99 -> 00</tt> и принудительно перезаписывает байт столетия в CMOS, а также корректно считает 2000 год високосным по правилу деления на 400», — говорится в техническом бюллетене на портале <a data-url="http://www.microslop.com">Microslop.com</a>.</blockquote>
          <h4>Где спрятана настоящая опасность</h4>
          <p>Если домашний ПК под Win 98 можно обезопасить обновлением прошивки Award/AMI BIOS и установкой системного патча, то в банковских клиринговых системах, складских программах на FoxPro и ведомственных базах на COBOL двухзначное поле даты зашито прямо в структуру таблиц. Проверить часы и BIOS собственного компьютера в один клик можно на интерактивном полигоне <a data-url="http://www.y2k-countdown.org">Центра выживания Y2K</a>.</p>
        `
      },
      {
        id: 8,
        cat: 'net',
        catLabel: 'Интернет и Рунет',
        pageNum: 'Полоса 8 · Общество и Рунет',
        title: 'Российский интернет после дефолта: почему при долларе по двадцать рублей трафик Рунета вырос почти вдвое',
        subtitle: 'Когда глянцевые журналы и импортные диски подорожали втрое, тысячи пользователей ушли в ночные чаты, поисковики и электронные библиотеки.',
        date: '15 ноября 1998',
        dateline: 'МОСКВА — САНКТ-ПЕТЕРБУРГ',
        author: 'Анна Ильина, обозреватель Рунета',
        keyFact: 'За три осенних месяца индекс посещаемости в рейтинге Rambler\'s Top100 вырос на 84%, а среднее время ночной сессии превысило 110 минут.',
        themeNote: 'Экономический удар по бумажному и коробочному рынку непреднамеренно ускорил взросление отечественной сетевой среды.',
        motif: 'Сводка курса ЦБ РФ в углу главной страницы Рамблера и переполненная в три часа ночи комната «Компьютерщики» в чате «Кроватка».',
        file: 'CT98_08_RUNET_AFTER_DEFAULT.TXT',
        snippet: 'Несмотря на финансовый кризис августа 1998 года и скачок курса доллара с 6,20 до 20,80 рубля, аудитория российского сегмента Сети не сжалась, а показала рекордный осенний прирост.',
        body: `
          <p>В конце августа, когда табло уличных обменников меняли цифры трижды за день, а компьютерные фирмы на неделю закрыли склады на переучёт, многие предрекали молодому российскому Интернету затяжной обвал. Расчёт скептиков казался очевидным: оборудование провайдеров и аренда внешних спутниковых каналов оплачиваются в твёрдой валюте, а значит, модемный доступ станет неподъёмной роскошью. Однако ноябрьская статистика счётчика <a data-url="http://www.rambler98.ru">Rambler's Top100</a> зафиксировала прямо противоположную картину.</p>
          <h4>Утренний ритуал: курс ММВБ, поиск с морфологией и подержанный кулер</h4>
          <p>Первой причиной осеннего бума стал информационный голод: бумажные газеты хронически запаздывали к открытию торгов, тогда как сводка котировок на <a data-url="http://www.rambler98.ru">Рамблере</a> и поиск по новостным узлам через <a data-url="http://www.yandex.ru">Яndex</a> давали картину дня минута в минуту. Второй причиной стала резкая перестройка быта компьютерщиков. Когда новая видеокарта в магазине подорожала в рублях более чем втрое, обмен и покупка комплектующих с рук мгновенно переместились на первый сетевой аукцион <a data-url="http://www.molotok98.ru">«Молоток.ру»</a>, где лоты выставляют в у.е., но договариваются напрямую без магазинной наценки.</p>
          <blockquote class="news98-quote">«Бумажная книга в твёрдом переплёте теперь стоит как десять часов ночного модемного пула. Поэтому люди качают тексты архивами по пятьсот килобайт и читают с монитора всей семьёй», — отмечают авторы обозрения в альманахе <a data-url="http://www.pereplet99.ru">«Переплёт»</a>.</blockquote>
          <h4>Ночная страна от «Кроватки» до «Анекдотов»</h4>
          <p>Не менее заметно изменилась и география досуга. По вечерам и после двух часов ночи тысячи людей со всей страны — от Москвы и Питера до Новосибирска и Владивостока — встречаются в комнатах веб-чата <a data-url="http://chat.krovatka98.ru">«Кроватка '98»</a>, снимают стресс свежими выпусками <a data-url="http://www.anekdot98.ru">Anekdot.ru Дмитрия Вернера</a> и следят за похождениями Масяни на <a data-url="http://www.mult98.ru">Мульт.ру</a>. Кризис отсеял случайные рекламные витрины, но сделал Сеть повседневной привычкой.</p>
        `
      },
      {
        id: 9,
        cat: 'hw',
        catLabel: 'Железо и COMDEX',
        pageNum: 'Полоса 9 · Лаборатория разгона',
        title: 'Феномен Celeron 300A: как бюджетный процессор Mendocino за $148 догоняет в играх флагманский Pentium II 450',
        subtitle: 'Сто двадцать восемь килобайт кэша второго уровня на полной частоте ядра и изоляция контакта B21 устроили тихую революцию на Савёловском и в Митино.',
        date: '25 ноября 1998',
        dateline: 'МОСКВА, САВЁЛОВСКИЙ — МИТИНО',
        author: 'Дмитрий Руднев («Железный ряд»)',
        keyFact: 'Перевод шины с 66 на 100 МГц при фиксированном множителе 4,5x поднимает частоту Celeron 300A ровно до 450 МГц.',
        themeNote: 'Инженерный просчёт корпорации-производителя оборачивается подарком для тех, кто умеет читать даташиты Intel.',
        motif: 'Полоска прозрачного скотча или капля лака на 21-м контакте ряда B картриджа Slot 1 и вентилятор 60 мм на радиаторе.',
        file: 'CT98_09_CELERON_300A.TXT',
        snippet: 'Выпущенный Intel бюджетный процессор Celeron 300A на ядре Mendocino со встроенным кэшем 128 КБ разгоняется по стомегагерцовой шине до 450 МГц и в реальных тестах не уступает втрое более дорогому Pentium II 450.',
        body: `
          <p>Весной этого года первые процессоры линейки Celeron на ядре Covington (266 и 300 МГц), лишённые кэш-памяти второго уровня, заслужили в прессе обидное прозвище «тормозов в картридже Slot 1». Однако осенний выход чипа <b>Celeron 300A (Mendocino)</b> перевернул рынок вверх дном. Чтобы не городить на печатной плате внешние микросхемы памяти, инженеры Intel разместили 128 КБ кэша L2 прямо на кристалле процессора. И хотя по объёму этот кэш вчетверо меньше, чем у старшего Pentium II (512 КБ), работает он не на половинной, а на полной тактовой частоте самого ядра.</p>
          <h4>Математика шины 100 МГц и секрет ножки B21</h4>
          <p>Умножьте штатный зафиксированный коэффициент 4,5 на стандартную частоту системной шины материнских плат Intel 440BX — 100 МГц вместо положенных бюджетному чипу 66 МГц — и вы получите ровно <b>450 МГц</b>. При этом частота шин PCI (33 МГц) и AGP (66 МГц) остаётся абсолютно штатной, так что ни винчестер, ни звуковая карта не работают с перегрузкой. Если плата (например, ABIT BH6) позволяет переключить шину в меню SoftMenu BIOS, процедура занимает десять секунд; на более строгих платах достаточно аккуратно заклеить узкой полоской скотча или покрыть цапонлаком контакт <b>B21 (BSEL#)</b> на краевом разъёме процессора.</p>
          <blockquote class="news98-quote">«Малайзийская партия с маркировкой SL32A и SL2WM разлетается с лотков до обеда. Человек платит 148 долларов вместо 650 за старший Pentium II и в Quake II получает кадры один в один», — делятся продавцы в сводке прайсов <a data-url="http://www.ferrum98.ru">«Железного Цеха '98»</a>.</blockquote>
          <h4>Охлаждение и напряжение ядра</h4>
          <p>На большинстве экземпляров стабильный запуск на 450 МГц происходит при штатном напряжении 2,0 В; редким капризным кристаллам требуется подъём до 2,1–2,2 В и хороший радиатор с 60-миллиметровым шарикоподшипниковым вентилятором. Подробные схемы распиновки Slot 1, проверка маркировки партии и калькулятор FPS опубликованы в лаборатории <a data-url="http://www.ferrum98.ru">http://www.ferrum98.ru</a> и на страницах <a data-url="http://www.3dfx-zone.com">3dfx Voodoo Zone</a>.</p>
        `
      },
      {
        id: 10,
        cat: 'sec',
        catLabel: 'Безопасность и Y2K',
        pageNum: 'Полоса 10 · Экстренное предупреждение',
        title: 'Бомба на 26-е число: вирус Win95.CIH («Чернобыль») стирает Flash BIOS и загрузочные сектора дисков',
        subtitle: 'Накануне 26 ноября антивирусные лаборатории напоминают: кроме основной апрельской ветки в Сети гуляет модификация CIH v1.4, срабатывающая 26-го числа каждого месяца.',
        date: '24 ноября 1998',
        dateline: 'МОСКВА, ЛАБОРАТОРИЯ БЕЗОПАСНОСТИ',
        author: 'Сергей Громов, отдел системной инженерии',
        keyFact: 'Вирус размером около 1 КБ записывает свои куски в пустоты между секциями PE-файлов, не увеличивая размер заражённого .EXE ни на байт.',
        themeNote: 'Удобство программного обновления прошивки с дискеты обернулось физической уязвимостью железа перед кодом из Сети.',
        motif: 'Чёрный экран монитора после перезагрузки, немой динамик системного блока и перемычка JP1 в положении Write Protect.',
        file: 'CT98_10_CIH_BIOS_ALERT.TXT',
        snippet: 'Лаборатория Евгения Касперского и центр AntiVirus Lab выпустили экстренное предупреждение к 26 ноября: модификация вируса Win95.CIH v1.4 активируется 26-го числа каждого месяца, уничтожая таблицу разделов диска и микросхему Flash BIOS.',
        body: `
          <p>Если раньше самым худшим последствием вирусной атаки считалось форматирование жёсткого диска, то появившийся летом 1998 года тайваньский вирус <b>Win95.CIH</b> (получивший в России название «Чернобыль» из-за даты активации основных версий 1.2 и 1.3 — 26 апреля) впервые перешагнул границу между программами и аппаратной частью. Особую опасность представляет модификация <b>CIH v1.4</b>: её таймер срабатывает не раз в год, а <b>26-го числа каждого месяца</b> — то есть уже завтра, 26 ноября.</p>
          <h4>Как один килобайт кода попадает в Ring 0</h4>
          <p>Коварство CIH заключается в том, что обнаружить заражение на глаз по размеру файла невозможно. Вирус ищет в заголовках исполняемых файлов Win 95 и Win 98 (формат Portable Executable) неиспользуемые промежутки выравнивания секций, дробит своё тело на мелкие фрагменты и вписывает их в эти пустоты. При запуске заражённой программы вирус перехватывает системные вызовы через таблицу прерываний и переходит на нулевой уровень привилегий процессора (Ring 0), где остаётся резидентно в памяти и заражает каждый открываемый <tt>.EXE</tt>-файл.</p>
          <blockquote class="news98-quote">«Когда календарь показывает 26-е число, боевая процедура CIH сначала забивает мусором первые 2048 секторов всех физических дисков, а затем через порты южного моста открывает запись во флеш-память BIOS и стирает даже загрузочный блок Boot Block», — предупреждают специалисты <a data-url="http://www.antivirus98.com">AntiVirus Lab 1998</a>.</blockquote>
          <h4>Три шага защиты сегодня вечером</h4>
          <p>Во-первых, немедленно просканируйте диск C: и папку <tt>Downloads</tt> обновлённым комплексом <b>AVP 3.0 Касперского</b> (доступен в <a data-url="http://www.softstore98.com">SoftStore '98</a>) или бесплатной лечащей утилитой <tt>RetroCure.exe</tt> с узла <a data-url="http://www.antivirus98.com">http://www.antivirus98.com</a>. Во-вторых, отключите в настройках BIOS опцию <i>Flash BIOS Protection -> Enabled</i>. В-третьих, проверьте аппаратную перемычку <b>JP1 (Flash Write Protect)</b> рядом с микросхемой DIP-32 на материнской плате по справочнику джамперов в <a data-url="http://www.ferrum98.ru/jumpers">«Железном Цехе '98»</a>.</p>
        `
      },
      {
        id: 11,
        cat: 'os',
        catLabel: 'Компьютеры и ОС',
        pageNum: 'Полоса 11 · Хроника суда в Вашингтоне',
        title: 'Министерство юстиции США против Редмонда: можно ли вынуть браузер из ядра Win 98 без поломки системы',
        subtitle: 'В федеральном окружном суде Вашингтона судья Томас Пенфилд Джексон заслушивает показания главы Netscape Джима Барксдейла и экспертов по системным библиотекам.',
        date: '22 ноября 1998',
        dateline: 'ВАШИНГТОН — РЕДМОНД',
        author: 'Алексей Корнев, обозреватель ОС',
        keyFact: 'В антимонопольном иске участвуют Министерство юстиции США и прокуроры 20 штатов; спор идёт вокруг библиотек SHDOCVW.DLL и MSHTML.DLL.',
        themeNote: 'Свободная конкуренция независимых разработчиков против глубокой интеграции всех функций внутрь одной доминирующей ОС.',
        motif: 'Два ярлыка на Рабочем столе — синяя буква «e» и штурвал Netscape Navigator — и папка судейских протоколов толщиной в полметра.',
        file: 'CT98_11_DOJ_ANTITRUST.TXT',
        snippet: 'В федеральном суде Вашингтона набирает обороты главный антимонопольный процесс десятилетия против корпорации Microslop. Главный вопрос слушаний — является ли браузер Internet Explorer самостоятельным продуктом или неотделимой частью операционной системы Win 98.',
        body: `
          <p>Зал номер два федерального окружного суда в Вашингтоне этой осенью больше напоминает семинар по системному программированию, чем классическое заседание по антимонопольному закону Шермана 1890 года. С 19 октября судья Томас Пенфилд Джексон разбирает совместный иск Министерства юстиции США и двадцати штатов против корпорации Microslop. Обвинение во главе с адвокатом Дэвидом Бойсом утверждает: связав браузер Internet Explorer с операционной системой Win 98 на уровне лицензионных договоров со сборщиками ПК и системных библиотек, Редмонд перекрыл кислород конкурирующему браузеру <b>Netscape Communicator</b>.</p>
          <h4>Показания Джима Барксдейла и спор о двух DLL</h4>
          <p>Первым ключевым свидетелем обвинения выступил генеральный директор Netscape Джим Барксдейл, представивший переписку о знаменитой встрече в июне 1995 года, где стороны обсуждали раздел рынка браузеров. В ответ юристы Microslop выстроили защиту на архитектурном тезисе: в Win 98 компоненты просмотра HTML (<tt>MSHTML.DLL</tt> и <tt>SHDOCVW.DLL</tt>) обслуживают не только выход в Интернет, но и обычные папки «Моего компьютера», справочную систему HTML Help и панель задач Active Desktop.</p>
          <blockquote class="news98-quote">«Потребовать от нас вырезать код браузера из Win 98 — всё равно что потребовать вынуть систему впрыска топлива из готового автомобиля: значок с экрана убрать можно, но половина прикладных программ тут же перестанет открывать окна справки», — настаивают представители защиты.</blockquote>
          <h4>Эксперимент профессора Фелтена и выбор пользователя</h4>
          <p>На следующей неделе суд планирует рассмотреть демонстрационную программу профессора Принстонского университета Эдварда Фелтена, которая, по утверждению Минюста, отключает доступ к веб-браузеру без разрушения файлового проводника. Пока юристы ломают копья вокруг формулировок, обычные пользователи спокойно держат на диске оба браузера — проверяя страницы и в Internet Explorer 5.0, и в Netscape.</p>
        `
      },
      {
        id: 12,
        cat: 'net',
        catLabel: 'Интернет и Рунет',
        pageNum: 'Полоса 12 · Связь и коммуникации',
        title: 'Восемь цифр вместо телефона: как зелёный цветок ICQ стал главным пейджером планеты и зачем его купила AOL',
        subtitle: 'Четыре программиста из тель-авивской студии Mirabilis за два года собрали 12 миллионов пользователей и продали свой мессенджер за 287 миллионов долларов.',
        date: '19 ноября 1998',
        dateline: 'ТЕЛЬ-АВИВ — МОСКВА',
        author: 'Мария Соколова, отдел сетевой экономики',
        keyFact: 'Пакет проверки присутствия ICQ в фоновом режиме расходует менее 200 байт в минуту и мгновенно проходит через модем 14,4K.',
        themeNote: 'Живое мгновенное присутствие собеседника в трее против медленной формальности традиционной почты.',
        motif: 'Вращающийся лепестками цветок в правом нижнем углу рядом с часами, корабельный гудок при входе и пронзительное «Uh-oh!».',
        file: 'CT98_12_MIRABILIS_ICQ.TXT',
        snippet: 'Интернет-пейджер ICQ от компании Mirabilis окончательно вытеснил телефонные записки: номер UIN печатают на визитках рядом с e-mail, а сделка с гигантом America Online оценила программу в 287 миллионов долларов.',
        body: `
          <p>Ещё два года назад в русскоязычной Сети существовало только два способа связаться с человеком: отправить письмо по электронной почте (или нетмейлом в FidoNet) и ждать ответа до завтрашнего утра, либо караулить знакомый ник в веб-чате и на каналах IRC. Осенью 1998 года вопрос «Ты сейчас за компьютером?» решается взглядом в правый нижний угол панели задач Win 98: если маленький цветок <b>ICQ</b> сменил красный цвет на зелёный и раздался короткий корабельный гудок — собеседник на линии.</p>
          <h4>Победа коротких UDP-пакетов</h4>
          <p>Созданная четырьмя молодыми израильскими разработчиками (Яиром Голдфингером, Ариком Варди, Сефи Вигисером и Амноном Амиром) при поддержке отца Арика, Йоси Варди, программа выстрелила потому, что решала главную проблему коммутируемого доступа: как узнать, кто из друзей сейчас дозвонился до провайдера и какой динамический IP-адрес ему выдал пул. Клиент держит лёгкую связь с центральным сервером каталога, а сами текстовые реплики и файлы пересылает напрямую от машины к машине по протоколу UDP, почти не нагружая модемный канал.</p>
          <blockquote class="news98-quote">«Шестизначный UIN, зарегистрированный в 1996–1997 годах, сегодня ценится в компьютерной среде выше именного домена: это знак того, что ты пришёл в Сеть не вчера», — говорят завсегдатаи каталога Белых страниц.</blockquote>
          <h4>Сделка с America Online и отправка через браузер</h4>
          <p>Неудивительно, что корпорация America Online выложила за студию Mirabilis 287 миллионов долларов наличными (и ещё до 120 миллионов бонусами при росте базы). Даже если под рукой чужой компьютер без установленного клиента, отправить сообщение на любой шести- или семизначный UIN и заглянуть в справочник анкет можно прямо через браузер на узле <a data-url="http://www.icq.com">Mirabilis ICQ World &amp; Web-Pager</a>.</p>
        `
      },
      {
        id: 13,
        cat: 'games',
        catLabel: 'Игры и Steam',
        pageNum: 'Полоса 13 · Крупный план жанра',
        title: 'Ролевая осень девяносто восьмого: от пустошей Fallout 2 и врат Ферелдена до орбит Тариса и Ярило-VI',
        subtitle: 'Пока создатели трёхмерных боевиков меряются частотой кадров, классическая партийная и тактическая RPG переживает лучший сезон за всю историю ПК.',
        date: '16 ноября 1998',
        dateline: 'ЭДМОНТОН — ИРВАЙН — МОСКВА',
        author: 'Кирилл Зверев, обозреватель видеоигр',
        keyFact: 'Сразу пять крупных ролевых миров — от изометрических пустошей и готических катакомб до тактики с активной паузой — вышли в Steam и на официальных узлах.',
        themeNote: 'Глубина ветвящегося диалога и личного морального выбора игрока против линейного аттракциона спецэффектов.',
        motif: 'Зелёный экран Пип-Боя 2000, таблица бросков двадцатигранного кубика d20 и билет на Звёздный экспресс.',
        file: 'CT98_13_RPG_RENAISSANCE.TXT',
        snippet: 'Ещё три года назад аналитики хоронили компьютерные ролевые игры как «слишком медленный и текстовый жанр». Осень 1998 года опровергла этот приговор: Fallout 2, проекты BioWare Edmonton, Diablo и бесплатный экспресс Honkai: Star Rail 98 собирают многотысячную аудиторию.',
        body: `
          <p>В середине девяностых казалось, что золотой век компьютерных ролевых игр остался в прошлом вместе с дискетами Ultima и Eye of the Beholder: издатели требовали быстрых боевиков под новые 3D-ускорители и боялись диалогов длиннее трёх строчек. Однако к ноябрю 1998 года именно жанр RPG совершил самый впечатляющий разворот десятилетия, предложив игрокам взрослую драматургию, сложную математику характеристик и миры, которые реагируют на каждое решение.</p>
          <h4>От ядерных пустошей и собора Тристрама до тактики Эдмонтона</h4>
          <p>На одном полюсе жанра — нелинейная свобода постъядерной Калифорнии в <b>Fallout 2</b> и близкой нашему читателю <b>Fallout: Запорожье</b>, где высокую харизму и красноречие ценят не меньше плазменной винтовки. На другом — мрачные готические своды <b>Diablo</b> и готовящегося похода <b>Diablo II</b> от <a data-url="http://www.blizzard.com">Blizzard Entertainment</a>. Между ними мощно заявила о себе канадская студия <a data-url="http://www.bioware98.com">BioWare Edmonton</a>: в <b>Dragon Age: Origins 98</b> игрок программирует тактические условия союзников в битве при Остагаре, а в <b>Star Wars: KOTOR 98</b> считает раунды на движке d20 и раскладывает партию в Пазаак в кантине Верхнего Тариса.</p>
          <blockquote class="news98-quote">«Хорошая ролевая игра не ведёт тебя за руку по рельсам. Она даёт тебе отряд, карту, правила мира и спрашивает: чем ты готов пожертвовать, когда закончатся простые ответы?» — пишут авторы тактических разборов на портале <a data-url="http://www.kovcheg98.ru">«Ковчег»</a>.</blockquote>
          <h4>Бесплатный Звёздный экспресс и народные энциклопедии</h4>
          <p>Отдельным явлением осени стал пошаговый научно-фантастический проект <b>Honkai: Star Rail 98</b>: студия выложила полный установщик версии 1.6 (3,1 МБ) совершенно бесплатно как в <a data-url="http://www.steampowered.com">Steam</a>, так и на собственном узле <a data-url="http://hsr.hoyoverse.com">http://hsr.hoyoverse.com</a>. Вокруг игры в Рунете уже выросли два крупных сообщества — тактическая база билдов <a data-url="http://www.kovcheg98.ru">«Ковчег»</a> и полная энциклопедия миров и квестов <a data-url="http://www.astralwiki98.ru">«АстралВики '98»</a>.</p>
        `
      },
      {
        id: 14,
        cat: 'net',
        catLabel: 'Интернет и Рунет',
        pageNum: 'Полоса 14 · Культура Паутины',
        title: 'Два мегабайта под собственную крышу: кто и зачем строит домашние страницы в кварталах GeoCities',
        subtitle: 'Прогулка по десяти тематическим районам бесплатного хостинга — от серверной сисадмина Бориса и лавки букиниста до коллекции фиалок МарьИванны.',
        date: '14 ноября 1998',
        dateline: 'КРЕМНИЕВАЯ ДОЛИНА — МОСКВА',
        author: 'Анна Ильина, обозреватель Рунета',
        keyFact: 'Каждому жителю GeoCities выделяется ровно 2048 КБ дискового пространства, гостевая книга и счётчик посещений.',
        themeNote: 'Искренность ручной домашней вёрстки в Блокноте против одинаковых корпоративных сайтов-витрин.',
        motif: 'Жёлтый дорожный знак «Under Construction», мигающий разделитель и виджет WebRing в подвале страницы.',
        file: 'CT98_14_GEOCITIES_HOMESTEADS.TXT',
        snippet: 'Бесплатный хостинг GeoCities преодолел отметку в два миллиона личных «усадеб». Мы прошли по виртуальным улицам SiliconValley, Area51, Tokyo и Athens, чтобы понять, почему люди ночами верстают таблицы в Блокноте.',
        body: `
          <p>У большой Всемирной Паутины 1998 года есть два лица. Первое — парадные фасады корпораций и информагентств с выверенными шрифтами. Второе, куда более живое и непредсказуемое, открывается всякому, кто заходит на улицы <a data-url="http://www.geocities.com">GeoCities '98</a>. Придуманная Дэвидом Бонеттом идея расселять пользователей по тематическим «кварталам» (<i>SiliconValley</i> для программистов и железячников, <i>Area51</i> для фантастов и уфологов, <i>Tokyo</i> для любителей аниме, <i>Athens</i> для поэтов и книжников, <i>MotorCity</i> для автомобилистов) превратила обычный бесплатный FTP-хостинг в огромный обитаемый город.</p>
          <h4>Искусство уложиться в 2048 килобайт</h4>
          <p>Железное правило усадьбы — лимит в два мегабайта на всё хозяйство. Это ограничение рождает удивительную изобретательность: вместо тяжёлых фотографий авторы рисуют пиксельные схемы, фоном пускают крошечный бесшовный квадратик 32×32 пикселя под звёздное небо или серый мрамор, а для музыкального сопровождения прикрепляют 15-килобайтный файл <tt>.MID</tt>, который играет через синтезатор звуковой карты, пока гость читает страницу.</p>
          <blockquote class="news98-quote">«Домашняя страничка — это твоя открытая дверь в Сети. Тут не нужно спрашивать разрешения у главного редактора: выложил свой конфиг для Quake, повесил гостевую книгу — и к утру у тебя уже двадцать записей из пяти городов», — рассказывает автор знаменитой <a data-url="http://www.geocities.com/SiliconValley/dima">странички Вебмастера Димы</a>.</blockquote>
          <h4>Восемнадцать живых адресов и кольцо WebRing</h4>
          <p>В русскоязычном секторе <a data-url="http://www.geocities.com">GeoCities</a> можно часами переходить из дома в дом: заглянуть в серверную сисадмина Бориса с бубном и пингами, сверить каталог дисков у Макса_CD-ROM, почитать школьную тетрадь Мишки из 9 «Б», изучить жиклёры карбюратора «Солекс» в гараже Вована или полить узамбарские фиалки у главбуха МарьИванны. А чтобы читатель не потерялся среди тысяч адресов, владельцы объединяют близкие по духу сайты в кольцо <b>The Retro WebRing 1998</b>.</p>
        `
      },
      {
        id: 15,
        cat: 'col',
        catLabel: 'Авторские колонки',
        pageNum: 'Полоса 15 · Колонка редактора',
        title: 'Между бумажным «Новым миром» и файлом .TXT в Блокноте: как мы научились читать русскую прозу с кинескопа',
        subtitle: 'Выпускающий редактор Ольга Лаптева — о библиотеке Максима Мошкова, добровольцах с планшетными сканерами и споре толстых журналов с сетевыми альманахами.',
        date: '13 ноября 1998',
        dateline: 'МОСКВА, МЯСНИЦКАЯ',
        author: 'Ольга Лаптева, выпускающий редактор',
        keyFact: 'Полный роман в чистом формате .TXT без графического оформления весит 300–450 КБ и скачивается на модеме 33,6K менее чем за три минуты.',
        themeNote: 'Доступность текста для читателя в любом городе страны против привычного ритуала бумажной страницы.',
        motif: 'Зелёный свет лампы планшетного сканера Hewlett-Packard в полночь и открытое окно «Блокнота» со шрифтом Fixedsys.',
        file: 'CT98_15_LAPTEVA_LITERATURE.TXT',
        snippet: 'Ещё недавно считалось, что серьёзный роман невозможно читать с экрана четырнадцатидюймового монитора. Но библиотека Максима Мошкова Lib.ru и литературные узлы Рунета доказали обратное: главное — не верстка, а живой текст.',
        body: `
          <p>Каждый раз, когда кто-нибудь из старых университетских знакомых говорит мне, что с экрана монитора можно читать только прайс-листы и короткие сводки новостей, я вспоминаю картину, которую наблюдаю в нашей редакции почти каждый вечер после сдачи номера. В половине девятого, когда стихают телефоны, наш системный инженер открывает в стандартном «Блокноте» Win 98 текстовый файл с «Понедельником» братьев Стругацких или свежей журнальной повестью, разворачивает окно на весь экран и читает полтора часа подряд, изредка нажимая клавишу <tt>Page Down</tt>.</p>
          <h4>Эстетика серого фона и отказ от лишних байтов</h4>
          <p>Созданная Максимом Мошковым на сервере НИИСИ РАН <a data-url="http://www.lib.ru">Библиотека Lib.ru</a> выглядит в браузере аскетично до крайности: никаких мигающих баннеров, никаких цветных таблиц и шрифтовых изысков — только заголовок, кнопка переключения кодировки (KOI8-R, Win-1251, ISO) и чистый текст. Но за этой внешней простотой стоит глубокое уважение к читателю, который звонит на пул из Томска, Архангельска или Перми по зашумлённой телефонной паре. Там, где тяжёлая иллюстрированная страница грузится десять минут, четырёхсотстраничная книга пролетает за две минуты — и остаётся на жёстком диске навсегда.</p>
          <blockquote class="news98-quote">«Сетевая библиотека держится не на бюджетах, а на людях, которые после основной работы кладут книгу под крышку сканера, прогоняют листы через FineReader и вручную вычитывают каждую опечатку перед отправкой на сервер», — пишут составители альманаха <a data-url="http://www.pereplet99.ru">«Переплёт»</a>.</blockquote>
          <h4>Толстый журнал и гипертекст в одной упряжке</h4>
          <p>Сегодня бумажная словесность и экран монитора больше не враждуют. В свободной энциклопедии <a data-url="http://www.interpedia.org">Интерпедия</a> студенты сверяют справочные статьи, в <a data-url="http://www.lib.ru">Lib.ru</a> сохраняют классику в <tt>Мои документы</tt>, а на страницах литературного альманаха <a data-url="http://www.pereplet99.ru">«Переплёт»</a> обсуждают журнальные новинки «Нового мира» и «Знамени», считают время загрузки книжной полки по модему и разбирают устройство романа в мастерской темы.</p>
        `
      },
      {
        id: 16,
        cat: 'hw',
        catLabel: 'Железо и COMDEX',
        pageNum: 'Полоса 16 · Связь и телекоммуникации',
        title: 'Пятьдесят шесть килобит с оговорками: почему стандарт V.90 на городских АТС редко даёт больше 46 666 бит/с',
        subtitle: 'Полевые испытания модемов USRobotics Courier, Sportster и ZyXEL Omni 56K на цифровых, координатных и декадно-шаговых линиях Москвы.',
        date: '11 ноября 1998',
        dateline: 'МОСКВА, УЗЕЛ СВЯЗИ',
        author: 'Сергей Громов, отдел системной инженерии',
        keyFact: 'В стандарте ITU-T V.90 скорость от провайдера к абоненту ограничена шумом квантования ИКМ, а обратный канал всегда работает по схеме V.34 (до 33 600 бит/с).',
        themeNote: 'Паспортный максимум цифрового стандарта сталкивается с физикой медной лапши, проложенной в колодцах тридцать лет назад.',
        motif: 'Двухсекундный металлический скрежет согласования V.90 из динамика модема и заветная строчка «CONNECT 46666/ARQ/V90/LAPM/V42BIS».',
        file: 'CT98_16_MODEM_V90_TEST.TXT',
        snippet: 'Утверждение единого стандарта ITU-T V.90 положило конец войне протоколов x2 и K56flex. Мы проверили, какую реальную скорость выдают модемы 56K на разных типах телефонных станций и какие строки инициализации спасают от обрывов.',
        body: `
          <p>Весь прошлый год покупатель скоростного модема чувствовал себя игроком в рулетку: половина московских провайдеров ставила в стойки пулы с протоколом <b>x2</b> от 3Com/USRobotics, а другая половина — оборудование <b>K56flex</b> от Rockwell и Lucent. Принятие Международным союзом электросвязи единого стандарта <b>ITU-T V.90</b> наконец позволило перепрошить оба лагеря на общий язык. Однако первые же замеры показали: гордая цифра «56 000 бит/с» на коробке — это теоретический потолок, недостижимый на обычной телефонной паре.</p>
          <h4>Условие одного преобразования и асимметрия канала</h4>
          <p>Чтобы протокол V.90 вообще включился, на всём пути от модемного пула провайдера (например, стоек Cisco AS5300 в МТУ-Интел или Ситилайн) до вашей квартиры должно происходить ровно одно цифро-аналоговое преобразование — на абонентском комплекте вашей районной АТС. Если вы живёте на новой цифровой или хорошей координатной станции с уплотнением по ИКМ-тракту, модем уверенно поднимает соединение на <b>45 333 – 49 333 бит/с</b> на приём (при этом отправка данных от вас в Сеть всегда идёт по классическому протоколу V.34 на 28 800 или 31 200 бит/с). Но стоит сигналу пройти через старую декадно-шаговую АТС с механическими шаговыми искателями и окисленными контактами, как уровень шума заставляет модем откатиться обратно на 33 600 бит/с.</p>
          <blockquote class="news98-quote">«Никогда не верьте красивой цифре 115 200 бит/с в окне подключения Win 98 — это всего лишь скорость обмена между компьютером и COM-портом. Настоящую канальную скорость покажет только ключ <tt>AT&amp;V1</tt> или инспектор в журнале модема», — напоминают авторы сетевого журнала <a data-url="http://www.xakep98.ru">«Хакер '98»</a>.</blockquote>
          <h4>Спасительный регистр S10 и выбор модели</h4>
          <p>На проблемных линиях бесспорным лидером наших испытаний остался внешний <b>USRobotics Courier V.Everything</b> в чёрном корпусе, за ним вплотную идут <b>ZyXEL Omni 56K Plus</b> и бежевый <b>Sportster Voice 56K</b>. Если на вашей линии проскакивают щелчки и модем бросает трубку, добавьте в строку инициализации в свойствах «Удалённого доступа к сети» команду <tt>ATS10=50</tt> — она заставит модем ждать восстановления несущей пять секунд вместо стандартных полутора.</p>
        `
      },
      {
        id: 17,
        cat: 'games',
        catLabel: 'Игры и Steam',
        pageNum: 'Полоса 17 · Индустрия переводов',
        title: 'Рыба на золотом корешке: как студия «Фаргус», рыночные развалы и журнал «Игромания» делят полки игроков',
        subtitle: 'Репортаж с субботней ярмарки: чем профессиональная актёрская озвучка отличается от машинного подстрочника и где брать патчи к русским версиям.',
        date: '09 ноября 1998',
        dateline: 'МОСКВА, ТУШИНО — КУЗНЕЦКИЙ МОСТ',
        author: 'Кирилл Зверев, обозреватель видеоигр',
        keyFact: 'В архиве поддержки «Фаргус Мультимедиа» выложены проверенные русификаторы и патчи для копий, установленных в C:\\Games.',
        themeNote: 'Труд переводчика и актёра у микрофона против конвейерной штамповки дисков с автопереводом за две ночи.',
        motif: 'Жёлтая полоса на обложке джевела со штампом золотой рыбки и характерный хрипловатый баритон вступительного ролика.',
        file: 'CT98_17_FARGUS_LOCALIZATION.TXT',
        snippet: 'Сотни игр выходят на русском языке каждую неделю, но под одинаковой надписью «Полная русская версия» могут скрываться как многоголосая студийная работа «Фаргуса», так и неиграбельный машинный перевод.',
        body: `
          <p>Субботнее утро на радиорынке в Митино и в рядах у Кузнецкого моста начинается одинаково: к десяти часам у лотков с компакт-дисками выстраивается плотная очередь в зимних куртках. Главный вопрос, который покупатель задаёт продавцу, протягивая заветную коробку с Fallout 2, Diablo или квестом от <a data-url="http://www.lucasarts.com">LucasArts</a>, звучит коротко: «Чей перевод — настоящий Фаргус или подделка под него?»</p>
          <h4>Четыре голоса в студии против программы Stylus</h4>
          <p>Разница между этими двумя мирами слышна с первой же минуты запуска. Команда <a data-url="http://www.goldfargus.ru">«Фаргус Мультимедиа»</a> первой на отечественном рынке поставила дело на студийные рельсы: текст игры вынимают из ресурсов программисты, литературные редакторы адаптируют шутки и диалоги, а у микрофона работают профессиональные актёры театра и кино, способные озвучить и старого мудреца Декарда Каина в Тристраме, и безумного кролика Макса в <a data-url="http://www.lucasarts.com">Sam &amp; Max</a>. На другом полюсе — безымянные конторы, которые за одну ночь прогоняют английские субтитры через сырой словарь машинного переводчика, отчего в инвентаре появляются легендарные перлы вроде «Длинного меча ублюдка» (<i>Bastard Sword</i>) или «Голого привода» (<i>Naked Drive</i>).</p>
          <blockquote class="news98-quote">«Если после перевода в ролевой игре пропадает половина веток диалога из-за переполнения строки — это брак. Поэтому мы держим в Сети открытую базу патчей и исправлений для всех своих релизов», — объясняют в редакции <a data-url="http://www.goldfargus.ru">http://www.goldfargus.ru</a>.</blockquote>
          <h4>Где сверять коды, прохождения и видеоролики</h4>
          <p>Тем же, кто предпочитает брать чистые цифровые лицензии в <a data-url="http://www.steampowered.com">Steam</a>, на помощь приходит связка из трёх проверенных ресурсов: на официальном узле журнала <a data-url="http://www.igromania.ru">«Игромания»</a> можно посмотреть видеоролики с компакт-диска и почитать «Руководство и прохождение», на <a data-url="http://www.cheatcc.com">Cheat Code Central</a> — сверить секретные коды и клавиши меню F7, а на <a data-url="http://www.goldfargus.ru">сайте «Фаргуса»</a> — послушать знаменитые цитаты озвучки и скачать патчи совместимости.</p>
        `
      },
      {
        id: 18,
        cat: 'sci',
        catLabel: 'Репортажи и Наука',
        pageNum: 'Полоса 18 · Космос и вычисления',
        title: 'Первый кирпич новой станции и радиошум в экранной заставке: пуск модуля «Заря» и старт проекта SETI@home',
        subtitle: 'С космодрома Байконур ракета «Протон-К» вывела на орбиту первый блок Международной космической станции, а астрономы Беркли зовут владельцев ПК искать внеземные сигналы.',
        date: '20 ноября 1998',
        dateline: 'БАЙКОНУР — БЕРКЛИ — МОСКВА',
        author: 'Илья Воронов, специальный корреспондент',
        keyFact: 'Двадцатитонный функционально-грузовой блок «Заря» вышел на расчётную орбиту высотой 400 км; приём радиопакетов Аресибо в SETI@home разбит на блоки по 340 КБ.',
        themeNote: 'Кооперация стран и миллионов домашних компьютеров ради задач, непосильных одному государству или одному суперкомпьютеру.',
        motif: 'Белый след «Протона» в ноябрьском небе Казахстана и зелёный график быстрого преобразования Фурье на мониторе в ночной комнате.',
        file: 'CT98_18_ZARYA_ISS_SETI.TXT',
        snippet: 'Двадцатого ноября с Байконура успешно стартовала ракета «Протон-К» с функционально-грузовым блоком «Заря» — первым модулем будущей МКС. Одновременно учёные из Беркли объявили о наборе добровольцев с домашними ПК для распределённого анализа сигналов радиотелескопа Аресибо.',
        body: `
          <p>Сегодня утром, 20 ноября 1998 года, с площадки № 81 космодрома Байконур в пасмурное осеннее небо ушла тяжёлая ракета-носитель «Протон-К». Под головным обтекателем находился двадцатитонный функционально-грузовой блок <b>«Заря»</b>, построенный в московском Центре имени Хруничева. Через десять минут после старта модуль отделился от третьей ступени, раскрыл солнечные батареи размахом в двадцать четыре метра и передал в Центр управления полётами в Королёве первую телеметрию. На высоте четырёхсот километров над Землёй началось строительство Международной космической станции, которой предстоит принять вахту у работающего уже двенадцать лет комплекса «Мир».</p>
          <h4>Два бортовых компьютера и стыковка в декабре</h4>
          <p>На первом этапе «Заря» отвечает за ориентацию, энергоснабжение и поддержание орбиты всей будущей связки. Уже в начале декабря к её гермоадаптеру должен причаливать американский шаттл «Индевор» с узловым модулем Unity. Интересная деталь для наших читателей: бортовой вычислительный комплекс станции и наземные стенды телеметрии работают на проверенных процессорах архитектуры x86, где надёжность кода и защита от сбоев питания важнее пиковой тактовой частоты.</p>
          <blockquote class="news98-quote">«Тысяча обычных домашних компьютеров Pentium II, которые по ночам крутят трёхмерную заставку без дела, в сумме превосходят по вычислительной мощности любой университетский суперкомпьютер», — объясняет руководитель группы SETI@home Дэвид Андерсон из Калифорнийского университета в Беркли.</blockquote>
          <h4>Как ваш модем поможет радиотелескопу в Аресибо</h4>
          <p>Пока на орбите собирают станцию, астрономы Беркли предложили владельцам ПК под управлением Win 98 поучаствовать в космосе прямо из дома. Программа-хранитель экрана <b>SETI@home</b> скачивает по модему компактный рабочий пакет объёмом 340 КБ с записью шума гигантской трехсотметровой чаши радиотелескопа в Пуэрто-Рико, несколько дней обсчитывает его методом преобразования Фурье в минуты простоя процессора, а затем отправляет отчёт обратно. Самые любопытные аномалии радиоэфира и рассекреченные архивные наблюдения уже активно разбирают энтузиасты на узле <a data-url="http://www.xfiles98.ru">«Истина где-то рядом»</a>.</p>
        `
      },
      {
        id: 19,
        cat: 'music',
        catLabel: 'Музыка и MP3',
        pageNum: 'Полоса 19 · Музыка и видео на ПК',
        title: 'Ночной эфир на восьмой кнопке и клипы в 320×240: как «MTV Россия» и сжатие видео встретились в модемную эпоху',
        subtitle: 'От «Pretty Fly» группы The Offspring и «Garage Inc.» Metallica до интернет-кинотеатра в Самаре и трёхмерных клипов студии «ПОЛИГОН».',
        date: '07 ноября 1998',
        dateline: 'МОСКВА — САМАРА',
        author: 'Игорь Белов, музыкальный и правовой отдел',
        keyFact: 'Сжатый кодеком Cinepak или MPEG-1 видеоклип в разрешении 320×240 занимает 4–6 МБ, а трёхмерная сцена на движке «Полигона» рендерится прямо в реальном времени.',
        themeNote: 'Желание смотреть и пересматривать любимый клип по собственному выбору против ожидания эфирной сетки телевизора.',
        motif: 'Всплывающая плашка с именем режиссёра в углу телеэкрана, окно ActiveMovie Player 98 и зелёная сетка каркасной модели.',
        file: 'CT98_19_MTV_WEBCINEMA_98.TXT',
        snippet: 'Запуск телеканала «MTV Россия» и осенние альбомы Metallica, The Offspring и «Сплина» совпали с рождением первых сетевых видеозалов: ролики скачивают под модем в WebCinema \'98 и собирают в 3D в студии «ПОЛИГОН».',
        body: `
          <p>С тех пор как в ночь с 25 на 26 сентября в московском метровом и дециметровом эфире с концерта The Prodigy началось вещание телеканала <b>«MTV Россия»</b>, видеомагнитофоны в тысячах квартир работают в режиме ночного дежурства. Молодые ведущие Василий Стрельников, Тутта Ларсен, Ольга Шелест и Антон Комолов принесли в эфир живую разговорную интонацию, а ноябрьские премьеры — двойной сборник каверов <i>Garage Inc.</i> от Metallica и хулиганский сингл <i>Pretty Fly (for a White Guy)</i> калифорнийцев The Offspring — мгновенно возглавили студенческие хит-парады.</p>
          <h4>Кинозал на одно место: видео по модему из Самары</h4>
          <p>Но что делать, если в вашем городе телесигнал не ловится или хочется пересмотреть любимый ролик на мониторе компьютера? Этой осенью в Рунете появились сразу две удивительные инженерные площадки. Первая — открытый самарскими энтузиастами интернет-кинотеатр <a data-url="http://www.webcinema98.com">WebCinema '98</a>. Каждая запись в его фонотеке (от клипов The Prodigy и трейлера Half-Life до отрывков аниме «Берсерк») бережно пережата под пропускную способность модемов 28.8K–56K, снабжена точным калькулятором времени скачивания и открывается в системном проигрывателе <b>ActiveMovie Video Player 98</b>.</p>
          <blockquote class="news98-quote">«Тянуть пятнадцать мегабайт сырого видео по телефонной линии — расточительство. Куда интереснее передать координаты камер, скелеты музыкантов и освещение, чтобы видеокарта собрала клип прямо на глазах зрителя», — объясняют авторы проекта <a data-url="http://www.poligon3d.ru">«ПОЛИГОН»</a>.</blockquote>
          <h4>Трёхмерная сцена и архив клипов</h4>
          <p>Именно по этому пути пошла студия <a data-url="http://www.poligon3d.ru">«ПОЛИГОН»</a>, где культовые музыкальные клипы воссозданы в честной трёхмерной графике с переключением ракурсов камеры. А тем, кто следит за расписанием эфиров, текстами песен, гитарными табулатурами и свежими новостями отечественной сцены (от питерского «Сплина» до готовящихся ремиксов <a data-url="http://www.carman99.ru">группы «Кар-Мэн»</a> и авторских каналов на <a data-url="http://www.youvid.com">YouVid</a>), стоит добавить в закладки музыкальное обозрение <a data-url="http://www.muzzone98.ru">«МузЗона '98»</a>.</p>
        `
      },
      {
        id: 20,
        cat: 'col',
        catLabel: 'Авторские колонки',
        pageNum: 'Полоса 20 · Взгляд изнутри Сети',
        title: 'Полночь на узле 2:5020: почему фидошники не спешат закрывать GoldED ради ярких веб-таблиц и чатов',
        subtitle: 'Обозреватель Алексей Корнев (2:5020/98) — о культуре квотинга, ночном часе ZMH, браузерных мирах и о том, чему Всемирная Паутина учится у старого Фидо.',
        date: '05 ноября 1998',
        dateline: 'МОСКВА, УЗЕЛ 2:5020',
        author: 'Алексей Корнев (2:5020/98), обозреватель ОС и сетей',
        keyFact: 'В столичном регионе 2:5020 сети FidoNet ежедневно пересылаются десятки тысяч писем в сотнях тематических эхоконференций без абонентской платы.',
        themeNote: 'Дисциплина осмысленного диалога и взаимной ответственности против анонимного шума быстрых веб-страниц.',
        motif: 'Жёлто-синее окно редактора GoldED в текстовом режиме 80×25, строка Origin внизу письма и гудок мейлера T-Mail в четыре часа утра.',
        file: 'CT98_20_FIDONET_CULTURE.TXT',
        snippet: 'Каждый год любительской сети FidoNet предрекают скорую гибель под натиском цветного WWW. Но стоит заглянуть в эхоконференции узла 2:5020, чтобы убедиться: самые точные технические ответы по-прежнему пишутся в текстовом редакторе.',
        body: `
          <p>Недавно молодой стажёр в нашей редакции, глядя через моё плечо на синий текстовый экран с жёлтыми полосами цитат, искренне удивился: «Зачем вы набираете ответ в DOS-редакторе и ждёте ночного дозвона до босс-ноды, если в браузере уже есть цветные форумы с картинками?» Вопрос закономерный для конца 1998 года. И всё же любой, кто хотя бы раз пытался найти толковый совет по перепайке конденсаторов на материнской плате или настройке прерываний IRQ для капризной звуковой карты, знает: в эхоконференциях <b>FidoNet</b> процент точных инженерных ответов на порядок выше, чем в большинстве гостевых книг.</p>
          <h4>Почему отложенное письмо заставляет думать</h4>
          <p>Секрет прост и кроется в самой архитектуре сети, придуманной Томом Дженнингсом. Когда ты забираешь мейлером свежую почтовую бандлу на свой поинт, телефонная линия тут же освобождается. Ты читаешь эхи (<tt>RU.GAME</tt>, <tt>SU.HARDW.PC.CPU</tt>, <tt>RU.ANECDOT</tt>, <tt>RU.MODEM</tt>) в полной тишине, без тикающего счётчика провайдера, аккуратно оставляешь от чужого письма только нужные строчки квотинга и формулируешь мысль так, чтобы за неё не было стыдно перед сотней коллег, знающих твоё настоящее имя и адрес узла. А за порядком следит не безликий скрипт, а живой комодератор с правилами эхи и плюсомётом.</p>
          <blockquote class="news98-quote">«Веб научил людей быстро кликать мышью, а Фидо научило нас отвечать за каждое написанное слово и делиться программами бескорыстно», — говорят сисопы московского узла <a data-url="http://fido.relcom.ru">FidoNet 2:5020</a>.</blockquote>
          <h4>Мост между эхами и новым вебом</h4>
          <p>К счастью, в 1998 году выбирать что-то одно совсем не обязательно. Сегодняшний веб впитал лучшие черты фидошной и клубной культуры: через открытый шлюз <a data-url="http://fido.relcom.ru">FidoNet Web-Gateway (2:5020)</a> можно читать и отправлять письма в любимые эхи прямо из Internet Explorer, на форуме <a data-url="http://forum.games98.com">GamerZone</a> ведутся многостраничные разборы игр, а в табличной многопользовательской игре <a data-url="http://www.ashroad98.ru">«Пепельный Тракт '98»</a> ветераны текстовых MUD-миров сражаются на заставе Старый Брод бок о бок с новичками Паутины.</p>
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
        { author: 'DialUp_Guy', date: '24.11.1998 15:10', text: 'Поставил Win 98 SE на свой Pentium 166 MMX — работает намного стабильнее первой июньской сборки! И внешний модем USRobotics перестал терять порт после сна.' },
        { author: 'WinFanatic', date: '24.11.1998 18:20', text: 'Служба ICS спасла бюджет: соединили с братом два компьютера коаксиалом 50 Ом и теперь ходим в Сеть по одному ночному логину.' },
        { author: 'SysAdmin_Boris', date: '25.11.1998 09:05', text: 'Главное, что починили стек USB на платах 440BX. Теперь сканер и мышка живут без синих экранов.' }
      ],
      2: [
        { author: 'Modem_NightOwl', date: '23.11.1998 19:40', text: 'Подтверждаю: докачка блоками по 64 КБ в Steam — гениальная штука. На моей координатной АТС обрывы каждые 40 минут, но Half-Life докачалась без единой ошибки!' },
        { author: 'Kuznetsky_Buyer', date: '24.11.1998 11:15', text: 'Установщик SteamInstall.exe всего 1,3 МБ — прилетел за пять минут. Удобно, что все купленные игры сразу ложатся в C:\\Games.' }
      ],
      3: [
        { author: 'Voodoo_SLI_King', date: '22.11.1998 21:30', text: 'Две платы Diamond Monster 3D II по 12 МБ в SLI — это космос! В Quake II на 1024x768 картинка идёт как по маслу. Только кабель pass-through держите подальше от трансформатора.' },
        { author: 'TNT_Advocate', date: '23.11.1998 10:12', text: 'Посмотрим, что выйдет у 3dfx с заводами STB. А пока на RIVA TNT в 32-битном цвете небо в Unreal без полосатых градиентов!' }
      ],
      4: [
        { author: 'Pripyat_Geolog', date: '21.11.1998 22:05', text: 'Работали в тех местах в 1996-м у Янова. То, что радиостанции садятся за полчаса и компас уводит — чистая правда. Ребятам из GSC уважение за внимание к деталям.' },
        { author: 'Stalker_Kiev', date: '22.11.1998 14:18', text: 'Взял оба выпуска S.T.A.L.K.E.R. в Steam, а X-Ray 98 погонял в демоверсии с диска «Игромании». Атмосфера ночного Кордона и писк детектора переданы до мурашек.' }
      ],
      5: [
        { author: 'BlackMesaScientist', date: '20.11.1998 14:00', text: 'Сцена в вагонетке монорельса в самом начале погружает в игру на 100%! Никаких роликов, ты сам ходишь по вагону и смотришь в окно. 10 из 10.' },
        { author: 'CrowbarMaster', date: '21.11.1998 09:30', text: 'ИИ спецназовцев HECU заставил попотеть: пока один держит тебя огнём из автомата, второй заходит за ящики и кидает гранату под ноги!' }
      ],
      6: [
        { author: 'MusicLover98', date: '18.11.1998 18:45', text: 'RIAA не сможет остановить MP3. Я скачал треки Fatboy Slim и Prodigy с сайта MP3 Vault 98 по модему и слушаю в Winamp с эквалайзером без всяких CD!' },
        { author: 'LPT_Flasher', date: '19.11.1998 12:10', text: 'Видел вчера живьём Diamond Rio на выставке: невесомая коробочка, тряси как хочешь — звук не прыгает ни на секунду.' }
      ],
      7: [
        { author: 'CMOS_Engineer', date: '17.11.1998 16:40', text: 'Спасибо за наводку на регистр 32h! Проверил свою старую плату на i430VX — точно, после 23:59 31.12.1999 ставит 1900 год. Прошил свежий Award BIOS, теперь порядок.' },
        { author: 'Bank_Cobol', date: '18.11.1998 10:25', text: 'За домашние ПК под Win 98 SE я спокоен, а вот у нас в расчётном отделе до сих пор крутятся таблицы 1989 года с двухзначным годом. Работы хватит до следующего декабря.' }
      ],
      8: [
        { author: 'Runet_Citizen', date: '15.11.1998 20:15', text: 'Всё так и есть: утром первым делом открываю Рамблер посмотреть курс доллара и погоду, а после двух ночи сидим в Кроватке и читаем Мошкова.' },
        { author: 'Molotok_Trader', date: '16.11.1998 13:50', text: 'После августа только Молоток.ру и выручает: вчера выменял там звуковую AWE64 по старому курсу без магазинной накрутки.' }
      ],
      9: [
        { author: 'Vlad_Overclock', date: '25.11.1998 11:05', text: 'Мой Celeron 300A (малайзийский SL32A) с заклеенным скотчем контактом B21 встал на 450 МГц при штатных 2,0 В! Кулер поставил шариковый 60 мм, температура 37 градусов.' },
        { author: 'Mitino_Hunter', date: '25.11.1998 13:22', text: 'В субботу в Митино за партией SL32A стояла очередь как за колбасой. Главное — не перепутать со старым бескошевым 300 без буквы А!' }
      ],
      10: [
        { author: 'Kaspersky_User', date: '24.11.1998 21:00', text: 'Только что проверил папку Downloads через AVP 3.0 — нашёл заражённый архив, программа завизжала как резаная и вылечила файл! Перемычку JP1 на плате тоже переставил в 2-3.' },
        { author: 'Hardware_Doc', date: '25.11.1998 08:40', text: 'Вчера уже принесли две платы с убитым Boot Block после CIH v1.4. Не ленитесь сегодня вечером закрыть запись во флеш джампером!' }
      ],
      11: [
        { author: 'Netscape_Pilot', date: '22.11.1998 17:30', text: 'У меня на Рабочем столе мирно живут и Internet Explorer 5.0, и Netscape. Но читать судебные пикировки вокруг MSHTML.DLL чертовски интересно!' },
        { author: 'Kernel_Watcher', date: '23.11.1998 11:45', text: 'С технической точки зрения выдрать SHDOCVW.DLL из Win 98 действительно непросто — на нём завязаны и папки Проводника, и справка .CHM.' }
      ],
      12: [
        { author: 'UIN_SixDigit', date: '19.11.1998 23:10', text: 'Моему шестизнаку в ICQ уже полтора года! Звук корабельного гудка при старте и «Uh-oh!» ночью будят всю квартиру, если забыть убавить колонки.' },
        { author: 'Student_MSU', date: '20.11.1998 14:35', text: 'Очень выручает веб-пейджер на www.icq.com, когда сидишь в компьютерном классе университета и нужно срочно кинуть весточку на домашний UIN.' }
      ],
      13: [
        { author: 'Vault_Dweller_98', date: '16.11.1998 19:20', text: 'Такой осени для любителей RPG ещё не было! Днём прохожу Dragon Age 98 и считаю d20 в KOTOR 98, а ночью водим отряд по Ярило-VI в Звёздном экспрессе.' },
        { author: 'Bocman_Kovcheg', date: '17.11.1998 12:00', text: 'Спасибо редакции за упоминание «Ковчега»! Мы как раз обновили таблицы скоростей и калькулятор отрядов для версии 1.5.' }
      ],
      14: [
        { author: 'Webmaster_Dima', date: '14.11.1998 22:40', text: 'Привет редакции Cyberspace Times с улицы SiliconValley! Уложиться в 2 мегабайта — это настоящее искусство: каждую гифку чистишь по палитре вручную.' },
        { author: 'MarIvanna_Fialki', date: '15.11.1998 16:05', text: 'И за мою страничку с узамбарскими фиалками спасибо! Вчера в гостевой книге отметились цветоводы из Самары и Минска.' }
      ],
      15: [
        { author: 'Moshkov_Reader', date: '13.11.1998 21:15', text: 'Ольга, подписался бы под каждым словом! Живу в райцентре на АТС 28.8K — библиотека Мошкова и «Переплёт» для нас единственное окно к новым книгам.' },
        { author: 'Scanner_Volunteer', date: '14.11.1998 10:50', text: 'Вчера до двух ночи вычитывал в Блокноте отсканированный номер «Нового мира». Приятно знать, что этот труд нужен тысячам читателей.' }
      ],
      16: [
        { author: 'Courier_Owner', date: '11.11.1998 18:30', text: 'Команда ATS10=50 на моей декадно-шаговой станции сотворила чудо: модем перестал рвать связь при каждом щелчке на кроссе!' },
        { author: 'Zyxel_Fan', date: '12.11.1998 09:45', text: 'На цифровой АТС в Коньково USRobotics Sportster 56K стабильно держит 48 000 бит/с по V.90. Главное — отключить параллельный телефон на кухне.' }
      ],
      17: [
        { author: 'GoldenFish_98', date: '09.11.1998 17:15', text: 'Озвучка Декарда Каина и приключений Сэма и Макса у «Фаргуса» — это эталон. А патч с их сайта вылечил мне вылет во втором городе.' },
        { author: 'Tushino_Regular', date: '10.11.1998 13:00', text: 'Смеялся до слёз про «Длинный меч ублюдка» — сам на прошлой неделе купил такой пиратский диск у метро, хорошо хоть обменяли на нормальный Фаргус.' }
      ],
      18: [
        { author: 'Baikonur_Vet', date: '20.11.1998 19:50', text: 'С успешным пуском «Зари»! Двадцать тонн вывели как по нитке. Пусть новая станция летает так же долго и надёжно, как наш «Мир».' },
        { author: 'Arecibo_Cruncher', date: '21.11.1998 11:20', text: 'Поставил клиент обработки радиопакетов на свой разогнанный Celeron 450 — один блок считает за семь часов. А вдруг именно наш компьютер поймает узкополосный сигнал?' }
      ],
      19: [
        { author: 'Samara_Modem', date: '07.11.1998 20:40', text: 'В WebCinema 98 калькулятор модема считает время секунда в секунду! Скачал ролик Prodigy и трейлер Half-Life — смотрю в ActiveMovie Player.' },
        { author: 'Polygon_3D_Viewer', date: '08.11.1998 14:15', text: 'То, что ребята из студии «ПОЛИГОН» сделали с клипами в честном 3D — просто фантастика, можно крутить камеру прямо во время припева.' }
      ],
      20: [
        { author: 'Point_2_5020', date: '05.11.1998 23:55', text: 'Истинная правда, Алексей! Никакой веб-чат не заменит утреннюю пачку писем в GoldED под чашку кофе. До встречи в RU.GAME и SU.HARDW.PC.CPU!' },
        { author: 'AshRoad_Ranger', date: '06.11.1998 15:20', text: 'А мы всей фидошной компанией после почтового обмена заходим на заставу Старый Брод в «Пепельном Тракте 98» — отличный гибрид старой школы и браузера.' }
      ]
    };

    return defaults[articleId] || [
      { author: 'Сетевой Читатель', date: '25.11.1998 10:30', text: 'Отличный материал! Выпуск Cyberspace Times как всегда читается от первой до последней полосы.' }
    ];
  }

  saveNewsComments(articleId, comments) {
    try {
      localStorage.setItem(`${this.newsCommentsKey}_${articleId}`, JSON.stringify(comments));
    } catch (e) {}
  }

  formatNewsArticleTxt(art) {
    const strip = (html) => String(html || '')
      .replace(/<\/h4>/gi, '\r\n\r\n')
      .replace(/<\/p>/gi, '\r\n\r\n')
      .replace(/<\/blockquote>/gi, '\r\n\r\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&laquo;/g, '«')
      .replace(/&raquo;/g, '»')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/[ \t]+\r?\n/g, '\r\n')
      .trim();

    return [
      '========================================================================',
      'CYBERSPACE TIMES ONLINE · http://www.retro-news98.com',
      'Выпуск № 48 (214) от 25 ноября 1998 года · Электронная газета Сети',
      '========================================================================',
      `Рубрика:   ${art.catLabel || 'Новости'} (${art.pageNum || 'Полоса ' + art.id})`,
      `Заголовок: ${art.title}`,
      art.subtitle ? `Подзагол.: ${art.subtitle}` : '',
      `Автор:     ${art.author} · ${art.dateline || 'МОСКВА'} · ${art.date}`,
      art.keyFact ? `Факт:      ${art.keyFact}` : '',
      art.themeNote ? `Тема:      ${art.themeNote}` : '',
      art.motif ? `Деталь:    ${art.motif}` : '',
      '------------------------------------------------------------------------',
      art.snippet,
      '',
      strip(art.body),
      '------------------------------------------------------------------------',
      'Редакция: Ольга Лаптева (editor@retro-news98.com) · Мясницкая, 24',
      '========================================================================'
    ].filter(Boolean).join('\r\n');
  }

  renderNews(url = '') {
    const articles = this.getNewsArticles();
    const categories = this.getNewsCategories();
    const axes = this.getNewsThemeAxes();
    const world = this.getNewsWorldData();
    const cleanUrl = (url || '').toLowerCase();

    const idMatch = /article\?id=(\d+)/.exec(cleanUrl);
    this.activeNewsArticleId = idMatch ? parseInt(idMatch[1], 10) : null;

    const catMatch = /[?&]cat=([a-z0-9_-]+)/.exec(cleanUrl);
    if (catMatch && categories.some(c => c.id === catMatch[1])) {
      this.newsCategoryFilter = catMatch[1];
    } else if (!this.newsCategoryFilter || !categories.some(c => c.id === this.newsCategoryFilter)) {
      this.newsCategoryFilter = 'all';
    }

    const qMatch = /[?&]q=([^&#]+)/.exec(url || '');
    if (qMatch) {
      try {
        this.newsSearchQuery = decodeURIComponent(qMatch[1].replace(/\+/g, ' ')).trim();
      } catch (e) {}
    }

    const activeCatObj = categories.find(c => c.id === this.newsCategoryFilter) || categories[0];
    const activeAxis = axes.find(a => a.id === this.newsActiveThemeAxis) || axes[0];

    const masthead = `
      <div class="news98-newspaper-header">
        <div class="news98-kicker-bar">ЕЖЕДНЕВНОЕ СЕТЕВОЕ ИЗДАНИЕ &middot; ОСНОВАНО В 1996 ГОДУ &middot; МОСКВА &mdash; РЕДМОНД &mdash; СИЭТЛ &mdash; КИЕВ</div>
        <div class="news98-masthead"><a href="#" data-news-home="1" class="news98-masthead-link">Cyberspace Times</a></div>
        <div class="news98-submasthead">Главное информационное агентство и ежедневная газета Всемирной Паутины &middot; Читайте онлайн и в Блокноте без повремёнки</div>
        <table class="news98-edition-row" cellspacing="0">
          <tr>
            <td><b>${world.issueDate}</b> &middot; ${world.issueNo} &middot; В номере: <b>${articles.length} статей</b></td>
            <td class="news98-center">ЦБ РФ: <b>$1 = 20,80 р.</b> &middot; У.Е. (Савёловский): <b>21,40 р.</b> &middot; ММВБ: <b>17,88</b></td>
            <td class="news98-right">Москва: -2&deg;C, снег &middot; Пул V.90: 46&nbsp;666 бит/с</td>
          </tr>
        </table>
      </div>`;

    const art = this.activeNewsArticleId ? articles.find(a => a.id === this.activeNewsArticleId) : null;
    if (art) {
      const comments = this.getNewsComments(art.id);
      const artIdx = articles.findIndex(a => a.id === art.id);
      const prevArt = artIdx > 0 ? articles[artIdx - 1] : articles[articles.length - 1];
      const nextArt = artIdx < articles.length - 1 ? articles[artIdx + 1] : articles[0];
      const relatedArts = articles.filter(a => a.id !== art.id && a.cat === art.cat).slice(0, 3);

      return `
        <div class="news98-container">
          <div class="news98-page">
            ${masthead}
            <div class="news98-breadcrumb-bar">
              <a href="#" id="btn-news-back">&laquo; На первую полосу (все ${articles.length} статей)</a>
              &nbsp;|&nbsp; Рубрика: <a href="#" data-news-cat="${art.cat}"><b>${art.catLabel}</b></a>
              &nbsp;|&nbsp; <span>${art.pageNum}</span>
            </div>
            <div class="news98-article">
              <div class="news98-article-rubric-tag">${art.catLabel.toUpperCase()} &middot; ${art.dateline || 'МОСКВА'}</div>
              <h1 class="news98-article-title">${art.title}</h1>
              ${art.subtitle ? `<div class="news98-article-subtitle">${art.subtitle}</div>` : ''}
              <p class="news98-byline">Автор: <b>${art.author}</b> &middot; ${art.date} &middot; Файл архива: <tt>${art.file}</tt></p>
              <p class="news98-lede">${art.snippet}</p>

              <table class="news98-article-dossier" cellspacing="0">
                <tr>
                  <th>Факты и цифры</th>
                  <td>${art.keyFact}</td>
                </tr>
                <tr>
                  <th>Конфликт темы</th>
                  <td>${art.themeNote}</td>
                </tr>
                <tr>
                  <th>Деталь эпохи</th>
                  <td>${art.motif}</td>
                </tr>
              </table>

              <div class="news98-article-body">${art.body}</div>

              <div class="news98-article-tools">
                <button class="win-btn" id="btn-news-save-txt" type="button">${this.gif('disk')} Сохранить статью в «Мои документы» (${art.file})</button>
                <button class="win-btn" id="btn-news-open-notepad" type="button">Открыть в Блокноте</button>
                <span id="news-save-status" class="news98-save-status"></span>
              </div>

              <table class="news98-article-prevnext" cellspacing="0">
                <tr>
                  <td class="news98-prev-cell">&laquo; Предыдущая полоса:<br><a data-article-id="${prevArt.id}">${prevArt.title}</a></td>
                  <td class="news98-next-cell">Следующая полоса: &raquo;<br><a data-article-id="${nextArt.id}">${nextArt.title}</a></td>
                </tr>
              </table>

              ${relatedArts.length ? `
              <div class="news98-related-box">
                <div class="news98-related-title">Ещё в рубрике «${art.catLabel}»:</div>
                <ul class="news98-also-list">
                  ${relatedArts.map(r => `<li><a data-article-id="${r.id}">${r.title}</a> <span class="news98-side-date">(${r.date})</span></li>`).join('')}
                </ul>
              </div>` : ''}

              <h3 class="news98-comments-title">Отклики читателей (${comments.length})</h3>
              <div class="news98-comments-list">
                ${comments.map(c => `
                <div class="news98-comment-item">
                  <div class="news98-comment-meta">${this.gif('user')} <b>${this.escapeHtml(c.author)}</b>, ${c.date}</div>
                  <div>${this.escapeHtml(c.text)}</div>
                </div>`).join('')}
              </div>
              <div class="news98-comments-box">
                <b>Написать отклик в редакцию</b><br>
                Имя: <input type="text" id="news-comment-author" value="Читатель '98" size="24"><br>
                <textarea id="news-comment-text" rows="4" cols="60"></textarea><br>
                <button class="win-btn" id="btn-news-comment-submit">Отправить</button>
              </div>
              <p class="news98-see-also">Связанные узлы Паутины: <a data-url="http://www.steampowered.com">Steam</a> | <a data-url="http://www.ferrum98.ru">Железный Цех '98</a> | <a data-url="http://forum.games98.com">Форум GamerZone</a> | <a data-url="http://www.mp3vault98.com">MP3 Vault '98</a> | <a data-url="http://www.rambler98.ru">Рамблер '98</a></p>
            </div>
            <div class="news98-footer">&copy; 1998 Cyberspace Times Online. Перепечатка только со ссылкой на источник. Письма в редакцию: ${this.mailLink('editor@retro-news98.com')}</div>
          </div>
        </div>
      `;
    }

    const lead = articles[0];
    const subLeads = [articles[8], articles[4], articles[9]];
    const rest = articles.slice(1);

    const qNorm = (this.newsSearchQuery || '').trim().toLowerCase();
    const filteredArticles = articles.filter(a => {
      const catOk = this.newsCategoryFilter === 'all' || a.cat === this.newsCategoryFilter;
      if (!catOk) return false;
      if (!qNorm) return true;
      const hay = `${a.title} ${a.subtitle || ''} ${a.snippet} ${a.author} ${a.catLabel} ${a.keyFact || ''} ${a.dateline || ''}`.toLowerCase();
      return hay.includes(qNorm);
    });

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
          <marquee class="news98-ticker" scrollamount="4">МОЛНИЯ: Завтра 26 ноября &mdash; дата активации вируса Win95.CIH v1.4 (проверьте джампер JP1 на плате) &nbsp;&bull;&nbsp; Valve выпустила Half-Life и открыла доставку игр в Steam &nbsp;&bull;&nbsp; COMDEX Fall '98: 3dfx покупает заводы STB за $141 млн и показывает Voodoo3 &nbsp;&bull;&nbsp; Celeron 300A берёт 450 МГц по шине 100 МГц &nbsp;&bull;&nbsp; Суд в Сан-Хосе отклонил иск RIAA против MP3-плеера Diamond Rio &nbsp;&bull;&nbsp; С Байконура выведен на орбиту первый модуль МКС «Заря»</marquee>

          <div class="news98-rubric-strip">
            ${categories.map(c => {
              const count = c.id === 'all' ? articles.length : articles.filter(a => a.cat === c.id).length;
              const activeCls = this.newsCategoryFilter === c.id ? ' news98-rubric-pill-active' : '';
              return `<a href="#" class="news98-rubric-pill${activeCls}" data-news-cat="${c.id}">${c.label} (${count})</a>`;
            }).join(' ')}
          </div>

          <table class="news98-layout" cellspacing="0">
            <tr>
              <td class="news98-nav-col">
                <div class="news98-nav-head">Рубрики номера</div>
                ${categories.map(c => {
                  const count = c.id === 'all' ? articles.length : articles.filter(a => a.cat === c.id).length;
                  const isAct = this.newsCategoryFilter === c.id;
                  return `<a href="#" class="news98-nav-cat${isAct ? ' is-active' : ''}" data-news-cat="${c.id}">${isAct ? '&raquo; ' : ''}${c.label} <span class="news98-nav-count">(${count})</span></a>`;
                }).join('')}

                <div class="news98-nav-head news98-nav-head-spaced">Поиск по газете</div>
                <div class="news98-search-mini">
                  <input type="text" id="news-search-input" class="news98-search-input" value="${this.escapeHtml(this.newsSearchQuery)}" placeholder="Celeron, Steam, Y2K...">
                  <div class="news98-search-btns">
                    <button class="win-btn" id="btn-news-search" type="button">Найти</button>
                    <button class="win-btn" id="btn-news-search-reset" type="button">Сброс</button>
                  </div>
                </div>

                <div class="news98-nav-head news98-nav-head-spaced">Оглавление (20 полос)</div>
                <div class="news98-index-list">
                  ${articles.map(a => `<div class="news98-index-item"><span class="news98-index-num">П.${a.id}</span> <a data-article-id="${a.id}">${a.title}</a></div>`).join('')}
                </div>

                <div class="news98-nav-head news98-nav-head-spaced">Корпункты редакции</div>
                <div class="news98-bureaus-list">
                  ${world.bureaus.map(([place, desc]) => `<div class="news98-bureau-item"><b>${place}</b><br>${desc}</div>`).join('')}
                </div>

                <div class="news98-nav-note">
                  <b>Редакция:</b><br>
                  Выпускающий редактор:<br>
                  <b>Ольга Лаптева</b><br>
                  Письма и наводки:<br>
                  ${this.mailLink('editor@retro-news98.com')}<br>
                  FidoNet: 2:5020/98
                </div>
              </td>

              <td class="news98-main-col">
                <div class="news98-lead-card">
                  <div class="news98-lead-kicker">${lead.pageNum.toUpperCase()} &middot; ${lead.catLabel.toUpperCase()} &middot; ${lead.dateline}</div>
                  <a class="news98-lead-headline" data-article-id="${lead.id}">${lead.title}</a>
                  <div class="news98-lead-subtitle">${lead.subtitle}</div>
                  <p class="news98-byline">${lead.author} &middot; ${lead.date} &middot; Откликов: ${this.getNewsComments(lead.id).length}</p>
                  <p class="news98-snippet">${lead.snippet} <a data-article-id="${lead.id}"><b>Полный текст репортажа &raquo;</b></a></p>
                  <div class="news98-lead-fact"><b>Главный факт:</b> ${lead.keyFact}</div>
                </div>

                <div class="news98-section-banner">ГЛАВНЫЕ РЕПОРТАЖИ ПЕРВОЙ ПОЛОСЫ</div>
                <table class="news98-subleads-grid" cellspacing="0">
                  <tr>
                    ${subLeads.map(sub => `
                    <td class="news98-sublead-cell">
                      <div class="news98-sublead-rubric">${sub.catLabel} &middot; П.${sub.id}</div>
                      <a class="news98-sublead-title" data-article-id="${sub.id}">${sub.title}</a>
                      <div class="news98-byline">${sub.author} &middot; ${sub.date}</div>
                      <div class="news98-sublead-text">${sub.snippet}</div>
                      <div class="news98-sublead-more"><a data-article-id="${sub.id}">Читать полосу П.${sub.id} &raquo;</a></div>
                    </td>`).join('')}
                  </tr>
                </table>

                <div class="news98-theme-box">
                  <div class="news98-theme-header">ТЕМАТИЧЕСКИЙ РАЗВОРОТ НОМЕРА: ЧЕТЫРЕ РАЗЛОМА ЦИФРОВОГО 1998 ГОДА</div>
                  <div class="news98-theme-tabs">
                    ${axes.map(ax => `<button type="button" class="win-btn news98-axis-btn${ax.id === activeAxis.id ? ' is-active' : ''}" data-news-axis="${ax.id}">${ax.code}</button>`).join(' ')}
                  </div>
                  <div class="news98-theme-body">
                    <div class="news98-theme-title">${activeAxis.title}</div>
                    <p><b>Тезис (Premise):</b> ${activeAxis.premise}</p>
                    <p><b>Контртезис (Counter-Premise):</b> ${activeAxis.counterPremise}</p>
                    <p><b>Сквозной мотив эпохи:</b> <i>${activeAxis.motif}</i></p>
                    <div class="news98-theme-links">
                      <b>Статьи разворота:</b>
                      ${activeAxis.articleIds.map(id => {
                        const target = articles.find(x => x.id === id);
                        return target ? `<a data-article-id="${target.id}">[П.${target.id}] ${target.title}</a>` : '';
                      }).join(' &bull; ')}
                    </div>
                  </div>
                </div>

                <div class="news98-section-banner">
                  ${this.newsCategoryFilter === 'all' && !qNorm
                    ? `ПОЛНАЯ СВОДКА МАТЕРИАЛОВ ВЫПУСКА № 48 (ВСЕ ${articles.length} СТАТЕЙ НА ПЕРВОЙ ПОЛОСЕ)`
                    : `ПОДБОРКА СТАТЕЙ: ${activeCatObj.label.toUpperCase()}${qNorm ? ` &middot; ЗАПРОС «${this.escapeHtml(this.newsSearchQuery)}»` : ''} (НАЙДЕНО: ${filteredArticles.length})`}
                </div>

                ${filteredArticles.length === 0 ? `
                  <div class="news98-empty-filter">
                    По вашему запросу статей не найдено. <a href="#" data-news-cat="all" id="btn-news-clear-inline">Показать все ${articles.length} статей номера &raquo;</a>
                  </div>
                ` : `
                  <div class="news98-front-stream">
                    ${filteredArticles.map(a => {
                      const cCount = this.getNewsComments(a.id).length;
                      return `
                      <div class="news98-front-article">
                        <div class="news98-front-meta-top">
                          <span class="news98-front-badge">${a.catLabel}</span>
                          <span class="news98-front-pagenum">${a.pageNum}</span>
                          <span class="news98-front-dateline">${a.dateline || 'МОСКВА'} &middot; ${a.date}</span>
                        </div>
                        <a class="news98-front-headline" data-article-id="${a.id}">${a.title}</a>
                        ${a.subtitle ? `<div class="news98-front-subtitle">${a.subtitle}</div>` : ''}
                        <div class="news98-byline">Корреспондент: <b>${a.author}</b></div>
                        <p class="news98-snippet">${a.snippet}</p>
                        <div class="news98-front-fact"><b>Цифра и факт:</b> ${a.keyFact}</div>
                        <div class="news98-front-bottom">
                          <a class="news98-front-readmore" data-article-id="${a.id}">Полный текст статьи &raquo;</a>
                          <span class="news98-front-stat">Откликов: <b>${cCount}</b> &middot; Архив: <tt>${a.file}</tt></span>
                        </div>
                      </div>`;
                    }).join('')}
                  </div>
                `}

                <div class="news98-also">Также в выпуске (быстрый переход по рубрикам)</div>
                <ul class="news98-also-list">
                  <li><a data-article-id="5">Обзор Half-Life: почему Гордон Фримен и «Чёрная Меза» покорили мир без видеовставок</a></li>
                  <li><a data-article-id="9">Разгон Celeron 300A (Mendocino) до 450 МГц: феномен кэша L2 и контакта B21</a></li>
                  <li><a data-article-id="10">Экстренно к 26 ноября: вирус Win95.CIH («Чернобыль») и защита перемычкой JP1</a></li>
                  <li><a data-article-id="6">Война форматов в суде Сан-Хосе: ассоциация RIAA против карманного MP3-плеера Diamond Rio</a></li>
                  <li><a data-article-id="7">Проблема 2000 года (Y2K): стендовая проверка шести плат и регистра столетия 32h в CMOS</a></li>
                  <li><a data-article-id="8">Рунет после августовского дефолта: почему трафик Рамблера, Яndex и Кроватки удвоился</a></li>
                  <li><a data-article-id="11">Антимонопольный процесс в Вашингтоне: Минюст США и Netscape против ядра Win 98</a></li>
                  <li><a data-article-id="18">Космос и распределённые вычисления: старт модуля МКС «Заря» на Байконуре и SETI@home</a></li>
                </ul>
              </td>

              <td class="news98-side-col">
                <div class="news98-editor-box">
                  <div class="news98-side-head">Слово редактора</div>
                  <div class="news98-editor-title">${world.editorNote.title}</div>
                  <div class="news98-editor-text">${world.editorNote.text}</div>
                  <div class="news98-editor-sig">&mdash; ${world.editorNote.author}</div>
                </div>

                <div class="news98-market-box">
                  <div class="news98-side-head">Индекс цен (25.11.1998)</div>
                  <table class="news98-market-table" cellspacing="0">
                    ${world.marketIndex.map(([item, val, sub]) => `
                    <tr>
                      <td><b>${item}</b><div class="news98-market-sub">${sub}</div></td>
                      <td class="news98-market-val">${val}</td>
                    </tr>`).join('')}
                  </table>
                </div>

                <div class="news98-side-head">Лента событий</div>
                ${rest.map(a => `
                <div class="news98-side-item">
                  <a class="news98-side-title" data-article-id="${a.id}">${a.title}</a>
                  <div class="news98-side-date">${a.catLabel} &middot; ${a.date}</div>
                </div>`).join('')}

                ${pollHTML}

                <div class="news98-letters-box">
                  <div class="news98-side-head">Письма в номер</div>
                  ${world.letters.map(l => `
                  <div class="news98-letter-item">
                    <div class="news98-letter-from">${l.from}:</div>
                    <div class="news98-letter-text">&laquo;${l.text}&raquo;</div>
                  </div>`).join('')}
                  <div class="news98-letter-cta">Написать в номер: ${this.mailLink('editor@retro-news98.com')}</div>
                </div>
              </td>
            </tr>
          </table>
          <div class="news98-footer">&copy; 1998 Cyberspace Times Online (${world.issueNo}, ${world.deadline}). Перепечатка только со ссылкой на источник. Письма в редакцию: ${this.mailLink('editor@retro-news98.com')}</div>
        </div>
      </div>
    `;
  }

  attachNewsEvents(win, container) {
    const btnBack = container.querySelector('#btn-news-back');
    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.soundSys) window.soundSys.playClick();
        this.navigate(win, 'http://www.retro-news98.com');
      });
    }

    container.querySelectorAll('[data-news-home]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.newsCategoryFilter = 'all';
        this.newsSearchQuery = '';
        if (window.soundSys) window.soundSys.playClick();
        this.navigate(win, 'http://www.retro-news98.com');
      });
    });

    container.querySelectorAll('[data-news-cat]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = el.dataset.newsCat || 'all';
        this.newsCategoryFilter = cat;
        if (window.soundSys) window.soundSys.playClick();
        const targetUrl = cat === 'all' ? 'http://www.retro-news98.com' : `http://www.retro-news98.com/?cat=${cat}`;
        this.navigate(win, targetUrl);
      });
    });

    container.querySelectorAll('[data-news-axis]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.newsActiveThemeAxis = btn.dataset.newsAxis || 'autonomy';
        if (window.soundSys) window.soundSys.playClick();
        this.renderPage(win, this.currentUrl);
      });
    });

    const searchInput = container.querySelector('#news-search-input');
    const btnSearch = container.querySelector('#btn-news-search');
    const btnSearchReset = container.querySelector('#btn-news-search-reset');
    const runNewsSearch = () => {
      this.newsSearchQuery = searchInput ? searchInput.value.trim() : '';
      if (window.soundSys) window.soundSys.playClick();
      this.renderPage(win, this.currentUrl);
    };
    if (btnSearch) {
      btnSearch.addEventListener('click', runNewsSearch);
    }
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          runNewsSearch();
        }
      });
    }
    if (btnSearchReset) {
      btnSearchReset.addEventListener('click', () => {
        this.newsSearchQuery = '';
        this.newsCategoryFilter = 'all';
        if (window.soundSys) window.soundSys.playClick();
        this.navigate(win, 'http://www.retro-news98.com');
      });
    }

    container.querySelectorAll('[data-article-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.soundSys) window.soundSys.playClick();
        this.navigate(win, `http://www.retro-news98.com/article?id=${parseInt(el.dataset.articleId, 10)}`);
      });
    });

    const btnSaveTxt = container.querySelector('#btn-news-save-txt');
    const btnOpenNotepad = container.querySelector('#btn-news-open-notepad');
    const saveStatus = container.querySelector('#news-save-status');
    if ((btnSaveTxt || btnOpenNotepad) && this.activeNewsArticleId) {
      const art = this.getNewsArticles().find(a => a.id === this.activeNewsArticleId);
      if (art) {
        const txtContent = this.formatNewsArticleTxt(art);
        const fileName = art.file || `CYBERSPACE_TIMES_${art.id}.TXT`;
        if (btnSaveTxt) {
          btnSaveTxt.addEventListener('click', () => {
            if (window.vfs && typeof window.vfs.writeFile === 'function') {
              window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], fileName, txtContent);
            }
            if (window.soundSys) window.soundSys.playDing();
            if (saveStatus) {
              saveStatus.textContent = `Сохранено в C:\\My Documents\\${fileName}`;
            }
          });
        }
        if (btnOpenNotepad) {
          btnOpenNotepad.addEventListener('click', () => {
            if (window.vfs && typeof window.vfs.writeFile === 'function') {
              window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], fileName, txtContent);
            }
            if (window.soundSys) window.soundSys.playClick();
            if (window.appNotepad && typeof window.appNotepad.open === 'function') {
              window.appNotepad.open(fileName, txtContent, ['My Computer', 'C:', 'My Documents']);
            }
          });
        }
      }
    }

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
          <li><b>LucasQuest 98 Demo</b> &mdash; graphic SCUMM adventure quest! <a data-url="http://www.igromania.ru">[Demo on the Igromania CD]</a></li>
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
        ['http://www.ferrum98.ru', "Железный Цех '98", 'испытания железа, разгон и защита BIOS', 6420, 23800],
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
        ['http://www.ashroad98.ru', "Пепельный Тракт '98", 'браузерная MMO на таблицах', 7840, 31620],
        ['http://www.animatrix99.ru', "АниМатрица '99", 'японская анимация: клубный фонд, фансаб .SSA, доска обмена', 7480, 28940],
        ['http://www.kinomania98.ru', "Киномания '98", 'новости кино и КиноФорум', 6540, 22870],
        ['http://forum.games98.com', 'GamerZone Forum', 'форум геймеров', 4120, 19350],
        ['http://www.3dfx-zone.com', '3dfx Voodoo Zone', 'разгон железа', 2890, 9420]
      ] },
      { title: 'СМИ, музыка и безопасность', sites: [
        ['http://www.retro-news98.com', 'Cyberspace Times', 'ежедневные новости', 8770, 25100],
        ['http://www.muzzone98.ru', "МузЗона '98", 'новости групп, клипы MTV и чарты', 8120, 31900],
        ['http://www.carman99.ru', "Кар-Мэн '99 (Car-Man)", 'фан-клуб группы: альбомы, атлас песен, состав, MIDI', 7890, 31240],
        ['http://www.kish99.ru', "Король и Шут '99", 'питерский фан-узел: сказки, песенник, альбомы, MIDI', 6420, 27180],
        ['http://www.prodigy99.ru', "The Prodigy '99", 'рейв-бункер: антифейк Горбушки, сэмплы, Манежка, MIDI', 7210, 28640],
        ['http://www.svodka99.ru', "Сводка.ру '99", 'ежедневная интернет-газета конца 1999 г., лента депеш и курсы ЦБ', 10840, 44620],
        ['http://www.pereplet99.ru', "Переплёт '99", 'литературный альманах конца 1999 г., книги и журналы', 7740, 29860],
        ['http://www.zooportal98.ru', "ЗооПортал '98", 'портал о животных, заповедниках, аквариуме и питомцах', 7690, 29410],
        ['http://www.mp3vault98.com', 'MP3 Vault 98', 'архив MP3', 7650, 30480],
        ['http://www.xfiles98.ru', 'Истина где-то рядом', 'секретные досье и НЛО', 5720, 18900],
        ['http://www.webcinema98.com', "WebCinema '98", 'интернет-кинотеатр', 3340, 12090],
        ['http://www.avp.ru', 'Лаборатория Касперского (AVP 3.0)', 'официальный сервер AVP 3.0, базы DAILY.AVC и энциклопедия вирусов', 9140, 35420],
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
            [ <a data-url="http://www.mp3vault98.com">Новые треки</a> ] [ <a data-url="http://www.muzzone98.ru">МузЗона '98</a> ] [ <a data-url="http://skins.winamp.com">Скины Winamp</a> ] [ <a data-url="http://www.webcinema98.com">Клипы</a> ] [ <a data-url="http://chat.krovatka98.ru">Чат</a> ]
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
              <a data-url="http://www.avp.ru/store">Купить AVP 3.0</a>
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
      },
      {
        id: 7,
        date: '10 октября 1998',
        score: 163,
        text: 'Бухгалтерша звонит системному администратору:\n— Коленька, я тут отчёт за третий квартал в «Корзину» положила, чтобы никто чужой не подсмотрел, а уборщица тётя Зина пришла, мышку тронула и говорит, что мусор вынесла! Где теперь мой баланс искать — на свалке или в налоговой?!'
      },
      {
        id: 8,
        date: '07 октября 1998',
        score: 131,
        text: 'Сисадмин приходит к окулисту. Врач усаживает его перед таблицей и показывает указкой на нижнюю строчку:\n— Читайте!\n— Доктор, вы что, издеваетесь? У вас тут кодировка слетела — сплошные «кракозябры» в КОИ-8, переключите таблицу на кириллицу Win-1251!'
      },
      {
        id: 9,
        date: '03 октября 1998',
        score: 194,
        text: 'Два оверклокера стоят на Митинском радиорынке у палатки с процессорами:\n— Слышь, я вчера свой Celeron 300A разогнал по шине до 450 мегагерц, а сверху прикрутил вентилятор от советского пылесоса «Тайфун»!\n— Ну и как, Quake II не тормозит?\n— Quake летает, только системник по паркету ездит и кота в корпус засасывает!'
      },
      {
        id: 10,
        date: '29 сентября 1998',
        score: 178,
        text: 'Жена будит программиста посреди ночи:\n— Дорогой, вставай скорее, в квартире воры!\nПрограммист, не открывая глаз:\n— Пусть берут что хотят, у меня на жёстком диске всё запаролено, а важные исходники на трёх дискетах в морозилке под пельменями лежат.'
      },
      {
        id: 11,
        date: '25 сентября 1998',
        score: 210,
        text: 'Обменный пункт валюты в сентябре 1998 года. На электронном табло курс доллара меняется каждую минуту: 12... 15... 18... 21...\nПодходит мужик в очках, долго смотрит на мелькающие цифры и спрашивает кассиршу:\n— Девушка, простите, это у вас курс рубля или тахометр?'
      },
      {
        id: 12,
        date: '21 сентября 1998',
        score: 147,
        text: 'Новый русский приводит сына в первый класс элитной гимназии. Учительница спрашивает мальчика:\n— Скажи, деточка, до скольки ты умеешь считать?\n— До шестисот!\n— Какой умница! А почему именно до шестисот?\n— А папа сказал, что «Мерседесов» больше шестисотого в природе ещё не выпустили!'
      },
      {
        id: 13,
        date: '17 сентября 1998',
        score: 169,
        text: 'Штирлиц всю ночь качал из интернета секретный план операции «Валькирия». На девяносто девятом проценте радистка Кэт на кухне сняла трубку параллельного телефона, чтобы заказать пиццу.\n«Связь с Центром оборвалась», — подумал Штирлиц и запустил в Кэт модемом US Robotics Courier.'
      },
      {
        id: 14,
        date: '13 сентября 1998',
        score: 115,
        text: 'Звонок на пейджинговую станцию «Вессо-Линк»:\n— Девушка, передайте для абонента 48-512 сообщение: «Вован, срочно перезвони Коляну, дело на миллион баксов!»\n— Диктуйте ваш обратный телефон.\n— Зачем телефон? Вы ему прямо на пейджер моё лицо пришлите, он меня в натуре узнает!'
      },
      {
        id: 15,
        date: '09 сентября 1998',
        score: 188,
        text: 'Разговаривают две подруги в бухгалтерии:\n— Представляешь, наш сисадмин вчера наконец-то на меня внимание обратил! Весь вечер глаз не сводил и вздыхал!\n— Да ты что! А чего ты сегодня такая грустная?\n— Оказалось, я просто сидела перед плакатом с Ларой Крофт и загораживала таблицу маршрутизации.'
      },
      {
        id: 16,
        date: '05 сентября 1998',
        score: 156,
        text: 'Молодой программист впервые привёл девушку к себе в холостяцкую комнату. Она садится на край дивана и кокетливо говорит:\n— Знаешь, мне у тебя как-то неловко... Давай выключим свет?\n— Ты что, с ума сошла?! У меня компиляция ядра идёт, а бесперебойник аккумулятор не держит!'
      },
      {
        id: 17,
        date: '01 сентября 1998',
        score: 204,
        text: 'Первое сентября в школе. Учительница говорит:\n— Дети, напишите сочинение на тему «Как я провёл лето». Только, пожалуйста, Вовочка, пиши своими словами, без компьютерных терминов!\nЧерез сорок минут Вовочка сдаёт тетрадку:\n«Лето прошло в штатном режиме на даче у бабушки. Загар не сохранился из-за сбоя погоды в августе, клубнику скачал с грядки вручную, а соседского пса Шарика пришлось временно заархивировать в будке».'
      },
      {
        id: 18,
        date: '27 августа 1998',
        score: 235,
        text: 'После 17 августа 1998 года встречаются два банкира на Тверской:\n— Ну как ты, старик? Говорят, после обвала ГКО совсем плохо спишь?\n— Наоборот, сплю как младенец!\n— Это как?!\n— Просыпаюсь каждый час, плачу и писаюсь!'
      },
      {
        id: 19,
        date: '23 августа 1998',
        score: 142,
        text: 'В компьютерный магазин приходит взволнованный покупатель:\n— Я вчера у вас купил диск с Win 98, начал ставить, а компьютер пишет: «Вставьте диск номер два»! Вы мне второй диск не доложили!\nПродавец вздыхает:\n— Мужчина, он просит вставить загрузочную дискету, а не заталкивать два компакт-диска в один лоток с ноги!'
      },
      {
        id: 20,
        date: '19 августа 1998',
        score: 173,
        text: 'Объявление в газете «Из рук в руки» в августе 1998 года:\n«Меняю однокомнатную квартиру в Бутово на картридж для струйного принтера Epson Stylus Color. Картридж должен быть заправлен после вторника. Посредникам с ГКО не беспокоить».'
      },
      {
        id: 21,
        date: '14 августа 1998',
        score: 129,
        text: 'Холмс и Ватсон сидят у камина на Бейкер-стрит. Внезапно Ватсон спрашивает:\n— Холмс, скажите, как вы догадались, что наш новый клиент — фидошник из Москвы?\n— Элементарно, Ватсон! Когда я подал ему чашку овсянки, он сначала посмотрел в правый верхний угол тарелки, ища адрес узла, а вместо «спасибо» произнёс вслух «плюс один в карму и до связи после полуночи».'
      },
      {
        id: 22,
        date: '10 августа 1998',
        score: 161,
        text: 'Жена отправляет мужа-программиста в гастроном:\n— Купи палку колбасы. И посмотри: если будут яйца — возьми десяток.\nЧерез полчаса муж возвращается и выкладывает на стол десять палок сервелата.\n— Ты зачем столько колбасы набрал?!\n— Так яйца в магазине были!'
      },
      {
        id: 23,
        date: '05 августа 1998',
        score: 149,
        text: 'Врезается «Запорожец» на светофоре в шестисотый «Мерседес». Из «Мерседеса» выходят трое крепких ребят в малиновых пиджаках, открывают дверцу «Запорожца», а там сидит бледный студент и прижимает к груди жёсткий диск Quantum Fireball в антистатическом пакете.\nСтарший заглядывает в салон:\n— Ну чё, студент, квартиру продавать будем или дачу?\n— Братцы, не трясите меня, тут головок парковка не сработала — если бэд-блоки пойдут, меня научрук раньше вас закопает!'
      },
      {
        id: 24,
        date: '31 июля 1998',
        score: 182,
        text: 'Ночь в компьютерном клубе. Администратор зала кричит в прокуренный полумрак:\n— Так, пацаны, время три часа ночи! Кто за седьмой машиной в StarCraft зергами рашит — у тебя мама с ремнём на крыльце стоит!\nГолос из-за монитора:\n— Скажи ей, что я сейчас базу протоссов снесу и через пять минут выйду, у меня минералы кончаются!'
      },
      {
        id: 25,
        date: '26 июля 1998',
        score: 118,
        text: 'Секретарша жалуется начальнику отдела:\n— Пётр Сергеевич, уберите из моего компьютера эту нахальную Скрепку из Microslop Word 97!\n— Чем же она вам помешала, Леночка?\n— Я печатаю заявление на отпуск за свой счёт, а она стучит мне пальцем в стекло изнутри монитора и спрашивает: «Похоже, вы пишете деловое письмо! Не помочь ли вам составить резюме?»'
      },
      {
        id: 26,
        date: '21 июля 1998',
        score: 197,
        text: 'На рынке «Горбушка» покупатель разглядывает пиратский компакт-диск «Золотой софт \'98 — 250 лучших программ на одном CD»:\n— Скажите, а тут точно все двести пятьдесят программ рабочие?\nПродавец честно кивает:\n— Обижаешь, командир! Сто двадцать пять копий «Сапёра» и сто двадцать пять копий «Косынки», зато ни одна не виснет!'
      },
      {
        id: 27,
        date: '16 июля 1998',
        score: 136,
        text: 'Сидят в окопе Василий Иванович и Петька. Петька протирает рукавом экран трофейного ноутбука:\n— Василий Иванович, белые опять в локальной сети пароль на принтер сменили!\n— Ничего, Петька, тащи пулемёт «Максим» — сейчас мы им пакеты напрямую через ком-порт без всякого протокола отгрузим!'
      },
      {
        id: 28,
        date: '11 июля 1998',
        score: 164,
        text: 'Приходит блондинка в сервисный центр с клавиатурой под мышкой:\n— Молодой человек, у меня компьютер при включении пишет: «Keyboard not found. Press F1 to continue». Я нажимаю F1, а он не продолжает!\nМастер смотрит на оборванный провод:\n— Девушка, а зачем вы шнур ножницами отрезали?\n— Ну как зачем! Чтобы к вам через всю Москву системный блок в маршрутке не тащить!'
      },
      {
        id: 29,
        date: '06 июля 1998',
        score: 152,
        text: 'Два сисадмина пьют пиво в пятницу вечером. Один задумчиво смотрит на кружку:\n— Слушай, вчера познакомился с девушкой в чате «Кроватка». Написала, что параметры 90-60-90.\n— Ну и как на свидании?\n— Оказалось, это возраст, рост в сидячем положении и пинг до её провайдера в секундах!'
      },
      {
        id: 30,
        date: '01 июля 1998',
        score: 215,
        text: 'Чемпионат мира по футболу во Франции, лето 1998 года. Мужик возвращается домой навеселе и с порога поёт:\n— Какая боль, какая боль! Аргентина — Ямайка — пять-ноль!\nЖена со скалкой в руках:\n— Это ещё цветочки, дорогой! Мне только что счёт за твой ночной межгород до провайдера пришёл — вот там действительно пять нолей!'
      },
      {
        id: 31,
        date: '26 июня 1998',
        score: 189,
        text: 'Вышла в свет новая операционная система Microslop Win 98. Журналист спрашивает разработчика на пресс-конференции:\n— Скажите, а правда, что в Win 98 исправлены все старые ошибки Win 95?\n— Конечно правда! Мы бережно переписали их заново, добавили поддержку USB и перекрасили синий экран в более приятный для глаз оттенок морской волны!'
      },
      {
        id: 32,
        date: '20 июня 1998',
        score: 141,
        text: 'Поручик Ржевский стоит на балу у окна и сосредоточенно тычет пальцем в маленькую пластмассовую коробочку на цепочке. Подходит Наташа Ростова:\n— Поручик, что это у вас так жалобно пищит? Неужели модный японский Тамагочи?\n— Берите выше, мадемуазель! Это корнет Оболенский мне на пейджер телеграфирует, что в буфете шампанское без пароля раздают!'
      },
      {
        id: 33,
        date: '14 июня 1998',
        score: 124,
        text: 'Разговор в студенческом общежитии Бауманки перед экзаменом по сопромату:\n— Ты шпаргалки написал?\n— Зачем писать от руки, каменный век! Я лекции в Microslop Word четвёртым кеглем набрал и на матричном принтере распечатал!\n— Ну ты гений! И как, прочитал на экзамене?\n— Нет, лента в принтере старая была — профессор подумал, что это перфокарта от станка с ЧПУ, и поставил «четвёрку» за верность советской промышленности!'
      },
      {
        id: 34,
        date: '08 июня 1998',
        score: 176,
        text: 'Звонок в техподдержку провайдера «Ситилайн» в два часа ночи:\n— Алло! У меня интернет не работает! Модем пищит, шипит, крякает и кладёт трубку!\nДежурный инженер сонным голосом:\n— Поздравляю, вы дозвонились до домашнего телефона старшего смены, а шипел и крякал мой тесть, которого вы разбудили в третий раз за ночь!'
      },
      {
        id: 35,
        date: '02 июня 1998',
        score: 158,
        text: 'Чукча купил в Москве компьютер, привёз в чум, подключил к дизель-генератору и сидит перед монитором в солнечных очках и сварочной маске. Шаман заходит и спрашивает:\n— Однако, зачем маску надел?\n— Продавец на Савёловском сказал: без защитного экрана с проводом на батарею кактусы увянут и глаза в тундру вытекут, а батареи в чуме нет!'
      },
      {
        id: 36,
        date: '27 мая 1998',
        score: 133,
        text: 'Маленький сын программиста спрашивает папу:\n— Папа, а почему солнце каждое утро всходит на востоке и садится на западе?\nОтец отрывается от отладчика, внимательно смотрит в окно:\n— Точно каждый день работает?\n— Да!\n— И не зависает?\n— Нет!\n— Тогда ради бога ничего в небе руками не трогай и настройки не меняй!'
      },
      {
        id: 37,
        date: '21 мая 1998',
        score: 192,
        text: 'Новый русский приходит в туристическое агентство:\n— Слышь, сестрёнка, хочу отдохнуть конкретно, но так, чтобы ни одного нашего братка рядом не было, ни одного сотового телефона и никаких пейджеров!\nМенеджер листает каталог:\n— Могу предложить необитаемый остров в Тихом океане, но там совсем дикие условия...\n— Оформляй! Только факс туда проведите, чтобы пацаны знали, как я дико отдыхаю!'
      },
      {
        id: 38,
        date: '15 мая 1998',
        score: 145,
        text: 'На собеседовании в солидную фирму начальник отдела кадров спрашивает девушку:\n— В анкете указано, что ваша скорость печати — тысяча двести знаков в минуту. Это же мировой рекорд! Покажите на нашей клавиатуре!\nДевушка открывает блокнот, кладёт ладони на клавиши и три секунды подряд жмёт всё подряд:\n— Вот, пожалуйста! Правда, такая ерунда получается, что потом ни один спеллчекер не разберёт!'
      },
      {
        id: 39,
        date: '09 мая 1998',
        score: 168,
        text: 'Штирлиц зашёл в кабинет Мюллера и увидел, что группенфюрер яростно катает шарик от мышки по сукну стола и дует в корпус манипулятора.\n«Опять спирт для протирки роликов выпил без закуски», — смекнул Штирлиц.'
      },
      {
        id: 40,
        date: '03 мая 1998',
        score: 112,
        text: 'К сисадмину подходит главбухша с трёхдюймовой дискетой в руках:\n— Дима, у меня квартальный отчёт на одну дискету не влезает, пишет, что не хватает ста килобайт! Что делать?!\nСисадмин, не поднимая головы от паяльника:\n— Откройте текстовый редактор и удалите из отчёта пробелы, а числа округлите в пользу профсоюза.'
      },
      {
        id: 41,
        date: '27 апреля 1998',
        score: 184,
        text: 'Два геймера выходят на улицу из полуподвального компьютерного клуба после двенадцати часов игры в Quake II. Яркое весеннее солнце, поют птички, по тротуару идут прохожие.\nОдин щурится и толкает другого локтем:\n— Слышь, глянь, какая графика с ускорителем 3dfx Voodoo2! Освещение мягкое, текстуры чёткие!\n— Ага, только сюжет тупой и сохраниться перед перекрёстком нельзя!'
      },
      {
        id: 42,
        date: '21 апреля 1998',
        score: 151,
        text: 'Останавливает гаишник шестисотый «Мерседес» за превышение скорости. Водитель опускает тонированное стекло и протягивает стодолларовую купюру. Гаишник берёт её под козырёк:\n— Счастливого пути! Кстати, не подскажете, почему у вас на заднем стекле наклейка «Pentium II Inside»?\n— А это я вчера компьютерщика на переходе чуть не задел, так он от страха прямо в багажник через форточку запрыгнул!'
      },
      {
        id: 43,
        date: '15 апреля 1998',
        score: 139,
        text: 'Учительница географии вызывает к доске Вовочку:\n— Вовочка, покажи нам на карте мира, где находится Америка!\nВовочка подходит к глобусу, крутит его и уверенно тычет пальцем:\n— Вот здесь, Марья Ивановна! Оттуда к нам по ночам самые дешёвые звонки через IP-телефонию и свежие кряки с Альтависты приходят!'
      },
      {
        id: 44,
        date: '09 апреля 1998',
        score: 167,
        text: 'Жена жалуется маме по телефону:\n— Мама, мой муж совсем с этим Фидо рехнулся! Вчера за ужином попросил передать хлеб, я подала, а он мне говорит: «Спасибо, Клава, лови поинта!» А когда кот на ковёр нагадил, муж заявил, что кота надо отключить от эхоконференции за оффтопик в неположенном месте!'
      },
      {
        id: 45,
        date: '01 апреля 1998',
        score: 221,
        text: 'Первого апреля сисадмин сделал скриншот Рабочего стола у главного инженера, поставил эту картинку фоном, а все настоящие ярлыки спрятал в пустую папку.\nТри часа главный инженер тыкал мышкой в нарисованный «Мой компьютер», потом позвал сисадмина и гордо сказал:\n— Не трудись, сынок, я сам разобрался! Мышка замёрзла от сквозняка, я её уже на батарею отопления положил греться!'
      },
      {
        id: 46,
        date: '25 марта 1998',
        score: 127,
        text: 'Приходит программист в библиотеку имени Ленина, подходит к пожилой библиотекарше у картотеки и спрашивает:\n— Скажите, а где у вас тут строка поиска по ключевым словам?\n— Молодой человек, каталог по алфавиту в деревянных ящиках слева!\n— Ничего себе у вас файловая система... А сортировка по дате модификации только вручную с табуреткой?'
      },
      {
        id: 47,
        date: '19 марта 1998',
        score: 159,
        text: 'Новый русский звонит приятелю с мобильного телефона Motorola размером с кирпич:\n— Брателло, выручай! Купил жене японскую игрушку Тамагочи, а она в парикмахерскую уехала и мне оставила присматривать!\n— Ну и чё стряслось?\n— Да эта пиксельная зверюга за час три раза поела, два раза в туалет сходила, а теперь требует новую шубу и путёвку в Анталью — кажется, я перепутал и взял с тумбочки пейджер тёщи!'
      },
      {
        id: 48,
        date: '13 марта 1998',
        score: 144,
        text: 'Судят хакера за взлом банковского сервера через телефонную линию. Судья строго спрашивает:\n— Подсудимый, как вам удалось обойти тройную систему защиты западного банка?\n— Ваша честь, я вообще никуда не ломился! Я набирал номер своей девушки, а на нашей декадно-шаговой АТС после дождя замкнуло реле, и мой модем сам выписал мне премию в две тысячи условных единиц!'
      },
      {
        id: 49,
        date: '07 марта 1998',
        score: 175,
        text: 'Накануне Восьмого марта сотрудники проектного института собирают деньги на подарки женщинам. Начальник отдела говорит системному администратору:\n— Серёжа, ты у нас человек современный, подари нашим дамам из планового отдела что-нибудь из высоких технологий!\nВосьмого марта сисадмин торжественно вручает каждой сотруднице по новому коврику для мыши и открытку с надписью: «Пусть ваши окна в Win 95 никогда не закрываются по ошибке защиты!»'
      },
      {
        id: 50,
        date: '01 марта 1998',
        score: 132,
        text: 'Встречаются два приятеля в метро:\n— Привет! Как жизнь, где работаешь?\n— Да устроился тестером в компьютерную контору: целый день играю в «Сапёра» и «Косынку», проверяю устойчивость видеокарты!\n— Ух ты, работа мечты! А чего увольняться собрался?\n— Начальник зверь — требует, чтобы я к пятнице прошёл «Косынку» на время и сдал письменный отчёт по каждому тузу!'
      },
      {
        id: 51,
        date: '23 февраля 1998',
        score: 191,
        text: 'Военкомат. Призывная комиссия осматривает бледного сутулого паренька в очках с толстыми линзами. Военком листает личное дело:\n— Так, призывник Сидоров... В графе «военно-учётная специальность» вы написали: «Снайпер-разведчик с опытом зачистки подземных бункеров». Вы где стрельбе обучались — в ДОСААФ?\n— Никак нет, товарищ полковник! В Duke Nukem 3D и DOOM II на уровне сложности Nightmare, причём исключительно с клавиатуры без мышки!'
      },
      {
        id: 52,
        date: '16 февраля 1998',
        score: 148,
        text: 'Звонок в компьютерный сервис:\n— Алло, мастерская? У меня струйный принтер начал печатать все документы розовым цветом!\n— Наверное, в картридже закончились синие и жёлтые чернила.\n— Не выдумывайте! Это у него весеннее настроение после Дня святого Валентина, приезжайте и верните ему строгий бухгалтерский характер!'
      },
      {
        id: 53,
        date: '10 февраля 1998',
        score: 163,
        text: 'Шерлок Холмс раскуривает трубку и говорит доктору Ватсону:\n— Ватсон, вы сегодня всю ночь снова сидели в чате под женским ником «Белоснежка98»!\n— Помилуйте, Холмс, но откуда вы узнали?! Я же стёр историю браузера и выдернул телефонный шнур из розетки!\n— Дорогой Ватсон, во-первых, миссис Хадсон уже приняла три корзины роз от сисадмина из Ливерпуля, а во-вторых, вы за завтраком дважды подмигнули мне двоеточием и скобкой!'
      },
      {
        id: 54,
        date: '03 февраля 1998',
        score: 121,
        text: 'Молодая жена жалуется подруге:\n— Мой муж-программист даже во сне со мной как с компьютером разговаривает!\n— Это как?\n— Вчера обнял меня за плечо, погладил по голове и пробормотал: «Новое устройство обнаружено, поиск драйвера на диске С...»'
      },
      {
        id: 55,
        date: '27 января 1998',
        score: 186,
        text: 'В купе поезда «Москва — Владивосток» едут новый русский, старый бухгалтер и программист. Вдруг в вагоне мигает и гаснет свет.\nНовый русский достаёт сотовый:\n— Ща позвоню пацанам в РАО ЕЭС, они нам отдельную ветку протянут!\nБухгалтер вздыхает:\n— Это проводник лимит электроэнергии за квартал перерасходовал...\nПрограммист выглядывает в коридор:\n— Спокойно, мужики! Сейчас машинист выйдет из поезда, снова зайдёт, и всё само заработает!'
      },
      {
        id: 56,
        date: '20 января 1998',
        score: 153,
        text: 'Покупатель на радиорынке спрашивает продавца у лотка с комплектующими:\n— Мне нужна звуковая карта Sound Blaster AWE64, но чтобы соседи по лестничной клетке сразу поняли, сколько я за неё отвалил!\n— Тогда берите к ней вот эти китайские колонки с надписью «PMPO 1200 Watt»!\n— А они реально выдают киловатт с лишним?\n— Если включить в розетку на 380 вольт — выдадут один раз, но со спецэффектами и вызовом пожарных!'
      },
      {
        id: 57,
        date: '13 января 1998',
        score: 170,
        text: 'Старый Новый год в вычислительном центре НИИ. На столе стоят советское шампанское, банка шпрот и монитор, вокруг которого мигает ёлочная гирлянда.\nМолодой стажёр спрашивает седого начальника лаборатории:\n— Илья Моисеевич, а почему мы празднуем Новый год дважды — первого и тринадцатого января?\n— Видишь ли, юноша, тринадцатого числа мы устанавливаем сервисный пакет обновлений на тот Новый год, который криво встал первого!'
      },
      {
        id: 58,
        date: '06 января 1998',
        score: 138,
        text: 'Приходит мужик к врачу-психиатру:\n— Доктор, помогите! Мне каждую ночь снится, что я — архиватор RAR, и ко мне в очередь выстраиваются жирные файлы в формате BMP, а я их трамбую в четырнадцать дискет!\nДоктор поправляет очки:\n— Случай тяжёлый, батенька, но поправимый. Только сначала свернитесь на кушетке поплотнее, а то у меня в кабинете свободного места меньше мегабайта осталось!'
      },
      {
        id: 59,
        date: '29 декабря 1997',
        score: 195,
        text: 'Предновогоднее совещание в банке. Председатель правления спрашивает начальника компьютерного отдела:\n— Скажите, а что это за пресловутая «Проблема 2000 года», о которой пишут все газеты? Неужели первого января двухтысячного года все наши компьютеры остановятся?!\nНачальник отдела пожимает плечами:\n— Пётр Петрович, не переживайте: с нашей бухгалтерией и Win 95 они у нас каждый вторник думают, что наступил тысяча девятьсот нулевой год, и ничего — перезагружаем скрепкой!'
      },
      {
        id: 60,
        date: '22 декабря 1997',
        score: 142,
        text: 'Штирлиц сидел перед монитором и в десятый раз подряд раскладывал пасьянс «Косынка». В дверь постучал Борман:\n— Штирлиц, фюрер требует срочную шифровку с Восточного фронта!\n— Пусть подождёт пять минут, — отмахнулся Штирлиц. — У меня бубновый король под трефовой дамой застрял, вся агентурная сеть под угрозой!'
      },
      {
        id: 61,
        date: '15 декабря 1997',
        score: 166,
        text: 'Звонок в техподдержку:\n— Девушка, я купил модем, подключил к телефонной розетке, а как теперь попасть во Всемирную Паутину?\n— Откройте программу «Удалённый доступ к сети» в Win 95 и введите логин и пароль с карточки провайдера.\n— Подождите, а если я карточку монетой слишком сильно потёр и стёр три цифры пароля вместе с картоном — меня в интернет по паспорту не пустят?!'
      },
      {
        id: 62,
        date: '08 декабря 1997',
        score: 119,
        text: 'Урок информатики в районной школе. Учитель строго говорит классу:\n— Запомните главное правило работы в компьютерном классе: без бахил не входить, руками монитор не трогать, на дискеты не дышать!\nГолос с задней парты:\n— Пётр Иваныч, а включать компьютеры сегодня будем?\n— Вы сначала мышку тряпочкой протрите, а включать будем в третьей четверти, когда завуч ключ от щитка найдёт!'
      },
      {
        id: 63,
        date: '01 декабря 1997',
        score: 177,
        text: 'Секретарша приносит сисадмину трёхдюймовую дискету, аккуратно подшитую в папку «Дело № 4» при помощи канцелярского дырокола:\n— Вот, я сохранила резервную копию приказов за ноябрь и подшила в архив, как вы просили!\nСисадмин хватается за сердце:\n— Света!! Вы же её дыроколом насквозь пробили!!\n— Не кричите, я специально сбоку пробивала, где буквы на этикетке не написаны!'
      },
      {
        id: 64,
        date: '24 ноября 1997',
        score: 154,
        text: 'Новый русский заходит в антикварный салон на Арбате:\n— Слышь, шеф, мне корешу на юбилей нужен солидный подарок. Компьютеры он не уважает, говорит — бездушная пластмасса!\nАнтиквар выносит деревянные конторские счёты девятнадцатого века из карельской берёзы:\n— Вот, ручная сборка, костяшки слоновой кости!\n— Беру! Только вы мне сюда жидкокристаллический экранчик врежьте и игру «Тетрис» закачайте, чтобы пацан в пробке не скучал!'
      },
      {
        id: 65,
        date: '17 ноября 1997',
        score: 183,
        text: 'Разговаривают два программиста в курилке:\n— Представляешь, вчера жена устроила скандал: говорит, ты любишь свой компьютер больше, чем меня!\n— Ну и как ты выкрутился?\n— Сказал ей чистую правду: «Дорогая, зато у тебя интерфейс интуитивно понятный, а материнскую плату я вообще тёщей называю!»'
      },
      {
        id: 66,
        date: '10 ноября 1997',
        score: 131,
        text: 'Поздний вечер. Студент звонит однокурснику по городскому телефону:\n— Серёга, ты курсовик по базам данных сделал? Скинь мне по модему!\n— Не могу, батя телефонный провод в коридоре на ночь в сейф запирает, чтобы я в Фидо не лазил!\n— Ну тогда продиктуй мне архив голосом в шестнадцатеричном коде, у меня до зачёта восемь часов осталось!'
      },
      {
        id: 67,
        date: '02 ноября 1997',
        score: 162,
        text: 'К врачу-невропатологу заходит измождённый мужчина с дёргающимся правым веком и двумя указательными пальцами, которые непрерывно постукивают по воздуху.\n— Голубчик, что это с вами?! Вы телеграфист?\n— Хуже, доктор... Я вчера в Diablo на пятнадцатом уровне подземелья меч с вампиризмом выбил, а у меня мышка заедала, пришлось три тысячи скелетов двойным кликом закликивать!'
      },
      {
        id: 68,
        date: '25 октября 1997',
        score: 147,
        text: 'На таможне проверяют багаж челнока, прилетевшего из Сингапура с четырьмя клетчатыми баулами материнских плат и видеокарт.\nТаможенник открывает сумку:\n— Гражданин, зачем вам восемьдесят одинаковых микросхем? На продажу везёте?\n— Да вы что, начальник! Это для личного пользования — у меня дома котёнок любит по клавиатуре бегать, так компьютер от шерсти каждую пятницу апгрейда просит!'
      },
      {
        id: 69,
        date: '18 октября 1997',
        score: 190,
        text: 'Вовочка приходит из школы и торжественно объявляет родителям:\n— Папа, мама, сегодня на родительское собрание можете не ходить!\n— Это ещё почему?\n— А я в учительской на компьютере завуча в файле с оценками нашёл функцию «Автозамена» и поменял все свои двойки на пятёрки, а фамилию директора — на «Покемон»!'
      },
      {
        id: 70,
        date: '10 октября 1997',
        score: 125,
        text: 'Звонок в службу поддержки Microslop:\n— Алло! У меня Win 95 написал на экране: «Программа выполнила недопустимую операцию и будет закрыта». Скажите, кого теперь посадят — меня или программиста, и надо ли вызывать милицию?!'
      },
      {
        id: 71,
        date: '02 октября 1997',
        score: 158,
        text: 'Два сисадмина идут мимо зоопарка. Останавливаются у клетки с пингвинами. Один долго смотрит на птицу и вздыхает:\n— Смотри, стоит на льду, не виснет, перезагрузки не просит, память не жрёт...\n— Ага, только попробуй объяснить главбуху, куда этой птице дискету с «1С:Бухгалтерией» вставлять!'
      },
      {
        id: 72,
        date: '24 сентября 1997',
        score: 174,
        text: 'Новый русский пришёл в фотоателье печатать снимки с отдыха в Турции. Фотограф спрашивает:\n— Вам фотографии делать матовые или глянцевые?\n— Слышь, командир, ты мне сделай в формате JPEG с прогрессивной развёрткой, чтобы тёща, когда альбом открывает, первые полчаса только мою кепку и верх пальмы видела!'
      },
      {
        id: 73,
        date: '16 сентября 1997',
        score: 136,
        text: 'Василий Иванович спрашивает Петьку:\n— Петька, а что такое «виртуальная реальность», про которую Фурманов в газете вычитал?\n— Ну, смотри, Василий Иванович: вот если ты видишь перед собой четверть самогона, солёный огурец и шмат сала, а потрогать не можешь, потому что монитор стеклянный — это и есть виртуальная реальность!\n— Тьфу ты, Петька! Мы в девятнадцатом году такую реальность «витриной закрытого гастронома» называли!'
      },
      {
        id: 74,
        date: '08 сентября 1997',
        score: 169,
        text: 'Мать наставляет дочь перед свадьбой:\n— Доченька, никогда не выходи замуж за сисадмина!\n— Но почему, мама? Он ведь не пьёт, по кабакам не шляется, всегда на работе или дома за столом!\n— Вот именно! Когда у вас родится ребёнок, он три месяца будет искать к нему инструкцию на английском языке, а на четвёртый попытается перепрошить ему биос, чтобы не плакал по ночам!'
      },
      {
        id: 75,
        date: '30 августа 1997',
        score: 143,
        text: 'Офисный работник звонит в компьютерный отдел:\n— Ребята, срочно придите в триста пятый кабинет! У меня мышка сломалась — курсор только вверх и вправо ездит, а влево никак!\nПриходит техник, поднимает мышку, вытряхивает из-под шарика хлебные крошки, семечку и скрепку:\n— Вы бы ещё бутерброд с маслом внутрь положили!\n— А что, тогда бы она без коврика скользила?!'
      },
      {
        id: 76,
        date: '21 августа 1997',
        score: 181,
        text: 'Штирлиц шёл по ночному Берлину. В окне конспиративной квартиры на Цветочной улице горел синий экран монитора и стояло тридцать восемь горшков с кактусами.\n«Профессор Плейшнер так и не смог настроить драйвер видеокарты под Win 95 и защищается от радиации дедовским методом», — с грустью подумал Штирлиц.'
      },
      {
        id: 77,
        date: '12 августа 1997',
        score: 128,
        text: 'В книжном магазине на Новом Арбате покупатель спрашивает продавщицу:\n— Девушка, у вас есть книга «Win 95 для чайников»?\n— Закончилась, мужчина. Но могу предложить «Ассемблер и прерывания BIOS для самоваров» и валерьянку в аптеке за углом!'
      },
      {
        id: 78,
        date: '03 августа 1997',
        score: 165,
        text: 'На пляже в Сочи знакомятся парень и девушка:\n— Девушка, а можно с вами познакомиться? Меня Дима зовут!\n— А какой у вас номер ICQ?\n— У меня пока нет аськи, но есть домашний телефон и почтовый индекс!\n— Фи, молодой человек, о чём же мы с вами разговаривать будем — без статуса «В сети» и звука «О-оу!» даже романтики никакой нет!'
      },
      {
        id: 79,
        date: '25 июля 1997',
        score: 150,
        text: 'Программист заполняет анкету при обмене загранпаспорта. Чиновница в окошке проверяет бланк и возмущается:\n— Гражданин, почему в графе «Дети» вы написали: «Версия 1.0 (мальчик, 1994 г.) и Версия 1.1 исправленная (девочка, 1996 г.)»?!\n— Потому что первая версия ночью громко гудела кулером и требовала подгрузки молока каждые два часа!'
      },
      {
        id: 80,
        date: '15 июля 1997',
        score: 193,
        text: 'Сидит новый русский в ресторане, листает меню и подзывает официанта:\n— Слышь, шеф, принеси-ка мне салат «Оливье», шашлык из осетрины и сто грамм водки. А потом скопируй этот заказ в буфер обмена и вставляй на стол каждые полчаса, пока я кнопку «Esc» лицом в салат не нажму!'
      },
      {
        id: 81,
        date: '05 июля 1997',
        score: 134,
        text: 'Звонок на радиостанцию «Европа Плюс»:\n— Здравствуйте! Передайте, пожалуйста, привет моему парню Антону, который уже третьи сутки без перерыва пытается установить звуковую карту под DOS и подобрать прерывание IRQ 5 или IRQ 7! Поставьте для него песню без слов — всё равно у него колонки пока только трещат!'
      },
      {
        id: 82,
        date: '25 июня 1997',
        score: 172,
        text: 'К опытному хакеру приходит сосед по подъезду:\n— Слушай, ты ведь в компьютерах разбираешься? Помоги мне с кассеты VHS на дискету фильм со Шварценеггером переписать!\n— Ты чего, в полуторачасовом фильме гигабайт видео, а в дискете всего один и четыре десятых мегабайта!\n— Да ты не весь фильм пиши, ты только драки оставь, а разговоры сотри!'
      },
      {
        id: 83,
        date: '14 июня 1997',
        score: 146,
        text: 'Разговор двух бабушек на лавочке у подъезда:\n— Слыхала, Петровна, наш сосед из тридцать восьмой квартиры совсем сбесился! Всю ночь за железным ящиком сидит и ругается: «Опять память кончилась, надо докупить шестнадцать метров памяти!»\n— Ох, милая, в его-то двадцать лет уже склероз метрами меряют, а мы с тобой без всяких микросхем помним, почём колбаса при Хрущёве была!'
      },
      {
        id: 84,
        date: '01 июня 1997',
        score: 160,
        text: 'Поручик Ржевский возвращается под утро в гусарский полк с красными глазами. Корнет Оболенский спрашивает:\n— Поручик, вы снова всю ночь кутили у цыган?\n— Хуже, корнет! Господа офицеры показали мне две синие панели Norton Commander, и я до рассвета перекладывал полковые ведомости из левой половины экрана в правую и обратно — оторваться невозможно!'
      },
      {
        id: 85,
        date: '18 мая 1997',
        score: 187,
        text: 'Техподдержка крупного банка. Звонит кассирша из филиала:\n— Мальчики, у меня на экране выскочила табличка: «Нажмите любую клавишу для продолжения»! Я уже пятнадцать минут ищу клавишу «Любая» — тут есть только «Пробел», «Ввод» и какие-то английские буквы! Пришлите курьера с правильной клавиатурой!'
      },
      {
        id: 86,
        date: '01 мая 1997',
        score: 139,
        text: 'Первомайская демонстрация. Мимо трибуны проходят колонны трудящихся. Ведущий объявляет в мегафон:\n— А сейчас перед нами проходит колонна системных администраторов и программистов района!\nНа площадь выходит один заспанный человек в свитере с оленями и несёт транспарант: «Остальные сто двадцать человек присутствуют удалённо по протоколу Telnet!»'
      },
      {
        id: 87,
        date: '12 апреля 1997',
        score: 164,
        text: 'В День космонавтики в Центре управления полётами журналист спрашивает главного конструктора:\n— Скажите, а почему на орбитальной станции «Мир» бортовой компьютер работает на процессоре 386, а не на новейшем Pentium под управлением Win 95?\nКонструктор протирает очки:\n— Понимаете, молодой человек, если в открытом космосе при стыковке выскочит окошко «Обнаружено новое устройство: грузовой корабль Прогресс, вставьте компакт-диск от станции Мир», космонавтам за диском до Калуги бежать далековато!'
      },
      {
        id: 88,
        date: '24 марта 1997',
        score: 122,
        text: 'Приходит юзер к компьютерному мастеру:\n— Доктор Веб нашёл у меня на диске три вируса, я протёр системный блок спиртом, положил рядом чеснок и горчичник, а он всё равно пищит!\n— Вы бы ещё монитору банки поставили! Несите дискеты, сейчас будем лечить Aidstest-ом Лозинского!'
      },
      {
        id: 89,
        date: '04 марта 1997',
        score: 179,
        text: 'Новый русский устраивает сына в престижный технический вуз. Заходит к ректору:\n— Слышь, профессор, сколько стоит, чтобы мой пацан стал программистом?\nРектор вздыхает:\n— Пять лет учёбы, три курса высшей математики, дискретная логика и бессонные ночи над компилятором...\n— Не понял, ты мне в баксах скажи: почём у вас диплом сразу с предустановленным драйвером в голове?!'
      },
      {
        id: 90,
        date: '12 февраля 1997',
        score: 151,
        text: 'Чукча сидит в гостинице «Россия» и пытается отправить факс к себе на Чукотку. Засовывает лист бумаги в факс-аппарат, тот жужжит и выдаёт лист снизу обратно. Чукча засовывает второй раз, третий, потом качает головой:\n— Однако, хороший начальник в тундре сидит — три раза прочитал и три раза обратно на переделку прислал, даже печать высохнуть не успела!'
      },
      {
        id: 91,
        date: '20 января 1997',
        score: 168,
        text: 'Разговор двух студентов в читальном зале:\n— Слышь, я вчера игру на двенадцати дискетах у пацанов переписал, всю ночь шёл домой пешком через метель, бережно грел дискеты за пазухой!\n— Ну и как, поставил?\n— Десять штук прочитались как по маслу, а на одиннадцатой написано: «На этой дискете мама записала рецепт кабачковой икры поверх архива ARJ»!'
      },
      {
        id: 92,
        date: '28 декабря 1996',
        score: 140,
        text: 'Под Новый год программист ставит в углу комнаты живую ёлку. Жена заходит и всплёскивает руками:\n— Дорогой, почему ты повесил на ветки старые оперативки SIMM, битые компакт-диски и шлейфы от дисковода?!\n— Зато смотри, какая совместимость с гирляндой, и кот иголки не жрёт — боится статического электричества!'
      },
      {
        id: 93,
        date: '05 декабря 1996',
        score: 185,
        text: 'Встречаются два бывших одноклассника — один стал новым русским, другой — системным программистом. Новый русский хлопает одноклассника по плечу:\n— Вован, гляди, какой я себе пейджер взял — четыре строчки текста, корпус с позолотой! А ты всё за своим серым ящиком горбишься?\n— Зато я вчера через свой серый ящик познакомился в интернете с фотомоделью из Парижа!\n— Да ладно! И когда она к тебе прилетит?\n— Как только докачается нижняя половина фотографии — при моём коннекте на 14400 бод примерно к майским праздникам!'
      },
      {
        id: 94,
        date: '10 ноября 1996',
        score: 133,
        text: 'Звонок дежурному администратору сети:\n— Алло, у нас во всём отделе с утра сеть упала, сервер не откликается!\nАдминистратор смотрит в серверную:\n— Сейчас поднимем... Как только тётя Клава домыет пол в коридоре и вынет вилку своего пылесоса из розетки с надписью «Сервер — не выключать под страхом увольнения»!'
      },
      {
        id: 95,
        date: '15 октября 1996',
        score: 157,
        text: 'Вовочка спрашивает папу-инженера:\n— Пап, а что такое «шестьсот сорок килобайт хватит всем»?\n— Это, сынок, древнее предание времён процессора 8086. С тех пор любая программа сначала съедает шестнадцать мегабайт оперативной памяти, потом просит файл подкачки на полдиска, а в конце гордо выводит окно с одной кнопкой «ОК»!'
      },
      {
        id: 96,
        date: '18 сентября 1996',
        score: 171,
        text: 'Шерлок Холмс и доктор Ватсон пытаются настроить файлы AUTOEXEC.BAT и CONFIG.SYS, чтобы запустить DOOM II со звуком.\nПосле трёх часов перезагрузок Ватсон восклицает:\n— Холмс, но почему игра снова пишет, что ей не хватает пяти килобайт нижней памяти?!\n— Элементарно, Ватсон: драйвер мыши, русификатор клавиатуры и драйвер CD-ROM устроили заговор с профессором Мориарти и отказываются грузиться в верхнюю память HIMEM.SYS!'
      },
      {
        id: 97,
        date: '12 августа 1996',
        score: 149,
        text: 'Приходит проверяющий из налоговой инспекции в маленькую компьютерную фирму. Бухгалтер сидит перед пустым столом, на котором стоит только монитор, системный блок и большая красная кнопка от промышленного станка.\nИнспектор подозрительно прищуривается:\n— А это что за красная кнопка рядом с клавиатурой?\n— Это система экстренного аудита «Формат С:» — нажимаешь один раз, и баланс фирмы становится чистым, как слеза младенца!'
      },
      {
        id: 98,
        date: '04 мая 1996',
        score: 162,
        text: 'Сидят два фидошника на кухне, пьют крепкий чай и смотрят на часы: без пяти минут полночь.\n— Слышь, а почему ты со своей невестой поссорился?\n— Да она мне ультиматум поставила: или мы с ней с полуночи до двух ночи о любви по телефону разговариваем, или у тебя в это время ночной ЗМХ и почтовый обмен с узлом!\n— Ну и что ты выбрал?\n— Перевёл её в режим «только чтение» и отправил к маме с уведомлением о доставке!'
      },
      {
        id: 99,
        date: '14 февраля 1996',
        score: 178,
        text: 'Комиссия принимает вычислительный центр на оборонном заводе. Генерал подходит к оператору ЭВМ и спрашивает:\n— Доложите, товарищ старший лейтенант, как обеспечивается защита секретных чертежей от проникновения иностранных хакеров через эту вашу сеть Интернет?\n— Надёжно, товарищ генерал! Во-первых, у нас на входе стоит брандмауэр, во-вторых, пароль из шестнадцати символов, а в-третьих, кабель связи мы ещё в девяносто первом году топором перерубили и сдали на медь!'
      },
      {
        id: 100,
        date: '08 ноября 1995',
        score: 256,
        text: '8 ноября 1995 года. Два астрофизика смотрят на экран монитора, где только что открылась первая страница сайта «Анекдоты из России»:\n— Слушай, ну и зачем мы выложили русские анекдоты во Всемирную Паутину? Ведь во всём Интернете по-русски читают от силы человек триста по университетским лабораториям!\n— Подожди пару лет: проведут людям модемы, поставят в каждом офисе Win 95 и Win 98, и тогда половина страны с девяти утра до шести вечера будет делать умное лицо перед начальством, читая свежий выпуск и нажимая кнопку «Случайный анекдот»!'
      }
    ];
  }

  getAnekdotCategories() {
    return [
      { key: 'newrus', title: 'Новые русские', ids: [1, 12, 23, 37, 42, 47, 55, 64, 72, 80, 89, 93] },
      { key: 'heroes', title: 'Штирлиц, Ржевский и компания', ids: [13, 21, 27, 32, 35, 39, 53, 60, 73, 76, 84, 90, 96] },
      { key: 'school', title: 'Вовочка, школа и студенты', ids: [17, 33, 36, 43, 62, 66, 69, 91, 95] },
      { key: 'admins', title: 'Программисты и сисадмины', ids: [8, 10, 15, 16, 22, 29, 40, 45, 46, 49, 54, 58, 65, 71, 74, 79, 86, 92, 94, 97] },
      { key: 'support', title: 'Техподдержка и пользователи', ids: [2, 3, 5, 7, 19, 25, 28, 31, 34, 38, 52, 56, 61, 63, 70, 75, 77, 82, 85, 88] },
      { key: 'games', title: 'Игры и железо', ids: [6, 9, 24, 26, 41, 50, 51, 67, 68, 81, 83] },
      { key: 'net', title: 'Интернет, Фидо и чаты', ids: [14, 44, 48, 78, 98, 99, 100] },
      { key: 'country', title: 'Страна и жизнь', ids: [4, 11, 18, 20, 30, 57, 59, 87] },
      { key: 'readers', title: 'Присланные читателями', ids: [] }
    ];
  }

  getAnekdotCategoryKey(joke) {
    const found = this.getAnekdotCategories().find(c => c.ids.includes(joke.id));
    return found ? found.key : 'readers';
  }

  parseAnekdotUrl(url) {
    const path = url.replace(/^[a-z]+:\/\/[^/?#]*/i, '').split(/[?#]/)[0].toLowerCase();
    if (path === '/all.html') return { view: 'all' };
    const category = path.match(/^\/cat\/([a-z]+)\.html$/);
    if (category && this.getAnekdotCategories().some(c => c.key === category[1])) {
      return { view: 'category', key: category[1] };
    }
    const single = path.match(/^\/joke\/(\d+)\.html$/);
    if (single && this.getAnekdotList().some(j => j.id === parseInt(single[1], 10))) {
      return { view: 'joke', id: parseInt(single[1], 10) };
    }
    return { view: 'home' };
  }

  getAnekdotTitle(page) {
    const base = 'Anekdot.ru 1998';
    if (page.view === 'all') return `${base} - Все анекдоты`;
    if (page.view === 'category') {
      const category = this.getAnekdotCategories().find(c => c.key === page.key);
      return `${base} - ${category.title}`;
    }
    if (page.view === 'joke') return `${base} - Анекдот №${page.id}`;
    return 'Anekdot.ru 1998 - Ежедневные анекдоты из России';
  }

  renderAnekdotCard(joke, number, votesMap) {
    const category = this.getAnekdotCategories().find(c => c.key === this.getAnekdotCategoryKey(joke));
    const currentScore = joke.score + (votesMap[joke.id] || 0);
    return `
      <div class="anekdot-card" id="joke-${joke.id}">
        <div class="anekdot-card-header"><b>${number}.</b> <i>${joke.date}</i> &nbsp;&middot;&nbsp; <a class="anekdot-card-rubric" data-url="http://www.anekdot98.ru/cat/${category.key}.html">${category.title}</a> &nbsp;&middot;&nbsp; <a class="anekdot-card-rubric" data-url="http://www.anekdot98.ru/joke/${joke.id}.html">№${joke.id}</a></div>
        <div class="anekdot-card-body">${this.escapeHtml(joke.text).replace(/\n/g, '<br>')}</div>
        <div class="anekdot-vote-box">
          Рейтинг: <b id="score-${joke.id}">${currentScore}</b> &nbsp;
          <button class="btn-joke-vote" data-id="${joke.id}" data-delta="1" title="Смешно">+1</button>
          <button class="btn-joke-vote" data-id="${joke.id}" data-delta="-1" title="Баян">-1</button>
        </div>
      </div>
      <hr class="anekdot-hr">`;
  }

  renderAnekdotRubrics(jokes, wide) {
    const counts = {};
    jokes.forEach(j => {
      const key = this.getAnekdotCategoryKey(j);
      counts[key] = (counts[key] || 0) + 1;
    });
    const links = this.getAnekdotCategories()
      .filter(c => counts[c.key])
      .map(c => `<a data-url="http://www.anekdot98.ru/cat/${c.key}.html">${c.title}</a> <span class="anekdot-rubric-count">(${counts[c.key]})</span>`);
    if (wide) {
      return `<ul class="anekdot-rubric-grid">${links.map(l => `<li>${l}</li>`).join('')}</ul>`;
    }
    return `<div class="anekdot-rubric-line"><b>Рубрики:</b> ${links.join(' &nbsp;|&nbsp; ')}</div>`;
  }

  renderAnekdot(page) {
    const jokes = this.getAnekdotList();
    let votesMap = {};
    try {
      votesMap = JSON.parse(localStorage.getItem(this.anekdotVotesKey)) || {};
    } catch (e) {}

    const home = 'http://www.anekdot98.ru';
    let heading = '';
    let shown = [];
    let footerLink = '';

    if (page.view === 'all') {
      heading = `<h2 class="anekdot-heading">Все анекдоты <span class="anekdot-rubric-count">(${jokes.length})</span></h2>`;
      shown = jokes;
    } else if (page.view === 'category') {
      const category = this.getAnekdotCategories().find(c => c.key === page.key);
      shown = jokes.filter(j => this.getAnekdotCategoryKey(j) === page.key);
      heading = `<h2 class="anekdot-heading">${category.title} <span class="anekdot-rubric-count">(${shown.length})</span></h2>`;
    } else if (page.view === 'joke') {
      shown = jokes.filter(j => j.id === page.id);
      heading = `<h2 class="anekdot-heading">Анекдот №${page.id}</h2>`;
      footerLink = `<div class="anekdot-more"><a data-url="${home}/cat/${this.getAnekdotCategoryKey(shown[0])}.html">Ещё из этой рубрики &raquo;</a></div>`;
    } else {
      heading = `<h2 class="anekdot-heading">Рубрики</h2>${this.renderAnekdotRubrics(jokes, true)}<h2 class="anekdot-heading">Последние ${Math.min(10, jokes.length)} анекдотов</h2>`;
      shown = jokes.slice(0, 10);
      footerLink = `<div class="anekdot-more"><a data-url="${home}/all.html">Все анекдоты (${jokes.length}) &raquo;</a></div>`;
    }

    const crumbs = page.view === 'home' ? '' : `<div class="anekdot-crumbs"><a data-url="${home}">Главная</a> &raquo; ${page.view === 'all' ? 'Все анекдоты' : page.view === 'category' ? 'Рубрика' : 'Анекдот'}</div>`;

    return `
      <div class="anekdot-container">
        <div class="anekdot-page">
          <div class="anekdot-header">
            <div class="anekdot-logo">${this.gif('laugh', 2)} Анекдоты из России</div>
            <div class="anekdot-sub">ежедневный выпуск &middot; составитель Дмитрий Вернер &middot; с 1995 года</div>
            <div class="anekdot-nav">Выпуск от 15 ноября 1998 г. &nbsp;|&nbsp; <a data-url="${home}">Главная</a> &nbsp;|&nbsp; <a data-url="${home}/all.html">Все анекдоты: <b>${jokes.length}</b></a> &nbsp;|&nbsp; <a id="btn-random-joke">Случайный анекдот</a> &nbsp;|&nbsp; <a id="anekdot-to-form">Прислать свой</a></div>
            ${page.view === 'home' ? '' : this.renderAnekdotRubrics(jokes, false)}
          </div>
          ${crumbs}
          ${heading}
          <div id="anekdot-cards-list">
            ${shown.map((j, idx) => this.renderAnekdotCard(j, idx + 1, votesMap)).join('')}
          </div>
          ${footerLink}
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

        const joke = this.getAnekdotList().find(j => j.id === jokeId);
        const scoreEl = container.querySelector(`#score-${jokeId}`);
        if (joke && scoreEl) scoreEl.textContent = joke.score + votesMap[jokeId];

        if (window.soundSys) window.soundSys.playDing();
      });
    });

    const btnRandom = container.querySelector('#btn-random-joke');
    if (btnRandom) {
      btnRandom.addEventListener('click', () => {
        const jokes = this.getAnekdotList();
        const rand = jokes[Math.floor(Math.random() * jokes.length)];
        this.navigate(win, `http://www.anekdot98.ru/joke/${rand.id}.html`);
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
        if (this.parseAnekdotUrl(this.currentUrl).view === 'home') {
          this.renderPage(win, this.currentUrl);
        } else {
          this.navigate(win, 'http://www.anekdot98.ru');
        }
      });
    }
  }

  getChatRoomMessages(room) {
    if (typeof window !== 'undefined' && window.krovatkaSite && typeof window.krovatkaSite.getRoomMessages === 'function') {
      return window.krovatkaSite.getRoomMessages(room);
    }
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
    if (typeof window !== 'undefined' && window.krovatkaSite && typeof window.krovatkaSite.saveRoomMessages === 'function') {
      return window.krovatkaSite.saveRoomMessages(room, msgs);
    }
    try {
      localStorage.setItem(`${this.chatMessagesKey}_${room}`, JSON.stringify(msgs));
    } catch (e) {}
  }

  renderChat(url) {
    if (typeof window !== 'undefined' && window.krovatkaSite && typeof window.krovatkaSite.renderSite === 'function') {
      return window.krovatkaSite.renderSite(url || this.currentUrl, this);
    }
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
    if (typeof window !== 'undefined' && window.krovatkaSite && typeof window.krovatkaSite.attachEvents === 'function') {
      return window.krovatkaSite.attachEvents(win, container, this);
    }
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
    if (typeof window !== 'undefined' && window.geocitiesSite && typeof window.geocitiesSite.renderSite === 'function') {
      return window.geocitiesSite.renderSite(url);
    }
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
    if (typeof window !== 'undefined' && window.geocitiesSite && typeof window.geocitiesSite.attachEvents === 'function') {
      window.geocitiesSite.attachEvents(win, container, this);
      return;
    }
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

  winUpdateIsRu() {
    return !window.i18n || window.i18n.getLanguage() === 'ru';
  }

  renderWinUpdatePage() {
    const isRu = this.winUpdateIsRu();
    const L = (ru, en) => (isRu ? ru : en);
    const installedRaw = localStorage.getItem('win98_installed_updates');
    const installed = installedRaw ? JSON.parse(installedRaw) : [];

    const updates = [
      {
        id: 'kb_y2k',
        cat: L('Критические обновления', 'Critical Updates'),
        title: L('Сводное обновление Microslop Win 98 для 2000 года (Y2K)', 'Microslop Win 98 Year 2000 (Y2K) Update Rollup'),
        size: L('642 КБ', '642 KB'),
        time: L('2 мин при 56 Кбит/с', '2 min @ 56K'),
        desc: L('Исправляет обработку високосного года и двузначных дат в FAT32, Диспетчере файлов и в окне «Язык и стандарты» до наступления 1 января 2000 года.', 'Resolves leap-year and two-digit date handling issues in FAT32, File Manager, and Regional Settings prior to January 1, 2000.')
      },
      {
        id: 'kb_sec99',
        cat: L('Критические обновления', 'Critical Updates'),
        title: L('Обновление безопасности TCP/IP для Win 98 SE: фрагментация IGMP (Q245682)', 'Win 98 SE TCP/IP IGMP Fragmentation Security Update (Q245682)'),
        size: L('198 КБ', '198 KB'),
        time: L('1 мин при 56 Кбит/с', '1 min @ 56K'),
        desc: L('Защищает компьютер с Win 98 SE от поврежденных внеполосных (WinNuke) и IGMP-пакетов при работе через удаленный доступ к сети или по локальной сети.', 'Protects your Win 98 SE workstation against malformed Out-of-Band (WinNuke) and IGMP network packets over Dial-Up or LAN.')
      },
      {
        id: 'kb_dx61',
        cat: L('Рекомендуемые обновления', 'Recommended Updates'),
        title: L('Среда выполнения Microslop DirectX 6.1a и ускорители 3DNow!/MMX', 'Microslop DirectX 6.1a Runtime & 3DNow!/MMX Accelerators'),
        size: L('4 210 КБ', '4,210 KB'),
        time: L('11 мин при 56 Кбит/с', '11 min @ 56K'),
        desc: L('Обновляет драйверы DirectDraw, Direct3D и DirectSound для видеоплат 3dfx Voodoo2 и Riva TNT.', 'Upgrades DirectDraw, Direct3D, and DirectSound drivers for 3dfx Voodoo2 and Riva TNT graphics cards.')
      },
      {
        id: 'kb_plus98',
        cat: L('Оформление и развлечения', 'Fun & Desktop Enhancements'),
        title: L('Темы рабочего стола Microslop Plus! 98 и набор заставок OpenGL', 'Microslop Plus! 98 Desktop Themes & OpenGL Screensaver Pack'),
        size: L('1 180 КБ', '1,180 KB'),
        time: L('3 мин при 56 Кбит/с', '3 min @ 56K'),
        desc: L('Содержит заставки «Объемный лабиринт» и «Объемный текст», значки High Color и звуковые схемы Plus!.', 'Includes 3D Maze, 3D Text, High Color Icons, and Plus! Sound Schemes.')
      }
    ];

    return `
      <div style="font-family:Verdana,Tahoma,sans-serif; font-size:11px; background:#ffffff; color:#000000; min-height:100%;">
        <div style="background:linear-gradient(90deg, #003399 0%, #0066cc 65%, #3399ff 100%); color:#ffffff; padding:10px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #ffcc00;">
          <div>
            <div style="font-size:18px; font-weight:bold; letter-spacing:0.5px;">${L('Обновление Win', 'Microslop Win Update')}</div>
            <div style="font-size:10px; color:#dbeafe;">${L('Официальное интернет-дополнение к Microslop Win 98 Second Edition', 'The Official Online Extension of Microslop Win 98 Second Edition')}</div>
          </div>
          <div style="background:#002266; border:1px solid #93c5fd; padding:4px 8px; font-size:10px; text-align:right;">
            <div>${L('ОС', 'OS')}: <b>Win 98 SE (4.10.2222 A)</b></div>
            <div>${L('Модуль проверки ActiveX', 'ActiveX Scanner')}: <span style="color:#4ade80;">${L('готов', 'Ready')}</span></div>
          </div>
        </div>

        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="width:165px; background:#e8eef7; vertical-align:top; padding:12px; border-right:1px solid #99b4d1;">
              <div style="font-weight:bold; color:#003399; margin-bottom:8px;">${L('Каталог обновлений', 'Win Update Catalog')}</div>
              <div style="padding:4px 0; font-weight:bold;">▸ ${L('Обновления продукта', 'Product Updates')}</div>
              <div style="padding:4px 0; color:#333;">▸ ${L('Сведения о поддержке', 'Support Information')}</div>
              <div style="padding:4px 0; color:#333;">▸ ${L('Прочтите сначала', 'Read This First')}</div>
              <hr style="border:0; border-top:1px solid #99b4d1; margin:10px 0;">
              <div style="font-size:10px; color:#334155; line-height:1.4;">
                <b>${L('Установлено обновлений', 'Installed Updates')}:</b> <span id="wu-installed-count">${installed.length}</span> ${L('из', '/')} ${updates.length}
              </div>
              <div style="margin-top:10px;">
                <button class="win-btn" id="wu-scan-btn" style="width:100%;">${L('Проверить снова', 'Scan System Again')}</button>
              </div>
            </td>
            <td style="vertical-align:top; padding:14px;">
              <div id="wu-progress-panel" style="display:none; background:#f1f5f9; border:2px outset #fff; padding:12px; margin-bottom:14px;">
                <div style="font-weight:bold; margin-bottom:6px;" id="wu-progress-title">${L('Загрузка и установка выбранных обновлений...', 'Downloading and Installing Selected Updates...')}</div>
                <div class="win-inset" style="height:18px; background:#fff; padding:2px;">
                  <div id="wu-progress-bar" style="width:0%; height:100%; background:#000080;"></div>
                </div>
                <div style="font-size:10px; margin-top:4px;" id="wu-progress-status">${L('Подключение к windowsupdate.microslop.com...', 'Connecting to windowsupdate.microslop.com...')}</div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #cbd5e1; padding:8px 10px; margin-bottom:12px;">
                <div>
                  <b>${L('Выберите обновления для установки на компьютер', 'Select updates to install on your computer')}</b><br>
                  <span style="font-size:10px; color:#475569;">${L('Установите флажки рядом с нужными обновлениями и нажмите кнопку <b>Загрузить</b>.', 'Check the boxes next to the updates you want, then click <b>Download</b>.')}</span>
                </div>
                <button class="win-btn default" id="wu-download-btn" style="min-width:110px; font-weight:bold;">${L('Загрузить', 'Download')} &gt;</button>
              </div>

              ${updates.map(u => {
                const isDone = installed.includes(u.id);
                return `
                  <div style="border:1px solid #cbd5e1; margin-bottom:10px; padding:10px; background:${isDone ? '#f0fdf4' : '#ffffff'};">
                    <div style="font-size:10px; font-weight:bold; color:#991b1b; text-transform:uppercase; margin-bottom:3px;">${u.cat}</div>
                    <label style="display:flex; align-items:flex-start; gap:8px; cursor:pointer;">
                      <input type="checkbox" class="wu-chk" value="${u.id}" ${isDone ? 'disabled' : 'checked'}>
                      <div style="flex:1;">
                        <div style="font-weight:bold; color:#003399;">
                          ${u.title}
                          ${isDone ? `<span style="color:#15803d; font-size:10px; margin-left:6px;">[${L('УСТАНОВЛЕНО', 'INSTALLED')}]</span>` : ''}
                        </div>
                        <div style="font-size:10px; color:#64748b; margin:2px 0 4px;">${L('Размер загрузки', 'Download size')}: ${u.size} (${u.time})</div>
                        <div style="color:#1e293b; line-height:1.35;">${u.desc}</div>
                      </div>
                    </label>
                  </div>
                `;
              }).join('')}
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  attachWinUpdateEvents(win, container) {
    const isRu = this.winUpdateIsRu();
    const dialogTitle = isRu ? 'Обновление Win' : 'Microslop Win Update';
    const dlBtn = container.querySelector('#wu-download-btn');
    const scanBtn = container.querySelector('#wu-scan-btn');
    const progPanel = container.querySelector('#wu-progress-panel');
    const progBar = container.querySelector('#wu-progress-bar');
    const progStatus = container.querySelector('#wu-progress-status');

    if (scanBtn) {
      scanBtn.addEventListener('click', () => {
        this.renderPage(win, this.currentUrl);
      });
    }

    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        const checked = Array.from(container.querySelectorAll('.wu-chk:checked')).map(c => c.value);
        if (!checked.length) {
          window.winManager.openDialog({
            title: dialogTitle,
            icon: 'info',
            message: isRu ? 'Выберите хотя бы одно обновление для загрузки и установки.' : 'Please select at least one update to download and install.'
          });
          return;
        }
        progPanel.style.display = 'block';
        dlBtn.disabled = true;
        let pct = 0;
        const timer = setInterval(() => {
          pct += 10;
          progBar.style.width = pct + '%';
          if (isRu) {
            progStatus.textContent = pct < 60
              ? `Загрузка пакетов CAB (${pct}%)...`
              : `Установка системных файлов и обновление реестра (${pct}%)...`;
          } else {
            progStatus.textContent = pct < 60
              ? `Downloading cabinet packages (${pct}%)...`
              : `Installing system files and updating registry (${pct}%)...`;
          }
          if (pct >= 100) {
            clearInterval(timer);
            const prevRaw = localStorage.getItem('win98_installed_updates');
            const prev = prevRaw ? JSON.parse(prevRaw) : [];
            const merged = Array.from(new Set([...prev, ...checked]));
            localStorage.setItem('win98_installed_updates', JSON.stringify(merged));
            if (window.appClippy && typeof window.appClippy.onWinUpdateInstalled === 'function') {
              setTimeout(() => window.appClippy.onWinUpdateInstalled(checked), 800);
            }
            if (window.soundSys && window.soundSys.playNotification) window.soundSys.playNotification();
            this.renderPage(win, this.currentUrl);
            window.winManager.openDialog({
              title: dialogTitle,
              icon: 'info',
              message: isRu
                ? 'Установка завершена.\nВыбранные обновления Win 98 SE успешно установлены на компьютер.'
                : 'Installation Complete!\nThe selected Win 98 SE updates have been successfully installed on your computer.'
            });
          }
        }, 120);
      });
    }
  }
}

window.appIE = new AppIE();
