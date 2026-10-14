(function (H) {
  'use strict';

  const SAVE_KEY = 'hl2_2000_saves';
  const PROFILE_KEY = 'hl2_2000_profile';
  const HUD_COL = 'rgba(255,208,64,';
  const RES = { '240': 240, '360': 360, '480': 480, '600': 600, native: 0 };

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function loadJSON(key, def) {
    try { const raw = localStorage.getItem(key); if (raw) return Object.assign(def, JSON.parse(raw)); } catch (e) { }
    return def;
  }
  function saveJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; } }

  const KEYMAP = {
    KeyW: 'fwd+', ArrowUp: 'fwd+', KeyS: 'fwd-', ArrowDown: 'fwd-', KeyA: 'side-', KeyD: 'side+',
    Space: 'jump', KeyC: 'duck', ControlLeft: 'duck', ControlRight: 'duck', ShiftLeft: 'sprint', ShiftRight: 'sprint',
    AltLeft: 'walk', KeyZ: 'walk', KeyE: 'use', KeyR: 'reload', KeyF: 'flashlight', KeyQ: 'last', KeyG: 'squad'
  };

  class UI {
    constructor(root, opts = {}) {
      this.opts = opts;
      this.root = root;
      this.profile = loadJSON(PROFILE_KEY, { unlocked: [0], opt: {} });
      this.o = Object.assign({ sens: 0.0026, invert: false, res: '480', renderer: 'opengl', dither: true, bright: 1.1, fov: 75, vol: 0.8, music: 0.5, subs: true, fps: false, draw: 1 }, this.profile.opt || {});
      this.saves = loadJSON(SAVE_KEY, {});
      this.mode = 'menu';
      this.game = null;
      this.bg = null;
      this.keys = {};
      this.input = { fwd: 0, side: 0 };
      this.acc = 0;
      this.last = 0;
      this.hud = { subs: [], hints: [], pickups: [], hurt: [], flash: null, fade: null, shake: 0, shakeT: 0, title: null, bucketT: 0, notice: null, squad: null };
      this.vm = { swing: 0, kick: 0, bobX: 0, bobY: 0, squeeze: 0 };
      this.audio = new H.Audio98();
      this.build();
      this.bind();
      this.renderer = null;
      try {
        this.renderer = new H.Renderer(this.view, { preserve: !!opts.preserve });
        this.applyVideo();
      } catch (e) {
        this.glError = String(e && e.message || e);
      }
      this.showMainMenu();
      this.raf = requestAnimationFrame(t => this.frame(t));
    }

    build() {
      const r = this.root;
      r.innerHTML = '';
      const el = document.createElement('div');
      el.className = 'hl2';
      el.tabIndex = 0;
      el.innerHTML = `
        <canvas class="hl2-view"></canvas>
        <canvas class="hl2-hud"></canvas>
        <div class="hl2-layer hl2-menu"></div>
        <div class="hl2-layer hl2-dialog"></div>
        <div class="hl2-layer hl2-loading"><div class="hl2-load-title"></div><div class="hl2-load-box"><span>ЗАГРУЗКА</span><div class="hl2-load-bar"><div></div></div></div></div>
        <div class="hl2-layer hl2-credits"><div class="hl2-credits-roll"></div></div>`;
      r.appendChild(el);
      this.el = el;
      this.view = el.querySelector('.hl2-view');
      this.hudCv = el.querySelector('.hl2-hud');
      this.hctx = this.hudCv.getContext('2d');
      this.menuEl = el.querySelector('.hl2-menu');
      this.dialogEl = el.querySelector('.hl2-dialog');
      this.loadEl = el.querySelector('.hl2-loading');
      this.creditsEl = el.querySelector('.hl2-credits');
    }

    active() { return this.opts.isActive ? this.opts.isActive() : true; }

    bind() {
      const el = this.el;
      this.onKeyDown = e => {
        if (!this.active()) return;
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') && e.code !== 'Escape') return;
        this.audio.init();
        this.audio.resume();
        if (e.code === 'Escape') {
          e.preventDefault();
          if (this.mode === 'play') this.pause();
          else if (this.mode === 'paused' && !this.dialogOpen) this.resume();
          else if (this.dialogOpen) this.closeDialog();
          else if (this.mode === 'credits') this.endCredits();
          return;
        }
        if (this.mode === 'dead' && this.game && this.game.player.deadT > 1.5) { e.preventDefault(); this.loadLatest(); return; }
        if (this.mode !== 'play') return;
        if (['F5', 'F6'].includes(e.code)) { e.preventDefault(); this.quickSave(); return; }
        if (e.code === 'F9') { e.preventDefault(); this.quickLoad(); return; }
        const act = KEYMAP[e.code];
        if (act || /^Digit[1-6]$/.test(e.code) || e.code.startsWith('Arrow') || e.code === 'Tab') e.preventDefault();
        if (/^Digit[1-6]$/.test(e.code)) { this.input.slot = Number(e.code.slice(5)); this.hud.bucketT = 1.6; }
        if (act) this.keys[act] = true;
        if (e.code === 'ArrowLeft') this.keys.turnL = true;
        if (e.code === 'ArrowRight') this.keys.turnR = true;
      };
      this.onKeyUp = e => {
        const act = KEYMAP[e.code];
        if (act) this.keys[act] = false;
        if (/^Digit[1-6]$/.test(e.code)) this.input.slot = 0;
        if (e.code === 'ArrowLeft') this.keys.turnL = false;
        if (e.code === 'ArrowRight') this.keys.turnR = false;
        if (e.code === 'AltLeft') e.preventDefault();
      };
      this.onMouseMove = e => {
        if (this.mode !== 'play' || !this.game || document.pointerLockElement !== this.view) return;
        const p = this.game.player;
        const s = this.o.sens * (p.zoom ? 0.35 : 1);
        p.yaw -= e.movementX * s;
        p.pitch -= e.movementY * s * (this.o.invert ? -1 : 1);
        p.pitch = H.clamp(p.pitch, -1.55, 1.55);
      };
      this.onMouseDown = e => {
        if (this.mode !== 'play') return;
        this.audio.init();
        this.audio.resume();
        if (document.pointerLockElement !== this.view && this.view.requestPointerLock) {
          try { const r = this.view.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (err) { }
        }
        if (e.button === 0) this.keys.fire1 = true;
        if (e.button === 2) this.keys.fire2 = true;
        e.preventDefault();
      };
      this.onMouseUp = e => {
        if (e.button === 0) this.keys.fire1 = false;
        if (e.button === 2) this.keys.fire2 = false;
      };
      this.onWheel = e => {
        if (this.mode !== 'play') return;
        e.preventDefault();
        if (e.deltaY > 0) this.keys.nextPulse = true; else this.keys.prevPulse = true;
        this.hud.bucketT = 1.6;
      };
      this.onContext = e => e.preventDefault();
      this.onBlur = () => { this.keys = {}; };
      this.keyTarget = this.opts.standalone ? window : el;
      this.keyTarget.addEventListener('keydown', this.onKeyDown);
      this.keyTarget.addEventListener('keyup', this.onKeyUp);
      document.addEventListener('mousemove', this.onMouseMove);
      this.view.addEventListener('mousedown', this.onMouseDown);
      this.hudCv.addEventListener('mousedown', this.onMouseDown);
      document.addEventListener('mouseup', this.onMouseUp);
      el.addEventListener('wheel', this.onWheel, { passive: false });
      el.addEventListener('contextmenu', this.onContext);
      window.addEventListener('blur', this.onBlur);
      el.addEventListener('mousedown', () => el.focus({ preventScroll: true }));
    }

    saveProfile() {
      this.profile.opt = this.o;
      saveJSON(PROFILE_KEY, this.profile);
    }

    applyVideo() {
      const r = this.renderer;
      if (!r) return;
      r.opts.dither = this.o.renderer === 'software' ? false : !!this.o.dither;
      r.opts.bright = this.o.bright;
      r.opts.fov = this.o.fov;
      r.opts.fogScale = this.o.draw;
      r.setFilter(this.o.renderer === 'software' ? 'point' : 'linear');
      this.view.style.imageRendering = this.o.renderer === 'software' || Number(this.o.res) <= 360 ? 'pixelated' : 'auto';
      this.audio.setVolume(this.o.vol, this.o.music);
    }

    sizeCanvases() {
      const w = Math.max(64, this.el.clientWidth), h = Math.max(48, this.el.clientHeight);
      let lines = this.o.renderer === 'software' ? Math.min(RES[this.o.res] || 240, 240) : RES[this.o.res];
      if (!lines) lines = h;
      lines = Math.min(lines, h);
      const vw = Math.round(lines * w / h), vh = Math.round(lines);
      if (this.renderer) this.renderer.resize(vw, vh);
      if (this.hudCv.width !== w || this.hudCv.height !== h) { this.hudCv.width = w; this.hudCv.height = h; }
    }

    chapterOf(mapId) {
      const i = H.CHAPTERS.findIndex(c => c.map === mapId);
      if (i >= 0) return i;
      const d = H.maps[mapId];
      return d && d.chapter !== undefined ? d.chapter : 0;
    }

    ensureBackground() {
      if (this.game && (this.mode === 'paused' || this.mode === 'play')) return;
      const ch = Math.max(...this.profile.unlocked);
      const map = (H.CHAPTERS[ch] || H.CHAPTERS[0]).map;
      if (this.bg && this.bg.mapId === map) return;
      try {
        this.bg = new H.Game({ map, skill: 1 });
        this.bg.menu = true;
        const mc = this.bg.def.menuCam || this.bg.def.start;
        this.bgCam = { x: mc.x, y: (mc.y !== undefined ? mc.y : this.bg.world.spawnY(mc.x, mc.z, null, 0.3) + 1.7), z: mc.z, yaw: mc.yaw || 0 };
        if (this.renderer) this.renderer.loadWorld(this.bg.world);
      } catch (e) { this.bg = null; }
    }

    showMainMenu() {
      this.mode = this.game && this.mode === 'paused' ? 'paused' : 'menu';
      this.ensureBackground();
      if (this.audio.ctx) this.audio.playMusic('city');
      const inGame = this.mode === 'paused';
      const items = [];
      if (inGame) items.push(['resume', 'ПРОДОЛЖИТЬ']);
      const hasSaves = Object.keys(this.saves).length > 0;
      if (hasSaves && !inGame) items.push(['continue', 'ПРОДОЛЖИТЬ ИГРУ']);
      items.push(['new', 'НОВАЯ ИГРА']);
      items.push(['load', 'ЗАГРУЗИТЬ ИГРУ']);
      if (inGame) items.push(['save', 'СОХРАНИТЬ ИГРУ']);
      items.push(['options', 'ПАРАМЕТРЫ']);
      if (inGame) items.push(['quitmenu', 'ВЫЙТИ В ГЛАВНОЕ МЕНЮ']);
      if (!this.opts.standalone) items.push(['exit', 'ВЫХОД']);
      this.menuEl.innerHTML = `
        <div class="hl2-logo"><span class="hl2-logo-hl">HALF-LIFE</span><span class="hl2-logo-2">2</span></div>
        <div class="hl2-logo-sub">ИЗДАНИЕ 2000 ГОДА</div>
        <div class="hl2-items">${items.map(([id, t]) => `<div class="hl2-item" data-m="${id}">${t}</div>`).join('')}</div>
        ${this.glError ? `<div class="hl2-glerr">Не удалось инициализировать 3D-ускоритель: ${esc(this.glError)}</div>` : ''}
        <div class="hl2-ver">Valve Software · Win 98 Edition · v1.0.0.4 (Build 2000-11-16)</div>`;
      this.menuEl.style.display = 'flex';
      this.menuEl.querySelectorAll('.hl2-item').forEach(it => it.addEventListener('click', () => this.menuAction(it.dataset.m)));
    }

    menuAction(id) {
      this.audio.init();
      this.audio.resume();
      this.audio.play('button');
      if (id === 'resume') this.resume();
      else if (id === 'continue') this.loadLatest();
      else if (id === 'new') this.dialogNewGame();
      else if (id === 'load') this.dialogLoad();
      else if (id === 'save') this.dialogSave();
      else if (id === 'options') this.dialogOptions();
      else if (id === 'quitmenu') { this.game = null; this.mode = 'menu'; this.audio.stopLoops(); this.showMainMenu(); }
      else if (id === 'exit') { if (this.opts.onExit) this.opts.onExit(); }
    }

    openDialog(title, html, w = 520) {
      this.dialogOpen = true;
      this.dialogEl.innerHTML = `<div class="hl2-win" style="width:${w}px"><div class="hl2-win-title"><span>${esc(title)}</span><b class="hl2-x">×</b></div><div class="hl2-win-body">${html}</div></div>`;
      this.dialogEl.style.display = 'flex';
      this.dialogEl.querySelector('.hl2-x').addEventListener('click', () => this.closeDialog());
      return this.dialogEl.querySelector('.hl2-win-body');
    }

    closeDialog() {
      this.dialogOpen = false;
      this.dialogEl.style.display = 'none';
      this.dialogEl.innerHTML = '';
    }

    dialogNewGame() {
      const un = this.profile.unlocked;
      let sel = Math.max(...un);
      let skill = 1;
      const body = this.openDialog('НОВАЯ ИГРА', `
        <div class="hl2-chapters">${H.CHAPTERS.map((c, i) => `<div class="hl2-ch ${un.includes(i) ? '' : 'locked'}" data-i="${i}"><div class="hl2-ch-img" style="background:${c.color}"><span>${i + 1}</span></div><div class="hl2-ch-t">ГЛАВА ${i + 1}</div><div class="hl2-ch-n">${un.includes(i) ? esc(c.title) : '???'}</div></div>`).join('')}</div>
        <div class="hl2-row"><label>Сложность</label><select class="hl2-skill">${H.SKILLS.map((s, i) => `<option value="${i}" ${i === 1 ? 'selected' : ''}>${s.name}</option>`).join('')}</select></div>
        <div class="hl2-btns"><button class="hl2-btn" data-b="start">Начать новую игру</button><button class="hl2-btn" data-b="cancel">Отмена</button></div>`, 640);
      const mark = () => body.querySelectorAll('.hl2-ch').forEach(e => e.classList.toggle('sel', Number(e.dataset.i) === sel));
      mark();
      body.querySelectorAll('.hl2-ch').forEach(e => e.addEventListener('click', () => { const i = Number(e.dataset.i); if (un.includes(i)) { sel = i; mark(); } }));
      body.querySelector('.hl2-skill').addEventListener('change', e => { skill = Number(e.target.value); });
      body.querySelector('[data-b=start]').addEventListener('click', () => { this.closeDialog(); this.startChapter(sel, skill); });
      body.querySelector('[data-b=cancel]').addEventListener('click', () => this.closeDialog());
    }

    saveList() {
      return Object.entries(this.saves).filter(([, v]) => v && v.data).sort((a, b) => b[1].when - a[1].when);
    }

    slotLabel(k) { return k === 'quick' ? 'Быстрое сохранение' : k === 'auto' ? 'Автосохранение' : 'Сохранение ' + k.slice(1); }

    dialogLoad() {
      const list = this.saveList();
      const body = this.openDialog('ЗАГРУЗИТЬ ИГРУ', `
        <div class="hl2-saves">${list.length ? list.map(([k, v]) => `<div class="hl2-save" data-k="${k}"><b>${esc(this.slotLabel(k))}</b><span>Глава ${v.chapter + 1}: ${esc((H.CHAPTERS[v.chapter] || {}).title || '')}</span><small>${new Date(v.when).toLocaleString('ru-RU')} · ${esc(H.SKILLS[v.data.skill].name)}</small></div>`).join('') : '<div class="hl2-empty">Нет сохранённых игр</div>'}</div>
        <div class="hl2-btns"><button class="hl2-btn" data-b="load">Загрузить</button><button class="hl2-btn" data-b="del">Удалить</button><button class="hl2-btn" data-b="cancel">Отмена</button></div>`, 520);
      let sel = list.length ? list[0][0] : null;
      const mark = () => body.querySelectorAll('.hl2-save').forEach(e => e.classList.toggle('sel', e.dataset.k === sel));
      mark();
      body.querySelectorAll('.hl2-save').forEach(e => {
        e.addEventListener('click', () => { sel = e.dataset.k; mark(); });
        e.addEventListener('dblclick', () => { this.closeDialog(); this.loadSlot(e.dataset.k); });
      });
      body.querySelector('[data-b=load]').addEventListener('click', () => { if (sel) { this.closeDialog(); this.loadSlot(sel); } });
      body.querySelector('[data-b=del]').addEventListener('click', () => { if (sel) { delete this.saves[sel]; saveJSON(SAVE_KEY, this.saves); this.closeDialog(); this.dialogLoad(); } });
      body.querySelector('[data-b=cancel]').addEventListener('click', () => this.closeDialog());
    }

    dialogSave() {
      if (!this.game) return;
      const slots = ['s1', 's2', 's3', 's4', 's5'];
      const body = this.openDialog('СОХРАНИТЬ ИГРУ', `
        <div class="hl2-saves">${slots.map(k => { const v = this.saves[k]; return `<div class="hl2-save" data-k="${k}"><b>${esc(this.slotLabel(k))}</b><span>${v ? `Глава ${v.chapter + 1}: ${esc((H.CHAPTERS[v.chapter] || {}).title || '')}` : 'Пусто'}</span><small>${v ? new Date(v.when).toLocaleString('ru-RU') : ''}</small></div>`; }).join('')}</div>
        <div class="hl2-btns"><button class="hl2-btn" data-b="save">Сохранить</button><button class="hl2-btn" data-b="cancel">Отмена</button></div>`, 520);
      let sel = 's1';
      const mark = () => body.querySelectorAll('.hl2-save').forEach(e => e.classList.toggle('sel', e.dataset.k === sel));
      mark();
      body.querySelectorAll('.hl2-save').forEach(e => e.addEventListener('click', () => { sel = e.dataset.k; mark(); }));
      body.querySelector('[data-b=save]').addEventListener('click', () => { this.saveTo(sel); this.closeDialog(); this.resume(); });
      body.querySelector('[data-b=cancel]').addEventListener('click', () => this.closeDialog());
    }

    dialogOptions() {
      const o = this.o;
      const body = this.openDialog('ПАРАМЕТРЫ', `
        <div class="hl2-tabs"><span data-t="mouse" class="on">Мышь</span><span data-t="video">Видео</span><span data-t="audio">Звук</span><span data-t="keys">Клавиши</span></div>
        <div class="hl2-tab" data-p="mouse">
          <div class="hl2-row"><label>Чувствительность мыши</label><input type="range" min="0.0008" max="0.006" step="0.0001" data-o="sens" value="${o.sens}"></div>
          <div class="hl2-row"><label>Инвертировать мышь</label><input type="checkbox" data-o="invert" ${o.invert ? 'checked' : ''}></div>
          <div class="hl2-row"><label>Поле зрения</label><input type="range" min="65" max="100" step="1" data-o="fov" value="${o.fov}"></div>
        </div>
        <div class="hl2-tab" data-p="video" style="display:none">
          <div class="hl2-row"><label>Режим рендеринга</label><select data-o="renderer"><option value="opengl" ${o.renderer === 'opengl' ? 'selected' : ''}>OpenGL (3D-ускоритель)</option><option value="software" ${o.renderer === 'software' ? 'selected' : ''}>Программный</option></select></div>
          <div class="hl2-row"><label>Разрешение</label><select data-o="res">${[['240', '320×240'], ['360', '512×384'], ['480', '640×480'], ['600', '800×600'], ['native', 'Как у окна']].map(([v, t]) => `<option value="${v}" ${o.res === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
          <div class="hl2-row"><label>16-битный цвет (дизеринг)</label><input type="checkbox" data-o="dither" ${o.dither ? 'checked' : ''}></div>
          <div class="hl2-row"><label>Яркость</label><input type="range" min="0.8" max="1.6" step="0.05" data-o="bright" value="${o.bright}"></div>
          <div class="hl2-row"><label>Дальность прорисовки</label><input type="range" min="0.6" max="1.6" step="0.1" data-o="draw" value="${o.draw}"></div>
          <div class="hl2-row"><label>Показывать FPS</label><input type="checkbox" data-o="fps" ${o.fps ? 'checked' : ''}></div>
          <div class="hl2-note">Программный режим: 320×240, без фильтрации текстур. Требуется Pentium II 300 МГц.</div>
        </div>
        <div class="hl2-tab" data-p="audio" style="display:none">
          <div class="hl2-row"><label>Громкость звука</label><input type="range" min="0" max="1" step="0.05" data-o="vol" value="${o.vol}"></div>
          <div class="hl2-row"><label>Громкость музыки</label><input type="range" min="0" max="1" step="0.05" data-o="music" value="${o.music}"></div>
          <div class="hl2-row"><label>Субтитры</label><input type="checkbox" data-o="subs" ${o.subs ? 'checked' : ''}></div>
        </div>
        <div class="hl2-tab hl2-keys" data-p="keys" style="display:none">
          <div>W A S D — движение</div><div>Мышь — обзор, ЛКМ / ПКМ — огонь / альт. огонь</div><div>Пробел — прыжок, C / Ctrl — присесть</div><div>Shift — бег (энергия костюма), Z / Alt — шаг</div>
          <div>E — использовать / поднять, R — перезарядка, F — фонарик</div><div>1–6, колесо — оружие, Q — прошлое оружие</div><div>G — команда отряду, F6 / F9 — быстрое сохранение / загрузка</div><div>Esc — меню</div>
        </div>
        <div class="hl2-btns"><button class="hl2-btn" data-b="ok">OK</button></div>`, 520);
      body.querySelectorAll('.hl2-tabs span').forEach(t => t.addEventListener('click', () => {
        body.querySelectorAll('.hl2-tabs span').forEach(x => x.classList.toggle('on', x === t));
        body.querySelectorAll('.hl2-tab').forEach(p => { p.style.display = p.dataset.p === t.dataset.t ? '' : 'none'; });
      }));
      body.querySelectorAll('[data-o]').forEach(inp => inp.addEventListener('input', () => {
        const k = inp.dataset.o;
        o[k] = inp.type === 'checkbox' ? inp.checked : inp.type === 'range' ? Number(inp.value) : inp.value;
        this.applyVideo();
        this.saveProfile();
      }));
      body.querySelector('[data-b=ok]').addEventListener('click', () => this.closeDialog());
    }

    startChapter(i, skill = 1) {
      const c = H.CHAPTERS[i];
      if (!c) return;
      this.loadMap(c.map, { skill, carry: c.carry ? c.carry() : null, fresh: true });
    }

    loadMap(map, o = {}) {
      this.mode = 'loading';
      this.menuEl.style.display = 'none';
      this.closeDialog();
      this.audio.stopLoops();
      const ch = this.chapterOf(map);
      this.loadEl.style.display = 'flex';
      this.loadEl.querySelector('.hl2-load-title').innerHTML = `<small>ГЛАВА ${ch + 1}</small>${esc((H.CHAPTERS[ch] || {}).title || '')}`;
      const bar = this.loadEl.querySelector('.hl2-load-bar div');
      bar.style.width = '10%';
      const finish = () => {
        try {
          const g = o.save ? new H.Game({ map, save: o.save, skill: o.save.skill }) : new H.Game({ map, skill: o.skill !== undefined ? o.skill : (this.game ? this.game.skillIndex : 1), carry: o.carry || null, spot: o.spot || null });
          this.game = g;
          this.bg = null;
          bar.style.width = '60%';
          if (this.renderer) this.renderer.loadWorld(g.world);
          bar.style.width = '100%';
          if (!this.profile.unlocked.includes(ch)) { this.profile.unlocked.push(ch); this.saveProfile(); }
          this.hud.subs = []; this.hud.hints = []; this.hud.flash = null; this.hud.fade = o.save ? null : { col: [0, 0, 0], t: 0, dur: 1.2, hold: 0 };
          this.acc = 0;
          this.keys = {};
          this.mode = 'play';
          this.loadEl.style.display = 'none';
          if (!o.save) this.saveTo('auto');
          this.audio.playMusic(g.def.music || 'city');
          this.el.focus({ preventScroll: true });
        } catch (e) {
          this.loadEl.style.display = 'none';
          this.mode = 'menu';
          this.showMainMenu();
          this.openDialog('ОШИБКА', `<div class="hl2-note">${esc(e.stack || e)}</div>`);
        }
      };
      setTimeout(finish, 60);
    }

    saveTo(slot) {
      if (!this.game || this.game.player.dead) return false;
      const data = this.game.serialize();
      this.saves[slot] = { when: Date.now(), map: data.map, chapter: this.chapterOf(data.map), data };
      const ok = saveJSON(SAVE_KEY, this.saves);
      this.hud.notice = { text: ok ? (slot === 'auto' ? 'Автосохранение...' : 'Игра сохранена') : 'Ошибка сохранения', t: 2 };
      return ok;
    }

    loadSlot(k) {
      const s = this.saves[k];
      if (!s) return;
      this.loadMap(s.data.map, { save: JSON.parse(JSON.stringify(s.data)) });
    }

    quickSave() { this.saveTo('quick'); }
    quickLoad() { if (this.saves.quick) this.loadSlot('quick'); }
    loadLatest() {
      const list = this.saveList();
      if (list.length) this.loadSlot(list[0][0]);
      else this.startChapter(0, 1);
    }

    pause() {
      this.mode = 'paused';
      if (document.pointerLockElement === this.view && document.exitPointerLock) document.exitPointerLock();
      this.keys = {};
      this.audio.stopLoops();
      this.showMainMenu();
    }

    resume() {
      if (!this.game) return;
      this.closeDialog();
      this.menuEl.style.display = 'none';
      this.mode = 'play';
      this.el.focus({ preventScroll: true });
      if (this.game.player.dead) this.mode = 'dead';
    }

    gatherInput() {
      const k = this.keys;
      const inp = {
        fwd: (k['fwd+'] ? 1 : 0) - (k['fwd-'] ? 1 : 0), side: (k['side+'] ? 1 : 0) - (k['side-'] ? 1 : 0),
        jump: !!k.jump, duck: !!k.duck, sprint: !!k.sprint, walk: !!k.walk, use: !!k.use, reload: !!k.reload, flashlight: !!k.flashlight,
        fire1: !!k.fire1, fire2: !!k.fire2, last: !!k.last, squad: !!k.squad, slot: this.input.slot || 0, next: !!k.nextPulse, prev: !!k.prevPulse
      };
      return inp;
    }

    frame(ts) {
      this.raf = requestAnimationFrame(t => this.frame(t));
      const dt = Math.min(0.1, (ts - (this.last || ts)) / 1000);
      this.last = ts;
      this.fpsAcc = (this.fpsAcc || 0) * 0.95 + (dt > 0 ? 1 / dt : 60) * 0.05;
      this.sizeCanvases();
      const g = this.game;
      if (g && (this.mode === 'play' || this.mode === 'dead')) {
        if (this.keys.turnL) g.player.yaw += dt * 2.2;
        if (this.keys.turnR) g.player.yaw -= dt * 2.2;
        this.acc += dt;
        let steps = 0;
        while (this.acc >= H.TICK && steps < 6) {
          const inp = this.gatherInput();
          g.step(inp);
          this.keys.nextPulse = false;
          this.keys.prevPulse = false;
          this.acc -= H.TICK;
          steps++;
          this.consumeEvents(g);
          if (g.pendingMap) break;
        }
        if (steps >= 6) this.acc = 0;
        if (g.pendingMap && this.mode === 'play') { const map = g.pendingMap, spot = g.pendingSpot; g.pendingMap = null; this.loadMap(map, { carry: g.carry(), spot, skill: g.skillIndex }); }
        if (g.player.dead && this.mode === 'play') { this.mode = 'dead'; if (document.pointerLockElement === this.view && document.exitPointerLock) document.exitPointerLock(); }
        this.updateLoops(g);
      } else if (this.bg && (this.mode === 'menu')) {
        this.bg.time += dt;
      }
      this.renderScene(dt);
      this.drawHud(dt);
      this.audio.tick();
    }

    consumeEvents(g) {
      for (const ev of g.events) {
        switch (ev.type) {
          case 'sound': this.audio.play(ev.name, ev.pos || null, ev.vol === undefined ? 1 : ev.vol); break;
          case 'say': if (this.o.subs || ev.who === 'hev') this.addSub(ev.who, ev.text, ev.dur, ev.bark); if (ev.who === 'metrocop' || ev.who === 'soldier' || ev.who === 'overwatch') this.audio.play('radio'); break;
          case 'hint': this.hud.hints = [{ text: ev.text, t: ev.dur }]; break;
          case 'hurt': this.hud.hurt.push({ dir: ev.dir, t: 1, amount: ev.amount }); this.hud.dmgFlash = Math.min(0.6, (this.hud.dmgFlash || 0) + ev.amount * 0.02); break;
          case 'shake': this.hud.shake = Math.max(this.hud.shake, ev.amount); this.hud.shakeT = Math.max(this.hud.shakeT, ev.dur); break;
          case 'flash': this.hud.flash = { col: ev.col, t: ev.dur, dur: ev.dur }; break;
          case 'fade': this.hud.fade = { col: ev.col, t: 0, dur: ev.dur, hold: ev.hold, out: true }; break;
          case 'pickup': this.hud.pickups.push({ text: this.itemName(ev.item), t: 3 }); break;
          case 'weapon': this.hud.bucketT = Math.max(this.hud.bucketT, 1.2); break;
          case 'viewanim': if (ev.anim === 'fire') this.vm.kick = 1; else if (ev.anim === 'swing') this.vm.swing = 1; else if (ev.anim === 'punt') this.vm.kick = 1.4; else if (ev.anim === 'throw') this.vm.swing = 1; break;
          case 'title': this.hud.title = { ch: ev.chapter, t: 0 }; break;
          case 'autosave': this.saveTo('auto'); break;
          case 'music': if (ev.name) this.audio.playMusic(ev.name); else this.audio.stopMusic(); break;
          case 'cache': this.hud.notice = { text: `Тайник повстанцев λ найден (${ev.n} из ${ev.total})`, t: 3 }; break;
          case 'squad': this.hud.squad = { text: ev.text, t: 2 }; break;
          case 'suit': this.hud.notice = { text: 'Костюм H.E.V. активирован', t: 3 }; break;
          case 'credits': setTimeout(() => this.rollCredits(), 2500); break;
          case 'gghum': this.ggHumT = 0.1; break;
          case 'death': break;
        }
      }
      g.events.length = 0;
    }

    itemName(type) {
      const it = H.ITEMS[type];
      if (!it) return type;
      if (it.name) return it.name;
      if (it.weapon) return H.WEAPONS[it.weapon].name;
      if (it.ammo) return `${H.AMMO[it.ammo].name} +${it.count}`;
      return type;
    }

    addSub(who, text, dur, bark) {
      const sp = H.SPEAKERS[who] || [who, '#d0d0d0'];
      if (bark && this.hud.subs.length > 2) return;
      this.hud.subs.push({ name: sp[0], col: sp[1], text, t: dur + 0.4 });
      if (this.hud.subs.length > 4) this.hud.subs.shift();
    }

    updateLoops(g) {
      const a = this.audio;
      if (!a.ctx) return;
      const pl = g.player;
      a.listener.pos = g.eye();
      a.listener.yaw = pl.yaw;
      for (const v of g.vehicles) {
        const drive = pl.vehicle === v;
        const spd = Math.hypot(v.vel.x, v.vel.z);
        a.loop(v.type, drive ? 0.35 + v.engine * 0.3 : (spd > 1 ? 0.2 : 0), 0.8 + v.engine * 1.2 + spd * 0.02, drive ? null : v.pos);
      }
      const chop = g.npcs.find(n => n.alive && (n.type === 'hunterchopper' || n.type === 'gunship' || n.type === 'dropship'));
      a.loop('chopper', chop ? 0.6 : 0, 1, chop ? chop.pos : null);
      const strider = g.npcs.find(n => n.alive && n.type === 'strider');
      a.loop('strider', strider ? 0.5 : 0, 1, strider ? strider.pos : null);
      this.ggHumT = (this.ggHumT || 0) - 1 / 60;
      a.loop('gghum', pl.held && pl.held.mode === 'gravgun' ? 0.12 : this.ggHumT > 0 ? 0.2 : 0, pl.held ? 1 + Math.min(1, (pl.held.ent.mass || 20) / 200) * 0.3 : 1.4);
      a.loop('charger', g.chargers.some(c => c.active && c.charge > 0) ? 0.2 : 0, 1);
      a.loop('wind', g.def.wind ? 0.25 : 0, 1);
      const reactor = g.world.models.find(m => m.kind === 'reactor');
      a.loop('reactor', reactor ? 0.4 : 0, 1 + (reactor ? (reactor.hits || 0) * 0.2 : 0), reactor ? { x: reactor.x, y: reactor.y + 5, z: reactor.z } : null);
      const fire = g.hazards.find(h => h.on && h.type === 'fire' && H.dist(pl.pos, { x: (h.box.x1 + h.box.x2) / 2, y: h.box.y1, z: (h.box.z1 + h.box.z2) / 2 }) < 15);
      a.loop('fire', fire ? 0.3 : 0, 1, fire ? { x: (fire.box.x1 + fire.box.x2) / 2, y: fire.box.y1, z: (fire.box.z1 + fire.box.z2) / 2 } : null);
    }

    renderScene(dt) {
      const r = this.renderer;
      if (!r) return;
      const g = (this.mode === 'play' || this.mode === 'dead' || this.mode === 'paused' || this.mode === 'loading') && this.game ? this.game : this.bg;
      if (!g || this.mode === 'loading') {
        const gl = r.gl;
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }
      if (r.world !== g.world) r.loadWorld(g.world);
      let view;
      if (g === this.bg) {
        const c = this.bgCam;
        const yaw = c.yaw + Math.sin(g.time * 0.05) * 0.6;
        view = { eye: { x: c.x, y: c.y, z: c.z }, yaw, pitch: 0.05 + Math.sin(g.time * 0.07) * 0.05, viewmodel: false };
      } else {
        const pl = g.player;
        const eye = g.eye();
        this.hud.shakeT = Math.max(0, this.hud.shakeT - dt);
        if (this.hud.shakeT <= 0) this.hud.shake = 0;
        const sh = this.hud.shake * (this.hud.shakeT > 0 ? 1 : 0);
        if (sh > 0) { eye.x += (Math.random() - 0.5) * sh * 0.15; eye.y += (Math.random() - 0.5) * sh * 0.15; eye.z += (Math.random() - 0.5) * sh * 0.15; }
        const hs = Math.hypot(pl.vel.x, pl.vel.z);
        const bobAmp = pl.onGround && !pl.vehicle ? Math.min(1, hs / 5) : 0;
        if (!pl.vehicle && !pl.dead) eye.y += Math.sin(pl.bob * 2) * 0.03 * bobAmp;
        const vm = this.vm;
        vm.bobX = Math.sin(pl.bob) * 0.012 * bobAmp;
        vm.bobY = -Math.abs(Math.cos(pl.bob)) * 0.01 * bobAmp - (pl.drawT > 0 ? pl.drawT * 0.4 : 0) - (pl.reloadT > 0 && !pl.shellReload ? 0.06 : 0);
        vm.kick = Math.max(0, vm.kick - dt * 9);
        vm.swing = Math.max(0, vm.swing - dt * 3.2);
        const fp = pl.dead ? 0.35 : 0;
        const under = g.world.waterAt(eye.x, eye.z) > eye.y ? g.world.waterType(eye.x, eye.z) : null;
        let laserPoint = null;
        if (pl.cur === 'rpg' && pl.laser) { const h = g.traceLine(eye, g.aimDir(), 300, { ignore: pl }); if (h) laserPoint = H.vadd(h.point, h.n || { x: 0, y: 1, z: 0 }, 0.05); }
        view = {
          eye, yaw: pl.yaw, pitch: H.clamp(pl.pitch + pl.punch, -1.55, 1.55), roll: fp, flashlight: pl.flashlight, underwater: under,
          viewmodel: true, vmAnim: vm, zoom: pl.zoom, fov: pl.zoom ? 20 : this.o.fov, laserPoint
        };
      }
      try { r.render(g, view); } catch (e) { this.renderError = String(e.stack || e); }
    }

    drawHud(dt) {
      const c = this.hctx, W = this.hudCv.width, Hh = this.hudCv.height;
      c.clearRect(0, 0, W, Hh);
      const hud = this.hud;
      if (this.o.fps) { c.fillStyle = '#ff0'; c.font = '12px monospace'; c.fillText(`${Math.round(this.fpsAcc || 0)} fps  ${this.renderer ? this.renderer.stats.tris : 0} tris`, 8, 16); }
      if (this.renderError && this.mode === 'play') { c.fillStyle = '#f66'; c.font = '11px monospace'; c.fillText(this.renderError.slice(0, 160), 8, 30); }
      const g = this.game;
      if (!g || this.mode === 'menu' || this.mode === 'loading' || this.mode === 'credits') return;
      const pl = g.player;
      const S = Math.max(0.7, Math.min(1.6, Hh / 600));
      const view = { eye: g.eye() };
      if (pl.zoom) {
        const r = Math.min(W, Hh) * 0.46;
        c.fillStyle = '#000';
        c.beginPath(); c.rect(0, 0, W, Hh); c.arc(W / 2, Hh / 2, r, 0, Math.PI * 2, true); c.fill();
        c.strokeStyle = 'rgba(255,208,64,0.6)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(W / 2 - r, Hh / 2); c.lineTo(W / 2 + r, Hh / 2); c.moveTo(W / 2, Hh / 2 - r); c.lineTo(W / 2, Hh / 2 + r); c.stroke();
      }
      const under = g.world.waterAt(view.eye.x, view.eye.z) > view.eye.y;
      if (under) { c.fillStyle = g.world.waterType(view.eye.x, view.eye.z) === 'sludge' ? 'rgba(90,120,20,0.35)' : 'rgba(20,60,70,0.3)'; c.fillRect(0, 0, W, Hh); }
      if (pl.poison > 0) { c.fillStyle = `rgba(180,160,20,${Math.min(0.25, pl.poison * 0.004)})`; c.fillRect(0, 0, W, Hh); }
      hud.dmgFlash = Math.max(0, (hud.dmgFlash || 0) - dt * 1.2);
      if (hud.dmgFlash > 0) { c.fillStyle = `rgba(200,0,0,${hud.dmgFlash * 0.5})`; c.fillRect(0, 0, W, Hh); }
      if (pl.dead) {
        const k = Math.min(1, pl.deadT / 2);
        c.fillStyle = `rgba(120,0,0,${0.3 + k * 0.5})`;
        c.fillRect(0, 0, W, Hh);
        if (pl.deadT > 1.5) { c.fillStyle = '#fff'; c.font = `bold ${Math.round(18 * S)}px Verdana`; c.textAlign = 'center'; c.fillText('Нажмите любую клавишу, чтобы загрузить последнее сохранение', W / 2, Hh / 2); c.textAlign = 'left'; }
      }
      if (pl.suit && !pl.dead && !pl.zoom) this.drawStatus(c, W, Hh, S, g);
      if (!pl.dead) this.drawCrosshair(c, W, Hh, S, g);
      this.drawHurt(c, W, Hh, S, pl, dt);
      if (hud.bucketT > 0 && pl.suit && !pl.vehicle) { hud.bucketT -= dt; this.drawBuckets(c, W, Hh, S, g); }
      this.drawPickups(c, W, Hh, S, dt);
      this.drawSubs(c, W, Hh, S, dt);
      this.drawHints(c, W, Hh, S, dt, g);
      this.drawTitle(c, W, Hh, S, dt);
      if (hud.notice) { hud.notice.t -= dt; if (hud.notice.t <= 0) hud.notice = null; else { c.font = `bold ${Math.round(12 * S)}px Verdana`; c.fillStyle = HUD_COL + Math.min(1, hud.notice.t) + ')'; c.textAlign = 'right'; c.fillText(hud.notice.text, W - 16 * S, 24 * S); c.textAlign = 'left'; } }
      if (hud.squad) { hud.squad.t -= dt; if (hud.squad.t <= 0) hud.squad = null; else { c.font = `bold ${Math.round(12 * S)}px Verdana`; c.fillStyle = HUD_COL + Math.min(1, hud.squad.t) + ')'; c.textAlign = 'center'; c.fillText(hud.squad.text, W / 2, Hh - 110 * S); c.textAlign = 'left'; } }
      const squad = g.npcs.filter(n => n.alive && n.inSquad && n.def.squad);
      if (squad.length && pl.suit) {
        c.font = `bold ${Math.round(11 * S)}px Verdana`;
        c.fillStyle = HUD_COL + '0.9)';
        c.textAlign = 'center';
        c.fillText(`ОТРЯД: ${squad.length}${squad.some(n => n.hold) ? ' (на позиции)' : ''}  [G]`, W / 2, Hh - 16 * S);
        c.textAlign = 'left';
      }
      if (pl.blind > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(0.9, pl.blind)})`; c.fillRect(0, 0, W, Hh); }
      if (hud.flash) { hud.flash.t -= dt; if (hud.flash.t <= 0) hud.flash = null; else { const k = hud.flash.t / hud.flash.dur; const col = hud.flash.col; c.fillStyle = `rgba(${col[0] * 255 | 0},${col[1] * 255 | 0},${col[2] * 255 | 0},${k})`; c.fillRect(0, 0, W, Hh); } }
      if (hud.fade) {
        const f = hud.fade;
        f.t += dt;
        let a;
        if (f.out) { a = Math.min(1, f.t / Math.max(0.01, f.dur)); if (f.t > f.dur + (f.hold || 0)) { hud.fade = { col: f.col, t: 0, dur: 0.8, hold: 0 }; } }
        else { a = 1 - Math.min(1, f.t / Math.max(0.01, f.dur)); if (f.t >= f.dur) hud.fade = null; }
        const col = f.col;
        c.fillStyle = `rgba(${col[0] * 255 | 0},${col[1] * 255 | 0},${col[2] * 255 | 0},${a})`;
        c.fillRect(0, 0, W, Hh);
      }
    }

    box(c, x, y, w, h) {
      c.fillStyle = 'rgba(0,0,0,0.38)';
      const r = 6;
      c.beginPath();
      c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
      c.fill();
    }

    drawStatus(c, W, Hh, S, g) {
      const pl = g.player;
      const bh = 44 * S, y = Hh - bh - 14 * S;
      const low = pl.hp < 20;
      const col = low ? 'rgba(255,40,30,' : HUD_COL;
      const lab = (t, x, yy, col2) => { c.font = `bold ${Math.round(9 * S)}px Verdana`; c.fillStyle = col2 + '0.85)'; c.fillText(t, x, yy); };
      const big = (t, x, yy, col2) => { c.font = `bold ${Math.round(30 * S)}px 'Trebuchet MS', Verdana`; c.fillStyle = col2 + '0.95)'; c.fillText(t, x, yy); };
      this.box(c, 14 * S, y, 128 * S, bh);
      lab('ЗДОРОВЬЕ', 22 * S, y + bh - 10 * S, col);
      big(String(Math.max(0, Math.ceil(pl.hp))), 76 * S, y + bh - 9 * S, col);
      this.box(c, 150 * S, y, 128 * S, bh);
      lab('БРОНЯ', 158 * S, y + bh - 10 * S, HUD_COL);
      big(String(Math.round(pl.armor)), 206 * S, y + bh - 9 * S, HUD_COL);
      if (pl.aux < 99.5) {
        const ay = y - 26 * S;
        this.box(c, 14 * S, ay, 128 * S, 20 * S);
        lab('ЭНЕРГИЯ', 20 * S, ay + 9 * S, HUD_COL);
        const segs = 10;
        for (let i = 0; i < segs; i++) {
          c.fillStyle = (pl.aux / 100) * segs > i + 0.5 ? HUD_COL + '0.9)' : 'rgba(255,208,64,0.2)';
          c.fillRect(20 * S + i * 11.5 * S, ay + 12 * S, 8.5 * S, 5 * S);
        }
        const what = [pl.sprinting ? 'БЕГ' : null, pl.flashlight ? 'ФОНАРЬ' : null, pl.waterLevel >= 3 ? 'КИСЛОРОД' : null].filter(Boolean).join(' · ');
        if (what) { c.font = `${Math.round(8 * S)}px Verdana`; c.fillStyle = HUD_COL + '0.7)'; c.fillText(what, 72 * S, ay + 9 * S); }
      }
      if (pl.vehicle) {
        const v = pl.vehicle;
        if (v.gun) {
          this.box(c, W - 160 * S, y, 146 * S, bh);
          lab(v.type === 'airboat' ? 'ИМПУЛЬСНАЯ ПУШКА' : 'ТАУ-ПУШКА', W - 152 * S, y + 14 * S, v.overheat ? 'rgba(255,40,30,' : HUD_COL);
          c.fillStyle = 'rgba(255,208,64,0.2)'; c.fillRect(W - 152 * S, y + 22 * S, 130 * S, 10 * S);
          c.fillStyle = v.overheat ? 'rgba(255,60,30,0.9)' : HUD_COL + '0.9)'; c.fillRect(W - 152 * S, y + 22 * S, 130 * S * Math.min(1, v.heat), 10 * S);
        }
        return;
      }
      const w = H.WEAPONS[pl.cur];
      if (w && w.ammo) {
        const clip = w.clip ? (pl.clip[pl.cur] || 0) : pl.ammo[w.ammo];
        const reserve = pl.ammo[w.ammo];
        this.box(c, W - 190 * S, y, 176 * S, bh);
        lab('ПАТРОНЫ', W - 182 * S, y + bh - 10 * S, HUD_COL);
        big(String(clip), W - 128 * S, y + bh - 9 * S, clip === 0 ? 'rgba(255,40,30,' : HUD_COL);
        if (w.clip && pl.cur !== 'rpg') { c.font = `bold ${Math.round(15 * S)}px 'Trebuchet MS', Verdana`; c.fillStyle = HUD_COL + '0.9)'; c.fillText(String(reserve), W - 64 * S, y + bh - 10 * S); }
        if (pl.cur === 'rpg') { c.font = `bold ${Math.round(15 * S)}px 'Trebuchet MS', Verdana`; c.fillStyle = HUD_COL + '0.9)'; c.fillText(String(reserve), W - 64 * S, y + bh - 10 * S); }
        if (w.alt) {
          this.box(c, W - 262 * S, y, 64 * S, bh);
          lab('АЛЬТ', W - 254 * S, y + bh - 10 * S, HUD_COL);
          big(String(pl.ammo[w.alt]), W - 226 * S, y + bh - 9 * S, HUD_COL);
        }
      }
    }

    drawCrosshair(c, W, Hh, S, g) {
      const pl = g.player;
      if (pl.zoom || !pl.suit && !pl.cur) return;
      const x = W / 2, y = Hh / 2;
      c.fillStyle = HUD_COL + '0.9)';
      c.fillRect(x - 1, y - 1, 2, 2);
      if (!pl.suit) return;
      const r = 12 * S;
      c.lineWidth = 2;
      const hpK = Math.max(0, Math.min(1, pl.hp / 100));
      c.strokeStyle = HUD_COL + '0.25)';
      c.beginPath(); c.arc(x, y, r, Math.PI * 0.75, Math.PI * 1.25); c.stroke();
      c.beginPath(); c.arc(x, y, r, -Math.PI * 0.25, Math.PI * 0.25); c.stroke();
      c.strokeStyle = pl.hp < 20 ? 'rgba(255,40,30,0.9)' : HUD_COL + '0.8)';
      c.beginPath(); c.arc(x, y, r, Math.PI * 1.25 - Math.PI * 0.5 * hpK, Math.PI * 1.25); c.stroke();
      const w = H.WEAPONS[pl.cur];
      let ammoK = 1;
      if (w && w.clip) ammoK = (pl.clip[pl.cur] || 0) / w.clip;
      else if (w && w.ammo) ammoK = Math.min(1, pl.ammo[w.ammo] / H.AMMO[w.ammo].max);
      c.strokeStyle = HUD_COL + '0.8)';
      c.beginPath(); c.arc(x, y, r, -Math.PI * 0.25, -Math.PI * 0.25 + Math.PI * 0.5 * ammoK); c.stroke();
      if (!pl.vehicle && !pl.held) {
        const t = g.useTarget();
        if (t && ['button', 'charger', 'vehicle', 'door'].includes(t.kind) || (t && t.kind === 'prop' && t.ent.mass <= 36)) {
          c.font = `bold ${Math.round(10 * S)}px Verdana`; c.fillStyle = HUD_COL + '0.8)'; c.textAlign = 'center';
          c.fillText('[E]', x, y + 30 * S);
          c.textAlign = 'left';
        }
      }
    }

    drawHurt(c, W, Hh, S, pl, dt) {
      const list = this.hud.hurt;
      for (let i = list.length - 1; i >= 0; i--) {
        const h = list[i];
        h.t -= dt;
        if (h.t <= 0) { list.splice(i, 1); continue; }
        if (!h.dir) continue;
        const ang = Math.atan2(-h.dir.x, -h.dir.z) - pl.yaw;
        const a = -ang - Math.PI / 2;
        c.strokeStyle = `rgba(255,30,20,${h.t * 0.8})`;
        c.lineWidth = 6 * S;
        c.beginPath();
        c.arc(W / 2, Hh / 2, 60 * S, a - 0.35, a + 0.35);
        c.stroke();
      }
    }

    drawBuckets(c, W, Hh, S, g) {
      const pl = g.player;
      const owned = g.ownedWeapons();
      const cw = 96 * S, gap = 6 * S;
      const x0 = W / 2 - (6 * cw + 5 * gap) / 2;
      c.globalAlpha = Math.min(1, this.hud.bucketT * 2);
      for (let s = 0; s < 6; s++) {
        const x = x0 + s * (cw + gap);
        const list = owned.filter(k => H.WEAPONS[k].slot === s);
        this.box(c, x, 12 * S, cw, 18 * S);
        c.font = `bold ${Math.round(10 * S)}px Verdana`;
        c.fillStyle = HUD_COL + '0.9)';
        c.fillText(String(s + 1), x + 6 * S, 25 * S);
        list.forEach((k, i) => {
          const y = 34 * S + i * 26 * S;
          const cur = k === pl.cur;
          c.fillStyle = cur ? 'rgba(255,208,64,0.35)' : 'rgba(0,0,0,0.38)';
          c.fillRect(x, y, cw, 22 * S);
          c.font = `${cur ? 'bold ' : ''}${Math.round(9 * S)}px Verdana`;
          c.fillStyle = g.hasAmmoFor(k) ? HUD_COL + '0.95)' : 'rgba(255,60,40,0.8)';
          c.fillText(H.WEAPONS[k].name, x + 5 * S, y + 15 * S);
        });
      }
      c.globalAlpha = 1;
    }

    drawPickups(c, W, Hh, S, dt) {
      const list = this.hud.pickups;
      let y = Hh * 0.55;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.t -= dt;
        if (p.t <= 0) { list.splice(i, 1); continue; }
        c.font = `bold ${Math.round(12 * S)}px Verdana`;
        c.fillStyle = HUD_COL + Math.min(1, p.t) + ')';
        c.textAlign = 'right';
        c.fillText(p.text, W - 18 * S, y);
        c.textAlign = 'left';
        y -= 20 * S;
      }
    }

    drawSubs(c, W, Hh, S, dt) {
      const list = this.hud.subs;
      for (let i = list.length - 1; i >= 0; i--) { list[i].t -= dt; if (list[i].t <= 0) list.splice(i, 1); }
      if (!list.length) return;
      c.font = `${Math.round(13 * S)}px Verdana`;
      const maxW = Math.min(W * 0.7, 620 * S);
      const lines = [];
      for (const s of list) {
        const words = (s.name + ': ' + s.text).split(' ');
        let line = '', first = true;
        for (const wd of words) {
          const test = line ? line + ' ' + wd : wd;
          if (c.measureText(test).width > maxW && line) { lines.push({ text: line, s, first }); line = wd; first = false; }
          else line = test;
        }
        if (line) lines.push({ text: line, s, first });
      }
      const lh = 18 * S;
      const bh = lines.length * lh + 12 * S;
      const y0 = Hh - 80 * S - bh;
      this.box(c, W / 2 - maxW / 2 - 12 * S, y0, maxW + 24 * S, bh);
      lines.forEach((l, i) => {
        const y = y0 + 20 * S + i * lh;
        const a = Math.min(1, l.s.t);
        let x = W / 2 - maxW / 2;
        if (l.first) {
          const nm = l.s.name + ': ';
          c.fillStyle = l.s.col;
          c.globalAlpha = a;
          c.fillText(nm, x, y);
          x += c.measureText(nm).width;
          c.fillStyle = '#e8e8e8';
          c.fillText(l.text.slice(nm.length), x, y);
        } else {
          c.fillStyle = '#e8e8e8';
          c.globalAlpha = a;
          c.fillText(l.text, x, y);
        }
        c.globalAlpha = 1;
      });
    }

    drawHints(c, W, Hh, S, dt) {
      const list = this.hud.hints;
      for (let i = list.length - 1; i >= 0; i--) { list[i].t -= dt; if (list[i].t <= 0) list.splice(i, 1); }
      if (!list.length) return;
      const h = list[0];
      c.font = `bold ${Math.round(13 * S)}px Verdana`;
      const w = c.measureText(h.text).width + 30 * S;
      this.box(c, W / 2 - w / 2, Hh * 0.68, w, 28 * S);
      c.fillStyle = HUD_COL + Math.min(1, h.t) + ')';
      c.textAlign = 'center';
      c.fillText(h.text, W / 2, Hh * 0.68 + 19 * S);
      c.textAlign = 'left';
    }

    drawTitle(c, W, Hh, S, dt) {
      const t = this.hud.title;
      if (!t) return;
      t.t += dt;
      const total = 6;
      if (t.t > total) { this.hud.title = null; return; }
      const a = t.t < 1 ? t.t : t.t > total - 1.5 ? (total - t.t) / 1.5 : 1;
      const ch = H.CHAPTERS[t.ch];
      if (!ch) return;
      c.textAlign = 'center';
      c.fillStyle = `rgba(230,230,230,${a * 0.9})`;
      c.font = `bold ${Math.round(34 * S)}px 'Trebuchet MS', Verdana`;
      c.fillText('HALF-LIFE²', W / 2, Hh * 0.42);
      c.font = `${Math.round(14 * S)}px Verdana`;
      c.fillText(`ГЛАВА ${t.ch + 1}`, W / 2, Hh * 0.42 + 32 * S);
      c.font = `bold ${Math.round(20 * S)}px Verdana`;
      c.fillText(ch.title.toUpperCase(), W / 2, Hh * 0.42 + 60 * S);
      c.textAlign = 'left';
    }

    rollCredits() {
      this.mode = 'credits';
      this.audio.playMusic('finale');
      if (document.pointerLockElement === this.view && document.exitPointerLock) document.exitPointerLock();
      const lines = [
        ['HALF-LIFE²', 'big'], ['издание 2000 года', 'sub'], ['', ''],
        ['Фанатская реконструкция для Win 98', ''], ['', ''],
        ['По мотивам игры Valve Software', 'head'], ['', ''],
        ['Движок', 'head'], ['Рендерер OpenGL и программный режим', ''], ['Физика предметов и гравипушка', ''], ['Навигация и поведение персонажей', ''], ['', ''],
        ['Главы', 'head'], ...H.CHAPTERS.map((ch, i) => [`${i + 1}. ${ch.title}`, '']), ['', ''],
        ['Тайники повстанцев', 'head'], [`Найдено в этой главе: ${this.game ? this.game.stats.caches + ' из ' + this.game.stats.cachesTotal : '-'}`, ''], ['', ''],
        ['Спасибо, что играли', 'head'], ['', ''], ['Пробуждайтесь и пойте, мистер Фримен.', 'sub']
      ];
      const roll = this.creditsEl.querySelector('.hl2-credits-roll');
      roll.innerHTML = lines.map(([t, k]) => `<div class="hl2-cr ${k}">${esc(t) || '&nbsp;'}</div>`).join('');
      this.creditsEl.style.display = 'flex';
      roll.style.animation = 'none';
      void roll.offsetHeight;
      roll.style.animation = 'hl2credits 38s linear forwards';
      clearTimeout(this.creditsT);
      this.creditsT = setTimeout(() => this.endCredits(), 38500);
    }

    endCredits() {
      clearTimeout(this.creditsT);
      this.creditsEl.style.display = 'none';
      this.game = null;
      this.mode = 'menu';
      this.showMainMenu();
    }

    destroy() {
      cancelAnimationFrame(this.raf);
      clearTimeout(this.creditsT);
      this.keyTarget.removeEventListener('keydown', this.onKeyDown);
      this.keyTarget.removeEventListener('keyup', this.onKeyUp);
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
      window.removeEventListener('blur', this.onBlur);
      if (document.pointerLockElement === this.view && document.exitPointerLock) document.exitPointerLock();
      this.audio.destroy();
      if (this.renderer) this.renderer.destroy();
      this.root.innerHTML = '';
    }
  }

  H.UI = UI;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
