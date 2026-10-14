(function (G) {
  'use strict';
  const { T, clamp, fmtMoney, fmtTime, WEAPONS, WEAPON_ORDER, RADIO, NEWS, CHAPTERS, CHARACTERS, VEHICLES } = G;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SAVE_KEY = 'gta90_saves';
  const SET_KEY = 'gta90_settings';
  const STEP = 1 / 60;
  const DEFAULTS = { sfx: 0.7, music: 0.45, scheme: 'tank', density: 1, fps: false, radio: 1 };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ControlLeft: 'fire', ControlRight: 'fire', Space: 'space', ShiftLeft: 'walk', ShiftRight: 'walk', KeyH: 'horn'
  };
  const EDGES = { Enter: 'enter', NumpadEnter: 'enter', KeyF: 'enter', KeyE: 'next', Tab: 'next', KeyQ: 'prev', KeyR: 'radio', KeyT: 'taxi', KeyM: 'map', Escape: 'pause', KeyP: 'pause', Minus: 'zoomOut', Equal: 'zoomIn', NumpadSubtract: 'zoomOut', NumpadAdd: 'zoomIn', F1: 'help' };
  const CHEATS = { NOCOPS: 'nocops', ARSENAL: 'arsenal', VOLGA: 'volga', BESSMERTIE: 'god', TANK: 'tank', DENGI: 'money' };

  function drawPortrait(cv, ch, idx) {
    const x = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    x.fillStyle = '#d8d4c8'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(40,40,40,0.35)'; x.lineWidth = 1;
    x.font = '8px Arial'; x.fillStyle = 'rgba(40,40,40,0.5)';
    for (let k = 0; k < 8; k++) { const y = 10 + k * (h - 20) / 8; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); x.fillText(String(190 - k * 5), 3, y - 2); }
    x.save();
    x.translate(w / 2, h * 0.52);
    const s = w / 110; x.scale(s, s);
    x.fillStyle = ch.shirt; x.beginPath(); x.ellipse(0, 52, 44, 26, 0, Math.PI, 0); x.fill();
    x.fillStyle = ch.skin; x.fillRect(-9, 8, 18, 18);
    x.beginPath(); x.ellipse(0, -4, 20, 25, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = ch.hair;
    if (ch.fem) { x.beginPath(); x.ellipse(0, -12, 23, 20, 0, Math.PI, 0); x.fill(); x.fillRect(-23, -12, 8, 34); x.fillRect(15, -12, 8, 34); }
    else if (idx === 2) { x.fillRect(-18, -28, 36, 7); }
    else { x.beginPath(); x.ellipse(0, -18, 21, 13, 0, Math.PI, 0); x.fill(); x.fillRect(-21, -20, 5, 12); x.fillRect(16, -20, 5, 12); }
    x.fillStyle = '#20180f'; x.fillRect(-10, -6, 6, 3); x.fillRect(4, -6, 6, 3);
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(-2, -2, 3, 8);
    x.fillStyle = '#6a3020'; x.fillRect(-6, 11, 12, 2.5);
    if (idx === 3) { x.fillStyle = '#101010'; x.fillRect(-13, -8, 26, 6); }
    if (idx === 1) { x.fillStyle = '#e0a020'; x.fillRect(-20, 30, 40, 4); }
    x.restore();
    x.fillStyle = '#101010'; x.fillRect(w * 0.18, h - 30, w * 0.64, 22);
    x.fillStyle = '#f0f0f0'; x.font = 'bold 11px Courier New'; x.textAlign = 'center';
    x.fillText('ГУВД СВЕРДЛОВСК  №' + (1904 + idx * 37), w / 2, h - 15);
  }

  class UI {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      root.classList.add('g90');
      root.tabIndex = 0;
      root.innerHTML = '<canvas class="g90-cv"></canvas><div class="g90-layer"></div>';
      this.cv = root.querySelector('.g90-cv');
      this.layer = root.querySelector('.g90-layer');
      this.settings = this.loadSettings();
      this.audio = new G.Audio();
      this.audio.setVolumes(this.settings.sfx, this.settings.music);
      this.city = G.getCity();
      this.r = new G.Renderer(this.cv, this.city);
      this.keys = {}; this.edges = {};
      this.cam = { x: 0, y: 0, zoom: 0.9 };
      this.zoomMul = 1;
      this.acc = 0;
      this.last = performance.now();
      this.fpsT = 0; this.fpsN = 0; this.fps = 0;
      this.cheatBuf = '';
      this.station = this.settings.radio;
      this.destroyed = false;
      this.bindInput();
      this.resize();
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(root);
      this.showTitle();
      this.frame = this.frame.bind(this);
      this.raf = requestAnimationFrame(this.frame);
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      this.audio.close();
      this.root.innerHTML = '';
    }

    isActive() { return !this.opts.isActive || this.opts.isActive(); }

    loadSettings() {
      try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(SET_KEY) || '{}')); }
      catch (e) { return Object.assign({}, DEFAULTS); }
    }
    saveSettings() { try { localStorage.setItem(SET_KEY, JSON.stringify(this.settings)); } catch (e) { return; } }
    loadSaves() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch (e) { return {}; } }
    writeSaves(s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }

    resize() {
      const w = Math.max(320, this.root.clientWidth), h = Math.max(240, this.root.clientHeight);
      this.W = w; this.H = h;
      this.r.resize(w, h);
    }

    bindInput() {
      const root = this.root;
      root.addEventListener('keydown', e => this.onKey(e, true));
      root.addEventListener('keyup', e => this.onKey(e, false));
      root.addEventListener('blur', () => { this.keys = {}; });
      root.addEventListener('mousedown', () => { root.focus({ preventScroll: true }); this.audio.resume(); });
      this.cv.addEventListener('contextmenu', e => e.preventDefault());
    }

    onKey(e, down) {
      if (!this.isActive()) return;
      this.audio.resume();
      const code = e.code;
      if (this.screen !== 'game' || this.overlay) {
        if (down && this.menuKey && this.menuKey(e) !== false) e.preventDefault();
        if (!down) this.keys = {};
        return;
      }
      if (KEYMAP[code]) { this.keys[KEYMAP[code]] = down; e.preventDefault(); }
      if (down && !e.repeat) {
        if (EDGES[code]) { this.edges[EDGES[code]] = true; e.preventDefault(); }
        if (/^Digit[1-6]$/.test(code)) this.edges.slot = +code.slice(5);
        if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) {
          this.cheatBuf = (this.cheatBuf + e.code.replace('Key', '')).slice(-12);
          for (const [k, v] of Object.entries(CHEATS)) if (this.cheatBuf.endsWith(k)) { this.cheat(v); this.cheatBuf = ''; }
        }
      }
      if (code === 'Tab' || code === 'Space' || code.startsWith('Arrow')) e.preventDefault();
    }

    cheat(k) {
      const g = this.game;
      if (!g || !g.world) return;
      const w = g.world, p = w.player;
      if (k === 'nocops') w.setWanted(0);
      if (k === 'arsenal') { for (const id of WEAPON_ORDER) if (id !== 'fist') p.weapons[id] = (p.weapons[id] || 0) + WEAPONS[id].pickup * 3; p.armor = 100; }
      if (k === 'volga' || k === 'tank') { const a = p.car ? p.car.a : p.a; w.spawnCar(k === 'tank' ? 't34' : 'gaz3102', w.px + Math.cos(a) * 70, w.py + Math.sin(a) * 70, a, { parked: true }); }
      if (k === 'god') w.god = !w.god;
      if (k === 'money') g.prog.score += 10000;
      g.msg('Чит-код принят' + (k === 'god' ? (w.god ? ': бессмертие' : ': бессмертие выключено') : ''), 'info');
      g.sfx('pickup');
    }

    input() {
      const k = this.keys, e = this.edges;
      const inCar = this.game && this.game.world.player.car;
      const inp = {
        up: !!k.up, down: !!k.down, left: !!k.left, right: !!k.right,
        fire: !!k.fire || (!inCar && !!k.space), hand: !!inCar && !!k.space, walk: !!k.walk, horn: !!k.horn,
        enter: !!e.enter, next: !!e.next, prev: !!e.prev, slot: e.slot || 0, taxi: !!e.taxi, scheme: this.settings.scheme
      };
      return inp;
    }

    frame(now) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(this.frame);
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.fpsT += dt; this.fpsN++;
      if (this.fpsT >= 1) { this.fps = this.fpsN / this.fpsT; this.fpsT = 0; this.fpsN = 0; }
      if (this.screen === 'title' || this.screen === 'chars') this.titleFrame(dt);
      else if (this.screen === 'game') this.gameFrame(dt);
      else if (this.screen === 'intro') this.introFrame(dt);
      else { const x = this.r.x; x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#000'; x.fillRect(0, 0, this.W, this.H); }
    }

    titleWorld() {
      if (this.tw) return this.tw;
      const pl = this.city.places.sq1905;
      this.tw = new G.World(this.city, { seed: 9, spawn: pl, density: 1.2 });
      this.tw.player.invisible = true;
      this.tw.god = true;
      this.tw.freeze = 0;
      this.twCar = null;
      this.cam.x = pl.x; this.cam.y = pl.y;
      for (let k = 0; k < 120; k++) this.tw.step(STEP, {});
      return this.tw;
    }

    titleFrame(dt) {
      const w = this.titleWorld();
      w.viewR = Math.hypot(this.W, this.H) / 2 / this.cam.zoom;
      this.acc += dt;
      let n = 0;
      while (this.acc >= STEP && n < 3) { this.acc -= STEP; n++; w.step(STEP, {}); }
      if (n === 3) this.acc = 0;
      let c = this.twCar;
      if (!c || c.removed || c.dead || !c.driver || (this.twT = (this.twT || 0) + dt) > 25) {
        this.twT = 0;
        const cands = w.cars.filter(k => k.driver && !k.dead && k.ai.mode === 'traffic' && Math.hypot(k.x - this.cam.x, k.y - this.cam.y) < 700);
        c = this.twCar = cands.length ? cands[Math.floor(Math.random() * cands.length)] : null;
      }
      if (c) {
        this.cam.x += (c.x + c.vx * 0.6 - this.cam.x) * Math.min(1, dt * 1.6);
        this.cam.y += (c.y + c.vy * 0.6 - this.cam.y) * Math.min(1, dt * 1.6);
      }
      this.cam.zoom += (0.8 - this.cam.zoom) * Math.min(1, dt);
      w.player.x = this.cam.x; w.player.y = this.cam.y;
      this.r.draw(w, this.cam, { dt });
      const x = this.r.x;
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, 0, this.W, this.H);
    }

    setLayer(html, cls) {
      this.layer.className = 'g90-layer' + (cls ? ' g90-l-' + cls : '');
      this.layer.innerHTML = html;
      this.menuKey = null;
    }

    listNav(sel, onPick) {
      const items = [...this.layer.querySelectorAll(sel)];
      let idx = Math.max(0, items.findIndex(i => i.classList.contains('on')));
      const set = i => { items.forEach(el => el.classList.remove('on')); idx = (i + items.length) % items.length; items[idx].classList.add('on'); };
      if (items.length) set(idx);
      items.forEach((el, i) => {
        el.addEventListener('mouseenter', () => set(i));
        el.addEventListener('click', () => { if (!el.classList.contains('off')) { this.audio.sfx('click'); onPick(el.dataset.a, el); } });
      });
      this.menuKey = e => {
        if (e.code === 'ArrowDown' || e.code === 'KeyS') { set(idx + 1); this.audio.sfx('click'); return true; }
        if (e.code === 'ArrowUp' || e.code === 'KeyW') { set(idx - 1); this.audio.sfx('click'); return true; }
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') { const el = items[idx]; if (el && !el.classList.contains('off')) { this.audio.sfx('click'); onPick(el.dataset.a, el); } return true; }
        if (e.code === 'Escape' && this.onBack) { this.onBack(); return true; }
        return false;
      };
    }

    showTitle() {
      this.screen = 'title';
      this.overlay = null;
      this.game = null;
      const saves = this.loadSaves();
      const hasAuto = !!saves.auto;
      this.onBack = null;
      this.setLayer(`
        <div class="g90-paper">
          <div class="g90-mast">ВЕЧЕРНИЙ СВЕРДЛОВСК</div>
          <div class="g90-dateline"><span>№ 205 (9 618)</span><span>Понедельник, 3 сентября 1990 г.</span><span>Цена 5 коп.</span></div>
          <h1 class="g90-head">GRAND THEFT AUTO<b>ЕКАТЕРИНБУРГ '90</b></h1>
          <p class="g90-lead">В центре пропадают «Волги», на рынке делят прилавки, а горсовет спорит о новом старом имени города.</p>
          <ul class="g90-menu">
            <li data-a="continue" class="${hasAuto ? '' : 'off'}">Продолжить <small>${hasAuto ? esc(saves.auto.label) : 'нет сохранений'}</small></li>
            <li data-a="new">Новая игра</li>
            <li data-a="load">Загрузить</li>
            <li data-a="settings">Настройки</li>
            <li data-a="help">Управление</li>
            <li data-a="exit">Выход</li>
          </ul>
          <div class="g90-foot">Свердловск · Екатеринбург · 1990 &nbsp;|&nbsp; Отдел происшествий: стр. 3</div>
        </div>`, 'title');
      this.listNav('.g90-menu li', a => {
        if (a === 'continue') this.loadGame(saves.auto.prog);
        if (a === 'new') this.showChars();
        if (a === 'load') this.showSaves(false, () => this.showTitle());
        if (a === 'settings') this.showSettings(() => this.showTitle());
        if (a === 'help') this.showHelp(() => this.showTitle());
        if (a === 'exit') { if (this.opts.onExit) this.opts.onExit(); }
      });
    }

    showChars() {
      this.screen = 'chars';
      this.setLayer(`
        <div class="g90-files">
          <h2>Кем будешь? <small>Личные дела ГУВД Свердловского облисполкома</small></h2>
          <div class="g90-cards">${CHARACTERS.map((c, i) => `
            <div class="g90-card" data-a="${i}">
              <div class="g90-tab">ДЕЛО № ${1904 + i * 37}</div>
              <canvas width="150" height="170"></canvas>
              <b>${esc(c.name)}</b>
              <p>${esc(c.bio)}</p>
            </div>`).join('')}</div>
          <div class="g90-hint">← → выбор · Enter — в Свердловск · Esc — назад</div>
        </div>`, 'files');
      const cards = [...this.layer.querySelectorAll('.g90-card')];
      cards.forEach((el, i) => drawPortrait(el.querySelector('canvas'), CHARACTERS[i], i));
      let idx = 0;
      const set = i => { idx = (i + cards.length) % cards.length; cards.forEach((c, k) => c.classList.toggle('on', k === idx)); };
      set(0);
      cards.forEach((el, i) => { el.addEventListener('mouseenter', () => set(i)); el.addEventListener('click', () => this.newGame(i)); });
      this.menuKey = e => {
        if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'ArrowDown') { set(idx + 1); this.audio.sfx('click'); return true; }
        if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'ArrowUp') { set(idx - 1); this.audio.sfx('click'); return true; }
        if (e.code === 'Enter' || e.code === 'Space') { this.newGame(idx); return true; }
        if (e.code === 'Escape') { this.showTitle(); return true; }
        return false;
      };
    }

    newGame(i) {
      this.game = new G.Game({ density: this.settings.density });
      this.game.newGame(i);
      this.tw = null;
      this.autosave();
      this.showIntro();
    }

    loadGame(prog) {
      this.game = new G.Game({ density: this.settings.density });
      this.game.load(prog);
      this.tw = null;
      this.showIntro();
    }

    showIntro() {
      const g = this.game, ch = g.chapter;
      this.screen = 'intro';
      this.introT = 0;
      const text = G.genderize(ch.intro, g.fem).replace(/\{([^}]*)\}/g, '<b>$1</b>');
      this.setLayer(`
        <div class="g90-intro">
          <div class="g90-chapter">ГЛАВА ${ch.num}</div>
          <h2>${esc(ch.title)}</h2>
          <div class="g90-date">${esc(g.prog.renamed ? ch.date.replace('Свердловск', 'Екатеринбург') : ch.date)}</div>
          <div class="g90-typed"></div>
          <div class="g90-hint">Enter — начать</div>
        </div>`, 'intro');
      this.introHTML = text.split('\n\n').map(p => '<p>' + p + '</p>').join('');
      this.introPlain = this.introHTML.replace(/<[^>]+>/g, '');
      this.menuKey = e => {
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') {
          if (this.introT * 60 < this.introPlain.length) { this.introT = 1e6; return true; }
          this.startPlay(); return true;
        }
        return false;
      };
      this.layer.querySelector('.g90-intro').addEventListener('click', () => { if (this.introT * 60 < this.introPlain.length) this.introT = 1e6; else this.startPlay(); });
    }

    introFrame(dt) {
      this.introT += dt;
      const x = this.r.x; x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#07080a'; x.fillRect(0, 0, this.W, this.H);
      const el = this.layer.querySelector('.g90-typed');
      if (!el) return;
      const n = Math.floor(this.introT * 60);
      if (n >= this.introPlain.length) { if (el.dataset.full !== '1') { el.innerHTML = this.introHTML; el.dataset.full = '1'; } return; }
      el.textContent = this.introPlain.slice(0, n);
      if (n % 3 === 0 && n !== this.lastTick) { this.lastTick = n; this.audio.sfx('click', 0.3); }
    }

    startPlay() {
      this.screen = 'game';
      this.overlay = null;
      this.setLayer('', 'hud');
      const w = this.game.world;
      this.cam.x = w.px; this.cam.y = w.py; this.cam.zoom = 1.05;
      this.acc = 0;
      this.game.msg('Звонит таксофон — подойди к нему пешком. Карта города — клавиша M.', 'info', 6);
      this.root.focus({ preventScroll: true });
    }

    autosave(label) {
      const g = this.game;
      if (!g || !g.prog) return;
      const saves = this.loadSaves();
      saves.auto = { prog: g.serialize(), label: label || this.saveLabel(), time: Date.now() };
      this.writeSaves(saves);
    }

    saveLabel() {
      const g = this.game, P = g.prog;
      return 'Глава ' + (P.chapter + 1) + ' · ' + fmtMoney(P.score) + ' руб. · ' + CHARACTERS[P.char].name;
    }

    gameFrame(dt) {
      const g = this.game, w = g.world;
      const active = this.isActive();
      if (this.edges.pause && !this.overlay) { this.edges = {}; this.showPause(); }
      else if (this.edges.map && !this.overlay) { this.edges = {}; this.showMap(() => this.closeOverlay()); }
      else if (this.edges.help && !this.overlay) { this.edges = {}; this.showHelp(() => this.closeOverlay(), true); }
      if (this.edges.zoomOut) this.zoomMul = clamp(this.zoomMul * 0.85, 0.55, 1.4);
      if (this.edges.zoomIn) this.zoomMul = clamp(this.zoomMul / 0.85, 0.55, 1.4);
      if (this.edges.radio && w.player.car) { this.station = (this.station + 1) % RADIO.length; this.radioT = 0; this.audio.sfx('radio'); }
      this.edges.zoomOut = this.edges.zoomIn = this.edges.radio = false;
      const running = active && !this.overlay && (g.mode === 'play' || g.mode === 'wasted' || g.mode === 'busted');
      if (running) {
        this.acc += dt;
        let n = 0;
        while (this.acc >= STEP && n < 4) {
          this.acc -= STEP; n++;
          g.update(STEP, this.input());
          this.edges = {};
        }
        if (n === 4) this.acc = 0;
      } else this.edges = {};
      if (g.mode === 'chapterEnd' && !this.overlay) { this.autosaveNext(); this.showChapterEnd(); }
      else if (g.mode === 'win' && !this.overlay) this.showWin();
      else if (g.mode === 'gameover' && !this.overlay) this.showGameOver();
      if (g.lastDone !== g.prog.stats.missions) { g.lastDone = g.prog.stats.missions; if (g.mode === 'play') this.autosave(); }
      this.updateCam(dt);
      w.viewR = Math.hypot(this.W, this.H) / 2 / this.cam.zoom;
      this.r.draw(w, this.cam, { dt: running ? dt : 0, markers: g.markers() });
      this.drawHUD(dt);
      this.sounds(running);
    }

    autosaveNext() {
      const g = this.game;
      const saves = this.loadSaves();
      const next = g.serialize();
      next.chapter = Math.min(CHAPTERS.length - 1, next.chapter + 1);
      next.chapterStart = next.score; next.mult = 1; next.lives++; next.exported = [];
      saves.auto = { prog: next, label: 'Глава ' + (next.chapter + 1) + ' · ' + fmtMoney(next.score) + ' руб. · ' + CHARACTERS[next.char].name, time: Date.now() };
      this.writeSaves(saves);
    }

    updateCam(dt) {
      const w = this.game.world, p = w.player;
      const tgt = p.car || p;
      const sp = Math.hypot(tgt.vx || 0, tgt.vy || 0);
      let zt = p.car ? clamp(1.02 - sp / 800, 0.6, 1.02) : 1.12;
      if (p.car && (p.car.m.boat || p.car.m.kind === 'heavy')) zt *= 0.88;
      zt *= this.zoomMul;
      this.cam.zoom += (zt - this.cam.zoom) * Math.min(1, dt * 1.2);
      const lx = clamp((tgt.vx || 0) * 0.45, -220, 220), ly = clamp((tgt.vy || 0) * 0.45, -160, 160);
      const k = Math.min(1, dt * 4.5);
      this.cam.x += (tgt.x + lx - this.cam.x) * k;
      this.cam.y += (tgt.y + ly - this.cam.y) * k;
    }

    sounds(running) {
      const g = this.game, w = g.world, p = w.player, a = this.audio;
      const cx = this.cam.x, cy = this.cam.y;
      const vol = (x, y, r) => clamp(1 - Math.hypot(x - cx, y - cy) / (r || 700), 0, 1);
      for (const e of w.bus) {
        if (!running) break;
        switch (e.type) {
          case 'shot': a.sfx(e.w === 'akm' ? 'akm' : e.w === 'obrez' ? 'obrez' : e.w === 'rpg' ? 'rpg' : e.w === 'molotov' ? 'whoosh' : 'pm', vol(e.x, e.y)); break;
          case 'cannon': a.sfx('cannon', vol(e.x, e.y, 900)); this.r.shake = Math.max(this.r.shake, 0.3); break;
          case 'boom': a.sfx('boom', vol(e.x, e.y, 1100)); this.r.shake = Math.max(this.r.shake, 0.8 * vol(e.x, e.y, 700)); break;
          case 'crash': if (e.v > 60) a.sfx('crash', vol(e.x, e.y, 500) * clamp(e.v / 250, 0.3, 1)); break;
          case 'thud': a.sfx('thud', vol(e.x, e.y, 400)); break;
          case 'punch': a.sfx('punch', vol(e.x, e.y, 300)); break;
          case 'splash': a.sfx('splash', vol(e.x, e.y, 600)); break;
          case 'trainHorn': a.sfx('trainHorn', vol(e.x, e.y, 1300)); break;
          case 'tramBell': a.sfx('tramBell', vol(e.x, e.y, 700)); break;
          case 'whoosh': a.sfx('whoosh', vol(e.x, e.y, 600)); break;
          case 'horn': a.sfx('horn', vol(e.x, e.y, 500) * (e.ai ? 0.6 : 1)); break;
          case 'pickup': break;
          case 'wantedUp': break;
          default: break;
        }
      }
      w.bus.length = 0;
      for (const id of g.sfxQueue) a.sfx(id);
      g.sfxQueue.length = 0;
      let siren = 0, kgb = false;
      if (w.wanted.level > 0) for (const c of w.cars) if (c.siren && !c.dead) { const v = vol(c.x, c.y, 900); if (v > siren) { siren = v; kgb = !!c.m.kgb; } }
      if (w.ringing && w.ringing.size && running && !p.car) {
        this.ringT = (this.ringT || 0) - (1 / 60);
        if (this.ringT <= 0) {
          this.ringT = 1.6;
          let best = 0;
          for (const ph of w.ringing) { const pl = this.city.places[ph]; best = Math.max(best, vol(pl.x, pl.y, 600)); }
          if (best > 0.05) a.sfx('ring', best);
        }
      }
      const c = p.car;
      a.update({ inCar: !!c && running && !c.dead, speed: c ? Math.abs(c.fwd || 0) : 0, thr: c ? c.ctl.thr : 0, boat: c && c.m.boat, heavy: c && c.m.kind === 'heavy', tank: c && c.m.tank, engine: 1, siren: running ? siren : 0, kgb, station: running && c ? this.station : 0 });
    }

    drawHUD(dt) {
      const g = this.game, w = g.world, P = g.prog, p = w.player;
      const x = this.r.x, W = this.W, H = this.H;
      x.setTransform(1, 0, 0, 1, 0, 0);
      const sm = W < 700;
      const text = (s, tx, ty, font, fill, align, stroke) => {
        x.font = font; x.textAlign = align || 'left'; x.textBaseline = 'alphabetic';
        x.lineWidth = stroke || 4; x.strokeStyle = 'rgba(0,0,0,0.85)'; x.lineJoin = 'round';
        x.strokeText(s, tx, ty); x.fillStyle = fill; x.fillText(s, tx, ty);
      };
      const big = sm ? 20 : 26;
      text(fmtMoney(P.score) + ' руб.', 14, 12 + big, `bold ${big}px "Arial Black", Impact, Arial`, '#ffe040');
      const ch = g.chapter;
      const goal = ch.target - (P.score - P.chapterStart);
      text(goal > 0 ? 'до цели главы: ' + fmtMoney(goal) : 'цель главы достигнута!', 16, 30 + big, 'bold 11px Tahoma, Arial', goal > 0 ? '#e0e0d0' : '#80ff80', 'left', 3);
      text('×' + P.mult, 16, 62 + big, `bold ${big - 4}px "Arial Black", Impact, Arial`, '#ff9030');
      for (let k = 0; k < Math.min(P.lives, 9); k++) {
        const hx = 70 + k * 15, hy = 54 + big;
        x.fillStyle = '#000'; x.beginPath(); x.arc(hx, hy, 6.5, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#e8c09a'; x.beginPath(); x.arc(hx, hy, 5, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#5a3a20'; x.beginPath(); x.arc(hx, hy - 1, 5, Math.PI, 0); x.fill();
      }
      const barY = 72 + big;
      x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(14, barY, 104, 8);
      x.fillStyle = p.hp > 35 ? '#40c040' : '#e03030'; x.fillRect(16, barY + 2, 100 * clamp(p.hp / p.maxHp, 0, 1), 4);
      if (p.armor > 0) { x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(14, barY + 10, 104, 8); x.fillStyle = '#4080e0'; x.fillRect(16, barY + 12, p.armor, 4); }
      const lvl = w.wanted.level;
      for (let k = 0; k < 4; k++) {
        const cx = W - 26 - k * 34, cy = 28;
        const on = k < lvl && !(w.wanted.flash > 0 && Math.floor(w.wanted.flash * 6) % 2 === 0);
        this.cap(x, cx, cy, on, k < lvl);
      }
      const wid = p.cur, wd = WEAPONS[wid];
      const wy = 54;
      x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(W - 150, wy, 136, 34);
      x.strokeStyle = '#806020'; x.lineWidth = 1; x.strokeRect(W - 150 + 0.5, wy + 0.5, 135, 33);
      this.weaponIcon(x, wid, W - 132, wy + 17);
      text(wd.short || wd.name, W - 110, wy + 15, 'bold 12px Tahoma, Arial', '#f0e0b0', 'left', 3);
      text(wid === 'fist' ? '' : String(p.weapons[wid] > 900 ? '∞' : p.weapons[wid] || 0), W - 110, wy + 29, 'bold 12px Tahoma, Arial', '#ffe040', 'left', 3);
      const m = g.mission;
      let topY = 22;
      if (m && m.timeLeft != null) { text(fmtTime(m.timeLeft), W / 2, topY + 16, 'bold 28px "Arial Black", Impact, Arial', m.timeLeft < 15 ? '#ff5040' : '#ffffff', 'center'); topY += 34; }
      if (m && m.cur && m.cur.do === 'wait') { text((m.cur.label || 'Осталось') + ' ' + Math.ceil(m.waitLeft || 0), W / 2, topY + 16, 'bold 20px "Arial Black", Impact, Arial', '#ff8040', 'center'); topY += 28; }
      if (m && m.cur && m.cur.do === 'race') { text('Точка ' + (m.cp + 1) + ' / ' + m.cps.length, W / 2, topY + 14, 'bold 16px Tahoma, Arial', '#80ff80', 'center', 3); topY += 22; }
      if (m && m.warnText) { text(m.warnText, W / 2, topY + 14, 'bold 16px Tahoma, Arial', '#ff8040', 'center', 3); topY += 22; }
      if (g.frenzy) { text('БЕСПРЕДЕЛ ' + g.frenzy.n + '/' + g.frenzy.def.n + '   ' + fmtTime(g.frenzy.t), W / 2, topY + 18, 'bold 20px "Arial Black", Impact, Arial', '#ff3030', 'center'); topY += 28; }
      if (g.taxi) {
        const t = g.taxi;
        text('БОМБИМ' + (t.fare ? '   ' + fmtTime(t.t) : ''), W / 2, topY + 16, 'bold 16px "Arial Black", Impact, Arial', '#ffd040', 'center', 3); topY += 24;
      }
      if (p.car && this.radioT != null && this.radioT < 2.5) { this.radioT += dt; text('📻 ' + RADIO[this.station].name, W / 2, topY + 14, 'bold 13px Tahoma, Arial', '#c0e0ff', 'center', 3); topY += 20; }
      if (p.car && this.station === 3 && g.mode === 'play') {
        const list = NEWS[P.chapter] || NEWS[0];
        const idx = Math.floor(g.newsT / 14) % list.length;
        const tk = list[idx];
        x.font = '12px Tahoma, Arial';
        const tw = x.measureText(tk).width;
        const off = ((g.newsT % 14) / 14) * (W + tw);
        x.fillStyle = 'rgba(0,0,40,0.6)'; x.fillRect(0, H - 22, W, 22);
        x.fillStyle = '#c0d8ff'; x.textAlign = 'left'; x.fillText('«Маяк»: ' + tk, W - off, H - 7);
      }
      this.drawArrow(x);
      this.drawMessages(x, dt, text);
      if (g.zoneT < 3.5 && g.zone) {
        const a = clamp(Math.min(g.zoneT * 3, (3.5 - g.zoneT) * 2), 0, 1);
        x.globalAlpha = a;
        text(g.zone.toUpperCase(), W - 16, H - (p.car && this.station === 3 ? 58 : 36), `bold ${sm ? 16 : 22}px "Arial Black", Impact, Arial`, '#f0f0e0', 'right');
        const st = this.city.streetName(w.px, w.py);
        if (st) text(st, W - 16, H - (p.car && this.station === 3 ? 40 : 18), 'bold 12px Tahoma, Arial', '#d0d0c0', 'right', 3);
        x.globalAlpha = 1;
      }
      if (g.brief) this.drawBrief(x, g.brief, dt);
      if (g.mode === 'wasted' || g.mode === 'busted') {
        const k = clamp(g.deadT / 1.5, 0, 1);
        x.fillStyle = g.mode === 'wasted' ? `rgba(60,0,0,${k * 0.55})` : `rgba(0,10,60,${k * 0.55})`;
        x.fillRect(0, 0, W, H);
        x.globalAlpha = k;
        text(g.mode === 'wasted' ? 'ПОТРАЧЕНО' : 'ЗАДЕРЖАН' + (g.fem ? 'А' : ''), W / 2, H / 2, `bold ${sm ? 38 : 60}px "Arial Black", Impact, Arial`, g.mode === 'wasted' ? '#e02020' : '#4080ff', 'center', 8);
        x.globalAlpha = 1;
      }
      if (!this.isActive() && !this.overlay) {
        x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(0, 0, W, H);
        text('ПАУЗА — щёлкни по окну игры', W / 2, H / 2, 'bold 22px "Arial Black", Impact, Arial', '#ffffff', 'center');
      }
      if (this.settings.fps) text(Math.round(this.fps) + ' fps · ' + w.cars.length + ' машин · ' + w.peds.length + ' пеш.', 14, H - 10, '11px Tahoma', '#a0ffa0', 'left', 3);
    }

    cap(x, cx, cy, on, lit) {
      x.save(); x.translate(cx, cy);
      x.globalAlpha = lit ? 1 : 0.35;
      x.fillStyle = 'rgba(0,0,0,0.6)'; x.beginPath(); x.ellipse(0, 4, 15, 7, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = on ? '#6a88b0' : lit ? '#3a4a60' : '#505050';
      x.beginPath(); x.ellipse(0, -3, 13, 9, 0, Math.PI, 0); x.lineTo(13, 2); x.lineTo(-13, 2); x.closePath(); x.fill();
      x.fillStyle = lit ? '#101010' : '#303030'; x.beginPath(); x.ellipse(0, 4, 14, 4.5, 0, 0, Math.PI); x.fill();
      x.fillStyle = on ? '#ff2a20' : lit ? '#801010' : '#604040'; x.fillRect(-12, -2, 24, 4);
      x.fillStyle = on ? '#ffd040' : '#807850'; x.beginPath();
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * Math.PI * 0.8; x.lineTo(Math.cos(a) * 3.2, -6 + Math.sin(a) * 3.2); }
      x.closePath(); x.fill();
      x.globalAlpha = 1;
      x.restore();
    }

    weaponIcon(x, wid, cx, cy) {
      x.save(); x.translate(cx, cy);
      x.fillStyle = '#d8d0b8'; x.strokeStyle = '#000'; x.lineWidth = 1;
      if (wid === 'fist') { x.beginPath(); x.arc(0, 0, 8, 0, Math.PI * 2); x.fill(); x.stroke(); x.fillStyle = '#b09070'; for (let k = 0; k < 4; k++) x.fillRect(-6 + k * 3.2, -8, 2.4, 5); }
      else if (wid === 'pm') { x.fillStyle = '#2a2a2a'; x.fillRect(-10, -4, 18, 6); x.fillRect(-10, 0, 6, 9); }
      else if (wid === 'obrez') { x.fillStyle = '#6a4424'; x.fillRect(-12, 0, 9, 6); x.fillStyle = '#2a2a2a'; x.fillRect(-4, -3, 16, 3); x.fillRect(-4, 0, 16, 3); }
      else if (wid === 'akm') { x.fillStyle = '#6a4424'; x.fillRect(-13, -2, 8, 5); x.fillStyle = '#2a2a2a'; x.fillRect(-5, -3, 18, 4); x.fillRect(0, 1, 4, 8); x.fillStyle = '#6a4424'; x.fillRect(5, -2, 6, 3); }
      else if (wid === 'rpg') { x.fillStyle = '#4a5a30'; x.fillRect(-13, -2, 22, 5); x.fillStyle = '#6a6a3a'; x.beginPath(); x.moveTo(9, -5); x.lineTo(15, 0.5); x.lineTo(9, 6); x.closePath(); x.fill(); }
      else if (wid === 'molotov') { x.fillStyle = '#3a7a3a'; x.fillRect(-4, -4, 8, 12); x.fillRect(-2, -9, 4, 6); x.fillStyle = '#ff9020'; x.beginPath(); x.arc(0, -11, 3, 0, Math.PI * 2); x.fill(); }
      x.restore();
    }

    drawArrow(x) {
      const g = this.game, w = g.world;
      const ms = g.markers();
      if (!ms.length) return;
      let best = null, bd = 1e12;
      for (const m of ms) { const d = G.dist2(m.x, m.y, w.px, w.py); if (d < bd) { bd = d; best = m; } }
      const d = Math.sqrt(bd);
      if (d < 90) return;
      const [px, py] = this.r.proj(w.px, w.py, 0);
      const a = Math.atan2(best.y - w.py, best.x - w.px);
      const R = 64 * this.cam.zoom + 10;
      const ax = px + Math.cos(a) * R, ay = py + Math.sin(a) * R;
      x.save(); x.translate(ax, ay); x.rotate(a);
      x.fillStyle = best.color || '#ffe040'; x.strokeStyle = '#000'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(16, 0); x.lineTo(-6, -11); x.lineTo(-2, 0); x.lineTo(-6, 11); x.closePath(); x.fill(); x.stroke();
      x.restore();
      if (d > 600) {
        x.font = 'bold 11px Tahoma'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 3;
        const s = Math.round(d / this.city.M) + ' м';
        x.strokeText(s, ax + Math.cos(a) * 20, ay + Math.sin(a) * 20 + 4); x.fillText(s, ax + Math.cos(a) * 20, ay + Math.sin(a) * 20 + 4);
      }
    }

    drawMessages(x, dt, text) {
      const g = this.game, W = this.W, H = this.H;
      const sm = W < 700;
      let by = H - 44;
      if (g.objective && g.mission) {
        x.font = `bold ${sm ? 12 : 14}px Tahoma, Arial`;
        const lines = this.wrap(x, g.objective, W - 60);
        const hh = lines.length * 18 + 10;
        x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(W / 2 - Math.min(W - 40, 640) / 2, by - hh + 14, Math.min(W - 40, 640), hh);
        lines.forEach((l, i) => text(l, W / 2, by - (lines.length - 1 - i) * 18 + 4, `bold ${sm ? 12 : 14}px Tahoma, Arial`, '#ffffff', 'center', 3));
        by -= hh + 6;
      }
      const infos = g.msgs.filter(m => m.kind === 'info' || m.kind === 'story' || m.kind === 'car');
      for (const m of infos.slice(-3).reverse()) {
        const a = clamp(Math.min(m.t * 4, (m.life - m.t) * 2), 0, 1);
        x.globalAlpha = a;
        x.font = `${m.kind === 'story' ? 'italic ' : ''}bold ${sm ? 12 : 13}px Tahoma, Arial`;
        const lines = this.wrap(x, m.text, W - 80);
        for (let i = lines.length - 1; i >= 0; i--) { text(lines[i], W / 2, by, x.font, m.kind === 'car' ? '#a0e0ff' : m.kind === 'story' ? '#ffe8a0' : '#e8e8e8', 'center', 3); by -= 17; }
        by -= 4;
        x.globalAlpha = 1;
      }
      const bigs = g.msgs.filter(m => m.kind === 'pass' || m.kind === 'fail' || m.kind === 'big' || m.kind === 'count' || m.kind === 'title');
      let cy = H * 0.34;
      for (const m of bigs.slice(-2)) {
        const a = clamp(Math.min(m.t * 5, (m.life - m.t) * 2), 0, 1);
        x.globalAlpha = a;
        const col = m.kind === 'pass' ? '#60ff60' : m.kind === 'fail' ? '#ff4040' : m.kind === 'title' ? '#ffffff' : '#ffe040';
        const size = m.kind === 'count' ? (sm ? 56 : 80) : m.kind === 'title' ? (sm ? 18 : 24) : (sm ? 22 : 32);
        x.font = `bold ${size}px "Arial Black", Impact, Arial`;
        const lines = this.wrap(x, m.text, W - 40);
        for (const l of lines) { text(l, W / 2, cy, x.font, col, 'center', 6); cy += size + 6; }
        x.globalAlpha = 1;
      }
    }

    drawBrief(x, b, dt) {
      const W = this.W, H = this.H;
      const bw = Math.min(W - 30, 620);
      x.font = '13px Georgia, "Times New Roman", serif';
      const n = Math.floor(b.t * 70);
      const shown = b.text.slice(0, n);
      const lines = this.wrap(x, shown, bw - 80);
      const full = this.wrap(x, b.text, bw - 80);
      const hh = full.length * 17 + 42;
      const bx = (W - bw) / 2, by = (W < 900 ? 128 : 60) + (this.game.mission && this.game.mission.timeLeft != null ? 36 : 0);
      const a = clamp(Math.min(b.t * 4, (9 - b.t) * 2), 0, 1);
      x.globalAlpha = a;
      x.fillStyle = 'rgba(12,14,20,0.86)'; x.fillRect(bx, by, bw, hh);
      x.strokeStyle = '#c8a040'; x.lineWidth = 2; x.strokeRect(bx + 1, by + 1, bw - 2, hh - 2);
      x.fillStyle = '#b02020'; x.fillRect(bx + 12, by + 12, 40, 40);
      x.fillStyle = '#f0e0c0'; x.fillRect(bx + 18, by + 28, 28, 8);
      x.fillStyle = '#101010'; x.beginPath(); x.arc(bx + 32, by + 22, 5, 0, Math.PI * 2); x.fill();
      x.font = 'bold 13px Tahoma, Arial'; x.fillStyle = '#ffd060'; x.textAlign = 'left';
      x.fillText('☎ ' + b.who + ' — «' + b.title + '»', bx + 64, by + 22);
      x.font = '13px Georgia, "Times New Roman", serif'; x.fillStyle = '#f0f0e8';
      lines.forEach((l, i) => x.fillText(l, bx + 64, by + 42 + i * 17));
      x.globalAlpha = 1;
    }

    wrap(x, s, maxW) {
      const out = [];
      for (const para of String(s).split('\n')) {
        let line = '';
        for (const word of para.split(' ')) {
          const t = line ? line + ' ' + word : word;
          if (x.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t;
        }
        out.push(line);
      }
      return out;
    }

    closeOverlay() {
      this.overlay = null;
      this.onBack = null;
      this.setLayer('', 'hud');
      this.keys = {};
      this.root.focus({ preventScroll: true });
    }

    showPause() {
      this.overlay = 'pause';
      const g = this.game;
      this.onBack = () => this.closeOverlay();
      this.setLayer(`
        <div class="g90-pause">
          <h2>ПАУЗА</h2>
          <div class="g90-sub">${esc(g.chapter.title)} · ${esc(g.renamed ? 'Екатеринбург' : 'Свердловск')}, ${g.prog.chapter ? 1991 : 1990}</div>
          <ul class="g90-menu dark">
            <li data-a="resume">Продолжить</li>
            <li data-a="map">Карта города</li>
            <li data-a="save">Сохранить игру</li>
            <li data-a="load">Загрузить игру</li>
            <li data-a="stats">Статистика</li>
            <li data-a="settings">Настройки</li>
            <li data-a="help">Управление</li>
            <li data-a="quit">Выйти в главное меню</li>
          </ul>
        </div>`, 'overlay');
      this.listNav('.g90-menu li', a => {
        if (a === 'resume') this.closeOverlay();
        if (a === 'map') this.showMap(() => this.showPause());
        if (a === 'save') this.showSaves(true, () => this.showPause());
        if (a === 'load') this.showSaves(false, () => this.showPause());
        if (a === 'stats') this.showStats(() => this.showPause());
        if (a === 'settings') this.showSettings(() => this.showPause());
        if (a === 'help') this.showHelp(() => this.showPause());
        if (a === 'quit') this.showTitle();
      });
    }

    showSaves(saving, back) {
      if (this.screen === 'game') this.overlay = 'saves';
      const saves = this.loadSaves();
      const slot = k => {
        const s = saves[k];
        const when = s ? new Date(s.time).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
        return `<li data-a="${k}" class="${!saving && !s || saving && k === 'auto' ? 'off' : ''}"><b>${k === 'auto' ? 'Автосохранение' : 'Ячейка ' + k}</b><small>${s ? esc(s.label) + ' · ' + when : 'пусто'}</small></li>`;
      };
      this.onBack = back;
      this.setLayer(`
        <div class="g90-pause wide">
          <h2>${saving ? 'СОХРАНИТЬ' : 'ЗАГРУЗИТЬ'}</h2>
          <div class="g90-sub">${saving ? 'Сохраняется прогресс: глава, деньги, жизни, выполненные задания.' : 'Игра продолжится с начала сохранённой главы.'}</div>
          <ul class="g90-menu dark slots">${slot('auto')}${slot('1')}${slot('2')}${slot('3')}<li data-a="back">Назад</li></ul>
        </div>`, 'overlay');
      this.listNav('.g90-menu li', a => {
        if (a === 'back') { back(); return; }
        if (saving) {
          saves[a] = { prog: this.game.serialize(), label: this.saveLabel(), time: Date.now() };
          this.writeSaves(saves);
          this.game.msg('Игра сохранена.', 'info');
          back();
        } else if (saves[a]) this.loadGame(saves[a].prog);
      });
    }

    showSettings(back) {
      if (this.screen === 'game') this.overlay = 'settings';
      const s = this.settings;
      this.onBack = back;
      this.setLayer(`
        <div class="g90-pause wide">
          <h2>НАСТРОЙКИ</h2>
          <div class="g90-form">
            <label>Звуки <input type="range" min="0" max="1" step="0.05" data-k="sfx" value="${s.sfx}"></label>
            <label>Музыка и радио <input type="range" min="0" max="1" step="0.05" data-k="music" value="${s.music}"></label>
            <label>Управление пешком
              <select data-k="scheme"><option value="tank" ${s.scheme === 'tank' ? 'selected' : ''}>Как в 1997: вперёд + поворот</option><option value="direct" ${s.scheme === 'direct' ? 'selected' : ''}>По направлениям экрана</option></select></label>
            <label>Плотность машин и прохожих
              <select data-k="density"><option value="0.6" ${s.density == 0.6 ? 'selected' : ''}>Низкая</option><option value="1" ${s.density == 1 ? 'selected' : ''}>Обычная</option><option value="1.4" ${s.density == 1.4 ? 'selected' : ''}>Час пик</option></select></label>
            <label>Радио в машине
              <select data-k="radio">${RADIO.map((r, i) => `<option value="${i}" ${s.radio == i ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></label>
            <label class="chk"><input type="checkbox" data-k="fps" ${s.fps ? 'checked' : ''}> Показывать FPS</label>
          </div>
          <ul class="g90-menu dark"><li data-a="back">Готово</li></ul>
        </div>`, 'overlay');
      this.layer.querySelectorAll('[data-k]').forEach(el => {
        el.addEventListener('input', () => {
          const k = el.dataset.k;
          s[k] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : (k === 'density' || k === 'radio') ? +el.value : el.value;
          this.audio.setVolumes(s.sfx, s.music);
          if (k === 'radio') this.station = s.radio;
          if (k === 'density' && this.game) this.game.world.density = s.density;
          this.saveSettings();
        });
      });
      this.listNav('.g90-menu li', () => back());
    }

    showHelp(back, fromGame) {
      if (this.screen === 'game') this.overlay = 'help';
      this.onBack = back;
      const rows = [
        ['Стрелки / W A S D', 'Газ, тормоз и руль · пешком: ходьба и поворот'],
        ['Пробел', 'Ручник в машине · выстрел пешком'],
        ['Ctrl', 'Огонь · в машине: стрельба вперёд, запуск бомбы, пушка танка'],
        ['Enter / F', 'Сесть в машину (выкинуть водителя) · выйти'],
        ['Q / E / Tab, 1–6', 'Смена оружия'],
        ['Shift', 'Идти шагом'],
        ['H', 'Сигнал'],
        ['R', 'Радио: «Урал-Диско», «Рок-клуб», «Маяк»'],
        ['T', 'Бомбить — подвозить голосующих за деньги'],
        ['M', 'Карта города'],
        ['− / =', 'Отдалить / приблизить камеру'],
        ['Esc / P', 'Пауза, сохранение, настройки']
      ];
      this.setLayer(`
        <div class="g90-pause wide">
          <h2>УПРАВЛЕНИЕ</h2>
          <table class="g90-keys">${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>
          <div class="g90-sub">Звонящий таксофон — задание: подойди к нему пешком. Деньги — это и очки: набери цель главы, и босс позвонит с последним делом. Милиция отстанет, если не попадаться на глаза, перекраситься в «Покраске» или найти взятку.</div>
          <ul class="g90-menu dark"><li data-a="back">${fromGame ? 'Вернуться в игру' : 'Назад'}</li></ul>
        </div>`, 'overlay');
      this.listNav('.g90-menu li', () => back());
    }

    showStats(back) {
      this.overlay = 'stats';
      this.onBack = back;
      const s = this.game.prog.stats;
      const rows = [['Выполнено заданий', s.missions], ['Угнано машин', s.stolen], ['Уничтожено машин', s.cars], ['Погибло от твоих рук', s.kills], ['Из них милиционеров', s.cops], ['Пассажиров подвёз', s.fares], ['Сдано под пресс', s.crushed], ['Отправлено на экспорт', s.exported], ['Беспределов', s.frenzies], ['Значков найдено', (this.game.prog.badges || 0) + ' из 20'], ['Задержаний', s.busted], ['Смертей', s.wasted], ['Максимальный розыск', s.maxWanted], ['Потрачено на покраску и бомбы', fmtMoney(s.spent) + ' руб.'], ['Время в игре', fmtTime(s.time)]];
      this.setLayer(`
        <div class="g90-pause wide">
          <h2>СТАТИСТИКА</h2>
          <table class="g90-keys">${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>
          <ul class="g90-menu dark"><li data-a="back">Назад</li></ul>
        </div>`, 'overlay');
      this.listNav('.g90-menu li', () => back());
    }

    showMap(back) {
      this.overlay = 'map';
      this.onBack = back;
      const g = this.game;
      const ch = g.chapter;
      const done = g.prog.exported;
      this.setLayer(`
        <div class="g90-map">
          <div class="g90-map-head"><b>СХЕМА ЦЕНТРА ${g.renamed ? 'ЕКАТЕРИНБУРГА' : 'СВЕРДЛОВСКА'}</b><span>${g.prog.chapter ? 1991 : 1990} · масштаб 1:25 000 · Esc / M — закрыть</span></div>
          <div class="g90-map-body"><canvas class="g90-mapcv"></canvas>
            <div class="g90-legend">
              <h3>Условные знаки</h3>
              <div><i class="lg ph"></i>Звонящий таксофон</div>
              <div><i class="lg sp"></i>Покраска (1000 руб.)</div>
              <div><i class="lg bm"></i>Мастерская — бомба (3000 руб.)</div>
              <div><i class="lg cr"></i>Утильсырьё — пресс</div>
              <div><i class="lg ex"></i>Контейнеры — экспорт</div>
              <div><i class="lg hs"></i>Больница</div>
              <div><i class="lg pd"></i>РОВД</div>
              <div><i class="lg me"></i>Ты</div>
              <h3>Заказ на экспорт (глава ${ch.num})</h3>
              ${ch.exportModels.map(mid => `<div class="${done.includes(mid) ? 'ok' : ''}">${done.includes(mid) ? '✔' : '○'} ${esc(VEHICLES[mid].name)}</div>`).join('')}
            </div>
          </div>
        </div>`, 'overlay');
      const cv = this.layer.querySelector('.g90-mapcv');
      this.drawMap(cv);
      this.menuKey = e => { if (e.code === 'Escape' || e.code === 'KeyM' || e.code === 'Enter') { back(); return true; } return false; };
      this.layer.querySelector('.g90-map-head').addEventListener('click', () => back());
    }

    drawMap(cv) {
      const g = this.game, w = g.world, city = this.city;
      const box = cv.parentElement.getBoundingClientRect();
      const avW = Math.max(200, box.width - 200), avH = Math.max(150, box.height);
      const s = Math.min(avW / city.W, avH / city.H);
      cv.width = Math.floor(city.W * s); cv.height = Math.floor(city.H * s);
      const x = cv.getContext('2d');
      if (!this.mini) this.mini = this.r.minimap(0.06);
      x.imageSmoothingEnabled = true;
      x.drawImage(this.mini, 0, 0, cv.width, cv.height);
      const P = (wx, wy) => [wx * s, wy * s];
      x.font = `bold ${Math.max(9, Math.round(cv.width / 70))}px Tahoma`; x.textAlign = 'center';
      const used = [];
      for (const z of city.zones) {
        if (z.r < 120 * city.M) continue;
        const t = z.name.toUpperCase();
        const hw = x.measureText(t).width / 2 + 4;
        const q = P(z.x, z.y);
        const a = Math.max(hw, Math.min(cv.width - hw, q[0]));
        let b = Math.max(14, Math.min(cv.height - 6, q[1]));
        for (let k = 0; k < 4; k++) { const hitL = used.find(u => Math.abs(u[0] - a) < u[2] + hw && Math.abs(u[1] - b) < 12); if (!hitL) break; b = hitL[1] + 13; }
        used.push([a, b, hw]);
        x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,0.8)'; x.strokeText(t, a, b);
        x.fillStyle = z.key === 'pond' ? '#1a4a8a' : '#3a2a1a'; x.fillText(t, a, b);
      }
      const icon = (wx, wy, col, letter) => {
        const [a, b] = P(wx, wy);
        x.fillStyle = col; x.fillRect(a - 6, b - 6, 12, 12); x.strokeStyle = '#000'; x.lineWidth = 1; x.strokeRect(a - 6, b - 6, 12, 12);
        x.fillStyle = '#fff'; x.font = 'bold 9px Tahoma'; x.fillText(letter, a, b + 3);
      };
      for (const gr of Object.values(city.garages)) {
        const col = { spray: '#3a7ac0', bomb: '#a04020', crusher: '#707060', export: '#208060', deliver: '#806020' }[gr.kind];
        const let_ = { spray: 'П', bomb: 'Б', crusher: 'В', export: 'Э', deliver: 'Г' }[gr.kind];
        if (gr.kind === 'deliver' && !gr.open) continue;
        icon(gr.x, gr.y, col, let_);
      }
      for (const id of ['hosp_1', 'hosp_2', 'hosp_3']) { const p = city.places[id]; icon(p.x, p.y, '#e0e0e0', '+'); }
      for (const id of ['ovd_guvd', 'ovd_lenin', 'ovd_rail', 'ovd_oct', 'ovd_kirov']) { const p = city.places[id]; icon(p.x, p.y, '#2040a0', 'М'); }
      const t = performance.now() / 300;
      for (const ph of w.ringing || []) { const p = city.places[ph]; const [a, b] = P(p.x, p.y); x.fillStyle = '#ffe040'; x.beginPath(); x.arc(a, b, 7, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#000'; x.stroke(); x.fillStyle = '#000'; x.fillText('☎', a, b + 3); }
      for (const m of g.markers()) { const [a, b] = P(m.x, m.y); x.strokeStyle = m.color || '#ffe040'; x.lineWidth = 3; x.beginPath(); x.arc(a, b, 9 + Math.sin(t) * 2, 0, Math.PI * 2); x.stroke(); }
      const [a, b] = P(w.px, w.py);
      const ang = w.player.car ? w.player.car.a : w.player.a;
      x.save(); x.translate(a, b); x.rotate(ang);
      x.fillStyle = '#ff2020'; x.strokeStyle = '#fff'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(10, 0); x.lineTo(-7, -7); x.lineTo(-3, 0); x.lineTo(-7, 7); x.closePath(); x.stroke(); x.fill();
      x.restore();
    }

    showChapterEnd() {
      this.overlay = 'end';
      const g = this.game, ch = g.chapter;
      const text = G.genderize(ch.outro, g.fem).split('\n\n').map(p => '<p>' + esc(p) + '</p>').join('');
      this.setLayer(`
        <div class="g90-intro end">
          <div class="g90-chapter">ГЛАВА ${ch.num} ЗАВЕРШЕНА</div>
          <h2>${esc(ch.title)}</h2>
          <div class="g90-typed">${text}</div>
          <div class="g90-score">На счету: ${fmtMoney(g.prog.score)} руб. · Жизней: ${g.prog.lives + 1}</div>
          <div class="g90-hint">Enter — дальше</div>
        </div>`, 'intro');
      const go = () => { this.overlay = null; g.nextChapter(); this.autosave(); this.showIntro(); };
      this.menuKey = e => { if (e.code === 'Enter' || e.code === 'Space') { go(); return true; } return false; };
      this.layer.querySelector('.g90-intro').addEventListener('click', go);
    }

    showWin() {
      this.overlay = 'win';
      const g = this.game, s = g.prog.stats;
      const saves = this.loadSaves(); delete saves.auto; this.writeSaves(saves);
      const text = G.genderize(G.ENDING, g.fem).split('\n\n').map(p => '<p>' + esc(p) + '</p>').join('');
      this.setLayer(`
        <div class="g90-intro end win">
          <div class="g90-chapter">23 СЕНТЯБРЯ 1991</div>
          <h2>Екатеринбург</h2>
          <div class="g90-typed">${text}</div>
          <div class="g90-score">Итог: ${fmtMoney(g.prog.score)} руб. · заданий ${s.missions} · угнано машин ${s.stolen} · время ${fmtTime(s.time)}</div>
          <div class="g90-hint">Enter — в главное меню</div>
        </div>`, 'intro');
      this.menuKey = e => { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') { this.showTitle(); return true; } return false; };
      this.audio.sfx('pass');
    }

    showGameOver() {
      this.overlay = 'gameover';
      this.onBack = null;
      this.setLayer(`
        <div class="g90-pause">
          <h2 class="red">ИГРА ОКОНЧЕНА</h2>
          <div class="g90-sub">Жизни кончились. Свердловск умеет ждать — начнёшь главу заново?</div>
          <ul class="g90-menu dark"><li data-a="retry">Начать главу заново</li><li data-a="menu">Главное меню</li></ul>
        </div>`, 'overlay');
      this.listNav('.g90-menu li', a => {
        if (a === 'retry') { this.game.restartChapter(); this.overlay = null; this.autosave(); this.showIntro(); }
        else this.showTitle();
      });
    }
  }

  Object.assign(G, { UI, drawPortrait });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
