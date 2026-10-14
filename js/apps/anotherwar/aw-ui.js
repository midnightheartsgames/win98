(function (AW) {
  'use strict';

  const W800 = 800, H600 = 600;

  function el(tag, cls, parent, style) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (style) Object.assign(e.style, style);
    if (parent) parent.appendChild(e);
    return e;
  }

  AW.el = el;

  AW.label = function (key, fallback) {
    return String((AW.TEXT && AW.TEXT[key]) || fallback || key).replace(/[:\s]+$/, '');
  };

  AW.gfxURL = function (key) { return AW.Assets.base + 'gfx/' + key + '.webp'; };

  AW.spr = function (key, anim, frame, parent, x, y, opts) {
    const o = opts || {};
    const f = AW.Assets.frame(key, anim, frame);
    const d = el(o.tag || 'div', 'aw-spr' + (o.cls ? ' ' + o.cls : ''), parent);
    if (!f) return d;
    let px = x || 0, py = y || 0;
    if (o.center) { px -= f[4]; py -= f[5]; }
    if (o.centerBox) { px += (o.centerBox[0] - f[2]) / 2; py += (o.centerBox[1] - f[3]) / 2; }
    Object.assign(d.style, {
      left: px + 'px', top: py + 'px', width: f[2] + 'px', height: f[3] + 'px',
      backgroundImage: 'url("' + AW.gfxURL(key) + '")', backgroundPosition: (-f[0]) + 'px ' + (-f[1]) + 'px'
    });
    d._frame = f;
    return d;
  };

  AW.setSpr = function (d, key, anim, frame) {
    const f = AW.Assets.frame(key, anim, frame);
    if (!f) { d.style.backgroundImage = 'none'; return; }
    d.style.backgroundImage = 'url("' + AW.gfxURL(key) + '")';
    d.style.backgroundPosition = (-f[0]) + 'px ' + (-f[1]) + 'px';
    d.style.width = f[2] + 'px';
    d.style.height = f[3] + 'px';
    d._frame = f;
  };

  AW.fillBar = function (d, key, anim, frame) {
    AW.Assets.frameURL(key, anim, frame).then(url => {
      if (url) { d.style.backgroundImage = 'url("' + url + '")'; d.style.backgroundRepeat = 'repeat'; }
    });
  };

  const winCache = new Map();
  AW.windowCanvas = function (w, h, red) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.className = 'aw-wincanvas';
    const key = red ? 'gui/windowred-sk1' : 'gui/window-sk1';
    let p = winCache.get(key);
    if (!p) { p = AW.Assets.bitmap('gfx/' + key + '.webp'); winCache.set(key, p); }
    p.then(bmp => {
      const g = c.getContext('2d');
      const F = AW.Assets.gfxMeta(key).anims[0].f;
      const tile = (fr, x0, y0, x1, y1) => {
        const f = F[fr];
        for (let y = y0; y < y1; y += f[3]) {
          for (let x = x0; x < x1; x += f[2]) {
            const cw = Math.min(f[2], x1 - x), ch = Math.min(f[3], y1 - y);
            g.drawImage(bmp, f[0], f[1], cw, ch, x, y, cw, ch);
          }
        }
      };
      const sw = F[2][2], sh = F[2][3];
      tile(0, sw / 2, sh / 2, w - sw / 2, h - sh / 2);
      tile(5, sw, 0, w - sw, F[5][3]);
      tile(6, w - F[6][2], sh, w, h - sh);
      tile(7, sw, h - F[7][3], w - sw, h);
      tile(8, 0, sh, F[8][2], h - sh);
      const put = (fr, x, y) => { const f = F[fr]; g.drawImage(bmp, f[0], f[1], f[2], f[3], x, y, f[2], f[3]); };
      put(1, 0, 0);
      put(2, w - sw, 0);
      put(3, w - sw, h - sh);
      put(4, 0, h - sh);
    }).catch(() => {});
    return c;
  };

  AW.UI = class {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      this.el = el('div', 'aw-root', root);
      this.el.tabIndex = 0;
      this.stage = el('div', 'aw-stage', this.el);
      this.canvas = el('canvas', 'aw-canvas', this.stage);
      this.canvas.width = W800;
      this.canvas.height = H600;
      this.overlay = el('div', 'aw-overlay', this.stage);
      this.hudEl = el('div', 'aw-hud', this.stage);
      this.layer = el('div', 'aw-layer', this.stage);
      this.modalEl = el('div', 'aw-modal-layer', this.stage);
      this.tipEl = el('div', 'aw-tip', this.stage);
      this.cursorEl = el('div', 'aw-cursor', this.stage);
      this.mouse = { x: 400, y: 300, inside: false, l: false, r: false };
      this.keys = new Set();
      this.cursorName = 'CURSOR';
      this.cursorT = 0;
      this.destroyed = false;
      this.scale = 1;
      try { this.gl = new AW.GL(this.canvas); } catch (e) { this.glError = e; }
      this.audio = new AW.Audio();
      this.settings = this.loadSettings();
      this.audio.setVolume('music', this.settings.music);
      this.audio.setVolume('sound', this.settings.sound);
      this.audio.setVolume('speech', this.settings.speech);
      this.game = new AW.Game(this);
      this.bind();
      this.fit();
      this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.fit()) : null;
      if (this.ro) this.ro.observe(root);
      this.last = performance.now();
      this.raf = requestAnimationFrame(t => this.frame(t));
      this.boot();
    }

    loadSettings() {
      const def = { music: 0.6, sound: 0.9, speech: 1, blood: true, ztrans: true, subtitles: true, markers: true, lazy: false, gamma: 1 };
      try { return Object.assign(def, JSON.parse(localStorage.getItem('anotherwar_settings') || '{}')); } catch (e) { return def; }
    }

    saveSettings() {
      try { localStorage.setItem('anotherwar_settings', JSON.stringify(this.settings)); } catch (e) { return; }
    }

    async boot() {
      this.showLoading('Идет инициализация. Подождите, пожалуйста...');
      if (this.glError) { this.fatal('Не удалось запустить графику: ' + this.glError.message); return; }
      try {
        await AW.Data.init(rel => AW.Assets.json(rel));
      } catch (e) {
        this.fatal('Не найдены файлы игры. Переустановите Another War через Steam.\n' + e.message);
        return;
      }
      this.ready = true;
      AW.MenuUI.showMain(this);
    }

    fatal(msg) {
      this.layer.innerHTML = '';
      const d = el('div', 'aw-fatal', this.layer);
      d.textContent = msg;
    }

    showLoading(text, progress) {
      if (!this.loadingEl || !this.loadingEl.isConnected) {
        this.loadingEl = el('div', 'aw-loading', this.modalEl);
        AW.spr('gui/loading', 0, 0, this.loadingEl, 0, 0);
        this.loadingText = el('div', 'aw-loading-text', this.loadingEl);
        this.loadingBar = el('div', 'aw-loading-bar', this.loadingEl);
        this.loadingFill = el('div', 'aw-loading-fill', this.loadingBar);
      }
      this.loadingText.textContent = text || '';
      this.loadingFill.style.width = Math.round((progress || 0) * 100) + '%';
    }

    hideLoading() {
      if (this.loadingEl) this.loadingEl.remove();
      this.loadingEl = null;
    }

    fit() {
      const r = this.root.getBoundingClientRect();
      const s = Math.max(0.2, Math.min(r.width / W800, r.height / H600));
      this.scale = s;
      this.stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
      this.stage.classList.toggle('aw-crisp', Math.abs(s - Math.round(s)) < 0.01);
    }

    toStage(ev) {
      const r = this.stage.getBoundingClientRect();
      return { x: (ev.clientX - r.left) / this.scale, y: (ev.clientY - r.top) / this.scale };
    }

    bind() {
      const st = this.stage;
      this.h = {
        move: ev => {
          const p = this.toStage(ev);
          this.mouse.x = p.x;
          this.mouse.y = p.y;
          this.mouse.inside = p.x >= 0 && p.y >= 0 && p.x < W800 && p.y < H600;
          if (this.drag) this.drag.move(p);
          this.game.onMouseMove(p, ev);
        },
        down: ev => {
          this.audio.ensure();
          this.el.focus({ preventScroll: true });
          const p = this.toStage(ev);
          if (ev.button === 0) this.mouse.l = true;
          if (ev.button === 2) this.mouse.r = true;
          if (ev.target === this.canvas || ev.target === this.overlay || ev.target === this.stage || ev.target.classList.contains('aw-overlay-hit')) {
            ev.preventDefault();
            this.game.onMouseDown(p, ev.button, ev);
          }
        },
        up: ev => {
          const p = this.toStage(ev);
          if (ev.button === 0) this.mouse.l = false;
          if (ev.button === 2) this.mouse.r = false;
          if (this.drag) { const d = this.drag; this.drag = null; d.drop(p, ev); }
          this.game.onMouseUp(p, ev.button, ev);
        },
        ctx: ev => ev.preventDefault(),
        wheel: ev => { if (this.game.onWheel) this.game.onWheel(ev.deltaY, ev); },
        key: ev => {
          if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA')) return;
          if (this.onKeyOverride && this.onKeyOverride(ev)) { ev.preventDefault(); return; }
          if (this.game.onKey(ev)) { ev.preventDefault(); ev.stopPropagation(); }
        },
        keyup: ev => { this.keys.delete(ev.code); if (this.game.onKeyUp) this.game.onKeyUp(ev); },
        blur: () => { this.keys.clear(); this.mouse.l = false; this.mouse.r = false; }
      };
      st.addEventListener('mousemove', this.h.move);
      window.addEventListener('mousemove', this.h.move);
      st.addEventListener('mousedown', this.h.down);
      window.addEventListener('mouseup', this.h.up);
      st.addEventListener('contextmenu', this.h.ctx);
      st.addEventListener('wheel', this.h.wheel, { passive: true });
      this.el.addEventListener('keydown', this.h.key);
      this.el.addEventListener('keyup', this.h.keyup);
      this.el.addEventListener('blur', this.h.blur);
    }

    isActive() { return this.opts.isActive ? this.opts.isActive() : true; }

    frame(t) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(tt => this.frame(tt));
      const dt = Math.min(0.1, (t - this.last) / 1000);
      this.last = t;
      try { this.game.frame(dt); } catch (e) { if (!this.errShown) { this.errShown = true; console.error(e); } }
      this.updateCursor(dt);
    }

    setCursor(name) { this.cursorName = name || 'CURSOR'; }

    updateCursor(dt) {
      const c = this.cursorEl;
      if (!this.ready || !this.mouse.inside) { c.style.display = 'none'; return; }
      c.style.display = 'block';
      this.cursorT += dt;
      const m = AW.Assets.gfxMeta('gui/kursor');
      const an = AW.Assets.anim(m, this.cursorName) || AW.Assets.anim(m, 'CURSOR');
      if (!an) return;
      const f = an.f[Math.floor(this.cursorT * (an.fps || 15)) % an.f.length];
      let hx = f[4], hy = f[5];
      if (hx > f[2] || hy < 0) { hx = Math.round(f[2] / 2); hy = Math.round(f[3] / 2); }
      if (this.cursorName === 'CURSOR') { hx = 0; hy = 0; }
      c.style.left = (this.mouse.x - hx) + 'px';
      c.style.top = (this.mouse.y - hy) + 'px';
      c.style.width = f[2] + 'px';
      c.style.height = f[3] + 'px';
      c.style.backgroundImage = 'url("' + AW.gfxURL('gui/kursor') + '")';
      c.style.backgroundPosition = (-f[0]) + 'px ' + (-f[1]) + 'px';
    }

    tip(text, text2) {
      const t = this.tipEl;
      if (!text) { t.style.display = 'none'; return; }
      t.style.display = 'block';
      t.innerHTML = '';
      el('div', '', t).textContent = text;
      if (text2) el('div', '', t).textContent = text2;
      let x = this.mouse.x + 27, y = this.mouse.y + 3;
      const w = t.offsetWidth || 100, h = t.offsetHeight || 14;
      if (x + w > 796) x = 796 - w;
      if (y + h > 598) y = 598 - h;
      t.style.left = x + 'px';
      t.style.top = y + 'px';
    }

    clearLayer() {
      this.layer.innerHTML = '';
      this.screen = null;
      this.screenPause = false;
    }

    confirm(lines, onYes, onNo, opts) {
      const o = opts || {};
      const box = el('div', 'aw-confirm', this.modalEl);
      const w = o.w || 380, h = o.h || 150;
      Object.assign(box.style, { left: (400 - w / 2) + 'px', top: (300 - h / 2) + 'px', width: w + 'px', height: h + 'px' });
      box.appendChild(AW.windowCanvas(w, h, o.red));
      const txt = el('div', 'aw-confirm-text', box);
      for (const l of lines) el('div', '', txt).textContent = l;
      const row = el('div', 'aw-confirm-row', box);
      const close = () => { box.remove(); this.onKeyOverride = this.prevOverride || null; };
      const mk = (label, fn) => {
        const b = el('button', 'aw-btn', row);
        b.textContent = label;
        b.addEventListener('click', ev => { ev.stopPropagation(); this.audio.play('menu/click1'); close(); if (fn) fn(); });
        return b;
      };
      if (onNo !== null) {
        mk(o.yes || 'Да', onYes);
        mk(o.no || 'Нет', onNo);
      } else mk(o.ok || 'OK', onYes);
      this.prevOverride = this.onKeyOverride;
      this.onKeyOverride = ev => {
        if (ev.code === 'Enter' || ev.code === 'KeyY') { close(); if (onYes) onYes(); return true; }
        if (ev.code === 'Escape' || ev.code === 'KeyN') { close(); if (onNo) onNo(); else if (onNo === null && onYes) onYes(); return true; }
        return true;
      };
      return box;
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      window.removeEventListener('mousemove', this.h.move);
      window.removeEventListener('mouseup', this.h.up);
      try { this.game.destroy(); } catch (e) { }
      this.audio.destroy();
      if (this.gl) this.gl.destroy();
      this.el.remove();
    }
  };
})(globalThis.AW = globalThis.AW || {});
