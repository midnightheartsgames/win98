class PerepletSite {
  constructor() {
    this.baseUrl = 'http://www.pereplet99.ru';
    this.userKey = 'win98_pereplet_user_v2';
    this.hitKey = 'win98_pereplet_hits_v1';
    this.legacyKeys = {
      poll: 'win98_pereplet_poll_v1',
      votes: 'win98_pereplet_bookvotes_v1',
      comments: 'win98_pereplet_comments_v1',
      guestbook: 'win98_pereplet_guestbook_v1'
    };
    this.encoding = 'win1251';
    this.modemBps = 33600;
    this.issue = null;
    this.notice = null;
    this.hitCount = 0;
    this.initHits();
  }

  get data() {
    return (typeof window !== 'undefined' && window.perepletData) || {};
  }

  store() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) {}
    return null;
  }

  initHits() {
    const ls = this.store();
    let count = 18240;
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
      count = 18241;
    }
    this.hitCount = count;
  }

  emptyUser() {
    return { guestbook: [], comments: {}, ads: [], poll: null };
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
            ads: Array.isArray(parsed.ads) ? parsed.ads : [],
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
    const readJson = key => {
      try {
        const raw = ls.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    };
    const oldGuests = readJson(this.legacyKeys.guestbook);
    if (Array.isArray(oldGuests)) {
      oldGuests.filter(e => e && e.date === '19.12.1999 23:30' && e.text).reverse().forEach(e => {
        user.guestbook.push({
          name: String(e.name || '').slice(0, 40),
          from: String(e.city || '').slice(0, 40),
          date: '19.12.1999 12:00',
          text: String(e.text || '').slice(0, 700)
        });
      });
    }
    const oldComments = readJson(this.legacyKeys.comments);
    const articleIds = new Set((this.data.articles || []).map(a => a.id));
    if (oldComments && typeof oldComments === 'object') {
      Object.keys(oldComments).forEach(id => {
        const list = Array.isArray(oldComments[id]) ? oldComments[id] : [];
        const mine = list.filter(c => c && c.date === '19.12.1999 22:45' && c.text);
        if (mine.length && articleIds.has(id)) {
          user.comments[id] = mine.reverse().map(c => ({
            name: String(c.author || '').slice(0, 40),
            date: '19.12.1999 12:00',
            text: String(c.text || '').slice(0, 700)
          }));
        }
      });
    }
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

  book(id) {
    return (this.data.books || []).find(b => b.id === id) || null;
  }

  article(id) {
    return (this.data.articles || []).find(a => a.id === id) || null;
  }

  staff(id) {
    return (this.data.staff || []).find(s => s.id === id) || { name: id, role: '' };
  }

  journal(id) {
    return (this.data.journals || []).find(j => j.id === id) || null;
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
      '/shelf': 'shelf',
      '/books': 'shelf',
      '/book': 'book',
      '/chronicle': 'chronicle',
      '/news': 'chronicle',
      '/article': 'article',
      '/journals': 'journals',
      '/net': 'net',
      '/modem': 'net',
      '/bukinist': 'bukinist',
      '/guestbook': 'guestbook',
      '/salon': 'guestbook',
      '/about': 'about',
      '/imprint': 'about'
    };
    return { page: routes[path] || '404', path, params };
  }

  sections() {
    return [
      { key: 'home', path: '', spine: 'Титул', head: 'Оглавление' },
      { key: 'shelf', path: '/shelf', spine: 'Полка', head: 'Книжная полка' },
      { key: 'chronicle', path: '/chronicle', spine: 'Летопись', head: 'Летопись осени' },
      { key: 'journals', path: '/journals', spine: 'Подшивка', head: 'Годовая подшивка' },
      { key: 'net', path: '/net', spine: 'Сеть', head: 'Чтение по модему' },
      { key: 'bukinist', path: '/bukinist', spine: 'Букинист', head: 'Букинист' },
      { key: 'guestbook', path: '/guestbook', spine: 'Отзывы', head: 'Книга отзывов' },
      { key: 'about', path: '/about', spine: 'Выходные данные', head: 'Выходные данные' }
    ];
  }

  toc() {
    const out = [];
    let page = 3;
    const books = this.data.books || [];
    const articles = this.data.articles || [];
    const add = entry => {
      out.push({ ...entry, folio: page });
      page += entry.span || 1;
    };
    add({ key: 'note', path: '#note', title: 'От составителя', level: 1 });
    add({ key: 'shelf', path: '/shelf', title: 'Книжная полка 1999 года', level: 1 });
    books.forEach(b => add({ key: `book:${b.id}`, path: `/book?id=${b.id}`, title: `${b.author}. ${b.title}`, level: 2, span: 2 }));
    add({ key: 'chronicle', path: '/chronicle', title: 'Летопись: сентябрь — декабрь', level: 1, span: 2 });
    articles.forEach(a => add({ key: `article:${a.id}`, path: `/article?id=${a.id}`, title: a.toc || a.title, level: 2, span: 4 }));
    add({ key: 'journals', path: '/journals', title: 'Годовая подшивка толстых журналов', level: 1, span: 2 });
    add({ key: 'net', path: '/net', title: 'Чтение по модему', level: 1 });
    add({ key: 'bukinist', path: '/bukinist', title: 'Букинист. Объявления читателей', level: 1 });
    add({ key: 'guestbook', path: '/guestbook', title: 'Книга отзывов и предложений', level: 1 });
    add({ key: 'about', path: '/about', title: 'Выходные данные', level: 1 });
    return out;
  }

  tocKey(route) {
    if (route.page === 'book') return `book:${route.params.id}`;
    if (route.page === 'article') return `article:${route.params.id}`;
    if (route.page === 'home') return 'home';
    return route.page;
  }

  getPageTitle(url) {
    const route = this.parseRoute(url);
    if (route.page === 'book') {
      const b = this.book(route.params.id);
      return b ? `Переплёт '99 :: ${b.author}. ${b.title}` : '404 Not Found';
    }
    if (route.page === 'article') {
      const a = this.article(route.params.id);
      return a ? `Переплёт '99 :: ${a.toc || a.title}` : '404 Not Found';
    }
    if (route.page === 'home') return 'Переплёт \'99 :: литературный альманах, выпуск 12';
    const sec = this.sections().find(s => s.key === route.page);
    return sec ? `Переплёт '99 :: ${sec.head}` : '404 Not Found';
  }

  renderSite(url = '') {
    const route = this.parseRoute(url);
    const pages = {
      home: () => this.renderHome(),
      shelf: () => this.renderShelf(),
      book: () => this.renderBook(route.params.id),
      chronicle: () => this.renderChronicle(),
      article: () => this.renderArticle(route.params.id),
      journals: () => this.renderJournals(),
      net: () => this.renderNet(),
      bukinist: () => this.renderBukinist(route.params.kind),
      guestbook: () => this.renderGuestbook(),
      about: () => this.renderAbout()
    };
    const body = pages[route.page] ? pages[route.page]() : null;
    if (body === null) return this.render404(route.path);
    const html = `
      <div class="pp-site" data-pp-path="${this.esc(route.path)}">
        <table class="pp-book" cellspacing="0" cellpadding="0" align="center">
          <tr>
            <td class="pp-spine" rowspan="2" valign="top">${this.renderSpine(route.page)}</td>
            <td class="pp-cover">${this.renderMasthead()}</td>
          </tr>
          <tr>
            <td class="pp-leaf" valign="top">
              ${this.renderRunningHead(route)}
              <div class="pp-text">${this.renderNotice(route.path)}${body}</div>
              ${this.renderFolio(route)}
              ${this.renderFooter()}
            </td>
          </tr>
        </table>
      </div>`;
    return this.encodeHtml(html);
  }

  render404(path) {
    return `
      <div class="pp-site pp-raw">
        <h1>Not Found</h1>
        <p>The requested URL ${this.esc(path)} was not found on this server.</p>
        <hr>
        <address>Apache/1.3.9 Server at www.pereplet99.ru Port 80</address>
      </div>`;
  }

  renderNotice(path) {
    if (!this.notice || this.notice.path !== path) return '';
    const text = this.notice.text;
    this.notice = null;
    return `<div class="pp-notice">${this.gif('check')} ${this.esc(text)}</div>`;
  }

  renderMasthead() {
    const issue = this.data.issue || {};
    const tool = [];
    for (let x = 20; x <= 600; x += 20) tool.push(`<rect x="${x - 2}" y="9" width="4" height="4" fill="#cc9933" transform="rotate(45 ${x} 11)"/>`);
    for (let x = 20; x <= 600; x += 20) tool.push(`<rect x="${x - 2}" y="101" width="4" height="4" fill="#cc9933" transform="rotate(45 ${x} 103)"/>`);
    return `
      <a data-url="${this.url()}" class="pp-mast-link">
        <svg class="pp-mast" width="620" height="112" viewBox="0 0 620 112" role="img" aria-label="Переплёт '99. Литературный альманах в Сети">
          <rect width="620" height="112" fill="#003333"/>
          <rect x="4" y="18" width="612" height="76" fill="none" stroke="#002222" stroke-width="2"/>
          <rect x="6" y="20" width="608" height="72" fill="none" stroke="#336666" stroke-width="1"/>
          ${tool.join('')}
          <g font-family="'Times New Roman', Times, serif" font-weight="bold" font-size="54">
            <text x="33" y="76" fill="#663300" textLength="330" lengthAdjust="spacingAndGlyphs">ПЕРЕПЛЁТ</text>
            <text x="31" y="74" fill="#cc9933" textLength="330" lengthAdjust="spacingAndGlyphs">ПЕРЕПЛЁТ</text>
            <text x="31" y="74" fill="none" stroke="#ffcc66" stroke-width="0.6" textLength="330" lengthAdjust="spacingAndGlyphs">ПЕРЕПЛЁТ</text>
          </g>
          <text x="372" y="74" font-family="'Times New Roman', Times, serif" font-style="italic" font-size="40" fill="#cc9933">’99</text>
          <line x1="450" y1="30" x2="450" y2="84" stroke="#cc9933" stroke-width="1"/>
          <text x="464" y="44" font-family="'Times New Roman', Times, serif" font-size="13" fill="#ffcc66" letter-spacing="1">литературный</text>
          <text x="464" y="60" font-family="'Times New Roman', Times, serif" font-size="13" fill="#ffcc66" letter-spacing="1">альманах в Сети</text>
          <text x="464" y="80" font-family="'Times New Roman', Times, serif" font-style="italic" font-size="12" fill="#cc9933">${this.esc(issue.line || '')}</text>
        </svg>
      </a>`;
  }

  renderSpine(page) {
    const active = { book: 'shelf', article: 'chronicle' }[page] || page;
    const enc = [['win1251', 'WIN'], ['koi8', 'KOI'], ['translit', 'LAT']].map(([key, label]) =>
      this.encoding === key ? `<b>${label}</b>` : `<a data-pp-enc="${key}">${label}</a>`).join(' ');
    const band = '<div class="pp-band"></div>';
    const items = this.sections().map(s => {
      if (s.key === active) return `<div class="pp-label pp-label-on">${s.spine}</div>`;
      return `<div class="pp-label">${this.link(s.path, s.spine)}</div>`;
    });
    return `
      <div class="pp-spine-in">
        <div class="pp-headband"></div>
        <div class="pp-spine-mark">П<br>’99</div>
        ${band}${items.join(band)}${band}
        <div class="pp-spine-tail">
          <div class="pp-enc">${enc}</div>
          <div class="pp-spine-clippy"><a data-pp-clippy="1">Скрепыш</a></div>
        </div>
      </div>`;
  }

  renderRunningHead(route) {
    const sec = this.sections().find(s => s.key === ({ book: 'shelf', article: 'chronicle' }[route.page] || route.page));
    let right = sec ? sec.head : '';
    if (route.page === 'book') {
      const b = this.book(route.params.id);
      if (b) right = b.author;
    }
    if (route.page === 'article') {
      const a = this.article(route.params.id);
      if (a) right = a.rubric;
    }
    return `
      <table class="pp-runhead" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td>Переплёт ’99. Выпуск ${this.esc((this.data.issue || {}).no || '')}</td>
          <td align="right"><i>${this.esc(right)}</i></td>
        </tr>
      </table>`;
  }

  renderFolio(route) {
    const list = this.toc();
    const key = this.tocKey(route);
    if (key === 'home') {
      const first = list.find(e => e.path !== '#note');
      return `<div class="pp-folio"><span class="pp-turn">${this.link(first.path, `с. ${first.folio} &gt;`)}</span></div>`;
    }
    const idx = list.findIndex(e => e.key === key);
    if (idx < 0) return '';
    const cur = list[idx];
    const prevEntry = idx > 0 && list[idx - 1].path !== '#note' ? list[idx - 1] : null;
    const next = list[idx + 1] || null;
    const prev = prevEntry ? this.link(prevEntry.path, `&lt; с. ${prevEntry.folio}`) : this.link('', '&lt; титул');
    const nxt = next ? this.link(next.path, `с. ${next.folio} &gt;`) : this.link('', 'титул &gt;');
    return `
      <table class="pp-folio" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="33%" class="pp-turn">${prev}</td>
          <td width="34%" align="center">— ${cur.folio} —</td>
          <td width="33%" align="right" class="pp-turn">${nxt}</td>
        </tr>
      </table>`;
  }

  renderFooter() {
    const ring = typeof window !== 'undefined' && window.retroSites && typeof window.retroSites.renderWebRing === 'function'
      ? window.retroSites.renderWebRing(this.baseUrl)
      : '';
    return `
      <div class="pp-footer">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td class="pp-footer-text">
              Пишите составителю: <a href="mailto:editor@pereplet99.ru">editor@pereplet99.ru</a>.
              Перепечатка с разрешения редакции и со ссылкой на www.pereplet99.ru.
              Страницы свёрстаны для 800x600 и шрифта Times.
            </td>
            <td class="pp-88s" align="right">
              <a class="pp-88" data-url="http://www.lib.ru">Библиотека<br>Мошкова</a>
              <a class="pp-88 pp-88-ram" data-url="http://www.rambler98.ru">RAMBLER<br>TOP 100</a>
            </td>
          </tr>
        </table>
        ${ring}
      </div>`;
  }

  pollState() {
    const poll = this.data.poll || { options: [] };
    const user = this.loadUser();
    const counts = {};
    poll.options.forEach(([key, , base]) => { counts[key] = base; });
    if (user.poll && Object.prototype.hasOwnProperty.call(counts, user.poll)) counts[user.poll] += 1;
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return { poll, counts, total, mine: user.poll };
  }

  savePollVote(choice) {
    const poll = this.data.poll || { options: [] };
    if (!poll.options.some(([key]) => key === choice)) return false;
    const user = this.loadUser();
    if (user.poll) return false;
    user.poll = choice;
    this.saveUser(user);
    return true;
  }

  renderPoll() {
    const { poll, counts, total, mine } = this.pollState();
    if (mine) {
      return `
        <div class="pp-poll">
          <div class="pp-rubric">Анкета выпуска</div>
          <p class="pp-poll-q">${this.esc(poll.question)}</p>
          <table class="pp-poll-res" width="100%" cellspacing="0" cellpadding="2">
            ${poll.options.map(([key, label]) => {
              const pct = Math.round(counts[key] * 100 / total);
              return `
                <tr>
                  <td>${key === mine ? '<b>' : ''}${this.esc(label)}${key === mine ? '</b>' : ''}</td>
                  <td width="40" align="right">${pct}%</td>
                </tr>
                <tr><td colspan="2"><div class="pp-bar"><div style="width:${pct}%"></div></div></td></tr>`;
            }).join('')}
          </table>
          <p class="pp-small">Ответили ${total} читателей. Ваш голос учтён.</p>
        </div>`;
    }
    return `
      <div class="pp-poll">
        <div class="pp-rubric">Анкета выпуска</div>
        <p class="pp-poll-q">${this.esc(poll.question)}</p>
        ${poll.options.map(([key, label]) => `
          <label class="pp-poll-opt"><input type="radio" name="pp-poll" value="${key}"> ${this.esc(label)}</label>`).join('')}
        <p><button type="button" class="pp-btn" data-pp-poll="1">Ответить</button></p>
      </div>`;
  }

  renderHome() {
    const issue = this.data.issue || {};
    const note = this.data.editorNote || { paragraphs: [] };
    const author = this.staff(note.by);
    const entries = this.toc();
    const tocRows = entries.map(e => {
      const target = e.path === '#note'
        ? `<a data-pp-jump="pp-note">${this.esc(e.title)}</a>`
        : this.link(e.path, this.esc(e.title));
      const fresh = (this.data.fresh || []).includes(e.key) ? ` ${this.gif('new')}` : '';
      return `<div class="pp-toc-line pp-toc-l${e.level}"><span class="pp-toc-p">${e.folio}</span><span class="pp-toc-t">${target}${fresh}</span></div>`;
    }).join('');
    return `
      <div class="pp-titlepage">
        <div class="pp-tp-epi">${this.esc(issue.epigraph || '')}<br><span>${this.esc(issue.epigraphSource || '')}</span></div>
        <div class="pp-tp-issue">ВЫПУСК ${this.esc(issue.no || '')} (${this.esc(issue.total || '')})</div>
        <div class="pp-tp-month">${this.esc(issue.month || '')}</div>
        <div class="pp-tp-city">${this.esc(issue.cities || '')}</div>
      </div>
      <h2 class="pp-toc-head">Оглавление</h2>
      <div class="pp-toc">${tocRows}</div>
      <table class="pp-home-low" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td valign="top" class="pp-note-cell">
            <h3 class="pp-h3" id="pp-note">От составителя</h3>
            ${note.paragraphs.map((p, i) => `<p class="${i === 0 ? 'pp-first' : ''}">${this.esc(p)}</p>`).join('')}
            <p class="pp-sign">${this.esc(author.name)}<br><i>${this.esc(note.date || '')}</i></p>
          </td>
          <td valign="top" class="pp-poll-cell">${this.renderPoll()}</td>
        </tr>
      </table>`;
  }

  spineHtml(b) {
    const s = b.spine || {};
    return `
      <td valign="bottom" class="pp-shelf-slot">
        <a class="pp-sp" data-url="${this.url(`/book?id=${b.id}`)}" title="${this.esc(`${b.author}. ${b.title}`)}" style="width:${s.w || 34}px;height:${s.h || 200}px;background-color:${s.bg || '#663333'};color:${s.fg || '#ffcc66'}">
          <span class="pp-sp-band"></span>
          <span class="pp-sp-text"><b>${this.esc(b.spineAuthor || b.author)}</b><br>${this.esc(b.title)}</span>
          <span class="pp-sp-pub">${this.esc(b.spinePub || '')}</span>
        </a>
      </td>`;
  }

  pileHtml() {
    const journals = this.data.journals || [];
    if (!journals.length) return '';
    return `
      <td valign="bottom" class="pp-shelf-slot pp-pile-slot">
        <a class="pp-pile" data-url="${this.url('/journals')}" title="Годовая подшивка">
          ${journals.map(j => `<span class="pp-pile-j" style="background-color:${j.color}">${this.esc(j.short)}</span>`).join('')}
        </a>
      </td>`;
  }

  renderShelf() {
    const books = this.data.books || [];
    const list = this.toc();
    return `
      <h1 class="pp-h1">Книжная полка 1999 года</h1>
      <p class="pp-lead">${this.esc((this.data.shelfIntro || ''))}</p>
      <div class="pp-shelf">
        <table cellspacing="0" cellpadding="0" class="pp-shelf-row">
          <tr>${books.map(b => this.spineHtml(b)).join('')}${this.pileHtml()}<td class="pp-shelf-end"></td></tr>
        </table>
        <div class="pp-board"></div>
      </div>
      <p class="pp-small pp-center">Щёлкните по корешку, чтобы открыть карточку книги.</p>
      <h3 class="pp-h3">Опись полки</h3>
      <table class="pp-list" width="100%" cellspacing="0" cellpadding="3">
        <tr><th width="24">№</th><th>Автор, заглавие</th><th width="200">Издание</th><th width="34">с.</th></tr>
        ${books.map((b, i) => {
          const entry = list.find(e => e.key === `book:${b.id}`);
          return `
          <tr>
            <td align="right">${i + 1}.</td>
            <td>${this.esc(b.author)}. ${this.link(`/book?id=${b.id}`, this.esc(b.title))}</td>
            <td>${this.esc(b.imprintShort)}</td>
            <td align="right">${entry ? entry.folio : ''}</td>
          </tr>`;
        }).join('')}
      </table>`;
  }

  renderBook(id) {
    const b = this.book(id);
    if (!b) return null;
    const reviewer = this.staff(b.reviewer);
    const books = this.data.books || [];
    const idx = books.indexOf(b);
    const online = b.online ? `
        <tr>
          <th>В Сети</th>
          <td>${this.esc(b.online.where)}${b.online.kb ? `, около ${b.online.kb} КБ; на модеме ${this.esc(this.speedLabel(this.modemBps))} это ${this.esc(this.modemTime(b.online.kb, this.modemBps))}. ${this.link('/net', 'Расчёт для вашего модема')}` : ''}</td>
        </tr>` : '';
    return `
      <div class="pp-card-wrap">
        <div class="pp-card">
          <div class="pp-card-call">${this.esc(b.card.call)}<br>${this.esc(b.card.mark)}</div>
          <div class="pp-card-main">
            <div class="pp-card-head">${this.esc(b.card.heading)}</div>
            ${b.card.body.map(l => `<div class="pp-card-body">${this.esc(l)}</div>`).join('')}
            <div class="pp-card-tr">${b.card.tracing.map(t => this.esc(t)).join('<br>')}</div>
          </div>
          <div class="pp-card-hole"></div>
          <div class="pp-card-no">${this.esc(b.card.inv)}</div>
        </div>
      </div>
      <h1 class="pp-h1">${this.esc(b.author)}. ${this.esc(b.title)}</h1>
      <p class="pp-byline">Отзыв: ${this.esc(reviewer.name)}, ${this.esc(reviewer.role)}</p>
      ${b.review.map((p, i) => `<p class="${i === 0 ? 'pp-first' : ''}">${this.esc(p)}</p>`).join('')}
      <table class="pp-where" cellspacing="0" cellpadding="4">
        <tr><th>Где взять</th><td>${this.esc(b.where)}</td></tr>
        ${online}
      </table>
      <p class="pp-actions">
        <button type="button" class="pp-btn" data-pp-notepad="book:${b.id}">Карточку в Блокнот</button>
        <button type="button" class="pp-btn" data-pp-save="book:${b.id}">Сохранить в «Мои документы»</button>
      </p>
      <p class="pp-small">${idx > 0 ? this.link(`/book?id=${books[idx - 1].id}`, `&lt; ${this.esc(books[idx - 1].author)}`) : ''}
        ${idx > 0 && idx < books.length - 1 ? ' | ' : ''}
        ${idx < books.length - 1 ? this.link(`/book?id=${books[idx + 1].id}`, `${this.esc(books[idx + 1].author)} &gt;`) : ''}
        | ${this.link('/shelf', 'вся полка')}</p>`;
  }

  monthName(m) {
    return ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][m] || '';
  }

  renderChronicle() {
    const items = this.data.chronicle || [];
    const months = [];
    items.forEach(it => {
      const m = Number(String(it.date).split('.')[1]);
      let group = months.find(g => g.m === m);
      if (!group) {
        group = { m, rows: [] };
        months.push(group);
      }
      group.rows.push(it);
    });
    const articles = this.data.articles || [];
    return `
      <h1 class="pp-h1">Летопись: осень 1999 года</h1>
      <p class="pp-lead">${this.esc(this.data.chronicleIntro || '')}</p>
      ${months.map(g => `
        <h3 class="pp-month">${this.monthName(g.m)}</h3>
        <table class="pp-annal" width="100%" cellspacing="0" cellpadding="0">
          ${g.rows.map(it => `
            <tr>
              <td class="pp-annal-date" valign="top">${this.esc(it.date.slice(0, 5))}</td>
              <td class="pp-annal-text" valign="top">${this.esc(it.text)}${it.article ? ` ${this.link(`/article?id=${it.article}`, 'Статья выпуска')}` : ''}${it.book ? ` ${this.link(`/book?id=${it.book}`, 'Карточка')}` : ''}</td>
            </tr>`).join('')}
        </table>`).join('')}
      <h3 class="pp-h3">Статьи выпуска</h3>
      <ul class="pp-artlist">
        ${articles.map(a => `<li>${this.link(`/article?id=${a.id}`, this.esc(a.title))}<br><span class="pp-small">${this.esc(a.rubric)}. ${this.esc(this.staff(a.by).name)}, ${this.esc(a.date)}</span></li>`).join('')}
      </ul>`;
  }

  noteMarks(text, artId) {
    return this.esc(text).replace(/\{(\d+)\}/g, (m, n) => `<sup><a class="pp-noteref" data-pp-jump="pp-n-${artId}-${n}">${n}</a></sup>`);
  }

  comments(articleId) {
    const user = this.loadUser();
    const seed = (this.data.comments || {})[articleId] || [];
    const mine = user.comments[articleId] || [];
    return seed.concat(mine);
  }

  addComment(articleId, name, text) {
    if (!this.article(articleId)) return false;
    const clean = String(text || '').trim().slice(0, 700);
    if (!clean) return false;
    const user = this.loadUser();
    const list = user.comments[articleId] || [];
    list.push({ name: String(name || '').trim().slice(0, 40) || 'Читатель', date: `${this.data.siteDay} ${this.time()}`, text: clean });
    user.comments[articleId] = list;
    this.saveUser(user);
    return true;
  }

  time() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  renderArticle(id) {
    const a = this.article(id);
    if (!a) return null;
    const by = this.staff(a.by);
    const comments = this.comments(a.id);
    const body = a.body.map((p, i) => {
      if (i === 0) {
        const first = p.charAt(0);
        return `<p class="pp-dropcap-p"><span class="pp-dropcap">${this.esc(first)}</span>${this.noteMarks(p.slice(1), a.id)}</p>`;
      }
      return `<p>${this.noteMarks(p, a.id)}</p>`;
    }).join('');
    return `
      <div class="pp-rubric">${this.esc(a.rubric)}</div>
      <h1 class="pp-h1 pp-art-title">${this.esc(a.title)}</h1>
      <p class="pp-byline">${this.esc(by.name)}, ${this.esc(by.role)}. ${this.esc(a.date)}</p>
      <p class="pp-lead">${this.esc(a.lead)}</p>
      ${body}
      ${a.notes && a.notes.length ? `
        <div class="pp-notes">
          <div class="pp-notes-rule"></div>
          ${a.notes.map((n, i) => `<p id="pp-n-${a.id}-${i + 1}"><sup>${i + 1}</sup> ${this.esc(n)}</p>`).join('')}
        </div>` : ''}
      <p class="pp-actions">
        <button type="button" class="pp-btn" data-pp-notepad="article:${a.id}">Статью в Блокнот</button>
        <button type="button" class="pp-btn" data-pp-save="article:${a.id}">Сохранить в «Мои документы»</button>
      </p>
      <h3 class="pp-h3">Отклики (${comments.length})</h3>
      ${comments.map(c => `
        <div class="pp-reply">
          <b>${this.esc(c.name)}</b> <span class="pp-small">${this.esc(c.date)}</span>
          <div>${this.esc(c.text)}</div>
        </div>`).join('') || '<p class="pp-small">Откликов пока нет. Ваш будет первым.</p>'}
      <table class="pp-form" cellspacing="0" cellpadding="3">
        <tr><td>Подпись:</td><td><input type="text" id="pp-c-name" size="30" maxlength="40"></td></tr>
        <tr><td valign="top">Отклик:</td><td><textarea id="pp-c-text" rows="4" cols="52"></textarea></td></tr>
        <tr><td></td><td><button type="button" class="pp-btn" data-pp-comment="${a.id}">Добавить отклик</button></td></tr>
      </table>`;
  }

  renderJournals() {
    const journals = this.data.journals || [];
    const sel = this.issue ? this.issue.split(':') : null;
    const selJ = sel ? this.journal(sel[0]) : null;
    const selItem = selJ ? (selJ.issues || []).find(it => it.n.includes(Number(sel[1]))) : null;
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const grid = journals.map(j => `
      <tr>
        <th class="pp-bind-name" align="left">${this.esc(j.title)}</th>
        ${months.map(n => {
          const hit = (j.issues || []).find(it => it.n.includes(n));
          const on = sel && sel[0] === j.id && hit && hit === selItem;
          if (!hit) return `<td class="pp-bind-cell"><span class="pp-bind-v" style="background-color:${j.color}">${n}</span></td>`;
          return `<td class="pp-bind-cell"><a class="pp-bind-v pp-bind-hit${on ? ' pp-bind-on' : ''}" style="background-color:${j.color}" data-pp-issue="${j.id}:${n}" title="${this.esc(hit.what)}">${n}</a></td>`;
        }).join('')}
      </tr>`).join('');
    const detail = selItem ? `
      <div class="pp-bind-detail">
        <b>${this.esc(selJ.title)}, 1999, № ${this.esc(selItem.n.length > 1 ? `${selItem.n[0]}–${selItem.n[selItem.n.length - 1]}` : selItem.n[0])}.</b> ${this.esc(selItem.what)}
        ${selItem.note ? `<br>${this.esc(selItem.note)}` : ''}
        ${selItem.book ? `<br>${this.link(`/book?id=${selItem.book}`, 'Карточка на полке')}` : ''}
      </div>` : '<div class="pp-bind-detail pp-small">Номера с золотым тиснением отмечены редакцией. Щёлкните по такому корешку.</div>';
    return `
      <h1 class="pp-h1">Годовая подшивка 1999</h1>
      <p class="pp-lead">${this.esc(this.data.journalsIntro || '')}</p>
      <table class="pp-bind" cellspacing="0" cellpadding="0">
        <tr><th></th>${months.map(n => `<th class="pp-bind-m">${n}</th>`).join('')}</tr>
        ${grid}
      </table>
      ${detail}
      ${journals.map(j => `
        <h3 class="pp-h3">${this.esc(j.title)}</h3>
        <table class="pp-where" cellspacing="0" cellpadding="3">
          ${j.facts.map(([k, v]) => `<tr><th>${this.esc(k)}</th><td>${this.esc(v)}</td></tr>`).join('')}
        </table>
        <p>${this.esc(j.about)}</p>`).join('')}`;
  }

  speedLabel(bps) {
    return { 14400: '14 400', 28800: '28 800', 33600: '33 600', 56000: '56K' }[bps] || String(bps);
  }

  modemSeconds(kb, bps) {
    const bytesPerSec = (bps / 10) * 0.85;
    return Math.max(1, Math.round(kb * 1024 / bytesPerSec));
  }

  modemTime(kb, bps) {
    const s = this.modemSeconds(kb, bps);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m ? `${m} мин ${r} с` : `${r} с`;
  }

  floppies(kb) {
    const zip = Math.max(1, Math.round(kb * 0.38));
    return { zip, disks: Math.max(1, Math.ceil(zip / 1423)) };
  }

  renderNet() {
    const files = this.data.netFiles || [];
    const nodes = this.data.netNodes || [];
    const speeds = [14400, 28800, 33600, 56000];
    const total = files.reduce((s, f) => s + f.kb, 0);
    const rows = files.map((f, i) => {
      const fl = this.floppies(f.kb);
      return `
        <tr class="${i % 2 ? 'pp-q-odd' : ''}">
          <td>${this.gif('disk')} ${this.esc(f.name)}</td>
          <td>${this.esc(f.from)}</td>
          <td align="right">${f.kb} КБ</td>
          <td align="right">${fl.zip} КБ</td>
          <td align="right">${this.esc(this.modemTime(f.kb, this.modemBps))}</td>
        </tr>`;
    }).join('');
    return `
      <h1 class="pp-h1">Чтение по модему</h1>
      <p class="pp-lead">${this.esc(this.data.netIntro || '')}</p>
      <div class="pp-win">
        <div class="pp-win-title">ReGet Junior — очередь закачек (${files.length})</div>
        <div class="pp-win-bar">
          Скорость линии:
          ${speeds.map(s => s === this.modemBps
            ? `<b class="pp-win-on">${this.speedLabel(s)}</b>`
            : `<a class="pp-win-btn" data-pp-modem="${s}">${this.speedLabel(s)}</a>`).join(' ')}
        </div>
        <table class="pp-q" width="100%" cellspacing="0" cellpadding="2">
          <tr><th align="left">Файл</th><th align="left">Откуда</th><th>Размер</th><th>В ZIP</th><th>Время</th></tr>
          ${rows}
        </table>
        <div class="pp-win-status">Всего ${total} КБ. Без обрывов: ${this.esc(this.modemTime(total, this.modemBps))}. Дискет 3,5" после архивации: ${this.floppies(total).disks}.</div>
      </div>
      <p class="pp-small">${this.esc(this.data.netNote || '')}</p>
      <h3 class="pp-h3">Где читать</h3>
      <dl class="pp-nodes">
        ${nodes.map(n => `<dt>${n.url ? `<a data-url="${this.esc(n.url)}">${this.esc(n.name)}</a>` : this.esc(n.name)} <span class="pp-small">${this.esc(n.host)}</span></dt><dd>${this.esc(n.about)}</dd>`).join('')}
      </dl>`;
  }

  allAds() {
    const user = this.loadUser();
    return (this.data.ads || []).map(a => ({ ...a, mine: false })).concat(user.ads.map(a => ({ ...a, mine: true })));
  }

  addAd(ad) {
    const kinds = (this.data.adKinds || []).map(k => k[0]);
    const text = String(ad.text || '').trim().slice(0, 300);
    if (!text) return false;
    const user = this.loadUser();
    user.ads.push({
      kind: kinds.includes(ad.kind) ? ad.kind : kinds[0],
      text,
      city: String(ad.city || '').trim().slice(0, 40) || 'Москва',
      contact: String(ad.contact || '').trim().slice(0, 50),
      date: this.data.siteDay
    });
    this.saveUser(user);
    return true;
  }

  renderBukinist(kind) {
    const kinds = this.data.adKinds || [];
    const valid = kinds.some(k => k[0] === kind) ? kind : '';
    const ads = this.allAds().filter(a => !valid || a.kind === valid);
    const half = Math.ceil(ads.length / 2);
    const col = list => list.map(a => `
      <p class="pp-ad"><b>${this.esc((kinds.find(k => k[0] === a.kind) || [a.kind, a.kind])[1].toUpperCase())}.</b> ${this.esc(a.text)} <i>${this.esc(a.city)}${a.contact ? `, ${this.esc(a.contact)}` : ''}.</i>${a.mine ? ` ${this.gif('new')}` : ''}</p>`).join('');
    const keeper = this.staff('bukinist');
    return `
      <h1 class="pp-h1 pp-center">БУКИНИСТ</h1>
      <p class="pp-center pp-small">Объявления читателей принимает и печатает бесплатно ${this.esc(keeper.name)}.
        Сокращения: тв. пер. — твёрдый переплёт, мяг. — мягкая обложка, сост. — состояние.</p>
      <p class="pp-center pp-kinds">
        ${valid ? this.link('/bukinist', 'Все') : '<b>Все</b>'}
        ${kinds.map(([k, label]) => ` | ${valid === k ? `<b>${label}</b>` : this.link(`/bukinist?kind=${k}`, label)}`).join('')}
      </p>
      <table class="pp-ads" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td valign="top" class="pp-ads-col">${col(ads.slice(0, half))}</td>
          <td valign="top" class="pp-ads-col pp-ads-col2">${col(ads.slice(half)) || '&nbsp;'}</td>
        </tr>
      </table>
      <h3 class="pp-h3">Подать объявление</h3>
      <table class="pp-form" cellspacing="0" cellpadding="3">
        <tr><td>Рубрика:</td><td><select id="pp-ad-kind">${kinds.map(([k, label]) => `<option value="${k}">${label}</option>`).join('')}</select></td></tr>
        <tr><td valign="top">Текст:</td><td><textarea id="pp-ad-text" rows="3" cols="52"></textarea><br><span class="pp-small">До 300 знаков. Пишите коротко: автор, заглавие, издательство, год, состояние.</span></td></tr>
        <tr><td>Город:</td><td><input type="text" id="pp-ad-city" size="24" maxlength="40"></td></tr>
        <tr><td>Связь:</td><td><input type="text" id="pp-ad-contact" size="30" maxlength="50"> <span class="pp-small">e-mail, ICQ или FidoNet</span></td></tr>
        <tr><td></td><td><button type="button" class="pp-btn" data-pp-ad="1">Отдать в набор</button></td></tr>
      </table>`;
  }

  allGuestbook() {
    const user = this.loadUser();
    return (this.data.guestbook || []).concat(user.guestbook);
  }

  addGuestbookEntry(entry) {
    const text = String(entry.text || '').trim().slice(0, 700);
    if (!text) return false;
    const user = this.loadUser();
    user.guestbook.push({
      name: String(entry.name || '').trim().slice(0, 40) || 'Читатель',
      from: String(entry.from || '').trim().slice(0, 40),
      date: `${this.data.siteDay} ${this.time()}`,
      text
    });
    this.saveUser(user);
    return true;
  }

  renderGuestbook() {
    const list = this.allGuestbook();
    const first = this.data.guestbookFirstNo || 1;
    const rows = list.map((e, i) => ({ ...e, no: first + i })).reverse();
    return `
      <div class="pp-gb-cover">КНИГА ОТЗЫВОВ И ПРЕДЛОЖЕНИЙ<br><span>альманаха «Переплёт ’99»</span></div>
      <table class="pp-form pp-gb-form" cellspacing="0" cellpadding="3">
        <tr><td>Имя:</td><td><input type="text" id="pp-gb-name" size="26" maxlength="40"></td>
            <td>Откуда:</td><td><input type="text" id="pp-gb-from" size="18" maxlength="40"></td></tr>
        <tr><td valign="top">Запись:</td><td colspan="3"><textarea id="pp-gb-text" rows="4" cols="56"></textarea></td></tr>
        <tr><td></td><td colspan="3"><button type="button" class="pp-btn" data-pp-gb="1">Записать в книгу</button></td></tr>
      </table>
      <div class="pp-ruled">
        ${rows.map(e => `
          <div class="pp-gb-entry">
            <div class="pp-gb-meta">№ ${e.no}. ${this.esc(e.date)}. <b>${this.esc(e.name)}</b>${e.from ? `, ${this.esc(e.from)}` : ''}</div>
            <div class="pp-gb-text">${this.esc(e.text)}</div>
            ${e.reply ? `<div class="pp-gb-reply">${this.esc(e.reply)}</div>` : ''}
          </div>`).join('')}
      </div>`;
  }

  renderAbout() {
    const d = this.data;
    const issue = d.issue || {};
    const staff = d.staff || [];
    const kb = Math.round(JSON.stringify(d).length / 1024);
    return `
      <div class="pp-imprint">
        <p class="pp-imp-title">ПЕРЕПЛЁТ ’99</p>
        <p>Литературный альманах в Сети<br>Выпуск ${this.esc(issue.no || '')} (${this.esc(issue.total || '')}), ${this.esc((issue.month || '').toLowerCase())}</p>
        <table class="pp-imp-staff" cellspacing="0" cellpadding="1" align="center">
          ${staff.map(s => `<tr><td align="right"><i>${this.esc(s.role)}</i></td><td>${this.esc(s.name)}</td></tr>`).join('')}
        </table>
        <p>${this.esc(d.address || '')}<br><a href="mailto:editor@pereplet99.ru">editor@pereplet99.ru</a></p>
        <p class="pp-imp-small">Подписано в Сеть ${this.esc(d.siteDay || '')}. Формат 800x600. Гарнитура «Таймс».<br>
          Объём выпуска ${kb} КБ. Тираж ${String(this.hitCount).padStart(6, '0')} экз. по счётчику посещений.<br>
          Сервер Apache 1.3.9, хостинг на узле провайдера в Москве.</p>
      </div>
      <h3 class="pp-h3">Об альманахе</h3>
      ${(d.history || []).map(p => `<p>${this.esc(p)}</p>`).join('')}
      <h3 class="pp-h3">Авторам</h3>
      ${(d.rules || []).map(p => `<p>${this.esc(p)}</p>`).join('')}`;
  }

  bookText(b) {
    return [
      'АЛЬМАНАХ «ПЕРЕПЛЁТ \'99». КАРТОЧКА ИЗ КАТАЛОГА РЕДАКЦИИ',
      '',
      `${b.card.call}`,
      `${b.card.mark}`,
      `    ${b.card.heading}`,
      ...b.card.body.map(l => `      ${l}`),
      '',
      ...b.card.tracing.map(l => `      ${l}`),
      '',
      `Отзыв: ${this.staff(b.reviewer).name}`,
      '',
      ...b.review,
      '',
      `Где взять: ${b.where}`,
      '',
      'http://www.pereplet99.ru/book?id=' + b.id
    ].join('\r\n');
  }

  articleText(a) {
    const by = this.staff(a.by);
    return [
      `АЛЬМАНАХ «ПЕРЕПЛЁТ '99», ВЫПУСК ${(this.data.issue || {}).no || ''}`,
      `${a.rubric}. ${a.date}`,
      '',
      a.title.toUpperCase(),
      `${by.name}, ${by.role}`,
      '',
      a.lead,
      '',
      ...a.body.map(p => p.replace(/\{(\d+)\}/g, '[$1]')),
      '',
      ...(a.notes || []).map((n, i) => `[${i + 1}] ${n}`),
      '',
      'http://www.pereplet99.ru/article?id=' + a.id
    ].join('\r\n');
  }

  docFor(spec) {
    const [type, id] = String(spec || '').split(':');
    if (type === 'book') {
      const b = this.book(id);
      return b ? { file: b.file, text: this.bookText(b) } : null;
    }
    if (type === 'article') {
      const a = this.article(id);
      return a ? { file: a.file, text: this.articleText(a) } : null;
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

  setModem(bps) {
    const n = Number(bps);
    this.modemBps = [14400, 28800, 33600, 56000].includes(n) ? n : 33600;
    return this.modemBps;
  }

  pickIssue(spec) {
    const [jid, n] = String(spec || '').split(':');
    const j = this.journal(jid);
    if (!j || !(j.issues || []).some(it => it.n.includes(Number(n)))) return false;
    this.issue = `${jid}:${Number(n)}`;
    return true;
  }

  attachEvents(win, container, ie) {
    const root = (typeof container.querySelector === 'function' && container.querySelector('.pp-site')) || container;
    const path = (root.dataset && root.dataset.ppPath) || '/';
    const sound = kind => {
      if (typeof window !== 'undefined' && window.soundSys && typeof window.soundSys[kind] === 'function') window.soundSys[kind]();
    };
    const rerender = (keepScroll = true) => {
      const top = container.scrollTop || 0;
      ie.renderPage(win, ie.currentUrl);
      container.scrollTop = keepScroll ? top : 0;
    };
    const value = sel => {
      const el = typeof root.querySelector === 'function' ? root.querySelector(sel) : null;
      return el ? el.value : '';
    };
    const say = text => {
      this.notice = { path, text };
    };
    const jump = id => {
      const el = typeof root.querySelector === 'function' ? root.querySelector(`#${id}`) : null;
      if (!el || typeof el.getBoundingClientRect !== 'function' || typeof container.getBoundingClientRect !== 'function') return;
      container.scrollTop += el.getBoundingClientRect().top - container.getBoundingClientRect().top - 8;
    };

    if (typeof root.addEventListener !== 'function') return;
    root.addEventListener('click', e => {
      const t = e.target && typeof e.target.closest === 'function'
        ? e.target.closest('[data-pp-enc],[data-pp-poll],[data-pp-notepad],[data-pp-save],[data-pp-comment],[data-pp-gb],[data-pp-ad],[data-pp-modem],[data-pp-issue],[data-pp-jump],[data-pp-clippy]')
        : null;
      if (!t) return;
      const d = t.dataset;
      if (d.ppEnc) {
        this.encoding = ['win1251', 'koi8', 'translit'].includes(d.ppEnc) ? d.ppEnc : 'win1251';
        sound('playClick');
        rerender();
      } else if (d.ppPoll) {
        const checked = typeof root.querySelector === 'function' ? root.querySelector('input[name="pp-poll"]:checked') : null;
        if (!checked) {
          say('Отметьте один из ответов анкеты.');
          rerender();
          return;
        }
        this.savePollVote(checked.value);
        say('Спасибо, ответ записан.');
        sound('playDing');
        rerender();
      } else if (d.ppNotepad) {
        this.openDoc(d.ppNotepad);
      } else if (d.ppSave) {
        const file = this.saveDoc(d.ppSave);
        if (file) {
          say(`Файл ${file} сохранён в папку «Мои документы».`);
          sound('playDing');
          rerender();
        }
      } else if (d.ppComment) {
        if (!value('#pp-c-text').trim()) {
          say('Напишите текст отклика.');
          rerender();
          return;
        }
        this.addComment(d.ppComment, value('#pp-c-name'), value('#pp-c-text'));
        say('Отклик добавлен.');
        sound('playDing');
        rerender();
      } else if (d.ppGb) {
        if (!value('#pp-gb-text').trim()) {
          say('Пустую запись в книгу не внести. Напишите хоть строчку.');
          rerender();
          return;
        }
        this.addGuestbookEntry({ name: value('#pp-gb-name'), from: value('#pp-gb-from'), text: value('#pp-gb-text') });
        say('Запись внесена в книгу отзывов.');
        sound('playDing');
        rerender(false);
      } else if (d.ppAd) {
        if (!value('#pp-ad-text').trim()) {
          say('Объявление без текста в набор не берут.');
          rerender();
          return;
        }
        this.addAd({ kind: value('#pp-ad-kind'), text: value('#pp-ad-text'), city: value('#pp-ad-city'), contact: value('#pp-ad-contact') });
        say('Объявление набрано и стоит в колонке.');
        sound('playDing');
        rerender();
      } else if (d.ppModem) {
        this.setModem(d.ppModem);
        sound('playClick');
        rerender();
      } else if (d.ppIssue) {
        if (this.pickIssue(d.ppIssue)) {
          sound('playClick');
          rerender();
        }
      } else if (d.ppJump) {
        jump(d.ppJump);
      } else if (d.ppClippy) {
        if (typeof window !== 'undefined' && window.appClippy) {
          window.appClippy.show();
          window.appClippy._lastIePageKey = null;
          window.appClippy.onNavigateIE(ie.currentUrl || this.baseUrl, 'pereplet', 'Переплёт \'99');
        }
      }
    });
  }
}

window.perepletSite = new PerepletSite();
