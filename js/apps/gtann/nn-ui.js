(function (N) {
  'use strict';

  const TIPS = [
    'Мигалки в правом углу — уровень розыска. Чем их больше, тем злее милиция.',
    'Перекраска в автосервисе стоит 500 рублей и снимает розыск.',
    'Взятка в конверте сбрасывает одну мигалку. Всё как в жизни.',
    'В гостинице «Автозаводская» можно сохраниться. Ищи розовую дверь.',
    'Заначки спрятаны по всему городу. Каждые пять — подарок в гостинице.',
    'В любом такси нажми T и подрабатывай извозом.',
    'С правой кнопкой мыши стрелять точнее. С СВД — ещё и видно дальше.',
    'Ручник и газ одновременно — и «Жигули» пойдут боком.',
    'На Мызинском мосту ремонт. Надолго. Как всегда.',
    'Пейджер пищит — значит, кто-то хочет дать тебе работу.',
    'F8 — фотоаппарат. Газета «Автозаводец» платит за виды района: ДК, «Мир», универмаг, трубы ГАЗа...',
    'Газ и тормоз вместе на месте — колёса в дым. Отпусти тормоз — и рывок.',
    'В прыжке A и D кренят машину. Приземляйся на колёса, а не на крышу.',
    'Машина легла на бок? Качни её A или D. Перевёрнутая на крышу — загорится.'
  ];

  const KEYMAP = {
    KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
    Space: 'space', ShiftLeft: 'shift', ShiftRight: 'shift', ControlLeft: 'fire', ControlRight: 'fire', KeyF: 'enter', Enter: 'enter', NumpadEnter: 'enter',
    KeyQ: 'q', KeyE: 'e', KeyG: 'grenade', KeyR: 'r', KeyH: 'horn', KeyT: 'side', KeyC: 'cam', KeyM: 'map', Tab: 'map', Escape: 'pause', KeyP: 'pause', KeyB: 'behind',
    KeyX: 'trip', Digit1: 's0', Digit2: 's1', Digit3: 's2', Digit4: 's3', Digit5: 's4', Digit6: 's5', Digit7: 's6', Digit8: 's7', Digit9: 's8', AltLeft: 'walk'
  };
  const VP = {};
  const CAM_FOOT = ['ближе', 'обычная', 'дальше', 'сверху', 'от первого лица'];
  const CAM_CAR = ['ближе', 'обычная', 'дальше', 'сверху', 'из салона', 'с бампера'];
  const FP = 4, BUMPER = 5;
  const THROW_SHOULDER = 0.85;
  N.CAM_FOOT = CAM_FOOT;
  N.CAM_CAR = CAM_CAR;
  N.CAM_FP = FP;
  N.CAM_BUMPER = BUMPER;
  const camIndex = (v, list, d) => (Number.isInteger(v) && v >= 0 && v < list.length ? v : d);
  const carFrame = v => N.M3.euler((v.pitch || 0) + (v.bodyPitch || 0), -v.yaw, v.roll || 0, v.x, v.y, v.z);
  const rot = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2], M[3] * p[0] + M[4] * p[1] + M[5] * p[2], M[6] * p[0] + M[7] * p[1] + M[8] * p[2]];
  const lookLocal = (rel, pitch) => [Math.sin(rel) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(rel) * Math.cos(pitch)];
  const carUp = (M, k) => {
    const u = rot(M, [0, 1, 0]), x = u[0] * k, y = 1 - k + u[1] * k, z = u[2] * k, l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
  };
  const camAt = (p, d, o) => Object.assign({ x: p[0], y: p[1], z: p[2], tx: p[0] + d[0] * 10, ty: p[1] + d[1] * 10, tz: p[2] + d[2] * 10 }, o);

  class UI {
    constructor(root, opts = {}) {
      this.opts = opts;
      this.root = root;
      const el = document.createElement('div');
      el.className = 'nn';
      el.tabIndex = 0;
      el.innerHTML = '<canvas class="nn-gl"></canvas><canvas class="nn-hud"></canvas><div class="nn-menu"></div><div class="nn-load"><canvas class="nn-load-art"></canvas><canvas class="nn-load-logo"></canvas><div class="nn-load-bar"><i></i></div><div class="nn-load-text">Загрузка...</div><div class="nn-load-tip"></div></div>';
      root.appendChild(el);
      this.el = el;
      this.glc = el.querySelector('.nn-gl');
      this.hudc = el.querySelector('.nn-hud');
      this.menuEl = el.querySelector('.nn-menu');
      this.loadEl = el.querySelector('.nn-load');
      this.settings = N.loadSettings();
      this.keys = new Set();
      this.pressed = new Set();
      this.mouse = { dx: 0, dy: 0, l: false, r: false, lp: false, wheel: 0 };
      this.camYaw = 0;
      this.camPitch = 0.22;
      this.camFoot = camIndex(this.settings.camFoot, CAM_FOOT, 1);
      this.camCar = camIndex(this.settings.camCar, CAM_CAR, 1);
      this.fpFov = 1.15;
      this.sway = [0, 0];
      this.swayV = null;
      this.lastMouseT = -99;
      this.scopeZoom = 0.35;
      this.state = 'loading';
      this.t = 0;
      this.acc = 0;
      this.fx = new N.FX();
      this.audio = new N.Audio();
      this.voice = new N.Voice();
      this.voice.vol = this.settings.voice === undefined ? 0.9 : this.settings.voice;
      this.voice.on = this.settings.tts !== false;
      this.fpsT = 0;
      this.frames = 0;
      this.fpsText = '';
      this.camPos = null;
      this.sinkSeen = new Set();
      this.handlers = [];
      this.destroyed = false;
      this.listen(el, 'keydown', e => this.onKey(e, true));
      this.listen(el, 'keyup', e => this.onKey(e, false));
      this.listen(el, 'mousedown', e => this.onMouse(e, true));
      this.listen(window, 'mouseup', e => this.onMouse(e, false));
      this.listen(document, 'mousemove', e => this.onMove(e));
      this.listen(el, 'wheel', e => { e.preventDefault(); if (this.photo && this.photo.on) this.photo.wheel(Math.sign(e.deltaY)); else this.mouse.wheel += Math.sign(e.deltaY); }, { passive: false });
      this.listen(el, 'contextmenu', e => e.preventDefault());
      this.listen(el, 'blur', () => { this.keys.clear(); this.mouse.l = this.mouse.r = false; if (this.photo) this.photo.release(); });
      this.listen(document, 'pointerlockchange', () => { this.locked = document.pointerLockElement === this.glc; });
      this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null;
      if (this.ro) this.ro.observe(el);
      this.menus = new N.Menus(this);
      this.debug = new N.Debug(this);
      this.photo = new N.Photo(this);
      this.loadArt();
      setTimeout(() => this.load(), 30);
    }

    carView() { return !!(this.game && this.game.world.player.veh); }
    get camMode() { return this.carView() ? this.camCar : this.camFoot; }
    set camMode(m) { if (this.carView()) this.camCar = m; else this.camFoot = m; }
    fpFoot() { return !this.carView() && this.camFoot === FP; }

    cycleCamera() {
      const car = this.carView(), list = car ? CAM_CAR : CAM_FOOT, m = (this.camMode + 1) % list.length;
      this.camMode = m;
      this.settings[car ? 'camCar' : 'camFoot'] = m;
      N.saveSettings(this.settings);
      this.camPos = null;
      this.swayV = null;
      const v = this.game.world.player.veh;
      this.game.msg.view = { text: 'Камера: ' + (m === FP && v && v.spec.turret ? 'из люка' : list[m]), t: 1.8 };
    }

    listen(t, ev, fn, o) { t.addEventListener(ev, fn, o); this.handlers.push([t, ev, fn, o]); }

    loadArt() {
      const art = this.loadEl.querySelector('.nn-load-art');
      const w = Math.max(320, Math.min(900, this.el.clientWidth || 800)), h = Math.round(w * 0.6);
      art.width = w; art.height = h;
      try { N.Art.poster(art, (Date.now() & 0xfff) + 1); } catch (e) { }
      const logo = this.loadEl.querySelector('.nn-load-logo');
      logo.width = 520; logo.height = 200;
      N.Art.logo(logo);
      this.loadEl.querySelector('.nn-load-tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
    }

    progress(p, text) {
      const bar = this.loadEl.querySelector('.nn-load-bar i');
      if (bar) bar.style.width = Math.round(p * 100) + '%';
      if (text) this.loadEl.querySelector('.nn-load-text').textContent = text;
    }

    load() {
      const steps = [
        ['Строим Автозавод...', () => { this.city = N.getCity(); }],
        ['Красим панельки...', () => { this.tex = new N.Tex().build(); }],
        ['Пишем вывески...', () => { this.atlas = N.buildAtlas(this.city, N.EXTRA_SIGNS.concat(this.city.metroLine ? this.city.metroLine.signs : [])); N.ATLAS_MAP = this.atlas.map; this.particles = N.buildParticles(); }],
        ['Сажаем тополя...', () => { this.geo = new N.CityGeo(this.city, this.atlas).build(); }],
        ['Заводим «Волги»...', () => {
          this.renderer = new N.Renderer(this.glc, { quality: this.settings.gfx });
          this.renderer.detailR = (N.CITY_DETAIL[this.settings.city] || N.CITY_DETAIL.high).r;
          this.floraRadii();
          this.renderer.upload(this.tex, this.atlas, this.particles, this.geo);
          this.scene = new N.Scene(this.renderer, this.geo, this.city);
          this.hud = new N.Hud(this.hudc, this.city);
          this.hud.ensureMap();
          for (const id of N.VEHICLE_IDS) N.Models.car(id, null);
        }],
        ['Готово', () => { }]
      ];
      let i = 0;
      const next = () => {
        if (this.destroyed) return;
        if (i >= steps.length) { this.loaded(); return; }
        const [text, fn] = steps[i];
        this.progress(i / steps.length, text);
        setTimeout(() => {
          try { fn(); } catch (e) { this.fatal(e); return; }
          i++;
          next();
        }, 20);
      };
      next();
    }

    fatal(e) {
      this.state = 'error';
      this.loadEl.querySelector('.nn-load-text').textContent = 'Ошибка: ' + (e && e.message ? e.message : e);
      if (typeof console !== 'undefined') console.error(e);
    }

    loaded() {
      this.progress(1, 'Готово');
      this.resize();
      this.loadEl.classList.add('nn-hidden');
      this.state = 'menu';
      this.menuWorld();
      this.menus.open('main');
      this.last = performance.now();
      this.raf = requestAnimationFrame(t => this.frame(t));
    }

    menuWorld() {
      const store = typeof localStorage !== 'undefined' ? localStorage : null;
      this.game = new N.Game(this.city, { settings: this.settings, newGame: false, state: Object.assign(N.Game.newState(), { done: { m1: true }, clock: 20 * 60 + 10 }) });
      this.game.world.frozen = true;
      this.demo = true;
      const p = this.city.places.hotel_door;
      this.demoCam = { x: p.x - 60, z: p.z - 40 };
    }

    newGame() {
      this.audio.init();
      this.game = new N.Game(this.city, { settings: this.settings, voice: this.voice });
      this.demo = false;
      this.state = 'play';
      this.menus.close();
      this.resetCam();
      this.el.focus({ preventScroll: true });
    }

    loadGame(slot) {
      const s = N.Game.load(slot);
      if (!s) return false;
      this.audio.init();
      this.game = new N.Game(this.city, { settings: this.settings, state: s, voice: this.voice });
      this.demo = false;
      this.state = 'play';
      this.menus.close();
      this.resetCam();
      this.el.focus({ preventScroll: true });
      return true;
    }

    resetCam() {
      const pl = this.game.world.player;
      this.camYaw = pl.yaw;
      this.camPitch = 0.22;
      this.camPos = null;
    }

    applySettings() {
      N.saveSettings(this.settings);
      if (this.game) { this.game.settings = this.settings; this.game.world.settings.traffic = this.settings.traffic; this.game.world.settings.peds = this.settings.peds; }
      this.audio.setVolumes(this.settings.sfx, this.settings.radio);
      this.voice.vol = this.settings.voice === undefined ? 0.9 : this.settings.voice;
      this.voice.on = this.settings.tts !== false;
      if (!this.voice.on) this.voice.stop();
      if (this.renderer) { this.renderer.quality = this.settings.gfx === 'low' ? 'low' : 'high'; this.renderer.detailR = (N.CITY_DETAIL[this.settings.city] || N.CITY_DETAIL.high).r; this.floraRadii(); }
      this.resize();
    }

    resize() {
      const w = this.el.clientWidth || 800, h = this.el.clientHeight || 600;
      const sc = this.settings.scale || 1;
      const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
      if (this.renderer) this.renderer.resize(Math.max(64, Math.round(w * sc * dpr)), Math.max(64, Math.round(h * sc * dpr)));
      this.hudc.width = Math.round(w * dpr);
      this.hudc.height = Math.round(h * dpr);
    }

    onKey(e, down) {
      if (e.code === 'F7' || e.code === 'F8') e.preventDefault();
      if (this.menus.active) { if (down) this.menus.key(e); return; }
      if (this.state !== 'play') return;
      if (this.debug.open) { if (down) this.debug.key(e); return; }
      if (this.photo.on) { this.photo.key(e, down); return; }
      if (e.code === 'F7') { if (down && !e.repeat && this.debug.show()) { this.keys.clear(); this.pressed.clear(); } return; }
      if (e.code === 'F8') {
        if (down && !e.repeat && !this.photo.open()) { const why = this.photo.blocked(); if (why && this.game) this.game.help(why, 3); if (this.audio.on) this.audio.play('deny'); }
        return;
      }
      const k = KEYMAP[e.code];
      if (k || e.code.startsWith('Key')) e.preventDefault();
      if (down && !e.repeat && e.code.startsWith('Key') && this.game) this.cheatKey = e.code.slice(3);
      if (this.game && this.game.shop) {
        if (!down) return;
        const s = this.game.shop;
        if (k === 'fwd') { s.sel = (s.sel + s.items.length - 1) % s.items.length; this.audio.play('menu'); }
        else if (k === 'back') { s.sel = (s.sel + 1) % s.items.length; this.audio.play('menu'); }
        else if (k === 'enter' || k === 'space') { if (this.game.buy(s.sel)) this.audio.play('money'); else this.audio.play('deny'); }
        else if (k === 'pause' || k === 'map') { this.game.closeShop(); this.audio.play('menu'); }
        return;
      }
      if (!k) return;
      if (down) { if (!this.keys.has(k)) this.pressed.add(k); this.keys.add(k); } else this.keys.delete(k);
      if (down && k === 'pause') { this.pause('main'); }
      if (down && k === 'map') { this.pause('map'); }
    }

    onMouse(e, down) {
      if (this.menus.active || this.state !== 'play' || this.debug.open) { if (!down) this.mouse.l = this.mouse.r = false; return; }
      if (this.photo.on) { if (down) this.el.focus({ preventScroll: true }); this.photo.mouse(e, down); return; }
      if (down) {
        this.audio.init();
        this.audio.resume();
        this.el.focus({ preventScroll: true });
        if (!this.locked && this.glc.requestPointerLock && !this.noLock) { try { const r = this.glc.requestPointerLock(); if (r && r.catch) r.catch(() => { this.noLock = true; }); } catch (err) { this.noLock = true; } }
      }
      if (e.button === 0) { if (down && !this.mouse.l) this.mouse.lp = true; this.mouse.l = down; }
      if (e.button === 2) this.mouse.r = down;
      if (!down && !this.locked) this.dragging = false;
      if (down && !this.locked) { this.dragging = true; this.dragX = e.clientX; this.dragY = e.clientY; }
    }

    onMove(e) {
      if (this.state !== 'play' || this.menus.active || this.debug.open) return;
      if (this.photo.on) { this.photo.move(e); return; }
      if (this.locked) { this.mouse.dx += e.movementX; this.mouse.dy += e.movementY; }
      else if (this.dragging && (this.mouse.l || this.mouse.r)) { this.mouse.dx += e.clientX - this.dragX; this.mouse.dy += e.clientY - this.dragY; this.dragX = e.clientX; this.dragY = e.clientY; }
    }

    pause(tab) {
      if (!this.game || this.game.death) return;
      if (this.debug.open) this.debug.close();
      if (this.photo.on) this.photo.close();
      this.state = 'paused';
      if (document.exitPointerLock && this.locked) document.exitPointerLock();
      this.audio.setRadio(this.audio.station, false);
      this.game.hushVoice();
      this.menus.open('pause', tab);
    }

    askFail() {
      const g = this.game;
      g.failReq = false;
      if (!g.failInfo) return;
      if (this.debug.open) this.debug.close();
      if (this.photo.on) this.photo.close();
      this.state = 'paused';
      if (document.exitPointerLock && this.locked) document.exitPointerLock();
      if (this.audio.on) this.audio.setRadio(this.audio.station, false);
      g.hushVoice();
      g.msg.big = null;
      g.msg.title = null;
      g.msg.obj = null;
      this.menus.open('fail', g.failInfo);
    }

    retryMission(kind) {
      const g = this.game;
      if (!g.failInfo) { this.resume(); return; }
      const dead = !!g.death;
      this.resume();
      if (dead) g.retry(kind);
      else g.fade = { t: 0, dur: 0.35, hold: 0.25, lock: true, then: () => g.retry(kind) };
      this.camPos = null;
    }

    leaveMission() {
      const g = this.game;
      this.resume();
      g.leaveFailed();
      this.camPos = null;
    }

    resume() {
      this.state = 'play';
      this.menus.close();
      this.keys.clear();
      this.last = performance.now();
      this.el.focus({ preventScroll: true });
    }

    exitToMenu() {
      if (this.debug.open) this.debug.close();
      if (this.photo.on) this.photo.close();
      if (this.audio.on) this.audio.setRadio(this.audio.station, false);
      if (this.audio.on) this.audio.updateEngine(null, 0, 0, 0, null, true);
      if (this.locked && document.exitPointerLock) document.exitPointerLock();
      this.voice.stop();
      this.menuWorld();
      this.state = 'menu';
      this.menus.open('main');
    }

    buildInput() {
      const K = this.keys, P = this.pressed;
      const g = this.game, pl = g.world.player;
      if (this.debug.open) return { camYaw: this.camYaw };
      const inp = {};
      const fwd = (K.has('fwd') ? 1 : 0) - (K.has('back') ? 1 : 0);
      const right = (K.has('right') ? 1 : 0) - (K.has('left') ? 1 : 0);
      inp.fwd = fwd;
      inp.right = right;
      inp.steer = right;
      inp.sprint = K.has('shift');
      inp.walk = K.has('walk');
      inp.jump = P.has('space') && !pl.veh;
      inp.hand = K.has('space');
      inp.rise = K.has('space') && !pl.veh;
      inp.sink = K.has('walk') && !pl.veh;
      inp.burn = K.has('fwd') && K.has('back');
      inp.fire = K.has('fire') || this.mouse.l;
      inp.firePressed = P.has('fire') || this.mouse.lp;
      inp.aim = this.mouse.r;
      inp.enter = P.has('enter');
      inp.grenade = P.has('grenade');
      inp.horn = P.has('horn');
      inp.side = P.has('side');
      inp.skip = P.has('enter') || P.has('space') || this.mouse.lp;
      inp.skipAll = !!g.cut && P.has('trip');
      inp.trip = P.has('trip');
      inp.camYaw = this.camYaw;
      inp.face = this.fpFoot();
      inp.reload = !pl.veh && P.has('r');
      if (!pl.veh) {
        if (P.has('q')) inp.prevWeapon = true;
        if (P.has('e')) inp.nextWeapon = true;
        const w = N.WEAPONS[pl.weapon];
        if (this.mouse.wheel && !(w.scope && this.mouse.r)) { if (this.mouse.wheel > 0) inp.nextWeapon = true; else inp.prevWeapon = true; }
      } else {
        inp.driveBySide = pl.veh.spec.turret ? 0 : K.has('q') ? -1 : K.has('e') ? 1 : 0;
        if (this.mouse.wheel) { if (this.mouse.wheel > 0) inp.nextWeapon = true; else inp.prevWeapon = true; }
      }
      for (let i = 0; i < N.SLOTS.length; i++) if (P.has('s' + i)) inp.slot = i;
      if (this.cheatKey) { inp.cheat = this.cheatKey; this.cheatKey = null; }
      const cam = this.camState;
      if (cam && (!pl.veh || pl.veh.spec.turret)) {
        inp.aimO = [cam.x, cam.y, cam.z];
        const dx = cam.tx - cam.x, dy = cam.ty - cam.y, dz = cam.tz - cam.z;
        const L = Math.hypot(dx, dy, dz) || 1;
        inp.aimD = [dx / L, dy / L, dz / L];
        if (!pl.veh) pl.aimPitch = Math.asin(N.clamp(dy / L, -1, 1));
      }
      if (pl.veh && P.has('r')) this.cycleRadio();
      if (P.has('cam')) this.cycleCamera();
      return inp;
    }

    cycleRadio() {
      const v = this.game.world.player.veh;
      if (!v || v.spec.turret) return;
      v.radio = (N.carStation(v) + 1) % (N.RADIO.length + 1);
      this.showRadio(true);
    }

    showRadio(force) {
      const v = this.game.world.player.veh;
      const st = v && N.RADIO[N.carStation(v)];
      this.game.msg.radio = { text: st ? st.name : 'Радио выключено', sub: st ? st.freq : '', t: force ? 3 : 2.5 };
    }

    frame(ts) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(t => this.frame(t));
      const dtr = Math.min(0.1, Math.max(0, (ts - (this.last || ts)) / 1000));
      this.last = ts;
      this.step(dtr);
    }

    step(dtr) {
      if (!this.game || !this.renderer) return;
      const active = this.opts.isActive ? this.opts.isActive() : true;
      const g = this.game;
      const still = this.photo.on;
      if (!still) this.t += dtr;
      if (still) { if (active) this.photo.step(dtr); }
      else if (this.state === 'play' && active) {
        this.acc += dtr;
        let n = 0;
        while (this.acc >= N.TICK && n < 5) {
          const inp = this.buildInput();
          this.updateCameraYaw(N.TICK);
          g.step(N.TICK, inp);
          this.pressed.clear();
          this.mouse.lp = false;
          this.mouse.wheel = 0;
          this.afterStep();
          this.acc -= N.TICK;
          n++;
        }
        if (n === 5) this.acc = 0;
        if (g.saveReq && !this.menus.active) { const at = g.saveReq.at; g.saveReq = null; this.state = 'paused'; if (this.locked && document.exitPointerLock) document.exitPointerLock(); this.menus.open('save', at); }
        if (g.failReq && !this.menus.active && this.state === 'play') this.askFail();
      } else if (this.state === 'menu') {
        g.world.step(Math.min(dtr, 0.05), {});
        g.world.ev.length = 0;
      }
      if (!still) this.fx.step(dtr * (g.world.slowmo || 1));
      this.debug.tick(dtr);
      this.render(dtr);
      this.frames++;
      this.fpsT += dtr;
      if (this.fpsT > 1) { this.fpsText = this.frames + ' fps · ' + this.renderer.stats.draws + ' dc · ' + Math.round(this.renderer.stats.tris / 1000) + 'k'; this.frames = 0; this.fpsT = 0; }
    }

    updateCameraYaw(dt) {
      const g = this.game, pl = g.world.player;
      const s = this.settings.sens || 1;
      const fp = this.camMode >= FP;
      const sc = pl.scope ? 0.25 + this.scopeZoom * 0.5 : fp && !pl.veh && this.mouse.r ? 0.7 : 1;
      if (this.mouse.dx || this.mouse.dy) {
        this.camYaw = N.wrap(this.camYaw + this.mouse.dx * 0.0032 * s * sc);
        this.camPitch = N.clamp(this.camPitch + this.mouse.dy * 0.0028 * s * sc * (this.settings.invert ? -1 : 1), fp ? -1.3 : -0.75, fp ? 1.35 : 1.2);
        this.lastMouseT = this.t;
        this.mouse.dx = 0;
        this.mouse.dy = 0;
      }
      const v = pl.veh;
      if (v && !v.spec.turret) {
        const look = this.keys.has('q') ? -Math.PI / 2 : this.keys.has('e') ? Math.PI / 2 : this.keys.has('behind') ? Math.PI : 0;
        const target = v.yaw + look + (Math.abs(v.spd) > 1 && v.spd < -1 ? 0 : 0);
        if (this.t - this.lastMouseT > 1.6 || look) {
          const k = Math.min(1, dt * (look ? 12 : 2.8 + Math.min(3, Math.abs(v.spd) * 0.15)));
          this.camYaw = N.wrap(this.camYaw + N.wrap(target - this.camYaw) * k);
          this.camPitch = N.lerp(this.camPitch, this.camMode === FP ? (v.spec.type === 'bike' ? 0.34 : 0.1) : this.camMode === BUMPER ? 0.03 : 0.2, Math.min(1, dt * 1.5));
        }
      } else if (!fp && this.t - this.lastMouseT > 3 && !this.mouse.r && Math.hypot(pl.vx, pl.vz) > 2) {
        this.camYaw = N.wrap(this.camYaw + N.wrap(pl.yaw - this.camYaw) * Math.min(1, dt * 1.2));
      }
      if (pl.scope && this.mouse.wheel) this.scopeZoom = N.clamp(this.scopeZoom - this.mouse.wheel * 0.12, 0, 1);
      if (pl.tir && g.world.park) {
        const T = g.world.park.tir.T, base = N.yawOf(-T.s, T.c);
        this.camYaw = N.wrap(base + N.clamp(N.wrap(this.camYaw - base), -0.52, 0.52));
        this.camPitch = N.clamp(this.camPitch, -0.32, 0.26);
      }
    }

    afterStep() {
      const g = this.game, w = g.world;
      const A = this.audio;
      const pl = w.player;
      const lis = { x: pl.x, z: pl.z, yaw: this.camYaw };
      const mute = !A.on;
      let hits = 0;
      for (const e of w.ev) {
        switch (e.t) {
          case 'shot': {
            const W = N.WEAPONS[e.w] || N.VEH_GUNS[e.w] || {};
            if (!mute) A.play(W.sound || 'pistol', e.x, e.z, lis);
            this.fx.muzzle(e.x, e.y, e.z, e.dx === undefined ? null : [e.dx, e.dy, e.dz], e.w);
            if (e.p && e.dx !== undefined) this.shotFx(e, W, e.p === pl);
            if (e.p === pl && !pl.veh && this.fpFoot() && W.kick) this.camPitch = Math.max(-1.3, this.camPitch - W.kick[1] * 0.12);
            break;
          }
          case 'molotov': this.fx.molotov(e.x, e.y, e.z); if (!mute) { A.play('glass', e.x, e.z, lis); A.play('molotov', e.x, e.z, lis); } break;
          case 'ignite': for (let i = 0; i < 4; i++) this.fx.flameLick(e.x, e.p.y + 0.4 + i * 0.3, e.z, 0.6); if (!mute) A.play('ignite', e.x, e.z, lis); break;
          case 'steam': case 'fizzle': this.fx.steam(e.x, e.y, e.z); if (!mute) A.play('steam', e.x, e.z, lis); break;
          case 'tracer': this.fx.tracer([e.x0, e.y0, e.z0], [e.x1, e.y1, e.z1], e.w, e.k); break;
          case 'blood': this.fx.blood(e.x, e.y, e.z); break;
          case 'spark':
            if (e.mat) { this.chips(e.mat === 'stone' ? 'concrete' : 'wood', e.x, e.y, e.z, 6, 0.7); if (e.mat === 'stone') this.fx.sparks(e.x, e.y, e.z, 3); if (!mute && Math.random() < 0.5) A.play(e.mat === 'stone' ? 'stone' : 'knock', e.x, e.z, lis); break; }
            this.fx.sparks(e.x, e.y, e.z, e.metal ? 8 : 4); this.fx.impact(e.x, e.y, e.z); if (!mute && Math.random() < 0.3) A.play('ric', e.x, e.z, lis); if (e.ground) this.fx.dust(e.x, e.y, e.z); break;
          case 'rustle': this.leaves(e); if (!mute) A.play('rustle', e.x, e.z, lis, e.big ? 1.4 : e.p ? 0.6 : 1); break;
          case 'explosion': {
            this.fx.explosion(e.x, e.y, e.z, e.r);
            if (!mute) A.play('explosion', e.x, e.z, lis);
            const d = Math.hypot(e.x - pl.x, e.z - pl.z);
            this.fx.shake = Math.max(this.fx.shake, N.clamp(1.4 - d / 40, 0, 1.4));
            break;
          }
          case 'helidown': this.fx.explosion(e.x, e.y, e.z, 3); if (!mute) A.play('explosion', e.x, e.z, lis); break;
          case 'crash': if (!mute) A.play('crash', e.x, e.z, lis, e.force); if (e.force > 8) this.fx.sparks(e.x, e.v.y + 0.6, e.z, 10); if (e.v === pl.veh) this.fx.shake = Math.max(this.fx.shake, Math.min(0.6, e.force * 0.04)); break;
          case 'runover': if (!mute) A.play('thud', e.x, e.z, lis); this.fx.blood(e.x, 0.8, e.z); break;
          case 'scrape': this.fx.sparks(e.x, e.y, e.z, 5, [255, 210, 120]); if (!mute) A.play('scrape', e.x, e.z, lis, e.force); break;
          case 'land': if (!mute) A.play('thud', e.x, e.z, lis); if (e.v === pl.veh) this.fx.shake = Math.max(this.fx.shake, Math.min(0.35, e.force * 0.04)); break;
          case 'swing': if (!mute) A.play('swing', e.p.x, e.p.z, lis); break;
          case 'hit': if (!mute) A.play(e.blade ? 'stab' : 'punch', e.x, e.z, lis); if (e.blade) this.fx.blood(e.x, e.y, e.z); break;
          case 'wasted': if (!mute) A.play('wasted'); break;
          case 'busted': if (!mute) A.play('busted'); break;
          case 'pickup': if (!mute) A.play(e.k.type === 'money' || e.k.type === 'stash' ? 'money' : 'pickup'); break;
          case 'wanted': if (e.up && !mute) A.play('wanted'); break;
          case 'passed': if (!mute) A.play('pass'); break;
          case 'failed': if (!mute) A.play('fail'); break;
          case 'pager': if (!mute) A.play('pager'); break;
          case 'horn': if (!mute) A.play('horn', e.v.x, e.v.z, lis); break;
          case 'pbreak': this.propBreak(e, lis, mute); break;
          case 'phit': if (hits++ < 4) this.propHit(e, lis, mute); break;
          case 'pshot': this.propShot(e, lis, mute); break;
          case 'click': if (e.p === pl && !mute) A.play('click'); break;
          case 'throw': if (!mute) A.play('swing', e.p.x, e.p.z, lis); break;
          case 'bounce': if (!mute) A.play('bounce', e.x, e.z, lis); break;
          case 'enter': if (e.v.spec.type === 'bike' && !mute) A.play('door', pl.x, pl.z, lis); if (e.v.spec.turret) g.msg.radio = { text: e.v.spec.name, sub: 'ЛКМ — ' + N.VEH_GUNS[e.v.spec.turret.main].name + ', ПКМ — ' + N.VEH_GUNS[e.v.spec.turret.coaxGun].name + '. Башня идёт за мышью.', t: 6 }; else this.showRadio(false); break;
          case 'rsnd': if (!mute) A.play(e.k, e.x, e.z, lis); if (e.p && (e.k === 'eject' || e.k === 'pump')) this.shells(e.p, e.k === 'pump' ? 1 : Math.min(6, N.WEAPONS[e.p.weapon].clip || 1)); break;
          case 'door': if (!mute) A.play(e.open ? 'dooropen' : 'doorclose', e.v.x, e.v.z, lis); break;
          case 'mdoor': if (!mute) A.play(e.open ? 'mdooropen' : 'mdoorclose', e.x, e.z, lis); break;
          case 'mbrake': if (!mute) A.play('mbrake', e.x, e.z, lis); break;
          case 'mhorn': if (!mute) A.play('mhorn', e.x, e.z, lis); break;
          case 'mfare': if (!mute) A.play(e.ok ? 'mtoken' : 'mslam', e.x, e.z, lis); break;
          case 'mdodge': if (!mute) A.play('mwhistle', e.x, e.z, lis); break;
          case 'locked': if (!mute) A.play('click'); break;
          case 'splash': this.fx.splash(e.x, e.y, e.z, e.big ? 24 : 10, e.big ? 1 : 0.55); if (!mute) A.play(e.big ? 'splash' : 'wade', e.x, e.z, lis); break;
          case 'drowning': this.fx.splash(e.x, e.y, e.z, 16, 0.8); if (!mute) A.play('flail', e.x, e.z, lis); break;
          case 'gulp': this.fx.bubbles(e.x, e.y, e.z); this.fx.ripple(e.x, e.y, e.z, 0.2, 1.8, 1.6); if (!mute) A.play('gulp', e.x, e.z, lis); break;
          case 'hurt': this.hud.hurtFlash = Math.min(0.5, this.hud.hurtFlash + e.amount * 0.02); break;
          case 'jumpstart': w.slowmo = 0.45; this.jumpCam = { t: 0, x: pl.x + Math.sin(pl.veh ? pl.veh.yaw + 1.2 : 0) * 14, z: pl.z - Math.cos(pl.veh ? pl.veh.yaw + 1.2 : 0) * 14 }; break;
          case 'jumpend': w.slowmo = 1; this.jumpCam = null; break;
          case 'say': g.bark(e.p, e.text); break;
          case 'sfx': if (!mute) A.play(e.k, e.x, e.z, lis); break;
          case 'buy': case 'respray': if (!mute) A.play('money'); break;
          case 'cheat': if (!mute) A.play('pass'); break;
          case 'thunder': if (!mute) A.thunder(e.delay, e.d); break;
          case 'teleport': this.camPos = null; break;
          case 'tirstart': { const T = w.park.tir.T; this.camYaw = N.yawOf(-T.s, T.c); this.camPitch = -0.03; this.camPos = null; break; }
          case 'tirhit': if (!mute) A.play(e.kind === 'bell' ? 'tirbell' : 'tirhit', e.x, e.z, lis); this.fx.sparks(e.x, e.y, e.z, 3, [255, 236, 170]); break;
          case 'tirmiss': if (!mute) A.play('tirmiss', e.x, e.z, lis); this.chips('concrete', e.x, e.y, e.z, 2, 0.3); break;
          case 'tirend': if (!mute) A.play(e.hits >= e.shots ? 'pass' : 'pickup'); break;
          case 'chew': if (!mute) A.play(e.drink ? 'gulp2' : 'chew', e.x, e.z, lis); break;
          case 'eatdone': if (!mute && e.burp) A.play('burp', e.x, e.z, lis); if (e.p === pl && e.id !== 'kvass' && Math.random() < 0.35 && !g.subs.length) g.say('tyoma', ['Вот это я понимаю — шаурма.', 'Лучше, чем баланда.', 'Восемь лет такого не ел.', 'Жить можно.'][Math.floor(Math.random() * 4)]); break;
          case 'ticket': if (!mute) A.play('ticket'); break;
          case 'ride': this.camPos = null; if (e.on) { this.camPitch = Math.min(this.camPitch, 0.05); } break;
          case 'weather': this.forecast(e.kind); break;
        }
      }
      w.ev.length = 0;
      this.burning(w, pl, lis, mute);
      if (pl.ride && !mute) { this.creakT = (this.creakT || 0) - N.TICK; if (this.creakT <= 0) { this.creakT = 2.5 + Math.random() * 3; A.play('creak', pl.x, pl.z, lis); } }
      this.hud.hurtFlash = Math.max(0, this.hud.hurtFlash - N.TICK * 0.8);
      if (pl.swim && !pl.dead) this.hud.hurtFlash = Math.max(this.hud.hurtFlash, 0.1 + 0.08 * Math.sin(w.t * 9));
      this.feet(w, lis, mute);
      for (const v of w.vehs) {
        if (v.sink > 0 && !this.sinkSeen.has(v.id)) { this.sinkSeen.add(v.id); this.fx.splash(v.x, (v.wl !== undefined ? v.wl : N.WATER_Y) + 0.05, v.z, 26, 1.3); if (!mute) A.play('splash', v.x, v.z, lis); }
        const d = Math.abs(v.x - pl.x) + Math.abs(v.z - pl.z);
        if (d > 160) continue;
        if (v.smoke > 0 && Math.random() < v.smoke * 0.35) {
          const p = N.Phys.point(v, 0, v.spec.shape.belt + 0.1, (N.Phys.handling(v.spec).rearEngine ? 1 : -1) * v.spec.hl * 0.6, VP);
          this.fx.smoke(p.x, p.y, p.z, v.smoke > 0.7 || v.dead);
        }
        if (v.fire && Math.random() < 0.35 * v.fire) this.fx.smoke(v.x, v.y + 2.2, v.z, true, 1.3);
        if (w.wx.wet > 0.3 && Math.abs(v.spd) > 9 && !v.air && d < 70 && Math.random() < w.wx.wet * 0.7) {
          const fx0 = Math.sin(v.yaw), fz0 = -Math.cos(v.yaw), rx = -fz0, rz = fx0, s = Math.random() < 0.5 ? -1 : 1;
          this.fx.spray(v.x - fx0 * v.spec.hl * 0.75 + rx * v.spec.hw * 0.8 * s, v.y, v.z - fz0 * v.spec.hl * 0.75 + rz * v.spec.hw * 0.8 * s, v.vx, v.vz);
        }
        this.skidMarks(v, d);
      }
      for (const h of [w.heli, w.drop]) {
        if (!h || !(h.down || h.hp < h.maxHp * 0.45)) continue;
        if (Math.random() < 0.5) this.fx.smoke(h.x, h.y + 0.8, h.z, true, 1.4);
        if (h.down && Math.random() < 0.5) this.fx.flameLick(h.x, h.y + 0.5, h.z, 1.4);
      }
      const v = pl.veh;
      let sirenD = null;
      for (const c of w.vehs) if (c.siren && !c.dead && c.livery && N.SIRENS.has(c.spec.liveries[c.livery].beacon)) { const d = Math.hypot(c.x - pl.x, c.z - pl.z); if (sirenD === null || d < sirenD) sirenD = d; }
      if (A.on) {
        A.updateWeather(w.wx.rain, !!v, this.city.inside(pl.x));
        A.updateEngine(v, v ? Math.abs(v.spd) / v.spec.vmax : 0, v ? v.ctl.thr : 0, v ? v.slip || 0 : 0, sirenD, !v);
        A.updateMachines(...this.machines(w, pl, v));
        A.updateMetro(w.metro ? w.metro.sound() : null);
        const sta = v && v.driver === pl ? N.carStation(v) : N.RADIO.length;
        A.setRadio(sta, sta < N.RADIO.length && !g.cut && this.state === 'play', g.speaking());
      }
    }

    skidMarks(v, d) {
      const H = N.Phys.handling(v.spec), S = v.skidP || (v.skidP = [null, null, null, null]);
      const on = d < 90 && !v.air && v.wheels >= 3 && !H.track && (v.slip > 0.3 || v.spin) && Math.hypot(v.vx, v.vz) + (v.spin ? 2 : 0) > 1.5;
      const front = v.slip > 0.5 || v.spin && v.spec.drive !== 'rwd', rear = v.slip > 0.3 || v.spin && v.spec.drive !== 'fwd';
      for (let i = 0; i < 4; i++) {
        if (!on || (i < 2 ? !front : !rear) || (H.bike && i % 2)) { S[i] = null; continue; }
        const p = N.Phys.point(v, H.bike ? 0 : (i % 2 ? 0.5 : -0.5) * H.tw, 0, (i < 2 ? -0.5 : 0.5) * H.wb, VP);
        const g = this.city.groundY(p.x, p.z);
        if (!S[i]) S[i] = [p.x, p.z];
        else if (Math.hypot(p.x - S[i][0], p.z - S[i][1]) > 0.45) { this.fx.skid(S[i][0], S[i][1], p.x, p.z, g + 0.035, v.slip > 0.5 ? 150 : 110); S[i][0] = p.x; S[i][1] = p.z; }
        if (d < 60 && Math.random() < (v.ctl.burn ? 0.55 : 0.2)) this.fx.tire(p.x, g, p.z);
      }
    }

    machines(w, pl, v) {
      let arm = null, ad = 150, heli = null;
      for (const c of w.vehs) {
        if (!c.spec.shape.hatch || c.dead || !c.driver) continue;
        const d = c === v ? 0 : Math.hypot(c.x - pl.x, c.z - pl.z);
        if (d < ad) { ad = d; arm = c; }
      }
      for (const h of [w.heli, w.drop]) {
        if (!h) continue;
        const d = Math.hypot(h.x - pl.x, h.y - pl.y, h.z - pl.z);
        if (!heli || d < heli.d) heli = { d, rate: h.type === 'mi2' ? 11 : 8 };
      }
      return [arm ? { d: ad, spd: Math.abs(arm.spd), thr: Math.abs(arm.ctl.thr), track: arm.spec.drive === 'track' } : null, heli];
    }

    shotFx(e, W, mine) {
      const p = e.p, G = N.WGRIP[e.w];
      if (W.brass && G) {
        const back = Math.max(0.05, -G.tip[2] - 0.1), yw = p.yaw || 0;
        this.fx.brass(e.x - e.dx * back, e.y - e.dy * back, e.z - e.dz * back, Math.cos(yw), Math.sin(yw), p.y, !!W.heavy);
      }
      if (W.rocket) this.fx.backblast(e.x - e.dx * 0.95, e.y - e.dy * 0.95, e.z - e.dz * 0.95, -e.dx, -e.dy, -e.dz);
      if (W.radius) this.fx.backblast(e.x + e.dx * 0.6, e.y + e.dy * 0.6, e.z + e.dz * 0.6, e.dx, e.dy, e.dz);
      if (mine && (W.heavy || W.rocket || W.radius)) this.fx.shake = Math.max(this.fx.shake, W.radius ? 0.6 : W.rocket ? 0.35 : 0.1);
    }

    shells(p, n) {
      const fx = Math.sin(p.yaw || 0), fz = -Math.cos(p.yaw || 0);
      for (let i = 0; i < n; i++) this.fx.brass(p.x + fx * 0.35, p.y + 1.0, p.z + fz * 0.35, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, p.y, true);
    }

    chips(mat, x, y, z, n, sp) {
      const f = this.fx, r = Math.random, k = sp || 1;
      for (let i = 0; i < n; i++) {
        const base = { x: x + (r() - 0.5) * 0.3, y: y + r() * 0.3, z: z + (r() - 0.5) * 0.3, vx: (r() - 0.5) * 5 * k, vy: (1 + r() * 3.5) * k, vz: (r() - 0.5) * 5 * k, t: 0, a: 1, grav: true, lit: true, rot: r() * 6.28 };
        if (mat === 'wood') f.add(Object.assign(base, { life: 0.9 + r() * 0.7, s0: 0.3, s1: 0.22, cell: 3, col: r() < 0.5 ? [176, 132, 86] : [214, 180, 130] }));
        else if (mat === 'concrete') f.add(Object.assign(base, { life: 0.7 + r() * 0.5, s0: 0.15, s1: 0.1, cell: 11, col: [156, 150, 142] }));
        else if (mat === 'glass') f.add(Object.assign(base, { life: 0.6 + r() * 0.5, s0: 0.1, s1: 0.07, cell: 11, col: [205, 228, 238] }));
        else f.add(Object.assign(base, { life: 0.6 + r() * 0.4, s0: 0.12, s1: 0.08, cell: 11, col: [96, 100, 98] }));
      }
      if (mat === 'concrete' || mat === 'wood') for (let i = 0; i < Math.ceil(n / 4); i++) f.add({ x: x + (r() - 0.5) * 0.6, y: y + r() * 0.4, z: z + (r() - 0.5) * 0.6, vx: (r() - 0.5) * 1.2, vy: 0.4 + r() * 0.6, vz: (r() - 0.5) * 1.2, t: 0, life: 1.4 + r(), s0: 0.5, s1: 2.0, cell: 1, col: mat === 'wood' ? [150, 130, 104] : [160, 156, 148], a: 0.5, drag: 1.5, rot: r() * 6, lit: true });
    }

    leaves(e) {
      const f = this.fx, r = Math.random, n = e.big ? 16 : e.p ? 4 : 9, dry = e.kind === 'hedge' || e.kind === 'acacia';
      const cols = e.kind === 'jasmine' || e.kind === 'spiraea' ? [[92, 132, 52], [236, 236, 226]] : e.kind === 'rosehip' ? [[92, 132, 52], [230, 150, 170]] : dry ? [[96, 128, 50], [150, 160, 70]] : [[70, 116, 44], [128, 160, 64]];
      for (let i = 0; i < n; i++) {
        const c = cols[i % 2], k = 0.8 + r() * 0.35;
        f.add({ x: e.x + (r() - 0.5) * 1.6, y: e.y + (r() - 0.3) * 0.8, z: e.z + (r() - 0.5) * 1.6, vx: (e.vx || 0) * 0.35 + (r() - 0.5) * 3, vy: 0.8 + r() * 2.2, vz: (e.vz || 0) * 0.35 + (r() - 0.5) * 3, t: 0, life: 1.6 + r() * 1.4, s0: 0.11, s1: 0.1, cell: i % 3 ? 11 : 3, col: [c[0] * k | 0, c[1] * k | 0, c[2] * k | 0], a: 1, grav: true, drag: 2.6, lit: true, rot: r() * 6.28 });
      }
    }

    propBreak(e, lis, mute) {
      const A = this.audio, f = this.fx, r = Math.random, big = e.pieces > 1;
      const snd = e.mat === 'wood' ? 'wood' : e.mat === 'concrete' ? 'crunch' : e.mat === 'glass' ? 'glass' : e.kind === 'fence' || e.kind === 'rail' || e.kind === 'picket' ? 'rattle' : 'clang';
      if (!mute) A.play(snd, e.x, e.z, lis, big ? 5 : 2);
      this.chips(e.mat === 'glass' ? 'metal' : e.mat, e.x, e.y, e.z, big ? 16 : 7, big ? 1.2 : 0.8);
      if (e.glass) {
        if (!mute) A.play('glass', e.glass[0], e.glass[2], lis);
        this.chips('glass', e.glass[0], e.glass[1], e.glass[2], 18, 1);
        if (e.kind !== 'phone') f.sparks(e.glass[0], e.glass[1], e.glass[2], 12, [255, 230, 180]);
      }
      if (e.fruit) {
        const c = N.hex(e.fruit);
        for (let i = 0; i < 12; i++) f.add({ x: e.x, y: e.y + 0.1, z: e.z, vx: (r() - 0.5) * 6, vy: 1.5 + r() * 3, vz: (r() - 0.5) * 6, t: 0, life: 1.6 + r(), s0: 0.17, s1: 0.15, cell: 11, col: [c[0], c[1], c[2]], a: 1, grav: true, lit: true });
      }
      if (e.kind === 'bin' && big) for (let i = 0; i < 14; i++) f.add({ x: e.x, y: e.y + 0.6, z: e.z, vx: (r() - 0.5) * 4, vy: 2 + r() * 3, vz: (r() - 0.5) * 4, t: 0, life: 2 + r() * 1.5, s0: 0.32, s1: 0.28, cell: 3, col: r() < 0.6 ? [226, 222, 208] : [120, 140, 170], a: 1, grav: true, drag: 1.2, lit: true, rot: r() * 6 });
      if (big && e.mat !== 'wood') f.impact(e.x, e.y, e.z);
    }

    propHit(e, lis, mute) {
      const k = Math.min(1.4, e.f / 6 * Math.sqrt(Math.max(0.2, e.m / 20)));
      if (!mute) this.audio.play(e.mat === 'wood' ? 'knock' : e.mat === 'concrete' ? 'thud' : 'clank', e.x, e.z, lis, k);
      if (e.mat === 'concrete' || e.m > 100) this.fx.dust(e.x, e.y - 0.2, e.z);
    }

    propShot(e, lis, mute) {
      const A = this.audio;
      if (e.mat === 'wood') { this.chips('wood', e.x, e.y, e.z, 4, 0.7); if (!mute) A.play('knock', e.x, e.z, lis, 0.8); }
      else if (e.mat === 'concrete') { this.chips('concrete', e.x, e.y, e.z, 4, 0.7); this.fx.impact(e.x, e.y, e.z); }
      else if (e.mat === 'glass') { this.chips('glass', e.x, e.y, e.z, 8, 0.8); if (!mute) A.play('glass', e.x, e.z, lis); }
      else { this.fx.sparks(e.x, e.y, e.z, 6); this.fx.impact(e.x, e.y, e.z); if (!mute) A.play(Math.random() < 0.5 ? 'ric' : 'clank', e.x, e.z, lis, 0.7); }
    }

    burning(w, pl, lis, mute) {
      const A = this.audio, near = (x, z, d) => Math.abs(x - pl.x) + Math.abs(z - pl.z) < d;
      for (const g of w.projs) {
        if (g.type === 'rocket' && g.t > 0.04 && near(g.x, g.z, 260)) this.fx.trail(g.x, g.y, g.z, g.dx, g.dy, g.dz, g.sp * N.TICK);
        if (g.type === 'shell' && near(g.x, g.z, 320)) this.fx.tracer([g.px, g.py, g.pz], [g.x, g.y, g.z], g.gun, 0);
      }
      for (const f of w.fires) {
        if (!near(f.x, f.z, 160)) continue;
        const r = f.cur || 0;
        if (Math.random() < 0.3 + r * 0.1) this.fx.flameLick(f.x, f.y + 0.1, f.z, r * 1.6);
        if (Math.random() < 0.12 + r * 0.04) this.fx.smoke(f.x + (Math.random() - 0.5) * r, f.y + 1.2, f.z + (Math.random() - 0.5) * r, true, 0.6 + r * 0.3);
        if (!mute && Math.random() < 0.05) A.play('crackle', f.x, f.z, lis);
      }
      for (const p of w.peds) {
        if (!(p.burn > 0) || p.veh || !near(p.x, p.z, 120)) continue;
        if (Math.random() < 0.5) this.fx.flameLick(p.x, p.y + (p.dead ? 0.1 : 0.4 + Math.random()), p.z, 0.5);
        if (Math.random() < 0.1) this.fx.smoke(p.x, p.y + 1.6, p.z, true, 0.4);
        if (!mute && Math.random() < 0.03) A.play('crackle', p.x, p.z, lis);
      }
    }

    feet(w, lis, mute) {
      const A = this.audio, pl = w.player;
      const steps = this.stepPh || (this.stepPh = new WeakMap());
      let n = 0;
      for (const p of w.peds) {
        if (p.veh || p.dead || p.hidden) continue;
        const d = Math.abs(p.x - pl.x) + Math.abs(p.z - pl.z);
        if (d > 30 || (p !== pl && n > 8)) continue;
        n++;
        if (p.swim) {
          if (Math.random() < 0.18) this.fx.drops(p.x + (Math.random() - 0.5) * 0.8, p.wl, p.z + (Math.random() - 0.5) * 0.8, 0, 0);
          if (Math.random() < 0.05 && !mute) A.play('flail', p.x, p.z, lis);
          if (p.swim.under && Math.random() < 0.3) this.fx.bubbles(p.x, p.wl, p.z);
          continue;
        }
        const k = Math.floor((p.anim.phase || 0) / Math.PI);
        const was = steps.get(p);
        steps.set(p, k);
        const sp = Math.hypot(p.vx, p.vz);
        if (was === undefined || was === k || sp < 0.4 || !p.onGround && !(p.wade > 0.3)) continue;
        const side = k % 2 ? 1 : -1, c = Math.cos(p.yaw), s = Math.sin(p.yaw);
        const fx = p.x + c * side * 0.1 + s * 0.15, fz = p.z + s * side * 0.1 - c * 0.15;
        if (p.wade > 0.06 && p.wl !== null && p.wl !== undefined) {
          this.fx.drops(fx, p.wl, fz, p.vx, p.vz);
          if (!mute) A.play('wade', fx, fz, lis, p === pl ? 1 : 0.6);
        } else if (!mute) A.play('step', fx, fz, lis, (p === pl ? 1 : 0.55) * N.clamp(sp / 4, 0.4, 1.4));
      }
    }

    computeCamera(dt) {
      const g = this.game, w = g.world, pl = w.player, city = this.city;
      if (this.photo.on) return this.photo.camera();
      const cc = g.cutCamera();
      let cam;
      if (this.demo) {
        const a = this.t * 0.03;
        const p = city.places.hotel_door;
        cam = { x: p.x - 90 + Math.cos(a) * 60, y: 38, z: p.z + Math.sin(a) * 90, tx: p.x + 40, ty: 12, tz: p.z - 20, fov: 1.0 };
        return cam;
      }
      if (cc) {
        cam = { x: cc.from[0], y: cc.from[1], z: cc.from[2], tx: cc.to[0], ty: cc.to[1], tz: cc.to[2], fov: cc.fov || 0.95 };
        this.camPos = null;
        return cam;
      }
      const v = pl.veh;
      if (this.jumpCam && v) {
        this.jumpCam.t += dt;
        return { x: this.jumpCam.x, y: v.y + 4, z: this.jumpCam.z, tx: v.x, ty: v.y + 1, tz: v.z, fov: 0.9 };
      }
      if (g.death) {
        const a = this.t * 0.25;
        const py = pl.wl !== null && pl.wl !== undefined ? Math.max(pl.y, pl.wl - 0.4) : pl.y;
        return { x: pl.x + Math.cos(a) * 6, y: py + 4.5, z: pl.z + Math.sin(a) * 6, tx: pl.x, ty: py + 0.5, tz: pl.z, fov: 1.0 };
      }
      const yaw = this.camYaw, pitch = this.camPitch;
      const fx = Math.sin(yaw) * Math.cos(pitch), fy = -Math.sin(pitch), fz = -Math.cos(yaw) * Math.cos(pitch);
      const W = N.WEAPONS[pl.weapon];
      const aiming = !v && this.mouse.r && !W.melee && !W.throw;
      if (aiming && W.scope) {
        const ex = pl.x, ey = pl.y + 1.62, ez = pl.z;
        const zm = W.zoom || [0.62, 0.12];
        const fov = N.lerp(zm[0], zm[1], this.scopeZoom);
        this.camPos = null;
        return { x: ex, y: ey, z: ez, tx: ex + fx * 10, ty: ey + fy * 10, tz: ez + fz * 10, fov, scope: true };
      }
      if (pl.tir && w.park) {
        const ex = pl.x, ey = pl.y + 1.52 * ((pl.look && pl.look.tall) || 1), ez = pl.z, rx = Math.cos(yaw), rz = Math.sin(yaw);
        const cx = ex - fx * 0.62 + rx * 0.3, cy = ey + 0.1, cz = ez - fz * 0.62 + rz * 0.3;
        this.camPos = null;
        return { x: cx, y: cy, z: cz, tx: cx + fx * 10, ty: cy + fy * 10, tz: cz + fz * 10, fov: 0.6, tir: true };
      }
      const eye = !v && this.camMode !== 3 ? (w.metro && w.metro.eye()) || (w.park && (this.camMode === 0 || this.camMode === FP) && w.park.eye()) : null;
      if (eye) {
        const lean = pl.ride ? N.clamp((pitch - 0.1) * 1.3, 0, 0.55) : 0;
        const ex = eye.x + Math.sin(yaw) * (0.1 + lean), ez = eye.z - Math.cos(yaw) * (0.1 + lean), ey = eye.y - lean * 0.3;
        if (!this.wasFp) { this.camPitch = Math.min(this.camPitch, 0.1); this.wasFp = true; }
        this.camPos = null;
        return { x: ex, y: ey, z: ez, tx: ex + fx * 10, ty: ey + fy * 10, tz: ez + fz * 10, fov: 1.15, fp: true };
      }
      if (this.wasFp) { this.wasFp = false; this.camPos = null; }
      if (this.camMode >= FP) {
        this.camPos = null;
        if (!v) return this.headCamera(pl, [fx, fy, fz], aiming, dt);
        if (this.camMode === FP) return v.spec.turret ? this.hatchCamera(v, [fx, fy, fz]) : this.cabinCamera(v, yaw, pitch, dt);
        return this.bumperCamera(v, yaw, pitch);
      }
      if (this.camPitch < -0.75) this.camPitch = -0.75;
      let tx, ty, tz, dist, fov = 1.05;
      const dm = [0.72, 1, 1.45, 1][this.camMode];
      if (v) {
        tx = v.x; ty = v.y + v.spec.shape.H * 0.7 + (v.spec.turret ? 1.7 : 0.8); tz = v.z;
        dist = (v.spec.shape.L * 1.1 + (v.spec.turret ? 5.6 : 3.6)) * dm;
        fov = 1.08 + N.clamp(Math.abs(v.spd) / 60, 0, 0.18);
      } else {
        tx = pl.x; ty = pl.y + 1.55; tz = pl.z;
        dist = 4.4 * dm;
        if (aiming) { const rx = Math.cos(yaw), rz = Math.sin(yaw); tx += rx * 0.6; tz += rz * 0.6; ty += 0.1; dist = 2.3; fov = 0.9; }
        else if (pl.charging > 0 && W.throw) { const rx = Math.cos(yaw), rz = Math.sin(yaw); tx += rx * THROW_SHOULDER; tz += rz * THROW_SHOULDER; ty += 0.45; }
      }
      if (this.camMode === 3) {
        const h = v ? 38 + Math.abs(v.spd) * 0.8 : 26;
        cam = { x: tx - fx * 2, y: ty + h, z: tz - fz * 2 + 0.01, tx, ty, tz, fov: 1.0 };
        this.camPos = null;
        return cam;
      }
      const inside = city.inside(pl.x), metro = inside && city.inMetro(pl.x, pl.z);
      let d = dist;
      const ghost = w.fly && !v || !!pl.ride;
      const hit = ghost ? null : N.Phys.rayStatic(city, tx, ty, tz, -fx, -fy, -fz, dist + 0.4, w, true);
      if (hit && (!inside || metro)) d = Math.max(0.8, hit.t - 0.35);
      if (inside) d = Math.min(d, metro ? 3.2 : 3.5);
      if (metro && w.metro) d = Math.min(d, w.metro.camRoom(tx, ty, tz, -fx, -fy, -fz, d));
      let cx = tx - fx * d, cy = ty - fy * d, cz = tz - fz * d;
      const wa = city.ground(cx, cz) === N.GT.WATER ? city.waterAt(cx, cz) : null;
      const gy = Math.max(metro && w.metro ? w.metro.floorY(cx, cz, pl.y + 0.5) : city.groundY(cx, cz), wa ? wa.level : -99) + 0.4;
      if (cy < gy && !ghost) cy = gy;
      if (this.camPos && !aiming) {
        const k = Math.min(1, dt * (v ? 10 : 14));
        cx = N.lerp(this.camPos[0], cx, k); cy = N.lerp(this.camPos[1], cy, k); cz = N.lerp(this.camPos[2], cz, k);
      }
      this.camPos = [cx, cy, cz];
      const sh = this.fx.shake;
      const sx = sh ? (Math.random() - 0.5) * sh * 0.5 : 0, sy = sh ? (Math.random() - 0.5) * sh * 0.5 : 0;
      return { x: cx + sx, y: cy + sy, z: cz, tx: tx + fx * 20, ty: ty + fy * 20, tz: tz + fz * 20, fov };
    }

    eyeOf(pl) {
      const e = this.scene && this.scene.selfEye, ref = pl.veh || pl;
      if (!e || e.ref !== ref || this.t - e.t > 0.2 || this.t < e.t) return null;
      return [e.x + ref.x - e.rx, e.y + ref.y - e.ry, e.z + ref.z - e.rz];
    }

    shake() {
      const sh = this.fx.shake;
      return sh ? [(Math.random() - 0.5) * sh * 0.25, (Math.random() - 0.5) * sh * 0.25] : [0, 0];
    }

    headCamera(pl, d, aiming, dt) {
      const tall = (pl.look && pl.look.tall) || 1;
      const e = this.eyeOf(pl) || [pl.x + Math.sin(pl.yaw) * 0.13, pl.y + (1.5 + N.PED_EYE[1]) * tall, pl.z - Math.cos(pl.yaw) * 0.13];
      if (pl.wl !== null && pl.wl !== undefined && !(pl.swim && pl.swim.under)) e[1] = Math.max(e[1], pl.wl + 0.1);
      this.ads = N.approach(this.ads || 0, aiming && pl.anim.aim > 0.8 ? 1 : 0, dt * 7);
      const k = N.smooth(0, 1, this.ads);
      this.fpFov = N.lerp(1.15, 0.8, k);
      const sh = this.shake();
      return camAt([e[0] + sh[0], e[1] + sh[1], e[2]], d, { fov: this.fpFov, fp: true, headless: true, ads: k, near: 0.05 });
    }

    headSway(v, dt) {
      const S = this.sway, k = Math.min(1, dt * 5);
      let ar = 0, af = 0;
      if (this.swayV && this.swayV.v === v && dt > 0) {
        const ax = (v.vx - this.swayV.x) / dt, az = (v.vz - this.swayV.z) / dt, s = Math.sin(v.yaw), c = Math.cos(v.yaw);
        af = ax * s - az * c;
        ar = ax * c + az * s;
      }
      this.swayV = { v, x: v.vx || 0, z: v.vz || 0 };
      S[0] = N.lerp(S[0], N.clamp(-ar * 0.004, -0.06, 0.06), k);
      S[1] = N.lerp(S[1], N.clamp(af * 0.005, -0.07, 0.07), k);
      return S;
    }

    cabinCamera(v, yaw, pitch, dt) {
      const pl = this.game.world.player, M = carFrame(v), cab = N.cabin(v.spec), tall = (pl.look && pl.look.tall) || 1;
      let e = this.eyeOf(pl);
      if (!e) {
        e = rot(M, [cab.seat.x, N.seatRoot(cab, tall) + (1.5 + N.PED_EYE[1]) * tall - 0.03, cab.seat.z - 0.04]);
        e[0] += M[9]; e[1] += M[10]; e[2] += M[11];
      }
      const S = this.headSway(v, dt), o = rot(M, [S[0], 0, S[1]]), d = rot(M, lookLocal(N.wrap(yaw - v.yaw), pitch)), sh = this.shake();
      const fov = (cab.bike ? 1.25 : 1.12) + N.clamp(Math.abs(v.spd) / 80, 0, 0.12);
      return camAt([e[0] + o[0] + sh[0], e[1] + o[1] + sh[1], e[2] + o[2]], d, { fov, fp: true, headless: true, cabin: !cab.bike, near: 0.05, up: carUp(M, 0.6) });
    }

    bumperCamera(v, yaw, pitch) {
      const M = carFrame(v), rel = N.wrap(yaw - v.yaw), s = v.spec, back = Math.abs(rel) > Math.PI / 2;
      const p = rot(M, [0, N.clamp((s.shape.clr || 0.2) + 0.42, 0.5, 1.1), (back ? 1 : -1) * (s.hl + 0.24)]), d = rot(M, lookLocal(rel, pitch)), sh = this.shake();
      const fov = 1.12 + N.clamp(Math.abs(v.spd) / 45, 0, 0.24);
      return camAt([p[0] + M[9] + sh[0], p[1] + M[10] + sh[1], p[2] + M[11]], d, { fov, near: 0.1, bumper: true, up: carUp(M, 0.8) });
    }

    hatchCamera(v, d) {
      const M = carFrame(v), T = v.spec.turret, h = v.spec.shape.hatch || [0, T.pivot[1] + T.gun[1], T.pivot[2]];
      const lx = h[0] - T.pivot[0], lz = h[2] - T.pivot[2], ty = Math.hypot(lx, lz) < 1.2 ? v.turretYaw || 0 : 0, c = Math.cos(ty), sn = Math.sin(ty);
      const p = rot(M, [T.pivot[0] + lx * c - lz * sn, h[1] + 0.75, T.pivot[2] + lx * sn + lz * c]), sh = this.shake();
      return camAt([p[0] + M[9] + sh[0], p[1] + M[10] + sh[1], p[2] + M[11]], d, { fov: 1.05, near: 0.1 });
    }

    floraRadii() {
      const fd = N.FLORA_DETAIL[this.settings.city] || N.FLORA_DETAIL.high;
      this.renderer.floraR = fd.near;
      this.renderer.grassR = fd.grass;
    }

    pushers(w, cam) {
      const out = this.pushList || (this.pushList = []), pl = w.player, pv = pl.veh;
      out.length = 0;
      if (pv) out.push([pv.x, pv.z, Math.max(2.2, pv.spec.hl + 0.5), pv.y + pv.spec.shape.H + 0.3]);
      else if (!pl.dead) out.push([pl.x, pl.z, 0.95, pl.y + 1.8]);
      w.near(cam.x, cam.z, 45, e => {
        if (out.length >= 4) return true;
        if (e.kind === 'veh' && e !== pv && !e.dead && Math.abs(e.spd) > 1.5) out.push([e.x, e.z, Math.max(2, e.spec.hl + 0.4), e.y + e.spec.shape.H + 0.3]);
      });
      return out;
    }

    render(dt) {
      const g = this.game, w = g.world, pl = w.player;
      const cam = this.computeCamera(dt);
      this.camState = cam;
      w.cam = { x: cam.x, z: cam.z, yaw: Math.atan2(cam.tx - cam.x, -(cam.tz - cam.z)) };
      const inside = !this.demo && (g.cut ? g.cutCamera().interior || this.city.inside(cam.x) : this.city.inside(pl.x));
      const metro = inside && this.city.inMetro(cam.x, cam.z);
      const interior = metro ? 'metro' : inside;
      const env = N.envFor(w.clock, w.wx, this.settings.draw || 1, interior, metro ? this.metroEnv(cam) : null);
      const lights = this.scene.fill({ world: w, game: this.demo ? null : g, cam, env, fx: this.fx, time: this.t, hideMarkers: !!g.cut, throwAid: !this.demo && !g.cut && this.settings.throwAid !== false, quality: this.settings.gfx, cars: this.settings.cars });
      const death = g.death && !this.demo ? { k: N.clamp(g.death.t / 1.4, 0, 1), tint: g.death.kind === 'busted' ? [0.55, 0.65, 1.0] : [0.7, 0.62, 0.6] } : null;
      const photo = this.photo.on ? this.photo.params(this.renderer.canvas.width, this.renderer.canvas.height) : null;
      if (photo && photo.flash) { if (lights.length >= N.MAX_LIGHTS) lights.pop(); lights.push(photo.flash); }
      this.renderer.render({ cam, env, lights, time: this.t, waves: this.fx.waves, death, ground: interior ? 0 : this.city.groundY(pl.x, pl.z), push: interior ? null : this.pushers(w, cam), photo });
      if (photo) { this.photo.draw(this.hud.g, this.hudc.width, this.hudc.height); return; }
      const st = {
        game: g,
        cut: !!g.cut,
        hideHud: this.demo || this.state === 'menu',
        scope: !!cam.scope,
        crosshair: !pl.veh && !g.cut && (this.mouse.r && !N.WEAPONS[pl.weapon].melee || !!pl.tir || !!cam.headless),
        dot: !!pl.tir,
        fpDot: !pl.veh && !!cam.headless && !(this.mouse.r && !N.WEAPONS[pl.weapon].melee),
        camYaw: this.camYaw,
        prompt: this.prompt(),
        fps: this.opts.debug ? this.fpsText : null
      };
      const tv = pl.veh && pl.veh.driver === pl && pl.veh.spec.turret && !g.cut ? pl.veh : null;
      if (tv && this.state === 'play') st.turret = this.turretState(tv);
      if (!g.cut && !this.demo) st.throwAim = this.throwState(pl);
      if (st.crosshair && this.state === 'play') {
        const inp = { o: [cam.x, cam.y, cam.z] };
        const dx = cam.tx - cam.x, dy = cam.ty - cam.y, dz = cam.tz - cam.z, L = Math.hypot(dx, dy, dz);
        const h = w.raycast(cam.x, cam.y, cam.z, dx / L, dy / L, dz / L, 120, pl);
        st.crossTarget = h && h.kind === 'ped' && !h.ped.dead ? h.ped : null;
      }
      if (this.state === 'play' || this.state === 'paused') this.hud.draw(st);
      else this.hud.g.clearRect(0, 0, this.hudc.width, this.hudc.height);
    }

    turretState(v) {
      const w = this.game.world, pl = w.player, T = v.spec.turret, G = N.VEH_GUNS[T.main];
      const m = w.gunPose(v, false), h = w.raycast(m.x, m.y, m.z, m.dx, m.dy, m.dz, 300, pl), d = h ? h.t : 300;
      const q = this.renderer.project(m.x + m.dx * d, m.y + m.dy * d, m.z + m.dz * d);
      const kx = this.hudc.width / this.glc.width, ky = this.hudc.height / this.glc.height;
      return { gx: q ? q.x * kx : null, gy: q ? q.y * ky : null, name: G.name, reload: G.radius ? v.reloadT / (T.reload || 6) : 0, hp: N.clamp(v.hp / v.maxHp, 0, 1) };
    }

    throwState(pl) {
      const plan = pl.throwPlan;
      if (!(pl.charging > 0) || !plan || pl.veh || pl.dead || !N.WEAPONS[pl.weapon].throw) return null;
      const aid = this.settings.throwAid !== false;
      let people = 0, kills = 0, cars = 0;
      for (const h of plan.hits) {
        if (h.e === pl) continue;
        if (h.e.kind === 'veh') cars++;
        else { people++; if (h.kill) kills++; }
      }
      return { charge: pl.charging, quick: N.throwCharge(N.QUICK_THROW), dist: Math.hypot(plan.x - pl.x, plan.z - pl.z), kind: plan.kind, aid, self: aid && plan.self, fizzle: aid && plan.fizzle, wet: aid && plan.wet, people: aid ? people : 0, kills: aid ? kills : 0, cars: aid ? cars : 0 };
    }

    forecast(kind) {
      const g = this.game, v = g.world.player.veh;
      const st = v && N.RADIO[N.carStation(v)];
      const lines = N.FORECAST[kind];
      if (!v || v.driver !== g.world.player || !st || !lines || g.cut || this.demo) return;
      g.msg.radio = { text: st.name, sub: lines[Math.floor(Math.random() * lines.length)], t: 7 };
    }

    metroEnv(cam) {
      const w = this.game.world, L = this.city.metroLine;
      const aboard = w.metro && w.metro.player.aboard;
      const q = L.nearest(cam.x);
      const hall = Math.abs(cam.x - q.x) < N.METRO.P.end + 2 && cam.y < 4.4;
      return { k: aboard ? 0.95 : L.light(cam.x, cam.z, cam.y), tint: hall ? q.tint : [1, 1, 1] };
    }

    prompt() {
      const g = this.game, w = g.world, pl = w.player;
      if (g.cut || g.shop || g.death || this.state !== 'play' || pl.enter || pl.exit) return null;
      if (pl.tir) return 'ЛКМ — выстрел    F — уйти от стойки';
      if (pl.ride && w.park) return w.park.atBottom(pl.ride.i) ? 'F — выйти из кабинки' : pl.ride.loop ? 'Кабинка идёт по кругу. Выйти — внизу' : 'X — докрутить круг    F — выйти внизу';
      if (w.metro && w.metro.has(pl.x, pl.z) && !pl.veh) {
        const out = [], a = w.metro.seatNear(pl), A = w.metro.player.aboard;
        if (a) out.push('F — ' + a);
        if (A && !g.fade) { const nx = w.metro.skipTime(A.tr); if (nx) out.push('X — пропустить поездку до станции «' + w.metro.L.st[nx.st].name + '»'); }
        if (out.length) return out.join('    ');
      }
      if (pl.veh) return null;
      let best = null, bd = 3.2;
      for (const v of w.vehs) {
        if (v.dead) continue;
        const d = Math.hypot(v.x - pl.x, v.z - pl.z) - v.spec.hl * 0.6;
        if (d < bd) { bd = d; best = v; }
      }
      if (best) return 'F — ' + (best.driver ? 'выкинуть водителя' : 'сесть') + ': ' + best.spec.name;
      return null;
    }

    destroy() {
      this.destroyed = true;
      if (this.raf) cancelAnimationFrame(this.raf);
      for (const [t, ev, fn, o] of this.handlers) t.removeEventListener(ev, fn, o);
      if (this.ro) this.ro.disconnect();
      if (document.exitPointerLock && this.locked) document.exitPointerLock();
      this.audio.destroy();
      this.voice.stop();
      if (this.renderer) this.renderer.destroy();
      if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
    }
  }

  N.UI = UI;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
