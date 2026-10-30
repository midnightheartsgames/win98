(function (H) {
  'use strict';
  const SPEEDS = [1, 2, 4];
  const SETTINGS_KEY = 'heroes98_settings';
  const SETTINGS = { music: 0.6, sound: 0.8, heroSpeed: 1, battleSpeed: 1, showAI: true, autosave: true, confirm: true };
  const loadSettings = () => {
    try {
      return Object.assign({}, SETTINGS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
    } catch (e) {
      return Object.assign({}, SETTINGS);
    }
  };
  const DEBUG_KEYS = ['F7', 'F8'];

  class UI {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      this.isActive = this.opts.isActive || (() => !document.hidden);
      this.dead = false;
      this.frames = 0;
      this.ticks = 0;
      this.time = 0;
      this.last = 0;
      this.menu = null;
      this.actx = null;
      this.sound = null;
      this.settings = loadSettings();
      this.speed = this.settings.battleSpeed;
      this.game = null;
      this.notes = [];
      root.classList.add('he-root');
      this.gfx = new H.Gfx(root);
      this.view = new H.TitleView(this);
      this.keys = new Set();
      this.onKeyUp = e => this.keys.delete(e.code);
      this.onKeyDown = e => {
        this.keys.add(e.code);
        if (this.dead || !this.isActive()) return;
        if (e.code === 'F5' || e.code === 'F6' || DEBUG_KEYS.includes(e.code)) {
          e.preventDefault();
          if (!this.paused && !e.repeat) this.functionKey(e.code);
          return;
        }
        if (e.code === 'Escape') {
          e.preventDefault();
          if (this.menu) this.closeMenu();
          else if (!this.view.back || !this.view.back()) this.openMenu();
          return;
        }
        if (this.paused || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
        if (/^(Key[A-Z]|Digit\d|Arrow(Up|Down|Left|Right)|Space|Enter)$/.test(e.code)) {
          if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
          this.view.key(e.code);
        }
      };
      this.onPointer = e => {
        if (this.dead) return;
        if (e.type === 'pointerdown') this.audio();
        if (this.paused) return;
        const r = this.gfx.canvas.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const x = (e.clientX - r.left) * H.W / r.width, y = (e.clientY - r.top) * H.H / r.height;
        this.view.pointer(e.type === 'pointerdown' ? 'down' : e.type === 'pointerup' ? 'up' : 'move', x, y, e.button);
      };
      this.onContext = e => e.preventDefault();
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      for (const t of ['pointerdown', 'pointerup', 'pointermove']) this.gfx.canvas.addEventListener(t, this.onPointer);
      this.gfx.canvas.addEventListener('contextmenu', this.onContext);
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(root);
      this.resize();
      this.loop = now => {
        if (this.dead) return;
        this.raf = requestAnimationFrame(this.loop);
        const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
        this.last = now;
        if (!this.paused) {
          this.time += dt;
          this.ticks++;
          this.view.update(dt);
        }
        this.frames++;
        this.view.draw(this.gfx);
        this.drawNotes(dt);
        this.syncAudio();
      };
      this.raf = requestAnimationFrame(this.loop);
      H.live.uis++;
      H.live.loops++;
    }

    get paused() {
      return !!this.menu || document.hidden || !this.isActive();
    }

    resize() {
      const r = this.root.getBoundingClientRect();
      this.screen = H.fit(r.width, r.height);
      this.gfx.place(this.screen);
    }

    audio() {
      if (!this.actx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        this.actx = new C();
        H.live.audio++;
        this.sound = new H.Sound(this.actx, this.settings);
        if (this.wantTheme) this.sound.play(this.wantTheme);
      }
      if (this.actx.state === 'suspended' && !this.hiddenNow) this.actx.resume();
      return this.actx;
    }

    syncAudio() {
      if (!this.actx) return;
      const hidden = document.hidden || !this.isActive();
      if (hidden === this.hiddenNow) return;
      this.hiddenNow = hidden;
      if (hidden) this.actx.suspend();
      else this.actx.resume();
    }

    music(id) {
      this.wantTheme = id;
      if (this.sound) this.sound.play(id);
    }

    sfx(name, arg) {
      if (this.sound) this.sound[name](arg);
    }

    show(view) {
      this.view = view;
      this.gfx.cursor('arrow');
      if (view.theme) this.music(view.theme);
    }

    note(text, color) {
      this.notes.push({ text, color: color || '#ffe080', t: 0 });
      if (this.notes.length > 3) this.notes.shift();
    }

    drawNotes(dt) {
      for (const n of this.notes) n.t += dt;
      this.notes = this.notes.filter(n => n.t < 2.6);
      this.notes.forEach((n, i) => this.gfx.text(n.text, H.W / 2, 450 - i * 16, { align: 'center', bold: true, color: n.color }));
    }

    saveSettings() {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      } catch (e) {
        this.note('Настройки не сохранились', '#ff9080');
      }
      this.speed = this.settings.battleSpeed;
      if (this.sound) this.sound.setVolumes(this.settings);
    }

    startTrial(index, seed) {
      this.game = null;
      this.show(new H.BattleView(this, Object.assign({}, H.TRIALS[index], { trial: index, seed: seed == null ? index + 1 : seed })));
    }

    startMap() {
      this.game = new H.MapView(this, H.Maps.trial());
      this.show(this.game);
    }

    startGame(def) {
      this.game = new H.MapView(this, def);
      this.show(this.game);
      this.game.beginTurn(false);
    }

    resume(S) {
      this.game = new H.MapView(this, { S });
      this.show(this.game);
      this.game.resume();
    }

    canSave() {
      return !!this.game && !this.game.finished && !(this.game.ai && this.view === this.game);
    }

    saveTo(id) {
      if (!this.canSave()) return Promise.resolve(false);
      return H.Save.write(id, this.game.S, this.game.thumb()).then(() => true, () => {
        this.note('Не удалось сохранить', '#ff9080');
        return false;
      });
    }

    loadFrom(id) {
      return H.Save.read(id).then(S => {
        if (!S) {
          this.note('Ячейка пуста', '#ff9080');
          return false;
        }
        this.resume(S);
        return true;
      }, () => {
        this.note('Сохранение повреждено', '#ff9080');
        return false;
      });
    }

    autosave(map) {
      if (this.settings.autosave && this.game === map) this.saveTo(H.Save.autoSlot(map.S));
    }

    functionKey(code) {
      if (code === 'F5') {
        this.saveTo('q').then(ok => this.note(ok ? 'Быстрое сохранение' : 'Сейчас сохранить нельзя', ok ? '#ffe080' : '#ff9080'));
      } else if (code === 'F6') this.loadFrom('q');
      else if (this.game) {
        const S = this.game.S, me = S.players[this.game.pid];
        S.debug = true;
        if (code === 'F7') {
          for (const k of Object.keys(me.res)) me.res[k] += k === 'gold' ? 50000 : 100;
          for (const l of me.seen) l.fill(1);
          S.ver++;
          this.note('F7: ресурсы и вся карта');
        } else if (this.view instanceof H.BattleView) this.view.winNow();
      }
    }

    toTitle() {
      this.game = null;
      this.closeMenu();
      this.show(new H.TitleView(this));
    }

    showTrials() {
      this.game = null;
      this.show(new H.TrialMenu(this));
    }

    cycleSpeed() {
      this.settings.battleSpeed = SPEEDS[(SPEEDS.indexOf(this.settings.battleSpeed) + 1) % SPEEDS.length];
      this.saveSettings();
    }

    openMenu() {
      if (this.menu) return;
      const m = document.createElement('div');
      m.className = 'he-menu';
      const box = document.createElement('div');
      box.className = 'he-menu-box';
      const title = document.createElement('div');
      title.className = 'he-menu-title';
      title.textContent = H.TITLE;
      box.appendChild(title);
      const back = this.view, items = [{ label: 'Продолжить', act: () => this.closeMenu() }];
      if (this.game) {
        items.push({ label: 'Сохранить', act: () => { this.closeMenu(); this.show(new H.SaveView(this, back, 'save')); } });
        items.push({ label: 'Загрузить', act: () => { this.closeMenu(); this.show(new H.SaveView(this, back, 'load')); } });
      }
      items.push({ label: 'Настройки', act: () => { this.closeMenu(); this.show(new H.SettingsView(this, back)); } });
      items.push({ label: 'Главное меню', act: () => this.toTitle() });
      if (this.opts.onExit) items.push({ label: 'Выйти', act: () => this.opts.onExit() });
      for (const it of items) {
        const b = document.createElement('button');
        b.className = 'he-btn';
        b.textContent = typeof it.label === 'function' ? it.label() : it.label;
        b.addEventListener('click', () => it.act(b));
        box.appendChild(b);
      }
      m.appendChild(box);
      this.root.appendChild(m);
      this.menu = m;
    }

    closeMenu() {
      if (!this.menu) return;
      this.menu.remove();
      this.menu = null;
    }

    destroy() {
      if (this.dead) return;
      this.dead = true;
      cancelAnimationFrame(this.raf);
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      for (const t of ['pointerdown', 'pointerup', 'pointermove']) this.gfx.canvas.removeEventListener(t, this.onPointer);
      this.gfx.canvas.removeEventListener('contextmenu', this.onContext);
      this.observer.disconnect();
      this.closeMenu();
      if (this.sound) {
        this.sound.destroy();
        this.sound = null;
      }
      if (this.actx) {
        this.actx.close();
        this.actx = null;
        H.live.audio--;
      }
      this.gfx.destroy();
      this.root.classList.remove('he-root');
      H.live.loops--;
      H.live.uis--;
    }
  }

  H.UI = UI;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
