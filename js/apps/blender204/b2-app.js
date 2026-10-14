(function (B) {
  'use strict';
  const rgb = B.rgb;

  const KEYMAP = {
    Tab: 'TAB', Enter: 'RET', NumpadEnter: 'PADENTER', Escape: 'ESC', Space: 'SPACE', Backspace: 'BACKSPACE', Delete: 'DEL',
    Home: 'HOME', End: 'END', PageUp: 'PAGEUP', PageDown: 'PAGEDOWN', ArrowLeft: 'LEFTARROW', ArrowRight: 'RIGHTARROW',
    ArrowUp: 'UPARROW', ArrowDown: 'DOWNARROW', NumpadAdd: 'PADPLUS', NumpadSubtract: 'PADMINUS', NumpadDivide: 'PADSLASH',
    NumpadMultiply: 'PADASTER', NumpadDecimal: 'PADPERIOD', Comma: 'COMMA', Period: 'PERIOD', Minus: 'MINUS', Equal: 'EQUAL',
    BracketLeft: 'LEFTBRACKET', BracketRight: 'RIGHTBRACKET', Slash: 'SLASH', Backslash: 'BACKSLASH', Semicolon: 'SEMICOLON',
    Quote: 'QUOTE', Backquote: 'ACCENTGRAVE', Insert: 'INSERT'
  };

  function normKey(e) {
    const c = e.code || '';
    if (KEYMAP[c]) return KEYMAP[c];
    if (/^Key[A-Z]$/.test(c)) return c.slice(3);
    if (/^Digit[0-9]$/.test(c)) return c.slice(5);
    if (/^Numpad[0-9]$/.test(c)) return 'PAD' + c.slice(6);
    if (/^F([1-9]|1[0-2])$/.test(c)) return c;
    if (e.key && e.key.length === 1) return e.key.toUpperCase();
    return (e.key || '').toUpperCase();
  }

  class App {
    constructor(root, opts = {}) {
      this.root = root;
      this.opts = opts;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'b204-canvas';
      this.canvas.tabIndex = 0;
      root.appendChild(this.canvas);
      this.ctx2d = this.canvas.getContext('2d');
      this.raster = new B.Raster(64, 64);
      this.mouse = [0, 0];
      this.overlays = [];
      this.modal = null;
      this.dirtyAll = true;
      this.frameReq = 0;
      this.listeners = new AbortController();
      this.prefs = Object.assign({ tooltips: true, twoMouse: false, trackball: true, emulateNumpad: false, autoTempSave: false, matOnOb: false, dupliMesh: true, grabGrid: false, rotGrid: false, sizeGrid: false, noCapsLock: false, versions: 2 }, B.loadPrefs ? B.loadPrefs() : {});
      this.G = { main: null, scene: null, obedit: null, f: { vertexpaint: false, faceselect: false, proportional: false, propSmooth: false }, editMesh: null, playing: null, propsize: 1, rendered: null, editOpts: { steps: 9, degr: 90, turns: 1, keepOriginal: false, clockwise: true, offset: 1, limit: 0.001, drawNormals: false, normalSize: 0.1, drawFaces: false, allEdges: false } };
      this.loadIcons();
      const r0 = root.getBoundingClientRect();
      this.raster.resize(Math.max(320, Math.floor(r0.width) || 1000), Math.max(200, Math.floor(r0.height) || 700));
      this.canvas.width = this.raster.w;
      this.canvas.height = this.raster.h;
      this.newFile(true);
      this.bind();
      this.resizeObs = new ResizeObserver(() => this.resize());
      this.resizeObs.observe(root);
      this.resize();
      if (!opts.noSplash) this.showSplash();
    }

    loadIcons() {
      const load = (src, cb) => {
        if (typeof Image === 'undefined') return;
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width; c.height = img.height;
          const g = c.getContext('2d');
          g.drawImage(img, 0, 0);
          const d = g.getImageData(0, 0, img.width, img.height);
          cb({ w: img.width, h: img.height, buf: new Uint32Array(d.data.buffer.slice(0)), flipY: false });
          this.redrawAll();
        };
        img.src = src;
      };
      if (B.ASSETS) {
        load(B.ASSETS.icons, im => { this.raster.setIcons(im); B.iconImage = im; });
        load(B.ASSETS.splash, im => { this.splashImg = im; });
      }
    }

    newFile(initial) {
      this.exitEditMode(false);
      const main = B.userDefaultFile ? B.userDefaultFile() : null;
      this.setMain(main || B.Data.defaultFile(), initial);
    }

    setMain(main) {
      this.G.main = main;
      this.G.scene = main.curscene || main.scenes[0];
      this.G.obedit = null;
      this.G.editMesh = null;
      if (!main.screensUI || !main.screensUI.length) {
        main.screensUI = [B.defaultScreen(this.raster.w || 1000, this.raster.h || 700, this.G.scene)];
      }
      this.screen = main.screensUI[main.curScreenIndex || 0] || main.screensUI[0];
      this.screen.resize(this.raster.w, this.raster.h);
      this.screen.layout();
      main.screensUI.forEach(s => s.areas.forEach(a => { a.spaces = a.spaces || {}; }));
      if (B.Anim) B.Anim.setFrame(this, this.G.scene.cfra, true);
      this.G.scene.bases.forEach(b => B.Data.whereIs(b.object));
      if (this.G.scene.bases.some(b => b.editMode)) {
        const b = this.G.scene.bases.find(x => x.editMode);
        b.editMode = false;
      }
      this.redrawAll();
    }

    get scene() { return this.G.scene; }
    get main() { return this.G.main; }

    resize() {
      const rect = this.root.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width)), h = Math.max(200, Math.floor(rect.height));
      if (w === this.raster.w && h === this.raster.h) return;
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      const icons = this.raster.icons;
      this.raster.resize(w, h);
      this.raster.setIcons(icons);
      (this.main.screensUI || []).forEach(s => s.resize(w, h));
      this.screen.layout();
      this.overlays.forEach(o => { if (o.relayout) o.relayout(); });
      this.redrawAll();
    }

    redrawAll() {
      this.dirtyAll = true;
      if (this.screen) this.screen.areas.forEach(a => a.redraw());
      this.schedule();
    }

    redraw(area) { if (area) area.redraw(); this.schedule(); }
    redrawType(type) { this.screen.areas.forEach(a => { if (a.type === type) a.redraw(); }); this.schedule(); }

    redrawBlock(block) {
      if (block && block.area) block.area.redraw();
      else this.overlayDirty = true;
      this.schedule();
    }

    changed() {
      this.redrawAll();
    }

    schedule() {
      if (this.frameReq || this.destroyed) return;
      const raf = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : f => setTimeout(f, 16);
      this.frameReq = raf(() => { this.frameReq = 0; this.draw(); });
    }

    draw() {
      if (this.destroyed) return;
      const r = this.raster;
      const scr = this.screen;
      scr.layout();
      if (this.overlays.length && this.snapshot && !this.dirtyAll && !scr.visibleAreas().some(a => a.dirty)) {
        r.buf.set(this.snapshot);
      } else {
        if (this.dirtyAll) {
          scr.drawEdges(r);
          scr.visibleAreas().forEach(a => { a.dirty = true; });
        }
        scr.visibleAreas().forEach(a => { if (a.dirty) this.drawArea(a); });
        this.dirtyAll = false;
        if (this.overlays.length) this.snapshot = r.buf.slice();
      }
      r.resetClip();
      if (this.edgeDrag && this.edgeDrag.line) {
        const l = this.edgeDrag.line;
        r.line(l[0], l[1], l[2], l[3], rgb(255, 255, 255), 0xF0F0);
      }
      this.overlays.forEach(o => { r.resetClip(); o.draw(r); });
      if (this.tip) B.UI.drawTip(r, this.tip.x, this.tip.y, this.tip.str);
      r.resetClip();
      r.present(this.ctx2d);
      this.overlayDirty = false;
    }

    drawArea(a) {
      const r = this.raster;
      a.dirty = false;
      const S = B.SPACES[a.type];
      const active = this.curarea === a;
      r.resetClip();
      const f = a.fr;
      r.pushClip(f.x1, f.y1, f.x2, f.y2);
      if (a.win.y2 >= a.win.y1) {
        r.pushClip(a.win.x1, a.win.y1, a.win.x2, a.win.y2);
        if (S && S.draw) {
          try { S.draw(this, a, r); } catch (err) { console.error(err); r.rect(a.win.x1, a.win.y1, a.win.x2 + 1, a.win.y2 + 1, rgb(120, 60, 60)); }
        } else r.rect(a.win.x1, a.win.y1, a.win.x2 + 1, a.win.y2 + 1, rgb(144, 144, 144));
        r.popClip();
      }
      r.frame(f.x1, f.y1, f.x2, f.y2, rgb(0, 0, 0));
      if (a.hdr) {
        r.pushClip(a.hdr.x1, a.hdr.y1, a.hdr.x2, a.hdr.y2);
        B.ScreenDraw.drawHeaderBack(r, a, active);
        r.frame(f.x1, f.y1, f.x2, f.y2, rgb(0, 0, 0));
        const blk = B.ScreenDraw.headerBlock(r, a, active);
        if (a.headerPrint) {
          r.text('helv12', a.headerPrint, a.hdr.x1 + 30, a.hdr.y1 + 7, rgb(0, 0, 0));
          a.hdrBlock = null;
          r.popClip();
          r.popClip();
          return;
        }
        if (S && S.header) {
          try { S.header(this, a, blk); } catch (err) { console.error(err); }
        } else B.ScreenDraw.stdHeaderButtons(blk, a, this);
        blk.draw();
        if (blk.postDraw) blk.postDraw();
        a.hdrBlock = blk;
        r.popClip();
      }
      r.popClip();
    }

    openOverlay(ov) {
      if (this.edit) B.UI.finishEdit(true);
      this.overlays.push(ov);
      this.snapshot = null;
      this.dirtyAll = true;
      this.screen.areas.forEach(a => a.redraw());
      this.tip = null;
      this.schedule();
    }

    closeOverlay(ov) {
      const i = this.overlays.indexOf(ov);
      if (i >= 0) this.overlays.splice(i, 1);
      if (!this.overlays.length) this.snapshot = null;
      this.redrawAll();
    }

    redrawOverlay() { this.overlayDirty = true; this.schedule(); }

    setSpaceType(area, type) {
      if (!B.SPACES[type]) return;
      if (area.type === type) return;
      area.type = type;
      const S = B.SPACES[type];
      area.headertype = S.headerTop ? 'top' : (area.headertype === 'none' ? 'none' : 'bottom');
      if (S.headerTop && area.headertype !== 'top') area.headertype = 'top';
      area.layout();
      this.redrawAll();
    }

    toggleFull(area) {
      const s = this.screen;
      if (s.full) {
        const a = s.full;
        a.v1 = a.saved.v1; a.v2 = a.saved.v2; a.v3 = a.saved.v3; a.v4 = a.saved.v4;
        s.full = null;
      } else {
        area.saved = { v1: area.v1, v2: area.v2, v3: area.v3, v4: area.v4 };
        const top = s.areas.find(x => x.type === 'info' && x.v3.y >= s.h - 1 && x.v1.x === 0 && x.v3.x >= s.w - 1);
        const ytop = top && top !== area ? top.v1.y : s.h - 1;
        area.v1 = { x: 0, y: 0 }; area.v2 = { x: 0, y: ytop }; area.v3 = { x: s.w - 1, y: ytop }; area.v4 = { x: s.w - 1, y: 0 };
        s.full = area;
        if (top && top !== area) s.fullInfo = top;
      }
      this.redrawAll();
    }

    visibleAreasForEvents() {
      const s = this.screen;
      if (s.full) return s.fullInfo ? [s.full, s.fullInfo] : [s.full];
      return s.areas;
    }

    areaAt(x, y) {
      return this.visibleAreasForEvents().find(a => a.inFrame(x, y)) || null;
    }

    evPos(e) {
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.canvas.width / (rect.width || 1), sy = this.canvas.height / (rect.height || 1);
      const x = Math.floor((e.clientX - rect.left) * sx);
      const y = this.canvas.height - 1 - Math.floor((e.clientY - rect.top) * sy);
      return [x, y];
    }

    makeEv(type, e, extra) {
      const [x, y] = e.clientX != null ? this.evPos(e) : this.mouse;
      let button = e.button != null ? e.button : 0;
      if (this.prefs.twoMouse && e.altKey && button === 0 && (type === 'down' || type === 'up')) button = 1;
      return Object.assign({ type, x, y, button, shift: !!e.shiftKey, ctrl: !!(e.ctrlKey || e.metaKey), alt: !!e.altKey && !(this.prefs.twoMouse && button === 1), raw: e }, extra || {});
    }

    on(el, type, fn, opts) { el.addEventListener(type, fn, Object.assign({ signal: this.listeners.signal }, opts || {})); }

    bind() {
      const c = this.canvas;
      this.on(c, 'contextmenu', e => { e.preventDefault(); });
      this.on(c, 'pointerdown', e => {
        e.preventDefault();
        c.focus({ preventScroll: true });
        if (this.opts.onFocus) this.opts.onFocus();
        try { c.setPointerCapture(e.pointerId); } catch {}
        this.buttons = (this.buttons || 0) | (1 << e.button);
        const ev = this.makeEv('down', e);
        this.mouse = [ev.x, ev.y];
        this.dispatch(ev);
      });
      this.on(c, 'pointermove', e => {
        const ev = this.makeEv('move', e);
        this.mouse = [ev.x, ev.y];
        this.dispatch(ev);
      });
      this.on(c, 'pointerup', e => {
        this.buttons = (this.buttons || 0) & ~(1 << e.button);
        const ev = this.makeEv('up', e);
        this.mouse = [ev.x, ev.y];
        this.dispatch(ev);
      });
      this.on(c, 'dblclick', e => { const ev = this.makeEv('dbl', e); this.dispatch(ev); });
      this.on(c, 'wheel', e => {
        e.preventDefault();
        const ev = this.makeEv('wheel', e, { delta: Math.sign(e.deltaY) });
        this.mouse = [ev.x, ev.y];
        this.dispatch(ev);
      }, { passive: false });
      this.on(document, 'keydown', e => {
        if (!this.isActive()) return;
        if (e.target && e.target.closest && e.target.closest('input,textarea,select') && !this.root.contains(e.target)) return;
        const key = normKey(e);
        if (!key) return;
        if (['SHIFT', 'CONTROL', 'ALT', 'META'].includes(key)) return;
        e.preventDefault();
        e.stopPropagation();
        const ev = { type: 'key', key, char: e.key && e.key.length === 1 ? e.key : '', shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey, alt: e.altKey, repeat: e.repeat, x: this.mouse[0], y: this.mouse[1] };
        this.dispatch(ev);
      }, true);
      this.on(window, 'blur', () => { if (this.modal && this.modal.cancel) { this.modal.cancel(); this.modal = null; this.redrawAll(); } });
    }

    isActive() { return this.opts.isActive ? this.opts.isActive() : true; }

    setCurArea(a) {
      if (a && a.type === 'view3d') this.lastView3d = a;
      if (this.curarea !== a) {
        const old = this.curarea;
        this.curarea = a;
        if (old) old.redraw();
        if (a) a.redraw();
        this.schedule();
      }
    }

    dispatch(ev) {
      try { this.dispatchInner(ev); } catch (err) { console.error(err); }
    }

    dispatchInner(ev) {
      if (this.splash) {
        if (ev.type === 'key' || ev.type === 'down' || (ev.type === 'move' && Math.hypot(ev.x - this.splash.x, ev.y - this.splash.y) > 30)) this.closeSplash();
        if (ev.type !== 'move') return;
      }
      if (ev.type === 'move') this.updateTip(ev);
      if (this.overlays.length) {
        const ov = this.overlays[this.overlays.length - 1];
        if (ev.type === 'key' && ov.key) ov.key(ev);
        else if (ev.type === 'move' && ov.move) ov.move(ev);
        else if (ev.type === 'down' && ov.down) ov.down(ev);
        else if (ev.type === 'up' && ov.up) ov.up(ev);
        return;
      }
      if (this.modal) {
        const m = this.modal;
        let done = false;
        if (ev.type === 'key' && m.key) done = m.key(ev);
        else if (ev.type === 'move' && m.move) done = m.move(ev);
        else if (ev.type === 'down' && m.down) done = m.down(ev);
        else if (ev.type === 'up' && m.up) done = m.up(ev);
        else if (ev.type === 'wheel' && m.wheel) done = m.wheel(ev);
        if (done && this.modal === m) this.modal = null;
        return;
      }
      if (B.UI.edit) {
        if (ev.type === 'key') { B.UI.editKey(ev); return; }
        if (ev.type === 'down') {
          const e = B.UI.edit;
          if (e.but.inside(ev.x, ev.y)) return;
          B.UI.finishEdit(true);
        }
        if (ev.type === 'move' || ev.type === 'up') return;
      }
      if (this.edgeDrag) { this.edgeDragEvent(ev); return; }
      const area = this.areaAt(ev.x, ev.y);
      if (ev.type === 'move') {
        if (!this.buttons) this.setCurArea(area);
        if (area) {
          const S = B.SPACES[area.type];
          if (S && S.hover) S.hover(this, area, ev);
        }
        const edge = !area || (!area.inWin(ev.x, ev.y) && !area.inHdr(ev.x, ev.y)) ? this.screen.edgeAt(ev.x, ev.y) : null;
        this.canvas.style.cursor = edge ? (edge.dir === 'h' ? 'ns-resize' : 'ew-resize') : (area && area.inWin(ev.x, ev.y) && area.type === 'view3d' ? 'crosshair' : 'default');
        return;
      }
      if (ev.type === 'down') {
        this.setCurArea(area);
        if (!area || (!area.inWin(ev.x, ev.y) && !area.inHdr(ev.x, ev.y))) {
          const edge = this.screen.edgeAt(ev.x, ev.y);
          if (edge) { this.startEdgeDrag(edge, ev); return; }
          return;
        }
        if (area.inHdr(ev.x, ev.y)) {
          const but = area.hdrBlock && area.hdrBlock.find(ev.x, ev.y);
          if (but && ev.button === 0) { this.modal = B.UI.press(this, area.hdrBlock, but, ev); return; }
          if (ev.button === 2 || (ev.button === 0 && !but)) {
            if (ev.button === 2) { this.headerMenu(area); return; }
          }
          if (ev.button === 1) { this.headerScroll(area, ev); return; }
          return;
        }
        if (area.winBlock && ev.button === 0) {
          const but = area.winBlock.find(ev.x, ev.y);
          if (but) { this.modal = B.UI.press(this, area.winBlock, but, ev); return; }
        }
      }
      if (ev.type === 'key') {
        if (this.globalKey(ev, area)) return;
      }
      if (area && (ev.type !== 'key' || true)) {
        const S = B.SPACES[area.type];
        if (S && S.event) {
          const r = S.event(this, area, ev);
          if (r) return;
        }
      }
      if (ev.type === 'key') this.globalKeyLate(ev, area);
    }

    headerScroll(area, ev) {
      const sp = area.space;
      const start = ev.x, base = sp.hdrScroll || 0;
      this.modal = {
        move: e => { sp.hdrScroll = Math.max(0, Math.min(800, base - (e.x - start))); area.redraw(); this.schedule(); },
        up: () => true
      };
    }

    headerMenu(area) {
      B.UI.pupmenu(this, 'Header %t|Top%x2|Bottom %x1|No Header %x0').then(v => {
        if (v < 0 || v == null) return;
        area.headertype = v === 2 ? 'top' : v === 1 ? 'bottom' : 'none';
        this.redrawAll();
      });
    }

    startEdgeDrag(edge, ev) {
      if (ev.button === 0) {
        this.edgeDrag = { edge, mode: 'move', start: ev };
      } else {
        B.UI.pupmenu(this, edge.areas.length >= 2 ? 'Split Area|Join Areas|Add header' : 'Split Area|Join Areas').then(v => {
          if (v === 0) this.edgeDrag = { edge, mode: 'split' };
          else if (v === 1) this.edgeDrag = { edge, mode: 'join' };
          else if (v === 2) {
            edge.areas.forEach(a => { if (a.headertype === 'none') a.headertype = 'bottom'; });
            this.redrawAll();
          }
        });
      }
    }

    edgeDragEvent(ev) {
      const d = this.edgeDrag, s = this.screen;
      if (d.mode === 'move') {
        if (ev.type === 'move') s.moveEdge(d.edge, d.edge.dir === 'h' ? ev.y : ev.x), this.redrawAll();
        if (ev.type === 'up') { this.edgeDrag = null; this.redrawAll(); }
        return;
      }
      const area = this.areaAt(ev.x, ev.y);
      if (d.mode === 'split') {
        if (ev.type === 'move') {
          if (area && area.type !== 'info') {
            const f = area.fr;
            d.line = d.edge.dir === 'h' ? [ev.x, f.y1, ev.x, f.y2] : [f.x1, ev.y, f.x2, ev.y];
          } else d.line = null;
          this.redrawOverlay();
          this.dirtyAll = true;
          this.schedule();
        } else if (ev.type === 'down') {
          if (ev.button === 0 && area && area.type !== 'info') s.split(area, d.edge.dir === 'h' ? 'v' : 'h', d.edge.dir === 'h' ? ev.x : ev.y);
          this.edgeDrag = null;
          this.redrawAll();
        } else if (ev.type === 'key' && ev.key === 'ESC') { this.edgeDrag = null; this.redrawAll(); }
        return;
      }
      if (d.mode === 'join') {
        if (ev.type === 'down') {
          if (ev.button === 0 && area) {
            const other = d.edge.areas.find(a => a !== area && s.neighbours(area).includes(a));
            if (other && !s.join(other, area)) B.UI.error(this, "Can't join");
            else if (!other) B.UI.error(this, "Can't join");
          }
          this.edgeDrag = null;
          this.redrawAll();
        } else if (ev.type === 'key' && ev.key === 'ESC') { this.edgeDrag = null; this.redrawAll(); }
      }
    }

    updateTip(ev) {
      if (this.tipTimer) clearTimeout(this.tipTimer);
      if (this.tip) { this.tip = null; this.overlayDirty = true; this.dirtyAll = true; this.schedule(); }
      if (!this.prefs.tooltips || this.modal || this.overlays.length) return;
      const area = this.areaAt(ev.x, ev.y);
      if (!area) return;
      const blk = area.inHdr(ev.x, ev.y) ? area.hdrBlock : area.inWin(ev.x, ev.y) ? area.winBlock : null;
      const but = blk && blk.find(ev.x, ev.y);
      if (!but || !but.tip) return;
      this.tipTimer = setTimeout(() => {
        if (this.destroyed || this.modal || this.overlays.length) return;
        const [x1, y1] = but.rect();
        this.tip = { x: x1, y: y1, str: but.tip };
        this.dirtyAll = true;
        this.screen.areas.forEach(a => a.redraw());
        this.schedule();
      }, 700);
    }

    spaceOf(type) { return this.screen.areas.find(a => a.type === type) || null; }

    globalKey(ev, area) {
      const k = ev.key;
      if (ev.ctrl && (k === 'UPARROW' || k === 'DOWNARROW')) { if (area) this.toggleFull(area); return true; }
      if (ev.ctrl && (k === 'LEFTARROW' || k === 'RIGHTARROW')) { this.cycleScreen(k === 'RIGHTARROW' ? 1 : -1); return true; }
      if (ev.shift && /^F([1-9]|1[0-2])$/.test(k)) {
        const n = +k.slice(1);
        const map = { 4: 'file', 5: 'view3d', 6: 'ipo', 7: 'buts', 8: 'seq', 9: 'oops', 10: 'image', 11: 'text', 12: 'sound' };
        if (n === 1) { B.FileOps && B.FileOps.append(this); return true; }
        if (n === 2) { B.FileOps && B.FileOps.saveDXF(this); return true; }
        if (n === 4 && area) { this.setSpaceType(area, 'file'); area.space.mode = 'data'; area.space.dataPath = []; this.redrawAll(); return true; }
        if (map[n] && area) { this.setSpaceType(area, map[n]); return true; }
      }
      if (!ev.shift && !ev.ctrl && !ev.alt && /^F([1-9]|1[0-2])$/.test(k)) {
        const n = +k.slice(1);
        if (n === 1) { B.FileOps && B.FileOps.open(this); return true; }
        if (n === 2) { B.FileOps && B.FileOps.saveAs(this); return true; }
        if (n === 3) { B.FileOps && B.FileOps.saveImage(this); return true; }
        const ctxMap = { 4: 'lamp', 5: 'material', 6: 'texture', 7: 'anim', 8: 'game', 9: 'edit', 10: 'display' };
        if (ctxMap[n]) { this.setButsContext(ctxMap[n]); return true; }
        if (n === 11) { B.Render && B.Render.toggleWindow(this); return true; }
        if (n === 12) { B.Render && B.Render.render(this); return true; }
      }
      if (ev.ctrl && k === 'F2') { B.FileOps && B.FileOps.saveVRML(this); return true; }
      if (ev.ctrl && k === 'W') { B.FileOps && B.FileOps.save(this); return true; }
      if (ev.ctrl && k === 'O') { B.FileOps && B.FileOps.reopen(this); return true; }
      if (ev.ctrl && k === 'X' && !(area && area.type === 'text')) { B.FileOps && B.FileOps.eraseAll(this); return true; }
      if (ev.ctrl && k === 'U' && !(area && area.type === 'text')) { B.FileOps && B.FileOps.saveUserDefaults(this); return true; }
      if (ev.alt && k === 'W' && !(area && area.type === 'text')) { B.FileOps && B.FileOps.saveVideoscape(this); return true; }
      return false;
    }

    globalKeyLate(ev, area) {
      const k = ev.key;
      if (k === 'Q' && !ev.ctrl && !ev.alt && !(area && area.type === 'text')) { this.quit(); return true; }
      if (B.Anim && (k === 'LEFTARROW' || k === 'RIGHTARROW' || k === 'UPARROW' || k === 'DOWNARROW') && !ev.ctrl) {
        const sce = this.scene;
        if (ev.shift) sce.cfra = k === 'LEFTARROW' || k === 'DOWNARROW' ? sce.r.sfra : sce.r.efra;
        else sce.cfra = Math.max(1, sce.cfra + (k === 'LEFTARROW' ? -1 : k === 'RIGHTARROW' ? 1 : k === 'UPARROW' ? 10 : -10));
        B.Anim.frameChanged(this);
        return true;
      }
      return false;
    }

    setButsContext(name) {
      const areas = this.screen.areas.filter(a => a.type === 'buts');
      areas.forEach(a => { a.space.context = name; a.space.home = true; });
      this.redrawAll();
    }

    cycleScreen(d) {
      const list = this.main.screensUI;
      if (list.length < 2) return;
      let i = list.indexOf(this.screen);
      i = (i + d + list.length) % list.length;
      this.setScreen(list[i]);
    }

    setScreen(s) {
      this.screen = s;
      this.main.curScreenIndex = this.main.screensUI.indexOf(s);
      s.resize(this.raster.w, this.raster.h);
      this.redrawAll();
    }

    quit() {
      B.UI.okee(this, 'QUIT BLENDER').then(ok => { if (ok && this.opts.onQuit) this.opts.onQuit(); });
    }

    exitEditMode(save = true) {
      if (this.G.obedit && B.Edit) B.Edit.exit(this, save);
      this.G.obedit = null;
    }

    showSplash() {
      this.splash = { x: this.mouse[0], y: this.mouse[1], shown: false };
      const ov = {
        draw: r => {
          if (!this.splashImg) return;
          const im = this.splashImg;
          const a = this.screen.areas.find(x => x.type === 'view3d') || this.screen.areas[0];
          const cx = a ? (a.win.x1 + a.win.x2) / 2 : r.w / 2, cy = a ? (a.win.y1 + a.win.y2) / 2 : r.h / 2;
          const x = Math.round(cx - im.w / 2), y = Math.round(cy - im.h / 2);
          r.blit(im, x, y, 1);
          r.frame(x - 1, y - 1, x + im.w, y + im.h, rgb(0, 0, 0));
        }
      };
      this.splashOverlay = ov;
      this.overlays.push(ov);
      this.redrawAll();
    }

    closeSplash() {
      this.splash = null;
      if (this.splashOverlay) this.closeOverlay(this.splashOverlay);
      this.splashOverlay = null;
    }

    stats() {
      const sce = this.scene;
      let ve = 0, fa = 0, ob = 0, obsel = 0, la = 0;
      const ed = this.G.editMesh;
      if (ed) {
        const vs = ed.verts.filter(v => !v.hide);
        const fs = ed.faces.filter(f => f.v.length > 2);
        return `Ve:${vs.filter(v => v.sel).length}-${vs.length} Fa:${fs.filter(f => f.v.every(i => ed.verts[i].sel)).length}-${fs.length}  Mem:${(1.1 + (ve + fa) * 0.0001).toFixed(2)}M  `;
      }
      sce.bases.forEach(b => {
        if (!(b.object.lay & sce.lay)) return;
        const o = b.object;
        ob++;
        if (b.sel) obsel++;
        if (o.type === 'lamp') la++;
        if (o.type === 'mesh') { ve += o.data.verts.length; fa += o.data.faces.filter(f => f.v.length > 2).length; }
        if (o.type === 'mball' && o.data.disp) { ve += o.data.disp.verts.length; fa += o.data.disp.faces.length; }
        if ((o.type === 'curve' || o.type === 'surf' || o.type === 'font') && o.data.disp) { ve += o.data.disp.verts.length; fa += o.data.disp.faces.length; }
      });
      const mem = 1.12 + (ve * 32 + fa * 24) / (1024 * 1024);
      return `Ve:${ve} Fa:${fa}  Ob:${ob}-${obsel} La:${la}  Mem:${mem.toFixed(2)}M   `;
    }

    destroy() {
      this.destroyed = true;
      if (this.modal && this.modal.cancel) this.modal.cancel();
      this.listeners.abort();
      if (this.resizeObs) this.resizeObs.disconnect();
      if (this.tipTimer) clearTimeout(this.tipTimer);
      if (this.G.playing) this.G.playing.stop();
      if (B.Render && B.Render.closeWindow) B.Render.closeWindow(this);
      if (B.Game && B.Game.stop) B.Game.stop(this);
    }
  }

  function defaultScreen(w, h, scene) {
    const s = new B.Screen('screen.001', w, h);
    s.scene = scene;
    const infoY = h - 1 - (B.HEADERY + 1);
    const butsY = Math.round(h * 0.255);
    s.addArea(0, infoY, w - 1, h - 1, 'info');
    s.addArea(0, butsY, w - 1, infoY, 'view3d');
    s.addArea(0, 0, w - 1, butsY, 'buts');
    s.areas[0].headertype = 'top';
    s.areas[1].headertype = 'bottom';
    s.areas[2].headertype = 'top';
    return s;
  }

  B.normKey = normKey;
  B.App = App;
  B.defaultScreen = defaultScreen;
})(globalThis.B204 = globalThis.B204 || {});
