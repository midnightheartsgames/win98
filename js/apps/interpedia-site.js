class InterpediaSiteEngine {
  constructor() {
    this.storageLangKey = 'win98_interpedia_lang';
    this.talkStorageKey = 'win98_interpedia_talk_v1';
    this.editsStorageKey = 'win98_interpedia_edits_v1';

    const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem(this.storageLangKey) : null;
    this.currentLang = (savedLang === 'en' || savedLang === 'ru') ? savedLang : 'ru';

    this.activeArticleId = 'main';
    this.activeTab = 'read';
    this.searchQuery = '';
    this.isTocHidden = false;
    this.previewWikitext = null;

    this.initStorage();
  }

  initStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      if (!localStorage.getItem(this.talkStorageKey)) {
        localStorage.setItem(this.talkStorageKey, JSON.stringify({}));
      }
      if (!localStorage.getItem(this.editsStorageKey)) {
        localStorage.setItem(this.editsStorageKey, JSON.stringify({}));
      }
    } catch (e) {}
  }

  getTalkData(articleId) {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.talkStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed[articleId] || [];
      }
    } catch (e) {}
    return [];
  }

  saveTalkComment(articleId, commentObj) {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.talkStorageKey) || '{}';
      const parsed = JSON.parse(raw);
      if (!parsed[articleId]) parsed[articleId] = [];
      parsed[articleId].push(commentObj);
      localStorage.setItem(this.talkStorageKey, JSON.stringify(parsed));
    } catch (e) {}
  }

  getUserEdit(articleId, lang) {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.editsStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const key = `${articleId}_${lang}`;
        return parsed[key] || null;
      }
    } catch (e) {}
    return null;
  }

  saveUserEdit(articleId, lang, wikitext) {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.editsStorageKey) || '{}';
      const parsed = JSON.parse(raw);
      const key = `${articleId}_${lang}`;
      parsed[key] = wikitext;
      localStorage.setItem(this.editsStorageKey, JSON.stringify(parsed));
    } catch (e) {}
  }

  getI18n() {
    return {
      ru: {
        brandTitle: 'Интерпедия',
        brandSlogan: 'Свободная интернет-энциклопедия',
        tabArticle: 'Статья',
        tabTalk: 'Обсуждение',
        tabEdit: 'Править',
        tabHistory: 'История',
        tabPrint: 'Версия для печати',
        searchPlaceholder: 'Поиск по статьям...',
        searchBtn: 'Найти',
        searchGoBtn: 'Перейти',
        siteSub: 'Материал из Интерпедии — свободной энциклопедии',
        tocTitle: 'Содержание',
        tocHide: 'скрыть',
        tocShow: 'показать',
        navHeading: 'Навигация',
        mainPage: 'Заглавная страница',
        featuredArticles: 'Избранные статьи',
        randomArticle: 'Случайная статья',
        recentChanges: 'Свежие правки',
        help: 'Справка',
        portalsHeading: 'Порталы',
        portalOS: 'Операционные системы',
        portalGames: 'Видеоигры 1998',
        portalHardware: 'Железо и 3D-графика',
        portalInternet: 'Интернет и Сеть',
        portalSoftware: 'Программы и утилиты',
        portalCulture: 'Киберкультура 90-х',
        portalProject: 'Наш проект Win98',
        participateHeading: 'Участие',
        createArticle: 'Создать статью',
        communityPortal: 'Портал сообщества',
        sandbox: 'Песочница',
        toolboxHeading: 'Инструменты',
        openNotepad: 'Открыть в Блокноте',
        saveTxt: 'Сохранить в «Мои документы»',
        printPage: 'Печать статьи',
        otherLangsHeading: 'На других языках',
        otherLangLabel: 'English',
        badgeTitle: 'Интерпедия 1998',
        badgeDesc: 'Оптимизировано для Microslop Internet Explorer 5.0 • Разрешение 800x600',
        categoriesHeading: 'Категории:',
        referencesHeading: 'Примечания и литература',
        seeAlsoHeading: 'См. также',
        linksHeading: 'Ссылки',
        newsTitle: 'Текущие события',
        editSummary: 'Описание изменений:',
        savePageBtn: 'Записать страницу',
        previewBtn: 'Предварительный просмотр',
        cancelBtn: 'Отмена',
        editNotice: 'Внимание: вы редактируете свободную энциклопедию. Пожалуйста, соблюдайте нейтральную точку зрения (NPOV) и проверяемость.',
        talkNotice: 'Это страница обсуждения статьи. Оставляйте свои реплики с подписью никнейма и даты.',
        talkAddTitle: 'Добавить комментарий в обсуждение',
        talkAuthorLabel: 'Ваше имя или ник:',
        talkMsgPlaceholder: 'Напишите ваш аргумент или предложение по улучшению статьи...',
        talkSubmitBtn: 'Добавить реплику',
        historyHeading: 'История изменений статьи',
        historyIntro: 'Ниже приведен список последних правок данной статьи:',
        searchResultsFor: 'Результаты поиска по запросу:',
        noResultsFound: 'По вашему запросу ничего не найдено. Вы можете создать статью с таким названием.',
        welcomeTitle: 'Добро пожаловать в Интерпедию,',
        welcomeSub: 'свободную энциклопедию, которую может редактировать каждый.',
        statsArticles: 'Всего статей:',
        statsWords: 'Слов:',
        statsEditors: 'Авторов онлайн:',
        featuredArticleTitle: 'Избранная статья',
        didYouKnowTitle: 'Знаете ли вы, что...',
        pictureOfTheDayTitle: 'Изображение дня',
        webRingTitle: 'Кольцо ретро-сайтов'
      },
      en: {
        brandTitle: 'Interpedia',
        brandSlogan: 'The Free Internet Encyclopedia',
        tabArticle: 'Article',
        tabTalk: 'Discussion',
        tabEdit: 'Edit this page',
        tabHistory: 'History',
        tabPrint: 'Printable version',
        searchPlaceholder: 'Search encyclopedia...',
        searchBtn: 'Search',
        searchGoBtn: 'Go',
        siteSub: 'From Interpedia, the free encyclopedia',
        tocTitle: 'Contents',
        tocHide: 'hide',
        tocShow: 'show',
        navHeading: 'Navigation',
        mainPage: 'Main Page',
        featuredArticles: 'Featured articles',
        randomArticle: 'Random article',
        recentChanges: 'Recent changes',
        help: 'Help',
        portalsHeading: 'Portals',
        portalOS: 'Operating Systems',
        portalGames: 'Video Games 1998',
        portalHardware: 'Hardware & 3D Graphics',
        portalInternet: 'Internet & Web',
        portalSoftware: 'Software & Utilities',
        portalCulture: '1990s Cyber Culture',
        portalProject: 'The Win98 Project',
        participateHeading: 'Interaction',
        createArticle: 'Create new article',
        communityPortal: 'Community portal',
        sandbox: 'Sandbox',
        toolboxHeading: 'Toolbox',
        openNotepad: 'Open in Notepad',
        saveTxt: 'Save to My Documents',
        printPage: 'Print article',
        otherLangsHeading: 'In other languages',
        otherLangLabel: 'Русский',
        badgeTitle: 'Interpedia 1998',
        badgeDesc: 'Optimized for Microslop Internet Explorer 5.0 • Resolution 800x600',
        categoriesHeading: 'Categories:',
        referencesHeading: 'References and Sources',
        seeAlsoHeading: 'See also',
        linksHeading: 'External links',
        newsTitle: 'In the news',
        editSummary: 'Summary of changes:',
        savePageBtn: 'Save page',
        previewBtn: 'Show preview',
        cancelBtn: 'Cancel',
        editNotice: 'Notice: You are editing the free encyclopedia. Please adhere to Neutral Point of View (NPOV) and cite your sources.',
        talkNotice: 'This is the discussion page for the article. Feel free to leave a constructive comment with your signature.',
        talkAddTitle: 'Add a comment to this discussion',
        talkAuthorLabel: 'Your name or nickname:',
        talkMsgPlaceholder: 'Write your comments or suggestions regarding this topic...',
        talkSubmitBtn: 'Post reply',
        historyHeading: 'Revision history of the article',
        historyIntro: 'Below is the log of recorded revisions for this entry:',
        searchResultsFor: 'Search results for:',
        noResultsFound: 'No page title matches were found. You may create a new entry with this title.',
        welcomeTitle: 'Welcome to Interpedia,',
        welcomeSub: 'the free Internet encyclopedia that anyone can edit.',
        statsArticles: 'Total articles:',
        statsWords: 'Words:',
        statsEditors: 'Active contributors:',
        featuredArticleTitle: 'Featured article',
        didYouKnowTitle: 'Did you know...',
        pictureOfTheDayTitle: 'Picture of the day',
        webRingTitle: 'The Retro WebRing'
      }
    };
  }

  getArticles() {
    return (typeof window !== 'undefined' && window.interpediaArticles) || {};
  }

  uniqueArticles() {
    const seen = new Set();
    return Object.keys(this.getArticles()).filter(id => {
      const art = this.getArticles()[id];
      if (id === 'main' || seen.has(art)) return false;
      seen.add(art);
      return true;
    });
  }

  getLogoSvg() {
    return window.webGif ? window.webGif('globe', 3) : '';
  }

  linkify(html) {
    if (!html) return '';
    const articles = this.getArticles();
    const missing = this.currentLang === 'ru' ? 'Статья ещё не написана' : 'This article has not been written yet';
    return String(html)
      .replace(/\{\{ref\|(\d+)\}\}/g, (m, n) => `<sup class="interpedia-ref"><a href="#ref-${n}">[${n}]</a></sup>`)
      .replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (m, target, label) => {
        const id = target.trim().toLowerCase();
        const text = (label || target).trim();
        if (articles[id] || /^(portal|category):/.test(id)) {
          return `<a class="interpedia-link" data-wiki-page="${id}">${text}</a>`;
        }
        return `<span class="interpedia-link-new" title="${missing}">${text}</span>`;
      });
  }

  renderBlocks(text) {
    const kept = [];
    const source = String(text || '').trim().replace(/<pre>[\s\S]*?<\/pre>/gi, pre => `\u0000${kept.push(pre) - 1}\u0000`);
    return source.split(/\n\s*\n/).map(block => {
      const b = block.trim().replace(/\u0000(\d+)\u0000/g, (m, i) => kept[i]);
      return /^<(ul|ol|table|blockquote|div|pre|dl)/i.test(b) ? this.linkify(b) : `<p>${this.linkify(b)}</p>`;
    }).join('\n');
  }

  plainText(html) {
    return String(html || '')
      .replace(/\{\{ref\|\d+\}\}/g, '')
      .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/<li>/gi, '\n- ')
      .replace(/<br\s*\/?>|<\/p>|<\/blockquote>/gi, '\n')
      .replace(/<\/t[dh]>/gi, '\t')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#91;/g, '[')
      .replace(/&#93;/g, ']')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/[ \t]*\n[ \t]*/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  toWikitext(html) {
    return this.plainText(String(html || '')
      .replace(/\[\[/g, '\u0001').replace(/\]\]/g, '\u0002')
      .replace(/<\/?(strong|b)>/gi, "'''")
      .replace(/<\/?(em|i)>/gi, "''")
      .replace(/<li>/gi, '\n* '))
      .replace(/\u0001/g, '[[').replace(/\u0002/g, ']]');
  }

  articleText(content) {
    let text = `${content.title}\n========================================\n\n${this.plainText(content.lead)}\n\n`;
    (content.sections || []).forEach(s => {
      text += `[${s.title}]\n${this.plainText(s.content)}\n\n`;
    });
    return text;
  }

  wordCount() {
    const re = /[A-Za-zА-Яа-яЁё0-9]+/g;
    return this.uniqueArticles().reduce((sum, id) => {
      const c = this.getArticles()[id][this.currentLang];
      if (!c) return sum;
      const text = [c.lead, ...(c.sections || []).map(s => s.content)].map(t => this.plainText(t)).join(' ');
      return sum + (text.match(re) || []).length;
    }, 0);
  }

  parseWikitext(text) {
    if (!text) return '';
    let html = String(text);

    html = html.replace(/'''''(.*?)'''''/g, '<b><i>$1</i></b>');
    html = html.replace(/'''(.*?)'''/g, '<b>$1</b>');
    html = html.replace(/''(.*?)''/g, '<i>$1</i>');

    html = html.replace(/^=== (.*?) ===$/gm, '<h3>$1</h3>');
    html = html.replace(/^== (.*?) ==$/gm, '<h2>$1</h2>');
    html = html.replace(/(^\* .*$\n?)+/gm, list => `<ul>${list.trim().split('\n').map(li => `<li>${li.replace(/^\* /, '')}</li>`).join('')}</ul>`);

    html = this.linkify(html);

    html = html.replace(/\n\n+/g, '</p><p>');
    return `<p>${html}</p>`;
  }

  renderSite(url) {
    this.parseUrl(url);

    const i18n = this.getI18n()[this.currentLang] || this.getI18n()['ru'];
    const articles = this.getArticles();
    const articleData = articles[this.activeArticleId] || articles['windows98'];
    const articleContent = articleData[this.currentLang] || articleData['ru'];
    const tab = (id, label) => this.activeTab === id
      ? `<b class="interpedia-tab active" data-tab="${id}">${label}</b>`
      : `<a class="interpedia-tab" data-tab="${id}">${label}</a>`;
    const portals = [
      ['portal:os', i18n.portalOS], ['portal:games', i18n.portalGames], ['portal:hardware', i18n.portalHardware],
      ['portal:software', i18n.portalSoftware], ['portal:internet', i18n.portalInternet], ['portal:culture', i18n.portalCulture],
      ['portal:project', i18n.portalProject]
    ];

    return `
      <div class="interpedia-wrapper">
        <table class="interpedia-header" cellspacing="0">
          <tr>
            <td class="interpedia-brand" data-wiki-page="main">
              ${this.getLogoSvg()}
              <div class="interpedia-brand-titles">
                <span class="interpedia-title-text">${i18n.brandTitle}</span>
                <span class="interpedia-slogan">${i18n.brandSlogan}</span>
              </div>
            </td>
            <td class="interpedia-header-actions">
              <div class="interpedia-tabs-bar">
                <a data-wiki-page="main">${i18n.mainPage}</a> |
                ${tab('read', i18n.tabArticle)} |
                ${tab('talk', i18n.tabTalk)} |
                ${tab('edit', i18n.tabEdit)} |
                ${tab('history', i18n.tabHistory)} |
                ${tab('print', i18n.tabPrint)}
              </div>
              <div class="interpedia-lang-selector">
                ${this.currentLang === 'ru' ? '<b>Русский</b>' : '<a class="interpedia-lang-btn" data-lang="ru">Русский</a>'} |
                ${this.currentLang === 'en' ? '<b>English</b>' : '<a class="interpedia-lang-btn" data-lang="en">English</a>'}
              </div>
            </td>
          </tr>
        </table>
        <table class="interpedia-body-layout" cellspacing="0">
          <tr>
            <td class="interpedia-sidebar">
              <div class="interpedia-search-box">
                <input type="text" class="interpedia-search-input" id="interpedia-search-input" value="${this.escapeHtml(this.searchQuery)}"><br>
                <button class="win-btn interpedia-search-btn" id="btn-interpedia-go">${i18n.searchGoBtn}</button>
                <button class="win-btn interpedia-search-btn" id="btn-interpedia-search">${i18n.searchBtn}</button>
              </div>
              <hr>
              <a data-wiki-page="main">${i18n.mainPage}</a><br>
              <a data-wiki-page="windows98">${i18n.featuredArticles}</a><br>
              <a id="btn-sidebar-random">${i18n.randomArticle}</a><br>
              <a data-wiki-page="interpedia">${i18n.help}</a>
              <hr>
              <b>${i18n.portalsHeading}</b><br>
              ${portals.map(([id, label]) => `<a data-wiki-page="${id}">${label}</a>`).join('<br>')}
              <hr>
              <a data-action="new-article">${i18n.createArticle}</a><br>
              <a data-wiki-page="interpedia">${i18n.communityPortal}</a>
              <hr>
              <a id="btn-tool-notepad">${i18n.openNotepad}</a><br>
              <a id="btn-tool-savetxt">${i18n.saveTxt}</a><br>
              <a id="btn-tool-print">${i18n.printPage}</a>
              <hr>
              ${i18n.otherLangsHeading}:<br>
              <a id="btn-sidebar-lang-switch">${i18n.otherLangLabel}</a>
            </td>
            <td class="interpedia-content">
              ${this.renderActiveTabContent(articleData, articleContent, i18n)}
            </td>
          </tr>
        </table>
        <div class="interpedia-footer">
          <a data-wiki-page="main">${i18n.mainPage}</a> |
          ${tab('edit', i18n.tabEdit)} |
          ${tab('talk', i18n.tabTalk)} |
          ${tab('history', i18n.tabHistory)}<br>
          <span class="interpedia-footer-note">${i18n.badgeTitle}. ${i18n.badgeDesc}</span><br>
          <a href="mailto:editor@interpedia.org">editor@interpedia.org</a>
        </div>
      </div>
    `;
  }

  renderActiveTabContent(articleData, articleContent, i18n) {
    if (this.searchQuery && this.activeTab === 'search') {
      return this.renderSearchResultsView(this.searchQuery, i18n);
    }

    if (this.activeTab === 'category' || (this.activeArticleId && (this.activeArticleId.startsWith('portal:') || this.activeArticleId.startsWith('category:')))) {
      return this.renderCategoryView(this.activeArticleId, i18n);
    }

    if (this.activeTab === 'talk') {
      return this.renderTalkView(this.activeArticleId, articleContent, i18n);
    }

    if (this.activeTab === 'edit') {
      return this.renderEditView(this.activeArticleId, articleContent, i18n);
    }

    if (this.activeTab === 'history') {
      return this.renderHistoryView(this.activeArticleId, articleContent, i18n);
    }

    if (this.activeTab === 'print') {
      return this.renderPrintView(articleData, articleContent, i18n);
    }

    if (articleData && articleData.isMainPage) {
      return this.renderMainPortalView(articleContent, i18n);
    }

    return this.renderArticleStandardView(articleData, articleContent, i18n);
  }

  renderMainPortalView(content, i18n) {
    const count = this.uniqueArticles().length;
    const words = this.wordCount().toLocaleString(this.currentLang === 'ru' ? 'ru-RU' : 'en-US');
    const gif = (name, scale) => window.webGif ? window.webGif(name, scale) : '';
    const portals = [
      ['portal:os', i18n.portalOS], ['portal:games', i18n.portalGames], ['portal:hardware', i18n.portalHardware],
      ['portal:software', i18n.portalSoftware], ['portal:internet', i18n.portalInternet], ['portal:culture', i18n.portalCulture],
      ['portal:project', i18n.portalProject]
    ];

    return `
      <h1 class="interpedia-heading">${i18n.welcomeTitle}</h1>
      <p class="interpedia-mainpage-welcome">${i18n.welcomeSub} ${i18n.statsArticles} <b>${count}</b>, ${i18n.statsWords} <b>${words}</b>, ${i18n.statsEditors} <b>1 420</b>.</p>

      <h2>${i18n.portalsHeading}</h2>
      <p class="interpedia-portal-line">${portals.map(([id, label]) => `<a class="interpedia-link" data-wiki-page="${id}">${label}</a>`).join(' &middot; ')}</p>

      <table class="interpedia-mainpage-grid" cellspacing="0">
        <tr>
          <td>
            <h2>${i18n.featuredArticleTitle}</h2>
            <p>${this.linkify(content.featuredLead)}</p>
            <p><a class="interpedia-link" data-wiki-page="${content.featuredArticleId}">${this.currentLang === 'ru' ? 'Читать статью полностью...' : 'Read the full article...'}</a></p>
            ${content.news ? `
              <h2>${i18n.newsTitle}</h2>
              <ul>
                ${content.news.map(item => `<li>${this.linkify(item)}</li>`).join('')}
              </ul>
            ` : ''}
          </td>
          <td>
            <h2>${i18n.didYouKnowTitle}</h2>
            <ul>
              ${content.didYouKnow.map(item => `<li>${this.linkify(item)}</li>`).join('')}
            </ul>
          </td>
        </tr>
      </table>

      <h2>${i18n.pictureOfTheDayTitle}</h2>
      <table class="interpedia-thumb" cellspacing="0">
        <tr>
          <td class="interpedia-thumb-image">${gif(content.pictureGif || 'pc', 3)}</td>
          <td class="interpedia-thumb-caption"><b>${content.pictureTitle || '3dfx Voodoo 2 SLI'}</b><br>${this.linkify(content.pictureCaption)}</td>
        </tr>
      </table>
    `;
  }

  renderCategoryView(catKey, i18n) {
    const rawKey = (catKey || '').toLowerCase().replace(/^(portal:|category:)/, '').trim();
    const articles = this.getArticles();
    const matched = [];
    const seen = new Set();

    const categoryMap = {
      'os': 'os',
      'systems': 'os',
      'games': 'games',
      'gaming': 'games',
      'hardware': 'hardware',
      'hw': 'hardware',
      'software': 'software',
      'apps': 'software',
      'internet': 'internet',
      'web': 'internet',
      'culture': 'culture',
      'demoscene': 'culture',
      'project': 'project'
    };
    const targetCat = categoryMap[rawKey] || rawKey;

    Object.keys(articles).forEach(id => {
      if (id === 'main') return;
      const art = articles[id];
      const uniqueId = art.id || id;
      if (seen.has(uniqueId)) return;

      const c = art[this.currentLang] || art['ru'];
      let isMatch = false;

      if (art.category && art.category.toLowerCase() === targetCat) {
        isMatch = true;
      } else if (c && c.categories && Array.isArray(c.categories)) {
        if (c.categories.some(tag => tag.toLowerCase().includes(rawKey) || rawKey.includes(tag.toLowerCase()))) {
          isMatch = true;
        }
      }

      if (isMatch) {
        seen.add(uniqueId);
        matched.push({
          id: uniqueId,
          title: c ? c.title : uniqueId,
          lead: c && c.lead ? this.plainText(c.lead).substring(0, 150) + '...' : ''
        });
      }
    });

    matched.sort((a, b) => a.title.localeCompare(b.title));

    const portalNames = {
      'os': i18n.portalOS,
      'games': i18n.portalGames,
      'hardware': i18n.portalHardware,
      'software': i18n.portalSoftware,
      'internet': i18n.portalInternet,
      'culture': i18n.portalCulture,
      'project': i18n.portalProject
    };
    const displayTitle = portalNames[targetCat] || (this.currentLang === 'ru' ? `Категория: ${catKey}` : `Category: ${catKey}`);

    return `
      <h1 class="interpedia-heading">${displayTitle}</h1>
      <div class="interpedia-subheading">${i18n.siteSub}</div>
      <p>${this.currentLang === 'ru'
        ? `В этом разделе <b>${matched.length}</b> статей.`
        : `This portal lists <b>${matched.length}</b> articles.`}</p>
      <ul class="interpedia-category-catalog">
        ${matched.map(m => `
        <li><a class="interpedia-link" data-wiki-page="${m.id}">${m.title}</a> &mdash; <span class="interpedia-cat-lead">${m.lead}</span></li>`).join('')}
      </ul>
    `;
  }

  renderArticleStandardView(articleData, content, i18n) {
    const userWikitext = this.getUserEdit(this.activeArticleId, this.currentLang);
    if (userWikitext) {
      return `
        <h1 class="interpedia-heading">${content.title}</h1>
        <div class="interpedia-subheading">${i18n.siteSub}</div>
        <div class="interpedia-note">
          <em>${this.currentLang === 'ru' ? 'Вы просматриваете отредактированную вами версию статьи.' : 'You are viewing your locally modified revision of this entry.'}</em>
        </div>
        <div class="interpedia-custom-content">
          ${this.parseWikitext(userWikitext)}
        </div>
      `;
    }

    const articles = this.getArticles();
    const categoryGif = { os: 'pc', games: 'joy', hardware: 'tools', software: 'disk', internet: 'globe', culture: 'tv', project: 'construct' };
    let infoboxHTML = '';
    if (content.infobox) {
      const gifName = content.infobox.gif || categoryGif[articleData.category] || 'disk';
      infoboxHTML = `
        <div class="interpedia-infobox">
          <div class="interpedia-infobox-title">${content.infobox.title}</div>
          <div class="interpedia-infobox-image">
            ${window.webGif ? window.webGif(gifName, 2) : ''}<br>
            <span class="interpedia-infobox-badge">${content.infobox.badgeText || ''}</span>
          </div>
          <table class="interpedia-infobox-table">
            <tbody>
              ${content.infobox.fields.map(f => `
                <tr>
                  <th>${f.label}</th>
                  <td>${this.linkify(f.value)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    const sections = content.sections || [];
    const seeAlso = (content.seeAlso || []).filter(id => articles[id]);
    const references = content.references || [];
    const links = content.links || [];
    const toc = [];
    let major = 0;
    let minor = 0;
    sections.forEach(s => {
      if (s.sub && major) {
        minor += 1;
        toc.push({ id: s.id, title: s.title, num: `${major}.${minor}`, sub: true });
      } else {
        major += 1;
        minor = 0;
        toc.push({ id: s.id, title: s.title, num: `${major}` });
      }
    });
    [[seeAlso, 'see-also', i18n.seeAlsoHeading], [references, 'references', i18n.referencesHeading], [links, 'links', i18n.linksHeading]]
      .filter(([list]) => list.length)
      .forEach(([, id, title]) => {
        major += 1;
        toc.push({ id, title, num: `${major}` });
      });

    let tocHTML = '';
    if (sections.length > 0) {
      tocHTML = `
        <div class="interpedia-toc">
          <div class="interpedia-toc-header">
            <span>${i18n.tocTitle}</span>
            <span class="interpedia-toc-toggle" id="btn-toc-toggle">[${this.isTocHidden ? i18n.tocShow : i18n.tocHide}]</span>
          </div>
          <ul class="interpedia-toc-list" id="interpedia-toc-list" style="display:${this.isTocHidden ? 'none' : 'block'};">
            ${toc.map(t => `
              <li class="interpedia-toc-item${t.sub ? ' interpedia-toc-sub' : ''}">
                <span class="interpedia-toc-num">${t.num}</span>
                <a href="#section-${t.id}">${t.title}</a>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    const titleOf = id => {
      const art = articles[id];
      return (art[this.currentLang] || art.ru).title;
    };

    return `
      <h1 class="interpedia-heading">${content.title}</h1>
      <div class="interpedia-subheading">${i18n.siteSub}</div>

      ${content.hatnote ? `<div class="interpedia-hatnote">${this.parseWikitext(content.hatnote)}</div>` : ''}

      ${infoboxHTML}

      <div class="interpedia-lead">
        ${this.renderBlocks(content.lead)}
      </div>

      ${tocHTML}

      <div style="clear:both;"></div>

      ${sections.map(s => s.sub ? `
        <h3 id="section-${s.id}">${s.title}</h3>
        <div class="interpedia-section-content">
          ${this.renderBlocks(s.content)}
        </div>
      ` : `
        <h2 id="section-${s.id}">
          <span>${s.title}</span>
          <span class="edit-section">[<a class="btn-section-edit" data-section="${s.id}">${i18n.tabEdit}</a>]</span>
        </h2>
        <div class="interpedia-section-content">
          ${this.renderBlocks(s.content)}
        </div>
      `).join('')}

      ${seeAlso.length ? `
        <h2 id="section-see-also"><span>${i18n.seeAlsoHeading}</span></h2>
        <ul class="interpedia-see-also">
          ${seeAlso.map(id => `<li><a class="interpedia-link" data-wiki-page="${id}">${titleOf(id)}</a></li>`).join('')}
        </ul>
      ` : ''}

      ${references.length ? `
        <h2 id="section-references">
          <span>${i18n.referencesHeading}</span>
        </h2>
        <ol class="interpedia-references">
          ${references.map((r, i) => `
            <li id="ref-${i + 1}"><span class="interpedia-ref-backlink">^</span> ${this.linkify(r)}</li>
          `).join('')}
        </ol>
      ` : ''}

      ${links.length ? `
        <h2 id="section-links"><span>${i18n.linksHeading}</span></h2>
        <ul class="interpedia-external-links">
          ${links.map(([url, label]) => `<li><a data-url="${url}">${label}</a> <span class="interpedia-url">(${url.replace(/^http:\/\//, '')})</span></li>`).join('')}
        </ul>
      ` : ''}

      ${content.categories && content.categories.length ? `
        <div class="interpedia-catlinks">
          <strong>${i18n.categoriesHeading}</strong>
          ${content.categories.map(c => `<a class="interpedia-cat-link" data-cat="${this.escapeHtml(c)}" style="cursor:pointer; text-decoration:underline;">${c}</a>`).join(' | ')}
        </div>
      ` : ''}
    `;
  }

  renderTalkView(articleId, content, i18n) {
    const userComments = this.getTalkData(articleId);

    return `
      <h1 class="interpedia-heading">${i18n.tabTalk}: ${content.title}</h1>
      <div class="interpedia-subheading">${i18n.siteSub}</div>

      <p class="interpedia-note">${i18n.talkNotice}</p>

      ${this.articleTalkThreads(articleId, content).map(t => `
        <div class="interpedia-talk-thread">
          <div class="interpedia-talk-header">${this.escapeHtml(t.subject)}</div>
          <div class="interpedia-talk-message">${this.escapeHtml(t.message)}</div>
          <div class="interpedia-talk-meta">
            — <strong>${t.author}</strong> (${i18n.tabTalk.toLowerCase()}) ${t.date}
          </div>
        </div>
      `).join('')}

      ${userComments.map(c => `
        <div class="interpedia-talk-thread">
          <div class="interpedia-talk-header">${this.escapeHtml(c.subject || 'Комментарий')}</div>
          <div class="interpedia-talk-message">${this.escapeHtml(c.message)}</div>
          <div class="interpedia-talk-meta">
            — <strong>${this.escapeHtml(c.author)}</strong> (обсуждение) ${this.escapeHtml(c.date)}
          </div>
        </div>
      `).join('')}

      <div class="interpedia-talk-form">
        <div style="font-weight:bold; color:#000066; margin-bottom:8px;">${i18n.talkAddTitle}</div>
        <div style="margin-bottom:6px; display:flex; gap:8px; align-items:center;">
          <label style="font-size:11px; width:130px;">${i18n.talkAuthorLabel}</label>
          <input type="text" id="talk-input-author" value="Wikipedian98" style="padding:2px 4px; font-size:11px; width:160px; font-family:inherit;">
        </div>
        <div style="margin-bottom:6px; display:flex; gap:8px; align-items:center;">
          <label style="font-size:11px; width:130px;">Тема реплики / Subject:</label>
          <input type="text" id="talk-input-subject" placeholder="Тема сообщения..." style="padding:2px 4px; font-size:11px; flex:1; font-family:inherit;">
        </div>
        <div style="margin-bottom:8px;">
          <textarea id="talk-input-message" rows="4" placeholder="${i18n.talkMsgPlaceholder}" style="width:100%; box-sizing:border-box; font-family:inherit; font-size:11px; padding:4px;"></textarea>
        </div>
        <div style="text-align:right;">
          <button class="win-btn" id="btn-talk-submit" style="font-weight:bold; min-width:130px;">${i18n.talkSubmitBtn}</button>
        </div>
      </div>
    `;
  }

  renderEditView(articleId, content, i18n) {
    const existingEdit = this.getUserEdit(articleId, this.currentLang);
    let initialWikitext = existingEdit;

    if (!initialWikitext) {
      let text = `${this.toWikitext(content.lead)}\n\n`;
      (content.sections || []).forEach(s => {
        const mark = s.sub ? '===' : '==';
        text += `${mark} ${s.title} ${mark}\n${this.toWikitext(s.content)}\n\n`;
      });
      initialWikitext = text;
    }

    return `
      <h1 class="interpedia-heading">${i18n.tabEdit}: ${content.title}</h1>
      <div class="interpedia-subheading">${i18n.siteSub}</div>

      <p class="interpedia-note">${i18n.editNotice}</p>

      <div class="interpedia-edit-toolbar">
        <button type="button" class="interpedia-edit-btn" data-tag="bold" title="Жирный шрифт"><b>B</b></button>
        <button type="button" class="interpedia-edit-btn" data-tag="italic" title="Курсив"><i>I</i></button>
        <button type="button" class="interpedia-edit-btn" data-tag="h2" title="Заголовок 2-го уровня">== H2 ==</button>
        <button type="button" class="interpedia-edit-btn" data-tag="h3" title="Заголовок 3-го уровня">=== H3 ===</button>
        <button type="button" class="interpedia-edit-btn" data-tag="link" title="Внутренняя ссылка">[[Ссылка]]</button>
        <button type="button" class="interpedia-edit-btn" data-tag="ref" title="Сноска">[1]</button>
      </div>

      <textarea id="interpedia-edit-content" class="interpedia-edit-textarea" rows="16">${this.escapeHtml(initialWikitext)}</textarea>

      <div class="interpedia-edit-actions">
        <div style="display:flex; align-items:center; gap:6px; flex:1;">
          <label style="font-size:11px; white-space:nowrap;">${i18n.editSummary}</label>
          <input type="text" id="interpedia-edit-summary" placeholder="Краткое описание правки..." style="font-size:11px; padding:2px 4px; flex:1;">
        </div>
        <div style="display:flex; gap:6px;">
          <button class="win-btn" id="btn-interpedia-save" style="font-weight:bold;">${i18n.savePageBtn}</button>
          <button class="win-btn" id="btn-interpedia-preview">${i18n.previewBtn}</button>
          <button class="win-btn" id="btn-interpedia-cancel">${i18n.cancelBtn}</button>
        </div>
      </div>

      ${this.previewWikitext ? `
        <div class="interpedia-preview-box">
          <div style="font-weight:bold; color:#000066; border-bottom:1px dashed #7f9db9; padding-bottom:4px; margin-bottom:8px;">
            Предварительный просмотр / Live Preview:
          </div>
          <div>${this.parseWikitext(this.previewWikitext)}</div>
        </div>
      ` : ''}
    `;
  }

  seededRandom(seed) {
    let h = 2166136261;
    for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  formatEditDate(date) {
    const ru = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return this.currentLang === 'ru'
      ? `${date.getDate()} ${ru[date.getMonth()]} ${date.getFullYear()}, ${time}`
      : `${en[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}, ${time}`;
  }

  articleRevisions(articleId, content) {
    const rnd = this.seededRandom(articleId);
    const ru = this.currentLang === 'ru';
    const editors = ['RetroEditor98', 'Sysop256', 'FidoPoint_5020', 'Overclocker_Pro', 'RetroSysop98', 'NC_Forever', 'ModemWhistle', 'VoodooFan', 'Arj_Rar', 'Dejiko_nyo', 'BBS_Archivist', 'Webring_Master'];
    const pick = list => list[Math.floor(rnd() * list.length)];
    const sections = (content.sections || []).filter(sec => !sec.sub);
    const size = text => Math.round(this.plainText(text).length * (ru ? 1.8 : 1.05));
    const start = new Date(1998, 5, 25).getTime() + Math.floor(rnd() * 160) * 86400000;
    const end = new Date(1999, 11, 20).getTime();
    const steps = Math.min(sections.length, 3);
    const revisions = [{ author: 'InterpediaBot', bytes: 120, comment: ru ? 'Создание заготовки статьи (stub)' : 'Stub created' }];
    for (let i = 0; i < steps; i += 1) {
      const sec = sections[Math.floor((i + rnd()) * sections.length / steps)];
      revisions.push({ author: pick(editors), bytes: size(sec.content), comment: ru ? `Добавлен раздел «${sec.title}»` : `Added section "${sec.title}"` });
    }
    if ((content.references || []).length) {
      revisions.push({ author: pick(editors), bytes: 40 + Math.floor(rnd() * 200), comment: ru ? 'Источники и литература' : 'References added' });
    }
    revisions.push({ author: pick(editors), bytes: size(content.lead) + 300, comment: ru ? 'Карточка, введение, раздел «См. также»' : 'Infobox, lead and See also' });
    return revisions.map((rev, i) => {
      const at = start + (end - start) * (i / (revisions.length - 1 || 1));
      const date = new Date(at - Math.floor(rnd() * 3) * 86400000);
      date.setHours(i === 0 ? 0 : 8 + Math.floor(rnd() * 15), i === 0 ? 1 : Math.floor(rnd() * 60));
      return { ...rev, date: this.formatEditDate(date), bytes: '+' + rev.bytes.toLocaleString(ru ? 'ru-RU' : 'en-US') };
    }).reverse();
  }

  articleTalkThreads(articleId, content) {
    const rnd = this.seededRandom(articleId + ':talk');
    const ru = this.currentLang === 'ru';
    const editors = ['RetroSysop98', 'Overclocker_Pro', 'FidoPoint_5020', 'NC_Forever', 'ModemWhistle', 'BBS_Archivist'];
    const pick = list => list[Math.floor(rnd() * list.length)];
    const sections = (content.sections || []).filter(sec => !sec.sub);
    const firstRef = (content.references || [])[0];
    const middle = sections[Math.floor(sections.length / 2)] || sections[0];
    const last = sections[sections.length - 1];
    const date = (month, day) => this.formatEditDate(new Date(1999, month, day, 9 + Math.floor(rnd() * 12), Math.floor(rnd() * 60)));
    const threads = [];
    if (middle && firstRef) {
      threads.push({
        subject: ru ? `Источники к разделу «${middle.title}»` : `Sources for "${middle.title}"`,
        message: ru
          ? `Сверил раздел «${middle.title}» с источником: ${this.plainText(firstRef)} Если у кого-то есть подшивки журналов того времени, добавьте ещё ссылок — по правилу проверяемости каждое утверждение должно опираться на источник.`
          : `I checked the "${middle.title}" section against this source: ${this.plainText(firstRef)} If anyone has magazine back issues from the time, please add more references; under the verifiability rule every claim needs a source.`,
        author: pick(editors),
        date: date(3 + Math.floor(rnd() * 5), 1 + Math.floor(rnd() * 27))
      });
    }
    if (last) {
      threads.push({
        subject: ru ? 'Из заготовки — в полную статью' : 'From stub to full article',
        message: ru
          ? `Статья выросла из заготовки в несколько строк. Предлагаю номинировать её в избранные, когда раздел «${last.title}» получит ещё пару абзацев и примечаний. Возражения?`
          : `This article grew out of a few-line stub. I suggest nominating it as featured once the "${last.title}" section gets a couple more paragraphs and notes. Objections?`,
        author: pick(editors),
        date: date(10 + Math.floor(rnd() * 2), 1 + Math.floor(rnd() * 27))
      });
    }
    return threads;
  }

  renderHistoryView(articleId, content, i18n) {
    const revisions = this.articleRevisions(articleId, content);
    const ru = this.currentLang === 'ru';

    return `
      <h1 class="interpedia-heading">${i18n.historyHeading}: ${content.title}</h1>
      <div class="interpedia-subheading">${i18n.siteSub}</div>

      <p style="font-size:11px; color:#555;">${i18n.historyIntro}</p>

      <table class="win-table" style="width:100%; font-size:11px; border-collapse:collapse; background:#ffffff; border:1px solid #ccc;">
        <thead>
          <tr style="background:#eef3fa; text-align:left;">
            <th style="padding:4px 8px; border:1px solid #ccc;">${ru ? 'Дата и время' : 'Date and time'}</th>
            <th style="padding:4px 8px; border:1px solid #ccc;">${ru ? 'Участник' : 'User'}</th>
            <th style="padding:4px 8px; border:1px solid #ccc;">${ru ? 'Размер' : 'Size'}</th>
            <th style="padding:4px 8px; border:1px solid #ccc;">${ru ? 'Описание правки' : 'Edit summary'}</th>
          </tr>
        </thead>
        <tbody>
          ${revisions.map(r => `
            <tr>
              <td style="padding:4px 8px; border:1px solid #eee;"><a>${r.date}</a></td>
              <td style="padding:4px 8px; border:1px solid #eee; font-weight:bold; color:#000080;">${r.author}</td>
              <td style="padding:4px 8px; border:1px solid #eee; color:#006600;">${r.bytes}</td>
              <td style="padding:4px 8px; border:1px solid #eee;"><em>${this.escapeHtml(r.comment)}</em></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  renderPrintView(articleData, content, i18n) {
    return `
      <div style="background:#ffffff; padding:20px; font-family:'Times New Roman', Times, serif; font-size:13px; line-height:1.5;">
        <div style="text-align:right; font-size:10px; color:#666; margin-bottom:10px;">
          Interpedia: The Free Encyclopedia • Document Print Version
        </div>
        <h1 style="font-size:26px; border-bottom:2px solid #000; padding-bottom:4px; margin:0 0 10px 0;">${content.title}</h1>
        ${this.renderBlocks(content.lead)}
        ${(content.sections || []).map(s => `
          <h${s.sub ? 3 : 2} style="font-size:${s.sub ? 15 : 18}px; border-bottom:${s.sub ? 0 : 1}px solid #666; margin-top:16px;">${s.title}</h${s.sub ? 3 : 2}>
          <div>${this.renderBlocks(s.content)}</div>
        `).join('')}
        <div style="margin-top:20px; font-size:10px; color:#666; border-top:1px solid #ccc; padding-top:6px;">
          Printed from Microslop Internet Explorer 5.0 on ${new Date().toLocaleDateString()}
        </div>
      </div>
    `;
  }

  renderSearchResultsView(query, i18n) {
    const q = query.toLowerCase().trim();
    const articles = this.getArticles();
    const matches = [];

    const snippetAround = text => {
      const at = Math.max(0, text.toLowerCase().indexOf(q) - 60);
      return (at ? '...' : '') + text.substring(at, at + 180) + '...';
    };

    this.uniqueArticles().forEach(id => {
      const art = articles[id];
      const content = art[this.currentLang] || art['ru'];
      let matchScore = 0;
      let matchedSnippet = '';
      const lead = this.plainText(content.lead);

      if (content.title.toLowerCase().includes(q)) matchScore += 10;
      if (lead.toLowerCase().includes(q)) {
        matchScore += 5;
        matchedSnippet = snippetAround(lead);
      }
      (content.sections || []).forEach(s => {
        const text = this.plainText(s.content);
        if (s.title.toLowerCase().includes(q)) matchScore += 4;
        if (text.toLowerCase().includes(q)) {
          matchScore += 2;
          if (!matchedSnippet) matchedSnippet = snippetAround(text);
        }
      });

      if (matchScore > 0) {
        matches.push({
          id,
          score: matchScore,
          title: content.title,
          snippet: matchedSnippet || lead.substring(0, 180) + '...'
        });
      }
    });
    matches.sort((a, b) => b.score - a.score);

    return `
      <h1 class="interpedia-heading">${i18n.searchResultsFor} «${this.escapeHtml(query)}»</h1>
      <div class="interpedia-subheading">${i18n.siteSub}</div>

      <div style="font-size:12px; color:#555; margin-bottom:12px;">
        ${this.currentLang === 'ru' ? `Найдено результатов: <strong>${matches.length}</strong>` : `Matches found: <strong>${matches.length}</strong>`}
      </div>

      ${matches.length === 0 ? `
        <div style="background:#fffbe6; border:1px solid #ffe58f; padding:10px; font-size:11px;">
          ${i18n.noResultsFound}
        </div>
      ` : `
        <div class="interpedia-search-results">
          ${matches.map(m => `
            <div class="interpedia-search-item">
              <div class="interpedia-search-item-title">
                <a class="interpedia-link" data-wiki-page="${m.id}">${m.title}</a>
              </div>
              <div class="interpedia-search-item-snippet">${m.snippet}</div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  attachEvents(win, container, url) {
    container.querySelectorAll('.interpedia-content a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = container.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ block: 'start' });
      });
    });

    if (!container) return;

    const goToPage = (pageId, tab = 'read', query = '') => {
      this.activeArticleId = pageId;
      this.activeTab = tab;
      this.searchQuery = query;
      this.previewWikitext = null;
      if (window.soundSys && typeof window.soundSys.playClick === 'function') {
        window.soundSys.playClick();
      }
      if (window.appIE) {
        const targetUrl = `http://www.interpedia.org/wiki/${pageId}${tab !== 'read' ? '?tab=' + tab : ''}`;
        window.appIE.navigate(win, targetUrl);
      }
    };

    container.querySelectorAll('.interpedia-brand').forEach(el => {
      el.addEventListener('click', () => goToPage('main'));
    });

    container.querySelectorAll('[data-wiki-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.dataset.wikiPage;
        goToPage(pageId);
      });
    });

    container.querySelectorAll('.interpedia-cat-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = link.dataset.cat || link.textContent.trim();
        goToPage('category:' + cat, 'category');
      });
    });

    container.querySelectorAll('.interpedia-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        this.currentLang = lang;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.storageLangKey, lang);
        }
        if (window.soundSys) window.soundSys.playClick();
        goToPage(this.activeArticleId, this.activeTab, this.searchQuery);
      });
    });

    const sidebarLangSwitch = container.querySelector('#btn-sidebar-lang-switch');
    if (sidebarLangSwitch) {
      sidebarLangSwitch.addEventListener('click', () => {
        this.currentLang = this.currentLang === 'ru' ? 'en' : 'ru';
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.storageLangKey, this.currentLang);
        }
        if (window.soundSys) window.soundSys.playClick();
        goToPage(this.activeArticleId, this.activeTab, this.searchQuery);
      });
    }

    container.querySelectorAll('.interpedia-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        goToPage(this.activeArticleId, targetTab);
      });
    });

    container.querySelectorAll('.btn-section-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        goToPage(this.activeArticleId, 'edit');
      });
    });

    const btnRandom = container.querySelector('#btn-sidebar-random');
    if (btnRandom) {
      btnRandom.addEventListener('click', () => {
        const articles = Object.keys(this.getArticles()).filter(id => id !== 'main');
        const randId = articles[Math.floor(Math.random() * articles.length)];
        goToPage(randId);
      });
    }

    const btnTocToggle = container.querySelector('#btn-toc-toggle');
    const tocList = container.querySelector('#interpedia-toc-list');
    if (btnTocToggle && tocList) {
      btnTocToggle.addEventListener('click', () => {
        this.isTocHidden = !this.isTocHidden;
        tocList.style.display = this.isTocHidden ? 'none' : 'block';
        const i18n = this.getI18n()[this.currentLang] || this.getI18n()['ru'];
        btnTocToggle.textContent = `[${this.isTocHidden ? i18n.tocShow : i18n.tocHide}]`;
      });
    }

    const searchInput = container.querySelector('#interpedia-search-input');
    const btnSearch = container.querySelector('#btn-interpedia-search');
    const btnGo = container.querySelector('#btn-interpedia-go');

    const triggerSearch = (isExactGo = false) => {
      const q = (searchInput ? searchInput.value : '').trim();
      if (!q) return;

      const cleanLower = q.toLowerCase();
      const articles = this.getArticles();

      if (isExactGo && articles[cleanLower]) {
        goToPage(cleanLower);
        return;
      }

      const matchedId = Object.keys(articles).find(id => {
        const c = articles[id][this.currentLang] || articles[id]['ru'];
        return c.title.toLowerCase() === cleanLower;
      });

      if (isExactGo && matchedId) {
        goToPage(matchedId);
        return;
      }

      goToPage(this.activeArticleId, 'search', q);
    };

    if (btnSearch) btnSearch.addEventListener('click', () => triggerSearch(false));
    if (btnGo) btnGo.addEventListener('click', () => triggerSearch(true));
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerSearch(true);
      });
    }

    container.querySelectorAll('[data-action="new-article"]').forEach(btn => {
      btn.addEventListener('click', () => {
        goToPage('interpedia', 'edit');
      });
    });

    const btnNotepad = container.querySelector('#btn-tool-notepad');
    if (btnNotepad) {
      btnNotepad.addEventListener('click', () => {
        const articles = this.getArticles();
        const art = articles[this.activeArticleId] || articles['windows98'];
        const content = art[this.currentLang] || art['ru'];
        const docText = this.articleText(content);
        if (window.appNotepad) window.appNotepad.open(null, docText);
      });
    }

    const btnSaveTxt = container.querySelector('#btn-tool-savetxt');
    if (btnSaveTxt) {
      btnSaveTxt.addEventListener('click', () => {
        const articles = this.getArticles();
        const art = articles[this.activeArticleId] || articles['windows98'];
        const content = art[this.currentLang] || art['ru'];
        const docText = this.articleText(content);
        const fileName = `Interpedia_${this.activeArticleId}.txt`;
        if (window.vfs) {
          window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], fileName, docText);
        }
        if (window.winManager) {
          window.winManager.openDialog({
            title: 'Interpedia',
            icon: 'info',
            message: `Статья <b>${content.title}</b> успешно сохранена в файл <b>${fileName}</b> в папку «Мои документы»!`
          });
        }
      });
    }

    const btnPrint = container.querySelector('#btn-tool-print');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        goToPage(this.activeArticleId, 'print');
      });
    }

    const btnTalkSubmit = container.querySelector('#btn-talk-submit');
    if (btnTalkSubmit) {
      btnTalkSubmit.addEventListener('click', () => {
        const authorInp = container.querySelector('#talk-input-author');
        const subjectInp = container.querySelector('#talk-input-subject');
        const msgInp = container.querySelector('#talk-input-message');
        const author = (authorInp ? authorInp.value : 'Wikipedian98').trim();
        const subject = (subjectInp ? subjectInp.value : 'Предложение').trim();
        const message = (msgInp ? msgInp.value : '').trim();

        if (!message) return;

        const dateStr = new Date().toLocaleString();
        this.saveTalkComment(this.activeArticleId, { author, subject, message, date: dateStr });
        if (window.soundSys) window.soundSys.playDing();
        goToPage(this.activeArticleId, 'talk');
      });
    }

    const editArea = container.querySelector('#interpedia-edit-content');
    container.querySelectorAll('.interpedia-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!editArea) return;
        const tag = btn.dataset.tag;
        const start = editArea.selectionStart;
        const end = editArea.selectionEnd;
        const sel = editArea.value.substring(start, end);
        let replacement = '';

        if (tag === 'bold') replacement = `'''${sel || 'Жирный текст'}'''`;
        else if (tag === 'italic') replacement = `''${sel || 'Курсивный текст'}''`;
        else if (tag === 'h2') replacement = `== ${sel || 'Заголовок'} ==`;
        else if (tag === 'h3') replacement = `=== ${sel || 'Подзаголовок'} ===`;
        else if (tag === 'link') replacement = `[[${sel || 'Статья'}]]`;
        else if (tag === 'ref') replacement = `[${sel || '1'}]`;

        editArea.value = editArea.value.substring(0, start) + replacement + editArea.value.substring(end);
        editArea.focus();
      });
    });

    const btnSavePage = container.querySelector('#btn-interpedia-save');
    if (btnSavePage && editArea) {
      btnSavePage.addEventListener('click', () => {
        const wikitext = editArea.value;
        this.saveUserEdit(this.activeArticleId, this.currentLang, wikitext);
        if (window.soundSys) window.soundSys.playDing();
        if (window.winManager) {
          window.winManager.openDialog({
            title: 'Interpedia',
            icon: 'info',
            message: `Ваша правка статьи <b>${this.activeArticleId}</b> успешно сохранена в базе данных Интерпедии!`
          });
        }
        goToPage(this.activeArticleId, 'read');
      });
    }

    const btnPreview = container.querySelector('#btn-interpedia-preview');
    if (btnPreview && editArea) {
      btnPreview.addEventListener('click', () => {
        this.previewWikitext = editArea.value;
        const previewBox = container.querySelector('.interpedia-preview-box');
        if (previewBox) {
          previewBox.innerHTML = `
            <div style="font-weight:bold; color:#000066; border-bottom:1px dashed #7f9db9; padding-bottom:4px; margin-bottom:8px;">
              Предварительный просмотр / Live Preview:
            </div>
            <div>${this.parseWikitext(this.previewWikitext)}</div>
          `;
          previewBox.scrollIntoView({ behavior: 'smooth' });
        } else {
          goToPage(this.activeArticleId, 'edit');
        }
      });
    }

    const btnCancel = container.querySelector('#btn-interpedia-cancel');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        goToPage(this.activeArticleId, 'read');
      });
    }
  }

  parseUrl(url) {
    if (!url) return;
    const clean = url.toLowerCase();

    if (clean.includes('lang=en') || clean.includes('en.interpedia') || clean.includes('/wiki/en/')) {
      this.currentLang = 'en';
    } else if (clean.includes('lang=ru') || clean.includes('ru.interpedia') || clean.includes('/wiki/ru/')) {
      this.currentLang = 'ru';
    }

    if (clean.includes('tab=edit')) this.activeTab = 'edit';
    else if (clean.includes('tab=talk')) this.activeTab = 'talk';
    else if (clean.includes('tab=history')) this.activeTab = 'history';
    else if (clean.includes('tab=print')) this.activeTab = 'print';
    else if (clean.includes('tab=search')) this.activeTab = 'search';
    else this.activeTab = 'read';

    if (clean.includes('?q=')) {
      try {
        this.searchQuery = decodeURIComponent(url.split('?q=')[1].split('&')[0]);
        this.activeTab = 'search';
      } catch (e) {}
    }

    const articles = this.getArticles();
    const pageMatch = clean.match(/(?:\/wiki\/|article=)([^?&#\/]+)/);
    const pageKey = pageMatch ? pageMatch[1] : clean.split(/[?#]/)[0].split('/').pop();
    if (articles[pageKey]) {
      this.activeArticleId = pageKey;
      return;
    }

    if (clean.includes('/wiki/portal:') || clean.includes('/wiki/category:')) {
      const seg = clean.split('/wiki/')[1];
      if (seg) {
        this.activeArticleId = seg.split('?')[0];
        this.activeTab = 'category';
        return;
      }
    }

    if (clean.endsWith('interpedia.org') || clean.endsWith('interpedia.ru') || clean.endsWith('/wiki') || clean.endsWith('/wiki/')) {
      this.activeArticleId = 'main';
    }
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
}

if (typeof window !== 'undefined') {
  window.interpediaSite = new InterpediaSiteEngine();
}
