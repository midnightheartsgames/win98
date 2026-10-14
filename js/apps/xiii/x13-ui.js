(function (X) {
  'use strict';
  const PROFILE_KEY = 'x13_profile_v1';
  const OPTS_KEY = 'x13_opts_v1';
  const SHOTS_KEY = 'x13_shots_v1';
  const OPTS_DEF = { sens: 4, invert: false, fov: 74, sfx: 0.8, music: 0.45, scale: 1, lineW: 1, gamma: 1, hatch: true, panels: true, sense: true, blood: true };
  const KEYS = {
    KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
    Space: 'jump', KeyC: 'crouch', ControlLeft: 'crouch', ControlRight: 'crouch', ShiftLeft: 'walk', ShiftRight: 'walk', KeyE: 'use', KeyF: 'use'
  };
  const EDGE = { KeyR: 'reload', KeyQ: 'lastWeapon', KeyG: 'grenade', KeyH: 'medkit' };

  function loadJSON(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v || d; } catch (e) { return d; } }
  function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  class UI {
    constructor(root, host) {
      this.host = host || {};
      this.root = root;
      this.opts = Object.assign({}, OPTS_DEF, loadJSON(OPTS_KEY, {}));
      this.opts.onExit = this.host.onExit || null;
      this.profile = Object.assign({ unlocked: 1, best: {}, docs: {}, difficulty: 1, campaign: null }, loadJSON(PROFILE_KEY, {}));
      this.shots = loadJSON(SHOTS_KEY, {});
      this.build();
      try {
        this.r = new X.Renderer(this.view, { preserve: !!this.host.preserve });
      } catch (e) {
        this.glError = String(e && e.message || e);
        this.r = null;
      }
      this.fx = new X.FX(this.r);
      if (this.r) this.r.fx = this.fx;
      this.hud = new X.HUD(this.hudCv, this);
      this.panels = new X.Panels(this);
      this.audio = new X.Audio();
      this.menu = new X.Menu(this);
      this.keys = {};
      this.edges = {};
      this.mouse = { fire: false };
      this.yaw = 0; this.pitch = 0;
      this.mode = 'menu';
      this.acc = 0;
      this.last = 0;
      this.time = 0;
      this.shake = 0;
      this.flash = 0;
      this.hurtT = -10;
      this.memT = -10;
      this.bobT = 0;
      this.combatT = -10;
      this.vmCache = {};
      this.applyOpts();
      this.bind();
      this.menu.show('main');
      this.raf = requestAnimationFrame(t => this.frame(t));
    }

    build() {
      const el = document.createElement('div');
      el.className = 'x13';
      el.tabIndex = 0;
      el.innerHTML = '<canvas class="x13-view"></canvas><canvas class="x13-hud"></canvas><div class="x13-layer x13-menu"></div>';
      this.root.appendChild(el);
      this.el = el;
      this.view = el.querySelector('.x13-view');
      this.hudCv = el.querySelector('.x13-hud');
      this.menuEl = el.querySelector('.x13-menu');
    }
    active() { return this.host.isActive ? this.host.isActive() : true; }
    saveProfile() { saveJSON(PROFILE_KEY, this.profile); }
    applyOpts() {
      const o = this.opts;
      const save = Object.assign({}, o); delete save.onExit;
      saveJSON(OPTS_KEY, save);
      this.audio.setVolume(o.sfx, o.music);
      if (this.r) { this.r.lineW = o.lineW; this.r.gamma = o.gamma; this.r.hatch = o.hatch ? 0.8 : 0; }
      this.panels.enabled = !!o.panels;
    }

    bind() {
      const el = this.el;
      this.onKeyDown = e => {
        if (!this.active()) return;
        this.audio.init(); this.audio.resume();
        if (this.mode === 'menu' && !this.menu.cur) this.menu.show('main');
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
        if (this.mode === 'comic') {
          if (e.code === 'Escape') { e.preventDefault(); this.comic.key('skip'); }
          else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') { e.preventDefault(); this.comic.key('next'); this.audio.play('page'); }
          return;
        }
        if (e.code === 'Escape') {
          e.preventDefault();
          if (this.mode === 'play') this.pause();
          else if (this.mode === 'paused' || this.mode === 'menu') this.menu.back();
          return;
        }
        if (this.mode !== 'play') return;
        const k = KEYS[e.code];
        if (k || EDGE[e.code] || /^Digit[1-9]$/.test(e.code) || e.code === 'Tab' || e.code === 'F5' || e.code === 'F9') e.preventDefault();
        if (k) this.keys[k] = true;
        if (EDGE[e.code] && !e.repeat) this.edges[EDGE[e.code]] = true;
        if (/^Digit[1-9]$/.test(e.code) && !e.repeat) this.edges.slot = Number(e.code.slice(5));
        if (e.code === 'Tab') this.showObjectives = true;
        if (e.code === 'F5' && !e.repeat) this.quickSave();
        if (e.code === 'F9' && !e.repeat) this.quickLoad();
      };
      this.onKeyUp = e => {
        const k = KEYS[e.code];
        if (k) this.keys[k] = false;
        if (e.code === 'Tab') this.showObjectives = false;
      };
      this.onMouseMove = e => {
        if (this.mode !== 'play' || document.pointerLockElement !== this.view) return;
        const zoomK = this.zoomFov ? this.zoomFov / this.opts.fov : 1;
        const s = this.opts.sens * 0.00055 * zoomK;
        this.yaw = X.wrap(this.yaw - e.movementX * s);
        this.pitch = X.clamp(this.pitch - e.movementY * s * (this.opts.invert ? -1 : 1), -1.45, 1.45);
        this.swayX = (this.swayX || 0) + e.movementX * 0.0004;
        this.swayY = (this.swayY || 0) + e.movementY * 0.0004;
      };
      this.onMouseDown = e => {
        this.audio.init(); this.audio.resume();
        if (this.mode === 'comic') { this.comic.key('next'); this.audio.play('page'); e.preventDefault(); return; }
        if (this.mode !== 'play') return;
        if (document.pointerLockElement !== this.view && this.view.requestPointerLock && !this.host.noLock) {
          try { const r = this.view.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (err) { }
        }
        if (e.button === 0) this.mouse.fire = true;
        if (e.button === 2) this.edges.zoom = true;
        e.preventDefault();
      };
      this.onMouseUp = e => { if (e.button === 0) this.mouse.fire = false; };
      this.onWheel = e => {
        if (this.mode !== 'play') return;
        e.preventDefault();
        if (e.deltaY > 0) this.edges.next = true; else if (e.deltaY < 0) this.edges.prev = true;
      };
      this.onContext = e => e.preventDefault();
      this.onBlur = () => { this.keys = {}; this.mouse.fire = false; };
      this.onLock = () => {
        const locked = document.pointerLockElement === this.view;
        if (!locked && this.mode === 'play' && this.hadLock && !this.host.noLock) this.pause();
        this.hadLock = locked;
      };
      this.keyTarget = this.host.standalone ? window : el;
      this.keyTarget.addEventListener('keydown', this.onKeyDown);
      this.keyTarget.addEventListener('keyup', this.onKeyUp);
      document.addEventListener('mousemove', this.onMouseMove);
      el.addEventListener('mousedown', this.onMouseDown);
      document.addEventListener('mouseup', this.onMouseUp);
      document.addEventListener('pointerlockchange', this.onLock);
      el.addEventListener('wheel', this.onWheel, { passive: false });
      el.addEventListener('contextmenu', this.onContext);
      window.addEventListener('blur', this.onBlur);
      el.addEventListener('mousedown', () => el.focus({ preventScroll: true }));
      el.focus({ preventScroll: true });
    }
    unlock() { if (document.pointerLockElement === this.view && document.exitPointerLock) document.exitPointerLock(); }

    newCampaign() {
      this.profile.campaign = { level: X.LEVELS[0].id, carry: null, snapshot: null };
      this.saveProfile();
      this.startLevel(X.LEVELS[0].id, { intro: true });
    }
    continueCampaign() {
      const c = this.profile.campaign;
      if (!c) { this.newCampaign(); return; }
      if (c.snapshot && c.snapshot.level === c.level) this.startLevel(c.level, { snapshot: c.snapshot, carry: c.carry });
      else this.startLevel(c.level, { intro: true, carry: c.carry });
    }
    startChapter(id) {
      this.profile.campaign = { level: id, carry: null, snapshot: null };
      this.saveProfile();
      this.startLevel(id, { intro: true });
    }
    startLevel(id, o) {
      o = o || {};
      const def = X.level(id);
      if (!def) return;
      this.menu.show('loading', def);
      this.mode = 'loading';
      this.unlock();
      this.pendingStart = { id, o, t: 0 };
    }
    doStart(id, o) {
      const def = X.level(id);
      if (this.game) this.endGame();
      this.levelCarry = o.carry || null;
      const game = new X.Game({ level: id, difficulty: this.profile.difficulty === undefined ? 1 : this.profile.difficulty, carry: o.carry || null, snapshot: o.snapshot || null, seed: 1300 + (Date.now() % 1000), deaths: o.deaths || 0 });
      this.game = game;
      if (this.r) this.r.setLevel(game);
      this.fx.game = game;
      this.fx.parts = []; this.fx.decals = []; this.fx.tracers = [];
      this.hud.reset();
      this.panels.clear();
      this.yaw = game.player.yaw; this.pitch = game.player.pitch;
      this.eyeY = null;
      this.keys = {}; this.edges = {}; this.mouse.fire = false;
      this.deadT = null;
      this.levelMusic = def.music === 'beach' || def.stealth ? 'stealth' : 'calm';
      this.audio.ambience(def.ambience || 'surf');
      this.processEvents();
      if (o.intro && def.comics && def.comics.intro && !o.snapshot) this.playComic(def.comics.intro, () => this.beginPlay());
      else this.beginPlay();
    }
    beginPlay() {
      this.menu.hide();
      this.mode = 'play';
      this.acc = 0;
      this.audio.music(this.game.musicMode || this.levelMusic);
      this.el.focus({ preventScroll: true });
    }
    endGame() {
      this.game = null;
      this.fx.game = null;
      this.panels.clear();
    }
    playComic(pages, done) {
      this.menu.hide();
      this.mode = 'comic';
      this.unlock();
      this.audio.music('menu');
      this.comic = new X.Comic(this, pages, { onDone: () => { this.comic = null; done(); } });
    }
    pause() {
      if (this.mode !== 'play') return;
      this.mode = 'paused';
      this.unlock();
      this.keys = {}; this.mouse.fire = false;
      this.menu.stack = [];
      this.menu.show('pause');
    }
    resume() {
      this.menu.hide();
      this.mode = 'play';
      this.last = 0;
      this.el.focus({ preventScroll: true });
    }
    loadCheckpoint() {
      const g = this.game;
      if (!g) return;
      const snap = g.saved;
      this.startLevel(g.def.id, { snapshot: snap, carry: this.levelCarry, deaths: g.stats.deaths });
    }
    restartLevel() {
      const g = this.game;
      if (!g) return;
      this.startLevel(g.def.id, { carry: this.levelCarry, intro: false });
    }
    quitToMenu() {
      this.unlock();
      this.endGame();
      this.mode = 'menu';
      this.menu.stack = [];
      this.menu.show('main');
      this.audio.music('menu');
      this.audio.ambience(null);
    }
    quickSave() {
      if (!this.game || this.game.state !== 'play') return;
      this.quick = this.game.serialize();
      this.hud.msg('Быстрое сохранение', 1.5);
      this.audio.play('checkpoint');
    }
    quickLoad() {
      if (!this.quick || !this.game || this.quick.level !== this.game.def.id) return;
      this.startLevel(this.game.def.id, { snapshot: this.quick, carry: this.levelCarry });
    }

    frame(ts) {
      this.raf = requestAnimationFrame(t => this.frame(t));
      const dt = this.last ? Math.min(0.1, Math.max(0, (ts - this.last) / 1000)) : 0.016;
      this.last = ts;
      this.time += dt;
      this.fitCanvas();
      try {
        this.tick(dt);
      } catch (err) {
        console.error(err);
        this.lastError = err;
        if (this.mode !== 'menu') { this.quitToMenu(); this.hud.clear(); }
      }
    }
    tick(dt) {
      if (this.mode === 'loading') {
        const ps = this.pendingStart;
        if (ps && ++ps.t >= 2) { this.pendingStart = null; this.doStart(ps.id, ps.o); }
        return;
      }
      if (this.mode === 'comic' && this.comic) {
        this.comic.update(dt);
        this.comic.draw();
        this.hud.clear();
        this.comic.drawText(this.hud.ctx, this.hud.k || 1);
        return;
      }
      const g = this.game;
      if (!g) { this.hud.clear(); if (this.r) { const gl = this.r.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); } return; }
      if (this.mode === 'play') {
        this.acc += dt;
        let n = 0;
        while (this.acc >= X.TICK && n < 6) {
          g.step(this.buildInput());
          this.acc -= X.TICK;
          n++;
          this.processEvents();
          if (this.mode !== 'play') break;
        }
        if (n >= 6) this.acc = 0;
      }
      if (this.mode === 'dying') {
        this.deadT += dt;
        g.time += dt;
        if (this.deadT > 2.2) { this.mode = 'dead'; this.unlock(); this.menu.show('dead'); }
      }
      this.updateAuto();
      this.fx.update(dt, g);
      this.panels.update(dt);
      this.hud.update(dt);
      this.render(dt);
      if (this.mode === 'play' && g.time > 2.5 && !this.shots[g.def.id]) this.captureShot(g.def.id);
    }
    captureShot(id) {
      if (!this.r || !this.view.width) return;
      const c = document.createElement('canvas');
      c.width = 240; c.height = 180;
      const sw = this.view.width, sh = this.view.height, k = Math.min(sw / 4, sh / 3);
      try {
        c.getContext('2d').drawImage(this.view, (sw - k * 4) / 2, (sh - k * 3) / 2, k * 4, k * 3, 0, 0, 240, 180);
        this.shots[id] = c.toDataURL('image/jpeg', 0.66);
        saveJSON(SHOTS_KEY, this.shots);
      } catch (e) {
        this.shots[id] = 'none';
      }
    }
    fitCanvas() {
      const w = Math.max(64, this.el.clientWidth), h = Math.max(48, this.el.clientHeight);
      const s = this.opts.scale || 1;
      if (this.r) this.r.resize(Math.round(w * s), Math.round(h * s));
      this.hud.resize(w, h);
    }
    buildInput() {
      const k = this.keys, e = this.edges;
      const inp = {
        fwd: (k.fwd ? 1 : 0) - (k.back ? 1 : 0), side: (k.right ? 1 : 0) - (k.left ? 1 : 0),
        yaw: this.yaw, pitch: this.pitch, jump: !!k.jump, crouch: !!k.crouch, walk: !!k.walk, use: !!k.use, fire: this.mouse.fire,
        zoom: !!e.zoom, reload: !!e.reload, slot: e.slot || 0, next: !!e.next, prev: !!e.prev, lastWeapon: !!e.lastWeapon, grenade: !!e.grenade, medkit: !!e.medkit
      };
      this.edges = {};
      return inp;
    }
    updateAuto() {
      const g = this.game;
      if (!g || this.mode !== 'play') return;
      const p = g.player;
      this.yaw = p.yaw; this.pitch = p.pitch;
      const fighting = g.chars.some(c => c.state === 'alive' && c.team === 'enemy' && c.ai && c.ai.alert === 2 && (c.ai.seeNow || g.time - c.ai.lastSeenT < 4));
      if (fighting) this.combatT = g.time;
      const want = g.musicMode === 'boss' ? 'boss' : (g.time - this.combatT < 8 ? 'combat' : (g.musicMode || this.levelMusic));
      this.audio.music(want);
      if (p.health < 25 && p.alive && Math.floor(g.time * 1.2) !== this.heartN) { this.heartN = Math.floor(g.time * 1.2); this.audio.play('heart', { vol: 0.5 }); }
      if (Math.floor(g.time * 11) !== this.rotorN) {
        this.rotorN = Math.floor(g.time * 11);
        for (const v of g.vehicles) if (v.kind === 'heli' && v.active && !v.crashed && X.vdist(v.pos, p.pos) < 160) this.audio.play('heli', { pos: v.pos, vol: 0.55 });
      }
      this.prompt = this.promptFor(g);
    }
    promptFor(g) {
      const p = g.player;
      if (!p.alive) return null;
      if (p.hostage) return '[ЛКМ] оглушить · [E] отпустить заложника';
      if (p.body) return '[E] положить тело';
      if (p.rope) return '[W]/[S] лезть · [Пробел] отцепиться';
      const eye = g.eyePos(), dir = X.fwd(p.yaw, p.pitch);
      for (const u of g.usables) {
        if (!u.enabled) continue;
        const d = X.vsub(u.pos, eye), dist = X.vlen(d);
        if (dist > u.r + 0.5) continue;
        if (X.vdot(X.vscale(d, 1 / Math.max(dist, 0.01)), dir) < (dist < 0.9 ? -0.2 : 0.55)) continue;
        return '[E] ' + u.label;
      }
      const hit = g.world.ray(eye, dir, 2.4, X.F.SOLID);
      if (hit && hit.block && hit.block.isMover) {
        const d = g.doors.find(q => q.block === hit.block);
        if (d) return d.target === 1 ? (d.noClose ? null : '[E] закрыть') : d.locked ? (d.locked === 'pick' ? (p.gadgets.lockpick ? '[E] (удерживать) — взломать замок' : 'Заперто: нужна отмычка') : d.locked === 'script' ? (d.label || 'Заперто') : (p.keys.includes(d.locked) ? '[E] открыть ключом' : 'Заперто: нужен ключ' + (d.keyName ? ' «' + d.keyName + '»' : ''))) : '[E] открыть';
      }
      if (p.gadgets.hook) for (const h of g.grapples) {
        const dh = Math.hypot(h.pos[0] - p.pos[0], h.pos[2] - p.pos[2]);
        if (dh < 3.2 && p.pos[1] < h.pos[1] && p.pos[1] > h.bottom - 1.5) return '[E] забросить кошку';
      }
      for (const o of g.objects) {
        if (o.taken || o.broken) continue;
        const d = X.vsub([o.pos[0], o.pos[1] + 0.3, o.pos[2]], eye), dist = X.vlen(d);
        if (dist > 2.1 || X.vdot(X.vscale(d, 1 / dist), dir) < 0.6) continue;
        return '[E] взять: ' + ((X.OBJECTS[o.kind] || {}).name || o.kind).toLowerCase();
      }
      const f = X.fwd(p.yaw, 0);
      for (const c of g.chars) {
        if (c.state !== 'alive' || c.boss || c.team === 'ally' || c.grp) continue;
        const dx = c.pos[0] - p.pos[0], dz = c.pos[2] - p.pos[2], dist = Math.hypot(dx, dz);
        if (dist > 1.5 || (dx * f[0] + dz * f[2]) / dist < 0.5) continue;
        const cf = X.fwd(c.yaw, 0);
        if ((cf[0] * dx + cf[2] * dz) / dist > 0.2 || (c.ai && c.ai.stunT > 0)) return '[E] взять в заложники';
      }
      for (const c of g.chars) {
        if ((c.state !== 'dead' && c.state !== 'ko') || c.boss) continue;
        const dist = Math.hypot(c.pos[0] - p.pos[0], c.pos[2] - p.pos[2]);
        if (dist < 1.3 && Math.abs(c.pos[1] - p.pos[1]) < 0.8) return '[E] поднять тело';
      }
      return null;
    }

    processEvents() {
      const g = this.game;
      if (!g) return;
      const evs = g.events;
      g.events = [];
      for (const e of evs) this.onEvent(e, g);
    }
    onEvent(e, g) {
      const A = this.audio, H = this.hud, p = g.player;
      this.fx.event(e, g);
      switch (e.t) {
        case 'fire':
          if (e.who === 'player') {
            A.play(e.w, { vol: 0.9 });
            if (e.w !== 'silenced' && e.w !== 'crossbow' && e.w !== 'harpoon') this.muzzleT = this.time;
            this.shake = Math.max(this.shake, (X.WEAPONS[e.w] || {}).recoil || 0.03);
          } else {
            const c = g.char(e.who);
            A.play(e.w, { pos: c ? c.pos : e.from, vol: 0.9 });
          }
          break;
        case 'shot':
          if (e.whiz && X.vdist(e.to, p.pos) < 6) A.play('whiz', { vol: 0.5 });
          break;
        case 'impact': if (X.vdist(e.p, p.pos) < 30) A.play('impact', { pos: e.p, vol: 0.5, metal: /metal|container|car|barrel|chrome|locker|bars/.test(e.mat || '') }); break;
        case 'death':
          A.play('thud', { pos: (g.char(e.id) || {}).pos, vol: 0.7 });
          if (e.head && e.byPlayer) { const c = g.char(e.id); if (c && this.opts.panels) { this.panels.headshot(g, c); A.play('headshot', { vol: 0.8 }); } }
          break;
        case 'ko': A.play('thud', { pos: (g.char(e.id) || {}).pos, vol: 0.6 }); break;
        case 'word': H.word(e.text, e.p, e.style); break;
        case 'hurt':
          H.hurt(e.dir);
          this.hurtT = this.time;
          this.hurtAmt = Math.min(1, (this.hurtAmt || 0) * 0.5 + e.dmg / 25);
          A.play('hurt', { vol: 0.8 });
          this.shake = Math.max(this.shake, 0.06);
          break;
        case 'playerDead':
          this.mode = 'dying';
          this.deadT = 0;
          this.keys = {}; this.mouse.fire = false;
          A.play('pain', { vol: 1 });
          A.music('sad');
          break;
        case 'pickup': H.pick(e.name); A.play('pickup', { vol: 0.6 }); break;
        case 'doc': {
          H.note('doc', e.title);
          A.play('doc', { vol: 0.7 });
          const P = this.profile;
          P.docs = P.docs || {};
          const L = P.docs[g.def.id] = P.docs[g.def.id] || { found: {}, total: g.stats.secretsTotal };
          L.found[e.id] = { title: e.title, text: e.text };
          L.total = g.stats.secretsTotal;
          this.saveProfile();
          this.hud.caption = { text: e.title + ': ' + e.text, t: 0, life: 7, bg: '#f2ead4' };
          break;
        }
        case 'msg': H.msg(e.text, e.dur); break;
        case 'sfx': A.play(e.name, { pos: e.p, vol: e.vol === undefined ? 1 : e.vol }); break;
        case 'say': H.say(e.id, e.text, e.dur, e.radio); break;
        case 'caption': H.caption = { text: e.text, t: 0, life: e.dur || 4 }; break;
        case 'objective': H.note(e.state === 'new' ? (e.optional ? 'optional' : 'new') : e.state, e.text); A.play(e.state === 'done' ? 'checkpoint' : 'panel', { vol: 0.5 }); break;
        case 'panel': this.panels.fromEvent(e, g); if (this.opts.panels) A.play('panel', { vol: 0.6 }); break;
        case 'explode': {
          A.play('explosion', { pos: e.p, vol: 1.2 });
          const d = X.vdist(e.p, p.pos);
          this.shake = Math.max(this.shake, Math.max(0, 0.25 - d * 0.012));
          if (d < 25) this.flash = Math.max(this.flash, 0.25 * (1 - d / 25));
          break;
        }
        case 'glass': A.play('glass', { pos: e.p }); break;
        case 'door': A.play(e.bars ? 'bars' : 'door', { pos: e.p, vol: 0.6 }); break;
        case 'alarm': A.play('alarm', { vol: 0.8 }); this.combatT = g.time; break;
        case 'step': A.play('step', { mat: e.mat, run: e.run, vol: 0.7 }); break;
        case 'land': A.play('land', { vol: 0.6 }); break;
        case 'jump': A.play('jump', { vol: 0.4 }); break;
        case 'reload': A.play('reload', { vol: 0.6 }); break;
        case 'shell': A.play('shell', { vol: 0.5 }); break;
        case 'dry': A.play('dry', { vol: 0.6 }); break;
        case 'switch': A.play('switch', { vol: 0.5 }); H.wselT = g.time; break;
        case 'throw':
          A.play('throw', { vol: 0.5 });
          if (e.kind === 'grenade' && !e.who && this.opts.panels) this.panels.grenade(g, e.id);
          break;
        case 'melee': A.play(e.hit ? (e.w === 'object' ? 'bonk' : 'punch') : 'swing', { vol: 0.8 }); this.meleeT = this.time; break;
        case 'objBreak': A.play('bonk', { vol: 0.9 }); break;
        case 'hostage': H.msg('Заложник! [ЛКМ] — оглушить, [E] — отпустить. Враги не станут стрелять.', 4); A.play('punch', { vol: 0.4 }); break;
        case 'checkpoint':
          H.cpT = g.time;
          A.play('checkpoint', { vol: 0.5 });
          if (this.profile.campaign && this.profile.campaign.level === g.def.id) { this.profile.campaign.snapshot = g.saved; this.profile.campaign.carry = this.levelCarry; this.saveProfile(); }
          break;
        case 'comic': {
          const pages = g.def.comics && g.def.comics[e.key];
          if (pages) { this.unlock(); this.playComic(pages, () => { g.pendingComic = null; this.beginPlay(); }); }
          break;
        }
        case 'music': this.levelMusic = e.mode; break;
        case 'memory':
          this.memT = this.time;
          A.play('memory', { vol: 0.8 });
          if (e.skill) H.note('memory', (X.SKILLS[e.skill] || {}).name + ': ' + (X.SKILLS[e.skill] || {}).desc);
          if (e.text) H.caption = { text: e.text, t: 0, life: 6, bg: '#e8dcc0' };
          break;
        case 'finish': this.onFinish(); break;
        case 'fail':
          this.mode = 'failed';
          this.unlock();
          A.music('sad');
          setTimeout(() => { if (this.mode === 'failed') this.menu.show('failed', e.reason); }, 900);
          break;
        case 'spotted':
          if (this.time - (this.spotT || -10) > 6) { this.spotT = this.time; A.play('spotted', { vol: 0.5 }); }
          break;
        case 'bodyFound': A.play('spotted', { vol: 0.4 }); break;
        case 'lockStart': case 'lockTick': A.play('lock', { vol: 0.5 }); break;
        case 'unlocked': A.play('unlock', { vol: 0.6 }); break;
        case 'locked': A.play('locked', { vol: 0.6 }); break;
        case 'grapple': A.play('grapple', { vol: 0.7 }); break;
        case 'splash': A.play('splash', { vol: 0.7 }); break;
        case 'swim': A.play('swim', { vol: 0.4 }); break;
        case 'heal': A.play('pickup', { vol: 0.5 }); H.msg('+50 здоровья', 1.5); break;
        case 'camDead': A.play('glass', { pos: e.p, vol: 0.6 }); break;
        case 'zoom': A.play('switch', { vol: 0.3 }); break;
      }
    }
    onFinish() {
      const g = this.game;
      this.mode = 'complete';
      this.unlock();
      const P = this.profile;
      const i = X.LEVELS.findIndex(l => l.id === g.def.id);
      P.unlocked = Math.max(P.unlocked || 1, i + 2);
      const st = g.stats;
      const prev = P.best[g.def.id];
      if (!prev || st.time < prev.time || st.secrets > prev.secrets) P.best[g.def.id] = { time: Math.round(st.time), secrets: Math.max(st.secrets, prev ? prev.secrets : 0), secretsTotal: st.secretsTotal };
      const next = X.LEVELS[i + 1];
      this.carryOut = g.loadout();
      P.campaign = next ? { level: next.id, carry: this.carryOut, snapshot: null } : null;
      this.saveProfile();
      this.audio.music('calm');
      setTimeout(() => { if (this.mode === 'complete') this.menu.show('complete'); }, 700);
    }
    afterStats() {
      const g = this.game;
      const i = X.LEVELS.findIndex(l => l.id === g.def.id);
      const next = X.LEVELS[i + 1];
      const go = () => {
        if (next) this.startLevel(next.id, { intro: true, carry: this.carryOut });
        else { this.endGame(); this.mode = 'menu'; this.menu.stack = []; this.menu.show('end'); this.audio.music('sad'); }
      };
      if (g.def.comics && g.def.comics.outro) this.playComic(g.def.comics.outro, go);
      else go();
    }

    camera(dt) {
      const g = this.game, p = g.player;
      const eyeT = p.pos[1] + p.eye;
      if (this.eyeY === null || this.eyeY === undefined || Math.abs(eyeT - this.eyeY) > 1.5) this.eyeY = eyeT;
      else if (eyeT > this.eyeY) this.eyeY = Math.min(eyeT, this.eyeY + dt * 5);
      else this.eyeY = eyeT;
      let pos = [p.pos[0], this.eyeY, p.pos[2]];
      let yaw = p.yaw + p.kickYaw, pitch = p.pitch + p.kick, roll = 0;
      const sw = g.sway();
      yaw += sw[0]; pitch += sw[1];
      if (p.onGround && p.speed > 0.6 && !p.ladder && !p.rope) {
        this.bobT += dt * Math.min(p.speed, 5.5) * 1.75;
        const k = Math.min(1, p.speed / 5);
        pos[1] += Math.sin(this.bobT * 2) * 0.035 * k;
        roll += Math.sin(this.bobT) * 0.006 * k;
      }
      const lt = g.time - p.landT;
      if (lt < 0.35) pos[1] -= 0.09 * (1 - lt / 0.35) * Math.min(1, -p.fallV / 8);
      if (this.mode === 'dying' || !p.alive) {
        const t = Math.min(1, (this.deadT || 0) / 1.1);
        const e = t * t * (3 - 2 * t);
        pos[1] = X.lerp(this.eyeY, p.pos[1] + 0.35, e);
        roll = 1.1 * e;
        pitch = X.lerp(pitch, 0.2, e);
      }
      if (this.shake > 0.001) {
        const s = this.shake;
        yaw += (Math.random() - 0.5) * s * 0.3; pitch += (Math.random() - 0.5) * s * 0.3; roll += (Math.random() - 0.5) * s * 0.4;
        this.shake *= Math.exp(-dt * 9);
      }
      const wd = X.WEAPONS[p.weapon];
      let fov = this.opts.fov;
      this.zoomFov = null;
      if (p.zoom && wd && wd.zoom) { fov = this.opts.fov / wd.zoom[p.zoom - 1]; this.zoomFov = fov; }
      this.scoped = !!(p.zoom && wd && (p.weapon === 'sniper' || p.weapon === 'crossbow'));
      this.fx.camPos = pos;
      this.audio.listener = { pos, yaw: p.yaw };
      return { pos, yaw, pitch, roll, fov };
    }

    vmParts(dt, cam) {
      const g = this.game, p = g.player;
      if (!p.alive || this.scoped || p.body || p.rope || (this.mode === 'dying')) return null;
      const w = p.hostage ? 'fists' : p.weapon;
      const obj = w === 'object' ? p.object : null;
      const key = 'vm:' + w + ':' + (obj || '');
      let cpu = this.vmCache[key];
      if (!cpu) { cpu = X.Models.viewmodel(w, 0, [0.2, 0.25, 0.36], obj); this.vmCache[key] = cpu; }
      const t = this.time;
      const heavy = w === 'm60' || w === 'bazooka';
      const pistol = w === 'beretta' || w === 'silenced' || w === 'magnum';
      let bx = 0.15, by = -0.165, bz = -0.4;
      if (!pistol && w !== 'fists' && w !== 'knife' && w !== 'object' && w !== 'grenade') { bx = 0.14; by = -0.15; bz = -0.3; }
      if (heavy) { bx = 0.17; by = -0.2; bz = -0.34; }
      if (w === 'crossbow') { bx = 0.16; by = -0.17; bz = -0.26; }
      if (w === 'bazooka') { bx = 0.2; by = -0.13; bz = -0.2; }
      if (w === 'object') { bx = 0.22; by = -0.22; bz = -0.46; }
      if (w === 'fists' || p.hostage) { bx = 0.2; by = -0.26; bz = -0.5; }
      if (w === 'knife' || w === 'grenade') { bx = 0.18; by = -0.19; bz = -0.38; }
      let rx = 0, ry = 0, rz = 0;
      const mv = Math.min(1, p.speed / 5) * (p.onGround ? 1 : 0.2);
      bx += Math.cos(this.bobT) * 0.012 * mv;
      by += -Math.abs(Math.sin(this.bobT)) * 0.014 * mv;
      this.swayX = (this.swayX || 0) * Math.exp(-dt * 10);
      this.swayY = (this.swayY || 0) * Math.exp(-dt * 10);
      bx -= X.clamp(this.swayX, -0.05, 0.05); by += X.clamp(this.swayY, -0.05, 0.05);
      ry += X.clamp(this.swayX, -0.05, 0.05) * 2;
      const kick = p.kick * 1.6;
      bz += kick * 0.6; rx += kick * 1.4;
      if (p.switchT > 0) { const k = p.switchT / 0.4; by -= 0.3 * k; rx -= 0.6 * k; }
      if (p.reloadT > 0) {
        const wd = X.WEAPONS[w];
        const tot = wd && wd.reload ? wd.reload * (g.has('hands') ? 0.67 : 1) : 1;
        const k = Math.sin(Math.PI * X.clamp(1 - p.reloadT / tot, 0, 1));
        by -= 0.12 * k; rz += 0.5 * k; rx -= 0.3 * k;
      }
      const mt = this.time - (this.meleeT || -10);
      let rhOff = [0, 0, 0];
      if ((w === 'fists' || w === 'object') && mt < 0.35) {
        const k = Math.sin(Math.PI * mt / 0.35);
        if (w === 'fists') rhOff = [-0.08 * k, 0.05 * k, -0.28 * k];
        else { rz -= 1.3 * k; bx -= 0.15 * k; bz -= 0.1 * k; }
      }
      const tt = g.time - p.throwT;
      if ((w === 'knife' || w === 'grenade') && tt < 0.4) { const k = Math.sin(Math.PI * tt / 0.4); by += 0.12 * k; bz -= 0.2 * k; rx -= 0.8 * k; }
      if (p.hostage) { by -= 0.12; bx -= 0.05; }
      if (p.crouched) by += 0.01;
      const base = X.M4.trs(bx, by, bz, ry, rx, rz, 1);
      const parts = [];
      const build = () => cpu.mesh;
      parts.push({ key, build, m: base, range: cpu.parts.gun });
      parts.push({ key, build, m: rhOff[2] ? X.M4.mul(X.M4.trs(rhOff[0], rhOff[1], rhOff[2], 0, 0, 0, 1), base) : base, range: cpu.parts.rh });
      let lm = base;
      if (w === 'fists') lm = X.M4.trs(-bx + 0.02, by, bz, -ry, rx, -rz, 1);
      parts.push({ key, build, m: lm, range: cpu.parts.lh });
      const V = X.M4.view([0, 0, 0], cam.yaw, cam.pitch, cam.roll);
      return { parts, fov: 58, camInv: V };
    }

    render(dt) {
      const r = this.r, g = this.game;
      if (!r || !g) return;
      const cam = this.camera(dt);
      this.flash = Math.max(0, this.flash - dt * 2);
      const hurtK = Math.max(0, 1 - (this.time - this.hurtT) / 0.6) * (this.hurtAmt || 0.5);
      const low = g.player.alive && g.player.health < 25 ? 0.25 + 0.15 * Math.sin(this.time * 5) : 0;
      const memK = Math.max(0, 1 - (this.time - this.memT) / 3);
      const post = {
        hurt: [0.62, 0.04, 0.02, Math.max(hurtK * 0.8, low)],
        flash: Math.max(this.flash, memK > 0.8 ? (memK - 0.8) * 3 : 0),
        flashCol: [1, 0.97, 0.9],
        water: g.player.underwater ? 1 : 0,
        tint: memK > 0.05 ? 3 : 0,
        duoA: [0.2, 0.16, 0.12], duoB: [0.96, 0.92, 0.84]
      };
      if (this.mode === 'dying' || this.mode === 'dead') { post.sat = 0.35; post.hurt = [0.45, 0.02, 0.02, 0.5]; }
      if (g.def.post) Object.assign(post, g.def.post(g, this.time) || {});
      if (this.muzzleT && this.time - this.muzzleT < 0.05) {
        const f = X.fwd(cam.yaw, cam.pitch), rr = X.right(cam.yaw);
        const mp = [cam.pos[0] + f[0] * 0.7 + rr[0] * 0.13, cam.pos[1] + f[1] * 0.7 - 0.1, cam.pos[2] + f[2] * 0.7 + rr[2] * 0.13];
        this.fx.add('flash', mp, { size: 0.16 + Math.random() * 0.06, life: 0.04 });
        this.muzzleT = 0;
      }
      this.panels.render(r, g);
      r.renderMain({ cam, vm: this.vmParts(dt, cam), post, time: this.time, dt });
      this.panels.draw(r);
      this.hud.draw(g, this);
    }

    fillShots(el) {
      for (const d of el.querySelectorAll('[data-shot]')) {
        const src = this.shots[d.dataset.shot];
        if (src && src !== 'none') d.style.backgroundImage = `url(${src})`;
      }
    }

    destroy() {
      cancelAnimationFrame(this.raf);
      this.unlock();
      this.keyTarget.removeEventListener('keydown', this.onKeyDown);
      this.keyTarget.removeEventListener('keyup', this.onKeyUp);
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
      document.removeEventListener('pointerlockchange', this.onLock);
      window.removeEventListener('blur', this.onBlur);
      this.audio.destroy();
      if (this.r) this.r.destroy();
      if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    }
  }
  X.UI = UI;
  X.SHOTS_KEY = SHOTS_KEY;
})(globalThis.XIII = globalThis.XIII || {});
