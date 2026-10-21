(function (C) {
  'use strict';
  const { W, H } = C;

  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    KeyZ: 'jump', Space: 'jump', KeyK: 'jump',
    KeyX: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash', KeyJ: 'dash', KeyL: 'dash',
    Enter: 'confirm', NumpadEnter: 'confirm', Escape: 'back', KeyP: 'pause', Backspace: 'back',
    KeyC: 'cats', KeyQ: 'aqua', KeyM: 'mute'
  };

  class UI {
    constructor(root, opts = {}) {
      this.root = root;
      this.opts = opts;
      root.classList.add('cnx');
      root.tabIndex = 0;
      this.cv = document.createElement('canvas');
      this.cv.className = 'cnx-cv';
      root.appendChild(this.cv);
      this.ctx = this.cv.getContext('2d');
      this.save = C.loadSave();
      this.audio = new C.Audio();
      this.audio.setVolumes(this.save.music, this.save.sfx);
      this.keys = new Set();
      this.down = new Set();
      this.pressedQ = new Set();
      this.listeners = [];
      this.destroyed = false;
      this.scale = 1;
      this.t = 0;
      this.mx = -1; this.my = -1;
      this.btns = [];
      this.pad = { prev: {} };
      this.bind();
      this.resize();
      if (typeof ResizeObserver !== 'undefined') { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); }
      this.go('loading');
      this.last = performance.now();
      this.frame = this.frame.bind(this);
      this.raf = requestAnimationFrame(this.frame);
      C.Assets.load(p => { this.loadP = p; }).then(S => {
        if (this.destroyed) return;
        this.S = S;
        this.renderer = new C.Render.Renderer(S);
        this.go(opts.start || 'title', opts.startArg);
      });
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      this.audio.close();
      for (const [el, ev, fn, o] of this.listeners) el.removeEventListener(ev, fn, o);
      this.root.innerHTML = '';
    }

    isActive() { return !this.opts.isActive || this.opts.isActive(); }
    on(el, ev, fn, o) { el.addEventListener(ev, fn, o); this.listeners.push([el, ev, fn, o]); }
    persist() { this.save.at = Date.now(); C.storeSave(this.save); }

    bind() {
      const cv = this.cv;
      const pos = e => {
        const r = cv.getBoundingClientRect();
        this.mx = (e.clientX - r.left) / r.width * W;
        this.my = (e.clientY - r.top) / r.height * H;
      };
      this.on(cv, 'mousemove', e => pos(e));
      this.on(cv, 'mousedown', e => {
        e.preventDefault();
        this.root.focus({ preventScroll: true });
        this.audio.resume();
        pos(e);
        const b = this.btnAt(this.mx, this.my);
        if (b) { this.audio.sfxPlay('confirm'); b.fn(); }
        else if (this.screen && this.screen.click) this.screen.click(this.mx, this.my);
      });
      this.on(cv, 'mouseleave', () => { this.mx = -1; this.my = -1; });
      this.on(cv, 'contextmenu', e => e.preventDefault());
      this.on(this.root, 'keydown', e => {
        const a = KEYMAP[e.code];
        if (!a) return;
        e.preventDefault();
        this.audio.resume();
        if (!this.down.has(e.code)) { this.down.add(e.code); this.pressedQ.add(a); if (this.screen && this.screen.action) this.screen.action(a); }
        this.keys.add(a);
        this.recount();
      });
      this.on(this.root, 'keyup', e => {
        const a = KEYMAP[e.code];
        if (!a) return;
        e.preventDefault();
        this.down.delete(e.code);
        this.recount();
      });
      this.on(this.root, 'blur', () => { this.down.clear(); this.keys.clear(); if (this.screen && this.screen.blur) this.screen.blur(); });
    }

    recount() {
      this.keys.clear();
      for (const code of this.down) this.keys.add(KEYMAP[code]);
      for (const a in this.pad.held) if (this.pad.held[a]) this.keys.add(a);
    }

    pollPad() {
      if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
      const pads = navigator.getGamepads();
      const gp = pads && Array.from(pads).find(p => p && p.connected);
      const held = {};
      if (gp) {
        const b = i => gp.buttons[i] && gp.buttons[i].pressed;
        const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
        held.left = b(14) || ax < -0.4; held.right = b(15) || ax > 0.4;
        held.up = b(12) || ay < -0.5; held.down = b(13) || ay > 0.5;
        held.jump = b(0); held.dash = b(2) || b(1) || b(5) || b(7);
        held.pause = b(9); held.confirm = b(0) || b(9); held.back = b(1) || b(8);
      }
      const prev = this.pad.held || {};
      for (const a in held) if (held[a] && !prev[a]) { this.pressedQ.add(a); if (this.screen && this.screen.action) this.screen.action(a); }
      this.pad.held = held;
      if (gp || Object.keys(prev).length) this.recount();
    }

    pressed(a) { return this.pressedQ.has(a); }

    resize() {
      const rw = this.root.clientWidth || W * 2, rh = this.root.clientHeight || H * 2;
      const fit = Math.min(rw / W, rh / H);
      const k = fit >= 2 ? Math.floor(fit) : fit;
      const cw = Math.max(1, Math.floor(W * k)), ch = Math.max(1, Math.floor(H * k));
      this.cv.style.width = cw + 'px';
      this.cv.style.height = ch + 'px';
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bw = Math.max(1, Math.round(cw * dpr)), bh = Math.max(1, Math.round(ch * dpr));
      if (this.cv.width !== bw || this.cv.height !== bh) { this.cv.width = bw; this.cv.height = bh; }
      this.scale = bw / W;
    }

    frame(ts) {
      if (this.destroyed) return;
      const now = ts === undefined ? this.last + 16.7 : ts;
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (!(dt > 0)) dt = 0;
      dt = Math.min(dt, 0.05);
      this.t += dt;
      this.pollPad();
      if (this.screen && this.screen.update) this.screen.update(dt);
      this.pressedQ.clear();
      this.draw();
      if (!this.destroyed) this.raf = requestAnimationFrame(this.frame);
    }

    draw() {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this.cv.width, this.cv.height);
      this.btns = [];
      if (this.screen && this.screen.pixel && this.renderer) {
        const g = this.renderer.g;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.imageSmoothingEnabled = false;
        this.screen.pixel(g);
        ctx.drawImage(this.renderer.buf, 0, 0, W, H, 0, 0, this.cv.width, this.cv.height);
      }
      ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      ctx.imageSmoothingEnabled = false;
      if (this.screen && this.screen.draw) this.screen.draw(ctx);
      const hover = this.btnAt(this.mx, this.my);
      this.cv.style.cursor = hover ? 'pointer' : 'default';
    }

    go(name, arg) {
      if (this.screen && this.screen.exit) this.screen.exit();
      this.screenName = name;
      this.screen = C.Screens[name](this, arg || {});
      if (this.screen.enter) this.screen.enter();
    }

    btn(x, y, w, h, fn, id) { this.btns.push({ x, y, w, h, fn, id }); }
    btnAt(x, y) { for (let i = this.btns.length - 1; i >= 0; i--) { const b = this.btns[i]; if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return b; } return null; }
    hovered(id) { const b = this.btnAt(this.mx, this.my); return b && b.id === id; }

    font(size) { return `${size}px ${this.S ? this.S.font : 'monospace'}`; }

    text(ctx, str, x, y, o = {}) {
      const size = o.size || 8;
      ctx.font = this.font(size);
      ctx.textAlign = o.align || 'left';
      ctx.textBaseline = o.base || 'top';
      if (o.shadow !== false) {
        ctx.fillStyle = o.shadowColor || 'rgba(10,6,24,0.9)';
        const d = Math.max(0.5, size / 10);
        ctx.fillText(str, x + d, y + d);
        if (o.outline) { ctx.fillText(str, x - d, y + d); ctx.fillText(str, x + d, y - d); ctx.fillText(str, x - d, y - d); ctx.fillText(str, x, y + d * 1.6); }
      }
      ctx.fillStyle = o.color || '#ffffff';
      ctx.fillText(str, x, y);
      return ctx.measureText(str).width;
    }

    wrap(ctx, str, width, size) {
      ctx.font = this.font(size);
      const out = [];
      for (const para of String(str).split('\n')) {
        let line = '';
        for (const w of para.split(' ')) {
          const tryLine = line ? line + ' ' + w : w;
          if (ctx.measureText(tryLine).width > width && line) { out.push(line); line = w; } else line = tryLine;
        }
        out.push(line);
      }
      return out;
    }

    panel(ctx, x, y, w, h, o = {}) {
      ctx.fillStyle = o.fill || 'rgba(16,10,34,0.86)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = o.edge || '#f0a040';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      if (o.inner !== false) { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5); }
    }

    sprite(ctx, im, x, y, s) {
      if (!im) return;
      s = s || 1;
      ctx.drawImage(im, Math.round(x * this.scale) / this.scale, Math.round(y * this.scale) / this.scale, im.width * s, im.height * s);
    }
  }

  C.UI = UI;
  C.KEYMAP = KEYMAP;
})(globalThis.Catniss = globalThis.Catniss || {});
