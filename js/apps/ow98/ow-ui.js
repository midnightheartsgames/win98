(function (O) {
  'use strict';
  const RES = { '240': 240, '360': 360, '480': 480, '600': 600, '768': 768, native: 0 };

  class UI {
    constructor(root, opts = {}) {
      this.root = root;
      this.opts0 = opts;
      this.profile = O.Profile.load();
      this.opts = this.profile.opts;
      this.keys = {};
      this.mouse = { b0: false, b2: false };
      this.clock = 0;
      this.acc = 0;
      this.last = 0;
      this.fps = 60; this.fpsN = 0; this.fpsT = 0;
      this.yaw = 0; this.pitch = 0;
      this.slotReq = 0;
      this.game = null;
      this.mode = 'menu';
      this.overlay = null;
      this.portraits = new Map();
      this.hud = { hits: [], hurt: [], notices: [], chat: [], announce: null, killer: null, hurtT: -9, ultLine: null };
      this.audio = new O.Audio98();
      this.audio.setVol({ master: this.opts.vol, music: this.opts.music });
      this.audio.voiceOn = this.opts.voice !== false;
      this.build();
      this.bind();
      try {
        this.renderer = new O.Renderer(this.glc, { filter: this.opts.filter, shadows: this.opts.shadows !== false, preserve: !!opts.preserve, post: this.opts.post !== false });
        this.renderer.onThunder = () => this.later(0.5 + Math.random() * 1.2, () => this.audio.play('thunder', { vol: 0.5, gap: 1 }));
      } catch (e) { this.renderer = null; this.glError = String(e && e.message || e); }
      this.resize();
      this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null;
      if (this.ro) this.ro.observe(this.root);
      O.Screens.show(this, this.glError ? 'error' : (opts.start || 'boot'));
      this.frameBound = ts => this.frame(ts);
      this.raf = requestAnimationFrame(this.frameBound);
    }

    build() {
      const r = this.root;
      r.innerHTML = '';
      const el = document.createElement('div');
      el.className = 'ow98';
      el.tabIndex = 0;
      el.innerHTML = '<canvas class="ow-gl"></canvas><canvas class="ow-hud"></canvas><div class="ow-layer"></div><div class="ow-over"></div>';
      r.appendChild(el);
      this.el = el;
      this.glc = el.querySelector('.ow-gl');
      this.hudc = el.querySelector('.ow-hud');
      this.hctx = this.hudc.getContext('2d');
      this.layer = el.querySelector('.ow-layer');
      this.over = el.querySelector('.ow-over');
    }

    active() { return this.opts0.isActive ? this.opts0.isActive() : true; }

    destroy() {
      this.dead = true;
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      window.removeEventListener('keydown', this.onKey, true);
      window.removeEventListener('keyup', this.onKeyUp, true);
      document.removeEventListener('mousemove', this.onMove);
      document.removeEventListener('pointerlockchange', this.onLock);
      window.removeEventListener('mouseup', this.onUp);
      if (document.pointerLockElement === this.glc) document.exitPointerLock();
      this.audio.close();
      if (this.renderer) this.renderer.destroy();
      if (this.stageR) this.stageR.destroy();
      this.root.innerHTML = '';
    }

    resize() {
      const w = Math.max(320, this.root.clientWidth | 0), h = Math.max(240, this.root.clientHeight | 0);
      this.W = w; this.H = h;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.hudc.width = Math.round(w * dpr); this.hudc.height = Math.round(h * dpr);
      this.hdpr = dpr;
      this.applyRes();
    }

    applyRes() {
      if (!this.renderer) return;
      const want = RES[this.opts.res] === undefined ? 480 : RES[this.opts.res];
      const h = want ? Math.min(this.H, want) : this.H;
      const w = Math.round(h * this.W / this.H);
      this.renderer.resize(w, h);
      this.glc.style.imageRendering = want && want < 500 ? 'pixelated' : 'auto';
    }

    saveOpts() {
      this.profile.opts = this.opts;
      O.Profile.save(this.profile);
      this.audio.setVol({ master: this.opts.vol, music: this.opts.music });
      this.audio.voiceOn = this.opts.voice !== false;
      if (this.renderer) this.renderer.setPost(this.opts.post !== false);
      if (this.renderer && this.renderer.filter !== this.opts.filter) { this.renderer.filter = this.opts.filter; this.renderer.texCache.clear(); if (this.renderer.world) this.renderer.setMap(this.renderer.world.map); }
      this.applyRes();
    }

    bind() {
      this.onKey = e => {
        if (!this.active() || this.dead) return;
        this.audio.init(); this.audio.resume();
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') && e.code !== 'Escape') return;
        const inMatch = this.mode === 'match' && this.game;
        if (inMatch || this.mode === 'potg' || this.mode === 'killcam') { if (/^(Key|Digit|Space|Tab|Arrow|Shift|Control|Escape|F\d)/.test(e.code)) e.preventDefault(); }
        if (e.repeat) return;
        if (e.code === 'F7') { e.preventDefault(); this.debugBoxes(); return; }
        if (O.Screens.key(this, e)) { e.preventDefault(); return; }
        this.keys[e.code] = true;
        if (e.code === 'Tab') this.keys.tab = true;
        if (!inMatch) return;
        if (e.code === 'Escape') { this.pause(); return; }
        if (e.code === 'KeyH') { this.heroSelect(); return; }
        if (e.code === 'Digit1') this.slotReq = 1;
        if (e.code === 'Digit2') this.slotReq = 2;
        if (e.code === 'KeyX') this.callout('Нужно лечение!');
        if (e.code === 'KeyZ') this.callout('Группируемся!');
        if (e.code === 'KeyT') this.spray();
        if (e.code === 'KeyB') this.emote();
        if (e.code === 'KeyC' && this.game.player) this.callout(this.game.ultReady(this.game.player) ? 'Суперспособность готова!' : 'Суперспособность: ' + Math.floor(this.game.player.ult / this.game.player.def.ultCost * 100) + '%');
      };
      this.onKeyUp = e => {
        this.keys[e.code] = false;
        if (e.code === 'Tab') this.keys.tab = false;
      };
      window.addEventListener('keydown', this.onKey, true);
      window.addEventListener('keyup', this.onKeyUp, true);
      this.el.addEventListener('mousedown', e => {
        this.audio.init(); this.audio.resume();
        this.el.focus({ preventScroll: true });
        if (this.mode === 'match' && !this.overlay && (e.target === this.hudc || document.pointerLockElement === this.glc)) {
          if (document.pointerLockElement !== this.glc && this.glc.requestPointerLock) { try { const pr = this.glc.requestPointerLock(); if (pr && pr.catch) pr.catch(() => { }); } catch (err) { } }
          if (e.button === 0) this.mouse.b0 = true;
          if (e.button === 2) this.mouse.b2 = true;
          e.preventDefault();
        }
      });
      this.onUp = e => { if (e.button === 0) this.mouse.b0 = false; if (e.button === 2) this.mouse.b2 = false; };
      window.addEventListener('mouseup', this.onUp);
      this.el.addEventListener('contextmenu', e => e.preventDefault());
      this.el.addEventListener('wheel', e => {
        if (this.mode !== 'match' || this.overlay) return;
        e.preventDefault();
        const p = this.game && this.game.player;
        if (p && (p.heroId === 'mercy' || p.heroId === 'torbjorn')) this.slotReq = p.weapon === 0 ? 2 : 1;
      }, { passive: false });
      this.onMove = e => {
        if (this.mode !== 'match' || this.overlay || document.pointerLockElement !== this.glc) return;
        this.look(e.movementX, e.movementY);
      };
      document.addEventListener('mousemove', this.onMove);
      this.onLock = () => {
        if (document.pointerLockElement !== this.glc && this.mode === 'match' && !this.overlay && this.game && this.game.phase !== 'end' && !this.noPauseOnUnlock) this.pause();
        this.noPauseOnUnlock = false;
      };
      document.addEventListener('pointerlockchange', this.onLock);
    }

    look(dx, dy) {
      const p = this.game && this.game.player;
      const zoom = p && p.heroId === 'widowmaker' && p.vis.scope >= 0 ? 0.4 : 1;
      const s = 0.00055 * (this.opts.sens || 5) * zoom;
      this.yaw -= dx * s;
      this.pitch -= dy * s * (this.opts.invert ? -1 : 1);
      this.pitch = O.clamp(this.pitch, -1.48, 1.48);
    }

    releaseMouse() { this.noPauseOnUnlock = true; if (document.pointerLockElement === this.glc) document.exitPointerLock(); this.mouse.b0 = this.mouse.b2 = false; }

    input() {
      const k = this.keys;
      const inp = O.blankInput();
      if (this.overlay || this.mode !== 'match') { inp.yaw = this.yaw; inp.pitch = this.pitch; return inp; }
      inp.fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
      inp.side = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
      if (k.ArrowLeft) this.yaw += 0.04;
      if (k.ArrowRight) this.yaw -= 0.04;
      inp.jump = !!k.Space;
      inp.crouch = !!(k.ControlLeft || k.ControlRight);
      inp.fire = this.mouse.b0 || !!k.Enter;
      inp.fire2 = this.mouse.b2;
      inp.shift = !!(k.ShiftLeft || k.ShiftRight);
      inp.e = !!k.KeyE;
      inp.q = !!k.KeyQ;
      inp.reload = !!k.KeyR;
      inp.melee = !!(k.KeyV || k.KeyF);
      inp.slot = this.slotReq; this.slotReq = 0;
      inp.yaw = this.yaw; inp.pitch = this.pitch;
      return inp;
    }

    portrait(heroId, skin) {
      if (!heroId || !this.renderer) return null;
      const key = heroId + ':' + (skin || 'classic');
      let c = this.portraits.get(key);
      if (!c) { c = this.renderer.portrait(heroId, skin || 'classic', 128); this.portraits.set(key, c); }
      return c;
    }
    stageCanvas() {
      if (this.stageR === undefined) {
        this.stageC = document.createElement('canvas');
        this.stageC.className = 'ow-stage';
        try { this.stageR = new O.Renderer(this.stageC, { alpha: true, filter: this.opts.filter }); } catch (e) { this.stageR = null; }
      }
      return this.stageR ? this.stageC : null;
    }
    debugBoxes() {
      this.profile.boxes += 5;
      O.Profile.save(this.profile);
      this.audio.init();
      this.audio.play('armorUp', { vol: 0.5 });
      if (this.mode === 'match' && this.game) { this.notice('ОТЛАДКА: +5 КОНТЕЙНЕРОВ', '#ffc43a'); return; }
      O.Screens.toast(this, '+5 КОНТЕЙНЕРОВ', 'Отладка (F7). Всего: ' + this.profile.boxes);
      O.Screens.onBoxes(this);
    }
    bigPortrait(heroId, skin, pose, size) {
      if (!this.renderer) return null;
      const key = 'full:' + heroId + ':' + (skin || 'classic') + ':' + (pose || '') + ':' + (size || 512);
      let c = this.portraits.get(key);
      if (!c) { c = this.renderer.portrait(heroId, skin || 'classic', size || 512, { full: true, pose, yaw: 0.25 }); this.portraits.set(key, c); }
      return c;
    }

    viewHero() {
      if (this.mode === 'potg' || this.mode === 'killcam') return this.replayCross || null;
      return this.game ? this.game.player : null;
    }
    heroTop(h) { return (h.crouch ? h.h * 0.72 : h.h) + (h.heroId === 'zenyatta' ? 0.35 : 0); }
    visible(h) {
      const p = this.game.player;
      if (!p) return false;
      const e = this.game.eye(p);
      return this.game.world.clear(e.x, e.y, e.z, h.pos.x, h.pos.y + h.h * 0.7, h.pos.z);
    }

    matchTeams(cfg) {
      const r = O.rng((cfg.seed || Date.now()) ^ 0x5bd1);
      const used = new Set([this.profile.name]);
      const party = (cfg.party || []).slice(0, 5);
      const pickName = () => { for (let i = 0; i < 400; i++) { const n = O.pick(r, O.BOT_NAMES) + (r() < 0.25 ? String(10 + (r() * 89 | 0)) : ''); if (!used.has(n)) { used.add(n); return n; } } return 'Bot' + (r() * 999 | 0); };
      const skill = (team) => {
        if (cfg.kind === 'ai') return team === 0 ? 0.9 : [0.2, 0.75, 1.35][cfg.diff === undefined ? 1 : cfg.diff];
        if (cfg.kind === 'custom') return team === 0 ? (cfg.allySkill === undefined ? 1 : cfg.allySkill) : (cfg.enemySkill === undefined ? 1 : cfg.enemySkill);
        if (cfg.kind === 'comp') return 0.8 + r() * 0.8;
        return 0.55 + r() * 0.8;
      };
      const t0 = [{ name: this.profile.name, human: true, skins: O.Profile.skinsMap(this.profile), hero: null }];
      for (const f of party) { used.add(f.name); t0.push({ name: f.name, skill: 1.1, hero: f.hero }); }
      while (t0.length < (cfg.size || 6)) t0.push({ name: pickName(), skill: skill(0) });
      const t1 = [];
      while (t1.length < (cfg.size || 6)) t1.push({ name: pickName(), skill: skill(1) });
      return [t0, t1];
    }

    startMatch(cfg) {
      this.audio.init();
      this.audio.stopMusic();
      this.lastCfg = cfg;
      const map = cfg.map || O.pick(Math.random, O.MAP_LIST.filter(m => O.MAPS[m.id])).id;
      const def = O.MAPS[map];
      const stage = def.stages ? (cfg.stage === undefined ? Math.floor(Math.random() * def.stages.length) : cfg.stage) : 0;
      const attack = cfg.attack === undefined || cfg.attack === 'random' ? (Math.random() < 0.5 ? 0 : 1) : cfg.attack;
      const seed = (Math.random() * 1e9) | 0;
      this.match = { cfg, map, stage, attack, seed };
      O.Screens.show(this, 'loading', { map, stage, mode: cfg.mode || def.mode, attack, kind: cfg.kind });
      this.mode = 'loading';
      setTimeout(() => { if (!this.dead) this.createGame(); }, 60);
    }

    createGame() {
      const m = this.match, cfg = m.cfg;
      const teams = cfg.teams || this.matchTeams(Object.assign({ seed: m.seed }, cfg));
      const g = new O.Game({
        map: m.map, stage: m.stage, attack: m.attack, seed: m.seed, teams, visual: true, mode: cfg.mode,
        assemble: cfg.assemble === undefined ? 20 : cfg.assemble, setup: cfg.setup === undefined ? 25 : cfg.setup,
        rules: cfg.rules, time: cfg.time, lock: cfg.lock
      });
      this.game = g;
      this.worldVer = g.worldVer;
      if (this.renderer) this.renderer.setMap(g.map);
      this.hud = { hits: [], hurt: [], notices: [], chat: [], announce: null, killer: null, hurtT: -9, ultLine: null };
      const p = g.player;
      if (p) { const sp = g.spawnFor(p.team); this.yaw = sp ? sp.pts[0].yaw : 0; this.pitch = 0; }
      this.sysChat('Добро пожаловать на сервер Battle.net: Европа.');
      this.sysChat('Вы присоединились к голосовому чату команды. Нажмите X — «Нужно лечение», Z — «Группируемся».');
      this.mode = 'match';
      this.endSeq = null;
      O.Screens.show(this, 'hud');
      if (cfg.hero && p) g.requestHero(p, cfg.hero);
      if (!cfg.hero) this.heroSelect(true);
      else this.lockMouseSoon();
      for (const h of g.heroes) if (h.bot && !h.drill && O.AI && g.rand() < 0.35) { const line = O.pick(g.rand, O.CHAT.start); this.later(2 + g.rand() * 6, () => g.say(h, line)); }
    }

    later(sec, fn) { (this.timers || (this.timers = [])).push({ t: this.clock + sec, fn }); }

    lockMouseSoon() {
      if (this.opts0.noLock) return;
      try { if (document.pointerLockElement !== this.glc && this.glc.requestPointerLock) { const pr = this.glc.requestPointerLock(); if (pr && pr.catch) pr.catch(() => { }); } } catch (e) { }
    }

    heroSelect(initial) {
      const g = this.game;
      if (!g || !g.player) return;
      const p = g.player;
      if (!initial && !(g.phase === 'assemble' || g.phase === 'setup' || !p.alive || p.inSpawn || g.rules.practice)) { this.notice('ВЫ МОЖЕТЕ СМЕНИТЬ ГЕРОЯ ТОЛЬКО НА БАЗЕ', '#ff6060'); return; }
      this.releaseMouse();
      this.overlay = 'heroes';
      O.Screens.heroSelect(this, initial);
    }

    closeOverlay() {
      this.overlay = null;
      this.over.innerHTML = '';
      this.over.className = 'ow-over';
      if (this.mode === 'match') this.lockMouseSoon();
    }

    pause() {
      if (this.overlay) { if (this.overlay === 'pause' || this.overlay === 'heroes') { if (this.overlay === 'heroes' && (!this.game.player.heroId)) return; this.closeOverlay(); } return; }
      this.releaseMouse();
      this.overlay = 'pause';
      O.Screens.pause(this);
    }

    leaveMatch() {
      this.closeOverlay();
      this.releaseMouse();
      this.game = null;
      this.mode = 'menu';
      O.Screens.show(this, 'main');
    }

    notice(text, col, o = {}) { this.hud.notices.push(Object.assign({ text, col, t: this.clock }, o)); if (this.hud.notices.length > 8) this.hud.notices.shift(); }
    sysChat(text) { this.hud.chat.push({ t: this.clock, text, from: -1 }); }

    callout(text) {
      const g = this.game, p = g && g.player;
      if (!p || !p.alive || (this.calloutT && this.clock - this.calloutT < 2)) return;
      this.calloutT = this.clock;
      g.say(p, text);
      if (text === 'Нужно лечение!') p.aux.callT = g.t;
      this.audio.say(text, { rate: 1.1 });
    }

    spray() {
      const g = this.game, p = g && g.player;
      if (!p || !p.alive || (this.sprayT && this.clock - this.sprayT < 3)) return;
      const e = g.eye(p), d = g.aim(p);
      const r = g.world.raycast(e.x, e.y, e.z, d.x, d.y, d.z, 5);
      if (!r) return;
      this.sprayT = this.clock;
      const key = O.Profile.equipped(this.profile, p.heroId, 'spray');
      const art = O.sprayArt(p.heroId, key, 64, this.portrait(p.heroId, 'classic'));
      if (this.renderer && art) this.renderer.addSpray({ x: e.x + d.x * (r.t - 0.03), y: e.y + d.y * (r.t - 0.03), z: e.z + d.z * (r.t - 0.03), nx: r.nx, ny: r.ny, nz: r.nz, art });
      this.audio.play('breather', { vol: 0.3, pitch: 2 });
    }

    emote() {
      const g = this.game, p = g && g.player;
      if (!p || !p.alive || !p.onGround) return;
      const key = 'emote:' + (O.Profile.equipped(this.profile, p.heroId, 'emote') || 'heroic');
      const c = O.Clips.get(p.heroId, key);
      if (!c) return;
      this.emoteT = this.clock;
      this.emoteLen = c.loop ? Infinity : c.len;
      p.vis.pose = key; p.vis.poseT = g.t;
      this.emoteHero = p;
    }

    frame(ts) {
      if (this.dead) return;
      this.raf = requestAnimationFrame(this.frameBound);
      if (!this.active() && this.mode !== 'menu') { this.last = ts; }
      const dt = Math.min(0.1, Math.max(0, (ts - (this.last || ts)) / 1000));
      this.last = ts;
      this.tick(dt);
    }

    tick(dt) {
      this.clock += dt;
      this.fpsN++; this.fpsT += dt;
      if (this.fpsT > 0.5) { this.fps = this.fpsN / this.fpsT; this.fpsN = 0; this.fpsT = 0; }
      if (this.timers && this.timers.length) {
        const now = this.timers.filter(x => x.t <= this.clock);
        if (now.length) { this.timers = this.timers.filter(x => x.t > this.clock); for (const x of now) x.fn(); }
      }
      const g = this.game;
      if (this.mode === 'match' && g) {
        this.acc += dt;
        let steps = 0;
        while (this.acc >= O.TICK && steps < 8) {
          const inp = this.input();
          if (this.emoteHero && (inp.fwd || inp.side || inp.fire || inp.fire2 || inp.jump || !this.emoteHero.alive || this.clock - this.emoteT > (this.emoteLen || 6))) { this.emoteHero.vis.pose = null; this.emoteHero = null; }
          g.step(inp);
          this.process(g);
          this.acc -= O.TICK;
          steps++;
          if (g.worldVer !== this.worldVer) { this.worldVer = g.worldVer; if (this.renderer) this.renderer.setMap(g.map); }
        }
        if (steps >= 8) this.acc = 0;
        if (g.phase === 'end') this.endTick(dt);
        this.renderMatch(dt);
      } else if ((this.mode === 'potg' || this.mode === 'killcam') && this.replay) {
        this.replayTick(dt);
      } else if (this.mode === 'menu' || this.mode === 'post') {
        this.renderMenu(dt);
      }
      O.Screens.tick(this, dt);
      const ctx = this.hctx;
      ctx.setTransform(this.hdpr, 0, 0, this.hdpr, 0, 0);
      if (this.mode === 'match' || this.mode === 'potg' || this.mode === 'killcam') O.Hud.draw(this, ctx, this.W, this.H);
      else ctx.clearRect(0, 0, this.W, this.H);
    }

    process(g) {
      const p = g.player;
      const A = this.audio;
      const R = this.renderer;
      if (p) {
        const e = g.eye(p);
        A.listener = { x: e.x, y: e.y, z: e.z, yaw: p.alive ? p.yaw : this.yaw };
      }
      for (const f of g.fx) if (R) R.parts.event(f, g, p);
      g.fx.length = 0;
      for (const ev of g.events) {
        switch (ev.type) {
          case 'snd': {
            const own = p && ev.h === p.id;
            if (own) A.play(ev.id, { vol: 0.8, big: ev.big, fan: ev.fan, alt: ev.alt, song: ev.song, n: ev.n, good: ev.good, gap: 0.03 });
            else A.at(ev.id, ev, { vol: ev.soft ? 0.5 : 1, big: ev.big, fan: ev.fan, alt: ev.alt, song: ev.song, n: ev.n, good: ev.good, range: ev.big ? 90 : 50, key: ':' + (ev.h === undefined ? '' : ev.h), gap: 0.04 });
            break;
          }
          case 'hit':
            if (p && ev.src === p.id && ev.dmg > 0.5) {
              if (!ev.barrier && ev.dst >= 0) { this.hud.hits.push({ t: this.clock, crit: ev.crit }); A.play(ev.crit ? 'headshot' : 'hit', { vol: 0.5, gap: 0.05 }); this.aimTarget = ev.dst; }
              if (this.hud.hits.length > 10) this.hud.hits.shift();
            }
            if (p && ev.dst === p.id && ev.dmg > 0) { this.hud.hurtT = this.clock; if (ev.dmg > 4) A.play('hurt', { vol: 0.6, gap: 0.15 }); }
            break;
          case 'hurtdir':
            if (p && ev.dst === p.id) { this.hud.hurt.push({ t: this.clock, x: ev.x, z: ev.z }); if (this.hud.hurt.length > 6) this.hud.hurt.shift(); }
            break;
          case 'kill': {
            const v = g.heroes[ev.victim], k = ev.killer >= 0 ? g.heroes[ev.killer] : null;
            if (p && k === p) { this.notice('УБИТ ' + v.name.toUpperCase(), '#fff', { icon: 'skull', big: true, parts: [['УБИТ', '#ffffff'], [v.name.toUpperCase(), '#ff4b4b']] }); this.hud.hits.push({ t: this.clock, kill: true }); A.play('kill', { vol: 0.6 }); }
            else if (p && ev.assists.includes(p.id)) this.notice('ПОМОЩЬ ' + v.name.toUpperCase(), '#bde', { parts: [['ПОМОЩЬ', '#bde6ff'], [v.name.toUpperCase(), '#ff8a7a']] });
            if (p && v === p) { this.hud.killer = k ? { id: k.id, name: k.name, hero: k.heroId } : null; this.deathT = this.clock; this.queueKillcam(ev); }
            if (v.bot && g.rand() < 0.08) this.later(1 + g.rand() * 2, () => g.say(v, O.pick(g.rand, O.CHAT.death)));
            if (k && k.bot && g.rand() < 0.05) this.later(0.5 + g.rand(), () => g.say(k, O.pick(g.rand, O.CHAT.kill), true));
            break;
          }
          case 'multikill':
            if (p && ev.h === p.id) this.notice(['', '', 'ДВОЙНОЕ УБИЙСТВО', 'ТРОЙНОЕ УБИЙСТВО', 'ЧЕТВЕРНОЕ УБИЙСТВО', 'ПЯТЕРНОЕ УБИЙСТВО', 'КОМАНДА УНИЧТОЖЕНА'][Math.min(6, ev.n)], '#ffc43a', { big: true });
            break;
          case 'announce': {
            const key = p ? ev.keys[p.team] : ev.keys[0];
            if (key) { const text = O.ANNOUNCE[key] || key; this.hud.announce = { t: this.clock, text, col: /Theirs|losing|defeat|Lost/.test(key) ? '#ff7a6a' : '#fff' }; A.say(text, { male: true, rate: 1.0 }); if (key === 'capOurs' || key === 'ctrlOurs' || key === 'cpOurs') A.play('capture', { vol: 0.5 }); if (key === 'losing' || key === 'capTheirs') A.play('alarm', { vol: 0.4 }); }
            break;
          }
          case 'ult': {
            const h = g.heroes[ev.h];
            if (!h || !h.def) break;
            const ally = p && h.team === p.team;
            const line = ally ? h.def.ultLine : h.def.ultLineEnemy;
            this.hud.ultLine = { t: this.clock, text: h.def.name + ': «' + line + '»', col: ally ? '#7fd4ff' : '#ff8a7a' };
            A.say(line, { priority: !ally || h === p, male: !['tracer', 'widowmaker', 'mercy'].includes(h.heroId), rate: 1.1, pitch: h.heroId === 'winston' ? 0.6 : h.heroId === 'roadhog' ? 0.5 : 1 });
            break;
          }
          case 'ultready':
            if (p && ev.h === p.id) { A.play('ultready', { vol: 0.6 }); this.notice('СУПЕРСПОСОБНОСТЬ ГОТОВА', '#ffc43a', {}); }
            break;
          case 'chat':
            this.hud.chat.push({ t: this.clock, text: ev.text, from: ev.from });
            if (this.hud.chat.length > 30) this.hud.chat.shift();
            break;
          case 'spawn':
            if (p && ev.h === p.id) { this.yaw = p.yaw; this.pitch = 0; this.hud.killer = null; if (this.mode === 'killcam') this.endReplay(); }
            break;
          case 'stunned':
            if (p && ev.h === p.id) this.notice('ОГЛУШЕНИЕ', '#ff7070', {});
            break;
          case 'hooked':
            if (p && ev.dst === p.id) A.play('hookHit', { vol: 0.7 });
            break;
          case 'newround':
            this.notice('РАУНД ' + (ev.round + 1), '#fff', { big: true });
            this.later(0.3, () => this.heroSelect(true));
            break;
          case 'round': {
            const won = p && ev.winner === p.team;
            this.notice(won ? 'РАУНД ВЫИГРАН' : 'РАУНД ПРОИГРАН', won ? '#7fd4ff' : '#ff7a6a', { big: true });
            break;
          }
          case 'end':
            this.startEnd();
            break;
          case 'hero':
            if (p && ev.h === p.id) this.aimTarget = null;
            break;
        }
      }
      g.events.length = 0;
      if (R) R.parts.update(O.TICK);
    }

    queueKillcam(ev) {
      if (this.opts.killcam === false || !this.game.replay || ev.killer < 0 || ev.env) return;
      this.later(1.6, () => {
        if (!this.game || this.mode !== 'match' || this.overlay || this.game.player.alive || this.game.phase === 'end') return;
        const clip = this.game.replay.killcam(ev.victim, ev.killer, 5);
        if (clip.frames.length < 20) return;
        this.startReplay(clip, 'killcam', { name: this.game.heroes[ev.killer].name, duration: Math.min(4.5, this.game.player.respawnT - 1) });
      });
    }

    startReplay(clip, kind, o = {}) {
      const ic = kind === 'potg' && o.pose ? O.Clips.get(clip.heroId, o.pose) : null;
      const intro = kind === 'potg' ? O.clamp(ic ? ic.len + 0.4 : 2.2, 2.2, 3.4) : 0;
      this.replay = { clip, t: 0, kind, o, intro, dur: intro + Math.min(o.duration || 99, clip.frames[clip.frames.length - 1].t - clip.frames[0].t), sndIdx: 0 };
      this.replayView = { t: 0, name: o.name, heroName: o.heroName };
      this.mode = kind;
      if (this.renderer) this.renderer.parts.clear();
    }

    endReplay() {
      const r = this.replay;
      this.replay = null;
      this.replayCross = null;
      if (!r) return;
      if (r.kind === 'killcam') { this.mode = 'match'; if (this.renderer) this.renderer.parts.clear(); }
      else if (r.o.after) r.o.after();
    }

    replayTick(dt) {
      const r = this.replay;
      r.t += dt;
      this.replayView.t = r.t;
      if (this.mode === 'killcam') {
        const g = this.game;
        if (g) { this.acc += dt; while (this.acc >= O.TICK) { g.step(this.input()); this.processQuiet(g); this.acc -= O.TICK; } }
        if (this.keys.Space || (g && g.player && g.player.alive)) { this.keys.Space = false; this.endReplay(); return; }
      }
      if (r.t >= r.dur) { this.endReplay(); return; }
      const intro = r.intro || 0;
      const sc = O.replayScene(r.clip, Math.max(0, r.t - intro));
      if (!sc) { this.endReplay(); return; }
      const R = this.renderer;
      const hero = sc.heroes.find(h => h.id === r.clip.hid);
      const frames = r.clip.frames;
      while (r.sndIdx < frames.length && frames[r.sndIdx].t <= sc.t) {
        const f = frames[r.sndIdx];
        for (const e of f.fx) if (R) R.parts.event(e, null, hero);
        for (const s of f.snd) this.audio.at(s.id, s, { vol: 0.8, big: s.big, fan: s.fan, alt: s.alt, song: s.song, n: s.n, good: s.good, range: 60 });
        r.sndIdx++;
      }
      if (R) R.parts.update(dt);
      if (!hero || !R) return;
      this.replayCross = hero;
      this.audio.listener = { x: hero.pos.x, y: hero.pos.y + hero.eyeH, z: hero.pos.z, yaw: hero.yaw };
      let cam;
      if (r.t < intro) {
        const a = hero.yaw + 0.75 - r.t * 0.32, d = 2.2 + hero.h * 0.75;
        cam = { x: hero.pos.x + Math.sin(a) * d, y: hero.pos.y + hero.h * 0.72, z: hero.pos.z + Math.cos(a) * d, yaw: a + Math.PI, pitch: -0.1 };
        this.replayCross = null;
        const ihero = Object.assign({}, hero, { still: true, vis: Object.assign({}, hero.vis, { pose: r.o.pose || 'pose:heroic', poseT: sc.t - r.t, act: null }) });
        R.render({ t: this.clock, gt: sc.t, cam, heroes: sc.heroes.map(h => h.id === hero.id ? ihero : h), proj: [], deploy: sc.deploy, barriers: [], pickups: sc.pickups, payload: sc.payload, points: [], viewer: null, fp: false });
        return;
      }
      if (hero.alive) cam = { x: hero.pos.x, y: hero.pos.y + (hero.crouch ? hero.eyeH * 0.72 : hero.eyeH), z: hero.pos.z, yaw: hero.yaw, pitch: hero.pitch, fovH: this.fovH() };
      else cam = { x: hero.pos.x - Math.sin(hero.yaw) * 3, y: hero.pos.y + 2.5, z: hero.pos.z - Math.cos(hero.yaw) * 3, yaw: hero.yaw, pitch: -0.4 };
      R.render({ t: this.clock, gt: sc.t, cam, heroes: sc.heroes, proj: sc.proj, deploy: sc.deploy, barriers: sc.barriers, pickups: sc.pickups, payload: sc.payload, points: [], viewer: hero, fp: hero.alive });
    }

    processQuiet(g) {
      for (const ev of g.events) {
        if (ev.type === 'kill' || ev.type === 'chat') this.processOne(g, ev);
        if (ev.type === 'end') this.startEnd();
      }
      g.events.length = 0; g.fx.length = 0;
    }
    processOne(g, ev) { if (ev.type === 'chat') this.hud.chat.push({ t: this.clock, text: ev.text, from: ev.from }); }

    fovH() { return (this.opts.fov || 90) * Math.PI / 180 * 1.0; }

    matchScene(g) {
      const p = g.player;
      const pts = [];
      const team = p ? p.team : 0;
      const tgt = O.MODES[g.mode].target(g);
      if (tgt && !tgt.payload && g.mode !== 'practice') {
        let col = [1, 1, 1], prog = 0, progCol = [0.4, 0.75, 1];
        if (g.mode === 'control') {
          col = g.obj.owner === -1 ? [0.95, 0.95, 0.95] : g.obj.owner === team ? [0.3, 0.7, 1] : [1, 0.35, 0.3];
          prog = g.obj.cap; progCol = g.obj.capTeam === team ? [0.3, 0.7, 1] : [1, 0.35, 0.3];
        } else {
          const att = g.roleOf(team) === 'att';
          col = att ? [1, 0.4, 0.35] : [0.35, 0.7, 1];
          prog = g.obj.prog; progCol = [1, 1, 1];
        }
        pts.push({ x: tgt.x, y: tgt.y, z: tgt.z, r: tgt.r, col, prog, progCol });
      }
      return {
        t: this.clock, gt: g.t, heroes: g.heroes, proj: g.proj, deploy: g.deploy, barriers: g.barriers, pickups: g.pickups,
        payload: g.obj && g.obj.pos && (g.mode === 'escort' || g.mode === 'hybrid') ? g.obj.pos : null, points: pts, infra: g.infra
      };
    }

    renderMatch(dt) {
      const g = this.game, R = this.renderer;
      if (!R) return;
      const p = g.player;
      const sc = this.matchScene(g);
      let cam, fp = false;
      if (p && p.alive && p.heroId) {
        const tire = p.ultOn === 'tire' ? g.deploy.find(d => d.id === p.k.tire) : null;
        if (tire) cam = { x: tire.pos.x - Math.sin(this.yaw) * 3.5, y: tire.pos.y + 1.8, z: tire.pos.z - Math.cos(this.yaw) * 3.5, yaw: this.yaw, pitch: -0.25, fovH: this.fovH() };
        else if (this.emoteHero === p) {
          const a = this.yaw + 0.9 + (this.clock - this.emoteT) * 0.25, d = 2.2 + p.h * 0.75;
          cam = { x: p.pos.x + Math.sin(a) * d, y: p.pos.y + p.h * 0.72, z: p.pos.z + Math.cos(a) * d, yaw: a + Math.PI, pitch: -0.12, fovH: this.fovH() };
        } else {
          const e = g.eye(p);
          const zoom = p.heroId === 'widowmaker' && p.vis.scope >= 0 ? 0.42 : 1;
          const shake = this.shake || 0;
          cam = { x: e.x, y: e.y, z: e.z, yaw: this.yaw + (Math.random() - 0.5) * shake, pitch: this.pitch + (Math.random() - 0.5) * shake, fovH: this.fovH() * zoom };
          fp = true;
        }
      } else if (p && p.deathPos) {
        const k = this.hud.killer ? g.heroes[this.hud.killer.id] : null;
        const dp = p.deathPos;
        let yaw = this.yaw;
        if (k && k.alive) yaw = Math.atan2(k.pos.x - dp.x, k.pos.z - dp.z);
        cam = { x: dp.x - Math.sin(yaw) * 4, y: dp.y + 3.2, z: dp.z - Math.cos(yaw) * 4, yaw, pitch: -0.3, fovH: this.fovH() };
      } else {
        const sp = p ? g.spawnFor(p.team) : g.map.spawns[0];
        const pt = sp ? sp.pts[0] : { x: 0, y: 0, z: 0, yaw: 0 };
        cam = { x: pt.x, y: pt.y + 1.7, z: pt.z, yaw: this.yaw, pitch: this.pitch, fovH: this.fovH() };
      }
      this.shake = Math.max(0, (this.shake || 0) - dt * 0.2);
      R.ambient(sc, dt);
      R.render(Object.assign(sc, { cam, viewer: p, fp, noVm: p && p.heroId === 'widowmaker' && p.vis.scope > -1 }));
    }

    renderMenu(dt) {
      const R = this.renderer;
      if (!R || !R.world || !this.menuCam) return;
      const c = this.menuCam;
      const t = this.clock * 0.05;
      R.ambient({ cam: c }, dt);
      R.parts.update(dt);
      R.render({ t: this.clock, gt: this.clock, cam: { x: c.x + Math.sin(t) * 1.5, y: c.y, z: c.z + Math.cos(t) * 1.5, yaw: c.yaw + Math.sin(t * 0.7) * 0.08, pitch: c.pitch, fovH: 1.4 }, heroes: [], proj: [], deploy: [], barriers: [], pickups: [], payload: null, points: [], viewer: null, fp: false });
    }

    setMenuMap(id) {
      if (!this.renderer) return;
      if (this.menuMapId === id && this.renderer.world && this.renderer.world.map.id === id) return;
      this.menuMapId = id;
      const def = O.MAPS[id];
      const map = O.buildMap(id, def.stages ? 0 : 0, { visual: true });
      this.renderer.setMap(map);
      const cm = map.cams.menu || map.cams.shot || { x: 0, y: 5, z: 0, tx: 0, ty: 5, tz: 10 };
      this.menuCam = { x: cm.x, y: cm.y, z: cm.z, yaw: Math.atan2(cm.tx - cm.x, cm.tz - cm.z), pitch: Math.atan2(cm.ty - cm.y, Math.hypot(cm.tx - cm.x, cm.tz - cm.z)) };
    }

    startEnd() {
      if (this.endSeq) return;
      this.releaseMouse();
      this.closeOverlayOnly();
      const g = this.game, p = g.player;
      const res = g.winner === null || g.winner === -1 ? 'draw' : p && g.winner === p.team ? 'win' : 'lose';
      this.endSeq = { t: 0, res, stage: 'banner' };
      this.audio.music(res === 'win' ? 'victory' : 'defeat');
      this.audio.say(res === 'win' ? 'Победа!' : res === 'draw' ? 'Ничья' : 'Поражение', { male: true, priority: true });
      O.Screens.banner(this, res);
      for (const h of g.heroes) if (h.bot && g.rand() < 0.4) this.later(1 + g.rand() * 3, () => g.say(h, O.pick(g.rand, g.winner === h.team ? O.CHAT.win : O.CHAT.lose), true));
    }

    closeOverlayOnly() { this.overlay = null; this.over.innerHTML = ''; this.over.className = 'ow-over'; }

    endTick(dt) {
      const s = this.endSeq;
      if (!s) return;
      s.t += dt;
      if (s.stage === 'banner' && s.t > 4) {
        s.stage = 'potg';
        const g = this.game;
        const best = g.replay ? g.replay.finalize() : null;
        const after = () => this.postMatch();
        if (best && best.frames.length > 30 && this.renderer) {
          const h = g.heroes[best.hid];
          const intro = h ? O.Profile.equipped(this.profile, h.heroId, 'intro') : null;
          if (h === g.player) this.profile.stats.potg++;
          O.Screens.clear(this);
          this.audio.music('potg');
          const botPoses = O.Clips.list(best.heroId, 'pose');
          const pose = h === g.player ? O.Clips.intro(best.heroId, intro || 'default') : botPoses.length ? 'pose:' + botPoses[best.hid % botPoses.length][0] : 'pose:heroic';
          this.startReplay(best, 'potg', { name: best.name, heroName: O.HEROES[best.heroId].name, pose, after });
          if (h && h.bot) this.later(3, () => g.say(h, O.pick(g.rand, O.CHAT.potg), true));
        } else after();
      }
    }

    postMatch() {
      const g = this.game;
      this.mode = 'post';
      const p = g.player;
      const kind = this.match ? this.match.cfg.kind : 'quick';
      const res = kind === 'practice' || kind === 'tutorial' ? null : O.Profile.addMatch(this.profile, g, p, { comp: kind === 'comp', party: (this.lastCfg && this.lastCfg.party && this.lastCfg.party.length) });
      this.postRes = res;
      this.setMenuMap(g.mapId);
      O.Screens.show(this, 'cards', { g, res });
    }
  }

  O.UI = UI;
})(globalThis.Ow98 = globalThis.Ow98 || {});
