(function (Q) {
  'use strict';
  const WP = Q.WP;
  const PROFILE_KEY = 'q3a_profile_v1';
  const DEMO_KEY = 'q3a_demos_v1';
  const KEYS = {
    KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', KeyD: 'right',
    Space: 'jump', KeyC: 'crouch', ControlLeft: 'crouch', ShiftLeft: 'walk', ShiftRight: 'walk',
    Enter: 'use', KeyF: 'use', KeyG: 'gesture', Tab: 'scores', KeyE: 'zoom'
  };
  const DEFAULTS = {
    name: 'UnnamedPlayer', model: 'sarge', sens: 5, invert: false, alwaysRun: true, fov: 90, crosshair: 7, crosshairSize: 24, crosshairColor: '#ffffff',
    drawGun: true, marks: true, brass: true, dlights: true, identify: true, autoswitch: true, timer: false, fps: false, botChat: true, blood: true,
    video: 'auto', filter: 'trilinear', brightness: 1.2, gamma: 1.4, contrast: 1, sfx: 0.8, music: 0.45, voice: true, skill: 2, mod: 'baseq3'
  };

  function loadJSON(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v || d; } catch (e) { return d; } }
  function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  class UI {
    constructor(root, opts) {
      this.opts = opts || {};
      this.root = root;
      this.profile = loadJSON(PROFILE_KEY, null) || { sp: {}, awards: {}, played: 0 };
      this.o = Object.assign({}, DEFAULTS, this.profile.settings || {});
      this.profile.sp = this.profile.sp || {};
      this.profile.awards = this.profile.awards || {};
      this.build();
      this.audio = new Q.Audio();
      this.audio.setVolume(this.o.sfx);
      this.audio.setMusic(this.o.music);
      this.keys = {};
      this.yaw = 0; this.pitch = 0;
      this.mode = 'menu';
      this.acc = 0;
      this.time = 0;
      this.last = 0;
      this.fpsN = 0; this.fpsT = 0; this.fps = 0;
      this.consoleLines = [];
      this.bakes = {};
      try {
        this.r = new Q.Renderer(this.view);
        this.r.bright = this.o.brightness;
        this.r.gamma = this.o.gamma;
        this.r.contrast = this.o.contrast;
        this.r.filter = this.o.filter;
        this.scene = new Q.Scene(this.r);
      } catch (e) {
        this.glError = String(e && e.message || e);
      }
      this.hud = new Q.HUD(this.hudCv);
      this.menu = new Q.Menu(this);
      this.bind();
      this.menu.show('main');
      this.raf = requestAnimationFrame(t => this.frame(t));
    }

    build() {
      const el = document.createElement('div');
      el.className = 'q3';
      el.tabIndex = 0;
      el.innerHTML = `<canvas class="q3-view"></canvas><canvas class="q3-hud"></canvas><div class="q3-layer q3-menu"></div><div class="q3-layer q3-load"></div><div class="q3-console"><div class="q3-con-lines"></div><input class="q3-con-in" spellcheck="false"></div>`;
      this.root.appendChild(el);
      this.el = el;
      this.view = el.querySelector('.q3-view');
      this.hudCv = el.querySelector('.q3-hud');
      this.menuEl = el.querySelector('.q3-menu');
      this.loadEl = el.querySelector('.q3-load');
      this.conEl = el.querySelector('.q3-console');
      this.conLines = el.querySelector('.q3-con-lines');
      this.conIn = el.querySelector('.q3-con-in');
    }

    active() { return this.opts.isActive ? this.opts.isActive() : true; }

    saveProfile() {
      this.profile.settings = this.o;
      saveJSON(PROFILE_KEY, this.profile);
    }

    applySettings() {
      this.audio.setVolume(this.o.sfx);
      this.audio.setMusic(this.o.music);
      if (this.r) { this.r.bright = this.o.brightness; this.r.gamma = this.o.gamma; this.r.contrast = this.o.contrast; this.r.setFilter(this.o.filter); }
      if (this.fx) { this.fx.opts.marks = this.o.marks; this.fx.opts.brass = this.o.brass; }
      this.saveProfile();
    }

    bind() {
      const el = this.el;
      this.onKeyDown = e => {
        if (!this.active()) return;
        this.audio.init(); this.audio.resume();
        if (e.target === this.conIn) {
          if (e.code === 'Enter') { e.preventDefault(); this.runCommand(this.conIn.value); this.conIn.value = ''; }
          if (e.code === 'Backquote' || e.code === 'Escape') { e.preventDefault(); this.toggleConsole(false); }
          return;
        }
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') && e.code !== 'Escape') return;
        if (e.code === 'Backquote') { e.preventDefault(); this.toggleConsole(); return; }
        if (e.code === 'Escape') {
          e.preventDefault();
          if (this.mode === 'play') this.pause();
          else if (this.mode === 'paused') this.menu.back();
          else if (this.mode === 'demo' || this.mode === 'cine') this.stopPlayback();
          else if (this.mode === 'menu') this.menu.back();
          else if (this.mode === 'intermission') this.finishIntermission();
          return;
        }
        if (this.mode === 'intermission') { if (e.code === 'Space' || e.code === 'Enter') this.finishIntermission(); return; }
        if (this.mode === 'demo' && (e.code === 'Space' || e.code === 'ArrowRight')) { this.nextFollow(); e.preventDefault(); return; }
        if (this.mode !== 'play') { if (this.mode === 'menu') this.menu.key(e); return; }
        const act = KEYS[e.code];
        if (act || /^Digit[0-9]$/.test(e.code) || e.code === 'Tab' || e.code === 'Space') e.preventDefault();
        if (act) this.keys[act] = true;
        if (/^Digit[1-9]$/.test(e.code)) this.selectWeapon(Number(e.code.slice(5)));
        if (e.code === 'KeyQ') this.selectWeapon(this.lastWeapon || WP.MACHINEGUN);
        if (e.code === 'ArrowLeft') this.keys.turnL = true;
        if (e.code === 'ArrowRight') this.keys.turnR = true;
        if (e.code === 'PageUp') this.keys.lookU = true;
        if (e.code === 'PageDown') this.keys.lookD = true;
        if (e.code === 'F12') this.screenshot();
      };
      this.onKeyUp = e => {
        const act = KEYS[e.code];
        if (act) this.keys[act] = false;
        if (e.code === 'ArrowLeft') this.keys.turnL = false;
        if (e.code === 'ArrowRight') this.keys.turnR = false;
        if (e.code === 'PageUp') this.keys.lookU = false;
        if (e.code === 'PageDown') this.keys.lookD = false;
      };
      this.onMouseMove = e => {
        if (this.mode !== 'play' || document.pointerLockElement !== this.view) return;
        const s = this.o.sens * 0.00042 * (this.zoomK || 1);
        this.yaw = Q.wrapAng(this.yaw - e.movementX * s);
        this.pitch = Q.clamp(this.pitch + e.movementY * s * (this.o.invert ? -1 : 1), -1.55, 1.55);
      };
      this.onMouseDown = e => {
        this.audio.init(); this.audio.resume();
        if (this.mode === 'intermission') { if (this.game && this.game.time - (this.game.intermissionStart || 0) > 1.5) this.finishIntermission(); return; }
        if (this.mode === 'demo') { this.nextFollow(); return; }
        if (this.mode !== 'play') return;
        if (document.pointerLockElement !== this.view && this.view.requestPointerLock && !this.opts.noLock) {
          try { const r = this.view.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (err) { }
        }
        if (e.button === 0) this.keys.attack = true;
        if (e.button === 2) this.keys.zoom = true;
        e.preventDefault();
      };
      this.onMouseUp = e => {
        if (e.button === 0) this.keys.attack = false;
        if (e.button === 2) this.keys.zoom = false;
      };
      this.onWheel = e => {
        if (this.mode !== 'play') return;
        e.preventDefault();
        this.cycleWeapon(e.deltaY > 0 ? 1 : -1);
      };
      this.onContext = e => e.preventDefault();
      this.onBlur = () => { this.keys = {}; };
      this.onLock = () => { if (document.pointerLockElement !== this.view && this.mode === 'play' && !this.opts.noLock && this.hadLock) this.pause(); this.hadLock = document.pointerLockElement === this.view; };
      this.keyTarget = this.opts.standalone ? window : el;
      this.keyTarget.addEventListener('keydown', this.onKeyDown);
      this.keyTarget.addEventListener('keyup', this.onKeyUp);
      document.addEventListener('mousemove', this.onMouseMove);
      this.view.addEventListener('mousedown', this.onMouseDown);
      this.hudCv.addEventListener('mousedown', this.onMouseDown);
      document.addEventListener('mouseup', this.onMouseUp);
      document.addEventListener('pointerlockchange', this.onLock);
      el.addEventListener('wheel', this.onWheel, { passive: false });
      el.addEventListener('contextmenu', this.onContext);
      window.addEventListener('blur', this.onBlur);
      el.addEventListener('mousedown', () => { if (document.activeElement !== this.conIn) el.focus({ preventScroll: true }); });
      el.focus({ preventScroll: true });
    }

    unlock() { if (document.pointerLockElement === this.view && document.exitPointerLock) document.exitPointerLock(); }

    selectWeapon(w) {
      const me = this.game && this.game.local;
      if (!me || !me.alive || !me.weapons[w]) return;
      if (me.ammo[w] === 0 && w !== WP.GAUNTLET) return;
      if (w !== me.weapon) this.lastWeapon = me.weapon;
      this.wantWeapon = w;
      this.hud.wsel = w;
      this.hud.showWeaponSelect(this.time);
    }

    cycleWeapon(dir) {
      const me = this.game && this.game.local;
      if (!me || !me.alive) return;
      let w = this.hud.wsel && this.time - this.hud.wselT < 1.4 ? this.hud.wsel : me.weapon;
      for (let i = 0; i < 9; i++) {
        w = ((w - 1 + dir + 9) % 9) + 1;
        if (me.weapons[w] && (me.ammo[w] !== 0 || w === WP.GAUNTLET)) break;
      }
      this.selectWeapon(w);
    }

    buildCmd() {
      const k = this.keys;
      const run = this.o.alwaysRun ? !k.walk : k.walk;
      const sp = run ? 127 : 64;
      const turn = 2.6 * Q.TICK;
      if (k.turnL) this.yaw = Q.wrapAng(this.yaw + turn);
      if (k.turnR) this.yaw = Q.wrapAng(this.yaw - turn);
      if (k.lookU) this.pitch = Q.clamp(this.pitch - turn, -1.55, 1.55);
      if (k.lookD) this.pitch = Q.clamp(this.pitch + turn, -1.55, 1.55);
      const cmd = {
        forward: ((k.fwd ? 1 : 0) - (k.back ? 1 : 0)) * sp,
        right: ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * sp,
        up: k.jump ? 127 : k.crouch ? -127 : 0,
        attack: !!k.attack, useItem: !!k.use, gesture: !!k.gesture,
        weapon: this.wantWeapon || 0,
        yaw: Q.quantAng(this.yaw), pitch: Q.quantAng(Q.clamp(this.pitch, -1.55, 1.55))
      };
      this.wantWeapon = 0;
      return cmd;
    }

    frame(ts) {
      this.raf = requestAnimationFrame(t => this.frame(t));
      const dt = this.last ? Math.min(0.1, (ts - this.last) / 1000) : 0.016;
      this.last = ts;
      this.time += dt;
      this.fpsN++; this.fpsT += dt;
      if (this.fpsT >= 0.5) { this.fps = Math.round(this.fpsN / this.fpsT); this.fpsN = 0; this.fpsT = 0; }
      this.fitCanvas();
      try {
        if (this.mode === 'menu' || this.mode === 'paused') this.menu.frame(dt);
        if (this.game && (this.mode === 'play' || this.mode === 'demo' || this.mode === 'cine' || this.mode === 'intermission' || this.mode === 'paused')) this.gameFrame(dt);
        else if (this.mode === 'loading') this.hud.ctx.clearRect(0, 0, this.hudCv.width, this.hudCv.height);
      } catch (err) {
        this.errorOut(err);
      }
    }

    errorOut(err) {
      console.error(err);
      this.lastError = err;
      if (this.mode !== 'menu') {
        this.endSession();
        this.menu.show('main');
        this.menu.dialog('ERROR', String(err && err.message || err));
      }
    }

    fitCanvas() {
      const w = Math.max(64, this.el.clientWidth), h = Math.max(48, this.el.clientHeight);
      let rw = w, rh = h;
      const modes = { '512': 512, '640': 640, '800': 800, '1024': 1024 };
      if (modes[this.o.video]) { const k = Math.min(1, modes[this.o.video] / w); rw = Math.round(w * k); rh = Math.round(h * k); }
      if (this.r) this.r.resize(rw, rh);
      this.hud.resize(w, h);
    }

    step() {
      const g = this.game;
      for (const p of g.players) p.prevOrigin = p.ps.origin.slice();
      let cmd = null;
      if (this.mode === 'play' && g.local) {
        const me = g.local;
        if (me.forceView) { this.yaw = me.forceView.yaw; this.pitch = me.forceView.pitch; me.forceView = null; }
        cmd = this.buildCmd();
        if (this.recording) this.recordCmd(cmd);
      } else if (this.mode === 'demo' && this.demo && this.demo.cmds) {
        cmd = this.demoCmd(this.demo.tick++);
        if (!cmd && g.local) cmd = { forward: 0, right: 0, up: 0, yaw: g.local.ps.yaw, pitch: g.local.ps.pitch };
        if (g.local && g.local.forceView) g.local.forceView = null;
      }
      g.step(cmd);
      for (const e of g.events) this.onEvent(e);
      g.events.length = 0;
      if (g.local && g.local.ps.stepUp) { this.stepOff = (this.stepOff || 0) - g.local.ps.stepUp; g.local.ps.stepUp = 0; }
    }

    gameFrame(dt) {
      const g = this.game;
      if (this.mode !== 'paused') {
        this.acc += dt * (this.mode === 'demo' && this.demoFast ? 4 : 1);
        let n = 0;
        while (this.acc >= Q.TICK && n < 8) { this.step(); this.acc -= Q.TICK; n++; }
        if (n >= 8) this.acc = 0;
        if (g.state === 'intermission' && this.mode !== 'intermission' && this.mode !== 'cine') this.enterIntermission();
        if (this.mode === 'demo' && this.demo && this.demo.limit && g.time > this.demo.limit) { this.stopPlayback(); return; }
        if (this.mode === 'cine' && this.cine && this.cine.done(this.time)) { this.stopPlayback(); return; }
      }
      if (!this.game) return;
      const alpha = this.acc / Q.TICK;
      this.scene.update(g, dt);
      this.fx.update(this.mode === 'paused' ? 0 : dt, g);
      this.stepOff = (this.stepOff || 0) * Math.max(0, 1 - dt * 12);
      const view = this.computeView(g, alpha, dt);
      this.lastView = view;
      if (!this.r) return;
      const follow = this.viewPlayer();
      this.scene.draw(g, this.fx, view, { time: this.time, alpha, hide: view.hide, podium: this.mode === 'intermission' ? this.podium : null });
      if (follow && follow.alive && this.o.drawGun && !view.thirdPerson && this.mode !== 'intermission' && this.mode !== 'cine') this.drawGun(follow, view, dt);
      this.drawHud(g, follow, view, dt);
      this.updateLoops(g, view);
    }

    viewPlayer() {
      const g = this.game;
      if (!g) return null;
      if (this.mode === 'demo' || this.mode === 'cine') return this.follow && g.players.includes(this.follow) ? this.follow : g.local;
      return g.local;
    }

    computeView(g, alpha, dt) {
      const W = this.r ? this.r.cv.width : 640, H = this.r ? this.r.cv.height : 480;
      if (this.mode === 'cine' && this.cine) return Object.assign({ w: W, h: H, fov: 80 }, this.cine.view(this.time));
      if (this.mode === 'intermission' || g.state === 'intermission') {
        const im = this.podiumCam || g.world.intermission;
        return { pos: im.pos, yaw: im.yaw, pitch: im.pitch, w: W, h: H, fov: 90, thirdPerson: true };
      }
      const p = this.viewPlayer();
      if (!p) { const im = g.world.intermission; return { pos: im.pos, yaw: im.yaw + this.time * 0.1, pitch: im.pitch, w: W, h: H, fov: 90, thirdPerson: true }; }
      const o = p.prevOrigin ? Q.vlerp(p.prevOrigin, p.ps.origin, alpha) : p.ps.origin;
      const isLocal = p === g.local && this.mode === 'play';
      let yaw = isLocal ? this.yaw : p.ps.yaw, pitch = isLocal ? this.pitch : p.ps.pitch, roll = 0;
      if (!isLocal && p.ai) { yaw = p.ai.yaw; pitch = p.ai.pitch; }
      this.vh = this.vh === undefined ? p.ps.viewheight : this.vh + (p.ps.viewheight - this.vh) * Math.min(1, dt * 12);
      let eye = [o[0], o[1], o[2] + this.vh + (this.stepOff || 0)];
      if (!p.alive) {
        const t = Math.min(1, (g.time - p.deadTime) / 0.6);
        eye = [o[0], o[1], o[2] - 8 - t * 6];
        const killer = p.lastAttacker ? g.player(p.lastAttacker) : null;
        if (killer && killer !== p) { const a = Q.vecToAngles(Q.vsub(killer.ps.origin, eye)); yaw = a.yaw; pitch = a.pitch * 0.5; }
        roll = 40 * Q.DEG * t;
        return { pos: eye, yaw, pitch, roll, w: W, h: H, fov: this.o.fov, hide: p };
      }
      const sp = Math.hypot(p.ps.velocity[0], p.ps.velocity[1]);
      if (p.ps.onGround && sp > 30) this.bobCycle = (this.bobCycle || 0) + dt * sp / 32; else this.bobCycle = (this.bobCycle || 0) * 0.9;
      const bobK = Math.min(1, sp / 320) * (p.ps.onGround ? 1 : 0);
      eye[2] += Math.abs(Math.sin(this.bobCycle * 0.5)) * 1.6 * bobK;
      roll += Math.sin(this.bobCycle * 0.5) * 0.35 * Q.DEG * bobK;
      if (this.kick) {
        this.kick.t += dt;
        const k = Math.max(0, 1 - this.kick.t / 0.25);
        pitch += this.kick.p * k; roll += this.kick.r * k;
        if (k <= 0) this.kick = null;
      }
      if (this.landDip) { eye[2] -= this.landDip; this.landDip = Math.max(0, this.landDip - dt * 40); }
      this.zoomF = this.zoomF === undefined ? this.o.fov : this.zoomF;
      const target = isLocal && this.keys.zoom ? 22.5 : this.o.fov;
      this.zoomF += (target - this.zoomF) * Math.min(1, dt * 10);
      this.zoomK = this.zoomF / this.o.fov;
      return { pos: eye, yaw, pitch, roll, w: W, h: H, fov: this.zoomF, hide: p, bobK, sp };
    }

    drawGun(p, view, dt) {
      const g = this.game;
      this.gunKick = Math.max(0, (this.gunKick || 0) - dt * 6);
      const drop = p.weaponState === 'dropping' ? 1 - Math.max(0, p.weaponTime) / Q.WEAPON_DROP_TIME : p.weaponState === 'raising' ? Math.max(0, p.weaponTime) / Q.WEAPON_RAISE_TIME : 0;
      const bc = this.bobCycle || 0, k = view.bobK || 0;
      const lit = this.r.lightAt(view.pos);
      const vm = Q.M4.view([0, 0, 0], view.yaw, view.pitch, 0);
      const d = Q.M4.dir(vm, lit.dir);
      const vlit = { amb: lit.amb.map(c => c * 1.1), dcol: lit.dcol, dir: [d[0], d[1], d[2]] };
      const fl = this.fx.lights.filter(l => l.age < 0.08 && Q.vdist(l.pos, view.pos) < 80).length ? 0.5 : 0;
      if (fl) vlit.amb = vlit.amb.map(c => c + fl);
      this.gunYaw = (this.gunYaw === undefined ? view.yaw : this.gunYaw);
      const dy = Q.angDiff(this.gunYaw, view.yaw);
      this.gunYaw = Q.wrapAng(this.gunYaw + dy * Math.min(1, dt * 14));
      this.scene.drawViewWeapon(p, view, {
        drop: Q.clamp(drop, 0, 1), kick: this.gunKick, bobX: Math.sin(bc * 0.5) * 1.2 * k, bobY: -Math.abs(Math.cos(bc * 0.5)) * 0.8 * k,
        swayP: 0, swayY: Q.clamp(-dy * 0.6, -0.12, 0.12), lit: vlit, dl: [], firing: p.firing, gameTime: g.time
      }, this.time);
    }

    drawHud(g, me, view, dt) {
      const st = {
        game: g, me: this.mode === 'play' || this.mode === 'demo' || this.mode === 'intermission' ? me : null, time: this.time, dt, view,
        showStatus: this.mode === 'play' || this.mode === 'demo', crosshair: this.o.crosshair, crosshairSize: this.o.crosshairSize, crosshairColor: this.o.crosshairColor,
        scores: this.keys.scores, intermission: this.mode === 'intermission', timer: this.o.timer, fps: this.o.fps ? this.fps : 0,
        demo: this.mode === 'demo', dead: me && !me.alive, arenaTitle: this.arenaTitle, wsel: this.hud.wsel,
        follow: this.mode === 'demo' ? 'DEMO — following ' + (me ? me.name : '') + '   [click to switch, Esc to exit]' : ''
      };
      if (this.mode === 'cine') { this.hud.ctx.clearRect(0, 0, this.hudCv.width, this.hudCv.height); this.cine.drawText(this.hud.ctx, this.hudCv.width, this.hudCv.height, this.time); return; }
      if (this.o.identify && me && me.alive && this.mode === 'play') {
        const av = Q.angleVectors(view.yaw, view.pitch);
        const t = g.shotTrace(view.pos, Q.vma(view.pos, 2000, av.fwd), me);
        st.target = t.player && !(t.player.powerups.invis > g.time) ? t.player.name : '';
      }
      this.hud.draw(st);
      if (this.r && st.showStatus && me && me.alive) {
        const scale = this.r.cv.width / this.hudCv.width;
        for (const ic of this.hud.icons(st)) {
          const x = ic.x * scale, y = ic.y * scale, w = ic.w * scale, h = ic.h * scale;
          if (ic.kind === 'weapon') {
            const key = Object.keys(Q.ITEMS).find(k => Q.ITEMS[k].type === 'ammo' && Q.ITEMS[k].wp === ic.wp);
            if (key) this.scene.drawIcon(Q.itemMesh(key), x, y, w, h, this.time * 0.8, { dist: 60, fov: 32 * Q.DEG, pitch: 0.35, z: 6 });
          } else if (ic.kind === 'armor') {
            this.scene.drawIcon(Q.itemMesh(me.armor > 100 ? 'item_armor_body' : 'item_armor_combat'), x, y, w, h, this.time * 0.8, { dist: 70, fov: 32 * Q.DEG, pitch: 0.2, z: 3 });
          } else if (ic.kind === 'head') {
            const ch = Q.getCharacter(ic.p.look, g.teamGame ? ic.p.team : null);
            const hurt = g.time - ic.p.lastHurt < 0.3;
            const yaw = Math.PI + Math.sin(this.time * 0.9) * 0.35 + (hurt ? 0.4 : 0);
            const mesh = ic.p.look.arch === 'orbb' ? ch.parts.torso : ch.parts.head;
            const hz = ic.p.look.arch === 'orbb' ? 10 : ch.d.headH * 0.5;
            this.scene.drawIcon(mesh, x, y, w, h, yaw, { dist: ic.p.look.arch === 'orbb' ? 110 : 44, fov: 30 * Q.DEG, z: hz, pitch: 0.05 });
          }
        }
      }
    }

    updateLoops(g, view) {
      for (const p of g.players) {
        const lg = p.alive && p.firing && p.weapon === WP.LIGHTNING && this.mode !== 'paused';
        const ga = p.alive && p.firing && p.weapon === WP.GAUNTLET && this.mode !== 'paused';
        if (lg || ga) {
          const d = Q.vdist(p.ps.origin, view.pos);
          const vol = p === this.viewPlayer() ? 0.5 : Q.clamp(1 - d / 1200, 0, 1) * 0.5;
          this.audio.loop('w' + p.id, lg ? 'lg' : 'gauntlet', vol);
        } else this.audio.stopLoop('w' + p.id);
      }
    }

    onEvent(e) {
      const g = this.game, me = this.viewPlayer();
      const L = this.lastView ? { pos: this.lastView.pos, yaw: this.lastView.yaw } : null;
      const P = id => g.player(id);
      const mine = id => me && id === me.id;
      const at = (key, pos, o) => this.audio.at(key, pos, L, o);
      const gsnd = p => (p && p.gender === 'f' ? 'f' : p && p.gender === 'n' ? 'n' : 'm');
      if (this.fx && (this.o.blood || (e.t !== 'blood' && e.t !== 'gib'))) this.fx.event(e, g);
      if (this.hud) this.hud.event(e, g, me, this.time);
      switch (e.t) {
        case 'fire': {
          const key = ['', '', 'mg', 'sg', 'gl', 'rl', null, 'rg', 'pg', 'bfg'][e.wp];
          if (key) mine(e.p) ? this.audio.play(key, { vol: 0.8 }) : at(key, e.pos, { vol: 0.8 });
          if (e.quad) mine(e.p) ? this.audio.play('quad_fire', { vol: 0.6 }) : at('quad_fire', e.pos, { vol: 0.6 });
          if (mine(e.p)) this.gunKick = Math.min(1, (this.gunKick || 0) + (Q.WEAPONS[e.wp].kick || 0) * 0.3);
          break;
        }
        case 'bullet': if (Math.random() < 0.35) at('ric' + Math.floor(Math.random() * 3), e.pos, { vol: 0.5 }); break;
        case 'explode': at(e.kind === 'plasma' ? 'plasma_hit' : 'explode', e.pos, { vol: e.kind === 'plasma' ? 0.5 : 1 }); if (e.kind !== 'plasma' && me && Q.vdist(e.pos, me.ps.origin) < 300) this.kick = { t: 0, p: 0.02, r: (Math.random() - 0.5) * 0.04 }; break;
        case 'pain': { const p = P(e.p); if (p) at('pain_' + gsnd(p), p.ps.origin, { rate: 0.9 + Math.random() * 0.25 }); break; }
        case 'death': { const p = P(e.p); if (p && !e.gib) at('death_' + gsnd(p), e.pos, {}); break; }
        case 'gib': at('gib', e.pos, {}); break;
        case 'jump': { const p = P(e.p); if (p) at('jump_' + (gsnd(p) === 'f' ? 'f' : 'm'), p.ps.origin, { vol: 0.6 }); break; }
        case 'land': { const p = P(e.p); if (p) at('land', p.ps.origin, { vol: 0.6 }); if (mine(e.p)) this.landDip = 3; break; }
        case 'fall': { const p = P(e.p); if (p) at('pain_' + gsnd(p), p.ps.origin, {}); if (mine(e.p)) this.landDip = e.far ? 10 : 6; break; }
        case 'footstep': { const p = P(e.p); if (p && !(p.powerups.invis > g.time)) at(e.metal ? 'step_metal' : 'step', p.ps.origin, { vol: mine(e.p) ? 0.35 : 0.45, rate: 0.85 + Math.random() * 0.3 }); break; }
        case 'pickup': {
          const d = Q.ITEMS[e.key];
          const snd = d.type === 'health' ? (d.amount === 100 ? 'pickup_mega' : 'pickup_health') : d.type === 'armor' ? (d.amount === 5 ? 'pickup_shard' : 'pickup_armor') : d.type === 'weapon' ? 'pickup_weapon' : d.type === 'ammo' ? 'pickup_ammo' : d.type === 'powerup' ? 'pickup_powerup' : 'pickup_hold';
          mine(e.p) ? this.audio.play(snd, { vol: 0.8 }) : at(snd, e.pos, { vol: 0.6 });
          break;
        }
        case 'item_respawn': at('respawn', e.pos, { vol: 0.5 }); break;
        case 'teleport_in': at('teleport', e.pos, { vol: 0.7 }); break;
        case 'jumppad': at('jumppad', e.pos, {}); break;
        case 'hit': if (me && e.a === me.id && this.mode === 'play') this.audio.play(e.team ? 'hit_team' : 'hit', { vol: 0.6 }); break;
        case 'damage': if (mine(e.v)) { const d = e.dir; this.kick = { t: 0, p: d ? -0.05 * Math.min(1, e.dmg / 30) : 0.03, r: d ? (Math.random() - 0.5) * 0.08 : 0 }; } break;
        case 'noammo': if (mine(e.p)) this.audio.play('noammo'); break;
        case 'weapon_raise': if (mine(e.p)) this.audio.play('change', { vol: 0.5 }); break;
        case 'announce': if (this.mode !== 'cine') this.say(e.say); break;
        case 'award': if (mine(e.p)) this.say(e.award); break;
        case 'powerup': if (mine(e.p)) this.say(e.pw); break;
        case 'powerup_warn': if (mine(e.p)) this.audio.play('wearoff', { vol: 0.6 }); break;
        case 'chat': if (this.o.botChat) this.audio.play('talk', { vol: 0.4 }); else this.hud.notify.pop(); break;
        case 'regen': if (mine(e.p)) this.audio.play('regen', { vol: 0.4 }); break;
        case 'battlesuit': { const p = P(e.p); if (p) at('protect', p.ps.origin, { vol: 0.5 }); break; }
        case 'gauntlet_hit': at('gauntlet_hit', e.pos, {}); break;
        case 'bounce': at('bounce', e.pos, { vol: 0.5 }); break;
        case 'use_medkit': if (mine(e.p)) this.audio.play('pickup_health'); break;
        default: break;
      }
    }

    say(k) {
      if (this.o.voice) this.audio.say(k);
      else this.audio.play('sting', { vol: 0.3 });
    }

    getBake(mapId) {
      if (this.bakes[mapId]) return this.bakes[mapId];
      const w = Q.loadWorld(mapId);
      const b = new Q.Baker(w).run();
      this.bakes[mapId] = b;
      return b;
    }

    startMatch(cfg) {
      this.endSession();
      this.menu.hide();
      this.mode = 'loading';
      this.cfg = cfg;
      const arena = Q.arena(cfg.map);
      const def = Q.MAPS[cfg.map];
      this.arenaTitle = def.name;
      this.loadEl.style.display = 'flex';
      const shot = this.menu.shots[cfg.map];
      this.loadEl.innerHTML = `<div class="q3-load-bg" style="${shot ? `background-image:url(${shot})` : ''}"></div><div class="q3-load-box"><div class="q3-load-map">${def.name}</div><div class="q3-load-sub">${cfg.map}</div><div class="q3-load-list"></div></div>`;
      const list = this.loadEl.querySelector('.q3-load-list');
      const steps = [
        ['loading map geometry', () => Q.loadWorld(cfg.map)],
        ['baking lightmaps', () => this.getBake(cfg.map)],
        ['building bot navigation', () => Q.getNav(Q.loadWorld(cfg.map))],
        ['loading textures', () => { if (this.r) this.r.loadWorld(Q.loadWorld(cfg.map), this.getBake(cfg.map)); }],
        ['awaiting gamestate', () => this.createGame(cfg, arena)]
      ];
      let i = 0;
      const next = () => {
        if (this.mode !== 'loading') return;
        if (i >= steps.length) { this.beginPlay(); return; }
        const [label, fn] = steps[i++];
        list.insertAdjacentHTML('beforeend', `<div>${label}...</div>`);
        setTimeout(() => {
          try { fn(); } catch (err) { this.errorOut(err); return; }
          next();
        }, 30);
      };
      next();
    }

    createGame(cfg) {
      const players = [];
      if (!cfg.spectate) players.push({ human: true, name: this.o.name, model: this.o.model, team: cfg.team || null });
      for (const b of cfg.bots) players.push({ bot: b.bot, skill: b.skill, team: b.team || null, name: b.name, ping: b.ping || 0 });
      const game = new Q.Game({
        map: cfg.map, gametype: cfg.gametype || 'ffa', fraglimit: cfg.fraglimit, timelimit: cfg.timelimit, seed: cfg.seed || ((Date.now() & 0xffffff) + 1),
        players, mod: cfg.mod || 'baseq3', autoswitch: this.o.autoswitch, warmup: cfg.warmup === undefined ? 3 : cfg.warmup
      });
      this.game = game;
      this.fx = new Q.FX(game.world, { marks: this.o.marks, brass: this.o.brass });
      if (this.scene) this.scene.setWorld(game.world);
      this.follow = null;
      if (game.local) { this.yaw = game.local.ps.yaw; this.pitch = 0; }
      this.recording = !cfg.spectate && !cfg.demo;
      if (this.recording) {
        this.rec = { v: 1, map: cfg.map, gametype: game.gametype, fraglimit: game.fraglimit, timelimit: game.timelimit, seed: game.seed, mod: game.mod, warmup: cfg.warmup === undefined ? 3 : cfg.warmup, player: { name: this.o.name, model: this.o.model, team: cfg.team || null }, bots: cfg.bots, date: Date.now(), cmds: [] };
      } else this.rec = null;
    }

    beginPlay() {
      this.loadEl.style.display = 'none';
      this.acc = 0;
      this.hud.reset();
      this.vh = undefined;
      if (this.cfg.cine) {
        this.cine = new Q.Cine(this.game.world, this.cfg.cine);
        this.mode = 'cine';
        this.follow = this.game.players[0];
      } else if (this.cfg.spectate || this.cfg.demo) {
        this.mode = 'demo';
        this.follow = this.game.local || this.game.players[0];
        this.followT = this.time;
      } else {
        this.mode = 'play';
        this.say('prepare');
        if (!this.opts.noLock && this.view.requestPointerLock) { try { const r = this.view.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { } }
      }
      this.audio.startMusic(this.cfg.cine ? 4 : Q.MAPS[this.cfg.map].music || 0);
      this.el.focus({ preventScroll: true });
    }

    pause() {
      if (this.mode !== 'play') return;
      this.mode = 'paused';
      this.keys = {};
      this.unlock();
      this.menu.show('ingame');
    }

    resume() {
      if (this.mode !== 'paused') return;
      this.menu.hide();
      this.mode = 'play';
      this.acc = 0;
      if (!this.opts.noLock && this.view.requestPointerLock) { try { const r = this.view.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { } }
      this.el.focus({ preventScroll: true });
    }

    endSession() {
      this.saveDemo();
      this.audio.stopAll();
      this.unlock();
      this.game = null;
      this.fx = null;
      this.cine = null;
      this.demo = null;
      this.keys = {};
      this.mode = 'menu';
      this.hud.ctx.clearRect(0, 0, this.hudCv.width, this.hudCv.height);
    }

    leave() {
      this.endSession();
      this.menu.show('main');
    }

    enterIntermission() {
      this.mode = 'intermission';
      this.unlock();
      this.keys = {};
      const g = this.game;
      const im = g.world.intermission;
      const fwd = Q.angleVectors(im.yaw, im.pitch).fwd;
      const hit = g.world.trace(im.pos, Q.vma(im.pos, 420, fwd), null, null, Q.MASK_SHOT);
      const flat = Q.vnorm([fwd[0], fwd[1], 0]);
      let spot = hit.fraction < 1 && hit.normal && hit.normal[2] > 0.7 ? hit.endpos : Q.vma(im.pos, Math.min(300, 420 * hit.fraction - 40), flat);
      const gz = g.world.groundZ(spot[0], spot[1], spot[2] + 8, spot[2] - 600);
      spot = [spot[0], spot[1], gz === null ? spot[2] : gz];
      const cam = Q.vma(Q.vma(spot, -190, flat), 1, [0, 0, 70]);
      const camOk = g.world.trace(spot.map((v, i) => v + (i === 2 ? 60 : 0)), cam, null, null, Q.MASK_SHOT).fraction >= 1;
      const cpos = camOk ? cam : im.pos;
      const look = Q.vecToAngles(Q.vsub([spot[0], spot[1], spot[2] + 45], cpos));
      this.podium = { spot, yaw: im.yaw };
      this.podiumCam = { pos: cpos, yaw: look.yaw, pitch: look.pitch };
      const me = g.local;
      if (me) {
        const aw = this.profile.awards;
        aw.excellent = (aw.excellent || 0) + me.stats.excellent;
        aw.impressive = (aw.impressive || 0) + me.stats.impressive;
        aw.gauntlet = (aw.gauntlet || 0) + me.stats.gauntlet;
        aw.frags = (aw.frags || 0) + me.kills;
        if (me.stats.accuracy) aw.accuracy = (aw.accuracy || 0) + 1;
        if (me.stats.perfect) aw.perfect = (aw.perfect || 0) + 1;
        this.profile.played = (this.profile.played || 0) + 1;
        const win = g.winner() === me && !g.teamGame;
        this.lastResult = { win, map: g.mapId, skill: this.cfg.skill || 0, sp: !!this.cfg.sp };
        if (this.cfg.sp && win) {
          const prev = this.profile.sp[g.mapId] || 0;
          if (this.cfg.skill > prev) this.profile.sp[g.mapId] = this.cfg.skill;
        }
        this.saveProfile();
        if (me.stats.perfect) setTimeout(() => this.say('perfect'), 2200);
        else if (me.stats.accuracy) setTimeout(() => this.say('accuracy'), 2200);
      }
      this.saveDemo();
    }

    finishIntermission() {
      if (this.mode !== 'intermission') return;
      const res = this.lastResult;
      const cfg = this.cfg;
      this.endSession();
      if (cfg && cfg.sp) this.menu.show('results', res);
      else if (cfg && cfg.serverName) this.menu.show('servers');
      else if (cfg && !cfg.demo) this.menu.show('skirmish');
      else this.menu.show('main');
    }

    recordCmd(c) {
      const r = this.rec;
      if (!r || r.cmds.length > 60 * 60 * 20) return;
      const b = (c.attack ? 1 : 0) | (c.useItem ? 2 : 0) | (c.gesture ? 4 : 0);
      r.cmds.push(c.forward, c.right, c.up, b, c.weapon || 0, Q.angToShort(c.yaw), Q.angToShort(c.pitch));
    }

    demoCmd(i) {
      const a = this.demo.cmds;
      const o = i * 7;
      if (o + 6 >= a.length) return null;
      return { forward: a[o], right: a[o + 1], up: a[o + 2], attack: !!(a[o + 3] & 1), useItem: !!(a[o + 3] & 2), gesture: !!(a[o + 3] & 4), weapon: a[o + 4], yaw: Q.shortToAng(a[o + 5]), pitch: Q.shortToAng(a[o + 6]) };
    }

    saveDemo() {
      const r = this.rec;
      this.rec = null;
      this.recording = false;
      if (!r || r.cmds.length < 60 * 20) return;
      const bytes = new Uint8Array(r.cmds.length * 2);
      for (let i = 0; i < r.cmds.length; i++) { const v = r.cmds[i] & 0xffff; bytes[i * 2] = v & 255; bytes[i * 2 + 1] = v >> 8; }
      let bin = '';
      for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
      const meta = Object.assign({}, r, { cmds: undefined, data: btoa(bin), len: r.cmds.length / 7 });
      const list = loadJSON(DEMO_KEY, []);
      list.unshift(meta);
      while (list.length > 4) list.pop();
      while (list.length && !saveJSON(DEMO_KEY, list)) list.pop();
    }

    listDemos() { return loadJSON(DEMO_KEY, []); }

    deleteDemo(i) { const l = this.listDemos(); l.splice(i, 1); saveJSON(DEMO_KEY, l); }

    playDemo(d) {
      let cmds = null;
      if (d.data) {
        const bin = atob(d.data);
        cmds = new Array(bin.length / 2);
        for (let i = 0; i < cmds.length; i++) {
          let v = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
          const k = i % 7;
          if (k < 3 && v >= 32768) v -= 65536;
          cmds[i] = v;
        }
      }
      const cfg = { map: d.map, gametype: d.gametype, fraglimit: d.fraglimit, timelimit: d.timelimit, seed: d.seed, mod: d.mod, warmup: d.warmup, bots: d.bots, demo: true, spectate: !cmds };
      if (cmds) {
        const orig = this.o.name, origModel = this.o.model;
        this.o.name = d.player.name; this.o.model = d.player.model;
        cfg.team = d.player.team;
        this.startMatch(cfg);
        this.o.name = orig; this.o.model = origModel;
        this.demo = { cmds, tick: 0, limit: d.limit || 0 };
      } else {
        this.startMatch(cfg);
        this.demo = { cmds: null, tick: 0, limit: d.limit || 0 };
      }
    }

    nextFollow() {
      const g = this.game;
      if (!g) return;
      const list = g.players;
      const i = list.indexOf(this.follow);
      this.follow = list[(i + 1) % list.length];
      this.followT = this.time;
    }

    stopPlayback() {
      const wasCine = this.mode === 'cine';
      this.endSession();
      this.menu.show(wasCine ? 'cinematics' : 'demos');
    }

    toggleConsole(force) {
      const open = force === undefined ? !this.conOpen : force;
      this.conOpen = open;
      this.conEl.classList.toggle('open', open);
      if (open) {
        if (this.mode === 'play') { this.keys = {}; this.unlock(); }
        this.renderConsole();
        setTimeout(() => this.conIn.focus(), 0);
      } else {
        this.el.focus({ preventScroll: true });
        if (this.mode === 'play' && !this.opts.noLock && this.view.requestPointerLock) { try { const r = this.view.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { } }
      }
    }

    print(text) {
      this.consoleLines.push(text);
      if (this.consoleLines.length > 200) this.consoleLines.shift();
      if (this.conOpen) this.renderConsole();
    }

    renderConsole() {
      this.conLines.textContent = this.consoleLines.slice(-40).join('\n');
      this.conLines.scrollTop = this.conLines.scrollHeight;
    }

    runCommand(line) {
      line = line.trim().replace(/^[\\/]/, '');
      if (!line) return;
      this.print(']' + line);
      const [cmd, ...args] = line.split(/\s+/);
      const g = this.game;
      const c = cmd.toLowerCase();
      if (c === 'map' || c === 'devmap') {
        const m = (args[0] || '').toLowerCase();
        if (!Q.MAPS[m]) { this.print("Can't find map " + m); return; }
        const arena = Q.arena(m);
        this.toggleConsole(false);
        this.startMatch({ map: m, gametype: 'ffa', fraglimit: 20, timelimit: 0, bots: arena.bots.map(b => ({ bot: b, skill: this.o.skill + 1 })) });
      } else if (['god', 'noclip', 'kill'].includes(c) || (c === 'give' && args[0] === 'all')) {
        if (!g) { this.print('not playing'); return; }
        this.print(g.cheat(c === 'give' ? 'give all' : c) || '');
      } else if (c === 'addbot') {
        if (!g) { this.print('not playing'); return; }
        const b = (args[0] || '').toLowerCase();
        if (!Q.BOTS[b]) { this.print('unknown bot ' + b + '. bots: ' + Object.keys(Q.BOTS).join(' ')); return; }
        g.addPlayer({ bot: b, skill: Q.clamp(Number(args[1]) || 3, 1, 5) });
        this.print(Q.BOTS[b].name + ' entered the game');
      } else if (c === 'fraglimit' || c === 'timelimit') {
        if (!g) return;
        g[c] = Math.max(0, Number(args[0]) || 0);
        this.print(c + ' ' + g[c]);
      } else if (c === 'name') { this.o.name = args.join(' ').slice(0, 20) || this.o.name; this.saveProfile(); if (g && g.local) g.local.name = this.o.name; }
      else if (c === 'sensitivity') { this.o.sens = Q.clamp(Number(args[0]) || 5, 1, 30); this.saveProfile(); }
      else if (c === 'cg_fov') { this.o.fov = Q.clamp(Number(args[0]) || 90, 60, 130); this.saveProfile(); }
      else if (c === 'cg_drawfps') { this.o.fps = args[0] === '1'; this.saveProfile(); }
      else if (c === 'quit') { this.toggleConsole(false); this.exit(); }
      else if (c === 'disconnect') { this.toggleConsole(false); this.leave(); }
      else if (c === 'help' || c === 'cmdlist') this.print('map <q3dm1..q3dm6|q3tourney1|q3tourney2>, god, noclip, give all, kill, addbot <name> [skill], fraglimit, timelimit, name, sensitivity, cg_fov, cg_drawfps, disconnect, quit');
      else this.print('Unknown command "' + cmd + '"');
    }

    exit() {
      if (this.opts.onExit) this.opts.onExit();
    }

    screenshot() {
      if (!this.r) return;
      try {
        const c = document.createElement('canvas');
        c.width = Math.min(800, this.hudCv.width); c.height = Math.round(c.width * this.hudCv.height / this.hudCv.width);
        const x = c.getContext('2d');
        x.drawImage(this.view, 0, 0, c.width, c.height);
        x.drawImage(this.hudCv, 0, 0, c.width, c.height);
        const url = c.toDataURL('image/jpeg', 0.85);
        this.shotN = (this.shotN || 0) + 1;
        const name = 'shot' + String(this.shotN).padStart(4, '0') + '.jpg';
        const vfs = typeof window !== 'undefined' ? window.vfs : null;
        const dir = ['My Computer', 'C:', 'Games', 'Quake3', 'baseq3', 'screenshots'];
        if (vfs && vfs.writeFile && vfs.resolvePath(dir)) {
          vfs.writeFile(dir, name, url);
          this.hud.add('Wrote screenshots/' + name, '#ffffff', this.time);
          return;
        }
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        this.hud.add('Wrote ' + name, '#ffffff', this.time);
      } catch (e) { }
    }

    destroy() {
      cancelAnimationFrame(this.raf);
      this.audio.stopAll();
      this.unlock();
      this.keyTarget.removeEventListener('keydown', this.onKeyDown);
      this.keyTarget.removeEventListener('keyup', this.onKeyUp);
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
      document.removeEventListener('pointerlockchange', this.onLock);
      window.removeEventListener('blur', this.onBlur);
      if (this.menu) this.menu.destroy();
      try { if (this.audio.ctx) this.audio.ctx.close(); } catch (e) { }
      if (this.r && this.r.gl) { const ext = this.r.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
      this.el.remove();
    }
  }
  Q.UI = UI;
  Q.UI_DEFAULTS = DEFAULTS;
})(globalThis.Quake3 = globalThis.Quake3 || {});
