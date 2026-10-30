(function (T) {
  'use strict';
  const GAME_KEYS = /^(Key|Digit|Space|Tab|Arrow|Shift|Control|Comma|Period|Escape|Enter)/;
  const MOUSE_SENS = 0.0022;
  const KEY_TURN = 1.9;
  const LABEL_RANGE = 45;
  const MAX_STEPS = 8;
  const HEAR_RANGE = 70;
  const NOISE_GAP = 0.06;
  const MAX_TRACERS = 64;
  const NAME_RANGE = 30;
  const BEAM_LIFE = 0.07;
  const BOOM_LIFE = 0.3;
  const NUMBER_LIFE = 0.9;
  const SWING_LIFE = 0.3;
  const FLAME_SOUND = 0.11;
  const KICK = { pellets: 0.14, bullet: 0.05, projectile: 0.2, charge: 0.16, spin: 0.02, scope: 0.25 };
  const ITEM_SIZE = { 0.2: 0.3, 0.5: 0.46, 1: 0.62 };
  const ITEM_LOOK = {
    metal: { box: [0.5, 0.52, 0.55], belt: [0.34, 0.35, 0.38] },
    health: { box: [0.92, 0.92, 0.88], belt: [0.78, 0.12, 0.1] },
    ammo: { box: [0.2, 0.42, 0.22], belt: [0.86, 0.74, 0.16] }
  };
  const num = (v, digits) => v.toFixed(digits).replace('.', ',');

  class UI {
    constructor(root, opts = {}) {
      this.root = root;
      this.opts = opts;
      this.keys = {};
      this.mouse = { b0: false, b2: false };
      this.pending = { reload: false, slot: 0, next: 0, last: false, pick: 0, jump: false, fire: false, drop: false };
      this.level = 'worker';
      this.mode = 'menu';
      this.game = null;
      this.merc = T.MERC_ORDER[0];
      this.team = 'hot';
      this.yaw = 0;
      this.pitch = 0;
      this.acc = 0;
      this.clock = 0;
      this.last = 0;
      this.lift = 0;
      this.note = '';
      this.noteT = 0;
      this.lastJump = 0;
      this.lastFall = 0;
      this.lastNoise = {};
      this.tracers = [];
      this.booms = [];
      this.numbers = [];
      this.kick = 0;
      this.swingT = 0;
      this.hurtT = -9;
      this.flameT = 0;
      this.dead = false;
      this.audio = new T.Audio98();
      this.build();
      try {
        this.renderer = new T.Renderer(this.canvas, { preserve: !!opts.preserve });
        this.renderer.setMap(T.buildMap('yard'));
      } catch (e) {
        this.renderer = null;
        this.el.classList.add('tf98-nogl');
        this.el.querySelector('.tf98-note').textContent = 'WebGL недоступен, игру показать нельзя.';
      }
      this.bind();
      this.resize();
      this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null;
      if (this.ro) this.ro.observe(this.root);
      this.frameBound = ts => this.frame(ts);
      this.raf = requestAnimationFrame(this.frameBound);
    }

    build() {
      const hot = T.TEAMS.hot, cold = T.TEAMS.cold;
      const el = document.createElement('div');
      el.className = 'tf98';
      el.tabIndex = 0;
      el.innerHTML = `<canvas class="tf98-gl"></canvas><canvas class="tf98-hud"></canvas>
        <div class="tf98-menu">
          <div class="tf98-title">TEAM FORTRESS 98</div>
          <div class="tf98-sides"><span style="background:${hot.color}">${hot.mark} ${hot.name}</span><span style="background:${cold.color}">${cold.mark} ${cold.name}</span></div>
          <div class="tf98-buttons"></div>
          <div class="tf98-note"></div>
        </div>`;
      this.root.innerHTML = '';
      this.root.appendChild(el);
      this.el = el;
      this.canvas = el.querySelector('.tf98-gl');
      this.hud = el.querySelector('.tf98-hud');
      this.ctx = this.hud.getContext('2d');
      this.panel = el.querySelector('.tf98-menu');
      this.buttons = el.querySelector('.tf98-buttons');
      this.noteEl = el.querySelector('.tf98-note');
      this.showMenu();
    }

    setButtons(list) {
      this.buttons.innerHTML = '';
      for (const [text, fn] of list) {
        const b = document.createElement('button');
        b.textContent = text;
        b.addEventListener('click', fn);
        this.buttons.appendChild(b);
      }
    }

    showMenu() {
      const list = [
        ['ДВОР', () => this.start()],
        ['АРЕНА 12×12', () => this.start('arena', this.level)],
        ['2FORT: ЗАХВАТ ВЕНТИЛЯ', () => this.start('2fort', this.level)],
        ['Боты: ' + T.BOT_LEVELS[this.level].name, () => {
          this.level = T.BOT_ORDER[(T.BOT_ORDER.indexOf(this.level) + 1) % T.BOT_ORDER.length];
          this.showMenu();
        }]
      ];
      if (!this.el.classList.contains('tf98-nogl')) this.noteEl.textContent = 'Серая проба: Двор, Арена и 2Fort с ботами. Наёмника меняет клавиша «,», сторону клавиша «.».';
      if (this.opts.onExit) list.push(['Выход', () => this.opts.onExit()]);
      this.setButtons(list);
      this.panel.hidden = false;
    }

    showPause() {
      const list = [['Продолжить', () => this.resume()]];
      if (!this.game.opts.bots) list.push(['На старт', () => { this.game.respawn(this.game.player); this.syncLook(); this.resume(); }]);
      list.push(['В меню', () => this.toMenu()]);
      this.setButtons(list);
      this.panel.hidden = false;
    }

    active() { return this.opts.isActive ? this.opts.isActive() : true; }

    start(map, level) {
      this.audio.init();
      const fort = map === '2fort', arena = map === 'arena';
      this.game = new T.Game({
        map: map || 'yard', mode: fort ? 'ctf' : null, merc: this.merc, team: this.team, seed: Math.floor(this.clock * 1000) + 1,
        bots: arena || fort ? { size: 12, level } : null, rules: arena ? { respawn: 5 } : fort ? { wave: 10 } : null
      });
      if (this.renderer) this.renderer.setMap(this.game.map);
      this.syncLook();
      this.acc = 0;
      this.lift = 0;
      this.tracers.length = 0;
      this.booms.length = 0;
      this.numbers.length = 0;
      this.mode = 'play';
      this.panel.hidden = true;
      this.lockMouse();
      this.el.focus({ preventScroll: true });
    }

    syncLook() {
      const p = this.game.player;
      this.yaw = p.yaw;
      this.pitch = p.pitch;
    }

    clearInput() {
      this.keys = {};
      this.mouse.b0 = this.mouse.b2 = false;
    }

    pause() {
      if (this.mode !== 'play') return;
      this.mode = 'pause';
      this.clearInput();
      this.releaseMouse();
      this.showPause();
    }

    resume() {
      this.mode = 'play';
      this.panel.hidden = true;
      this.lockMouse();
      this.el.focus({ preventScroll: true });
    }

    toMenu() {
      this.mode = 'menu';
      this.game = null;
      this.clearInput();
      this.releaseMouse();
      this.showMenu();
    }

    lockMouse() {
      if (document.pointerLockElement === this.canvas || !this.canvas.requestPointerLock) return;
      try {
        const pr = this.canvas.requestPointerLock();
        if (pr && pr.catch) pr.catch(() => { });
      } catch (e) { }
    }

    releaseMouse() {
      if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    }

    bind() {
      this.onKey = e => {
        if (this.dead || !this.active()) return;
        if (this.mode !== 'play') {
          if (this.mode === 'pause' && e.code === 'Escape' && !e.repeat) { e.preventDefault(); this.resume(); }
          return;
        }
        this.audio.init();
        if (GAME_KEYS.test(e.code)) e.preventDefault();
        if (e.repeat) return;
        this.keys[e.code] = true;
        this.press(e.code);
      };
      this.onKeyUp = e => { this.keys[e.code] = false; };
      this.onBlur = () => this.clearInput();
      this.onMove = e => {
        if (this.mode !== 'play' || document.pointerLockElement !== this.canvas) return;
        const p = this.game.player;
        const slow = p.scoped ? p.arms[p.slot].def.zoom : 1;
        this.yaw -= e.movementX * MOUSE_SENS * slow;
        this.pitch = T.clamp(this.pitch - e.movementY * MOUSE_SENS * slow, -1.48, 1.48);
      };
      this.onLock = () => {
        if (document.pointerLockElement !== this.canvas && this.mode === 'play') this.pause();
      };
      this.onUp = e => {
        if (e.button === 0) this.mouse.b0 = false;
        if (e.button === 2) this.mouse.b2 = false;
      };
      window.addEventListener('keydown', this.onKey, true);
      window.addEventListener('keyup', this.onKeyUp, true);
      window.addEventListener('blur', this.onBlur);
      window.addEventListener('mouseup', this.onUp);
      document.addEventListener('mousemove', this.onMove);
      document.addEventListener('pointerlockchange', this.onLock);
      this.el.addEventListener('mousedown', e => {
        if (this.mode !== 'play') return;
        this.audio.init();
        this.lockMouse();
        if (e.button === 0) { this.mouse.b0 = true; this.pending.fire = true; }
        if (e.button === 2) this.mouse.b2 = true;
        e.preventDefault();
      });
      this.el.addEventListener('wheel', e => {
        if (this.mode !== 'play') return;
        e.preventDefault();
        this.pending.next = e.deltaY > 0 ? 1 : -1;
      }, { passive: false });
      this.el.addEventListener('contextmenu', e => e.preventDefault());
    }

    press(code) {
      const g = this.game, p = g.player;
      if (code === 'Escape') { this.pause(); return; }
      if (code === 'Space') { this.pending.jump = true; return; }
      if (code === 'Enter') { this.pending.fire = true; return; }
      if (code === 'KeyP') { if (!g.opts.bots) { g.respawn(p); this.syncLook(); } return; }
      if (code === 'KeyR') { this.pending.reload = true; return; }
      if (code === 'KeyL') { this.pending.drop = true; return; }
      if (code === 'KeyQ') { this.pending.last = true; return; }
      if (code === 'KeyB') { g.debugBoost(p, 'crit'); return; }
      if (code === 'KeyV') { g.debugBoost(p, 'mini'); return; }
      if (code === 'Period') { this.team = T.enemyOf(p.team); g.setTeam(p, this.team); this.syncLook(); return; }
      if (code === 'Comma') { this.pickMerc(T.MERC_ORDER[(T.MERC_ORDER.indexOf(p.merc) + 1) % T.MERC_ORDER.length]); return; }
      const digit = code.match(/^Digit(\d)$/);
      if (!digit) return;
      if (this.keys.ShiftLeft || this.keys.ShiftRight) {
        const id = T.MERC_ORDER.find(m => T.MERCS[m].key === digit[1]);
        if (id) this.pickMerc(id);
      } else if (digit[1] !== '0') {
        const a = p.arms[p.slot];
        if (a && ((a.def.kind === 'place' && !a.def.seal) || a.def.kind === 'self')) this.pending.pick = Number(digit[1]);
        else this.pending.slot = Number(digit[1]);
      }
      if (digit[1] === '0' && !this.keys.ShiftLeft && !this.keys.ShiftRight && p.arms[p.slot] && p.arms[p.slot].def.kind === 'self') this.pending.pick = 10;
    }

    pickMerc(id) {
      this.merc = id;
      this.game.setMerc(this.game.player, id);
      this.say(T.MERCS[id].name);
    }

    say(text) { this.note = text; this.noteT = this.clock + 3; }

    input(dt) {
      const k = this.keys, inp = T.blankInput(), q = this.pending;
      if (k.ArrowLeft) this.yaw += KEY_TURN * dt;
      if (k.ArrowRight) this.yaw -= KEY_TURN * dt;
      if (k.ArrowUp) this.pitch = Math.min(1.48, this.pitch + KEY_TURN * dt);
      if (k.ArrowDown) this.pitch = Math.max(-1.48, this.pitch - KEY_TURN * dt);
      inp.fwd = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
      inp.side = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
      inp.jump = !!k.Space || q.jump;
      inp.crouch = !!(k.ControlLeft || k.ControlRight || k.ShiftLeft || k.ShiftRight);
      inp.fire = this.mouse.b0 || !!k.Enter || q.fire;
      inp.fire2 = this.mouse.b2;
      inp.reload = q.reload; inp.slot = q.slot; inp.next = q.next; inp.last = q.last; inp.pick = q.pick; inp.drop = q.drop;
      q.reload = false; q.slot = 0; q.next = 0; q.last = false; q.pick = 0; q.jump = false; q.fire = false; q.drop = false;
      inp.yaw = this.yaw;
      inp.pitch = this.pitch;
      return inp;
    }

    heard(x, y, z) {
      const p = this.game.player;
      return T.clamp(1 - Math.hypot(x - p.pos.x, y - p.pos.y, z - p.pos.z) / HEAR_RANGE, 0, 1);
    }

    noise(name, at, vol = 1) {
      const last = this.lastNoise[name];
      if (last !== undefined && this.clock - last < NOISE_GAP) return;
      const k = this.heard(at.x, at.y, at.z);
      if (k <= 0) return;
      this.lastNoise[name] = this.clock;
      this.audio.play(name, k * k * vol);
    }

    muzzle(p, along) {
      const eye = this.game.eye(p), b = T.aimBasis(p.yaw, p.pitch);
      return {
        x: eye.x + b.f.x * along + b.r.x * 0.26 - b.u.x * 0.18,
        y: eye.y + b.f.y * along + b.r.y * 0.26 - b.u.y * 0.18,
        z: eye.z + b.f.z * along + b.r.z * 0.26 - b.u.z * 0.18
      };
    }

    flagNews(ev, p) {
      const ours = ev.team === p.team, me = ev.hero === p.id, A = this.audio;
      if (ev.what === 'taken') {
        A.play(ours ? 'siren' : 'flagClick');
        this.say(me ? 'Вентиль у вас. Несите на свой Распределитель' : ours ? 'Наш вентиль украден!' : 'Чужой вентиль у наших');
      } else if (ev.what === 'dropped') {
        A.play('flagClick');
        this.say(ours ? 'Наш вентиль упал' : 'Чужой вентиль упал');
      } else if (ev.what === 'returned') {
        A.play('flagClick');
        this.say(ours ? 'Наш вентиль дома' : 'Чужой вентиль вернулся домой');
      } else if (ev.what === 'captured') {
        A.play(ours ? 'siren' : 'capture');
        this.say(ours ? 'Чужие унесли наш вентиль' : 'Захват! Очко и 10 с критов');
      }
    }

    finishShift() {
      const g = this.game, m = g.mode, w = m.winner;
      this.mode = 'result';
      this.clearInput();
      this.releaseMouse();
      const head = !w ? 'Ничья' : w === g.player.team ? 'Победа' : 'Поражение';
      this.noteEl.textContent = head + '. ' + T.TEAMS.hot.name + ' ' + m.captures.hot + ' : ' + m.captures.cold + ' ' + T.TEAMS.cold.name + '. Убийств ' + g.score.hot + ' : ' + g.score.cold + '.';
      this.setButtons([['В меню', () => this.toMenu()]]);
      this.panel.hidden = false;
    }

    deathNote(cause, waits) {
      const text = { fall: 'Разбился', water: 'Утонул', burn: 'Сгорел', weapon: 'Убит' }[cause];
      if (waits) return text || 'Упал';
      return text ? text + '. Снова на старте' : 'Снова на старте';
    }

    readEvents() {
      const g = this.game, p = g.player, A = this.audio;
      for (const ev of g.events) {
        const mine = ev.hero === p.id;
        switch (ev.type) {
          case 'land':
            if (mine) { this.lastJump = ev.peak; this.lastFall = ev.fall; }
            break;
          case 'hurt':
            if (mine && ev.cause === 'fall') this.say('Падение: −' + Math.ceil(ev.amount));
            if (mine && ev.cause !== 'burn') { this.hurtT = this.clock; A.play('hurt'); }
            break;
          case 'death':
            if (!mine) break;
            this.say(this.deathNote(ev.cause, g.rules.respawn > 0));
            this.syncLook();
            break;
          case 'spawn':
            if (mine) this.syncLook();
            break;
          case 'flag':
            this.flagNews(ev, p);
            break;
          case 'overtime':
            A.play('siren');
            this.say('Сверхурочные!');
            break;
          case 'lastShift':
            A.play('siren');
            this.say('Последняя смена: без возврата');
            break;
          case 'shiftEnd':
            A.play(!ev.winner ? 'flagClick' : ev.winner === p.team ? 'win' : 'lose');
            this.say(!ev.winner ? 'Ничья' : T.TEAMS[ev.winner].name + ' выиграли смену');
            break;
          case 'over':
            this.finishShift();
            break;
          case 'kill':
            if (ev.by === p.id && ev.victim !== p.id) this.say('Убит: ' + g.heroes[ev.victim].def.name);
            else if (ev.victim === p.id && ev.by !== p.id) this.say('Вас убил: ' + g.heroes[ev.by].def.name);
            break;
          case 'shot': {
            const def = T.WEAPONS[ev.weapon];
            if (!mine) { this.noise(def.kind === 'melee' ? 'swing' : ev.weapon, g.heroes[ev.hero].pos, 0.8); break; }
            if (def.kind === 'melee') { this.swingT = SWING_LIFE; A.play('swing'); }
            else { this.kick = KICK[def.kind] || 0; A.play(ev.weapon); }
            break;
          }
          case 'tracer': {
            if (this.tracers.length >= MAX_TRACERS) break;
            const m = this.muzzle(g.heroes[ev.hero], mine ? 1.1 : 0.5);
            this.tracers.push({ ax: m.x, ay: m.y, az: m.z, bx: ev.x, by: ev.y, bz: ev.z, t: this.clock, boost: ev.boost });
            break;
          }
          case 'boom':
            this.booms.push({ x: ev.x, y: ev.y, z: ev.z, r: ev.r, t: this.clock });
            A.play('boom', this.heard(ev.x, ev.y, ev.z));
            break;
          case 'melee':
            if (mine && ev.hit) A.play('meleeHit');
            else if (mine && ev.wall) A.play('meleeWall');
            else if (!mine && ev.hit) this.noise('meleeHit', g.heroes[ev.hero].pos);
            break;
          case 'hit':
            if (ev.src === p.id && ev.dst !== p.id) {
              this.numbers.push({ x: ev.x, y: ev.y, z: ev.z, amount: ev.amount, boost: ev.boost, head: ev.head, t: this.clock });
              if (ev.weapon !== 'torch' || ev.boost) A.play(ev.boost === 'crit' ? 'crit' : ev.boost === 'mini' ? 'mini' : 'tick');
            }
            break;
          case 'turret': {
            this.tracers.push({ ax: ev.x, ay: ev.y, az: ev.z, bx: ev.tx, by: ev.ty, bz: ev.tz, t: this.clock, boost: null });
            A.play('turret', this.heard(ev.x, ev.y, ev.z));
            break;
          }
          case 'turretRocket':
            A.play('tube', this.heard(ev.x, ev.y, ev.z));
            break;
          case 'placed':
            if (mine) A.play('placed');
            break;
          case 'levelup':
            if (mine) { A.play('levelup'); this.say(T.BUILDINGS[ev.kind].name + ': уровень ' + ev.level); }
            break;
          case 'carry':
            if (mine) this.say('Несёт: ЛКМ поставить, ПКМ повернуть');
            break;
          case 'buildDenied':
            if (mine) { A.play('dry'); this.say(ev.why === 'металл' ? 'Мало металла' : ev.why === 'есть' ? 'Такое здание уже стоит' : 'Сюда не поставить'); }
            break;
          case 'destroyed':
            if (mine && ev.broken) { A.play('boom', 0.7); this.say(T.BUILDINGS[ev.kind].name + ': разбит'); }
            break;
          case 'teleport':
            if (mine) { A.play('teleport'); this.yaw = ev.yaw; this.pitch = 0; }
            break;
          case 'backstab':
            if (mine) { A.play('stab'); this.say('Акт составлен: в спину'); }
            break;
          case 'cloak':
            if (mine) A.play('cloak');
            break;
          case 'decloak':
            if (mine) A.play('decloak');
            break;
          case 'disguised':
            if (mine) this.say('Образ: ' + T.MERCS[ev.merc].name + ', ' + T.TEAMS[ev.team].name);
            break;
          case 'undisguised':
            if (mine) this.say('Образ снят');
            break;
          case 'sealed':
            if (mine) A.play('seal');
            if (ev.owner === p.id) this.say('Пломба на ' + T.BUILDINGS[ev.kind].name);
            break;
          case 'charge':
            if (mine) A.play('charge');
            else this.noise('charge', g.heroes[ev.hero].pos);
            break;
          case 'ram':
            if (mine) A.play('ram');
            break;
          case 'notch':
            if (mine) { A.play('notch'); this.say('Зарубка: ' + ev.notches); }
            break;
          case 'airblast':
            if (mine) { A.play('airblast'); this.say('Продувка'); }
            else this.noise('airblast', ev);
            break;
          case 'reflect':
            if (mine) { A.play('mini'); this.say('Снаряд возвращён'); }
            break;
          case 'extinguish':
            if (mine) this.say('Потушил своего: +20');
            break;
          case 'eat':
            if (mine) { A.play('eat'); this.say('Обед'); }
            break;
          case 'uber':
            if (mine) { A.play('uber'); this.say('НАПОР!'); }
            break;
          case 'pickup':
            if (mine) A.play('pickup');
            break;
          case 'locker':
            if (mine) { A.play('locker'); this.say('Шкафчик: всё пополнено'); }
            break;
          case 'reload':
            if (mine) A.play('reload');
            break;
          case 'shell':
            if (mine) A.play('shell');
            break;
          case 'dry':
            if (mine) A.play('dry');
            break;
        }
      }
    }

    frame(ts) {
      if (this.dead) return;
      this.raf = requestAnimationFrame(this.frameBound);
      const dt = this.last ? T.clamp((ts - this.last) / 1000, 0, 0.1) : 0;
      this.last = ts;
      if (!this.active()) {
        this.pause();
        return;
      }
      this.clock += dt;
      if (this.mode === 'play') this.simulate(dt);
      this.drawFrame();
    }

    simulate(dt) {
      const g = this.game, p = g.player;
      this.acc += dt;
      let steps = 0;
      while (this.acc >= T.TICK && steps < MAX_STEPS) {
        const ground = p.onGround;
        g.step(this.input(T.TICK));
        if (p.charging) this.yaw = p.yaw;
        this.readEvents();
        const rise = p.pos.y - p.prev.y;
        if (ground && p.onGround && rise > 0.12) this.lift = Math.min(0.5, this.lift + rise);
        this.acc -= T.TICK;
        steps++;
      }
      if (steps >= MAX_STEPS) this.acc = 0;
      this.lift = Math.max(0, this.lift - dt * 3.5);
      this.kick = Math.max(0, this.kick - dt * 0.9);
      this.swingT = Math.max(0, this.swingT - dt);
      this.flameT -= dt;
      if (this.flameT <= 0) {
        if (p.flaming) {
          this.flameT = FLAME_SOUND;
          this.audio.play('torch');
        } else {
          const burner = g.heroes.find(h => h.flaming);
          if (burner) {
            this.flameT = FLAME_SOUND;
            this.noise('torch', burner.pos, 0.7);
          }
        }
      }
    }

    camera() {
      const g = this.game;
      if (!g) {
        const a = this.clock * 0.05;
        return { x: Math.sin(a) * 34, y: 16, z: Math.cos(a) * 28, yaw: a + Math.PI, pitch: -0.32 };
      }
      const p = g.player, k = this.mode === 'play' ? T.clamp(this.acc / T.TICK, 0, 1) : 1;
      return {
        x: T.lerp(p.prev.x, p.pos.x, k),
        y: T.lerp(p.prev.y, p.pos.y, k) + g.eyeHeight(p) - this.lift,
        z: T.lerp(p.prev.z, p.pos.z, k),
        yaw: this.yaw,
        pitch: this.pitch
      };
    }

    bodies() {
      const list = [], k = this.mode === 'play' ? T.clamp(this.acc / T.TICK, 0, 1) : 1;
      for (const h of this.game.heroes) {
        if (h.human || !h.alive) continue;
        if (h.cloaked && h.blinkT <= 0 && h.burnT <= 0) continue;
        list.push({ x: T.lerp(h.prev.x, h.pos.x, k), y: T.lerp(h.prev.y, h.pos.y, k), z: T.lerp(h.prev.z, h.pos.z, k), h: h.h, yaw: h.yaw, team: h.disguise ? h.disguise.team : h.team, uber: h.uberT > 0, burning: h.burnT > 0 });
      }
      return list;
    }

    shells() {
      const rockets = [], balls = [], trails = [];
      for (const p of this.game.proj) {
        const c = T.TEAMS[p.team].rgb, glow = p.boost === 'crit' ? 1.7 : p.boost === 'mini' ? 1.3 : 1;
        const color = [c[0] * glow, c[1] * glow, c[2] * glow];
        const flight = p.def.flight;
        if (flight === 'mine' || flight === 'grenade') {
          const armed = flight === 'mine' && p.armT <= 0;
          balls.push({ x: p.x, y: p.y, z: p.z, r: flight === 'mine' ? 0.15 : 0.11, color: armed ? [color[0] * 1.5, color[1] * 1.5, color[2] * 1.5] : color });
          continue;
        }
        const speed = Math.hypot(p.vx, p.vy, p.vz) || 1, dx = p.vx / speed, dy = p.vy / speed, dz = p.vz / speed;
        if (flight === 'needle') {
          rockets.push({ ax: p.x - dx * 0.18, ay: p.y - dy * 0.18, az: p.z - dz * 0.18, bx: p.x, by: p.y, bz: p.z, w: 0.03, color });
          continue;
        }
        rockets.push({ ax: p.x - dx * 0.42, ay: p.y - dy * 0.42, az: p.z - dz * 0.42, bx: p.x, by: p.y, bz: p.z, w: 0.13, color });
        trails.push({ ax: p.x - dx * 2.2, ay: p.y - dy * 2.2, az: p.z - dz * 2.2, bx: p.x - dx * 0.42, by: p.y - dy * 0.42, bz: p.z - dz * 0.42, w: 0.07, color: [0.9, 0.9, 0.88], alpha: 0.35 });
      }
      return { rockets, balls, trails };
    }

    buildingShapes() {
      const g = this.game, props = [], barrels = [];
      const grey = [0.46, 0.47, 0.5], dark = [0.22, 0.22, 0.25], hazard = [0.86, 0.72, 0.12];
      for (const b of g.buildings) {
        const team = T.TEAMS[b.team].rgb, k = b.buildLeft > 0 ? Math.max(0.25, 1 - b.buildLeft / b.buildTotal) : 1;
        const { x, y, z } = b.pos;
        if (b.def.pad) {
          props.push({ x, y: y + b.h / 2, z, w: 1.3, h: b.h, d: 1.3, color: b.kind === 'enter' ? team : [team[0] * 0.55, team[1] * 0.55, team[2] * 0.55] });
          if (T.Build.ready(b) && b.charge <= 0) props.push({ x, y: y + b.h + 0.01, z, w: 0.5, h: 0.02, d: 0.5, color: [0.9, 0.9, 0.82] });
        } else if (b.kind === 'titan') {
          props.push({ x, y: y + b.h * k / 2, z, w: 0.85, h: b.h * k, d: 0.85, color: grey });
          props.push({ x, y: y + b.h * k * 0.6, z, w: 0.87, h: 0.24 * k, d: 0.87, color: team });
          for (let i = 0; i < b.level; i++) props.push({ x: x - 0.25 + i * 0.25, y: y + b.h * k + 0.06, z, w: 0.14, h: 0.12, d: 0.14, color: dark });
        } else {
          props.push({ x, y: y + 0.12 * k, z, w: 0.7, h: 0.24 * k, d: 0.7, color: grey });
          props.push({ x, y: y + 0.24 * k + 0.26 * k, z, w: 0.34, h: 0.52 * k, d: 0.34, color: team });
          if (k >= 1) {
            const head = y + b.h - 0.15, fx = Math.sin(b.aimYaw), fz = Math.cos(b.aimYaw), sx = fz, sz = -fx;
            const offsets = b.level === 1 ? [0] : [-0.09, 0.09];
            for (const o of offsets) barrels.push({ ax: x + sx * o, ay: head, az: z + sz * o, bx: x + sx * o + fx * 0.75, by: head, bz: z + sz * o + fz * 0.75, w: 0.09, color: dark });
            if (b.level === 3) barrels.push({ ax: x, ay: head + 0.15, az: z, bx: x + fx * 0.55, by: head + 0.15, bz: z + fz * 0.55, w: 0.2, color: team });
          }
        }
        if (b.sealed) props.push({ x, y: y + b.h * k * 0.5, z, w: b.r * 2.1, h: 0.12, d: b.r * 2.1, color: hazard });
      }
      return { props, barrels };
    }

    ghostShapes() {
      const g = this.game, p = g.player;
      if (!p.ghost) return [];
      const spot = T.Build.spotFor(g, p), def = T.BUILDINGS[p.ghost.kind];
      if (spot.y === -Infinity) return [];
      const color = spot.ok ? [0.3, 0.85, 0.4] : [0.9, 0.25, 0.2], wide = def.pad ? 1.3 : def.r * 2;
      const yaw = p.yaw + p.ghost.turn * Math.PI / 2;
      return [
        { x: spot.x, y: spot.y + def.h / 2, z: spot.z, w: wide, h: def.h, d: wide, color },
        { x: spot.x + Math.sin(yaw) * (wide / 2 + 0.2), y: spot.y + 0.1, z: spot.z + Math.cos(yaw) * (wide / 2 + 0.2), w: 0.2, h: 0.2, d: 0.2, color }
      ];
    }

    pushItem(list, item) {
      const look = ITEM_LOOK[item.kind], s = ITEM_SIZE[item.size] || 0.46;
      list.push({ x: item.x, y: item.y + s / 2 + 0.02, z: item.z, w: s, h: s, d: s, color: look.box });
      list.push({ x: item.x, y: item.y + s / 2 + 0.02, z: item.z, w: s * 1.04, h: s * 0.24, d: s * 1.04, color: look.belt });
    }

    pushFlags(list, m) {
      for (const team of ['hot', 'cold']) {
        const f = m.flags[team], own = T.TEAMS[team].rgb;
        let x = f.x, y = f.y, z = f.z;
        if (f.state === 'carried') {
          const h = f.carrier;
          if (h.human) continue;
          x = h.pos.x - Math.sin(h.yaw) * 0.5;
          y = h.pos.y + 1;
          z = h.pos.z - Math.cos(h.yaw) * 0.5;
        }
        list.push({ x, y: y + 0.22, z, w: 0.5, h: 0.44, d: 0.3, color: [0.72, 0.58, 0.26] });
        list.push({ x, y: y + 0.22, z, w: 0.53, h: 0.12, d: 0.33, color: own });
      }
    }

    props() {
      const g = this.game, list = [];
      for (const p of g.pickups) if (g.t >= p.readyAt) this.pushItem(list, p);
      for (const i of g.drops) this.pushItem(list, i);
      if (g.mode) this.pushFlags(list, g.mode);
      return list;
    }

    beams(trails) {
      const g = this.game, p = g.player, list = trails.slice();
      this.tracers = this.tracers.filter(s => this.clock - s.t < BEAM_LIFE);
      for (const s of this.tracers) {
        const color = s.boost === 'crit' ? [0.5, 1, 0.5] : s.boost === 'mini' ? [1, 0.9, 0.3] : [1, 0.92, 0.6];
        list.push({ ax: s.ax, ay: s.ay, az: s.az, bx: s.bx, by: s.by, bz: s.bz, w: 0.012, color, alpha: 0.75 * (1 - (this.clock - s.t) / BEAM_LIFE) });
      }
      if (g.mode) {
        for (const team of ['hot', 'cold']) {
          const f = g.mode.flags[team];
          if (f.state !== 'carried' || f.carrier.human) continue;
          const h = f.carrier;
          list.push({ ax: h.prev.x, ay: h.pos.y + 1.2, az: h.prev.z, bx: h.pos.x - h.vel.x * 0.25, by: h.pos.y + 1.2, bz: h.pos.z - h.vel.z * 0.25, w: 0.08, color: T.TEAMS[team].rgb, alpha: 0.6 });
        }
      }
      for (const h of g.heroes) {
        if (!h.flaming) continue;
        const d = T.dir(h.yaw, h.pitch), m = this.muzzle(h, 0.6), range = h.arms[h.slot].def.range;
        [[0.45, 0.1], [0.75, 0.26], [1, 0.5]].forEach(([part, w]) => {
          list.push({ ax: m.x, ay: m.y, az: m.z, bx: m.x + d.x * range * part, by: m.y + d.y * range * part, bz: m.z + d.z * range * part, w, color: [1, 0.55, 0.14], alpha: 0.32 });
        });
      }
      if (p.patient) {
        const t = p.patient, m = this.muzzle(p, 0.5);
        list.push({ ax: m.x, ay: m.y, az: m.z, bx: t.pos.x, by: t.pos.y + t.h * 0.6, bz: t.pos.z, w: p.uberT > 0 ? 0.09 : 0.05, color: [0.55, 0.85, 1], alpha: 0.7 });
      }
      return list;
    }

    blasts() {
      this.booms = this.booms.filter(b => this.clock - b.t < BOOM_LIFE);
      return this.booms.map(b => {
        const k = (this.clock - b.t) / BOOM_LIFE;
        return { x: b.x, y: b.y, z: b.z, r: b.r * (0.35 + 0.65 * Math.sqrt(k)), alpha: 0.6 * (1 - k) };
      });
    }

    hands() {
      const p = this.game.player, a = p.arms[p.slot];
      if (!a || p.scoped || !p.alive || p.disarmed) return null;
      const swing = this.swingT > 0 ? Math.sin(Math.PI * (1 - this.swingT / SWING_LIFE)) : 0;
      const dip = p.deployT / T.RULES.deploy * 0.35 + (p.reloading ? 0.1 : 0) + (p.eatT > 0 ? 0.3 : 0);
      const lift = p.stabReady ? 0.12 : 0;
      const parts = a.def.notches ? a.def.view.map((part, i) => (i === 0 ? part.slice(0, 6).concat(0.7 + 0.08 * p.notches) : part)) : a.def.view;
      return { parts, side: -swing * 0.2, dip: dip - swing * 0.06 - lift, kick: this.kick - swing * 0.25 };
    }

    drawFrame() {
      const cam = this.camera();
      if (this.renderer) {
        if (this.game) {
          const p = this.game.player;
          const shells = this.shells();
          const built = this.buildingShapes();
          this.renderer.render({
            cam, bodies: this.bodies(), rockets: shells.rockets.concat(built.barrels), balls: shells.balls, props: this.props().concat(built.props), ghosts: this.ghostShapes(),
            beams: this.beams(shells.trails), booms: this.blasts(), hands: this.hands(), zoom: p.scoped ? p.arms[p.slot].def.zoom : 0
          });
        } else {
          this.renderer.render({ cam });
        }
      }
      this.drawHud(cam);
    }

    drawLabels(ctx, cam, map) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const l of map.labels) {
        const dist = Math.hypot(l.x - cam.x, l.y - cam.y, l.z - cam.z);
        if (dist > LABEL_RANGE) continue;
        const at = this.renderer.project(l.x, l.y, l.z);
        if (!at || !map.world.clear(cam.x, cam.y, cam.z, l.x, l.y, l.z)) continue;
        const size = T.clamp(Math.round(240 / Math.max(dist, 1)), 10, 14);
        ctx.font = 'bold ' + size + 'px Tahoma, sans-serif';
        const w = ctx.measureText(l.text).width + 8;
        ctx.fillStyle = 'rgba(32,30,26,0.72)';
        ctx.fillRect(at.x - w / 2, at.y - size * 0.8, w, size * 1.6);
        ctx.fillStyle = '#efe8d4';
        ctx.fillText(l.text, at.x, at.y);
      }
    }

    drawNames(ctx, cam) {
      const g = this.game;
      if (!g.opts.bots) return;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 11px Tahoma, sans-serif';
      for (const h of g.heroes) {
        if (h.human || !h.alive || (h.cloaked && h.blinkT <= 0 && h.burnT <= 0)) continue;
        const top = h.pos.y + h.h + 0.3;
        if (Math.hypot(h.pos.x - cam.x, top - cam.y, h.pos.z - cam.z) > NAME_RANGE) continue;
        const at = this.renderer.project(h.pos.x, top, h.pos.z);
        if (!at || !g.world.clear(cam.x, cam.y, cam.z, h.pos.x, top, h.pos.z)) continue;
        const look = h.disguise || h;
        const text = T.MERCS[look.merc].name + (h.flag ? ': вентиль' : '');
        const w = ctx.measureText(text).width + 8;
        ctx.fillStyle = T.TEAMS[look.team].color;
        ctx.fillRect(at.x - w / 2, at.y - 7, w, 14);
        ctx.fillStyle = '#efe8d4';
        ctx.fillText(text, at.x, at.y);
      }
    }

    drawNumbers(ctx) {
      this.numbers = this.numbers.filter(n => this.clock - n.t < NUMBER_LIFE);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const n of this.numbers) {
        const k = (this.clock - n.t) / NUMBER_LIFE;
        const at = this.renderer.project(n.x, n.y + 0.3 + k * 0.7, n.z);
        if (!at) continue;
        const text = '−' + Math.max(1, Math.round(n.amount));
        ctx.globalAlpha = 1 - k * k;
        ctx.font = 'bold 18px Tahoma, sans-serif';
        ctx.fillStyle = '#20180c';
        ctx.fillText(text, at.x + 1, at.y + 1);
        ctx.fillStyle = n.boost === 'crit' ? '#8fef6a' : n.boost === 'mini' ? '#f4d06a' : '#ffe8d0';
        ctx.fillText(text, at.x, at.y);
        if (n.boost) {
          ctx.font = 'bold 13px Tahoma, sans-serif';
          ctx.fillText(n.head ? 'В ГОЛОВУ!' : n.boost === 'crit' ? 'КРИТ!' : 'МИНИ-КРИТ!', at.x, at.y - 18);
        }
      }
      ctx.globalAlpha = 1;
    }

    armState(p, a) {
      const def = a.def;
      if (def.clip) return (p.reloading ? 'зарядка  ' : '') + a.clip + ' / ' + a.reserve;
      if (def.kind === 'food') return a.cooldown > 0 ? 'ещё ' + Math.ceil(a.cooldown) + ' с' : p.eatT > 0 ? 'ест' : 'готов';
      if (def.kind === 'beam') return p.uberT > 0 ? 'НАПОР ' + num(p.uberT, 1) : 'Напор ' + Math.floor(a.charge * 100) + ' %';
      if (def.reserve) return String(a.reserve);
      if (def.kind === 'place') return def.seal ? 'ЛКМ по зданию' : 'металл ' + p.metal;
      if (def.kind === 'self') return p.disguise ? T.MERCS[p.disguise.merc].name : 'без образа';
      return '';
    }

    drawBar(ctx, x, y, w, h, k, color) {
      ctx.fillStyle = 'rgba(32,30,26,0.72)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(x + 2, y + 2, Math.max(0, (w - 4) * k), h - 4);
    }

    buildStatus(g, p, kind) {
      const b = T.Build.own(g, p, kind);
      if (!b) return p.ghost && p.ghost.carried && p.ghost.kind === kind ? 'в руках' : 'нет';
      if (b.buildLeft > 0) return 'стройка ' + Math.ceil(b.buildLeft) + ' с';
      let s = 'ур. ' + b.level + ' · ' + Math.ceil(b.hp) + '/' + b.maxHp;
      if (b.sealed) s += ' · ПЛОМБА';
      if (kind === 'hydrant') s += ' · ' + b.ammo + (b.level === 3 ? ' + ' + b.rockets : '');
      if (b.level < 3) s += ' · ' + b.upgrade + '/200';
      if (kind === 'enter' && b.charge > 0) s += ' · ' + Math.ceil(b.charge) + ' с';
      return s;
    }

    drawBuildPanel(ctx, W, H) {
      const g = this.game, p = g.player;
      if (!p.mods.metal) return;
      const x = 12, top = H - 92 - 104;
      ctx.fillStyle = 'rgba(32,30,26,0.72)';
      ctx.fillRect(x, top, 300, 96);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 13px Tahoma, sans-serif';
      ctx.fillStyle = '#f4d06a';
      ctx.fillText('Металл ' + p.metal + ' / 200', x + 8, top + 18);
      ctx.font = '12px Tahoma, sans-serif';
      ctx.fillStyle = '#efe8d4';
      T.BUILD_ORDER.forEach((kind, i) => {
        ctx.fillText(T.BUILDINGS[kind].name + ': ' + this.buildStatus(g, p, kind), x + 8, top + 36 + i * 15);
      });
      const a = p.arms[p.slot];
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px Tahoma, sans-serif';
      ctx.fillStyle = '#f4d06a';
      if (p.ghost) {
        ctx.fillText('ЛКМ поставить · ПКМ повернуть', W / 2, H / 2 + 62);
      } else if (a && a.def.kind === 'place') {
        const text = T.BUILD_ORDER.map((kind, i) => (i + 1) + ' ' + T.BUILDINGS[kind].name + (a.def.scrap ? '' : ' ' + T.BUILDINGS[kind].cost)).join(' · ');
        ctx.fillText((a.def.scrap ? 'Взорвать: ' : 'Построить: ') + text, W / 2, H / 2 + 62);
      } else if (a && a.def.wrench) {
        ctx.font = '12px Tahoma, sans-serif';
        ctx.fillText('ЛКМ чинит и улучшает · ПКМ взять своё здание', W / 2, H / 2 + 62);
      }
    }

    drawSpy(ctx, W, H) {
      const g = this.game, p = g.player;
      if (!p.mods.watch) return;
      const c = p.cloakState === 'off' ? '#9fd8ff' : p.cloakState === 'out' ? '#efe8d4' : '#6fb4e8';
      this.drawBar(ctx, 12, H - 112, 118, 12, p.cloakMeter, c);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillStyle = '#efe8d4';
      const state = p.cloakState === 'off' ? 'Часы: ПКМ' : p.cloakState === 'out' ? 'Появляется' : 'Не виден';
      ctx.fillText(state, 136, H - 102);
      if (p.disguise || p.disguiseT > 0) {
        const show = p.disguiseT > 0 ? 'Образ через ' + num(p.disguiseT, 1) + ' с' : 'Образ: ' + T.MERCS[p.disguise.merc].name + ', ' + T.TEAMS[p.disguise.team].name;
        ctx.fillText(show, 12, H - 118);
      }
      const a = p.arms[p.slot];
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f4d06a';
      ctx.font = 'bold 14px Tahoma, sans-serif';
      if (p.stabReady) ctx.fillText('В СПИНУ', W / 2, H / 2 + 62);
      else if (a && a.def.kind === 'self') {
        ctx.fillText('Образ ' + T.TEAMS[p.formTeam].name + ' (ПКМ сторона)', W / 2, H / 2 + 62);
        ctx.font = '12px Tahoma, sans-serif';
        ctx.fillText(T.MERC_ORDER.map(id => T.MERCS[id].key + ' ' + T.MERCS[id].name).join(' · '), W / 2, H / 2 + 80);
      }
      const eye = g.eye(p), d = T.dir(p.yaw, p.pitch), hit = g.trace(p, eye.x, eye.y, eye.z, d.x, d.y, d.z, 60);
      if (hit && hit.body && !hit.body.isBuilding) {
        const t = hit.body;
        ctx.font = 'bold 13px Tahoma, sans-serif';
        ctx.fillStyle = '#ffe8d0';
        ctx.fillText(t.def.name + ': ' + Math.ceil(t.hp) + ' / ' + t.maxHp, W / 2, H / 2 - 24);
      }
    }

    drawMatch(ctx, W, H) {
      const g = this.game, p = g.player;
      if (!g.opts.bots) return;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = 'bold 18px Tahoma, sans-serif';
      const shown = g.mode ? g.mode.captures : g.score;
      const middle = g.mode ? this.clockText(g.mode.timer) : ':';
      ctx.fillStyle = T.TEAMS.hot.color;
      ctx.fillRect(W / 2 - 110, 8, 60, 28);
      ctx.fillStyle = T.TEAMS.cold.color;
      ctx.fillRect(W / 2 + 50, 8, 60, 28);
      ctx.fillStyle = 'rgba(32,30,26,0.82)';
      ctx.fillRect(W / 2 - 50, 8, 100, 28);
      ctx.fillStyle = '#efe8d4';
      ctx.fillText(String(shown.hot), W / 2 - 80, 12);
      ctx.fillText(String(shown.cold), W / 2 + 80, 12);
      ctx.fillStyle = g.mode && (g.mode.phase === 'overtime' || g.mode.timer < 60) ? '#ff7a5a' : '#efe8d4';
      ctx.fillText(middle, W / 2, 12);
      if (g.mode) this.drawFlags(ctx, W, H);
      if (!p.alive) {
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px Tahoma, sans-serif';
        ctx.fillStyle = '#f4d06a';
        ctx.fillText(g.rules.noRespawn ? 'Выбыл до конца смены' : 'Возвращение через ' + Math.ceil(p.respawnT) + ' с', W / 2, H * 0.42);
      }
    }

    clockText(sec) {
      const s = Math.ceil(Math.max(0, sec));
      return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    flagText(f) {
      if (f.state === 'home') return 'дома';
      if (f.state === 'dropped') return 'лежит, ' + Math.ceil(f.returnT) + ' с';
      return 'несёт ' + f.carrier.def.name;
    }

    healthColor(h) {
      const k = h.hp / h.maxHp;
      return k > 0.66 ? '#8fef6a' : k > 0.33 ? '#f4d06a' : '#ff7a5a';
    }

    drawTag(ctx, x, y, z, text, color) {
      const at = this.renderer ? this.renderer.project(x, y, z) : null;
      if (!at) return;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px Tahoma, sans-serif';
      const w = ctx.measureText(text).width + 10;
      ctx.fillStyle = 'rgba(32,30,26,0.8)';
      ctx.fillRect(at.x - w / 2, at.y - 9, w, 18);
      ctx.fillStyle = color;
      ctx.fillText(text, at.x, at.y);
    }

    drawFlags(ctx, W, H) {
      const g = this.game, m = g.mode, p = g.player;
      const own = m.flags[p.team], foe = m.flags[T.enemyOf(p.team)];
      const phase = { overtime: 'СВЕРХУРОЧНЫЕ', last: 'ПОСЛЕДНЯЯ СМЕНА', act: 'АКТ О ПОРАЖЕНИИ' }[m.phase];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (phase) {
        ctx.font = 'bold 16px Tahoma, sans-serif';
        ctx.fillStyle = '#ff7a5a';
        ctx.fillText(phase, W / 2, 62);
      }
      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillStyle = 'rgba(32,30,26,0.72)';
      ctx.fillRect(W / 2 - 170, 38, 340, 20);
      ctx.fillStyle = '#efe8d4';
      ctx.fillText('Наш вентиль: ' + this.flagText(own) + '  ·  Чужой: ' + this.flagText(foe), W / 2, 42);
      const target = p.flag ? m.zones[p.team] : own.state === 'carried' ? own : foe;
      const name = p.flag ? 'Распределитель' : own.state === 'carried' ? 'Наш вентиль' : 'Чужой вентиль';
      if (m.phase !== 'act' && m.phase !== 'over' && p.alive) {
        const turn = Math.atan2(target.x - p.pos.x, target.z - p.pos.z) - this.yaw;
        ctx.save();
        ctx.translate(W / 2, 96);
        ctx.rotate(-turn);
        ctx.fillStyle = p.flag ? '#8fef6a' : own.state === 'carried' ? '#ff7a5a' : '#f4d06a';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(10, 10);
        ctx.lineTo(0, 4);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#efe8d4';
        ctx.textBaseline = 'top';
        ctx.fillText(name + ' ' + Math.round(Math.hypot(target.x - p.pos.x, target.z - p.pos.z)) + ' м', W / 2, 114);
      }
      for (const f of [own, foe]) {
        if (f.state === 'dropped') this.drawTag(ctx, f.x, f.y + 0.9, f.z, 'Вентиль ' + Math.ceil(f.returnT) + ' с', f.team === p.team ? '#9fd8ff' : '#f4d06a');
        else if (f.state === 'carried' && !f.carrier.human && f.carrier.team === p.team) this.drawTag(ctx, f.carrier.pos.x, f.carrier.pos.y + f.carrier.h + 0.7, f.carrier.pos.z, 'Несёт: ' + Math.ceil(f.carrier.hp), this.healthColor(f.carrier));
      }
      if (own.state === 'carried') this.drawTag(ctx, own.x, own.y + 0.7, own.z, 'Вор: ' + own.carrier.def.name, '#ff7a5a');
      if (p.flag) this.drawTag(ctx, m.zones[p.team].x, m.zones[p.team].y + 1.2, m.zones[p.team].z, 'Распределитель', '#8fef6a');
    }

    drawKnight(ctx, W, H) {
      const p = this.game.player, c = p.mods.charge;
      if (!c) return;
      this.drawBar(ctx, 12, H - 112, 118, 12, p.chargeMeter, p.chargeMeter >= 1 ? '#f4d06a' : '#efe8d4');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 12px Tahoma, sans-serif';
      ctx.fillStyle = '#efe8d4';
      ctx.fillText(p.charging ? 'Рывок' : p.chargeMeter >= 1 ? 'Рывок: ПКМ' : 'Зарядка', 136, H - 102);
      ctx.fillText('Зарубки: ' + p.notches + ' из 4', 12, H - 118);
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px Tahoma, sans-serif';
      const frac = p.charging ? p.chargeRun / c.time : 0;
      const shown = p.charging ? (frac >= c.critAt ? 'БЕЙ: КРИТ' : frac >= c.miniAt ? 'БЕЙ: МИНИ-КРИТ' : '') : p.chargeBoostT > 0 ? (p.chargeBoostKind === 'crit' ? 'БЕЙ: КРИТ' : 'БЕЙ: МИНИ-КРИТ') : '';
      if (shown) {
        ctx.fillStyle = shown.includes('МИНИ') ? '#f4d06a' : '#8fef6a';
        ctx.fillText(shown, W / 2, H / 2 + 62);
      }
    }

    drawArms(ctx, W, H) {
      const g = this.game, p = g.player, a = p.arms[p.slot];
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(32,30,26,0.72)';
      ctx.fillRect(12, H - 92, 118, 54);
      ctx.fillStyle = T.TEAMS[p.team].color;
      ctx.fillRect(12, H - 92, 5, 54);
      ctx.textAlign = 'left';
      ctx.font = 'bold 34px Tahoma, sans-serif';
      ctx.fillStyle = p.hp > p.maxHp ? '#9fd8ff' : p.hp < p.maxHp * 0.25 ? '#ff7a5a' : '#efe8d4';
      ctx.fillText(String(Math.ceil(Math.max(0, p.hp))), 26, H - 52);
      if (!a) return;
      ctx.fillStyle = 'rgba(32,30,26,0.72)';
      ctx.fillRect(W - 258, H - 92, 246, 54);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#efe8d4';
      ctx.font = 'bold 13px Tahoma, sans-serif';
      ctx.fillText(a.def.name, W - 20, H - 76);
      ctx.font = 'bold 26px Tahoma, sans-serif';
      ctx.fillStyle = a.def.clip && a.clip === 0 ? '#ff7a5a' : '#efe8d4';
      ctx.fillText(this.armState(p, a), W - 20, H - 47);
      ctx.font = '12px Tahoma, sans-serif';
      p.arms.forEach((arm, i) => {
        ctx.fillStyle = i === p.slot ? '#f4d06a' : '#efe8d4';
        ctx.fillText((i + 1) + ' ' + arm.def.name, W - 20, H - 100 - (p.arms.length - 1 - i) * 18);
      });
      ctx.textAlign = 'center';
      const def = a.def;
      if (p.chargeT > 0) this.drawBar(ctx, W / 2 - 60, H / 2 + 24, 120, 10, p.chargeT / def.chargeTime, '#f4d06a');
      if (p.spinUp > 0 && p.spinUp < def.spinUp) this.drawBar(ctx, W / 2 - 60, H / 2 + 24, 120, 10, p.spinUp / def.spinUp, '#efe8d4');
      if (def.kind === 'stream' && p.fireCd > 0) this.drawBar(ctx, W / 2 - 60, H / 2 + 24, 120, 10, 1 - p.fireCd / def.blastCd, '#9fd8ff');
      if (p.arms.some(arm => arm.def.flight === 'mine')) {
        const mines = g.proj.filter(q => q.owner === p && q.def.flight === 'mine').length;
        ctx.font = 'bold 13px Tahoma, sans-serif';
        ctx.fillStyle = '#efe8d4';
        ctx.fillText('Мины: ' + mines + ' из 8', W / 2, H - 56);
      }
      if (p.patient) {
        const t = p.patient;
        ctx.font = 'bold 14px Tahoma, sans-serif';
        ctx.fillStyle = t.hp > t.maxHp ? '#9fd8ff' : '#efe8d4';
        ctx.fillText(t.def.name + ': ' + Math.ceil(t.hp) + ' / ' + t.maxHp, W / 2, H / 2 + 42);
      }
      const boost = p.critT > 0 ? 'КРИТЫ ' + num(p.critT, 1) : p.miniT > 0 ? 'МИНИ-КРИТЫ ' + num(p.miniT, 1) : '';
      if (boost) {
        ctx.font = 'bold 15px Tahoma, sans-serif';
        ctx.fillStyle = p.critT > 0 ? '#8fef6a' : '#f4d06a';
        ctx.fillText(boost, W / 2, H / 2 + 60);
      }
    }

    drawScope(ctx, W, H, p) {
      const r = Math.min(W, H) * 0.46;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - r, H / 2); ctx.lineTo(W / 2 + r, H / 2);
      ctx.moveTo(W / 2, H / 2 - r); ctx.lineTo(W / 2, H / 2 + r);
      ctx.stroke();
      this.drawBar(ctx, W / 2 - 80, H / 2 + r * 0.7, 160, 12, p.scopeCharge, p.scopeCharge >= 1 ? '#8fef6a' : '#f4d06a');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 13px Tahoma, sans-serif';
      ctx.fillStyle = '#efe8d4';
      ctx.fillText('Заряд ' + Math.floor(p.scopeCharge * 100) + ' %', W / 2, H / 2 + r * 0.7 - 4);
    }

    drawHud(cam) {
      const ctx = this.ctx, W = this.hud.width, H = this.hud.height;
      ctx.clearRect(0, 0, W, H);
      if (!this.game) return;
      const g = this.game, p = g.player;
      if (g.world.waterTop(cam.x, cam.y, cam.z) > -Infinity) {
        ctx.fillStyle = 'rgba(24,74,110,0.5)';
        ctx.fillRect(0, 0, W, H);
      }
      if (p.burnT > 0) {
        ctx.fillStyle = 'rgba(230,110,20,0.16)';
        ctx.fillRect(0, 0, W, H);
      }
      if (p.cloaked) {
        ctx.fillStyle = 'rgba(40,60,90,0.28)';
        ctx.fillRect(0, 0, W, H);
      }
      if (p.uberT > 0) {
        ctx.fillStyle = 'rgba(150,210,255,0.14)';
        ctx.fillRect(0, 0, W, H);
      }
      const hurt = this.clock - this.hurtT;
      if (hurt < 0.3) {
        ctx.fillStyle = 'rgba(190,40,20,' + (0.32 * (1 - hurt / 0.3)) + ')';
        ctx.fillRect(0, 0, W, H);
      }
      if (this.renderer) {
        this.drawLabels(ctx, cam, g.map);
        this.drawNames(ctx, cam);
        this.drawNumbers(ctx);
      }
      if (p.scoped) {
        this.drawScope(ctx, W, H, p);
      } else {
        ctx.strokeStyle = '#efe8d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 6, H / 2); ctx.lineTo(W / 2 + 6, H / 2);
        ctx.moveTo(W / 2, H / 2 - 6); ctx.lineTo(W / 2, H / 2 + 6);
        ctx.stroke();
      }

      const team = T.TEAMS[p.team];
      const speed = Math.hypot(p.vel.x, p.vel.z);
      const state = p.burnT > 0 ? 'ГОРИТ ' + num(p.burnT, 1) + ' с' : p.uberT > 0 ? 'НАПОР ' + num(p.uberT, 1) + ' с' : p.level === 3 ? 'Под водой: воздуха ' + num(Math.max(0, p.breath), 1) + ' с' : p.level === 2 ? 'Плывёт' : p.climbing ? 'На лестнице' : p.crouched ? 'Присел' : '';
      const rows = [
        p.def.name + ' · ' + team.name + ' · здоровье ' + Math.ceil(p.hp) + '/' + p.maxHp,
        'Скорость ' + num(speed, 2) + ' м/с (' + Math.round(speed / T.HU) + ' HU/с), норма ' + num(p.def.speed, 2),
        'Последний прыжок ' + num(this.lastJump, 2) + ' м · падение ' + Math.round(this.lastFall / T.HU) + ' HU/с',
        state
      ];
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = 'bold 13px Tahoma, sans-serif';
      ctx.fillStyle = 'rgba(32,30,26,0.72)';
      ctx.fillRect(8, 8, 430, 76);
      ctx.fillStyle = team.color;
      ctx.fillRect(8, 8, 5, 76);
      ctx.fillStyle = '#efe8d4';
      rows.forEach((text, i) => ctx.fillText(text, 20, 13 + i * 18));

      this.drawArms(ctx, W, H);
      this.drawBuildPanel(ctx, W, H);
      this.drawSpy(ctx, W, H);
      this.drawKnight(ctx, W, H);
      this.drawMatch(ctx, W, H);

      ctx.textBaseline = 'top';
      ctx.font = '12px Tahoma, sans-serif';
      const help = (p.flag ? 'L бросить вентиль · ' : '') + '1–3, колесо, Q оружие · ЛКМ огонь · ПКМ второе действие · R зарядить · Ctrl или Shift присесть · , наёмник · . сторона · B крит · V мини-крит · P старт · Esc пауза';
      const w = ctx.measureText(help).width + 16;
      ctx.fillStyle = 'rgba(32,30,26,0.72)';
      ctx.fillRect(W / 2 - w / 2, H - 28, w, 20);
      ctx.fillStyle = '#efe8d4';
      ctx.textAlign = 'center';
      ctx.fillText(help, W / 2, H - 25);

      if (this.mode === 'play' && document.pointerLockElement !== this.canvas) {
        ctx.font = 'bold 14px Tahoma, sans-serif';
        ctx.fillStyle = '#efe8d4';
        ctx.fillText('Щёлкните по игре, чтобы взять мышь', W / 2, H * 0.58);
      }

      if (this.note && this.clock < this.noteT) {
        ctx.font = 'bold 18px Tahoma, sans-serif';
        ctx.fillStyle = '#f4d06a';
        ctx.fillText(this.note, W / 2, H * 0.68);
      }
    }

    resize() {
      const w = Math.max(320, this.root.clientWidth | 0), h = Math.max(240, this.root.clientHeight | 0);
      this.hud.width = w;
      this.hud.height = h;
      if (this.renderer) this.renderer.resize(w, h);
    }

    destroy() {
      if (this.dead) return;
      this.dead = true;
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      window.removeEventListener('keydown', this.onKey, true);
      window.removeEventListener('keyup', this.onKeyUp, true);
      window.removeEventListener('blur', this.onBlur);
      window.removeEventListener('mouseup', this.onUp);
      document.removeEventListener('mousemove', this.onMove);
      document.removeEventListener('pointerlockchange', this.onLock);
      this.releaseMouse();
      this.audio.close();
      if (this.renderer) this.renderer.destroy();
      this.renderer = null;
      this.game = null;
      this.root.innerHTML = '';
    }
  }

  T.UI = UI;
})(globalThis.Tf98 = globalThis.Tf98 || {});
