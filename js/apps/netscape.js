/**
 * Netscape 6 для Win 98 Clone
 * -----------------------------------------------------------
 * Настоящий браузер: ходит в реальный интернет через шлюз
 * /netscape/page, который переписывает любой сайт под Web 1.0.
 *
 * Требует запущенный server.js (node server.js).
 */
class AppNetscape {
  constructor() {
    this.winId = 'app_netscape';
    this.homeUrl = 'about:netscape';
    this.searchEngine = 'https://html.duckduckgo.com/html/?q=';
    this.bookmarksKey = 'win98_netscape_bookmarks';
    this.historyKey = 'win98_netscape_history';

    this.history = [];
    this.historyIndex = -1;
    this.isLoading = false;
    this.currentUrl = this.homeUrl;
    this.currentTitle = 'Netscape 6';
    this.lastBounds = null;
    this.openMenu = null;
    // auto — JavaScript выполняется, только если без него страница пустая
    this.renderMode = 'auto';
    this.loadTimer = null;

    this.defaultBookmarks = [
      { title: 'Википедия', url: 'https://ru.wikipedia.org/' },
      { title: 'Hacker News', url: 'https://news.ycombinator.com/' },
      { title: 'DuckDuckGo', url: 'https://html.duckduckgo.com/html/?q=web+1.0' },
      { title: 'Lib.ru', url: 'http://lib.ru/' },
      { title: 'Example.com', url: 'https://example.com/' }
    ];

    if (typeof window !== 'undefined') {
      window.addEventListener('connectivity-changed', (e) => {
        if (e.detail && e.detail.isOnline && this.root && this.currentUrl && !this.currentUrl.startsWith('about:')) {
          this.navigate(this.currentUrl, { replace: true });
        }
      });
    }
  }

  /* ---------------------------------------------------------- */
  /* Открытие окна                                               */
  /* ---------------------------------------------------------- */

  loadBounds() {
    try {
      const raw = localStorage.getItem('win98_netscape_window_bounds') || localStorage.getItem('win98_bounds_app_netscape');
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
      localStorage.setItem('win98_netscape_window_bounds', JSON.stringify(b));
      localStorage.setItem('win98_bounds_app_netscape', JSON.stringify(b));
    } catch (e) {}
  }

