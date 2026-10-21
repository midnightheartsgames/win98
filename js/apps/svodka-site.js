class SvodkaSite {
  constructor() {
    this.baseUrl = 'http://www.svodka99.ru';
    this.userKey = 'win98_svodka_user_v2';
    this.hitKey = 'win98_svodka_hits_v1';
    this.legacyKeys = {
      poll: 'win98_svodka_poll_v1',
      comments: 'win98_svodka_comments_v1',
      telegraph: 'win98_svodka_telegraph_v1',
      checks: 'win98_svodka_y2kcheck_v1'
    };
    this.encoding = 'win1251';
    this.textOnly = false;
    this.fontSize = 13;
    this.proofText = '';
    this.proofChecked = false;
    this.notice = null;
    this.hitCount = 0;
    this.initHits();
  }

  get data() {
    return (typeof window !== 'undefined' && window.svodkaData) || {};
  }

  store() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) {}
    return null;
  }

  initHits() {
    const ls = this.store();
    let count = this.data.hitsBase || 44620;
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
      count += 1;
    }
    this.hitCount = count;
  }

  emptyUser() {
    return { comments: {}, telegrams: [], poll: null, checks: {} };
  }

  loadUser() {
    const ls = this.store();
    if (!ls) return this.emptyUser();
    try {
      const raw = ls.getItem(this.userKey);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          return {
            comments: p.comments && typeof p.comments === 'object' ? p.comments : {},
            telegrams: Array.isArray(p.telegrams) ? p.telegrams : [],
            poll: typeof p.poll === 'string' ? p.poll : null,
            checks: p.checks && typeof p.checks === 'object' ? p.checks : {}
          };
        }
      }
    } catch (e) {}
    return this.migrateLegacy();
  }

  readLegacy(key) {
    const ls = this.store();
    try {
      const raw = ls ? ls.getItem(key) : null;
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  migrateLegacy() {
    const user = this.emptyUser();
    const ls = this.store();
    if (!ls) return user;
    const poll = this.readLegacy(this.legacyKeys.poll);
    if (poll && typeof poll.votedChoice === 'string' && this.data.poll.seed[poll.votedChoice] != null) user.poll = poll.votedChoice;
    const seedTexts = new Set();
    Object.values(this.data.comments || {}).forEach(list => list.forEach(c => seedTexts.add(c.text)));
    const oldComments = this.readLegacy(this.legacyKeys.comments);
    if (oldComments && typeof oldComments === 'object') {
      Object.keys(oldComments).forEach(id => {
        if (!this.article(id) || !Array.isArray(oldComments[id])) return;
        const own = oldComments[id].filter(c => c && c.text && !seedTexts.has(c.text) && c.author !== 'Читатель_Сводки' && !String(c.text).startsWith('Подтверждаю: у нас на ТЭЦ-9'));
        if (own.length) user.comments[id] = own.map(c => ({ author: String(c.author || '').slice(0, 40), date: '28.12.1999 18:45', text: String(c.text).slice(0, 1000) })).reverse();
      });
    }
    const oldTg = this.readLegacy(this.legacyKeys.telegraph);
    if (Array.isArray(oldTg)) {
      oldTg.filter(t => t && String(t.id || '').startsWith('tg-user-')).reverse().forEach(t => {
        user.telegrams.push({
          name: String(t.name || '').slice(0, 40),
          city: String(t.city || '').slice(0, 40),
          contact: String(t.contact || '').slice(0, 50),
          rubric: this.telegramRubric(t.rubric) ? t.rubric : 'net',
          kind: 'plain',
          date: '28.12.1999 18:45',
          text: String(t.text || '').slice(0, 600),
          reply: ''
        });
      });
    }
    const oldChecks = this.readLegacy(this.legacyKeys.checks);
    if (oldChecks && typeof oldChecks === 'object') {
      this.data.checklist.forEach(c => {
        if (typeof oldChecks[c.id] === 'boolean') user.checks[c.id] = oldChecks[c.id];
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
      .replace(/'/g, '&#039;');
  }

  url(path = '/') {
    if (!path || path === '/') return this.baseUrl;
    return this.baseUrl + (path.startsWith('/') ? path : '/' + path);
  }

  gif(name) {
    if (typeof window === 'undefined' || typeof window.webGif !== 'function') return '';
    return `<span class="svd-pic">${window.webGif(name, 1)}</span>`;
  }

  rubric(id) {
    return (this.data.rubrics || []).find(r => r.id === id) || null;
  }

  article(id) {
    return (this.data.articles || []).find(a => a.id === id) || null;
  }

  card(id) {
    return (this.data.cards || []).find(c => c.id === id) || null;
  }

  telegramRubric(id) {
    const row = (this.data.telegramRubrics || []).find(([k]) => k === id);
    return row ? row[1] : '';
  }

  parseRoute(url = '') {
    const raw = String(url || this.baseUrl);
    const noHash = raw.split('#')[0];
    const qIdx = noHash.indexOf('?');
    const query = qIdx >= 0 ? noHash.slice(qIdx + 1) : '';
    let path = (qIdx >= 0 ? noHash.slice(0, qIdx) : noHash).replace(/^[a-z]+:\/{2}[^/]+/i, '').replace(/\/+$/, '') || '/';
    if (path === '/index.html' || path === '/index.htm') path = '/';
    const params = {};
    query.split('&').forEach(pair => {
      if (!pair) return;
      const eq = pair.indexOf('=');
      const k = eq >= 0 ? pair.slice(0, eq) : pair;
      const v = eq >= 0 ? pair.slice(eq + 1) : '';
      try {
        params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
      } catch (e) {
        params[k] = v;
      }
    });
    const routes = {
      '/': 'home',
      '/lenta': 'lenta',
      '/article': 'article',
      '/print': 'print',
      '/dossiers': 'dossiers',
      '/spravka': 'dossiers',
      '/economy': 'economy',
      '/editorial': 'editorial',
      '/y2k': 'y2k',
      '/telegraph': 'telegraph',
      '/about': 'about'
    };
    return { page: routes[path] || '404', path, params };
  }

  getPageTitle(url = '') {
    const r = this.parseRoute(url);
    const titles = {
      home: "Сводка.ру '99 :: первая полоса, 28.12.1999",
      lenta: "Сводка.ру '99 :: лента 28.12.1999",
      dossiers: "Сводка.ру '99 :: справочная",
      economy: "Сводка.ру '99 :: деньги",
      editorial: "Сводка.ру '99 :: правка",
      y2k: "Сводка.ру '99 :: Проблема-2000",
      telegraph: "Сводка.ру '99 :: телеграммы читателей",
      about: "Сводка.ру '99 :: редакция"
    };
    if (r.page === 'article' || r.page === 'print') {
      const art = this.article(r.params.id);
      if (!art) return '404 Not Found';
      return r.page === 'print' ? `${art.headline} (версия для печати)` : `Сводка.ру '99 :: ${art.headline}`;
    }
    return titles[r.page] || '404 Not Found';
  }

  encodeHtml(html) {
    if (this.encoding === 'koi8') {
      const koi = 'юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ';
      const map = ch => {
        if (ch === 'Ё') return 'і';
        if (ch === 'ё') return 'Ј';
        const idx = koi.indexOf(ch);
        return idx >= 0 ? String.fromCharCode(0x410 + idx) : ch;
      };
      return html.replace(/>([^<]+)</g, (m, text) => '>' + text.replace(/[А-яЁё]/g, map) + '<');
    }
    if (this.encoding === 'translit') {
      const t = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j',
        'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
        'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      const map = ch => {
        const lower = ch.toLowerCase();
        const out = t[lower];
        if (out == null) return ch;
        return ch === lower ? out : out.charAt(0).toUpperCase() + out.slice(1);
      };
      return html.replace(/>([^<]+)</g, (m, text) => '>' + text.replace(/[А-яЁё]/g, map) + '<');
    }
    return html;
  }

  pollCounts(user) {
    const counts = Object.assign({}, this.data.poll.seed);
    if (user.poll && counts[user.poll] != null) counts[user.poll] += 1;
    return counts;
  }

  savePollVote(choice) {
    const user = this.loadUser();
    if (this.data.poll.seed[choice] == null) return this.pollCounts(user);
    user.poll = choice;
    this.saveUser(user);
    return this.pollCounts(user);
  }

  getComments(articleId) {
    const user = this.loadUser();
    const own = (user.comments[articleId] || []).slice();
    const seed = (this.data.comments || {})[articleId] || [];
    return seed.concat(own);
  }

  addComment(articleId, author, text) {
    const clean = String(text || '').trim().slice(0, 1000);
    if (!clean || !this.article(articleId)) return null;
    const user = this.loadUser();
    if (!user.comments[articleId]) user.comments[articleId] = [];
    const entry = { author: String(author || '').trim().slice(0, 40) || 'Читатель', date: '28.12.1999 18:45', text: clean };
    user.comments[articleId].push(entry);
    this.saveUser(user);
    return entry;
  }

  getTelegrams() {
    const user = this.loadUser();
    return user.telegrams.slice().reverse().concat(this.data.telegrams || []);
  }

  addTelegram(fields) {
    const text = String(fields.text || '').trim().slice(0, 600);
    if (!text) return null;
    const user = this.loadUser();
    const entry = {
      name: String(fields.name || '').trim().slice(0, 40) || 'Читатель',
      city: String(fields.city || '').trim().slice(0, 40) || 'Москва',
      contact: String(fields.contact || '').trim().slice(0, 50),
      rubric: this.telegramRubric(fields.rubric) ? fields.rubric : 'net',
      kind: fields.kind === 'urgent' ? 'urgent' : 'plain',
      date: '28.12.1999 18:45',
      text,
      reply: 'Дежурный по выпуску: телеграмма принята в ленту читателей.'
    };
    user.telegrams.push(entry);
    this.saveUser(user);
    return entry;
  }

  toTelegram(text) {
    let s = String(text || '').toUpperCase();
    s = s.replace(/[«»"„“]/g, '');
    s = s.replace(/\s[—–-]\s/g, ' ');
    s = s.replace(/[,;](?=\s|$)/g, ' ЗПТ ');
    s = s.replace(/[.!?…]+(?=\s|$)/g, ' ТЧК ');
    s = s.replace(/[()]/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(/(\sТЧК)+$/, '').replace(/^ТЧК\s?/, '');
    return s;
  }

  telegramWords(text) {
    const t = this.toTelegram(text);
    return t ? t.split(' ').length : 0;
  }

  telegramStrips(text, width = 40) {
    const words = this.toTelegram(text).split(' ').filter(Boolean);
    const strips = [];
    let line = '';
    words.forEach(w => {
      if (line && (line + ' ' + w).length > width) {
        strips.push(line);
        line = w;
      } else {
        line = line ? line + ' ' + w : w;
      }
    });
    if (line) strips.push(line);
    return strips;
  }

  getChecks() {
    const user = this.loadUser();
    const out = {};
    this.data.checklist.forEach(c => { out[c.id] = !!user.checks[c.id]; });
    return out;
  }

  setCheck(id, value) {
    if (!this.data.checklist.some(c => c.id === id)) return this.getChecks();
    const user = this.loadUser();
    user.checks[id] = !!value;
    this.saveUser(user);
    return this.getChecks();
  }

  money(n, digits = 2) {
    const fixed = Number(n).toFixed(digits);
    const [int, frac] = fixed.split('.');
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return frac ? `${grouped},${frac}` : grouped;
  }

  calcInput(params = {}) {
    const sum = Math.round(Number(String(params.sum || '').replace(/[^\d]/g, '')) || 0);
    const profiles = this.data.calc.profiles;
    return {
      sum: Math.min(500000, Math.max(100, sum || 2695)),
      profile: profiles[params.profile] ? params.profile : 'family',
      tariff: params.tariff === 'day' ? 'day' : 'night'
    };
  }

  calculate(input) {
    const c = this.data.calc;
    const hourRub = (input.tariff === 'day' ? c.day : c.night) * c.usd;
    return {
      sum: input.sum,
      usd: input.sum / c.usd,
      dem: input.sum / c.dem,
      hourRub,
      hours: Math.floor(input.sum / hourRub),
      goods: c.goods.map(g => ({ name: g.name, unit: g.unit, price: g.price, count: Math.floor(input.sum / g.price) })),
      note: c.profiles[input.profile].note
    };
  }

  calcText(input) {
    const r = this.calculate(input);
    const lines = [
      `СВОДКА.РУ '99. ВЕДОМОСТЬ НА ${this.money(r.sum, 0)} РУБ. (28.12.1999)`,
      '='.repeat(62),
      `Курс ЦБ на 28.12.1999: 26,95 руб. за доллар, 13,98 за марку`,
      `В долларах: ${this.money(r.usd)}`,
      `В немецких марках: ${this.money(r.dem)}`,
      `Интернет (${input.tariff === 'day' ? 'дневной' : 'ночной'} тариф, ${this.money(r.hourRub)} руб./ч): ${r.hours} ч`,
      ...r.goods.map(g => `${g.name} по ${g.price} руб.: ${g.count} ${g.unit}`),
      '',
      r.note,
      '='.repeat(62),
      this.url('/economy')
    ];
    return lines.join('\r\n');
  }

  proofCheck(text) {
    const src = String(text || '');
    const found = [];
    (this.data.stamps || []).forEach(st => {
      const re = new RegExp(`(?<![а-яёa-z])(?:${st.re})`, 'giu');
      let m;
      while ((m = re.exec(src)) !== null) {
        if (!m[0]) { re.lastIndex++; continue; }
        found.push({ start: m.index, end: m.index + m[0].replace(/\s+$/, '').length, fix: st.fix });
      }
    });
    found.sort((a, b) => a.start - b.start || b.end - a.end);
    const hits = [];
    let edge = -1;
    found.forEach(f => {
      if (f.start >= edge) {
        hits.push(f);
        edge = f.end;
      }
    });
    const words = src.split(/\s+/).filter(Boolean).length;
    const stampWords = hits.reduce((s, h) => s + src.slice(h.start, h.end).split(/\s+/).filter(Boolean).length, 0);
    const water = words ? Math.round(stampWords / words * 100) : 0;
    let verdict = 'Вставьте текст и нажмите «Проверить».';
    if (words) {
      if (!hits.length) verdict = 'Чисто. Можно ставить в номер.';
      else if (hits.length <= 2) verdict = 'Пара штампов. Поправьте и ставьте в номер.';
      else verdict = 'Канцелярит. Перепишите: кто, где, когда, сколько.';
    }
    return { text: src, hits: hits.map(h => ({ start: h.start, end: h.end, phrase: src.slice(h.start, h.end), fix: h.fix })), words, water, verdict };
  }

  proofMarkup(result) {
    let out = '';
    let pos = 0;
    result.hits.forEach(h => {
      out += this.esc(result.text.slice(pos, h.start));
      out += `<del class="svd-stamp">${this.esc(h.phrase)}</del><sup class="svd-fix">${this.esc(h.fix)}</sup>`;
      pos = h.end;
    });
    out += this.esc(result.text.slice(pos));
    return out.replace(/\r?\n/g, '<br>');
  }

  proofReport(result) {
    return [
      "СВОДКА.РУ '99. ПРАВКА (28.12.1999)",
      '='.repeat(62),
      `Слов: ${result.words}. Штампов: ${result.hits.length}. Вода: ${result.water}%.`,
      `Вердикт: ${result.verdict}`,
      '',
      'ТЕКСТ:',
      result.text,
      '',
      'ЗАМЕЧАНИЯ РЕДАКТОРА:',
      ...(result.hits.length ? result.hits.map((h, i) => `${i + 1}. «${h.phrase}» -> ${h.fix}`) : ['Замечаний нет.']),
      '='.repeat(62),
      this.url('/editorial')
    ].join('\r\n');
  }

  articleText(art) {
    const r = this.rubric(art.cat);
    return [
      `СВОДКА.РУ '99. ЕЖЕДНЕВНАЯ ИНТЕРНЕТ-ГАЗЕТА`,
      `${r ? r.label : ''}, ${art.date}. ${art.author}, ${art.desk}`,
      '='.repeat(62),
      art.headline.toUpperCase(),
      '',
      art.lead,
      '',
      ...art.body.reduce((acc, p) => acc.concat([p, '']), []),
      art.quote,
      '',
      'СПРАВКА:',
      ...art.facts.map(([k, v]) => `${k}: ${v}`),
      '='.repeat(62),
      this.url('/article?id=' + art.id)
    ].join('\r\n');
  }

  cardFile(c) {
    return `KARTOTEKA_${c.id.toUpperCase().replace(/-/g, '_')}.TXT`;
  }

  cardText(c) {
    const drawer = this.data.drawers.find(d => d.id === c.drawer);
    return [
      "СВОДКА.РУ '99. СПРАВОЧНАЯ, КАРТОЧКА " + this.cardNumber(c),
      `Ящик «${drawer ? drawer.label : ''}»`,
      '='.repeat(62),
      c.name.toUpperCase(),
      c.kind,
      '',
      `Как выглядит: ${c.look}`,
      '',
      `Что было в 1999 году: ${c.year}`,
      '',
      `Порядки: ${c.rules}`,
      '',
      `На 28 декабря: ${c.now}`,
      '='.repeat(62),
      this.url('/dossiers?id=' + c.id)
    ].join('\r\n');
  }

  cardNumber(c) {
    const drawer = this.data.drawers.find(d => d.id === c.drawer);
    const list = this.data.cards.filter(x => x.drawer === c.drawer);
    return `${drawer ? drawer.letter : '?'}-${list.indexOf(c) + 1}`;
  }

  docFor(kind, id, params = {}) {
    if (kind === 'article') {
      const art = this.article(id);
      return art ? { file: art.file, text: this.articleText(art) } : null;
    }
    if (kind === 'card') {
      const c = this.card(id);
      return c ? { file: this.cardFile(c), text: this.cardText(c) } : null;
    }
    if (kind === 'calc') return { file: 'BYUDZHET_DEKABR_1999.TXT', text: this.calcText(this.calcInput(params)) };
    if (kind === 'proof') return { file: 'PRAVKA_1999.TXT', text: this.proofReport(this.proofCheck(this.proofText)) };
    return null;
  }

  openDoc(kind, id, params) {
    const doc = this.docFor(kind, id, params);
    if (!doc) return null;
    if (typeof window !== 'undefined' && window.appNotepad && typeof window.appNotepad.open === 'function') window.appNotepad.open(doc.file, doc.text);
    return doc.file;
  }

  saveDoc(kind, id, params) {
    const doc = this.docFor(kind, id, params);
    if (!doc) return null;
    if (typeof window !== 'undefined' && window.vfs && typeof window.vfs.writeFile === 'function') {
      window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], doc.file, doc.text);
    }
    return doc.file;
  }

  renderSite(url = '') {
    const route = this.parseRoute(url);
    if (route.page === 'print') {
      const art = this.article(route.params.id);
      return art ? this.renderPrint(art) : this.render404(route.path);
    }
    const pages = {
      home: () => this.renderHome(),
      lenta: () => this.renderLenta(route.params),
      article: () => this.renderArticle(route.params.id),
      dossiers: () => this.renderDossiers(route.params),
      economy: () => this.renderEconomy(route.params),
      editorial: () => this.renderEditorial(),
      y2k: () => this.renderY2k(),
      telegraph: () => this.renderTelegraph(route.params),
      about: () => this.renderAbout()
    };
    const body = pages[route.page] ? pages[route.page]() : null;
    if (body === null) return this.render404(route.path);
    const cls = ['svd-site', this.textOnly ? 'is-textonly' : ''].filter(Boolean).join(' ');
    const html = `
      <div class="${cls}" data-svd-path="${this.esc(route.path)}" data-svd-query="${this.esc(String(url).split('?')[1] || '')}">
        <table class="svd-shell" cellspacing="0" cellpadding="0">
          <tr><td>${this.renderMasthead()}</td></tr>
          <tr><td>${this.renderNav(route.page)}</td></tr>
          <tr><td class="svd-body">${this.renderNotice(route.path)}${body}</td></tr>
          <tr><td>${this.renderFooter()}</td></tr>
        </table>
      </div>`;
    return this.encodingBar() + this.encodeHtml(html);
  }

  encodingBar() {
    if (this.encoding !== 'koi8') return '';
    return `<div class="svd-encbar">Page is in KOI8-R. Click <a data-svd-enc="win1251">WIN</a> to read it in Windows-1251.</div>`;
  }

  render404(path) {
    return `
      <div class="svd-raw">
        <h1>Not Found</h1>
        <p>The requested URL ${this.esc(path)} was not found on this server.</p>
        <hr>
        <address>Apache/1.3.9 Server at www.svodka99.ru Port 80</address>
      </div>`;
  }

  renderNotice(path) {
    if (!this.notice || this.notice.path !== path) return '';
    const text = this.notice.text;
    this.notice = null;
    return `<div class="svd-notice">${this.gif('check')} ${this.esc(text)}</div>`;
  }

  renderMasthead() {
    return `
      <a data-url="${this.url()}" class="svd-mast-link">
        <svg class="svd-mast" width="760" height="104" viewBox="0 0 760 104" role="img" aria-label="Сводка.ру 99. Ежедневная интернет-газета">
          <rect width="760" height="104" fill="#ffffff"/>
          <line x1="0" y1="4" x2="760" y2="4" stroke="#999999" stroke-width="1"/>
          <line x1="0" y1="100" x2="760" y2="100" stroke="#999999" stroke-width="1"/>
          <line x1="136" y1="10" x2="136" y2="94" stroke="#cccccc" stroke-width="1"/>
          <g font-family="Arial, sans-serif" fill="#666666" font-size="9">
            <text x="10" y="26" font-family="'Times New Roman', serif" font-size="15" font-weight="bold" fill="#333333" letter-spacing="2">ТЕЛЕГРАММА</text>
            <text x="10" y="44">Категория</text><text x="70" y="44" fill="#000000">срочная</text>
            <text x="10" y="58">Выпуск №</text><text x="70" y="58" fill="#000000">${this.esc(this.data.issue)}</text>
            <text x="10" y="72">Слов</text><text x="70" y="72" fill="#000000">4</text>
            <text x="10" y="86">Принята</text><text x="70" y="86" fill="#000000">28/XII ${this.esc(this.data.updated)}</text>
            <line x1="68" y1="47" x2="128" y2="47" stroke="#cccccc"/>
            <line x1="68" y1="61" x2="128" y2="61" stroke="#cccccc"/>
            <line x1="68" y1="75" x2="128" y2="75" stroke="#cccccc"/>
            <line x1="68" y1="89" x2="128" y2="89" stroke="#cccccc"/>
            <text x="150" y="18">Куда, кому</text>
          </g>
          <g transform="rotate(-1 340 40)">
            <rect x="150" y="22" width="372" height="38" fill="#ffffcc" stroke="#cccc99" stroke-width="1"/>
            <text x="162" y="51" font-family="'Courier New', monospace" font-size="30" font-weight="bold" fill="#000000" textLength="348" lengthAdjust="spacingAndGlyphs">СВОДКА.РУ 99</text>
          </g>
          <g transform="rotate(0.6 400 76)">
            <rect x="150" y="66" width="468" height="20" fill="#ffffcc" stroke="#cccc99" stroke-width="1"/>
            <text x="158" y="80" font-family="'Courier New', monospace" font-size="12" fill="#000000">ЕЖЕДНЕВНАЯ ИНТЕРНЕТ-ГАЗЕТА ТЧК ЛЕНТА КАЖДЫЕ ПОЛЧАСА</text>
          </g>
          <g transform="rotate(-14 690 52)" fill="none" stroke="#663399">
            <circle cx="690" cy="52" r="38" stroke-width="2"/>
            <circle cx="690" cy="52" r="27" stroke-width="1"/>
            <line x1="663" y1="52" x2="717" y2="52" stroke-width="1"/>
            <g fill="#663399" stroke="none" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
              <text x="690" y="23" font-size="7">МОСКВА ММТС-9</text>
              <text x="690" y="47" font-size="11">28 12 99</text>
              <text x="690" y="65" font-size="11">18</text>
              <text x="690" y="87" font-size="7">СВОДКА</text>
            </g>
          </g>
        </svg>
      </a>`;
  }

  renderNav(page) {
    const items = [
      ['home', '/', 'Первая полоса'],
      ['lenta', '/lenta', 'Лента'],
      ['dossiers', '/dossiers', 'Справочная'],
      ['economy', '/economy', 'Деньги'],
      ['y2k', '/y2k', 'Проблема-2000'],
      ['editorial', '/editorial', 'Правка'],
      ['telegraph', '/telegraph', 'Телеграммы'],
      ['about', '/about', 'Редакция']
    ];
    const active = page === 'article' ? 'home' : page;
    const enc = [['win1251', 'WIN'], ['koi8', 'KOI'], ['translit', 'LAT']].map(([k, l]) => this.encoding === k ? `<b>${l}</b>` : `<a data-svd-enc="${k}">${l}</a>`).join(' | ');
    return `
      <table class="svd-nav" width="760" cellspacing="0" cellpadding="0">
        <tr>
          <td class="svd-nav-links">${items.map(([k, p, l]) => k === active ? `<b class="svd-nav-on">${l}</b>` : `<a data-url="${this.url(p)}">${l}</a>`).join(' <span class="svd-nav-sep">|</span> ')}</td>
          <td class="svd-nav-enc" align="right">${enc}</td>
        </tr>
      </table>
      <table class="svd-dateline" width="760" cellspacing="0" cellpadding="0">
        <tr>
          <td>Вторник, 28 декабря 1999 года. Обновлено в ${this.esc(this.data.updated)} по Москве.</td>
          <td align="right">До 2000 года: <b>${this.esc(this.data.countdown)}</b> &nbsp; Доллар ЦБ: <b>26,95</b></td>
        </tr>
      </table>`;
  }

  renderFooter() {
    const ring = (typeof window !== 'undefined' && window.retroSites && typeof window.retroSites.renderWebRing === 'function')
      ? window.retroSites.renderWebRing(this.baseUrl)
      : '';
    const digits = String(this.hitCount).padStart(7, '0').split('').map(d => `<span>${d}</span>`).join('');
    return `
      <div class="svd-footer">
        <p class="svd-foot-links">
          <a data-url="${this.url('/')}">Первая полоса</a> |
          <a data-url="${this.url('/lenta')}">Лента</a> |
          <a data-url="${this.url('/dossiers')}">Справочная</a> |
          <a data-url="${this.url('/economy')}">Деньги</a> |
          <a data-url="${this.url('/y2k')}">Проблема-2000</a> |
          <a data-url="${this.url('/editorial')}">Правка</a> |
          <a data-url="${this.url('/telegraph')}">Телеграммы</a> |
          <a data-url="${this.url('/about')}">Редакция</a>
        </p>
        <table cellspacing="0" cellpadding="0" width="100%">
          <tr>
            <td valign="top">
              &copy; 1999 «Сводка.ру '99». Выходит ежедневно с ${this.esc(this.data.since)}.<br>
              Письма редактору: <a href="mailto:editor@svodka99.ru">editor@svodka99.ru</a>.
              При перепечатке ссылка на www.svodka99.ru обязательна.<br>
              Страницы свёрстаны под 800&times;600. <a data-svd-textonly="1">${this.textOnly ? 'Показать картинки' : 'Версия без картинок'}</a> |
              <a data-svd-clippy="1">Спросить Скрепыша</a>
            </td>
            <td valign="top" align="right" class="svd-counters">
              <a data-url="http://www.rambler98.ru" class="svd-btn88 svd-btn88-top">Rambler's<br>Top100</a>
              <a data-url="http://www.pereplet99.ru" class="svd-btn88 svd-btn88-pp">Переплёт<br>'99</a>
              <div class="svd-odo" title="Посетителей с 1 марта 1999">${digits}</div>
            </td>
          </tr>
        </table>
        ${ring}
      </div>`;
  }

  rubricLabel(id) {
    const r = this.rubric(id);
    return r ? `${this.gif(r.gif)} <span class="svd-rub">${this.esc(r.label)}</span>` : '';
  }

  renderHome() {
    const d = this.data;
    const lead = d.articles[0];
    const rest = d.articles.slice(1);
    const user = this.loadUser();
    const counts = this.pollCounts(user);
    const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
    const usd = d.cbr.rows.find(r => r.code === 'USD');
    const eur = d.cbr.rows.find(r => r.code === 'EUR');
    const dem = d.cbr.rows.find(r => r.code === 'DEM');
    return `
      <table class="svd-front" cellspacing="0" cellpadding="0">
        <tr>
          <td class="svd-col-tape" valign="top">
            <div class="svd-tape">
              <div class="svd-tape-head">ЛЕНТА 28.12.99</div>
              ${d.wire.slice(0, 7).map(w => `
                <div class="svd-tape-item">
                  <span class="svd-tape-time">${w.time}</span>${w.urgent ? ' <span class="svd-molnia">МОЛНИЯ</span>' : ''}<br>
                  <a data-url="${this.url('/lenta?id=' + w.id)}">${this.esc(w.title.toUpperCase())}</a>
                </div>`).join('')}
              <div class="svd-tape-more"><a data-url="${this.url('/lenta')}">ВСЯ ЛЕНТА (${d.wire.length}) &raquo;</a></div>
            </div>
          </td>
          <td class="svd-col-main" valign="top">
            <div class="svd-lead-rub">${this.rubricLabel(lead.cat)} <span class="svd-meta">${this.esc(lead.date)}</span></div>
            <h1 class="svd-h1"><a data-url="${this.url('/article?id=' + lead.id)}">${this.esc(lead.headline)}</a></h1>
            <p class="svd-byline">${this.esc(lead.author)}, ${this.esc(lead.desk)}</p>
            <p class="svd-lead">${this.esc(lead.lead)}</p>
            <p>${this.esc(lead.body[0])}</p>
            <p><a data-url="${this.url('/article?id=' + lead.id)}"><b>Читать полностью</b></a> &nbsp;|&nbsp; <a data-url="${this.url('/y2k')}">Полночь по часовым поясам</a> &nbsp;|&nbsp; откликов: ${this.getComments(lead.id).length}</p>
            <h2 class="svd-h2">Также в номере</h2>
            ${rest.map(a => `
              <div class="svd-also">
                <div class="svd-also-rub">${this.rubricLabel(a.cat)} <span class="svd-meta">${this.esc(a.date)}</span></div>
                <a data-url="${this.url('/article?id=' + a.id)}" class="svd-also-title">${this.esc(a.headline)}</a>
                <div class="svd-also-lead">${this.esc(a.lead)}</div>
              </div>`).join('')}
            <div class="svd-banner">
              <a data-url="http://www.pereplet99.ru">
                <svg class="svd-pic" width="468" height="60" viewBox="0 0 468 60" role="img" aria-label="Переплёт 99: книга века, голосование">
                  <rect width="468" height="60" fill="#003366"/>
                  <rect x="8" y="8" width="34" height="44" fill="#990000" stroke="#ffcc00" stroke-width="2"/>
                  <line x1="14" y1="8" x2="14" y2="52" stroke="#ffcc00" stroke-width="1"/>
                  <text x="56" y="28" font-family="'Times New Roman', serif" font-size="20" font-weight="bold" fill="#ffffff">Переплёт '99</text>
                  <text x="56" y="46" font-family="Arial, sans-serif" font-size="11" fill="#ffcc00">Голосуйте за книгу века. Итоги 31 декабря.</text>
                  <rect x="372" y="18" width="84" height="24" fill="#ffcc00"/>
                  <text x="414" y="34" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#000000" text-anchor="middle">ГОЛОСОВАТЬ</text>
                </svg>
              </a>
              <div class="svd-meta">реклама</div>
            </div>
          </td>
          <td class="svd-col-side" valign="top">
            <div class="svd-box">
              <div class="svd-box-head">Курсы ЦБ на 28.12</div>
              <table class="svd-mini" cellspacing="0" cellpadding="2" width="100%">
                <tr><td>USD</td><td align="right"><b>${usd.today.slice(0, 5)}</b></td></tr>
                <tr><td>EUR</td><td align="right"><b>${eur.today.slice(0, 5)}</b></td></tr>
                <tr><td>DEM</td><td align="right"><b>${dem.today.slice(0, 5)}</b></td></tr>
              </table>
              <div class="svd-meta">На 29.12 доллар: 27,00</div>
              <a data-url="${this.url('/economy')}">Все курсы и калькулятор</a>
            </div>
            <div class="svd-box">
              <div class="svd-box-head">Опрос</div>
              <div class="svd-poll-q">${this.esc(d.poll.question)}</div>
              ${d.poll.options.map(([k, label]) => {
                const pct = Math.round(counts[k] / total * 100);
                return `
                  <label class="svd-poll-row"><input type="radio" name="svd-poll" value="${k}"${user.poll === k ? ' checked' : ''}> ${this.esc(label)}</label>
                  <div class="svd-poll-bar"><span class="svd-poll-fill" style="width:${Math.max(1, Math.round(pct * 0.9))}px"></span> ${pct}%</div>`;
              }).join('')}
              <button type="button" class="svd-button" data-svd-poll="1">Ответить</button>
              <div class="svd-meta">Ответов: ${total}</div>
            </div>
            <div class="svd-box">
              <div class="svd-box-head">Справочная</div>
              ${['mmts9', 'micex', 'art-mtu-card'].map(id => this.card(id)).map(c => `<div class="svd-side-link">&raquo; <a data-url="${this.url('/dossiers?id=' + c.id)}">${this.esc(c.name)}</a></div>`).join('')}
              <div class="svd-side-link">&raquo; <a data-url="${this.url('/dossiers')}">Все ${d.cards.length} карточек</a></div>
            </div>
            <div class="svd-box">
              <div class="svd-box-head">Пишите нам</div>
              <a data-url="${this.url('/telegraph')}">Телеграмма в редакцию</a><br>
              <a data-url="${this.url('/editorial')}">Проверить свою заметку</a>
            </div>
          </td>
        </tr>
      </table>`;
  }

  filterWire(params = {}) {
    const q = String(params.q || '').trim().toLowerCase();
    return this.data.wire.filter(w => {
      if (params.cat && params.cat !== 'all' && w.cat !== params.cat) return false;
      if (params.urgent === '1' && !w.urgent) return false;
      if (q && !(`${w.title} ${w.text} ${w.desk}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }

  lentaUrl(params) {
    const parts = [];
    if (params.cat && params.cat !== 'all') parts.push('cat=' + encodeURIComponent(params.cat));
    if (params.urgent === '1') parts.push('urgent=1');
    if (params.q) parts.push('q=' + encodeURIComponent(params.q));
    return this.url('/lenta' + (parts.length ? '?' + parts.join('&') : ''));
  }

  renderLenta(params = {}) {
    const cat = this.rubric(params.cat) ? params.cat : 'all';
    const p = { cat, urgent: params.urgent === '1' ? '1' : '', q: String(params.q || '').slice(0, 60) };
    const list = this.filterWire(p);
    const rubLinks = [['all', 'ВСЕ']].concat(this.data.rubrics.map(r => [r.id, r.short.toUpperCase()]));
    return `
      <div class="svd-roll">
        <div class="svd-roll-paper">
          <pre class="svd-roll-head">СВОДКА.РУ  ЛЕНТА  28.12.1999  ВТ  МОСКВА
================================================</pre>
          <div class="svd-roll-filter">
            РУБРИКА: ${rubLinks.map(([k, l]) => k === cat ? `<b>[${l}]</b>` : `<a data-url="${this.lentaUrl(Object.assign({}, p, { cat: k }))}">${l}</a>`).join(' ')}
            <br>
            ${p.urgent ? `<b>[ТОЛЬКО МОЛНИИ]</b> <a data-url="${this.lentaUrl(Object.assign({}, p, { urgent: '' }))}">ВСЕ ДЕПЕШИ</a>` : `<a data-url="${this.lentaUrl(Object.assign({}, p, { urgent: '1' }))}">ТОЛЬКО МОЛНИИ</a>`}
            &nbsp; ПОИСК: <input type="text" class="svd-input svd-mono" id="svd-lenta-q" size="18" value="${this.esc(p.q)}" data-svd-cat="${cat}" data-svd-urgent="${p.urgent}">
            <button type="button" class="svd-button" data-svd-lenta-go="1">Найти</button>
            <br>НАЙДЕНО ДЕПЕШ: ${list.length} ИЗ ${this.data.wire.length}
          </div>
          ${list.length ? list.map(w => {
            const r = this.rubric(w.cat);
            const art = this.article(w.article);
            const c = this.card(w.card);
            return `
              <div class="svd-dispatch${params.id === w.id ? ' is-current' : ''}" id="svd-${w.id}"${params.id === w.id ? ' data-svd-current="1"' : ''}>
                <div class="svd-disp-top">${w.time} &nbsp;${w.urgent ? '<span class="svd-molnia">МОЛНИЯ</span> &nbsp;' : ''}${this.esc((r ? r.label : '').toUpperCase())} &nbsp;/${this.esc(w.desk.toUpperCase())}/</div>
                <div class="svd-disp-title">${this.esc(w.title.toUpperCase())}</div>
                <div class="svd-disp-text">МОСКВА, 28 ДЕКАБРЯ. ${this.esc(w.text)}</div>
                <div class="svd-disp-links">${art ? `&gt;&gt; <a data-url="${this.url('/article?id=' + art.id)}">Репортаж: ${this.esc(art.headline)}</a>` : ''}${c ? `<br>&gt;&gt; <a data-url="${this.url('/dossiers?id=' + c.id)}">Карточка ${this.cardNumber(c)}: ${this.esc(c.name)}</a>` : ''}</div>
              </div>`;
          }).join('') : `<div class="svd-dispatch">ДЕПЕШ НЕ НАЙДЕНО ТЧК <a data-url="${this.url('/lenta')}">СБРОСИТЬ ФИЛЬТР</a></div>`}
          <pre class="svd-roll-head">================================================
КОНЕЦ ЛЕНТЫ НА 18:45 МСК  СЛЕДУЮЩИЙ ВЫПУСК 19:15</pre>
        </div>
      </div>`;
  }

  renderArticle(id) {
    const art = this.article(id);
    if (!art) return null;
    const comments = this.getComments(art.id);
    const cards = art.cards.map(c => this.card(c)).filter(Boolean);
    const wires = this.data.wire.filter(w => w.article === art.id);
    const others = this.data.articles.filter(a => a.id !== art.id);
    return `
      <div class="svd-crumbs"><a data-url="${this.url()}">Первая полоса</a> &gt; ${this.rubricLabel(art.cat)}</div>
      <table class="svd-article" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td valign="top" class="svd-art-main">
            <h1 class="svd-h1">${this.esc(art.headline)}</h1>
            <p class="svd-byline">${this.esc(art.author)}, ${this.esc(art.desk)}. ${this.esc(art.date)}</p>
            <p class="svd-tools">
              <a data-url="${this.url('/print?id=' + art.id)}">${this.gif('printer')} Версия для печати</a> |
              <a data-svd-notepad="article" data-svd-id="${art.id}">В Блокнот</a> |
              <a data-svd-save="article" data-svd-id="${art.id}">Сохранить в «Мои документы»</a> |
              Шрифт: ${[11, 13, 16].map(n => n === this.fontSize ? `<b>${n}</b>` : `<a data-svd-font="${n}">${n}</a>`).join(' ')}
            </p>
            <div class="svd-prose" style="font-size:${this.fontSize}px">
              <p class="svd-lead">${this.esc(art.lead)}</p>
              ${art.body.map(p => `<p>${this.esc(p)}</p>`).join('')}
              <blockquote class="svd-quote">${this.esc(art.quote)}</blockquote>
            </div>
            <h2 class="svd-h2">Отклики (${comments.length})</h2>
            ${comments.map((c, i) => `
              <div class="svd-comment">
                <b>${i + 1}. ${this.esc(c.author)}</b> <span class="svd-meta">${this.esc(c.date)}</span><br>
                ${this.esc(c.text)}
              </div>`).join('')}
            <table class="svd-form" cellspacing="0" cellpadding="3">
              <tr><td>Подпись:</td><td><input type="text" class="svd-input" id="svd-c-name" size="30" maxlength="40"></td></tr>
              <tr><td valign="top">Отклик:</td><td><textarea class="svd-input" id="svd-c-text" rows="4" cols="50" maxlength="1000"></textarea></td></tr>
              <tr><td></td><td><button type="button" class="svd-button" data-svd-comment="${art.id}">Отправить отклик</button></td></tr>
            </table>
          </td>
          <td valign="top" class="svd-art-side">
            <div class="svd-facts">
              <div class="svd-box-head">Справка</div>
              ${art.facts.map(([k, v]) => `<p><b>${this.esc(k)}.</b> ${this.esc(v)}</p>`).join('')}
            </div>
            ${wires.length ? `
              <div class="svd-box">
                <div class="svd-box-head">По теме в ленте</div>
                ${wires.map(w => `<div class="svd-side-link"><span class="svd-mono">${w.time}</span> <a data-url="${this.url('/lenta?id=' + w.id)}">${this.esc(w.title)}</a></div>`).join('')}
              </div>` : ''}
            <div class="svd-box">
              <div class="svd-box-head">Справочная</div>
              ${cards.map(c => `<div class="svd-side-link">${this.cardNumber(c)} <a data-url="${this.url('/dossiers?id=' + c.id)}">${this.esc(c.name)}</a></div>`).join('')}
            </div>
            <div class="svd-box">
              <div class="svd-box-head">Ещё в номере</div>
              ${others.map(o => `<div class="svd-side-link">&raquo; <a data-url="${this.url('/article?id=' + o.id)}">${this.esc(o.headline)}</a></div>`).join('')}
            </div>
          </td>
        </tr>
      </table>`;
  }

  renderPrint(art) {
    const r = this.rubric(art.cat);
    return this.encodeHtml(`
      <div class="svd-print">
        <p>Сводка.ру '99. Ежедневная интернет-газета. ${this.esc(r ? r.label : '')}, ${this.esc(art.date)}</p>
        <hr>
        <h1>${this.esc(art.headline)}</h1>
        <p><i>${this.esc(art.author)}, ${this.esc(art.desk)}</i></p>
        <p><b>${this.esc(art.lead)}</b></p>
        ${art.body.map(p => `<p>${this.esc(p)}</p>`).join('')}
        <p>${this.esc(art.quote)}</p>
        <p><b>Справка.</b><br>${art.facts.map(([k, v]) => `${this.esc(k)}: ${this.esc(v)}`).join('<br>')}</p>
        <hr>
        <p>Адрес статьи: ${this.esc(this.url('/article?id=' + art.id))}<br>
        <a data-url="${this.url('/article?id=' + art.id)}">Вернуться к статье</a></p>
      </div>`);
  }

  renderDossiers(params = {}) {
    const d = this.data;
    let current = this.card(params.id);
    const drawerId = current ? current.drawer : (d.drawers.some(x => x.id === params.box) ? params.box : 'locations');
    const list = d.cards.filter(c => c.drawer === drawerId);
    if (!current) current = list[0];
    const arts = current.refs.map(id => this.article(id)).filter(Boolean);
    const linked = current.refs.map(id => this.card(id)).filter(Boolean);
    return `
      <h1 class="svd-h1">Справочная</h1>
      <p class="svd-intro">Картотека редакции: ${d.cards.length} карточек о местах, механизмах, людях и вещах, без которых не понять новости декабря 1999 года. Выдвиньте ящик и выберите карточку.</p>
      <table class="svd-cabinet" cellspacing="4" cellpadding="0">
        <tr>
          ${d.drawers.map(x => `
            <td class="svd-drawer${x.id === drawerId ? ' is-open' : ''}">
              <a data-url="${this.url('/dossiers?box=' + x.id)}">
                <span class="svd-drawer-plate"><b>${x.letter}</b> ${this.esc(x.label)}</span>
                <span class="svd-drawer-hint">${this.esc(x.hint)}, ${d.cards.filter(c => c.drawer === x.id).length} карт.</span>
                <span class="svd-drawer-knob"></span>
              </a>
            </td>`).join('')}
        </tr>
      </table>
      <table class="svd-cards-wrap" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td valign="top" class="svd-card-index">
            ${list.map(c => c.id === current.id
              ? `<div class="svd-tab is-on"><b>${this.cardNumber(c)}</b> ${this.esc(c.name)}</div>`
              : `<div class="svd-tab"><a data-url="${this.url('/dossiers?id=' + c.id)}"><b>${this.cardNumber(c)}</b> ${this.esc(c.name)}</a></div>`).join('')}
          </td>
          <td valign="top">
            <div class="svd-card">
              <div class="svd-card-no">${this.cardNumber(current)}</div>
              <div class="svd-card-name">${this.esc(current.name)}</div>
              <div class="svd-card-kind">${this.esc(current.kind)}</div>
              <p><u>Как выглядит.</u> ${this.esc(current.look)}</p>
              <p><u>Что было в 1999 году.</u> ${this.esc(current.year)}</p>
              <p><u>Порядки.</u> ${this.esc(current.rules)}</p>
              <p><u>На 28 декабря.</u> ${this.esc(current.now)}</p>
              <div class="svd-card-hole"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="#cccccc" stroke="#999999"/></svg></div>
            </div>
            <p class="svd-tools">
              <a data-svd-notepad="card" data-svd-id="${current.id}">Открыть в Блокноте</a> |
              <a data-svd-save="card" data-svd-id="${current.id}">Сохранить ${this.cardFile(current)} в «Мои документы»</a>
            </p>
            ${arts.length ? `<p><b>В номере:</b><br>${arts.map(a => `&raquo; <a data-url="${this.url('/article?id=' + a.id)}">${this.esc(a.headline)}</a>`).join('<br>')}</p>` : ''}
            ${linked.length ? `<p><b>См. также:</b> ${linked.map(c => `<a data-url="${this.url('/dossiers?id=' + c.id)}">${this.cardNumber(c)} ${this.esc(c.name)}</a>`).join('; ')}</p>` : ''}
            ${current.links.length ? `<p><b>В Сети:</b> ${current.links.map(([u, l]) => `<a data-url="${u}">${this.esc(l)}</a>`).join(', ')}</p>` : ''}
          </td>
        </tr>
      </table>`;
  }

  renderEconomy(params = {}) {
    const d = this.data;
    const input = this.calcInput(params);
    const r = this.calculate(input);
    const q = `sum=${input.sum}&profile=${input.profile}&tariff=${input.tariff}`;
    return `
      <h1 class="svd-h1">Деньги</h1>
      <table cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td valign="top" class="svd-cbr-cell">
            <table class="svd-cbr" cellspacing="0" cellpadding="3">
              <tr><th colspan="4">Официальные курсы Банка России</th></tr>
              <tr class="svd-cbr-sub"><td>Код</td><td>Валюта</td><td align="right">на 28.12</td><td align="right">на 29.12</td></tr>
              ${d.cbr.rows.map(x => `
                <tr>
                  <td class="svd-mono">${x.code}</td>
                  <td>${x.units > 1 ? x.units + ' ' : ''}${this.esc(x.name)}</td>
                  <td align="right" class="svd-mono"><b>${x.today}</b></td>
                  <td align="right" class="svd-mono">${x.next}</td>
                </tr>`).join('')}
            </table>
            <p class="svd-meta">${this.esc(d.cbr.source)}. Рублей за единицу или за указанное число единиц.</p>
          </td>
          <td valign="top" class="svd-booth-cell">
            <table class="svd-booth" cellspacing="0" cellpadding="0">
              <tr><td colspan="3" class="svd-booth-title">ОБМЕН ВАЛЮТЫ</td></tr>
              <tr class="svd-booth-sub"><td></td><td>ПОКУПКА</td><td>ПРОДАЖА</td></tr>
              <tr><td class="svd-booth-cur">USD</td><td class="svd-led">${d.booth.usd[0]}</td><td class="svd-led">${d.booth.usd[1]}</td></tr>
              <tr><td class="svd-booth-cur">DEM</td><td class="svd-led">${d.booth.dem[0]}</td><td class="svd-led">${d.booth.dem[1]}</td></tr>
            </table>
            <p class="svd-meta">Табло: ${this.esc(d.booth.place)}.</p>
          </td>
        </tr>
      </table>

      <h2 class="svd-h2">Сколько это на сегодня</h2>
      <p>Впишите сумму в рублях и посмотрите, сколько она стоит в валюте, часах Интернета и в новогодних покупках по ценам 28 декабря.</p>
      <table class="svd-form svd-calc-form" cellspacing="0" cellpadding="3">
        <tr>
          <td>Сумма, руб.:</td><td><input type="text" class="svd-input" id="svd-calc-sum" size="8" value="${input.sum}"></td>
          <td>Расклад:</td><td><select class="svd-input" id="svd-calc-profile">${Object.entries(d.calc.profiles).map(([k, v]) => `<option value="${k}"${k === input.profile ? ' selected' : ''}>${this.esc(v.label)}</option>`).join('')}</select></td>
          <td>Интернет:</td><td><select class="svd-input" id="svd-calc-tariff"><option value="night"${input.tariff === 'night' ? ' selected' : ''}>ночной, $0,45/ч</option><option value="day"${input.tariff === 'day' ? ' selected' : ''}>дневной, $1,20/ч</option></select></td>
          <td><button type="button" class="svd-button" data-svd-calc="1">Посчитать</button></td>
        </tr>
      </table>
      <table class="svd-ledger" cellspacing="0" cellpadding="0">
        <tr><th colspan="2">Ведомость на ${this.money(r.sum, 0)} руб.</th></tr>
        <tr><td>Долларов по курсу ЦБ (26,95)</td><td class="svd-mono">${this.money(r.usd)}</td></tr>
        <tr><td>Немецких марок (13,98)</td><td class="svd-mono">${this.money(r.dem)}</td></tr>
        <tr><td>Часов Интернета по ${this.money(r.hourRub)} руб.</td><td class="svd-mono">${r.hours}</td></tr>
        ${r.goods.map(g => `<tr><td>${this.esc(g.name)} по ${g.price} руб.</td><td class="svd-mono">${g.count} ${this.esc(g.unit)}</td></tr>`).join('')}
        <tr><td colspan="2" class="svd-ledger-note">${this.esc(r.note)}</td></tr>
      </table>
      <p class="svd-tools">
        <a data-svd-notepad="calc" data-svd-q="${this.esc(q)}">Открыть ведомость в Блокноте</a> |
        <a data-svd-save="calc" data-svd-q="${this.esc(q)}">Сохранить BYUDZHET_DEKABR_1999.TXT</a>
      </p>

      <h2 class="svd-h2">Цены до и после кризиса, руб.</h2>
      <table class="svd-grid" cellspacing="0" cellpadding="3">
        <tr><th align="left">Что</th>${d.priceCols.map(c => `<th align="right">${c}</th>`).join('')}</tr>
        ${d.prices.map(row => `<tr><td>${this.esc(row[0])}</td>${row.slice(1).map((v, i) => `<td align="right" class="svd-mono">${i === 2 ? `<b>${v}</b>` : v}</td>`).join('')}</tr>`).join('')}
      </table>
      <p class="svd-meta">Курс доллара — официальный курс ЦБ на дату. Остальные цены записали наши корреспонденты в московских магазинах и на рынках.</p>`;
  }

  renderEditorial() {
    const d = this.data;
    const result = this.proofChecked ? this.proofCheck(this.proofText) : null;
    return `
      <h1 class="svd-h1">Правка</h1>
      <table cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td valign="top" class="svd-proof-main">
            <p>Пишете заметку о 1999 годе? Вставьте текст, и редакторский карандаш вычеркнет канцелярские штампы и подскажет, чем их заменить. Словарь собрал главный редактор по черновикам, которые приходят в редакцию.</p>
            <textarea class="svd-input svd-proof-input" id="svd-proof-text" rows="9" cols="60">${this.esc(this.proofText)}</textarea>
            <p>
              <button type="button" class="svd-button" data-svd-proof="check">Проверить</button>
              <button type="button" class="svd-button" data-svd-proof="slop">Пример: черновик</button>
              <button type="button" class="svd-button" data-svd-proof="clean">Пример: заметка в номер</button>
              <button type="button" class="svd-button" data-svd-proof="clear">Очистить</button>
            </p>
            ${result ? `
              <div class="svd-galley">
                <div class="svd-galley-head">Гранка с правкой</div>
                <div class="svd-galley-text">${result.words ? this.proofMarkup(result) : '<i>Текста нет.</i>'}</div>
                <div class="svd-galley-foot">Слов: <b>${result.words}</b>. Штампов: <b>${result.hits.length}</b>. Вода: <b>${result.water}%</b>.<br><span class="svd-verdict">${this.esc(result.verdict)}</span></div>
              </div>
              ${result.words ? `<p class="svd-tools"><a data-svd-notepad="proof">Открыть правку в Блокноте</a> | <a data-svd-save="proof">Сохранить PRAVKA_1999.TXT</a></p>` : ''}` : ''}
          </td>
          <td valign="top" class="svd-proof-side">
            <div class="svd-margin">
              <div class="svd-box-head">На полях</div>
              ${d.editorNotes.map(n => `<p>${this.esc(n)}</p>`).join('')}
              <p class="svd-sign">И. Корнев</p>
            </div>
            <div class="svd-box">
              <div class="svd-box-head">В словаре ${d.stamps.length} штампа</div>
              <div class="svd-meta">Например: «в преддверии», «нельзя не отметить», «целым рядом», «на сегодняшний день», «осуществлять».</div>
            </div>
          </td>
        </tr>
      </table>`;
  }

  renderY2k() {
    const d = this.data;
    const checks = this.getChecks();
    const done = Object.values(checks).filter(Boolean).length;
    const total = d.checklist.length;
    return `
      <h1 class="svd-h1">Проблема-2000</h1>
      <p class="svd-intro">Россия встретит 2000 год одиннадцать раз. Первой полночь наступит на Камчатке, последней в Калининграде, через десять часов. До первой полуночи осталось <b>2 дн. 20 ч. 15 мин.</b></p>
      <table class="svd-zones" cellspacing="0" cellpadding="0">
        <tr><th align="left">Где</th><th>Пояс</th><th>Полночь по Москве</th></tr>
        ${d.midnight.map(([city, msk, zone], i) => `
          <tr${zone === 'МСК' ? ' class="is-msk"' : ''}>
            <td>${this.esc(city)}</td>
            <td align="center" class="svd-mono">${zone}</td>
            <td class="svd-mono"><span class="svd-zone-bar" style="margin-left:${i * 22}px">${msk}</span> ${i === d.midnight.length - 1 ? '1 января' : (msk === '00:00' ? '1 января' : '31 декабря')}</td>
          </tr>`).join('')}
      </table>
      <table cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td valign="top" class="svd-memo-cell">
            <div class="svd-memo">
              <div class="svd-memo-head">Памятка читателю: дом и компьютер к ночи на 1 января</div>
              ${d.checklist.map(c => `
                <label class="svd-check"><input type="checkbox" data-svd-check="${c.id}"${checks[c.id] ? ' checked' : ''}> ${this.esc(c.text)}</label>`).join('')}
              <div class="svd-memo-foot">Выполнено ${done} из ${total}. ${done === total ? 'Можно спокойно ждать курантов.' : 'До полуночи в Москве ещё три дня, успеете.'}</div>
            </div>
          </td>
          <td valign="top" class="svd-side-cell">
            <div class="svd-box">
              <div class="svd-box-head">Как проверить BIOS</div>
              <p>Перезагрузите компьютер, нажмите Del, откройте Standard CMOS Setup и поставьте дату 31.12.1999 и время 23:58. Выключите питание на пять минут, включите и посмотрите год. Потом верните точное время.</p>
            </div>
            <div class="svd-box">
              <div class="svd-box-head">Читайте</div>
              <div class="svd-side-link">&raquo; <a data-url="${this.url('/article?id=y2k-russia-ready')}">Ночь двух нулей</a></div>
              <div class="svd-side-link">&raquo; <a data-url="${this.url('/dossiers?id=goskom-y2k')}">Карточка: ситуационный центр</a></div>
              <div class="svd-side-link">&raquo; <a data-url="http://www.y2k-countdown.org">Y2K Survival Center</a></div>
            </div>
          </td>
        </tr>
      </table>`;
  }

  renderTelegramForm(t) {
    const strips = this.telegramStrips(t.text);
    return `
      <table class="svd-tg" cellspacing="0" cellpadding="0">
        <tr>
          <td class="svd-tg-label">ТЕЛЕГРАММА ${t.kind === 'urgent' ? '<b class="svd-molnia">СРОЧНАЯ</b>' : 'обыкновенная'}</td>
          <td class="svd-tg-label" align="right">${this.esc(this.telegramRubric(t.rubric))}. Слов ${this.telegramWords(t.text)}. Принята ${this.esc(t.date)}</td>
        </tr>
        <tr><td colspan="2" class="svd-tg-from">Из: ${this.esc(t.city)}. От: ${this.esc(t.name)}${t.contact ? '. Обратный адрес: ' + this.esc(t.contact) : ''}</td></tr>
        <tr><td colspan="2" class="svd-tg-body">${strips.map(s => `<div class="svd-strip">${this.esc(s)}</div>`).join('')}</td></tr>
        ${t.reply ? `<tr><td colspan="2" class="svd-tg-reply">Ответ редакции: ${this.esc(t.reply)}</td></tr>` : ''}
      </table>`;
  }

  renderTelegraph(params = {}) {
    const rub = this.telegramRubric(params.rubric) ? params.rubric : 'all';
    const all = this.getTelegrams();
    const list = rub === 'all' ? all : all.filter(t => t.rubric === rub);
    const filters = [['all', 'все']].concat(this.data.telegramRubrics);
    return `
      <h1 class="svd-h1">Телеграммы читателей</h1>
      <p class="svd-intro">Как ваш город провожает 1999 год? Пишите коротко, как на почте: телеграф сам расставит ТЧК и ЗПТ. Слова у нас бесплатные.</p>
      <table class="svd-blank" cellspacing="0" cellpadding="4">
        <tr><td class="svd-blank-l">Куда, кому</td><td colspan="3" class="svd-blank-fixed">МОСКВА СВОДКА.РУ ДЕЖУРНОМУ ПО ВЫПУСКУ</td></tr>
        <tr>
          <td class="svd-blank-l">От кого</td><td><input type="text" class="svd-input" id="svd-tg-name" size="22" maxlength="40"></td>
          <td class="svd-blank-l">Откуда</td><td><input type="text" class="svd-input" id="svd-tg-city" size="18" maxlength="40"></td>
        </tr>
        <tr>
          <td class="svd-blank-l">Обратный адрес</td><td><input type="text" class="svd-input" id="svd-tg-contact" size="22" maxlength="50"></td>
          <td class="svd-blank-l">Рубрика</td><td><select class="svd-input" id="svd-tg-rubric">${this.data.telegramRubrics.map(([k, l]) => `<option value="${k}">${this.esc(l)}</option>`).join('')}</select></td>
        </tr>
        <tr>
          <td class="svd-blank-l">Категория</td>
          <td colspan="3"><label><input type="radio" name="svd-tg-kind" value="plain" checked> обыкновенная</label> <label><input type="radio" name="svd-tg-kind" value="urgent"> срочная</label></td>
        </tr>
        <tr><td class="svd-blank-l" valign="top">Текст</td><td colspan="3"><textarea class="svd-input" id="svd-tg-text" rows="4" cols="56" maxlength="600"></textarea><br><span class="svd-meta">Слов: <b id="svd-tg-count">0</b></span></td></tr>
        <tr><td></td><td colspan="3"><button type="button" class="svd-button" data-svd-tg="1">Подать телеграмму</button></td></tr>
      </table>
      <p class="svd-filter">Показать: ${filters.map(([k, l]) => k === rub ? `<b>${this.esc(l)}</b>` : `<a data-url="${this.url('/telegraph' + (k === 'all' ? '' : '?rubric=' + k))}">${this.esc(l)}</a>`).join(' | ')} &nbsp; (${list.length})</p>
      ${list.map(t => this.renderTelegramForm(t)).join('')}`;
  }

  renderAbout() {
    const d = this.data;
    return `
      <h1 class="svd-h1">Редакция</h1>
      <table cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td valign="top" class="svd-about-main">
            <p>«Сводка.ру '99» — ежедневная интернет-газета. Мы выходим с ${this.esc(d.since)}, сегодня выпуск № ${d.issue}. Лента обновляется каждые полчаса с восьми утра до двух ночи, большие материалы выходят к вечеру. Страница первой полосы весит меньше 40 КБ и открывается на модеме 14 400 меньше чем за полминуты.</p>
            <h2 class="svd-h2">Кто делает газету</h2>
            <table class="svd-grid" cellspacing="0" cellpadding="3">
              ${d.staff.map(([n, role, mail]) => `<tr><td><b>${this.esc(n)}</b></td><td>${this.esc(role)}</td><td>${mail ? `<a href="mailto:${mail}">${mail}</a>` : ''}</td></tr>`).join('')}
            </table>
            <h2 class="svd-h2">Как мы росли</h2>
            <table class="svd-grid" cellspacing="0" cellpadding="3">
              ${d.history.map(([when, what]) => `<tr><td class="svd-mono" valign="top">${this.esc(when)}</td><td>${this.esc(what)}</td></tr>`).join('')}
            </table>
            <h2 class="svd-h2">Наши правила</h2>
            <p>Каждая цифра в ленте должна иметь источник: курс ЦБ, протокол ЦИК, ценник в магазине. Время пишем по Москве. Слухи в ленту не ставим, даже если конкуренты уже поставили.</p>
          </td>
          <td valign="top" class="svd-side-cell">
            <div class="svd-box">
              <div class="svd-box-head">Связь</div>
              <p>Главный редактор: <a href="mailto:editor@svodka99.ru">editor@svodka99.ru</a></p>
              <p>Телеграммы читателей: <a data-url="${this.url('/telegraph')}">форма на сайте</a></p>
              <p>Москва, Малый Козихинский пер.</p>
            </div>
            <div class="svd-box">
              <div class="svd-box-head">Реклама</div>
              ${d.adRates.map(([w, p]) => `<p>${this.esc(w)}: <b>${this.esc(p)}</b></p>`).join('')}
            </div>
          </td>
        </tr>
      </table>`;
  }

  attachEvents(win, container, ie) {
    const root = (typeof container.querySelector === 'function' && container.querySelector('.svd-site')) || container;
    const path = (root.dataset && root.dataset.svdPath) || '/';
    const sound = kind => {
      if (typeof window !== 'undefined' && window.soundSys && typeof window.soundSys[kind] === 'function') window.soundSys[kind]();
    };
    const q = sel => (typeof root.querySelector === 'function' ? root.querySelector(sel) : null);
    const value = sel => {
      const el = q(sel);
      return el ? el.value : '';
    };
    const rerender = () => {
      const top = container.scrollTop || 0;
      ie.renderPage(win, ie.currentUrl);
      container.scrollTop = top;
    };
    const go = url => {
      if (typeof ie.navigate === 'function') ie.navigate(win, url);
    };
    const say = text => {
      this.notice = { path, text };
    };
    const parseQ = str => this.parseRoute('/?' + (str || '')).params;

    if (typeof container.querySelector === 'function') {
      const encLink = container.querySelector('.svd-encbar [data-svd-enc]');
      if (encLink && typeof encLink.addEventListener === 'function') {
        encLink.addEventListener('click', () => {
          this.encoding = 'win1251';
          rerender();
        });
      }
    }

    const current = q('[data-svd-current]');
    if (current && typeof current.getBoundingClientRect === 'function' && typeof container.getBoundingClientRect === 'function') {
      const scrollToCurrent = () => {
        if (!current.isConnected) return;
        container.scrollTop = Math.max(0, current.getBoundingClientRect().top - container.getBoundingClientRect().top + (container.scrollTop || 0) - 8);
      };
      scrollToCurrent();
      setTimeout(scrollToCurrent, 0);
    }

    if (typeof root.addEventListener !== 'function') return;

    const tgText = q('#svd-tg-text');
    if (tgText && typeof tgText.addEventListener === 'function') {
      tgText.addEventListener('input', () => {
        const out = q('#svd-tg-count');
        if (out) out.textContent = String(this.telegramWords(tgText.value));
      });
    }

    const lentaInput = q('#svd-lenta-q');
    const lentaGo = () => {
      const cat = lentaInput.dataset.svdCat;
      go(this.lentaUrl({ cat, urgent: lentaInput.dataset.svdUrgent, q: String(lentaInput.value || '').trim().slice(0, 60) }));
    };
    if (lentaInput && typeof lentaInput.addEventListener === 'function') {
      lentaInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') lentaGo();
      });
    }

    root.addEventListener('change', e => {
      const t = e.target;
      if (!t || !t.dataset || !t.dataset.svdCheck) return;
      this.setCheck(t.dataset.svdCheck, !!t.checked);
      sound('playClick');
      rerender();
    });

    root.addEventListener('click', e => {
      const t = e.target && typeof e.target.closest === 'function'
        ? e.target.closest('[data-svd-enc],[data-svd-textonly],[data-svd-clippy],[data-svd-poll],[data-svd-lenta-go],[data-svd-font],[data-svd-notepad],[data-svd-save],[data-svd-comment],[data-svd-calc],[data-svd-proof],[data-svd-tg]')
        : null;
      if (!t) return;
      const d = t.dataset;
      if (d.svdEnc) {
        this.encoding = ['win1251', 'koi8', 'translit'].includes(d.svdEnc) ? d.svdEnc : 'win1251';
        sound('playClick');
        rerender();
      } else if (d.svdTextonly) {
        this.textOnly = !this.textOnly;
        sound('playClick');
        rerender();
      } else if (d.svdClippy) {
        if (typeof window !== 'undefined' && window.appClippy) {
          window.appClippy.show();
          window.appClippy._lastIePageKey = null;
          window.appClippy.onNavigateIE(ie.currentUrl || this.baseUrl, 'svodka', "Сводка.ру '99");
        }
      } else if (d.svdPoll) {
        const checked = q('input[name="svd-poll"]:checked');
        if (!checked) {
          say('Выберите вариант ответа.');
          rerender();
          return;
        }
        this.savePollVote(checked.value);
        say('Спасибо, ответ учтён.');
        sound('playDing');
        rerender();
      } else if (d.svdLentaGo) {
        if (lentaInput) lentaGo();
      } else if (d.svdFont) {
        this.fontSize = [11, 13, 16].includes(Number(d.svdFont)) ? Number(d.svdFont) : 13;
        sound('playClick');
        rerender();
      } else if (d.svdNotepad) {
        if (d.svdNotepad === 'proof') this.proofText = value('#svd-proof-text') || this.proofText;
        if (this.openDoc(d.svdNotepad, d.svdId, parseQ(d.svdQ))) sound('playDing');
      } else if (d.svdSave) {
        if (d.svdSave === 'proof') this.proofText = value('#svd-proof-text') || this.proofText;
        const file = this.saveDoc(d.svdSave, d.svdId, parseQ(d.svdQ));
        if (file) {
          say(`Файл ${file} сохранён в папку «Мои документы».`);
          sound('playDing');
          rerender();
        }
      } else if (d.svdComment) {
        if (!value('#svd-c-text').trim()) {
          say('Напишите текст отклика.');
          rerender();
          return;
        }
        this.addComment(d.svdComment, value('#svd-c-name'), value('#svd-c-text'));
        say('Отклик опубликован.');
        sound('playDing');
        rerender();
      } else if (d.svdCalc) {
        const sum = String(value('#svd-calc-sum')).replace(/[^\d]/g, '');
        go(this.url(`/economy?sum=${sum || 2695}&profile=${encodeURIComponent(value('#svd-calc-profile') || 'family')}&tariff=${encodeURIComponent(value('#svd-calc-tariff') || 'night')}`));
      } else if (d.svdProof) {
        if (d.svdProof === 'slop' || d.svdProof === 'clean') this.proofText = this.data.samples[d.svdProof];
        else if (d.svdProof === 'clear') this.proofText = '';
        else this.proofText = value('#svd-proof-text');
        this.proofChecked = d.svdProof !== 'clear';
        sound('playClick');
        rerender();
      } else if (d.svdTg) {
        if (!value('#svd-tg-text').trim()) {
          say('Телеграмма без текста не принимается.');
          rerender();
          return;
        }
        const kind = q('input[name="svd-tg-kind"]:checked');
        this.addTelegram({
          name: value('#svd-tg-name'),
          city: value('#svd-tg-city'),
          contact: value('#svd-tg-contact'),
          rubric: value('#svd-tg-rubric'),
          kind: kind ? kind.value : 'plain',
          text: value('#svd-tg-text')
        });
        say('Телеграмма принята.');
        sound('playDing');
        if (path === '/telegraph' && String(ie.currentUrl || '').includes('rubric=')) go(this.url('/telegraph'));
        else rerender();
      }
    });
  }
}

window.svodkaSite = new SvodkaSite();
