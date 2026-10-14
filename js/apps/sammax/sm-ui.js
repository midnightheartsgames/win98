(function (S) {
  'use strict';
  const { W, H, C, font, blit } = S;
  const SAVE_KEY = 'sammax101_saves';
  const SET_KEY = 'sammax101_settings';
  const SPEEDS = [{ k: 0.7, name: 'медленно' }, { k: 1, name: 'нормально' }, { k: 1.5, name: 'быстро' }];

  function store(key, val) {
    try {
      if (val === undefined) { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
    return null;
  }

  const CREDITS = [
    ['SAM & MAX', 3], ['КУЛЬТУРНЫЙ ШОК', 2], ['', 1],
    ['По комиксам Стива Пёрселла', 1], ['', 1],
    ['Сэм, собака в костюме', 1], ['Макс, гиперактивный кролик-нечто', 1], ['', 1],
    ['Дизайн и сценарий', 2], ['Отдел вольной полиции', 1], ['', 1],
    ['Графика', 2], ['320 на 200 точек, 256 цветов', 1], ['и ни одного лишнего пикселя', 1], ['', 1],
    ['Музыка', 2], ['Джаз-банд «Де Сото»', 1], ['', 1],
    ['Особая благодарность', 2], ['Джимми Два Зуба за телефон', 1], ['Боско за Антивор-О-Мат', 1], ['Сибил Пандемик за три теста', 1], ['Сода-Попперам за терпение', 1], ['', 1],
    ['Ни один кролик не пострадал.', 1], ['Несколько крыс напугано.', 1], ['', 1],
    ['КОНЕЦ ЭПИЗОДА 101', 2], ['Продолжение следует...', 1]
  ];

  class UI {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      this.ep = this.opts.ep || S;
      root.classList.add('smx');
      root.tabIndex = 0;
      root.innerHTML = '<canvas class="smx-cv" width="320" height="200"></canvas>';
      this.cv = root.querySelector('canvas');
      this.ctx = this.cv.getContext('2d');
      this.img = this.ctx.createImageData(W, H);
      this.r = new S.Renderer();
      this.audio = new S.Audio();
      this.settings = Object.assign({ speed: 1, music: 0.55, sfx: 0.75 }, store(this.ep.SET_KEY) || {});
      this.audio.setVolumes(this.settings.music, this.settings.sfx);
      this.screen = 'title';
      this.menu = null;
      this.g = null;
      this.paused = false;
      this.mx = 160; this.my = 100;
      this.t = 0;
      this.lastRoom = null;
      this.creditsT = 0;
      this.destroyed = false;
      this.audio.music(this.ep.TITLE_MUSIC);
      this.bind();
      this.resize();
      if (typeof ResizeObserver !== 'undefined') { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); }
      this.last = performance.now();
      this.frame = this.frame.bind(this);
      this.raf = requestAnimationFrame(this.frame);
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      this.audio.close();
      for (const [el, ev, fn] of this.listeners) el.removeEventListener(ev, fn);
      this.root.innerHTML = '';
    }

    isActive() { return !this.opts.isActive || this.opts.isActive(); }

    on(el, ev, fn, o) { el.addEventListener(ev, fn, o); this.listeners.push([el, ev, fn]); }

    bind() {
      this.listeners = [];
      const cv = this.cv;
      const pos = e => {
        const r = cv.getBoundingClientRect();
        this.mx = Math.max(0, Math.min(W - 1, Math.floor((e.clientX - r.left) / r.width * W)));
        this.my = Math.max(0, Math.min(H - 1, Math.floor((e.clientY - r.top) / r.height * H)));
      };
      this.on(cv, 'mousemove', e => { pos(e); if (this.g && this.screen === 'game' && !this.menu) this.g.pointer(this.mx, this.my); });
      this.on(cv, 'mousedown', e => {
        e.preventDefault();
        this.root.focus({ preventScroll: true });
        this.audio.resume();
        pos(e);
        this.click(e.button === 2 ? 2 : 0);
      });
      this.on(cv, 'contextmenu', e => e.preventDefault());
      this.on(cv, 'wheel', e => { e.preventDefault(); if (this.g && this.screen === 'game' && !this.menu && !this.g.dialog) this.g.cycleVerb(e.deltaY > 0 ? 1 : -1); }, { passive: false });
      this.on(this.root, 'keydown', e => this.key(e));
    }

    resize() {
      const rw = this.root.clientWidth || W * 2, rh = this.root.clientHeight || H * 2;
      let s = Math.floor(Math.min(rw / W, rh / H));
      if (s < 1) s = Math.min(rw / W, rh / H);
      this.cv.style.width = Math.round(W * s) + 'px';
      this.cv.style.height = Math.round(H * s) + 'px';
    }

    key(e) {
      const k = e.key;
      if (['Escape', 'F5', ' ', 'Tab', 'F1'].includes(k)) e.preventDefault();
      this.audio.resume();
      if (this.screen === 'credits') { this.toTitle(); return; }
      if (this.screen === 'title') { if (k === 'Enter') this.newGame(); return; }
      const g = this.g;
      if (!g) return;
      if (this.menu) { if (k === 'Escape' || k === 'F5') this.menu = null; return; }
      if (k === ' ') { this.paused = !this.paused; return; }
      if (this.paused) { this.paused = false; return; }
      if (k === 'Escape') {
        if (g.mode === 'map' && g.drive) { g.drive.choose('cancel'); return; }
        if (g.cutscene && !g.dialog) { g.skip(); return; }
        if (g.mode !== 'room' && g.drive && g.drive.key && g.drive.key(k)) return;
        if (g.invOpen) { g.invOpen = false; return; }
        if (g.held) { g.held = null; return; }
        if (!g.dialog) this.openMenu('main');
        return;
      }
      if (k === 'F5') { if (!g.cutscene) this.openMenu('main'); return; }
      if (k === '.') { g.skipLine(); return; }
      if (g.mode !== 'room' && g.drive) { if (g.drive.key) g.drive.key(k); return; }
      if (k === 'i' || k === 'I' || k === 'ш' || k === 'Ш' || k === 'Tab') { if (!g.busy && !g.dialog) { g.invOpen = !g.invOpen; g.pointer(this.mx, this.my); } return; }
      const vi = ['1', '2', '3', '4'].indexOf(k);
      if (vi >= 0 && !g.dialog) { g.verb = S.VERBS[vi]; g.held = null; return; }
      if (g.dialog && /^[1-9]$/.test(k) && !g.busy) {
        const opts = g.dialogOptions();
        const o = opts[parseInt(k, 10) - 1];
        if (o) g.choose(o.id);
      }
    }

    click(btn) {
      if (this.screen === 'credits') { if (this.creditsT > 1) this.toTitle(); return; }
      if (this.screen === 'title') {
        if (this.menu) { this.menuClick(btn); return; }
        const i = this.ep.TITLE.hit(this.mx, this.my);
        const en = this.titleEnabled();
        if (i < 0 || !en[i]) return;
        if (i === 0) this.newGame();
        else if (i === 1) this.loadSlot('auto');
        else if (i === 2) this.openMenu('load');
        else if (i === 3) this.openMenu('options');
        else if (i === 4 && this.opts.onExit) this.opts.onExit();
        return;
      }
      if (this.menu) { this.menuClick(btn); return; }
      if (this.paused) { this.paused = false; return; }
      if (this.g) this.g.click(this.mx, this.my, btn);
    }

    titleEnabled() {
      const saves = this.saves();
      return [true, !!saves.auto, Object.keys(saves).length > 0, true, !!this.opts.onExit];
    }

    newGame() {
      this.menu = null;
      const g = new S.Game({ ep: this.ep });
      g.textSpeed = this.settings.speed;
      this.g = g;
      this.ep.startNewGame(g);
      this.screen = 'game';
      this.lastRoom = g.roomId;
    }

    toTitle() {
      this.screen = 'title';
      this.menu = null;
      this.g = null;
      this.paused = false;
      this.audio.music(this.ep.TITLE_MUSIC);
    }

    saves() { return store(this.ep.SAVE_KEY) || {}; }

    saveSlot(slot) {
      const g = this.g;
      if (!g || !g.canSave()) return false;
      const all = this.saves();
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      all[slot] = { name: (g.room && g.room.name) || g.roomId, when: pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()), state: g.saveState() };
      store(this.ep.SAVE_KEY, all);
      return true;
    }

    loadSlot(slot) {
      const s = this.saves()[slot];
      if (!s) return false;
      const g = new S.Game({ seed: s.state.seed, ep: this.ep });
      this.ep.newGame(g);
      g.textSpeed = this.settings.speed;
      g.loadState(s.state);
      this.g = g;
      this.screen = 'game';
      this.menu = null;
      this.paused = false;
      this.lastRoom = g.roomId;
      return true;
    }

    openMenu(kind) { this.menu = { kind, hover: -1, msg: '' }; }

    menuItems() {
      const m = this.menu;
      if (m.kind === 'main') return ['Сохранить игру', 'Загрузить игру', 'Настройки', 'Вернуться в игру', 'Выйти в главное меню'];
      if (m.kind === 'save' || m.kind === 'load') {
        const all = this.saves();
        const rows = [];
        if (m.kind === 'load') rows.push(all.auto ? 'Авто: ' + all.auto.name + ' (' + all.auto.when + ')' : 'Авто: пусто');
        for (let i = 1; i <= 7; i++) rows.push(i + '. ' + (all[i] ? all[i].name + ' (' + all[i].when + ')' : '— пусто —'));
        rows.push('Назад');
        return rows;
      }
      if (m.kind === 'options') {
        const sp = SPEEDS.findIndex(s => s.k === this.settings.speed);
        return ['Скорость текста: « ' + SPEEDS[sp < 0 ? 1 : sp].name + ' »', 'Музыка: « ' + Math.round(this.settings.music * 10) + ' / 10 »', 'Звуки: « ' + Math.round(this.settings.sfx * 10) + ' / 10 »', 'Назад'];
      }
      return [];
    }

    menuRect() {
      const n = this.menuItems().length;
      const h = 30 + n * 13;
      return { x: 26, y: Math.max(4, Math.floor((H - h) / 2)), w: 268, h };
    }

    menuHit() {
      const r = this.menuRect();
      const i = Math.floor((this.my - r.y - 22) / 13);
      if (this.mx < r.x || this.mx > r.x + r.w || i < 0 || i >= this.menuItems().length) return -1;
      return i;
    }

    menuClick(btn) {
      const m = this.menu;
      const i = this.menuHit();
      if (i < 0) { if (btn === 2) this.menu = m.kind === 'main' || !this.g ? null : { kind: 'main', hover: -1 }; return; }
      const items = this.menuItems();
      const back = i === items.length - 1;
      if (m.kind === 'main') {
        if (i === 0) { if (this.g && this.g.canSave()) this.openMenu('save'); else m.msg = 'Сейчас сохраниться нельзя.'; }
        else if (i === 1) this.openMenu('load');
        else if (i === 2) this.openMenu('options');
        else if (i === 3) this.menu = null;
        else this.toTitle();
        return;
      }
      if (m.kind === 'save') {
        if (back) { this.openMenu('main'); return; }
        this.saveSlot(i + 1);
        this.menu = null;
        return;
      }
      if (m.kind === 'load') {
        if (back) { this.menu = this.g ? { kind: 'main', hover: -1 } : null; return; }
        this.loadSlot(i === 0 ? 'auto' : i);
        return;
      }
      if (m.kind === 'options') {
        if (back) { this.menu = this.g ? { kind: 'main', hover: -1 } : null; store(this.ep.SET_KEY, this.settings); return; }
        const dir = this.mx < 160 ? -1 : 1;
        if (i === 0) {
          const cur = Math.max(0, SPEEDS.findIndex(s => s.k === this.settings.speed));
          this.settings.speed = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, cur + dir))].k;
          if (this.g) this.g.textSpeed = this.settings.speed;
        } else if (i === 1) this.settings.music = Math.max(0, Math.min(1, Math.round((this.settings.music + dir * 0.1) * 10) / 10));
        else if (i === 2) { this.settings.sfx = Math.max(0, Math.min(1, Math.round((this.settings.sfx + dir * 0.1) * 10) / 10)); this.audio.sfx('pickup'); }
        this.audio.setVolumes(this.settings.music, this.settings.sfx);
        store(this.ep.SET_KEY, this.settings);
      }
    }

    drawMenu(f) {
      const m = this.menu;
      const r = this.menuRect();
      S.panel(f, r.x, r.y, r.w, r.h, C.navy.concat([C.suit[3]]));
      const title = { main: 'МЕНЮ', save: 'СОХРАНИТЬ ИГРУ', load: 'ЗАГРУЗИТЬ ИГРУ', options: 'НАСТРОЙКИ' }[m.kind];
      font.drawCentered(f, title, r.x + r.w / 2, r.y + 7, C.orange[3]);
      const hv = this.menuHit();
      this.menuItems().forEach((s, i) => {
        font.draw(f, s, r.x + 12, r.y + 22 + i * 13, i === hv ? C.yellow[4] : C.grey[5]);
      });
      if (m.msg) font.drawCentered(f, m.msg, r.x + r.w / 2, r.y + r.h + 4, C.red[4]);
      const cur = S.cursor('use', hv >= 0);
      blit(f, cur.buf, this.mx - cur.hx, this.my - cur.hy);
    }

    frame(ts) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(this.frame);
      const dt = Math.min(0.05, Math.max(0, (ts - this.last) / 1000));
      this.last = ts;
      this.step(dt);
      this.draw();
    }

    step(dt) {
      this.t += dt;
      const g = this.g;
      if (this.screen === 'game' && g) {
        if (!this.menu && !this.paused) g.update(dt);
        const events = g.events.splice(0);
        this.sound(() => { for (const ev of events) { if (ev.t === 'sfx') this.audio.sfx(ev.id); else if (ev.t === 'music') this.audio.music(ev.id); } });
        if (g.roomId !== this.lastRoom && g.canSave() && g.fade <= 0) { this.lastRoom = g.roomId; this.saveSlot('auto'); }
        if (g.ended) {
          this.screen = 'credits'; this.creditsT = 0; this.audio.music(this.ep.CREDITS_MUSIC);
          const all = this.saves(); delete all.auto; store(this.ep.SAVE_KEY, all);
        }
      }
      if (this.screen === 'credits') this.creditsT += dt;
      this.sound(() => this.audio.update());
      if (g) g.musicPos = this.audio.position ? this.audio.position() : null;
    }

    sound(play) {
      try { play(); } catch (e) {
        if (!this.soundFailed) console.error(e);
        this.soundFailed = true;
      }
    }

    draw() {
      const f = this.r.frame;
      const g = this.g;
      if (this.screen === 'title') {
        const T = this.ep.TITLE;
        T.draw(f, this.t, T.hit(this.mx, this.my), this.titleEnabled());
        if (this.menu) this.drawMenu(f);
        else { const cur = S.cursor('use', T.hit(this.mx, this.my) >= 0); blit(f, cur.buf, this.mx - cur.hx, this.my - cur.hy); }
        this.flush({ time: this.t, fade: 0, fx: { flash: 0 } });
        return;
      }
      if (this.screen === 'credits') {
        this.drawCredits(f);
        this.flush({ time: this.t, fade: 0, fx: { flash: 0 } });
        return;
      }
      this.r.render(g);
      if (this.paused) {
        S.panel(f, 110, 88, 100, 24, C.navy.concat([C.suit[3]]));
        font.drawCentered(f, 'ПАУЗА', 160, 96, C.yellow[4]);
      }
      if (this.menu) this.drawMenu(f);
      this.flush(g);
    }

    drawCredits(f) {
      S.starfield(f, 5, [C.night[0], C.night[1], C.night[2], C.purple[1]]);
      let y = H - this.creditsT * 16;
      for (const [line, size] of this.ep.CREDITS) {
        if (y > -30 && y < H + 20) {
          if (size >= 2) S.bigText(f, line, W / 2, Math.round(y), size, size === 3 ? C.orange[3] : C.sky[3], size === 3 ? C.yellow[4] : C.sky[4], 1);
          else font.drawCentered(f, line, W / 2, Math.round(y), C.grey[5]);
        }
        y += size >= 2 ? 10 * size + 6 : 12;
      }
      if (y < 0) this.creditsT = 0;
    }

    flush(g) {
      const px = this.img.data;
      if (g && g.fx && g.room !== undefined) this.r.toRGBA(g, px);
      else this.r.toRGBA({ time: this.t, fade: 0, fx: { flash: 0, dark: false, dream: false, hypno: 0 } }, px);
      this.ctx.putImageData(this.img, 0, 0);
    }
  }

  S.UI = UI;
  Object.assign(S, { CREDITS, SAVE_KEY, SET_KEY, TITLE_MUSIC: 'title', CREDITS_MUSIC: 'credits' });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
