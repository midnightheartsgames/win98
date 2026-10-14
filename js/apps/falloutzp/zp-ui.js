(function (Z) {
  'use strict';

  class UI {
    constructor(root, opts = {}) {
      this.root = root;
      this.opts = opts;
      this.el = document.createElement('div');
      this.el.className = 'zp-root';
      this.el.tabIndex = 0;
      root.appendChild(this.el);
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'zp-gl';
      this.el.appendChild(this.canvas);
      this.hud = document.createElement('canvas');
      this.hud.className = 'zp-hud';
      this.el.appendChild(this.hud);
      this.layer = document.createElement('div');
      this.layer.className = 'zp-layer';
      this.el.appendChild(this.layer);
      this.keys = new Set();
      this.pressed = new Set();
      this.mouse = { dx: 0, dy: 0, b: 0, clicked: 0, wheel: 0 };
      this.cam = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, fov: 1.2, near: 0.06, far: 3200 };
      this.view = { yaw: 0, pitch: 0, third: false, dist: 2.6, bob: 0, shake: 0 };
      this.settings = Object.assign({ sens: 1, invert: false, shadows: true, fov: 72, volume: 0.8, tts: true, subtitles: true }, Z.loadSettings ? Z.loadSettings() : {}, opts.settings || {});
      this.mode = 'loading';
      this.running = true;
      this.last = 0;
      this.panels = [];
      this.bind();
      this.setLoading('Загрузка карты…');
      setTimeout(() => this.boot(), 30);
    }

    setLoading(text) {
      this.layer.innerHTML = '<div class="zp-loading"><div class="zp-loading-title">FALLOUT: ЗАПОРОЖЬЕ</div><div class="zp-loading-text">' + text + '</div></div>';
    }

    boot() {
      try {
        const t0 = performance.now();
        this.map = new Z.WorldMap();
        const t1 = performance.now();
        this.town = new Z.Town(this.map);
        const t2 = performance.now();
        this.r = new Z.Renderer(this.canvas);
        this.r.initWorld(this.map);
        this.scene = new Z.Scene(this.r, this.map, this.town);
        this.fx = new Z.FX(this.r);
        this.vm = new Z.ViewModel(this.scene);
        if (Z.Audio) this.audio = new Z.Audio(this);
        const t3 = performance.now();
        this.bootTimes = { map: Math.round(t1 - t0), town: Math.round(t2 - t1), gfx: Math.round(t3 - t2), scene: this.scene.stats, trees: this.scene.treeCount };
        this.hudUI = new Z.Hud(this);
        this.layer.innerHTML = '';
        if (this.opts.autostart !== false && !Z.MainMenu) this.startGame();
        else if (Z.MainMenu) this.openMainMenu();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
      } catch (e) {
        this.layer.innerHTML = '<div class="zp-loading"><div class="zp-loading-text">Ошибка: ' + String(e.message || e).replace(/</g, '&lt;') + '</div></div>';
        throw e;
      }
    }

    startGame(o = {}) {
      const t0 = performance.now();
      this.game = new Z.Game({ map: this.map, town: this.town, seed: o.seed });
      this.gameBuildMs = Math.round(performance.now() - t0);
      if (o.restore) this.game.restore(o.restore); else this.game.newGame(o);
      this.attachGame();
    }

    attachGame() {
      const g = this.game;
      this.view.yaw = g.player.yaw;
      this.view.pitch = 0;
      this.mode = 'play';
      if (this.scene.setCell) this.scene.setCell(g.cell);
      g.ev.on('*', ev => this.onEvent(ev));
      if (this.onAttach) this.onAttach(g);
    }

    onEvent(ev) {
      if (this.hudUI) this.hudUI.onEvent(ev);
      if (this.audio) this.audio.onEvent(ev);
      const fx = this.fx, g = this.game;
      if (!fx || !g) return;
      switch (ev.t) {
        case 'fire': {
          const a = ev.a, wd = ev.wd || {};
          let mz = ev.muzzle;
          if (!mz) {
            const gctx = a.animCtx;
            if (a.kind === 'player' && !this.view.third && this.vm.muzzleWorld) mz = this.vm.muzzleWorld;
            else if (gctx && gctx.gunM && gctx.gunId) { const gd = Z.item(gctx.gunId) || {}, gm = Z.GUN_MODELS[gd.model || gctx.gunId] || {}, m = gm.muzzle || [0, 0.05, -0.3]; mz = Z.M4.transform(gctx.gunM, m[0], m[1], m[2]); }
            else if (a.pose && a.def !== undefined && a.pose.def.index.rhand !== undefined) { const h = a.pose.bonePos('rhand'); const d = g.aimDir(a); mz = [h[0] + d[0] * 0.45, h[1] + d[1] * 0.45 + 0.08, h[2] + d[2] * 0.45]; }
            else mz = [a.x, a.y + (a.height || 1.6) * 0.75, a.z];
          }
          const d = g.aimDir(a);
          const energy = wd.sound === 'arc' || wd.sound === 'beam' || wd.sound === 'ray';
          if (!energy) fx.muzzle(mz, d, wd.wtype === 'shotgun' || wd.auto, a.kind === 'player' && !this.view.third);
          for (const s of ev.shots || []) {
            if (wd.sound === 'ray') fx.beam(mz, [s.x, s.y, s.z], [1.6, 0.5, 0.2]);
            else if (wd.sound === 'beam') fx.beam(mz, [s.x, s.y, s.z], [1.2, 0.9, 0.4]);
            else if (wd.sound === 'arc') fx.arc(mz, [s.x, s.y, s.z]);
            else if (Math.random() < (wd.pellets > 1 ? 0.3 : 0.6)) fx.tracer(mz, [s.x, s.y, s.z]);
          }
          if (a.kind === 'player') { this.vm.st.kick = Math.min(1, this.vm.st.kick + (wd.twoHand ? 0.6 : 0.8)); this.view.pitch = Math.min(1.45, this.view.pitch + (wd.auto ? 0.006 : 0.012)); }
          break;
        }
        case 'impact': fx.impact([ev.x, ev.y, ev.z], ev.n || [0, 1, 0], ev.surf); break;
        case 'hit': {
          if (ev.x === undefined) break;
          const a = ev.a;
          if (a.robot) fx.impact([ev.x, ev.y, ev.z], [0, 1, 0], 'metal');
          else if (a.plant) fx.blood([ev.x, ev.y, ev.z], ev.dir, 1, [0.4, 0.5, 0.15]);
          else fx.blood([ev.x, ev.y, ev.z], ev.dir, ev.crit ? 2 : 1, a.cdef && a.beast && a.def === 'kolorad' ? [0.6, 0.55, 0.2] : null);
          break;
        }
        case 'explosion': fx.explosion([ev.x, ev.y, ev.z], ev.r); { const p = g.player; const d = Math.hypot(p.x - ev.x, p.z - ev.z); this.view.shake = Math.max(this.view.shake, Z.clamp(1 - d / 40, 0, 1)); } break;
        case 'arc': fx.arc([ev.a.x, ev.a.y + 1.2, ev.a.z], [ev.b.x, ev.b.y + 1.2, ev.b.z]); break;
        case 'husk': fx.tracer(ev.from, ev.to, [0.9, 0.85, 0.4], 0.03); break;
        case 'dirt': fx.dirt([ev.x, ev.y, ev.z]); break;
        case 'emerge': for (let i = 0; i < 4; i++) fx.dirt([ev.a.x, ev.a.y, ev.a.z]); break;
        case 'splash': fx.splash([ev.x, ev.y, ev.z], !ev.small); break;
        case 'hurt': if (ev.a && ev.a.kind === 'player') this.view.shake = Math.max(this.view.shake, 0.25); break;
        default: break;
      }
    }

    bind() {
      this.onKey = e => {
        if (e.type === 'keydown') {
          const toPanel = this.onPanelKey && (this.panels.length || this.mode === 'vats');
          if (!toPanel && !this.keys.has(e.code)) this.pressed.add(e.code);
          this.keys.add(e.code);
          if (['Tab', 'Space', 'F5', 'F9', 'F7', 'F8', 'Escape', 'ArrowUp', 'ArrowDown', 'Backquote'].includes(e.code) || e.ctrlKey) e.preventDefault();
          if (toPanel) this.onPanelKey(e);
        } else this.keys.delete(e.code);
      };
      this.el.addEventListener('keydown', this.onKey);
      this.el.addEventListener('keyup', this.onKey);
      this.el.addEventListener('mousedown', e => {
        this.mouse.b |= 1 << e.button;
        this.mouse.clicked |= 1 << e.button;
        this.el.focus({ preventScroll: true });
        if (this.mode === 'play' && !this.panels.length && this.canvas.requestPointerLock && document.pointerLockElement !== this.canvas) {
          try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (err) { this.noLock = true; }
        }
      });
      this.el.addEventListener('mouseup', e => { this.mouse.b &= ~(1 << e.button); });
      this.el.addEventListener('mousemove', e => {
        if (document.pointerLockElement === this.canvas || (this.mouse.b & 4)) { this.mouse.dx += e.movementX; this.mouse.dy += e.movementY; }
      });
      this.el.addEventListener('wheel', e => { this.mouse.wheel += Math.sign(e.deltaY); if (this.mode === 'play') e.preventDefault(); }, { passive: false });
      this.el.addEventListener('contextmenu', e => e.preventDefault());
      this.el.addEventListener('blur', () => { this.keys.clear(); this.mouse.b = 0; });
    }

    loop(ts) {
      if (this.destroyed) return;
      const dt = Math.min(0.1, Math.max(0, (ts - (this.last || ts)) / 1000));
      this.last = ts;
      if (this.running) this.tick(dt);
      requestAnimationFrame(this.loop);
    }

    input() {
      const k = this.keys, v = this.view, s = this.settings.sens * 0.0022 / (this.aimZoom || 1);
      this.turnX = this.mouse.dx; this.turnY = this.mouse.dy;
      v.yaw = Z.wrap(v.yaw + this.mouse.dx * s);
      v.pitch = Z.clamp(v.pitch - this.mouse.dy * s * (this.settings.invert ? -1 : 1), -1.45, 1.45);
      if (k.has('ArrowLeft')) v.yaw -= 0.03;
      if (k.has('ArrowRight')) v.yaw += 0.03;
      this.mouse.dx = this.mouse.dy = 0;
      const mf = (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0), ms = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
      if (this.pressed.has('ControlLeft') || this.pressed.has('ControlRight')) this.sneak = !this.sneak;
      if (this.pressed.has('CapsLock')) this.alwaysWalk = !this.alwaysWalk;
      const shift = k.has('ShiftLeft') || k.has('ShiftRight');
      const inp = {
        move: [mf, ms], yaw: v.yaw, pitch: v.pitch, jump: this.pressed.has('Space'), sneak: this.sneak,
        walk: this.alwaysWalk ? !shift : shift, fire: !!(this.mouse.b & 1), firePressed: !!(this.mouse.clicked & 1),
        aim: (this.aimT || 0) > 0.6, aimPressed: !!(this.mouse.clicked & 2), use: this.pressed.has('KeyE'), reload: this.pressed.has('KeyR')
      };
      if (v.third) {
        const c = this.cam, cp = Math.cos(c.pitch);
        const d = [Math.sin(c.yaw) * cp, Math.sin(c.pitch), -Math.cos(c.yaw) * cp];
        const hit = this.game.cell.cw.raycast(c.x, c.y, c.z, d[0], d[1], d[2], 300);
        const actor = this.game.actorRay(c.x, c.y, c.z, d[0], d[1], d[2], hit ? hit.t : 300, this.game.player);
        const tp = actor ? [actor.x, actor.y, actor.z] : hit ? [hit.x, hit.y, hit.z] : [c.x + d[0] * 300, c.y + d[1] * 300, c.z + d[2] * 300];
        const eye = this.game.eyeOf(this.game.player);
        const dx = tp[0] - eye[0], dy = tp[1] - eye[1], dz = tp[2] - eye[2], L = Math.hypot(dx, dy, dz) || 1;
        inp.dir = [dx / L, dy / L, dz / L];
      }
      this.tpAimDir = v.third ? inp.dir : null;
      return inp;
    }

    updateCamera(dt) {
      const p = this.game.player, c = this.cam, v = this.view;
      if (this.pressed.has('KeyF')) v.third = !v.third;
      const crouch = p.dead ? 0.3 : p.sneak ? 1.05 : 1.62;
      v.eye = Z.approach(v.eye || crouch, crouch, dt * 3);
      const sp = Math.hypot(p.vx, p.vz);
      v.bob += dt * sp * 1.9;
      const bob = p.onGround && !v.third ? Math.sin(v.bob * 2) * 0.03 * Z.clamp(sp / 4, 0, 1) : 0;
      v.shake = Math.max(0, v.shake - dt * 1.8);
      const sh = v.shake * v.shake;
      const ex = p.x + (Math.random() - 0.5) * sh * 0.3, ey = p.y + v.eye + bob + (Math.random() - 0.5) * sh * 0.3, ez = p.z + (Math.random() - 0.5) * sh * 0.3;
      c.yaw = v.yaw; c.pitch = v.pitch;
      this.updateAim(dt);
      c.fov = this.settings.fov * Math.PI / 180 / this.aimZoom;
      if (!v.third || this.scoped) { c.x = ex; c.y = ey; c.z = ez; return; }
      const cp = Math.cos(v.pitch), fx = Math.sin(v.yaw) * cp, fy = Math.sin(v.pitch), fz = -Math.cos(v.yaw) * cp;
      const rx = Math.cos(v.yaw), rz = Math.sin(v.yaw), at = this.aimT * this.aimT * (3 - 2 * this.aimT);
      const side = Z.lerp(0.45, 0.55, at), sx = ex + rx * side, sy = ey + 0.1 - 0.08 * at, sz = ez + rz * side;
      let d = Z.lerp(v.dist, 1.05, at);
      const hit = this.game.cell.cw.raycast(sx, sy, sz, -fx, -fy, -fz, d + 0.3);
      if (hit) d = Math.max(0.4, hit.t - 0.3);
      c.x = sx - fx * d; c.y = Math.max(sy - fy * d, this.game.cell.cw.terrainH(sx - fx * d, sz - fz * d) + 0.3); c.z = sz - fz * d;
    }

    updateAim(dt) {
      const p = this.game.player, wv = p.wv, sd = wv ? Z.item(wv.id) : null, kind = sd ? Z.wieldKind(sd) : 'unarmed';
      const can = this.mode === 'play' && (kind === 'rifle' || kind === 'pistol') && wv.k >= 1 && !p.holstered && !(p.reloading > 0) && !p.swim && !p.dead;
      const want = can && !!(this.mouse.b & 2);
      this.aimT = Z.approach(this.aimT || 0, want ? 1 : 0, dt * (want ? 6 : 9));
      const scope = sd && sd.scope && can ? sd.scope : 0;
      this.scoped = !!scope && want && this.aimT > 0.9;
      const zoom = this.scoped ? scope : 1 + (this.view.third ? 0.3 : 0.25) * this.aimT;
      this.aimZoom = this.scoped || (this.aimZoom || 1) > zoom + 0.5 ? zoom : Z.approach(this.aimZoom || 1, zoom, dt * 6);
    }

    tick(dt) {
      if (this.game && (this.mode === 'play' || this.mode === 'fly')) {
        const inp = this.input();
        if (this.pressed.has('F8')) this.mode = this.mode === 'fly' ? 'play' : 'fly';
        if (this.onPlayKeys) this.onPlayKeys(inp, dt);
        if (this.mode === 'fly') this.fly(dt);
        else if (this.mode === 'play') {
          this.game.lastEnv = this.env;
          this.game.update(dt, inp);
          this.updateCamera(dt);
          this.updateTarget();
        }
      } else if (this.game && this.modeTick) this.modeTick(dt);
      this.pressed.clear();
      this.mouse.clicked = 0;
      this.mouse.wheel = 0;
      if (this.audio) this.audio.update(dt);
      this.render(dt);
    }

    updateTarget() {
      const g = this.game, c = this.cam, cp = Math.cos(c.pitch);
      const d = [Math.sin(c.yaw) * cp, Math.sin(c.pitch), -Math.cos(c.yaw) * cp];
      const wh = g.cell.cw.raycast(c.x, c.y, c.z, d[0], d[1], d[2], 120);
      const ah = g.actorRay(c.x, c.y, c.z, d[0], d[1], d[2], wh ? wh.t : 120, g.player);
      this.target = null;
      if (ah && !ah.a.dead && (ah.t < 60 || g.hostileToPlayer(ah.a))) {
        const a = ah.a;
        this.target = { a, name: a.name, hostile: g.hostileToPlayer(a), hpFrac: g.hostileToPlayer(a) || a.hp < a.hpMax ? a.hp / a.hpMax : undefined };
      }
      this.lookHit = { world: wh, actor: ah, dir: d };
      const wd = g.player.weapon();
      this.spreadPx = wd && wd.spread ? Z.clamp(g.spreadFor(g.player, wd, { aim: (this.aimT || 0) > 0.6 }) * 6, 4, 60) : 8;
    }

    stealthState() {
      const g = this.game, p = g.player;
      let danger = false, caution = false, max = 0;
      for (const a of g.cell.actors) {
        if (!a.ai || a.dead || a.kind === 'player') continue;
        if (a.ai.state === 'combat' && a.ai.target === p) danger = true;
        if (g.hostileToPlayer(a) && (a.ai.state === 'search' || (a.ai.aware || 0) > 0.3)) caution = true;
        max = Math.max(max, a.ai.aware || 0);
      }
      if (danger) return { text: 'ОПАСНОСТЬ', danger: true };
      if (!p.sneak) return null;
      if (caution || max >= 1) return { text: 'ВНИМАНИЕ' };
      return { text: 'СКРЫТ' };
    }

    fly(dt) {
      const c = this.cam, k = this.keys, v = this.view;
      c.yaw = v.yaw; c.pitch = v.pitch;
      const sp = (k.has('ShiftLeft') ? 120 : 25) * dt;
      const fx = Math.sin(c.yaw) * Math.cos(c.pitch), fy = Math.sin(c.pitch), fz = -Math.cos(c.yaw) * Math.cos(c.pitch);
      if (k.has('KeyW')) { c.x += fx * sp; c.y += fy * sp; c.z += fz * sp; }
      if (k.has('KeyS')) { c.x -= fx * sp; c.y -= fy * sp; c.z -= fz * sp; }
      if (k.has('KeyA')) { c.x -= Math.cos(c.yaw) * sp; c.z -= Math.sin(c.yaw) * sp; }
      if (k.has('KeyD')) { c.x += Math.cos(c.yaw) * sp; c.z += Math.sin(c.yaw) * sp; }
      if (k.has('KeyE') || k.has('Space')) c.y += sp;
      if (k.has('KeyQ')) c.y -= sp;
    }

    animateActor(a, dt) {
      const an = a.anim, sp = Math.hypot(a.vx, a.vz);
      if (a.dead) { an.t += dt; return; }
      if (!a.animCtx) a.animCtx = {};
      const ctx = a.animCtx, player = a.kind === 'player';
      if (player && this.mode === 'play') a.yaw = this.view.yaw;
      const fy = Math.sin(a.yaw), fz = -Math.cos(a.yaw);
      const fwd = a.vx * fy + a.vz * fz, side = a.vx * -fz + a.vz * fy;
      const back = sp > 0.15 && fwd < -0.3 * sp;
      let ang = sp > 0.15 ? Math.atan2(side, fwd) : 0;
      if (back) ang = Z.wrap(ang - Math.PI);
      ctx.back = back;
      ctx.strafe = Z.approach(ctx.strafe || 0, -Z.clamp(ang, back ? -0.6 : -1.1, back ? 0.6 : 1.1), dt * 5);
      const dyaw = an.lastYaw === undefined ? 0 : Z.wrap(a.yaw - an.lastYaw) / Math.max(dt, 1e-3);
      an.lastYaw = a.yaw;
      if (sp < 0.15 && Math.abs(dyaw) > 0.7 && !a.sneak) an.turnT = 0.35;
      an.turnT = Math.max(0, (an.turnT || 0) - dt);
      ctx.turnStep = sp < 0.15 ? Math.min(1, an.turnT / 0.2) * 0.6 : 0;
      const stride = sp > 3 ? 1.55 : 0.95;
      an.phase += dt * Math.PI * 2 * stride * Math.max(Math.min(1, sp / 1.2) * (sp > 0.15 ? 1 : 0), ctx.turnStep) * (back ? -1 : 1);
      const grounded = a.onGround !== false || a.swim || a.flying;
      an.airT = grounded ? 0 : (an.airT || 0) + dt;
      if (grounded && an.wasAir > 0.25 && (an.vyPrev || 0) < -2) an.land = Math.min(1, -(an.vyPrev || 0) * 0.11);
      an.wasAir = grounded ? 0 : an.airT;
      an.vyPrev = a.vy || 0;
      an.land = Math.max(0, (an.land || 0) - dt * 3.5);
      ctx.air = Z.approach(ctx.air || 0, an.airT > 0.12 ? 1 : 0, dt * 6);
      ctx.rising = (a.vy || 0) > 0 ? 1 : 0;
      ctx.land = an.land;
      if (an.fire >= 0.999) an.sinceFire = 0;
      an.sinceFire = (an.sinceFire === undefined ? 9 : an.sinceFire) + dt;
      an.fire = Math.max(0, an.fire - dt * 6);
      an.hit = Math.max(0, an.hit - dt * 3);
      an.swing = Math.max(0, an.swing - dt * 2.2);
      an.reload = a.reloading > 0 ? 1 - a.reloading / (a.reloadTotal || 1) : 0;
      an.throwT = Math.max(0, (an.throwT || 0) - dt * 1.8);
      ctx.speed = a.flying ? 0 : sp;
      ctx.scale = a.look ? (a.look.height || 1) * (a.look.scale || 1) : 1;
      const humanRig = !a.rig && (!!a.look || player);
      if (humanRig && a.weapon) {
        const we = a.equip && a.equip.weapon;
        let wid = we ? we.id : 'fists';
        const q = player && this.quick;
        if (q) { q.t += dt; wid = q.keep; if (q.t > 0.62) this.quick = null; }
        const want = player ? !a.holstered : !!(a.combat || a.drawn || a.aiming);
        const wv = a.wv || (a.wv = { id: wid, k: want ? 1 : 0, dir: 1 });
        const T = Z.WIELD_TIMES;
        if (wv.id !== wid) { wv.dir = -1; wv.k = Math.max(0, wv.k - dt / T.holster); if (wv.k <= 0) { wv.id = wid; wv.dir = 1; } }
        else if (want) { if (wv.k < 1) { wv.k = Math.min(1, wv.k + dt / T.draw); wv.dir = 1; } }
        else if (wv.k > 0) { wv.k = Math.max(0, wv.k - dt / T.holster); wv.dir = -1; }
        ctx.wid = wv.id;
        ctx.wk = wv.k;
        ctx.wdir = wv.dir;
        const wd = Z.item(wv.id) || Z.item('fists'), H = Z.holdOf(wd.model || wv.id);
        if (an.reload > 0) { if (!an.rounds) { const lim = player || a.ammoLimited ? a.count(wd.ammo) : 99; an.rounds = Math.max(1, Math.min((wd.mag || 1) - ((we && we.loaded) || 0), lim)); } }
        else an.rounds = 0;
        ctx.rounds = an.rounds;
        ctx.cycle = H.bolt === 'turn' && an.sinceFire < 0.95 && !(an.reload > 0) ? Z.clamp((an.sinceFire - 0.1) / 0.8, 0, 1) : 0;
      } else ctx.wid = undefined;
      ctx.aim = !!(a.aiming || (player && this.mouse.b & 2));
      const firing = player && this.mode === 'play' && (this.mouse.b & 1) && a.weapon && !a.holstered;
      const alert = ctx.aim || firing || an.sinceFire < 1.2;
      if (an.sinceFire < 0.05) ctx.aimK = 1;
      ctx.aimK = Z.approach(ctx.aimK || 0, alert ? 1 : 0, dt * (alert ? 12 : 3));
      ctx.combat = !!a.combat;
      const tpDir = player && this.view.third && !this.scoped ? this.tpAimDir : null;
      ctx.aimYaw = tpDir ? Math.atan2(tpDir[0], -tpDir[2]) : undefined;
      ctx.aimPitch = tpDir ? Math.asin(Z.clamp(tpDir[1], -1, 1)) : player ? this.view.pitch : (a.aimPitch || 0);
      ctx.talk = a.talkAnim || 0;
      ctx.mouth = a.mouth || 0;
    }

    render(dt) {
      if (!this.game) { this.renderIdle(dt); return; }
      const g = this.game;
      const interior = !!g.cell.interior;
      const env = interior ? Z.interiorEnv(g.cell, g.time) : Z.envAt(g.time, g.wx);
      this.env = env;
      const sc = this.scene, c = this.cam, p = g.player;
      sc.shadowsOn = this.settings.shadows;
      sc.extraShadow = r => { const sp = sc.showPlayer; sc.showPlayer = true; sc.drawActorList(r, g.cell.actors, this.r.time, true); sc.showPlayer = sp; };
      for (const a of g.cell.actors) this.animateActor(a, dt);
      this.fx.update(dt);
      for (const f of g.fires || []) if (Math.random() < dt * 30) this.fx.flame([f.x + (Math.random() - 0.5) * f.r * 1.4, f.y, f.z + (Math.random() - 0.5) * f.r * 1.4], 0.5);
      for (const a of g.cell.actors) if (a.burning > 0 && Math.random() < dt * 20) this.fx.flame([a.x, a.y + 0.6 + Math.random(), a.z], 0.3);
      for (const pr of g.projs || []) if (pr.rocket && Math.random() < dt * 40) this.fx.smoke([pr.x, pr.y, pr.z], 0.2, [0.5, 0.5, 0.5]);
      const pts = [];
      for (const l of this.fx.lights) pts.push({ x: l.x, y: l.y, z: l.z, r: l.r, c: l.c.map(v => v * (1 - l.t / l.life)) });
      for (const f of g.fires || []) pts.push({ x: f.x, y: f.y + 1, z: f.z, r: 8, c: [1.6, 0.8, 0.3] });
      for (const l of g.cell.lights || []) if (!l.night || env.night > 0.25) pts.push({ x: l.x, y: l.y, z: l.z, r: l.r, c: l.flicker ? l.c.map(v => v * (0.85 + Math.random() * 0.15)) : l.c });
      if (p.lightOn) pts.push({ x: c.x + Math.sin(c.yaw) * 0.5, y: c.y, z: c.z - Math.cos(c.yaw) * 0.5, r: 9, c: [1.1, 0.75, 0.35] });
      if (this.extraLights) this.extraLights(pts);
      pts.sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z));
      this.r.points = pts.slice(0, 8);
      if (this.mode !== 'play') this.updateAim(dt);
      sc.showPlayer = (this.view.third && !this.scoped) || p.dead;
      const vmState = this.vmState ? this.vmState(dt) : null;
      this.r.frame(c, env, dt, {
        interior,
        shadow: r => { if (interior) { r.shadowTex = r.dummyShadow; r.shadowP = [0, 0, 0, 0]; } else sc.shadowPass(r, [p.x, p.y, p.z]); },
        opaque: r => {
          if (sc.drawCell) sc.drawCell(r); else { sc.drawStatic(r); sc.drawTrees(r); }
          sc.drawActorList(r, g.cell.actors, this.r.time);
          sc.drawHeldList(r, g.cell.actors);
          if (this.drawWorldObjects) this.drawWorldObjects(r);
        },
        transparent: r => { this.fx.draw(r); },
        overlay: r => { if (vmState && !this.view.third && !this.scoped && !p.dead && vmState.k > 0 && this.mode !== 'fly') this.vm.draw(r, c, vmState); }
      });
      this.hudUI.draw(dt);
    }

    vmState(dt) {
      const p = this.game.player, we = p.equip.weapon, wv = p.wv || { id: we ? we.id : 'fists', k: p.holstered ? 0 : 1, dir: 1 };
      const wd = Z.item(wv.id) || Z.item('fists'), shown = we && we.id === wv.id ? we : null;
      const look = (Z.dressedLook && Z.dressedLook(p)) || p.look || {};
      const ctx = p.animCtx || {}, q = this.quick;
      const st = {
        wid: wv.id, k: wv.k, dir: wv.dir, aim: !!(this.mouse.b & 2), ads: this.aimT || 0, move: Z.clamp(Math.hypot(p.vx, p.vz) / 4, 0, 1), speed: Math.hypot(p.vx, p.vz),
        turnX: this.turnX || 0, turnY: this.turnY || 0, reload: p.anim.reload || 0, swing: q ? 0 : p.anim.swing || 0, throwT: q ? 0 : p.anim.throwT || 0,
        punchSide: p.punchSide ? 1 : 0, look, vy: p.vy || 0, onGround: p.onGround !== false || !!p.swim, rounds: ctx.rounds || 0, cycle: ctx.cycle || 0,
        empty: !!(wd.mag && shown && (shown.loaded || 0) <= 0), firing: !!(this.mouse.b & 1), sinceFire: p.anim.sinceFire, quick: q ? { model: q.model, u: Z.clamp(q.t / 0.62, 0, 1) } : null
      };
      this.vm.update(dt, st);
      return st;
    }

    renderIdle() {}

    destroy() {
      this.destroyed = true;
      if (this.audio && this.audio.destroy) this.audio.destroy();
      if (document.pointerLockElement === this.canvas) document.exitPointerLock();
      this.el.remove();
    }
  }

  Z.UI = UI;
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
