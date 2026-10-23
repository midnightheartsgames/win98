class ProdigySite {
  constructor() {
    this.baseUrl = 'http://www.prodigy99.ru';
    this.userKey = 'win98_prodigy_user_v1';
    this.hitKey = 'win98_prodigy_hits_v1';
    this.seenKey = 'win98_prodigy_seen_v1';
    this.seen = new Set();
    this.encoding = 'win1251';
    this.synthPlayingId = null;
    this._endTimer = null;
    this._audioCtx = null;
    this._nodes = [];
    this.notice = null;
    this.hitCount = 0;
    this.padKinds = ['bass', 'break', 'acid', 'siren'];
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
    return (typeof window !== 'undefined' && window.prodigyData) || {};
  }

  store() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) {}
    return null;
  }

  initHits() {
    const ls = this.store();
    let count = 24310;
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
      count = 24311;
    }
    this.hitCount = count;
  }

  emptyUser() {
    return { guestbook: [], comments: {}, poll: null, scanned: [], pattern: [] };
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
            poll: typeof parsed.poll === 'string' ? parsed.poll : null,
            scanned: Array.isArray(parsed.scanned) ? parsed.scanned.map(String) : [],
            pattern: Array.isArray(parsed.pattern) ? parsed.pattern.filter(k => this.padKinds.includes(k)) : []
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
    const seen = this.seen.has(this.seenFor(path)) ? 'prd-seen' : '';
    const classes = [cls, seen].filter(Boolean).join(' ');
    return `<a${classes ? ` class="${classes}"` : ''} data-url="${this.url(path)}">${label}</a>`;
  }

  rule() {
    return '<div class="prd-hazard">&nbsp;</div>';
  }

  heading(label, gifName) {
    return `<h2 class="prd-h2">${gifName ? `${this.gif(gifName)} ` : ''}${label}</h2>`;
  }

  clock() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${this.data.siteDay} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  album(id) {
    return (this.data.albums || []).find(a => a.id === id) || null;
  }

  article(id) {
    return (this.data.articles || []).find(a => a.id === id) || null;
  }

  fake(id) {
    return (this.data.pirateFakes || []).find(f => f.id === id) || null;
  }

  sample(id) {
    return (this.data.samples || []).find(s => s.id === id) || null;
  }

  sector(id) {
    return ((this.data.manezhkaMap || {}).sectors || []).find(s => s.id === id) || null;
  }

  sampleForTrack(title) {
    const clean = String(title).replace(/\s*\(.*$/, '').trim().toLowerCase();
    if (!clean) return null;
    return (this.data.samples || []).find(s => s.trackTitle.toLowerCase().startsWith(clean)) || null;
  }

  fileId(id) {
    return String(id).toUpperCase().replace(/[^A-Z0-9]+/g, '_');
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
      '/discography': 'albums',
      '/album': 'album',
      '/pirates': 'pirates',
      '/antifaq': 'pirates',
      '/detector': 'pirates',
      '/sampler': 'sampler',
      '/lab': 'sampler',
      '/manezhka': 'manezhka',
      '/manezh': 'manezhka',
      '/midi': 'midi',
      '/lineup': 'lineup',
      '/members': 'lineup',
      '/guestbook': 'guestbook'
    };
    const page = routes[path] || '404';
    return { page, path, params };
  }

  getPageTitle(url) {
    const route = this.parseRoute(url);
    const titles = {
      home: 'The Prodigy \'99 :: Russian Rave Bunker & Antifaq',
      news: 'The Prodigy \'99 :: новости бункера',
      albums: 'The Prodigy \'99 :: дискография и вкладыши',
      pirates: 'The Prodigy \'99 :: детектор пиратских фейков Горбушки',
      sampler: 'The Prodigy \'99 :: лаборатория сэмплов Лиама Хоулетта',
      manezhka: 'The Prodigy \'99 :: архив Манежной площади 27.09.1997',
      midi: 'The Prodigy \'99 :: MIDI-бункер',
      lineup: 'The Prodigy \'99 :: состав и досье',
      guestbook: 'The Prodigy \'99 :: гостевая книга рейверов'
    };
    if (route.page === 'article') {
      const art = this.article(route.params.id);
      return art ? `The Prodigy '99 :: ${art.title}` : '404 Not Found';
    }
    if (route.page === 'album') {
      const alb = this.album(route.params.id);
      return alb ? `The Prodigy '99 :: ${alb.title} (${alb.year})` : '404 Not Found';
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
      album: () => this.renderAlbum(route.params.id, route.params.track),
      pirates: () => this.renderPirates(route.params.id),
      sampler: () => this.renderSampler(route.params.id),
      manezhka: () => this.renderManezhka(route.params.sector),
      midi: () => this.renderMidi(),
      lineup: () => this.renderLineup(route.params.id),
      guestbook: () => this.renderGuestbook()
    };
    const body = pages[route.page] ? pages[route.page]() : null;
    if (body === null) return this.render404(route.path);
    const html = `
      <div class="prd-site" data-prd-path="${this.esc(route.path)}">
        <table class="prd-shell" cellspacing="0" cellpadding="0" align="center">
          <tr><td>${this.renderMasthead()}</td></tr>
          <tr><td>${this.renderTicker()}</td></tr>
          <tr><td>${this.renderNav(route.page)}</td></tr>
          <tr><td class="prd-body" valign="top">${this.renderNotice(route.path)}${body}${this.renderTop()}</td></tr>
          <tr><td>${this.renderFooter()}</td></tr>
        </table>
      </div>`;
    this.markSeen(url);
    return this.encodeHtml(html);
  }

  render404(path) {
    return `
      <div class="prd-site prd-raw">
        <h1>Not Found</h1>
        <p>The requested URL ${this.esc(path)} was not found on this server.</p>
        <hr>
        <address>Apache/1.3.9 Server at www.prodigy99.ru Port 80</address>
      </div>`;
  }

  renderNotice(path) {
    if (!this.notice || this.notice.path !== path) return '';
    const text = this.notice.text;
    this.notice = null;
    return `<div class="prd-notice">${this.gif('check')} ${this.esc(text)}</div>`;
  }

  antMarkup(fill) {
    return `
      <g stroke="${fill}" stroke-width="2" fill="${fill}">
        <circle cx="0" cy="-22" r="6"/>
        <ellipse cx="0" cy="-8" rx="6" ry="7"/>
        <ellipse cx="0" cy="12" rx="9" ry="12"/>
        <line x1="-3" y1="-27" x2="-10" y2="-38" fill="none"/>
        <line x1="3" y1="-27" x2="10" y2="-38" fill="none"/>
        <line x1="-5" y1="-10" x2="-20" y2="-20" fill="none"/>
        <line x1="5" y1="-10" x2="20" y2="-20" fill="none"/>
        <line x1="-6" y1="-6" x2="-24" y2="-2" fill="none"/>
        <line x1="6" y1="-6" x2="24" y2="-2" fill="none"/>
        <line x1="-5" y1="-2" x2="-20" y2="16" fill="none"/>
        <line x1="5" y1="-2" x2="20" y2="16" fill="none"/>
      </g>`;
  }

  renderMasthead() {
    return `
      <a data-url="${this.url()}" class="prd-mast-link">
        <svg class="prd-mast" width="754" height="132" viewBox="0 0 754 132" role="img" aria-label="The Prodigy. Russian Rave Bunker and Antifaq 1999">
          <defs>
            <pattern id="prd-haz" width="20" height="12" patternUnits="userSpaceOnUse">
              <rect width="20" height="12" fill="#ffcc00"/>
              <polygon points="0,12 10,0 20,0 10,12" fill="#000000"/>
            </pattern>
          </defs>
          <rect width="754" height="132" fill="#000000"/>
          <rect width="754" height="12" fill="url(#prd-haz)"/>
          <rect y="120" width="754" height="12" fill="url(#prd-haz)"/>
          <g transform="translate(78 68)">
            <circle r="42" fill="#000000" stroke="#ffcc00" stroke-width="3"/>
            ${this.antMarkup('#ffcc00')}
          </g>
          <g font-family="Impact, 'Arial Black', Arial, sans-serif">
            <text x="142" y="70" font-size="56" fill="#ff3300" letter-spacing="3">THE PRODIGY</text>
            <text x="139" y="67" font-size="56" fill="#ffcc00" letter-spacing="3">THE PRODIGY</text>
          </g>
          <text x="142" y="92" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#33ff33">RUSSIAN RAVE BUNKER &amp; ANTIFAQ '99</text>
          <text x="142" y="110" font-family="'Courier New', monospace" font-size="11" fill="#cccccc">Fat of the Land • Dirtchamber Sessions • Манежка 27.09.1997</text>
          <g transform="translate(662 64)">
            <rect x="-62" y="-36" width="116" height="72" fill="#001400" stroke="#33ff33" stroke-width="1"/>
            <text x="-4" y="-18" text-anchor="middle" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="#33ff33">BUNKER ONLINE</text>
            <text x="-4" y="0" text-anchor="middle" font-family="'Courier New', monospace" font-size="11" fill="#ffcc00">FIRESTARTER</text>
            <text class="prd-blink" x="-4" y="16" text-anchor="middle" font-family="'Courier New', monospace" font-size="10" fill="#ff3300">updated</text>
            <text x="-4" y="29" text-anchor="middle" font-family="'Courier New', monospace" font-size="11" fill="#ffffff">${this.esc(this.data.siteDay)}</text>
          </g>
        </svg>
      </a>`;
  }

  navItems() {
    return [
      ['home', 'Бункер', ''],
      ['news', 'Новости', '/news'],
      ['albums', 'Альбомы', '/albums'],
      ['pirates', 'Анти-Фейк', '/pirates'],
      ['sampler', 'Сэмплер', '/sampler'],
      ['manezhka', 'Манежка', '/manezhka'],
      ['midi', 'MIDI', '/midi'],
      ['lineup', 'Состав', '/lineup'],
      ['guestbook', 'Гостевая', '/guestbook']
    ];
  }

  renderNav(page) {
    const active = { article: 'news', album: 'albums' }[page] || page;
    return `<div class="prd-nav">${this.navItems().map(([key, label, path]) => active === key
      ? `<b>${label}</b>`
      : this.link(path, label)).join('')}</div>`;
  }

  renderTicker() {
    const arts = (this.data.articles || []).slice(0, 3);
    const text = [`${this.data.siteDayLong}. FIRE! FIRE!`]
      .concat(arts.map(a => `${a.date} ${a.title}`))
      .concat(['Внимание: кассеты «Castbreeder» и «Electronic Punks II» с Горбушки к The Prodigy отношения не имеют'])
      .join(' *** ');
    return `<div class="prd-ticker"><marquee scrollamount="4" scrolldelay="60">*** ${this.esc(text)} ***</marquee></div>`;
  }

  renderTop() {
    return `<p class="prd-top">[ <a data-prd-top="1">в начало страницы</a> ]</p>`;
  }

  renderFooter() {
    const ring = typeof window !== 'undefined' && window.retroSites && typeof window.retroSites.renderWebRing === 'function'
      ? window.retroSites.renderWebRing(this.baseUrl)
      : '';
    const enc = [['win1251', 'WIN'], ['koi8', 'KOI'], ['translit', 'LAT']].map(([key, label]) =>
      this.encoding === key ? `<b>${label}</b>` : `<a data-prd-enc="${key}">${label}</a>`).join(' | ');
    const digits = String(this.hitCount).padStart(6, '0').split('').map(d => `<span>${d}</span>`).join('');
    return `
      <div class="prd-footer">
        <div class="prd-footer-links">
          [ ${this.navItems().map(([, label, path]) => this.link(path, label)).join(' | ')} ]
        </div>
        <div class="prd-footer-tools">
          Кодировка: ${enc} &nbsp;&nbsp; Вы — рейвер №
          <span class="prd-counter" title="Рейверов с 03.03.1999">${digits}</span> &nbsp;&nbsp;
          <a data-prd-fav="1">Запомнить адрес бункера</a>
        </div>
        <div class="prd-footer-best">
          Лучше всего виден в <b>Microslop Internet Explorer 5.0</b>, разрешение <b>800x600</b>, 256 цветов.
        </div>
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td valign="top">
              Страница обновлена ${this.esc(this.data.siteDay)}<br>
              Неофициальный фан-узел. Вебмастер: ${this.esc(this.data.webmaster)}, <a href="mailto:webmaster@prodigy99.ru">webmaster@prodigy99.ru</a>.
            </td>
            <td class="prd-buttons" valign="top" width="300">
              <a class="prd-88" data-url="http://www.rambler98.ru">RAMBLER<br>TOP 100</a>
              <a class="prd-88 prd-88-mz" data-url="http://www.muzzone98.ru">МузЗона<br>'98</a>
              <a class="prd-88" data-url="http://www.mp3vault98.com">MP3<br>VAULT '98</a>
              <a class="prd-88 prd-88-ks" data-url="http://www.kish99.ru">КОРОЛЬ И ШУТ<br>'99</a>
              <a class="prd-88 prd-88-cm" data-url="http://www.carman99.ru">КАР-МЭН<br>КЛУБ '99</a>
            </td>
          </tr>
        </table>
        <p>Тексты, сэмплы и выходные данные сверены по буклетам XL Recordings и журналам. Нашли ошибку? Напишите в ${this.link('/guestbook', 'гостевую книгу')}. <a data-prd-clippy="1">Позвать Скрепыша</a></p>
        ${ring}
      </div>`;
  }

  renderBoard() {
    const rows = (this.data.raveBoard || []).map((r, i) => {
      const alb = this.album(r.albumId);
      const smp = this.sampleForTrack(r.title);
      return `
        <tr>
          <td width="24" class="prd-board-no">${i + 1}</td>
          <td><b>${smp ? this.link(`/sampler?id=${smp.id}`, this.esc(r.title)) : this.esc(r.title)}</b></td>
          <td>${alb ? this.link(`/album?id=${alb.id}`, this.esc(alb.title)) : this.esc(r.albumTitle)}</td>
          <td width="40">${this.esc(r.year)}</td>
          <td width="62">${this.esc(r.bpm)}</td>
          <td>${this.esc(r.synth)}</td>
        </tr>`;
    }).join('');
    return `
      <table class="prd-board" cellspacing="0" cellpadding="0">
        <tr><th>#</th><th>Трек (сэмплы)</th><th>Релиз</th><th>Год</th><th>Темп</th><th>Железо Лиама</th></tr>
        ${rows}
      </table>`;
  }

  pollState() {
    const user = this.loadUser();
    const poll = this.data.poll || {};
    const base = poll.baseVotes || {};
    const options = (poll.options || []).map(o => ({
      key: o.id, label: o.label, count: (base[o.id] || 0) + (user.poll === o.id ? 1 : 0)
    }));
    const total = options.reduce((s, o) => s + o.count, 0) || 1;
    return { options, total, voted: user.poll };
  }

  savePollVote(choice) {
    const valid = ((this.data.poll || {}).options || []).map(o => o.id);
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
        : `<input type="radio" name="prd-poll" value="${o.key}"${i === 0 ? ' checked' : ''}>`;
      return `
        <tr>
          <td width="14" valign="top">${input}</td>
          <td>${this.esc(o.label)}</td>
          <td width="34" align="right" valign="top">${pct}%</td>
        </tr>
        <tr><td></td><td colspan="2"><div class="prd-bar"><div style="width:${pct}%"></div></div></td></tr>`;
    }).join('');
    return `
      <div class="prd-box">
        <div class="prd-box-title">Голосование бункера</div>
        <div class="prd-box-body">
          <p><b>${this.esc((this.data.poll || {}).question)}</b></p>
          <table width="100%" cellspacing="0" cellpadding="1">${rows}</table>
          ${poll.voted
            ? `<p class="prd-small">Ваш голос учтён. Всего голосов: ${poll.total}.</p>`
            : `<p><button class="prd-btn" data-prd-poll="1">Голосовать</button> <span class="prd-small">голосов: ${poll.total}</span></p>`}
        </div>
      </div>`;
  }

  renderHome() {
    const arts = (this.data.articles || []).slice(0, 4);
    const gb = this.allGuestbook().slice(0, 2);
    const done = this.loadUser().scanned.length;
    const total = (this.data.pirateFakes || []).length;
    return `
      <div class="prd-warn">
        <div class="prd-warn-title">WARNING: HIGH VOLUME</div>
        <div class="prd-warn-day">${this.esc(this.data.siteDayLong)}</div>
        <p>Добро пожаловать в бункер. В феврале 1999 Лиам Хоулетт выпустил микс The Dirtchamber Sessions Volume One, пока по всей стране на Горбушке продают «новые альбомы Prodigy», записанные с Junkie XL и Lunatic Calm. Здесь ${this.link('/pirates', 'детектор фейков')}, ${this.link('/sampler', 'лаборатория сэмплов')} и ${this.link('/manezhka', 'архив Манежки 27.09.1997')}.</p>
      </div>
      ${this.heading('Рейв-доска: главные треки 1992–1999')}
      ${this.renderBoard()}
      ${this.rule()}
      <table class="prd-cols" cellspacing="0" cellpadding="0">
        <tr>
          <td class="prd-col-main" valign="top">
            ${this.heading('Новости бункера')}
            ${arts.map((a, i) => `
              <div class="prd-news-item">
                <div class="prd-news-date">${this.esc(a.date)} <span class="prd-rubric">${this.esc(a.cat)}</span> ${i === 0 ? this.gif('new') : ''}</div>
                <div class="prd-news-title">${this.link(`/article?id=${a.id}`, this.esc(a.title))}</div>
                <div class="prd-news-lead">${this.esc(a.lead)}</div>
              </div>`).join('')}
            <p>${this.link('/news', 'Весь архив новостей')}</p>
          </td>
          <td class="prd-col-side" valign="top">
            <div class="prd-term">
              <div class="prd-term-title">C:\\ANTIFAQ&gt; status</div>
              <div class="prd-term-body">
                Разоблачено фейков: <b>${done} / ${total}</b><br>
                ${this.link('/pirates', 'открыть детектор')}
              </div>
            </div>
            ${this.renderPoll()}
            <div class="prd-box">
              <div class="prd-box-title">Гостевая книга</div>
              <div class="prd-box-body">
                ${gb.map(g => `<p><b>${this.esc(g.name)}</b>:<br>${this.esc(g.msg.length > 110 ? g.msg.slice(0, 110) + '…' : g.msg)}</p>`).join('')}
                <p>${this.link('/guestbook', 'Оставить запись')}</p>
              </div>
            </div>
          </td>
        </tr>
      </table>`;
  }

  renderNews(params) {
    const all = this.data.articles || [];
    const cats = Array.from(new Set(all.map(a => a.cat)));
    const cat = cats.includes(params.rubric) ? params.rubric : '';
    const list = cat ? all.filter(a => a.cat === cat) : all;
    const filter = [cat ? this.link('/news', 'все') : '<b>все</b>']
      .concat(cats.map(r => r === cat ? `<b>${this.esc(r)}</b>` : this.link(`/news?rubric=${encodeURIComponent(r)}`, this.esc(r))))
      .join(' | ');
    return `
      <h1 class="prd-h1">Новости и расследования</h1>
      <p class="prd-filter">Рубрика: ${filter}</p>
      <table class="prd-archive" width="100%" cellspacing="0" cellpadding="4">
        ${list.map(a => `
          <tr>
            <td width="82" valign="top" class="prd-news-date">${this.esc(a.date)}</td>
            <td valign="top">
              <span class="prd-rubric">${this.esc(a.cat)}</span>
              ${this.link(`/article?id=${a.id}`, `<b>${this.esc(a.title)}</b>`)}<br>
              ${this.esc(a.lead)}
              <span class="prd-small">(${this.esc(a.author)}, откликов: ${this.comments(a.id).length})</span>
            </td>
          </tr>`).join('')}
      </table>`;
  }

  comments(articleId) {
    const seed = ((this.data.articleComments || {})[articleId] || []).map(c => ({ author: c.author, date: c.date, text: c.text }));
    const user = this.loadUser();
    return seed.concat(Array.isArray(user.comments[articleId]) ? user.comments[articleId] : []);
  }

  addComment(articleId, author, text) {
    const clean = String(text || '').trim();
    if (!clean || !this.article(articleId)) return this.comments(articleId);
    const user = this.loadUser();
    const list = Array.isArray(user.comments[articleId]) ? user.comments[articleId] : [];
    list.push({ author: (String(author || '').trim() || 'Рейвер').slice(0, 40), date: this.clock(), text: clean.slice(0, 600) });
    user.comments[articleId] = list;
    this.saveUser(user);
    return this.comments(articleId);
  }

  articleFile(art) {
    return `PRD_NEWS_${this.fileId(art.id)}.TXT`;
  }

  renderArticle(id) {
    const art = this.article(id);
    if (!art) return null;
    const list = this.comments(art.id);
    const others = (this.data.articles || []).filter(a => a.id !== art.id).slice(0, 4);
    return `
      <p class="prd-crumbs">${this.link('', 'bunker')} &gt; ${this.link('/news', 'news')} &gt; ${this.esc(art.cat)}</p>
      <div class="prd-paper">
        <div class="prd-paper-meta">
          Дата: ${this.esc(art.date)} | Рубрика: ${this.esc(art.cat)} | Автор: ${this.esc(art.author)}
        </div>
        <h1 class="prd-h1">${this.esc(art.title)}</h1>
        <p class="prd-paper-lead"><b>${this.esc(art.lead)}</b></p>
        <div class="prd-quote">${this.esc(art.quote)}</div>
        ${art.body.map(p => `<p>${this.esc(p)}</p>`).join('')}
        <p class="prd-tags">Метки: ${art.tags.map(t => this.esc(t)).join(', ')}</p>
        <p class="prd-tools">
          <button class="prd-btn" data-prd-notepad="article:${art.id}">Открыть в Блокноте</button>
          <button class="prd-btn" data-prd-save="article:${art.id}">Сохранить ${this.esc(this.articleFile(art))}</button>
        </p>
      </div>
      ${this.heading(`Отклики рейверов (${list.length})`, 'pencil')}
      ${list.length ? list.map(c => `
        <div class="prd-comment">
          <b>${this.esc(c.author)}</b> <span class="prd-small">${this.esc(c.date)}</span><br>
          ${this.esc(c.text)}
        </div>`).join('') : '<p>Откликов пока нет.</p>'}
      <table class="prd-form" cellspacing="0" cellpadding="3">
        <tr><td>Ник:</td><td><input type="text" id="prd-c-name" size="24" maxlength="40" value=""></td></tr>
        <tr><td valign="top">Отклик:</td><td><textarea id="prd-c-text" rows="4" cols="52" maxlength="600"></textarea></td></tr>
        <tr><td></td><td><button class="prd-btn" data-prd-comment="${art.id}">Отправить отклик</button></td></tr>
      </table>
      ${this.heading('Другие записи', 'book')}
      <ul class="prd-list">
        ${others.map(o => `<li>${this.esc(o.date)} — ${this.link(`/article?id=${o.id}`, this.esc(o.title))}</li>`).join('')}
      </ul>`;
  }

  typeLabel(type) {
    return {
      studio: 'Студийные альбомы',
      mix: 'DJ-микс Лиама Хоулетта',
      ep: 'Мини-альбомы и синглы',
      live: 'Концертные записи и сборники'
    }[type] || type;
  }

  renderAlbums() {
    const albums = this.data.albums || [];
    const kinds = ['studio', 'mix', 'ep', 'live'];
    return `
      <h1 class="prd-h1">Полка кассет и дисков</h1>
      <p>Официальные релизы XL Recordings и их российские лицензии. Нажмите на корешок, чтобы открыть треклист, тексты и распечатать вкладыш для кассеты.</p>
      ${kinds.map(kind => {
        const list = albums.filter(a => a.type === kind);
        if (!list.length) return '';
        return `
          <div class="prd-shelf-label">${this.esc(this.typeLabel(kind))}</div>
          ${list.map(a => `
            <a class="prd-spine" data-url="${this.url(`/album?id=${a.id}`)}" style="background-color:${a.jcard.bg};border-left-color:${a.jcard.accent};color:${a.jcard.fg}">
              <span class="prd-spine-year">${this.esc(a.year)}</span>
              <span class="prd-spine-title" style="color:${a.jcard.fg}">THE PRODIGY :: ${this.esc(a.title)}</span>
              <span class="prd-spine-label" style="color:${a.jcard.fg}">${this.esc(a.label)}</span>
            </a>`).join('')}`;
      }).join('')}
      ${this.rule()}
      <p>Ищете «альбомы», которых нет в этом списке? Загляните в ${this.link('/pirates', 'детектор пиратских фейков')}.</p>`;
  }

  shortTitle(title, max) {
    return title.length > max ? title.slice(0, max - 1) + '…' : title;
  }

  renderJcardFront(a) {
    const j = a.jcard;
    return `
      <svg width="180" height="200" viewBox="0 0 180 200" aria-hidden="true">
        <rect width="180" height="200" fill="${j.bg}"/>
        <rect x="6" y="6" width="168" height="148" fill="#000000" stroke="${j.accent}" stroke-width="3"/>
        <text x="90" y="28" text-anchor="middle" font-family="Impact, Arial, sans-serif" font-size="18" fill="${j.accent}">THE PRODIGY</text>
        <g transform="translate(90 94) scale(1.1)">${this.antMarkup(j.accent)}</g>
        <rect x="0" y="160" width="180" height="40" fill="${j.fg}"/>
        <text x="8" y="177" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="${j.bg}">${this.esc(this.shortTitle(a.title, 26))}</text>
        <text x="8" y="193" font-family="Arial, sans-serif" font-size="10" fill="#000000">${this.esc(a.year)} • ${this.esc(a.label.split('/')[0].trim())}</text>
      </svg>`;
  }

  renderAlbum(id, trackNum) {
    const a = this.album(id);
    if (!a) return null;
    const albums = this.data.albums || [];
    const idx = albums.indexOf(a);
    const prev = albums[idx - 1];
    const next = albums[idx + 1];
    const open = parseInt(trackNum, 10);
    return `
      <p class="prd-crumbs">${this.link('', 'bunker')} &gt; ${this.link('/albums', 'albums')} &gt; ${this.esc(a.title)}</p>
      <h1 class="prd-h1">${this.esc(a.title)} <span class="prd-h1-year">(${this.esc(a.year)})</span></h1>
      <table class="prd-jcard" cellspacing="0" cellpadding="0">
        <tr>
          <td class="prd-jcard-back" valign="top">
            <div class="prd-jcard-head">Вкладыш для печати (MC J-Card)</div>
            <ul>
              ${a.credits.map(c => `<li>${this.esc(c)}</li>`).join('')}
            </ul>
            <p class="prd-small">${this.esc(a.jcard.tagline)}</p>
          </td>
          <td class="prd-jcard-spine" style="background-color:${a.jcard.accent}">
            <svg width="26" height="200" viewBox="0 0 26 200" aria-hidden="true">
              <text transform="translate(18 194) rotate(-90)" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="${a.jcard.fg}">PRODIGY :: ${this.esc(this.shortTitle(a.title, 24))}</text>
            </svg>
          </td>
          <td class="prd-jcard-front">${this.renderJcardFront(a)}</td>
        </tr>
      </table>
      <table class="prd-cols" cellspacing="0" cellpadding="0">
        <tr>
          <td class="prd-col-main" valign="top">
            ${this.heading('Треклист')}
            <table class="prd-tracks" width="100%" cellspacing="0" cellpadding="2">
              ${a.tracks.map(t => {
                const smp = this.sampleForTrack(t.title);
                const shown = open === t.num && t.lyrics;
                return `
                  <tr>
                    <td width="22" align="right">${this.esc(t.num)}.</td>
                    <td>
                      <b>${this.esc(t.title)}</b><br>
                      <span class="prd-small">${this.esc(t.note)}</span>
                      ${t.lyrics ? `<br>${shown ? this.link(`/album?id=${a.id}`, 'скрыть текст') : this.link(`/album?id=${a.id}&track=${t.num}`, 'показать текст')}` : ''}
                      ${smp ? `<br>${this.link(`/sampler?id=${smp.id}`, 'откуда сэмплы')}` : ''}
                      ${shown ? `<div class="prd-lyrics">${this.esc(t.lyrics)}</div>` : ''}
                    </td>
                    <td width="42" align="right">${this.esc(t.duration)}</td>
                  </tr>`;
              }).join('')}
            </table>
            <p>${this.esc(a.history)}</p>
          </td>
          <td class="prd-col-side" valign="top">
            <div class="prd-box">
              <div class="prd-box-title">Паспорт релиза</div>
              <div class="prd-box-body">
                <p><b>Тип:</b> ${this.esc(a.typeLabel)}<br>
                <b>Лейбл:</b> ${this.esc(a.label)}<br>
                <b>Запись:</b> ${this.esc(a.recorded)}</p>
              </div>
            </div>
            <p><button class="prd-btn" data-prd-notepad="album:${a.id}">Вкладыш в Блокнот</button></p>
            <p><button class="prd-btn" data-prd-save="album:${a.id}">Сохранить на диск</button></p>
          </td>
        </tr>
      </table>
      <p class="prd-pager">
        ${prev ? this.link(`/album?id=${prev.id}`, `&lt;&lt; ${this.esc(prev.title)}`) : ''}
        ${prev && next ? ' | ' : ''}
        ${next ? this.link(`/album?id=${next.id}`, `${this.esc(next.title)} &gt;&gt;`) : ''}
      </p>`;
  }

  hashOf(text) {
    let h = 7;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 100003;
    return h;
  }

  spectrum(seed) {
    const chars = ' .:-=+*#%@';
    let h = this.hashOf(seed);
    let out = '';
    for (let i = 0; i < 44; i++) {
      h = (h * 1103 + 12345) % 100003;
      out += chars[h % chars.length];
    }
    return out;
  }

  matchPercent(id) {
    return 91 + (this.hashOf(id) % 9);
  }

  scannedIds() {
    return this.loadUser().scanned;
  }

  scanFake(id) {
    if (!this.fake(id)) return this.scannedIds();
    const user = this.loadUser();
    if (!user.scanned.includes(id)) {
      user.scanned.push(id);
      this.saveUser(user);
    }
    return user.scanned;
  }

  renderPirates(id) {
    const fakes = this.data.pirateFakes || [];
    const done = this.scannedIds();
    const sel = this.fake(id) || fakes.find(f => !done.includes(f.id)) || fakes[0];
    const scanned = done.includes(sel.id);
    const verdict = scanned ? `
      <div class="prd-stamp">FAKE</div>
      <table cellspacing="0" cellpadding="0">
        <tr><td width="150"><b>Настоящий автор:</b></td><td>${this.esc(sel.realArtist)}</td></tr>
        <tr><td><b>Настоящий трек:</b></td><td>${this.esc(sel.realTitle)}</td></tr>
        <tr><td><b>Альбом:</b></td><td>${this.esc(sel.realAlbum)}</td></tr>
        <tr><td><b>Темп:</b></td><td>${this.esc(sel.bpm)}</td></tr>
        <tr><td valign="top"><b>Как поймать:</b></td><td>${this.esc(sel.tell)}</td></tr>
      </table>
      <div class="prd-spectrum">КАССЕТА  ${this.spectrum(sel.id)}
ОРИГИНАЛ ${this.spectrum(sel.id)}
Совпадение спектра: ${this.matchPercent(sel.id)}%</div>` : `
      <div class="prd-stamp prd-stamp-ok">???</div>
      <p>Дорожка загружена в детектор. Автор неизвестен, подпись на вкладыше — «The Prodigy». Запустите анализ, чтобы узнать, чей это трек на самом деле.</p>
      <div class="prd-spectrum">КАССЕТА  ${this.spectrum(sel.id)}
ОРИГИНАЛ ${'?'.repeat(44)}</div>
      <p><button class="prd-btn" data-prd-scan="${sel.id}">Запустить анализ</button></p>`;
    const allDone = done.length >= fakes.length;
    return `
      <h1 class="prd-h1">Детектор пиратских фейков Горбушки '99</h1>
      <p>На развалах продают «новый альбом Prodigy 1999» и сборники вроде «Castbreeder (1998/1999)» и «Electronic Punks II». Выберите «загадочный трек» с кассеты и проверьте, кто его записал на самом деле. Разоблачено: <b>${done.length} из ${fakes.length}</b>.</p>
      <div class="prd-scan">
        <div class="prd-scan-head">${this.esc(sel.cassettePos)} :: «${this.esc(sel.fakeTitle)}»</div>
        <div class="prd-scan-body">${verdict}</div>
      </div>
      <table class="prd-fakes" width="100%" cellspacing="0" cellpadding="0">
        <tr><th align="left">Кассета</th><th align="left">Название на вкладыше</th><th align="left">Кто на самом деле</th></tr>
        ${fakes.map(f => `
          <tr class="${f.id === sel.id ? 'prd-fakes-on' : ''}${done.includes(f.id) ? ' prd-fakes-done' : ''}">
            <td width="90">${this.esc(f.cassettePos)}</td>
            <td>${this.link(`/pirates?id=${f.id}`, this.esc(f.fakeTitle))}</td>
            <td>${done.includes(f.id) ? `${this.esc(f.realArtist)} — ${this.esc(f.realTitle)}` : '???'}</td>
          </tr>`).join('')}
      </table>
      ${allDone ? `<p><b>Все фейки разоблачены! Диплом антипирата ваш.</b></p>` : ''}
      <p class="prd-tools">
        <button class="prd-btn" data-prd-notepad="pirates:all">Отчёт в Блокнот</button>
        <button class="prd-btn" data-prd-save="pirates:all">Сохранить ${this.esc(this.piratesFile())}</button>
      </p>`;
  }

  piratesFile() {
    return 'PRD_ANTIFAKE.TXT';
  }

  piratesText() {
    const done = this.scannedIds();
    const fakes = this.data.pirateFakes || [];
    const lines = fakes.filter(f => done.includes(f.id)).map(f =>
      `${f.cassettePos}: «${f.fakeTitle}» = ${f.realArtist} — ${f.realTitle} (${f.realAlbum}), ${f.bpm}`);
    return [
      'ДЕТЕКТОР ПИРАТСКИХ ФЕЙКОВ ГОРБУШКИ \'99  http://www.prodigy99.ru',
      '='.repeat(64),
      `Разоблачено: ${done.length} из ${fakes.length}`,
      '-'.repeat(64),
      ...(lines.length ? lines : ['Пока ни одного фейка не проверено.']),
      '='.repeat(64)
    ].join('\r\n');
  }

  padLabel(kind) {
    return { bass: 'BASSLINE', break: 'BREAKBEAT', acid: 'ACID SYNTH', siren: 'SIREN' }[kind] || kind;
  }

  renderSampler(id) {
    const samples = this.data.samples || [];
    const sel = this.sample(id) || samples[0];
    const pattern = this.loadUser().pattern;
    const playing = this.synthPlayingId === 'pattern';
    const cells = [];
    for (let i = 0; i < 16; i++) {
      const k = pattern[i];
      cells.push(`<td class="${k ? `prd-seq-${k}` : ''}">${k ? k[0].toUpperCase() : ''}</td>`);
    }
    const lcd = playing ? 'PATTERN PLAYING...' : (pattern.length ? `PATTERN: ${pattern.length}/16 HITS` : 'SAMPLER READY. HIT A PAD');
    const tracks = (this.data.raveBoard || []).slice(0, 4);
    return `
      <h1 class="prd-h1">Лаборатория сэмплов Лиама Хоулетта</h1>
      <p>Лиам Хоулетт собирает треки из нарезок старых пластинок 70–80-х на Roland W-30 и Akai S3200XL. Нажимайте на пэды, записывайте шестнадцать ударов подряд и разбирайте сэмплы любимых хитов.</p>
      <div class="prd-lcd">${this.esc(lcd)}</div>
      <div class="prd-pads">
        ${this.padKinds.map(k => `<button class="prd-pad prd-pad-${k}" data-prd-pad="${k}">${this.padLabel(k)}</button>`).join('')}
      </div>
      <table class="prd-seq" cellspacing="0" cellpadding="0"><tr>${cells.join('')}</tr></table>
      <p class="prd-tools">
        <button class="prd-btn" data-prd-playpat="1">&#9658; Играть паттерн</button>
        <button class="prd-btn" data-prd-stop="1">&#9632; Стоп</button>
        <button class="prd-btn" data-prd-clearpat="1">Стереть</button>
        <button class="prd-btn" data-prd-notepad="beat:1">Паттерн в Блокнот</button>
        <button class="prd-btn" data-prd-save="beat:1">Сохранить ${this.esc(this.beatFile())}</button>
      </p>
      ${this.heading('Откуда взяты сэмплы')}
      <p class="prd-filter">
        ${samples.map(s => s.id === sel.id ? `<b>${this.esc(s.trackTitle)}</b>` : this.link(`/sampler?id=${s.id}`, this.esc(s.trackTitle))).join(' | ')}
      </p>
      <div class="prd-sample">
        <div class="prd-sample-head">${this.esc(sel.trackTitle)} :: ${this.esc(sel.albumTitle)}</div>
        <div class="prd-sample-body">
          <p>Железо: ${this.esc(sel.samplerGear)}</p>
          <table width="100%" cellspacing="0" cellpadding="0">
            ${sel.sources.map(s => `
              <tr>
                <td width="150"><b>${this.esc(s.part)}</b></td>
                <td>${this.esc(s.original)}<br><span class="prd-small">${this.esc(s.detail)}</span></td>
              </tr>`).join('')}
          </table>
        </div>
      </div>
      ${this.heading('Связка с Winamp и скинами')}
      <p>Отправьте рейв-трек в плеер или соберите плейлист .M3U. Для плеера есть скины с муравьём: <a data-url="http://skins.winamp.com">skins.winamp.com</a>.</p>
      <p class="prd-tools">
        ${tracks.map(t => `<button class="prd-btn" data-prd-winamp="${t.id}">В Winamp: ${this.esc(t.title)}</button>`).join('')}
        <button class="prd-btn" data-prd-m3u="1">Плейлист ${this.esc(this.m3uFile())}</button>
      </p>`;
  }

  beatFile() {
    return 'PRD_BEAT.TXT';
  }

  m3uFile() {
    return 'PRODIGY_RAVE.M3U';
  }

  addPadHit(kind) {
    if (!this.padKinds.includes(kind)) return this.loadUser().pattern;
    const user = this.loadUser();
    user.pattern.push(kind);
    if (user.pattern.length > 16) user.pattern = user.pattern.slice(-16);
    this.saveUser(user);
    return user.pattern;
  }

  clearPattern() {
    const user = this.loadUser();
    user.pattern = [];
    this.saveUser(user);
    return user.pattern;
  }

  beatText() {
    const pattern = this.loadUser().pattern;
    const rows = this.padKinds.map(k => `${this.padLabel(k).padEnd(11, ' ')}|${pattern.map(p => (p === k ? 'X' : '.')).join('')}|`);
    return [
      'ЛАБОРАТОРИЯ СЭМПЛОВ ЛИАМА ХОУЛЕТТА  http://www.prodigy99.ru',
      '='.repeat(64),
      `Шагов в паттерне: ${pattern.length} из 16`,
      '-'.repeat(64),
      ...rows,
      '='.repeat(64)
    ].join('\r\n');
  }

  winampTrack(r) {
    const idx = (this.data.raveBoard || []).indexOf(r);
    return {
      title: `The Prodigy - ${r.title}`,
      artist: 'The Prodigy',
      src: idx % 2 === 0 ? 'content/music/Loadsamoney.mp3' : 'content/music/Intro.mp3'
    };
  }

  m3uText() {
    return [
      '#EXTM3U',
      '#PLAYLIST:The Prodigy - Russian Rave Bunker \'99',
      ...(this.data.raveBoard || []).map(r => {
        const t = this.winampTrack(r);
        return `#EXTINF:240,${t.artist} - ${r.title}\r\n${t.src}`;
      })
    ].join('\r\n');
  }

  sendToWinamp(id) {
    const r = (this.data.raveBoard || []).find(b => b.id === id);
    if (!r || typeof window === 'undefined' || !window.appWinamp) return null;
    const track = this.winampTrack(r);
    const idx = window.appWinamp.addTrack(track);
    window.appWinamp.open();
    if (typeof window.appWinamp.play === 'function') window.appWinamp.play(idx);
    return track;
  }

  saveM3u() {
    if (typeof window !== 'undefined' && window.vfs && typeof window.vfs.writeFile === 'function') {
      window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], this.m3uFile(), this.m3uText());
    }
    if (typeof window !== 'undefined' && window.appWinamp) {
      (this.data.raveBoard || []).slice(0, 5).forEach(r => window.appWinamp.addTrack(this.winampTrack(r)));
      window.appWinamp.open();
    }
    return this.m3uFile();
  }

  mapGrid() {
    const m = this.data.manezhkaMap || { width: 0, height: 0, sectors: [] };
    const pins = {};
    m.sectors.forEach((s, i) => {
      pins[`${s.y}:${s.x}`] = { sector: s, mark: String(i + 1) };
    });
    return { m, pins };
  }

  renderManezhkaAscii(selectedId) {
    const { m, pins } = this.mapGrid();
    const lines = [];
    for (let r = 0; r < m.height; r++) {
      let out = '';
      for (let c = 0; c < m.width; c++) {
        const p = pins[`${r}:${c}`];
        if (p) {
          const cls = p.sector.id === selectedId ? 'prd-pin prd-pin-on' : 'prd-pin';
          out += `<a class="${cls}" data-url="${this.url(`/manezhka?sector=${p.sector.id}`)}" title="${this.esc(p.sector.title)}">${p.mark}</a>`;
        } else if (r === 0) {
          out += '<span class="prd-wall">#</span>';
        } else if (r === m.height - 1) {
          out += '<span class="prd-street">=</span>';
        } else {
          out += '.';
        }
      }
      lines.push(out);
    }
    return `<pre class="prd-map">${lines.join('\n')}</pre>`;
  }

  renderManezhka(sectorId) {
    const m = this.data.manezhkaMap || { sectors: [], setlist: [] };
    const sel = this.sector(sectorId) || m.sectors[0];
    return `
      <h1 class="prd-h1">Манежная площадь, 27.09.1997</h1>
      <p>Бесплатный концерт к 850-летию Москвы собрал около 250 000 зрителей. Верхняя стена на схеме — Кремль, нижняя линия — Манежная улица. Нажмите на номер, чтобы открыть рассказ очевидцев.</p>
      <div class="prd-map-box">${this.renderManezhkaAscii(sel ? sel.id : '')}</div>
      ${sel ? `
        <div class="prd-sector">
          <div class="prd-sector-title">${this.esc(sel.code)} :: ${this.esc(sel.title)}</div>
          <p><b>Толпа:</b> ${this.esc(sel.crowd)} | <b>Температура:</b> ${this.esc(sel.temp)}</p>
          <p>${this.esc(sel.story)}</p>
        </div>` : ''}
      <table class="prd-legend" width="100%" cellspacing="0" cellpadding="0">
        <tr><th width="30">№</th><th>Код</th><th>Место на площади</th></tr>
        ${m.sectors.map((s, i) => `
          <tr class="${sel && s.id === sel.id ? 'prd-legend-on' : ''}">
            <td>${i + 1}</td>
            <td>${this.esc(s.code)}</td>
            <td>${this.link(`/manezhka?sector=${s.id}`, this.esc(s.title))}</td>
          </tr>`).join('')}
      </table>
      ${this.heading('Сет-лист по минутам')}
      <table class="prd-setlist" width="100%" cellspacing="0" cellpadding="0">
        ${m.setlist.map(s => `
          <tr>
            <td width="24">${this.esc(s.num)}.</td>
            <td width="50" class="prd-time">${this.esc(s.time)}</td>
            <td><b>${this.esc(s.title)}</b> <span class="prd-small">${this.esc(s.note)}</span></td>
          </tr>`).join('')}
      </table>
      <p class="prd-tools">
        <button class="prd-btn" data-prd-notepad="manezhka:1">Сет-лист в Блокнот</button>
        <button class="prd-btn" data-prd-save="manezhka:1">Сохранить ${this.esc(this.manezhkaFile())}</button>
      </p>`;
  }

  manezhkaFile() {
    return 'MANEZHKA_97.TXT';
  }

  manezhkaText() {
    const m = this.data.manezhkaMap || { sectors: [], setlist: [] };
    return [
      'АРХИВ МАНЕЖНОЙ ПЛОЩАДИ 27.09.1997  http://www.prodigy99.ru',
      '='.repeat(64),
      ...m.setlist.map(s => `${String(s.num).padStart(2, ' ')}. ${s.time}  ${s.title}`),
      '-'.repeat(64),
      ...m.sectors.map((s, i) => `${i + 1}. [${s.code}] ${s.title}`),
      '='.repeat(64)
    ].join('\r\n');
  }

  renderMidi() {
    const files = this.data.midi || [];
    const playing = files.find(f => f.id === this.synthPlayingId);
    return `
      <h1 class="prd-h1">MIDI-бункер</h1>
      <p>Короткие MIDI-наигрыши по мотивам рифов The Prodigy. Играют две дорожки: основной тембр и бочка. Звук идёт через синтезатор звуковой карты.</p>
      <div class="prd-player">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td width="74"><button class="prd-pbtn" data-prd-midi="${playing ? playing.id : (files[0] || {}).id}">&#9658;</button><button class="prd-pbtn" data-prd-stop="1">&#9632;</button></td>
            <td><div class="prd-lcd">${playing ? `${this.esc(playing.file)} &nbsp; ${playing.bpm} BPM &nbsp; PLAYING` : 'RAVE-MIDI READY'}</div></td>
            <td width="110" class="prd-small" align="right">RAVE-MIDI v2.0</td>
          </tr>
        </table>
      </div>
      <table class="prd-midi" width="100%" cellspacing="0" cellpadding="3">
        <tr><th></th><th align="left">Файл</th><th align="right">Размер</th><th align="left">Мотив</th><th align="left">Релиз</th></tr>
        ${files.map(f => `
          <tr class="${f.id === this.synthPlayingId ? 'prd-midi-on' : ''}">
            <td width="28"><button class="prd-pbtn" data-prd-midi="${f.id}" title="Играть">&#9658;</button></td>
            <td><tt>${this.esc(f.file)}</tt></td>
            <td align="right">${this.esc(f.size)}</td>
            <td>${this.esc(f.title)}</td>
            <td>${this.esc(f.album)}</td>
          </tr>`).join('')}
      </table>
      <p class="prd-small">Свой наигрыш в формате .MID до 20 КБ присылайте на <a href="mailto:webmaster@prodigy99.ru">webmaster@prodigy99.ru</a>.</p>`;
  }

  renderLineup(id) {
    const people = this.data.people || [];
    const sel = people.find(p => p.id === id) || null;
    return `
      <h1 class="prd-h1">Состав и досье</h1>
      <p>Четверо на сцене и один за пультом. Нажмите на имя, чтобы выделить участника.</p>
      ${people.map(p => `
        <div class="prd-person"${sel && sel.id === p.id ? ' style="border-color:#ff3300"' : ''}>
          <div class="prd-person-name">${this.link(`/lineup?id=${p.id}`, this.esc(p.name))}</div>
          <p class="prd-small">${this.esc(p.role)} | ${this.esc(p.years)} | ${this.esc(p.era)}</p>
          <p>${this.esc(p.bio)}</p>
        </div>`).join('')}
      ${this.heading('Досье бункера')}
      ${(this.data.dossiers || []).map(d => `
        <div class="prd-dossier">
          <div class="prd-dossier-head">${this.esc(d.title)}</div>
          <ul class="prd-list">
            ${d.items.map(i => `<li>${this.esc(i)}</li>`).join('')}
          </ul>
        </div>`).join('')}`;
  }

  allGuestbook() {
    const seed = (this.data.guestbook || []).map(e => Object.assign({ user: false }, e));
    const user = this.loadUser().guestbook.map(e => Object.assign({ user: true }, e));
    return user.slice().reverse().concat(seed);
  }

  guestReply(text) {
    const low = String(text).toLowerCase();
    if (low.includes('castbreeder') || low.includes('пират') || low.includes('горбушк') || low.includes('фейк') || low.includes('junkie')) {
      return 'Проверьте свою кассету в разделе «Анти-Фейк»: детектор раскрывает, кто на самом деле записал каждый трек.';
    }
    if (low.includes('сэмпл') || low.includes('w-30') || low.includes('akai') || low.includes('smack') || low.includes('voodoo')) {
      return 'Все источники сэмплов и железо Лиама лежат в «Лаборатории сэмплов», там же можно набить свой паттерн.';
    }
    if (low.includes('манеж') || low.includes('250 000') || low.includes('1997')) {
      return 'Схема площади и сет-лист по минутам собраны в разделе «Манежка». Расскажите, где стояли вы!';
    }
    if (low.includes('лирой') || low.includes('flightcrank')) {
      return 'Лирой Торнхилл занят сольным проектом Flightcrank. Подробности в новостях бункера.';
    }
    if (low.includes('новый альбом') || low.includes('2000')) {
      return 'Официальной даты нового альбома нет. Всё, что продают как «новый альбом 1999 года», проверяйте в «Анти-Фейке».';
    }
    if (low.includes('fire') || low.includes('рейв')) {
      return 'Fire! Fire! Заходите в бункер ещё.';
    }
    return '';
  }

  addGuestbookEntry(entry) {
    const text = String(entry.text || '').trim();
    if (!text) return this.allGuestbook();
    const favs = this.data.favAlbums || [];
    const user = this.loadUser();
    user.guestbook.push({
      name: (String(entry.name || '').trim() || 'Рейвер').slice(0, 40),
      city: String(entry.from || '').trim().slice(0, 40),
      contact: String(entry.contact || '').trim().slice(0, 50),
      date: this.clock(),
      fav: favs.includes(entry.fav) ? entry.fav : '',
      msg: text.slice(0, 700),
      reply: this.guestReply(text)
    });
    this.saveUser(user);
    return this.allGuestbook();
  }

  renderGuestbook() {
    const list = this.allGuestbook();
    return `
      <h1 class="prd-h1">Гостевая книга рейверов</h1>
      <p>Оставляйте приветы, истории с Манежки и находки с Горбушки. Вебмастер читает книгу каждую ночь.</p>
      <div class="prd-gb-form">
        <table cellspacing="0" cellpadding="3">
          <tr><td>Ник:</td><td><input type="text" id="prd-gb-name" size="22" maxlength="40"></td>
              <td>Город:</td><td><input type="text" id="prd-gb-from" size="18" maxlength="40"></td></tr>
          <tr><td>E-mail / ICQ:</td><td><input type="text" id="prd-gb-contact" size="22" maxlength="50"></td>
              <td>Любимый альбом:</td><td>
                <select id="prd-gb-fav">
                  <option value="">не выбран</option>
                  ${(this.data.favAlbums || []).map(l => `<option value="${this.esc(l)}">${this.esc(l)}</option>`).join('')}
                </select></td></tr>
          <tr><td valign="top">Запись:</td><td colspan="3"><textarea id="prd-gb-text" rows="5" cols="56" maxlength="700"></textarea></td></tr>
          <tr><td></td><td colspan="3"><button class="prd-btn" data-prd-gb="1">Оставить запись</button></td></tr>
        </table>
      </div>
      <p class="prd-small">Всего записей в книге: ${list.length}</p>
      ${list.map(e => `
        <div class="prd-gb-entry">
          <div class="prd-gb-head">
            <b>${this.esc(e.name)}</b>${e.city ? `, ${this.esc(e.city)}` : ''}
            ${e.contact ? `<span class="prd-small">(${this.esc(e.contact)})</span>` : ''}
            <span class="prd-gb-date">${this.esc(e.date)}</span>
          </div>
          ${e.fav ? `<div class="prd-small">Любимый альбом: ${this.esc(e.fav)}</div>` : ''}
          <div class="prd-gb-text">${this.esc(e.msg)}</div>
          ${e.reply ? `<div class="prd-gb-reply"><b>Вебмастер:</b> ${this.esc(e.reply)}</div>` : ''}
        </div>`).join('')}`;
  }

  articleText(art) {
    if (!art) return '';
    return [
      'THE PRODIGY \'99 :: RUSSIAN RAVE BUNKER  http://www.prodigy99.ru',
      '='.repeat(64),
      `${art.date}  [${art.cat}]`,
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
    return `PRD_JC_${this.fileId(a.id)}.TXT`;
  }

  jcardText(a) {
    if (!a) return '';
    const width = 60;
    const line = '+' + '-'.repeat(width) + '+';
    const row = s => '| ' + String(s).slice(0, width - 2).padEnd(width - 2, ' ') + ' |';
    const tracks = a.tracks.map(t => {
      const left = `${String(t.num).padStart(2, ' ')}. ${t.title}`;
      return row(left.slice(0, width - 9).padEnd(width - 9, ' ') + String(t.duration).padStart(7, ' '));
    });
    return [
      'ВКЛАДЫШ ДЛЯ КАССЕТЫ. THE PRODIGY \'99, http://www.prodigy99.ru',
      '',
      line,
      row(`THE PRODIGY :: ${a.title}`),
      row(`${a.year}, ${a.label}`),
      line,
      ...tracks,
      line,
      ...a.credits.map(c => row(c)),
      line,
      '',
      'Печатать моноширинным шрифтом Courier New, вырезать по рамке.'
    ].join('\r\n');
  }

  sampleText(s) {
    if (!s) return '';
    return [
      'ЛАБОРАТОРИЯ СЭМПЛОВ  http://www.prodigy99.ru',
      '='.repeat(64),
      `${s.trackTitle} :: ${s.albumTitle}`,
      `Железо: ${s.samplerGear}`,
      '-'.repeat(64),
      ...s.sources.map(x => `${x.part}: ${x.original}`),
      '='.repeat(64)
    ].join('\r\n');
  }

  docFor(spec) {
    const [type, id] = String(spec || '').split(':');
    if (type === 'article') {
      const art = this.article(id);
      return art ? { file: this.articleFile(art), text: this.articleText(art) } : null;
    }
    if (type === 'album') {
      const a = this.album(id);
      return a ? { file: this.albumFile(a), text: this.jcardText(a) } : null;
    }
    if (type === 'pirates') return { file: this.piratesFile(), text: this.piratesText() };
    if (type === 'beat') return { file: this.beatFile(), text: this.beatText() };
    if (type === 'manezhka') return { file: this.manezhkaFile(), text: this.manezhkaText() };
    if (type === 'sample') {
      const s = this.sample(id);
      return s ? { file: `PRD_SMP_${this.fileId(s.id.replace(/^smp-/, ''))}.TXT`, text: this.sampleText(s) } : null;
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

  audio() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      if (!this._audioCtx) this._audioCtx = new AudioCtx();
      if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
      return this._audioCtx;
    } catch (e) {
      return null;
    }
  }

  tone(ctx, { type, from, to, start, length, volume, filter }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    if (to && to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + length);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + length);
    let tail = osc;
    if (filter) {
      const biq = ctx.createBiquadFilter();
      biq.type = 'lowpass';
      biq.Q.value = filter.q;
      biq.frequency.setValueAtTime(filter.from, start);
      biq.frequency.exponentialRampToValueAtTime(filter.to, start + length);
      osc.connect(biq);
      tail = biq;
    }
    tail.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + length + 0.02);
    this._nodes.push(osc);
  }

  noise(ctx, start, length, volume) {
    const size = Math.max(1, Math.floor(ctx.sampleRate * length));
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + length);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(start);
    this._nodes.push(src);
  }

  playPadSound(ctx, kind, start) {
    if (kind === 'bass') {
      this.tone(ctx, { type: 'sine', from: 95, to: 38, start, length: 0.45, volume: 0.4 });
      this.tone(ctx, { type: 'square', from: 55, to: 50, start, length: 0.3, volume: 0.05 });
    } else if (kind === 'break') {
      this.tone(ctx, { type: 'sine', from: 160, to: 50, start, length: 0.12, volume: 0.35 });
      this.noise(ctx, start, 0.16, 0.22);
    } else if (kind === 'acid') {
      this.tone(ctx, { type: 'sawtooth', from: 110, start, length: 0.4, volume: 0.14, filter: { q: 14, from: 300, to: 2600 } });
    } else if (kind === 'siren') {
      this.tone(ctx, { type: 'sawtooth', from: 600, to: 1200, start, length: 0.5, volume: 0.07 });
      this.tone(ctx, { type: 'sawtooth', from: 1200, to: 600, start: start + 0.5, length: 0.5, volume: 0.07 });
    }
  }

  playPad(kind) {
    if (!this.padKinds.includes(kind)) return null;
    const ctx = this.audio();
    if (ctx) {
      try { this.playPadSound(ctx, kind, ctx.currentTime); } catch (e) {}
    }
    this.addPadHit(kind);
    return kind;
  }

  playPattern() {
    const pattern = this.loadUser().pattern;
    this.stopSynth();
    if (!pattern.length) return null;
    this.synthPlayingId = 'pattern';
    const ctx = this.audio();
    if (!ctx) return pattern;
    try {
      const step = 0.25;
      const t0 = ctx.currentTime + 0.05;
      pattern.forEach((k, i) => this.playPadSound(ctx, k, t0 + i * step));
      this._endTimer = setTimeout(() => this.stopSynth(), Math.round((pattern.length * step + 1.2) * 1000));
    } catch (e) {}
    return pattern;
  }

  playSynth(id) {
    const files = this.data.midi || [];
    const tune = files.find(f => f.id === id) || files[0];
    this.stopSynth();
    if (!tune) return null;
    this.synthPlayingId = tune.id;
    const ctx = this.audio();
    if (!ctx) return tune;
    try {
      const beat = 60 / tune.bpm;
      const t0 = ctx.currentTime + 0.05;
      let t = t0;
      for (let round = 0; round < 2; round++) {
        tune.notes.forEach(([freq, len]) => {
          this.tone(ctx, { type: tune.wave, from: freq, start: t, length: len * 0.95, volume: 0.07 });
          t += len;
        });
      }
      for (let k = t0; k < t; k += beat) {
        this.tone(ctx, { type: 'sine', from: 140, to: 45, start: k, length: 0.12, volume: 0.12 });
      }
      this._endTimer = setTimeout(() => this.stopSynth(), Math.round((t - t0 + 0.4) * 1000));
    } catch (e) {}
    return tune;
  }

  stopSynth() {
    if (this._endTimer) {
      clearTimeout(this._endTimer);
      this._endTimer = null;
    }
    this._nodes.forEach(n => {
      try { n.stop(); } catch (e) {}
    });
    this._nodes = [];
    this.synthPlayingId = null;
  }

  attachEvents(win, container, ie) {
    const root = (typeof container.querySelector === 'function' && container.querySelector('.prd-site')) || container;
    const path = (root.dataset && root.dataset.prdPath) || '/';
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
        ? e.target.closest('[data-prd-enc],[data-prd-midi],[data-prd-stop],[data-prd-poll],[data-prd-notepad],[data-prd-save],[data-prd-comment],[data-prd-gb],[data-prd-clippy],[data-prd-pad],[data-prd-playpat],[data-prd-clearpat],[data-prd-scan],[data-prd-winamp],[data-prd-m3u],[data-prd-fav],[data-prd-top]')
        : null;
      if (!t) return;
      const d = t.dataset;
      if (d.prdTop) {
        container.scrollTop = 0;
      } else if (d.prdFav) {
        say('Адрес бункера: http://www.prodigy99.ru. Запишите его на флаере и заходите ещё!');
        sound('playDing');
        rerender();
        container.scrollTop = 0;
      } else if (d.prdEnc) {
        this.encoding = ['win1251', 'koi8', 'translit'].includes(d.prdEnc) ? d.prdEnc : 'win1251';
        sound('playClick');
        rerender();
      } else if (d.prdPad) {
        this.playPad(d.prdPad);
        rerender();
      } else if (d.prdPlaypat) {
        this.playPattern();
        rerender();
      } else if (d.prdClearpat) {
        this.stopSynth();
        this.clearPattern();
        sound('playClick');
        rerender();
      } else if (d.prdScan) {
        this.scanFake(d.prdScan);
        say('Анализ завершён: подделка разоблачена.');
        sound('playDing');
        rerender();
      } else if (d.prdWinamp) {
        const track = this.sendToWinamp(d.prdWinamp);
        if (track) {
          say(`Трек «${track.title}» отправлен в плеер Winamp.`);
          sound('playDing');
          rerender();
        }
      } else if (d.prdM3u) {
        const file = this.saveM3u();
        say(`Плейлист ${file} сохранён в «Мои документы», первые треки уже в Winamp.`);
        sound('playDing');
        rerender();
      } else if (d.prdMidi) {
        this.playSynth(d.prdMidi);
        rerender();
      } else if (d.prdStop) {
        this.stopSynth();
        sound('playClick');
        rerender();
      } else if (d.prdPoll) {
        const checked = typeof root.querySelector === 'function' ? root.querySelector('input[name="prd-poll"]:checked') : null;
        this.savePollVote(checked ? checked.value : '');
        say('Спасибо, ваш голос учтён.');
        sound('playDing');
        rerender();
      } else if (d.prdNotepad) {
        this.openDoc(d.prdNotepad);
      } else if (d.prdSave) {
        const file = this.saveDoc(d.prdSave);
        if (file) {
          say(`Файл ${file} сохранён в папку «Мои документы».`);
          sound('playDing');
          rerender();
        }
      } else if (d.prdComment) {
        if (!value('#prd-c-text').trim()) return;
        this.addComment(d.prdComment, value('#prd-c-name'), value('#prd-c-text'));
        say('Отклик добавлен.');
        sound('playDing');
        rerender();
      } else if (d.prdGb) {
        if (!value('#prd-gb-text').trim()) {
          say('Напишите сообщение, пустую запись не сохранить.');
          rerender();
          return;
        }
        this.addGuestbookEntry({
          name: value('#prd-gb-name'),
          from: value('#prd-gb-from'),
          contact: value('#prd-gb-contact'),
          fav: value('#prd-gb-fav'),
          text: value('#prd-gb-text')
        });
        say('Запись добавлена в гостевую книгу.');
        sound('playDing');
        rerender();
      } else if (d.prdClippy) {
        if (typeof window !== 'undefined' && window.appClippy) {
          window.appClippy.show();
          window.appClippy._lastIePageKey = null;
          window.appClippy.onNavigateIE(ie.currentUrl || this.baseUrl, 'prodigy', "The Prodigy '99");
        }
      }
    });
  }
}

window.prodigySite = new ProdigySite();
