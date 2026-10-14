(function (M) {
  'use strict';
  const PROFILE_KEY = 'mp98_profile_v1';
  const OPTS_KEY = 'mp98_opts_v1';
  const SAVES_KEY = 'mp98_saves_v1';
  const OPTS_DEF = { sens: 4, invert: false, fov: 70, sfx: 0.8, music: 0.5, gamma: 1.0, scale: 1, subs: true, hud: true, grain: true, blood: true };
  const KEYS = {
    KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
    Space: 'jump', KeyC: 'crouch', ControlLeft: 'crouch', ControlRight: 'crouch', AltLeft: 'walk', AltRight: 'walk', CapsLock: 'walk'
  };
  const EDGE = { KeyR: 'reload', KeyE: 'use', KeyF: 'use', KeyH: 'heal', Backspace: 'heal', KeyG: 'throwQuick', KeyQ: 'dodge', ShiftLeft: 'bt', ShiftRight: 'bt', KeyX: 'cover' };

  function loadJSON(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v || d; } catch (e) { return d; } }
  function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  const raf = () => M.nextFrame();
  M.nextFrame = () => new Promise(r => { if (M.fastFrames) setTimeout(r, 0); else requestAnimationFrame(() => r()); });

  class UI {
    constructor(root, host) {
      this.host = host || {};
      this.root = root;
      this.opts = Object.assign({}, OPTS_DEF, loadJSON(OPTS_KEY, {}));
      this.profile = Object.assign({ chapters: { tutorial: true, prologue: true }, doneI: false, difficulty: 1, deaths: {} }, loadJSON(PROFILE_KEY, {}));
      this.saves = loadJSON(SAVES_KEY, {});
      this.build();
      try { this.r = new M.Renderer(this.view, { preserve: !!this.host.preserve }); }
      catch (e) { this.glError = String(e && e.message || e); this.r = null; }
      this.fx = new M.FX();
      this.hud = new M.HUD(this.hudCv);
      this.audio = new M.Audio();
      this.fx.onClink = pos => this.audio.play('clink', pos);
      this.novel = new M.Novel(this);
      this.menu = new M.Menu(this);
      this.keys = {};
      this.edges = {};
      this.mouse = { fire: false, pressed: false };
      this.yaw = 0; this.pitch = 0;
      this.mode = 'menu';
      this.acc = 0;
      this.last = 0;
      this.time = 0;
      this.hurt = 0;
      this.flash = 0;
      this.game = null;
      this.applyOpts();
      this.bind();
      this.menu.show('main');
      this.raf = requestAnimationFrame(t => this.frame(t));
    }

    build() {
      const el = document.createElement('div');
      el.className = 'mpx';
      el.tabIndex = 0;
      el.innerHTML = '<canvas class="mpx-view"></canvas><canvas class="mpx-hud"></canvas><canvas class="mpx-novel"></canvas><div class="mpx-layer mpx-menu"></div><div class="mpx-note"></div><div class="mpx-loading"><div class="mpx-load-title"></div><div class="mpx-load-sub"></div><div class="mpx-load-bar"><div></div></div></div>';
      this.root.appendChild(el);
      this.el = el;
      this.view = el.querySelector('.mpx-view');
      this.hudCv = el.querySelector('.mpx-hud');
      this.novelCv = el.querySelector('.mpx-novel');
      this.menuEl = el.querySelector('.mpx-menu');
      this.noteEl = el.querySelector('.mpx-note');
      this.loadEl = el.querySelector('.mpx-loading');
    }

    active() { return this.host.isActive ? this.host.isActive() : true; }
    saveProfile() { saveJSON(PROFILE_KEY, this.profile); }
    applyOpts() {
      const o = this.opts;
      saveJSON(OPTS_KEY, o);
      this.audio.setVolume(o.sfx, o.music);
      if (this.r) { this.r.gamma = o.gamma; this.r.scale = o.scale; }
    }

    bind() {
      const el = this.el;
      this.onKeyDown = e => {
        if (!this.active()) return;
        this.audio.init(); this.audio.resume();
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
        if (this.mode === 'novel') { e.preventDefault(); this.novel.key(e.code === 'Escape' ? 'skip' : 'next'); return; }
        if (this.mode === 'note') { e.preventDefault(); this.closeNote(); return; }
        if (e.code === 'Escape') {
          e.preventDefault();
          if (this.mode === 'play') this.pause();
          else if (this.mode === 'paused') this.resume();
          else if (this.mode === 'menu') this.menu.back();
          return;
        }
        if (this.mode !== 'play') return;
        const k = KEYS[e.code];
        if (k || EDGE[e.code] || /^Digit[1-9]$/.test(e.code) || e.code === 'Tab' || e.code === 'F5' || e.code === 'F9') e.preventDefault();
        if (k) this.keys[k] = true;
        if (EDGE[e.code] && !e.repeat) this.edges[EDGE[e.code]] = true;
        if (/^Digit[1-5]$/.test(e.code) && !e.repeat) this.edges.slot = Number(e.code.slice(5));
        if (e.code === 'Tab') this.showThought = true;
        if (e.code === 'F5' && !e.repeat) this.quickSave();
        if (e.code === 'F9' && !e.repeat) this.quickLoad();
        if (e.code === 'Enter' && !e.repeat && this.game) this.game.skipLine();
      };
      this.onKeyUp = e => {
        const k = KEYS[e.code];
        if (k) this.keys[k] = false;
        if (e.code === 'Tab') this.showThought = false;
      };
      this.onMouseMove = e => {
        if (this.mode !== 'play' || (!this.locked() && !this.host.noLock)) return;
        const s = this.opts.sens * 0.00052;
        this.yaw = M.wrap(this.yaw - e.movementX * s);
        this.pitch = M.clamp(this.pitch - e.movementY * s * (this.opts.invert ? -1 : 1), -1.25, 1.2);
      };
      this.onMouseDown = e => {
        this.audio.init(); this.audio.resume();
        if (this.mode === 'novel') { this.novel.key('next'); e.preventDefault(); return; }
        if (this.mode === 'note') { this.closeNote(); e.preventDefault(); return; }
        if (this.mode !== 'play') return;
        if (!this.locked()) { this.lock(); if (!this.host.noLock) { e.preventDefault(); return; } }
        if (e.button === 0) { this.mouse.fire = true; this.mouse.pressed = true; }
        if (e.button === 2) this.edges.alt = true;
        e.preventDefault();
      };
      this.onMouseUp = e => { if (e.button === 0) this.mouse.fire = false; };
      this.onWheel = e => {
        if (this.mode !== 'play') return;
        e.preventDefault();
        if (e.deltaY > 0) this.edges.next = true; else if (e.deltaY < 0) this.edges.prev = true;
      };
      this.onContext = e => e.preventDefault();
      this.onBlur = () => { this.keys = {}; this.mouse.fire = false; };
      this.onLockChange = () => {
        if (!this.locked() && this.mode === 'play' && !this.host.noLock && !this.suppressPause) this.pause();
        this.suppressPause = false;
      };
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      window.addEventListener('mousemove', this.onMouseMove);
      el.addEventListener('mousedown', this.onMouseDown);
      window.addEventListener('mouseup', this.onMouseUp);
      el.addEventListener('wheel', this.onWheel, { passive: false });
      el.addEventListener('contextmenu', this.onContext);
      window.addEventListener('blur', this.onBlur);
      document.addEventListener('pointerlockchange', this.onLockChange);
    }

    locked() { return document.pointerLockElement === this.view; }
    lock() {
      if (this.host.noLock || !this.view.requestPointerLock) return;
      try { const r = this.view.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { }
    }
    unlock() {
      if (this.locked()) { this.suppressPause = true; try { document.exitPointerLock(); } catch (e) { } }
    }

    destroy() {
      cancelAnimationFrame(this.raf);
      this.destroyed = true;
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mouseup', this.onMouseUp);
      window.removeEventListener('blur', this.onBlur);
      document.removeEventListener('pointerlockchange', this.onLockChange);
      this.unlock();
      this.audio.dispose();
      if (this.r) this.r.dispose();
      this.el.remove();
    }

    frame(ts) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(t => this.frame(t));
      const dt = Math.min(0.1, this.last ? (ts - this.last) / 1000 : 0.016);
      this.last = ts;
      this.time += dt;
      this.tick(dt);
    }

    tick(dt) {
      const w = this.el.clientWidth || 800, h = this.el.clientHeight || 600;
      if (this.r) this.r.resize(w, h);
      this.hud.resize(w, h);
      if (this.mode === 'novel') { this.novel.frame(dt); this.hud.clear(); return; }
      if (this.mode === 'menu' || this.mode === 'loading') {
        this.hud.clear();
        if (this.menuScene && this.r && this.mode === 'menu') this.renderMenuScene(dt);
        return;
      }
      if (!this.game) return;
      const g = this.game;
      if (this.mode === 'play') {
        this.acc += dt;
        let steps = 0;
        while (this.acc >= M.TICK && steps < 5) {
          g.step(this.input(steps === 0));
          this.acc -= M.TICK;
          steps++;
          this.consume(g);
          if (this.mode !== 'play') break;
        }
        if (this.acc > M.TICK * 5) this.acc = 0;
      }
      const wdt = dt * (g.scale || 1);
      this.fx.update(this.mode === 'play' ? wdt : 0, g, this.camPos);
      this.hurt = Math.max(0, this.hurt - dt * 1.5);
      this.flash = Math.max(0, this.flash - dt * 3);
      this.updateCamera(dt);
      this.updateAudio(dt);
      if (this.r) this.renderGame();
      this.hud.draw(this, g, this.time);
      if (this.showThought && g.thought) this.hud.centerText(this.hud.c, w, h * 0.22, g.thought, 14, 1);
      if (g.player.dead && this.mode === 'play') {
        if (g.player.deadT > 2.8) this.onDeath();
      }
    }

    input(first) {
      const k = this.keys;
      const inp = {
        yaw: this.yaw, pitch: this.pitch,
        fwd: !!k.fwd, back: !!k.back, left: !!k.left, right: !!k.right, crouch: !!k.crouch, walk: !!k.walk,
        fire: this.mouse.fire, firePressed: first && this.mouse.pressed, aim: this.aimPoint
      };
      if (first) {
        Object.assign(inp, this.edges);
        inp.jump = !!(k.jump && !this.jumpHeld);
        this.jumpHeld = !!k.jump;
        this.edges = {};
        this.mouse.pressed = false;
      }
      return inp;
    }

    consume(g) {
      for (const ev of g.events) this.onEvent(ev, g);
      g.events.length = 0;
    }

    onEvent(ev, g) {
      this.fx.handle(ev, g);
      this.hud.event(ev, this.time);
      const a = this.audio;
      switch (ev.t) {
        case 'shot': a.play(ev.npc && ev.weapon === 'training' ? 'training' : ev.weapon === 'beretta2' ? 'beretta' : ev.weapon === 'ingram2' ? 'ingram' : ev.weapon, ev.pos, { vol: ev.npc ? 0.8 : 1 }); if (!ev.npc) this.kick = Math.min(0.06, (this.kick || 0) + (ev.weapon === 'pump' || ev.weapon === 'sawed' || ev.weapon === 'deagle' ? 0.045 : 0.015)); this.combatT = this.time; break;
        case 'impact': a.play('impact_' + (ev.mat === 'wood' || ev.mat === 'metal' || ev.mat === 'snow' ? ev.mat : 'stone'), ev.pos); if (ev.mat === 'metal' && Math.random() < 0.3) a.play('ric', ev.pos); break;
        case 'blood': a.play('impact_flesh', ev.pos); break;
        case 'explode': a.play('explode', ev.pos); this.flash = Math.max(this.flash, M.clamp(0.5 - M.dist(ev.pos, g.player.pos) / 40, 0, 0.5)); break;
        case 'glass': a.play('glass', ev.pos); break;
        case 'molotov': a.play('molotov', ev.pos); break;
        case 'sfx': a.play(ev.id, ev.pos); break;
        case 'step': a.play('step', ev.pos, { snow: ev.snow }); break;
        case 'whiz': a.play('whiz', ev.pos); break;
        case 'hurt': this.hurt = Math.min(1, this.hurt + (ev.burn ? 0.15 : 0.35 + ev.dmg / 60)); break;
        case 'bt': a.setBT(ev.on); break;
        case 'locked': a.play('locked', null); break;
        case 'death': a.play('death'); a.setBT(false); this.deathT = this.time; break;
        case 'kill': if (ev.boss) this.flash = 0.15; break;
        case 'note': this.showNote(ev); break;
        case 'novel': this.midNovel(ev.page); break;
        case 'complete': this.onComplete(); break;
        case 'fail': this.onFail(ev.text); break;
        case 'checkpoint': this.autoSave(); break;
        case 'music': a.playMusic(ev.id); break;
        case 'ring': a.play('ring', ev.pos); break;
        case 'group': break;
        case 'cover': if (ev.on) { a.play('cover', g.player.pos); this.kick = Math.min(0.06, (this.kick || 0) + 0.02); } break;
        case 'thunder': a.play('thunder'); this.lightning = 1; break;
        case 'siren': a.play('siren', ev.pos); break;
      }
    }

    updateCamera(dt) {
      const g = this.game, p = g.player, w = g.world;
      const yaw = this.yaw, pitch = this.pitch;
      if (g.cine) {
        const c = g.cine;
        let from = c.from, at = c.at;
        if (c.follow) { const ch = g.char(c.follow); if (ch) at = [ch.pos[0], ch.pos[1] + 1.4, ch.pos[2]]; }
        if (c.followProp) { const pr = g.prop(c.followProp); if (pr && pr.origin) at = [pr.origin[0], pr.origin[1] + 1, pr.origin[2]]; }
        if (c.to) from = M.mix3(c.from, c.to, M.smooth(c.t / c.dur));
        this.camPos = from.slice();
        this.camTarget = at.slice();
        this.fov = (c.fov || 60) * Math.PI / 180;
        return;
      }
      const post = p.posture;
      const want = post === 'cover' ? 1.4 : post === 'crouch' ? 1.1 : post === 'lie' ? 0.55 : post === 'dive' ? 0.8 : 1.62;
      this.pivotH = this.pivotH === undefined ? want : M.lerp(this.pivotH, want, Math.min(1, dt * 10));
      const cv = p.cover;
      let sideT = 0.62;
      if (cv) {
        const dir = cv.edge || cv.side;
        if (dir) {
          const r0 = M.rightOf(yaw);
          this.camSign = cv.tR[0] * dir * r0[0] + cv.tR[2] * dir * r0[2] >= 0 ? 1 : -1;
        }
        sideT = 0.62 * (this.camSign || 1) * (cv.tall && cv.edge ? 1.35 : 1);
      } else this.camSign = 1;
      this.camSide = this.camSide === undefined ? sideT : M.lerp(this.camSide, sideT, Math.min(1, dt * 6));
      const pivot = [p.pos[0], p.pos[1] + this.pivotH, p.pos[2]];
      if (p.dead) {
        const t = g.player.deadT;
        const a = yaw + t * 0.9;
        const from = [p.pos[0] + Math.sin(a) * 3.2, p.pos[1] + 1.6 + t * 0.35, p.pos[2] + Math.cos(a) * 3.2];
        const hit = w.raycast(pivot, M.sub(from, pivot), { noGlass: true });
        this.camPos = hit ? M.addScaled(pivot, M.sub(from, pivot), Math.max(0.1, hit.t - 0.1)) : from;
        this.camTarget = [p.pos[0], p.pos[1] + 0.4, p.pos[2]];
        this.fov = 1.1;
        return;
      }
      const dir = M.dirFromYawPitch(yaw, pitch);
      const r = M.rightOf(yaw);
      const back = g.bt.on ? 2.25 : 2.55;
      const side = this.camSide;
      const shoulder = M.addScaled(pivot, r, side * 0.35);
      const desired = [pivot[0] - dir[0] * back + r[0] * side, pivot[1] - dir[1] * back + 0.2, pivot[2] - dir[2] * back + r[2] * side];
      const seg = M.sub(desired, shoulder);
      const hit = w.raycast(shoulder, seg, { noGlass: true });
      let cp = hit ? M.addScaled(shoulder, seg, Math.max(0, hit.t - 0.12 / M.len(seg))) : desired;
      for (let k = 0; k < 12; k++) {
        const R = 0.2;
        if (!w.overlaps([cp[0] - R, cp[1] - R, cp[2] - R], [cp[0] + R, cp[1] + R, cp[2] + R])) break;
        cp = M.mix3(cp, shoulder, 0.18);
      }
      if (this.camPos && !hit) cp = M.mix3(this.camPos, cp, Math.min(1, dt * 18));
      const sh = this.fx.shake + (this.kick || 0);
      this.kick = Math.max(0, (this.kick || 0) - dt * 0.4);
      const jit = sh ? [(Math.random() - 0.5) * sh * 0.12, (Math.random() - 0.5) * sh * 0.12, (Math.random() - 0.5) * sh * 0.12] : [0, 0, 0];
      this.camPos = M.add(cp, jit);
      this.camTarget = M.addScaled(this.camPos, dir, 20);
      const baseFov = this.opts.fov * Math.PI / 180;
      this.fov = M.lerp(this.fov || baseFov, g.bt.on ? baseFov * 0.9 : baseFov, Math.min(1, dt * 5));
      this.computeAim(dir);
    }

    computeAim(dir) {
      const g = this.game, p = g.player;
      const start = M.addScaled(this.camPos, dir, Math.max(0.5, M.dist(this.camPos, [p.pos[0], p.pos[1] + 1.5, p.pos[2]]) * 0.9));
      const seg = M.scale(dir, 90);
      const hit = g.world.raycast(start, seg, { noGlass: true });
      let t = hit ? hit.t : 1;
      let enemy = false;
      for (const c of g.chars) {
        if (c.state !== 'alive' || c.friendly || c.noHit) continue;
        if (M.dist(c.pos, p.pos) > 90) continue;
        for (const s of M.bodySpheres(c)) {
          const tt = M.segSphere(start, seg, s.c, s.r + 0.02);
          if (tt >= 0 && tt < t) { t = tt; enemy = !c.civilian; }
        }
      }
      this.aimPoint = M.addScaled(start, seg, t);
      this.aimEnemy = enemy;
    }

    actorsFor(g) {
      const list = [];
      const p = g.player;
      const W = p.cur ? M.WEAPONS[p.cur] : null;
      this.phase = (this.phase || 0) + (p.anim ? p.anim.speed : 0) * (this.lastWdt || 0) / 2.3 * Math.PI;
      const pstate = {
        t: this.time, phase: this.phase, move: p.anim ? p.anim.move : [0, 0], speed: p.anim ? p.anim.speed : 0, crouch: p.crouch, air: p.anim && p.anim.air,
        hold: W ? W.hold : 'none', pitch: this.pitch, fireT: p.fireT, side: p.dualSide === 1 ? 0 : 1,
        reloadT: p.reload > 0 ? (M.WEAPONS[p.cur] ? M.WEAPONS[p.cur].reload - p.reload : 9) : 9,
        throwT: p.throwT > 0 ? 0.26 - p.throwT : 0.26 + (g.time - (p.throwRelT === undefined ? -9 : p.throwRelT)),
        swingT: p.swingT !== undefined ? g.time - p.swingT : 9,
        flinchT: p.hurtT
      };
      if (p.dodge) pstate.dive = { phase: p.dodge.phase === 'up' ? 'down' : p.dodge.phase, dir: [p.dodge.dir[0], 0, p.dodge.dir[1]] };
      pstate.aimDir = M.dirFromYawPitch(this.yaw, this.pitch);
      pstate.yaw = this.yaw;
      if (p.dead) pstate.death = { kind: 'back', t: p.deadT * 0.6 };
      if (p.dodge && p.dodge.phase === 'up') { pstate.dive = null; pstate.crouch = true; }
      const wdt = this.lastWdt || 0;
      const ga = this.gaitP || (this.gaitP = { feet: this.yaw, turn: 0, turnT: 0, stopT: 9, peak: 0 });
      this.gait(ga, this.yaw, pstate.speed, wdt, !p.cover && !p.dodge && p.onGround && !p.crouch && !p.dead);
      Object.assign(pstate, { feet: M.wrap(ga.feet - this.yaw), turn: ga.turn, turnT: ga.turnT, stopT: ga.stopT, airT: p.airT || 0, jumped: p.jumpT <= (p.airT || 0) + 0.05, land: p.land, seed: 0 });
      pstate.cover = this.coverState(p);
      list.push({ key: 'player', look: 'max', seed: 1, pos: p.pos, yaw: this.yaw, state: pstate, weapon: p.cur });
      for (const c of g.chars) {
        if (c.state === 'hidden' || c.invisible) continue;
        if (M.dist(c.pos, p.pos) > 70) continue;
        c.phase = (c.phase || 0) + (c.anim.speed || 0) * wdt / 2.3 * Math.PI;
        const Wc = c.weapon ? M.WEAPONS[c.weapon] : null;
        const seed = c.seed || (c.id.charCodeAt(0) * 31 + c.id.length * 7 + (c.id.charCodeAt(c.id.length - 1) || 0));
        const gc = c.anim.gait || (c.anim.gait = { feet: c.yaw, turn: 0, turnT: 0, stopT: 9, peak: 0 });
        this.gait(gc, c.yaw, c.anim.speed || 0, wdt, c.state === 'alive' && c.posture === 'stand' && !c.pose);
        const st = {
          seed, feet: M.wrap(gc.feet - c.yaw), turn: gc.turn, turnT: gc.turnT, stopT: gc.stopT,
          cover: c.anim.coverK > 0.01 && c.anim.coverYaw !== undefined && c.state === 'alive' ? { tall: false, k: c.anim.coverK, enter: -1, out: -1, slide: 0, dist: 0, edge: 0, wall: M.wrap(c.anim.coverYaw - c.yaw) } : null,
          t: this.time + (c.id.length * 1.3), phase: c.phase, move: c.anim.move, speed: c.anim.speed, crouch: c.posture === 'crouch',
          hold: Wc && (c.anim.aim || c.ai.mode === 'combat' || c.ai.mode === 'hostage' || c.ai.mode === 'flee' || c.ai.mode === 'hold') ? Wc.hold : 'none', aim: true,
          pitch: 0, fireT: c.anim.fireT, side: c.anim.side === 1 ? 0 : 1, flinchT: c.anim.flinchT, reloadT: c.ai.reload > 0 ? 0.3 : 9,
          throwT: c.anim.throwT, swingT: c.anim.swingT, burn: c.anim.burn, special: c.pose && c.state !== 'dead' ? c.pose : c.anim.hands ? 'hands' : c.anim.hostage ? 'hostage' : c.ai.mode === 'cower' ? 'cower' : null
        };
        if (c.state === 'alive' && c.ai.aiming) {
          const dp = M.sub([p.pos[0], p.pos[1] + 1.3, p.pos[2]], [c.pos[0], c.pos[1] + 1.4, c.pos[2]]);
          st.pitch = Math.atan2(dp[1], Math.hypot(dp[0], dp[2]));
        }
        if (c.state === 'dead') st.death = c.anim.death || { kind: 'back', t: 9 };
        if (c.type === 'dummy') list.push({ key: c.id, look: 'dummy', pos: c.pos, yaw: c.yaw, lie: c.state === 'dead' || c.posture === 'lie', state: st });
        else list.push({ key: c.id, look: (M.ENEMY[c.type] || {}).look || 'thug', seed, pos: c.pos, yaw: c.state === 'dead' ? c.lieYaw : c.yaw, state: st, weapon: c.state === 'dead' ? null : c.weapon });
      }
      return list;
    }

    gait(a, yaw, speed, dt, free) {
      if (!free || speed > 0.4) { a.feet = yaw; a.turn = 0; }
      else {
        const d = M.wrap(yaw - a.feet);
        if (!a.turn && Math.abs(d) > 0.85) { a.turn = Math.sign(d); a.turnT = 0; }
        if (a.turn) {
          a.turnT += dt;
          if (Math.abs(d) > 0.05) a.turn = Math.sign(d);
          a.feet = M.turnTo(a.feet, yaw, dt * 4.5);
          if (Math.abs(M.wrap(yaw - a.feet)) < 0.02 && a.turnT > 0.4) a.turn = 0;
        }
      }
      if (speed > 1.5) { a.peak = Math.max(a.peak, speed); a.stopT = 9; }
      else if (a.peak > 3.4 && speed < 1.2 && free) { a.peak = 0; a.stopT = 0; }
      else { a.stopT += dt; if (speed < 1.2) a.peak = 0; }
    }

    coverState(p) {
      const cv = p.cover, co = p.coverOut;
      if (cv) return { tall: cv.tall, k: 1 - M.smooth(cv.pop), enter: cv.enter < 1 ? cv.enter : -1, out: -1, slide: cv.slide, dist: cv.dist, edge: cv.tall ? cv.edge : 0, wall: M.wrap(M.yawOf(-cv.n[0], -cv.n[2]) - this.yaw) };
      if (co && !p.dodge && co.t < 0.45 && (co.why === 'key' || co.why === 'away' || co.why === 'lost')) return { tall: co.tall, k: 1, enter: -1, out: co.t / 0.45, slide: 0, dist: 0, edge: 0, wall: M.wrap(M.yawOf(-co.n[0], -co.n[2]) - this.yaw) };
      return null;
    }

    renderGame() {
      const g = this.game;
      this.lastWdt = (this.mode === 'play' ? 1 / 60 * (g.scale || 1) : 0) * Math.max(1, Math.round(1 / 60 / M.TICK));
      const dyn = this.fx.dynLights(g).concat(g.def.dynLights ? g.def.dynLights(g, this.time) : []).slice(0, 8);
      const deathK = g.player.dead ? Math.min(1, g.player.deadT / 1.5) : 0;
      this.lightning = Math.max(0, (this.lightning || 0) - 0.04);
      this.r.render({
        cam: { pos: this.camPos, target: this.camTarget, fov: this.fov || 1.2 },
        game: g, fx: this.fx, dyn, time: this.time,
        props: g.props, items: g.items, actors: this.actorsFor(g), throws: g.throws,
        bt: g.bt.on && !g.player.dead ? 1 : 0, hurt: this.hurt, death: deathK, flash: this.flash + this.lightning * 0.25, lightning: this.lightning,
        grain: this.opts.grain ? 0.035 : 0, heal: g.player.heal > 0 ? 0.6 : 0
      });
    }

    updateAudio(dt) {
      const a = this.audio, g = this.game;
      if (!a.ctx) return;
      a.listener.pos = this.camPos || g.player.pos;
      a.listener.yaw = this.yaw;
      for (const f of g.fires) a.loop('fire' + g.fires.indexOf(f), 'fire', f.pos, 0.25);
      for (const p of g.props) {
        if (p.kind === 'mover' && p.moving && (p.model === 'train' || p.model === 'eltrain' || p.model === 'mercedes')) a.loop('mv:' + p.id, 'train', p.origin, 0.5);
        if (p.kind === 'phone' && p.ringing && this.time - (p.ringAudio || -9) > 4) { p.ringAudio = this.time; a.play('ring', p.pos); }
      }
      if (g.world.weather === 'snow' || g.world.weather === 'blizzard') a.loop('wind', 'wind', null, g.isOutdoor(g.player.pos) ? 0.12 : 0.035);
      if (g.world.weather === 'rain') a.loop('rain', 'rain', null, g.isOutdoor(g.player.pos) ? 0.12 : 0.04);
      a.sweepLoops();
    }

    async startLevel(id, o) {
      o = o || {};
      if (!this.r) { this.menu.show('glerr'); return; }
      this.unlock();
      this.mode = 'loading';
      this.menu.hide();
      const def = M.levels[id];
      this.loadEl.style.display = 'flex';
      this.loadEl.querySelector('.mpx-load-title').textContent = M.chapterLabel(def);
      this.loadEl.querySelector('.mpx-load-sub').textContent = def.part > 0 ? 'Часть I. Американская мечта' : def.id === 'prologue' ? 'Часть I. Американская мечта' : 'Макс Пейн';
      const bar = this.loadEl.querySelector('.mpx-load-bar div');
      bar.style.width = '0%';
      this.audio.stopMusic();
      this.audio.stopLoops();
      this.audio.setBT(false);
      await raf(); await raf();
      if (this.destroyed) return;
      this.difficulty = o.difficulty !== undefined ? o.difficulty : (this.difficulty !== undefined ? this.difficulty : this.profile.difficulty || 1);
      const deaths = (this.profile.deaths[id] || 0);
      const adapt = M.clamp(1 - deaths * 0.05, 0.72, 1);
      if (this.levelScene && this.r) { this.r.disposeScene(this.levelScene); this.levelScene = null; }
      this.novel.dropScenes();
      const g = new M.Game({ level: id, difficulty: this.difficulty, seed: 1 + Math.floor(Math.random() * 1e6), carry: o.carry, snapshot: o.snapshot, adapt });
      this.game = g;
      this.levelId = id;
      this.r.loadWorld(g.world, { keep: false });
      let prog = 0;
      while (!this.r.bakeDone) {
        prog = this.r.bakeStep(40);
        bar.style.width = Math.round(prog * 100) + '%';
        await raf();
        if (this.destroyed || this.game !== g) return;
      }
      this.levelScene = this.r.captureScene();
      this.fx.reset();
      this.hud.hints = [];
      this.yaw = g.player.yaw;
      this.pitch = 0;
      this.camPos = null;
      this.pivotH = undefined;
      this.camSide = undefined;
      this.gaitP = null;
      this.loadEl.style.display = 'none';
      this.deathT = null;
      this.consume(g);
      if (!o.snapshot && def.intro && !o.skipIntro) await this.novel.play(def.intro, { chapter: def });
      if (this.destroyed || this.game !== g) return;
      this.r.useScene(this.levelScene);
      this.dosSaves = this.difficultyDef().saves;
      if (!o.snapshot) this.autoSave();
      this.audio.playMusic(g.flags.music || def.music || 'ambient');
      this.mode = 'play';
      this.lock();
      this.el.focus({ preventScroll: true });
    }

    difficultyDef() { return M.DIFFICULTY[this.difficulty] || M.DIFFICULTY[1]; }

    async midNovel(page) {
      this.mode = 'novel';
      this.unlock();
      await this.novel.play(page, {});
      if (this.destroyed) return;
      this.r.useScene(this.levelScene);
      this.mode = 'play';
      this.lock();
    }

    async onComplete() {
      const g = this.game;
      const def = g.def;
      this.mode = 'novel';
      this.unlock();
      this.audio.setBT(false);
      const carry = g.carry();
      const order = M.levelOrder;
      const next = def.next !== undefined ? def.next : order[order.indexOf(def.id) + 1];
      if (next) this.profile.chapters[next] = true;
      if (def.id === 'empire') { this.profile.doneI = true; for (const d of M.DIFFICULTY) d.locked = false; }
      this.profile.deaths[def.id] = 0;
      this.saveProfile();
      if (def.outro) await this.novel.play(def.outro, {});
      if (this.destroyed) return;
      if (def.id === 'tutorial') { this.game = null; this.mode = 'menu'; this.menu.show('main'); return; }
      if (!next) { this.game = null; this.mode = 'menu'; this.audio.playMusic('theme'); this.menu.show('credits'); return; }
      this.startLevel(next, { carry, difficulty: this.difficulty });
    }

    onFail(text) {
      this.mode = 'dead';
      this.unlock();
      this.menu.show('dead', { text });
    }

    onDeath() {
      if (this.mode !== 'play') return;
      this.mode = 'dead';
      this.unlock();
      this.profile.deaths[this.levelId] = (this.profile.deaths[this.levelId] || 0) + 1;
      this.saveProfile();
      this.audio.setBT(false);
      this.menu.show('dead', {});
    }

    pause() {
      if (this.mode !== 'play') return;
      this.mode = 'paused';
      this.unlock();
      this.audio.setBT(false);
      this.menu.show('pause');
    }
    resume() {
      if (!this.game) return;
      this.menu.hide();
      this.mode = 'play';
      if (this.game.bt.on) this.audio.setBT(true);
      this.lock();
      this.el.focus({ preventScroll: true });
    }

    showNote(ev) {
      this.mode = 'note';
      this.unlock();
      this.noteEl.innerHTML = '';
      const d = document.createElement('div');
      d.className = 'mpx-paper';
      const h = document.createElement('div');
      h.className = 'mpx-paper-title';
      h.textContent = ev.title || '';
      const b = document.createElement('div');
      b.className = 'mpx-paper-body';
      b.textContent = ev.text || '';
      const f = document.createElement('div');
      f.className = 'mpx-paper-foot';
      f.textContent = 'Щёлкните или нажмите любую клавишу';
      d.append(h, b, f);
      this.noteEl.appendChild(d);
      this.noteEl.style.display = 'flex';
      this.audio.play('page');
    }
    closeNote() {
      this.noteEl.style.display = 'none';
      this.mode = 'play';
      this.lock();
    }

    saveList() { return this.saves; }
    storeSaves() {
      if (!saveJSON(SAVES_KEY, this.saves)) {
        const keys = Object.keys(this.saves).filter(k => k !== 'quick' && k !== 'auto').sort((a, b) => this.saves[a].at - this.saves[b].at);
        while (keys.length && !saveJSON(SAVES_KEY, this.saves)) delete this.saves[keys.shift()];
      }
    }
    makeSave(label) {
      const g = this.game;
      return { at: Date.now(), level: g.levelId, title: M.chapterLabel(g.def), label: label || '', difficulty: this.difficulty, yaw: this.yaw, pitch: this.pitch, snap: g.snapshot() };
    }
    canSave() {
      if (!this.game || this.game.player.dead || this.game.done) return false;
      if (this.dosSaves >= 0 && this.dosSaves <= 0) return false;
      return true;
    }
    quickSave() {
      if (!this.canSave()) { this.saveFlash = { text: 'Сохранение невозможно', t: this.time }; return; }
      this.saves.quick = this.makeSave('Быстрое сохранение');
      if (this.dosSaves > 0) this.dosSaves--;
      this.storeSaves();
      this.saveFlash = { text: this.dosSaves >= 0 ? `Игра сохранена. Осталось сохранений: ${this.dosSaves}` : 'Игра сохранена', t: this.time };
    }
    manualSave(slot) {
      if (!this.canSave()) return false;
      this.saves['slot' + slot] = this.makeSave('Сохранение ' + slot);
      if (this.dosSaves > 0) this.dosSaves--;
      this.storeSaves();
      return true;
    }
    autoSave() {
      if (!this.game || this.game.player.dead) return;
      this.saves.auto = this.makeSave('Автосохранение');
      this.storeSaves();
      this.saveFlash = { text: 'Контрольная точка', t: this.time };
    }
    quickLoad() {
      const s = this.saves.quick || this.saves.auto;
      if (s) this.loadSave(s);
    }
    loadSave(s) {
      if (!s) return;
      this.menu.hide();
      this.startLevel(s.level, { snapshot: s.snap, difficulty: s.difficulty }).then(() => {
        if (s.yaw !== undefined) { this.yaw = s.yaw; this.pitch = s.pitch || 0; }
      });
    }
    restartLevel() {
      const s = this.saves.auto && this.saves.auto.level === this.levelId ? this.saves.auto : null;
      if (s) this.loadSave(s);
      else this.startLevel(this.levelId, { difficulty: this.difficulty, skipIntro: true });
    }

    quitToMenu() {
      this.game = null;
      this.mode = 'menu';
      this.unlock();
      this.audio.setBT(false);
      this.audio.stopLoops();
      this.audio.playMusic('theme');
      this.menu.show('main');
    }

    renderMenuScene() { }
  }
  M.UI = UI;

  M.chapterLabel = def => {
    if (!def) return '';
    if (def.id === 'tutorial') return 'Обучение';
    if (def.id === 'prologue') return 'Пролог';
    return 'Глава ' + def.chapter + '. ' + def.title;
  };
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
