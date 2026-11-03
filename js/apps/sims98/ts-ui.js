(function (S) {
  'use strict';
  const SETTINGS_KEY = 'sims98_settings';
  const PAN_SPEED = 700;
  const EDGE = 10;
  const ZOOM_TIME = 0.15;
  const TURN_TIME = 0.1;
  const LOAD_BUDGET = 12;
  const HOUR_PRESETS = [12, 18.8, 23];
  const FOLLOW_SPEED = 4;
  const WANT_EVERY = 4;
  const ROOF_TRIAL_HOUSES = 2;
  const FLAME_LIFT = 0.9, FLAME_TONGUES = 5;
  const CRAFT_EVENTS = new Set(['catch', 'garden', 'collect', 'art', 'money']);
  const OPTION_KEYS = ['recipe', 'spot', 'bait', 'canvas', 'genre', 'upgrade', 'pick', 'job', 'signature', 'bagIndex'];
  const RABBIT_GAIN = 0.22, POINT_SECONDS = 6, POINT = '#ffd84a', POINT_LIFT = 1.4, SPARK_LIFT = 1.3, FLAG_LIFT = 1.4;
  const GLINT_ZOOM = 1, GLINT_RANGE = 46, GLINT = '#7cff6a', HAND_LIFT = 1.05, ROD_LIFT = 1.9, ROD_REACH = 1.7, TACKLE_TILE = 64;
  const MARK_SECONDS = 30, ASK_W = 360, ASK_H = 130, ASK_TEXT_TOP = 36, ASK_BUTTON = 150, FIGHT_LIFT = 0.9, FIGHT_PUFFS = 7, PARTY_Y = 62;
  const HEAR_RANGE = 34, SOUND_EVERY = 0.25, PICK_STEP = 0.12, BUBBLE_W = 28, BUBBLE_H = 26, BUBBLE_LIFT = 0.25;
  const NOTE_TIME = 6, NOTE_HOLD = 1.5, NOTE_QUEUE = 4, NOTE_TOP = 56, NOTE_BOTTOM = 186;
  const PAN_KEYS = {
    ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    KeyA: [-1, 0], KeyD: [1, 0], KeyW: [0, -1], KeyS: [0, 1]
  };

  const loadSettings = () => {
    try {
      return Object.assign({ screen: '800', dither: true, debug: false, quality: 'high' }, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
    } catch (e) {
      return { screen: '800', dither: true, debug: false, quality: 'high' };
    }
  };

  const saveSettings = settings => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      return;
    }
  };

  class UI {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      this.isActive = this.opts.isActive || (() => !document.hidden);
      this.settings = loadSettings();
      this.dead = false;
      this.ready = false;
      this.frames = 0;
      this.ticks = 0;
      this.time = 0;
      this.last = 0;
      this.stamp = '';
      this.dirty = true;
      this.progress = 0;
      this.frameMs = 0;
      this.cpuMs = 0;
      this.keys = new Set();
      this.pointer = null;
      this.dragging = false;
      this.zoomAnim = null;
      this.scaleNow = 1;
      this.shutter = 0;
      this.wheel = 0;
      this.styleRow = 0;
      this.viewIndex = 0;
      this.wallMode = 'up';
      this.floor = 0;
      this.lampsOn = false;
      this.map = null;
      this.watch = null;
      this.follow = false;
      this.autoCut = false;
      this.game = null;
      this.live = null;
      this.pie = null;
      this.sound = new S.Sound();
      this.soundsLeft = 0;
      this.faces = new Map();
      this.saves = null;
      this.note = null;
      this.notes = [];
      this.ask = null;
      this.point = null;
      this.saving = false;
      this.savePromise = null;
      this.viewState = null;
      this.loadWait = false;
      this.loadError = null;
      root.classList.add('ts-root');
      this.world = this.layer('ts-world');
      this.panels = this.layer('ts-panels');
      this.over = this.layer('ts-over');
      this.g = this.over.getContext('2d');
      this.camera = new S.Camera(S.W, S.H);
      this.gl = this.world.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
      if (this.gl) {
        S.live.gl++;
        this.world.addEventListener('webglcontextlost', this.onLost = e => {
          e.preventDefault();
          if (this.loader && this.settings.quality === 'ultra') this.setting('quality', 'high');
          this.ready = false;
          this.render = null;
          this.loader = null;
        });
        this.world.addEventListener('webglcontextrestored', this.onRestored = () => {
          if (!this.dead) this.start();
        });
      }
      this.bindInput();
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(root);
      this.resize();
      if (this.gl) this.start();
      this.loop = now => {
        if (this.dead) return;
        this.raf = requestAnimationFrame(this.loop);
        const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
        if (dt) this.frameMs += (dt * 1000 - this.frameMs) * 0.08;
        this.last = now;
        const paused = this.paused;
        if (!paused) {
          this.time += dt;
          this.ticks++;
        }
        this.frames++;
        this.sound.pause(paused);
        if (this.loadError) this.drawPanels(paused);
        else if (this.loader) this.stepLoad();
        else if (this.ready && (!paused || this.dirty)) {
          const a = performance.now();
          if (!paused) this.update(dt);
          this.draw();
          this.cpuMs += (performance.now() - a - this.cpuMs) * 0.08;
        }
        this.drawPanels(paused);
      };
      this.raf = requestAnimationFrame(this.loop);
      S.live.uis++;
      S.live.loops++;
    }

    get paused() {
      return document.hidden || !this.isActive();
    }

    get selected() {
      return this.game ? this.game.active : null;
    }

    set selected(sim) {
      if (this.game) this.game.active = sim;
    }

    layer(name) {
      const canvas = document.createElement('canvas');
      canvas.width = S.W;
      canvas.height = S.H;
      canvas.className = 'ts-layer ' + name;
      this.root.appendChild(canvas);
      return canvas;
    }

    start() {
      this.gpu = new S.Gpu(this.gl);
      this.render = new S.Render(this.gpu);
      this.render.resize(this.world.width, this.world.height);
      this.progress = 0;
      this.loadStart = performance.now();
      this.loader = this.load();
    }

    *load() {
      if (this.opts.bench) yield* this.loadBench();
      else yield* this.loadSample();
    }

    *placeholders(atlas, only) {
      const rows = S.Placeholder.rows(only);
      for (let i = 0; i < rows.length; i++) {
        atlas.add(rows[i].row, S.Placeholder.box(rows[i].kind, rows[i].zoom, rows[i].turn));
        if (i % 4 === 0) yield;
      }
    }

    *loadBench() {
      this.scene = this.scene || S.Dummy.create(this.opts.seed || 1);
      this.progress = 0.3;
      yield;
      const rows = S.Placeholder.rows(), plan = new S.Shelves(S.ATLAS.SIZE);
      for (const r of rows) {
        const s = S.Placeholder.size(r.kind, r.zoom, r.turn);
        plan.place(s.w, s.h);
      }
      const atlas = new S.Atlas(this.gpu, S.KINDS.length * S.SPRITE_ROWS, { free: plan.layers.length });
      for (let i = 0; i < rows.length; i++) {
        atlas.add(rows[i].row, S.Placeholder.box(rows[i].kind, rows[i].zoom, rows[i].turn));
        this.progress = 0.3 + 0.65 * i / rows.length;
        yield;
      }
      this.render.setScene(this.scene, atlas);
      this.progress = 1;
    }

    *loadSample() {
      if (!this.doc) {
        yield fetch('content/sims98/models/sample.json').then(r => r.json()).then(d => { this.doc = d; });
      }
      const fresh = !this.game;
      this.game = this.game || new S.Game(this.doc, this.opts.seed || 1);
      this.scene = this.game.scene;
      this.progress = 0.1;
      yield;
      const ground = this.scene.world.ground;
      for (let c = 0; c < ground.clusterEdges.length; c++) {
        ground.edgesOf(c);
        if (c % 16 === 15) yield;
      }
      this.progress = 0.2;
      yield;
      yield* this.loadAtlas();
      this.progress = 0.7;
      yield;
      this.render.setStyles(this.scene.styleRows);
      this.render.setScene(this.scene, this.atlas);
      this.render.bakeFigures();
      this.map = this.map || new S.MapView(this);
      this.saves = this.saves || new S.SaveView(this);
      this.pie = this.pie || new S.PieView(this);
      this.live = this.live || new S.LiveView(this, this.panels);
      this.journal = this.journal || new S.JournalView(this);
      this.news = this.news || new S.NewsView(this);
      this.live.layout(this.screen);
      this.syncLamps(true);
      if (fresh) this.applyView(S.Sample.VIEWS[this.viewIndex]);
      this.syncDoorsAll();
      this.progress = 1;
    }

    *loadAtlas() {
      const index = S.SPRITE_INDEX, memory = S.spriteMemory(index, this.settings.quality);
      const atlas = new S.Atlas(this.gpu, S.KINDS.length * S.SPRITE_ROWS, { fixed: index.pages, free: 1, live: memory.live, shadow: index.shadowPages });
      this.store = new S.SpriteStore(atlas, index);
      yield this.store.loadPages();
      this.store.fill();
      this.store.apply();
      this.progress = 0.5;
      yield* this.placeholders(atlas, ['fence']);
      this.atlas = atlas;
    }

    setQuality(quality) {
      this.setting('quality', quality);
      if (!this.scene || !this.scene.sample || !this.render) return;
      this.ready = false;
      this.store.dead = true;
      this.atlas.destroy();
      this.progress = 0;
      this.loader = (function* () {
        yield* this.loadAtlas();
        this.render.atlas = this.atlas;
        this.progress = 1;
      }).call(this);
    }

    applyView(v) {
      this.camera.setView({ x: S.Sample.MAIN_X + v.x, z: S.Sample.MAIN_Z + v.z, zoom: v.zoom });
      this.wallMode = v.mode;
      this.floor = v.floor;
      this.autoCut = !!v.auto;
      this.follow = false;
      this.stamp = '';
      this.dirty = true;
    }

    setView(i) {
      this.viewIndex = i;
      const v = S.Sample.VIEWS[i];
      this.applyView(v);
      S.Town.setClock(this.scene.world, v.hour * 60);
      this.syncLamps(false);
    }

    get hour() {
      return this.scene && this.scene.world ? S.Town.hour(this.scene.world) : 12;
    }

    setHour(hour) {
      S.Town.setClock(this.scene.world, hour * 60);
      this.syncLamps(false);
      this.stamp = '';
      this.dirty = true;
    }

    syncLamps(force) {
      const on = S.lampsOn(this.hour);
      if (on === this.lampsOn && !force) return;
      this.lampsOn = on;
      for (const h of this.scene.houses) {
        S.House.setLamps(h, on);
        this.render.uploadLight(h);
      }
    }

    setWallMode(mode) {
      this.wallMode = mode;
      this.autoCut = false;
      this.stamp = '';
      this.dirty = true;
    }

    setFloor(floor) {
      this.floor = floor;
      this.autoCut = false;
      this.stamp = '';
      this.dirty = true;
    }

    setRoofForm(form) {
      for (const h of this.scene.houses.slice(0, ROOF_TRIAL_HOUSES)) {
        h.roof.form = form;
        this.render.rebuildHouse(h);
      }
      this.stamp = '';
      this.dirty = true;
    }

    setStyleRow(row) {
      this.styleRow = row;
      for (const i of this.scene.styled) this.render.setStyle(i, row);
      this.stamp = '';
      this.dirty = true;
    }

    activeHouse() {
      const c = this.camera;
      if (c.zoom > S.METRICS.activeZoom) return null;
      const lot = this.scene.world.ground.lotAt(c.fx, c.fz);
      return lot && !lot.closed ? lot.house : null;
    }

    syncActive() {
      const c = this.camera, world = this.scene.world, sim = this.selected;
      const shield = this.autoCut && c.zoom <= S.METRICS.activeZoom && sim && !sim.inside && sim.state !== 'drive' ? (S.Sim.indoors(sim) ? sim.lot : S.Sim.hiddenBy(world, sim, c.rot)) : null;
      if (shield) {
        this.viewState = { house: shield.house, floor: shield === sim.lot ? sim.floor : 0, mode: 'cut', rot: c.rot };
      } else {
        const h = this.activeHouse();
        this.viewState = h ? { house: h, floor: Math.min(this.floor, h.floors.length - 1), mode: this.wallMode, rot: c.rot } : null;
      }
      this.render.setActive(this.viewState);
    }

    selectNext() {
      const list = this.scene.sims.filter(s => !s.free), i = list.indexOf(this.selected);
      this.selected = list[(i + 1) % list.length];
      this.watch = null;
      this.stamp = '';
    }

    selectSim(sim) {
      this.selected = sim;
      this.watch = null;
      this.stamp = '';
    }

    goHome() {
      this.watch = null;
      this.centerOnSim();
    }

    faceOf(sim, w, h) {
      if (!this.render) return null;
      const key = sim.id + ':' + w + 'x' + h + ':' + (sim.face || 0);
      if (!this.faces.has(key)) this.faces.set(key, this.render.portrait(sim, w, h));
      return this.faces.get(key);
    }

    centerOnSim() {
      const sim = this.watch || this.selected;
      this.camera.setView({ x: sim.x, z: sim.z });
      this.follow = true;
    }

    syncCamera(dt) {
      const sim = this.watch || this.selected;
      if (!this.follow || !sim) return;
      const c = this.camera, k = 1 - Math.exp(-dt * FOLLOW_SPEED * Math.max(1, S.SPEEDS[this.game.speed]));
      c.setView({ x: c.fx + (sim.x - c.fx) * k, z: c.fz + (sim.z - c.fz) * k });
    }

    flyTo(x, z) {
      this.camera.setView({ x, z });
      this.stamp = '';
      this.dirty = true;
    }

    syncFlags() {
      const world = this.scene.world;
      if (!world.reflag || !world.reflag.size) return;
      for (const item of world.reflag) {
        const lot = world.lots.find(l => l.house.items.includes(item));
        if (lot && this.render) this.render.refreshItem(lot.house, item);
      }
      world.reflag.clear();
    }

    syncReskin() {
      const world = this.scene.world;
      if (!world.reskin || !world.reskin.size) return;
      for (const item of world.reskin) {
        const kind = S.KIND_ID[item.kind];
        if (kind === undefined || item.index < 0) continue;
        this.scene.kind[item.index] = kind;
        if (this.render) this.render.setItemKind(item.index, kind);
      }
      world.reskin.clear();
      this.wantSprites();
    }

    glints() {
      const world = this.scene.world, c = this.camera, out = [];
      if (c.zoom > GLINT_ZOOM || !world.spots) return out;
      for (const spot of S.Collect.shown(world)) {
        if (Math.abs(spot.x - c.fx) > GLINT_RANGE || Math.abs(spot.z - c.fz) > GLINT_RANGE) continue;
        const p = c.toScreen(spot.x, S.Terrain.heightAt(world.terrain, spot.x, spot.z) + 0.25, spot.z);
        if (p[0] < -10 || p[1] < -10 || p[0] > this.screen.sw + 10 || p[1] > this.screen.sh + 10) continue;
        out.push({ x: Math.round(p[0]), y: Math.round(p[1]), phase: (spot.x * 7 + spot.z * 13) % 10 });
      }
      return out;
    }

    pointAt(lot, item) {
      this.watch = null;
      const x = lot.x + item.x, z = lot.z + item.z;
      this.camera.setView({ x, z });
      this.point = { x, z, y: S.House.floorY(lot.house, item.floor || 0) + POINT_LIFT, until: this.time + POINT_SECONDS };
      this.stamp = '';
    }

    pointMark() {
      const p = this.point;
      if (!p || this.time > p.until) return null;
      const s = this.camera.toScreen(p.x, p.y, p.z);
      return { x: Math.round(s[0]), y: Math.round(s[1]) };
    }

    drawPoint(g, m) {
      const bob = Math.round(Math.sin(this.time * 6) * 3), y = m.y - 10 + bob;
      g.fillStyle = POINT;
      g.strokeStyle = '#102a66';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(m.x - 8, y - 12);
      g.lineTo(m.x + 8, y - 12);
      g.lineTo(m.x, y);
      g.closePath();
      g.stroke();
      g.fill();
      g.fillRect(m.x - 3, y - 22, 6, 11);
      g.strokeRect(m.x - 3, y - 22, 6, 11);
      g.fillRect(m.x - 2, y - 13, 4, 2);
      g.lineWidth = 1;
    }

    drawGlints(g, list) {
      const k = this.time * 3;
      g.strokeStyle = GLINT;
      g.fillStyle = GLINT;
      for (const s of list) {
        const pulse = 0.5 + 0.5 * Math.sin(k + s.phase), r = 4 + pulse * 5, d = r * 0.45;
        g.globalAlpha = 0.5 + 0.5 * pulse;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(s.x - r, s.y);
        g.lineTo(s.x + r, s.y);
        g.moveTo(s.x, s.y - r);
        g.lineTo(s.x, s.y + r);
        g.stroke();
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(s.x - d, s.y - d);
        g.lineTo(s.x + d, s.y + d);
        g.moveTo(s.x + d, s.y - d);
        g.lineTo(s.x - d, s.y + d);
        g.stroke();
        g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
      }
      g.globalAlpha = 1;
    }

    tackle() {
      const world = this.scene.world, c = this.camera, out = [];
      for (const sim of world.family) {
        const act = sim.act;
        if (!act || !act.ad || act.phase !== 'run' || sim.inside || (sim.floor > this.floor && this.wallMode !== 'up')) continue;
        const step = S.ADS[act.ad].steps[act.step];
        const fx = Math.sin(sim.yaw), fz = Math.cos(sim.yaw);
        if (step.fish) {
          let wx = sim.x + fx * 2.5, wz = sim.z + fz * 2.5;
          if (act.spot) {
            wx = act.spot.fx;
            wz = act.spot.fz;
          } else if (act.item >= 0) {
            const lot = world.lots[act.lot], item = lot.house.items[act.item];
            wx = lot.x + item.x;
            wz = lot.z + item.z;
          }
          const hand = c.toScreen(sim.x + fx * 0.35, sim.y + HAND_LIFT, sim.z + fz * 0.35), tip = c.toScreen(sim.x + fx * ROD_REACH, sim.y + ROD_LIFT, sim.z + fz * ROD_REACH);
          const bob = c.toScreen(wx, S.Terrain.heightAt(world.terrain, wx, wz) + 0.05, wz);
          out.push({ kind: 'rod', hand, tip, bob, s: c.tile / TACKLE_TILE });
        } else if (step.guitar) {
          const sx = Math.cos(sim.yaw), sz = -Math.sin(sim.yaw);
          const body = c.toScreen(sim.x + fx * 0.22 - sx * 0.08, sim.y + 0.95, sim.z + fz * 0.22 - sz * 0.08), neck = c.toScreen(sim.x + fx * 0.32 + sx * 0.55, sim.y + 1.25, sim.z + fz * 0.32 + sz * 0.55);
          out.push({ kind: 'guitar', body, neck, s: c.tile / TACKLE_TILE });
        }
      }
      return out;
    }

    drawTackle(g, list) {
      const k = this.time;
      for (const t of list) {
        if (t.kind === 'rod') {
          g.strokeStyle = '#5a3a1c';
          g.lineWidth = Math.max(1, 1.5 * t.s);
          g.beginPath();
          g.moveTo(t.hand[0], t.hand[1]);
          g.lineTo(t.tip[0], t.tip[1]);
          g.stroke();
          const by = t.bob[1] + Math.sin(k * 2.2) * 1.5;
          g.strokeStyle = 'rgba(230,230,230,0.8)';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(t.tip[0], t.tip[1]);
          g.quadraticCurveTo((t.tip[0] + t.bob[0]) / 2, Math.max(t.tip[1], by) + 6, t.bob[0], by);
          g.stroke();
          g.fillStyle = '#e83a2a';
          g.beginPath();
          g.arc(t.bob[0], by - 1, Math.max(2, 2.5 * t.s), 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#ffffff';
          g.fillRect(t.bob[0] - 1, by - 4, 2, 2);
        } else {
          g.strokeStyle = '#3a2412';
          g.lineWidth = Math.max(2, 2 * t.s);
          g.beginPath();
          g.moveTo(t.body[0], t.body[1]);
          g.lineTo(t.neck[0], t.neck[1]);
          g.stroke();
          g.fillStyle = '#b5652a';
          g.beginPath();
          g.ellipse(t.body[0], t.body[1], 6 * t.s, 4.5 * t.s, 0, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#3a2412';
          g.beginPath();
          g.arc(t.body[0], t.body[1], 1.5 * t.s, 0, Math.PI * 2);
          g.fill();
        }
      }
    }

    syncDoors() {
      const world = this.scene.world;
      for (const door of world.changed) {
        if (this.ready && Math.hypot(door.x - this.camera.fx, door.z - this.camera.fz) < HEAR_RANGE) this.sound.play('door', 0.5);
        const kind = S.KINDS[S.KIND_ID[door.item.kind]], next = door.open ? S.KIND_ID[kind.open] : S.KIND_ID[door.item.kind];
        this.scene.kind[door.item.index] = next;
        this.render.setItemKind(door.item.index, next);
      }
      world.changed.clear();
    }

    syncDoorsAll() {
      for (const door of this.scene.world.doors) this.scene.world.changed.add(door);
      this.syncDoors();
    }

    saveStore() {
      if (!this.savePromise) {
        this.savePromise = S.Save.openStore().catch(e => {
          this.savePromise = null;
          throw e;
        });
      }
      return this.savePromise;
    }

    savedView() {
      const c = this.camera;
      return { x: c.fx, z: c.fz, zoom: c.zoom, rot: c.rot, floor: this.floor, mode: this.wallMode, autoCut: this.autoCut, follow: this.follow };
    }

    restoreView(view) {
      if (view) {
        this.camera.setView({ x: view.x, z: view.z, zoom: view.zoom, rot: view.rot });
        this.floor = view.floor;
        this.wallMode = view.mode;
        this.autoCut = view.autoCut;
        this.follow = view.follow;
      }
      this.watch = null;
      if (this.ready) {
        this.syncDoors();
        this.syncLamps(true);
      }
      this.stamp = '';
      this.dirty = true;
    }

    socialNews(event) {
      const world = this.scene.world;
      return event.type !== 'rel' || world.family.some(s => s.id === event.sim) || event.text.includes(this.selected.name);
    }

    askJoin(sim, spouse) {
      const world = this.scene.world;
      if (!sim || world.family.includes(sim)) return;
      if (world.family.length >= S.Social.FAMILY_LIMIT) {
        this.toast('В семье уже ' + S.Social.FAMILY_LIMIT + ' человек, ' + sim.name + ' останется жить у себя', true);
        return;
      }
      this.ask = {
        title: 'Переезд', text: (spouse ? 'Свадьба: ' + spouse.name + ' и ' + sim.name + '. ' : '') + sim.name + ' переедет к вам или останется жить у себя?', yes: 'Переехать к нам', no: 'Жить у себя',
        run: () => S.Social.join(world, sim)
      };
      this.stamp = '';
    }

    askBox() {
      const v = this.screen, w = ASK_W, lines = this.ask ? S.Font.wrap('text', this.ask.text, w - 28).length : 0, h = Math.max(ASK_H, ASK_TEXT_TOP + lines * 15 + 34);
      return { x: Math.round((v.sw - w) / 2), y: Math.round((v.sh - h) / 2) - 60, w, h };
    }

    askButton(px, py) {
      const b = this.askBox();
      for (const [i, bx] of [[0, b.x + 16], [1, b.x + b.w - 16 - ASK_BUTTON]]) {
        if (px >= bx && px < bx + ASK_BUTTON && py >= b.y + b.h - 34 && py < b.y + b.h - 10) return i;
      }
      return -1;
    }

    askClick(px, py) {
      const i = this.askButton(px, py), ask = this.ask;
      if (i < 0) return;
      this.ask = null;
      this.stamp = '';
      this.sound.play('tick');
      if (i === 0) ask.run();
      else if (ask.cancel) ask.cancel();
    }

    askOpp(event) {
      const world = this.scene.world, row = S.OPPS[event.offer], o = S.Opps.of(world);
      if (!row || !o.offer || o.offer.id !== row.id) return;
      const sim = world.sims[o.offer.sim];
      this.sound.play('ring');
      this.ask = {
        title: (o.offer.work ? 'На работе: ' : 'Звонок: ') + row.title, text: sim.name + '. ' + row.text + ' Срок ' + row.days + ' дн., награда: ' + S.Opps.rewardText(row) + '.', yes: 'Взяться', no: 'Отказаться',
        run: () => S.Opps.accept(world), cancel: () => S.Opps.decline(world)
      };
      this.stamp = '';
    }

    askNanny(event) {
      const world = this.scene.world, caller = world.family.find(s => S.AGE_RANK[s.age] >= S.AGE_RANK.teen) || this.selected;
      this.ask = {
        title: 'Малыш один', text: event.text + '. Вызвать няню? Она будет приходить сама, когда малыша не с кем оставить, §' + S.Services.NANNY_HOUR + ' в час.', yes: 'Вызвать няню', no: 'Не надо',
        run: () => S.Services.call(world, caller, 'nanny')
      };
      this.stamp = '';
    }

    applyJob(sim, id) {
      const world = this.scene.world, def = S.Jobs.def({ id }), lot = def && world.lots.find(l => l.id === def.lot);
      if (!lot || !sim.needs) return;
      const why = S.Jobs.whyNot(sim, def);
      if (why) {
        this.toast(sim.name + ': ' + why.charAt(0).toLowerCase() + why.slice(1), true);
        return;
      }
      const act = S.Acts.goAct({ x: lot.doorOut[0], z: lot.doorOut[1], floor: 0, lot, enter: lot }, true);
      act.job = id;
      if (S.Acts.add(world, sim, act)) this.toast(sim.name + ' идёт устраиваться: ' + def.name);
    }

    puddles() {
      const world = this.scene.world, c = this.camera, out = [], lot = world.family[0] && world.family[0].home, u = lot && lot.upkeep;
      if (!u || c.zoom > 2) return out;
      for (const p of u.puddles) {
        if (p[2] > this.floor && this.wallMode !== 'up') continue;
        const s = c.toScreen(p[0], S.House.floorY(lot.house, p[2]) + 0.02, p[1]);
        out.push({ x: Math.round(s[0]), y: Math.round(s[1]), r: Math.max(3, Math.round(c.tile * 0.35)) });
      }
      return out;
    }

    drawPuddles(g, list) {
      for (const p of list) {
        g.fillStyle = 'rgba(70,120,200,0.55)';
        g.beginPath();
        g.ellipse(p.x, p.y, p.r, p.r * 0.5, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(220,240,255,0.7)';
        g.fillRect(p.x - Math.round(p.r * 0.4), p.y - 1, Math.max(2, Math.round(p.r * 0.3)), 1);
      }
    }

    sparks() {
      const world = this.scene.world, c = this.camera, out = [], lot = world.family[0] && world.family[0].home;
      if (!lot || !lot.upkeep || c.zoom > 2) return out;
      for (const item of S.Upkeep.brokenItems(lot)) {
        if (item.floor > this.floor && this.wallMode !== 'up') continue;
        const s = c.toScreen(lot.x + item.x, S.House.floorY(lot.house, item.floor) + SPARK_LIFT, lot.z + item.z);
        out.push({ x: Math.round(s[0]), y: Math.round(s[1]), kind: S.Upkeep.brokenKind(lot, item) });
      }
      const mailbox = lot.house.items.find(i => S.baseOf(i) === 'mailbox'), svc = world.service;
      if (mailbox && svc && (svc.mail.fresh || S.Services.unpaid(world).length || svc.paper === world.day)) {
        const s = c.toScreen(lot.x + mailbox.x, lot.house.base + FLAG_LIFT, lot.z + mailbox.z);
        out.push({ x: Math.round(s[0]), y: Math.round(s[1]), kind: 'mail', red: S.Services.unpaid(world).some(b => b.red) });
      }
      return out;
    }

    drawSparks(g, list) {
      const k = Math.floor(this.time * 6) % 2;
      for (const s of list) {
        if (s.kind === 'mail') {
          g.fillStyle = '#4a3a2a';
          g.fillRect(s.x, s.y, 2, 12);
          g.fillStyle = s.red ? '#e03c2c' : '#f0c040';
          g.fillRect(s.x + 2, s.y + (k ? 0 : 1), 8, 5);
          continue;
        }
        g.strokeStyle = s.kind === 'dead' ? '#ffe04a' : '#9ad8ff';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(s.x - 4, s.y - 6 - k);
        g.lineTo(s.x, s.y - 2);
        g.lineTo(s.x - 2, s.y + 1);
        g.lineTo(s.x + 4, s.y + 6 + k);
        g.stroke();
        g.lineWidth = 1;
      }
    }

    drawAsk(g) {
      const b = this.askBox(), ask = this.ask, pointer = this.pointer, hover = pointer ? this.askButton(pointer.x, pointer.y) : -1, Font = S.Font;
      S.Kit.glass(g, b.x, b.y, b.w, b.h, 'pale', 10);
      Font.draw(g, 'title', ask.title, b.x + 14, b.y + 10, '#102a66');
      Font.wrap('text', ask.text, b.w - 28).forEach((line, i) => Font.draw(g, 'text', line, b.x + 14, b.y + ASK_TEXT_TOP + i * 15, '#102a66'));
      [[ask.yes, b.x + 16], [ask.no, b.x + b.w - 16 - ASK_BUTTON]].forEach(([label, x], i) => {
        S.Kit.plate(g, x, b.y + b.h - 34, ASK_BUTTON, 24, hover === i ? 'hover' : 'normal', 10);
        Font.shadowed(g, 'bold', label, x + (ASK_BUTTON - Font.measure('bold', label)) / 2, b.y + b.h - 29, '#fff', '#12306e');
      });
    }

    fights() {
      const world = this.scene.world, c = this.camera, out = [];
      for (const sim of world.live) {
        const line = sim.act && !sim.act.listen && sim.act.ad === 'fight' && sim.act.phase === 'run' ? sim.act : sim.line && sim.line.ad === 'fight' ? sim.line : null;
        if (!line) continue;
        const other = world.sims[line.with];
        if (!other) continue;
        const p = c.toScreen((sim.x + other.x) / 2, (sim.y + other.y) / 2 + FIGHT_LIFT, (sim.z + other.z) / 2);
        out.push({ x: Math.round(p[0]), y: Math.round(p[1]) });
      }
      return out;
    }

    drawFights(g, list) {
      const k = Math.floor(this.time * 8);
      for (const f of list) {
        for (let i = 0; i < FIGHT_PUFFS; i++) {
          const a = i / FIGHT_PUFFS * Math.PI * 2 + k * 0.7, r = 14 + ((k + i * 3) % 4) * 3, x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r * 0.6;
          g.fillStyle = i % 2 ? '#c8bca4' : '#e6dcc4';
          g.beginPath();
          g.arc(Math.round(x), Math.round(y), 12 + (i + k) % 4, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = '#7a6a50';
        for (let i = 0; i < 3; i++) g.fillRect(f.x - 12 + ((k * 7 + i * 11) % 24), f.y - 8 + ((k * 5 + i * 7) % 14), 3, 3);
        S.Icons.centered(g, 'star', f.x + ((k % 2) ? 10 : -10), f.y - 14, 'gold');
      }
    }

    flames() {
      const world = this.scene.world, c = this.camera, out = [];
      for (const lot of world.lots) {
        if (!lot.kitchen || !lot.kitchen.fires.length) continue;
        for (const fire of lot.kitchen.fires) {
          const item = lot.house.items[fire.item];
          if (item.floor > this.floor && this.wallMode !== 'up') continue;
          const p = c.toScreen(lot.x + item.x, S.House.floorY(lot.house, item.floor) + FLAME_LIFT, lot.z + item.z);
          out.push({ x: Math.round(p[0]), y: Math.round(p[1]), heat: fire.heat });
        }
      }
      return out;
    }

    drawFlames(g, list) {
      const k = Math.floor(this.time * 8);
      for (const f of list) {
        const size = 0.6 + 0.4 * Math.max(0, f.heat);
        for (let i = 0; i < 3; i++) {
          const puff = (k + i * 5) % 12;
          g.fillStyle = 'rgba(70,64,60,' + (0.5 - puff * 0.035) + ')';
          g.beginPath();
          g.arc(f.x + (i - 1) * 6 + Math.sin(k + i) * 2, f.y - 26 * size - puff * 3, 7 + puff * 0.6, 0, Math.PI * 2);
          g.fill();
        }
        for (let i = 0; i < FLAME_TONGUES; i++) {
          const dx = (i - (FLAME_TONGUES - 1) / 2) * 6 * size, h = (16 + ((k * 7 + i * 13) % 9)) * size, w = 7 * size;
          g.fillStyle = i % 2 ? '#ff7a1a' : '#ffb21a';
          g.beginPath();
          g.moveTo(f.x + dx - w / 2, f.y);
          g.lineTo(f.x + dx + Math.sin(k * 0.9 + i) * 3, f.y - h);
          g.lineTo(f.x + dx + w / 2, f.y);
          g.fill();
          g.fillStyle = '#fff2a0';
          g.beginPath();
          g.moveTo(f.x + dx - w / 4, f.y);
          g.lineTo(f.x + dx + Math.sin(k * 0.9 + i) * 2, f.y - h * 0.55);
          g.lineTo(f.x + dx + w / 4, f.y);
          g.fill();
        }
      }
    }

    partyText() {
      const p = this.scene.world.party;
      if (!p) return '';
      const at = m => {
        const mm = ((m % 1440) + 1440) % 1440;
        return Math.floor(mm / 60) + ':' + String(Math.floor(mm % 60)).padStart(2, '0');
      };
      const name = p.kind === 'wedding' ? 'Свадьба' : 'Вечеринка';
      return p.on ? name + ' до ' + at(p.end) : name + ' в ' + at(p.start);
    }

    drawParty(g, text) {
      const v = this.screen, w = S.Font.measure('bold', text) + 34, x = v.sw - w - 8, y = PARTY_Y;
      S.Kit.glass(g, x, y, w, 22, 'deep', 8);
      S.Icons.centered(g, 'music', x + 13, y + 11, 'gold');
      S.Font.draw(g, 'bold', text, x + 24, y + 4, '#fff');
    }

    toast(text, bad) {
      const note = this.note;
      if (note && this.time < note.until && this.time < note.at + NOTE_HOLD) {
        if (note.text !== text && this.notes.length < NOTE_QUEUE && !this.notes.some(n => n.text === text)) this.notes.push({ text, bad: !!bad });
        return;
      }
      this.note = { text, bad: !!bad, at: this.time, until: this.time + NOTE_TIME };
      this.stamp = '';
    }

    async saveGame(key, name) {
      if (this.saving) return false;
      this.saving = true;
      const file = S.Save.file(this.game, this.savedView());
      try {
        await S.Save.write(await this.saveStore(), key, file, Date.now());
        this.toast('Сохранено: ' + name);
        return true;
      } catch (e) {
        this.toast('Не удалось сохранить, прежний файл цел: ' + e.message, true);
        return false;
      } finally {
        this.saving = false;
      }
    }

    async autoSave() {
      try {
        const slot = await S.Save.nextAuto(await this.saveStore());
        await this.saveGame(slot.key, slot.name);
      } catch (e) {
        this.toast('Не удалось сохранить, прежний файл цел: ' + e.message, true);
      }
    }

    async loadGame(key, name) {
      try {
        const result = await S.Save.load(await this.saveStore(), key, this.game);
        if (this.dead) return false;
        this.restoreView(result.file.view);
        if (result.fromBackup) this.toast('«' + name + '» повреждён (' + result.reason + '), загружена резервная копия. Пробел: продолжить', true);
        else this.toast('Загружено: ' + name + '. Пробел: продолжить');
        return true;
      } catch (e) {
        this.toast('Не удалось загрузить: ' + e.message, true);
        return false;
      }
    }

    pickSim(sx, sy) {
      const c = this.camera, world = this.scene.world;
      let best = null, bestDepth = Infinity;
      for (const sim of world.sims) {
        if ((sim.free && !sim.live) || sim.inside || sim.car) continue;
        const feet = c.toScreen(sim.x, sim.y, sim.z), head = c.toScreen(sim.x, sim.y + S.Body.height(sim.age), sim.z), half = Math.max(c.tile * 0.2, 4);
        if (Math.abs(sx - feet[0]) > half || sy < head[1] || sy > feet[1] + half / 2) continue;
        const depth = c.depthAt(sim.x, sim.y, sim.z);
        if (depth < bestDepth) {
          bestDepth = depth;
          best = sim;
        }
      }
      return best;
    }

    viewFloorOn(lot) {
      const state = this.viewState;
      return state && lot && state.house === lot.house && !S.House.showsRoof(lot.house, state) ? state.floor : 0;
    }

    pickItem(sx, sy) {
      const c = this.camera, world = this.scene.world, state = this.viewState;
      let best = null, bestDepth = Infinity;
      for (const lot of world.lots) {
        const h = lot.house, open = state && state.house === h && !S.House.showsRoof(h, state), floor = open ? state.floor : -1;
        for (const item of h.items) {
          const object = S.objectOf(item);
          if (!object || (item.outdoor ? false : item.floor !== floor)) continue;
          const kind = S.KINDS[S.KIND_ID[item.kind]], turned = item.facing % 2 === 1, hw = (turned ? kind.d : kind.w) / 2, hd = (turned ? kind.w : kind.d) / 2, y0 = item.outdoor ? h.base : S.House.floorY(h, item.floor);
          for (let up = kind.h; up >= 0; up -= PICK_STEP) {
            const [wx, wz] = c.fromScreen(sx, sy, y0 + up);
            if (Math.abs(wx - h.x - item.x) > hw || Math.abs(wz - h.z - item.z) > hd) continue;
            const depth = c.depthAt(wx, y0 + up, wz);
            if (depth < bestDepth) {
              bestDepth = depth;
              best = { item, lot };
            }
            break;
          }
        }
      }
      return best;
    }

    relLine(sim) {
      const me = this.selected, world = this.scene.world;
      if (sim === me) return 'Телефон';
      const rel = S.Rel.get(world, me, sim), status = S.Rel.word(world, me, sim), kin = S.Rel.kinWord(world, me, sim), traits = this.traitLine(sim);
      return [kin || status, rel && S.Rel.status(world, me, sim) !== 'stranger' ? (rel.v >= 0 ? '+' : '−') + Math.abs(Math.round(rel.v)) : '', traits].filter(Boolean).join(' · ');
    }

    traitLine(sim) {
      const known = S.Traits.known(this.selected, sim);
      if (!known.length) return '';
      return 'Черты: ' + known.map(id => (id ? S.Traits.name(id, sim.sex) : '?')).join(', ');
    }

    bubbles() {
      const c = this.camera, out = [];
      for (const sim of this.scene.world.live) {
        if (!sim.bubble || sim.inside || sim.car) continue;
        const p = c.toScreen(sim.x, sim.y + S.Body.height(sim.age) + BUBBLE_LIFT, sim.z), x = Math.round(p[0]), y = Math.round(p[1]);
        if (x < -BUBBLE_W || y < -BUBBLE_H || x > this.screen.sw + BUBBLE_W || y > this.screen.sh) continue;
        out.push({ x, y, icon: sim.bubble });
      }
      return out;
    }

    drawBubbles(g, list) {
      for (const b of list) {
        S.Kit.glass(g, b.x - BUBBLE_W / 2, b.y - BUBBLE_H, BUBBLE_W, BUBBLE_H, 'white', 9);
        g.fillStyle = '#12306e';
        g.fillRect(b.x - 2, b.y, 5, 1);
        g.fillRect(b.x - 1, b.y + 1, 3, 1);
        g.fillRect(b.x, b.y + 2, 1, 1);
        S.Icons.centered(g, b.icon, b.x, b.y - BUBBLE_H / 2, 'blue');
      }
    }

    targetAt(sx, sy) {
      const world = this.scene.world, sim = this.pickSim(sx, sy);
      if (sim) return { type: 'sim', sim, title: sim.name, sub: this.relLine(sim) };
      const picked = this.pickItem(sx, sy);
      if (picked) return { type: 'item', item: picked.item, lot: picked.lot, title: S.KINDS[S.KIND_ID[picked.item.kind]].name };
      const state = this.viewState, lot = state && !S.House.showsRoof(state.house, state) ? world.lots.find(l => l.house === state.house) : null;
      if (lot && state.floor > 0) {
        const [wx, wz] = this.camera.fromScreen(sx, sy, S.House.floorY(lot.house, state.floor));
        return { type: 'ground', x: wx, z: wz, floor: state.floor, title: 'Сюда' };
      }
      const [px, pz] = this.camera.pick(this.scene.terrain, sx, sy), at = world.ground.lotAt(px, pz);
      return { type: 'ground', x: px, z: pz, floor: 0, title: at && at.closed ? at.name : 'Сюда' };
    }

    click(sx, sy, first) {
      if (!this.ready || !this.scene.sample) return;
      this.pie.show(sx, sy, this.targetAt(sx, sy), first);
    }

    pieChoice(option, first) {
      const world = this.scene.world, sim = this.selected;
      this.sound.play('tick');
      if (option.select) {
        this.selectSim(option.select);
        return;
      }
      let act = null;
      if (option.bag !== undefined) {
        act = S.Econ.use(world, sim, option.bag, option.use, option);
        this.stamp = '';
        if (!act) return;
      } else if (option.guitar) act = S.Art.guitarAct(world, sim, option);
      else if (option.phone) {
        act = { ad: 'phone_call', lot: sim.home.index, item: -1, step: 0, phase: 'start', left: 0, phone: option.phone, with: option.with ? world.sims.indexOf(option.with) : -1 };
      } else if (option.go) {
        act = S.Acts.goAct(option.go, !!option.car);
        if (option.sell) act.sell = true;
        if (option.buy) act.buy = option.buy;
        if (option.job) act.job = option.job;
        if (option.work) act.work = true;
        if (option.deliver) act.deliver = option.deliver;
      }
      else if (option.with) {
        act = S.Acts.adAct(option.ad, sim.home, null);
        act.with = world.sims.indexOf(option.with);
      } else if (option.ad) {
        act = S.Acts.adAct(option.ad, option.lot || sim.home, option.item);
        for (const key of OPTION_KEYS) if (option[key] !== undefined) act[key] = option[key];
      }
      if (act && !S.Acts.add(world, sim, act, first)) this.toast(sim.name + ': очередь полна', true);
    }

    syncSounds(dt) {
      this.soundsLeft -= dt;
      if (this.soundsLeft > 0) return;
      this.soundsLeft = SOUND_EVERY;
      const wanted = new Map(), c = this.camera;
      for (const sim of this.scene.world.family) {
        const act = sim.act, step = act && act.ad && act.phase === 'run' ? S.ADS[act.ad].steps[act.step] : null;
        if (!step || !step.loop) continue;
        const gain = (1 - Math.hypot(sim.x - c.fx, sim.z - c.fz) / HEAR_RANGE) * (1 - c.zoom * 0.2);
        if (gain > 0) wanted.set(step.loop, Math.max(wanted.get(step.loop) || 0, gain));
      }
      const rabbit = this.selected && this.selected.needs ? S.Jobs.status(this.scene.world, this.selected) : null;
      if (rabbit) wanted.set(rabbit.school ? 'school' : 'office', RABBIT_GAIN);
      for (const lot of this.scene.world.lots) {
        if (!lot.kitchen || !lot.kitchen.fires.length) continue;
        const gain = (1 - Math.hypot(lot.x + lot.w / 2 - c.fx, lot.z + lot.d / 2 - c.fz) / HEAR_RANGE) * (1 - c.zoom * 0.2);
        if (gain > 0) wanted.set('fire', Math.max(wanted.get('fire') || 0, gain));
      }
      this.sound.setLoops(wanted);
    }

    wantSprites() {
      const c = this.camera, scene = this.scene, zoom = this.zoomAnim && this.zoomAnim.dir < 0 ? c.zoom - 1 : c.zoom;
      if (zoom > 1) return;
      const level = zoom === 0 ? S.ATLAS.NEAR : S.ATLAS.HALF;
      for (const id of this.render.visible) {
        for (let i = scene.chunkStart[id]; i < scene.chunkStart[id + 1]; i++) {
          const turn = ((scene.facing[i] & 3) + c.rot) & 3, kind = S.KINDS[scene.kind[i]];
          this.store.want(scene.kind[i], turn, level);
          if (kind.open) this.store.want(S.KIND_ID[kind.open], turn, level);
        }
      }
      for (const sim of scene.world.cars) {
        const sprite = S.Sim.carSprite(sim.car.dx, sim.car.dz, sim.ride);
        this.store.want(S.KIND_ID[sprite.kind], (sprite.facing + c.rot) & 3, level);
      }
    }

    stepLoad() {
      if (this.loadWait) return;
      const end = performance.now() + LOAD_BUDGET;
      while (performance.now() < end) {
        let step;
        try {
          step = this.loader.next();
        } catch (e) {
          this.loadError = e;
          this.loader = null;
          return;
        }
        if (step.done) {
          this.loader = null;
          this.ready = true;
          this.dirty = true;
          this.loadMs = performance.now() - this.loadStart;
          return;
        }
        if (step.value && step.value.then) {
          this.loadWait = true;
          step.value.then(() => { this.loadWait = false; }, e => {
            this.loadWait = false;
            this.loadError = e;
            this.loader = null;
          });
          return;
        }
      }
    }

    bindInput() {
      this.onKeyDown = e => {
        if (this.dead || !this.isActive() || e.ctrlKey || e.altKey || e.metaKey) return;
        if (PAN_KEYS[e.code]) {
          e.preventDefault();
          this.keys.add(e.code);
          return;
        }
        if (e.repeat) return;
        if (e.code === 'KeyZ') this.zoomStep(-1);
        else if (e.code === 'KeyX') this.zoomStep(1);
        else if (e.code === 'Comma') this.turn(-1);
        else if (e.code === 'Period') this.turn(1);
        else if (e.code === 'Home' && this.ready && this.scene.sample) this.goHome();
        else if (e.code === 'Home') this.camera.setView({ x: S.METRICS.town / 2, z: S.METRICS.town / 2 });
        else if (e.code === 'Tab' && this.ready && this.scene.sample) this.selectNext();
        else if (e.code === 'KeyM' && this.ready && this.scene.sample && !this.saves.open) this.map.toggle();
        else if (e.code === 'KeyJ' && this.ready && this.scene.sample && !this.saves.open && !this.map.open) this.journal.toggle();
        else if (e.code === 'Escape' && this.ready && this.scene.sample) {
          if (this.ask) {
            const ask = this.ask;
            this.ask = null;
            this.stamp = '';
            if (ask.cancel) ask.cancel();
          } else if (this.news && this.news.open) {
            this.news.toggle();
          } else if (this.live.cardOpen) {
            this.live.closeCard();
          } else if (this.journal && this.journal.open) {
            this.journal.toggle();
          } else if (this.live.dreamOpen) {
            this.live.dreamOpen = false;
            this.stamp = '';
          } else if (this.pie.open) this.pie.hide();
          else if (this.map.open) this.map.toggle();
          else if (this.saves.open) this.saves.hide();
          else this.live.toggleMenu();
        }
        else if ((e.code === 'Space' || e.code === 'KeyP') && this.ready && this.scene.sample) this.game.togglePause();
        else if (/^Digit[1-6]$/.test(e.code) && this.ready && this.scene.sample && this.pie.open) this.pie.choose(+e.code.slice(5) - 1);
        else if (/^Digit[1-4]$/.test(e.code) && this.ready && this.scene.sample) this.game.setSpeed(+e.code.slice(5));
        else if (e.code === 'F6' && this.ready && this.scene.sample) this.saveGame('quick', 'Быстрое сохранение');
        else if (e.code === 'KeyY' && this.ready && this.scene.sample) this.autoCut = !this.autoCut;
        else if (e.code === 'KeyV') this.setScreen(S.SCREENS[(S.SCREENS.indexOf(this.settings.screen) + 1) % S.SCREENS.length]);
        else if (e.code === 'KeyB') this.setting('dither', !this.settings.dither);
        else if (e.code === 'KeyI') this.setting('debug', !this.settings.debug);
        else if (this.ready && this.scene.sample && e.code === 'KeyC') this.setStyleRow((this.styleRow + 1) % S.Sample.STYLES.length);
        else if (this.ready && this.scene.sample && e.code === 'KeyF') this.setView((this.viewIndex + 1) % S.Sample.VIEWS.length);
        else if (this.ready && this.scene.sample && e.code === 'KeyQ') this.setWallMode(S.WALL_MODES[(S.WALL_MODES.indexOf(this.wallMode) + 1) % S.WALL_MODES.length]);
        else if (this.ready && this.scene.sample && e.code === 'PageUp') this.setFloor(Math.min(this.floor + 1, S.METRICS.floors - 1));
        else if (this.ready && this.scene.sample && e.code === 'PageDown') this.setFloor(Math.max(this.floor - 1, 0));
        else if (this.ready && this.scene.sample && e.code === 'KeyN') this.setHour(HOUR_PRESETS[(HOUR_PRESETS.findIndex(h => h > this.hour) + HOUR_PRESETS.length) % HOUR_PRESETS.length]);
        else if (this.ready && this.scene.sample && e.code === 'BracketRight') this.setHour(this.hour + 1);
        else if (this.ready && this.scene.sample && e.code === 'BracketLeft') this.setHour(this.hour - 1);
        else if (this.ready && this.scene.sample && e.code === 'KeyR') this.setRoofForm(S.ROOF_FORMS[(S.ROOF_FORMS.indexOf(this.scene.houses[0].roof.form) + 1) % S.ROOF_FORMS.length]);
        else if (this.ready && this.scene.sample && e.code === 'KeyG') this.setQuality(S.QUALITIES[(S.QUALITIES.indexOf(this.settings.quality) + 1) % S.QUALITIES.length]);
        else return;
        e.preventDefault();
        this.dirty = true;
      };
      this.onKeyUp = e => this.keys.delete(e.code);
      this.onBlur = () => this.keys.clear();
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      window.addEventListener('blur', this.onBlur);
      const p = this.panels;
      p.addEventListener('pointermove', e => {
        const r = p.getBoundingClientRect(), v = this.screen;
        this.pointer = { x: (e.clientX - r.left) * v.sw / r.width, y: (e.clientY - r.top) * v.sh / r.height };
        if (this.live && this.ready && !this.dragging) this.live.layer.move(this.pointer.x, this.pointer.y, performance.now());
        if (this.pie && this.pie.open) this.pie.move(this.pointer.x, this.pointer.y, performance.now());
        if (this.dragging && !this.paused) {
          this.follow = false;
          this.camera.pan(-e.movementX * v.sw / r.width, -e.movementY * v.sh / r.height);
          this.dirty = true;
        }
      });
      p.addEventListener('pointerleave', () => {
        this.pointer = null;
        if (this.live) this.live.layer.move(null, null, performance.now());
      });
      p.addEventListener('pointerdown', e => {
        const r = p.getBoundingClientRect(), v = this.screen, px = (e.clientX - r.left) * v.sw / r.width, py = (e.clientY - r.top) * v.sh / r.height;
        this.sound.unlock();
        if (this.ask) {
          this.askClick(px, py);
          return;
        }
        if (this.news && this.news.open) {
          this.news.click(px, py, e.button);
          return;
        }
        if (this.live && this.live.cardOpen) {
          this.live.cardClick(px, py, e.button);
          return;
        }
        if (this.journal && this.journal.open) {
          this.journal.click(px, py, e.button);
          return;
        }
        if (this.live && this.live.dreamOpen) {
          this.live.dreamClick(px, py);
          return;
        }
        if (this.pie && this.pie.open) {
          this.pie.click(px, py, e.button);
          return;
        }
        if (this.saves && this.saves.open) {
          this.saves.click(px, py);
          return;
        }
        if (this.map && this.map.open) {
          this.map.click(px, py, e.button);
          return;
        }
        if (this.live && this.ready) {
          if (this.live.menu) {
            this.live.menuClick(px, py);
            return;
          }
          if (this.live.layer.press(px, py, e.button, performance.now())) {
            if (this.live.layer.down && this.live.layer.down.click) this.sound.play('tick');
            return;
          }
        }
        if (e.button === 0) {
          this.click(px, py, e.shiftKey);
          return;
        }
        if (e.button !== 2) return;
        this.dragging = true;
        p.setPointerCapture(e.pointerId);
      });
      p.addEventListener('pointerup', e => {
        if (e.button === 2) this.dragging = false;
        if (this.live) this.live.layer.release();
      });
      p.addEventListener('contextmenu', e => e.preventDefault());
      p.addEventListener('wheel', e => {
        e.preventDefault();
        if (this.paused) return;
        if (this.live && this.pointer && !this.map.open && this.live.wheel(this.pointer.x, this.pointer.y, e.deltaY)) {
          this.stamp = '';
          return;
        }
        this.wheel += e.deltaY;
        if (Math.abs(this.wheel) < 40) return;
        this.zoomStep(this.wheel > 0 ? 1 : -1);
        this.wheel = 0;
      }, { passive: false });
    }

    setting(key, value) {
      this.settings[key] = value;
      saveSettings(this.settings);
      this.stamp = '';
    }

    setScreen(mode) {
      this.setting('screen', mode);
      this.resize();
    }

    resize() {
      const r = this.root.getBoundingClientRect();
      this.screen = S.screenFor(this.settings.screen, r.width, r.height);
      const v = this.screen, sharp = Number.isInteger(v.scale);
      if (this.world.width !== v.sw || this.world.height !== v.sh) {
        this.world.width = v.sw;
        this.world.height = v.sh;
        this.panels.width = v.sw;
        this.panels.height = v.sh;
        this.over.width = v.sw;
        this.over.height = v.sh;
        this.camera.setSize(v.sw, v.sh);
        if (this.render) this.render.resize(v.sw, v.sh);
      }
      if (this.live && this.ready) this.live.layout(v);
      for (const canvas of [this.world, this.panels, this.over]) {
        canvas.style.left = v.x + 'px';
        canvas.style.top = v.y + 'px';
        canvas.style.width = v.width + 'px';
        canvas.style.height = v.height + 'px';
        canvas.classList.toggle('ts-sharp', sharp);
      }
      this.stamp = '';
      this.dirty = true;
    }

    zoomStep(dir) {
      const next = this.camera.zoom + dir;
      if (this.zoomAnim || next < 0 || next >= S.ZOOMS.length) return;
      this.zoomAnim = { t: 0, dir };
      if (dir > 0) {
        this.camera.setView({ zoom: next });
        this.scaleNow = 2;
      }
      this.dirty = true;
    }

    turn(dir) {
      this.camera.setView({ rot: this.camera.rot + dir });
      this.shutter = 1;
      this.dirty = true;
    }

    update(dt) {
      let dx = 0, dy = 0;
      for (const code of this.keys) {
        dx += PAN_KEYS[code][0];
        dy += PAN_KEYS[code][1];
      }
      const pt = this.pointer;
      if (pt && !this.dragging && !(this.live && this.live.layer.hover)) {
        if (pt.x < EDGE) dx -= 1;
        else if (pt.x > this.screen.sw - EDGE) dx += 1;
        if (pt.y < EDGE) dy -= 1;
        else if (pt.y > this.screen.sh - EDGE) dy += 1;
      }
      if ((dx || dy) && !(this.map && this.map.open) && !(this.saves && this.saves.open)) {
        const len = Math.hypot(dx, dy);
        this.follow = false;
        this.camera.pan(dx / len * PAN_SPEED * dt, dy / len * PAN_SPEED * dt);
      }
      if (this.zoomAnim) {
        const a = this.zoomAnim;
        a.t += dt / ZOOM_TIME;
        if (a.t >= 1) {
          if (a.dir < 0) this.camera.setView({ zoom: this.camera.zoom - 1 });
          this.zoomAnim = null;
          this.scaleNow = 1;
        } else {
          this.scaleNow = a.dir < 0 ? 1 + a.t : 2 - a.t;
        }
      }
      if (this.shutter > 0) this.shutter = Math.max(0, this.shutter - dt / TURN_TIME);
      if (this.scene.sample) {
        const game = this.game;
        game.hold = this.saves.open || !!this.ask;
        game.advance(dt, this.camera.fx, this.camera.fz);
        for (const event of game.events.splice(0)) {
          if (event.type === 'morning') this.autoSave();
          else if (event.type === 'fail') this.toast(event.name + ': ' + event.text, true);
          else if (event.type === 'learn' && game.world.family.some(s => s.id === event.sim)) this.toast(event.name + ' узнаёт черту: ' + event.other + ', ' + event.trait);
          else if (event.type === 'wish') {
            this.toast(event.name + ': «' + event.text + '» исполнено, +' + S.LiveView.groups(event.points) + ' счастья');
            this.sound.play('tick');
          } else if (event.type === 'reward') this.toast(event.name + ': ' + event.text);
          else if (event.type === 'rel' || event.type === 'ask' || event.type === 'visit') {
            if (this.socialNews(event)) this.toast(event.text);
          } else if (event.type === 'party') {
            this.toast(event.text);
            this.sound.play('chime');
          } else if (event.type === 'dream') {
            this.toast(event.name + ': мечта сбылась, «' + event.text + '», +' + S.LiveView.groups(event.points) + ' счастья');
            this.sound.play('chime');
          } else if (event.type === 'mark') {
            this.map.mark = { sim: game.world.sims[event.index], until: this.time + MARK_SECONDS };
          } else if (event.type === 'join') this.askJoin(game.world.sims[event.index], game.world.sims[event.with]);
          else if (event.type === 'skill' || event.type === 'meal') {
            if (game.world.family.some(s => s.id === event.sim)) {
              this.toast(event.text);
              if (event.level || event.challenge || event.cert) this.sound.play('chime');
            }
          } else if (event.type === 'fire') {
            this.toast(event.text, !event.out && !event.cleaned);
            if (event.start) this.sound.play('alarm');
          } else if (CRAFT_EVENTS.has(event.type)) {
            if (!event.sim || game.world.family.some(s => s.id === event.sim)) {
              this.toast(event.text, !!event.full);
              if (event.type === 'money' && event.amount > 0) this.sound.play('chime', 0.6);
            }
          }
          else if (event.type === 'job') {
            if (!event.quiet && game.world.family.some(s => s.id === event.sim)) {
              this.toast(event.text);
              if (event.promoted) this.sound.play('chime');
              else if (event.ride) this.sound.play('honk', 0.6);
            }
          }
          else if (event.type === 'service' || event.type === 'upkeep') {
            if (!event.quiet && (!event.sim || game.world.family.some(s => s.id === event.sim))) this.toast(event.text, !!event.bad);
            if (event.mail) this.sound.play('tick');
          } else if (event.type === 'opp') {
            if (event.offer && !event.accepted && !event.done && !event.failed) this.askOpp(event);
            else this.toast(event.text, !!event.failed);
            if (event.done) this.sound.play('chime');
          } else if (event.type === 'news' && event.open) this.news.show();
          else if (event.type === 'ask' && event.kind === 'nanny') this.askNanny(event);
          else if (event.type === 'sound' && Math.hypot(event.x - this.camera.fx, event.z - this.camera.fz) < HEAR_RANGE) this.sound.play(event.name, 0.7);
        }
        this.syncSounds(dt);
        this.syncDoors();
        this.syncFlags();
        this.syncReskin();
        this.syncLamps(false);
        this.syncCamera(dt);
        this.syncActive();
        if (this.ticks % WANT_EVERY === 0) this.wantSprites();
      } else {
        S.Dummy.step(this.scene, dt);
      }
    }

    draw() {
      const sample = !!this.scene.sample, sky = sample ? S.skyAt(this.hour) : { color: [1, 1, 1], sun: 1 };
      if (sample) this.syncActive();
      this.render.draw(this.camera, {
        time: this.time, scale: this.scaleNow, shutter: this.shutter, dither: this.settings.dither,
        sky: sky.color, sun: sky.sun,
        world: sample ? this.scene.world : null, selected: this.selected
      });
      this.dirty = false;
    }

    drawPanels(paused) {
      const v = this.screen, g = this.g;
      if (this.notes.length && (!this.note || this.time >= this.note.until || this.time >= this.note.at + NOTE_HOLD)) {
        const next = this.notes.shift();
        this.note = { text: next.text, bad: next.bad, at: this.time, until: this.time + NOTE_TIME };
        this.stamp = '';
      }
      const mapOpen = this.map && this.map.open, savesOpen = this.saves && this.saves.open, game = this.ready && this.game, note = this.note && this.time < this.note.until ? this.note : null, live = this.ready ? this.live : null;
      if (live) live.layer.hidden = mapOpen;
      const pieOpen = this.pie && this.pie.open, tip = live && !mapOpen && !savesOpen && !live.menu && !pieOpen ? live.update(performance.now()) : (live && live.update(0), null), menu = live && live.menu, hovered = tip ? live.layer.hover : null;
      const bubbles = this.ready && !mapOpen && !savesOpen && this.scene.world ? this.bubbles() : [];
      const fights = this.ready && !mapOpen && !savesOpen && this.scene.world ? this.fights() : [];
      const flames = this.ready && !mapOpen && !savesOpen && this.scene.world ? this.flames() : [];
      const glints = this.ready && !mapOpen && !savesOpen && this.scene.world ? this.glints() : [];
      const tackle = this.ready && !mapOpen && !savesOpen && this.scene.world ? this.tackle() : [];
      const partyText = this.ready && !mapOpen && this.scene.world ? this.partyText() : '';
      const mark = this.ready && !mapOpen && !savesOpen && this.scene.world ? this.pointMark() : null;
      const puddles = this.ready && !mapOpen && !savesOpen && this.scene.world ? this.puddles() : [];
      const sparks = this.ready && !mapOpen && !savesOpen && this.scene.world ? this.sparks() : [];
      const stamp = [paused, Math.floor(this.time * (mapOpen ? 4 : 2)), v.scale, v.sw, v.sh, this.progress, this.settings.debug, !!this.loadError, mapOpen, savesOpen, menu, (mapOpen || savesOpen || menu) && this.pointer ? this.pointer.x + ',' + this.pointer.y : '', game ? game.speed : '', note ? note.text : '', tip ? [tip.title, tip.text, tip.keys, hovered.x, hovered.y].join() : '', pieOpen ? this.pie.key() : '', bubbles.map(b => b.icon + b.x + ',' + b.y).join(';'), live && live.dreamOpen && this.pointer ? 'd' + this.pointer.x + ',' + this.pointer.y : '', fights.length ? fights.map(f => f.x + ',' + f.y).join(';') + ':' + Math.floor(this.time * 8) : '', partyText, this.ask ? 'a' + (this.pointer ? this.askButton(this.pointer.x, this.pointer.y) : -1) : '', flames.length ? flames.map(f => f.x + ',' + f.y).join(';') + ':' + Math.floor(this.time * 8) : '', glints.length ? glints.length + ':' + glints[0].x + ',' + glints[0].y + ':' + Math.floor(this.time * 6) : '', tackle.length ? tackle.map(o => (o.hand || o.body).join()).join(';') + ':' + Math.floor(this.time * 6) : '', this.journal && this.journal.open ? this.journal.key() : '', mark ? mark.x + ',' + mark.y + ':' + Math.floor(this.time * 6) : '', puddles.map(p => p.x + ',' + p.y).join(';'), sparks.length ? sparks.map(s => s.x + ',' + s.y + s.kind).join(';') + ':' + Math.floor(this.time * 6) : '', this.news && this.news.open ? this.news.key() : '', live && live.cardOpen ? live.cardKey() : ''].join('|');
      if (stamp === this.stamp) return;
      this.stamp = stamp;
      g.clearRect(0, 0, v.sw, v.sh);
      if (!this.gl) {
        this.line(20, 40, 'Для игры нужен WebGL 2: проверьте ускорение графики', '#ff9a9a', 'bold');
      } else if (this.loadError) {
        this.line(20, 40, 'Не удалось загрузить данные игры: ' + this.loadError.message, '#ff9a9a', 'bold');
      } else if (!this.ready) {
        this.drawLoading(v);
      } else if (mapOpen) {
        this.map.draw(g, v);
      } else if (this.settings.debug || this.opts.bench) {
        this.drawStats(v);
      }
      if (bubbles.length) this.drawBubbles(g, bubbles);
      if (fights.length) this.drawFights(g, fights);
      if (puddles.length) this.drawPuddles(g, puddles);
      if (glints.length) this.drawGlints(g, glints);
      if (sparks.length) this.drawSparks(g, sparks);
      if (mark) this.drawPoint(g, mark);
      if (tackle.length) this.drawTackle(g, tackle);
      if (flames.length) this.drawFlames(g, flames);
      if (partyText) this.drawParty(g, partyText);
      if (live && live.dreamOpen) live.drawDream(g);
      if (this.journal && this.journal.open) this.journal.draw(g);
      if (live && live.cardOpen) live.drawCard(g);
      if (this.news && this.news.open) this.news.draw(g);
      if (this.ask) this.drawAsk(g);
      if (menu) live.drawMenu(g);
      if (pieOpen) this.pie.draw(g);
      if (savesOpen) this.saves.draw(g, v);
      if (note) this.drawNote(v, note);
      if (tip) S.Kit.drawTip(g, v.sw, v.sh, hovered.x + hovered.w / 2, hovered.y, tip);
      if (paused || (game && !game.speed)) this.drawPause(v);
    }

    drawNote(v, note) {
      const g = this.g, y = this.saves.open ? NOTE_TOP : v.sh - NOTE_BOTTOM, w = Math.min(v.sw - 16, S.Font.measure('bold', note.text) + 20), x = Math.floor((v.sw - w) / 2);
      S.Kit.glass(g, x, y, w, 24, note.bad ? 'night' : 'deep', 6);
      S.Font.draw(g, 'bold', note.text, x + 10, y + 5, note.bad ? '#ffb0a0' : '#fff');
    }

    line(x, y, text, color, font) {
      S.Font.shadowed(this.g, font || 'small', text, x, y - 10, color || '#fff');
    }

    drawLoading(v) {
      const g = this.g, w = 320, x = Math.floor((v.sw - w) / 2), y = Math.floor(v.sh / 2);
      this.line(x, y - 10, this.opts.bench ? 'Собираем город-пустышку' : 'Загружаем город', '#fff', 'bold');
      g.fillStyle = '#10234a';
      g.fillRect(x, y, w, 16);
      g.fillStyle = '#5c8fd6';
      g.fillRect(x + 2, y + 2, (w - 4) * this.progress, 12);
    }

    drawStats(v) {
      const g = this.g, c = this.camera, st = this.render.stats, zoom = S.ZOOMS[c.zoom];
      const hover = this.pointer ? c.pick(this.scene.terrain, this.pointer.x, this.pointer.y) : null;
      const fps = this.frameMs ? Math.round(1000 / this.frameMs) : 0;
      const lines = [
        (this.scene.sample ? 'Город, ' + this.scene.count + ' предметов, живых ' + this.scene.world.live.length + ' из ' + this.scene.sims.length : 'Город-пустышка, ' + this.scene.count + ' предметов, ' + this.scene.walkers.length + ' капсул'),
        'Масштаб «' + zoom.name + '» (' + zoom.tile + '×' + zoom.tile / 2 + '), поворот ' + c.rot + ', экран ' + v.sw + '×' + v.sh + ' (' + S.SCREEN_NAMES[v.mode] + ')',
        fps + ' к/с, кадр ' + this.frameMs.toFixed(1) + ' мс, логика и команды ' + this.cpuMs.toFixed(1) + ' мс',
        'Куски ' + st.chunks + ', предметы ' + st.sprites + ', вызовы ' + st.draws + ', треугольники ' + st.tris,
        'Видеопамять около ' + Math.round(this.gpu.bytes / 1048576) + ' МБ, качество «' + S.QUALITY_NAMES[this.settings.quality] + '», цвет ' + (this.settings.dither ? '16' : '32') + ' бит',
        'Фокус ' + Math.round(c.fx) + ', ' + Math.round(c.fz) + (hover ? ', курсор ' + Math.floor(hover[0]) + ', ' + Math.floor(hover[1]) : '')
      ];
      const left = 56, top = 52;
      g.fillStyle = 'rgba(16, 35, 74, 0.72)';
      g.fillRect(left, top, 440, lines.length * 15 + 8);
      lines.forEach((text, i) => this.line(left + 6, top + 16 + i * 15, text));
      if (this.scene.sample) {
        const hour = Math.floor(this.hour), minute = Math.round((this.hour - hour) * 60), state = this.viewState, sim = this.selected, y = this.live.top - 64;
        this.line(left, y, sim.name + ', этаж ' + (sim.floor + 1) + ', ' + (sim.inside ? 'внутри' : S.Sim.STATE_NAMES[sim.state]) + (sim.note ? ', ' + sim.note : '') + (this.follow ? ', камера за: ' + (this.watch || sim).name : ''), '#bfe8ff', 'bold');
        this.line(left, y + 16, (state ? S.WALL_NAMES[state.mode] + ', этаж ' + (state.floor + 1) : 'дом целиком') + (this.autoCut ? ', автосрез' : '') + ', крыша ' + S.ROOF_NAMES[this.scene.houses[0].roof.form] + ', ' + hour + ':' + String(minute).padStart(2, '0') + '. Спрайтов: ближних ' + this.store.nearLoaded + ', половинных ' + this.store.halfLoaded, '#ffe9a0');
        this.line(left, y + 32, 'Отладка. F: вид. Y: автосрез. N: день, закат, ночь. [ ]: час. R: крыша. C: стиль. G: качество. V: экран. B: 16 или 32 бита', '#ffe9a0');
        this.line(left, y + 48, 'Щелчок: меню действий. Shift: первым в очередь. Tab: другой сим. F6: быстрое сохранение. I: убрать эти цифры', '#fff');
      } else {
        this.line(8, v.sh - 12, 'Стрелки, WASD, край окна, правая кнопка: камера. Z, X, колесо: масштаб. <, >: поворот. Home: центр. V: экран. B: 16 или 32 бита. I: цифры');
      }
    }

    drawPause(v) {
      const g = this.g;
      g.strokeStyle = '#d21f1f';
      g.lineWidth = 6;
      g.strokeRect(3, 3, v.sw - 6, v.sh - 6);
      g.lineWidth = 1;
      g.fillStyle = '#d21f1f';
      g.beginPath();
      g.arc(v.sw - 34, 34, 20, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff';
      g.fillRect(v.sw - 42, 24, 6, 20);
      g.fillRect(v.sw - 32, 24, 6, 20);
    }

    benchFrame() {
      const a = performance.now();
      this.update(1 / 60);
      this.draw();
      return performance.now() - a;
    }

    destroy() {
      if (this.dead) return;
      this.dead = true;
      if (this.store) this.store.dead = true;
      if (this.savePromise) this.savePromise.then(store => store.close(), () => {});
      this.sound.destroy();
      cancelAnimationFrame(this.raf);
      this.observer.disconnect();
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('blur', this.onBlur);
      if (this.gl) {
        this.world.removeEventListener('webglcontextlost', this.onLost);
        this.world.removeEventListener('webglcontextrestored', this.onRestored);
        const lose = this.gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
        S.live.gl--;
      }
      this.world.remove();
      this.panels.remove();
      this.over.remove();
      this.root.classList.remove('ts-root');
      S.live.uis--;
      S.live.loops--;
    }
  }

  S.UI = UI;
})(globalThis.Sims98 = globalThis.Sims98 || {});
