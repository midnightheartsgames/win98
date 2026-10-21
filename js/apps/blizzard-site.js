const BLZ_BASE = 'http://www.blizzard.com';
const BLZ_MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const BLZ_MODEMS = [
  { id: '28k', label: '28.8K V.34', rate: 2.9, ping: 95 },
  { id: '33k', label: '33.6K USR', rate: 3.5, ping: 45 },
  { id: '56k', label: '56K V.90', rate: 5.1, ping: 0 },
  { id: 'isdn', label: 'ISDN 128K', rate: 14.2, ping: -65 }
];
const BLZ_NAV = [
  ['home', '/', 'Главная'],
  ['news', '/news', 'Новости'],
  ['games', '/games', 'Игры'],
  ['warcraft', '/warcraft', 'Warcraft'],
  ['sanctuary', '/sanctuary', 'Руны'],
  ['battlenet', '/battlenet', 'Battle.net'],
  ['support', '/support', 'Поддержка'],
  ['studio', '/studio', 'О компании']
];
const BLZ_NEWS_FILTERS = [
  ['all', 'Все'],
  ['warcraft', 'Warcraft'],
  ['diablo2', 'Diablo II'],
  ['diablo', 'Diablo'],
  ['ow98', 'Overwatch 98'],
  ['battlenet', 'Battle.net']
];

class BlizzardSite {
  constructor() {
    this.pollStorageKey = 'blizzard98_poll_v1';
    this.bnetStorageKey = 'blizzard98_bnet_v1';
    this.hitsStorageKey = 'blizzard98_hits_v1';
    this.newsFilter = 'all';
    this.selectedGatewayId = 'europe';
    this.selectedModem = '56k';
    this.warcraftSide = 'both';
    this.selectedUnitId = 'worker';
    this.selectedPlaceId = 'lordaeron';
    this.unitClickCounts = {};
    this.lastUnitQuote = '';
    this.lastUnitSpeaker = '';
    this.selectedRunewordId = 'steel';
    this.slottedRunes = ['tir', 'el'];
    this.forgeBase = 'sword';
    this.cainSteps = {};
    this.bnetChannel = 'Tristram-RUS-1';
    this.zoomedShots = {};
    this.pollNotice = '';
    this.lastHitUrl = '';
  }

  get data() {
    return window.BLIZZARD_DATA || {
      site: { date: '25.11.1998', dateLong: '25 ноября 1998 г.', hitsBase: 492810 },
      studio: { gateways: [], milestones: [], departments: [], jobs: [] },
      news: [],
      games: [],
      warcraft: { readiness: [], places: [], units: [], resources: [], faq: [] },
      sanctuary: { baseTypes: [], notes: {}, cainQuests: [] },
      support: [],
      poll: { options: [] },
      bnetChannels: [],
      bnetUsers: {},
      bnetPosts: []
    };
  }

  esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  gif(name, scale = 1) {
    return window.webGif ? window.webGif(name, scale) : '';
  }

  url(path = '/') {
    return path === '/' ? BLZ_BASE : BLZ_BASE + path;
  }

  link(path, label, cls = '') {
    return `<a data-url="${this.esc(this.url(path))}"${cls ? ` class="${cls}"` : ''}>${label}</a>`;
  }

  mailLink(addr, label) {
    const safe = this.esc(addr);
    const text = label ? this.esc(label) : safe;
    return `<a href="mailto:${safe}" class="web-mailto" data-mailto="${safe}">${text}</a>`;
  }

