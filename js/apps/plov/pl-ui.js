(function (P) {
  'use strict';
  const O = P.Orn, A = P.Art;
  const W = 800, H = 600;
  const SAVE_KEY = 'plov98_save';
  const FONT = 'Tahoma, Verdana, "Segoe UI", sans-serif';
  const SERIF = '"Palatino Linotype", "Book Antiqua", Georgia, serif';
  const SCREENS = {};

  function defaultSave() {
    return { v: 1, days: {}, unlocked: 1, wallet: 0, earned: 0, up: {}, relaxed: false, music: 0.5, sfx: 0.8, finale: false, played: 0 };
  }

  function loadSave() {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SAVE_KEY) : null;
      const s = raw ? JSON.parse(raw) : null;
      if (s && s.v === 1) return Object.assign(defaultSave(), s);
    } catch (e) { }
    return defaultSave();
  }

  function storeSave(s) {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { }
  }

  const memo = new Map();
  function memoCanvas(key, w, h, draw) {
    let c = memo.get(key);
    if (!c) {
      c = A.mk(w, h, 0, 0, draw);
      memo.set(key, c);
      if (memo.size > 60) memo.delete(memo.keys().next().value);
    }
    return c;
  }

  function wrap(ctx, text, maxW) {
    const out = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
        else line = test;
      }
      out.push(line);
    }
    return out;
  }

  function bevel(ctx, x, y, w, h, r, top, bottom) {
    const b = ctx.createLinearGradient(0, y, 0, y + h);
    b.addColorStop(0, top); b.addColorStop(0.42, 'rgba(0,0,0,0)'); b.addColorStop(0.62, 'rgba(0,0,0,0)'); b.addColorStop(1, bottom);
    A.rrect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, Math.max(1, r - 1.5), null, b, 1.4);
  }

  function glaze(ctx, x, y, w, h, base, opts = {}) {
    const r = opts.r === undefined ? 6 : opts.r;
    A.rrect(ctx, x + 1, y + 3, w, h, r, 'rgba(30,15,5,0.42)', null);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, O.shade(base, 0.24));
    g.addColorStop(0.55, base);
    g.addColorStop(1, O.shade(base, -0.32));
    A.rrect(ctx, x, y, w, h, r, g, '#241006', 1.4);
    bevel(ctx, x, y, w, h, r, 'rgba(255,248,225,0.85)', 'rgba(20,6,0,0.6)');
    A.rrect(ctx, x + 3, y + 3, w - 6, h * 0.3, Math.max(1, r - 3), 'rgba(255,250,235,0.14)', null);
    if (opts.focus) A.rrect(ctx, x - 2, y - 2, w + 4, h + 4, r + 2, null, '#ffd23a', 2.2);
  }

  function well(ctx, x, y, w, h, opts = {}) {
    const r = opts.r === undefined ? 5 : opts.r;
    A.rrect(ctx, x, y, w, h, r, opts.fill || '#26140a', '#0e0602', 1.2);
    bevel(ctx, x, y, w, h, r, 'rgba(0,0,0,0.7)', 'rgba(255,222,170,0.32)');
  }

  function plaque(ctx, x, y, w, h, opts = {}) {
    const r = opts.r === undefined ? 5 : opts.r;
    const base = opts.fill || '#f2dfb4';
    if (opts.shadow !== false) A.rrect(ctx, x + 1, y + 2, w, h, r, 'rgba(20,8,0,0.45)', null);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, O.shade(base, 0.14)); g.addColorStop(1, O.shade(base, -0.12));
    A.rrect(ctx, x, y, w, h, r, g, opts.line || '#241006', 1.3);
    bevel(ctx, x, y, w, h, r, 'rgba(255,255,245,0.8)', 'rgba(60,30,8,0.4)');
  }

  function keycap(ctx, text, x, y, opts = {}) {
    const size = opts.size || 10;
    ctx.font = 'bold ' + size + 'px ' + FONT;
    const w = Math.max(opts.min || 17, Math.ceil(ctx.measureText(text).width) + 9), h = opts.h || size + 7;
    A.rrect(ctx, x, y + 1.6, w, h, 3, '#140a04', null);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#d4c4a0');
    A.rrect(ctx, x, y, w, h, 3, g, '#140a04', 1);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x + 2.5, y + 1.4, w - 5, 1);
    ctx.fillStyle = '#2a1a0c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';
    return w;
  }

  function keyLine(ctx, parts, cx, y, opts = {}) {
    const size = opts.size || 10;
    const gap = opts.gap || 12;
    const textFont = (opts.bold ? 'bold ' : '') + (opts.textSize || size) + 'px ' + FONT;
    let total = 0;
    const widths = parts.map(([k, text]) => {
      ctx.font = 'bold ' + size + 'px ' + FONT;
      const kw = k ? Math.max(opts.min || 17, Math.ceil(ctx.measureText(k).width) + 9) : 0;
      ctx.font = textFont;
      const tw = text ? ctx.measureText(text).width : 0;
      const w = kw + (k && text ? 5 : 0) + tw;
      total += w;
      return [kw, tw, w];
    });
    total += gap * (parts.length - 1);
    let x = opts.align === 'left' ? cx : cx - total / 2;
    parts.forEach(([k, text], i) => {
      const [kw, , w] = widths[i];
      if (k) keycap(ctx, k, x, y - (size + 7) / 2, { size, min: opts.min });
      if (text) label(ctx, text, x + kw + (k ? 5 : 0), y, { align: 'left', font: textFont, color: opts.color || '#f4e6c8', outline: opts.outline, ow: opts.ow });
      x += w + gap;
    });
    return total;
  }

  function label(ctx, text, x, y, opts = {}) {
    ctx.font = opts.font || ('bold ' + (opts.size || 14) + 'px ' + (opts.serif ? SERIF : FONT));
    ctx.textAlign = opts.align || 'center';
    ctx.textBaseline = opts.base || 'middle';
    if (opts.outline) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = opts.outline;
      ctx.lineWidth = opts.ow || 3;
      ctx.strokeText(text, x, y);
    }
    if (opts.shadow) { ctx.fillStyle = opts.shadow; ctx.fillText(text, x + 1, y + 1.5); }
    ctx.fillStyle = opts.color || '#fff';
    ctx.fillText(text, x, y);
    ctx.textBaseline = 'alphabetic';
  }

  function paper(ctx, x, y, w, h, opts = {}) {
    const r0 = opts.r || 6;
    const key = 'paper:' + w + ':' + h + ':' + r0 + ':' + (opts.top || '') + (opts.bottom || '') + (opts.line || '');
    const c = memoCanvas(key, w + 6, h + 8, cx => {
      A.rrect(cx, 3, 5, w, h, r0, 'rgba(30,15,5,0.35)', null);
      const g = cx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, opts.top || '#fbf1d8'); g.addColorStop(1, opts.bottom || '#efdcb0');
      A.rrect(cx, 0.8, 0.8, w - 1.6, h - 1.6, r0, g, opts.line || '#6a4424', 1.6);
      const r = P.rng(w * 31 + h * 7);
      cx.save();
      A.rrect(cx, 0, 0, w, h, r0, null, null); cx.clip();
      for (let i = 0; i < w * h / 120; i++) { cx.fillStyle = r() < 0.5 ? 'rgba(140,100,50,0.05)' : 'rgba(255,255,255,0.08)'; cx.fillRect(r() * w, r() * h, 1 + r() * 3, 1); }
      cx.restore();
    });
    ctx.drawImage(c.c, x, y, c.w, c.h);
  }

  function ikatBorder(ctx, x, y, w, h, seed, thick) {
    const t = thick || 10;
    const c = memoCanvas('ikb:' + seed + ':' + w + ':' + h + ':' + t, w, h, cx => {
      const strip = O.ikat(seed, 40, t * 2, ['#b3262e', '#e8b64a', '#1f4f8f', '#f3e6c8', '#2a6a3a'], { kind: 'amulet', tileW: 20, tileH: t * 2, feather: 0.1 });
      const pat = O.patternOf(cx, strip);
      cx.save();
      cx.beginPath();
      cx.rect(0, 0, w, h);
      cx.rect(t, t, w - t * 2, h - t * 2);
      cx.clip('evenodd');
      cx.fillStyle = pat;
      cx.fillRect(0, 0, w, h);
      cx.restore();
      A.rrect(cx, 0.7, 0.7, w - 1.4, h - 1.4, 2, null, '#3b2417', 1.4);
      A.rrect(cx, t, t, w - t * 2, h - t * 2, 1, null, '#3b2417', 1.2);
    });
    ctx.drawImage(c.c, x, y, w, h);
  }

  class UI {
    constructor(root, opts = {}) {
      this.root = root;
      this.opts = opts;
      root.classList.add('plv');
      root.tabIndex = 0;
      root.innerHTML = '<canvas class="plv-cv"></canvas>';
      this.cv = root.querySelector('canvas');
      this.ctx = this.cv.getContext('2d');
      this.save = loadSave();
      this.audio = new P.Audio();
      this.audio.setVolumes(this.save.music, this.save.sfx);
      this.mx = -1; this.my = -1;
      this.t = 0;
      this.btns = [];
      this.hoverBtn = null;
      this.focus = -1;
      this.keys = new Set();
      this.listeners = [];
      this.destroyed = false;
      this.scale = 1;
      this.bind();
      this.resize();
      if (typeof ResizeObserver !== 'undefined') { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); }
      this.go(opts.start || 'title', opts.startArg);
      this.last = typeof performance !== 'undefined' ? performance.now() : 0;
      this.frame = this.frame.bind(this);
      if (typeof requestAnimationFrame !== 'undefined') this.raf = requestAnimationFrame(this.frame);
    }

    destroy() {
      this.destroyed = true;
      if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      this.audio.close();
      for (const [el, ev, fn, o] of this.listeners) el.removeEventListener(ev, fn, o);
      this.root.innerHTML = '';
    }

    isActive() { return !this.opts.isActive || this.opts.isActive(); }

    on(el, ev, fn, o) { el.addEventListener(ev, fn, o); this.listeners.push([el, ev, fn, o]); }

    persist() { storeSave(this.save); }

    bind() {
      const cv = this.cv;
      const pos = e => {
        const r = cv.getBoundingClientRect();
        this.mx = (e.clientX - r.left) / r.width * W;
        this.my = (e.clientY - r.top) / r.height * H;
      };
      this.on(cv, 'mousemove', e => { pos(e); this.onMove(); });
      this.on(cv, 'mousedown', e => {
        e.preventDefault();
        this.root.focus({ preventScroll: true });
        this.audio.resume();
        pos(e);
        this.onDown(e.button === 2 ? 2 : 0);
      });
      this.on(cv, 'mouseup', e => { pos(e); if (this.screen && this.screen.up) this.screen.up(this.mx, this.my, e.button === 2 ? 2 : 0); });
      this.on(cv, 'mouseleave', () => { this.mx = -1; this.my = -1; if (this.screen && this.screen.leave) this.screen.leave(); });
      this.on(cv, 'contextmenu', e => e.preventDefault());
      this.on(cv, 'wheel', e => { e.preventDefault(); if (this.screen && this.screen.wheel) this.screen.wheel(e.deltaY); }, { passive: false });
      this.on(this.root, 'keydown', e => this.onKey(e, true));
      this.on(this.root, 'keyup', e => this.onKey(e, false));
      this.on(this.root, 'blur', () => { this.keys.clear(); if (this.screen && this.screen.blur) this.screen.blur(); });
    }

    resize() {
      const rw = this.root.clientWidth || W, rh = this.root.clientHeight || H;
      const s = Math.min(rw / W, rh / H);
      const cw = Math.max(1, Math.floor(W * s)), ch = Math.max(1, Math.floor(H * s));
      this.cv.style.width = cw + 'px';
      this.cv.style.height = ch + 'px';
      const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
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
      dt = Math.min(dt, 0.1);
      this.t += dt;
      this.audio.update();
      if (this.screen && this.screen.update) this.screen.update(dt);
      this.draw();
      if (typeof requestAnimationFrame !== 'undefined' && !this.destroyed) this.raf = requestAnimationFrame(this.frame);
    }

    draw() {
      const ctx = this.ctx;
      ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      this.btns = [];
      if (this.screen && this.screen.draw) this.screen.draw(ctx);
      if (this.modal) this.modal.draw(ctx);
      this.hoverBtn = this.btnAt(this.mx, this.my);
      if (this.cv.style) this.cv.style.cursor = this.hoverBtn || (this.screen && this.screen.cursor && this.screen.cursor()) ? 'pointer' : 'default';
    }

    go(name, arg) {
      if (this.screen && this.screen.exit) this.screen.exit();
      this.modal = null;
      this.focus = -1;
      this.screenName = name;
      this.screen = SCREENS[name](this, arg || {});
      if (this.screen.enter) this.screen.enter();
    }

    openModal(m) { this.modal = m; this.focus = -1; }
    closeModal() { this.modal = null; this.focus = -1; }

    btn(rect, text, action, opts = {}) {
      const b = Object.assign({ x: rect[0], y: rect[1], w: rect[2], h: rect[3], text, action }, opts);
      b.idx = this.btns.length;
      this.btns.push(b);
      const hover = P.inRect(this.mx, this.my, b) && !b.disabled;
      const focused = this.focus === b.idx;
      if (b.draw) { b.draw(this.ctx, hover || focused, b); return b; }
      const ctx = this.ctx;
      const base = b.disabled ? '#8a8478' : (b.color || '#2a6ab0');
      const lift = hover ? -1.5 : 0;
      glaze(ctx, b.x, b.y + lift, b.w, b.h, hover && !b.disabled ? O.shade(base, 0.12) : base, { r: b.r, focus: focused });
      if (b.icon) b.icon(ctx, b.x + (b.text ? 20 : b.w / 2), b.y + b.h / 2 + lift);
      if (b.text) label(ctx, b.text, b.x + b.w / 2 + (b.icon ? 10 : 0), b.y + b.h / 2 + lift + 1, { size: b.size || 15, color: b.disabled ? '#e8e2d4' : '#fffaf0', outline: 'rgba(30,15,5,0.6)', ow: 3, serif: b.serif });
      return b;
    }

    btnAt(x, y) {
      for (let i = this.btns.length - 1; i >= 0; i--) {
        const b = this.btns[i];
        if (!b.disabled && P.inRect(x, y, b)) return b;
      }
      return null;
    }

    onMove() {
      const b = this.btnAt(this.mx, this.my);
      if (b && b !== this.lastHover && !b.silent) this.audio.sfx('hover');
      this.lastHover = b;
      if (this.modal && this.modal.move) this.modal.move(this.mx, this.my);
      else if (this.screen && this.screen.move) this.screen.move(this.mx, this.my);
    }

    onDown(button) {
      const b = button === 0 ? this.btnAt(this.mx, this.my) : null;
      if (b) {
        if (!b.silent) this.audio.sfx('click');
        b.action();
        return;
      }
      if (this.modal) { if (this.modal.click) this.modal.click(this.mx, this.my, button); return; }
      if (this.screen && this.screen.click) this.screen.click(this.mx, this.my, button);
    }

    onKey(e, down) {
      const k = e.key;
      if ([' ', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'Enter', 'F1'].includes(k)) e.preventDefault();
      if (down) this.audio.resume();
      const code = e.code || '';
      if (down) this.keys.add(code || k); else this.keys.delete(code || k);
      if (!down) { if (this.screen && this.screen.keyup) this.screen.keyup(e); return; }
      if (this.modal) {
        if (this.modal.key && this.modal.key(e)) return;
        if (this.navKey(e)) return;
        if (k === 'Escape' && this.modal.cancel) { this.modal.cancel(); return; }
        return;
      }
      if (this.screen && this.screen.key && this.screen.key(e)) return;
      this.navKey(e);
    }

    navKey(e) {
      const k = e.key;
      const n = this.btns.length;
      if (!n) return false;
      if (k === 'ArrowDown' || k === 'ArrowRight' || (k === 'Tab' && !e.shiftKey)) { this.focus = (this.focus + 1 + n) % n; while (this.btns[this.focus].disabled && n > 1) this.focus = (this.focus + 1) % n; this.audio.sfx('hover'); return true; }
      if (k === 'ArrowUp' || k === 'ArrowLeft' || (k === 'Tab' && e.shiftKey)) { this.focus = (this.focus - 1 + n) % n; while (this.btns[this.focus].disabled && n > 1) this.focus = (this.focus - 1 + n) % n; this.audio.sfx('hover'); return true; }
      if ((k === 'Enter' || k === ' ') && this.focus >= 0 && this.btns[this.focus] && !this.btns[this.focus].disabled) { this.audio.sfx('click'); this.btns[this.focus].action(); return true; }
      return false;
    }

    exit() { if (this.opts.onExit) this.opts.onExit(); }

    dayRecord(n) { return this.save.days[n] || { best: 0, stars: 0, plays: 0 }; }

    totalStars() { let s = 0; for (let i = 1; i <= P.LEVELS.length; i++) s += this.dayRecord(i).stars; return s; }

    upgradesFor() { return Object.assign({}, this.save.up); }
  }

  function drawDesk(ctx, t, seed) {
    const c = memoCanvas('desk:' + (seed || 5), W, H, cx => {
      const g = cx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#7a4424'); g.addColorStop(1, '#4a2410');
      cx.fillStyle = g;
      cx.fillRect(0, 0, W, H);
      const r = P.rng(seed || 5);
      cx.strokeStyle = 'rgba(30,12,4,0.35)'; cx.lineWidth = 1;
      for (let i = 0; i < 70; i++) {
        const y = r() * H;
        cx.beginPath(); cx.moveTo(0, y); cx.bezierCurveTo(W * 0.3, y + (r() - 0.5) * 20, W * 0.7, y + (r() - 0.5) * 20, W, y + (r() - 0.5) * 12); cx.stroke();
      }
      cx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let x = 0; x < W; x += 160) cx.fillRect(x, 0, 2, H);
    });
    ctx.drawImage(c.c, 0, 0, W, H);
  }

  let titleArt = null;
  function titleBackdrop() {
    if (titleArt) return titleArt;
    const big = O.canvas(520, 520);
    const c = big.getContext('2d');
    O.suzani(c, 260, 260, 250, 20001, ['#9a2a2e', '#e8b64a', '#1f4f8f', '#3d7a3a', '#f3e6c8', '#4a1a10']);
    titleArt = { suzani: big };
    return titleArt;
  }

  function drawLogo(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    const wob = Math.sin(t * 1.3) * 1.2;
    ctx.rotate(-0.03);
    const ribbon = (yy, w) => {
      A.poly(ctx, [[-w / 2 - 26, yy - 8], [-w / 2, yy - 18], [-w / 2, yy + 22], [-w / 2 - 26, yy + 12], [-w / 2 - 14, yy + 2]], '#8a1a22', '#3b0a0e', 1.5);
      A.poly(ctx, [[w / 2 + 26, yy - 8], [w / 2, yy - 18], [w / 2, yy + 22], [w / 2 + 26, yy + 12], [w / 2 + 14, yy + 2]], '#8a1a22', '#3b0a0e', 1.5);
    };
    ribbon(78, 330);
    const band = ctx.createLinearGradient(0, 58, 0, 100);
    band.addColorStop(0, '#d83a3a'); band.addColorStop(1, '#9a1e24');
    A.rrect(ctx, -170, 58, 340, 42, 4, band, '#3b0a0e', 2);
    ctx.save(); ctx.beginPath(); ctx.rect(-166, 62, 332, 6); ctx.clip();
    ctx.restore();
    const st = memoCanvas('logoStrip', 332, 6, cx => {
      const strip = O.ikat(4242, 80, 12, ['#f3e6c8', '#e8b64a', '#1f4f8f', '#2a6a3a', '#f3e6c8'], { kind: 'comb', tileW: 16, tileH: 12, feather: 0.1 });
      cx.fillStyle = O.patternOf(cx, strip); cx.fillRect(0, 0, 332, 6);
    });
    ctx.drawImage(st.c, -166, 62, 332, 6);
    const grad = ctx.createLinearGradient(0, -60, 0, 10);
    grad.addColorStop(0, '#fff6c0'); grad.addColorStop(0.45, '#ffd23a'); grad.addColorStop(1, '#e07a10');
    ctx.font = 'bold 66px ' + SERIF;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3b1a08'; ctx.lineWidth = 10; ctx.strokeText('Где плов?', 0, 0 + wob);
    ctx.fillStyle = grad; ctx.fillText('Где плов?', 0, 0 + wob);
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.strokeText('Где плов?', 0, -1 + wob);
    ctx.font = 'bold 40px ' + SERIF;
    ctx.strokeStyle = '#3b0a0e'; ctx.lineWidth = 7; ctx.strokeText('Чайхана', 0, 92);
    ctx.fillStyle = '#fff4d0'; ctx.fillText('Чайхана', 0, 92);
    ctx.restore();
  }

  SCREENS.title = (ui) => ({
    enter() { ui.audio.play('menu'); },
    draw(ctx) {
      const t = ui.t;
      const g = ctx.createRadialGradient(560, 260, 40, 480, 300, 620);
      g.addColorStop(0, '#f6c870'); g.addColorStop(0.5, '#d8843a'); g.addColorStop(1, '#6a2a12');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const art = titleBackdrop();
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.translate(560, 300);
      ctx.rotate(t * 0.04);
      ctx.drawImage(art.suzani, -300, -300, 600, 600);
      ctx.restore();
      ctx.fillStyle = 'rgba(40,15,5,0.25)';
      ctx.fillRect(0, 470, W, 130);
      const fl = memoCanvas('titleFloor', W, 100, cx => { O.basketweave(cx, 0, 0, W, 100, 77, { brick: 14 }); cx.fillStyle = 'rgba(60,25,8,0.35)'; cx.fillRect(0, 0, W, 100); });
      ctx.drawImage(fl.c, 0, 500, W, 100);
      const hx = 590, hy = 505;
      A.shadow(ctx, hx, hy + 2, 60, 12, 0.35);
      const smile = Math.sin(t * 0.8) > 0.85;
      const blink = !smile && (t % 4.2) < 0.13;
      A.drawCharHD(ctx, A.CHEF, { dir: 'down', act: 'stand', arm: 'carry', frame: 0, expr: smile ? 'happy' : blink ? 'blink' : 'ok' }, hx, hy, 4);
      P.Icons.food(ctx, 'plov', hx, hy - 104, 86);
      P.Scene.steam(ctx, hx, hy - 150, t, 6, 16, 0.6);
      drawLogo(ctx, 230, 150, t);
      const bx = 110, bw = 240;
      const items = [
        ['Играть', () => ui.go('days'), '#c8432a'],
        ['Книга рецептов', () => ui.go('recipes', { back: 'title' }), '#2a6ab0'],
        ['Настройки', () => ui.openModal(settingsModal(ui)), '#2a6ab0'],
        ['Выход', () => ui.exit(), '#6a5a4a']
      ];
      items.forEach((it, i) => ui.btn([bx, 300 + i * 54, bw, 42], it[0], it[1], { color: it[2], size: 17, serif: true }));
      label(ctx, '© 2000 Kishlak Soft · версия 1.0 · CD-ROM', 16, 584, { align: 'left', size: 11, color: 'rgba(255,240,210,0.8)', font: '11px ' + FONT });
      const st = ui.totalStars();
      if (st) label(ctx, 'Звёзд: ' + st + ' из 30', 784, 584, { align: 'right', size: 12, color: '#ffe8a0', outline: 'rgba(40,15,5,0.7)' });
    },
    key(e) { if (e.key === 'Escape') { ui.exit(); return true; } return false; }
  });

  function slider(ui, ctx, x, y, w, value, onChange) {
    ctx.fillStyle = '#3b2417';
    A.rrect(ctx, x, y - 4, w, 8, 4, '#c8a878', '#3b2417', 1);
    A.rrect(ctx, x, y - 4, w * value, 8, 4, '#2a6ab0', null);
    const kx = x + w * value;
    ui.btn([x - 8, y - 14, w + 16, 28], '', () => {
      const v = P.clamp((ui.mx - x) / w, 0, 1);
      onChange(Math.round(v * 20) / 20);
    }, { silent: true, draw: (c, hov) => { A.ell(c, kx, y, 9, 9, hov ? '#ffd23a' : '#f6e2b0', '#3b2417', 1.4); } });
    label(ctx, Math.round(value * 100) + '%', x + w + 34, y, { size: 12, color: '#3b2417' });
  }

  function settingsModal(ui) {
    return {
      draw(ctx) {
        ctx.fillStyle = 'rgba(20,10,5,0.55)'; ctx.fillRect(0, 0, W, H);
        paper(ctx, 190, 120, 420, 340);
        ikatBorder(ctx, 190, 120, 420, 340, 777, 9);
        label(ctx, 'Настройки', 400, 158, { size: 24, serif: true, color: '#6a2410' });
        const s = ui.save;
        label(ctx, 'Музыка', 230, 212, { align: 'left', size: 14, color: '#3b2417' });
        slider(ui, ctx, 330, 212, 180, s.music, v => { s.music = v; ui.audio.setVolumes(s.music, s.sfx); ui.persist(); });
        label(ctx, 'Звуки', 230, 256, { align: 'left', size: 14, color: '#3b2417' });
        slider(ui, ctx, 330, 256, 180, s.sfx, v => { s.sfx = v; ui.audio.setVolumes(s.music, s.sfx); ui.audio.sfx('plate'); ui.persist(); });
        label(ctx, 'Спокойный режим', 230, 300, { align: 'left', size: 14, color: '#3b2417' });
        ui.btn([430, 286, 110, 30], s.relaxed ? 'Включён' : 'Выключен', () => { s.relaxed = !s.relaxed; ui.persist(); }, { color: s.relaxed ? '#3d8a3a' : '#8a6a4a', size: 13 });
        ctx.font = '12px ' + FONT; ctx.textAlign = 'left'; ctx.fillStyle = '#6a4a2a';
        wrap(ctx, 'Гости ждут на треть дольше. Подходит, чтобы спокойно освоиться с казаном.', 330).forEach((l, i) => ctx.fillText(l, 230, 330 + i * 15));
        ui.btn([230, 400, 160, 34], 'Сбросить прогресс', () => ui.openModal(confirmModal(ui, 'Стереть все дни, звёзды и копилку?', () => { const keep = { music: s.music, sfx: s.sfx }; ui.save = Object.assign(defaultSave(), keep); ui.persist(); ui.go('title'); })), { color: '#8a2a1a', size: 13 });
        ui.btn([430, 400, 140, 34], 'Готово', () => ui.closeModal(), { color: '#2a6ab0', size: 15 });
      },
      cancel() { ui.closeModal(); }
    };
  }

  function confirmModal(ui, text, yes) {
    return {
      draw(ctx) {
        ctx.fillStyle = 'rgba(20,10,5,0.6)'; ctx.fillRect(0, 0, W, H);
        paper(ctx, 230, 220, 340, 160);
        ctx.font = 'bold 15px ' + FONT; ctx.fillStyle = '#3b2417'; ctx.textAlign = 'center';
        wrap(ctx, text, 290).forEach((l, i) => ctx.fillText(l, 400, 262 + i * 20));
        ui.btn([260, 322, 130, 36], 'Да', () => { ui.closeModal(); yes(); }, { color: '#8a2a1a' });
        ui.btn([410, 322, 130, 36], 'Нет', () => ui.closeModal(), { color: '#2a6ab0' });
      },
      cancel() { ui.closeModal(); }
    };
  }

  Object.assign(P, { UI, SCREENS, W, H, FONT, SERIF, wrap, glaze, well, plaque, keycap, keyLine, memoCanvas, label, paper, ikatBorder, drawDesk, drawLogo, settingsModal, confirmModal, loadSave, storeSave, defaultSave, SAVE_KEY });
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(globalThis.Plov = globalThis.Plov || {});
