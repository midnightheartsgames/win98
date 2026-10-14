(function (S) {
  'use strict';
  const { esc, iconSVG, OBJECTS, FAMILIES, RH } = S;
  const G = S.UI.prototype;
  const SEED = 1999;
  const MUSIC_MODES = [['menu', 'Главное меню'], ['live', 'Режим жизни'], ['buy', 'Режим покупки'], ['build', 'Режим строительства'], ['map', 'Карта города'], ['cas', 'Создание семьи']];

  function plumbobSVG(w, h) {
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 60 90"><defs><linearGradient id="s3pbL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8f890"/><stop offset="1" stop-color="#2a9a2a"/></linearGradient><linearGradient id="s3pbR" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8ffd0"/><stop offset="1" stop-color="#48c038"/></linearGradient></defs>' +
      '<polygon points="30,2 4,45 30,52" fill="url(#s3pbL)"/><polygon points="30,2 56,45 30,52" fill="url(#s3pbR)"/><polygon points="4,45 30,88 30,52" fill="#1e7a1e"/><polygon points="56,45 30,88 30,52" fill="#2e9a2a"/>' +
      '<polyline points="30,2 30,88" stroke="rgba(255,255,255,.35)" stroke-width="1" fill="none"/><polygon points="30,2 4,45 30,88 56,45" fill="none" stroke="#0e4a0e" stroke-width="1.5"/></svg>';
  }
  function logoHTML(size) { return '<span style="display:inline-block;vertical-align:middle;margin-right:6px">' + plumbobSVG(size * 0.55, size * 0.82) + '</span><small>The</small>Sims<sup>3</sup>'; }

  G.showLoading = function () {
    this.mode = 'boot';
    const scr = document.createElement('div');
    scr.className = 's3-screen s3-load';
    scr.innerHTML = '<div class="box"><div class="gem">' + plumbobSVG(60, 90) + '</div><div class="logo"><small>The</small>Sims<sup>3</sup></div><div style="font:bold 11px Tahoma;letter-spacing:3px;color:#cfe8ff">ИЗДАНИЕ 2000 ГОДА</div><div class="prog"><i style="width:0%"></i></div><div class="line">' + esc(S.LOADING_LINES[0]) + '</div></div>';
    this.top.appendChild(scr);
    this.loadEl = scr;
    this.boot = { t: 0, step: 0, shown: 0, target: 0.08, line: 0, lineT: 0 };
  };

  G.bootTick = function (dt) {
    const b = this.boot;
    if (!b || !this.loadEl) return;
    b.t += dt;
    b.lineT += dt;
    if (b.lineT > 1.2) { b.lineT = 0; b.line++; this.loadEl.querySelector('.line').textContent = S.LOADING_LINES[b.line % S.LOADING_LINES.length]; }
    b.shown += (b.target - b.shown) * Math.min(1, dt * 3);
    this.loadEl.querySelector('.prog i').style.width = Math.round(b.shown * 100) + '%';
    if (b.step === 0 && b.t > 0.25) {
      b.step = 1;
      try { this.initGame(new S.Game({ seed: SEED })); }
      catch (e) { this.bootFail(e); return; }
      b.target = 0.55;
    } else if (b.step === 1 && b.t > 0.6) {
      b.step = 2;
      const w = this.root.clientWidth, h = this.root.clientHeight;
      this.r.resize(w, h);
      this.r.cam.tx = 78; this.r.cam.ty = 72; this.r.cam.setZoom(1); this.r.cam.s = S.ZOOMS[1];
      try { this.r.frame(0.016, { focusLot: -1, plumbob: false }); } catch (e) { this.bootFail(e); return; }
      b.target = 0.85;
    } else if (b.step === 2 && b.t > 1.4) {
      b.step = 3;
      b.target = 1;
    } else if (b.step === 3 && b.t > 2.3 && b.shown > 0.97) {
      this.loadEl.remove();
      this.loadEl = null;
      this.boot = null;
      this.showMenu();
    }
  };

  G.bootFail = function (e) {
    this.boot = null;
    const line = this.loadEl.querySelector('.line');
    line.style.cssText = 'height:auto;max-width:420px;text-align:center;color:#ffd0c8;font:bold 12px Tahoma;line-height:1.4';
    line.textContent = /webgl/i.test(String(e && e.message)) ? 'Не удалось запустить трёхмерную графику. Игре нужна видеокарта с поддержкой WebGL.' : 'Не удалось загрузить игру: ' + (e && e.message ? e.message : e);
  };

  G.menuCam = function (dt) {
    const cam = this.r.cam;
    this.menuT = (this.menuT || 0) + dt;
    const a = this.menuT * 0.012;
    cam.tx = 76 + Math.cos(a) * 34;
    cam.ty = 70 + Math.sin(a * 1.3) * 26;
  };

  G.leaveLive = function () {
    this.gdQueue = [];
    for (const d of this.dlgs.slice()) d.close();
    this.gdOpen = false;
    this.closePie();
    if (this.bm && (this.sub === 'buy' || this.sub === 'build')) this.exitBuild();
    if (this.sub === 'map' && this.exitMap) this.exitMap();
    this.sub = 'live';
    this.hudEl.innerHTML = '';
    this.el = null; this.tnsEl = null; this.queueEl = null; this.hudInner = null; this.toolbarEl = null;
    this.hideTip();
    this.clearPins();
  };

  G.showMenu = function () {
    if (!this.game) return;
    this.leaveLive();
    this.closeScreens();
    this.mode = 'menu';
    this.follow = false;
    this.r.cam.setZoom(1);
    this.r.wallMode = 'cut';
    const scr = document.createElement('div');
    scr.className = 's3-screen s3-menu';
    scr.innerHTML = '<div class="bg"></div><div class="card s3-panel"><div class="logo s3-logo">' + logoHTML(46) + '</div><div class="hh s3-inset"></div><div class="slots"></div><div class="tipbox s3-inset"></div><div class="play"></div><div class="opts"></div></div><div style="position:absolute;right:12px;bottom:8px;color:#fff;font:bold 10px Tahoma;text-shadow:0 1px 2px #000;opacity:.85">Издание 2000 года · Сансет Вэлли</div>';
    this.top.appendChild(scr);
    this.screen = scr;
    const slots = S.readSlots();
    if (!this.menuSel || !slots.some(s => s.id === this.menuSel)) this.menuSel = slots.length ? slots[0].id : null;
    this.renderMenu();
    if (this.audio) this.audio.modeMusic('menu');
  };

  G.renderMenu = function () {
    const scr = this.screen;
    if (!scr || this.mode !== 'menu') return;
    const slots = S.readSlots();
    const cur = slots.find(s => s.id === this.menuSel) || null;
    const hh = scr.querySelector('.hh');
    if (cur) {
      const d = cur.data;
      const house = (d.households || []).find(h => h.id === d.activeHH);
      const members = (d.sims || []).filter(s => s.hh === d.activeHH && !s.dead).slice(0, 5).map(x => new S.Sim(x));
      hh.innerHTML = '<div class="fam">' + members.map(m => '<img src="' + this.stage.portrait(m, 64) + '">').join('') + '</div><div class="info"><div class="s3-title" style="font-size:16px">' + esc(cur.name) + '</div><div class="s3-sub">' + esc(cur.lot || 'Без дома') + '</div><div><b>Бюджет:</b> ' + S.fmtMoney(house ? house.funds : 0) + '</div><div><b>В игре:</b> день ' + (S.dayOf(cur.t) + 1) + ', ' + esc(S.fmtClock(cur.t)) + '</div><div class="s3-sub">Сохранено ' + new Date(cur.saved).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</div><div class="s3-sub">' + members.map(m => esc(m.first)).join(', ') + '</div></div>';
    } else {
      hh.innerHTML = '<div class="fam" style="align-items:center">' + plumbobSVG(70, 105) + '</div><div class="info"><div class="s3-title" style="font-size:16px">Добро пожаловать в Сансет Вэлли!</div><div style="line-height:1.4">Создайте свою семью в редакторе или сыграйте за одну из десяти семей городка у моря. Работа, дружба, любовь и мечты всей жизни ждут своих симов.</div><div class="s3-sub">Нажмите «Новая игра», чтобы начать.</div></div>';
    }
    const sl = scr.querySelector('.slots');
    sl.innerHTML = '';
    for (const s of slots) {
      const d = document.createElement('div');
      d.className = 's3-slot' + (s.id === this.menuSel ? ' on' : '');
      d.innerHTML = (s.thumb ? '<img src="' + s.thumb + '">' : '<div style="display:grid;place-items:center;height:100%">' + iconSVG('m_house', 30) + '</div>') + '<div class="nm">' + esc(s.name) + '</div><div class="del" title="Удалить">✕</div>';
      d.onclick = () => { this.menuSel = s.id; if (this.audio) this.audio.ui('select'); this.renderMenu(); };
      d.ondblclick = () => this.loadSave(s);
      d.querySelector('.del').onclick = e => { e.stopPropagation(); this.confirm('Удалить сохранение?', '«' + s.name + '» будет удалено навсегда.', () => { S.deleteSlot(s.id); if (this.menuSel === s.id) this.menuSel = null; this.renderMenu(); }); };
      sl.appendChild(d);
    }
    const ng = document.createElement('div');
    ng.className = 'newg';
    ng.innerHTML = '<button class="s3-btn lg">' + iconSVG('ui_plus', 22) + '</button>Новая игра';
    ng.onclick = () => { if (this.audio) this.audio.ui('click'); this.newGameDialog(); };
    sl.appendChild(ng);
    const tb = scr.querySelector('.tipbox');
    const tip = S.TIPS[Math.floor(Math.random() * S.TIPS.length)];
    tb.innerHTML = '<span style="color:#d8a020">' + iconSVG('m_idea', 22) + '</span><div><b>Совет.</b> ' + esc(tip) + '</div>';
    const play = scr.querySelector('.play');
    play.innerHTML = '';
    const pb = document.createElement('button');
    pb.className = 's3-btn xl';
    pb.innerHTML = iconSVG('ui_check', 32);
    this.tipOn(pb, cur ? '<b>Играть</b>Продолжить «' + esc(cur.name) + '»' : '<b>Новая игра</b>');
    pb.onclick = () => { this.hideTip('el'); if (this.audio) this.audio.ui('click'); if (cur) this.loadSave(cur); else this.newGameDialog(); };
    play.appendChild(pb);
    const op = scr.querySelector('.opts');
    op.innerHTML = '';
    op.style.cssText = 'display:flex;gap:6px';
    const ob = document.createElement('button');
    ob.className = 's3-btn';
    ob.innerHTML = iconSVG('ui_gear', 18);
    this.tipOn(ob, '<b>Настройки</b>');
    ob.onclick = () => this.optionsDialog();
    op.appendChild(ob);
    const hb = document.createElement('button');
    hb.className = 's3-btn';
    hb.innerHTML = iconSVG('ui_help', 18);
    this.tipOn(hb, '<b>Управление</b>');
    hb.onclick = () => this.helpDialog();
    op.appendChild(hb);
    if (this.opts.onExit) {
      const xb = document.createElement('button');
      xb.className = 's3-btn';
      xb.innerHTML = iconSVG('ui_close', 16);
      this.tipOn(xb, '<b>Выйти из игры</b>');
      xb.onclick = () => this.opts.onExit();
      op.appendChild(xb);
    }
  };

  G.newGameDialog = function () {
    const box = document.createElement('div');
    box.className = 's3-grid';
    box.style.cssText = 'grid-template-columns:1fr 1fr;width:520px;max-width:100%';
    const card = (icon, title, text, fn) => {
      const c = document.createElement('div');
      c.className = 's3-card s3-inset';
      c.style.cssText = 'flex-direction:column;align-items:center;text-align:center;padding:16px 12px';
      c.innerHTML = '<span style="color:#2a5a9a">' + iconSVG(icon, 40) + '</span><div class="t" style="font-size:14px">' + esc(title) + '</div><div class="d">' + esc(text) + '</div>';
      c.onclick = () => { h.close(); fn(); };
      box.appendChild(c);
    };
    card('ui_simology', 'Создать семью', 'Придумайте симов в редакторе: внешность, одежду, черты характера и мечты. Потом выберите им дом.', () => this.newCASGame());
    card('m_house', 'Семьи Сансет Вэлли', 'Сыграйте за одну из десяти семей городка: богачей Ландграабов, загадочных Готов, молодожёнов Скоттов и других.', () => this.familyPicker());
    const h = this.dialog({ title: 'Новая игра', body: box });
  };

  G.freshGame = function () {
    const game = new S.Game({ seed: SEED });
    this.initGame(game);
    this.slotId = null;
    return game;
  };

  G.newCASGame = function () {
    const game = this.freshGame();
    this.startCAS({
      onDone: (members, links, family) => {
        const hh = game.newHousehold(family, members);
        game.linkHousehold(hh, links);
        game.playFamily(hh.id);
        for (const s of game.members(hh)) s.hidden = true;
        this.startMoveIn(hh);
      },
      onCancel: () => this.showMenu()
    });
  };

  G.familyPicker = function () {
    const game = this.freshGame();
    const box = document.createElement('div');
    box.className = 's3-grid';
    box.style.cssText = 'grid-template-columns:1fr 1fr;width:640px;max-width:100%';
    for (const hh of game.households.values()) {
      if (!hh.key) continue;
      const fam = FAMILIES.find(f => f.key === hh.key);
      const lot = game.lots[hh.lot];
      const ms = game.members(hh);
      const c = document.createElement('div');
      c.className = 's3-card s3-inset';
      c.style.cssText = 'flex-direction:column;gap:5px';
      c.innerHTML = '<div style="display:flex;gap:3px;flex-wrap:wrap">' + ms.map(m => '<img src="' + this.stage.portrait(m, 64) + '" title="' + esc(m.first + ', ' + S.AGE_INFO[m.age].name.toLowerCase()) + '" style="width:40px;height:40px;border-radius:7px;border:1.5px solid #6a9ad0;background:linear-gradient(#e8f6ff,#9cc8ee)">').join('') + '</div><div class="t">Семья ' + esc(hh.name) + '</div><div class="d">' + esc(fam ? fam.desc : '') + '</div><div class="d"><b>' + esc(lot ? lot.name : '') + '</b> · ' + S.fmtMoney(hh.funds) + '</div>';
      c.onclick = () => { dlg.close(); game.playFamily(hh.id); this.startLive(); };
      box.appendChild(c);
    }
    const dlg = this.dialog({ title: 'Выберите семью', body: box, onClose: () => { } });
  };

  G.startLive = function () {
    this.closeScreens();
    for (const d of this.dlgs.slice()) d.close();
    this.clearPins();
    this.mode = 'live';
    this.sub = 'live';
    this.buildHud();
    const g = this.game;
    g.speed = 1;
    const sim = g.selected();
    this.r.cam.setZoom(1);
    if (sim) this.centerOnSim(sim);
    this.follow = true;
    this.liveT = 0;
    this.tipN = 0;
    if (this.audio) this.audio.modeMusic('live');
    const hh = g.active();
    if (hh && !hh.introShown) {
      hh.introShown = true;
      if (this.settings.tips) setTimeout(() => { if (this.mode === 'live') this.addNote({ text: 'Добро пожаловать домой, семья ' + hh.name + '! Щёлкните по предмету или симу, чтобы увидеть, что можно сделать. Время: клавиши 1, 2, 3 и пробел.', icon: 'm_idea' }); }, 1200);
    }
  };

  G.liveTick = function (dt) {
    const g = this.game;
    this.liveT = (this.liveT || 0) + dt;
    if (this.settings.tips && this.liveT > 90 * (this.tipN + 1) && this.sub === 'live' && !this.dlgs.length) {
      this.tipN++;
      this.addNote({ text: S.TIPS[(this.tipN + 2) % S.TIPS.length], icon: 'm_idea', minor: true });
    }
    if (!this.audio || !this.r) return;
    this.lastBalloon = this.lastBalloon || new Map();
    for (const sim of g.sims.values()) {
      const b = sim.balloon;
      if (!b || sim.hidden) continue;
      if (this.lastBalloon.get(sim.id) === b) continue;
      this.lastBalloon.set(sim.id, b);
      if (this.sub === 'map') continue;
      const p = this.r.cam.toScreen(sim.x, sim.y, 1);
      const cx = this.r.cam.w / 2, cy = this.r.cam.h / 2;
      const d = Math.hypot(p[0] - cx, p[1] - cy) / Math.max(this.r.cam.w, this.r.cam.h);
      const vol = Math.max(0, 1 - d * 1.2) * [1, 0.7, 0.35, 0][this.r.cam.zoom];
      if (vol < 0.08) continue;
      const mood = b.bad ? 'angry' : b.icon === 'm_heart' || b.icon === 'm_kiss' ? 'love' : b.icon === 'm_laugh' ? 'laugh' : b.icon === 'm_angry' ? 'angry' : 'talk';
      this.audio.voice(sim, mood, vol);
    }
  };

  G.startMoveIn = function (hh) {
    this.closeScreens();
    this.leaveLive();
    this.mode = 'movein';
    this.moveHH = hh;
    const cam = this.r.cam;
    cam.setZoom(3);
    cam.tx = 80; cam.ty = 70;
    const scr = document.createElement('div');
    scr.className = 's3-toolbar s3-panel';
    scr.style.cssText = 'left:50%;top:10px;transform:translateX(-50%);align-items:center;gap:10px;padding:8px 14px;z-index:36';
    scr.innerHTML = iconSVG('m_house', 24) + '<div><div class="s3-title">Выберите дом для семьи ' + esc(hh.name) + '</div><div class="s3-sub">Бюджет: ' + S.fmtMoney(hh.funds) + '. Зелёные значки: дома и участки, которые вам по карману.</div></div>';
    const back = document.createElement('button');
    back.className = 's3-btn';
    back.innerHTML = iconSVG('ui_map', 18);
    this.tipOn(back, '<b>Вся карта</b>');
    back.onclick = () => { this.lookLot = null; this.r.cam.setZoom(3); };
    scr.appendChild(back);
    this.top.appendChild(scr);
    this.screen = scr;
    this.buildPins('movein');
    if (this.audio) this.audio.modeMusic('map');
  };

  G.lotRooms = function (lot) {
    const w = this.game.world;
    let beds = 0, baths = 0;
    for (const ob of w.objectsInLot(lot.id)) { const d = OBJECTS[ob.t]; if (d.bed) beds += d.double ? 2 : 1; if (d.toilet) baths++; }
    return { beds, baths };
  };

  G.clearPins = function () {
    if (this.mapEl) { this.mapEl.remove(); this.mapEl = null; }
    this.pins = null;
    this.mapCard = null;
  };

  G.pinFor = function (o) {
    const el = document.createElement('div');
    el.className = 'pin' + (o.sim ? ' sim' : '');
    el.innerHTML = '<div class="h" style="background:' + (o.color || '#3a7ac0') + '">' + (o.sim ? '<img src="' + this.stage.portrait(o.sim, 64) + '">' : iconSVG(o.icon, 16)) + '</div>' + (o.label ? '<div class="pr">' + esc(o.label) + '</div>' : '');
    if (o.tip) this.tipOn(el, o.tip);
    el.onclick = e => { e.stopPropagation(); if (this.audio) this.audio.ui('click'); o.click(e); };
    el.addEventListener('mousedown', e => e.stopPropagation());
    this.mapEl.appendChild(el);
    o.el = el;
    return o;
  };

  G.buildPins = function (kind) {
    this.clearPins();
    const g = this.game;
    const layer = document.createElement('div');
    layer.className = 's3-layer s3-map';
    this.mid.appendChild(layer);
    this.mapEl = layer;
    this.pins = [];
    this.mapKind = kind;
    this.mapFilter = this.mapFilter || { fam: true, work: true, venue: true, homes: true };
    const hh = g.active();
    for (const lot of g.lots) {
      const cx = lot.x + lot.w / 2, cy = lot.y + lot.h / 2;
      if (kind === 'movein') {
        if (lot.kind !== 'home' || lot.hh) continue;
        const price = lot.price || lot.value || 0;
        const empty = !lot.bp;
        this.pins.push(this.pinFor({ x: cx, y: cy, z: 3, icon: empty ? 'ui_terrain' : 'm_house', color: price <= this.moveHH.funds ? '#2a9a3a' : '#8a8c90', label: S.fmtMoney(price), cat: 'homes', tip: '<b>' + esc(lot.name) + '</b>' + esc(lot.address), click: () => this.moveCard(lot) }));
        continue;
      }
      if (lot.kind === 'rabbit') {
        const R = RH[lot.rh];
        const works = hh && g.members(hh).some(s => s.job && (S.CAREERS[s.job.c] || S.PART_TIME[s.job.c] || {}).place === lot.rh);
        this.pins.push(this.pinFor({ x: cx, y: cy, z: 5, icon: R.icon, color: works ? '#d8781a' : '#8a4ab0', cat: 'work', tip: '<b>' + esc(R.name) + '</b>' + esc(R.desc), click: () => this.lotCard(lot) }));
      } else if (lot.kind === 'venue') {
        this.pins.push(this.pinFor({ x: cx, y: cy, z: 3, icon: lot.icon || 'm_leaf', color: '#2a9a8a', cat: 'venue', tip: '<b>' + esc(lot.name) + '</b>' + esc(lot.desc || ''), click: () => this.lotCard(lot) }));
      } else if (lot.kind === 'home') {
        const own = hh && lot.id === hh.lot;
        const other = lot.hh ? g.households.get(lot.hh) : null;
        this.pins.push(this.pinFor({ x: cx, y: cy, z: 4, icon: 'm_house', color: own ? '#2a9a3a' : other ? '#3a7ac0' : '#8a8c90', cat: own ? 'fam' : 'homes', label: own ? 'Дом' : null, tip: '<b>' + esc(own ? 'Ваш дом' : other ? 'Семья ' + other.name : 'Продаётся') + '</b>' + esc(lot.address), click: () => this.lotCard(lot) }));
      }
    }
    if (kind === 'map' && hh) {
      for (const s of g.members(hh)) {
        if (s.dead) continue;
        this.pins.push(this.pinFor({ sim: s, cat: 'fam', color: '#9cc8ee', tip: () => '<b>' + esc(s.name) + '</b>' + esc(s.inside ? s.insideWhat || '' : s.queue[0] && !s.queue[0].def.hidden ? s.queue[0].name : 'Свободен'), click: () => { if (s.isBaby) this.centerOnSim(s); else this.selectSim(s); } }));
      }
      const filt = document.createElement('div');
      filt.className = 'filt s3-panel';
      for (const [k, icon, name] of [['fam', 'ui_plumbob', 'Моя семья'], ['work', 'm_briefcase', 'Работа и магазины'], ['venue', 'm_leaf', 'Общественные места'], ['homes', 'm_house', 'Жилые дома']]) {
        const b = document.createElement('button');
        b.className = 's3-btn sm' + (this.mapFilter[k] ? ' on' : '');
        b.innerHTML = iconSVG(icon, 13);
        this.tipOn(b, '<b>' + esc(name) + '</b>Показать или скрыть значки.');
        b.onclick = e => { e.stopPropagation(); this.mapFilter[k] = !this.mapFilter[k]; b.classList.toggle('on', this.mapFilter[k]); };
        filt.appendChild(b);
      }
      layer.appendChild(filt);
    }
    this.updatePins();
  };

  G.updatePins = function () {
    if (!this.pins || !this.r) return;
    const cam = this.r.cam, W = cam.w, H = cam.h;
    for (const p of this.pins) {
      let x = p.x, y = p.y, z = p.z || 0;
      if (p.sim) {
        const s = p.sim;
        if (s.inside !== null && s.inside !== undefined && this.game.lots[s.inside]) { const l = this.game.lots[s.inside]; x = l.x + l.w / 2 + 1.5; y = l.y + l.h / 2 + 1.5; z = 6; }
        else { x = s.x; y = s.y; z = 2.5; }
      }
      const q = cam.toScreen(x, y, z);
      const vis = (!p.cat || !this.mapFilter || this.mapFilter[p.cat] !== false) && q[0] > -30 && q[1] > -30 && q[0] < W + 30 && q[1] < H + 30 && !(p.sim && p.sim.dead);
      p.el.style.display = vis ? '' : 'none';
      if (vis) { p.el.style.left = Math.round(q[0]) + 'px'; p.el.style.top = Math.round(q[1]) + 'px'; }
    }
    if (this.mapCard && this.mapCard.lot) {
      const l = this.mapCard.lot;
      const q = cam.toScreen(l.x + l.w / 2, l.y + l.h / 2, 4);
      const el = this.mapCard.el;
      el.style.left = Math.round(Math.max(6, Math.min(W - 262, q[0] + 22))) + 'px';
      el.style.top = Math.round(Math.max(6, Math.min(H - el.offsetHeight - 6, q[1] - 40))) + 'px';
    }
  };

  G.closeMapCard = function () { if (this.mapCard) { this.mapCard.el.remove(); this.mapCard = null; } };

  G.openMapCard = function (lot, html, actions) {
    this.closeMapCard();
    const el = document.createElement('div');
    el.className = 's3-mapcard s3-panel';
    el.innerHTML = html;
    el.addEventListener('mousedown', e => e.stopPropagation());
    const x = document.createElement('button');
    x.className = 's3-btn sm s3-x';
    x.innerHTML = iconSVG('ui_close', 12);
    x.onclick = () => this.closeMapCard();
    el.appendChild(x);
    const acts = document.createElement('div');
    acts.style.cssText = 'display:flex;flex-direction:column;gap:4px';
    for (const a of actions) {
      const b = document.createElement('button');
      b.className = 's3-pill';
      b.textContent = a.label;
      if (a.disabled) { b.disabled = true; b.title = a.disabled; }
      b.onclick = () => a.fn(b, acts);
      acts.appendChild(b);
    }
    el.appendChild(acts);
    (this.mapEl || this.top).appendChild(el);
    this.mapCard = { el, lot };
    this.updatePins();
  };

  G.moveCard = function (lot) {
    const hh = this.moveHH;
    const price = lot.price || lot.value || 0;
    const rooms = this.lotRooms(lot);
    const html = '<div class="s3-title">' + esc(lot.name) + '</div><div class="s3-sub">' + esc(lot.address) + '</div><div><b>Цена:</b> ' + S.fmtMoney(price) + '</div><div><b>Участок:</b> ' + lot.w + ' × ' + lot.h + (lot.bp ? ', кроватей: ' + rooms.beds + ', ванных: ' + rooms.baths : ', пустой участок') + '</div><div><b>Останется:</b> ' + S.fmtMoney(hh.funds - price) + '</div>';
    const acts = [
      { label: 'Купить и переехать', disabled: hh.funds < price ? 'Не хватает денег' : null, fn: () => this.doMoveIn(lot) },
      { label: 'Посмотреть поближе', fn: () => { const cam = this.r.cam; cam.tx = lot.x + lot.w / 2; cam.ty = lot.y + lot.h / 2; cam.setZoom(1); this.closeMapCard(); this.lookLot = lot; } }
    ];
    this.openMapCard(lot, html, acts);
  };

  G.doMoveIn = function (lot) {
    const g = this.game, hh = this.moveHH;
    const res = g.moveInto(hh, lot.id);
    if (res !== true) { this.hint(res); return; }
    for (const s of g.members(hh)) s.hidden = false;
    this.moveHH = null;
    this.startLive();
    this.addNote({ text: 'Семья ' + hh.name + ' переехала: ' + lot.name + '. Осталось ' + S.fmtMoney(hh.funds) + '. Режимы покупки и строительства помогут обустроить дом.', icon: 'm_house' });
  };

  G.lotCard = function (lot) {
    const g = this.game, sim = g.selected();
    let html = '', target = null;
    if (lot.kind === 'rabbit') {
      const R = RH[lot.rh];
      html = '<div class="s3-title">' + esc(R.name) + '</div><div class="s3-sub">' + esc(lot.address) + '</div><div style="line-height:1.35">' + esc(R.desc) + '</div>';
      target = { kind: 'obj', ob: g.world.objectsInLot(lot.id, o => OBJECTS[o.t].rabbit)[0] };
      if (!target.ob) target = { kind: 'lot', lot: lot.id };
    } else {
      const other = lot.hh ? g.households.get(lot.hh) : null;
      html = '<div class="s3-title">' + esc(lot.name) + '</div><div class="s3-sub">' + esc(lot.address) + '</div>' + (lot.desc ? '<div style="line-height:1.35">' + esc(lot.desc) + '</div>' : '') + (other ? '<div>Здесь живёт семья ' + esc(other.name) + '.</div>' : lot.kind === 'home' ? '<div>Дом продаётся: ' + S.fmtMoney(lot.price || lot.value || 0) + '.</div>' : '');
      target = { kind: 'lot', lot: lot.id };
    }
    const acts = [];
    const hh = g.active();
    if (sim && !sim.dead) {
      if (hh && lot.id === hh.lot) {
        acts.push({ label: 'Пойти домой', fn: () => { this.doEntry(sim, { key: 'go_home', target: sim }); this.closeMapCard(); } });
      } else {
        let entries = g.menuFor(sim, target);
        if (entries.length === 1 && entries[0].sub && entries[0].sub.length) entries = entries[0].sub;
        for (const en of entries) {
          acts.push({
            label: en.label.replace(/\.\.\.$/, ''), disabled: en.disabled, fn: (b, box) => {
              if (en.sub && en.sub.length) {
                box.innerHTML = '';
                for (const s2 of en.sub) { const bb = document.createElement('button'); bb.className = 's3-pill'; bb.textContent = s2.label; if (s2.disabled) { bb.disabled = true; bb.title = s2.disabled; } bb.onclick = () => { this.doEntry(sim, s2); this.closeMapCard(); }; box.appendChild(bb); }
                return;
              }
              this.doEntry(sim, en);
              this.closeMapCard();
            }
          });
        }
      }
    }
    acts.push({ label: 'Показать участок', fn: () => { this.closeMapCard(); this.setSub('live'); const cam = this.r.cam; cam.tx = lot.x + lot.w / 2; cam.ty = lot.y + lot.h / 2; this.follow = false; } });
    this.openMapCard(lot, html + (sim ? '<div class="s3-sub">Действия для: <b>' + esc(sim.first) + '</b></div>' : ''), acts);
  };

  G.enterMap = function () {
    const cam = this.r.cam;
    this.mapPrevZoom = cam.zoom;
    cam.setZoom(3);
    this.follow = false;
    this.buildPins('map');
  };

  G.exitMap = function () {
    this.closeMapCard();
    this.clearPins();
  };

  G.mapClick = function (x, y, btn) {
    this.closeMapCard();
    if (this.mode === 'movein' && btn === 0) return;
  };

  G.optionsDialog = function () {
    const st = this.settings;
    const box = document.createElement('div');
    box.className = 's3-opts';
    box.style.cssText = 'width:470px;max-width:100%';
    const tabs = [['gfx', 'Графика'], ['snd', 'Звук'], ['game', 'Игра'], ['cam', 'Камера'], ['music', 'Музыка']];
    let tab = this.optTab || 'snd';
    const apply = () => { this.saveSettings(); this.applySettings(); };
    const render = () => {
      this.optTab = tab;
      box.innerHTML = '<div class="tabs"></div><div class="s3-inset" style="margin-top:8px;padding:10px 12px;min-height:210px"></div>';
      const tb = box.firstChild, pane = box.lastChild;
      for (const [k, name] of tabs) { const b = document.createElement('button'); b.className = 's3-pill' + (k === tab ? ' on' : ''); b.textContent = name; b.onclick = () => { tab = k; render(); if (this.audio) this.audio.ui('tab'); }; tb.appendChild(b); }
      const row = (label, ctrl, extra) => { const r = document.createElement('div'); r.className = 'row'; r.innerHTML = '<div class="lbl">' + esc(label) + '</div>'; r.appendChild(ctrl); const e = document.createElement('div'); if (extra) e.appendChild(extra); r.appendChild(e); pane.appendChild(r); return r; };
      const toggle = (key, fn) => { const c = document.createElement('div'); c.className = 's3-chk' + (st[key] ? ' on' : ''); c.onclick = () => { st[key] = !st[key]; c.classList.toggle('on', st[key]); if (fn) fn(); apply(); }; return c; };
      const pick = (key, opts) => { const c = document.createElement('div'); c.className = 's3-choice'; c.style.gridTemplateColumns = 'repeat(' + opts.length + ',1fr)'; for (const [v, t] of opts) { const d = document.createElement('div'); d.className = 'c' + (st[key] === v ? ' on' : ''); d.textContent = t; d.onclick = () => { st[key] = v; apply(); render(); }; c.appendChild(d); } return c; };
      if (tab === 'snd') {
        for (const [k, m, label] of [['voices', 'muteVoices', 'Голоса'], ['sfx', 'muteSfx', 'Звуковые эффекты'], ['music', 'muteMusic', 'Музыка'], ['ambient', 'muteAmbient', 'Окружение']]) {
          const sl = document.createElement('div');
          sl.className = 's3-slider';
          sl.innerHTML = '<input type="range" min="0" max="100" value="' + Math.round(st[k] * 100) + '">';
          sl.querySelector('input').oninput = e => { st[k] = e.target.value / 100; apply(); };
          sl.querySelector('input').onchange = () => { if (this.audio) this.audio.ui(k === 'voices' ? 'select' : 'click'); if (k === 'voices' && this.audio && this.game) { const s = this.game.selected(); if (s) this.audio.voice(s, 'happy', 1); } };
          const mute = document.createElement('div');
          mute.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:10px';
          const chk = toggle(m);
          mute.appendChild(chk);
          mute.appendChild(document.createTextNode('Выкл.'));
          row(label, sl, mute);
        }
      } else if (tab === 'gfx') {
        row('Тени под предметами', toggle('shadows'));
        row('Деревья у сима прозрачны', toggle('treeFade'));
        row('Всплывающие подсказки', toggle('hoverTips'));
      } else if (tab === 'game') {
        row('Свобода воли', pick('autonomy', [['full', 'Полная'], ['partial', 'Частичная'], ['off', 'Нет']]));
        row('Старение', toggle('aging'));
        row('Длина жизни', pick('lifespan', [['short', 'Короткая'], ['normal', 'Обычная'], ['long', 'Длинная']]));
        row('Жизнь соседей идёт', toggle('story'));
        row('Желания', toggle('wishes'));
        row('Советы', toggle('tips'));
      } else if (tab === 'cam') {
        row('Прокрутка у краёв', toggle('edgeScroll'));
        row('Обратный поворот', toggle('invertRot'));
        const d = document.createElement('div');
        d.className = 's3-sub';
        d.style.cssText = 'margin-top:10px;line-height:1.4';
        d.textContent = 'Камера: перетаскивание мышью, стрелки или WASD. Поворот: Q и E. Приближение: колесо мыши, Z и X.';
        pane.appendChild(d);
      } else if (tab === 'music') {
        const mm = st.musicModes || (st.musicModes = {});
        for (const [k, label] of MUSIC_MODES) {
          const c = document.createElement('div');
          c.className = 's3-chk' + (mm[k] !== false ? ' on' : '');
          c.onclick = () => { mm[k] = mm[k] === false; c.classList.toggle('on', mm[k] !== false); apply(); if (this.audio) this.audio.modeMusic(this.mode === 'live' ? this.sub : this.mode === 'movein' ? 'map' : this.mode); };
          row(label, c);
        }
      }
    };
    render();
    this.dialog({
      title: 'Настройки', body: box, buttons: [
        { label: 'По умолчанию', fn: () => { Object.assign(this.settings, JSON.parse(JSON.stringify(S.SETTINGS_DEFAULTS))); apply(); render(); return false; } },
        { label: 'Готово' }
      ]
    });
  };

  G.applySettings = function () {
    const st = this.settings, g = this.game;
    if (g) { g.opts.autonomy = st.autonomy; g.opts.aging = st.aging; g.opts.lifespan = st.lifespan; g.opts.story = st.story; g.opts.wishes = st.wishes; g.opts.tips = st.tips; }
    if (this.r) this.r.noShadows = !st.shadows;
    if (this.audio) { this.audio.setVolumes(st); this.audio.modeMusic(this.mode === 'live' ? this.sub : this.mode === 'movein' ? 'map' : this.mode); }
  };

  G.saveThumb = function () {
    try {
      const sel = this.game.selected();
      const cam = this.r.cam;
      const keep = [cam.tx, cam.ty, cam.zoom, cam.s];
      if (sel && !sel.hidden) { cam.tx = sel.x; cam.ty = sel.y; }
      this.r.frame(0, { focusLot: this.focusLot(), plumbob: false });
      const c = document.createElement('canvas');
      c.width = 172; c.height = 144;
      const src = this.r.canvas;
      const k = Math.min(src.width / 172, src.height / 144);
      c.getContext('2d').drawImage(src, (src.width - 172 * k) / 2, (src.height - 144 * k) / 2, 172 * k, 144 * k, 0, 0, 172, 144);
      [cam.tx, cam.ty] = keep;
      return c.toDataURL('image/jpeg', 0.72);
    } catch (e) { return null; }
  };

  G.quickSave = function (verbose) {
    if (!this.game || this.mode !== 'live') return;
    const thumb = this.saveThumb();
    const id = S.saveSlot(this.game, this.slotId, thumb);
    if (!id) { this.dialog({ title: 'Не удалось сохранить', body: '<div style="width:320px;text-align:center;line-height:1.4">Не хватает места для сохранения. Удалите старые сохранения в главном меню.</div>', buttons: [{ label: 'Понятно' }] }); return false; }
    this.slotId = id;
    this.menuSel = id;
    this.hint('Игра сохранена');
    if (this.audio) this.audio.ui('save');
    if (verbose) this.addNote({ text: 'Игра сохранена. Семья ' + this.game.active().name + ' ждёт вас в главном меню.', icon: 'ui_save', minor: true });
    return true;
  };

  G.loadSave = function (entry) {
    let game;
    try { game = S.Game.fromSave(entry.data); }
    catch (e) { this.dialog({ title: 'Ошибка загрузки', body: '<div style="width:320px;text-align:center">Сохранение повреждено и не может быть загружено.</div>', buttons: [{ label: 'Жаль' }] }); return; }
    this.initGame(game);
    this.slotId = entry.id;
    this.menuSel = entry.id;
    if (!game.active()) { this.showMenu(); return; }
    this.startLive();
  };

  Object.assign(S, { SIMS3_SEED: SEED, plumbobSVG });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
