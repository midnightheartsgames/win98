(function (C) {
  'use strict';
  const { clamp, lerp, wrapAngle } = C;
  const D = C.DATA, M = C.MAP;
  const OPT_KEY = 'cop98-options', SAVE_PREFIX = 'cop98-save-';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const QUALITY = [200, 240, 300, 360];
  const smoothHide = t => t * t * (3 - 2 * t);
  const SLOT_KEYS = { Digit1: 'knife', Digit2: 'pistol', Digit3: 'rifle', Digit4: 'grenade' };
  const QUICK_KEYS = { F1: 0, F2: 1, F3: 2, F4: 3, Digit7: 0, Digit8: 1, Digit9: 2, Digit0: 3 };
  const WEAPON_CLASS = { pistol: 'pistol', rifle: 'rifle', shotgun: 'shotgun', sniper: 'sniper', none: 'none' };
  const SPAWN_COUNTS = { item: [1, 3, 10, 30], creature: [1, 2, 3, 5], anomaly: [1, 2, 3] };
  const SPAWN_GROUPS = [['items', 'Предметы'], ['world', 'Мир']];
  const ATTITUDES = [['normal', 'Как обычно'], ['hostile', 'Враждебно'], ['friendly', 'Дружелюбно'], ['follow', 'Спутник']];
  const HIT_NAMES = { burn: 'огонь', shock: 'электричество', gravity: 'гравитация', chem: 'химия' };
  const CAMPFIRES = ['camp_claw', 'camp_oakpine', 'camp_lake', 'camp_cranes', 'camp_stoyanka', 'camp_forestry', 'campfire_skadovsk'];
  const WEATHER_SHIFT = [['smooth', 'Плавно'], ['now', 'Сразу']];
  const WEATHER_HOLD = [['auto', 'Меняется сама'], ['hold', 'Держать']];
  const boltStrobe = t => t > 0.42 ? 1 : t > 0.36 ? 0.15 : t > 0.3 ? 0.85 : t > 0.24 ? 0.1 : t > 0.12 ? 0.5 * (t - 0.12) / 0.12 : 0;

  const ENCYCLOPEDIA = {
    anom_zharka: ['Аномалии', 'Жарка', 'Термическая аномалия. В спокойном состоянии почти незаметна — лишь дрожит воздух. При срабатывании выбрасывает столб пламени. Болт разряжает её на пару секунд.'],
    anom_electra: ['Аномалии', 'Электра', 'Электростатическая аномалия. Выдаёт себя голубыми искрами. Разряд смертелен, но после срабатывания аномалия перезаряжается.'],
    anom_vortex: ['Аномалии', 'Воронка', 'Гравитационная аномалия. Затягивает всё, что оказалось рядом, и разрывает в центре. Бегите прочь, как только почувствуете тягу.'],
    anom_springboard: ['Аномалии', 'Трамплин', 'Гравитационная аномалия. Подбрасывает и швыряет жертву. Чаще калечит, чем убивает.'],
    anom_carousel: ['Аномалии', 'Карусель', 'Гравитационная аномалия. Поднимает жертву и раскручивает до смерти. Опознаётся по кружащемуся мусору.'],
    anom_kisel: ['Аномалии', 'Кисель', 'Химическая аномалия. Лужа ядовитой зелёной жижи. Разъедает обувь, кожу и всё, что под ней.'],
    anom_fuzz: ['Аномалии', 'Жгучий пух', 'Растительная аномалия. Серые волокна жгут кожу при касании.'],
    enc_stalker: ['Группировки', 'Одиночки', 'Сталкеры без группировки. Живут на «Скадовске», ищут артефакты, помогают друг другу — когда выгодно.'],
    enc_bandit: ['Группировки', 'Бандиты', 'Уголовники всех мастей. На Затоне ими правит Султан. На «Скадовске» соблюдают перемирие.'],
    enc_merc: ['Группировки', 'Наёмники', 'Хорошо вооружённые профессионалы. Работают за деньги на неизвестных заказчиков.'],
    enc_zombie: ['Группировки', 'Зомбированные', 'Сталкеры, выжженные пси-излучением. Бродят, бормочут и стреляют во всё живое.'],
    enc_dog: ['Мутанты', 'Слепой пёс', 'Мутировавшая собака без глаз. Охотится стаей, ориентируется по запаху и звуку.'],
    enc_flesh: ['Мутанты', 'Плоть', 'Мутировавшая свинья. Неуклюжа и труслива, но в стае опасна.'],
    enc_boar: ['Мутанты', 'Кабан', 'Огромный мутировавший кабан. Разгоняется и сбивает с ног.'],
    enc_bloodsucker: ['Мутанты', 'Кровосос', 'Невидимый охотник. Проявляется лишь в момент атаки. Питается кровью жертв.'],
    enc_chimera: ['Мутанты', 'Химера', 'Самый опасный мутант Затона. Двухголовый хищник, прыгающий на десяток метров.']
  };

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts;
      this.ac = new AbortController();
      root.classList.add('cp98'); root.tabIndex = 0;
      root.innerHTML = '<canvas class="cp98-view"></canvas><canvas class="cp98-hud"></canvas><div class="cp98-win"></div><div class="cp98-toast"></div>';
      this.view = root.querySelector('.cp98-view'); this.vctx = this.view.getContext('2d');
      this.hud = root.querySelector('.cp98-hud'); this.hctx = this.hud.getContext('2d');
      this.winEl = root.querySelector('.cp98-win');
      this.options = { sens: 5, invert: false, fov: 75, sfx: 0.8, music: 0.5, quality: 2, dither: true, bob: true };
      try { Object.assign(this.options, JSON.parse(store.get(OPT_KEY) || '{}')); } catch (_) {}
      this.audio = new C.Audio98();
      this.keys = new Set(); this.once = {}; this.mouse = { dx: 0, dy: 0, fire: false, aim: false };
      this.msgs = []; this.newsPop = null; this.hint = null; this.flashT = 0; this.hurtFlash = 0; this.shake = 0; this.lightning = 0;
      this.mode = 'loading'; this.frame = 0; this.acc = 0; this.last = 0;
      this.vmCache = new Map();
      this.bindInput();
      this.showLoading();
      this.running = true;
      setTimeout(() => this.boot(), 30);
    }

    showLoading(text = 'Загрузка Зоны...') {
      this.winEl.style.display = 'flex';
      this.winEl.dataset.mode = 'loading';
      this.winEl.innerHTML = `<div class="cp98-loading"><div class="cp98-logo"><div class="cp98-logo-s">S.T.A.L.K.E.R.</div><div class="cp98-logo-t">ЗОВ ПРИПЯТИ</div><div class="cp98-logo-e">Затон · издание 1999 года</div></div><div class="cp98-bar"><div></div></div><div class="cp98-load-t">${esc(text)}</div></div>`;
    }

    boot() {
      try {
        this.world = new C.World({ seed: 1999 });
        this.bank = new C.SpriteBank();
        this.mapImg = this.buildMapImage();
        this.setQuality();
        this.demo = new C.Game({ world: this.world, rngSeed: 3 });
        this.demo.time = 18.6 * 60;
        this.demo.events.length = 0;
        this.mode = 'menu';
        this.showMainMenu();
        this.last = performance.now();
        this.raf = requestAnimationFrame(t => this.loop(t));
      } catch (e) {
        this.winEl.innerHTML = `<div class="cp98-panel"><h2>Ошибка</h2><pre>${esc(e && e.stack || e)}</pre></div>`;
      }
    }

    setQuality() {
      const H = QUALITY[this.options.quality] || 300;
      const rect = this.root.getBoundingClientRect();
      const aspect = rect.width > 50 && rect.height > 50 ? clamp(rect.width / rect.height, 1.2, 2.2) : 1.6;
      const W = Math.round(H * aspect / 2) * 2;
      if (!this.R || this.R.W !== W || this.R.H !== H) {
        this.R = new C.Renderer(W, H);
        this.R.textures = this.world.textures;
        this.view.width = W; this.view.height = H;
        this.img = this.vctx.createImageData(W, H);
        this.img32 = new Uint32Array(this.img.data.buffer);
      }
      this.R.dither = !!this.options.dither;
      this.resizeHud();
    }

    resizeHud() {
      const r = this.root.getBoundingClientRect();
      const w = Math.max(320, Math.round(r.width)), h = Math.max(240, Math.round(r.height));
      if (this.hud.width !== w || this.hud.height !== h) { this.hud.width = w; this.hud.height = h; }
    }

    saveOptions() { store.set(OPT_KEY, JSON.stringify(this.options)); this.audio.setVolumes(this.options.sfx, this.options.music); }

    bindInput() {
      const sig = { signal: this.ac.signal };
      const active = () => !this.opts.isActive || this.opts.isActive();
      const kd = e => {
        if (!active() || !this.running) return;
        const code = e.code;
        if (['F1', 'F2', 'F3', 'F4', 'F5', 'F7', 'F9', 'Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code) || (this.mode === 'play' && code.startsWith('Key'))) e.preventDefault();
        this.audio.init(); this.audio.resume();
        if (e.repeat) { this.keys.add(code); return; }
        this.keys.add(code);
        this.onKey(code, e);
      };
      const ku = e => { this.keys.delete(e.code); };
      this.root.addEventListener('keydown', kd, sig);
      document.addEventListener('keydown', e => { if (document.activeElement === document.body && this.opts.standalone) kd(e); }, sig);
      document.addEventListener('keyup', ku, sig);
      window.addEventListener('blur', () => { this.keys.clear(); this.mouse.fire = this.mouse.aim = false; }, sig);
      this.view.addEventListener('mousedown', e => {
        this.audio.init(); this.audio.resume();
        this.root.focus({ preventScroll: true });
        if (this.mode !== 'play') return;
        if (document.pointerLockElement !== this.view) { try { const r = this.view.requestPointerLock && this.view.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (_) {} }
        if (e.button === 0) this.mouse.fire = true;
        if (e.button === 2) this.mouse.aim = true;
        e.preventDefault();
      }, sig);
      document.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.fire = false; if (e.button === 2) this.mouse.aim = false; }, sig);
      this.view.addEventListener('contextmenu', e => e.preventDefault(), sig);
      document.addEventListener('mousemove', e => {
        if (this.mode !== 'play') return;
        if (document.pointerLockElement === this.view) { this.mouse.dx += e.movementX; this.mouse.dy += e.movementY; }
      }, sig);
      this.view.addEventListener('wheel', e => {
        if (this.mode !== 'play' || !this.game) return;
        e.preventDefault();
        const order = ['knife', 'pistol', 'rifle'].filter(s => this.game.player.slots[s]);
        const i = order.indexOf(this.game.player.active);
        const n = order[((i + (e.deltaY > 0 ? 1 : -1)) + order.length) % order.length];
        if (n && n !== this.game.player.active) this.once.slot = n;
      }, Object.assign({ passive: false }, sig));
      window.addEventListener('resize', () => { if (this.world) this.setQuality(); }, sig);
    }

    onKey(code) {
      const g = this.game;
      if (this.mode === 'play' && g) {
        if (code === 'Escape') return this.pause();
        if (code === 'KeyI' || code === 'Tab') return this.openInventory();
        if (code === 'KeyP' || code === 'KeyM') return this.openPDA();
        if (code === 'F5') return this.quickSave();
        if (code === 'F9') return this.quickLoad();
        if (code === 'F7') return this.openSpawner('');
        if (SLOT_KEYS[code]) this.once.slot = SLOT_KEYS[code];
        if (QUICK_KEYS[code] != null) this.once.quick = QUICK_KEYS[code];
        if (code === 'KeyF') this.once.use = true;
        if (code === 'KeyR') this.once.reload = true;
        if (code === 'KeyB') this.once.bolt = true;
        if (code === 'KeyG') this.once.grenade = true;
        if (code === 'KeyO') this.once.detector = true;
        if (code === 'KeyH') this.once.holster = true;
        if (code === 'KeyL') this.once.flashlight = true;
        if (code === 'KeyV') this.once.mode = true;
        if (code === 'KeyY') this.once.ammoSwap = true;
        return;
      }
      if (code === 'Escape') {
        if (this.mode === 'paused') return this.resume();
        if (['inventory', 'pda', 'trade', 'loot', 'upgrade', 'sleep', 'spawner'].includes(this.mode)) return this.closePanel();
        if (this.mode === 'dialog') { this.game.dialogClose(); return this.closePanel(); }
      }
      if (code === 'F7' && this.mode === 'spawner') return this.closePanel();
      if ((code === 'KeyI' || code === 'Tab') && this.mode === 'inventory') return this.closePanel();
      if ((code === 'KeyP' || code === 'KeyM') && this.mode === 'pda') return this.closePanel();
      if (this.mode === 'dialog' && /^Digit[1-9]$/.test(code)) { const btn = this.winEl.querySelectorAll('.cp98-opt')[Number(code.slice(5)) - 1]; if (btn) btn.click(); }
      if (this.mode === 'story' && (code === 'Enter' || code === 'Space')) { const b = this.winEl.querySelector('[data-a="next"]'); if (b) b.click(); }
    }

    releasePointer() { if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (_) {} } }

    newGame(diff) {
      this.showLoading('Высадка на Затоне...');
      setTimeout(() => {
        this.game = new C.Game({ world: this.world, difficulty: diff });
        this.game.events.length = 0;
        this.showStory('Операция «Фарватер»', C.INTRO.map(s => `<b>${esc(s.title)}</b><br>${esc(s.text)}`), () => { this.mode = 'play'; this.closePanel(); this.autoSave(); this.game.emit({ type: 'hint', text: 'WASD — движение, мышь — обзор, F — действие, B — болт, O — детектор, P — КПК. Спускайтесь по тропе на запад, к мачте «Скадовска» с красным огнём.' }); }, true);
      }, 30);
    }

    loop(now) {
      if (!this.running) return;
      this.raf = requestAnimationFrame(t => this.loop(t));
      const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
      this.last = now;
      this.frame++;
      this.resizeHud();
      const g = this.game;
      if (this.mode === 'play' && g) {
        this.acc += dt;
        let steps = 0;
        const sens = this.options.sens * 0.00055;
        let lookX = -this.mouse.dx * sens, lookY = -this.mouse.dy * sens * (this.options.invert ? -1 : 1);
        if (this.keys.has('ArrowLeft')) lookX += dt * 2.2;
        if (this.keys.has('ArrowRight')) lookX -= dt * 2.2;
        if (this.keys.has('ArrowUp')) lookY += dt * 1.6;
        if (this.keys.has('ArrowDown')) lookY -= dt * 1.6;
        if (g.player.aimK > 0.5) { const w = g.activeWeapon(); const z = w && D.WEAPONS[w.id].zoom; if (z) { lookX /= z; lookY /= z; } }
        this.mouse.dx = this.mouse.dy = 0;
        while (this.acc >= C.DT && steps < 5) {
          const k = this.keys;
          const input = {
            fwd: k.has('KeyW'), back: k.has('KeyS'), left: k.has('KeyA'), right: k.has('KeyD'),
            run: k.has('ShiftLeft') || k.has('ShiftRight'), crouch: k.has('ControlLeft') || k.has('KeyC'), jump: k.has('Space'),
            fire: this.mouse.fire || k.has('Enter'), aim: this.mouse.aim,
            lookX: steps === 0 ? lookX : 0, lookY: steps === 0 ? lookY : 0
          };
          if (steps === 0) Object.assign(input, this.once), this.once = {};
          g.tick(input);
          this.acc -= C.DT; steps++;
          this.processEvents(g);
          if (this.mode !== 'play') break;
        }
        if (steps >= 5) this.acc = 0;
        this.render(g, this.cameraFor(g, dt), dt);
        this.drawHud(g, dt);
        this.updateAmbience(g, dt);
        this.warmAssets();
        this.pumpAssets(2.5);
        if (g.realTime - (this.lastAuto || 0) > 600) { this.lastAuto = g.realTime; this.autoSave(); }
      } else if (this.mode === 'menu' && this.demo) {
        const d = this.demo, t = now / 1000;
        const s = M.POI.skadovsk;
        const cam = { x: s.x + Math.cos(t * 0.05) * 95, y: s.y + Math.sin(t * 0.05) * 70, z: 16 + Math.sin(t * 0.13) * 3, yaw: t * 0.05 + Math.PI + 0.35, pitch: -0.12, fov: 75 * Math.PI / 180 };
        d.realTime = t;
        this.render(d, cam, dt, true);
        this.hctx.clearRect(0, 0, this.hud.width, this.hud.height);
      } else if (g && this.mode !== 'loading') {
        this.render(g, this.cameraFor(g, 0), 0);
        this.drawHud(g, 0, true);
        this.updateAmbience(g, dt, true);
        this.warmAssets();
        this.pumpAssets(this.mode === 'pda' ? 6 : 8);
      }
    }

    cameraFor(g, dt) {
      const p = g.player;
      this.bobT = (this.bobT || 0) + dt * Math.hypot(p.vx, p.vy) * 1.9;
      const bob = this.options.bob && p.ground ? Math.sin(this.bobT) * 0.035 * Math.min(1, Math.hypot(p.vx, p.vy) / 3) : 0;
      this.shake = Math.max(0, this.shake - dt * 1.5);
      const sh = this.shake * 0.02;
      const w = g.activeWeapon();
      const zoom = w && D.WEAPONS[w.id].zoom && p.aimK > 0.85 ? D.WEAPONS[w.id].zoom : 1 + p.aimK * 0.22;
      const fov = this.options.fov * Math.PI / 180 / zoom;
      const drunk = p.drunk * 0.0006;
      if (g.dead) return { x: p.x, y: p.y, z: p.z + 0.35, yaw: p.yaw, pitch: 0.25, fov: this.options.fov * Math.PI / 180 };
      return { x: p.x, y: p.y, z: g.eyeZ() + bob, yaw: p.yaw + (Math.random() - 0.5) * sh + Math.sin(g.realTime * 1.1) * drunk, pitch: p.pitch + (Math.random() - 0.5) * sh, fov };
    }

    lightFor(g, env, x, y, z) {
      const zn = g.W.zoneAt(x, y, z + 0.5);
      if (zn && zn.indoor) { const k = zn.dark != null ? zn.dark : 1; return [env.indoor[0] * k, env.indoor[1] * k, env.indoor[2] * k]; }
      return env.light;
    }

    render(g, cam, dt, menu = false) {
      const R = this.R, W = this.world, bank = this.bank;
      const env = g.computeEnv();
      if (this.lightning > 0) { this.lightning -= dt; const k = clamp(this.lightning * 4, 0, 1) * (this.lightningK || 1); env.light = env.light.map(v => v + k * 0.9); }
      if (this.bolt) { this.bolt.t -= dt; if (this.bolt.t <= 0) this.bolt = null; else env.bolt = { az: this.bolt.az, dist: this.bolt.dist, seed: this.bolt.seed, k: boltStrobe(this.bolt.t) }; }
      const pz = g.player.zone;
      if (!menu && pz && pz.indoor && pz.dark != null) env.indoor = env.indoor.map(v => v * pz.dark);
      R.setupCamera(cam); R.setupEnv(env); R.clear();
      R.renderTerrain(W.terrain);
      R.renderMeshes(W.bins, C.RENDER_CELL, C.RGN);
      const opaque = [], trans = [], flashes = [];
      W.collectFlora(R, cam, bank, opaque);
      const far = R.far + 10;
      const near2 = (x, y) => { const dx = x - cam.x, dy = y - cam.y; return dx * dx + dy * dy < far * far; };
      for (const a of g.actors) {
        if (!a.online || !near2(a.x, a.y)) continue;
        let anim = a.anim, frame = 0;
        const t = a.animT;
        if (a.dead) { anim = 'die'; frame = Math.min(3, Math.floor(t * 5)); }
        else if (anim === 'walk') frame = Math.floor(t * 6) % 4;
        else if (anim === 'run') frame = Math.floor(t * 9) % 4;
        else if (anim === 'zombie') frame = Math.floor(t * 4) % 4;
        else if (anim === 'attack') frame = Math.floor(t * 6) % 2;
        else if (anim === 'talk' || anim === 'guitar') frame = Math.floor(t * 3) % 2;
        if (a.kind !== 'human' && a.kind !== 'bloodsucker' && (anim === 'aim' || anim === 'fire' || anim === 'sit' || anim === 'zombie')) anim = 'idle';
        if (a.kind !== 'human' && anim === 'idle' && Math.hypot(a.vx, a.vy) > 0.3) { anim = 'walk'; frame = Math.floor(t * 6) % 4; }
        const rel = wrapAngle(Math.atan2(cam.y - a.y, cam.x - a.x) - a.yaw);
        const dir = ((Math.round(rel / (Math.PI / 4)) % 8) + 8) % 8;
        const wc = a.kind === 'human' ? (a.weapon ? WEAPON_CLASS[a.npcClass] || 'rifle' : 'none') : '';
        const img = bank.actor(a.kind, a.kind === 'human' ? a.look : '', wc, anim, frame, dir, !menu && Math.hypot(a.x - cam.x, a.y - cam.y) < 6);
        const light = this.lightFor(g, env, a.x, a.y, a.z);
        const s = { x: a.x, y: a.y, z: a.z, img, light, tint: a.hitT > 0 ? [1.6, 0.7, 0.7] : null };
        if (a.invis && a.visibleT <= 0 && !a.dead) { s.mode = 3; s.alpha = 1; s.phase = g.realTime * 6; trans.push(s); }
        else opaque.push(s);
        if (a.fireFlash > 0 && !a.dead) flashes.push(a);
      }
      for (const it of g.items) {
        if (!near2(it.x, it.y)) continue;
        opaque.push({ x: it.x, y: it.y, z: it.z, img: bank.ground(it.item.id) || bank.misc.item_stash, light: this.lightFor(g, env, it.x, it.y, it.z), face: true });
      }
      for (const s of Object.values(g.stashes)) if (near2(s.x, s.y)) opaque.push({ x: s.x, y: s.y, z: s.z, img: bank.misc.item_stash, light: this.lightFor(g, env, s.x, s.y, s.z), face: true });
      for (const a of g.artifacts) {
        if (a.taken || !a.visible || !near2(a.x, a.y)) continue;
        const z = a.z + Math.sin(g.realTime * 2 + a.bob) * 0.06;
        opaque.push({ x: a.x, y: a.y, z, img: bank.misc['art_' + a.id], light: [1.1, 1.1, 1.1], face: true });
        trans.push({ x: a.x, y: a.y, z: z - 0.25, img: bank.misc.fx_glow, mode: 1, alpha: 0.5 + Math.sin(g.realTime * 3 + a.bob) * 0.2, scale: 0.7 });
      }
      for (const pr of g.projectiles) opaque.push({ x: pr.x, y: pr.y, z: pr.z - 0.05, img: bank.misc[pr.kind === 'bolt' ? 'item_bolt' : 'item_grenade'], light: env.light, face: true });
      const compass = !menu && g.beltArtifacts && g.beltArtifacts().some(a => a.id === 'compass');
      for (const an of g.anomalies) {
        const dx = an.x - cam.x, dy = an.y - cam.y, d = Math.hypot(dx, dy);
        if (d > 45) continue;
        const k = 1 - d / 45;
        if (an.type === 'zharka' || an.type === 'springboard' || an.type === 'vortex' || an.type === 'carousel') trans.push({ x: an.x, y: an.y, z: an.z, img: bank.misc.fx_glow, mode: 3, alpha: an.type === 'vortex' ? 1.4 : 0.9, phase: g.realTime * 5 + an.phase, scale: an.type === 'vortex' || an.type === 'carousel' ? 5 : 2.8 });
        if (an.type === 'zharka') trans.push({ x: an.x, y: an.y, z: an.z - 0.2, img: bank.misc.fx_fire, mode: 1, alpha: (0.12 + env.night * 0.25) * k, scale: 1.2 });
        if (an.type === 'electra') { trans.push({ x: an.x, y: an.y, z: an.z + 0.2, img: bank.misc.fx_spark, mode: 1, alpha: 0.2 * k + (Math.random() < 0.04 ? 0.8 : 0), scale: 4 }); if (Math.random() < 0.05 * k && !menu) g.tracers.push({ ax: an.x, ay: an.y, az: an.z + 0.1, bx: an.x + (Math.random() - 0.5) * 2, by: an.y + (Math.random() - 0.5) * 2, bz: an.z + 0.4 + Math.random() * 1.2, t: 0.05, color: 0xb0d8ff, arc: true, seed: (Math.random() * 9999) | 0 }); }
        if (an.type === 'kisel') trans.push({ x: an.x, y: an.y, z: an.z - 0.3, img: bank.misc.fx_green, mode: 1, alpha: 0.35 * k + 0.1, scale: 3.2 });
        if (an.type === 'fuzz' && Math.random() < 0.08 * k && !menu) g.particles.push({ x: an.x + (Math.random() - 0.5) * 3, y: an.y + (Math.random() - 0.5) * 3, z: an.z + 0.5 + Math.random() * 2, vx: 0.2, vy: 0.1, vz: -0.1, g: 0, life: 2, size: 0.05, color: C.hex(0xb0a898), mode: 'alpha', alpha: 0.7, lit: true });
        if ((an.type === 'vortex' || an.type === 'carousel') && Math.random() < 0.15 * k && !menu) { const a = Math.random() * C.TAU; g.particles.push({ x: an.x + Math.cos(a) * 2.5, y: an.y + Math.sin(a) * 2.5, z: an.z + 0.3 + Math.random(), vx: -Math.sin(a) * 3, vy: Math.cos(a) * 3, vz: 0.5, g: 0, life: 0.8, size: 0.07, color: C.hex(0x5a4a30), mode: 'alpha', alpha: 0.9, lit: true }); }
        if (compass) trans.push({ x: an.x, y: an.y, z: an.z + 0.3, img: bank.misc.fx_spark, mode: 1, alpha: 0.6, scale: 3 });
      }
      for (const [cx0, cy0] of [[540, 557], [482, 812], [632, 152], [228, 850], [170, 513], [166, 246]]) {
        if (!near2(cx0, cy0)) continue;
        const baseZ = W.terrain.heightAt(cx0, cy0) + 24;
        for (let k = 0; k < 5; k++) {
          const a = g.realTime * (0.25 + k * 0.03) + k * 1.3, r = 12 + k * 3;
          opaque.push({ x: cx0 + Math.cos(a) * r, y: cy0 + Math.sin(a) * r, z: baseZ + Math.sin(a * 2 + k) * 3, img: bank.misc.crow[Math.floor(g.realTime * 4 + k) % 2], light: env.light, scale: 1.6, face: true });
        }
      }
      for (const n of ['tp_farm', 'tp_plateau']) {
        const m = W.markers[n];
        if (!m || !near2(m.x, m.y)) continue;
        for (let k = 0; k < 3; k++) trans.push({ x: m.x, y: m.y, z: m.z + 0.6 + k * 0.5, img: bank.misc.fx_glow, mode: 3, alpha: 1.1, phase: g.realTime * (4 + k) + k * 2, scale: 2.2 - k * 0.4 });
        trans.push({ x: m.x, y: m.y, z: m.z + 1, img: bank.misc.fx_spark, mode: 1, alpha: 0.35 + Math.sin(g.realTime * 7) * 0.15, scale: 3.2 });
        if (!menu && Math.random() < 0.3) { const a = Math.random() * C.TAU; g.particles.push({ x: m.x + Math.cos(a) * 1.4, y: m.y + Math.sin(a) * 1.4, z: m.z + 0.2, vx: -Math.sin(a) * 1.2, vy: Math.cos(a) * 1.2, vz: 1.4, g: 0, life: 0.9, size: 0.05, color: C.hex(0xb0d8ff), mode: 'add', alpha: 0.8, lit: false }); }
      }
      const fireFrames = bank.misc.fx_campfire;
      for (const n of CAMPFIRES) {
        const m = W.markers[n];
        if (!m || !near2(m.x, m.y)) continue;
        trans.push({ x: m.x, y: m.y, z: m.z, img: fireFrames[Math.floor(g.realTime * 8) % 4], mode: 1, alpha: 1, noFog: false });
        trans.push({ x: m.x, y: m.y, z: m.z + 0.2, img: bank.misc.fx_glow, mode: 1, alpha: 0.25 + env.night * 0.5, scale: 4 });
      }
      for (const s of opaque) R.drawSprite(s);
      trans.sort((a, b) => Math.hypot(b.x - cam.x, b.y - cam.y) - Math.hypot(a.x - cam.x, a.y - cam.y));
      R.renderSky();
      for (const s of trans) R.drawSprite(s);
      for (const pt of g.particles) {
        if (pt.sprite) R.drawSprite({ x: pt.x, y: pt.y, z: pt.z - pt.size * 0.5, img: bank.misc[pt.sprite], mode: 1, alpha: Math.min(1, pt.life * 2) * (pt.alpha || 1), scale: pt.size * 2 });
        else if (pt.mode === 'spark') R.drawSpark(pt);
        else R.drawParticle(Object.assign({}, pt, { alpha: (pt.alpha || 1) * Math.min(1, pt.life * 3) }));
      }
      this.dynamicLights(g, R, env, flashes, dt, menu);
      const indoor = !menu && !!(g.player.zone && g.player.zone.indoor);
      R.applyAtmosphere(env, indoor);
      R.renderRain(env, W.terrain, indoor);
      for (const tr of g.tracers) { if (tr.arc) R.drawArc(tr, g.realTime); else R.drawTracer(tr); }
      this.drawFlashes(R, flashes);
      for (const L of W.lights) {
        const q = R.project(L.x, L.y, L.z);
        if (!q) continue;
        if (L.beacon && q.z > 100) {
          if (q.z < 900 && Math.floor(g.realTime * 1.2) % 2 === 0) R.glow(q.sx, q.sy, 1e8, Math.max(2.5, R.focal * 1.2 / q.z), C.rgb(255, 60, 40), 0.9);
          continue;
        }
        if (q.z > 120) continue;
        const fl = L.flicker ? 0.7 + Math.sin(g.realTime * 13 + L.x) * 0.2 + (Math.random() < 0.03 ? -0.5 : 0) : 1;
        R.glow(q.sx, q.sy, q.z - 0.3, Math.min(40, R.focal * L.size * 1.6 / q.z), C.rgb(L.color[0] * 180, L.color[1] * 160, L.color[2] * 120), (L.indoor ? 0.5 : 0.35 + env.night * 0.6) * fl);
      }
      R.sunShafts(env);
      if (!menu) this.drawViewModel(g, R, env, dt);
      const p = g.player;
      const fx = { frame: this.frame, grade: env.grade };
      if (!menu && p.flashlight) fx.flashlight = { range: 28, power: 1.0 };
      this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2.5);
      if (!menu) {
        const low = clamp((35 - p.hp) / 35, 0, 1);
        fx.vignette = Math.max(this.hurtFlash * 0.8, low * (0.4 + Math.sin(g.realTime * 5) * 0.15), p.psy * 0.006);
        fx.vignetteColor = [110, 10, 8];
        if (g.radRate > 2) fx.noise = clamp(g.radRate / 60, 0, 0.25);
        if (p.psy > 5) fx.noise = Math.max(fx.noise || 0, p.psy * 0.003);
      }
      if (env.tint) { fx.tint = env.tint; fx.tintAmount = env.tintAmount; }
      this.flashT = Math.max(0, this.flashT - dt * 3);
      if (this.flashT > 0) fx.whiteFlash = this.flashT;
      R.postProcess(fx);
      this.img32.set(R.fb);
      this.vctx.putImageData(this.img, 0, 0);
    }

    dynamicLights(g, R, env, flashes, dt, menu) {
      const warm = C.rgb(255, 180, 100);
      if (!menu && this.muzzleT > 0 && !this.muzzleSilent) {
        const p = g.player, d = g.aimDir(), e = g.eyeZ();
        R.pointLight(p.x + d[0] * 1.3, p.y + d[1] * 1.3, e + d[2] * 1.3 - 0.1, 9, warm, 1.1);
      }
      for (const a of flashes) R.pointLight(a.x + Math.cos(a.yaw) * 0.7, a.y + Math.sin(a.yaw) * 0.7, a.z + 1.2, 7, warm, 1);
      this.xlights = (this.xlights || []).filter(L => (L.t -= dt) > 0);
      for (const L of this.xlights) R.pointLight(L.x, L.y, L.z + 1, 16, C.rgb(255, 170, 90), 2.2 * L.t / 0.45);
      if (env.night < 0.3) return;
      for (const n of CAMPFIRES) {
        const m = this.world.markers[n];
        if (!m || Math.hypot(m.x - R.cx, m.y - R.cy) > 32) continue;
        R.pointLight(m.x, m.y, m.z + 0.5, 7, C.rgb(255, 150, 70), env.night * (0.75 + Math.sin(g.realTime * 11 + m.x) * 0.12 + Math.sin(g.realTime * 23.7) * 0.06));
      }
    }

    drawFlashes(R, flashes) {
      flashes.forEach((a, k) => {
        const ca = Math.cos(a.yaw), sa = Math.sin(a.yaw), x = a.x + ca * 0.7, y = a.y + sa * 0.7, z = a.z + 1.2, q = R.project(x, y, z);
        if (!q || q.z > R.far) return;
        const q2 = R.project(x + ca * 0.5, y + sa * 0.5, z), size = Math.max(1.5, 0.32 * R.focal / q.z);
        let ux = 1, uy = 0, st = 1;
        if (q2) { const dx = q2.sx - q.sx, dy = q2.sy - q.sy, l = Math.hypot(dx, dy); if (l > 0.01) { ux = dx / l; uy = dy / l; st = clamp(1 + l / size * 1.5, 1, 2.6); } }
        R.drawFlash(q.sx + ux * size * 0.3 * (st - 1), q.sy + uy * size * 0.3 * (st - 1), size, (this.frame * 7 + k * 13) & 1023, { z: q.z - 0.3, dirX: ux, dirY: uy, stretch: st });
      });
    }

    vm(id, sleeve, oneHand) {
      const key = id + '|' + sleeve + '|' + (oneHand ? 1 : 0);
      let vm = this.vmCache.get(key);
      if (!vm) { vm = id.startsWith('detector') ? C.ViewModels.buildDetector(id, sleeve) : C.ViewModels.buildWeapon(id, sleeve, oneHand); this.vmCache.set(key, vm); }
      return vm;
    }

    drawViewModel(g, R, env, dt) {
      const p = g.player;
      const out = g.outfit();
      const sleeve = D.OUTFITS[out ? out.id : 'none'].sleeve;
      const light = this.lightFor(g, env, p.x, p.y, p.z);
      const flashK = p.flashlight ? 0.35 : 0, fireK = this.muzzleT > 0 && !this.muzzleSilent ? 0.5 : 0;
      const L = [Math.min(1.6, light[0] + flashK + fireK), Math.min(1.6, light[1] + flashK + fireK * 0.72), Math.min(1.6, light[2] + flashK + fireK * 0.4)];
      const speed = Math.hypot(p.vx, p.vy), sp = Math.min(1, speed / 3);
      const rdt = Math.max(dt, 1e-3), follow = Math.min(1, dt * 10);
      const yawRate = wrapAngle(p.yaw - (this.vmYaw == null ? p.yaw : this.vmYaw)) / rdt, pitchRate = (p.pitch - (this.vmPitch == null ? p.pitch : this.vmPitch)) / rdt;
      this.vmYaw = p.yaw; this.vmPitch = p.pitch;
      this.swayX = (this.swayX || 0) + (clamp(yawRate, -4, 4) - (this.swayX || 0)) * follow;
      this.swayY = (this.swayY || 0) + (clamp(pitchRate, -4, 4) - (this.swayY || 0)) * follow;
      this.sprintK = (this.sprintK || 0) + ((speed > 3.8 && p.ground && !p.aim ? 1 : 0) - (this.sprintK || 0)) * Math.min(1, dt * 7);
      this.airOff = (this.airOff || 0) + (clamp(-p.vz * 0.006, -0.035, 0.035) - (this.airOff || 0)) * Math.min(1, dt * 12);
      this.kick = Math.max(0, (this.kick || 0) - dt * 9);
      const bobK = 1 + this.sprintK * 0.8;
      const st = {
        bobX: Math.sin(this.bobT || 0) * 0.008 * sp * bobK, bobY: -Math.abs(Math.cos(this.bobT || 0)) * 0.007 * sp * bobK + this.airOff,
        swayX: this.swayX, swayY: this.swayY, breath: g.realTime * 1.7, sprint: this.sprintK, kick: this.kick
      };
      R.beginViewLayer();
      const detId = p.detectorOut && p.slots.detector ? D.DETECTORS[g.item(p.slots.detector).id].model : null;
      if (detId) this.detModel = detId;
      this.detK = clamp((this.detK || 0) + (detId ? dt : -dt) * 6, 0, 1);
      this.detScreen = null;
      if (this.detK > 0 && this.detModel) {
        const dvm = this.vm(this.detModel, sleeve);
        const M = C.ViewModels.detectorPose(Object.assign({ detK: this.detK }, st));
        R.drawViewMesh(dvm.mesh, M, L);
        R.drawViewMesh(C.ViewModels.detectorArms(dvm, M), C.ViewModels.IDENTITY, L);
        if (detId && this.detK > 0.95) {
          const pts = dvm.face.map(q => R.projectView(C.Mat.apply(M, q[0], q[1], q[2])));
          const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
          const x0 = Math.min(...xs), y0 = Math.min(...ys);
          this.detScreen = { x: x0 / R.W, y: y0 / R.H, w: (Math.max(...xs) - x0) / R.W, h: (Math.max(...ys) - y0) / R.H, id: detId };
        }
      }
      const wit = g.activeWeapon();
      this.throwT = Math.max(0, (this.throwT || 0) - dt);
      let id = wit ? D.WEAPONS[wit.id].model : null;
      if (p.active === 'grenade') id = 'grenade';
      if (this.throwT > 0) id = this.throwWhat === 'grenade' ? 'grenade' : 'bolt';
      if (!id || (g.inSafeZone() && this.throwT <= 0)) {
        this.muzzleT = 0;
        if (!this.lastVmId || this.hideK >= 1) return;
        this.hideK = Math.min(1, (this.hideK || 0) + dt * 4);
        id = this.lastVmId;
      } else { this.lastVmId = id; this.hideK = 0; }
      const zoomed = wit && D.WEAPONS[wit.id].zoom && p.aimK > 0.85;
      if (zoomed) return;
      const vm = this.vm(id, sleeve, !!detId);
      st.aimK = p.aimK;
      st.bobX *= 1 - p.aimK * 0.8; st.bobY *= 1 - p.aimK * 0.8;
      st.recoil = p.recoil;
      st.switchK = this.hideK > 0 ? smoothHide(this.hideK) : p.switchT > 0 ? Math.min(1, p.switchT / 0.45) : 0;
      if (p.reload > 0) {
        if (!(this.reloadMax >= p.reload)) this.reloadMax = p.reload;
        const ws = wit ? D.WEAPONS[wit.id] : null;
        st.reload = 1 - p.reload / this.reloadMax;
        st.shell = !!(ws && ws.shellReload);
        st.shellPhase = (p.reload % 0.5) / 0.5;
      } else this.reloadMax = 0;
      if (this.knifeT > 0) { this.knifeT -= dt; st.knife = clamp(1 - this.knifeT / 0.25, 0, 1); }
      if (this.throwT > 0) st.throw = 1 - this.throwT / 0.4;
      const pose = C.ViewModels.weaponPose(vm, st);
      const P = vm.pieces;
      R.drawViewMesh(P.gun, pose.gun, L);
      if (P.mag.count) R.drawViewMesh(P.mag, pose.mag, L);
      R.drawViewMesh(P.rhand, pose.gun, L);
      if (P.lhand.count) R.drawViewMesh(P.lhand, pose.lhand, L);
      R.drawViewMesh(pose.arms, C.ViewModels.IDENTITY, L);
      this.muzzleT = Math.max(0, (this.muzzleT || 0) - dt);
      if (this.muzzleT > 0 && !this.muzzleSilent) {
        const [mx, my] = R.projectView(pose.tip);
        const dx = R.W / 2 - mx, dy = R.H / 2 - my, l = Math.hypot(dx, dy) || 1;
        R.drawFlash(mx, my, 17 * R.H / 300, this.shotSeed || 0, { dirX: dx / l, dirY: dy / l, stretch: 1.35 });
      }
    }

    processEvents(g) {
      const A = this.audio;
      A.listener = { x: g.player.x, y: g.player.y, z: g.eyeZ(), yaw: g.player.yaw, muffle: g.player.zone && g.player.zone.indoor };
      for (const e of g.events) {
        switch (e.type) {
          case 'sound': A.play(e.name, e.ui ? { vol: e.vol } : { x: e.x, y: e.y, z: e.z, vol: e.vol }); break;
          case 'msg': this.pushMsg(e.text, e.color); break;
          case 'news': this.newsPop = { from: e.from, text: e.text, t: 7, important: e.important }; A.play('pda', { vol: 0.6 }); break;
          case 'hint': this.hint = { text: e.text, t: 9 }; break;
          case 'muzzle': this.muzzleT = 0.05; this.muzzleSilent = e.silent; this.kick = 1; this.shotSeed = (Math.random() * 1024) | 0; break;
          case 'hurt': this.hurtFlash = Math.min(1, this.hurtFlash + e.amount / 30); break;
          case 'shake': this.shake = Math.max(this.shake, e.amount * 3); break;
          case 'explosion': this.flashT = Math.max(this.flashT, 0.15); (this.xlights || (this.xlights = [])).push({ x: e.x, y: e.y, z: e.z, t: 0.45 }); break;
          case 'lightning': this.onLightning(e); break;
          case 'emission': if (e.phase === 'strike') { this.flashT = 0.8; this.shake = 3; } break;
          case 'knife': this.knifeT = 0.25; break;
          case 'throw': this.throwT = 0.4; this.throwWhat = e.what; break;
          case 'discover': this.pushMsg('Новая локация: ' + e.name, '#c8e0a0'); break;
          case 'teleport': this.flashT = Math.max(this.flashT, 0.7); this.shake = Math.max(this.shake, 1.5); break;
          case 'encyclopedia': if (ENCYCLOPEDIA[e.id] || e.id.startsWith('art_')) this.pushMsg('КПК: новая запись в энциклопедии', '#a0c8e0'); break;
          case 'guitar': A.play('guitar', { vol: 0.9, music: true }); break;
          case 'dialog': this.openDialog(e.actor); break;
          case 'loot': this.openLoot(e.target, e.source); break;
          case 'story': this.showStory(e.title, e.pages.map(esc), () => this.closePanel()); break;
          case 'sleepMenu': this.openSleep(); break;
          case 'wake': if (this.mode === 'sleep') this.closePanel(); break;
          case 'death': this.onDeath(e.cause); break;
          case 'ending': this.onEnding(e.slides); break;
          case 'quest': if (e.state === 'done') this.autoSave(); break;
        }
      }
      g.events.length = 0;
    }

    onLightning(e) {
      const dist = e.dist || 300 + Math.random() * 500, near = clamp(520 / dist, 0.35, 1);
      this.bolt = { az: e.az != null ? e.az : Math.random() * C.TAU, dist, seed: e.seed || ((Math.random() * 65535) | 0), t: 0.5 };
      this.lightning = 0.35; this.lightningK = near;
      this.flashT = Math.max(this.flashT, 0.25 * near);
      setTimeout(() => this.audio.play('thunder', { vol: clamp(1.25 - dist / 1300, 0.3, 1) }), dist / 340 * 1000);
    }

    updateAmbience(g, dt, paused) {
      const A = this.audio;
      if (!A.ctx) return;
      const env = g.computeEnv();
      const indoor = g.player.zone && g.player.zone.indoor;
      A.loop('wind', paused ? 0 : (indoor ? 0.08 : clamp(0.14 + g.weather.wind * 0.035 + g.weather.rain * 0.12, 0, 0.6)));
      A.loop('rain', paused ? 0 : g.weather.rain * (indoor ? 0.2 : 0.6));
      A.loop('crickets', paused ? 0 : env.night * (indoor ? 0.05 : 0.35));
      A.loop('rumble', paused ? 0 : (g.emission.phase === 'none' ? 0 : g.emission.phase === 'warning' ? clamp(g.emission.t / 100, 0, 1) * 0.8 : 1));
      A.loop('pad', paused ? 0 : 0.35, 'music');
      if (!paused && g.radRate > 0.3 && Math.random() < dt * Math.min(40, g.radRate * 1.5)) A.play('geiger', { vol: 0.6 });
      if (!paused && g.player.hp < 25 && Math.random() < dt * 1.2) A.play('heartbeat', { vol: 0.6 });
    }

    pushMsg(text, color) { this.msgs.push({ text, color, t: 6 }); if (this.msgs.length > 6) this.msgs.shift(); }

    wrap(c, text, x, y, w, lh, maxLines = 10) {
      const words = String(text).split(' ');
      let line = '', n = 0;
      for (const wd of words) {
        const test = line ? line + ' ' + wd : wd;
        if (c.measureText(test).width > w && line) { c.fillText(line, x, y); y += lh; line = wd; if (++n >= maxLines) return; }
        else line = test;
      }
      if (line) c.fillText(line, x, y);
    }

    drawDetector(c, W, H, s, g) {
      const d = g.detector, ds = this.detScreen;
      const x = ds.x * W, y = ds.y * H, w = ds.w * W, h = ds.h * H;
      if (d.spec.map) {
        const sx = x + w * 0.12, sy = y + h * 0.3, sw = w * 0.76, sh = h * 0.4;
        c.fillStyle = 'rgba(20,60,30,0.9)'; c.fillRect(sx, sy, sw, sh);
        c.fillStyle = '#80ff80'; c.fillRect(sx + sw / 2 - 1, sy + sh - 4, 3, 3);
        const p = g.player;
        for (const a of g.artifacts) {
          if (a.taken) continue;
          const dx = a.x - p.x, dy = a.y - p.y, dd = Math.hypot(dx, dy);
          if (dd > d.spec.range) continue;
          const ang = Math.atan2(dy, dx) - p.yaw;
          const px = sx + sw / 2 - Math.sin(ang) * dd / d.spec.range * sw / 2, py = sy + sh - 4 - Math.cos(ang) * dd / d.spec.range * (sh - 6);
          if (px < sx || px > sx + sw || py < sy || py > sy + sh) continue;
          c.fillStyle = this.frame % 20 < 12 ? '#e0ff60' : '#90c040'; c.fillRect(px - 2, py - 2, 4, 4);
        }
      } else if (d.spec.arrow && d.nearest) {
        const p = g.player, ang = Math.atan2(d.nearest.y - p.y, d.nearest.x - p.x) - p.yaw;
        const cx = x + w * 0.5, cy = y + h * 0.44, r = Math.min(w, h) * 0.3;
        c.strokeStyle = '#ff5040'; c.lineWidth = 2 * s;
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx - Math.sin(ang) * r, cy - Math.cos(ang) * r); c.stroke();
      }
      const led = d.nearest ? clamp(1 - d.dist / d.spec.range, 0, 1) : 0;
      c.fillStyle = `rgba(80,255,80,${0.2 + led * 0.8 * (this.frame % 10 < 5 ? 1 : 0.4)})`;
      c.beginPath(); c.arc(x + w * 0.5, y + h * 0.14, 4 * s, 0, C.TAU); c.fill();
    }

    openPanel(mode, html, cls = '') {
      this.mode = mode;
      this.releasePointer();
      this.mouse.fire = this.mouse.aim = false;
      this.keys.clear();
      this.winEl.style.display = 'flex';
      this.winEl.dataset.mode = mode;
      this.winEl.innerHTML = `<div class="cp98-panel ${cls}">${html}</div>`;
      return this.winEl.firstElementChild;
    }

    closePanel() {
      this.winEl.style.display = 'none';
      this.winEl.dataset.mode = '';
      this.winEl.innerHTML = '';
      if (this.game && !this.game.dead && !this.game.won) this.mode = 'play';
      this.root.focus({ preventScroll: true });
    }

    btn(label, action, cls = '') { return `<button class="cp98-btn ${cls}" data-a="${action}">${esc(label)}</button>`; }

    showMainMenu() {
      this.mode = 'menu';
      const cont = this.latestSave();
      const el = this.openPanel('menu', `<div class="cp98-logo"><div class="cp98-logo-s">S.T.A.L.K.E.R.</div><div class="cp98-logo-t">ЗОВ ПРИПЯТИ</div><div class="cp98-logo-e">Затон · GSC Game World · 1999</div></div>
        <div class="cp98-menu">${cont ? this.btn('Продолжить', 'continue') : ''}${this.btn('Новая игра', 'new')}${this.btn('Загрузить', 'load')}${this.btn('Настройки', 'options')}${this.btn('Управление', 'controls')}${this.btn('Об игре', 'about')}${this.opts.onExit ? this.btn('Выход', 'exit') : ''}</div>
        <div class="cp98-foot">Win98 Edition · версия 1.0 · программный рендер</div>`, 'cp98-mainmenu');
      this.mode = 'menu';
      el.addEventListener('click', e => {
        const a = e.target.dataset && e.target.dataset.a; if (!a) return;
        this.audio.init(); this.audio.resume(); this.audio.play('click');
        if (a === 'continue') this.loadSlot(cont);
        if (a === 'new') this.showDifficulty();
        if (a === 'load') this.showLoadMenu(() => this.showMainMenu());
        if (a === 'options') this.showOptions(() => this.showMainMenu());
        if (a === 'controls') this.showControls(() => this.showMainMenu());
        if (a === 'about') this.showAbout();
        if (a === 'exit' && this.opts.onExit) this.opts.onExit();
      });
    }

    showDifficulty() {
      const el = this.openPanel('menu', `<h2>Сложность</h2><div class="cp98-menu">${D.DIFFICULTY.map((d, i) => this.btn(d.name, 'd' + i)).join('')}${this.btn('Назад', 'back', 'dim')}</div><div class="cp98-small">«Новичок»: выброс не убивает, урон снижен. «Мастер»: одна ошибка — смерть.</div>`, 'cp98-mainmenu');
      this.mode = 'menu';
      el.addEventListener('click', e => { const a = e.target.dataset && e.target.dataset.a; if (!a) return; if (a === 'back') return this.showMainMenu(); this.newGame(Number(a.slice(1))); });
    }

    showControls(back) {
      const rows = [['W A S D', 'Движение'], ['Мышь / стрелки', 'Обзор'], ['ЛКМ / Enter', 'Огонь'], ['ПКМ', 'Прицеливание'], ['Shift', 'Бег'], ['Ctrl / C', 'Присесть'], ['Пробел', 'Прыжок'], ['F', 'Действие: говорить, обыскать, взять'], ['R', 'Перезарядка / устранить клин'], ['1 2 3 4', 'Нож, пистолет, винтовка, гранаты'], ['G', 'Бросить гранату'], ['B', 'Бросить болт'], ['O', 'Детектор артефактов'], ['L', 'Фонарик'], ['V', 'Режим огня'], ['Y', 'Тип патронов'], ['I / Tab', 'Инвентарь'], ['P / M', 'КПК'], ['F1–F4', 'Быстрые слоты (аптечка, бинт, антирад, еда)'], ['F5 / F9', 'Быстрое сохранение / загрузка'], ['F7', 'Спавнер: оружие, броня, предметы, NPC, мутанты, аномалии'], ['Esc', 'Меню']];
      const el = this.openPanel(this.mode, `<h2>Управление</h2><table class="cp98-table">${rows.map(r => `<tr><td class="gold">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table><div class="cp98-menu">${this.btn('Назад', 'back')}</div>`);
      el.addEventListener('click', e => { if (e.target.dataset && e.target.dataset.a === 'back') back(); });
    }

    showAbout() {
      const el = this.openPanel('menu', `<h2>Об игре</h2><div class="cp98-text"><p><b>S.T.A.L.K.E.R.: Зов Припяти — Затон</b>. Как если бы игра вышла в 1999 году: программный рендер с воксельным ландшафтом, пре-рендеренные спрайты персонажей, 16-битный цвет с дизерингом.</p><p>Майор СБУ Дегтярёв ищет причины гибели вертолётов операции «Фарватер». Открытый Затон по карте оригинала: «Скадовск», «Шевченко», Старая баржа, Лесопилка, Сгоревший хутор, ВНЗ «Круг», Изумрудное, Заправка, Портовые краны, Лесничество, мост Преображенского, Станция переработки, Цеха подстанции, Железный лес, Земснаряд, Южное плато и трубопровод через весь Затон. Аномалии и артефакты, выбросы, радиация, голод, торговля, апгрейды у техника, тайники, отряды сталкеров и мутанты, живущие своей жизнью.</p><p>Решения имеют последствия: как добыть самописец, кому отдать кейс Шустрого, продать ли «Компас» — всё это отразится в эпилоге.</p></div><div class="cp98-menu">${this.btn('Назад', 'back')}</div>`);
      el.addEventListener('click', e => { if (e.target.dataset && e.target.dataset.a === 'back') this.showMainMenu(); });
    }

    showOptions(back) {
      const o = this.options;
      const el = this.openPanel(this.mode, `<h2>Настройки</h2><div class="cp98-form">
        <label>Чувствительность мыши <input type="range" min="1" max="15" value="${o.sens}" data-o="sens"></label>
        <label>Угол обзора <input type="range" min="60" max="95" value="${o.fov}" data-o="fov"></label>
        <label>Громкость звуков <input type="range" min="0" max="100" value="${o.sfx * 100}" data-o="sfx"></label>
        <label>Громкость музыки <input type="range" min="0" max="100" value="${o.music * 100}" data-o="music"></label>
        <label>Разрешение <select data-o="quality">${QUALITY.map((h, i) => `<option value="${i}" ${i === o.quality ? 'selected' : ''}>${h} строк${i === 0 ? ' (быстро)' : i === 3 ? ' (Pentium III)' : ''}</option>`).join('')}</select></label>
        <label><input type="checkbox" data-o="dither" ${o.dither ? 'checked' : ''}> 16-битный цвет с дизерингом</label>
        <label><input type="checkbox" data-o="invert" ${o.invert ? 'checked' : ''}> Инвертировать мышь</label>
        <label><input type="checkbox" data-o="bob" ${o.bob ? 'checked' : ''}> Покачивание при ходьбе</label>
      </div><div class="cp98-menu">${this.btn('Готово', 'back')}</div>`);
      el.addEventListener('input', e => {
        const k = e.target.dataset.o; if (!k) return;
        const v = e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value);
        o[k] = k === 'sfx' || k === 'music' ? v / 100 : v;
        this.saveOptions();
        if (k === 'quality' || k === 'dither') this.setQuality();
      });
      el.addEventListener('click', e => { if (e.target.dataset && e.target.dataset.a === 'back') back(); });
    }

    pause() {
      if (!this.game) return;
      const el = this.openPanel('paused', `<h2>Пауза</h2><div class="cp98-menu">${this.btn('Продолжить', 'resume')}${this.btn('Сохранить', 'save')}${this.btn('Загрузить', 'load')}${this.btn('Спавнер (F7)', 'spawner')}${this.btn('Настройки', 'options')}${this.btn('Управление', 'controls')}${this.btn('Главное меню', 'menu', 'dim')}</div>`);
      el.addEventListener('click', e => {
        const a = e.target.dataset && e.target.dataset.a; if (!a) return;
        if (a === 'resume') this.resume();
        if (a === 'spawner') this.openSpawner('');
        if (a === 'save') this.showSaveMenu();
        if (a === 'load') this.showLoadMenu(() => this.pause());
        if (a === 'options') this.showOptions(() => this.pause());
        if (a === 'controls') this.showControls(() => this.pause());
        if (a === 'menu') { this.game = null; this.audio.stopAll(); this.showMainMenu(); }
      });
    }
    resume() { this.closePanel(); }

    saveMeta(g) {
      const zn = g.player.zone && g.player.zone.name;
      let loc = zn || '';
      if (!loc) { let bd = 1e9; for (const p of Object.values(M.POI)) { const d = Math.hypot(p.x - g.player.x, p.y - g.player.y); if (d < bd) { bd = d; loc = p.name; } } }
      return { date: new Date().toLocaleString('ru-RU'), clock: C.formatClock(g.time), day: g.day(), loc, diff: D.DIFFICULTY[g.difficulty].name };
    }
    saveTo(slot) {
      if (!this.game || this.game.dead) return false;
      const ok = store.set(SAVE_PREFIX + slot, JSON.stringify({ meta: this.saveMeta(this.game), data: this.game.serialize() }));
      if (!ok) this.pushMsg('Не удалось сохранить: нет места.', '#ff8060');
      return ok;
    }
    quickSave() { if (this.game && this.game.emission.phase === 'none' && this.saveTo('quick')) this.pushMsg('Быстрое сохранение', '#a0e0a0'); else if (this.game && this.game.emission.phase !== 'none') this.pushMsg('Во время выброса сохраняться нельзя.', '#ff9060'); }
    quickLoad() { if (store.get(SAVE_PREFIX + 'quick')) this.loadSlot('quick'); }
    autoSave() { if (this.game && !this.game.dead && this.game.emission.phase === 'none') this.saveTo('auto'); }
    slotInfo(slot) { try { const s = JSON.parse(store.get(SAVE_PREFIX + slot) || 'null'); return s ? s.meta : null; } catch (_) { return null; } }
    latestSave() {
      let best = null, bt = 0;
      for (const sl of ['quick', 'auto', '1', '2', '3', '4', '5']) { const m = this.slotInfo(sl); if (!m) continue; const t = Date.parse(m.date.replace(/(\d+)\.(\d+)\.(\d+),?/, '$3-$2-$1')) || 1; if (t >= bt) { bt = t; best = sl; } }
      return best;
    }
    loadSlot(slot) {
      const raw = store.get(SAVE_PREFIX + slot);
      if (!raw) return;
      this.showLoading('Загрузка сохранения...');
      setTimeout(() => {
        try {
          const s = JSON.parse(raw);
          this.game = C.Game.deserialize(s.data, { world: this.world });
          this.mode = 'play'; this.closePanel();
          this.pushMsg('Загружено: ' + s.meta.loc + ', ' + s.meta.clock, '#a0e0a0');
        } catch (e) {
          this.openPanel('menu', `<h2>Ошибка загрузки</h2><pre>${esc(e.message)}</pre><div class="cp98-menu">${this.btn('В меню', 'menu')}</div>`).addEventListener('click', () => this.showMainMenu());
        }
      }, 30);
    }
    showSaveMenu() {
      const rows = ['1', '2', '3', '4', '5'].map(sl => { const m = this.slotInfo(sl); return `<button class="cp98-slot" data-a="s${sl}"><b>Слот ${sl}</b> ${m ? esc(`${m.loc} · день ${m.day}, ${m.clock} · ${m.date}`) : '<i>пусто</i>'}</button>`; }).join('');
      const el = this.openPanel('paused', `<h2>Сохранить игру</h2>${this.game.emission.phase !== 'none' ? '<div class="cp98-small red">Во время выброса сохраняться нельзя.</div>' : rows}<div class="cp98-menu">${this.btn('Назад', 'back')}</div>`);
      el.addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (!a) return; const k = a.dataset.a; if (k === 'back') return this.pause(); if (k[0] === 's') { this.saveTo(k.slice(1)); this.showSaveMenu(); } });
    }
    showLoadMenu(back) {
      const slots = ['quick', 'auto', '1', '2', '3', '4', '5'];
      const names = { quick: 'Быстрое', auto: 'Автосохранение' };
      const rows = slots.map(sl => { const m = this.slotInfo(sl); return m ? `<button class="cp98-slot" data-a="l${sl}"><b>${names[sl] || 'Слот ' + sl}</b> ${esc(`${m.loc} · день ${m.day}, ${m.clock} · ${m.diff} · ${m.date}`)}</button>` : ''; }).join('') || '<div class="cp98-small">Сохранений нет.</div>';
      const el = this.openPanel(this.mode === 'paused' ? 'paused' : 'menu', `<h2>Загрузить игру</h2>${rows}<div class="cp98-menu">${this.btn('Назад', 'back')}</div>`);
      el.addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (!a) return; const k = a.dataset.a; if (k === 'back') return back(); if (k[0] === 'l') this.loadSlot(k.slice(1)); });
    }

    showStory(title, pages, done, intro = false) {
      let i = 0;
      const show = () => {
        const el = this.openPanel('story', `<div class="cp98-story ${intro ? 'intro' : ''}"><h2>${esc(title)}</h2><div class="cp98-page">${intro ? pages[i] : pages.map(p => `<p>${p}</p>`).join('')}</div><div class="cp98-menu row">${intro && i < pages.length - 1 ? this.btn('Далее', 'next') : this.btn(intro ? 'Начать' : 'Закрыть', 'next')}${intro ? this.btn('Пропустить', 'skip', 'dim') : ''}</div></div>`, 'cp98-wide');
        el.addEventListener('click', e => {
          const a = e.target.dataset && e.target.dataset.a; if (!a) return;
          this.audio.play('click');
          if (a === 'skip' || !intro || i >= pages.length - 1) { done(); return; }
          i++; show();
        });
      };
      show();
    }

    openSleep() {
      const el = this.openPanel('sleep', `<h2>Отдых</h2><div class="cp98-small">Сейчас ${C.formatClock(this.game.time)}. Сколько спать?</div><div class="cp98-menu row">${[1, 3, 6, 9].map(h => this.btn(h + ' ч', 'h' + h)).join('')}${this.btn('Отмена', 'close', 'dim')}</div>`);
      el.addEventListener('click', e => {
        const a = e.target.dataset && e.target.dataset.a; if (!a) return;
        if (a === 'close') return this.closePanel();
        if (this.game.sleep(Number(a.slice(1)))) { this.closePanel(); this.pushMsg('Вы легли спать...', '#c8d8e8'); }
      });
    }

    openSpawner(note) {
      const g = this.game;
      if (!g || g.dead || g.won) return;
      const cats = C.SPAWN_CATALOG;
      const st = this.spawner || (this.spawner = { cat: cats[0].id, pick: {}, count: { item: 1, creature: 1, anomaly: 1 }, where: 'bag', attitude: 'normal', weapon: '', shift: 'smooth', note: '' });
      if (note != null) st.note = note;
      const cat = cats.find(c => c.id === st.cat) || cats[0];
      const entry = cat.entries.find(e => e.id === st.pick[cat.id]) || cat.entries[0];
      const kind = cat.kind, def = kind === 'item' ? D.ITEMS[entry.id] : null;
      const oldGrid = this.mode === 'spawner' ? this.winEl.querySelector('.cp98-sp-grid') : null;
      const scroll = oldGrid && oldGrid.dataset.cat === cat.id ? oldGrid.scrollTop : 0;
      const seg = (key, value, list) => `<div class="cp98-sp-seg">${list.map(([v, label]) => `<button class="${String(v) === String(value) ? 'on' : ''}" data-k="${key}" data-v="${v}">${esc(label)}</button>`).join('')}</div>`;
      const nav = SPAWN_GROUPS.map(([gid, title]) => `<b>${title}</b><div>${cats.filter(c => c.group === gid).map(c => `<button class="${c === cat ? 'on' : ''}" data-cat="${c.id}">${esc(c.title)}</button>`).join('')}</div>`).join('');
      const tiles = cat.entries.map(e => `<button class="cp98-sp-tile ${e === entry ? 'on' : ''}" data-id="${e.id}"><img src="${this.spawnerIcon(e)}" alt=""><span>${esc(e.name)}</span></button>`).join('');
      let opts = kind === 'weather' ? `<span>Смена</span>${seg('shift', st.shift, WEATHER_SHIFT)}<span>Дальше</span>${seg('hold', g.weather.hold ? 'hold' : 'auto', WEATHER_HOLD)}` : `<span>${def && def.type === 'ammo' ? 'Коробок' : 'Количество'}</span>${seg('count', st.count[kind], SPAWN_COUNTS[kind].map(n => [n, '×' + n]))}`;
      if (kind === 'item') opts += `<span>Куда</span>${seg('where', st.where, [['bag', 'В рюкзак'], ['ground', 'На землю']])}`;
      if (def && def.type === 'weapon' && D.WEAPONS[entry.id].ammo) opts += `<span>Патроны</span><div>${this.btn('+3 коробки ' + D.AMMO[D.WEAPONS[entry.id].ammo[0]].name, 'ammo', 'sm')}</div>`;
      if (kind === 'creature') opts += `<span>Поведение</span>${seg('attitude', st.attitude, ATTITUDES)}`;
      if (cat.id === 'human') opts += `<span>Оружие</span><select data-k="weapon"><option value="">Как у группировки</option>${Object.keys(D.WEAPONS).filter(id => !D.WEAPONS[id].melee).map(id => `<option value="${id}" ${st.weapon === id ? 'selected' : ''}>${esc(D.WEAPONS[id].name)}</option>`).join('')}</select>`;
      const left = g.spawnedCount();
      const el = this.openPanel('spawner', `<div class="cp98-sp-head"><h2>Спавнер</h2><span>двойной щелчок — создать</span>${this.btn('Закрыть (F7)', 'close', 'sm dim')}</div>
        <div class="cp98-sp-cats">${nav}</div>
        <div class="cp98-sp-grid ${kind}" data-cat="${cat.id}">${tiles}</div>
        <div class="cp98-sp-card ${kind}"><img src="${this.spawnerIcon(entry)}" alt=""><div>${this.spawnerInfo(entry)}</div></div>
        <div class="cp98-sp-opts">${opts}</div>
        ${this.btn(kind === 'weather' ? 'Включить погоду' : 'Создать', 'spawn', 'cp98-sp-go')}
        <div class="cp98-sp-foot"><span>${esc(st.note)}</span>${this.btn(left ? `Убрать созданное (${left})` : 'Созданного нет', 'clear', 'sm dim')}</div>`, 'cp98-sp');
      el.querySelector('.cp98-sp-grid').scrollTop = scroll;
      el.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        const d = b.dataset;
        if (d.cat) { st.cat = d.cat; return this.openSpawner(); }
        if (d.id) { st.pick[cat.id] = d.id; return e.detail >= 2 ? this.spawnerAct(cat.entries.find(x => x.id === d.id)) : this.openSpawner(); }
        if (d.k === 'count') { st.count[kind] = Number(d.v); return this.openSpawner(); }
        if (d.k === 'hold') { g.weather.hold = d.v === 'hold'; this.audio.play('click'); return this.openSpawner(g.weather.hold ? `Погода «${C.WEATHER[g.weather.kind].name}» зафиксирована и сама не сменится.` : 'Погода снова меняется сама.'); }
        if (d.k) { st[d.k] = d.v; return this.openSpawner(); }
        if (d.a === 'close') return this.closePanel();
        if (d.a === 'spawn') return this.spawnerAct(entry);
        if (d.a === 'ammo') { const cal = D.WEAPONS[entry.id].ammo[0]; g.spawnItems('ammo_' + cal, 3, 'bag'); this.processEvents(g); return this.openSpawner(`Создано: патроны ${D.AMMO[cal].name}, 3 коробки — в рюкзаке`); }
        if (d.a === 'clear') { const n = g.clearSpawned(); this.audio.play('click'); return this.openSpawner(n ? `Убрано созданных объектов: ${n}` : 'Убирать нечего.'); }
      });
      el.addEventListener('change', e => { if (e.target.dataset.k === 'weapon') st.weapon = e.target.value; });
      this.root.focus({ preventScroll: true });
    }

    spawnerAct(entry) {
      const g = this.game, st = this.spawner, p = g.player, n = st.count[entry.kind];
      const away = list => list.length ? Math.round(Math.hypot(list[0].x - p.x, list[0].y - p.y)) + ' м перед вами' : '';
      let note;
      if (entry.kind === 'item') {
        const def = D.ITEMS[entry.id];
        g.spawnItems(entry.id, n, st.where);
        note = `Создано: ${entry.name} ${def.type === 'ammo' ? `(${n} кор., ${n * def.box} шт.)` : '×' + n} — ${st.where === 'bag' ? `в рюкзаке, вес ${g.totalWeight().toFixed(1)} / ${g.maxWeight()} кг` : 'на земле перед вами'}`;
      } else if (entry.kind === 'creature') {
        const list = g.spawnCreatures(entry.id, n, { attitude: st.attitude, weapon: st.weapon });
        note = `Создано: ${entry.name} ×${list.length} — ${away(list)}`;
        this.audio.play('click');
      } else if (entry.kind === 'weather') {
        const instant = st.shift === 'now';
        g.setWeather(entry.id, { instant });
        note = `Погода: ${entry.name} — ${instant ? 'сразу' : 'плавный переход, около минуты'}${g.weather.hold ? ', держится' : ''}`;
        this.audio.play('click');
      } else {
        const list = g.spawnAnomalies(entry.id, n);
        note = list.length ? `Создано: ${entry.name} ×${list.length} — ${away(list)}` : `Для аномалии «${entry.name}» нет места: отойдите от стен.`;
        this.audio.play('click');
      }
      this.processEvents(g);
      if (this.mode === 'spawner') this.openSpawner(note);
    }

    spawnerInfo(e) {
      if (e.kind === 'weather') {
        const g = this.game, T = C.WEATHER[e.id], w = g.weather, pre = g.weatherPreview(e.id), env = g.computeEnv({ weather: pre, hour: 13 });
        const ground = w.wet > 0.5 ? 'мокрая' : w.wet > 0.1 ? 'сырая' : 'сухая';
        const lines = [
          `Облачность ${Math.round(T.cover * 100)}% · ветер ${T.wind} м/с`,
          `Видимость днём ~${Math.round(env.fogEnd / 10) * 10} м${T.fog > 0.5 ? ', в низинах и над водой меньше' : ''}`,
          `Враги видят ${Math.round(g.weatherSight(pre) * 100)}% · шаги слышно ${Math.round(g.weatherNoise(pre) * 100)}%`,
          `Сейчас: ${C.WEATHER[w.kind].name}${w.hold ? ' (держится)' : ''} · дождь ${Math.round(w.rain * 100)}% · туман ${Math.round(w.fogK * 100)}% · земля ${ground}`
        ];
        return `<h3>${esc(e.name)}</h3><div class="cp98-desc">${esc(T.desc)}</div><div class="cp98-stats">${lines.map(esc).join('<br>')}</div>`;
      }
      if (e.kind === 'item') {
        const html = this.itemDetails(C.makeItem(e.id, 1, { cond: 1 }));
        return D.ITEMS[e.id].type === 'quest' ? html + '<div class="cp98-sp-warn">Сюжетный предмет: может сбить ход заданий.</div>' : html;
      }
      if (e.kind === 'creature') {
        const T = D.NPC_TYPES[e.id], human = T.kind === 'human';
        const enc = ENCYCLOPEDIA['enc_' + (human ? T.faction : T.kind)];
        const lines = human
          ? [`${D.FACTIONS[T.faction].name} · здоровье ${T.hp} · броня ${Math.round((T.armor || 0) * 100)}%`, 'Оружие: ' + [...new Set(T.guns)].map(id => D.WEAPONS[id].name).join(', ')]
          : [`Здоровье ${T.hp} · удар ${T.melee} · скорость ${T.speed} м/с`, ['Трофей: ' + D.ITEMS[T.part].name, T.invisible && 'невидимость', T.leap && 'прыжок', T.charge && 'таран'].filter(Boolean).join(' · ')];
        return `<h3>${esc(e.name)}</h3><div class="cp98-desc">${esc(enc ? enc[2] : '')}</div><div class="cp98-stats">${lines.map(esc).join('<br>')}</div>`;
      }
      const A = D.ANOMALY_TYPES[e.id], enc = ENCYCLOPEDIA['anom_' + e.id];
      const lines = [`Урон ${A.dmg} · ${HIT_NAMES[A.hit]} · радиус ${A.trigger} м`, A.continuous ? 'Жжёт постоянно, пока вы внутри' : `Срабатывает от касания и болта, остывает ${A.cool} с`];
      return `<h3>${esc(e.name)}</h3><div class="cp98-desc">${esc(enc ? enc[2] : '')}</div><div class="cp98-stats">${lines.map(esc).join('<br>')}</div>`;
    }

    spawnerIcon(e) {
      if (e.kind === 'item') return this.itemIcon(e);
      const key = e.kind + ':' + e.id;
      if (!this.iconUrls) this.iconUrls = {};
      if (!this.iconUrls[key]) this.iconUrls[key] = e.kind === 'creature' ? this.creatureIcon(e.id) : e.kind === 'weather' ? this.weatherIcon(e.id) : this.anomalyIcon(e.id);
      return this.iconUrls[key];
    }

    creatureIcon(type) {
      const T = D.NPC_TYPES[type];
      const img = T.kind === 'human' ? this.bank.actor('human', T.looks[T.looks.length - 1], WEAPON_CLASS[D.WEAPONS[T.guns[0]].npc], 'idle', 0, 1) : this.bank.actor(T.kind, '', '', 'idle', 0, 1);
      let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
      for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if ((img.data[y * img.w + x] >>> 24) > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const w = x1 - x0 + 3, h = y1 - y0 + 3;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d'), im = cx.createImageData(w, h), d32 = new Uint32Array(im.data.buffer);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) d32[(y - y0 + 1) * w + x - x0 + 1] = img.data[y * img.w + x];
      cx.putImageData(im, 0, 0);
      return cv.toDataURL();
    }

    weatherIcon(kind) {
      const g = this.game, W = this.world, R = new C.Renderer(96, 72), s = M.POI.skadovsk;
      R.textures = W.textures; R.dither = false;
      const env = g.computeEnv({ weather: g.weatherPreview(kind), hour: 13.5 });
      env.time = 40;
      R.setupCamera({ x: s.x + 70, y: s.y + 36, z: 9, yaw: Math.atan2(-36, -70) - 0.2, pitch: 0.14, fov: 1.25 });
      R.setupEnv(env); R.clear(); R.renderTerrain(W.terrain); R.renderMeshes(W.bins, C.RENDER_CELL, C.RGN);
      R.renderSky(); R.applyAtmosphere(env, false); R.renderRain(env, W.terrain, false); R.sunShafts(env); R.postProcess({ grade: env.grade });
      const cv = document.createElement('canvas'); cv.width = R.W; cv.height = R.H;
      const cx = cv.getContext('2d'), im = cx.createImageData(R.W, R.H);
      new Uint32Array(im.data.buffer).set(R.fb);
      cx.putImageData(im, 0, 0);
      return cv.toDataURL();
    }

    anomalyIcon(type) {
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 48;
      const c = cv.getContext('2d'), rnd = C.makeRandom(C.hashInt(type.length, type.charCodeAt(0), 98));
      const glow = (x, y, r, rgb, a) => { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, C.TAU); c.fill(); };
      const ring = (x, y, rx, ry, color, width) => { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, C.TAU); c.stroke(); };
      const dot = (x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, C.TAU); c.fill(); };
      c.lineCap = 'round';
      if (type === 'zharka') {
        c.fillStyle = 'rgba(24,16,10,0.9)'; c.beginPath(); c.ellipse(32, 41, 20, 4.5, 0, 0, C.TAU); c.fill();
        for (let k = 0; k < 8; k++) glow(32 + (rnd() - 0.5) * 7, 40 - k * 4.2, 12 - k * 1.1, k < 3 ? '255,110,30' : k < 6 ? '255,170,50' : '255,230,120', 0.8);
        glow(32, 34, 5, '255,250,210', 0.9);
      } else if (type === 'electra') {
        glow(32, 28, 24, '110,160,255', 0.45);
        for (let b = 0; b < 6; b++) {
          const pts = [[32, 36]];
          let a = -Math.PI / 2 + (b - 2.5) * 0.55;
          for (let s = 0; s < 5; s++) { const [px, py] = pts[pts.length - 1]; a += (rnd() - 0.5) * 1.3; pts.push([px + Math.cos(a) * 5.5, py + Math.sin(a) * 5.5]); }
          for (const [width, color] of [[3.2, 'rgba(120,170,255,0.45)'], [1.1, '#eef6ff']]) { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke(); }
        }
      } else if (type === 'vortex') {
        glow(32, 32, 26, '230,215,180', 0.24);
        for (let t = 0; t < 26; t += 0.15) { const r = 24 - t * 0.85; dot(32 + Math.cos(t) * r, 33 + Math.sin(t) * r * 0.42, 0.5 + t * 0.05, `rgba(${175 - t * 4 | 0},${145 - t * 4 | 0},${100 - t * 3 | 0},0.9)`); }
        for (let k = 0; k < 14; k++) { const a = rnd() * C.TAU, r = 4 + rnd() * 20; dot(32 + Math.cos(a) * r, 33 + Math.sin(a) * r * 0.42 - rnd() * 6, 1, 'rgba(200,170,115,0.95)'); }
        glow(32, 33, 7, '8,6,4', 0.95);
      } else if (type === 'springboard') {
        glow(32, 30, 18, '210,210,200', 0.18);
        for (let k = 1; k <= 4; k++) ring(32, 39, k * 6, k * 1.8, `rgba(190,178,145,${0.85 - k * 0.17})`, 1.3);
        for (let k = 0; k < 5; k++) dot(26 + rnd() * 12, 12 + rnd() * 14, 1 + rnd(), 'rgba(90,80,60,0.95)');
      } else if (type === 'carousel') {
        glow(32, 26, 22, '225,215,185', 0.2);
        for (const y of [12, 24, 36]) glow(32, y, 9, '210,200,170', 0.14);
        for (let k = 0; k < 3; k++) { c.strokeStyle = `rgba(215,190,135,${0.85 - k * 0.2})`; c.lineWidth = 1.4; c.beginPath(); c.ellipse(32, 18 + k * 9, 20 - k * 3, 6 - k, 0, 0.2 + k, 2.4 + k); c.stroke(); }
        for (let k = 0; k < 16; k++) { const a = rnd() * C.TAU, lvl = rnd(); dot(32 + Math.cos(a) * (17 - lvl * 6), 18 + lvl * 18 + Math.sin(a) * (5 - lvl * 2), 0.8 + rnd() * 0.8, 'rgba(185,155,105,0.95)'); }
      } else if (type === 'kisel') {
        glow(32, 32, 22, '110,255,80', 0.22);
        const gr = c.createRadialGradient(32, 38, 2, 32, 38, 26);
        gr.addColorStop(0, 'rgba(170,255,110,0.95)'); gr.addColorStop(0.7, 'rgba(70,160,40,0.9)'); gr.addColorStop(1, 'rgba(30,70,20,0.8)');
        c.fillStyle = gr; c.beginPath(); c.ellipse(32, 38, 26, 7, 0, 0, C.TAU); c.fill();
        for (let k = 0; k < 7; k++) ring(16 + rnd() * 32, 35 + rnd() * 6, 1 + rnd() * 1.6, 0.8 + rnd(), 'rgba(220,255,190,0.9)', 0.8);
      } else {
        glow(32, 30, 20, '220,210,190', 0.14);
        for (let k = 0; k < 42; k++) {
          const bx = 14 + rnd() * 36, by = 41 - rnd() * 3, a = -Math.PI / 2 + (bx - 32) / 30 + (rnd() - 0.5) * 0.9, len = 8 + rnd() * 16;
          c.strokeStyle = `rgba(${190 + rnd() * 40 | 0},${180 + rnd() * 30 | 0},${160 + rnd() * 20 | 0},0.7)`; c.lineWidth = 0.7;
          c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + Math.cos(a) * len * 0.5 + (rnd() - 0.5) * 6, by + Math.sin(a) * len * 0.5, bx + Math.cos(a) * len, by + Math.sin(a) * len); c.stroke();
        }
        for (let k = 0; k < 8; k++) dot(12 + rnd() * 40, 6 + rnd() * 20, 0.8, 'rgba(230,225,210,0.8)');
      }
      return cv.toDataURL();
    }

    onDeath(cause) {
      this.releasePointer();
      setTimeout(() => {
        if (!this.game || !this.game.dead) return;
        const hasQuick = !!store.get(SAVE_PREFIX + 'quick'), hasAuto = !!store.get(SAVE_PREFIX + 'auto');
        const el = this.openPanel('dead', `<h2 class="red">Вы погибли</h2><div class="cp98-small">${esc(cause)}</div><div class="cp98-small dim">Зона не прощает ошибок.</div><div class="cp98-menu">${hasQuick ? this.btn('Загрузить быстрое сохранение', 'quick') : ''}${hasAuto ? this.btn('Загрузить автосохранение', 'auto') : ''}${this.btn('Главное меню', 'menu', 'dim')}</div>`);
        el.addEventListener('click', e => { const a = e.target.dataset && e.target.dataset.a; if (!a) return; if (a === 'menu') { this.game = null; this.showMainMenu(); } else this.loadSlot(a); });
      }, 1600);
    }

    onEnding(slides) {
      this.releasePointer();
      this.audio.stopAll();
      let i = 0;
      const show = () => {
        const s = slides[i];
        const el = this.openPanel('ending', `<div class="cp98-story intro"><h2>${esc(s.title)}</h2><div class="cp98-page">${esc(s.text)}</div><div class="cp98-menu row">${this.btn(i < slides.length - 1 ? 'Далее' : 'Конец', 'next')}</div></div>`, 'cp98-wide');
        el.addEventListener('click', e => {
          if (!(e.target.dataset && e.target.dataset.a)) return;
          i++;
          if (i < slides.length) show();
          else { const st = this.game.stats; this.openPanel('ending', `<h2>Затон пройден</h2><table class="cp98-table"><tr><td>Дней в Зоне</td><td>${this.game.day()}</td></tr><tr><td>Артефактов</td><td>${st.artifacts}</td></tr><tr><td>Убито</td><td>${st.kills} людей, ${st.mutants} мутантов</td></tr><tr><td>Выбросов пережито</td><td>${st.emissions}</td></tr></table><div class="cp98-small">Спасибо за игру, сталкер.</div><div class="cp98-menu">${this.btn('Главное меню', 'menu')}</div>`).addEventListener('click', ev => { if (ev.target.dataset && ev.target.dataset.a) { this.game = null; this.showMainMenu(); } }); }
        });
      };
      show();
    }

    destroy() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      this.ac.abort();
      this.releasePointer();
      this.audio.destroy();
      this.root.innerHTML = '';
    }
  }

  C.UI = UI;
  C.ENCYCLOPEDIA = ENCYCLOPEDIA;
})(globalThis.Cop98 = globalThis.Cop98 || {});
