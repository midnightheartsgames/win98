(function (FO) {
  'use strict';

  FO.RESOLUTIONS = { r640: [640, 480], r800: [800, 600], fit: null };
  const GAME_KEYS = /^F([1-9]|10)$/;

  class Game {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      this.lang = this.opts.lang === 'ru' ? 'ru' : 'en';
      this.prefs = FO.loadPrefs();
      this.el = document.createElement('div');
      this.el.className = 'fo-root';
      this.el.tabIndex = 0;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'fo-canvas';
      this.el.appendChild(this.canvas);
      root.appendChild(this.el);
      this.ctx = this.canvas.getContext('2d');
      this.scr = new FO.Screen(640, 480);
      this.mouse = { x: 0, y: 0, inside: false, down: 0 };
      this.keys = new Set();
      this.mode = null;
      this.status = 'Loading...';
      this.running = true;
      this.last = 0;
      this.handlers = [];
      this.bind();
      this.layout();
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this.layout());
        this.ro.observe(this.el);
      }
      this.frame = this.frame.bind(this);
      this.raf = requestAnimationFrame(this.frame);
    }

    active() {
      return this.opts.isActive ? this.opts.isActive() : true;
    }

    on(target, type, fn, opt) {
      target.addEventListener(type, fn, opt);
      this.handlers.push([target, type, fn, opt]);
    }

    bind() {
      const pos = e => {
        const r = this.canvas.getBoundingClientRect();
        this.mouse.x = Math.floor((e.clientX - r.left) * this.scr.w / Math.max(1, r.width));
        this.mouse.y = Math.floor((e.clientY - r.top) * this.scr.h / Math.max(1, r.height));
        this.mouse.inside = this.mouse.x >= 0 && this.mouse.y >= 0 && this.mouse.x < this.scr.w && this.mouse.y < this.scr.h;
      };
      this.on(this.canvas, 'mousemove', e => {
        pos(e);
        if (this.mode && this.mode.mouseMove) this.mode.mouseMove(this.mouse);
      });
      this.on(this.canvas, 'mouseleave', () => { this.mouse.inside = false; });
      this.on(this.canvas, 'mousedown', e => {
        pos(e);
        this.el.focus({ preventScroll: true });
        if (this.audio) this.audio.resume();
        this.mouse.down |= 1 << e.button;
        if (this.mode && this.mode.mouseDown) this.mode.mouseDown(this.mouse, e.button);
        e.preventDefault();
      });
      this.on(window, 'mouseup', e => {
        this.mouse.down &= ~(1 << e.button);
        if (this.mode && this.mode.mouseUp) this.mode.mouseUp(this.mouse, e.button);
      });
      this.on(this.canvas, 'contextmenu', e => e.preventDefault());
      this.on(this.canvas, 'wheel', e => {
        if (this.mode && this.mode.wheel) this.mode.wheel(Math.sign(e.deltaY));
        e.preventDefault();
      }, { passive: false });
      this.on(this.el, 'keydown', e => {
        if (!this.active()) return;
        if (this.audio) this.audio.resume();
        this.keys.add(e.code);
        if (this.mode && this.mode.keyDown && this.mode.keyDown(e) !== false) e.preventDefault();
        else if (GAME_KEYS.test(e.code)) e.preventDefault();
      });
      this.on(this.el, 'keyup', e => {
        this.keys.delete(e.code);
        if (this.mode && this.mode.keyUp) this.mode.keyUp(e);
      });
      this.on(window, 'blur', () => this.keys.clear());
    }

    renderSize() {
      const res = FO.screenPref(this.prefs, 'res');
      const mode = FO.RESOLUTIONS[res] !== undefined ? res : FO.SCREEN_DEFAULTS.res;
      const fixed = FO.RESOLUTIONS[mode];
      if (fixed) return fixed;
      const w = Math.max(640, Math.floor(this.el.clientWidth || 640));
      const h = Math.max(480, Math.floor(this.el.clientHeight || 480));
      return [w, h];
    }

    setResolution(mode) {
      this.prefs.res = mode;
      FO.savePrefs(this.prefs);
      if (this.opts.onResolution) this.opts.onResolution(mode);
      this.layout();
    }

    layout() {
      const [w, h] = this.renderSize();
      if (w !== this.scr.w || h !== this.scr.h) {
        this.scr.resize(w, h);
        if (this.mode && this.mode.resize) this.mode.resize(w, h);
      }
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.image = this.ctx.createImageData(w, h);
        this.u32 = new Uint32Array(this.image.data.buffer);
      }
      const cw = this.el.clientWidth || w;
      const ch = this.el.clientHeight || h;
      let s = Math.min(cw / w, ch / h);
      if (s >= 1) s = Math.floor(s);
      this.canvas.style.width = Math.max(1, Math.round(w * s)) + 'px';
      this.canvas.style.height = Math.max(1, Math.round(h * s)) + 'px';
    }

    async boot(base, ruBase) {
      try {
        const overlay = this.lang === 'ru' && ruBase ? { src: FO.webSource(ruBase, ''), files: FO.RU || {} } : null;
        this.data = await FO.Data.open(FO.webSource(base), FO.LOOSE, overlay);
        this.strings = FO.readStrings(await this.data.overlayText(FO.STRINGS_PATH));
        this.status = FO.tr(this, 'Reading prototypes...');
        this.art = new FO.Art(this.data);
        await this.art.init();
        this.protos = new FO.Protos(this.data);
        await this.protos.init();
        this.colors = new FO.Colors(FO.readPal(await this.data.get('COLOR.PAL')));
        FO.applyBrightness(this);
        this.fonts = await FO.loadFonts(this.data);
        this.audio = new FO.Sound(this);
        this.status = '';
        if (this.opts.start) await this.opts.start(this);
      } catch (e) {
        this.status = 'Error: ' + e.message;
        throw e;
      }
    }

    setMode(mode, entered) {
      if (this.mode && this.mode.leave) this.mode.leave();
      this.mode = mode;
      this.canvas.style.cursor = mode && mode.drawCursor ? 'none' : 'default';
      if (mode && mode.enter && !entered) return mode.enter();
      return null;
    }

    text(str, x, y, color, font) {
      const f = this.fonts && this.fonts[font === undefined ? 101 : font];
      if (!f) return x;
      return f.draw(this.scr, str, x, y, color, this.colors);
    }

    color(r, g, b) {
      return this.colors.nearest(r, g, b);
    }

    frame(ts) {
      if (!this.running) return;
      this.raf = requestAnimationFrame(this.frame);
      const dt = this.last ? Math.min(0.1, (ts - this.last) / 1000) : 0;
      this.last = ts;
      this.now = ts;
      if (!this.colors) {
        this.drawStatus();
        return;
      }
      this.colors.cycle(ts);
      if (this.colors.fadeJob) this.colors.stepFade(dt * 1000);
      if (this.art) this.art.tick++;
      if (this.mode && this.mode.update) this.mode.update(dt);
      if (this.mode && this.mode.draw) this.mode.draw(this.scr);
      else this.scr.fill(0);
      if (this.status) this.text(this.status, 8, this.scr.h - 20, this.color(0, 255, 0));
      this.scr.toRGBA(this.u32, this.lut || this.colors.lut);
      if (this.paint) this.paint(this.u32, this.scr.w, this.scr.h);
      this.ctx.putImageData(this.image, 0, 0);
    }

    drawStatus() {
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#3f3';
      this.ctx.font = '14px monospace';
      this.ctx.fillText(this.status || '', 8, this.canvas.height - 12);
    }

    destroy() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      if (this.mode && this.mode.leave) this.mode.leave();
      if (this.audio) this.audio.close();
      for (const [t, type, fn, opt] of this.handlers) t.removeEventListener(type, fn, opt);
      this.handlers = [];
      if (this.ro) this.ro.disconnect();
      if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
    }
  }

  FO.Game = Game;
})(globalThis.FO = globalThis.FO || {});
