class AnimatrixSite {
  constructor() {
    this.baseUrl = 'http://www.animatrix99.ru';
    this.userKey = 'win98_animatrix_user_v2';
    this.hitKey = 'win98_animatrix_hits_v1';
    this.legacyKeys = {
      poll: 'win98_animatrix_poll_v1',
      tapeVotes: 'win98_animatrix_tapevotes_v1',
      comments: 'win98_animatrix_comments_v1',
      guestbook: 'win98_animatrix_guestbook_v1'
    };
    this.encoding = 'win1251';
    this.transcription = 'polivanov';
    this.notice = null;
    this.hitCount = 0;
    this.initHits();
  }

  get data() {
    return (typeof window !== 'undefined' && window.animatrixData) || {};
  }

  store() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) {}
    return null;
  }

  initHits() {
    const ls = this.store();
    let count = 28412;
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
      count = 28413;
    }
    this.hitCount = count;
  }

  emptyUser() {
    return { guestbook: [], comments: {}, poll: null, queue: {}, ads: [], torn: {} };
  }

  normalizeUser(raw) {
    const user = this.emptyUser();
    if (!raw || typeof raw !== 'object') return user;
    if (Array.isArray(raw.guestbook)) user.guestbook = raw.guestbook.filter(e => e && typeof e === 'object');
    if (raw.comments && typeof raw.comments === 'object') {
      Object.keys(raw.comments).forEach(id => {
        if (Array.isArray(raw.comments[id])) user.comments[id] = raw.comments[id].filter(c => Array.isArray(c));
      });
    }
    if (typeof raw.poll === 'string') user.poll = raw.poll;
    if (raw.queue && typeof raw.queue === 'object') {
      Object.keys(raw.queue).forEach(id => {
        if (typeof raw.queue[id] === 'string') user.queue[id] = raw.queue[id];
      });
    }
    if (Array.isArray(raw.ads)) user.ads = raw.ads.filter(a => a && typeof a === 'object');
    if (raw.torn && typeof raw.torn === 'object') {
      Object.keys(raw.torn).forEach(id => {
        const n = parseInt(raw.torn[id], 10);
        if (!isNaN(n) && n > 0) user.torn[id] = n;
      });
    }
    return user;
  }

  loadUser() {
    const ls = this.store();
    if (!ls) return this.emptyUser();
    try {
      const raw = ls.getItem(this.userKey);
      if (raw) return this.normalizeUser(JSON.parse(raw));
    } catch (e) {
      return this.emptyUser();
    }
    return this.migrateLegacy();
  }

  migrateLegacy() {
    const user = this.emptyUser();
    const ls = this.store();
    if (!ls) return user;
    try {
      const list = JSON.parse(ls.getItem(this.legacyKeys.guestbook) || '[]');
      if (Array.isArray(list)) {
        list.filter(e => e && String(e.id || '').startsWith('gb-user-')).reverse().forEach(e => {
          user.guestbook.push({
            name: String(e.name || '').slice(0, 40),
            from: String(e.city || '').slice(0, 40),
            contact: String(e.contact || '').slice(0, 60),
            fav: '',
            date: String(e.date || `${this.data.siteDay} 12:00`).slice(0, 16),
            text: String(e.text || '').slice(0, 800)
          });
        });
      }
    } catch (e) {}
    try {
      const all = JSON.parse(ls.getItem(this.legacyKeys.comments) || '{}');
      const ids = (this.data.articles || []).map(a => a.id);
      if (all && typeof all === 'object') {
        Object.keys(all).filter(id => ids.includes(id) && Array.isArray(all[id])).forEach(id => {
          user.comments[id] = all[id]
            .filter(c => c && c.body)
            .map(c => [String(c.author || 'Гость').slice(0, 40), this.data.siteDay, String(c.body).slice(0, 800)]);
        });
      }
    } catch (e) {}
    try {
      const poll = JSON.parse(ls.getItem(this.legacyKeys.poll) || 'null');
      const keys = ((this.data.poll || {}).options || []).map(o => o[0]);
      if (poll && keys.includes(poll.voted)) user.poll = poll.voted;
    } catch (e) {}
    try {
      Object.values(this.legacyKeys).forEach(k => ls.removeItem(k));
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

  tt(str) {
    return this.esc(str).replace(/`([^`]+)`/g, '<tt>$1</tt>');
  }

  keep(str) {
    return `<span class="amx-keep">${this.esc(str)}</span>`;
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
    return `<a${cls ? ` class="${cls}"` : ''} data-url="${this.esc(this.url(path))}">${label}</a>`;
  }

  outLink(href, label) {
    return `<a data-url="${this.esc(href)}">${label}</a>`;
  }

  tape(id) {
    return (this.data.tapes || []).find(t => t.id === id) || null;
  }

  article(id) {
    return (this.data.articles || []).find(a => a.id === id) || null;
  }

  scene(id) {
    const list = this.data.fansubScenes || [];
    return list.find(s => s.id === id) || list[0];
  }

  parseRoute(url = '') {
    const raw = String(url || this.baseUrl).trim();
    const noProto = raw.replace(/^[a-z]+:\/{2}/i, '');
    const qIdx = noProto.indexOf('?');
    const hIdx = noProto.indexOf('#');
    const cuts = [qIdx, hIdx].filter(i => i >= 0);
    const pathEnd = cuts.length ? Math.min(...cuts) : noProto.length;
    const hostAndPath = noProto.slice(0, pathEnd);
    const slash = hostAndPath.indexOf('/');
    let path = (slash >= 0 ? hostAndPath.slice(slash) : '/').replace(/\/+$/, '') || '/';
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
    const legacyArticle = path.match(/^\/article\/([a-z0-9-]+)$/i);
    if (legacyArticle) {
      params.id = legacyArticle[1];
      path = '/article';
    }
    path = path.replace(/\/index\.html?$/i, '') || '/';
    const routes = {
      '/': 'home',
      '/main.html': 'home',
      '/catalog': 'catalog',
      '/tape': 'tape',
      '/fansub': 'fansub',
      '/articles': 'articles',
      '/chronicle': 'articles',
      '/article': 'article',
      '/clubs': 'clubs',
      '/world': 'clubs',
      '/swap': 'swap',
      '/club': 'swap',
      '/guestbook': 'guestbook',
      '/polivanov': 'polivanov'
    };
    return { page: routes[path.toLowerCase()] || '404', path, params };
  }

  getPageTitle(url) {
    const route = this.parseRoute(url);
    const titles = {
      home: 'АниМатрица \'99 :: аниме-узел, клубный фонд и фансаб',
      catalog: 'АниМатрица \'99 :: клубный фонд',
      fansub: 'АниМатрица \'99 :: фансаб-архив NERV-Sub',
      articles: 'АниМатрица \'99 :: статьи',
      clubs: 'АниМатрица \'99 :: явки',
      swap: 'АниМатрица \'99 :: доска обмена',
      guestbook: 'АниМатрица \'99 :: гостевая книга',
      polivanov: 'АниМатрица \'99 :: Поливанов и фансаб-сленг'
    };
    if (route.page === 'tape') {
      const t = this.tape(route.params.id);
      return t ? `АниМатрица '99 :: ${t.no} ${t.title}` : '404 Not Found';
    }
    if (route.page === 'article') {
      const a = this.article(route.params.id);
      return a ? `АниМатрица '99 :: ${a.title}` : '404 Not Found';
    }
    return titles[route.page] || '404 Not Found';
  }

  renderSite(url = '') {
    const route = this.parseRoute(url);
    const pages = {
      home: () => this.renderHome(),
      catalog: () => this.renderCatalog(route.params),
      tape: () => this.renderTape(route.params.id),
      fansub: () => this.renderFansub(route.params),
      articles: () => this.renderArticles(route.params),
      article: () => this.renderArticle(route.params.id),
      clubs: () => this.renderClubs(route.params),
      swap: () => this.renderSwap(),
      guestbook: () => this.renderGuestbook(),
      polivanov: () => this.renderPolivanov(route.params)
    };
    const body = pages[route.page] ? pages[route.page]() : null;
    if (body === null) return this.render404(route.path);
    const ownSpelling = route.page === 'polivanov';
    const slot = '<span class="amx-keep">AMX-BODY-SLOT</span>';
    const html = `
      <div class="amx-site" data-amx-path="${this.esc(route.path)}">
        <table class="amx-shell" width="760" cellspacing="0" cellpadding="0" align="center">
          <tr><td>${this.renderFrame(route)}</td></tr>
          <tr><td>${this.renderNav(route.page)}</td></tr>
          <tr><td>${this.renderSwitches()}</td></tr>
          <tr><td class="amx-body">${this.renderNotice(route.path)}${ownSpelling ? slot : body}</td></tr>
          <tr><td>${this.renderFooter()}</td></tr>
        </table>
      </div>`;
    const spelled = this.applyTranscription(html);
    return this.encodeHtml(ownSpelling ? spelled.replace(slot, () => body) : spelled);
  }

  render404(path) {
    return `
      <div class="amx-site amx-raw">
        <h1>Not Found</h1>
        <p>The requested URL ${this.esc(path)} was not found on this server.</p>
        <hr>
        <address>Apache/1.3.9 Server at www.animatrix99.ru Port 80</address>
      </div>`;
  }

  renderNotice(path) {
    if (!this.notice || this.notice.path !== path) return '';
    const text = this.notice.text;
    this.notice = null;
    return `<div class="amx-notice">${this.gif('check')} ${this.esc(text)}</div>`;
  }

  applyTranscription(html) {
    if (this.transcription !== 'slang99') return html;
    const pairs = this.data.slangPairs || [];
    return String(html).split(/(<span class="amx-keep">[^<]*<\/span>)/).map(part => {
      if (part.startsWith('<span class="amx-keep">')) return part;
      return part.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, txt) => {
        if (tag || !txt) return m;
        let out = txt;
        pairs.forEach(([from, to]) => { out = out.replace(new RegExp(`(?<!«)${from}`, 'g'), to); });
        return out;
      });
    }).join('');
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

  frameLines(route) {
    const frames = this.data.frames || {};
    const page = route.page;
    const base = frames[page] || frames.home || ['0:00:00', '', ''];
    if (page === 'tape') {
      const t = this.tape(route.params.id);
      if (t) return [base[0], `${t.no}. ${t.title}`, this.tapeStatus(t)];
    }
    if (page === 'article') {
      const a = this.article(route.params.id);
      if (a) return [base[0], a.title, `${a.author}, ${a.date}`];
    }
    return base;
  }

  subText(x, y, text) {
    if (!text) return '';
    const long = text.length > 50 ? ' textLength="700" lengthAdjust="spacingAndGlyphs"' : '';
    const attrs = `x="${x}" y="${y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="bold"${long}`;
    return `<text ${attrs} fill="#000000" stroke="#000000" stroke-width="5" stroke-linejoin="round">${this.esc(text)}</text>
          <text ${attrs} fill="#ffff00">${this.esc(text)}</text>`;
  }

  renderFrame(route) {
    const [tc, line1, line2] = this.frameLines(route);
    const nav = (this.data.nav || []).find(n => n[0] === ({ tape: 'catalog', article: 'articles' }[route.page] || route.page));
    const ch = nav ? nav[1] : '1';
    const wires = [
      'M -10 52 Q 130 84 300 58 Q 470 88 770 50',
      'M -10 60 Q 130 94 300 66 Q 470 98 770 58',
      'M -10 70 Q 130 104 300 76 Q 470 108 770 68',
      'M 300 58 Q 380 118 470 64'
    ];
    return `
      <a data-url="${this.url('/')}" class="amx-frame-link">
        <svg class="amx-frame" width="760" height="200" viewBox="0 0 760 200" role="img" aria-label="АниМатрица 99. ${this.esc(line1)}">
          <rect width="760" height="200" fill="#000000"/>
          <rect y="12" width="760" height="34" fill="#663366"/>
          <rect y="46" width="760" height="30" fill="#996699"/>
          <rect y="76" width="760" height="26" fill="#cc6666"/>
          <rect y="102" width="760" height="24" fill="#ff9966"/>
          <circle cx="590" cy="122" r="30" fill="#ff3300"/>
          <polygon points="0,200 0,132 40,132 40,118 70,104 100,118 100,132 160,132 160,124 230,124 230,140 300,140 300,114 330,98 360,114 360,140 430,140 430,126 520,126 520,110 560,110 560,136 640,136 640,120 700,120 700,138 760,138 760,200" fill="#330033"/>
          <rect x="54" y="122" width="8" height="8" fill="#ffcc66"/>
          <rect x="318" y="122" width="8" height="8" fill="#ffcc66"/>
          <rect x="536" y="120" width="8" height="8" fill="#ffcc66"/>
          <g fill="#000000">
            <rect x="296" y="30" width="8" height="170"/>
            <rect x="270" y="50" width="60" height="5"/>
            <rect x="276" y="62" width="48" height="4"/>
            <rect x="466" y="40" width="8" height="160"/>
            <rect x="440" y="56" width="60" height="5"/>
            <rect x="476" y="72" width="22" height="30"/>
            <rect x="480" y="66" width="14" height="6"/>
          </g>
          <g fill="none" stroke="#000000" stroke-width="2">
            ${wires.map(d => `<path d="${d}"/>`).join('')}
          </g>
          <rect width="760" height="12" fill="#000000"/>
          <rect y="188" width="760" height="12" fill="#000000"/>
          <g font-family="'Courier New', Courier, monospace" font-weight="bold" font-size="13" fill="#ffffff">
            <text x="16" y="34">PLAY &#9658;</text>
            <text x="16" y="52">CH 0${this.esc(ch)}</text>
            <text x="744" y="34" text-anchor="end">SP</text>
            <text x="744" y="52" text-anchor="end">${this.esc(tc)}</text>
          </g>
          <g font-family="Impact, 'Arial Black', sans-serif" text-anchor="middle">
            <text x="380" y="98" font-size="50" fill="#000000" stroke="#000000" stroke-width="6" stroke-linejoin="round" textLength="420" lengthAdjust="spacingAndGlyphs">АНИМАТРИЦА ’99</text>
            <text x="380" y="98" font-size="50" fill="#ffffff" textLength="420" lengthAdjust="spacingAndGlyphs">АНИМАТРИЦА ’99</text>
          </g>
          <text x="380" y="118" text-anchor="middle" font-family="'MS Gothic', 'Courier New', monospace" font-size="12" fill="#ffffff">アニマトリクス 1999</text>
          ${this.subText(380, line2 ? 156 : 172, line1)}
          ${this.subText(380, 178, line2)}
        </svg>
      </a>`;
  }

  renderNav(page) {
    const active = { tape: 'catalog', article: 'articles' }[page] || page;
    return `
      <table class="amx-keys" width="760" cellspacing="0" cellpadding="0">
        <tr>
          ${(this.data.nav || []).map(([key, num, label, path]) => `
            <td class="${active === key ? 'amx-key amx-key-on' : 'amx-key'}">
              <a data-url="${this.url(path)}"><span class="amx-key-num">${num}</span> ${label}</a>
            </td>`).join('')}
        </tr>
      </table>`;
  }

  renderSwitches() {
    const enc = [['win1251', 'WIN'], ['koi8', 'KOI'], ['translit', 'LAT']].map(([key, label]) =>
      this.encoding === key ? `<b>${label}</b>` : `<a data-amx-enc="${key}">${label}</a>`).join(' | ');
    const names = [['polivanov', 'по Поливанову', 'Синдзи, Кэнсин'], ['slang99', 'фансаб-сленг', 'Шинжи, Кеншин']].map(([key, label, hint]) =>
      this.transcription === key
        ? `<b>${label}</b> <span class="amx-hint">(${this.keep(hint)})</span>`
        : `<a data-amx-names="${key}">${label}</a> <span class="amx-hint">(${this.keep(hint)})</span>`).join(' | ');
    return `
      <table class="amx-switches" width="760" cellspacing="0" cellpadding="0">
        <tr>
          <td>Кодировка: ${enc}</td>
          <td align="right">Имена: ${names}</td>
        </tr>
      </table>`;
  }

  renderFooter() {
    const ring = typeof window !== 'undefined' && window.retroSites && typeof window.retroSites.renderWebRing === 'function'
      ? window.retroSites.renderWebRing(this.baseUrl)
      : '';
    const digits = String(this.hitCount).padStart(6, '0').split('').map(d => `<span>${d}</span>`).join('');
    const staff = (this.data.staff || []).map(([nick, , role, href]) =>
      `${href ? this.outLink(href, this.esc(nick)) : `<b>${this.esc(nick)}</b>`} (${this.esc(role)})`).join(', ');
    return `
      <div class="amx-footer">
        <p class="amx-footer-links">${(this.data.nav || []).map(([, , label, path]) => this.link(path, label)).join(' | ')}</p>
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td class="amx-footer-count">
              Вы посетитель №<br>
              <div class="amx-counter" title="Считаем с ${this.esc(this.data.founded)}">${digits}</div>
            </td>
            <td class="amx-footer-88">
              <a class="amx-88 amx-88-rambler" data-url="http://www.rambler98.ru">RAMBLER<br>TOP 100</a>
              <a class="amx-88 amx-88-kino" data-url="http://www.kinomania98.ru">Киномания<br>’98</a>
              <a class="amx-88 amx-88-wc" data-url="http://www.webcinema98.com">WebCinema<br>’98</a>
              <a class="amx-88 amx-88-digi" data-url="http://www.digicharat.net">Di Gi<br>Charat</a>
              <a class="amx-88 amx-88-fido" data-url="http://fido.relcom.ru">RU.ANIME<br>2:5020</a>
            </td>
          </tr>
        </table>
        <p>Узел ведут: ${staff}. Пишите: <a href="mailto:webmaster@animatrix99.ru">webmaster@animatrix99.ru</a>. Нашли ошибку в дате или в имени, напишите в ${this.link('/guestbook', 'гостевую')}.</p>
        <p class="amx-small">Узел некоммерческий: кассеты не продаём, только меняемся и переписываем. Лучше всего смотреть в Microslop Internet Explorer 5.0 при 800x600. Обновлено ${this.esc(this.data.siteDay)}. <a data-amx-clippy="1">Спросить Скрепыша</a></p>
        ${ring}
      </div>`;
  }

  queueFor(t) {
    const user = this.loadUser();
    const list = (t.queue || []).slice();
    if (user.queue[t.id]) list.push(user.queue[t.id]);
    return list;
  }

  tapeStatus(t) {
    if (!t.holder) return 'На полке, можно брать в субботу.';
    return `На руках: ${t.holder}, ${t.due}.`;
  }

  tapeMinutes(t) {
    return (t.reels || []).reduce((sum, r) => sum + r.parts.reduce((s, p) => s + p[1], 0), 0);
  }

  duration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h} ч ${String(m).padStart(2, '0')} мин` : `${m} мин`;
  }

  counter(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${String(m).padStart(2, '0')}:00`;
  }

  reelRows(reel) {
    let at = 0;
    return reel.parts.map(([label, min]) => {
      const row = [this.counter(at), label, min];
      at += min;
      return row;
    });
  }

  renderHome() {
    const d = this.data;
    const user = this.loadUser();
    const week = this.tape('kenshin-ova-99');
    const poll = d.poll || { q: '', options: [] };
    const counts = poll.options.map(o => o[2] + (user.poll === o[0] ? 1 : 0));
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    const pollBody = user.poll
      ? poll.options.map((o, i) => {
        const pct = Math.round(counts[i] * 100 / total);
        return `
          <tr>
            <td class="amx-poll-label">${user.poll === o[0] ? '<b>' + this.esc(o[1]) + '</b>' : this.esc(o[1])}</td>
            <td class="amx-poll-num">${pct}%</td>
          </tr>
          <tr><td colspan="2"><div class="amx-poll-bar"><div style="width:${pct}%"></div></div></td></tr>`;
      }).join('') + `<tr><td colspan="2" class="amx-small">Всего голосов: ${total}. Вы уже проголосовали.</td></tr>`
      : poll.options.map((o, i) => `
          <tr><td colspan="2"><label><input type="radio" name="amx-poll" value="${o[0]}"${i === 0 ? ' checked' : ''}> ${this.esc(o[1])}</label></td></tr>`).join('') +
        '<tr><td colspan="2"><button type="button" class="amx-btn" data-amx-poll="1">Голосовать</button></td></tr>';

    return `
      <table class="amx-home" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="amx-home-main" valign="top">
            <p class="amx-hello">Привет! Это узел московских и не только любителей японской анимации. Мы меняемся кассетами, делаем русские титры и пишем о том, что смотрим. Здесь лежат каталог нашего фонда, скрипты <tt>.SSA</tt> и расписание показов. Сегодня ${this.esc(d.siteWeekday)}, ${this.esc(d.siteDay)}, до 2000 года три дня.</p>
            <h2 class="amx-h2">Что нового</h2>
            <table class="amx-log" width="100%" cellspacing="0" cellpadding="0">
              ${(d.updates || []).map(([date, text, path]) => `
                <tr>
                  <td class="amx-log-date">${this.esc(date)}</td>
                  <td>${date === d.siteDay ? this.gif('new') + ' ' : ''}${this.link(path, this.esc(text))}</td>
                </tr>`).join('')}
            </table>
          </td>
          <td class="amx-home-side" valign="top">
            <div class="amx-week">
              <div class="amx-week-head">Кассета недели</div>
              ${this.renderSticker(week, 'small')}
              <p>${this.link('/tape?id=' + week.id, this.esc(week.title))}. Все четыре акта, наши титры. В очереди ${this.queueFor(week).length} чел.</p>
            </div>
            <div class="amx-poll">
              <div class="amx-poll-q">${this.esc(poll.q)}</div>
              <table width="100%" cellspacing="0" cellpadding="2">${pollBody}</table>
            </div>
          </td>
        </tr>
      </table>
      <div class="amx-tvguide">
        <div class="amx-tvguide-head">Показы до 9 января</div>
        <table width="100%" cellspacing="0" cellpadding="0">
          ${(d.screenings || []).map(([day, time, place, what, tapeId]) => `
            <tr>
              <td class="amx-tv-day">${this.esc(day)}</td>
              <td class="amx-tv-time">${this.esc(time)}</td>
              <td><b>${tapeId ? this.link('/tape?id=' + tapeId, this.esc(what)) : this.esc(what)}</b><br><span class="amx-tv-place">${this.esc(place)}</span></td>
            </tr>`).join('')}
        </table>
        <p class="amx-small">Как нас найти, смотрите в разделе ${this.link('/clubs', 'Явки')}.</p>
      </div>`;
  }

  renderSticker(t, size = '') {
    const reels = (t.reels || []).length;
    const first = ((t.reels || [])[0] || {}).name || '';
    const short = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
    const w = size ? 220 : 300;
    const h = size ? 132 : 180;
    const label = `${this.esc(t.no)} ${this.esc(short(t.title, 18))}`;
    const sub = `${this.esc(short(t.orig, 30))}${reels > 1 ? ` (1 из ${reels})` : ''}`;
    if (/VideoCD/.test(first)) {
      return `
      <svg class="amx-sticker ${size ? 'amx-sticker-' + size : ''}" width="${w}" height="${h}" viewBox="0 0 300 180" role="img" aria-label="Диск ${this.esc(t.no)}">
        <rect width="300" height="180" fill="#ccccff"/>
        <rect x="10" y="8" width="280" height="164" fill="#ffffff" stroke="#999999" stroke-width="2"/>
        <circle cx="150" cy="90" r="78" fill="#ffcc33" stroke="#cc9900" stroke-width="2"/>
        <circle cx="150" cy="90" r="60" fill="none" stroke="#ffff99" stroke-width="1"/>
        <circle cx="150" cy="90" r="20" fill="#ffffff" stroke="#cc9900" stroke-width="2"/>
        <circle cx="150" cy="90" r="8" fill="#ccccff"/>
        <text x="150" y="40" text-anchor="middle" font-family="'Comic Sans MS', cursive" font-size="16" fill="#000099">${label}</text>
        <text x="150" y="146" text-anchor="middle" font-family="'Comic Sans MS', cursive" font-size="11" fill="#000099">${sub}</text>
        <text x="150" y="162" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#663300">VideoCD  MPEG-1</text>
      </svg>`;
    }
    const tapeType = (first.match(/E-\d+/) || ['E-180'])[0];
    const brand = /S-VHS/.test(first) ? `S-VHS  ${tapeType}` : `TDK  ${tapeType}  HS`;
    return `
      <svg class="amx-sticker ${size ? 'amx-sticker-' + size : ''}" width="${w}" height="${h}" viewBox="0 0 300 180" role="img" aria-label="Кассета ${this.esc(t.no)}">
        <rect width="300" height="180" fill="#000000"/>
        <rect x="6" y="6" width="288" height="168" fill="#333333"/>
        <rect x="20" y="16" width="260" height="64" fill="#ffffff"/>
        <rect x="20" y="16" width="260" height="10" fill="#cc0000"/>
        <text x="26" y="24" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#ffffff">${brand}</text>
        <text x="274" y="24" text-anchor="end" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#ffffff">SP</text>
        <text x="28" y="46" font-family="'Comic Sans MS', cursive" font-size="16" fill="#000099">${label}</text>
        <text x="28" y="66" font-family="'Comic Sans MS', cursive" font-size="11" fill="#000099">${sub}</text>
        <rect x="60" y="96" width="180" height="56" fill="#000000"/>
        <circle cx="100" cy="124" r="20" fill="#333333" stroke="#666666" stroke-width="2"/>
        <circle cx="200" cy="124" r="20" fill="#333333" stroke="#666666" stroke-width="2"/>
        <circle cx="100" cy="124" r="6" fill="#ffffff"/>
        <circle cx="200" cy="124" r="6" fill="#ffffff"/>
        <rect x="130" y="112" width="40" height="24" fill="#663300"/>
      </svg>`;
  }

  renderCatalog(params) {
    const show = ['shelf', 'out', 'queue'].includes(params.show) ? params.show : 'all';
    const all = this.data.tapes || [];
    const list = all.filter(t => {
      if (show === 'shelf') return !t.holder;
      if (show === 'out') return !!t.holder;
      if (show === 'queue') return this.queueFor(t).length > 0;
      return true;
    });
    const reelsTotal = all.reduce((s, t) => s + (t.reels || []).length, 0);
    const filters = [['all', 'все'], ['shelf', 'на полке'], ['out', 'на руках'], ['queue', 'есть очередь']].map(([key, label]) =>
      show === key ? `<b>${label}</b>` : this.link(key === 'all' ? '/catalog' : `/catalog?show=${key}`, label)).join(' | ');
    return `
      <div class="amx-notebook">
        <h1 class="amx-hand-h">Клубный фонд</h1>
        <p class="amx-hand-p">Переписано из общей тетради ${this.esc(this.data.siteDay)}. В фонде ${all.length} названий на ${reelsTotal} кассетах и дисках. Кассета на руках неделю, до следующей субботы.</p>
        <p class="amx-hand-p">Показать: ${filters}</p>
        <table class="amx-ledger" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <th>№</th><th>Название</th><th>Кассеты</th><th>Копия</th><th>Перевод</th><th>Где сейчас</th><th>Очередь</th>
          </tr>
          ${list.map(t => {
            const q = this.queueFor(t);
            return `
            <tr>
              <td class="amx-ledger-no">${this.esc(t.no)}</td>
              <td>${this.link('/tape?id=' + t.id, '<b>' + this.esc(t.title) + '</b>')}<br><span class="amx-ledger-orig">${this.esc(t.orig)}</span></td>
              <td>${(t.reels || []).length} шт.<br><span class="amx-ledger-orig">${this.esc(this.duration(this.tapeMinutes(t)))}</span></td>
              <td>${this.esc(t.source)}</td>
              <td>${this.esc(t.subs)}</td>
              <td>${t.holder ? this.esc(t.holder) + '<br><span class="amx-ledger-orig">' + this.esc(t.due) + '</span>' : '<b class="amx-free">на полке</b>'}</td>
              <td>${q.length ? q.map(n => this.esc(n)).join('<br>') : '—'}</td>
            </tr>`;
          }).join('')}
        </table>
        ${list.length ? '' : '<p class="amx-hand-p">Ничего не нашлось, посмотрите весь фонд.</p>'}
      </div>
      <table width="100%" cellspacing="0" cellpadding="0" class="amx-howto">
        <tr>
          <td valign="top" class="amx-howto-steps">
            <h2 class="amx-h2">Как получить копию</h2>
            <ol>
              <li>Откройте страницу кассеты и запишитесь в очередь.</li>
              <li>Когда подойдёт ваша очередь, приходите в субботу в 14:00 к правой колонне Большого театра.</li>
              <li>Принесите свои чистые кассеты, сколько указано в карточке. Перепишем бесплатно.</li>
              <li>Или возьмите нашу копию на неделю под залог студенческого или 50 рублей.</li>
              <li>Верните в следующую субботу, перемотанной на начало.</li>
            </ol>
          </td>
          <td valign="top" class="amx-howto-prices">
            <h2 class="amx-h2">Почём носители</h2>
            <table width="100%" cellspacing="0" cellpadding="0" class="amx-prices">
              ${(this.data.prices || []).map(([what, price, where]) => `
                <tr><td>${this.esc(what)}<br><span class="amx-small">${this.esc(where)}</span></td><td class="amx-price">${this.esc(price)}</td></tr>`).join('')}
            </table>
          </td>
        </tr>
      </table>`;
  }

  renderTape(id) {
    const t = this.tape(id);
    if (!t) return this.renderMissing('Такой кассеты в фонде нет.', '/catalog', 'К каталогу фонда');
    const user = this.loadUser();
    const q = this.queueFor(t);
    const mine = user.queue[t.id];
    const queueBlock = mine
      ? `<p>Вы в очереди под ником <b>${this.esc(mine)}</b>, ваш номер ${q.length}. Когда кассета до вас дойдёт, приходите в субботу к правой колонне.</p>
         <button type="button" class="amx-btn" data-amx-unqueue="${t.id}">Выйти из очереди</button>`
      : `<p>Ник: <input type="text" class="amx-input" id="amx-queue-name" maxlength="30" size="18"> <button type="button" class="amx-btn" data-amx-queue="${t.id}">Записаться</button></p>`;
    const links = (t.links || []).map(([label, href]) => this.outLink(href, this.esc(label)));
    const related = (this.data.articles || []).filter(a => (a.tapes || []).includes(t.id));
    return `
      <p class="amx-crumbs">${this.link('/catalog', 'Клубный фонд')} &gt; ${this.esc(t.no)}</p>
      <table width="100%" cellspacing="0" cellpadding="0" class="amx-tape">
        <tr>
          <td valign="top" class="amx-tape-left">
            ${this.renderSticker(t)}
            ${(t.reels || []).map(reel => `
              <table class="amx-counter-table" width="300" cellspacing="0" cellpadding="0">
                <tr><th colspan="2">${this.esc(reel.name)}</th></tr>
                ${this.reelRows(reel).map(([at, label]) => `
                  <tr><td class="amx-ct">${at}</td><td>${this.esc(label)}</td></tr>`).join('')}
              </table>`).join('')}
            <p class="amx-small">Счётчик реального времени, от начала кассеты.</p>
          </td>
          <td valign="top" class="amx-tape-right">
            <h1 class="amx-h1">${this.esc(t.title)}</h1>
            <p class="amx-orig">${this.esc(t.orig)}</p>
            <table class="amx-pass" width="100%" cellspacing="0" cellpadding="0">
              <tr><th>Кто снял</th><td>${this.esc(t.made)}</td></tr>
              <tr><th>Эфир, прокат</th><td>${this.esc(t.aired)}</td></tr>
              <tr><th>Откуда копия</th><td>${this.esc(t.source)}</td></tr>
              <tr><th>Перевод</th><td>${this.esc(t.subs)}</td></tr>
              <tr><th>Принести</th><td>${this.esc(t.copy)}</td></tr>
            </table>
            <p>${this.esc(t.summary)}</p>
            <table class="amx-procon" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td valign="top"><b>За.</b> ${this.esc(t.pro[1])} <i>${this.esc(t.pro[0])}</i></td>
                <td valign="top"><b>Против.</b> ${this.esc(t.con[1])} <i>${this.esc(t.con[0])}</i></td>
              </tr>
            </table>
            <div class="amx-mini-tv">
              ${(t.sample || []).map(([tc, who, text]) => `<div><span class="amx-mini-tc">${this.esc(tc)}</span> ${this.esc(text)}</div>`).join('')}
            </div>
            <p class="amx-small">Из наших титров. Говорят: ${[...new Set((t.sample || []).map(s => s[1]))].map(s => this.esc(s)).join(', ')}.</p>
            <div class="amx-queue">
              <b>Где сейчас:</b> ${this.esc(this.tapeStatus(t))}<br>
              <b>Очередь:</b> ${q.length ? q.map(n => this.esc(n)).join(', ') : 'никого'}
              ${queueBlock}
            </div>
            <p><button type="button" class="amx-btn" data-amx-doc="tape:${t.id}">Карточку в Блокнот</button> <span class="amx-small">файл ${this.esc(t.file)}</span></p>
            ${links.length ? `<p>Ссылки: ${links.join(' | ')}</p>` : ''}
            ${related.length ? `<p>Статьи: ${related.map(a => this.link('/article?id=' + a.id, this.esc(a.title))).join('<br>')}</p>` : ''}
          </td>
        </tr>
      </table>`;
  }

  renderMissing(text, back, label) {
    return `<div class="amx-missing"><p>${this.esc(text)}</p><p>${this.link(back, label)}</p></div>`;
  }

  fansubParams(params) {
    const scene = this.scene(params.scene);
    const school = (this.data.schools || []).some(s => s[0] === params.school) ? params.school : 'polivanov';
    const color = (this.data.subColors || []).some(c => c[0] === params.color) ? params.color : 'yellow';
    return { scene, school, color };
  }

  renderFansub(params) {
    const { scene, school, color } = this.fansubParams(params);
    const variant = scene.variants[school] || scene.variants.polivanov;
    const colorRow = (this.data.subColors || []).find(c => c[0] === color);
    const ssa = this.buildSceneSsa(scene, school, color);
    const opt = (list, value) => list.map(([key, label]) => `<option value="${key}"${key === value ? ' selected' : ''}>${this.esc(label)}</option>`).join('');
    return `
      <h1 class="amx-h1">Фансаб-архив NERV-Sub ’99</h1>
      <p>Мы переводим аниме и делаем русские титры. Скрипты лежат здесь в формате SubStation Alpha (<tt>.SSA</tt>), кодировка Win-1251. Архивы маленькие и влезают на дискету. Скрипт нужно наложить на свою кассету с японской дорожкой: генлоком на видеомагнитофон или фильтром в VirtualDub.</p>
      <pre class="amx-listing">Index of /fansub/

 Имя файла        Размер  Дата        Версия  Что внутри
 ---------------  ------  ----------  ------  ----------------------------------------
${(this.data.scripts || []).map(s => {
  const t = this.tape(s.tape);
  const name = s.file.padEnd(15, ' ');
  const size = (s.kb + 'K').padStart(6, ' ');
  const what = `${t ? t.title : ''}, ${s.eps}`;
  return ` <a data-amx-pack="${this.esc(s.file)}">${this.esc(name)}</a>  ${size}  ${this.esc(s.date)}  ${this.esc(s.ver.padEnd(6, ' '))}  ${this.esc(what)}`;
}).join('\n')}

 Нажмите на имя файла: скрипт откроется в Блокноте и сохранится в C:\\My Documents.</pre>
      <table width="100%" cellspacing="0" cellpadding="0" class="amx-preview">
        <tr>
          <td valign="top" class="amx-preview-tv">
            <div class="amx-tv">
              <div class="amx-tv-osd"><span>PLAY &#9658; ${this.esc(scene.tc)}</span><span>HI-FI</span></div>
              <div class="amx-tv-note">${this.esc(variant.note)}</div>
              <div class="amx-tv-jp"><span class="amx-keep">${this.esc(scene.jp)}</span><br><span class="amx-tv-romaji">${this.keep(scene.romaji)}</span></div>
              <div class="amx-tv-sub" style="color:${colorRow ? colorRow[2] : '#ffff00'}">${this.esc(variant.line1)}<br>${this.esc(variant.line2)}</div>
            </div>
            <p class="amx-small">${this.esc(scene.title)}. Говорит: ${this.keep(variant.speaker)}.</p>
          </td>
          <td valign="top" class="amx-preview-form">
            <h2 class="amx-h2">Предпросмотр титров</h2>
            <p>Выберите сцену, школу перевода и цвет. Справа сразу видно, как строка ляжет на экран телевизора.</p>
            <p>Сцена:<br><select id="amx-f-scene" class="amx-select">${opt((this.data.fansubScenes || []).map(s => [s.id, s.title]), scene.id)}</select></p>
            <p>Школа:<br><select id="amx-f-school" class="amx-select">${opt(this.data.schools || [], school)}</select></p>
            <p>Цвет:<br><select id="amx-f-color" class="amx-select">${opt((this.data.subColors || []).map(c => [c[0], c[1]]), color)}</select></p>
            <p><button type="button" class="amx-btn" data-amx-preview="1">Показать</button>
            <button type="button" class="amx-btn" data-amx-doc="scene:${scene.id}:${school}:${color}">Скрипт в Блокнот</button></p>
          </td>
        </tr>
      </table>
      <pre class="amx-ssa">${this.keep(ssa)}</pre>
      <h2 class="amx-h2">Как мы делаем титры</h2>
      <ol class="amx-steps">
        ${(this.data.fansubSteps || []).map(([name, text]) => `<li><b>${this.esc(name)}.</b> ${this.esc(text)}</li>`).join('')}
      </ol>
      <p>Подробно про железо и ночные прогоны: ${this.link('/article?id=diy-fansub-station-win98', 'статья SubMaster')}. Спор о «Синдзи» и «Шинжи»: ${this.link('/polivanov', 'раздел Поливанов')}.</p>`;
  }

  renderArticles(params) {
    const all = this.data.articles || [];
    const rubrics = [...new Set(all.map(a => a.rubric))];
    const rubric = rubrics.includes(params.rubric) ? params.rubric : '';
    const list = all.filter(a => !rubric || a.rubric === rubric)
      .slice()
      .sort((a, b) => this.dateKey(b.date) - this.dateKey(a.date));
    const filters = [this.link('/articles', rubric ? 'все' : '<b>все</b>')]
      .concat(rubrics.map(r => r === rubric ? `<b>${this.esc(r)}</b>` : this.link('/articles?rubric=' + encodeURIComponent(r), this.esc(r))))
      .join(' | ');
    return `
      <h1 class="amx-h1">Статьи и репортажи</h1>
      <p>Пишем сами: участники сходки, переводчики и те, кто привозит кассеты. Рубрики: ${filters}</p>
      <table class="amx-archive" width="100%" cellspacing="0" cellpadding="0">
        ${list.map(a => `
          <tr>
            <td class="amx-archive-date">${this.esc(a.date)}<br><span class="amx-small">${this.esc(a.rubric)}</span></td>
            <td>
              <div class="amx-archive-title">${this.link('/article?id=' + a.id, this.esc(a.title))}</div>
              <div>${this.esc(a.lead)}</div>
              <div class="amx-small">${this.esc(a.author)}</div>
            </td>
          </tr>`).join('')}
      </table>`;
  }

  dateKey(date) {
    const m = String(date || '').match(/(\d{2})\.(\d{2})\.(\d{4})/);
    return m ? Number(m[3] + m[2] + m[1]) : 0;
  }

  commentsFor(id) {
    const seed = (this.data.seedComments || {})[id] || [];
    const mine = this.loadUser().comments[id] || [];
    return seed.concat(mine);
  }

  renderArticle(id) {
    const a = this.article(id);
    if (!a) return this.renderMissing('Такой статьи нет. Возможно, ссылка из старого выпуска.', '/articles', 'Все статьи');
    const comments = this.commentsFor(a.id);
    const others = (this.data.articles || []).filter(o => o.id !== a.id)
      .sort((x, y) => this.dateKey(y.date) - this.dateKey(x.date))
      .slice(0, 4);
    return `
      <div class="amx-paper">
        <p class="amx-crumbs">${this.link('/articles', 'Статьи')} &gt; ${this.esc(a.rubric)}</p>
        <h1 class="amx-paper-h">${this.esc(a.title)}</h1>
        <p class="amx-byline">${this.esc(a.author)}, ${this.esc(a.date)}</p>
        <p class="amx-lead">${this.esc(a.lead)}</p>
        ${(a.facts || []).length ? `
          <table class="amx-facts" cellspacing="0" cellpadding="0" align="right">
            <tr><th colspan="2">Справка</th></tr>
            ${a.facts.map(([k, v]) => `<tr><td class="amx-facts-k">${this.esc(k)}</td><td>${this.esc(v)}</td></tr>`).join('')}
          </table>` : ''}
        ${(a.body || []).map(p => `<p>${this.tt(p)}</p>`).join('')}
        <br clear="all">
        ${(a.tapes || []).length ? `<p class="amx-paper-tapes">В фонде: ${a.tapes.map(tid => {
          const t = this.tape(tid);
          return t ? this.link('/tape?id=' + t.id, `${this.esc(t.no)} ${this.esc(t.title)}`) : '';
        }).filter(Boolean).join(', ')}</p>` : ''}
        <p><button type="button" class="amx-btn" data-amx-doc="article:${a.id}">Статью в Блокнот</button></p>
        <hr>
        <h2 class="amx-h2">Отклики (${comments.length})</h2>
        ${comments.map(([who, date, text]) => `
          <div class="amx-comment"><b>${this.esc(who)}</b>, ${this.esc(date)}<br>${this.esc(text)}</div>`).join('')}
        <table class="amx-form" cellspacing="0" cellpadding="3">
          <tr><td>Ник:</td><td><input type="text" class="amx-input" id="amx-c-name" maxlength="40" size="24"></td></tr>
          <tr><td valign="top">Отклик:</td><td><textarea class="amx-input" id="amx-c-text" rows="4" cols="50"></textarea></td></tr>
          <tr><td></td><td><button type="button" class="amx-btn" data-amx-comment="${a.id}">Отправить</button></td></tr>
        </table>
        <hr>
        <p><b>Ещё почитать:</b><br>${others.map(o => this.link('/article?id=' + o.id, this.esc(o.title))).join('<br>')}</p>
      </div>`;
  }

  renderClubs(params) {
    const cities = this.data.cities || [];
    const city = cities.find(c => c.id === params.city);
    const shown = city ? [city] : cities;
    const pick = [city ? this.link('/clubs', 'все города') : '<b>все города</b>']
      .concat(cities.map(c => city && city.id === c.id ? `<b>${this.esc(c.name)}</b>` : this.link('/clubs?city=' + c.id, this.esc(c.name))))
      .join(' | ');
    return `
      <h1 class="amx-h1">Явки</h1>
      <p>Где смотреть, где меняться и кому писать. Список собирали всем миром через гостевую и эху. Если ваш клуб не попал сюда, напишите, добавим.</p>
      <p>Город: ${pick}</p>
      ${shown.map(c => `
        <h2 class="amx-city">${this.esc(c.name)}</h2>
        ${c.id === 'msk' ? `
          <table width="100%" cellspacing="0" cellpadding="0"><tr>
            <td valign="top"><pre class="amx-scheme">${this.esc((this.data.meetupMap || []).join('\n'))}</pre>
            <p class="amx-small">Схема не в масштабе. Встаньте лицом к театру: наша колонна крайняя справа.</p></td>
          </tr></table>` : ''}
        <table class="amx-spots" width="100%" cellspacing="0" cellpadding="0">
          <tr><th>Место</th><th>Когда</th><th>Что там</th><th>Связь</th></tr>
          ${c.spots.map(([place, when, what, contact]) => `
            <tr>
              <td><b>${this.esc(place)}</b></td>
              <td>${this.esc(when)}</td>
              <td>${this.esc(what)}</td>
              <td>${contact ? this.esc(contact) : '—'}</td>
            </tr>`).join('')}
        </table>`).join('')}
      <p class="amx-small">Объявления об обмене висят на ${this.link('/swap', 'доске обмена')}. Показы на ближайшие дни на ${this.link('/', 'главной')}.</p>`;
  }

  adsAll() {
    const user = this.loadUser();
    return (this.data.ads || []).concat(user.ads).map(ad => {
      const torn = Math.min(ad.tabs, (ad.torn || 0) + (user.torn[ad.id] || 0));
      return Object.assign({}, ad, { tornTotal: torn });
    });
  }

  renderAd(ad) {
    const tabs = [];
    for (let i = 0; i < ad.tabs; i += 1) {
      tabs.push(i < ad.tornTotal
        ? '<td class="amx-tab amx-tab-gone"></td>'
        : `<td class="amx-tab"><a data-amx-tear="${this.esc(ad.id)}" title="Оторвать">${this.esc(ad.tab)}</a></td>`);
    }
    return `
      <div class="amx-ad">
        <div class="amx-ad-title">МЕНЯЮ</div>
        <p>${this.esc(ad.offer)}</p>
        <div class="amx-ad-title">ИЩУ</div>
        <p>${this.esc(ad.want)}</p>
        <p class="amx-ad-who">${this.esc(ad.name)}, ${this.esc(ad.city)}</p>
        <table class="amx-tabs" cellspacing="0" cellpadding="0"><tr>${tabs.join('')}</tr></table>
      </div>`;
  }

  renderSwap() {
    const ads = this.adsAll();
    const rows = [];
    for (let i = 0; i < ads.length; i += 3) rows.push(ads.slice(i, i + 3));
    return `
      <div class="amx-wall">
        <h1 class="amx-wall-h">Доска обмена</h1>
        <p class="amx-wall-p">Меняемся один к одному или переписываем на чистые кассеты. Деньги за аниме не берём. Понравилось объявление, оторвите телефончик.</p>
        <table class="amx-board" width="100%" cellspacing="0" cellpadding="0">
          ${rows.map(row => `<tr>${row.map(ad => `<td valign="top">${this.renderAd(ad)}</td>`).join('')}${'<td></td>'.repeat(3 - row.length)}</tr>`).join('')}
        </table>
      </div>
      <h2 class="amx-h2">Повесить своё объявление</h2>
      <table class="amx-form" cellspacing="0" cellpadding="3">
        <tr><td>Ник:</td><td><input type="text" class="amx-input" id="amx-ad-name" maxlength="30" size="24"></td></tr>
        <tr><td>Город:</td><td><input type="text" class="amx-input" id="amx-ad-city" maxlength="40" size="24"></td></tr>
        <tr><td valign="top">Меняю:</td><td><textarea class="amx-input" id="amx-ad-offer" rows="3" cols="46"></textarea></td></tr>
        <tr><td valign="top">Ищу:</td><td><textarea class="amx-input" id="amx-ad-want" rows="2" cols="46"></textarea></td></tr>
        <tr><td>Связь:</td><td><input type="text" class="amx-input" id="amx-ad-tab" maxlength="34" size="24"> <span class="amx-small">ICQ, Fido или e-mail, будет на телефончиках</span></td></tr>
        <tr><td></td><td><button type="button" class="amx-btn" data-amx-ad="1">Повесить</button></td></tr>
      </table>`;
  }

  guestbookAll() {
    const user = this.loadUser();
    return user.guestbook.slice().reverse().concat(this.data.guestbook || []);
  }

  renderGuestbook() {
    const entries = this.guestbookAll();
    const favs = (this.data.tapes || []).map(t => t.title);
    return `
      <h1 class="amx-h1">Гостевая книга</h1>
      <table class="amx-form amx-gb-form" cellspacing="0" cellpadding="3">
        <tr><td>Имя или ник:</td><td><input type="text" class="amx-input" id="amx-gb-name" maxlength="40" size="26"></td></tr>
        <tr><td>Откуда:</td><td><input type="text" class="amx-input" id="amx-gb-from" maxlength="40" size="26"></td></tr>
        <tr><td>E-mail, ICQ или сайт:</td><td><input type="text" class="amx-input" id="amx-gb-contact" maxlength="60" size="26"></td></tr>
        <tr><td>Любимое аниме:</td><td><select class="amx-select" id="amx-gb-fav"><option value="">не скажу</option>${favs.map(f => `<option>${this.esc(f)}</option>`).join('')}</select></td></tr>
        <tr><td valign="top">Сообщение:</td><td><textarea class="amx-input" id="amx-gb-text" rows="4" cols="50"></textarea></td></tr>
        <tr><td></td><td><button type="button" class="amx-btn" data-amx-gb="1">Записать</button></td></tr>
      </table>
      <p class="amx-small">Записей: ${entries.length}. Отвечает ${this.esc(this.data.webmaster)}.</p>
      ${entries.map(e => {
        const contact = String(e.contact || '');
        const contactHtml = /^http:\/{2}/.test(contact) ? this.outLink(contact, this.esc(contact)) : this.esc(contact);
        return `
        <table class="amx-gb" width="100%" cellspacing="0" cellpadding="0">
          <tr><td class="amx-gb-head"><b>${this.esc(e.name)}</b>${e.from ? ', ' + this.esc(e.from) : ''}<span class="amx-gb-date">${this.esc(e.date)}</span></td></tr>
          <tr><td class="amx-gb-body">
            ${this.esc(e.text)}
            ${e.fav || contact ? `<div class="amx-small">${e.fav ? 'Любимое: ' + this.esc(e.fav) : ''}${e.fav && contact ? '. ' : ''}${contactHtml}</div>` : ''}
            ${e.reply ? `<div class="amx-gb-reply"><b>Ответ:</b> ${this.esc(e.reply)}</div>` : ''}
          </td></tr>
        </table>`;
      }).join('')}`;
  }

  romajiTables() {
    if (this._romaji) return this._romaji;
    const P = {
      a: 'а', i: 'и', u: 'у', e: 'э', o: 'о',
      ka: 'ка', ki: 'ки', ku: 'ку', ke: 'кэ', ko: 'ко',
      sa: 'са', shi: 'си', si: 'си', su: 'су', se: 'сэ', so: 'со',
      ta: 'та', chi: 'ти', ti: 'ти', tsu: 'цу', tu: 'цу', te: 'тэ', to: 'то',
      na: 'на', ni: 'ни', nu: 'ну', ne: 'нэ', no: 'но',
      ha: 'ха', hi: 'хи', fu: 'фу', hu: 'фу', he: 'хэ', ho: 'хо',
      ma: 'ма', mi: 'ми', mu: 'му', me: 'мэ', mo: 'мо',
      ya: 'я', yu: 'ю', yo: 'ё', ye: 'е',
      ra: 'ра', ri: 'ри', ru: 'ру', re: 'рэ', ro: 'ро',
      wa: 'ва', wo: 'о',
      ga: 'га', gi: 'ги', gu: 'гу', ge: 'гэ', go: 'го',
      za: 'дза', ji: 'дзи', zi: 'дзи', zu: 'дзу', ze: 'дзэ', zo: 'дзо',
      da: 'да', di: 'дзи', du: 'дзу', de: 'дэ', do: 'до',
      ba: 'ба', bi: 'би', bu: 'бу', be: 'бэ', bo: 'бо',
      pa: 'па', pi: 'пи', pu: 'пу', pe: 'пэ', po: 'по',
      kya: 'кя', kyu: 'кю', kyo: 'кё',
      sha: 'ся', shu: 'сю', sho: 'сё', she: 'сэ', sya: 'ся', syu: 'сю', syo: 'сё',
      cha: 'тя', chu: 'тю', cho: 'тё', che: 'тэ', tya: 'тя', tyu: 'тю', tyo: 'тё',
      nya: 'ня', nyu: 'ню', nyo: 'нё',
      hya: 'хя', hyu: 'хю', hyo: 'хё',
      mya: 'мя', myu: 'мю', myo: 'мё',
      rya: 'ря', ryu: 'рю', ryo: 'рё',
      gya: 'гя', gyu: 'гю', gyo: 'гё',
      ja: 'дзя', ju: 'дзю', jo: 'дзё', je: 'дзэ', zya: 'дзя', zyu: 'дзю', zyo: 'дзё', jya: 'дзя', jyu: 'дзю', jyo: 'дзё',
      bya: 'бя', byu: 'бю', byo: 'бё',
      pya: 'пя', pyu: 'пю', pyo: 'пё',
      fa: 'фа', fi: 'фи', fe: 'фэ', fo: 'фо',
      va: 'ва', vi: 'ви', vu: 'ву', ve: 'вэ', vo: 'во'
    };
    const S = Object.assign({}, P, {
      e: 'е', ke: 'ке', se: 'се', te: 'те', ne: 'не', he: 'хе', me: 'ме', re: 'ре',
      ge: 'ге', de: 'де', be: 'бе', pe: 'пе', fe: 'фе', ve: 'ве',
      shi: 'ши', chi: 'чи', ji: 'джи', zi: 'зи', di: 'ди',
      za: 'за', zu: 'зу', ze: 'зе', zo: 'зо', du: 'ду',
      sha: 'ша', shu: 'шу', sho: 'шо', she: 'ше',
      cha: 'ча', chu: 'чу', cho: 'чо', che: 'че',
      ja: 'джа', ju: 'джу', jo: 'джо', je: 'дже', jya: 'джа', jyu: 'джу', jyo: 'джо',
      yo: 'йо'
    });
    const consonant = { k: 'к', s: 'с', t: 'т', p: 'п', g: 'г', d: 'д', b: 'б', h: 'х', f: 'ф', r: 'р', m: 'м', z: 'дз', j: 'дж', c: 'т', w: 'в', y: 'й' };
    const exceptions = { tokyo: 'Токио', kyoto: 'Киото', yen: 'иена' };
    this._romaji = { P, S, consonant, exceptions };
    return this._romaji;
  }

  romajiWord(word, mode) {
    const { P, S, consonant, exceptions } = this.romajiTables();
    const table = mode === 'slang' ? S : P;
    let w = word.toLowerCase()
      .replace(/[āâ]/g, 'a').replace(/[īî]/g, 'i').replace(/[ūû]/g, 'u').replace(/[ēê]/g, 'e').replace(/[ōô]/g, 'o')
      .replace(/ou(?![aeiou])/g, 'o').replace(/oo/g, 'o').replace(/uu/g, 'u');
    if (exceptions[w.replace(/'/g, '')]) return exceptions[w.replace(/'/g, '')];
    let out = '';
    let i = 0;
    const isVowel = c => !!c && 'aeiou'.includes(c);
    while (i < w.length) {
      const three = w.slice(i, i + 3);
      const two = w.slice(i, i + 2);
      const ch = w[i];
      const next = w[i + 1] || '';
      if (ch === 'n' && (next === '\'' || (!isVowel(next) && next !== 'y'))) {
        if (next === '\'') {
          const after = w[i + 2] || '';
          out += (isVowel(after) || after === 'y') && mode !== 'slang' ? 'нъ' : 'н';
          i += 2;
          continue;
        }
        out += 'bpm'.includes(next) && next && mode !== 'slang' ? 'м' : 'н';
        i += 1;
        continue;
      }
      if (three.length === 3 && table[three]) {
        out += table[three];
        i += 3;
        continue;
      }
      if (table[two] && two.length === 2) {
        out += table[two];
        i += 2;
        continue;
      }
      if (ch === 'i' && /[аэеоёой]$/.test(out) && !/й$/.test(out)) {
        out += 'й';
        i += 1;
        continue;
      }
      if (ch === 'e' && !out) {
        out += 'э';
        i += 1;
        continue;
      }
      if (table[ch]) {
        out += table[ch];
        i += 1;
        continue;
      }
      if (consonant[ch] && (next === ch || (ch === 't' && next === 'c'))) {
        out += consonant[ch];
        i += 1;
        continue;
      }
      out += consonant[ch] || ch;
      i += 1;
    }
    return out;
  }

  romajiToCyr(text, mode = 'polivanov') {
    return String(text || '').replace(/[A-Za-zĀāĪīŪūĒēŌōÂâÎîÛûÊêÔô']+/g, word => {
      const cyr = this.romajiWord(word, mode);
      if (!cyr) return cyr;
      return word[0] === word[0].toUpperCase() && /[A-Za-zĀĪŪĒŌÂÎÛÊÔ]/.test(word[0])
        ? cyr[0].toUpperCase() + cyr.slice(1)
        : cyr;
    });
  }

  renderPolivanov(params) {
    const d = this.data;
    const q = String(params.q || '').slice(0, 80);
    const result = q ? `
      <table class="amx-conv-out" cellspacing="0" cellpadding="0">
        <tr><th>Латиница</th><th>По Поливанову</th><th>Фансаб-сленг</th></tr>
        <tr>
          <td>${this.keep(q)}</td>
          <td class="amx-conv-p">${this.keep(this.romajiToCyr(q, 'polivanov'))}</td>
          <td class="amx-conv-s">${this.keep(this.romajiToCyr(q, 'slang'))}</td>
        </tr>
      </table>` : '<p class="amx-small">Введите имя или название латиницей, как на английской кассете.</p>';
    const cell = item => {
      if (!item) return '<td class="amx-kana-empty"></td>';
      const [kana, roma] = item;
      const p = this.romajiWord(roma, 'polivanov');
      const s = this.romajiWord(roma, 'slang');
      return `<td class="${p !== s ? 'amx-kana amx-kana-diff' : 'amx-kana'}">
        <span class="amx-kana-jp">${this.keep(kana)}</span><br>
        <span class="amx-kana-ro">${this.keep(roma)}</span><br>
        <b>${this.keep(p)}</b>${p !== s ? `<br><span class="amx-kana-s">${this.keep(s)}</span>` : ''}
      </td>`;
    };
    return `
      <h1 class="amx-h1">Поливанов и фансаб-сленг</h1>
      <p>В 1917 году востоковед Евгений Поливанов предложил, как писать японские слова русскими буквами. По его системе пишут словари и японисты: Синдзи, Кэнсин, суси. На кассетах с английскими титрами имена читают по-английски: Шинжи, Кеншин, суши. Мы не выбираем за вас. Переключатель «Имена» под меню меняет написание на всём узле, кроме этой страницы.</p>
      <div class="amx-conv">
        <b>Конвертер.</b> Латиница:
        <input type="text" class="amx-input" id="amx-conv-q" value="${this.esc(q)}" maxlength="80" size="32">
        <button type="button" class="amx-btn" data-amx-convert="1">Перевести</button>
        ${result}
        <p class="amx-small">Примеры: ${(d.converterExamples || []).map(ex => `<a data-url="${this.esc(this.url('/polivanov?q=' + encodeURIComponent(ex)))}">${this.keep(ex)}</a>`).join(' | ')}</p>
      </div>
      <h2 class="amx-h2">Таблица слогов</h2>
      <p>Красным отмечены слоги, где спорят. Сверху каны и латиница Хэпбёрна, жирным Поливанов, ниже как читают с английского.</p>
      <table class="amx-kana-table" cellspacing="0" cellpadding="0">
        ${(d.kanaRows || []).map(([, items]) => `<tr>${items.map(cell).join('')}</tr>`).join('')}
      </table>
      <table class="amx-kana-table" cellspacing="0" cellpadding="0">
        <tr>${(d.yoonRows || []).slice(0, 6).map(cell).join('')}</tr>
        <tr>${(d.yoonRows || []).slice(6).map(cell).join('')}</tr>
      </table>
      <h2 class="amx-h2">Ещё четыре правила</h2>
      <ul class="amx-rules">
        <li>Слог <tt>n</tt> перед <tt>b</tt>, <tt>p</tt>, <tt>m</tt> пишется как «м»: ${this.keep('Gunma')} это ${this.keep(this.romajiToCyr('Gunma'))}.</li>
        <li>Перед гласной слоговое <tt>n</tt> отделяют твёрдым знаком: ${this.keep('Shin\'ichirou')} это ${this.keep(this.romajiToCyr('Shin\'ichirou'))}.</li>
        <li>Долгие гласные не удваиваем: ${this.keep('Shoujo')} это ${this.keep(this.romajiToCyr('shoujo'))}, ${this.keep('Ryuutarou')} это ${this.keep(this.romajiToCyr('Ryuutarou'))}.</li>
        <li>Привычные слова не трогаем: Токио, Киото, иена. И «Сейлор Мун», как её назвали на 2×2.</li>
      </ul>
      <p>Почему вокруг этого столько шума, читайте в ${this.link('/article?id=polivanov-vs-hepburn-ruanime-99', 'статье Ани_Фидошницы')}.</p>`;
  }

  parseTc(tc) {
    const m = String(tc).match(/(\d+):(\d{2}):(\d{2})(?:\.(\d{1,2}))?/);
    if (!m) return 0;
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + (m[4] ? Number(m[4].padEnd(2, '0')) / 100 : 0);
  }

  fmtTc(sec) {
    const total = Math.max(0, Math.round(sec * 100));
    const cs = total % 100;
    const s = Math.floor(total / 100) % 60;
    const m = Math.floor(total / 6000) % 60;
    const h = Math.floor(total / 360000);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  buildSsa(title, events, colorKey, note) {
    const colorRow = (this.data.subColors || []).find(c => c[0] === colorKey) || (this.data.subColors || [])[0] || ['yellow', '', '#ffff00', '65535'];
    const lines = [
      '[Script Info]',
      `Title: ${title}`,
      'Original Script: NERV-Sub 99 (http://www.animatrix99.ru)',
      'ScriptType: v4.00',
      'Collisions: Normal',
      'PlayResX: 640',
      'PlayResY: 480',
      'Timer: 100.0000',
      '',
      '[V4 Styles]',
      'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, TertiaryColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, AlphaLevel, Encoding',
      `Style: Main,Arial Cyr,22,${colorRow[3]},16777215,0,0,-1,0,1,2,2,2,20,20,24,0,204`,
      'Style: Note,Courier New,15,16777215,16777215,0,0,0,0,1,1,1,6,20,20,14,0,204',
      '',
      '[Events]',
      'Format: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
    ];
    let last = 0;
    if (note && events.length) {
      const start = this.parseTc(events[0][0]);
      lines.push(`Dialogue: Marked=0,${this.fmtTc(start)},${this.fmtTc(start + 4)},Note,NOTE,0000,0000,0000,,{\\i1}${note}{\\i0}`);
    }
    events.forEach(([tc, who, text]) => {
      const start = Math.max(this.parseTc(tc), last);
      const end = start + Math.max(1.5, Math.min(6, text.length / 12));
      last = end + 0.15;
      lines.push(`Dialogue: Marked=0,${this.fmtTc(start)},${this.fmtTc(end)},Main,${who},0000,0000,0000,,${text}`);
    });
    return lines.join('\r\n');
  }

  buildSceneSsa(scene, school, color) {
    const v = scene.variants[school] || scene.variants.polivanov;
    const start = this.parseTc(scene.tc);
    return this.buildSsa(scene.title, [
      [scene.tc, v.speaker, v.line1],
      [this.fmtTc(start + 3.4), v.speaker, v.line2]
    ], color, v.note);
  }

  buildPackSsa(file) {
    const s = (this.data.scripts || []).find(x => x.file === file);
    if (!s) return null;
    const t = this.tape(s.tape);
    if (s.scene) return { file: s.file.replace(/\.ZIP$/i, '.SSA'), text: this.buildSceneSsa(this.scene(s.scene), 'polivanov', 'yellow') };
    return {
      file: s.file.replace(/\.ZIP$/i, '.SSA'),
      text: this.buildSsa(`${t ? t.orig : s.file}, ${s.eps}`, t ? t.sample : [], 'yellow', `Версия ${s.ver}, ${s.by}`)
    };
  }

  wrap(text, width = 70) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(w => {
      if ((line + ' ' + w).trim().length > width) {
        lines.push(line);
        line = w;
      } else {
        line = (line + ' ' + w).trim();
      }
    });
    if (line) lines.push(line);
    return lines.join('\r\n');
  }

  buildTapeTxt(t) {
    const rule = '='.repeat(70);
    const thin = '-'.repeat(70);
    const reels = (t.reels || []).map(reel => [reel.name].concat(this.reelRows(reel).map(([at, label]) => `  ${at.padStart(8, ' ')}  ${label}`)).join('\r\n')).join('\r\n\r\n');
    return [
      rule,
      `АНИМАТРИЦА '99, КЛУБНЫЙ ФОНД. КАРТОЧКА ${t.no}`,
      'http://www.animatrix99.ru/tape?id=' + t.id,
      rule,
      `Название:  ${t.title}`,
      `Оригинал:  ${t.orig}`,
      this.wrap(`Кто снял:  ${t.made}`),
      this.wrap(`Эфир:      ${t.aired}`),
      this.wrap(`Копия:     ${t.source}`),
      this.wrap(`Перевод:   ${t.subs}`),
      `Принести:  ${t.copy}`,
      `Где:       ${this.tapeStatus(t)}`,
      thin,
      reels,
      thin,
      this.wrap(t.summary),
      '',
      this.wrap(`[+] ${t.pro[0]}: ${t.pro[1]}`),
      this.wrap(`[-] ${t.con[0]}: ${t.con[1]}`),
      rule
    ].join('\r\n');
  }

  buildArticleTxt(a) {
    const rule = '='.repeat(70);
    return [
      rule,
      `АНИМАТРИЦА '99, ВЫПУСК ${this.data.issue}. ${String(a.rubric).toUpperCase()}`,
      rule,
      this.wrap(a.title),
      `${a.author}, ${a.date}`,
      '-'.repeat(70),
      this.wrap(a.lead),
      ''
    ].concat((a.facts || []).map(([k, v]) => this.wrap(`* ${k}: ${v}`)))
      .concat([''])
      .concat((a.body || []).map(p => this.wrap(p.replace(/`/g, '')) + '\r\n'))
      .concat(['http://www.animatrix99.ru/article?id=' + a.id, rule])
      .join('\r\n');
  }

  docFor(spec) {
    const parts = String(spec || '').split(':');
    if (parts[0] === 'tape') {
      const t = this.tape(parts[1]);
      return t ? { file: t.file, text: this.buildTapeTxt(t) } : null;
    }
    if (parts[0] === 'article') {
      const a = this.article(parts[1]);
      return a ? { file: `AMX_${a.date.replace(/\./g, '').slice(0, 4)}_${a.id.split('-')[0].toUpperCase()}.TXT`, text: this.buildArticleTxt(a) } : null;
    }
    if (parts[0] === 'scene') {
      const sc = (this.data.fansubScenes || []).find(s => s.id === parts[1]);
      if (!sc) return null;
      const { school, color } = this.fansubParams({ scene: parts[1], school: parts[2], color: parts[3] });
      return { file: `${sc.id.toUpperCase().replace(/-/g, '_')}_${school.toUpperCase()}.SSA`, text: this.buildSceneSsa(sc, school, color) };
    }
    if (parts[0] === 'pack') return this.buildPackSsa(parts.slice(1).join(':'));
    return null;
  }

  saveTextToMyDocuments(filename, content) {
    const cleanName = String(filename || 'ANIMATRIX.TXT').replace(/[^a-zA-Z0-9._-]/g, '_');
    let savedToVfs = false;
    if (typeof window !== 'undefined' && window.vfs) {
      try {
        if (typeof window.vfs.writeFile === 'function') {
          window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], cleanName, content);
          savedToVfs = true;
        } else if (typeof window.vfs.createFile === 'function') {
          window.vfs.createFile(['My Computer', 'C:', 'My Documents'], cleanName, content);
          savedToVfs = true;
        }
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.appNotepad && typeof window.appNotepad.open === 'function') {
      try {
        window.appNotepad.open(cleanName, content, ['My Computer', 'C:', 'My Documents']);
      } catch (e) {}
    }
    return { filename: cleanName, content, savedToVfs };
  }

  saveDoc(spec) {
    const doc = this.docFor(spec);
    if (!doc) return null;
    return this.saveTextToMyDocuments(doc.file, doc.text);
  }

  votePoll(key) {
    const keys = ((this.data.poll || {}).options || []).map(o => o[0]);
    if (!keys.includes(key)) return false;
    const user = this.loadUser();
    if (user.poll) return false;
    user.poll = key;
    this.saveUser(user);
    return true;
  }

  joinQueue(tapeId, name) {
    const t = this.tape(tapeId);
    const nick = String(name || '').trim().slice(0, 30);
    if (!t || !nick) return false;
    const user = this.loadUser();
    user.queue[tapeId] = nick;
    this.saveUser(user);
    return true;
  }

  leaveQueue(tapeId) {
    const user = this.loadUser();
    if (!user.queue[tapeId]) return false;
    delete user.queue[tapeId];
    this.saveUser(user);
    return true;
  }

  addComment(articleId, name, text) {
    const body = String(text || '').trim().slice(0, 800);
    if (!this.article(articleId) || !body) return false;
    const user = this.loadUser();
    if (!user.comments[articleId]) user.comments[articleId] = [];
    user.comments[articleId].push([String(name || '').trim().slice(0, 40) || 'Гость', this.data.siteDay, body]);
    this.saveUser(user);
    return true;
  }

  addGuestbookEntry(entry) {
    const text = String(entry.text || '').trim().slice(0, 800);
    if (!text) return false;
    const user = this.loadUser();
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    user.guestbook.push({
      name: String(entry.name || '').trim().slice(0, 40) || 'Гость',
      from: String(entry.from || '').trim().slice(0, 40),
      contact: String(entry.contact || '').trim().slice(0, 60),
      fav: String(entry.fav || '').trim().slice(0, 60),
      date: `${this.data.siteDay} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      text
    });
    this.saveUser(user);
    return true;
  }

  addAd(ad) {
    const offer = String(ad.offer || '').trim().slice(0, 300);
    const tab = String(ad.tab || '').trim().slice(0, 34);
    if (!offer || !tab) return false;
    const user = this.loadUser();
    user.ads.push({
      id: 'ad-user-' + Date.now() + '-' + user.ads.length,
      name: String(ad.name || '').trim().slice(0, 30) || 'Гость',
      city: String(ad.city || '').trim().slice(0, 40) || 'город не указан',
      offer,
      want: String(ad.want || '').trim().slice(0, 300) || 'что предложите',
      tab,
      tabs: 8,
      torn: 0
    });
    this.saveUser(user);
    return true;
  }

  tearTab(adId) {
    const ad = this.adsAll().find(a => a.id === adId);
    if (!ad || ad.tornTotal >= ad.tabs) return null;
    const user = this.loadUser();
    user.torn[adId] = (user.torn[adId] || 0) + 1;
    this.saveUser(user);
    return ad.tab;
  }

  attachEvents(win, container, ie) {
    if (!container) return;
    const root = (typeof container.querySelector === 'function' && container.querySelector('.amx-site')) || container;
    const path = (root.dataset && root.dataset.amxPath) || '/';
    const sound = kind => {
      if (typeof window !== 'undefined' && window.soundSys && typeof window.soundSys[kind] === 'function') window.soundSys[kind]();
    };
    const rerender = () => {
      const top = container.scrollTop || 0;
      if (ie && typeof ie.renderPage === 'function') {
        ie.renderPage(win, ie.currentUrl);
      } else {
        container.innerHTML = this.renderSite(this.url(path));
        this.attachEvents(win, container, ie);
      }
      container.scrollTop = top;
    };
    const go = url => {
      if (ie && typeof ie.navigate === 'function') ie.navigate(win, url);
    };
    const value = sel => {
      const el = typeof root.querySelector === 'function' ? root.querySelector(sel) : null;
      return el ? el.value : '';
    };
    const say = text => {
      this.notice = { path, text };
    };
    const convert = () => go(this.url('/polivanov?q=' + encodeURIComponent(value('#amx-conv-q').trim())));

    if (typeof root.addEventListener !== 'function') return;
    const convInput = typeof root.querySelector === 'function' ? root.querySelector('#amx-conv-q') : null;
    if (convInput && typeof convInput.addEventListener === 'function') {
      convInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') convert();
      });
    }
    root.addEventListener('click', e => {
      const t = e.target && typeof e.target.closest === 'function'
        ? e.target.closest('[data-amx-enc],[data-amx-names],[data-amx-poll],[data-amx-doc],[data-amx-pack],[data-amx-preview],[data-amx-queue],[data-amx-unqueue],[data-amx-comment],[data-amx-gb],[data-amx-ad],[data-amx-tear],[data-amx-convert],[data-amx-clippy]')
        : null;
      if (!t) return;
      const d = t.dataset;
      if (d.amxEnc) {
        this.encoding = ['win1251', 'koi8', 'translit'].includes(d.amxEnc) ? d.amxEnc : 'win1251';
        sound('playClick');
        rerender();
      } else if (d.amxNames) {
        this.transcription = d.amxNames === 'slang99' ? 'slang99' : 'polivanov';
        sound('playClick');
        rerender();
      } else if (d.amxPoll) {
        const checked = root.querySelector('input[name="amx-poll"]:checked');
        if (this.votePoll(checked ? checked.value : '')) {
          say('Спасибо, голос учтён.');
          sound('playDing');
        }
        rerender();
      } else if (d.amxDoc || d.amxPack) {
        const res = this.saveDoc(d.amxDoc || 'pack:' + d.amxPack);
        if (res) {
          say(`Файл ${res.filename} сохранён в C:\\My Documents и открыт в Блокноте.`);
          sound('playDing');
          rerender();
        }
      } else if (d.amxPreview) {
        const q = ['scene', 'school', 'color'].map(k => `${k}=${encodeURIComponent(value('#amx-f-' + k))}`).join('&');
        go(this.url('/fansub?' + q));
      } else if (d.amxQueue) {
        if (this.joinQueue(d.amxQueue, value('#amx-queue-name'))) {
          say('Вы записаны в очередь. Ждём в субботу.');
          sound('playDing');
        } else {
          say('Напишите ник, чтобы записаться.');
        }
        rerender();
      } else if (d.amxUnqueue) {
        if (this.leaveQueue(d.amxUnqueue)) say('Вы вышли из очереди.');
        sound('playClick');
        rerender();
      } else if (d.amxComment) {
        if (this.addComment(d.amxComment, value('#amx-c-name'), value('#amx-c-text'))) {
          say('Отклик добавлен.');
          sound('playDing');
        } else {
          say('Пустой отклик не сохранить.');
        }
        rerender();
      } else if (d.amxGb) {
        const ok = this.addGuestbookEntry({
          name: value('#amx-gb-name'),
          from: value('#amx-gb-from'),
          contact: value('#amx-gb-contact'),
          fav: value('#amx-gb-fav'),
          text: value('#amx-gb-text')
        });
        say(ok ? 'Запись добавлена в гостевую книгу.' : 'Напишите сообщение, пустую запись не сохранить.');
        if (ok) sound('playDing');
        rerender();
      } else if (d.amxAd) {
        const ok = this.addAd({
          name: value('#amx-ad-name'),
          city: value('#amx-ad-city'),
          offer: value('#amx-ad-offer'),
          want: value('#amx-ad-want'),
          tab: value('#amx-ad-tab')
        });
        say(ok ? 'Объявление висит на доске.' : 'Напишите, что меняете, и как с вами связаться.');
        if (ok) sound('playDing');
        rerender();
      } else if (d.amxTear) {
        const contact = this.tearTab(d.amxTear);
        if (contact) {
          say(`Оторвали телефончик: ${contact}`);
          sound('playClick');
          rerender();
        }
      } else if (d.amxConvert) {
        convert();
      } else if (d.amxClippy) {
        if (typeof window !== 'undefined' && window.appClippy) {
          window.appClippy.show();
          window.appClippy._lastIePageKey = null;
          window.appClippy.onNavigateIE((ie && ie.currentUrl) || this.baseUrl, 'animatrix', 'АниМатрица \'99');
        }
      }
    });
  }
}

window.animatrixSite = new AnimatrixSite();
