(function (W) {
  'use strict';
  const D = W.Data, G = W.Gfx;
  const SW = 320, SH = 200, TICMS = 1000 / D.TIC;
  const OPT_KEY = 'wolf3d98-options', SCORE_KEY = 'wolf3d98-scores', SAVE_KEY = n => 'wolf3d98-save-' + n;
  const store = {
    get(k) { try { return globalThis.localStorage ? localStorage.getItem(k) : null; } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } }
  };
  const C = {
    bg: G.rgb(136, 0, 0), win: G.rgb(88, 0, 0), hi: G.rgb(196, 0, 0), lo: G.rgb(40, 0, 0), text: G.rgb(168, 168, 168), sel: G.rgb(252, 252, 252),
    dis: G.rgb(124, 40, 40), title: G.rgb(252, 216, 72), black: G.rgb(0, 0, 0), white: G.rgb(255, 255, 255), teal: G.rgb(0, 64, 64), tealHi: G.rgb(0, 128, 128),
    yellow: G.rgb(252, 252, 84), shadow: G.rgb(32, 0, 0), grey: G.rgb(120, 120, 120)
  };
  const DEFAULT_SCORES = [
    ['BJ_Blazkowicz', 10000, 1, 4], ['Stalker_Fox', 8500, 1, 3], ['Krot_Tester', 7000, 1, 3], ['CyberDemon98', 5500, 1, 2],
    ['VoodooMaster', 4000, 1, 2], ['Дима', 2500, 1, 4], ['RadioActive', 1000, 1, 1]
  ].map(([name, score, ep, floor]) => ({ name, score, ep, floor }));
  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts;
      this.lang = opts.lang || ((globalThis.i18n && globalThis.i18n.getLanguage && globalThis.i18n.getLanguage()) === 'en' ? 'en' : 'ru');
      this.S = D.STR[this.lang];
      this.maps = opts.maps || W.Maps;
      root.classList.add('wl3d');
      root.tabIndex = 0;
      root.innerHTML = '<div class="wl3d-stage"><canvas class="wl3d-view" width="320" height="200"></canvas><div class="wl3d-hint"></div></div>';
      this.stage = root.querySelector('.wl3d-stage');
      this.canvas = root.querySelector('.wl3d-view');
      this.hintEl = root.querySelector('.wl3d-hint');
      this.ctx = this.canvas.getContext('2d');
      this.img = this.ctx.createImageData(SW, SH);
      this.img32 = new Uint32Array(this.img.data.buffer);
      this.r = new W.Renderer();
      this.r.font = this.makeFont();
      this.audio = new W.Audio();
      this.loadOptions();
      this.held = new Set(); this.mouse = { dx: 0, dy: 0, left: false, right: false };
      this.weaponQueue = -1;
      this.screen = 'title'; this.menu = null; this.menuStack = []; this.game = null; this.demo = null;
      this.acc = 0; this.last = 0; this.idle = 0; this.paused = false; this.fz = null; this.debug = false; this.awaitWarp = false;
      this.scores = this.loadScores();
      this.titlePic = null;
      this.ac = new AbortController();
      const sig = { signal: this.ac.signal };
      root.addEventListener('keydown', e => this.keyDown(e), sig);
      root.addEventListener('keyup', e => this.keyUp(e), sig);
      root.addEventListener('blur', () => { this.held.clear(); this.mouse.left = this.mouse.right = false; }, sig);
      this.canvas.addEventListener('mousedown', e => this.mouseDown(e), sig);
      window.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.left = false; if (e.button === 2) this.mouse.right = false; }, sig);
      this.canvas.addEventListener('contextmenu', e => e.preventDefault(), sig);
      document.addEventListener('mousemove', e => { if (this.locked()) { this.mouse.dx += e.movementX || 0; this.mouse.dy += e.movementY || 0; } }, sig);
      document.addEventListener('pointerlockchange', () => { if (!this.locked() && this.wasLocked && this.screen === 'play' && !this.destroyed) this.openMainMenu(); this.wasLocked = this.locked(); this.updateHint(); }, sig);
      if (globalThis.ResizeObserver) { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); }
      this.resize();
      this.audio.playMusic('title');
      this.raf = requestAnimationFrame(t => this.frame(t));
    }

    t(k) { return this.S[k]; }

    makeFont() {
      const specs = {
        small: { css: 'bold 10px Arial, Helvetica, sans-serif', h: 12, base: 9, th: 120 },
        tiny: { css: 'bold 7px Tahoma, Verdana, Arial, sans-serif', h: 8, base: 6, th: 110 },
        big: { css: 'bold 15px "Times New Roman", Georgia, serif', h: 18, base: 14, th: 120 },
        huge: { css: 'bold 30px "Times New Roman", Georgia, serif', h: 34, base: 28, th: 120 }
      };
      const cache = new Map();
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 40;
      const x = cv.getContext('2d', { willReadFrequently: true });
      return {
        glyph(ch, font) {
          const key = font + ch;
          if (cache.has(key)) return cache.get(key);
          const sp = specs[font] || specs.small;
          x.font = sp.css;
          const adv = Math.max(1, Math.round(x.measureText(ch).width));
          const w = adv + 2;
          x.clearRect(0, 0, 64, 40); x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
          x.fillText(ch, 1, sp.base);
          const data = x.getImageData(0, 0, w, sp.h).data, bits = new Uint8Array(w * sp.h);
          for (let i = 0; i < w * sp.h; i++) bits[i] = data[i * 4 + 3] > sp.th ? 1 : 0;
          const g = { w, h: sp.h, bits, adv: adv + (font === 'tiny' ? 0 : 0) };
          cache.set(key, g);
          return g;
        }
      };
    }

    loadOptions() {
      let o = {};
      try { o = JSON.parse(store.get(OPT_KEY) || '{}') || {}; } catch (_) { o = {}; }
      this.options = Object.assign({ view: 19, sfx: 'adlib', digi: true, music: true, volSfx: 8, volMusic: 6, mouse: true, sens: 5, mouseMove: false, alwaysRun: false, keys: null }, o);
      const keys = {};
      for (const a of D.ACTIONS) keys[a] = (this.options.keys && this.options.keys[a]) ? this.options.keys[a].slice(0, 2) : D.DEFAULT_KEYS[a].slice();
      this.options.keys = keys;
      this.r.setViewSize(this.options.view);
      this.applyAudio();
    }
    saveOptions() { store.set(OPT_KEY, JSON.stringify(this.options)); }
    applyAudio() { this.audio.setOptions({ sfx: this.options.sfx, digi: this.options.digi, music: this.options.music, volSfx: this.options.volSfx / 10, volMusic: this.options.volMusic / 10 }); }

    loadScores() {
      try { const s = JSON.parse(store.get(SCORE_KEY) || 'null'); if (Array.isArray(s) && s.length) return s.slice(0, 7); } catch (_) { }
      return DEFAULT_SCORES.map(s => Object.assign({}, s));
    }
    saveScores() { store.set(SCORE_KEY, JSON.stringify(this.scores)); }

    resize() {
      const w = this.root.clientWidth || 640, h = this.root.clientHeight || 480;
      let sw = w, sh = Math.round(w * 3 / 4);
      if (sh > h) { sh = h; sw = Math.round(h * 4 / 3); }
      Object.assign(this.stage.style, { width: sw + 'px', height: sh + 'px', left: ((w - sw) >> 1) + 'px', top: ((h - sh) >> 1) + 'px' });
    }

    locked() { return document.pointerLockElement === this.canvas; }
    unlock() { if (this.locked() && document.exitPointerLock) document.exitPointerLock(); }
    lockMouse() {
      if (!this.options.mouse || this.locked() || this.lockDenied || !this.canvas.requestPointerLock) return;
      try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { this.lockDenied = true; this.updateHint(); }); } catch (_) { this.lockDenied = true; }
    }
    updateHint() {
      const show = this.screen === 'play' && !this.paused && !this.fz && this.options.mouse && !this.locked() && !this.lockDenied && !this.demo && this.hintUntil > performance.now();
      if (show === this.hintShown) return;
      this.hintShown = show;
      this.hintEl.textContent = this.lang === 'ru' ? 'Щёлкните по картинке, чтобы управлять мышью' : 'Click the picture to use the mouse';
      this.hintEl.classList.toggle('on', show);
    }

    isActive() { return !document.hidden && this.root.getClientRects().length > 0 && (!this.opts.isActive || this.opts.isActive()); }

    mouseDown(e) {
      this.root.focus({ preventScroll: true });
      this.audio.ensure();
      if (this.screen === 'play' && !this.demo) {
        if (!this.locked()) { this.lockMouse(); return; }
        if (e.button === 0) this.mouse.left = true;
        if (e.button === 2) this.mouse.right = true;
        return;
      }
      if (this.screen === 'menu' && this.menu && e.button === 0) this.menuClick(e);
      else this.anyKey();
    }

    menuClick(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * SW, y = (e.clientY - rect.top) / rect.height * SH;
      const m = this.menu;
      if (m.hit) { const i = m.hit(x, y); if (i >= 0) { m.cur = i; this.menuKey({ code: 'Enter', key: 'Enter', preventDefault() { } }); } }
    }

    keyDown(e) {
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow') || e.code === 'Backspace' || /^F\d+$/.test(e.code) || e.altKey) e.preventDefault();
      this.audio.ensure();
      this.idle = 0;
      if (this.held.has(e.code) && e.repeat && this.screen === 'play') return;
      this.held.add(e.code);
      if (this.screen === 'play') { this.playKey(e); return; }
      if (this.screen === 'menu') { this.menuKey(e); return; }
      if (this.screen === 'scores' && this.entry) { this.entryKey(e); return; }
      if (this.screen === 'msg') { if (!e.repeat) this.msgKey(e); return; }
      if (this.screen === 'inter') { this.interKey(); return; }
      if (e.repeat) return;
      this.anyKey(e);
    }
    keyUp(e) { this.held.delete(e.code); }

    anyKey() {
      const s = this.screen;
      if (s === 'title' || s === 'credits' || (s === 'scores' && !this.game)) { this.openMainMenu(); return; }
      if (s === 'epend') { this.nextEndPage(); return; }
      if (s === 'victory') { this.afterGame(); return; }
      if (s === 'gameover') { this.afterGame(); return; }
      if (s === 'scores') { this.game = null; this.screen = 'title'; this.titleT = 0; this.audio.playMusic('title'); return; }
    }

    frame(ts) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(t => this.frame(t));
      const dt = Math.min(250, this.last ? ts - this.last : 16);
      this.last = ts;
      const active = this.isActive();
      if (!active) { this.held.clear(); this.mouse.left = this.mouse.right = false; }
      if (active) this.update(dt);
      this.draw(active);
      this.img32.set(this.r.fb);
      this.ctx.putImageData(this.img, 0, 0);
    }

    update(dt) {
      this.idle += dt;
      const s = this.screen;
      if (this.fz) { this.fz.n = Math.min(this.fz.total, this.fz.n + this.fz.rate * dt); if (this.fz.n >= this.fz.total && this.fz.hold-- <= 0) { const cb = this.fz.done; this.fz = null; if (cb) cb(); } }
      if (s === 'play' && !this.paused && !this.fz) {
        this.acc += dt;
        let n = 0;
        while (this.acc >= TICMS && n < 12) { this.acc -= TICMS; n++; this.gameTic(); if (this.screen !== 'play') break; }
        if (n >= 12) this.acc = 0;
      }
      if (s === 'psyched') {
        this.psyched += dt;
        if (this.psyched > 60 && !this.preloaded) { this.preloaded = true; this.preloadLevel(); }
        if (this.psyched > 1100) this.enterPlay();
      }
      if (s === 'title' || s === 'credits' || s === 'scores') {
        this.titleT = (this.titleT || 0) + dt;
        if (!this.game && !this.entry && this.titleT > 12000) {
          this.titleT = 0;
          if (s === 'title') this.screen = 'credits';
          else if (s === 'credits') this.screen = 'scores';
          else this.startDemo();
        }
      }
      if (s === 'inter') this.interUpdate(dt);
      this.updateHint();
      if (s === 'deathcamText') { this.dcT += dt; if (this.dcT > 1800) { this.game.startDeathcam(); this.screen = 'play'; } }
      if (s === 'victory' || s === 'epend' || s === 'gameover') this.animT = (this.animT || 0) + dt;
    }

    buildInput() {
      const k = this.options.keys, held = a => k[a].some(c => c && this.held.has(c));
      const inp = { fwd: 0, strafe: 0, turn: 0, mouseTurn: 0, run: false, fire: false, use: false, weapon: -1 };
      inp.fwd = (held('fwd') ? 1 : 0) - (held('back') ? 1 : 0);
      inp.turn = (held('right') ? 1 : 0) - (held('left') ? 1 : 0);
      inp.strafe = (held('sright') ? 1 : 0) - (held('sleft') ? 1 : 0);
      inp.strafeHeld = held('strafe');
      inp.run = held('run') !== this.options.alwaysRun;
      inp.fire = held('fire') || this.mouse.left;
      inp.use = held('use') || this.mouse.right;
      if (this.weaponQueue >= 0) { inp.weapon = this.weaponQueue; this.weaponQueue = -1; }
      if (this.mouse.dx || this.mouse.dy) {
        inp.mouseTurn = this.mouse.dx * 0.0009 * (this.options.sens + 1);
        if (this.options.mouseMove) inp.mouseFwd = -this.mouse.dy * 0.0025 * (this.options.sens + 1);
        this.mouse.dx = 0; this.mouse.dy = 0;
      }
      return inp;
    }

    gameTic() {
      const g = this.game;
      const inp = this.demo ? this.demo.input() : this.buildInput();
      g.tic(inp);
      for (const ev of g.events) this.playAt(ev.snd, ev.x, ev.y);
      if (this.demo) { this.demo.t++; if (g.mode !== 'play' || this.demo.t > D.TIC * 45) { this.stopDemo(); return; } }
      if (g.mode === 'dead') {
        this.startFizzle(G.rgb(160, 0, 0), true, 1100, () => {
          if (g.respawn()) this.startPsyched();
          else this.gameOver();
        });
        g.mode = 'fizzling';
      } else if (g.mode === 'exited') this.levelExited();
      else if (g.mode === 'bosskill' && !this.bossT) { this.bossT = 1; }
      else if (g.mode === 'bosskill') { if (++this.bossT > 100) { this.bossT = 0; this.screen = 'deathcamText'; this.dcT = 0; this.unlock(); } }
      else if (g.mode === 'won') this.episodeWon();
      if (this.mliCheck()) return;
    }

    playAt(snd, x, y) {
      const g = this.game;
      if (!g || x === undefined) { this.audio.play(snd); return; }
      const dx = x - g.px, dy = y - g.py, dist = Math.hypot(dx, dy);
      const vol = 1 / (1 + Math.max(0, dist - 1.5) * 0.16);
      const pan = dist > 0.5 ? (-dx * Math.sin(g.angle) + dy * Math.cos(g.angle)) / dist * 0.75 : 0;
      this.audio.play(snd, vol, pan);
    }

    mliCheck() {
      if (this.demo) return false;
      if (this.held.has('KeyM') && this.held.has('KeyL') && this.held.has('KeyI')) {
        this.held.delete('KeyM'); this.held.delete('KeyL'); this.held.delete('KeyI');
        this.game.mli();
        this.showMsg(this.t('mli'));
        return true;
      }
      return false;
    }

    playKey(e) {
      const g = this.game;
      if (this.demo) { this.stopDemo(); return; }
      const code = e.code;
      if (code === 'Escape') { this.openMainMenu(); return; }
      if (code === 'Pause' || code === 'KeyP') { this.paused = !this.paused; if (this.paused) this.unlock(); this.updateHint(); return; }
      if (this.paused) { this.paused = false; return; }
      const fkeys = { F1: () => this.openMenu(this.readThisMenu()), F2: () => this.openMenu(this.slotMenu(true)), F3: () => this.openMenu(this.slotMenu(false)), F4: () => this.openMenu(this.soundMenu()), F5: () => this.openMenu(this.viewMenu()), F6: () => this.openMenu(this.controlMenu()), F7: () => this.openMenu(this.confirmMenu(this.t('confirmEnd'), () => this.endGame())), F8: () => this.openMenu(this.debugMenu()), F10: () => this.openMenu(this.quitMenu()) };
      if (code === 'F8' && g.mode !== 'play') return;
      if (fkeys[code]) { this.unlock(); this.menuStack = []; this.screen = 'menu'; fkeys[code](); return; }
      if (code === 'F9') { if (e.shiftKey) this.quickSave(); else this.quickLoad(); return; }
      const k = this.options.keys;
      ['w1', 'w2', 'w3', 'w4'].forEach((a, i) => { if (k[a].includes(code)) this.weaponQueue = i; });
      if (code === 'Backspace' && this.held.has('ShiftLeft') && this.held.has('AltLeft')) { this.debug = !this.debug; this.showMsg(this.t(this.debug ? 'debugOn' : 'debugOff')); return; }
      if (this.debug && this.held.has('Tab') && code !== 'Tab') {
        if (code === 'KeyG') { g.god = !g.god; this.showMsg(this.t(g.god ? 'godOn' : 'godOff')); }
        else if (code === 'KeyI') { g.debugItems(); this.showMsg(this.t('freeItems')); }
        else if (code === 'KeyN') { g.noclip = !g.noclip; this.showMsg(this.t(g.noclip ? 'noclipOn' : 'noclipOff')); }
        else if (code === 'KeyE') { g.exitType = 1; g.mode = 'exited'; }
        else if (code === 'KeyW') { this.awaitWarp = true; this.showMsg(this.t('warpTo')); }
        else if (code === 'KeyF') this.showMsg(`X=${g.px.toFixed(2)} Y=${g.py.toFixed(2)} A=${Math.round(g.angle * 180 / Math.PI)}`);
      }
    }

    showMsg(text) { this.msg = text; this.prevScreen = this.screen; this.screen = 'msg'; this.unlock(); }
    closeMsg() { this.screen = this.prevScreen || 'play'; this.msg = null; this.acc = 0; }
    msgKey(e) {
      if (this.awaitWarp) {
        this.awaitWarp = false;
        const m = /^Digit(\d)$/.exec(e.code);
        this.closeMsg();
        if (m && this.game) { this.game.startLevel(m[1] === '0' ? 9 : +m[1] - 1); this.startPsyched(); }
        return;
      }
      this.closeMsg();
    }

    startFizzle(colorOrNull, viewOnly, ms, done, hold = 8) {
      const old = this.r.fb.slice();
      this.fz = { old, color: colorOrNull, viewOnly, n: 0, total: SW * SH, rate: SW * SH / ms, done, hold };
    }

    applyFizzle() {
      const f = this.fz, perm = this.r.fizzleOrder(), fb = this.r.fb, n = Math.floor(f.n);
      if (f.color !== null) {
        for (let i = 0; i < n; i++) {
          const p = perm[i];
          if (f.viewOnly) { const x = p % SW, y = (p / SW) | 0; if (x < this.r.vx || x >= this.r.vx + this.r.vw || y < this.r.vy || y >= this.r.vy + this.r.vh) continue; }
          fb[p] = f.color;
        }
        if (f.viewOnly) return;
        for (let i = n; i < f.total; i++) fb[perm[i]] = f.old[perm[i]];
        return;
      }
      for (let i = n; i < f.total; i++) fb[perm[i]] = f.old[perm[i]];
    }

    draw(active) {
      const s = this.screen, r = this.r;
      if (this.fz && this.fz.color !== null && this.fz.viewOnly) {
        this.drawPlay();
        this.applyFizzle();
        return;
      }
      if (s === 'play' || s === 'msg' || s === 'deathcamText') this.drawPlay();
      else if (s === 'menu') this.drawMenu();
      else if (s === 'title') this.drawTitle();
      else if (s === 'credits') this.drawCredits();
      else if (s === 'scores') this.drawScores();
      else if (s === 'psyched') this.drawPsyched();
      else if (s === 'inter') this.drawInter();
      else if (s === 'epend') this.drawEpEnd();
      else if (s === 'victory') this.drawVictory();
      else if (s === 'gameover') this.drawGameOver();
      if (s === 'msg') this.drawMsgBox(this.msg);
      if (s === 'deathcamText') this.drawDeathcamText();
      if (this.fz) this.applyFizzle();
      if (!active && (s === 'play')) { const fb = r.fb; for (let i = 0; i < fb.length; i += 2) fb[i] = G.shade(fb[i], 0.5); }
    }

    drawPlay() {
      const g = this.game, r = this.r;
      if (!g) return;
      r.drawBorder();
      r.drawView(g, { noWeapon: g.mode === 'deathcam' || g.mode === 'bosskill' });
      r.drawStatusBar(g, this.S);
      if (this.demo) r.text(this.t('demoBanner'), r.vx + r.vw / 2, r.vy + 4, C.yellow, 'big', 'center', C.black);
      if (this.paused) this.plaque(this.t('paused'));
      if (g.mode === 'deathcam') r.text(this.t('deathCam'), r.vx + r.vw / 2, r.vy + 6, C.yellow, 'big', 'center', C.black);
    }

    plaque(text, y = 60) {
      const r = this.r, w = Math.max(90, r.textWidth(text, 'big') + 24);
      const x = (SW - w) >> 1;
      r.fill(x, y, w, 26, C.win); r.bevel(x, y, w, 26, C.hi, C.lo);
      r.text(text, SW / 2, y + 5, C.title, 'big', 'center', C.black);
    }

    drawMsgBox(text) {
      if (!text) return;
      const r = this.r, lines = text.split('\n');
      const w = Math.min(300, Math.max(...lines.map(l => r.textWidth(l, 'small'))) + 24), h = lines.length * 12 + 16;
      const x = (SW - w) >> 1, y = Math.max(4, (r.vy + r.vh / 2 - h / 2) | 0);
      r.fill(x, y, w, h, C.win); r.bevel(x, y, w, h, C.hi, C.lo); r.bevel(x + 2, y + 2, w - 4, h - 4, C.lo, C.hi);
      lines.forEach((l, i) => r.text(l, SW / 2, y + 8 + i * 12, C.sel, 'small', 'center', C.black));
    }

    drawDeathcamText() { this.plaque(this.t('deathCam'), 70); }

    titleImage() {
      if (this.titlePic) return this.titlePic;
      const p = new G.Pic(SW, SH);
      p.map((c, x, y) => {
        const t = y / SH;
        let col = G.mix(G.rgb(70, 0, 0), G.rgb(8, 0, 0), t);
        if (((x + y * 3) % 7) === 0) col = G.shade(col, 1.15);
        return col;
      });
      G.eagle(p, 92, 36, 136, 104, G.rgb(110, 12, 12));
      G.eagle(p, 96, 40, 128, 98, G.rgb(150, 20, 20));
      for (let i = 0; i < 6; i++) { p.rect(0, 150 + i * 8, SW, 3, G.rgb(30 + i * 4, 0, 0)); }
      this.titlePic = p;
      return p;
    }

    drawTitle() {
      const r = this.r;
      r.blit(this.titleImage(), 0, 0);
      const t = this.titleT || 0;
      const gold = (i, j, g) => j < g.h * 0.45 ? G.rgb(255, 236, 140) : j < g.h * 0.7 ? G.rgb(232, 176, 40) : G.rgb(176, 108, 8);
      r.text('WOLFENSTEIN', SW / 2 + 2, 26, C.black, 'huge', 'center');
      r.text('WOLFENSTEIN', SW / 2, 24, gold, 'huge', 'center');
      r.text('3-D', SW / 2 + 1, 59, C.black, 'huge', 'center');
      r.text('3-D', SW / 2, 57, G.rgb(220, 30, 20), 'huge', 'center');
      r.blit(r.misc.bjBig, 0, 80);
      r.text(this.lang === 'ru' ? 'Издание 98 года для Win 98' : 'The 98 edition for Win 98', SW / 2 + 40, 104, C.text, 'small', 'center', C.black);
      r.text('(c) 1992 id Software', SW / 2 + 40, 118, C.grey, 'small', 'center', C.black);
      if (((t / 600) | 0) % 2 === 0) r.text(this.t('titleHint'), SW / 2 + 40, 172, C.sel, 'small', 'center', C.black);
    }

    drawCredits() {
      const r = this.r;
      r.blit(this.titleImage(), 0, 0);
      r.text('WOLFENSTEIN 3-D', SW / 2, 14, C.title, 'big', 'center', C.black);
      this.t('credits').forEach((l, i) => r.text(l, SW / 2, 50 + i * 14, i < 3 ? C.sel : C.text, 'small', 'center', C.black));
    }

    redBackground(title) {
      const r = this.r;
      r.fill(0, 0, SW, SH, C.bg);
      for (let i = 0; i < 4; i++) r.fill(0, 6 + i * 6, SW, 2, C.lo);
      if (title) {
        const w = r.textWidth(title, 'big') + 20;
        r.fill((SW - w) >> 1, 2, w, 26, C.bg);
        r.text(title, SW / 2, 6, C.title, 'big', 'center', C.black);
      }
    }

    windowBox(x, y, w, h) {
      const r = this.r;
      r.fill(x, y, w, h, C.win); r.bevel(x, y, w, h, C.hi, C.lo);
    }

    cursorAt(x, y) {
      const icon = this.r.weapons.pistol_icon;
      const blink = ((performance.now() / 300) | 0) % 2 === 0;
      this.r.blit(icon, x - 2, y - 6, { scale: 0.5, tint: blink ? null : c => G.shade(c, 1.6) });
    }

    openMainMenu() {
      this.unlock();
      this.paused = false;
      this.menuStack = [];
      this.screen = 'menu';
      this.openMenu(this.mainMenu());
      if (!this.game) this.audio.playMusic('menu');
    }
    openMenu(m) { if (this.menu && this.screen === 'menu') this.menuStack.push(this.menu); this.menu = m; this.screen = 'menu'; if (m.cur === undefined) m.cur = this.firstSel(m); }
    firstSel(m) { if (!m.items) return 0; const i = m.items.findIndex(it => !it.header && !it.disabled); return Math.max(0, i); }
    backMenu() {
      this.audio.play('m_back');
      if (this.menuStack.length) { this.menu = this.menuStack.pop(); return; }
      this.closeMenus();
    }
    closeMenus() {
      this.menu = null; this.menuStack = [];
      if (this.game && this.game.mode !== 'gameover') { this.screen = 'play'; this.hintUntil = performance.now() + 4000; this.updateHint(); this.acc = 0; this.audio.playMusic(this.game.level.music); }
      else { this.screen = 'title'; this.titleT = 0; this.audio.playMusic('title'); }
    }

    mainMenu() {
      const ingame = !!this.game;
      const items = [
        { label: this.t('newGame'), act: () => ingame ? this.openMenu(this.confirmMenu(this.t('confirmNew'), () => { this.menuStack = []; this.openMenu(this.episodeMenu()); })) : this.openMenu(this.episodeMenu()) },
        { label: this.t('sound'), act: () => this.openMenu(this.soundMenu()) },
        { label: this.t('control'), act: () => this.openMenu(this.controlMenu()) },
        { label: this.t('loadGame'), act: () => this.openMenu(this.slotMenu(false)) },
        { label: this.t('saveGame'), act: () => this.openMenu(this.slotMenu(true)), disabled: !ingame },
        { label: this.t('changeView'), act: () => this.openMenu(this.viewMenu()) },
        { label: this.t('readThis'), act: () => this.openMenu(this.readThisMenu()) },
        ingame ? { label: this.t('endGame'), act: () => this.openMenu(this.confirmMenu(this.t('confirmEnd'), () => this.endGame())) } : { label: this.t('viewScores'), act: () => { this.menu = null; this.screen = 'scores'; this.titleT = 0; this.audio.playMusic('scores'); } },
        ingame ? { label: this.t('backToGame'), act: () => this.closeMenus() } : { label: this.t('backToDemo'), act: () => { this.menu = null; this.screen = 'title'; this.titleT = 0; this.audio.playMusic('title'); } },
        { label: this.t('quit'), act: () => this.openMenu(this.quitMenu()) }
      ];
      return { id: 'main', title: this.t('menu'), items, x: 96, y: 40, w: 132 };
    }

    episodeMenu() {
      const items = D.EPISODES.map((ep, i) => ({ label: `${this.lang === 'ru' ? 'Эпизод' : 'Episode'} ${i + 1}`, sub: ep.name[this.lang], pic: 'ep' + (i + 1), act: () => { this.pendingEpisode = i; this.openMenu(this.skillMenu()); } }));
      return { id: 'episode', title: this.t('whichEpisode'), items, custom: 'episode' };
    }

    skillMenu() {
      const items = D.SKILLS.map((s, i) => ({ label: s[this.lang], act: () => this.newGame(this.pendingEpisode || 0, i) }));
      return { id: 'skill', title: this.t('howTough'), items, cur: 2, custom: 'skill' };
    }

    soundMenu() {
      const o = this.options;
      const radio = (key, val, label) => ({ label, radio: true, on: () => o[key] === val, act: () => { o[key] = val; this.applyAudio(); this.saveOptions(); this.audio.play('m_select'); } });
      const slider = (key, label) => ({ label, slider: key, act: () => { } });
      const items = [
        { header: true, label: this.t('soundEffects') },
        radio('sfx', 'off', this.t('none')), radio('sfx', 'pc', this.t('pcSpeaker')), radio('sfx', 'adlib', this.t('adlib')),
        { header: true, label: this.t('digiSound') },
        radio('digi', false, this.t('none')), radio('digi', true, this.t('soundBlaster')),
        { header: true, label: this.t('music') },
        radio('music', false, this.t('none')), radio('music', true, this.t('adlib')),
        slider('volSfx', this.t('volSfx')), slider('volMusic', this.t('volMusic'))
      ];
      return { id: 'sound', title: this.t('sound'), items, x: 70, y: 32, w: 190, lh: 11 };
    }

    controlMenu() {
      const o = this.options;
      const toggle = (key, label) => ({ label, value: () => o[key] ? this.t('on') : this.t('off'), act: () => { o[key] = !o[key]; this.saveOptions(); } });
      const items = [
        toggle('mouse', this.t('mouseEnabled')),
        { label: this.t('mouseSens'), slider: 'sens' },
        toggle('mouseMove', this.t('mouseMove')),
        toggle('alwaysRun', this.t('alwaysRun')),
        { label: this.t('customize'), act: () => this.openMenu(this.keysMenu()) }
      ];
      return { id: 'control', title: this.t('control'), items, x: 40, y: 50, w: 240 };
    }

    keysMenu() {
      const items = D.ACTIONS.map(a => ({ label: this.t('act')[a], action: a, act: () => { this.waitKey = { action: a, col: this.keyCol || 0 }; } }));
      return { id: 'keys', title: this.t('customize'), items, custom: 'keys' };
    }

    slotMenu(save) {
      const items = [];
      for (let i = 0; i < 10; i++) {
        let meta = null;
        try { const raw = store.get(SAVE_KEY(i)); if (raw) meta = JSON.parse(raw); } catch (_) { meta = null; }
        items.push({ label: meta ? meta.name : this.t('emptySlot'), slot: i, empty: !meta, act: () => save ? this.beginSave(i, meta) : (meta ? this.loadSlot(i) : this.audio.play('u_nothing')) });
      }
      return { id: save ? 'save' : 'load', title: this.t(save ? 'saveGame' : 'loadGame'), items, custom: 'slots', save };
    }

    debugMenu() {
      const g = () => this.game;
      const state = on => on ? this.t('on') : this.t('off');
      const toggle = (key, label, onEnable) => ({ label, value: () => state(g()[key]), act: () => { g()[key] = !g()[key]; if (g()[key] && onEnable) onEnable(); } });
      const items = [
        { label: this.t('dbgHealth'), value: () => String(g().health), act: () => g().debugHealth() },
        { label: this.t('dbgWeapons'), value: () => `${g().weapons.filter(Boolean).length}/${g().weapons.length}`, act: () => g().debugWeapons() },
        { label: this.t('dbgAmmo'), value: () => String(g().ammo), act: () => g().debugAmmo() },
        toggle('fastRun', this.t('dbgFastRun')),
        toggle('god', this.t('dbgGod')),
        toggle('infiniteAmmo', this.t('dbgInfAmmo'), () => g().debugAmmo()),
        { label: this.t('dbgClose'), act: () => this.closeMenus() }
      ];
      return { id: 'debug', title: this.t('debugMenu'), items, x: 40, y: 40, w: 240 };
    }

    viewMenu() { return { id: 'view', title: this.t('changeView'), custom: 'view', items: [] }; }
    readThisMenu() { return { id: 'read', title: this.t('readThis'), custom: 'read', page: 0, items: [] }; }
    quitMenu() {
      const lines = this.t('quitLines');
      const line = lines[Math.floor(Math.random() * lines.length)];
      return this.confirmMenu(line + '\n\n' + this.t('confirmQuit'), () => this.quit());
    }
    confirmMenu(text, yes) { return { id: 'confirm', custom: 'confirm', text, yes, items: [] }; }

    menuKey(e) {
      const m = this.menu, code = e.code;
      if (!m) return;
      if (this.waitKey) {
        const w = this.waitKey; this.waitKey = null;
        if (code === 'Escape') return;
        const keys = this.options.keys[w.action];
        if (code === 'Backspace') keys[w.col] = '';
        else { for (const a of D.ACTIONS) this.options.keys[a] = this.options.keys[a].map(c => c === code ? '' : c); keys[w.col] = code; }
        this.saveOptions();
        return;
      }
      if (this.typing) { this.typeKey(e); return; }
      if (code === 'F8' && m.id === 'debug') { this.closeMenus(); return; }
      if (m.custom === 'confirm') {
        if (code === 'KeyY' || code === 'Enter') { this.audio.play('m_select'); const y = m.yes; this.menu = this.menuStack.pop() || null; y(); }
        else if (code === 'KeyN' || code === 'Escape') this.backMenu();
        return;
      }
      if (m.custom === 'view') {
        if (code === 'ArrowLeft' || code === 'ArrowDown') { this.options.view = Math.max(4, this.options.view - 1); this.r.setViewSize(this.options.view); this.audio.play('m_move'); }
        else if (code === 'ArrowRight' || code === 'ArrowUp') { this.options.view = Math.min(20, this.options.view + 1); this.r.setViewSize(this.options.view); this.audio.play('m_move'); }
        else if (code === 'Enter' || code === 'Escape' || code === 'Space') { this.saveOptions(); this.backMenu(); }
        return;
      }
      if (m.custom === 'read') {
        const n = this.t('readThisPages').length;
        if (code === 'ArrowRight' || code === 'PageDown' || code === 'Enter' || code === 'Space') { if (m.page < n - 1) { m.page++; this.audio.play('m_move'); } else if (code !== 'ArrowRight') this.backMenu(); }
        else if (code === 'ArrowLeft' || code === 'PageUp') { if (m.page > 0) { m.page--; this.audio.play('m_move'); } }
        else if (code === 'Escape') this.backMenu();
        return;
      }
      const items = m.items;
      const move = d => {
        let i = m.cur;
        for (let k = 0; k < items.length; k++) { i = (i + d + items.length) % items.length; if (!items[i].header && !items[i].disabled) break; }
        m.cur = i; this.audio.play('m_move');
      };
      if (code === 'ArrowUp') move(-1);
      else if (code === 'ArrowDown') move(1);
      else if (code === 'Escape') this.backMenu();
      else if (code === 'Home') { m.cur = this.firstSel(m); }
      else if ((code === 'ArrowLeft' || code === 'ArrowRight') && items[m.cur]) {
        const it = items[m.cur], d = code === 'ArrowLeft' ? -1 : 1;
        if (it.slider) { this.options[it.slider] = Math.max(0, Math.min(10, this.options[it.slider] + d)); this.applyAudio(); this.saveOptions(); this.audio.play('m_move'); }
        else if (m.custom === 'keys') { this.keyCol = d < 0 ? 0 : 1; this.audio.play('m_move'); }
        else if (it.radio) it.act();
      } else if (code === 'Enter' || code === 'Space') {
        const it = items[m.cur];
        if (!it || it.header) return;
        if (it.disabled) { this.audio.play('u_nothing'); return; }
        if (!it.radio) this.audio.play('m_select');
        if (it.act) it.act();
      } else if (code === 'Backspace' && m.custom === 'keys') {
        const it = items[m.cur]; this.options.keys[it.action][this.keyCol || 0] = ''; this.saveOptions();
      }
    }

    drawMenu() {
      const m = this.menu, r = this.r;
      if (!m) return;
      if (m.custom === 'view') { this.drawViewMenu(); return; }
      if (m.custom === 'confirm') {
        if (this.menuStack.length) { const top = this.menu; this.menu = this.menuStack[this.menuStack.length - 1]; this.drawMenu(); this.menu = top; }
        else this.redBackground();
        this.drawMsgBox(m.text);
        return;
      }
      this.redBackground(m.title);
      if (m.custom === 'episode') return this.drawEpisodeMenu(m);
      if (m.custom === 'skill') return this.drawSkillMenu(m);
      if (m.custom === 'keys') return this.drawKeysMenu(m);
      if (m.custom === 'slots') return this.drawSlots(m);
      if (m.custom === 'read') return this.drawReadThis(m);
      const lh = m.lh || 13, x = m.x, y = m.y, w = m.w, h = m.items.length * lh + 10;
      this.windowBox(x, y, w, h);
      m.hit = (px, py) => { const i = Math.floor((py - y - 5) / lh); return px >= x && px < x + w && i >= 0 && i < m.items.length && !m.items[i].header ? i : -1; };
      m.items.forEach((it, i) => {
        const iy = y + 5 + i * lh;
        if (it.header) { r.text(it.label, x + 8, iy, C.title, 'small', 'left', C.black); return; }
        const col = it.disabled ? C.dis : i === m.cur ? C.sel : C.text;
        const tx = x + (it.radio ? 30 : 24);
        if (it.radio) { r.fill(x + 18, iy + 3, 6, 6, C.black); r.bevel(x + 17, iy + 2, 8, 8, C.lo, C.hi); if (it.on()) r.fill(x + 19, iy + 4, 4, 4, C.yellow); }
        r.text(it.label, tx, iy, col, 'small', 'left', C.black);
        if (it.value) r.text(it.value(), x + w - 8, iy, C.yellow, 'small', 'right', C.black);
        if (it.slider) {
          const sx = x + w - 70, v = this.options[it.slider];
          r.fill(sx, iy + 4, 60, 4, C.black); r.bevel(sx - 1, iy + 3, 62, 6, C.lo, C.hi);
          r.fill(sx + v * 5.4, iy + 1, 6, 10, C.yellow); r.bevel(sx + v * 5.4, iy + 1, 6, 10, C.white, C.shadow);
        }
        if (i === m.cur) this.cursorAt(x + 4, iy + 6);
      });
      r.text(this.t('navHint'), SW / 2, SH - 12, C.text, 'pix', 'center');
    }

    drawEpisodeMenu(m) {
      const r = this.r, x = 20, y = 32, lh = 26, w = 280;
      this.windowBox(x, y, w, lh * m.items.length + 6);
      m.hit = (px, py) => { const i = Math.floor((py - y - 3) / lh); return px >= x && px < x + w && i >= 0 && i < m.items.length ? i : -1; };
      m.items.forEach((it, i) => {
        const iy = y + 3 + i * lh;
        if (i === m.cur) r.fill(x + 2, iy, w - 4, lh, G.rgb(112, 0, 0));
        const pic = r.misc[it.pic];
        r.fill(x + 22, iy + 1, 26, 24, C.black);
        r.blit(pic, x + 22, iy + 1, { scale: 0.6 });
        r.text(it.label, x + 56, iy + 2, i === m.cur ? C.sel : C.text, 'small', 'left', C.black);
        r.text(it.sub, x + 56, iy + 13, i === m.cur ? C.yellow : C.title, 'small', 'left', C.black);
        if (i === m.cur) this.cursorAt(x + 6, iy + 12);
      });
    }

    drawSkillMenu(m) {
      const r = this.r, x = 40, y = 70, lh = 14, w = 240;
      this.windowBox(x, y, w, lh * 4 + 10);
      m.hit = (px, py) => { const i = Math.floor((py - y - 5) / lh); return px >= x && px < x + w && i >= 0 && i < 4 ? i : -1; };
      m.items.forEach((it, i) => {
        const iy = y + 5 + i * lh;
        r.text(it.label, x + 24, iy, i === m.cur ? C.sel : C.text, 'small', 'left', C.black);
        if (i === m.cur) this.cursorAt(x + 6, iy + 6);
      });
      r.fill(x + w - 40, y + 8, 28, 36, C.black); r.bevel(x + w - 41, y + 7, 30, 38, C.lo, C.hi);
      r.blit(r.faces['skill' + m.cur], x + w - 38, y + 10);
    }

    keyName(code) {
      if (!code) return '—';
      const map = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl', ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift', AltLeft: 'L-Alt', AltRight: 'R-Alt', Space: this.lang === 'ru' ? 'Пробел' : 'Space', Comma: ',', Period: '.', Enter: 'Enter' };
      if (map[code]) return map[code];
      return code.replace(/^Key|^Digit|^Numpad/, '');
    }

    drawKeysMenu(m) {
      const r = this.r, x = 16, y = 30, lh = 11, w = 288, col = this.keyCol || 0;
      this.windowBox(x, y, w, m.items.length * lh + 8);
      m.hit = (px, py) => { const i = Math.floor((py - y - 4) / lh); if (px > x + 170) this.keyCol = px > x + 230 ? 1 : 0; return px >= x && px < x + w && i >= 0 && i < m.items.length ? i : -1; };
      m.items.forEach((it, i) => {
        const iy = y + 4 + i * lh, keys = this.options.keys[it.action];
        r.text(it.label, x + 22, iy, i === m.cur ? C.sel : C.text, 'small', 'left', C.black);
        [0, 1].forEach(c => {
          const kx = x + 172 + c * 58;
          const waiting = this.waitKey && this.waitKey.action === it.action && this.waitKey.col === c;
          if (i === m.cur && c === col) r.fill(kx - 2, iy, 56, 11, G.rgb(120, 0, 0));
          r.text(waiting ? '???' : this.keyName(keys[c]), kx, iy, waiting ? C.yellow : i === m.cur && c === col ? C.sel : C.title, 'small', 'left', C.black);
        });
        if (i === m.cur) this.cursorAt(x + 6, iy + 6);
      });
      r.text(this.waitKey ? this.t('pressKeyFor') : this.t('navHint'), SW / 2, SH - 12, C.text, 'pix', 'center');
    }

    drawSlots(m) {
      const r = this.r, x = 50, y = 34, lh = 14, w = 220;
      this.windowBox(x, y, w, lh * 10 + 8);
      m.hit = (px, py) => { const i = Math.floor((py - y - 4) / lh); return px >= x && px < x + w && i >= 0 && i < 10 ? i : -1; };
      m.items.forEach((it, i) => {
        const iy = y + 4 + i * lh;
        r.fill(x + 20, iy, w - 28, 12, C.black); r.bevel(x + 19, iy - 1, w - 26, 14, C.lo, C.hi);
        const editing = this.typing && this.typing.slot === i;
        const label = editing ? this.typing.text + (((performance.now() / 300) | 0) % 2 ? '_' : ' ') : it.label;
        r.text(label, x + 23, iy + 1, editing ? C.yellow : i === m.cur ? C.sel : it.empty ? C.grey : C.text, 'small');
        if (i === m.cur) this.cursorAt(x + 6, iy + 6);
      });
      r.text(this.typing ? this.t('typeName') : this.t('navHint'), SW / 2, SH - 12, C.text, 'pix', 'center');
    }

    drawReadThis(m) {
      const r = this.r, page = this.t('readThisPages')[m.page];
      this.windowBox(14, 32, 292, 156);
      r.text(page.title, SW / 2, 36, C.title, 'big', 'center', C.black);
      page.lines.forEach((l, i) => r.text(l, 26, 58 + i * 11, C.sel, 'small', 'left', C.black));
      r.text(`${m.page + 1} / ${this.t('readThisPages').length}   ← →`, SW / 2, 176, C.text, 'pix', 'center');
      if (m.page === 3) {
        const spr = ['guard', 'dog', 'ss', 'officer', 'mutant'];
        spr.forEach((t, i) => r.blit(G.actorSprites(t).s0, 236 + (i % 2) * 34, 50 + Math.floor(i / 2) * 40, { scale: 0.6 }));
      }
      if (m.page === 4) {
        ['food', 'firstaid', 'clip', 'chalice', 'crown', 'oneup', 'key1', 'key2'].forEach((n, i) => r.blit(r.statics[n], 230 + (i % 2) * 34, 52 + Math.floor(i / 2) * 28, { scale: 0.55 }));
      }
    }

    drawViewMenu() {
      const r = this.r;
      if (this.game) { r.drawBorder(); r.drawView(this.game); r.drawStatusBar(this.game, this.S); }
      else {
        r.drawBorder();
        r.fill(r.vx, r.vy, r.vw, r.vh >> 1, G.rgb(56, 56, 56)); r.fill(r.vx, r.vy + (r.vh >> 1), r.vw, r.vh - (r.vh >> 1), G.rgb(112, 112, 112));
        r.fill(0, 160, SW, 40, G.rgb(0, 0, 112));
      }
      this.plaque(this.t('viewHint'), 4);
    }

    typeKey(e) {
      const tp = this.typing;
      if (e.code === 'Escape') { this.typing = null; return; }
      if (e.code === 'Enter') { this.typing = null; this.saveSlot(tp.slot, tp.text || `${this.t('floor')} ${this.game.floor + 1}`); return; }
      if (e.code === 'Backspace') { tp.text = tp.text.slice(0, -1); return; }
      if (e.key && e.key.length === 1 && tp.text.length < 24) tp.text += e.key;
    }

    beginSave(i, meta) {
      if (!this.game) return;
      const ep = D.EPISODES[this.game.episode].name[this.lang];
      this.typing = { slot: i, text: meta ? meta.name : `${this.lang === 'ru' ? 'Э' : 'E'}${this.game.episode + 1} ${this.t('floor')} ${this.game.floor + 1} ${ep}`.slice(0, 24) };
    }

    saveSlot(i, name) {
      const g = this.game;
      if (!g) return;
      const ok = store.set(SAVE_KEY(i), JSON.stringify({ name, date: Date.now(), data: g.serialize() }));
      this.closeMenus();
      this.showMsg(ok ? this.t('saved') : this.t('noSave'));
    }

    loadSlot(i) {
      let meta = null;
      try { meta = JSON.parse(store.get(SAVE_KEY(i)) || 'null'); } catch (_) { meta = null; }
      if (!meta) { this.audio.play('u_nothing'); return false; }
      this.stopDemo(true);
      this.game = W.Game.deserialize(meta.data, this.maps);
      this.menu = null; this.menuStack = [];
      this.screen = 'play'; this.paused = false; this.acc = 0;
      this.preloadLevel();
      this.audio.playMusic(this.game.level.music);
      this.hintUntil = performance.now() + 4000; this.updateHint();
      this.startFizzle(null, false, 600, null, 0);
      return true;
    }

    quickSave() { if (this.game && this.game.mode === 'play') { store.set(SAVE_KEY(9), JSON.stringify({ name: this.lang === 'ru' ? 'Быстрое сохранение' : 'Quick save', date: Date.now(), data: this.game.serialize() })); this.showMsg(this.t('saved')); } }
    quickLoad() { if (!this.loadSlot(9)) this.showMsg(this.t('noSave')); }

    newGame(episode, skill, floor = 0) {
      this.stopDemo(true);
      this.game = new W.Game({ maps: this.maps, episode, skill, floor });
      this.menu = null; this.menuStack = [];
      this.startPsyched();
    }

    preloadLevel() {
      const types = new Set((this.game ? this.game.actors : []).map(a => a.type));
      for (const t of [...types]) { const sp = D.ENEMIES[t].spawn; if (sp) types.add(sp); }
      for (const t of types) G.actorSprites(t);
    }

    startPsyched() {
      this.screen = 'psyched'; this.psyched = 0; this.preloaded = false; this.unlock();
      this.audio.play('i_psyched');
    }

    enterPlay() {
      this.screen = 'play'; this.acc = 0;
      this.audio.playMusic(this.game.level.music);
      this.hintUntil = performance.now() + 5000; this.updateHint();
      this.startFizzle(null, false, 500, null, 0);
      this.fz.old.fill(C.black);
    }

    drawPsyched() {
      const r = this.r;
      r.drawBorder();
      r.fill(r.vx, r.vy, r.vw, r.vh, C.teal);
      if (this.game) r.drawStatusBar(this.game, this.S);
      const w = 200, x = (SW - w) >> 1, y = 64;
      r.fill(x, y, w, 40, G.rgb(0, 40, 40)); r.bevel(x, y, w, 40, C.tealHi, C.black);
      r.text(this.t('getPsyched'), SW / 2, y + 6, C.yellow, 'big', 'center', C.black);
      const p = Math.min(1, this.psyched / 1000);
      r.fill(x + 12, y + 28, w - 24, 6, C.black);
      r.fill(x + 12, y + 28, Math.round((w - 24) * p), 6, G.rgb(220, 40, 20));
    }

    levelExited() {
      const g = this.game;
      g.mode = 'intermission';
      const next = g.nextFloor();
      const st = g.levelStats();
      g.totalTime += st.time;
      g.stats.push({ floor: g.floor, kills: st.kills, secrets: st.secrets, treasures: st.treasures, time: st.time });
      this.unlock();
      if (next < 0) { this.episodeWon(); return; }
      this.inter = { st, next, secret: g.floor === 9, phase: 0, t: 0, kill: 0, secretR: 0, treas: 0, bonus: 0, timeBonus: Math.max(0, (st.par - st.time)) * 500, added: false, flags: {} };
      this.screen = 'inter';
      this.audio.playMusic('inter');
    }

    interUpdate(dt) {
      const it = this.inter;
      it.t += dt;
      if (it.secret) { if (it.phase === 0 && it.t > 400) { it.phase = 9; it.bonus = 15000; this.audio.play('i_perfect'); } return; }
      const step = (cur, target, rate) => Math.min(target, cur + rate * dt);
      if (it.phase === 0) { if (it.t > 300) { it.phase = 1; } }
      else if (it.phase === 1) {
        const before = Math.floor(it.bonus / 500);
        it.bonus = step(it.bonus, it.timeBonus, 6);
        if (Math.floor(it.bonus / 500) !== before) this.audio.play('i_tick');
        if (it.bonus >= it.timeBonus) { it.phase = 2; it.t = 0; }
      } else if (it.phase >= 2 && it.phase <= 4) {
        const key = ['kill', 'secretR', 'treas'][it.phase - 2], target = [it.st.kills, it.st.secrets, it.st.treasures][it.phase - 2];
        if (it.t < 250) return;
        const before = Math.floor(it[key] / 10);
        it[key] = step(it[key], target, 0.12);
        if (Math.floor(it[key] / 10) !== before) this.audio.play('i_tick');
        if (it[key] >= target) {
          if (target >= 100 && !it.flags[key]) { it.flags[key] = true; it.bonus += 10000; this.audio.play('i_perfect'); }
          it.phase++; it.t = 0;
        }
      } else if (it.phase === 5) { it.phase = 9; this.audio.play('i_bonus'); }
    }

    interKey() {
      const it = this.inter;
      if (it.phase < 9) {
        it.bonus = it.timeBonus; it.kill = it.st.kills; it.secretR = it.st.secrets; it.treas = it.st.treasures;
        for (const k of ['kill', 'secretR', 'treas']) { const target = { kill: it.st.kills, secretR: it.st.secrets, treas: it.st.treasures }[k]; if (target >= 100 && !it.flags[k]) { it.flags[k] = true; it.bonus += 10000; } }
        if (it.secret) it.bonus = 15000;
        it.phase = 9;
        return;
      }
      if (!it.added) { it.added = true; this.game.givePoints(Math.round(it.bonus)); }
      this.game.startLevel(it.next);
      this.inter = null;
      this.startPsyched();
    }

    drawInter() {
      const r = this.r, it = this.inter, g = this.game;
      r.fill(0, 0, SW, SH, C.teal);
      r.fill(0, 160, SW, 40, C.teal);
      const frameT = ((performance.now() / 400) | 0) % 4;
      r.fill(8, 12, 80, 86, C.black); r.bevel(7, 11, 82, 88, C.tealHi, C.black);
      r.blit(r.misc.bjBust[frameT], 12, 22);
      const tx = 104;
      if (it.secret) {
        r.text(this.t('secretDone'), tx, 30, C.sel, 'big', 'left', C.black);
        if (it.phase >= 9) r.text(this.t('secretBonus'), tx, 60, C.yellow, 'big', 'left', C.black);
      } else {
        r.text(this.t('floorDone').replace('{n}', g.floor + 1), tx, 14, C.sel, 'big', 'left', C.black);
        const row = (label, val, y, col = C.sel) => { r.text(label, tx, y, C.text, 'small', 'left', C.black); r.text(val, 300, y, col, 'small', 'right', C.black); };
        row(this.t('bonus'), String(Math.round(it.bonus)), 40, C.yellow);
        row(this.t('time'), fmtTime(it.st.time), 56);
        row(this.t('par'), fmtTime(it.st.par), 68);
        if (it.phase >= 2) row(this.t('killRatio'), Math.floor(it.kill) + '%', 88, it.flags.kill ? C.yellow : C.sel);
        if (it.phase >= 3) row(this.t('secretRatio'), Math.floor(it.secretR) + '%', 100, it.flags.secretR ? C.yellow : C.sel);
        if (it.phase >= 4) row(this.t('treasureRatio'), Math.floor(it.treas) + '%', 112, it.flags.treas ? C.yellow : C.sel);
        if (it.flags.kill || it.flags.secretR || it.flags.treas) r.text(this.t('perfect'), tx, 128, C.yellow, 'small', 'left', C.black);
      }
      r.drawStatusBar(g, this.S);
      if (it.phase >= 9 && ((performance.now() / 500) | 0) % 2 === 0) r.text(this.t('pressKey'), 200, 146, C.sel, 'small', 'center', C.black);
    }

    episodeWon() {
      const g = this.game;
      this.unlock();
      g.mode = 'over';
      this.endPage = 0; this.animT = 0;
      this.screen = 'epend';
      this.audio.playMusic('victory');
    }

    nextEndPage() {
      this.screen = 'victory'; this.animT = 0;
    }

    drawEpEnd() {
      const r = this.r, g = this.game, lines = this.t('episodeEnd')[g.episode];
      r.fill(0, 0, SW, SH, G.rgb(16, 16, 40));
      r.fill(8, 8, 304, 184, G.rgb(24, 24, 64)); r.bevel(8, 8, 304, 184, G.rgb(80, 80, 160), C.black);
      r.blit(r.misc.bjBust[((this.animT / 400) | 0) % 4], 18, 20);
      r.text(D.EPISODES[g.episode].name[this.lang], 200, 16, C.title, 'big', 'center', C.black);
      lines.forEach((l, i) => r.text(l, 96, 40 + i * 12, C.sel, 'small', 'left', C.black));
      if (((this.animT / 500) | 0) % 2 === 0) r.text(this.t('pressKey'), SW / 2, 178, C.text, 'small', 'center', C.black);
    }

    drawVictory() {
      const r = this.r, g = this.game, t = this.animT;
      r.fill(0, 0, SW, SH, C.teal);
      r.text(this.t('youWin'), SW / 2, 8, C.yellow, 'huge', 'center', C.black);
      const bj = G.actorSprites('bj'), x = -40 + Math.min(1, t / 2500) * 150;
      const pic = t < 2500 ? bj['run' + (((t / 120) | 0) % 4)] : bj[((t / 300) | 0) % 2 ? 'jump1' : 'jump2'];
      r.blit(pic, x, 52, { scale: 1.4 });
      const n = Math.max(1, g.stats.length), avg = k => Math.round(g.stats.reduce((s, x) => s + x[k], 0) / n);
      r.text(this.t('totalTime'), 160, 60, C.text, 'small'); r.text(fmtTime(g.totalTime), 304, 60, C.sel, 'small', 'right');
      r.text(this.t('averages'), 160, 82, C.title, 'small');
      r.text(this.t('killRatio'), 160, 96, C.text, 'small'); r.text(avg('kills') + '%', 304, 96, C.sel, 'small', 'right');
      r.text(this.t('secretRatio'), 160, 108, C.text, 'small'); r.text(avg('secrets') + '%', 304, 108, C.sel, 'small', 'right');
      r.text(this.t('treasureRatio'), 160, 120, C.text, 'small'); r.text(avg('treasures') + '%', 304, 120, C.sel, 'small', 'right');
      r.text(this.t('score').toUpperCase() + ': ' + g.score, 160, 140, C.yellow, 'small');
      if (t > 3000 && ((t / 500) | 0) % 2 === 0) r.text(this.t('pressKey'), SW / 2, 184, C.sel, 'small', 'center', C.black);
    }

    gameOver() {
      this.screen = 'gameover'; this.animT = 0; this.unlock();
      this.game.mode = 'gameover';
      this.audio.playMusic('scores');
    }

    drawGameOver() {
      const r = this.r;
      r.fill(0, 0, SW, SH, C.black);
      r.blit(r.misc.bjDead, 124, 30);
      r.text(this.t('gameOver'), SW / 2, 120, G.rgb(220, 20, 20), 'huge', 'center');
      if (this.animT > 1500 && ((this.animT / 500) | 0) % 2 === 0) r.text(this.t('pressKey'), SW / 2, 172, C.text, 'small', 'center');
    }

    afterGame() {
      const g = this.game;
      if (this.screen === 'victory' && this.animT < 1500) return;
      const min = this.scores.length < 7 ? -1 : this.scores[this.scores.length - 1].score;
      this.screen = 'scores'; this.titleT = 0;
      this.audio.playMusic('scores');
      if (g && g.score > min && !g.mliUsed) {
        const entry = { name: '', score: g.score, ep: g.episode + 1, floor: g.floor + 1 };
        this.scores.push(entry);
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 7);
        if (this.scores.includes(entry)) { this.entry = entry; return; }
      }
      this.game = null;
    }

    entryKey(e) {
      const en = this.entry;
      if (e.code === 'Enter') { if (!en.name) en.name = 'BJ'; this.entry = null; this.saveScores(); this.game = null; return; }
      if (e.code === 'Backspace') { en.name = en.name.slice(0, -1); return; }
      if (e.key && e.key.length === 1 && en.name.length < 14) en.name += e.key;
    }

    drawScores() {
      const r = this.r;
      this.redBackground(this.t('highScores'));
      this.windowBox(16, 36, 288, 130);
      r.text(this.t('name'), 40, 42, C.title, 'small'); r.text(this.t('scoreCol'), 230, 42, C.title, 'small', 'right'); r.text(this.t('epCol'), 290, 42, C.title, 'small', 'right');
      this.scores.forEach((s, i) => {
        const y = 58 + i * 14, editing = s === this.entry;
        r.text(`${i + 1}.`, 26, y, C.text, 'small');
        r.text(editing ? s.name + (((performance.now() / 300) | 0) % 2 ? '_' : ' ') : s.name, 40, y, editing ? C.yellow : C.sel, 'small', 'left', C.black);
        r.text(String(s.score), 230, y, C.sel, 'small', 'right', C.black);
        r.text(`E${s.ep}/${s.floor}`, 290, y, C.text, 'small', 'right', C.black);
      });
      if (this.entry) r.text(this.t('enterName'), SW / 2, 174, C.yellow, 'small', 'center', C.black);
      else r.text(this.t('pressKey'), SW / 2, 178, C.text, 'small', 'center', C.black);
    }

    endGame() {
      const g = this.game;
      this.menu = null; this.menuStack = [];
      if (!g) { this.screen = 'title'; return; }
      this.screen = 'gameover'; this.animT = 2000;
      this.afterGame();
    }

    startDemo() {
      const g = new W.Game({ maps: this.maps, episode: 0, skill: 1, floor: (this.demoN = ((this.demoN || 0) + 1) % 3), seed: 7 + this.demoN });
      g.god = true; g.hideGod = true;
      this.game = g;
      this.demo = new W.Bot(g, { walk: true });
      this.demo.t = 0;
      this.screen = 'play'; this.acc = 0;
      this.audio.playMusic(g.level.music);
    }

    stopDemo(silent) {
      if (!this.demo) return;
      this.demo = null; this.game = null;
      if (silent) return;
      this.screen = 'title'; this.titleT = 0;
      this.audio.playMusic('title');
    }

    quit() {
      this.menu = null;
      if (this.opts.onExit) this.opts.onExit();
      else { this.game = null; this.screen = 'title'; }
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      this.ac.abort();
      if (this.ro) this.ro.disconnect();
      this.unlock();
      this.audio.destroy();
    }
  }

  W.UI = UI;
})(globalThis.Wolf3D = globalThis.Wolf3D || {});
