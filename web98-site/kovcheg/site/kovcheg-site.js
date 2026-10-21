const KOVCHEG_BASE = 'http://www.kovcheg98.ru';

class KovchegSite {
  constructor() {
    this.hitsKey = 'win98_kovcheg_hits_v1';
    this.pollKey = 'win98_kovcheg_poll_v1';
    this.hitCounted = false;
  }

  data() { return window.kovchegData; }
  hsrData() { return window.kovchegHsr; }
  bench() { return window.kovchegBench || null; }
  game() { return typeof globalThis !== 'undefined' && globalThis.Hsr98 && globalThis.Hsr98.CHARS ? globalThis.Hsr98 : null; }

  esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/—/g, '-');
  }

  gif(name, scale = 1, title = '') {
    return window.webGif ? window.webGif(name, scale, title) : '';
  }

  url(path = '') { return KOVCHEG_BASE + path; }

  link(path, label, cls = '') {
    return `<a${cls ? ` class="${cls}"` : ''} data-url="${this.url(path)}">${label}</a>`;
  }

  read(key) {
    try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; } catch (e) { return null; }
  }

  write(key, value) {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  parseUrl(url) {
    const raw = String(url || KOVCHEG_BASE).replace(/^[a-z]+:\/{2}/i, '');
    const cut = raw.indexOf('/');
    const rest = cut < 0 ? '' : raw.slice(cut);
    const [pathPart, query = ''] = rest.split('#')[0].split('?');
    const path = pathPart.toLowerCase().replace(/\/index\.html?$/, '').replace(/\/+$/, '');
    const params = {};
    query.split('&').filter(Boolean).forEach(pair => {
      const [k, v = ''] = pair.split('=');
      try { params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { params[k] = v; }
    });
    if (path === '') return { view: 'home', path, params };
    if (path === '/hsr98') return { view: 'hub', path, params };
    if (path === '/hsr98/tier') return { view: 'tier', path, params };
    if (path === '/hsr98/crew') return { view: 'crew', path, params };
    if (path === '/hsr98/teams') return { view: 'teams', path, params };
    if (path === '/hsr98/team') return this.hsrData().TEAMS.some(t => t.id === params.id) ? { view: 'team', path, params } : { view: 'missing', path, params };
    const ref = { '/hsr98/mycrew': 'mine', '/guestbook': 'guestbook', '/hsr98/builder': 'builder', '/hsr98/hall': 'hall', '/hsr98/su': 'su', '/hsr98/cones': 'cones', '/hsr98/relics': 'relics', '/hsr98/fusions': 'fusions', '/hsr98/banners': 'banners', '/about': 'about' };
    if (ref[path]) return { view: ref[path], path, params };
    if (path === '/hsr98/guide') return params.id == null || (window.kovchegArticles && window.kovchegArticles.list.includes(params.id)) ? { view: 'guide', path, params } : { view: 'missing', path, params };
    if (path === '/hsr98/bosses') return params.id == null || (this.bossList && this.game() && this.bossList()[params.id]) ? { view: 'bosses', path, params } : { view: 'missing', path, params };
    if (path === '/hsr98/char') {
      const H = this.game();
      return H && H.CHARS[params.id] ? { view: 'char', path, params } : { view: 'missing', path, params };
    }
    if (this.data().sections[path]) return { view: 'soon', path, params, title: this.data().sections[path] };
    return { view: 'missing', path, params };
  }

  charName(id) {
    const H = this.game();
    if (id === 'trail') return 'Первопроходец (Разрушение)';
    if (id === 'trail_p') return 'Первопроходец (Сохранение)';
    return H && H.CHARS[id] ? H.CHARS[id].name : id;
  }

  art(spec, size, label, height) {
    const t = this.esc(label || '');
    return `<canvas class="kv-art" data-kv-art="${spec}" width="${size}" height="${height || size}" role="img" aria-label="${t}" title="${t}"></canvas>`;
  }

  renderMast() {
    const d = this.data();
    return `
      <svg class="kv-mast-svg" width="760" height="96" viewBox="0 0 760 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${this.esc(d.title)}: ${this.esc(d.motto)}">
        <rect x="0" y="0" width="760" height="96" fill="#000033"/>
        <rect x="0" y="66" width="760" height="30" fill="#003366"/>
        <polyline points="0,72 20,68 40,72 60,68 80,72 100,68 120,72 140,68 160,72 180,68 200,72 220,68 240,72 260,68 280,72 300,68 320,72 340,68 360,72 380,68 400,72 420,68 440,72 460,68 480,72 500,68 520,72 540,68 560,72 580,68 600,72 620,68 640,72 660,68 680,72 700,68 720,72 740,68 760,72" fill="none" stroke="#6699CC" stroke-width="2"/>
        <polyline points="0,84 30,80 60,84 90,80 120,84 150,80 180,84 210,80 240,84 270,80 300,84 330,80 360,84 390,80 420,84 450,80 480,84 510,80 540,84 570,80 600,84 630,80 660,84 690,80 720,84 750,80 760,82" fill="none" stroke="#336699" stroke-width="2"/>
        <polygon points="18,70 112,70 102,82 30,82" fill="#663300" stroke="#000000"/>
        <rect x="62" y="10" width="4" height="60" fill="#CC9933"/>
        <polygon points="66,12 150,24 66,36" fill="#CC3333" stroke="#000000"/>
        <polygon points="66,40 104,52 66,62" fill="#FFFFCC" stroke="#000000"/>
        <text x="172" y="44" font-family="Times New Roman, serif" font-size="40" font-weight="bold" fill="#FFCC66" stroke="#663300" stroke-width="1">КОВЧЕГ</text>
        <text x="174" y="62" font-family="Verdana, sans-serif" font-size="11" fill="#FFFFCC">${this.esc(d.motto)} · ${this.esc(d.tagline)}</text>
        <circle cx="704" cy="38" r="26" fill="#003366" stroke="#CC9933" stroke-width="3"/>
        <polygon points="704,14 709,38 704,62 699,38" fill="#FFCC66"/>
        <polygon points="680,38 704,33 728,38 704,43" fill="#CCCCCC"/>
        <polygon points="704,14 709,38 699,38" fill="#CC3333"/>
        <circle cx="704" cy="38" r="3" fill="#000033"/>
        <text x="704" y="12" font-family="Verdana, sans-serif" font-size="9" fill="#FFCC66" text-anchor="middle">N</text>
      </svg>`;
  }

  renderNav(route) {
    const items = [['', 'Причал', ['home']], ['/hsr98/', 'SR98', ['hub']], ['/hsr98/tier', 'Тир-лист', []], ['/about', 'О сайте', []], ['/guestbook', 'Гостевая', []]];
    return items.map(([path, label, views]) => {
      const on = views.includes(route.view) || (route.path && route.path === path);
      return `<td class="kv-plate${on ? ' kv-plate-on' : ''}">${this.link(path, label)}</td>`;
    }).join('<td class="kv-plate-gap">&nbsp;</td>');
  }

  visits() {
    const n = parseInt(this.read(this.hitsKey) || '0', 10) || 0;
    return this.data().firstVisitor + n;
  }

  countVisit() {
    if (this.hitCounted) return;
    this.hitCounted = true;
    const n = parseInt(this.read(this.hitsKey) || '0', 10) || 0;
    this.write(this.hitsKey, String(n + 1));
  }

  renderCounter() {
    const digits = String(this.visits()).padStart(7, '0').split('');
    return `<span class="kv-counter" title="Посетителей с 12.10.1999">${digits.map(c => `<span class="kv-digit">${c}</span>`).join('')}</span>`;
  }

  renderFoot() {
    const d = this.data();
    return `
      <table class="kv-foot-table" width="100%" cellspacing="0" cellpadding="4">
        <tr>
          <td>&copy; 1999&ndash;2000 «${this.esc(d.title)}». Сайт открыт ${d.opened}, обновлён ${d.updated}.<br>
          Мнения наши, цифры из замеров. Сайт не связан с разработчиками игр.<br>
          Почта редакции: <a href="mailto:bocman@kovcheg98.ru">bocman@kovcheg98.ru</a></td>
          <td class="kv-foot-count" align="right" nowrap>Вы ${this.renderCounter()}-й гость</td>
        </tr>
      </table>`;
  }

  pollState() {
    const d = this.data().poll;
    const mine = this.read(this.pollKey);
    const options = d.options.map(o => ({ id: o.id, label: o.label, votes: o.votes + (mine === o.id ? 1 : 0) }));
    const total = options.reduce((a, o) => a + o.votes, 0);
    return { question: d.question, options, total, mine };
  }

  renderPoll() {
    const p = this.pollState();
    if (p.mine) {
      const rows = p.options.map(o => {
        const pct = Math.round(100 * o.votes / p.total);
        return `<tr><td class="kv-poll-label">${this.esc(o.label)}${p.mine === o.id ? ' <b>(ваш)</b>' : ''}</td><td class="kv-poll-bar"><span class="kv-bar" style="width:${Math.max(2, pct * 2)}px"></span> ${pct}%</td></tr>`;
      }).join('');
      return `
        <table class="kv-box" width="100%" cellspacing="0" cellpadding="4">
          <tr><th class="kv-box-head">Опрос</th></tr>
          <tr><td><b>${this.esc(p.question)}</b>
            <table class="kv-poll" cellspacing="0" cellpadding="2">${rows}</table>
            Всего голосов: ${p.total}. <button class="win-btn kv-btn" data-kv-poll-reset="1">Переголосовать</button>
          </td></tr>
        </table>`;
    }
    const opts = p.options.map(o => `<label class="kv-poll-opt"><input type="radio" name="kv-poll" value="${o.id}"> ${this.esc(o.label)}</label><br>`).join('');
    return `
      <table class="kv-box" width="100%" cellspacing="0" cellpadding="4">
        <tr><th class="kv-box-head">Опрос</th></tr>
        <tr><td><b>${this.esc(p.question)}</b><br>${opts}
          <button class="win-btn kv-btn" data-kv-poll="1">Голосовать</button>
        </td></tr>
      </table>`;
  }

  gameTitle(id) {
    const gm = window.gameManager;
    const g = gm && gm.catalog && gm.catalog[id];
    return g ? g.title : id;
  }

  renderHome() {
    const d = this.data();
    const pier = d.games.map(g => {
      const title = this.esc(this.gameTitle(g.id));
      if (g.open) {
        return `
          <tr><td class="kv-berth kv-berth-open">
            ${this.gif('star')} <b>${this.link(g.path, title)}</b><br>
            <span class="kv-berth-state">у причала, открыт</span><br>
            <span class="kv-small">${this.esc(g.note)}</span>
          </td></tr>`;
      }
      return `
        <tr><td class="kv-berth kv-berth-dock">
          <div class="kv-hazard"></div>
          ${this.gif('construct')} <b>${title}</b><br>
          <span class="kv-berth-state">в доке, строится</span><br>
          <span class="kv-small">${this.esc(g.note)}</span>
        </td></tr>`;
    }).join('');
    const crew = d.crew.map(c => `<li><b>${this.esc(c.nick)}</b>: ${this.esc(c.job)}</li>`).join('');
    const log = d.log.map((e, i) => `
      <tr>
        <td class="kv-log-date" valign="top">${e.date}${i === 0 ? ' ' + this.gif('new') : ''}</td>
        <td class="kv-log-text">${this.esc(e.text)}</td>
      </tr>`).join('');
    const buttons = d.buttons.map(b => {
      const inner = `<span class="kv-88-sub">${this.esc(b.sub)}</span><span class="kv-88-main">${this.esc(b.text)}</span>`;
      return b.url ? `<a class="kv-88" data-url="${b.url}">${inner}</a>` : `<span class="kv-88">${inner}</span>`;
    }).join(' ');
    return `
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="kv-pier" width="250" valign="top">
            <table class="kv-pier-table" width="100%" cellspacing="0" cellpadding="6">
              <tr><th class="kv-pier-head">У причала</th></tr>
              ${pier}
            </table>
            <table class="kv-box" width="100%" cellspacing="0" cellpadding="4">
              <tr><th class="kv-box-head">Экипаж сайта</th></tr>
              <tr><td><ul class="kv-crew">${crew}</ul></td></tr>
            </table>
          </td>
          <td class="kv-deck" valign="top">
            <h1 class="kv-h1">Добро пожаловать на борт</h1>
            <p>Здесь мы разбираем ролевые игры по косточкам: кого качать, с кем ставить в отряд и как пройти трудное место. Оценки не из головы. Каждого персонажа мы гоняем через одни и те же бои и считаем циклы, а уже потом спорим.</p>
            <table class="kv-log" width="100%" cellspacing="0" cellpadding="4">
              <tr><th colspan="2" class="kv-log-head">Вахтенный журнал</th></tr>
              ${log}
            </table>
            ${this.renderPoll()}
            <p class="kv-88-row">${buttons}</p>
          </td>
        </tr>
      </table>`;
  }

  gameVersion(H) {
    const m = /v(\d+\.\d+)/.exec((H.BRAND && H.BRAND.disc) || '');
    return m ? m[1] : '';
  }

  banners(H) {
    const rows = [];
    for (const [key, b] of Object.entries(H.BANNERS || {})) {
      const stars = b.stars ? Object.entries(b.stars) : [];
      if (stars.some(([, s]) => s.cone)) continue;
      const five = b.featured ? b.featured : stars.map(([id]) => id);
      if (!five.length) continue;
      const four = b.featured ? null : [...new Set(stars.flatMap(([, s]) => s.four || []))].filter(id => H.CHARS[id]);
      const item = H.ITEMS && H.ITEMS[b.pass];
      rows.push({ key, name: b.name, kind: b.kind, pass: item ? item.name : b.pass, five, four });
    }
    return rows;
  }

  renderBanners(H) {
    const rows = this.banners(H).map(r => `
      <tr>
        <td><b>${this.esc(r.name)}</b>${r.kind !== r.name ? `<br><span class="kv-small">${this.esc(r.kind)}</span>` : ''}</td>
        <td>${this.esc(r.pass)}</td>
        <td>${r.five.map(id => this.esc(this.charName(id))).join(', ')}</td>
        <td>${r.four ? r.four.map(id => this.esc(this.charName(id))).join(', ') : 'все четвёрки стандартного набора'}</td>
      </tr>`).join('');
    return `
      <table class="kv-grid" width="100%" cellspacing="0" cellpadding="3">
        <tr><th>Прыжок</th><th>Валюта</th><th>5 ${this.gif('star', 1, 'звёзд')}</th><th>4 ${this.gif('star', 1, 'звезды')}</th></tr>
        ${rows}
      </table>`;
  }

  leaders() {
    const R = this.bench(), K = this.hsrData();
    if (!R || !K) return [];
    return K.COLUMNS.map(col => {
      const sc = R.scores.hall.sig[col.id] || {};
      const top = Object.keys(sc).sort((a, b) => sc[b] - sc[a])[0];
      return top ? { col, id: top, tier: R.tiers.hall.sig[col.id][top] } : null;
    }).filter(Boolean);
  }

  tierName(id) {
    const t = this.hsrData().TIERS.find(x => x.id === id);
    return t ? t.name : id;
  }

  renderHub() {
    const H = this.game();
    const d = this.data();
    if (!H) {
      return `
        <h1 class="kv-h1">Star Rail 98</h1>
        <p class="kv-warn">${this.gif('warn')} Данные игры недоступны, поэтому палуба пуста. Загляните на <a data-url="http://hsr.hoyoverse.com">официальный сайт игры</a>.</p>`;
    }
    const hatches = d.hatches.map(h => `
      <td class="kv-hatch" width="25%" valign="top">
        ${this.gif(h.gif, 2)}<br>
        <b>${this.link(h.path, this.esc(h.title))}</b><br>
        <span class="kv-small">${this.esc(h.text)}</span>
      </td>`);
    const starters = d.starters.map(s => `<li>${this.link(s.path, this.esc(s.title))}</li>`).join('');
    const leaders = this.leaders().map(l => `
      <td class="kv-leader" width="25%" align="center" valign="top">
        ${this.link('/hsr98/char?id=' + l.id, this.art('bust:' + l.id, 56, this.charName(l.id)))}<br>
        <span class="kv-small">${this.esc(l.col.name)}</span><br>
        <b>${this.esc(this.charName(l.id))}</b> <span class="kv-tier kv-tier-${l.tier}">${this.tierName(l.tier)}</span>
      </td>`).join('');
    const nChars = Object.keys(H.CHARS).length;
    const nFus = Object.keys(H.FUSIONS || {}).length;
    const ver = this.gameVersion(H);
    return `
      <table class="kv-hub-head" width="100%" cellspacing="0" cellpadding="6">
        <tr>
          <td><h1 class="kv-h1">Палуба: Star Rail 98</h1>
          <span class="kv-small">Данные игры: версия ${this.esc(ver)}, персонажей ${nChars}, Слияний ${nFus}. Тир-лист пересчитан ${d.updated}.</span></td>
        </tr>
      </table>
      <table class="kv-hatches" width="100%" cellspacing="6" cellpadding="8">
        <tr>${hatches.slice(0, 4).join('')}</tr>
        <tr>${hatches.slice(4).join('')}</tr>
      </table>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="300" valign="top" class="kv-hub-left">
            <table class="kv-box" width="100%" cellspacing="0" cellpadding="4">
              <tr><th class="kv-box-head">С чего начать</th></tr>
              <tr><td><ul class="kv-list">${starters}</ul></td></tr>
            </table>
            <table class="kv-box" width="100%" cellspacing="0" cellpadding="4">
              <tr><th class="kv-box-head">Где взять игру</th></tr>
              <tr><td>Игра бесплатная. В неё можно играть прямо в браузере или поставить на Android, всё есть на <a data-url="http://hsr.hoyoverse.com">сайте игры</a>.<br>
              <button class="win-btn kv-btn" data-kv-steam="hsr98">Играть в браузере</button></td></tr>
            </table>
          </td>
          <td valign="top" class="kv-hub-right">
            <table class="kv-box" width="100%" cellspacing="0" cellpadding="4">
              <tr><th class="kv-box-head">Лучшие в Зале забвения по нашим замерам</th></tr>
              <tr><td><table width="100%" cellspacing="0" cellpadding="4"><tr>${leaders}</tr></table>
              <span class="kv-small">Полная таблица в ${this.link('/hsr98/tier', 'тир-листе')}.</span></td></tr>
            </table>
          </td>
        </tr>
      </table>
      <h2 class="kv-h2">Сейчас в Прыжках</h2>
      ${this.renderBanners(H)}`;
  }

  tierQuery(params) {
    const K = this.hsrData();
    const H = this.game();
    const mode = K.MODES.some(m => m.id === params.mode) ? params.mode : 'hall';
    const cone = params.cone === 'std' ? 'std' : 'sig';
    const rar = ['4', '5'].includes(params.rar) ? params.rar : '';
    const path = H && H.PATHS[params.path] ? params.path : '';
    const free = params.free === '1' ? '1' : '';
    const mine = params.mine === '1' && this.hasCrew() ? '1' : '';
    return { mode, cone, rar, path, free, mine };
  }

  hasCrew() {
    return typeof this.myCrew === 'function' && !!this.myCrew();
  }

  ownsChar(id) {
    return typeof this.owns === 'function' && this.owns(id);
  }

  tierHref(q) {
    const parts = [];
    if (q.mode && q.mode !== 'hall') parts.push('mode=' + q.mode);
    if (q.cone === 'std') parts.push('cone=std');
    if (q.rar) parts.push('rar=' + q.rar);
    if (q.path) parts.push('path=' + q.path);
    if (q.free) parts.push('free=1');
    if (q.mine) parts.push('mine=1');
    return '/hsr98/tier' + (parts.length ? '?' + parts.join('&') : '');
  }

  placement(mode, cone, col) {
    const R = this.bench(), K = this.hsrData();
    const order = K.TIERS.map(t => t.id);
    const out = {};
    for (const [id, tier] of Object.entries(R.tiers[mode][cone][col])) {
      const adj = K.ADJUST.find(a => a.id === id && a.mode === mode && a.col === col);
      const i = order.indexOf(tier);
      out[id] = adj ? order[Math.max(0, Math.min(order.length - 1, i - adj.shift))] : tier;
    }
    return out;
  }

  tagsFor(id) {
    const R = this.bench(), K = this.hsrData();
    const sp = R.chars[id] && R.chars[id].sp ? R.chars[id].sp.turn : 0;
    const list = [];
    if (sp >= K.SP_TAG.plus) list.push('spp');
    else if (sp <= K.SP_TAG.minus) list.push('spm');
    return list.concat(K.CHARS[id].tags || []).slice(0, 3);
  }

  cardName(id) {
    const H = this.game();
    if (id === 'trail' || id === 'trail_p') return 'Первопроходец';
    return H.CHARS[id].short || H.CHARS[id].name;
  }

  num(v, digits = 1) {
    return String(Math.round(v * Math.pow(10, digits)) / Math.pow(10, digits)).replace('.', ',');
  }

  metricText(id, col, mode, cone) {
    const c = this.bench().chars[id];
    if (mode === 'start') return c.start ? `Начало игры: побед ${Math.round(100 * c.start.win)}%, ${this.num(c.start.cyc)} цикла на пять боссов` : '';
    if (col === 'dps') {
      if (mode === 'su') { const s = c.su && c.su[cone]; return s ? `Вселенная: побед ${Math.round(100 * s.win)}% с лучшим отрядом` : ''; }
      const t = c.teams.best[cone][mode];
      const team = t.team.slice(1).map(x => this.charName(x)).join(', ');
      return `${mode === 'hall' ? 'Зал' : 'Боссы'}: ${this.num(t[mode].cyc)} цикла, доля урона ${Math.round(100 * t[mode].share)}%. Отряд: ${team}`;
    }
    if (mode === 'su') return c.suUp ? `Вселенная: побед ${Math.round(100 * c.suUp[cone].win)}% в опорных отрядах` : '';
    const up = c.up ? c.up[cone][mode] : 0;
    const sv = col === 'sus' && c.survive ? `, выживание ${Math.round(100 * c.survive[cone].win)}% побед` : '';
    return `Вклад четвёртого: ${up >= 0 ? '+' : ''}${Math.round(100 * up)}% скорости${sv}`;
  }

  renderCard(id, col, mode, cone) {
    const H = this.game(), K = this.hsrData();
    const c = H.CHARS[id];
    const tags = this.tagsFor(id).map(t => `<span class="kv-tg kv-tg-${K.TAGS[t].kind}" title="${this.esc(K.TAGS[t].text)}">${this.esc(K.TAGS[t].name)}</span>`).join(' ');
    const title = `${this.charName(id)}. ${this.metricText(id, col, mode, cone)}`;
    const adj = K.ADJUST.some(a => a.id === id && a.mode === mode && a.col === col) ? '<sup class="kv-adj" title="Поправка редакции, см. ниже">р</sup>' : '';
    const bot = K.BOT_NOTES[id] ? '<sup class="kv-adj" title="Бот играет хуже человека, см. ниже">б</sup>' : '';
    return `
      <span class="kv-card kv-r${c.rarity}${this.ownsChar(id) ? ' kv-card-mine' : ''}">
        <a data-url="${this.url('/hsr98/char?id=' + id)}" title="${this.esc(title)}">${this.art('card:' + id, 56, title)}</a>
        <span class="kv-card-name${this.cardName(id).length > 10 ? ' kv-long' : ''}">${this.esc(this.cardName(id))}${adj}${bot}</span>
        <span class="kv-card-tags">${tags}</span>
      </span>`;
  }

  modeNote(mode) {
    const C = this.bench().conditions;
    const lvl = 'Уровень персонажей равен уровню врагов, реликвии +' + C.relic + '.';
    if (mode === 'hall') return `Этапы ${C.hall.stages[0]}–${C.hall.stages[C.hall.stages.length - 1]} Зала забвения, все бои одним отрядом, ${C.seeds} прогонов на бой. ${lvl}`;
    if (mode === 'boss') return `Пять сюжетных боссов, HP ×${C.boss.hp} и атака ×${C.boss.atk}, ${C.seeds} прогонов на бой. ${lvl}`;
    if (mode === 'su') return `Мир ${C.su.world} Виртуальной вселенной целиком, HP и атака врагов ×${this.num(C.su.hp)}, ${C.su.seeds} забега. Персонажи ${C.su.lvl} уровня.`;
    return `Ранние сюжетные боссы: реликвии по уровню, у всех конусы 3 звёзд, HP ×${C.start.hp}, атака ×${this.num(C.start.atk)}. Бесплатные персонажи получают небольшую надбавку.`;
  }

  renderTier(route) {
    const H = this.game(), K = this.hsrData(), R = this.bench();
    if (!H || !R) return `<h1 class="kv-h1">Тир-лист</h1><p class="kv-warn">${this.gif('warn')} Данные игры или замеров недоступны.</p>`;
    const q = this.tierQuery(route.params);
    const pass = id => {
      const c = H.CHARS[id];
      return (!q.rar || String(c.rarity) === q.rar) && (!q.path || c.path === q.path) && (!q.free || K.FREE.includes(id)) && (!q.mine || this.ownsChar(id));
    };
    const tabs = K.MODES.map(m => m.id === q.mode
      ? `<td class="kv-tab kv-tab-on">${this.esc(m.name)}</td>`
      : `<td class="kv-tab">${this.link(this.tierHref(Object.assign({}, q, { mode: m.id })), this.esc(m.name))}</td>`).join('');
    const coneLink = (cone, label) => q.cone === cone
      ? `<b>&#9658; ${label}</b>`
      : this.link(this.tierHref(Object.assign({}, q, { cone })), label);
    const coneRow = q.mode === 'start'
      ? '<span class="kv-small">В этом режиме у всех конусы 3 звёзд, переключатель не действует.</span>'
      : `${coneLink('sig', 'с сигнатурным конусом')} &nbsp;|&nbsp; ${coneLink('std', 'без сигнатурного, лучший 4 звезды своего Пути')}`;
    const opt = (val, label, cur) => `<option value="${val}"${val === cur ? ' selected' : ''}>${this.esc(label)}</option>`;
    const paths = Object.keys(H.PATHS).filter(p => Object.values(H.CHARS).some(c => c.path === p));
    const form = `
      Редкость: <select class="kv-sel" data-kv-f="rar">${opt('', 'все', q.rar)}${opt('5', '5 звёзд', q.rar)}${opt('4', '4 звезды', q.rar)}</select>
      Путь: <select class="kv-sel" data-kv-f="path">${opt('', 'все', q.path)}${paths.map(p => opt(p, H.PATHS[p].name, q.path)).join('')}</select>
      <label><input type="checkbox" data-kv-f="free"${q.free ? ' checked' : ''}> только бесплатные</label>
      ${this.hasCrew() ? `<label><input type="checkbox" data-kv-f="mine"${q.mine ? ' checked' : ''}> только мой экипаж</label> <span class="kv-small">(зелёная рамка: ${this.link('/hsr98/mycrew', 'ваш экипаж')})</span>` : ''}
      <button class="win-btn kv-btn" data-kv-filter="1">OK</button>
      ${q.rar || q.path || q.free || q.mine ? this.link(this.tierHref({ mode: q.mode, cone: q.cone }), 'сбросить') : ''}`;
    const cones = q.mode === 'start' ? 'sig' : q.cone;
    const place = Object.fromEntries(K.COLUMNS.map(col => [col.id, this.placement(q.mode, cones, col.id)]));
    const scores = R.scores[q.mode][cones];
    const bands = { T0: 'Вершина', T1: 'Крепкие', T2: 'Рабочие', T3: 'Ниша' };
    let shown = 0;
    const rows = K.TIERS.map(t => {
      const cells = K.COLUMNS.map(col => {
        const ids = Object.keys(place[col.id]).filter(id => place[col.id][id] === t.id && pass(id)).sort((a, b) => scores[col.id][b] - scores[col.id][a]);
        shown += ids.length;
        return `<td class="kv-tier-cell">${ids.map(id => this.renderCard(id, col.id, q.mode, cones)).join('')}</td>`;
      }).join('');
      const band = bands[t.id] ? `<tr><td colspan="${K.COLUMNS.length + 1}" class="kv-band">&#9660; ${bands[t.id]} &#9660;</td></tr>` : '';
      return `${band}<tr><th scope="row" class="kv-tl kv-tier-${t.id}">${t.name}</th>${cells}</tr>`;
    }).join('');
    const empty = shown ? '' : `<tr><td colspan="${K.COLUMNS.length + 1}" class="kv-empty">Никого не нашлось. ${this.link(this.tierHref({ mode: q.mode, cone: q.cone }), 'Сбросить фильтр')}</td></tr>`;
    const used = new Set();
    for (const col of K.COLUMNS) for (const id of Object.keys(place[col.id])) if (pass(id)) this.tagsFor(id).forEach(x => used.add(x));
    const legend = Object.keys(K.TAGS).filter(x => used.has(x)).map(x => `<tr><td><span class="kv-tg kv-tg-${K.TAGS[x].kind}">${this.esc(K.TAGS[x].name)}</span></td><td>${this.esc(K.TAGS[x].text)}</td></tr>`).join('');
    const tiers = K.TIERS.map((t, i) => `<tr><td><span class="kv-tier kv-tier-${t.id}">${t.name}</span></td><td>${i === K.TIERS.length - 1 ? 'ниже ' + Math.round(100 * K.TIERS[i - 1].min) + '%' : 'не меньше ' + Math.round(100 * t.min) + '%'} от лидера колонки</td></tr>`).join('');
    const adj = K.ADJUST.filter(a => a.mode === q.mode).map(a => `<li><b>${this.esc(this.charName(a.id))}</b> поднят на шаг: ${this.esc(a.reason)}</li>`).join('');
    const bot = Object.entries(K.BOT_NOTES).map(([id, text]) => `<li>${this.link('/hsr98/char?id=' + id, this.esc(this.charName(id)))}: ${this.esc(text)}</li>`).join('');
    const log = K.TIER_LOG.map(e => `<tr><td class="kv-log-date">${e.date}</td><td>${this.esc(e.text)}</td></tr>`).join('');
    const head = K.COLUMNS.map(c => `<th scope="col" class="kv-colhead">${this.esc(c.name)}</th>`).join('');
    return `
      <h1 class="kv-h1">Тир-лист Star Rail 98</h1>
      <p class="kv-small">Версия игры ${this.esc(this.gameVersion(H))}, пересчитан ${this.data().updated}. Наведите мышь на портрет: там цифры замера и отряд. Щелчок открывает личное дело.</p>
      <table class="kv-tabs" cellspacing="0" cellpadding="0"><tr>${tabs}</tr></table>
      <table class="kv-ctl" width="100%" cellspacing="0" cellpadding="4">
        <tr><td><b>Режим:</b> ${this.esc(this.modeNote(q.mode))}</td></tr>
        <tr><td><b>Конус:</b> ${coneRow}</td></tr>
        <tr><td>${form}</td></tr>
      </table>
      <table class="kv-tiers" width="100%" cellspacing="0" cellpadding="0">
        <tr><th class="kv-tl kv-tl-head" scope="col">Тир</th>${head}</tr>
        ${rows}${empty}
      </table>
      <table width="100%" cellspacing="0" cellpadding="0" class="kv-legend-wrap">
        <tr>
          <td valign="top" width="50%">
            <table class="kv-box" width="100%" cellspacing="0" cellpadding="3">
              <tr><th class="kv-box-head" colspan="2">Метки</th></tr>${legend}
            </table>
            <table class="kv-box" width="100%" cellspacing="0" cellpadding="3">
              <tr><th class="kv-box-head" colspan="2">Что значит тир</th></tr>${tiers}
            </table>
          </td>
          <td valign="top" class="kv-legend-right">
            <table class="kv-box" width="100%" cellspacing="0" cellpadding="4">
              <tr><th class="kv-box-head">Как мы считали</th></tr>
              <tr><td>Каждого персонажа гоняем через одни и те же бои настоящим движком игры. Бойцу «Урона» стенд сам подбирает лучший отряд из «Усиления» и «Выживания». Для остальных считаем, насколько быстрее с ними проходят бои три опорных отряда. Тир показывает долю от лидера колонки. Подробно ${this.link('/about', 'в разделе «О сайте»')}.</td></tr>
            </table>
            ${adj ? `<table class="kv-box" width="100%" cellspacing="0" cellpadding="4"><tr><th class="kv-box-head">Поправки редакции <sup>р</sup></th></tr><tr><td><ul class="kv-list">${adj}</ul></td></tr></table>` : ''}
            <table class="kv-box" width="100%" cellspacing="0" cellpadding="4">
              <tr><th class="kv-box-head">Где бот играет хуже человека <sup>б</sup></th></tr>
              <tr><td><ul class="kv-list">${bot}</ul></td></tr>
            </table>
          </td>
        </tr>
      </table>
      <table class="kv-log" width="100%" cellspacing="0" cellpadding="4">
        <tr><th colspan="2" class="kv-log-head">Что изменилось в тир-листе</th></tr>
        ${log}
      </table>`;
  }

  pct(v) {
    return this.num(v * 100, 0) + '%';
  }

  elemWord(e) {
    const H = this.game();
    return H.ELEMENTS[e] ? H.ELEMENTS[e].name.toLowerCase() : '';
  }

  statText(s, v) {
    const p = this.pct(Math.abs(v)), sign = v < 0 ? '−' : '+';
    const words = { atkP: 'атака', dmgP: 'урон', spdP: 'скорость', critD: 'крит. урон', critR: 'шанс крита', defP: 'защита', breakEff: 'урон по стойкости', iceP: 'ледяной урон', fireP: 'огненный урон', elecP: 'урон молнией', windP: 'урон ветром', quantP: 'квантовый урон', imagP: 'мнимый урон', physP: 'физический урон' };
    if (s === 'spd') return `скорость ${sign}${Math.abs(v)}`;
    if (s === 'dr') return `получаемый урон −${p}`;
    if (s === 'resPen') return `игнор ${p} сопротивления`;
    if (s === 'defDown') return `защита −${p}`;
    if (s === 'resDown') return `сопротивление −${p}`;
    if (s === 'dotVuln') return `урон со временем по цели +${p}`;
    return words[s] ? `${words[s]} ${sign}${p}` : '';
  }

  whoWord(who) {
    return who === 'allies' ? 'всему отряду' : who === 'self' ? 'себе' : who === 'target' ? 'союзнику' : '';
  }

  describeFx(c, f) {
    const H = this.game();
    const chance = f.chance != null && f.chance < 1 ? ` (шанс ${this.pct(f.chance)})` : '';
    const turns = f.turns ? ` на ${f.turns} ${f.turns === 1 ? 'ход' : 'хода'}` : '';
    switch (f.k) {
      case 'dmg': {
        const parts = [];
        if (f.m) parts.push(`${f.hits ? f.hits + ' × ' : ''}${this.pct(f.m)} атаки`);
        if (f.hpM) parts.push(`${this.pct(f.hpM)} макс. HP`);
        if (f.plusDef) parts.push(`${this.pct(f.plusDef)} защиты`);
        let t = `${this.elemWord(f.e || c.elem)} урон ${parts.join(' + ')}`;
        if (f.adj) t += `, соседям ${this.pct(f.adj)}`;
        if (f.anyTough) t += ', снимает стойкость без уязвимости';
        return t;
      }
      case 'heal': return `лечение ${this.pct(f.m)} HP ${this.whoWord(f.who) || 'союзнику'}`.trim();
      case 'hot': return `лечение ${this.pct(f.m)} HP каждый ход${turns}`;
      case 'shield': return `щит ${this.pct(f.m)} защиты ${this.whoWord(f.who) || 'союзнику'}${turns}`.trim();
      case 'buff': {
        if (f.quiet) return '';
        const st = this.statText(f.s, f.v);
        return st ? `${st} ${this.whoWord(f.who)}${turns}`.replace(/\s+/g, ' ').trim() : (f.name ? `«${f.name}»${turns}` : '');
      }
      case 'debuff': return `${f.name || this.statText(f.s, f.v)}${turns}${chance}`;
      case 'dot': return `${H.DOT_NAME[f.type] || 'урон со временем'} ${this.pct(f.m)} атаки${turns}${chance}`;
      case 'freeze': return `Заморозка${chance}`;
      case 'imprison': return 'Заточение';
      case 'taunt': return `провокация${turns}`;
      case 'advance': return f.who === 'self' ? `ход на ${this.pct(f.v)} раньше` : `союзник ходит на ${this.pct(f.v)} раньше`;
      case 'delay': return `враг ходит на ${this.pct(f.v)} позже`;
      case 'cleanse': return 'снимает ослабление';
      case 'cleanseAll': return 'снимает ослабления со всех';
      case 'dispel': return 'снимает усиление врага';
      case 'energy': return `+${f.v} энергии`;
      case 'selfCost': return `тратит ${this.pct(f.hpP)} HP`;
      case 'hpCost': return `тратит ${this.pct(f.v)} HP`;
      case 'extendDots': return `продлевает ${H.DOT_NAME[f.type] || 'урон со временем'}`;
      default: return '';
    }
  }

  describeAbility(c, ab) {
    if (!ab) return '';
    const TARGETS = { single: 'Одна цель', blast: 'Цель и соседи', all: 'Все враги', bounce: 'Отскоки по случайным врагам', ally: 'Союзник', allies: 'Весь отряд', self: 'На себя' };
    if (ab.text) return ab.text.charAt(0).toUpperCase() + ab.text.slice(1);
    const parts = (ab.fx || []).map(f => this.describeFx(c, f)).filter(Boolean);
    const words = [...new Set(parts)];
    return `${TARGETS[ab.target] || ''}${words.length ? ': ' + words.join(', ') : ''}.`;
  }

  abilityRows(id) {
    const H = this.game();
    const c = H.CHARS[id];
    const rows = [];
    const add = (label, ab, cost) => { if (ab) rows.push([label, ab.name, this.describeAbility(c, ab), cost || '']); };
    add('Базовая атака', c.basic, '+1 очко навыка');
    if (c.skills && c.skills.length > 1) c.skills.forEach((s, i) => add(i ? 'Навык, вариант ' + (i + 1) : 'Навык', s, s.noSp ? 'без очков навыка' : '−1 очко навыка'));
    else add('Навык', c.skill, c.skill.noSp ? 'без очков навыка, тратит HP' : c.skill.keepTurn ? '−1 очко навыка, ход не кончается' : '−1 очко навыка');
    add('Усиленная атака', c.enhanced, c.enhanced && c.enhanced.energy ? '+' + c.enhanced.energy + ' энергии' : '');
    for (const [k, label] of [['nbasic', 'Атака в Кошмаре'], ['nskill', 'Навык в Кошмаре'], ['arrow', 'Особая стрела'], ['pbasic', 'Атака Защитницы'], ['pskill', 'Навык Защитницы'], ['cue', 'Ход Гекаты']]) add(label, c[k], '');
    if (Array.isArray(c.charged)) c.charged.forEach(ch => add('Заряженная атака ' + ch.lv, ch, ''));
    add('Абсолютная техника', c.ult, c.energy ? c.energy + ' энергии' : 'по нотам');
    if (c.talent) rows.push(['Талант', '', c.talent, '']);
    if (c.link) rows.push(['Связь', c.link.name, c.link.text, '']);
    if (c.tech) rows.push(['Техника на карте', c.tech.name, c.tech.text, '']);
    return rows;
  }

  sources(id) {
    const H = this.game(), K = this.hsrData();
    const own = [], pool = [], other = [];
    if (K.SOURCE[id]) own.push(K.SOURCE[id]);
    for (const b of Object.values(H.BANNERS)) {
      const pass = H.ITEMS[b.pass] ? H.ITEMS[b.pass].name : b.pass;
      if (b.featured && b.featured.includes(id)) own.push(`${b.name}, 5 звёзд (${pass})`);
      if (b.stars && b.stars[id] && !b.stars[id].cone) own.push(`${b.name}: «${b.stars[id].name || b.name}» (${pass})`);
      if (b.stars && Object.values(b.stars).some(s => !s.cone && (s.four || []).includes(id))) other.push(`${b.name}, 4 звезды (${pass})`);
      if ((b.extra4 || []).includes(id)) other.push(`${b.name}, 4 звезды вне ставки (${pass})`);
    }
    if (H.WARP_POOL.four.includes(id)) pool.push(`${H.BANNERS.std.name}, стандартный набор 4 звёзд`);
    return [...new Set(own.concat(pool, other))];
  }

  coneSources(cid) {
    const H = this.game();
    const out = [];
    for (const b of Object.values(H.BANNERS)) {
      for (const s of Object.values(b.stars || {})) {
        if (s.cone === cid) out.push(`${b.name}: «${(s.title || []).filter(Boolean).join(' ')}»`);
        if ((s.four || []).includes('cone:' + cid)) out.push(b.name);
      }
    }
    if (['five', 'four', 'three'].some(k => H.WARP_POOL[k].includes('cone:' + cid))) out.push(H.BANNERS.std.name);
    for (const shop of Object.values(H.SHOPS)) for (const it of shop.items) {
      const [kind, x, price] = String(it).split(':');
      if (kind === 'cone' && x === cid) out.push(`${shop.name} за ${price} кредитов`);
    }
    if (H.CONES[cid] && H.CONES[cid].shop) out.push('Пассаж Световых конусов в Зале забвения');
    return [...new Set(out)];
  }

  primaryCol(id) {
    return this.hsrData().CHARS[id].cols[0];
  }

  crewQuery(params) {
    const H = this.game(), K = this.hsrData();
    const t = this.tierQuery(params);
    const elem = H && H.ELEMENTS[params.elem] ? params.elem : '';
    const role = K.COLUMNS.some(c => c.id === params.role) ? params.role : '';
    const sort = ['name', 'rar', 'path', 'elem', 'tier'].includes(params.sort) ? params.sort : 'name';
    return { rar: t.rar, path: t.path, free: t.free, elem, role, sort };
  }

  crewHref(q) {
    const parts = ['rar', 'path', 'elem', 'role', 'free'].filter(k => q[k]).map(k => k + '=' + q[k]);
    if (q.sort && q.sort !== 'name') parts.push('sort=' + q.sort);
    return '/hsr98/crew' + (parts.length ? '?' + parts.join('&') : '');
  }

  renderCrew(route) {
    const H = this.game(), K = this.hsrData();
    if (!H || !this.bench()) return `<h1 class="kv-h1">Экипаж</h1><p class="kv-warn">${this.gif('warn')} Данные игры недоступны.</p>`;
    const q = this.crewQuery(route.params);
    const order = K.TIERS.map(t => t.id);
    const tierOf = id => this.placement('hall', 'sig', this.primaryCol(id))[id];
    const ids = Object.keys(H.CHARS).filter(id => {
      const c = H.CHARS[id];
      return (!q.rar || String(c.rarity) === q.rar) && (!q.path || c.path === q.path) && (!q.elem || c.elem === q.elem)
        && (!q.role || K.CHARS[id].cols.includes(q.role)) && (!q.free || K.FREE.includes(id));
    });
    const by = {
      name: (a, b) => this.charName(a).localeCompare(this.charName(b), 'ru'),
      rar: (a, b) => H.CHARS[b].rarity - H.CHARS[a].rarity,
      path: (a, b) => H.PATHS[H.CHARS[a].path].name.localeCompare(H.PATHS[H.CHARS[b].path].name, 'ru'),
      elem: (a, b) => H.ELEMENTS[H.CHARS[a].elem].name.localeCompare(H.ELEMENTS[H.CHARS[b].elem].name, 'ru'),
      tier: (a, b) => order.indexOf(tierOf(a)) - order.indexOf(tierOf(b))
    };
    ids.sort((a, b) => by[q.sort](a, b) || by.name(a, b));
    const opt = (val, label, cur) => `<option value="${val}"${val === cur ? ' selected' : ''}>${this.esc(label)}</option>`;
    const used = key => Object.keys(H[key]).filter(k => Object.values(H.CHARS).some(c => (key === 'PATHS' ? c.path : c.elem) === k));
    const head = [['', ''], ['name', 'Имя'], ['rar', 'Звёзды'], ['path', 'Путь'], ['elem', 'Стихия'], ['', 'Роль'], ['', 'Где взять'], ['tier', 'Тир в Зале']].map(([k, label]) => {
      if (!k) return `<th scope="col">${label}</th>`;
      return `<th scope="col">${q.sort === k ? '&#9660; ' + label : this.link(this.crewHref(Object.assign({}, q, { sort: k })), label)}</th>`;
    }).join('');
    const rows = ids.map(id => {
      const c = H.CHARS[id];
      const src = K.FREE.includes(id) ? 'бесплатно' : (this.sources(id)[0] || '').split(':')[0].split(',')[0];
      const cols = K.CHARS[id].cols.map(x => K.COLUMNS.find(y => y.id === x).name).join(', ');
      const t = tierOf(id);
      return `
        <tr>
          <td class="kv-crew-pic${this.ownsChar(id) ? ' kv-crew-mine' : ''}">${this.link('/hsr98/char?id=' + id, this.art('bust:' + id, 32, this.charName(id)))}</td>
          <td><b>${this.link('/hsr98/char?id=' + id, this.esc(this.charName(id)))}</b></td>
          <td>${c.rarity}</td>
          <td>${this.esc(H.PATHS[c.path].name)}</td>
          <td>${this.esc(H.ELEMENTS[c.elem].name)}</td>
          <td>${this.esc(cols)}</td>
          <td>${this.esc(src)}</td>
          <td><span class="kv-tier kv-tier-${t}">${this.tierName(t)}</span></td>
        </tr>`;
    }).join('');
    const filtered = q.rar || q.path || q.elem || q.role || q.free;
    return `
      <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; Экипаж</p>
      <h1 class="kv-h1">Экипаж: все персонажи SR98</h1>
      <table class="kv-ctl" width="100%" cellspacing="0" cellpadding="4">
        <tr><td>
          Звёзды: <select class="kv-sel" data-kv-c="rar">${opt('', 'все', q.rar)}${opt('5', '5', q.rar)}${opt('4', '4', q.rar)}</select>
          Путь: <select class="kv-sel" data-kv-c="path">${opt('', 'все', q.path)}${used('PATHS').map(p => opt(p, H.PATHS[p].name, q.path)).join('')}</select>
          Стихия: <select class="kv-sel" data-kv-c="elem">${opt('', 'все', q.elem)}${used('ELEMENTS').map(e => opt(e, H.ELEMENTS[e].name, q.elem)).join('')}</select>
          Роль: <select class="kv-sel" data-kv-c="role">${opt('', 'все', q.role)}${K.COLUMNS.map(c => opt(c.id, c.name, q.role)).join('')}</select>
          <label><input type="checkbox" data-kv-c="free"${q.free ? ' checked' : ''}> бесплатные</label>
          <button class="win-btn kv-btn" data-kv-crew="1">Показать</button>
          ${filtered ? this.link(this.crewHref({ sort: q.sort }), 'сбросить') : ''}
        </td></tr>
        <tr><td>Найдено: <b>${ids.length}</b> из ${Object.keys(H.CHARS).length}. Тир взят из Зала забвения с сигнатурными конусами, для основной роли персонажа.</td></tr>
      </table>
      <table class="kv-grid kv-crew-table" width="100%" cellspacing="0" cellpadding="3">
        <tr>${head}</tr>
        ${rows || `<tr><td colspan="8" class="kv-empty">Никого не нашлось. ${this.link(this.crewHref({ sort: q.sort }), 'Сбросить фильтр')}</td></tr>`}
      </table>`;
  }

  charChip(id) {
    return `<span class="kv-chip${this.cardName(id).length > 10 ? ' kv-long' : ''}">${this.link('/hsr98/char?id=' + id, this.art('bust:' + id, 32, this.charName(id)))}<br>${this.link('/hsr98/char?id=' + id, this.esc(this.cardName(id)))}</span>`;
  }

  teamRow(label, t, mode) {
    if (!t) return '';
    const m = t[mode];
    return `<tr><td class="kv-team-label">${this.esc(label)}</td><td>${t.team.slice(1).map(x => this.charChip(x)).join('')}</td><td class="kv-num">${this.num(m.cyc)}</td><td class="kv-num">${Math.round(100 * m.share)}%</td></tr>`;
  }

  favouredBy(id) {
    const R = this.bench();
    const count = {};
    for (const [carry, c] of Object.entries(R.chars)) {
      if (!c.teams) continue;
      for (const mode of ['hall', 'boss']) if (c.teams.best.sig[mode].team.slice(1).includes(id)) count[carry] = (count[carry] || 0) + 1;
    }
    return Object.keys(count).sort((a, b) => count[b] - count[a] || this.charName(a).localeCompare(this.charName(b), 'ru'));
  }

  neighbours(id) {
    const R = this.bench(), col = this.primaryCol(id);
    const sc = R.scores.hall.sig[col];
    return Object.keys(sc).filter(x => x !== id).sort((a, b) => Math.abs(sc[a] - sc[id]) - Math.abs(sc[b] - sc[id])).slice(0, 3);
  }

  contactInfo(id) {
    const H = this.game();
    const c = H.CHARS[id];
    return (c.contact || []).map(a => {
      const fams = Object.values(H.CONTACT).filter(f => ['happy', 'eager'].includes(f.react[a.tag])).map(f => f.name);
      const angry = Object.values(H.CONTACT).filter(f => f.react[a.tag] === 'angry').map(f => f.name);
      return { name: a.name, good: fams, bad: angry };
    });
  }

  renderBuild(id) {
    const H = this.game(), K = this.hsrData(), R = this.bench();
    const c = H.CHARS[id], kc = K.CHARS[id], p = K.PRESETS[kc.build];
    const sig = Object.keys(H.CONES).find(k => H.CONES[k].sig === id);
    const std = K.STD_CONE[c.path], early = K.EARLY_CONE[c.path];
    const coneRow = (cid, label) => {
      const d = H.CONES[cid];
      if (!d) return '';
      const src = this.coneSources(cid);
      return `<tr><td class="kv-team-label">${label}</td><td><b>${this.esc(d.name)}</b> (${d.rarity} зв.)<br>${this.esc(d.text)}${src.length ? `<br><span class="kv-small">Где взять: ${this.esc(src.join('; '))}</span>` : ''}</td></tr>`;
    };
    const set = p.set === 'elem' ? K.ELEM_SET[c.elem] : p.set;
    const sphere = p.sphere === 'elem' ? c.elem + 'P' : p.sphere;
    const rs = H.RELIC_SETS[set], pl = H.RELIC_SETS[p.planar];
    const bonus = Object.entries(rs.bonus).map(([s, v]) => `${H.STAT_NAMES[s] || s} +${this.pct(v)}`).join(', ');
    const twice = Object.entries(rs.bonus).map(([s, v]) => `${H.STAT_NAMES[s] || s} +${this.pct(2 * v)}`).join(', ');
    const mains = [['Тело', p.body], ['Ноги', p.feet], ['Сфера', sphere], ['Вязь', p.rope]].map(([slot, m]) => `<tr><td>${slot}</td><td>${this.esc(H.STAT_NAMES[m] || m)}</td></tr>`).join('');
    const goal = p.planar === 'salsotto' ? 'шанс крита 50% для «Замершего Салсотто»' : 'скорость 120 для второго бонуса набора';
    let diff = '';
    if (sig && R.chars[id].teams) {
      const a = R.chars[id].teams.best.sig.hall.hall.cyc, b = R.chars[id].teams.best.std.hall.hall.cyc;
      diff = `<p>В Зале отряд с «${this.esc(H.CONES[sig].name)}» проходит пять этапов за ${this.num(a)} цикла, с «${this.esc(H.CONES[std].name)}» за ${this.num(b)}.</p>`;
    }
    return `
      <table class="kv-grid" width="100%" cellspacing="0" cellpadding="4">
        <tr><th colspan="2">Световой конус</th></tr>
        ${sig ? coneRow(sig, 'Лучший') : ''}
        ${coneRow(std, sig ? 'Без сигнатурного' : 'Лучший доступный')}
        ${coneRow(early, 'На первое время')}
      </table>
      ${diff}
      <table width="100%" cellspacing="0" cellpadding="0"><tr>
        <td valign="top" width="55%">
          <table class="kv-grid" width="100%" cellspacing="0" cellpadding="4">
            <tr><th colspan="2">Реликвии</th></tr>
            <tr><td class="kv-team-label">Пещера</td><td><b>${this.esc(rs.name)}</b>: 2 предмета ${this.esc(bonus)}, 4 предмета ${this.esc(twice)}</td></tr>
            <tr><td class="kv-team-label">Планарные</td><td><b>${this.esc(pl.name)}</b>: ${this.esc(pl.text || '')}</td></tr>
            <tr><td class="kv-team-label">Цель</td><td>${this.esc(goal)}</td></tr>
            <tr><td class="kv-team-label">Второстепенные</td><td>${p.subs.map(s => this.esc(H.STAT_NAMES[s] || s)).join(' &gt; ')}</td></tr>
          </table>
        </td>
        <td valign="top" class="kv-legend-right">
          <table class="kv-grid" width="100%" cellspacing="0" cellpadding="4">
            <tr><th colspan="2">Главные характеристики</th></tr>
            <tr><td>Голова</td><td>HP</td></tr><tr><td>Руки</td><td>Атака</td></tr>
            ${mains}
          </table>
        </td>
      </tr></table>`;
  }

  renderChar(route) {
    const H = this.game(), K = this.hsrData(), R = this.bench();
    const id = route.params.id;
    if (!H || !R) return `<h1 class="kv-h1">Личное дело</h1><p class="kv-warn">${this.gif('warn')} Данные игры недоступны.</p>`;
    const c = H.CHARS[id], kc = K.CHARS[id], rc = R.chars[id];
    const ids = Object.keys(H.CHARS), n = ids.indexOf(id);
    const prev = ids[(n - 1 + ids.length) % ids.length], next = ids[(n + 1) % ids.length];
    const guide = window.kovchegGuides && window.kovchegGuides[id];
    const stamps = K.MODES.map(m => `<tr><td>${this.esc(m.name)}</td>${kc.cols.map(col => { const t = this.placement(m.id, 'sig', col)[id]; return `<td><span class="kv-tier kv-tier-${t}">${this.tierName(t)}</span></td>`; }).join('')}</tr>`).join('');
    const colNames = kc.cols.map(x => K.COLUMNS.find(y => y.id === x).name);
    const tags = this.tagsFor(id).map(t => `<span class="kv-tg kv-tg-${K.TAGS[t].kind}" title="${this.esc(K.TAGS[t].text)}">${this.esc(K.TAGS[t].name)}</span>`).join(' ');
    const lvlMax = k => H.statAt(c.base[k], H.MAX_LVL);
    const sections = [];
    const sec = (key, title, body) => { if (body) sections.push({ key, title, body }); };
    if (guide && guide.short) sec('short', 'Коротко', `<p>${this.renderText(guide.short)}</p>`);
    if (guide && (guide.pros || guide.cons)) sec('pros', 'Сильные и слабые стороны', `<table width="100%" cellspacing="0" cellpadding="4"><tr><td valign="top" width="50%"><b>Сильные</b><ul class="kv-list">${(guide.pros || []).map(x => `<li>${this.renderText(x)}</li>`).join('')}</ul></td><td valign="top"><b>Слабые</b><ul class="kv-list">${(guide.cons || []).map(x => `<li>${this.renderText(x)}</li>`).join('')}</ul></td></tr></table>`);
    sec('skills', 'Умения', `<table class="kv-grid" width="100%" cellspacing="0" cellpadding="4"><tr><th>Что</th><th>Название и действие</th><th>Цена</th></tr>${this.abilityRows(id).map(([label, name, text, cost]) => `<tr><td class="kv-team-label">${this.esc(label)}</td><td>${name ? `<b>${this.esc(name)}</b><br>` : ''}${this.esc(text)}</td><td class="kv-small">${this.esc(cost)}</td></tr>`).join('')}</table>`);
    if (guide && guide.play) sec('play', 'Как играть', guide.play.map(x => `<p>${this.renderText(x)}</p>`).join(''));
    sec('build', 'Сборка', this.renderBuild(id));
    let teams = '';
    if (rc.teams) {
      const tb = (mode, title) => `
        <table class="kv-grid" width="100%" cellspacing="0" cellpadding="3">
          <tr><th>${title}</th><th>Отряд</th><th>Циклы</th><th>Доля урона</th></tr>
          ${this.teamRow('Лучший', rc.teams.best.sig[mode], mode)}
          ${this.teamRow('Без пятизвёздочных из событий', rc.teams.std.sig[mode], mode)}
          ${this.teamRow('Бесплатный', rc.teams.free.sig[mode], mode)}
        </table>`;
      teams = `<p class="kv-small">Отряды подобрал стенд, конусы сигнатурные. Циклы: в Зале сумма за этапы 11–15, на боссах сумма за пять боссов.</p>${tb('hall', 'Зал забвения')}${tb('boss', 'Боссы')}`;
    } else {
      const fav = this.favouredBy(id);
      teams = fav.length
        ? `<p>Стенд чаще всего брал ${this.esc(c.name)} в отряд к этим бойцам:</p><p>${fav.slice(0, 8).map(x => this.charChip(x)).join('')}</p>`
        : '<p>Стенд не взял этого персонажа ни в один лучший отряд бойцов. Его место там, где нужна именно его роль.</p>';
    }
    const inDb = K.TEAMS.filter(t => t.members.includes(id));
    if (inDb.length) teams += `<p><b>В судовой роли:</b> ${inDb.map(t => this.link('/hsr98/team?id=' + t.id, '«' + this.esc(t.name) + '»')).join(', ')}.</p>`;
    sec('teams', 'Отряды', teams);
    const fus = Object.values(H.FUSIONS).filter(f => f.members.includes(id));
    sec('fusions', 'Слияния', fus.length ? `<ul class="kv-list">${fus.map(f => `<li><b>«${this.esc(f.name)}»</b>. Вместе: ${f.members.filter(x => x !== id).map(x => this.link('/hsr98/char?id=' + x, this.esc(this.charName(x)))).join(', ')}. ${this.esc(f.text)}</li>`).join('')}</ul><p class="kv-small">Слияние доступно, когда у всех участников полная энергия, и обнуляет её всем.</p>` : '<p>Своих Слияний нет.</p>');
    sec('eid', 'Эйдолоны', '<p>Каждый Эйдолон добавляет 4% к базовым HP, атаке и защите, шестой даёт +24%. Своих эффектов у них нет, поэтому копии брать не обязательно.</p>');
    const ci = this.contactInfo(id);
    sec('contact', 'Контакт', ci.length ? `<ul class="kv-list">${ci.map(x => `<li><b>«${this.esc(x.name)}»</b>: нравится ${x.good.length ? this.esc(x.good.join(', ')) : 'никому'}${x.bad.length ? `; злит ${this.esc(x.bad.join(', '))}` : ''}.</li>`).join('')}</ul><p class="kv-small">Контакт работает только в открытом мире и не действует на боссов.</p>` : '');
    const rows = K.MODES.map(m => kc.cols.map(col => `<tr><td>${this.esc(m.name)}</td><td>${this.esc(K.COLUMNS.find(y => y.id === col).name)}</td><td><span class="kv-tier kv-tier-${this.placement(m.id, 'sig', col)[id]}">${this.tierName(this.placement(m.id, 'sig', col)[id])}</span></td><td>${m.id === 'start' ? '&nbsp;' : `<span class="kv-tier kv-tier-${this.placement(m.id, 'std', col)[id]}">${this.tierName(this.placement(m.id, 'std', col)[id])}</span>`}</td><td class="kv-small">${this.esc(this.metricText(id, col, m.id, 'sig'))}</td></tr>`).join('')).join('');
    sec('bench', 'Замеры', `<table class="kv-grid" width="100%" cellspacing="0" cellpadding="3"><tr><th>Режим</th><th>Роль</th><th>С сигн.</th><th>Без</th><th>Цифры (с сигнатурным конусом)</th></tr>${rows}</table><p class="kv-small">Очки навыка за ход в замере: ${rc.sp ? (rc.sp.turn > 0 ? '+' : rc.sp.turn < 0 ? '−' : '') + this.num(Math.abs(rc.sp.turn), 2) : '0'}.${K.BOT_NOTES[id] ? ' Бот: ' + this.esc(K.BOT_NOTES[id]) : ''}</p>`);
    sec('compare', 'С кем сравнить', `<p>Ближе всего по замеру в Зале (роль «${this.esc(colNames[0])}»):</p><p>${this.neighbours(id).map(x => this.charChip(x)).join('')}</p>${guide && guide.compare ? `<p>${this.renderText(guide.compare)}</p>` : ''}`);
    const toc = sections.map(s => `<a class="kv-toc" data-kv-jump="kv-sec-${s.key}">${this.esc(s.title)}</a>`).join(' &middot; ');
    const src = this.sources(id);
    return `
      <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; ${this.link('/hsr98/crew', 'Экипаж')} &gt; ${this.esc(this.charName(id))}
        <span class="kv-pager">${this.link('/hsr98/char?id=' + prev, '&lt;&lt; ' + this.esc(this.charName(prev)))} | ${this.link('/hsr98/char?id=' + next, this.esc(this.charName(next)) + ' &gt;&gt;')}</span></p>
      <table class="kv-dossier" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td class="kv-dossier-left" width="150" valign="top" align="center">
            ${this.art('fig:' + id, 96, this.charName(id), 192)}
            <table class="kv-stamps" cellspacing="0" cellpadding="2">
              <tr><th>Режим</th>${colNames.map(x => `<th>${this.esc(x)}</th>`).join('')}</tr>
              ${stamps}
            </table>
          </td>
          <td class="kv-dossier-right" valign="top">
            <p class="kv-dossier-no">ЛИЧНОЕ ДЕЛО № ${n + 1}</p>
            <h1 class="kv-h1">${this.esc(this.charName(id))}</h1>
            ${c.fullName ? `<p class="kv-small">Полное имя: ${this.esc(c.fullName)}</p>` : ''}
            <table class="kv-passport" cellspacing="0" cellpadding="3">
              <tr><td>Редкость</td><td>${c.rarity} ${this.gif('star', 1, 'звёзд')}</td><td>Путь</td><td>${this.esc(H.PATHS[c.path].name)}</td></tr>
              <tr><td>Стихия</td><td>${this.esc(H.ELEMENTS[c.elem].name)}</td><td>Пробитие</td><td>${this.esc(H.BREAK_EFFECT[c.elem])}</td></tr>
              <tr><td>Роль</td><td>${this.esc(colNames.join(', '))}</td><td>Энергия</td><td>${c.energy || 'ноты'}</td></tr>
              <tr><td>HP / атака / защита</td><td colspan="3">${c.base.hp} / ${c.base.atk} / ${c.base.def} на 1 уровне, ${lvlMax('hp')} / ${lvlMax('atk')} / ${lvlMax('def')} на ${H.MAX_LVL}. Скорость ${c.base.spd}.</td></tr>
              <tr><td>Где взять</td><td colspan="3">${this.esc(src.join('; ') || 'нет данных')}</td></tr>
              <tr><td>Метки</td><td colspan="3">${tags}</td></tr>
            </table>
            <p class="kv-toc-row"><b>Содержание:</b> ${toc}</p>
          </td>
        </tr>
      </table>
      ${sections.map(s => `<h2 class="kv-h2" id="kv-sec-${s.key}">${this.esc(s.title)}</h2>${s.body}`).join('')}`;
  }

  slotRole(team, i) {
    if (i === 0) return 'Боец';
    const col = this.primaryCol(team.members[i]);
    return col === 'dps' ? 'Второй боец' : this.hsrData().COLUMNS.find(c => c.id === col).name;
  }

  teamFusions(members) {
    const H = this.game();
    return Object.values(H.FUSIONS).filter(f => f.members.every(m => members.includes(m)));
  }

  teamStages(members) {
    const H = this.game();
    const elems = new Set(members.map(id => H.CHARS[id].elem));
    return H.FH.STAGES.filter(st => st.rec.some(r => r.some(e => elems.has(e)))).map(st => st.n);
  }

  renderTeams(route) {
    const H = this.game(), K = this.hsrData(), R = this.bench();
    if (!H || !R || !R.teams) return `<h1 class="kv-h1">Судовая роль</h1><p class="kv-warn">${this.gif('warn')} Данные игры или замеров недоступны.</p>`;
    const arch = K.ARCHETYPES.some(a => a.id === route.params.arch) ? route.params.arch : '';
    const filter = [`${arch ? this.link('/hsr98/teams', 'все') : '<b>все</b>'}`].concat(K.ARCHETYPES.map(a => a.id === arch ? `<b>${this.esc(a.name)}</b>` : this.link('/hsr98/teams?arch=' + a.id, this.esc(a.name)))).join(' | ');
    let n = 0;
    const groups = K.ARCHETYPES.filter(a => !arch || a.id === arch).map(a => {
      const teams = K.TEAMS.filter(t => t.arch === a.id);
      const rows = teams.map(t => {
        n++;
        const r = R.teams[t.id];
        const fus = this.teamFusions(t.members).map(f => '«' + this.esc(f.name) + '»').join(', ');
        return `
          <tr>
            <td class="kv-roll-no">${String(n).padStart(2, '0')}</td>
            <td class="kv-roll-name"><b>${this.link('/hsr98/team?id=' + t.id, this.esc(t.name))}</b>${fus ? `<br><span class="kv-small">Слияния: ${fus}</span>` : ''}</td>
            ${t.members.map((id, i) => `<td class="kv-roll-slot"><span class="kv-small">${this.esc(this.slotRole(t, i))}</span><br>${this.charChip(id)}</td>`).join('')}
            <td class="kv-num">${this.num(r.hall.cyc)}</td>
            <td class="kv-num">${this.num(r.boss.cyc)}${r.boss.win < 1 ? `<br><span class="kv-small">${Math.round(100 * r.boss.win)}% побед</span>` : ''}</td>
          </tr>`;
      }).join('');
      return `
        <tr><td colspan="8" class="kv-roll-arch"><b>${this.esc(a.name)}.</b> ${this.esc(a.text)}</td></tr>
        ${rows}`;
    }).join('');
    return `
      <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; Судовая роль</p>
      <h1 class="kv-h1">Судовая роль: готовые отряды</h1>
      <p>Каждый отряд прогнан стендом: циклы в Зале забвения (этапы 11–15) и на пяти боссах, с сигнатурными конусами. Меньше значит быстрее. На странице отряда есть замены для каждого места с цифрами и порядок ходов в первых двух циклах.</p>
      <p class="kv-small">Архетипы: ${filter}</p>
      <table class="kv-roll" width="100%" cellspacing="0" cellpadding="3">
        <tr><th>№</th><th>Отряд</th><th>Место 1</th><th>Место 2</th><th>Место 3</th><th>Место 4</th><th>Зал</th><th>Боссы</th></tr>
        ${groups}
      </table>`;
  }

  actWord(kind) {
    return { basic: 'базовая атака', skill: 'навык', ult: 'абсолютная техника', enhanced: 'усиленная атака', follow: 'доп. атака', chain: 'Цепочка атак', aoa: 'атака всем отрядом', counter: 'ответный удар' }[kind] || kind;
  }

  renderTeam(route) {
    const H = this.game(), K = this.hsrData(), R = this.bench();
    const t = K.TEAMS.find(x => x.id === route.params.id);
    const r = R.teams[t.id];
    const arch = K.ARCHETYPES.find(a => a.id === t.arch);
    const delta = (v, base) => { const d = v - base; return (d > 0 ? '+' : d < 0 ? '−' : '±') + this.num(Math.abs(d)); };
    const slots = t.members.map((id, i) => {
      const alts = (r.alts[i] || []).slice().sort((a, b) => (a.hall + a.boss) - (b.hall + b.boss));
      const list = alts.length
        ? `<ul class="kv-list kv-alts">${alts.map(a => `<li>${this.link('/hsr98/char?id=' + a.id, this.esc(this.charName(a.id)))}: Зал ${this.num(a.hall)} (${delta(a.hall, r.hall.cyc)}), боссы ${this.num(a.boss)} (${delta(a.boss, r.boss.cyc)})${a.bossWin < 1 ? `, побед ${Math.round(100 * a.bossWin)}%` : ''}</li>`).join('')}</ul>`
        : '<p class="kv-small">Замены нет.</p>';
      return `
        <td class="kv-slot" valign="top" width="25%">
          <span class="kv-slot-role">${this.esc(this.slotRole(t, i))}</span><br>
          ${this.link('/hsr98/char?id=' + id, this.art('card:' + id, 64, this.charName(id)))}<br>
          <b>${this.link('/hsr98/char?id=' + id, this.esc(this.charName(id)))}</b>
          <p class="kv-small"><b>Замены:</b></p>${list}
        </td>`;
    }).join('');
    const fus = this.teamFusions(t.members);
    const lines = [];
    for (const e of r.log) {
      if (e[0] === 'cycle') lines.push(`</ol><p class="kv-cycle">Цикл ${e[1]}</p><ol class="kv-turns">`);
      else if (e[0] === 'fusion') lines.push(`<li><b>Слияние «${this.esc(e[1])}»</b></li>`);
      else lines.push(`<li><b>${this.esc(this.charName(e[0]))}</b>: ${this.actWord(e[2])} «${this.esc(e[1])}»${e[3] ? ' <span class="kv-small">(лишний ход)</span>' : ''}</li>`);
    }
    const turns = `<ol class="kv-turns">${lines.join('')}</ol>`.replace('<ol class="kv-turns"></ol>', '');
    const stages = this.teamStages(t.members);
    const sp = Math.round(100 * r.starve);
    return `
      <p class="kv-crumbs">${this.link('/hsr98/', 'Палуба SR98')} &gt; ${this.link('/hsr98/teams', 'Судовая роль')} &gt; ${this.esc(t.name)}</p>
      <h1 class="kv-h1">Отряд «${this.esc(t.name)}»</h1>
      <p><b>${this.esc(arch.name)}.</b> ${this.esc(arch.text)}</p>
      <table class="kv-roll kv-team-slots" width="100%" cellspacing="0" cellpadding="6"><tr>${slots}</tr></table>
      <p class="kv-small">${this.link('/hsr98/builder?team=' + t.members.join(','), 'Проверить отряд в конструкторе')} на любом этапе Зала или боссе.</p>
      <table width="100%" cellspacing="0" cellpadding="0"><tr>
        <td valign="top" width="50%">
          <table class="kv-grid" width="100%" cellspacing="0" cellpadding="4">
            <tr><th colspan="2">Замер стенда</th></tr>
            <tr><td class="kv-team-label">Зал забвения</td><td>${this.num(r.hall.cyc)} цикла за этапы 11–15, доля урона бойца ${Math.round(100 * r.hall.share)}%</td></tr>
            <tr><td class="kv-team-label">Боссы</td><td>${this.num(r.boss.cyc)} цикла за пять боссов, побед ${Math.round(100 * r.boss.win)}%, доля урона бойца ${Math.round(100 * r.boss.share)}%</td></tr>
            <tr><td class="kv-team-label">Очки навыка</td><td>${sp ? `кончались в ${sp}% ходов` : 'не кончались ни разу'} (15-й этап Зала)</td></tr>
            <tr><td class="kv-team-label">Этапы Зала</td><td>Стихии отряда совпадают с рекомендованными на этапах ${stages.join(', ') || 'нет'}</td></tr>
          </table>
          <table class="kv-box" width="100%" cellspacing="0" cellpadding="4">
            <tr><th class="kv-box-head">Чего боится</th></tr>
            <tr><td>${this.esc(t.fear)}</td></tr>
          </table>
          ${fus.length ? `<table class="kv-box" width="100%" cellspacing="0" cellpadding="4"><tr><th class="kv-box-head">Слияния отряда</th></tr><tr><td><ul class="kv-list">${fus.map(f => `<li><b>«${this.esc(f.name)}»</b>: ${this.esc(f.text)}</li>`).join('')}</ul></td></tr></table>` : ''}
        </td>
        <td valign="top" class="kv-legend-right">
          <table class="kv-box" width="100%" cellspacing="0" cellpadding="4">
            <tr><th class="kv-box-head">Первые два цикла на 15-м этапе Зала</th></tr>
            <tr><td>${turns}<p class="kv-small">Так сыграл стенд: абсолютные техники сразу, Слияния, когда выгоднее техник.</p></td></tr>
          </table>
        </td>
      </tr></table>`;
  }

  renderText(str) {
    const H = this.game(), R = this.bench(), K = this.hsrData();
    const parts = String(str || '').split(/(\[\[[a-z]+:[^\]]+\]\])/);
    return parts.map(part => {
      const m = /^\[\[([a-z]+):([^\]]+)\]\]$/.exec(part);
      if (!m) return this.esc(part);
      const v = this.token(m[1], m[2].split('.'), H, R, K);
      return v == null ? '[[?' + this.esc(m[1] + ':' + m[2]) + ']]' : v;
    }).join('');
  }

  token(kind, a, H, R, K) {
    const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '') + this.num(Math.abs(v), 2);
    try {
      switch (kind) {
        case 'k': {
          let ab = H.CHARS[a[0]][a[1]], i = 2;
          if (Array.isArray(ab)) { ab = ab[+a[2]]; i = 3; }
          const f = ab.fx[+a[i]], v = f[a[i + 1]];
          return v == null ? null : (['turns', 'hits'].includes(a[i + 1]) ? String(v) : this.pct(Math.abs(v)));
        }
        case 's': return signed(R.chars[a[0]].sp.turn);
        case 'b': return this.num(R.chars[a[1]].teams.best.sig[a[0]][a[0]].cyc);
        case 'bs': return this.num(R.chars[a[1]].teams.best.std[a[0]][a[0]].cyc);
        case 'u': return this.pct(R.chars[a[1]].up.sig[a[0]]);
        case 'us': return this.pct(R.chars[a[1]].up.std[a[0]]);
        case 'w': return this.pct(R.chars[a[0]].survive.sig.win);
        case 'n': return H.CHARS[a[0]] ? this.link('/hsr98/char?id=' + a[0], this.esc(this.charName(a[0]))) : null;
        case 'c': return H.CONES[a[0]] ? '«' + this.esc(H.CONES[a[0]].name) + '»' : null;
        case 'f': return H.FUSIONS[a[0]] ? '«' + this.esc(H.FUSIONS[a[0]].name) + '»' : null;
        case 't': return this.tierName(this.placement(a[2], 'sig', a[1])[a[0]]);
        case 'tm': { const t = K.TEAMS.find(x => x.id === a[0]); return t ? this.link('/hsr98/team?id=' + t.id, '«' + this.esc(t.name) + '»') : null; }
        case 'tmb': return this.num(R.teams[a[0]][a[1]].cyc);
        case 'alt': { const x = (R.teams[a[0]].alts[a[1]] || []).find(y => y.id === a[2]); return x ? this.num(x[a[3]]) : null; }
        case 'tu': return H.TUNING[a[0]] == null ? null : String(H.TUNING[a[0]]);
        case 'tup': return H.TUNING[a[0]] == null ? null : this.pct(H.TUNING[a[0]]);
        case 'base': { const c = H.CHARS[a[0]]; const v = c.base[a[1]] != null ? c.base[a[1]] : c[a[1]]; return typeof v === 'number' ? String(v) : null; }
        default: return null;
      }
    } catch (e) {
      return null;
    }
  }

  renderSoon(route) {
    return `
      <table class="kv-soon" width="100%" cellspacing="0" cellpadding="10">
        <tr><td class="kv-hazard-row"></td></tr>
        <tr><td align="center">
          ${this.gif('construct', 2)} ${this.gif('construct', 2)} ${this.gif('construct', 2)}
          <h1 class="kv-h1">Раздел «${this.esc(route.title)}» строится</h1>
          <p>Штурман ещё считает, а Боцман вычитывает тексты. Загляните позже.</p>
          <p>${this.link('/hsr98/', 'На палубу SR98')} | ${this.link('', 'На причал')}</p>
        </td></tr>
        <tr><td class="kv-hazard-row"></td></tr>
      </table>`;
  }

  renderMissing(route) {
    return `
      <table class="kv-missing" width="100%" cellspacing="0" cellpadding="10">
        <tr><td align="center">
          ${this.gif('question', 3)}
          <h1 class="kv-h1">Такого на борту нет</h1>
          <p>Адрес <b>${this.esc(this.url(route.path))}</b> никуда не ведёт. Возможно, страницу переименовали.</p>
          <p>${this.link('/hsr98/', 'Палуба SR98')} | ${this.link('/hsr98/crew', 'Экипаж')} | ${this.link('', 'Причал')}</p>
        </td></tr>
      </table>`;
  }

  renderSite(url = KOVCHEG_BASE) {
    const route = this.parseUrl(url);
    const views = {
      home: () => this.renderHome(),
      hub: () => this.renderHub(),
      tier: () => this.renderTier(route),
      crew: () => this.renderCrew(route),
      teams: () => this.renderTeams(route),
      team: () => this.renderTeam(route),
      char: () => this.renderChar(route),
      hall: () => this.renderHall(route),
      su: () => this.renderSu(route),
      bosses: () => this.renderBosses(route),
      guide: () => this.renderGuide(route),
      cones: () => this.renderCones(),
      relics: () => this.renderRelics(),
      fusions: () => this.renderFusions(),
      banners: () => this.renderBannerPage(),
      about: () => this.renderAbout(),
      builder: () => this.renderBuilder(route),
      guestbook: () => this.renderGuestbook(),
      mine: () => this.renderMine(),
      soon: () => this.renderSoon(route),
      missing: () => this.renderMissing(route)
    };
    return `
      <div class="kv-root">
        <table class="kv-page" width="760" cellspacing="0" cellpadding="0" align="center">
          <tr><td class="kv-mast">${this.renderMast()}</td></tr>
          <tr><td class="kv-nav"><table cellspacing="0" cellpadding="0"><tr>${this.renderNav(route)}</tr></table></td></tr>
          <tr><td class="kv-body kv-body-${route.view}">${views[route.view]()}</td></tr>
          <tr><td class="kv-foot">${this.renderFoot()}</td></tr>
        </table>
      </div>`;
  }

  getPageTitle(url) {
    const route = this.parseUrl(url);
    return 'Ковчег: ' + this.pageName(route);
  }

  pageName(route) {
    const p = route.params, A = window.kovchegArticles;
    switch (route.view) {
      case 'home': return 'Причал';
      case 'hub': return 'Star Rail 98';
      case 'tier': return 'тир-лист SR98';
      case 'crew': return 'экипаж SR98';
      case 'teams': return 'судовая роль SR98';
      case 'team': return 'отряд «' + this.hsrData().TEAMS.find(t => t.id === p.id).name + '»';
      case 'char': return this.charName(p.id);
      case 'hall': return 'Зал забвения, этап ' + Math.max(1, Math.min(15, parseInt(p.stage, 10) || 1));
      case 'su': return 'Виртуальная вселенная';
      case 'bosses': return p.id ? 'босс ' + this.foeName(p.id) : 'боссы SR98';
      case 'guide': return p.id ? A[p.id].title : 'статьи';
      case 'cones': return 'световые конусы';
      case 'relics': return 'реликвии';
      case 'fusions': return 'Слияния';
      case 'banners': return 'баннеры';
      case 'about': return 'о сайте';
      case 'builder': return 'конструктор отряда';
      case 'guestbook': return 'гостевая книга';
      case 'mine': return 'мой экипаж';
      case 'soon': return route.title;
      default: return 'Страница не найдена';
    }
  }

  paintArt(cv) {
    const H = this.game();
    if (!H || !H.Gfx) return;
    const G = H.Gfx;
    const [kind, id] = String(cv.dataset.kvArt || '').split(':');
    const g = cv.getContext && cv.getContext('2d');
    if (!g) return;
    g.imageSmoothingEnabled = false;
    if (kind === 'foe' && H.ENEMIES[id]) {
      const m = G.FOE_META[G.foeId(Object.assign({ id }, H.ENEMIES[id]))] || {};
      g.fillStyle = '#000033';
      g.fillRect(0, 0, cv.width, cv.height);
      if (m.figure) g.drawImage(G.bustCanvas(G.lookOf(m.figure, null), 64), 0, 0, cv.width, cv.height);
      else {
        const [cx, cy, r] = m.icon || [50, 50, 30];
        g.drawImage(G.foeCanvas(G.foeId(Object.assign({ id }, H.ENEMIES[id])), 100, 0), Math.max(0, cx - r), Math.max(0, cy - r), r * 2, r * 2, 0, 0, cv.width, cv.height);
      }
      return;
    }
    if (kind === 'fig') g.drawImage(G.figureCanvas(G.lookOf(id, null), 2), 0, 0, cv.width, cv.height);
    if (kind === 'bust' || kind === 'card') g.drawImage(G.bustCanvas(G.lookOf(id, null), 64), 0, 0, cv.width, cv.height);
    if (kind === 'card' && H.CHARS[id]) {
      g.fillStyle = '#000033';
      g.fillRect(0, 0, 15, 15);
      G.elemIcon(g, H.CHARS[id].elem, 7.5, 7.5, 6);
      if (this.hsrData().FREE.includes(id)) {
        g.fillStyle = '#339933';
        g.fillRect(cv.width - 14, cv.height - 12, 14, 12);
        g.fillStyle = '#ffffff';
        g.font = 'bold 10px Verdana, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('Б', cv.width - 7, cv.height - 6);
      }
    }
  }

  attachEvents(win, container, ieInstance) {
    const ie = ieInstance || window.appIE;
    const route = this.parseUrl(ie && ie.currentUrl ? ie.currentUrl : KOVCHEG_BASE);
    const click = () => { if (window.soundSys) window.soundSys.playClick(); };
    const rerender = () => {
      if (!ie || !win) return;
      const top = container.scrollTop || 0;
      ie.renderPage(win, ie.currentUrl || KOVCHEG_BASE);
      container.scrollTop = top;
    };
    const on = (sel, fn) => container.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => {
      if (e && e.preventDefault) e.preventDefault();
      fn(el);
    }));
    if (route.view === 'home') this.countVisit();
    container.querySelectorAll('canvas[data-kv-art]').forEach(cv => {
      try { this.paintArt(cv); } catch (e) { console.warn('kovcheg art', cv.dataset.kvArt, e); }
    });
    on('[data-kv-poll]', () => {
      const checked = container.querySelector('input[name="kv-poll"]:checked');
      if (!checked) return;
      if (window.soundSys) window.soundSys.playDing();
      this.write(this.pollKey, checked.value);
      rerender();
    });
    on('[data-kv-poll-reset]', () => {
      click();
      this.write(this.pollKey, '');
      rerender();
    });
    on('[data-kv-filter]', () => {
      click();
      const val = sel => { const el = container.querySelector(sel); return el ? el.value : ''; };
      const free = container.querySelector('[data-kv-f="free"]');
      const mine = container.querySelector('[data-kv-f="mine"]');
      const q = { mode: route.params.mode, cone: route.params.cone, rar: val('[data-kv-f="rar"]'), path: val('[data-kv-f="path"]'), free: free && free.checked ? '1' : '', mine: mine && mine.checked ? '1' : '' };
      if (ie && win) ie.navigate(win, this.url(this.tierHref(q)));
    });
    on('[data-kv-crew]', () => {
      click();
      const val = sel => { const el = container.querySelector(sel); return el ? el.value : ''; };
      const free = container.querySelector('[data-kv-c="free"]');
      const q = { rar: val('[data-kv-c="rar"]'), path: val('[data-kv-c="path"]'), elem: val('[data-kv-c="elem"]'), role: val('[data-kv-c="role"]'), free: free && free.checked ? '1' : '', sort: route.params.sort };
      if (ie && win) ie.navigate(win, this.url(this.crewHref(q)));
    });
    on('[data-kv-jump]', el => {
      const target = container.querySelector('#' + el.dataset.kvJump);
      if (!target || !target.getBoundingClientRect || !container.getBoundingClientRect) return;
      container.scrollTop += target.getBoundingClientRect().top - container.getBoundingClientRect().top - 6;
    });
    on('[data-kv-steam]', el => {
      click();
      const gm = window.gameManager;
      if (gm && typeof gm.showInSteam === 'function') gm.showInSteam(el.dataset.kvSteam);
    });
  }
}

if (typeof window !== 'undefined') {
  window.kovchegSite = new KovchegSite();
}
