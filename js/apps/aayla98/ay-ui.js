(function (A) {
  'use strict';
  const GAME_KEYS = A.Input.KEYS;
  const MEMORY_STORE = new Map();
  const FALLBACK = { getItem: k => (MEMORY_STORE.has(k) ? MEMORY_STORE.get(k) : null), setItem: (k, v) => MEMORY_STORE.set(k, String(v)), removeItem: k => MEMORY_STORE.delete(k) };

  A.UI = class {
    constructor(root, opts) {
      this.opts = opts || {};
      this.root = root;
      this.isActive = this.opts.isActive || (() => !document.hidden);
      root.classList.add('ay-root');
      root.tabIndex = -1;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'ay-canvas';
      root.appendChild(this.canvas);
      this.gfx = new A.Gfx(this.canvas);
      this.frames = 0;
      this.ticks = 0;
      this.clock = 0;
      this.acc = 0;
      this.last = performance.now();
      this.paused = false;
      this.menu = null;
      this.keys = new Set();
      this.padHeld = new Set();
      this.padPrev = new Set();
      this.edges = new Set();
      this.device = 'kb';
      this.field = null;
      this.card = null;
      this.loc = null;
      this.battle = null;
      this.flight = null;
      this.overlay = null;
      this.toast = null;
      this.defeats = 0;
      this.view = new A.FieldView();
      this.settings = A.Save.loadSettings(this.store());
      this.vn = this.opts.pattern ? null : new A.VN(this);
      if (this.vn) this.applySettings();
      if (this.vn && this.opts.label && this.vn.program.labels[this.opts.label]) this.startAt(this.opts.label);
      else if (this.vn && this.opts.map) {
        this.vn.idle();
        this.enterField(this.opts.map, this.opts.entry || 'start');
      } else if (this.vn && this.opts.battle && A.GROUPS[this.opts.battle]) {
        this.vn.idle();
        this.startBattle({ group: this.opts.battle, advantage: this.opts.advantage || 'none', obj: null, dev: true });
      } else if (this.vn && this.opts.flight && A.FLIGHTS[this.opts.flight]) {
        this.vn.idle();
        this.startFlight(this.opts.flight, null, true);
      } else if (this.vn) this.showTitle();
      this.onKeyDown = e => this.keyDown(e);
      this.onKeyUp = e => this.keys.delete(e.code);
      this.onBlur = () => this.keys.clear();
      this.onPointer = e => {
        this.audio();
        this.root.focus({ preventScroll: true });
        if (e.target === this.canvas && this.vn && !this.menu && this.isActive()) {
          e.preventDefault();
          if (this.overlay) {
            const p = this.point(e);
            return this.overlay.click ? this.overlay.click(p.x, p.y) : this.overlay.key('Enter');
          }
          if (this.battle) {
            const p = this.point(e);
            return this.battle.click(p.x, p.y, e.button);
          }
          if (this.flight) {
            const p = this.point(e);
            return this.flight.click(p.x, p.y, e.button);
          }
          if (this.card) return this.cardKey('Enter');
          if (this.vn.active()) {
            const p = this.point(e);
            this.vn.click(p.x, p.y, e.button);
          }
        }
      };
      this.onMove = e => {
        if (!this.vn || this.menu) return;
        const p = this.point(e);
        if (this.overlay) { if (this.overlay.hover) this.overlay.hover(p.x, p.y); }
        else if (this.battle) this.battle.hover(p.x, p.y);
        else if (this.flight) this.flight.hover(p.x, p.y);
        else if (this.vn.active()) this.vn.hover(p.x, p.y);
      };
      this.onWheel = e => { if (this.vn && !this.menu && !this.flight && this.isActive() && (this.vn.active() || !this.field)) { e.preventDefault(); this.vn.wheel(e.deltaY); } };
      this.onContext = e => e.preventDefault();
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      window.addEventListener('blur', this.onBlur);
      root.addEventListener('pointerdown', this.onPointer);
      this.canvas.addEventListener('pointermove', this.onMove);
      this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
      this.canvas.addEventListener('contextmenu', this.onContext);
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(root);
      this.resize();
      this.loop = now => this.frame(now);
      this.raf = requestAnimationFrame(this.loop);
      A.live.uis++;
      A.live.loops++;
    }

    get state() {
      return this.vn ? this.vn.state : null;
    }

    store() {
      try { return window.localStorage || FALLBACK; } catch (e) { return FALLBACK; }
    }

    applySettings() {
      const s = this.settings;
      this.vn.cps = s.cps;
      this.vn.sound.setVolumes(s.music, s.sfx);
      if (this.inGame()) this.vn.state.difficulty = s.difficulty;
      A.Save.saveSettings(this.store(), s);
    }

    inGame() {
      return !!this.vn && !(this.overlay instanceof A.TitleScreen) && !this.titleShown;
    }

    latestSave() {
      return A.Save.latest(this.store());
    }

    say(text) {
      this.toast = { text, t: 2.2 };
    }

    showTitle() {
      this.closeMenu();
      this.field = null;
      this.battle = null;
      this.flight = null;
      this.card = null;
      this.loc = null;
      this.vn.load(A.newState());
      this.titleShown = true;
      this.under = null;
      this.overlay = new A.TitleScreen(this);
      this.edges.clear();
    }

    leaveTitle() {
      this.titleShown = false;
      this.overlay = null;
      this.edges.clear();
    }

    newGame() {
      this.leaveTitle();
      this.field = null;
      this.vn.restart();
      this.vn.state.difficulty = this.settings.difficulty;
    }

    startAt(label) {
      const S = A.newState(), chapter = label.split('_')[0];
      if (['ch1', 'ch2', 'int', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'].includes(chapter)) A.Party.preset(S, chapter);
      this.leaveTitle();
      this.field = null;
      this.vn.load(S);
      this.vn.runLabel(label);
    }

    loadGame(blob) {
      const S = JSON.parse(JSON.stringify(blob.S));
      const resume = S.resume;
      S.resume = null;
      this.leaveTitle();
      this.under = null;
      this.battle = null;
      this.flight = null;
      this.card = null;
      this.defeats = 0;
      this.field = null;
      this.vn.load(S);
      this.settings.difficulty = S.difficulty || 'normal';
      if (S.field && S.field.map && A.Maps.DEFS[S.field.map]) this.field = new A.Field(S, S.field.map, null, { x: S.field.x, y: S.field.y, dir: S.field.dir });
      if (resume) this.vn.runLabel(resume);
      else if (S.respite) this.startRespite(S.respite.id);
      else if (!this.field) this.vn.advance();
      this.say('Игра загружена');
    }

    resting() {
      return this.overlay instanceof A.RespiteScreen;
    }

    canSave() {
      return !!(this.vn && (this.field || this.resting() || this.under) && !this.battle && !this.flight && (!this.overlay || this.resting()) && !this.card && !this.vn.active());
    }

    thumb() {
      try {
        const c = document.createElement('canvas');
        c.width = 160;
        c.height = 120;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        const rest = this.resting() ? this.overlay : this.under;
        if (rest) {
          const big = document.createElement('canvas');
          big.width = A.W;
          big.height = A.H;
          rest.draw({ g: big.getContext('2d') });
          g.drawImage(big, 0, 0, 160, 120);
        } else g.drawImage(this.gfx.low, 0, 0, 160, 120);
        return c.toDataURL('image/jpeg', 0.7);
      } catch (e) { return null; }
    }

    place() {
      if (this.field) return this.field.map.def.name;
      const R = this.vn.state.respite;
      if (R) return 'Передышка: ' + ((A.Respite.place(R.id) || {}).name || '');
      const bg = this.vn.story.vn.bg, info = bg && A.Art.LIST.bg[bg];
      return info ? info.place : '';
    }

    saveTo(key, kind, name, resume) {
      const S = this.vn.state;
      S.scene = this.vn.story.snapshot();
      S.resume = resume || null;
      try {
        A.Save.write(this.store(), key, A.Save.pack(S, { place: this.place(), thumb: resume ? null : this.thumb() }, kind));
        if (name) this.say('Сохранено: ' + name);
        return true;
      } catch (e) {
        this.say('Не удалось сохранить');
        return false;
      } finally {
        S.resume = null;
      }
    }

    quickSave() {
      if (!this.canSave()) return this.say('Сейчас сохранить нельзя');
      this.saveTo(A.Save.KEYS.quick, 'quick', 'быстрое сохранение');
    }

    autosave(label) {
      this.saveTo(A.Save.KEYS.auto, 'auto', label ? null : 'автосохранение', label);
      if (label) this.say('Автосохранение');
    }

    restore() {
      this.overlay = this.under || null;
      this.under = null;
    }

    openSaves(mode, back) {
      this.overlay = new A.SaveScreen(this, { mode, back: back || (() => this.restore()) });
    }

    openMemory() {
      this.overlay = new A.MemoryScreen(this, { back: () => this.restore() });
    }

    openBonds() {
      this.overlay = new A.BondsScreen(this, { back: () => this.restore() });
    }

    openSettings(back) {
      this.overlay = new A.SettingsScreen(this, { back: back || (() => this.restore()) });
    }

    openDossier(done) {
      this.overlay = new A.DossierScreen(this, { back: () => { this.overlay = this.under || null; this.under = null; if (done) done(); } });
    }

    openShop() {
      this.overlay = new A.ShopScreen(this, { back: () => this.restore() });
    }

    dance() {
      const S = this.vn.state, f = this.field;
      S.flags['danced_' + f.map.id] = true;
      A.Party.rest(S);
      this.vn.showLines([['-', 'Эйла танцует медленный танец лекку, которому её научил Нат. Раны отряда затягиваются.']], { id: 'field.dance' });
    }

    together() {
      if (!A.Party.together(this.vn.state)) return;
      this.vn.showLines([['-', 'Эйла закрывает глаза и чувствует рядом Толма, где бы он ни был. Сила возвращается к отряду целиком.']], { id: 'field.together' });
    }

    openPalace(done) {
      this.overlay = new A.PalaceScreen(this, { done: () => { this.overlay = null; done(); } });
    }

    bondCard(id, rank, done) {
      this.overlay = new A.BondCard(this, { id, rank, done: () => { this.overlay = null; done(); } });
    }

    respiteScreen() {
      const R = this.vn.state.respite;
      this.overlay = new A.RespiteScreen(this, { id: R.id, pick: opt => this.runActivity(opt) });
    }

    startRespite(id) {
      this.field = null;
      if (this.vn.state.field) this.vn.state.field.map = null;
      A.Respite.start(this.vn.state, id);
      this.respiteScreen();
    }

    runActivity(opt) {
      const r = A.Respite.apply(this.vn.state, opt);
      this.overlay = null;
      this.vn.story.clear();
      this.vn.story.call(r.label, r.ret);
      this.vn.advance();
    }

    resumeRespite() {
      const S = this.vn.state;
      if (S.respite && S.respite.left > 0) return this.respiteScreen();
      A.Respite.finish(S);
      this.overlay = null;
      this.vn.story.clear();
      this.autosave();
      this.vn.advance();
    }

    startChapter(id, label) {
      this.field = null;
      if (this.vn.state.field) this.vn.state.field.map = null;
      this.autosave(label);
      this.overlay = new A.ChapterCard(this, { id, done: () => { this.overlay = null; this.vn.advance(); } });
    }

    held() {
      if (!this.padHeld.size) return this.keys;
      return new Set([...this.keys, ...this.padHeld]);
    }

    point(e) {
      const r = this.canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * A.W / (r.width || A.W), y: (e.clientY - r.top) * A.H / (r.height || A.H) };
    }

    resize() {
      const r = this.root.getBoundingClientRect();
      this.screen = A.fit(r.width || A.W, r.height || A.H);
      const s = this.canvas.style;
      s.left = this.screen.x + 'px';
      s.top = this.screen.y + 'px';
      s.width = this.screen.width + 'px';
      s.height = this.screen.height + 'px';
    }

    enterField(id, at) {
      if (!this.field) this.field = new A.Field(this.vn.state, id, at);
      else this.field.load(id, at);
      this.edges.clear();
    }

    frame(now) {
      if (this.dead) return;
      this.raf = requestAnimationFrame(this.loop);
      const dt = Math.min(0.25, Math.max(0, (now - this.last) / 1000));
      this.last = now;
      const active = this.isActive() && !document.hidden;
      this.paused = !active || !!this.menu;
      if (active) this.pollPad();
      if (this.paused) this.acc = 0;
      else {
        this.acc += dt;
        while (this.acc >= A.STEP) {
          this.update(A.STEP);
          this.acc -= A.STEP;
        }
      }
      this.draw(!active);
      this.frames++;
    }

    pollPad() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = [...(pads || [])].find(p => p && p.connected);
      const now = A.Input.pad(gp);
      this.padHeld = new Set([...now].map(n => A.Input.TO_KEY[n]));
      for (const n of now) {
        if (this.padPrev.has(n)) continue;
        this.device = 'pad';
        this.audio();
        if (n === 'b' && !this.menu && !(this.vn && this.vn.backlog) && !(this.battle && this.battle.wantsBack())) continue;
        this.press(A.Input.TO_KEY[n]);
      }
      this.padPrev = now;
    }

    fieldInput() {
      const h = this.held(), e = this.edges;
      const on = (...codes) => codes.some(c => h.has(c));
      const inp = {
        dx: (on('ArrowRight', 'KeyD') ? 1 : 0) - (on('ArrowLeft', 'KeyA') ? 1 : 0),
        dy: (on('ArrowDown', 'KeyS') ? 1 : 0) - (on('ArrowUp', 'KeyW') ? 1 : 0),
        sneak: on('ShiftLeft', 'ShiftRight'),
        interact: e.has('Enter') || e.has('Space'),
        sense: e.has('KeyQ'),
        push: e.has('KeyZ'),
        pull: e.has('KeyX')
      };
      e.clear();
      return inp;
    }

    update(dt) {
      this.ticks++;
      this.clock += dt;
      if (!this.vn) return;
      this.vn.state.time += dt;
      if (this.loc) {
        this.loc.t -= dt;
        if (this.loc.t <= 0) this.loc = null;
      }
      if (this.toast) {
        this.toast.t -= dt;
        if (this.toast.t <= 0) this.toast = null;
      }
      if (this.overlay) {
        this.overlay.update(dt);
        this.edges.clear();
      } else if (this.battle) {
        this.battle.update(dt);
        this.edges.clear();
      } else if (this.flight) {
        this.flight.update(dt);
        this.edges.clear();
      } else if (this.field && !this.vn.active() && !this.card) {
        if (this.vn.state.cover && this.field.coverActive()) {
          const S = this.vn.state, r = A.Cover.tick(S, dt);
          if (r) {
            this.say('Подозрение +' + r.add + ': ' + A.Cover.why(S, r.why));
            if (r.exposed) this.vn.runLabel(A.Cover.def(S).exposed);
          }
        }
        this.field.step(dt, this.fieldInput());
        this.view.t += dt;
        for (const ev of this.field.take()) this.onFieldEvent(ev);
      } else this.edges.clear();
      this.vn.update(dt);
      this.vn.sound.music(this.musicWanted());
      this.vn.sound.updateMusic();
    }

    musicWanted() {
      if (this.overlay && this.overlay.music !== undefined) return this.overlay.music;
      if (this.battle) return 'battle';
      if (this.flight) return 'flight';
      const own = this.vn.story.vn.music;
      if (this.vn.active() || !this.field) return own;
      return this.field.map.def.music || own;
    }

    onFieldEvent(ev) {
      const f = this.field;
      switch (ev.type) {
        case 'enter':
          this.loc = { name: ev.name, t: 2.5 };
          break;
        case 'lines':
          this.vn.showLines(ev.lines, { name: ev.name, id: `field.${f.map.id}.${ev.obj}` });
          break;
        case 'meditate': {
          const S = this.vn.state, lines = [['-', 'Эйла медитирует на ходу. Мысли выстраиваются по порядку.']];
          if (S.party.length) {
            A.Party.rest(S);
            lines.push(['-', 'Раны затянулись, Сила вернулась.']);
          }
          if (ev.first) lines.push(['-', 'Здесь можно перевести дух. Тьма отступает, если она была.']);
          this.autosave();
          lines.push(['-', 'Игра сохранена в автоячейку.']);
          this.vn.showLines(lines, { id: `field.${f.map.id}.meditate` });
          break;
        }
        case 'rest': {
          const S = this.vn.state;
          A.Party.rest(S);
          this.vn.showLines([['-', 'Эйла переводит дух в укрытии. Раны затягиваются, Сила возвращается.']], { id: `field.${f.map.id}.rest` });
          break;
        }
        case 'cover': {
          const S = this.vn.state, r = A.Cover.add(S, ev.add, ev.why);
          if (!r) break;
          this.say((ev.add > 0 ? 'Подозрение +' : 'Подозрение ') + ev.add + ': ' + A.Cover.why(S, ev.why));
          if (r.exposed) this.vn.runLabel(A.Cover.def(S).exposed);
          break;
        }
        case 'repair':
          this.overlay = new A.RepairScreen(this, {
            id: ev.puzzle, name: ev.name,
            done: ok => {
              this.overlay = null;
              this.edges.clear();
              if (ok && this.field) this.field.fixed(ev.obj);
            }
          });
          break;
        case 'storm':
          if (ev.phase === 'warn') this.say('Идёт тепловая буря! Скорее в укрытие.');
          if (ev.phase === 'blow') this.vn.sound.sfx('rocks');
          break;
        case 'exit':
          f.load(ev.to, ev.at);
          break;
        case 'end':
          this.vn.showLines(ev.lines, { id: `field.${f.map.id}.${ev.obj}` }, () => { this.card = { kind: 'end' }; });
          break;
        case 'encounter':
          this.startBattle(ev);
          break;
        case 'scene':
          if (ev.autosave) this.autosave(ev.label);
          this.vn.runLabel(ev.label);
          break;
      }
    }

    resumeField() {
      if (this.field) this.field.refresh();
      this.edges.clear();
    }

    scriptBattle(group, advantage) {
      this.startBattle({ group, advantage: advantage || 'none', obj: null, script: true });
    }

    startFlight(id, label, dev, help) {
      const S = this.vn.state;
      if (label) this.autosave(label);
      S.flags.flights = (S.flags.flights || 0) + 1;
      const flight = new A.Flight({ id, seed: 104729 * S.flags.flights + Math.round(S.time * 10), difficulty: S.difficulty, help });
      this.flight = new A.FlightView(this, { flight, defeats: this.defeats, onEnd: r => this.endFlight(id, dev, r) });
      this.edges.clear();
    }

    endFlight(id, dev, r) {
      this.flight = null;
      if (r.over === 'lose') {
        this.defeats++;
        return this.startFlight(id, null, dev, r.help);
      }
      this.defeats = 0;
      if (dev) return this.startFlight(id, null, true);
      this.vn.advance();
    }

    startForget() {
      const r = A.Party.forget(this.vn.state);
      this.overlay = new A.ForgetScreen(this, { lost: r.lost, level: r.level, done: () => { this.overlay = null; this.vn.advance(); } });
    }

    startCredits() {
      this.field = null;
      if (this.vn.state.field) this.vn.state.field.map = null;
      this.overlay = new A.CreditsScreen(this, { ending: this.vn.state.flags.ending, done: () => { this.overlay = null; this.showTitle(); } });
    }

    storyEnd() {
      A.Party.ensure(this.vn.state);
      this.card = { kind: 'end', chapter: this.vn.state.chapter };
    }

    startBattle(ev, help) {
      const S = this.vn.state;
      A.Party.ensure(S);
      S.flags.fights = (S.flags.fights || 0) + 1;
      const battle = new A.Battle({ S, group: ev.group, advantage: ev.advantage, seed: 7919 * S.flags.fights + Math.round(S.time * 10), help, retry: this.defeats, noFlee: !!ev.script });
      this.battle = new A.BattleView(this, { battle, encounter: ev, defeats: this.defeats, onEnd: r => this.endBattle(ev, r) });
      this.edges.clear();
    }

    endBattle(ev, r) {
      this.battle = null;
      if (r.over === 'lose') {
        this.defeats++;
        return this.startBattle(ev, r.help);
      }
      this.defeats = 0;
      if (ev.script) return this.vn.advance();
      if (ev.dev || !this.field) {
        A.Party.rest(this.vn.state);
        return this.startBattle(ev);
      }
      if (r.over === 'win') this.field.resolve(ev.obj, 'won');
      else this.field.release(ev.obj);
    }

    cardKey(code) {
      const c = this.card;
      if (!c || (code !== 'Enter' && code !== 'Space')) return;
      this.card = null;
      if (c.kind === 'end') this.showTitle();
    }

    draw(away) {
      if (!this.vn) return this.gfx.pattern(this.clock, away);
      const g = this.gfx.g;
      if (this.overlay) this.overlay.draw(this.gfx);
      else if (this.battle) this.battle.draw(this.gfx);
      else if (this.flight) this.flight.draw(this.gfx);
      else if (this.field) {
        this.view.draw(this.gfx.lg, this.field);
        this.gfx.present();
        if (!this.vn.active()) this.hud(g);
      }
      if (!this.overlay && ((!this.battle && !this.flight) || this.vn.active())) this.vn.draw(g);
      if (this.card) this.drawCard(g);
      if (this.toast) {
        const F = A.Font, K = A.UIKit, w = F.measure('bold', this.toast.text) + 32;
        K.bevel(g, Math.round(320 - w / 2), 44, w, 24, 'rgba(20,14,32,0.92)', '#8a9a60', '#2a3018');
        F.draw(g, 'bold', this.toast.text, Math.round(320 - F.measure('bold', this.toast.text) / 2), 48, '#e8f0c8', K.SHADOW);
      }
      if (away) {
        g.fillStyle = 'rgba(0,0,0,0.5)';
        g.fillRect(0, 0, A.W, A.H);
        A.Font.draw(g, 'bold', 'Пауза', A.W / 2 - A.Font.measure('bold', 'Пауза') / 2, A.H / 2 - 8, '#ffffff', '#000000');
      }
    }

    hud(g) {
      const F = A.Font, K = A.UIKit, f = this.field, L = id => A.Input.label(id, this.device);
      if (this.loc) {
        const w = F.measure('bold', this.loc.name) + 32, right = f.map.def.hud === 'cover' ? A.W - 204 : A.W - 12;
        const x = Math.max(12, Math.min(Math.round(320 - w / 2), right - w));
        K.bevel(g, x, 14, w, 24, 'rgba(20,14,32,0.9)', '#d8b884', '#4a3020');
        F.draw(g, 'bold', this.loc.name, x + 16, 18, K.GOLD, K.SHADOW);
      }
      const S = this.vn.state;
      if (f.map.def.hud === 'day' && !S.flags.escape && S.flags.day) {
        const left = Math.max(0, 2 - (S.flags.acts || 0)), words = ['вечер', 'одно дело', 'два дела'];
        const t = `День ${S.flags.day} · до вечера: ${words[left]}`;
        const w = F.measure('text', t) + 20;
        K.bevel(g, A.W - 12 - w, 12, w, 22, 'rgba(20,14,32,0.85)', '#8a7a60', '#2a2018');
        F.draw(g, 'text', t, A.W - 2 - w, 15, K.INK, K.SHADOW);
      }
      if (f.map.def.hud === 'cover' && S.cover) {
        const d = A.Cover.def(S), sus = S.cover.sus, x = A.W - 196, y = 12;
        K.bevel(g, x, y, 184, 40, 'rgba(24,14,14,0.88)', '#9a7a5a', '#2a1810');
        g.fillStyle = '#e8d8b8';
        g.beginPath();
        g.ellipse(x + 22, y + 20, 14, 9, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = sus >= 70 ? '#d83a2a' : sus >= 40 ? '#d8902a' : '#4a7a4a';
        g.beginPath();
        g.arc(x + 22, y + 20, 7, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(10,6,6,0.75)';
        g.fillRect(x + 8, y + 11, 28, Math.round(18 * (1 - sus / 100)));
        F.draw(g, 'text', 'Подозрение ' + Math.round(sus), x + 44, y + 4, sus >= 70 ? '#ffb0a0' : K.INK, K.SHADOW);
        F.draw(g, 'text', `Сведения: ${A.Cover.got(S)} из ${d.intel.length}`, x + 44, y + 20, '#c8e0a0', K.SHADOW);
      }
      if (f.map.def.timer && f.timer !== null) {
        const t = `${f.map.def.timer.label || 'Пожар'}: ${Math.ceil(f.timer)} с`, w = F.measure('bold', t) + 20;
        K.bevel(g, A.W - 12 - w, 12, w, 22, 'rgba(48,14,6,0.9)', '#e0703a', '#4a1606');
        F.draw(g, 'bold', t, A.W - 2 - w, 15, f.timer < 20 ? '#ffb090' : '#ffe0b0', K.SHADOW);
      }
      if (f.map.def.hud === 'clear') {
        const n = f.enemiesLeft(), t = n ? `Стражей на посту: ${n}` : 'Пост взят';
        const w = F.measure('text', t) + 20;
        K.bevel(g, A.W - 12 - w, 12, w, 22, 'rgba(32,12,14,0.88)', '#9a5a4a', '#2a1210');
        F.draw(g, 'text', t, A.W - 2 - w, 15, n ? '#ffc8b0' : '#c8f0b0', K.SHADOW);
      }
      if (f.storm && f.storm.phase !== 'calm') {
        const a = S.party.find(m => m.id === 'aayla'), safe = f.sheltered();
        const t = f.storm.phase === 'warn' ? 'Буря близко: в укрытие!' : safe ? 'Укрытие держит' : `Буря! Здоровье Эйлы ${a ? a.hp : 0}`;
        const w = F.measure('bold', t) + 20;
        K.bevel(g, A.W - 12 - w, 12, w, 22, 'rgba(40,14,8,0.9)', '#d8784a', '#4a1a08');
        F.draw(g, 'bold', t, A.W - 2 - w, 15, safe ? '#f8e0b0' : '#ffb080', K.SHADOW);
      }
      if (!f.can('sense')) return this.prompts(g, f);
      const cx = 30, cy = 452, r = 14;
      g.fillStyle = 'rgba(10,8,20,0.75)';
      g.beginPath();
      g.arc(cx, cy, r + 3, 0, Math.PI * 2);
      g.fill();
      const ready = f.senseCool <= 0;
      g.strokeStyle = ready ? '#8ad8ff' : '#4a6a7a';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - f.senseCool / A.FIELD.SENSE.cool));
      g.stroke();
      F.draw(g, 'bold', L('sense'), cx - F.measure('bold', L('sense')) / 2, cy - 7, ready ? '#e8f8ff' : '#7a8a9a', K.SHADOW);
      F.draw(g, 'text', 'Чутьё', cx + 22, cy - 7, ready ? '#c8e8f8' : '#7a8a9a', K.SHADOW);
      this.prompts(g, f);
    }

    prompts(g, f) {
      const F = A.Font, K = A.UIKit, L = id => A.Input.label(id, this.device);
      if (f.p.sneak) F.draw(g, 'text', 'Эйла крадётся', 96, 445, '#c8c0a0', K.SHADOW);
      const pr = f.prompt(), parts = [];
      if (pr.verb) parts.push(`${L('ok')}: ${pr.verb}`);
      if (pr.push) parts.push(`${L('push')}: Толчок`);
      if (pr.pull) parts.push(`${L('pull')}: Притяжение`);
      if (parts.length) {
        const text = parts.join('    '), w = F.measure('text', text) + 28;
        K.bevel(g, Math.round(320 - w / 2), 432, w, 24, 'rgba(20,14,32,0.88)', '#8a7a60', '#2a2018');
        F.draw(g, 'text', text, Math.round(320 - F.measure('text', text) / 2), 436, K.INK, K.SHADOW);
      }
    }

    drawCard(g) {
      const F = A.Font, K = A.UIKit, c = this.card, ch = A.CHAPTERS[c.chapter] || A.CHAPTERS.ch1;
      const lines = [ch.done, ch.after, `${ch.next} появится на этапе ${ch.stage}.`, `${A.Input.label('ok', this.device)}: в главное меню`];
      const w = Math.max(...lines.map(l => F.measure('text', l))) + 60, h = 30 + lines.length * 20;
      const x = Math.round(320 - w / 2), y = Math.round(200 - h / 2);
      K.bevel(g, x, y, w, h, 'rgba(20,14,32,0.96)', '#d8b884', '#4a3020');
      lines.forEach((l, i) => F.draw(g, i ? 'text' : 'bold', l, Math.round(320 - F.measure(i ? 'text' : 'bold', l) / 2), y + 14 + i * 20, i ? K.INK : K.GOLD, K.SHADOW));
    }

    audio() {
      if (this.ac || this.dead) return this.ac;
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      this.ac = new C();
      A.live.audio++;
      return this.ac;
    }

    keyDown(e) {
      if (this.dead || !this.isActive() || !GAME_KEYS.has(e.code)) return;
      e.preventDefault();
      this.device = 'kb';
      this.audio();
      this.keys.add(e.code);
      if (e.repeat && !['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) return;
      this.press(e.code);
    }

    press(code) {
      if (!code) return;
      if (this.menu) return this.menuKey(code);
      if (code === 'F5') return this.overlay || this.battle || this.flight ? undefined : this.quickSave();
      if (this.card) return this.cardKey(code);
      if (this.overlay && this.overlay.key(code)) return;
      if (this.battle && this.battle.key(code)) return;
      if (this.flight && this.flight.key(code)) return;
      if (this.vn && this.vn.key(code)) return;
      if (code === 'Escape') return this.openMenu();
      if (this.field) this.edges.add(code);
    }

    openMenu() {
      if (this.resting()) { this.under = this.overlay; this.overlay = null; }
      const items = [{ label: 'Продолжить', act: () => { this.closeMenu(); this.restore(); } }];
      if (this.canSave()) items.push({ label: 'Сохранить', act: () => { this.closeMenu(); this.openSaves('save'); } });
      items.push({ label: 'Загрузить', act: () => { this.closeMenu(); this.openSaves('load'); } });
      items.push({ label: 'Отряд', act: () => { this.closeMenu(); this.overlay = new A.PartyScreen(this, { back: () => this.restore() }); } });
      items.push({ label: 'Связи', act: () => { this.closeMenu(); this.openBonds(); } });
      const S0 = this.vn.state;
      if (S0.cover) items.push({ label: 'Досье', act: () => { this.closeMenu(); this.openDossier(); } });
      if (A.Bonds.has(S0, 'villie', 2) && !this.battle && !this.flight) items.push({ label: 'Лавка Вилли', act: () => { this.closeMenu(); this.openShop(); } });
      if (A.Bonds.has(S0, 'secura', 1) && this.field && !this.battle && !this.flight && !S0.flags['danced_' + this.field.map.id] && !S0.cover) items.push({ label: 'Танец лекку', act: () => { this.closeMenu(); this.restore(); this.dance(); } });
      if (A.Bonds.has(S0, 'tholme', 5) && this.field && !this.battle && !this.flight && !S0.flags['together_' + S0.chapter]) items.push({ label: 'Медитация вдвоём', act: () => { this.closeMenu(); this.restore(); this.together(); } });
      items.push({ label: 'Память', act: () => { this.closeMenu(); this.openMemory(); } });
      items.push({ label: 'Настройки', act: () => { this.closeMenu(); this.openSettings(); } });
      items.push({ label: 'Главное меню', act: () => this.showTitle() });
      if (this.opts.onExit) items.push({ label: 'Выход', act: () => this.opts.onExit() });
      const box = document.createElement('div');
      box.className = 'ay-menu';
      const title = document.createElement('div');
      title.className = 'ay-menu-title';
      title.textContent = 'Пауза';
      box.appendChild(title);
      this.menuItems = items.map((it, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ay-btn';
        b.textContent = it.label;
        b.addEventListener('click', () => it.act());
        b.addEventListener('mouseenter', () => this.pick(i));
        box.appendChild(b);
        return b;
      });
      this.menuActs = items.map(it => it.act);
      this.root.appendChild(box);
      this.menu = box;
      this.pick(0);
    }

    pick(i) {
      this.menuIndex = (i + this.menuItems.length) % this.menuItems.length;
      this.menuItems.forEach((b, j) => b.classList.toggle('ay-on', j === this.menuIndex));
    }

    menuKey(code) {
      if (code === 'Escape') { this.closeMenu(); this.restore(); }
      else if (code === 'ArrowUp' || code === 'KeyW') this.pick(this.menuIndex - 1);
      else if (code === 'ArrowDown' || code === 'KeyS') this.pick(this.menuIndex + 1);
      else if (code === 'Enter' || code === 'Space') this.menuActs[this.menuIndex]();
    }

    closeMenu() {
      if (!this.menu) return;
      this.menu.remove();
      this.menu = null;
      this.root.focus({ preventScroll: true });
    }

    destroy() {
      if (this.dead) return;
      this.dead = true;
      cancelAnimationFrame(this.raf);
      A.live.loops--;
      A.live.uis--;
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('blur', this.onBlur);
      this.root.removeEventListener('pointerdown', this.onPointer);
      this.canvas.removeEventListener('pointermove', this.onMove);
      this.canvas.removeEventListener('wheel', this.onWheel);
      this.canvas.removeEventListener('contextmenu', this.onContext);
      this.observer.disconnect();
      if (this.ac) {
        this.ac.close();
        this.ac = null;
        A.live.audio--;
      }
      this.gfx.destroy();
      this.root.innerHTML = '';
      this.root.classList.remove('ay-root');
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
