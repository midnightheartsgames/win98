class SunsetValleySite {
  constructor() {
    this.baseUrl = 'http://www.sunsetvalley98.com';
    this.pollStorageKey = 'win98_sunsetvalley_poll_v1';
    this.guestbookStorageKey = 'win98_sunsetvalley_guestbook_v1';
    this.hitsStorageKey = 'win98_sunsetvalley_hits_v1';
    this.townSeed = 1999;
    this.startFunds = 20000;

    this.selectedLotKey = 'landgraab';
    this.mapZone = 'all';
    this.budgetSimoleons = 20000;

    this.selectedFamilyKey = 'goth';
    this.censusQuery = '';

    this.casFirst = 'Белла';
    this.casLast = 'Холостякки';
    this.casAge = 'ya';
    this.casZodiac = 'Лев';
    this.casLifespan = 'normal';
    this.casTraits = ['good', 'hopeless_romantic', 'bookworm', 'charismatic', 'artistic'];
    this.casLtw = 'ltw_author';
    this.casNotice = '';
    this.casNoticeOk = false;

    this.catalogDept = 'all';
    this.catalogRoom = 'all';
    this.selectedItemKey = 'bed_double_lux';
    this.swatchA = 0;
    this.swatchB = 0;

    this.almanacTab = 'careers';
    this.selectedCareerKey = 'law';

    this._townCache = null;
  }

  get data() {
    return (typeof window !== 'undefined' && window.SUNSETVALLEY_DATA) || globalThis.SUNSETVALLEY_DATA;
  }

  get s3() {
    return (typeof window !== 'undefined' && window.Sims3) || globalThis.Sims3 || {};
  }

  get gm() {
    return typeof window !== 'undefined' ? window.gameManager : null;
  }

  url(path) {
    return this.baseUrl + (path || '');
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
    return typeof window !== 'undefined' && window.webGif ? window.webGif(name, scale) : '';
  }

  money(n) {
    const v = Math.round(Number(n) || 0);
    const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    return (v < 0 ? '-' : '') + '§' + s;
  }

  plural(n, one, few, many) {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    if (b >= 2 && b <= 4) return few;
    return many;
  }

  ageName(key) {
    const a = this.s3.AGE_INFO && this.s3.AGE_INFO[key];
    return (a && a.name) || key;
  }

  maxTraits() {
    const a = this.s3.AGE_INFO && this.s3.AGE_INFO[this.casAge];
    return a && Number.isFinite(a.traits) ? a.traits : 5;
  }

  ageIndex(key) {
    const order = ['baby', 'toddler', 'child', 'teen', 'ya', 'adult', 'elder'];
    const i = order.indexOf(key);
    return i === -1 ? 4 : i;
  }

  readHits() {
    try {
      return parseInt(localStorage.getItem(this.hitsStorageKey) || '0', 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  bumpHits() {
    const next = this.readHits() + 1;
    try {
      localStorage.setItem(this.hitsStorageKey, String(next));
    } catch (e) {}
    return this.getHits();
  }

  getHits() {
    const base = (this.data && this.data.site && this.data.site.hitsBase) || 318420;
    return base + this.readHits();
  }

  getTownModel() {
    if (this._townCache) return this._townCache;
    const S = this.s3;
    const TER_POOL = 14;
    const famList = (S.FAMILIES || []).map(f => {
      const sims = (f.sims || f.members || []).map(m => Object.assign({}, m, {
        last: m.last || f.last || f.name || '',
        job: Array.isArray(m.job) ? { c: m.job[0], lvl: m.job[1], branch: m.job[2] || null } : (m.job || null)
      }));
      return Object.assign({}, f, { name: f.name || f.last || f.key, bio: f.bio || f.desc || '', sims });
    });
    const famByKey = {};
    for (const f of famList) famByKey[f.key] = f;

    let built = null;
    if (typeof S.buildTown === 'function') {
      try {
        built = S.buildTown(this.townSeed);
      } catch (e) {
        built = null;
      }
    }
    const world = built ? built.world : null;
    const src = built ? built.lots : (S.LOT_DEFS || []);
    const lots = src.map((raw, idx) => {
      const lot = Object.assign({ id: idx }, raw);
      if (!lot.address) lot.address = 'Центральный проспект, ' + (idx + 1);
      if (!lot.land) lot.land = (lot.w || 10) * (lot.h || 10) * 6;
      if (!lot.price) lot.price = lot.value || lot.land;
      let beds = 0;
      let baths = 0;
      let objCount = 0;
      let poolTiles = 0;
      let upper = 0;
      if (world) {
        for (const ob of world.objects.values()) {
          if (ob.lot !== lot.id) continue;
          const def = S.OBJECTS && S.OBJECTS[ob.t];
          if (!def || def.hidden) continue;
          objCount++;
          if (def.bed) beds += def.double ? 2 : 1;
          if (def.toilet) baths++;
        }
        for (let y = lot.y; y < lot.y + lot.h; y++) {
          for (let x = lot.x; x < lot.x + lot.w; x++) {
            if (!world.inb(x, y)) continue;
            if (world.terrain[world.idx(x, y)] === TER_POOL) poolTiles++;
            for (let lv = 1; lv < world.L; lv++) if (world.floor[world.li(x, y, lv)]) upper = Math.max(upper, lv);
          }
        }
      }
      const fam = lot.family ? famByKey[lot.family] || null : null;
      const rh = lot.rh && S.RH ? S.RH[lot.rh] || null : null;
      let zone = 'venue';
      if (lot.kind === 'home') zone = fam ? 'home' : (lot.bp ? 'sale' : 'empty');
      else if (lot.kind === 'rabbit') zone = 'rabbit';
      return Object.assign(lot, { beds, baths, objCount, poolTiles, floors: upper + 1, familyObj: fam, rhObj: rh, zone });
    });
    const lotByKey = {};
    for (const l of lots) lotByKey[l.key] = l;
    this._townCache = { lots, lotByKey, famByKey, families: famList, world };
    return this._townCache;
  }

  parseUrl(url) {
    const raw = String(url || this.baseUrl);
    let pathPart = raw.replace(/^[a-z]+:\/{2}[^/?#]+/i, '');
    const hashIdx = pathPart.indexOf('#');
    if (hashIdx !== -1) pathPart = pathPart.slice(0, hashIdx);
    let queryPart = '';
    const qIdx = pathPart.indexOf('?');
    if (qIdx !== -1) {
      queryPart = pathPart.slice(qIdx + 1);
      pathPart = pathPart.slice(0, qIdx);
    }
    const path = pathPart.toLowerCase().replace(/\/+$/, '').replace(/\/index\.html?$/, '') || '/';
    const params = {};
    for (const pair of queryPart.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const k = eq === -1 ? pair : pair.slice(0, eq);
      const v = eq === -1 ? '' : pair.slice(eq + 1);
      try {
        params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
      } catch (e) {
        params[k] = v;
      }
    }

    const routes = [
      ['news', ['/news', '/vestnik', '/gazette']],
      ['map', ['/map', '/cadastre', '/lots']],
      ['census', ['/census', '/families', '/sims']],
      ['cas', ['/cas', '/passport', '/traits']],
      ['catalog', ['/catalog', '/objects', '/buy']],
      ['almanac', ['/almanac', '/careers', '/skills', '/recipes', '/fish']],
      ['maxis', ['/maxis', '/sims3', '/game']],
      ['letters', ['/letters', '/guestbook', '/mayor']],
      ['search', ['/search']]
    ];
    let section = path === '/' ? 'home' : 'notfound';
    for (const [key, list] of routes) {
      if (list.includes(path)) section = key;
    }
    if (section === 'home' && params.post) {
      section = 'news';
      params.id = params.post;
    } else if (section === 'home' && params.cat) {
      section = 'news';
    }
    if (section === 'almanac' && !params.tab) {
      if (path === '/skills') params.tab = 'skills';
      if (path === '/recipes') params.tab = 'cooking';
      if (path === '/fish') params.tab = 'nature';
    }
    return { section, params, path, raw };
  }

  findArticle(id) {
    return (this.data.news || []).find(n => n.id === id) || null;
  }

  getPageTitle(url) {
    const { section, params } = this.parseUrl(url);
    const town = 'Сансет Вэлли';
    if (section === 'news') {
      const art = params.id ? this.findArticle(params.id) : null;
      return art ? `${art.title} - Вестник ${town}` : `Вестник ${town}`;
    }
    if (section === 'map') return `Кадастровая карта - ${town}`;
    if (section === 'census') return `Перепись населения - ${town}`;
    if (section === 'cas') return `Паспортный стол - ${town}`;
    if (section === 'catalog') return `Торговый дом - ${town}`;
    if (section === 'almanac') return `Городской справочник - ${town}`;
    if (section === 'maxis') return 'The Sims 3 - студия Maxis';
    if (section === 'letters') return `Приёмная мэрии - ${town}`;
    if (section === 'search') return `Поиск${params.q ? ': ' + params.q : ''} - ${town}`;
    if (section === 'notfound') return '404 Not Found';
    return `Город ${town} - официальный сервер`;
  }

  getSteamStatus() {
    const gm = this.gm;
    const cat = gm && gm.catalog && gm.catalog.sims3 ? gm.catalog.sims3 : {
      title: 'The Sims 3',
      priceDisplay: '$43.99',
      targetExe: 'SIMS3.EXE',
      folder: 'Sims3',
      fileSize: '1.4 GB',
      shots: ['Дом семьи Гот', 'Создание семьи']
    };
    const installed = Boolean(gm && typeof gm.isInstalled === 'function' && gm.isInstalled('sims3'));
    const owned = Boolean(gm && typeof gm.ownsOnSteam === 'function' && gm.ownsOnSteam('sims3'));
    const dl = typeof window !== 'undefined' && window.appSteam && window.appSteam.downloads
      ? window.appSteam.downloads.get('sims3')
      : null;
    return { cat, installed, owned, dl };
  }

  renderSteamState() {
    const { cat, installed, owned, dl } = this.getSteamStatus();
    if (installed) {
      return {
        text: `Игра установлена в <b>C:\\Games\\${this.esc(cat.folder)}</b>.`,
        buttons: `<button type="button" class="sv-btn sv-btn-go" data-sv-action="game-launch">Запустить ${this.esc(cat.targetExe)}</button> <button type="button" class="sv-btn" data-sv-action="steam-open">Страница в Steam</button>`
      };
    }
    if (dl) {
      const pct = Math.max(0, Math.min(100, Math.round(dl.progress || 0)));
      return {
        text: `Steam загружает игру: <b>${pct}%</b>.`,
        buttons: `<button type="button" class="sv-btn sv-btn-go" data-sv-action="steam-open">Загрузка в Steam: ${pct}%</button>`
      };
    }
    if (owned) {
      return {
        text: 'Игра есть в вашей библиотеке Steam, но ещё не установлена.',
        buttons: `<button type="button" class="sv-btn sv-btn-go" data-sv-action="steam-open">Установить через Steam</button>`
      };
    }
    return {
      text: `Игра продаётся в Steam за <b>${this.esc(cat.priceDisplay)}</b>.`,
      buttons: `<button type="button" class="sv-btn sv-btn-go" data-sv-action="steam-open">Купить в Steam за ${this.esc(cat.priceDisplay)}</button>`
    };
  }

  renderMasthead() {
    return `
      <svg class="sv-mast" width="760" height="120" viewBox="0 0 760 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Город Сансет Вэлли">
        <defs>
          <clipPath id="sv-clip-sky"><rect x="0" y="0" width="760" height="86"/></clipPath>
          <clipPath id="sv-clip-seal"><circle cx="62" cy="60" r="31"/></clipPath>
          <path id="sv-seal-top" d="M 28.1 72 A 36 36 0 1 1 95.9 72"/>
          <path id="sv-seal-bottom" d="M 19 60 A 43 43 0 0 0 105 60"/>
        </defs>
        <rect x="0" y="0" width="760" height="20" fill="#663366"/>
        <rect x="0" y="20" width="760" height="18" fill="#993366"/>
        <rect x="0" y="38" width="760" height="16" fill="#cc3366"/>
        <rect x="0" y="54" width="760" height="14" fill="#ff6633"/>
        <rect x="0" y="68" width="760" height="10" fill="#ff9933"/>
        <rect x="0" y="78" width="760" height="8" fill="#ffcc66"/>
        <circle cx="560" cy="86" r="32" fill="#ffff99" clip-path="url(#sv-clip-sky)"/>
        <rect x="520" y="64" width="80" height="2" fill="#ff6633"/>
        <rect x="520" y="72" width="80" height="2" fill="#ff9933"/>
        <rect x="520" y="79" width="80" height="3" fill="#ffcc66"/>
        <rect x="0" y="86" width="760" height="34" fill="#336699"/>
        <rect x="528" y="90" width="64" height="2" fill="#ffcc66"/>
        <rect x="538" y="95" width="44" height="2" fill="#ffcc66"/>
        <rect x="546" y="100" width="28" height="2" fill="#ffcc66"/>
        <rect x="553" y="105" width="14" height="2" fill="#ffcc66"/>
        <rect x="350" y="94" width="24" height="2" fill="#6699cc"/>
        <rect x="410" y="104" width="30" height="2" fill="#6699cc"/>
        <rect x="460" y="112" width="18" height="2" fill="#6699cc"/>
        <rect x="610" y="98" width="20" height="2" fill="#6699cc"/>
        <polygon points="640,120 676,100 700,94 760,92 760,120" fill="#003333"/>
        <polygon points="707,94 717,94 715,52 709,52" fill="#ffffff"/>
        <rect x="708" y="62" width="8" height="6" fill="#cc3333"/>
        <rect x="707" y="78" width="10" height="6" fill="#cc3333"/>
        <polygon points="712,48 760,38 760,58" fill="#ffffcc"/>
        <rect x="706" y="44" width="12" height="8" fill="#ffff99" stroke="#000000" stroke-width="1"/>
        <polygon points="703,44 721,44 712,35" fill="#cc3333"/>
        <circle cx="62" cy="60" r="47" fill="#ffffff" stroke="#000033" stroke-width="3"/>
        <circle cx="62" cy="60" r="32" fill="#ffffff" stroke="#000033" stroke-width="1"/>
        <g clip-path="url(#sv-clip-seal)">
          <rect x="30" y="28" width="64" height="14" fill="#cc3366"/>
          <rect x="30" y="42" width="64" height="10" fill="#ff9933"/>
          <rect x="30" y="52" width="64" height="10" fill="#ffcc66"/>
          <circle cx="62" cy="62" r="13" fill="#ffff99"/>
          <rect x="30" y="62" width="64" height="30" fill="#336699"/>
          <rect x="48" y="67" width="28" height="2" fill="#ffcc66"/>
          <rect x="54" y="72" width="16" height="2" fill="#ffcc66"/>
          <rect x="40" y="80" width="12" height="2" fill="#6699cc"/>
          <rect x="70" y="84" width="14" height="2" fill="#6699cc"/>
        </g>
        <text font-family="Georgia, Times New Roman, serif" font-size="8" font-weight="bold" fill="#000033" letter-spacing="1"><textPath href="#sv-seal-top" startOffset="50%" text-anchor="middle">ГОРОД САНСЕТ ВЭЛЛИ</textPath></text>
        <text font-family="Georgia, Times New Roman, serif" font-size="7" font-weight="bold" fill="#000033" letter-spacing="1"><textPath href="#sv-seal-bottom" startOffset="50%" text-anchor="middle">МУНИЦИПАЛИТЕТ</textPath></text>
        <text x="126" y="60" font-family="Georgia, Times New Roman, serif" font-size="44" font-weight="bold" fill="#ffffff" stroke="#330033" stroke-width="1.5" paint-order="stroke">Сансет Вэлли</text>
        <text x="129" y="82" font-family="Verdana, Tahoma, sans-serif" font-size="13" fill="#ffffcc">Официальный сервер города на берегу залива</text>
      </svg>
    `;
  }

  renderSigns(section) {
    const signs = [
      ['home', '', 'Ратуша', 'главная'],
      ['news', '/news', 'Газета', 'Вестник'],
      ['map', '/map', 'Карта', 'города'],
      ['census', '/census', 'Перепись', 'семей'],
      ['cas', '/cas', 'Паспортный', 'стол'],
      ['catalog', '/catalog', 'Торговый', 'дом'],
      ['almanac', '/almanac', 'Городской', 'справочник'],
      ['maxis', '/maxis', 'Студия', 'Maxis'],
      ['letters', '/letters', 'Приёмная', 'мэрии']
    ];
    return `
      <div class="sv-signs">
        ${signs.map(([key, path, a, b]) => `<a class="sv-sign${section === key ? ' is-here' : ''}" data-url="${this.url(path)}" title="${this.esc(a + ' ' + b)}"><span class="sv-sign-plate">${this.esc(a)}<br>${this.esc(b)}</span><span class="sv-sign-post"></span></a>`).join('')}
      </div>
    `;
  }

  renderSite(url) {
    this.bumpHits();
    const parsed = this.parseUrl(url);
    const { section, params } = parsed;
    if (section === 'notfound') return this.renderNotFound(parsed.path);
    this.applyParams(section, params);

    let body = '';
    if (section === 'news') body = params.id ? this.renderArticlePage(params.id) : this.renderNewsPage(params.cat || 'all');
    else if (section === 'map') body = this.renderMapPage();
    else if (section === 'census') body = this.renderCensusPage();
    else if (section === 'cas') body = this.renderCasPage();
    else if (section === 'catalog') body = this.renderCatalogPage();
    else if (section === 'almanac') body = this.renderAlmanacPage();
    else if (section === 'maxis') body = this.renderMaxisPage();
    else if (section === 'letters') body = this.renderLettersPage();
    else if (section === 'search') body = this.renderSearchPage(params.q || '');
    else body = this.renderHomePage();

    const town = this.getTownModel();
    const cityhall = town.lotByKey.cityhall;
    const webRingHtml = typeof window !== 'undefined' && window.retroSites && typeof window.retroSites.renderWebRing === 'function'
      ? window.retroSites.renderWebRing(this.baseUrl)
      : '';
    const counter = String(this.getHits()).padStart(7, '0');

    return `
      <div class="sv-site">
        <div class="sv-page">
          ${this.renderMasthead()}
          ${this.renderSigns(section)}
          <table class="sv-strip">
            <tr>
              <td>${this.esc(this.data.site.dateLong)}</td>
              <td align="center">Вы посетитель № <span class="sv-odometer">${counter}</span></td>
              <td align="right">
                <form id="sv-search-form" style="display:inline; margin:0;">
                  <input type="text" id="sv-search-input" class="sv-input" size="18" value="${this.esc(section === 'search' ? (params.q || '') : '')}">
                  <button type="submit" class="sv-btn">Искать по городу</button>
                </form>
              </td>
            </tr>
          </table>
          <div class="sv-body">
            ${body}
          </div>
          <div class="sv-foot">
            <p><b>Мэрия города Сансет Вэлли</b>, ${this.esc(cityhall ? cityhall.address : 'Ратушная улица')}. Письма: <a href="mailto:mayor@sunsetvalley98.com">mayor@sunsetvalley98.com</a></p>
            <p>Сервер ведёт ${this.esc(this.data.site.webmaster)}. Город создан студией <a data-url="${this.url('/maxis')}">Maxis</a> для игры The Sims 3, которая продаётся в <a data-url="http://www.steampowered.com">Steam</a>.</p>
            <p>Лучше всего смотреть в Microslop Internet Explorer 5.0 при разрешении 800x600. Последнее обновление ${this.esc(this.data.site.date)}.</p>
            ${webRingHtml}
          </div>
        </div>
      </div>
    `;
  }

  applyParams(section, params) {
    if (section === 'map') {
      if (params.lot) this.selectedLotKey = params.lot;
      if (params.zone || params.cat) this.mapZone = params.zone || params.cat;
    }
    if (section === 'census' && params.family) this.selectedFamilyKey = params.family;
    if (section === 'catalog') {
      this.catalogDept = params.dept || params.func || 'all';
      if (params.room) this.catalogRoom = params.room;
      if (params.item) {
        if (params.item !== this.selectedItemKey) {
          this.swatchA = 0;
          this.swatchB = 0;
        }
        this.selectedItemKey = params.item;
      }
    }
    if (section === 'almanac') {
      if (params.tab) this.almanacTab = params.tab;
      if (params.career) {
        this.selectedCareerKey = params.career;
        this.almanacTab = 'careers';
      }
    }
  }

  renderNotFound(path) {
    return `
      <div class="sv-404">
        <h1>Not Found</h1>
        <p>The requested URL ${this.esc(path)} was not found on this server.</p>
        <hr>
        <address>Apache/1.3.3 Server at www.sunsetvalley98.com Port 80</address>
        <p><a class="sv-a" data-url="${this.url('')}">www.sunsetvalley98.com</a></p>
      </div>
    `;
  }

  getPollVotes() {
    const base = {};
    for (const opt of this.data.poll.options) base[opt.id] = opt.baseVotes;
    let picked = null;
    try {
      const raw = JSON.parse(localStorage.getItem(this.pollStorageKey) || 'null');
      if (raw && typeof raw === 'object') {
        picked = base[raw.picked] !== undefined ? raw.picked : null;
        if (raw.extra && typeof raw.extra === 'object') {
          for (const k of Object.keys(raw.extra)) {
            if (base[k] !== undefined) base[k] += Number(raw.extra[k]) || 0;
          }
        }
      }
    } catch (e) {}
    return { counts: base, picked };
  }

  votePoll(optId) {
    try {
      const raw = JSON.parse(localStorage.getItem(this.pollStorageKey) || 'null') || { picked: null, extra: {} };
      raw.extra = raw.extra || {};
      if (raw.picked) raw.extra[raw.picked] = Math.max(0, (Number(raw.extra[raw.picked]) || 1) - 1);
      raw.picked = optId;
      raw.extra[optId] = (Number(raw.extra[optId]) || 0) + 1;
      localStorage.setItem(this.pollStorageKey, JSON.stringify(raw));
    } catch (e) {}
  }

  resetPoll() {
    try {
      localStorage.removeItem(this.pollStorageKey);
    } catch (e) {}
  }

  renderPoll() {
    const { counts, picked } = this.getPollVotes();
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return `
      <div class="sv-panel">
        <div class="sv-panel-head">Опрос мэрии</div>
        <div class="sv-panel-body">
          <p style="margin:0 0 6px 0;"><b>${this.esc(this.data.poll.question)}</b></p>
          ${this.data.poll.options.map(opt => {
            const c = counts[opt.id] || 0;
            const pct = Math.round((c * 100) / total);
            const mine = picked === opt.id;
            return `
              <div class="sv-poll-row${mine ? ' is-mine' : ''}">
                <label><input type="radio" name="sv-poll" data-sv-vote="${this.esc(opt.id)}"${mine ? ' checked' : ''}> ${this.esc(opt.label)}</label>
                <div class="sv-bar"><div class="sv-bar-fill" style="width:${pct}%;"></div></div>
                ${c} (${pct}%)${mine ? ' <b>ваш голос</b>' : ''}
              </div>
            `;
          }).join('')}
          <div>Всего голосов: <b>${total}</b>${picked ? ` <a class="sv-a" data-sv-action="poll-reset">отозвать голос</a>` : ''}</div>
        </div>
      </div>
    `;
  }

  renderMaxisBox() {
    const st = this.renderSteamState();
    return `
      <div class="sv-maxis">
        <div class="sv-maxis-head">Maxis представляет</div>
        <div class="sv-maxis-body">
          <table cellspacing="0" cellpadding="0"><tr>
            <td valign="top" style="padding-right:6px;">${this.plumbob(24)}</td>
            <td valign="top"><b style="font-size:13px;">The Sims 3</b><br>Весь наш город в одной игре для Win 98.</td>
          </tr></table>
          <div class="sv-steam-state">${st.text}</div>
          ${st.buttons}
          <p style="margin:6px 0 0 0;"><a class="sv-a" data-url="${this.url('/maxis')}">Об игре, клавиши и требования</a></p>
        </div>
      </div>
    `;
  }

  plumbob(size) {
    const h = Math.round(size * 1.35);
    return `<svg width="${size}" height="${h}" viewBox="0 0 40 54" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 36,27 20,27" fill="#66ff66" stroke="#003300" stroke-width="1.5"/><polygon points="20,2 4,27 20,27" fill="#33cc33" stroke="#003300" stroke-width="1.5"/><polygon points="20,52 36,27 20,27" fill="#009900" stroke="#003300" stroke-width="1.5"/><polygon points="20,52 4,27 20,27" fill="#006600" stroke="#003300" stroke-width="1.5"/></svg>`;
  }

  townCounts() {
    const town = this.getTownModel();
    const by = z => town.lots.filter(l => l.zone === z).length;
    const residents = town.families.reduce((a, f) => a + f.sims.length, 0);
    const richest = town.families.slice().sort((a, b) => (b.funds || 0) - (a.funds || 0))[0];
    const streets = (this.s3.HROADS || []).length + (this.s3.VROADS || []).length;
    return {
      residents,
      families: town.families.length,
      lots: town.lots.length,
      homes: by('home'),
      sale: by('sale'),
      empty: by('empty'),
      rabbit: by('rabbit'),
      venue: by('venue'),
      streets,
      richest
    };
  }

  renderHomePage() {
    const d = this.data;
    const c = this.townCounts();
    const news = (d.news || []).slice(0, 4);
    const cityhall = this.getTownModel().lotByKey.cityhall;
    return `
      <table class="sv-cols"><tr>
        <td>
          <h1 class="sv-h1">Добро пожаловать в Сансет Вэлли</h1>
          <div class="sv-welcome">
            ${d.welcome.map(p => `<p>${this.esc(p)}</p>`).join('')}
            <p class="sv-sign-off">Канцелярия мэрии, ${this.esc(cityhall ? cityhall.address : 'Ратушная улица')}</p>
          </div>

          <h2 class="sv-h2">Город в цифрах</h2>
          <table class="sv-facts">
            <tr><td>Жителей</td><td class="sv-num">${c.residents}</td><td><a class="sv-a" data-url="${this.url('/census')}">перепись</a></td></tr>
            <tr><td>Семей</td><td class="sv-num">${c.families}</td><td>самая богатая: ${this.esc(c.richest ? c.richest.name : '')} (${this.money(c.richest ? c.richest.funds : 0)})</td></tr>
            <tr><td>Участков</td><td class="sv-num">${c.lots}</td><td><a class="sv-a" data-url="${this.url('/map')}">кадастровая карта</a></td></tr>
            <tr><td>Домов на продажу</td><td class="sv-num">${c.sale}</td><td><a class="sv-a" data-url="${this.url('/map?zone=sale')}">ещё ${c.empty} пустых участка</a></td></tr>
            <tr><td>Городских зданий</td><td class="sv-num">${c.rabbit}</td><td>от Ратуши до Старого склада</td></tr>
            <tr><td>Мест отдыха</td><td class="sv-num">${c.venue}</td><td>парк, пляж, пирс, маяк, спортзал, библиотека, кладбище</td></tr>
            <tr><td>Улиц</td><td class="sv-num">${c.streets}</td><td>и один мост на Центральном проспекте</td></tr>
          </table>

          <h2 class="sv-h2">Распорядок городского дня</h2>
          <table class="sv-facts">
            ${d.dayClock.map(([t, what]) => `<tr><td class="sv-num" style="text-align:left; white-space:nowrap;">${this.esc(t)}</td><td>${this.esc(what)}</td></tr>`).join('')}
          </table>

          <h2 class="sv-h2">Что нового на сервере</h2>
          <ul class="sv-log">
            ${d.updates.map(u => `<li><b>${this.esc(u.date)}</b> ${u.fresh ? '<span class="sv-new">NEW!</span> ' : ''}${this.esc(u.text)}${u.link ? ` <a class="sv-a" data-url="${this.url(u.link)}">смотреть</a>` : ''}</li>`).join('')}
          </ul>
        </td>
        <td class="sv-side">
          <div class="sv-panel is-sun">
            <div class="sv-panel-head">${this.gif('news')} Свежий «Вестник»</div>
            <div class="sv-panel-body">
              ${news.map(n => `<p style="margin:0 0 7px 0;"><b>${this.esc(n.date)}</b><br><a class="sv-a" data-url="${this.url('/news?id=' + n.id)}">${this.esc(n.title)}</a></p>`).join('')}
              <a class="sv-a" data-url="${this.url('/news')}">Весь номер</a>
            </div>
          </div>
          ${this.renderPoll()}
          ${this.renderMaxisBox()}
        </td>
      </tr></table>
    `;
  }

  renderNewsPage(cat) {
    const d = this.data;
    const all = d.news || [];
    const list = cat === 'all' ? all : all.filter(n => n.cat === cat);
    const lead = list[0];
    const rest = list.slice(1);
    const newsroom = this.getTownModel().lotByKey.newspaper;
    const left = rest.filter((_, i) => i % 2 === 0);
    const right = rest.filter((_, i) => i % 2 === 1);
    const item = n => `
      <div class="sv-news-item sv-story">
        <div class="sv-kicker">${this.esc(n.kicker)}</div>
        <div class="sv-story-title"><a data-url="${this.url('/news?id=' + n.id)}">${this.esc(n.title)}</a></div>
        <div>${this.esc(n.lead)}</div>
        <div class="sv-byline">${this.esc(n.date)}, ${this.esc(n.author)}</div>
      </div>
    `;
    const rubric = (key, label) => cat === key
      ? `<span class="is-on">${this.esc(label)}</span>`
      : `<a class="sv-a" data-url="${this.url(key === 'all' ? '/news' : '/news?cat=' + key)}">${this.esc(label)}</a>`;
    return `
      <div class="sv-paper">
        <p class="sv-nameplate">Вестник Сансет Вэлли</p>
        <p class="sv-nameplate-sub">Городская газета. Редакция: ${this.esc(newsroom ? newsroom.address : 'Ратушная улица')}</p>
        <table class="sv-issue"><tr>
          <td>${this.esc(d.site.issue)}</td>
          <td align="center">${this.esc(d.site.dateLong)}</td>
          <td align="right">Доставка к почтовому ящику в 6:00</td>
        </tr></table>
        <div class="sv-rubrics">
          ${rubric('all', 'Все материалы')} | ${d.rubrics.map(([k, l]) => rubric(k, l)).join(' | ')}
        </div>
        ${lead ? `
          <div class="sv-lead-story sv-story">
            <div class="sv-kicker">${this.esc(lead.kicker)}</div>
            <div class="sv-story-title"><a data-url="${this.url('/news?id=' + lead.id)}">${this.esc(lead.title)}</a></div>
            <p style="margin:4px 0;">${this.esc(lead.lead)}</p>
            <div class="sv-byline">${this.esc(lead.date)}, ${this.esc(lead.author)}. <a class="sv-a" data-url="${this.url('/news?id=' + lead.id)}">Читать полностью</a></div>
          </div>
        ` : '<p>В этой рубрике пока нет материалов.</p>'}
        ${rest.length ? `
          <table class="sv-news-cols"><tr>
            <td class="sv-gutter-l">${left.map(item).join('')}</td>
            <td class="sv-gutter-r">${right.map(item).join('')}</td>
          </tr></table>
        ` : ''}
      </div>
    `;
  }

  renderArticlePage(id) {
    const all = this.data.news || [];
    const idx = all.findIndex(n => n.id === id);
    if (idx === -1) {
      return `
        <div class="sv-paper">
          <p class="sv-nameplate">Вестник Сансет Вэлли</p>
          <p>Статья не найдена. Возможно, номер уже ушёл в макулатуру. <a class="sv-a" data-url="${this.url('/news')}">Вернуться к номеру</a></p>
        </div>
      `;
    }
    const a = all[idx];
    const prev = all[idx - 1];
    const next = all[idx + 1];
    return `
      <div class="sv-paper">
        <p class="sv-nameplate" style="font-size:20px;"><a class="sv-a" style="color:#000000; text-decoration:none;" data-url="${this.url('/news')}">Вестник Сансет Вэлли</a></p>
        <table class="sv-issue"><tr>
          <td>${this.esc(this.data.site.issue)}</td>
          <td align="right">Рубрика: ${this.esc(a.kicker)}</td>
        </tr></table>
        <div class="sv-article">
          <h1 class="sv-story-title" style="font-size:24px;">${this.esc(a.title)}</h1>
          <p class="sv-byline">${this.esc(a.date)}, ${this.esc(a.author)}</p>
          ${a.facts && a.facts.length ? `
            <div class="sv-aside">
              <b>Коротко</b>
              <ul>${a.facts.map(f => `<li>${this.esc(f)}</li>`).join('')}</ul>
            </div>
          ` : ''}
          <p class="sv-lede">${this.esc(a.lead)}</p>
          ${a.body.map(p => `<p>${this.esc(p)}</p>`).join('')}
          <div class="sv-article-nav">
            ${prev ? `<a class="sv-a" data-url="${this.url('/news?id=' + prev.id)}">&lt;&lt; ${this.esc(prev.title)}</a><br>` : ''}
            ${next ? `<a class="sv-a" data-url="${this.url('/news?id=' + next.id)}">${this.esc(next.title)} &gt;&gt;</a><br>` : ''}
            <a class="sv-a" data-url="${this.url('/news')}">Весь номер</a> | <a href="mailto:mayor@sunsetvalley98.com">Написать в редакцию</a>
          </div>
        </div>
      </div>
    `;
  }

  zoneInfo() {
    return [
      ['home', 'Дом семьи', '#ffcc99'],
      ['sale', 'Дом продаётся', '#ffff33'],
      ['empty', 'Пустой участок', '#ffffcc'],
      ['rabbit', 'Городское здание', '#cc99ff'],
      ['venue', 'Место отдыха', '#99ff99']
    ];
  }

  zoneLabel(lot) {
    if (lot.zone === 'home') return `Дом семьи ${lot.familyObj ? lot.familyObj.name : ''}`.trim();
    if (lot.zone === 'sale') return 'Жилой дом, продаётся';
    if (lot.zone === 'empty') return 'Пустой участок, продаётся';
    if (lot.zone === 'rabbit') return 'Городское здание';
    return 'Место отдыха';
  }

  runsOf(world, x0, y0, w, h, test) {
    const runs = [];
    for (let y = y0; y < y0 + h; y++) {
      let start = -1;
      let kind = null;
      for (let x = x0; x <= x0 + w; x++) {
        const k = x < x0 + w && world.inb(x, y) ? test(x, y) : null;
        if (k !== kind) {
          if (kind !== null) runs.push([start, y, x - start, kind]);
          start = x;
          kind = k;
        }
      }
    }
    return runs;
  }

  renderTownMap(selected) {
    const town = this.getTownModel();
    const S = this.s3;
    const world = town.world;
    const k = 3;
    const W = (S.TOWN_W || 160);
    const H = (S.TOWN_H || 160);
    const zoneColor = {};
    for (const [z, , c] of this.zoneInfo()) zoneColor[z] = c;
    const terColor = { 5: '#ffff99', 6: '#3399cc', 10: '#cccccc', 11: '#cc9966', 12: '#996633', 14: '#66ccff', 2: '#cc9966' };
    let sea = '';
    let ground = '';
    let houses = '';
    if (world) {
      const isSea = typeof S.isSea === 'function' ? S.isSea : () => false;
      sea = this.runsOf(world, 0, 0, W, H, (x, y) => (isSea(x, y) ? 's' : null))
        .map(([x, y, w]) => `<rect x="${x * k}" y="${y * k}" width="${w * k}" height="${k}" fill="#336699"/>`).join('');
      ground = this.runsOf(world, 0, 0, W, H, (x, y) => {
        if (world.lot[world.idx(x, y)] < 0) return null;
        const t = world.terrain[world.idx(x, y)];
        return terColor[t] ? t : null;
      }).map(([x, y, w, t]) => `<rect x="${x * k}" y="${y * k}" width="${w * k}" height="${k}" fill="${terColor[t]}"/>`).join('');
      houses = this.runsOf(world, 0, 0, W, H, (x, y) => (world.floor[world.idx(x, y)] ? 'f' : null))
        .map(([x, y, w]) => `<rect x="${x * k}" y="${y * k}" width="${w * k}" height="${k}" fill="#663300"/>`).join('');
    }
    const roads = (S.HROADS || []).map(r => `<rect x="${r.x0 * k}" y="${r.y * k}" width="${(r.x1 - r.x0 + 1) * k}" height="${(S.ROAD_W || 6) * k}" fill="#999999"/>`).join('')
      + (S.VROADS || []).map(r => `<rect x="${r.x * k}" y="${r.y0 * k}" width="${(S.ROAD_W || 6) * k}" height="${(r.y1 - r.y0 + 1) * k}" fill="#999999"/>`).join('');
    const roadNames = (S.HROADS || []).map(r => `<text x="${r.x0 * k + 6}" y="${r.y * k + 13}" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#ffffff">${this.esc(r.name)}</text>`).join('')
      + (S.VROADS || []).map(r => `<text transform="translate(${r.x * k + 13} ${r.y0 * k + 160}) rotate(-90)" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#ffffff">${this.esc(r.name)}</text>`).join('');
    const dim = this.mapZone !== 'all';
    const lots = town.lots.map(l => {
      const on = !dim || l.zone === this.mapZone;
      return `<g class="sv-map-lot" data-sv-lot="${this.esc(l.key)}"><title>№ ${l.id + 1}. ${this.esc(l.name)}, ${this.esc(l.address)}</title><rect class="sv-lot-face" x="${l.x * k}" y="${l.y * k}" width="${l.w * k}" height="${l.h * k}" fill="${on ? zoneColor[l.zone] : '#ffffff'}" stroke="#000000" stroke-width="1"/></g>`;
    }).join('');
    const labels = town.lots.map(l => {
      const n = String(l.id + 1);
      const wPx = n.length * 6 + 4;
      return `<rect x="${l.x * k + 2}" y="${l.y * k + 2}" width="${wPx}" height="11" fill="#ffffff" stroke="#000000" stroke-width="1"/><text x="${l.x * k + 4}" y="${l.y * k + 11}" font-family="Arial, sans-serif" font-size="9" fill="#000000">${n}</text>`;
    }).join('');
    const sel = selected ? `<rect x="${selected.x * k - 1}" y="${selected.y * k - 1}" width="${selected.w * k + 2}" height="${selected.h * k + 2}" fill="none" stroke="#ff0000" stroke-width="3"/>` : '';
    return `
      <svg width="${W * k}" height="${H * k}" viewBox="0 0 ${W * k} ${H * k}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Карта Сансет Вэлли">
        <rect x="0" y="0" width="${W * k}" height="${H * k}" fill="#99cc66"/>
        ${sea}
        ${roads}
        ${lots}
        <g pointer-events="none">
          ${ground}
          ${dim ? '' : houses}
          ${roadNames}
          ${labels}
          ${sel}
          <g transform="translate(452 26)">
            <polygon points="0,-16 6,4 0,0 -6,4" fill="#ffffff" stroke="#000000" stroke-width="1"/>
            <text x="-4" y="16" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">С</text>
          </g>
          <g transform="translate(8 466)">
            <rect x="0" y="0" width="30" height="5" fill="#ffffff" stroke="#000000" stroke-width="1"/>
            <rect x="0" y="0" width="15" height="5" fill="#000000"/>
            <text x="34" y="6" font-family="Arial, sans-serif" font-size="9" fill="#ffffff">10 клеток</text>
          </g>
        </g>
      </svg>
    `;
  }

  renderLotPlan(lot) {
    const town = this.getTownModel();
    const world = town.world;
    const S = this.s3;
    if (!world || !lot) return '';
    const k = Math.max(5, Math.min(10, Math.floor(260 / Math.max(lot.w, lot.h))));
    const terColor = { 0: '#ccff99', 1: '#99ff99', 2: '#cc9966', 3: '#ffccff', 4: '#cccccc', 5: '#ffff99', 6: '#3399cc', 7: '#336699', 9: '#cccccc', 10: '#cccccc', 11: '#cc9966', 12: '#996633', 13: '#999999', 14: '#66ccff' };
    const floors = Object.keys(S.FLOORS || {});
    const cells = this.runsOf(world, lot.x, lot.y, lot.w, lot.h, (x, y) => {
      const f = world.floor[world.idx(x, y)];
      if (f && floors[f - 1]) return 'f' + f;
      return 't' + world.terrain[world.idx(x, y)];
    }).map(([x, y, w, key]) => {
      let fill = '#ccff99';
      if (key[0] === 'f') {
        const fl = S.FLOORS[floors[Number(key.slice(1)) - 1]];
        fill = (fl && fl.c) || '#ffffff';
      } else {
        fill = terColor[Number(key.slice(1))] || '#ccff99';
      }
      return `<rect x="${(x - lot.x) * k}" y="${(y - lot.y) * k}" width="${w * k}" height="${k}" fill="${fill}"/>`;
    }).join('');
    const objs = [];
    for (const ob of world.objects.values()) {
      if (ob.lot !== lot.id || (ob.lv || 0) !== 0) continue;
      const def = S.OBJECTS && S.OBJECTS[ob.t];
      if (!def || def.hidden || def.place === 'wall' || !Array.isArray(def.size)) continue;
      const fp = typeof S.footprint === 'function' ? S.footprint(def, ob.r || 0) : def.size;
      objs.push(`<rect x="${(ob.x - lot.x) * k + 1}" y="${(ob.y - lot.y) * k + 1}" width="${fp[0] * k - 2}" height="${fp[1] * k - 2}" fill="#ffffff" stroke="#666666" stroke-width="1"><title>${this.esc(def.name)}</title></rect>`);
    }
    const walls = [];
    for (const w of world.walls) {
      if (!w || (w.lv || 0) !== 0) continue;
      if (w.x < lot.x || w.y < lot.y || w.x > lot.x + lot.w || w.y > lot.y + lot.h) continue;
      if (w.o === 'h' && w.x >= lot.x + lot.w) continue;
      if (w.o === 'v' && w.y >= lot.y + lot.h) continue;
      const x1 = (w.x - lot.x) * k;
      const y1 = (w.y - lot.y) * k;
      const x2 = w.o === 'h' ? x1 + k : x1;
      const y2 = w.o === 'h' ? y1 : y1 + k;
      let stroke = '#000000';
      let width = 2;
      if (w.fence) {
        stroke = '#996633';
        width = 1;
      } else if (w.door) {
        stroke = '#ff9933';
        width = 3;
      } else if (w.win) {
        stroke = '#3399ff';
        width = 3;
      }
      walls.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`);
    }
    return `
      <div class="sv-plan">
        <svg width="${lot.w * k}" height="${lot.h * k}" viewBox="0 0 ${lot.w * k} ${lot.h * k}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="План участка">
          ${cells}
          ${objs.join('')}
          ${walls.join('')}
        </svg>
      </div>
      <div class="sv-legend">
        <span class="sv-zone"><span class="sv-key" style="background-color:#000000;"></span>стена</span>
        <span class="sv-zone"><span class="sv-key" style="background-color:#ff9933;"></span>дверь</span>
        <span class="sv-zone"><span class="sv-key" style="background-color:#3399ff;"></span>окно</span>
        <span class="sv-zone"><span class="sv-key" style="background-color:#ffffff;"></span>мебель</span>
        <span class="sv-zone"><span class="sv-key" style="background-color:#66ccff;"></span>бассейн</span>
        <span class="sv-zone"><span class="sv-key" style="background-color:#3399cc;"></span>пруд</span>
      </div>
      <p class="sv-note">Первый этаж, одна клетка = ${k} пикселей. Наведите мышь на мебель, чтобы узнать, что стоит.</p>
    `;
  }

  renderDeed(lot) {
    if (!lot) return '';
    const S = this.s3;
    const bp = lot.bp && S.BLUEPRINTS ? S.BLUEPRINTS[lot.bp] : null;
    const fronts = { N: 'север', S: 'юг', E: 'восток', W: 'запад' };
    const rows = [
      ['Название', this.esc(lot.name)],
      ['Адрес', this.esc(lot.address)],
      ['Назначение', this.esc(this.zoneLabel(lot))],
      ['Размер', `${lot.w} x ${lot.h} кл. (${lot.w * lot.h})`],
      ['Угол на карте', `${lot.x}, ${lot.y}`],
      ['Фасад', `на ${fronts[lot.front] || 'улицу'}`]
    ];
    if (lot.kind === 'home') {
      rows.push(['Этажей', String(lot.bp ? lot.floors : 0)]);
      rows.push(['Спальных мест', String(lot.beds)]);
      rows.push(['Санузлов', String(lot.baths)]);
      rows.push(['Бассейн', lot.poolTiles ? `${lot.poolTiles} кл.` : 'нет']);
    }
    rows.push(['Предметов', String(lot.objCount)]);
    rows.push(['Земля', this.money(lot.land)]);
    rows.push(['Оценка', this.money(lot.price)]);
    let foot = '';
    if (lot.familyObj) {
      foot = `Владельцы: <a class="sv-a" data-url="${this.url('/census?family=' + lot.familyObj.key)}">семья ${this.esc(lot.familyObj.name)}</a>, ${lot.familyObj.sims.length} ${this.plural(lot.familyObj.sims.length, 'человек', 'человека', 'человек')}.`;
    } else if (lot.rhObj) {
      foot = this.esc(lot.rhObj.desc);
    } else if (lot.desc) {
      foot = this.esc(lot.desc);
    } else if (lot.zone === 'sale' || lot.zone === 'empty') {
      const diff = this.startFunds - lot.price;
      foot = diff >= 0
        ? `Новой семье из двух человек (${this.money(this.startFunds)}) хватит, останется <span class="sv-ok">${this.money(diff)}</span>.`
        : `Новой семье из двух человек не хватит <span class="sv-short">${this.money(-diff)}</span>.`;
    }
    return `
      <div class="sv-deed">
        <div class="sv-deed-head">Кадастровая карточка<b>Участок № ${lot.id + 1}</b></div>
        <table>
          ${rows.map(([f, v]) => `<tr><td class="sv-field">${f}</td><td class="sv-val">${v}</td></tr>`).join('')}
        </table>
        ${bp ? `<div class="sv-deed-foot" style="border-bottom:1px solid #999999;">${this.esc((this.data.projects || {})[lot.bp] || lot.bp)}, ${(bp.rooms || []).length} ${this.plural((bp.rooms || []).length, 'комната', 'комнаты', 'комнат')}.</div>` : ''}
        ${foot ? `<div class="sv-deed-foot">${foot}</div>` : ''}
      </div>
    `;
  }

  renderMapPage() {
    const town = this.getTownModel();
    const lots = town.lots;
    const lot = town.lotByKey[this.selectedLotKey] || lots[0];
    const zone = this.mapZone;
    const budget = Number(this.budgetSimoleons) || this.startFunds;
    const forSale = lots.filter(l => l.zone === 'sale' || l.zone === 'empty').sort((a, b) => a.price - b.price);
    const listed = zone === 'all' ? lots : lots.filter(l => l.zone === zone);
    const zoneLink = (z, label, color) => {
      const count = z === 'all' ? lots.length : lots.filter(l => l.zone === z).length;
      const key = color ? `<span class="sv-key" style="background-color:${color};"></span>` : '';
      return zone === z
        ? `<span class="sv-zone">${key}<b>${this.esc(label)} (${count})</b></span>`
        : `<span class="sv-zone">${key}<a class="sv-a" data-sv-zone="${z}">${this.esc(label)}</a> (${count})</span>`;
    };
    return `
      <h1 class="sv-h1">Кадастровая карта</h1>
      <p class="sv-note" style="margin-top:0;">Съёмка ноября 1998 года. Одна клетка города = 3 пикселя карты. Нажмите на участок, чтобы открыть его карточку.</p>
      <table class="sv-cols"><tr>
        <td style="width:488px;"><div class="sv-mapwrap">${this.renderTownMap(lot)}</div></td>
        <td class="sv-side">${this.renderDeed(lot)}</td>
      </tr></table>
      <div class="sv-legend">
        Показать: ${zoneLink('all', 'все участки', '')}
        ${this.zoneInfo().map(([z, label, color]) => zoneLink(z, label, color)).join('')}
      </div>

      <table class="sv-cols"><tr>
        <td>
          <h2 class="sv-h2">План участка № ${lot.id + 1}: ${this.esc(lot.name)}</h2>
          ${this.renderLotPlan(lot)}
        </td>
        <td class="sv-side">
          <h2 class="sv-h2">Продаётся</h2>
          <div class="sv-sale">
            <p style="margin:0 0 6px 0;">Новая семья получает ${this.money(this.startFunds)} и ещё §1 500 за каждого члена семьи сверх двух.</p>
            Ваш бюджет: <input type="text" id="sv-budget-input" class="sv-input" size="7" value="${budget}">
            <button type="button" class="sv-btn" data-sv-action="calc-budget">Сравнить</button>
            <table class="sv-grid" style="margin-top:6px;">
              <tr><th>Участок</th><th>Цена</th><th>Остаток</th></tr>
              ${forSale.map(l => {
                const diff = budget - l.price;
                return `<tr class="${l.key === lot.key ? 'is-sel' : ''}"><td><a class="sv-a" data-sv-lot="${this.esc(l.key)}">${this.esc(l.name)}</a></td><td>${this.money(l.price)}</td><td class="${diff >= 0 ? 'sv-ok' : 'sv-short'}">${this.money(diff)}</td></tr>`;
              }).join('')}
            </table>
          </div>
        </td>
      </tr></table>

      <h2 class="sv-h2">Реестр участков</h2>
      <table class="sv-grid">
        <tr><th>№</th><th>Название</th><th>Адрес</th><th>Назначение</th><th>Размер</th><th>Оценка</th></tr>
        ${listed.map((l, i) => `
          <tr class="${l.key === lot.key ? 'is-sel' : (i % 2 ? 'is-alt' : '')}">
            <td>${l.id + 1}</td>
            <td><a class="sv-a" data-sv-lot="${this.esc(l.key)}">${this.esc(l.name)}</a></td>
            <td>${this.esc(l.address)}</td>
            <td>${this.esc(this.zoneLabel(l))}</td>
            <td>${l.w}x${l.h}</td>
            <td align="right">${this.money(l.price)}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  jobText(sim) {
    const careers = this.s3.CAREERS || {};
    if (sim.job && careers[sim.job.c]) {
      const c = careers[sim.job.c];
      let lv = null;
      if (sim.job.branch && c.branches && c.branches[sim.job.branch] && sim.job.lvl > 5) {
        lv = c.branches[sim.job.branch].levels[sim.job.lvl - 6];
      } else {
        lv = c.levels && c.levels[(sim.job.lvl || 1) - 1];
      }
      return `${c.name}, ступень ${sim.job.lvl}: ${lv ? lv.t : ''}${lv ? ` (${this.money(lv.pay)}/ч)` : ''}`;
    }
    if (sim.age === 'child' || sim.age === 'teen') return 'Школа Сансет Вэлли';
    if (sim.age === 'toddler' || sim.age === 'baby') return 'Дома с родителями';
    if (sim.age === 'elder') return 'На пенсии';
    return 'Не работает';
  }

  familyHay(f) {
    const traits = this.s3.TRAITS || {};
    const ltw = this.s3.LTW || {};
    return [f.name, f.bio].concat(f.sims.map(s => [
      s.first,
      s.last,
      ...(s.traits || []).map(t => (traits[t] && traits[t].name) || t),
      this.jobText(s),
      s.ltw && ltw[s.ltw] ? ltw[s.ltw].name : ''
    ].join(' '))).join(' ').toLowerCase();
  }

  renderCensusPage() {
    const town = this.getTownModel();
    const S = this.s3;
    const traits = S.TRAITS || {};
    const ltw = S.LTW || {};
    const q = (this.censusQuery || '').trim().toLowerCase();
    const shown = q ? town.families.filter(f => this.familyHay(f).includes(q)) : town.families;
    const fam = town.famByKey[this.selectedFamilyKey] || shown[0] || town.families[0];
    const famNo = fam ? town.families.indexOf(fam) + 1 : 0;
    const famLot = fam ? town.lotByKey[fam.lot] : null;
    const ages = {};
    let total = 0;
    for (const f of town.families) {
      for (const s of f.sims) {
        ages[s.age] = (ages[s.age] || 0) + 1;
        total++;
      }
    }
    const ageOrder = ['toddler', 'child', 'teen', 'ya', 'adult', 'elder'].filter(a => ages[a]);
    return `
      <h1 class="sv-h1">Перепись населения 1998 года</h1>
      <p class="sv-note" style="margin-top:0;">Переписные листы заполнены со слов жителей с 1 по 20 ноября. Всего записано ${total} ${this.plural(total, 'житель', 'жителя', 'жителей')} в ${town.families.length} домохозяйствах.</p>
      <form id="sv-census-form" style="margin:0 0 10px 0; font-size:11px;">
        Найти по фамилии, черте характера или профессии:
        <input type="text" id="sv-census-input" class="sv-input" size="22" value="${this.esc(this.censusQuery)}">
        <button type="submit" class="sv-btn">Найти</button>
        ${this.censusQuery ? `<button type="button" class="sv-btn" data-sv-action="census-clear">Показать всех</button> Найдено: ${shown.length}` : ''}
      </form>
      <table class="sv-ledger">
        <tr><th>№</th><th>Домохозяйство</th><th>Дом и адрес</th><th>Состав</th><th>На счету</th></tr>
        ${shown.map(f => {
          const l = town.lotByKey[f.lot];
          return `
            <tr class="${fam && fam.key === f.key ? 'is-sel' : ''}">
              <td class="sv-tt">${String(town.families.indexOf(f) + 1).padStart(2, '0')}</td>
              <td><a class="sv-a" data-sv-family="${this.esc(f.key)}"><b>${this.esc(f.name)}</b></a></td>
              <td>${l ? `<a class="sv-a" data-url="${this.url('/map?lot=' + l.key)}">${this.esc(l.name)}</a>, ${this.esc(l.address)}` : ''}</td>
              <td>${f.sims.map(s => this.esc(s.first)).join(', ')}</td>
              <td align="right" class="sv-tt">${this.money(f.funds)}</td>
            </tr>
          `;
        }).join('')}
      </table>

      ${fam ? `
        <div class="sv-sheet">
          <table class="sv-sheet-head"><tr>
            <td>
              <div class="sv-sheet-title">Переписной лист: семья ${this.esc(fam.name)}</div>
              <div style="margin:3px 0;">Адрес: <span class="sv-typed">${this.esc(famLot ? famLot.name + ', ' + famLot.address : '')}</span></div>
              <div>Средства семьи: <span class="sv-typed">${this.money(fam.funds)}</span></div>
              <div style="margin-top:5px;">Со слов соседей: <span class="sv-typed">${this.esc(fam.bio)}</span></div>
            </td>
            <td class="sv-sheet-no">Лист №<b>${String(famNo).padStart(2, '0')}</b></td>
          </tr></table>
          <table class="sv-person">
            <tr><th>№</th><th>Имя и фамилия</th><th>Возраст, пол</th><th>Черты характера</th><th>Занятость</th><th>Мечта всей жизни</th><th></th></tr>
            ${fam.sims.map((s, i) => {
              const w = s.ltw ? ltw[s.ltw] : null;
              return `
                <tr>
                  <td class="sv-typed">${i + 1}</td>
                  <td class="sv-typed">${this.esc(s.first)} ${this.esc(s.last)}</td>
                  <td>${this.esc(this.ageName(s.age))}, ${s.gender === 'f' ? 'ж' : 'м'}</td>
                  <td>${(s.traits || []).map(t => `<span class="sv-trait-word" title="${this.esc(traits[t] ? traits[t].desc : '')}">${this.esc(traits[t] ? traits[t].name : t)}</span>`).join(', ')}</td>
                  <td>${this.esc(this.jobText(s))}</td>
                  <td>${w ? `<span title="${this.esc(w.desc)}">${this.esc(w.name)}</span>` : 'ещё не выбрана'}</td>
                  <td><button type="button" class="sv-btn" data-sv-load-sim="${this.esc(fam.key)}:${this.esc(s.first)}">В паспортный стол</button></td>
                </tr>
              `;
            }).join('')}
          </table>
        </div>
      ` : ''}

      <h2 class="sv-h2">Итоги переписи по возрастам</h2>
      <table class="sv-ledger" style="width:auto;">
        <tr>${ageOrder.map(a => `<th>${this.esc(this.ageName(a))}</th>`).join('')}<th>Всего</th></tr>
        <tr>${ageOrder.map(a => `<td class="sv-tt" align="center">${ages[a]}</td>`).join('')}<td class="sv-tt" align="center"><b>${total}</b></td></tr>
      </table>
    `;
  }

  getTraitConflicts() {
    const traitsMap = this.s3.TRAITS || {};
    const picked = new Set(this.casTraits);
    const reasons = {};
    for (const [key, t] of Object.entries(traitsMap)) {
      if (picked.has(key)) continue;
      for (const p of picked) {
        const pt = traitsMap[p];
        if (!pt) continue;
        if ((pt.conflicts || []).includes(key) || (t.conflicts || []).includes(p)) {
          reasons[key] = pt.name;
          break;
        }
      }
    }
    return reasons;
  }

  traitTooOld(t) {
    return Boolean(t && t.age && this.ageIndex(this.casAge) < this.ageIndex(t.age));
  }

  computeCasAnalysis() {
    const S = this.s3;
    const traitsMap = S.TRAITS || {};
    const skillsMap = S.SKILLS || {};
    const needsMap = {};
    for (const n of (Array.isArray(S.NEEDS) ? S.NEEDS : [])) needsMap[n.k] = n;
    const ltwMap = S.LTW || {};
    const skillMults = {};
    const needMults = {};
    for (const tk of this.casTraits) {
      const t = traitsMap[tk];
      if (!t) continue;
      for (const [sk, m] of Object.entries(t.skill || {})) skillMults[sk] = (skillMults[sk] || 1) * Number(m);
      for (const [nk, m] of Object.entries(t.need || {})) needMults[nk] = (needMults[nk] || 1) * Number(m);
    }
    const skillSummary = Object.entries(skillMults)
      .map(([key, m]) => ({ key, name: (skillsMap[key] && skillsMap[key].name) || key, pct: Math.round((m - 1) * 100) }))
      .filter(x => x.pct !== 0)
      .sort((a, b) => b.pct - a.pct);
    const needSummary = Object.entries(needMults)
      .map(([key, m]) => ({ key, name: (needsMap[key] && needsMap[key].name) || key, pct: Math.round((m - 1) * 100) }))
      .filter(x => x.pct !== 0);
    const recommendations = Object.entries(ltwMap).map(([key, w]) => {
      let score = 0;
      for (const t of (w.traits || [])) if (this.casTraits.includes(t)) score += 25;
      const text = JSON.stringify(w);
      for (const s of skillSummary) if (s.pct > 0 && text.includes('"' + s.key + '"')) score += s.pct;
      return { key, name: w.name, desc: w.desc, score };
    }).sort((a, b) => b.score - a.score);
    return { skillSummary, needSummary, recommendations };
  }

  buildSimPassportText() {
    const S = this.s3;
    const traitsMap = S.TRAITS || {};
    const ltwMap = S.LTW || {};
    const ls = (S.LIFESPANS || {})[this.casLifespan] || { name: 'Обычная' };
    const w = ltwMap[this.casLtw] || { name: 'Не выбрана', desc: '' };
    const { skillSummary, needSummary } = this.computeCasAnalysis();
    const line = '='.repeat(64);
    const thin = '-'.repeat(64);
    const lines = [
      line,
      '  МЭРИЯ ГОРОДА САНСЕТ ВЭЛЛИ. ПАСПОРТНЫЙ СТОЛ',
      '  ЗАЯВЛЕНИЕ НА ВИД НА ЖИТЕЛЬСТВО, ФОРМА CAS-1',
      line,
      `Имя и фамилия:     ${this.casFirst} ${this.casLast}`,
      `Возраст:           ${this.ageName(this.casAge)}`,
      `Знак зодиака:      ${this.casZodiac}`,
      `Длина жизни:       ${ls.name}`,
      thin,
      `ЧЕРТЫ ХАРАКТЕРА (${this.casTraits.length} из ${this.maxTraits()}):`,
      ...this.casTraits.map((tk, i) => {
        const t = traitsMap[tk];
        return `  ${i + 1}. ${t ? t.name : tk}. ${t ? t.desc : ''}`;
      }),
      thin,
      'МЕЧТА ВСЕЙ ЖИЗНИ:',
      `  ${w.name} (+20 000 очков счастья)`,
      `  ${w.desc}`,
      thin,
      'НАВЫКИ:',
      ...(skillSummary.length ? skillSummary.map(s => `  ${s.name}: ${s.pct > 0 ? '+' : ''}${s.pct}% к скорости обучения`) : ['  Обычная скорость обучения']),
      'ПОТРЕБНОСТИ:',
      ...(needSummary.length ? needSummary.map(n => `  ${n.name}: ${n.pct > 0 ? '+' : ''}${n.pct}% к скорости убывания`) : ['  Обычный расход потребностей']),
      line,
      `Выдано ${this.data.site.date}, http://www.sunsetvalley98.com/cas`,
      line
    ];
    return lines.join('\r\n');
  }

  exportCasToNotepad() {
    const safeLast = (this.casLast || 'Sim').replace(/[^a-zA-Zа-яА-ЯёЁ0-9_-]/g, '') || 'Sim';
    const fileName = `SimPassport_${safeLast}.txt`;
    const content = this.buildSimPassportText();
    const folder = ['My Computer', 'C:', 'My Documents'];
    if (typeof window !== 'undefined' && window.vfs && typeof window.vfs.writeFile === 'function') {
      try {
        window.vfs.writeFile(folder, fileName, content);
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.appNotepad && typeof window.appNotepad.open === 'function') {
      window.appNotepad.open(fileName, content, folder);
    }
    this.casNotice = `Заявление сохранено в «Мои документы\\${fileName}» и открыто в Блокноте.`;
    this.casNoticeOk = true;
    return { fileName, content };
  }

  toggleTrait(tk) {
    const traitsMap = this.s3.TRAITS || {};
    const t = traitsMap[tk];
    const idx = this.casTraits.indexOf(tk);
    this.casNoticeOk = false;
    if (idx !== -1) {
      this.casTraits.splice(idx, 1);
      this.casNotice = '';
      return;
    }
    const conflicts = this.getTraitConflicts();
    if (!t) {
      this.casNotice = 'Такой черты нет в перечне.';
    } else if (conflicts[tk]) {
      this.casNotice = `Черта «${t.name}» несовместима с чертой «${conflicts[tk]}». Сначала снимите отметку с неё.`;
    } else if (this.traitTooOld(t)) {
      this.casNotice = `Черту «${t.name}» можно выбрать с возраста «${this.ageName(t.age)}».`;
    } else if (this.casTraits.length >= this.maxTraits()) {
      this.casNotice = `В возрасте «${this.ageName(this.casAge)}» можно отметить не больше ${this.maxTraits()} черт. Снимите одну отметку, чтобы выбрать другую.`;
    } else {
      this.casTraits.push(tk);
      this.casNotice = '';
    }
  }

  renderCasPage() {
    const S = this.s3;
    const traitsMap = S.TRAITS || {};
    const cats = S.TRAIT_CATS || { mental: 'Ум', physical: 'Тело', social: 'Общение', lifestyle: 'Образ жизни' };
    const ltwMap = S.LTW || {};
    const zodiacs = S.ZODIAC || [];
    const lifespans = S.LIFESPANS || {};
    const conflicts = this.getTraitConflicts();
    const { skillSummary, needSummary, recommendations } = this.computeCasAnalysis();
    const zod = zodiacs.find(z => z.name === this.casZodiac);
    const w = ltwMap[this.casLtw];
    const traitCell = cat => Object.entries(traitsMap).filter(([, t]) => t.cat === cat).map(([key, t]) => {
      const picked = this.casTraits.includes(key);
      const blocked = !picked && (conflicts[key] || this.traitTooOld(t));
      const why = conflicts[key] ? `несовместима с «${conflicts[key]}»` : (this.traitTooOld(t) ? `с возраста «${this.ageName(t.age)}»` : t.desc);
      return `<button type="button" class="sv-trait${picked ? ' is-picked' : ''}${blocked ? ' is-blocked' : ''}" data-sv-trait="${this.esc(key)}" title="${this.esc(t.name + ': ' + why)}"><span class="sv-box">${picked ? 'X' : ''}</span>${this.esc(t.name)}</button>`;
    }).join('');
    return `
      <div class="sv-form">
        <table class="sv-form-head"><tr>
          <td class="sv-form-title">Заявление на вид на жительство</td>
          <td class="sv-form-code">ФОРМА CAS-1<br>Паспортный стол мэрии</td>
        </tr></table>

        <div class="sv-form-sec">
          ${this.casNotice ? `<div class="sv-notice${this.casNoticeOk ? ' is-ok' : ''}">${this.esc(this.casNotice)}</div>` : ''}
          <div class="sv-form-label"><span>1</span>Сведения о заявителе</div>
          <table class="sv-form-row"><tr>
            <td>Имя<br><input type="text" id="sv-cas-first" class="sv-input" size="14" value="${this.esc(this.casFirst)}"></td>
            <td>Фамилия<br><input type="text" id="sv-cas-last" class="sv-input" size="16" value="${this.esc(this.casLast)}"></td>
            <td>Возраст<br><select id="sv-cas-age" class="sv-select">
              ${['child', 'teen', 'ya', 'adult', 'elder'].map(a => `<option value="${a}"${this.casAge === a ? ' selected' : ''}>${this.esc(this.ageName(a))}</option>`).join('')}
            </select></td>
            <td>Знак зодиака<br><select id="sv-cas-zodiac" class="sv-select">
              ${zodiacs.map(z => `<option value="${this.esc(z.name)}"${this.casZodiac === z.name ? ' selected' : ''}>${this.esc(z.name)}</option>`).join('')}
            </select></td>
            <td>Длина жизни<br><select id="sv-cas-lifespan" class="sv-select">
              ${Object.entries(lifespans).map(([k, l]) => `<option value="${k}"${this.casLifespan === k ? ' selected' : ''}>${this.esc(l.name)}</option>`).join('')}
            </select></td>
          </tr></table>
        </div>

        <div class="sv-form-sec">
          <div class="sv-form-label"><span>2</span>Черты характера. Отмечено ${this.casTraits.length} из ${this.maxTraits()}</div>
          ${zod && zod.traits ? `<p class="sv-note" style="margin:0 0 6px 0;">Знаку «${this.esc(zod.name)}» подходят: ${zod.traits.map(t => this.esc(traitsMap[t] ? traitsMap[t].name : t)).join(', ')}.</p>` : ''}
          <table class="sv-traits">
            <tr>${Object.values(cats).map(label => `<th>${this.esc(label)}</th>`).join('')}</tr>
            <tr>${Object.keys(cats).map(cat => `<td>${traitCell(cat)}</td>`).join('')}</tr>
          </table>
          <p class="sv-note" style="margin:6px 0 0 0;">Зачёркнутые черты нельзя выбрать: они несовместимы с отмеченными или не подходят по возрасту. <a class="sv-a" data-sv-action="clear-cas">Снять все отметки</a></p>
        </div>

        <div class="sv-form-sec">
          <div class="sv-form-label"><span>3</span>Мечта всей жизни</div>
          <select id="sv-cas-ltw" class="sv-select">
            ${Object.entries(ltwMap).map(([k, l]) => `<option value="${this.esc(k)}"${this.casLtw === k ? ' selected' : ''}>${this.esc(l.name)}</option>`).join('')}
          </select>
          ${w ? `<span style="font-size:11px;"> ${this.esc(w.desc)} Исполненная мечта приносит 20 000 очков счастья.</span>` : ''}
          <p style="margin:6px 0 0 0; font-size:11px;">Под ваши черты лучше всего подходят:
            ${recommendations.slice(0, 4).map(r => `<a class="sv-a" data-sv-ltw="${this.esc(r.key)}">${this.esc(r.name)}</a>`).join(', ')}.
          </p>
        </div>

        <div class="sv-form-sec">
          <div class="sv-form-label"><span>4</span>Заключение паспортного стола</div>
          <div class="sv-verdict">
            <b>Навыки:</b> ${skillSummary.length ? skillSummary.map(s => `${this.esc(s.name)} ${s.pct > 0 ? '+' : ''}${s.pct}%`).join(', ') : 'обычная скорость обучения'}.<br>
            <b>Потребности:</b> ${needSummary.length ? needSummary.map(n => `${this.esc(n.name)} ${n.pct > 0 ? '+' : ''}${n.pct}%`).join(', ') : 'обычный расход'}.<br>
            <b>Длина жизни:</b> ${this.esc((lifespans[this.casLifespan] || {}).name || '')}, ${this.lifespanDays(this.casLifespan)} дн. от рождения до старости.
          </div>
          <p style="margin:8px 0 0 0;">
            <button type="button" class="sv-btn sv-btn-go" data-sv-action="export-cas">Распечатать заявление (Блокнот)</button>
            <span class="sv-stamp">ДЕЙСТВИТЕЛЬНО В САНСЕТ ВЭЛЛИ</span>
          </p>
        </div>
      </div>

      <h2 class="sv-h2">Приложение: награды за очки счастья</h2>
      <table class="sv-grid">
        <tr><th>Награда</th><th>Очков</th><th>Действие</th></tr>
        ${Object.values(S.REWARDS || {}).slice().sort((a, b) => a.cost - b.cost).map((r, i) => `<tr class="${i % 2 ? 'is-alt' : ''}"><td><b>${this.esc(r.name)}</b></td><td align="right">${String(r.cost).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</td><td>${this.esc(r.desc)}</td></tr>`).join('')}
      </table>
    `;
  }

  lifespanDays(key) {
    const ls = (this.s3.LIFESPANS || {})[key];
    if (!ls || !ls.stages) return 0;
    return Object.entries(ls.stages).filter(([k]) => k !== 'elder').reduce((a, [, v]) => a + v, 0);
  }

  itemSpecs(it) {
    const S = this.s3;
    const specs = [];
    if (it.seat) specs.push(`Уют ${it.seat}`);
    if (it.bed) specs.push(`Сон ${it.bed}`);
    if (it.env) specs.push(`Обстановка ${it.env}`);
    if (it.skill) specs.push(`Навык: ${(S.SKILLS && S.SKILLS[it.skill] && S.SKILLS[it.skill].name) || 'все книги'}`);
    if (it.burglar) specs.push('Вызывает полицию');
    return specs;
  }

  itemPalettes(it) {
    if (it && Array.isArray(it.pal) && it.pal.length && Array.isArray(it.pal[0])) {
      return [it.pal[0], it.pal[1] || it.pal[0]];
    }
    const col = (it && it.col) || ['#999999', '#cccccc'];
    return [[col[0]], [col[1] || col[0]]];
  }

  renderItemPicture(it, a, b) {
    const fw = it.size[0];
    const fd = it.size[1];
    const cell = Math.max(14, Math.floor(110 / Math.max(fw, fd, 1)));
    const w = fw * cell;
    const h = fd * cell;
    const grid = [];
    for (let i = 1; i < fw; i++) grid.push(`<line x1="${i * cell}" y1="0" x2="${i * cell}" y2="${h}" stroke="#000000" stroke-width="1" stroke-dasharray="2 2"/>`);
    for (let i = 1; i < fd; i++) grid.push(`<line x1="0" y1="${i * cell}" x2="${w}" y2="${i * cell}" stroke="#000000" stroke-width="1" stroke-dasharray="2 2"/>`);
    return `<svg width="${w + 2}" height="${h + 2}" viewBox="-1 -1 ${w + 2} ${h + 2}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Вид сверху"><rect x="0" y="0" width="${w}" height="${h}" fill="${this.esc(a)}" stroke="#000000" stroke-width="2"/><rect x="${Math.round(cell * 0.25)}" y="${Math.round(cell * 0.25)}" width="${w - Math.round(cell * 0.5)}" height="${h - Math.round(cell * 0.5)}" fill="${this.esc(b)}" stroke="#000000" stroke-width="1"/>${grid.join('')}</svg>`;
  }

  buyableObjects() {
    return Object.entries(this.s3.OBJECTS || {})
      .filter(([, o]) => !o.hidden && !o.build && !o.reward)
      .map(([key, o]) => Object.assign({ key }, o));
  }

  renderCatalogPage() {
    const S = this.s3;
    const funcs = Object.entries(S.FUNC_CATS || {}).map(([k, v]) => [k, (v && v.name) || k]);
    const rooms = Object.entries(S.ROOM_CATS || {}).map(([k, v]) => [k, (v && v.name) || k]);
    const buyable = this.buyableObjects();
    const skuOf = {};
    buyable.slice().sort((a, b) => a.key.localeCompare(b.key)).forEach((o, i) => { skuOf[o.key] = 'TD-' + String(101 + i); });
    const dept = this.catalogDept;
    const room = this.catalogRoom;
    const indexLink = (attr, key, label, count, on) => `<li class="${on ? 'is-on' : ''}"><a class="sv-a" ${attr}="${this.esc(key)}">${this.esc(label)}</a>${count !== null ? ` (${count})` : ''}</li>`;
    const index = `
      <div class="sv-index-title">Отделы</div>
      <ul>
        ${indexLink('data-sv-dept', 'all', 'Все товары', buyable.length, dept === 'all')}
        ${funcs.map(([k, l]) => indexLink('data-sv-dept', k, l, buyable.filter(o => o.func === k).length, dept === k)).join('')}
        ${indexLink('data-sv-dept', 'materials', 'Обои и полы', Object.keys(S.WALLPAPERS || {}).length + Object.keys(S.FLOORS || {}).length, dept === 'materials')}
      </ul>
      <div class="sv-index-title">Для комнаты</div>
      <ul>
        ${indexLink('data-sv-room', 'all', 'Любая', null, room === 'all')}
        ${rooms.map(([k, l]) => indexLink('data-sv-room', k, l, null, room === k)).join('')}
      </ul>
      <p class="sv-note">Заказы принимаются в режиме покупки (F2). Доставка мгновенная.</p>
    `;
    let main = '';
    if (dept === 'materials') {
      const tile = ([k, m]) => `<td><span class="sv-book-tile" style="background-color:${this.esc(m.c)};${m.c2 ? ` border-bottom:10px solid ${this.esc(m.c2)};` : ''}"></span>${this.esc(m.name)}<br><b>${this.money(m.price)}</b>${k ? '' : ''}</td>`;
      const rowsOf = (list) => {
        const out = [];
        for (let i = 0; i < list.length; i += 6) out.push(`<tr>${list.slice(i, i + 6).map(tile).join('')}</tr>`);
        return out.join('');
      };
      main = `
        <h1 class="sv-h1">Книга образцов</h1>
        <p class="sv-note" style="margin-top:0;">Цена указана за одну стену или одну клетку пола.</p>
        <h2 class="sv-h2">Обои и краска (${Object.keys(S.WALLPAPERS || {}).length})</h2>
        <table class="sv-book">${rowsOf(Object.entries(S.WALLPAPERS || {}))}</table>
        <h2 class="sv-h2">Покрытия пола (${Object.keys(S.FLOORS || {}).length})</h2>
        <table class="sv-book">${rowsOf(Object.entries(S.FLOORS || {}))}</table>
      `;
    } else {
      const items = buyable.filter(o => (dept === 'all' || o.func === dept) && (room === 'all' || (o.rooms || []).includes(room))).sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
      const sel = buyable.find(o => o.key === this.selectedItemKey) || items[0] || buyable[0];
      const [palA, palB] = this.itemPalettes(sel);
      const a = palA[this.swatchA % palA.length];
      const b = palB[this.swatchB % palB.length];
      const deptName = dept === 'all' ? 'Все товары' : ((funcs.find(f => f[0] === dept) || [dept, dept])[1]);
      const roomName = room === 'all' ? '' : ((rooms.find(r => r[0] === room) || [room, room])[1]);
      main = `
        <h1 class="sv-h1">Торговый дом «Сансет»</h1>
        ${sel ? `
          <div class="sv-card"><table><tr>
            <td class="sv-card-pic">${this.renderItemPicture(sel, a, b)}<br><span class="sv-note">вид сверху, ${sel.size[0]}x${sel.size[1]} кл.</span></td>
            <td>
              <div class="sv-card-name">${this.esc(sel.name)}</div>
              <div class="sv-note">Артикул ${skuOf[sel.key]}. ${this.esc((S.FUNC_CATS[sel.func] || {}).name || '')}${(sel.rooms || []).length ? ', для комнат: ' + sel.rooms.map(r => this.esc(((S.ROOM_CATS || {})[r] || {}).name || r)).join(', ') : ''}</div>
              <p style="margin:6px 0;">${this.esc(sel.desc || '')}</p>
              <p style="margin:0 0 6px 0;"><b style="font-size:15px;">${this.money(sel.price)}</b>${this.itemSpecs(sel).length ? ' &nbsp; ' + this.itemSpecs(sel).map(s => this.esc(s)).join(', ') : ''}</p>
              <b>Расцветка Create-A-Style.</b> Основа:<br>
              ${palA.map((c, i) => `<button type="button" class="sv-chip${i === this.swatchA % palA.length ? ' is-on' : ''}" data-sv-swatch="a:${i}" title="${this.esc(c)}"><span style="background-color:${this.esc(c)};"></span></button>`).join('')}<br>
              Отделка:<br>
              ${palB.map((c, i) => `<button type="button" class="sv-chip${i === this.swatchB % palB.length ? ' is-on' : ''}" data-sv-swatch="b:${i}" title="${this.esc(c)}"><span style="background-color:${this.esc(c)};"></span></button>`).join('')}
            </td>
          </tr></table></div>
        ` : ''}
        <h2 class="sv-h2">${this.esc(deptName)}${roomName ? ', ' + this.esc(roomName) : ''}: ${items.length} ${this.plural(items.length, 'товар', 'товара', 'товаров')}</h2>
        ${items.length ? `
          <table class="sv-ware">
            ${items.map(o => `
              <tr class="${sel && o.key === sel.key ? 'is-sel' : ''}">
                <td class="sv-sku">${skuOf[o.key]}</td>
                <td class="sv-ware-name"><a class="sv-a" data-sv-item="${this.esc(o.key)}">${this.esc(o.name)}</a></td>
                <td class="sv-dots"></td>
                <td class="sv-price">${this.money(o.price)}</td>
              </tr>
            `).join('')}
          </table>
        ` : '<p>В этом отделе нет товаров для выбранной комнаты. Выберите «Любая» в списке комнат.</p>'}
      `;
    }
    return `
      <table class="sv-catalog"><tr>
        <td class="sv-index">${index}</td>
        <td class="sv-wares">${main}</td>
      </tr></table>
    `;
  }

  renderAlmanacPage() {
    const tab = ['careers', 'skills', 'cooking', 'nature'].includes(this.almanacTab) ? this.almanacTab : 'careers';
    const S = this.s3;
    const chapters = [
      ['careers', 'Глава I. Работа', `${Object.keys(S.CAREERS || {}).length} карьер, подработки и городские службы`],
      ['skills', 'Глава II. Навыки', `${Object.keys(S.SKILLS || {}).length} навыков и испытания`],
      ['cooking', 'Глава III. Кухня', `${Object.values(S.RECIPES || {}).filter(r => !r.hidden).length} рецептов и Амброзия`],
      ['nature', 'Глава IV. Природа', `${Object.keys(S.FISH || {}).length} рыб, растения и находки`]
    ];
    let inner = '';
    if (tab === 'skills') inner = this.renderAlmanacSkills();
    else if (tab === 'cooking') inner = this.renderAlmanacCooking();
    else if (tab === 'nature') inner = this.renderAlmanacNature();
    else inner = this.renderAlmanacCareers();
    return `
      <h1 class="sv-h1">Городской справочник</h1>
      <table class="sv-chapters"><tr>
        ${chapters.map(([k, t, sub]) => `<td class="${tab === k ? 'is-on' : ''}" data-sv-almanac-tab="${k}"><b>${this.esc(t)}</b>${this.esc(sub)}</td>`).join('')}
      </tr></table>
      ${inner}
    `;
  }

  fmtReq(req) {
    const skills = this.s3.SKILLS || {};
    const list = Object.entries(req || {});
    if (!list.length) return '';
    return list.map(([sk, lv]) => `${(skills[sk] && skills[sk].name) || sk} ${lv}`).join(', ');
  }

  fmtDays(days) {
    const names = this.s3.DAY_SHORT || ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return (days || []).map((v, i) => (v ? names[i] : null)).filter(Boolean).join(' ');
  }

  ladder(levels, firstNo) {
    const rows = levels.map((lv, i) => ({ lv, no: firstNo + i })).reverse();
    return `
      <table class="sv-ladder">
        ${rows.map(({ lv, no }) => `
          <tr>
            <td class="sv-rung">${no}</td>
            <td><b>${this.esc(lv.t)}</b><br><span class="sv-note">с ${lv.start}:00, ${lv.hours} ч</span></td>
            <td class="sv-pay">${this.money(lv.pay)}/ч</td>
            <td class="sv-req">${this.esc(this.fmtReq(lv.req))}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  renderAlmanacCareers() {
    const S = this.s3;
    const careers = S.CAREERS || {};
    const town = this.getTownModel();
    const c = careers[this.selectedCareerKey] || Object.values(careers)[0];
    const place = c ? Object.values(town.lots).find(l => l.rh === c.place) : null;
    return `
      <div class="sv-careers">
        Профессия:
        ${Object.entries(careers).map(([k, cr]) => (c === cr
          ? `<span class="is-on">${this.esc(cr.name)}</span>`
          : `<a class="sv-a" data-sv-career="${this.esc(k)}">${this.esc(cr.name)}</a>`)).join(' | ')}
      </div>
      ${c ? `
        <h2 class="sv-h2">${this.esc(c.name)}</h2>
        <p style="margin:0 0 6px 0;">${this.esc(c.desc || '')}</p>
        <p class="sv-note" style="margin:0 0 8px 0;">Место работы: ${place ? `<a class="sv-a" data-url="${this.url('/map?lot=' + place.key)}">${this.esc(place.name)}</a>, ${this.esc(place.address)}` : this.esc(c.place)}. Рабочие дни: ${this.esc(this.fmtDays(c.days))}. При повышении премия равна пяти часам новой ставки.</p>
        ${c.branches ? `
          <p style="margin:0 0 4px 0;"><b>С 6-й ступени профессия делится на две ветки:</b></p>
          <table class="sv-branches"><tr>
            ${Object.values(c.branches).map(br => `<td><b>${this.esc(br.name)}</b>${this.ladder(br.levels || [], 6)}</td>`).join('')}
          </tr></table>
          <b>Общие ступени</b>
          ${this.ladder(c.levels || [], 1)}
        ` : this.ladder(c.levels || [], 1)}
      ` : ''}
      <h2 class="sv-h2">Подработки</h2>
      <table class="sv-grid">
        <tr><th>Место</th><th>Должности</th><th>Ставка</th><th>Начало смены</th></tr>
        ${Object.values(S.PART_TIME || {}).map(p => {
          const lot = town.lots.find(l => l.rh === p.place);
          return `<tr><td><b>${this.esc(lot ? lot.name : p.name)}</b></td><td>${p.levels.map(l => this.esc(l.t)).join(', ')}</td><td>${p.levels.map(l => this.money(l.pay)).join(', ')} в час</td><td>${p.levels[0] ? p.levels[0].start : ''}:00</td></tr>`;
        }).join('')}
      </table>
      <h2 class="sv-h2">Как работать на смене</h2>
      <table class="sv-grid">
        <tr><th>Режим</th><th>Успеваемость</th><th>Усталость</th></tr>
        ${Object.values(S.WORK_TONES || {}).map(t => `<tr><td>${this.esc(t.name)}</td><td>x${t.perf}</td><td>x${t.energy}</td></tr>`).join('')}
      </table>
      <h2 class="sv-h2">Городские службы</h2>
      <table class="sv-grid">
        <tr><th>Служба</th><th>Цена</th><th>Когда</th><th>Что делает</th></tr>
        ${this.data.services.map((s, i) => `<tr class="${i % 2 ? 'is-alt' : ''}"><td><b>${this.esc(s.name)}</b></td><td>${this.esc(s.cost)}</td><td>${this.esc(s.when)}</td><td>${this.esc(s.details)}</td></tr>`).join('')}
      </table>
    `;
  }

  renderAlmanacSkills() {
    const S = this.s3;
    const ch = S.SKILL_CHALLENGES || {};
    return `
      <table class="sv-grid">
        <tr><th>Навык</th><th>Что даёт</th><th>Уровни</th><th>Испытание</th></tr>
        ${Object.entries(S.SKILLS || {}).map(([k, s], i) => {
          const list = Array.isArray(ch[k]) ? ch[k] : (ch[k] ? [ch[k]] : []);
          return `
            <tr class="${i % 2 ? 'is-alt' : ''}">
              <td><b>${this.esc(s.name)}</b></td>
              <td>${this.esc(s.desc)}</td>
              <td>${Object.entries(s.unlock || {}).map(([lv, t]) => `${lv}: ${this.esc(t)}`).join('<br>')}</td>
              <td>${list.map(c => `<b>${this.esc(c.name)}</b>. ${this.esc(c.desc)}${c.reward ? ` Награда: ${this.esc(c.reward)}.` : ''}`).join('<br>')}</td>
            </tr>
          `;
        }).join('')}
      </table>
    `;
  }

  ingredientName(key) {
    const S = this.s3;
    if (S.PLANTS && S.PLANTS[key]) return S.PLANTS[key].name;
    if (S.FISH && S.FISH[key]) return S.FISH[key].name;
    if (key === 'fish') return 'любая рыба';
    return key;
  }

  renderAlmanacCooking() {
    const S = this.s3;
    const meals = { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин' };
    const tools = { none: 'Без плиты', stove: 'Плита', grill: 'Гриль' };
    const list = Object.entries(S.RECIPES || {}).filter(([, r]) => !r.hidden).map(([key, r]) => Object.assign({ key }, r)).sort((a, b) => a.lvl - b.lvl || a.cost - b.cost);
    return `
      <div class="sv-recipe-box">
        <b>Амброзия.</b> Кулинария 10. Продукты: Плод жизни (садоводство 7, редкое семя) и Рыба смерти (рыбалка 10, пруд кладбища, с 20:00 до 6:00). Наполняет все потребности и обнуляет прожитые дни стадии жизни. Пожилой сим однажды пропустит смерть. <a class="sv-a" data-url="${this.url('/news?id=ambrosia-secret')}">Статья в «Вестнике»</a>
      </div>
      <table class="sv-grid">
        <tr><th>Кулинария</th><th>Блюдо</th><th>Когда</th><th>Где готовят</th><th>Сытость</th><th>Продукты</th><th>Особые продукты</th></tr>
        ${list.map((r, i) => `
          <tr class="${r.key === 'ambrosia' ? 'is-gold' : (i % 2 ? 'is-alt' : '')}">
            <td align="center">${r.lvl}</td>
            <td><b>${this.esc(r.name)}</b>${r.veg ? ' <span class="sv-note">(вегетарианское)</span>' : ''}</td>
            <td>${this.esc(meals[r.meal] || r.meal)}</td>
            <td>${this.esc(tools[r.cook] || r.cook)}</td>
            <td align="right">${r.hunger}</td>
            <td align="right">${this.money(r.cost)}</td>
            <td>${(r.ing || []).map(k => this.esc(this.ingredientName(k))).join(', ')}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  renderAlmanacNature() {
    const S = this.s3;
    const where = { pond: 'пруды', sea: 'море', grave: 'пруд кладбища' };
    const kinds = { gem: 'Самоцвет', metal: 'Металл', space: 'Метеорит' };
    return `
      <h2 class="sv-h2">Рыбы</h2>
      <p class="sv-note" style="margin:0 0 6px 0;">Морская рыба ловится с пляжа, пирса и у маяка. Пруды есть в Центральном парке и на кладбище. Рыба смерти клюёт только ночью.</p>
      <table class="sv-grid">
        <tr><th>Рыбалка</th><th>Рыба</th><th>Где</th><th>Вес, кг</th><th>Цена</th></tr>
        ${Object.entries(S.FISH || {}).map(([k, f], i) => `
          <tr class="${k === 'deathfish' ? 'is-gold' : (i % 2 ? 'is-alt' : '')}">
            <td align="center">${f.lvl}</td>
            <td><b>${this.esc(f.name)}</b></td>
            <td>${(Array.isArray(f.where) ? f.where : [f.where]).map(w => this.esc(where[w] || w)).join(', ')}${k === 'deathfish' ? ', 20:00–6:00' : ''}</td>
            <td>${Array.isArray(f.w) ? `${f.w[0]}–${f.w[1]}` : ''}</td>
            <td align="right">${this.money(f.value)}</td>
          </tr>
        `).join('')}
      </table>
      <h2 class="sv-h2">Сад и огород</h2>
      <table class="sv-grid">
        <tr><th>Садоводство</th><th>Растение</th><th>Созревает</th><th>Цена урожая</th><th>Семена</th></tr>
        ${Object.entries(S.PLANTS || {}).map(([k, p], i) => `
          <tr class="${p.rare ? 'is-gold' : (i % 2 ? 'is-alt' : '')}">
            <td align="center">${p.lvl}</td>
            <td><b>${this.esc(p.name)}</b></td>
            <td>${p.days} дн.</td>
            <td align="right">${p.value ? this.money(p.value) : 'симолеоны с веток'}</td>
            <td>${p.reward ? 'награда за 15 000 очков счастья' : (p.rare ? 'редкое семя, появляется по понедельникам' : 'супермаркет «Корзинка»')}</td>
          </tr>
        `).join('')}
      </table>
      <h2 class="sv-h2">Находки</h2>
      <p class="sv-note" style="margin:0 0 6px 0;">Самоцветы и металлы лежат на земле в общественных местах. Научный центр Ландграаба покупает их.</p>
      <table class="sv-grid">
        <tr><th>Находка</th><th>Вид</th><th>Редкость</th><th>Цена</th></tr>
        ${Object.values(S.COLLECT || {}).map((c, i) => `<tr class="${i % 2 ? 'is-alt' : ''}"><td><span class="sv-swatch" style="background-color:${this.esc(c.color || '#999999')};"></span> <b>${this.esc(c.name)}</b></td><td>${this.esc(kinds[c.kind] || c.kind)}</td><td>${'*'.repeat((c.rare || 0) + 1)}</td><td align="right">${this.money(c.value)}</td></tr>`).join('')}
      </table>
    `;
  }

  renderBoxArt() {
    return `
      <svg width="170" height="220" viewBox="0 0 170 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Коробка The Sims 3">
        <rect x="0" y="0" width="170" height="220" fill="#ffffff"/>
        <rect x="6" y="6" width="158" height="208" fill="#003366" stroke="#000000" stroke-width="2"/>
        <rect x="6" y="6" width="158" height="22" fill="#33cc33"/>
        <text x="14" y="22" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#000000">MAXIS</text>
        <text x="156" y="22" font-family="Arial, sans-serif" font-size="9" fill="#000000" text-anchor="end">Win 98</text>
        <rect x="6" y="120" width="158" height="16" fill="#ff9933"/>
        <rect x="6" y="136" width="158" height="12" fill="#ffcc66"/>
        <rect x="6" y="148" width="158" height="66" fill="#336699"/>
        <rect x="30" y="156" width="40" height="30" fill="#ffffff" stroke="#000000" stroke-width="1"/>
        <polygon points="26,156 50,140 74,156" fill="#cc3333" stroke="#000000" stroke-width="1"/>
        <rect x="44" y="170" width="10" height="16" fill="#996633"/>
        <rect x="96" y="160" width="50" height="26" fill="#ffcc99" stroke="#000000" stroke-width="1"/>
        <polygon points="92,160 121,146 150,160" fill="#663366" stroke="#000000" stroke-width="1"/>
        <rect x="6" y="186" width="158" height="6" fill="#999999"/>
        <g transform="translate(70 34) scale(0.75)">
          <polygon points="20,2 36,27 20,27" fill="#66ff66" stroke="#003300" stroke-width="1.5"/>
          <polygon points="20,2 4,27 20,27" fill="#33cc33" stroke="#003300" stroke-width="1.5"/>
          <polygon points="20,52 36,27 20,27" fill="#009900" stroke="#003300" stroke-width="1.5"/>
          <polygon points="20,52 4,27 20,27" fill="#006600" stroke="#003300" stroke-width="1.5"/>
        </g>
        <text x="85" y="100" font-family="Georgia, serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">The Sims 3</text>
        <text x="85" y="115" font-family="Verdana, sans-serif" font-size="8" fill="#ffffcc" text-anchor="middle">Симулятор жизни в открытом городе</text>
        <text x="85" y="206" font-family="Verdana, sans-serif" font-size="8" fill="#ffffff" text-anchor="middle">3 CD-ROM. Нужен 3D-ускоритель</text>
      </svg>
    `;
  }

  renderMaxisPage() {
    const d = this.data;
    const S = this.s3;
    const st = this.renderSteamState();
    const { cat } = this.getSteamStatus();
    const shots = (cat.shots || []).slice(0, 2);
    return `
      <table class="sv-product"><tr>
        <td style="width:176px;">${this.renderBoxArt()}</td>
        <td>
          <p class="sv-product-title">The Sims 3</p>
          <p class="sv-product-sub">Сансет Вэлли целиком: 39 участков, 10 семей и ни одного экрана загрузки между домом и маяком.</p>
          <div class="sv-steam-state">${st.text}</div>
          ${st.buttons}
          <table class="sv-shots" style="margin-top:10px;"><tr>
            ${shots.map((s, i) => `<td><img src="content/steam/sims3-${i + 1}.jpg" width="160" height="120" alt="${this.esc(s)}"><br>${this.esc(s)}</td>`).join('')}
          </tr></table>
        </td>
      </tr></table>

      <table class="sv-cols"><tr>
        <td>
          <h2 class="sv-h2">Клавиши</h2>
          <table class="sv-keys">
            ${d.controls.map(([keys, what]) => `<tr><td style="width:150px;">${keys.map(k => `<span class="sv-key">${this.esc(k)}</span>`).join(' ')}</td><td>${this.esc(what)}</td></tr>`).join('')}
          </table>
          <h2 class="sv-h2">Пульт отладки F7</h2>
          <p style="margin:0 0 6px 0;">Открывается в режиме жизни. Перемотка времени честная: симы проживают пропущенные часы.</p>
          <table class="sv-keys">
            ${d.debug.map(([k, v]) => `<tr><td style="width:150px;"><b>${this.esc(k)}</b></td><td>${this.esc(v)}</td></tr>`).join('')}
          </table>
        </td>
        <td class="sv-side">
          <div class="sv-panel">
            <div class="sv-panel-head">Системные требования</div>
            <div class="sv-panel-body">
              <table class="sv-keys">${d.site.studio.sysreq.map(([k, v]) => `<tr><td><b>${this.esc(k)}</b></td><td>${this.esc(v)}</td></tr>`).join('')}</table>
            </div>
          </div>
          <div class="sv-panel">
            <div class="sv-panel-head">Длина жизни, дней</div>
            <div class="sv-panel-body">
              <table class="sv-keys">
                <tr><td></td>${Object.values(S.LIFESPANS || {}).map(l => `<td><b>${this.esc(l.name)}</b></td>`).join('')}</tr>
                ${['baby', 'toddler', 'child', 'teen', 'ya', 'adult', 'elder'].map(a => `<tr><td>${this.esc(this.ageName(a))}</td>${Object.values(S.LIFESPANS || {}).map(l => `<td align="right">${(l.stages || {})[a] || 0}</td>`).join('')}</tr>`).join('')}
              </table>
              <p class="sv-note" style="margin:4px 0 0 0;">Старость может продлиться немного дольше указанного.</p>
            </div>
          </div>
          <div class="sv-panel">
            <div class="sv-panel-head">О студии</div>
            <div class="sv-panel-body">
              <b>${this.esc(d.site.studio.name)}</b><br>
              ${this.esc(d.site.studio.founded)}<br><br>
              Движок: ${this.esc(d.site.studio.engine)}.
            </div>
          </div>
        </td>
      </tr></table>
    `;
  }

  getGuestbookEntries() {
    const seeds = (this.data && this.data.guestbookSeeds) ? this.data.guestbookSeeds.slice() : [];
    try {
      const saved = JSON.parse(localStorage.getItem(this.guestbookStorageKey) || 'null');
      if (Array.isArray(saved) && saved.length) return saved.concat(seeds);
    } catch (e) {}
    return seeds;
  }

  addGuestbookEntry(name, town, text) {
    const cleanText = String(text || '').trim();
    if (!cleanText) return false;
    try {
      const saved = JSON.parse(localStorage.getItem(this.guestbookStorageKey) || '[]');
      const list = Array.isArray(saved) ? saved : [];
      list.unshift({
        name: String(name || '').trim() || 'Гость',
        town: String(town || '').trim() || 'не указан',
        date: this.data.site.date,
        text: cleanText.slice(0, 1000)
      });
      localStorage.setItem(this.guestbookStorageKey, JSON.stringify(list));
    } catch (e) {}
    return true;
  }

  renderLettersPage() {
    const town = this.getTownModel();
    const entries = this.getGuestbookEntries();
    return `
      <h1 class="sv-h1">Приёмная мэрии</h1>
      <p style="margin:0 0 10px 0;">Жители пишут в мэрию, а отвечают городские службы. Свой вопрос можно отправить через Outlook Express на адрес <a href="mailto:mayor@sunsetvalley98.com">mayor@sunsetvalley98.com</a>.</p>
      ${(this.data.letters || []).map(l => {
        const lot = l.lot ? town.lotByKey[l.lot] : null;
        return `
          <div class="sv-letter">
            <div class="sv-letter-head"><b>От:</b> ${this.esc(l.from)}${lot ? `, ${this.esc(lot.name)} (${this.esc(lot.address)})` : ''}<br><b>Дата:</b> ${this.esc(l.date)} &nbsp; <b>Тема:</b> ${this.esc(l.topic)}</div>
            <div class="sv-letter-q">${this.esc(l.q)}</div>
            <div class="sv-letter-a"><span class="sv-stamp">ОТВЕЧЕНО</span><b>${this.esc(l.signed)}:</b> ${this.esc(l.a)}</div>
          </div>
        `;
      }).join('')}

      <h2 class="sv-h2">Гостевая книга (${entries.length} ${this.plural(entries.length, 'запись', 'записи', 'записей')})</h2>
      ${entries.map(e => `
        <table class="sv-gb"><tr>
          <td class="sv-gb-who"><b>${this.esc(e.name)}</b><br>${this.esc(e.town)}<br>${this.esc(e.date)}</td>
          <td>${this.esc(e.text)}</td>
        </tr></table>
      `).join('')}
      <div class="sv-gb-form">
        <b>Подпишите гостевую книгу</b>
        <table>
          <tr><td>Имя:</td><td><input type="text" id="sv-gb-name" class="sv-input" size="24"></td></tr>
          <tr><td>Откуда:</td><td><input type="text" id="sv-gb-town" class="sv-input" size="24"></td></tr>
          <tr><td valign="top">Запись:</td><td><textarea id="sv-gb-text" class="sv-textarea" rows="4" cols="50"></textarea></td></tr>
          <tr><td></td><td><button type="button" class="sv-btn sv-btn-go" data-sv-action="gb-submit">Подписать</button></td></tr>
        </table>
      </div>
    `;
  }

  searchSiteData(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    const S = this.s3;
    const town = this.getTownModel();
    const out = [];
    const add = (kind, title, url, snippet) => out.push({ kind, title, url, snippet });
    for (const a of this.data.news || []) {
      if (`${a.title} ${a.lead} ${a.body.join(' ')} ${(a.facts || []).join(' ')}`.toLowerCase().includes(q)) add('Вестник', a.title, this.url('/news?id=' + a.id), a.lead);
    }
    for (const f of town.families) {
      if (this.familyHay(f).includes(q)) add('Перепись', `Семья ${f.name}`, this.url('/census?family=' + f.key), f.bio);
    }
    for (const l of town.lots) {
      if (`${l.name} ${l.address} ${l.desc || ''} ${l.rhObj ? l.rhObj.name : ''}`.toLowerCase().includes(q)) add('Кадастр', `Участок № ${l.id + 1}: ${l.name}`, this.url('/map?lot=' + l.key), `${l.address}. ${this.zoneLabel(l)}, оценка ${this.money(l.price)}.`);
    }
    for (const t of Object.values(S.TRAITS || {})) {
      if (`${t.name} ${t.desc}`.toLowerCase().includes(q)) add('Паспортный стол', `Черта «${t.name}»`, this.url('/cas'), t.desc);
    }
    for (const [k, c] of Object.entries(S.CAREERS || {})) {
      const titles = (c.levels || []).concat(...Object.values(c.branches || {}).map(b => b.levels || [])).map(l => l.t).join(', ');
      if (`${c.name} ${c.desc} ${titles}`.toLowerCase().includes(q)) add('Справочник', `Профессия «${c.name}»`, this.url('/almanac?career=' + k), c.desc);
    }
    for (const r of Object.values(S.RECIPES || {})) {
      if (!r.hidden && r.name.toLowerCase().includes(q)) add('Справочник', `Рецепт «${r.name}»`, this.url('/almanac?tab=cooking'), `Кулинария ${r.lvl}, сытость ${r.hunger}.`);
    }
    for (const f of Object.values(S.FISH || {})) {
      if (f.name.toLowerCase().includes(q)) add('Справочник', f.name, this.url('/almanac?tab=nature'), `Рыбалка ${f.lvl}, цена ${this.money(f.value)}.`);
    }
    for (const p of Object.values(S.PLANTS || {})) {
      if (p.name.toLowerCase().includes(q)) add('Справочник', p.name, this.url('/almanac?tab=nature'), `Садоводство ${p.lvl}, созревает ${p.days} дн.`);
    }
    for (const o of this.buyableObjects()) {
      if (`${o.name} ${o.desc || ''}`.toLowerCase().includes(q)) add('Торговый дом', `${o.name}, ${this.money(o.price)}`, this.url('/catalog?item=' + o.key), o.desc || '');
    }
    return out;
  }

  renderSearchPage(query) {
    const results = this.searchSiteData(query);
    return `
      <h1 class="sv-h1">Поиск по городу</h1>
      <p style="margin:0 0 10px 0;">Запрос: <b>${this.esc(query || '')}</b>. Найдено: <b>${results.length}</b>.</p>
      ${results.length ? `
        <ol class="sv-results">
          ${results.slice(0, 60).map(r => `
            <li>
              <a class="sv-a" data-url="${this.esc(r.url)}"><b>${this.esc(r.title)}</b></a> <span class="sv-note">[${this.esc(r.kind)}]</span><br>
              ${this.esc(r.snippet)}<br>
              <span class="sv-url">${this.esc(r.url)}</span>
            </li>
          `).join('')}
        </ol>
      ` : `<p>${query ? 'Ничего не найдено.' : 'Введите слово в поле поиска.'} Попробуйте: <a class="sv-a" data-url="${this.url('/search?q=' + encodeURIComponent('Гот'))}">Гот</a>, <a class="sv-a" data-url="${this.url('/search?q=' + encodeURIComponent('Амброзия'))}">Амброзия</a>, <a class="sv-a" data-url="${this.url('/search?q=' + encodeURIComponent('маяк'))}">маяк</a>, <a class="sv-a" data-url="${this.url('/search?q=' + encodeURIComponent('кровать'))}">кровать</a>.</p>`}
    `;
  }

  syncCasInputs(container) {
    const val = id => {
      const el = container.querySelector('#' + id);
      return el && typeof el.value === 'string' ? el.value : '';
    };
    const first = val('sv-cas-first').trim();
    const last = val('sv-cas-last').trim();
    if (first) this.casFirst = first;
    if (last) this.casLast = last;
    if (val('sv-cas-age')) this.casAge = val('sv-cas-age');
    if (val('sv-cas-zodiac')) this.casZodiac = val('sv-cas-zodiac');
    if (val('sv-cas-lifespan')) this.casLifespan = val('sv-cas-lifespan');
    if (val('sv-cas-ltw')) this.casLtw = val('sv-cas-ltw');
    this.fitTraitsToAge();
  }

  fitTraitsToAge() {
    const traitsMap = this.s3.TRAITS || {};
    const before = this.casTraits.length;
    this.casTraits = this.casTraits.filter(k => !this.traitTooOld(traitsMap[k])).slice(0, this.maxTraits());
    if (this.casTraits.length < before) {
      this.casNotice = `Для возраста «${this.ageName(this.casAge)}» лишние черты сняты.`;
      this.casNoticeOk = false;
    }
  }

  loadSim(famKey, first) {
    const fam = this.getTownModel().famByKey[famKey];
    const sim = fam ? fam.sims.find(s => s.first === first) : null;
    if (!sim) return false;
    this.casFirst = sim.first;
    this.casLast = sim.last || fam.name;
    this.casAge = ['child', 'teen', 'ya', 'adult', 'elder'].includes(sim.age) ? sim.age : 'child';
    this.casTraits = Array.isArray(sim.traits) ? sim.traits.slice(0, 5) : [];
    if (sim.ltw) this.casLtw = sim.ltw;
    this.casNotice = `Загружена анкета жителя: ${this.casFirst} ${this.casLast}, семья ${fam.name}.`;
    this.casNoticeOk = true;
    return true;
  }

  attachEvents(win, container, ieInstance) {
    const ie = (ieInstance && typeof ieInstance.renderPage === 'function') ? ieInstance : (typeof window !== 'undefined' ? window.appIE : null);
    const click = () => {
      if (typeof window !== 'undefined' && window.soundSys && typeof window.soundSys.playClick === 'function') window.soundSys.playClick();
    };
    const go = (path) => {
      if (ie && win) ie.navigate(win, this.url(path));
    };
    const refresh = () => {
      if (!ie || !win) return;
      const top = container.scrollTop || 0;
      ie.renderPage(win, ie.currentUrl || this.baseUrl);
      container.scrollTop = top;
    };
    const on = (sel, fn) => container.querySelectorAll(sel).forEach(el => el.addEventListener('click', (e) => {
      if (e && e.preventDefault) e.preventDefault();
      click();
      fn(el);
    }));

    const searchForm = container.querySelector('#sv-search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const inp = container.querySelector('#sv-search-input');
        go('/search?q=' + encodeURIComponent(inp && inp.value ? inp.value.trim() : ''));
      });
    }

    const censusForm = container.querySelector('#sv-census-form');
    if (censusForm) {
      censusForm.addEventListener('submit', (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const inp = container.querySelector('#sv-census-input');
        this.censusQuery = inp && inp.value ? inp.value.trim() : '';
        refresh();
      });
    }

    on('[data-sv-action]', (el) => {
      const act = el.dataset.svAction;
      const gm = this.gm;
      if (act === 'steam-open') {
        if (gm && typeof gm.showInSteam === 'function') gm.showInSteam('sims3');
      } else if (act === 'game-launch') {
        if (gm && gm.catalog && gm.catalog.sims3 && typeof gm.catalog.sims3.launch === 'function') gm.catalog.sims3.launch();
      } else if (act === 'poll-reset') {
        this.resetPoll();
        refresh();
      } else if (act === 'calc-budget') {
        const inp = container.querySelector('#sv-budget-input');
        const v = parseInt(String(inp && inp.value ? inp.value : '').replace(/\D/g, ''), 10);
        this.budgetSimoleons = Math.max(0, Math.min(10000000, v || this.startFunds));
        refresh();
      } else if (act === 'census-clear') {
        this.censusQuery = '';
        refresh();
      } else if (act === 'export-cas') {
        this.syncCasInputs(container);
        this.exportCasToNotepad();
        refresh();
      } else if (act === 'clear-cas') {
        this.syncCasInputs(container);
        this.casTraits = [];
        this.casNotice = '';
        refresh();
      } else if (act === 'gb-submit') {
        const v = id => {
          const el = container.querySelector('#' + id);
          return el ? el.value : '';
        };
        if (this.addGuestbookEntry(v('sv-gb-name'), v('sv-gb-town'), v('sv-gb-text'))) refresh();
      }
    });

    on('[data-sv-vote]', (el) => {
      this.votePoll(el.dataset.svVote);
      refresh();
    });

    on('[data-sv-lot]', (el) => {
      this.selectedLotKey = el.dataset.svLot;
      go('/map?lot=' + encodeURIComponent(this.selectedLotKey));
    });

    on('[data-sv-zone]', (el) => {
      this.mapZone = el.dataset.svZone;
      refresh();
    });

    on('[data-sv-family]', (el) => {
      this.selectedFamilyKey = el.dataset.svFamily;
      go('/census?family=' + encodeURIComponent(this.selectedFamilyKey));
    });

    on('[data-sv-load-sim]', (el) => {
      const [famKey, first] = String(el.dataset.svLoadSim || '').split(':');
      this.loadSim(famKey, first);
      go('/cas');
    });

    on('[data-sv-trait]', (el) => {
      this.syncCasInputs(container);
      this.toggleTrait(el.dataset.svTrait);
      refresh();
    });

    on('[data-sv-ltw]', (el) => {
      this.syncCasInputs(container);
      this.casLtw = el.dataset.svLtw;
      refresh();
    });

    ['#sv-cas-ltw', '#sv-cas-age', '#sv-cas-zodiac', '#sv-cas-lifespan'].forEach(sel => {
      const el = container.querySelector(sel);
      if (el) {
        el.addEventListener('change', () => {
          this.syncCasInputs(container);
          refresh();
        });
      }
    });

    on('[data-sv-dept]', (el) => {
      this.catalogDept = el.dataset.svDept;
      go('/catalog?dept=' + encodeURIComponent(this.catalogDept));
    });

    on('[data-sv-room]', (el) => {
      this.catalogRoom = el.dataset.svRoom;
      refresh();
    });

    on('[data-sv-item]', (el) => {
      const dept = this.catalogDept === 'all' || this.catalogDept === 'materials' ? '' : 'dept=' + encodeURIComponent(this.catalogDept) + '&';
      go('/catalog?' + dept + 'item=' + encodeURIComponent(el.dataset.svItem));
    });

    on('[data-sv-swatch]', (el) => {
      const [ch, idx] = String(el.dataset.svSwatch || '').split(':');
      const n = parseInt(idx, 10) || 0;
      if (ch === 'b') this.swatchB = n;
      else this.swatchA = n;
      refresh();
    });

    on('[data-sv-almanac-tab]', (el) => {
      this.almanacTab = el.dataset.svAlmanacTab;
      go('/almanac?tab=' + encodeURIComponent(this.almanacTab));
    });

    on('[data-sv-career]', (el) => {
      this.selectedCareerKey = el.dataset.svCareer;
      go('/almanac?career=' + encodeURIComponent(this.selectedCareerKey));
    });
  }
}

if (typeof window !== 'undefined') {
  window.sunsetValleySite = new SunsetValleySite();
}
if (typeof globalThis !== 'undefined') {
  globalThis.sunsetValleySite = (typeof window !== 'undefined' && window.sunsetValleySite) || new SunsetValleySite();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SunsetValleySite;
}