  longDate(short) {
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(short || ''));
    if (!m) return String(short || '');
    return `${parseInt(m[1], 10)} ${BLZ_MONTHS[parseInt(m[2], 10) - 1]} ${m[3]} г.`;
  }

  parseRoute(url = '') {
    const raw = String(url || BLZ_BASE).trim();
    const hashIdx = raw.indexOf('#');
    const noHash = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
    const qIdx = noHash.indexOf('?');
    const pathPart = (qIdx >= 0 ? noHash.slice(0, qIdx) : noHash)
      .replace(/^https?:\/{2}(www\.)?[^/]+/i, '')
      .replace(/\/+$/, '')
      .toLowerCase();
    const params = {};
    const queryStr = qIdx >= 0 ? noHash.slice(qIdx + 1) : '';
    queryStr.split('&').forEach(pair => {
      if (!pair) return;
      const [k, v] = pair.split('=');
      try {
        params[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
      } catch (e) {
        params[k] = v || '';
      }
    });
    const routes = {
      '': 'home',
      '/news': params.id ? 'article' : 'news',
      '/games': 'games',
      '/catalog': 'games',
      '/game': 'game',
      '/warcraft': 'warcraft',
      '/azeroth': 'warcraft',
      '/sanctuary': 'sanctuary',
      '/runes': 'sanctuary',
      '/cube': 'sanctuary',
      '/horadric': 'sanctuary',
      '/battlenet': 'battlenet',
      '/bnet': 'battlenet',
      '/tavern': 'battlenet',
      '/support': 'support',
      '/studio': 'studio',
      '/about': 'studio',
      '/search': 'search'
    };
    let section = routes[pathPart] || 'home';
    const lower = raw.toLowerCase();
    if (!routes[pathPart] && lower.includes('warcraft98')) section = 'warcraft';
    if (!routes[pathPart] && lower.includes('battle.net')) section = 'battlenet';
    return { section, params, raw };
  }

  getGameState(id) {
    const gm = window.gameManager;
    const cat = gm && gm.catalog ? gm.catalog[id] : null;
    const installed = Boolean(gm && gm.isInstalled && gm.isInstalled(id));
    const owned = Boolean(gm && ((gm.ownsOnSteam && gm.ownsOnSteam(id)) || (gm.isPurchased && gm.isPurchased(id))));
    const priceDisplay = (cat && cat.priceDisplay) || '';
    return { installed, owned, priceDisplay, catalogEntry: cat };
  }

  getGateway() {
    const gateways = this.data.studio.gateways || [];
    return gateways.find(g => g.id === this.selectedGatewayId) || gateways[0] || { id: 'europe', name: 'Europe', city: '', host: 'eu.battle.net', users: 0, games: 0, basePing56k: 150, status: '', mainChannel: '', note: '' };
  }

  getModem() {
    return BLZ_MODEMS.find(m => m.id === this.selectedModem) || BLZ_MODEMS[2];
  }

  computePingMs(gateway) {
    const base = gateway ? gateway.basePing56k : 150;
    return Math.max(45, base + this.getModem().ping);
  }

  computeDownloadTime(sizeText) {
    const m = /([\d.]+)\s*(MB|GB)/i.exec(String(sizeText || ''));
    let mb = 32;
    if (m) {
      mb = parseFloat(m[1]) || 32;
      if (m[2].toUpperCase() === 'GB') mb *= 1024;
    }
    const rate = this.getModem().rate;
    const totalSec = Math.round((mb * 1024) / rate);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.max(1, Math.round((totalSec % 3600) / 60));
    return hrs > 0 ? `${hrs} ч ${mins} мин` : `${mins} мин`;
  }

  getHits() {
    let hits = this.data.site.hitsBase || 492810;
    try {
      const saved = parseInt(localStorage.getItem(this.hitsStorageKey), 10);
      if (!isNaN(saved) && saved >= hits) hits = saved;
    } catch (e) {}
    return hits;
  }

  bumpHits() {
    const next = this.getHits() + 1;
    try {
      localStorage.setItem(this.hitsStorageKey, String(next));
    } catch (e) {}
    return next;
  }

  loadPoll() {
    const base = {};
    (this.data.poll.options || []).forEach(o => { base[o.id] = o.baseVotes; });
    try {
      const raw = localStorage.getItem(this.pollStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.votes) {
          Object.keys(base).forEach(k => {
            if (typeof parsed.votes[k] === 'number') base[k] = parsed.votes[k];
          });
          return { votes: base, voted: parsed.voted || null };
        }
      }
    } catch (e) {}
    return { votes: base, voted: null };
  }

  savePollVote(optionId) {
    const state = this.loadPoll();
    if (typeof state.votes[optionId] !== 'number' || state.voted) return false;
    state.votes[optionId] += 1;
    state.voted = optionId;
    try {
      localStorage.setItem(this.pollStorageKey, JSON.stringify(state));
    } catch (e) {}
    return true;
  }

  loadBnetPosts() {
    const seeds = (this.data.bnetPosts || []).slice();
    try {
      const raw = localStorage.getItem(this.bnetStorageKey);
      if (raw) {
        const custom = JSON.parse(raw);
        if (Array.isArray(custom)) return custom.concat(seeds);
      }
    } catch (e) {}
    return seeds;
  }

  addBnetPost(channel, nick, role, text) {
    let custom = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(this.bnetStorageKey) || '[]');
      if (Array.isArray(parsed)) custom = parsed;
    } catch (e) {}
    custom.unshift({
      id: `user-${Date.now()}`,
      channel: channel || 'Tristram-RUS-1',
      nick: (nick || 'Wanderer_98').slice(0, 24),
      role: role || 'Герой Санктуария',
      isDev: false,
      time: `${this.data.site.date} сейчас`,
      text: String(text).slice(0, 300)
    });
    try {
      localStorage.setItem(this.bnetStorageKey, JSON.stringify(custom.slice(0, 25)));
    } catch (e) {}
  }

  playTone(kind = 'click') {
    if (window.soundSys && typeof window.soundSys.playClick === 'function') window.soundSys.playClick();
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this._audioCtx) this._audioCtx = new Ctx();
      const ctx = this._audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const shapes = {
        horn: ['sawtooth', 146.8, 220, 0.06, 0.25],
        rune: ['triangle', 330, 660, 0.06, 0.2],
        click: ['square', 440, 440, 0.03, 0.06]
      };
      const [type, f0, f1, vol, dur] = shapes[kind] || shapes.click;
      osc.type = type;
      osc.frequency.setValueAtTime(f0, now);
      if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, now + dur * 0.7);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.start(now);
      osc.stop(now + dur + 0.01);
    } catch (e) {}
  }

  saveTextToNotepad(filename, content) {
    const safeName = String(filename || 'BLIZZARD.TXT').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const body = String(content || '');
    const folder = ['My Computer', 'C:', 'My Documents'];
    if (window.vfs && typeof window.vfs.writeFile === 'function') {
      try { window.vfs.writeFile(folder, safeName, body); } catch (e) {}
    } else if (window.vfs && typeof window.vfs.createFile === 'function') {
      try { window.vfs.createFile(folder, safeName, body); } catch (e) {}
    }
    if (window.appNotepad && typeof window.appNotepad.openWithContent === 'function') {
      window.appNotepad.openWithContent(safeName, body, folder, safeName);
    } else if (window.appNotepad && typeof window.appNotepad.open === 'function') {
      window.appNotepad.open(safeName, body, folder);
    }
  }

  d2() {
    const D = window.Diablo2;
    return D && Array.isArray(D.RUNES) && Array.isArray(D.RUNEWORDS) ? D : null;
  }

  runes() {
    const D = this.d2();
    if (!D) return [];
    const text = stats => Object.keys(stats).map(k => D.statText(k, stats[k])).filter(Boolean).join(', ');
    return D.RUNES.map(([id, name, lvl, weapon, armor, shield]) => ({ id, name, lvl, weapon: text(weapon), armor: text(armor), shield: text(shield) }));
  }

  baseLabel(typeId) {
    const t = (this.data.sanctuary.baseTypes || []).find(b => b.id === typeId);
    return t ? t.label : typeId;
  }

  runewords() {
    const D = this.d2();
    if (!D) return [];
    const runes = this.runes();
    const notes = this.data.sanctuary.notes || {};
    return D.RUNEWORDS.map(rw => ({
      id: rw.id,
      name: rw.name,
      runeIds: rw.runes.slice(),
      runeNames: rw.runes.map(r => (runes.find(x => x.id === r) || { name: r }).name),
      types: rw.types.slice(),
      bases: rw.types.length > 6 ? 'Любое оружие ближнего боя' : rw.types.map(t => this.baseLabel(t)).join(', '),
      sockets: rw.runes.length,
      rlvl: Math.max(...rw.runes.map(r => (runes.find(x => x.id === r) || { lvl: 1 }).lvl)),
      lines: D.statLines(rw.stats),
      note: notes[rw.id] || ''
    }));
  }

  evaluateForge() {
    const seq = this.slottedRunes || [];
    const runes = this.runes();
    const words = this.runewords();
    const sameRunes = words.filter(w => w.runeIds.length === seq.length && w.runeIds.every((id, i) => id === seq[i]));
    const exact = sameRunes.find(w => w.types.includes(this.forgeBase)) || null;
    const wrongBase = exact ? null : sameRunes[0] || null;
    const runeObjs = seq.map(id => runes.find(r => r.id === id)).filter(Boolean);
    return { exact, wrongBase, runeObjs };
  }

  exportSanctuaryScroll() {
    const words = this.runewords();
    const txt = [
      '==============================================================',
      'ХОРАДРИЧЕСКАЯ БИБЛИОТЕКА: РУННЫЕ СЛОВА DIABLO II, АКТ I',
      '==============================================================',
      '',
      ...words.map(w => `* ${w.name} [${w.runeNames.join(' + ')}] - ${w.bases}, ур. ${w.rlvl}\r\n  ${w.lines.join('; ')}`),
      '',
      'Рунное слово собирается только в обычной вещи с точным числом гнёзд,',
      'если руны вставлены в указанном порядке.',
      '',
      `Источник: ${this.url('/sanctuary')}`
    ].join('\r\n');
    this.saveTextToNotepad('BLIZZARD_RUNEWORDS.TXT', txt);
  }

  snowDots(w, h, count, seed) {
    let s = seed;
    const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    let out = '';
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rnd() * w);
      const y = Math.floor(rnd() * h);
      const big = rnd() > 0.78;
      out += `<rect x="${x}" y="${y}" width="${big ? 2 : 1}" height="${big ? 2 : 1}" fill="${rnd() > 0.5 ? '#cfe4ff' : '#7f9fcc'}"/>`;
    }
    return out;
  }

  flake(cx, cy, r, color, width) {
    let out = '';
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const mx = cx + Math.cos(a) * r * 0.55;
      const my = cy + Math.sin(a) * r * 0.55;
      const b1 = a + 0.6;
      const b2 = a - 0.6;
      const br = r * 0.28;
      out += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
      out += `<line x1="${mx.toFixed(1)}" y1="${my.toFixed(1)}" x2="${(mx + Math.cos(b1) * br).toFixed(1)}" y2="${(my + Math.sin(b1) * br).toFixed(1)}"/>`;
      out += `<line x1="${mx.toFixed(1)}" y1="${my.toFixed(1)}" x2="${(mx + Math.cos(b2) * br).toFixed(1)}" y2="${(my + Math.sin(b2) * br).toFixed(1)}"/>`;
    }
    return `<g stroke="${color}" stroke-width="${width}" stroke-linecap="square">${out}</g>`;
  }

  renderMastheadSvg() {
    const word = 'BLIZZARD';
    const text = (dx, dy, fill, extra = '') => `<text x="${22 + dx}" y="${72 + dy}" font-family="Impact, 'Arial Black', sans-serif" font-size="70" textLength="400" lengthAdjust="spacingAndGlyphs" fill="${fill}" ${extra}>${word}</text>`;
    let icicles = '';
    [36, 68, 104, 140, 171, 214, 252, 290, 330, 368, 404].forEach((x, i) => {
      const len = 6 + ((i * 7) % 11);
      icicles += `<polygon points="${x},73 ${x + 5},73 ${x + 2},${73 + len}" fill="#cfe4ff"/>`;
    });
    return `
      <svg class="blz-mast-svg" viewBox="0 0 760 100" width="760" height="100" xmlns="http://www.w3.org/2000/svg">
        <defs><clipPath id="blz-mast-low"><rect x="0" y="47" width="760" height="40"/></clipPath></defs>
        <rect width="760" height="100" fill="#0b1e44"/>
        <polygon points="0,100 0,84 60,70 110,80 170,62 240,78 300,66 380,82 450,64 520,76 600,58 680,74 760,64 760,100" fill="#10285a"/>
        <polygon points="0,100 0,92 90,84 160,92 260,82 340,94 430,86 540,95 640,85 760,93 760,100" fill="#163470"/>
        ${this.snowDots(760, 100, 140, 1998)}
        ${text(5, 5, '#050d20')}
        ${text(3, 3, '#2b5a9a')}
        ${text(0, 0, '#e8f4ff')}
        ${text(0, 0, '#8db7ea', 'clip-path="url(#blz-mast-low)"')}
        <rect x="22" y="46" width="400" height="1" fill="#ffffff"/>
        ${icicles}
        <text x="26" y="95" font-family="Verdana, Tahoma, sans-serif" font-size="11" textLength="250" fill="#9aa6b8">ENTERTAINMENT</text>
        ${this.flake(680, 44, 32, '#cfe4ff', 3)}
        ${this.flake(680, 44, 32, '#2b5a9a', 1)}
        <text x="744" y="94" text-anchor="end" font-family="Verdana, Tahoma, sans-serif" font-size="10" fill="#7f9fcc">Ирвайн / Сан-Матео</text>
      </svg>`;
  }

  renderBoxArt(id, outW = 96, outH = 132) {
    const w = 96;
    const h = 132;
    const sideColors = { diablo: '#3a1410', diablo2: '#4a3a1a', ow98: '#9aa6b8', warcraft: '#8a6a3a' };
    const side = `<polygon points="${w - 10},4 ${w},0 ${w},${h - 8} ${w - 10},${h - 4}" fill="${sideColors[id] || '#222'}" stroke="#000" stroke-width="1"/>`;
    const face = (fill) => `<rect x="0" y="4" width="${w - 10}" height="${h - 8}" fill="${fill}" stroke="#000" stroke-width="1"/>`;
    const fw = w - 10;
    const cx = fw / 2;
    const arts = {
      diablo: `${face('#140606')}
        <path d="M${cx - 22},${h - 30} L${cx - 22},${50} Q${cx},${18} ${cx + 22},${50} L${cx + 22},${h - 30} Z" fill="#2a0a08" stroke="#6a5a50" stroke-width="2"/>
        <polygon points="${cx},${44} ${cx - 10},${h - 34} ${cx + 10},${h - 34}" fill="#9b1b12"/>
        <polygon points="${cx},${60} ${cx - 5},${h - 34} ${cx + 5},${h - 34}" fill="#f0a020"/>
        <text x="${cx}" y="${h - 14}" text-anchor="middle" font-family="'Times New Roman', serif" font-weight="bold" font-size="17" fill="#c8281c" stroke="#000" stroke-width="0.6">DIABLO</text>
        <text x="${cx}" y="${h - 6}" text-anchor="middle" font-family="Verdana, sans-serif" font-size="5" fill="#8a7a6a">BLIZZARD NORTH</text>`,
      diablo2: `${face('#1a1208')}
        <path d="M${cx - 24},${h - 34} L${cx - 24},${46} Q${cx},${14} ${cx + 24},${46} L${cx + 24},${h - 34} Z" fill="#0a0604" stroke="#c7b377" stroke-width="2"/>
        <circle cx="${cx}" cy="${62}" r="7" fill="#9b1b12"/>
        <circle cx="${cx}" cy="${62}" r="3" fill="#ffd040"/>
        <text x="${cx}" y="${h - 22}" text-anchor="middle" font-family="'Times New Roman', serif" font-weight="bold" font-size="15" fill="#c7b377">DIABLO</text>
        <text x="${cx}" y="${h - 8}" text-anchor="middle" font-family="'Times New Roman', serif" font-weight="bold" font-size="14" fill="#e0d090">II</text>`,
      ow98: `${face('#f2f2f2')}
        <rect x="0" y="${h - 40}" width="${fw}" height="36" fill="#26406a"/>
        <circle cx="${cx}" cy="${48}" r="20" fill="none" stroke="#f99e1a" stroke-width="7"/>
        <rect x="${cx - 3}" y="${24}" width="6" height="12" fill="#f2f2f2"/>
        <rect x="${cx - 12}" y="${54}" width="9" height="16" fill="#f2f2f2" transform="rotate(-35 ${cx - 8} ${62})"/>
        <rect x="${cx + 3}" y="${54}" width="9" height="16" fill="#f2f2f2" transform="rotate(35 ${cx + 8} ${62})"/>
        <text x="${cx}" y="${h - 22}" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="12" fill="#ffffff">OVERWATCH</text>
        <text x="${cx}" y="${h - 9}" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="11" fill="#f99e1a">98</text>`,
      warcraft: `${face('#d8c08a')}
        <path d="M${cx - 30},${30} h22 v22 q0,14 -11,20 q-11,-6 -11,-20 Z" fill="#2a4a9a" stroke="#3b2a12"/>
        <rect x="${cx - 20.5}" y="${34}" width="3" height="32" fill="#e0c050"/>
        <rect x="${cx - 28}" y="${44}" width="18" height="3" fill="#e0c050"/>
        <path d="M${cx + 8},${30} h22 v22 q0,14 -11,20 q-11,-6 -11,-20 Z" fill="#8a1a10" stroke="#3b2a12"/>
        <rect x="${cx + 17.5}" y="${34}" width="3" height="32" fill="#1a1008"/>
        <path d="M${cx + 19},${38} q-9,4 -8,12 q4,-3 8,-4 Z M${cx + 19},${38} q9,4 8,12 q-4,-3 -8,-4 Z" fill="#1a1008"/>
        <text x="${cx}" y="${h - 30}" text-anchor="middle" font-family="'Times New Roman', serif" font-weight="bold" font-size="14" fill="#3b2a12">WARCRAFT</text>
        <text x="${cx}" y="${h - 20}" text-anchor="middle" font-family="Verdana, sans-serif" font-size="6" fill="#3b2a12">Хроники Азерота</text>
        <rect x="${cx - 24}" y="${h - 17}" width="48" height="11" fill="none" stroke="#9b1b12" stroke-width="1.5"/>
        <text x="${cx}" y="${h - 9}" text-anchor="middle" font-family="Verdana, sans-serif" font-weight="bold" font-size="7" fill="#9b1b12">СКОРО</text>`
    };
    return `<svg class="blz-box-svg" viewBox="0 0 ${w} ${h}" width="${outW}" height="${outH}" xmlns="http://www.w3.org/2000/svg">${arts[id] || face('#333')}${side}</svg>`;
  }

  renderWarcraftBanner() {
    let flakes = '';
    for (let i = 0; i < 9; i++) flakes += `<rect x="${330 + i * 14}" y="${8 + ((i * 13) % 40)}" width="2" height="2" fill="#5a4020"/>`;
    return `
      <a data-url="${this.url('/warcraft')}" class="blz-banner" title="Warcraft: Хроники Азерота">
        <svg viewBox="0 0 468 60" width="468" height="60" xmlns="http://www.w3.org/2000/svg">
          <rect width="468" height="60" fill="#e4d2a0" stroke="#3b2a12" stroke-width="2"/>
          <rect x="4" y="4" width="460" height="52" fill="none" stroke="#8a6a3a" stroke-width="1"/>
          <path d="M14,12 h20 v18 q0,12 -10,18 q-10,-6 -10,-18 Z" fill="#2a4a9a" stroke="#3b2a12"/>
          <rect x="22.5" y="15" width="3" height="28" fill="#e0c050"/>
          <rect x="16" y="24" width="16" height="3" fill="#e0c050"/>
          <path d="M434,12 h20 v18 q0,12 -10,18 q-10,-6 -10,-18 Z" fill="#8a1a10" stroke="#3b2a12"/>
          <rect x="442.5" y="15" width="3" height="28" fill="#1a1008"/>
          <path d="M444,18 q-8,3 -7,10 q4,-3 7,-3 Z M444,18 q8,3 7,10 q-4,-3 -7,-3 Z" fill="#1a1008"/>
          ${flakes}
          <text x="48" y="30" font-family="'Times New Roman', serif" font-weight="bold" font-size="22" fill="#3b2a12">WARCRAFT: Хроники Азерота</text>
          <text x="48" y="47" font-family="Verdana, sans-serif" font-size="10" fill="#5a4020">Альянс против Орды. Скоро в Steam для Win 98. Послушайте отряды!</text>
        </svg>
      </a>`;
  }

  renderEmblem(side) {
    if (side === 'alliance') {
      return `<svg viewBox="0 0 64 72" width="64" height="72" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="72" fill="#1a2a5a"/>
        <path d="M10,8 h44 v26 q0,22 -22,32 q-22,-10 -22,-32 Z" fill="#2a4a9a" stroke="#e0c050" stroke-width="2"/>
        <rect x="30" y="14" width="4" height="44" fill="#e0c050"/>
        <rect x="16" y="28" width="32" height="4" fill="#e0c050"/>
        <rect x="27" y="10" width="10" height="4" fill="#e0c050"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 64 72" width="64" height="72" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="72" fill="#3a0a06"/>
      <path d="M12,6 h40 v50 l-20,12 l-20,-12 Z" fill="#8a1a10" stroke="#1a1008" stroke-width="2"/>
      <rect x="30" y="12" width="4" height="48" fill="#1a1008"/>
      <path d="M32,18 q-16,6 -14,22 q7,-6 14,-7 Z M32,18 q16,6 14,22 q-7,-6 -14,-7 Z" fill="#1a1008"/>
    </svg>`;
  }

  renderAzerothMap() {
    const wc = this.data.warcraft;
    const pins = (wc.places || []).map(p => {
      const on = p.id === this.selectedPlaceId;
      const col = p.side === 'horde' ? '#8a1a10' : '#2a4a9a';
      return `<g class="blz-wc-pin" data-wc-place="${this.esc(p.id)}">
        <rect x="${p.x - (on ? 6 : 4)}" y="${p.y - (on ? 6 : 4)}" width="${on ? 12 : 8}" height="${on ? 12 : 8}" fill="${col}" stroke="${on ? '#f0e0a0' : '#1a1008'}" stroke-width="${on ? 2 : 1}"/>
        <text x="${p.x + 9}" y="${p.y + 4}" font-family="Verdana, sans-serif" font-size="9" font-weight="${on ? 'bold' : 'normal'}" fill="#2a1a08">${this.esc(p.name)}</text>
      </g>`;
    }).join('');
    return `
      <svg class="blz-wc-map" viewBox="0 0 300 240" width="300" height="240" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="240" fill="#a8b8a8"/>
        <path d="M150,8 L250,4 L272,30 L240,52 L250,84 L232,108 L252,132 L236,160 L250,190 L236,226 L190,232 L150,220 L112,226 L92,200 L100,170 L80,140 L98,112 L84,84 L110,60 L104,30 Z" fill="#dcc690" stroke="#5a4020" stroke-width="2"/>
        <path d="M24,96 L62,90 L70,118 L48,136 L22,126 Z" fill="#dcc690" stroke="#5a4020" stroke-width="2"/>
        <path d="M196,196 L238,196 L232,222 L200,224 Z" fill="#7a6a4a"/>
        <path d="M104,112 Q150,124 232,108" fill="none" stroke="#8a7050" stroke-width="1" stroke-dasharray="3 3"/>
        <path d="M100,170 Q160,160 236,160" fill="none" stroke="#8a7050" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="10" y="232" font-family="'Times New Roman', serif" font-style="italic" font-size="11" fill="#3b4a3b">Великое море</text>
        ${pins}
        <rect x="1" y="1" width="298" height="238" fill="none" stroke="#3b2a12" stroke-width="2"/>
      </svg>`;
  }

  shapeOf(typeId) {
    const t = (this.data.sanctuary.baseTypes || []).find(b => b.id === typeId);
    return t ? t.shape : 'blade';
  }

  renderItemSvg(typeId, slotIds, runes) {
    const shapes = {
      blade: '<polygon points="40,6 50,6 52,128 45,140 38,128" /><rect x="22" y="140" width="46" height="8"/><rect x="40" y="148" width="10" height="26"/><rect x="37" y="174" width="16" height="6"/>',
      axe: '<rect x="41" y="20" width="8" height="160"/><path d="M49,22 Q86,30 80,80 Q66,64 49,66 Z"/><path d="M41,22 Q14,34 20,62 Q30,52 41,54 Z"/>',
      blunt: '<rect x="41" y="60" width="8" height="120"/><rect x="26" y="10" width="38" height="54"/><rect x="20" y="20" width="6" height="34"/><rect x="64" y="20" width="6" height="34"/>',
      pole: '<rect x="42" y="30" width="6" height="150"/><polygon points="45,2 56,34 34,34"/><rect x="34" y="34" width="22" height="4"/>',
      wand: '<rect x="41" y="40" width="8" height="120"/><circle cx="45" cy="30" r="14"/>',
      bow: '<path d="M30,6 Q76,94 30,182 L36,182 Q84,94 36,6 Z"/><rect x="29" y="6" width="2" height="176"/>',
      body: '<path d="M14,20 L32,8 L58,8 L76,20 L84,64 L70,66 L68,176 L22,176 L20,66 L6,64 Z"/>',
      helm: '<path d="M14,120 Q14,40 45,40 Q76,40 76,120 L62,120 L62,96 L28,96 L28,120 Z"/>',
      shield: '<path d="M10,20 L80,20 L80,96 Q80,150 45,176 Q10,150 10,96 Z"/>'
    };
    const shape = this.shapeOf(typeId);
    const n = Math.max(slotIds.length, 1);
    const pts = [];
    const tall = ['blade', 'axe', 'blunt', 'pole', 'wand', 'bow'];
    for (let i = 0; i < n; i++) {
      if (tall.includes(shape)) pts.push([45, 40 + i * Math.min(26, 120 / n)]);
      else pts.push([n > 3 ? (i % 2 ? 58 : 32) : 45, (shape === 'helm' ? 60 : 50) + (n > 3 ? Math.floor(i / 2) * 30 : i * 30)]);
    }
    const sockets = pts.map(([x, y], i) => {
      const id = slotIds[i];
      const r = id ? runes.find(x2 => x2.id === id) : null;
      return `<circle cx="${x}" cy="${y}" r="10" fill="${r ? '#2e2a24' : '#000000'}" stroke="#4a4a4a" stroke-width="2"/>${r ? `<text x="${x}" y="${y + 3}" text-anchor="middle" font-family="Verdana, sans-serif" font-size="8" fill="#e0d090">${this.esc(r.name)}</text>` : ''}`;
    }).join('');
    return `<svg class="blz-forge-item" viewBox="0 0 90 190" width="90" height="190" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="190" fill="#0a0a0a"/><g fill="#6e6e6e" stroke="#9a9a9a" stroke-width="1">${shapes[shape] || shapes.blade}</g>${slotIds.length ? sockets : ''}</svg>`;
  }

  renderHeader(view) {
    const active = view === 'game' ? 'games' : view === 'article' ? 'news' : view;
    return `
      <tr><td class="blz-mast"><a data-url="${BLZ_BASE}" title="Blizzard Entertainment">${this.renderMastheadSvg()}</a></td></tr>
      <tr><td class="blz-navrow">
        <table class="blz-nav" cellspacing="0" cellpadding="0"><tr>
          ${BLZ_NAV.map(([key, path, label]) => `<td><a data-url="${this.esc(this.url(path))}" class="blz-nav-btn${active === key ? ' active' : ''}">${label}</a></td>`).join('')}
        </tr></table>
      </td></tr>
      <tr><td class="blz-strip">
        <table width="100%" cellspacing="0" cellpadding="0"><tr>
          <td class="blz-strip-date">Обновлено ${this.esc(this.data.site.dateLong)}</td>
          <td align="right">
            <input type="text" class="blz-input" id="blz-site-search" size="22" placeholder="руны, Андариэль, батрак">
            <button class="blz-btn" id="blz-site-search-btn">Найти</button>
          </td>
        </tr></table>
      </td></tr>`;
  }

  renderSteamControls(gameId) {
    const st = this.getGameState(gameId);
    const id = this.esc(gameId);
    if (st.installed) {
      return `<div class="blz-steam-state">Установлена в C:\\Games</div><button class="blz-btn blz-btn-go blz-btn-launch-game" data-game-id="${id}">Запустить игру</button>`;
    }
    if (st.owned) {
      return `<div class="blz-steam-state">Куплена, ещё не загружена</div><button class="blz-btn blz-btn-go blz-btn-open-steam" data-game-id="${id}">Скачать в Steam</button>`;
    }
    return `<div class="blz-steam-state">Продаётся в Steam</div><button class="blz-btn blz-btn-go blz-btn-open-steam" data-game-id="${id}">Купить в Steam (${this.esc(st.priceDisplay)})</button>`;
  }

  renderModemSelect() {
    return `<select class="blz-select" id="blz-modem-select">${BLZ_MODEMS.map(m => `<option value="${m.id}"${m.id === this.selectedModem ? ' selected' : ''}>${m.label}</option>`).join('')}</select>`;
  }

  newsHref(item) {
    return this.url(`/news?id=${item.id}`);
  }

  renderHome() {
    const d = this.data;
    const news = (d.news || []).filter(n => this.newsFilter === 'all' || n.cat === this.newsFilter);
    const poll = this.loadPoll();
    const total = Object.values(poll.votes).reduce((a, b) => a + b, 0) || 1;
    const fresh = (d.news || []).slice(0, 2).map(n => n.id);
    const ticker = (d.news || []).slice(0, 3).map(n => `${n.date}: ${this.esc(n.title)}`).join(' &nbsp;&nbsp;&nbsp; ');
    return `
      <marquee class="blz-ticker" scrollamount="3">${ticker}</marquee>
      <div class="blz-home-banner">${this.renderWarcraftBanner()}</div>
      <table class="blz-home" cellspacing="0" cellpadding="0"><tr>
        <td class="blz-home-main">
          <h1 class="blz-h1">Что нового</h1>
          <div class="blz-filter">Показать:
            ${BLZ_NEWS_FILTERS.map(([key, label]) => `<a class="blz-filter-link${this.newsFilter === key ? ' active' : ''}" data-news-filter="${key}">${label}</a>`).join(' | ')}
          </div>
          ${news.length ? news.map(n => `
            <table class="blz-news-card" cellspacing="0" cellpadding="0"><tr>
              <td class="blz-news-date">${this.esc(n.date.slice(0, 5))}<br><span>${this.esc(n.date.slice(6))}</span></td>
              <td class="blz-news-text">
                <div class="blz-news-cat">${this.esc(n.catLabel)}${fresh.includes(n.id) ? ` ${this.gif('new')}` : ''}</div>
                <a data-url="${this.esc(this.newsHref(n))}" class="blz-news-title">${this.esc(n.title)}</a>
                <p>${this.esc(n.lead)}</p>
              </td>
            </tr></table>`).join('') : '<p class="blz-empty">В этой рубрике пока нет новостей.</p>'}
          <p class="blz-more">${this.link('/news', 'Все новости и пресс-релизы')}</p>
        </td>
        <td class="blz-home-side">
          <div class="blz-side-head">Наши игры в Steam</div>
          <table class="blz-side-games" cellspacing="0" cellpadding="0">
            ${(d.games || []).map(g => {
              const st = this.getGameState(g.id);
              const state = st.installed ? 'установлена' : st.owned ? 'в библиотеке' : this.esc(st.priceDisplay);
              return `<tr>
                <td class="blz-side-box">${this.link(`/game?id=${g.id}`, this.renderBoxArt(g.id, 48, 66))}</td>
                <td>${this.link(`/game?id=${g.id}`, `<b>${this.esc(g.title)}</b>`)}<br><span class="blz-side-note">${this.esc(g.genre)}, ${state}</span></td>
              </tr>`;
            }).join('')}
            <tr>
              <td class="blz-side-box">${this.link('/warcraft', this.renderBoxArt('warcraft', 48, 66))}</td>
              <td>${this.link('/warcraft', '<b>Warcraft</b>')}<br><span class="blz-side-note">Хроники Азерота, скоро</span></td>
            </tr>
          </table>

          <div class="blz-side-head">Battle.net сейчас</div>
          <table class="blz-side-bnet" cellspacing="0">
            <tr><th>Шлюз</th><th>Игроков</th><th>Игр</th></tr>
            ${(d.studio.gateways || []).map(g => `<tr><td>${this.esc(g.name)}</td><td>${g.users.toLocaleString('ru-RU')}</td><td>${g.games.toLocaleString('ru-RU')}</td></tr>`).join('')}
          </table>
          <p class="blz-side-note">${this.link('/battlenet', 'Войти в веб-чат Battle.net')}</p>

          <div class="blz-side-head">Опрос</div>
          <div class="blz-poll">
            <b>${this.esc(d.poll.question)}</b>
            ${poll.voted ? `
              <table class="blz-poll-res" cellspacing="0">
                ${(d.poll.options || []).map(o => {
                  const pct = Math.round(((poll.votes[o.id] || 0) / total) * 100);
                  return `<tr><td colspan="2">${this.esc(o.label)}${poll.voted === o.id ? ' <b>(ваш выбор)</b>' : ''}</td></tr>
                    <tr><td class="blz-poll-bar"><div style="width:${pct}%"></div></td><td class="blz-poll-pct">${pct}%</td></tr>`;
                }).join('')}
              </table>
              <div class="blz-side-note">Всего голосов: ${total}</div>` : `
              ${(d.poll.options || []).map(o => `<label class="blz-poll-opt"><input type="radio" name="blz-poll" value="${this.esc(o.id)}"> ${this.esc(o.label)}</label>`).join('')}
              <button class="blz-btn" id="blz-poll-vote">Голосовать</button>
              ${this.pollNotice ? `<div class="blz-poll-notice">${this.esc(this.pollNotice)}</div>` : ''}`}
          </div>
        </td>
      </tr></table>`;
  }

  renderNewsList() {
    const d = this.data;
    return `
      <div class="blz-room">
        <h1 class="blz-h1">Новости и пресс-релизы</h1>
        <p>Здесь собраны все сообщения Blizzard Entertainment и Blizzard North с октября 1998 года. Щёлкните по заголовку, чтобы прочитать полный текст.</p>
        <table class="blz-room-table" cellspacing="0">
          <tr><th>Дата</th><th>Рубрика</th><th>Заголовок</th><th>Откуда</th></tr>
          ${(d.news || []).map(n => `<tr>
            <td class="blz-nowrap">${this.esc(n.date)}</td>
            <td class="blz-nowrap">${this.esc(n.catLabel)}</td>
            <td><a data-url="${this.esc(this.newsHref(n))}">${this.esc(n.title)}</a></td>
            <td>${this.esc(n.from)}</td>
          </tr>`).join('')}
        </table>
        <p class="blz-room-note">Журналистам: вопросы по пресс-релизам присылайте на ${this.mailLink('support@blizzard.com')}, в теме письма укажите «Пресса».</p>
      </div>`;
  }

  renderArticle(id) {
    const d = this.data;
    const n = (d.news || []).find(x => x.id === id);
    if (!n) {
      return `<div class="blz-room"><h1 class="blz-h1">Новость не найдена</h1><p>Такого пресс-релиза нет. Посмотрите ${this.link('/news', 'список всех новостей')}.</p></div>`;
    }
    const city = /Сан-Матео/.test(n.from) ? 'САН-МАТЕО' : 'ИРВАЙН';
    const gameLink = n.gameId === 'warcraft' ? this.link('/warcraft', 'Страница Warcraft') : n.gameId ? this.link(`/game?id=${n.gameId}`, 'Страница игры') : this.link('/battlenet', 'Веб-чат Battle.net');
    return `
      <div class="blz-press-wrap">
        <div class="blz-press">
          <table class="blz-press-head" cellspacing="0" cellpadding="0"><tr>
            <td><svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg">${this.flake(20, 20, 16, '#1a1a1a', 2)}</svg></td>
            <td class="blz-press-firm">BLIZZARD ENTERTAINMENT<br><span>${this.esc(n.from)}</span></td>
            <td class="blz-press-for">Для немедленной публикации</td>
          </tr></table>
          <h1>${this.esc(n.title)}</h1>
          <p><b>${city}, Калифорния, ${this.esc(this.longDate(n.date))}</b> — ${this.esc(n.lead)}</p>
          ${(n.body || []).map(p => `<p>${this.esc(p)}</p>`).join('')}
          ${n.bullets && n.bullets.length ? `<ul>${n.bullets.map(b => `<li>${this.esc(b)}</li>`).join('')}</ul>` : ''}
          <p class="blz-press-end">###</p>
          <p class="blz-press-about"><b>О компании Blizzard Entertainment.</b> Blizzard Entertainment из Ирвайна, Калифорния, и её подразделение Blizzard North из Сан-Матео создали Warcraft, Diablo, Diablo II и Overwatch 98. Игры компании продаются в Steam. Служба Battle.net встроена в игры и бесплатна.</p>
          <p class="blz-press-about">Контакт: ${this.mailLink('support@blizzard.com')}</p>
        </div>
        <div class="blz-press-tools">
          <button class="blz-btn blz-btn-save-news" data-news-id="${this.esc(n.id)}">Сохранить как .TXT</button>
          ${this.link('/news', '« Все новости')} | ${gameLink}
        </div>
      </div>`;
  }

  renderGamesCatalog() {
    const d = this.data;
    const games = d.games || [];
    const row = (label, fn) => `<tr><th>${label}</th>${games.map(g => `<td>${fn(g)}</td>`).join('')}</tr>`;
    return `
      <div class="blz-shelf-page">
        <h1 class="blz-h1">Игры Blizzard</h1>
        <p>Все наши игры продаются и загружаются через ${this.link2('http://www.steampowered.com', 'Steam')}. Щёлкните по коробке, чтобы узнать об игре больше.</p>
        <table class="blz-shelf" cellspacing="0" cellpadding="0"><tr>
          ${games.map(g => {
            const st = this.getGameState(g.id);
            const state = st.installed ? 'Установлена' : st.owned ? 'Куплена' : `${this.esc(st.priceDisplay)} в Steam`;
            return `<td>
              ${this.link(`/game?id=${g.id}`, this.renderBoxArt(g.id))}
              <div class="blz-shelf-title">${this.link(`/game?id=${g.id}`, this.esc(g.title))}</div>
              <div class="blz-shelf-genre">${this.esc(g.genre)}</div>
              <div class="blz-shelf-state">${state}</div>
            </td>`;
          }).join('')}
          <td>
            ${this.link('/warcraft', this.renderBoxArt('warcraft'))}
            <div class="blz-shelf-title">${this.link('/warcraft', 'Warcraft')}</div>
            <div class="blz-shelf-genre">Стратегия</div>
            <div class="blz-shelf-state blz-shelf-soon">На подходе, в разработке</div>
          </td>
        </tr></table>

        <h2 class="blz-h2">Пойдёт ли на моём компьютере?</h2>
        <p>Сравните требования и время загрузки. Ваш модем: ${this.renderModemSelect()}</p>
        <table class="blz-compare" cellspacing="0">
          <tr><th></th>${games.map(g => `<th>${this.esc(g.title)}</th>`).join('')}</tr>
          ${row('Процессор', g => this.esc(g.specs.cpu))}
          ${row('Память', g => this.esc(g.specs.ram))}
          ${row('Видео', g => this.esc(g.specs.video))}
          ${row('Система', g => this.esc(g.specs.os))}
          ${row('Экран', g => this.esc(g.screen))}
          ${row('Объём', g => this.esc(g.size))}
          ${row('Загрузка', g => `<b>${this.computeDownloadTime(g.size)}</b>`)}
          ${row('Сеть', g => this.esc(g.net))}
        </table>
      </div>`;
  }

  link2(url, label) {
    return `<a data-url="${this.esc(url)}">${label}</a>`;
  }

  renderGameDetail(gameId) {
    const games = this.data.games || [];
    const g = games.find(x => x.id === gameId) || games[0];
    if (!g) return this.renderGamesCatalog();
    const sections = [
      ['about', 'Об игре'],
      ['heroes', g.classesTitle],
      ['world', g.worldTitle],
      ['people', g.npcsTitle],
      ['keys', 'Управление'],
      ['req', 'Требования']
    ];
    const top = `<a class="blz-top" data-blz-jump="blz-sec-top">наверх</a>`;
    return `
      <table class="blz-game blz-theme-${this.esc(g.theme)}" cellspacing="0" cellpadding="0" id="blz-sec-top"><tr>
        <td class="blz-game-side">
          ${this.renderBoxArt(g.id)}
          <div class="blz-game-buy">${this.renderSteamControls(g.id)}</div>
          <div class="blz-game-dl">
            Загрузка ${this.esc(g.size.split(' (')[0])}<br>
            ${this.renderModemSelect()}<br>
            примерно <b>${this.computeDownloadTime(g.size)}</b>
          </div>
          <div class="blz-game-toc">
            ${sections.map(([id, label]) => `<a data-blz-jump="blz-sec-${id}">${this.esc(label)}</a>`).join('')}
          </div>
          <button class="blz-btn blz-btn-save-dossier" data-game-id="${this.esc(g.id)}">Памятка в Блокнот</button>
          <div class="blz-game-back">${this.link('/games', '« Все игры')}</div>
        </td>
        <td class="blz-game-main">
          <h1 class="blz-game-title">${this.esc(g.title)}</h1>
          <div class="blz-game-tag">${this.esc(g.tagline)}</div>
          <div class="blz-game-sec" id="blz-sec-about">
            <p class="blz-game-sum">${this.esc(g.summary)}</p>
            <table class="blz-game-facts" cellspacing="0">
              <tr><th>Разработчик</th><td>${this.esc(g.studio)}, ${this.esc(g.year)}</td></tr>
              <tr><th>Жанр</th><td>${this.esc(g.genre)}</td></tr>
              <tr><th>Файл</th><td class="blz-mono">${this.esc(g.exe)}</td></tr>
              <tr><th>Сеть</th><td>${this.esc(g.net)}</td></tr>
            </table>
            ${this.renderShots(g)}
          </div>
          <div class="blz-game-sec" id="blz-sec-heroes">
            <h2>${this.esc(g.classesTitle)} ${top}</h2>
            <table class="blz-game-table" cellspacing="0">
              ${(g.classes || []).map(c => `<tr>
                <th>${this.esc(c.name)}</th>
                <td><div class="blz-game-stats">${this.esc(c.stats)}</div><div><b>${this.esc(c.skill)}</b></div><div>${this.esc(c.desc)}</div></td>
              </tr>`).join('')}
            </table>
          </div>
          <div class="blz-game-sec" id="blz-sec-world">
            <h2>${this.esc(g.worldTitle)} ${top}</h2>
            <table class="blz-game-table" cellspacing="0">
              ${(g.tiers || []).map(t => `<tr><th>${this.esc(t.place)}</th><td><b>${this.esc(t.boss)}</b><div>${this.esc(t.foes)}</div></td></tr>`).join('')}
            </table>
          </div>
          <div class="blz-game-sec" id="blz-sec-people">
            <h2>${this.esc(g.npcsTitle)} ${top}</h2>
            <ul>${(g.npcs || []).map(n => `<li>${this.esc(n)}</li>`).join('')}</ul>
          </div>
          <div class="blz-game-sec" id="blz-sec-keys">
            <h2>Управление ${top}</h2>
            <table class="blz-keys" cellspacing="0">
              ${(g.controls || []).map(([k, v]) => `<tr><td class="blz-key">${this.esc(k)}</td><td>${this.esc(v)}</td></tr>`).join('')}
            </table>
          </div>
          <div class="blz-game-sec" id="blz-sec-req">
            <h2>Требования ${top}</h2>
            <table class="blz-game-facts" cellspacing="0">
              <tr><th>Процессор</th><td>${this.esc(g.specs.cpu)}</td></tr>
              <tr><th>Память</th><td>${this.esc(g.specs.ram)}</td></tr>
              <tr><th>Видео</th><td>${this.esc(g.specs.video)}</td></tr>
              <tr><th>Звук</th><td>${this.esc(g.specs.sound)}</td></tr>
              <tr><th>Система</th><td>${this.esc(g.specs.os)}</td></tr>
              <tr><th>Объём</th><td>${this.esc(g.size)}</td></tr>
            </table>
          </div>
        </td>
      </tr></table>`;
  }

  renderShots(g) {
    const cat = this.getGameState(g.id).catalogEntry;
    const shots = [0, 1].map(idx => ({
      key: `${g.id}-${idx}`,
      src: `content/steam/${g.id}-${idx + 1}.jpg`,
      cap: cat && cat.shots && cat.shots[idx] ? cat.shots[idx] : `${g.title}, кадр ${idx + 1}`
    }));
    const big = shots.find(s => this.zoomedShots[s.key]);
    return `
      <table class="blz-shots" cellspacing="0" cellpadding="0">
        ${big ? `<tr><td colspan="2" class="blz-shot-big">
          <img src="${this.esc(big.src)}" alt="${this.esc(big.cap)}" width="480" height="360" data-shot-zoom="${this.esc(big.key)}" class="blz-shot">
          <div class="blz-shot-cap">${this.esc(big.cap)}. <b>[Уменьшить]</b></div>
        </td></tr>` : ''}
        <tr>${shots.map(s => `<td>
          <img src="${this.esc(s.src)}" alt="${this.esc(s.cap)}" width="236" height="177" data-shot-zoom="${this.esc(s.key)}" class="blz-shot${big === s ? ' active' : ''}">
          <div class="blz-shot-cap">${this.esc(s.cap)}. ${big === s ? '' : '[Увеличить]'}</div>
        </td>`).join('')}</tr>
      </table>`;
  }

  renderWarcraftPreview() {
    const wc = this.data.warcraft;
    const units = wc.units || [];
    const u = units.find(x => x.id === this.selectedUnitId) || units[0];
    const place = (wc.places || []).find(p => p.id === this.selectedPlaceId) || (wc.places || [])[0];
    const clicks = this.unitClickCounts[u.id] || 0;
    const side = this.warcraftSide;
    const showA = side !== 'horde';
    const showH = side !== 'alliance';
    let stripes = '';
    for (let x = -14; x < 760; x += 28) stripes += `<polygon points="${x},14 ${x + 14},0 ${x + 28},0 ${x + 14},14" fill="#1a1a1a"/>`;
    const bar = pct => `[${'#'.repeat(Math.round(pct / 5))}${'.'.repeat(20 - Math.round(pct / 5))}] ${String(pct).padStart(3, ' ')}%`;
    return `
      <div class="blz-wc">
        <svg class="blz-wc-stripe" viewBox="0 0 760 14" width="760" height="14" xmlns="http://www.w3.org/2000/svg"><rect width="760" height="14" fill="#f0c020"/>${stripes}</svg>
        <table class="blz-wc-head" cellspacing="0" cellpadding="0"><tr>
          <td class="blz-wc-gif">${this.gif('construct', 2)}</td>
          <td>
            <h1>${this.esc(wc.title)}</h1>
            <div class="blz-wc-status">${this.esc(wc.status)}</div>
            <div class="blz-wc-engine">${this.esc(wc.engine)}</div>
          </td>
        </tr></table>
        <p class="blz-wc-lore">${this.esc(wc.loreIntro)}</p>

        <table class="blz-wc-cols" cellspacing="0" cellpadding="0"><tr>
          <td class="blz-wc-left">
            <h2>Карта Азерота</h2>
            ${this.renderAzerothMap()}
            <div class="blz-wc-place"><b>${this.esc(place ? place.name : '')}.</b> ${this.esc(place ? place.note : '')}</div>
            <h2>Журнал сборки</h2>
            <div class="blz-wc-log">${(wc.readiness || []).map(r => `<div>${this.esc(bar(r.pct)).replace(/ /g, '&nbsp;')}</div><div class="blz-wc-log-label">${this.esc(r.label)}</div>`).join('')}</div>
            <button class="blz-btn" id="blz-btn-save-warcraft">Сохранить досье .TXT</button>
          </td>
          <td class="blz-wc-right">
            <h2>Казарма</h2>
            <div class="blz-wc-sides">Сторона:
              <a class="blz-filter-link${side === 'both' ? ' active' : ''}" data-wc-side="both">обе</a> |
              <a class="blz-filter-link${side === 'alliance' ? ' active' : ''}" data-wc-side="alliance">Альянс</a> |
              <a class="blz-filter-link${side === 'horde' ? ' active' : ''}" data-wc-side="horde">Орда</a>
            </div>
            <table class="blz-wc-units" cellspacing="0">
              ${units.map(x => `<tr class="${x.id === u.id ? 'active' : ''}">
                <td><a data-wc-unit="${this.esc(x.id)}">${showA ? this.esc(x.allianceName) : ''}${showA && showH ? ' / ' : ''}${showH ? this.esc(x.hordeName) : ''}</a></td>
                <td>${this.esc(x.role)}</td>
              </tr>`).join('')}
            </table>
            <table class="blz-wc-pick" cellspacing="0" cellpadding="0"><tr>
              ${showA ? `<td><button class="blz-wc-portrait" id="blz-btn-order-alliance" data-unit-id="${this.esc(u.id)}" title="Щёлкните по отряду">${this.renderEmblem('alliance')}</button><div>${this.esc(u.allianceName)}</div></td>` : ''}
              ${showH ? `<td><button class="blz-wc-portrait" id="blz-btn-order-horde" data-unit-id="${this.esc(u.id)}" title="Щёлкните по отряду">${this.renderEmblem('horde')}</button><div>${this.esc(u.hordeName)}</div></td>` : ''}
            </tr></table>
            <div class="blz-wc-voice" id="blz-unit-quote-box">${this.lastUnitQuote ? `<b>${this.esc(this.lastUnitSpeaker)}:</b> ${this.esc(this.lastUnitQuote)}` : 'Щёлкните по щиту, чтобы отдать приказ. Попробуйте щёлкнуть несколько раз подряд.'}</div>
            <div class="blz-wc-count">Щелчков подряд: <b id="blz-unit-click-count">${clicks}</b></div>
            <table class="blz-wc-stats" cellspacing="0">
              <tr><th>Задача</th><td>${this.esc(u.role)}</td></tr>
              <tr><th>Цена</th><td>${this.esc(u.cost)}</td></tr>
              <tr><th>Бой</th><td>${this.esc(u.stats)}</td></tr>
              <tr><th>Умения</th><td>${this.esc(u.ability)}</td></tr>
            </table>
          </td>
        </tr></table>

        <h2>Ресурсы</h2>
        <table class="blz-wc-res" cellspacing="0">
          ${(wc.resources || []).map(r => `<tr><th>${this.esc(r.name)}</th><td>${this.esc(r.desc)}</td></tr>`).join('')}
        </table>
        <h2>Вопросы и ответы</h2>
        <dl class="blz-wc-faq">${(wc.faq || []).map(f => `<dt>${this.esc(f.q)}</dt><dd>${this.esc(f.a)}</dd>`).join('')}</dl>
      </div>`;
  }

  renderSanctuaryArchive() {
    const sanc = this.data.sanctuary;
    const runes = this.runes();
    const words = this.runewords();
    const ev = this.evaluateForge();
    const seq = this.slottedRunes || [];
    const tooltip = ev.exact ? `
      <div class="blz-tip-gold">${this.esc(ev.exact.name)}</div>
      <div class="blz-tip-gold">${this.esc(this.baseLabel(this.forgeBase))}</div>
      <div class="blz-tip-gold">'${this.esc(ev.exact.runeNames.join(''))}'</div>
      <div class="blz-tip-white">Требуемый уровень: ${ev.exact.rlvl}</div>
      ${ev.exact.lines.map(l => `<div class="blz-tip-blue">${this.esc(l)}</div>`).join('')}
      <div class="blz-tip-gray">Гнёзд: ${ev.exact.sockets}</div>
      <div class="blz-tip-msg">РУННОЕ СЛОВО СОБРАНО: «${this.esc(ev.exact.name)}»</div>` : seq.length ? `
      <div class="blz-tip-gray">${this.esc(this.baseLabel(this.forgeBase))}</div>
      <div class="blz-tip-white">Гнёзд: ${seq.length}</div>
      ${ev.runeObjs.map(r => `<div class="blz-tip-blue">${this.esc(r.name)}: ${this.esc(['shield'].includes(this.forgeBase) ? r.shield : ['body', 'helm', 'circlet'].includes(this.forgeBase) ? r.armor : r.weapon)}</div>`).join('')}
      <div class="blz-tip-msg">${ev.wrongBase ? `Эти руны дают «${this.esc(ev.wrongBase.name)}», но только в такой вещи: ${this.esc(ev.wrongBase.bases.toLowerCase())}.` : 'Рунного слова нет. Вещь получит только свойства самих рун.'}</div>` : `
      <div class="blz-tip-gray">${this.esc(this.baseLabel(this.forgeBase))}</div>
      <div class="blz-tip-msg">Гнёзда пусты. Щёлкайте по рунам ниже.</div>`;
    return `
      <div class="blz-lib">
        <h1 class="blz-lib-title">Хорадрическая библиотека</h1>
        <p class="blz-lib-intro">«Постой и послушай.» Здесь собраны руны и рунные слова Diablo II в том виде, в каком их знает Акт I, и подсказки Декарда Каина для обеих частей Diablo. ${this.d2() ? '' : '<b>Справочник рун сейчас недоступен.</b>'}</p>

        <h2 class="blz-lib-h2">Кузница рун</h2>
        <table class="blz-forge" cellspacing="0" cellpadding="0"><tr>
          <td class="blz-forge-left">
            ${this.renderItemSvg(this.forgeBase, seq, runes)}
            <div class="blz-forge-base">Вещь:
              <select class="blz-select" id="blz-forge-base">${(sanc.baseTypes || []).map(b => `<option value="${b.id}"${b.id === this.forgeBase ? ' selected' : ''}>${this.esc(b.label)}</option>`).join('')}</select>
            </div>
          </td>
          <td class="blz-forge-right">
            <div class="blz-tip">${tooltip}</div>
            <div class="blz-forge-seq">В гнёздах: ${seq.length ? seq.map(id => this.esc((runes.find(r => r.id === id) || { name: id }).name)).join(' + ') : 'пусто'}</div>
            <button class="blz-btn" id="blz-forge-pop">Вынуть последнюю</button>
            <button class="blz-btn" id="blz-clear-runes">Очистить гнёзда</button>
          </td>
        </tr></table>
        <div class="blz-stones">
          ${runes.map(r => `<button class="blz-stone" data-add-rune="${this.esc(r.id)}" title="${this.esc(r.name)}, уровень ${r.lvl}">${this.esc(r.name)}<span>${r.lvl}</span></button>`).join('')}
        </div>

        <h2 class="blz-lib-h2">Все рунные слова Акта I</h2>
        <table class="blz-lib-table" cellspacing="0">
          <tr><th>Слово</th><th>Руны по порядку</th><th>Вещь</th><th>Ур.</th><th>Совет Каина</th></tr>
          ${words.map(w => `<tr class="${w.id === this.selectedRunewordId ? 'active' : ''}">
            <td><a class="blz-rw-link" data-rw-preset="${this.esc(w.id)}">${this.esc(w.name)}</a></td>
            <td class="blz-nowrap">${this.esc(w.runeNames.join(' + '))}</td>
            <td>${this.esc(w.bases)}</td>
            <td>${w.rlvl}</td>
            <td>${this.esc(w.note)}</td>
          </tr>`).join('')}
        </table>
        <button class="blz-btn" id="blz-btn-save-tome">Справочник рунных слов в Блокнот</button>

        <h2 class="blz-lib-h2">Свитки Декарда Каина</h2>
        <p class="blz-lib-intro">Каждая подсказка разбита на три свитка: где искать, как победить и что получите. Открывайте только то, что нужно.</p>
        ${(sanc.cainQuests || []).map(q => {
          const step = this.cainSteps[q.id] || 0;
          return `<div class="blz-scroll">
            <div class="blz-scroll-head"><b>${this.esc(q.title)}</b> <span>${this.esc(q.game)}, открыто ${step} из ${q.steps.length}</span></div>
            ${q.steps.slice(0, step).map(s => `<p>${this.esc(s)}</p>`).join('')}
            <div class="blz-scroll-tools">
              ${step < q.steps.length ? `<button class="blz-btn blz-btn-cain-next" data-quest-id="${this.esc(q.id)}">Открыть свиток ${step + 1}</button>` : '<span class="blz-scroll-done">Все 3 свитка открыты</span>'}
              ${step > 0 ? `<button class="blz-btn blz-btn-cain-reset" data-quest-id="${this.esc(q.id)}">Свернуть</button>` : ''}
            </div>
          </div>`;
        }).join('')}

        <h2 class="blz-lib-h2">Свойства рун</h2>
        <table class="blz-lib-table blz-lib-runes" cellspacing="0">
          <tr><th>Руна</th><th>Ур.</th><th>В оружии</th><th>В броне и шлеме</th><th>В щите</th></tr>
          ${runes.map(r => `<tr><td><b>${this.esc(r.name)}</b></td><td>${r.lvl}</td><td>${this.esc(r.weapon)}</td><td>${this.esc(r.armor)}</td><td>${this.esc(r.shield)}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  renderBattleNet() {
    const d = this.data;
    const gw = this.getGateway();
    const ping = this.computePingMs(gw);
    const order = p => (String(p.id).startsWith('user-') ? `9${String(p.id).slice(5).padStart(16, '0')}` : `0${p.time}`);
    const posts = this.loadBnetPosts().filter(p => p.channel === this.bnetChannel).sort((a, b) => (order(a) < order(b) ? -1 : 1));
    const users = (d.bnetUsers[this.bnetChannel] || []).slice();
    this.loadBnetPosts().forEach(p => { if (p.channel === this.bnetChannel && !users.includes(p.nick)) users.push(p.nick); });
    return `
      <div class="blz-bn-page">
        <h1 class="blz-h1">Battle.net</h1>
        <p>Battle.net встроен в Diablo и Diablo II и ничего не стоит. Здесь можно выбрать шлюз, проверить пинг для своего модема и поговорить в каналах прямо из браузера.</p>
        <table class="blz-bn-gw" cellspacing="0">
          <tr><th>Шлюз</th><th>Адрес</th><th>Город</th><th>Игроков</th><th>Игр</th><th>Состояние</th></tr>
          ${(d.studio.gateways || []).map(g => `<tr class="${g.id === gw.id ? 'active' : ''}"><td><b>${this.esc(g.name)}</b></td><td class="blz-mono">${this.esc(g.host)}</td><td>${this.esc(g.city)}</td><td>${g.users.toLocaleString('ru-RU')}</td><td>${g.games.toLocaleString('ru-RU')}</td><td>${this.esc(g.status)}</td></tr>`).join('')}
        </table>
        <div class="blz-bn-calc">
          Шлюз: <select class="blz-select" id="blz-gateway-select">${(d.studio.gateways || []).map(g => `<option value="${this.esc(g.id)}"${g.id === gw.id ? ' selected' : ''}>${this.esc(g.name)} (${this.esc(g.host)})</option>`).join('')}</select>
          Модем: ${this.renderModemSelect()}
          Расчётный пинг: <b>${ping} мс</b>
          <div class="blz-side-note">${this.esc(gw.note)}</div>
        </div>

        <table class="blz-bn" cellspacing="0" cellpadding="0">
          <tr><td colspan="2" class="blz-bn-title">Battle.net: ${this.esc(gw.name)} (${this.esc(gw.host)}), канал ${this.esc(this.bnetChannel)}</td></tr>
          <tr>
            <td class="blz-bn-log" id="blz-bnet-log">
              <div class="blz-chat-sys">Вы вошли в канал ${this.esc(this.bnetChannel)}.</div>
              ${posts.length ? posts.map(p => `<div class="blz-chat-line">
                <span class="blz-chat-time">[${this.esc(p.time.slice(-5))}]</span>
                <span class="${p.isDev ? 'blz-chat-dev' : 'blz-chat-nick'}">&lt;${this.esc(p.nick)}&gt;</span>
                ${p.isDev ? '<span class="blz-chat-badge">[Blizzard]</span>' : ''}
                <span class="blz-chat-text">${this.esc(p.text)}</span>
              </div>`).join('') : '<div class="blz-chat-sys">В канале тихо.</div>'}
            </td>
            <td class="blz-bn-users">
              <div class="blz-bn-chan">${this.esc(this.bnetChannel)} (${users.length})</div>
              ${users.map(n => `<div>${this.esc(n)}</div>`).join('')}
            </td>
          </tr>
          <tr><td colspan="2" class="blz-bn-input">
            Ник: <input type="text" class="blz-input" id="blz-bnet-nick" value="Alexey_98" size="12">
            <select class="blz-select" id="blz-bnet-role-input">
              ${['Некромант (Diablo II)', 'Волшебница (Diablo II)', 'Варвар (Diablo II)', 'Паладин (Diablo II)', 'Воин (Diablo)', 'Чародей (Diablo)', 'Командир Альянса', 'Вождь Орды'].map(r => `<option value="${this.esc(r)}">${this.esc(r)}</option>`).join('')}
            </select>
            <input type="text" class="blz-input" id="blz-bnet-text" size="44" placeholder="Ищу группу, меняю руны, жду Warcraft">
            <button class="blz-btn" id="blz-bnet-send">Отправить</button>
          </td></tr>
          <tr><td colspan="2" class="blz-bn-chans">Каналы:
            ${(d.bnetChannels || []).map(c => `<button class="blz-bn-chanbtn${c === this.bnetChannel ? ' active' : ''}" data-bnet-chan="${this.esc(c)}">${this.esc(c)}</button>`).join('')}
          </td></tr>
        </table>
      </div>`;
  }

  renderSupport() {
    const items = this.data.support || [];
    return `
      <div class="blz-faq">
        <h1>Техническая поддержка</h1>
        <p>Прежде чем писать нам, проверьте ответы на частые вопросы. Если ответа нет, напишите на ${this.mailLink('support@blizzard.com')}: название игры, модель видеокарты и точный текст ошибки.</p>
        <ul class="blz-faq-toc">${items.map(i => `<li><a data-blz-jump="blz-faq-${this.esc(i.id)}">${this.esc(i.q)}</a></li>`).join('')}</ul>
        ${items.map(i => `
          <div class="blz-faq-item" id="blz-faq-${this.esc(i.id)}">
            <h2>${this.esc(i.q)}</h2>
            ${i.a.map(p => `<p>${this.esc(p)}</p>`).join('')}
            <a class="blz-top" data-blz-jump="blz-faq-top">к списку вопросов</a>
          </div>`).join('')}
        <span id="blz-faq-top"></span>
      </div>`;
  }

  renderStudio() {
    const st = this.data.studio;
    return `
      <div class="blz-studio">
        <h1 class="blz-h1">О компании</h1>
        <table class="blz-studio-facts" cellspacing="0">
          <tr><th>Компания</th><td>${this.esc(st.name)} и подразделение ${this.esc(st.northName)}</td></tr>
          <tr><th>Основана</th><td>${this.esc(st.founded)}</td></tr>
          <tr><th>Ирвайн</th><td>${this.esc(st.hq)}</td></tr>
          <tr><th>Сан-Матео</th><td>${this.esc(st.north)}</td></tr>
          <tr><th>Основатели</th><td>${this.esc(st.founders)}</td></tr>
          <tr><th>Правило</th><td><b>${this.esc(st.motto)}</b></td></tr>
          <tr><th>Почта</th><td>${this.mailLink('support@blizzard.com')}</td></tr>
        </table>

        <h2 class="blz-h2">История</h2>
        <table class="blz-history" cellspacing="0">
          ${(st.milestones || []).map(m => `<tr><td class="blz-history-year">${this.esc(m.year)}</td><td>${this.esc(m.text)}</td></tr>`).join('')}
        </table>

        <h2 class="blz-h2">Кто чем занят</h2>
        <table class="blz-room-table" cellspacing="0">
          <tr><th>Отдел</th><th>Работа в ноябре 1998 года</th></tr>
          ${(st.departments || []).map(dp => `<tr><td><b>${this.esc(dp.dept)}</b></td><td>${this.esc(dp.focus)}</td></tr>`).join('')}
        </table>

        <h2 class="blz-h2">Вакансии ${this.gif('new')}</h2>
        ${(st.jobs || []).map(j => `<p class="blz-job"><b>${this.esc(j.title)}</b> (${this.esc(j.place)}). ${this.esc(j.need)}</p>`).join('')}
        <p>Резюме и примеры работ присылайте на ${this.mailLink('support@blizzard.com')}, в теме письма укажите «Вакансия».</p>
      </div>`;
  }

  searchIndex() {
    const d = this.data;
    const docs = [];
    (d.news || []).forEach(n => docs.push({ type: 'Новость', title: n.title, snippet: n.lead, url: this.newsHref(n), hay: `${n.title} ${n.lead} ${(n.body || []).join(' ')} ${(n.bullets || []).join(' ')}` }));
    (d.games || []).forEach(g => docs.push({ type: 'Игра', title: `${g.title}: ${g.tagline}`, snippet: g.summary, url: this.url(`/game?id=${g.id}`), hay: `${g.title} ${g.tagline} ${g.summary} ${(g.classes || []).map(c => `${c.name} ${c.stats} ${c.desc}`).join(' ')} ${(g.tiers || []).map(t => `${t.place} ${t.boss} ${t.foes}`).join(' ')} ${(g.npcs || []).join(' ')}` }));
    const wc = d.warcraft;
    docs.push({ type: 'Warcraft', title: wc.title, snippet: wc.loreIntro, url: this.url('/warcraft'), hay: `warcraft варкрафт ${wc.title} ${wc.loreIntro} ${(wc.units || []).map(u => `${u.allianceName} ${u.hordeName} ${u.ability}`).join(' ')} ${(wc.places || []).map(p => p.name).join(' ')}` });
    this.runewords().forEach(w => docs.push({ type: 'Рунное слово', title: `${w.name} (${w.runeNames.join(' + ')})`, snippet: `${w.bases}: ${w.lines.join(', ')}`, url: this.url('/sanctuary'), hay: `${w.id} ${w.name} ${w.runeNames.join(' ')} ${w.bases} руны рунное` }));
    (d.sanctuary.cainQuests || []).forEach(q => docs.push({ type: 'Свиток Каина', title: q.title, snippet: q.steps[0], url: this.url('/sanctuary'), hay: `${q.title} ${q.game} ${q.steps.join(' ')} каин` }));
    (d.support || []).forEach(s => docs.push({ type: 'Поддержка', title: s.q, snippet: s.a[0], url: this.url('/support'), hay: `${s.q} ${s.a.join(' ')}` }));
    return docs;
  }

  renderSearch(query = '') {
    const q = String(query || '').trim().toLowerCase();
    const hits = q ? this.searchIndex().filter(doc => doc.hay.toLowerCase().includes(q)) : [];
    return `
      <div class="blz-room">
        <h1 class="blz-h1">Поиск по сайту</h1>
        ${q ? `<p>По запросу <b>«${this.esc(query)}»</b> найдено документов: <b>${hits.length}</b>.</p>` : '<p>Введите слово в поле поиска вверху страницы.</p>'}
        ${hits.map(h => `<div class="blz-hit">
          <a data-url="${this.esc(h.url)}" class="blz-hit-title">${this.esc(h.title)}</a> <span class="blz-hit-type">${this.esc(h.type)}</span>
          <div>${this.esc(h.snippet)}</div>
          <div class="blz-hit-url">${this.esc(h.url)}</div>
        </div>`).join('')}
        ${q && !hits.length ? '<p>Ничего не найдено. Попробуйте: <b>руны</b>, <b>Андариэль</b>, <b>батрак</b>, <b>Tracer</b> или <b>модем</b>.</p>' : ''}
      </div>`;
  }

  renderFooter(hits) {
    const webring = window.retroSites && typeof window.retroSites.renderWebRing === 'function' ? window.retroSites.renderWebRing(BLZ_BASE) : '';
    return `
      <tr><td class="blz-foot">
        <div class="blz-foot-links">${BLZ_NAV.map(([, path, label]) => this.link(path, label)).join(' | ')} | ${this.link2('http://www.steampowered.com', 'Steam')}</div>
        <div class="blz-buttons">
          <span class="blz-88">BLIZZARD<br>ENTERTAINMENT</span>
          <span class="blz-88 blz-88-red">DIABLO I &amp; II<br>В STEAM</span>
          <span class="blz-88 blz-88-wood">WARCRAFT<br>СКОРО</span>
          <span class="blz-88">BATTLE.NET<br>БЕСПЛАТНО</span>
          <span class="blz-88 blz-88-grey">IE 5.0<br>800x600</span>
        </div>
        <div class="blz-counter-row">Посетителей с 1 октября 1998 г.: <span class="blz-counter">${String(hits).padStart(7, '0').split('').map(c => `<b>${c}</b>`).join('')}</span></div>
        <div class="blz-copy">&copy; 1991–1998 Blizzard Entertainment. Все права защищены. Diablo, Warcraft и Battle.net являются товарными знаками Blizzard Entertainment. Сайт лучше всего смотреть в Microslop Internet Explorer 5.0 при 800x600.</div>
        ${webring}
      </td></tr>`;
  }

  renderBody(route) {
    const views = {
      news: () => this.renderNewsList(),
      article: () => this.renderArticle(route.params.id),
      games: () => this.renderGamesCatalog(),
      game: () => this.renderGameDetail(route.params.id || 'diablo'),
      warcraft: () => this.renderWarcraftPreview(),
      sanctuary: () => this.renderSanctuaryArchive(),
      battlenet: () => this.renderBattleNet(),
      support: () => this.renderSupport(),
      studio: () => this.renderStudio(),
      search: () => this.renderSearch(route.params.q || '')
    };
    return (views[route.section] || (() => this.renderHome()))();
  }

  renderSite(url = BLZ_BASE) {
    const route = this.parseRoute(url);
    const hits = url !== this.lastHitUrl ? this.bumpHits() : this.getHits();
    this.lastHitUrl = url;
    return `
      <div class="blz-page">
        <table class="blz-wrap" cellspacing="0" cellpadding="0">
          ${this.renderHeader(route.section)}
          <tr><td class="blz-body blz-body-${route.section}">${this.renderBody(route)}</td></tr>
          ${this.renderFooter(hits)}
        </table>
      </div>`;
  }

  rerender(win, container, url) {
    const top = container.scrollTop || 0;
    if (window.appIE && typeof window.appIE.renderPage === 'function' && win) {
      window.appIE.renderPage(win, url);
    } else {
      container.innerHTML = this.renderSite(url);
      this.attachEvents(win, container, url);
    }
    container.scrollTop = top;
  }

  jumpTo(container, id) {
    const target = container.querySelector(`#${id}`);
    if (!target || typeof target.getBoundingClientRect !== 'function' || typeof container.getBoundingClientRect !== 'function') return;
    container.scrollTop += target.getBoundingClientRect().top - container.getBoundingClientRect().top - 4;
  }

  orderUnit(side) {
    const units = this.data.warcraft.units || [];
    const u = units.find(x => x.id === this.selectedUnitId) || units[0];
    if (!u) return;
    const count = (this.unitClickCounts[u.id] || 0) + 1;
    this.unitClickCounts[u.id] = count;
    const pissed = count >= 4;
    const pool = side === 'alliance' ? (pissed ? u.alliancePissed : u.allianceQuotes) : (pissed ? u.hordePissed : u.hordeQuotes);
    this.lastUnitQuote = pool[(pissed ? count - 4 : count - 1) % pool.length];
    this.lastUnitSpeaker = `${side === 'alliance' ? u.allianceName : u.hordeName}${pissed ? ' (раздражён)' : ''}`;
  }

  attachEvents(win, container, url = BLZ_BASE) {
    if (!container) return;
    const redraw = () => this.rerender(win, container, url);
    const on = (sel, fn, evt = 'click') => container.querySelectorAll(sel).forEach(el => el.addEventListener(evt, e => {
      if (evt === 'click' && e && e.preventDefault) e.preventDefault();
      fn(el, e);
    }));
    const go = target => {
      if (window.appIE && win) window.appIE.navigate(win, target);
      else this.rerender(win, container, target);
    };

    const searchInput = container.querySelector('#blz-site-search');
    const runSearch = () => {
      if (!searchInput) return;
      this.playTone('click');
      go(this.url(`/search?q=${encodeURIComponent(searchInput.value.trim())}`));
    };
    on('#blz-site-search-btn', runSearch);
    if (searchInput) searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });

    on('[data-blz-jump]', el => this.jumpTo(container, el.dataset.blzJump));

    on('#blz-gateway-select', el => { this.selectedGatewayId = el.value; this.playTone('click'); redraw(); }, 'change');
    on('#blz-modem-select', el => { this.selectedModem = el.value; this.playTone('click'); redraw(); }, 'change');

    on('[data-news-filter]', el => { this.newsFilter = el.dataset.newsFilter || 'all'; this.playTone('click'); redraw(); });

    on('#blz-poll-vote', () => {
      const picked = container.querySelector('input[name="blz-poll"]:checked');
      if (!picked) {
        this.pollNotice = 'Сначала выберите вариант ответа.';
      } else {
        this.pollNotice = '';
        this.savePollVote(picked.value);
        this.playTone('rune');
      }
      redraw();
    });

    on('.blz-btn-save-news', el => {
      const item = (this.data.news || []).find(n => n.id === el.dataset.newsId);
      if (!item) return;
      this.playTone('rune');
      const txt = [
        'BLIZZARD ENTERTAINMENT',
        item.from,
        '',
        item.title.toUpperCase(),
        '',
        `${this.longDate(item.date)}. ${item.lead}`,
        '',
        ...(item.body || []).map(p => `${p}\r\n`),
        ...(item.bullets || []).map(b => ` * ${b}`),
        '',
        '###',
        '',
        `Источник: ${this.newsHref(item)}`
      ].join('\r\n');
      this.saveTextToNotepad(`BLIZZARD_${item.id.toUpperCase().replace(/-/g, '_')}.TXT`, txt);
    });

    on('.blz-btn-launch-game', el => {
      const gm = window.gameManager;
      const entry = gm && gm.catalog ? gm.catalog[el.dataset.gameId] : null;
      this.playTone('horn');
      if (entry && typeof entry.launch === 'function') entry.launch();
    });

    on('.blz-btn-open-steam', el => {
      this.playTone('click');
      if (window.gameManager && typeof window.gameManager.showInSteam === 'function') window.gameManager.showInSteam(el.dataset.gameId);
    });

    on('.blz-btn-save-dossier', el => {
      const g = (this.data.games || []).find(x => x.id === el.dataset.gameId);
      if (!g) return;
      this.playTone('rune');
      const txt = [
        `${g.title.toUpperCase()}: ${g.tagline}`,
        `${g.studio}. Файл: ${g.exe}. Объём: ${g.size}.`,
        '==============================================================',
        '',
        g.summary,
        '',
        `--- ${g.classesTitle.toUpperCase()} ---`,
        ...(g.classes || []).map(c => `* ${c.name}: ${c.stats}\r\n  ${c.skill}\r\n  ${c.desc}`),
        '',
        `--- ${g.worldTitle.toUpperCase()} ---`,
        ...(g.tiers || []).map(t => `* ${t.place}: ${t.boss}`),
        '',
        '--- УПРАВЛЕНИЕ ---',
        ...(g.controls || []).map(([k, v]) => `  ${k}: ${v}`),
        '',
        `Купить и загрузить: Steam. Подробнее: ${this.url(`/game?id=${g.id}`)}`
      ].join('\r\n');
      this.saveTextToNotepad(`DOSSIER_${g.id.toUpperCase()}.TXT`, txt);
    });

    on('[data-shot-zoom]', el => {
      const key = el.dataset.shotZoom;
      this.zoomedShots = this.zoomedShots[key] ? {} : { [key]: true };
      this.playTone('click');
      redraw();
    });

    on('[data-wc-side]', el => { this.warcraftSide = el.dataset.wcSide || 'both'; this.playTone('click'); redraw(); });
    on('[data-wc-unit]', el => { this.selectedUnitId = el.dataset.wcUnit || 'worker'; this.lastUnitQuote = ''; this.playTone('click'); redraw(); });
    on('[data-wc-place]', el => { this.selectedPlaceId = el.dataset.wcPlace; this.playTone('click'); redraw(); });
    on('#blz-btn-order-alliance', () => { this.orderUnit('alliance'); this.playTone('horn'); redraw(); });
    on('#blz-btn-order-horde', () => { this.orderUnit('horde'); this.playTone('horn'); redraw(); });

    on('#blz-btn-save-warcraft', () => {
      const wc = this.data.warcraft;
      this.playTone('rune');
      const txt = [
        `BLIZZARD ENTERTAINMENT: ${wc.title.toUpperCase()}`,
        wc.status,
        '==============================================================',
        '',
        wc.loreIntro,
        '',
        '--- ЖУРНАЛ СБОРКИ ---',
        ...(wc.readiness || []).map(r => `* ${r.label}: ${r.pct}%`),
        '',
        '--- ОТРЯДЫ АЛЬЯНСА И ОРДЫ ---',
        ...(wc.units || []).map(u => `* ${u.allianceName} / ${u.hordeName} (${u.cost})\r\n  ${u.stats}\r\n  ${u.ability}`),
        '',
        `Источник: ${this.url('/warcraft')}`
      ].join('\r\n');
      this.saveTextToNotepad('WARCRAFT_PREVIEW_98.TXT', txt);
    });

    on('#blz-forge-base', el => { this.forgeBase = el.value; this.selectedRunewordId = ''; this.playTone('click'); redraw(); }, 'change');
    on('[data-rw-preset]', el => {
      const w = this.runewords().find(x => x.id === el.dataset.rwPreset);
      if (!w) return;
      this.selectedRunewordId = w.id;
      this.slottedRunes = w.runeIds.slice();
      this.forgeBase = w.types[0];
      this.playTone('rune');
      redraw();
    });
    on('[data-add-rune]', el => {
      if (this.slottedRunes.length >= 6) this.slottedRunes = [];
      this.slottedRunes.push(el.dataset.addRune);
      this.selectedRunewordId = '';
      this.playTone('rune');
      redraw();
    });
    on('#blz-forge-pop', () => { this.slottedRunes.pop(); this.selectedRunewordId = ''; this.playTone('click'); redraw(); });
    on('#blz-clear-runes', () => { this.slottedRunes = []; this.selectedRunewordId = ''; this.playTone('click'); redraw(); });
    on('#blz-btn-save-tome', () => { this.playTone('rune'); this.exportSanctuaryScroll(); });

    on('.blz-btn-cain-next', el => { const id = el.dataset.questId; this.cainSteps[id] = Math.min(3, (this.cainSteps[id] || 0) + 1); this.playTone('rune'); redraw(); });
    on('.blz-btn-cain-reset', el => { this.cainSteps[el.dataset.questId] = 0; this.playTone('click'); redraw(); });

    on('[data-bnet-chan]', el => { this.bnetChannel = el.dataset.bnetChan; this.playTone('click'); redraw(); });
    const sendChat = () => {
      const textEl = container.querySelector('#blz-bnet-text');
      const text = textEl ? textEl.value.trim() : '';
      if (!text) return;
      const nickEl = container.querySelector('#blz-bnet-nick');
      const roleEl = container.querySelector('#blz-bnet-role-input');
      this.addBnetPost(this.bnetChannel, nickEl ? nickEl.value.trim() : 'Alexey_98', roleEl ? roleEl.value : '', text);
      this.playTone('rune');
      redraw();
    };
    on('#blz-bnet-send', sendChat);
    const chatInput = container.querySelector('#blz-bnet-text');
    if (chatInput) chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
  }
}

window.blizzardSite = new BlizzardSite();
