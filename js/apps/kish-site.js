class KishSite {
  constructor() {
    this.baseUrl = 'http://www.kish99.ru';
    this.userKey = 'win98_kish_user_v1';
    this.hitKey = 'win98_kish_hits_v1';
    this.seenKey = 'win98_kish_seen_v1';
    this.seen = new Set();
    this.encoding = 'win1251';
    this.transposeSemis = 0;
    this.synthPlayingId = null;
    this._synthTimer = null;
    this._audioCtx = null;
    this.notice = null;
    this.hitCount = 0;
    this.initHits();
    this.loadSeen();
  }

  loadSeen() {
    const ls = this.store();
    try {
      const list = ls ? JSON.parse(ls.getItem(this.seenKey)) : null;
      if (Array.isArray(list)) list.forEach(key => this.seen.add(String(key)));
    } catch (e) {}
  }

  seenFor(path) {
    return String(path || '').toLowerCase().replace(/\/+$/, '');
  }

  markSeen(url) {
    const noProto = String(url || this.baseUrl).replace(/^[a-z]+:\/{2}/i, '');
    const slash = noProto.indexOf('/');
    const key = this.seenFor(slash >= 0 ? noProto.slice(slash).replace(/#.*$/, '') : '');
    if (this.seen.has(key)) return;
    this.seen.add(key);
    const ls = this.store();
    try {
      if (ls) ls.setItem(this.seenKey, JSON.stringify(Array.from(this.seen)));
    } catch (e) {}
  }

  get data() {
    return (typeof window !== 'undefined' && window.kishData) || {};
  }

  store() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) {}
    return null;
  }

  initHits() {
    const ls = this.store();
    let count = 18420;
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
      count = 18421;
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
    return this.emptyUser();
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
    const seen = this.seen.has(this.seenFor(path)) ? 'ks-seen' : '';
    const classes = [cls, seen].filter(Boolean).join(' ');
    return `<a${classes ? ` class="${classes}"` : ''} data-url="${this.url(path)}">${label}</a>`;
  }

  rule() {
    return '<div class="ks-rule">&nbsp;</div>';
  }

  heading(label, gifName) {
    return `<h2 class="ks-h2">${gifName ? `${this.gif(gifName)} ` : ''}${label}</h2>`;
  }

  clock() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${this.data.siteDay} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  album(id) {
    return (this.data.albums || []).find(a => a.id === id) || null;
  }

  tale(id) {
    return (this.data.tales || []).find(t => t.id === id) || null;
  }

  article(id) {
    return (this.data.articles || []).find(a => a.id === id) || null;
  }

  songTab(id) {
    return (this.data.songbook || []).find(s => s.id === id) || null;
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
      '/tales': 'tales',
      '/bestiary': 'tales',
      '/map': 'tales',
      '/chords': 'chords',
      '/tabs': 'chords',
      '/lineup': 'lineup',
      '/members': 'lineup',
      '/midi': 'midi',
      '/guestbook': 'guestbook'
    };
    const page = routes[path] || '404';
    return { page, path, params };
  }

  getPageTitle(url) {
    const route = this.parseRoute(url);
    const titles = {
      home: 'Король и Шут \'99 :: Трактир «Старая Сказка»',
      news: 'Король и Шут \'99 :: новости и концерты',
      albums: 'Король и Шут \'99 :: альбомы и бутлеги',
      tales: 'Король и Шут \'99 :: карта сказок и бестиарий',
      chords: 'Король и Шут \'99 :: дворовый песенник и аккорды',
      lineup: 'Король и Шут \'99 :: состав 1988–1999',
      midi: 'Король и Шут \'99 :: панк-шарманка MIDI',
      guestbook: 'Король и Шут \'99 :: книга жалоб Трактирщика'
    };
    if (route.page === 'article') {
      const art = this.article(route.params.id);
      return art ? `Король и Шут '99 :: ${art.title}` : '404 Not Found';
    }
    if (route.page === 'album') {
      const alb = this.album(route.params.id);
      return alb ? `Король и Шут '99 :: ${alb.title} (${alb.year})` : '404 Not Found';
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
      tales: () => this.renderTales(route.params.place),
      chords: () => this.renderChords(route.params.id),
      lineup: () => this.renderLineup(route.params.id),
      midi: () => this.renderMidi(),
      guestbook: () => this.renderGuestbook()
    };
    const body = pages[route.page] ? pages[route.page]() : null;
    if (body === null) return this.render404(route.path);
    const html = `
      <div class="ks-site" data-ks-path="${this.esc(route.path)}">

        <table class="ks-shell" cellspacing="0" cellpadding="0" align="center">
          <tr><td colspan="2">${this.renderMasthead()}</td></tr>
          <tr><td colspan="2">${this.renderTicker()}</td></tr>
          <tr>
            <td class="ks-left" valign="top">${this.renderMenu(route.page)}</td>
            <td class="ks-body" valign="top">${this.renderNotice(route.path)}${body}${this.renderTop()}</td>
          </tr>
          <tr><td colspan="2">${this.renderFooter()}</td></tr>
        </table>
      </div>`;
    this.markSeen(url);
    return this.encodeHtml(html);
  }

  render404(path) {
    return `
      <div class="ks-site ks-raw">
        <h1>Not Found</h1>
        <p>The requested URL ${this.esc(path)} was not found on this server.</p>
        <hr>
        <address>Apache/1.3.9 Server at www.kish99.ru Port 80</address>
      </div>`;
  }

  renderNotice(path) {
    if (!this.notice || this.notice.path !== path) return '';
    const text = this.notice.text;
    this.notice = null;
    return `<div class="ks-notice">${this.gif('check')} ${this.esc(text)}</div>`;
  }

  renderMasthead() {
    return `
      <a data-url="${this.url()}" class="ks-mast-link">
        <svg class="ks-mast" width="760" height="124" viewBox="0 0 760 124" role="img" aria-label="Король и Шут. Трактир Старая Сказка, 1988–1999">
          <rect width="760" height="124" fill="#000000"/>
          <rect x="4" y="4" width="752" height="116" fill="#330000" stroke="#cc9933" stroke-width="2"/>
          <rect x="8" y="8" width="744" height="108" fill="none" stroke="#663300" stroke-width="1"/>
          <g transform="translate(64 64)">
            <circle r="38" fill="#000000" stroke="#cc9933" stroke-width="2"/>
            <path d="M -26 -4 Q -32 -34 -8 -18 Q 0 -38 8 -18 Q 32 -34 26 -4 Z" fill="#cc0000" stroke="#ffcc00" stroke-width="2"/>
            <circle cx="-28" cy="-24" r="4" fill="#ffcc00"/>
            <circle cx="0" cy="-34" r="4" fill="#ffcc00"/>
            <circle cx="28" cy="-24" r="4" fill="#ffcc00"/>
            <ellipse cx="0" cy="8" rx="20" ry="18" fill="#ffffcc" stroke="#000000" stroke-width="2"/>
            <polygon points="-10,2 -4,2 -7,8" fill="#000000"/>
            <polygon points="4,2 10,2 7,8" fill="#000000"/>
            <path d="M -12 14 Q 0 24 12 14" fill="none" stroke="#990000" stroke-width="3"/>
          </g>
          <g font-family="Georgia, 'Times New Roman', serif" font-weight="bold">
            <text x="122" y="58" font-size="48" fill="#000000">КОРОЛЬ И ШУТ</text>
            <text x="119" y="55" font-size="48" fill="#ffcc00" stroke="#990000" stroke-width="1.5">КОРОЛЬ И ШУТ</text>
            <text x="122" y="82" font-family="Verdana, Arial, sans-serif" font-size="13" fill="#ffffcc">ТРАКТИР «СТАРАЯ СКАЗКА» :: ПЕТЕРБУРГСКИЙ ПАНК-АРХИВ</text>
            <text x="122" y="102" font-family="'Courier New', monospace" font-size="11" fill="#cc9933">Хроники 1988–1999 • «Камнем по голове» • «Акустический альбом» • «Ели мясо мужики»</text>
          </g>
          <g transform="translate(684 62)">
            <rect x="-48" y="-38" width="84" height="76" fill="#000000" stroke="#cc9933" stroke-width="1"/>
            <text x="-6" y="-18" text-anchor="middle" font-family="Verdana, sans-serif" font-size="10" font-weight="bold" fill="#ffcc00">СПб '99</text>
            <text x="-6" y="0" text-anchor="middle" font-family="'Courier New', monospace" font-size="10" fill="#ffffcc">ПАНКИ ХОЙ!</text>
            <text class="ks-blink" x="-6" y="18" text-anchor="middle" font-family="Verdana, sans-serif" font-size="9" fill="#ff3333">обновлено</text>
            <text x="-6" y="30" text-anchor="middle" font-family="'Courier New', monospace" font-size="10" fill="#ffffff">${this.esc(this.data.siteDay)}</text>
          </g>
        </svg>
      </a>`;
  }

  navItems() {
    return [
      ['home', 'Трактир', ''],
      ['news', 'Новости', '/news'],
      ['albums', 'Альбомы', '/albums'],
      ['tales', 'Карта сказок', '/tales'],
      ['chords', 'Аккорды', '/chords'],
      ['lineup', 'Состав', '/lineup'],
      ['midi', 'MIDI', '/midi'],
      ['guestbook', 'Гостевая', '/guestbook']
    ];
  }

  renderTicker() {
    const arts = (this.data.articles || []).slice(0, 3);
    const text = [`${this.data.siteDayLong}. ПАНКИ ХОЙ!`]
      .concat(arts.map(a => `${a.date} ${a.title}`))
      .concat(['Новая пластинка «Герои и злодеи» выйдет в начале 2000 года'])
      .join(' *** ');
    return `<div class="ks-ticker"><marquee scrollamount="3" scrolldelay="60">*** ${this.esc(text)} ***</marquee></div>`;
  }

  renderMenu(page) {
    const active = { article: 'news', album: 'albums' }[page] || page;
    const enc = [['win1251', 'WIN'], ['koi8', 'KOI'], ['translit', 'LAT']].map(([key, label]) =>
      this.encoding === key ? `<b>${label}</b>` : `<a data-ks-enc="${key}">${label}</a>`).join(' | ');
    const digits = String(this.hitCount).padStart(6, '0').split('').map(d => `<span>${d}</span>`).join('');
    return `
      <div class="ks-menu-title">МЕНЮ ТРАКТИРА</div>
      <div class="ks-menu">
        ${this.navItems().map(([key, label, path]) => active === key
          ? `<div class="ks-menu-on">${label}</div>`
          : this.link(path, label)).join('')}
      </div>
      <div class="ks-left-box">
        Кодировка:<br>${enc}
      </div>
      <div class="ks-left-box">
        Вы — путник №<br>
        <div class="ks-counter" title="Путников с 14.04.1999">${digits}</div>
      </div>
      <div class="ks-left-box">
        ${this.gif('construct', 2)}<br>
        <b class="ks-blink">Раздел «Фотоальбом» строится!</b><br>
        Сканер у вебмастера пока в ремонте
      </div>
      <div class="ks-left-box">
        <a data-ks-fav="1">Запомнить адрес трактира</a><br>
        <a href="mailto:webmaster@kish99.ru">Написать вебмастеру</a>
      </div>`;
  }

  renderTop() {
    return `<p class="ks-top">[ <a data-ks-top="1">в начало страницы</a> ]</p>`;
  }

  renderFooter() {
    const ring = typeof window !== 'undefined' && window.retroSites && typeof window.retroSites.renderWebRing === 'function'
      ? window.retroSites.renderWebRing(this.baseUrl)
      : '';
    return `
      <div class="ks-footer">
        <div class="ks-footer-links">
          [ ${this.navItems().map(([, label, path]) => this.link(path, label)).join(' | ')} ]
        </div>
        <div class="ks-footer-best">
          ${this.gif('star')} Сайт лучше всего виден <b>в Microslop Internet Explorer 5.0</b>, разрешение <b>800x600</b>, 256 цветов ${this.gif('star')}
        </div>
        <table class="ks-footer-row" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              ${this.gif('home')} Страница обновлена ${this.esc(this.data.siteDay)}<br>
              Все права не защищены, берите на здоровье
            </td>
            <td class="ks-buttons">
              <a class="ks-88" data-url="http://www.rambler98.ru">RAMBLER<br>TOP 100</a>
              <a class="ks-88 ks-88-mz" data-url="http://www.muzzone98.ru">МузЗона<br>'98</a>
              <a class="ks-88 ks-88-pr" data-url="http://www.prodigy99.ru">PRODIGY<br>BUNKER '99</a>
              <a class="ks-88 ks-88-cm" data-url="http://www.carman99.ru">КАР-МЭН<br>КЛУБ '99</a>
            </td>
          </tr>
        </table>
        <p>Неофициальный питерский узел группы «Король и Шут» («Трактир „Старая Сказка“»). Вебмастер: ${this.esc(this.data.webmaster)}, <a href="mailto:webmaster@kish99.ru">webmaster@kish99.ru</a>. Страницы собраны вручную в Блокноте под модем 33.6K. Большое спасибо за визит, заходите ещё!</p>
        <p class="ks-small">Все тексты, аккорды и выходные данные сверены по кассетным вкладышам «КузьмитчЪ» и «ОРТ-Рекордс». Заметили неточность в подборе? Черкните в <a data-url="${this.url('/guestbook')}">гостевую трактира</a>. <a data-ks-clippy="1">Позвать Скрепыша</a></p>
        ${ring}
      </div>`;
  }

  renderTavernMenu() {
    const rows = (this.data.tavernBoard || []).map(r => {
      const alb = this.album(r.albumId);
      return `
        <tr>
          <td width="24" align="center" class="ks-tb-no">${r.no}</td>
          <td><b>${this.link(`/tales?place=${r.place}`, this.esc(r.title))}</b></td>
          <td>${alb ? this.link(`/album?id=${alb.id}`, this.esc(alb.title)) : ''}</td>
          <td width="46" align="center">${r.year}</td>
          <td width="46" align="right" class="ks-tb-time">${this.esc(r.time)}</td>
          <td><span class="ks-small">${this.esc(r.note)}</span></td>
        </tr>`;
    }).join('');
    return `
      <div class="ks-board">
        <div class="ks-board-title">
          <span class="ks-board-right">${this.link('/chords', 'аккорды для гитары')} | ${this.link('/tales', 'карта сказок')}</span>
          Доска былей Трактирщика: главные сказки 1993–1999 годов
        </div>
        <table class="ks-board-table" width="100%" cellspacing="0" cellpadding="3">
          <tr>
            <th>№</th>
            <th align="left">Быль / Песня</th>
            <th align="left">Кассета</th>
            <th>Год</th>
            <th align="right">Время</th>
            <th align="left">Примета</th>
          </tr>
          ${rows}
        </table>
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
        : `<input type="radio" name="ks-poll" value="${o.key}"${i === 0 ? ' checked' : ''}>`;
      return `
        <tr>
          <td width="14" valign="top">${input}</td>
          <td>${this.esc(o.label)}</td>
          <td width="34" align="right" valign="top">${pct}%</td>
        </tr>
        <tr><td></td><td colspan="2"><div class="ks-bar"><div style="width:${pct}%"></div></div></td></tr>`;
    }).join('');
    return `
      <div class="ks-side-box">
        <div class="ks-side-title">Опрос у стойки</div>
        <p><b>${this.esc((this.data.poll || {}).question)}</b></p>
        <table class="ks-poll" width="100%" cellspacing="0" cellpadding="1">${rows}</table>
        ${poll.voted
          ? `<p class="ks-small">Ваш голос учтён. Всего голосов: ${poll.total}.</p>`
          : `<p><button class="ks-btn" data-ks-poll="1">Голосовать</button> <span class="ks-small">голосов: ${poll.total}</span></p>`}
      </div>`;
  }

  renderHome() {
    const arts = (this.data.articles || []).slice(0, 5);
    const lead = arts[0];
    const gb = this.allGuestbook().slice(0, 2);
    return `
      <div class="ks-welcome">
        <div class="ks-welcome-title">${this.gif('flame', 2)} Будь как дома, путник! ${this.gif('flame', 2)}</div>
        <div class="ks-welcome-day">${this.esc(this.data.siteDayLong)}</div>
        <p>В 1999 году питерская группа «Король и Шут» выпустила «Акустический альбом» и концертный боевик «Ели мясо мужики» из клуба «Спартак», впервые собрала Дворец спорта «Юбилейный» и сейчас дописывает на Фонтанке новую пластинку «Герои и злодеи». ${this.link(`/article?id=${lead.id}`, 'Подробности из студии')}.</p>
      </div>
      ${this.renderTavernMenu()}
      ${this.rule()}
      <table class="ks-cols" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="ks-col-main" valign="top">
            ${this.heading('Хроника и новости 1999 года', 'news')}
            ${arts.map((a, i) => `
              <div class="ks-news-item">
                <div class="ks-news-date">${this.esc(a.date)} <span class="ks-rubric">${this.esc(a.rubric)}</span> ${i === 0 ? this.gif('new') : ''}</div>
                <div class="ks-news-title">${this.link(`/article?id=${a.id}`, this.esc(a.title))}</div>
                <div class="ks-news-lead">${this.esc(a.lead)}</div>
              </div>`).join('')}
            <p>${this.link('/news', 'Весь архив новостей')}</p>
          </td>
          <td class="ks-col-side" valign="top">
            ${this.renderPoll()}
            <div class="ks-side-box">
              <div class="ks-side-title">Записи в книге жалоб</div>
              ${gb.map(g => `
                <p><b>${this.esc(g.name)}</b>, ${this.esc(g.from)}:<br>${this.esc(g.text.length > 110 ? g.text.slice(0, 110) + '…' : g.text)}</p>`).join('')}
              <p>${this.link('/guestbook', 'Оставить запись в трактире')}</p>
            </div>
            <div class="ks-side-box">
              <div class="ks-side-title">Разделы узла</div>
              <p>${this.gif('star')} ${this.link('/albums', 'Альбомы и бутлеги')}: ${(this.data.albums || []).length} релизов с вкладышами<br>
              ${this.gif('star')} ${this.link('/tales', 'Карта сказок')}: ${(this.data.tales || []).length} мест и героев<br>
              ${this.gif('star')} ${this.link('/chords', 'Песенник')}: ${(this.data.songbook || []).length} разборов с транспонированием<br>
              ${this.gif('star')} ${this.link('/midi', 'Панк-шарманка')}: мелодии .MID</p>
            </div>
          </td>
        </tr>
      </table>`;
  }

  renderNews(params) {
    const all = this.data.articles || [];
    const rubrics = Array.from(new Set(all.map(a => a.rubric)));
    const rubric = rubrics.includes(params.rubric) ? params.rubric : '';
    const list = rubric ? all.filter(a => a.rubric === rubric) : all;
    const filter = [rubric ? this.link('/news', 'все') : '<b>все</b>']
      .concat(rubrics.map(r => r === rubric ? `<b>${this.esc(r)}</b>` : this.link(`/news?rubric=${encodeURIComponent(r)}`, this.esc(r))))
      .join(' | ');
    return `
      <h1 class="ks-h1">Новости и отчёты с концертов</h1>
      <p class="ks-filter">Рубрика: ${filter}</p>
      <table class="ks-archive" width="100%" cellspacing="0" cellpadding="4">
        ${list.map(a => `
          <tr>
            <td width="82" valign="top" class="ks-news-date">${this.esc(a.date)}</td>
            <td valign="top">
              <span class="ks-rubric">${this.esc(a.rubric)}</span>
              ${this.link(`/article?id=${a.id}`, `<b>${this.esc(a.title)}</b>`)}<br>
              ${this.esc(a.lead)}
              <span class="ks-small">(${this.esc(a.author)}, откликов: ${this.comments(a.id).length})</span>
            </td>
          </tr>`).join('')}
      </table>`;
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
    list.push({ author: (String(author || '').trim() || 'Путник').slice(0, 40), date: this.clock(), text: clean.slice(0, 600) });
    user.comments[articleId] = list;
    this.saveUser(user);
    return this.comments(articleId);
  }

  renderArticle(id) {
    const art = this.article(id);
    if (!art) return null;
    const list = this.comments(art.id);
    const others = (this.data.articles || []).filter(a => a.id !== art.id).slice(0, 4);
    return `
      <p class="ks-crumbs">${this.link('', 'Трактир')} &gt; ${this.link('/news', 'Новости')} &gt; ${this.esc(art.rubric)}</p>
      <div class="ks-scroll">
        <div class="ks-scroll-meta">
          <b>Дата:</b> ${this.esc(art.date)} &nbsp;|&nbsp; <b>Рубрика:</b> ${this.esc(art.rubric)} &nbsp;|&nbsp; <b>Автор:</b> ${this.esc(art.author)}
        </div>
        <h1 class="ks-h1">${this.esc(art.title)}</h1>
        <p class="ks-scroll-lead"><b>${this.esc(art.lead)}</b></p>
        ${art.body.map(p => `<p>${this.esc(p)}</p>`).join('')}
        <p class="ks-tools">
          <button class="ks-btn" data-ks-notepad="article:${art.id}">Открыть в Блокноте</button>
          <button class="ks-btn" data-ks-save="article:${art.id}">Сохранить ${this.esc(art.file)}</button>
        </p>
      </div>
      ${this.heading(`Отклики путников (${list.length})`, 'pencil')}
      ${list.length ? list.map(c => `
        <div class="ks-comment">
          <b>${this.esc(c.author)}</b> <span class="ks-small">${this.esc(c.date)}</span><br>
          ${this.esc(c.text)}
        </div>`).join('') : '<p>Откликов пока нет.</p>'}
      <table class="ks-form" cellspacing="0" cellpadding="3">
        <tr><td>Прозвище:</td><td><input type="text" id="ks-c-name" size="24" maxlength="40" value=""></td></tr>
        <tr><td valign="top">Отклик:</td><td><textarea id="ks-c-text" rows="4" cols="52" maxlength="600"></textarea></td></tr>
        <tr><td></td><td><button class="ks-btn" data-ks-comment="${art.id}">Отправить отклик</button></td></tr>
      </table>
      ${this.heading('Другие записи в летописи', 'book')}
      <ul class="ks-list">
        ${others.map(o => `<li>${this.esc(o.date)} — ${this.link(`/article?id=${o.id}`, this.esc(o.title))}</li>`).join('')}
      </ul>`;
  }

  kindLabel(kind) {
    return {
      studio: 'Официальные номерные альбомы (1996–1999)',
      live: 'Концертные записи (1999)',
      bootleg: 'Ранние питерские магнитоальбомы (1993–1995)'
    }[kind] || kind;
  }

  renderAlbums() {
    const albums = this.data.albums || [];
    const kinds = ['studio', 'live', 'bootleg'];
    return `
      <h1 class="ks-h1">Полка кассет и бутлегов (1993–1999)</h1>
      <p>Здесь собраны все студийные альбомы, концертный «Ели мясо мужики» и редкие доальбомные кассеты, которые переписывали в питерских общагах на двухкассетниках. Нажмите на корешок, чтобы открыть треклист и распечатать вкладыш для своей аудиокассеты.</p>
      <div class="ks-shelf">
        ${kinds.map(kind => {
          const list = albums.filter(a => a.kind === kind);
          if (!list.length) return '';
          return `
            <div class="ks-shelf-label">${this.esc(this.kindLabel(kind))}</div>
            ${list.map(a => `
              <a class="ks-spine" data-url="${this.url(`/album?id=${a.id}`)}" style="background-color:${a.jcard}">
                <span class="ks-spine-year">${this.esc(a.year)}</span>
                <span class="ks-spine-title">КОРОЛЬ И ШУТ :: ${this.esc(a.title)}</span>
                <span class="ks-spine-label">${this.esc(a.label)}</span>
              </a>`).join('')}`;
        }).join('')}
      </div>
      ${this.heading('Видеокассеты VHS и клипы в эфире (1997–1999)', 'vhs')}
      <ol class="ks-list">
        ${(this.data.videos || []).map(([t, note]) => `<li><b>${this.esc(t)}</b> — <span class="ks-small">${this.esc(note)}</span></li>`).join('')}
      </ol>`;
  }

  trackTale(title) {
    const clean = title.replace(/\s*\(.*$/, '').toLowerCase();
    return (this.data.tales || []).find(p => p.songs.some(([t]) => t.toLowerCase() === clean)) || null;
  }

  renderJcardFront(a) {
    return `
      <svg width="180" height="200" viewBox="0 0 180 200" aria-hidden="true">
        <rect width="180" height="200" fill="${a.jcard}"/>
        <rect x="6" y="6" width="168" height="148" fill="#000000" stroke="#ffcc00" stroke-width="2"/>
        <text x="90" y="28" text-anchor="middle" font-family="Georgia, serif" font-size="16" font-weight="bold" fill="#ffcc00">КОРОЛЬ И ШУТ</text>
        <path d="M 56 88 Q 52 58 76 74 Q 90 52 104 74 Q 128 58 124 88 Z" fill="#cc0000" stroke="#ffcc00" stroke-width="2"/>
        <ellipse cx="90" cy="104" rx="22" ry="18" fill="#ffffcc"/>
        <circle cx="82" cy="100" r="3" fill="#000000"/>
        <circle cx="98" cy="100" r="3" fill="#000000"/>
        <path d="M 78 112 Q 90 122 102 112" fill="none" stroke="#990000" stroke-width="2"/>
        <rect x="0" y="160" width="180" height="40" fill="#ffffcc"/>
        <text x="8" y="177" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#000000">${this.esc(a.title.length > 24 ? a.title.slice(0, 23) + '…' : a.title)}</text>
        <text x="8" y="193" font-family="Arial, sans-serif" font-size="10" fill="#330000">${this.esc(a.year)} • ${this.esc(a.label.split('/')[0].trim())}</text>
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
      <p class="ks-crumbs">${this.link('', 'Трактир')} &gt; ${this.link('/albums', 'Альбомы')} &gt; ${this.esc(a.title)}</p>
      <h1 class="ks-h1">${this.esc(a.title)} <span class="ks-h1-year">(${this.esc(a.year)})</span></h1>
      <table class="ks-jcard" cellspacing="0" cellpadding="0">
        <tr>
          <td class="ks-jcard-back" valign="top">
            <div class="ks-jcard-head">Кассетный вкладыш для печати (MC J-Card)</div>
            <table cellspacing="0" cellpadding="1" class="ks-jcard-credits">
              ${a.credits.map(([k, v]) => `<tr><td valign="top"><b>${this.esc(k)}:</b></td><td>${this.esc(v)}</td></tr>`).join('')}
            </table>
            <p class="ks-small">Сверстано под стандартную коробку аудиокассеты. Вырезать по внешней рамке, согнуть по корешку.</p>
          </td>
          <td class="ks-jcard-spine" style="background-color:${a.jcard}">
            <svg width="26" height="200" viewBox="0 0 26 200" aria-hidden="true">
              <text transform="translate(18 194) rotate(-90)" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">КиШ :: ${this.esc(a.title.length > 22 ? a.title.slice(0, 21) + '…' : a.title)}</text>
            </svg>
          </td>
          <td class="ks-jcard-front">${this.renderJcardFront(a)}</td>
        </tr>
      </table>
      <table class="ks-cols" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="ks-col-main" valign="top">
            ${this.heading('Треклист', 'note')}
            <table class="ks-tracks" width="100%" cellspacing="0" cellpadding="2">
              ${a.tracks.map(([t, d], i) => {
                const tale = this.trackTale(t);
                return `
                  <tr>
                    <td width="22" align="right">${i + 1}.</td>
                    <td>${this.esc(t)}</td>
                    <td width="86">${tale ? this.link(`/tales?place=${tale.id}`, 'в бестиарии') : ''}</td>
                    <td width="42" align="right">${this.esc(d)}</td>
                  </tr>`;
              }).join('')}
            </table>
            <p>${this.esc(a.note)}</p>
          </td>
          <td class="ks-col-side" valign="top">
            <div class="ks-side-box">
              <div class="ks-side-title">Паспорт релиза</div>
              <p><b>Вышел:</b> ${this.esc(a.released)}<br>
              <b>Лейбл:</b> ${this.esc(a.label)}<br>
              <b>Носители:</b> ${this.esc(a.formats)}<br>
              <b>Запись:</b> ${this.esc(a.recorded)}</p>
            </div>
            <p><button class="ks-btn" data-ks-notepad="album:${a.id}">Вкладыш в Блокнот</button></p>
            <p><button class="ks-btn" data-ks-save="album:${a.id}">Сохранить на диск</button></p>
          </td>
        </tr>
      </table>
      <p class="ks-pager">
        ${prev ? this.link(`/album?id=${prev.id}`, `&lt;&lt; ${this.esc(prev.title)}`) : ''}
        ${prev && next ? ' | ' : ''}
        ${next ? this.link(`/album?id=${next.id}`, `${this.esc(next.title)} &gt;&gt;`) : ''}
      </p>`;
  }

  renderForestAscii(selectedId) {
    const m = this.data.forestMap;
    const pins = {};
    (this.data.tales || []).forEach(p => {
      pins[`${p.row}:${p.col}`] = p;
    });
    const lines = m.rows.map((line, r) => {
      let out = '';
      for (let c = 0; c < line.length; c++) {
        const p = pins[`${r}:${c}`];
        if (p) {
          const cls = p.id === selectedId ? 'ks-pin ks-pin-on' : 'ks-pin';
          out += `<a class="${cls}" data-url="${this.url(`/tales?place=${p.id}`)}" title="${this.esc(p.name)}">${p.mark}</a>`;
          continue;
        }
        const ch = line[c];
        if (ch === '#') out += '<span class="ks-trees">▓</span>';
        else if (ch === '^') out += '<span class="ks-hills">▲</span>';
        else out += '<span class="ks-mist">·</span>';
      }
      return out;
    });
    return `<pre class="ks-map">${lines.join('\n')}</pre>`;
  }

  renderTales(placeId) {
    const tales = this.data.tales || [];
    const sel = this.tale(placeId) || tales[0];
    const detail = sel ? `
      <div class="ks-tale-card">
        <div class="ks-tale-mark">${sel.mark}</div>
        <div class="ks-tale-body">
          <b>${this.esc(sel.name)}</b> — <i>${this.esc(sel.hero)}</i><br>
          <p>${this.esc(sel.desc)}</p>
          <div><b>Песни об этом месте:</b>
            ${sel.songs.map(([t, aid]) => {
              const a = this.album(aid);
              return `«${this.esc(t)}» ${a ? `(${this.link(`/album?id=${a.id}`, this.esc(a.title))}, ${this.esc(a.year)})` : ''}`;
            }).join(' • ')}
            ${sel.tabId ? ` | ${this.link(`/chords?id=${sel.tabId}`, 'Открыть аккорды')}` : ''}
          </div>
        </div>
      </div>` : '';
    return `
      <h1 class="ks-h1">Карта Сказочного Леса и Бестиарий</h1>
      <p>Все песни «Короля и Шута» складываются в единый сказочный край: от Избушки Лесника и Трактира Конюха до Покоев Колдуна и Утёса над морем. Нажмите на букву на карте или выберите локацию в таблице ниже.</p>
      <div class="ks-map-box">${this.renderForestAscii(sel ? sel.id : '')}</div>
      ${detail}
      <table class="ks-legend" width="100%" cellspacing="0" cellpadding="3">
        <tr><th width="26">Знак</th><th align="left">Место на карте</th><th align="left">Персонажи</th><th align="left">Песни</th></tr>
        ${tales.map(t => `
          <tr class="${sel && t.id === sel.id ? 'ks-legend-on' : ''}">
            <td align="center"><b class="ks-mark">${t.mark}</b></td>
            <td>${this.link(`/tales?place=${t.id}`, this.esc(t.name))}</td>
            <td>${this.esc(t.hero)}</td>
            <td>${t.songs.map(([s]) => this.esc(s)).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</td>
          </tr>`).join('')}
      </table>`;
  }

  transposeChordToken(token, semis) {
    if (!semis) return token;
    const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
    const alias = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'A#': 'Bb', 'H': 'B' };
    return token.replace(/\b([A-GH])(#|b)?(m|7|maj7|sus4|dim)?\b/g, (m, root, acc, suf) => {
      const key = root + (acc || '');
      const norm = alias[key] || key;
      const idx = scale.indexOf(norm);
      if (idx < 0) return m;
      const next = scale[(idx + semis + 12) % 12];
      return next + (suf || '');
    });
  }

  transposeLines(lines, semis) {
    return lines.map(line => {
      const isChordLine = /^[\s|A-GH#bm0-9()/\-–—,:ВступлениеКкуплетПРИПЕВирифасоло]+$/.test(line) && /\b(Am|Em|Dm|C|G|F|D|E7|A7|B7|E|A)\b/.test(line);
      return isChordLine ? this.transposeChordToken(line, semis) : line;
    });
  }

  renderChords(tabId) {
    const list = this.data.songbook || [];
    const sel = this.songTab(tabId) || list[0];
    const alb = sel ? this.album(sel.albumId) : null;
    const transposed = sel ? this.transposeLines(sel.chords, this.transposeSemis) : [];
    const shiftLabel = this.transposeSemis === 0
      ? 'Оригинальная тональность (0)'
      : (this.transposeSemis > 0 ? `+${this.transposeSemis} полутона выше` : `${this.transposeSemis} полутона ниже (под уставший голос)`);
    return `
      <h1 class="ks-h1">Дворовый песенник и гитарные аккорды</h1>
      <p>Подборы проверены во дворах Петроградской стороны и общежитиях ЛЭТИ. Если голос сел после концерта, переключите тональность кнопками транспонирования прямо на странице.</p>
      <p class="ks-filter">
        Выбрать песню:
        ${list.map(s => s.id === sel.id
          ? `<b>${this.esc(s.title)}</b>`
          : this.link(`/chords?id=${s.id}`, this.esc(s.title))).join(' | ')}
      </p>
      <div class="ks-chord-box">
        <div class="ks-chord-head">
          <b>${this.esc(sel.title)}</b> (${alb ? this.link(`/album?id=${alb.id}`, this.esc(alb.title)) : ''}, ${this.esc(sel.year)})
        </div>
        <table width="100%" cellspacing="0" cellpadding="3" class="ks-chord-meta">
          <tr><td width="150"><b>Строй гитары:</b></td><td>${this.esc(sel.tuning)}</td></tr>
          <tr><td><b>Бой и ритм:</b></td><td>${this.esc(sel.strumming)}</td></tr>
          <tr><td><b>Скрипка и бас:</b></td><td>${this.esc(sel.violinNote)}</td></tr>
          <tr>
            <td><b>Тональность:</b></td>
            <td>
              <button class="ks-btn${this.transposeSemis === -2 ? ' ks-btn-on' : ''}" data-ks-transpose="-2">-2 полутона (ниже)</button>
              <button class="ks-btn${this.transposeSemis === 0 ? ' ks-btn-on' : ''}" data-ks-transpose="0">Оригинал (0)</button>
              <button class="ks-btn${this.transposeSemis === 2 ? ' ks-btn-on' : ''}" data-ks-transpose="2">+2 полутона (выше)</button>
              <span class="ks-small">&nbsp; Сейчас: <b>${this.esc(shiftLabel)}</b></span>
            </td>
          </tr>
        </table>
        <pre class="ks-chord-pre">${this.esc(transposed.join('\n'))}</pre>
        <p class="ks-tools">
          <button class="ks-btn" data-ks-notepad="chord:${sel.id}">Открыть разбор в Блокноте</button>
          <button class="ks-btn" data-ks-save="chord:${sel.id}">Сохранить ${this.esc(sel.file)}</button>
          <button class="ks-btn" data-ks-winamp="${sel.id}">Слушать мотив в Winamp</button>
        </p>
      </div>`;
  }

  renderLineup(id) {
    const people = this.data.people || [];
    const years = [];
    for (let y = 1988; y <= 1999; y++) years.push(y);
    const selected = people.find(p => p.id === id) || people[0];
    const dossier = (this.data.dossiers || {})[selected.id];
    const inSpan = (p, y) => p.spans.some(([a, b]) => y >= a && y <= b);
    const yearsText = p => p.spans.map(([a, b]) => a === b ? String(a) : `${a}–${b}`).join(', ');
    return `
      <h1 class="ks-h1">Состав группы по годам (1988–1999)</h1>
      <p>От школьной группы «Контора» 1988 года до полного электрического и акустического состава со скрипкой и клавишными конца 1999 года. Нажмите на имя музыканта, чтобы открыть личное досье.</p>
      <table class="ks-gantt" cellspacing="0" cellpadding="0">
        <tr>
          <th class="ks-gantt-name">Музыкант</th>
          ${years.map(y => `<th>${String(y).slice(2)}</th>`).join('')}
        </tr>
        ${people.map(p => `
          <tr class="${p.id === selected.id ? 'ks-gantt-on' : ''}">
            <td class="ks-gantt-name">${(this.data.dossiers || {})[p.id] ? this.link(`/lineup?id=${p.id}`, this.esc(p.name)) : this.esc(p.name)}<br><span class="ks-small">${this.esc(p.role)}</span></td>
            ${years.map(y => `<td class="${inSpan(p, y) ? `ks-g-${p.group}` : 'ks-g-off'}">${inSpan(p, y) ? '&nbsp;' : ''}</td>`).join('')}
          </tr>`).join('')}
      </table>
      <p class="ks-gantt-key"><span class="ks-g-core">&nbsp;&nbsp;&nbsp;</span> основатели и вокал &nbsp; <span class="ks-g-band">&nbsp;&nbsp;&nbsp;</span> гитары и ударные &nbsp; <span class="ks-g-folk">&nbsp;&nbsp;&nbsp;</span> скрипка и клавишные</p>
      <div class="ks-dossier">
        <div class="ks-dossier-head">${this.esc(dossier ? dossier.name : selected.name)}</div>
        <table cellspacing="0" cellpadding="2">
          <tr><td width="160" valign="top"><b>Годы в составе:</b></td><td>${this.esc(yearsText(selected))}</td></tr>
          <tr><td valign="top"><b>Инструменты и роль:</b></td><td>${this.esc(selected.role)}</td></tr>
          ${dossier ? dossier.lines.map(([k, v]) => `<tr><td valign="top"><b>${this.esc(k)}:</b></td><td>${this.esc(v)}</td></tr>`).join('') : ''}
        </table>
        ${dossier ? `<p>${this.esc(dossier.text)}</p>` : ''}
      </div>`;
  }

  renderMidi() {
    const files = this.data.midi || [];
    const playing = files.find(f => f.id === this.synthPlayingId);
    return `
      <h1 class="ks-h1">Панк-шарманка (MIDI-архив)</h1>
      <p>Короткие MIDI-наигрыши по мотивам вступлений и припевов «Короля и Шута», набранные читателями нашего узла в Cakewalk и FastTracker. Воспроизводятся напрямую через синтезатор вашей звуковой карты.</p>
      <div class="ks-player">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td width="74"><button class="ks-pbtn" data-ks-midi="${playing ? playing.id : (files[0] || {}).id}">&#9658;</button><button class="ks-pbtn" data-ks-stop="1">&#9632;</button></td>
            <td><div class="ks-lcd">${playing ? `${this.esc(playing.file)} &nbsp; ${playing.bpm} BPM &nbsp; ИГРАЕТ ШАРМАНКА` : 'ШАРМАНКА ГОТОВА К БОЮ'}</div></td>
            <td width="130" class="ks-small" align="right">PUNK-MIDI v1.2</td>
          </tr>
        </table>
      </div>
      <table class="ks-midi" width="100%" cellspacing="0" cellpadding="3">
        <tr><th></th><th align="left">Файл</th><th align="right">Размер</th><th align="left">Мотив</th><th align="left">Автор</th></tr>
        ${files.map(f => `
          <tr class="${f.id === this.synthPlayingId ? 'ks-midi-on' : ''}">
            <td width="28"><button class="ks-pbtn" data-ks-midi="${f.id}" title="Играть">&#9658;</button></td>
            <td><tt>${this.esc(f.file)}</tt></td>
            <td align="right">${f.bytes} байт</td>
            <td>${this.esc(f.motif)}</td>
            <td>${this.esc(f.author)}</td>
          </tr>`).join('')}
      </table>
      <p class="ks-small">Свой подбор в формате .MID или .MOD до 15 КБ присылайте на <a href="mailto:webmaster@kish99.ru">webmaster@kish99.ru</a>.</p>`;
  }

  allGuestbook() {
    const seed = (this.data.guestbook || []).map(e => Object.assign({ user: false }, e));
    const user = this.loadUser().guestbook.map(e => Object.assign({ user: true }, e));
    return user.slice().reverse().concat(seed);
  }

  guestReply(text) {
    const low = String(text).toLowerCase();
    if (low.includes('герои и злодеи') || low.includes('новый альбом') || low.includes('2000')) {
      return 'Новый электрический альбом «Герои и злодеи» записывается сейчас в Петербурге и выйдет в начале 2000 года. Следите за разделом «Новости»!';
    }
    if (low.includes('аккорд') || low.includes('гитар') || low.includes('бой') || low.includes('таб')) {
      return 'Все дворовые разборы с переключателем тональности лежат в разделе «Аккорды», их можно сохранить в Блокнот.';
    }
    if (low.includes('горшок') || low.includes('князь') || low.includes('балу') || low.includes('маша')) {
      return 'Полные досье Горшка, Князя, Балу, Поручика, Яши и Маши Нефёдовой собраны в разделе «Состав».';
    }
    if (low.includes('хой') || low.includes('панк')) {
      return 'Панки — хой! Будь как дома, путник!';
    }
    return '';
  }

  addGuestbookEntry(entry) {
    const text = String(entry.text || '').trim();
    if (!text) return this.allGuestbook();
    const favs = (this.data.favAlbums || []).map(f => f[0]);
    const user = this.loadUser();
    user.guestbook.push({
      name: (String(entry.name || '').trim() || 'Путник').slice(0, 40),
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
      <h1 class="ks-h1">Книга жалоб и приветов Трактирщика</h1>
      <p>Оставляйте приветы, отчёты о концертах в вашем городе и заявки на разбор аккордов. Трактирщик проверяет записи каждую ночь после полуночи.</p>
      <div class="ks-gb-form">
        <table cellspacing="0" cellpadding="3">
          <tr><td>Прозвище:</td><td><input type="text" id="ks-gb-name" size="22" maxlength="40"></td>
              <td>Город:</td><td><input type="text" id="ks-gb-from" size="18" maxlength="40"></td></tr>
          <tr><td>E-mail / ICQ / Fido:</td><td><input type="text" id="ks-gb-contact" size="22" maxlength="50"></td>
              <td>Любимая кассета:</td><td>
                <select id="ks-gb-fav">
                  <option value="">не выбрана</option>
                  ${(this.data.favAlbums || []).map(([v, l]) => `<option value="${v}">${this.esc(l)}</option>`).join('')}
                </select></td></tr>
          <tr><td valign="top">Запись:</td><td colspan="3"><textarea id="ks-gb-text" rows="5" cols="56" maxlength="700"></textarea></td></tr>
          <tr><td></td><td colspan="3"><button class="ks-btn" data-ks-gb="1">Оставить запись в книге</button></td></tr>
        </table>
      </div>
      <p class="ks-small">Всего записей в книге: ${list.length}</p>
      ${list.map(e => `
        <div class="ks-gb-entry">
          <div class="ks-gb-head">
            <b>${this.esc(e.name)}</b>${e.from ? `, ${this.esc(e.from)}` : ''}
            ${e.contact ? `<span class="ks-small">(${this.esc(e.contact)})</span>` : ''}
            <span class="ks-gb-date">${this.esc(e.date)}</span>
          </div>
          ${e.fav ? `<div class="ks-small">Любимая кассета: ${this.esc(favName(e.fav))}</div>` : ''}
          <div class="ks-gb-text">${this.esc(e.text)}</div>
          ${e.reply ? `<div class="ks-gb-reply"><b>Трактирщик:</b> ${this.esc(e.reply)}</div>` : ''}
        </div>`).join('')}`;
  }

  articleText(art) {
    if (!art) return '';
    return [
      'КОРОЛЬ И ШУТ \'99 :: ТРАКТИР «СТАРАЯ СКАЗКА»  http://www.kish99.ru',
      '='.repeat(64),
      `${art.date}  [${art.rubric}]`,
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
    return `KISH_${a.id.toUpperCase().replace(/-/g, '_')}.TXT`;
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
      'ВКЛАДЫШ ДЛЯ КАССЕТЫ. ТРАКТИР «СТАРАЯ СКАЗКА», http://www.kish99.ru',
      '',
      line,
      row(`КОРОЛЬ И ШУТ :: ${a.title}`),
      row(`${a.year}, ${a.label}`),
      line,
      ...tracks,
      line,
      ...a.credits.map(([k, v]) => row(`${k}: ${v}`)),
      row(`Вышел: ${a.released}`),
      line,
      '',
      'Печатать моноширинным шрифтом Courier New, вырезать по рамке.'
    ].join('\r\n');
  }

  chordText(s) {
    if (!s) return '';
    const lines = this.transposeLines(s.chords, this.transposeSemis);
    return [
      'ДВОРОВЫЙ ПЕСЕННИК «КОРОЛЬ И ШУТ \'99»  http://www.kish99.ru',
      '='.repeat(64),
      `${s.title} (${s.year})`,
      `Строй: ${s.tuning}`,
      `Бой: ${s.strumming}`,
      `Скрипка/бас: ${s.violinNote}`,
      '-'.repeat(64),
      ...lines,
      '='.repeat(64)
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
    if (type === 'chord') {
      const s = this.songTab(id);
      return s ? { file: s.file, text: this.chordText(s) } : null;
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
        osc.type = step % 2 === 0 ? 'sawtooth' : 'triangle';
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
          kick.frequency.setValueAtTime(120, now);
          kick.frequency.exponentialRampToValueAtTime(45, now + 0.1);
          kg.gain.setValueAtTime(0.08, now);
          kg.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          kick.connect(kg);
          kg.connect(ctx.destination);
          kick.start(now);
          kick.stop(now + 0.12);
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
    this.synthPlayingId = null;
  }

  attachEvents(win, container, ie) {
    const root = (typeof container.querySelector === 'function' && container.querySelector('.ks-site')) || container;
    const path = (root.dataset && root.dataset.ksPath) || '/';
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

    if (typeof root.addEventListener !== 'function') return;
    root.addEventListener('click', e => {
      const t = e.target && typeof e.target.closest === 'function'
        ? e.target.closest('[data-ks-enc],[data-ks-midi],[data-ks-stop],[data-ks-poll],[data-ks-notepad],[data-ks-save],[data-ks-comment],[data-ks-gb],[data-ks-clippy],[data-ks-transpose],[data-ks-winamp],[data-ks-fav],[data-ks-top]')
        : null;
      if (!t) return;
      const d = t.dataset;
      if (d.ksTop) {
        container.scrollTop = 0;
      } else if (d.ksFav) {
        say('Адрес трактира: http://www.kish99.ru. Запишите его на листочке и заходите ещё, путник!');
        sound('playDing');
        rerender();
        container.scrollTop = 0;
      } else if (d.ksEnc) {
        this.encoding = ['win1251', 'koi8', 'translit'].includes(d.ksEnc) ? d.ksEnc : 'win1251';
        sound('playClick');
        rerender();
      } else if (d.ksTranspose !== undefined) {
        const s = parseInt(d.ksTranspose, 10);
        this.transposeSemis = [-2, 0, 2].includes(s) ? s : 0;
        sound('playClick');
        rerender();
      } else if (d.ksWinamp) {
        const tab = this.songTab(d.ksWinamp);
        if (tab && tab.winamp && typeof window !== 'undefined' && window.appWinamp) {
          window.appWinamp.open();
          const idx = window.appWinamp.addTrack(tab.winamp);
          if (typeof window.appWinamp.play === 'function') window.appWinamp.play(idx);
          say(`Трек «${tab.winamp.title}» отправлен в плеер Winamp.`);
          sound('playDing');
          rerender();
        }
      } else if (d.ksMidi) {
        this.playSynth(d.ksMidi);
        rerender();
      } else if (d.ksStop) {
        this.stopSynth();
        sound('playClick');
        rerender();
      } else if (d.ksPoll) {
        const checked = typeof root.querySelector === 'function' ? root.querySelector('input[name="ks-poll"]:checked') : null;
        this.savePollVote(checked ? checked.value : '');
        say('Спасибо, ваш голос учтён у стойки трактира.');
        sound('playDing');
        rerender();
      } else if (d.ksNotepad) {
        this.openDoc(d.ksNotepad);
      } else if (d.ksSave) {
        const file = this.saveDoc(d.ksSave);
        if (file) {
          say(`Файл ${file} сохранён в папку «Мои документы».`);
          sound('playDing');
          rerender();
        }
      } else if (d.ksComment) {
        if (!value('#ks-c-text').trim()) return;
        this.addComment(d.ksComment, value('#ks-c-name'), value('#ks-c-text'));
        say('Отклик добавлен к летописи.');
        sound('playDing');
        rerender();
      } else if (d.ksGb) {
        if (!value('#ks-gb-text').trim()) {
          say('Напишите сообщение, пустую запись не сохранить.');
          rerender();
          return;
        }
        this.addGuestbookEntry({
          name: value('#ks-gb-name'),
          from: value('#ks-gb-from'),
          contact: value('#ks-gb-contact'),
          fav: value('#ks-gb-fav'),
          text: value('#ks-gb-text')
        });
        say('Запись добавлена в книгу жалоб Трактирщика.');
        sound('playDing');
        rerender();
      } else if (d.ksClippy) {
        if (typeof window !== 'undefined' && window.appClippy) {
          window.appClippy.show();
          window.appClippy._lastIePageKey = null;
          window.appClippy.onNavigateIE(ie.currentUrl || this.baseUrl, 'kish', "Король и Шут '99");
        }
      }
    });
  }
}

window.kishSite = new KishSite();
