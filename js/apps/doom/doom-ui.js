/**
 * Doom 98 — DOM front end: 4:3 stage scaled into the window, framebuffer canvas + text overlay,
 * keyboard/mouse (pointer lock) input, Doom-style menus, intermission, finale, messages, cheats,
 * save slots and the 35 Hz fixed-step loop with interpolated rendering.
 */
(function (D) {
  'use strict';
  const { STR, TICRATE, SKILLS } = D.DATA;
  const OPT_KEY = 'doom98-options', SAVE_KEY = n => `doom98-save-${n}`, SLOTS = 6;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } } };
  const TIC = 1000 / TICRATE;
  const CHEATS = ['iddqd', 'idkfa', 'idfa', 'idclip', 'idspispopd', 'idchoppers', 'idbehold', 'idmypos', 'iddt'];

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts; this.ac = new AbortController();
      root.classList.add('dm98'); root.tabIndex = 0;
      root.innerHTML = `<div class="dm98-stage"><canvas class="dm98-view"></canvas><canvas class="dm98-over"></canvas><div class="dm98-hint"></div></div>`;
      this.stage = root.querySelector('.dm98-stage'); this.view = root.querySelector('.dm98-view'); this.over = root.querySelector('.dm98-over'); this.hintEl = root.querySelector('.dm98-hint');
      this.vctx = this.view.getContext('2d'); this.octx = this.over.getContext('2d');
      this.options = { sens: 5, sfx: 0.8, music: 0.5, detail: 1, hud: 'bar', messages: true, autorun: false, freelook: false, gamma: 0 };
      try { Object.assign(this.options, JSON.parse(store.get(OPT_KEY)) || {}); } catch (_) {}
      this.lang = opts.lang || ((globalThis.i18n && globalThis.i18n.getLanguage && globalThis.i18n.getLanguage()) === 'en' ? 'en' : 'ru');
      this.S = STR[this.lang];
      this.audio = new D.Audio(); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music;
      this.renderer = null; this.game = null; this.state = 'title'; this.menu = null; this.menuStack = [];
      this.keys = new Set(); this.mouse = { dx: 0, dy: 0, fire: false, use: false }; this.cheatBuf = ''; this.message = null; this.automap = null;
      this.acc = 0; this.last = 0; this.turnHeld = 0; this.wheel = 0;
      this.setupRenderer();
      this.skullPics = [this.picCanvas(this.renderer.G.sprites.SKULA), this.picCanvas(this.renderer.G.sprites.SKULB)];
      this.bind();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); this.resize();
      this.startDemo();
      this.openMenu('main');
      this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
      if (this.opts.onReady) this.opts.onReady(this);
    }
    t(k, vars) { let s = this.S[k] != null ? this.S[k] : k; if (vars) for (const v in vars) s = s.replace(`{${v}}`, vars[v]); return s; }
    mapName(info) { return info && info.name ? (info.name[this.lang] || info.name.en) : ''; }
    setupRenderer() {
      const [w, h] = this.options.detail ? [640, 400] : [320, 200];
      if (!this.renderer) this.renderer = new D.Renderer(w, h); else this.renderer.resize(w, h);
      this.renderer.hud = this.options.hud; this.renderer.freelook = this.options.freelook; this.renderer.gamma = this.options.gamma; this.renderer.cmKey = null; this.renderer.buildColormaps();
      this.view.width = w; this.view.height = h;
      this.img = new ImageData(new Uint8ClampedArray(this.renderer.fb.buffer), w, h);
    }
    saveOptions() { store.set(OPT_KEY, JSON.stringify(this.options)); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music; this.audio.applyVolume(); }
    picCanvas(pic) { const c = document.createElement('canvas'); c.width = pic.w; c.height = pic.h; c.getContext('2d').putImageData(new ImageData(this.renderer.picRGBA(pic), pic.w, pic.h), 0, 0); return c; }

    // ---------------------------------------------------------------- layout
    resize() {
      const r = this.root.getBoundingClientRect(); if (!r.width || !r.height) return;
      let w = r.width, h = w * 3 / 4; if (h > r.height) { h = r.height; w = h * 4 / 3; }
      Object.assign(this.stage.style, { width: w + 'px', height: h + 'px', left: (r.width - w) / 2 + 'px', top: (r.height - h) / 2 + 'px' });
      const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
      this.over.width = Math.round(w * dpr); this.over.height = Math.round(h * dpr);
    }

    // ---------------------------------------------------------------- input
    bind() {
      const sig = { signal: this.ac.signal }, root = this.root;
      root.addEventListener('keydown', e => this.keyDown(e), sig);
      root.addEventListener('keyup', e => { this.keys.delete(e.code); if (e.code === 'Tab' || e.code.startsWith('F') && e.code.length <= 3) e.preventDefault(); }, sig);
      root.addEventListener('contextmenu', e => e.preventDefault(), sig);
      root.addEventListener('mousedown', e => {
        this.audio.ensure(); root.focus({ preventScroll: true });
        if (this.menu) { this.menuClick(e); return; }
        if (this.state === 'inter' || this.state === 'finale') { this.advance(); return; }
        if (this.state !== 'play') return;
        if (!this.locked() && this.view.requestPointerLock && !this.lockDenied) { try { const p = this.view.requestPointerLock(); if (p && p.catch) p.catch(() => { this.lockDenied = true; }); } catch (_) { this.lockDenied = true; } }
        if (e.button === 0) this.mouse.fire = true; else if (e.button === 2 || e.button === 1) this.mouse.use = true;
        e.preventDefault();
      }, sig);
      document.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.fire = false; else this.mouse.use = false; }, sig);
      document.addEventListener('mousemove', e => {
        if (this.locked()) { this.mouse.dx += e.movementX || 0; this.mouse.dy += e.movementY || 0; }
        else if (this.menu && this.stage.contains(e.target)) this.menuHover(e);
      }, sig);
      root.addEventListener('wheel', e => { if (this.state === 'play' && !this.menu) { e.preventDefault(); if (this.automap) this.automap.zoom *= e.deltaY > 0 ? 0.85 : 1.18; else this.wheel += Math.sign(e.deltaY); } }, Object.assign({ passive: false }, sig));
      document.addEventListener('pointerlockchange', () => { if (!this.locked() && this.state === 'play' && !this.menu && !this.destroyed && this.wasLocked) this.openMenu('main'); this.wasLocked = this.locked(); }, sig);
      window.addEventListener('blur', () => { this.keys.clear(); this.mouse.fire = this.mouse.use = false; }, sig);
    }
    locked() { return document.pointerLockElement === this.view; }
    unlock() { if (this.locked() && document.exitPointerLock) document.exitPointerLock(); }
    keyDown(e) {
      const c = e.code, k = e.key;
      this.audio.ensure();
      if (['Tab', 'F1', 'F2', 'F3', 'F6', 'F9', 'F11', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c) || e.ctrlKey && c !== 'ControlLeft' && c !== 'ControlRight') e.preventDefault();
      if (this.menu) { this.menuKey(e); return; }
      if (this.state === 'inter' || this.state === 'finale') { if (!e.repeat) this.advance(); return; }
      if (this.state !== 'play') { this.openMenu('main'); return; }
      if (c === 'Escape') { this.unlock(); this.openMenu('main'); return; }
      if (c === 'Pause' || (c === 'KeyP' && !this.cheatActive())) { this.paused = !this.paused; return; }
      if (c === 'F1') { this.openMenu('help'); return; }
      if (c === 'F2') { this.openMenu('save'); return; }
      if (c === 'F3') { this.openMenu('load'); return; }
      if (c === 'F6') { this.quickSave(); return; }
      if (c === 'F9') { this.quickLoad(); return; }
      if (c === 'F11') { this.options.gamma = (this.options.gamma + 1) % 5; this.saveOptions(); this.renderer.gamma = this.options.gamma; this.renderer.cmKey = null; this.showMsg(`${this.t('gamma')} ${this.options.gamma}`); return; }
      if (c === 'Tab') { this.automap = this.automap ? null : { zoom: 0.2, follow: true, cheat: this.amCheat || 0 }; return; }
      if (this.automap && (k === '+' || k === '=' || c === 'NumpadAdd')) { this.automap.zoom *= 1.25; return; }
      if (this.automap && (k === '-' || c === 'NumpadSubtract')) { this.automap.zoom /= 1.25; return; }
      if (this.automap && c === 'KeyF' && !this.cheatActive()) { this.automap.follow = !this.automap.follow; if (!this.automap.follow) { this.automap.x = this.game.player.mo.x; this.automap.y = this.game.player.mo.y; } this.showMsg(this.automap.follow ? 'Follow ON' : 'Follow OFF'); return; }
      if (/^Digit[1-7]$/.test(c) && !this.cheatActive()) this.pendingSlot = +c.slice(5);
      if (k && k.length === 1 && /[a-z0-9]/i.test(k)) this.cheatKey(k.toLowerCase());
      this.keys.add(c);
    }
    cheatActive() { return this.cheatBuf.length >= 2 && this.cheatBuf.endsWith('id') || /id[a-z]*$/.test(this.cheatBuf) && CHEATS.some(ch => ch.startsWith(this.cheatBuf.match(/id[a-z]*$/)[0])) || /idclev\d?$|idbehold$/.test(this.cheatBuf); }
    cheatKey(ch) {
      this.cheatBuf = (this.cheatBuf + ch).slice(-12);
      const b = this.cheatBuf, g = this.game;
      let code = null;
      const lev = /idclev(\d\d)$/.exec(b), beh = /idbehold([vsirla])$/.exec(b);
      if (lev) code = 'idclev' + lev[1]; else if (beh) code = beh[0];
      else for (const c of ['iddqd', 'idkfa', 'idfa', 'idclip', 'idspispopd', 'idchoppers', 'idmypos', 'iddt']) if (b.endsWith(c) && !(c === 'idfa' && b.endsWith('idkfa'))) { code = c; break; }
      if (!code && b.endsWith('idbehold')) { this.showMsg(this.t('behold')); return; }
      if (!code) return;
      this.cheatBuf = '';
      if (code === 'iddt') { this.amCheat = ((this.amCheat || 0) + 1) % 3; if (this.automap) this.automap.cheat = this.amCheat; return; }
      const r = g.cheat(code);
      if (r) { if (typeof r === 'object') this.showMsg(this.t(r.key, r.vars)); else this.showMsg(this.t(r)); }
    }
    buildCmd() {
      const K = this.keys, o = this.options;
      const run = o.autorun !== (K.has('ShiftLeft') || K.has('ShiftRight'));
      const strafe = K.has('AltLeft') || K.has('AltRight');
      let fwd = 0, side = 0, turn = 0;
      if (K.has('KeyW') || K.has('ArrowUp')) fwd += run ? 50 : 25;
      if (K.has('KeyS') || K.has('ArrowDown')) fwd -= run ? 50 : 25;
      if (K.has('KeyD')) side += run ? 40 : 24;
      if (K.has('KeyA')) side -= run ? 40 : 24;
      const left = K.has('ArrowLeft'), right = K.has('ArrowRight');
      if (strafe) { if (right) side += run ? 40 : 24; if (left) side -= run ? 40 : 24; }
      else if (left || right) { this.turnHeld++; const sp = (this.turnHeld < 6 ? 320 : run ? 1280 : 640) / 65536 * Math.PI * 2; turn = (left ? sp : 0) - (right ? sp : 0); }
      else this.turnHeld = 0;
      const cmd = { forward: fwd, side, turn, fire: this.mouse.fire || K.has('ControlLeft') || K.has('ControlRight'), use: this.mouse.use || K.has('KeyE') || K.has('Space'), pitch: this.pitch || 0 };
      if (this.pendingSlot) { cmd.weapon = this.pendingSlot; this.pendingSlot = 0; }
      if (this.wheel) { cmd.weaponStep = Math.sign(this.wheel); this.wheel = 0; }
      return cmd;
    }

    // ---------------------------------------------------------------- game flow
    startDemo() {
      const map = D.MAPS[0];
      this.demo = new D.Game({ map: map.id, skill: 2, seed: 7 });
      this.demo.player.notarget = true; this.demo.player.mo.flags &= ~D.DATA.MF.SHOOTABLE;
      const d = map.demo || { x: 256, y: 200, angle: 90 };
      const mo = this.demo.player.mo; mo.x = mo.px = d.x; mo.y = mo.py = d.y; this.demoAng = d.angle * Math.PI / 180;
      this.audio.setMusic('title');
    }
    newGame(skill, mapId) {
      this.game = new D.Game({ skill, map: mapId || D.MAPS[0].id, seed: (Date.now() & 0xffff) + 1 });
      this.enterLevel();
    }
    enterLevel() {
      this.state = 'play'; this.closeMenus(); this.automap = null; this.paused = false; this.acc = 0; this.message = null;
      this.audio.setMusic(this.game.info.music || 'e1m1');
      this.showMsg(this.mapName(this.game.info));
      this.hint(this.t('click_mouse'));
    }
    handleEvents() {
      const g = this.game, p = g.player;
      for (const e of g.events) {
        if (e.t === 'sound') this.playSound(e);
        else if (e.t === 'msg') { if (this.options.messages || e.key === 'secret') this.showMsg(e.text || this.t(e.key, e.vars)); }
        else if (e.t === 'hurt') { if (!this.painCool || g.leveltime - this.painCool > 12) { this.painCool = g.leveltime; if (p.health > 0) this.audio.play('plpain', 1, 0, 'player-voice'); } }
        else if (e.t === 'exit') this.levelDone(e.secret);
        else if (e.t === 'reborn') { g.reborn(); this.enterLevel(); }
        else if (e.t === 'warp') { g.startMap(e.id); this.enterLevel(); }
        else if (e.t === 'death') this.hint(this.lang === 'ru' ? 'Нажмите «Использовать» (E / Пробел), чтобы начать уровень заново' : 'Press USE (E / Space) to restart the level');
      }
      g.events.length = 0;
    }
    playSound(e) {
      const g = this.game || this.demo, mo = g.player.mo;
      if (e.player || !mo) { this.audio.play(e.name, 1, 0, e.mo && e.mo.id != null ? e.mo.id : null); return; }
      const dx = e.x - mo.x, dy = e.y - mo.y, dist = Math.hypot(dx, dy);
      if (dist > 1200) return;
      const vol = dist < 160 ? 1 : (1200 - dist) / 1040;
      const rel = Math.atan2(dy, dx) - mo.angle, pan = -Math.sin(rel) * 0.75;
      this.audio.play(e.name, vol, pan, e.mo && e.mo.id != null ? e.mo.id : null);
    }
    showMsg(text) { this.message = { text, until: performance.now() + 4000 }; }
    hint(text) { this.hintEl.textContent = text; this.hintEl.classList.add('on'); clearTimeout(this.hintT); this.hintT = setTimeout(() => this.hintEl.classList.remove('on'), 4500); }
    levelDone(secret) {
      const g = this.game; this.unlock();
      this.stats = g.stats(); this.stats.secret = secret;
      this.nextId = g.nextMapId(secret);
      this.state = 'inter'; this.interT = 0; this.interStage = 0; this.automap = null;
      this.audio.setMusic('inter');
    }
    advance() {
      if (this.state === 'inter') {
        if (this.interStage < 5) { this.interStage = 5; this.audio.play('barexp', 0.6); return; }
        if (!this.nextId) { this.state = 'finale'; this.finaleT = 0; this.audio.setMusic('finale'); return; }
        this.game.startMap(this.nextId); this.enterLevel(); return;
      }
      if (this.state === 'finale') {
        const len = this.t('e1text').length;
        if (this.finaleT < len * 3 * TIC) { this.finaleT = len * 3 * TIC + 1; return; }
        this.game = null; this.state = 'title'; this.startDemo(); this.openMenu('main');
      }
    }
    quickSave() { if (!this.canSave()) { this.showMsg(this.t('cant_save')); return; } this.saveSlot(this.quickSlot != null ? this.quickSlot : 0); this.showMsg(this.t('quicksave')); }
    quickLoad() { const n = this.quickSlot != null ? this.quickSlot : 0; if (!store.get(SAVE_KEY(n))) { this.showMsg(this.t('cant_load_empty')); return; } this.loadSlot(n); }
    canSave() { return this.game && this.state === 'play' && !this.game.player.dead; }
    slotInfo(n) { try { const r = JSON.parse(store.get(SAVE_KEY(n))); return r ? r.name : null; } catch (_) { return null; } }
    saveSlot(n) {
      const g = this.game, d = new Date(), pad = x => String(x).padStart(2, '0');
      const name = `${this.mapName(g.info)} ${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      if (store.set(SAVE_KEY(n), JSON.stringify({ name, data: g.serialize() }))) { this.quickSlot = n; this.showMsg(this.t('saved')); }
    }
    loadSlot(n) {
      try {
        const r = JSON.parse(store.get(SAVE_KEY(n))); if (!r) return false;
        this.game = D.Game.deserialize(r.data); this.quickSlot = n;
        this.enterLevel(); this.showMsg(this.t('loaded')); return true;
      } catch (err) { console.warn('Doom98 load failed', err); this.showMsg('Load failed'); return false; }
    }

    // ---------------------------------------------------------------- menus
    menus() {
      const o = this.options, t = k => this.t(k);
      return {
        main: { title: 'logo', x: 94, y: 70, items: [
          { label: t('newgame'), act: () => this.openMenu('skill') }, { label: t('options'), act: () => this.openMenu('options') },
          { label: t('loadgame'), act: () => this.openMenu('load') }, { label: t('savegame'), act: () => { if (this.canSave()) this.openMenu('save'); else this.showMsg(t('cant_save')); } },
          { label: t('readthis'), act: () => this.openMenu('help') }, { label: t('quitgame'), act: () => this.openMenu('quit') }] },
        skill: { title: t('newgame'), sub: t('choose_skill'), x: 40, y: 72, items: [0, 1, 2, 3, 4].map(i => ({ label: t('skill' + i), act: () => { if (i === 4) this.openMenu('nightmare'); else this.newGame(i); } })) },
        nightmare: { confirm: t('nightmare'), yes: () => this.newGame(4), no: () => this.backMenu() },
        quit: { confirm: this.quitMsg || (this.quitMsg = t('quit_msgs')[Math.floor(Math.random() * t('quit_msgs').length)] + '\n\n' + t('quit_hint')), yes: () => this.quit(), no: () => { this.quitMsg = null; this.backMenu(); } },
        options: { title: t('options'), x: 40, y: 50, items: [
          { label: t('messages'), value: () => o.messages ? t('on') : t('off'), act: () => { o.messages = !o.messages; this.saveOptions(); } },
          { label: t('detail'), value: () => o.detail ? t('detail_hi') : t('detail_lo'), act: () => { o.detail = o.detail ? 0 : 1; this.saveOptions(); this.setupRenderer(); } },
          { label: t('hud'), value: () => o.hud === 'bar' ? t('hud_bar') : t('hud_full'), act: () => { o.hud = o.hud === 'bar' ? 'full' : 'bar'; this.saveOptions(); this.renderer.hud = o.hud; } },
          { label: t('autorun'), value: () => o.autorun ? t('on') : t('off'), act: () => { o.autorun = !o.autorun; this.saveOptions(); } },
          { label: t('freelook'), value: () => o.freelook ? t('on') : t('off'), act: () => { o.freelook = !o.freelook; this.pitch = 0; this.saveOptions(); this.renderer.freelook = o.freelook; } },
          { label: t('mouse_sens'), slider: () => o.sens / 10, adj: d => { o.sens = Math.max(1, Math.min(10, o.sens + d)); this.saveOptions(); } },
          { label: t('sfx_vol'), slider: () => o.sfx, adj: d => { o.sfx = Math.max(0, Math.min(1, Math.round((o.sfx + d * 0.1) * 10) / 10)); this.saveOptions(); this.audio.play('pistol', 1); } },
          { label: t('music_vol'), slider: () => o.music, adj: d => { o.music = Math.max(0, Math.min(1, Math.round((o.music + d * 0.1) * 10) / 10)); this.saveOptions(); } },
          { label: t('gamma'), slider: () => o.gamma / 4, adj: d => { o.gamma = Math.max(0, Math.min(4, o.gamma + d)); this.saveOptions(); this.renderer.gamma = o.gamma; this.renderer.cmKey = null; } },
          { label: t('back'), act: () => this.backMenu() }] },
        load: { title: t('load_title'), x: 60, y: 50, slots: true, items: Array.from({ length: SLOTS }, (_, i) => ({ label: this.slotInfo(i) || `— ${t('empty_slot')} —`, act: () => { if (this.slotInfo(i)) this.loadSlot(i); else this.showMsg(t('cant_load_empty')); } })) },
        save: { title: t('save_title'), x: 60, y: 50, slots: true, items: Array.from({ length: SLOTS }, (_, i) => ({ label: this.slotInfo(i) || `— ${t('empty_slot')} —`, act: () => { this.saveSlot(i); this.closeMenus(); } })) },
        help: { help: true }
      };
    }
    openMenu(name) {
      if (this.menu) this.menuStack.push(this.menu);
      const m = this.menus()[name]; this.menu = Object.assign({ name, sel: 0 }, m);
      if (this.menu.name === 'main') this.menuStack = [];
      this.unlock(); this.audio.play('swtchn', 0.6);
    }
    backMenu() { this.menu = this.menuStack.pop() || null; if (this.menu) this.menu = Object.assign(this.menu, this.menus()[this.menu.name], { sel: this.menu.sel }); this.audio.play('swtchx', 0.5); if (!this.menu && this.state === 'title') this.openMenu('main'); }
    closeMenus() { this.menu = null; this.menuStack = []; }
    quit() { this.closeMenus(); this.quitMsg = null; if (this.opts.onExit) this.opts.onExit(); else { this.game = null; this.state = 'title'; this.startDemo(); this.openMenu('main'); } }
    menuKey(e) {
      const m = this.menu, c = e.code;
      if (m.confirm) { if (c === 'KeyY' || c === 'Enter') m.yes(); else if (c === 'KeyN' || c === 'Escape') m.no(); return; }
      if (m.help) { this.backMenu(); return; }
      if (c === 'Escape' || c === 'Backspace') { if (this.menuStack.length) this.backMenu(); else if (this.state === 'play') { this.closeMenus(); this.audio.play('swtchx', 0.5); } return; }
      const n = m.items.length;
      if (c === 'ArrowDown' || c === 'KeyS') { m.sel = (m.sel + 1) % n; this.audio.play('pstop', 0.5); }
      else if (c === 'ArrowUp' || c === 'KeyW') { m.sel = (m.sel + n - 1) % n; this.audio.play('pstop', 0.5); }
      else if ((c === 'ArrowLeft' || c === 'ArrowRight') && m.items[m.sel].adj) { m.items[m.sel].adj(c === 'ArrowLeft' ? -1 : 1); this.audio.play('stnmov', 0.6); }
      else if (c === 'Enter' || c === 'Space' || c === 'KeyE') { const it = m.items[m.sel]; if (it.act) { this.audio.play('pistol', 0.7); it.act(); } else if (it.adj) it.adj(1); }
    }
    stagePos(e) { const r = this.stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 320, y: (e.clientY - r.top) / r.height * 200 }; }
    menuItemAt(p) { const m = this.menu; if (!m || !m.items) return -1; const lh = m.slots ? 17 : m.name === 'options' ? 13 : 16; for (let i = 0; i < m.items.length; i++) { const y = m.y + i * lh; if (p.y >= y - 2 && p.y < y + lh - 2 && p.x >= m.x - 20 && p.x < 316) return i; } return -1; }
    menuHover(e) { const i = this.menuItemAt(this.stagePos(e)); if (i >= 0 && i !== this.menu.sel) this.menu.sel = i; }
    menuClick(e) {
      const m = this.menu;
      if (m.confirm) { if (e.button === 0) m.yes(); else m.no(); return; }
      if (m.help) { this.backMenu(); return; }
      if (e.button === 2) { if (this.menuStack.length) this.backMenu(); else if (this.state === 'play') this.closeMenus(); return; }
      const p = this.stagePos(e), i = this.menuItemAt(p); if (i < 0) return;
      m.sel = i; const it = m.items[i];
      if (it.adj) { it.adj(p.x < 200 ? -1 : 1); this.audio.play('stnmov', 0.6); } else if (it.act) { this.audio.play('pistol', 0.7); it.act(); }
    }

    // ---------------------------------------------------------------- loop
    isActive() { return !document.hidden && this.root.getClientRects().length && (!this.opts.isActive || this.opts.isActive()); }
    frame(now) {
      if (this.destroyed) return;
      const dt = Math.min(250, this.last ? now - this.last : 0); this.last = now;
      this.audio.applyVolume && this.audio.ctx && this.audio.applyVolume();
      const active = this.isActive();
      if (!active && this.locked()) this.unlock();
      const r = this.renderer;
      if (this.state === 'play' && this.game) {
        const g = this.game, p = g.player, paused = this.paused || !!this.menu || !active;
        // mouse look applied immediately for responsiveness
        if (!paused && (this.mouse.dx || this.mouse.dy) && !p.dead) {
          const s = this.options.sens * 0.00055;
          p.mo.angle = D.normAng(p.mo.angle - this.mouse.dx * s * 2.2); p.pangle = p.mo.angle;
          if (this.options.freelook) this.pitch = Math.max(-0.5, Math.min(0.5, (this.pitch || 0) - this.mouse.dy * s * 1.5));
        }
        this.mouse.dx = this.mouse.dy = 0;
        if (!paused) {
          this.acc += dt; let n = 0;
          while (this.acc >= TIC && n++ < 8) { g.tick(this.buildCmd()); this.acc -= TIC; this.handleEvents(); if (this.state !== 'play' || this.game !== g) break; }
          if (this.acc > TIC * 8) this.acc = 0;
        }
        if (this.state === 'play' && this.game) {
          const am = this.automap ? Object.assign({}, this.automap) : null;
          if (am && !am.follow) { const K = this.keys, sp = 12 / am.zoom * 0.05; if (K.has('ArrowLeft')) this.automap.x -= sp; if (K.has('ArrowRight')) this.automap.x += sp; if (K.has('ArrowUp')) this.automap.y += sp; if (K.has('ArrowDown')) this.automap.y -= sp; }
          r.render(this.game, paused ? 1 : Math.min(1, this.acc / TIC), { automap: am, interpAngle: false });
          this.vctx.putImageData(this.img, 0, 0);
        }
      } else if (this.state === 'title' || !this.game) {
        const g = this.demo;
        this.acc += dt; let n = 0; while (this.acc >= TIC && n++ < 4) { g.tick({}); g.events.length = 0; this.acc -= TIC; }
        this.demoAng += dt * 0.00012;
        g.player.mo.angle = this.demoAng; g.player.pangle = this.demoAng;
        r.render(g, Math.min(1, this.acc / TIC), { noHud: true, noWeapon: true });
        this.vctx.putImageData(this.img, 0, 0);
      }
      if (this.state === 'inter') this.interT += dt;
      if (this.state === 'finale') this.finaleT += dt;
      this.drawOverlay(now);
      this.raf = requestAnimationFrame(this.frame);
    }

    // ---------------------------------------------------------------- overlay drawing (320x200 logical)
    font(size, bold = true) { return `${bold ? 'bold ' : ''}${size}px "Arial Black", Impact, "Franklin Gothic Heavy", sans-serif`; }
    text(str, x, y, size, color = '#c82010', align = 'left', stroke = true) {
      const c = this.octx; c.font = this.font(size); c.textAlign = align; c.textBaseline = 'top';
      if (stroke) { c.lineWidth = Math.max(1.5, size / 6); c.strokeStyle = '#1a0000'; c.lineJoin = 'round'; c.strokeText(str, x, y); }
      if (color === 'red') { const g = c.createLinearGradient(0, y, 0, y + size); g.addColorStop(0, '#ff6040'); g.addColorStop(0.5, '#d01808'); g.addColorStop(1, '#780000'); c.fillStyle = g; } else c.fillStyle = color;
      c.fillText(str, x, y);
    }
    drawOverlay(now) {
      const c = this.octx, W = this.over.width, H = this.over.height;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
      c.setTransform(W / 320, 0, 0, H / 200, 0, 0); c.imageSmoothingEnabled = false;
      if (this.state === 'inter') this.drawIntermission();
      else if (this.state === 'finale') this.drawFinale();
      else if (this.state === 'play' && this.game) {
        if (this.message && now < this.message.until) this.text(this.message.text, 3, 2, 7.5, '#e03828', 'left');
        if (this.automap) { const vh = this.options.hud === 'bar' ? 168 : 200; this.text(this.mapName(this.game.info), 3, vh - 10, 7, '#e8d060'); const s = this.game.stats(); this.text(`K ${s.kills}/${s.totalKills}  I ${s.items}/${s.totalItems}  S ${s.secrets}/${s.totalSecrets}`, 317, vh - 10, 6, '#c0c0c0', 'right'); }
        if (this.paused && !this.menu) this.text(this.t('paused'), 160, 70, 20, 'red', 'center');
        if (!this.menu && !this.isActive()) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 0, 320, 200); }
      }
      if (this.menu) this.drawMenu(now);
    }
    drawLogo(y) {
      const c = this.octx;
      c.save(); c.textAlign = 'center'; c.textBaseline = 'top'; c.font = this.font(46);
      for (let i = 6; i > 0; i--) { c.fillStyle = `rgb(${40 + i * 6},${12 + i * 2},0)`; c.fillText('DOOM', 160 + i * 0.6, y + i); }
      const g = c.createLinearGradient(0, y, 0, y + 46); g.addColorStop(0, '#ffe7a0'); g.addColorStop(0.35, '#f09020'); g.addColorStop(0.7, '#b83008'); g.addColorStop(1, '#5a0c00');
      c.fillStyle = g; c.fillText('DOOM', 160, y);
      c.lineWidth = 1; c.strokeStyle = '#2a0800'; c.strokeText('DOOM', 160, y);
      c.restore();
      this.text('98', 246, y + 30, 14, '#e8e8e8');
    }
    drawMenu(now) {
      const c = this.octx, m = this.menu;
      if (this.state !== 'title' || m.help || m.confirm) { c.fillStyle = m.help ? 'rgba(10,0,0,0.88)' : 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, 320, 200); }
      if (m.confirm) { const lines = m.confirm.split('\n'); lines.forEach((l, i) => this.text(l, 160, 70 + i * 11 - lines.length * 3, 8, '#e04030', 'center')); return; }
      if (m.help) {
        const lines = this.t('help'); this.text(lines[0], 160, 12, 16, 'red', 'center');
        lines.slice(1).forEach((l, i) => this.text(l, 30, 36 + i * 9.4, 6.5, '#e8c890', 'left', false));
        return;
      }
      if (m.title === 'logo') this.drawLogo(6); else { this.text(m.title, 160, 12, 18, 'red', 'center'); if (m.sub) this.text(m.sub, 160, 40, 9, '#e8d060', 'center'); }
      const lh = m.slots ? 17 : m.name === 'options' ? 13 : 16, size = m.slots ? 8 : m.name === 'options' ? 8.5 : 12;
      m.items.forEach((it, i) => {
        const y = m.y + i * lh;
        if (m.slots) { c.fillStyle = '#301008'; c.fillRect(m.x - 2, y - 2, 220, 13); c.strokeStyle = '#806040'; c.lineWidth = 0.5; c.strokeRect(m.x - 2, y - 2, 220, 13); }
        this.text(it.label, m.x, y, size, m.slots ? '#e8c890' : 'red');
        if (it.value) this.text(it.value(), 300, y, size, '#e8d060', 'right');
        if (it.slider) { const v = it.slider(), x0 = 190, w = 100; c.fillStyle = '#401010'; c.fillRect(x0, y + 2, w, 7); c.fillStyle = '#b08040'; for (let k = 0; k <= 10; k++) c.fillRect(x0 + k * w / 10, y + 1, 0.8, 9); c.fillStyle = '#ff5030'; c.fillRect(x0 + v * (w - 5), y, 5, 11); }
      });
      const skull = this.skullPics[Math.floor(now / 250) % 2], sy = m.y + m.sel * lh - (m.slots ? 3 : 2);
      c.drawImage(skull, m.x - 24, sy, 14 * (m.slots ? 0.9 : 1), 18 * (m.slots ? 0.9 : 1));
      if (this.state === 'title' && m.name === 'main') this.text(this.lang === 'ru' ? 'Фан-клон для Win 98. Графика и звук сделаны кодом.' : 'A Win 98 fan clone. All art & sound made in code.', 160, 188, 5.5, '#b09070', 'center', false);
    }
    drawIntermission() {
      const c = this.octx, s = this.stats, T = this.interT;
      const g = c.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#1a0604'); g.addColorStop(0.6, '#3a0c06'); g.addColorStop(1, '#120404'); c.fillStyle = g; c.fillRect(0, 0, 320, 200);
      c.fillStyle = 'rgba(255,120,40,0.07)'; for (let i = 0; i < 40; i++) { const x = (i * 97.3) % 320, h = 20 + (i * 37) % 60; c.fillRect(x, 200 - h, 6 + (i % 5) * 3, h); }
      this.text(this.mapName(s.map), 160, 8, 12, '#e8d060', 'center'); this.text(this.t('finished'), 160, 24, 11, 'red', 'center');
      const pct = (a, b) => b ? Math.round(a * 100 / b) : 100;
      const rows = [[this.t('kills'), pct(s.kills, s.totalKills), '%'], [this.t('items'), pct(s.items, s.totalItems), '%'], [this.t('secrets'), pct(s.secrets, s.totalSecrets), '%']];
      const stage = this.interStage >= 5 ? 5 : Math.floor(T / 700);
      if (this.interStage < 5 && stage !== this.lastStage) { this.lastStage = stage; if (stage <= 4) this.audio.play('pistol', 0.5); }
      if (stage >= 5 && this.interStage < 5) this.interStage = 5;
      rows.forEach(([label, v, suf], i) => {
        if (stage < i) return;
        const shown = stage > i ? v : Math.min(v, Math.floor((T - i * 700) / 700 * v * 1.4));
        this.text(label, 50, 52 + i * 20, 12, 'red'); this.text(`${shown}${suf}`, 270, 52 + i * 20, 12, 'red', 'right');
      });
      const fmt = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
      if (stage >= 3) { this.text(this.t('time'), 30, 124, 11, 'red'); this.text(fmt(s.time), 150, 124, 11, 'red', 'right'); }
      if (stage >= 4) { this.text(this.t('par'), 180, 124, 11, 'red'); this.text(s.par ? fmt(s.par) : '—', 300, 124, 11, 'red', 'right'); }
      if (stage >= 5) {
        const next = this.nextId && D.MAPS.find(m => m.id === this.nextId);
        if (next) { this.text(this.t('entering'), 160, 150, 10, 'red', 'center'); this.text(this.mapName(next), 160, 164, 12, '#e8d060', 'center'); }
        if (s.secret && next) this.text(this.t('secret_enter'), 160, 182, 7, '#80ff80', 'center');
        if ((Math.floor(T / 500) & 1) === 0) this.text(this.t('press_key'), 160, 190, 6, '#b0a090', 'center', false);
      }
    }
    drawFinale() {
      const c = this.octx, T = this.finaleT;
      const g = c.createRadialGradient(160, 220, 10, 160, 180, 260); g.addColorStop(0, '#6a1004'); g.addColorStop(1, '#0a0202'); c.fillStyle = g; c.fillRect(0, 0, 320, 200);
      for (let i = 0; i < 60; i++) { const k = ((T / 4000) + i * 0.137) % 1; c.fillStyle = `rgba(255,${120 + (i % 5) * 25},40,${1 - k})`; c.fillRect((i * 53.7) % 320, 200 - k * 200, 1.5, 1.5); }
      const full = this.t('e1text'), n = Math.floor(T / (3 * TIC)), shown = full.slice(0, n);
      shown.split('\n').forEach((l, i) => this.text(l, 20, 16 + i * 11, 7.5, '#e8c890', 'left', true));
      if (n > full.length + 30) { this.text(this.t('skull_msg'), 160, 176, 12, 'red', 'center'); }
    }
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true; this.unlock(); cancelAnimationFrame(this.raf); this.ac.abort(); this.ro.disconnect(); this.audio.destroy(); clearTimeout(this.hintT); this.root.replaceChildren(); this.root.classList.remove('dm98');
    }
  }
  D.UI = UI;
})(globalThis.Doom98 = globalThis.Doom98 || {});
