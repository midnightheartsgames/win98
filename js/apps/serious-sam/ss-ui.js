/**
 * Serious Sam 98 — DOM front end: WebGL view + HUD canvas, pointer-lock input, fixed 60 Hz loop with a smoothed
 * camera, Serious-style HUD (health, armor, ammo, score, boss bar, NETRICSA messages), menus, level stats,
 * death/restart, victory, checkpoint saves and console cheats.
 */
(function (S) {
  'use strict';
  const { clamp } = S;
  const { STR, SKILLS, WEAPONS, WEAPON_ORDER, AMMO, ENEMIES } = S.DATA;
  const OPT_KEY = 'ss98-options', SAVE_KEY = 'ss98-save';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } } };
  const DT = S.GAME.DT;
  const KEYW = { Digit1: 'knife', Digit2: 'colt', Digit3: 'shotgun', Digit4: 'dshotgun', Digit5: 'tommy', Digit6: 'minigun', Digit7: 'rocket', Digit8: 'grenade', Digit9: 'laser', Digit0: 'cannon' };
  const FONT = 'Impact, "Arial Black", "Arial Narrow", sans-serif';
  const QUALITY = [0.5, 0.75, 1];
  const RUN_MULS = [1, 1.5, 2, 3], JUMP_MULS = [1, 2, 4, 8];

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts; this.ac = new AbortController();
      root.classList.add('ss98'); root.tabIndex = 0;
      root.innerHTML = '<canvas class="ss98-gl"></canvas><canvas class="ss98-hud"></canvas><div class="ss98-err"></div>';
      this.glc = root.querySelector('.ss98-gl'); this.hud = root.querySelector('.ss98-hud'); this.hctx = this.hud.getContext('2d');
      this.lang = opts.lang || ((globalThis.i18n && globalThis.i18n.getLanguage && globalThis.i18n.getLanguage()) === 'en' ? 'en' : 'ru');
      this.S = STR[this.lang];
      this.options = { sens: 6, invert: false, fov: 90, sfx: 0.8, music: 0.5, quality: 2, fps: false, bob: true };
      try { Object.assign(this.options, JSON.parse(store.get(OPT_KEY)) || {}); } catch (_) {}
      this.save = { unlocked: 0, cont: null };
      try { Object.assign(this.save, JSON.parse(store.get(SAVE_KEY)) || {}); } catch (_) {}
      this.audio = new S.Audio(); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music;
      try { this.renderer = new S.Renderer(this.glc); } catch (err) { this.fail(err); return; }
      this.keys = new Set(); this.mouse = { fire: false, dx: 0, dy: 0, wheel: 0 }; this.cheatBuf = '';
      this.state = 'title'; this.menu = null; this.menuSel = 0; this.menuItems = []; this.hover = -1;
      this.toasts = []; this.netricsa = null; this.netQueue = []; this.popup = null; this.flash = { r: 0, g: 0 }; this.hurtDir = null; this.hurtT = 0;
      this.acc = 0; this.last = 0; this.fpsT = 0; this.fpsN = 0; this.fps = 0; this.showLog = false; this.wsel = 0; this.sway = [0, 0];
      this.debug = false; this.dbgRows = []; this.dbgSel = 1; this.dbgPick = 0; this.dbgNote = null; this.dbgRects = [];
      this.bind();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); this.resize();
      this.loadDemo();
      this.openMenu('main');
      this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
      if (opts.onReady) opts.onReady(this);
    }
    t(k) { return this.S[k] != null ? this.S[k] : k; }
    L(o) { return o ? (o[this.lang] || o.en || '') : ''; }
    fail(err) {
      this.failed = true; const el = this.root.querySelector('.ss98-err');
      el.textContent = (this.lang === 'ru' ? 'Не удалось запустить 3D-графику (WebGL). ' : 'Could not start 3D graphics (WebGL). ') + (err && err.message ? err.message : ''); el.style.display = 'block';
    }
    saveOptions() { store.set(OPT_KEY, JSON.stringify(this.options)); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music; this.audio.applyVolume(); }
    saveGame() { store.set(SAVE_KEY, JSON.stringify(this.save)); }

    // ================================================================ layout & input
    resize() {
      const r = this.root.getBoundingClientRect(); if (!r.width || !r.height) return;
      const dpr = Math.min(2, globalThis.devicePixelRatio || 1), q = QUALITY[this.options.quality] || 1;
      let w = Math.round(r.width * dpr * q), h = Math.round(r.height * dpr * q);
      const cap = 1920 / w; if (cap < 1) { w = Math.round(w * cap); h = Math.round(h * cap); }
      if (this.renderer) this.renderer.resize(w, h);
      this.hud.width = Math.round(r.width * dpr); this.hud.height = Math.round(r.height * dpr);
    }
    locked() { return document.pointerLockElement === this.glc; }
    lock() { if (!this.locked() && this.glc.requestPointerLock) { try { const p = this.glc.requestPointerLock(); if (p && p.catch) p.catch(() => { this.lockDenied = true; }); } catch (_) { this.lockDenied = true; } } }
    unlock() { if (this.locked() && document.exitPointerLock) document.exitPointerLock(); }
    bind() {
      const sig = { signal: this.ac.signal }, root = this.root;
      root.addEventListener('keydown', e => this.onKey(e, true), sig);
      root.addEventListener('keyup', e => this.onKey(e, false), sig);
      root.addEventListener('mousedown', e => {
        root.focus({ preventScroll: true }); this.audio.resume();
        if (this.debug) { if (e.button === 0) this.debugClick(e); return; }
        if (this.menu) { if (e.button === 0) this.menuClick(e); return; }
        if (this.state === 'dead') { if (this.deadT > 1) this.restartLevel(); return; }
        if (this.state === 'stats') { if (this.statsT > 1) this.nextLevel(); return; }
        if (this.state === 'victory') { if (this.victoryT > 3) { this.state = 'title'; this.loadDemo(); this.openMenu('main'); } return; }
        if (this.state === 'play') { if (!this.locked()) this.lock(); if (e.button === 0) this.mouse.fire = true; if (e.button === 2) this.mouse.alt = true; }
      }, sig);
      document.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.fire = false; if (e.button === 2) this.mouse.alt = false; }, sig);
      root.addEventListener('contextmenu', e => e.preventDefault(), sig);
      document.addEventListener('mousemove', e => {
        if (this.locked()) { this.mouse.dx += e.movementX || 0; this.mouse.dy += e.movementY || 0; }
        else if (this.state === 'play' && this.lockDenied && (e.buttons & 2)) { this.mouse.dx += e.movementX || 0; this.mouse.dy += e.movementY || 0; }
        if (this.menu) this.menuHover(e);
        if (this.debug) this.debugHover(e);
      }, sig);
      root.addEventListener('wheel', e => { e.preventDefault(); if (this.state === 'play' && !this.menu && !this.debug) this.mouse.wheel += Math.sign(e.deltaY); }, Object.assign({ passive: false }, sig));
      document.addEventListener('pointerlockchange', () => { if (!this.locked() && this.wasLocked && this.state === 'play' && !this.menu && !this.debug && !this.destroyed) this.openMenu('pause'); this.wasLocked = this.locked(); if (this.wasLocked) this.lockDenied = false; }, sig);
      root.addEventListener('blur', () => { this.keys.clear(); this.mouse.fire = false; }, sig);
    }
    onKey(e, down) {
      const c = e.code;
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'F7'].includes(c)) e.preventDefault();
      if (!down) { this.keys.delete(c); if (c === 'Tab') this.showLog = false; return; }
      this.audio.resume();
      if (this.debug) { this.debugKey(c, e.repeat); e.preventDefault(); return; }
      if (this.menu) { this.menuKey(c); e.preventDefault(); return; }
      if (c === 'F7' && this.game && (this.state === 'play' || this.state === 'dead')) { if (!e.repeat) this.openDebug(); return; }
      if (this.state === 'dead') { if ((c === 'Space' || c === 'Enter') && this.deadT > 1) this.restartLevel(); if (c === 'Escape') this.openMenu('pause'); return; }
      if (this.state === 'stats') { if ((c === 'Space' || c === 'Enter') && this.statsT > 1) this.nextLevel(); return; }
      if (this.state === 'victory') { if (this.victoryT > 3) { this.state = 'title'; this.loadDemo(); this.openMenu('main'); } return; }
      if (this.state !== 'play') return;
      if (c === 'Escape') { this.openMenu('pause'); return; }
      if (c === 'Tab') { this.showLog = true; return; }
      if (e.repeat) return;
      this.keys.add(c);
      if (KEYW[c]) this.pendWeapon = KEYW[c];
      if (c === 'KeyQ') this.pendPrev = true;
      if (c === 'KeyR') this.pendReload = true;
      if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) {
        this.cheatBuf = (this.cheatBuf + e.key.toLowerCase()).slice(-20);
        for (const [code, name] of [['pleasegod', 'god'], ['pleasegiveall', 'giveall'], ['pleasekillall', 'killall']]) {
          if (this.cheatBuf.endsWith(code)) { const r = this.game.cheat(name); if (r) this.toast(this.t(r), '#ffe070'); this.cheatBuf = ''; }
        }
      }
    }

    // ================================================================ game flow
    loadDemo() {
      if (this.failed) return;
      const lv = this.save.cont ? Math.min(this.save.cont.level, S.LEVELS.length - 1) : 0;
      this.demo = new S.Game({ level: lv, skill: 0 });
      this.demo.enemies.length = 0;
      this.renderer.setLevel(this.demo);
      this.game = null; this.audio.stopMusic();
    }
    startLevel(level, skill, inv) {
      this.state = 'loading'; this.menu = null; this.drawHud();
      setTimeout(() => {
        if (this.destroyed) return;
        const prev = this.game ? this.game.player : null;
        this.game = new S.Game({ level, skill, inv, seed: (Date.now() & 0xffff) + level });
        if (prev) this.keepDebugFlags(prev);
        this.demo = null;
        this.renderer.setLevel(this.game);
        this.skill = skill;
        this.save.cont = { level, skill, inv: this.game.startInv }; this.save.unlocked = Math.max(this.save.unlocked || 0, level); this.saveGame();
        this.state = 'play'; this.deadT = 0; this.toasts = []; this.netQueue = []; this.netricsa = null; this.popup = null;
        this.camY = this.game.player.y; this.prevPos = null;
        this.say(this.L(this.game.def.intro), 8);
        this.audio.resume(); this.audio.startMusic(this.game.def.music != null ? this.game.def.music : level);
        this.lock(); this.root.focus({ preventScroll: true });
      }, 30);
    }
    restartLevel() { const g = this.game; if (!g) return; this.startLevel(g.levelIndex, g.skillIndex, g.startInv); }
    nextLevel() {
      const g = this.game, inv = g.inventory(), n = g.levelIndex + 1;
      if (n >= S.LEVELS.length) { this.state = 'victory'; this.victoryT = 0; this.save.cont = null; this.save.unlocked = S.LEVELS.length - 1; this.saveGame(); this.unlock(); return; }
      this.save.unlocked = Math.max(this.save.unlocked || 0, n); this.startLevel(n, g.skillIndex, inv);
    }
    toast(text, color = '#fff') { this.toasts.push({ text, color, t: 0 }); if (this.toasts.length > 4) this.toasts.shift(); }
    say(text, dur = 6) { if (!text) return; text = text.replace(/^(Нетрикса|NETRICSA):\s*/i, ''); text = text.charAt(0).toUpperCase() + text.slice(1); this.netQueue.push({ text, dur }); }

    // ================================================================ menus
    openMenu(name) {
      this.menu = name; this.menuSel = 0; this.hover = -1; this.mouse.fire = false;
      if (name === 'pause' || name === 'main') this.unlock();
      if (this.game && this.state === 'play') this.audio.pause(true);
      this.buildMenu();
    }
    closeMenu() {
      this.menu = null;
      if (this.game && (this.state === 'play' || this.state === 'dead')) { this.audio.pause(false); if (this.state === 'play') this.lock(); }
    }
    buildMenu() {
      const it = [], o = this.options, T = k => this.t(k);
      const back = to => ({ label: T('back'), act: () => { this.menu = to; this.menuSel = 0; this.buildMenu(); } });
      const parent = this.game ? 'pause' : 'main';
      switch (this.menu) {
        case 'main':
          if (this.save.cont) it.push({ label: T('cont'), act: () => { const c = this.save.cont; this.startLevel(c.level, c.skill, c.inv); } });
          it.push({ label: T('newGame'), act: () => { this.pickLevel = 0; this.menu = 'skill'; this.menuSel = 2; this.buildMenu(); } });
          if ((this.save.unlocked || 0) > 0) it.push({ label: T('levelSelect'), act: () => { this.menu = 'levels'; this.menuSel = 0; this.buildMenu(); } });
          it.push({ label: T('options'), act: () => { this.menu = 'options'; this.menuSel = 0; this.buildMenu(); } });
          it.push({ label: T('controls'), act: () => { this.menu = 'controls'; this.menuSel = 0; this.buildMenu(); } });
          if (this.opts.onExit) it.push({ label: T('quit'), act: () => this.opts.onExit() });
          break;
        case 'pause':
          it.push({ label: T('resume'), act: () => this.closeMenu() });
          it.push({ label: T('restart'), act: () => { this.menu = null; this.audio.pause(false); this.restartLevel(); } });
          it.push({ label: T('options'), act: () => { this.menu = 'options'; this.menuSel = 0; this.buildMenu(); } });
          it.push({ label: T('controls'), act: () => { this.menu = 'controls'; this.menuSel = 0; this.buildMenu(); } });
          it.push({ label: T('mainMenu'), act: () => { this.audio.pause(false); this.state = 'title'; this.loadDemo(); this.openMenu('main'); } });
          break;
        case 'skill':
          SKILLS.forEach((s, i) => it.push({ label: this.L(s.name).toUpperCase(), act: () => this.startLevel(this.pickLevel || 0, i, null) }));
          it.push(back('main'));
          break;
        case 'levels':
          S.LEVELS.forEach((f, i) => { if (i <= (this.save.unlocked || 0)) { const nm = this.levelNames ? this.levelNames[i] : (this.levelNames = S.LEVELS.map(l => l()).map(d => d.name))[i]; it.push({ label: `${i + 1}. ${this.L(nm).toUpperCase()}`, act: () => { this.pickLevel = i; this.menu = 'skill'; this.menuSel = 2; this.buildMenu(); } }); } });
          it.push(back('main'));
          break;
        case 'options': {
          const onoff = v => (v ? T('on') : T('off'));
          it.push({ label: T('sens'), value: () => String(o.sens), adj: d => { o.sens = clamp(o.sens + d, 1, 20); } });
          it.push({ label: T('invert'), value: () => onoff(o.invert), adj: () => { o.invert = !o.invert; } });
          it.push({ label: T('fov'), value: () => `${o.fov}°`, adj: d => { o.fov = clamp(o.fov + d * 5, 70, 110); } });
          it.push({ label: T('sfx'), value: () => `${Math.round(o.sfx * 100)}%`, adj: d => { o.sfx = clamp(Math.round((o.sfx + d * 0.1) * 10) / 10, 0, 1); } });
          it.push({ label: T('music'), value: () => `${Math.round(o.music * 100)}%`, adj: d => { o.music = clamp(Math.round((o.music + d * 0.1) * 10) / 10, 0, 1); } });
          it.push({ label: T('quality'), value: () => [T('low'), T('med'), T('high')][o.quality], adj: d => { o.quality = (o.quality + d + 3) % 3; this.resize(); } });
          it.push({ label: T('bob'), value: () => onoff(o.bob), adj: () => { o.bob = !o.bob; } });
          it.push({ label: T('fps'), value: () => onoff(o.fps), adj: () => { o.fps = !o.fps; } });
          it.push(back(parent));
          break;
        }
        case 'controls': for (const line of this.S.help) it.push({ label: line, text: true }); it.push(back(parent)); break;
      }
      this.menuItems = it;
      if (this.menuItems[this.menuSel] && this.menuItems[this.menuSel].text) this.menuSel = this.menuItems.findIndex(x => !x.text);
    }
    menuKey(c) {
      const it = this.menuItems, n = it.length;
      const move = d => { let i = this.menuSel; for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (!it[i].text) break; } this.menuSel = i; this.audio.play('switch'); };
      if (c === 'ArrowUp' || c === 'KeyW') move(-1);
      else if (c === 'ArrowDown' || c === 'KeyS') move(1);
      else if (c === 'ArrowLeft' || c === 'KeyA') this.adjust(it[this.menuSel], -1);
      else if (c === 'ArrowRight' || c === 'KeyD') this.adjust(it[this.menuSel], 1);
      else if (c === 'Enter' || c === 'Space') this.activate(it[this.menuSel], 1);
      else if (c === 'Escape') {
        if (this.menu === 'pause') this.closeMenu();
        else if (this.menu === 'main') { /* stay */ }
        else { const back = it[n - 1]; if (back && back.act) back.act(); }
      }
    }
    adjust(item, d) { if (item && item.adj) { item.adj(d); this.saveOptions(); this.audio.play('switch'); } }
    activate(item, d) { if (!item || item.text) return; this.audio.play('pick_ammo'); if (item.adj) this.adjust(item, d); else if (item.act) item.act(); }
    menuHit(e) {
      const r = this.hud.getBoundingClientRect(), x = (e.clientX - r.left) * (this.hud.width / r.width), y = (e.clientY - r.top) * (this.hud.height / r.height);
      for (let i = 0; i < (this.itemRects || []).length; i++) { const b = this.itemRects[i]; if (b && x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) return { i, x, b }; }
      return null;
    }
    menuHover(e) { const h = this.menuHit(e); this.hover = h ? h.i : -1; if (h && !this.menuItems[h.i].text && h.i !== this.menuSel) this.menuSel = h.i; }
    menuClick(e) { const h = this.menuHit(e); if (!h) return; const item = this.menuItems[h.i]; this.menuSel = h.i; this.activate(item, item.adj && h.x < h.b[4] ? -1 : 1); }

    // ================================================================ main loop
    isActive() { return !document.hidden && this.root.getClientRects().length && (!this.opts.isActive || this.opts.isActive()); }
    frame(ts) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(this.frame);
      if (this.failed) return;
      const dt = Math.min(0.1, this.last ? (ts - this.last) / 1000 : 0.016); this.last = ts;
      this.fpsT += dt; this.fpsN++; if (this.fpsT > 0.5) { this.fps = Math.round(this.fpsN / this.fpsT); this.fpsT = 0; this.fpsN = 0; }
      const active = this.isActive();
      if (this.state === 'loading') { this.drawHud(); return; }
      const R = this.renderer;
      if (this.game && this.state !== 'title') {
        const g = this.game, p = g.player;
        const running = !this.menu && !this.debug && active && (this.state === 'play' || this.state === 'dead');
        if (running) {
          const k = this.options.sens * 0.00032;
          if (!p.dead) { p.yaw = S.wrapAng(p.yaw - this.mouse.dx * k); p.pitch = clamp(p.pitch - this.mouse.dy * k * (this.options.invert ? -1 : 1), -1.5, 1.5); }
          this.sway[0] = clamp(this.sway[0] * 0.85 - this.mouse.dx * 0.00004, -0.03, 0.03); this.sway[1] = clamp(this.sway[1] * 0.85 + this.mouse.dy * 0.00004, -0.03, 0.03);
          this.mouse.dx = this.mouse.dy = 0;
          this.acc += dt; let n = 0;
          while (this.acc >= DT && n < 6) {
            this.prevPos = [p.x, p.y, p.z];
            g.tick(this.input());
            this.handleEvents(g.events); R.events(g.events, g); g.events.length = 0;
            this.acc -= DT; n++;
          }
          if (n >= 6) this.acc = 0;
          R.stepEffects(dt, g);
          this.audio.setCombat(g.boss() ? 1 : clamp(g.activeEnemies() / 3, 0, 1));
          this.audio.update();
          if (this.state === 'dead') this.deadT += dt;
          this.updateHudTimers(dt);
        } else { this.mouse.dx = this.mouse.dy = 0; }
        if (this.state === 'stats') this.statsT += dt;
        const a = clamp(this.acc / DT, 0, 1), pp = this.prevPos || [p.x, p.y, p.z];
        const x = pp[0] + (p.x - pp[0]) * a, z = pp[2] + (p.z - pp[2]) * a, y = pp[1] + (p.y - pp[1]) * a;
        if (this.camY == null || Math.abs(y - this.camY) > 3 || !p.ground) this.camY = y; else this.camY += (y - this.camY) * Math.min(1, dt * 14);
        const eye = (p.dead ? 0.35 : S.GAME.EYE) + (this.options.bob && p.ground ? Math.abs(Math.sin(p.bob * 0.5 * Math.PI)) * 0.05 * Math.min(1, Math.hypot(p.vx, p.vz) / 10) : 0);
        this.audio.setListener(x, this.camY + eye, z, p.yaw);
        const cam = { x, y: this.camY + eye, z, yaw: p.yaw, pitch: p.pitch, roll: p.dead ? 0.4 : 0 };
        this.shadeT = (this.shadeT || 0) - dt; if (this.shadeT <= 0) { this.shadeT = 0.2; this.shade = R.shadeAt(p.x, p.y, p.z); }
        this.shadeS = this.shadeS == null ? this.shade : this.shadeS + (this.shade - this.shadeS) * Math.min(1, dt * 4);
        R.render(g, cam, { fov: this.options.fov, viewmodel: this.state === 'play', bob: this.options.bob, sway: this.sway, shade: this.shadeS });
      } else if (this.demo) {
        this.demoT = (this.demoT || 0) + dt;
        const d = this.demo, st = d.def.start, a = this.demoT * 0.05, r = 16, fx = st.x, fz = st.z + 22;
        const cx = fx + Math.sin(a) * r, cz = fz + Math.cos(a) * r, cy = d.W.floorAt(cx, cz, 0.4, 60) + 3.2 + Math.sin(this.demoT * 0.2) * 0.8;
        R.stepEffects(dt, d);
        R.render(d, { x: cx, y: cy, z: cz, yaw: Math.atan2(fx - cx, fz - cz) + 0.5, pitch: 0.12 }, { fov: 85, viewmodel: false });
      }
      if (this.state === 'victory') this.victoryT += dt;
      this.drawHud();
    }
    input() {
      const k = this.keys, g = this.game, i = {};
      i.fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
      i.strafe = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
      const turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0); if (turn) i.dyaw = turn * 2.6 * DT;
      if (k.has('PageUp')) i.dpitch = 1.6 * DT; if (k.has('PageDown')) i.dpitch = -1.6 * DT;
      i.jump = k.has('Space'); i.down = k.has('KeyC'); i.walk = k.has('ShiftLeft') || k.has('ShiftRight');
      i.fire = this.mouse.fire || k.has('ControlLeft') || k.has('ControlRight');
      if (this.pendWeapon) { i.weapon = this.pendWeapon; this.pendWeapon = null; this.wsel = 1.6; }
      if (this.pendPrev) { i.prev = true; this.pendPrev = false; this.wsel = 1.6; }
      if (this.pendReload) { i.reload = true; this.pendReload = false; }
      if (this.mouse.wheel) { i.cycle = this.mouse.wheel > 0 ? 1 : -1; this.mouse.wheel = 0; this.wsel = 1.6; }
      void g; return i;
    }
    handleEvents(evs) {
      const g = this.game, A = this.audio;
      for (const e of evs) {
        switch (e.t) {
          case 'sound': A.play(e.s, e.x, e.y, e.z, e.vol); break;
          case 'hurt': this.flash.r = Math.min(0.6, this.flash.r + 0.1 + e.dmg * 0.012); if (e.dir != null) { this.hurtDir = e.dir; this.hurtT = 1; } break;
          case 'pickup': this.flash.g = 0.25; A.play('pick_' + e.kind); if (e.text) this.toast(typeof e.text === 'string' ? e.text : this.L(e.text), e.kind === 'weapon' ? '#ffe070' : '#d0ffd0'); if (e.kind === 'weapon') this.wsel = 1.6; break;
          case 'secret': this.toast(this.t('secretFound'), '#80e0ff'); break;
          case 'msg': this.say(this.L(e.text), 7); break;
          case 'newEnemy': { const d = ENEMIES[e.type]; this.popup = { name: this.L(d.name), text: this.L(d.info), t: 0, type: e.type }; A.play('newenemy'); break; }
          case 'switch': A.play('switch'); break;
          case 'jump': A.play('jump'); break;
          case 'land': A.play('land', null, null, null, 0.6); break;
          case 'pdie': this.state = 'dead'; this.deadT = 0; this.unlock(); break;
          case 'levelDone': this.state = 'stats'; this.statsT = 0; this.unlock(); A.play('secret'); this.save.unlocked = Math.max(this.save.unlocked || 0, Math.min(S.LEVELS.length - 1, g.levelIndex + 1)); this.saveGame(); break;
          case 'fire': break;
          default: break;
        }
      }
      // footsteps
      const p = g.player, step = Math.floor(p.bob / 2);
      if (step !== this.lastStep) { this.lastStep = step; if (p.ground && !p.dead) A.play('step'); }
    }
    updateHudTimers(dt) {
      this.flash.r = Math.max(0, this.flash.r - dt * 1.2); this.flash.g = Math.max(0, this.flash.g - dt * 1.5); this.hurtT = Math.max(0, this.hurtT - dt * 1.2);
      for (const t of this.toasts) t.t += dt; this.toasts = this.toasts.filter(t => t.t < 3);
      if (this.wsel > 0) this.wsel -= dt;
      if (this.netricsa) { this.netricsa.t += dt; if (this.netricsa.t > this.netricsa.dur) this.netricsa = null; }
      if (!this.netricsa && this.netQueue.length) { this.netricsa = Object.assign(this.netQueue.shift(), { t: 0 }); this.audio.play('netricsa'); }
      if (this.popup) { this.popup.t += dt; if (this.popup.t > 7) this.popup = null; }
    }

    // ================================================================ HUD
    drawHud() {
      const c = this.hctx, W = this.hud.width, H = this.hud.height;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
      const k = H / 600; c.save(); c.scale(k, k); const w = W / k, h = 600;
      this.itemRects = [];
      if (this.state === 'loading') { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); this.bigText(c, this.t('loading'), w / 2, h / 2, 36, '#ffd040'); c.restore(); return; }
      if (this.game && (this.state === 'play' || this.state === 'dead')) this.drawPlayHud(c, w, h);
      if (this.state === 'dead') {
        c.fillStyle = `rgba(90,0,0,${Math.min(0.45, this.deadT * 0.3)})`; c.fillRect(0, 0, w, h);
        this.bigText(c, this.t('youDied'), w / 2, h * 0.4, 54, '#ff4020');
        if (this.deadT > 1) this.bigText(c, this.t('pressFire'), w / 2, h * 0.52, 18, '#fff');
      }
      if (this.state === 'stats') this.drawStats(c, w, h);
      if (this.state === 'victory') this.drawVictory(c, w, h);
      if (this.debug) this.drawDebug(c, w, h, k);
      if (this.menu) this.drawMenu(c, w, h, k);
      if (this.options.fps) { c.font = `bold 13px ${FONT}`; c.fillStyle = '#0f0'; c.textAlign = 'right'; c.fillText(`${this.fps} FPS  ${this.renderer ? this.renderer.frame.enemies : 0}e`, w - 8, h - 98); }
      c.restore();
    }
    bigText(c, s, x, y, size, color, align = 'center') {
      c.font = `${size}px ${FONT}`; c.textAlign = align; c.textBaseline = 'middle';
      c.lineWidth = Math.max(2, size / 9); c.strokeStyle = 'rgba(0,0,0,0.85)'; c.strokeText(s, x, y); c.fillStyle = color; c.fillText(s, x, y);
    }
    wrap(c, text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; } if (cur) lines.push(cur); return lines; }
    panel(c, x, y, w, h, alpha = 0.55) {
      const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, `rgba(10,30,60,${alpha})`); g.addColorStop(1, `rgba(0,10,30,${alpha})`);
      c.fillStyle = g; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(120,200,255,0.55)'; c.lineWidth = 1.5; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
    icon(c, kind, x, y, s) {
      c.save(); c.translate(x, y); c.scale(s / 32, s / 32);
      if (kind === 'health') { c.fillStyle = '#ff3a2a'; c.beginPath(); c.moveTo(16, 28); c.bezierCurveTo(-6, 12, 4, -2, 16, 8); c.bezierCurveTo(28, -2, 38, 12, 16, 28); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(8, 8, 5, 3); }
      else if (kind === 'armor') { c.fillStyle = '#ffc020'; c.beginPath(); c.moveTo(4, 4); c.lineTo(12, 2); c.lineTo(16, 7); c.lineTo(20, 2); c.lineTo(28, 4); c.lineTo(27, 26); c.lineTo(16, 31); c.lineTo(5, 26); c.closePath(); c.fill(); c.fillStyle = '#a06010'; c.fillRect(14, 10, 4, 16); }
      else { const a = { shells: '#e03020', bullets: '#c8a050', rockets: '#9aa070', grenades: '#50a040', cells: '#40ff60', balls: '#505050' }[kind] || '#fff'; c.fillStyle = a; if (kind === 'balls' || kind === 'grenades') { c.beginPath(); c.arc(16, 16, 11, 0, 7); c.fill(); } else if (kind === 'cells') { c.fillRect(9, 4, 14, 24); c.fillStyle = '#103010'; c.fillRect(12, 8, 8, 4); } else { for (let i = 0; i < 3; i++) { c.fillRect(5 + i * 9, 10, 6, 18); c.beginPath(); c.moveTo(5 + i * 9, 10); c.lineTo(8 + i * 9, 3); c.lineTo(11 + i * 9, 10); c.fill(); } } }
      c.restore();
    }
    drawPlayHud(c, w, h) {
      const g = this.game, p = g.player, T = k => this.t(k);
      if (this.flash.r > 0) { c.fillStyle = `rgba(200,0,0,${this.flash.r})`; c.fillRect(0, 0, w, h); }
      if (this.flash.g > 0) { c.fillStyle = `rgba(255,220,120,${this.flash.g * 0.5})`; c.fillRect(0, 0, w, h); }
      if (p.power > 0) { c.fillStyle = `rgba(255,40,220,${0.08 + 0.04 * Math.sin(g.time * 8)})`; c.fillRect(0, 0, w, h); }
      if (this.hurtT > 0 && this.hurtDir != null) {
        const a = S.wrapAng(this.hurtDir - p.yaw); c.save(); c.translate(w / 2, h / 2); c.rotate(-a); c.strokeStyle = `rgba(255,30,20,${this.hurtT * 0.8})`; c.lineWidth = 10; c.beginPath(); c.arc(0, 0, 120, -Math.PI / 2 - 0.35, -Math.PI / 2 + 0.35); c.stroke(); c.restore();
      }
      if (p.dead) return;
      const f = g.forward(), tr = g.trace(p.x, g.eye, p.z, f[0], f[1], f[2], 200), on = !!tr.e;
      c.save(); c.translate(w / 2, h / 2); c.strokeStyle = on ? '#ff5030' : 'rgba(255,255,255,0.9)'; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, 9, 0, Math.PI * 2); c.stroke(); for (const [a, b] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { c.beginPath(); c.moveTo(a * 5, b * 5); c.lineTo(a * 14, b * 14); c.stroke(); }
      c.fillStyle = c.strokeStyle; c.fillRect(-1, -1, 2, 2); c.restore();
      const hpCol = p.hp <= 25 ? (Math.floor(g.time * 4) % 2 ? '#ff3020' : '#ffa090') : p.hp > 100 ? '#80e0ff' : '#ffffff';
      this.panel(c, 10, h - 62, 238, 52);
      this.icon(c, 'health', 18, h - 54, 36); this.bigText(c, String(Math.ceil(p.hp)), 60, h - 36, 38, hpCol, 'left');
      this.icon(c, 'armor', 132, h - 54, 36); this.bigText(c, String(Math.ceil(p.armor)), 174, h - 36, 38, p.armor > 100 ? '#80e0ff' : '#ffd860', 'left');
      const wd = WEAPONS[p.cur];
      this.panel(c, w - 248, h - 62, 238, 52);
      if (wd.ammo) { this.icon(c, wd.ammo, w - 240, h - 54, 36); this.bigText(c, p.infAmmo ? '∞' : String(p.ammo[wd.ammo]), w - 196, h - 36, p.infAmmo ? 56 : 38, p.infAmmo ? '#80e0ff' : p.ammo[wd.ammo] <= (wd.use || 1) * 3 ? '#ff6040' : '#fff', 'left'); }
      else this.bigText(c, p.cur === 'colt' ? (p.reloadT > 0 ? 'RELOAD' : `${p.clip}/${p.dual ? 12 : 6}`) : '∞', w - 196, h - 36, 30, '#fff', 'left');
      c.font = `13px ${FONT}`; c.fillStyle = '#9fd4ff'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(this.L(wd.name).toUpperCase(), w - 16, h - 72);
      if (p.cur === 'cannon' && p.charging) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(w / 2 - 60, h / 2 + 30, 120, 8); c.fillStyle = '#ffb030'; c.fillRect(w / 2 - 60, h / 2 + 30, 120 * (p.charge / WEAPONS.cannon.charge), 8); }
      this.bigText(c, String(g.stats.score).padStart(7, '0'), w - 14, 22, 24, '#ffe070', 'right');
      c.font = `14px ${FONT}`; c.textAlign = 'right'; c.fillStyle = '#cfe8ff'; c.fillText(`${T('kills')}: ${g.stats.kills}/${g.stats.total}`, w - 14, 46);
      if (p.power > 0) this.bigText(c, `SERIOUS DAMAGE ${Math.ceil(p.power)}`, w / 2, 90, 20, '#ff60e0');
      const tags = this.debugTags(p);
      if (tags) { c.fillStyle = '#ffe070'; c.textAlign = 'left'; c.fillText(tags, 14, 22); }
      const boss = g.boss();
      if (boss) {
        const bw = Math.min(500, w * 0.6), x = (w - bw) / 2;
        this.panel(c, x - 4, 36, bw + 8, 26, 0.6); c.fillStyle = '#400'; c.fillRect(x, 40, bw, 18);
        c.fillStyle = '#e02010'; c.fillRect(x, 40, bw * clamp(boss.hp / boss.maxHp, 0, 1), 18);
        this.bigText(c, this.t('boss'), w / 2, 49, 16, '#fff');
      }
      if (this.wsel > 0) {
        const own = WEAPON_ORDER.filter(x => p.weapons.has(x)), bw = 58, x0 = w / 2 - (own.length * bw) / 2, y = h - 116, cur = p.next || p.cur;
        c.globalAlpha = clamp(this.wsel, 0, 1);
        own.forEach((x, i) => {
          const d = WEAPONS[x], sel = x === cur, has = g.hasAmmo(x);
          this.panel(c, x0 + i * bw, y, bw - 4, 40, sel ? 0.85 : 0.45);
          if (sel) { c.strokeStyle = '#ffe070'; c.lineWidth = 2; c.strokeRect(x0 + i * bw + 1, y + 1, bw - 6, 38); }
          c.font = `12px ${FONT}`; c.textAlign = 'left'; c.fillStyle = has ? '#fff' : '#777'; c.fillText(String(d.key), x0 + i * bw + 5, y + 10);
          c.textAlign = 'center'; c.font = `10px ${FONT}`; c.fillText(this.L(d.name).split(' ')[0].slice(0, 9).toUpperCase(), x0 + i * bw + bw / 2 - 2, y + 26);
          if (d.ammo) { c.fillStyle = has ? '#9fd4ff' : '#a55'; c.fillText(String(p.ammo[d.ammo]), x0 + i * bw + bw / 2 - 2, y + 36); }
        });
        c.globalAlpha = 1;
      }
      this.toasts.forEach((t, i) => { c.globalAlpha = clamp(3 - t.t, 0, 1); this.bigText(c, t.text, w / 2, h - 150 - (this.toasts.length - 1 - i) * 22, 17, t.color); });
      c.globalAlpha = 1;
      if (this.netricsa) {
        const n = this.netricsa, bw = Math.min(620, w - 40), x = (w - bw) / 2;
        c.font = `15px Tahoma, Arial, sans-serif`; const shown = n.text.slice(0, Math.floor(n.t * 70)), lines = this.wrap(c, shown, bw - 60);
        const hh = 30 + Math.max(1, this.wrap(c, n.text, bw - 60).length) * 19; this.netH = hh;
        c.globalAlpha = clamp((n.dur - n.t) * 2, 0, 1);
        this.panel(c, x, 70, bw, hh, 0.7);
        c.fillStyle = '#6fe0ff'; c.font = `bold 12px Tahoma, Arial, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(this.t('netricsa'), x + 48, 76);
        c.strokeStyle = '#6fe0ff'; c.lineWidth = 2; c.beginPath(); c.arc(x + 24, 94, 12, 0, 7); c.stroke(); c.beginPath(); c.arc(x + 24, 94, 4, 0, 7); c.fillStyle = '#6fe0ff'; c.fill();
        c.fillStyle = '#e8f6ff'; c.font = `15px Tahoma, Arial, sans-serif`; lines.forEach((l, i) => c.fillText(l, x + 48, 92 + i * 19));
        c.globalAlpha = 1;
      }
      if (this.popup) {
        const pp = this.popup, bw = 250, x = 12;
        c.globalAlpha = clamp(Math.min(pp.t * 3, 7 - pp.t), 0, 1);
        c.font = `13px Tahoma, Arial, sans-serif`; const lines = this.wrap(c, pp.text, bw - 20), y = this.netricsa ? 78 + this.netH + 10 : 70;
        this.panel(c, x, y, bw, 54 + lines.length * 16, 0.72);
        c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = '#ff9060'; c.font = `bold 11px Tahoma, Arial, sans-serif`; c.fillText(this.t('newEnemy').toUpperCase(), x + 10, y + 8);
        c.fillStyle = '#ffe070'; c.font = `17px ${FONT}`; c.fillText(pp.name.toUpperCase(), x + 10, y + 24);
        c.fillStyle = '#dfefff'; c.font = `13px Tahoma, Arial, sans-serif`; lines.forEach((l, i) => c.fillText(l, x + 10, y + 48 + i * 16));
        c.globalAlpha = 1;
      }
      if (this.showLog) {
        const bw = Math.min(640, w - 40), x = (w - bw) / 2, y = 60, hh = h - 180; this.panel(c, x, y, bw, hh, 0.85);
        c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = '#6fe0ff'; c.font = `20px ${FONT}`; c.fillText(`${this.t('netricsa')} — ${this.L(g.def.name).toUpperCase()}`, x + 16, y + 12);
        c.font = `14px Tahoma, Arial, sans-serif`; c.fillStyle = '#cfe8ff';
        c.fillText(`${T('kills')}: ${g.stats.kills}/${g.stats.total}    ${T('secrets')}: ${g.stats.secrets}/${g.stats.secretsTotal}    ${T('time')}: ${this.fmtTime(g.time)}    ${this.L(SKILLS[g.skillIndex].name)}`, x + 16, y + 44);
        let yy = y + 74;
        for (const m of g.msgs.slice().reverse()) { for (const l of this.wrap(c, this.L(m.text), bw - 40)) { if (yy > y + hh - 20) break; c.fillStyle = '#e8f6ff'; c.fillText(l, x + 16, yy); yy += 18; } yy += 6; }
      }
      if (!this.locked() && !this.menu && !this.debug && this.state === 'play') this.bigText(c, this.lockDenied ? (this.lang === 'ru' ? 'Мышь не захвачена: удерживайте ПКМ для обзора или используйте стрелки' : 'Mouse not captured: hold RMB to look or use arrow keys') : this.t('clickToPlay'), w / 2, h * 0.3, 16, '#fff');
    }
    fmtTime(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${m}:${String(s).padStart(2, '0')}`; }
    drawStats(c, w, h) {
      const g = this.game, T = k => this.t(k), st = g.stats;
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, w, h);
      this.bigText(c, T('levelDone'), w / 2, h * 0.2, 44, '#ffd040');
      this.bigText(c, this.L(g.def.name).toUpperCase(), w / 2, h * 0.28, 24, '#fff');
      const rows = [[T('kills'), `${st.kills} / ${st.total}`], [T('secrets'), `${st.secrets} / ${st.secretsTotal}`], [T('time'), this.fmtTime(st.time)], [T('score'), String(st.score)]];
      rows.forEach(([a, b], i) => { const y = h * 0.4 + i * 42; if (this.statsT < 0.3 + i * 0.35) return; this.bigText(c, a, w / 2 - 20, y, 26, '#9fd4ff', 'right'); this.bigText(c, b, w / 2 + 20, y, 26, '#fff', 'left'); });
      if (this.statsT > 1.5) this.bigText(c, T('next'), w / 2, h * 0.82, 18, '#fff');
    }
    drawVictory(c, w, h) {
      c.fillStyle = `rgba(0,0,0,${Math.min(0.85, this.victoryT * 0.3)})`; c.fillRect(0, 0, w, h);
      const lines = this.S.victory; lines.forEach((l, i) => { if (this.victoryT > i * 1.2) this.bigText(c, l, w / 2, h * 0.3 + i * 40, i === 0 ? 30 : 20, i === lines.length - 1 ? '#ffd040' : '#fff'); });
      if (this.game) this.bigText(c, `${this.t('score')}: ${this.game.stats.score}`, w / 2, h * 0.75, 24, '#ffe070');
    }
    drawMenu(c, w, h, k) {
      const inGame = !!this.game && this.state !== 'title';
      c.fillStyle = inGame ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.25)'; c.fillRect(0, 0, w, h);
      // logo
      const ly = inGame ? 90 : 110;
      c.save(); c.translate(w / 2, ly);
      const grd = c.createLinearGradient(0, -40, 0, 30); grd.addColorStop(0, '#fff6c0'); grd.addColorStop(0.5, '#ffb020'); grd.addColorStop(1, '#a04000');
      c.font = `64px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 8; c.strokeStyle = '#1a0a00'; c.strokeText(this.t('title'), 0, 0); c.fillStyle = grd; c.fillText(this.t('title'), 0, 0);
      c.font = `22px ${FONT}`; c.lineWidth = 4; c.strokeText(this.t('subtitle'), 0, 44); c.fillStyle = '#e8e0ff'; c.fillText(this.t('subtitle'), 0, 44);
      c.restore();
      const it = this.menuItems, top = ly + 110, lh = this.menu === 'controls' ? 26 : 38;
      const title = { skill: this.t('difficulty'), levels: this.t('levelSelect'), options: this.t('options'), controls: this.t('controls'), pause: this.t('paused') }[this.menu];
      if (title) this.bigText(c, title, w / 2, top - 30, 22, '#9fd4ff');
      it.forEach((m, i) => {
        const y = top + 10 + i * lh, sel = i === this.menuSel && !m.text;
        const size = m.text ? 16 : 28, color = m.text ? '#e0e8ff' : sel ? '#ffe070' : '#ffffff';
        if (m.value) {
          this.bigText(c, m.label.toUpperCase(), w / 2 - 20, y, 22, color, 'right');
          this.bigText(c, (sel ? '◄ ' : '') + m.value() + (sel ? ' ►' : ''), w / 2 + 20, y, 22, sel ? '#ffe070' : '#9fd4ff', 'left');
          c.font = `22px ${FONT}`; const valueMid = w / 2 + 20 + c.measureText('◄ ' + m.value() + ' ►').width / 2;
          this.itemRects[i] = [(w / 2 - 300) * k, (y - lh / 2) * k, (w / 2 + 300) * k, (y + lh / 2) * k, valueMid * k];
        } else {
          this.bigText(c, m.label, w / 2, y, size, color);
          c.font = `${size}px ${FONT}`; const tw = c.measureText(m.label).width;
          this.itemRects[i] = [(w / 2 - tw / 2 - 20) * k, (y - lh / 2) * k, (w / 2 + tw / 2 + 20) * k, (y + lh / 2) * k];
        }
        if (sel && !m.value) { c.fillStyle = '#ffb020'; c.beginPath(); c.moveTo(w / 2 - c.measureText(m.label).width / 2 - 30, y - 8); c.lineTo(w / 2 - c.measureText(m.label).width / 2 - 16, y); c.lineTo(w / 2 - c.measureText(m.label).width / 2 - 30, y + 8); c.fill(); }
      });
      c.font = `12px Tahoma, Arial, sans-serif`; c.fillStyle = 'rgba(255,255,255,0.6)'; c.textAlign = 'center'; c.fillText('Croteam-style fan remake for Win 98 · WebGL', w / 2, h - 16);
    }

    debugRows() {
      const g = this.game, p = g.player, D = this.S.dbg, say = s => { this.dbgNote = s; };
      const onoff = v => (v ? this.t('on') : this.t('off')), mul = v => (v === 1 ? D.normal : `×${v}`);
      const step = (list, v, d) => list[(list.indexOf(v) + d + list.length) % list.length];
      const picked = () => WEAPON_ORDER[this.dbgPick], wname = w => this.L(WEAPONS[w].name).toUpperCase();
      const owned = w => p.weapons.has(w) && (w !== 'colt' || p.dual);
      return [
        { head: D.player },
        { label: D.god, value: () => onoff(p.god), on: () => p.god, act: () => { p.god = !p.god; say(p.god ? D.godOn : D.godOff); } },
        { label: D.heal, value: () => `${D.hp} ${Math.ceil(p.hp)}`, act: () => { if (g.debugHeal()) { this.state = 'play'; this.deadT = 0; this.flash.r = 0; say(D.revived); } else say(D.healed); } },
        { label: D.armor, value: () => `${D.ar} ${Math.ceil(p.armor)}`, act: () => { g.debugArmor(); say(D.armored); } },
        { head: D.move },
        { label: D.noclip, value: () => onoff(p.noclip), on: () => p.noclip, act: () => { g.setNoclip(!p.noclip); say(p.noclip ? D.flyOn : D.flyOff); } },
        { label: D.run, value: () => mul(p.runMul), adj: d => { p.runMul = step(RUN_MULS, p.runMul, d); say(`${D.runSet}: ${mul(p.runMul)}`); } },
        { label: D.jump, value: () => mul(p.jumpMul), adj: d => { p.jumpMul = step(JUMP_MULS, p.jumpMul, d); say(`${D.jumpSet}: ${mul(p.jumpMul)}`); } },
        { head: D.arms },
        { label: D.give, value: () => wname(picked()) + (owned(picked()) ? ` · ${D.owned}` : ''), pick: true,
          adj: d => { this.dbgPick = (this.dbgPick + d + WEAPON_ORDER.length) % WEAPON_ORDER.length; },
          act: () => { const w = picked(); g.debugGive(w); this.wsel = 1.6; say(`${D.given}: ${w === 'colt' ? D.dual : wname(w)}`); } },
        { label: D.all, act: () => { g.debugGiveAll(); this.wsel = 1.6; say(D.allGiven); } },
        { label: D.inf, value: () => onoff(p.infAmmo), on: () => p.infAmmo, act: () => { p.infAmmo = !p.infAmmo; if (p.infAmmo) { p.clip = p.dual ? 12 : 6; p.reloadT = 0; } say(p.infAmmo ? D.infOn : D.infOff); } }
      ];
    }
    debugTags(p) {
      const tags = [];
      if (p.god) tags.push('GOD');
      if (p.noclip) tags.push('NOCLIP');
      if (p.runMul !== 1) tags.push(`RUN ×${p.runMul}`);
      if (p.jumpMul !== 1) tags.push(`JUMP ×${p.jumpMul}`);
      if (p.infAmmo) tags.push('AMMO ∞');
      return tags.join('   ');
    }
    keepDebugFlags(prev) {
      const p = this.game.player;
      p.god = prev.god; p.infAmmo = prev.infAmmo; p.runMul = prev.runMul; p.jumpMul = prev.jumpMul;
      if (prev.noclip) this.game.setNoclip(true);
    }
    openDebug() {
      this.debug = true; this.keys.clear(); this.mouse.fire = false; this.mouse.alt = false; this.showLog = false;
      this.dbgRows = this.debugRows(); this.dbgNote = null;
      if (!this.dbgRows[this.dbgSel] || this.dbgRows[this.dbgSel].head) this.dbgSel = this.dbgRows.findIndex(r => !r.head);
      this.audio.pause(true); this.unlock();
    }
    closeDebug() {
      this.debug = false; this.dbgRects = [];
      this.audio.pause(false);
      if (this.state === 'play') this.lock();
      this.root.focus({ preventScroll: true });
    }
    debugKey(c, repeat) {
      const rows = this.dbgRows, n = rows.length, row = rows[this.dbgSel];
      const move = d => { let i = this.dbgSel; for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (!rows[i].head) break; } this.dbgSel = i; };
      if (c === 'F7' || c === 'Escape') { if (!repeat) this.closeDebug(); }
      else if (c === 'ArrowUp' || c === 'KeyW') move(-1);
      else if (c === 'ArrowDown' || c === 'KeyS') move(1);
      else if (c === 'ArrowLeft' || c === 'KeyA') { if (row.adj) row.adj(-1); }
      else if (c === 'ArrowRight' || c === 'KeyD') { if (row.adj) row.adj(1); }
      else if ((c === 'Enter' || c === 'NumpadEnter' || c === 'Space') && !repeat) this.debugApply(row, 1);
    }
    debugApply(row, d) { if (!row || row.head) return; if (row.act) row.act(); else if (row.adj) row.adj(d); }
    debugHit(e) {
      const r = this.hud.getBoundingClientRect(), x = (e.clientX - r.left) * (this.hud.width / r.width), y = (e.clientY - r.top) * (this.hud.height / r.height);
      for (let i = 0; i < this.dbgRects.length; i++) { const b = this.dbgRects[i]; if (b && x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) return { i, x, b }; }
      return null;
    }
    debugHover(e) { const h = this.debugHit(e); if (h) this.dbgSel = h.i; }
    debugClick(e) {
      const h = this.debugHit(e); if (!h) return;
      const row = this.dbgRows[h.i], inValue = h.x >= h.b[4], dir = h.x < (h.b[4] + h.b[2]) / 2 ? -1 : 1;
      this.dbgSel = h.i;
      if (row.pick && inValue) row.adj(dir);
      else if (!row.act && row.adj) row.adj(inValue ? dir : 1);
      else this.debugApply(row, 1);
    }
    drawDebug(c, w, h, k) {
      const rows = this.dbgRows, D = this.S.dbg, x = 16, pw = Math.min(430, w - 32), y0 = 44, headH = 26, rowH = 30;
      const listH = rows.reduce((s, r) => s + (r.head ? headH : rowH), 0);
      c.font = '13px Tahoma, Arial, sans-serif';
      const note = this.dbgNote ? this.wrap(c, this.dbgNote, pw - 32) : [];
      const ph = 66 + listH + 18 + Math.max(1, note.length) * 17 + 8;
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 0, w, h);
      this.panel(c, x, y0, pw, ph, 0.95);
      this.bigText(c, D.title, x + 16, y0 + 24, 28, '#ffe070', 'left');
      c.font = '12px Tahoma, Arial, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillStyle = '#ff9060'; c.fillText(D.paused.toUpperCase(), x + pw - 16, y0 + 24);
      c.font = '11px Tahoma, Arial, sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(220,235,255,0.75)'; c.fillText(D.keys, x + 16, y0 + 50);
      let y = y0 + 66;
      this.dbgRects = [];
      rows.forEach((row, i) => {
        if (row.head) {
          c.font = 'bold 11px Tahoma, Arial, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#6fe0ff';
          const ty = y + headH / 2 + 3, tw = c.measureText(row.head).width; c.fillText(row.head, x + 16, ty);
          c.strokeStyle = 'rgba(111,224,255,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 24 + tw, ty + 0.5); c.lineTo(x + pw - 16, ty + 0.5); c.stroke();
          y += headH; return;
        }
        const sel = i === this.dbgSel, cy = y + rowH / 2, vx = x + pw * 0.52;
        if (sel) {
          c.fillStyle = 'rgba(255,208,64,0.16)'; c.fillRect(x + 6, y + 2, pw - 12, rowH - 4);
          c.fillStyle = '#ffb020'; c.beginPath(); c.moveTo(x + 11, cy - 6); c.lineTo(x + 20, cy); c.lineTo(x + 11, cy + 6); c.fill();
        }
        this.bigText(c, row.label.toUpperCase(), x + 26, cy, 18, sel ? '#ffe070' : '#ffffff', 'left');
        if (row.value) {
          const v = row.value(), arrows = row.adj && sel, color = row.on ? (row.on() ? '#7dff7a' : '#8a96a8') : sel ? '#ffe070' : '#9fd4ff';
          this.bigText(c, arrows ? `◄ ${v} ►` : v, x + pw - 16, cy, 16, color, 'right');
        }
        this.dbgRects[i] = [(x + 6) * k, y * k, (x + pw - 6) * k, (y + rowH) * k, vx * k];
        y += rowH;
      });
      y += 10;
      c.strokeStyle = 'rgba(120,200,255,0.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 16, y + 0.5); c.lineTo(x + pw - 16, y + 0.5); c.stroke();
      c.font = '13px Tahoma, Arial, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = '#d0ffd0';
      note.forEach((l, i) => c.fillText(l, x + 16, y + 8 + i * 17));
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true; this.unlock(); cancelAnimationFrame(this.raf); this.ac.abort(); if (this.ro) this.ro.disconnect();
      this.audio.destroy(); if (this.renderer) this.renderer.destroy();
      this.root.replaceChildren(); this.root.classList.remove('ss98');
    }
  }

  S.UI = UI;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.SeriousSam98 = globalThis.SeriousSam98 || {});
