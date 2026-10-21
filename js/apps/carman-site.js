class CarManSite {
  constructor() {
    this.baseUrl = 'http://www.carman99.ru';
    this.userKey = 'win98_carman_user_v2';
    this.hitKey = 'win98_carman_hits_v1';
    this.legacyKeys = {
      guestbook: 'win98_carman_guestbook_v1',
      poll: 'win98_carman_poll_v1',
      comments: 'win98_carman_comments_v1',
      votes: 'win98_carman_songvotes_v1'
    };
    this.legacyArticleIds = ['back-to-future-99', 'ten-years-prep', 'south-tour-july99', 'korol-diska-year', 'polyarnaya-stanciya-98', 'lemokh-home-studio', 'dancers-school-99', 'gorbushka-carman-mp3'];
    this.encoding = 'win1251';
    this.synthPlayingId = null;
    this._synthTimer = null;
    this._audioCtx = null;
    this._flapTimer = null;
    this.flapDone = false;
    this.notice = null;
    this.hitCount = 0;
    this.initHits();
  }

  get data() {
    return (typeof window !== 'undefined' && window.carmanData) || {};
  }

  store() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) {}
    return null;
  }

  initHits() {
    const ls = this.store();
    let count = 39411;
    try {
      if (ls) {
        const saved = parseInt(ls.getItem(this.hitKey), 10);
        if (!isNaN(saved)) count = saved;
        count += 1;
        ls.setItem(this.hitKey, String(count));
      } else {
        count += 1;
      }
    } catch (e) {
      count = 39412;
    }
    this.hitCount = count;
  }

  emptyUser() {
    return { guestbook: [], comments: {}, poll: null };
  }

  loadUser() {
    const ls = this.store();
    if (!ls) return this.emptyUser();
    try {
      const raw = ls.getItem(this.userKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            guestbook: Array.isArray(parsed.guestbook) ? parsed.guestbook : [],
            comments: parsed.comments && typeof parsed.comments === 'object' ? parsed.comments : {},
            poll: typeof parsed.poll === 'string' ? parsed.poll : null
          };
        }
      }
    } catch (e) {}
    return this.migrateLegacy();
  }

  migrateLegacy() {
    const user = this.emptyUser();
    const ls = this.store();
    if (!ls) return user;
    try {
      const raw = ls.getItem(this.legacyKeys.guestbook);
      const list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list)) {
        list.filter(e => e && String(e.id || '').startsWith('gb_user_')).reverse().forEach(e => {
          user.guestbook.push({
            name: String(e.name || '').slice(0, 40),
            from: String(e.city || '').slice(0, 40),
            contact: String(e.contact || '').slice(0, 50),
            date: '18.12.1999 12:00',
            fav: '',
            text: String(e.text || '').slice(0, 700),
            reply: ''
          });
        });
      }
    } catch (e) {}
    try {
      ls.removeItem(this.legacyKeys.guestbook);
      ls.removeItem(this.legacyKeys.poll);
      ls.removeItem(this.legacyKeys.votes);
      this.legacyArticleIds.forEach(id => ls.removeItem(`${this.legacyKeys.comments}_${id}`));
    } catch (e) {}
    this.saveUser(user);
    return user;
  }

  saveUser(user) {
    const ls = this.store();
    if (!ls) return;
    try {
      ls.setItem(this.userKey, JSON.stringify(user));
    } catch (e) {}
  }

  esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  gif(name, scale = 1) {
    if (typeof window !== 'undefined' && typeof window.webGif === 'function') {
      return window.webGif(name, scale);
    }
    return '';
  }

  url(path = '') {
    return this.baseUrl + path;
  }

  link(path, label, cls = '') {
    return `<a${cls ? ` class="${cls}"` : ''} data-url="${this.url(path)}">${label}</a>`;
  }

  clock() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${this.data.siteDay} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  album(id) {
    return (this.data.albums || []).find(a => a.id === id) || null;
  }

  place(id) {
    return (this.data.places || []).find(p => p.id === id) || null;
  }

  article(id) {
    return (this.data.articles || []).find(a => a.id === id) || null;
  }

  encodeHtml(html) {
    if (!this.encoding || this.encoding === 'win1251') return html;
    const trMap = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
      'ъ': '', 'ы': 'y', 'ь': '\'', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    const koiMap = {
      'а': 'ю', 'б': 'а', 'в': 'б', 'г': 'ц', 'д': 'д', 'е': 'е', 'ж': 'ф',
      'з': 'г', 'и': 'х', 'й': 'и', 'к': 'й', 'л': 'к', 'м': 'л', 'н': 'м',
      'о': 'н', 'п': 'о', 'р': 'п', 'с': 'я', 'т': 'р', 'у': 'с', 'ф': 'т',
      'х': 'у', 'ц': 'ж', 'ч': 'в', 'ш': 'ь', 'щ': 'ы', 'ы': 'ш', 'э': 'щ',
      'ю': 'ч', 'я': 'ъ'
    };
    const map = this.encoding === 'translit' ? trMap : koiMap;
    return String(html).replace(/(<[^>]+>)|(&[a-zA-Z0-9#]+;)|([^<&]+)/g, (m, tag, ent, txt) => {
      if (tag || ent || !txt) return m;
      return txt.split('').map(ch => {
        const low = ch.toLowerCase();
        if (!Object.prototype.hasOwnProperty.call(map, low)) return ch;
        const out = map[low];
        return ch === low ? out : out.toUpperCase();
      }).join('');
    });
  }

  parseRoute(url = '') {
    const raw = String(url || this.baseUrl).trim();
    const noProto = raw.replace(/^[a-z]+:\/{2}/i, '');
    const qIdx = noProto.indexOf('?');
    const hIdx = noProto.indexOf('#');
    const cut = [qIdx, hIdx].filter(i => i >= 0);
    const pathEnd = cut.length ? Math.min(...cut) : noProto.length;
    const hostAndPath = noProto.slice(0, pathEnd);
    const slash = hostAndPath.indexOf('/');
    const path = (slash >= 0 ? hostAndPath.slice(slash) : '/').toLowerCase().replace(/\/+$/, '') || '/';
    const params = {};
    if (qIdx >= 0) {
      const query = noProto.slice(qIdx + 1, hIdx > qIdx ? hIdx : undefined);
      query.split('&').forEach(pair => {
        const eq = pair.indexOf('=');
        if (eq > 0) {
          let v = pair.slice(eq + 1).replace(/\+/g, ' ');
          try { v = decodeURIComponent(v); } catch (e) {}
          params[pair.slice(0, eq)] = v;
        }
      });
    }
    const routes = {
      '/': 'home',
      '/index.html': 'home',
      '/index.htm': 'home',
      '/news': 'news',
      '/article': 'article',
      '/albums': 'albums',
      '/songs': 'albums',
      '/discography': 'albums',
      '/album': 'album',
      '/atlas': 'atlas',
      '/map': 'atlas',
      '/lineup': 'lineup',
      '/members': 'lineup',
      '/history': 'history',
      '/project': 'history',
      '/about': 'history',
      '/midi': 'midi',
      '/guestbook': 'guestbook'
    };
    const page = routes[path] || '404';
    return { page, path, params };
  }

  getPageTitle(url) {
    const route = this.parseRoute(url);
    const titles = {
      home: 'Кар-Мэн \'99 :: фан-клуб',
      news: 'Кар-Мэн \'99 :: новости',
      albums: 'Кар-Мэн \'99 :: альбомы',
      atlas: 'Кар-Мэн \'99 :: атлас песен',
      lineup: 'Кар-Мэн \'99 :: состав',
      history: 'Кар-Мэн \'99 :: история 1989–1999',
      midi: 'Кар-Мэн \'99 :: MIDI',
      guestbook: 'Кар-Мэн \'99 :: гостевая книга'
    };
    if (route.page === 'article') {
      const art = this.article(route.params.id);
      return art ? `Кар-Мэн '99 :: ${art.title}` : '404 Not Found';
    }
    if (route.page === 'album') {
      const alb = this.album(route.params.id);
      return alb ? `Кар-Мэн '99 :: ${alb.title} (${alb.year})` : '404 Not Found';
    }
    return titles[route.page] || '404 Not Found';
  }

  renderSite(url = '') {
    const route = this.parseRoute(url);
    const pages = {
      home: () => this.renderHome(),
      news: () => this.renderNews(route.params),
      article: () => this.renderArticle(route.params.id),
      albums: () => this.renderAlbums(),
      album: () => this.renderAlbum(route.params.id),
      atlas: () => this.renderAtlas(route.params.place),
      lineup: () => this.renderLineup(route.params.id),
      history: () => this.renderHistory(),
      midi: () => this.renderMidi(),
      guestbook: () => this.renderGuestbook()
    };
    const body = pages[route.page] ? pages[route.page]() : null;
    if (body === null) return this.render404(route.path);
    const html = `
      <div class="cm-site" data-cm-path="${this.esc(route.path)}">
        <table class="cm-shell" cellspacing="0" cellpadding="0" align="center">
          <tr><td>${this.renderMasthead()}</td></tr>
          <tr><td>${this.renderNav(route.page)}</td></tr>
          <tr><td class="cm-body">${this.renderNotice(route.path)}${body}</td></tr>
          <tr><td>${this.renderFooter()}</td></tr>
        </table>
      </div>`;
    return this.encodeHtml(html);
  }

  render404(path) {
    return `
      <div class="cm-site cm-raw">
        <h1>Not Found</h1>
        <p>The requested URL ${this.esc(path)} was not found on this server.</p>
        <hr>
        <address>Apache/1.3.9 Server at www.carman99.ru Port 80</address>
      </div>`;
  }

  renderNotice(path) {
    if (!this.notice || this.notice.path !== path) return '';
    const text = this.notice.text;
    this.notice = null;
    return `<div class="cm-notice">${this.gif('check')} ${this.esc(text)}</div>`;
  }

  renderMasthead() {
    const studs = [];
    for (let x = 14; x < 760; x += 28) {
      studs.push(`<circle cx="${x}" cy="9" r="4" fill="#999999"/><circle cx="${x - 1}" cy="8" r="1.5" fill="#ffffff"/>`);
      studs.push(`<circle cx="${x}" cy="113" r="4" fill="#999999"/><circle cx="${x - 1}" cy="112" r="1.5" fill="#ffffff"/>`);
    }
    return `
      <a data-url="${this.url()}" class="cm-mast-link">
        <svg class="cm-mast" width="760" height="122" viewBox="0 0 760 122" role="img" aria-label="Кар-Мэн. Фан-клуб, 1989–1999">
          <rect width="760" height="122" fill="#000000"/>
          <rect y="18" width="760" height="86" fill="#333333"/>
          ${studs.join('')}
          <g transform="translate(64 61)">
            <circle r="30" fill="#003366" stroke="#cccccc" stroke-width="3"/>
            <ellipse rx="12" ry="30" fill="none" stroke="#6699cc" stroke-width="2"/>
            <line x1="-30" y1="0" x2="30" y2="0" stroke="#6699cc" stroke-width="2"/>
            <line x1="-26" y1="-14" x2="26" y2="-14" stroke="#6699cc" stroke-width="1"/>
            <line x1="-26" y1="14" x2="26" y2="14" stroke="#6699cc" stroke-width="1"/>
            <path d="M -40 10 Q 0 -44 44 -6" fill="none" stroke="#ffcc00" stroke-width="3"/>
            <polygon points="44,-6 34,-4 40,-14" fill="#ffcc00"/>
          </g>
          <defs>
            <clipPath id="cm-chrome-top"><rect x="0" y="0" width="760" height="58"/></clipPath>
          </defs>
          <g font-family="Impact, 'Arial Black', sans-serif" font-size="66">
            <text x="112" y="88" fill="#660000" textLength="400" lengthAdjust="spacingAndGlyphs">КАР-МЭН</text>
            <text x="108" y="84" fill="#999999" stroke="#000000" stroke-width="2" textLength="400" lengthAdjust="spacingAndGlyphs">КАР-МЭН</text>
            <text x="108" y="84" fill="#ffffff" stroke="#000000" stroke-width="2" textLength="400" lengthAdjust="spacingAndGlyphs" clip-path="url(#cm-chrome-top)">КАР-МЭН</text>
          </g>
          <text x="532" y="48" font-family="Verdana, Arial, sans-serif" font-size="13" font-weight="bold" fill="#ffcc00">ФАН-КЛУБ</text>
          <text x="532" y="68" font-family="Verdana, Arial, sans-serif" font-size="11" fill="#cccccc">экзотик-поп с 1989 года</text>
          <text x="532" y="86" font-family="Verdana, Arial, sans-serif" font-size="11" fill="#cccccc">обновлено ${this.esc(this.data.siteDay)}</text>
        </svg>
      </a>`;
  }

  navItems() {
    return [
      ['home', 'Главная', ''],
      ['news', 'Новости', '/news'],
      ['albums', 'Альбомы', '/albums'],
      ['atlas', 'Атлас песен', '/atlas'],
      ['lineup', 'Состав', '/lineup'],
      ['history', 'История', '/history'],
      ['midi', 'MIDI', '/midi'],
      ['guestbook', 'Гостевая', '/guestbook']
    ];
  }

  renderNav(page) {
    const active = { article: 'news', album: 'albums' }[page] || page;
    const enc = [['win1251', 'WIN'], ['koi8', 'KOI'], ['translit', 'LAT']].map(([key, label]) =>
      this.encoding === key ? `<b>${label}</b>` : `<a data-cm-enc="${key}">${label}</a>`).join(' | ');
    return `
      <table class="cm-nav" width="760" cellspacing="0" cellpadding="0">
        <tr>
          ${this.navItems().map(([key, label, path]) => `
            <td class="${active === key ? 'cm-nav-on' : 'cm-nav-off'}">${active === key ? label : this.link(path, label)}</td>`).join('')}
          <td class="cm-nav-enc">${enc}</td>
        </tr>
      </table>`;
  }

  renderFooter() {
    const ring = typeof window !== 'undefined' && window.retroSites && typeof window.retroSites.renderWebRing === 'function'
      ? window.retroSites.renderWebRing(this.baseUrl)
      : '';
    const digits = String(this.hitCount).padStart(6, '0').split('').map(d => `<span>${d}</span>`).join('');
    return `
      <div class="cm-footer">
        <div class="cm-footer-links">
          ${this.navItems().map(([, label, path]) => this.link(path, label)).join(' | ')}
        </div>
        <table class="cm-footer-row" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <div class="cm-counter" title="Посетителей с 08.03.1999">${digits}</div>
            </td>
            <td class="cm-buttons">
              <a class="cm-88" data-url="http://www.rambler98.ru">RAMBLER<br>TOP 100</a>
              <a class="cm-88 cm-88-mz" data-url="http://www.muzzone98.ru">МузЗона<br>'98</a>
              <a class="cm-88 cm-88-ie" data-url="http://www.microslop.com">Лучше всего<br>в IE 4.0</a>
            </td>
          </tr>
        </table>
        <p>Неофициальный фан-клуб группы «Кар-Мэн». Пишите вебмастеру: ${this.esc(this.data.webmaster)}, <a href="mailto:webmaster@carman99.ru">webmaster@carman99.ru</a>. Страницы рассчитаны на 800x600 и модем 33.6.</p>
        <p class="cm-footer-small">Все названия и даты сверены с буклетами наших кассет и дисков. Нашли ошибку? Напишите в <a data-url="${this.url('/guestbook')}">гостевую</a>. <a data-cm-clippy="1">Спросить Скрепыша</a></p>
        ${ring}
      </div>`;
  }

  flapCells(text, width, cls = '') {
    const chars = String(text).toUpperCase().slice(0, width).padEnd(width, ' ').split('');
    return chars.map(ch => ch === ' '
      ? `<span class="cm-flap cm-flap-blank${cls}"> </span>`
      : `<span class="cm-flap${cls}" data-c="${this.esc(ch)}">${this.esc(ch)}</span>`).join('');
  }

  renderBoard() {
    const album = this.album('nazad-v-budushchee');
    const head = `
      <div class="cm-board-row cm-board-head">
        <span class="cm-bh" style="width:20px">№</span>
        <span class="cm-bh" style="width:230px">рейс</span>
        <span class="cm-bh" style="width:220px">первый вылет</span>
        <span class="cm-bh" style="width:40px">запись</span>
        <span class="cm-bh" style="width:40px">время</span>
      </div>`;
    const rows = (this.data.board || []).map(r => {
      const target = r.place ? `/atlas?place=${r.place}` : '/album?id=nazad-v-budushchee';
      const from = r.from ? `${r.from} ${r.fromYear}` : 'новый трек';
      return `
        <a class="cm-board-row" data-url="${this.url(target)}" title="${this.esc(r.place ? 'Показать на карте' : 'Открыть альбом')}">
          ${this.flapCells(String(r.no).padStart(2, '0'), 2)}<span class="cm-gap"></span>${this.flapCells(r.song, 23, r.fromYear ? '' : ' cm-flap-new')}<span class="cm-gap"></span>${this.flapCells(from, 22)}<span class="cm-gap"></span>${this.flapCells(String(r.rec), 4)}<span class="cm-gap"></span>${this.flapCells(r.time, 4, ' cm-flap-time')}
        </a>`;
    }).join('');
    return `
      <div class="cm-board">
        <div class="cm-board-title">
          <span class="cm-board-link">${this.link('/album?id=nazad-v-budushchee', 'треклист и вкладыш')}</span>
          Вылеты декабря 1999: «${this.esc(album ? album.title : '')}»
        </div>
        ${head}
        ${rows}
        <div class="cm-board-foot">Девять старых рейсов снова в расписании. Нажмите на строку: город откроется на карте песен.</div>
      </div>`;
  }

  pollState() {
    const user = this.loadUser();
    const options = ((this.data.poll || {}).options || []).map(([key, label, base]) => ({
      key, label, count: base + (user.poll === key ? 1 : 0)
    }));
    const total = options.reduce((s, o) => s + o.count, 0) || 1;
    return { options, total, voted: user.poll };
  }

  savePollVote(choice) {
    const valid = ((this.data.poll || {}).options || []).map(o => o[0]);
    if (!valid.includes(choice)) return this.pollState();
    const user = this.loadUser();
    if (!user.poll) {
      user.poll = choice;
      this.saveUser(user);
    }
    return this.pollState();
  }

  renderPoll() {
    const poll = this.pollState();
    const rows = poll.options.map((o, i) => {
      const pct = Math.round(o.count * 100 / poll.total);
      const input = poll.voted
        ? (poll.voted === o.key ? '<b>&gt;</b>' : '')
        : `<input type="radio" name="cm-poll" value="${o.key}"${i === 0 ? ' checked' : ''}>`;
      return `
        <tr>
          <td width="14">${input}</td>
          <td>${this.esc(o.label)}</td>
          <td width="34" align="right">${pct}%</td>
        </tr>
        <tr><td></td><td colspan="2"><div class="cm-bar"><div style="width:${pct}%"></div></div></td></tr>`;
    }).join('');
    return `
      <div class="cm-side-box">
        <div class="cm-side-title">Опрос</div>
        <p><b>${this.esc((this.data.poll || {}).question)}</b></p>
        <table class="cm-poll" width="100%" cellspacing="0" cellpadding="1">${rows}</table>
        ${poll.voted
          ? `<p class="cm-small">Ваш голос учтён. Всего голосов: ${poll.total}.</p>`
          : `<p><button class="cm-btn" data-cm-poll="1">Голосовать</button> <span class="cm-small">голосов: ${poll.total}</span></p>`}
      </div>`;
  }

  renderHome() {
    const arts = (this.data.articles || []).slice(0, 5);
    const lead = arts[0];
    const gb = this.allGuestbook().slice(0, 2);
    return `
      <div class="cm-lead">
        <p><b>${this.esc(this.data.siteDayLong)}.</b> Десять лет назад, в ноябре 1989 года, дуэт Сергея Лемоха и Богдана Титомира впервые вышел на сцену. А на этой неделе на прилавках появился альбом ремиксов «Назад в будущее». ${this.link(`/article?id=${lead.id}`, 'Что на нём')}.</p>
      </div>
      ${this.renderBoard()}
      <table class="cm-cols" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="cm-col-main" valign="top">
            <h2 class="cm-h2">Новости фан-клуба</h2>
            ${arts.map((a, i) => `
              <div class="cm-news-item">
                <div class="cm-news-date">${this.esc(a.date)} ${i === 0 ? this.gif('new') : ''}</div>
                <div class="cm-news-title">${this.link(`/article?id=${a.id}`, this.esc(a.title))}</div>
                <div class="cm-news-lead">${this.esc(a.lead)}</div>
              </div>`).join('')}
            <p>${this.link('/news', 'Все новости')}</p>
          </td>
          <td class="cm-col-side" valign="top">
            ${this.renderPoll()}
            <div class="cm-side-box">
              <div class="cm-side-title">Из гостевой</div>
              ${gb.map(g => `
                <p><b>${this.esc(g.name)}</b>, ${this.esc(g.from)}:<br>${this.esc(g.text.length > 110 ? g.text.slice(0, 110) + '…' : g.text)}</p>`).join('')}
              <p>${this.link('/guestbook', 'Написать в гостевую')}</p>
            </div>
            <div class="cm-side-box">
              <div class="cm-side-title">На сайте</div>
              <p>${this.link('/albums', 'Альбомы')}: ${(this.data.albums || []).length} кассет с треклистами<br>
              ${this.link('/atlas', 'Атлас')}: ${(this.data.places || []).length} точек на карте<br>
              ${this.link('/lineup', 'Состав')}: кто и когда танцевал<br>
              ${this.link('/midi', 'MIDI')}: наигрыши посетителей</p>
            </div>
          </td>
        </tr>
      </table>`;
  }

  monthName(date) {
    const months = ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const [, m, y] = String(date).split('.');
    return `${months[Number(m)] || ''} ${y || ''}`;
  }

  renderNews(params) {
    const all = this.data.articles || [];
    const rubrics = Array.from(new Set(all.map(a => a.rubric)));
    const rubric = rubrics.includes(params.rubric) ? params.rubric : '';
    const list = rubric ? all.filter(a => a.rubric === rubric) : all;
    const groups = [];
    list.forEach(a => {
      const m = this.monthName(a.date);
      let g = groups.find(x => x.m === m);
      if (!g) {
        g = { m, items: [] };
        groups.push(g);
      }
      g.items.push(a);
    });
    const filter = [rubric ? this.link('/news', 'все') : '<b>все</b>']
      .concat(rubrics.map(r => r === rubric ? `<b>${this.esc(r)}</b>` : this.link(`/news?rubric=${encodeURIComponent(r)}`, this.esc(r))))
      .join(' | ');
    return `
      <h1 class="cm-h1">Новости</h1>
      <p class="cm-filter">Рубрика: ${filter}</p>
      ${groups.map(g => `
        <h2 class="cm-h2">${this.esc(g.m)}</h2>
        <table class="cm-archive" width="100%" cellspacing="0" cellpadding="3">
          ${g.items.map(a => `
            <tr>
              <td width="78" valign="top" class="cm-news-date">${this.esc(a.date)}</td>
              <td valign="top">
                <span class="cm-rubric">${this.esc(a.rubric)}</span>
                ${this.link(`/article?id=${a.id}`, `<b>${this.esc(a.title)}</b>`)}<br>
                ${this.esc(a.lead)}
                <span class="cm-small">(${this.esc(a.author)}, откликов: ${this.comments(a.id).length})</span>
              </td>
            </tr>`).join('')}
        </table>`).join('')}`;
  }

  comments(articleId) {
    const seed = ((this.data.articleComments || {})[articleId] || []).map(([author, date, text]) => ({ author, date, text }));
    const user = this.loadUser();
    return seed.concat(Array.isArray(user.comments[articleId]) ? user.comments[articleId] : []);
  }

  addComment(articleId, author, text) {
    const clean = String(text || '').trim();
    if (!clean || !this.article(articleId)) return this.comments(articleId);
    const user = this.loadUser();
    const list = Array.isArray(user.comments[articleId]) ? user.comments[articleId] : [];
    list.push({ author: (String(author || '').trim() || 'Гость').slice(0, 40), date: this.clock(), text: clean.slice(0, 600) });
    user.comments[articleId] = list;
    this.saveUser(user);
    return this.comments(articleId);
  }

  renderPostmark(date) {
    return `
      <svg width="96" height="96" viewBox="0 0 96 96" class="cm-postmark" aria-hidden="true">
        <circle cx="48" cy="48" r="44" fill="none" stroke="#333366" stroke-width="2"/>
        <circle cx="48" cy="48" r="30" fill="none" stroke="#333366" stroke-width="1"/>
        <text x="48" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#333366">МОСКВА</text>
        <text x="48" y="52" text-anchor="middle" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="#333366">${this.esc(date)}</text>
        <text x="48" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#333366">CARMAN99</text>
      </svg>`;
  }

  renderStamp() {
    return `
      <svg width="64" height="76" viewBox="0 0 64 76" class="cm-stamp" aria-hidden="true">
        <rect x="1" y="1" width="62" height="74" fill="#ffffff" stroke="#999999" stroke-dasharray="3 2"/>
        <rect x="6" y="6" width="52" height="64" fill="#003366"/>
        <circle cx="32" cy="32" r="16" fill="#336699" stroke="#ffcc00" stroke-width="2"/>
        <path d="M 14 42 Q 32 8 52 26" fill="none" stroke="#ffcc00" stroke-width="2"/>
        <text x="32" y="64" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#ffffff">ПОЧТА</text>
      </svg>`;
  }

  renderArticle(id) {
    const art = this.article(id);
    if (!art) return null;
    const list = this.comments(art.id);
    const others = (this.data.articles || []).filter(a => a.id !== art.id).slice(0, 4);
    return `
      <p class="cm-crumbs">${this.link('', 'Главная')} &gt; ${this.link('/news', 'Новости')} &gt; ${this.esc(art.rubric)}</p>
      <div class="cm-airmail">
        <div class="cm-letter">
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td valign="top">
                <div class="cm-letter-from">От: ${this.esc(art.author)}<br>Кому: всем, кто слушает «Кар-Мэн»</div>
              </td>
              <td width="96" valign="top">${this.renderPostmark(art.date)}</td>
              <td width="70" valign="top" align="right">${this.renderStamp()}</td>
            </tr>
          </table>
          <h1 class="cm-letter-title">${this.esc(art.title)}</h1>
          <p class="cm-letter-lead">${this.esc(art.lead)}</p>
          ${art.body.map(p => `<p>${this.esc(p)}</p>`).join('')}
          <p class="cm-letter-tools">
            <button class="cm-btn" data-cm-notepad="article:${art.id}">Открыть в Блокноте</button>
            <button class="cm-btn" data-cm-save="article:${art.id}">Сохранить ${this.esc(art.file)}</button>
          </p>
        </div>
      </div>
      <h2 class="cm-h2">Отклики (${list.length})</h2>
      ${list.length ? list.map(c => `
        <div class="cm-comment">
          <b>${this.esc(c.author)}</b> <span class="cm-small">${this.esc(c.date)}</span><br>
          ${this.esc(c.text)}
        </div>`).join('') : '<p>Откликов пока нет. Будьте первым.</p>'}
      <table class="cm-form" cellspacing="0" cellpadding="3">
        <tr><td>Имя:</td><td><input type="text" id="cm-c-name" size="24" maxlength="40" value=""></td></tr>
        <tr><td valign="top">Отклик:</td><td><textarea id="cm-c-text" rows="4" cols="52" maxlength="600"></textarea></td></tr>
        <tr><td></td><td><button class="cm-btn" data-cm-comment="${art.id}">Отправить отклик</button></td></tr>
      </table>
      <h2 class="cm-h2">Ещё письма</h2>
      <ul class="cm-list">
        ${others.map(o => `<li>${this.esc(o.date)} ${this.link(`/article?id=${o.id}`, this.esc(o.title))}</li>`).join('')}
      </ul>`;
  }

  kindLabel(kind) {
    return { studio: 'Студийные альбомы', compilation: 'Сборники', remix: 'Альбом ремиксов', solo: 'Сольный альбом Сергея Лемоха' }[kind] || kind;
  }

  renderAlbums() {
    const albums = this.data.albums || [];
    const kinds = ['studio', 'remix', 'compilation', 'solo'];
    return `
      <h1 class="cm-h1">Альбомы</h1>
      <p>Вся наша полка кассет и дисков с 1990 по 1999 год. Нажмите на корешок, чтобы открыть вкладыш: там треклист с хронометражем, кто записывал и где издано. Вкладыш можно распечатать для своей перезаписанной кассеты.</p>
      <div class="cm-shelf">
        ${kinds.map(kind => {
          const list = albums.filter(a => a.kind === kind);
          if (!list.length) return '';
          return `
            <div class="cm-shelf-label">${this.esc(this.kindLabel(kind))}</div>
            ${list.map(a => `
              <a class="cm-spine" data-url="${this.url(`/album?id=${a.id}`)}" style="background-color:${a.jcard}">
                <span class="cm-spine-year">${this.esc(a.year)}</span>
                <span class="cm-spine-title">КАР-МЭН &nbsp; ${this.esc(a.title)}</span>
                <span class="cm-spine-label">${this.esc(a.label)}</span>
              </a>`).join('')}`;
        }).join('')}
      </div>
      <h2 class="cm-h2">Видеокассета «Car-Man» (ZeKo video, 1997)</h2>
      <p>Номер ZKV003, 90 минут. На кассете 16 номеров:</p>
      <ol class="cm-video">
        ${(this.data.videos || []).map(([t, note]) => `<li>${this.esc(t)}${note ? ` <span class="cm-small">(${this.esc(note)})</span>` : ''}</li>`).join('')}
      </ol>
      <p class="cm-small">Концертный «Live…» (J.S.P., 1994) у нас пока есть только на перезаписанной кассете без буклета, поэтому его треклист не публикуем.</p>`;
  }

  trackPlace(title) {
    const clean = title.replace(/\s*\[.*$/, '').replace(/\s*\(.*$/, '').toLowerCase();
    return (this.data.places || []).find(p => p.songs.some(([t]) => t.replace(/\s*\[.*$/, '').toLowerCase() === clean)) || null;
  }

  renderJcardFront(a) {
    const motifs = {
      studio: '<circle cx="90" cy="96" r="44" fill="none" stroke="#ffffff" stroke-width="3"/><ellipse cx="90" cy="96" rx="18" ry="44" fill="none" stroke="#ffffff" stroke-width="2"/><line x1="46" y1="96" x2="134" y2="96" stroke="#ffffff" stroke-width="2"/>',
      remix: '<path d="M 40 130 A 50 50 0 1 1 140 96" fill="none" stroke="#ffffff" stroke-width="4"/><polygon points="140,96 128,84 152,84" fill="#ffffff"/><text x="90" y="104" text-anchor="middle" font-family="Impact, sans-serif" font-size="24" fill="#ffffff">1999</text>',
      compilation: '<rect x="44" y="60" width="92" height="60" fill="none" stroke="#ffffff" stroke-width="3"/><circle cx="70" cy="90" r="12" fill="none" stroke="#ffffff" stroke-width="3"/><circle cx="110" cy="90" r="12" fill="none" stroke="#ffffff" stroke-width="3"/>',
      solo: '<polygon points="90,46 98,82 134,90 98,98 90,134 82,98 46,90 82,82" fill="#ffffff"/>'
    };
    return `
      <svg width="180" height="200" viewBox="0 0 180 200" aria-hidden="true">
        <rect width="180" height="200" fill="${a.jcard}"/>
        <text x="12" y="26" font-family="Impact, 'Arial Black', sans-serif" font-size="22" fill="#ffffff">КАР-МЭН</text>
        ${motifs[a.kind] || motifs.studio}
        <rect x="0" y="160" width="180" height="40" fill="#ffffff"/>
        <text x="10" y="178" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#000000">${this.esc(a.title.length > 26 ? a.title.slice(0, 25) + '…' : a.title)}</text>
        <text x="10" y="193" font-family="Arial, sans-serif" font-size="10" fill="#000000">${this.esc(a.year)}, ${this.esc(a.label.split(',')[0])}</text>
      </svg>`;
  }

  renderAlbum(id) {
    const a = this.album(id);
    if (!a) return null;
    const albums = this.data.albums || [];
    const idx = albums.indexOf(a);
    const prev = albums[idx - 1];
    const next = albums[idx + 1];
    return `
      <p class="cm-crumbs">${this.link('', 'Главная')} &gt; ${this.link('/albums', 'Альбомы')} &gt; ${this.esc(a.title)}</p>
      <h1 class="cm-h1">${this.esc(a.title)} <span class="cm-h1-year">${this.esc(a.year)}</span></h1>
      <table class="cm-jcard" cellspacing="0" cellpadding="0">
        <tr>
          <td class="cm-jcard-back" valign="top">
            <div class="cm-jcard-head">Вкладыш фан-клуба</div>
            <table cellspacing="0" cellpadding="1" class="cm-jcard-credits">
              ${a.credits.map(([k, v]) => `<tr><td valign="top"><b>${this.esc(k)}:</b></td><td>${this.esc(v)}</td></tr>`).join('')}
            </table>
            <p class="cm-small">Отрезать по рамке, сложить по линиям. Печатать на принтере в масштабе 100%.</p>
          </td>
          <td class="cm-jcard-spine" style="background-color:${a.jcard}">
            <svg width="26" height="200" viewBox="0 0 26 200" aria-hidden="true">
              <text transform="translate(18 194) rotate(-90)" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">КАР-МЭН  ${this.esc(a.title.length > 24 ? a.title.slice(0, 23) + '…' : a.title)}</text>
            </svg>
          </td>
          <td class="cm-jcard-front">${this.renderJcardFront(a)}</td>
        </tr>
      </table>
      <table class="cm-cols" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="cm-col-main" valign="top">
            <h2 class="cm-h2">Треклист</h2>
            <table class="cm-tracks" width="100%" cellspacing="0" cellpadding="2">
              ${a.tracks.map(([t, d], i) => {
                const p = this.trackPlace(t);
                return `
                  <tr>
                    <td width="22" align="right">${i + 1}.</td>
                    <td>${this.esc(t)}</td>
                    <td width="72">${p ? this.link(`/atlas?place=${p.id}`, 'на карте') : ''}</td>
                    <td width="40" align="right">${this.esc(d)}</td>
                  </tr>`;
              }).join('')}
            </table>
            <p>${this.esc(a.note)}</p>
          </td>
          <td class="cm-col-side" valign="top">
            <div class="cm-side-box">
              <div class="cm-side-title">Издание</div>
              <p><b>Вышел:</b> ${this.esc(a.released)}<br>
              <b>Издатель:</b> ${this.esc(a.label)}<br>
              <b>Носители:</b> ${this.esc(a.formats)}<br>
              <b>Запись:</b> ${this.esc(a.recorded)}</p>
            </div>
            <p><button class="cm-btn" data-cm-notepad="album:${a.id}">Вкладыш в Блокнот</button></p>
            <p><button class="cm-btn" data-cm-save="album:${a.id}">Сохранить на диск</button></p>
          </td>
        </tr>
      </table>
      <p class="cm-pager">
        ${prev ? this.link(`/album?id=${prev.id}`, `&lt;&lt; ${this.esc(prev.title)}`) : ''}
        ${prev && next ? ' | ' : ''}
        ${next ? this.link(`/album?id=${next.id}`, `${this.esc(next.title)} &gt;&gt;`) : ''}
      </p>`;
  }

  placeCell(p) {
    const m = this.data.map;
    const col = Math.max(0, Math.min(m.width - 1, Math.floor((p.lon + 180) / 360 * m.width)));
    const row = Math.max(0, Math.min(m.height - 1, Math.floor((m.top - p.lat) / (m.top - m.bottom) * m.height)));
    return { row, col };
  }

  hasRemix(p) {
    return p.songs.some(([, albumId]) => albumId === 'nazad-v-budushchee');
  }

  renderMap(selectedId) {
    const m = this.data.map;
    const pins = {};
    (this.data.places || []).forEach(p => {
      const { row, col } = this.placeCell(p);
      pins[`${row}:${col}`] = p;
    });
    const lines = m.rows.map((line, r) => {
      let out = '';
      let run = '';
      let runType = null;
      const flush = () => {
        if (!run) return;
        out += runType === 'land' ? `<span class="cm-land">${run}</span>` : `<span class="cm-sea">${run}</span>`;
        run = '';
      };
      for (let c = 0; c < line.length; c++) {
        const p = pins[`${r}:${c}`];
        if (p) {
          flush();
          runType = null;
          const cls = ['cm-pin'];
          if (this.hasRemix(p)) cls.push('cm-pin-remix');
          if (p.id === selectedId) cls.push('cm-pin-on');
          out += `<a class="${cls.join(' ')}" data-url="${this.url(`/atlas?place=${p.id}`)}" title="${this.esc(p.name)}">${p.mark}</a>`;
          continue;
        }
        const type = line[c] === '#' ? 'land' : 'sea';
        if (type !== runType) {
          flush();
          runType = type;
        }
        run += type === 'land' ? '▓' : '·';
      }
      flush();
      return out;
    });
    return `<pre class="cm-map">${lines.join('\n')}</pre>`;
  }

  renderAtlas(placeId) {
    const places = this.data.places || [];
    const sel = this.place(placeId);
    const detail = sel ? `
      <div class="cm-place">
        <div class="cm-place-mark">${sel.mark}</div>
        <div style="margin-left:38px">
          <b>${this.esc(sel.name)}</b><br>
          ${sel.songs.map(([t, aid]) => {
            const a = this.album(aid);
            return `«${this.esc(t)}» ${a ? `(${this.link(`/album?id=${a.id}`, this.esc(a.title))}, ${this.esc(a.year)})` : ''}`;
          }).join('<br>')}
        </div>
      </div>` : '<p class="cm-place-hint">Выберите букву на карте или строку в таблице.</p>';
    return `
      <h1 class="cm-h1">Атлас песен</h1>
      <p>С первого альбома «Кар-Мэн» путешествует: «Вокруг света» в 1990 году был задуман как альбом-маршрут, где каждая песня про свой город или страну. Здесь отмечены все места из песен 1990–1999 годов. Жёлтые буквы: города, которые вернулись на «Назад в будущее».</p>
      <div class="cm-map-box">${this.renderMap(sel ? sel.id : '')}</div>
      ${detail}
      <table class="cm-legend" width="100%" cellspacing="0" cellpadding="2">
        <tr><th width="24"></th><th>Место</th><th>Песни</th></tr>
        ${places.map(p => `
          <tr class="${p.id === (sel && sel.id) ? 'cm-legend-on' : ''}">
            <td align="center"><b class="${this.hasRemix(p) ? 'cm-mark-remix' : 'cm-mark'}">${p.mark}</b></td>
            <td>${this.link(`/atlas?place=${p.id}`, this.esc(p.name))}</td>
            <td>${p.songs.map(([t]) => this.esc(t)).join(', ')}</td>
          </tr>`).join('')}
        ${(this.data.offMap || []).map(o => `
          <tr>
            <td align="center">${this.gif(o.id === 'orbit' ? 'rocket' : 'globe')}</td>
            <td>${this.esc(o.name)} <span class="cm-small">(за краем карты)</span></td>
            <td>${o.songs.map(([t, aid]) => {
              const a = this.album(aid);
              return `${this.esc(t)}${a ? ` <span class="cm-small">(${this.esc(a.title)})</span>` : ''}`;
            }).join(', ')}</td>
          </tr>`).join('')}
      </table>
      <p class="cm-small">Карта нарисована точками по контурам материков. Если песня о городе, точка стоит на городе; если о стране или части света, примерно в её середине.</p>`;
  }

  renderLineup(id) {
    const people = this.data.people || [];
    const years = [];
    for (let y = 1989; y <= 1999; y++) years.push(y);
    const selected = people.find(p => p.id === id) || people[0];
    const dossier = (this.data.dossiers || {})[selected.id];
    const inSpan = (p, y) => p.spans.some(([a, b]) => y >= a && y <= b);
    const yearsText = p => p.spans.map(([a, b]) => a === b ? String(a) : `${a}–${b}`).join(', ');
    return `
      <h1 class="cm-h1">Состав по годам</h1>
      <p>У «Кар-Мэн» за десять лет один постоянный участник: Сергей Лемох. Вокруг него менялись танцоры дэнс-машины, гитаристы и голоса для семплов. Закрашенная клетка значит, что человек был в составе в этом году. Нажмите на имя, чтобы прочитать о нём.</p>
      <table class="cm-gantt" cellspacing="0" cellpadding="0">
        <tr>
          <th class="cm-gantt-name">Участник</th>
          ${years.map(y => `<th>${String(y).slice(2)}</th>`).join('')}
        </tr>
        ${people.map(p => `
          <tr class="${p.id === selected.id ? 'cm-gantt-on' : ''}">
            <td class="cm-gantt-name">${(this.data.dossiers || {})[p.id] ? this.link(`/lineup?id=${p.id}`, this.esc(p.name)) : this.esc(p.name)}<br><span class="cm-small">${this.esc(p.role)}</span></td>
            ${years.map(y => `<td class="${inSpan(p, y) ? `cm-g-${p.group}` : 'cm-g-off'}">${inSpan(p, y) ? '&nbsp;' : ''}</td>`).join('')}
          </tr>`).join('')}
      </table>
      <p class="cm-gantt-key"><span class="cm-g-core">&nbsp;&nbsp;&nbsp;</span> вокал &nbsp; <span class="cm-g-dance">&nbsp;&nbsp;&nbsp;</span> дэнс-машина &nbsp; <span class="cm-g-band">&nbsp;&nbsp;&nbsp;</span> музыканты и голоса</p>
      <div class="cm-dossier">
        <div class="cm-dossier-head">${this.esc(dossier ? dossier.name : selected.name)}</div>
        <table cellspacing="0" cellpadding="2">
          <tr><td width="150" valign="top"><b>В составе:</b></td><td>${this.esc(yearsText(selected))}</td></tr>
          <tr><td valign="top"><b>Роль:</b></td><td>${this.esc(selected.role)}</td></tr>
          ${dossier ? dossier.lines.map(([k, v]) => `<tr><td valign="top"><b>${this.esc(k)}:</b></td><td>${this.esc(v)}</td></tr>`).join('') : ''}
        </table>
        ${dossier ? `<p>${this.esc(dossier.text)}</p>` : ''}
      </div>
      <h2 class="cm-h2">За кадром</h2>
      <table class="cm-crew" width="100%" cellspacing="0" cellpadding="2">
        ${(this.data.crew || []).map(([n, r]) => `<tr><td width="190"><b>${this.esc(n)}</b></td><td>${this.esc(r)}</td></tr>`).join('')}
      </table>`;
  }

  renderHistory() {
    const items = this.data.history || [];
    const inks = ['cm-ink-red', 'cm-ink-blue', 'cm-ink-green', 'cm-ink-violet'];
    const pages = [];
    for (let i = 0; i < items.length; i += 2) pages.push(items.slice(i, i + 2));
    return `
      <h1 class="cm-h1">История 1989–1999</h1>
      <p>Сами участники переводили название группы как «путешественник». Так что историю мы собрали в паспорт: каждый год группы отмечен штампом, а под ним то, что в этот год произошло. Даты сверены по буклетам, газете «Московский комсомолец» и телеэфирам.</p>
      <div class="cm-passport">
        <div class="cm-passport-cover">ПАСПОРТ ПУТЕШЕСТВЕННИКА <span>КАР-МЭН</span></div>
        ${pages.map((pair, pi) => `
          <table class="cm-passport-spread" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              ${pair.map((h, k) => `
                <td class="cm-passport-page" valign="top" width="50%">
                  <div class="cm-visa ${inks[(pi * 2 + k) % inks.length]}">
                    <div class="cm-visa-year">${h.year}</div>
                    <div class="cm-visa-word">${this.esc(h.stamp)}</div>
                  </div>
                  <ul>${h.items.map(t => `<li>${this.esc(t)}</li>`).join('')}</ul>
                  <div class="cm-passport-no">стр. ${pi * 2 + k + 1}</div>
                </td>`).join('')}
              ${pair.length < 2 ? '<td class="cm-passport-page" width="50%" valign="top"><div class="cm-passport-empty">Место для штампа 2000 года</div></td>' : ''}
            </tr>
          </table>`).join('')}
      </div>`;
  }

  renderMidi() {
    const files = this.data.midi || [];
    const playing = files.find(f => f.id === this.synthPlayingId);
    return `
      <h1 class="cm-h1">MIDI</h1>
      <p>Наигрыши, которые прислали посетители. Это не оригинальные песни и не их подбор, а короткие мелодии по мотивам, сочинённые нашими читателями на домашних синтезаторах. Звук играет прямо на странице, через звуковую карту.</p>
      <div class="cm-player">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td width="70"><button class="cm-pbtn" data-cm-midi="${playing ? playing.id : (files[0] || {}).id}">&#9658;</button><button class="cm-pbtn" data-cm-stop="1">&#9632;</button></td>
            <td><div class="cm-lcd">${playing ? `${this.esc(playing.file)} &nbsp; ${playing.bpm} BPM &nbsp; ИГРАЕТ` : 'ГОТОВ К ВОСПРОИЗВЕДЕНИЮ'}</div></td>
            <td width="110" class="cm-small" align="right">MIDI-плеер 1.0</td>
          </tr>
        </table>
      </div>
      <table class="cm-midi" width="100%" cellspacing="0" cellpadding="3">
        <tr><th></th><th>Файл</th><th>Размер</th><th>Мелодия</th><th>Прислал</th></tr>
        ${files.map(f => `
          <tr class="${f.id === this.synthPlayingId ? 'cm-midi-on' : ''}">
            <td width="28"><button class="cm-pbtn" data-cm-midi="${f.id}" title="Играть">&#9658;</button></td>
            <td><tt>${this.esc(f.file)}</tt></td>
            <td align="right">${f.bytes} байт</td>
            <td>${this.esc(f.motif)}</td>
            <td>${this.esc(f.author)}</td>
          </tr>`).join('')}
      </table>
      <p class="cm-small">Хотите добавить свой наигрыш? Пришлите .MID на <a href="mailto:webmaster@carman99.ru">webmaster@carman99.ru</a>, не больше 10 КБ.</p>`;
  }

  allGuestbook() {
    const seed = (this.data.guestbook || []).map(e => Object.assign({ user: false }, e));
    const user = this.loadUser().guestbook.map(e => Object.assign({ user: true }, e));
    return user.slice().reverse().concat(seed);
  }

  guestReply(text) {
    const low = String(text).toLowerCase();
    if (low.includes('титомир') || low.includes('богдан') || low.includes('дуэт')) {
      return 'Дуэт выступал с ноября 1989-го по май 1991 года, последний концерт был в Чернигове. Подробнее в разделе «История».';
    }
    if (low.includes('назад в будущее') || low.includes('ремикс')) {
      return 'Треклист и вкладыш для кассеты лежат в разделе «Альбомы». Пишите, какой ремикс понравился.';
    }
    if (low.includes('midi') || low.includes('миди')) {
      return 'Присылайте свой наигрыш на webmaster@carman99.ru, добавим в раздел MIDI.';
    }
    if (low.includes('танц') || low.includes('дэнс')) {
      return 'Все танцоры по годам собраны в разделе «Состав».';
    }
    return '';
  }

  addGuestbookEntry(entry) {
    const text = String(entry.text || '').trim();
    if (!text) return this.allGuestbook();
    const favs = (this.data.favAlbums || []).map(f => f[0]);
    const user = this.loadUser();
    user.guestbook.push({
      name: (String(entry.name || '').trim() || 'Гость').slice(0, 40),
      from: String(entry.from || '').trim().slice(0, 40),
      contact: String(entry.contact || '').trim().slice(0, 50),
      date: this.clock(),
      fav: favs.includes(entry.fav) ? entry.fav : '',
      text: text.slice(0, 700),
      reply: this.guestReply(text)
    });
    this.saveUser(user);
    return this.allGuestbook();
  }

  renderGuestbook() {
    const list = this.allGuestbook();
    const favName = id => ((this.data.favAlbums || []).find(f => f[0] === id) || [])[1] || '';
    return `
      <h1 class="cm-h1">Гостевая книга</h1>
      <p>Пишите, что слушаете, что ищете и что мы напутали. Вебмастер отвечает по вечерам.</p>
      <div class="cm-gb-form">
        <table cellspacing="0" cellpadding="3">
          <tr><td>Имя:</td><td><input type="text" id="cm-gb-name" size="26" maxlength="40"></td>
              <td>Город:</td><td><input type="text" id="cm-gb-from" size="20" maxlength="40"></td></tr>
          <tr><td>E-mail или ICQ:</td><td><input type="text" id="cm-gb-contact" size="26" maxlength="50"></td>
              <td>Любимый альбом:</td><td>
                <select id="cm-gb-fav">
                  <option value="">не скажу</option>
                  ${(this.data.favAlbums || []).map(([v, l]) => `<option value="${v}">${this.esc(l)}</option>`).join('')}
                </select></td></tr>
          <tr><td valign="top">Сообщение:</td><td colspan="3"><textarea id="cm-gb-text" rows="5" cols="62" maxlength="700"></textarea></td></tr>
          <tr><td></td><td colspan="3"><button class="cm-btn" data-cm-gb="1">Добавить запись</button></td></tr>
        </table>
      </div>
      <p class="cm-small">Записей: ${list.length}</p>
      ${list.map(e => `
        <div class="cm-gb-entry">
          <div class="cm-gb-head">
            <b>${this.esc(e.name)}</b>${e.from ? `, ${this.esc(e.from)}` : ''}
            ${e.contact ? `<span class="cm-small">(${this.esc(e.contact)})</span>` : ''}
            <span class="cm-gb-date">${this.esc(e.date)}</span>
          </div>
          ${e.fav ? `<div class="cm-small">Любимый альбом: ${this.esc(favName(e.fav))}</div>` : ''}
          <div class="cm-gb-text">${this.esc(e.text)}</div>
          ${e.reply ? `<div class="cm-gb-reply"><b>Вебмастер:</b> ${this.esc(e.reply)}</div>` : ''}
        </div>`).join('')}`;
  }

  articleText(art) {
    if (!art) return '';
    return [
      'КАР-МЭН \'99  http://www.carman99.ru',
      '='.repeat(64),
      `${art.date}  ${art.rubric}`,
      art.title,
      `Автор: ${art.author}`,
      '-'.repeat(64),
      art.lead,
      '',
      ...art.body.reduce((acc, p) => acc.concat([p, '']), []),
      '='.repeat(64)
    ].join('\r\n');
  }

  albumFile(a) {
    return `CARMAN_${a.id.toUpperCase().replace(/-/g, '_')}.TXT`;
  }

  jcardText(a) {
    if (!a) return '';
    const width = 60;
    const line = '+' + '-'.repeat(width) + '+';
    const row = s => '| ' + String(s).slice(0, width - 2).padEnd(width - 2, ' ') + ' |';
    const tracks = a.tracks.map(([t, d], i) => {
      const left = `${String(i + 1).padStart(2, ' ')}. ${t}`;
      return row(left.slice(0, width - 9).padEnd(width - 9, ' ') + d.padStart(7, ' '));
    });
    return [
      'ВКЛАДЫШ ДЛЯ КАССЕТЫ. ФАН-КЛУБ «КАР-МЭН \'99», http://www.carman99.ru',
      '',
      line,
      row(`КАР-МЭН  ${a.title}`),
      row(`${a.year}, ${a.label}`),
      line,
      ...tracks,
      line,
      ...a.credits.map(([k, v]) => row(`${k}: ${v}`)),
      row(`Вышел: ${a.released}`),
      line,
      '',
      'Печатать моноширинным шрифтом, отрезать по рамке.'
    ].join('\r\n');
  }

  docFor(spec) {
    const [type, id] = String(spec || '').split(':');
    if (type === 'article') {
      const art = this.article(id);
      return art ? { file: art.file, text: this.articleText(art) } : null;
    }
    if (type === 'album') {
      const a = this.album(id);
      return a ? { file: this.albumFile(a), text: this.jcardText(a) } : null;
    }
    return null;
  }

  saveDoc(spec) {
    const doc = this.docFor(spec);
    if (!doc) return null;
    if (typeof window !== 'undefined' && window.vfs && typeof window.vfs.writeFile === 'function') {
      window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], doc.file, doc.text);
    }
    return doc.file;
  }

  openDoc(spec) {
    const doc = this.docFor(spec);
    if (!doc) return null;
    if (typeof window !== 'undefined' && window.appNotepad) {
      window.appNotepad.open(doc.file, doc.text);
    }
    return doc.file;
  }

  playSynth(id) {
    const files = this.data.midi || [];
    const tune = files.find(f => f.id === id) || files[0];
    this.stopSynth();
    if (!tune) return null;
    this.synthPlayingId = tune.id;
    if (typeof window === 'undefined') return tune;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return tune;
    try {
      if (!this._audioCtx) this._audioCtx = new AudioCtx();
      if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
      const ctx = this._audioCtx;
      const stepMs = Math.round(60000 / tune.bpm / 2);
      let step = 0;
      const tick = () => {
        if (this.synthPlayingId !== tune.id) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = step % 2 === 0 ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(tune.notes[step % tune.notes.length], now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepMs / 1000 * 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + stepMs / 1000 * 0.92);
        if (step % 2 === 0) {
          const kick = ctx.createOscillator();
          const kg = ctx.createGain();
          kick.type = 'sine';
          kick.frequency.setValueAtTime(115, now);
          kick.frequency.exponentialRampToValueAtTime(42, now + 0.11);
          kg.gain.setValueAtTime(0.09, now);
          kg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          kick.connect(kg);
          kg.connect(ctx.destination);
          kick.start(now);
          kick.stop(now + 0.13);
        }
        step += 1;
        if (step >= 32) this.stopSynth();
      };
      tick();
      this._synthTimer = setInterval(tick, stepMs);
    } catch (e) {}
    return tune;
  }

  stopSynth() {
    if (this._synthTimer) {
      clearInterval(this._synthTimer);
      this._synthTimer = null;
    }
    if (this._flapTimer) {
      clearInterval(this._flapTimer);
      this._flapTimer = null;
    }
    this.synthPlayingId = null;
  }

  runFlaps(root) {
    if (this.flapDone || typeof root.querySelectorAll !== 'function') return;
    const cells = Array.from(root.querySelectorAll('.cm-flap[data-c]'));
    if (!cells.length) return;
    this.flapDone = true;
    const reduce = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const pool = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ0123456789';
    const left = cells.map((el, i) => 3 + ((i * 7) % 11));
    cells.forEach(el => { el.textContent = pool[Math.floor(Math.random() * pool.length)]; });
    let tick = 0;
    this._flapTimer = setInterval(() => {
      tick += 1;
      let busy = false;
      cells.forEach((el, i) => {
        if (tick >= left[i]) {
          el.textContent = el.dataset.c;
        } else {
          busy = true;
          el.textContent = pool[(tick * 5 + i) % pool.length];
        }
      });
      if (!busy) {
        clearInterval(this._flapTimer);
        this._flapTimer = null;
      }
    }, 70);
  }

  attachEvents(win, container, ie) {
    const root = (typeof container.querySelector === 'function' && container.querySelector('.cm-site')) || container;
    const path = (root.dataset && root.dataset.cmPath) || '/';
    const sound = kind => {
      if (typeof window !== 'undefined' && window.soundSys && typeof window.soundSys[kind] === 'function') window.soundSys[kind]();
    };
    const rerender = () => {
      const top = container.scrollTop || 0;
      ie.renderPage(win, ie.currentUrl);
      container.scrollTop = top;
    };
    const value = sel => {
      const el = typeof root.querySelector === 'function' ? root.querySelector(sel) : null;
      return el ? el.value : '';
    };
    const say = text => {
      this.notice = { path, text };
    };

    this.runFlaps(root);

    if (typeof root.addEventListener !== 'function') return;
    root.addEventListener('click', e => {
      const t = e.target && typeof e.target.closest === 'function'
        ? e.target.closest('[data-cm-enc],[data-cm-midi],[data-cm-stop],[data-cm-poll],[data-cm-notepad],[data-cm-save],[data-cm-comment],[data-cm-gb],[data-cm-clippy]')
        : null;
      if (!t) return;
      const d = t.dataset;
      if (d.cmEnc) {
        this.encoding = ['win1251', 'koi8', 'translit'].includes(d.cmEnc) ? d.cmEnc : 'win1251';
        sound('playClick');
        rerender();
      } else if (d.cmMidi) {
        this.playSynth(d.cmMidi);
        rerender();
      } else if (d.cmStop) {
        this.stopSynth();
        sound('playClick');
        rerender();
      } else if (d.cmPoll) {
        const checked = typeof root.querySelector === 'function' ? root.querySelector('input[name="cm-poll"]:checked') : null;
        this.savePollVote(checked ? checked.value : '');
        say('Спасибо, голос учтён.');
        sound('playDing');
        rerender();
      } else if (d.cmNotepad) {
        this.openDoc(d.cmNotepad);
      } else if (d.cmSave) {
        const file = this.saveDoc(d.cmSave);
        if (file) {
          say(`Файл ${file} сохранён в папку «Мои документы».`);
          sound('playDing');
          rerender();
        }
      } else if (d.cmComment) {
        if (!value('#cm-c-text').trim()) return;
        this.addComment(d.cmComment, value('#cm-c-name'), value('#cm-c-text'));
        say('Отклик добавлен.');
        sound('playDing');
        rerender();
      } else if (d.cmGb) {
        if (!value('#cm-gb-text').trim()) {
          say('Напишите сообщение, пустую запись не сохранить.');
          rerender();
          return;
        }
        this.addGuestbookEntry({
          name: value('#cm-gb-name'),
          from: value('#cm-gb-from'),
          contact: value('#cm-gb-contact'),
          fav: value('#cm-gb-fav'),
          text: value('#cm-gb-text')
        });
        say('Запись добавлена в гостевую книгу.');
        sound('playDing');
        rerender();
      } else if (d.cmClippy) {
        if (typeof window !== 'undefined' && window.appClippy) {
          window.appClippy.show();
          window.appClippy._lastIePageKey = null;
          window.appClippy.onNavigateIE(ie.currentUrl || this.baseUrl, 'carman', 'Кар-Мэн \'99');
        }
      }
    });
  }
}

window.carmanSite = new CarManSite();
