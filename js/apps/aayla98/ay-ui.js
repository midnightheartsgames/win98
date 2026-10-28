(function (A) {
  'use strict';
  const GAME_KEYS = A.Input.KEYS;

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
      this.overlay = null;
      this.defeats = 0;
      this.view = new A.FieldView();
      this.vn = this.opts.pattern ? null : new A.VN(this);
      if (this.vn && this.opts.map) {
        this.vn.idle();
        this.enterField(this.opts.map, this.opts.entry || 'start');
      }
      if (this.vn && this.opts.battle && A.GROUPS[this.opts.battle]) {
        this.vn.idle();
        this.startBattle({ group: this.opts.battle, advantage: this.opts.advantage || 'none', obj: null, dev: true });
      }
      this.onKeyDown = e => this.keyDown(e);
      this.onKeyUp = e => this.keys.delete(e.code);
      this.onBlur = () => this.keys.clear();
      this.onPointer = e => {
        this.audio();
        this.root.focus({ preventScroll: true });
        if (e.target === this.canvas && this.vn && !this.menu && this.isActive()) {
          e.preventDefault();
          if (this.overlay) return this.overlay.key('Enter');
          if (this.battle) {
            const p = this.point(e);
            return this.battle.click(p.x, p.y, e.button);
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
        if (this.battle) this.battle.hover(p.x, p.y);
        else if (this.vn.active()) this.vn.hover(p.x, p.y);
      };
      this.onWheel = e => { if (this.vn && !this.menu && this.isActive() && (this.vn.active() || !this.field)) { e.preventDefault(); this.vn.wheel(e.deltaY); } };
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
      if (this.overlay) {
        this.overlay.update(dt);
        this.edges.clear();
      } else if (this.battle) {
        this.battle.update(dt);
        this.edges.clear();
      } else if (this.field && !this.vn.active() && !this.card) {
        this.field.step(dt, this.fieldInput());
        this.view.t += dt;
        for (const ev of this.field.take()) this.onFieldEvent(ev);
      } else this.edges.clear();
      this.vn.update(dt);
      this.vn.sound.music(this.musicWanted());
      this.vn.sound.updateMusic();
    }

    musicWanted() {
      if (this.overlay) return 'aayla';
      if (this.battle) return 'battle';
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
          lines.push(['-', 'Игра сохранена в автоячейку (заглушка до этапа 6).']);
          try { localStorage.setItem('aayla98_auto', JSON.stringify({ stub: true, version: A.SAVE_VERSION, field: S.field, party: S.party, items: S.items, dark: S.dark, at: Date.now() })); } catch (e) { }
          this.vn.showLines(lines, { id: `field.${f.map.id}.meditate` });
          break;
        }
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

    startForget() {
      const r = A.Party.forget(this.vn.state);
      this.overlay = new A.ForgetScreen(this, { lost: r.lost, level: r.level, done: () => { this.overlay = null; this.vn.advance(); } });
    }

    storyEnd() {
      this.card = { kind: 'end' };
    }

    startBattle(ev, help) {
      const S = this.vn.state;
      A.Party.ensure(S);
      S.flags.fights = (S.flags.fights || 0) + 1;
      const battle = new A.Battle({ S, group: ev.group, advantage: ev.advantage, seed: 7919 * S.flags.fights + Math.round(S.time * 10), help, noFlee: !!ev.script });
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
      if (c.kind === 'end') {
        this.field = null;
        this.vn.restart();
      }
      this.card = null;
    }

    draw(away) {
      if (!this.vn) return this.gfx.pattern(this.clock, away);
      const g = this.gfx.g;
      if (this.overlay) this.overlay.draw(this.gfx);
      else if (this.battle) this.battle.draw(this.gfx);
      else if (this.field) {
        this.view.draw(this.gfx.lg, this.field);
        this.gfx.present();
        if (!this.vn.active()) this.hud(g);
      }
      if ((!this.battle && !this.overlay) || this.vn.active()) this.vn.draw(g);
      if (this.card) this.drawCard(g);
      if (away) {
        g.fillStyle = 'rgba(0,0,0,0.5)';
        g.fillRect(0, 0, A.W, A.H);
        A.Font.draw(g, 'bold', 'Пауза', A.W / 2 - A.Font.measure('bold', 'Пауза') / 2, A.H / 2 - 8, '#ffffff', '#000000');
      }
    }

    hud(g) {
      const F = A.Font, K = A.UIKit, f = this.field, L = id => A.Input.label(id, this.device);
      if (this.loc) {
        const w = F.measure('bold', this.loc.name) + 32;
        K.bevel(g, Math.round(320 - w / 2), 14, w, 24, 'rgba(20,14,32,0.9)', '#d8b884', '#4a3020');
        F.draw(g, 'bold', this.loc.name, Math.round(320 - F.measure('bold', this.loc.name) / 2), 18, K.GOLD, K.SHADOW);
      }
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
      const F = A.Font, K = A.UIKit, c = this.card;
      const lines = ['Пролог «Глиттерилл» пройден', 'Эйла не помнит, кто она.', 'Глава 1 «Сумерки» появится на этапе 6.', `${A.Input.label('ok', this.device)}: начать сначала`];
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
      if (this.card) return this.cardKey(code);
      if (this.overlay && this.overlay.key(code)) return;
      if (this.battle && this.battle.key(code)) return;
      if (this.vn && this.vn.key(code)) return;
      if (code === 'Escape') return this.openMenu();
      if (this.field) this.edges.add(code);
    }

    openMenu() {
      const items = [{ label: 'Продолжить', act: () => this.closeMenu() }];
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
      if (code === 'Escape') this.closeMenu();
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
