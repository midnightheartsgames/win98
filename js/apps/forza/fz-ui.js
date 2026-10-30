(function (F) {
  'use strict';

  const M4 = F.M4;
  const TICK = F.TICK;
  const CAR_SHADOW = [0, 0, 0, 0.62];

  function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  function skyEnv(clock, weather, draw, wet) {
    const wx = typeof weather === 'string' ? F.weatherParams(weather) : weather;
    const cover = wx.cover, rain = wx.rain, storm = wx.storm, flash = wx.flash || 0, mist = wx.mist || 0;
    const el = Math.sin((clock - 6.2) / 12.6 * Math.PI);
    const az = (clock / 24) * Math.PI * 2 + 0.8;
    const sunH = Math.max(-0.3, el);
    const sd = F.norm3([Math.cos(az) * Math.cos(sunH * 1.2), Math.max(0.05, sunH), Math.sin(az) * Math.cos(sunH * 1.2)]);
    const day = F.smooth(-0.12, 0.22, el);
    const dusk = F.clamp(1 - Math.abs(el - 0.08) / 0.22, 0, 1) * day;
    const gray = F.clamp((cover - 0.3) / 0.56, 0, 1);
    const dark = F.clamp(rain * 0.6 + storm * 0.5, 0, 1);
    let skyTop = mixc([0.012, 0.018, 0.055], [0.18, 0.38, 0.8], day);
    let skyHor = mixc([0.045, 0.055, 0.11], [0.68, 0.78, 0.9], day);
    skyHor = mixc(skyHor, [1.0, 0.56, 0.32], dusk * 0.85);
    skyTop = mixc(skyTop, [0.38, 0.3, 0.54], dusk * 0.45);
    skyTop = mixc(skyTop, mixc([0.06, 0.06, 0.08], [0.5, 0.54, 0.58], day), gray * 0.85);
    skyHor = mixc(skyHor, mixc([0.07, 0.07, 0.09], [0.64, 0.66, 0.68], day), gray * 0.8);
    skyTop = mixc(skyTop, mixc([0.03, 0.03, 0.04], [0.22, 0.24, 0.28], day), dark * 0.8);
    skyHor = mixc(skyHor, mixc([0.04, 0.045, 0.05], [0.36, 0.38, 0.4], day), dark * 0.8);
    let sunCol = mixc([0.05, 0.05, 0.1], [1.0, 0.94, 0.82], day);
    sunCol = mixc(sunCol, [1.0, 0.6, 0.32], dusk * 0.7);
    sunCol = sunCol.map(v => v * (1 - gray * 0.65) * (1 - dark * 0.5) * (1 - mist * 0.5));
    const fl = [0.3, 0.33, 0.44].map(v => v * flash);
    const amb = mixc([0.14, 0.16, 0.26], [0.5, 0.56, 0.66], day).map((v, i) => (v + gray * 0.08 * day + mist * 0.1 * day) * (1 - dark * 0.32) + fl[i]);
    const groundCol = mixc([0.05, 0.05, 0.07], [0.36, 0.34, 0.3], day).map(v => v * (1 - dark * 0.3));
    const mistCol = mixc(mixc([0.15, 0.12, 0.095], [0.74, 0.76, 0.78], day), [0.93, 0.74, 0.58], dusk * 0.4);
    skyHor = mixc(skyHor, mistCol, mist * 0.85);
    const fogCol = mixc(skyHor.map((v, i) => v * (0.96 - rain * 0.08) + fl[i] * 0.2), mistCol, mist);
    const far = draw * wx.fog * (0.75 + 0.25 * day);
    const cloudCol = mixc([0.08, 0.08, 0.12], mixc(mixc([0.98, 0.98, 1.0], [0.68, 0.7, 0.72], gray), [0.42, 0.44, 0.48], dark), day);
    return {
      sunDir: sd, sunCol, amb, groundCol, fogNear: far * (0.28 - rain * 0.16), fogFar: far, fogCol, skyTop, skyHor, cloudCol, cover, night: 1 - day, day, dusk,
      wet: wet === undefined ? wx.wet || 0 : wet, time: 0, rain, storm, wind: wx.wind, flash, flashDir: wx.flashDir || [0, 1, 0], sunEl: el, sunUp: el > 0, drift: [0, 0],
      mist, mistD: mist * 0.021, mistH: 30, mistSun: mist * F.smooth(-0.05, 0.15, el) * 0.8
    };
  }
  F.skyEnv = skyEnv;

  const LAMP_WARM = [1, 0.82, 0.55];
  const LAMP_GLOW = {
    lamp: { f: 1.8, h: 8.1, s: 1.6, pool: 5, r: 22 }, blamp: { f: 0.9, h: 7, s: 1.6, pool: 5, r: 15 }, plamp: { f: 0, h: 4, s: 1.1, pool: 3.5, r: 12 },
    alamp: { f: 0, h: 9.1, s: 1.5, pool: 5, x: [-1.75, 1.75], r: 26 }, tlight: { f: -0.14, h: 3.5, s: 0.55, pool: 0, r: 0 },
    hlamp: { f: 0, h: 7.27, s: 1.3, pool: 5, r: 20 }, slamp: { f: 0, h: 2.94, s: 0.8, pool: 3, r: 9 }
  };
  F.LAMP_GLOW = LAMP_GLOW;

  const KEYS = {
    KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
    Space: 'hand', KeyR: 'rewind', KeyB: 'back', ShiftLeft: 'hand', KeyF: 'fix'
  };
  const CHAR = [0.07, 0.065, 0.06];
  const LOOK_RAD = 0.0045;
  const LOOK_RETURN = { fast: { delay: 0.5, w: 6 }, slow: { delay: 3, w: 4 }, off: null };
  const LOOK_LIMITS = { cockpit: { yaw: 2.35, up: 0.6, down: -0.7 }, hood: { yaw: 1.5, up: 0.45, down: -0.5 }, chase: { yaw: 0, up: 0.42, down: -1 }, far: { yaw: 0, up: 0.42, down: -1 } };
  const LOOK_HIDE_DRIVER = 1.75;
  const ZOOM = [0.7, 1.8];
  const PART_KG = { bumperF: 12, bumperR: 12, hood: 16, trunk: 13, mirrorL: 1.5, mirrorR: 1.5, wing: 6 };

  class UI {
    constructor(root, opts = {}) {
      this.opts = opts;
      this.root = root;
      this.build();
      this.audio = new F.Audio();
      this.hud = new F.Hud(this.hudCv);
      this.menus = new F.Menus(this);
      this.keys = {};
      this.mode = 'loading';
      this.camMode = 'chase';
      this.particles = [];
      this.menuOpen = false;
      this.acc = 0;
      this.last = 0;
      this.shake = 0;
      this.locT = 0;
      this.camYaw = 0;
      this.camPos = null;
      this.camHit = 1;
      this.camZoom = 1;
      this.look = { yaw: 0, pitch: 0, vy: 0, vp: 0, idle: 0, drag: null };
      this.pending = [];
      this.gamepadPrev = [];
      this.pad = { steer: 0, thr: 0, brk: 0, hand: 0, rewind: 0, back: 0 };
      try {
        this.renderer = new F.Renderer(this.view, { preserve: !!opts.preserve });
      } catch (e) {
        this.glError = String(e && e.message || e);
      }
      this.bind();
      if (F.Touch && F.Touch.wanted()) this.touch = new F.Touch(this);
      this.loadStep = 0;
      if (this.glError) this.showError();
      this.raf = requestAnimationFrame(t => this.frame(t));
    }

    build() {
      const el = document.createElement('div');
      el.className = 'fz';
      el.tabIndex = 0;
      el.innerHTML = `<canvas class="fz-view"></canvas><canvas class="fz-hudc"></canvas><div class="fz-menu"></div>
        <div class="fz-load"><div class="fz-logo"><div class="fz-logo-f">FORZA</div><div class="fz-logo-h">HORIZON</div><div class="fz-logo-r">RĪGA</div></div><div class="fz-lbar"><i></i></div><div class="fz-ltext">Загрузка…</div><div class="fz-ltip"></div></div>`;
      this.root.innerHTML = '';
      this.root.appendChild(el);
      this.el = el;
      this.view = el.querySelector('.fz-view');
      this.hudCv = el.querySelector('.fz-hudc');
      this.menuEl = el.querySelector('.fz-menu');
      this.loadEl = el.querySelector('.fz-load');
      const tips = ['Совет: ручник (Пробел) помогает войти в поворот боком.', 'Совет: R — перемотка времени, если ошиблись.', 'Совет: выключенные ассистенты увеличивают награду за гонки.', 'Совет: заборы и фонари дают очки «Разрушения».', 'Совет: щиты Horizon спрятаны по всей Риге — ищите их у достопримечательностей.', 'Совет: в Юрмале по пляжу быстрее всего едут полноприводные машины.', 'Совет: зажмите кнопку мыши и ведите ею, чтобы осмотреться из кабины или облететь машину камерой.'];
      el.querySelector('.fz-ltip').textContent = tips[Math.floor(Math.random() * tips.length)];
    }

    showError() {
      this.loadEl.querySelector('.fz-ltext').textContent = 'Не удалось запустить 3D-ускоритель: ' + this.glError;
      this.loadEl.querySelector('.fz-lbar').style.display = 'none';
    }

    active() { return this.opts.isActive ? this.opts.isActive() : true; }

    bind() {
      const el = this.el;
      this.onKeyDown = e => {
        if (!this.active()) return;
        this.audio.unlock();
        if (e.code === 'F7') {
          e.preventDefault();
          e.stopPropagation();
          if (!e.repeat) this.toggleDebug();
          return;
        }
        if (this.mode === 'title' || this.menuOpen) {
          if (this.menus.key(e)) { e.preventDefault(); e.stopPropagation(); }
          return;
        }
        if (this.mode !== 'play') return;
        const k = KEYS[e.code];
        if (k) { this.keys[k] = true; e.preventDefault(); }
        this.press(e.code, e);
      };
      this.onKeyUp = e => {
        if (this.photo) this.photo.keyUp(e.code);
        const k = KEYS[e.code];
        if (k) { this.keys[k] = false; e.preventDefault(); }
      };
      el.addEventListener('keydown', this.onKeyDown);
      el.addEventListener('keyup', this.onKeyUp);
      el.addEventListener('mousedown', () => { this.audio.unlock(); if (document.activeElement !== el) el.focus({ preventScroll: true }); });
      el.addEventListener('blur', () => { this.keys = {}; this.lookUp(); if (this.photo) this.photo.held.clear(); });
      const view = this.view;
      view.addEventListener('pointerdown', e => this.lookDown(e));
      view.addEventListener('pointermove', e => this.lookMove(e));
      view.addEventListener('pointerup', e => this.lookUp(e));
      view.addEventListener('pointercancel', e => this.lookUp(e));
      view.addEventListener('lostpointercapture', e => this.lookUp(e));
      view.addEventListener('dblclick', () => { if (this.canLook()) this.lookReset(); });
      view.addEventListener('contextmenu', e => { if (this.mode === 'play') { e.preventDefault(); e.stopPropagation(); } });
      view.addEventListener('wheel', e => this.lookZoom(e), { passive: false });
      this.onVis = () => { if (document.hidden) this.audio.suspend(); else this.audio.resume(); };
      document.addEventListener('visibilitychange', this.onVis);
      this.ro = new ResizeObserver(() => this.resized = true);
      this.ro.observe(el);
    }

    press(code, e) {
      const g = this.game;
      if (!g) return;
      switch (code) {
        case 'Escape': case 'KeyP':
          e && e.preventDefault();
          this.openPause();
          break;
        case 'KeyC': {
          const order = ['chase', 'far', 'hood', 'cockpit'];
          this.camMode = order[(order.indexOf(this.camMode) + 1) % order.length];
          this.lookReset();
          this.hud.toast({ chase: 'Камера: за машиной', far: 'Камера: дальняя', hood: 'Камера: капот', cockpit: 'Камера: из кабины' }[this.camMode]);
          break;
        }
        case 'KeyV': this.openPhoto(); break;
        case 'Backspace': e && e.preventDefault(); g.resetCar(); break;
        case 'KeyQ': this.shiftDown = true; break;
        case 'KeyE': this.shiftUp = true; break;
        case 'KeyM': this.menus.push(this.menus.mapScreen()); break;
        case 'Tab': e && e.preventDefault(); this.cycleRadio(); break;
        case 'KeyH': this.audio.play('horn'); this.honk(); break;
        case 'KeyL': g.lightsOn = !g.lightsOn; this.hud.toast(g.lightsOn ? 'Фары включены' : 'Фары выключены'); break;
        case 'Enter': case 'NumpadEnter': {
          if (g.race) break;
          const ev = g.nearestEvent(30);
          if (ev) {
            if (g.eventLocked(ev)) this.hud.toast('Событие закрыто', `Нужен ${F.EV.BANDS[Math.max(0, ev.tier)].name.toLowerCase()}`, '#ff8080');
            else this.menus.push(this.menus.lobby(ev));
          }
          break;
        }
        default: break;
      }
    }

    openPause() {
      if (this.game.race) this.menus.push(this.menus.racePause());
      else this.menus.push(this.menus.hub());
    }

    openPhoto() {
      if (this.mode !== 'play' || !this.game || this.photo || !this.renderer) return;
      this.photo = new F.Photo.Mode(this);
      this.menus.push(this.photo.screen());
    }

    carShown() { return !this.photo || !this.photo.hideCar(); }

    toggleDebug() {
      if (this.mode !== 'play' || !this.game) return;
      const top = this.menus.top;
      if (top && top.isDebug) this.menus.pop();
      else this.menus.push(this.menus.debug());
    }

    settings() {
      if (this.game) return this.game.profile.settings;
      if (!this.tmpSettings) {
        const p = F.Profile.loadProfile();
        this.tmpSettings = p ? p.settings : F.Profile.defaultSettings();
      }
      return this.tmpSettings;
    }

    applySettings() {
      const s = this.settings();
      if (this.renderer) {
        this.renderer.opts.dither = !!s.dither;
        this.renderer.opts.draw = s.draw;
        this.renderer.opts.flora = s.flora === undefined ? 2 : s.flora;
        this.renderer.setGfx(s.gfx || 'ultra');
      }
      this.applyVolumes();
      if (this.game) {
        this.game.applyAssists();
        this.game.applyDamageMode();
        this.game.save();
      } else {
        const p = F.Profile.loadProfile();
        if (p) { p.settings = s; F.Profile.saveProfile(p); }
      }
    }

    applyVolumes() {
      const s = this.settings();
      this.audio.setVolumes({ master: s.vol, engine: s.engine, sfx: s.sfx, ambient: s.ambient, music: s.music });
    }

    load(dt) {
      const bar = this.loadEl.querySelector('.fz-lbar i'), txt = this.loadEl.querySelector('.fz-ltext');
      if (this.glError) return;
      const t0 = performance.now();
      while (performance.now() - t0 < 40) {
        if (!this.world) {
          this.world = new F.World({ lazy: true });
          txt.textContent = 'Рига строится…';
          return;
        }
        if (!this.world.ready) {
          const ph = this.world.phases[this.world.phase][0];
          txt.textContent = ph + '…';
          this.world.stepBuild();
          bar.style.width = Math.round(this.world.phase / this.world.phases.length * 55) + '%';
          continue;
        }
        if (!this.scene) {
          this.scene = new F.Scene(this.world, { lazy: true });
          continue;
        }
        if (!this.scene.ready) {
          txt.textContent = this.scene.steps[this.scene.step][0] + '…';
          this.scene.stepBuild();
          bar.style.width = Math.round(55 + this.scene.step / this.scene.steps.length * 40) + '%';
          continue;
        }
        if (!this.mapArt) {
          txt.textContent = 'Карта…';
          this.mapArt = this.hud.mapArt(this.world);
          this.renderer.setScene(this.scene);
          this.skinQueue = F.Traffic.MODELS.slice();
          continue;
        }
        if (!this.adsReady) {
          txt.textContent = 'Реклама…';
          this.renderer.tex('adatlas');
          this.renderer.tex('clouds');
          for (const t of ['street', 'tiles', 'parkpath', 'apron', 'dirboards', 'mkt', 'bis']) this.renderer.tex(t);
          this.adsReady = true;
          continue;
        }
        if (!this.floraReady) {
          txt.textContent = 'Листва…';
          for (const t of ['flora', 'florafar', 'leaf']) this.renderer.tex(t);
          this.floraReady = true;
          continue;
        }
        if (this.skinQueue.length) {
          txt.textContent = 'Машины…';
          const id = this.skinQueue.shift(), m = this.renderer.carMesh(id);
          this.renderer.carSkin(id, 'none', m.geo.skin);
          bar.style.width = Math.round(95 + (1 - this.skinQueue.length / F.Traffic.MODELS.length) * 5) + '%';
          if (!this.skinQueue.length) this.driverQueue = F.Driver.crowdLooks();
          continue;
        }
        if (this.driverQueue && this.driverQueue.length) {
          txt.textContent = 'Водители…';
          for (const look of this.driverQueue.splice(0, 6)) {
            F.Driver.rig(look);
            this.renderer.lookTex(F.Driver.texKey(look), look, true);
          }
          continue;
        }
        bar.style.width = '100%';
        this.loadEl.style.display = 'none';
        this.applySettings();
        this.toTitle();
        return;
      }
      void dt;
    }

    toTitle() {
      this.mode = 'title';
      this.menus.closeAll();
      if (this.rubble) { this.freeRubble(this.rubble.list); this.rubble = null; }
      const p = F.Profile.loadProfile() || F.Profile.newProfile();
      this.game = null;
      this.titleGame = new F.Game(this.world, { profile: p, place: false });
      const h = F.MAP.HUB;
      this.titleGame.veh.place(h.x - 12, h.z + 14, 2.2, this.world);
      this.menus.push(this.menus.title());
    }

    newGame(reg) {
      F.Profile.wipeProfile();
      const p = F.Profile.newProfile(reg && reg.name);
      p.settings = Object.assign(p.settings, this.settings());
      if (reg && reg.look) {
        p.driver = {};
        for (const k of F.Profile.LOOK_KEYS) if (reg.look[k] !== undefined) p.driver[k] = reg.look[k];
        p.driver.fit = reg.look.fit;
      }
      F.Profile.saveProfile(p);
      this.startGame(p, true);
    }



    continueGame() {
      const p = F.Profile.loadProfile();
      if (!p) { this.newGame(); return; }
      this.startGame(p, !p.prologue);
    }

    startGame(p, prologue) {
      this.menus.closeAll();
      this.tmpSettings = null;
      this.game = new F.Game(this.world, { profile: p });
      this.titleGame = null;
      this.game.onPropBroken = prop => { const ch = this.scene.chunkAt(prop.x, prop.z); ch.dirtyProps = true; };
      if (this.rubble) this.freeRubble(this.rubble.list);
      this.rubble = new F.Debris(this.world, this.scene);
      this.camMode = p.settings.cam || 'chase';
      this.mode = 'play';
      this.camPos = null;
      this.lookReset();
      this.applySettings();
      if (p.settings.radio) this.audio.setStation(p.settings.radio);
      this.audio.onTrack = np => { if (np && this.mode === 'play') this.hud.toast(np.station, `${np.title} — ${np.artist}`, '#ffcf20', 4); };
      const news = F.Driver.adopt(p);
      if (news) F.Profile.saveProfile(p);
      if (prologue) {
        this.beginEvent('prologue');
        this.hud.banner('ДОБРО ПОЖАЛОВАТЬ В РИГУ', 'Фестиваль Horizon ждёт вас в Межапарксе. Следуйте за синими стрелками!', '#e6146e', 6);
      } else {
        this.hud.banner('ФЕСТИВАЛЬ HORIZON RĪGA', 'Esc — меню · M — карта · Enter у маяка — начать событие', '#e6146e', 5);
        if (p.driverNews) {
          this.hud.banner('НОВОЕ НА ФЕСТИВАЛЕ: ВАШ ВОДИТЕЛЬ', 'Esc → ВОДИТЕЛЬ: внешность, гардероб и пропуск участника', '#2f86e6', 6);
          p.driverNews = false;
          F.Profile.saveProfile(p);
        }
      }
    }

    exit() {
      if (this.game) this.game.save();
      if (this.opts.onExit) this.opts.onExit();
      else this.menus.popup('До встречи на фестивале!', 'Закройте вкладку браузера, чтобы выйти из игры.', '#e6146e', 'Остаться');
    }

    cycleRadio() {
      const s = this.settings();
      s.radio = ((s.radio || 0) + 1) % (F.STATIONS.length + 1);
      this.audio.unlock();
      this.audio.setStation(s.radio);
      if (!s.radio) this.hud.toast('Радио выключено');
      if (this.game) this.game.save();
    }

    toast(a, b, c) { this.hud.toast(a, b, c); }

    routeFor(ev) {
      this.routeCache = this.routeCache || {};
      if (!this.routeCache[ev.id]) {
        try { this.routeCache[ev.id] = F.Route.fromVia(this.world, ev.via, ev.closed, ev.pref || null); } catch (e) { return null; }
      }
      return this.routeCache[ev.id];
    }

    routeLen(ev) {
      const r = this.routeFor(ev);
      return r ? r.total * (ev.laps || 1) : 0;
    }

    beginEvent(id) {
      const g = this.game;
      const ev = F.EV.get(id);
      const route = this.routeFor(ev);
      g.startEvent(id, { seed: Math.floor(Math.random() * 1000) + 1 });
      void route;
      this.mode = 'play';
      this.camPos = null;
      this.lastCount = 4;
      this.clusterSweep = 1.4;
      this.finishT = 0;
      this.hud.banner(ev.name, F.EV.TYPES[ev.type].name + (ev.laps > 1 ? ` · ${ev.laps} круга` : ''), F.EV.TYPES[ev.type].col, 3.5);
      this.audio.setEngineType(g.veh.spec.eng);
    }

    restartEvent() {
      const g = this.game;
      if (!g.race) return;
      const id = g.race.ev.id;
      g.abandonEvent();
      this.beginEvent(id);
    }

    quitEvent() {
      this.game.abandonEvent();
      this.hud.toast('Гонка покинута');
    }

    resumeFromMenu() { this.keys = {}; }

    onMenusClosed() { this.keys = {}; }

    afterResults(r, ev, retry) {
      const g = this.game;
      g.endEvent(Object.assign({ retry: false }, r));
      if (retry) { this.beginEvent(ev.id); return; }
      this.audio.setEngineType(g.veh.spec.eng);
      if (ev.id === 'prologue') {
        this.menus.popup('Ваша первая машина', `<b>Lada 2105 · 1985</b><br>Скромная «пятёрка» — задний привод, 64 л.с. и характер. Жёлтые события фестиваля — для машин класса D. Удачи!`, '#f2d21e', 'В путь!', () => this.tutorial(), this.menus.entryThumb(g.entry));
        return;
      }
      if (r.bandUp) {
        const b = r.bandUp;
        const lines = { 1: 'Зелёный браслет! Открыты гонки класса C, Бикерниеки и витрина с электричкой.', 2: 'Синий браслет! Класс B, ночной порт и воздушный парад на Спилве.', 3: 'Оранжевый браслет! Класс A — аэропорт и большое кольцо Риги.', 4: 'Фиолетовый браслет! Класс S1 — самые быстрые гонки фестиваля.', 5: 'Золотой браслет! Вилкс ждёт вас в Межапарксе. Финал Horizon Rīga открыт.' };
        this.menus.popup(b.name.toUpperCase(), `<div class="fz-bandbig" style="--c:${b.col}"></div><p>«${lines[b.id] || ''}» — Марта Лиепиня</p>`, b.col, 'Отлично');
      }
      if (r.finaleWon) {
        this.menus.push(this.menus.credits());
        this.menus.popup('ЧЕМПИОН HORIZON RĪGA', 'Вы обошли Вилкса и выиграли финал фестиваля! McLaren F1 теперь стоит в вашем гараже.', '#e3a114', 'Ура!', null, this.menus.thumb('mclarenf1', '#e24a22', '#e24a22', 'none', null));
      }
      this.flushPending();
    }

    tutorial() {
      this.hud.banner('ФЕСТИВАЛЬ ОТКРЫТ', 'Цветные маяки — события. Подъезжайте и жмите Enter. M — карта, Esc — меню.', '#e6146e', 7);
      this.game.setWaypoint(F.EV.get('vecriga').via[0][0], F.EV.get('vecriga').via[0][1]);
      this.hud.toast('Маршрут к первой гонке: «Кольцо Вецриги»', 'Следуйте за синими стрелками', '#3a8cff', 6);
    }

    flushPending() {
      while (this.pending.length) {
        const p = this.pending.shift();
        p();
      }
    }

    frame(t) {
      this.raf = requestAnimationFrame(tt => this.frame(tt));
      const cap = this.touch ? this.settings().fps : 0;
      if (cap && this.last && t - this.last < 1000 / cap - 2) return;
      const dt = Math.min(0.1, Math.max(0, (t - (this.last || t)) / 1000));
      this.last = t;
      try {
        this.update(dt);
        this.withMotionLerp(() => this.render(dt));
      } catch (e) {
        if (!this.errShown) { this.errShown = true; console.error(e); }
      }
    }

    pollPad() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = pads && [...pads].find(p => p && p.connected);
      if (!gp) { this.pad.active = false; return; }
      const b = i => gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5);
      const bv = i => gp.buttons[i] ? gp.buttons[i].value : 0;
      const prev = this.gamepadPrev;
      const edge = i => b(i) && !prev[i];
      const ax = Math.abs(gp.axes[0]) > 0.12 ? gp.axes[0] : 0;
      this.pad = { active: true, steer: ax, thr: bv(7), brk: bv(6), hand: b(0) ? 1 : 0, rewind: b(3) ? 1 : 0, back: b(1) ? 1 : 0, fix: b(15) ? 1 : 0 };
      const fake = code => ({ code, preventDefault() { }, stopPropagation() { } });
      if (this.photo && this.photo.pad(gp, edge, fake)) this.padLatch = false;
      else if (this.mode === 'title' || this.menuOpen) {
        if (edge(12) || (gp.axes[1] < -0.6 && !this.padLatch)) this.menus.key(fake('ArrowUp'));
        if (edge(13) || (gp.axes[1] > 0.6 && !this.padLatch)) this.menus.key(fake('ArrowDown'));
        if (edge(14) || (gp.axes[0] < -0.6 && !this.padLatch)) this.menus.key(fake('ArrowLeft'));
        if (edge(15) || (gp.axes[0] > 0.6 && !this.padLatch)) this.menus.key(fake('ArrowRight'));
        this.padLatch = Math.abs(gp.axes[0]) > 0.6 || Math.abs(gp.axes[1]) > 0.6;
        if (edge(0)) this.menus.key(fake('Enter'));
        if (edge(1)) this.menus.key(fake('Escape'));
        if (edge(4)) this.menus.key(fake('KeyQ'));
        if (edge(5)) this.menus.key(fake('KeyE'));
      } else if (this.mode === 'play') {
        if (edge(9)) this.press('Escape');
        if (edge(8)) this.press('KeyM');
        if (edge(2)) this.press('KeyC');
        if (edge(4)) this.shiftDown = true;
        if (edge(5)) this.shiftUp = true;
        if (edge(14)) this.cycleRadio();
        if (edge(10)) { this.audio.play('horn'); this.honk(); }
        if (edge(12)) this.press('Enter');
        if (edge(13)) this.press('Backspace');
        if (edge(11)) this.press('KeyV');
      }
      this.gamepadPrev = gp.buttons.map(x => x.pressed);
    }

    input() {
      const k = this.keys, p = this.pad;
      let steer = (k.right ? 1 : 0) - (k.left ? 1 : 0);
      let analog = false;
      if (p.active && Math.abs(p.steer) > 0.01) { steer = p.steer; analog = true; }
      const inp = {
        thr: Math.max(k.up ? 1 : 0, p.thr || 0), brk: Math.max(k.down ? 1 : 0, p.brk || 0), steer, analog,
        hand: !!(k.hand || p.hand), rewind: !!(k.rewind || p.rewind), shiftUp: this.shiftUp, shiftDown: this.shiftDown, fix: !!(k.fix || p.fix)
      };
      this.shiftUp = this.shiftDown = false;
      return this.touch ? this.touch.merge(inp) : inp;
    }

    update(dt) {
      this.hud.update(dt);
      this.pollPad();
      if (this.touch) this.touch.update(dt);
      if (this.mode === 'loading') { this.load(dt); return; }
      if (!this.active()) { this.audio.update(null); return; }
      if (this.mode === 'title') {
        this.titleT = (this.titleT || 0) + dt;
        this.audio.update(null);
        return;
      }
      const g = this.game;
      if (!g) return;
      if (this.menuOpen) {
        this.audio.update({ silent: true, rain: g.wx.rain, inside: this.camMode === 'cockpit' });
        if (this.menus.top && this.menus.top.draw) this.menus.top.draw();
        return;
      }
      this.acc += dt;
      let steps = 0;
      const inp = this.input();
      this.lastThrottle = inp.thr;
      while (this.acc >= TICK && steps < 5) {
        this.prevPose = { x: g.veh.x, y: g.veh.y, z: g.veh.z, yaw: g.veh.yaw };
        this.motion = this.snapshotMotion(g);
        g.step(TICK, inp);
        inp.shiftUp = inp.shiftDown = false;
        this.acc -= TICK;
        steps++;
      }
      if (steps === 5) this.acc = 0;
      this.rewinding = g.rewinding;
      this.handleEvents(g.drain());
      this.updateDrivers(dt);
      this.updateRubble(dt);
      this.raceTick(dt);
      this.market = this.marketState(g.veh);
      this.emitParticles(dt);
      this.fireworks(dt);
      this.updateParticles(dt);
      this.updateLocation(dt);
      const v = g.veh, dm = v.dmg;
      const loose = F.SURF[v.surf] && F.SURF[v.surf].loose;
      this.scrapeK = Math.max(0, (this.scrapeK || 0) - dt * 4);
      this.audio.setEngineType(v.spec.eng);
      this.audio.update({ rpm: dm && dm.burnt ? 0 : v.rpm, thr: dm && dm.burnt ? 0 : inp.thr, speed: v.speed, skid: v.skid, loose, rough: v.rough || 0, limiter: v.limiter, inside: this.camMode === 'cockpit', rain: g.wx.rain, wet: g.wetK, roof: this.market.roof, market: this.market.near, misfire: !!(dm && dm.misT > 0), dead: !!(dm && dm.burnt), fire: dm ? (dm.burning ? 1 : dm.burnt && g.wreckT > 0 ? 0.7 : 0) : 0, scrape: this.scrapeK, knock: dm && dm.mechOn && !dm.burnt ? F.clamp((0.5 - dm.hp) * 2, 0, 1) : 0 });
      this.hornT = g.wx.mist > 0.6 ? (this.hornT === undefined ? 8 : this.hornT) - dt : undefined;
      if (this.hornT <= 0) { this.hornT = 35 + Math.random() * 40; this.audio.foghorn(900 + Math.random() * 1800); }
      this.shake = Math.max(0, this.shake - dt * 3);
    }

    raceTick(dt) {
      const g = this.game, r = g.race;
      if (!r) return;
      if (r.state === 'grid') {
        const n = Math.ceil(r.count - 0.6);
        if (n !== this.lastCount && n >= 1 && n <= 3) { this.audio.play('beep'); this.lastCount = n; }
      } else if (this.lastCount > 0 && r.state === 'race') {
        this.lastCount = 0;
        this.audio.play('go');
        this.hud.bigText('СТАРТ!', '#ffcf20', 0.9);
      }
      if (this.finishT > 0) {
        this.finishT -= dt;
        if (this.finishT <= 0) {
          const ev = r.ev;
          const res = g.finishEvent();
          if (res) this.menus.push(this.menus.results(res, ev));
        }
      }
    }

    handleEvents(list) {
      const g = this.game, hud = this.hud, au = this.audio;
      for (const e of list) {
        this.driverEvent(e);
        if (this.touch) this.touch.event(e, g);
        switch (e.t) {
          case 'bank':
            au.play('bank');
            hud.toast(`+${F.fmtCR(e.total)} очков навыка`, `+${F.fmtCR(e.xp)} XP · +CR ${F.fmtCR(e.cr)}${e.sp ? ` · +${e.sp} очк. навыков` : ''}`, '#ffcf20', 2.6);
            break;
          case 'chainlost': au.play('lost'); hud.toast('ЦЕПОЧКА ПРЕРВАНА', null, '#ff5070', 1.6); break;
          case 'hit': au.play('hit', e.impact); this.shake = Math.min(1, this.shake + e.impact * 0.06); if (e.impact > 4) this.sparks(g.veh.x, g.veh.y + 0.5, g.veh.z, e.impact); if (e.obj && e.obj.src && F.TREE[e.obj.src.kind]) this.shakeTree(e.obj.src, e.impact); break;
          case 'brush': this.onBrush(e); break;
          case 'item': { const it = F.Wear.ITEM[e.id]; au.play('bank'); hud.toast(e.why === 'level' ? `Подарок за ${e.level} уровень` : 'Новая вещь в гардеробе', `${it.name} · Esc → ВОДИТЕЛЬ → ГАРДЕРОБ`, '#2f86e6', 4); break; }
          case 'carhit': au.play('hit', e.impact); this.shake = Math.min(1, this.shake + e.impact * 0.05); break;
          case 'smash': this.smashProp(e); break;
          case 'dent': this.onDent(e); break;
          case 'part': this.onPart(e); break;
          case 'flat': au.play('pop'); if (e.owner && e.owner.player) hud.toast('ПРОКОЛ', 'Машину тянет в сторону, сцепление упало', '#ff8040', 2.2); break;
          case 'fire': au.play('ignite'); hud.banner('ДВИГАТЕЛЬ ГОРИТ!', 'Backspace — эвакуатор, R — перемотка. Иначе машина взорвётся', '#ff3a1a', 4.5); break;
          case 'misfire': au.play('misfire'); this.backfire(); break;
          case 'boom': this.explode(e); break;
          case 'recovered': hud.flash = 0.8; hud.toast('Машина восстановлена', e.fee ? `Эвакуатор и ремонт · CR ${F.fmtCR(e.fee)}` : 'Эвакуатор вернул вас на дорогу', '#9ad0ff', 3); break;
          case 'repaired': au.play('repair'); hud.toast('Машина отремонтирована', e.outpost ? `Аванпост «${e.outpost}» · бесплатно` : e.cost ? `CR ${F.fmtCR(e.cost)}` : null, '#3fc46a', 2.6); break;
          case 'extinguished': hud.toast('Пожар потушен', 'Двигатель еле тянет — отремонтируйтесь на аванпосте', '#9ad0ff', 2.6); break;
          case 'fixStart': au.play('wrench'); break;
          case 'fixed': au.play('repair'); hud.toast('Двигатель подлатан', 'Кузов — на аванпосте или в меню Horizon', '#3fc46a', 2.6); break;
          case 'land': if (e.impact > 3) { au.play('land', e.impact); this.shake = Math.min(1, this.shake + e.impact * 0.04); } break;
          case 'shift': au.play('shift'); if (e.dir > 0 && g.veh.spec.turbo) au.play('blowoff'); break;
          case 'splash': au.play('splash'); this.splash(g.veh.x, F.WATER_Y, g.veh.z); break;
          case 'water': hud.toast('Машина в воде', 'Возвращаем на дорогу', '#3a8cff'); break;
          case 'reset': hud.flash = 0.6; break;
          case 'road':
            if (!this.roadToastT || performance.now() - this.roadToastT > 5000) { this.roadToastT = performance.now(); hud.toast('Новая дорога: ' + e.name, `Открыто ${e.pct}% дорог Риги · +15 XP`, '#9ad0ff', 2.2); }
            break;
          case 'outpost': hud.banner('АВАНПОСТ ОТКРЫТ', e.o.name + ' · быстрое перемещение через карту · +500 XP', '#e6146e', 4); break;
          case 'barn': {
            const car = F.Cars.get(e.car);
            au.play('levelup');
            this.menus.popup('НАХОДКА В САРАЕ!', `<b>${car.year} ${F.esc(car.make)} ${F.esc(car.model)}</b><br>Под брезентом и слоем пыли — настоящая легенда. Машина отреставрирована и уже в вашем гараже. +3000 XP`, '#e3a114', 'Забрать', null, this.menus.thumb(car.id, car.col, car.col2 || car.col, 'none', null));
            break;
          }
          case 'board':
            au.play('board');
            hud.banner(e.kind === 'xp' ? 'ЩИТ ОПЫТА' : 'ЩИТ БЫСТРОГО ПЕРЕМЕЩЕНИЯ', `${e.count} / ${e.total} · +${e.xp} XP${e.kind === 'ft' ? ' · перемещение дешевле' : ''}`, e.kind === 'xp' ? '#ffb020' : '#30b4ff', 3.5);
            break;
          case 'stunt': {
            const d = e.stunt;
            const kn = { trap: 'СКОРОСТНАЯ ЛОВУШКА', zone: 'ЗОНА СКОРОСТИ', drift: 'ЗОНА ДРИФТА', jump: 'ОПАСНЫЙ ПРЫЖОК' }[d.kind];
            const unit = d.kind === 'drift' ? ' очков' : d.kind === 'jump' ? ' м' : ' км/ч';
            if (e.stars) au.play('star');
            hud.banner(`${kn}: ${d.name}`, `${F.fmtCR(e.value)}${unit}${e.improved ? ' · новый рекорд!' : ` · рекорд ${F.fmtCR(e.best)}${unit}`}${e.cr ? ` · +CR ${F.fmtCR(e.cr)}` : ''}`, '#e6146e', 3.6, { stars: e.stars });
            break;
          }
          case 'stuntStart': hud.toast(e.stunt.kind === 'zone' ? 'ЗОНА СКОРОСТИ' : 'ЗОНА ДРИФТА', e.stunt.name, '#e6146e', 1.6); break;
          case 'stuntFail': hud.toast('Трюк прерван', e.stunt.name, '#ff8080', 1.6); break;
          case 'levelup':
            au.play('levelup');
            hud.banner(`УРОВЕНЬ ${e.level}`, `+CR ${F.fmtCR(e.cr)}${e.car ? ' · подарок: ' + F.Cars.get(e.car).make + ' ' + F.Cars.get(e.car).model : ''}`, '#3fc46a', 4.5);
            if (e.car) {
              const car = F.Cars.get(e.car);
              const show = () => this.menus.popup('ПОДАРОК ФЕСТИВАЛЯ', `<b>${car.year} ${F.esc(car.make)} ${F.esc(car.model)}</b> — награда за ${e.level}-й уровень. Машина уже в гараже.`, '#3fc46a', 'Спасибо!', null, this.menus.thumb(car.id, car.col, car.col2 || car.col, car.livery || 'none', null));
              if (g.race) this.pending.push(show); else show();
            }
            break;
          case 'launch': hud.toast(e.good ? 'ИДЕАЛЬНЫЙ СТАРТ!' : 'ПРОБУКСОВКА!', null, e.good ? '#3fc46a' : '#ff8080', 1.5); break;
          case 'lap': hud.bigText(`КРУГ ${e.lap}/${g.race.laps}`, '#ffffff', 1.3); au.play('checkpoint'); break;
          case 'checkpoint': au.play('checkpoint'); break;
          case 'finish':
            this.finishT = 1.6;
            hud.bigText(g.race && g.race.special ? (e.pos === 1 ? 'ПОБЕДА!' : 'ФИНИШ') : g.race && g.race.ev.id === 'prologue' ? 'ФИНИШ!' : `${e.pos}-Е МЕСТО`, e.pos === 1 ? '#ffcf20' : '#ffffff', 1.6);
            au.play('levelup');
            break;
          case 'rewind': au.play('rewind'); break;
          case 'weather': {
            const sub = { clear: 'Тучи расходятся, асфальт скоро подсохнет', overcast: 'Небо затягивает облаками', downpour: 'Асфальт мокрый — сцепление ниже', storm: 'Молнии и ливень — держите дистанцию', fog: 'Видимость около 150 м — включите фары' }[e.w];
            hud.toast('Погода: ' + F.WEATHER[e.w].name.toLowerCase(), sub, e.w === 'storm' ? '#ffd23a' : e.w === 'fog' ? '#d8dde4' : '#9ad0ff');
            break;
          }
          case 'lightning': this.addBolt(e); au.thunder(e.d); break;
          case 'teleport': hud.flash = 1; this.camPos = null; this.particles = []; hud.toast('Телепорт', e.name, '#30b4ff', 2); break;
          case 'arrived': hud.toast('Вы на месте', null, '#3a8cff'); break;
          case 'fasttravel': hud.flash = 1; this.camPos = null; break;
          case 'car': this.camPos = null; break;
          default: break;
        }
      }
    }

    updateLocation(dt) {
      this.locT = Math.max(0, this.locT - dt * 0.5);
      this.locCheck = (this.locCheck || 0) - dt;
      if (this.locCheck > 0) return;
      this.locCheck = 0.7;
      const v = this.game.veh, w = this.world;
      const d = w.districtAt(v.x, v.z);
      const e = w.lastEdge;
      const name = d ? d.name : 'Рига';
      const sub = e ? e.name : '';
      if (name !== this.locName) { this.locName = name; this.locSub = sub; this.locT = 2.5; }
      else if (sub && sub !== this.locSub) { this.locSub = sub; }
    }

    marketState(v) {
      const trg = this.world.trg;
      if (!trg) return { near: 0, roof: false };
      const [mx, mz] = trg.L(0, -20), d = Math.hypot(v.x - mx, v.z - mz);
      return { near: F.clamp(1 - (d - 70) / 150, 0, 1), roof: d < 160 && F.inPoly(v.x, v.z, trg.meat) };
    }

    emitParticles(dt) {
      const g = this.game, v = g.veh;
      if (this.particles.length > 700) return;
      const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw), rx = -fz, rz = fx;
      const s = F.SURF[v.surf] || F.SURF[0];
      const rear = v.spec.b;
      const tw = v.spec.track * 0.5;
      const smokeK = v.skid > 0.25 && !s.loose ? v.skid : 0;
      const dustK = s.loose && v.speed > 4 && !v.air ? F.clamp(v.speed / 25, 0, 1) : 0;
      const sprayK = !s.loose && !v.air && !this.market.roof ? (g.wetK || 0) * F.clamp((v.speed - 7) / 28, 0, 1) : 0;
      this.sprayAcc = (this.sprayAcc || 0) + dt * sprayK * 60;
      while (this.sprayAcc > 1) {
        this.sprayAcc -= 1;
        const side = Math.random() < 0.5 ? -1 : 1, back = Math.random() < 0.7 ? rear : -v.spec.a;
        const x = v.x - fx * back + rx * tw * side, z = v.z - fz * back + rz * tw * side;
        this.particles.push({ x, y: v.y + 0.25, z, vx: v.vx * 0.55 + rx * side * 1.5 + (Math.random() - 0.5), vy: 0.9 + Math.random() * 0.9, vz: v.vz * 0.55 + rz * side * 1.5 + (Math.random() - 0.5), life: 0, max: 0.7 + Math.random() * 0.5, size: 0.45, grow: 3.4, col: [0.8, 0.82, 0.86], a: 0.3 * sprayK, tex: 'smoke' });
      }
      this.pAcc = (this.pAcc || 0) + dt * (smokeK * 22 + dustK * 26);
      const dustCol = { gravel: [0.65, 0.58, 0.46], dirt: [0.52, 0.42, 0.3], sand: [0.86, 0.8, 0.62], grass: [0.5, 0.52, 0.34], water: [0.8, 0.88, 0.95] }[s.id] || [0.8, 0.8, 0.8];
      while (this.pAcc > 1) {
        this.pAcc -= 1;
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = v.x - fx * rear + rx * tw * side, z = v.z - fz * rear + rz * tw * side;
        if (smokeK > 0) this.particles.push({ x, y: v.y + 0.3, z, vx: v.vx * 0.2 + (Math.random() - 0.5), vy: 0.5 + Math.random() * 0.5, vz: v.vz * 0.2 + (Math.random() - 0.5), life: 0, max: 1.1 + Math.random() * 0.6, size: 0.6, grow: 1.6, col: [0.86, 0.86, 0.86], a: 0.42 * smokeK, tex: 'smoke' });
        else this.particles.push({ x, y: v.y + 0.2, z, vx: v.vx * 0.35 + (Math.random() - 0.5) * 2, vy: 0.8 + Math.random(), vz: v.vz * 0.35 + (Math.random() - 0.5) * 2, life: 0, max: 1.2 + Math.random() * 0.8, size: 0.8, grow: 2.2, col: dustCol, a: 0.4 * dustK, tex: 'smoke' });
      }
      if (v.dmg) this.damageParticles(dt, v, v.dmg, fx, fz, rx, rz, s);
    }

    damageParticles(dt, v, d, fx, fz, rx, rz, s) {
      const sm = d.smoke(), burn = d.burning || (d.burnt && this.game.wreckT > 0);
      if (sm > 0) {
        const e = d.lay.engine, ex = v.x + fx * -e[2] + rx * e[0], ez = v.z + fz * -e[2] + rz * e[0], ey = v.y + e[1] + 0.15;
        this.engAcc = (this.engAcc || 0) + dt * (burn ? 34 : 5 + sm * 16);
        const grey = burn || d.burnt ? 0.1 : F.lerp(0.86, 0.18, sm);
        while (this.engAcc > 1) {
          this.engAcc -= 1;
          this.particles.push({ x: ex + (Math.random() - 0.5) * 0.5, y: ey, z: ez + (Math.random() - 0.5) * 0.5, vx: v.vx * 0.25 + (Math.random() - 0.5) * 0.6, vy: 1.1 + Math.random() * 1.2, vz: v.vz * 0.25 + (Math.random() - 0.5) * 0.6, life: 0, max: 1.5 + Math.random() * 1.1, size: 0.35, grow: 1.3 + sm, col: [grey, grey * 0.98, grey * 0.96], a: 0.3 + 0.35 * sm, tex: 'smoke' });
          if (burn) for (let k = 0; k < 2; k++) this.particles.push({ x: ex + (Math.random() - 0.5) * 0.7, y: ey - 0.15 + Math.random() * 0.2, z: ez + (Math.random() - 0.5) * 0.7, vx: v.vx * 0.6 + (Math.random() - 0.5) * 0.5, vy: 1.6 + Math.random() * 2.2, vz: v.vz * 0.6 + (Math.random() - 0.5) * 0.5, life: 0, max: 0.22 + Math.random() * 0.32, size: 0.16 + Math.random() * 0.26, grow: -0.2, col: k ? [1, 0.82, 0.35] : [1, 0.38 + Math.random() * 0.2, 0.08], a: 1, tex: 'glow', add: true });
        }
      }
      if (v.speed > 7 && !v.air && !s.loose) {
        for (let i = 0; i < 4; i++) {
          if (!d.flat[i] || Math.random() > dt * 18) continue;
          const wl = v.wheels[i], x = v.x + fx * wl.lx + rx * wl.lz, z = v.z + fz * wl.lx + rz * wl.lz;
          this.particles.push({ x, y: v.y + 0.05, z, vx: v.vx * 0.4 + (Math.random() - 0.5) * 3, vy: Math.random() * 2.5, vz: v.vz * 0.4 + (Math.random() - 0.5) * 3, life: 0, max: 0.25 + Math.random() * 0.3, size: 0.08, grow: 0, col: [1, 0.72, 0.3], a: 1, tex: 'glow', add: true, grav: 9 });
        }
        for (const [name, end] of [['bumperF', 1], ['bumperR', -1]]) {
          if (d.part(name) !== 1 || d.anim[name] < 0.36 || Math.random() > dt * 22) continue;
          const side = -d.hang[name], x = v.x + fx * end * v.spec.len * 0.5 + rx * side * v.spec.wid * 0.45, z = v.z + fz * end * v.spec.len * 0.5 + rz * side * v.spec.wid * 0.45;
          this.particles.push({ x, y: v.y + 0.04, z, vx: v.vx * 0.3 + (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: v.vz * 0.3 + (Math.random() - 0.5) * 2, life: 0, max: 0.3, size: 0.07, grow: 0, col: [1, 0.75, 0.35], a: 1, tex: 'glow', add: true, grav: 9 });
          this.scrapeK = Math.max(this.scrapeK || 0, 0.5);
        }
      }
    }

    addBolt(e) {
      const rng = F.rng(e.seed || 1), gy = this.world.terrainH(e.x, e.z);
      const top = [e.x + (rng() - 0.5) * 140, 520 + rng() * 120, e.z + (rng() - 0.5) * 140];
      const path = (a, b, depth, amp) => {
        let pts = [a, b];
        for (let k = 0; k < depth; k++) {
          const next = [pts[0]];
          for (let i = 1; i < pts.length; i++) {
            const p = pts[i - 1], q = pts[i], s = amp / (1 << k);
            next.push([(p[0] + q[0]) / 2 + (rng() - 0.5) * s, (p[1] + q[1]) / 2 + (rng() - 0.5) * s * 0.3, (p[2] + q[2]) / 2 + (rng() - 0.5) * s], q);
          }
          pts = next;
        }
        return pts;
      };
      const main = path(top, [e.x, gy, e.z], 6, 150);
      const branches = [];
      for (let k = 0; k < 3; k++) {
        const i = 8 + Math.floor(rng() * 28), a = main[i], len = 60 + rng() * 140;
        branches.push(path(a, [a[0] + (rng() - 0.5) * len, a[1] - len * (0.6 + rng() * 0.5), a[2] + (rng() - 0.5) * len], 4, len * 0.5));
      }
      const pulses = [0, 0.07 + rng() * 0.06, 0.2 + rng() * 0.15];
      (this.bolts || (this.bolts = [])).push({ main, branches, t: 0, pulses, d: e.d, x: e.x, y: gy, z: e.z });
      if (this.bolts.length > 3) this.bolts.shift();
    }

    boltLight(b) {
      let k = 0;
      for (const p of b.pulses) if (b.t >= p) k = Math.max(k, Math.exp(-(b.t - p) * 16));
      return k;
    }

    drawBolts(env, cam, C) {
      const r = this.renderer, list = this.bolts;
      if (!list || !list.length) return;
      r.beginSprites();
      for (const b of list) {
        const k = this.boltLight(b);
        if (k < 0.02) continue;
        const w0 = Math.max(1.4, b.d * 0.0035), fade = Math.exp(-b.d / 2600);
        const seg = (pts, w, a) => {
          for (let i = 1; i < pts.length; i++) {
            const p = pts[i - 1], q = pts[i];
            const ux = (q[0] - p[0]) / 2, uy = (q[1] - p[1]) / 2, uz = (q[2] - p[2]) / 2;
            const mx = p[0] + ux, my = p[1] + uy, mz = p[2] + uz;
            const vx = mx - cam.x, vy = my - cam.y, vz = mz - cam.z;
            let rx = uy * vz - uz * vy, ry = uz * vx - ux * vz, rz = ux * vy - uy * vx;
            const l = Math.hypot(rx, ry, rz) || 1;
            rx *= w / l; ry *= w / l; rz *= w / l;
            r.sprite('bolt', true, mx, my, mz, rx, ry, rz, ux, uy, uz, [a * 0.85, a * 0.9, a, 1]);
          }
        };
        seg(b.main, w0 * 4, k * 0.35 * fade);
        seg(b.main, w0, k * fade);
        for (const br of b.branches) seg(br, w0 * 0.6, k * 0.7 * fade);
        r.billboard('glow', true, b.x, b.y + 4, b.z, 30 + b.d * 0.01, [k * fade, k * fade, k * fade, 1], C);
      }
      r.flushSprites(env, cam, C, true);
    }

    sparks(x, y, z, k) {
      for (let i = 0; i < Math.min(30, k * 3); i++) {
        this.particles.push({ x, y, z, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 5, vz: (Math.random() - 0.5) * 8, life: 0, max: 0.4 + Math.random() * 0.4, size: 0.12, grow: 0, col: [1, 0.7, 0.3], a: 1, tex: 'glow', add: true, grav: 9 });
      }
    }

    splash(x, y, z) {
      for (let i = 0; i < 40; i++) this.particles.push({ x: x + (Math.random() - 0.5) * 3, y, z: z + (Math.random() - 0.5) * 3, vx: (Math.random() - 0.5) * 4, vy: 3 + Math.random() * 5, vz: (Math.random() - 0.5) * 4, life: 0, max: 1.3, size: 0.6, grow: 1.5, col: [0.85, 0.92, 1], a: 0.7, tex: 'smoke', grav: 9 });
    }

    debris(obj, speed, n = 14) {
      const v = this.game.veh;
      const mat = obj.src ? F.DebrisKit.MAT_OF[obj.src.type] : 'wood';
      const col = obj.board ? [1, 0.7, 0.2] : mat === 'wood' ? [0.45, 0.33, 0.2] : mat === 'glass' ? [0.75, 0.85, 0.95] : mat === 'plastic' ? [0.3, 0.5, 0.35] : [0.4, 0.42, 0.45];
      for (let i = 0; i < n; i++) {
        this.particles.push({ x: obj.x, y: (obj.src ? obj.src.y : v.y) + 0.5 + Math.random(), z: obj.z, vx: v.vx * 0.7 + (Math.random() - 0.5) * 6, vy: 2 + Math.random() * 6, vz: v.vz * 0.7 + (Math.random() - 0.5) * 6, life: 0, max: 1.6, size: 0.08 + Math.random() * 0.14, grow: 0, col, a: 1, tex: 'white', grav: 12, solid: true });
      }
      void speed;
    }

    camDist(x, z) {
      const c = this.lastCamPos;
      return c ? Math.hypot(x - c[0], z - c[2]) : 0;
    }

    toRendered(o) {
      const rp = this.renderPose();
      return Object.assign({}, o, { x: rp.x, y: rp.y, z: rp.z, yaw: rp.yaw });
    }

    toWorld(o, p) {
      const c = Math.cos(o.yaw), s = Math.sin(o.yaw);
      return [o.x + p[0] * c - p[2] * s, (o.y || 0) + p[1], o.z + p[0] * s + p[2] * c];
    }

    leafBurst(x, y, z, n, col, spread, vx = 0, vz = 0, up = 1.5) {
      if (this.particles.length > 900) return;
      const rnd = Math.random;
      for (let i = 0; i < n; i++) {
        const sh = 0.75 + rnd() * 0.5;
        this.particles.push({ x: x + (rnd() - 0.5) * spread, y: y + rnd() * spread * 0.5, z: z + (rnd() - 0.5) * spread, vx: vx * 0.35 + (rnd() - 0.5) * 3, vy: up * (0.4 + rnd()), vz: vz * 0.35 + (rnd() - 0.5) * 3, life: 0, max: 1.8 + rnd() * 1.8, size: 0.14 + rnd() * 0.12, grow: 0, col: [col[0] * sh, col[1] * sh, col[2] * sh], a: 1, tex: 'leaf', solid: true, leaf: 1 + rnd() * 6 });
      }
    }

    pushAt(x, z, r, amp) {
      const P = this.pushes || (this.pushes = []);
      P.unshift({ x, z, r, amp, t: 0 });
      if (P.length > 2) P.length = 2;
    }

    onBrush(e) {
      const f = e.obj.src, g = this.game, v = g.veh, sp = Math.min(1, e.speed / 25);
      const col = F.Trees.leafCol(f.kind);
      this.leafBurst(e.x, (f.y || v.y) + (f.h || 1.5) * 0.45, e.z, Math.round(14 + 30 * sp), col, Math.min(2.5, (f.w || 1.5) * 0.6), v.vx, v.vz, 1 + sp * 2.5);
      this.pushAt(f.x, f.z, Math.max(2, (f.type === 'hedge' ? f.len : f.w) * 0.8 + 1), 0.25 + 0.35 * sp);
      this.audio.play('rustle', 0.4 + sp * 0.8);
      this.shake = Math.min(1, this.shake + 0.04 + sp * 0.06);
    }

    shakeTree(t, impact) {
      const sp = F.TREE[t.kind], I = F.Trees.inst(t.x, t.z, t.s, sp), k = Math.min(1, impact / 12);
      this.pushAt(t.x, t.z, I.Wd * 0.7 + 2, 0.18 + 0.4 * k);
      this.leafBurst(t.x, t.y + I.H * 0.62, t.z, Math.round(10 + 30 * k), sp.col, I.Wd * 0.7, 0, 0, 0.4);
      this.audio.play('rustle', 0.5 + k);
    }

    smashProp(e) {
      const obj = e.obj, g = this.game, rb = this.rubble, au = this.audio;
      const hit = { vx: e.vx || g.veh.vx, vz: e.vz || g.veh.vz, nx: e.nx || 0, nz: e.nz || 0 };
      const mass = g.veh.spec.mass, K = F.DebrisKit;
      let mat = 'metal';
      if (rb) {
        if (obj.board) {
          const b = this.world.boards.find(q => q.col === obj);
          if (b) rb.spawnBoard(K.boardPieces(b.kind), b.x, b.y, b.z, b.yaw, hit, mass);
          mat = 'wood';
        } else if (obj.sign) {
          const s = this.world.signs.find(q => q.col === obj);
          if (s) rb.spawnBoard(K.signPieces(s.kind), s.x, s.y, s.z, s.yaw, hit, mass);
        } else if (obj.src) {
          rb.spawnProp(obj.src, hit, mass);
          mat = K.MAT_OF[obj.src.type] || 'metal';
        }
      }
      au.play('smash', 1);
      au.play('break', { wood: 1, glass: 2, plastic: 3, metal: 0 }[mat] || 0);
      if (mat === 'glass') this.glassBurst([obj.x, (obj.src ? obj.src.y : g.veh.y) + 1.2, obj.z], 26, null, hit);
      this.debris(obj, e.speed, 6);
    }

    onDent(e) {
      const d = e.rec.d, far = this.camDist(e.x, e.z), mine = e.owner && e.owner.player;
      if (e.scrape) {
        if (mine) this.scrapeK = 1;
        if (far < 80) this.sparks(e.x, e.y, e.z, 3);
        return;
      }
      if (far < 160 && d > 0.015) this.audio.play('crunch', Math.min(1, d / 0.22) * F.clamp(1.15 - far / 160, 0.15, 1));
      if (d > 0.03 && far < 200) this.sparks(e.x, e.y, e.z, 3 + d * 50);
      if (d > 0.07 && far < 200) {
        for (let i = 0; i < 6; i++) this.particles.push({ x: e.x, y: e.y, z: e.z, vx: (Math.random() - 0.5) * 3, vy: 0.6 + Math.random(), vz: (Math.random() - 0.5) * 3, life: 0, max: 0.9 + Math.random() * 0.5, size: 0.4, grow: 1.8, col: [0.62, 0.6, 0.56], a: 0.35, tex: 'smoke' });
      }
      if (mine) this.shake = Math.min(1, this.shake + d * 2.4);
    }

    onPart(e) {
      const o = e.owner && e.owner.player && this.game ? this.toRendered(e.owner) : e.owner;
      if (!o) return;
      const name = e.part, au = this.audio, far = this.camDist(o.x, o.z);
      const wp = e.x !== undefined ? this.toWorld(o, [e.x, e.y, e.z]) : [o.x, (o.y || 0) + 0.8, o.z];
      if (name.startsWith('glass')) {
        if (e.state === 2) { this.glassBurst(wp, name === 'glassF' || name === 'glassB' ? 34 : 22, null, o); if (far < 160) au.play('glass', 1); }
        else if (far < 120) au.play('crack');
        return;
      }
      if (name.startsWith('head') || name.startsWith('tail')) {
        this.glassBurst(wp, 8, name.startsWith('tail') ? [1, 0.32, 0.26] : null, o);
        if (far < 120) au.play('glass', 0.35);
        return;
      }
      if (e.state === 1) { if (far < 120) au.play('clunk'); return; }
      const pm = this.renderer && this.rubble ? this.renderer.partMesh(o, name) : null;
      if (!pm) return;
      const burnt = !!(o.dmg && o.dmg.burnt);
      const look = { kind: 'part', batch: pm.batch, id: o.id, wing: o.wing, livery: o.livery, paint1: o.paint1, paint2: o.paint2, metal: o.metal, burnt, src: o.dmg, n: o.dmg.log.length };
      const c = Math.cos(o.yaw), s = Math.sin(o.yaw), ox = pm.c[0] * c - pm.c[2] * s, oz = pm.c[0] * s + pm.c[2] * c, ol = Math.hypot(ox, oz) || 1;
      const kick = burnt ? 5 + Math.random() * 4 : 1.2 + Math.random() * 1.6;
      this.rubble.spawnPart({ x: o.x, y: o.y || 0, z: o.z, yaw: o.yaw, c: pm.c, h: pm.h, look, m: PART_KG[name] || 8, vx: o.vx, vz: o.vz, kx: ox / ol * kick, kz: oz / ol * kick, vy: burnt ? 5 + Math.random() * 5 : undefined });
      if (far < 140) au.play('clank', 0.8);
    }

    glassBurst(p, n, tint, o) {
      const vx = o ? o.vx || 0 : 0, vz = o ? o.vz || 0 : 0;
      for (let i = 0; i < n; i++) {
        const glint = i % 3 === 0;
        this.particles.push({ x: p[0] + (Math.random() - 0.5) * 0.6, y: p[1] + (Math.random() - 0.5) * 0.3, z: p[2] + (Math.random() - 0.5) * 0.6, vx: vx * 0.6 + (Math.random() - 0.5) * 4, vy: 0.5 + Math.random() * 3, vz: vz * 0.6 + (Math.random() - 0.5) * 4, life: 0, max: 0.6 + Math.random() * 0.7, size: glint ? 0.07 : 0.035 + Math.random() * 0.04, grow: 0, col: tint || (glint ? [0.9, 0.95, 1] : [0.7, 0.82, 0.88]), a: glint ? 0.9 : 0.85, tex: glint ? 'glow' : 'white', add: glint, grav: 10, solid: !glint });
      }
    }

    backfire() {
      const v = this.game.veh, ex = v.dmg && v.dmg.lay.rear ? -1 : 1;
      const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw), b = v.spec.len / 2 + 0.1;
      const x = v.x - fx * b, z = v.z - fz * b;
      for (let i = 0; i < 4; i++) this.particles.push({ x, y: v.y + 0.3, z, vx: v.vx * 0.5 - fx * 2 + (Math.random() - 0.5), vy: 0.4 + Math.random() * 0.4, vz: v.vz * 0.5 - fz * 2 + (Math.random() - 0.5), life: 0, max: 0.8 + Math.random() * 0.4, size: 0.3, grow: 1.4, col: [0.25, 0.24, 0.24], a: 0.45, tex: 'smoke' });
      this.particles.push({ x, y: v.y + 0.3, z, vx: v.vx * 0.5, vy: 0, vz: v.vz * 0.5, life: 0, max: 0.12, size: 0.35, grow: 2, col: [1, 0.55, 0.15], a: 1, tex: 'glow', add: true });
      void ex;
    }

    explode(e) {
      const o = e.owner, mine = o && o.player;
      if (!o) return;
      const x = o.x, y = (o.y || 0) + 0.9, z = o.z;
      this.audio.play('boom', F.clamp(1.1 - this.camDist(x, z) / 400, 0.2, 1));
      if (mine) { this.shake = 1; this.hud.flash = 1; }
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2, el = Math.random() * 1.2 - 0.2, sp = 2.5 + Math.random() * 6;
        this.particles.push({ x, y, z, vx: Math.cos(a) * Math.cos(el) * sp + (o.vx || 0) * 0.3, vy: Math.sin(el) * sp + 2, vz: Math.sin(a) * Math.cos(el) * sp + (o.vz || 0) * 0.3, life: 0, max: 0.45 + Math.random() * 0.55, size: 0.7 + Math.random() * 0.6, grow: 3.4, col: [1, 0.45 + Math.random() * 0.3, 0.12], a: 1, tex: 'glow', add: true });
      }
      for (let i = 0; i < 8; i++) this.particles.push({ x: x + (Math.random() - 0.5) * 1.2, y: y + Math.random() * 0.6, z: z + (Math.random() - 0.5) * 1.2, vx: (o.vx || 0) * 0.3, vy: 1 + Math.random(), vz: (o.vz || 0) * 0.3, life: 0, max: 0.3 + Math.random() * 0.25, size: 1.6 + Math.random(), grow: 4.5, col: [1, 0.82, 0.45], a: 1, tex: 'glow', add: true });
      for (let i = 0; i < 26; i++) this.particles.push({ x: x + (Math.random() - 0.5) * 2, y: y + Math.random(), z: z + (Math.random() - 0.5) * 2, vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 4, life: -0.25 - Math.random() * 0.3, max: 2.6 + Math.random() * 1.8, size: 1.2, grow: 3.2, col: [0.1, 0.09, 0.09], a: 0.75, tex: 'smoke' });
      this.sparks(x, y, z, 30);
      if (this.rubble) for (const b of this.rubble.list) {
        const dx = b.x - x, dz = b.z - z, d = Math.hypot(dx, dz);
        if (d > 9) continue;
        const k = (1 - d / 9) * 9 / Math.max(1, Math.sqrt(b.m / 10));
        b.v[0] += dx / (d || 1) * k; b.v[2] += dz / (d || 1) * k; b.v[1] += k * 0.8;
        b.sleep = false;
      }
    }

    updateRubble(dt) {
      const rb = this.rubble, g = this.game;
      if (!rb || !g) return;
      const v = g.veh, cars = [{ x: v.x, y: v.y, z: v.z, yaw: v.yaw, hl: v.spec.len / 2, hw: v.spec.wid / 2, hgt: v.spec.hgt, vx: v.vx, vz: v.vz, m: v.spec.mass }];
      if (rb.list.length) {
        const near = o => Math.abs(o.x - v.x) < 160 && Math.abs(o.z - v.z) < 160;
        if (g.race) for (const a of g.race.rivals) if (near(a)) { const q = a.velocity(); cars.push({ x: a.x, y: a.y, z: a.z, yaw: a.yaw, hl: a.hl, hw: a.hw, hgt: a.spec.hgt, vx: q[0], vz: q[1], m: a.mass }); }
        for (const c of g.traffic.cars) if (near(c)) cars.push({ x: c.x, y: c.y, z: c.z, yaw: c.yaw, hl: c.hl, hw: c.hw, hgt: 1.5, vx: c.state === 'hit' ? c.vx : c.tx * c.v, vz: c.state === 'hit' ? c.vz : c.tz * c.v, m: c.mass || 1200 });
      }
      const cam = this.lastCamPos ? { x: this.lastCamPos[0], z: this.lastCamPos[2] } : v;
      if (g.rewinding) for (const b of rb.list) if (b.look.src && b.look.src.log.length < b.look.n) b.sink = 2.1;
      rb.update(dt, cars, cam);
      for (const b of rb.list) rb.modelOf(b);
      this.thudT = (this.thudT || 0) - dt;
      for (const h of rb.hits) {
        const far = this.camDist(h.x, h.z);
        if (far > 90 || this.thudT > 0) continue;
        this.thudT = 0.07;
        this.audio.play('thud', { k: Math.min(1, h.k / 9) * F.clamp(1.1 - far / 90, 0.1, 1), mat: h.mat, big: (h.m || 0) > 40 });
        if (h.mat === 'water') this.splash(h.x, h.y, h.z);
      }
      this.freeRubble(rb.drain());
    }

    freeRubble(list) {
      const r = this.renderer;
      if (!r) return;
      for (const b of list) {
        if (b.look.kind === 'part') { r.free(b.look.gpu); b.look.gpu = null; continue; }
        for (const m of b.look.meshes) { r.free(m.gpu); m.gpu = null; }
      }
    }

    updateParticles(dt) {
      if (this.bolts) {
        for (const b of this.bolts) b.t += dt;
        this.bolts = this.bolts.filter(b => b.t < 1);
      }
      const ps = this.particles;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life += dt;
        if (p.life >= p.max) { ps.splice(i, 1); continue; }
        if (p.leaf) {
          p.vy = Math.max(p.vy - 5 * dt, -1.3);
          const fl = Math.sin(p.life * 6.5 + p.leaf) * 2.4 * dt;
          p.vx += fl * 0.8; p.vz += fl * 0.6;
          const k = Math.exp(-dt * 2.4);
          p.vx *= k; p.vz *= k;
          p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          continue;
        }
        p.vy -= (p.grav || 0) * dt;
        const drag = p.grav ? 0.99 : Math.exp(-dt * 1.5);
        p.vx *= drag; p.vz *= drag;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.size += p.grow * dt;
      }
    }

    snapshotMotion(g) {
      const out = [];
      const add = o => out.push([o, o.x, o.y, o.z, o.yaw]);
      if (g.race) for (const a of g.race.rivals) add(a);
      for (const t of g.traffic.cars) add(t);
      return out;
    }

    withMotionLerp(fn) {
      const list = this.motion, k = F.clamp(this.acc / TICK, 0, 1);
      if (!list || !list.length || k >= 1) return fn();
      const keep = [];
      for (const [o, x, y, z, yaw] of list) {
        if (Math.abs(o.x - x) + Math.abs(o.z - z) > 20) continue;
        keep.push([o, o.x, o.y, o.z, o.yaw]);
        o.x = F.lerp(x, o.x, k); o.y = F.lerp(y, o.y, k); o.z = F.lerp(z, o.z, k); o.yaw = yaw + F.wrap(o.yaw - yaw) * k;
      }
      try {
        return fn();
      } finally {
        for (const [o, x, y, z, yaw] of keep) { o.x = x; o.y = y; o.z = z; o.yaw = yaw; }
      }
    }

    renderPose() {
      const v = this.game.veh, pp = this.prevPose, k = F.clamp(this.acc / TICK, 0, 1);
      if (!pp) return { x: v.x, y: v.y, z: v.z, yaw: v.yaw };
      return { x: F.lerp(pp.x, v.x, k), y: F.lerp(pp.y, v.y, k), z: F.lerp(pp.z, v.z, k), yaw: pp.yaw + F.wrap(v.yaw - pp.yaw) * k };
    }

    camera(dt) {
      const g = this.game, v = g.veh;
      const { x, y, z, yaw } = this.pose = this.renderPose();
      const look = this.keys.back || this.pad.back;
      const mode = this.camMode;
      const sh = this.shake * 0.25 + (v.rough || 0) * 0.05 * F.clamp(v.speed / 30, 0, 1);
      const jit = () => (Math.random() - 0.5) * sh;
      const speedK = F.clamp((v.speed - 15) / 55, 0, 1);
      const lk = this.look;
      this.lookSettle(dt);
      let cam;
      if (mode === 'cockpit' || mode === 'hood') {
        const geo = F.Models.carGeo(v.spec.id, v.spec.wing);
        const M = M4.pose(x, y, z, yaw, v.pitch, v.roll);
        const inCab = mode === 'cockpit' && !look;
        let ex, ey, ez;
        if (mode === 'cockpit') { [ex, ey, ez] = geo.eye; ex += F.clamp(-v.ayL * 0.004, -0.05, 0.05); }
        else { ex = 0; ey = v.spec.car.sh.hood + 0.42; ez = geo.Z(v.spec.car.sh.ws) - 0.25; }
        if (inCab) {
          const hd = this.headOffset(lk.yaw, lk.pitch);
          ex += hd[0]; ey += hd[1]; ez += hd[2];
        }
        const e = M4.apply(M, ex, ey + jit() * 0.3, ez);
        const lean = F.clamp(v.r * 0.18, -0.25, 0.25) * (1 - F.clamp(Math.abs(lk.yaw) / 0.5, 0, 1));
        const turn = look ? Math.PI + lean : lk.yaw + lean;
        const tilt = (look ? 0 : lk.pitch) + (inCab ? -0.035 : -0.008), flat = Math.cos(tilt) * 10;
        const t = M4.apply(M, ex + Math.sin(turn) * flat, ey + Math.sin(tilt) * 10, ez - Math.cos(turn) * flat);
        cam = { x: e[0], y: e[1], z: e[2], tx: t[0], ty: t[1], tz: t[2], fov: (inCab ? 60 : 68) + speedK * 8, near: 0.05, far: 4000, inside: true };
        this.camPos = null;
      } else {
        const far = mode === 'far';
        const velYaw = v.speed > 3 ? Math.atan2(v.vx, -v.vz) : yaw;
        const blend = F.clamp((v.speed - 3) / 12, 0, 1) * 0.5 * (v.u >= 0 ? 1 : 0);
        const target = yaw + F.wrap(velYaw - yaw) * blend + (look ? Math.PI : 0);
        if (this.camPos === null || look !== this.lastLook) this.camYaw = this.camYawTo = target;
        this.lastLook = look;
        this.camYaw = F.followAngle(this.camYaw, this.camYawTo, target, 3.2 + Math.abs(v.r) * 1.5, dt);
        this.camYawTo = target;
        const L = v.spec.len, zoom = this.camZoom, aim = 0.6 + v.spec.hgt * 0.3;
        const dist = ((far ? 7.6 : 4.6) + L * 0.45 + speedK * 1.2) * zoom;
        const hgt = aim + ((far ? 3.3 : 2.0) + v.spec.hgt * 0.5 - aim) * zoom;
        const fx = Math.sin(this.camYaw), fz = -Math.cos(this.camYaw);
        let cx = x - fx * dist, cz = z - fz * dist, cy = y + hgt;
        const hit = this.camRay(x, y + 1.2, z, cx, cy, cz);
        if (hit < 1) { cx = F.lerp(x, cx, hit); cz = F.lerp(z, cz, hit); cy = F.lerp(y + 1.2, cy, hit) + (1 - hit) * 1.5; }
        const gy = this.world.groundY(cx, cz);
        if (cy < gy + 0.6) cy = gy + 0.6;
        if (this.camPos) {
          const to = this.camTo;
          this.camPos[0] = F.follow(this.camPos[0], to[0], cx, 12, dt); this.camPos[1] = F.follow(this.camPos[1], to[1], cy, 6, dt); this.camPos[2] = F.follow(this.camPos[2], to[2], cz, 12, dt);
        } else { this.camPos = [cx - v.vx / 12, cy - v.vy / 6, cz - v.vz / 12]; this.camHit = 1; }
        this.camTo = [cx, cy, cz];
        const oy = look ? 0 : lk.yaw, op = look ? 0 : lk.pitch;
        let pos = this.camPos, lx = fx, lz = fz, lead = 3.2;
        if (oy || op) {
          const o = this.orbitOffset(pos[0] - x, pos[1] - y - aim, pos[2] - z, oy, op);
          let ox = x + o[0], oyw = y + aim + o[1], oz = z + o[2];
          const hit = this.camRay(x, y + 1.2, z, ox, oyw, oz);
          this.camHit = F.lerp(this.camHit, hit, Math.min(1, dt * (hit < this.camHit ? 20 : 5)));
          const h = this.camHit;
          if (h < 1) { ox = F.lerp(x, ox, h); oz = F.lerp(z, oz, h); oyw = F.lerp(y + 1.2, oyw, h) + (1 - h) * 1.5; }
          oyw = Math.max(oyw, this.world.groundY(ox, oz) + 0.6);
          pos = [ox, oyw, oz];
          const c = Math.cos(oy), s = Math.sin(oy);
          lx = fx * c - fz * s; lz = fz * c + fx * s;
          lead *= 1 - F.clamp(-op, 0, 1) * 0.8;
        } else this.camHit = 1;
        cam = { x: pos[0] + jit(), y: pos[1] + jit(), z: pos[2] + jit(), tx: x + lx * lead, ty: y + aim, tz: z + lz * lead, fov: 62 + speedK * 12, near: 0.3, far: 4000 };
      }
      return cam;
    }

    headOffset(yaw, pitch) {
      const up = 0.09, ahead = 0.085, cp = Math.cos(pitch), sp = Math.sin(pitch);
      const y1 = up * cp + ahead * sp, z1 = up * sp - ahead * cp;
      const turn = F.smooth(1, 2.3, Math.abs(yaw)), side = Math.sign(yaw) * turn;
      return [-z1 * Math.sin(yaw) + side * 0.07, y1 - up + turn * 0.025, z1 * Math.cos(yaw) + ahead - turn * 0.04 - Math.max(0, -pitch) * 0.05];
    }

    orbitOffset(ox, oy, oz, yaw, pitch) {
      const c = Math.cos(yaw), s = Math.sin(yaw);
      const rx = ox * c - oz * s, rz = oz * c + ox * s, hor = Math.hypot(rx, rz);
      if (!pitch || hor < 1e-6) return [rx, oy, rz];
      const r = Math.hypot(hor, oy), el = F.clamp(Math.atan2(oy, hor) - pitch, -0.12, 1.35), k = r * Math.cos(el) / hor;
      return [rx * k, r * Math.sin(el), rz * k];
    }

    canLook() { return this.mode === 'play' && !!this.game && !this.menuOpen && !this.photo && this.settings().mlook !== 'off'; }

    lookDown(e) {
      if (!this.canLook() || this.look.drag !== null || (e.button !== 0 && e.button !== 2)) return;
      this.look.drag = e.pointerId;
      try { this.view.setPointerCapture(e.pointerId); } catch (err) { }
      this.el.classList.add('fz-looking');
    }

    lookMove(e) {
      if (this.look.drag === null || e.pointerId !== this.look.drag) return;
      if (!this.canLook()) { this.lookUp(); return; }
      const s = this.settings(), k = LOOK_RAD * (s.msens || 1);
      this.lookTurn(e.movementX * k, -e.movementY * k * (s.minv ? -1 : 1));
    }

    lookUp(e) {
      const id = this.look.drag;
      if (id === null || (e && e.pointerId !== id)) return;
      this.look.drag = null;
      this.look.idle = 0;
      if (this.view.hasPointerCapture && this.view.hasPointerCapture(id)) this.view.releasePointerCapture(id);
      this.el.classList.remove('fz-looking');
    }

    lookTurn(dYaw, dPitch) {
      const lk = this.look, lim = LOOK_LIMITS[this.camMode] || LOOK_LIMITS.chase;
      lk.yaw = lim.yaw ? F.clamp(lk.yaw + dYaw, -lim.yaw, lim.yaw) : F.wrap(lk.yaw + dYaw);
      lk.pitch = F.clamp(lk.pitch + dPitch, lim.down, lim.up);
      lk.vy = lk.vp = 0;
      lk.idle = 0;
    }

    lookReset() {
      const lk = this.look;
      lk.yaw = lk.pitch = lk.vy = lk.vp = lk.idle = 0;
    }

    lookSettle(dt) {
      const lk = this.look, back = LOOK_RETURN[this.settings().mret || 'fast'];
      if (lk.drag !== null || !back || (!lk.yaw && !lk.pitch)) { lk.idle = 0; return; }
      lk.idle += dt;
      if (lk.idle < back.delay) return;
      lk.yaw = F.wrap(lk.yaw);
      const w = back.w;
      for (let left = Math.min(dt, 0.25); left > 1e-6; left -= 1 / 60) {
        const h = Math.min(left, 1 / 60);
        lk.vy += (-w * w * lk.yaw - 2 * w * lk.vy) * h; lk.yaw += lk.vy * h;
        lk.vp += (-w * w * lk.pitch - 2 * w * lk.vp) * h; lk.pitch += lk.vp * h;
      }
      if (Math.abs(lk.yaw) + Math.abs(lk.pitch) < 2e-4 && Math.abs(lk.vy) + Math.abs(lk.vp) < 2e-3) this.lookReset();
    }

    lookZoom(e) {
      if (!this.canLook() || this.camMode === 'cockpit' || this.camMode === 'hood') return;
      e.preventDefault();
      this.camZoom = F.clamp(this.camZoom * (e.deltaY < 0 ? 1 / 1.1 : 1.1), ZOOM[0], ZOOM[1]);
    }

    cabinDriverPart() {
      if (this.camMode !== 'cockpit') return 'all';
      return this.keys.back || this.pad.back || Math.abs(this.look.yaw) > LOOK_HIDE_DRIVER ? null : 'body';
    }

    camRay(x0, y0, z0, x1, y1, z1) {
      const cols = this.world.colliders(Math.min(x0, x1) - 2, Math.min(z0, z1) - 2, Math.max(x0, x1) + 2, Math.max(z0, z1) + 2);
      let tMin = 1;
      for (const c of cols) {
        if (c.k !== 'box' && c.k !== 'poly') continue;
        if (c.y1 < Math.min(y0, y1)) continue;
        for (let k = 1; k <= 8; k++) {
          const t = k / 8;
          const px = F.lerp(x0, x1, t), pz = F.lerp(z0, z1, t);
          const dx = px - c.x, dz = pz - c.z;
          const inside = c.k === 'poly' ? F.inPoly(px, pz, c.pts) : Math.abs(dx * c.c + dz * c.s) < c.hx + 0.3 && Math.abs(-dx * c.s + dz * c.c) < c.hz + 0.3;
          if (inside) { tMin = Math.min(tMin, (k - 1) / 8); break; }
        }
      }
      return Math.max(0.15, tMin);
    }

    internalSize() {
      if (this.photo && this.photo.cap) return this.photo.cap;
      const W = this.el.clientWidth || 640, H = this.el.clientHeight || 480;
      const s = this.settings();
      const res = s.res || Math.round(H * Math.min(1.5, globalThis.devicePixelRatio || 1));
      const h = Math.min(res, Math.round(H * 2));
      return [Math.max(64, Math.round(h * W / H)), Math.max(48, h), W, H];
    }

    render(dt) {
      const r = this.renderer;
      if (!r || this.mode === 'loading') return;
      if (this.photo && !this.photo.busy) { this.photo.render(); return; }
      const [w, hh, cssW, cssH] = this.internalSize();
      r.resize(w, hh);
      this.hud.resize(cssW, cssH, Math.min(2, globalThis.devicePixelRatio || 1));
      const gl = r.gl;
      r.stats.draws = 0; r.stats.tris = 0;
      this.mirrorRect = null;
      if (this.showroom) {
        r.beginFrame(w, hh);
        this.renderShowroom(w, hh, dt);
        r.endFrame(this.postFx(F.studioEnv(), 0));
        this.hud.draw(this);
        return;
      }
      const g = this.game || this.titleGame;
      if (!g) return;
      const env = this.photo ? this.photo.env() : skyEnv(g.clock, g.wx || g.weather, this.settings().draw, g.wetK);
      env.time = this.photo ? this.photo.time : performance.now() / 1000;
      const dr = this.cloudDrift || (this.cloudDrift = [0, 0]), wk = Math.min(dt, 0.1) * (0.0022 + 0.009 * env.wind);
      dr[0] = (dr[0] + wk * 0.92) % 10; dr[1] = (dr[1] + wk * 0.39) % 10;
      env.drift = dr;
      this.lastEnv = env;
      if (this.pushes) {
        const P = this.pushes;
        for (const q of P) q.t += Math.min(dt, 0.1);
        while (P.length && P[P.length - 1].t > 2.2) P.pop();
        r.setPush(P.map(q => [q.x, q.z, q.r, q.amp * Math.exp(-q.t * 2.2)]));
      }
      this.frameDt = Math.min(dt, 0.1);
      this.popupK = F.approach(this.popupK || 0, g.lightsOn || this.autoLights() ? 1 : 0, Math.min(dt, 0.1) * 2.2);
      this.wipeT = env.rain > 0.05 ? Math.max(0, this.wipeT || 0) + Math.min(dt, 0.1) * (0.8 + env.rain * 0.5) : -1;
      let cam;
      if (this.mode === 'title' || !this.game) cam = this.titleCam(g);
      else if (this.photo) cam = this.photo.camera();
      else cam = this.camera(dt);
      const C = r.camera(cam, w, hh);
      this.lastCam = C;
      this.lastCamPos = [cam.x, cam.y, cam.z];
      const lights = this.localLights(g, env, cam);
      r.setLights(lights.spots, lights.lamps);
      r.shadowPass(env, this.shadowFocus(g, cam), this.shadowCars(g, cam), this.rubble && this.rubble.list.length ? (c, reach) => r.drawDebris(this.rubble.list.filter(b => Math.abs(b.x - c.x) < reach && Math.abs(b.z - c.z) < reach), null, true) : null);
      if (this.game && cam.inside && this.camMode === 'cockpit') r.cabinShadow(this.carState(g), env);
      else r.cabinOn = false;
      r.beginFrame(w, hh);
      gl.clearColor(env.fogCol[0], env.fogCol[1], env.fogCol[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      r.drawSky(env, C);
      r.setWorldUniforms(env, cam, C);
      r.drawWorld(env, cam, C, { budget: this.photo ? this.photo.uploads() : this.mode === 'title' ? 6 : 3 });
      this.drawDynamic(g, env, cam, C, false);
      if (cam.inside && this.game) {
        const car = this.carState(g);
        car.driverPart = this.cabinDriverPart();
        this.updateCluster(dt);
        r.setWorldUniforms(env, cam, C);
        r.drawCockpit(car, cam, C, env, this.cluster, this.camMode === 'cockpit' ? { rain: Math.min(1, env.rain * 1.2), wipe: car.wipe } : null);
      }
      if (this.game && cam.inside && this.settings().mirror && this.camMode === 'cockpit') this.renderMirror(g, env, w, hh, cam.fov);
      this.sunScreen = this.sunOnScreen(env, C, cam, dt);
      r.endFrame(this.postFx(env, this.game ? g.veh.speed : 0));
      if (this.photo) this.photo.clearHud(); else this.hud.draw(this);
      if (this.game && env.sunUp && !cam.inside && (!this.photo || this.photo.flare())) this.lensFlare(env, C, cam);
    }

    sunOnScreen(env, C, cam, dt) {
      const sd = env.sunDir, s = M4.apply(C.vp, cam.x + sd[0] * 1000, cam.y + sd[1] * 1000, cam.z + sd[2] * 1000);
      if (s[3] <= 0) { this.sunVis = 0; return null; }
      const u = s[0] * 0.5 + 0.5, v = s[1] * 0.5 + 0.5;
      this.sunCheck = (this.sunCheck || 0) - 1;
      if (this.sunCheck <= 0 || this.sunVisT === undefined) { this.sunCheck = 3; this.sunVisT = this.sunClear(cam, sd); }
      this.sunVis = F.approach(this.sunVis || 0, this.sunVisT, Math.min(dt, 0.1) * 5);
      return [u, v];
    }

    sunClear(cam, sd) {
      const h = Math.hypot(sd[0], sd[2]) || 1, w = this.world;
      let vis = 1;
      for (let t = 4; t < 320; t += 5) {
        const x = cam.x + sd[0] / h * t, z = cam.z + sd[2] / h * t, y = cam.y + sd[1] / h * t;
        if (y > 260) break;
        for (const c of w.colliders(x - 1, z - 1, x + 1, z + 1)) {
          if (y < c.y0 || y > c.y1 + (c.k === 'poly' ? 6 : 0)) continue;
          let inside = false;
          if (c.k === 'poly') inside = F.inPoly(x, z, c.pts);
          else if (c.k === 'box') { const dx = x - c.x, dz = z - c.z; inside = Math.abs(dx * c.c + dz * c.s) < c.hx && Math.abs(-dx * c.s + dz * c.c) < c.hz; }
          const tree = c.k === 'circ' && c.src && F.TREE[c.src.kind];
          if (c.k === 'circ') inside = Math.hypot(x - c.x, z - c.z) < (tree ? 2.6 : c.r);
          if (!inside) continue;
          if (tree) vis *= 0.55;
          else return 0;
        }
        if (vis < 0.1) return 0;
      }
      return vis;
    }

    updateCluster(dt) {
      const g = this.game, v = g.veh, sp = v.spec, units = g.settings.units;
      let cl = this.cluster;
      if (!cl || cl.spec !== sp || cl.units !== units) {
        const fc = F.Cluster.face(sp.car, sp, units);
        const layout = F.Cluster.layoutOf(sp.car, sp);
        cl = this.cluster = {
          spec: sp, units, faceKey: fc.key, face: fc.cv, layout, pal: F.Cluster.paletteOf(sp.car),
          scales: layout.dials.map(d => F.Cluster.scaleOf(d.k, sp, units)),
          needles: layout.dials.map(d => ({ a: d.a0, w: 0 })),
          lcd: cl ? cl.lcd : F.Tex.canvas(256, 96), text: '', dirty: true, heat: cl ? cl.heat : 0.15, boost: 0
        };
      }
      const k = Math.min(dt, 0.05);
      cl.heat = F.approach(cl.heat, v.rpm > 300 ? 0.5 + 0.12 * v.rpm / sp.red : 0.2, k * 0.02);
      const sweep = this.clusterSweep > 0 ? Math.sin(Math.PI * F.clamp(1 - this.clusterSweep / 1.4, 0, 1)) : -1;
      this.clusterSweep = Math.max(0, (this.clusterSweep || 0) - k);
      const thr = this.lastThrottle || 0;
      cl.boost = F.approach(cl.boost, thr > 0.3 ? F.clamp((v.rpm - 2200) / 2600, 0, 1) * 1.1 * thr : -0.55, k * 2.5);
      const speed = v.speed * (units === 'mph' ? 2.237 : 3.6);
      const val = (d, sc) => {
        if (sweep >= 0) return sc.min + (sc.max - sc.min) * sweep;
        switch (d.k) {
          case 'speed': return speed;
          case 'rpm': return (v.rpm + (v.limiter ? (Math.random() - 0.5) * 320 : 0)) / 1000;
          case 'boost': return cl.boost;
          case 'temp': return cl.heat;
          case 'oil': return F.clamp(0.25 + 0.6 * v.rpm / sp.red, 0, 1);
          default: return 0.72;
        }
      };
      cl.layout.dials.forEach((d, i) => {
        const n = cl.needles[i], target = F.Cluster.angleOf(d, val(d, cl.scales[i]), cl.scales[i]);
        n.w += ((target - n.a) * 110 - n.w * 15) * k;
        n.a += n.w * k;
      });
      const on = {
        beam: g.lightsOn || this.autoLights(), hand: v.hand, abs: v.wheels.some(w => w.absK < 0.95), tcs: v.tcsK < 0.95 || v.stmK < 0.95,
        oil: v.rpm < 300 || sweep >= 0, bat: v.rpm < 300 || sweep >= 0, choke: cl.heat < 0.3, shift: v.rpm > sp.red * 0.93
      };
      const lamps = cl.layout.lamps.map(l => !!on[l.k]);
      const st = F.STATIONS[(this.settings().radio || 0) - 1];
      const two = n => String(n).padStart(2, '0');
      const s = {
        odo: (g.entry.odo || 0) / 1000, clock: two(Math.floor(g.clock) % 24) + ':' + two(Math.floor(g.clock % 1 * 60)),
        gear: v.gear < 0 ? 'R' : v.gear === 0 ? 'N' : String(v.gear), speed: String(Math.round(speed)),
        radio: st ? st.name.replace(/^(Horizon|Radio)\s+/, '').toUpperCase() : 'ВЫКЛ', lamps
      };
      const text = cl.layout.lcd.map(l => (l.k === 'odo' ? Math.floor(s.odo * 10) : s[l.k])).concat([s.radio, lamps.join()]).join('|');
      if (text !== cl.text) {
        cl.text = text;
        F.Cluster.lcd(cl.lcd, cl.pal, cl.layout, s);
        cl.dirty = true;
      }
    }

    postFx(env, speed) {
      const night = env.night || 0, day = 1 - night, rain = env.rain || 0, storm = env.storm || 0;
      const golden = F.clamp(1 - Math.abs(env.sunDir[1] - 0.12) / 0.2, 0, 1) * day;
      const moving = this.mode === 'play' && !this.menuOpen && !this.showroom;
      const sun = env.studio ? null : this.sunScreen;
      let rays = 0;
      if (sun && env.sunUp) {
        const off = Math.max(Math.abs(sun[0] - 0.5), Math.abs(sun[1] - 0.5));
        const low = 0.15 + 0.9 * F.clamp(1 - env.sunEl / 0.5, 0, 1);
        rays = low * (1 - F.smooth(0.6, 1.25, off)) * F.clamp(1.15 - env.cover * 1.1, 0, 1) * day * (1 - rain);
      }
      const fx = {
        thr: F.lerp(0.8, 0.5, night),
        bloom: F.lerp(0.3, 0.75, night) * (1 - rain * 0.3) + (env.flash || 0) * 0.25,
        blur: moving ? F.clamp((speed - 30) / 40, 0, 1) * (this.camMode === 'cockpit' ? 0.5 : 0.85) : 0,
        sat: 1.12 - rain * 0.2 - storm * 0.08 - night * 0.05,
        contrast: 1.07 + storm * 0.05,
        tint: [F.lerp(1.02 + golden * 0.05, 0.94, night) - storm * 0.04, 1 + golden * 0.01 - night * 0.02, F.lerp(0.97 - golden * 0.07, 1.06, night) + storm * 0.03],
        vig: 0.3 + storm * 0.1,
        expo: 1.02 + (env.flash || 0) * 0.18,
        rays, sun, rayCol: env.sunCol.map((v, i) => Math.min(1.2, v * (1 + golden * 0.3) * [1, 0.94, 0.8][i]))
      };
      return this.photo && !this.showroom ? this.photo.post(fx, env) : fx;
    }

    shadowFocus(g, cam) {
      const p = this.game ? (this.pose || g.veh) : g.veh;
      let dx = cam.tx - cam.x, dz = cam.tz - cam.z;
      const l = Math.hypot(dx, dz) || 1;
      dx /= l; dz /= l;
      return { x: cam.x + dx * 55, y: p.y, z: cam.z + dz * 55, eye: [cam.x, cam.y, cam.z], lodK: cam.lodK || 1 };
    }

    shadowCars(g, cam) {
      const out = this.carShown() ? [this.carState(g)] : [];
      const near = (x, z) => Math.abs(x - cam.x) < 140 && Math.abs(z - cam.z) < 140;
      if (g.race) for (const a of g.race.rivals) if (near(a.x, a.z)) out.push({ id: a.id, livery: a.livery, wing: a.spec.wing, x: a.x, y: a.y, z: a.z, yaw: a.yaw, pitch: a.pitch || 0, roll: a.roll || 0, steer: a.steer || 0, spin: -a.wheel, dmg: a.dmg });
      for (const t of g.traffic.cars) if (near(t.x, t.z)) out.push({ id: t.id, x: t.x, y: t.y, z: t.z, yaw: t.yaw, pitch: t.pitch, roll: t.roll, steer: t.steer, spin: -t.wheel, dmg: t.dmg });
      const by = this.scene && this.scene.parkedBy;
      if (by) for (const [ch, list] of by) {
        if (Math.abs((ch.x0 + ch.x1) / 2 - cam.x) > 330 || Math.abs((ch.z0 + ch.z1) / 2 - cam.z) > 330) continue;
        for (const p of list) {
          const d = Math.hypot(p.x - cam.x, p.z - cam.z);
          if (d < 70) out.push({ id: p.id, x: p.x, y: p.y + 0.04, z: p.z, yaw: p.yaw, steer: 0, spin: 0, far: d > 45, dmg: p.dmg });
        }
      }
      return out;
    }

    localLights(g, env, cam) {
      const spots = [];
      if (env.night < 0.05 || this.settings().gfx === 'retro') return { spots, lamps: [] };
      const add = (x, y, z, yaw, len, k, dmg) => {
        const fx = Math.sin(yaw), fz = -Math.cos(yaw), rx = -fz, rz = fx, st = dmg && dmg.log.length ? dmg.st : null;
        for (const s of [-0.55, 0.55]) {
          if (st && st[s < 0 ? F.DMG.PART.headL : F.DMG.PART.headR] === 2) continue;
          spots.push({ x: x + fx * len * 0.5 + rx * s, y: y + 0.62, z: z + fz * len * 0.5 + rz * s, dx: fx * 0.993, dy: -0.12, dz: fz * 0.993, k });
        }
      };
      const v = g.veh, p = this.game ? (this.pose || v) : v;
      if (!(v.dmg && v.dmg.burnt) && (this.photo ? this.carShown() && this.carState(g).lights > 0 : g.lightsOn || this.autoLights())) add(p.x, p.y, p.z, p.yaw, v.spec.len, 1.6, v.dmg);
      if (env.night > 0.45) {
        let best = null, bd = 90;
        const check = o => { const d = Math.hypot(o.x - cam.x, o.z - cam.z); if (d < bd) { bd = d; best = o; } };
        if (g.race) g.race.rivals.forEach(check);
        g.traffic.cars.forEach(check);
        if (best) add(best.x, best.y, best.z, best.yaw, 4.4, 1.2);
      }
      this.lampT = (this.lampT || 0) - 1;
      if (this.lampT <= 0 || !this.lampCache) {
        this.lampT = 10;
        const found = [];
        for (const lp of this.lampProps()) {
          if (lp.type === 'tlight' || Math.abs(lp.x - cam.x) > 160 || Math.abs(lp.z - cam.z) > 160) continue;
          if (lp.col_ && lp.col_.broken) continue;
          const lg = LAMP_GLOW[lp.type], fx = Math.sin(lp.yaw), fz = -Math.cos(lp.yaw);
          const x = lp.x + fx * lg.f, z = lp.z + fz * lg.f;
          found.push({ x, y: lp.y + lg.h, z, r: lg.r, d: Math.hypot(x - cam.x, z - cam.z) });
        }
        for (const l of this.scene.airLights || []) {
          if (l.kind !== 'mast' || Math.abs(l.x - cam.x) > 200 || Math.abs(l.z - cam.z) > 200) continue;
          found.push({ x: l.x, y: (l.y || 0) + 10, z: l.z, r: 38, d: Math.hypot(l.x - cam.x, l.z - cam.z) - 30 });
        }
        found.sort((a, b) => a.d - b.d);
        this.lampCache = found.slice(0, 8);
      }
      const d = v.dmg;
      if (d && (d.burning || (d.burnt && g.wreckT > 0)) && this.game) {
        const e = d.lay.engine, fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw), flick = 0.8 + 0.2 * Math.sin(env.time * 23) * Math.sin(env.time * 7.3);
        const fire = { x: p.x + fx * -e[2] + -fz * e[0], y: p.y + e[1] + 0.6, z: p.z + fz * -e[2] + fx * e[0], r: 13 * flick, d: 0 };
        return { spots, lamps: [fire].concat(this.lampCache.slice(0, 7)) };
      }
      return { spots, lamps: this.lampCache };
    }

    carState(g) {
      const v = g.veh, p = this.pose || v;
      const lights = (g.lightsOn || this.autoLights()) ? 1 : 0;
      const dmg = v.dmg, burnt = !!(dmg && dmg.burnt);
      const st = { driver: burnt ? null : this.driverOf(g), id: v.spec.id, livery: g.entry.livery, wing: v.spec.wing, x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: v.pitch, roll: v.roll, paint1: burnt ? CHAR : g.paint1, paint2: burnt ? CHAR : g.paint2, steer: v.delta, spin: -v.wheelRot, spins: v.spins, rates: v.wheels.map(wl => wl.w), susp: v.susp, brake: burnt ? 0 : v.braking, reverse: !burnt && v.gear < 0, wipe: this.wipeT === undefined || burnt ? -1 : this.wipeT, lights: burnt ? 0 : lights, popup: this.popupK, metal: !burnt && !!g.entry.metal, dirt: burnt ? 0.9 : g.entry.dirt || 0, tires: v.spec.up.tires | 0, brakes: v.spec.up.brakes | 0, dmg };
      return this.photo ? this.photo.carState(st) : st;
    }

    honk() {
      if (this.game && this.mode === 'play' && !this.menuOpen) F.Driver.cue(this.driverOf(this.game), 'horn');
    }

    driverEvent(e) {
      const g = this.game;
      if (!g || this.mode !== 'play') return;
      const D = F.Driver, inst = this.driverOf(g), v = g.veh;
      const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw), rx = Math.cos(v.yaw), rz = Math.sin(v.yaw);
      switch (e.t) {
        case 'shift': if (!this.settings().auto) D.cue(inst, 'shift'); break;
        case 'land': D.cue(inst, 'land', { power: e.impact }); break;
        case 'hit': case 'carhit': {
          const sp = Math.hypot(v.vx, v.vz) || 1, f = (v.vx * fx + v.vz * fz) / sp, r = (v.vx * rx + v.vz * rz) / sp;
          D.cue(inst, 'hit', { power: e.impact, dx: sp > 1 ? r : 0, dz: sp > 1 ? f : 1 });
          break;
        }
        case 'skill': {
          if (e.kind !== 'near') break;
          let best = null, bd = 20;
          for (const t of g.traffic.cars) { const d = Math.hypot(t.x - v.x, t.z - v.z); if (d < bd) { bd = d; best = t; } }
          if (best) D.cue(inst, 'near', { side: (best.x - v.x) * rx + (best.z - v.z) * rz });
          break;
        }
        case 'finish': if (e.pos === 1) D.cue(inst, 'win'); break;
      }
    }

    updateDrivers(dt) {
      const g = this.game, v = g.veh, D = F.Driver, cam = this.lastCamPos;
      D.animate(this.driverOf(g), dt, { steer: v.delta, speed: v.speed, latG: v.ayL || 0, lonG: v.axL || 0, yawRate: v.r || 0, heave: v.vy || 0, back: !!(this.keys.back || this.pad.back) && this.camMode !== 'cockpit' });
      const simple = (o, steer, speed) => {
        if (!o.drv || (cam && Math.hypot(o.x - cam[0], o.z - cam[2]) > 45)) return;
        const yr = speed * Math.tan(steer) / 2.6;
        D.animate(o.drv, dt, { steer, speed, yawRate: yr, latG: speed * yr, simple: true });
      };
      if (g.race) for (const a of g.race.rivals) simple(a, a.steer || 0, a.v || 0);
      for (const t of g.traffic.cars) simple(t, t.steer || 0, t.v || 0);
    }

    driverOf(g) {
      const look = F.Driver.playerLook(g.profile), key = JSON.stringify(look);
      if (!this.pDriver || this.pDriverKey !== key) { this.pDriver = F.Driver.make(look); this.pDriverKey = key; }
      return this.pDriver;
    }

    autoLights() {
      const g = this.game || this.titleGame;
      return this.envNight() > 0.45 || !!(g && g.wx && g.wx.mist > 0.5);
    }

    lampProps() {
      if (this.lampsOf !== this.world) { this.lampsOf = this.world; this.lampList = this.world.props.filter(p => LAMP_GLOW[p.type]); }
      return this.lampList;
    }

    envNight() {
      const g = this.game || this.titleGame;
      if (!g) return 0;
      const clock = this.photo ? this.photo.o.clock : g.clock;
      return 1 - F.smooth(-0.12, 0.22, Math.sin((clock - 6.2) / 12.6 * Math.PI));
    }

    drawDynamic(g, env, cam, C, mirror) {
      const r = this.renderer, gl = r.gl;
      const night = env.night;
      const lightsOn = night > 0.45 || (env.mist || 0) > 0.5 ? 1 : 0;
      r.setWorldUniforms(env, cam, C);
      const pc = this.carState(g);
      pc.inside = !!cam.inside;
      if (this.carShown()) r.drawCar(pc, env);
      if (g.race) {
        for (const a of g.race.rivals) {
          const d = Math.hypot(a.x - cam.x, a.z - cam.z);
          if (d > 700) continue;
          r.drawCar({ driver: a.drv || (a.drv = F.Driver.make(F.Driver.rivalLook(a.name))), id: a.id, livery: a.livery, wing: a.spec.wing, x: a.x, y: a.y, z: a.z, yaw: a.yaw, pitch: a.pitch || 0, roll: a.roll || 0, paint1: a.paint1, paint2: a.paint2, metal: a.metal, dirt: a.dirt, wipe: env.rain > 0.05 ? env.time + a.name.length * 0.29 : -1, steer: a.steer || 0, spin: -a.wheel, speed: a.v, tires: a.spec.up.tires | 0, brakes: a.spec.up.brakes | 0, brake: a.brakeLight, lights: lightsOn, dmg: a.dmg }, env);
        }
        const sp = g.race.special;
        if (sp && sp.kind === 'train') this.drawTrain(sp, env);
        if (sp && sp.kind === 'plane') this.drawPlane(sp);
      }
      for (const t of g.traffic.cars) {
        const d = Math.hypot(t.x - cam.x, t.z - cam.z);
        if (d > 600) continue;
        if (t.drvUid !== t.uid) { t.drv = F.Driver.make(F.Driver.trafficLook(t.uid, t.id)); t.drvUid = t.uid; }
        r.drawCar({ driver: t.drv, id: t.id, x: t.x, y: t.y, z: t.z, yaw: t.yaw, pitch: t.pitch, roll: t.roll, paint1: t.paint1, metal: t.uid % 10 < 3, dirt: (t.uid * 7 % 10) * 0.035, wipe: env.rain > 0.05 ? env.time + t.uid * 0.37 : -1, steer: t.steer, spin: -t.wheel, speed: t.v, brake: t.brake, lights: lightsOn, dmg: t.dmg }, env);
      }
      if (this.rubble && this.rubble.list.length && !mirror) r.drawDebris(this.rubble.list, C);
      this.drawFestival(g, env, cam);
      this.drawParked(env, cam, C);
      this.drawAirport(env, cam);
      this.drawMarket(env, cam, C);
      this.drawHorizon(g, env, cam, C);
      r.flushGlass();
      r.beginSprites();
      this.spritesFor(g, env, cam, C, mirror);
      if (!mirror) this.festSprites(env, cam, C);
      r.flushSprites(env, cam, C);
      if (!mirror) this.drawBolts(env, cam, C);
    }

    drawParked(env, cam, C) {
      const r = this.renderer, by = this.scene && this.scene.parkedBy;
      if (!by) return;
      for (const [ch, list] of by) {
        if (Math.abs((ch.x0 + ch.x1) / 2 - cam.x) > 330 || Math.abs((ch.z0 + ch.z1) / 2 - cam.z) > 330) continue;
        for (const p of list) {
          const d = Math.hypot(p.x - cam.x, p.z - cam.z);
          if (d > 190 || !M4.boxVisible(C.planes, p.x - 2.6, p.y - 0.5, p.z - 2.6, p.x + 2.6, p.y + 2.2, p.z + 2.6)) continue;
          r.drawCar({ id: p.id, x: p.x, y: p.y + 0.04, z: p.z, yaw: p.yaw, paint1: p.rgb || (p.rgb = F.hexRgb(p.col)), steer: 0, spin: 0, far: d > 45, dmg: p.dmg }, env);
        }
      }
    }

    drawAirport(env, cam) {
      const R = this.scene && this.scene.radar;
      if (!R || Math.abs(R.x - cam.x) > 1400 || Math.abs(R.z - cam.z) > 1400) return;
      const r = this.renderer;
      if (!this.radarMesh || this.radarOf !== r) { this.radarMesh = r.upload(F.Airport.radarDish()); this.radarOf = r; }
      r.drawDyn(this.radarMesh, R.x, this.world.terrainH(R.x, R.z) + 12.65, R.z, (env.time || 0) * 1.3, 0, 0, 'white', true);
    }

    drawMarket(env, cam, C) {
      const trg = this.world.trg, r = this.renderer;
      if (!trg || Math.abs(trg.L(0, 0)[0] - cam.x) > 520 || Math.abs(trg.L(0, 0)[1] - cam.z) > 520) return;
      if (!this.marketFolk || this.marketOf !== r) { this.marketFolk = F.Market.people(this.world).map(g => Object.assign(g, { mesh: r.upload(g.batch) })); this.marketOf = r; }
      const t = env.time || 0;
      for (const g of this.marketFolk) {
        if (Math.hypot(g.x - cam.x, g.z - cam.z) > 260 || !M4.boxVisible(C.planes, g.x - 50, g.y - 1, g.z - 50, g.x + 50, g.y + 4, g.z + 50)) continue;
        r.drawDyn(g.mesh, 0, Math.sin(t * 0.9 + g.phase) * 0.015, 0, 0, 0, 0, 'white', true);
      }
    }

    festMeshes() {
      if (this.fm) return this.fm;
      const r = this.renderer, Fe = F.Fest;
      this.fm = {
        crowds: Fe.crowds().map(c => ({ mesh: r.upload(c.batch), phase: c.phase, slow: c.slow })),
        turntable: r.upload(Fe.turntable()), balloon: r.upload(Fe.balloon()),
        screens: this.scene.festScreens.map(s => ({ s, mesh: r.upload(Fe.screenQuad(s.w, s.h)) })),
        cv: F.Tex.canvas(256, 128), shownAt: -1
      };
      return this.fm;
    }

    drawFestival(g, env, cam) {
      const r = this.renderer, gl = r.gl, FS = F.MAP.FEST, w = this.world, y = w.festY || 0;
      const d = Math.hypot(FS.lm[0] - cam.x, FS.lm[1] - cam.z), t = env.time;
      if (d > 1600) return;
      const fm = this.festMeshes(), b = FS.balloon;
      r.drawDyn(fm.balloon, b.x + Math.sin(t * 0.21) * 1.5, y + b.h + Math.sin(t * 0.37) * 1.2, b.z + Math.cos(t * 0.17) * 1.5, t * 0.05, Math.sin(t * 0.3) * 0.04, 0, 'white', true);
      if (d > 650) return;
      for (const [i, sc] of FS.showcase.entries()) {
        const yaw = t * 0.35 + i * 2.1;
        r.drawDyn(fm.turntable, sc.x, y, sc.z, yaw, 0, 0, 'white', true);
        r.drawCar({ id: sc.id, x: sc.x, y: y + 0.44, z: sc.z, yaw, paint1: F.hexRgb(sc.col), paint2: F.hexRgb(sc.col), metal: true, steer: 0, spin: 0, lights: env.night > 0.45 ? 1 : 0 }, env);
      }
      const beat = t * 2.2;
      for (const c of fm.crowds) {
        const bob = c.slow ? Math.sin(t * 0.8 + c.phase) * 0.02 : Math.abs(Math.sin(beat * Math.PI + c.phase)) * 0.14;
        r.drawDyn(c.mesh, 0, y + bob, 0, 0, 0, 0, 'white', true);
      }
      if (d > 420) return;
      if (t - fm.shownAt > 0.25 || t < fm.shownAt) {
        const p = g.profile, band = F.EV.BANDS[p.band] ? F.EV.BANDS[p.band].name.toUpperCase() : '';
        F.Fest.paintScreen(fm.cv, { name: p.name.toUpperCase(), level: p.level, band, weather: F.WEATHER[g.weather].name.toUpperCase(), time: String(Math.floor(g.clock)).padStart(2, '0') + ':' + String(Math.floor(g.clock % 1 * 60)).padStart(2, '0') }, t);
        fm.shownAt = t;
        fm.dirty = true;
      }
      r.canvasTex('festscreen', fm.cv, fm.dirty, false);
      fm.dirty = false;
      gl.uniform1f(r.pw.u.uFlat, 1);
      gl.disable(gl.CULL_FACE);
      for (const sc of fm.screens) r.drawMesh(sc.mesh, M4.pose(sc.s.x, sc.s.y, sc.s.z, sc.s.yaw, 0, 0, 1, r.model));
      gl.enable(gl.CULL_FACE);
      gl.uniform1f(r.pw.u.uFlat, 0);
    }

    festSprites(env, cam, C) {
      const r = this.renderer, sc = this.scene, FS = F.MAP.FEST, night = env.night;
      if (!sc.festLights || night < 0.25 || Math.hypot(FS.lm[0] - cam.x, FS.lm[1] - cam.z) > 1500) return;
      const t = env.time, cols = [[1, 0.2, 0.6], [1, 0.85, 0.3], [0.3, 0.75, 1], [1, 0.5, 0.2], [1, 1, 0.95]];
      for (const l of sc.festLights) {
        const c = l.kind === 'bulb' ? cols[l.col] : l.kind === 'stage' ? cols[l.col] : [1, 0.96, 0.85];
        const k = night * (l.kind === 'bulb' ? 0.8 : 1);
        r.billboard('glow', true, l.x, l.y, l.z, l.kind === 'bulb' ? 0.45 : l.kind === 'tower' ? 2.4 : 1.1, [c[0] * k, c[1] * k, c[2] * k, 1], C);
      }
      const st = FS.stage, y = this.world.festY || 0;
      for (let i = 0; i < 6; i++) {
        const x0 = st.x - st.w / 2 + 4 + i * (st.w - 8) / 5, y0 = y + 15.9, z0 = st.z + st.d / 2 + 0.3;
        const a = Math.sin(t * 0.9 + i * 1.3) * 0.7, len = 22 + Math.sin(t * 0.6 + i) * 4;
        const dx = Math.sin(a) * len, dy = -len * 0.55, dz = Math.cos(a) * len * 0.8;
        const c = cols[i % 4], k = night * 0.35;
        r.sprite('beacon', true, x0 + dx / 2, y0 + dy / 2, z0 + dz / 2, 1.6, 0, 0, dx / 2, dy / 2, dz / 2, [c[0] * k, c[1] * k, c[2] * k, 1]);
      }
      for (let i = 0; i < 2; i++) {
        const a = t * 0.35 + i * Math.PI, x0 = st.x + (i ? 18 : -18), z0 = st.z - st.d / 2 - 2, len = 260;
        const dx = Math.sin(a) * len * 0.35, dz = Math.cos(a) * len * 0.25, dy = len;
        const k = night * 0.22;
        r.sprite('beacon', true, x0 + dx / 2, y + dy / 2, z0 + dz / 2, 3.5, 0, 0, dx / 2, dy / 2, dz / 2, [0.85 * k, 0.9 * k, 1 * k, 1]);
      }
    }

    fireworks(dt) {
      const g = this.game || this.titleGame, FS = F.MAP.FEST, cam = this.lastCamPos;
      if (!g || !cam || this.envNight() < 0.6 || Math.hypot(FS.lm[0] - cam[0], FS.lm[1] - cam[2]) > 900 || (g.wx && g.wx.rain > 0.3)) return;
      this.fwT = (this.fwT || 0) - dt;
      if (this.fwT > 0) return;
      this.fwT = 1.2 + Math.random() * 2.5;
      const st = FS.stage, y = (this.world.festY || 0) + 55 + Math.random() * 25;
      const x = st.x + (Math.random() - 0.5) * 60, z = st.z - 20 + (Math.random() - 0.5) * 30;
      const col = [[1, 0.3, 0.6], [1, 0.8, 0.3], [0.4, 0.8, 1], [0.6, 1, 0.4], [1, 1, 1]][Math.floor(Math.random() * 5)];
      for (let i = 0; i < 60; i++) {
        const a = Math.random() * Math.PI * 2, e = Math.acos(Math.random() * 2 - 1), v = 10 + Math.random() * 5;
        this.particles.push({ x, y, z, vx: Math.cos(a) * Math.sin(e) * v, vy: Math.cos(e) * v, vz: Math.sin(a) * Math.sin(e) * v, life: 0, max: 1.4 + Math.random() * 0.6, size: 0.9, grow: -0.3, col, a: 1, tex: 'glow', add: true, grav: 4 });
      }
      this.audio.burst(700, 'lowpass', 0.5, Math.max(0.02, 0.3 - Math.hypot(x - cam[0], z - cam[2]) / 3000), 0.8, Math.hypot(x - cam[0], y - cam[1], z - cam[2]) / 343, this.audio.amb);
    }

    horizonMeshes() {
      if (this.hm) return this.hm;
      const r = this.renderer, B = F.Batch, C = F.col;
      const wood = C('#8a6a44'), dark = C('#3a2c20'), yel = C('#f0c020'), blk = C('#141414');
      const ramps = new Map();
      for (const rp of this.world.ramps) {
        const ramp = new B(256), hw = rp.w / 2, d = rp.ys - rp.y0, lip = rp.h - (rp.h - d) * 0.8 / rp.len;
        ramp.quad([hw, 0.02, 0], [-hw, 0.02, 0], [-hw, rp.h, 0], [hw, rp.h, 0], wood, 0);
        ramp.quad([-hw, d, rp.len], [hw, d, rp.len], [hw, rp.h, 0], [-hw, rp.h, 0], wood, 0);
        for (const s of [-1, 1]) ramp.quad([s * hw, d, rp.len], [s * hw, rp.h, 0], [s * hw, 0, 0], [s * hw, 0, 0], dark, 0);
        for (let i = 0; i < 5; i++) ramp.quad([-hw - 0.01 + i * 1.1, rp.h + 0.01, 0.02], [-hw + 0.55 + i * 1.1, rp.h + 0.01, 0.02], [-hw + 0.55 + i * 1.1, lip + 0.02, 0.8], [-hw - 0.01 + i * 1.1, lip + 0.02, 0.8], i % 2 ? yel : blk, 0);
        ramps.set(rp, r.upload(ramp));
      }
      const shed = new B(256);
      const W = C('#7a5a3a');
      shed.box(0, 2.2, 1.5, 4.5, 2.2, 3.2, W, 0);
      F.Models.gable(shed, 0, 4.4, 1.5, 4.6, 3.3, 2, C('#5a4a3a'), W, true);
      shed.quad([-2, 0.02, -1.71], [2, 0.02, -1.71], [2, 3.4, -1.71], [-2, 3.4, -1.71], C('#1a1410'), 0);
      const post = new B(128);
      post.box(-2.6, 2.4, 0, 0.12, 2.4, 0.12, C('#606468'), 0);
      post.box(2.6, 2.4, 0, 0.12, 2.4, 0.12, C('#606468'), 0);
      post.box(0, 4.8, 0.06, 3.2, 1.7, 0.05, C('#303236'), 0);
      const face = new B(16);
      face.quad([3.1, 3.2, -0.02], [3.1, 6.4, -0.02], [-3.1, 6.4, -0.02], [-3.1, 3.2, -0.02], C('#ffffff'), 0, [0, 1, 0, 0, 1, 0, 1, 1], [0, 0, -1]);
      face.quad([-3.1, 3.2, 0.14], [-3.1, 6.4, 0.14], [3.1, 6.4, 0.14], [3.1, 3.2, 0.14], C('#ffffff'), 0, [0, 1, 0, 0, 1, 0, 1, 1], [0, 0, 1]);
      const sign = new B(64);
      sign.box(0, 1.6, 0, 0.07, 1.6, 0.07, C('#909498'), 0);
      const sface = new B(16);
      sface.quad([0.8, 2.4, -0.05], [0.8, 3.6, -0.05], [-0.8, 3.6, -0.05], [-0.8, 2.4, -0.05], C('#ffffff'), 0, [0, 1, 0, 0, 1, 0, 1, 1], [0, 0, -1]);
      sface.quad([-0.8, 2.4, 0.05], [-0.8, 3.6, 0.05], [0.8, 3.6, 0.05], [0.8, 2.4, 0.05], C('#ffffff'), 0, [0, 1, 0, 0, 1, 0, 1, 1], [0, 0, 1]);
      const arch = new B(128);
      arch.box(-9, 4, 0, 0.6, 4, 0.6, C('#e6146e'), 0);
      arch.box(9, 4, 0, 0.6, 4, 0.6, C('#e6146e'), 0);
      const archFace = new B(16);
      archFace.quad([9.6, 6.5, -0.3], [9.6, 9, -0.3], [-9.6, 9, -0.3], [-9.6, 6.5, -0.3], C('#ffffff'), 0, [0, 1, 0, 0, 1, 0, 1, 1], [0, 0, -1]);
      archFace.quad([-9.6, 6.5, 0.3], [-9.6, 9, 0.3], [9.6, 9, 0.3], [9.6, 6.5, 0.3], C('#ffffff'), 0, [0, 1, 0, 0, 1, 0, 1, 1], [0, 0, 1]);
      const train = F.Models.buildTrain();
      const plane = F.Models.buildPlane();
      const ferris = F.Models.ferrisWheel();
      this.hm = { ramps, shed: r.upload(shed), post: r.upload(post), face: r.upload(face), sign: r.upload(sign), sface: r.upload(sface), arch: r.upload(arch), archFace: r.upload(archFace), train: r.upload(train), plane: r.upload(plane), ferris: r.upload(ferris) };
      return this.hm;
    }

    drawHorizon(g, env, cam, C) {
      const r = this.renderer, hm = this.horizonMeshes(), w = this.world;
      const near = (x, z, d) => Math.abs(x - cam.x) < d && Math.abs(z - cam.z) < d;
      for (const rp of w.ramps) if (near(rp.x, rp.z, 500)) r.drawDyn(hm.ramps.get(rp), rp.x, rp.y0, rp.z, rp.yaw);
      for (const b of w.barns) if (near(b.x, b.z, 500)) r.drawDyn(hm.shed, b.x, b.y, b.z, b.yaw);
      for (const b of w.boards) {
        if (b.col.broken || !near(b.x, b.z, 600)) continue;
        r.drawDyn(hm.post, b.x, b.y, b.z, b.yaw);
        r.drawDyn(hm.face, b.x, b.y, b.z, b.yaw, 0, 0, b.kind === 'xp' ? 'board_xp' : 'board_ft');
      }
      for (const s of w.signs) if (near(s.x, s.z, 400) && !(s.col && s.col.broken)) {
        r.drawDyn(hm.sign, s.x, s.y, s.z, s.yaw);
        r.drawDyn(hm.sface, s.x, s.y, s.z, s.yaw, 0, 0, 'stunt_' + s.kind);
      }
      const lm = w.landmarks.find(l => l.type === 'ferris');
      if (lm && near(lm.x, lm.z, 1500)) {
        const t = env.time * 0.08;
        const M = M4.pose(lm.x, lm.y + 28, lm.z, 0.3, 0, 0);
        const R = new Float32Array(16);
        const cr = Math.cos(t), sr = Math.sin(t);
        R.set([cr, sr, 0, 0, -sr, cr, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        const out = M4.mul(M, R);
        const gl = r.gl;
        gl.bindTexture(gl.TEXTURE_2D, r.tex('white'));
        gl.disable(gl.CULL_FACE);
        r.drawMesh(hm.ferris, out);
        gl.enable(gl.CULL_FACE);
      }
      for (const t of this.scene.tris) {
        if (!near(t.x, t.z, 420)) continue;
        if (!t.mesh) t.mesh = r.upload(t.batch);
        r.drawDyn(t.mesh, t.x, t.y, t.z, t.yaw, 0, 0, 'adatlas', true);
      }
      const race = g.race;
      if (race) {
        const rt = race.route;
        const fin = rt.point(rt.closed ? 0 : race.finishS);
        r.drawDyn(hm.arch, fin.x, fin.y, fin.z, Math.atan2(fin.tx, -fin.tz));
        r.drawDyn(hm.archFace, fin.x, fin.y, fin.z, Math.atan2(fin.tx, -fin.tz), 0, 0, 'finish');
      }
      void C; void env;
    }

    drawTrain(sp, env) {
      const r = this.renderer, hm = this.horizonMeshes(), w = this.world;
      for (let k = 0; k < 4; k++) {
        const p = w.railPoint(sp.s - k * 20.6 - 10);
        const q = w.railPoint(sp.s - k * 20.6 - 10 + 1);
        r.drawDyn(hm.train, p.x, p.y, p.z, Math.atan2(q.x - p.x, -(q.z - p.z)) + Math.PI, 0, 0, 'white', false);
      }
      void env;
    }

    drawPlane(sp) {
      const r = this.renderer, hm = this.horizonMeshes();
      r.drawDyn(hm.plane, sp.x, sp.y, sp.z, sp.yaw + Math.PI, 0, sp.roll || 0);
    }

    spritesFor(g, env, cam, C, mirror) {
      const r = this.renderer;
      const night = env.night;
      const fancy = this.settings().gfx !== 'retro';
      const v = g.veh;
      const view = C.view;
      const rightX = view[0], rightY = view[4], rightZ = view[8];
      if (!mirror) {
        for (const p of this.particles) {
          const k = p.life / p.max;
          const near = p.solid || p.add ? 1 : F.smooth(p.size * 0.6, p.size * 2 + 2, Math.hypot(p.x - cam.x, p.y - cam.y, p.z - cam.z));
          const a = p.a * (1 - k) * near * (p.solid ? 1 : F.smooth(0, 0.15, p.life));
          if (a <= 0.01) continue;
          r.billboard(p.tex, !!p.add, p.x, p.y, p.z, p.size, [p.col[0], p.col[1], p.col[2], a], C);
        }
      }
      if (!g.race) {
        for (const ev of F.EV.EVENTS) {
          if (ev.id === 'prologue') continue;
          const x = ev.via[0][0], z = ev.via[0][1];
          const d = Math.hypot(x - cam.x, z - cam.z);
          if (d > 1600) continue;
          const locked = g.eventLocked(ev);
          const col = F.hexRgb(locked ? '#777777' : F.EV.TYPES[ev.type].col);
          const y = this.world.groundY(x, z);
          const hgt = 60, wid = 4.5;
          const a = (locked ? 0.35 : 0.85) * (fancy ? 0.55 : 1) * F.smooth(25, 90, d);
          r.sprite('beacon', true, x, y + hgt / 2, z, rightX * wid, 0, rightZ * wid, 0, hgt / 2, 0, [col[0] * a, col[1] * a, col[2] * a, 1]);
          if (d < 120) r.sprite('glow', true, x, y + 0.3, z, 7, 0, 0, 0, 0, 7, [col[0] * 0.5, col[1] * 0.5, col[2] * 0.5, 1]);
        }
        for (const o of F.MAP.OUTPOSTS) {
          const d = Math.hypot(o.x - cam.x, o.z - cam.z);
          if (d > 1400) continue;
          const y = this.world.groundY(o.x, o.z);
          const k = (fancy ? 0.55 : 1) * F.smooth(30, 120, d);
          r.sprite('beacon', true, o.x, y + 25, o.z, rightX * 3, 0, rightZ * 3, 0, 25, 0, [0.9 * k, 0.1 * k, 0.45 * k, 1]);
        }
      }
      if (g.race && !mirror) this.raceSprites(g, env, cam, C);
      else if (g.gps && !mirror && this.settings().line !== 'off') this.chevrons(g.gps, 0, g.veh, [0.23, 0.55, 1.0]);
      const mist = env.mist || 0, glowK = Math.max(night, mist * 0.6);
      if (glowK > 0.3) {
        const halo = 1 + mist * 2.4, R = 320;
        if (night > 0.3) {
          for (const p of this.lampProps()) {
            if (Math.abs(p.x - cam.x) > R || Math.abs(p.z - cam.z) > R) continue;
            if (p.col_ && p.col_.broken) continue;
            const lg = LAMP_GLOW[p.type], fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = Math.sin(p.yaw);
            const c = p.type === 'tlight' ? (p.go === 'g' ? [0.2, 1, 0.45] : [1, 0.16, 0.08]) : LAMP_WARM, h = p.type === 'tlight' ? (p.go === 'g' ? 3.22 : 3.88) : lg.h;
            for (const ox of lg.x || [0]) {
              const hx = p.x + fx * lg.f + rx * ox, hz = p.z + fz * lg.f + rz * ox;
              r.billboard('glow', true, hx, p.y + h, hz, lg.s * halo, [c[0] * night, c[1] * night, c[2] * night, 1], C);
              if (!fancy && lg.pool) r.sprite('glow', true, hx, p.y + 0.15, hz, lg.pool, 0, 0, 0, 0, lg.pool, [c[0] * 0.32 * night, c[1] * 0.32 * night, c[2] * 0.3 * night, 1]);
            }
          }
          for (const l of this.scene.adLamps) {
            if (Math.abs(l[0] - cam.x) > 380 || Math.abs(l[2] - cam.z) > 380) continue;
            r.billboard('glow', true, l[0], l[1], l[2], 0.9 * halo, [0.95 * night, 0.92 * night, 0.8 * night, 1], C);
          }
        }
        const air = this.scene.airLights;
        if (air && Math.abs(cam.x + 1900) < 1500 && Math.abs(cam.z - 1700) < 1500) {
          const ak = Math.max(night, mist * 0.8);
          for (const l of air) {
            if (Math.abs(l.x - cam.x) > 1000 || Math.abs(l.z - cam.z) > 1000) continue;
            if (l.y === undefined) l.y = this.world.terrainH(l.x, l.z);
            if (l.kind === 'mast') {
              if (night > 0.3) for (const ox of [-0.8, 0.8]) r.billboard('glow', true, l.x + ox, l.y + 10.05, l.z, 1.5 * halo, [night, night * 0.84, night * 0.6, 1], C);
              continue;
            }
            const c = l.kind === 'end' ? [0.25, 1, 0.4] : l.kind === 'approach' ? [1, 1, 1] : [1, 0.9, 0.62];
            const pulse = l.kind === 'approach' ? 0.55 + 0.45 * Math.max(0, Math.sin((env.time || 0) * 6 - l.x * 0.03)) : 1;
            r.billboard('glow', true, l.x, l.y + (l.kind === 'approach' ? 1.75 : 0.3), l.z, (l.kind === 'approach' ? 1.3 : 0.8) * halo, [c[0] * ak * pulse, c[1] * ak * pulse, c[2] * ak * pulse, 1], C);
          }
        }
        const k = glowK;
        const PT = F.DMG.PART;
        const carLights = (id, wing, x, y, z, yaw, hl, brake, rev, pitch = 0, roll = 0, dmg = null) => {
          const geo = r.carMesh(id, wing).geo, fx = Math.sin(yaw), fz = -Math.cos(yaw), cs = Math.cos(yaw), sn = Math.sin(yaw), sp = Math.sin(pitch), sr = Math.sin(roll);
          const glow = (p, size, col) => r.billboard('glow', true, x + p[0] * cs - p[2] * sn, y + p[1] - p[2] * sp + p[0] * sr, z + p[0] * sn + p[2] * cs, size, col, C);
          const st = dmg && dmg.log.length ? dmg.st : null;
          const ok = (p, l, rr) => !st || st[p[0] < 0 ? l : rr] < 2;
          if (dmg && dmg.burnt) return;
          if (hl) {
            for (const p of geo.lightsF) if (ok(p, PT.headL, PT.headR)) glow(p, (fancy ? 0.4 : 0.6) * (1 + mist * 0.8), [k, k * 0.95, k * 0.85, 1]);
            const lit = !st || st[PT.headL] < 2 || st[PT.headR] < 2;
            if (!fancy && lit) r.sprite('glow', true, x + fx * (geo.len * 0.5 + 9), y + 0.1, z + fz * (geo.len * 0.5 + 9), cs * 4.5, 0, sn * 4.5, fx * 9, 0, fz * 9, [0.45 * k, 0.43 * k, 0.38 * k, 1]);
            if (lit && mist > 0.2 && Math.abs(x - cam.x) < 160 && Math.abs(z - cam.z) < 160) {
              const bx = x + fx * (geo.len * 0.5 + 7), bz = z + fz * (geo.len * 0.5 + 7), by = y + 0.75, m = mist * (0.3 + 0.7 * night) * 0.16;
              r.sprite('glow', true, bx, by, bz, cs * 2.6, 0, sn * 2.6, fx * 8, 0, fz * 8, [m, m * 0.97, m * 0.9, 1]);
              r.sprite('glow', true, bx, by, bz, 0, 1.2, 0, fx * 8, 0, fz * 8, [m, m * 0.97, m * 0.9, 1]);
            }
          }
          const bk = brake ? 1 : 0.35;
          for (const p of geo.lightsR) if (ok(p, PT.tailL, PT.tailR)) glow(p, (0.35 + bk * 0.25) * (1 + mist * 0.6), [bk * k, 0.05, 0.03, 1]);
          if (rev) for (const p of geo.lightsB) if (ok(p, PT.tailL, PT.tailR)) glow(p, 0.28, [k * 0.45, k * 0.45, k * 0.5, 1]);
        };
        const pc = this.carState(g);
        if (this.carShown()) carLights(pc.id, pc.wing, pc.x, pc.y, pc.z, pc.yaw, this.photo ? pc.lights > 0 : g.lightsOn || this.autoLights(), pc.brake, pc.reverse, pc.pitch, pc.roll, pc.dmg);
        for (const t of g.traffic.cars) if (Math.abs(t.x - cam.x) < 400 && Math.abs(t.z - cam.z) < 400) carLights(t.id, undefined, t.x, t.y, t.z, t.yaw, true, t.brake, false, t.pitch, t.roll, t.dmg);
        if (g.race) for (const a of g.race.rivals) if (Math.abs(a.x - cam.x) < 400 && Math.abs(a.z - cam.z) < 400) carLights(a.id, a.spec.wing, a.x, a.y, a.z, a.yaw, true, a.brakeLight, false, a.pitch, a.roll, a.dmg);
      }
      const pv = this.pose || v;
      const shadow = (x, y, z, yaw, wid, len, sf = 0, sr = 0, lift = 0) => {
        if (lift >= 1) return;
        const c = Math.cos(yaw), s = Math.sin(yaw), k = 1 + lift * 0.6, hw = wid * 0.62 * k, hl = len * 0.6 * k;
        r.sprite('carshadow', false, x, y + 0.05, z, c * hw, sr * hw, s * hw, s * hl, sf * hl, -c * hl, lift > 0 ? [0, 0, 0, CAR_SHADOW[3] * (1 - lift)] : CAR_SHADOW);
      };
      if (this.carShown()) { const gp = this.groundUnder(v, pv); shadow(pv.x, gp.y, pv.z, pv.yaw, v.spec.wid, v.spec.len, gp.sf, gp.sr, gp.lift); }
      const near = o => Math.abs(o.x - cam.x) < 150 && Math.abs(o.z - cam.z) < 150;
      if (g.race) for (const a of g.race.rivals) if (near(a)) shadow(a.x, a.y, a.z, a.yaw, a.spec.wid, a.spec.len, Math.tan(a.pitch || 0), Math.tan(a.roll || 0));
      for (const t of g.traffic.cars) if (near(t)) shadow(t.x, t.y, t.z, t.yaw, t.hw * 2, t.hl * 2, Math.tan(t.pitch || 0), Math.tan(t.roll || 0));
      for (const p of this.world.parked || []) if (near(p)) { const sh = F.Cars.get(p.id).sh; shadow(p.x, p.y, p.z, p.yaw, sh.wid, sh.len); }
      if (env.rain > 0.02 && !mirror) this.rainSprites(g, env, cam, C, fancy);
      void rightY;
    }

    groundUnder(v, p) {
      const W = v.wheels, fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw);
      const L = W[0].lx - W[2].lx, T = W[1].lz - W[0].lz, mid = (W[0].lx + W[2].lx) / 2;
      const sf = (W[0].gy + W[1].gy - W[2].gy - W[3].gy) / (2 * L), sr = (W[1].gy + W[3].gy - W[0].gy - W[2].gy) / (2 * T);
      const dx = p.x - v.x - fx * mid, dz = p.z - v.z - fz * mid;
      const y = (W[0].gy + W[1].gy + W[2].gy + W[3].gy) / 4 + sf * (dx * fx + dz * fz) + sr * (dz * fx - dx * fz);
      const h = p.y - y;
      if (!(h > -0.6 && h < 40) || Math.abs(sf) > 1.5 || Math.abs(sr) > 1.5) return { y: p.y, sf: Math.tan(v.pitch || 0), sr: Math.tan(v.roll || 0), lift: 0 };
      return { y, sf, sr, lift: F.clamp((h - 0.3) / 1.5, 0, 1) };
    }

    rainSprites(g, env, cam, C, fancy) {
      const r = this.renderer, rain = env.rain, view = C.view, v = this.game ? g.veh : null, rnd = this.photo ? this.photo.rng() : Math.random;
      const fx = -view[2], fz = -view[10], fl = Math.hypot(fx, fz) || 1;
      const wind = env.wind * 7, dr = [0.92, 0.39];
      const rx = wind * dr[0] - (v ? v.vx : 0), rz = wind * dr[1] - (v ? v.vz : 0), ry = -9.5;
      const rl = Math.hypot(rx, ry, rz), dx = rx / rl, dy = ry / rl, dz = rz / rl;
      const len = F.clamp(rl * 0.05, 0.5, 2.4);
      const light = Math.min(1, (env.amb[0] + env.amb[1] + env.amb[2]) * 0.55 + 0.12);
      const n = Math.round((fancy ? 60 + 340 * rain : 40 + 140 * rain));
      const yaw = Math.atan2(fz / fl, fx / fl);
      const trg = this.world.trg, roof = trg && Math.abs(cam.x - trg.meat[0][0]) < 160 && Math.abs(cam.z - trg.meat[0][1]) < 160 ? trg.meat : null;
      const dry = (x, z) => roof !== null && F.inPoly(x, z, roof);
      for (let i = 0; i < n; i++) {
        const a = yaw + (rnd() - 0.5) * 2.6, d = 1.2 + Math.pow(rnd(), 1.6) * 17;
        const x = cam.x + Math.cos(a) * d, z = cam.z + Math.sin(a) * d, y = cam.y - 3 + rnd() * 11;
        if (dry(x, z)) continue;
        const ux = -dx * len / 2, uy = -dy * len / 2, uz = -dz * len / 2;
        let wx = uy * (z - cam.z) - uz * (y - cam.y), wy = uz * (x - cam.x) - ux * (z - cam.z), wz = ux * (y - cam.y) - uy * (x - cam.x);
        const wl = Math.hypot(wx, wy, wz) || 1, w = 0.011 + d * 0.0012;
        wx *= w / wl; wy *= w / wl; wz *= w / wl;
        r.sprite('rain', false, x, y, z, wx, wy, wz, ux, uy, uz, [0.78 * light, 0.82 * light, 0.9 * light, 0.2 + 0.18 * rain]);
      }
      if (fancy) {
        const t = env.time;
        for (const [rad, h, al] of dry(cam.x, cam.z) ? [] : [[12, 26, 0.13], [26, 44, 0.2]]) {
          const segs = 14;
          for (let k = 0; k < segs; k++) {
            const a0 = k / segs * Math.PI * 2, a1 = (k + 1) / segs * Math.PI * 2, am = (a0 + a1) / 2;
            if (Math.cos(am - yaw) < -0.25) continue;
            const x0 = cam.x + Math.cos(a0) * rad, z0 = cam.z + Math.sin(a0) * rad, x1 = cam.x + Math.cos(a1) * rad, z1 = cam.z + Math.sin(a1) * rad;
            const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, cy = cam.y + h * 0.18;
            const hx = -dx * h / 2, hy = -dy * h / 2, hz = -dz * h / 2;
            const v0 = t * (1.4 + rad * 0.02) + k * 0.37;
            r.sprite('rainsheet', false, cx, cy, cz, (x1 - x0) / 2, 0, (z1 - z0) / 2, hx, hy, hz, [0.8 * light, 0.83 * light, 0.9 * light, al * rain], [k * 0.29, v0 + 2.5, k * 0.29 + 1.3, v0]);
          }
        }
        const sp = this.splashes || (this.splashes = []);
        for (let i = 0; i < 28 * rain && sp.length < 90; i++) {
          const a = yaw + (rnd() - 0.5) * 2, d = 2 + rnd() * 13;
          const x = cam.x + Math.cos(a) * d, z = cam.z + Math.sin(a) * d;
          if (this.world.isWaterAt(x, z) || dry(x, z)) continue;
          sp.push({ x, z, y: this.world.groundY(x, z), t: 0, s: 0.05 + rnd() * 0.06 });
        }
        for (let i = sp.length - 1; i >= 0; i--) {
          const s = sp[i];
          s.t += this.photo ? 0 : this.frameDt || 1 / 60;
          if (s.t > 0.22) { sp.splice(i, 1); continue; }
          const k = s.t / 0.22, rr = s.s * (0.5 + k * 1.5);
          r.sprite('splash', false, s.x, s.y + 0.05, s.z, rr, 0, 0, 0, 0, rr, [0.85 * light, 0.88 * light, 0.95 * light, 0.4 * (1 - k)]);
        }
      }
    }

    raceSprites(g, env, cam, C) {
      const r = this.renderer, race = g.race, rt = race.route;
      const next = race.checkS[race.nextCheck];
      if (next !== undefined && race.state !== 'done') {
        const p = rt.point(next);
        const rx = -p.tz, rz = p.tx;
        const w = p.hw + 1.5;
        for (const s of [-1, 1]) r.sprite('beacon', true, p.x + rx * w * s, p.y + 12, p.z + rz * w * s, p.tx * 1.2, 0, p.tz * 1.2, 0, 12, 0, [0.2, 0.55, 1, 1]);
        r.sprite('gate', false, p.x, p.y + 6.5, p.z, rx * w, 0, rz * w, 0, 0.9, 0, [1, 1, 1, 0.85]);
      }
      const mode = this.settings().line;
      if (mode !== 'off' && race.state !== 'done') this.chevrons(rt, race.pProg, g.veh, null, race, mode === 'brake');
    }

    chevrons(route, from, v, fixedCol, race, brakeOnly) {
      const r = this.renderer;
      const spec = v.spec;
      const mu = spec.grip * 0.9;
      const dec = Math.min(spec.grip * 1.05, spec.brake) * 9.81 * 0.75;
      for (let k = 2; k < 42; k++) {
        const s = from + k * 6;
        if (!route.closed && (s < 0 || s > route.total)) break;
        const p = route.point(s);
        let col = fixedCol;
        if (!col) {
          let vt = 200;
          for (let j = 0; j < 24; j++) {
            const q = route.point(s + j * 4);
            const c = Math.abs(route.curv[q.i]);
            const vc = Math.sqrt(mu * F.surfGrip(q.surf, spec.off, false) * 9.81 / Math.max(c, 1e-4));
            vt = Math.min(vt, Math.sqrt(vc * vc + 2 * dec * j * 4));
          }
          const over = v.speed - vt;
          col = over > 4 ? [0.95, 0.15, 0.12] : over > 0 ? [1, 0.75, 0.1] : [0.25, 0.55, 1];
          if (brakeOnly && over <= 0) continue;
        }
        const a = F.clamp(1.15 - k / 42, 0, 1);
        const rx = -p.tz, rz = p.tx;
        r.sprite('chevron', false, p.x + rx * (p.line ? p.line * 0.4 : 0), p.y + 0.12, p.z + rz * (p.line ? p.line * 0.4 : 0), rx * 2, 0, rz * 2, p.tx * 2.2, 0, p.tz * 2.2, [col[0], col[1], col[2], a]);
      }
      void race;
    }

    mirrorShift(yaw, pitch, fov, hh, y0) {
      const f = hh / 2 / Math.tan(fov * Math.PI / 360), e = Math.atan(y0 / f) - 0.035, t = pitch - 0.035;
      const dy = Math.sin(e), dz = -Math.cos(e), sy = Math.sin(yaw), cy = Math.cos(yaw), st = Math.sin(t), ct = Math.cos(t);
      const ahead = dy * st - dz * cy * ct;
      if (ahead < 0.3) return null;
      return [f * dz * sy / ahead, f * (dy * ct + dz * cy * st) / ahead - y0];
    }

    renderMirror(g, env, w, hh, fov) {
      const r = this.renderer, gl = r.gl;
      const v = g.veh, p = this.pose || v, lk = this.look;
      const mw = Math.round(w * 0.26), mh = Math.round(hh * 0.1);
      let mx = Math.round(w * 0.5 - mw / 2), my = Math.round(hh * 0.86);
      if (lk.yaw || lk.pitch) {
        const sh = this.mirrorShift(lk.yaw, lk.pitch, fov, hh, my + mh / 2 - hh / 2);
        if (!sh) return;
        mx += Math.round(sh[0]); my += Math.round(sh[1]);
        if (mx + mw <= 0 || mx >= w || my + mh <= 0 || my >= hh) return;
      }
      this.mirrorRect = [mx / w, 1 - (my + mh) / hh, mw / w, mh / hh];
      const clip = (x0, y0, x1, y1) => gl.scissor(Math.max(0, x0), Math.max(0, y0), Math.min(w, x1) - Math.max(0, x0), Math.min(hh, y1) - Math.max(0, y0));
      gl.enable(gl.SCISSOR_TEST);
      clip(mx - 2, my - 2, mx + mw + 2, my + mh + 2);
      gl.clearColor(0.05, 0.05, 0.05, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.viewport(mx, my, mw, mh);
      clip(mx, my, mx + mw, my + mh);
      const fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw);
      const cam = { x: p.x + fx * 0.2, y: p.y + v.spec.hgt + 0.2, z: p.z + fz * 0.2, tx: p.x - fx * 20, ty: p.y + 0.8, tz: p.z - fz * 20, fov: 42, near: 1.2, far: 900, mirror: true };
      const C = r.camera(cam, mw, mh, [0, 0, mw, mh]);
      r.drawSky(env, C, 1);
      gl.frontFace(gl.CW);
      r.setWorldUniforms(env, cam, C);
      r.drawWorld(env, cam, C, { dist: 350, noUpload: true, noLandmarks: true });
      this.drawDynamicMirror(g, env, cam, C);
      gl.frontFace(gl.CCW);
      gl.disable(gl.SCISSOR_TEST);
      gl.viewport(0, 0, w, hh);
    }

    drawDynamicMirror(g, env, cam, C) {
      const r = this.renderer;
      r.setWorldUniforms(env, cam, C);
      if (g.race) for (const a of g.race.rivals) {
        if (Math.hypot(a.x - cam.x, a.z - cam.z) > 300) continue;
        r.drawCar({ id: a.id, x: a.x, y: a.y, z: a.z, yaw: a.yaw, pitch: a.pitch || 0, roll: a.roll || 0, paint1: a.paint1, paint2: a.paint2, spin: -a.wheel, far: true }, env);
      }
      for (const t of g.traffic.cars) if (Math.hypot(t.x - cam.x, t.z - cam.z) < 250) r.drawCar({ id: t.id, x: t.x, y: t.y, z: t.z, yaw: t.yaw, pitch: t.pitch, roll: t.roll, paint1: t.paint1, far: true }, env);
    }

    lensFlare(env, C, cam) {
      const sd = env.sunDir;
      const s = M4.apply(C.vp, cam.x + sd[0] * 1000, cam.y + sd[1] * 1000, cam.z + sd[2] * 1000);
      if (s[3] <= 0 || Math.abs(s[0]) > 1.1 || Math.abs(s[1]) > 1.1) return;
      if (env.cover > 0.7) return;
      const c = this.hud.ctx, w = this.hud.w, h = this.hud.h;
      const sx = (s[0] * 0.5 + 0.5) * w, sy = (0.5 - s[1] * 0.5) * h;
      const cx = w / 2, cy = h / 2;
      const k = (1 - env.cover) * (1 - F.clamp(Math.hypot(s[0], s[1]) - 0.6, 0, 1)) * env.day * (this.sunVis === undefined ? 1 : this.sunVis) * (1 - (env.rain || 0)) * (1 - (env.mist || 0));
      if (k <= 0.02) return;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const blobs = [[0, 90, [255, 240, 200], 0.35], [0.35, 26, [255, 180, 90], 0.25], [0.6, 14, [120, 200, 255], 0.3], [0.85, 40, [200, 120, 255], 0.14], [1.25, 22, [255, 220, 120], 0.2], [1.6, 60, [120, 255, 180], 0.08]];
      for (const [t, rad, col, a] of blobs) {
        const x = F.lerp(sx, cx + (cx - sx), t / 2), y = F.lerp(sy, cy + (cy - sy), t / 2);
        const gr = c.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a * k})`);
        gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
        c.fillStyle = gr;
        c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }

    titleCam(g) {
      const t = (this.titleT || 0) * 0.1 + 2.2;
      const v = g.veh;
      const d = 6.4;
      return { x: v.x + Math.cos(t) * d, y: v.y + 1.25, z: v.z + Math.sin(t) * d, tx: v.x, ty: v.y + 0.75, tz: v.z, fov: 50, near: 0.3, far: 3000 };
    }

    renderStudio(w, hh, dt) {
      const r = this.renderer, gl = r.gl, sr = this.showroom, D = F.Driver;
      this.showT = (this.showT || 0) + dt;
      gl.clearColor(0.13, 0.42, 0.4, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const env = F.studioEnv(), key = JSON.stringify(sr.driver);
      if (!this.studioInst || this.studioKey !== key) { this.studioInst = D.make(sr.driver); this.studioKey = key; }
      const pose = this.studioPose || { head: [0, 1.62, -0.01], chest: [0, 1.3, 0] };
      const want = sr.frame === 'head' ? [pose.head[1] - 0.02, 0.95, 26] : sr.frame === 'top' ? [pose.chest[1] + 0.05, 1.85, 32] : [0.92, 3.7, 34];
      const sc = this.studioCam || (this.studioCam = want.slice()), k = 1 - Math.exp(-Math.min(dt, 0.1) * 7);
      for (let i = 0; i < 3; i++) sc[i] += (want[i] - sc[i]) * k;
      const yaw = (this.studioYaw || 0) - 0.42 + Math.sin(this.showT * 0.25) * 0.05;
      const cam = { x: Math.sin(yaw) * sc[1], y: sc[0] + sc[1] * 0.08, z: -Math.cos(yaw) * sc[1], tx: 0, ty: sc[0], tz: 0, fov: sc[2], near: 0.05, shiftX: w > hh * 1.2 ? ((sr.cx || 0.5) - 0.5) * 2 : 0 };
      const C = r.camera(cam, w, hh);
      r.setWorldUniforms(env, cam, C);
      gl.uniform1f(r.pw.u.uDither, 0);
      const disc = this.studioFloor || (this.studioFloor = r.upload((() => { const b = new F.Batch(64); b.disc(0, 0, 0, 1.15, 32, F.col('#1d6b66'), 0); b.disc(0, -0.01, 0, 1.3, 32, F.col('#e6146e'), 0); return b; })()));
      gl.bindTexture(gl.TEXTURE_2D, r.tex('white'));
      r.drawMesh(disc);
      if (sr.car) {
        const e = sr.car, sp = F.Cars.spec(e.id, e.up);
        r.drawCar({ id: e.id, livery: e.livery, wing: sp.wing, x: 2.4, y: 0.02, z: 2.2, yaw: 0.95, paint1: F.hexRgb(e.c1), paint2: F.hexRgb(e.c2 || e.c1), metal: !!e.metal, steer: 0.2, spin: 0 }, env);
      }
      this.studioPose = r.drawFigure(this.studioInst, F.M4.pose(0, 0.02, 0, 0, 0, 0, 1, new Float32Array(16)), this.showT);
      r.flushGlass();
    }

    renderShowroom(w, hh, dt) {
      const r = this.renderer, gl = r.gl;
      const sr = this.showroom;
      if (sr.driver) { this.renderStudio(w, hh, dt); return; }
      this.showT = (this.showT || 0) + dt;
      gl.clearColor(0.13, 0.42, 0.4, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const env = F.studioEnv();
      const car = F.Cars.get(sr.id);
      const L = car.sh.len;
      const a = this.showT * 0.35;
      const k = sr.dist || 1.9;
      const cam = { x: Math.cos(a) * L * k, y: 1.5 + L * k * 0.06, z: Math.sin(a) * L * k, tx: 0, ty: 0.55, tz: 0, fov: 38, shiftX: w > hh * 1.2 ? ((sr.cx || 0.5) - 0.5) * 2 : 0 };
      const C = r.camera(cam, w, hh);
      r.setWorldUniforms(env, cam, C);
      gl.uniform1f(r.pw.u.uDither, 0);
      const disc = this.floorMesh || (this.floorMesh = r.upload((() => { const b = new F.Batch(64); b.disc(0, 0, 0, L * 0.85, 32, F.col('#1d6b66'), 0); b.disc(0, -0.01, 0, L * 0.95, 32, F.col('#e6146e'), 0); return b; })()));
      gl.bindTexture(gl.TEXTURE_2D, r.tex('white'));
      r.drawMesh(disc);
      r.drawCar({ id: sr.id, livery: sr.livery, wing: sr.wing, x: 0, y: 0.02, z: 0, yaw: 0, paint1: F.hexRgb(sr.c1), paint2: F.hexRgb(sr.c2 || sr.c1), metal: !!sr.metal, steer: 0.2, spin: 0 }, env);
      r.flushGlass();
    }

    destroy() {
      cancelAnimationFrame(this.raf);
      if (this.touch) this.touch.destroy();
      if (this.game) this.game.save();
      this.el.removeEventListener('keydown', this.onKeyDown);
      this.el.removeEventListener('keyup', this.onKeyUp);
      document.removeEventListener('visibilitychange', this.onVis);
      if (this.ro) this.ro.disconnect();
      this.audio.destroy();
      if (this.renderer) this.renderer.destroy();
      this.root.innerHTML = '';
    }
  }

  F.UI = UI;
})(globalThis.Forza = globalThis.Forza || {});
