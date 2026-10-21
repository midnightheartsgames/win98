/**
 * S.T.A.L.K.E.R. 98 — front end: WebGL view + HUD canvas + DOM windows, pointer-lock input, fixed 60 Hz loop with
 * interpolated camera (crouch, lean, drunk sway, death fall), X-Ray-style HUD (radar, health/stamina, status icons,
 * ammo, dynamic crosshair coloured by attitude, prompts, PDA news, subtitles), geiger & detector audio, saves.
 * The windows (inventory, trade, loot, dialogue, PDA, menus) live in st-windows.js.
 */
(function (S) {
  'use strict';
  const { clamp, lerp } = S;
  const D = S.DATA, IT = D.ITEMS;
  const OPT_KEY = 'stalker98-options', SAVE_PREFIX = 'stalker98-save-', INDEX_KEY = 'stalker98-saves';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } }, del(k) { try { localStorage.removeItem(k); } catch (_) {} } };
  const DT = S.GAME.DT;
  const RES = [0.33, 0.5, 0.75, 1];
  const FONT = '"Arial Narrow", "Tahoma", Arial, sans-serif';
  const SLOT_KEYS = { Digit1: 'knife', Digit2: 'pistol', Digit3: 'rifle', Digit4: 'grenade', Digit5: 'binoc', Digit6: 'bolt' };

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts; this.ac = new AbortController();
      root.classList.add('st98'); root.tabIndex = 0;
      root.innerHTML = '<canvas class="st98-gl"></canvas><canvas class="st98-hud"></canvas><div class="st98-win"></div><div class="st98-err"></div>';
      this.glc = root.querySelector('.st98-gl'); this.hud = root.querySelector('.st98-hud'); this.hctx = this.hud.getContext('2d'); this.winEl = root.querySelector('.st98-win');
      this.options = { sens: 6, invert: false, fov: 70, sfx: 0.8, music: 0.5, res: 2, grass: true, bob: true, fps: false, lang: null };
      try { Object.assign(this.options, JSON.parse(store.get(OPT_KEY)) || {}); } catch (_) {}
      this.lang = this.options.lang || opts.lang || ((globalThis.i18n && globalThis.i18n.getLanguage && globalThis.i18n.getLanguage()) === 'en' ? 'en' : 'ru');
      this.S = D.STR[this.lang];
      this.audio = new S.Audio(); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music;
      try { this.renderer = new S.Renderer(this.glc); this.renderer.grassOn = this.options.grass; } catch (err) { this.fail(err); return; }
      this.keys = new Set(); this.mouse = { fire: false, aim: false, dx: 0, dy: 0, wheel: 0 };
      this.state = 'title'; this.win = null; this.toasts = []; this.newsQ = []; this.newsCur = null; this.subs = []; this.flash = { r: 0, w: 0 }; this.hurtDir = null; this.hurtT = 0;
      this.acc = 0; this.last = 0; this.fpsT = 0; this.fpsN = 0; this.fps = 0; this.sway = [0, 0]; this.pend = {};
      this.detT = 0; this.detArtT = 0; this.heartT = 0; this.breathT = 0; this.shadeT = 0; this.shade = 1; this.camCrouch = 0;
      this.bind();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); this.resize();
      this.W = new S.Windows(this);
      this.loadDemo();
      this.W.mainMenu();
      this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
      if (opts.onReady) opts.onReady(this);
    }
    t(k) { return this.S[k] != null ? this.S[k] : k; }
    L(o) { return o == null ? '' : typeof o === 'string' ? o : (o[this.lang] || o.ru || o.en || ''); }
    fail(err) {
      this.failed = true; const el = this.root.querySelector('.st98-err');
      el.textContent = (this.lang === 'ru' ? 'Не удалось запустить 3D-графику (WebGL). ' : 'Could not start 3D graphics (WebGL). ') + (err && err.message ? err.message : ''); el.style.display = 'block';
    }
    saveOptions() { store.set(OPT_KEY, JSON.stringify(this.options)); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music; this.audio.applyVolume(); }

    // ================================================================ saves
    saveIndex() { try { return JSON.parse(store.get(INDEX_KEY)) || {}; } catch (_) { return {}; } }
    saveTo(slot, silent) {
      if (!this.game || this.game.player.dead) return false;
      const g = this.game, data = g.serialize();
      const ok = store.set(SAVE_PREFIX + slot, JSON.stringify(data));
      if (!ok) { if (!silent) this.toast(this.t('saveFail'), '#ff8060'); return false; }
      const idx = this.saveIndex(); idx[slot] = { level: g.levelId, name: this.L(g.def.name), time: g.time, date: Date.now(), skill: g.skill, rank: this.L(g.rank().name) }; store.set(INDEX_KEY, JSON.stringify(idx));
      this.lastSlot = slot;
      if (!silent) this.toast(this.t('saved'), '#c0f0a0');
      return true;
    }
    loadFrom(slot) {
      const raw = store.get(SAVE_PREFIX + slot); if (!raw) { this.toast(this.t('noSave'), '#ff8060'); return false; }
      let data; try { data = JSON.parse(raw); } catch (_) { this.toast(this.t('noSave'), '#ff8060'); return false; }
      this.W.close(); this.state = 'loading'; this.loadingName = ''; this.drawHud();
      setTimeout(() => {
        if (this.destroyed) return;
        try { this.game = S.Game.deserialize(data, { lang: this.lang }); }
        catch (err) { console.error(err); this.toast(this.t('noSave'), '#ff8060'); this.state = 'title'; this.loadDemo(); this.W.mainMenu(); return; }
        this.lastSlot = slot; this.enterGame(); this.toast(this.t('loaded'), '#c0f0a0');
      }, 30);
      return true;
    }
    latestSlot() { const idx = this.saveIndex(); let best = null; for (const k in idx) if (!best || idx[k].date > idx[best].date) best = k; return best; }

    // ================================================================ layout & input
    resize() {
      const r = this.root.getBoundingClientRect(); if (!r.width || !r.height) return;
      const dpr = Math.min(2, globalThis.devicePixelRatio || 1), q = RES[this.options.res] == null ? 0.75 : RES[this.options.res];
      let w = Math.round(r.width * dpr * q), h = Math.round(r.height * dpr * q);
      const cap = 1600 / w; if (cap < 1) { w = Math.round(w * cap); h = Math.round(h * cap); }
      if (this.renderer) this.renderer.resize(Math.max(160, w), Math.max(120, h));
      this.glc.style.imageRendering = q < 0.6 ? 'pixelated' : 'auto';
      this.hud.width = Math.round(r.width * dpr); this.hud.height = Math.round(r.height * dpr);
    }
    locked() { return document.pointerLockElement === this.glc; }
    // a rejected request (no user gesture, Esc cooldown) is not permanent: the next click on the view tries again
    lock() { if (!this.locked() && this.glc.requestPointerLock) { try { const p = this.glc.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (_) {} } }
    unlock() { if (this.locked() && document.exitPointerLock) document.exitPointerLock(); }
    bind() {
      const sig = { signal: this.ac.signal }, root = this.root;
      root.addEventListener('keydown', e => this.onKey(e, true), sig);
      root.addEventListener('keyup', e => this.onKey(e, false), sig);
      root.addEventListener('mousedown', e => {
        if (e.target.closest && e.target.closest('.st98-win > *')) return;
        root.focus({ preventScroll: true }); this.audio.resume();
        if (this.state === 'intro') { this.W.introNext(); return; }
        if (this.state === 'play' && !this.win) {
          // the click that recaptures the mouse does not shoot
          if (!this.locked() && e.button === 0 && this.glc.requestPointerLock) { this.lock(); return; }
          if (e.button === 0) this.mouse.fire = true; if (e.button === 2) this.mouse.aim = true;
        }
      }, sig);
      document.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.fire = false; if (e.button === 2) this.mouse.aim = false; }, sig);
      root.addEventListener('contextmenu', e => e.preventDefault(), sig);
      document.addEventListener('mousemove', e => {
        if (this.locked()) { this.mouse.dx += e.movementX || 0; this.mouse.dy += e.movementY || 0; }
        else if (this.state === 'play' && !this.win && (e.buttons & 2)) { this.mouse.dx += e.movementX || 0; this.mouse.dy += e.movementY || 0; }
      }, sig);
      root.addEventListener('wheel', e => { if (this.win) return; e.preventDefault(); if (this.state === 'play') this.mouse.wheel += Math.sign(e.deltaY); }, Object.assign({ passive: false }, sig));
      document.addEventListener('pointerlockchange', () => { if (!this.locked() && this.wasLocked && this.state === 'play' && !this.win && !this.destroyed && !this.skipPause) this.W.pauseMenu(); this.skipPause = false; this.wasLocked = this.locked(); }, sig);
      root.addEventListener('blur', () => { this.keys.clear(); this.mouse.fire = false; this.mouse.aim = false; }, sig);
    }
    onKey(e, down) {
      const c = e.code;
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F9', 'KeyF'].includes(c) || (e.ctrlKey && c !== 'KeyC')) e.preventDefault();
      if (!down) { this.keys.delete(c); return; }
      this.audio.resume();
      if (this.state === 'intro') { if (c === 'Space' || c === 'Enter' || c === 'Escape') this.W.introNext(c === 'Escape'); return; }
      if (this.state === 'ending') { if (c === 'Space' || c === 'Enter' || c === 'Escape') this.W.endingNext(); return; }
      if (this.win) { this.W.key(c, e); return; }
      if (this.state !== 'play') return;
      if (c === 'Escape') { this.W.pauseMenu(); return; }
      if (e.repeat) return;
      this.keys.add(c);
      const g = this.game;
      if (SLOT_KEYS[c]) this.pend.slot = SLOT_KEYS[c];
      if (c === 'KeyR') this.pend.reload = true;
      if (c === 'KeyF') this.pend.use = true;
      if (c === 'KeyL') this.pend.flashlight = true;
      if (c === 'KeyB') this.pend.mode = true;
      if (c === 'KeyC') this.crouchToggle = !this.crouchToggle;
      if (c === 'KeyI') { this.W.inventory(); return; }
      if (c === 'KeyP' || c === 'Tab') { this.W.pda('tasks'); return; }
      if (c === 'KeyM') { this.W.pda('map'); return; }
      if (c === 'F1') this.pend.quick = 1; if (c === 'F2') this.pend.quick = 2; if (c === 'F3') this.pend.quick = 3; if (c === 'F4') this.pend.quick = 4;
      if (c === 'F6' || c === 'F5') this.saveTo('quick');
      if (c === 'F9') this.loadFrom('quick');
      if (c === 'F7') { this.W.spawner(); return; }
      void g;
    }

    // ================================================================ game flow
    loadDemo() {
      if (this.failed) return;
      if (!this.demo) {
        this.demo = new S.Game({ skill: 0, seed: 7 });
        this.demo.time = 18.6 * 3600; this.demo.events.length = 0;
        this.renderer.setLevel(this.demo);
      } else if (this.renderer.levelId !== this.demo.levelId || this.renderer.game !== this.demo) this.renderer.setLevel(this.demo);
      this.game = null; this.audio.stopLoops(); this.audio.startMusic('menu');
    }
    newGame(skill) {
      this.W.close(); this.pendingSkill = skill; this.W.intro();
    }
    startNewGame() {
      this.state = 'loading'; this.loadingName = this.lang === 'ru' ? 'Кордон' : 'Cordon'; this.drawHud();
      setTimeout(() => {
        if (this.destroyed) return;
        this.game = new S.Game({ skill: this.pendingSkill == null ? 1 : this.pendingSkill, seed: (Date.now() & 0xffff), lang: this.lang });
        this.enterGame(true);
        this.saveTo('auto', true);
      }, 30);
    }
    enterGame(fresh) {
      const g = this.game;
      this.demo = null;
      this.renderer.setLevel(g);
      this.state = 'play'; this.toasts = []; this.newsQ = []; this.newsCur = null; this.subs = []; this.prevPos = null; this.camY = null;
      this.audio.resume(); this.audio.stopMusic(); this.audio.startMusic('game');
      this.handleEvents(g.events); g.events.length = 0;
      if (!this.win) this.lock();
      this.root.focus({ preventScroll: true });
      void fresh;
    }
    travel(exit) {
      const g = this.game; this.W.close();
      this.state = 'loading'; this.loadingName = this.L((g.def.exits.find(x => x === exit) || exit).label); this.drawHud(); this.skipPause = true; this.unlock();
      setTimeout(() => {
        if (this.destroyed) return;
        g.travel(exit);
        if (exit.to === 'agroprom') { this.state = 'play'; this.handleEvents(g.events); g.events.length = 0; return; }
        this.enterGame();
      }, 40);
    }
    toMenu() { this.W.close(); this.state = 'title'; this.demo = null; this.loadDemo(); this.W.mainMenu(); }
    toast(text, color = '#e8e0b0') { this.toasts.push({ text, color, t: 0 }); if (this.toasts.length > 5) this.toasts.shift(); }

    // ================================================================ main loop
    isActive() { return !document.hidden && this.root.getClientRects().length && (!this.opts.isActive || this.opts.isActive()); }
    frame(ts) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(this.frame);
      if (this.failed) return;
      const dt = Math.min(0.1, this.last ? (ts - this.last) / 1000 : 0.016); this.last = ts;
      this.fpsT += dt; this.fpsN++; if (this.fpsT > 0.5) { this.fps = Math.round(this.fpsN / this.fpsT); this.fpsT = 0; this.fpsN = 0; }
      if (this.state === 'loading') { this.drawHud(); return; }
      const R = this.renderer, active = this.isActive();
      if (this.game && (this.state === 'play' || this.state === 'dead' || this.state === 'ending')) {
        const g = this.game, p = g.player;
        const running = !this.win && active && (this.state === 'play' || this.state === 'dead');
        if (running) {
          const zoom = this.curFov() / this.options.fov, k = this.options.sens * 0.00028 * zoom;
          if (!p.dead) { p.yaw = S.wrapAng(p.yaw - this.mouse.dx * k); p.pitch = clamp(p.pitch - this.mouse.dy * k * (this.options.invert ? -1 : 1), -1.45, 1.45); }
          this.sway[0] = clamp(this.sway[0] * 0.86 + this.mouse.dx * 0.00005, -0.025, 0.025); this.sway[1] = clamp(this.sway[1] * 0.86 - this.mouse.dy * 0.00005, -0.025, 0.025);
          this.mouse.dx = this.mouse.dy = 0;
          this.acc += dt; let n = 0;
          while (this.acc >= DT && n < 5) {
            this.prevPos = [p.x, p.y, p.z];
            g.tick(this.input());
            this.handleEvents(g.events); R.events(g.events, g); g.events.length = 0;
            this.acc -= DT; n++;
            if (this.state !== 'play' && this.state !== 'dead') break;
            if (g.player.dead && !this.deadHandled) break;
          }
          if (n >= 5) this.acc = 0;
          R.stepEffects(dt, g);
          this.updateAudio(dt);
          if (this.state === 'dead') this.deadT += dt;
          this.updateTimers(dt);
        } else { this.mouse.dx = this.mouse.dy = 0; if (this.win) this.audio.update({ wind: 0.1, ambient: false }); }
        this.renderGame(dt);
      } else if (this.demo) {
        this.demoT = (this.demoT || 0) + dt;
        const d = this.demo, a = Math.sin(this.demoT * 0.05) * 0.5, cx = -40 + Math.sin(this.demoT * 0.02) * 3, cz = -214, cy = d.W.terrainAt(cx, cz) + 2.2 + Math.sin(this.demoT * 0.3) * 0.2;
        d.time += dt * 5; if (d.hours() > 21.5) d.time = 18.6 * 3600;
        d.realT += dt;
        S.updateActors(d); d.events.length = 0;
        R.stepEffects(dt, d);
        R.render(d, { x: cx, y: cy, z: cz, yaw: Math.atan2(-64 - cx, -198 - cz) + a * 0.4, pitch: -0.04 }, { fov: 70, viewmodel: false });
        this.audio.setListener(cx, cy, cz, 0); this.audio.update({ wind: 0.15, fire: 0.6, guitar: 0.9, ambient: false });
      }
      this.drawHud();
    }
    curFov() {
      const g = this.game; if (!g) return this.options.fov;
      const p = g.player, w = g.curWeaponId();
      if (w === 'binoc') return lerp(this.options.fov, 12, p.aim);
      return this.options.fov * (1 - p.aim * (g.cur === 'rifle' ? 0.28 : 0.15));
    }
    renderGame(dt) {
      const g = this.game, p = g.player, R = this.renderer;
      const a = clamp(this.acc / DT, 0, 1), pp = this.prevPos || [p.x, p.y, p.z];
      const x = pp[0] + (p.x - pp[0]) * a, z = pp[2] + (p.z - pp[2]) * a, y = pp[1] + (p.y - pp[1]) * a;
      if (this.camY == null || Math.abs(y - this.camY) > 2 || !p.ground) this.camY = y; else this.camY += (y - this.camY) * Math.min(1, dt * 16);
      this.camCrouch += (p.crouch - this.camCrouch) * Math.min(1, dt * 10);
      let eye = lerp(S.GAME.EYE, S.GAME.EYE_CROUCH, this.camCrouch);
      if (this.options.bob && p.ground && !p.dead) eye += Math.abs(Math.sin(p.bob * Math.PI)) * 0.045 * Math.min(1, Math.hypot(p.vx, p.vz) / 4) * (1 - p.aim * 0.8);
      if (p.dead) { this.deadCam = Math.min(1, (this.deadCam || 0) + dt * 1.5); eye = lerp(eye, 0.25, this.deadCam); } else this.deadCam = 0;
      const lean = p.lean, rx = -Math.cos(p.yaw) * lean * 0.38, rz = Math.sin(p.yaw) * lean * 0.38;
      let roll = -lean * 0.14 + (p.dead ? this.deadCam * 0.6 : 0);
      let yawOff = 0, pitchOff = 0;
      if (p.drunk > 0) { const k = Math.min(1, p.drunk / 20), t = g.realT; roll += Math.sin(t * 0.9) * 0.07 * k; yawOff += Math.sin(t * 0.6) * 0.03 * k; pitchOff += Math.sin(t * 0.73) * 0.02 * k; }
      const cam = { x: x + rx, y: this.camY + eye - Math.abs(lean) * 0.08, z: z + rz, yaw: p.yaw + yawOff, pitch: p.pitch + pitchOff, roll };
      this.audio.setListener(cam.x, cam.y, cam.z, p.yaw);
      this.shadeT -= dt;
      if (this.shadeT <= 0) {
        this.shadeT = 0.25; const s = R.sunDir; const W = g.W;
        const sun = W.ray(cam.x, cam.y, cam.z, s[0], s[1], s[2], 60, true, true) ? 0.35 : 1, roof = W.ray(cam.x, cam.y, cam.z, 0, 1, 0, 30, true, true);
        this.shade = roof ? Math.min(sun, 0.45) : sun; this.outdoor = !roof;
        let lamp = 0; for (const L of R.staticLights) { const d = Math.hypot(L.x - cam.x, L.y - cam.y, L.z - cam.z); if (d < L.r) lamp += (1 - d / L.r) * 0.25; }
        this.lampLight = Math.min(0.4, lamp);
      }
      this.shadeS = this.shadeS == null ? this.shade : this.shadeS + (this.shade - this.shadeS) * Math.min(1, dt * 4);
      R.render(g, cam, { fov: this.curFov(), viewmodel: this.state === 'play' && !p.dead, bob: this.options.bob, sway: this.sway, shade: this.shadeS, flashlight: g.flashlight, rain: g.weather.rain > 0.05 && this.outdoor !== false, lampLight: this.lampLight });
      this.cam = cam;
    }
    input() {
      const k = this.keys, i = {};
      i.fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
      i.strafe = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
      const turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0); if (turn) i.dyaw = turn * 2.2 * DT;
      i.jump = k.has('Space'); i.sprint = k.has('ShiftLeft') || k.has('ShiftRight');
      i.crouch = k.has('ControlLeft') || k.has('ControlRight') || this.crouchToggle;
      i.lean = (k.has('KeyE') ? 1 : 0) - (k.has('KeyQ') ? 1 : 0);
      i.fire = this.mouse.fire; i.aim = this.mouse.aim;
      Object.assign(i, this.pend); this.pend = {};
      if (this.mouse.wheel) { i.cycle = this.mouse.wheel > 0 ? 1 : -1; this.mouse.wheel = 0; }
      return i;
    }
    handleEvents(evs) {
      const g = this.game, A = this.audio;
      for (const e of evs) {
        switch (e.t) {
          case 'sound': A.play(e.s, e.x, e.y, e.z, e.vol); break;
          case 'fire': { const d = IT[e.w]; if (d && d.sound) A.play(d.sound, null, null, null, 0.9); break; }
          case 'reload': { const d = IT[e.w]; A.play(d && d.pellets ? 'reload_shotgun' : d && d.slot === 'pistol' ? 'reload_pistol' : 'reload_rifle'); break; }
          case 'switch': A.play('switch'); break;
          case 'step': A.play('step_' + e.surf, null, null, null, e.run ? 0.9 : 0.55); break;
          case 'jump': A.play('jump'); break;
          case 'land': A.play('land', null, null, null, Math.min(1, e.v / 8)); break;
          case 'hurt': this.flash.r = Math.min(0.55, this.flash.r + 0.08 + e.dmg * 0.012); if (e.dir != null) { this.hurtDir = e.dir; this.hurtT = 1; } break;
          case 'pickup': A.play('pickup'); this.toast(`${this.t('gotItem')}: ${e.name}`, '#d0f0c0'); break;
          case 'msg': this.toast(e.text, e.color); break;
          case 'news': this.newsQ.push({ from: e.from, text: e.text, icon: e.icon }); break;
          case 'task': A.play('task'); this.toast(`${this.t({ new: 'newTask', done: 'taskDone', fail: 'taskFailed', upd: 'taskUpd' }[e.kind])}: ${e.title}`, e.kind === 'done' ? '#a0ff80' : e.kind === 'fail' ? '#ff7050' : '#ffe080'); break;
          case 'bark': this.subs.push({ who: e.who, text: e.text, t: 0 }); if (this.subs.length > 3) this.subs.shift(); A.play('bark_' + (e.voice || 0), e.x, e.y, e.z, 0.8); break;
          case 'dialog': this.W.dialog(e.actor); break;
          case 'loot': this.W.loot(e.target, e.kind); break;
          case 'exitPrompt': this.W.exitPrompt(e.exit); break;
          case 'pdie': this.state = 'dead'; this.deadT = 0; this.unlock(); setTimeout(() => { if (this.state === 'dead') this.W.deathScreen(); }, 2200); break;
          case 'ending': this.W.ending(); break;
          case 'autosave': this.saveTo('auto', true); break;
          case 'lightning': setTimeout(() => A.play('thunder', null, null, null, 0.9), 400 + Math.random() * 1600); this.flash.w = 0.3; break;
          case 'mode': this.toast(e.m === 'a' ? (this.lang === 'ru' ? 'Автоматический огонь' : 'Full auto') : (this.lang === 'ru' ? 'Одиночный огонь' : 'Single shot'), '#e0e0c0'); break;
          case 'level': break;
          default: break;
        }
      }
    }
    updateAudio(dt) {
      const g = this.game, p = g.player, A = this.audio;
      // geiger counter clicks
      const rate = Math.min(40, p.radIn * 700 + (p.rad > 0.3 ? 0.5 : 0));
      if (Math.random() < rate * dt) A.play('geiger', null, null, null, 0.5 + Math.min(0.5, p.radIn * 10));
      // detector
      if (g.has('detector') && g.detector) {
        const d = g.detector.anomaly;
        if (d < 12) { this.detT -= dt; if (this.detT <= 0) { this.detT = 0.08 + Math.max(0, d) * 0.07; A.play('detector', null, null, null, 0.5); this.detBlink = 0.08; } }
        const da = g.detector.art;
        if (da < 18) { this.detArtT -= dt; if (this.detArtT <= 0) { this.detArtT = 0.25 + da * 0.1; A.play('detector_art', null, null, null, 0.45); } }
      }
      if (p.hp < 25 && !p.dead) { this.heartT -= dt; if (this.heartT <= 0) { this.heartT = 0.7 + p.hp / 60; A.play('heartbeat', null, null, null, 0.8); } }
      if (p.exhausted && !p.dead) { this.breathT -= dt; if (this.breathT <= 0) { this.breathT = 1.1; A.play('breath', null, null, null, 0.7); } }
      // loops: nearest campfire & guitarist
      let fire = 0, guitar = 0;
      for (const L of g.def.lights) if (L.fire) { const d = Math.hypot(L.x - p.x, L.z - p.z); fire = Math.max(fire, clamp(1 - d / 16, 0, 1)); }
      for (const a of g.actors) if (a.guitar && a.sitting && !a.dead && !a.hidden) { const d = Math.hypot(a.x - p.x, a.z - p.z); guitar = Math.max(guitar, clamp(1 - d / 30, 0, 1) ** 1.5); }
      A.update({ wind: 0.12 + g.weather.rain * 0.2 + (1 - g.daylight()) * 0.05, rain: g.weather.rain, fire, guitar, night: g.daylight() < 0.3, outdoor: this.outdoor !== false });
    }
    updateTimers(dt) {
      this.flash.r = Math.max(0, this.flash.r - dt * 1.1); this.flash.w = Math.max(0, this.flash.w - dt * 2); this.hurtT = Math.max(0, this.hurtT - dt * 1.2);
      for (const t of this.toasts) t.t += dt; this.toasts = this.toasts.filter(t => t.t < 4);
      for (const s of this.subs) s.t += dt; this.subs = this.subs.filter(s => s.t < 4.5);
      if (this.newsCur) { this.newsCur.t += dt; if (this.newsCur.t > 7) this.newsCur = null; }
      if (!this.newsCur && this.newsQ.length) { this.newsCur = Object.assign(this.newsQ.shift(), { t: 0 }); this.audio.play('pda'); }
      if (this.detBlink > 0) this.detBlink -= dt;
    }

    // ================================================================ HUD
    drawHud() {
      const c = this.hctx, W = this.hud.width, H = this.hud.height;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
      const k = H / 600; c.save(); c.scale(k, k); const w = W / k, h = 600;
      if (this.state === 'loading') { this.drawLoading(c, w, h); c.restore(); return; }
      if (this.state === 'intro' || this.state === 'ending') { this.W.drawSlides(c, w, h); c.restore(); return; }
      if (this.game && (this.state === 'play' || this.state === 'dead')) this.drawPlayHud(c, w, h);
      if (this.state === 'dead') { c.fillStyle = `rgba(60,0,0,${Math.min(0.5, this.deadT * 0.3)})`; c.fillRect(0, 0, w, h); if (this.deadT > 0.5 && !this.win) this.bigText(c, this.t('youDied'), w / 2, h * 0.36, 48, '#d03020'); }
      if (this.state === 'title' && !this.win) { /* nothing */ }
      if (this.options.fps) { c.font = `bold 13px ${FONT}`; c.fillStyle = '#0f0'; c.textAlign = 'right'; c.fillText(`${this.fps} FPS  ${this.renderer ? this.renderer.frame.actors : 0}a ${this.renderer ? this.renderer.frame.chunks : 0}c`, w - 8, 16); }
      c.restore();
    }
    drawLoading(c, w, h) {
      c.fillStyle = '#0a0a08'; c.fillRect(0, 0, w, h);
      const g = c.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.7); g.addColorStop(0, 'rgba(60,55,30,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      this.bigText(c, 'S.T.A.L.K.E.R.', w / 2, h * 0.3, 44, '#c8b060');
      this.bigText(c, `${this.t('loading')}${this.loadingName ? ': ' + this.loadingName : ''}...`, w / 2, h * 0.52, 20, '#d0d0b0');
      const tips = this.lang === 'ru'
        ? ['Совет: болт (клавиша 6) выдаёт аномалию раньше, чем она выдаст вас.', 'Совет: бинт останавливает кровотечение, аптечка — лечит.', 'Совет: артефакты на поясе фонят. Держите антирад под рукой.', 'Совет: присев, вы меньше заметны и точнее стреляете.', 'Совет: F6 — быстрое сохранение, F9 — быстрая загрузка.', 'Совет: изношенное оружие клинит. Следите за состоянием.']
        : ['Tip: a bolt (key 6) reveals an anomaly before it reveals you.', 'Tip: bandages stop bleeding, medkits heal.', 'Tip: artifacts on your belt are radioactive. Keep anti-rads handy.', 'Tip: crouching makes you harder to spot and steadies your aim.', 'Tip: F6 quick save, F9 quick load.', 'Tip: worn weapons jam. Watch their condition.'];
      this.tipIdx = this.tipIdx == null ? Math.floor(Math.random() * tips.length) : this.tipIdx;
      c.font = `15px ${FONT}`; c.fillStyle = '#a09a80'; c.textAlign = 'center'; c.fillText(tips[this.tipIdx % tips.length], w / 2, h * 0.8);
    }
    bigText(c, s, x, y, size, color, align = 'center', font = FONT) {
      c.font = `bold ${size}px ${font}`; c.textAlign = align; c.textBaseline = 'middle';
      c.lineWidth = Math.max(2, size / 8); c.strokeStyle = 'rgba(0,0,0,0.85)'; c.strokeText(s, x, y); c.fillStyle = color; c.fillText(s, x, y);
    }
    wrap(c, text, maxW) { const words = String(text).split(' '), lines = []; let cur = ''; for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; } if (cur) lines.push(cur); return lines; }
    panel(c, x, y, w, h, a = 0.6) {
      c.fillStyle = `rgba(18,20,14,${a})`; c.fillRect(x, y, w, h);
      c.strokeStyle = 'rgba(160,150,100,0.55)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.strokeStyle = 'rgba(0,0,0,0.6)'; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    }
    bar(c, x, y, w, h, v, col, back = 'rgba(0,0,0,0.6)') { c.fillStyle = back; c.fillRect(x, y, w, h); c.fillStyle = col; c.fillRect(x + 1, y + 1, (w - 2) * clamp(v, 0, 1), h - 2); c.strokeStyle = 'rgba(200,190,140,0.4)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
    statusIcon(c, kind, x, y, level) {
      const col = level > 0.66 ? '#ff3020' : level > 0.33 ? '#ffa020' : '#e0d040';
      c.save(); c.translate(x, y); c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, 26, 26); c.strokeStyle = col; c.lineWidth = 1.5; c.strokeRect(0.5, 0.5, 25, 25); c.fillStyle = col; c.strokeStyle = col;
      if (kind === 'rad') { c.beginPath(); c.arc(13, 13, 2.5, 0, 7); c.fill(); for (let i = 0; i < 3; i++) { const a = i * 2.094 - 1.57; c.beginPath(); c.moveTo(13, 13); c.arc(13, 13, 10, a - 0.5, a + 0.5); c.closePath(); c.fill(); } c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.arc(13, 13, 4, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(13, 13, 2.2, 0, 7); c.fill(); }
      else if (kind === 'bleed') { c.beginPath(); c.moveTo(13, 4); c.quadraticCurveTo(21, 15, 13, 22); c.quadraticCurveTo(5, 15, 13, 4); c.fill(); }
      else if (kind === 'hunger') { c.fillRect(6, 9, 14, 9); c.beginPath(); c.arc(13, 9, 6, Math.PI, 0); c.fill(); }
      else if (kind === 'weight') { c.fillRect(6, 11, 14, 11); c.beginPath(); c.arc(13, 11, 4, Math.PI, 0); c.lineWidth = 2; c.stroke(); }
      else if (kind === 'weapon') { c.fillRect(4, 10, 16, 5); c.fillRect(8, 14, 4, 7); c.fillRect(20, 11, 3, 2); }
      else if (kind === 'psy') { c.font = 'bold 14px Arial'; c.textAlign = 'center'; c.fillText('!', 13, 18); }
      c.restore();
    }
    drawPlayHud(c, w, h) {
      const g = this.game, p = g.player, T = k => this.t(k), R = this.renderer;
      // screen effects
      if (p.radIn > 0.001) { const n = Math.min(260, Math.floor(p.radIn * 5000)); c.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < n; i++) c.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
      if (this.flash.r > 0) { const gr = c.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.8); gr.addColorStop(0, `rgba(160,0,0,${this.flash.r * 0.3})`); gr.addColorStop(1, `rgba(160,0,0,${this.flash.r})`); c.fillStyle = gr; c.fillRect(0, 0, w, h); }
      if (p.hp < 30 && !p.dead) { const a = (1 - p.hp / 30) * (0.3 + 0.15 * Math.sin(g.realT * 6)); const gr = c.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85); gr.addColorStop(0, 'rgba(90,0,0,0)'); gr.addColorStop(1, `rgba(90,0,0,${a})`); c.fillStyle = gr; c.fillRect(0, 0, w, h); }
      if (this.flash.w > 0) { c.fillStyle = `rgba(220,230,255,${this.flash.w * 0.25})`; c.fillRect(0, 0, w, h); }
      if (this.hurtT > 0 && this.hurtDir != null) { const a = S.wrapAng(this.hurtDir - p.yaw); c.save(); c.translate(w / 2, h / 2); c.rotate(-a); c.strokeStyle = `rgba(220,30,20,${this.hurtT * 0.8})`; c.lineWidth = 8; c.beginPath(); c.arc(0, 0, 110, -Math.PI / 2 - 0.3, -Math.PI / 2 + 0.3); c.stroke(); c.restore(); }
      if (p.dead) return;
      const wid = g.curWeaponId();
      // binoculars
      if (wid === 'binoc' && p.aim > 0.6) { this.drawBinoc(c, w, h); }
      // crosshair
      const aimAt = this.aimTarget();
      if (!(wid === 'binoc' && p.aim > 0.6) && !(p.aim > 0.8 && g.cur !== 'knife')) {
        const it = g.weaponItem(), d = it ? IT[it.id] : null;
        const spr = d && d.mag ? g.spreadDeg(d, it) : 1.2, fov = this.curFov() * Math.PI / 180;
        const gap = clamp(Math.tan(spr * Math.PI / 360) / Math.tan(fov / 2) * (h / 2) * (w / h), 3, 60);
        const col = aimAt ? (aimAt.att < 0 ? '#ff4030' : aimAt.att > 0 ? '#60ff50' : '#ffffff') : 'rgba(255,255,255,0.85)';
        c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 3;
        const drawCross = () => { c.beginPath(); c.moveTo(w / 2 - gap - 9, h / 2); c.lineTo(w / 2 - gap, h / 2); c.moveTo(w / 2 + gap, h / 2); c.lineTo(w / 2 + gap + 9, h / 2); c.moveTo(w / 2, h / 2 - gap - 9); c.lineTo(w / 2, h / 2 - gap); c.moveTo(w / 2, h / 2 + gap); c.lineTo(w / 2, h / 2 + gap + 9); c.stroke(); };
        drawCross(); c.strokeStyle = col; c.lineWidth = 1.5; drawCross();
      }
      if (aimAt && aimAt.name) { c.font = `bold 13px ${FONT}`; c.textAlign = 'center'; c.fillStyle = aimAt.att < 0 ? '#ff7060' : aimAt.att > 0 ? '#90ff80' : '#e0e0d0'; c.fillText(aimAt.name, w / 2, h / 2 + 34); if (aimAt.sub) { c.font = `12px ${FONT}`; c.fillStyle = '#b0b0a0'; c.fillText(aimAt.sub, w / 2, h / 2 + 49); } }
      // interaction prompt
      if (g.focus) {
        const fo = g.focus, o = fo.o; let s = '';
        if (fo.kind === 'item') s = `${T('pickUp')}: ${this.L(IT[o.id].name)}`;
        else if (fo.kind === 'stash') s = `${T('open')}: ${this.L(o.name) || (this.lang === 'ru' ? 'тайник' : 'stash')}`;
        else if (fo.kind === 'body') s = `${T('searchBody')}: ${this.L(o.name)}`;
        else if (fo.kind === 'wounded') s = `${T('helpWounded')}: ${this.L(o.name)}`;
        else s = `${T('talkTo')}: ${this.L(o.name)}`;
        c.font = `bold 15px ${FONT}`; c.textAlign = 'center'; const tw = c.measureText('F  ' + s).width + 20;
        this.panel(c, w / 2 - tw / 2, h * 0.64, tw, 26, 0.55); c.fillStyle = '#ffe070'; c.fillText('F', w / 2 - tw / 2 + 14, h * 0.64 + 17); c.fillStyle = '#e8e4d0'; c.fillText(s, w / 2 + 8, h * 0.64 + 17);
      }
      // ---- radar (top-left)
      this.drawRadar(c, 78, 82, 64);
      // clock
      const hh = Math.floor(g.hours()), mm = Math.floor((g.hours() % 1) * 60);
      c.font = `bold 13px ${FONT}`; c.textAlign = 'center'; c.fillStyle = '#d8d0a0'; c.fillText(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, 78, 162);
      // ---- bottom-left: health & stamina, status icons
      this.panel(c, 10, h - 58, 214, 48, 0.55);
      c.font = `bold 11px ${FONT}`; c.textAlign = 'left'; c.fillStyle = '#c8c0a0';
      c.fillText('+', 18, h - 40); this.bar(c, 30, h - 49, 184, 12, p.hp / 100, p.hp < 30 ? '#d02818' : '#b82a1a');
      c.fillText('≈', 18, h - 21); this.bar(c, 30, h - 30, 184, 9, p.stamina / 100, p.exhausted ? '#806030' : '#c8a848');
      const suit = g.suit(); if (suit) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(30, h - 18, 184, 4); c.fillStyle = '#6a8ab0'; c.fillRect(30, h - 18, 184 * suit.cond, 4); }
      let sx = 12; const sy = h - 90;
      if (p.rad > 0.05) { this.statusIcon(c, 'rad', sx, sy, p.rad); sx += 30; }
      if (p.bleed > 0.05) { this.statusIcon(c, 'bleed', sx, sy, p.bleed / 2); sx += 30; }
      if (p.food < 0.25) { this.statusIcon(c, 'hunger', sx, sy, 1 - p.food * 4); sx += 30; }
      const wt = g.weight(), mw = g.maxWeight(); if (wt > mw) { this.statusIcon(c, 'weight', sx, sy, wt > mw + 10 ? 1 : 0.5); sx += 30; }
      const wit = g.weaponItem(); if (wit && wit.cond < 0.5 && (g.cur === 'pistol' || g.cur === 'rifle')) { this.statusIcon(c, 'weapon', sx, sy, 1 - wit.cond * 2); sx += 30; }
      if (g.flashlight) { c.fillStyle = '#ffe890'; c.font = `bold 11px ${FONT}`; c.fillText(this.lang === 'ru' ? 'ФОНАРЬ' : 'LIGHT', 232, h - 14); }
      // detector blink
      if (g.has('detector') && g.detector && g.detector.anomaly < 12) { c.fillStyle = this.detBlink > 0 ? '#ff3020' : '#501008'; c.beginPath(); c.arc(232, h - 46, 5, 0, 7); c.fill(); c.strokeStyle = '#000'; c.stroke(); }
      // ---- bottom-right: weapon & ammo
      this.panel(c, w - 214, h - 58, 204, 48, 0.55);
      const cur = g.cur; let name = '', ammoTxt = '', sub = '';
      if (cur === 'grenade') { const gid = g.curWeaponId(); name = this.L(IT[gid].name); ammoTxt = String(g.count(gid)); }
      else if (cur === 'bolt') { name = this.L(IT.bolt.name); ammoTxt = '∞'; }
      else if (cur === 'binoc') { name = this.L(IT.binoc.name); ammoTxt = ''; }
      else if (wit) {
        const d = IT[wit.id]; name = this.L(d.name);
        if (d.mag) { ammoTxt = `${wit.mag}/${g.ammoCount(wit.ammo)}`; sub = `${this.L(IT[wit.ammo].name)} · ${d.modes[wit.mode || 0] === 'a' ? (this.lang === 'ru' ? 'авто' : 'auto') : (this.lang === 'ru' ? 'одиноч.' : 'single')}`; }
        if (p.w.state === 'reload') sub = this.lang === 'ru' ? 'перезарядка...' : 'reloading...';
        if (p.w.state === 'jam') sub = this.lang === 'ru' ? 'КЛИН! (R)' : 'JAMMED! (R)';
      }
      c.textAlign = 'left'; c.font = `bold 13px ${FONT}`; c.fillStyle = '#d8d0a8'; c.fillText(name, w - 204, h - 41);
      c.font = `11px ${FONT}`; c.fillStyle = p.w.state === 'jam' ? '#ff6040' : '#a8a080'; c.fillText(sub, w - 204, h - 22);
      c.textAlign = 'right'; c.font = `bold 24px ${FONT}`; c.fillStyle = wit && IT[wit.id].mag && wit.mag === 0 ? '#ff6040' : '#f0e8c0'; c.fillText(ammoTxt, w - 18, h - 27);
      if (wit && (cur === 'pistol' || cur === 'rifle')) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(w - 204, h - 16, 186, 3); c.fillStyle = wit.cond < 0.5 ? '#c05030' : '#90a060'; c.fillRect(w - 204, h - 16, 186 * wit.cond, 3); }
      // ---- PDA news (left middle)
      if (this.newsCur) {
        const n = this.newsCur, a = clamp(Math.min(n.t * 4, (7 - n.t) * 2), 0, 1); c.globalAlpha = a;
        c.font = `13px ${FONT}`; const lines = this.wrap(c, n.text, 300);
        const bh = 30 + lines.length * 16; this.panel(c, 10, 176, 360, bh, 0.62);
        this.W.portrait(c, n.icon, 16, 182, 40);
        c.textAlign = 'left'; c.font = `bold 13px ${FONT}`; c.fillStyle = '#ffd860'; c.fillText(n.from, 62, 194);
        c.font = `13px ${FONT}`; c.fillStyle = '#e0dcc8'; lines.forEach((l, i) => c.fillText(l, 62, 212 + i * 16));
        c.globalAlpha = 1;
      }
      // ---- subtitles (barks)
      this.subs.forEach((s, i) => { c.globalAlpha = clamp(4.5 - s.t, 0, 1); c.font = `bold 14px ${FONT}`; c.textAlign = 'center'; const txt = `${s.who}: ${s.text}`; const lines = this.wrap(c, txt, w * 0.6); lines.forEach((l, j) => this.bigText(c, l, w / 2, h - 118 - (this.subs.length - 1 - i) * 22 - (lines.length - 1 - j) * 18, 14, '#e8e0c0')); });
      c.globalAlpha = 1;
      // ---- toasts (right)
      this.toasts.forEach((t, i) => { c.globalAlpha = clamp(4 - t.t, 0, 1); c.font = `bold 14px ${FONT}`; c.textAlign = 'right'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.8)'; const y = 190 + i * 20; c.strokeText(t.text, w - 14, y); c.fillStyle = t.color; c.fillText(t.text, w - 14, y); });
      c.globalAlpha = 1;
      // ---- quest compass arrow near the radar
      if (!this.locked() && !this.win && this.glc.requestPointerLock) {
        const s = this.lang === 'ru' ? 'Щёлкните по экрану, чтобы управлять мышью' : 'Click the view to control the mouse';
        c.font = `bold 14px ${FONT}`; c.textAlign = 'center'; const tw = c.measureText(s).width + 24;
        this.panel(c, w / 2 - tw / 2, h * 0.28, tw, 26, 0.6); c.fillStyle = '#ffe070'; c.fillText(s, w / 2, h * 0.28 + 18);
      }
      if (g.god) { c.fillStyle = '#ffe070'; c.textAlign = 'left'; c.font = `bold 12px ${FONT}`; c.fillText('GOD', 150, 20); }
      void R;
    }
    aimTarget() {
      const g = this.game, p = g.player; if (!g || p.dead) return null;
      this.aimT = (this.aimT || 0) - 1; if (this.aimT > 0) return this.aimCache;
      this.aimT = 6;
      const f = g.forward(), hit = g.trace(p.x, g.eye, p.z, f[0], f[1], f[2], 60, null);
      if (!hit || !hit.actor || hit.actor.hidden || (hit.actor.kind === 'mutant' && hit.actor.invis > 0.6)) { this.aimCache = null; return null; }
      const a = hit.actor, att = a.dead ? 0 : g.attitudeOf(a, 'player');
      const fac = a.kind === 'human' ? this.L(D.FACTIONS[a.faction].name) : '';
      this.aimCache = { att, name: this.L(a.name), sub: a.dead ? this.t('dead') : a.wounded ? this.t('wounded') : fac ? `${fac}, ${this.t(att < 0 ? 'enemy' : att > 0 ? 'friend' : 'neutral')}` : '' };
      return this.aimCache;
    }
    drawRadar(c, cx, cy, r) {
      const g = this.game, p = g.player, scale = r / 50;
      c.save();
      c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fillStyle = 'rgba(12,18,10,0.7)'; c.fill(); c.clip();
      // map underlay rotated with the player
      const mapc = this.W.mapCanvas(g);
      c.save(); c.translate(cx, cy); c.rotate(p.yaw); c.globalAlpha = 0.55;
      const mx = (p.x - g.W.bx0) * mapc.sc, mz = (g.W.bz1 - p.z) * mapc.sc;
      // map image: x mirrored (west on the left edge = +x), so the player's pixel is (bx1 - x)
      const px = (g.W.bx1 - p.x) * mapc.sc; void mx;
      c.scale(scale / mapc.sc, scale / mapc.sc); c.drawImage(mapc.c, -px, -mz);
      c.restore(); c.globalAlpha = 1;
      // rings
      c.strokeStyle = 'rgba(120,160,90,0.35)'; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, r * 0.5, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(cx - r, cy); c.lineTo(cx + r, cy); c.moveTo(cx, cy - r); c.lineTo(cx, cy + r); c.stroke();
      const toScreen = (x, z) => { const dx = x - p.x, dz = z - p.z, s = Math.sin(p.yaw), co = Math.cos(p.yaw); const fwd = dx * s + dz * co, right = -dx * co + dz * s; return [cx + right * scale, cy - fwd * scale]; };
      for (const a of g.actors) {
        if (a.dead || a.hidden || a.kind !== 'human') continue;
        const d = Math.hypot(a.x - p.x, a.z - p.z); if (d > 50) continue;
        const att = g.attitudeOf(a, 'player'), [x, y] = toScreen(a.x, a.z);
        c.fillStyle = att < 0 ? '#ff3a28' : att > 0 ? '#50e040' : '#e0e0d0'; c.fillRect(x - 2, y - 2, 4, 4);
      }
      for (const a of g.actors) if (!a.hidden && a.dead && a.kind === 'human' && Math.hypot(a.x - p.x, a.z - p.z) < 50) { const [x, y] = toScreen(a.x, a.z); c.fillStyle = '#808080'; c.fillRect(x - 1.5, y - 1.5, 3, 3); }
      // quest markers (clamped to the edge)
      for (const m of S.QUESTS.markers(g)) {
        if (m.x == null) continue;
        let [x, y] = toScreen(m.x, m.z); const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
        if (d > r - 6) { x = cx + dx / d * (r - 6); y = cy + dy / d * (r - 6); }
        c.fillStyle = m.main ? '#ffd040' : '#80c8ff'; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 4, y); c.lineTo(x, y + 5); c.lineTo(x - 4, y); c.closePath(); c.fill(); c.strokeStyle = '#000'; c.stroke();
      }
      for (const id in g.knownStashes) { const s = g.knownStashes[id]; if (s.level !== g.levelId) continue; const st = g.stashes.find(q => q.id === id); if (st && st.opened) continue; const [x, y] = toScreen(s.x, s.z); if (Math.hypot(x - cx, y - cy) < r) { c.fillStyle = '#40a0ff'; c.fillRect(x - 3, y - 3, 6, 6); } }
      c.restore();
      c.beginPath(); c.arc(cx, cy, r, 0, 7); c.strokeStyle = 'rgba(170,160,110,0.8)'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#f0f0e0'; c.beginPath(); c.moveTo(cx, cy - 6); c.lineTo(cx + 4, cy + 4); c.lineTo(cx - 4, cy + 4); c.closePath(); c.fill();
      // compass letter
      const nA = -p.yaw + Math.PI; void nA;
      const [nx, ny] = (() => { const s = Math.sin(p.yaw), co = Math.cos(p.yaw); const fwd = co, right = s; return [cx + right * (r - 9), cy - fwd * (r - 9)]; })();
      c.font = `bold 11px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffd860'; c.fillText(this.lang === 'ru' ? 'С' : 'N', nx, ny); c.textBaseline = 'alphabetic';
    }
    drawBinoc(c, w, h) {
      const g = this.game, p = g.player, f = g.forward();
      c.save(); c.fillStyle = '#000'; c.beginPath(); c.rect(0, 0, w, h); c.arc(w / 2 - h * 0.23, h / 2, h * 0.34, 0, 7, true); c.arc(w / 2 + h * 0.23, h / 2, h * 0.34, 0, 7, true); c.fill('evenodd');
      c.strokeStyle = 'rgba(120,255,120,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(w / 2 - 40, h / 2); c.lineTo(w / 2 + 40, h / 2); c.moveTo(w / 2, h / 2 - 30); c.lineTo(w / 2, h / 2 + 30); c.stroke();
      const hit = g.W.ray(p.x, g.eye, p.z, f[0], f[1], f[2], 500, true);
      c.font = `bold 14px ${FONT}`; c.fillStyle = '#80ff80'; c.textAlign = 'center'; c.fillText(hit ? `${hit.t.toFixed(0)} m` : '---', w / 2, h / 2 + 60);
      c.restore();
    }
    destroy() {
      this.destroyed = true; cancelAnimationFrame(this.raf); this.ac.abort(); if (this.ro) this.ro.disconnect();
      this.unlock(); this.audio.destroy(); if (this.renderer) this.renderer.destroy();
    }
  }

  S.UI = UI; S.SAVE = { store, SAVE_PREFIX, INDEX_KEY };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
