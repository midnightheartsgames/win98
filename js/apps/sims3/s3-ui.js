(function (S) {
  'use strict';
  const { esc, iconSVG, OBJECTS } = S;
  const SET_KEY = 'sims3_2000_settings';
  const DEFAULTS = { voices: 0.8, sfx: 0.8, music: 0.55, ambient: 0.6, muteVoices: false, muteSfx: false, muteMusic: false, muteAmbient: false, shadows: true, treeFade: true, hoverTips: true, edgeScroll: false, invertRot: false, autonomy: 'full', aging: true, lifespan: 'normal', story: true, wishes: true, tips: true, musicModes: { menu: true, live: true, buy: true, build: true, map: true, cas: true } };

  function loadSettings() { const base = JSON.parse(JSON.stringify(DEFAULTS)); try { return Object.assign(base, JSON.parse(localStorage.getItem(SET_KEY) || '{}')); } catch (e) { return base; } }
  function saveSettings(s) { try { localStorage.setItem(SET_KEY, JSON.stringify(s)); } catch (e) { } }

  class UI {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      root.classList.add('s3');
      root.tabIndex = 0;
      root.innerHTML = '<canvas class="s3-gl"></canvas><canvas class="s3-ov"></canvas><div class="s3-layer s3-mid"></div><div class="s3-layer s3-hud"></div><div class="s3-layer s3-top"></div>';
      this.cv = root.querySelector('.s3-gl');
      this.ovc = root.querySelector('.s3-ov');
      this.mid = root.querySelector('.s3-mid');
      this.hudEl = root.querySelector('.s3-hud');
      this.top = root.querySelector('.s3-top');
      this.settings = loadSettings();
      this.audio = S.Audio ? new S.Audio(this.settings) : null;
      this.listeners = [];
      this.mode = 'boot';
      this.sub = 'live';
      this.destroyed = false;
      this.hoverSim = 0;
      this.viewLv = 0;
      this.mouse ={ x: 0, y: 0, down: false, btn: 0, sx: 0, sy: 0, drag: false };
      this.keys = {};
      this.last = performance.now();
      this.hudT = 0;
      this.dlgs = [];
      this.game = null;
      this.r = null;
      this.overlay = new S.Overlay(this.ovc);
      this.bind();
      this.showLoading();
      this.frame = this.frame.bind(this);
      this.raf = requestAnimationFrame(this.frame);
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      for (const [el, ev, fn, o] of this.listeners) el.removeEventListener(ev, fn, o);
      if (this.audio) this.audio.close();
      if (this.ro) this.ro.disconnect();
      this.root.innerHTML = '';
    }
    on(el, ev, fn, o) { el.addEventListener(ev, fn, o); this.listeners.push([el, ev, fn, o]); }
    isActive() { return !this.opts.isActive || this.opts.isActive(); }
    saveSettings() { saveSettings(this.settings); if (this.audio) this.audio.setVolumes(this.settings); }

    initGame(game) {
      this.game = game;
      if (!this.r) this.r = new S.Renderer(this.cv, game);
      else { this.r.game = game; this.r.world = game.world; this.r.chunks.clear(); this.r.objChunks.clear(); this.r.bigObjs.clear(); this.r.lotWalls.clear(); this.r.roofs.clear(); this.r.water = null; this.r.floorVer = -1; this.r.wallKey = ''; this.r.objKey = ''; this.r.lightKey = ''; }
      if (!this.stage) this.stage = new S.Stage(this.r.atlas, 96, 96);
      game.opts.autonomy = this.settings.autonomy;
      game.opts.aging = this.settings.aging;
      game.opts.lifespan = this.settings.lifespan;
      game.opts.story = this.settings.story;
      game.opts.wishes = this.settings.wishes;
      game.opts.tips = this.settings.tips;
      this.r.noShadows = !this.settings.shadows;
      this.lastBalloon = new Map();
      game.hooks.notify = n => this.addNote(n);
      game.hooks.tip = (text) => this.hint(text);
      game.hooks.sound = (name, sim) => this.sound(name, sim);
      game.hooks.dialog = (kind, data) => this.gameDialog(kind, data);
    }

    sound(name, sim) {
      if (!this.audio || !this.r) return;
      let vol = 1;
      if (sim && sim.x !== undefined) {
        const p = this.r.cam.toScreen(sim.x, sim.y, 1);
        const cx = this.r.cam.w / 2, cy = this.r.cam.h / 2;
        const d = Math.hypot(p[0] - cx, p[1] - cy) / Math.max(this.r.cam.w, this.r.cam.h);
        vol = Math.max(0, 1 - d * 1.1) * (this.r.cam.zoom <= 1 ? 1 : this.r.cam.zoom === 2 ? 0.6 : 0.3);
        if (!this.game.isActive(sim) && vol < 0.15) return;
      }
      this.audio.sfx(name, vol);
    }

    bind() {
      const cv = this.cv;
      const pos = e => { const r = this.root.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      this.on(this.root, 'contextmenu', e => e.preventDefault());
      this.on(cv, 'mousemove', () => { this.mouse.in = true; });
      this.on(cv, 'mouseleave', () => { this.mouse.in = false; this.hideTip('obj'); });
      this.on(cv, 'mousedown', e => {
        this.root.focus({ preventScroll: true });
        if (this.audio) this.audio.resume();
        const [x, y] = pos(e);
        this.mouse.down = true; this.mouse.btn = e.button; this.mouse.sx = x; this.mouse.sy = y; this.mouse.x = x; this.mouse.y = y; this.mouse.drag = false;
        this.mouse.camX = this.r ? this.r.cam.tx : 0; this.mouse.camY = this.r ? this.r.cam.ty : 0;
        if (this.mode === 'live' && this.buildDown && (this.sub === 'build' || this.sub === 'buy') && e.button === 0) this.buildDown(x, y, e);
      });
      this.on(window, 'mousemove', e => {
        const [x, y] = pos(e);
        this.mouse.x = x; this.mouse.y = y;
        if (this.mouse.down && this.r) {
          const dx = x - this.mouse.sx, dy = y - this.mouse.sy;
          if (Math.hypot(dx, dy) > 5) this.mouse.drag = true;
          const panBtn = this.mouse.btn === 2 || this.mouse.btn === 1 || (this.mouse.btn === 0 && !(this.mode === 'live' && (this.sub === 'build' || this.sub === 'buy') && this.buildTool));
          if (this.mouse.drag && panBtn && this.mode !== 'cas') {
            const cam = this.r.cam;
            const u2 = Math.max(0.05, cam.U[0] * cam.U[0] + cam.U[1] * cam.U[1]);
            const wx = (dx * cam.R[0] - dy * cam.U[0] / u2) / cam.s;
            const wy = (dx * cam.R[1] - dy * cam.U[1] / u2) / cam.s;
            cam.tx = this.clampX(this.mouse.camX - wx); cam.ty = this.clampY(this.mouse.camY - wy);
            this.follow = false;
          }
        }
        if (this.mode === 'live' && this.buildMove && (this.sub === 'build' || this.sub === 'buy')) this.buildMove(x, y, e);
      });
      this.on(window, 'mouseup', e => {
        if (!this.mouse.down) return;
        this.mouse.down = false;
        const [x, y] = pos(e);
        if (this.mode === 'live' && this.buildUp && (this.sub === 'build' || this.sub === 'buy') && e.button === 0) { this.buildUp(x, y, e); return; }
        if (!this.mouse.drag && e.target === cv) this.click(x, y, e.button, e);
      });
      this.on(cv, 'wheel', e => {
        e.preventDefault();
        if (!this.r || this.mode === 'cas') return;
        this.zoomBy(e.deltaY > 0 ? 1 : -1);
      }, { passive: false });
      this.on(this.root, 'keydown', e => this.key(e, true));
      this.on(this.root, 'keyup', e => this.key(e, false));
      if (typeof ResizeObserver !== 'undefined') { this.ro = new ResizeObserver(() => this.layout()); this.ro.observe(this.root); }
    }
    clampX(x) { return Math.max(0, Math.min(this.game ? this.game.world.W : 160, x)); }
    clampY(y) { return Math.max(0, Math.min(this.game ? this.game.world.H : 160, y)); }
    zoomBy(d) {
      const cam = this.r.cam;
      if (this.mode === 'live' && this.sub === 'live' && d > 0 && cam.zoom === 2) { this.setSub('map'); return; }
      const max = this.sub === 'map' || this.mode === 'movein' ? 3 : 2;
      const z = Math.max(0, Math.min(max, cam.zoom + d));
      if (this.mode === 'live' && this.sub === 'map' && z < 3) { this.setSub('live'); return; }
      if (this.mode === 'movein' && z === 3) this.lookLot = null;
      cam.setZoom(z);
    }
    layout() {
      const w = this.root.clientWidth, h = this.root.clientHeight;
      const k = Math.min(1, w / 920, h / 560);
      this.root.style.setProperty('--k', k.toFixed(3));
      this.uiScale = k;
      if (this.hudInner) this.hudInner.style.transform = k < 1 ? 'scale(' + k + ')' : '';
    }

    key(e, down) {
      if (!this.isActive()) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      this.keys[e.code] = down;
      if (!down) return;
      if (e.code === 'Escape') {
        if (this.pie) { this.closePie(); e.preventDefault(); return; }
        if (this.dlgs.length && this.dlgs[this.dlgs.length - 1].esc !== false) { this.dlgs[this.dlgs.length - 1].close(); e.preventDefault(); return; }
        if (this.dlgs.length) return;
        if (this.buildEscape && this.buildEscape()) { e.preventDefault(); return; }
        if (this.mode === 'live' && this.sub !== 'live') { this.setSub('live'); e.preventDefault(); return; }
        if (this.mode === 'live') { this.gameMenu(); e.preventDefault(); }
        return;
      }
      if (e.code === 'F7' && this.mode === 'live' && this.debugDialog) {
        e.preventDefault();
        if (this.dbgDlg) this.dbgDlg.close(); else if (!this.dlgs.length) this.debugDialog();
        return;
      }
      if (this.mode !== 'live' || this.dlgs.length) return;
      const g = this.game;
      const k = e.code;
      if (k === 'Space' || k === 'KeyP' || k === 'Digit0' || k === 'Numpad0') { this.setSpeed(g.speed === 0 ? (this.prevSpeed || 1) : 0); e.preventDefault(); }
      else if (k === 'Digit1' || k === 'Numpad1') this.setSpeed(1);
      else if (k === 'Digit2' || k === 'Numpad2') this.setSpeed(2);
      else if (k === 'Digit3' || k === 'Numpad3') this.setSpeed(3);
      else if (k === 'F1') { this.setSub('live'); e.preventDefault(); }
      else if (k === 'F2') { this.setSub('buy'); e.preventDefault(); }
      else if (k === 'F3') { this.setSub('build'); e.preventDefault(); }
      else if (k === 'KeyM') this.setSub(this.sub === 'map' ? 'live' : 'map');
      else if (k === 'Tab') { this.nextSim(); e.preventDefault(); }
      else if (k === 'Home' || k === 'KeyH') this.centerOnSim();
      else if (k === 'Comma' || k === 'KeyQ') this.rotate(-1);
      else if (k === 'Period' || k === 'KeyE') this.rotate(1);
      else if (k === 'Equal' || k === 'NumpadAdd' || k === 'KeyZ') this.zoomBy(-1);
      else if (k === 'Minus' || k === 'NumpadSubtract' || k === 'KeyX') this.zoomBy(1);
      else if (k === 'PageUp') { this.stepLv(1); e.preventDefault(); }
      else if (k === 'PageDown') { this.stepLv(-1); e.preventDefault(); }
      else if (k === 'KeyV') this.setWallMode({ up: 'cut', cut: 'down', down: 'up' }[this.r.wallMode] || 'cut');
      else if (k === 'F5') { this.quickSave(); e.preventDefault(); }
      if (this.buildKey) this.buildKey(e);
    }

    setSpeed(s) {
      if (!this.game) return;
      if (s === 0 && this.game.speed) this.prevSpeed = this.game.speed;
      this.game.speed = s;
      if (this.audio) this.audio.ui('click');
      this.refreshClock && this.refreshClock();
    }
    rotate(d) {
      const cam = this.r.cam;
      cam.rot = ((cam.rot + (this.settings.invertRot ? -d : d)) % 4 + 4) % 4;
      if (this.audio) this.audio.ui('whoosh');
    }
    setWallMode(m) { this.r.wallMode = m; this.refreshHud && this.refreshHud(true); }
    lotTop(lotId) {
      const g = this.game, lot = g && g.lots[lotId];
      if (!lot) return 0;
      const w = g.world;
      const key = lotId + ':' + w.version + ':' + w.wallVersion;
      if (this.topKey === key) return this.topLv;
      let top = 0;
      for (let lv = w.L - 1; lv > 0 && !top; lv--) {
        for (let y = lot.y; y < lot.y + lot.h && !top; y++) for (let x = lot.x; x < lot.x + lot.w; x++) if (w.floor[w.li(x, y, lv)]) { top = lv; break; }
      }
      for (const wl of w.walls) if (wl && wl.lot === lotId && !wl.fence && (wl.lv || 0) > top) top = wl.lv;
      this.topKey = key; this.topLv = top;
      return top;
    }
    maxViewLv() {
      if (!this.game || !this.r) return 0;
      const lot = this.focusLot();
      if (lot < 0 || !this.game.lots[lot]) return 0;
      const top = this.lotTop(lot);
      return Math.min(this.game.world.L - 1, this.sub === 'build' ? top + 1 : top);
    }
    curViewLv() { return Math.max(0, Math.min(this.viewLv || 0, this.maxViewLv())); }
    setViewLv(lv, quiet) {
      const max = this.maxViewLv();
      const to = Math.max(0, Math.min(max, lv));
      const from = this.curViewLv();
      this.viewLv = to;
      if (to === from) return false;
      if (this.bm) { this.bm.drag = null; this.bm.hover = null; }
      if (!quiet) { this.hint('Этаж ' + (to + 1)); if (this.audio) this.audio.ui('click'); }
      if (this.bm && (this.sub === 'build' || this.sub === 'buy') && this.bm.mx !== undefined) { this.r.viewLv = to; this.buildMove(this.bm.mx, this.bm.my); }
      if (this.updateToolbar) this.updateToolbar();
      this.refreshHud && this.refreshHud(true);
      return true;
    }
    stepLv(d) {
      const cur = this.curViewLv(), max = this.maxViewLv();
      if (cur + d > max || cur + d < 0) {
        if (this.audio) this.audio.ui('deny');
        this.hint(d > 0 ? (this.sub === 'build' ? 'Выше строить нельзя.' : 'Выше этажей нет. Новый этаж строят в режиме строительства.') : 'Ниже этажей нет.');
        return;
      }
      const sel = this.game.selected();
      this.followLv = sel ? this.simLv(sel) : null;
      this.setViewLv(cur + d);
    }
    simLv(sim) { return sim.ride ? sim.ride[2] || 0 : sim.lv || 0; }
    centerOnSim(sim) {
      sim = sim || this.game.selected();
      if (!sim) return;
      if (sim.inside) { const l = this.game.lots[sim.inside]; if (l) { this.r.cam.tx = l.entrance[0]; this.r.cam.ty = l.entrance[1]; } return; }
      this.r.cam.tx = sim.x; this.r.cam.ty = sim.y;
      this.follow = true;
      this.viewLv = this.simLv(sim);
      this.followLv = this.viewLv;
    }
    nextSim() {
      const hh = this.game.active();
      if (!hh) return;
      const ms = this.game.members(hh).filter(s => !s.isBaby);
      if (!ms.length) return;
      const i = ms.findIndex(s => s.id === this.game.sel);
      this.selectSim(ms[(i + 1) % ms.length]);
    }
    selectSim(sim) {
      if (!sim || sim.isBaby) return;
      this.game.sel = sim.id;
      this.centerOnSim(sim);
      if (this.audio) this.audio.ui('select');
      this.refreshHud && this.refreshHud(true);
    }

    focusLot() {
      if (!this.game || !this.r) return -1;
      const hh = this.game.active();
      const cam = this.r.cam;
      const lot = this.game.world.lotAt(Math.floor(cam.tx), Math.floor(cam.ty));
      if (this.sub === 'build' || this.sub === 'buy') return hh ? hh.lot : lot;
      return lot;
    }

    frame(now) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(this.frame);
      const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
      this.last = now;
      const w = this.root.clientWidth, h = this.root.clientHeight;
      if (!w || !h) return;
      if (this.mode === 'boot') { this.bootTick && this.bootTick(dt); return; }
      if (!this.r) return;
      this.r.resize(w, h);
      this.overlay.resize(w, h);
      if (this.mode === 'live' || this.mode === 'menu' || this.mode === 'movein') {
        const g = this.game;
        if (this.mode === 'live' && this.skip) this.skipTick();
        else if (this.mode === 'live' && !this.dlgs.some(d => d.pause)) g.update(dt);
        if (this.mode === 'menu') { g.speed = 1; g.update(dt); this.menuCam(dt); }
        if (this.mode === 'live' || this.mode === 'movein') this.cameraKeys(dt);
        const sel = g.selected();
        if (this.follow && sel && this.mode === 'live' && !sel.inside) {
          this.r.cam.tx += (sel.x - this.r.cam.tx) * Math.min(1, dt * 3); this.r.cam.ty += (sel.y - this.r.cam.ty) * Math.min(1, dt * 3);
          const lv = this.simLv(sel);
          if (this.sub === 'live' && lv !== this.followLv) { this.followLv = lv; this.viewLv = lv; this.refreshHud && this.refreshHud(true); }
        }
        const fade = sel && this.mode === 'live' && !sel.hidden && this.settings.treeFade ? [[sel.x, sel.y]] : null;
        const focus = this.mode === 'live' ? this.focusLot() : this.mode === 'movein' && this.lookLot ? this.lookLot.id : -1;
        const heads = this.r.frame(dt, { focusLot: focus, fadeNear: fade, plumbob: this.mode === 'live' && this.sub !== 'map', viewLv: this.mode === 'live' ? this.curViewLv() : 0 });
        if (this.r.flashes !== this.seenFlashes) { if (this.seenFlashes !== undefined && this.mode === 'live' && this.audio) this.audio.sfx('thunder', [1, 0.8, 0.6, 0.45][this.r.cam.zoom] || 0.5); this.seenFlashes = this.r.flashes; }
        if (this.mode === 'live' && this.sub !== 'map') this.overlay.draw(this, heads, dt);
        else this.overlay.clear();
        this.heads = heads;
        if (this.mode === 'live') {
          this.hudT += dt;
          if (this.hudT > 0.2) { this.hudT = 0; this.refreshHud && this.refreshHud(false); }
          if (this.sub === 'map' || this.mode === 'movein') this.updatePins && this.updatePins();
          this.hoverPick();
          this.liveTick(dt);
          if (this.audio) this.audio.ambient(this.game, this.r.cam, this.sub);
        }
        if (this.mode === 'movein') this.updatePins && this.updatePins();
      }
      if (this.mode === 'cas' && this.casFrame) this.casFrame(dt);
    }

    cameraKeys(dt) {
      const cam = this.r.cam;
      let dx = 0, dy = 0;
      if (this.keys.ArrowLeft || this.keys.KeyA) dx -= 1;
      if (this.keys.ArrowRight || this.keys.KeyD) dx += 1;
      if (this.keys.ArrowUp || this.keys.KeyW) dy -= 1;
      if (this.keys.ArrowDown || this.keys.KeyS) dy += 1;
      if (this.settings.edgeScroll && !this.mouse.down) {
        const m = 6;
        if (this.mouse.x < m) dx -= 1; if (this.mouse.x > cam.w - m) dx += 1;
        if (this.mouse.y < m) dy -= 1; if (this.mouse.y > cam.h - m) dy += 1;
      }
      if (!dx && !dy) return;
      this.follow = false;
      const sp = 600 / cam.s * dt;
      const U = [cam.U[0], cam.U[1]], ul = Math.hypot(U[0], U[1]) || 1;
      cam.tx = this.clampX(cam.tx + (cam.R[0] * dx - U[0] / ul * dy) * sp);
      cam.ty = this.clampY(cam.ty + (cam.R[1] * dx - U[1] / ul * dy) * sp);
    }

    hoverPick() {
      if (this.sub !== 'live') { this.hoverSim = 0; return; }
      if (!this.mouse.in || this.mouse.down || this.pie) { this.hoverSim = 0; this.hideTip('obj'); return; }
      this.hoverN = (this.hoverN || 0) + 1;
      if (this.hoverN % 4) return;
      const p = this.r.pick(this.mouse.x, this.mouse.y, { trees: false });
      this.hoverSim = p.hit && p.hit.kind === 'sim' ? p.hit.sim.id : 0;
      const ob = p.hit && p.hit.kind === 'obj' ? p.hit.ob : null;
      if (ob && !OBJECTS[ob.t].tree && this.settings.hoverTips) this.showTip(this.objTip(ob), this.mouse.x + 16, this.mouse.y + 16, 'obj');
      else this.hideTip('obj');
      this.cv.style.cursor = p.hit ? 'pointer' : 'default';
    }
    objTip(ob) {
      const d = OBJECTS[ob.t];
      let html = '<b>' + esc(d.rabbit ? S.RH[d.rabbit].name : d.name) + '</b>';
      const lot = this.game.lots[ob.lot];
      if (d.rabbit && lot) html += '<div>' + esc(lot.address) + '</div>';
      if (ob.broken) html += '<div class="neg">Сломано</div>';
      if (ob.t === 'plant_garden' && ob.st) html += '<div>Рост: ' + Math.round((ob.st.growth || 0) * 100) + '%, вода: ' + Math.round(ob.st.water || 0) + '%</div>';
      if (ob.t === 'tombstone' && ob.st && ob.st.name) html += '<div>' + esc(ob.st.name) + '</div>';
      if (ob.t === 'collectible' && ob.st) html += '<div>' + esc(ob.st.c.startsWith('seed:') ? 'Семена' : (S.COLLECT[ob.st.c] || {}).name || '') + '</div>';
      if ((ob.t === 'platter' || ob.t === 'plate') && ob.st && S.RECIPES[ob.st.recipe]) html += '<div>' + esc(S.RECIPES[ob.st.recipe].name) + (ob.st.servings ? ', порций: ' + ob.st.servings : '') + '</div>';
      return html;
    }

    click(x, y, btn, e) {
      if (this.mode === 'movein' && this.closeMapCard) { this.closeMapCard(); return; }
      if (this.mode !== 'live' || !this.game) return;
      if (this.pie) { this.closePie(); return; }
      if (this.sub === 'map') { if (this.mapClick) this.mapClick(x, y, btn); return; }
      if (this.sub !== 'live') { if (btn === 2 && this.buildEscape) this.buildEscape(); return; }
      const g = this.game;
      const sim = g.selected();
      const p = this.r.pick(x, y, { trees: false });
      if (!sim || sim.dead) return;
      if (btn === 2) { const q = sim.queue[0]; if (q) g.cancelAction(sim, q); return; }
      let target = null, title = '';
      if (p.hit && p.hit.kind === 'sim') {
        const o = p.hit.sim;
        target = { kind: 'sim', sim: o };
        title = o.first + ' ' + o.last;
        if (o !== sim && o.hh === g.activeHH && !o.isBaby && !o.inside) {
          const entries = g.menuFor(sim, target);
          entries.unshift({ label: 'Выбрать: ' + o.first, special: () => this.selectSim(o) });
          this.showPie(x, y, entries, title, sim);
          return;
        }
      } else if (p.hit && p.hit.kind === 'obj') {
        const ob = p.hit.ob;
        target = { kind: 'obj', ob };
        const d = OBJECTS[ob.t];
        title = d.rabbit ? S.RH[d.rabbit].name : d.name;
      } else {
        const t = p.tile;
        if (!g.world.inb(t[0], t[1])) return;
        target = { kind: 'tile', tile: t };
      }
      const entries = g.menuFor(sim, target);
      if (target.kind === 'tile' && entries.length === 1 && !entries[0].disabled && !entries[0].sub) { this.doEntry(sim, entries[0]); this.fxClick(x, y); return; }
      if (!entries.length) { if (this.audio) this.audio.ui('deny'); return; }
      this.showPie(x, y, entries, title, sim);
    }
    fxClick(x, y) {
      const d = document.createElement('div');
      d.style.cssText = 'position:absolute;left:' + (x - 10) + 'px;top:' + (y - 6) + 'px;width:20px;height:12px;border:2px solid #7cff6a;border-radius:50%;pointer-events:none;transition:all .5s;';
      this.mid.appendChild(d);
      requestAnimationFrame(() => { d.style.transform = 'scale(2)'; d.style.opacity = '0'; });
      setTimeout(() => d.remove(), 600);
    }
    doEntry(sim, en) {
      if (en.special) { en.special(); return; }
      const a = this.game.queue(sim, en.key, en.target, Object.assign({ user: true }, en.opt || {}));
      if (a && this.audio) this.audio.ui('queue');
      if (!a && this.audio) this.audio.ui('deny');
      this.refreshHud && this.refreshHud(true);
    }

    showPie(x, y, entries, title, sim) {
      this.closePie();
      const el = document.createElement('div');
      el.className = 's3-pie';
      const W = this.root.clientWidth, H = this.root.clientHeight;
      el.style.left = Math.max(120, Math.min(W - 120, x)) + 'px';
      el.style.top = Math.max(110, Math.min(H - 110, y)) + 'px';
      this.mid.appendChild(el);
      this.pie = el;
      const stack = [];
      const render = (list, head) => {
        el.innerHTML = '';
        const ctr = document.createElement('div');
        ctr.className = 'ctr';
        if (sim && this.stage) ctr.innerHTML = '<img src="' + this.stage.portrait(sim, 64) + '">';
        el.appendChild(ctr);
        if (head) { const t = document.createElement('div'); t.className = 'title'; t.textContent = head; el.appendChild(t); }
        const items = list.slice();
        if (stack.length) items.push({ label: '‹ Назад', back: true });
        const n = items.length;
        const R = 62 + Math.min(70, n * 7);
        items.forEach((en, i) => {
          const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
          const o = document.createElement('div');
          o.className = 'opt' + (en.disabled ? ' dis' : '') + (en.sub && en.sub.length ? ' sub' : '');
          o.textContent = en.label;
          o.style.left = Math.cos(a) * R * 1.35 + 'px';
          o.style.top = Math.sin(a) * R + 'px';
          o.addEventListener('mousedown', ev => ev.stopPropagation());
          o.addEventListener('click', ev => {
            ev.stopPropagation();
            if (en.back) { const prev = stack.pop(); render(prev.list, prev.head); return; }
            if (en.disabled) { if (this.audio) this.audio.ui('deny'); this.hint(en.disabled); return; }
            if (en.sub && en.sub.length) { stack.push({ list, head }); render(en.sub, en.label.replace(/\.\.\.$/, '')); if (this.audio) this.audio.ui('click'); return; }
            this.closePie();
            this.doEntry(sim, en);
          });
          if (en.disabled) o.title = en.disabled;
          el.appendChild(o);
        });
      };
      render(entries, title);
      if (this.audio) this.audio.ui('pie');
    }
    closePie() { if (this.pie) { this.pie.remove(); this.pie = null; } }

    showTip(html, x, y, owner) {
      if (!this.tipEl) { this.tipEl = document.createElement('div'); this.tipEl.className = 's3-tip s3-panel'; this.top.appendChild(this.tipEl); }
      this.tipOwner = owner || 'x';
      this.tipEl.innerHTML = html;
      this.tipEl.style.display = 'block';
      const W = this.root.clientWidth, H = this.root.clientHeight;
      const r = this.tipEl.getBoundingClientRect();
      this.tipEl.style.left = Math.max(4, Math.min(W - r.width - 4, x)) + 'px';
      this.tipEl.style.top = Math.max(4, Math.min(H - r.height - 4, y)) + 'px';
    }
    hideTip(owner) { if (this.tipEl && (!owner || this.tipOwner === owner)) this.tipEl.style.display = 'none'; }
    tipOn(el, fn) {
      el.addEventListener('mouseenter', e => { const r = this.root.getBoundingClientRect(); const html = typeof fn === 'function' ? fn() : fn; if (html) this.showTip(html, e.clientX - r.left + 14, e.clientY - r.top - 10, 'el'); });
      el.addEventListener('mousemove', e => { if (!this.tipEl || this.tipEl.style.display === 'none') return; const r = this.root.getBoundingClientRect(); const rr = this.tipEl.getBoundingClientRect(); this.tipEl.style.left = Math.min(this.root.clientWidth - rr.width - 4, e.clientX - r.left + 14) + 'px'; this.tipEl.style.top = Math.max(4, Math.min(this.root.clientHeight - rr.height - 4, e.clientY - r.top - rr.height - 8)) + 'px'; });
      el.addEventListener('mouseleave', () => this.hideTip('el'));
    }

    hint(text) {
      if (!text) return;
      if (!this.hintEl) { this.hintEl = document.createElement('div'); this.hintEl.className = 's3-hint s3-panel'; this.top.appendChild(this.hintEl); }
      this.hintEl.textContent = text;
      this.hintEl.style.display = 'block';
      clearTimeout(this.hintTimer);
      this.hintTimer = setTimeout(() => { if (this.hintEl) this.hintEl.style.display = 'none'; }, 3200);
    }

    addNote(n) {
      if (this.mode !== 'live' || !this.tnsEl) return;
      const el = document.createElement('div');
      el.className = 's3-note s3-panel';
      const sim = n.sim ? this.game.sims.get(n.sim) : null;
      const ic = sim && this.stage ? '<img src="' + this.stage.portrait(sim, 64) + '">' : iconSVG(n.icon, 26);
      el.innerHTML = '<div class="ic">' + ic + '</div><div><div class="tx">' + esc(n.text) + '</div><div class="acts"></div></div><div class="cl">✕</div>';
      const acts = el.querySelector('.acts');
      if (n.actions) for (const a of n.actions) {
        const b = document.createElement('button');
        b.className = 's3-pill';
        b.textContent = a.label;
        b.onclick = () => { try { a.fn(); } catch (e) { } el.remove(); if (this.audio) this.audio.ui('click'); };
        acts.appendChild(b);
      } else acts.remove();
      el.querySelector('.cl').onclick = () => el.remove();
      if (sim) el.querySelector('.ic').onclick = () => { if (sim.hh === this.game.activeHH) this.selectSim(sim); else this.centerOnSim(sim); };
      this.tnsEl.appendChild(el);
      while (this.tnsEl.children.length > 4) this.tnsEl.firstChild.remove();
      setTimeout(() => el.remove(), n.actions ? 60000 : n.minor ? 9000 : 16000);
      if (this.audio) this.audio.ui(n.kind === 'promo' || n.kind === 'ltw' || n.kind === 'wish' || n.kind === 'skill' ? n.kind : n.kind === 'death' ? 'death' : n.kind === 'fire' ? 'alarm' : 'note');
    }

    dialog(o) {
      const wrap = document.createElement('div');
      wrap.className = 's3-dlgwrap';
      if (o.clear) wrap.style.background = 'transparent';
      const d = document.createElement('div');
      d.className = 's3-dlg s3-panel' + (o.cls ? ' ' + o.cls : '');
      if (o.width) d.style.width = o.width + 'px';
      d.innerHTML = (o.title ? '<h3>' + esc(o.title) + '</h3>' : '') + '<div class="body"></div><div class="btns"></div>';
      const body = d.querySelector('.body');
      if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.appendChild(o.body);
      const btns = d.querySelector('.btns');
      const h = { el: d, body, pause: o.pause !== false, esc: o.esc, close: () => { wrap.remove(); this.dlgs = this.dlgs.filter(x => x !== h); if (o.onClose) o.onClose(); } };
      for (const b of o.buttons || []) {
        const el = document.createElement('button');
        el.className = 's3-pill big' + (b.cls ? ' ' + b.cls : '');
        el.textContent = b.label;
        if (b.disabled) el.disabled = true;
        el.onclick = () => { if (this.audio) this.audio.ui('click'); const r = b.fn ? b.fn(h) : null; if (r !== false) h.close(); };
        btns.appendChild(el);
      }
      if (!btns.children.length) btns.remove();
      if (o.x !== false) {
        const x = document.createElement('button');
        x.className = 's3-btn sm s3-x';
        x.innerHTML = iconSVG('ui_close', 14);
        x.onclick = () => h.close();
        d.appendChild(x);
      }
      wrap.appendChild(d);
      wrap.addEventListener('mousedown', e => { if (e.target === wrap && o.outside !== false) h.close(); });
      this.top.appendChild(wrap);
      this.dlgs.push(h);
      if (this.audio) this.audio.ui('open');
      return h;
    }
    confirm(title, text, fn, yes, no) {
      return this.dialog({ title, body: '<div style="text-align:center;max-width:360px;margin:0 auto;line-height:1.4">' + esc(text) + '</div>', buttons: [{ label: yes || 'Да', fn }, { label: no || 'Нет' }] });
    }
  }

  Object.assign(S, { UI, loadSettings, saveSettings, SETTINGS_DEFAULTS: DEFAULTS });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
