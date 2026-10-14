(function (S, B) {
  'use strict';
  const { Buf, blit, rectFill, frameRect, scaleBuf } = S;
  const C = B.C;
  const W = 640, H = 480;
  const SPEEDS = [{ k: 0.7, name: 'медленно' }, { k: 1, name: 'нормально' }, { k: 1.5, name: 'быстро' }];
  const FLASH = [{ k: 'full', name: 'полные' }, { k: 'soft', name: 'мягкие' }];
  const THUMB = { w: 128, h: 96, k: 5 };
  const LIST = { x: 24, y: 64, w: 312, row: 36 };

  function store(key, val) {
    try {
      if (val === undefined) { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) { return val === undefined ? null : false; }
  }

  function b64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
  }

  function unb64(text) {
    const s = typeof atob === 'function' ? atob(text) : Buffer.from(text, 'base64').toString('binary');
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  function packThumb(frame) {
    const px = new Uint8Array(THUMB.w * THUMB.h);
    for (let y = 0; y < THUMB.h; y++) for (let x = 0; x < THUMB.w; x++) px[y * THUMB.w + x] = frame.px[(y * THUMB.k + 2) * frame.w + x * THUMB.k + 2];
    const runs = [];
    for (let i = 0; i < px.length;) {
      let n = 1;
      while (i + n < px.length && n < 255 && px[i + n] === px[i]) n++;
      runs.push(n, px[i]);
      i += n;
    }
    return b64(Uint8Array.from(runs));
  }

  function unpackThumb(text) {
    const b = new Buf(THUMB.w, THUMB.h);
    try {
      const r = unb64(text);
      let i = 0;
      for (let k = 0; k + 1 < r.length && i < b.px.length; k += 2) { b.px.fill(r[k + 1], i, Math.min(b.px.length, i + r[k])); i += r[k]; }
    } catch (e) { b.px.fill(C.grey[1]); }
    return b;
  }

  class UI {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      this.ep = this.opts.ep || B.EP1;
      root.classList.add('btf');
      root.tabIndex = 0;
      root.innerHTML = '<canvas class="btf-cv" width="' + W + '" height="' + H + '"></canvas>';
      this.cv = root.querySelector('canvas');
      this.ctx = this.cv.getContext('2d');
      this.img = this.ctx.createImageData(W, H);
      this.r = new B.Renderer({ ep: this.ep });
      this.font = this.r.font;
      this.audio = new S.Audio();
      this.settings = Object.assign({ speed: 1, music: 0.55, sfx: 0.75, tips: true, hints: true, flash: 'full' }, store(this.ep.SET_KEY) || {});
      this.audio.setVolumes(this.settings.music, this.settings.sfx);
      this.screen = 'title';
      this.menu = null;
      this.g = null;
      this.paused = false;
      this.mx = W / 2; this.my = H / 2;
      this.t = 0;
      this.lastRoom = null;
      this.toast = null;
      this.lastDown = { t: -9, x: 0, y: 0 };
      this.thumbs = new Map();
      this.active = true;
      this.destroyed = false;
      this.audio.music(this.ep.TITLE_MUSIC);
      this.bind();
      this.resize();
      if (typeof ResizeObserver !== 'undefined') { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); }
      this.last = typeof performance !== 'undefined' ? performance.now() : 0;
      this.frame = this.frame.bind(this);
      if (!this.opts.noLoop && typeof requestAnimationFrame !== 'undefined') this.raf = requestAnimationFrame(this.frame);
    }

    destroy() {
      this.destroyed = true;
      if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.raf);
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
      this.on(cv, 'mousemove', e => { pos(e); this.move(); });
      this.on(cv, 'mousedown', e => {
        e.preventDefault();
        if (this.root.focus) this.root.focus({ preventScroll: true });
        this.audio.resume();
        pos(e);
        this.down(e.button === 2 ? 2 : 0);
      });
      this.on(cv, 'contextmenu', e => e.preventDefault());
      this.on(cv, 'wheel', e => { e.preventDefault(); this.wheel(); }, { passive: false });
      this.on(this.root, 'keydown', e => this.key(e));
    }

    resize() {
      const rw = this.root.clientWidth || W, rh = this.root.clientHeight || H;
      let s = Math.floor(Math.min(rw / W, rh / H));
      if (s < 1) s = Math.min(rw / W, rh / H);
      this.cv.style.width = Math.round(W * s) + 'px';
      this.cv.style.height = Math.round(H * s) + 'px';
    }

    move() {
      if (this.g && this.screen === 'game' && !this.menu && !this.paused) this.g.pointer(this.mx, this.my);
    }

    wheel() {
      if (this.g && this.screen === 'game' && !this.menu && !this.paused) { this.g.togglePockets(); this.g.sfx('pocket'); }
    }

    down(btn) {
      const now = this.t;
      const dbl = btn === 0 && now - this.lastDown.t < 0.33 && Math.abs(this.mx - this.lastDown.x) < 8 && Math.abs(this.my - this.lastDown.y) < 8;
      this.lastDown = btn === 0 ? { t: dbl ? -9 : now, x: this.mx, y: this.my } : this.lastDown;
      if (this.screen === 'credits') { if (this.creditsT > 1) this.toTitle(); return; }
      if (this.menu) { this.menuClick(btn); return; }
      if (this.screen === 'title') { this.titleClick(); return; }
      if (this.paused) { this.paused = false; return; }
      if (this.g) this.g.click(this.mx, this.my, btn, dbl);
    }

    key(e) {
      const k = e.key;
      if (['Escape', 'F1', 'F5', 'F9', ' ', 'Tab'].includes(k) && e.preventDefault) e.preventDefault();
      this.audio.resume();
      if (this.screen === 'credits') { this.toTitle(); return; }
      if (this.menu) {
        if (k === 'Escape') this.back();
        return;
      }
      if (this.screen === 'title') {
        if (k === 'Enter') { const it = this.titleItems().find(i => i.on); if (it) this.titleAction(it.id); }
        return;
      }
      const g = this.g;
      if (!g) return;
      if (k === 'p' || k === 'P' || k === 'з' || k === 'З') { this.paused = !this.paused; return; }
      if (this.paused) { this.paused = false; return; }
      if (k === 'Escape') {
        if (g.cutscene && !g.dialog) { g.skip(); return; }
        if (g.mode !== 'room' && g.drive && g.drive.key && g.drive.key(k)) return;
        if (g.invOpen) { g.invOpen = false; return; }
        if (g.held) { g.held = null; return; }
        if (!g.dialog) this.openMenu('pause');
        return;
      }
      if (k === 'F1') { if (!g.cutscene && !g.dialog && this.settings.hints) this.openMenu('hints'); return; }
      if (k === 'F5') { if (g.canSave()) this.openMenu('save'); else this.say('Сейчас сохраниться нельзя.'); return; }
      if (k === 'F9') { this.openMenu('load'); return; }
      if (k === '.' || k === ' ') { g.skipLine(); return; }
      if (g.mode !== 'room' && g.drive) { if (g.drive.key) g.drive.key(k); return; }
      if (k === 'i' || k === 'I' || k === 'ш' || k === 'Ш' || k === 'Tab') { g.togglePockets(); return; }
      if (g.dialog && /^[1-9]$/.test(k) && !g.busy) {
        const o = g.dialogOptions()[parseInt(k, 10) - 1];
        if (o) g.choose(o.id);
      }
    }

    say(text) { this.toast = { text, t: 2.6 }; }

    titleItems() {
      const saves = this.saves();
      const items = [];
      if (saves.auto && !this.corrupt(saves.auto)) items.push({ id: 'continue', text: 'Продолжить', on: true });
      items.push({ id: 'new', text: 'Новая игра', on: true });
      items.push({ id: 'load', text: 'Загрузить', on: Object.keys(saves).length > 0 });
      items.push({ id: 'options', text: 'Настройки', on: true });
      if (this.opts.onExit) items.push({ id: 'exit', text: 'Выход', on: true });
      return items;
    }

    titleHit() {
      const items = this.titleItems();
      const y0 = 300;
      if (this.mx < 220 || this.mx > 420) return -1;
      const i = Math.floor((this.my - y0) / 26);
      return i >= 0 && i < items.length ? i : -1;
    }

    titleClick() {
      const i = this.titleHit();
      const it = this.titleItems()[i];
      if (it && it.on) this.titleAction(it.id);
    }

    titleAction(id) {
      if (id === 'continue') this.loadSlot('auto');
      else if (id === 'new') this.newGame();
      else if (id === 'load') this.openMenu('load');
      else if (id === 'options') this.openMenu('options');
      else if (id === 'exit' && this.opts.onExit) this.opts.onExit();
    }

    newGame() {
      this.menu = null;
      const g = new B.Game({ ep: this.ep });
      g.textSpeed = this.settings.speed;
      g.softFlash = this.settings.flash === 'soft';
      this.g = g;
      this.ep.startNewGame(g);
      this.screen = 'game';
      this.lastRoom = g.roomId;
      this.paused = false;
    }

    toTitle() {
      this.screen = 'title';
      this.menu = null;
      this.g = null;
      this.paused = false;
      this.audio.music(this.ep.TITLE_MUSIC);
    }

    saves() { const s = store(this.ep.SAVE_KEY); return s && typeof s === 'object' ? s : {}; }

    corrupt(slot) {
      return !slot || !slot.state || typeof slot.state !== 'object' || !this.ep.ROOMS[slot.state.room] || slot.state.v !== 1;
    }

    snapshot() {
      const g = this.g;
      const hide = g.hideUI;
      g.hideUI = true;
      const speech = g.speech;
      g.speech = [];
      this.r.render(g);
      g.hideUI = hide;
      g.speech = speech;
      return packThumb(this.r.frame);
    }

    saveSlot(slot, force) {
      const g = this.g;
      if (!g) return false;
      if (!force && !g.canSave()) return false;
      if (force && (g.mode !== 'room' || g.dialog || g.ended)) return false;
      const all = this.saves();
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      const ch = (this.ep.CHAPTERS || []).find(c => c.id === (this.ep.chapterOf ? this.ep.chapterOf(g) : 0));
      all[slot] = {
        name: (g.room && g.room.name) || g.roomId,
        chapter: ch ? ch.name : '',
        gameTime: ch ? ch.date : '',
        when: pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()),
        thumb: this.snapshot(),
        state: g.saveState()
      };
      if (!store(this.ep.SAVE_KEY, all)) {
        delete all[slot];
        this.say('Не удалось сохранить: в хранилище нет места. Удалите один из слотов.');
        return false;
      }
      this.thumbs.clear();
      return true;
    }

    loadSlot(slot) {
      const s = this.saves()[slot];
      if (this.corrupt(s)) { this.say('Сохранение повреждено.'); return false; }
      const g = new B.Game({ seed: s.state.seed, ep: this.ep });
      this.ep.newGame(g);
      g.textSpeed = this.settings.speed;
      g.softFlash = this.settings.flash === 'soft';
      g.loadState(s.state);
      this.g = g;
      this.screen = 'game';
      this.menu = null;
      this.paused = false;
      this.lastRoom = g.roomId;
      return true;
    }

    deleteSlot(slot) {
      const all = this.saves();
      delete all[slot];
      store(this.ep.SAVE_KEY, all);
      this.thumbs.clear();
    }

    openMenu(kind, extra) { this.menu = Object.assign({ kind, sel: -1, from: this.menu }, extra || {}); }

    back() {
      const m = this.menu;
      if (!m) return;
      if (m.kind === 'options') store(this.ep.SET_KEY, this.settings);
      this.menu = m.from && m.kind !== 'pause' ? m.from : null;
    }

    pauseItems() {
      const items = [{ id: 'resume', text: 'Вернуться' }, { id: 'save', text: 'Сохранить' }, { id: 'load', text: 'Загрузить' }];
      if (this.ep.RECAP) items.push({ id: 'recap', text: 'Что было раньше' });
      items.push({ id: 'options', text: 'Настройки' }, { id: 'quit', text: 'Выйти в главное меню' });
      return items;
    }

    pauseRect() { const n = this.pauseItems().length; return { x: 180, y: 110, w: 280, h: 96 + n * 26 }; }

    optionRows() {
      const s = this.settings;
      const sp = SPEEDS.findIndex(x => x.k === s.speed);
      return [
        { id: 'speed', text: 'Скорость текста', val: SPEEDS[sp < 0 ? 1 : sp].name },
        { id: 'music', text: 'Музыка', val: Math.round(s.music * 10) + ' / 10' },
        { id: 'sfx', text: 'Звуки', val: Math.round(s.sfx * 10) + ' / 10' },
        { id: 'tips', text: 'Таблички управления', val: s.tips ? 'да' : 'нет' },
        { id: 'hints', text: 'Кнопка подсказок', val: s.hints ? 'да' : 'нет' },
        { id: 'flash', text: 'Вспышки', val: (FLASH.find(x => x.k === s.flash) || FLASH[0]).name },
        { id: 'back', text: 'Назад', val: '' }
      ];
    }

    slotIds(kind) {
      const ids = [];
      if (kind === 'load') ids.push('auto');
      for (let i = 1; i <= (this.ep.SLOTS || 10); i++) ids.push(String(i));
      return ids;
    }

    listHit(n) {
      if (this.mx < LIST.x || this.mx > LIST.x + LIST.w) return -1;
      const i = Math.floor((this.my - LIST.y) / LIST.row);
      return i >= 0 && i < n ? i : -1;
    }

    menuClick(btn) {
      const m = this.menu;
      if (btn === 2) { this.back(); return; }
      if (m.kind === 'pause') {
        const r = this.pauseRect();
        const i = Math.floor((this.my - r.y - 60) / 26);
        const it = this.mx >= r.x && this.mx < r.x + r.w ? this.pauseItems()[i] : null;
        if (!it) return;
        if (it.id === 'resume') this.menu = null;
        else if (it.id === 'save') { if (this.g.canSave()) this.openMenu('save'); else this.say('Сейчас сохраниться нельзя.'); }
        else if (it.id === 'load') this.openMenu('load');
        else if (it.id === 'recap') this.openMenu('recap');
        else if (it.id === 'options') this.openMenu('options');
        else if (it.id === 'quit') this.toTitle();
        return;
      }
      if (m.kind === 'save' || m.kind === 'load') {
        if (this.my >= 440 && this.mx >= 520) { this.back(); return; }
        const ids = this.slotIds(m.kind);
        const i = this.listHit(ids.length);
        if (i < 0) return;
        const id = ids[i];
        const all = this.saves();
        if (m.kind === 'load') {
          if (!all[id]) return;
          if (this.corrupt(all[id])) { this.say('Сохранение повреждено.'); return; }
          this.loadSlot(id);
          return;
        }
        if (all[id]) { this.openMenu('confirm', { slot: id, text: 'Перезаписать слот ' + id + '?' }); return; }
        if (this.saveSlot(id)) { this.menu = null; this.say('Игра сохранена.'); }
        return;
      }
      if (m.kind === 'confirm') {
        const yes = this.mx >= 230 && this.mx < 310 && this.my >= 262 && this.my < 286;
        const no = this.mx >= 330 && this.mx < 410 && this.my >= 262 && this.my < 286;
        if (yes) { if (this.saveSlot(m.slot)) { this.menu = null; this.say('Игра сохранена.'); } else this.back(); }
        else if (no) this.back();
        return;
      }
      if (m.kind === 'options') {
        const rows = this.optionRows();
        const i = Math.floor((this.my - 120) / 30);
        const row = this.mx >= 120 && this.mx < 520 ? rows[i] : null;
        if (!row) return;
        if (row.id === 'back') { this.back(); return; }
        this.adjust(row.id, this.mx < 400 ? -1 : 1);
        return;
      }
      if (m.kind === 'hints') { this.hintClick(); return; }
      if (m.kind === 'recap') { this.back(); return; }
    }

    adjust(id, dir) {
      const s = this.settings;
      if (id === 'speed') {
        const cur = Math.max(0, SPEEDS.findIndex(x => x.k === s.speed));
        s.speed = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, cur + dir))].k;
        if (this.g) this.g.textSpeed = s.speed;
      } else if (id === 'music') s.music = Math.max(0, Math.min(1, Math.round((s.music + dir * 0.1) * 10) / 10));
      else if (id === 'sfx') { s.sfx = Math.max(0, Math.min(1, Math.round((s.sfx + dir * 0.1) * 10) / 10)); this.audio.sfx(B.sfxId('click')); }
      else if (id === 'tips') s.tips = !s.tips;
      else if (id === 'hints') s.hints = !s.hints;
      else if (id === 'flash') { s.flash = s.flash === 'full' ? 'soft' : 'full'; if (this.g) this.g.softFlash = s.flash === 'soft'; }
      this.audio.setVolumes(s.music, s.sfx);
      store(this.ep.SET_KEY, s);
    }

    goals() {
      const g = this.g;
      return (this.ep.GOALS || []).filter(x => !x.when || x.when(g));
    }

    hintClick() {
      const m = this.menu, g = this.g;
      const goals = this.goals();
      if (this.mx < 110 || this.mx > 530 || this.my < 60 || this.my > 420) { this.back(); return; }
      const gi = Math.floor((this.my - 104) / 20);
      if (this.my < 104 + goals.length * 20 && gi >= 0 && gi < goals.length) { m.goal = goals[gi].id; return; }
      const goal = goals.find(x => x.id === m.goal) || goals[0];
      if (!goal) return;
      if (this.my >= 382 && this.my < 404 && this.mx >= 330 && this.mx < 510) {
        g.f.hints = g.f.hints || {};
        g.f.hints[goal.id] = Math.min(goal.hints.length, (g.f.hints[goal.id] || 0) + 1);
      }
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
      if (this.toast) { this.toast.t -= dt; if (this.toast.t <= 0) this.toast = null; }
      const active = this.isActive();
      if (active !== this.active) {
        this.active = active;
        const k = active ? 1 : 0.25;
        this.audio.setVolumes(this.settings.music * k, this.settings.sfx * k);
      }
      const g = this.g;
      if (this.screen === 'game' && g) {
        if (!this.menu && !this.paused && active) g.update(dt);
        const events = g.events.splice(0);
        let auto = false;
        this.sound(() => { for (const ev of events) { if (ev.t === 'sfx') this.audio.sfx(B.sfxId(ev.id)); else if (ev.t === 'music') this.audio.music(ev.id); else if (ev.t === 'autosave') auto = true; } });
        if (auto) this.saveSlot('auto', true);
        for (const id of g.ui.splice(0)) {
          if (id === 'menu') this.openMenu('pause');
          else if (id === 'hint' && this.settings.hints) this.openMenu('hints');
        }
        if (g.roomId !== this.lastRoom && g.canSave() && g.fade <= 0) { this.lastRoom = g.roomId; this.saveSlot('auto'); }
        if (g.ended) {
          this.screen = 'credits'; this.creditsT = 0; this.audio.music(this.ep.CREDITS_MUSIC);
          const all = this.saves(); delete all.auto; store(this.ep.SAVE_KEY, all);
        }
      }
      if (this.screen === 'credits') this.creditsT += dt;
      this.sound(() => this.audio.update());
    }

    sound(play) {
      try { play(); } catch (e) {
        if (!this.soundFailed && typeof console !== 'undefined') console.error(e);
        this.soundFailed = true;
      }
    }

    text(f, s, x, y, col, ol) { return this.font.draw(f, s, x, y, col === undefined ? C.snow[4] : col, ol); }
    center(f, s, cx, y, col) { return this.font.drawCentered(f, s, cx, y, col === undefined ? C.snow[4] : col); }

    big(f, s, cx, y, k, col) {
      const w = this.font.measure(s) + 4;
      const b = new Buf(w, 16);
      this.font.draw(b, s, 2, 1, col);
      const z = scaleBuf(b, k);
      blit(f, z, Math.round(cx - z.w / 2), y);
    }

    logo(f, s, cx, y, k, cols) {
      const w = this.font.measure(s) + 4;
      const b = new Buf(w, 16);
      this.font.draw(b, s, 2, 1, C.snow[4], 0);
      const z = scaleBuf(b, k), x0 = Math.round(cx - z.w / 2);
      let top = z.h, bot = 0;
      for (let yy = 0; yy < z.h; yy++) for (let xx = 0; xx < z.w; xx++) if (z.px[yy * z.w + xx]) { top = Math.min(top, yy); bot = Math.max(bot, yy); }
      const on = (xx, yy) => xx >= 0 && yy >= 0 && xx < z.w && yy < z.h && z.px[yy * z.w + xx];
      for (let yy = -2; yy < z.h + 2; yy++) for (let xx = -2; xx < z.w + 2; xx++) {
        if (on(xx, yy)) {
          const u = (yy - top) / Math.max(1, bot - top) * (cols.length - 1) + S.BAYER[((yy & 3) << 2) | (xx & 3)] - 0.5;
          f.set(x0 + xx, y + yy, Math.abs(yy - top - (bot - top) * 0.42) < k * 0.5 ? C.snow[4] : cols[Math.max(0, Math.min(cols.length - 1, Math.round(u)))]);
        } else if (on(xx - 1, yy) || on(xx + 1, yy) || on(xx, yy - 1) || on(xx, yy + 1) || on(xx - 2, yy + 2) || on(xx - 1, yy + 2)) f.set(x0 + xx, y + yy, C.maroon[0]);
      }
    }

    bevel(f, x, y, w, h, ramp) {
      rectFill(f, x, y, w, h, ramp[1]);
      for (let xx = x; xx < x + w; xx++) { f.set(xx, y, ramp[3]); f.set(xx, y + h - 1, ramp[0]); }
      for (let yy = y; yy < y + h; yy++) { f.set(x, yy, ramp[3]); f.set(x + w - 1, yy, ramp[0]); }
      frameRect(f, x - 1, y - 1, w + 2, h + 2, C.black);
    }

    led(f, s, x, y, col) {
      rectFill(f, x - 4, y - 3, this.font.measure(s) + 8, 14, C.black);
      this.text(f, s, x, y, col, 0);
    }

    draw() {
      const f = this.r.frame;
      const prev = S.pal;
      if (this.screen === 'game' && this.g) {
        const g = this.g, hide = g.hideUI;
        g.hideUI = hide || !!this.menu || this.paused;
        this.r.render(g);
        g.hideUI = hide;
      }
      S.pal = B.PAL;
      try {
        if (this.screen === 'title') this.drawTitle(f);
        else if (this.screen === 'credits') this.drawCredits(f);
        else if (this.paused) { this.bevel(f, 260, 220, 120, 34, C.navy); this.center(f, 'ПАУЗА', 320, 232, C.gold[4]); }
        if (this.menu) this.drawMenu(f);
        if (this.toast) { const w = this.font.measure(this.toast.text) + 20; this.bevel(f, Math.round(320 - w / 2), 8, w, 22, C.maroon); this.center(f, this.toast.text, 320, 14, C.gold[4]); }
        if (this.menu || this.screen === 'title' || this.paused) { const cur = B.cursor('arrow', false); blit(f, cur.buf, this.mx, this.my); }
      } finally { S.pal = prev; }
      this.flush();
    }

    drawTitle(f) {
      const t = this.t;
      B.cine.titleArt(f, t);
      this.logo(f, 'BACK TO THE FUTURE', 320, 66, 4, [C.gold[4], C.gold[3], C.vest[4], C.vest[3], C.red[3], C.red[2]]);
      this.logo(f, 'THE GAME', 320, 130, 3, [C.steel[4], C.steel[3], C.steel[2], C.steel[3], C.steel[4]]);
      this.center(f, 'Эпизод 1. Самое время', 320, 176, C.snow[4]);
      const items = this.titleItems();
      const hv = this.menu ? -1 : this.titleHit();
      items.forEach((it, i) => {
        const y = 300 + i * 26;
        this.bevel(f, 230, y, 180, 22, i === hv && it.on ? C.vest : C.steel);
        this.center(f, it.text, 320, y + 7, it.on ? C.snow[4] : C.steel[2]);
      });
    }

    drawCredits(f) {
      B.cine.creditsArt(f, this.creditsT);
      const lines = this.ep.CREDITS || [];
      let y = H - this.creditsT * 24;
      for (const [text, size] of lines) {
        if (y > -40 && y < H + 20) {
          if (size >= 2) this.big(f, text, 320, Math.round(y), size, size === 3 ? C.vest[4] : C.gold[4]);
          else this.center(f, text, 320, Math.round(y), C.snow[4]);
        }
        y += size >= 2 ? 14 * size + 10 : 18;
      }
      if (y < 0) this.creditsT = 0;
    }

    drawMenu(f) {
      const m = this.menu;
      if (m.kind === 'pause') this.drawPause(f);
      else if (m.kind === 'save' || m.kind === 'load') this.drawSlots(f, m.kind);
      else if (m.kind === 'confirm') { this.drawSlots(f, 'save'); this.bevel(f, 210, 210, 220, 90, C.maroon); this.center(f, m.text, 320, 228, C.snow[4]); this.bevel(f, 230, 262, 80, 24, C.steel); this.center(f, 'Да', 270, 270); this.bevel(f, 330, 262, 80, 24, C.steel); this.center(f, 'Нет', 370, 270); }
      else if (m.kind === 'options') this.drawOptions(f);
      else if (m.kind === 'hints') this.drawHints(f);
      else if (m.kind === 'recap') this.drawRecap(f);
    }

    drawPause(f) {
      const r = this.pauseRect(), g = this.g;
      this.bevel(f, r.x, r.y, r.w, r.h, C.navy);
      this.center(f, 'ПАУЗА', r.x + r.w / 2, r.y + 12, C.gold[4]);
      const ch = (this.ep.CHAPTERS || []).find(c => c.id === (this.ep.chapterOf ? this.ep.chapterOf(g) : 0));
      const strip = ((ch ? ch.date + '   ' : '') + ((g.room && g.room.name) || '')).toUpperCase();
      this.led(f, strip, r.x + Math.round((r.w - this.font.measure(strip)) / 2), r.y + 34, C.ledR);
      const i0 = Math.floor((this.my - r.y - 60) / 26);
      this.pauseItems().forEach((it, i) => {
        const y = r.y + 60 + i * 26;
        const hov = i === i0 && this.mx >= r.x && this.mx < r.x + r.w;
        this.bevel(f, r.x + 30, y, r.w - 60, 22, hov ? C.vest : C.steel);
        this.center(f, it.text, r.x + r.w / 2, y + 7);
      });
    }

    thumb(id, slot) {
      const key = id + '|' + slot.when;
      if (!this.thumbs.has(key)) this.thumbs.set(key, unpackThumb(slot.thumb || ''));
      return this.thumbs.get(key);
    }

    drawSlots(f, kind) {
      this.bevel(f, 8, 8, W - 16, H - 16, C.slate);
      this.center(f, kind === 'save' ? 'СОХРАНИТЬ ИГРУ' : 'ЗАГРУЗИТЬ ИГРУ', 320, 24, C.gold[4]);
      const all = this.saves();
      const ids = this.slotIds(kind);
      const hv = this.menu.kind === 'confirm' ? -1 : this.listHit(ids.length);
      let show = null;
      ids.forEach((id, i) => {
        const y = LIST.y + i * LIST.row, s = all[id];
        const hov = i === hv;
        this.bevel(f, LIST.x, y, LIST.w, LIST.row - 4, hov ? C.vest : C.navy);
        const label = id === 'auto' ? 'Авто' : id + '.';
        this.text(f, label, LIST.x + 6, y + 11, C.gold[4]);
        if (!s) { this.text(f, 'пусто', LIST.x + 84, y + 11, C.steel[3]); return; }
        if (this.corrupt(s)) { this.text(f, 'Сохранение повреждено', LIST.x + 84, y + 11, C.red[4]); return; }
        const tb = this.thumb(id, s);
        const small = new Buf(40, 30);
        for (let yy = 0; yy < 30; yy++) for (let xx = 0; xx < 40; xx++) small.px[yy * 40 + xx] = tb.px[Math.floor(yy * 3.2) * tb.w + Math.floor(xx * 3.2)];
        blit(f, small, LIST.x + 40, y + 1);
        this.text(f, s.name, LIST.x + 88, y + 5);
        this.text(f, s.when, LIST.x + 88, y + 17, C.steel[3]);
        if (hov) show = { id, s };
      });
      const px = 360, py = 70;
      this.bevel(f, px, py, 256, 192, C.grey);
      if (show) {
        const tb = this.thumb(show.id, show.s);
        blit(f, scaleBuf(tb, 2), px, py);
        this.text(f, show.s.chapter || '', px, py + 206, C.gold[4]);
        this.led(f, (show.s.gameTime || '').toUpperCase(), px + 4, py + 228, C.ledR);
        this.text(f, show.s.name, px, py + 250);
      } else this.center(f, kind === 'save' ? 'Выберите слот' : 'Выберите сохранение', px + 128, py + 90, C.steel[3]);
      const back = this.my >= 440 && this.mx >= 520;
      this.bevel(f, 528, 440, 96, 24, back ? C.vest : C.steel);
      this.center(f, 'Назад', 576, 448);
    }

    drawOptions(f) {
      this.bevel(f, 100, 70, 440, 330, C.navy);
      this.center(f, 'НАСТРОЙКИ', 320, 86, C.gold[4]);
      const rows = this.optionRows();
      const i0 = Math.floor((this.my - 120) / 30);
      rows.forEach((r, i) => {
        const y = 120 + i * 30;
        const hov = i === i0 && this.mx >= 120 && this.mx < 520;
        this.bevel(f, 120, y, 400, 24, hov ? C.vest : C.steel);
        this.text(f, r.text, 132, y + 8);
        if (r.val) { this.text(f, '<', 380, y + 8, C.gold[4]); this.center(f, r.val, 450, y + 8, C.gold[4]); this.text(f, '>', 506, y + 8, C.gold[4]); }
      });
    }

    drawHints(f) {
      const m = this.menu, g = this.g;
      rectFill(f, 110, 60, 420, 360, C.cream[3]);
      frameRect(f, 109, 59, 422, 362, C.black);
      for (let y = 100; y < 416; y += 20) for (let x = 112; x < 528; x++) f.set(x, y, C.sky[3]);
      for (let y = 62; y < 418; y++) f.set(140, y, C.red[3]);
      for (let y = 70; y < 410; y += 18) S.line(f, 104, y, 116, y, C.steel[2]);
      this.center(f, 'ДУМАЙ, МАКФЛАЙ!', 330, 74, C.navy[2]);
      const goals = this.goals();
      if (!m.goal && goals[0]) m.goal = goals[0].id;
      goals.forEach((x, i) => {
        const sel = x.id === m.goal;
        this.text(f, (sel ? '> ' : '- ') + x.title, 150, 108 + i * 20, sel ? C.red[2] : C.navy[2], 0);
      });
      const goal = goals.find(x => x.id === m.goal);
      if (!goal) return;
      const n = (g.f.hints && g.f.hints[goal.id]) || 0;
      let y = 112 + goals.length * 20 + 12;
      for (let i = 0; i < n; i++) {
        for (const line of this.font.wrap(goal.hints[i], 360)) { this.text(f, line, 150, y, C.denim[1], 0); y += 14; }
        y += 6;
      }
      if (n < goal.hints.length) {
        const hov = this.my >= 382 && this.my < 404 && this.mx >= 330 && this.mx < 510;
        this.bevel(f, 330, 382, 180, 22, hov ? C.vest : C.steel);
        this.center(f, 'Ещё подсказку', 420, 389);
      }
    }

    drawRecap(f) {
      this.bevel(f, 80, 60, 480, 360, C.navy);
      this.center(f, 'ЧТО БЫЛО РАНЬШЕ', 320, 76, C.gold[4]);
      let y = 104;
      for (const line of this.font.wrap(this.ep.RECAP(this.g), 440)) { this.text(f, line, 100, y); y += 14; }
    }

    flush() {
      const g = this.g;
      if (this.screen === 'game' && g) this.r.toRGBA(g, this.img.data);
      else this.r.toRGBA({ time: this.t, fade: 0, fx: { flash: 0 } }, this.img.data);
      this.ctx.putImageData(this.img, 0, 0);
    }
  }

  Object.assign(B, { UI, packThumb, unpackThumb, THUMB });
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
