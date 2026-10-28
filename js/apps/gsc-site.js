const GSC_BASE = 'http://www.gsc-game.com';

class GSCSite {
  constructor() {
    this.pollStorageKey = 'win98_gsc_poll_v1';
    this.radioStorageKey = 'win98_gsc_radio_posts_v1';
    this.hitsStorageKey = 'win98_gsc_hits_v1';
    this.newsCategory = 'all';
    this.searchQuery = '';
    this.activeAnomalyId = 'electra';
    this.activeDetectorId = 'otklik';
    this.boltTelemetry = null;
    this.activeRadioChannel = 'all';
    this.guideProgress = {};
    this.zoomShot = '';
    this.hitCounted = false;
  }

  data() {
    return window.GSC_DATA;
  }

  esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  gif(name, scale = 1) {
    return window.webGif ? window.webGif(name, scale) : '';
  }

  url(path = '') {
    return GSC_BASE + path;
  }

  parseRoute(url) {
    const raw = String(url || GSC_BASE);
    const lower = raw.toLowerCase();
    const readParam = (key) => {
      const m = new RegExp(`[?&]${key}=([^&#]*)`, 'i').exec(raw);
      if (!m) return '';
      try {
        return decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
      } catch (e) {
        return '';
      }
    };
    const path = lower.replace(/^https?:\/{2}[^/]+/, '').split(/[?#]/)[0];

    if (path.startsWith('/search')) {
      this.searchQuery = readParam('q');
      return { view: 'search', q: this.searchQuery };
    }
    if (path.startsWith('/game/') || path === '/game') {
      const id = readParam('id') || path.split('/game/')[1] || 'stalker98';
      return { view: 'game', id };
    }
    if (path.startsWith('/games')) return { view: 'games' };
    if (path.startsWith('/article')) return { view: 'article', id: readParam('id') || 'news-three-builds' };
    if (path.startsWith('/devlog')) {
      const file = path.split('/devlog/')[1] || '';
      const id = readParam('id');
      const docs = this.data().devlogs || [];
      const doc = docs.find(d => d.id === id) || docs.find(d => file && d.fileName.toLowerCase() === file);
      return doc ? { view: 'devlog-file', id: doc.id } : { view: 'devlog-index' };
    }
    if (path.startsWith('/pda') || path.startsWith('/zone') || path.startsWith('/guide')) {
      const anom = readParam('anomaly');
      if (anom && (this.data().anomalies || []).some(a => a.id === anom)) this.activeAnomalyId = anom;
      return { view: 'pda' };
    }
    if (path.startsWith('/stalkers') || path.startsWith('/radio') || path.startsWith('/guestbook')) return { view: 'stalkers' };
    if (path.startsWith('/studio') || path.startsWith('/about') || path.startsWith('/contacts')) return { view: 'studio' };
    return { view: 'home' };
  }

  getGameCatalogEntry(id) {
    const d = this.data();
    const meta = (d.games || []).find(g => g.id === id) || d.games[0];
    const gmId = meta.demo || meta.id;
    const isDemo = Boolean(meta.demo);
    const cat = window.gameManager && window.gameManager.catalog && window.gameManager.catalog[gmId]
      ? window.gameManager.catalog[gmId]
      : null;
    const isInstalled = Boolean(window.gameManager && window.gameManager.isInstalled && window.gameManager.isInstalled(gmId));
    const isPurchased = !isDemo && Boolean(window.gameManager && window.gameManager.isPurchased && window.gameManager.isPurchased(gmId));

    return {
      ...meta,
      gmId,
      isDemo,
      title: cat ? cat.title : meta.shortTitle,
      subtitle: cat ? cat.subtitle : meta.lead,
      developer: cat ? cat.developer : 'GSC Game World',
      genre: cat ? cat.genre : 'Шутер / RPG',
      tags: cat && Array.isArray(cat.tags) ? cat.tags : ['Зона', 'Сталкер', 'GSC'],
      priceDisplay: cat ? cat.priceDisplay : meta.priceDisplay,
      fileSize: cat ? cat.fileSize : meta.fileSize,
      exe: cat ? cat.targetExe : meta.exe,
      setupExe: cat ? cat.setupExe : meta.setupExe,
      folder: cat ? cat.folder : meta.folder,
      shots: cat && Array.isArray(cat.shots) ? cat.shots : ['Игровой экран', 'Полевой выезд'],
      isInstalled,
      isPurchased
    };
  }

  allGames() {
    return (this.data().games || []).map(g => this.getGameCatalogEntry(g.id));
  }

  cdPath(game) {
    return `D:\\demo\\${game.setupExe}`;
  }

  shotSrc(game, n) {
    return game.isDemo ? `content/igromania/demos/${game.gmId}-${n}.jpg` : `content/steam/${game.id}-${n}.jpg`;
  }

  priceText(game) {
    return game.isDemo ? 'демоверсия, бесплатно на CD «Игромании»' : game.priceDisplay;
  }

  gameStatusText(game) {
    if (game.isInstalled) return `Установлено: C:\\Games\\${game.folder}\\${game.exe}`;
    if (game.isDemo) return `Демоверсия на компакт-диске журнала «Игромания»: ${this.cdPath(game)}`;
    if (game.isPurchased) return 'Куплено в Steam, ещё не установлено';
    return `В продаже в Steam: ${game.priceDisplay}`;
  }

  renderGameStatus(game) {
    const kind = game.isInstalled ? 'installed' : game.isPurchased ? 'owned' : 'store';
    return `<span class="gsc-status gsc-status-${kind}">${this.esc(this.gameStatusText(game))}</span>`;
  }

  renderGameButtons(game) {
    const primaryLabel = game.isInstalled
      ? `Запустить ${this.esc(game.exe)}`
      : game.isDemo
        ? 'Демоверсия на диске «Игромании»'
        : game.isPurchased
          ? 'Установить через Steam'
          : `Купить в Steam (${this.esc(game.priceDisplay)})`;
    const steamButton = game.isInstalled && !game.isDemo
      ? `<button class="win-btn btn-gsc-steam" data-game-id="${this.esc(game.gmId)}">Страница в Steam</button>`
      : '';
    return `<button class="win-btn btn-gsc-game-primary" data-game-id="${this.esc(game.gmId)}"><b>${primaryLabel}</b></button>${steamButton}`;
  }

  downloadTimes(fileSize) {
    const mb = parseFloat(String(fileSize).replace(',', '.')) || 0;
    const bytes = mb * 1048576;
    return [
      ['Модем 14 400', 14.4],
      ['Модем 28 800', 28.8],
      ['Модем 33 600', 33.6],
      ['Модем 56K (на практике 44 000)', 44],
      ['ISDN 64 Кбит/с', 64]
    ].map(([label, kbps]) => [label, this.formatDuration(bytes / (kbps * 100))]);
  }

  formatDuration(seconds) {
    const minutes = Math.max(1, Math.round(seconds / 60));
    const hours = Math.floor(minutes / 60);
    return hours ? `${hours} ч ${minutes % 60} мин` : `${minutes} мин`;
  }

  splitStep(step) {
    const m = /^ШАГ\s+\d+\s*\(([^)]+)\):\s*([\s\S]*)$/.exec(String(step));
    return m ? { label: m[1], text: m[2] } : { label: '', text: String(step) };
  }

  wrapText(text, width = 76) {
    return String(text).split('\n').map(line => {
      if (line.length <= width) return line;
      const words = line.split(' ');
      const out = [];
      let cur = '';
      words.forEach(w => {
        if (cur && (cur + ' ' + w).length > width) {
          out.push(cur);
          cur = w;
        } else {
          cur = cur ? cur + ' ' + w : w;
        }
      });
      if (cur) out.push(cur);
      return out.join('\n');
    }).join('\n');
  }

  loadPollVote() {
    try {
      return localStorage.getItem(this.pollStorageKey) || '';
    } catch (e) {
      return '';
    }
  }

  savePollVote(optionId) {
    try {
      if (optionId) {
        localStorage.setItem(this.pollStorageKey, optionId);
      } else {
        localStorage.removeItem(this.pollStorageKey);
      }
    } catch (e) {}
  }

  loadRadioPosts() {
    const d = this.data();
    const defaults = Array.isArray(d.initialRadioPosts) ? d.initialRadioPosts : [];
    try {
      const raw = localStorage.getItem(this.radioStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return defaults.slice();
  }

  saveRadioPosts(posts) {
    try {
      localStorage.setItem(this.radioStorageKey, JSON.stringify(posts));
    } catch (e) {}
  }

  visitorNumber() {
    const base = this.data().studio.hitsBase;
    let extra = 0;
    try {
      extra = parseInt(localStorage.getItem(this.hitsStorageKey) || '0', 10) || 0;
      if (!this.hitCounted) {
        this.hitCounted = true;
        extra += 1;
        localStorage.setItem(this.hitsStorageKey, String(extra));
      }
    } catch (e) {}
    return base + extra;
  }

  exportTextToNotepad(title, text) {
    if (window.soundSys) window.soundSys.playClick();
    if (window.appNotepad && typeof window.appNotepad.openWithContent === 'function') {
      window.appNotepad.openWithContent(title, text);
    } else if (window.appNotepad && typeof window.appNotepad.open === 'function') {
      window.appNotepad.open(null, title, text);
    }
  }

  saveTextToMyDocuments(fileName, text) {
    if (window.soundSys) window.soundSys.playDing();
    if (window.vfs && typeof window.vfs.writeFile === 'function') {
      window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], fileName, text);
    }
    if (window.winManager && typeof window.winManager.openDialog === 'function') {
      window.winManager.openDialog({
        title: 'Сохранение файла',
        icon: 'info',
        message: `Файл <b>${this.esc(fileName)}</b> сохранён в папку <b>C:\\My Documents</b>.`
      });
    }
  }

  buildArticlePlainText(article) {
    return this.wrapText([
      'GSC GAME WORLD // ПРЕСС-РЕЛИЗ',
      `Киев, ${article.date}. Рубрика: ${article.category}`,
      `Подготовил: ${article.author}`,
      '',
      article.title.toUpperCase(),
      '',
      article.summary,
      '',
      ...(article.body || []).reduce((acc, p) => acc.concat([p, '']), []),
      '###',
      '',
      'Две игры серии S.T.A.L.K.E.R. для Win 98 продаются в клиенте Steam:',
      '- S.T.A.L.K.E.R.: Тень Чернобыля (1998 Alpha Edition), STALKER.EXE, 14.2 MB',
      '- S.T.A.L.K.E.R.: Зов Припяти 98 (Затон), ZATON.EXE, 9.8 MB',
      'Демоверсия на компакт-диске журнала «Игромания»:',
      '- S.T.A.L.K.E.R. 98: Тень Чернобыля Demo, XR98.EXE, 22.6 MB, D:\\demo\\stalker98demo.exe',
      '',
      'http://www.gsc-game.com    zone@gsc-game.com'
    ].join('\n')).replace(/\n/g, '\r\n');
  }

  buildGameDossierPlainText(game) {
    return this.wrapText([
      `ДОСЬЕ ПРОЕКТА GSC GAME WORLD // ${game.code}`,
      '',
      `Название:       ${game.title}`,
      `Подзаголовок:   ${game.subtitle}`,
      `Разработчик:    ${game.developer}`,
      `Движок:         ${game.engine}`,
      `Файл запуска:   C:\\Games\\${game.folder}\\${game.exe}`,
      game.isDemo ? `Установщик:     ${this.cdPath(game)} (${game.fileSize})` : `Установщик:     ${game.setupExe} (${game.fileSize})`,
      game.isDemo ? 'Где взять:      компакт-диск журнала «Игромания», бесплатно' : `Цена в Steam:   ${game.priceDisplay}`,
      '',
      'ОПИСАНИЕ',
      game.lead,
      '',
      `Маршрут: ${game.territory}`,
      `Главный герой: ${game.protagonist}`,
      `Управление: ${game.controls}`,
      '',
      'СИСТЕМНЫЕ ТРЕБОВАНИЯ (минимум / рекомендуется)',
      ...(game.sysreq || []).map(([k, min, rec]) => `  ${k}: ${min} / ${rec}`),
      '',
      'СНАРЯЖЕНИЕ',
      ...(game.arsenal || []).map(item => ` * ${item}`),
      '',
      'ОСОБЕННОСТИ',
      ...(game.keyFeatures || []).map(item => ` - ${item}`),
      '',
      `Сборка: ${game.patchStatus}`
    ].join('\n')).replace(/\n/g, '\r\n');
  }

  buildDevlogPlainText(doc) {
    const lines = [
      `GSC GAME WORLD // ТЕХНИЧЕСКИЙ МЕМОРАНДУМ ${doc.code}`,
      `Дата: ${doc.date}    Автор: ${doc.author}`,
      '----------------------------------------------------------------------------',
      '',
      doc.title.toUpperCase(),
      '',
      doc.summary,
      ''
    ];
    (doc.sections || []).forEach(sec => {
      lines.push(sec.heading, '', sec.text, '');
    });
    lines.push('-- ', 'Отдел программирования GSC Game World, Киев');
    return this.wrapText(lines.join('\n')).replace(/\n/g, '\r\n');
  }

  buildGuidePlainText(guide, count) {
    return this.wrapText([
      `GSC GAME WORLD // ПРОХОЖДЕНИЕ (${guide.sector})`,
      guide.title,
      '',
      ...guide.steps.slice(0, count).reduce((acc, st) => acc.concat([st, '']), [])
    ].join('\n')).replace(/\n/g, '\r\n');
  }

  performSiteSearch(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    const d = this.data();
    const hits = [];

    this.allGames().forEach(full => {
      const hay = [
        full.title, full.subtitle, full.code, full.exe, full.engine,
        full.lead, full.territory, full.protagonist,
        ...(full.arsenal || []), ...(full.keyFeatures || [])
      ].join(' ').toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          kind: 'Игра',
          title: `${full.title} (${full.exe})`,
          snippet: full.lead,
          url: this.url(`/game?id=${full.id}`)
        });
      }
    });

    (d.news || []).forEach(n => {
      const hay = [n.title, n.summary, n.category, n.author, ...(n.body || [])].join(' ').toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          kind: `Пресс-релиз от ${n.date}`,
          title: n.title,
          snippet: n.summary,
          url: this.url(`/article?id=${n.id}`)
        });
      }
    });

    (d.devlogs || []).forEach(doc => {
      const hay = [
        doc.title, doc.code, doc.author, doc.summary, doc.fileName,
        ...(doc.sections || []).map(s => `${s.heading} ${s.text}`)
      ].join(' ').toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          kind: `Текстовый файл ${doc.fileName}`,
          title: doc.title,
          snippet: doc.summary,
          url: this.url(`/devlog/${doc.fileName}`)
        });
      }
    });

    (d.anomalies || []).forEach(a => {
      const hay = [
        a.name, a.type, a.signature, a.boltReaction, a.whereFound,
        ...(a.artifacts || []).map(art => `${art.name} ${art.price} ${art.effect}`)
      ].join(' ').toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          kind: 'Справочник КПК',
          title: `${a.name}: ${a.type}`,
          snippet: `Артефакты: ${(a.artifacts || []).map(x => x.name).join(', ')}. Где встречается: ${a.whereFound}`,
          url: this.url(`/pda?anomaly=${a.id}`)
        });
      }
    });

    (d.tacticalGuides || []).forEach(tg => {
      const hay = [tg.title, tg.sector, ...(tg.steps || [])].join(' ').toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          kind: 'Прохождение',
          title: tg.title,
          snippet: this.splitStep(tg.steps[0]).text,
          url: this.url('/pda')
        });
      }
    });

    const studio = d.studio;
    const studioHay = [
      ...studio.history.map(h => h.text),
      ...studio.vacancies.map(v => `${v.title} ${v.needs}`),
      ...studio.departments.map(dep => `${dep.name} ${dep.lead} ${dep.work}`),
      studio.address
    ].join(' ').toLowerCase();
    if (studioHay.includes(q)) {
      hits.push({
        kind: 'О студии',
        title: 'История, отделы, вакансии и адрес GSC Game World',
        snippet: studio.history[0].text,
        url: this.url('/studio')
      });
    }

    return hits;
  }

  renderHeader(view) {
    const d = this.data();
    const s = d.studio;
    const nav = [
      ['home', '', 'Главная'],
      ['games', '/games', 'Игры'],
      ['devlog', '/devlog/', 'Дневники X-Ray'],
      ['pda', '/pda', 'Справочник КПК'],
      ['stalkers', '/stalkers', 'Радиоэфир'],
      ['studio', '/studio', 'О студии']
    ];
    const activeOf = {
      home: 'home', article: 'home', games: 'games', game: 'games',
      pda: 'pda', stalkers: 'stalkers', studio: 'studio', search: ''
    };
    const active = activeOf[view] || '';
    return `
      <tr><td class="gsc-head"><a data-url="${this.url()}" title="На главную">${d.svgArt.header}</a></td></tr>
      <tr><td class="gsc-ticker">
        <table width="100%" cellspacing="0" cellpadding="0"><tr>
          <td class="gsc-ticker-label">Дозиметр</td>
          <td class="gsc-ticker-run"><marquee scrollamount="3">Сводка на ${this.esc(s.date)}: Кордон ${this.esc(s.dosimeter.cordon)} &nbsp;*&nbsp; Свалка ${this.esc(s.dosimeter.garbage)} &nbsp;*&nbsp; Затон ${this.esc(s.dosimeter.zaton)} &nbsp;*&nbsp; ${this.esc(s.dosimeter.emission)} &nbsp;*&nbsp; Все три игры S.T.A.L.K.E.R. уже в Steam &nbsp;*&nbsp; Ищем программиста C++ и 3D-художника, подробности в разделе «О студии»</marquee></td>
          <td class="gsc-nav-search">
            <input type="text" id="gsc-search-input" class="gsc-input gsc-nav-input" size="12" value="${view === 'search' ? this.esc(this.searchQuery) : ''}" title="Поиск по сайту">
            <button class="win-btn" id="btn-gsc-search">Найти</button>
          </td>
          <td class="gsc-ticker-lang"><a id="gsc-english" title="English version">ENG</a></td>
        </tr></table>
      </td></tr>
      <tr><td class="gsc-nav">
        <table width="100%" cellspacing="0" cellpadding="0"><tr>
          <td class="gsc-nav-plates">
            ${nav.map(([id, path, label]) => id === active
              ? `<span class="gsc-plate gsc-plate-on">${label}</span>`
              : `<a class="gsc-plate" data-url="${this.url(path)}">${label}</a>`).join('')}
          </td>
        </tr></table>
      </td></tr>
    `;
  }

  renderSectionTitle(text, extra = '') {
    return `<h2 class="gsc-h">${text}${extra}</h2>`;
  }

  renderPoll() {
    const poll = this.data().poll;
    const votedId = this.loadPollVote();
    const total = poll.options.reduce((acc, o) => acc + o.baseVotes, 0) + (votedId ? 1 : 0);
    if (!votedId) {
      return `
        <div class="gsc-poll" id="gsc-poll-box">
          <p class="gsc-poll-q">${this.esc(poll.question)}</p>
          ${poll.options.map((opt, idx) => `
            <label class="gsc-poll-opt"><input type="radio" name="gsc_poll_opt" value="${this.esc(opt.id)}" ${idx === 0 ? 'checked' : ''}> ${this.esc(opt.label)}</label>
          `).join('')}
          <div class="gsc-poll-go"><button class="win-btn" id="btn-gsc-poll-vote">Голосовать</button></div>
        </div>
      `;
    }
    return `
      <div class="gsc-poll" id="gsc-poll-box">
        <p class="gsc-poll-q">${this.esc(poll.question)}</p>
        ${poll.options.map(opt => {
          const count = opt.baseVotes + (opt.id === votedId ? 1 : 0);
          const pct = Math.round((count / total) * 100);
          return `
            <div class="gsc-poll-res${opt.id === votedId ? ' gsc-poll-mine' : ''}">
              ${opt.id === votedId ? '<b>Ваш голос:</b> ' : ''}${this.esc(opt.label)}
              <table class="gsc-poll-bar" cellspacing="0" cellpadding="0"><tr>
                <td class="gsc-poll-fill" width="${Math.max(pct, 1)}%"></td><td></td>
              </tr></table>
              <span class="gsc-poll-num">${pct}% (${count})</span>
            </div>
          `;
        }).join('')}
        <div class="gsc-poll-total">Проголосовало: ${total}. <a id="btn-gsc-poll-reset">Переголосовать</a></div>
      </div>
    `;
  }

  renderHomeView() {
    const d = this.data();
    const games = this.allGames();
    const categories = [
      ['all', 'все'],
      ['СВОДКА СТУДИИ', 'студия'],
      ['ЗОВ ПРИПЯТИ 98', 'Затон'],
      ['ДВИЖОК X-RAY 98', 'X-Ray 98'],
      ['ТЕКСТОВАЯ АЛЬФА 0.98', 'альфа 0.98'],
      ['АППАРАТНАЯ ЧАСТЬ', 'железо']
    ];
    const news = (d.news || []).filter(n => this.newsCategory === 'all' || n.category === this.newsCategory);
    const latestDate = (d.news || [])[0] ? d.news[0].date : '';
    const radio = this.loadRadioPosts().slice(0, 3);

    return `
      <table class="gsc-cols" width="100%" cellspacing="0" cellpadding="0"><tr>
        <td class="gsc-main" valign="top">
          <p class="gsc-welcome-first">${this.esc(d.studio.welcome[0])}</p>
          <p>${this.esc(d.studio.welcome[1])}</p>

          ${this.renderSectionTitle('Наши игры')}
          <table class="gsc-shelf" width="100%" cellspacing="0" cellpadding="0"><tr>
            ${games.map(g => `
              <td class="gsc-shelf-item" valign="top" data-game-card="${this.esc(g.id)}">
                <a data-url="${this.url(`/game?id=${g.id}`)}"><img class="gsc-shelf-shot" src="${this.esc(this.shotSrc(g, 1))}" width="160" height="120" alt="${this.esc(g.shots[0])}"></a>
                <div class="gsc-shelf-title"><a data-url="${this.url(`/game?id=${g.id}`)}">${this.esc(g.title)}</a></div>
                <div class="gsc-shelf-sub">${this.esc(g.subtitle)}</div>
                <div class="gsc-shelf-file"><tt>${this.esc(g.exe)}</tt>, ${this.esc(parseFloat(g.fileSize))} МБ</div>
                ${g.isInstalled || g.isPurchased || g.isDemo ? `<div>${this.renderGameStatus(g)}</div>` : ''}
                <div class="gsc-shelf-btn">${this.renderGameButtons(g)}</div>
              </td>
            `).join('')}
          </tr></table>
          <p class="gsc-shelf-more">Не знаете, с какой начать? <a data-url="${this.url('/games')}">Сравните три игры по железу и сюжету</a>.</p>

          ${this.renderSectionTitle('Новости студии')}
          <div class="gsc-rubrics">Рубрики:
            ${categories.map(([key, label]) => key === this.newsCategory
              ? `<b class="btn-gsc-news-cat gsc-rubric-on" data-cat="${this.esc(key)}">${label}</b>`
              : `<a class="btn-gsc-news-cat" data-cat="${this.esc(key)}">${label}</a>`).join(' | ')}
          </div>
          <table class="gsc-news" width="100%" cellspacing="0" cellpadding="0">
            ${news.map(item => `
              <tr class="gsc-news-card" data-news-id="${this.esc(item.id)}">
                <td class="gsc-news-date" valign="top">${this.esc(item.date.slice(0, 6) + item.date.slice(8))}${item.date === latestDate ? `<br>${this.gif('new')}` : ''}</td>
                <td class="gsc-news-text" valign="top">
                  <a class="gsc-news-title" data-url="${this.url(`/article?id=${item.id}`)}">${this.esc(item.title)}</a>
                  <div class="gsc-news-sum">${this.esc(item.summary)}</div>
                  <div class="gsc-news-more"><a data-url="${this.url(`/article?id=${item.id}`)}">читать полностью</a> &nbsp;<span class="gsc-news-by">${this.esc(item.author)}</span></div>
                </td>
              </tr>
            `).join('')}
          </table>
        </td>

        <td class="gsc-side" valign="top">
          <div class="gsc-side-h">Опрос</div>
          ${this.renderPoll()}

          <div class="gsc-side-h">Сейчас в эфире</div>
          ${radio.map(p => `
            <div class="gsc-side-radio">
              <span class="gsc-side-radio-who">${this.esc(p.author.split(' (')[0])}:</span>
              ${this.esc(p.text.length > 120 ? p.text.slice(0, 117).replace(/\s+\S*$/, '') + '...' : p.text)}
            </div>
          `).join('')}
          <div class="gsc-side-link"><a data-url="${this.url('/stalkers')}">Слушать эфир и ответить</a></div>

          <div class="gsc-side-h">Где купить</div>
          <p class="gsc-side-p">Текстовая альфа и Зов Припяти 98 продаются только через клиент Steam. Сам клиент можно скачать на <a data-url="http://www.steampowered.com">www.steampowered.com</a>. Демоверсия S.T.A.L.K.E.R. 98 лежит на компакт-диске журнала «Игромания», установщик D:\\demo\\stalker98demo.exe. После установки ярлык игры появится на Рабочем столе.</p>

          <div class="gsc-side-h">Справочник</div>
          <ul class="gsc-side-list">
            <li><a data-url="${this.url('/pda?anomaly=tramplin')}">«Трамплин» и «Медуза» за 3000 RU</a></li>
            <li><a data-url="${this.url('/pda?anomaly=electra')}">«Электра» под ж/д насыпью</a></li>
            <li><a data-url="${this.url('/pda?anomaly=psi')}">Пузырь Ноя на Южное плато</a></li>
            <li><a data-url="${this.url('/devlog/')}">Рабочие заметки программистов</a></li>
          </ul>
        </td>
      </tr></table>
    `;
  }

  categoryLabel(category) {
    const labels = {
      'СВОДКА СТУДИИ': 'Сводка студии',
      'ЗОВ ПРИПЯТИ 98': 'Зов Припяти 98',
      'ДВИЖОК X-RAY 98': 'Движок X-Ray 98',
      'ТЕКСТОВАЯ АЛЬФА 0.98': 'Текстовая альфа 0.98',
      'АППАРАТНАЯ ЧАСТЬ': 'Аппаратная часть'
    };
    return labels[category] || category;
  }

  renderArticleView(articleId) {
    const d = this.data();
    const list = d.news || [];
    const idx = Math.max(0, list.findIndex(n => n.id === articleId));
    const article = list[idx];
    const newer = list[idx - 1];
    const older = list[idx + 1];
    const relatedGame = article.gameId && article.gameId !== 'all' ? this.getGameCatalogEntry(article.gameId) : null;

    return `
      <div class="gsc-pr-wrap">
        <table class="gsc-pr" width="600" cellspacing="0" cellpadding="0" align="center"><tr><td>
          <div class="gsc-pr-letterhead">
            <span class="gsc-pr-firm">GSC GAME WORLD</span>
            <span class="gsc-pr-addr">${this.esc(d.studio.address)}<br>тел. ${this.esc(d.studio.phone)} &nbsp; zone@gsc-game.com</span>
          </div>
          <div class="gsc-pr-kind">Пресс-релиз. ${this.esc(this.categoryLabel(article.category))}</div>
          <div class="gsc-pr-dateline">Для немедленной публикации &nbsp; Киев, ${this.esc(article.date)}</div>
          <h1 class="gsc-pr-title">${this.esc(article.title)}</h1>
          <p class="gsc-pr-lead">${this.esc(article.summary)}</p>
          ${(article.body || []).map(p => `<p class="gsc-pr-p">${this.esc(p)}</p>`).join('')}
          <div class="gsc-pr-end">###</div>
          <div class="gsc-pr-sign">Подготовил: ${this.esc(article.author)}</div>
          <div class="gsc-pr-tools">
            <button class="win-btn btn-gsc-article-notepad" data-article-id="${this.esc(article.id)}">Версия для печати (Блокнот)</button>
            <button class="win-btn btn-gsc-article-save" data-article-id="${this.esc(article.id)}">Сохранить .TXT</button>
          </div>
        </td></tr></table>
      </div>

      ${relatedGame ? `
        <table class="gsc-related" width="600" cellspacing="0" cellpadding="0" align="center"><tr>
          <td class="gsc-related-shot" valign="top"><a data-url="${this.url(`/game?id=${relatedGame.id}`)}"><img src="${this.esc(this.shotSrc(relatedGame, 2))}" width="120" height="90" alt="${this.esc(relatedGame.shots[1])}"></a></td>
          <td valign="top">
            <div>Игра из этого релиза: <a data-url="${this.url(`/game?id=${relatedGame.id}`)}"><b>${this.esc(relatedGame.title)}</b></a></div>
            <div class="gsc-related-status">${this.renderGameStatus(relatedGame)}</div>
            <div>${this.renderGameButtons(relatedGame)}</div>
          </td>
        </tr></table>
      ` : ''}

      <div class="gsc-pager">
        ${newer ? `<a data-url="${this.url(`/article?id=${newer.id}`)}">&lt;&lt; более новый</a>` : '<span>&lt;&lt; более новый</span>'}
        &nbsp;|&nbsp; <a data-url="${this.url()}">все новости</a> &nbsp;|&nbsp;
        ${older ? `<a data-url="${this.url(`/article?id=${older.id}`)}">более ранний &gt;&gt;</a>` : '<span>более ранний &gt;&gt;</span>'}
      </div>
    `;
  }

  renderGamesView() {
    const d = this.data();
    const games = this.allGames();
    const row = (label, fn, cls = '') => `
      <tr${cls ? ` class="${cls}"` : ''}>
        <th class="gsc-mx-k" align="left" valign="top">${label}</th>
        ${games.map(g => `<td valign="top">${fn(g)}</td>`).join('')}
      </tr>
    `;
    return `
      ${this.renderSectionTitle('Три игры про Зону')}
      <p>У всех трёх игр общий мир и общие герои, но это разные программы. Выбирайте по своему компьютеру и по тому, как хотите играть. Время скачивания посчитано для модема 33 600.</p>

      <table class="gsc-mx" width="100%" cellspacing="0" cellpadding="4" border="1">
        <colgroup><col width="16%"><col width="28%"><col width="28%"><col width="28%"></colgroup>
        <tr class="gsc-mx-head">
          <th></th>
          ${games.map(g => `
            <th valign="top">
              <a data-url="${this.url(`/game?id=${g.id}`)}">${d.svgArt[g.badgeKey] || ''}</a><br>
              <a data-url="${this.url(`/game?id=${g.id}`)}">${this.esc(g.title)}</a>
              <div class="gsc-mx-sub">${this.esc(g.subtitle)}</div>
            </th>
          `).join('')}
        </tr>
        ${row('Жанр', g => this.esc(g.genre))}
        ${row('Файл', g => `<tt>${this.esc(g.exe)}</tt>`)}
        ${row('Размер', g => `${this.esc(parseFloat(g.fileSize))} МБ`)}
        ${row('Скачать на 33 600', g => this.esc(g.isDemo ? 'не нужно, есть на CD «Игромании»' : this.downloadTimes(g.fileSize)[2][1]))}
        ${row('3D-ускоритель', g => this.esc(g.needs3d), 'gsc-mx-hot')}
        ${row('Минимум', g => this.esc(`${g.sysreq[0][1]}, ${g.sysreq[1][1]}`))}
        ${row('Где идёт игра', g => this.esc(g.sector))}
        ${row('Герой', g => this.esc(g.protagonist.split(' (')[0]))}
        ${row('Финал', g => this.esc(g.finale))}
        ${row('Цена', g => `<b>${this.esc(this.priceText(g))}</b>`)}
        ${row('У вас', g => this.renderGameStatus(g))}
        ${row('', g => this.renderGameButtons(g), 'gsc-mx-actions')}
      </table>

      ${this.renderSectionTitle('Какую взять первой')}
      <dl class="gsc-pick">
        ${games.map(g => `
          <dt><a data-url="${this.url(`/game?id=${g.id}`)}">${this.esc(g.title)}</a> <tt>${this.esc(g.exe)}</tt></dt>
          <dd>${this.esc(g.pick)}</dd>
        `).join('')}
      </dl>
    `;
  }

  renderGameView(gameId) {
    const d = this.data();
    const game = this.getGameCatalogEntry(gameId);
    const toc = [
      ['desc', 'Описание'],
      ['shots', 'Скриншоты'],
      ['features', 'Особенности'],
      ['gear', 'Снаряжение'],
      ['sysreq', 'Требования'],
      ['buy', game.isDemo ? 'Где взять' : 'Где купить']
    ];
    const zoomN = this.zoomShot.startsWith(game.id + '-') ? this.zoomShot.slice(game.id.length + 1) : '';
    const route = String(game.territory).split('->').map(s => s.trim()).filter(Boolean);

    return `
      <table class="gsc-g-head" width="100%" cellspacing="0" cellpadding="0"><tr>
        <td class="gsc-g-badge" valign="top">${d.svgArt[game.badgeKey] || ''}</td>
        <td valign="top">
          <h1 class="gsc-g-title">${this.esc(game.title)}</h1>
          <div class="gsc-g-sub">${this.esc(game.subtitle)}</div>
          <div class="gsc-g-meta">${this.esc(game.developer)} &nbsp;|&nbsp; ${this.esc(game.genre)} &nbsp;|&nbsp; ${this.esc(game.tags.join(', '))}</div>
        </td>
      </tr></table>

      <div class="gsc-g-toc">[ ${toc.map(([id, label]) => `<a class="gsc-jump" data-gsc-jump="${id}">${label}</a>`).join(' | ')} ]</div>

      <a name="desc" id="gsc-sec-desc"></a>
      ${this.renderSectionTitle('Описание')}
      <p>${this.esc(game.lead)}</p>
      <p><b>Главный герой:</b> ${this.esc(game.protagonist)}</p>
      <div class="gsc-g-route"><b>Маршрут:</b> ${route.map(r => this.esc(r)).join(' <span class="gsc-g-arrow">&raquo;</span> ')}</div>

      <a name="shots" id="gsc-sec-shots"></a>
      ${this.renderSectionTitle('Скриншоты')}
      ${zoomN ? `
        <div class="gsc-g-zoom">
          <img src="${this.esc(this.shotSrc(game, zoomN))}" width="640" height="480" alt="${this.esc(game.shots[Number(zoomN) - 1] || game.title)}">
          <div class="gsc-g-zoom-cap">${this.esc(game.shots[Number(zoomN) - 1] || '')} (640×480) &nbsp; <a class="btn-gsc-shot" data-shot="">закрыть</a></div>
        </div>
      ` : ''}
      <table class="gsc-g-thumbs" cellspacing="0" cellpadding="0"><tr>
        ${[1, 2].map(n => `
          <td valign="top">
            <a class="btn-gsc-shot" data-shot="${this.esc(game.id)}-${n}"><img src="${this.esc(this.shotSrc(game, n))}" width="200" height="150" alt="${this.esc(game.shots[n - 1] || game.title)}"></a>
            <div class="gsc-g-thumb-cap">${this.esc(game.shots[n - 1] || '')}<br><small>щёлкните, чтобы увеличить</small></div>
          </td>
        `).join('')}
      </tr></table>

      <a name="features" id="gsc-sec-features"></a>
      ${this.renderSectionTitle('Особенности')}
      <ul class="gsc-g-list">${(game.keyFeatures || []).map(f => `<li>${this.esc(f)}</li>`).join('')}</ul>

      <a name="gear" id="gsc-sec-gear"></a>
      ${this.renderSectionTitle('Снаряжение')}
      <ul class="gsc-g-list">${(game.arsenal || []).map(a => `<li>${this.esc(a)}</li>`).join('')}</ul>
      <p><b>Управление:</b> <span class="gsc-g-keys">${this.esc(game.controls)}</span></p>
      <p><b>Экран:</b> ${this.esc(game.resolutions)}</p>

      <a name="sysreq" id="gsc-sec-sysreq"></a>
      ${this.renderSectionTitle('Системные требования')}
      <table class="gsc-g-req" cellspacing="0" cellpadding="4" border="1">
        <tr><th></th><th>Минимум</th><th>Рекомендуется</th></tr>
        ${(game.sysreq || []).map(([k, min, rec]) => `<tr><th align="left">${this.esc(k)}</th><td>${this.esc(min)}</td><td>${this.esc(rec)}</td></tr>`).join('')}
        <tr><th align="left">3D-ускоритель</th><td colspan="2">${this.esc(game.needs3d)}</td></tr>
        <tr><th align="left">Система</th><td colspan="2">Microslop Win 95 или Win 98, ${game.isDemo ? 'привод CD-ROM' : 'клиент Steam'}</td></tr>
      </table>

      <a name="buy" id="gsc-sec-buy"></a>
      ${this.renderSectionTitle(game.isDemo ? 'Где взять' : 'Где купить')}
      <table class="gsc-g-buy" width="100%" cellspacing="0" cellpadding="0"><tr>
        <td valign="top" class="gsc-g-buy-main">
          ${game.isDemo
            ? `<p>Игра не продаётся: её демоверсия бесплатно записана на компакт-диск журнала «Игромания». Вставьте диск в привод D: и запустите установщик <tt>${this.esc(this.cdPath(game))}</tt>, ${this.esc(game.fileSize)}.</p>`
            : `<p>Игра продаётся только в клиенте Steam: ${this.esc(game.priceDisplay)}. Установщик <tt>${this.esc(game.setupExe)}</tt>, ${this.esc(game.fileSize)}. Steam сам докачивает файл после обрыва связи.</p>`}
          <p>${this.renderGameStatus(game)}</p>
          <p>${this.renderGameButtons(game)}</p>
          <p class="gsc-g-patch"><b>Сборка:</b> ${this.esc(game.patchStatus)}</p>
          <p>
            <button class="win-btn btn-gsc-dossier-notepad" data-game-id="${this.esc(game.id)}">Описание в Блокнот</button>
            <button class="win-btn btn-gsc-dossier-save" data-game-id="${this.esc(game.id)}">Сохранить .TXT</button>
          </p>
        </td>
        ${game.isDemo ? '' : `<td valign="top" class="gsc-g-buy-times">
          <table class="gsc-g-dl" cellspacing="0" cellpadding="3" border="1">
            <tr><th colspan="2">Сколько качать ${this.esc(parseFloat(game.fileSize))} МБ</th></tr>
            ${this.downloadTimes(game.fileSize).map(([label, time]) => `<tr><td>${this.esc(label)}</td><td align="right">${this.esc(time)}</td></tr>`).join('')}
          </table>
        </td>`}
      </tr></table>

      <div class="gsc-pager">
        <a data-url="${this.url('/games')}">&lt;&lt; все три игры</a> &nbsp;|&nbsp; <a data-url="${this.url('/pda')}">справочник аномалий &gt;&gt;</a>
      </div>
    `;
  }

  devlogStamp(doc, i) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [dd, mm, yyyy] = String(doc.date).split('.');
    const times = ['18:42', '21:07', '23:55', '16:30'];
    return `${dd}-${months[Number(mm) - 1] || 'Nov'}-${yyyy} ${times[i % times.length]}`;
  }

  renderDevlogIndex() {
    const docs = this.data().devlogs || [];
    const pad = (s, n) => {
      const str = String(s);
      return str.length >= n ? str.slice(0, n - 1) + '>' : str + ' '.repeat(n - str.length);
    };
    const header = [
      'ИНЖЕНЕРНЫЕ ДНЕВНИКИ GSC GAME WORLD',
      '',
      'Отдел программирования выкладывает сюда рабочие заметки как есть, текстовыми',
      'файлами. Кодировка Win-1251, строки по 76 знаков. Открыть файл: щёлкнуть по',
      'имени. Забрать к себе: ссылки [блокнот] и [сохранить] справа.',
      '',
      ...docs.map(doc => `${doc.code}\n${doc.title}\n`)
    ].join('\n');

    return `
      <div class="gsc-raw">
        <h1 class="gsc-raw-h1">Index of /devlog</h1>
        <pre class="gsc-raw-readme">${this.esc(this.wrapText(header, 76))}</pre>
        <pre class="gsc-raw-list">${this.gif('folder')} Name                               Last modified       Size  Description
<hr>${this.gif('arrow')} <a data-url="${this.url()}">Parent Directory</a>                   25-Nov-1998 09:12      -
${docs.map((doc, i) => {
  const size = Math.max(1, Math.ceil(this.buildDevlogPlainText(doc).length / 1024)) + 'k';
  return `${this.gif('news')} <a class="gsc-raw-file" data-url="${this.url(`/devlog/${doc.fileName}`)}">${this.esc(doc.fileName)}</a>${' '.repeat(Math.max(1, 35 - doc.fileName.length))}${this.devlogStamp(doc, i)}  ${size.padStart(5)}  ${this.esc(pad(doc.code.split('// ')[1] || doc.code, 14))} <a class="btn-gsc-devlog-notepad" data-devlog-id="${this.esc(doc.id)}">[блокнот]</a> <a class="btn-gsc-devlog-save" data-devlog-id="${this.esc(doc.id)}">[сохранить]</a>`;
}).join('\n')}
<hr></pre>
        <address class="gsc-raw-addr">Apache/1.3.3 Server at www.gsc-game.com Port 80</address>
      </div>
    `;
  }

  renderDevlogFile(docId) {
    const doc = (this.data().devlogs || []).find(x => x.id === docId);
    return `<div class="gsc-raw gsc-raw-txt" data-active-devlog="${this.esc(doc.id)}"><pre class="gsc-raw-text">${this.esc(this.buildDevlogPlainText(doc).replace(/\r\n/g, '\n'))}</pre></div>`;
  }

  shortDetectorName(name) {
    const m = /«([^»]+)»/.exec(String(name));
    return m ? m[1] : 'Болт М12';
  }

  renderPdaView() {
    const d = this.data();
    const anomalies = d.anomalies || [];
    const detectors = d.detectors || [];
    const anom = anomalies.find(a => a.id === this.activeAnomalyId) || anomalies[0];
    const det = detectors.find(x => x.id === this.activeDetectorId) || detectors[0];
    const buildNames = { stalker: 'STALKER.EXE', stalker98: 'XR98.EXE', cop98: 'ZATON.EXE' };

    return `
      ${this.renderSectionTitle('Справочник КПК')}
      <p>Полевой справочник по аномалиям, детекторам и артефактам всех трёх игр. Выберите аномалию в меню КПК, нажмите кнопку прибора и бросьте болт. Справочник написан на Java: если вместо КПК видите серый прямоугольник, включите Java в настройках Internet Explorer.</p>

      <table class="gsc-applet" width="100%" cellspacing="0" cellpadding="0">
        <tr><td class="gsc-applet-stage" align="center">
          <table class="gsc-pda" cellspacing="0" cellpadding="0">
            <tr><td class="gsc-pda-brand" colspan="2">КПК «СТАЛКЕР» &nbsp; ПО 0.98 <span class="gsc-pda-led${this.boltTelemetry ? ' gsc-pda-led-on' : ''}"></span></td></tr>
            <tr><td class="gsc-pda-glass" colspan="2">
              <table width="100%" cellspacing="0" cellpadding="0"><tr>
                <td class="gsc-pda-menu" valign="top">
                  <div class="gsc-pda-menu-h">АНОМАЛИИ</div>
                  ${anomalies.map(a => `<button class="btn-gsc-select-anomaly gsc-pda-item${a.id === anom.id ? ' gsc-pda-item-on' : ''}" data-anomaly-id="${this.esc(a.id)}">${a.id === anom.id ? '&gt;' : '&nbsp;'} ${this.esc(a.name.split(' (')[0].split(' / ')[0])}</button>`).join('')}
                </td>
                <td class="gsc-pda-read" valign="top">
                  <div class="gsc-pda-name">${this.esc(anom.name)}</div>
                  <div class="gsc-pda-type">${this.esc(anom.type)}</div>
                  <div class="gsc-pda-row"><span>УГРОЗА</span> <b class="gsc-pda-danger">${this.esc(anom.danger)}</b></div>
                  <div class="gsc-pda-row"><span>ИГРЫ</span> ${anom.games.map(g => buildNames[g] || g).join(', ')}</div>
                  <div class="gsc-pda-row"><span>ПРИЗНАКИ</span> ${this.esc(anom.signature)}</div>
                  <div class="gsc-pda-row"><span>БОЛТ</span> ${this.esc(anom.boltReaction)}</div>
                  <div class="gsc-pda-row"><span>ГДЕ</span> ${this.esc(anom.whereFound)}</div>
                  <div class="gsc-pda-row"><span>ПРИБОР</span> ${this.esc(det.name)}, ${this.esc(det.radius.toLowerCase())}. ${this.esc(det.desc)}</div>
                  <div class="gsc-pda-tele" id="gsc-bolt-telemetry">${this.boltTelemetry
                    ? `&gt;&gt; ${this.esc(this.boltTelemetry)}`
                    : '&gt;&gt; Жду броска болта. Кнопка БОЛТ справа внизу.'}</div>
                </td>
              </tr></table>
            </td></tr>
            <tr>
              <td class="gsc-pda-keys">
                ${detectors.map(x => `<button class="btn-gsc-select-detector gsc-pda-key${x.id === det.id ? ' gsc-pda-key-on' : ''}" data-detector-id="${this.esc(x.id)}" title="${this.esc(x.name)}">${this.esc(this.shortDetectorName(x.name))}</button>`).join('')}
              </td>
              <td class="gsc-pda-boltcell"><button class="gsc-pda-bolt" id="btn-gsc-throw-bolt" title="Бросить болт М12">БОЛТ</button></td>
            </tr>
          </table>
        </td></tr>
        <tr><td class="gsc-applet-status">Апплет PDA98.class запущен</td></tr>
      </table>

      <h3 class="gsc-h3">Артефакты аномалии ${this.esc(anom.name.split(' (')[0])}</h3>
      <table class="gsc-art" width="100%" cellspacing="0" cellpadding="4" border="1">
        <tr><th align="left">Артефакт</th><th align="left">Цена у торговцев</th><th align="left">Свойства</th></tr>
        ${(anom.artifacts || []).map(art => `<tr><td><b>${this.esc(art.name)}</b></td><td>${this.esc(art.price)}</td><td>${this.esc(art.effect)}</td></tr>`).join('')}
      </table>

      ${this.renderSectionTitle('Прохождения')}
      <p>Каждое прохождение открывается по шагу, чтобы не испортить себе сюжет раньше времени.</p>
      ${(d.tacticalGuides || []).map(tg => {
        const count = Math.min(this.guideProgress[tg.id] || 1, tg.steps.length);
        const hasMore = count < tg.steps.length;
        return `
          <div class="gsc-guide" data-guide-id="${this.esc(tg.id)}">
            <div class="gsc-guide-title">${this.esc(tg.title)}</div>
            <div class="gsc-guide-sector">${this.esc(tg.sector)} &nbsp; открыто шагов: ${count} из ${tg.steps.length}</div>
            <ol class="gsc-guide-steps">
              ${tg.steps.slice(0, count).map(st => {
                const part = this.splitStep(st);
                return `<li>${part.label ? `<b>${this.esc(part.label)}.</b> ` : ''}${this.esc(part.text)}</li>`;
              }).join('')}
            </ol>
            <div class="gsc-guide-tools">
              ${hasMore
                ? `<button class="win-btn btn-gsc-guide-next" data-guide-id="${this.esc(tg.id)}">Открыть шаг ${count + 1}</button>`
                : '<span class="gsc-guide-done">Все шаги открыты.</span>'}
              <button class="win-btn btn-gsc-guide-notepad" data-guide-id="${this.esc(tg.id)}">В Блокнот</button>
              <a data-url="${this.url(`/game?id=${tg.gameId}`)}">об игре</a>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  radioChannel(id) {
    return (this.data().radioChannels || []).find(c => c.id === id);
  }

  renderStalkersView() {
    const channels = this.data().radioChannels || [];
    const posts = this.loadRadioPosts();
    const active = this.radioChannel(this.activeRadioChannel);
    const filtered = posts.filter(p => !active || p.channel === active.id);
    const needle = active ? Math.round(((parseFloat(active.freq) - 88) / 20) * 100) : 50;

    return `
      ${this.renderSectionTitle('Радиоэфир')}
      <p>Открытая частота сталкеров. Здесь переговариваются Кордон и «Скадовск», а на частоте 105.2 можно задать вопрос студии: мы читаем эфир каждый вечер. Записи хранятся на вашем компьютере.</p>

      <table class="gsc-rx" width="100%" cellspacing="0" cellpadding="0">
        <tr><td class="gsc-rx-face">
          <table class="gsc-rx-scale" width="100%" cellspacing="0" cellpadding="0"><tr>
            ${[88, 92, 96, 100, 104, 108].map(f => `<td>${f}</td>`).join('')}
          </tr></table>
          <div class="gsc-rx-band"><div class="gsc-rx-needle" style="left:${needle}%"></div></div>
          <div class="gsc-rx-freq">${active ? `${this.esc(active.freq)} МГц &nbsp; ${this.esc(active.label)}` : 'СКАН: все частоты'}</div>
        </td></tr>
        <tr><td class="gsc-rx-presets">
          <button class="btn-gsc-radio-filter gsc-rx-btn${!active ? ' gsc-rx-btn-on' : ''}" data-channel="all">СКАН (${posts.length})</button>
          ${channels.map(c => `<button class="btn-gsc-radio-filter gsc-rx-btn${active && active.id === c.id ? ' gsc-rx-btn-on' : ''}" data-channel="${this.esc(c.id)}">${this.esc(c.freq)}</button>`).join('')}
        </td></tr>
      </table>

      <div class="gsc-rx-log" id="gsc-radio-posts-list">
        ${filtered.length ? filtered.map(post => {
          const ch = this.radioChannel(post.channel);
          return `
            <div class="gsc-radio-item">
              <div class="gsc-radio-head">[${this.esc(post.date)}] ${ch ? this.esc(ch.freq) : '---.-'} МГц &nbsp;<b>${this.esc(post.author)}</b></div>
              <div class="gsc-radio-body">${this.esc(post.text)}</div>
            </div>
          `;
        }).join('') : '<div class="gsc-radio-empty">На этой частоте пока тихо. Выйдите в эфир первым.</div>'}
      </div>

      <h3 class="gsc-h3">Выйти в эфир</h3>
      <table class="gsc-rx-form" cellspacing="0" cellpadding="3">
        <tr><td align="right"><label for="gsc-radio-author">Позывной:</label></td><td><input type="text" id="gsc-radio-author" class="gsc-input" value="Сталкер_Меченый98" maxlength="48" size="30"></td></tr>
        <tr><td align="right"><label for="gsc-radio-channel">Частота:</label></td><td>
          <select id="gsc-radio-channel" class="gsc-input">
            ${channels.slice().sort((a, b) => (a.id === 'kyiv' ? -1 : b.id === 'kyiv' ? 1 : 0)).map(c => `<option value="${this.esc(c.id)}">${this.esc(c.freq)} МГц: ${this.esc(c.label)}</option>`).join('')}
          </select>
        </td></tr>
        <tr><td align="right" valign="top"><label for="gsc-radio-text">Сообщение:</label></td><td><textarea id="gsc-radio-text" class="gsc-input" rows="4" cols="52"></textarea></td></tr>
        <tr><td></td><td><button class="win-btn" id="btn-gsc-radio-send"><b>Передать</b></button></td></tr>
      </table>
    `;
  }

  renderSearchView() {
    const q = this.searchQuery;
    const hits = this.performSiteSearch(q);
    const tags = ['Скат-3', 'Кузнецов', 'номер 26', 'Медуза', 'Велес', 'Кардан'];
    return `
      ${this.renderSectionTitle('Поиск по сайту')}
      <div class="gsc-find-form">
        <input type="text" id="gsc-search-page-input" class="gsc-input" size="40" value="${this.esc(q)}">
        <button class="win-btn" id="btn-gsc-search-page">Найти</button>
        ${q ? '<button class="win-btn" id="btn-gsc-search-clear">Очистить</button>' : ''}
      </div>
      <div class="gsc-find-tags">Часто ищут: ${tags.map(t => `<a class="gsc-quick-tag" data-gsc-q="${this.esc(t)}">${this.esc(t)}</a>`).join(', ')}</div>
      ${!q ? '<p>Введите слово: имя героя, название аномалии, артефакта или файла.</p>' : hits.length ? `
        <p class="gsc-find-count">По запросу <b>${this.esc(q)}</b> найдено документов: ${hits.length}</p>
        <ol class="gsc-find-list">
          ${hits.map(h => `
            <li>
              <a class="gsc-find-title" data-url="${this.esc(h.url)}">${this.esc(h.title)}</a>
              <div class="gsc-find-snip">${this.esc(h.snippet)}</div>
              <div class="gsc-find-url">${this.esc(h.kind)} &nbsp; ${this.esc(h.url)}</div>
            </li>
          `).join('')}
        </ol>
      ` : `
        <p class="gsc-find-count">По запросу <b>${this.esc(q)}</b> ничего не найдено.</p>
        <p>Проверьте написание или поищите имя файла: STALKER.EXE, XR98.EXE, ZATON.EXE. Можно начать с одного из частых запросов выше.</p>
      `}
    `;
  }

  renderStudioView() {
    const s = this.data().studio;
    return `
      ${this.renderSectionTitle('О студии')}
      <p>GSC Game World работает в Киеве с ${this.esc(s.founded)} года. Нас 23 человека: программисты, художники, сценаристы и два тестировщика. Все три игры про Зону сделаны здесь, в четырёх комнатах на бульваре Леси Украинки.</p>

      <table class="gsc-years" cellspacing="0" cellpadding="0">
        ${s.history.map(h => `<tr><td class="gsc-year" valign="top">${this.esc(h.year)}</td><td class="gsc-year-text" valign="top">${this.esc(h.text)}</td></tr>`).join('')}
      </table>

      <h3 class="gsc-h3">Отделы</h3>
      <table class="gsc-deps" width="100%" cellspacing="0" cellpadding="4" border="1">
        <tr><th align="left">Отдел</th><th align="left">Руководит</th><th align="left">Чем занимается</th></tr>
        ${s.departments.map(dep => `<tr><td><b>${this.esc(dep.name)}</b></td><td>${this.esc(dep.lead)}</td><td>${this.esc(dep.work)}</td></tr>`).join('')}
      </table>

      ${this.renderSectionTitle('Вакансии', ` ${this.gif('new')}`)}
      <dl class="gsc-jobs">
        ${s.vacancies.map(v => `<dt>${this.esc(v.title)}</dt><dd>${this.esc(v.needs)}</dd>`).join('')}
      </dl>
      <p>Резюме и примеры работ присылайте на <a class="web-mail-link" href="mailto:zone@gsc-game.com">${this.gif('mail')}zone@gsc-game.com</a>, в теме письма укажите «Вакансия». Дискеты и CD можно занести лично.</p>

      ${this.renderSectionTitle('Как нас найти')}
      <table class="gsc-findus" width="100%" cellspacing="0" cellpadding="0"><tr>
        <td valign="top" class="gsc-findus-text">
          <p><b>Адрес:</b> ${this.esc(s.address)}</p>
          <p><b>Телефон:</b> ${this.esc(s.phone)}<br><b>Факс:</b> ${this.esc(s.fax)}</p>
          <p><b>Почта:</b> <a class="web-mail-link" href="mailto:zone@gsc-game.com">${this.gif('mail')}zone@gsc-game.com</a></p>
          <p><b>Связь:</b> ${this.esc(s.uplink)}</p>
          <p>Игры мы не продаём ни в офисе, ни по почте: только через <a data-url="http://www.steampowered.com">Steam</a>. Демоверсия S.T.A.L.K.E.R. 98 бесплатно выходит на компакт-диске журнала «Игромания».</p>
        </td>
        <td valign="top"><pre class="gsc-findus-map">${this.esc(s.routeMap.join('\n'))}</pre></td>
      </tr></table>

      <h3 class="gsc-h3">Друзья студии</h3>
      <ul class="gsc-side-list">
        <li><a data-url="http://www.steampowered.com">Steam</a>: здесь продаются текстовая альфа и Зов Припяти 98</li>
        <li><a data-url="http://forum.games98.com">GamerZone</a>: форум, где обсуждают Кордон и Затон</li>
        <li><a data-url="http://www.igromania.ru">Журнал «Игромания»</a>: на его компакт-диске демоверсия S.T.A.L.K.E.R. 98</li>
      </ul>
    `;
  }

  renderFooter() {
    const s = this.data().studio;
    const webring = window.retroSites && typeof window.retroSites.renderWebRing === 'function'
      ? window.retroSites.renderWebRing(GSC_BASE)
      : '';
    const visitor = String(this.visitorNumber()).padStart(7, '0');
    return `
      <tr><td class="gsc-foot">
        <div class="gsc-foot-links">
          [ <a data-url="${this.url()}">Главная</a> | <a data-url="${this.url('/games')}">Игры</a> | <a data-url="${this.url('/devlog/')}">Дневники X-Ray</a> | <a data-url="${this.url('/pda')}">Справочник КПК</a> | <a data-url="${this.url('/stalkers')}">Радиоэфир</a> | <a data-url="${this.url('/studio')}">О студии</a> | <a data-url="${this.url('/search')}">Поиск</a> ]
        </div>
        <table class="gsc-foot-row" width="100%" cellspacing="0" cellpadding="0"><tr>
          <td class="gsc-counter-cell">
            <div class="gsc-counter-label">Вы зашли в Зону</div>
            <span class="gsc-counter">${visitor.split('').map(c => `<span>${c}</span>`).join('')}</span>
            <div class="gsc-counter-label">посетитель с ${this.esc(s.counterSince)}</div>
          </td>
          <td class="gsc-foot-copy">
            &copy; 1995&ndash;1998 GSC Game World, Киев. Все права защищены.<br>
            Пишите нам: <a class="web-mail-link" href="mailto:zone@gsc-game.com">${this.gif('mail')}zone@gsc-game.com</a><br>
            Страница обновлена ${this.esc(s.updated)}. Кодировка Win-1251.
          </td>
          <td class="gsc-foot-badge">
            <span class="gsc-badge88">Лучше смотреть<br>в IE 4.0<br>при 800×600</span>
          </td>
        </tr></table>
        ${webring}
      </td></tr>
    `;
  }

  renderSite(url = GSC_BASE) {
    const route = this.parseRoute(url);
    if (route.view === 'devlog-index') return this.renderDevlogIndex();
    if (route.view === 'devlog-file') return this.renderDevlogFile(route.id);

    const views = {
      games: () => this.renderGamesView(),
      game: () => this.renderGameView(route.id),
      article: () => this.renderArticleView(route.id),
      pda: () => this.renderPdaView(),
      stalkers: () => this.renderStalkersView(),
      search: () => this.renderSearchView(),
      studio: () => this.renderStudioView(),
      home: () => this.renderHomeView()
    };
    const body = (views[route.view] || views.home)();

    return `
      <div class="gsc-site-root">
        <table class="gsc-page" width="760" cellspacing="0" cellpadding="0">
          ${this.renderHeader(route.view)}
          <tr><td class="gsc-body gsc-body-${route.view}">${body}</td></tr>
          ${this.renderFooter()}
        </table>
      </div>
    `;
  }

  attachEvents(win, container, ieInstance) {
    const ie = ieInstance || window.appIE;
    const d = this.data();
    const click = () => { if (window.soundSys) window.soundSys.playClick(); };
    const rerender = () => {
      if (!ie || !win) return;
      const top = container.scrollTop || 0;
      ie.renderPage(win, ie.currentUrl || GSC_BASE);
      container.scrollTop = top;
    };
    const go = (path) => {
      if (ie && win) ie.navigate(win, this.url(path));
    };
    const on = (sel, fn) => container.querySelectorAll(sel).forEach(el => el.addEventListener('click', (e) => {
      if (e && e.preventDefault) e.preventDefault();
      fn(el);
    }));

    const runSearch = (text) => {
      click();
      this.searchQuery = String(text || '').trim();
      go(`/search?q=${encodeURIComponent(this.searchQuery)}`);
    };
    [['#gsc-search-input', '#btn-gsc-search'], ['#gsc-search-page-input', '#btn-gsc-search-page']].forEach(([inputSel, btnSel]) => {
      const input = container.querySelector(inputSel);
      const btn = container.querySelector(btnSel);
      if (!input) return;
      if (btn) btn.addEventListener('click', () => runSearch(input.value));
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(input.value); });
    });
    on('#btn-gsc-search-clear', () => {
      click();
      this.searchQuery = '';
      go('/search');
    });
    on('.gsc-quick-tag[data-gsc-q]', tag => runSearch(tag.dataset.gscQ));

    on('#gsc-english', () => {
      if (window.winManager && typeof window.winManager.openDialog === 'function') {
        window.winManager.openDialog({
          title: 'GSC Game World',
          icon: 'info',
          message: 'English version is under construction. Please come back in December 1998.'
        });
      }
    });

    on('.btn-gsc-news-cat[data-cat]', el => {
      click();
      this.newsCategory = el.dataset.cat;
      rerender();
    });

    on('.btn-gsc-game-primary[data-game-id]', btn => {
      click();
      const id = btn.dataset.gameId;
      const gm = window.gameManager;
      if (gm && gm.isInstalled && gm.isInstalled(id) && gm.catalog && gm.catalog[id] && typeof gm.catalog[id].launch === 'function') {
        gm.catalog[id].launch();
      } else if (gm && typeof gm.isCdDemo === 'function' && gm.isCdDemo(id) && typeof gm.showOnCd === 'function') {
        gm.showOnCd(id);
      } else if (gm && typeof gm.showInSteam === 'function') {
        gm.showInSteam(id);
      }
    });

    on('.btn-gsc-steam[data-game-id]', btn => {
      click();
      if (window.gameManager && typeof window.gameManager.showInSteam === 'function') {
        window.gameManager.showInSteam(btn.dataset.gameId);
      }
    });

    on('#btn-gsc-poll-vote', () => {
      const checked = container.querySelector('input[name="gsc_poll_opt"]:checked');
      if (!checked) return;
      if (window.soundSys) window.soundSys.playDing();
      this.savePollVote(checked.value);
      rerender();
    });
    on('#btn-gsc-poll-reset', () => {
      click();
      this.savePollVote('');
      rerender();
    });

    const findArticle = el => (d.news || []).find(n => n.id === el.dataset.articleId);
    on('.btn-gsc-article-notepad[data-article-id]', el => {
      const art = findArticle(el);
      if (art) this.exportTextToNotepad(`GSC_${art.id}.txt`, this.buildArticlePlainText(art));
    });
    on('.btn-gsc-article-save[data-article-id]', el => {
      const art = findArticle(el);
      if (art) this.saveTextToMyDocuments(`GSC_${art.id}.txt`, this.buildArticlePlainText(art));
    });

    on('.btn-gsc-dossier-notepad[data-game-id]', el => {
      const g = this.getGameCatalogEntry(el.dataset.gameId);
      this.exportTextToNotepad(`GSC_Dossier_${g.id}.txt`, this.buildGameDossierPlainText(g));
    });
    on('.btn-gsc-dossier-save[data-game-id]', el => {
      const g = this.getGameCatalogEntry(el.dataset.gameId);
      this.saveTextToMyDocuments(`GSC_Dossier_${g.id}.txt`, this.buildGameDossierPlainText(g));
    });

    on('.btn-gsc-shot[data-shot]', el => {
      click();
      this.zoomShot = this.zoomShot === el.dataset.shot ? '' : el.dataset.shot;
      rerender();
    });

    on('[data-gsc-jump]', el => {
      const target = container.querySelector(`#gsc-sec-${el.dataset.gscJump}`);
      if (!target || !target.getBoundingClientRect || !container.getBoundingClientRect) return;
      container.scrollTop += target.getBoundingClientRect().top - container.getBoundingClientRect().top - 4;
    });

    const findDoc = el => (d.devlogs || []).find(x => x.id === el.dataset.devlogId);
    on('.btn-gsc-devlog-notepad[data-devlog-id]', el => {
      const doc = findDoc(el);
      if (doc) this.exportTextToNotepad(doc.fileName, this.buildDevlogPlainText(doc));
    });
    on('.btn-gsc-devlog-save[data-devlog-id]', el => {
      const doc = findDoc(el);
      if (doc) this.saveTextToMyDocuments(doc.fileName, this.buildDevlogPlainText(doc));
    });

    on('.btn-gsc-select-anomaly[data-anomaly-id]', el => {
      click();
      this.activeAnomalyId = el.dataset.anomalyId;
      this.boltTelemetry = null;
      rerender();
    });
    on('.btn-gsc-select-detector[data-detector-id]', el => {
      click();
      this.activeDetectorId = el.dataset.detectorId;
      this.boltTelemetry = null;
      rerender();
    });
    on('#btn-gsc-throw-bolt', () => {
      if (window.soundSys) window.soundSys.playDing();
      const anom = (d.anomalies || []).find(a => a.id === this.activeAnomalyId) || d.anomalies[0];
      const det = (d.detectors || []).find(x => x.id === this.activeDetectorId) || d.detectors[0];
      const names = (anom.artifacts || []).map(x => x.name).join(', ');
      this.boltTelemetry = det.id === 'bolt'
        ? `Болт М12 вошёл в радиус ${anom.name}. Разряд зафиксирован, окно прохода 3,5 сек. Без детектора артефакты не видны.`
        : `Болт М12 вошёл в радиус ${anom.name}. Разряд зафиксирован. Прибор «${this.shortDetectorName(det.name)}» (${det.radius.toLowerCase()}) нашёл: ${names}. Окно прохода 3,5 сек.`;
      rerender();
    });

    on('.btn-gsc-guide-next[data-guide-id]', el => {
      click();
      const gid = el.dataset.guideId;
      this.guideProgress[gid] = (this.guideProgress[gid] || 1) + 1;
      rerender();
    });
    on('.btn-gsc-guide-notepad[data-guide-id]', el => {
      const tg = (d.tacticalGuides || []).find(x => x.id === el.dataset.guideId);
      if (tg) this.exportTextToNotepad(`GSC_${tg.id}.txt`, this.buildGuidePlainText(tg, this.guideProgress[tg.id] || 1));
    });

    on('.btn-gsc-radio-filter[data-channel]', el => {
      click();
      this.activeRadioChannel = el.dataset.channel;
      rerender();
    });

    on('#btn-gsc-radio-send', () => {
      const authorEl = container.querySelector('#gsc-radio-author');
      const chEl = container.querySelector('#gsc-radio-channel');
      const textEl = container.querySelector('#gsc-radio-text');
      const author = (authorEl && authorEl.value ? authorEl.value : '').trim() || 'Вольный_Сталкер';
      const channel = chEl && this.radioChannel(chEl.value) ? chEl.value : 'kyiv';
      const text = (textEl && textEl.value ? textEl.value : '').trim();

      if (!text) {
        if (window.soundSys && window.soundSys.playError) window.soundSys.playError();
        if (window.winManager && typeof window.winManager.openDialog === 'function') {
          window.winManager.openDialog({
            title: 'Радиоэфир',
            icon: 'warning',
            message: 'Напишите сообщение, прежде чем выходить в эфир.'
          });
        }
        return;
      }

      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const posts = this.loadRadioPosts();
      posts.unshift({
        id: 'radio-' + Date.now(),
        channel,
        channelLabel: this.radioChannel(channel).label,
        author,
        date: `25.11.1998 ${hhmm}`,
        text
      });
      this.saveRadioPosts(posts);
      this.activeRadioChannel = 'all';
      if (window.soundSys) window.soundSys.playDing();
      rerender();
    });
  }
}

if (typeof window !== 'undefined') {
  window.gscSite = new GSCSite();
}
