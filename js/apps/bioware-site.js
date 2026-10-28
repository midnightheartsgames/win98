(function () {
  'use strict';

  const POLL_STORAGE_KEY = 'win98_bioware_poll_v1';
  const GUESTBOOK_STORAGE_KEY = 'win98_bioware_guestbook_v1';
  const COUNTER_STORAGE_KEY = 'win98_bioware_counter_v1';

  class BiowareSite {
    constructor() {
      this.currentIe = null;
      this.currentContainer = null;
      this.currentPage = 'home';
      this.currentParams = {};

      this.newsFilter = 'all';
      this.activeNewsId = 'dao-six-origins';

      this.fereldenTab = 'origins';
      this.selectedOriginId = 'hn';
      this.selectedDaoCompanionId = 'alistair';
      this.talentClassFilter = 'all';
      this.selectedAbilityId = 'fireball';
      this.bestiaryRaceFilter = 'all';
      this.codexCategoryFilter = 'all';
      this.selectedCodexId = 'grey_wardens';

      this.tacticsCompanionId = 'alistair';
      this.tacticsBehavior = 'default';
      this.tacticsSlots = [
        { cond: 'self_any', act: 'ab:shield_defense' },
        { cond: 'enemy_on_ally', act: 'ab:shield_bash' },
        { cond: 'enemy_near', act: 'ab:taunt' },
        { cond: 'self_hp25', act: 'poultice' },
        { cond: 'enemy_near', act: 'attack' }
      ];
      this.selectedRecipeId = 'r_poultice_greater';
      this.recipeBatchQty = 5;

      this.tarisTab = 'sectors';
      this.selectedSectorId = 'upper_city';
      this.selectedKotorCompanionId = 'bastila';
      this.selectedShopId = 'kebla';
      this.arsenalFilter = 'w';
      this.selectedQuestId = 'main';

      this.d20State = {
        cls: 'soldier',
        level: 5,
        attrs: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 10 },
        equip: { r: 'vibro_sword', l: '', body: 'reinforced', acc: 'power_gloves' },
        feats: ['armor_light', 'armor_medium', 'armor_heavy', 'toughness', 'dueling', 'power_attack'],
        activeFeat: 'power_attack',
        targetEnemyId: 'bendak',
        lastCombatSim: null
      };

      this.pazaakOppId = 'lena';
      this.pazaakGame = null;
    }

    getData() {
      return window.BIOWARE_DATA || {};
    }

    getDao() {
      const data = this.getData();
      return (data.getDao ? data.getDao() : globalThis.Dao98) || {};
    }

    getKotor() {
      const data = this.getData();
      return (data.getKotor ? data.getKotor() : globalThis.Kotor98) || {};
    }

    escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    parseRoute(url) {
      const raw = String(url || '').trim();
      if (!raw) return { page: 'home', params: {} };

      let pathPart = raw;
      const schemeIdx = pathPart.indexOf('://');
      if (schemeIdx >= 0) {
        pathPart = pathPart.slice(schemeIdx + 3);
      }
      const slashIdx = pathPart.indexOf('/');
      let host = slashIdx >= 0 ? pathPart.slice(0, slashIdx).toLowerCase() : pathPart.toLowerCase();
      let rest = slashIdx >= 0 ? pathPart.slice(slashIdx) : '/';

      if (host.indexOf('www.') === 0) host = host.slice(4);

      let queryStr = '';
      const qIdx = rest.indexOf('?');
      if (qIdx >= 0) {
        queryStr = rest.slice(qIdx + 1);
        rest = rest.slice(0, qIdx);
      }

      const params = {};
      if (queryStr) {
        queryStr.split('&').forEach((pair) => {
          if (!pair) return;
          const eq = pair.indexOf('=');
          if (eq >= 0) {
            const k = decodeURIComponent(pair.slice(0, eq).replace(/\+/g, ' '));
            const v = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
            params[k] = v;
          } else {
            params[decodeURIComponent(pair)] = '';
          }
        });
      }

      const cleanPath = rest.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (!cleanPath || cleanPath === 'index.html' || cleanPath === 'home') {
        return { page: 'home', params };
      }
      if (cleanPath === 'ferelden' || cleanPath === 'dao' || cleanPath === 'dao98' || cleanPath === 'origins') {
        return { page: 'ferelden', params };
      }
      if (cleanPath === 'tactics' || cleanPath === 'herbalism' || cleanPath === 'alchemy') {
        return { page: 'tactics', params };
      }
      if (cleanPath === 'taris' || cleanPath === 'kotor' || cleanPath === 'kotor98' || cleanPath === 'holocron') {
        return { page: 'taris', params };
      }
      if (cleanPath === 'd20' || cleanPath === 'pazaak' || cleanPath === 'calculator' || cleanPath === 'swoop') {
        return { page: 'd20', params };
      }
      if (cleanPath === 'studio' || cleanPath === 'edmonton' || cleanPath === 'engines' || cleanPath === 'support') {
        return { page: 'studio', params };
      }
      if (cleanPath === 'guestbook' || cleanPath === 'mailbag' || cleanPath === 'community') {
        return { page: 'guestbook', params };
      }
      if (cleanPath === 'search') {
        return { page: 'search', params };
      }
      return { page: 'home', params };
    }

    navigate(path) {
      const target = String(path || '/');
      const fullUrl = target.indexOf('http') === 0
        ? target
        : 'http://www.bioware98.com' + (target.charAt(0) === '/' ? target : '/' + target);
      if (this.currentIe && typeof this.currentIe.navigate === 'function') {
        if (this.currentWin && this.currentIe.navigate.length >= 2) {
          this.currentIe.navigate(this.currentWin, fullUrl);
        } else {
          this.currentIe.navigate(fullUrl);
        }
      } else if (typeof window !== 'undefined' && window.appIE && this.currentWin && typeof window.appIE.navigate === 'function') {
        window.appIE.navigate(this.currentWin, fullUrl);
      } else if (this.currentContainer) {
        this.render(this.currentIe, this.currentContainer, fullUrl);
      }
    }

    getPageTitle(url) {
      const parsed = this.parseRoute(url || '/');
      const map = {
        home: 'BioWare Corp. Edmonton (1998) — Dragon Age: Origins 98 & Star Wars: KOTOR 98',
        ferelden: 'Архив Ферелдена — Dragon Age: Origins 98 (BioWare Edmonton)',
        tactics: 'Матрица тактики и Травничество — Dragon Age: Origins 98',
        taris: 'Голокрон планеты Тарис — Star Wars: Knights of the Old Republic 98',
        d20: 'Калькулятор Star Wars d20 и Пазаак — BioWare Edmonton',
        studio: 'О студии BioWare Edmonton — Движки Eclipse 98 и Odyssey d20',
        guestbook: 'Почта разработчиков и Гостевая книга — BioWare Edmonton',
        search: 'Поиск по базам Ферелдена и Тариса — BioWare Edmonton'
      };
      return map[parsed.page] || map.home;
    }

    renderSite(url) {
      let parsed = { page: 'home', params: {} };
      if (typeof url === 'string') {
        parsed = this.parseRoute(url);
      } else if (url && typeof url === 'object') {
        parsed = { page: url.page || 'home', params: url.params || {} };
      }
      this.currentPage = parsed.page || 'home';
      this.currentParams = parsed.params || {};
      if (this.currentPage === 'ferelden' && this.currentParams.tab) {
        this.fereldenTab = this.currentParams.tab;
      }
      if (this.currentPage === 'taris' && this.currentParams.tab) {
        this.tarisTab = this.currentParams.tab;
      }
      const counterText = this.bumpVisitorCounter();
      const bodyHtml = this.renderPageBody(this.currentPage);
      return (
        '<div class="bw-page">' +
          '<div class="bw-wrap">' +
            this.renderHeader(counterText) +
            '<div class="bw-body">' +
              bodyHtml +
            '</div>' +
            this.renderFooter() +
          '</div>' +
        '</div>'
      );
    }

    attachEvents(win, container, ieInstance) {
      this.currentWin = win || this.currentWin;
      this.currentContainer = container || this.currentContainer;
      if (ieInstance && typeof ieInstance === 'object') {
        this.currentIe = ieInstance;
      } else if (typeof window !== 'undefined' && window.appIE) {
        this.currentIe = window.appIE;
      }
      if (this.currentContainer) {
        this.bindEvents(this.currentContainer);
      }
    }

    getVisitorCounter() {
      let count = 48291;
      try {
        const saved = parseInt(localStorage.getItem(COUNTER_STORAGE_KEY), 10);
        if (!isNaN(saved) && saved >= count) {
          count = saved;
        }
      } catch (e) {}
      return String(count).padStart(6, '0');
    }

    bumpVisitorCounter() {
      let count = 48291;
      try {
        const saved = parseInt(localStorage.getItem(COUNTER_STORAGE_KEY), 10);
        if (!isNaN(saved) && saved >= count) {
          count = saved + 1;
        }
        localStorage.setItem(COUNTER_STORAGE_KEY, String(count));
      } catch (e) {}
      return String(count).padStart(6, '0');
    }

    getGameStatusInfo(gameId) {
      const gm = window.gameManager;
      const isInstalled = !!(gm && typeof gm.isInstalled === 'function' && gm.isInstalled(gameId));

      if (isInstalled) {
        return {
          code: 'installed',
          badgeClass: 'is-green',
          badgeText: 'ДЕМОВЕРСИЯ УСТАНОВЛЕНА',
          detail: 'Исполняемый модуль готов к запуску с жёсткого диска C:\\Games.'
        };
      }
      return {
        code: 'cd',
        badgeClass: 'is-dao',
        badgeText: 'ДЕМОВЕРСИЯ НА CD «ИГРОМАНИИ»',
        detail: 'Демоверсия записана на компакт-диск журнала «Игромания». Вставьте диск в привод D: и запустите установщик.'
      };
    }

    exportTextToNotepad(fileName, content) {
      const safeName = String(fileName || 'BioWare_Note.txt').replace(/[^a-zA-Z0-9_.-]/g, '_');
      const folderPath = ['My Computer', 'C:', 'My Documents'];
      if (window.vfs && typeof window.vfs.writeFile === 'function') {
        try {
          window.vfs.writeFile(folderPath, safeName, content);
        } catch (e) {}
      }
      if (window.FileSystem && typeof window.FileSystem.writeFile === 'function') {
        try {
          window.FileSystem.writeFile(folderPath, safeName, content);
        } catch (e) {}
      }
      if (window.appNotepad && typeof window.appNotepad.open === 'function') {
        window.appNotepad.open(safeName, content, folderPath);
      } else if (window.AppRegistry && typeof window.AppRegistry.launch === 'function') {
        window.AppRegistry.launch('notepad', {
          filePath: folderPath,
          fileName: safeName,
          content: content
        });
      }
    }

    render(ieInstance, container, routeInput) {
      this.currentIe = ieInstance || this.currentIe;
      this.currentContainer = container || this.currentContainer;
      if (!this.currentContainer) return;

      let parsed = { page: 'home', params: {} };
      if (typeof routeInput === 'string') {
        parsed = this.parseRoute(routeInput);
      } else if (routeInput && typeof routeInput === 'object') {
        parsed = {
          page: routeInput.page || 'home',
          params: routeInput.params || {}
        };
      }

      this.currentPage = parsed.page || 'home';
      this.currentParams = parsed.params || {};

      if (this.currentPage === 'ferelden' && this.currentParams.tab) {
        this.fereldenTab = this.currentParams.tab;
      }
      if (this.currentPage === 'taris' && this.currentParams.tab) {
        this.tarisTab = this.currentParams.tab;
      }

      const counterText = this.bumpVisitorCounter();
      const bodyHtml = this.renderPageBody(this.currentPage);

      this.currentContainer.innerHTML =
        '<div class="bw-page">' +
          '<div class="bw-wrap">' +
            this.renderHeader(counterText) +
            '<div class="bw-body">' +
              bodyHtml +
            '</div>' +
            this.renderFooter() +
          '</div>' +
        '</div>';

      this.bindEvents(this.currentContainer);
    }

    renderHeader(counterText) {
      const navItems = [
        { id: 'home', path: '/', label: 'Главная' },
        { id: 'ferelden', path: '/ferelden', label: 'Ферелден (DAO 98)' },
        { id: 'tactics', path: '/tactics', label: 'Тактика и Травничество' },
        { id: 'taris', path: '/taris', label: 'Голокрон Тариса (KOTOR 98)' },
        { id: 'd20', path: '/d20', label: 'Калькулятор d20 и Пазаак' },
        { id: 'studio', path: '/studio', label: 'Студия Edmonton и Движки' },
        { id: 'guestbook', path: '/guestbook', label: 'Почта и Гостевая' }
      ];

      const navCells = navItems.map((item) => {
        const activeClass = this.currentPage === item.id ? ' is-active' : '';
        return '<td><button type="button" class="bw-nav-btn' + activeClass + '" data-bw-nav="' + item.path + '">' +
          this.escapeHtml(item.label) +
        '</button></td>';
      }).join('');

      const qVal = this.escapeHtml(this.currentParams.q || '');

      return (
        '<table class="bw-topstrip" cellspacing="0" cellpadding="0">' +
          '<tr>' +
            '<td><b>BIOWARE CORP. EDMONTON, ALBERTA</b> &bull; Официальный узел ролевых миров <b>Eclipse 98</b> &amp; <b>Odyssey d20</b></td>' +
            '<td align="right">Оптимизировано для Microslop Internet Explorer 4.0 &bull; 800&times;600 TrueColor</td>' +
          '</tr>' +
        '</table>' +
        '<table class="bw-masthead" cellspacing="0" cellpadding="0">' +
          '<tr>' +
            '<td width="72%">' +
              '<div class="bw-title">BIOWARE EDMONTON RPG PORTAL</div>' +
              '<div class="bw-subtitle">Dragon Age: Origins 98 (Ферелден) &bull; Star Wars: Knights of the Old Republic 98 (Тарис)</div>' +
            '</td>' +
            '<td width="28%" align="right">' +
              '<div class="bw-crest-box">' +
                '<div style="font-size:10px;color:#d8c498;margin-bottom:2px;">СЧЁТЧИК ГИЛЬДИИ ЭДМОНТОНА</div>' +
                '<span class="bw-Counter">#' + this.escapeHtml(counterText) + '</span>' +
              '</div>' +
            '</td>' +
          '</tr>' +
        '</table>' +
        '<table class="bw-navbar" cellspacing="0" cellpadding="0"><tr>' + navCells + '</tr></table>' +
        '<table class="bw-subbar" cellspacing="0" cellpadding="0">' +
          '<tr>' +
            '<td>' +
              'Быстрый переход: ' +
              '<a class="bw-link" data-bw-nav="/ferelden">6 предысторий Ферелдена</a> | ' +
              '<a class="bw-link" data-bw-nav="/tactics">Конструктор тактики ИИ</a> | ' +
              '<a class="bw-link" data-bw-nav="/taris">13 секторов Тариса</a> | ' +
              '<a class="bw-link" data-bw-nav="/d20">Стол Пазаака и d20</a>' +
            '</td>' +
            '<td align="right">' +
              '<form data-bw-search-form="1" style="margin:0;display:inline;">' +
                '<input type="text" name="q" class="bw-input" size="22" placeholder="Поиск по DAO 98 и KOTOR 98..." value="' + qVal + '">' +
                ' <button type="submit" class="bw-btn">Найти</button>' +
              '</form>' +
            '</td>' +
          '</tr>' +
        '</table>'
      );
    }

    renderFooter() {
      return (
        '<div class="bw-footer">' +
          '<div><b>&copy; 1995–1998 BioWare Corp., Edmonton, Alberta, Canada.</b> Все права защищены. Создано для операционной системы <b>Microslop Win 98 SE</b>.</div>' +
          '<div style="margin-top:4px;">' +
            '<a data-bw-nav="/">Главная</a> &bull; ' +
            '<a data-bw-nav="/ferelden">Dragon Age: Origins 98</a> &bull; ' +
            '<a data-bw-nav="/tactics">Лаборатория тактики</a> &bull; ' +
            '<a data-bw-nav="/taris">Star Wars: KOTOR 98</a> &bull; ' +
            '<a data-bw-nav="/d20">Калькулятор d20 и Пазаак</a> &bull; ' +
            '<a data-bw-nav="/studio">О студии</a> &bull; ' +
            '<a href="mailto:support@bioware98.com">support@bioware98.com</a>' +
          '</div>' +
        '</div>'
      );
    }

    renderPageBody(page) {
      if (page === 'ferelden') return this.renderFereldenPage();
      if (page === 'tactics') return this.renderTacticsPage();
      if (page === 'taris') return this.renderTarisPage();
      if (page === 'd20') return this.renderD20Page();
      if (page === 'studio') return this.renderStudioPage();
      if (page === 'guestbook') return this.renderGuestbookPage();
      if (page === 'search') return this.renderSearchPage();
      return this.renderHomePage();
    }

    renderDemoShelfCard(game) {
      const st = this.getGameStatusInfo(game.id);
      const isDao = game.id === 'dao98_demo';
      const cardClass = isDao ? 'bw-game-card is-dao' : 'bw-game-card is-kotor';
      const btnClass = isDao ? 'bw-btn bw-btn-dao' : 'bw-btn bw-btn-kotor';
      const worldLink = isDao ? '/ferelden' : '/taris';
      const calcLink = isDao ? '/tactics' : '/d20';

      let actionButtons = '';
      if (st.code === 'installed') {
        actionButtons =
          '<button type="button" class="' + btnClass + '" data-bw-launch-game="' + game.id + '">&#9654; Запустить ' + this.escapeHtml(game.exe) + '</button>';
      } else {
        actionButtons =
          '<button type="button" class="' + btnClass + '" data-bw-open-cd="' + game.id + '">Демоверсия на диске «Игромании» (' + this.escapeHtml(game.setupPath) + ')</button>';
      }

      const highlightsHtml = (game.highlights || []).map((h) => '<li>' + this.escapeHtml(h) + '</li>').join('');

      return (
        '<div class="' + cardClass + '">' +
          '<table width="100%" cellspacing="0" cellpadding="0">' +
            '<tr>' +
              '<td><b style="font-size:15px;">' + this.escapeHtml(game.title) + '</b></td>' +
              '<td align="right"><span class="bw-badge ' + st.badgeClass + '">' + this.escapeHtml(st.badgeText) + '</span></td>' +
            '</tr>' +
          '</table>' +
          '<div style="font-size:11px;color:#4a3e2e;margin:2px 0 6px 0;">' +
            '<b>' + this.escapeHtml(game.subtitle) + '</b> &bull; Модуль: <code>' + this.escapeHtml(game.exe) + '</code> &bull; Каталог: <code>' + this.escapeHtml(game.installDir) + '</code>' +
          '</div>' +
          '<table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:6px;">' +
            '<tr>' +
              '<td width="38%" valign="top" style="padding-right:8px;">' +
                '<img src="' + this.escapeHtml(game.bannerShot) + '" alt="' + this.escapeHtml(game.title) + '" width="128" height="96" style="border:1px solid #3c3222;display:block;margin-bottom:4px;">' +
                '<div style="font-size:10px;color:#524634;">Движок: ' + this.escapeHtml(game.engine) + '<br>Объём: ' + this.escapeHtml(game.size) + '</div>' +
              '</td>' +
              '<td width="62%" valign="top">' +
                '<div style="font-size:12px;margin-bottom:4px;">' + this.escapeHtml(game.pitch) + '</div>' +
                '<ul style="margin:4px 0 6px 16px;padding:0;font-size:11px;">' + highlightsHtml + '</ul>' +
                '<div style="font-size:11px;color:#3e3424;margin-bottom:6px;"><i>' + this.escapeHtml(st.detail) + '</i></div>' +
              '</td>' +
            '</tr>' +
          '</table>' +
          '<div style="border-top:1px solid #b8aa8c;padding-top:6px;">' +
            actionButtons + ' ' +
            '<button type="button" class="bw-btn" data-bw-nav="' + worldLink + '">Энциклопедия мира</button> ' +
            '<button type="button" class="bw-btn" data-bw-nav="' + calcLink + '">Интерактивный калькулятор</button>' +
          '</div>' +
        '</div>'
      );
    }

    renderHomePage() {
      const data = this.getData();
      const games = data.games || [];
      const allNews = data.news || [];
      const filteredNews = this.newsFilter === 'all'
        ? allNews
        : allNews.filter((n) => n.category === this.newsFilter);

      const selectedArticle = allNews.find((n) => n.id === this.activeNewsId) || filteredNews[0] || allNews[0];

      const shelfCells = games.map((g) => '<td width="50%" valign="top" style="padding:4px;">' + this.renderDemoShelfCard(g) + '</td>').join('');

      const filterButtons = [
        { id: 'all', label: 'Все записи (' + allNews.length + ')' },
        { id: 'dao98', label: 'Dragon Age 98' },
        { id: 'kotor98', label: 'Star Wars: KOTOR 98' },
        { id: 'engine', label: 'Движки Eclipse & Odyssey' }
      ].map((f) => {
        const cls = this.newsFilter === f.id ? 'bw-btn is-active' : 'bw-btn';
        return '<button type="button" class="' + cls + '" data-bw-news-filter="' + f.id + '">' + this.escapeHtml(f.label) + '</button>';
      }).join(' ');

      const newsCardsHtml = filteredNews.map((item) => {
        const badgeCls = item.category === 'dao98' ? 'is-dao' : item.category === 'kotor98' ? 'is-kotor' : 'is-gold';
        const isCurrent = selectedArticle && selectedArticle.id === item.id;
        return (
          '<div class="bw-news-card" style="' + (isCurrent ? 'border:2px solid #6a1e18;background-color:#fffdf6;' : '') + '">' +
            '<div>' +
              '<span class="bw-badge ' + badgeCls + '">' + this.escapeHtml(item.badge) + '</span> ' +
              '<span style="font-size:11px;color:#5a4e3c;"><b>' + this.escapeHtml(item.date) + '</b> &bull; ' + this.escapeHtml(item.author) + '</span>' +
            '</div>' +
            '<div class="bw-news-title">' + this.escapeHtml(item.title) + '</div>' +
            '<div style="margin-bottom:6px;">' + this.escapeHtml(item.summary) + '</div>' +
            '<div>' +
              '<button type="button" class="bw-btn' + (isCurrent ? ' is-active' : '') + '" data-bw-news-open="' + item.id + '">Читать полный разбор</button> ' +
              '<button type="button" class="bw-btn" data-bw-news-export="' + item.id + '">Сохранить в Блокнот (.TXT)</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      let articleReaderHtml = '';
      if (selectedArticle) {
        const paragraphs = (selectedArticle.body || []).map((p) => '<p style="margin:0 0 8px 0;">' + this.escapeHtml(p) + '</p>').join('');
        articleReaderHtml =
          '<div class="bw-panel">' +
            '<div class="bw-panel-head is-crimson">ДНЕВНИК РАЗРАБОТЧИКОВ BIOWARE EDMONTON: ' + this.escapeHtml(selectedArticle.title) + '</div>' +
            '<div class="bw-panel-body">' +
              '<div style="font-size:11px;color:#5a4c38;margin-bottom:6px;">Дата публикации: <b>' + this.escapeHtml(selectedArticle.date) + '</b> | Авторы: <b>' + this.escapeHtml(selectedArticle.author) + '</b></div>' +
              paragraphs +
              '<div style="border-top:1px solid #c6b89c;padding-top:6px;">' +
                '<button type="button" class="bw-btn" data-bw-news-export="' + selectedArticle.id + '">Выгрузить статью в C:\\My Documents (Notepad)</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      }

      return (
        '<div class="bw-panel">' +
          '<div class="bw-panel-head is-bronze">ВИТРИНА РОЛЕВЫХ МИРОВ BIOWARE EDMONTON (ДЕМОВЕРСИИ НА CD «ИГРОМАНИИ»)</div>' +
          '<div class="bw-panel-body">' +
            '<table class="bw-shelf" cellspacing="0" cellpadding="0"><tr>' + shelfCells + '</tr></table>' +
          '</div>' +
        '</div>' +
        '<table class="bw-layout">' +
          '<tr>' +
            '<td class="bw-col-main">' +
              '<div class="bw-panel">' +
                '<div class="bw-panel-head">ЖУРНАЛ РАЗРАБОТКИ И АРХИТЕКТУРНЫЕ ЗАМЕТКИ ЭДМОНТОНА</div>' +
                '<div class="bw-panel-body">' +
                  '<div style="margin-bottom:8px;">Фильтр рубрик: ' + filterButtons + '</div>' +
                  newsCardsHtml +
                '</div>' +
              '</div>' +
              articleReaderHtml +
            '</td>' +
            '<td class="bw-col-side">' +
              this.renderPollPanel() +
              this.renderQuickDatabaseStatsPanel() +
            '</td>' +
          '</tr>' +
        '</table>'
      );
    }

    getPollState() {
      const data = this.getData();
      const poll = data.poll || { options: [] };
      const counts = {};
      poll.options.forEach((o) => {
        counts[o.id] = o.baseVotes || 100;
      });
      let votedId = null;
      try {
        const raw = localStorage.getItem(POLL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.votedId) {
            votedId = parsed.votedId;
            if (counts[votedId] != null) counts[votedId] += 1;
          }
        }
      } catch (e) {}
      return { poll, counts, votedId };
    }

    renderPollPanel() {
      const st = this.getPollState();
      const total = Object.values(st.counts).reduce((a, b) => a + b, 0) || 1;

      const optionsHtml = st.poll.options.map((opt) => {
        const votes = st.counts[opt.id] || 0;
        const pct = Math.round((votes / total) * 100);
        const isVoted = st.votedId === opt.id;
        return (
          '<div style="margin-bottom:7px;padding-bottom:5px;border-bottom:1px dotted #b8aa8c;">' +
            '<label style="cursor:pointer;display:block;font-size:11px;">' +
              '<input type="radio" name="bw_poll_choice" value="' + opt.id + '"' + (isVoted ? ' checked' : '') + '> ' +
              '<b>' + this.escapeHtml(opt.label) + '</b>' +
            '</label>' +
            '<div class="bw-meter-wrap" style="margin-top:3px;">' +
              '<div class="bw-meter-bar" style="width:' + pct + '%;background-color:' + (opt.id.indexOf('dao') === 0 ? '#7c241c' : '#185478') + ';"></div>' +
            '</div>' +
            '<div style="font-size:10px;color:#4e4230;margin-top:2px;">Голосов: <b>' + votes + '</b> (' + pct + '%)' + (isVoted ? ' &bull; <b>ВАШ ВЫБОР</b>' : '') + '</div>' +
          '</div>'
        );
      }).join('');

      return (
        '<div class="bw-panel">' +
          '<div class="bw-panel-head is-holocron">ОПРОС СООБЩЕСТВА BIOWARE (1998)</div>' +
          '<div class="bw-panel-body">' +
            '<div style="font-weight:bold;margin-bottom:6px;">' + this.escapeHtml(st.poll.question || '') + '</div>' +
            '<form data-bw-poll-form="1">' +
              optionsHtml +
              '<button type="submit" class="bw-btn bw-btn-kotor">Отправить голос в Эдмонтон</button>' +
            '</form>' +
            '<div style="font-size:10px;color:#5a4e3c;margin-top:6px;">Всего учтено анкет: <b>' + total + '</b></div>' +
          '</div>' +
        '</div>'
      );
    }

    renderQuickDatabaseStatsPanel() {
      const D = this.getDao();
      const K = this.getKotor();

      const originsCount = Object.keys(D.ORIGINS || {}).length;
      const daoAbilitiesCount = Object.keys(D.AB || {}).length;
      const daoRecipesCount = (D.RECIPES || []).length;
      const daoCodexCount = Object.keys(D.CODEX || {}).length;
      const daoAreasCount = Object.keys(D.AREAS || {}).length;

      const kotorAreasCount = Object.keys(K.AREAS || {}).length;
      const kotorFeatsCount = Object.keys(K.FEATS || {}).length;
      const kotorItemsCount = Object.keys(K.ITEMS || {}).length;
      const kotorQuestsCount = Object.keys(K.QUESTS || {}).length;

      return (
        '<div class="bw-panel">' +
          '<div class="bw-panel-head is-crimson">РЕЕСТР ДАННЫХ ДВИЖКОВ НА ПОРТАЛЕ</div>' +
          '<div class="bw-panel-body">' +
            '<div style="font-size:11px;margin-bottom:6px;">Все справочники и калькуляторы этого узла напрямую подключены к таблицам данных <code>Dao98</code> и <code>Kotor98</code>:</div>' +
            '<table class="bw-table">' +
              '<tr><th colspan="2">Dragon Age: Origins 98 (Eclipse 98)</th></tr>' +
              '<tr><td>Предыстории (D.ORIGINS)</td><td><b>' + originsCount + '</b></td></tr>' +
              '<tr class="is-alt"><td>Способности и чары (D.AB)</td><td><b>' + daoAbilitiesCount + '</b></td></tr>' +
              '<tr><td>Рецепты трав и ловушек (D.RECIPES)</td><td><b>' + daoRecipesCount + '</b></td></tr>' +
              '<tr class="is-alt"><td>Статьи Кодекса (D.CODEX)</td><td><b>' + daoCodexCount + '</b></td></tr>' +
              '<tr><td>Игровые локации (D.AREAS)</td><td><b>' + daoAreasCount + '</b></td></tr>' +
              '<tr><th colspan="2">Star Wars: KOTOR 98 (Odyssey d20)</th></tr>' +
              '<tr><td>Секторы Тариса (K.AREAS)</td><td><b>' + kotorAreasCount + '</b></td></tr>' +
              '<tr class="is-alt"><td>Боевые навыки d20 (K.FEATS)</td><td><b>' + kotorFeatsCount + '</b></td></tr>' +
              '<tr><td>Экипировка и карты (K.ITEMS)</td><td><b>' + kotorItemsCount + '</b></td></tr>' +
              '<tr class="is-alt"><td>Сюжетные ветки (K.QUESTS)</td><td><b>' + kotorQuestsCount + '</b></td></tr>' +
            '</table>' +
          '</div>' +
        '</div>'
      );
    }

    renderFereldenPage() {
      const D = this.getDao();
      const tabs = [
        { id: 'origins', label: '6 Предысторий (D.ORIGINS)' },
        { id: 'companions', label: 'Спутники и Подарки' },
        { id: 'talents', label: '18 Веток Талантов и Чар' },
        { id: 'bestiary', label: 'Бестиарий Мора (D.TEMPLATES)' },
        { id: 'codex', label: 'Кодекс и Достижения' },
        { id: 'areas', label: 'Атлас Ферелдена (25 локаций)' }
      ];

      const tabBtns = tabs.map((t) => {
        const cls = this.fereldenTab === t.id ? 'bw-btn bw-btn-dao' : 'bw-btn';
        return '<button type="button" class="' + cls + '" data-bw-ferelden-tab="' + t.id + '">' + this.escapeHtml(t.label) + '</button>';
      }).join(' ');

      let sectionHtml = '';
      if (this.fereldenTab === 'companions') sectionHtml = this.renderFereldenCompanions(D);
      else if (this.fereldenTab === 'talents') sectionHtml = this.renderFereldenTalents(D);
      else if (this.fereldenTab === 'bestiary') sectionHtml = this.renderFereldenBestiary(D);
      else if (this.fereldenTab === 'codex') sectionHtml = this.renderFereldenCodex(D);
      else if (this.fereldenTab === 'areas') sectionHtml = this.renderFereldenAreas(D);
      else sectionHtml = this.renderFereldenOrigins(D);

      return (
        '<div class="bw-panel">' +
          '<div class="bw-panel-head is-crimson">АРХИВ СЕРЫХ СТРАЖЕЙ ФЕРЕЛДЕНА — DRAGON AGE: ORIGINS 98 (DAORIGINS.EXE)</div>' +
          '<div class="bw-panel-body">' +
            '<div style="margin-bottom:8px;">Раздел архива: ' + tabBtns + '</div>' +
            sectionHtml +
          '</div>' +
        '</div>'
      );
    }

    renderFereldenOrigins(D) {
      const origins = D.ORIGINS || {};
      const races = D.RACES || {};
      const classes = D.CLASSES || {};
      const intros = D.ORIGIN_INTRO || {};

      const originEntries = Object.entries(origins);
      const selected = origins[this.selectedOriginId] ? this.selectedOriginId : (originEntries[0] ? originEntries[0][0] : 'hn');
      const curOrigin = origins[selected] || {};
      const curIntros = intros[selected] || [];

      const rowsHtml = originEntries.map(([id, o], idx) => {
        const raceNames = (o.races || []).map((r) => (races[r] ? races[r].name : r)).join(', ');
        const classNames = (o.classes || []).map((c) => (classes[c] ? classes[c].name : c)).join(', ');
        const rowCls = id === selected ? 'is-selected' : (idx % 2 === 1 ? 'is-alt' : '');
        return (
          '<tr class="' + rowCls + '">' +
            '<td><b>' + this.escapeHtml(o.name) + '</b></td>' +
            '<td>' + this.escapeHtml(o.family || 'Круг магов (без фамилии)') + '</td>' +
            '<td>' + this.escapeHtml(raceNames) + '</td>' +
            '<td>' + this.escapeHtml(classNames) + '</td>' +
            '<td><code>' + this.escapeHtml((o.start || []).join(' : ')) + '</code></td>' +
            '<td><button type="button" class="bw-btn' + (id === selected ? ' is-active' : '') + '" data-bw-origin-pick="' + id + '">Подробнее</button></td>' +
          '</tr>'
        );
      }).join('');

      const introHtml = curIntros.map((sl, i) => (
        '<div style="padding:4px 6px;margin-bottom:4px;background:#f2ead8;border-left:3px solid #7c241c;">' +
          '<b>Сцена пролога ' + (i + 1) + ' (' + this.escapeHtml(sl.img) + '):</b> ' + this.escapeHtml(sl.text) +
        '</div>'
      )).join('');

      const raceRows = Object.entries(races).map(([rid, r], idx) => {
        const bonuses = Object.entries(r.attr || {}).map(([k, v]) => (D.ATTR_NAME && D.ATTR_NAME[k] ? D.ATTR_NAME[k] : k) + ' +' + v).join(', ');
        return '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '"><td><b>' + this.escapeHtml(r.name) + '</b></td><td>' + this.escapeHtml(bonuses) + (r.resist ? ', Устойчивость к магии +' + r.resist + '%' : '') + '</td><td>' + this.escapeHtml(r.desc) + '</td></tr>';
      }).join('');

      const classRows = Object.entries(classes).map(([cid, c], idx) => {
        const bonuses = Object.entries(c.attr || {}).map(([k, v]) => (D.ATTR_NAME && D.ATTR_NAME[k] ? D.ATTR_NAME[k] : k) + ' +' + v).join(', ');
        return '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '"><td><b>' + this.escapeHtml(c.name) + '</b></td><td>HP ' + c.hp + ' (+' + c.hpLv + '/ур.), ' + (c.res === 'mana' ? 'Мана ' : 'Выносливость ') + c.mp + ' (+' + c.mpLv + '/ур.)</td><td>' + this.escapeHtml(bonuses) + '</td><td>' + this.escapeHtml(c.desc) + '</td></tr>';
      }).join('');

      return (
        '<div>' +
          '<h3 style="margin:4px 0 6px 0;color:#5c1812;">Шесть судеб Ферелдена: выбор предыстории героя</h3>' +
          '<table class="bw-table">' +
            '<tr><th>Предыстория</th><th>Род / Имя</th><th>Доступные расы</th><th>Доступные классы</th><th>Стартовая зона</th><th>Досье</th></tr>' +
            rowsHtml +
          '</table>' +
          '<div class="bw-news-card">' +
            '<div class="bw-news-title">Досье предыстории: ' + this.escapeHtml(curOrigin.name || '') + (curOrigin.family ? ' (род ' + this.escapeHtml(curOrigin.family) + ')' : '') + '</div>' +
            '<p style="margin:4px 0 8px 0;">' + this.escapeHtml(curOrigin.desc || '') + '</p>' +
            introHtml +
          '</div>' +
          '<h4 style="margin:8px 0 4px 0;">Расы Тедаса (D.RACES) и базовые модификаторы характеристик</h4>' +
          '<table class="bw-table">' +
            '<tr><th>Раса</th><th>Прирост характеристик</th><th>Историческая справка</th></tr>' +
            raceRows +
          '</table>' +
          '<h4 style="margin:8px 0 4px 0;">Классы Серых Стражей (D.CLASSES)</h4>' +
          '<table class="bw-table">' +
            '<tr><th>Класс</th><th>Здоровье и Ресурс</th><th>Стартовые бонусы</th><th>Боевая роль</th></tr>' +
            classRows +
          '</table>' +
        '</div>'
      );
    }

    renderFereldenCompanions(D) {
      const companions = D.COMPANIONS || {};
      const guides = (this.getData().companionGuides) || {};
      const items = D.ITEMS || {};
      const mainIds = ['alistair', 'morrigan', 'dog', 'leliana', 'sten'];
      const tempIds = Object.keys(companions).filter((id) => mainIds.indexOf(id) < 0);

      const mainRows = mainIds.map((id, idx) => {
        const c = companions[id] || {};
        const g = guides[id] || {};
        const abNames = (c.ab || []).map((aid) => (D.AB && D.AB[aid] ? D.AB[aid].name : aid)).join(', ');
        return (
          '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
            '<td><b>' + this.escapeHtml(c.name || id) + '</b><br><span class="bw-badge is-dao">Ур. ' + (c.lvl || 1) + '</span></td>' +
            '<td>' + this.escapeHtml(g.role || c.cls || '') + '</td>' +
            '<td>' + this.escapeHtml(c.bio || '') + '</td>' +
            '<td>' + this.escapeHtml(abNames) + '</td>' +
            '<td>' + this.escapeHtml(g.bestGift || '') + '<br><i>' + this.escapeHtml(g.approvalTips || '') + '</i></td>' +
          '</tr>'
        );
      }).join('');

      const giftItems = Object.values(items).filter((it) => it && it.type === 'gift');
      const giftRows = giftItems.map((gift, idx) => {
        const likesText = Object.entries(gift.likes || {}).map(([cid, pts]) => {
          const cname = companions[cid] ? companions[cid].name : cid;
          return cname + ' (+' + pts + ')';
        }).join(', ');
        return (
          '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
            '<td><b>' + this.escapeHtml(gift.name) + '</b> (<code>' + this.escapeHtml(gift.id) + '</code>)</td>' +
            '<td>' + this.escapeHtml(likesText) + '</td>' +
            '<td>' + (gift.price || 0) + ' медн.</td>' +
            '<td>' + this.escapeHtml(gift.desc || '') + '</td>' +
          '</tr>'
        );
      }).join('');

      const tempRows = tempIds.map((id, idx) => {
        const c = companions[id] || {};
        const abNames = (c.ab || []).map((aid) => (D.AB && D.AB[aid] ? D.AB[aid].name : aid)).join(', ');
        return (
          '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
            '<td><b>' + this.escapeHtml(c.name || id) + '</b></td>' +
            '<td>' + this.escapeHtml(c.cls || '') + ' (Ур. ' + (c.lvl || 1) + ')</td>' +
            '<td>' + this.escapeHtml(abNames || 'Базовая подготовка') + '</td>' +
          '</tr>'
        );
      }).join('');

      return (
        '<div>' +
          '<h3 style="margin:4px 0 6px 0;color:#5c1812;">Постоянные спутники отряда Серого Стража</h3>' +
          '<table class="bw-table">' +
            '<tr><th>Спутник</th><th>Боевая специализация</th><th>Биография</th><th>Стартовые умения</th><th>Подарки и Одобрение</th></tr>' +
            mainRows +
          '</table>' +
          '<h4 style="margin:8px 0 4px 0;">Таблица подарков и влияния на спутников (D.ITEMS: cat="gift")</h4>' +
          '<table class="bw-table">' +
            '<tr><th>Подарок</th><th>Прирост одобрения</th><th>Цена</th><th>Описание</th></tr>' +
            giftRows +
          '</table>' +
          '<h4 style="margin:8px 0 4px 0;">Временные соратники прологов и Остагара (13 персонажей)</h4>' +
          '<table class="bw-table">' +
            '<tr><th>Имя соратника</th><th>Класс и уровень</th><th>Ключевые приёмы</th></tr>' +
            tempRows +
          '</table>' +
        '</div>'
      );
    }

    renderFereldenTalents(D) {
      const lines = D.LINES || {};
      const ab = D.AB || {};

      const filters = [
        { id: 'all', label: 'Все ветки (18)' },
        { id: 'warrior', label: 'Воин' },
        { id: 'rogue', label: 'Разбойник' },
        { id: 'mage', label: 'Маг Круга' },
        { id: 'dog', label: 'Боевой мабари' }
      ].map((f) => {
        const cls = this.talentClassFilter === f.id ? 'bw-btn is-active' : 'bw-btn';
        return '<button type="button" class="' + cls + '" data-bw-talent-cls="' + f.id + '">' + this.escapeHtml(f.label) + '</button>';
      }).join(' ');

      const lineEntries = Object.entries(lines).filter(([, ln]) => {
        if (this.talentClassFilter === 'all') return true;
        return (ln.cls || []).indexOf(this.talentClassFilter) >= 0;
      });

      const lineRows = lineEntries.map(([lid, ln], idx) => {
        const tierBtns = (ln.list || []).map((aid, tIdx) => {
          const aObj = ab[aid] || { name: aid };
          const isSel = this.selectedAbilityId === aid;
          return '<button type="button" class="bw-btn' + (isSel ? ' is-active' : '') + '" data-bw-ab-pick="' + aid + '" style="margin:1px;">' +
            'T' + (tIdx + 1) + ': ' + this.escapeHtml(aObj.name) +
          '</button>';
        }).join(' ');
        return (
          '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
            '<td><b>' + this.escapeHtml(ln.name) + '</b></td>' +
            '<td><code>' + this.escapeHtml((ln.cls || []).join(', ')) + '</code></td>' +
            '<td>' + tierBtns + '</td>' +
          '</tr>'
        );
      }).join('');

      const curAb = ab[this.selectedAbilityId] || ab.fireball || {};
      const kindMap = { act: 'Активное умение', sus: 'Поддерживаемый режим (резерв)', pas: 'Пассивный талант' };

      return (
        '<div>' +
          '<div style="margin-bottom:8px;">Фильтр по классу: ' + filters + '</div>' +
          '<div class="bw-news-card">' +
            '<div class="bw-news-title">Инспектор способности: ' + this.escapeHtml(curAb.name || this.selectedAbilityId) + ' (<code>' + this.escapeHtml(curAb.id || this.selectedAbilityId) + '</code>)</div>' +
            '<div style="font-size:11px;margin-bottom:4px;">' +
              'Тип: <b>' + this.escapeHtml(kindMap[curAb.kind] || curAb.kind || 'Активное') + '</b> | ' +
              'Стоимость/Резерв: <b>' + (curAb.cost || 0) + '</b> | ' +
              'Перезарядка: <b>' + (curAb.cd ? curAb.cd + ' сек.' : '—') + '</b> | ' +
              'Цель/Дистанция: <b>' + this.escapeHtml((curAb.tgt || 'пассив') + (curAb.range ? ' (' + curAb.range + ')' : '')) + '</b>' +
            '</div>' +
            '<div>' + this.escapeHtml(curAb.desc || 'Специальная способность существа.') + '</div>' +
          '</div>' +
          '<table class="bw-table">' +
            '<tr><th>Ветка способностей / школа магии</th><th>Классы</th><th>Ступени I–IV (уровни 1 / 3 / 5 / 7) — нажмите для разбора</th></tr>' +
            lineRows +
          '</table>' +
        '</div>'
      );
    }

    renderFereldenBestiary(D) {
      const templates = Object.values(D.TEMPLATES || {});
      const ranks = D.RANKS || {};
      const raceFilters = [
        { id: 'all', label: 'Все враги (' + templates.length + ')' },
        { id: 'darkspawn', label: 'Порождения тьмы' },
        { id: 'beast', label: 'Звери и пауки' },
        { id: 'demon', label: 'Демоны Тени' },
        { id: 'spirit', label: 'Духи' },
        { id: 'undead', label: 'Нежить' },
        { id: 'human', label: 'Люди (Хоу / Логейн / Бандиты)' },
        { id: 'dwarf', label: 'Гномы Хартии' }
      ];

      const filterBtns = raceFilters.map((rf) => {
        const cls = this.bestiaryRaceFilter === rf.id ? 'bw-btn is-active' : 'bw-btn';
        return '<button type="button" class="' + cls + '" data-bw-bestiary-race="' + rf.id + '">' + this.escapeHtml(rf.label) + '</button>';
      }).join(' ');

      const list = templates.filter((t) => this.bestiaryRaceFilter === 'all' || t.race === this.bestiaryRaceFilter);

      const rows = list.map((t, idx) => {
        const rankInfo = ranks[t.rank] || [t.rank || 'Обычный', 1];
        const abNames = (t.ab || []).map((aid) => (D.AB && D.AB[aid] ? D.AB[aid].name : aid)).join(', ');
        return (
          '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
            '<td><b>' + this.escapeHtml(t.name) + '</b></td>' +
            '<td>' + this.escapeHtml(t.race || '') + '</td>' +
            '<td>' + this.escapeHtml(rankInfo[0]) + ' (Ур. ' + (t.lvl || 1) + ')</td>' +
            '<td>' + (t.hp ? t.hp + ' HP' : 'По классу (' + (t.cls || 'warrior') + ')') + '</td>' +
            '<td>' + this.escapeHtml(abNames || 'Обычная атака') + '</td>' +
            '<td>' + (t.xp || 0) + ' XP</td>' +
          '</tr>'
        );
      }).join('');

      return (
        '<div>' +
          '<div style="margin-bottom:8px;">Фильтр бестиария: ' + filterBtns + '</div>' +
          '<table class="bw-table">' +
            '<tr><th>Существо / Противник</th><th>Категория</th><th>Ранг и Уровень</th><th>Здоровье / Класс</th><th>Способности в бою</th><th>Награда за победу</th></tr>' +
            rows +
          '</table>' +
        '</div>'
      );
    }

    renderFereldenCodex(D) {
      const codexMap = D.CODEX || {};
      const entries = Object.values(codexMap);
      const categories = ['all'];
      entries.forEach((e) => {
        if (e.cat && categories.indexOf(e.cat) < 0) categories.push(e.cat);
      });

      const catBtns = categories.map((c) => {
        const cls = this.codexCategoryFilter === c ? 'bw-btn is-active' : 'bw-btn';
        const label = c === 'all' ? 'Все разделы (' + entries.length + ')' : c;
        return '<button type="button" class="' + cls + '" data-bw-codex-cat="' + this.escapeHtml(c) + '">' + this.escapeHtml(label) + '</button>';
      }).join(' ');

      const filtered = this.codexCategoryFilter === 'all'
        ? entries
        : entries.filter((e) => e.cat === this.codexCategoryFilter);

      const cur = codexMap[this.selectedCodexId] || filtered[0] || entries[0] || {};

      const listRows = filtered.map((e, idx) => (
        '<tr class="' + (e.id === cur.id ? 'is-selected' : (idx % 2 === 1 ? 'is-alt' : '')) + '">' +
          '<td><b>' + this.escapeHtml(e.title) + '</b></td>' +
          '<td>' + this.escapeHtml(e.cat) + '</td>' +
          '<td><button type="button" class="bw-btn" data-bw-codex-pick="' + e.id + '">Открыть свиток</button></td>' +
        '</tr>'
      )).join('');

      const achRows = Object.entries(D.ACHIEVEMENTS || {}).map(([aid, a], idx) => (
        '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
          '<td><code>' + this.escapeHtml(aid) + '</code></td>' +
          '<td><b>' + this.escapeHtml(a.name) + '</b></td>' +
          '<td>' + this.escapeHtml(a.desc) + '</td>' +
        '</tr>'
      )).join('');

      return (
        '<div>' +
          '<div style="margin-bottom:8px;">Категория Кодекса: ' + catBtns + '</div>' +
          '<div class="bw-news-card">' +
            '<div class="bw-news-title">Свиток Кодекса: ' + this.escapeHtml(cur.title || '') + ' (' + this.escapeHtml(cur.cat || '') + ')</div>' +
            '<p style="margin:4px 0;">' + this.escapeHtml(cur.text || '') + '</p>' +
          '</div>' +
          '<table class="bw-table">' +
            '<tr><th>Заголовок записи</th><th>Раздел</th><th>Чтение</th></tr>' +
            listRows +
          '</table>' +
          '<h4 style="margin:8px 0 4px 0;">Глобальные достижения профиля Серых Стражей (D.ACHIEVEMENTS)</h4>' +
          '<table class="bw-table">' +
            '<tr><th>Код</th><th>Достижение</th><th>Условие получения в DAORIGINS.EXE</th></tr>' +
            achRows +
          '</table>' +
        '</div>'
      );
    }

    renderFereldenAreas(D) {
      const areas = D.AREAS || {};
      const world = D.WORLD || {};
      const areaRows = Object.entries(areas).map(([aid, a], idx) => (
        '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
          '<td><code>' + this.escapeHtml(aid) + '</code></td>' +
          '<td><b>' + this.escapeHtml(a.name || aid) + '</b></td>' +
          '<td>' + (a.w || 60) + ' &times; ' + (a.h || 60) + '</td>' +
          '<td>' + this.escapeHtml(typeof a.theme === 'string' ? a.theme : 'динамическая (день/ночь)') + '</td>' +
        '</tr>'
      )).join('');

      const worldRows = Object.entries(world).map(([wid, w], idx) => (
        '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
          '<td><b>' + this.escapeHtml(w.name) + '</b></td>' +
          '<td>(' + Math.round((w.x || 0) * 100) + '%, ' + Math.round((w.y || 0) * 100) + '%)</td>' +
          '<td>' + this.escapeHtml(w.locked || 'Открыта для перехода отряда') + '</td>' +
        '</tr>'
      )).join('');

      return (
        '<div>' +
          '<h3 style="margin:4px 0 6px 0;color:#5c1812;">Узлы стратегической карты Ферелдена (D.WORLD)</h3>' +
          '<table class="bw-table">' +
            '<tr><th>Точка на карте</th><th>Координаты</th><th>Статус в первой главе Мора</th></tr>' +
            worldRows +
          '</table>' +
          '<h3 style="margin:8px 0 6px 0;color:#5c1812;">Все 25 тактических локаций прологов, Остагара и Лотеринга (D.AREAS)</h3>' +
          '<table class="bw-table">' +
            '<tr><th>ID зоны</th><th>Название локации</th><th>Размер сетки</th><th>Визуальная тема</th></tr>' +
            areaRows +
          '</table>' +
        '</div>'
      );
    }

    getPresetTacticsForCompanion(compId) {
      if (compId === 'morrigan') {
        return {
          behavior: 'ranged',
          slots: [
            { cond: 'self_any', act: 'ab:rock_armor' },
            { cond: 'enemy_ranged', act: 'ab:winters_grasp' },
            { cond: 'self_surround', act: 'ab:mind_blast' },
            { cond: 'enemy_strong', act: 'ab:stonefist' },
            { cond: 'self_mp25', act: 'lyrium' }
          ]
        };
      }
      if (compId === 'dog') {
        return {
          behavior: 'aggressive',
          slots: [
            { cond: 'enemy_ranged', act: 'ab:overwhelm' },
            { cond: 'self_surround', act: 'ab:howl' },
            { cond: 'enemy_strong', act: 'ab:shred' },
            { cond: 'enemy_near', act: 'attack' }
          ]
        };
      }
      if (compId === 'leliana') {
        return {
          behavior: 'ranged',
          slots: [
            { cond: 'self_any', act: 'ab:aim' },
            { cond: 'enemy_on_me', act: 'ab:pinning_shot' },
            { cond: 'ally_hp50', act: 'poultice' },
            { cond: 'leader_target', act: 'attack' }
          ]
        };
      }
      if (compId === 'sten') {
        return {
          behavior: 'aggressive',
          slots: [
            { cond: 'self_any', act: 'ab:indomitable' },
            { cond: 'enemy_strong', act: 'ab:pommel_strike' },
            { cond: 'self_hp50', act: 'poultice' },
            { cond: 'enemy_near', act: 'attack' }
          ]
        };
      }
      return {
        behavior: 'defensive',
        slots: [
          { cond: 'self_any', act: 'ab:shield_defense' },
          { cond: 'enemy_on_ally', act: 'ab:shield_bash' },
          { cond: 'enemy_near', act: 'ab:taunt' },
          { cond: 'self_hp25', act: 'poultice' },
          { cond: 'enemy_near', act: 'attack' }
        ]
      };
    }

    renderTacticsPage() {
      const D = this.getDao();
      const companions = D.COMPANIONS || {};
      const conds = D.TAC_COND || {};
      const baseActs = D.TAC_ACT_BASE || {};
      const behaviors = D.BEHAVIORS || {};
      const ab = D.AB || {};
      const recipes = D.RECIPES || [];
      const items = D.ITEMS || {};
      const skills = D.SKILLS || {};

      const mainCompIds = ['alistair', 'morrigan', 'dog', 'leliana', 'sten'];
      const curComp = companions[this.tacticsCompanionId] || companions.alistair || { name: 'Алистер', cls: 'warrior', ab: [] };

      const compSelectHtml = mainCompIds.map((cid) => {
        const c = companions[cid] || { name: cid };
        return '<option value="' + cid + '"' + (cid === this.tacticsCompanionId ? ' selected' : '') + '>' +
          this.escapeHtml(c.name + ' (' + (D.CLASSES && D.CLASSES[c.cls] ? D.CLASSES[c.cls].name : c.cls) + ')') +
        '</option>';
      }).join('');

      const behaviorSelectHtml = Object.entries(behaviors).map(([bid, bname]) => (
        '<option value="' + bid + '"' + (bid === this.tacticsBehavior ? ' selected' : '') + '>' + this.escapeHtml(bname) + '</option>'
      )).join('');

      const classAbIds = [];
      Object.values(D.LINES || {}).forEach((ln) => {
        if ((ln.cls || []).indexOf(curComp.cls) >= 0 || (curComp.dog && (ln.cls || []).indexOf('dog') >= 0)) {
          (ln.list || []).forEach((aid) => {
            if (ab[aid] && ab[aid].kind !== 'pas' && classAbIds.indexOf(aid) < 0) classAbIds.push(aid);
          });
        }
      });

      const buildCondOptions = (selectedCond) => Object.entries(conds).map(([cid, cObj]) => (
        '<option value="' + cid + '"' + (cid === selectedCond ? ' selected' : '') + '>' + this.escapeHtml(cObj.name) + '</option>'
      )).join('');

      const buildActOptions = (selectedAct) => {
        const baseHtml = Object.entries(baseActs).map(([aid, aname]) => (
          '<option value="' + aid + '"' + (aid === selectedAct ? ' selected' : '') + '>' + this.escapeHtml(aname) + '</option>'
        )).join('');
        const abHtml = classAbIds.map((aid) => {
          const val = 'ab:' + aid;
          const aObj = ab[aid] || { name: aid };
          return '<option value="' + val + '"' + (val === selectedAct ? ' selected' : '') + '>Способность: ' + this.escapeHtml(aObj.name) + '</option>';
        }).join('');
        return baseHtml + abHtml;
      };

      const slotRowsHtml = this.tacticsSlots.map((slot, idx) => {
        const condObj = conds[slot.cond] || { name: slot.cond, who: 'enemy' };
        let actLabel = baseActs[slot.act] || slot.act;
        if (slot.act.indexOf('ab:') === 0) {
          const aid = slot.act.slice(3);
          actLabel = 'Способность: ' + (ab[aid] ? ab[aid].name : aid);
        }
        return (
          '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
            '<td><b>#' + (idx + 1) + '</b></td>' +
            '<td>' +
              '<select class="bw-select" data-bw-tac-cond="' + idx + '">' + buildCondOptions(slot.cond) + '</select>' +
            '</td>' +
            '<td>' +
              '<select class="bw-select" data-bw-tac-act="' + idx + '">' + buildActOptions(slot.act) + '</select>' +
            '</td>' +
            '<td><code>' + this.escapeHtml(condObj.who || 'self') + '</code> &rarr; ' + this.escapeHtml(actLabel) + '</td>' +
            '<td><button type="button" class="bw-btn" data-bw-tac-del="' + idx + '">Удалить</button></td>' +
          '</tr>'
        );
      }).join('');

      const curRecipe = recipes.find((r) => r.id === this.selectedRecipeId) || recipes[0];
      const qty = Math.max(1, Math.min(50, parseInt(this.recipeBatchQty, 10) || 1));

      const recipeOptionsHtml = recipes.map((r) => {
        const outItem = items[r.out] || { name: r.out };
        const skName = skills[r.skill] ? skills[r.skill].name : r.skill;
        return '<option value="' + r.id + '"' + (curRecipe && curRecipe.id === r.id ? ' selected' : '') + '>' +
          this.escapeHtml(outItem.name + ' (' + skName + ', ранг ' + r.rank + ')') +
        '</option>';
      }).join('');

      let recipeBreakdownHtml = '';
      if (curRecipe) {
        const outItem = items[curRecipe.out] || { name: curRecipe.out, price: 0, desc: '' };
        const skObj = skills[curRecipe.skill] || { name: curRecipe.skill, ranks: [] };
        let unitReagentCost = 0;
        const ingRows = (curRecipe.need || []).map(([matId, count], idx) => {
          const mItem = items[matId] || { name: matId, price: 10, desc: '' };
          const totalNeeded = count * qty;
          const lineCost = (mItem.price || 0) * totalNeeded;
          unitReagentCost += (mItem.price || 0) * count;
          return (
            '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
              '<td><b>' + this.escapeHtml(mItem.name) + '</b> (<code>' + this.escapeHtml(matId) + '</code>)</td>' +
              '<td>' + count + ' шт.</td>' +
              '<td><b>' + totalNeeded + ' шт.</b></td>' +
              '<td>' + (mItem.price || 0) + ' медн.</td>' +
              '<td><b>' + lineCost + ' медн.</b></td>' +
            '</tr>'
          );
        }).join('');

        const totalCraftCost = unitReagentCost * qty;
        const totalShopValue = (outItem.price || 0) * qty;
        const savings = totalShopValue - totalCraftCost;

        recipeBreakdownHtml =
          '<div class="bw-news-card" style="margin-top:6px;">' +
            '<div class="bw-news-title">Спецификация рецепта: ' + this.escapeHtml(outItem.name) + ' &times; ' + qty + ' шт.</div>' +
            '<div style="font-size:11px;margin-bottom:6px;">' +
              'Требуемый навык: <b>' + this.escapeHtml(skObj.name) + ' — ранг ' + curRecipe.rank + ' (' + this.escapeHtml((skObj.ranks && skObj.ranks[curRecipe.rank - 1]) || '') + ')</b> | ' +
              'Эффект: ' + this.escapeHtml(outItem.desc || '') +
            '</div>' +
            '<table class="bw-table">' +
              '<tr><th>Реагент / Ингредиент</th><th>На 1 ед.</th><th>На партию (' + qty + ' шт.)</th><th>Цена реагента</th><th>Сумма</th></tr>' +
              ingRows +
            '</table>' +
            '<div style="font-size:11px;">' +
              'Себестоимость реагентов партии: <b>' + totalCraftCost + ' медн.</b> &bull; ' +
              'Розничная цена у купцов: <b>' + totalShopValue + ' медн.</b> &bull; ' +
              'Экономия отряда: <b style="color:#145a28;">' + (savings >= 0 ? '+' + savings : savings) + ' медн.</b>' +
            '</div>' +
          '</div>';
      }

      return (
        '<div>' +
          '<div class="bw-panel">' +
            '<div class="bw-panel-head is-crimson">КОНСТРУКТОР МАТРИЦЫ ТАКТИКИ ОТРЯДА (DRAGON AGE: ORIGINS 98 — D.TAC_COND)</div>' +
            '<div class="bw-panel-body">' +
              '<div style="margin-bottom:8px;">' +
                'Спутник: <select class="bw-select" data-bw-tac-companion="1">' + compSelectHtml + '</select> ' +
                'Поведение ИИ: <select class="bw-select" data-bw-tac-behavior="1">' + behaviorSelectHtml + '</select> ' +
                '<button type="button" class="bw-btn" data-bw-tac-preset="1">Загрузить эталон BioWare</button> ' +
                '<button type="button" class="bw-btn" data-bw-tac-add="1">+ Добавить слот тактики</button> ' +
                '<button type="button" class="bw-btn bw-btn-dao" data-bw-tac-export="1">Экспорт матрицы в Блокнот (.TXT)</button>' +
              '</div>' +
              '<table class="bw-table">' +
                '<tr><th>Приоритет</th><th>Условие (D.TAC_COND)</th><th>Приказ / Способность</th><th>Интерпретация ИИ</th><th>Действие</th></tr>' +
                slotRowsHtml +
              '</table>' +
            '</div>' +
          '</div>' +
          '<div class="bw-panel">' +
            '<div class="bw-panel-head is-bronze">КАЛЬКУЛЯТОР ТРАВНИЧЕСТВА, ЯДОВ И ЛОВУШЕК (D.RECIPES — 12 РЕЦЕПТОВ)</div>' +
            '<div class="bw-panel-body">' +
              '<div>' +
                'Рецепт: <select class="bw-select" data-bw-recipe-pick="1">' + recipeOptionsHtml + '</select> ' +
                'Размер партии (шт.): <input type="number" class="bw-input" style="width:55px;" min="1" max="50" value="' + qty + '" data-bw-recipe-qty="1"> ' +
                '<button type="button" class="bw-btn" data-bw-recipe-recalc="1">Пересчитать реагенты</button>' +
              '</div>' +
              recipeBreakdownHtml +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    renderTarisPage() {
      const K = this.getKotor();
      const tabs = [
        { id: 'sectors', label: '13 Секторов Тариса (K.AREAS)' },
        { id: 'crew', label: 'Экипаж «Эбенового ястреба» (6)' },
        { id: 'duel', label: 'Дуэльный ринг Аджуура и Боссы' },
        { id: 'shops', label: '4 Торговца Тариса (K.SHOPS)' },
        { id: 'arsenal', label: 'Арсенал и Броня (K.ITEMS)' },
        { id: 'quests', label: 'Журнал заданий (K.QUESTS)' }
      ];

      const tabBtns = tabs.map((t) => {
        const cls = this.tarisTab === t.id ? 'bw-btn bw-btn-kotor' : 'bw-btn';
        return '<button type="button" class="' + cls + '" data-bw-taris-tab="' + t.id + '">' + this.escapeHtml(t.label) + '</button>';
      }).join(' ');

      let contentHtml = '';
      if (this.tarisTab === 'crew') contentHtml = this.renderTarisCrew(K);
      else if (this.tarisTab === 'duel') contentHtml = this.renderTarisDuelAndBosses(K);
      else if (this.tarisTab === 'shops') contentHtml = this.renderTarisShops(K);
      else if (this.tarisTab === 'arsenal') contentHtml = this.renderTarisArsenal(K);
      else if (this.tarisTab === 'quests') contentHtml = this.renderTarisQuests(K);
      else contentHtml = this.renderTarisSectors(K);

      return (
        '<div class="bw-panel">' +
          '<div class="bw-panel-head is-holocron">ГОЛОКРОН ПЛАНЕТЫ ТАРИС — STAR WARS: KNIGHTS OF THE OLD REPUBLIC 98 (KOTOR.EXE)</div>' +
          '<div class="bw-panel-body">' +
            '<div style="margin-bottom:8px;">Раздел голокрона: ' + tabBtns + '</div>' +
            contentHtml +
          '</div>' +
        '</div>'
      );
    }

    renderTarisSectors(K) {
      const areas = K.AREAS || {};
      const entries = Object.entries(areas);
      const selectedId = areas[this.selectedSectorId] ? this.selectedSectorId : (entries[0] ? entries[0][0] : 'upper_city');
      const cur = areas[selectedId] || {};

      const rows = entries.map(([id, a], idx) => {
        const npcCount = (a.npcs || []).length;
        const enemyCount = (a.enemies || []).length;
        const contCount = (a.containers || []).length;
        const isSel = id === selectedId;
        return (
          '<tr class="' + (isSel ? 'is-selected' : (idx % 2 === 1 ? 'is-alt' : '')) + '">' +
            '<td><code>' + this.escapeHtml(id) + '</code></td>' +
            '<td><b>' + this.escapeHtml(a.n || id) + '</b></td>' +
            '<td>' + this.escapeHtml(a.theme || '') + '</td>' +
            '<td>' + (a.w || 0) + ' &times; ' + (a.h || 0) + '</td>' +
            '<td>NPC: ' + npcCount + ' | Враги: ' + enemyCount + ' | Контейнеры: ' + contCount + '</td>' +
            '<td><button type="button" class="bw-btn' + (isSel ? ' is-active' : '') + '" data-bw-sector-pick="' + id + '">Скан сектора</button></td>' +
          '</tr>'
        );
      }).join('');

      const npcNames = (cur.npcs || []).map((n) => n.n || n.id).join(', ') || 'Нет мирных NPC';
      const enemyList = (cur.enemies || []).map((e) => {
        const tpl = K.TEMPLATES && K.TEMPLATES[e.t];
        return tpl ? tpl.n : e.t;
      });
      const uniqueEnemies = Array.from(new Set(enemyList)).join(', ') || 'Безопасная зона (без патрулей)';
      const exitsList = (cur.doors || []).filter((d) => d.to).map((d) => d.label || d.to).join(' &bull; ') || 'Внутренние переходы';

      return (
        '<div>' +
          '<div class="bw-news-card">' +
            '<div class="bw-news-title">Тактический скан сектора: ' + this.escapeHtml(cur.n || selectedId) + ' (<code>' + this.escapeHtml(selectedId) + '</code>)</div>' +
            '<div style="font-size:11px;margin-bottom:4px;">' +
              'Размер карты: <b>' + (cur.w || 0) + '&times;' + (cur.h || 0) + ' тайлов</b> | ' +
              'Атмосферный профиль: <code>' + this.escapeHtml(cur.theme || '') + '</code> | ' +
              'Контейнеров с трофеями: <b>' + ((cur.containers || []).length) + '</b>' +
            '</div>' +
            '<div style="font-size:11px;margin-bottom:3px;"><b>Ключевые персонажи (NPC):</b> ' + this.escapeHtml(npcNames) + '</div>' +
            '<div style="font-size:11px;margin-bottom:3px;"><b>Противники в секторе:</b> ' + this.escapeHtml(uniqueEnemies) + '</div>' +
            '<div style="font-size:11px;"><b>Шлюзы и выходы:</b> ' + exitsList + '</div>' +
          '</div>' +
          '<table class="bw-table">' +
            '<tr><th>Код зоны</th><th>Название сектора Тариса</th><th>Тема</th><th>Сетка</th><th>Объекты</th><th>Обзор</th></tr>' +
            rows +
          '</table>' +
        '</div>'
      );
    }

    renderTarisCrew(K) {
      const partyIds = K.PARTY_IDS || ['carth', 'mission', 'zaalbar', 'bastila', 't3', 'canderous'];
      const templates = K.TEMPLATES || {};
      const classes = K.CLASSES || {};
      const guides = (this.getData().kotorCompanionGuides) || {};

      const rows = partyIds.map((id, idx) => {
        const t = templates[id] || { n: id, attrs: {} };
        const cl = classes[t.cls] || { n: t.cls };
        const g = guides[id] || {};
        const at = t.attrs || {};
        const attrStr = 'СИЛ ' + (at.str || 10) + ', ЛОВ ' + (at.dex || 10) + ', ТЕЛ ' + (at.con || 10) + ', ИНТ ' + (at.int || 10) + ', МДР ' + (at.wis || 10) + ', ОБА ' + (at.cha || 10);
        const featNames = (t.feats || []).map((fid) => (K.FEATS && K.FEATS[fid] ? K.FEATS[fid].n : fid)).join(', ');
        const powerNames = (t.powers || []).map((pid) => (K.POWERS && K.POWERS[pid] ? K.POWERS[pid].n : pid)).join(', ');

        return (
          '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
            '<td><b>' + this.escapeHtml(t.n) + '</b><br><span class="bw-badge is-kotor">' + this.escapeHtml(cl.n || t.cls) + '</span></td>' +
            '<td>' + this.escapeHtml(g.role || '') + '<br><i>' + this.escapeHtml(g.origin || '') + '</i></td>' +
            '<td><code>' + this.escapeHtml(attrStr) + '</code></td>' +
            '<td>' + this.escapeHtml(featNames || 'Дроид-модули') + (powerNames ? '<br><b>Сила:</b> ' + this.escapeHtml(powerNames) : '') + '</td>' +
            '<td>' + this.escapeHtml(g.signatureGear || '') + '<br><i>' + this.escapeHtml(g.buildTip || '') + '</i></td>' +
          '</tr>'
        );
      }).join('');

      const powerRows = Object.entries(K.POWERS || {}).map(([pid, p], idx) => (
        '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
          '<td><b>' + this.escapeHtml(p.n) + '</b> (<code>' + this.escapeHtml(pid) + '</code>)</td>' +
          '<td>' + (p.fp || 0) + ' FP</td>' +
          '<td>' + this.escapeHtml(p.target || '') + (p.save ? ' (спасбросок: ' + p.save + ')' : '') + '</td>' +
          '<td>' + this.escapeHtml(p.desc || '') + '</td>' +
        '</tr>'
      )).join('');

      return (
        '<div>' +
          '<h3 style="margin:4px 0 6px 0;color:#0e3850;">Спутники экипажа «Эбенового ястреба» на Тарисе (K.PARTY_IDS)</h3>' +
          '<table class="bw-table">' +
            '<tr><th>Спутник</th><th>Роль и Происхождение</th><th>Характеристики d20</th><th>Навыки и Сила</th><th>Штатное вооружение и совет BioWare</th></tr>' +
            rows +
          '</table>' +
          '<h4 style="margin:8px 0 4px 0;">Дисциплины Силы Ордена джедаев (K.POWERS)</h4>' +
          '<table class="bw-table">' +
            '<tr><th>Способность Силы</th><th>Стоимость FP</th><th>Цель / Спасбросок</th><th>Описание эффекта</th></tr>' +
            powerRows +
          '</table>' +
        '</div>'
      );
    }

    renderTarisDuelAndBosses(K) {
      const duelRing = (this.getData().duelRing) || [];
      const templates = K.TEMPLATES || {};

      const duelRows = duelRing.map((d, idx) => {
        const tpl = templates[d.id] || {};
        const wep = tpl.equip && tpl.equip.r && K.ITEMS && K.ITEMS[tpl.equip.r] ? K.ITEMS[tpl.equip.r].n : 'Оружие арены';
        return (
          '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
            '<td><b>' + this.escapeHtml(d.title) + '</b></td>' +
            '<td>Ур. ' + (tpl.lvl || 2) + '</td>' +
            '<td>' + this.escapeHtml(wep) + '</td>' +
            '<td><b>' + this.escapeHtml(d.prize) + '</b></td>' +
            '<td>' + this.escapeHtml(d.tactic) + '</td>' +
          '</tr>'
        );
      }).join('');

      const bossIds = ['gamorrean_chief', 'kandon', 'brejik', 'rancor', 'sith_governor', 'calo', 'davik'];
      const bossRows = bossIds.map((bid, idx) => {
        const b = templates[bid] || { n: bid, attrs: {} };
        const wep = b.equip && b.equip.r && K.ITEMS && K.ITEMS[b.equip.r] ? K.ITEMS[b.equip.r].n : 'Когти';
        const arm = b.equip && b.equip.body && K.ITEMS && K.ITEMS[b.equip.body] ? K.ITEMS[b.equip.body].n : 'Естественная защита';
        return (
          '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
            '<td><b>' + this.escapeHtml(b.n) + '</b> (<code>' + this.escapeHtml(bid) + '</code>)</td>' +
            '<td>Ур. ' + (b.lvl || 1) + '</td>' +
            '<td>СИЛ ' + (b.attrs && b.attrs.str) + ' / ЛОВ ' + (b.attrs && b.attrs.dex) + ' / ТЕЛ ' + (b.attrs && b.attrs.con) + '</td>' +
            '<td>' + this.escapeHtml(wep) + ' + ' + this.escapeHtml(arm) + '</td>' +
            '<td>' + (b.cr || 0) + ' XP</td>' +
          '</tr>'
        );
      }).join('');

      return (
        '<div>' +
          '<h3 style="margin:4px 0 6px 0;color:#0e3850;">Лестница гладиаторов Дуэльного ринга хатта Аджуура (Верхний город)</h3>' +
          '<table class="bw-table">' +
            '<tr><th>Ранг и Боец</th><th>Уровень</th><th>Вооружение</th><th>Гонорар</th><th>Тактика победы</th></tr>' +
            duelRows +
          '</table>' +
          '<h3 style="margin:8px 0 6px 0;color:#0e3850;">Главные боссы Тариса (K.TEMPLATES: boss=true)</h3>' +
          '<table class="bw-table">' +
            '<tr><th>Босс</th><th>Уровень</th><th>Ключевые атрибуты</th><th>Экипировка</th><th>Опыт (XP)</th></tr>' +
            bossRows +
          '</table>' +
        '</div>'
      );
    }

    renderTarisShops(K) {
      const shops = K.SHOPS || {};
      const items = K.ITEMS || {};
      const shopEntries = Object.entries(shops);
      const selectedShopId = shops[this.selectedShopId] ? this.selectedShopId : (shopEntries[0] ? shopEntries[0][0] : 'kebla');
      const curShop = shops[selectedShopId] || { n: selectedShopId, markup: 1.0, buy: 0.35, stock: {} };

      const shopBtns = shopEntries.map(([sid, s]) => {
        const cls = sid === selectedShopId ? 'bw-btn bw-btn-kotor' : 'bw-btn';
        return '<button type="button" class="' + cls + '" data-bw-shop-pick="' + sid + '">' + this.escapeHtml(s.n) + '</button>';
      }).join(' ');

      const stockRows = Object.entries(curShop.stock || {}).map(([itemId, qty], idx) => {
        const it = items[itemId] || { n: itemId, cost: 0, desc: '' };
        const buyPrice = Math.max(1, Math.round((it.cost || 0) * (curShop.markup || 1)));
        const qtyText = qty < 0 ? 'Неограниченно (&infin;)' : qty + ' шт.';
        return (
          '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
            '<td><b>' + this.escapeHtml(it.n) + '</b> (<code>' + this.escapeHtml(itemId) + '</code>)</td>' +
            '<td>' + qtyText + '</td>' +
            '<td><b>' + buyPrice + ' кр.</b> (база: ' + (it.cost || 0) + ')</td>' +
            '<td>' + this.escapeHtml(it.desc || (it.card ? 'Карта пазаака для побочной колоды' : 'Штатное снаряжение Тариса')) + '</td>' +
          '</tr>'
        );
      }).join('');

      return (
        '<div>' +
          '<div style="margin-bottom:8px;">Выберите лавку Тариса: ' + shopBtns + '</div>' +
          '<div style="font-size:11px;margin-bottom:6px;">' +
            'Торговец: <b>' + this.escapeHtml(curShop.n) + '</b> &bull; ' +
            'Наценка продажи: <b>' + Math.round((curShop.markup || 1) * 100) + '%</b> &bull; ' +
            'Скупка трофеев у игрока: <b>' + Math.round((curShop.buy || 0.35) * 100) + '%</b>' +
          '</div>' +
          '<table class="bw-table">' +
            '<tr><th>Наименование товара</th><th>Запас в лавке</th><th>Цена с учётом наценки</th><th>Описание</th></tr>' +
            stockRows +
          '</table>' +
        '</div>'
      );
    }

    renderTarisArsenal(K) {
      const items = Object.values(K.ITEMS || {});
      const cats = [
        { id: 'w', label: 'Оружие (бластеры, виброклинки, световой меч)' },
        { id: 'a', label: 'Броня и одеяния джедаев' },
        { id: 'x', label: 'Импланты, пояса и визоры' },
        { id: 'u', label: 'Гранаты, аптечки, стимуляторы и шипы' },
        { id: 'q', label: 'Квестовые реликвии Тариса' }
      ];

      const catBtns = cats.map((c) => {
        const cls = this.arsenalFilter === c.id ? 'bw-btn is-active' : 'bw-btn';
        return '<button type="button" class="' + cls + '" data-bw-arsenal-cat="' + c.id + '">' + this.escapeHtml(c.label) + '</button>';
      }).join(' ');

      const filtered = items.filter((it) => it.k === this.arsenalFilter && !it.natural);

      const rows = filtered.map((it, idx) => {
        let spec = '';
        if (it.k === 'w') {
          const cr = it.cr || [20, 2];
          spec = 'Урон ' + it.dmg[0] + 'd' + it.dmg[1] + ' (' + (it.dt || 'kinetic') + '), Крит ' + cr[0] + '-20&times;' + cr[1] + (it.ab ? ', Атака +' + it.ab : '') + (it.db ? ', Урон +' + it.db : '');
        } else if (it.k === 'a') {
          spec = 'Защита +' + it.def + ', Макс. бонус ЛОВ +' + it.maxDex + ' (класс: ' + it.prof + ')';
        } else if (it.k === 'x') {
          spec = JSON.stringify(it.bonus || {});
        } else if (it.k === 'u') {
          spec = it.desc || '';
        } else {
          spec = 'Сюжетный предмет';
        }
        return (
          '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
            '<td><b>' + this.escapeHtml(it.n) + '</b> (<code>' + this.escapeHtml(it.id) + '</code>)</td>' +
            '<td>' + spec + '</td>' +
            '<td>' + (it.cost || 0) + ' кр.</td>' +
            '<td>' + this.escapeHtml(it.desc || '—') + '</td>' +
          '</tr>'
        );
      }).join('');

      return (
        '<div>' +
          '<div style="margin-bottom:8px;">Категория снаряжения: ' + catBtns + '</div>' +
          '<table class="bw-table">' +
            '<tr><th>Предмет</th><th>Боевые характеристики d20</th><th>Стоимость</th><th>Примечание</th></tr>' +
            rows +
          '</table>' +
        '</div>'
      );
    }

    renderTarisQuests(K) {
      const quests = K.QUESTS || {};
      const entries = Object.entries(quests);
      const selectedId = quests[this.selectedQuestId] ? this.selectedQuestId : (entries[0] ? entries[0][0] : 'main');
      const curQuest = quests[selectedId] || { n: selectedId, s: {} };

      const qBtns = entries.map(([qid, q]) => {
        const cls = qid === selectedId ? 'bw-btn bw-btn-kotor' : 'bw-btn';
        return '<button type="button" class="' + cls + '" data-bw-quest-pick="' + qid + '">' + this.escapeHtml(q.n) + '</button>';
      }).join(' ');

      const stageRows = Object.entries(curQuest.s || {}).map(([stNum, text], idx) => (
        '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
          '<td width="90"><b>Этап ' + this.escapeHtml(stNum) + '</b></td>' +
          '<td>' + this.escapeHtml(text) + '</td>' +
        '</tr>'
      )).join('');

      return (
        '<div>' +
          '<div style="margin-bottom:8px;">Выберите сюжетную линию Тариса: ' + qBtns + '</div>' +
          '<h4 style="margin:4px 0 6px 0;">Хронология этапов задания: ' + this.escapeHtml(curQuest.n) + '</h4>' +
          '<table class="bw-table">' +
            '<tr><th>Код этапа</th><th>Запись в бортовом журнале KOTOR 98</th></tr>' +
            stageRows +
          '</table>' +
        '</div>'
      );
    }

    buildD20Creature() {
      const K = this.getKotor();
      const s = this.d20State;
      const cl = (K.CLASSES && K.CLASSES[s.cls]) || { feats: [], hd: 8, bab: 0.75, good: ['fort'] };
      const feats = Array.from(new Set([].concat(cl.feats || [], s.feats || [])));
      const c = {
        uid: 999,
        id: 'pc_sim',
        name: 'Герой Тариса',
        cls: s.cls,
        level: Math.max(1, Math.min(8, parseInt(s.level, 10) || 5)),
        attrs: Object.assign({ str: 14, dex: 14, con: 14, int: 10, wis: 12, cha: 10 }, s.attrs),
        skills: { com: 4, dem: 4, ste: 4, awa: 4, per: 4, rep: 4, sec: 4, tre: 4 },
        feats: feats,
        powers: s.cls === 'sentinel' ? ['cure', 'stun', 'push', 'battle_med'] : [],
        equip: {
          r: s.equip.r || null,
          l: s.equip.l || null,
          body: s.equip.body || null,
          acc: s.equip.acc || null
        },
        effects: []
      };
      if (typeof K.recalc === 'function') K.recalc(c);
      return c;
    }

    ensurePazaakGame() {
      const K = this.getKotor();
      if (!K.Pazaak || !K.PAZAAK_OPP) return null;
      const opp = K.PAZAAK_OPP[this.pazaakOppId] || K.PAZAAK_OPP.lena;
      if (!this.pazaakGame || this.pazaakGame.oppId !== this.pazaakOppId) {
        const playerSide = ['card_f1', 'card_f2', 'card_f3', 'card_f4', 'card_p2', 'card_p3', 'card_m2', 'card_m3', 'card_p5', 'card_m4'];
        this.pazaakGame = new K.Pazaak({
          rng: new K.RNG(Date.now() & 0xffff),
          opp: opp,
          oppId: this.pazaakOppId,
          wager: opp.wager || 50,
          playerSide: playerSide
        });
      }
      return this.pazaakGame;
    }

    renderD20Page() {
      const K = this.getKotor();
      const c = this.buildD20Creature();
      const desc = typeof K.describe === 'function' ? K.describe(c) : { hp: 40, maxHp: 40, fp: 0, maxFp: 0, def: 15, ab: 5, dmg: [2, 8], fort: 4, ref: 4, will: 3, bab: 4 };
      const offAb = c.equip.l && typeof K.attackBonus === 'function' ? K.attackBonus(c, 'l') : null;
      const offDmg = c.equip.l && typeof K.damageRange === 'function' ? K.damageRange(c, 'l') : null;

      const classOpts = ['soldier', 'scout', 'scoundrel', 'sentinel'].map((cid) => {
        const cl = (K.CLASSES && K.CLASSES[cid]) || { n: cid };
        return '<option value="' + cid + '"' + (this.d20State.cls === cid ? ' selected' : '') + '>' + this.escapeHtml(cl.n) + ' (HD d' + (cl.hd || 8) + ')</option>';
      }).join('');

      const attrControls = (K.ATTRS || []).map(([aid, aname]) => {
        const val = c.attrs[aid] || 10;
        const modVal = typeof K.attrMod === 'function' ? K.attrMod(c, aid) : Math.floor((val - 10) / 2);
        const modStr = (modVal >= 0 ? '+' : '') + modVal;
        return (
          '<tr>' +
            '<td><b>' + this.escapeHtml(aname) + '</b> (<code>' + aid.toUpperCase() + '</code>)</td>' +
            '<td><input type="number" class="bw-input" style="width:48px;" min="8" max="22" value="' + val + '" data-bw-d20-attr="' + aid + '"></td>' +
            '<td><b>' + modStr + '</b></td>' +
          '</tr>'
        );
      }).join('');

      const mainWeapons = ['vibro_sword', 'double_vibro', 'vibroblade', 'long_sword', 'bastila_saber', 'blaster_pistol', 'heavy_pistol', 'carth_pistol', 'calo_pistol', 'blaster_carbine', 'sith_rifle', 'repeating_blaster'];
      const offWeapons = ['', 'vibroblade', 'short_sword', 'stun_baton', 'blaster_pistol', 'heavy_pistol'];
      const armors = ['clothes', 'combat_suit', 'military_suit', 'echani_light', 'reinforced', 'sith_trooper_armor', 'mando_armor', 'jedi_robe'];
      const accs = ['', 'power_gloves', 'reflex_band', 'aim_visor', 'verpine_band', 'interface_band'];

      const buildItemOpts = (ids, selectedId, emptyLabel) => ids.map((id) => {
        if (!id) return '<option value=""' + (!selectedId ? ' selected' : '') + '>' + this.escapeHtml(emptyLabel || '— Нет —') + '</option>';
        const it = (K.ITEMS && K.ITEMS[id]) || { n: id };
        return '<option value="' + id + '"' + (selectedId === id ? ' selected' : '') + '>' + this.escapeHtml(it.n) + '</option>';
      }).join('');

      const toggleableFeats = ['two_weapon', 'dueling', 'toughness', 'conditioning', 'scoundrel_luck', 'power_attack', 'flurry', 'critical_strike', 'rapid_shot', 'sniper_shot'];
      const featChecksHtml = toggleableFeats.map((fid) => {
        const fObj = (K.FEATS && K.FEATS[fid]) || { n: fid };
        const checked = c.feats.indexOf(fid) >= 0 ? ' checked' : '';
        return (
          '<label style="display:inline-block;margin-right:10px;font-size:11px;cursor:pointer;">' +
            '<input type="checkbox" value="' + fid + '"' + checked + ' data-bw-d20-feat="' + fid + '"> ' +
            this.escapeHtml(fObj.n) +
          '</label>'
        );
      }).join('');

      const bossOpts = ['bendak', 'calo', 'davik', 'sith_governor', 'brejik', 'kandon'].map((bid) => {
        const b = (K.TEMPLATES && K.TEMPLATES[bid]) || { n: bid };
        return '<option value="' + bid + '"' + (this.d20State.targetEnemyId === bid ? ' selected' : '') + '>' + this.escapeHtml(b.n) + ' (Ур. ' + (b.lvl || 6) + ')</option>';
      }).join('');

      return (
        '<div>' +
          '<div class="bw-panel">' +
            '<div class="bw-panel-head is-holocron">КАЛЬКУЛЯТОР ПЕРСОНАЖА И БОЕВЫХ БРОСКОВ STAR WARS d20 (KOTOR.EXE — KT-RULES)</div>' +
            '<div class="bw-panel-body">' +
              '<table class="bw-layout">' +
                '<tr>' +
                  '<td class="bw-col-main">' +
                    '<div style="margin-bottom:6px;">' +
                      'Класс: <select class="bw-select" data-bw-d20-cls="1">' + classOpts + '</select> ' +
                      'Уровень (1–8): <input type="number" class="bw-input" style="width:45px;" min="1" max="8" value="' + c.level + '" data-bw-d20-lvl="1"> ' +
                      '<button type="button" class="bw-btn bw-btn-kotor" data-bw-d20-sim="1">Симулировать раунд против босса</button> ' +
                      '<button type="button" class="bw-btn" data-bw-d20-export="1">Экспорт билда в Блокнот (.TXT)</button>' +
                    '</div>' +
                    '<table class="bw-table">' +
                      '<tr><th>Слот экипировки</th><th>Выбранный предмет (K.ITEMS)</th></tr>' +
                      '<tr><td>Правая рука (основное)</td><td><select class="bw-select" data-bw-d20-eq="r">' + buildItemOpts(mainWeapons, c.equip.r) + '</select></td></tr>' +
                      '<tr class="is-alt"><td>Левая рука (второе оружие)</td><td><select class="bw-select" data-bw-d20-eq="l">' + buildItemOpts(offWeapons, c.equip.l, '— Свободна (одноручный/двуручный хват) —') + '</select></td></tr>' +
                      '<tr><td>Броня / Роба</td><td><select class="bw-select" data-bw-d20-eq="body">' + buildItemOpts(armors, c.equip.body) + '</select></td></tr>' +
                      '<tr class="is-alt"><td>Аксессуар / Пояс / Визор</td><td><select class="bw-select" data-bw-d20-eq="acc">' + buildItemOpts(accs, c.equip.acc, '— Без аксессуара —') + '</select></td></tr>' +
                      '<tr><td>Цель для боевого теста</td><td><select class="bw-select" data-bw-d20-boss="1">' + bossOpts + '</select></td></tr>' +
                    '</table>' +
                    '<div style="margin-bottom:6px;"><b>Активные навыки (K.FEATS):</b><br>' + featChecksHtml + '</div>' +
                    (this.d20State.lastCombatSim ? '<div class="bw-news-card" style="background:#eef7fc;border-color:#1e6488;"><b>Журнал раунда d20:</b> ' + this.escapeHtml(this.d20State.lastCombatSim) + '</div>' : '') +
                  '</td>' +
                  '<td class="bw-col-side">' +
                    '<table class="bw-table">' +
                      '<tr><th>Атрибут</th><th>Знач.</th><th>Мод.</th></tr>' +
                      attrControls +
                    '</table>' +
                    '<table class="bw-table">' +
                      '<tr><th colspan="2">Итоговая сводка d20 (K.describe)</th></tr>' +
                      '<tr><td>Здоровье (Vitality HP)</td><td><b>' + desc.maxHp + ' HP</b></td></tr>' +
                      '<tr class="is-alt"><td>Очки Силы (Force FP)</td><td><b>' + desc.maxFp + ' FP</b></td></tr>' +
                      '<tr><td>Класс Защиты (Defense)</td><td><b>' + desc.def + '</b></td></tr>' +
                      '<tr class="is-alt"><td>Базовый бонус атаки (BAB)</td><td><b>+' + desc.bab + '</b></td></tr>' +
                      '<tr><td>Атака и урон (Правая рука)</td><td><b>' + (desc.ab >= 0 ? '+' : '') + desc.ab + '</b> (' + desc.dmg[0] + '–' + desc.dmg[1] + ')</td></tr>' +
                      (offAb !== null ? '<tr class="is-alt"><td>Атака и урон (Левая рука)</td><td><b>' + (offAb >= 0 ? '+' : '') + offAb + '</b> (' + offDmg[0] + '–' + offDmg[1] + ')</td></tr>' : '') +
                      '<tr><td>Спасброски (СТК / РЕФ / ВОЛ)</td><td><b>+' + desc.fort + ' / +' + desc.ref + ' / +' + desc.will + '</b></td></tr>' +
                    '</table>' +
                  '</td>' +
                '</tr>' +
              '</table>' +
            '</div>' +
          '</div>' +
          this.renderPazaakAndSwoopPanel(K) +
        '</div>'
      );
    }

    renderPazaakAndSwoopPanel(K) {
      const game = this.ensurePazaakGame();
      const opps = K.PAZAAK_OPP || {};

      const oppButtons = Object.entries(opps).map(([oid, o]) => {
        const cls = this.pazaakOppId === oid ? 'bw-btn bw-btn-kotor' : 'bw-btn';
        return '<button type="button" class="' + cls + '" data-bw-pazaak-opp="' + oid + '">' + this.escapeHtml(o.n) + ' (ставка ' + o.wager + ' кр.)</button>';
      }).join(' ');

      let boardHtml = '';
      if (game) {
        const renderCards = (cards) => (cards || []).map((c) => {
          const cls = c.side ? 'bw-pazaak-card is-side' : 'bw-pazaak-card';
          const txt = c.side ? ((c.v > 0 ? '+' : '') + c.v) : String(c.v);
          return '<span class="' + cls + '">' + this.escapeHtml(txt) + '</span>';
        }).join('') || '<span style="color:#88b8d0;">Стол пуст</span>';

        const handBtns = (game.hands.player || []).map((c, idx) => {
          const disabled = !game.canPlay(idx) ? ' disabled' : '';
          if (c.kind === '±') {
            return (
              '<span style="margin-right:6px;">' +
                '<button type="button" class="bw-btn"' + disabled + ' data-bw-pazaak-card="' + idx + '" data-bw-pazaak-sign="1">+' + c.v + ' (±)</button> ' +
                '<button type="button" class="bw-btn"' + disabled + ' data-bw-pazaak-card="' + idx + '" data-bw-pazaak-sign="-1">-' + c.v + ' (±)</button>' +
              '</span>'
            );
          }
          const label = (c.v > 0 ? '+' : '') + c.v;
          return '<button type="button" class="bw-btn" style="margin-right:4px;"' + disabled + ' data-bw-pazaak-card="' + idx + '" data-bw-pazaak-sign="1">Сыграть ' + label + '</button>';
        }).join('');

        boardHtml =
          '<div class="bw-pazaak-board">' +
            '<table width="100%" cellspacing="0" cellpadding="4">' +
              '<tr>' +
                '<td width="50%" valign="top" style="border-right:1px solid #306080;">' +
                  '<div><b>ВЫ (Игрок кантины)</b> &bull; Выиграно сетов: <b>' + game.sets.player + ' / 3</b> ' + (game.side.player.stood ? '<span class="bw-badge is-gold">СТОИТ</span>' : '') + '</div>' +
                  '<div style="font-size:16px;margin:4px 0;">Сумма: <b>' + game.side.player.total + ' / 20</b></div>' +
                  '<div>' + renderCards(game.side.player.cards) + '</div>' +
                '</td>' +
                '<td width="50%" valign="top">' +
                  '<div><b>СОПЕРНИК: ' + this.escapeHtml(game.opp.n) + '</b> &bull; Выиграно сетов: <b>' + game.sets.opp + ' / 3</b> ' + (game.side.opp.stood ? '<span class="bw-badge is-gold">СТОИТ</span>' : '') + '</div>' +
                  '<div style="font-size:16px;margin:4px 0;">Сумма: <b>' + game.side.opp.total + ' / 20</b></div>' +
                  '<div>' + renderCards(game.side.opp.cards) + '</div>' +
                '</td>' +
              '</tr>' +
            '</table>' +
            '<div style="border-top:1px solid #306080;margin-top:6px;padding-top:6px;">' +
              '<div style="margin-bottom:4px;"><b>Ваша побочная рука (4 карты из 10):</b> ' + (handBtns || 'Карты руки разыграны') + '</div>' +
              '<div>' +
                (game.phase === 'turn' ? (
                  '<button type="button" class="bw-btn bw-btn-kotor" data-bw-pazaak-act="endTurn">Завершить ход (Ещё карту)</button> ' +
                  '<button type="button" class="bw-btn bw-btn-dao" data-bw-pazaak-act="stand">Пас / Стоять на ' + game.side.player.total + '</button> '
                ) : '') +
                (game.phase === 'setEnd' ? '<button type="button" class="bw-btn bw-btn-kotor" data-bw-pazaak-act="nextSet">Начать следующий сет &raquo;</button> ' : '') +
                '<button type="button" class="bw-btn" data-bw-pazaak-act="reset">Новая партия</button>' +
                '<span style="margin-left:10px;color:#ffe498;"><b>' + this.escapeHtml(game.msg || 'Ваш ход: сыграйте карту с руки или завершите ход.') + '</b></span>' +
              '</div>' +
            '</div>' +
          '</div>';
      }

      const swoopGears = (K.Swoop && K.Swoop.GEARS) ? K.Swoop.GEARS.slice(1).join(' / ') : '16 / 26 / 36 / 46 / 56';

      return (
        '<div class="bw-panel">' +
          '<div class="bw-panel-head is-bronze">КАНТИНА ТАРИСА: ИНТЕРАКТИВНЫЙ СТОЛ ПАЗААКА (K.Pazaak) И ТЕЛЕМЕТРИЯ СВУП-ТРАССЫ</div>' +
          '<div class="bw-panel-body">' +
            '<div style="margin-bottom:6px;">Соперник за столом: ' + oppButtons + '</div>' +
            boardHtml +
            '<div style="margin-top:8px;font-size:11px;padding:6px;background:#f2ead8;border:1px solid #968668;">' +
              '<b>Справка гонщика Свуп-трассы Тариса (K.Swoop):</b> Длина трека — <b>1150 м</b>, время чемпиона «Чёрных вулкаров» — <b>26.80 сек.</b>, пороги переключения 5 передач ускорителя: <code>' + this.escapeHtml(swoopGears) + '</code>.' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    renderStudioPage() {
      const data = this.getData();
      const studio = data.studio || {};
      const controls = data.controls || { dao98: [], kotor98: [] };

      const founderRows = (studio.founders || []).map((f, idx) => (
        '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
          '<td><b>' + this.escapeHtml(f.name) + '</b></td>' +
          '<td>' + this.escapeHtml(f.role) + '</td>' +
          '<td>' + this.escapeHtml(f.background) + '</td>' +
        '</tr>'
      )).join('');

      const engineRows = (studio.engines || []).map((e, idx) => (
        '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
          '<td><b>' + this.escapeHtml(e.name) + '</b></td>' +
          '<td>' + this.escapeHtml(e.resolution) + '</td>' +
          '<td>' + this.escapeHtml(e.combatModel) + '</td>' +
          '<td>' + this.escapeHtml(e.aiSystem) + '</td>' +
          '<td>' + this.escapeHtml(e.dialogueSystem) + '</td>' +
        '</tr>'
      )).join('');

      const daoCtrlRows = (controls.dao98 || []).map((c, idx) => (
        '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '"><td><code>' + this.escapeHtml(c.key) + '</code></td><td>' + this.escapeHtml(c.action) + '</td></tr>'
      )).join('');

      const kotorCtrlRows = (controls.kotor98 || []).map((c, idx) => (
        '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '"><td><code>' + this.escapeHtml(c.key) + '</code></td><td>' + this.escapeHtml(c.action) + '</td></tr>'
      )).join('');

      return (
        '<div>' +
          '<div class="bw-panel">' +
            '<div class="bw-panel-head">О СТУДИИ BIOWARE CORP. (EDMONTON, ALBERTA, CANADA)</div>' +
            '<div class="bw-panel-body">' +
              '<p style="margin:0 0 8px 0;">Основанная в <b>' + this.escapeHtml(studio.founded || '1995') + '</b> в канадском Эдмонтоне тремя выпускниками медицинского факультета Альбертского университета, студия <b>BioWare Corp.</b> специализируется на создании компьютерных ролевых игр с глубоким сюжетом, живыми соратниками и тактическими партийными сражениями под девизом: <i>«' + this.escapeHtml(studio.motto || '') + '»</i>.</p>' +
              '<div style="font-size:11px;margin-bottom:8px;">Штаб-квартира: <b>' + this.escapeHtml(studio.address || '') + '</b> &bull; Техподдержка: <a href="mailto:support@bioware98.com" class="bw-link">support@bioware98.com</a></div>' +
              '<table class="bw-table">' +
                '<tr><th>Основатель</th><th>Должность</th><th>Вклад в проекты студии</th></tr>' +
                founderRows +
              '</table>' +
            '</div>' +
          '</div>' +
          '<div class="bw-panel">' +
            '<div class="bw-panel-head is-holocron">АРХИТЕКТУРА ДВИЖКОВ: ECLIPSE 98 (DAO 98) И ODYSSEY d20 (KOTOR 98)</div>' +
            '<div class="bw-panel-body">' +
              '<table class="bw-table">' +
                '<tr><th>Технологический стек</th><th>Рендеринг в Win 98</th><th>Модель боя</th><th>ИИ отряда и спасброски</th><th>Диалоговая система</th></tr>' +
                engineRows +
              '</table>' +
            '</div>' +
          '</div>' +
          '<table class="bw-layout">' +
            '<tr>' +
              '<td width="50%" valign="top" style="padding-right:6px;">' +
                '<div class="bw-panel">' +
                  '<div class="bw-panel-head is-crimson">УПРАВЛЕНИЕ В DAORIGINS.EXE</div>' +
                  '<div class="bw-panel-body"><table class="bw-table"><tr><th>Клавиша</th><th>Команда</th></tr>' + daoCtrlRows + '</table></div>' +
                '</div>' +
              '</td>' +
              '<td width="50%" valign="top">' +
                '<div class="bw-panel">' +
                  '<div class="bw-panel-head is-holocron">УПРАВЛЕНИЕ В KOTOR.EXE</div>' +
                  '<div class="bw-panel-body"><table class="bw-table"><tr><th>Клавиша</th><th>Команда</th></tr>' + kotorCtrlRows + '</table></div>' +
                '</div>' +
              '</td>' +
            '</tr>' +
          '</table>' +
        '</div>'
      );
    }

    getGuestbookEntries() {
      const seeds = (this.getData().guestbookSeeds || []).slice();
      try {
        const raw = localStorage.getItem(GUESTBOOK_STORAGE_KEY);
        if (raw) {
          const custom = JSON.parse(raw);
          if (Array.isArray(custom)) {
            return custom.concat(seeds);
          }
        }
      } catch (e) {}
      return seeds;
    }

    renderGuestbookPage() {
      const data = this.getData();
      const mailbag = data.mailbag || [];
      const entries = this.getGuestbookEntries();

      const qaHtml = mailbag.map((m) => (
        '<div class="bw-news-card">' +
          '<div style="font-size:11px;color:#5a4e3c;">Письмо от: <b>' + this.escapeHtml(m.from) + '</b> &bull; Тема: <b>' + this.escapeHtml(m.subject) + '</b></div>' +
          '<div style="margin:4px 0;"><b>Вопрос:</b> ' + this.escapeHtml(m.question) + '</div>' +
          '<div style="padding:4px 8px;background:#f0ead8;border-left:3px solid #185478;"><b>Ответ BioWare Edmonton:</b> ' + this.escapeHtml(m.answer) + '</div>' +
        '</div>'
      )).join('');

      const guestRows = entries.map((g, idx) => (
        '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
          '<td width="22%"><b>' + this.escapeHtml(g.author) + '</b><br><span style="font-size:10px;color:#5a4e3c;">' + this.escapeHtml(g.city || 'Edmonton Net') + '</span></td>' +
          '<td width="20%"><span class="bw-badge ' + (String(g.game).indexOf('Dragon') >= 0 ? 'is-dao' : 'is-kotor') + '">' + this.escapeHtml(g.game) + '</span><br><span style="font-size:10px;">' + this.escapeHtml(g.date) + '</span></td>' +
          '<td width="58%">' + this.escapeHtml(g.message) + '</td>' +
        '</tr>'
      )).join('');

      return (
        '<div>' +
          '<div class="bw-panel">' +
            '<div class="bw-panel-head is-bronze">ПОЧТА РАЗРАБОТЧИКОВ BIOWARE EDMONTON (ВОПРОСЫ И ОТВЕТЫ)</div>' +
            '<div class="bw-panel-body">' +
              '<div style="margin-bottom:8px;">Отправьте свой вопрос команде сценаристов и программистов через Outlook Express: <a href="mailto:support@bioware98.com" class="bw-link"><b>support@bioware98.com</b></a></div>' +
              qaHtml +
            '</div>' +
          '</div>' +
          '<div class="bw-panel">' +
            '<div class="bw-panel-head is-crimson">ГОСТЕВАЯ КНИГА СЕРЫХ СТРАЖЕЙ И РЫЦАРЕЙ РЕСПУБЛИКИ</div>' +
            '<div class="bw-panel-body">' +
              '<form data-bw-guestbook-form="1" style="margin-bottom:10px;padding:8px;background:#f2ead8;border:1px solid #968668;">' +
                '<div style="margin-bottom:6px;">' +
                  'Имя / Позывной: <input type="text" name="author" class="bw-input" size="18" required placeholder="Например: GreyWarden98"> ' +
                  'Город / Сектор: <input type="text" name="city" class="bw-input" size="16" placeholder="Denerim / Taris"> ' +
                  'Любимая игра: <select name="game" class="bw-select">' +
                    '<option value="Dragon Age: Origins 98">Dragon Age: Origins 98</option>' +
                    '<option value="Star Wars: KOTOR 98">Star Wars: KOTOR 98</option>' +
                  '</select>' +
                '</div>' +
                '<div style="margin-bottom:6px;">' +
                  '<textarea name="message" class="bw-textarea" rows="3" style="width:98%;" required placeholder="Оставьте отзыв о предысториях Ферелдена, тактике боя или турнире Пазаака..."></textarea>' +
                '</div>' +
                '<button type="submit" class="bw-btn bw-btn-dao">Записать в летопись Эдмонтона</button>' +
              '</form>' +
              '<table class="bw-table">' +
                '<tr><th>Автор</th><th>Кампания и Дата</th><th>Запись в гостевой книге</th></tr>' +
                guestRows +
              '</table>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    renderSearchPage() {
      const rawQ = String(this.currentParams.q || '').trim();
      const q = rawQ.toLowerCase();
      const D = this.getDao();
      const K = this.getKotor();
      const data = this.getData();

      const results = [];
      const pushHit = (badge, title, desc, navPath) => {
        results.push({ badge, title, desc, navPath });
      };

      if (q) {
        (data.news || []).forEach((n) => {
          const hay = (n.title + ' ' + n.summary + ' ' + (n.body || []).join(' ')).toLowerCase();
          if (hay.indexOf(q) >= 0) pushHit('СТАТЬЯ', n.title, n.summary, '/');
        });
        Object.values(D.ORIGINS || {}).forEach((o) => {
          const hay = (o.name + ' ' + (o.family || '') + ' ' + (o.desc || '')).toLowerCase();
          if (hay.indexOf(q) >= 0) pushHit('DAO 98 ПРЕДЫСТОРИЯ', o.name + (o.family ? ' (' + o.family + ')' : ''), o.desc, '/ferelden');
        });
        Object.values(D.COMPANIONS || {}).forEach((c) => {
          const hay = ((c.name || '') + ' ' + (c.bio || '')).toLowerCase();
          if (hay.indexOf(q) >= 0) pushHit('DAO 98 СПУТНИК', c.name, c.bio || 'Соратник в Ферелдене', '/ferelden');
        });
        Object.values(D.AB || {}).forEach((a) => {
          const hay = ((a.name || '') + ' ' + (a.id || '') + ' ' + (a.desc || '')).toLowerCase();
          if (hay.indexOf(q) >= 0) pushHit('DAO 98 СПОСОБНОСТЬ', a.name + ' (' + a.id + ')', a.desc || '', '/ferelden');
        });
        Object.values(D.CODEX || {}).forEach((c) => {
          const hay = ((c.title || '') + ' ' + (c.text || '')).toLowerCase();
          if (hay.indexOf(q) >= 0) pushHit('DAO 98 КОДЕКС', c.title, c.text, '/ferelden');
        });
        Object.entries(K.AREAS || {}).forEach(([id, a]) => {
          const hay = (id + ' ' + (a.n || '')).toLowerCase();
          if (hay.indexOf(q) >= 0) pushHit('KOTOR 98 СЕКТОР', a.n + ' (' + id + ')', 'Сектор планеты Тарис', '/taris');
        });
        Object.values(K.FEATS || {}).forEach((f) => {
          const hay = ((f.n || '') + ' ' + (f.desc || '')).toLowerCase();
          if (hay.indexOf(q) >= 0) pushHit('KOTOR 98 НАВЫК d20', f.n, f.desc, '/d20');
        });
        Object.values(K.ITEMS || {}).forEach((it) => {
          const hay = ((it.n || '') + ' ' + (it.id || '') + ' ' + (it.desc || '')).toLowerCase();
          if (hay.indexOf(q) >= 0) pushHit('KOTOR 98 ПРЕДМЕТ', it.n + ' (' + it.id + ')', it.desc || 'Снаряжение Тариса', '/taris');
        });
      }

      const rows = results.map((r, idx) => (
        '<tr class="' + (idx % 2 === 1 ? 'is-alt' : '') + '">' +
          '<td width="20%"><span class="bw-badge is-gold">' + this.escapeHtml(r.badge) + '</span></td>' +
          '<td width="62%"><b>' + this.escapeHtml(r.title) + '</b><br>' + this.escapeHtml(r.desc) + '</td>' +
          '<td width="18%"><button type="button" class="bw-btn" data-bw-nav="' + r.navPath + '">Перейти &raquo;</button></td>' +
        '</tr>'
      )).join('');

      return (
        '<div class="bw-panel">' +
          '<div class="bw-panel-head">РЕЗУЛЬТАТЫ ПОИСКА ПО БАЗАМ BIOWARE EDMONTON</div>' +
          '<div class="bw-panel-body">' +
            '<div style="margin-bottom:8px;">Поисковый запрос: <b>«' + this.escapeHtml(rawQ || 'все записи') + '»</b> &bull; Найдено совпадений: <b>' + results.length + '</b></div>' +
            (results.length > 0
              ? '<table class="bw-table"><tr><th>Категория</th><th>Найденная запись</th><th>Раздел</th></tr>' + rows + '</table>'
              : '<div class="bw-news-card">Совпадений не найдено. Попробуйте запросы: <b>Кусланд</b>, <b>Морриган</b>, <b>Огненный шар</b>, <b>Бастила</b>, <b>Бендак</b>, <b>Пазаак</b> или <b>Виброклинок</b>.</div>') +
          '</div>' +
        '</div>'
      );
    }

    bindEvents(container) {
      const self = this;

      container.querySelectorAll('[data-bw-nav]').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          self.navigate(el.getAttribute('data-bw-nav'));
        });
      });

      container.querySelectorAll('[data-bw-open-cd]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const gameId = btn.getAttribute('data-bw-open-cd');
          if (window.gameManager && typeof window.gameManager.showOnCd === 'function') {
            window.gameManager.showOnCd(gameId);
          }
        });
      });

      container.querySelectorAll('[data-bw-launch-game]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const gameId = btn.getAttribute('data-bw-launch-game');
          const gm = window.gameManager;
          if (gm && typeof gm.launchGame === 'function') {
            gm.launchGame(gameId);
          } else if (gm && gm.catalog && gm.catalog[gameId] && typeof gm.catalog[gameId].launch === 'function') {
            gm.catalog[gameId].launch();
          }
        });
      });

      const searchForm = container.querySelector('[data-bw-search-form]');
      if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = searchForm.querySelector('input[name="q"]');
          const q = input ? input.value.trim() : '';
          self.navigate('/search?q=' + encodeURIComponent(q));
        });
      }

      container.querySelectorAll('[data-bw-news-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.newsFilter = btn.getAttribute('data-bw-news-filter') || 'all';
          self.render(self.currentIe, self.currentContainer, '/');
        });
      });

      container.querySelectorAll('[data-bw-news-open]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.activeNewsId = btn.getAttribute('data-bw-news-open');
          self.render(self.currentIe, self.currentContainer, '/');
        });
      });

      container.querySelectorAll('[data-bw-news-export]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-bw-news-export');
          const item = (self.getData().news || []).find((n) => n.id === id);
          if (!item) return;
          const text = [
            'BIOWARE CORP. EDMONTON — DEV JOURNAL ARCHIVE',
            '===========================================',
            'Заголовок: ' + item.title,
            'Дата: ' + item.date,
            'Авторы: ' + item.author,
            '',
            (item.body || []).join('\r\n\r\n')
          ].join('\r\n');
          self.exportTextToNotepad('BioWare_' + id + '.txt', text);
        });
      });

      const pollForm = container.querySelector('[data-bw-poll-form]');
      if (pollForm) {
        pollForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const checked = pollForm.querySelector('input[name="bw_poll_choice"]:checked');
          if (!checked) return;
          try {
            localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify({ votedId: checked.value }));
          } catch (err) {}
          self.render(self.currentIe, self.currentContainer, '/');
        });
      }

      container.querySelectorAll('[data-bw-ferelden-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.fereldenTab = btn.getAttribute('data-bw-ferelden-tab') || 'origins';
          self.render(self.currentIe, self.currentContainer, '/ferelden');
        });
      });

      container.querySelectorAll('[data-bw-origin-pick]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.selectedOriginId = btn.getAttribute('data-bw-origin-pick') || 'hn';
          self.render(self.currentIe, self.currentContainer, '/ferelden');
        });
      });

      container.querySelectorAll('[data-bw-talent-cls]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.talentClassFilter = btn.getAttribute('data-bw-talent-cls') || 'all';
          self.render(self.currentIe, self.currentContainer, '/ferelden');
        });
      });

      container.querySelectorAll('[data-bw-ab-pick]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.selectedAbilityId = btn.getAttribute('data-bw-ab-pick') || 'fireball';
          self.render(self.currentIe, self.currentContainer, '/ferelden');
        });
      });

      container.querySelectorAll('[data-bw-bestiary-race]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.bestiaryRaceFilter = btn.getAttribute('data-bw-bestiary-race') || 'all';
          self.render(self.currentIe, self.currentContainer, '/ferelden');
        });
      });

      container.querySelectorAll('[data-bw-codex-cat]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.codexCategoryFilter = btn.getAttribute('data-bw-codex-cat') || 'all';
          self.render(self.currentIe, self.currentContainer, '/ferelden');
        });
      });

      container.querySelectorAll('[data-bw-codex-pick]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.selectedCodexId = btn.getAttribute('data-bw-codex-pick') || 'grey_wardens';
          self.render(self.currentIe, self.currentContainer, '/ferelden');
        });
      });

      const tacCompSel = container.querySelector('[data-bw-tac-companion]');
      if (tacCompSel) {
        tacCompSel.addEventListener('change', () => {
          self.tacticsCompanionId = tacCompSel.value;
          const preset = self.getPresetTacticsForCompanion(self.tacticsCompanionId);
          self.tacticsBehavior = preset.behavior;
          self.tacticsSlots = preset.slots.slice();
          self.render(self.currentIe, self.currentContainer, '/tactics');
        });
      }

      const tacBehSel = container.querySelector('[data-bw-tac-behavior]');
      if (tacBehSel) {
        tacBehSel.addEventListener('change', () => {
          self.tacticsBehavior = tacBehSel.value;
        });
      }

      container.querySelectorAll('[data-bw-tac-cond]').forEach((sel) => {
        sel.addEventListener('change', () => {
          const idx = parseInt(sel.getAttribute('data-bw-tac-cond'), 10);
          if (self.tacticsSlots[idx]) {
            self.tacticsSlots[idx].cond = sel.value;
            self.render(self.currentIe, self.currentContainer, '/tactics');
          }
        });
      });

      container.querySelectorAll('[data-bw-tac-act]').forEach((sel) => {
        sel.addEventListener('change', () => {
          const idx = parseInt(sel.getAttribute('data-bw-tac-act'), 10);
          if (self.tacticsSlots[idx]) {
            self.tacticsSlots[idx].act = sel.value;
            self.render(self.currentIe, self.currentContainer, '/tactics');
          }
        });
      });

      container.querySelectorAll('[data-bw-tac-del]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-bw-tac-del'), 10);
          if (self.tacticsSlots.length > 1) {
            self.tacticsSlots.splice(idx, 1);
            self.render(self.currentIe, self.currentContainer, '/tactics');
          }
        });
      });

      const tacPresetBtn = container.querySelector('[data-bw-tac-preset]');
      if (tacPresetBtn) {
        tacPresetBtn.addEventListener('click', () => {
          const preset = self.getPresetTacticsForCompanion(self.tacticsCompanionId);
          self.tacticsBehavior = preset.behavior;
          self.tacticsSlots = preset.slots.slice();
          self.render(self.currentIe, self.currentContainer, '/tactics');
        });
      }

      const tacAddBtn = container.querySelector('[data-bw-tac-add]');
      if (tacAddBtn) {
        tacAddBtn.addEventListener('click', () => {
          if (self.tacticsSlots.length < 8) {
            self.tacticsSlots.push({ cond: 'enemy_near', act: 'attack' });
            self.render(self.currentIe, self.currentContainer, '/tactics');
          }
        });
      }

      const tacExportBtn = container.querySelector('[data-bw-tac-export]');
      if (tacExportBtn) {
        tacExportBtn.addEventListener('click', () => {
          const D = self.getDao();
          const comp = (D.COMPANIONS && D.COMPANIONS[self.tacticsCompanionId]) || { name: self.tacticsCompanionId };
          const lines = [
            'DRAGON AGE: ORIGINS 98 — МАТРИЦА ТАКТИКИ ОТРЯДА',
            '================================================',
            'Спутник: ' + comp.name + ' (' + self.tacticsCompanionId + ')',
            'Поведение: ' + ((D.BEHAVIORS && D.BEHAVIORS[self.tacticsBehavior]) || self.tacticsBehavior),
            ''
          ];
          self.tacticsSlots.forEach((sl, idx) => {
            const cName = (D.TAC_COND && D.TAC_COND[sl.cond] && D.TAC_COND[sl.cond].name) || sl.cond;
            let aName = (D.TAC_ACT_BASE && D.TAC_ACT_BASE[sl.act]) || sl.act;
            if (sl.act.indexOf('ab:') === 0) {
              const aid = sl.act.slice(3);
              aName = 'Способность: ' + ((D.AB && D.AB[aid] && D.AB[aid].name) || aid);
            }
            lines.push((idx + 1) + '. ЕСЛИ [' + cName + '] -> ТО [' + aName + ']');
          });
          self.exportTextToNotepad('DAO_Tactics_' + self.tacticsCompanionId + '.txt', lines.join('\r\n'));
        });
      }

      const recipePick = container.querySelector('[data-bw-recipe-pick]');
      if (recipePick) {
        recipePick.addEventListener('change', () => {
          self.selectedRecipeId = recipePick.value;
          self.render(self.currentIe, self.currentContainer, '/tactics');
        });
      }

      const recipeQty = container.querySelector('[data-bw-recipe-qty]');
      if (recipeQty) {
        recipeQty.addEventListener('change', () => {
          self.recipeBatchQty = Math.max(1, Math.min(50, parseInt(recipeQty.value, 10) || 1));
          self.render(self.currentIe, self.currentContainer, '/tactics');
        });
      }

      const recipeRecalc = container.querySelector('[data-bw-recipe-recalc]');
      if (recipeRecalc) {
        recipeRecalc.addEventListener('click', () => {
          if (recipeQty) {
            self.recipeBatchQty = Math.max(1, Math.min(50, parseInt(recipeQty.value, 10) || 1));
          }
          self.render(self.currentIe, self.currentContainer, '/tactics');
        });
      }

      container.querySelectorAll('[data-bw-taris-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.tarisTab = btn.getAttribute('data-bw-taris-tab') || 'sectors';
          self.render(self.currentIe, self.currentContainer, '/taris');
        });
      });

      container.querySelectorAll('[data-bw-sector-pick]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.selectedSectorId = btn.getAttribute('data-bw-sector-pick') || 'upper_city';
          self.render(self.currentIe, self.currentContainer, '/taris');
        });
      });

      container.querySelectorAll('[data-bw-shop-pick]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.selectedShopId = btn.getAttribute('data-bw-shop-pick') || 'kebla';
          self.render(self.currentIe, self.currentContainer, '/taris');
        });
      });

      container.querySelectorAll('[data-bw-arsenal-cat]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.arsenalFilter = btn.getAttribute('data-bw-arsenal-cat') || 'w';
          self.render(self.currentIe, self.currentContainer, '/taris');
        });
      });

      container.querySelectorAll('[data-bw-quest-pick]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.selectedQuestId = btn.getAttribute('data-bw-quest-pick') || 'main';
          self.render(self.currentIe, self.currentContainer, '/taris');
        });
      });

      const d20Cls = container.querySelector('[data-bw-d20-cls]');
      if (d20Cls) {
        d20Cls.addEventListener('change', () => {
          self.d20State.cls = d20Cls.value;
          self.render(self.currentIe, self.currentContainer, '/d20');
        });
      }

      const d20Lvl = container.querySelector('[data-bw-d20-lvl]');
      if (d20Lvl) {
        d20Lvl.addEventListener('change', () => {
          self.d20State.level = Math.max(1, Math.min(8, parseInt(d20Lvl.value, 10) || 5));
          self.render(self.currentIe, self.currentContainer, '/d20');
        });
      }

      container.querySelectorAll('[data-bw-d20-attr]').forEach((inp) => {
        inp.addEventListener('change', () => {
          const aid = inp.getAttribute('data-bw-d20-attr');
          self.d20State.attrs[aid] = Math.max(8, Math.min(22, parseInt(inp.value, 10) || 10));
          self.render(self.currentIe, self.currentContainer, '/d20');
        });
      });

      container.querySelectorAll('[data-bw-d20-eq]').forEach((sel) => {
        sel.addEventListener('change', () => {
          const slot = sel.getAttribute('data-bw-d20-eq');
          self.d20State.equip[slot] = sel.value;
          self.render(self.currentIe, self.currentContainer, '/d20');
        });
      });

      container.querySelectorAll('[data-bw-d20-feat]').forEach((chk) => {
        chk.addEventListener('change', () => {
          const fid = chk.getAttribute('data-bw-d20-feat');
          const idx = self.d20State.feats.indexOf(fid);
          if (chk.checked && idx < 0) self.d20State.feats.push(fid);
          if (!chk.checked && idx >= 0) self.d20State.feats.splice(idx, 1);
          self.render(self.currentIe, self.currentContainer, '/d20');
        });
      });

      const d20Boss = container.querySelector('[data-bw-d20-boss]');
      if (d20Boss) {
        d20Boss.addEventListener('change', () => {
          self.d20State.targetEnemyId = d20Boss.value;
        });
      }

      const d20SimBtn = container.querySelector('[data-bw-d20-sim]');
      if (d20SimBtn) {
        d20SimBtn.addEventListener('click', () => {
          const K = self.getKotor();
          const att = self.buildD20Creature();
          const tgtId = self.d20State.targetEnemyId || 'bendak';
          const tgt = typeof K.makeCreature === 'function' ? K.makeCreature(tgtId) : { n: tgtId, equip: {}, feats: [], effects: [], attrs: { str: 14, dex: 14, con: 14, int: 10, wis: 10, cha: 10 }, level: 6, cls: 'soldier' };
          if (typeof K.rollAttack === 'function' && K.RNG) {
            const rng = new K.RNG((Date.now() & 0xffff) || 7);
            const res = K.rollAttack(rng, att, tgt, 'r', null, {});
            self.d20State.lastCombatSim = 'Атака по [' + (tgt.name || tgt.n) + ']: бросок d20=' + res.roll + ' + бонус ' + res.ab + ' = ' + res.total + ' против Защиты ' + res.def + ' -> ' + (res.hit ? ('ПОПАДАНИЕ' + (res.crit ? ' (КРИТИЧЕСКИЙ УДАР!)' : '') + ', урон: ' + res.dmg + ' ед.') : 'ПРОМАХ!');
          }
          self.render(self.currentIe, self.currentContainer, '/d20');
        });
      }

      const d20ExportBtn = container.querySelector('[data-bw-d20-export]');
      if (d20ExportBtn) {
        d20ExportBtn.addEventListener('click', () => {
          const K = self.getKotor();
          const c = self.buildD20Creature();
          const d = typeof K.describe === 'function' ? K.describe(c) : { maxHp: 40, maxFp: 0, def: 15, ab: 5, dmg: [2, 8], fort: 4, ref: 4, will: 3, bab: 4, weapon: '' };
          const text = [
            'STAR WARS: KOTOR 98 — ПРОФИЛЬ ПЕРСОНАЖА d20',
            '===========================================',
            'Класс: ' + ((K.CLASSES && K.CLASSES[c.cls] && K.CLASSES[c.cls].n) || c.cls) + ' (Уровень ' + c.level + ')',
            'Здоровье (HP): ' + d.maxHp + ' | Очки Силы (FP): ' + d.maxFp,
            'Защита (Defense): ' + d.def + ' | BAB: +' + d.bab,
            'Атака (осн.): +' + d.ab + ' | Урон: ' + d.dmg[0] + '-' + d.dmg[1] + ' (' + d.weapon + ')',
            'Спасброски: Стойкость +' + d.fort + ', Рефлекс +' + d.ref + ', Воля +' + d.will,
            'Навыки (Feats): ' + c.feats.join(', ')
          ].join('\r\n');
          self.exportTextToNotepad('KOTOR_Build_' + c.cls + '.txt', text);
        });
      }

      container.querySelectorAll('[data-bw-pazaak-opp]').forEach((btn) => {
        btn.addEventListener('click', () => {
          self.pazaakOppId = btn.getAttribute('data-bw-pazaak-opp') || 'lena';
          self.pazaakGame = null;
          self.ensurePazaakGame();
          self.render(self.currentIe, self.currentContainer, '/d20');
        });
      });

      container.querySelectorAll('[data-bw-pazaak-card]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const g = self.ensurePazaakGame();
          if (!g) return;
          const idx = parseInt(btn.getAttribute('data-bw-pazaak-card'), 10);
          const sign = parseInt(btn.getAttribute('data-bw-pazaak-sign'), 10) || 1;
          g.playCard('player', idx, sign);
          self.render(self.currentIe, self.currentContainer, '/d20');
        });
      });

      container.querySelectorAll('[data-bw-pazaak-act]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const act = btn.getAttribute('data-bw-pazaak-act');
          if (act === 'reset') {
            self.pazaakGame = null;
            self.ensurePazaakGame();
            self.render(self.currentIe, self.currentContainer, '/d20');
            return;
          }
          const g = self.ensurePazaakGame();
          if (!g) return;
          if (act === 'endTurn') {
            g.endTurn('player');
            while (g.phase === 'turn' && g.turn === 'opp') {
              g.aiTurn();
            }
          } else if (act === 'stand') {
            g.stand('player');
            while (g.phase === 'turn' && g.turn === 'opp') {
              g.aiTurn();
            }
          } else if (act === 'nextSet') {
            g.nextSet();
            while (g.phase === 'turn' && g.turn === 'opp') {
              g.aiTurn();
            }
          }
          self.render(self.currentIe, self.currentContainer, '/d20');
        });
      });

      const guestForm = container.querySelector('[data-bw-guestbook-form]');
      if (guestForm) {
        guestForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const authorInput = guestForm.querySelector('input[name="author"]');
          const cityInput = guestForm.querySelector('input[name="city"]');
          const gameSelect = guestForm.querySelector('select[name="game"]');
          const msgInput = guestForm.querySelector('textarea[name="message"]');

          const author = authorInput ? authorInput.value.trim() : '';
          const message = msgInput ? msgInput.value.trim() : '';
          if (!author || !message) return;

          const newEntry = {
            author: author.slice(0, 40),
            city: (cityInput && cityInput.value.trim() ? cityInput.value.trim() : 'Edmonton Net').slice(0, 40),
            game: gameSelect ? gameSelect.value : 'Dragon Age: Origins 98',
            date: '1998-10-20',
            message: message.slice(0, 320)
          };

          let saved = [];
          try {
            const raw = localStorage.getItem(GUESTBOOK_STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) saved = parsed;
            }
          } catch (err) {}
          saved.unshift(newEntry);
          try {
            localStorage.setItem(GUESTBOOK_STORAGE_KEY, JSON.stringify(saved.slice(0, 30)));
          } catch (err) {}

          self.render(self.currentIe, self.currentContainer, '/guestbook');
        });
      }
    }
  }

  const biowareSiteInstance = new BiowareSite();
  biowareSiteInstance.BiowareSiteClass = BiowareSite;
  window.BiowareSite = biowareSiteInstance;
  window.biowareSite = biowareSiteInstance;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = biowareSiteInstance;
  }
})();
