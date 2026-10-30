(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const { W, HGT, C } = H.UI_CONST;

  const STRIP = { x: 232, vis: 9, pitch: 36 };
  const STAT_ROWS =[['hp', 'HP'], ['atk', 'Атака'], ['def', 'Защита'], ['spd', 'Скорость'], ['critR', 'Крит. шанс'], ['critD', 'Крит. урон'], ['breakE', 'Эфф. пробития'], ['err', 'Энергия']];
  const SECTIONS = [
    { id: 'details', label: 'Детали', icon: 'chars' },
    { id: 'traces', label: 'Следы', icon: 'traces' },
    { id: 'relics', label: 'Реликвии', icon: 'relic' },
    { id: 'skills', label: 'Способности', icon: 'archive' },
    { id: 'eidolons', label: 'Эйдолоны', icon: 'warp' },
    { id: 'info', label: 'Информация', icon: 'info' },
    { id: 'outfits', label: 'Наряды', icon: 'outfit' }
  ];
  const SEC_STEP = 40, FAV_Y = 372, LIST_Y = 412;
  const CHAR_GRID = { COLS: 4, VIS: 5, CW: 132, CH: 64, GAP: 4, X0: 42, Y0: 62 };
  const INFO_PAGES = ['Досье', 'История', 'Голос'];
  const INFO_ROW = 14;
  const INV_TABS = [
    { id: 'food', label: 'Расходники', icon: 'bag' },
    { id: 'exp', label: 'Опыт', icon: 'archive' },
    { id: 'mat', label: 'Материалы', icon: 'traces' },
    { id: 'key', label: 'Ключевые', icon: 'mission' },
    { id: 'cones', label: 'Конусы', icon: 'cones' },
    { id: 'relics', label: 'Реликвии', icon: 'relic' }
  ];
  const TARGET_NAME = { single: 'одна цель', blast: 'цель и соседи', all: 'все враги', bounce: 'отскоки', ally: 'союзник', allies: 'все союзники', self: 'на себя' };
  const TAG_NAME = { joke: 'шутка', cute: 'милота', threat: 'угроза', science: 'наука', kind: 'доброта', sing: 'музыка', bribe: 'выгода', silent: 'молчание', weird: 'странное' };
  const EIDOLON_NUM = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const pct = v => (Math.round(v * 1000) / 10) + '%';
  const RAR_TXT = { 3: '#b8c4e8', 4: '#cfa2ff', 5: '#ffd45a' };
  const RAR_ROW = { 4: 'rgba(190,120,255,0.13)', 5: 'rgba(255,196,70,0.16)' };
  const WARP_FILTERS = [['Все', 3], ['4★ и выше', 4], ['Только 5★', 5]];
  const BANNER_TABS = [['ev', 'Прыжок события'], ['sig', 'Поиск сигнала'], ['conv', 'Призыв'], ['guild', 'Гильдия'], ['mid', 'Полуночный канал'], ['con', 'Кон-Тон'], ['std', 'Стандартный']];
  const EV_CHANNELS = [['ev', 'Герой'], ['cone', 'Конус']];
  const CHANNELS = { ev: ['ev', 'cone'], sig: ['sig', 'amp'], conv: ['conv', 'forge'], guild: ['guild', 'wiz'], mid: ['mid', 'comp'], con: ['con', 'alley'] };
  const GUILD_CHANNELS = [['guild', 'Набор'], ['wiz', 'Лавка Виз']];
  const CONV_CHANNELS = [['conv', 'Резонатор'], ['forge', 'Оружие']];
  const SIG_CHANNELS = [['sig', 'Выделенный канал', 'Агенты'], ['amp', 'Канал амплификаторов', 'Световые конусы']];
  const RANK = { 5: 'S', 4: 'A', 3: 'B' };
  const RANK_COL = { 5: '#ffb030', 4: '#c060ff', 3: '#40a8ff' };
  const tabOf = ban => (ban === 'amp' ? 'sig' : ban === 'cone' ? 'ev' : ban === 'forge' ? 'conv' : ban === 'comp' ? 'mid' : ban === 'wiz' ? 'guild' : ban === 'alley' ? 'con' : ban);
  const signalBan = ban => ban === 'sig' || ban === 'amp';
  const conveneBan = ban => ban === 'conv' || ban === 'forge';
  const guildBan = ban => ban === 'guild' || ban === 'wiz';
  const midBan = ban => ban === 'mid' || ban === 'comp';
  const conBan = ban => ban === 'con' || ban === 'alley';
  const POSTER_TINT = { aqua: '#2f6cc8', megumin: '#b82a2a', darkness: '#c89224' };
  const TICKETS = { std: ['пропусков', 'Пропуски '], ev: ['особых пропусков', 'Особые пропуски '], cone: ['особых пропусков', 'Особые пропуски '], sig: ['шифрокопий', 'Шифрокопии '], amp: ['шифрокопий', 'Шифрокопии '], conv: ['сияющих приливов', 'Сияющие приливы '], forge: ['кующих приливов', 'Кующие приливы '], guild: ['манатитов', 'Манатиты '], wiz: ['манатитов', 'Манатиты '], mid: ['бархатных ключей', 'Бархатные ключи '], comp: ['бархатных ключей', 'Бархатные ключи '], con: ['бейджей', 'Бейджи '], alley: ['бейджей', 'Бейджи '] };
  const EV_STYLE = {
    ruanmei: { tag: '#1c5a64', title: '#f4fff8', sub: '#bfe4e0', four: '#e8d4ff', glow: 'rgba(190,240,236,0.3)' },
    seele: { tag: '#4a2470', title: '#fbf2ff', sub: '#dcc8f6', four: '#ffd8ec', glow: 'rgba(200,150,255,0.3)' },
    kafka: { tag: '#5a1a3a', title: '#fff0f6', sub: '#f0c0d8', four: '#ffd8e8', glow: 'rgba(230,120,190,0.3)' },
    silverwolf: { tag: '#1a2a5a', title: '#f2f4ff', sub: '#b8c4f0', four: '#c8f0ff', glow: 'rgba(120,150,255,0.3)' },
    blade: { tag: '#4a1418', title: '#fff2ec', sub: '#e8b8b0', four: '#ffd8c8', glow: 'rgba(230,80,70,0.3)' },
    jingyuan: { tag: '#3a2a5a', title: '#fff8ec', sub: '#e0d0f0', four: '#ffe8b8', glow: 'rgba(200,170,255,0.3)' },
    luocha: { tag: '#2a4a30', title: '#fffaf0', sub: '#d8e8c8', four: '#ffeec0', glow: 'rgba(240,220,140,0.3)' },
    imbibitor: { tag: '#123a40', title: '#f0fffc', sub: '#b8e8e0', four: '#c8fff4', glow: 'rgba(120,230,220,0.3)' },
    fuxuan: { tag: '#3a2050', title: '#fff4fa', sub: '#e8c8e8', four: '#ffd8f0', glow: 'rgba(240,170,220,0.3)' },
    jingliu: { tag: '#141e3a', title: '#f4f8ff', sub: '#c0d0f0', four: '#d8e8ff', glow: 'rgba(170,210,255,0.3)' },
    topaz: { tag: '#4a1418', title: '#fff4ec', sub: '#f0c8b8', four: '#ffe0c0', glow: 'rgba(255,190,90,0.3)' },
    huohuo: { tag: '#1e3a30', title: '#f4fff8', sub: '#c8ecd8', four: '#d8ffe8', glow: 'rgba(140,240,190,0.3)' },
    argenti: { tag: '#4a1420', title: '#fff2f4', sub: '#f0c0c8', four: '#ffd8e0', glow: 'rgba(255,120,140,0.3)' },
    ratio: { tag: '#2a2050', title: '#f8f4ff', sub: '#d0c8f0', four: '#ffe8b0', glow: 'rgba(200,180,255,0.3)' }
  };
  const PICK_VIS = 5;
  const pad2 = n => String(n).padStart(2, '0');
  const powerClock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return (h ? h + ':' + pad2(m) : String(m)) + ':' + pad2(s % 60); };
  const POWER_ROWS = ['res', 'fuel', 'jade'];
  const warpName = e => (e.kind === 'char' ? (H.CHARS[e.id] || {}).name : (H.CONES[e.id] || {}).name) || e.id;
  const warpWhen = e => { if (!e.at) return '—'; const d = new Date(e.at); return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
  const warpNote = e => (e.cameo ? ['гость из гильдии', C.gold] : e.off ? [e.ban === 'guild' ? (e.rar === 4 ? 'не Казума' : H.BANNERS.guild.stars[e.id] ? 'другой член отряда' : 'гость из стандарта') + ' · дальше гарант' : e.ban === 'wiz' ? (e.rar === 4 ? 'не «Это был трактор»' : Object.values(H.BANNERS.wiz.stars).some(x => x.cone === e.id) ? 'конус другой героини' : 'конус из стандарта') + ' · дальше гарант' : e.ban === 'con' ? (e.rar === 4 ? 'вне тройки' : 'гость из стандарта') + ' · дальше гарант' : e.ban === 'alley' ? (e.rar === 4 ? 'конус не из Аллеи' : 'конус из стандарта') + ' · дальше гарант' : 'вне события · дальше гарант', C.sub] : e.kind === 'char'
    ? ({ new: ['новый персонаж', C.ok], eid: ['эйдолон +1', C.gold], max: ['эйдолоны VI', C.gold], credits: ['+3000 кредитов', C.gold] }[e.res] || ['персонаж', C.sub])
    : e.sup > 1 ? ['наложение S' + e.sup, C.gold] : ['световой конус', C.sub]);
  const warpPity = e => (e.pity ? e.pity + ' / ' + (e.rar === 5 ? (e.ban === 'cone' || e.ban === 'amp' || e.ban === 'forge' || e.ban === 'wiz' || e.ban === 'alley' ? T.conePity5 : T.pity5) : T.pity4) : '—');
  const warpIcon = (c, e, x, y, size, g) => {
    if (e.kind === 'char') { c.fillStyle = G.RARITY[e.rar]; c.fillRect(x - 1, y - 1, size + 2, size + 2); G.drawPortrait(c, G.lookOf(e.id, g), x, y, size); }
    else G.drawConeCard(c, e.id, x + Math.round(size * 0.15), y, Math.round(size * 0.72), size, { info: false });
  };
  let spaceCache = null;

  function spaceCanvas() {
    if (spaceCache) return spaceCache;
    const cv = G.mkCanvas(W, HGT), g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, HGT);
    gr.addColorStop(0, '#060820'); gr.addColorStop(0.5, '#171a48'); gr.addColorStop(1, '#2e2a66');
    g.fillStyle = gr; g.fillRect(0, 0, W, HGT);
    for (let i = 0; i < 5; i++) {
      const x = G.hash(i, 1, 4) * W, y = G.hash(i, 2, 4) * HGT * 0.7, r = 60 + G.hash(i, 3, 4) * 120;
      const n = g.createRadialGradient(x, y, 0, x, y, r);
      n.addColorStop(0, i % 2 ? 'rgba(120,90,220,0.22)' : 'rgba(80,130,230,0.18)'); n.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = n; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.2 + 0.8 * G.hash(i, 5, 5)) + ')'; g.fillRect(Math.floor(G.hash(i, 6, 6) * W), Math.floor(G.hash(6, i, 7) * HGT), G.hash(i, 7, 8) > 0.96 ? 2 : 1, 1); }
    spaceCache = cv;
    return cv;
  }

  Object.assign(H.UI.prototype, {
    fullBg(c, floor) {
      c.drawImage(spaceCanvas(), 0, 0);
      if (floor) {
        const fy = floor === true ? 380 : floor;
        const gr = c.createLinearGradient(0, fy - 30, 0, HGT);
        gr.addColorStop(0, 'rgba(60,60,130,0)'); gr.addColorStop(0.3, 'rgba(90,90,160,0.55)'); gr.addColorStop(1, 'rgba(40,40,90,0.9)');
        c.fillStyle = gr; c.fillRect(0, fy - 30, W, HGT - fy + 30);
        c.fillStyle = 'rgba(210,220,255,0.55)'; c.fillRect(0, fy - 1, W, 1);
      }
    },

    platform(c, x, y, rx) {
      const gr = c.createRadialGradient(x, y, 4, x, y, rx);
      gr.addColorStop(0, 'rgba(210,220,255,0.55)'); gr.addColorStop(1, 'rgba(210,220,255,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, rx, rx * 0.22, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(235,240,255,0.8)'; c.lineWidth = 2;
      for (const [f, a0, a1] of [[0.55, 0.2, 1.3], [0.8, 1.9, 3.0], [1.05, 3.4, 4.6], [1.3, 0.4, 1.0], [1.3, 5.2, 6.0]]) { c.beginPath(); c.ellipse(x, y, rx * f, rx * f * 0.22, 0, a0, a1); c.stroke(); }
    },

    ascGems(c, x, y, asc, o = {}) {
      const r = o.r || 3, step = o.step || r * 2 + 3;
      for (let i = 0; i < 6; i++) this.diamond(x + i * step, y, r, i < asc ? (o.on || C.brassHi) : 'rgba(154,166,208,0.3)', '#0a0c20');
      return step * 6;
    },

    closeBtn(x, y, fn) {
      const c = this.ctx;
      c.fillStyle = '#000'; c.fillRect(x, y, 22, 22);
      c.fillStyle = '#1c2458'; c.fillRect(x + 1, y + 1, 20, 20);
      c.strokeStyle = C.brassHi; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 6, y + 6); c.lineTo(x + 16, y + 16); c.moveTo(x + 16, y + 6); c.lineTo(x + 6, y + 16); c.stroke();
      this.hit(x, y, 22, 22, fn);
    },

    circlePortrait(c, look, x, y, size, ring, o = {}) {
      c.save();
      c.beginPath(); c.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); c.closePath();
      const gr = c.createLinearGradient(x, y, x, y + size);
      gr.addColorStop(0, o.bgTop || '#3a3a78'); gr.addColorStop(1, o.bgBottom || '#15163a');
      c.fillStyle = gr; c.fill(); c.clip();
      G.drawPortrait(c, look, x, y + 2, size);
      c.restore();
      c.strokeStyle = '#000'; c.lineWidth = 3; c.beginPath(); c.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = ring; c.lineWidth = 1.5; c.stroke();
    },

    rosterKeys() {
      const s = this.game.state, order = Object.keys(H.CHARS);
      const slot = k => { const i = s.party.indexOf(k); return i < 0 ? 4 : i; };
      const fav = k => (s.roster[k].fav ? 0 : 1), tgt = this.game.guideTarget ? this.game.guideTarget() : null, aim = k => (k === tgt ? 0 : 1);
      return Object.keys(s.roster).sort((a, b) => aim(a) - aim(b) || slot(a) - slot(b) || fav(a) - fav(b) || order.indexOf(a) - order.indexOf(b));
    },

    favStar(c, x, y, r, on) {
      c.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      c.closePath();
      c.fillStyle = on ? C.brassHi : 'rgba(10,12,40,0.7)'; c.fill();
      c.strokeStyle = on ? '#1a1208' : C.sub; c.lineWidth = 1; c.stroke();
    },

    equilibrium() { return Object.keys(this.game.state.flags).filter(f => f.startsWith('first_')).length; },

    phoneSkin() {
      const id = this.game.phoneSkinId ? this.game.phoneSkinId() : 'express';
      return H.PHONE_SKINS[id] || H.PHONE_SKINS.express;
    },

    phoneTiles() {
      const ui = this, g = this.game;
      return [
        { label: 'Персонажи', icon: 'chars', alert: 'chars', fn: () => ui.openChars(g.state.party[0]) },
        { label: 'Команда', icon: 'team', disabled: !!g.state.su, why: 'вне Виртуальной вселенной', fn: () => ui.openTeam() },
        { label: 'Инвентарь', icon: 'bag', fn: () => ui.openInventory(0) },
        { label: 'Прыжок', icon: 'warp', disabled: !g.state.flags.express_intro, why: 'после знакомства с Экспрессом', fn: () => ui.openWarp(null) },
        { label: 'Архив', icon: 'archive', fn: () => ui.openBank(null) },
        { label: 'Миссии', icon: 'mission', alert: 'missions', fn: () => ui.openMission() },
        g.state.su ? { label: 'Погружение', icon: 'nav', fn: () => ui.openSuRun() } : { label: 'Навигация', icon: 'nav', fn: () => ui.openNav(null) },
        { label: 'Путеводитель', icon: 'ipg', alert: 'guide', disabled: !g.state.flags.express_intro, why: 'после знакомства с Экспрессом', fn: () => ui.openIpg() },
        { label: 'Синтез', icon: 'synth', fn: () => ui.openSynth() },
        { label: 'События', icon: 'events', disabled: !g.eventsOpen(), why: 'после станции «Герта»', alert: 'events', fn: () => ui.openEvents() },
        { label: 'Снабжение', icon: 'shop', disabled: !g.state.flags.express_intro, why: 'после знакомства с Экспрессом', fn: () => ui.openSupply() },
        { label: 'Сообщения', icon: 'chat', alert: 'chat', fn: () => ui.openChats(null) }
      ];
    },

    phoneRail() {
      const ui = this, g = this.game, near = () => ui.canSaveHere();
      return [
        { label: 'Почта', icon: 'mail', alert: 'mail', fn: () => ui.openMail() },
        { label: 'Настройки', icon: 'settings', fn: () => ui.openSettings() },
        { label: 'Сохранить', icon: 'save', disabled: !!g.state.su || !near(), why: g.state.su ? 'вне Виртуальной вселенной: каждая зона сохраняется сама' : 'у якоря пространства или в городе', fn: () => ui.openSaves('save') },
        { label: 'Загрузить', icon: 'load', fn: () => ui.openSaves('load') },
        { label: 'Управление', icon: 'guide', fn: () => ui.openGuide() },
        { label: 'В титры', icon: 'exit', fn: () => ui.confirmTitle() }
      ];
    },

    drawPhone(c, scr, o = {}) {
      const ui = this, g = this.game, s = g.state, lead = s.party[0], kit = g.kitOf(lead), look = G.lookOf(kit, g), al = g.alerts(), skin = o.skin || ui.phoneSkin(), hitsAt = ui.hits.length;
      const dx = 318, dy = 8, dw = 268, dh = 464;
      ui.win(dx, dy, dw, dh, { top: skin.win[0], bottom: skin.win[1] });
      if (skin.wall) ui.phoneWall(c, skin, dx + 3, dy + 3, dw - 6, dh - 6);
      ui.text('UID ' + ui.profileUid(), dx + 12, dy + 10, { size: 10, col: C.sub });
      for (let i = 0; i < 4; i++) { c.fillStyle = i < 3 ? C.cream : C.dim; c.fillRect(dx + dw - 58 + i * 5, dy + 18 - i * 2 - 3, 3, 3 + i * 2); }
      c.strokeStyle = C.cream; c.strokeRect(dx + dw - 32.5, dy + 10.5, 16, 8); c.fillStyle = C.cream; c.fillRect(dx + dw - 30, dy + 13, 9, 3); c.fillRect(dx + dw - 16, dy + 13, 2, 3);
      ui.portraitCard(c, look, dx + 12, dy + 28, 52, { elem: H.CHARS[kit].elem });
      if (ui.openProfile) ui.hit(dx + 12, dy + 28, 52, 52, () => ui.openProfile());
      ui.text(s.name, dx + 74, dy + 30, { size: 17, bold: true, serif: true, col: C.gold });
      ui.phoneDots(c, dx + dw - 44, dy + 30);
      ui.text('Уровень равновесия ' + ui.equilibrium(), dx + 74, dy + 52, { size: 11, col: C.cream });
      ui.phoneSign(c, dx, dy, dw);
      const tr = s.tl;
      ui.text('Ур. освоения', dx + 12, dy + 90, { size: 11, col: C.sub });
      ui.text(String(tr.lvl), dx + 92, dy + 86, { size: 16, bold: true, serif: true, col: C.gold });
      ui.text(tr.lvl >= H.TL_MAX ? 'Макс. уровень' : 'Опыт ' + tr.exp + '/' + H.tlExpToNext(tr.lvl), dx + dw - 12, dy + 90, { size: 10, align: 'right', col: C.sub });
      ui.rail(dx + 14, dy + 110, dw - 28, tr.lvl >= H.TL_MAX ? 1 : tr.exp / H.tlExpToNext(tr.lvl));
      const list = ui.phoneTiles(), gx = dx + 12, gy = dy + 124, tw = 78, th = 62, gap = 5;
      list.forEach((t, i) => {
        const x = gx + (i % 3) * (tw + gap), y = gy + Math.floor(i / 3) * (th + gap), on = i === scr.sel && scr.rail < 0;
        const bg = c.createLinearGradient(0, y, 0, y + th);
        bg.addColorStop(0, on ? skin.tile[2] : skin.tile[0]); bg.addColorStop(1, on ? skin.tile[3] : skin.tile[1]);
        c.fillStyle = skin.edge; c.fillRect(x, y, tw, th);
        c.fillStyle = bg; c.fillRect(x + 1, y + 1, tw - 2, th - 2);
        c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x + 1, y + 1, tw - 2, 1);
        if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, tw - 2, th - 2); c.lineWidth = 1; }
        G.menuIcon(c, t.icon, x + tw / 2 - 14, y + 6, 28, t.disabled ? '#4c5070' : on ? '#fff0c0' : '#d8dcf0');
        ui.text(t.label, x + tw / 2, y + 40, { align: 'center', size: t.label.length > 10 ? 10 : 11, bold: on, col: t.disabled ? C.dim : on ? C.gold : C.cream });
        if (t.alert && al[t.alert]) ui.badge(x + tw - 9, y + 9);
        ui.hit(x, y, tw, th, () => { scr.rail = -1; scr.sel = i; scr.key('ok'); });
      });
      const R = ui.phoneRail(), rx = dx + dw + 6, rw = W - 8 - rx;
      ui.win(rx, dy, rw, dh, { top: skin.rail[0], bottom: skin.rail[1], corners: false });
      ui.closeBtn(rx + (rw - 22) / 2, dy + 12, () => scr.key('back'));
      c.fillStyle = C.brassDk; c.fillRect(rx + 8, dy + 44, rw - 16, 1);
      ui.diamond(rx + rw / 2, dy + 44.5, 3, C.brass, '#1a1208');
      R.forEach((t, i) => {
        const x = rx + 4, y = dy + 56 + i * 44, cw = rw - 8, ch = 38, on = scr.rail === i;
        c.fillStyle = on ? 'rgba(242,220,154,0.2)' : 'rgba(255,255,255,0.04)'; c.fillRect(x, y, cw, ch);
        if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, cw - 2, ch - 2); c.lineWidth = 1; }
        G.menuIcon(c, t.icon, x + (cw - 24) / 2, y + 7, 24, t.disabled ? '#4c5070' : on ? '#fff0c0' : '#d8dcf0');
        if (t.alert && al[t.alert]) ui.badge(x + cw - 4, y + 5);
        ui.hit(x, y, cw, ch, () => { if (scr.rail < 0) scr.toRail(scr.sel); scr.rail = scr.railSel = i; scr.key('ok'); });
      });
      const ry = dy + 56 + R.length * 44 + 14;
      for (let y = ry + 2; y < dy + dh - 16; y += 7) { c.fillStyle = 'rgba(106,83,40,0.35)'; c.fillRect(rx + rw / 2 - 6, y, 12, 2); }
      c.fillStyle = 'rgba(201,164,92,0.3)'; c.fillRect(rx + rw / 2 - 4, ry, 1, dy + dh - 14 - ry); c.fillRect(rx + rw / 2 + 3, ry, 1, dy + dh - 14 - ry);
      const fy = dy + dh - 44;
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(dx + 8, fy, dw - 16, 34);
      let mx = dx + 14;
      mx += ui.money(mx, fy + 4, 'jade', s.jade) + 8;
      mx += ui.money(mx, fy + 4, 'credits', s.credits) + 8;
      ui.powerChip(mx, fy + 4);
      const cur = scr.rail < 0 ? list[scr.sel] : null, rcur = scr.rail >= 0 ? R[scr.rail] : null;
      const unread = g.mailbox().filter(x => g.mailNew(x)).length;
      const railNote = { mail: 'Почта: ' + (unread ? 'новых писем ' + unread : 'новых писем нет'), settings: 'Настройки: звук, скорость, разрешение', save: 'Сохранить: карта памяти, слоты 1-3', load: 'Загрузить: слоты и автосохранение', guide: 'Управление: клавиши поля, боя и карты', exit: 'В титры: выйти в главное меню' };
      const off = (rcur || cur || {}).disabled;
      const note = off ? 'Доступно ' + (rcur || cur).why : rcur ? railNote[rcur.icon] : 'F7: +' + T.debugJade + ' нефрита (отладка)';
      ui.text(note, dx + dw / 2, fy + 21, { align: 'center', size: 9, col: off ? C.bad : rcur ? C.cream : C.dim });
      if (o.preview) ui.hits.length = hitsAt;
    },

    openMenu() {
      const ui = this, g = this.game;
      this.push({
        rail: -1, railSel: 0, from: 2,
        toRail(from) { this.from = from; this.rail = this.railSel; },
        draw(c) {
          const s = g.state, lead = s.party[0], kit = g.kitOf(lead), look = G.lookOf(kit, g);
          c.fillStyle = 'rgba(2,3,14,0.64)'; c.fillRect(0, 0, W, HGT);
          const gl = c.createRadialGradient(160, 300, 10, 160, 300, 210);
          gl.addColorStop(0, 'rgba(120,130,230,0.35)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = gl; c.fillRect(0, 60, 318, 420);
          ui.platform(c, 160, 452, 92);
          G.drawFigure(c, look, 160, 456, 3);
          ui.text(H.CHARS[kit].name === 'Первопроходец' ? s.name : H.CHARS[kit].name, 20, 20, { size: 20, bold: true, serif: true, col: C.gold });
          G.pathIcon(c, H.CHARS[kit].path, 20, 46, 14);
          ui.text(H.PATHS[H.CHARS[kit].path].name + ' · лидер команды', 38, 47, { size: 11, col: C.sub });
          ui.drawPhone(c, this);
          ui.hints([['←↑↓→', 'Выбор'], ['Enter', 'Открыть'], ['Tab', 'Меню'], ['Esc', 'Закрыть']], 14, HGT - 18);
        },
        key(k, code) {
          const n = ui.phoneTiles().length, R = ui.phoneRail();
          if (code === 'Tab') { ui.openPhoneMenu(); return; }
          if (k === 'back') { ui.pop(); return; }
          if (this.rail >= 0) {
            if (k === 'up' || k === 'down') { this.rail = this.railSel = (this.rail + (k === 'up' ? R.length - 1 : 1)) % R.length; ui.sfx('select'); }
            if (k === 'left') { this.rail = -1; this.sel = this.from; ui.sfx('select'); }
            if (k === 'right') { this.rail = -1; this.sel = this.from - 2; ui.sfx('select'); }
            if (k === 'ok') { const t = R[this.rail]; if (t.disabled) { ui.sfx('deny'); ui.toast('«' + t.label + '» доступно ' + t.why + '.'); return; } t.fn(); }
            return;
          }
          const col = this.sel % 3;
          if (k === 'left') { if (col === 0) this.toRail(this.sel + 2); else this.sel--; ui.sfx('select'); }
          if (k === 'right') { if (col === 2) this.toRail(this.sel); else this.sel++; ui.sfx('select'); }
          if (k === 'up') { this.sel = (this.sel + n - 3) % n; ui.sfx('select'); }
          if (k === 'down') { this.sel = (this.sel + 3) % n; ui.sfx('select'); }
          if (k === 'ok') { const t = ui.phoneTiles()[this.sel]; if (t.disabled) { ui.sfx('deny'); ui.toast('«' + t.label + '» доступно ' + t.why + '.'); return; } t.fn(); }
        }
      });
    },

    confirmTitle() {
      const ui = this;
      this.push({
        draw() {
          ui.win(W / 2 - 170, 170, 340, 120, { title: 'Главное меню' });
          ui.text('Выйти в главное меню? Текущий прогресс', W / 2, 190, { align: 'center', size: 12 });
          ui.text('запишется только в «Авто».', W / 2, 206, { align: 'center', size: 12, col: C.sub });
          ui.button(W / 2 - 150, 238, 140, 26, 'Выйти', () => { this.sel = 0; this.key('ok'); }, { active: this.sel === 0 });
          ui.button(W / 2 + 10, 238, 140, 26, 'Остаться', () => { this.sel = 1; this.key('ok'); }, { active: this.sel === 1 });
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'back') ui.pop();
          if (k === 'ok') {
            if (this.sel === 1) { ui.pop(); return; }
            ui.writeSave('auto');
            ui.screens = []; ui.game = null; ui.mode = 'title'; ui.audio.music('menu');
          }
        }
      });
    },

    openGuide() {
      const ui = this;
      const rows = [
        ['Поле', [['WASD', 'идти'], ['Shift', 'шагом'], ['Пробел', 'действие'], ['F', 'удар (бой с преимуществом)'], ['E', 'техника лидера'], ['1–4', 'сменить лидера'], ['M', 'карта'], ['Esc', 'меню']], 0],
        ['Бой', [['Q', 'выбрать атаку (+1 очко)'], ['E', 'выбрать навык (−1 очко)'], ['Пробел', 'применить'], ['1–4', 'абсолютная техника'], ['T', 'Контакт'], ['R', 'Слияние'], ['V', 'авто-бой'], ['←→', 'цель'], ['Shift', 'ускорение']], 1],
        ['Диалог', [['Enter', 'дальше'], ['Tab', 'пропустить сцену']], 0],
        ['Карта', [['↑↓', 'зона'], ['←→', 'метка'], ['Enter', 'карточка и телепорт'], ['Q E', 'масштаб'], ['Tab', 'Звёздный путь']], 1],
        ['Путеводитель', [['Q E', 'раздел'], ['I', 'правила'], ['Enter', 'получить, войти'], ['F', 'забрать всё, купон'], ['L', 'испытание'], ['C', 'цель развития'], ['R', 'рекомендуемые Следы']], 1],
        ['Испытание', [['↑↓ ←→', 'сложность, количество'], ['Q', 'быстрое получение'], ['T R', 'резерв энергии, ещё раз']], 0],
        ['Синтез', [['Q E', 'вкладка'], ['A D', 'количество'], ['F R', 'фильтр, автодобавление, смола']], 0],
        ['Отладка', [['F7', '+' + T.debugJade + ' звёздного нефрита'], ['F8', 'меню выдачи']], 0]
      ];
      const growth = [
        ['Телефон', [['Tab', 'меню «…»']], 0],
        ['Герой и конус', [['U', 'повышение уровня']], 0],
        ['Повышение', [['←→', 'ячейка'], ['↑↓', 'количество'], ['T', 'быстрый режим'], ['Q E', 'другой герой или конус'], ['R', 'быстрое получение'], ['C', 'конусы на опыт'], ['Enter', 'выполнить']], 0],
        ['Профиль', [['←↑↓→', 'выбор'], ['Q E', 'вкладка'], ['Enter', 'изменить, открыть'], ['V', 'открыть героя']], 1],
        ['Наряды', [['Enter', 'надеть, снять, купить'], ['F', 'все или только мои'], ['V', 'катсцены']], 1],
        ['Ввод текста', [['Буквы', 'с клавиатуры или сетки'], ['Backspace', 'стереть'], ['←↑↓→', 'сетка'], ['Enter', 'нажать']], 1]
      ];
      const pages = [rows, growth];
      this.push({
        controls: true, page: 0,
        turn() { this.page = 1 - this.page; ui.sfx('select'); },
        draw(c) {
          ui.win(60, 18, 520, 434, { title: 'Управление' });
          ui.closeBtn(60 + 520 - 30, 18 + 8, () => ui.pop());
          G.menuIcon(c, 'guide', 76, 36, 32);
          const col = { 0: [120, 40], 1: [350, 40] };
          pages[this.page].forEach(([head, list, side]) => {
            const at = col[side];
            let [x, y] = at;
            ui.text(head, x, y, { bold: true, serif: true, col: C.gold });
            y += 20;
            for (const [k, l] of list) { const w = ui.keycap(x + 10, y, k); ui.text(l, x + 16 + w, y + 1, { size: 11 }); y += 15; }
            at[1] = y + 8;
          });
          ui.button(446, 418, 120, 24, 'Страница ' + (this.page + 1) + ' из ' + pages.length, () => this.turn(), { size: 11 });
          ui.hints([['←→', 'Страница'], ['Esc', 'Назад']], W / 2, 458, { align: 'center' });
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.turn(); return; }
          if (k === 'back' || k === 'ok') ui.pop();
        }
      });
    },

    statValue(st, key, r, kit) {
      if (key === 'hp') return (r.hp == null ? st.hp : r.hp) + '/' + st.hp;
      if (key === 'err') return Math.round(r.energy || 0) + '/' + kit.energy;
      if (key === 'critR' || key === 'critD' || key === 'breakE' || key === 'elation') return pct(st[key] || 0);
      return String(st[key]);
    },

    openChars(startKey) {
      const ui = this, g = this.game;
      this.push({
        full: true, trSel: 'skill', trFocus: false, k: startKey || ui.rosterKeys()[0], sec: 0, slot: 0, slotFocus: false, star: 0, starFocus: false, asm: null, asmK: null, infoPage: 0, infoFocus: false, infoSc: { top: 0 }, infoFor: null, outfitPick: 0, outfitFocus: false, outfitFor: null,
        switchChar(d) { const list = ui.rosterKeys(), i = list.indexOf(this.k); this.k = list[(i + d + list.length) % list.length]; ui.sfx('select'); },
        tick(dt) {
          if (H.Eidolons) H.Eidolons.tickAsm(this, dt, ui, g);
          if (this.rPos != null) { this.rPos += (this.rTop - this.rPos) * Math.min(1, dt * 14); if (Math.abs(this.rTop - this.rPos) < 0.01) this.rPos = this.rTop; }
        },
        followStrip(list) {
          const ci = list.indexOf(this.k), V = STRIP.vis;
          if (this.rFor !== this.k) {
            if (this.rTop == null) this.rTop = ci - Math.floor(V / 2);
            else if (ci < this.rTop + 1) this.rTop = ci - 1;
            else if (ci > this.rTop + V - 2) this.rTop = ci - V + 2;
            this.rFor = this.k;
          }
          this.rMax = Math.max(0, list.length - V);
          this.rTop = Math.max(0, Math.min(this.rMax, this.rTop));
          if (this.rPos == null) this.rPos = this.rTop;
        },
        scrollStrip(d) {
          const to = Math.max(0, Math.min(this.rMax, this.rTop + d));
          if (to !== this.rTop) { this.rTop = to; ui.sfx('select'); }
        },
        drawStrip(c, s, k) {
          const list = ui.rosterKeys(), n = list.length, P = STRIP.pitch, scroll = n > STRIP.vis, vw = Math.min(n, STRIP.vis) * P;
          this.followStrip(list);
          const x0 = scroll ? STRIP.x : Math.round(STRIP.x + (STRIP.vis * P - vw) / 2), off = scroll ? this.rPos : 0, slotX = i => x0 + (i - off) * P;
          c.save(); c.beginPath(); c.rect(x0 - 4, 0, vw + 8, 54); c.clip();
          list.forEach((kk, i) => {
            const x = slotX(i);
            if (x < x0 - P || x > x0 + vw) return;
            const kid = g.kitOf(kk);
            if (kk !== k) ui.circlePortrait(c, G.lookOf(kid, g), x + (P - 28) / 2, 10, 28, H.ELEMENTS[H.CHARS[kid].elem].col);
            if (s.party.includes(kk)) ui.diamond(x + P / 2, 44, 3, C.brassHi);
          });
          const ci = list.indexOf(k);
          if (ci >= 0) ui.circlePortrait(c, G.lookOf(g.kitOf(k), g), slotX(ci) + P / 2 - 17, 6, 34, C.brassHi);
          list.forEach((kk, i) => { if (g.eidNew(kk) > 0 || (g.ascReady && g.ascReady(kk))) ui.badge(slotX(i) + P - 5, 10); });
          list.forEach((kk, i) => { if (g.isFav(kk)) ui.favStar(c, slotX(i) + 6, 12, 5, true); });
          list.forEach((kk, i) => { if (ui.guideTargetMark && kk === (g.guideTarget && g.guideTarget())) ui.guideTargetMark(c, slotX(i) + P - 7, 40); });
          c.restore();
          list.forEach((kk, i) => { const x = slotX(i); if (x > x0 - P / 2 && x < x0 + vw - P / 2) ui.hit(x, 4, P, 46, () => { this.k = kk; ui.sfx('select'); }); });
          let qx = x0 - 22, ex = x0 + vw + 6;
          if (scroll) {
            const left = this.rTop, right = this.rMax - this.rTop;
            this.stripArrow(c, x0 - 18, -1, left);
            this.stripArrow(c, x0 + vw + 4, 1, right);
            ui.wheelZone(x0 - 20, 0, vw + 40, 54, d => this.scrollStrip(d));
            qx -= 16; ex += 16;
          }
          ui.keycap(qx, 18, 'Q'); ui.hit(qx - 2, 14, 18, 22, () => this.switchChar(-1));
          ui.keycap(ex, 18, 'E'); ui.hit(ex - 2, 14, 18, 22, () => this.switchChar(1));
        },
        stripArrow(c, x, dir, hidden) {
          const cx = x + 7, on = hidden > 0;
          c.fillStyle = on ? C.brassHi : 'rgba(154,166,208,0.3)';
          c.beginPath(); c.moveTo(cx - 4 * dir, 18); c.lineTo(cx + 4 * dir, 25); c.lineTo(cx - 4 * dir, 32); c.closePath(); c.fill();
          if (on) { c.strokeStyle = '#1a1208'; c.lineWidth = 1; c.stroke(); ui.text('+' + hidden, cx, 36, { align: 'center', size: 9, bold: true, col: C.cream }); }
          ui.hit(x - 2, 4, 18, 46, () => this.scrollStrip(dir * (STRIP.vis - 1)));
        },
        draw(c) {
          const s = g.state, k = this.k, r = s.roster[k], kitId = g.kitOf(k), kit = H.CHARS[kitId], st = g.charStats(k), look = G.lookOf(kitId, g);
          const secId = SECTIONS[this.sec].id, E = H.Eidolons, pic = secId === 'eidolons' && E && E.has(k);
          let EV = null;
          if (E && this.asm && !pic) E.skipAsm(this, g);
          if (pic) {
            E.syncAsm(this, g, k);
            const cur = this.asm && (this.asm.current('fly') || this.asm.current('snap'));
            if (cur) this.star = cur.n - 1;
            EV = E.backdrop(ui, c, k, r.eid, { asm: this.asm, sel: this.star, focus: this.starFocus });
            E.shade(c);
          }
          else ui.fullBg(c, 392);
          ui.plate(12, 10, 'Персонажи');
          G.pathIcon(c, kit.path, 16, 34, 14);
          ui.text(H.PATHS[kit.path].name + ' / ' + (k === 'trail' ? s.name : kit.name.length > 18 && kit.short ? kit.short : kit.name), 34, 35, { size: 12, bold: true, col: C.cream });
          this.drawStrip(c, s, k);
          ui.closeBtn(W - 32, 10, () => ui.pop());
          SECTIONS.forEach((sec, i) => {
            const y = 80 + i * SEC_STEP, on = i === this.sec;
            if (on) { const gr = c.createLinearGradient(12, 0, 180, 0); gr.addColorStop(0, 'rgba(242,220,154,0.3)'); gr.addColorStop(1, 'rgba(242,220,154,0)'); c.fillStyle = gr; c.fillRect(12, y - 4, 170, 34); c.fillStyle = C.brassHi; c.fillRect(12, y - 4, 2, 34); }
            c.fillStyle = on ? 'rgba(242,220,154,0.25)' : 'rgba(10,12,40,0.6)'; c.beginPath(); c.arc(34, y + 13, 15, 0, Math.PI * 2); c.fill();
            c.strokeStyle = on ? C.brassHi : 'rgba(154,166,208,0.5)'; c.stroke();
            G.menuIcon(c, sec.icon, 24, y + 3, 20, on ? '#fff0c0' : '#c8cce4');
            ui.text(sec.label, 56, y + 6, { size: 13, bold: on, serif: on, col: on ? C.gold : C.cream });
            if (sec.id === 'eidolons' && g.eidNew(k) > 0) ui.badge(56 + ui.measure(sec.label, 13, on, on) + 10, y + 6);
            ui.hit(12, y - 4, 170, 34, () => { this.sec = i; this.slotFocus = false; this.starFocus = false; this.infoFocus = false; this.outfitFocus = false; this.trFocus = false; ui.sfx('select'); });
          });
          this.drawFav(c, k);
          this.drawListBtn(c);
          ui.platform(c, 306, 440, 108);
          if (secId === 'eidolons') this.drawEidolons(c, EV ? EV.shown : r.eid);
          if (EV) { E.figure(c, look, 306, 444, 3, ui.t, EV.lifeK, k); E.aura(c, E.sceneOf(E.keyOf(k, g)).aura, 306, 444, ui.t, EV.lifeK); }
          else G.drawFigure(c, secId === 'outfits' ? ui.outfitPreview(this, k) : look, 306, 444, 3);
          if (secId === 'traces') ui.drawTraces(this, c, k);
          if (secId === 'relics') this.drawRelicSlots(c, k);
          const px = secId === 'info' ? 388 : 440, py = 58, pw = secId === 'info' ? 244 : 192, ph = 414;
          ui.win(px, py, pw, ph, { alpha: 0.9 });
          if (secId === 'details') this.panelDetails(c, px, py, pw, k, r, kit, st, look);
          if (secId === 'traces') ui.panelTraces(this, c, px, py, pw, ph, k);
          if (secId === 'relics') this.panelRelic(c, px, py, pw, k, r);
          if (secId === 'skills') this.panelSkills(c, px, py, pw, kitId, kit);
          if (secId === 'eidolons') this.panelEidolons(c, px, py, pw, r, kitId, kit, EV);
          if (secId === 'info') this.panelInfo(c, px, py, pw, ph, k, kit);
          if (secId === 'outfits') ui.panelOutfits(this, c, px, py, pw, ph, k);
          const hint = secId === 'relics' ? (this.slotFocus ? [['←↑↓→', 'Слот'], ['Enter', 'Сменить'], ['Del', 'Снять'], ['A', 'Авто'], ['Esc', 'Назад']] : [['Enter', 'К слотам'], ['A', 'Авто-реликвии']]) : secId === 'traces' ? ui.traceHints(this) : secId === 'details' ? [['Enter', 'Действия'], ['U', 'Повысить уровень']] : secId === 'eidolons' ? (this.asm ? [['Enter', 'Пропустить сборку']] : this.starFocus ? [['←↑↓→', 'Эйдолон'], ['V', 'Картина'], ['Esc', 'Назад']] : [['Enter', 'К созвездию'], ['V', 'Картина']]) : secId === 'info' ? (this.infoFocus ? [['←→', 'Вкладка'], ['↑↓', 'Прокрутка'], ['Esc', 'Назад']] : [['Enter', 'Читать']]) : secId === 'outfits' ? ui.outfitHints(this, k) : [];
          const deep = (secId === 'eidolons' && this.starFocus) || (secId === 'info' && this.infoFocus) || (secId === 'outfits' && this.outfitFocus) || (secId === 'traces' && this.trFocus);
          ui.hints((deep ? [['Q/E', 'Персонаж']] : [['Q/E', 'Персонаж'], ['↑↓', 'Раздел']]).concat(hint), 12, HGT - 18);
          if (this.asm) ui.hit(0, 0, W, HGT, () => E.skipAsm(this, g));
        },
        drawFav(c, k) {
          const on = g.isFav(k), y = FAV_Y, label = on ? 'В избранном' : 'В избранное';
          c.fillStyle = 'rgba(154,166,208,0.3)'; c.fillRect(16, y - 10, 162, 1);
          c.fillStyle = on ? 'rgba(242,220,154,0.25)' : 'rgba(10,12,40,0.6)'; c.beginPath(); c.arc(34, y + 13, 15, 0, Math.PI * 2); c.fill();
          c.strokeStyle = on ? C.brassHi : 'rgba(154,166,208,0.5)'; c.lineWidth = 1; c.stroke();
          ui.favStar(c, 34, y + 14, 9, on);
          ui.text(label, 56, y + 6, { size: 13, col: on ? C.gold : C.cream });
          ui.keycap(62 + ui.measure(label, 13), y + 7, 'F');
          ui.hit(12, y - 4, 170, 34, () => this.toggleFav());
        },
        drawListBtn(c) {
          const y = LIST_Y, label = 'Все персонажи';
          c.fillStyle = 'rgba(10,12,40,0.6)'; c.beginPath(); c.arc(34, y + 13, 15, 0, Math.PI * 2); c.fill();
          c.strokeStyle = 'rgba(154,166,208,0.5)'; c.lineWidth = 1; c.stroke();
          G.menuIcon(c, 'team', 24, y + 3, 20, '#c8cce4');
          ui.text(label, 56, y + 6, { size: 13, col: C.cream });
          ui.keycap(62 + ui.measure(label, 13), y + 7, 'L');
          ui.hit(12, y - 4, 170, 34, () => ui.openCharList(this));
        },
        toggleFav() {
          const on = g.toggleFav(this.k);
          ui.sfx(on ? 'confirm' : 'cancel');
          ui.toast(on ? ui.shortName(this.k) + ': в избранном. Избранные идут в списках сразу после отряда.' : ui.shortName(this.k) + ': отметка «Избранное» снята.');
        },
        panelDetails(c, px, py, pw, k, r, kit, st, look) {
          const s = g.state;
          ui.text(k === 'trail' ? s.name : kit.name, px + 12, py + 12, { size: 18, bold: true, serif: true, col: C.gold });
          G.elemIcon(c, kit.elem, px + pw - 22, py + 22, 9);
          G.pathIcon(c, kit.path, px + 12, py + 38, 14);
          ui.text(H.PATHS[kit.path].name + ' · ' + H.ELEMENTS[kit.elem].name, px + 30, py + 39, { size: 11, col: C.sub });
          ui.text('★'.repeat(kit.rarity), px + 12, py + 56, { size: 13, col: G.RARITY[kit.rarity] });
          ui.text('Эйдолон ' + r.eid, px + pw - 12, py + 58, { size: 11, align: 'right', col: C.cream });
          ui.text('Ур. ' + r.lvl, px + 12, py + 76, { size: 15, bold: true, serif: true });
          const asc = g.ascOf ? g.ascOf(k) : H.ascPhase(r.lvl), lvlW = ui.measure('Ур. ' + r.lvl, 15, true, true) + 2;
          ui.text('/' + H.ascCap(asc), px + 12 + lvlW, py + 80, { size: 11, col: C.dim });
          ui.ascGems(c, px + 22 + lvlW + ui.measure('/' + H.ascCap(asc), 11), py + 83, asc, { r: 3.5, step: 9 });
          ui.text(r.exp + '/' + H.expToNext(r.lvl), px + pw - 12, py + 89, { size: 9, align: 'right', col: C.sub });
          ui.rail(px + 12, py + 100, pw - 24, r.exp / H.expToNext(r.lvl));
          (kit.path === 'elation' ? STAT_ROWS.map(x => x[0] === 'breakE' ? ['elation', 'Радость'] : x) : STAT_ROWS).forEach(([key, name], i) => {
            const y = py + 112 + i * 19;
            if (i % 2 === 0) { c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(px + 8, y - 2, pw - 16, 19); }
            G.statIcon(c, key, px + 12, y + 1, 12, '#c8d0f0');
            ui.text(name, px + 30, y, { size: 11, col: C.sub });
            ui.text(ui.statValue(st, key, r, kit), px + pw - 12, y, { size: 12, bold: true, align: 'right' });
          });
          const cone = r.cone ? s.inv.cones.find(x => x.uid === r.cone) : null;
          const cy = py + 272;
          c.fillStyle = 'rgba(242,220,154,0.35)'; c.fillRect(px + 10, cy - 6, pw - 20, 1);
          c.fillStyle = 'rgba(242,220,154,0.06)'; c.fillRect(px + 8, cy - 3, pw - 16, 62);
          ui.text('›', px + pw - 14, cy + 16, { size: 20, bold: true, align: 'right', col: C.gold });
          ui.hit(px + 8, cy - 3, pw - 16, 62, () => ui.openConePick(k));
          if (cone) ui.button(px + pw - 36, cy + 34, 22, 18, '↑', () => ui.openConeUp(cone.uid, { only: true }), { size: 11, bold: true });
          if (cone) {
            G.drawConeCard(c, cone.id, px + 12, cy, 40, 56, { info: false });
            const d = H.CONES[cone.id];
            ui.wrap(d.name, pw - 86, 11).slice(0, 2).forEach((l, i) => ui.text(l, px + 60, cy + 2 + i * 13, { size: 11, bold: true, col: C.gold }));
            ui.text(ui.fitText('Ур. ' + g.coneLvlOf(cone, r).lvl + '/' + g.coneLvlOf(cone, r).cap + ' · S' + (cone.sup || 1) + (d.skill ? ' · ' + d.skill : ''), 10, pw - 86), px + 60, cy + 30, { size: 10, col: C.sub });
            ui.text(ui.fitText(d.path === kit.path ? 'Пассивка действует' : 'Другой Путь: только характеристики', 10, pw - 86), px + 60, cy + 43, { size: 10, col: d.path === kit.path ? C.ok : C.bad });
          } else {
            c.strokeStyle = 'rgba(154,166,208,0.6)'; c.setLineDash([3, 2]); c.strokeRect(px + 12.5, cy + 0.5, 39, 55); c.setLineDash([]);
            ui.text('+', px + 32, cy + 18, { align: 'center', size: 18, col: C.sub });
            ui.text('Конус не надет', px + 60, cy + 20, { size: 11, col: C.dim });
          }
          const canAsc = g.ascInfo && !r.guest && g.ascInfo(k).atCap && g.ascInfo(k).asc < 6, readyAsc = g.ascReady && g.ascReady(k);
          ui.button(px + 12, py + 342, pw - 24, 26, canAsc ? 'Возвысить' : 'Повысить уровень', () => ui.openLevelUp(k), { size: 12, bold: true, disabled: !!r.guest, active: canAsc });
          if (readyAsc) ui.badge(px + pw - 16, py + 346);
          const inParty = s.party.includes(k);
          ui.button(px + 12, py + 414 - 38, pw - 24, 24, inParty ? 'В команде · место ' + (s.party.indexOf(k) + 1) : 'Добавить в команду', () => this.openActions(), { size: 11, icon: 'team' });
        },
        openActions() {
          const s = g.state, k = this.k;
          const acts = () => {
            const inParty = s.party.includes(k);
            return [
              { label: inParty ? 'Убрать из команды' : 'Добавить в команду', disabled: inParty ? s.party.length <= 1 : s.party.length >= 4, fn: () => { if (inParty) s.party = s.party.filter(x => x !== k); else s.party.push(k); ui.sfx('confirm'); } },
              { label: 'Сделать лидером', disabled: !inParty || s.party[0] === k, fn: () => { s.party = [k, ...s.party.filter(x => x !== k)]; ui.sfx('confirm'); } },
              { label: 'Сменить конус', fn: () => ui.openConePick(k) },
              { label: 'Повысить уровень', disabled: !!s.roster[k].guest, fn: () => ui.openLevelUp(k) },
              { label: 'Авто-реликвии', fn: () => { g.autoEquip(k); ui.sfx('confirm'); ui.toast('Реликвии подобраны автоматически.'); } }
            ];
          };
          ui.push({
            draw() {
              const a = acts(), x = 440, y = 250;
              ui.win(x, y, 192, 32 + a.length * 24, { title: 'Действия' });
              ui.list(x + 6, y + 16, 180, a.map(it => ({ label: it.label, disabled: it.disabled })), this.sel, { rowH: 24, size: 11, onClick: i => { this.sel = i; this.key('ok'); } });
            },
            key(kk) {
              const a = acts();
              if (ui.listNav(this, kk, a.length)) return;
              if (kk === 'ok') { if (a[this.sel].disabled) { ui.sfx('deny'); return; } a[this.sel].fn(); if (ui.top() === this) ui.screens.pop(); }
              if (kk === 'back') ui.pop();
            }
          });
        },
        relicSlotRects() { return [[190, 112], [190, 204], [382, 112], [382, 204], [190, 312], [382, 312]]; },
        relicGrid: [[0, 0], [0, 1], [1, 0], [1, 1], [0, 2], [1, 2]],
        moveSlot(kk) {
          const [col, row] = this.relicGrid[this.slot];
          const to = kk === 'left' || kk === 'right' ? [1 - col, row] : [col, (row + (kk === 'up' ? 2 : 1)) % 3];
          this.slot = this.relicGrid.findIndex(([a, b]) => a === to[0] && b === to[1]);
        },
        drawRelicSlots(c, k) {
          const s = g.state, r = s.roster[k], rects = this.relicSlotRects();
          H.RELIC_SLOTS.forEach((sl, i) => {
            const [x, y] = rects[i], rel = s.inv.relics.find(z => z.uid === r.relics[sl.key]), on = i === this.slot, planar = sl.kind === 'planar';
            c.fillStyle = planar ? 'rgba(20,10,40,0.88)' : 'rgba(6,8,26,0.85)'; c.fillRect(x, y, 46, 46);
            const idle = planar ? 'rgba(190,140,255,0.6)' : 'rgba(154,166,208,0.5)';
            c.strokeStyle = on && this.slotFocus ? C.brassHi : on ? 'rgba(242,220,154,0.6)' : idle; c.lineWidth = on ? 2 : 1; c.strokeRect(x + 0.5, y + 0.5, 45, 45); c.lineWidth = 1;
            if (planar) { ui.diamond(x, y, 3, '#b07cff', '#1a0c30'); ui.diamond(x + 46, y + 46, 3, '#b07cff', '#1a0c30'); }
            if (rel) G.itemIcon(c, 'relic:' + sl.key, x + 7, y + 5, 32, rel.set);
            else { G.itemIcon(c, 'relic:' + sl.key, x + 7, y + 5, 32, 'none'); c.fillStyle = 'rgba(6,8,26,0.6)'; c.fillRect(x + 1, y + 1, 44, 44); }
            if (rel) ui.text('+' + rel.lvl, x + 43, y + 33, { size: 9, bold: true, align: 'right', col: C.gold });
            ui.text(sl.name, x + 23, y + 48, { size: 10, align: 'center', col: on ? C.gold : planar ? '#d8c0ff' : C.sub });
            ui.hit(x, y, 46, 46, () => { this.slot = i; this.slotFocus = true; ui.openRelicPick(this.k, i); });
          });
        },
        panelRelic(c, px, py, pw, k, r) {
          const s = g.state, sl = H.RELIC_SLOTS[this.slot], rel = s.inv.relics.find(z => z.uid === r.relics[sl.key]);
          ui.text(sl.kind === 'planar' ? 'Украшения' : 'Реликвии', px + 12, py + 12, { size: 14, bold: true, serif: true, col: C.gold });
          ui.text('Слот: ' + (sl.full || sl.name), px + 12, py + 34, { size: 11, col: C.sub });
          if (rel) {
            const L = ui.relicLabel(rel), set = H.RELIC_SETS[rel.set];
            G.rarityCell(c, px + 12, py + 52, 44, 44, 4);
            G.itemIcon(c, 'relic:' + sl.key, px + 18, py + 56, 32, rel.set);
            ui.wrap(set.pieces ? set.pieces[rel.slot] : set.name, pw - 80, 11).slice(0, 2).forEach((l, i) => ui.text(l, px + 64, py + 54 + i * 13, { size: 11, bold: true, col: C.gold }));
            ui.text('+' + rel.lvl, px + 64, py + 82, { size: 11, col: C.cream });
            ui.text(L.main, px + 12, py + 104, { size: 13, bold: true, col: C.cream });
            rel.subs.forEach(([key, v], i) => ui.text('· ' + H.STAT_NAMES[key] + ' ' + ui.fmtStat(key, v), px + 14, py + 124 + i * 15, { size: 11, col: C.sub }));
          } else ui.text('Слот пуст.', px + 12, py + 60, { size: 11, col: C.dim });
          ui.text('Комплекты', px + 12, py + 196, { size: 12, bold: true, serif: true, col: C.gold });
          let y = py + 214;
          const rows = ui.setRows(k);
          if (!rows.length) ui.text('Нет надетых реликвий.', px + 12, y, { size: 10, col: C.dim });
          for (const row of rows) {
            if (y > py + 362) break;
            ui.text(row.head, px + 12, y, { size: 10, bold: true, col: row.col });
            y += 13;
            for (const [line, col] of row.lines) for (const l of ui.wrap(line, pw - 30, 10).slice(0, 2)) { if (y > py + 366) break; ui.text(l, px + 18, y, { size: 10, col }); y += 12; }
            y += 4;
          }
          ui.button(px + 12, py + 414 - 38, pw - 24, 24, 'Подобрать автоматически', () => { g.autoEquip(this.k); ui.sfx('confirm'); ui.toast('Реликвии подобраны автоматически.'); }, { size: 11, icon: 'relic' });
        },
        panelSkills(c, px, py, pw, kitId, kit) {
          let y = py + 12;
          ui.text('Способности', px + 12, y, { size: 14, bold: true, serif: true, col: C.gold }); y += 22;
          const lvOf = id => (H.TRACES && H.TRACES[kitId] && g.state.roster[this.k] ? { lv: g.traceLevel(this.k, id), up: g.traceNode(this.k, id).up || 0 } : null);
          const lvTag = (id, yy) => { const L = lvOf(id); if (L) ui.text('ур. ' + L.lv, px + pw - 12, yy, { size: 10, bold: true, align: 'right', col: L.up ? C.cyan : C.gold }); return L; };
          const block = (key, name, ab, extra, id) => {
            ui.keycap(px + 12, y, key);
            const L = lvTag(id, y + 2), shown = L && ab.fx ? H.traceScaleAb(ab, id, L.lv, kitId) : ab;
            ui.wrap(ab.name, pw - 84, 11).slice(0, 2).forEach((l, i) => { if (i) y += 13; ui.text(l, px + 40, y + 1, { size: 11, bold: true, col: C.cream }); });
            y += 15;
            ui.wrap(ab.text ? name + ' · ' + ab.text + (extra || '') : name + ' · ' + (TARGET_NAME[ab.target] || '') + ' · ' + ui.describeFx(shown) + (extra || ''), pw - 24, 10).slice(0, 3).forEach(l => { ui.text(l, px + 12, y, { size: 10, col: C.sub }); y += 12; });
            y += 5;
          };
          block('Q', 'Атака', kit.basic, ' · +1 очко', 'basic');
          if (kit.skills) block('E', 'Навык ↑↓', { name: kit.skills.map(x => x.name).join(' / '), text: kit.skillText }, '', 'skill');
          else block('E', 'Навык', kit.skill, kit.skill.noSp ? ' · тратит HP' : ' · −1 очко', 'skill');
          block('1–4', 'Абсолютная', kit.ult, ' · энергия ' + kit.energy, 'ult');
          ui.text('Талант', px + 12, y, { size: 11, bold: true, col: C.gold }); lvTag('talent', y); y += 14;
          ui.wrap(kit.talent, pw - 24, 10).slice(0, 3).forEach(l => { ui.text(l, px + 12, y, { size: 10 }); y += 12; }); y += 4;
          if (kit.elSkill) {
            ui.wrap('Навык Радости: ' + kit.elSkill.name, pw - 34, 11).slice(0, 2).forEach(l => { ui.text(l, px + 12, y, { size: 11, bold: true, col: '#ff9ae0' }); y += 13; }); y += 1;
            ui.wrap(kit.elSkill.text, pw - 24, 10).slice(0, 3).forEach(l => { ui.text(l, px + 12, y, { size: 10 }); y += 12; }); y += 4;
          }
          ui.wrap('Техника: ' + kit.tech.name, pw - 34, 11).slice(0, 2).forEach(l => { ui.text(l, px + 12, y, { size: 11, bold: true, col: C.cyan }); y += 13; }); y += 1;
          ui.wrap(kit.tech.text, pw - 24, 10).slice(0, 2).forEach(l => { ui.text(l, px + 12, y, { size: 10 }); y += 12; }); y += 4;
          ui.text('Контакт', px + 12, y, { size: 11, bold: true, col: C.gold }); y += 14;
          kit.contact.forEach(x => { ui.text('· ' + x.name + ' (' + TAG_NAME[x.tag] + ')', px + 12, y, { size: 10, col: C.cream }); y += 12; });
          const fus = Object.entries(H.FUSIONS).filter(([, f]) => f.members.includes(kitId));
          if (fus.length) {
            y += 4; ui.text('Слияния', px + 12, y, { size: 11, bold: true, col: C.pink }); y += 14;
            fus.slice(0, 2).forEach(([id, f]) => { const known = g.state.bank.fusions.includes(id); ui.wrap(known ? f.name : '??? с ' + H.CHARS[f.members.find(m => m !== kitId)].name, pw - 24, 10).slice(0, 1).forEach(l => ui.text('· ' + l, px + 12, y, { size: 10, col: known ? C.cream : C.dim })); y += 12; });
          }
        },
        eidolonPoints() { return H.Eidolons ? H.Eidolons.nodes() : [[208, 334], [212, 189], [270, 108], [342, 108], [400, 189], [404, 334]]; },
        drawEidolons(c, eid) {
          const pts = this.eidolonPoints();
          c.save();
          for (let i = 1; i < pts.length; i++) {
            const on = i < eid, [ax, ay] = pts[i - 1], [bx, by] = pts[i];
            c.lineWidth = 3; c.strokeStyle = 'rgba(4,4,16,0.45)'; c.setLineDash([]);
            c.beginPath(); c.moveTo(ax, ay + 1); c.lineTo(bx, by + 1); c.stroke();
            c.lineWidth = 1; c.strokeStyle = on ? 'rgba(255,230,150,0.95)' : 'rgba(242,220,154,0.5)'; c.setLineDash(on ? [] : [3, 3]);
            c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
          }
          c.restore();
          pts.forEach(([x, y], i) => {
            const lit = i < eid;
            if (lit) { const gl = c.createRadialGradient(x, y, 1, x, y, 16); gl.addColorStop(0, 'rgba(255,230,150,0.75)'); gl.addColorStop(1, 'rgba(255,230,150,0)'); c.fillStyle = gl; c.fillRect(x - 16, y - 16, 32, 32); }
            if (i === this.star) {
              const rr = 13 + (this.starFocus ? Math.sin(ui.t * 6) * 1.5 : 0);
              c.strokeStyle = this.starFocus ? C.brassHi : 'rgba(242,220,154,0.6)'; c.lineWidth = this.starFocus ? 2 : 1;
              c.beginPath(); c.moveTo(x, y - rr); c.lineTo(x + rr, y); c.lineTo(x, y + rr); c.lineTo(x - rr, y); c.closePath(); c.stroke(); c.lineWidth = 1;
            }
            ui.diamond(x, y, lit ? 7 : 6, lit ? '#fff0b0' : '#2a2e58', lit ? '#8a6a20' : '#9aa0d0');
            c.fillStyle = 'rgba(6,8,24,0.72)'; c.fillRect(x - 10, y + 15, 20, 12);
            ui.text(EIDOLON_NUM[i], x, y + 16, { align: 'center', size: 9, bold: lit, col: lit ? C.gold : i === this.star ? C.cream : C.sub });
            ui.hit(x - 18, y - 18, 36, 46, () => { this.star = i; this.starFocus = true; ui.sfx('select'); });
          });
        },
        panelEidolons(c, px, py, pw, r, kitId, kit, EV) {
          const E = H.Eidolons, sc = E && E.sceneOf(E.keyOf(this.k, g)), shown = EV ? EV.shown : r.eid;
          const i = this.star, open = i < shown, was = g.baseStats(kitId, r.lvl, i), now = g.baseStats(kitId, r.lvl, i + 1);
          const sep = y => { c.fillStyle = 'rgba(242,220,154,0.35)'; c.fillRect(px + 10, y, pw - 20, 1); };
          ui.text('Эйдолоны', px + 12, py + 12, { size: 14, bold: true, serif: true, col: C.gold });
          ui.text(shown + ' / 6', px + pw - 12, py + 14, { size: 13, bold: true, align: 'right' });
          sep(py + 34);
          ui.diamond(px + 19, py + 50, 6, open ? '#fff0b0' : '#2a2e58', open ? '#8a6a20' : '#6a70a0');
          ui.text('Эйдолон ' + EIDOLON_NUM[i], px + 32, py + 42, { size: 14, bold: true, serif: true, col: open ? C.gold : C.cream });
          ui.text(open ? 'открыт' : 'закрыт', px + pw - 12, py + 45, { size: 10, align: 'right', col: open ? C.ok : C.dim });
          const tr = H.TRACES && H.TRACES[kitId], eidT = tr && tr.eid[i], fx = !!(tr && tr.eidFx), lim = py + 192;
          let y = py + 60;
          const line = (text, size, col, bold, end) => { for (const l of ui.wrap(text, pw - 24, size)) { if (y + size > (end || lim)) return; ui.text(l, px + 12, y, { size, col, bold }); y += size + 2; } };
          if (eidT && eidT[0]) {
            if (!fx) { line('Пока: +4% к HP, атаке и защите', 9, C.sub); y += 1; }
            line('«' + eidT[0] + '»', 12, open ? C.cream : C.sub, true);
            y += 2;
            line(g.fill(eidT[1]), 9, open && fx ? C.ok : open ? '#c8d0f0' : C.dim, false, sc ? lim - 14 : lim);
          } else {
            line('Базовые HP, атака и защита +4%: HP +' + (now.hp - was.hp) + ', атака +' + (now.atk - was.atk) + ', защита +' + (now.def - was.def) + '.', 10, open ? C.ok : '#c8d0f0');
          }
          if (sc) {
            const [name] = sc.frags[i];
            y = lim - 10;
            ui.text(ui.fitText('Фрагмент: «' + name + '»', 9, pw - 24), px + 12, y, { size: 9, bold: true, col: C.sub });
          }
          sep(py + 196);
          if (sc) {
            ui.text('Картина', px + 12, py + 202, { size: 12, bold: true, serif: true, col: C.gold });
            ui.text('Эйдолоны ' + shown + ' / 6', px + pw - 12, py + 204, { size: 10, align: 'right', col: C.sub });
            ui.wrap(sc.title, pw - 24, 11).slice(0, 1).forEach(l => ui.text(l, px + 12, py + 219, { size: 11, col: C.cream }));
            const rx = px + 20, rw = pw - 40, ry = py + 244;
            c.fillStyle = '#05060e'; c.fillRect(rx, ry - 2, rw, 5);
            for (let n = 0; n <= 6; n++) { c.fillStyle = '#3a3020'; c.fillRect(Math.round(rx + rw * n / 6) - 1, ry - 4, 2, 9); }
            c.fillStyle = '#6a5a3a'; c.fillRect(rx, ry - 2, rw, 1); c.fillRect(rx, ry + 2, rw, 1);
            c.fillStyle = C.brassHi; c.fillRect(rx, ry - 1, Math.round(rw * shown / 6), 3);
            const mx = Math.round(rx + rw * (i + 1) / 6);
            c.fillStyle = i < shown ? C.gold : C.cream; c.beginPath(); c.moveTo(mx - 4, ry - 10); c.lineTo(mx + 4, ry - 10); c.lineTo(mx, ry - 5); c.closePath(); c.fill();
            [[0, 'Ч/Б'], [1, 'Цвет'], [3, 'Декор'], [6, 'Жизнь']].forEach(([n, label]) => {
              const x = Math.round(rx + rw * n / 6), on = shown >= n;
              ui.diamond(x, ry + 0.5, 4, on ? C.brassHi : '#2a2e58', on ? '#1a1208' : '#6a70a0');
              ui.text(label, x, ry + 8, { align: 'center', size: 9, col: on ? C.gold : C.dim });
            });
            ui.text('Сейчас: ' + E.stageName(shown).toLowerCase(), px + 12, py + 270, { size: 10, col: C.cream });
            ui.wrap('Эйдолон ' + EIDOLON_NUM[i] + ' ' + E.stageGift(i) + '.', pw - 24, 10).slice(0, 2).forEach((l, n) => ui.text(l, px + 12, py + 284 + n * 12, { size: 10, col: open ? C.ok : '#c8d0f0' }));
          }
          sep(py + 314);
          const shadow = tr && tr.shadow, have = shadow ? g.state.inv.items[shadow] || 0 : 0;
          const tail = open ? 'Эйдолон открыт и уже действует.' : shadow ? H.ITEMS[shadow].name + ' до открытия: ' + (i + 1 - shown) + ', в наличии ' + have + '. ' + (have && i === shown ? 'Enter на звезде открывает его.' : have ? '' : 'Где взять: ' + ui.traceSource(shadow)) : 'Дубликатов до открытия: ' + (i + 1 - shown) + '. Дубликаты персонажа выпадают в Звёздном прыжке.';
          ui.wrap(tail, pw - 24, 10).slice(0, 4).forEach((l, n) => ui.text(l, px + 12, py + 321 + n * 13, { size: 10, col: open ? C.ok : C.cream }));
          if (sc) ui.button(px + 12, py + 414 - 38, pw - 24, 24, 'Смотреть картину · V', () => { if (!this.asm) ui.openEidolonView(this.k); }, { size: 11 });
        },
        infoRows(k, kit, w) {
          const inf = H.INFO && H.INFO[k], rows = [], r = g.state.roster[k];
          const add = (text, o = {}) => ui.wrap(g.fill(text), w - (o.x || 0) - (o.indent || 0), o.size || 11).forEach((l, i) => rows.push(Object.assign({ text: l }, o, { x: (o.x || 0) + (i ? 0 : o.indent || 0), lock: !i && o.lock })));
          const gap = () => { if (rows.length && rows[rows.length - 1].text) rows.push({ text: '' }); };
          const head = text => { gap(); rows.push({ text, size: 12, bold: true, serif: true, col: C.gold, rule: true }); };
          const body = (text, o = {}) => String(text).split('\n').forEach(p => {
            if (p[0] === '#') add(p.slice(1), { bold: true, col: C.cyan, size: 11 });
            else if (p[0] === '«') add(p, { col: '#e4dcff', x: 8 });
            else if (p[0] === '~') add(p.slice(1), { col: '#e4dcff', x: 16 });
            else add(p, Object.assign({ indent: 10 }, o));
          });
          const locked = need => { const why = H.infoLock(g, k, need); if (why) add(why, { col: C.dim, lock: true, x: 8 }); return !!why; };
          if (this.infoPage === 0) {
            const field = (name, value) => { if (!value) return; rows.push({ text: name, size: 10, col: C.sub }); add(value, { x: 8 }); };
            field('Полное имя', inf ? inf.full : (k === 'trail' ? g.state.name : kit.name));
            field('Также зовут', inf && inf.aka);
            field('Фракция', inf && inf.faction);
            field('Родина', inf && inf.home);
            field('Путь и стихия', H.PATHS[kit.path].name + ', ' + H.ELEMENTS[kit.elem].name.toLowerCase());
            if (!inf) { gap(); add('Досье ещё не составлено.', { col: C.dim }); return rows; }
            head('О персонаже'); body(inf.about);
            if (inf.intro) {
              head('Знакомство');
              inf.intro.forEach(q => {
                gap(); add(q.q, { bold: true, col: C.cyan });
                if (locked(q.need)) return;
                body('«' + q.a + '»');
                rows.push({ text: 'Примечание: ' + q.by, size: 10, col: C.brass, x: 8 });
                add(q.note, { x: 8, size: 10, col: '#c8d0f0' });
              });
            }
            (inf.extra || []).forEach(e => { head(e.h); if (!locked(e.need)) body(e.text); });
          } else if (this.infoPage === 1) {
            if (!inf) { add('Истории персонажа пока нет.', { col: C.dim }); return rows; }
            inf.story.forEach((st, i) => { head('История ' + H.STORY_NUM[i]); if (!locked(st.need)) body(st.text); });
          } else {
            if (!inf) { add('Реплик пока нет.', { col: C.dim }); return rows; }
            [['Общение', inf.voice], ['В бою', inf.battle]].forEach(([title, list]) => {
              head(title);
              list.forEach(v => { if (v.h) { gap(); add(v.h, { bold: true, col: C.cyan }); return; } add(v.t, { bold: true, col: C.brassHi, size: 10 }); if (!locked(v.need)) add('«' + v.text + '»', { x: 8 }); });
            });
          }
          return rows;
        },
        panelInfo(c, px, py, pw, ph, k, kit) {
          const inf = H.INFO && H.INFO[k];
          const name = inf ? g.fill(inf.full) : (k === 'trail' ? g.state.name : kit.name);
          ui.wrap(name, pw - 44, 16).slice(0, 2).forEach((l, i) => ui.text(l, px + 12, py + 12 + i * 19, { size: 16, bold: true, serif: true, col: C.gold }));
          G.elemIcon(c, kit.elem, px + pw - 22, py + 22, 9);
          const tw = Math.floor((pw - 24 - 8) / 3), ty = py + 50 + (ui.wrap(name, pw - 44, 16).length > 1 ? 19 : 0);
          INFO_PAGES.forEach((label, i) => ui.button(px + 12 + i * (tw + 4), ty, tw, 20, label, () => { this.infoPage = i; ui.sfx('select'); }, { size: 11, active: i === this.infoPage }));
          const top = ty + 30, h = py + ph - 12 - top, vis = Math.floor(h / INFO_ROW), w = pw - 24 - 20;
          c.fillStyle = 'rgba(242,220,154,0.35)'; c.fillRect(px + 10, top - 6, pw - 20, 1);
          const rows = this.infoRows(k, kit, w), sc = this.infoSc, key = k + '|' + this.infoPage;
          if (this.infoFor !== key) { sc.top = 0; this.infoFor = key; }
          sc.top = Math.max(0, Math.min(Math.round(sc.top), rows.length - vis));
          this.infoVis = vis;
          for (let i = sc.top; i < Math.min(rows.length, sc.top + vis); i++) {
            const row = rows[i], y = top + (i - sc.top) * INFO_ROW;
            if (!row.text) continue;
            if (row.rule) { c.fillStyle = 'rgba(242,220,154,0.18)'; c.fillRect(px + 12, y + INFO_ROW - 1, w, 1); }
            if (row.lock) ui.diamond(px + 15, y + 6, 3, '#2a2e58', '#6a70a0');
            ui.text(row.text, px + 12 + (row.x || 0), y, { size: row.size || 11, bold: row.bold, serif: row.serif, col: row.col || C.cream });
          }
          if (rows.length > vis) ui.scrollBar(px + pw - 12 - 10, top, vis * INFO_ROW, sc, rows.length, vis);
          ui.wheelZone(px, top, pw, vis * INFO_ROW, d => { sc.top += d * 3; });
          if (this.infoFocus) { c.strokeStyle = 'rgba(242,220,154,0.5)'; c.strokeRect(px + 6.5, top - 3.5, pw - 13, vis * INFO_ROW + 6); }
        },
        key(kk, code) {
          const secId = SECTIONS[this.sec].id;
          if (this.asm) { H.Eidolons.skipAsm(this, g); return; }
          if (code === 'KeyF') { this.toggleFav(); return; }
          if (code === 'KeyL') { ui.openCharList(this); return; }
          if (code === 'KeyU' && !g.state.roster[this.k].guest) { ui.openLevelUp(this.k); return; }
          if (secId === 'eidolons' && code === 'KeyV' && H.Eidolons && H.Eidolons.has(this.k)) { ui.openEidolonView(this.k); return; }
          if (secId === 'eidolons' && this.starFocus && kk === 'ok' && this.k === 'trail') { const sh = (H.TRACES[g.kitOf('trail')] || {}).shadow; if (sh && this.star === g.state.roster.trail.eid) ui.useShadowFlow(sh); return; }
          if (secId === 'eidolons' && this.starFocus && ['left', 'right', 'up', 'down', 'back'].includes(kk)) {
            const rise = this.star < 3 ? 1 : -1, step = { left: -1, right: 1, up: rise, down: -rise }[kk] || 0, to = this.star + step;
            const sideways = kk === 'left' || kk === 'right', sameSide = (to < 3) === (this.star < 3);
            if (step && to >= 0 && to < EIDOLON_NUM.length && (sideways || sameSide)) { this.star = to; ui.sfx('select'); }
            if (kk === 'back') { this.starFocus = false; ui.sfx('cancel'); }
            return;
          }
          if (secId === 'info' && this.infoFocus) {
            const vis = this.infoVis || 10, step = { up: -2, down: 2 }[kk] || (code === 'PageUp' ? 1 - vis : code === 'PageDown' ? vis - 1 : 0);
            if (code === 'KeyQ') return this.switchChar(-1);
            if (code === 'KeyE') return this.switchChar(1);
            if (step) { this.infoSc.top += step; return; }
            if (kk === 'left' || kk === 'right') { this.infoPage = (this.infoPage + (kk === 'left' ? 2 : 1)) % INFO_PAGES.length; ui.sfx('select'); return; }
            if (kk === 'back') { this.infoFocus = false; ui.sfx('cancel'); }
            return;
          }
          if (secId === 'outfits' && this.outfitFocus) { ui.outfitKey(this, kk, code); return; }
          if (secId === 'traces' && this.trFocus) { ui.tracesKey(this, kk, code, this.k); return; }
          if (secId === 'relics' && this.slotFocus) {
            if (['left', 'right', 'up', 'down'].includes(kk)) { this.moveSlot(kk); ui.sfx('select'); return; }
            if (kk === 'ok') { ui.openRelicPick(this.k, this.slot); return; }
            if (code === 'Delete' || code === 'KeyX') { g.unequipRelic(this.k, H.RELIC_SLOTS[this.slot].key); ui.sfx('cancel'); return; }
            if (code === 'KeyA') { g.autoEquip(this.k); ui.sfx('confirm'); return; }
            if (kk === 'back') { this.slotFocus = false; ui.sfx('cancel'); }
            return;
          }
          if (code === 'KeyQ' || kk === 'left') return this.switchChar(-1);
          if (code === 'KeyE' || kk === 'right') return this.switchChar(1);
          if (kk === 'up') { this.sec = (this.sec + SECTIONS.length - 1) % SECTIONS.length; ui.sfx('select'); return; }
          if (kk === 'down') { this.sec = (this.sec + 1) % SECTIONS.length; ui.sfx('select'); return; }
          if (code === 'KeyA' && secId === 'relics') { g.autoEquip(this.k); ui.sfx('confirm'); ui.toast('Реликвии подобраны автоматически.'); return; }
          if (kk === 'ok') {
            if (secId === 'details') this.openActions();
            else if (secId === 'traces') { this.trFocus = true; ui.sfx('confirm'); }
            else if (secId === 'relics') { this.slotFocus = true; ui.sfx('confirm'); }
            else if (secId === 'eidolons' && !this.starFocus) { this.starFocus = true; ui.sfx('confirm'); }
            else if (secId === 'info') { this.infoFocus = true; ui.sfx('confirm'); }
            else if (secId === 'outfits') { this.outfitFocus = true; ui.sfx('confirm'); }
            return;
          }
          if (kk === 'back') ui.pop();
        }
      });
      if (ui.traceBackNotice) ui.traceBackNotice();
    },

    describeFx(ab) {
      return ab.fx.map(f => {
        if (f.k === 'dmg') return 'урон ' + Math.round(f.m * 100) + '%' + (f.holy ? ' (нечисти ' + Math.round((f.m + f.holy) * 100) + '%)' : '') + (f.adj ? ' (соседним ' + Math.round(f.adj * 100) + '%)' : '') + (f.hits ? ' ×' + f.hits : '') + (f.plusDef ? ' +' + Math.round(f.plusDef * 100) + '% защ.' : '') + (f.chant ? ', +' + Math.round(T.chantDmg * 100) + '% за Напев' : '') + (f.luck ? ', +' + Math.round(f.luck * 100) + '% за Удачу' : '') + (f.anyTough ? ', по любой стойкости' : '');
        if (f.k === 'swing') return 'урон ' + Math.round(f.m * 100) + '% +' + Math.round(f.def * 100) + '% защ., только по неподвижной цели';
        if (f.k === 'chant') return 'Напев +1 (до ' + T.chantMax + '), без урона';
        if (f.k === 'collapse') return 'потом ' + T.collapseTurns + ' хода без сил';
        if (f.k === 'wet') return 'враги мокнут: лёд их заморозит';
        if (f.k === 'cover') return 'Прикрытие ' + f.turns + ' х.: берёт ' + Math.round(T.coverShare * 100) + '% урона союзников';
        if (f.k === 'ecstasy') return 'Восторг +' + f.v;
        if (f.k === 'heist') return 'снимает все усиления и щиты, срывает заряд, добыча';
        if (f.k === 'purge') return 'по нечисти снимает усиление';
        if (f.k === 'heal') return 'лечение ' + Math.round(f.m * 100) + '% HP' + (f.bounce ? ', ещё ' + f.bounce + ' отскока самому раненому' : '');
        if (f.k === 'invig') return 'Оживление ' + f.turns + ' х.';
        if (f.k === 'sync') return 'Единение души и стали';
        if (f.k === 'yanqingUlt') return 'крит +60%';
        if (f.k === 'svarogMarked') return 'по врагам с Меткой ещё ' + Math.round(f.m * 100) + '%';
        if (f.k === 'svMark') return 'Метки Сварога';
        if (f.k === 'promise') return 'Сварог: ' + f.v + ' усиленных ответа';
        if (f.k === 'shield') return 'щит ' + Math.round(f.m * 100) + '% защ.';
        if (f.k === 'buff') return f.quiet ? '' : (f.name || 'усиление') + ' ' + f.turns + ' х.';
        if (f.k === 'debuff') return (f.name || 'ослабление');
        if (f.k === 'freeze') return 'заморозка ' + Math.round(f.chance * 100) + '%';
        if (f.k === 'dot') return H.DOT_NAME[f.type];
        if (f.k === 'taunt') return 'провокация';
        if (f.k === 'advance') return 'ход раньше';
        if (f.k === 'bloom') return 'Цветение: пробитый враг дольше не встаёт';
        return '';
      }).filter(Boolean).join(', ');
    },

    fmtStat(k, v) { return (!k.endsWith('F') && k !== 'spd') ? '+' + (v * 100).toFixed(1) + '%' : '+' + Math.round(v); },

    setBonusText(set, n) {
      const d = H.RELIC_SETS[set];
      if (d.planar) return d.short;
      return Object.entries(d.bonus).map(([bk, bv]) => H.STAT_NAMES[bk] + ' +' + Math.round(bv * (n >= 4 ? 2 : 1) * 100) + '%').join(', ');
    },

    setCondLine(k, set, st) {
      const d = H.RELIC_SETS[set], c = d.cond, on = this.game.setCondOn(k, set, st);
      const cur = c.s === 'spd' ? String(Math.floor(st.spd)) + ' / ' + c.v : pct(st.critR || 0) + ' / ' + Math.round(c.v * 100) + '%';
      return [(c.s === 'spd' ? 'Скорость ' : 'Шанс крита ') + cur + (on ? ': доп. эффект действует' : ': доп. эффект не действует'), on ? C.ok : C.dim];
    },

    setRows(k) {
      const g = this.game, counts = g.setCounts(k), st = g.charStats(k), rows = [], single = [];
      for (const [set, n] of Object.entries(counts)) {
        const d = H.RELIC_SETS[set];
        if (n < 2) { single.push(d.name); continue; }
        const lines = [[this.setBonusText(set, n), C.cream]];
        if (d.planar && d.cond) lines.push(this.setCondLine(k, set, st));
        rows.push({ head: d.name + ' ×' + n, col: d.planar ? '#d8c0ff' : C.ok, lines });
      }
      if (single.length) rows.push({ head: 'Без пары', col: C.cream, lines: [[single.join(', '), C.dim]] });
      return rows;
    },

    relicLabel(rel) {
      return { main: H.STAT_NAMES[rel.main] + ' ' + this.fmtStat(rel.main, rel.mv), subs: rel.subs.map(([k, v]) => H.STAT_NAMES[k] + ' ' + this.fmtStat(k, v)).join(', ') };
    },

    openConePick(k) {
      const ui = this, g = this.game, path = H.CHARS[g.kitOf(k)].path;
      const sorted = () => g.state.inv.cones.map((cn, i) => ({ cn, i, d: H.CONES[cn.id] })).sort((a, b) => (b.d.path === path) - (a.d.path === path) || b.d.rarity - a.d.rarity || a.i - b.i).map(x => x.cn);
      this.push({
        sc: { top: 0 },
        draw(c) {
          const s = g.state, kit = H.CHARS[g.kitOf(k)], list = sorted();
          ui.win(24, 30, 592, 420, { title: 'Световые конусы — ' + H.PATHS[kit.path].name });
          if (!list.length) { ui.text('Нет конусов. Они выпадают в Звёздном прыжке и продаются в магазинах.', W / 2, 200, { align: 'center', col: C.dim }); ui.hints([['Esc', 'Назад']], W / 2, 420, { align: 'center' }); return; }
          const cols = 8, cw = 64, chh = 104, vis = 3, rows = Math.ceil(list.length / cols);
          if (this.sel >= list.length) this.sel = list.length - 1;
          const start = ui.listTop(this.sc, Math.floor(this.sel / cols), rows, vis) * cols;
          ui.wheelZone(36, 46, 576, vis * chh, d => { this.sc.top += d; });
          if (rows > vis) ui.scrollBar(600, 47, vis * chh - 10, this.sc, rows, vis);
          list.slice(start, start + cols * vis).forEach((cn, j) => {
            const i = start + j, x = 40 + (j % cols) * (cw + 6), y = 50 + Math.floor(j / cols) * chh, d = H.CONES[cn.id], on = i === this.sel;
            if (on) { c.fillStyle = 'rgba(242,220,154,0.25)'; c.fillRect(x - 3, y - 3, cw + 6, chh - 8); }
            G.drawConeCard(c, cn.id, x + 4, y, 56, 78, { sup: cn.sup || 1 });
            ui.text('ур.' + g.coneLvlOf(cn, Object.values(s.roster).find(r => r.cone === cn.uid)).lvl, x + 7, y + 67, { size: 9, bold: true, col: C.cream });
            if (d.path === kit.path) ui.diamond(x + 8, y + 4, 4, C.ok, '#0a2010');
            const holder = Object.entries(s.roster).find(([, r]) => r.cone === cn.uid);
            if (holder) ui.circlePortrait(c, G.lookOf(g.kitOf(holder[0]), g), x + 40, y + 58, 22, C.brassHi);
            ui.text(d.name.length > 11 ? d.name.slice(0, 10) + '…' : d.name, x + cw / 2, y + 81, { align: 'center', size: 9, col: on ? C.gold : C.cream });
            ui.hit(x, y, cw, chh - 10, () => { if (this.sel === i) this.key('ok'); else this.sel = i; });
          });
          const cn = list[this.sel];
          if (cn) {
            const d = H.CONES[cn.id], match = d.path === kit.path, st = g.coneStatsOf(cn), cl = g.coneLvlOf(cn, Object.values(s.roster).find(r => r.cone === cn.uid));
            c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(36, 364, 568, 60);
            ui.text(d.name + ' · S' + (cn.sup || 1) + ' · ' + '★'.repeat(d.rarity), 46, 370, { bold: true, serif: true, col: G.RARITY[d.rarity] });
            ui.text('Ур. ' + cl.lvl + '/' + cl.cap + ':  HP +' + st.hp + '  Атака +' + st.atk + '  Защита +' + st.def, 46, 386, { size: 11 });
            if (!match) ui.text('Путь ' + H.PATHS[d.path].name + ': пассивка не действует', 594, 386, { size: 10, align: 'right', col: C.bad });
            ui.coneLines(cn.id, cn.sup, 548, 10, 2).forEach((l, i) => ui.richText(l, 46, 400 + i * 12, { size: 10, col: match ? C.ok : C.dim, hot: match ? C.gold : C.sub }));
          }
          ui.hints([['←↑↓→', 'Выбор'], ['Enter', 'Надеть'], ['U', 'Улучшить'], ['V', 'Подробнее'], ['Esc', 'Назад']], W / 2, 430, { align: 'center' });
        },
        key(kk, code) {
          const n = g.state.inv.cones.length;
          if (!n) { if (kk === 'back' || kk === 'ok') ui.pop(); return; }
          if (code === 'KeyV') { const cn = sorted()[this.sel]; ui.openConeView(cn.id, cn.uid); return; }
          if (code === 'KeyU') { ui.openConeUp(sorted()[this.sel].uid); return; }
          if (kk === 'left') { this.sel = (this.sel + n - 1) % n; ui.sfx('select'); }
          if (kk === 'right') { this.sel = (this.sel + 1) % n; ui.sfx('select'); }
          if (kk === 'up') { this.sel = Math.max(0, this.sel - 8); ui.sfx('select'); }
          if (kk === 'down') { this.sel = Math.min(n - 1, this.sel + 8); ui.sfx('select'); }
          if (kk === 'ok') { g.equipCone(k, sorted()[this.sel].uid); ui.sfx('confirm'); ui.screens.pop(); }
          if (kk === 'back') ui.pop();
        }
      });
    },

    openRelicPick(k, slotIdx) {
      const ui = this, g = this.game, sl = H.RELIC_SLOTS[slotIdx];
      const cands = () => g.state.inv.relics.filter(r => r.slot === sl.key).sort((a, b) => b.lvl - a.lvl);
      this.push({
        draw(c) {
          const s = g.state, list = cands();
          ui.win(60, 40, 520, 400, { title: (sl.kind === 'planar' ? 'Украшения: ' : 'Реликвии: ') + (sl.full || sl.name) });
          const used = uid => Object.entries(s.roster).find(([, rr]) => Object.values(rr.relics).includes(uid));
          ui.list(72, 60, 290, list.map(rel => { const u = used(rel.uid); return { label: ui.relicLabel(rel).main, right: '+' + rel.lvl + (u ? ' · ' + ui.shortName(u[0]) : ''), icon: (cc, x, y) => G.itemIcon(cc, 'relic:' + rel.slot, x, y - 9, 18, rel.set), iconW: 22, col: u ? C.sub : C.cream }; }), this.sel, { rowH: 22, max: 15, size: 11, onClick: i => { if (this.sel === i) this.key('ok'); else this.sel = i; } });
          if (!list.length) ui.wrap(sl.kind === 'planar' ? 'Нет украшений. Их дают награды погружения в Виртуальной вселенной (Офис Герты на станции).' : 'Нет реликвий для этого слота.', 270, 12).forEach((l, i) => ui.text(l, 80, 70 + i * 16, { col: C.dim }));
          const cur = list[this.sel];
          if (cur) {
            const set = H.RELIC_SETS[cur.set];
            G.rarityCell(c, 380, 64, 56, 56, 4);
            G.itemIcon(c, 'relic:' + cur.slot, 384, 68, 48, cur.set);
            ui.wrap(set.pieces ? set.pieces[cur.slot] : set.name, 120, 11).slice(0, 3).forEach((l, i) => ui.text(l, 444, 66 + i * 13, { size: 11, bold: true, col: C.gold }));
            ui.text('+' + cur.lvl, 444, 106, { size: 11 });
            ui.text(ui.relicLabel(cur).main, 380, 130, { size: 13, bold: true });
            cur.subs.forEach(([key, v], i) => ui.text('· ' + H.STAT_NAMES[key] + ' ' + ui.fmtStat(key, v), 382, 152 + i * 16, { size: 11, col: C.sub }));
            if (set.planar) {
              ui.wrap(set.name, 190, 10).slice(0, 2).forEach((l, i) => ui.text(l, 380, 222 + i * 12, { size: 10, bold: true, col: '#d8c0ff' }));
              ui.wrap('Сфера + вязь: ' + set.text, 190, 10).slice(0, 5).forEach((l, i) => ui.text(l, 380, 248 + i * 12, { size: 10, col: C.ok }));
              ui.text('Расщепить: 150 кредитов, ' + g.salvageValue(cur) + ' Обломков', 380, 316, { size: 10, col: C.dim });
            } else {
              ui.text('2 шт.: ' + ui.setBonusText(cur.set, 2), 380, 230, { size: 10, col: C.ok });
              ui.text('4 шт.: бонус ×2', 380, 244, { size: 10, col: C.ok });
              ui.text('Расщепить: 150 кредитов, ' + g.salvageValue(cur) + ' Обломков', 380, 270, { size: 10, col: C.dim });
            }
          }
          ui.hints([['Enter', 'Надеть'], ['X', 'Расщепить'], ['Esc', 'Назад']], W / 2, 414, { align: 'center' });
        },
        key(kk, code) {
          const list = cands();
          if (ui.listNav(this, kk, list.length)) return;
          if (kk === 'ok' && list[this.sel]) { g.equipRelic(k, list[this.sel].uid); ui.sfx('confirm'); ui.screens.pop(); return; }
          if (code === 'KeyX' && list[this.sel]) { if (g.sellRelic(list[this.sel].uid)) { ui.sfx('chest'); this.sel = Math.max(0, this.sel - 1); } else { ui.sfx('deny'); ui.toast('Сначала снимите реликвию с персонажа.'); } return; }
          if (kk === 'back') ui.pop();
        }
      });
    },

    openTeam() {
      const ui = this, g = this.game, N = H.SQUADS;
      const SLOT_X = [112, 250, 390, 528], TAB = { x: 172, pitch: 32, y: 8 }, OV = { w: 240, top: 42, rh: 78, vis: 5 };
      this.push({
        full: true, view: g.state.squad || 0, over: false, osel: 0, osc: { top: 0 },
        setView(i) {
          if (i === this.view) return;
          if (g.state.guest) { ui.sfx('deny'); ui.toast('Пока в команде гости, отряд сменить нельзя.'); return; }
          this.view = i;
          if (g.squadOf(i).length) g.setSquad(i);
          ui.sfx('select');
        },
        toggleOver() {
          this.over = !this.over;
          if (this.over) { this.osel = this.view; this.osc.sel = null; }
          ui.sfx(this.over ? 'confirm' : 'cancel');
        },
        draw(c) {
          const s = g.state, mem = g.squadOf(this.view);
          ui.fullBg(c, false);
          const fl = c.createLinearGradient(0, 300, 0, HGT);
          fl.addColorStop(0, '#9aa4c8'); fl.addColorStop(0.35, '#d8deee'); fl.addColorStop(1, '#8a92b4');
          c.fillStyle = fl; c.fillRect(0, 300, W, HGT - 300);
          c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(0, 300, W, 1);
          ui.plate(12, 10, 'Команда');
          ui.text(mem.length + ' / 4', 110, 13, { size: 12, bold: true, col: C.cream });
          this.drawTabs(c, s);
          ui.closeBtn(W - 32, 10, () => ui.pop());
          if (!mem.length) ui.text('Отряд ' + (this.view + 1) + ' пуст. Добавьте персонажа, и отряд станет активным.', W / 2, 46, { align: 'center', size: 12, col: C.sub });
          SLOT_X.forEach((x, i) => {
            const k = mem[i], on = i === this.sel;
            c.fillStyle = on ? 'rgba(242,220,154,0.55)' : 'rgba(40,40,80,0.25)'; c.beginPath(); c.ellipse(x, 398, 52, 11, 0, 0, Math.PI * 2); c.fill();
            if (on) { c.strokeStyle = '#c89a3a'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, 398, 58, 13, 0, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1; }
            if (k) {
              const kid = g.kitOf(k), kit = H.CHARS[kid], r = s.roster[k];
              G.drawFigure(c, G.lookOf(kid, g), x, 400, 3);
              const py = 408, name = ui.shortName(k), w = Math.max(116, ui.measure(name, 12, true) + 50);
              c.fillStyle = 'rgba(8,10,30,0.85)'; c.fillRect(x - w / 2, py, w, 36);
              c.strokeStyle = on ? C.brassHi : 'rgba(154,166,208,0.6)'; c.strokeRect(x - w / 2 + 0.5, py + 0.5, w - 1, 35);
              c.fillStyle = G.dark(H.ELEMENTS[kit.elem].col, 0.2); c.beginPath(); c.arc(x - w / 2 + 16, py + 18, 12, 0, Math.PI * 2); c.fill();
              ui.text(String(r.lvl), x - w / 2 + 16, py + 12, { align: 'center', size: 11, bold: true });
              ui.text(name, x - w / 2 + 34, py + 4, { size: 12, bold: true, col: on ? C.gold : C.cream });
              G.pathIcon(c, kit.path, x - w / 2 + 34, py + 20, 11);
              ui.text(H.PATHS[kit.path].name, x - w / 2 + 48, py + 20, { size: 10, col: C.sub });
              if (g.isFav(k)) ui.favStar(c, x + w / 2 - 9, py + 9, 5, true);
              if (i === 0) { c.fillStyle = '#1a1208'; c.fillRect(x + 20, py - 20, 50, 16); c.fillStyle = C.brassHi; c.fillRect(x + 21, py - 19, 48, 14); ui.text('Лидер', x + 45, py - 18, { align: 'center', size: 10, bold: true, col: '#20140c', shadow: false }); }
            } else {
              c.strokeStyle = 'rgba(154,166,208,0.4)'; c.setLineDash([4, 3]); c.strokeRect(x - 40.5, 150.5, 80, 240); c.setLineDash([]);
              ui.text('+', x, 196, { align: 'center', size: 34, bold: true, col: on ? C.gold : C.sub });
              ui.text('Добавить', x, 244, { align: 'center', size: 12, bold: true, col: on ? C.gold : C.sub });
            }
            if (on) ui.diamond(x, 78 + Math.sin(ui.t * 4) * 3, 7, C.brassHi, '#1a1208');
            ui.hit(x - 66, 90, 132, 360, () => { if (this.sel === i) this.key('ok'); else { this.sel = i; ui.sfx('select'); } });
          });
          if (this.over) {
            this.drawOver(c, s);
            ui.hints([['↑↓', 'Отряд'], ['Enter', 'Выбрать'], ['Tab', 'Закрыть']], 44, HGT - 18);
          } else ui.hints([['Q/E', 'Отряд'], ['←→', 'Место'], ['Enter', 'Сменить'], ['L', 'Лидер'], ['Del', 'Убрать'], ['Tab', 'Обзор'], ['Esc', 'Назад']], 44, HGT - 18);
          this.drawOverBtn(c);
        },
        drawTabs(c, s) {
          const qx = TAB.x - 20, ex = TAB.x + N * TAB.pitch + 4;
          ui.keycap(qx, TAB.y + 7, 'Q'); ui.hit(qx - 2, TAB.y, 18, 26, () => this.key(null, 'KeyQ'));
          for (let i = 0; i < N; i++) {
            const x = TAB.x + i * TAB.pitch, w = TAB.pitch - 2, on = i === this.view, empty = !g.squadOf(i).length;
            if (on) { c.fillStyle = 'rgba(242,220,154,0.16)'; c.fillRect(x, TAB.y, w, 26); c.fillStyle = C.brassHi; c.fillRect(x + 3, TAB.y + 25, w - 6, 2); }
            ui.text(String(i + 1), x + w / 2, TAB.y + (on ? 5 : 6), { align: 'center', size: on ? 15 : 13, bold: true, col: on ? C.gold : empty ? C.dim : C.cream });
            if (i === s.squad) ui.diamond(x + 4, TAB.y + 5, 3, C.ok, '#0a1a10');
            ui.hit(x, TAB.y, w, 26, () => this.setView(i));
          }
          ui.keycap(ex, TAB.y + 7, 'E'); ui.hit(ex - 2, TAB.y, 18, 26, () => this.key(null, 'KeyE'));
        },
        drawOverBtn(c) {
          const x = 12, y = HGT - 28, on = this.over;
          c.fillStyle = '#000'; c.fillRect(x, y, 24, 24);
          c.fillStyle = on ? '#b08a44' : '#1c2458'; c.fillRect(x + 1, y + 1, 22, 22);
          c.fillStyle = on ? '#2a1a0c' : C.brassHi;
          for (const [dx, dy] of [[5, 5], [13, 5], [5, 13], [13, 13]]) c.fillRect(x + dx, y + dy, 6, 6);
          ui.hit(x, y, 24, 24, () => this.toggleOver());
        },
        drawOver(c, s) {
          const PW = OV.w, rw = PW - 30;
          c.fillStyle = 'rgba(2,3,14,0.35)'; c.fillRect(PW, 0, W - PW, HGT);
          ui.hit(PW, 0, W - PW, HGT, () => { this.over = false; ui.sfx('cancel'); });
          const gr = c.createLinearGradient(0, 0, PW, 0);
          gr.addColorStop(0, 'rgba(8,10,34,0.97)'); gr.addColorStop(1, 'rgba(16,20,56,0.94)');
          c.fillStyle = gr; c.fillRect(0, 0, PW, HGT);
          c.fillStyle = C.brassDk; c.fillRect(PW - 1, 0, 1, HGT);
          ui.hit(0, 0, PW, HGT, () => {});
          ui.text('Обзор отрядов', PW / 2, 14, { align: 'center', size: 13, bold: true, serif: true, col: C.gold });
          c.fillStyle = 'rgba(242,220,154,0.35)'; c.fillRect(12, 22, 50, 1); c.fillRect(PW - 62, 22, 50, 1);
          const top = ui.listTop(this.osc, this.osel, N, OV.vis);
          for (let i = top; i < Math.min(N, top + OV.vis); i++) {
            const x = 8, y = OV.top + (i - top) * OV.rh, h = OV.rh - 6, on = i === this.osel, mem = g.squadOf(i);
            c.fillStyle = on ? 'rgba(242,220,154,0.16)' : 'rgba(255,255,255,0.04)'; c.fillRect(x, y, rw, h);
            if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, rw - 1, h - 1); }
            ui.text('Отряд ' + (i + 1), x + 8, y + 4, { size: 12, bold: true, col: on ? C.gold : i === this.view ? C.cream : C.sub });
            if (i === s.squad) ui.text('активный', x + rw - 8, y + 5, { align: 'right', size: 10, col: C.ok });
            else if (!mem.length) ui.text('пусто', x + rw - 8, y + 5, { align: 'right', size: 10, col: C.dim });
            for (let j = 0; j < 4; j++) {
              const px = x + 8 + j * 48, py = y + 22, sz = 42, k = mem[j];
              if (!k) { c.strokeStyle = 'rgba(154,166,208,0.35)'; c.setLineDash([3, 2]); c.strokeRect(px + 0.5, py + 0.5, sz - 1, sz - 1); c.setLineDash([]); continue; }
              const kid = g.kitOf(k), kit = H.CHARS[kid];
              ui.portraitCard(c, G.lookOf(kid, g), px, py, sz, { elem: kit.elem, border: G.RARITY[kit.rarity] });
              c.fillStyle = 'rgba(6,8,24,0.82)'; c.fillRect(px, py + sz - 11, sz, 11);
              ui.text('Ур. ' + s.roster[k].lvl, px + sz / 2, py + sz - 11, { align: 'center', size: 9, col: C.cream });
              if (g.isFav(k)) ui.favStar(c, px + 6, py + 6, 5, true);
            }
            ui.hit(x, y, rw, h, () => { this.osel = i; this.setView(i); this.over = false; });
          }
          if (N > OV.vis) ui.scrollBar(PW - 18, OV.top, OV.vis * OV.rh - 6, this.osc, N, OV.vis);
          ui.wheelZone(0, OV.top, PW, OV.vis * OV.rh, d => { this.osc.top += d; });
        },
        key(k, code) {
          const s = g.state;
          if (code === 'Tab') { this.toggleOver(); return; }
          if (this.over) {
            if (k === 'up' || k === 'down') { this.osel = (this.osel + (k === 'up' ? N - 1 : 1)) % N; ui.sfx('select'); }
            if (k === 'ok') { this.setView(this.osel); this.over = false; }
            if (k === 'back') { this.over = false; ui.sfx('cancel'); }
            return;
          }
          if (code === 'KeyQ' || code === 'KeyE') { this.setView((this.view + (code === 'KeyQ' ? N - 1 : 1)) % N); return; }
          if (k === 'left') { this.sel = (this.sel + 3) % 4; ui.sfx('select'); }
          if (k === 'right') { this.sel = (this.sel + 1) % 4; ui.sfx('select'); }
          if (k === 'ok') ui.openCharPick(this.sel, this.view);
          const mine = this.view === s.squad;
          if (code === 'KeyL' && mine && s.party[this.sel]) { const kk = s.party[this.sel]; s.party = [kk, ...s.party.filter(x => x !== kk)]; this.sel = 0; ui.sfx('confirm'); }
          if ((code === 'Delete' || code === 'KeyX') && mine && s.party[this.sel]) { if (s.party.length <= 1) { ui.sfx('deny'); return; } s.party.splice(this.sel, 1); ui.sfx('cancel'); }
          if (k === 'back') ui.pop();
        }
      });
    },

    charGrid(scr, c, list, mem, note) {
      const g = this.game, s = g.state, { COLS, VIS, CW, CH, GAP, X0, Y0 } = CHAR_GRID, rows = Math.ceil(list.length / COLS);
      const top = this.listTop(scr.sc, Math.floor(scr.sel / COLS), rows, VIS);
      for (let i = top * COLS; i < Math.min(list.length, (top + VIS) * COLS); i++) {
        const k = list[i], x = X0 + (i % COLS) * (CW + GAP), y = Y0 + (Math.floor(i / COLS) - top) * (CH + GAP), on = i === scr.sel, kid = g.kitOf(k), kit = H.CHARS[kid];
        c.fillStyle = on ? 'rgba(242,220,154,0.22)' : 'rgba(0,0,0,0.3)'; c.fillRect(x, y, CW, CH);
        if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, CW - 1, CH - 1); }
        this.portraitCard(c, G.lookOf(kid, g), x + 6, y + 8, 48, { elem: kit.elem, border: G.RARITY[kit.rarity] });
        if (g.isFav(k)) this.favStar(c, x + 9, y + 11, 6, true);
        if (this.guideTargetMark && g.guideTarget && k === g.guideTarget()) this.guideTargetMark(c, x + 50, y + 12);
        this.text(this.fitText(this.shortName(k), 11, CW - 64, true), x + 60, y + 8, { size: 11, bold: true, col: on ? C.gold : C.cream });
        this.text('Ур. ' + s.roster[k].lvl, x + 60, y + 24, { size: 10, col: C.sub });
        G.pathIcon(c, kit.path, x + 60, y + 40, 12);
        G.elemIcon(c, kit.elem, x + 84, y + 46, 6);
        const pi = mem.indexOf(k);
        if (pi >= 0) { this.diamond(x + CW - 12, y + CH - 14, 7, C.brassHi, '#1a1208'); this.text(String(pi + 1), x + CW - 12, y + CH - 19, { align: 'center', size: 9, bold: true, col: '#20140c', shadow: false }); }
        this.hit(x, y, CW, CH, () => { if (scr.sel === i) scr.key('ok'); else scr.sel = i; });
      }
      if (rows > VIS) this.scrollBar(X0 + COLS * (CW + GAP) + 2, Y0, VIS * (CH + GAP) - GAP, scr.sc, rows, VIS);
      this.wheelZone(X0, Y0, COLS * (CW + GAP) + 14, VIS * (CH + GAP), d => { scr.sc.top += d; });
      this.favStar(c, X0 + 5, Y0 + VIS * (CH + GAP) + 10, 5, true);
      this.text(note, X0 + 14, Y0 + VIS * (CH + GAP) + 4, { size: 10, col: C.dim });
    },

    charGridKey(scr, k, n) {
      const COLS = CHAR_GRID.COLS;
      if (k === 'left') { scr.sel = (scr.sel + n - 1) % n; this.sfx('select'); }
      if (k === 'right') { scr.sel = (scr.sel + 1) % n; this.sfx('select'); }
      if (k === 'up') { scr.sel = Math.max(0, scr.sel - COLS); this.sfx('select'); }
      if (k === 'down') { scr.sel = Math.min(n - 1, scr.sel + COLS); this.sfx('select'); }
    },

    openCharList(chars) {
      const ui = this, g = this.game;
      this.push({
        sel: Math.max(0, ui.rosterKeys().indexOf(chars.k)), sc: { top: 0 },
        draw(c) {
          const list = ui.rosterKeys();
          ui.win(30, 46, 580, 404, { title: 'Все персонажи · ' + list.length });
          ui.closeBtn(584, 34, () => this.key('back'));
          ui.charGrid(this, c, list, g.state.party, 'избранные идут сразу после отряда · отметить или снять: клавиша F');
          ui.hints([['←↑↓→', 'Выбор'], ['Enter', 'Открыть'], ['F', 'Избранное'], ['Esc', 'Назад']], W / 2, 426, { align: 'center' });
        },
        key(k, code) {
          const list = ui.rosterKeys();
          ui.charGridKey(this, k, list.length);
          if (code === 'KeyF') {
            const pick = list[this.sel], on = g.toggleFav(pick);
            this.sel = Math.max(0, ui.rosterKeys().indexOf(pick));
            ui.sfx(on ? 'confirm' : 'cancel');
            return;
          }
          if (k === 'back') { ui.pop(); return; }
          if (k === 'ok') { chars.k = list[this.sel]; ui.sfx('confirm'); ui.screens.pop(); }
        }
      });
    },

    openCharPick(slot, squad) {
      const ui = this, g = this.game;
      const view = squad == null ? g.state.squad || 0 : squad, cur = g.squadOf(view)[slot];
      this.push({
        sel: Math.max(0, ui.rosterKeys().indexOf(cur)), sc: { top: 0 },
        draw(c) {
          ui.win(30, 46, 580, 404, { title: 'Выбор персонажа — отряд ' + (view + 1) + ', место ' + (slot + 1) });
          ui.charGrid(this, c, ui.rosterKeys(), g.squadOf(view), 'избранные идут сразу после отряда · отметить: «Персонажи», клавиша F');
          ui.hints([['←↑↓→', 'Выбор'], ['Enter', 'Поставить'], ['Esc', 'Назад']], W / 2, 426, { align: 'center' });
        },
        key(k) {
          const list = ui.rosterKeys(), s = g.state;
          ui.charGridKey(this, k, list.length);
          if (k === 'back') { ui.pop(); return; }
          if (k === 'ok') {
            const pick = list[this.sel];
            if (view !== s.squad) {
              if (!g.startSquad(view, pick)) { ui.sfx('deny'); return; }
              ui.sfx('confirm');
              ui.screens.pop();
              return;
            }
            const party = s.party.slice(), from = party.indexOf(pick);
            if (slot >= party.length) { if (from >= 0) party.splice(from, 1); party.push(pick); }
            else if (from >= 0) { const tmp = party[slot]; party[slot] = pick; party[from] = tmp; }
            else party[slot] = pick;
            g.setParty(party);
            ui.sfx('confirm');
            ui.screens.pop();
          }
        }
      });
    },

    invEntries(tab) {
      const s = this.game.state, id = INV_TABS[tab].id;
      if (id === 'cones') return s.inv.cones.map(cn => ({ kind: 'cone', cn, d: H.CONES[cn.id] }));
      if (id === 'relics') return s.inv.relics.slice().sort((a, b) => b.lvl - a.lvl).map(rel => ({ kind: 'relic', rel }));
      const MAT = ['path', 'foe', 'echo', 'asc', 'tracks', 'shadow', 'syn'], LINES = Object.keys(H.TRACE_PATH_LINES || {}).concat(Object.keys(H.TRACE_FOE_LINES || {}));
      const rank = d => MAT.indexOf(d.mat) * 1000 + Math.max(0, LINES.indexOf(d.line)) * 10 + (d.tier || 0);
      const list = Object.entries(s.inv.items).filter(([iid]) => H.ITEMS[iid].kind === id || (id === 'mat' && H.ITEMS[iid].kind === 'synmat')).map(([iid, n]) => ({ kind: 'item', id: iid, n, d: H.ITEMS[iid] }));
      return id === 'mat' ? list.sort((a, b) => rank(a.d) - rank(b.d)) : list;
    },

    openInventory(tab) {
      const ui = this, g = this.game;
      this.push({
        full: true, tab: tab || 0,
        draw(c) {
          const s = g.state;
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(4,6,20,0.45)'; c.fillRect(0, 0, W, HGT);
          ui.plate(12, 10, 'Инвентарь');
          ui.closeBtn(W - 32, 10, () => ui.pop());
          INV_TABS.forEach((t, i) => {
            const x = 118 + i * 80, on = i === this.tab;
            ui.button(x, 8, 76, 24, t.label, () => { this.tab = i; this.sel = 0; ui.sfx('select'); }, { active: on, size: 10, icon: t.icon });
          });
          const list = ui.invEntries(this.tab), cols = 6, cw = 64, chh = 74, gx = 16, gy = 48;
          ui.win(gx - 6, gy - 8, cols * (cw + 4) + 10, 5 * chh + 12, { alpha: 0.85, corners: false });
          const start = Math.max(0, Math.floor(this.sel / cols) - 3) * cols;
          list.slice(start, start + cols * 5).forEach((e, j) => {
            const i = start + j, x = gx + (j % cols) * (cw + 4), y = gy + Math.floor(j / cols) * chh, on = i === this.sel;
            if (e.kind === 'cone') { G.drawConeCard(c, e.cn.id, x + 10, y + 2, 44, 62, { info: false }); ui.text('S' + (e.cn.sup || 1), x + 52, y + 50, { size: 9, bold: true, align: 'right', col: C.gold }); ui.text('ур.' + g.coneLvlOf(e.cn, Object.values(s.roster).find(r => r.cone === e.cn.uid)).lvl, x + 12, y + 50, { size: 9, bold: true, col: C.cream }); }
            else if (e.kind === 'relic') { G.rarityCell(c, x + 4, y + 4, 56, 56, 4); G.itemIcon(c, 'relic:' + e.rel.slot, x + 12, y + 10, 40, e.rel.set); G.slotBadge(c, e.rel.slot, x + 6, y + 44); ui.text('+' + e.rel.lvl, x + 56, y + 46, { size: 10, bold: true, align: 'right', col: C.gold }); }
            else { G.rarityCell(c, x + 4, y + 4, 56, 56, e.d.rar || 2); G.itemIcon(c, e.id, x + 12, y + 8, 40); ui.text('×' + e.n, x + 57, y + 45, { size: 10, bold: true, align: 'right' }); }
            if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(x + 2, y + 1, cw - 4, chh - 8); c.lineWidth = 1; }
            ui.hit(x, y, cw, chh - 6, () => { if (this.sel === i) this.key('ok'); else this.sel = i; });
          });
          if (!list.length) ui.text('Здесь пока пусто.', gx + 200, gy + 150, { align: 'center', col: C.dim });
          const px = 440, py = 40, pw = 192;
          ui.win(px, py, pw, 386, { alpha: 0.9 });
          const e = list[this.sel];
          if (e) this.detail(c, e, px, py, pw);
          const fy = HGT - 44;
          let mx = 16;
          mx += ui.money(mx, fy, 'jade', s.jade) + 14;
          mx += ui.money(mx, fy, 'credits', s.credits) + 14;
          mx += ui.powerChip(mx, fy) + 14;
          ui.money(mx, fy, 'tp', s.tp + '/' + T.tpMax);
          ui.hints([['Q/E', 'Раздел'], ['←↑↓→', 'Выбор'], ['Enter', 'Использовать']].concat(INV_TABS[this.tab].id === 'relics' ? [['X', 'Расщепить'], ['R', 'Лишнее']] : INV_TABS[this.tab].id === 'cones' ? [['U', 'Улучшить'], ['V', 'Подробнее']] : []), 16, HGT - 18);
        },
        detail(c, e, px, py, pw) {
          const s = g.state;
          if (e.kind === 'item') {
            const d = e.d;
            G.rarityCell(c, px + pw / 2 - 36, py + 16, 72, 72, d.rar || 2);
            G.itemIcon(c, e.id, px + pw / 2 - 32, py + 18, 64);
            ui.wrap(d.name, pw - 44, 13).slice(0, 2).forEach((l, i) => ui.text(l, px + pw / 2, py + 96 + i * 16, { align: 'center', size: 13, bold: true, serif: true, col: C.gold }));
            ui.text('★'.repeat(d.rar || 2), px + pw / 2, py + 132, { align: 'center', size: 12, col: G.RARITY[d.rar || 2] });
            ui.text('В наличии: ' + e.n, px + pw / 2, py + 150, { align: 'center', size: 11, col: C.sub });
            ui.wrap(d.text, pw - 24, 11).forEach((l, i) => ui.text(l, px + 12, py + 176 + i * 15, { size: 11 }));
            if (d.kind === 'mat' || d.kind === 'synmat') ui.wrap('Где взять: ' + ui.traceSource(e.id), pw - 24, 10).slice(0, 4).forEach((l, i) => ui.text(l, px + 12, py + 290 + i * 13, { size: 10, col: C.sub }));
            if (d.mat === 'shadow') ui.button(px + 12, py + 344, pw - 24, 26, 'Активировать Эйдолон', () => ui.useShadowFlow(e.id), { size: 12, icon: 'warp' });
            else if (d.kind === 'mat' || d.kind === 'synmat') ui.button(px + 12, py + 344, pw - 24, 26, 'Синтез', () => ui.openSynth(null, d.kind === 'synmat' ? 0 : 1), { size: 12, icon: 'synth' });
            else if (d.use) ui.button(px + 12, py + 344, pw - 24, 26, 'Использовать', () => ui.useItemFlow(e.id), { size: 12, icon: 'bag' });
            else ui.text(d.note || (d.kind === 'key' ? 'Ключевой предмет сюжета.' : ''), px + 12, py + 350, { size: 10, col: C.dim });
          } else if (e.kind === 'cone') {
            const d = e.d, holder = Object.entries(s.roster).find(([, r]) => r.cone === e.cn.uid), st = g.coneStatsOf(e.cn), cl = g.coneLvlOf(e.cn, holder && holder[1]);
            G.drawConeCard(c, e.cn.id, px + pw / 2 - 45, py + 14, 90, 126, { sup: e.cn.sup || 1 });
            ui.hit(px + pw / 2 - 45, py + 14, 90, 126, () => ui.openConeView(e.cn.id, e.cn.uid));
            const nm = ui.wrap(d.name, pw - 24, 12).slice(0, 2);
            nm.forEach((l, i) => ui.text(l, px + pw / 2, py + 146 + i * 15, { align: 'center', size: 12, bold: true, serif: true, col: C.gold }));
            let y = py + 150 + nm.length * 15;
            G.pathIcon(c, d.path, px + 12, y, 12);
            ui.text(H.PATHS[d.path].name + ' · ' + '★'.repeat(d.rarity) + ' · S' + (e.cn.sup || 1), px + 28, y, { size: 11, col: G.RARITY[d.rarity] });
            ui.text('HP +' + st.hp + ' · Ат. +' + st.atk + ' · Защ. +' + st.def, px + 12, y + 17, { size: 10, col: C.cream });
            ui.text('Ур. ' + cl.lvl + '/' + cl.cap + ' · фаза ' + cl.asc, px + 12, y + 30, { size: 9, col: C.dim });
            y += 46;
            if (d.skill) { ui.text(ui.fitText(d.skill, 10, pw - 24, true), px + 12, y, { size: 10, bold: true, col: C.gold }); y += 13; }
            ui.coneLines(e.cn.id, e.cn.sup, pw - 24, 10, Math.max(1, Math.floor((py + 262 - y) / 13))).forEach((l, i) => ui.richText(l, px + 12, y + i * 13, { size: 10, col: C.sub }));
            ui.text(holder ? 'Надет: ' + ui.shortName(holder[0]) : 'Не надет', px + 12, py + 266, { size: 11, col: holder ? C.ok : C.dim });
            ui.button(px + 12, py + 284, pw - 24, 24, 'Улучшить · U', () => ui.openConeUp(e.cn.uid), { size: 11, icon: 'cones', active: true });
            ui.button(px + 12, py + 312, pw - 24, 24, 'Подробнее · V', () => ui.openConeView(e.cn.id, e.cn.uid), { size: 11, icon: 'cones' });
            ui.button(px + 12, py + 344, pw - 24, 26, 'Надеть на…', () => ui.openConeTarget(e.cn.uid), { size: 12, icon: 'chars' });
          } else {
            const rel = e.rel, used = Object.entries(s.roster).find(([, rr]) => Object.values(rr.relics).includes(rel.uid)), set = H.RELIC_SETS[rel.set], slot = H.RELIC_SLOTS.find(x => x.key === rel.slot);
            G.rarityCell(c, px + pw / 2 - 36, py + 16, 72, 72, 4);
            G.itemIcon(c, 'relic:' + rel.slot, px + pw / 2 - 32, py + 20, 64, rel.set);
            const head = ui.wrap(set.pieces ? set.pieces[rel.slot] : set.name, pw - 24, 12).slice(0, 2);
            head.forEach((l, i) => ui.text(l, px + pw / 2, py + 96 + i * 15, { align: 'center', size: 12, bold: true, serif: true, col: C.gold }));
            ui.text((slot.full || slot.name) + ' · +' + rel.lvl, px + pw / 2, py + 130, { align: 'center', size: 11, col: C.sub });
            ui.text(ui.relicLabel(rel).main, px + 12, py + 152, { size: 12, bold: true });
            rel.subs.forEach(([key, v], i) => ui.text('· ' + H.STAT_NAMES[key] + ' ' + ui.fmtStat(key, v), px + 14, py + 172 + i * 15, { size: 11, col: C.sub }));
            if (set.planar) ui.wrap(set.name + ': ' + set.short, pw - 24, 10).slice(0, 3).forEach((l, i) => ui.text(l, px + 12, py + 240 + i * 13, { size: 10, col: '#d8c0ff' }));
            ui.text(used ? 'Надета: ' + ui.shortName(used[0]) : 'Не надета · X: 150 кр., ' + g.salvageValue(rel) + ' Обломков', px + 12, py + 300, { size: 10, col: used ? C.ok : C.dim });
          }
        },
        key(k, code) {
          const list = ui.invEntries(this.tab), n = list.length;
          if (code === 'KeyQ') { this.tab = (this.tab + INV_TABS.length - 1) % INV_TABS.length; this.sel = 0; ui.sfx('select'); return; }
          if (code === 'KeyE') { this.tab = (this.tab + 1) % INV_TABS.length; this.sel = 0; ui.sfx('select'); return; }
          if (k === 'back') { ui.pop(); return; }
          if (!n) return;
          if (k === 'left') { this.sel = (this.sel + n - 1) % n; ui.sfx('select'); }
          if (k === 'right') { this.sel = (this.sel + 1) % n; ui.sfx('select'); }
          if (k === 'up') { this.sel = Math.max(0, this.sel - 6); ui.sfx('select'); }
          if (k === 'down') { this.sel = Math.min(n - 1, this.sel + 6); ui.sfx('select'); }
          const e = list[this.sel];
          if (k === 'ok' && e) {
            if (e.kind === 'item') { if (e.d.mat === 'shadow') ui.useShadowFlow(e.id); else if (e.d.kind === 'mat' || e.d.kind === 'synmat') ui.openSynth(null, e.d.kind === 'synmat' ? 0 : 1); else if (e.d.use) ui.useItemFlow(e.id); else ui.sfx('deny'); }
            else if (e.kind === 'cone') ui.openConeTarget(e.cn.uid);
            else ui.sfx('deny');
          }
          if (code === 'KeyV' && e && e.kind === 'cone') { ui.openConeView(e.cn.id, e.cn.uid); return; }
          if (code === 'KeyU' && e && e.kind === 'cone') { ui.openConeUp(e.cn.uid); return; }
          if (code === 'KeyR' && INV_TABS[this.tab].id === 'relics') { ui.openSalvage(); return; }
          if (code === 'KeyX' && e && e.kind === 'relic') { const v = g.salvageValue(e.rel); if (g.sellRelic(e.rel.uid)) { ui.sfx('chest'); ui.toast('Реликвия расщеплена: +150 кредитов, +' + v + ' Обломков Реликвии.'); this.sel = Math.max(0, this.sel - 1); } else { ui.sfx('deny'); ui.toast('Сначала снимите реликвию с персонажа.'); } }
        }
      });
    },

    coneSegsFor(id, sup) {
      const d = H.CONES[id];
      if (d.tpl) return H.coneSegs(id, sup);
      return (sup || 1) > 1 ? [{ t: d.text }, { t: ' Сила на S' + sup + ': ×' + String(H.coneLegacyMul(sup)).replace('.', ','), hot: true }] : [{ t: d.text }];
    },

    coneLines(id, sup, w, size, max) {
      const lines = this.richWrap(this.coneSegsFor(id, sup), w, size);
      return max ? lines.slice(0, max) : lines;
    },

    openConeView(id, uid, o = {}) {
      const ui = this, g = this.game, LORE_ROW = 13, TX = 222, TW = 384;
      const own = () => (uid ? g.state.inv.cones.find(x => x.uid === uid) : null);
      const best = () => g.state.inv.cones.filter(x => x.id === id).reduce((m, x) => Math.max(m, x.sup || 1), 0);
      const lore = () => { const d = H.CONES[id]; return d.desc ? d.desc.split('\n').flatMap(p => ui.wrap(p, TW - 14, 10)) : []; };
      this.push({
        full: true, debug: !!o.debug, view: (own() && own().sup) || best() || 1, art: !!o.art, sc: { top: 0 },
        draw(c) {
          const d = H.CONES[id], s = g.state, cn = own(), holder = cn ? Object.keys(s.roster).find(k => s.roster[k].cone === cn.uid) : null;
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(4,6,20,0.55)'; c.fillRect(0, 0, W, HGT);
          if (this.art) {
            G.drawConeCard(c, id, W / 2 - 163, 4, 326, 454, { info: false });
            ui.text(d.name, W / 2, 461, { align: 'center', size: 12, bold: true, serif: true, col: C.gold, shadow: true });
            ui.hints([['Tab', 'Сведения'], ['Esc', 'Назад']], W - 12, HGT - 16, { align: 'right' });
            ui.hit(0, 0, W, HGT, () => this.key(null, 'Tab'));
            return;
          }
          ui.plate(12, 10, 'Световой конус');
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          G.drawConeCard(c, id, 24, 48, 166, 230, { sup: this.view });
          ui.hit(24, 48, 166, 230, () => this.key(null, 'Tab'));
          ui.text('Tab: весь арт', 107, 284, { align: 'center', size: 10, col: C.dim });
          if (cn && !o.debug) ui.button(24, 304, 166, 26, 'Улучшить · U', () => ui.openConeUp(cn.uid, { only: true }), { size: 12, icon: 'cones', active: true });
          ui.win(206, 44, 414, 392, { alpha: 0.9 });
          let y = 56;
          ui.wrap(d.name, TW, 16).slice(0, 2).forEach(l => { ui.text(l, TX, y, { size: 16, bold: true, serif: true, col: C.gold }); y += 20; });
          G.pathIcon(c, d.path, TX, y + 2, 12);
          ui.text(H.PATHS[d.path].name + ' · ' + '★'.repeat(d.rarity), TX + 16, y + 2, { size: 11, col: G.RARITY[d.rarity] });
          y += 22;
          ui.text('Наложение', TX, y + 3, { size: 10, col: C.sub });
          const have = cn ? cn.sup || 1 : best();
          for (let i = 1; i <= 5; i++) {
            const bx = TX + 70 + (i - 1) * 36, on = i === this.view;
            c.fillStyle = on ? C.brass : 'rgba(0,0,0,0.45)'; c.fillRect(bx, y, 32, 18);
            c.fillStyle = i === have ? C.gold : 'rgba(242,220,154,0.25)'; c.fillRect(bx, y + 17, 32, 1);
            ui.text('S' + i, bx + 16, y + 3, { size: 10, bold: true, align: 'center', col: on ? '#1a1408' : i <= have ? C.cream : C.dim });
            ui.hit(bx, y, 32, 18, () => { this.view = i; ui.sfx('select'); });
          }
          ui.text(cn ? 'у вас S' + have : have ? 'в наличии S' + have : 'нет в наличии', TX + TW, y + 3, { size: 10, align: 'right', col: have ? C.ok : C.dim });
          y += 28;
          const st = cn ? g.coneStatsOf(cn) : H.coneStatsAt(id, 1, 0), top = H.coneStatsAt(id, H.MAX_LVL, 6), cl = cn ? g.coneLvlOf(cn, holder && s.roster[holder]) : null;
          [['hp', 'HP', st.hp], ['atk', 'Атака', st.atk], ['def', 'Защита', st.def]].forEach(([k, name, v], i) => {
            const sx = TX + i * 100;
            G.statIcon(c, k, sx, y + 1, 12, '#c8d0f0');
            ui.text(name, sx + 16, y, { size: 11, col: C.sub });
            ui.text('+' + v, sx + 92, y, { size: 11, bold: true, align: 'right' });
          });
          ui.text(cl ? 'Ур. ' + cl.lvl + '/' + cl.cap + ' · фаза ' + cl.asc : 'На ур. 1. На ур. 80: HP +' + top.hp + ', атака +' + top.atk + ', защита +' + top.def, TX, y + 16, { size: 9, col: C.dim });
          y += 34;
          c.fillStyle = 'rgba(242,220,154,0.3)'; c.fillRect(TX, y, TW, 1);
          y += 8;
          ui.text(d.skill || 'Эффект', TX, y, { size: 12, bold: true, serif: true, col: C.gold });
          y += 18;
          ui.coneLines(id, this.view, TW, 11, 7).forEach(l => { ui.richText(l, TX, y, { size: 11, col: C.cream }); y += 14; });
          y += 4;
          const kit = holder && H.CHARS[g.kitOf(holder)];
          const where = holder ? 'Надет: ' + ui.shortName(holder) + (kit.path === d.path ? ' · пассивка действует' : ' · другой Путь, пассивка не действует') : cn ? 'Не надет' : '';
          if (where) { ui.text(where, TX, y, { size: 10, col: holder && kit.path === d.path ? C.ok : holder ? C.bad : C.dim }); y += 16; }
          const lines = lore();
          if (lines.length) {
            c.fillStyle = 'rgba(242,220,154,0.3)'; c.fillRect(TX, y, TW, 1);
            ui.text('История', TX, y + 6, { size: 11, bold: true, serif: true, col: C.sub });
            const top = y + 24, vis = Math.max(1, Math.floor((426 - top) / LORE_ROW));
            this.sc.top = Math.max(0, Math.min(Math.round(this.sc.top), lines.length - vis));
            lines.slice(this.sc.top, this.sc.top + vis).forEach((l, i) => ui.text(l, TX, top + i * LORE_ROW, { size: 10, col: '#c8d0f0' }));
            if (lines.length > vis) ui.scrollBar(TX + TW - 10, top - 2, vis * LORE_ROW, this.sc, lines.length, vis);
            ui.wheelZone(TX, top, TW, vis * LORE_ROW, dd => { this.sc.top += dd; });
          }
          ui.hints([['←→', 'Наложение'], ['↑↓', 'История'], ['Tab', 'Арт'], ['Esc', 'Назад']], 16, HGT - 18);
        },
        key(k, code) {
          if (code === 'Tab') { this.art = !this.art; ui.sfx('select'); return; }
          if (code === 'KeyU' && own() && !o.debug && !this.art) { ui.openConeUp(own().uid, { only: true }); return; }
          if (k === 'back') { if (this.art && !o.art) this.art = false; else ui.pop(); return; }
          if (this.art) return;
          if (k === 'left' || k === 'right') { this.view = Math.max(1, Math.min(5, this.view + (k === 'left' ? -1 : 1))); ui.sfx('select'); }
          if (k === 'up' || k === 'down') this.sc.top += k === 'up' ? -1 : 1;
        }
      });
    },

    openConeTarget(uid) {
      const ui = this, g = this.game;
      this.push({
        draw(c) {
          const list = ui.rosterKeys(), cn = g.state.inv.cones.find(x => x.uid === uid), d = cn && H.CONES[cn.id];
          const h = 56 + Math.min(10, list.length) * 26;
          ui.win(W / 2 - 180, 60, 360, h, { title: 'Надеть: ' + (d ? d.name : '') });
          ui.list(W / 2 - 170, 80, 340, list.map(k => { const kit = H.CHARS[g.kitOf(k)]; return { label: ui.shortName(k), right: H.PATHS[kit.path].name + (d && kit.path === d.path ? ' ✓' : ''), rcol: d && kit.path === d.path ? C.ok : C.sub, icon: (cc, x, y) => G.drawPortrait(cc, G.lookOf(g.kitOf(k), g), x, y - 11, 22), iconW: 26 }; }), this.sel, { rowH: 26, max: 10, onClick: i => { if (this.sel === i) this.key('ok'); else this.sel = i; } });
        },
        key(k) {
          const list = ui.rosterKeys();
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'ok') { g.equipCone(list[this.sel], uid); ui.sfx('confirm'); ui.screens.pop(); ui.toast('Конус надет: ' + ui.shortName(list[this.sel])); }
          if (k === 'back') ui.pop();
        }
      });
    },

    useItemFlow(itemId) {
      const ui = this, g = this.game;
      const it = H.ITEMS[itemId];
      if (!it.use) { ui.sfx('deny'); return; }
      if (it.use.healAll || it.use.tp || it.use.nextAtk || it.use.power || it.use.energyAll) { if (g.useItem(itemId)) { ui.sfx(it.use.energyAll ? 'buff' : 'heal'); ui.toast('Использовано: ' + it.name); } else { ui.sfx('deny'); ui.toast(it.use.energyAll ? 'Энергия команды уже полна.' : 'Сейчас это не нужно.'); } return; }
      this.push({
        draw(c) {
          const party = ui.rosterKeys(), n = Math.min(10, party.length);
          ui.win(W / 2 - 190, 60, 380, 60 + n * 30, { title: it.name + ' — кому?' });
          ui.list(W / 2 - 180, 80, 360, party.map(k => { const st = g.charStats(k), r = g.state.roster[k], hp = r.hp == null ? st.hp : r.hp, en = g.energyOf(k); return { label: ui.shortName(k), right: it.use.exp ? 'ур. ' + r.lvl : it.use.energy ? (en.max ? 'энергия ' + en.cur + '/' + en.max : 'копит ноты') : hp + '/' + st.hp, rcol: hp <= 0 ? C.bad : it.use.energy && !en.max ? C.dim : it.use.energy && en.cur >= en.max ? C.gold : C.sub, icon: (cc, x, y) => G.drawPortrait(cc, G.lookOf(g.kitOf(k), g), x, y - 12, 24), iconW: 28 }; }), this.sel, { rowH: 30, max: 10 });
        },
        key(k) {
          const party = ui.rosterKeys();
          if (ui.listNav(this, k, party.length)) return;
          if (k === 'ok' && it.use.exp) { if (g.state.roster[party[this.sel]].guest) { ui.sfx('deny'); return; } const hero = party[this.sel]; ui.screens.pop(); ui.openLevelUp(hero, { pick: itemId }); return; }
          if (k === 'ok') { if (g.useItem(itemId, party[this.sel])) { ui.sfx(it.use.energy ? 'buff' : 'heal'); if (!g.state.inv.items[itemId]) ui.screens.pop(); } else { const en = g.energyOf(party[this.sel]); ui.sfx('deny'); if (it.use.energy) ui.toast(en.cur >= en.max ? 'Энергия уже полна.' : 'Павшему союзнику это не поможет.'); } }
          if (k === 'back') ui.pop();
        }
      });
    },

    bannerTabs(cur, pick, keys = true) {
      const c = this.ctx;
      const g = this.game, step = 34, x0 = W - 140 - BANNER_TABS.length * step;
      if (keys) { this.keycap(x0 - 14, 14, 'Q'); this.keycap(x0 + BANNER_TABS.length * step + 1, 14, 'E'); }
      BANNER_TABS.forEach(([id], i) => {
        const x = x0 + i * step;
        this.button(x, 10, 30, 22, '', () => pick(id), { active: tabOf(cur) === id });
        if (id === 'ev') G.drawPortrait(c, G.lookOf(g.evStar(), g), x + 6, 12, 18);
        else G.itemIcon(c, H.BANNERS[id].pass, x + 6, 12, 18);
      });
    },

    standardBanner(c, bx, by, bw, bh) {
      const B = H.BANNERS.std;
      const pg = c.createLinearGradient(bx, by, bx + bw, by + bh);
      pg.addColorStop(0, '#2a1a4a'); pg.addColorStop(0.6, '#4a2a6a'); pg.addColorStop(1, '#8a4a5a');
      c.fillStyle = pg; c.fillRect(bx, by, bw, bh);
      for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(255,230,160,' + (0.06 + 0.05 * (i % 3)) + ')'; c.beginPath(); c.moveTo(bx + bw * 0.62, by); c.lineTo(bx + i * 60, by + bh); c.lineTo(bx + i * 60 + 24, by + bh); c.fill(); }
      for (let i = 0; i < 90; i++) { c.fillStyle = 'rgba(255,255,255,' + G.hash(i, 2, 2) + ')'; c.fillRect(bx + G.hash(i, 3, 3) * bw, by + G.hash(3, i, 4) * bh, 1, 1); }
      const slots = B.featured.map((id, i) => ({ id, x: bx + 262 + i * 47, back: i % 2 === 1 }));
      c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
      [...slots.filter(o => o.back), ...slots.filter(o => !o.back)].forEach(({ id, x, back }) => {
        const feet = by + bh - (back ? 34 : 12);
        c.fillStyle = back ? 'rgba(255,220,150,0.16)' : 'rgba(255,220,150,0.28)'; c.beginPath(); c.ellipse(x, feet, 30, 6, 0, 0, Math.PI * 2); c.fill();
        G.drawFigure(c, G.lookOf(id, this.game), x, feet, 2);
      });
      c.restore();
      this.text('Путь', bx + 22, by + 24, { size: 14, col: '#f0d8ff' });
      this.text('Первопроходцев', bx + 22, by + 40, { size: 26, bold: true, serif: true, col: '#fff4d8' });
      this.text('Стандартный прыжок · постоянный', bx + 24, by + 74, { size: 11, col: '#e0c8f0' });
      this.wrap('Гарантия 5★ за ' + T.pity5 + ' прыжков, 4★ за ' + T.pity4 + '. Тратит звёздные пропуски.', 210, 11).forEach((l, i) => this.text(l, bx + 24, by + 96 + i * 14, { size: 11, col: C.cream }));
      B.featured.forEach((id, i) => {
        const y = by + 134 + i * 21;
        G.elemIcon(c, H.CHARS[id].elem, bx + 32, y + 6, 7);
        this.text(H.CHARS[id].name, bx + 46, y, { size: 12, bold: true, col: '#ffe6a8' });
        this.text('★★★★★', bx + 232, y + 1, { size: 10, align: 'right', col: G.RARITY[5] });
      });
    },

    ruanBackdrop(c, bx, by, bw, bh, mx, my, t) {
      const bg = c.createLinearGradient(0, by, 0, by + bh);
      bg.addColorStop(0, '#0a1a28'); bg.addColorStop(0.55, '#14384a'); bg.addColorStop(1, '#2a5a64');
      c.fillStyle = bg; c.fillRect(bx, by, bw, bh);
      const mr = 112;
      c.save();
      c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.clip();
      const moon = c.createRadialGradient(mx - 20, my - 30, 10, mx, my, mr);
      moon.addColorStop(0, '#e8f8f2'); moon.addColorStop(0.55, '#9fd2cc'); moon.addColorStop(1, '#3e7c86');
      c.fillStyle = moon; c.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
      c.fillStyle = 'rgba(16,40,48,0.28)';
      for (let x = mx - mr; x < mx + mr; x += 28) c.fillRect(Math.round(x), my - mr, 2, mr * 2);
      for (let y = my - mr + 14; y < my + mr; y += 28) c.fillRect(mx - mr, Math.round(y), mr * 2, 2);
      c.restore();
      c.strokeStyle = '#05101a'; c.lineWidth = 6; c.beginPath(); c.arc(mx, my, mr + 2, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = C.brass; c.lineWidth = 2; c.beginPath(); c.arc(mx, my, mr + 2, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
      const branch = (pts, w) => { c.strokeStyle = '#2a1a16'; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(pts[0], pts[1]); c.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]); c.stroke(); };
      branch([bx + 244, by + 8, bx + 302, by + 40, bx + 342, by + 30, bx + 402, by + 62], 6);
      branch([bx + 312, by + 36, bx + 332, by + 70, bx + 320, by + 96, bx + 334, by + 124], 3);
      branch([bx + 382, by + 52, bx + 412, by + 40, bx + 452, by + 46, bx + 482, by + 28], 3);
      c.lineWidth = 1; c.lineCap = 'butt';
      const blossom = (x, y, r, col) => {
        for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4 - 0.3; c.fillStyle = col; c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#f0c040'; c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
      };
      [[bx + 282, by + 30, 4, '#fbf6ee'], [bx + 334, by + 38, 5, '#f6d4de'], [bx + 386, by + 58, 4, '#fbf6ee'], [bx + 326, by + 82, 4, '#f6d4de'], [bx + 338, by + 118, 3, '#fbf6ee'], [bx + 434, by + 42, 4, '#fbf6ee'], [bx + 476, by + 30, 3, '#f6d4de']].forEach(b => blossom(...b));
      for (let i = 0; i < 14; i++) {
        const px = bx + 262 + G.hash(i, 11, 3) * 270 + Math.sin(t * 0.8 + i) * 8, py = by + ((G.hash(i, 12, 4) * bh + t * (10 + G.hash(i, 13, 5) * 12)) % bh);
        c.fillStyle = i % 3 ? 'rgba(251,246,238,0.85)' : 'rgba(246,196,212,0.85)'; c.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
    },

    seeleBackdrop(c, bx, by, bw, bh, mx, my, t) {
      const bg = c.createLinearGradient(0, by, 0, by + bh);
      bg.addColorStop(0, '#0c0618'); bg.addColorStop(0.55, '#2a1240'); bg.addColorStop(1, '#5a2050');
      c.fillStyle = bg; c.fillRect(bx, by, bw, bh);
      const glow = c.createRadialGradient(mx, my, 8, mx, my, 150);
      glow.addColorStop(0, 'rgba(200,150,255,0.42)'); glow.addColorStop(1, 'rgba(200,150,255,0)');
      c.fillStyle = glow; c.fillRect(mx - 150, my - 150, 300, 300);
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(120,70,200,0.55)'; c.lineWidth = 12; c.beginPath(); c.arc(mx, my, 104, -2.7, -0.35); c.stroke();
      c.strokeStyle = '#c8a8ff'; c.lineWidth = 4; c.beginPath(); c.arc(mx, my, 104, -2.7, -0.35); c.stroke();
      c.strokeStyle = '#fbf2ff'; c.lineWidth = 1.5; c.beginPath(); c.arc(mx, my, 102, -2.5, -0.5); c.stroke();
      c.lineWidth = 1; c.lineCap = 'butt';
      const ground = by + bh - 40;
      [[0, 46, 70], [40, 30, 96], [66, 54, 58], [112, 26, 120], [134, 60, 76], [186, 34, 104], [214, 48, 64], [256, 40, 90]].forEach(([dx, w, h], i) => {
        const x = bx + 252 + dx + (i > 3 ? 120 : 0), top = ground + 40 - h;
        c.fillStyle = '#140a22'; c.fillRect(x, top, w, h);
        c.fillStyle = '#1e1030'; c.fillRect(x + w - 6, top, 6, h);
        for (let k = 0; k < 6; k++) if (G.hash(i, k, 7) > 0.55) { c.fillStyle = G.hash(k, i, 9) > 0.5 ? '#e8a040' : '#c070e0'; c.fillRect(x + 4 + Math.floor(G.hash(i, k, 8) * (w - 10)), top + 6 + k * 9, 3, 2); }
      });
      c.fillStyle = '#100818'; c.fillRect(bx + 240, ground + 36, bw - 240, 4);
      c.strokeStyle = '#3a2050'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(bx + 244, by + 210); c.lineTo(bx + 300, by + 210); c.lineTo(bx + 300, by + 150); c.lineTo(bx + 360, by + 150); c.stroke();
      c.beginPath(); c.moveTo(bx + 600, by + 196); c.lineTo(bx + 540, by + 196); c.lineTo(bx + 540, by + 236); c.stroke();
      c.lineWidth = 1;
      const fly = (x, y, s, ph, col) => {
        const f = 0.35 + 0.65 * Math.abs(Math.sin(t * 5 + ph)), w = 5 * s * f, h = 4 * s;
        c.fillStyle = col;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - w, y - h); c.lineTo(x - w * 0.8, y + h * 0.4); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y - h); c.lineTo(x + w * 0.8, y + h * 0.4); c.closePath(); c.fill();
        c.fillStyle = '#fbf2ff'; c.fillRect(Math.round(x), Math.round(y - 1), 1, 2);
      };
      for (let i = 0; i < 12; i++) {
        const x = bx + 262 + G.hash(i, 21, 3) * 270 + Math.sin(t * 0.7 + i * 1.7) * 14, y = by + 20 + ((G.hash(i, 22, 4) * (bh - 60) - t * (6 + G.hash(i, 23, 5) * 8)) % (bh - 60) + bh - 60) % (bh - 60);
        fly(x, y, 0.8 + G.hash(i, 24, 6) * 0.9, i, i % 3 ? 'rgba(200,160,255,0.85)' : 'rgba(255,170,220,0.85)');
      }
      for (let i = 0; i < 18; i++) {
        const px = bx + 250 + G.hash(i, 31, 3) * 290, py = by + ((G.hash(i, 32, 4) * bh + t * (8 + G.hash(i, 33, 5) * 10)) % bh);
        c.fillStyle = i % 2 ? 'rgba(232,210,255,0.8)' : 'rgba(160,110,240,0.8)'; c.fillRect(Math.round(px), Math.round(py), 1, 2);
      }
    },

    kafkaBackdrop(c, bx, by, bw, bh, mx, my, t) {
      const bg = c.createLinearGradient(0, by, 0, by + bh);
      bg.addColorStop(0, '#12040e'); bg.addColorStop(0.6, '#36102a'); bg.addColorStop(1, '#5a1a36');
      c.fillStyle = bg; c.fillRect(bx, by, bw, bh);
      const spot = c.createRadialGradient(mx, by + bh - 16, 6, mx, by + bh - 16, 150);
      spot.addColorStop(0, 'rgba(255,214,236,0.38)'); spot.addColorStop(1, 'rgba(255,214,236,0)');
      c.fillStyle = spot; c.fillRect(mx - 160, by, 320, bh);
      c.fillStyle = 'rgba(255,220,240,0.07)';
      c.beginPath(); c.moveTo(mx - 18, by); c.lineTo(mx + 18, by); c.lineTo(mx + 96, by + bh); c.lineTo(mx - 96, by + bh); c.fill();
      const drape = (x0, dir) => {
        for (let i = 0; i < 6; i++) {
          const x = x0 + dir * i * 11, sway = Math.sin(t * 0.7 + i) * 2;
          c.fillStyle = i % 2 ? '#5a0e22' : '#7a1630';
          c.beginPath(); c.moveTo(x, by); c.lineTo(x + dir * 12, by); c.lineTo(x + dir * (12 + 6 * (5 - i)) + sway, by + bh); c.lineTo(x + dir * (6 * (5 - i)) + sway, by + bh); c.fill();
        }
        c.fillStyle = '#d8b050'; c.fillRect(Math.min(x0, x0 + dir * 70), by + 128, 70, 3);
      };
      drape(bx + 250, 1); drape(bx + bw - 6, -1);
      c.fillStyle = '#3a0818'; c.fillRect(bx + 244, by, bw - 244, 14);
      for (let i = 0; i < 18; i++) { c.fillStyle = i % 2 ? '#7a1630' : '#9a2040'; c.beginPath(); c.arc(bx + 252 + i * 20, by + 14, 10, 0, Math.PI); c.fill(); }
      c.strokeStyle = 'rgba(240,220,255,0.35)'; c.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const x0 = bx + 300 + i * 56, sw = Math.sin(t * 1.3 + i * 1.7) * 6;
        c.beginPath(); c.moveTo(x0, by + 14); c.quadraticCurveTo(x0 + sw, by + 60, mx + (i - 2) * 16, by + 96 + Math.abs(i - 2) * 10); c.stroke();
      }
      c.fillStyle = '#1a0610'; c.fillRect(bx + 244, by + bh - 18, bw - 244, 18);
      c.fillStyle = '#d8b050'; c.fillRect(bx + 244, by + bh - 18, bw - 244, 2);
      for (let i = 0; i < 9; i++) { const lx = bx + 270 + i * 38; c.fillStyle = 'rgba(255,224,160,' + (0.5 + 0.3 * Math.sin(t * 3 + i)).toFixed(2) + ')'; c.fillRect(lx, by + bh - 14, 6, 3); }
      const note = (x, y, s, a) => {
        c.fillStyle = 'rgba(255,190,230,' + a.toFixed(2) + ')';
        c.beginPath(); c.ellipse(x, y, 3 * s, 2.2 * s, -0.4, 0, Math.PI * 2); c.fill();
        c.fillRect(Math.round(x + 2 * s), Math.round(y - 12 * s), 1, Math.round(12 * s));
        c.fillRect(Math.round(x + 2 * s), Math.round(y - 12 * s), Math.round(5 * s), 1);
      };
      for (let i = 0; i < 9; i++) {
        const ph = (t * 0.12 + G.hash(i, 41, 3)) % 1, x = bx + 268 + G.hash(i, 42, 4) * 300 + Math.sin(t + i) * 8, y = by + bh - 30 - ph * (bh - 40);
        note(x, y, 0.8 + G.hash(i, 43, 5) * 0.6, 0.75 * Math.sin(ph * Math.PI));
      }
      for (let i = 0; i < 3; i++) {
        if ((t * 0.9 + i * 0.37) % 2.2 > 0.14) continue;
        let x = bx + 300 + G.hash(Math.floor(t * 3), i, 9) * 260, y = by + 20;
        c.strokeStyle = 'rgba(220,160,255,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y);
        for (let k = 0; k < 6; k++) { x += (G.hash(k, i, Math.floor(t * 7)) - 0.5) * 30; y += 20; c.lineTo(x, y); }
        c.stroke(); c.lineWidth = 1;
      }
    },

    wolfBackdrop(c, bx, by, bw, bh, mx, my, t) {
      const bg = c.createLinearGradient(0, by, 0, by + bh);
      bg.addColorStop(0, '#04061a'); bg.addColorStop(0.55, '#0c1640'); bg.addColorStop(1, '#1a1048');
      c.fillStyle = bg; c.fillRect(bx, by, bw, bh);
      const hy = by + 170, vx = mx;
      c.strokeStyle = 'rgba(120,150,255,0.35)';
      for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(vx + i * 6, hy); c.lineTo(vx + i * 60, by + bh); c.stroke(); }
      for (let i = 0; i < 7; i++) { const k = ((i + (t * 0.6) % 1) / 7), y = hy + (by + bh - hy) * k * k; c.strokeStyle = 'rgba(140,170,255,' + (0.15 + 0.4 * k).toFixed(2) + ')'; c.beginPath(); c.moveTo(bx + 244, Math.round(y) + 0.5); c.lineTo(bx + bw, Math.round(y) + 0.5); c.stroke(); }
      const ring = c.createRadialGradient(mx, my, 20, mx, my, 120);
      ring.addColorStop(0, 'rgba(120,110,255,0.3)'); ring.addColorStop(1, 'rgba(120,110,255,0)');
      c.fillStyle = ring; c.fillRect(mx - 120, my - 120, 240, 240);
      c.lineWidth = 3;
      for (let i = 0; i < 12; i++) { const a0 = t * 1.6 + i * Math.PI / 6; c.strokeStyle = 'rgba(150,140,255,' + (0.2 + 0.06 * i).toFixed(2) + ')'; c.beginPath(); c.arc(mx, my - 10, 98, a0, a0 + 0.3); c.stroke(); }
      c.lineWidth = 1;
      const win = (x, y, w, h, title, k) => {
        c.fillStyle = 'rgba(10,16,48,0.82)'; c.fillRect(x, y, w, h);
        c.strokeStyle = 'rgba(140,170,255,0.8)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        c.fillStyle = 'rgba(122,106,240,0.85)'; c.fillRect(x + 1, y + 1, w - 2, 8);
        c.fillStyle = '#e8ecff'; c.font = 'bold 7px Tahoma, Arial, sans-serif'; c.textBaseline = 'top'; c.textAlign = 'left'; c.fillText(title, x + 3, y + 1);
        for (let r = 0; r < Math.floor((h - 12) / 6); r++) { c.fillStyle = 'rgba(160,200,255,' + (0.3 + 0.4 * G.hash(r, k, 5)).toFixed(2) + ')'; c.fillRect(x + 4, y + 12 + r * 6, Math.round((w - 10) * (0.3 + 0.7 * G.hash(r, k, Math.floor(t * 2)))), 2); }
      };
      win(bx + 258, by + 22 + Math.round(Math.sin(t * 0.8) * 3), 70, 46, 'ИЗМЕНИТЬ?', 1);
      win(bx + 488, by + 150 + Math.round(Math.sin(t * 0.7 + 2) * 3), 62, 40, 'БАН', 2);
      win(bx + 270, by + 168 + Math.round(Math.sin(t * 0.9 + 4) * 3), 54, 34, 'БАГ.EXE', 3);
      for (let i = 0; i < 14; i++) {
        const gx = bx + 250 + Math.floor(G.hash(i, Math.floor(t * 4), 7) * 330), gy = by + Math.floor(G.hash(Math.floor(t * 4), i, 8) * (bh - 20));
        if (G.hash(i, Math.floor(t * 4), 9) > 0.55) continue;
        c.fillStyle = i % 3 ? 'rgba(122,106,240,0.6)' : 'rgba(80,220,255,0.6)'; c.fillRect(gx, gy, 6 + Math.floor(G.hash(i, 3, 2) * 30), 2);
      }
      for (let i = 0; i < 24; i++) { const px = bx + 250 + G.hash(i, 51, 3) * 340, py = by + ((G.hash(i, 52, 4) * bh + t * (14 + G.hash(i, 53, 5) * 20)) % bh); c.fillStyle = i % 2 ? 'rgba(160,200,255,0.8)' : 'rgba(200,170,255,0.7)'; c.fillRect(Math.round(px), Math.round(py), 1, 3); }
    },

    bladeBackdrop(c, bx, by, bw, bh, mx, my, t) {
      const bg = c.createLinearGradient(0, by, 0, by + bh);
      bg.addColorStop(0, '#0a0408'); bg.addColorStop(0.6, '#2a0a10'); bg.addColorStop(1, '#4a1414');
      c.fillStyle = bg; c.fillRect(bx, by, bw, bh);
      const moon = c.createRadialGradient(mx + 30, my - 34, 10, mx + 30, my - 34, 130);
      moon.addColorStop(0, 'rgba(255,80,60,0.55)'); moon.addColorStop(1, 'rgba(255,80,60,0)');
      c.fillStyle = moon; c.fillRect(mx - 110, my - 170, 280, 280);
      c.fillStyle = '#c8322a'; c.beginPath(); c.arc(mx + 30, my - 34, 62, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e04a36'; c.beginPath(); c.arc(mx + 22, my - 42, 50, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(80,10,14,0.35)'; for (const [dx, dy, r] of [[10, -20, 9], [44, -50, 6], [-6, -60, 5], [36, -8, 4]]) { c.beginPath(); c.arc(mx + 30 + dx - 30, my - 34 + dy + 20, r, 0, Math.PI * 2); c.fill(); }
      const ground = by + bh - 34;
      c.fillStyle = '#140608'; c.beginPath(); c.moveTo(bx + 244, ground + 6); for (let x = 0; x <= bw - 244; x += 24) c.lineTo(bx + 244 + x, ground - 4 + Math.round(G.hash(x, 7, 3) * 10)); c.lineTo(bx + bw, by + bh); c.lineTo(bx + 244, by + bh); c.fill();
      for (let i = 0; i < 13; i++) {
        const x = bx + 262 + i * 26 + Math.round(G.hash(i, 1, 61) * 10), h = 34 + Math.round(G.hash(i, 2, 61) * 40), tilt = (G.hash(i, 3, 61) - 0.5) * 0.5, base = ground + 4 + Math.round(G.hash(i, 4, 61) * 10);
        c.save(); c.translate(x, base); c.rotate(tilt);
        c.fillStyle = '#4a4650'; c.fillRect(-2, -h, 4, h); c.fillStyle = '#8a8690'; c.fillRect(-2, -h, 1, h);
        c.fillStyle = '#1a1418'; c.fillRect(-7, -h - 3, 14, 3); c.fillStyle = '#2a2026'; c.fillRect(-2, -h - 14, 4, 11);
        if (i % 3 === 1) { c.fillStyle = '#c8302a'; c.fillRect(-1, -h - 10, 2, 14 + Math.round(Math.sin(t * 2 + i) * 2)); }
        c.restore();
      }
      for (let i = 0; i < 26; i++) {
        const ph = (t * (0.05 + G.hash(i, 71, 2) * 0.05) + G.hash(i, 72, 3)) % 1;
        const px = bx + 250 + ((G.hash(i, 73, 4) * 340 - ph * 120) % 340 + 340) % 340, py = by + ph * bh;
        c.fillStyle = i % 3 ? 'rgba(255,120,90,0.75)' : 'rgba(255,220,200,0.6)'; c.fillRect(Math.round(px), Math.round(py), 2, 1);
      }
    },

    eventBackdrop(id, c, bx, by, bw, bh, mx, my, t) {
      const own = H.FivesScenes && H.FivesScenes.BACKDROPS[id];
      if (own) { own(c, bx, by, bw, bh, mx, my, t, this); return; }
      const fn = { seele: 'seeleBackdrop', kafka: 'kafkaBackdrop', silverwolf: 'wolfBackdrop', blade: 'bladeBackdrop' }[id] || 'ruanBackdrop';
      this[fn](c, bx, by, bw, bh, mx, my, t);
    },

    eventBanner(c, bx, by, bw, bh, id, pick, chan) {
      const S = H.BANNERS.ev.stars[id], star = H.CHARS[id], P = EV_STYLE[id] || EV_STYLE.ruanmei, t = this.t;
      const mx = bx + 420, my = by + 118, feet = by + bh - 10;
      this.eventBackdrop(id, c, bx, by, bw, bh, mx, my, t);
      c.fillStyle = P.glow; c.beginPath(); c.ellipse(mx, feet, 70, 10, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
      G.drawFigure(c, G.lookOf(id, this.game), mx, feet, 3);
      c.restore();
      if (chan) this.chanToggle(bx + 22, by + 12, 'ev', chan);
      this.text(S.title[0], bx + 22, by + 42, { size: 26, bold: true, serif: true, col: P.title });
      this.text(S.title[1], bx + 22, by + 72, { size: 22, bold: true, serif: true, col: P.title });
      G.elemIcon(c, star.elem, bx + 32, by + 118, 7);
      this.text(star.name, bx + 46, by + 111, { size: 14, bold: true, col: '#ffe6a8' });
      this.text('★★★★★', bx + 232, by + 113, { size: 10, align: 'right', col: G.RARITY[5] });
      G.pathIcon(c, star.path, bx + 45, by + 129, 12, P.sub);
      this.text(H.PATHS[star.path].name + ' · ' + H.ELEMENTS[star.elem].name, bx + 60, by + 129, { size: 10, col: P.sub });
      this.wrap('Любой 5★ из этого прыжка: только ' + star.name + '.', 214, 11).forEach((l, i) => this.text(l, bx + 24, by + 150 + i * 14, { size: 11, col: C.cream }));
      S.four.forEach((fid, i) => {
        const y = by + 190 + i * 26;
        this.portraitCard(c, G.lookOf(fid, this.game), bx + 26, y, 22, { elem: H.CHARS[fid].elem, border: G.RARITY[4] });
        this.text(H.CHARS[fid].name, bx + 56, y + 4, { size: 12, bold: true, col: P.four });
        this.text('★★★★', bx + 232, y + 6, { size: 10, align: 'right', col: G.RARITY[4] });
      });
      this.text('Любой 4★: один из этих троих.', bx + 24, by + 270, { size: 10, col: P.sub });
      this.evPicker(c, bx + bw - 62, by + 12, id, pick);
    },

    coneBanner(c, bx, by, bw, bh, id, pick, chan) {
      const S = H.BANNERS.cone.stars[id], cd = H.CONES[S.cone], ch = H.CHARS[id], P = EV_STYLE[id] || EV_STYLE.ruanmei, t = this.t;
      const mx = bx + 420, my = by + 118;
      this.eventBackdrop(id, c, bx, by, bw, bh, mx, my, t);
      c.fillStyle = 'rgba(4,4,14,0.38)'; c.fillRect(bx, by, bw, bh);
      const glow = c.createRadialGradient(mx, my + 10, 10, mx, my + 10, 150);
      glow.addColorStop(0, 'rgba(255,220,140,0.42)'); glow.addColorStop(1, 'rgba(255,220,140,0)');
      c.fillStyle = glow; c.fillRect(mx - 150, my - 140, 300, 300);
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i - 4.5) * 0.28 + Math.sin(t * 0.4) * 0.03;
        c.fillStyle = 'rgba(255,236,180,' + (0.05 + 0.03 * (i % 3)) + ')';
        c.beginPath(); c.moveTo(mx, my + 20); c.lineTo(mx + Math.cos(a - 0.05) * 240, my + 20 + Math.sin(a - 0.05) * 240); c.lineTo(mx + Math.cos(a + 0.05) * 240, my + 20 + Math.sin(a + 0.05) * 240); c.fill();
      }
      const cw = 150, chh = 212;
      G.drawConeCard(c, S.cone, mx - cw / 2, by + 30 + Math.round(Math.sin(t * 1.3) * 3), cw, chh, { tilt: -0.06 });
      this.hit(mx - cw / 2, by + 30, cw, chh, () => this.openConeView(S.cone));
      if (chan) this.chanToggle(bx + 22, by + 12, 'cone', chan);
      this.text(S.title[0], bx + 22, by + 42, { size: 24, bold: true, serif: true, col: P.title });
      if (S.title[1]) this.text(S.title[1], bx + 22, by + 68, { size: 22, bold: true, serif: true, col: P.title });
      G.pathIcon(c, cd.path, bx + 24, by + 100, 14, '#f2dc9a');
      this.text('Световой конус · ' + H.PATHS[cd.path].name, bx + 44, by + 101, { size: 11, bold: true, col: '#ffe6a8' });
      this.text('★★★★★', bx + 232, by + 102, { size: 10, align: 'right', col: G.RARITY[5] });
      this.portraitCard(c, G.lookOf(id, this.game), bx + 26, by + 120, 22, { elem: ch.elem, border: G.RARITY[5] });
      this.text('Раскрывает силу героя: ' + ch.name, bx + 56, by + 126, { size: 10, col: P.sub });
      this.wrap(cd.text, 214, 10).slice(0, 4).forEach((l, i) => this.text(l, bx + 24, by + 150 + i * 12, { size: 10, col: C.cream }));
      S.four.forEach((pid, i) => {
        const fid = pid.slice(5), y = by + 204 + i * 22;
        G.drawConeCard(c, fid, bx + 30, y, 14, 20, { info: false });
        let name = H.CONES[fid].name;
        while (name.length > 3 && this.measure(name, 11, true) > 144) name = name.slice(0, -2) + '…';
        this.text(name, bx + 52, y + 3, { size: 11, bold: true, col: P.four });
        this.text('★★★★', bx + 232, y + 4, { size: 10, align: 'right', col: G.RARITY[4] });
      });
      this.text('75%: 4★ из этих трёх конусов.', bx + 24, by + 272, { size: 10, col: P.sub });
      this.evPicker(c, bx + bw - 62, by + 12, id, pick, 'cone');
    },

    chanToggle(x, y, cur, chan) {
      const c = this.ctx;
      EV_CHANNELS.forEach(([id, label], i) => {
        const bx = x + i * 62, on = cur === id;
        this.button(bx, y, 60, 18, label, () => chan(id), { active: on, size: 10 });
      });
      this.keycap(x + 128, y + 3, 'Tab');
      c.fillStyle = C.brass; c.fillRect(x, y + 20, 122, 1);
    },

    crt(c, x, y, w, h, o, screen) {
      const r = Math.max(4, Math.round(w * 0.08));
      c.fillStyle = '#050508'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
      const body = c.createLinearGradient(x, y, x, y + h);
      body.addColorStop(0, o.wood ? '#8a6a44' : '#4a4c56'); body.addColorStop(1, o.wood ? '#4a3420' : '#24252c');
      c.fillStyle = body; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x, y, w, 1);
      const sx = x + r, sy = y + r, sw = w - r * 2 - (o.knobs ? Math.round(w * 0.18) : 0), sh = h - r * 2 - (o.knobs ? 0 : Math.round(h * 0.08));
      c.fillStyle = '#0a0a0e'; c.fillRect(sx - 2, sy - 2, sw + 4, sh + 4);
      c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip();
      const scr = c.createRadialGradient(sx + sw / 2, sy + sh / 2, 4, sx + sw / 2, sy + sh / 2, Math.max(sw, sh) * 0.7);
      scr.addColorStop(0, o.lit ? '#3a4a5a' : '#1a1e26'); scr.addColorStop(1, '#06080c');
      c.fillStyle = scr; c.fillRect(sx, sy, sw, sh);
      if (screen) screen(sx, sy, sw, sh);
      c.fillStyle = 'rgba(0,0,0,0.22)';
      for (let yy = sy; yy < sy + sh; yy += 2) c.fillRect(sx, yy, sw, 1);
      const sh2 = c.createLinearGradient(sx, sy, sx + sw, sy + sh);
      sh2.addColorStop(0, 'rgba(255,255,255,0.12)'); sh2.addColorStop(0.4, 'rgba(255,255,255,0)'); c.fillStyle = sh2; c.fillRect(sx, sy, sw, sh);
      c.restore();
      if (o.knobs) {
        const kx = sx + sw + Math.round(w * 0.09);
        for (let i = 0; i < 2; i++) { c.fillStyle = '#18181e'; c.beginPath(); c.arc(kx, sy + 8 + i * 14, 4, 0, Math.PI * 2); c.fill(); c.fillStyle = '#8a8c96'; c.fillRect(kx - 1, sy + 5 + i * 14, 2, 3); }
        for (let i = 0; i < 4; i++) { c.fillStyle = '#18181e'; c.fillRect(kx - 5, sy + sh - 20 + i * 4, 10, 2); }
      } else {
        c.fillStyle = o.led || '#40e060'; c.fillRect(x + w - r - 5, y + h - r + 1, 3, 2);
        c.fillStyle = '#18181e'; c.fillRect(x + r, y + h - r + 1, Math.round(w * 0.25), 2);
      }
    },

    rankBadge(x, y, rar, size) {
      const c = this.ctx, s = size || 14;
      c.fillStyle = '#0a0a0e'; c.fillRect(x - 1, y - 1, s + 2, s + 2);
      c.fillStyle = RANK_COL[rar]; c.fillRect(x, y, s, s);
      this.text(RANK[rar], x + s / 2, y + Math.round(s * 0.12), { align: 'center', size: Math.round(s * 0.8), bold: true, serif: true, col: '#0a0a12', shadow: false });
    },

    signalBanner(c, bx, by, bw, bh, ban, star, pick, chan) {
      const g = this.game, t = this.t, amp = ban === 'amp', B = H.BANNERS[ban], S = B.stars[star], ch = H.CHARS[star];
      const bg = c.createLinearGradient(0, by, 0, by + bh);
      bg.addColorStop(0, '#16171e'); bg.addColorStop(0.7, '#22232c'); bg.addColorStop(1, '#0c0c12');
      c.fillStyle = bg; c.fillRect(bx, by, bw, bh);
      c.fillStyle = 'rgba(255,255,255,0.03)';
      for (let x = bx; x < bx + bw; x += 24) c.fillRect(x, by, 1, bh);
      c.save(); c.translate(bx + 30, by + bh - 6); c.rotate(-Math.PI / 2);
      this.text('ПОИСК', 0, -26, { size: 40, bold: true, serif: true, col: 'rgba(255,255,255,0.06)', shadow: false });
      c.restore();
      SIG_CHANNELS.forEach(([id, label, sub], i) => {
        const y = by + 20 + i * 54, on = id === ban;
        c.fillStyle = on ? '#e8e040' : 'rgba(6,6,12,0.75)'; c.fillRect(bx + 44, y, 108, 44);
        c.strokeStyle = on ? '#1a1a08' : 'rgba(232,224,64,0.4)'; c.strokeRect(bx + 44.5, y + 0.5, 107, 43);
        G.itemIcon(c, 'tape', bx + 48, y + 6, 16);
        this.wrap(label, 80, 10).slice(0, 2).forEach((l, k) => this.text(l, bx + 68, y + 4 + k * 12, { size: 10, bold: true, col: on ? '#14140a' : C.cream, shadow: !on }));
        this.text(sub, bx + 50, y + 29, { size: 9, col: on ? '#3a3a14' : C.sub, shadow: !on });
        this.hit(bx + 44, y, 108, 44, () => chan(id));
      });
      this.text('Tab: канал', bx + 98, by + 132, { size: 9, align: 'center', col: C.dim });
      const ft = (fx, fy, fw, fh) => {
        if (amp) G.drawConeCard(c, S.cone, fx + fw / 2 - 40, fy + 6, 80, fh - 12, { info: false });
        else { c.fillStyle = 'rgba(120,200,255,0.12)'; c.fillRect(fx, fy, fw, fh); G.drawFigure(c, G.lookOf(star, g), fx + fw / 2, fy + G.FIG_FOOT * 2 + 2, 2); }
        c.fillStyle = 'rgba(160,220,255,' + (0.04 + 0.03 * Math.sin(t * 9)).toFixed(3) + ')'; c.fillRect(fx, fy + ((t * 40) % fh), fw, 6);
      };
      this.crt(c, bx + 236, by + 14, 150, 170, { lit: true, knobs: true }, ft);
      this.crt(c, bx + 168, by + 40, 66, 56, { wood: true }, (fx, fy, fw, fh) => {
        for (let i = 0; i < 160; i++) { c.fillStyle = 'rgba(255,255,255,' + G.hash(i, Math.floor(t * 12), 3).toFixed(2) + ')'; c.fillRect(fx + G.hash(i, 1, Math.floor(t * 12)) * fw, fy + G.hash(Math.floor(t * 12), i, 2) * fh, 1, 1); }
      });
      this.crt(c, bx + 168, by + 100, 66, 56, {}, (fx, fy, fw, fh) => {
        c.fillStyle = '#e8e040'; c.fillRect(fx + 4, fy + fh / 2 - 9, fw - 8, 18);
        this.text('СИГНАЛ', fx + fw / 2, fy + fh / 2 - 7, { size: 11, bold: true, serif: true, align: 'center', col: '#14140a', shadow: false });
      });
      S.four.forEach((fid, i) => {
        const x = bx + 166 + i * 76, y = by + 190;
        this.crt(c, x, y, 72, 62, { wood: i === 1, led: RANK_COL[4] }, (fx, fy, fw, fh) => {
          c.fillStyle = 'rgba(160,80,240,0.25)'; c.fillRect(fx, fy, fw, fh);
          if (fid.startsWith('cone:')) G.drawConeCard(c, fid.slice(5), fx + fw / 2 - 14, fy + 3, 28, fh - 6, { info: false });
          else G.drawPortrait(c, G.lookOf(fid, g), fx + fw / 2 - (fh - 4) / 2, fy + 2, fh - 4);
        });
        this.rankBadge(x + 2, y + 2, 4, 12);
      });
      if (!amp && S.four.every(id => H.CHARS[id] && H.CHARS[id].faction === 'hares')) {
        const px = bx + 166, pw = 3 * 76 - 4, py = by + 257;
        c.fillStyle = 'rgba(6,6,12,0.8)'; c.fillRect(px, py, pw, 14);
        c.strokeStyle = 'rgba(232,224,64,0.5)'; c.strokeRect(px + 0.5, py + 0.5, pw - 1, 13);
        this.text('Агентство «Хитрые зайцы»', px + pw / 2, py + 2, { size: 9, bold: true, align: 'center', col: '#e8e040', shadow: false });
      }
      this.crt(c, bx + 100, by + 196, 34, 56, { led: '#ffb030' }, (fx, fy, fw, fh) => { c.fillStyle = RANK_COL[5]; c.fillRect(fx, fy, fw, fh); this.text('S', fx + fw / 2, fy + fh / 2 - 10, { size: 18, bold: true, serif: true, align: 'center', col: '#1a1004', shadow: false }); });
      const ix = bx + 404, rw = 128;
      const kw = this.measure(B.name, 9, true) + 12;
      c.fillStyle = '#e8e040'; c.fillRect(ix, by + 16, kw, 14);
      this.text(B.name, ix + 6, by + 17, { size: 9, bold: true, col: '#14140a', shadow: false });
      const ts = Math.max(...S.title.map(t => this.measure(t, 20, true, true))) > 128 ? 16 : 20;
      this.text(S.title[0], ix, by + 36, { size: ts, bold: true, serif: true, col: '#fff4d8' });
      this.text(S.title[1], ix, by + 36 + ts + 4, { size: ts, bold: true, serif: true, col: '#fff4d8' });
      this.rankBadge(ix, by + 90, 5, 14);
      this.text(this.fitText(amp ? H.CONES[S.cone].name : ch.fullName || ch.name, 11, rw - 20, true), ix + 20, by + 90, { size: 11, bold: true, col: '#ffd890' });
      G.pathIcon(c, amp ? H.CONES[S.cone].path : ch.path, ix + 2, by + 104, 11, C.sub);
      this.text(this.fitText(amp ? 'Световой конус · ' + H.PATHS[H.CONES[S.cone].path].name : H.PATHS[ch.path].name + ' · ' + H.ELEMENTS[ch.elem].name, 9, rw - 30), ix + 20, by + 104, { size: 9, col: C.sub });
      const rate = Math.round((amp ? T.coneFeatured : T.sigFeatured) * 100);
      const BO = g.bannerOf(ban), rate4 = Math.round((BO.featRate4 != null ? BO.featRate4 : BO.featRate) * 100);
      const rules = [
        'Сигнал S: ' + rate + '% шанс, что это ' + (amp ? '«' + H.CONES[S.cone].name + '»' : ch.name) + '. Промах даёт гарант.',
        'Сигнал A: ' + rate4 + '% шанс, что это избранный ' + (amp ? 'конус' : 'агент') + '. Промах даёт гарант.',
        'Сигнал A или выше: за ' + T.pity4 + ' поисков.',
        'Сигнал S: за ' + (amp ? T.conePity5 : T.pity5) + ' поисков.'
      ];
      let ry = by + 122;
      rules.forEach(r => this.wrap(r, rw, 9).forEach(l => { this.text(l, ix, ry, { size: 9, col: C.cream }); ry += 11; }));
      this.text('Каналы делят гарант только внутри себя.', ix, ry + 4, { size: 8, col: C.dim });
      this.evPicker(c, bx + bw - 62, by + 12, star, pick, ban);
    },

    tideGauge(c, x, y, h, ban) {
      const g = this.game, B = g.bannerOf(ban), pity = g.pityOf(ban), max = B.pity5 || T.pity5, f = Math.min(1, pity.five / max), t = this.t;
      this.text('Прилив', x + 11, y - 18, { size: 11, bold: true, serif: true, align: 'center', col: '#bfe8f0' });
      c.fillStyle = '#05080e'; c.fillRect(x - 2, y - 2, 26, h + 4);
      const glass = c.createLinearGradient(x, 0, x + 22, 0);
      glass.addColorStop(0, '#0c1a2a'); glass.addColorStop(0.5, '#16304a'); glass.addColorStop(1, '#0a1420');
      c.fillStyle = glass; c.fillRect(x, y, 22, h);
      const top = y + h - Math.round(h * f), near = max - pity.five <= 10;
      if (f > 0) {
        const wg = c.createLinearGradient(0, top, 0, y + h);
        wg.addColorStop(0, near ? '#ffe08a' : '#7ae8e0'); wg.addColorStop(1, near ? '#c88a20' : '#1a6a8a');
        c.fillStyle = wg;
        c.beginPath(); c.moveTo(x, y + h);
        for (let i = 0; i <= 22; i += 2) c.lineTo(x + i, top + Math.sin(t * 3 + i * 0.5) * 1.6);
        c.lineTo(x + 22, y + h); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(x + 3, y + 2, 3, h - 4);
      for (let k = 10; k < max; k += 10) { const ty = y + h - Math.round(h * k / max); c.fillStyle = C.brass; c.fillRect(x + 16, ty, 6, 1); this.text(String(k), x - 4, ty - 5, { size: 8, align: 'right', col: C.dim }); }
      c.strokeStyle = C.brass; c.strokeRect(x - 0.5, y - 0.5, 23, h + 1);
      for (let i = 0; i < T.pity4; i++) { const on = i < pity.four; c.fillStyle = on ? G.RARITY[4] : '#141a2c'; c.fillRect(x + 28, y + h - 6 - i * 9, 5, 6); }
      this.text('4★', x + 30, y + h + 4, { size: 8, align: 'center', col: G.RARITY[4] });
      this.text('до 5★', x + 11, y + h + 4, { size: 9, align: 'center', col: C.sub });
      this.text(String(max - pity.five), x + 11, y + h + 15, { size: 16, bold: true, serif: true, align: 'center', col: near ? C.gold : C.cream });
    },

    moonPhase(c, x, y, r, full) {
      const gl = c.createRadialGradient(x, y, r * 0.4, x, y, r * 2.2);
      gl.addColorStop(0, full ? 'rgba(255,236,170,0.4)' : 'rgba(170,200,255,0.18)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gl; c.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
      c.fillStyle = full ? '#fff2c8' : '#c8d4ec'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      if (!full) { c.fillStyle = '#0a1024'; c.beginPath(); c.arc(x + r * 0.55, y - r * 0.1, r * 0.95, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = full ? 'rgba(200,170,110,0.35)' : 'rgba(120,130,160,0.3)';
      for (const [dx, dy, rr] of [[-0.3, -0.2, 0.22], [0.15, 0.3, 0.16], [-0.1, 0.45, 0.1]]) { c.beginPath(); c.arc(x + dx * r, y + dy * r, rr * r, 0, Math.PI * 2); c.fill(); }
    },

    lycoris(c, x, y, r, col, t) {
      c.strokeStyle = col; c.lineWidth = Math.max(1, r * 0.16);
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.5 + Math.sin(t * 1.5 + i) * 0.05;
        c.beginPath(); c.moveTo(x, y);
        c.quadraticCurveTo(x + Math.cos(a - 0.4) * r * 0.8, y + Math.sin(a - 0.4) * r * 0.8, x + Math.cos(a) * r, y + Math.sin(a) * r);
        c.lineTo(x + Math.cos(a + 0.9) * r * 0.85, y + Math.sin(a + 0.9) * r * 0.85);
        c.stroke();
      }
      c.lineWidth = 1; c.strokeStyle = 'rgba(255,190,200,0.8)';
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.42; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35); c.stroke(); }
      c.strokeStyle = '#2a5a2a'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1, y + r * 1.4); c.stroke();
    },

    phroStage(c, sx, by, sw, bh, t) {
      const bg = c.createLinearGradient(0, by, 0, by + bh);
      bg.addColorStop(0, '#16040a'); bg.addColorStop(0.6, '#3a0812'); bg.addColorStop(1, '#12020a');
      c.fillStyle = bg; c.fillRect(sx, by, sw, bh);
      const cx = sx + sw / 2, floor = by + bh - 34;
      for (const s of [-1, 1]) {
        const ex = s < 0 ? sx : sx + sw;
        for (let k = 0; k < 4; k++) {
          const x0 = ex - s * (k * 16), x1 = ex - s * (k * 16 + 22 + Math.sin(t * 0.6 + k) * 2);
          c.fillStyle = k % 2 ? '#7a0e20' : '#9a1428';
          c.beginPath(); c.moveTo(x0, by); c.lineTo(x1, by); c.lineTo(x1 - s * 10, by + bh); c.lineTo(x0, by + bh); c.fill();
        }
        c.fillStyle = '#d8b050'; c.fillRect(s < 0 ? sx : sx + sw - 70, by + 2, 70, 3);
      }
      const spot = c.createLinearGradient(0, by, 0, floor);
      spot.addColorStop(0, 'rgba(255,230,230,0.28)'); spot.addColorStop(1, 'rgba(255,200,210,0.06)');
      c.fillStyle = spot; c.beginPath(); c.moveTo(cx - 14, by); c.lineTo(cx + 14, by); c.lineTo(cx + 74, floor + 10); c.lineTo(cx - 74, floor + 10); c.fill();
      c.fillStyle = '#2a0610'; c.beginPath(); c.ellipse(cx, floor + 8, 110, 20, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#d8b050'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, floor + 8, 110, 20, 0, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
      c.strokeStyle = 'rgba(216,176,80,0.45)';
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(cx, floor + 8); c.lineTo(cx + Math.cos(a) * 100, floor + 8 + Math.sin(a) * 18); c.stroke(); }
      c.beginPath(); c.ellipse(cx, floor + 8, 60, 11, 0, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 9; i++) this.lycoris(c, sx + 26 + i * (sw - 52) / 8 + Math.sin(i * 2.3) * 6, by + bh - 4 - (i % 2) * 6, 7 + (i % 3) * 2, i % 3 ? '#e0203c' : '#ff4a68', t + i);
      for (let i = 0; i < 14; i++) {
        const px = sx + 20 + G.hash(i, 41, 3) * (sw - 40) + Math.sin(t + i) * 8, py = by + ((G.hash(i, 42, 4) * bh + t * (10 + G.hash(i, 43, 5) * 12)) % bh);
        c.fillStyle = i % 2 ? 'rgba(255,60,90,0.85)' : 'rgba(200,20,50,0.85)'; c.fillRect(Math.round(px), Math.round(py), 2, 1);
      }
      return { cx, feet: floor + 8 };
    },

    scarStage(c, sx, by, sw, bh, t) {
      const bg = c.createLinearGradient(0, by, 0, by + bh);
      bg.addColorStop(0, '#05060e'); bg.addColorStop(0.55, '#1a0e16'); bg.addColorStop(1, '#2a1208');
      c.fillStyle = bg; c.fillRect(sx, by, sw, bh);
      for (let i = 0; i < 50; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.5 * G.hash(i, 51, 2)).toFixed(2) + ')'; c.fillRect(sx + G.hash(i, 52, 3) * sw, by + G.hash(i, 53, 4) * bh * 0.5, 1, 1); }
      const cx = sx + sw / 2, ground = by + bh - 30;
      c.fillStyle = '#0c0608';
      for (let i = 0; i < 6; i++) {
        const hx = sx + 10 + i * 56 + (i % 2) * 10, hw = 40 + (i % 3) * 8, hh = 34 + (i % 2) * 14;
        c.beginPath(); c.moveTo(hx, ground); c.lineTo(hx, ground - hh); c.lineTo(hx + hw / 2, ground - hh - 18); c.lineTo(hx + hw, ground - hh); c.lineTo(hx + hw, ground); c.fill();
        if (i % 2) { c.fillStyle = 'rgba(255,150,60,' + (0.5 + 0.3 * Math.sin(t * 7 + i)).toFixed(2) + ')'; c.fillRect(hx + hw / 2 - 3, ground - hh + 10, 6, 6); c.fillStyle = '#0c0608'; }
      }
      c.fillStyle = '#140a08'; c.fillRect(sx, ground, sw, bh - (ground - by));
      for (let x = sx + 4; x < sx + sw; x += 14) { c.fillStyle = '#20100a'; c.fillRect(x, ground - 14, 3, 14); }
      c.fillRect(sx, ground - 11, sw, 2);
      const fx = cx + 78, fy = ground + 4;
      const fl = c.createRadialGradient(fx, fy - 10, 4, fx, fy - 10, 90);
      fl.addColorStop(0, 'rgba(255,140,40,' + (0.4 + 0.1 * Math.sin(t * 9)).toFixed(2) + ')'); fl.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = fl; c.fillRect(fx - 90, fy - 100, 180, 120);
      for (let i = 0; i < 5; i++) {
        const h = 18 + 8 * Math.sin(t * 8 + i * 1.7), w = 7 - Math.abs(i - 2) * 1.6;
        c.fillStyle = i % 2 ? '#ffb040' : '#ff6a1a';
        c.beginPath(); c.moveTo(fx - 10 + i * 5 - w, fy); c.quadraticCurveTo(fx - 10 + i * 5, fy - h * 1.2, fx - 10 + i * 5 + w, fy); c.fill();
      }
      c.fillStyle = '#3a2418'; c.fillRect(fx - 16, fy - 2, 32, 4);
      for (let i = 0; i < 12; i++) { const k = (t * 0.6 + G.hash(i, 61, 3)) % 1; c.fillStyle = 'rgba(255,' + (140 + i * 8) + ',60,' + (1 - k).toFixed(2) + ')'; c.fillRect(Math.round(fx - 12 + G.hash(i, 62, 4) * 24 + Math.sin(t * 2 + i) * 6), Math.round(fy - 10 - k * 90), 2, 2); }
      c.save(); c.beginPath(); c.ellipse(cx, ground - 90, 96, 116, 0, 0, Math.PI * 2); c.clip();
      c.strokeStyle = 'rgba(255,120,60,' + (0.16 + 0.06 * Math.sin(t * 2)).toFixed(2) + ')';
      const hs = 14;
      for (let r = -9; r <= 9; r++) for (let q = -8; q <= 8; q++) {
        const hx = cx + q * hs * 1.5, hy = ground - 90 + r * hs * 1.73 + (q % 2 ? hs * 0.87 : 0);
        c.beginPath(); for (let k = 0; k <= 6; k++) { const a = k * Math.PI / 3; const px = hx + Math.cos(a) * hs, py = hy + Math.sin(a) * hs; if (k) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke();
      }
      c.restore();
      c.strokeStyle = 'rgba(255,140,70,0.4)'; c.beginPath(); c.ellipse(cx, ground - 90, 96, 116, 0, 0, Math.PI * 2); c.stroke();
      return { cx: cx - 20, feet: ground + 6 };
    },

    forgeStage(c, sx, by, sw, bh, t, cone, hot) {
      const bg = c.createLinearGradient(0, by, 0, by + bh);
      bg.addColorStop(0, '#04060e'); bg.addColorStop(0.55, '#0e1a34'); bg.addColorStop(0.56, '#0a1424'); bg.addColorStop(1, '#040810');
      c.fillStyle = bg; c.fillRect(sx, by, sw, bh);
      const hz = by + Math.round(bh * 0.56), cx = sx + sw / 2;
      for (let i = 0; i < 60; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.5 * G.hash(i, 71, 2)).toFixed(2) + ')'; c.fillRect(sx + G.hash(i, 72, 3) * sw, by + G.hash(i, 73, 4) * (hz - by), 1, 1); }
      for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(160,200,255,' + (0.06 + 0.04 * (i % 3)).toFixed(2) + ')'; c.fillRect(sx, hz + 6 + i * 13 + Math.sin(t * 1.4 + i) * 2, sw, 1); }
      const col = hot ? [255, 140, 60] : [255, 70, 110];
      for (let k = 0; k < 3; k++) {
        c.strokeStyle = 'rgba(' + col.join(',') + ',' + (0.35 - k * 0.08).toFixed(2) + ')'; c.lineWidth = 3 - k;
        c.beginPath();
        for (let i = 0; i <= 40; i++) { const u = i / 40, x = sx + 20 + u * (sw - 40), y = by + bh * 0.45 + Math.sin(u * 7 + t * 1.6 + k * 1.2) * (30 + k * 10) * Math.sin(u * Math.PI); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
        c.stroke();
      }
      c.lineWidth = 1;
      const cw = 118, ch = 168, bob = Math.sin(t * 1.3) * 4;
      c.save(); c.translate(cx, by + 30 + ch / 2 + bob); c.rotate(-0.16);
      G.drawConeCard(c, cone, -cw / 2, -ch / 2, cw, ch, { tilt: 0 });
      c.restore();
      c.fillStyle = 'rgba(255,240,200,0.18)'; c.beginPath(); c.ellipse(cx, by + bh - 26, 70, 9, 0, 0, Math.PI * 2); c.fill();
    },

    conveneBanner(c, bx, by, bw, bh, ban, star, pick, chan) {
      const g = this.game, t = this.t, forge = ban === 'forge', B = H.BANNERS[ban], S = B.stars[star], ch = H.CHARS[star], pity = g.pityOf(ban);
      c.fillStyle = '#05070e'; c.fillRect(bx, by, bw, bh);
      const sx = bx + 74, sw = 316;
      c.save(); c.beginPath(); c.rect(sx, by, sw, bh); c.clip();
      if (forge) this.forgeStage(c, sx, by, sw, bh, t, S.cone, star === 'scar');
      else {
        const st = star === 'scar' ? this.scarStage(c, sx, by, sw, bh, t) : this.phroStage(c, sx, by, sw, bh, t);
        G.drawFigure(c, G.lookOf(star, g), st.cx, st.feet, 3);
      }
      this.moonPhase(c, sx + 30, by + 30, 13, !!pity.guar5 || forge);
      this.text(forge ? 'Всегда' : pity.guar5 ? 'Гарант' : '50/50', sx + 30, by + 48, { size: 9, bold: true, align: 'center', col: pity.guar5 || forge ? C.gold : '#c8d4ec' });
      c.restore();
      c.strokeStyle = 'rgba(201,164,92,0.6)'; c.strokeRect(sx + 0.5, by + 0.5, sw - 1, bh - 1);
      this.tideGauge(c, bx + 18, by + 44, 186, ban);
      const ix = bx + 398, rw = 132;
      CONV_CHANNELS.forEach(([id, label], i) => this.button(ix + i * 66, by + 10, 64, 18, label, () => chan(id), { active: id === ban, size: 10 }));
      const kw = Math.min(rw - 28, this.measure(B.name, 9, true) + 12);
      c.fillStyle = '#c8243a'; c.fillRect(ix, by + 34, kw, 14);
      this.text(B.name, ix + 6, by + 35, { size: 9, bold: true, col: '#fff0f0', shadow: false });
      this.keycap(ix + rw - 24, by + 34, 'Tab');
      let ts = 18;
      while (ts > 10 && Math.max(...S.title.map(x => this.measure(x, ts, true, true))) > rw) ts--;
      this.text(S.title[0], ix, by + 54, { size: ts, bold: true, serif: true, col: '#fff0e0' });
      this.text(S.title[1], ix, by + 56 + ts + 2, { size: ts, bold: true, serif: true, col: '#fff0e0' });
      let y = by + 102;
      if (forge) {
        const cd = H.CONES[S.cone];
        G.pathIcon(c, cd.path, ix, y, 12, '#f2dc9a');
        this.text(this.fitText(cd.name, 11, rw - 16, true), ix + 16, y, { size: 11, bold: true, col: '#ffd890' });
        this.text('★★★★★ · ' + H.PATHS[cd.path].name, ix, y + 14, { size: 9, col: G.RARITY[5] });
      } else {
        G.elemIcon(c, ch.elem, ix + 6, y + 6, 6);
        this.text(ch.name, ix + 16, y, { size: 12, bold: true, col: '#ffd890' });
        this.text('★★★★★ · ' + H.PATHS[ch.path].name, ix, y + 14, { size: 9, col: G.RARITY[5] }); G.pathIcon(c, ch.path, ix + this.measure('★★★★★ · ' + H.PATHS[ch.path].name, 9) + 3, y + 13, 11, G.RARITY[5]);
      }
      y += 34;
      S.four.forEach((fid, i) => {
        const mx = ix + 18 + i * 44, my = y + 16, cone = fid.startsWith('cone:');
        c.fillStyle = '#05070e'; c.beginPath(); c.arc(mx, my, 17, 0, Math.PI * 2); c.fill();
        c.save(); c.beginPath(); c.arc(mx, my, 15, 0, Math.PI * 2); c.clip();
        c.fillStyle = '#2a1a3a'; c.fillRect(mx - 15, my - 15, 30, 30);
        if (cone) G.drawConeCard(c, fid.slice(5), mx - 10, my - 14, 20, 28, { info: false });
        else G.drawPortrait(c, G.lookOf(fid, g), mx - 15, my - 15, 30);
        c.restore();
        c.strokeStyle = G.RARITY[4]; c.lineWidth = 2; c.beginPath(); c.arc(mx, my, 16, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
        const nm = cone ? H.CONES[fid.slice(5)].name : H.CHARS[fid].name;
        this.text(this.fitText(nm, 8, 42), mx, my + 19, { size: 8, align: 'center', col: '#e8d4ff' });
      });
      y += 50;
      const rules = forge
        ? ['5★: всегда «' + H.CONES[S.cone].name + '».', '5★ за ' + T.conePity5 + ', 4★ за ' + T.pity4 + ' призывов.']
        : ['5★: ' + Math.round(T.convFeatured * 100) + '% шанс, что это ' + ch.name + '. Промах даёт гарант.', '5★ за ' + T.pity5 + ', 4★ за ' + T.pity4 + ' призывов.'];
      rules.forEach(r => this.wrap(r, rw, 9).forEach(l => { this.text(l, ix, y, { size: 9, col: C.cream }); y += 11; }));
      this.evPicker(c, bx + bw - 62, by + 12, star, pick, ban);
    },

    manaGauge(c, bx, by, ban) {
      const g = this.game, t = this.t, pity = g.pityOf(ban);
      const gx = bx + 22, gy = by + 44, gw = 30, gh = 150, f = Math.min(1, pity.five / (g.bannerOf(ban).pity5 || T.pity5));
      this.text('До 5★', gx + gw / 2, by + 18, { align: 'center', size: 10, bold: true, col: RAR_TXT[5] });
      const crystal = () => { c.beginPath(); c.moveTo(gx + gw / 2, gy - 12); c.lineTo(gx + gw, gy + 6); c.lineTo(gx + gw, gy + gh - 6); c.lineTo(gx + gw / 2, gy + gh + 12); c.lineTo(gx, gy + gh - 6); c.lineTo(gx, gy + 6); c.closePath(); };
      crystal(); c.fillStyle = 'rgba(30,6,14,0.85)'; c.fill();
      c.save(); crystal(); c.clip();
      const fg = c.createLinearGradient(0, gy + gh + 12, 0, gy - 12);
      fg.addColorStop(0, '#8a0e24'); fg.addColorStop(1, '#ff6a7a');
      c.fillStyle = fg; c.fillRect(gx, gy + gh + 12 - (gh + 24) * f, gw, (gh + 24) * f);
      c.fillStyle = 'rgba(255,230,234,' + (0.25 + 0.15 * Math.sin(t * 3)).toFixed(2) + ')'; c.fillRect(gx + 5, gy, 3, gh);
      c.restore();
      crystal(); c.strokeStyle = '#d8b050'; c.lineWidth = 1.5; c.stroke(); c.lineWidth = 1;
      this.text(String((g.bannerOf(ban).pity5 || T.pity5) - pity.five), gx + gw / 2, gy + gh + 18, { align: 'center', size: 13, bold: true, serif: true, col: C.cream });
      this.text('До 4★: ' + (T.pity4 - pity.four), gx + gw / 2, gy + gh + 36, { align: 'center', size: 9, col: C.sub });
      this.text(pity.guar5 ? 'Гарант' : (() => { const fr = g.bannerOf(ban).featRate || 0.5; return Math.round(fr * 100) + '/' + Math.round((1 - fr) * 100); })(), gx + gw / 2, gy + gh + 50, { align: 'center', size: 9, bold: true, col: pity.guar5 ? C.gold : '#c8d4ec' });
    },

    guildChannels(x, y, ban, chan) {
      if (!chan) return;
      GUILD_CHANNELS.forEach(([id, label], i) => this.button(x + i * 68, y, 66, 18, label, () => chan(id), { active: id === ban, size: 10 }));
    },

    wizBanner(c, bx, by, bw, bh, star, pick, chan) {
      const g = this.game, t = this.t, B = H.BANNERS.wiz, S = B.stars[star], cd = H.CONES[S.cone], ch = H.CHARS[star], pity = g.pityOf('wiz');
      const wall = c.createLinearGradient(0, by, 0, by + bh);
      wall.addColorStop(0, '#1e1626'); wall.addColorStop(1, '#0c0810');
      c.fillStyle = wall; c.fillRect(bx, by, bw, bh);
      const sx = bx + 74, sw = 316, cy = by + 12, chh = bh - 24;
      c.fillStyle = '#2a1e30'; c.fillRect(sx, cy, sw, chh);
      for (let x = sx; x < sx + sw; x += 18) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, cy, 1, chh); }
      const glowA = 0.18 + 0.06 * Math.sin(t * 2);
      const lamp = c.createRadialGradient(sx + sw / 2, cy + 40, 4, sx + sw / 2, cy + 40, 150);
      lamp.addColorStop(0, 'rgba(255,214,150,' + glowA.toFixed(2) + ')'); lamp.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = lamp; c.fillRect(sx, cy, sw, chh);
      const BOTTLE = ['#6ad0c0', '#d86aa8', '#8a8af0', '#e8c860', '#7ad86a', '#e87a5a'];
      [cy + 44, cy + 96].forEach((py, row) => {
        c.fillStyle = '#5a3a24'; c.fillRect(sx + 6, py, sw - 12, 5);
        c.fillStyle = '#3a2416'; c.fillRect(sx + 6, py + 5, sw - 12, 2);
        for (let i = 0; i < 14; i++) {
          const x = sx + 14 + i * 21 + (row ? 8 : 0), kind = (i * 7 + row * 3) % 5, col = BOTTLE[(i + row * 2) % BOTTLE.length];
          if (kind === 0) { c.fillStyle = col; c.fillRect(x, py - 14, 9, 14); c.fillRect(x + 3, py - 18, 3, 4); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x + 1, py - 12, 2, 8); }
          else if (kind === 1) { c.fillStyle = col; c.beginPath(); c.arc(x + 5, py - 6, 6, 0, Math.PI * 2); c.fill(); c.fillRect(x + 3, py - 16, 4, 5); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(x + 2, py - 9, 2, 2); }
          else if (kind === 2) { c.fillStyle = '#e8dcb8'; c.fillRect(x, py - 8, 12, 8); c.fillStyle = '#b83030'; c.fillRect(x + 5, py - 8, 2, 8); }
          else if (kind === 3) { c.fillStyle = '#7a5a3a'; c.fillRect(x, py - 12, 10, 12); c.fillStyle = '#d8b050'; c.fillRect(x, py - 7, 10, 2); }
          else { c.fillStyle = '#c8304a'; c.beginPath(); c.moveTo(x + 5, py - 14); c.lineTo(x + 10, py - 6); c.lineTo(x + 5, py); c.lineTo(x, py - 6); c.fill(); c.fillStyle = 'rgba(255,220,230,0.6)'; c.fillRect(x + 3, py - 9, 2, 3); }
        }
      });
      c.fillStyle = '#e8dcb8'; c.fillRect(sx + 18, cy + 8, 156, 20);
      c.fillStyle = '#7a5a30'; c.fillRect(sx + 18, cy + 28, 156, 2);
      this.text('Магические товары Виз', sx + 96, cy + 12, { align: 'center', size: 10, bold: true, serif: true, col: '#4a2a1a', shadow: false });
      const ky = by + bh - 70;
      c.fillStyle = '#4a2e1a'; c.fillRect(sx, ky, sw, 58);
      c.fillStyle = '#6a4428'; c.fillRect(sx, ky, sw, 6);
      c.fillStyle = 'rgba(0,0,0,0.3)'; for (let x = sx + 20; x < sx + sw; x += 40) c.fillRect(x, ky + 8, 1, 50);
      const cw = 86, chh2 = 120, cx0 = sx + 122, cy0 = ky - chh2 + 22, bob = Math.round(Math.sin(t * 1.4) * 2);
      c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(cx0 + cw / 2, ky + 24, 52, 7, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#8a6a3a'; c.fillRect(cx0 + cw / 2 - 30, ky + 14, 60, 8);
      const halo = c.createRadialGradient(cx0 + cw / 2, cy0 + chh2 / 2, 10, cx0 + cw / 2, cy0 + chh2 / 2, 90);
      halo.addColorStop(0, 'rgba(255,214,110,0.35)'); halo.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = halo; c.fillRect(cx0 - 50, cy0 - 40, cw + 100, chh2 + 80);
      G.drawConeCard(c, S.cone, cx0, cy0 + bob, cw, chh2);
      const tx = sx + 8, ty = ky - 64;
      c.save(); c.translate(tx + 52, ty); c.rotate(-0.05);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-49, 3, 104, 66);
      c.fillStyle = '#f2e8cc'; c.fillRect(-52, 0, 104, 66);
      c.fillStyle = '#c83030'; c.beginPath(); c.arc(0, 4, 3, 0, Math.PI * 2); c.fill();
      this.wrap(S.tag, 94, 9).slice(0, 5).forEach((l, i) => this.text(l, 0, 9 + i * 10, { align: 'center', size: 9, col: '#3a2a18', shadow: false }));
      c.restore();
      if (pity.guar5) {
        c.save(); c.translate(cx0 + cw + 24, cy0 + chh2 - 18); c.rotate(-0.22);
        c.strokeStyle = 'rgba(200,30,40,0.85)'; c.lineWidth = 2; c.strokeRect(-36, -11, 72, 22); c.lineWidth = 1;
        this.text('ГАРАНТ', 0, -6, { align: 'center', size: 12, bold: true, serif: true, col: 'rgba(200,30,40,0.9)', shadow: false });
        c.restore();
      }
      this.manaGauge(c, bx, by, 'wiz');
      this.guildChannels(sx + sw - 140, by + bh - 34, 'wiz', chan);
      const ix = bx + 398, rw = 132;
      const kw = Math.min(rw, this.measure(B.name, 9, true) + 12);
      c.fillStyle = '#5a2a6a'; c.fillRect(ix, by + 14, kw, 14);
      this.text(B.name, ix + 6, by + 15, { size: 9, bold: true, col: '#f8eaff', shadow: false });
      let ts = 18;
      while (ts > 10 && Math.max(...S.title.map(x => this.measure(x, ts, true, true))) > rw) ts--;
      this.text(S.title[0], ix, by + 34, { size: ts, bold: true, serif: true, col: '#fff0e0' });
      this.text(S.title[1], ix, by + 36 + ts + 2, { size: ts, bold: true, serif: true, col: '#fff0e0' });
      let y = by + 84;
      G.pathIcon(c, cd.path, ix, y - 1, 12, '#f2dc9a');
      this.text(ch.name + ': фирменный', ix + 16, y, { size: 11, bold: true, col: '#ffd890' });
      this.text('★★★★★ · ' + H.PATHS[cd.path].name, ix, y + 14, { size: 9, col: G.RARITY[5] });
      y += 36;
      const four = S.four[0].slice(5);
      G.drawConeCard(c, four, ix, y - 2, 30, 42, { info: false });
      this.text('«' + H.CONES[four].name + '» · 4★', ix + 36, y + 2, { size: 10, bold: true, col: '#e8d4ff' });
      this.wrap('Конус Казумы. Гарант 4★: только он.', rw - 36, 9).slice(0, 3).forEach((l, i) => this.text(l, ix + 36, y + 16 + i * 11, { size: 9, col: C.sub }));
      y += 50;
      const fr = T.coneFeatured, party = (1 - fr) * T.guildParty;
      ['5★: ' + Math.round(fr * 100) + '% «' + cd.name + '», ' + Math.round(party * 1000) / 10 + '% конус другой героини, ' + Math.round((1 - fr - party) * 1000) / 10 + '% конус стандарта. После промаха гарант.', '5★ за ' + T.conePity5 + ', 4★ за ' + T.pity4 + ' покупок. Гарант у Лавки свой.'].forEach(par => {
        this.wrap(par, rw, 9).forEach(l => { this.text(l, ix, y, { size: 9, col: '#c8bca8' }); y += 11; });
        y += 4;
      });
      this.evPicker(c, bx + bw - 62, by + 12, star, pick, 'wiz');
    },

    guildBanner(c, bx, by, bw, bh, star, pick, chan) {
      const g = this.game, t = this.t, B = H.BANNERS.guild, S = B.stars[star], ch = H.CHARS[star], pity = g.pityOf('guild'), tint = POSTER_TINT[star] || C.gold;
      const wall = c.createLinearGradient(0, by, 0, by + bh);
      wall.addColorStop(0, '#2c1c12'); wall.addColorStop(1, '#120a06');
      c.fillStyle = wall; c.fillRect(bx, by, bw, bh);
      for (let x = bx + 6; x < bx + bw; x += 24) { c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(x, by, 1, bh); c.fillStyle = 'rgba(255,214,160,0.05)'; c.fillRect(x + 1, by, 1, bh); }
      const sx = bx + 74, sw = 316, cy = by + 12, chh = bh - 24;
      c.fillStyle = '#4a2e18'; c.fillRect(sx - 5, cy - 5, sw + 10, chh + 10);
      c.fillStyle = '#6a4224'; c.fillRect(sx - 3, cy - 3, sw + 6, chh + 6);
      c.fillStyle = '#b4885a'; c.fillRect(sx, cy, sw, chh);
      for (let i = 0; i < 320; i++) { c.fillStyle = i % 3 ? 'rgba(96,62,30,0.32)' : 'rgba(244,214,168,0.22)'; c.fillRect(sx + (i * 73) % sw, cy + (i * 131) % chh, 2, 2); }
      c.save(); c.beginPath(); c.rect(sx, cy, sw, chh); c.clip();
      [[sx + 8, cy + 12, -0.09, '#e6d8b8'], [sx + 18, cy + 186, 0.07, '#d8caa4'], [sx + sw - 64, cy + 200, -0.06, '#e2d4b0'], [sx + sw - 50, cy + 10, 0.08, '#d4c6a0']].forEach(([nx, ny, r, col]) => {
        c.save(); c.translate(nx, ny); c.rotate(r);
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(3, 3, 52, 40);
        c.fillStyle = col; c.fillRect(0, 0, 52, 40);
        c.fillStyle = 'rgba(80,60,36,0.55)'; for (let l = 0; l < 4; l++) c.fillRect(6, 9 + l * 7, 40 - (l % 2) * 12, 2);
        c.fillStyle = '#b83030'; c.beginPath(); c.arc(26, 4, 3, 0, Math.PI * 2); c.fill();
        c.restore();
      });
      const px0 = sx + 138, py0 = cy + 14, pw = 166, ph = 208, sway = 0.015 * Math.sin(t * 0.9);
      c.save(); c.translate(px0 + pw / 2, py0); c.rotate(sway); c.translate(-(px0 + pw / 2), -py0);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(px0 + 4, py0 + 5, pw, ph);
      c.fillStyle = '#f2e8cc'; c.fillRect(px0, py0, pw, ph);
      c.fillStyle = 'rgba(150,120,70,0.18)'; for (let i = 0; i < 40; i++) c.fillRect(px0 + (i * 37) % pw, py0 + (i * 53) % ph, 3, 1);
      c.fillStyle = tint; c.fillRect(px0, py0, pw, 24);
      this.text('НАБОР В ОТРЯД', px0 + pw / 2, py0 + 5, { align: 'center', size: 13, bold: true, serif: true, col: '#fff6e0', shadow: false });
      c.fillStyle = '#2a1c10'; c.fillRect(px0 + pw / 2 - 31, py0 + 31, 62, 62);
      c.fillStyle = G.dark(tint, 0.4); c.fillRect(px0 + pw / 2 - 30, py0 + 32, 60, 60);
      G.drawPortrait(c, G.lookOf(star, g), px0 + pw / 2 - 30, py0 + 32, 60);
      this.text(ch.name, px0 + pw / 2, py0 + 98, { align: 'center', size: 14, bold: true, serif: true, col: '#3a2410', shadow: false });
      const pathLine = H.PATHS[ch.path].name + ' · ' + H.ELEMENTS[ch.elem].name, plw = this.measure(pathLine, 9);
      G.pathIcon(c, ch.path, Math.round(px0 + pw / 2 - plw / 2 - 7), py0 + 115, 11, '#6a4a28');
      this.text(pathLine, px0 + pw / 2 + 7, py0 + 116, { align: 'center', size: 9, col: '#6a4a28', shadow: false });
      this.wrap(S.poster, pw - 20, 10).slice(0, 5).forEach((l, i) => this.text(l, px0 + pw / 2, py0 + 134 + i * 13, { align: 'center', size: 10, col: '#3a2a18', shadow: false }));
      if (pity.guar5) {
        c.save(); c.translate(px0 + pw - 44, py0 + ph - 30); c.rotate(-0.22);
        c.strokeStyle = 'rgba(200,30,40,0.85)'; c.lineWidth = 2; c.strokeRect(-36, -11, 72, 22); c.lineWidth = 1;
        this.text('ГАРАНТ', 0, -6, { align: 'center', size: 12, bold: true, serif: true, col: 'rgba(200,30,40,0.9)', shadow: false });
        c.restore();
      }
      c.restore();
      c.fillStyle = '#c83030'; c.beginPath(); c.arc(px0 + 10, py0 + 6, 3.5, 0, Math.PI * 2); c.arc(px0 + pw - 10, py0 + 6, 3.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(sx + 72, by + bh - 12, 44, 7, 0, 0, Math.PI * 2); c.fill();
      G.drawFigure(c, G.lookOf(star, g), sx + 72, by + bh - 10, 2.6);
      c.restore();
      this.manaGauge(c, bx, by, 'guild');
      this.guildChannels(bx + 74 + 316 - 140, by + bh - 34, 'guild', chan);
      const ix = bx + 398, rw = 132;
      const kw = Math.min(rw, this.measure(B.name, 9, true) + 12);
      c.fillStyle = '#b02a2a'; c.fillRect(ix, by + 14, kw, 14);
      this.text(B.name, ix + 6, by + 15, { size: 9, bold: true, col: '#fff0f0', shadow: false });
      let ts = 18;
      while (ts > 10 && Math.max(...S.title.map(x => this.measure(x, ts, true, true))) > rw) ts--;
      this.text(S.title[0], ix, by + 34, { size: ts, bold: true, serif: true, col: '#fff0e0' });
      this.text(S.title[1], ix, by + 36 + ts + 2, { size: ts, bold: true, serif: true, col: '#fff0e0' });
      let y = by + 84;
      G.elemIcon(c, ch.elem, ix + 6, y + 6, 6);
      this.text(ch.name, ix + 16, y, { size: 12, bold: true, col: '#ffd890' });
      this.text('★★★★★ · ' + H.PATHS[ch.path].name, ix, y + 14, { size: 9, col: G.RARITY[5] }); G.pathIcon(c, ch.path, ix + this.measure('★★★★★ · ' + H.PATHS[ch.path].name, 9) + 3, y + 13, 11, G.RARITY[5]);
      y += 36;
      const kz = S.four[0], mx = ix + 18, my = y + 16;
      c.fillStyle = '#05070e'; c.beginPath(); c.arc(mx, my, 17, 0, Math.PI * 2); c.fill();
      c.save(); c.beginPath(); c.arc(mx, my, 15, 0, Math.PI * 2); c.clip();
      c.fillStyle = '#1a3a22'; c.fillRect(mx - 15, my - 15, 30, 30);
      G.drawPortrait(c, G.lookOf(kz, g), mx - 15, my - 15, 30);
      c.restore();
      c.strokeStyle = G.RARITY[4]; c.lineWidth = 2; c.beginPath(); c.arc(mx, my, 16, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
      this.text(H.CHARS[kz].name + ' · 4★', ix + 42, y + 4, { size: 10, bold: true, col: '#e8d4ff' });
      this.wrap('Гарант 4★: только он.', rw - 42, 9).slice(0, 2).forEach((l, i) => this.text(l, ix + 42, y + 18 + i * 11, { size: 9, col: C.sub }));
      y += 46;
      ['5★: ' + Math.round(T.guildFeatured * 100) + '% шанс, что это ' + ch.name + ', ' + Math.round((1 - T.guildFeatured) * T.guildParty * 100) + '% другая героиня отряда, ' + Math.round((1 - T.guildFeatured) * (1 - T.guildParty) * 100) + '% 5★ стандарта. После промаха гарант.', '5★ за ' + T.pity5 + ', 4★ за ' + T.pity4 + ' наборов.'].forEach(r => this.wrap(r, rw, 9).forEach(l => { this.text(l, ix, y, { size: 9, col: C.cream }); y += 11; }));
      this.evPicker(c, bx + bw - 62, by + 12, star, pick, 'guild');
    },

    evPicker(c, x, y, cur, pick, kind) {
      const coneKind = kind === 'cone' || kind === 'amp' || kind === 'forge' || kind === 'wiz';
      const ids = Object.keys(H.BANNERS[kind && H.BANNERS[kind] && H.BANNERS[kind].stars ? kind : 'ev'].stars);
      const n = ids.length, roll = n > PICK_VIS, vis = roll ? PICK_VIS : n, big = n <= 3, P = big ? 70 : roll ? 46 : 50, S = big ? 40 : 30, SH = big ? 64 : roll ? 44 : 47;
      const ci = Math.max(0, ids.indexOf(cur)), top = roll ? Math.max(0, Math.min(n - vis, ci - 2)) : 0, head = roll ? 12 : 0, boxH = vis * P + 28 + 2 * head;
      c.fillStyle = 'rgba(6,6,18,0.72)'; c.fillRect(x - 6, y - 4, 64, boxH);
      c.strokeStyle = 'rgba(201,164,92,0.6)'; c.strokeRect(x - 5.5, y - 3.5, 63, boxH - 1);
      if (roll) {
        const above = top, below = n - top - vis, step = d => pick(ids[Math.max(0, Math.min(n - 1, ci + d))]);
        this.text((above ? '▲ ' + above : '▲'), x + 26, y - 2, { size: 9, align: 'center', col: above ? C.gold : C.dim });
        this.text((below ? '▼ ' + below : '▼'), x + 26, y + head + vis * P + 3, { size: 9, align: 'center', col: below ? C.gold : C.dim });
        this.hit(x - 6, y - 4, 64, head + 2, () => step(-1));
        this.hit(x - 6, y + head + vis * P + 2, 64, head + 2, () => step(1));
        this.wheelZone(x - 6, y - 4, 64, boxH, d => step(d));
      }
      ids.slice(top, top + vis).forEach((id, i) => {
        const cy = y + head + i * P, on = id === cur, ch = H.CHARS[id], name = ch.name.length > 10 && ch.short ? ch.short : ch.name;
        if (on) { c.fillStyle = 'rgba(242,220,154,0.22)'; c.fillRect(x - 2, cy - 1, 56, SH); c.fillStyle = C.brassHi; c.beginPath(); c.moveTo(x - 6, cy + SH / 2 - 8); c.lineTo(x - 12, cy + SH / 2 - 13); c.lineTo(x - 12, cy + SH / 2 - 3); c.fill(); }
        if (coneKind) G.drawConeCard(c, H.BANNERS[kind].stars[id].cone, x + 26 - S * 0.375, cy + 1, Math.round(S * 0.75), Math.round(S * 1.05), { info: false });
        else this.portraitCard(c, G.lookOf(id, this.game), x + 26 - S / 2, cy + 3, S, { elem: ch.elem, border: on ? C.brassHi : '#4a4466' });
        if (!on) { c.fillStyle = 'rgba(6,6,18,0.45)'; c.fillRect(x + 26 - S / 2, cy + 1, S, S + 4); }
        this.text(name, x + 26, cy + S + 7, { size: big ? 10 : 9, bold: on, align: 'center', col: on ? C.gold : C.sub });
        this.hit(x - 2, cy - 1, 56, SH, () => pick(id));
      });
      this.text(coneKind ? '↑↓ конус' : '↑↓ герой', x + 26, y + 2 * head + vis * P + 8, { size: 9, align: 'center', col: C.dim });
    },

    openWarp(close) {
      const ui = this, g = this.game;
      this.push({
        full: true, show: null, ban: g.defaultBanner(),
        chans: {},
        setBan(id) { if (tabOf(this.ban) === tabOf(id)) return; id = this.chans[tabOf(id)] || id; this.ban = id; this.chans[tabOf(id)] = id; g.state.warpBan = id; ui.sfx('select'); },
        setChan(id) { if (id === this.ban) return; this.ban = id; this.chans[tabOf(id)] = id; g.state.warpBan = id; ui.sfx('select'); },
        curStar() { return this.ban === 'cone' ? g.coneStar() : this.ban === 'ev' ? g.evStar() : g.starOf(this.ban); },
        setStar(id) { if (id === this.curStar() || !(this.ban === 'cone' ? g.setConeStar(id) : this.ban === 'ev' ? g.setEvStar(id) : g.setStarOf(this.ban, id))) return; ui.sfx('select'); },
        stepStar(d) { const ids = Object.keys(H.BANNERS[this.ban].stars), i = ids.indexOf(this.curStar()); this.setStar(ids[(i + d + ids.length) % ids.length]); },
        draw(c) {
          const s = g.state, B = g.bannerOf(this.ban), pity = g.pityOf(this.ban), cone = this.ban === 'cone', sig = signalBan(this.ban), conv = conveneBan(this.ban), guild = guildBan(this.ban), mid = midBan(this.ban), con = conBan(this.ban);
          if (sig) ui.audio.preloadSong('signal');
          if (mid) ui.audio.preloadSong('aria');
          if (!this.show && con && ui.audio.wantedSong !== 'cccLobby') ui.audio.song('cccLobby');
          if (!this.show && !con && ui.audio.wantedSong === 'cccLobby') ui.audio.stopSong();
          if (this.show) { this.show.draw(c); return; }
          ui.fullBg(c, false);
          ui.plate(12, 10, BANNER_TABS.find(b => b[0] === tabOf(this.ban))[1]);
          ui.bannerTabs(this.ban, id => this.setBan(id));
          ui.button(W - 118, 10, 82, 22, 'История', () => ui.openWarpHistory(this.ban), { icon: 'archive', size: 11 });
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          const bx = 20, by = 44, bw = 600, bh = 290;
          c.fillStyle = '#000'; c.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
          if (this.ban === 'ev') ui.eventBanner(c, bx, by, bw, bh, g.evStar(), id => this.setStar(id), id => this.setChan(id));
          else if (cone) ui.coneBanner(c, bx, by, bw, bh, g.coneStar(), id => this.setStar(id), id => this.setChan(id));
          else if (sig) ui.signalBanner(c, bx, by, bw, bh, this.ban, g.starOf(this.ban), id => this.setStar(id), id => this.setChan(id));
          else if (conv) ui.conveneBanner(c, bx, by, bw, bh, this.ban, g.starOf(this.ban), id => this.setStar(id), id => this.setChan(id));
          else if (this.ban === 'wiz') ui.wizBanner(c, bx, by, bw, bh, g.starOf('wiz'), id => this.setStar(id), id => this.setChan(id));
          else if (guild) ui.guildBanner(c, bx, by, bw, bh, g.starOf('guild'), id => this.setStar(id), id => this.setChan(id));
          else if (mid) ui.midnightBanner(c, bx, by, bw, bh, this.ban, g.starOf(this.ban), id => this.setStar(id), id => this.setChan(id));
          else if (con) ui.contonBanner(c, bx, by, bw, bh, this.ban, g.starOf(this.ban), id => this.setStar(id), id => this.setChan(id));
          else ui.standardBanner(c, bx, by, bw, bh);
          c.strokeStyle = C.brass; c.lineWidth = 2; c.strokeRect(bx + 1, by + 1, bw - 2, bh - 2); c.lineWidth = 1;
          const fy = 346, special = this.ban !== 'std';
          ui.win(20, fy, 600, 110, { alpha: 0.9 });
          let mx = 36;
          mx += ui.money(mx, fy + 16, B.pass, TICKETS[this.ban][1] + (s.inv.items[B.pass] || 0), { size: 20 }) + 18;
          ui.money(mx, fy + 16, 'jade', 'Нефрит ' + H.fmt(s.jade), { size: 20 });
          ui.text(sig ? 'До S: ' + ((B.pity5 || T.pity5) - pity.five) + ' · до A: ' + (T.pity4 - pity.four) : 'До 5★: ' + ((B.pity5 || T.pity5) - pity.five) + ' · до 4★: ' + (T.pity4 - pity.four), 604, fy + 18, { size: 11, align: 'right', col: C.sub });
          if (sig) ui.text(pity.guar5 ? 'Следующий S точно ' + (this.ban === 'amp' ? '«' + H.CONES[B.cone].name + '»' : H.CHARS[B.five].name) : 'S: ' + Math.round(B.featRate * 100) + '% на ' + (this.ban === 'amp' ? '«' + H.CONES[B.cone].name + '»' : H.CHARS[B.five].name), 604, fy + 32, { size: 10, align: 'right', bold: !!pity.guar5, col: pity.guar5 ? C.gold : C.dim });
          if (cone) ui.text(pity.guar5 ? 'Следующий 5★ точно «' + H.CONES[B.cone].name + '»' : '5★: 75% на «' + H.CONES[B.cone].name + '»', 604, fy + 32, { size: 10, align: 'right', bold: !!pity.guar5, col: pity.guar5 ? C.gold : C.dim });
          if (this.ban === 'conv') ui.text(pity.guar5 ? 'Следующий 5★ точно ' + H.CHARS[B.five].name : '5★: ' + Math.round(B.featRate * 100) + '% шанс, что это ' + H.CHARS[B.five].name, 604, fy + 32, { size: 10, align: 'right', bold: !!pity.guar5, col: pity.guar5 ? C.gold : C.dim });
          if (this.ban === 'forge') ui.text('5★: всегда «' + H.CONES[B.cone].name + '»', 604, fy + 32, { size: 10, align: 'right', col: C.dim });
          if (mid) ui.text(pity.guar5 ? 'Следующий 5★ точно ' + (this.ban === 'comp' ? '«' + H.CONES[B.cone].name + '»' : H.CHARS[B.five].name) : '5★: ' + Math.round(B.featRate * 100) + '% на ' + (this.ban === 'comp' ? '«' + H.CONES[B.cone].name + '»' : H.CHARS[B.five].name), 604, fy + 32, { size: 10, align: 'right', bold: !!pity.guar5, col: pity.guar5 ? C.gold : C.dim });
          if (con) ui.text(pity.guar5 ? 'Следующая 5★ точно ' + (this.ban === 'alley' ? '«' + H.CONES[B.cone].name + '»' : H.CHARS[B.five].name) : '5★: ' + Math.round(B.featRate * 100) + '% на ' + (this.ban === 'alley' ? '«' + H.CONES[B.cone].name + '»' : H.CHARS[B.five].name), 604, fy + 32, { size: 10, align: 'right', bold: !!pity.guar5, col: pity.guar5 ? C.gold : C.dim });
          if (this.ban === 'wiz') ui.text(pity.guar5 ? 'Следующий 5★ точно «' + H.CONES[B.cone].name + '»' : '5★: ' + Math.round(B.featRate * 100) + '% на «' + H.CONES[B.cone].name + '»', 604, fy + 32, { size: 10, align: 'right', bold: !!pity.guar5, col: pity.guar5 ? C.gold : C.dim });
          else if (guild) ui.text(pity.guar5 ? 'Следующий 5★ точно ' + H.CHARS[B.five].name : '5★: ' + Math.round(B.featRate * 100) + '% ' + H.CHARS[B.five].name + ' · ' + Math.round((1 - B.featRate) * T.guildParty * 100) + '% отряд · ' + Math.round((1 - B.featRate) * (1 - T.guildParty) * 100) + '% стандарт', 604, fy + 32, { size: 10, align: 'right', bold: !!pity.guar5, col: pity.guar5 ? C.gold : C.dim });
          ui.button(120, fy + 48, 180, 34, sig ? 'Поиск ×1' : conv ? 'Призыв ×1' : this.ban === 'wiz' || this.ban === 'alley' ? 'Купить ×1' : con ? 'На сцену ×1' : guild ? 'Набор ×1' : 'Прыжок ×1', () => { this.sel = 0; this.pull(1); }, { active: this.sel === 0, bold: true, icon: 'warp' });
          ui.button(340, fy + 48, 180, 34, sig ? 'Поиск ×10' : conv ? 'Призыв ×10' : this.ban === 'wiz' || this.ban === 'alley' ? 'Купить ×10' : con ? 'На сцену ×10' : guild ? 'Набор ×10' : 'Прыжок ×10', () => { this.sel = 1; this.pull(10); }, { active: this.sel === 1, bold: true, icon: 'warp' });
          ui.text(con ? '1 прыжок = 1 бейдж или ' + T.warpCost + ' нефрита · свой гарант у сцены и Аллеи' : mid ? '1 прыжок = 1 бархатный ключ или ' + T.warpCost + ' нефрита · свой гарант у канала и Компендиума' : this.ban === 'wiz' ? '1 покупка = 1 манатит высшей пробы или ' + T.warpCost + ' нефрита · гарант общий для трёх конусов' : guild ? '1 набор = 1 манатит высшей пробы или ' + T.warpCost + ' нефрита · гарант общий для всего отряда' : sig ? '1 поиск = 1 шифрокопия или ' + T.warpCost + ' нефрита · свой гарант у каждого канала' : this.ban === 'conv' ? '1 призыв = 1 сияющий прилив или ' + T.warpCost + ' нефрита · гарант общий для обоих резонаторов' : this.ban === 'forge' ? '1 призыв = 1 кующий прилив или ' + T.warpCost + ' нефрита · свой гарант: 5★ за ' + T.conePity5 : cone ? '1 прыжок = 1 особый пропуск или ' + T.warpCost + ' нефрита · свой гарант: 5★ за ' + T.conePity5 + ', промах 75% даёт гарант' : special ? '1 прыжок = 1 особый пропуск или ' + T.warpCost + ' нефрита · гарант общий для всех героев события' : '1 прыжок = 1 пропуск или ' + T.warpCost + ' нефрита', W / 2, fy + 90, { align: 'center', size: 10, col: C.dim });
          ui.hints(con ? [['Q/E', 'Баннер'], ['Tab', 'Канал'], ['↑↓', this.ban === 'alley' ? 'Принт' : 'Героиня'], ['←→', 'Выбор'], ['Enter', g.conRegistered() ? 'Прыжок' : 'Регистрация'], ['H', 'История'], ['Esc', 'Назад']] : mid ? [['Q/E', 'Баннер'], ['Tab', 'Канал'], ['↑↓', this.ban === 'comp' ? 'Конус' : 'Герой'], ['←→', 'Выбор'], ['Enter', g.contractSigned() ? 'Прыжок' : 'Подписать'], ['H', 'История'], ['Esc', 'Назад']] : guild ? [['Q/E', 'Баннер'], ['Tab', 'Канал'], ['↑↓', this.ban === 'wiz' ? 'Конус' : 'Героиня'], ['←→', 'Выбор'], ['Enter', 'Набор'], ['H', 'История'], ['Esc', 'Назад']] : sig ? [['Q/E', 'Баннер'], ['Tab', 'Канал'], ['↑↓', this.ban === 'amp' ? 'Конус' : 'Агент'], ['←→', 'Выбор'], ['Enter', 'Поиск'], ['H', 'История'], ['Esc', 'Назад']] : conv ? [['Q/E', 'Баннер'], ['Tab', 'Канал'], ['↑↓', this.ban === 'forge' ? 'Конус' : 'Резонатор'], ['←→', 'Выбор'], ['Enter', 'Призыв'], ['H', 'История'], ['Esc', 'Назад']] : special ? [['Q/E', 'Баннер'], ['Tab', 'Канал'], ['↑↓', cone ? 'Конус' : 'Герой'], ['←→', 'Выбор'], ['Enter', 'Прыжок'], ['H', 'История']].concat(cone ? [['V', 'Конус']] : [], [['Esc', 'Назад']]) : [['Q/E', 'Баннер'], ['←→', 'Выбор'], ['Enter', 'Прыжок'], ['H', 'История'], ['Esc', 'Назад']], 12, HGT - 18);
        },
        start(res) { if (conBan(this.ban)) ui.audio.stopSong(0); if (conBan(this.ban) && H.SpotlightShow) { this.show = new H.SpotlightShow(ui, res, { ban: this.ban }); ui.audio.song('ccc', H.SPOT_FILM_AT); return; } this.show = signalBan(this.ban) && H.SignalShow ? new H.SignalShow(ui, res, { ban: this.ban }) : conveneBan(this.ban) && H.ConveneShow ? new H.ConveneShow(ui, res, { ban: this.ban }) : guildBan(this.ban) && H.ExplosionShow ? new H.ExplosionShow(ui, res, { ban: this.ban }) : midBan(this.ban) && H.MidnightShow ? new H.MidnightShow(ui, res, { ban: this.ban }) : new H.WarpShow(ui, res, { ban: this.ban }); if (signalBan(this.ban) && H.SignalShow) ui.audio.song('signal'); if (midBan(this.ban) && H.MidnightShow) ui.audio.song('aria'); },
        pull(n) {
          if (midBan(this.ban) && !g.contractSigned()) { ui.signVelvet(); return; }
          if (conBan(this.ban) && !g.conRegistered()) { ui.contonRegister(); return; }
          const r = g.warp(n, this.ban);
          if (!r) { ui.sfx('deny'); ui.toast('Не хватает ' + TICKETS[this.ban][0] + ' или нефрита.'); return; }
          this.start(r);
        },
        endShow() { if (this.show && this.show.done) { this.show = null; ui.audio.stopSong(); ui.sfx('confirm'); } },
        tick(dt) { if (this.show) { this.show.tick(dt); this.endShow(); } },
        key(k, code) {
          if (this.show) { if (code === 'Enter' || code === 'NumpadEnter') this.show.enter(); else if (code === 'Escape') this.show.skip(); else if (this.show.key) this.show.key(k); this.endShow(); return; }
          if (code === 'KeyH') { ui.openWarpHistory(this.ban); return; }
          if (code === 'KeyV' && this.ban === 'cone') { ui.openConeView(H.BANNERS.cone.stars[g.coneStar()].cone); return; }
          if (code === 'Tab' && CHANNELS[tabOf(this.ban)]) { const ch = CHANNELS[tabOf(this.ban)]; this.setChan(ch[(ch.indexOf(this.ban) + 1) % ch.length]); return; }
          if (code === 'KeyQ' || code === 'KeyE') { const n = BANNER_TABS.length, i = BANNER_TABS.findIndex(b => b[0] === tabOf(this.ban)); this.setBan(BANNER_TABS[(i + (code === 'KeyQ' ? n - 1 : 1)) % n][0]); return; }
          if ((k === 'up' || k === 'down') && this.ban !== 'std') { this.stepStar(k === 'up' ? -1 : 1); return; }
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'ok') this.pull(this.sel === 0 ? 1 : 10);
          if (k === 'back') { if (ui.audio.wantedSong === 'cccLobby') ui.audio.stopSong(); ui.screens.pop(); ui.sfx('cancel'); if (close) close(); }
        }
      });
    },

    openWarpHistory(ban) {
      const ui = this, g = this.game, PER = 10;
      const mine = b => e => tabOf(e.ban || 'std') === tabOf(b);
      this.push({
        full: true, page: 0, filter: 0, ban: ban || 'std',
        rows() { const min = WARP_FILTERS[this.filter][1]; return g.state.warpLog.filter(e => mine(this.ban)(e) && e.rar >= min); },
        pages() { return Math.max(1, Math.ceil(this.rows().length / PER)); },
        setFilter(i) { if (i === this.filter) return; this.filter = i; this.page = 0; ui.sfx('select'); },
        setBan(id) { if (id === tabOf(this.ban)) return; this.ban = id; this.page = 0; ui.sfx('select'); },
        turn(d) { const p = Math.max(0, Math.min(this.pages() - 1, this.page + d)); if (p !== this.page) { this.page = p; ui.sfx('select'); } },
        draw(c) {
          const st = g.warpStats(this.ban), pity = g.pityOf(this.ban);
          ui.fullBg(c, false);
          ui.plate(12, 10, signalBan(this.ban) ? 'История поиска' : conveneBan(this.ban) ? 'История призыва' : guildBan(this.ban) ? 'История набора' : 'История прыжков');
          ui.bannerTabs(this.ban, id => this.setBan(id), false);
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          ui.win(20, 42, 600, 76);
          ui.text('Прыжков на баннере', 36, 52, { size: 10, col: C.sub });
          ui.text(H.fmt(st.total), 36, 66, { size: 26, bold: true, serif: true, col: C.gold });
          [[5, pity.five, g.bannerOf(this.ban).pity5 || T.pity5, 62], [4, pity.four, T.pity4, 92]].forEach(([rar, cur, max, y]) => {
            ui.text('До ' + (signalBan(this.ban) ? RANK[rar] : rar + '★'), 150, y - 7, { size: 11, bold: true, col: RAR_TXT[rar] });
            ui.rail(196, y, 180, cur / max, G.RARITY[rar]);
            ui.text('осталось ' + (max - cur), 388, y - 7, { size: 11, col: C.cream });
          });
          ui.text('Выпало 5★: ' + st.five + '   4★: ' + st.four, 604, 52, { size: 11, bold: true, align: 'right', col: C.cream });
          ui.text('Последний 5★', 604, 74, { size: 10, align: 'right', col: C.sub });
          ui.text(st.last5 ? warpName(st.last5) + (st.last5.pity ? ', на ' + st.last5.pity + '-м' : '') : 'ещё не выпадал', 604, 88, { size: 11, bold: !!st.last5, align: 'right', col: st.last5 ? RAR_TXT[5] : C.dim });
          ui.win(20, 126, 600, 318);
          WARP_FILTERS.forEach(([label], i) => ui.button(34 + i * 104, 138, 98, 20, label, () => this.setFilter(i), { active: this.filter === i, size: 11 }));
          const rows = this.rows(), pages = this.pages(), page = Math.min(this.page, pages - 1);
          ui.button(474, 138, 20, 20, '◀', () => this.turn(-1), { disabled: page === 0, size: 10 });
          ui.text('Стр. ' + (page + 1) + ' из ' + pages, 540, 142, { size: 11, align: 'center', col: C.cream });
          ui.button(586, 138, 20, 20, '▶', () => this.turn(1), { disabled: page >= pages - 1, size: 10 });
          const cols = [['№', 64, 'right'], ['Предмет', 98], ['Редкость', 296], ['Итог', 360], ['Гарант', 520, 'right'], ['Время', 604, 'right']];
          cols.forEach(([t, x, align]) => ui.text(t, x, 166, { size: 10, align: align || 'left', col: C.dim }));
          c.fillStyle = 'rgba(201,164,92,0.45)'; c.fillRect(32, 180, 576, 1);
          if (!rows.length) {
            const none = !g.state.warpLog.some(mine(this.ban));
            G.menuIcon(c, 'warp', W / 2 - 16, 250, 32, none ? C.brassHi : C.dim);
            ui.text(none ? 'Прыжков ещё не было' : 'Предметов такой редкости пока нет', W / 2, 290, { align: 'center', bold: true, serif: true, size: 14, col: C.cream });
            ui.text(none ? 'Сюда попадёт каждый предмет: номер прыжка, итог, счётчик гаранта и время.' : 'Выберите «Все», чтобы увидеть весь журнал.', W / 2, 312, { align: 'center', size: 11, col: C.sub });
          }
          rows.slice(page * PER, page * PER + PER).forEach((e, i, list) => {
            const y = 184 + i * 25, rar = e.rar;
            if (RAR_ROW[rar]) { c.fillStyle = RAR_ROW[rar]; c.fillRect(30, y, 580, 24); c.fillStyle = G.RARITY[rar]; c.fillRect(30, y, 2, 24); }
            else if (i % 2) { c.fillStyle = 'rgba(255,255,255,0.03)'; c.fillRect(30, y, 580, 24); }
            ui.text(String(e.n), 64, y + 6, { size: 10, align: 'right', col: C.sub });
            warpIcon(c, e, 72, y + 2, 20, g);
            ui.text(warpName(e), 98, y + 5, { size: 12, bold: rar >= 4, col: RAR_TXT[rar] });
            if (signalBan(e.ban)) ui.rankBadge(296, y + 5, rar, 13); else ui.text('★'.repeat(rar), 296, y + 6, { size: 10, col: G.RARITY[rar] });
            const [note, ncol] = warpNote(e);
            ui.text(note, 360, y + 6, { size: 11, col: rar >= 4 || e.res === 'new' ? ncol : C.sub });
            ui.text(warpPity(e), 520, y + 6, { size: 11, align: 'right', bold: rar >= 4, col: rar >= 4 ? RAR_TXT[rar] : C.dim });
            ui.text(warpWhen(e), 604, y + 6, { size: 10, align: 'right', col: C.sub });
            const nx = list[i + 1];
            if (nx && nx.batch !== e.batch) { c.fillStyle = 'rgba(201,164,92,0.3)'; c.fillRect(36, y + 24, 568, 1); }
          });
          ui.hints([['←→', 'Страница'], ['Q/E', 'Редкость'], ['Tab', 'Баннер'], ['Esc', 'Назад']], 12, HGT - 18);
        },
        key(k, code) {
          if (k === 'left' || k === 'right') { this.turn(k === 'left' ? -1 : 1); return; }
          if (code === 'KeyQ' || code === 'KeyE') { this.setFilter((this.filter + (code === 'KeyQ' ? 2 : 1)) % WARP_FILTERS.length); return; }
          if (code === 'Tab') { const i = BANNER_TABS.findIndex(b => b[0] === tabOf(this.ban)); this.setBan(BANNER_TABS[(i + 1) % BANNER_TABS.length][0]); return; }
          if (k === 'back') ui.pop();
        }
      });
    },

    openShop(id, close) {
      const ui = this, g = this.game;
      this.push({
        qty: 1,
        draw(c) {
          const list = g.shopList(id), s = g.state;
          ui.win(30, 36, 580, 410, { title: H.SHOPS[id].name });
          ui.money(420, 50, 'credits', s.credits);
          ui.list(42, 72, 330, list.map(e => ({ label: e.name, right: H.fmt(e.price), disabled: s.credits < e.price, rcol: s.credits < e.price ? '#a06060' : C.gold, icon: (cc, x, y) => (e.kind === 'cone' ? G.drawConeCard(cc, e.id, x + 3, y - 10, 14, 20, { info: false }) : G.itemIcon(cc, e.id, x, y - 10, 20, e.set)), iconW: 24 })), this.sel, { rowH: 26, max: 13, onClick: i => { if (this.sel === i) this.key('ok'); else { this.sel = i; this.qty = 1; } } });
          const e = list[this.sel];
          const px = 384, py = 72;
          c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px, py, 214, 360);
          if (e) {
            if (e.kind === 'cone') { G.drawConeCard(c, e.id, px + 62, py + 10, 90, 126); ui.hit(px + 62, py + 10, 90, 126, () => ui.openConeView(e.id)); }
            else { G.rarityCell(c, px + 71, py + 12, 72, 72, e.kind === 'relic' ? 4 : (H.ITEMS[e.id] && H.ITEMS[e.id].rar) || 2); G.itemIcon(c, e.id, px + 75, py + 14, 64, e.set); }
            const ty = e.kind === 'cone' ? py + 144 : py + 94;
            ui.wrap(e.name, 190, 13).forEach((l, i) => ui.text(l, px + 107, ty + i * 16, { align: 'center', size: 13, bold: true, serif: true, col: C.gold }));
            ui.wrap(e.text, 190, 11).forEach((l, i) => ui.text(l, px + 12, ty + 40 + i * 14, { size: 11 }));
            const have = e.kind === 'item' ? (s.inv.items[e.id] || 0) : e.kind === 'relic' ? s.inv.relics.filter(x => x.set === e.set && x.slot === e.slot).length : s.inv.cones.filter(x => x.id === e.id).length;
            ui.text('В наличии: ' + have, px + 12, py + 290, { size: 11, col: C.sub });
            if (e.kind === 'item') { ui.text('Количество', px + 12, py + 308, { size: 11, col: C.sub }); ui.text('◀ ' + this.qty + ' ▶', px + 200, py + 308, { size: 12, bold: true, align: 'right' }); }
            ui.money(px + 12, py + 330, 'credits', 'Итого ' + H.fmt(e.price * (e.kind === 'item' ? this.qty : 1)), { col: s.credits < e.price * this.qty ? C.bad : C.gold });
          }
          ui.hints([['↑↓', 'Товар'], ['←→', 'Кол-во'], ['Enter', 'Купить']].concat(e && e.kind === 'cone' ? [['V', 'Подробнее']] : [], [['Esc', 'Уйти']]), W / 2, 422, { align: 'center' });
        },
        key(k, code) {
          const list = g.shopList(id);
          if (ui.listNav(this, k, list.length)) { this.qty = 1; return; }
          const e = list[this.sel];
          if (code === 'KeyV' && e && e.kind === 'cone') { ui.openConeView(e.id); return; }
          if (k === 'left' && e && e.kind === 'item') { this.qty = Math.max(1, this.qty - 1); ui.sfx('select'); }
          if (k === 'right' && e && e.kind === 'item') { this.qty = Math.min(e.left != null ? e.left : 99, this.qty + 1); ui.sfx('select'); }
          if (k === 'ok' && e) { if (g.buy(id, this.sel, e.kind === 'item' ? this.qty : 1)) { ui.sfx('chest'); ui.toast('Куплено: ' + e.name + (this.qty > 1 && e.kind === 'item' ? ' ×' + this.qty : '')); } else { ui.sfx('deny'); ui.toast('Не хватает кредитов.'); } }
          if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); close(); }
        }
      });
    },

    openRumors(who, close) {
      const ui = this, g = this.game;
      this.push({
        draw(c) {
          const list = g.rumorsFor(who), s = g.state;
          G.drawBust(c, G.lookOf('sampo', g), 8, 300, 2);
          ui.win(150, 30, 470, 420, { title: 'Слухи — «скажи погромче, и это станет правдой»' });
          ui.money(470, 44, 'credits', s.credits);
          ui.list(162, 70, 446, list.map(r => ({ label: r.title, right: s.flags[r.id] ? 'уже ходит' : H.fmt(r.cost) + ' кр.', rcol: s.flags[r.id] ? C.ok : C.gold })), this.sel, { rowH: 24, onClick: i => { if (this.sel === i) this.key('ok'); else this.sel = i; } });
          const r = list[this.sel];
          if (r) {
            c.fillStyle = '#e8dfc6'; c.fillRect(170, 270, 430, 150);
            c.fillStyle = '#c8b894'; c.fillRect(170, 270, 430, 18);
            ui.text('«БЕЛОБОГСКИЙ ВЕСТНИК»', 385, 273, { align: 'center', size: 11, bold: true, serif: true, col: '#3a2a1a', shadow: false });
            ui.wrap('«' + r.text + '»', 410, 12).slice(0, 4).forEach((l, i) => ui.text(l, 182, 296 + i * 16, { col: '#2a1e14', shadow: false }));
            ui.wrap('Эффект: ' + r.effect, 410, 11).slice(0, 2).forEach((l, i) => ui.text(l, 182, 364 + i * 14, { size: 11, col: s.flags[r.id] ? '#2a7a3a' : '#5a4a3a', shadow: false }));
            ui.text(s.flags[r.id] ? 'Слух уже стал правдой.' : '[Enter] Распустить слух', 182, 400, { size: 11, bold: true, col: '#6a3a1a', shadow: false });
          }
        },
        key(k) {
          const list = g.rumorsFor(who);
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'ok' && list[this.sel]) {
            const r = list[this.sel];
            if (g.buyRumor(r.id)) { ui.sfx('star4'); ui.toast('Слух разошёлся по городу: ' + r.effect); } else ui.sfx('deny');
          }
          if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); close(); }
        }
      });
    },

    calyxDrops(cx) {
      const REWARD = { exp: 'exp2', aether: 'aether2', credits: 'credits', relic: 'relic:body', echo: 'relic:head' };
      const out = cx.reward === 'relic' && cx.sets ? cx.sets.map(() => 'relic:head') : [REWARD[cx.reward]].filter(Boolean);
      if (cx.reward === 'path') { const line = Object.keys(H.TRACE_PATH_LINES).find(k => H.TRACE_PATH_LINES[k][0] === cx.path); out.length = 0; out.push(line + '1', line + '2', line + '3'); }
      if ((cx.reward === 'echo' || cx.reward === 'relic') && cx.mat) out.unshift(cx.mat);
      if ((cx.reward === 'exp' || cx.reward === 'aether' || cx.reward === 'credits') && cx.pool) { const fam = cx.pool.map(id => H.ENEMIES[id] && H.TRACE_FOE_OF_FAMILY[H.ENEMIES[id].fam]).filter(Boolean); if (fam.length) out.push(fam[0] + '1', fam[0] + '2'); }
      return out;
    },

    powerChip(x, y, o = {}) {
      const c = this.ctx, p = this.game.powerInfo(), w = this.money(x, y, 'power', H.fmt(p.cur) + (o.sep || '/') + H.fmt(p.max), { col: p.cur > p.max ? C.gold : o.col });
      const bx = Math.round(x + w), by = Math.round(y - 1);
      c.fillStyle = '#000'; c.fillRect(bx, by, 14, 14);
      c.fillStyle = '#2a3478'; c.fillRect(bx + 1, by + 1, 12, 12);
      c.fillStyle = C.brassHi; c.fillRect(bx + 3, by + 6, 8, 2); c.fillRect(bx + 6, by + 3, 2, 8);
      if (p.res > 0) { c.fillStyle = '#9a7cff'; c.fillRect(bx + 1, by + 12, Math.max(1, Math.round(12 * p.res / p.resMax)), 1); }
      this.hit(x - 2, by - 3, w + 18, 20, () => this.openPower());
      return w + 16;
    },

    powerLimit(row, p) {
      const g = this.game, slots = Math.floor(p.room / T.powerPack);
      if (row === 'res') return Math.min(p.res, p.room);
      if (row === 'fuel') return Math.min(p.fuel, slots);
      let k = 0;
      while (k < Math.min(p.buyMax - p.bought, slots) && g.powerJadeCost(k + 1) <= g.state.jade) k++;
      return k;
    },

    openPower(need) {
      const ui = this, g = this.game, X = 100, Y = 70, WW = 440, HH = 330, L = X + 16, R = X + WW - 16;
      const limit = (row, p) => ui.powerLimit(row, p);
      const gain = (row, n) => (row === 'res' ? n : n * T.powerPack);
      const fresh = p => POWER_ROWS.map(row => { const m = limit(row, p); return row === 'res' ? Math.min(m, p.cur < p.max ? p.max - p.cur : T.powerPack) : Math.min(m, 1); });
      const why = (row, p) => !p.room ? 'Больше ' + H.fmt(p.top) + ' энергии не накопить.'
        : row === 'res' ? 'Резерв пуст.'
        : row === 'fuel' ? (p.fuel ? 'Топливо уже не поместится.' : 'Нет Топлива Экспресса. Оно продаётся в буфете Пом-Пом.')
        : p.bought >= p.buyMax ? 'Покупки за нефрит в этот час закончились.' : p.room < T.powerPack ? 'Ещё ' + T.powerPack + ' энергии не поместится.' : 'Не хватает Звёздного нефрита.';
      const NAME = { res: 'Резерв энергии', fuel: 'Топливо Экспресса', jade: 'Звёздный нефрит' };
      const p0 = g.powerInfo();
      this.push({
        amt: need > 0 ? fresh(p0).map((a, i) => POWER_ROWS[i] === 'res' ? Math.min(limit('res', p0), Math.ceil(need)) : a) : fresh(p0), sel: Math.max(0, POWER_ROWS.findIndex(r => limit(r, p0) > 0)),
        step(d) {
          const row = POWER_ROWS[this.sel], m = limit(row, g.powerInfo()), v = Math.max(0, Math.min(m, this.amt[this.sel] + d * (row === 'res' ? T.powerPack : 1)));
          if (v !== this.amt[this.sel]) { this.amt[this.sel] = v; ui.sfx('select'); } else ui.sfx('deny');
        },
        maxOut() { this.amt[this.sel] = limit(POWER_ROWS[this.sel], g.powerInfo()); ui.sfx('select'); },
        apply() {
          const row = POWER_ROWS[this.sel], p = g.powerInfo(), m = limit(row, p), n = Math.min(this.amt[this.sel], m);
          if (m > 0 && !n) { ui.sfx('deny'); ui.toast('Выберите количество: ←→.'); return; }
          const got = n > 0 ? (row === 'res' ? g.powerFromReserve(n) : row === 'fuel' ? g.powerFromFuel(n) : g.powerFromJade(n)) : 0;
          if (!got) { ui.sfx('deny'); ui.toast(why(row, p)); return; }
          ui.sfx('heal'); ui.toast('Энергия освоения +' + got + '.');
          this.amt = fresh(g.powerInfo());
        },
        draw(c) {
          const p = g.powerInfo();
          this.amt = this.amt.map((a, i) => Math.min(a, limit(POWER_ROWS[i], p)));
          ui.win(X, Y, WW, HH, { title: 'Энергия освоения' });
          ui.closeBtn(R - 14, Y + 8, () => this.key('back'));
          G.itemIcon(c, 'power', L, Y + 18, 24);
          ui.text(H.fmt(p.cur) + ' / ' + H.fmt(p.max), L + 30, Y + 22, { size: 16, bold: true, col: p.cur > p.max ? C.gold : C.cream });
          if (p.cur > p.max) ui.text('сверх максимума +' + H.fmt(p.cur - p.max), R - 26, Y + 26, { align: 'right', size: 10, col: C.gold });
          ui.bar(L, Y + 50, R - L, 10, p.cur / p.max, p.cur >= p.max ? C.gold : C.cyan);
          ui.text(p.filling === 'cur' ? '+1 через ' + powerClock(p.next) + ' · весь запас через ' + powerClock(p.full) : 'Запас полон: новая энергия идёт в резерв.', L, Y + 66, { size: 10, col: C.sub });
          ui.text('Резерв', L, Y + 86, { size: 11, bold: true, col: '#c8b0ff' });
          ui.text(H.fmt(p.res) + ' / ' + H.fmt(p.resMax), R, Y + 86, { align: 'right', size: 11, bold: true, col: '#c8b0ff' });
          ui.bar(L, Y + 102, R - L, 6, p.res / p.resMax, '#9a7cff');
          const resNote = p.filling === 'res' ? 'Резерв заполнится через ' + powerClock(p.resFull) + '.'
            : p.filling === 'cur' ? 'Копится, пока запас полон: +1 каждые ' + T.powerRegenSec + ' с.' : 'Резерв полон. Перенесите его в запас.';
          ui.text(resNote, L, Y + 114, { size: 10, col: C.sub });
          POWER_ROWS.forEach((row, i) => {
            const y = Y + 134 + i * 44, on = i === this.sel, m = limit(row, p), n = this.amt[i], sx = R - 160;
            c.fillStyle = on ? 'rgba(242,220,154,0.14)' : 'rgba(0,0,0,0.3)'; c.fillRect(L, y, R - L, 40);
            if (on) { c.strokeStyle = C.brass; c.lineWidth = 1; c.strokeRect(L + 0.5, y + 0.5, R - L - 1, 39); }
            ui.hit(L, y, sx - L - 4, 40, () => { if (this.sel !== i) { this.sel = i; ui.sfx('select'); } });
            G.itemIcon(c, row === 'res' ? 'power' : row, L + 6, y + 8, 24);
            const sub = row === 'res' ? 'Есть ' + H.fmt(p.res) + ' · 1 к 1' : row === 'fuel' ? 'Есть ' + p.fuel + ' · +' + T.powerPack + ' за штуку' : 'В этот час ' + p.bought + '/' + p.buyMax + (p.jadeNext ? ' · цена ' + p.jadeNext : '');
            ui.text(NAME[row], L + 38, y + 6, { size: 12, bold: true, col: m ? C.cream : C.dim });
            ui.text(sub, L + 38, y + 22, { size: 10, col: C.sub });
            ui.button(sx, y + 9, 22, 22, '−', () => { this.sel = i; this.step(-1); }, { disabled: !n, size: 12 });
            ui.text(row === 'res' ? H.fmt(n) : '×' + n, sx + 48, y + 5, { align: 'center', size: 12, bold: true, col: n ? C.cream : C.dim });
            ui.text('+' + gain(row, n), sx + 48, y + 22, { align: 'center', size: 9, col: n ? C.cyan : C.dim });
            ui.button(sx + 74, y + 9, 22, 22, '+', () => { this.sel = i; this.step(1); }, { disabled: n >= m, size: 12 });
            ui.button(sx + 102, y + 9, 56, 22, 'Макс', () => { this.sel = i; this.maxOut(); }, { disabled: !m || n >= m, size: 11 });
          });
          const row = POWER_ROWS[this.sel], n = this.amt[this.sel], cost = row === 'jade' && n ? g.powerJadeCost(n) : 0;
          ui.text('После обмена: ' + H.fmt(p.cur + gain(row, n)) + ' / ' + H.fmt(p.max), L, Y + 272, { size: 11, bold: true, col: C.cream });
          if (row === 'jade') ui.money(L, Y + 288, 'jade', (cost ? '−' + H.fmt(cost) + ' из ' : '') + H.fmt(g.state.jade), { size: 12, col: cost ? C.gold : C.sub });
          ui.button(R - 118, Y + 268, 118, 26, 'Обменять', () => this.apply(), { disabled: !n, size: 12, bold: true });
          ui.hints([['↑↓', 'Источник'], ['←→', 'Сколько'], ['Tab', 'Всё'], ['Enter', 'Обмен'], ['Esc', 'Закрыть']], X + WW / 2, Y + HH - 22, { align: 'center' });
        },
        key(k, code) {
          if (ui.listNav(this, k, POWER_ROWS.length)) return;
          if (k === 'left') this.step(-1);
          else if (k === 'right') this.step(1);
          else if (code === 'Tab') this.maxOut();
          else if (k === 'ok') this.apply();
          else if (k === 'back') ui.pop();
        }
      });
    },

    openBank(close) {
      const ui = this, g = this.game;
      const tabs = ['Враги', 'Слияния', 'Слухи', 'Прыжки', 'Сюжет'];
      this.push({
        tab: 0, sc: { top: 0 },
        setTab(i) { this.tab = i; this.sel = 0; this.sc = { top: 0 }; },
        rows() {
          const s = g.state;
          if (this.tab === 0) return Object.entries(H.ENEMIES).filter(([id]) => s.bank.enemies[id]).map(([id, d]) => ({ id, d, label: d.name, right: '×' + s.bank.enemies[id].kills, icon: (cc, ix, iy) => G.foeIcon(cc, d, ix, iy - 9, 18), iconW: 22 }));
          if (this.tab === 1) return Object.entries(H.FUSIONS).map(([id, f]) => ({ id, f, label: s.bank.fusions.includes(id) ? f.name : '???', right: f.members.map(m => H.CHARS[m].name.split(' ')[0]).join(' + ') }));
          if (this.tab === 2) return H.RUMORS.map(r => ({ r, label: s.flags[r.id] ? r.title : '???', right: s.flags[r.id] ? 'правда' : '—' }));
          if (this.tab === 4) return g.recapLog().map((x, i) => ({ x, label: x.title, right: String(i + 1) }));
          return s.warpLog.map(e => ({ e, label: warpName(e), col: RAR_TXT[e.rar], right: '★'.repeat(e.rar), rcol: G.RARITY[e.rar], icon: (cc, ix, iy) => warpIcon(cc, e, ix, iy - 8, 16, g), iconW: 22 }));
        },
        draw(c) {
          ui.win(20, 30, 600, 420, { title: 'Архив Экспресса' });
          ui.closeBtn(20 + 600 - 30, 30 + 8, () => this.key('back'));
          tabs.forEach((t, i) => ui.button(34 + i * 100, 48, 96, 22, t, () => this.setTab(i), { active: this.tab === i, size: 11 }));
          const rows = this.rows();
          ui.list(32, 80, 300, rows, this.sel, { rowH: 20, max: 17, size: 11, scroll: this.sc, onClick: i => { this.sel = i; } });
          const r = rows[this.sel];
          c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(342, 80, 264, 358);
          if (!r) { ui.text('Пусто.', 356, 94, { col: C.dim }); return; }
          if (this.tab === 0) {
            const b = g.state.bank.enemies[r.id], d = r.d;
            ui.platform(c, 474, 206, 60);
            G.drawEnemy(c, d, 474, 208, d.boss ? 120 : d.elite ? 116 : 110, { t: ui.t });
            G.foeIcon(c, d, 352, 88, 32);
            ui.wrap(d.name, 236, 11).slice(0, 2).forEach((l, i) => ui.text(l, 474, 214 + i * 12, { align: 'center', bold: true, col: C.gold, size: 11 }));
            ui.text('Уязвимости:', 356, 238, { size: 11 });
            d.weak.forEach((e, i) => G.elemIcon(c, e, 442 + i * 20, 245, 7));
            ui.text('Встречен: ' + b.seen + '   Побед: ' + b.kills, 356, 262, { size: 11, col: '#c8d8ff' });
            ui.text(d.boss ? 'Босс' : d.elite ? 'Элитный враг' : 'Обычный враг', 356, 280, { size: 11, col: '#c8d8ff' });
            const fam = H.CONTACT[d.fam];
            if (fam) {
              ui.text('Контакт: ' + fam.name, 356, 300, { size: 11, col: C.gold });
              const known = Object.entries(b.contacts || {});
              ui.wrap(known.length ? 'Исходы: ' + known.map(([m, n]) => ({ eager: 'интерес', happy: 'радость', scared: 'страх', angry: 'злость' }[m] || m) + '×' + n).join(', ') : 'Настроения ещё не изучены.', 240, 11).forEach((l, i) => ui.text(l, 356, 318 + i * 14, { size: 11, col: C.sub }));
              if (known.length) ui.wrap('Подсказка: ' + Object.entries(fam.react).filter(([, v]) => v === 'eager' || v === 'happy').map(([t2]) => TAG_NAME[t2]).join(', '), 240, 11).forEach((l, i) => ui.text(l, 356, 350 + i * 14, { size: 11, col: C.ok }));
            } else ui.text('На контакт не идёт.', 356, 300, { size: 11, col: C.bad });
          } else if (this.tab === 1) {
            const f = r.f, known = g.state.bank.fusions.includes(r.id);
            const n = f.members.length, gap = n > 2 ? 10 : 32, cs = Math.min(72, Math.floor((236 - gap * (n - 1)) / n));
            const cx0 = 474 - (n * cs + (n - 1) * gap) / 2, cy = 96 + (72 - cs);
            f.members.forEach((m, i) => ui.portraitCard(c, G.lookOf(m, g), cx0 + i * (cs + gap), cy, cs, { elem: H.CHARS[m].elem }));
            const who = { 2: 'обоих', 3: 'всех троих', 4: 'всех четверых' }[n] || 'всех';
            ui.wrap(known ? f.name : '??? — не открыто', 236, 13).slice(0, 2).forEach((l, i) => ui.text(l, 474, 184 + i * 16, { align: 'center', bold: true, serif: true, col: C.gold }));
            ui.wrap(known ? f.text : 'Возьмите ' + who + ' в команду, накопите им энергию и нажмите R в бою.', 236, 11).forEach((l, i) => ui.text(l, 356, 216 + i * 14, { size: 11 }));
          } else if (this.tab === 2) {
            if (g.state.flags[r.r.id]) { ui.wrap('«' + r.r.text + '»', 236, 11).forEach((l, i) => ui.text(l, 356, 96 + i * 14, { size: 11, col: '#fff0c0' })); ui.wrap(r.r.effect, 236, 11).forEach((l, i) => ui.text(l, 356, 200 + i * 14, { size: 11, col: C.ok })); }
            else ui.text('Этот слух ещё не распущен.', 356, 96, { size: 11, col: C.dim });
          } else if (this.tab === 4) {
            G.menuIcon(c, 'mission', 352, 88, 32);
            ui.text('Запись ' + r.right, 394, 90, { size: 10, col: C.sub });
            ui.wrap(r.x.title, 200, 13).slice(0, 2).forEach((l, i) => ui.text(l, 394, 103 + i * 15, { size: 13, bold: true, serif: true, col: C.gold }));
            c.fillStyle = C.brassDk; c.fillRect(352, 136, 244, 1);
            ui.wrap(r.x.text, 240, 11).forEach((l, i) => ui.text(l, 354, 146 + i * 14, { size: 11 }));
          } else {
            const e = r.e, [note, ncol] = warpNote(e);
            if (e.kind === 'char') ui.portraitCard(c, G.lookOf(e.id, g), 438, 94, 72, { elem: H.CHARS[e.id].elem, border: G.RARITY[e.rar] });
            else G.drawConeCard(c, e.id, 444, 92, 60, 84);
            ui.wrap(warpName(e), 236, 13).slice(0, 2).forEach((l, i) => ui.text(l, 474, 184 + i * 16, { align: 'center', bold: true, serif: true, size: 13, col: RAR_TXT[e.rar] }));
            ui.text('★'.repeat(e.rar), 474, 220, { align: 'center', col: G.RARITY[e.rar] });
            [['Прыжок №', String(e.n)], ['Итог', note, ncol], ['Гарант', warpPity(e)], ['Время', warpWhen(e)]].forEach(([k2, v, vc], i) => {
              ui.text(k2, 360, 248 + i * 20, { size: 11, col: C.sub });
              ui.text(v, 592, 248 + i * 20, { size: 11, align: 'right', col: vc || C.cream });
            });
            ui.hints([['Enter', 'Вся история']], 360, 420);
          }
        },
        key(k) {
          const rows = this.rows();
          if (ui.listNav(this, k, rows.length)) return;
          if (k === 'left') { this.setTab((this.tab + tabs.length - 1) % tabs.length); ui.sfx('select'); }
          if (k === 'right') { this.setTab((this.tab + 1) % tabs.length); ui.sfx('select'); }
          if (k === 'ok' && this.tab === 3 && rows.length) { ui.openWarpHistory(rows[this.sel].e.ban); return; }
          if (k === 'back' || (k === 'ok' && !rows.length)) { ui.screens.pop(); ui.sfx('cancel'); if (close) close(); }
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
