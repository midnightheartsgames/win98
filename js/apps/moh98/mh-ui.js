(function (S) {
  'use strict';
  const { clamp, lerp } = S;
  const D = S.DATA, WP = D.WEAPONS;
  const OPT_KEY = 'moh98-options', PROG_KEY = 'moh98-progress';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } } };
  const DT = S.GAME.DT;
  const RES = [0.33, 0.5, 0.75, 1];
  const FONT = '"Courier New", Courier, monospace', HEAD = 'Impact, "Arial Black", Arial, sans-serif';
  const CAT_KEYS = { Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 4, Digit5: 5, Digit6: 6, Digit7: 7 };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function drawStar(x, cx, cy, r, points = 5, inner = 0.45) { x.beginPath(); for (let i = 0; i < points * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / points, rr = i % 2 ? r * inner : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); }
  function drawMedal(x, key, cx, cy, s, dim) {
    const M = D.MEDALS[key]; if (!M) return;
    x.save(); if (dim) x.globalAlpha = 0.22;
    const rw = s * 0.9, rh = s * 0.75, rx = cx - rw / 2, ry = cy - s;
    const n = M.ribbon.length;
    M.ribbon.forEach((c, i) => { x.fillStyle = c; x.fillRect(rx + i * rw / n, ry, rw / n + 0.5, rh); });
    x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 1; x.strokeRect(rx, ry, rw, rh);
    const my = cy + s * 0.18, g = x.createRadialGradient(cx - s * 0.1, my - s * 0.1, 1, cx, my, s * 0.5);
    g.addColorStop(0, '#fff8d8'); g.addColorStop(0.35, M.metal); g.addColorStop(1, '#3a2a10');
    x.fillStyle = g; x.strokeStyle = '#2a1a08'; x.lineWidth = Math.max(1, s * 0.03);
    x.fillRect(cx - s * 0.05, ry + rh - 2, s * 0.1, my - ry - rh - s * 0.25);
    if (M.shape === 'star') { drawStar(x, cx, my, s * 0.42); x.fill(); x.stroke(); drawStar(x, cx, my, s * 0.14); x.fillStyle = '#fff4c0'; x.fill(); }
    else if (M.shape === 'cross') { x.beginPath(); for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { x.moveTo(cx, my); x.lineTo(cx + dx * s * 0.42 - dy * s * 0.16, my + dy * s * 0.42 + dx * s * 0.16); x.lineTo(cx + dx * s * 0.42 + dy * s * 0.16, my + dy * s * 0.42 - dx * s * 0.16); x.closePath(); } x.fill(); x.stroke(); x.beginPath(); x.arc(cx, my, s * 0.12, 0, 7); x.fillStyle = '#2a3a8a'; x.fill(); }
    else if (M.shape === 'heart') { x.beginPath(); x.moveTo(cx, my + s * 0.36); x.bezierCurveTo(cx - s * 0.6, my, cx - s * 0.3, my - s * 0.42, cx, my - s * 0.16); x.bezierCurveTo(cx + s * 0.3, my - s * 0.42, cx + s * 0.6, my, cx, my + s * 0.36); x.fill(); x.stroke(); x.beginPath(); x.arc(cx, my, s * 0.1, 0, 7); x.fillStyle = '#e8d8a0'; x.fill(); }
    else if (M.shape === 'badge') { x.fillRect(cx - s * 0.36, my - s * 0.14, s * 0.72, s * 0.28); x.strokeRect(cx - s * 0.36, my - s * 0.14, s * 0.72, s * 0.28); x.beginPath(); x.arc(cx, my, s * 0.2, 0, 7); x.fill(); x.stroke(); x.strokeStyle = '#1a1a1a'; x.beginPath(); x.arc(cx, my, s * 0.1, 0, 7); x.moveTo(cx - s * 0.16, my); x.lineTo(cx + s * 0.16, my); x.moveTo(cx, my - s * 0.16); x.lineTo(cx, my + s * 0.16); x.stroke(); }
    else { x.beginPath(); x.arc(cx, my, s * 0.48, 0, 7); x.strokeStyle = '#3a5a2a'; x.lineWidth = s * 0.08; x.stroke(); drawStar(x, cx, my, s * 0.44); x.fillStyle = g; x.fill(); x.strokeStyle = '#2a1a08'; x.lineWidth = Math.max(1, s * 0.03); x.stroke(); drawStar(x, cx, my, s * 0.16); x.fillStyle = '#3a6ab0'; x.fill(); }
    x.restore();
  }
  S.drawMedal = drawMedal;

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts; this.ac = new AbortController();
      root.classList.add('mh98'); root.tabIndex = 0;
      root.innerHTML = '<canvas class="mh98-gl"></canvas><canvas class="mh98-hud"></canvas><div class="mh98-win"></div><div class="mh98-err"></div>';
      this.glc = root.querySelector('.mh98-gl'); this.hud = root.querySelector('.mh98-hud'); this.hctx = this.hud.getContext('2d'); this.winEl = root.querySelector('.mh98-win');
      this.options = { sens: 6, invert: false, fov: 70, sfx: 0.8, music: 0.5, res: 2, grass: true, bob: true, fps: false, lang: null };
      try { Object.assign(this.options, JSON.parse(store.get(OPT_KEY)) || {}); } catch (_) {}
      this.lang = this.options.lang || opts.lang || ((globalThis.i18n && globalThis.i18n.getLanguage && globalThis.i18n.getLanguage()) === 'en' ? 'en' : 'ru');
      this.prog = this.loadProgress();
      this.audio = new S.Audio(); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music;
      try { this.renderer = new S.Renderer(this.glc); this.renderer.grassOn = this.options.grass; } catch (err) { this.fail(err); return; }
      this.keys = new Set(); this.mouse = { fire: false, aim: false, dx: 0, dy: 0, wheel: 0 };
      this.state = 'title'; this.win = null; this.msgs = []; this.subs = []; this.hurtArcs = []; this.pend = {};
      this.acc = 0; this.last = 0; this.fpsT = 0; this.fpsN = 0; this.fps = 0; this.sway = [0, 0]; this.camCrouch = 0; this.shade = 1; this.shadeT = 0;
      this.bind();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); this.resize();
      this.loadDemo();
      this.mainMenu();
      this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
      if (opts.onReady) opts.onReady(this);
    }
    t(k) { const v = D.STR[this.lang][k]; return v != null ? v : k; }
    L(o) { return o == null ? '' : typeof o === 'string' ? o : (o[this.lang] || o.ru || o.en || ''); }
    fail(err) { this.failed = true; const el = this.root.querySelector('.mh98-err'); el.textContent = this.t('webgl') + (err && err.message ? err.message : ''); el.style.display = 'block'; }
    saveOptions() { store.set(OPT_KEY, JSON.stringify(this.options)); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music; this.audio.applyVolume(); }
    loadProgress() { let p = null; try { p = JSON.parse(store.get(PROG_KEY)); } catch (_) {} return Object.assign({ unlocked: 1, best: {}, codes: {}, skill: 1, done: false, heads: 0, honor: false }, p || {}); }
    saveProgress() { store.set(PROG_KEY, JSON.stringify(this.prog)); }

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
    lock() { if (!this.locked() && this.glc.requestPointerLock) { try { const p = this.glc.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (_) {} } }
    unlock() { if (this.locked() && document.exitPointerLock) document.exitPointerLock(); }
    bind() {
      const sig = { signal: this.ac.signal }, root = this.root;
      root.addEventListener('keydown', e => this.onKey(e, true), sig);
      root.addEventListener('keyup', e => this.onKey(e, false), sig);
      root.addEventListener('mousedown', e => {
        if (e.target.closest && e.target.closest('.mh98-win > *')) return;
        root.focus({ preventScroll: true }); this.audio.resume();
        if (this.state === 'slides') { this.slideNext(); return; }
        if (this.state === 'dead') { if (this.deadT > 1.2) this.failMenu(); return; }
        if (this.state === 'play' && !this.win) {
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
      document.addEventListener('pointerlockchange', () => { if (!this.locked() && this.wasLocked && this.state === 'play' && !this.win && !this.destroyed && !this.skipPause) this.pauseMenu(); this.skipPause = false; this.wasLocked = this.locked(); }, sig);
      root.addEventListener('blur', () => { this.keys.clear(); this.mouse.fire = false; this.mouse.aim = false; }, sig);
    }
    onKey(e, down) {
      const c = e.code;
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyF', 'KeyG'].includes(c) || (e.ctrlKey && c !== 'KeyC')) e.preventDefault();
      if (!down) { this.keys.delete(c); return; }
      this.audio.resume();
      if (this.state === 'slides') { if (c === 'Space' || c === 'Enter' || c === 'Escape') this.slideNext(c === 'Escape'); return; }
      if (this.win) { if (this.onWinKey && this.onWinKey(c, e)) return; if (c === 'Escape' && this.escBack) { this.escBack(); } return; }
      if (this.state === 'dead') { if ((c === 'Enter' || c === 'Space') && this.deadT > 1.2) this.failMenu(); return; }
      if (this.state !== 'play') return;
      if (c === 'Escape') { this.pauseMenu(); return; }
      if (e.repeat) return;
      this.keys.add(c);
      if (CAT_KEYS[c]) this.pend.cat = CAT_KEYS[c];
      if (c === 'KeyR') this.pend.reload = true;
      if (c === 'KeyF') this.pend.use = true;
      if (c === 'KeyG') this.pend.nade = true;
      if (c === 'KeyC') this.crouchToggle = !this.crouchToggle;
    }
    input() {
      const k = this.keys, p = this.pend, inp = {};
      inp.fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
      inp.strafe = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
      inp.walk = k.has('ShiftLeft') || k.has('ShiftRight');
      inp.crouch = k.has('ControlLeft') || k.has('ControlRight') || this.crouchToggle;
      inp.jump = k.has('Space');
      inp.lean = (k.has('KeyQ') ? -1 : 0) + (k.has('KeyE') ? 1 : 0);
      inp.fire = this.mouse.fire; inp.aim = this.mouse.aim;
      if (p.cat) inp.cat = p.cat; if (p.reload) inp.reload = true; if (p.use) inp.use = true; if (p.nade) inp.nade = true;
      if (this.mouse.wheel) { inp.cycle = Math.sign(this.mouse.wheel); this.mouse.wheel = 0; }
      this.pend = {};
      return inp;
    }

    loadDemo() {
      if (this.failed) return;
      if (!this.demo) { this.demo = new S.Game({ mission: 0, skill: 0, seed: 7, lang: this.lang }); this.demo.events.length = 0; this.renderer.setLevel(this.demo); }
      else if (this.renderer.game !== this.demo) this.renderer.setLevel(this.demo);
      this.game = null; this.audio.stopLoops(); this.audio.startMusic('menu');
    }
    startMission(mi, skill) {
      this.closeWin(); this.state = 'loading'; this.loadingName = this.L(S.MISSIONS[mi].name); this.drawHud();
      setTimeout(() => {
        if (this.destroyed) return;
        const codes = {}; for (const k in this.prog.codes) if (this.prog.codes[k]) codes[k] = true;
        this.game = new S.Game({ mission: mi, skill: skill == null ? this.prog.skill : skill, seed: (Date.now() & 0xffff), lang: this.lang, codes });
        this.demo = null;
        this.renderer.setLevel(this.game);
        this.state = 'play'; this.msgs = []; this.subs = []; this.hurtArcs = []; this.prevPos = null; this.camY = null; this.deadT = 0; this.deadCam = 0;
        this.audio.resume(); this.audio.stopLoops(); this.audio.startMusic('game');
        this.handleEvents(this.game.events); this.game.events.length = 0;
        const o = this.game.objectives.find(q => q.state === 'active' && !q.optional); if (o) this.msg(this.L(o.text), '#f0e0a0');
        if (this.game.disguised) this.msg(this.lang === 'ru' ? 'Вы под прикрытием. Держите документы под рукой (7).' : 'You are undercover. Keep your papers at hand (7).', '#d0d8f0');
        this.lock(); this.root.focus({ preventScroll: true });
      }, 30);
    }
    toMenu() { this.closeWin(); this.unlock(); this.state = 'title'; this.demo = null; this.loadDemo(); this.mainMenu(); }
    msg(text, color = '#f0e8c8') { this.msgs.push({ text, color, t: 0 }); if (this.msgs.length > 5) this.msgs.shift(); }

    isActive() { return !document.hidden && this.root.getClientRects().length && (!this.opts.isActive || this.opts.isActive()); }
    frame(ts) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(this.frame);
      if (this.failed) return;
      const dt = Math.min(0.1, this.last ? (ts - this.last) / 1000 : 0.016); this.last = ts;
      this.fpsT += dt; this.fpsN++; if (this.fpsT > 0.5) { this.fps = Math.round(this.fpsN / this.fpsT); this.fpsT = 0; this.fpsN = 0; }
      if (this.state === 'loading') { this.drawHud(); return; }
      const R = this.renderer, active = this.isActive();
      if (this.game && (this.state === 'play' || this.state === 'dead' || this.state === 'debrief')) {
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
          }
          if (n >= 5) this.acc = 0;
          R.stepEffects(dt, g);
          this.updateAudio();
          if (this.state === 'dead') this.deadT += dt;
          for (const m of this.msgs) m.t += dt; this.msgs = this.msgs.filter(m => m.t < 6);
          for (const s of this.subs) s.t += dt; this.subs = this.subs.filter(s => s.t < 3.2);
          for (const h of this.hurtArcs) h.t += dt; this.hurtArcs = this.hurtArcs.filter(h => h.t < 1);
        } else { this.mouse.dx = this.mouse.dy = 0; if (this.win) this.audio.update({ wind: 0.08, ambient: false }); }
        this.renderGame(dt);
      } else if (this.demo) {
        this.demoT = (this.demoT || 0) + dt;
        const d = this.demo, a = this.demoT * 0.035, cx = -2 + Math.sin(a) * 42, cz = 18 + Math.cos(a) * 42, cy = d.W.terrainAt(cx, cz) + 7 + Math.sin(this.demoT * 0.2);
        R.stepEffects(dt, d);
        R.render(d, { x: cx, y: cy, z: cz, yaw: Math.atan2(-2 - cx, 22 - cz), pitch: -0.1 }, { fov: 70, viewmodel: false });
        this.audio.setListener(cx, cy, cz, 0); this.audio.update({ wind: 0.12, ambient: false });
      }
      this.drawHud();
    }
    curFov() {
      const g = this.game; if (!g) return this.options.fov;
      const p = g.player, d = WP[g.cur];
      if (d && d.scope) return lerp(this.options.fov, this.options.fov / d.scope, clamp((p.aim - 0.5) * 2, 0, 1));
      return this.options.fov * (1 - p.aim * 0.22);
    }
    renderGame(dt) {
      const g = this.game, p = g.player, R = this.renderer;
      const a = clamp(this.acc / DT, 0, 1), pp = this.prevPos || [p.x, p.y, p.z];
      const x = pp[0] + (p.x - pp[0]) * a, z = pp[2] + (p.z - pp[2]) * a, y = pp[1] + (p.y - pp[1]) * a;
      if (this.camY == null || Math.abs(y - this.camY) > 2 || !p.ground) this.camY = y; else this.camY += (y - this.camY) * Math.min(1, dt * 16);
      this.camCrouch += (p.crouch - this.camCrouch) * Math.min(1, dt * 10);
      let eye = lerp(S.GAME.EYE, S.GAME.EYE_CROUCH, this.camCrouch);
      if (this.options.bob && p.ground && !p.dead) eye += Math.abs(Math.sin(p.bob * Math.PI)) * 0.045 * Math.min(1, Math.hypot(p.vx, p.vz) / 4) * (1 - p.aim * 0.8);
      if (p.dead) { this.deadCam = Math.min(1, (this.deadCam || 0) + dt * 1.5); eye = lerp(eye, 0.25, this.deadCam); }
      const lean = p.lean, rx = -Math.cos(p.yaw) * lean * 0.38, rz = Math.sin(p.yaw) * lean * 0.38;
      const roll = -lean * 0.14 + (p.dead ? this.deadCam * 0.6 : 0);
      const cam = { x: x + rx, y: this.camY + eye - Math.abs(lean) * 0.08, z: z + rz, yaw: p.yaw, pitch: p.pitch, roll };
      this.audio.setListener(cam.x, cam.y, cam.z, p.yaw);
      this.shadeT -= dt;
      if (this.shadeT <= 0) {
        this.shadeT = 0.25; const s = R.sunDir, W = g.W;
        const sun = W.ray(cam.x, cam.y, cam.z, s[0], s[1], s[2], 60, true, true) ? 0.35 : 1, roof = W.ray(cam.x, cam.y, cam.z, 0, 1, 0, 30, true, true);
        this.shade = roof ? Math.min(sun, 0.45) : sun; this.outdoor = !roof;
        let lamp = 0; for (const L of R.staticLights) { const d = Math.hypot(L.x - cam.x, L.y - cam.y, L.z - cam.z); if (d < L.r) lamp += (1 - d / L.r) * 0.25; }
        this.lampLight = Math.min(0.5, lamp);
      }
      R.render(g, cam, { fov: this.curFov(), viewmodel: true, sway: this.sway, bob: this.options.bob, shade: this.shade, lampLight: this.lampLight });
    }
    updateAudio() {
      const g = this.game, p = g.player, A = this.audio;
      let fire = 0; for (const f of g.def.fires) { const d = Math.hypot(f.x - p.x, f.z - p.z); if (d < 20) fire = Math.max(fire, 1 - d / 20); }
      for (const t of g.targets) if (t.dead) { const d = Math.hypot(t.x - p.x, t.z - p.z); if (d < 25) fire = Math.max(fire, 1 - d / 25); }
      let water = 0; for (const w of g.def.water) { const dx = Math.max(w.x0 - p.x, 0, p.x - w.x1), dz = Math.max(w.z0 - p.z, 0, p.z - w.z1), d = Math.hypot(dx, dz); if (d < 25) water = Math.max(water, 1 - d / 25); }
      A.update({ wind: this.outdoor === false ? 0.05 : (g.def.env.snow ? 0.35 : 0.18), outdoor: this.outdoor, fire, water, hum: g.mission.id === 'nordhausen' && this.outdoor === false ? 1 : 0, ambient: true });
      if (g.alarm && A.theme !== 'tense') A.startMusic('tense');
    }

    handleEvents(evs) {
      const g = this.game, A = this.audio, p = g.player;
      for (const e of evs) {
        switch (e.t) {
          case 'msg': this.msg(e.text, e.color); break;
          case 'sound': A.play(e.s, e.x, e.y, e.z, e.vol == null ? 1 : e.vol); break;
          case 'step': A.play('step_' + (e.surf === 'hard' ? 'hard' : e.surf === 'snow' ? 'snow' : e.surf === 'dirt' ? 'dirt' : 'grass'), null, null, null, p.walk ? 0.4 : 0.8); break;
          case 'jump': A.play('jump'); break;
          case 'land': A.play('land', null, null, null, clamp(e.v / 8, 0.3, 1)); break;
          case 'reload': A.play(WP[e.w].cat === 1 ? 'reload_pistol' : WP[e.w].cat === 5 ? 'reload_heavy' : 'reload_rifle'); break;
          case 'switch': A.play('switch'); break;
          case 'hurt': this.hurtArcs.push({ dir: e.dir, t: 0, k: clamp(e.dmg / 25, 0.3, 1) }); break;
          case 'bark': A.play('bark_' + (e.voice || 0), e.x, e.y, e.z, 1); if (Math.hypot(e.x - p.x, e.z - p.z) < 35) { this.subs.push({ text: e.text, t: 0, x: e.x, y: e.y, z: e.z, uid: e.uid }); if (this.subs.length > 4) this.subs.shift(); } break;
          case 'pickup': this.msg(e.name, '#d8e8c0'); break;
          case 'alarm': this.alarmFlash = 3; break;
          case 'obj': if (e.state === 'failed') this.msg(`${this.t('failed')}: ${this.L((g.objectives.find(o => o.id === e.id) || {}).text)}`, '#ff8060'); break;
          case 'pdie': this.state = 'dead'; this.deadT = 0; this.unlock(); break;
          case 'complete': this.onComplete(); break;
          case 'failed': this.onFailed(e.reason); break;
          default: break;
        }
      }
    }
    onComplete() {
      const g = this.game; this.unlock(); this.skipPause = true;
      const r = S.rateMission(g.stats, g.skill, g.objectives), mi = g.mi;
      const prev = this.prog.best[g.mission.id] || { medals: [], rating: 0 };
      this.prog.best[g.mission.id] = { medals: Array.from(new Set(prev.medals.concat(r.medals))), rating: Math.max(prev.rating, r.rating), skill: Math.max(prev.skill || 0, g.skill) };
      this.prog.heads = (this.prog.heads || 0) + g.stats.headshots;
      if (this.prog.heads >= 20) { const b = this.prog.best[g.mission.id]; if (!Object.values(this.prog.best).some(q => q.medals.includes('marksman'))) b.medals.push('marksman'); }
      this.prog.unlocked = Math.max(this.prog.unlocked, Math.min(S.MISSIONS.length, mi + 2));
      let final = false;
      if (mi === S.MISSIONS.length - 1) { this.prog.done = true; final = true; if (S.MISSIONS.every(m => (this.prog.best[m.id] || { medals: [] }).medals.includes('silver'))) this.prog.honor = true; }
      this.saveProgress();
      this.state = 'debrief'; this.audio.startMusic('victory');
      setTimeout(() => { if (!this.destroyed) this.debrief(r, final); }, 1200);
    }
    onFailed(reason) { this.unlock(); this.skipPause = true; this.state = 'debrief'; setTimeout(() => { if (!this.destroyed) this.failMenu(reason); }, 900); }

    openWin(html, cls = '') {
      const el = this.winEl; el.innerHTML = `<div class="mh98-panel ${cls}">${html}</div>`; el.style.display = 'flex';
      this.win = true; this.onWinKey = null; this.escBack = null; this.unlock();
      const r = el.firstChild;
      r.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this.audio.play('ui_click'); const f = this.acts && this.acts[b.dataset.act]; if (f) f(b); }));
      return r;
    }
    closeWin() { this.winEl.style.display = 'none'; this.winEl.innerHTML = ''; this.win = null; this.acts = null; this.onWinKey = null; this.escBack = null; }
    btn(label, act, cls = '') { return `<button class="mh98-btn ${cls}" data-act="${act}">${esc(label)}</button>`; }
    resume() { this.closeWin(); if (this.state === 'play') { this.lock(); this.root.focus({ preventScroll: true }); } }

    mainMenu() {
      const T = k => this.t(k), last = this.prog.unlocked > 1 || Object.keys(this.prog.best).length;
      this.acts = {
        new: () => this.skillMenu(), cont: () => this.missionMenu(), missions: () => this.missionMenu(), medals: () => this.medalCase(() => this.mainMenu()),
        opt: () => this.optionsMenu(() => this.mainMenu()), ctl: () => this.controlsMenu(() => this.mainMenu()), codes: () => this.codesMenu(), cred: () => this.credits(), quit: () => this.opts.onExit && this.opts.onExit()
      };
      this.openWin(`<div class="mh98-logo"><div class="mh98-logo-s">MEDAL OF</div><div class="mh98-logo-t">HONOR</div><div class="mh98-logo-e">98 · ${esc(T('sub'))}</div></div>
        <div class="mh98-menu">${last ? this.btn(T('continue'), 'cont') : ''}${this.btn(T('newCampaign'), 'new')}${this.btn(T('missions'), 'missions')}${this.btn(T('medals'), 'medals')}${this.btn(T('options'), 'opt')}${this.btn(T('controls'), 'ctl')}${this.btn(T('passwords'), 'codes')}${this.btn(T('credits'), 'cred')}${this.opts.onExit ? this.btn(T('quit'), 'quit') : ''}</div>
        <div class="mh98-foot">DreamWorks Interactive (1999) · Win 98 Edition</div>`, 'mh98-mainmenu');
    }
    skillMenu() {
      this.acts = { back: () => this.mainMenu() };
      D.SKILLS.forEach((s, i) => { this.acts['s' + i] = () => { this.prog.skill = i; this.saveProgress(); this.slides(S.INTRO, () => this.briefing(0)); }; });
      this.openWin(`<h2>${esc(this.t('difficulty'))}</h2><div class="mh98-menu">${D.SKILLS.map((s, i) => this.btn(this.L(s.name), 's' + i)).join('')}${this.btn(this.t('back'), 'back', 'dim')}</div>`, 'mh98-small');
      this.escBack = () => this.mainMenu();
    }
    missionMenu() {
      const unlocked = this.prog.codes.OPENALL ? S.MISSIONS.length : this.prog.unlocked;
      this.acts = { back: () => this.mainMenu() };
      const rows = S.MISSIONS.map((m, i) => {
        const best = this.prog.best[m.id], open = i < unlocked;
        this.acts['m' + i] = () => { if (open) this.briefing(i); };
        const medals = best ? best.medals.map(k => `<span class="mh98-rib" title="${esc(this.L(D.MEDALS[k].name))}" style="background:linear-gradient(90deg,${D.MEDALS[k].ribbon.join(',')})"></span>`).join('') : '';
        return `<div class="mh98-mission ${open ? '' : 'off'}" data-act="m${i}"><b>${i + 1}. ${esc(this.L(m.name))}</b><span>${esc(this.L(m.place))} · ${esc(this.L(m.date))}</span><em>${open ? medals : esc(this.t('locked'))}</em></div>`;
      }).join('');
      this.openWin(`<h2>${esc(this.t('missions'))}</h2><div class="mh98-list">${rows}</div><div class="mh98-menu row">${this.btn(this.t('back'), 'back', 'dim')}</div>`, 'mh98-wide');
      this.escBack = () => this.mainMenu();
    }
    briefing(mi) {
      const m = S.MISSIONS[mi];
      this.acts = { go: () => this.startMission(mi), back: () => this.missionMenu() };
      const objs = m.objectives.map(o => `<li>${esc(this.L(o.text))}${o.optional ? ` <i>(${esc(this.t('optional'))})</i>` : ''}</li>`).join('');
      const kit = m.kit.weapons.map(w => this.L(WP[w].name)).join(', ') + (m.kit.ammo.charges ? ` · ${this.L(D.PICKUPS.charges.name)} ×${m.kit.ammo.charges}` : '');
      const r = this.openWin(`<div class="mh98-dossier"><div class="mh98-stamp">${this.lang === 'ru' ? 'СОВЕРШЕННО СЕКРЕТНО' : 'TOP SECRET'}</div>
        <div class="mh98-dhead"><canvas class="mh98-photo" width="160" height="120"></canvas><div><div class="mh98-dsub">${this.lang === 'ru' ? 'УСС · Задание' : 'OSS · Mission'} ${mi + 1}</div><h2>${esc(this.L(m.name))}</h2><div class="mh98-dsub">${esc(this.L(m.place))} · ${esc(this.L(m.date))}</div></div></div>
        <div class="mh98-brief">${m.brief.map(p => `<p>${esc(this.L(p))}</p>`).join('')}<p class="mh98-sign">— M. B.</p></div>
        <h3>${esc(this.t('objectives'))}</h3><ul class="mh98-objs">${objs}</ul><div class="mh98-kit">${esc(kit)}</div>
        <div class="mh98-menu row">${this.btn(this.t('start'), 'go')}${this.btn(this.t('back'), 'back', 'dim')}</div></div>`, 'mh98-wide paper');
      this.drawPhoto(r.querySelector('.mh98-photo'), m.id);
      this.onWinKey = c => { if (c === 'Enter') { this.startMission(mi); return true; } return false; };
      this.escBack = () => this.missionMenu();
    }
    drawPhoto(c, id) {
      const x = c.getContext('2d'), w = c.width, h = c.height;
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#b8b4a8'); g.addColorStop(1, '#6a665c'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = '#2a2824';
      const sil = {
        retriever: () => { x.fillRect(20, 50, 50, 50); x.beginPath(); x.moveTo(15, 50); x.lineTo(45, 28); x.lineTo(75, 50); x.fill(); x.fillRect(95, 20, 18, 80); x.beginPath(); x.moveTo(92, 20); x.lineTo(104, 4); x.lineTo(116, 20); x.fill(); x.fillRect(80, 70, 70, 30); },
        uboat: () => { x.beginPath(); x.ellipse(80, 80, 70, 12, 0, 0, 7); x.fill(); x.fillRect(66, 52, 24, 20); x.fillRect(74, 40, 3, 14); x.fillRect(0, 92, w, 28); x.fillStyle = '#4a5058'; x.fillRect(0, 96, w, 24); },
        rjukan: () => { x.beginPath(); x.moveTo(0, 60); x.lineTo(40, 20); x.lineTo(80, 55); x.lineTo(120, 15); x.lineTo(160, 50); x.lineTo(160, 120); x.lineTo(0, 120); x.fill(); x.fillStyle = '#8a857a'; x.fillRect(40, 62, 80, 34); x.fillStyle = '#2a2824'; for (let i = 0; i < 7; i++) x.fillRect(46 + i * 10, 68, 5, 8); },
        forest: () => { for (let i = 0; i < 9; i++) { const tx = 10 + i * 18; x.beginPath(); x.moveTo(tx, 100); x.lineTo(tx + 9, 25 + (i % 3) * 10); x.lineTo(tx + 18, 100); x.fill(); } x.fillStyle = '#1a1814'; x.fillRect(50, 80, 40, 14); x.fillRect(80, 78, 50, 4); },
        colditz: () => { x.fillRect(10, 40, 140, 60); for (let i = 0; i < 6; i++) x.fillRect(12 + i * 24, 30, 12, 12); x.fillRect(60, 10, 30, 40); x.fillStyle = '#c8c0a0'; for (let i = 0; i < 8; i++) x.fillRect(18 + i * 16, 58, 5, 8); },
        nordhausen: () => { x.beginPath(); x.moveTo(0, 70); x.quadraticCurveTo(80, 0, 160, 70); x.lineTo(160, 120); x.lineTo(0, 120); x.fill(); x.fillStyle = '#8a857a'; x.beginPath(); x.arc(80, 110, 26, Math.PI, 0); x.fill(); x.fillStyle = '#d8d4c8'; x.fillRect(118, 26, 8, 60); x.beginPath(); x.moveTo(118, 26); x.lineTo(122, 12); x.lineTo(126, 26); x.fill(); }
      }[id];
      if (sil) sil();
      const img = x.getImageData(0, 0, w, h), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 30, v = (d[i] + d[i + 1] + d[i + 2]) / 3 + n; d[i] = v * 1.05; d[i + 1] = v; d[i + 2] = v * 0.85; } x.putImageData(img, 0, 0);
      x.strokeStyle = '#f0ece0'; x.lineWidth = 6; x.strokeRect(0, 0, w, h);
    }
    pauseMenu() {
      if (this.state !== 'play') return;
      const T = k => this.t(k);
      this.acts = { res: () => this.resume(), obj: () => this.objectivesWin(), restart: () => this.startMission(this.game.mi), opt: () => this.optionsMenu(() => this.pauseMenu()), ctl: () => this.controlsMenu(() => this.pauseMenu()), menu: () => this.toMenu() };
      this.openWin(`<h2>${esc(T('paused'))}</h2><div class="mh98-menu">${this.btn(T('resume'), 'res')}${this.btn(T('objectivesBtn'), 'obj')}${this.btn(T('restart'), 'restart')}${this.btn(T('options'), 'opt')}${this.btn(T('controls'), 'ctl')}${this.btn(T('mainMenu'), 'menu')}</div>`, 'mh98-small');
      this.escBack = () => this.resume();
    }
    objectivesWin() {
      const g = this.game;
      this.acts = { back: () => this.pauseMenu() };
      const list = g.objectives.map(o => `<li class="${o.state}">${o.state === 'done' ? '☑' : o.state === 'failed' ? '☒' : '☐'} ${esc(this.L(o.text))}${o.optional ? ` <i>(${esc(this.t('optional'))})</i>` : ''}</li>`).join('');
      this.openWin(`<h2>${esc(this.L(g.mission.name))}</h2><ul class="mh98-objs big">${list}</ul><div class="mh98-menu row">${this.btn(this.t('back'), 'back', 'dim')}</div>`, 'mh98-small');
      this.escBack = () => this.pauseMenu();
    }
    failMenu(reason) {
      const g = this.game; if (!g) return;
      this.state = 'debrief';
      this.acts = { retry: () => this.startMission(g.mi), brief: () => this.briefing(g.mi), menu: () => this.toMenu() };
      this.openWin(`<h2 class="red">${esc(g.player.dead ? this.t('youDied') : this.t('missionFailed'))}</h2>${reason && reason !== true ? `<p class="mh98-center">${esc(reason)}</p>` : ''}<div class="mh98-menu">${this.btn(this.t('retry'), 'retry')}${this.btn(this.t('briefing'), 'brief')}${this.btn(this.t('mainMenu'), 'menu')}</div>`, 'mh98-small');
      this.onWinKey = c => { if (c === 'Enter') { this.startMission(g.mi); return true; } return false; };
    }
    debrief(r, final) {
      const g = this.game, st = g.stats, T = k => this.t(k);
      const mm = Math.floor(st.time / 60), ss = Math.floor(st.time % 60);
      const rows = [[T('time'), `${mm}:${String(ss).padStart(2, '0')}`], [T('kills'), st.kills], [T('headshots'), st.headshots], [T('shots'), st.shots], [T('accuracy'), st.shots ? `${Math.round(r.acc * 100)}%` : '—'], [T('hpLost'), Math.round(st.dmgTaken)], [T('alarms'), st.alarms], [T('rating'), `${r.rating} / 100`]];
      const next = g.mi + 1 < S.MISSIONS.length;
      this.acts = { next: () => next ? this.briefing(g.mi + 1) : this.slides(S.ENDING, () => this.medalCase(() => this.mainMenu(), true)), menu: () => this.toMenu(), retry: () => this.startMission(g.mi) };
      const el = this.openWin(`<h2>${esc(T('missionComplete'))}</h2><div class="mh98-dsub mh98-center">${esc(this.L(g.mission.name))}</div>
        <div class="mh98-debrief"><table>${rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>
        <div class="mh98-awards"><div class="lbl">${esc(T('awarded'))}</div><canvas width="360" height="150"></canvas><div class="mh98-medalnames">${r.medals.map(k => esc(this.L(D.MEDALS[k].name))).join(' · ')}</div></div></div>
        <div class="mh98-menu row">${this.btn(next ? T('next') : (this.lang === 'ru' ? 'Эпилог' : 'Epilogue'), 'next')}${this.btn(T('retry'), 'retry', 'dim')}${this.btn(T('mainMenu'), 'menu', 'dim')}</div>`, 'mh98-wide');
      const c = el.querySelector('canvas'), x = c.getContext('2d');
      r.medals.forEach((k, i) => drawMedal(x, k, 50 + i * 68, 90, 56));
      this.onWinKey = cc => { if (cc === 'Enter') { this.acts.next(); return true; } return false; };
      void final;
    }
    medalCase(back, ending) {
      const all = Object.keys(D.MEDALS), have = new Set();
      for (const k in this.prog.best) for (const m of this.prog.best[k].medals) have.add(m);
      if (this.prog.honor) have.add('honor');
      this.acts = { back };
      const el = this.openWin(`<h2>${esc(this.t('case'))}</h2><canvas class="mh98-case" width="640" height="300"></canvas>
        <div class="mh98-list small">${S.MISSIONS.map(m => { const b = this.prog.best[m.id]; return `<div class="mh98-mission"><b>${esc(this.L(m.name))}</b><em>${b ? b.medals.map(k => esc(this.L(D.MEDALS[k].name))).join(', ') + ` · ${b.rating}/100` : '—'}</em></div>`; }).join('')}</div>
        ${ending && this.prog.honor ? `<p class="mh98-center gold">${esc(this.L(D.MEDALS.honor.name))}: ${esc(this.L(D.MEDALS.honor.desc))}</p>` : ''}
        <div class="mh98-menu row">${this.btn(this.t('back'), 'back', 'dim')}</div>`, 'mh98-wide');
      const c = el.querySelector('canvas'), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#3a1a14'); g.addColorStop(1, '#1a0a08'); x.fillStyle = g; x.fillRect(0, 0, 640, 300);
      x.fillStyle = '#5a2a20'; for (let i = 0; i < 640; i += 4) x.fillRect(i, 0, 1, 300);
      x.strokeStyle = '#8a6a30'; x.lineWidth = 6; x.strokeRect(3, 3, 634, 294);
      all.forEach((k, i) => { const cx = 60 + (i % 4) * 170, cy = 110 + Math.floor(i / 4) * 150; drawMedal(x, k, cx, cy, 64, !have.has(k)); x.fillStyle = have.has(k) ? '#e8d8a0' : '#6a5a40'; x.font = `bold 11px ${FONT}`; x.textAlign = 'center'; x.fillText(this.L(D.MEDALS[k].name).slice(0, 26), cx, cy + 62); });
      this.escBack = back;
    }
    optionsMenu(back) {
      const o = this.options, T = k => this.t(k);
      const rows = [['sens', o.sens.toFixed(1)], ['invert', o.invert ? T('on') : T('off')], ['fov', o.fov + '°'], ['sfx', Math.round(o.sfx * 100) + '%'], ['music', Math.round(o.music * 100) + '%'], ['res', Math.round(RES[o.res] * 100) + '%'], ['bob', o.bob ? T('on') : T('off')], ['fps', o.fps ? T('on') : T('off')], ['lang', this.lang === 'ru' ? 'Русский' : 'English']];
      this.acts = { back };
      const step = (k, d) => {
        if (k === 'sens') o.sens = clamp(o.sens + d * 0.5, 1, 15); else if (k === 'invert') o.invert = !o.invert; else if (k === 'fov') o.fov = clamp(o.fov + d * 5, 55, 100);
        else if (k === 'sfx') o.sfx = clamp(Math.round((o.sfx + d * 0.1) * 10) / 10, 0, 1); else if (k === 'music') o.music = clamp(Math.round((o.music + d * 0.1) * 10) / 10, 0, 1);
        else if (k === 'res') { o.res = clamp(o.res + d, 0, 3); this.resize(); } else if (k === 'bob') o.bob = !o.bob; else if (k === 'fps') o.fps = !o.fps;
        else if (k === 'lang') { this.lang = this.lang === 'ru' ? 'en' : 'ru'; o.lang = this.lang; if (this.game) this.game.lang = this.lang; }
        this.saveOptions(); this.optionsMenu(back);
      };
      rows.forEach(([k]) => { this.acts['m_' + k] = () => step(k, -1); this.acts['p_' + k] = () => step(k, 1); });
      this.openWin(`<h2>${esc(T('options'))}</h2><div class="mh98-opts">${rows.map(([k, v]) => `<div class="mh98-opt"><span>${esc(T(k))}</span>${this.btn('◄', 'm_' + k, 'sm')}<b>${esc(v)}</b>${this.btn('►', 'p_' + k, 'sm')}</div>`).join('')}</div><div class="mh98-menu row">${this.btn(T('back'), 'back', 'dim')}</div>`, 'mh98-small');
      this.escBack = back;
    }
    controlsMenu(back) {
      this.acts = { back };
      this.openWin(`<h2>${esc(this.t('controls'))}</h2><ul class="mh98-help">${this.t('help').map(h => `<li>${esc(h)}</li>`).join('')}</ul><div class="mh98-menu row">${this.btn(this.t('back'), 'back', 'dim')}</div>`, 'mh98-small');
      this.escBack = back;
    }
    codesMenu(note) {
      const T = k => this.t(k), active = Object.keys(this.prog.codes).filter(k => this.prog.codes[k]);
      this.acts = {
        back: () => this.mainMenu(),
        apply: () => { const v = (this.winEl.querySelector('input').value || '').trim().toUpperCase(); if (D.CODES[v]) { this.prog.codes[v] = !this.prog.codes[v]; this.saveProgress(); this.codesMenu(T('codeOk') + ': ' + this.L(D.CODES[v].name)); } else this.codesMenu(T('codeBad')); }
      };
      this.openWin(`<h2>${esc(T('passwords'))}</h2><div class="mh98-code"><input maxlength="14" spellcheck="false" placeholder="${esc(T('enterCode'))}">${this.btn(T('apply'), 'apply', 'sm')}</div>${note ? `<p class="mh98-center">${esc(note)}</p>` : ''}
        <h3>${esc(T('activeCodes'))}</h3><ul class="mh98-help">${active.length ? active.map(k => `<li>${esc(k)} — ${esc(this.L(D.CODES[k].name))}</li>`).join('') : '<li>—</li>'}</ul><div class="mh98-menu row">${this.btn(T('back'), 'back', 'dim')}</div>`, 'mh98-small');
      const inp = this.winEl.querySelector('input'); setTimeout(() => inp.focus(), 0);
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') this.acts.apply(); if (e.key === 'Escape') this.mainMenu(); });
      this.escBack = () => this.mainMenu();
    }
    credits() {
      this.acts = { back: () => this.mainMenu() };
      const ru = this.lang === 'ru';
      this.openWin(`<h2>${esc(this.t('credits'))}</h2><div class="mh98-credits"><p><b>MEDAL OF HONOR 98</b></p><p>${ru ? 'Фанатский ремейк оригинала DreamWorks Interactive (1999) для Win 98 Edition.' : 'A fan remake of the DreamWorks Interactive original (1999) for Win 98 Edition.'}</p>
        <p>${ru ? 'Сценарий кампании, уровни, модели, звук и музыка сгенерированы процедурно.' : 'Campaign script, levels, models, sound and music are generated procedurally.'}</p><p>${ru ? 'Идея: честь — это долг, который исполняют, когда никто не видит.' : 'Idea: honor is the duty you do when no one is watching.'}</p><p class="dim">${ru ? 'Персонажи и операции вымышлены.' : 'Characters and operations are fictional.'}</p></div>
        <div class="mh98-menu row">${this.btn(this.t('back'), 'back', 'dim')}</div>`, 'mh98-small');
      this.escBack = () => this.mainMenu();
    }
    slides(list, done) {
      this.closeWin(); this.unlock();
      this.state = 'slides'; this.slideList = list.map(l => this.L(l)); this.slideI = 0; this.slideT = 0; this.slideDone = done;
      this.audio.resume(); this.audio.startMusic('menu');
    }
    slideNext(skip) {
      if (skip || this.slideI >= this.slideList.length - 1) { this.state = 'title'; const f = this.slideDone; this.slideDone = null; if (f) f(); return; }
      this.slideI++; this.slideT = 0;
    }

    drawHud() {
      const c = this.hctx, W = this.hud.width, H = this.hud.height, s = Math.max(0.6, Math.min(W / 1280, H / 800) * 1.15);
      c.clearRect(0, 0, W, H);
      if (this.state === 'loading') {
        c.fillStyle = '#0a0a08'; c.fillRect(0, 0, W, H); c.fillStyle = '#d8c890'; c.textAlign = 'center';
        c.font = `${Math.round(34 * s)}px ${HEAD}`; c.fillText(this.loadingName || '', W / 2, H / 2 - 10 * s);
        c.font = `bold ${Math.round(16 * s)}px ${FONT}`; c.fillStyle = '#8a8060'; c.fillText(this.t('loading') + '…', W / 2, H / 2 + 26 * s);
        return;
      }
      if (this.state === 'slides') { this.drawSlides(c, W, H, s); return; }
      if (this.state === 'title' || !this.game) { if (this.options.fps) this.drawFps(c, W, s); return; }
      const g = this.game, p = g.player;
      if (this.state === 'play' || this.state === 'dead') this.drawGameHud(c, W, H, s, g, p);
      if (this.state === 'dead') {
        const k = clamp(this.deadT / 1.2, 0, 1); c.fillStyle = `rgba(90,0,0,${0.45 * k})`; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.fillStyle = `rgba(240,220,200,${k})`; c.font = `${Math.round(48 * s)}px ${HEAD}`; c.fillText(this.t('youDied'), W / 2, H / 2);
        if (this.deadT > 1.2) { c.font = `bold ${Math.round(14 * s)}px ${FONT}`; c.fillText(this.t('pressFire'), W / 2, H / 2 + 34 * s); }
      }
      if (this.state === 'debrief' && !this.win) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.fillStyle = '#f0e0a0'; c.font = `${Math.round(40 * s)}px ${HEAD}`; c.fillText(g.done ? this.t('missionComplete') : this.t('missionFailed'), W / 2, H / 2); }
      if (this.options.fps) this.drawFps(c, W, s);
    }
    drawFps(c, W, s) { c.textAlign = 'right'; c.font = `bold ${Math.round(12 * s)}px ${FONT}`; c.fillStyle = '#ff0'; c.fillText(`${this.fps} FPS`, W - 8, 16 * s); }
    drawSlides(c, W, H, s) {
      this.slideT += 1 / 60;
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      const txt = this.slideList[this.slideI] || '', a = clamp(this.slideT * 1.5, 0, 1);
      c.fillStyle = `rgba(210,195,150,${a})`; c.textAlign = 'center'; c.font = `${Math.round(20 * s)}px Georgia, "Times New Roman", serif`;
      const words = txt.split(' '), lines = [], maxW = W * 0.7; let line = '';
      for (const w of words) { const tl = line ? line + ' ' + w : w; if (c.measureText(tl).width > maxW) { lines.push(line); line = w; } else line = tl; } if (line) lines.push(line);
      lines.forEach((l, i) => c.fillText(l, W / 2, H / 2 - (lines.length - 1) * 15 * s + i * 30 * s));
      c.fillStyle = 'rgba(140,130,100,0.8)'; c.font = `bold ${Math.round(12 * s)}px ${FONT}`; c.fillText(`${this.slideI + 1}/${this.slideList.length} · ${this.t('pressFire')}`, W / 2, H - 30 * s);
    }
    objectiveTarget(g) {
      const p = g.player; let best = null, bd = Infinity;
      const cand = (x, z) => { const d = Math.hypot(x - p.x, z - p.z); if (d < bd) { bd = d; best = { x, z, d }; } };
      for (const o of g.objectives) {
        if (o.state !== 'active') continue;
        if (o.type === 'take') { const it = g.pickups.find(i => i.id === o.item); if (it) cand(it.x, it.z); else for (const a of g.actors) if (!a.dead && a.drops && a.drops.includes(o.item)) cand(a.x, a.z); }
        else if (o.type === 'free') { for (const id of o.actors) { const a = g.actorById(id); if (a && !a.freed && !a.dead) cand(a.x, a.z); } }
        else if (o.type === 'destroy') { for (const id of o.targets || []) { const t = g.targetById(id); if (t && !t.dead) { const pl = g.plants.find(q => q.target === id && !q.planted); if (pl) cand(pl.x, pl.z); else cand(t.x, t.z); } } for (const id of o.tanks || []) { const t = g.tanks.find(k => k.id === id); if (t && !t.dead) cand(t.x, t.z); } }
        else if (o.type === 'kill') { for (const id of o.actors) { const a = g.actorById(id); if (a && !a.dead) cand(a.x, a.z); } }
      }
      if (!best) { const o = g.objectives.find(q => q.type === 'reach' && q.state === 'active'); if (o) { const z = g.zone(o.zone); if (z) cand((z.x0 + z.x1) / 2, (z.z0 + z.z1) / 2); } }
      return best;
    }
    drawGameHud(c, W, H, s, g, p) {
      const R = this.renderer, d = WP[g.cur];
      if (d && d.scope && p.aim > 0.6 && !p.dead) {
        const r = Math.min(W, H) * 0.42; c.save(); c.fillStyle = '#000'; c.beginPath(); c.rect(0, 0, W, H); c.moveTo(W / 2 + r, H / 2); c.arc(W / 2, H / 2, r, 0, Math.PI * 2, true); c.closePath(); c.fill('evenodd');
        c.strokeStyle = '#000'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(W / 2 - r, H / 2); c.lineTo(W / 2 - 8 * s, H / 2); c.moveTo(W / 2 + 8 * s, H / 2); c.lineTo(W / 2 + r, H / 2); c.moveTo(W / 2, H / 2 + 8 * s); c.lineTo(W / 2, H / 2 + r); c.stroke();
        c.lineWidth = 5 * s; c.beginPath(); c.moveTo(W / 2 - r, H / 2); c.lineTo(W / 2 - r * 0.5, H / 2); c.moveTo(W / 2 + r * 0.5, H / 2); c.lineTo(W / 2 + r, H / 2); c.moveTo(W / 2, H / 2 + r * 0.5); c.lineTo(W / 2, H / 2 + r); c.stroke(); c.restore();
      } else if (!p.dead && d && !d.papers && !d.throw && p.aim < 0.7) {
        const spread = g.spreadDeg(d), px = Math.tan(spread * Math.PI / 360) / Math.tan(this.curFov() * Math.PI / 360) * W / 2 + 4 * s;
        c.strokeStyle = 'rgba(230,230,210,0.85)'; c.lineWidth = 1.5 * s; c.beginPath();
        c.moveTo(W / 2 - px - 7 * s, H / 2); c.lineTo(W / 2 - px, H / 2); c.moveTo(W / 2 + px, H / 2); c.lineTo(W / 2 + px + 7 * s, H / 2); c.moveTo(W / 2, H / 2 - px - 7 * s); c.lineTo(W / 2, H / 2 - px); c.moveTo(W / 2, H / 2 + px); c.lineTo(W / 2, H / 2 + px + 7 * s); c.stroke();
      }
      if (p.hurtT > 0) { c.fillStyle = `rgba(160,0,0,${p.hurtT})`; c.fillRect(0, 0, W, H); }
      if (p.hp < 30) { const k = (30 - p.hp) / 30 * (0.25 + 0.15 * Math.sin(g.realT * 6)); const gr = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7); gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, `rgba(120,0,0,${k})`); c.fillStyle = gr; c.fillRect(0, 0, W, H); }
      for (const h of this.hurtArcs) {
        if (h.dir == null) continue;
        const rel = h.dir - p.yaw, a = -rel - Math.PI / 2, rr = Math.min(W, H) * 0.22;
        c.strokeStyle = `rgba(220,30,20,${(1 - h.t) * 0.8 * h.k})`; c.lineWidth = 10 * s; c.beginPath(); c.arc(W / 2, H / 2, rr, a - 0.35, a + 0.35); c.stroke();
      }
      const pad = 16 * s, bx = pad, by = H - pad - 54 * s;
      c.fillStyle = 'rgba(30,32,22,0.72)'; c.fillRect(bx, by, 250 * s, 54 * s); c.strokeStyle = '#8a8458'; c.lineWidth = 1.5 * s; c.strokeRect(bx, by, 250 * s, 54 * s);
      c.fillStyle = '#e8e8e0'; c.fillRect(bx + 10 * s, by + 12 * s, 30 * s, 30 * s); c.fillStyle = '#c02018'; c.fillRect(bx + 21 * s, by + 15 * s, 8 * s, 24 * s); c.fillRect(bx + 13 * s, by + 23 * s, 24 * s, 8 * s);
      const hpk = clamp(p.hp / 100, 0, 1);
      c.fillStyle = '#1a1a14'; c.fillRect(bx + 50 * s, by + 18 * s, 150 * s, 18 * s);
      c.fillStyle = hpk > 0.5 ? '#6a9a3a' : hpk > 0.25 ? '#c8a030' : '#c83020'; c.fillRect(bx + 50 * s, by + 18 * s, 150 * s * hpk, 18 * s);
      c.fillStyle = '#f0ecd8'; c.font = `${Math.round(22 * s)}px ${HEAD}`; c.textAlign = 'left'; c.fillText(Math.max(0, Math.ceil(p.hp)), bx + 208 * s, by + 36 * s);
      const ax = W - pad - 270 * s, ay = H - pad - 64 * s;
      c.fillStyle = 'rgba(30,32,22,0.72)'; c.fillRect(ax, ay, 270 * s, 64 * s); c.strokeStyle = '#8a8458'; c.strokeRect(ax, ay, 270 * s, 64 * s);
      if (d) {
        c.fillStyle = '#c8c090'; c.font = `bold ${Math.round(12 * s)}px ${FONT}`; c.textAlign = 'left'; c.fillText(this.L(d.name).toUpperCase(), ax + 10 * s, ay + 18 * s);
        c.textAlign = 'right';
        if (d.throw) { c.fillStyle = '#f0ecd8'; c.font = `${Math.round(30 * s)}px ${HEAD}`; c.fillText(g.ammo[d.ammo] || 0, ax + 258 * s, ay + 54 * s); }
        else if (!d.papers) { const mag = g.mag[g.cur] || 0; c.fillStyle = mag === 0 ? '#e05030' : '#f0ecd8'; c.font = `${Math.round(34 * s)}px ${HEAD}`; c.fillText(mag, ax + 180 * s, ay + 56 * s); c.fillStyle = '#b8b088'; c.font = `${Math.round(20 * s)}px ${HEAD}`; c.fillText('/ ' + (g.ammo[d.ammo] || 0), ax + 258 * s, ay + 54 * s); }
      }
      c.textAlign = 'left'; c.font = `bold ${Math.round(12 * s)}px ${FONT}`;
      let ix = ax + 10 * s; const iy = ay + 52 * s;
      const nades = (g.own.includes('grenade') ? g.ammo.grenade || 0 : 0) + (g.own.includes('stick') ? g.ammo.stick || 0 : 0);
      c.fillStyle = '#9aa068'; c.beginPath(); c.ellipse(ix + 6 * s, iy - 5 * s, 5 * s, 7 * s, 0, 0, 7); c.fill(); c.fillStyle = '#f0ecd8'; c.fillText('×' + nades, ix + 14 * s, iy); ix += 46 * s;
      if (g.charges > 0 || g.plants.length) { c.fillStyle = '#b06a30'; c.fillRect(ix, iy - 11 * s, 12 * s, 12 * s); c.fillStyle = '#f0ecd8'; c.fillText('×' + g.charges, ix + 15 * s, iy); }
      this.drawCompass(c, W, s, g, p);
      c.textAlign = 'left'; c.font = `bold ${Math.round(13 * s)}px ${FONT}`;
      this.msgs.forEach((m, i) => { const a = clamp(6 - m.t, 0, 1); c.fillStyle = 'rgba(0,0,0,0.5)'; const tw = c.measureText(m.text).width; c.fillRect(pad - 4 * s, 70 * s + i * 20 * s - 14 * s, tw + 8 * s, 19 * s); c.globalAlpha = a; c.fillStyle = m.color; c.fillText(m.text, pad, 70 * s + i * 20 * s); c.globalAlpha = 1; });
      c.textAlign = 'center';
      for (const sb of this.subs) {
        const a = g.actors.find(q => q.uid === sb.uid), px = a ? a.x : sb.x, py = a ? a.y + 2.1 : sb.y, pz = a ? a.z : sb.z;
        const pr = R.project(px, py, pz); if (!pr) continue;
        const al = clamp(3.2 - sb.t, 0, 1); c.font = `bold ${Math.round(13 * s)}px ${FONT}`; const tw = c.measureText(sb.text).width;
        c.fillStyle = `rgba(0,0,0,${0.55 * al})`; c.fillRect(pr[0] * W - tw / 2 - 5 * s, pr[1] * H - 15 * s, tw + 10 * s, 19 * s); c.fillStyle = `rgba(255,240,200,${al})`; c.fillText(sb.text, pr[0] * W, pr[1] * H);
      }
      const fo = g.focus; let prompt = null;
      if (fo && !p.dead) prompt = fo.kind === 'plant' ? (g.charges > 0 ? `[F] ${this.t('plant')}` : this.t('noCharges')) : fo.kind === 'free' ? `[F] ${this.t('free')}` : fo.kind === 'papers' ? this.t('showPapers') : null;
      if (!prompt && g.actors.some(a => a.ai && a.ai.state === 'inspect' && a.ai.asked && Math.hypot(a.x - p.x, a.z - p.z) < 6)) prompt = g.cur === 'papers' ? this.t('showPapers') : (this.lang === 'ru' ? '[7] Достать документы, затем [F]' : '[7] Take out papers, then [F]');
      if (g.planting) prompt = this.t('planting');
      if (prompt) { c.font = `bold ${Math.round(15 * s)}px ${FONT}`; const tw = c.measureText(prompt).width; c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(W / 2 - tw / 2 - 8 * s, H * 0.62 - 17 * s, tw + 16 * s, 24 * s); c.fillStyle = '#f0e8b0'; c.fillText(prompt, W / 2, H * 0.62); }
      if (g.planting) { const k = 1 - g.planting.t / 2; c.fillStyle = '#1a1a14'; c.fillRect(W / 2 - 80 * s, H * 0.62 + 12 * s, 160 * s, 8 * s); c.fillStyle = '#d0a040'; c.fillRect(W / 2 - 80 * s, H * 0.62 + 12 * s, 160 * s * k, 8 * s); }
      const armed = g.planted.filter(q => !q.done);
      if (armed.length) { const t = Math.min(...armed.map(q => q.fuse)); c.font = `${Math.round(26 * s)}px ${HEAD}`; c.fillStyle = Math.sin(g.realT * 10) > 0 ? '#ff5030' : '#ffd060'; c.fillText(`00:${String(Math.ceil(t)).padStart(2, '0')}`, W / 2, H * 0.2); }
      if (g.alarm) { c.font = `${Math.round(18 * s)}px ${HEAD}`; c.fillStyle = Math.sin(g.realT * 6) > 0 ? '#ff4030' : '#a02010'; c.fillText(this.t('alarm'), W / 2, 72 * s); }
      else if (g.disguised) { c.font = `bold ${Math.round(12 * s)}px ${FONT}`; c.fillStyle = '#a8c0e0'; c.fillText(this.lang === 'ru' ? '— ПОД ПРИКРЫТИЕМ —' : '— UNDERCOVER —', W / 2, 72 * s); }
      if (this.keys.has('Tab')) {
        const list = g.objectives; c.fillStyle = 'rgba(20,20,14,0.82)'; const bw = 460 * s, bh = (50 + list.length * 24) * s, x0 = W / 2 - bw / 2, y0 = H / 2 - bh / 2;
        c.fillRect(x0, y0, bw, bh); c.strokeStyle = '#8a8458'; c.strokeRect(x0, y0, bw, bh);
        c.textAlign = 'left'; c.fillStyle = '#e8d8a0'; c.font = `${Math.round(18 * s)}px ${HEAD}`; c.fillText(this.L(g.mission.name), x0 + 14 * s, y0 + 26 * s);
        c.font = `bold ${Math.round(13 * s)}px ${FONT}`;
        list.forEach((o, i) => { c.fillStyle = o.state === 'done' ? '#90d070' : o.state === 'failed' ? '#e06040' : '#f0ecd8'; c.fillText(`${o.state === 'done' ? '[x]' : o.state === 'failed' ? '[-]' : '[ ]'} ${this.L(o.text)}${o.optional ? ' *' : ''}`, x0 + 14 * s, y0 + (50 + i * 24) * s); });
      }
    }
    drawCompass(c, W, s, g, p) {
      const cw = 320 * s, ch = 26 * s, x0 = W / 2 - cw / 2, y0 = 12 * s;
      c.fillStyle = 'rgba(30,32,22,0.72)'; c.fillRect(x0, y0, cw, ch); c.strokeStyle = '#8a8458'; c.lineWidth = 1.5 * s; c.strokeRect(x0, y0, cw, ch);
      c.save(); c.beginPath(); c.rect(x0, y0, cw, ch); c.clip();
      const fovC = Math.PI * 0.75, px = a => W / 2 + (S.wrapAng(a - p.yaw) / fovC) * cw;
      const labels = [[0, 'N'], [Math.PI / 2, 'E'], [Math.PI, 'S'], [-Math.PI / 2, 'W']];
      c.textAlign = 'center'; c.font = `bold ${Math.round(13 * s)}px ${FONT}`;
      for (let i = 0; i < 24; i++) { const a = -i * Math.PI / 12, x = px(-a); c.fillStyle = '#6a6a50'; c.fillRect(x - 0.5, y0 + ch - 7 * s, 1, 5 * s); }
      for (const [a, l] of labels) { c.fillStyle = l === 'N' ? '#e05030' : '#d8d0a8'; c.fillText(l, px(-a) , y0 + 17 * s); }
      const tg = this.objectiveTarget(g);
      if (tg) { const ang = Math.atan2(tg.x - p.x, tg.z - p.z), x = clamp(px(-ang), x0 + 8 * s, x0 + cw - 8 * s); c.fillStyle = '#ffd040'; fillStar(c, x, y0 + ch / 2, 8 * s); c.fillStyle = '#ffd040'; c.font = `bold ${Math.round(10 * s)}px ${FONT}`; c.fillText(`${Math.round(tg.d)}m`, clamp(x, x0 + 20 * s, x0 + cw - 20 * s), y0 + ch + 12 * s); }
      c.restore();
      c.fillStyle = '#f0e0a0'; c.beginPath(); c.moveTo(W / 2 - 5 * s, y0); c.lineTo(W / 2 + 5 * s, y0); c.lineTo(W / 2, y0 + 6 * s); c.fill();
    }
    destroy() {
      this.destroyed = true; cancelAnimationFrame(this.raf); this.ac.abort();
      if (this.ro) this.ro.disconnect(); this.unlock();
      if (this.audio) this.audio.destroy(); if (this.renderer) this.renderer.destroy();
    }
  }
  function fillStar(c, x, y, r) { drawStar(c, x, y, r); c.fill(); }

  S.UI = UI;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Moh98 = globalThis.Moh98 || {});
