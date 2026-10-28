class WebCinemaSite {
  constructor() {
    this.baseUrl = 'http://www.webcinema98.com';
    this.mail = 'info@webcinema98.com';
    this.storageKeys = {
      modem: 'win98_webcinema_modem_v1',
      book: 'win98_webcinema_book_v2',
      poll: 'win98_webcinema_poll_v1',
      hits: 'win98_webcinema_hits_v1',
      downloads: 'win98_webcinema_downloads_v1',
      legacyBook: 'win98_webcinema_comments'
    };
    this.videoFolder = ['My Computer', 'C:', 'My Documents', 'Мои видео'];
    this.zoom = 2;
    this.calc = { mb: '10', modem: '' };
    this.statusMsg = '';
    this.statusPath = '';
    this.hitCounted = false;
    this.lastUrl = this.baseUrl;
    const d = (typeof window !== 'undefined' && window.webcinemaData) || {};
    this.data = d;
    this.navItems = [
      { id: 'home', label: 'Фойе', path: '' },
      { id: 'programme', label: 'Программа', path: '/programme' },
      { id: 'booth', label: 'Киномеханик', path: '/booth' },
      { id: 'book', label: 'Книга отзывов', path: '/book' }
    ];
  }

  esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  gif(name, scale = 1) {
    return typeof window !== 'undefined' && typeof window.webGif === 'function' ? window.webGif(name, scale) : '';
  }

  sound(method) {
    if (typeof window !== 'undefined' && window.soundSys && typeof window.soundSys[method] === 'function') {
      window.soundSys[method]();
    }
  }

  readJson(key, fallback) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed != null ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  }

  writeJson(key, value) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  url(path = '') {
    return `${this.baseUrl}${path}`;
  }

  link(path, html, cls = 'wc-link') {
    return `<a class="${cls}" data-url="${this.esc(this.url(path))}">${html}</a>`;
  }

  clips() {
    return (this.data.clips || []).slice();
  }

  clip(id) {
    return (this.data.clips || []).find(c => c.id === id) || null;
  }

  rubricName(id) {
    const r = (this.data.rubrics || []).find(x => x.id === id);
    return r ? r.name : '';
  }

  modems() {
    return this.data.modems || [];
  }

  modemId() {
    const saved = this.readJson(this.storageKeys.modem, '33k');
    return this.modems().some(m => m.id === saved) ? saved : '33k';
  }

  modem(id) {
    const list = this.modems();
    return list.find(m => m.id === (id || this.modemId())) || list[0] || { id: '33k', name: 'Модем 33 600', bps: 3500 };
  }

  setModem(id) {
    if (!this.modems().some(m => m.id === id)) return this.modemId();
    this.writeJson(this.storageKeys.modem, id);
    return id;
  }

  sizeMb(bytes) {
    return `${(bytes / 1048576).toFixed(1).replace('.', ',')} МБ`;
  }

  duration(seconds) {
    const s = Math.max(0, Math.round(seconds || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  timeText(seconds) {
    const s = Math.max(1, Math.round(seconds));
    if (s < 60) return `${s} с`;
    const minutes = Math.round(s / 60);
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
  }

  downloadSeconds(clip, modemId) {
    return clip.bytes / this.modem(modemId).bps;
  }

  downloadText(clip, modemId) {
    return this.timeText(this.downloadSeconds(clip, modemId));
  }

  timeFor(id) {
    const c = this.clip(id);
    if (!c) return '';
    return `«${c.title}» весит ${this.sizeMb(c.bytes)}. ${this.modem().name}: около ${this.downloadText(c)}.`;
  }

  frameSize(clip) {
    const [w, h] = String(clip.frame || '192x144').split('x').map(Number);
    return { w: w || 192, h: h || 144 };
  }

  stills(clip) {
    return [1, 2, 3].map(n => `content/webvideo/stills/${clip.id}-${n}.jpg`);
  }

  src(clip) {
    return `content/webvideo/${clip.file}`;
  }

  getHits() {
    return Number(this.readJson(this.storageKeys.hits, 0)) || 0;
  }

  countHit() {
    if (this.hitCounted) return;
    this.hitCounted = true;
    this.writeJson(this.storageKeys.hits, this.getHits() + 1);
  }

  ticketNo() {
    return String((this.data.ticketBase || 0) + this.getHits()).padStart(7, '0');
  }

  userDownloads() {
    const saved = this.readJson(this.storageKeys.downloads, {});
    return saved && typeof saved === 'object' ? saved : {};
  }

  downloadCount(id) {
    const c = this.clip(id);
    return (c ? c.downloads : 0) + (Number(this.userDownloads()[id]) || 0);
  }

  saveClip(id) {
    const c = this.clip(id);
    if (!c) return false;
    if (typeof window !== 'undefined' && window.vfs) {
      try {
        window.vfs.mkdir(['My Computer', 'C:', 'My Documents'], 'Мои видео');
      } catch (e) {}
      window.vfs.writeFile(this.videoFolder, c.file, this.src(c));
    }
    const counts = this.userDownloads();
    counts[id] = (Number(counts[id]) || 0) + 1;
    this.writeJson(this.storageKeys.downloads, counts);
    const listed = this.readJson('win98_downloaded_videos', []);
    if (Array.isArray(listed) && !listed.includes(c.file)) {
      listed.push(c.file);
      this.writeJson('win98_downloaded_videos', listed);
    }
    this.sound('playDing');
    this.setStatus(`Файл ${c.file} сохранён в C:\\My Documents\\Мои видео.`);
    return true;
  }

  openInPlayer(id) {
    const c = this.clip(id);
    if (!c || typeof window === 'undefined' || !window.appVideoPlayer) return false;
    window.appVideoPlayer.open(c.file, this.src(c), true);
    return true;
  }

  openVideoFolder() {
    if (typeof window !== 'undefined' && window.appExplorer) window.appExplorer.open(this.videoFolder);
  }

  gameInfo(clip) {
    const gm = typeof window !== 'undefined' ? window.gameManager : null;
    if (!clip.game || !gm || !gm.catalog || !gm.catalog[clip.game]) return null;
    const game = gm.catalog[clip.game];
    return { id: clip.game, name: game.title || game.name || clip.game, installed: gm.isInstalled(clip.game), cdDemo: !!game.cdDemo, price: game.priceDisplay || '' };
  }

  openGame(id) {
    const gm = typeof window !== 'undefined' ? window.gameManager : null;
    if (!gm || !gm.catalog || !gm.catalog[id]) return false;
    if (gm.isInstalled(id) && typeof gm.catalog[id].launch === 'function') gm.catalog[id].launch();
    else if (gm.catalog[id].cdDemo) gm.showOnCd(id);
    else gm.showInSteam(id);
    return true;
  }

  gameButtonText(game) {
    if (game.installed) return `Запустить ${this.esc(game.name)}`;
    if (game.cdDemo) return `${this.esc(game.name)} на диске «Игромании»`;
    return `${this.esc(game.name)} в Steam`;
  }

  gameStatusText(game) {
    if (game.installed) return ', уже установлена.';
    if (game.cdDemo) return ', демоверсия на компакт-диске журнала «Игромания».';
    return `, продаётся в Steam${game.price ? ` за ${this.esc(game.price)}` : ''}.`;
  }

  migrateLegacyBook() {
    if (typeof localStorage === 'undefined') return;
    let raw = null;
    try {
      raw = localStorage.getItem(this.storageKeys.legacyBook);
    } catch (e) {
      return;
    }
    if (!raw) return;
    let old = [];
    try {
      old = JSON.parse(raw) || [];
    } catch (e) {
      old = [];
    }
    const entries = this.userBook();
    if (Array.isArray(old)) {
      old.forEach(o => {
        if (!o || !o.text) return;
        entries.push({
          nick: String(o.nick || 'Зритель').slice(0, 30),
          modem: String(o.modem || '').slice(0, 30),
          clip: null,
          date: String(o.date || this.data.siteDay || '').slice(0, 10),
          text: String(o.text).slice(0, 600),
          reply: ''
        });
      });
    }
    this.writeJson(this.storageKeys.book, { entries });
    try {
      localStorage.removeItem(this.storageKeys.legacyBook);
    } catch (e) {}
  }

  userBook() {
    const saved = this.readJson(this.storageKeys.book, null);
    return saved && Array.isArray(saved.entries) ? saved.entries.slice() : [];
  }

  bookEntries() {
    this.migrateLegacyBook();
    return (this.data.book || []).concat(this.userBook());
  }

  replyFor(text, clipId) {
    const low = String(text || '').toLowerCase();
    if (/не (открыва|игра|идет|идёт|показыва)|кодек|codec|\.rm|\.mov/.test(low)) {
      return 'Наши ролики открывает Win Media Player из комплекта Win 98. Для .RM нужен RealPlayer G2, для .MOV нужен QuickTime 3.0. Подробнее на странице «Киномеханик».';
    }
    if (/тормоз|дёрга|дерга|отста/.test(low)) {
      return 'Переключите окно на 1x. Видео в Сети пока любит маленькие окна.';
    }
    if (/оборв|обрыв|докач|связь/.test(low)) {
      return 'Возьмите ReGet или GetRight: наш сервер умеет докачку.';
    }
    if (/звёздн|звездн|star wars|эпизод/.test(low)) {
      return 'Трейлер «Эпизода I» лежит на www.starwars.com. Права у Lucasfilm, у нас его не будет.';
    }
    if (/пришл|прислать|мой клип|свой клип|снял/.test(low)) {
      return `Пришлите ссылку на FTP или дискету почтой на ${this.mail}. Вложения больше 1 МБ сервер режет.`;
    }
    const c = this.clip(clipId);
    if (c) return `Спасибо за отзыв о ролике «${c.title}». Передам тому, кто его прислал.`;
    return 'Спасибо, запись внесена в книгу.';
  }

  addEntry(nick, modemId, clipId, text) {
    const cleanText = String(text || '').trim();
    if (!cleanText) return null;
    const clip = this.clip(clipId) ? clipId : null;
    const entry = {
      nick: String(nick || '').trim().slice(0, 30) || 'Зритель',
      modem: this.modem(modemId).name,
      clip,
      date: this.data.siteDay || '25.11.1998',
      text: cleanText.slice(0, 600),
      reply: this.replyFor(cleanText, clip)
    };
    const entries = this.userBook();
    entries.push(entry);
    this.writeJson(this.storageKeys.book, { entries });
    this.sound('playDing');
    this.setStatus(`Запись № ${this.bookEntries().length} внесена в книгу.`);
    return entry;
  }

  pollState() {
    const options = ((this.data.poll || {}).options || []).map(o => ({ id: o.id, text: o.text, votes: o.votes }));
    const saved = this.readJson(this.storageKeys.poll, null);
    const voted = saved && options.some(o => o.id === saved.voted) ? saved.voted : null;
    if (voted) options.forEach(o => { if (o.id === voted) o.votes += 1; });
    return { voted, options };
  }

  vote(id) {
    const state = this.pollState();
    if (state.voted || !state.options.some(o => o.id === id)) return state;
    this.writeJson(this.storageKeys.poll, { voted: id });
    this.sound('playDing');
    this.setStatus('Голос учтён. Программу на декабрь составим по итогам.');
    return this.pollState();
  }

  setStatus(msg) {
    this.statusMsg = msg;
    this.statusPath = this.lastUrl;
  }

  parseUrl(url) {
    const raw = String(url || this.baseUrl).trim();
    const noProto = raw.replace(/^[a-z]+:\/{2}/i, '');
    const slashIdx = noProto.indexOf('/');
    const pathAndQuery = slashIdx >= 0 ? noProto.slice(slashIdx) : '/';
    const [rawPath, rawQuery = ''] = pathAndQuery.split('#')[0].split('?');
    const path = (rawPath || '/').replace(/\/+$/, '').toLowerCase() || '/';
    const params = {};
    rawQuery.split('&').forEach(pair => {
      if (!pair) return;
      const [k, v = ''] = pair.split('=');
      try {
        params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
      } catch (e) {
        params[k] = v;
      }
    });
    if (path === '/' || path === '/index.html' || path === '/foyer') return { page: 'home', path, params };
    if (path === '/programme' || path === '/program') {
      const cat = (this.data.rubrics || []).some(r => r.id === params.cat) ? params.cat : 'all';
      return { page: 'programme', path, params, cat, sort: params.sort === 'light' ? 'light' : 'new' };
    }
    if (path === '/clip') {
      return this.clip(params.id) ? { page: 'clip', path, params, id: params.id } : { page: 'notfound', path, params };
    }
    if (path === '/booth' || path === '/help' || path === '/about') return { page: 'booth', path, params };
    if (path === '/book' || path === '/guestbook') return { page: 'book', path, params, clip: this.clip(params.clip) ? params.clip : '' };
    return { page: 'notfound', path, params };
  }

  bulbs(x0, x1, y, step, startIdx) {
    let out = '';
    let i = startIdx;
    for (let x = x0; x <= x1; x += step) {
      out += `<circle class="wc-bulb wc-bulb-${i % 2 ? 'b' : 'a'}" cx="${x}" cy="${y}" r="3"/>`;
      i++;
    }
    return out;
  }

  bulbsV(x, y0, y1, step, startIdx) {
    let out = '';
    let i = startIdx;
    for (let y = y0; y <= y1; y += step) {
      out += `<circle class="wc-bulb wc-bulb-${i % 2 ? 'b' : 'a'}" cx="${x}" cy="${y}" r="3"/>`;
      i++;
    }
    return out;
  }

  renderCanopy() {
    return `
      <svg class="wc-canopy" width="760" height="150" viewBox="0 0 760 150" role="img" aria-label="WebCinema '98, интернет-кинотеатр">
        <rect x="0" y="0" width="760" height="150" fill="#330000"/>
        <rect x="0" y="132" width="760" height="18" fill="#1a0000"/>
        <rect x="24" y="10" width="712" height="118" fill="#000000"/>
        <rect x="28" y="14" width="704" height="110" fill="#996600"/>
        <rect x="32" y="18" width="696" height="102" fill="#000000"/>
        ${this.bulbs(40, 720, 26, 16, 0)}
        ${this.bulbs(40, 720, 112, 16, 1)}
        ${this.bulbsV(40, 42, 96, 18, 1)}
        ${this.bulbsV(720, 42, 96, 18, 0)}
        <rect x="56" y="36" width="648" height="64" fill="#ffffee"/>
        <rect x="56" y="54" width="648" height="1" fill="#cccc99"/>
        <rect x="56" y="80" width="648" height="1" fill="#cccc99"/>
        <text x="380" y="76" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="38" font-weight="bold" fill="#111111" textLength="430" lengthAdjust="spacingAndGlyphs">WEBCINEMA '98</text>
        <text x="380" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#990000" textLength="360" lengthAdjust="spacing">ИНТЕРНЕТ-КИНОТЕАТР. ЗАЛ НА ОДНО МЕСТО</text>
        <rect x="66" y="42" width="38" height="52" fill="#000000"/>
        <circle cx="85" cy="58" r="11" fill="#ffffee"/><circle cx="85" cy="58" r="4" fill="#000000"/>
        <circle cx="85" cy="80" r="9" fill="#ffffee"/><circle cx="85" cy="80" r="3" fill="#000000"/>
        <rect x="656" y="42" width="38" height="52" fill="#000000"/>
        <rect x="662" y="48" width="26" height="40" fill="#ffffee"/>
        <rect x="662" y="58" width="26" height="1" fill="#000000"/>
        <rect x="662" y="78" width="26" height="1" fill="#000000"/>
        <text x="675" y="72" text-anchor="middle" font-family="Courier New, monospace" font-size="7" font-weight="bold" fill="#990000">БИЛЕТ</text>
        <text x="380" y="145" text-anchor="middle" font-family="Times New Roman, serif" font-size="11" fill="#cc9966">${this.esc(this.data.city || '')} • ftp.webcinema98.net • сеансы круглосуточно</text>
      </svg>
    `;
  }

  renderNav(active) {
    const cells = this.navItems.map(item => {
      const on = item.id === active;
      return `<td class="wc-plaque${on ? ' wc-plaque-on' : ''}">${on ? `<span>${item.label}</span>` : this.link(item.path, item.label, 'wc-plaque-link')}</td>`;
    }).join('');
    const options = this.modems().map(m => `<option value="${m.id}"${m.id === this.modemId() ? ' selected' : ''}>${this.esc(m.name)}</option>`).join('');
    return `
      <table class="wc-nav" cellspacing="0" cellpadding="0">
        <tr>
          ${cells}
          <td class="wc-modem-cell">
            <label for="wc-modem">Ваше соединение:</label>
            <select id="wc-modem" class="wc-modem-select">${options}</select>
          </td>
        </tr>
      </table>
    `;
  }

  renderStatus() {
    if (!this.statusMsg || this.statusPath !== this.lastUrl) return '';
    return `<div class="wc-status">${this.gif('info')} ${this.esc(this.statusMsg)}</div>`;
  }

  stillStrip(clip, cls = 'wc-strip') {
    const { w } = this.frameSize(clip);
    const width = Math.round(w * 90 / 144);
    return `
      <table class="${cls}" cellspacing="0" cellpadding="0"><tr>
        ${this.stills(clip).map((src, i) => `<td><img src="${src}" width="${width}" height="90" alt="Кадр ${i + 1}: ${this.esc(clip.title)}"></td>`).join('')}
      </tr></table>
    `;
  }

  sortedClips(sort = 'new') {
    const list = this.clips();
    if (sort === 'light') return list.sort((a, b) => a.bytes - b.bytes);
    return list;
  }

  renderLetterboard() {
    const modem = this.modem();
    const rows = this.sortedClips('new').map((c, i) => `
      <tr>
        <td class="wc-lb-no">${i + 1}</td>
        <td class="wc-lb-title">${this.link(`/clip?id=${c.id}`, this.esc(c.board), 'wc-lb-link')}</td>
        <td class="wc-lb-len">${this.duration(c.seconds)}</td>
        <td class="wc-lb-time">${this.esc(this.downloadText(c).toUpperCase())}</td>
      </tr>
    `).join('');
    return `
      <div class="wc-board">
        <div class="wc-board-head">СЕГОДНЯ В ЗАЛЕ</div>
        <table class="wc-lb" cellspacing="0" cellpadding="0">
          <tr class="wc-lb-cap"><td>СЕАНС</td><td>РОЛИК</td><td>ДЛИНА</td><td>ЗАГРУЗКА</td></tr>
          ${rows}
        </table>
        <div class="wc-board-foot">Время загрузки посчитано для соединения «${this.esc(modem.name)}». Смените соединение вверху, и доска пересчитается.</div>
      </div>
    `;
  }

  renderPoll() {
    const state = this.pollState();
    const total = state.options.reduce((s, o) => s + o.votes, 0) || 1;
    const poll = this.data.poll || {};
    if (state.voted) {
      const rows = state.options.map(o => {
        const pct = Math.round(o.votes * 100 / total);
        return `
          <tr>
            <td class="wc-poll-opt">${this.esc(o.text)}${o.id === state.voted ? ' <b>(ваш голос)</b>' : ''}</td>
            <td class="wc-poll-bar"><span style="width:${Math.max(2, pct)}px"></span></td>
            <td class="wc-poll-pct">${pct}%</td>
          </tr>
        `;
      }).join('');
      return `
        <div class="wc-poll">
          <div class="wc-poll-q">${this.esc(poll.question)}</div>
          <table cellspacing="0" cellpadding="2">${rows}</table>
          <div class="wc-poll-total">Всего голосов: ${total}</div>
        </div>
      `;
    }
    return `
      <div class="wc-poll">
        <div class="wc-poll-q">${this.esc(poll.question)}</div>
        ${state.options.map((o, i) => `<label class="wc-poll-row"><input type="radio" name="wc-poll" value="${o.id}"${i === 0 ? ' checked' : ''}> ${this.esc(o.text)}</label>`).join('')}
        <button type="button" class="win-btn" id="wc-poll-vote">Голосовать</button>
      </div>
    `;
  }

  renderHome() {
    const list = this.clips();
    const fresh = list[0];
    const notices = (this.data.notices || []).map(n => `
      <tr>
        <td class="wc-note-date">${this.esc(n.date)}</td>
        <td class="wc-note-text">${this.esc(n.text)}${n.clip ? ` ${this.link(`/clip?id=${n.clip}`, 'В зал')}` : ''}</td>
      </tr>
    `).join('');
    return `
      <table class="wc-foyer" cellspacing="0" cellpadding="0">
        <tr>
          <td class="wc-foyer-main">${this.renderLetterboard()}</td>
          <td class="wc-foyer-side">
            <div class="wc-fresh">
              <div class="wc-fresh-head">${this.gif('new')} Новинка недели</div>
              ${this.stillStrip(fresh, 'wc-strip wc-strip-small')}
              <div class="wc-fresh-title">${this.link(`/clip?id=${fresh.id}`, this.esc(fresh.title))}</div>
              <div class="wc-fresh-lead">${this.esc(fresh.lead)}</div>
              <div class="wc-fresh-meta">${this.duration(fresh.seconds)}, ${this.sizeMb(fresh.bytes)}, в зале с ${this.esc(fresh.added)}</div>
            </div>
            <div class="wc-kassa">
              <div class="wc-kassa-head">Касса</div>
              <p>Билеты бесплатные. Ролик можно смотреть прямо на странице, пока он грузится, или сохранить в «Мои видео» и смотреть без связи.</p>
              <p>Перед сеансом проверьте, что в списке вверху выбрано ваше соединение.</p>
            </div>
            ${this.renderPoll()}
          </td>
        </tr>
      </table>
      <div class="wc-notices">
        <div class="wc-notices-head">Объявления киномеханика</div>
        <table cellspacing="0" cellpadding="0">${notices}</table>
      </div>
    `;
  }

  renderProgramme(cat, sort) {
    const modem = this.modem();
    const list = this.sortedClips(sort).filter(c => cat === 'all' || c.rubric === cat);
    const q = (nextCat, nextSort) => {
      const parts = [];
      if (nextCat !== 'all') parts.push(`cat=${nextCat}`);
      if (nextSort === 'light') parts.push('sort=light');
      return `/programme${parts.length ? `?${parts.join('&')}` : ''}`;
    };
    const rubricLinks = [{ id: 'all', name: 'Все рубрики' }].concat(this.data.rubrics || []).map(r => {
      const n = r.id === 'all' ? this.clips().length : this.clips().filter(c => c.rubric === r.id).length;
      return r.id === cat ? `<b>${this.esc(r.name)} (${n})</b>` : this.link(q(r.id, sort), `${this.esc(r.name)} (${n})`);
    }).join(' | ');
    const sortLinks = [
      sort === 'new' ? '<b>сначала новые</b>' : this.link(q(cat, 'new'), 'сначала новые'),
      sort === 'light' ? '<b>сначала лёгкие</b>' : this.link(q(cat, 'light'), 'сначала лёгкие')
    ].join(' | ');
    const rows = list.map(c => `
      <tr>
        <td class="wc-pg-title">
          ${this.link(`/clip?id=${c.id}`, this.esc(c.title))}
          <div class="wc-pg-lead">${this.esc(c.lead)}</div>
        </td>
        <td>${this.esc(this.rubricName(c.rubric))}</td>
        <td class="wc-num">${this.duration(c.seconds)}</td>
        <td class="wc-num">${this.sizeMb(c.bytes)}</td>
        <td class="wc-num">${this.esc(c.frame)}</td>
        <td class="wc-num wc-pg-time">${this.downloadText(c)}</td>
        <td class="wc-num">${this.downloadCount(c.id)}</td>
        <td class="wc-pg-act">
          ${this.link(`/clip?id=${c.id}`, 'Смотреть')}<br>
          <a class="wc-link" data-wc-save="${c.id}">Скачать</a>
        </td>
      </tr>
    `).join('');
    return `
      <div class="wc-programme">
        <div class="wc-pg-head">
          <div class="wc-pg-name">Программа на неделю</div>
          <div class="wc-pg-week">${this.esc(this.data.weekLabel || '')}</div>
        </div>
        <div class="wc-pg-filter">Рубрики: ${rubricLinks}</div>
        <div class="wc-pg-filter">Порядок: ${sortLinks}</div>
        <table class="wc-pg" cellspacing="0" cellpadding="0">
          <tr class="wc-pg-cap">
            <th>Ролик</th><th>Рубрика</th><th>Длина</th><th>Размер</th><th>Кадр</th><th>Загрузка<br><small>${this.esc(modem.name)}</small></th><th>Скачали</th><th></th>
          </tr>
          ${rows || '<tr><td colspan="8">В этой рубрике пока ничего нет.</td></tr>'}
        </table>
        <div class="wc-pg-note">Ролики сжаты для окна 192x144. Загрузка посчитана по средней скорости линии, в часы пик выйдет дольше.</div>
      </div>
    `;
  }

  renderReviews(clip) {
    const all = this.bookEntries();
    const list = all.map((e, i) => ({ e, no: i + 1 })).filter(x => x.e.clip === clip.id);
    const items = list.map(({ e, no }) => `
      <div class="wc-review">
        <div class="wc-review-head">№ ${no}. ${this.esc(e.date)}. <b>${this.esc(e.nick)}</b> (${this.esc(e.modem)})</div>
        <div>${this.esc(e.text)}</div>
        ${e.reply ? `<div class="wc-review-reply">Киномеханик: ${this.esc(e.reply)}</div>` : ''}
      </div>
    `).join('');
    return `
      <div class="wc-reviews">
        <div class="wc-reviews-head">Отзывы из книги (${list.length})</div>
        ${items || '<p>Об этом ролике ещё никто не писал.</p>'}
        <p>${this.link(`/book?clip=${clip.id}`, 'Написать отзыв в книгу')}</p>
      </div>
    `;
  }

  renderTicket(clip) {
    const modem = this.modem();
    const game = this.gameInfo(clip);
    return `
      <div class="wc-ticket">
        <div class="wc-ticket-top">
          <div class="wc-ticket-house">WEBCINEMA '98</div>
          <div class="wc-ticket-no">Билет № ${this.ticketNo()}</div>
        </div>
        <table class="wc-ticket-rows" cellspacing="0" cellpadding="0">
          <tr><td>Сеанс</td><td>${this.esc(clip.title)}</td></tr>
          <tr><td>Ряд</td><td>1</td></tr>
          <tr><td>Место</td><td>1</td></tr>
          <tr><td>Длина</td><td>${this.duration(clip.seconds)}</td></tr>
          <tr><td>Файл</td><td>${this.sizeMb(clip.bytes)}, кадр ${this.esc(clip.frame)}, ${this.esc(clip.fps)} к/с</td></tr>
          <tr><td>Загрузка</td><td>${this.downloadText(clip)} (${this.esc(modem.name)})</td></tr>
          <tr><td>Цена</td><td>бесплатно</td></tr>
        </table>
        <div class="wc-ticket-file">${this.esc(clip.file)}</div>
        <div class="wc-ticket-btns">
          <button type="button" class="win-btn" data-wc-save="${clip.id}">Скачать в «Мои видео»</button>
          <button type="button" class="win-btn" data-wc-player="${clip.id}">Открыть в Win Media Player</button>
          ${game ? `<button type="button" class="win-btn" data-wc-game="${game.id}">${this.gameButtonText(game)}</button>` : ''}
        </div>
        ${game ? `<div class="wc-ticket-game">${this.esc(clip.gameNote || '')}${this.gameStatusText(game)}</div>` : ''}
      </div>
    `;
  }

  renderClip(id) {
    const clip = this.clip(id);
    const list = this.clips();
    const idx = list.findIndex(c => c.id === id);
    const prev = list[idx - 1];
    const next = list[idx + 1];
    const { w, h } = this.frameSize(clip);
    const vw = w * this.zoom;
    const vh = h * this.zoom;
    return `
      <div class="wc-hall">
        <div class="wc-hall-sign">Зал. Сеанс ${idx + 1}: ${this.esc(clip.title)}</div>
        <table class="wc-stage" cellspacing="0" cellpadding="0">
          <tr><td colspan="3" class="wc-valance"></td></tr>
          <tr>
            <td class="wc-curtain"></td>
            <td class="wc-screen-cell">
              <div class="wc-screen">
                <video id="wc-video" class="wc-video" src="${this.esc(this.src(clip))}" width="${vw}" height="${vh}" data-w="${w}" data-h="${h}" playsinline preload="metadata"></video>
              </div>
            </td>
            <td class="wc-curtain"></td>
          </tr>
        </table>
        <div class="wc-amovie">
          <button type="button" class="win-btn wc-am-btn" id="wc-play" title="Воспроизвести">&#9658;</button>
          <button type="button" class="win-btn wc-am-btn" id="wc-pause" title="Пауза">||</button>
          <button type="button" class="win-btn wc-am-btn" id="wc-stop" title="Стоп">&#9632;</button>
          <input type="range" id="wc-seek" class="wc-seek" min="0" max="${clip.seconds}" step="0.1" value="0" aria-label="Позиция">
          <span class="wc-am-time" id="wc-time">0:00 / ${this.duration(clip.seconds)}</span>
          <button type="button" class="win-btn wc-am-btn" id="wc-mute" title="Звук">${this.gif('speaker')}</button>
          <input type="range" id="wc-vol" class="wc-vol" min="0" max="1" step="0.05" value="0.8" aria-label="Громкость">
          <button type="button" class="win-btn wc-am-btn${this.zoom === 1 ? ' wc-am-on' : ''}" data-wc-zoom="1" title="Окно ${w}x${h}">1x</button>
          <button type="button" class="win-btn wc-am-btn${this.zoom === 2 ? ' wc-am-on' : ''}" data-wc-zoom="2" title="Окно ${w * 2}x${h * 2}">2x</button>
          <button type="button" class="win-btn wc-am-btn" id="wc-full">Весь экран</button>
        </div>
        <div class="wc-am-status"><span id="wc-state">Готово. Нажмите &#9658;</span><span id="wc-buf">Загружено: 0%</span></div>
        <table class="wc-clip-body" cellspacing="0" cellpadding="0">
          <tr>
            <td class="wc-clip-text">
              <p class="wc-clip-lead">${this.esc(clip.lead)}</p>
              ${clip.text.map(t => `<p>${this.esc(t)}</p>`).join('')}
              <div class="wc-strip-cap">Кадры из ролика</div>
              ${this.stillStrip(clip)}
              <p class="wc-clip-meta">Рубрика: ${this.link(`/programme?cat=${clip.rubric}`, this.esc(this.rubricName(clip.rubric)))}. В зале с ${this.esc(clip.added)}. Скачали ${this.downloadCount(clip.id)} раз.</p>
              ${this.renderReviews(clip)}
            </td>
            <td class="wc-clip-side">${this.renderTicket(clip)}</td>
          </tr>
        </table>
        <div class="wc-hall-nav">
          <span class="wc-hall-prev">${prev ? this.link(`/clip?id=${prev.id}`, `&laquo; сеанс ${idx}: ${this.esc(prev.title)}`) : ''}</span>
          <span class="wc-hall-all">${this.link('/programme', 'вся программа')}</span>
          <span class="wc-hall-next">${next ? this.link(`/clip?id=${next.id}`, `сеанс ${idx + 2}: ${this.esc(next.title)} &raquo;`) : ''}</span>
        </div>
      </div>
    `;
  }

  calcResult() {
    const mb = parseFloat(String(this.calc.mb).replace(',', '.'));
    if (!isFinite(mb) || mb <= 0) return 'Введите размер файла в мегабайтах, например 4,5.';
    const modem = this.modem(this.calc.modem || this.modemId());
    return `${String(mb).replace('.', ',')} МБ через «${modem.name}»: около ${this.timeText(mb * 1048576 / modem.bps)}.`;
  }

  renderBooth() {
    const players = (this.data.players || []).map(p => `
      <tr><td><b>${this.esc(p.name)}</b></td><td>${this.esc(p.formats)}</td><td>${this.esc(p.where)}</td></tr>
    `).join('');
    const faq = (this.data.faq || []).map(f => `
      <dt>${this.gif('question')} ${this.esc(f.q)}</dt>
      <dd>${this.esc(f.a)}</dd>
    `).join('');
    const modemOptions = this.modems().map(m => `<option value="${m.id}"${m.id === (this.calc.modem || this.modemId()) ? ' selected' : ''}>${this.esc(m.name)}</option>`).join('');
    const rateRows = this.modems().map(m => `<tr><td>${this.esc(m.name)}</td><td class="wc-num">${(m.bps / 1024).toFixed(1).replace('.', ',')} КБ/с</td><td class="wc-num">${this.timeText(1048576 / m.bps)}</td></tr>`).join('');
    const staff = (this.data.staff || []).map(s => `<li><b>${this.esc(s.name)}</b>, ${this.esc(s.role)}</li>`).join('');
    return `
      <div class="wc-booth">
        <div class="wc-enamel">Аппаратная. Посторонним вход воспрещён</div>
        <p class="wc-booth-intro">Здесь написано, чем смотреть ролики, что делать, если они не идут, и сколько ждать загрузки.</p>
        <div class="wc-card">
          <div class="wc-card-head">Чем смотреть</div>
          <table class="wc-card-table" cellspacing="0" cellpadding="0">
            <tr><th>Проигрыватель</th><th>Форматы</th><th>Где взять</th></tr>
            ${players}
          </table>
        </div>
        <div class="wc-card">
          <div class="wc-card-head">Если не идёт</div>
          <dl class="wc-faq">${faq}</dl>
        </div>
        <div class="wc-card">
          <div class="wc-card-head">Сколько ждать загрузки</div>
          <table class="wc-booth-calc" cellspacing="0" cellpadding="0">
            <tr>
              <td class="wc-calc-form">
                <label>Размер файла, МБ:<br><input type="text" id="wc-calc-mb" class="win-input" value="${this.esc(this.calc.mb)}" size="8"></label><br>
                <label>Соединение:<br><select id="wc-calc-modem">${modemOptions}</select></label><br>
                <button type="button" class="win-btn" id="wc-calc-go">Посчитать</button>
                <div class="wc-calc-out" id="wc-calc-out">${this.esc(this.calcResult())}</div>
              </td>
              <td class="wc-calc-rates">
                <table cellspacing="0" cellpadding="0">
                  <tr><th>Соединение</th><th>Средняя скорость</th><th>Время на 1 МБ</th></tr>
                  ${rateRows}
                </table>
              </td>
            </tr>
          </table>
        </div>
        <div class="wc-card wc-card-history">
          <div class="wc-card-head">О кинотеатре</div>
          ${(this.data.history || []).map(p => `<p>${this.esc(p)}</p>`).join('')}
          <ul>${staff}</ul>
          <p>Письма: <a href="mailto:info@webcinema98.com">info@webcinema98.com</a></p>
        </div>
      </div>
    `;
  }

  renderBook(preClip) {
    const entries = this.bookEntries();
    const items = entries.map((e, i) => {
      const c = this.clip(e.clip);
      return `
        <div class="wc-entry">
          <div class="wc-entry-head">Запись № ${i + 1}. ${this.esc(e.date)}. <b>${this.esc(e.nick)}</b>${e.modem ? `, ${this.esc(e.modem)}` : ''}${c ? `, о ролике ${this.link(`/clip?id=${c.id}`, `«${this.esc(c.title)}»`)}` : ''}</div>
          <div class="wc-entry-text">${this.esc(e.text)}</div>
          ${e.reply ? `<div class="wc-entry-reply">Ответ администрации: ${this.esc(e.reply)}</div>` : ''}
        </div>
      `;
    }).join('');
    const clipOptions = ['<option value="">без ролика</option>'].concat(this.clips().map(c => `<option value="${c.id}"${c.id === preClip ? ' selected' : ''}>${this.esc(c.title)}</option>`)).join('');
    const modemOptions = this.modems().map(m => `<option value="${m.id}"${m.id === this.modemId() ? ' selected' : ''}>${this.esc(m.name)}</option>`).join('');
    return `
      <div class="wc-book">
        <div class="wc-book-cover">
          <div class="wc-book-title">Книга отзывов и предложений</div>
          <div class="wc-book-sub">Интернет-кинотеатр WebCinema '98. Начата 05.10.1998. Записей: ${entries.length}</div>
        </div>
        <div class="wc-book-page">
          ${items}
          <form class="wc-book-form" id="wc-book-form">
            <div class="wc-entry-head">Запись № ${entries.length + 1}. ${this.esc(this.data.siteDay || '')}.</div>
            <table cellspacing="0" cellpadding="3">
              <tr><td>Ваше имя:</td><td><input type="text" id="wc-book-nick" class="win-input" maxlength="30" value="Зритель"></td></tr>
              <tr><td>Соединение:</td><td><select id="wc-book-modem">${modemOptions}</select></td></tr>
              <tr><td>О ролике:</td><td><select id="wc-book-clip">${clipOptions}</select></td></tr>
              <tr><td>Отзыв:</td><td><textarea id="wc-book-text" class="win-input" rows="4" cols="46" maxlength="600"></textarea></td></tr>
              <tr><td></td><td><button type="button" class="win-btn" id="wc-book-send">Внести в книгу</button></td></tr>
            </table>
          </form>
        </div>
      </div>
    `;
  }

  renderNotFound(route) {
    return `
      <div class="wc-raw">
        <h1>Not Found</h1>
        <p>The requested URL ${this.esc(route.path)} was not found on this server.</p>
        <hr>
        <address>Apache/1.3.3 Server at www.webcinema98.com Port 80</address>
        <p>${this.link('', 'www.webcinema98.com')}</p>
      </div>
    `;
  }

  renderFooter() {
    const hits = this.ticketNo().replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
    return `
      <div class="wc-footer">
        <div class="wc-counter">Выдано билетов: <span>${hits}</span></div>
        <div class="wc-buttons">
          <span class="wc-88 wc-88-mpeg">MPEG<br>VIDEO</span>
          <span class="wc-88 wc-88-real">RealPlayer<br>G2</span>
          <span class="wc-88 wc-88-qt">QuickTime<br>3.0</span>
          <span class="wc-88 wc-88-ie">Internet<br>Explorer 5</span>
        </div>
        <div class="wc-ring">
          Российское видеокольцо:
          <a class="wc-link" data-url="http://www.kinomania98.ru">&laquo; Киномания '98</a> |
          <a class="wc-link" data-url="http://www.mp3vault98.com">MP3 Vault '98</a> |
          <a class="wc-link" data-url="http://www.muzzone98.ru">МузЗона '98 &raquo;</a>
        </div>
        <div class="wc-copy">© 1998 WebCinema '98, ${this.esc(this.data.city || '')}. Лучше всего смотреть при 800x600 и 16-битном цвете. <a href="mailto:info@webcinema98.com">info@webcinema98.com</a></div>
      </div>
    `;
  }

  renderSite(url) {
    this.lastUrl = url || this.baseUrl;
    this.countHit();
    const route = this.parseUrl(this.lastUrl);
    if (this.statusPath && this.statusPath !== this.lastUrl) {
      this.statusMsg = '';
      this.statusPath = '';
    }
    if (route.page === 'notfound') return `<div class="wc-page wc-page-raw">${this.renderNotFound(route)}</div>`;
    let body = '';
    if (route.page === 'home') body = this.renderHome();
    else if (route.page === 'programme') body = this.renderProgramme(route.cat, route.sort);
    else if (route.page === 'clip') body = this.renderClip(route.id);
    else if (route.page === 'booth') body = this.renderBooth();
    else if (route.page === 'book') body = this.renderBook(route.clip);
    const active = route.page === 'clip' ? 'programme' : route.page;
    return `
      <div class="wc-page">
        <div class="wc-house">
          ${this.renderCanopy()}
          ${this.renderNav(active)}
          <div class="wc-body wc-body-${route.page}">
            ${this.renderStatus()}
            ${body}
          </div>
          ${this.renderFooter()}
        </div>
      </div>
    `;
  }

  rerender(win, frame) {
    if (!frame) return;
    const top = frame.scrollTop || 0;
    frame.innerHTML = this.renderSite(this.lastUrl);
    this.wireLinks(win, frame);
    this.bindEvents(win, frame);
    frame.scrollTop = top;
  }

  wireLinks(win, frame) {
    if (typeof frame.querySelectorAll !== 'function') return;
    Array.from(frame.querySelectorAll('a[data-url]') || []).forEach(a => {
      a.addEventListener('click', e => {
        if (e && e.preventDefault) e.preventDefault();
        const u = a.getAttribute('data-url');
        if (u && typeof window !== 'undefined' && window.appIE) window.appIE.navigate(win, u);
      });
    });
  }

  attachEvents(win, frame) {
    this.bindEvents(win, frame);
    const route = this.parseUrl(this.lastUrl);
    if (route.page === 'book' && route.clip && frame && typeof frame.querySelector === 'function') {
      const form = frame.querySelector('#wc-book-form');
      if (form && typeof form.offsetTop === 'number') frame.scrollTop = Math.max(0, form.offsetTop - 20);
    }
  }

  confirmDownload(win, frame, id) {
    const c = this.clip(id);
    if (!c) return;
    const modem = this.modem();
    const message = `Файл <b>${this.esc(c.file)}</b>, ${this.sizeMb(c.bytes)}.<br>Соединение «${this.esc(modem.name)}»: загрузка займёт около ${this.downloadText(c)}.<br><br>Сохранить в C:\\My Documents\\Мои видео?`;
    const done = () => {
      this.saveClip(id);
      this.rerender(win, frame);
    };
    if (typeof window === 'undefined' || !window.winManager || typeof window.winManager.openDialog !== 'function') {
      done();
      return;
    }
    window.winManager.openDialog({
      title: 'Загрузка файла',
      icon: 'info',
      message,
      buttons: [
        { text: 'Сохранить', primary: true, onClick: () => {
          done();
          window.winManager.openDialog({
            title: 'Загрузка завершена',
            icon: 'info',
            message: `Ролик <b>${this.esc(c.file)}</b> сохранён в C:\\My Documents\\Мои видео.`,
            buttons: [
              { text: 'Смотреть', primary: true, onClick: () => this.openInPlayer(id) },
              { text: 'Открыть папку', onClick: () => this.openVideoFolder() },
              { text: 'Закрыть' }
            ]
          });
        } },
        { text: 'Отмена' }
      ]
    });
  }

  bindEvents(win, frame) {
    if (!frame || typeof frame.querySelector !== 'function') return;
    const q = sel => frame.querySelector(sel);
    const qa = sel => Array.from(frame.querySelectorAll(sel) || []);

    const modemSel = q('#wc-modem');
    if (modemSel) {
      modemSel.addEventListener('change', () => {
        const id = this.setModem(modemSel.value);
        this.setStatus(`Время загрузки пересчитано для соединения «${this.modem(id).name}».`);
        this.rerender(win, frame);
      });
    }

    qa('[data-wc-save]').forEach(el => {
      el.addEventListener('click', e => {
        if (e && e.preventDefault) e.preventDefault();
        this.confirmDownload(win, frame, el.getAttribute('data-wc-save'));
      });
    });

    qa('[data-wc-player]').forEach(el => {
      el.addEventListener('click', () => {
        const v = q('#wc-video');
        if (v && typeof v.pause === 'function') v.pause();
        this.openInPlayer(el.getAttribute('data-wc-player'));
      });
    });

    qa('[data-wc-game]').forEach(el => {
      el.addEventListener('click', () => this.openGame(el.getAttribute('data-wc-game')));
    });

    const voteBtn = q('#wc-poll-vote');
    if (voteBtn) {
      voteBtn.addEventListener('click', () => {
        const checked = q('input[name="wc-poll"]:checked');
        if (!checked) return;
        this.vote(checked.value);
        this.rerender(win, frame);
      });
    }

    const calcBtn = q('#wc-calc-go');
    if (calcBtn) {
      calcBtn.addEventListener('click', () => {
        const mb = q('#wc-calc-mb');
        const modem = q('#wc-calc-modem');
        this.calc = { mb: mb ? String(mb.value).slice(0, 12) : this.calc.mb, modem: modem ? modem.value : this.calc.modem };
        this.sound('playClick');
        const out = q('#wc-calc-out');
        if (out) out.textContent = this.calcResult();
      });
    }

    const bookForm = q('#wc-book-form');
    if (bookForm) bookForm.addEventListener('submit', e => { if (e && e.preventDefault) e.preventDefault(); });

    const sendBtn = q('#wc-book-send');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const text = q('#wc-book-text');
        const entry = this.addEntry(
          q('#wc-book-nick') ? q('#wc-book-nick').value : '',
          q('#wc-book-modem') ? q('#wc-book-modem').value : '',
          q('#wc-book-clip') ? q('#wc-book-clip').value : '',
          text ? text.value : ''
        );
        if (!entry) {
          if (typeof window !== 'undefined' && window.winManager) {
            window.winManager.openDialog({ title: 'Книга отзывов', icon: 'warning', message: 'Напишите отзыв, прежде чем вносить его в книгу.' });
          }
          return;
        }
        this.rerender(win, frame);
        if (typeof frame.scrollHeight === 'number') frame.scrollTop = frame.scrollHeight;
      });
    }

    this.bindPlayer(frame);
  }

  bindPlayer(frame) {
    const q = sel => frame.querySelector(sel);
    const video = q('#wc-video');
    if (!video || typeof video.addEventListener !== 'function') return;
    const state = q('#wc-state');
    const buf = q('#wc-buf');
    const seek = q('#wc-seek');
    const time = q('#wc-time');
    const vol = q('#wc-vol');
    const mute = q('#wc-mute');
    const say = text => { if (state) state.textContent = text; };
    const total = () => (isFinite(video.duration) && video.duration > 0 ? video.duration : Number(seek && seek.max) || 0);
    const showTime = () => {
      if (time) time.textContent = `${this.duration(video.currentTime)} / ${this.duration(total())}`;
    };

    video.volume = 0.8;
    video.addEventListener('loadedmetadata', () => {
      if (seek) seek.max = total();
      showTime();
    });
    video.addEventListener('waiting', () => say('Буферизация...'));
    video.addEventListener('playing', () => say('Воспроизведение'));
    video.addEventListener('pause', () => { if (!video.ended) say('Пауза'); });
    video.addEventListener('ended', () => say('Сеанс окончен'));
    video.addEventListener('timeupdate', () => {
      if (seek && !seek.dragging) seek.value = video.currentTime;
      showTime();
    });
    video.addEventListener('progress', () => {
      if (!buf || !video.buffered || !video.buffered.length || !total()) return;
      const end = video.buffered.end(video.buffered.length - 1);
      buf.textContent = `Загружено: ${Math.min(100, Math.round(end * 100 / total()))}%`;
    });
    video.addEventListener('error', () => say('Ошибка: файл не найден на сервере'));

    const play = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => say('Не удалось начать воспроизведение'));
    };
    const on = (sel, evt, fn) => { const el = q(sel); if (el) el.addEventListener(evt, fn); };
    on('#wc-play', 'click', play);
    on('#wc-pause', 'click', () => video.pause());
    on('#wc-stop', 'click', () => {
      video.pause();
      video.currentTime = 0;
      if (seek) seek.value = 0;
      showTime();
      say('Остановлено');
    });
    on('#wc-video', 'click', () => (video.paused ? play() : video.pause()));
    if (seek) {
      seek.addEventListener('input', () => {
        seek.dragging = true;
        video.currentTime = Number(seek.value) || 0;
      });
      seek.addEventListener('change', () => { seek.dragging = false; });
    }
    if (vol) {
      vol.addEventListener('input', () => {
        video.volume = Number(vol.value);
        video.muted = false;
        if (mute) mute.innerHTML = this.gif(video.volume > 0 ? 'speaker' : 'mute');
      });
    }
    if (mute) {
      mute.addEventListener('click', () => {
        video.muted = !video.muted;
        mute.innerHTML = this.gif(video.muted ? 'mute' : 'speaker');
      });
    }
    Array.from(frame.querySelectorAll('[data-wc-zoom]') || []).forEach(btn => {
      btn.addEventListener('click', () => {
        this.zoom = btn.getAttribute('data-wc-zoom') === '1' ? 1 : 2;
        const w = Number(video.getAttribute('data-w')) || 192;
        const h = Number(video.getAttribute('data-h')) || 144;
        video.width = w * this.zoom;
        video.height = h * this.zoom;
        Array.from(frame.querySelectorAll('[data-wc-zoom]') || []).forEach(b => {
          if (b.classList) b.classList.toggle('wc-am-on', b === btn);
        });
      });
    });
    on('#wc-full', 'click', () => {
      if (video.requestFullscreen) video.requestFullscreen();
      else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    });
  }
}

window.webcinemaSite = new WebCinemaSite();