  open(initialUrl) {
    const startUrl = initialUrl || this.homeUrl;

    if (window.winManager && window.winManager.windows.has(this.winId)) {
      const existing = window.winManager.windows.get(this.winId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.winId);
      else window.winManager.bringToTop(this.winId);
      if (initialUrl) this.navigate(startUrl);
      return;
    }

    const b = this.lastBounds || this.loadBounds();
    const width = b ? b.width : 760;
    const height = b ? b.height : 540;
    const x = b && typeof b.x === 'number' ? Math.max(0, Math.min((window.innerWidth || 1024) - 100, b.x)) : 40;
    const y = b && typeof b.y === 'number' ? Math.max(0, Math.min((window.innerHeight || 768) - 100, b.y)) : 20;

    const win = window.winManager.createWindow({
      id: this.winId,
      title: 'Netscape 6',
      icon: 'netscape',
      width,
      height,
      x,
      y,
      content: this.buildHTML(),
      onClose: () => {
        const el = win && win.element;
        if (el) {
          let bW = width, bH = height, bX = x, bY = y;
          if (win.isMaximized && win.prevBounds) {
            bW = win.prevBounds.width;
            bH = win.prevBounds.height;
            bX = win.prevBounds.x;
            bY = win.prevBounds.y;
          } else {
            const r = el.getBoundingClientRect();
            bW = r.width;
            bH = r.height;
            bX = r.left;
            bY = r.top;
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
        this.root = null;
      }
    });

    this.root = win.element.querySelector('.ns6');
    this.frame = this.root.querySelector('.ns6-frame');
    this.addressInput = this.root.querySelector('.ns6-address-input');
    this.statusText = this.root.querySelector('.ns6-status-text');
    this.progressBar = this.root.querySelector('.ns6-progress-fill');
    this.throbber = this.root.querySelector('.ns6-throbber');

    this.bindEvents();
    this.renderBookmarksBar();
    this.history = [];
    this.historyIndex = -1;
    this.navigate(startUrl);
  }

  /* ---------------------------------------------------------- */
  /* Разметка окна                                               */
  /* ---------------------------------------------------------- */

  buildHTML() {
    const menus = [
      ['file', 'Файл'],
      ['edit', 'Правка'],
      ['view', 'Вид'],
      ['go', 'Переход'],
      ['bookmarks', 'Закладки'],
      ['tasks', 'Задачи'],
      ['help', 'Справка']
    ];

    return `
      <div class="ns6">
        <div class="ns6-menubar">
          ${menus
            .map(
              ([id, label]) =>
                `<div class="ns6-menu-title" data-menu="${id}">${label}</div>`
            )
            .join('')}
        </div>

        <div class="ns6-toolbar">
          <button class="ns6-tbtn" data-act="back" title="Назад">
            <span class="ns6-tico">◀</span><span>Назад</span>
          </button>
          <button class="ns6-tbtn" data-act="forward" title="Вперёд">
            <span class="ns6-tico">▶</span><span>Вперёд</span>
          </button>
          <button class="ns6-tbtn" data-act="reload" title="Обновить">
            <span class="ns6-tico">↻</span><span>Обновить</span>
          </button>
          <button class="ns6-tbtn" data-act="stop" title="Остановить">
            <span class="ns6-tico ns6-red">✕</span><span>Стоп</span>
          </button>
          <button class="ns6-tbtn" data-act="home" title="Домой">
            <span class="ns6-tico">⌂</span><span>Домой</span>
          </button>
          <div class="ns6-toolbar-spacer"></div>
          <div class="ns6-throbber" title="Netscape 6">
            <div class="ns6-throbber-inner">N</div>
          </div>
        </div>

        <div class="ns6-locationbar">
          <span class="ns6-loc-label">Адрес:</span>
          <div class="ns6-address">
            <span class="ns6-lock" title="Соединение не защищено">🔒</span>
            <input class="ns6-address-input" type="text" spellcheck="false"
                   value="about:netscape" autocomplete="off">
          </div>
          <button class="ns6-gobtn" data-act="go">Переход</button>
          <button class="ns6-gobtn" data-act="search">Поиск</button>
        </div>

        <div class="ns6-personalbar">
          <button class="ns6-pbtn" data-act="home">🏠 Начальная</button>
          <button class="ns6-pbtn" data-act="mynetscape">📰 My Netscape</button>
          <button class="ns6-pbtn" data-act="search">🔍 Поиск в Сети</button>
          <button class="ns6-pbtn" data-act="addbookmark">★ В закладки</button>
          <div class="ns6-bookmarks-bar"></div>
        </div>

        <div class="ns6-content">
          <iframe class="ns6-frame" title="Netscape content"
                  sandbox="allow-same-origin allow-forms allow-popups"></iframe>
        </div>

        <div class="ns6-statusbar">
          <div class="ns6-status-icon">📄</div>
          <div class="ns6-status-text">Готово</div>
          <div class="ns6-progress"><div class="ns6-progress-fill"></div></div>
          <div class="ns6-status-lock">🔓</div>
          <div class="ns6-component-bar">
            <span title="Navigator">🌐</span>
            <span title="Mail &amp; Newsgroups">✉</span>
            <span title="Composer">📝</span>
            <span title="Address Book">📇</span>
          </div>
        </div>

        <div class="ns6-dropdown" hidden></div>
      </div>
    `;
  }

  /* ---------------------------------------------------------- */
  /* События                                                     */
  /* ---------------------------------------------------------- */

  bindEvents() {
    const root = this.root;

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (btn) {
        this.closeMenu();
        this.action(btn.dataset.act, btn.dataset.url);
        return;
      }
      const menu = e.target.closest('.ns6-menu-title');
      if (menu) {
        this.toggleMenu(menu.dataset.menu, menu);
        return;
      }
      const item = e.target.closest('.ns6-dropdown-item');
      if (item) {
        const cmd = item.dataset.cmd;
        const url = item.dataset.url;
        this.closeMenu();
        this.action(cmd, url);
        return;
      }
      this.closeMenu();
    });

    this.addressInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.navigate(this.addressInput.value);
    });
    this.addressInput.addEventListener('focus', () => this.addressInput.select());

    this.frame.addEventListener('load', () => this.onFrameLoad());
  }

  action(cmd, url) {
    switch (cmd) {
      case 'back': return this.goBack();
      case 'forward': return this.goForward();
      case 'reload': return this.navigate(this.currentUrl, { replace: true });
      case 'stop': return this.stop();
      case 'home': return this.navigate(this.homeUrl);
      case 'go': return this.navigate(this.addressInput.value);
      case 'search': return this.promptSearch();
      case 'mynetscape': return this.navigate('about:netscape');
      case 'addbookmark': return this.addBookmark();
      case 'openurl': return this.promptUrl();
      case 'bookmark': return url && this.navigate(url);
      case 'managebookmarks': return this.navigate('about:bookmarks');
      case 'history': return this.navigate('about:history');
      case 'about': return this.showAbout();
      case 'close':
        return window.winManager && window.winManager.closeWindow(this.winId);
      case 'copyurl':
        return this.copyToClipboard(this.currentUrl);
      case 'mode-auto':
      case 'mode-js':
      case 'mode-static':
        this.renderMode = cmd.slice(5);
        return this.navigate(this.currentUrl, { replace: true });
      case 'viewsource':
        return this.currentUrl.startsWith('about:')
          ? null
          : window.open(
              '/netscape/page?url=' + encodeURIComponent(this.currentUrl),
              '_blank'
            );
      default:
        return null;
    }
  }

  /* ---------------------------------------------------------- */
  /* Меню                                                        */
  /* ---------------------------------------------------------- */

  menuItems(id) {
    switch (id) {
      case 'file':
        return [
          { label: 'Открыть адрес...', cmd: 'openurl' },
          { label: 'Начальная страница', cmd: 'home' },
          { sep: true },
          { label: 'Закрыть', cmd: 'close' }
        ];
      case 'edit':
        return [
          { label: 'Копировать адрес', cmd: 'copyurl' },
          { label: 'Найти в Сети...', cmd: 'search' }
        ];
      case 'view':
        return [
          { label: 'Обновить', cmd: 'reload' },
          { label: 'Остановить', cmd: 'stop' },
          { sep: true },
          { label: (this.renderMode === 'auto' ? '● ' : '') + 'JavaScript: автоматически', cmd: 'mode-auto' },
          { label: (this.renderMode === 'js' ? '● ' : '') + 'JavaScript: всегда выполнять', cmd: 'mode-js' },
          { label: (this.renderMode === 'static' ? '● ' : '') + 'JavaScript: отключить', cmd: 'mode-static' },
          { sep: true },
          { label: 'Исходный код страницы', cmd: 'viewsource' }
        ];
      case 'go':
        return [
          { label: 'Назад', cmd: 'back' },
          { label: 'Вперёд', cmd: 'forward' },
          { label: 'Начальная страница', cmd: 'home' },
          { sep: true },
          { label: 'Журнал посещений', cmd: 'history' }
        ];
      case 'bookmarks':
        return [
          { label: 'Добавить страницу в закладки', cmd: 'addbookmark' },
          { label: 'Все закладки', cmd: 'managebookmarks' },
          { sep: true },
          ...this.getBookmarks().map((b) => ({
            label: b.title,
            cmd: 'bookmark',
            url: b.url
          }))
        ];
      case 'tasks':
        return [
          { label: 'Navigator', cmd: 'home' },
          { label: 'Mail & Newsgroups', cmd: 'mail' },
          { label: 'Composer', cmd: 'composer' }
        ];
      case 'help':
        return [{ label: 'О программе Netscape 6', cmd: 'about' }];
      default:
        return [];
    }
  }

  toggleMenu(id, anchorEl) {
    const dd = this.root.querySelector('.ns6-dropdown');
    if (this.openMenu === id) return this.closeMenu();

    this.root
      .querySelectorAll('.ns6-menu-title')
      .forEach((el) => el.classList.toggle('active', el.dataset.menu === id));

    dd.innerHTML = this.menuItems(id)
      .map((it) =>
        it.sep
          ? '<div class="ns6-dropdown-sep"></div>'
          : `<div class="ns6-dropdown-item" data-cmd="${it.cmd}"${
              it.url ? ` data-url="${this.escape(it.url)}"` : ''
            }>${this.escape(it.label)}</div>`
      )
      .join('');
    dd.hidden = false;
    const rect = anchorEl.getBoundingClientRect();
    const rootRect = this.root.getBoundingClientRect();
    dd.style.left = rect.left - rootRect.left + 'px';
    dd.style.top = rect.bottom - rootRect.top + 'px';
    this.openMenu = id;
  }

  closeMenu() {
    if (!this.root) return;
    const dd = this.root.querySelector('.ns6-dropdown');
    if (dd) dd.hidden = true;
    this.root
      .querySelectorAll('.ns6-menu-title')
      .forEach((el) => el.classList.remove('active'));
    this.openMenu = null;
  }

  /* ---------------------------------------------------------- */
  /* Навигация                                                   */
  /* ---------------------------------------------------------- */

  normalize(input) {
    let value = String(input || '').trim();
    if (!value) return this.homeUrl;
    if (/^about:/i.test(value)) return value.toLowerCase();
    if (/^(https?|mailto):/i.test(value)) return value;
    // Похоже на домен?
    if (/^[\w-]+(\.[\w-]+)+(\/|$|\?|:)/.test(value) || /^localhost(:\d+)?/.test(value)) {
      return 'http://' + value;
    }
    return this.searchEngine + encodeURIComponent(value);
  }

  navigate(input, options = {}) {
    if (!this.root) return;
    const url = this.normalize(input);

    if (!options.fromFrame) {
      if (url.startsWith('about:')) {
        this.frame.srcdoc = this.buildInternalPage(url);
      } else if (window.isOnline === false) {
        this.setLoading(false);
        this.frame.srcdoc = this.buildOfflinePage(url);
      } else {
        this.setLoading(true, url);
        this.frame.removeAttribute('srcdoc');
        this.frame.src = this.gatewayUrl(url);
      }
    }

    this.currentUrl = url;
    this.addressInput.value = url;
    this.pushHistory(url, options.replace);
    this.updateNavButtons();
    this.rememberVisit(url);
  }

  pushHistory(url, replace) {
    if (replace && this.historyIndex >= 0) {
      this.history[this.historyIndex] = url;
      return;
    }
    if (this.history[this.historyIndex] === url) return;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(url);
    this.historyIndex = this.history.length - 1;
  }

  goBack() {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this.loadFromHistory();
  }

  goForward() {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    this.loadFromHistory();
  }

  loadFromHistory() {
    const url = this.history[this.historyIndex];
    this.currentUrl = url;
    this.addressInput.value = url;
    if (url.startsWith('about:')) {
      this.frame.srcdoc = this.buildInternalPage(url);
    } else {
      this.setLoading(true, url);
      this.frame.removeAttribute('srcdoc');
      this.frame.src = this.gatewayUrl(url);
    }
    this.updateNavButtons();
  }

  updateNavButtons() {
    const back = this.root.querySelector('[data-act="back"]');
    const fwd = this.root.querySelector('[data-act="forward"]');
    if (back) back.disabled = this.historyIndex <= 0;
    if (fwd) fwd.disabled = this.historyIndex >= this.history.length - 1;
  }

  stop() {
    if (!this.isLoading) return;
    try {
      this.frame.contentWindow.stop();
    } catch (e) {
      this.frame.src = 'about:blank';
    }
    this.setLoading(false);
    this.statusText.textContent = 'Передача данных остановлена';
  }

  /**
   * Срабатывает и при нашей навигации, и при кликах по ссылкам
   * внутри страницы — там обычные <a href="/netscape/page?url=...">.
   */
  onFrameLoad() {
    this.setLoading(false);
    let doc;
    try {
      doc = this.frame.contentDocument;
    } catch (e) {
      return;
    }
    if (!doc) return;

    const metaUrl = doc.querySelector('meta[name="ns-url"]');
    const metaTitle = doc.querySelector('meta[name="ns-title"]');
    const url = metaUrl ? metaUrl.content : null;

    // Шлюз не ответил — скорее всего, страница открыта без server.js
    if (!url && !this.currentUrl.startsWith('about:')) {
      this.frame.srcdoc = this.internalShell(
        'Шлюз недоступен',
        this.currentUrl,
        `<h1>Нет связи со шлюзом</h1>
         <p>Netscape 6 работает через локальный шлюз Web 1.0.</p>
         <p>Запустите сервер командой <tt>node server.js</tt> и откройте
         систему по адресу <tt>http://localhost:8080</tt>.</p>`
      );
      this.statusText.textContent = 'Шлюз Web 1.0 недоступен';
      return;
    }

    if (url && url !== this.currentUrl) {
      // Переход инициирован самой страницей (клик по ссылке)
      this.currentUrl = url;
      this.addressInput.value = url;
      this.pushHistory(url);
      this.updateNavButtons();
      this.rememberVisit(url, metaTitle ? metaTitle.content : '');
    }

    this.currentTitle = metaTitle ? metaTitle.content : this.currentTitle;
    this.setWindowTitle(this.currentTitle);
    this.statusText.textContent = 'Документ загружен';
    this.bindInternalLinks(doc);

    const secure = /^https:/i.test(this.currentUrl);
    const lock = this.root.querySelector('.ns6-status-lock');
    if (lock) lock.textContent = secure ? '🔒' : '🔓';

    // Подсказка в статусной строке при наведении на ссылку
    doc.addEventListener('mouseover', (e) => {
      const a = e.target.closest && e.target.closest('a[title]');
      if (a) this.statusText.textContent = a.getAttribute('title');
    });
    doc.addEventListener('mouseout', () => {
      if (!this.isLoading) this.statusText.textContent = 'Готово';
    });

    // Переход, начатый самой страницей (ссылка или форма): сразу включаем
    // индикатор — рендеринг JS-сайта на шлюзе может занять несколько секунд
    const win = this.frame.contentWindow;
    if (win) {
      win.addEventListener('pagehide', () => {
        if (this.root && !this.isLoading) this.setLoading(true, this.currentUrl);
      });
    }
    doc.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href^="/netscape/"]');
      if (a && !e.defaultPrevented) this.setLoading(true, a.getAttribute('title') || this.currentUrl);
    });
    doc.addEventListener('submit', () => this.setLoading(true, this.currentUrl));
  }

  /** Ссылки внутренних страниц (about:) обслуживаем сами. */
  bindInternalLinks(doc) {
    doc.querySelectorAll('a[data-ns-go]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(a.getAttribute('data-ns-go'));
      });
    });
    const form = doc.querySelector('#ns-search-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = form.querySelector('input[name="q"]').value.trim();
        if (q) this.navigate(this.searchEngine + encodeURIComponent(q));
      });
    }
  }

  gatewayUrl(url) {
    const mode = this.renderMode === 'auto' ? '' : '&mode=' + this.renderMode;
    return '/netscape/page?url=' + encodeURIComponent(url) + mode;
  }

  setLoading(loading, url) {
    this.isLoading = loading;
    clearInterval(this.loadTimer);
    if (this.throbber) this.throbber.classList.toggle('spinning', loading);
    if (!loading) {
      if (this.progressBar) this.progressBar.style.width = '0%';
      if (this.statusText) this.statusText.textContent = 'Готово';
      return;
    }

    // Прогресс «как у модема»: быстро до середины, дальше всё медленнее
    const host = this.hostOf(url || this.currentUrl);
    const started = Date.now();
    const tick = () => {
      if (!this.root) return clearInterval(this.loadTimer);
      const sec = (Date.now() - started) / 1000;
      const pct = 95 * (1 - Math.exp(-sec / 4));
      if (this.progressBar) this.progressBar.style.width = pct.toFixed(1) + '%';
      if (this.statusText) {
        this.statusText.textContent =
          sec < 1.5 ? 'Соединение с ' + host + '...'
          : sec < 4 ? 'Получение данных с ' + host + '...'
          : 'Выполнение JavaScript и перевод в HTML 3.2... (' + Math.floor(sec) + ' с)';
      }
    };
    tick();
    this.loadTimer = setInterval(tick, 250);
  }

  hostOf(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url || '';
    }
  }

  setWindowTitle(title) {
    const win = window.winManager && window.winManager.windows.get(this.winId);
    const el = win && win.element && win.element.querySelector('.win-titlebar-title');
    const text = (title || 'Netscape 6') + ' - Netscape 6';
    if (el) el.textContent = text;
    const taskBtn = document.querySelector(
      `#taskbar-btn-${this.winId} .taskbar-item-title`
    );
    if (taskBtn) taskBtn.textContent = text;
  }

  /* ---------------------------------------------------------- */
  /* Диалоги                                                     */
  /* ---------------------------------------------------------- */

  promptUrl() {
    const value = prompt('Открыть адрес:', this.currentUrl);
    if (value) this.navigate(value);
  }

  promptSearch() {
    const value = prompt('Искать в Интернете:', '');
    if (value) this.navigate(this.searchEngine + encodeURIComponent(value.trim()));
  }

  showAbout() {
    if (!window.winManager || !window.winManager.openDialog) return;
    window.winManager.openDialog({
      title: 'О программе Netscape 6',
      icon: 'netscape',
      message:
        '<b>Netscape 6.2.1</b><br>Gecko/20011128<br><br>' +
        'Web 1.0 Rendering Gateway включён: любой современный сайт ' +
        'отображается так, как выглядел бы веб в 1998 году.<br><br>' +
        '&copy; 1994&ndash;2001 Netscape Communications Corp.'
    });
  }

  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    this.statusText.textContent = 'Адрес скопирован в буфер обмена';
  }

  /* ---------------------------------------------------------- */
  /* Закладки и журнал                                           */
  /* ---------------------------------------------------------- */

  getBookmarks() {
    try {
      const raw = localStorage.getItem(this.bookmarksKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return this.defaultBookmarks.slice();
  }

  saveBookmarks(list) {
    try {
      localStorage.setItem(this.bookmarksKey, JSON.stringify(list));
    } catch (e) {}
  }

  addBookmark() {
    if (this.currentUrl.startsWith('about:')) return;
    const list = this.getBookmarks();
    if (list.some((b) => b.url === this.currentUrl)) {
      this.statusText.textContent = 'Эта страница уже в закладках';
      return;
    }
    list.push({ title: this.currentTitle || this.hostOf(this.currentUrl), url: this.currentUrl });
    this.saveBookmarks(list);
    this.renderBookmarksBar();
    this.statusText.textContent = 'Страница добавлена в закладки';
  }

  renderBookmarksBar() {
    const bar = this.root && this.root.querySelector('.ns6-bookmarks-bar');
    if (!bar) return;
    bar.innerHTML = this.getBookmarks()
      .slice(0, 6)
      .map(
        (b) =>
          `<button class="ns6-pbtn ns6-bm" data-act="bookmark" data-url="${this.escape(
            b.url
          )}" title="${this.escape(b.url)}">${this.escape(
            b.title.slice(0, 18)
          )}</button>`
      )
      .join('');
  }

  rememberVisit(url, title) {
    if (!url || url.startsWith('about:')) return;
    try {
      const list = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
      const entry = { url, title: title || this.currentTitle || '', at: Date.now() };
      const filtered = list.filter((h) => h.url !== url);
      filtered.unshift(entry);
      localStorage.setItem(this.historyKey, JSON.stringify(filtered.slice(0, 60)));
    } catch (e) {}
  }

  getHistoryLog() {
    try {
      return JSON.parse(localStorage.getItem(this.historyKey) || '[]');
    } catch (e) {
      return [];
    }
  }

  escape(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  buildOfflinePage(url) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: "MS Sans Serif", Tahoma, sans-serif; background: #c0c0c0; color: #000; padding: 25px; margin: 0; }
    .ns-offline-card { background: #ffffff; border: 2px outset #ffffff; padding: 20px; max-width: 550px; margin: 0 auto; box-shadow: 2px 2px 5px rgba(0,0,0,0.2); }
    h2 { color: #000080; margin-top: 0; font-size: 15px; border-bottom: 2px solid #000080; padding-bottom: 4px; }
    p { font-size: 11px; line-height: 1.5; }
    .btn { background: #c0c0c0; border: 2px outset #ffffff; padding: 4px 14px; font-size: 11px; font-weight: bold; cursor: pointer; }
    .btn:active { border-style: inset; }
  </style>
</head>
<body>
  <div class="ns-offline-card">
    <h2>Netscape 6 — Сеть недоступна</h2>
    <p>Не удалось подключиться к серверу при попытке открыть <b>${this.escape(url)}</b>.</p>
    <p>В настоящее время установлено автономное состояние (Offline). Для загрузки веб-страниц установите коммутируемое соединение Dial-Up.</p>
    <p style="margin-top: 20px;">
      <button class="btn" onclick="window.parent.appDialUp &amp;&amp; window.parent.appDialUp.open()">Установить подключение (Dial-Up)</button>
    </p>
  </div>
</body>
</html>`;
  }

  /* ---------------------------------------------------------- */
  /* Внутренние страницы about:                                  */
  /* ---------------------------------------------------------- */

  buildInternalPage(url) {
    if (url === 'about:bookmarks') {
      return this.internalShell(
        'Закладки',
        url,
        `<h1>Мои закладки</h1>
         <ul>${this.getBookmarks()
           .map(
             (b) =>
               `<li><a href="#" data-ns-go="${this.escape(
                 b.url
               )}">${this.escape(b.title)}</a> &mdash; <tt>${this.escape(
                 b.url
               )}</tt></li>`
           )
           .join('')}</ul>`
      );
    }

    if (url === 'about:history') {
      const log = this.getHistoryLog();
      return this.internalShell(
        'Журнал посещений',
        url,
        `<h1>Журнал посещений</h1>
         ${
           log.length
             ? `<table width="100%"><tr><th>Страница</th><th>Адрес</th></tr>${log
                 .map(
                   (h) =>
                     `<tr><td><a href="#" data-ns-go="${this.escape(
                       h.url
                     )}">${this.escape(h.title || this.hostOf(h.url))}</a></td>
                      <td><tt>${this.escape(h.url.slice(0, 60))}</tt></td></tr>`
                 )
                 .join('')}</table>`
             : '<p><i>Журнал пуст.</i></p>'
         }`
      );
    }

    // about:netscape — стартовая страница
    const links = [
      ['Википедия', 'https://ru.wikipedia.org/wiki/Windows_98'],
      ['Hacker News', 'https://news.ycombinator.com/'],
      ['Lib.ru — библиотека Мошкова', 'http://lib.ru/'],
      ['Архив интернета', 'https://web.archive.org/'],
      ['Example.com', 'https://example.com/'],
      ['Погода', 'https://html.duckduckgo.com/html/?q=погода+сегодня']
    ];

    return this.internalShell(
      'My Netscape',
      'about:netscape',
      `<center>
         <h1>My Netscape</h1>
         <p class="ns-blink">Добро пожаловать в Интернет!</p>
         <form id="ns-search-form">
           <table><tr><td>
             Искать в Сети:
             <input type="text" name="q" size="28">
             <input type="submit" value="Найти!">
           </td></tr></table>
         </form>
       </center>
       <hr>
       <h2>Каталог ссылок</h2>
       <ul>
         ${links
           .map(
             ([t, u]) =>
               `<li><a href="#" data-ns-go="${this.escape(u)}">${this.escape(
                 t
               )}</a></li>`
           )
           .join('')}
       </ul>
       <hr>
       <p><b>Совет:</b> введите любой адрес в строку «Адрес» — Netscape 6
       скачает настоящую страницу и покажет её так, как показал бы её
       браузер в 1998 году.</p>`
    );
  }

  internalShell(title, url, body) {
    return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
<meta name="ns-url" content="${this.escape(url)}">
<meta name="ns-title" content="${this.escape(title)}">
<style>
  body { background:#c0c0c0; color:#000; font-family:"Times New Roman",serif; font-size:16px;
         padding:10px; background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.35) 0 1px,transparent 1px 4px); }
  a { color:#0000ee; } a:visited { color:#551a8b; }
  h1,h2 { color:#000080; }
  hr { border:none; border-top:2px groove #fff; }
  table { border-collapse:collapse; } td,th { border:1px solid #808080; padding:3px 6px; }
  .ns-blink { animation:b 1s steps(1) infinite; color:#ff0000; font-weight:bold; }
  @keyframes b { 50% { opacity:0; } }
  input[type=text] { font-family:"Courier New",monospace; }
</style></head><body>${body}</body></html>`;
  }
}

window.appNetscape = new AppNetscape();
