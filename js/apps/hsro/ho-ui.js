(function (HO) {
  'use strict';
  const T = HO.TUN;
  const C = HO.CMB;
  const H = globalThis.Hsr98 || {};
  const FOV = 1.05;
  const MOVES = new Set(['fwd', 'back', 'left', 'right', 'sl', 'sr']);
  const RES_COL = { rage: '#c83a2a', path: '#3a6ad8' };
  const FONT = 'Tahoma, Verdana, sans-serif';

  function safeStorage() {
    try {
      const ls = globalThis.localStorage;
      ls.setItem('hsro.probe', '1');
      ls.removeItem('hsro.probe');
      return ls;
    } catch (err) {
      const box = new Map();
      return { getItem: k => (box.has(k) ? box.get(k) : null), setItem: (k, v) => box.set(k, String(v)), removeItem: k => box.delete(k) };
    }
  }

  const angleDiff = (a, b) => {
    let d = (b - a) % HO.TWO_PI;
    if (d > HO.PI) d -= HO.TWO_PI;
    if (d < -HO.PI) d += HO.TWO_PI;
    return d;
  };
  const elemCol = e => (H.ELEMENTS && H.ELEMENTS[e] ? H.ELEMENTS[e].col : '#e0e0e0');
  const elemShort = e => (H.ELEMENTS && H.ELEMENTS[e] ? H.ELEMENTS[e].short : e);
  const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
  const fmt = v => (Math.round(v * 10) / 10).toString().replace('.', ',');

  function conColor(me, lvl) {
    const d = lvl - me;
    if (d >= 5) return '#ff3030';
    if (d >= 3) return '#ff9a30';
    if (d >= -2) return '#ffe040';
    const grey = me <= 5 ? 0 : me <= 9 ? me - 5 : 4;
    return lvl <= grey ? '#9a9a9a' : '#40e060';
  }

  function rayBoxes(boxes, o, d, maxT) {
    let best = maxT;
    for (const b of boxes) {
      let t0 = 0, t1 = best, hit = true;
      for (let i = 0; i < 3; i++) {
        const lo = b[i], hi = b[i + 3];
        if (Math.abs(d[i]) < 1e-9) { if (o[i] < lo || o[i] > hi) { hit = false; break; } continue; }
        let a = (lo - o[i]) / d[i], c = (hi - o[i]) / d[i];
        if (a > c) { const s = a; a = c; c = s; }
        if (a > t0) t0 = a;
        if (c < t1) t1 = c;
        if (t0 > t1) { hit = false; break; }
      }
      if (hit && t0 > 0 && t0 < best) best = t0;
    }
    return best;
  }

  class UI {
    constructor(root, opts) {
      this.opts = opts || {};
      this.root = root;
      root.classList.add('hsro');
      root.tabIndex = 0;
      this.glCanvas = document.createElement('canvas');
      this.glCanvas.className = 'hsro-gl';
      this.hud = document.createElement('canvas');
      this.hud.className = 'hsro-hud';
      root.append(this.glCanvas, this.hud);
      this.hctx = this.hud.getContext('2d');
      this.seat = 0;
      this.setup = { race: HO.RACES[this.opts.race] ? this.opts.race : 'human', path: HO.PATHS[this.opts.path] ? this.opts.path : 'destruction', level: HO.clamp(Number(this.opts.level) || 1, 1, 10) };
      this.renderer = null;
      this.error = null;
      try {
        this.renderer = new HO.Renderer(this.glCanvas);
      } catch (err) {
        this.error = String(err && err.message || err);
      }
      this.cam = { yaw: 0, pitch: 0.38, dist: 8 };
      this.held = new Set();
      this.mouse = { l: false, r: false, x: 0, y: 0, downX: 0, downY: 0, hx: -1, hy: -1 };
      this.buttons = [];
      this.time = 0;
      this.anims = {};
      this.debug = !!this.opts.debug;
      this.store = HO.Store(this.opts.storage || safeStorage());
      this.storage = this.opts.storage || safeStorage();
      this.settings = HO.loadSettings(this.storage);
      this.settingsWin = null;
      this.audio = H.Audio ? new H.Audio() : null;
      this.applySettings();
      this.sfxAt = {};
      this.stepT = 0;
      this.musicWant = null;
      this.musicSince = 0;
      this.saveAt = 0;
      this.dirty = false;
      this.loadArt();
      this.initFront();
      if (this.debug) this.newWorld();
      else this.enterFront('login');
      this.bind();
      this.raf = requestAnimationFrame(t => this.frame(t));
    }

    loadArt() {
      if (!this.renderer || typeof fetch !== 'function') return;
      const ids = [...Object.values(HO.MODEL_IDS.heroes), ...HO.MODEL_IDS.parts, ...Object.values(HO.MODEL_IDS.foes), ...Object.values(HO.MODEL_IDS.props), ...Object.values(HO.MODEL_IDS.npcs), ...HO.MODEL_IDS.extras, ...HO.MODEL_IDS.kit];
      fetch('content/hsro/fx.json').then(r => r.json()).then(meta => HO.loadImage('content/hsro/' + meta.sheet).then(img => {
        if (!this.destroyed && this.renderer) this.renderer.setFx(img, meta.cells);
      })).catch(() => {});
      fetch('content/hsro/surfaces.json').then(r => r.json()).then(meta => HO.loadImage('content/hsro/' + meta.sheet).then(img => {
        if (!this.destroyed && this.renderer) this.renderer.setSurfaces(img, meta.cells);
      })).catch(() => {});
      for (const id of ids) {
        HO.loadModel(id).then(m => {
          if (this.destroyed || !this.renderer) return;
          this.renderer.addModel(id, m);
          this.modelData = this.modelData || {};
          this.modelData[id] = m;
          if (m.meta.look && !this.facesLoading) {
            this.facesLoading = true;
            HO.loadImage('content/hsro/' + m.meta.look.faces).then(img => { this.faces = img; }).catch(() => {});
          }
        }).catch(() => {});
      }
    }

    heroDress(sheet, race, path, id) {
      const m = this.modelData && this.modelData[id], look = sheet && sheet.look;
      const cone = sheet && sheet.gear && sheet.gear.cone && HO.ITEMS[sheet.gear.cone.id];
      const parts = HO.heroParts(race, path, look, cone ? cone.q : 2).filter(p => this.renderer.hasModel(p.model));
      const key = HO.lookKey(id, look);
      if (!this.renderer.textures[key] && m && this.faces) {
        const cv = HO.lookCanvas(m, this.faces, look);
        if (cv) this.renderer.addTexture(key, cv);
      }
      return { parts, tex: this.renderer.textures[key] ? key : null };
    }

    npcDress(n, look) {
      const m = this.modelData && this.modelData[n.model], key = HO.npcKey(n.model, look, n.face);
      if (!this.renderer.textures[key] && m && this.faces) {
        const cv = HO.npcCanvas(m, this.faces, look, n.face);
        if (cv) this.renderer.addTexture(key, cv);
      }
      return { parts: n.parts.filter(p => this.renderer.hasModel(p.model)), tex: this.renderer.textures[key] ? key : null, scale: n.scale };
    }

    modelFor(a, v) {
      if (a.kind === 'foe') return { id: HO.MODEL_IDS.foes[HO.FOES[a.id].shape], dress: () => ({ scale: HO.FOE_SCALE[a.id] || 1 }) };
      if (a.kind === 'hero' && !a.companion) {
        const id = HO.MODEL_IDS.heroes[a.race + '_' + (a.sheet ? a.sheet.sex : 'f')];
        return { id, dress: () => this.heroDress(a.sheet, a.race, a.path || (a.sheet && a.sheet.path), id) };
      }
      if (typeof v.look === 'string') return HO.MODEL_IDS.npcs[v.look] ? { id: HO.MODEL_IDS.npcs[v.look] } : null;
      if (v.look && v.look.type === 'person') {
        const n = HO.npcParts(a.companion || a.id, v.look);
        return { id: n.model, dress: () => this.npcDress(n, v.look) };
      }
      return null;
    }

    animPose(a, v, speed) {
      const pick = this.modelFor(a, v), id = pick && pick.id;
      const m = id && this.modelData && this.modelData[id];
      if (!m) return null;
      const now = this.time, st = this.anims[a.uid] || (this.anims[a.uid] = { clip: 'idle', start: now, prev: null, prevStart: 0, at: -9, shot: null, shotAt: -9, phase: 0, last: now });
      const dt = Math.max(0, now - st.last);
      st.last = now;
      let clip = 'idle';
      const attackLen = m.clips.attack ? (m.clips.attack.frames - 1) / m.fps : 0.6;
      if (a.dead) clip = 'death';
      else if (a.cast && m.clips.cast) clip = 'cast';
      else if (st.shot && now - st.shotAt < attackLen) clip = st.shot;
      else if (speed > 0.4) clip = 'run';
      else if (a.phase2 && m.clips.idle2) clip = 'idle2';
      if (clip !== st.clip) {
        st.prev = st.clip; st.prevStart = st.start; st.prevPhase = st.phase;
        st.clip = clip; st.start = now; st.at = now; st.phase = 0;
      }
      st.phase += clip === 'run' ? dt * Math.max(0.6, speed / T.run) : dt;
      const t = clip === 'death' || clip === 'attack' ? now - st.start : st.phase;
      const pose = HO.samplePose(m, clip, t);
      const k = (now - st.at) / 0.15;
      const dress = pick.dress ? pick.dress() : null;
      if (st.prev && k < 1 && clip !== 'death') {
        const pt = st.prev === 'death' || st.prev === 'attack' ? now - st.prevStart : st.prevPhase;
        return Object.assign({ model: id, pose: HO.blendPose(HO.samplePose(m, st.prev, pt), pose, k) }, dress);
      }
      return Object.assign({ model: id, pose }, dress);
    }

    enterWorld(id) {
      const sheet = this.store.load(id);
      if (!sheet) return false;
      this.store.setLast(id);
      this.restOffline(sheet);
      this.newWorld(sheet);
      return true;
    }

    saveHero(force) {
      if (this.debug || this.mode !== 'world' || !this.world) return false;
      if (!force && !this.dirty) return false;
      const a = this.hero();
      if (this.world.zone.id !== 'greybox') a.sheet.at = this.safeSpot(a);
      const out = HO.copy(a.sheet);
      out.savedAt = Date.now();
      out.restOnSave = !!a.resting;
      const ok = this.store.save(out);
      this.dirty = false;
      this.saveAt = this.time;
      return ok;
    }

    safeSpot(a) {
      const r = v => Math.round(v * 10) / 10;
      if (!a.inCombat && !a.dead && !a.ghost) return { zone: this.world.zone.id, x: r(a.x), z: r(a.z), yaw: Math.round(a.yaw * 100) / 100 };
      if (a.sheet.bind && HO.ANCHORS[a.sheet.bind]) return Object.assign({ yaw: 0 }, HO.anchorSpot(a.sheet.bind));
      const m = this.world.nearestMed(a);
      return { zone: this.world.zone.id, x: m.x, z: m.z, yaw: 0 };
    }

    restOffline(sheet) {
      const need = HO.xpNeed(sheet.lvl);
      if (sheet.savedAt > 0 && sheet.restOnSave && need && sheet.lvl < HO.MAX_LEVEL) {
        const hours = Math.max(0, (Date.now() - sheet.savedAt) / 3600000);
        sheet.rested = Math.min(need * 1.5, (sheet.rested || 0) + need * 0.05 * hours / 8);
      }
      delete sheet.savedAt;
      delete sheet.restOnSave;
    }

    logout() {
      const a = this.hero();
      this.menu = false;
      if (this.debug) return;
      if (a.dead || a.ghost) { this.denyMsg = { text: 'Сначала вернитесь в сознание', t: this.time }; return; }
      if (a.inCombat) { this.denyMsg = { text: HO.DENY.combat, t: this.time }; return; }
      if (a.resting) { this.toSelect(); return; }
      if (!a.sit) this.cmd({ t: 'sit', on: true });
      this.leaving = { t: this.time };
    }

    leaveTick() {
      const a = this.hero(), left = 20 - (this.time - this.leaving.t);
      if (a.inCombat || a.dead || (!a.sit && this.time - this.leaving.t > 0.4)) { this.leaving = null; this.denyMsg = { text: 'Выход отменён', t: this.time }; return; }
      if (left <= 0) {
        const exit = this.leaving.exit;
        this.leaving = null;
        this.toSelect();
        if (exit && this.opts.onExit) this.opts.onExit();
      }
    }

    quitGame() {
      if (this.mode !== 'world') { if (this.opts.onExit) this.opts.onExit(); return; }
      this.logout();
      if (this.leaving) this.leaving.exit = true;
      else if (this.mode !== 'world' && this.opts.onExit) this.opts.onExit();
    }

    applySettings() {
      const s = this.settings;
      if (this.audio) this.audio.setVolumes(s.sfx, s.music);
      if (this.renderer) Object.assign(this.renderer, { viewScale: s.view, fogOn: s.fog, shadowsOn: s.shadows, dither: s.dither });
    }

    saveSettings() {
      HO.saveSettings(this.storage, this.settings);
      this.applySettings();
    }

    setSetting(key, v) {
      this.settings[key] = v;
      this.saveSettings();
    }

    openSettings(tab) {
      this.settingsWin = { tab: tab || 'gfx', wait: null, msg: null };
      this.menu = false;
    }

    toSelect() {
      this.leaving = null;
      this.saveHero(true);
      this.front.sel = this.hero().sheet.id;
      this.enterFront('select');
    }

    newWorld(sheet, travel) {
      this.mode = 'world';
      this.menu = false;
      this.trainer = null;
      this.win = null;
      this.leaving = null;
      this.pendingTravel = null;
      const zone = sheet ? (travel && travel.zone) || (sheet.at && HO.ZONES[sheet.at.zone] && sheet.at.zone) || HO.START_ZONE[sheet.race] : 'greybox';
      this.world = new HO.World({ seed: 1 + (this.worldSeed = (this.worldSeed || 0) + 1), zone, level: sheet ? sheet.lvl : this.setup.level });
      if (sheet) {
        const a = this.world.addHero(this.seat, { sheet });
        const at = travel ? (travel.x !== undefined ? travel : HO.TRAVEL[travel.zone]) : sheet.at && sheet.at.zone === zone ? sheet.at : null;
        const nav = this.world.nav(), cell = at ? nav.nearestFree(at.x, at.z) : -1;
        if (cell >= 0) { const p = nav.walkable(at.x, at.z) ? [at.x, at.z] : nav.center(cell); a.x = p[0]; a.z = p[1]; a.yaw = at.yaw || 0; a.y = Math.max(0, this.world.floorBelow(p[0], p[1], 50)); }
        this.loading = { text: this.world.zone.name, t: this.time };
      } else this.world.addHero(this.seat, { name: 'Доброволец', race: this.setup.race, path: this.setup.path, level: this.setup.level });
      if (this.renderer) this.renderer.setZone(this.world.zone);
      this.prev = this.snapshot();
      this.sent = { f: 0, s: 0, r: 0 };
      this.acc = 0;
      this.last = 0;
      this.fps = 0; this.frames = 0; this.fpsAt = 0;
      this.hashText = this.world.hash();
      this.floaters = [];
      this.effects = [];
      this.log = [];
      this.banner = null;
      this.denyMsg = null;
      this.cam.yaw = this.hero().yaw;
      this.anims = {};
    }

    hero() {
      return this.world.heroAt(this.seat);
    }

    areaName() {
      const a = this.hero(), area = (this.world.zone.areas || []).find(r => a.x > r.x0 && a.x < r.x1 && a.z > r.z0 && a.z < r.z1);
      return area ? area.name : this.world.zone.name;
    }

    cmd(c) {
      c.seat = this.seat;
      return this.world.cmd(c);
    }

    snapshot() {
      const m = {};
      for (const a of this.world.state.actors) m[a.uid] = { x: a.x, y: a.y, z: a.z, yaw: a.yaw };
      return m;
    }

    active() {
      return !this.opts.isActive || this.opts.isActive();
    }

    bind() {
      this.unbinds = [];
      const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); this.unbinds.push(() => el.removeEventListener(ev, fn, o)); };
      on(window, 'pagehide', () => this.saveHero(true));
      const wake = () => { if (this.audio) { this.audio.init(); this.audio.resume(); } };
      on(this.root, 'mousedown', wake);
      on(this.root, 'keydown', wake);
      on(this.root, 'keydown', e => this.keyDown(e));
      on(this.root, 'keyup', e => { const act = HO.actionFor(this.settings, e.code); if (MOVES.has(act)) this.held.delete(act); });
      on(this.root, 'blur', () => this.clearInput());
      on(window, 'blur', () => this.clearInput());
      on(this.hud, 'contextmenu', e => e.preventDefault());
      on(this.hud, 'mousedown', e => {
        this.root.focus({ preventScroll: true });
        const p = this.local(e);
        if (e.button === 0 && this.pressButton(p.x, p.y)) { e.preventDefault(); return; }
        if (this.settingsWin) { e.preventDefault(); return; }
        if (e.button === 0) this.mouse.l = true;
        if (e.button === 2) this.mouse.r = true;
        this.mouse.x = e.clientX; this.mouse.y = e.clientY;
        this.mouse.downX = e.clientX; this.mouse.downY = e.clientY;
        e.preventDefault();
      });
      on(window, 'mouseup', e => {
        const click = Math.abs(e.clientX - this.mouse.downX) + Math.abs(e.clientY - this.mouse.downY) < 5;
        const was = e.button === 0 ? this.mouse.l : e.button === 2 ? this.mouse.r : false;
        if (e.button === 0) this.mouse.l = false;
        if (e.button === 2) this.mouse.r = false;
        if (this.drag && e.button === 0) { const p = this.local(e); this.dropDrag(p.x, p.y); return; }
        if (was && click && this.mode === 'world') { const p = this.local(e); this.clickWorld(p.x, p.y, e.button === 2); }
      });
      on(window, 'mousemove', e => {
        const p = this.local(e);
        this.mouse.hx = p.x; this.mouse.hy = p.y;
        if (!this.mouse.l && !this.mouse.r) return;
        const dx = e.clientX - this.mouse.x, dy = e.clientY - this.mouse.y;
        this.mouse.x = e.clientX; this.mouse.y = e.clientY;
        if (this.mode !== 'world') { this.front.rot += dx * 0.01; return; }
        this.cam.yaw = HO.wrapAngle(this.cam.yaw + dx * 0.006);
        this.cam.pitch = HO.clamp(this.cam.pitch + dy * 0.005, -0.35, 1.35);
      });
      on(this.hud, 'wheel', e => {
        this.cam.dist = HO.clamp(this.cam.dist * (e.deltaY > 0 ? 1.12 : 1 / 1.12), 2, 24);
        e.preventDefault();
      }, { passive: false });
    }

    local(e) {
      const r = this.hud.getBoundingClientRect();
      return { x: (e.clientX - r.left) * this.hud.width / Math.max(1, r.width), y: (e.clientY - r.top) * this.hud.height / Math.max(1, r.height) };
    }

    clearInput() {
      this.held.clear();
      this.mouse.l = false;
      this.mouse.r = false;
    }

    settingsKey(e) {
      const st = this.settingsWin;
      e.preventDefault();
      if (st.wait) {
        if (e.code === 'Escape') { st.wait = null; st.msg = null; return; }
        const id = st.wait, r = HO.rebind(this.settings, id, e.code);
        if (!r.ok) { st.msg = { text: HO.keyLabel(e.code) + ' занята отчётами об ошибках и меню, выберите другую', col: '#ff8a7a' }; return; }
        st.wait = null;
        st.msg = r.swapped ? { text: 'Клавиши поменялись местами: «' + HO.KEY_ACTIONS.find(a => a.id === r.swapped).name + '» теперь на ' + HO.keyLabel(HO.keyOf(this.settings, r.swapped)), col: '#f0d890' } : null;
        this.saveSettings();
        return;
      }
      if (e.code === 'Escape') this.settingsWin = null;
    }

    keyDown(e) {
      if (!this.active()) return;
      if (e.code === 'F9' || e.code === 'F10') return;
      if (this.settingsWin) return this.settingsKey(e);
      if (this.mode !== 'world') return this.frontKey(e);
      const act = HO.actionFor(this.settings, e.code);
      if (MOVES.has(act)) { this.held.add(act); e.preventDefault(); return; }
      if (act === 'target') { e.preventDefault(); if (!e.repeat) this.tabTarget(); return; }
      if (act === 'self') { e.preventDefault(); this.cmd({ t: 'target', uid: this.hero().uid }); return; }
      if (e.repeat) return;
      if (act && act.startsWith('bar')) { this.useSlot(Number(act.slice(3)) - 1); e.preventDefault(); return; }
      if (act === 'jump') { this.cmd({ t: 'jump' }); e.preventDefault(); }
      else if (act === 'autorun') this.cmd({ t: 'autorun', on: !this.hero().auto });
      else if (act === 'sit') this.cmd({ t: 'sit', on: !this.hero().sit });
      else if (act === 'bag') this.bagOpen = !this.bagOpen;
      else if (act === 'char') this.charOpen = !this.charOpen;
      else if (act === 'skills') this.win = this.win && this.win.type === 'skills' ? null : { type: 'skills' };
      else if (act === 'log') this.win = this.win && this.win.type === 'log' ? null : { type: 'log' };
      else if (act === 'map') this.win = this.win && this.win.type === 'map' ? null : { type: 'map' };
      else if (act === 'party') { if (this.world.state.party) this.win = this.win && this.win.type === 'party' ? null : { type: 'party' }; else this.denyMsg = { text: 'Напарников нет. Их зовёт маяк у группового задания', t: this.time }; }
      else if (e.code === 'Escape') {
        if (this.leaving) { this.leaving = null; this.denyMsg = { text: 'Выход отменён', t: this.time }; }
        else if (this.menu) this.menu = false;
        else if (this.win) this.win = null;
        else if (this.bagOpen || this.charOpen) { this.bagOpen = false; this.charOpen = false; }
        else if (this.trainer) this.trainer = null;
        else if (this.hero().cast) this.cmd({ t: 'stopCast' });
        else if (this.hero().target) this.cmd({ t: 'target', uid: 0 });
        else this.menu = true;
      }
    }

    heroUi() {
      const a = this.hero(), key = (a.sheet && a.sheet.id && !this.debug ? a.sheet.id : 'debug') + ':' + a.path + ':' + a.race;
      if (!this.uiState || this.uiState.key !== key) this.uiState = Object.assign(HO.loadHeroUi(this.debug ? { getItem: () => null } : this.storage, a.sheet && a.sheet.id, a.path, a.race), { key, id: a.sheet && a.sheet.id });
      return this.uiState;
    }

    saveHeroUi() {
      const ui = this.heroUi();
      if (!this.debug && ui.id) HO.saveHeroUi(this.storage, ui.id, ui);
    }

    barIds() {
      return this.heroUi().bar;
    }

    dropDrag(x, y) {
      const d = this.drag;
      this.drag = null;
      if (!d) return;
      const slot = (this.slotRects || []).findIndex(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
      const ui = this.heroUi();
      if (slot >= 0) HO.placeOnBar(ui, slot, d.id, d.from);
      else if (d.from >= 0) ui.bar[d.from] = null;
      else return;
      this.saveHeroUi();
      this.sfx('shuffle');
    }

    abilityOf(id) {
      return id && (HO.ABILITIES[id] || Object.assign({ racial: true, lvl: 1, cost: 0, cast: 0, gcd: false }, Object.values(HO.RACIALS).find(r => r.id === id)));
    }

    useSlot(i) {
      const id = this.barIds()[i];
      if (!id) return;
      const a = this.hero(), ab = this.abilityOf(id);
      let uid = a.target;
      if (ab.target === 'ally') { const t = this.world.byUid(a.target); uid = t && (t.kind === 'hero' || t.ward) && !t.dead ? t.uid : a.uid; }
      if (ab.target === 'enemy' && !uid) { this.tabTarget(); uid = this.hero().target; }
      this.cmd({ t: 'cast', ab: id, uid: uid || 0 });
    }

    tabTarget() {
      const a = this.hero(), list = [];
      for (const f of this.world.foes()) {
        if (f.dead || f.state === 'evade') continue;
        const dx = f.x - a.x, dz = f.z - a.z, d = Math.sqrt(dx * dx + dz * dz);
        if (d > 40) continue;
        const front = (Math.sin(this.cam.yaw) * dx - Math.cos(this.cam.yaw) * dz) / Math.max(d, 0.01);
        if (front < 0.2) continue;
        list.push({ f, d });
      }
      list.sort((p, q) => p.d - q.d);
      if (!list.length) return;
      const i = list.findIndex(x => x.f.uid === a.target);
      const next = list[(i + 1) % list.length].f;
      this.cmd({ t: 'target', uid: next.uid });
    }

    pickAt(px, py) {
      const v = this.lastView;
      if (!v) return null;
      const w = this.hud.width, h = this.hud.height, e = v.eye, t = v.target;
      let fx = t[0] - e[0], fy = t[1] - e[1], fz = t[2] - e[2];
      let l = Math.hypot(fx, fy, fz); fx /= l; fy /= l; fz /= l;
      let rx = -fz, rz = fx; l = Math.hypot(rx, rz); rx /= l; rz /= l;
      const ux = -fy * rz, uy = rz * fx - rx * fz, uz = fy * rx;
      const th = Math.tan(FOV / 2), nx = (px / w * 2 - 1) * th * w / h, ny = (1 - py / h * 2) * th;
      const d = [fx + rx * nx + ux * ny, fy + uy * ny, fz + rz * nx + uz * ny];
      l = Math.hypot(d[0], d[1], d[2]); d[0] /= l; d[1] /= l; d[2] /= l;
      const wall = rayBoxes(this.world.boxes, e, d, 200);
      let best = null, bestT = wall;
      for (const a of this.world.state.actors) {
        if (a.uid === this.hero().uid) continue;
        const hgt = a.h || T.height, cx = a.x - e[0], cy = a.y + hgt / 2 - e[1], cz = a.z - e[2];
        const tc = cx * d[0] + cy * d[1] + cz * d[2];
        if (tc < 0) continue;
        const dd = cx * cx + cy * cy + cz * cz - tc * tc, rad = Math.max(a.r || 0.5, hgt / 2) * 0.95;
        if (dd <= rad * rad && tc < bestT) { best = a; bestT = tc; }
      }
      return best;
    }

    clickWorld(px, py, right) {
      const a = this.pickAt(px, py);
      if (!a) { if (!right) this.cmd({ t: 'target', uid: 0 }); return; }
      this.cmd({ t: 'target', uid: a.uid });
      if (right && a.kind === 'foe' && !a.dead) this.cmd({ t: 'attack', on: true });
      if (right && a.kind === 'npc' && !a.ward) this.cmd({ t: 'talk', uid: a.uid });
      if (right && a.kind === 'obj') this.cmd({ t: 'use', uid: a.uid });
      if (right && a.kind === 'foe' && a.dead) {
        const me = this.hero();
        if (a.loot && a.loot[me.uid]) {
          if (Math.hypot(a.x - me.x, a.z - me.z) <= C.useRange + a.r) this.win = { type: 'loot', uid: a.uid, x: px, y: py };
          else this.denyMsg = { text: HO.DENY.far, t: this.time };
        }
      }
    }

    pressButton(x, y) {
      for (const b of this.buttons) {
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { this.sfx('select'); b.fn(); return true; }
      }
      return false;
    }

    sendInput() {
      const h = this.held, steer = this.mouse.r, a = this.hero();
      let f = (h.has('fwd') || (this.mouse.l && this.mouse.r) ? 1 : 0) - (h.has('back') ? 1 : 0);
      let s = (h.has('sr') ? 1 : 0) - (h.has('sl') ? 1 : 0), r = 0;
      const turn = (h.has('right') ? 1 : 0) - (h.has('left') ? 1 : 0);
      if (steer) s = HO.clamp(s + turn, -1, 1); else r = turn;
      if (f !== this.sent.f || s !== this.sent.s || r !== this.sent.r) {
        this.cmd({ t: 'move', f, s, r });
        this.sent.f = f; this.sent.s = s; this.sent.r = r;
      }
      if (steer && !a.dead && Math.abs(angleDiff(a.yaw, this.cam.yaw)) > 1e-3) this.cmd({ t: 'face', yaw: this.cam.yaw });
    }

    frame(now) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(t => this.frame(t));
      const dt = this.last ? Math.min(0.25, (now - this.last) / 1000) : 0;
      this.last = now;
      this.time += dt;
      this.sound(dt);
      if (this.mode !== 'world') {
        this.frames++;
        if (now - this.fpsAt >= 1000) { this.fps = this.frames; this.frames = 0; this.fpsAt = now; }
        this.frontFrame(dt);
        return;
      }
      if (this.dirty && this.time - this.saveAt > 5) this.saveHero();
      if (this.leaving) { this.leaveTick(); if (this.mode !== 'world') return; }
      this.acc += dt;
      while (this.acc >= HO.DT) {
        this.sendInput();
        this.prev = this.snapshot();
        this.world.step();
        this.readEvents(this.world.events);
        this.acc -= HO.DT;
        if (this.pendingTravel) {
          const z = this.pendingTravel, sh = this.hero().sheet;
          this.saveHero(true);
          this.newWorld(HO.copy(sh), z);
          this.saveHero(true);
          return;
        }
        if (this.world.state.tick % T.hz === 0) this.hashText = this.world.hash();
      }
      this.frames++;
      if (now - this.fpsAt >= 1000) { this.fps = this.frames; this.frames = 0; this.fpsAt = now; }
      this.follow(dt);
      this.draw(this.acc / HO.DT, dt);
    }

    name(uid) {
      const a = this.world.byUid(uid);
      if (!a) return '';
      return a.uid === this.hero().uid ? 'вы' : a.name;
    }

    addLog(text, col) {
      this.log.push({ text, col: col || '#e0e4ee', t: this.time });
      if (this.log.length > 8) this.log.shift();
    }

    floater(uid, text, col, big) {
      this.floaters.push({ uid, text, col, big: !!big, t: this.time, dx: (this.floaters.length % 5 - 2) * 10 });
    }

    sfx(id) {
      if (!this.audio || !id) return;
      if (this.time - (this.sfxAt[id] || -9) < HO.SFX_GAP) return;
      this.sfxAt[id] = this.time;
      this.audio.sfx(id);
    }

    sound(dt) {
      if (!this.audio) return;
      const want = this.mode === 'world' && this.world ? HO.musicFor(this.world) : 'menu';
      if (want !== this.musicWant) { this.musicWant = want; this.musicSince = this.time; }
      const calm = want === 'station' && ['crises', 'boss'].includes(this.audio.wanted);
      if (!calm || this.time - this.musicSince > 5) this.audio.music(want);
      if (this.mode !== 'world' || !this.world) return;
      const a = this.hero(), p = this.prev && this.prev[a.uid];
      const speed = p ? Math.hypot(a.x - p.x, a.z - p.z) / HO.DT : 0;
      if (a.dead || a.ghost || !a.ground || speed < 0.5) { this.stepT = 0; return; }
      this.stepT += dt;
      if (this.stepT >= HO.STEP_EVERY && this.audio.ctx) {
        const s = HO.STEP_SOUND;
        this.stepT = 0;
        this.audio.noise(this.audio.ctx.currentTime, s.dur, s.vol, s.freq, s.to);
      }
    }

    readEvents(events) {
      const me = this.hero().uid;
      const party = new Set(this.world.state.actors.filter(x => x.kind === 'hero' && x.uid !== me).map(x => x.uid));
      const hero = this.hero(), close = uid => { const x = this.world.byUid(uid); return !!x && Math.hypot(x.x - hero.x, x.z - hero.z) < 40; };
      for (const e of events) for (const id of HO.eventSfx(e, me, party, close)) this.sfx(id);
      for (const e of events) {
        if (e.uid === me && ['xp', 'credits', 'levelUp', 'learned', 'anchorFound', 'anchorPaid', 'bound', 'repaired', 'scanned', 'release', 'death'].includes(e.k)) this.dirty = true;
        if (e.k === 'xp' && e.uid === me) { this.floater(me, '+' + e.v + ' опыта', '#c8a0ff'); this.addLog('Опыт: +' + e.v + (e.rested ? ', из них ' + e.rested + ' за отдых' : '') + '.', '#c8a0ff'); }
        else if (e.k === 'credits' && e.uid === me) this.addLog('Кредиты: +' + e.v + '.', '#f0d890');
        else if (e.k === 'levelUp' && e.uid === me) {
          this.banner = { text: 'Новый уровень: ' + e.lvl + '!', col: '#f0d890', t: this.time };
          this.addLog('Вы достигли ' + e.lvl + '-го уровня. Наставник научит новому.', '#f0d890');
          this.effects.push({ burst: true, uid: me, col: '#f0d890', t: this.time, dur: 0.8, r: 2.5, elem: 'imag' });
          this.effects.push({ column: true, uid: me, col: '#f0d890', t: this.time, dur: 1.4 });
          this.saveHero(true);
        } else if (e.k === 'learned' && e.uid === me) {
          const ab = HO.ABILITIES[e.ab];
          this.addLog('Изучено: ' + ab.name + (HO.maxRank(e.ab) > 1 ? ', ранг ' + e.rank : '') + ' (' + e.cost + ' кр.).', '#a0ffb0');
          this.saveHero(true);
        } else if (e.k === 'talk' && e.uid === me) this.openNpc(e.npc);
        else if (e.k === 'questAccept' && e.uid === me) { this.addLog('Задание принято: «' + HO.QUESTS[e.q].title + '».', '#f0d890'); this.dirty = true; }
        else if (e.k === 'questDone' && e.uid === me) {
          this.addLog('Задание выполнено: «' + HO.QUESTS[e.q].title + '».', '#a0ffb0');
          for (const [id, n] of e.items) this.addLog('Получено: ' + HO.ITEMS[id].name + (n > 1 ? ' ×' + n : '') + '.', '#a0ffb0');
          this.banner = { text: 'Задание выполнено: «' + HO.QUESTS[e.q].title + '»', col: '#a0ffb0', t: this.time };
          this.saveHero(true);
        } else if (e.k === 'questAbandon' && e.uid === me) { this.addLog('Задание отменено: «' + HO.QUESTS[e.q].title + '».', '#c8c8c8'); this.dirty = true; }
        else if (e.k === 'goal' && e.uid === me) {
          const g = HO.QUESTS[e.q].goals[e.i];
          this.denyMsg = { text: g.text + (e.need > 1 ? ': ' + e.have + ' / ' + e.need : ': готово'), t: this.time, col: '#f0d890' };
          this.dirty = true;
        } else if (e.k === 'got' && e.uid === me) { this.addLog('Получено: ' + HO.ITEMS[e.item].name + (e.n > 1 ? ' ×' + e.n : '') + '.', '#c8d0e0'); this.dirty = true; }
        else if (e.k === 'bought' && e.uid === me) { this.addLog('Куплено: ' + HO.ITEMS[e.item].name + ' за ' + e.price + ' кр.', '#c8d0e0'); this.dirty = true; }
        else if (e.k === 'sold' && e.uid === me) { this.addLog('Продано' + (e.item === 'junk' ? ' хлама' : ': ' + HO.ITEMS[e.item].name) + ' на ' + e.v + ' кр.', '#c8d0e0'); this.dirty = true; }
        else if (e.k === 'equip' && e.uid === me) { this.addLog((e.off ? 'Снято: ' : 'Надето: ') + HO.ITEMS[e.item].name + '.', '#c8d0e0'); this.dirty = true; }
        else if (e.k === 'usedItem' && e.uid === me) this.dirty = true;
        else if (e.k === 'gate' && e.uid === me) this.addLog(e.gate === 'hatch' ? 'Люк открывается.' : 'Отталкивающий мост включён.', '#7ad8ff');
        else if (e.k === 'liftMenu' && e.uid === me) this.win = { type: 'lift', uid: e.obj };
        else if (e.k === 'travel' && e.uid === me) this.pendingTravel = { zone: e.zone, x: e.x, z: e.z, yaw: e.yaw };
        else if (e.k === 'teleport' && e.uid === me) { this.prev = this.snapshot(); this.cam.yaw = this.hero().yaw; this.win = null; this.loading = { text: this.areaName(), t: this.time - 0.8 }; }
        else if (e.k === 'anchorMenu' && e.uid === me) this.win = { type: 'anchor', uid: e.obj };
        else if (e.k === 'trialStart' && e.uid === me) { this.win = null; this.banner = { text: HO.TRIALS[e.trial].name, col: '#f0d890', t: this.time }; this.addLog('Испытание началось.', '#f0d890'); }
        else if (e.k === 'trialWave' && e.uid === me) this.addLog(e.n > 1 ? 'Появляются новые враги: ' + e.n + '.' : 'Появляется новый враг.', '#ffd080');
        else if (e.k === 'trialEnd' && e.uid === me) {
          const why = { dead: 'вы без сознания', left: 'вы ушли слишком далеко', ward: 'не уберегли подопечного', time: 'время вышло' }[e.why] || '';
          this.banner = { text: e.won ? 'Испытание пройдено!' : 'Испытание не пройдено: ' + why, col: e.won ? '#a0ffb0' : '#ff8080', t: this.time };
          this.addLog(e.won ? 'Испытание пройдено. Вернитесь к наставнику.' : 'Испытание не пройдено. Его можно начать снова.', e.won ? '#a0ffb0' : '#ff8080');
          this.dirty = true;
        } else if (e.k === 'bleed') this.floater(e.uid, 'Рана открылась', '#ff6060');
        else if (e.k === 'vanish') { this.floater(e.uid, 'Пробита, гаснет', '#7ad8ff', true); this.effects.push({ burst: true, uid: e.uid, col: '#7ad8ff', t: this.time, dur: 0.6, r: 2 }); }
        else if (e.k === 'anchorFound' && e.uid === me) { this.banner = { text: 'Открыт Якорь пространства «' + HO.ANCHORS[e.anchor].name + '»', col: '#7ad8ff', t: this.time }; this.addLog('Открыт Якорь «' + HO.ANCHORS[e.anchor].name + '».', '#7ad8ff'); }
        else if (e.k === 'anchorPaid' && e.uid === me) this.addLog('Перемещение: ' + e.v + ' кр.', '#c8d0e0');
        else if (e.k === 'bound' && e.uid === me) this.addLog('Карманный якорь привязан к «' + HO.ANCHORS[e.anchor].name + '».', '#7ad8ff');
        else if (e.k === 'repaired' && e.uid === me) this.addLog('Снаряжение починено за ' + e.v + ' кр.', '#c8d0e0');
        else if (e.k === 'scanned' && e.uid === me) this.addLog('Пистолет записал: ' + this.name(e.foe) + '.', '#c8d0e0');
        else if (e.k === 'revived' && e.uid === me) { this.addLog('Проекция вернулась в тело.', '#a0ffb0'); this.banner = { text: 'Вы снова в сознании', col: '#a0ffb0', t: this.time }; }
        else if (e.k === 'release' && e.uid === me) this.addLog(e.mode === 'medic' ? 'Медпункт: Слабость на 2 мин., снаряжение износилось.' : 'Вы Проекция. Дойдите до тела.', e.mode === 'medic' ? '#ffb0a0' : '#9ad8ff');
        if (e.k === 'dmg') {
          const mine = e.src === me, onMe = e.uid === me;
          if (mine || onMe) this.floater(e.uid, (e.crit ? e.v + '!' : String(e.v)), onMe ? '#ff5050' : e.weak ? elemCol(e.elem) : '#ffffff', e.crit);
          if (mine && !e.auto && !e.dot) this.addLog('Вы наносите ' + e.v + ' урона' + (e.crit ? ' (крит)' : '') + ': ' + this.name(e.uid) + '.');
          if (onMe && !e.dot) this.addLog(this.name(e.src) + ' наносит вам ' + e.v + ' урона.', '#ffb0a0');
        } else if (e.k === 'heal' && (e.src === me || e.uid === me) && e.v > 0) {
          this.floater(e.uid, '+' + e.v, '#60ff80', e.crit);
        } else if (e.k === 'miss' && (e.src === me || e.uid === me)) this.floater(e.uid, 'Промах', '#c0c0c0');
        else if (e.k === 'break') {
          const f = this.world.byUid(e.uid);
          this.floater(e.uid, 'Пробитие!', elemCol(e.elem), true);
          this.effects.push({ shatter: true, uid: e.uid, elem: e.elem, col: elemCol(e.elem), t: this.time, dur: 0.7 });
          this.addLog(f.name + ': пробитие (' + H.BREAK_EFFECT[e.elem] + ')' + (e.prep ? ', подготовка сорвана.' : '.'), elemCol(e.elem));
          if (e.prep) this.banner = { text: 'Подготовка сорвана!', col: '#a0ffb0', t: this.time };
        } else if (e.k === 'prep') { this.banner = { text: e.line, col: '#ff6060', t: this.time }; this.addLog(e.line, '#ff8080'); }
        else if (e.k === 'say') { const c = this.world.byUid(e.uid); if (c) { this.addLog(c.name + ': «' + e.text + '»', '#a0ffb0'); this.floater(e.uid, '«' + e.text + '»', '#a0ffb0'); } }
        else if (e.k === 'party' && e.uid === me) { this.addLog(e.on ? 'Напарники пришли. Приказы и метки: N.' : 'Напарники ушли.', '#a0ffb0'); if (!e.on && this.win && this.win.type === 'party') this.win = null; }
        else if (e.k === 'order' && e.uid === me) this.addLog('Приказ: ' + HO.ORDERS[e.o] + '.', '#a0ffb0');
        else if (e.k === 'mark' && e.uid === me) this.addLog(e.foe ? (e.m === 'first' ? 'Метка «Первая цель»: ' : 'Метка «Стоп-кадр»: ') + this.name(e.foe) + '.' : 'Метка снята.', '#a0ffb0');
        else if (e.k === 'phase' && e.text) { this.banner = { text: e.text, col: '#ff8060', t: this.time }; this.addLog(e.text, '#ff8060'); }
        else if ((e.k === 'summon' || e.k === 'pulse' || e.k === 'crumble') && e.text) { this.addLog(e.text, '#ffd080'); if (e.k !== 'pulse') this.banner = { text: e.text, col: '#ffd080', t: this.time }; }
        else if (e.k === 'chestUp') this.banner = { text: e.bonus ? 'Ранняя победа! Сундук Инкубатора ждёт' : 'Сундук Инкубатора ждёт', col: '#f0d890', t: this.time };
        else if (e.k === 'chest' && e.uid === me) { this.addLog('Сундук: ' + e.credits + ' кр.' + (e.bonus ? ', бонус дня' : '') + '.', '#f0d890'); for (const id of e.items) this.addLog('Получено: ' + HO.ITEMS[id].name + '.', (HO.QUALITY[HO.ITEMS[id].q] || HO.QUALITY[1]).col); this.dirty = true; }
        else if (e.k === 'prepHit') this.addLog(e.n ? '«' + e.skill + '» попадает.' : '«' + e.skill + '» мимо.', e.n ? '#ff8080' : '#a0ffb0');
        else if (e.k === 'deny' && e.uid === me) this.denyMsg = { text: e.text || HO.DENY[e.why] || e.why, t: this.time };
        else if (e.k === 'death') {
          if (e.uid === me) this.addLog('Вы без сознания.', '#ff6060');
          else if (e.src === me) this.addLog(this.name(e.uid) + ' повержен.', '#f0d890');
        } else if (e.k === 'evade' && !e.src) this.addLog(this.name(e.uid) + ' уходит на своё место.', '#c0c0c0');
        else if (e.k === 'aggro' && e.tgt === me) this.addLog(this.name(e.uid) + ' нападает.', '#ffd080');
        else if (e.k === 'taunt' && e.src === me) this.floater(e.uid, 'Вызов', '#ffd080');
        else if (e.k === 'cleanse') this.floater(e.uid, 'Недуг снят', '#a0ffb0');
        else if (e.k === 'castStop' && e.uid === me && e.why === 'move') this.denyMsg = { text: 'Прервано', t: this.time };
        if (e.k === 'cast' || e.k === 'swing' || e.k === 'foeSwing') this.spawnEffect(e);
        if ((e.k === 'swing' || e.k === 'foeSwing' || (e.k === 'cast' && HO.ABILITIES[e.ab] && HO.ABILITIES[e.ab].target !== 'self')) && this.anims[e.uid]) { this.anims[e.uid].shot = 'attack'; this.anims[e.uid].shotAt = this.time; }
        if (e.k === 'release' && this.anims[e.uid]) this.anims[e.uid].clip = 'idle';
      }
    }

    spawnEffect(e) {
      const src = this.world.byUid(e.uid), tgt = this.world.byUid(e.tgt);
      if (!src || !tgt) return;
      let col = '#ffffff', ranged = false, elem = 'phys';
      if (e.k === 'swing') { ranged = !e.melee; elem = e.elem || 'phys'; }
      else if (e.k === 'foeSwing') { ranged = e.bolt; elem = e.elem || 'phys'; }
      else {
        const ab = HO.ABILITIES[e.ab];
        if (!ab) return;
        ranged = src !== tgt && ab.range !== 'melee' && ab.range > 5;
        if (ab.target === 'ally' || ab.fx.some(f => f.k === 'heal' || f.k === 'hot')) elem = 'heal';
        else elem = ab.elem || (ab.elems ? ab.elems[0] : HO.PATHS[ab.path].elems[0]);
        if (src === tgt || ab.fx.some(f => f.k === 'aoe' && f.around === 'self')) this.effects.push({ burst: true, uid: src.uid, elem, col: elem === 'heal' ? '#80ff90' : elemCol(elem), t: this.time, dur: 0.45, r: (ab.fx.find(f => f.k === 'aoe') || {}).r || 1.5 });
      }
      col = elem === 'heal' ? '#80ff90' : elemCol(elem);
      if (ranged) this.effects.push({ from: src.uid, to: tgt.uid, elem, col, t: this.time, dur: 0.22 });
      else if (src !== tgt) this.effects.push({ hit: true, uid: tgt.uid, elem, col, t: this.time, dur: elem === 'heal' ? 0.6 : 0.25 });
    }

    follow(dt) {
      const a = this.hero();
      const moving = !a.dead && (a.mf !== 0 || a.ms !== 0 || a.mr !== 0 || a.auto);
      if (!this.mouse.l && !this.mouse.r && moving) this.cam.yaw = HO.wrapAngle(this.cam.yaw + angleDiff(this.cam.yaw, a.yaw) * Math.min(1, dt * 4));
    }

    view(alpha) {
      const actors = [], pos = {};
      const target = this.hero().target;
      for (const a of this.world.state.actors) {
        if (a.kind === 'obj' && this.world.state.tick < a.hiddenUntil) continue;
        const p = this.prev[a.uid] || a;
        const x = p.x + (a.x - p.x) * alpha, y = p.y + (a.y - p.y) * alpha, z = p.z + (a.z - p.z) * alpha;
        const yaw = p.yaw + angleDiff(p.yaw, a.yaw) * alpha;
        let tint = null, flash = 0;
        const has = k => a.auras && a.auras.some(x2 => x2.k === k);
        if (a.dead) tint = [0.35, 0.35, 0.4];
        else if (a.ghost) { tint = [0.5, 0.85, 1.4]; flash = 0.35; }
        else if (has('freeze')) tint = [0.65, 0.9, 1.2];
        else if (has('poly')) tint = [0.55, 0.6, 0.75];
        else if (a.kind === 'foe' && a.tough <= 0) { tint = [1.2, 1.2, 1.2]; flash = 0.25; }
        if (a.kind === 'foe' && a.prep) flash = 0.2 + 0.2 * Math.sin(this.time * 14);
        const v = { uid: a.uid, kind: a.kind, id: a.id, x, y, z, yaw, path: a.path, race: a.race, look: a.kind === 'hero' ? a.sheet && a.sheet.look : a.look, r: a.r, dead: a.dead, tint, flash, still: has('poly') || has('freeze'), floor: Math.max(this.world.floorBelow(x, z, y + 0.05, a.r), -50) };
        const prop = typeof v.look === 'string' && HO.MODEL_IDS.props[v.look];
        if (a.companion) { v.kind = 'npc'; v.look = HO.COMPANIONS[a.companion].look; }
        if (prop && !a.companion && this.renderer && this.renderer.hasModel(prop)) v.model = prop;
        else if (this.renderer) {
          const speed = Math.hypot(a.x - p.x, a.z - p.z) / HO.DT;
          const ap = this.animPose(a, v, speed);
          if (ap) Object.assign(v, ap);
        }
        actors.push(v);
        pos[a.uid] = v;
      }
      const me = pos[this.hero().uid], body = this.hero().corpse;
      if (this.hero().ghost && body) {
        const h = this.hero(), cv = { uid: -1, kind: 'hero', x: body.x, y: body.y, z: body.z, yaw: 0, path: h.path, race: h.race, look: h.sheet.look, r: h.r, dead: true, tint: [0.45, 0.45, 0.5], flash: 0, floor: Math.max(this.world.floorBelow(body.x, body.z, body.y + 0.05), -50) };
        const mid = HO.MODEL_IDS.heroes[h.race + '_' + h.sheet.sex], md = mid && this.modelData && this.modelData[mid];
        if (md) Object.assign(cv, { model: mid, pose: HO.samplePose(md, 'death', 99) }, this.heroDress(h.sheet, h.race, h.path, mid));
        actors.push(cv);
      }
      const tgt = [me.x, me.y + 1.6, me.z];
      const c = this.cam, fx = Math.sin(c.yaw), fz = -Math.cos(c.yaw);
      const dir = [-fx * Math.cos(c.pitch), Math.sin(c.pitch), -fz * Math.cos(c.pitch)];
      const hit = rayBoxes(this.world.boxes, tgt, dir, c.dist);
      const d = Math.max(0.6, hit - 0.25);
      const marks = [];
      for (const f of this.world.foes()) {
        if (!f.prep || f.dead) continue;
        const p = f.prep, prog = HO.clamp((this.world.state.tick - p.start) / Math.max(1, p.end - p.start), 0, 1);
        const at = p.kind === 'single' ? pos[p.tgt] || pos[f.uid] : pos[f.uid], col = [1, 0.2, 0.15], alpha = 0.45 + 0.4 * prog;
        if (!at) continue;
        if (p.kind === 'around') marks.push({ x: p.x, y: at.floor, z: p.z, r: p.r, col, alpha, fill: true });
        else if (p.kind === 'single') marks.push({ x: at.x, y: at.floor, z: at.z, r: p.r, col, alpha, fill: true });
        else if (p.kind === 'circles') for (const [cx, cz] of p.pts) marks.push({ x: cx, y: at.floor, z: cz, r: p.r, col, alpha, fill: true });
        else if (p.kind === 'cone') for (let i = 1; i <= 5; i++) { const dd = p.r * i / 5.5; marks.push({ x: p.x + Math.sin(p.yaw) * dd, y: at.floor, z: p.z - Math.cos(p.yaw) * dd, r: Math.max(0.6, dd * Math.sin(p.arc)), col, alpha: alpha * 0.8, fill: true }); }
        else if (p.kind === 'all') marks.push({ x: at.x, y: at.floor, z: at.z, r: (f.r || 1) + 1 + 2 * prog, col: [1, 0.5, 0.1], alpha: 0.9 });
      }
      if (this.hero().ghost && body) marks.push({ x: body.x, y: Math.max(this.world.floorBelow(body.x, body.z, body.y + 0.05), -50), z: body.z, r: C.reviveRange, col: [0.4, 0.8, 1], alpha: 0.35 + 0.15 * Math.sin(this.time * 3) });
      if (target && pos[target] && !pos[target].dead) {
        const t = pos[target], f = this.world.byUid(target);
        marks.push({ x: t.x, y: t.floor, z: t.z, r: (t.r || 0.5) + 0.35, col: f.kind === 'foe' ? [1, 0.3, 0.2] : [0.3, 1, 0.4], alpha: 0.9 });
      }
      const effects = [], sprites = this.renderer && this.renderer.fxTex ? [] : null;
      this.effects = this.effects.filter(e => this.time - e.t < e.dur);
      if (this.effects.length > HO.EFFECT_CAP) this.effects = this.effects.slice(-HO.EFFECT_CAP);
      if (sprites) this.ambientSprites(pos, sprites);
      for (const e of this.effects) {
        if (sprites) { this.effectSprites(e, pos, sprites); continue; }
        const k = (this.time - e.t) / e.dur;
        if (e.from) {
          const a = pos[e.from], b = pos[e.to];
          if (!a || !b) continue;
          effects.push({ x: a.x + (b.x - a.x) * k, y: a.y + 1.3 + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k, s: 0.28, col: rgb(e.col), spin: k * 6 });
        } else if (e.hit) {
          const a = pos[e.uid];
          if (a) effects.push({ x: a.x, y: a.y + 1.2, z: a.z, s: 0.5 * (1 - k) + 0.1, col: rgb(e.col), spin: k * 3 });
        } else if (e.burst) {
          const a = pos[e.uid];
          if (a) marks.push({ x: a.x, y: a.floor, z: a.z, r: e.r * (0.3 + 0.7 * k), col: rgb(e.col), alpha: 1 - k });
        }
      }
      const gates = this.world.boxes.filter(b => b[6] === 'gate');
      return { eye: [tgt[0] + dir[0] * d, tgt[1] + dir[1] * d, tgt[2] + dir[2] * d], target: tgt, actors, me, pos, marks, effects, sprites, time: this.time, decor: this.world.zone.decor || [], gates };
    }

    effectSprites(e, pos, out) {
      const k = (this.time - e.t) / e.dur, col = rgb(e.col), cell = HO.fxCell(e.elem);
      if (e.from) {
        const a = pos[e.from], b = pos[e.to];
        if (!a || !b) return;
        for (let i = 0; i < 3; i++) {
          const kk = Math.max(0, k - i * 0.12), at = [a.x + (b.x - a.x) * kk, a.y + 1.3 + (b.y - a.y) * kk, a.z + (b.z - a.z) * kk];
          out.push({ cell: i ? 'glow' : cell, x: at[0], y: at[1], z: at[2], s: i ? 0.5 - i * 0.12 : 0.7, rot: this.time * 8, col, alpha: i ? 0.5 / i : 1 });
        }
        out.push({ cell: 'glow', x: a.x + (b.x - a.x) * k, y: a.y + 1.3 + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k, s: 1.1, rot: 0, col, alpha: 0.5 });
      } else if (e.hit) {
        const a = pos[e.uid];
        if (!a) return;
        const rise = e.elem === 'heal' ? k * 1.2 : 0;
        out.push({ cell: 'glow', x: a.x, y: a.y + 1.2 + rise, z: a.z, s: 1.6 + k, rot: 0, col, alpha: (1 - k) * 0.6 });
        out.push({ cell, x: a.x, y: a.y + 1.2 + rise, z: a.z, s: 1.1 + 1.2 * k, rot: k * 1.5, col, alpha: 1 - k });
        if (e.elem === 'heal') out.push({ cell: 'sparkle', x: a.x, y: a.y + 0.8 + k * 1.6, z: a.z, s: 1.4, rot: 0, col, alpha: 1 - k });
      } else if (e.burst) {
        const a = pos[e.uid];
        if (!a) return;
        out.push({ cell: 'ring', ground: true, x: a.x, y: a.floor, z: a.z, s: 2 * e.r * (0.3 + 0.7 * k), rot: k * 2, col, alpha: 1 - k });
        out.push({ cell, x: a.x, y: a.y + 0.6 + k, z: a.z, s: 1 + k, rot: k, col, alpha: (1 - k) * 0.9 });
      } else if (e.shatter) {
        const a = pos[e.uid];
        if (!a) return;
        out.push({ cell: 'shards', x: a.x, y: a.y + 1.3, z: a.z, s: 1.4 + 2.2 * k, rot: k * 0.8, col: [1, 1, 1], alpha: 1 - k });
        out.push({ cell, x: a.x, y: a.y + 1.3, z: a.z, s: 1 + 1.5 * k, rot: -k, col, alpha: 1 - k });
        out.push({ cell: 'ring', ground: true, x: a.x, y: a.floor, z: a.z, s: 2.5 + 3 * k, rot: 0, col, alpha: 1 - k });
      } else if (e.column) {
        const a = pos[e.uid];
        if (!a) return;
        out.push({ cell: 'beam', x: a.x, y: a.y + 1.8, z: a.z, s: 1.8, stretch: 2, rot: 0, col, alpha: Math.sin(k * Math.PI) });
        out.push({ cell: 'sparkle', x: a.x, y: a.y + 0.6 + 2 * k, z: a.z, s: 1.6, rot: 0, col, alpha: 1 - k });
      }
    }

    ambientSprites(pos, out) {
      const t = this.time, h = this.hero();
      for (const a of this.world.state.actors) {
        const v = pos[a.uid];
        if (!v) continue;
        if (a.kind === 'obj' && a.look === 'rift') {
          for (const dz of [-0.2, 0.2]) {
            out.push({ cell: 'vortex', x: v.x, y: v.y + 1.5, z: v.z + dz, s: 2.2, rot: t * 1.6 * Math.sign(dz), col: [1, 0.35, 0.85], alpha: 0.9 });
            out.push({ cell: 'glow', x: v.x, y: v.y + 1.5, z: v.z + dz, s: 2.6, rot: 0, col: [1, 0.3, 0.8], alpha: 0.35 });
          }
        } else if (a.kind === 'obj' && a.look === 'anchor') {
          out.push({ cell: 'glow', x: v.x, y: v.y + 2.1, z: v.z, s: 1.3 + 0.15 * Math.sin(t * 2.5), rot: 0, col: [0.5, 0.85, 1], alpha: 0.7 });
        } else if (a.kind === 'obj' && a.look === 'nest') {
          out.push({ cell: 'glow', x: v.x, y: v.y + 1.05, z: v.z, s: 1.1 + 0.2 * Math.sin(t * 3 + a.uid), rot: 0, col: [0.6, 1, 0.3], alpha: 0.6 });
        } else if (a.kind === 'foe' && a.prep && !a.dead) {
          out.push({ cell: 'glow', x: v.x, y: v.y + (a.h || 1.6) * 0.6, z: v.z, s: (a.r || 0.6) * 3 + 0.4 * Math.sin(t * 12), rot: 0, col: [1, 0.3, 0.2], alpha: 0.45 });
        }
      }
      if (h.ghost) {
        const v = pos[h.uid];
        if (v) for (let i = 0; i < 2; i++) out.push({ cell: 'sparkle', x: v.x, y: v.y + 0.6 + ((t * 0.6 + i * 0.5) % 1) * 1.6, z: v.z, s: 1.3, rot: i * 1.3, col: [0.5, 0.85, 1], alpha: 0.8 });
        const body = h.corpse;
        if (body) out.push({ cell: 'beam', x: body.x, y: Math.max(this.world.floorBelow(body.x, body.z, body.y + 0.05), -50) + 4.2, z: body.z, s: 1.4, stretch: 6, rot: 0, col: [0.5, 0.85, 1], alpha: 0.6 + 0.2 * Math.sin(t * 3) });
      }
    }

    resize() {
      const cw = Math.max(1, this.root.clientWidth), ch = Math.max(1, this.root.clientHeight), k = this.settings.ui || 1;
      const w = Math.max(1, Math.round(cw / k)), h = Math.max(1, Math.round(ch / k));
      if (this.hud.width !== w || this.hud.height !== h) { this.hud.width = w; this.hud.height = h; }
      const rw = Math.min(this.settings.res, cw), rh = Math.max(1, Math.round(rw * ch / cw));
      if (this.glCanvas.width !== rw || this.glCanvas.height !== rh) { this.glCanvas.width = rw; this.glCanvas.height = rh; }
    }

    draw(alpha) {
      this.resize();
      const v = this.view(alpha);
      this.lastView = v;
      if (this.renderer) {
        const a = this.hero();
        this.renderer.gray = a.dead && !a.ghost ? 1 : 0;
        this.renderer.render(v);
        if (this.charOpen && this.charInset) this.renderer.renderInset(this.charView(), this.glRect(this.charInset));
      }
      this.drawHud(v);
    }

    glRect(r) {
      const sx = this.glCanvas.width / this.hud.width, sy = this.glCanvas.height / this.hud.height;
      return { x: Math.round(r.x * sx), y: Math.round(this.glCanvas.height - (r.y + r.h) * sy), w: Math.max(1, Math.round(r.w * sx)), h: Math.max(1, Math.round(r.h * sy)) };
    }

    charView() {
      const a = this.hero(), sh = a.sheet;
      this.charRot = (this.charRot || 0) + 0.004;
      const fake = { uid: -2, kind: 'hero', race: a.race, path: a.path, sheet: sh, dead: false, cast: null };
      const v = { uid: -2, kind: 'hero', x: 0, y: 0, z: 0, yaw: HO.PI + Math.sin(this.charRot) * 0.6, path: a.path, race: a.race, look: sh && sh.look };
      const ap = this.animPose(fake, v, 0);
      if (ap) Object.assign(v, ap);
      return { eye: [0, 1.15, 4.2], target: [0, 0.92, 0], actors: [v] };
    }

    project(x, y, z) {
      const m = this.renderer && this.renderer.viewProj;
      if (!m) return null;
      const cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (cw <= 0.1) return null;
      return { x: (cx / cw * 0.5 + 0.5) * this.hud.width, y: (0.5 - cy / cw * 0.5) * this.hud.height };
    }

    text(t, x, y, col, o) {
      const c = this.hctx, opt = o || {};
      c.font = (opt.bold ? 'bold ' : '') + (opt.size || 12) + 'px ' + FONT;
      c.textAlign = opt.align || 'left';
      c.textBaseline = opt.base || 'top';
      c.fillStyle = 'rgba(0,0,0,0.8)';
      c.fillText(t, x + 1, y + 1);
      c.fillStyle = col;
      c.fillText(t, x, y);
    }

    bar(x, y, w, h, frac, col, back, label) {
      const c = this.hctx;
      c.fillStyle = back || 'rgba(10,14,30,0.85)';
      c.fillRect(x, y, w, h);
      c.fillStyle = col;
      c.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * HO.clamp(frac, 0, 1)), h - 2);
      c.strokeStyle = 'rgba(216,191,114,0.7)';
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      if (label) this.text(label, x + w / 2, y + h / 2, '#ffffff', { align: 'center', base: 'middle', size: 11 });
    }

    panel(x, y, w, h) {
      const c = this.hctx;
      c.fillStyle = 'rgba(8,12,28,0.78)';
      c.fillRect(x, y, w, h);
      c.strokeStyle = 'rgba(216,191,114,0.85)';
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }

    button(x, y, w, h, label, on, fn) {
      const c = this.hctx;
      c.fillStyle = on ? 'rgba(216,191,114,0.9)' : 'rgba(30,40,70,0.9)';
      c.fillRect(x, y, w, h);
      c.strokeStyle = 'rgba(216,191,114,0.9)';
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      this.text(label, x + w / 2, y + h / 2, on ? '#141a30' : '#e8ecf4', { align: 'center', base: 'middle', size: 11 });
      this.buttons.push({ x, y, w, h, fn });
    }

    portrait(cx, cy, r, skin, hair, face, fox) {
      const c = this.hctx;
      c.save();
      c.beginPath(); c.arc(cx, cy, r + 2, 0, Math.PI * 2); c.fillStyle = '#d8bf72'; c.fill();
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = '#1a2240'; c.fill();
      c.clip();
      c.fillStyle = skin;
      c.beginPath(); c.ellipse(cx, cy + r * 0.15, r * 0.72, r * 0.82, 0, 0, Math.PI * 2); c.fill();
      const meta = this.modelData && this.modelData.hero_human_f && this.modelData.hero_human_f.meta.look;
      if (this.faces && meta) {
        const cell = meta.cells[face % meta.cells.length], s = r * 1.5;
        c.globalCompositeOperation = 'multiply';
        c.drawImage(this.faces, cell[0] + cell[2] * 0.1, cell[1] + cell[3] * 0.25, cell[2] * 0.8, cell[3] * 0.6, cx - s / 2, cy - s * 0.1, s, s * 0.6);
        c.globalCompositeOperation = 'source-over';
      }
      c.fillStyle = hair;
      c.beginPath(); c.ellipse(cx, cy - r * 0.32, r * 0.86, r * 0.5, 0, Math.PI, 0); c.fill();
      if (fox) {
        c.beginPath();
        c.moveTo(cx - r * 0.75, cy - r * 0.35); c.lineTo(cx - r * 0.55, cy - r * 1.05); c.lineTo(cx - r * 0.2, cy - r * 0.6);
        c.moveTo(cx + r * 0.75, cy - r * 0.35); c.lineTo(cx + r * 0.55, cy - r * 1.05); c.lineTo(cx + r * 0.2, cy - r * 0.6);
        c.fill();
      }
      c.restore();
    }

    unitFrame(x, y, a, big) {
      const w = big ? 220 : 250, me = this.hero();
      if (a.kind === 'npc' && a.ward) {
        this.panel(x, y, w, 44);
        this.text(a.name, x + 8, y + 5, '#a0ffb0', { bold: true, size: 12 });
        const max = this.world.stat(a, 'maxHp');
        this.bar(x + 8, y + 22, w - 16, 13, a.hp / max, '#2fb04a', null, a.dead ? 'без сознания' : Math.ceil(a.hp) + ' / ' + Math.round(max));
        return;
      }
      if (a.kind === 'npc' || a.kind === 'obj') {
        this.panel(x, y, w, 44);
        this.text(a.name, x + 8, y + 6, a.kind === 'obj' ? '#7ad8ff' : '#a0ffb0', { bold: true, size: 12 });
        this.text(a.kind === 'obj' ? 'ПКМ: использовать' : a.role === 'trainer' ? 'Наставник: ПКМ, чтобы поговорить' : a.role === 'vendor' ? 'Торговец: ПКМ' : 'ПКМ: поговорить', x + 8, y + 24, '#c8d0e0', { size: 11 });
        return;
      }
      this.panel(x, y, w, a.kind === 'foe' ? 70 : 64);
      const max = this.world.stat(a, 'maxHp');
      const title = a.kind === 'hero' ? a.name + ', ' + a.lvl + ' ур.' : a.name;
      this.text(title, x + 8, y + 5, a.kind === 'hero' ? '#f0d890' : '#ffffff', { bold: true, size: 12 });
      if (a.kind === 'foe') this.text(a.lvl + (HO.FOES[a.id].boss ? ' босс' : a.elite ? ' элита' : ''), x + w - 8, y + 5, conColor(me.lvl, a.lvl), { align: 'right', bold: true, size: 12 });
      if (a.kind === 'foe' && a.lifeEnd && !a.dead) { const left = Math.max(0, Math.ceil((a.lifeEnd - this.world.state.tick) / HO.TUN.hz)); this.text('Распад клона через ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'), x + w + 8, y + 22, left < 30 ? '#ff8080' : '#f0d890', { size: 12, bold: true }); }
      const P = this.world.state.party;
      if (a.kind === 'foe' && P && (P.first === a.uid || P.stop === a.uid)) this.text(P.first === a.uid ? '◆ Первая цель' : '■ Стоп-кадр', x + w + 8, y + 5, P.first === a.uid ? '#ffd040' : '#7ad8ff', { size: 12, bold: true });
      this.bar(x + 8, y + 22, w - 16, 13, a.hp / max, '#2fb04a', null, a.dead ? 'без сознания' : Math.ceil(a.hp) + ' / ' + Math.round(max));
      if (a.kind === 'hero') {
        const kind = HO.PATHS[a.path].resource, rmax = this.world.resMax(a);
        this.bar(x + 8, y + 37, w - 16, 10, a.res / rmax, RES_COL[kind], null, HO.RESOURCES[kind] + ' ' + Math.floor(a.res));
        if (a.lvl >= C.ultLevel) this.bar(x + 8, y + 49, w - 16, 8, a.energy / C.energyMax, '#e0b030', null, 'Энергия ' + Math.floor(a.energy));
      } else {
        const broken = a.tough <= 0;
        this.bar(x + 8, y + 37, w - 76, 9, broken ? 1 : a.tough / a.toughMax, broken ? '#ffb040' : '#e8e8f0', null, broken ? 'пробит' : '');
        HO.FOES[a.id].weak.forEach((e, i) => {
          const bx = x + w - 66 + i * 15;
          this.hctx.fillStyle = elemCol(e);
          this.hctx.fillRect(bx, y + 35, 13, 13);
          this.text(elemShort(e)[0], bx + 6.5, y + 41.5, '#101010', { align: 'center', base: 'middle', size: 9, bold: true });
        });
        if (a.state === 'fight' && a.threat[me.uid] !== undefined) {
          let top = 0;
          for (const k in a.threat) top = Math.max(top, a.threat[k]);
          const pct = Math.round(a.threat[me.uid] / Math.max(1, top) * 100);
          this.text('Угроза ' + pct + '%' + (a.aim === me.uid ? ', бьёт вас' : ''), x + 8, y + 52, a.aim === me.uid ? '#ff9a7a' : '#c8d0e0', { size: 11 });
        }
        if (a.prep) {
          const k = HO.clamp((this.world.state.tick - a.prep.start) / Math.max(1, a.prep.end - a.prep.start), 0, 1);
          this.bar(x, y + 72, w, 12, k, '#d83030', null, a.prep.skill);
        }
      }
      if (a.auras && a.auras.length) {
        a.auras.slice(0, 8).forEach((au, i) => {
          const bad = ['dot', 'debuff', 'stun', 'root', 'poly', 'freeze', 'imprison', 'taunt'].includes(au.k);
          this.hctx.fillStyle = bad ? 'rgba(200,60,50,0.9)' : 'rgba(60,170,90,0.9)';
          const ax = x + 8 + i * 17, ay = y + (a.kind === 'foe' ? (a.prep ? 88 : 72) : 66);
          this.hctx.fillRect(ax, ay, 15, 15);
          const left = Math.max(0, Math.ceil((au.until - this.world.state.tick) / T.hz));
          this.text(left > 99 ? '∞' : String(left), ax + 7.5, ay + 7.5, '#ffffff', { align: 'center', base: 'middle', size: 9 });
        });
      }
    }

    drawHud(v) {
      const c = this.hctx, w = this.hud.width, h = this.hud.height, a = this.hero(), now = this.time;
      this.buttons = [];
      this.pendingTip = null;
      c.clearRect(0, 0, w, h);
      this.drawPlates(v);
      this.unitFrame(56, 10, a, true);
      const lk = (a.sheet && a.sheet.look) || {};
      this.portrait(31, 34, 21, HO.LOOK.skins[(lk.skin | 0) % HO.LOOK.skins.length], HO.LOOK.hairColors[(lk.hairColor | 0) % HO.LOOK.hairColors.length], lk.face | 0, a.race === 'foxian');
      if (a.resting && !a.ghost) {
        this.panel(10, 92, 92, 18);
        this.text('Место отдыха', 56, 101, '#9ad8ff', { align: 'center', base: 'middle', size: 11, bold: true });
        this.hover(10, 92, 92, 18, [{ t: 'Место отдыха', col: '#9ad8ff', bold: true }, { t: 'Здесь копится отдых: опыт за врагов удваивается.', col: '#dfe4f0' }, { t: 'Выход из мира отсюда сразу, отдых идёт и офлайн.', col: '#dfe4f0' }]);
      }
      const t = this.world.byUid(a.target);
      if (t) this.unitFrame(286, 10, t, false);
      if (this.world.state.party) this.drawParty();
      this.drawFloaters(v);
      if (this.world.state.trial) this.drawTrial(w);
      this.drawBar(w, h);
      if (a.cast) {
        const ab = HO.ABILITIES[a.cast.ab], k = HO.clamp((this.world.state.tick - a.cast.start) / Math.max(1, a.cast.end - a.cast.start), 0, 1);
        this.bar(w / 2 - 120, h - 112, 240, 16, k, '#e0b030', null, ab.name);
      }
      this.drawLog(h);
      if (this.debug) this.drawSetup(w);
      else { this.drawMinimap(w); this.drawTracker(w); }
      if (this.trainer) this.drawTrainer(w, h);
      if (a.ghost && a.corpse) {
        const d = Math.hypot(a.corpse.x - a.x, a.corpse.z - a.z);
        this.text(d <= C.reviveRange ? 'Тело рядом' : 'Вы Проекция. До тела ' + Math.round(d) + ' м', w / 2, 148, '#9ad8ff', { align: 'center', bold: true, size: 15 });
        if (d <= C.reviveRange) this.button(w / 2 - 110, 170, 220, 28, 'Вернуться в тело', true, () => this.cmd({ t: 'revive' }));
      }
      this.drawOverlays(w, h);
      if (this.menu) this.drawMenu(w, h);
      if (this.loading && this.time - this.loading.t < 2.2) this.drawLoading(w, h);
      if (this.banner && now - this.banner.t < 3.2) this.text(this.banner.text, w / 2, 96, this.banner.col, { align: 'center', bold: true, size: 15 });
      if (this.denyMsg && now - this.denyMsg.t < 1.6) this.text(this.denyMsg.text, w / 2, 122, this.denyMsg.col || '#ff5a4a', { align: 'center', bold: true, size: 13 });
      if (a.auto) this.text('Автобег', w / 2, h - 132, '#a0ffb0', { align: 'center', size: 12 });
      if (a.sit && !this.leaving) this.text('Вы сидите: НР и запас восстанавливаются быстрее', w / 2, h - 132, '#a0ffb0', { align: 'center', size: 12 });
      if (this.leaving) this.text((this.leaving.exit ? 'Выход из игры через ' : 'Выход через ') + Math.max(0, Math.ceil(20 - (now - this.leaving.t))) + ' с. Встаньте, чтобы остаться', w / 2, h - 132, '#f0d890', { align: 'center', bold: true, size: 13 });
      if (this.debug) this.text('такт ' + this.world.state.tick + '   хэш ' + this.hashText + '   ' + this.fps + ' к/с', w - 10, 152, '#8890a8', { align: 'right', size: 11 });
      if (this.settings.perf && this.renderer) {
        const st = this.renderer.stats, mem = this.renderer.mem;
        this.text((this.fps || 0) + ' к/с   вызовов ' + st.draws + '   треуг. ' + Math.round(st.tris / 100) / 10 + ' тыс.   текстуры ' + Math.round(mem.tex / 1048576) + ' МБ', w / 2, 4, '#a0ffb0', { align: 'center', size: 11, bold: true });
      }
      this.drawHint(w, h);
      if (this.error) this.text('Нет 3D: ' + this.error, w / 2, h / 2, '#ff8080', { align: 'center', bold: true });
      if (a.dead) {
        const px = w / 2 - 190, py = h / 2 - 80;
        this.panel(px, py, 380, 150);
        this.text('Вы без сознания', w / 2, py + 10, '#ff8080', { align: 'center', bold: true, size: 15 });
        this.wrapText('Проекция дойдёт до тела без потерь. Медпункт поднимет сразу, но со Слабостью на 2 минуты и износом снаряжения.', px + 14, py + 34, 352, '#dfe4f0', 12);
        this.button(px + 14, py + 108, 170, 28, 'Выйти в Проекцию', true, () => this.cmd({ t: 'release', mode: 'ghost' }));
        this.button(px + 196, py + 108, 170, 28, 'Восстановиться в медпункте', false, () => this.cmd({ t: 'release', mode: 'medic' }));
      }
      this.drawTooltip(w, h);
      if (this.settingsWin) { this.buttons = []; this.drawSettings(w, h); }
    }

    hintParts() {
      const k = id => HO.keyLabel(HO.keyOf(this.settings, id));
      return [k('fwd') + ' ' + k('left') + ' ' + k('back') + ' ' + k('right') + ': движение', k('target') + ': цель', 'ПКМ: атака, разговор, добыча', k('bar1') + '–' + k('bar12') + ': умения', 'Esc: меню', k('sit') + ': сесть', k('bag') + ': рюкзак', k('char') + ': персонаж', k('log') + ': журнал', k('map') + ': карта'];
    }

    drawHint(w, h) {
      const c = this.hctx, parts = this.hintParts();
      for (let n = parts.length; n >= 3; n--) {
        const line = parts.slice(0, n).join('   ');
        for (const size of [11, 10, 9]) {
          c.font = size + 'px ' + FONT;
          if (c.measureText(line).width <= w - 16) { this.text(line, w / 2, h - 15, '#9aa2b8', { align: 'center', size }); return; }
        }
      }
    }

    drawParty() {
      const P = this.world.state.party, top = this.hero().resting ? 116 : 96;
      P.members.forEach((u, i) => {
        const c = this.world.byUid(u);
        if (!c) return;
        const x = 10, y = top + i * 40, max = this.world.stat(c, 'maxHp'), kind = HO.PATHS[c.path].resource;
        this.panel(x, y, 170, 36);
        this.text(c.name, x + 6, y + 3, this.hero().target === c.uid ? '#ffffff' : '#a0ffb0', { size: 11, bold: true });
        this.text(HO.PATHS[c.path].name, x + 164, y + 3, '#8890a8', { align: 'right', size: 10 });
        this.bar(x + 6, y + 17, 158, 9, c.dead ? 0 : c.hp / max, '#2fb04a', null, c.dead ? 'без сознания' : '');
        this.bar(x + 6, y + 27, 158, 5, kind === 'rage' ? c.res / C.rageMax : c.res / Math.max(1, c.base.pool), RES_COL[kind]);
        this.buttons.push({ x, y, w: 170, h: 36, fn: () => this.cmd({ t: 'target', uid: c.uid }) });
      });
      this.text('Приказ: ' + HO.ORDERS[P.order] + '   N: группа', 10, top + P.members.length * 40 + 2, '#8890a8', { size: 10 });
    }

    drawTrial(w) {
      const T = this.world.state.trial, def = HO.TRIALS[T.id], tick = this.world.state.tick;
      const left = Math.max(0, Math.ceil((T.end - tick) / HO.TUN.hz));
      const wards = T.wards.map(u => this.world.byUid(u)).filter(Boolean);
      const lines = this.wrapCount(def.start, 300, 11), x = w / 2 - 160, y = 140, hh = 34 + lines * 14 + (def.need ? 18 : wards.length * 16);
      this.panel(x, y, 320, hh);
      this.text(def.name, x + 10, y + 6, '#f0d890', { bold: true, size: 13 });
      this.text(Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'), x + 310, y + 6, left <= 10 ? '#ff8080' : '#ffffff', { align: 'right', bold: true, size: 13 });
      this.wrapText(def.start, x + 10, y + 24, 300, '#c8d0e0', 11);
      const by = y + 28 + lines * 14;
      if (def.need) this.text('Пробито голограмм: ' + T.broke.length + ' из ' + def.need, x + 10, by, '#7ad8ff', { size: 12, bold: true });
      else wards.forEach((n, i) => this.bar(x + 10, by + i * 16, 300, 12, n.dead ? 0 : n.hp / this.world.stat(n, 'maxHp'), n.hp / this.world.stat(n, 'maxHp') < 0.35 ? '#d83a2a' : '#2fb04a', null, n.name + ' ' + (i + 1)));
    }

    drawPlates(v) {
      const me = this.hero();
      for (const n of this.world.state.actors) {
        if (n.kind !== 'npc' && n.kind !== 'obj' && !(n.kind === 'foe' && n.dead && n.loot && n.loot[me.uid])) continue;
        const p = v.pos[n.uid];
        if (!p) continue;
        const dist = Math.hypot(n.x - me.x, n.z - me.z);
        if (n.kind !== 'npc' && dist > 18) continue;
        if (dist > 45) continue;
        const s = this.project(p.x, p.y + (n.kind === 'foe' ? 0.8 : n.h + 0.4), p.z);
        if (!s) continue;
        if (n.kind === 'foe') { this.text('Добыча', s.x, s.y, '#f0d890', { align: 'center', size: 11, bold: true }); continue; }
        if (n.kind === 'obj') { this.text(n.name, s.x, s.y, '#7ad8ff', { align: 'center', size: 11 }); continue; }
        if (n.ward) {
          this.text(n.name, s.x, s.y - 14, '#a0ffb0', { align: 'center', size: 11, bold: me.target === n.uid });
          this.bar(s.x - 30, s.y, 60, 7, n.hp / this.world.stat(n, 'maxHp'), n.hp / this.world.stat(n, 'maxHp') < 0.35 ? '#d83a2a' : '#2fb04a');
          continue;
        }
        const mk = me.sheet ? HO.npcMark(me.sheet, n.id) : '';
        if (mk === '!' || mk === '?' || mk === '…') this.text(mk, s.x, s.y - 36, mk === '…' ? '#9a9a9a' : '#ffe040', { align: 'center', size: 24, bold: true });
        const near = dist <= C.talkRange + n.r;
        this.text(n.name, s.x, s.y - 14, '#a0ffb0', { align: 'center', size: 11, bold: me.target === n.uid });
        this.text(near ? 'ПКМ: поговорить' : n.role === 'trainer' ? 'Наставник' : n.role === 'vendor' ? 'Торговец' : '', s.x, s.y, near ? '#f0d890' : '#8890a8', { align: 'center', size: 10 });
      }
      for (const f of this.world.foes()) {
        if (f.dead) continue;
        const p = v.pos[f.uid];
        const dx = p.x - v.me.x, dz = p.z - v.me.z;
        if (dx * dx + dz * dz > 45 * 45) continue;
        const s = this.project(p.x, p.y + (f.h || 2) + 0.45, p.z);
        if (!s) continue;
        const sel = me.target === f.uid;
        this.text(f.name.replace('Рейнджер пустоты: ', '') + ' ' + f.lvl, s.x, s.y - 14, sel ? '#ffffff' : conColor(me.lvl, f.lvl), { align: 'center', size: 11, bold: sel });
        const P = this.world.state.party;
        if (P && (P.first === f.uid || P.stop === f.uid)) this.text(P.first === f.uid ? '◆' : '■', s.x, s.y - 32, P.first === f.uid ? '#ffd040' : '#7ad8ff', { align: 'center', size: 18, bold: true });
        if (f.hp < this.world.stat(f, 'maxHp') || f.elite || sel || f.state === 'fight') {
          this.bar(s.x - 30, s.y, 60, 6, f.hp / this.world.stat(f, 'maxHp'), f.state === 'fight' ? '#d83a2a' : '#c8a030');
          this.bar(s.x - 30, s.y + 6, 60, 4, f.tough <= 0 ? 1 : f.tough / f.toughMax, f.tough <= 0 ? '#ffb040' : '#e8e8f0');
        }
        if (f.prep) this.text('!', s.x + 36, s.y - 4, '#ff4040', { bold: true, size: 16 });
      }
    }

    drawFloaters(v) {
      this.floaters = this.floaters.filter(f => this.time - f.t < 1.3);
      for (const f of this.floaters) {
        const p = v.pos[f.uid];
        if (!p) continue;
        const k = (this.time - f.t) / 1.3, a = this.world.byUid(f.uid);
        const s = this.project(p.x, p.y + ((a && a.h) || 1.9) + 0.2 + k * 1.2, p.z);
        if (!s) continue;
        this.hctx.globalAlpha = 1 - k * k;
        this.text(f.text, s.x + f.dx, s.y, f.col, { align: 'center', bold: true, size: f.big ? 18 : 14 });
        this.hctx.globalAlpha = 1;
      }
    }

    drawBar(w, h) {
      const a = this.hero(), ids = this.barIds(), size = 40, gap = 4, total = ids.length * (size + gap) - gap;
      const x0 = Math.round(w / 2 - total / 2), y0 = h - size - 52, tick = this.world.state.tick;
      this.panel(x0 - 6, y0 - 6, total + 12, size + 12);
      this.slotRects = [];
      ids.forEach((id, i) => {
        const x = x0 + i * (size + gap), c = this.hctx;
        this.slotRects.push({ x, y: y0, w: size, h: size, id });
        if (!id) { c.fillStyle = 'rgba(20,24,40,0.6)'; c.fillRect(x, y0, size, size); return; }
        const ab = this.abilityOf(id), unlearned = !ab.racial && !ab.auto && !(a.sheet.learned[id] >= 1), locked = ab.lvl > a.lvl || unlearned;
        const col = ab.racial ? '#5a8a6a' : HO.pathColor(a.path);
        c.fillStyle = locked ? '#2a2e3a' : col;
        c.fillRect(x, y0, size, size);
        c.fillStyle = 'rgba(0,0,0,0.25)';
        c.fillRect(x, y0 + size / 2, size, size / 2);
        this.text(ab.icon || ab.name.slice(0, 2).toUpperCase(), x + size / 2, y0 + size / 2, locked ? '#70768a' : '#141a30', { align: 'center', base: 'middle', bold: true, size: 14 });
        this.text(HO.keyLabel(HO.keyOf(this.settings, 'bar' + (i + 1))), x + 3, y0 + 2, '#ffffff', { size: 10 });
        if (locked) { this.text(ab.lvl > a.lvl ? ab.lvl + ' ур.' : ab.ult ? 'задание' : 'учить', x + size / 2, y0 + size - 12, ab.lvl > a.lvl ? '#a0a8c0' : '#f0d890', { align: 'center', size: 10 }); }
        else {
          const cd = Math.max(a.cds[id] || 0, ab.gcd ? a.gcdUntil : 0) - tick;
          const cost = ab.cost ? (HO.PATHS[a.path].resource === 'rage' ? ab.cost : ab.cost * a.base.pool) : 0;
          const poor = cost > a.res + 1e-9 || (ab.ult && a.energy < C.energyMax) || (ab.ooc && a.inCombat);
          if (poor) { c.fillStyle = 'rgba(60,0,0,0.55)'; c.fillRect(x, y0, size, size); }
          if (cd > 0) {
            const full = Math.max(ab.cd ? ab.cd * T.hz : 1, C.gcd * T.hz);
            c.fillStyle = 'rgba(0,0,0,0.6)';
            c.fillRect(x, y0, size, size * HO.clamp(cd / full, 0, 1));
            if (cd > T.hz) this.text(String(Math.ceil(cd / T.hz)), x + size / 2, y0 + size / 2, '#ffffff', { align: 'center', base: 'middle', bold: true, size: 13 });
          }
          if (ab.auto && a.attacking) { c.strokeStyle = '#ffe060'; c.lineWidth = 2; c.strokeRect(x + 1, y0 + 1, size - 2, size - 2); c.lineWidth = 1; }
        }
        this.buttons.push({ x, y: y0, w: size, h: size, fn: () => { if (this.win && this.win.type === 'skills') this.drag = { id, from: i }; else this.useSlot(i); } });
      });
      const bx = x0 + total + 14;
      if (bx + 70 < w) {
        this.button(bx, y0 - 6, 70, 16, 'Рюкзак', this.bagOpen, () => { this.bagOpen = !this.bagOpen; });
        this.button(bx, y0 + 12, 70, 16, 'Умения', !!(this.win && this.win.type === 'skills'), () => { this.win = this.win && this.win.type === 'skills' ? null : { type: 'skills' }; });
        this.button(bx, y0 + 30, 70, 16, 'Меню', this.menu, () => { this.menu = !this.menu; });
      }
      const sh = a.sheet, xp = HO.xpNeed(sh.lvl);
      const rail = { x: x0 - 6, y: y0 + size + 12, w: total + 12 };
      const c = this.hctx;
      c.fillStyle = 'rgba(8,12,28,0.8)';
      c.fillRect(rail.x, rail.y, rail.w, 10);
      c.fillStyle = '#c8a040';
      for (let i = 0; i <= 20; i++) c.fillRect(rail.x + i * rail.w / 20, rail.y, 2, 10);
      const xw = xp ? rail.w * sh.xp / xp : rail.w;
      if (xp && sh.rested >= 1) { c.fillStyle = '#4a8aff'; c.fillRect(rail.x + xw, rail.y + 3, Math.min(rail.w - xw, rail.w * sh.rested / xp), 4); }
      c.fillStyle = '#d8bf72';
      c.fillRect(rail.x, rail.y + 3, xw, 4);
      this.text((sh.lvl >= HO.MAX_LEVEL ? 'Предел уровня' : 'Опыт: ' + sh.xp + ' / ' + xp + (sh.rested >= 1 ? '   Отдых: ' + Math.floor(sh.rested) : '')) + '      Кредиты: ' + sh.credits, rail.x + rail.w / 2, rail.y + 12, '#c8d0e0', { align: 'center', size: 10 });
    }

    drawTooltip(w, h) {
      const mx = this.mouse.hx, my = this.mouse.hy;
      if (this.drag) {
        const ab = this.abilityOf(this.drag.id), c = this.hctx;
        c.globalAlpha = 0.85;
        c.fillStyle = ab.racial ? '#5a8a6a' : HO.pathColor(this.hero().path);
        c.fillRect(mx - 18, my - 18, 36, 36);
        this.text(ab.icon || ab.name.slice(0, 2).toUpperCase(), mx, my, '#141a30', { align: 'center', base: 'middle', bold: true, size: 13 });
        c.globalAlpha = 1;
        return;
      }
      for (const s of this.slotRects || []) {
        if (!s.id || mx < s.x || mx > s.x + s.w || my < s.y || my > s.y + s.h) continue;
        const lines = this.abilityLines(s.id);
        const c = this.hctx;
        c.font = '12px ' + FONT;
        const tw = Math.max(...lines.map(l => c.measureText(l).width)) + 16;
        const x = HO.clamp(s.x - tw / 2 + s.w / 2, 4, w - tw - 4), y = s.y - 16 * lines.length - 16;
        this.panel(x, y, tw, 16 * lines.length + 8);
        lines.forEach((l, i) => this.text(l, x + 8, y + 5 + i * 16, i === 0 ? '#f0d890' : '#dfe4f0', { size: 12, bold: i === 0 }));
        return;
      }
    }

    drawLoading(w, h) {
      const L = this.loading, c = this.hctx, k = (this.time - L.t) / 2.2;
      if (L.tip === undefined) { this.loadCount = (this.loadCount || 0) + 1; L.tip = HO.LOADING_TIPS[this.loadCount % HO.LOADING_TIPS.length]; }
      this.buttons = [];
      c.globalAlpha = Math.min(1, (1 - k) * 4);
      c.fillStyle = '#0b1430';
      c.fillRect(0, 0, w, h);
      const pw = Math.min(w - 80, 640), ph = Math.min(h - 220, 360), px = (w - pw) / 2, py = 70;
      c.fillStyle = '#121c3c';
      c.fillRect(px, py, pw, ph);
      c.strokeStyle = 'rgba(216,191,114,0.8)';
      c.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
      const m = this.mapTransform(px + 20, py + 20, pw - 40, ph - 40);
      c.globalAlpha *= 0.85;
      this.drawZonePlan(m);
      c.globalAlpha = Math.min(1, (1 - k) * 4);
      for (const ar of this.world.zone.areas || []) this.text(ar.name, m.px((ar.x0 + ar.x1) / 2), m.pz((ar.z0 + ar.z1) / 2), '#c8d0e0', { align: 'center', base: 'middle', size: 10 });
      this.text(L.text, w / 2, py + ph + 18, '#f0d890', { align: 'center', bold: true, size: 18 });
      this.wrapText('Совет: ' + L.tip, w / 2 - pw / 2, py + ph + 48, pw, '#c8d0e0', 12);
      const ry = h - 70, rw = Math.min(w - 120, 520), rx = (w - rw) / 2, fill = Math.min(1, k * 1.6);
      this.railBar(rx, ry, rw, fill);
      c.globalAlpha = 1;
    }

    railBar(x, y, w, k) {
      const c = this.hctx;
      c.fillStyle = 'rgba(8,12,28,0.9)';
      c.fillRect(x - 4, y - 8, w + 8, 20);
      for (let tx = x; tx <= x + w; tx += 14) { c.fillStyle = tx <= x + w * k ? '#8a6a3a' : '#3a3428'; c.fillRect(tx, y - 6, 6, 16); }
      c.fillStyle = '#9aa2b8';
      c.fillRect(x, y - 2, w, 3);
      c.fillRect(x, y + 5, w, 3);
      c.fillStyle = '#f0d890';
      c.fillRect(x, y - 2, w * k, 3);
      c.fillRect(x, y + 5, w * k, 3);
    }

    abilityLines(id) {
      const a = this.hero(), ab = this.abilityOf(id);
      const lines = [ab.name];
      const parts = [];
      if (ab.cost) parts.push(HO.PATHS[a.path].resource === 'rage' ? ab.cost + ' Ярости' : Math.round(ab.cost * a.base.pool) + ' Силы Пути');
      if (ab.ult) parts.push('100 Энергии');
      parts.push(ab.cast ? fmt(ab.cast) + ' с' : ab.auto ? 'автоматически' : 'мгновенно');
      if (ab.cd) parts.push('перезарядка ' + fmt(ab.cd) + ' с');
      if (ab.range) parts.push(ab.range === 'melee' ? 'вблизи' : ab.range + ' м');
      lines.push(parts.join(', '));
      if (ab.lvl > a.lvl) lines.push('Откроется на ' + ab.lvl + '-м уровне');
      if (ab.ult && !(a.sheet.learned[id] >= 1)) lines.push('Даёт классовое задание: ' + HO.QUESTS[HO.CLASS_QUEST[a.path]].title + ', ' + HO.npcName(HO.PATH_TRAINER[a.path]));
      lines.push(ab.text || '');
      return lines;
    }

    drawLog(h) {
      const lines = this.log.filter(l => this.time - l.t < 14);
      if (!lines.length) return;
      this.panel(10, h - 52 - 16 * lines.length - 60, 330, 16 * lines.length + 8);
      lines.forEach((l, i) => this.text(l.text, 18, h - 52 - 16 * lines.length - 56 + i * 16, l.col, { size: 11 }));
    }

    drawSetup(w) {
      const x = w - 240, s = this.setup;
      this.panel(x, 10, 230, 112);
      this.text(HO.TITLE + '. Этап 2: графика', x + 8, 15, '#f0d890', { bold: true, size: 12 });
      HO.PATH_IDS.forEach((p, i) => this.button(x + 8 + i * 72, 34, 70, 20, HO.PATHS[p].name, s.path === p, () => { s.path = p; this.newWorld(); }));
      [1, 2, 4, 6, 8, 10].forEach((l, i) => this.button(x + 8 + i * 36, 58, 34, 20, String(l), s.level === l, () => { s.level = l; this.newWorld(); }));
      HO.RACE_IDS.forEach((r, i) => this.button(x + 8 + i * 108, 82, 106, 20, HO.RACES[r].name, s.race === r, () => { s.race = r; this.newWorld(); }));
      this.button(x, 126, 230, 20, 'Начать комнату заново', false, () => this.newWorld());
    }

    drawTrainer(w, h) {
      const a = this.hero(), n = this.world.byUid(this.trainer);
      if (!n || Math.hypot(n.x - a.x, n.z - a.z) > C.talkRange + n.r + 2 || a.dead) { this.trainer = null; return; }
      const list = HO.trainList(a.sheet), x = w / 2 - 230, y = 140, rowH = 30;
      this.panel(x, y, 460, 70 + list.length * rowH);
      this.text(n.name, x + 12, y + 8, '#f0d890', { bold: true, size: 14 });
      this.text('Путь ' + HO.PATHS[a.path].name + '. Кредиты: ' + a.sheet.credits, x + 12, y + 28, '#c8d0e0', { size: 12 });
      this.button(x + 460 - 30, y + 6, 22, 20, 'x', false, () => { this.trainer = null; });
      list.forEach((r, i) => {
        const ab = HO.ABILITIES[r.id], ry = y + 50 + i * rowH;
        const title = ab.name + (HO.maxRank(r.id) > 1 ? ', ранг ' + r.rank : '');
        this.text(title, x + 12, ry + 6, r.owned ? '#8890a8' : r.ready ? '#ffffff' : '#a0a8c0', { size: 12, bold: !r.owned && r.ready });
        this.hover(x + 12, ry, 280, 24, this.abilityLines(r.id).map((t, k) => ({ t, col: k ? '#dfe4f0' : '#f0d890', bold: !k })));
        if (r.owned) this.text('изучено', x + 448, ry + 6, '#8890a8', { align: 'right', size: 12 });
        else if (!r.ready) this.text('с ' + r.lvl + '-го уровня', x + 448, ry + 6, '#a0a8c0', { align: 'right', size: 12 });
        else if (n.trainMax && r.lvl > n.trainMax) this.text('учит ' + HO.npcName(HO.PATH_TRAINER[a.path]).replace(/ \(.*\)$/, ''), x + 448, ry + 6, '#a0a8c0', { align: 'right', size: 12 });
        else this.button(x + 300, ry, 148, 24, 'Изучить: ' + r.cost + ' кр.', a.sheet.credits >= r.cost, () => this.cmd({ t: 'learn', ab: r.id }));
      });
    }

    drawMenu(w, h) {
      const exit = !!this.opts.onExit, rows = exit ? 5 : 4, ph = 74 + rows * 34 + 26, py = Math.round(h / 2 - ph / 2);
      this.panel(w / 2 - 120, py, 240, ph);
      this.text('Меню', w / 2, py + 10, '#f0d890', { align: 'center', bold: true, size: 15 });
      this.text('Мир не останавливается', w / 2, py + 30, '#a8b0c8', { align: 'center', size: 11 });
      let y = py + 54;
      const row = (label, on, fn) => { this.button(w / 2 - 100, y, 200, 26, label, on, fn); y += 34; };
      row('Продолжить', true, () => { this.menu = false; });
      row('Настройки', false, () => this.openSettings('gfx'));
      row('Управление', false, () => this.openSettings('keys'));
      const a = this.hero();
      row(this.debug ? 'Тренировка: выход недоступен' : 'К выбору героя', false, () => this.logout());
      if (exit) row('Выход из игры', false, () => { this.menu = false; this.quitGame(); });
      this.text(this.debug ? 'Esc: закрыть' : a.resting ? 'Место отдыха: выход сразу' : 'Выход через 20 с, сидя. В бою нельзя', w / 2, y + 2, '#8890a8', { align: 'center', size: 11 });
    }

    destroy() {
      this.saveHero(true);
      this.destroyed = true;
      if (this.audio) this.audio.destroy();
      cancelAnimationFrame(this.raf);
      for (const u of this.unbinds) u();
      if (this.renderer) this.renderer.dispose();
      this.root.replaceChildren();
    }
  }

  HO.UI = UI;
})(globalThis.HO = globalThis.HO || {});
