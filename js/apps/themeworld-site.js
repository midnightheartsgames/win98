class ThemeWorldSite {
  constructor() {
    this.baseUrl = 'http://www.themeworld98.com';
    this.hitCountKey = 'win98_themeworld_hits';
    this.userKey = 'win98_themeworld_user_v2';
    this.legacyGuestbookKey = 'win98_themeworld_guestbook';
    this.modemKey = 'win98_themeworld_modem';
    this.legacySeeds = ['Neo_99|18 Nov 1999', 'Admin_Dima|02 Nov 1999', 'Voodoo_Gamer|24 Oct 1999', 'CyberGirl98|15 Sep 1999'];
    this.matrixThumbs = {};
    this.matrixPending = {};
    this.notice = null;
    this.gbDraft = { name: '', from: '', text: '' };
    this.view = null;
    this.previewTimer = null;
    this.initHitCounter();
  }

  get data() {
    return (typeof window !== 'undefined' && window.themeworldData) || {};
  }

  store() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) {}
    return null;
  }

  initHitCounter() {
    const ls = this.store();
    let count = 184920;
    try {
      if (ls) {
        const saved = parseInt(ls.getItem(this.hitCountKey), 10);
        if (!isNaN(saved)) count = saved;
        count++;
        ls.setItem(this.hitCountKey, String(count));
      } else {
        count++;
      }
    } catch (e) {
      count = 184921;
    }
    this.hitCount = count;
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

  escapeHtml(str) {
    return this.esc(str);
  }

  int(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  bytes(n) {
    if (n < 1024) return `${n} байт`;
    if (n < 1024 * 1024) return `${this.int(n / 1024)} КБ`;
    return `${(n / 1048576).toFixed(2).replace('.', ',')} МБ`;
  }

  duration(sec) {
    const s = Math.max(1, Math.round(sec));
    if (s < 60) return `${s} с`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} мин ${s % 60} с`;
    return `${Math.floor(m / 60)} ч ${m % 60} мин`;
  }

  legacyPath(tab) {
    const map = { wallpapers: '/wallpapers', screensavers: '/screensavers', themes: '/themes', packs: '/packs', guestbook: '/guestbook' };
    return map[tab] || '/';
  }

  parseUrl(url) {
    let raw = String(url || this.baseUrl).trim();
    if (!/^[a-z]+:/i.test(raw)) raw = 'http://' + raw;
    const noProto = raw.replace(/^[a-z]+:\/{2}/i, '');
    const cut = noProto.search(/[/?#]/);
    const host = (cut < 0 ? noProto : noProto.slice(0, cut)).toLowerCase();
    let rest = cut < 0 ? '' : noProto.slice(cut);
    rest = rest.split('#')[0];
    const qi = rest.indexOf('?');
    let path = (qi < 0 ? rest : rest.slice(0, qi)).toLowerCase().replace(/\/+$/, '').replace(/\.html?$/, '');
    const params = {};
    if (qi >= 0) {
      rest.slice(qi + 1).split('&').forEach(pair => {
        if (!pair) return;
        const eq = pair.indexOf('=');
        const k = eq < 0 ? pair : pair.slice(0, eq);
        const v = eq < 0 ? '' : pair.slice(eq + 1);
        try {
          params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
        } catch (e) {
          params[k] = v;
        }
      });
    }
    if (!path || path === '/index') {
      if (params.tab) path = this.legacyPath(params.tab);
      else if (params.q !== undefined) path = '/search';
      else if (host.includes('screensaver')) path = '/screensavers';
      else if (host.includes('wallpapers98')) path = '/wallpapers';
      else if (host.includes('themes98') || host.includes('win98themes')) path = '/themes';
      else path = '/';
    }
    if (host.includes('matrix-screensaver') && path === '/screensavers' && !params.id) params.id = 'matrix';
    const sections = {
      '/': 'home',
      '/wallpapers': 'wallpapers',
      '/wallpaper': 'wallpaper',
      '/screensavers': 'screensavers',
      '/screensaver': 'screensavers',
      '/themes': 'themes',
      '/theme': 'theme',
      '/packs': 'packs',
      '/help': 'help',
      '/faq': 'help',
      '/guestbook': 'guestbook',
      '/search': 'search'
    };
    return { host, path, params, section: sections[path] || 'notfound' };
  }

  getPageTitle(url) {
    const { section, params } = this.parseUrl(url);
    const name = "ThemeWorld '98";
    const item = (list, id) => (this.data[list] || []).find(x => x.id === id);
    switch (section) {
      case 'home': return `${name} - Обои, заставки и темы для Win 98`;
      case 'wallpapers': return `${name} - Обои`;
      case 'wallpaper': {
        const w = item('wallpapers', params.id);
        return w ? `${name} - ${w.file}` : `${name} - Обои`;
      }
      case 'screensavers': return `${name} - Заставки`;
      case 'themes': return `${name} - Темы`;
      case 'theme': {
        const t = item('themes', params.id);
        return t ? `${name} - ${t.file}` : `${name} - Темы`;
      }
      case 'packs': return `${name} - Сборники`;
      case 'help': return `${name} - Помощь`;
      case 'guestbook': return `${name} - Гостевая книга`;
      case 'search': return `${name} - Поиск`;
      default: return '404 Not Found';
    }
  }

  dialogs() {
    return typeof window !== 'undefined' ? window.appDialogs : null;
  }

  settings() {
    const d = this.dialogs();
    if (d && typeof d.getDisplaySettings === 'function') return d.getDisplaySettings();
    return { wallpaper: 'none', bgColor: '#008080', screensaverMode: 'pipes', themeId: 'classic' };
  }

  downloadedList(type) {
    const d = this.dialogs();
    if (!d) return [];
    if (type === 'wallpaper' && d.getDownloadedWallpapers) return d.getDownloadedWallpapers();
    if (type === 'screensaver' && d.getDownloadedScreensavers) return d.getDownloadedScreensavers();
    if (type === 'theme' && d.getDownloadedThemes) return d.getDownloadedThemes();
    return [];
  }

  currentThemeId() {
    const th = typeof window !== 'undefined' ? window.appThemes : null;
    if (th && th.currentThemeId) return th.currentThemeId;
    return this.settings().themeId || 'classic';
  }

  state(type, id) {
    const s = this.settings();
    const item = this.find(type, id);
    if (type === 'wallpaper' && s.wallpaper === id) return 'applied';
    if (type === 'screensaver' && s.screensaverMode === id) return 'applied';
    if (type === 'theme' && this.currentThemeId() === id) return 'applied';
    if (item && (item.builtin || item.official)) return 'builtin';
    if (this.downloadedList(type).includes(id)) return 'downloaded';
    return 'new';
  }

  stateLabel(type, id) {
    const st = this.state(type, id);
    if (st === 'applied') return '<span class="tw-st tw-st-on">стоит у вас</span>';
    if (st === 'downloaded') return '<span class="tw-st">скачано</span>';
    if (st === 'builtin') return `<span class="tw-st">${type === 'theme' ? 'есть в Plus! 98' : 'есть в Win 98'}</span>`;
    return '';
  }

  canApply(type, id) {
    return this.state(type, id) !== 'new';
  }

  find(type, id) {
    const list = { wallpaper: 'wallpapers', screensaver: 'screensavers', theme: 'themes', pack: 'packs' }[type];
    return (this.data[list] || []).find(x => x.id === id) || null;
  }

  modem() {
    const list = this.data.modems || [];
    let id = '336';
    const ls = this.store();
    try {
      const saved = ls && ls.getItem(this.modemKey);
      if (saved && list.some(m => m.id === saved)) id = saved;
    } catch (e) {}
    return list.find(m => m.id === id) || list[0] || { id: '336', name: '33.6K', bytesPerSec: 3360 };
  }

  setModem(id) {
    if (!(this.data.modems || []).some(m => m.id === id)) return false;
    const ls = this.store();
    try {
      if (ls) ls.setItem(this.modemKey, id);
    } catch (e) {}
    return true;
  }

  eta(bytes) {
    return this.duration(bytes / this.modem().bytesPerSec);
  }

  res(id) {
    const list = this.data.resolutions || [];
    return list.find(r => r.id === String(id)) || list[list.length - 1] || { id: '1024', w: 1024, h: 768 };
  }

  bmpBytes(r) {
    return r.w * r.h * 3 + 54;
  }

  themeCode(t) {
    return t.file.replace(/\.THEME$/, '').slice(0, 5);
  }

  themeInfo(id) {
    const live = typeof window !== 'undefined' && window.appThemes && window.appThemes.themes ? window.appThemes.themes[id] : null;
    const fallback = { bg: '#008080', wallpaper: id, titleGrad: 'linear-gradient(90deg, #000080, #1084d0)', inactiveGrad: 'linear-gradient(90deg, #808080, #b5b5b5)', cursor: 'default', soundScheme: 'classic' };
    const src = live || fallback;
    return {
      bg: src.bg,
      wallpaper: src.wallpaper || 'none',
      titleGrad: src.titleGrad,
      inactiveGrad: src.inactiveGrad || fallback.inactiveGrad,
      cursor: src.cursor || 'default',
      soundScheme: src.soundScheme || 'classic'
    };
  }

  rgbList(grad) {
    return (String(grad).match(/#[0-9a-f]{6}/gi) || []).map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(' '));
  }

  themeFiles(t) {
    const info = this.themeInfo(t.id);
    const code = this.themeCode(t);
    const wall = this.find('wallpaper', info.wallpaper);
    const files = [];
    files.push({ name: t.file, kind: 'THEME', bytes: this.themeIni(t).length });
    if (wall) files.push({ name: wall.file, kind: 'BMP', id: wall.id, bytes: this.bmpBytes(this.res(t.res)) });
    if (info.cursor !== 'default') files.push({ name: `${code}.CUR`, kind: 'CUR', bytes: this.data.cursorBytes || 326 });
    if (info.soundScheme !== 'classic') {
      const snd = this.data.sounds || { up: 61740, dng: 11052, err: 22094 };
      files.push({ name: `${code}_UP.WAV`, kind: 'WAV', bytes: snd.up });
      files.push({ name: `${code}_DN.WAV`, kind: 'WAV', bytes: snd.dng });
      files.push({ name: `${code}_ER.WAV`, kind: 'WAV', bytes: snd.err });
    }
    return files;
  }

  themeBytes(t) {
    return this.themeFiles(t).reduce((sum, f) => sum + f.bytes, 0);
  }

  themeIni(t) {
    const info = this.themeInfo(t.id);
    const code = this.themeCode(t);
    const wall = this.find('wallpaper', info.wallpaper);
    const [act1, act2] = this.rgbList(info.titleGrad);
    const [ina1, ina2] = this.rgbList(info.inactiveGrad);
    const bg = this.rgbList(`${info.bg}`)[0] || '0 128 128';
    const lines = [
      '[Control Panel\\Desktop]',
      `Wallpaper=${wall ? '%ThemeDir%' + wall.file : ''}`,
      'TileWallpaper=0',
      'WallpaperStyle=2',
      '',
      '[Control Panel\\Colors]',
      `Background=${bg}`,
      `ActiveTitle=${act1 || '0 0 128'}`,
      `GradientActiveTitle=${act2 || act1 || '16 132 208'}`,
      `InactiveTitle=${ina1 || '128 128 128'}`,
      `GradientInactiveTitle=${ina2 || ina1 || '181 181 181'}`
    ];
    if (info.cursor !== 'default') {
      lines.push('', '[Control Panel\\Cursors]', `Arrow=%ThemeDir%${code}.CUR`);
    }
    if (info.soundScheme !== 'classic') {
      lines.push(
        '',
        '[AppEvents\\Schemes\\Apps\\.Default\\SystemStart\\.Current]',
        `DefaultValue=%ThemeDir%${code}_UP.WAV`,
        '',
        '[AppEvents\\Schemes\\Apps\\.Default\\.Default\\.Current]',
        `DefaultValue=%ThemeDir%${code}_DN.WAV`,
        '',
        '[AppEvents\\Schemes\\Apps\\.Default\\SystemHand\\.Current]',
        `DefaultValue=%ThemeDir%${code}_ER.WAV`
      );
    }
    return lines.join('\r\n') + '\r\n';
  }

  scrBytes(s) {
    return s.kb * 1024;
  }

  packFiles(p) {
    const files = [];
    const seen = new Set();
    const add = f => {
      if (seen.has(f.name)) return;
      seen.add(f.name);
      files.push(f);
    };
    p.wallpapers.forEach(id => {
      const w = this.find('wallpaper', id);
      const theme = p.themes.map(tid => this.find('theme', tid)).find(t => t && this.themeInfo(t.id).wallpaper === id);
      if (w) add({ name: w.file, kind: 'BMP', id, bytes: this.bmpBytes(this.res(theme ? theme.res : '1024')) });
    });
    p.screensavers.forEach(id => {
      const s = this.find('screensaver', id);
      if (s) add({ name: s.file, kind: 'SCR', bytes: this.scrBytes(s) });
    });
    p.themes.forEach(id => {
      const t = this.find('theme', id);
      if (t) this.themeFiles(t).forEach(add);
    });
    const ratios = this.data.zipRatio || {};
    return files.map(f => {
      const r = f.kind === 'BMP' ? ((ratios.BMP || {})[f.id] || 60) : (ratios[f.kind] || 50);
      return { ...f, ratio: r, packed: Math.round(f.bytes * (100 - r) / 100) };
    });
  }

  packBytes(p) {
    const files = this.packFiles(p);
    return files.reduce((sum, f) => sum + f.packed + 76 + f.name.length * 2, 22);
  }

  crc(name) {
    let h = 2166136261;
    for (let i = 0; i < name.length; i++) {
      h ^= name.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  zipListing(p) {
    const files = this.packFiles(p);
    const [dd, mm, yyyy] = p.added.split('.');
    const date = `${mm}-${dd}-${yyyy.slice(2)}`;
    const pad = (s, n) => String(s).padStart(n, ' ');
    const row = (len, method, size, ratio, d, t, crc, attr, name) => `${pad(len, 7)}  ${method.padEnd(7)} ${pad(size, 7)} ${pad(ratio, 5)}  ${d.padEnd(8)}  ${t.padEnd(5)}  ${crc.padEnd(8)} ${attr.padEnd(4)}  ${name}`.trimEnd();
    const out = [
      'PKUNZIP (R)    FAST!    Extract Utility    Version 2.04g  02-01-93',
      'Copr. 1989-1993 PKWARE Inc. All Rights Reserved. Shareware Version',
      '',
      `Searching ZIP: ${p.file}`,
      '',
      row('Length', 'Method', 'Size', 'Ratio', 'Date', 'Time', 'CRC-32', 'Attr', 'Name'),
      row('------', '------', '------', '-----', '----', '----', '--------', '----', '----')
    ];
    let total = 0;
    let packed = 0;
    files.forEach(f => {
      const crc = this.crc(f.name);
      const hh = String(18 + (parseInt(crc.slice(0, 2), 16) % 5)).padStart(2, '0');
      const mi = String(parseInt(crc.slice(2, 4), 16) % 60).padStart(2, '0');
      total += f.bytes;
      packed += f.packed;
      out.push(row(f.bytes, 'DeflatN', f.packed, `${f.ratio}%`, date, `${hh}:${mi}`, crc, '--w-', f.name));
    });
    const ratio = Math.round((1 - packed / total) * 100);
    out.push(row('------', '', '------', '---', '', '', '', '', '-------'));
    out.push(row(total, '', packed, `${ratio}%`, '', '', '', '', String(files.length)));
    return out.join('\n');
  }

  wallArtUrl(id, w, h) {
    if (typeof window === 'undefined') return '';
    if (id === 'matrix') return this.matrixThumb(w, h);
    if (window.wallpaperArt && typeof window.wallpaperArt.has === 'function' && window.wallpaperArt.has(id)) {
      return window.wallpaperArt.url(id, w, h);
    }
    return '';
  }

  matrixThumb(w, h) {
    const key = `${w}x${h}`;
    if (this.matrixThumbs[key]) return this.matrixThumbs[key];
    const d = this.dialogs();
    if (typeof document === 'undefined' || typeof Image === 'undefined' || !d || typeof d.getMatrixWallpaperUrl !== 'function') return '';
    const big = d.getMatrixWallpaperUrl();
    if (!big || big.indexOf('data:') !== 0) return '';
    if (!this.matrixPending[key]) {
      this.matrixPending[key] = true;
      const img = new Image();
      img.onload = () => {
        try {
          const cv = document.createElement('canvas');
          cv.width = w;
          cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          this.matrixThumbs[key] = cv.toDataURL('image/jpeg', 0.85);
          document.querySelectorAll(`[data-tw-matrix="${key}"]`).forEach(el => {
            if (el.tagName === 'image') el.setAttribute('href', this.matrixThumbs[key]);
            else el.style.backgroundImage = `url("${this.matrixThumbs[key]}")`;
          });
        } catch (e) {}
      };
      img.src = big;
    }
    return '';
  }

  wallBackground(id, w, h) {
    const art = this.wallArtUrl(id, w, h);
    if (art) return `#000000 url('${art}') center / cover no-repeat`;
    if (id !== 'matrix' && typeof window !== 'undefined' && window.appThemes && typeof window.appThemes.getWallpaperGradient === 'function') {
      const g = window.appThemes.getWallpaperGradient(id);
      if (g && g !== 'none') return g.indexOf('url(') === 0 ? `#000000 ${g} center / cover no-repeat` : g;
    }
    return '#000000';
  }

  picture(id, w, h, cls) {
    const art = id === 'matrix' ? ` data-tw-matrix="${w}x${h}"` : '';
    return `<span class="tw-pic${cls ? ' ' + cls : ''}" data-wall-art="${this.esc(id)}" data-wall-w="${w}" data-wall-h="${h}"${art} style="width:${w}px;height:${h}px;background:${this.wallBackground(id, w, h)};"></span>`;
  }

  gif(name, scale) {
    return typeof window !== 'undefined' && typeof window.webGif === 'function' ? window.webGif(name, scale || 1) : '';
  }

  wordmark() {
    const ids = ['cyberpunk', 'clouds', 'redalert', 'gold', 'spacecadet', 'pipes', 'setup'];
    const tiles = ids.map((id, i) => {
      const art = this.wallArtUrl(id, 80, 60);
      return art ? `<image href="${art}" x="${i * 58}" y="0" width="80" height="72" preserveAspectRatio="xMidYMid slice"></image>` : '';
    }).join('');
    return `
      <svg class="tw-wordmark" width="430" height="72" viewBox="0 0 430 72" role="img" aria-label="ThemeWorld 98">
        <defs>
          <pattern id="tw-wm-fill" patternUnits="userSpaceOnUse" x="0" y="0" width="430" height="72">
            <rect x="0" y="0" width="430" height="72" fill="#009999"></rect>
            ${tiles}
          </pattern>
        </defs>
        <text x="4" y="58" font-family="'Arial Black', Arial, sans-serif" font-size="50" font-weight="900" fill="#000000" textLength="352" lengthAdjust="spacingAndGlyphs">ThemeWorld</text>
        <text x="1" y="55" font-family="'Arial Black', Arial, sans-serif" font-size="50" font-weight="900" fill="url(#tw-wm-fill) #ffcc00" stroke="#000000" stroke-width="1.5" textLength="352" lengthAdjust="spacingAndGlyphs">ThemeWorld</text>
        <text x="362" y="58" font-family="'Arial Black', Arial, sans-serif" font-size="30" font-weight="900" fill="#000000">'98</text>
        <text x="360" y="56" font-family="'Arial Black', Arial, sans-serif" font-size="30" font-weight="900" fill="#ffff00" stroke="#000000" stroke-width="1">'98</text>
      </svg>`;
  }

  deskScreen() {
    const s = this.settings();
    const wp = s.wallpaper;
    let bg = s.bgColor || '#008080';
    if (wp && wp !== 'none') {
      if (String(wp).indexOf('data:image') === 0) bg = `${s.bgColor || '#000000'} url('${wp}') center / cover no-repeat`;
      else bg = this.wallBackground(wp, 120, 90);
    }
    const art = wp === 'matrix' ? ' data-tw-matrix="120x90"' : '';
    const known = this.find('wallpaper', wp);
    const caption = !wp || wp === 'none' ? 'без обоев' : known ? known.file : String(wp).indexOf('data:') === 0 ? 'своя картинка' : 'обои темы';
    return `
      <div class="tw-crt" title="Так сейчас выглядит ваш рабочий стол">
        <div class="tw-crt-screen"><span class="tw-crt-glass"${art} data-wall-art="${this.esc(known ? wp : '')}" data-wall-w="120" data-wall-h="90" style="background:${bg};"></span></div>
        <div class="tw-crt-chin"><span class="tw-crt-led"></span><span class="tw-crt-cap">${this.esc(caption)}</span></div>
      </div>`;
  }

  nav(section) {
    const items = [
      ['home', '/', 'INDEX.HTM', 'Главная'],
      ['wallpapers', '/wallpapers', '*.BMP', 'Обои'],
      ['screensavers', '/screensavers', '*.SCR', 'Заставки'],
      ['themes', '/themes', '*.THEME', 'Темы'],
      ['packs', '/packs', '*.ZIP', 'Сборники'],
      ['help', '/help', 'README.TXT', 'Помощь'],
      ['guestbook', '/guestbook', 'GUEST.LOG', 'Гостевая']
    ];
    const map = { wallpaper: 'wallpapers', theme: 'themes' };
    const here = map[section] || section;
    return `
      <table class="tw-nav" cellspacing="0" cellpadding="0"><tr>
        ${items.map(([key, path, ext, label]) => `<td><a class="tw-key${here === key ? ' is-here' : ''}" data-url="${this.url(path)}"><b>${ext}</b><span>${label}</span></a></td>`).join('')}
      </tr></table>`;
  }

  renderSite(arg, legacyQuery) {
    let url = arg;
    if (!url || (String(url).indexOf('://') < 0 && String(url).indexOf('www.') < 0 && String(url).charAt(0) !== '/')) {
      url = this.url(this.legacyPath(arg));
      if (legacyQuery) url = this.url('/search?q=' + encodeURIComponent(legacyQuery));
    } else if (String(url).charAt(0) === '/') {
      url = this.url(url);
    }
    const parsed = this.parseUrl(url);
    this.lastParsed = parsed;
    if (parsed.section === 'notfound') return this.renderNotFound(parsed);
    const page = {
      home: () => this.renderHome(),
      wallpapers: () => this.renderWallpapers(parsed.params),
      wallpaper: () => this.renderWallpaper(parsed.params),
      screensavers: () => this.renderScreensavers(parsed.params),
      themes: () => this.renderThemes(),
      theme: () => this.renderTheme(parsed.params),
      packs: () => this.renderPacks(),
      help: () => this.renderHelp(),
      guestbook: () => this.renderGuestbook(),
      search: () => this.renderSearch(parsed.params)
    }[parsed.section]();
    const site = this.data.site || {};
    const notice = this.notice && this.notice.path === parsed.path ? `<div class="tw-notice">${this.notice.html}</div>` : '';
    return `
      <div class="tw-page">
        <table class="tw-shell" width="760" cellspacing="0" cellpadding="0" align="center">
          <tr><td class="tw-head">
            <table width="100%" cellspacing="0" cellpadding="0"><tr>
              <td class="tw-head-crt">${this.deskScreen()}</td>
              <td class="tw-head-mark">
                <a data-url="${this.url('/')}" class="tw-mark-link">${this.wordmark()}</a>
                <div class="tw-tagline">${this.esc(site.tagline)}</div>
              </td>
              <td class="tw-head-side">
                <div>Обновлено<br><b>${this.esc(site.day)}</b></div>
                <form id="tw-search" class="tw-search">
                  <input type="text" id="tw-q" size="12" maxlength="40" value="${this.esc(parsed.section === 'search' ? (parsed.params.q || '') : '')}">
                  <button type="submit" class="tw-btn">Найти</button>
                </form>
              </td>
            </tr></table>
          </td></tr>
          <tr><td class="tw-navrow">${this.nav(parsed.section)}</td></tr>
          <tr><td class="tw-body">${notice}${page}</td></tr>
          <tr><td class="tw-foot">
            <table width="100%" cellspacing="0" cellpadding="0"><tr>
              <td>
                &copy; 1998-1999 ThemeWorld '98, ${this.esc(site.city)}. Вебмастер ${this.esc(site.webmaster)}.<br>
                Работы присылайте на <a href="mailto:admin@themeworld98.com">admin@themeworld98.com</a>. Лучше всего смотреть в 800x600 и Internet Explorer 5.
              </td>
              <td align="right" class="tw-counter-cell">
                <span class="tw-counter">${String(this.hitCount).padStart(7, '0').split('').map(d => `<span>${d}</span>`).join('')}</span><br>
                посетителей с ${this.esc(site.since)}
              </td>
            </tr></table>
          </td></tr>
        </table>
      </div>`;
  }

  topList() {
    const all = [];
    (this.data.wallpapers || []).forEach(x => all.push({ kind: 'Обои', name: x.file, downloads: x.downloads, path: `/wallpaper?id=${x.id}` }));
    (this.data.screensavers || []).forEach(x => all.push({ kind: 'Заставка', name: x.file, downloads: x.downloads, path: `/screensavers?id=${x.id}` }));
    (this.data.themes || []).filter(x => !x.official).forEach(x => all.push({ kind: 'Тема', name: x.file, downloads: x.downloads, path: `/theme?id=${x.id}` }));
    (this.data.packs || []).forEach(x => all.push({ kind: 'Сборник', name: x.file, downloads: x.downloads, path: '/packs' }));
    return all.sort((a, b) => b.downloads - a.downloads).slice(0, 10);
  }

  modemForm(note) {
    const cur = this.modem();
    return `
      <div class="tw-modem">
        <label for="tw-modem">Мой модем:</label>
        <select id="tw-modem">${(this.data.modems || []).map(m => `<option value="${m.id}"${m.id === cur.id ? ' selected' : ''}>${this.esc(m.name)}</option>`).join('')}</select>
        ${note ? `<div class="tw-small">${note}</div>` : ''}
      </div>`;
  }

  renderHome() {
    const d = this.data;
    const feat = this.find('theme', 'cyberpunk');
    const top = this.topList();
    const max = top.length ? top[0].downloads : 1;
    const totalFiles = (d.wallpapers || []).length + (d.screensavers || []).length + (d.themes || []).filter(t => !t.official).length + (d.packs || []).length;
    return `
      <table width="100%" cellspacing="0" cellpadding="0"><tr>
        <td class="tw-col-main">
          <h1 class="tw-h1">Тема недели</h1>
          <table class="tw-feature" cellspacing="0" cellpadding="0"><tr>
            <td>${this.miniDesktop(feat, 240, 180)}</td>
            <td class="tw-feature-text">
              <h2 class="tw-h2"><a data-url="${this.url('/theme?id=' + feat.id)}">${this.esc(feat.title)}</a></h2>
              <p>${this.esc(feat.desc)}</p>
              <p class="tw-small">Автор: ${this.esc(feat.author)}. Файл ${this.esc(feat.file)}, ${this.bytes(this.themeBytes(feat))}, на модеме ${this.esc(this.modem().name)} примерно ${this.eta(this.themeBytes(feat))}.</p>
              <p><a class="tw-go" data-url="${this.url('/theme?id=' + feat.id)}">Посмотреть и скачать</a></p>
            </td>
          </tr></table>

          <h1 class="tw-h1">Что нового</h1>
          <table class="tw-log" cellspacing="0" cellpadding="0">
            ${(d.updates || []).map(u => `
              <tr>
                <td class="tw-log-date">${this.esc(u.date)}</td>
                <td>${u.fresh ? '<span class="tw-new">NEW!</span> ' : ''}${this.esc(u.text)}${u.link ? ` <a data-url="${this.url(u.link)}">смотреть</a>` : ''}</td>
              </tr>`).join('')}
          </table>
        </td>
        <td class="tw-col-side">
          <div class="tw-box">
            <div class="tw-box-h">Хит-парад загрузок</div>
            <table class="tw-top" cellspacing="0" cellpadding="0">
              ${top.map((t, i) => `
                <tr>
                  <td class="tw-top-n">${i + 1}.</td>
                  <td><a data-url="${this.url(t.path)}">${this.esc(t.name)}</a><br><span class="tw-bar" style="width:${Math.max(2, Math.round(t.downloads / max * 110))}px;"></span> <span class="tw-small">${this.int(t.downloads)}</span></td>
                </tr>`).join('')}
            </table>
          </div>
          <div class="tw-box">
            <div class="tw-box-h">Сколько качать</div>
            ${this.modemForm('Время загрузки на всех страницах считается для этого модема.')}
          </div>
          <div class="tw-box">
            <div class="tw-box-h">В архиве</div>
            <p class="tw-small">Выложено файлов: <b>${totalFiles}</b><br>Прислано работ: <b>${this.int(d.site.received)}</b><br>Каждая проверена антивирусом AVP и на нашем рабочем столе.</p>
            <p class="tw-small"><a data-url="${this.url('/help')}">Как прислать свою работу</a></p>
          </div>
        </td>
      </tr></table>`;
  }

  renderWallpapers(params) {
    const d = this.data;
    const cat = (d.categories || []).some(c => c.id === params.cat) ? params.cat : 'all';
    const r = this.res(params.res || '1024');
    const sort = params.sort === 'new' ? 'new' : 'top';
    const toDate = s => s.split('.').reverse().join('');
    let list = (d.wallpapers || []).filter(w => cat === 'all' || w.cat === cat);
    list = list.slice().sort((a, b) => sort === 'new' ? toDate(b.added).localeCompare(toDate(a.added)) : b.downloads - a.downloads);
    const q = (extra) => {
      const p = { cat, res: r.id, sort, ...extra };
      return '/wallpapers?' + Object.keys(p).filter(k => p[k] && !(k === 'cat' && p[k] === 'all')).map(k => `${k}=${p[k]}`).join('&');
    };
    const rows = [];
    for (let i = 0; i < list.length; i += 4) rows.push(list.slice(i, i + 4));
    const size = this.bmpBytes(r);
    return `
      <h1 class="tw-h1">Обои</h1>
      <p class="tw-lead">Все обои в формате BMP, 24 бита. Щёлкните по картинке, чтобы увидеть её крупно и выбрать размер.</p>
      <table class="tw-filter" cellspacing="0" cellpadding="0">
        <tr><td class="tw-filter-k">Раздел:</td><td>${(d.categories || []).map(c => c.id === cat ? `<b>[${this.esc(c.name)}]</b>` : `<a data-url="${this.url(q({ cat: c.id }))}">${this.esc(c.name)}</a>`).join(' ')}</td></tr>
        <tr><td class="tw-filter-k">Размер:</td><td>${(d.resolutions || []).map(x => x.id === r.id ? `<b>[${x.w}x${x.h}]</b>` : `<a data-url="${this.url(q({ res: x.id }))}">${x.w}x${x.h}</a>`).join(' ')} <span class="tw-small">один файл ${this.bytes(size)}, на ${this.esc(this.modem().name)} ${this.eta(size)}</span></td></tr>
        <tr><td class="tw-filter-k">Порядок:</td><td>${sort === 'top' ? '<b>[по загрузкам]</b>' : `<a data-url="${this.url(q({ sort: 'top' }))}">по загрузкам</a>`} ${sort === 'new' ? '<b>[новые сверху]</b>' : `<a data-url="${this.url(q({ sort: 'new' }))}">новые сверху</a>`}</td></tr>
      </table>
      ${list.length ? `
        <table class="tw-sheet" cellspacing="0" cellpadding="0">
          ${rows.map(row => `<tr>${row.map(w => `
            <td>
              <a data-url="${this.url(`/wallpaper?id=${w.id}&res=${r.id}`)}" title="${this.esc(w.title)}">${this.picture(w.id, 144, 108)}</a>
              <div class="tw-sheet-name"><a data-url="${this.url(`/wallpaper?id=${w.id}&res=${r.id}`)}">${this.esc(w.file)}</a></div>
              <div class="tw-small">${this.esc(w.title)}<br>${this.int(w.downloads)} загрузок</div>
              <div>${this.stateLabel('wallpaper', w.id)}</div>
            </td>`).join('')}${'<td class="tw-sheet-empty"></td>'.repeat(4 - row.length)}</tr>`).join('')}
        </table>` : `<p>В этом разделе пока пусто. <a data-url="${this.url('/wallpapers')}">Показать все обои</a></p>`}`;
  }

  renderWallpaper(params) {
    const list = this.data.wallpapers || [];
    const w = list.find(x => x.id === params.id);
    if (!w) return this.missing('Таких обоев нет в архиве.', '/wallpapers', 'Все обои');
    const r = this.res(params.res || '1024');
    const idx = list.indexOf(w);
    const prev = list[(idx - 1 + list.length) % list.length];
    const next = list[(idx + 1) % list.length];
    const cat = (this.data.categories || []).find(c => c.id === w.cat);
    const st = this.state('wallpaper', w.id);
    return `
      <div class="tw-crumbs"><a data-url="${this.url('/wallpapers')}">Обои</a> &gt; <a data-url="${this.url('/wallpapers?cat=' + w.cat)}">${this.esc(cat ? cat.name : '')}</a> &gt; ${this.esc(w.file)}</div>
      <table class="tw-view" cellspacing="0" cellpadding="0" align="center"><tr><td>${this.picture(w.id, 512, 384, 'tw-view-pic')}</td></tr></table>
      <div class="tw-view-cap">
        <a data-url="${this.url(`/wallpaper?id=${prev.id}&res=${r.id}`)}">&lt;&lt; ${this.esc(prev.file)}</a>
        <b>${this.esc(w.title)}</b>
        <a data-url="${this.url(`/wallpaper?id=${next.id}&res=${r.id}`)}">${this.esc(next.file)} &gt;&gt;</a>
      </div>
      <table width="100%" cellspacing="0" cellpadding="0"><tr>
        <td class="tw-col-main">
          <p>${this.esc(w.desc)}</p>
          <p class="tw-small">Автор: ${this.esc(w.author)}. Выложено ${this.esc(w.added)}. Скачали ${this.int(w.downloads)} раз. ${this.stateLabel('wallpaper', w.id)}</p>
          <table class="tw-grid" cellspacing="0" cellpadding="0">
            <tr><th>Размер</th><th>Файл</th><th>На ${this.esc(this.modem().name)}</th><th></th></tr>
            ${(this.data.resolutions || []).map(x => `
              <tr${x.id === r.id ? ' class="is-pick"' : ''}>
                <td>${x.w}x${x.h}</td>
                <td>${this.bytes(this.bmpBytes(x))}</td>
                <td>${this.eta(this.bmpBytes(x))}</td>
                <td><a class="tw-go" data-tw-dl="wallpaper:${w.id}:${x.id}">Скачать</a></td>
              </tr>`).join('')}
          </table>
        </td>
        <td class="tw-col-side">
          <div class="tw-box">
            <div class="tw-box-h">На рабочий стол</div>
            <p class="tw-small">${st === 'applied' ? 'Эти обои уже стоят у вас на рабочем столе.' : 'Internet Explorer умеет сразу сделать картинку фоновым рисунком. Файл тоже сохранится в «Мои рисунки».'}</p>
            <button type="button" class="tw-btn tw-btn-main" data-tw-apply="wallpaper:${w.id}"${st === 'applied' ? ' disabled' : ''}>Сделать фоновым рисунком</button>
          </div>
          ${this.modemForm('')}
        </td>
      </tr></table>`;
  }

  renderScreensavers(params) {
    const list = this.data.screensavers || [];
    const s = list.find(x => x.id === params.id) || list[0];
    const st = this.state('screensaver', s.id);
    const can = this.canApply('screensaver', s.id);
    const bytes = this.scrBytes(s);
    return `
      <h1 class="tw-h1">Заставки</h1>
      <table class="tw-tv" cellspacing="0" cellpadding="0"><tr>
        <td class="tw-tv-set">
          <div class="tw-monitor">
            <div class="tw-monitor-screen"><canvas id="tw-ss-canvas" width="320" height="240" data-tw-saver="${s.id}"></canvas></div>
            <div class="tw-monitor-chin">
              <span class="tw-monitor-brand">ThemeWorld</span>
              <span class="tw-monitor-ch">${String(list.indexOf(s) + 1).padStart(2, '0')}</span>
              <span class="tw-crt-led"></span>
            </div>
          </div>
          <div class="tw-monitor-foot"></div>
        </td>
        <td class="tw-tv-list">
          <div class="tw-small">Выберите заставку:</div>
          <table class="tw-channels" cellspacing="0" cellpadding="0">
            ${list.map((x, i) => `
              <tr${x.id === s.id ? ' class="is-pick"' : ''}>
                <td class="tw-ch-n">${String(i + 1).padStart(2, '0')}</td>
                <td><a data-url="${this.url('/screensavers?id=' + x.id)}">${this.esc(x.file)}</a> ${x.builtin ? '' : '<span class="tw-new">NEW!</span>'}<br><span class="tw-small">${this.esc(x.title)}</span></td>
              </tr>`).join('')}
          </table>
        </td>
      </tr></table>
      <h2 class="tw-h2">${this.esc(s.title)} <span class="tw-file">${this.esc(s.file)}</span> ${this.stateLabel('screensaver', s.id)}</h2>
      <p>${this.esc(s.desc)}</p>
      <table class="tw-spec" cellspacing="0" cellpadding="0">
        <tr><td>Размер</td><td>${this.bytes(bytes)}, на ${this.esc(this.modem().name)} ${this.eta(bytes)}</td></tr>
        <tr><td>Рисует через</td><td>${this.esc(s.engine)}</td></tr>
        <tr><td>Автор</td><td>${this.esc(s.author)}, выложено ${this.esc(s.added)}</td></tr>
        <tr><td>В списке «Заставка»</td><td>${this.esc(s.listName)}</td></tr>
        <tr><td>Совет</td><td>${this.esc(s.tip)}</td></tr>
      </table>
      <p class="tw-actions">
        <button type="button" class="tw-btn" data-tw-test="${s.id}">Просмотр во весь экран</button>
        <button type="button" class="tw-btn${can ? '' : ' tw-btn-main'}" data-tw-dl="screensaver:${s.id}">Скачать ${this.esc(s.file)}</button>
        <button type="button" class="tw-btn${can ? ' tw-btn-main' : ''}" data-tw-apply="screensaver:${s.id}"${!can || st === 'applied' ? ' disabled' : ''}>Сделать заставкой</button>
      </p>
      <p class="tw-small">${st === 'applied' ? 'Эта заставка уже выбрана у вас.' : can ? 'Файл у вас есть. Кнопка «Сделать заставкой» выберет его во вкладке «Заставка».' : 'Сначала скачайте файл, потом его можно сделать заставкой.'} Чтобы выйти из просмотра, пошевелите мышью.</p>`;
  }

  miniDesktop(t, w, h) {
    const info = this.themeInfo(t.id);
    const cursor = /^[a-z-]+$/.test(info.cursor) ? info.cursor : 'default';
    const winW = Math.round(w * 0.62);
    return `
      <div class="tw-mini" style="width:${w}px;height:${h}px;background:${info.bg};cursor:${cursor};" title="Наведите мышь, чтобы увидеть курсор темы">
        <span class="tw-mini-wall"${info.wallpaper === 'matrix' ? ` data-tw-matrix="${w}x${h - 16}"` : ''} style="width:${w}px;height:${h - 16}px;background:${this.wallBackground(info.wallpaper, w, h - 16)};"></span>
        <span class="tw-mini-win" style="left:${Math.round(w * 0.12)}px;top:${Math.round(h * 0.16)}px;width:${winW}px;">
          <span class="tw-mini-title" style="background:${info.titleGrad};">Мой компьютер</span>
          <span class="tw-mini-client">${this.gif('pc')} ${this.gif('folder')} ${this.gif('disk')}</span>
        </span>
        <span class="tw-mini-bar"><span class="tw-mini-start">Пуск</span></span>
      </div>`;
  }

  renderThemes() {
    const list = this.data.themes || [];
    const cursors = this.data.cursorNames || {};
    return `
      <h1 class="tw-h1">Темы</h1>
      <p class="tw-lead">Тема меняет сразу обои, цвет заголовков окон, курсор и звуки. Сравните темы в таблице, а подробности откройте по названию.</p>
      <table class="tw-grid tw-compare" cellspacing="0" cellpadding="0">
        <tr><th>Тема</th><th>Обои</th><th>Заголовок окна</th><th>Курсор</th><th>Звуки</th><th>Файл</th></tr>
        ${list.map(t => {
          const info = this.themeInfo(t.id);
          return `
            <tr${t.official ? ' class="is-dim"' : ''}>
              <td><a data-url="${this.url('/theme?id=' + t.id)}"><b>${this.esc(t.title)}</b></a><br>${this.stateLabel('theme', t.id)}</td>
              <td>${this.picture(info.wallpaper, 64, 48)}</td>
              <td><span class="tw-chip" style="background:${info.titleGrad};">Окно</span></td>
              <td>${this.esc(cursors[info.cursor] || info.cursor)}</td>
              <td>${this.esc(t.sounds)}</td>
              <td>${t.official ? '<span class="tw-small">уже в Plus! 98</span>' : `${this.esc(t.file)}<br><span class="tw-small">${this.bytes(this.themeBytes(t))}</span>`}</td>
            </tr>`;
        }).join('')}
      </table>
      <p class="tw-small">Серые строки: официальные темы Microslop Plus! 98. Они уже есть во вкладке «Темы», мы показываем их для сравнения.</p>`;
  }

  renderTheme(params) {
    const t = (this.data.themes || []).find(x => x.id === params.id);
    if (!t) return this.missing('Такой темы нет в архиве.', '/themes', 'Все темы');
    const info = this.themeInfo(t.id);
    const st = this.state('theme', t.id);
    const can = this.canApply('theme', t.id);
    const files = t.official ? [] : this.themeFiles(t);
    const bytes = this.themeBytes(t);
    return `
      <div class="tw-crumbs"><a data-url="${this.url('/themes')}">Темы</a> &gt; ${this.esc(t.title)}</div>
      <table width="100%" cellspacing="0" cellpadding="0"><tr>
        <td class="tw-theme-left">
          ${this.miniDesktop(t, 400, 300)}
          <div class="tw-small tw-center">Наведите мышь на картинку: курсор станет таким, как в теме.</div>
        </td>
        <td class="tw-theme-right">
          <h1 class="tw-h1">${this.esc(t.title)}</h1>
          <p>${this.esc(t.desc)}</p>
          <p class="tw-small">Автор: ${this.esc(t.author)}. ${t.official ? '' : `Выложено ${this.esc(t.added)}. `}${this.stateLabel('theme', t.id)}</p>
          <p class="tw-actions">
            ${t.official ? '' : `<button type="button" class="tw-btn${can ? '' : ' tw-btn-main'}" data-tw-dl="theme:${t.id}">Скачать ${this.esc(t.file)}</button>`}
            <button type="button" class="tw-btn${can ? ' tw-btn-main' : ''}" data-tw-apply="theme:${t.id}"${!can || st === 'applied' ? ' disabled' : ''}>Применить тему</button>
            ${info.soundScheme !== 'classic' ? `<button type="button" class="tw-btn" data-tw-sound="${t.id}">Звук запуска</button>` : ''}
          </p>
          <p class="tw-small">${st === 'applied' ? 'Эта тема уже стоит у вас.' : can ? 'Тема у вас есть, её можно применить.' : `Сначала скачайте тему: ${this.bytes(bytes)}, на ${this.esc(this.modem().name)} ${this.eta(bytes)}.`}</p>
        </td>
      </tr></table>
      ${t.official ? '' : `
        <h2 class="tw-h2">Что внутри</h2>
        <table class="tw-grid" cellspacing="0" cellpadding="0">
          <tr><th>Файл</th><th>Что это</th><th>Размер</th></tr>
          ${files.map(f => `<tr><td>${this.esc(f.name)}</td><td>${{ THEME: 'описание темы', BMP: 'обои ' + this.res(t.res).w + 'x' + this.res(t.res).h, CUR: 'курсор «' + this.esc((this.data.cursorNames || {})[info.cursor] || info.cursor) + '»', WAV: f.name.indexOf('_UP') > 0 ? 'звук запуска' : f.name.indexOf('_DN') > 0 ? 'звук уведомления' : 'звук ошибки' }[f.kind]}</td><td>${this.bytes(f.bytes)}</td></tr>`).join('')}
          <tr class="is-pick"><td colspan="2">Всего</td><td>${this.bytes(bytes)}</td></tr>
        </table>
        <h2 class="tw-h2">${this.esc(t.file)}</h2>
        <pre class="tw-pre">${this.esc(this.themeIni(t))}</pre>`}`;
  }

  renderPacks() {
    return `
      <h1 class="tw-h1">Сборники</h1>
      <p class="tw-lead">Сборник выгоднее, чем файлы по отдельности: ZIP сжимает обои в несколько раз. Ниже то, что покажет PKUNZIP -v.</p>
      ${(this.data.packs || []).map(p => {
        const bytes = this.packBytes(p);
        const full = this.packFiles(p).reduce((sum, f) => sum + f.bytes, 0);
        return `
          <table class="tw-pack" cellspacing="0" cellpadding="0" width="100%">
            <tr><td class="tw-pack-h">
              <b>${this.esc(p.title)}</b> <span class="tw-file">${this.esc(p.file)}</span>
            </td></tr>
            <tr><td class="tw-pack-b">
              <p>${this.esc(p.desc)}</p>
              <pre class="tw-dos">C:\\DOWNLOADS&gt;pkunzip -v ${this.esc(p.file.toLowerCase())}\n${this.esc(this.zipListing(p))}\n\nC:\\DOWNLOADS&gt;</pre>
              <p class="tw-actions">
                <button type="button" class="tw-btn tw-btn-main" data-tw-dl="pack:${p.id}">Скачать ${this.esc(p.file)}, ${this.bytes(bytes)}</button>
                <span class="tw-small">на ${this.esc(this.modem().name)} ${this.eta(bytes)}, по отдельности было бы ${this.eta(full)}</span>
              </p>
            </td></tr>
          </table>`;
      }).join('')}
      ${this.modemForm('')}`;
  }

  renderHelp() {
    const d = this.data;
    const steps = d.steps || {};
    const block = (title, list) => `
      <td class="tw-steps">
        <h3 class="tw-h3">${title}</h3>
        <ol>${(list || []).map(s => `<li>${this.esc(s)}</li>`).join('')}</ol>
      </td>`;
    return `
      <h1 class="tw-h1">README.TXT</h1>
      <p class="tw-lead">Как поставить скачанное и что делать, если не получилось.</p>
      <table class="tw-steps-row" cellspacing="0" cellpadding="0" width="100%"><tr>
        ${block('Обои', steps.wallpaper)}
        ${block('Заставка', steps.screensaver)}
        ${block('Тема', steps.theme)}
      </tr></table>
      <p><button type="button" class="tw-btn" data-tw-props="bg">Открыть «Свойства экрана»</button></p>
      <h2 class="tw-h2">Вопросы и ответы</h2>
      <dl class="tw-faq">
        ${(d.faq || []).map(f => `<dt>${this.esc(f.q)}</dt><dd>${this.esc(f.a).replace('admin@themeworld98.com', '<a href="mailto:admin@themeworld98.com">admin@themeworld98.com</a>')}</dd>`).join('')}
      </dl>
      <h2 class="tw-h2">Время загрузки</h2>
      <table class="tw-grid" cellspacing="0" cellpadding="0">
        <tr><th>Файл</th>${(d.modems || []).map(m => `<th>${this.esc(m.name)}</th>`).join('')}</tr>
        ${(d.resolutions || []).map(r => `<tr><td>Обои ${r.w}x${r.h}</td>${(d.modems || []).map(m => `<td>${this.duration(this.bmpBytes(r) / m.bytesPerSec)}</td>`).join('')}</tr>`).join('')}
        <tr><td>Заставка 142 КБ</td>${(d.modems || []).map(m => `<td>${this.duration(142 * 1024 / m.bytesPerSec)}</td>`).join('')}</tr>
      </table>
      <p class="tw-small">Считаем по реальной скорости линии: 28.8K даёт около 2,8 КБ в секунду, 56K на наших АТС редко больше 4,7 КБ.</p>`;
  }

  readUser() {
    const ls = this.store();
    let user = { guestbook: [] };
    try {
      const raw = ls && ls.getItem(this.userKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.guestbook)) user = parsed;
      }
      const legacy = ls && ls.getItem(this.legacyGuestbookKey);
      if (legacy) {
        const old = JSON.parse(legacy);
        if (Array.isArray(old)) {
          old.filter(e => e && e.text && !this.legacySeeds.includes(`${e.name}|${e.date}`)).reverse().forEach(e => {
            user.guestbook.push({ name: String(e.name || 'Гость'), from: String(e.from || ''), date: String(e.date || ''), text: String(e.text) });
          });
        }
        ls.removeItem(this.legacyGuestbookKey);
        ls.setItem(this.userKey, JSON.stringify(user));
      }
    } catch (e) {}
    return user;
  }

  getGuestbookEntries() {
    const user = this.readUser().guestbook.slice().reverse();
    return user.concat(this.data.guestbook || []);
  }

  addGuestbookEntry(name, from, text) {
    const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
    const body = String(text || '').replace(/\r/g, '').trim().slice(0, 600);
    if (!body) return { ok: false, error: 'Напишите сообщение: без текста запись не сохранится.' };
    const user = this.readUser();
    user.guestbook.push({
      name: clean(name).slice(0, 30) || 'Гость',
      from: clean(from).slice(0, 40),
      date: (this.data.site || {}).day || '',
      text: body
    });
    const ls = this.store();
    try {
      if (ls) ls.setItem(this.userKey, JSON.stringify(user));
    } catch (e) {
      return { ok: false, error: 'Не удалось сохранить запись: диск переполнен.' };
    }
    return { ok: true };
  }

  saveGuestbookEntry(name, from, text) {
    return this.addGuestbookEntry(name, from, text);
  }

  renderGuestbook() {
    const entries = this.getGuestbookEntries();
    const dr = this.gbDraft;
    return `
      <h1 class="tw-h1">Гостевая книга</h1>
      <table class="tw-gb-form" cellspacing="0" cellpadding="0"><tr><td>
        <form id="tw-gb">
          <table cellspacing="0" cellpadding="2">
            <tr><td><label for="tw-gb-name">Имя или ник:</label></td><td><input type="text" id="tw-gb-name" size="24" maxlength="30" value="${this.esc(dr.name)}"></td></tr>
            <tr><td><label for="tw-gb-from">Город:</label></td><td><input type="text" id="tw-gb-from" size="24" maxlength="40" value="${this.esc(dr.from)}"></td></tr>
            <tr><td valign="top"><label for="tw-gb-text">Сообщение:</label></td><td><textarea id="tw-gb-text" cols="48" rows="4">${this.esc(dr.text)}</textarea></td></tr>
            <tr><td></td><td><button type="submit" class="tw-btn tw-btn-main">Подписать книгу</button> <span class="tw-small">До 600 знаков. HTML не работает.</span></td></tr>
          </table>
        </form>
      </td></tr></table>
      <p class="tw-small">Записей: ${entries.length}. Свежие сверху.</p>
      ${entries.map(e => `
        <table class="tw-gb" cellspacing="0" cellpadding="0" width="100%">
          <tr><td class="tw-gb-h"><b>${this.esc(e.name)}</b>${e.from ? `, ${this.esc(e.from)}` : ''}<span class="tw-gb-date">${this.esc(e.date)}</span></td></tr>
          <tr><td class="tw-gb-t">${this.esc(e.text).replace(/\n/g, '<br>')}${e.reply ? `<div class="tw-gb-reply"><b>Admin_Dima:</b> ${this.esc(e.reply)}</div>` : ''}</td></tr>
        </table>`).join('')}`;
  }

  searchIndex() {
    const d = this.data;
    const out = [];
    (d.wallpapers || []).forEach(w => out.push({ kind: 'обои', title: `${w.file}: ${w.title}`, text: `${w.title} ${w.desc} ${w.author} ${w.file}`, path: `/wallpaper?id=${w.id}`, desc: w.desc }));
    (d.screensavers || []).forEach(s => out.push({ kind: 'заставка', title: `${s.file}: ${s.title}`, text: `${s.title} ${s.desc} ${s.author} ${s.file} ${s.listName} ${s.engine} ${s.tip}`, path: `/screensavers?id=${s.id}`, desc: s.desc }));
    (d.themes || []).forEach(t => out.push({ kind: 'тема', title: `${t.file}: ${t.title}`, text: `${t.title} ${t.desc} ${t.author} ${t.file} ${t.listName} ${t.sounds}`, path: `/theme?id=${t.id}`, desc: t.desc }));
    (d.packs || []).forEach(p => out.push({ kind: 'сборник', title: `${p.file}: ${p.title}`, text: `${p.title} ${p.desc} ${p.file}`, path: '/packs', desc: p.desc }));
    (d.faq || []).forEach(f => out.push({ kind: 'помощь', title: f.q, text: `${f.q} ${f.a}`, path: '/help', desc: f.a }));
    return out;
  }

  renderSearch(params) {
    const q = String(params.q || '').trim();
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = words.length ? this.searchIndex().filter(r => words.every(wd => r.text.toLowerCase().includes(wd))) : [];
    const tries = ['матрица', 'тема', 'OpenGL', 'модем'];
    return `
      <h1 class="tw-h1">Поиск</h1>
      ${q ? `<p>По запросу <b>${this.esc(q)}</b> найдено: ${hits.length}.</p>` : '<p>Введите слово в поле поиска вверху страницы.</p>'}
      ${hits.length ? `<ol class="tw-results">${hits.map(h => `<li><a data-url="${this.url(h.path)}"><b>${this.esc(h.title)}</b></a> <span class="tw-small">[${h.kind}]</span><br>${this.esc(h.desc)}</li>`).join('')}</ol>` : `<p>${q ? 'Ничего не нашлось. ' : ''}Попробуйте: ${tries.map(t => `<a data-url="${this.url('/search?q=' + encodeURIComponent(t))}">${this.esc(t)}</a>`).join(', ')}.</p>`}`;
  }

  missing(text, path, label) {
    return `<h1 class="tw-h1">Файл не найден</h1><p>${this.esc(text)} <a data-url="${this.url(path)}">${this.esc(label)}</a></p>`;
  }

  renderNotFound(parsed) {
    return `
      <div class="tw-apache">
        <h1>Not Found</h1>
        <p>The requested URL ${this.esc(parsed.path || '/')} was not found on this server.</p>
        <hr>
        <address>Apache/1.3.9 Server at ${this.esc(parsed.host || 'www.themeworld98.com')} Port 80</address>
      </div>`;
  }

  wallpaperImage(id, width, height) {
    if (id === 'matrix') {
      const d = this.dialogs();
      return d && typeof d.getMatrixWallpaperUrl === 'function' ? d.getMatrixWallpaperUrl() : '';
    }
    return typeof window !== 'undefined' && window.wallpaperArt ? window.wallpaperArt.url(id, width, height) : '';
  }

  markDownloaded(type, id) {
    const d = this.dialogs();
    if (d && typeof d.markDownloaded === 'function') d.markDownloaded(type, id);
  }

  applyWallpaper(id) {
    const w = this.find('wallpaper', id);
    const d = this.dialogs();
    if (!w || !d || typeof d.saveDisplaySettings !== 'function') return false;
    const had = this.downloadedList('wallpaper').includes(id);
    this.markDownloaded('wallpaper', id);
    if (!had && !w.builtin) this.saveFile('wallpaper', w, this.res('1024'));
    const s = d.saveDisplaySettings({ wallpaper: id, wallpaperMode: 'stretch' });
    if (typeof d.applyDisplaySettings === 'function') d.applyDisplaySettings(s || d.getDisplaySettings());
    return true;
  }

  applyScreensaver(id) {
    const s = this.find('screensaver', id);
    const d = this.dialogs();
    if (!s || !d || typeof d.saveDisplaySettings !== 'function') return false;
    this.markDownloaded('screensaver', id);
    const saved = d.saveDisplaySettings({ screensaverMode: id });
    if (typeof d.applyDisplaySettings === 'function') d.applyDisplaySettings(saved || d.getDisplaySettings());
    return true;
  }

  applyTheme(id) {
    const t = this.find('theme', id);
    const th = typeof window !== 'undefined' ? window.appThemes : null;
    if (!t || !th || typeof th.applyTheme !== 'function' || !th.themes || !th.themes[id]) return false;
    if (!t.official) {
      this.markDownloaded('theme', id);
      this.markDownloaded('wallpaper', this.themeInfo(id).wallpaper);
    }
    th.applyTheme(id, true);
    return true;
  }

  apply(type, id) {
    if (type === 'wallpaper') return this.applyWallpaper(id);
    if (type === 'screensaver') return this.applyScreensaver(id);
    if (type === 'theme') return this.applyTheme(id);
    return false;
  }

  testScreensaver(id) {
    const ss = typeof window !== 'undefined' ? window.appScreensaver : null;
    if (!ss || typeof ss.start !== 'function' || !this.find('screensaver', id)) return false;
    ss.start(id);
    return true;
  }

  playThemeSound(id) {
    const snd = typeof window !== 'undefined' ? window.soundSys : null;
    if (!snd || typeof snd.playPlusSound !== 'function') return false;
    snd.playPlusSound(this.themeInfo(id).soundScheme, 'startup');
    return true;
  }

  fileFor(type, item, r) {
    if (type === 'wallpaper') {
      return {
        name: item.file,
        folder: ['My Computer', 'C:', 'My Documents', 'Мои рисунки'],
        label: 'C:\\My Documents\\Мои рисунки',
        bytes: this.bmpBytes(r),
        content: () => this.wallpaperImage(item.id, r.w, r.h) || `[BMP ${r.w}x${r.h}: ${item.title}]`
      };
    }
    const dl = { folder: ['My Computer', 'C:', 'My Documents', 'Downloads'], label: 'C:\\My Documents\\Downloads' };
    if (type === 'screensaver') return { ...dl, name: item.file, bytes: this.scrBytes(item), content: () => `[Win32 Screen Saver: ${item.title}]` };
    if (type === 'theme') return { ...dl, name: item.file, bytes: this.themeBytes(item), content: () => this.themeIni(item) };
    return { ...dl, name: item.file, bytes: this.packBytes(item), content: () => this.zipListing(item) };
  }

  saveFile(type, item, r) {
    const f = this.fileFor(type, item, r);
    const vfs = typeof window !== 'undefined' ? window.vfs : null;
    if (vfs && typeof vfs.writeFile === 'function') vfs.writeFile(f.folder, f.name, f.content());
    return f;
  }

  completeDownload(type, item, r) {
    const f = this.saveFile(type, item, r);
    if (type === 'pack') {
      item.wallpapers.forEach(id => this.markDownloaded('wallpaper', id));
      item.screensavers.forEach(id => this.markDownloaded('screensaver', id));
      item.themes.forEach(id => this.markDownloaded('theme', id));
    } else {
      this.markDownloaded(type, item.id);
      if (type === 'theme') this.markDownloaded('wallpaper', this.themeInfo(item.id).wallpaper);
    }
    return f;
  }

  download(type, id, resId) {
    const item = this.find(type, id);
    if (!item || (type === 'theme' && item.official)) return false;
    const r = this.res(resId || (type === 'theme' ? item.res : '1024'));
    const f = this.fileFor(type, item, r);
    const wm = typeof window !== 'undefined' ? window.winManager : null;
    if (!wm || typeof wm.createWindow !== 'function') {
      this.completeDownload(type, item, r);
      this.refreshView();
      return true;
    }
    const winId = `tw_dl_${Date.now()}`;
    const tab = { wallpaper: 'bg', screensaver: 'screensaver', theme: 'themes', pack: 'bg' }[type];
    const win = wm.createWindow({
      id: winId,
      title: `Загрузка файла: ${f.name}`,
      icon: 'internet-explorer',
      width: 420,
      height: 236,
      resizable: false,
      content: `
        <div class="tw-dlg">
          <table cellspacing="0" cellpadding="0"><tr>
            <td class="tw-dlg-ico">${this.gif('disk', 2)}</td>
            <td class="tw-dlg-txt">
              <div><b>${this.esc(f.name)}</b>, ${this.bytes(f.bytes)}</div>
              <div>С узла: ${this.url('/files/')}${this.esc(f.name.toLowerCase())}</div>
              <div>В папку: ${this.esc(f.label)}</div>
              <div>На модеме ${this.esc(this.modem().name)}: около ${this.eta(f.bytes)}</div>
            </td>
          </tr></table>
          <div class="tw-dlg-status" data-tw-dl-status>Соединение с www.themeworld98.com...</div>
          <div class="tw-dlg-track"><div class="tw-dlg-fill" data-tw-dl-bar></div></div>
          <div class="tw-dlg-btns">
            ${type === 'pack' ? '' : `<button type="button" class="win-btn" data-tw-dl-apply disabled>${type === 'wallpaper' ? 'Сделать фоновым' : type === 'screensaver' ? 'Сделать заставкой' : 'Применить тему'}</button>`}
            <button type="button" class="win-btn" data-tw-dl-props disabled>Свойства экрана</button>
            <button type="button" class="win-btn" data-tw-dl-close>Отмена</button>
          </div>
        </div>`
    });
    const el = win && win.element;
    if (!el) {
      this.completeDownload(type, item, r);
      this.refreshView();
      return true;
    }
    const q = sel => el.querySelector(sel);
    const bar = q('[data-tw-dl-bar]');
    const status = q('[data-tw-dl-status]');
    const btnApply = q('[data-tw-dl-apply]');
    const btnProps = q('[data-tw-dl-props]');
    const btnClose = q('[data-tw-dl-close]');
    let progress = 0;
    let done = false;
    const close = () => wm.closeWindow(winId);
    const timer = setInterval(() => {
      if (!wm.windows || !wm.windows.has(winId)) {
        clearInterval(timer);
        return;
      }
      progress = Math.min(100, progress + 10);
      if (bar) bar.style.width = `${progress}%`;
      if (status) status.textContent = `Получено ${this.bytes(Math.round(f.bytes * progress / 100))} из ${this.bytes(f.bytes)}`;
      if (progress >= 100) {
        clearInterval(timer);
        done = true;
        this.completeDownload(type, item, r);
        if (status) status.textContent = `Готово. Файл сохранён в ${f.label}.`;
        if (btnClose) btnClose.textContent = 'Закрыть';
        if (btnApply) btnApply.disabled = false;
        if (btnProps) btnProps.disabled = false;
        if (typeof window !== 'undefined' && window.soundSys && typeof window.soundSys.playDing === 'function') window.soundSys.playDing();
        this.refreshView();
      }
    }, 220);
    if (btnClose) btnClose.addEventListener('click', () => {
      if (!done) clearInterval(timer);
      close();
    });
    if (btnApply) btnApply.addEventListener('click', () => {
      this.apply(type, item.id);
      close();
      this.refreshView();
    });
    if (btnProps) btnProps.addEventListener('click', () => {
      close();
      const d = this.dialogs();
      if (d && typeof d.openDisplayProperties === 'function') d.openDisplayProperties(tab);
    });
    return true;
  }

  refreshView() {
    const v = this.view;
    if (!v || !v.ie || !v.win || typeof v.ie.renderPage !== 'function') return;
    if (typeof v.ie.identifyPageKey === 'function' && v.ie.identifyPageKey(v.ie.currentUrl || '') !== 'themeworld') return;
    if (v.win.element && v.win.element.isConnected === false) return;
    const top = v.container ? v.container.scrollTop || 0 : 0;
    v.ie.renderPage(v.win, v.ie.currentUrl || this.baseUrl);
    if (v.container) v.container.scrollTop = top;
  }

  attachEvents(win, container, ieInstance) {
    const ie = ieInstance && typeof ieInstance.renderPage === 'function' ? ieInstance : (typeof window !== 'undefined' ? window.appIE : null);
    this.view = { win, container, ie };
    const path = this.lastParsed ? this.lastParsed.path : '/';
    if (this.notice && this.notice.path !== path) this.notice = null;
    const click = () => {
      if (typeof window !== 'undefined' && window.soundSys && typeof window.soundSys.playClick === 'function') window.soundSys.playClick();
    };
    const go = p => {
      if (ie && win && typeof ie.navigate === 'function') ie.navigate(win, this.url(p));
    };
    const on = (sel, fn) => container.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => {
      if (e && e.preventDefault) e.preventDefault();
      click();
      fn(el);
    }));
    const split = v => String(v || '').split(':');

    const search = container.querySelector('#tw-search');
    if (search) search.addEventListener('submit', e => {
      if (e && e.preventDefault) e.preventDefault();
      const inp = container.querySelector('#tw-q');
      go('/search?q=' + encodeURIComponent(inp && inp.value ? inp.value.trim() : ''));
    });

    const modem = container.querySelector('#tw-modem');
    if (modem) modem.addEventListener('change', () => {
      if (this.setModem(modem.value)) this.refreshView();
    });

    on('[data-tw-dl]', el => {
      const [type, id, res] = split(el.dataset.twDl);
      this.download(type, id, res);
    });

    on('[data-tw-apply]', el => {
      if (el.disabled) return;
      const [type, id] = split(el.dataset.twApply);
      if (this.apply(type, id)) {
        const text = { wallpaper: 'Обои поставлены на рабочий стол.', screensaver: 'Заставка выбрана. Она включится, когда компьютер простоит заданное время.', theme: 'Тема применена.' }[type];
        this.notice = { path, html: `${this.esc(text)} <a data-tw-props="${type === 'wallpaper' ? 'bg' : type === 'screensaver' ? 'screensaver' : 'themes'}">Открыть «Свойства экрана»</a>` };
      }
      this.refreshView();
    });

    on('[data-tw-test]', el => this.testScreensaver(el.dataset.twTest));
    on('[data-tw-sound]', el => this.playThemeSound(el.dataset.twSound));
    on('[data-tw-props]', el => {
      const d = this.dialogs();
      if (d && typeof d.openDisplayProperties === 'function') d.openDisplayProperties(el.dataset.twProps);
    });

    const gb = container.querySelector('#tw-gb');
    if (gb) gb.addEventListener('submit', e => {
      if (e && e.preventDefault) e.preventDefault();
      const val = id => {
        const el = container.querySelector('#' + id);
        return el && el.value ? el.value : '';
      };
      const draft = { name: val('tw-gb-name'), from: val('tw-gb-from'), text: val('tw-gb-text') };
      const res = this.addGuestbookEntry(draft.name, draft.from, draft.text);
      if (res.ok) {
        this.gbDraft = { name: draft.name, from: draft.from, text: '' };
        this.notice = { path, html: 'Спасибо! Запись добавлена в гостевую книгу.' };
        if (typeof window !== 'undefined' && window.soundSys && typeof window.soundSys.playDing === 'function') window.soundSys.playDing();
      } else {
        this.gbDraft = draft;
        this.notice = { path, html: `<b>Запись не добавлена.</b> ${this.esc(res.error)}` };
      }
      this.refreshView();
    });

    this.startPreview(container);
  }

  reducedMotion() {
    try {
      return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  startPreview(container) {
    if (this.previewTimer && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.previewTimer);
    this.previewTimer = null;
    const cv = container.querySelector('#tw-ss-canvas');
    if (!cv || typeof cv.getContext !== 'function' || typeof requestAnimationFrame !== 'function') return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const step = this.previewPainter(cv.dataset.twSaver, ctx, cv.width, cv.height);
    if (this.reducedMotion()) {
      for (let i = 0; i < 90; i++) step();
      return;
    }
    let last = 0;
    const loop = ts => {
      if (!cv.isConnected) {
        this.previewTimer = null;
        return;
      }
      if (ts - last >= 33) {
        last = ts;
        step();
      }
      this.previewTimer = requestAnimationFrame(loop);
    };
    this.previewTimer = requestAnimationFrame(loop);
  }

  previewPainter(id, ctx, W, H) {
    let seed = 1999;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    if (id === 'matrix') {
      const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ0123456789ABCDEF';
      const fs = 10;
      const cols = Array.from({ length: Math.ceil(W / fs) }, () => ({ y: -rnd() * 30, v: 0.35 + rnd() * 0.65 }));
      ctx.font = `${fs}px monospace`;
      return () => {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(0, 0, W, H);
        cols.forEach((c, i) => {
          const ch = chars.charAt(Math.floor(rnd() * chars.length));
          ctx.fillStyle = '#ccffcc';
          ctx.fillText(ch, i * fs, Math.floor(c.y) * fs);
          ctx.fillStyle = '#00cc33';
          ctx.fillText(chars.charAt(Math.floor(rnd() * chars.length)), i * fs, (Math.floor(c.y) - 1) * fs);
          c.y += c.v;
          if (c.y * fs > H + 200) c.y = -rnd() * 10;
        });
      };
    }
    if (id === 'flying_win') {
      const flags = Array.from({ length: 28 }, () => ({ x: (rnd() - 0.5) * W * 1.5, y: (rnd() - 0.5) * H * 1.5, z: rnd() * 1000 + 50, r: rnd() * 6.28, s: (rnd() - 0.5) * 0.06 }));
      return () => {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, W, H);
        flags.sort((a, b) => b.z - a.z).forEach(f => {
          f.z -= 9;
          f.r += f.s;
          if (f.z <= 10) {
            f.x = (rnd() - 0.5) * W * 1.5;
            f.y = (rnd() - 0.5) * H * 1.5;
            f.z = 1000;
          }
          const k = 150 / f.z;
          const size = Math.max(4, 40 * k);
          const q = size * 0.44;
          const g = size * 0.08;
          ctx.save();
          ctx.translate(f.x * k + W / 2, f.y * k + H / 2);
          ctx.rotate(f.r);
          [['#ff3333', 0, 0], ['#33cc33', 1, 0], ['#3366ff', 0, 1], ['#ffcc00', 1, 1]].forEach(([c, dx, dy]) => {
            ctx.fillStyle = c;
            ctx.fillRect(-size / 2 + dx * (q + g), -size / 2 + dy * (q + g), q, q);
          });
          ctx.restore();
        });
      };
    }
    if (id === 'starfield') {
      const stars = Array.from({ length: 400 }, () => ({ x: (rnd() - 0.5) * W, y: (rnd() - 0.5) * H, z: rnd() * W }));
      return () => {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, W, H);
        stars.forEach(s => {
          s.z -= 4;
          if (s.z <= 1) {
            s.x = (rnd() - 0.5) * W;
            s.y = (rnd() - 0.5) * H;
            s.z = W;
          }
          const k = 128 / s.z;
          const px = s.x * k + W / 2;
          const py = s.y * k + H / 2;
          const sz = Math.max(1, 2.5 - s.z / W * 2.5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px, py, sz, sz);
        });
      };
    }
    if (id === 'mystify') {
      const poly = hue => ({ hue, v: Array.from({ length: 4 }, () => ({ x: rnd() * W, y: rnd() * H, dx: (rnd() * 2 + 1) * (rnd() > 0.5 ? 1 : -1), dy: (rnd() * 2 + 1) * (rnd() > 0.5 ? 1 : -1) })), trail: [] });
      const polys = [poly(0), poly(180)];
      let t = 0;
      return () => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        t++;
        polys.forEach(p => {
          p.v.forEach(v => {
            v.x += v.dx;
            v.y += v.dy;
            if (v.x < 0 || v.x > W) v.dx = -v.dx;
            if (v.y < 0 || v.y > H) v.dy = -v.dy;
          });
          p.trail.unshift(p.v.map(v => [v.x, v.y]));
          if (p.trail.length > 7) p.trail.pop();
          p.trail.forEach((pts, i) => {
            ctx.strokeStyle = `hsl(${(p.hue + t) % 360},100%,${60 - i * 6}%)`;
            ctx.beginPath();
            pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.closePath();
            ctx.stroke();
          });
        });
      };
    }
    if (id === 'flowerbox') {
      const verts = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
      const colors = ['#ff3333', '#ffcc00', '#33cc33', '#33ccff', '#3366ff', '#cc33ff'];
      let a = 0;
      return () => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        a += 0.03;
        const m = 1 + Math.sin(a * 1.7) * 0.35;
        const pts = verts.map(([x, y, z]) => {
          let X = x * m;
          let Y = y;
          let Z = z * (2 - m);
          [X, Y] = [X * Math.cos(a) - Y * Math.sin(a), X * Math.sin(a) + Y * Math.cos(a)];
          [X, Z] = [X * Math.cos(a * 0.7) - Z * Math.sin(a * 0.7), X * Math.sin(a * 0.7) + Z * Math.cos(a * 0.7)];
          [Y, Z] = [Y * Math.cos(a * 0.5) - Z * Math.sin(a * 0.5), Y * Math.sin(a * 0.5) + Z * Math.cos(a * 0.5)];
          const k = 220 / (Z + 4.5);
          return [W / 2 + X * k * 0.5, H / 2 + Y * k * 0.5];
        });
        ctx.lineWidth = 2;
        edges.forEach(([p, q], i) => {
          ctx.strokeStyle = colors[i % colors.length];
          ctx.beginPath();
          ctx.moveTo(pts[p][0], pts[p][1]);
          ctx.lineTo(pts[q][0], pts[q][1]);
          ctx.stroke();
        });
      };
    }
    const cell = 16;
    const gw = Math.floor(W / cell);
    const gh = Math.floor(H / cell);
    const palette = ['#cc3333', '#33cc33', '#3366cc', '#cccc33', '#cc66cc', '#33cccc'];
    let used = new Set();
    let pipe = null;
    let count = 0;
    const fresh = () => {
      pipe = { x: Math.floor(rnd() * gw), y: Math.floor(rnd() * gh), d: Math.floor(rnd() * 4), c: palette[Math.floor(rnd() * palette.length)], len: 0 };
    };
    fresh();
    return () => {
      const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      let d = pipe.d;
      if (rnd() < 0.25) d = (d + (rnd() < 0.5 ? 1 : 3)) % 4;
      const nx = pipe.x + dirs[d][0];
      const ny = pipe.y + dirs[d][1];
      if (nx < 0 || ny < 0 || nx >= gw || ny >= gh || used.has(nx + ',' + ny) || pipe.len > 60) {
        fresh();
        count++;
        if (count > 8) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, W, H);
          used = new Set();
          count = 0;
        }
        return;
      }
      const cx = pipe.x * cell + cell / 2;
      const cy = pipe.y * cell + cell / 2;
      ctx.strokeStyle = pipe.c;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx * cell + cell / 2, ny * cell + cell / 2);
      ctx.stroke();
      if (d !== pipe.d) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pipe.c;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      used.add(nx + ',' + ny);
      pipe.x = nx;
      pipe.y = ny;
      pipe.d = d;
      pipe.len++;
    };
  }
}

window.themeWorldSite = new ThemeWorldSite();
