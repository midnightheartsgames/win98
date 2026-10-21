(function (K) {
  'use strict';
  const { clamp, lerp, wrapA, angTo, fmtTime } = K;
  const D = K.DATA, IT = D.ITEMS;
  const DT = K.Game.DT;
  const OPT_KEY = 'korovany98_options', INDEX_KEY = 'korovany98_saves', SAVE_PREFIX = 'korovany98_save_';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} }
  };
  const FONT = 'Tahoma, "Microsoft Sans Serif", Arial, sans-serif';
  const PART_ORDER = ['head', 'torso', 'armL', 'armR', 'legL', 'legR'];

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts; this.ac = new AbortController();
      root.classList.add('kv98'); root.tabIndex = 0;
      root.innerHTML = '<canvas class="kv98-gl"></canvas><canvas class="kv98-hud"></canvas><div class="kv98-win"></div><div class="kv98-err"></div>';
      this.glc = root.querySelector('.kv98-gl'); this.hud = root.querySelector('.kv98-hud'); this.hctx = this.hud.getContext('2d'); this.winEl = root.querySelector('.kv98-win');
      this.options = { sens: 5, invert: false, fov: 70, sfx: 0.7, music: 0.35, res: 2, trees: 70, fps: false };
      try { Object.assign(this.options, JSON.parse(store.get(OPT_KEY)) || {}); } catch (_) {}
      this.audio = new K.Audio(); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music;
      this.keys = new Set(); this.mouse = { l: false, r: false, dx: 0, dy: 0, wheel: 0 };
      this.state = 'boot'; this.win = null; this.toasts = []; this.flash = 0; this.hurtT = 0; this.camDist = 3.2; this.firstPerson = false;
      this.camYaw = 0; this.camPitch = -0.1; this.acc = 0; this.last = 0; this.fps = 0; this.fpsN = 0; this.fpsT = 0;
      this.S = new K.Screens(this);
      try { this.renderer = new K.Renderer(this.glc); } catch (err) { this.fail(err); return; }
      this.bind();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); this.resize();
      this.frame = this.frame.bind(this);
      this.loading('Строим долину...');
      setTimeout(() => {
        if (this.destroyed) return;
        try {
          this.world = new K.World(1998);
          this.renderer.setWorld(this.world);
        } catch (err) { this.fail(err); return; }
        this.demo();
        this.state = 'title';
        this.S.title();
        this.raf = requestAnimationFrame(this.frame);
        if (opts.onReady) opts.onReady(this);
      }, 30);
    }
    fail(err) {
      this.failed = true; const el = this.root.querySelector('.kv98-err');
      el.textContent = 'Не удалось запустить 3D-графику (WebGL). ' + (err && err.message ? err.message : '');
      el.style.display = 'block';
      if (globalThis.console) console.error(err);
    }
    loading(text) {
      const c = this.hctx, w = this.hud.width, h = this.hud.height;
      c.fillStyle = '#0c1208'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#d8c890'; c.font = 'bold ' + Math.round(h / 12) + 'px "Times New Roman", serif'; c.textAlign = 'center';
      c.fillText('КОРОВАНЫ', w / 2, h / 2 - 10);
      c.font = Math.round(h / 40) + 'px ' + FONT; c.fillStyle = '#a0a080'; c.fillText(text, w / 2, h / 2 + 24);
    }
    saveOptions() { store.set(OPT_KEY, JSON.stringify(this.options)); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music; this.audio.applyVolume(); this.resize(); }

    demo() {
      this.game = new K.Game({ faction: 'elf', world: this.world, name: 'Демо' });
      this.game.player.hidden = true;
      this.demoT = 0;
    }
    newGame(fac, name) {
      this.S.close();
      this.loading('Собираем отряды...');
      setTimeout(() => {
        this.world = new K.World(1998);
        this.renderer.setWorld(this.world);
        this.game = new K.Game({ faction: fac, name, world: this.world });
        this.enterGame();
        this.S.note(K.Quests.cur(this.game) ? 'Начало' : '', D.STARTS[fac].desc + '\n\n' + this.hint(fac));
      }, 30);
    }
    hint(fac) {
      return fac === 'evil' ? 'Подойдите к военному столу в форте (E). Приказы войску: Q.' : fac === 'emp' ? 'Подойдите к воеводе Груздю во дворе дворца и поговорите (E).' : 'Подойдите к старейшине Ясеню у большого дуба и поговорите (E).';
    }
    enterGame() {
      this.state = 'play';
      this.renderer.particles.length = 0;
      const p = this.game.player;
      this.camYaw = p.yaw; this.camPitch = -0.08; this.game.input.yaw = p.yaw;
      this.toasts = [];
      this.game.events.length = 0;
      this.root.focus({ preventScroll: true });
    }

    saveIndex() { try { return JSON.parse(store.get(INDEX_KEY)) || {}; } catch (_) { return {}; } }
    saveTo(slot, silent) {
      const g = this.game;
      if (!g || g.player.dead || this.state !== 'play') return false;
      const data = g.serialize();
      if (!store.set(SAVE_PREFIX + slot, JSON.stringify(data))) { if (!silent) this.toast('Не удалось сохранить: нет места.', '#ff8060'); return false; }
      const idx = this.saveIndex();
      const z = K.DATA.ZONES.find(x => x.id === g.world.zoneAt(g.player.x, g.player.z));
      idx[slot] = { fac: g.pf, name: g.player.name, time: g.time, date: Date.now(), zone: z ? z.name : '', step: g.quest ? g.quest.step : 0 };
      store.set(INDEX_KEY, JSON.stringify(idx));
      if (!silent) this.toast('Игра сохранена.', '#c8e0a0');
      return true;
    }
    loadFrom(slot) {
      const raw = store.get(SAVE_PREFIX + slot);
      if (!raw) { this.toast('Сохранение не найдено.', '#ff8060'); return false; }
      let data; try { data = JSON.parse(raw); } catch (_) { this.toast('Сохранение повреждено.', '#ff8060'); return false; }
      this.S.close();
      this.loading('Загрузка...');
      setTimeout(() => {
        if (this.destroyed) return;
        try {
          this.world = new K.World(data.seed);
          this.renderer.setWorld(this.world);
          this.game = K.Game.deserialize(data, { world: this.world });
        } catch (err) { if (globalThis.console) console.error(err); this.toast('Не удалось загрузить.', '#ff8060'); this.demo(); this.state = 'title'; this.S.title(); return; }
        this.enterGame();
        this.toast('Загружено.', '#c8e0a0');
      }, 30);
      return true;
    }
    latestSlot() { const idx = this.saveIndex(); let best = null; for (const k in idx) if (!best || idx[k].date > idx[best].date) best = k; return best; }

    resize() {
      const r = this.root.getBoundingClientRect(); if (!r.width || !r.height) return;
      const dpr = Math.min(2, globalThis.devicePixelRatio || 1), q = [0.4, 0.6, 0.8, 1][this.options.res] || 0.8;
      let w = Math.round(r.width * dpr * q), h = Math.round(r.height * dpr * q);
      const cap = 1500 / w; if (cap < 1) { w = Math.round(w * cap); h = Math.round(h * cap); }
      if (this.renderer) this.renderer.resize(Math.max(160, w), Math.max(120, h));
      this.glc.style.imageRendering = q < 0.7 ? 'pixelated' : 'auto';
      this.hud.width = Math.round(r.width * dpr); this.hud.height = Math.round(r.height * dpr);
      this.dpr = dpr;
    }
    locked() { return document.pointerLockElement === this.glc; }
    lock() { if (!this.locked() && this.glc.requestPointerLock) { try { const p = this.glc.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (_) {} } }
    unlock() { if (this.locked() && document.exitPointerLock) document.exitPointerLock(); }
    bind() {
      const sig = { signal: this.ac.signal }, root = this.root;
      root.addEventListener('keydown', e => this.onKey(e, true), sig);
      root.addEventListener('keyup', e => this.onKey(e, false), sig);
      root.addEventListener('mousedown', e => {
        if (e.target.closest && e.target.closest('.kv98-win > *')) return;
        root.focus({ preventScroll: true }); this.audio.resume();
        if (this.state === 'play' && !this.win) {
          if (!this.locked() && e.button === 0 && this.glc.requestPointerLock && !this.opts.noLock) { this.lock(); return; }
          if (e.button === 0) this.mouse.l = true;
          if (e.button === 2) this.mouse.r = true;
        }
      }, sig);
      document.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.l = false; if (e.button === 2) this.mouse.r = false; }, sig);
      root.addEventListener('contextmenu', e => e.preventDefault(), sig);
      document.addEventListener('mousemove', e => { if (this.locked()) { this.mouse.dx += e.movementX || 0; this.mouse.dy += e.movementY || 0; } }, sig);
      root.addEventListener('wheel', e => { if (this.win) return; e.preventDefault(); if (this.state === 'play') this.camDist = clamp(this.camDist + Math.sign(e.deltaY) * 0.4, 1.6, 7); }, Object.assign({ passive: false }, sig));
      document.addEventListener('pointerlockchange', () => { if (!this.locked() && this.wasLocked && this.state === 'play' && !this.win && !this.destroyed && !this.skipPause) this.S.pause(); this.skipPause = false; this.wasLocked = this.locked(); }, sig);
      root.addEventListener('blur', () => { this.keys.clear(); this.mouse.l = false; this.mouse.r = false; }, sig);
    }
    onKey(e, down) {
      const c = e.code;
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F5', 'F9', 'F1'].includes(c)) e.preventDefault();
      if (!down) { this.keys.delete(c); return; }
      this.audio.resume();
      if (this.win) { this.S.key(c, e); return; }
      if (this.state === 'dead' || this.state === 'ending') { if (c === 'Escape' || c === 'Enter' || c === 'Space') this.S.key(c, e); return; }
      if (this.state !== 'play') return;
      if (c === 'Escape') { this.S.pause(); return; }
      if (e.repeat) return;
      this.keys.add(c);
      const inp = this.game.input;
      if (c === 'Space') inp.jump = true;
      if (c === 'KeyE') inp.use = true;
      if (c === 'KeyB') inp.bandage = true;
      if (c === 'KeyH') inp.potion = true;
      if (c === 'KeyR') inp.sheathe = true;
      if (c === 'Digit1') inp.slot = 1;
      if (c === 'Digit2') inp.slot = 2;
      if (c === 'Digit3') inp.slot = 3;
      if (c === 'KeyC') this.crouch = !this.crouch;
      if (c === 'KeyV') this.firstPerson = !this.firstPerson;
      if (c === 'KeyI' || c === 'Tab') { this.S.inventory(); return; }
      if (c === 'KeyM') { this.S.map(); return; }
      if (c === 'KeyJ') { this.S.journal(); return; }
      if (c === 'KeyT') { this.S.wait(); return; }
      if (c === 'KeyQ' && this.game.pf === 'evil') { this.S.command(); return; }
      if (c === 'F5') this.saveTo('quick');
      if (c === 'F9') { if (this.saveIndex().quick) this.loadFrom('quick'); else this.toast('Быстрого сохранения нет.', '#ff8060'); }
    }

    frame(ts) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(this.frame);
      const t = ts / 1000, dt = this.last ? Math.min(0.1, t - this.last) : DT;
      this.last = t;
      this.fpsT += dt; this.fpsN++; if (this.fpsT > 0.5) { this.fps = Math.round(this.fpsN / this.fpsT); this.fpsT = 0; this.fpsN = 0; }
      const active = !this.opts.isActive || this.opts.isActive();
      if (!this.game) return;
      if (this.state === 'play' && !this.win && active) {
        this.readInput(dt);
        this.acc += dt; let n = 0;
        while (this.acc >= DT && n < 5) { this.game.step(DT); this.acc -= DT; n++; }
        if (n === 5) this.acc = 0;
        this.drain();
        if (this.game.player.dead && this.state === 'play') { this.state = 'dead'; this.unlock(); this.deathT = 0; setTimeout(() => { if (this.state === 'dead') this.S.death(); }, 1800); }
      } else if (this.state === 'title') {
        this.demoT += dt;
        this.game.time += dt * 0.5;
        if (Math.floor(this.demoT * 20) % 3 === 0) this.game.step(DT);
        this.game.events.length = 0;
      } else if (this.state === 'dead') {
        this.game.step(DT); this.game.events.length = 0;
      }
      this.renderer.stepParticles(dt, this.game);
      this.ambientFx(dt);
      this.draw(dt);
    }
    readInput(dt) {
      const g = this.game, inp = g.input, k = this.keys, sens = 0.0006 + this.options.sens * 0.00045;
      this.camYaw += this.mouse.dx * sens; this.camPitch -= this.mouse.dy * sens * (this.options.invert ? -1 : 1);
      this.mouse.dx = this.mouse.dy = 0;
      if (k.has('ArrowLeft')) this.camYaw -= dt * 2.2; if (k.has('ArrowRight')) this.camYaw += dt * 2.2;
      if (k.has('ArrowUp')) this.camPitch += dt * 1.5; if (k.has('ArrowDown')) this.camPitch -= dt * 1.5;
      this.camPitch = clamp(this.camPitch, -1.25, 1.2);
      this.camYaw = wrapA(this.camYaw);
      inp.yaw = this.camYaw; inp.pitch = this.camPitch;
      inp.fwd = (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0);
      inp.strafe = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
      inp.run = k.has('ShiftLeft') || k.has('ShiftRight');
      inp.walk = k.has('AltLeft');
      inp.crouch = !!this.crouch;
      inp.attack = this.mouse.l || k.has('KeyF');
      inp.block = this.mouse.r || k.has('KeyG');
    }

    drain() {
      const g = this.game, ev = g.events.splice(0), R = this.renderer, p = g.player;
      this.audio.listener = { x: p.x, z: p.z, yaw: this.camYaw };
      for (const e of ev) {
        switch (e.type) {
          case 'msg': this.toast(e.text, e.color); break;
          case 'sfx': this.audio.play(e.s, e.x, e.z); break;
          case 'step': if (e.id === p.id || Math.hypot(e.x - p.x, e.z - p.z) < 14) this.audio.play(e.m === 'chair' ? 'wood' : 'step', e.x, e.z); break;
          case 'hit': {
            if (e.block) { R.emit('spark', e.x, e.y, e.z, 8); break; }
            R.emit('blood', e.x, e.y, e.z, Math.min(24, 4 + (e.dmg || 4)));
            this.audio.play('hit', e.x, e.z);
            if (e.eye) R.emit('blood', e.x, e.y, e.z, 12);
            if (e.id === p.id) { this.hurtT = 0.4; this.flash = Math.min(0.6, this.flash + (e.dmg || 5) / 40); this.lastHitPart = e.part; this.partFlash = { part: e.part, t: 1 }; }
            break;
          }
          case 'sever': R.emit('blood', e.x, e.y, e.z, 50); if (e.id === p.id) this.flash = 0.9; break;
          case 'hurt': break;
          case 'death': if (e.by === p.id) this.audio.play('hit', e.x, e.z); break;
          case 'gatehit': { const gt = g.world.spots[e.id === 'palace_gate' ? 'gate_out' : 'fort_gate_out']; R.emit('chip', gt.x, g.world.height(gt.x, gt.z) + 2, gt.z, 6); break; }
          case 'ignite': this.audio.play('fire', g.world.burn[e.id].x, g.world.burn[e.id].z); break;
          case 'quest': this.audio.play('quest'); break;
          case 'reprimand': this.flash = 0.3; break;
          case 'arrest': setTimeout(() => this.S.arrest(), 50); break;
          case 'note': setTimeout(() => this.S.note(e.title, e.text), 50); break;
          case 'ending': setTimeout(() => this.S.ending(e.fac), 400); break;
          case 'spotted': if (!this.spottedT || this.spottedT < 0) { this.spottedT = 2; } break;
          case 'squad': this.raidNotice(e); break;
          case 'caravan': break;
          case 'medic': break;
          case 'reveal': this.toast('Шпион раскрыт!', '#ffd080'); break;
          case 'interact': this.S.interact({ kind: e.kind, obj: e.obj }); break;
          default: break;
        }
      }
    }
    raidNotice(e) {
      const g = this.game;
      const home = { elf: 'village', emp: 'palace', evil: 'fort' }[g.pf];
      if (e.target === home && e.fac !== g.pf && !e.tag) this.toast(({ emp: 'Солдаты дворца', evil: 'Войско Злого', elf: 'Партизаны' })[e.fac] + ' идут на ' + g.world.places[home].name + '!', '#ff9060');
    }
    toast(text, color) { this.toasts.push({ text, color: color || '#e8e0c8', t: 0 }); if (this.toasts.length > 6) this.toasts.shift(); }

    ambientFx(dt) {
      const g = this.game, W = g.world, R = this.renderer, p = g.player;
      this.fxT = (this.fxT || 0) + dt;
      if (this.fxT < 0.05) return;
      const k = this.fxT; this.fxT = 0;
      for (const id in W.burn) {
        const b = W.burn[id]; if (Math.hypot(b.x - p.x, b.z - p.z) > 200) continue;
        const y = W.height(b.x, b.z);
        if (b.state === 'fire') { const f = Math.min(1, b.fire / 20); R.emit('fire', b.x, y + 0.5, b.z, Math.ceil(k * 90 * (0.4 + f)), { r: 6, h: 3 + f * 3, s: 0.9 + f * 0.6 }); R.emit('smoke', b.x, y + 5, b.z, Math.ceil(k * 16), { r: 5, s: 1.8 }); }
        else if (b.state === 'ruin' && g.time - b.t < 240) R.emit('smoke', b.x, y + 1, b.z, Math.ceil(k * 4), { r: 3, s: 1 });
      }
      for (const u of W.uses) if (u.kind === 'fire' && Math.hypot(u.x - p.x, u.z - p.z) < 80) { R.emit('fire', u.x, u.y + 0.25, u.z, Math.ceil(k * 30), { r: 0.6, h: 0.2, s: 0.22 }); if (Math.random() < 0.3) R.emit('smoke', u.x, u.y + 1, u.z, 1, { r: 0.3, s: 0.5 }); }
      for (const a of g.actors) if (a.torch && !a.dead && a.joints && Math.hypot(a.x - p.x, a.z - p.z) < 60) R.emit('fire', a.joints[18], a.joints[19] + 0.42, a.joints[20], Math.ceil(k * 20), { r: 0.08, h: 0.05, s: 0.09 });
      const zone = W.zoneAt(p.x, p.z);
      this.audio.ambience(zone, g.isNight(), W.treeDensity(p.x, p.z) > 1);
      const combat = g.actors.some(a => !a.dead && a.ai && a.ai.target === p.id && Math.hypot(a.x - p.x, a.z - p.z) < 30);
      if (this.state === 'play') this.audio.music(zone, combat);
    }

    cameraFor(g) {
      const p = g.player, W = g.world;
      if (this.state === 'title') {
        const t = this.demoT * 0.04, V = W.places.village;
        const x = V.x + Math.cos(t) * 90, z = V.z + Math.sin(t) * 90;
        return { x, y: W.height(x, z) + 30, z, yaw: angTo(x, z, V.x, V.z), pitch: -0.22, fov: 60 };
      }
      const m = g.mobility(p);
      const low = m.mode === 'crawl' ? 0.55 : m.mode === 'chair' ? 1.25 : p.crouch ? 1.2 : 1.62 * (p.scale || 1);
      if (this.firstPerson || this.state === 'dead') {
        if (this.state === 'dead' && p.rag) { const h = p.rag.p, j = K.Body.J.head * 3; return { x: h[j] - Math.sin(this.camYaw) * 2.5, y: h[j + 1] + 1.6, z: h[j + 2] + Math.cos(this.camYaw) * 2.5, yaw: this.camYaw, pitch: -0.55, fov: this.options.fov }; }
        if (p.joints) { const j = K.Body.J.head * 3; const fx = Math.sin(this.camYaw), fz = -Math.cos(this.camYaw); return { x: p.joints[j] + fx * 0.12, y: p.joints[j + 1] + 0.06, z: p.joints[j + 2] + fz * 0.12, yaw: this.camYaw, pitch: this.camPitch, fov: this.options.fov }; }
      }
      const piv = [p.x, p.y + low, p.z];
      const cp = Math.cos(this.camPitch), fx = Math.sin(this.camYaw) * cp, fy = Math.sin(this.camPitch), fz = -Math.cos(this.camYaw) * cp;
      const rx = Math.cos(this.camYaw), rz = Math.sin(this.camYaw);
      const sh = 0.62;
      const aim = p.draw > 0.2 || p.slot === 'ranged' && this.mouse.r;
      const dist = aim ? Math.min(this.camDist, 1.9) : this.camDist;
      let want = [piv[0] - fx * dist + rx * sh, piv[1] - fy * dist + 0.38, piv[2] - fz * dist + rz * sh];
      let t = 1;
      for (let k = 1; k <= 14; k++) {
        const s = k / 14, x = lerp(piv[0], want[0], s), y = lerp(piv[1], want[1], s), z = lerp(piv[2], want[2], s);
        if (W.height(x, z) + 0.25 > y || this.insideSolid(W, x, y, z)) { t = (k - 1) / 14; break; }
      }
      const cam = [lerp(piv[0], want[0], t), lerp(piv[1], want[1], t), lerp(piv[2], want[2], t)];
      if (!this.smoothCam) this.smoothCam = cam.slice();
      this.smoothCam = cam;
      return { x: cam[0], y: cam[1], z: cam[2], yaw: this.camYaw, pitch: this.camPitch, fov: this.options.fov };
    }
    insideSolid(W, x, y, z) {
      const tl = W.nearTrees(x, z, 1.4, this._tlc || (this._tlc = []));
      for (const i of tl) if (Math.hypot(x - W.tx[i], z - W.tz[i]) < W.tr[i] + 0.25 && y < W.ty[i] + W.th[i] * 0.75) return true;
      const list = W.nearColliders(x, z, 0.3, this._cl || (this._cl = []));
      for (const c of list) {
        if (!W.colliderOn(c)) continue;
        if (c.roof) { const dx = x - c.x, dz = z - c.z, lx = dx * c.c + dz * c.s, lz = -dx * c.s + dz * c.c; if (Math.abs(lx) < c.hw && Math.abs(lz) < c.hd && y > c.y0 && y < c.y0 + (c.y1 - c.y0) * 2 * (1 - Math.abs(lz) / c.hd)) return true; continue; }
        const top = W.colTop(c, x, z); if (top != null && y > c.y0 - 0.1 && y < top + 0.1) return true;
      }
      return false;
    }
    aimPoint(cam) {
      const g = this.game, W = g.world;
      const cp = Math.cos(cam.pitch), d = [Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), -Math.cos(cam.yaw) * cp];
      let best = 80, target = null;
      const list = g.near(cam.x, cam.z, 60, []);
      for (const a of list) {
        if (a.player || a.dead || !a.joints) continue;
        const cx = a.x - cam.x, cy = a.y + 1 - cam.y, cz = a.z - cam.z;
        const t = cx * d[0] + cy * d[1] + cz * d[2]; if (t < 0.5 || t > best) continue;
        const px = cam.x + d[0] * t - a.x, py = cam.y + d[1] * t - (a.y + 1), pz = cam.z + d[2] * t - a.z;
        if (px * px + pz * pz < 0.25 && Math.abs(py) < 1) { best = t; target = a; }
      }
      for (let s = 1; s < best; s += 1) { const x = cam.x + d[0] * s, y = cam.y + d[1] * s, z = cam.z + d[2] * s; if (W.height(x, z) > y || this.insideSolid(W, x, y, z)) { best = s; target = null; break; } }
      return { pt: [cam.x + d[0] * best, cam.y + d[1] * best, cam.z + d[2] * best], target };
    }

    draw(dt) {
      const g = this.game, R = this.renderer;
      const cam = this.cameraFor(g);
      if (this.state === 'play') {
        const ap = this.aimPoint(cam);
        this.aimTarget = ap.target;
        const p = g.player;
        const o = [p.x, p.y + 1.45 * (p.scale || 1), p.z];
        const dx = ap.pt[0] - o[0], dy = ap.pt[1] - o[1], dz = ap.pt[2] - o[2];
        if (p.slot === 'ranged') {
          const hd = Math.hypot(dx, dz), w = g.weaponOf(p), sp = w && w.kind === 'xbow' ? 72 : (28 + 44 * Math.max(0.3, p.draw || 1)) * (w && w.id === 'elfbow' ? 1.15 : 1);
          const tt = hd / sp, drop = 0.5 * 9.8 * tt * tt * (w && w.kind === 'xbow' ? 0.7 : 1);
          p.aimAt = { yaw: Math.atan2(dx, -dz), pitch: Math.atan2(dy + drop, hd) };
        } else p.aimAt = null;
      }
      try { R.render(g, cam, { nearTrees: this.options.trees, firstPerson: this.firstPerson && this.state === 'play' }); } catch (err) { if (!this.renderErr) { this.renderErr = true; if (globalThis.console) console.error(err); } }
      this.lastCam = cam;
      this.drawHud(dt);
    }

    drawHud(dt) {
      const c = this.hctx, W = this.hud.width, H = this.hud.height, s = this.dpr || 1, g = this.game;
      c.clearRect(0, 0, W, H);
      if (this.state === 'title' || this.state === 'boot') return;
      const p = g.player;
      const blindL = !g.sees(p, 'L'), blindR = !g.sees(p, 'R');
      if (blindL || blindR) {
        const both = blindL && blindR;
        if (both) { c.fillStyle = 'rgba(0,0,0,0.88)'; c.fillRect(0, 0, W, H); }
        else {
          const grd = c.createLinearGradient(blindL ? W * 0.62 : W * 0.38, 0, blindL ? W * 0.42 : W * 0.58, 0);
          grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,1)');
          c.fillStyle = grd;
          if (blindL) c.fillRect(0, 0, W * 0.62, H); else c.fillRect(W * 0.38, 0, W * 0.62, H);
        }
      }
      if (p.pros.eyeL === 'crystaleye' || p.pros.eyeR === 'crystaleye') { c.fillStyle = 'rgba(80,180,255,0.07)'; if (p.pros.eyeL === 'crystaleye') c.fillRect(0, 0, W / 2, H); if (p.pros.eyeR === 'crystaleye') c.fillRect(W / 2, 0, W / 2, H); }
      this.flash = Math.max(0, this.flash - dt * 0.8);
      if (this.flash > 0) { const grd = c.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8); grd.addColorStop(0, 'rgba(160,0,0,0)'); grd.addColorStop(1, 'rgba(160,0,0,' + this.flash.toFixed(2) + ')'); c.fillStyle = grd; c.fillRect(0, 0, W, H); }
      if (p.bleed > 0 && Math.sin(g.time * 6) > 0.3) { c.fillStyle = 'rgba(120,0,0,0.12)'; c.fillRect(0, 0, W, H); }
      if (this.state === 'dead') {
        c.fillStyle = 'rgba(40,0,0,0.35)'; c.fillRect(0, 0, W, H);
        c.font = 'bold ' + Math.round(H / 14) + 'px "Times New Roman", serif'; c.textAlign = 'center'; c.fillStyle = '#d02020';
        c.fillText('ВЫ ПОГИБЛИ', W / 2, H * 0.4);
        return;
      }
      const f = Math.round(12 * s);
      c.font = f + 'px ' + FONT; c.textBaseline = 'alphabetic';
      this.drawCompass(c, W, H, s, g);
      this.drawDoll(c, W, H, s, g);
      this.drawBars(c, W, H, s, g);
      this.drawGoal(c, W, H, s, g);
      this.drawToasts(c, W, H, s, dt);
      this.drawPrompt(c, W, H, s, g);
      if (!this.firstPerson || true) this.drawCrosshair(c, W, H, s, g);
      if (this.spottedT > 0) { this.spottedT -= dt; c.font = 'bold ' + Math.round(22 * s) + 'px ' + FONT; c.textAlign = 'center'; c.fillStyle = '#ff4030'; c.fillText('!', W / 2, H * 0.4); c.font = f + 'px ' + FONT; c.fillText('Вас заметили', W / 2, H * 0.4 + 16 * s); }
      if (this.options.fps) { c.textAlign = 'right'; c.fillStyle = '#ff0'; c.fillText(this.fps + ' fps, деревьев 3D: ' + ((this.renderer.stats && this.renderer.stats.near) || 0), W - 8 * s, H - 8 * s); }
    }
    panel(c, x, y, w, h) {
      c.fillStyle = 'rgba(20,18,12,0.62)'; c.fillRect(x, y, w, h);
      c.strokeStyle = 'rgba(200,190,150,0.45)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
    drawCompass(c, W, H, s, g) {
      const p = g.player, w = Math.round(Math.min(320 * s, W * 0.42)), h = Math.round(20 * s), x0 = (W - w) / 2, y0 = Math.round(6 * s);
      this.panel(c, x0, y0, w, h);
      c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
      const yaw = this.camYaw, span = Math.PI * 0.9;
      const mark = (ang, label, col, big) => {
        const d = wrapA(ang - yaw); if (Math.abs(d) > span / 2) return;
        const x = x0 + w / 2 + d / span * w;
        c.fillStyle = col; c.textAlign = 'center'; c.font = (big ? 'bold ' : '') + Math.round(11 * s) + 'px ' + FONT;
        c.fillText(label, x, y0 + h - 6 * s);
      };
      const dirs = [[0, 'С'], [Math.PI / 4, 'СВ'], [Math.PI / 2, 'В'], [Math.PI * 0.75, 'ЮВ'], [Math.PI, 'Ю'], [-Math.PI * 0.75, 'ЮЗ'], [-Math.PI / 2, 'З'], [-Math.PI / 4, 'СЗ']];
      for (const [a, l] of dirs) mark(a, l, '#e8dca8', l.length === 1);
      for (const id of ['town', 'palace', 'village', 'fort']) { const P = g.world.places[id]; if (Math.hypot(P.x - p.x, P.z - p.z) > 40) mark(angTo(p.x, p.z, P.x, P.z), '▾', '#a0a090'); }
      const m = K.Quests.marker(g);
      if (m) mark(angTo(p.x, p.z, m.x, m.z), '◆', '#ffd040', true);
      c.restore();
      c.fillStyle = '#e0d8b0'; c.textAlign = 'left'; c.font = Math.round(11 * s) + 'px ' + FONT;
      const zn = D.ZONES.find(z => z.id === g.world.zoneAt(p.x, p.z));
      const pl = g.world.placeAt(p.x, p.z);
      c.fillText((pl ? pl.name + ', ' : '') + (zn ? zn.name : ''), x0, y0 + h + 13 * s);
      c.textAlign = 'right';
      const tm = g.clock();
      c.fillText('День ' + tm.day + ', ' + tm.text, x0 + w, y0 + h + 13 * s);
      if (m) { c.textAlign = 'center'; c.fillStyle = '#ffd040'; c.fillText('◆ ' + m.label + ': ' + Math.round(Math.hypot(m.x - p.x, m.z - p.z)) + ' м', x0 + w / 2, y0 + h + 27 * s); }
    }
    drawDoll(c, W, H, s, g) {
      const p = g.player, x0 = Math.round(10 * s), y0 = H - Math.round(132 * s), w = Math.round(74 * s), h = Math.round(122 * s);
      this.panel(c, x0, y0, w, h);
      const u = s, cx = x0 + w / 2, top = y0 + 8 * s;
      const col = part => {
        const l = p.limbs[part];
        if (this.partFlash && this.partFlash.part === part && this.partFlash.t > 0 && Math.sin(this.partFlash.t * 30) > 0) return '#ffffff';
        if (l.state === 'lost') return p.pros[part] ? (p.pros[part].startsWith('iron') ? '#9aa0b0' : '#a07848') : '#300808';
        if (l.state === 'broken') return '#e07020';
        const k = l.hp / l.max;
        return k > 0.66 ? '#3a9a3a' : k > 0.33 ? '#c8b030' : '#c03020';
      };
      if (this.partFlash) this.partFlash.t -= 0.016;
      const R = (x, y, ww, hh, part) => { c.fillStyle = col(part); c.fillRect(cx + x * u, top + y * u, ww * u, hh * u); c.strokeStyle = 'rgba(0,0,0,0.6)'; c.strokeRect(cx + x * u + 0.5, top + y * u + 0.5, ww * u - 1, hh * u - 1); };
      R(-8, 0, 16, 16, 'head');
      R(-13, 18, 26, 34, 'torso');
      R(-24, 18, 9, 34, 'armL'); R(15, 18, 9, 34, 'armR');
      R(-12, 54, 11, 44, 'legL'); R(1, 54, 11, 44, 'legR');
      for (const [sd, x] of [['L', -5], ['R', 2]]) { c.fillStyle = g.sees(p, sd) ? '#e8e8e0' : p.pros['eye' + sd] ? '#6080c0' : '#000'; c.fillRect(cx + x * u, top + 5 * u, 3 * u, 3 * u); }
      if (p.chair) { c.strokeStyle = '#c8b080'; c.lineWidth = 2 * s; c.beginPath(); c.arc(cx, top + 92 * u, 12 * u, 0, Math.PI * 2); c.stroke(); }
      if (p.bleed > 0) {
        c.fillStyle = Math.sin(g.time * 8) > 0 ? '#ff3020' : '#901008';
        c.font = 'bold ' + Math.round(11 * s) + 'px ' + FONT; c.textAlign = 'left';
        const lineY = y0 - 8 * s;
        c.fillText('Кровотечение! B: перевязать (' + g.count(p, 'bandage') + ')', x0, lineY);
      }
      const mob = g.mobility(p);
      if (mob.mode !== 'walk' || mob.peg) { c.fillStyle = '#e0c090'; c.font = Math.round(10 * s) + 'px ' + FONT; c.textAlign = 'left'; c.fillText(mob.mode === 'crawl' ? 'Ползком' : mob.mode === 'chair' ? 'В коляске' : 'Хромаете', x0 + w + 6 * s, y0 + 12 * s); }
    }
    drawBars(c, W, H, s, g) {
      const p = g.player, x0 = Math.round(90 * s), y0 = H - Math.round(48 * s), w = Math.round(190 * s), bh = Math.round(9 * s);
      this.panel(c, x0, y0 - 4 * s, w + 8 * s, 42 * s);
      const bar = (y, v, col, label) => {
        c.fillStyle = '#1a1410'; c.fillRect(x0 + 4 * s, y, w, bh);
        c.fillStyle = col; c.fillRect(x0 + 4 * s, y, w * clamp(v, 0, 1), bh);
        c.fillStyle = '#f0e8d0'; c.font = Math.round(9 * s) + 'px ' + FONT; c.textAlign = 'left'; c.fillText(label, x0 + 7 * s, y + bh - 1.5 * s);
      };
      bar(y0, p.hp / p.maxHp, p.bleed > 0 ? '#e02818' : '#b02020', 'Здоровье ' + Math.ceil(Math.max(0, p.hp)));
      bar(y0 + 12 * s, p.stamina / 100, '#3a8a3a', 'Силы');
      const w2 = g.weaponOf(p);
      c.fillStyle = '#e8dcb0'; c.font = Math.round(10 * s) + 'px ' + FONT; c.textAlign = 'left';
      let wl = w2 ? w2.name : 'Безоружны';
      if (p.slot === 'ranged' && p.equip.ranged) wl += ', стрел: ' + g.count(p, 'arrows');
      if (!p.drawn) wl += ' (убрано, R)';
      if (p.torch) wl += ' + факел';
      c.fillText(wl, x0 + 4 * s, y0 + 32 * s);
      c.textAlign = 'right'; c.fillStyle = '#e8c860';
      c.fillText(p.gold + ' зол.', x0 + w + 4 * s, y0 + 32 * s);
      let extra = '';
      if (g.pf === 'emp') extra = 'Выговоры: ' + g.reprimands + '/3';
      if (g.pf === 'evil') { const army = g.army(); extra = 'Войско: ' + army.length + (army.length ? ' (' + ({ follow: 'за мной', hold: 'стоять', attack: 'в атаку', hunt: 'вольная охота', palace: 'на дворец' }[army[0].ai.order || 'follow']) + ')' : ''); }
      if (extra) { c.textAlign = 'left'; c.fillStyle = '#c0b8a0'; c.fillText(extra, x0 + 4 * s, y0 - 8 * s); }
    }
    wrap(c, text, maxW) {
      const words = text.split(' '), lines = []; let cur = '';
      for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
      if (cur) lines.push(cur);
      return lines;
    }
    drawGoal(c, W, H, s, g) {
      const text = K.Quests.goalText(g);
      if (!text) return;
      c.font = Math.round(11 * s) + 'px ' + FONT;
      const maxW = Math.min((W - Math.min(320 * s, W * 0.42)) / 2 - 26 * s, 260 * s);
      const lines = this.wrap(c, text, maxW).slice(0, 5);
      const x0 = 8 * s, y0 = 8 * s, lh = 14 * s;
      this.panel(c, x0, y0, maxW + 12 * s, lines.length * lh + 22 * s);
      const cur = K.Quests.cur(g);
      c.fillStyle = '#ffd070'; c.textAlign = 'left'; c.font = 'bold ' + Math.round(11 * s) + 'px ' + FONT;
      c.fillText(cur ? '«' + cur.title + '»' : 'Свободная игра', x0 + 6 * s, y0 + 14 * s);
      c.font = Math.round(11 * s) + 'px ' + FONT; c.fillStyle = '#e8e0c8';
      lines.forEach((l, i) => c.fillText(l, x0 + 6 * s, y0 + 30 * s + i * lh));
    }
    drawToasts(c, W, H, s, dt) {
      c.font = Math.round(11 * s) + 'px ' + FONT; c.textAlign = 'right';
      let y = H - 60 * s;
      for (let i = this.toasts.length - 1; i >= 0; i--) {
        const t = this.toasts[i]; t.t += dt;
        if (t.t > 7) { this.toasts.splice(i, 1); continue; }
        const a = clamp(7 - t.t, 0, 1);
        const lines = this.wrap(c, t.text, W * 0.36).reverse();
        for (const l of lines) {
          const w = c.measureText(l).width;
          c.fillStyle = 'rgba(16,14,10,' + (0.55 * a).toFixed(2) + ')'; c.fillRect(W - w - 16 * s, y - 12 * s, w + 10 * s, 15 * s);
          c.globalAlpha = a; c.fillStyle = t.color; c.fillText(l, W - 11 * s, y); c.globalAlpha = 1;
          y -= 16 * s;
        }
        y -= 2 * s;
      }
    }
    drawPrompt(c, W, H, s, g) {
      const p = g.player, t = g.interactTarget(p);
      this.prompt = t;
      if (!t) return;
      const label = 'E: ' + t.label;
      c.font = 'bold ' + Math.round(12 * s) + 'px ' + FONT; c.textAlign = 'center';
      const w = c.measureText(label).width;
      this.panel(c, W / 2 - w / 2 - 8 * s, H * 0.62 - 15 * s, w + 16 * s, 21 * s);
      c.fillStyle = '#f0e8c8'; c.fillText(label, W / 2, H * 0.62);
    }
    drawCrosshair(c, W, H, s, g) {
      const p = g.player, t = this.aimTarget;
      const hostile = t && g.hostile(p, t);
      c.strokeStyle = hostile ? '#ff5040' : 'rgba(240,230,200,0.8)'; c.lineWidth = Math.max(1, s);
      const x = W / 2, y = H / 2, r = (p.slot === 'ranged' ? 6 : 4) * s;
      c.beginPath(); c.moveTo(x - r * 2, y); c.lineTo(x - r, y); c.moveTo(x + r, y); c.lineTo(x + r * 2, y); c.moveTo(x, y - r * 2); c.lineTo(x, y - r); c.moveTo(x, y + r); c.lineTo(x, y + r * 2); c.stroke();
      if (p.slot === 'melee' && p.drawn) {
        const aim = p.aim || 0, lbl = aim > 0.45 ? 'Голова' : aim < -0.45 ? 'Ноги' : 'Корпус';
        c.font = Math.round(9 * s) + 'px ' + FONT; c.fillStyle = 'rgba(240,230,200,0.7)'; c.textAlign = 'left'; c.fillText(lbl, x + 14 * s, y + 4 * s);
      }
      if (p.draw > 0.05) { c.strokeStyle = '#ffd040'; c.beginPath(); c.arc(x, y, 14 * s, -Math.PI / 2, -Math.PI / 2 + p.draw * Math.PI * 2); c.stroke(); }
      if (t && !t.quad && Math.hypot(t.x - p.x, t.z - p.z) < 25) {
        c.font = Math.round(10 * s) + 'px ' + FONT; c.textAlign = 'center'; c.fillStyle = hostile ? '#ff8070' : '#d8d0b0';
        c.fillText(t.name + (t.title && t.title !== t.name ? ', ' + t.title.toLowerCase() : ''), x, y - 20 * s);
      }
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      this.ac.abort();
      if (this.ro) this.ro.disconnect();
      this.unlock();
      this.audio.destroy();
      this.root.innerHTML = '';
    }
  }

  K.UI = UI;
  K.UIStore = { store, INDEX_KEY, SAVE_PREFIX };
})(globalThis.Korovany = globalThis.Korovany || {});
