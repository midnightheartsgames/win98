(function (S) {
  'use strict';
  const TC = globalThis.TouchControls;
  const { clamp, wrapAng } = S;
  const { WEAPONS, WEAPON_ORDER } = S.DATA;
  const DEG = Math.PI / 180;

  const TUNE = {
    lookRadPerMm: 0.004,
    assist: [
      { magnet: 1, magnetCone: 0, pull: 0, pullCone: 0 },
      { magnet: 0.8, magnetCone: 3, pull: 4, pullCone: 5 },
      { magnet: 0.6, magnetCone: 4, pull: 8, pullCone: 6 }
    ],
    stick: { radiusMm: 11, deadZone: 0.08, zone: { x: 0, y: 0.22, w: 0.45, h: 0.78 } },
    look: { zone: { x: 0.45, y: 0, w: 0.55, h: 1 } },
    fire: { size: 19, at: { right: 12, bottom: 10 } },
    jump: { size: 12, at: { right: 36, bottom: 28 } },
    reload: { size: 11, at: { right: 38, bottom: 8 } },
    weapon: { size: 14, at: { right: 5, top: 5 } },
    pause: { size: 11, at: { left: 5, top: 5 } },
    haptic: { heavy: 18, light: 7, lightEvery: 0.12, hurt: 40 },
    weakPhoneMB: 6000
  };

  const HEAVY = new Set(['cannon', 'rocket', 'grenade', 'dshotgun', 'shotgun', 'laser']);
  const ACTIONS = ['move', 'look', 'fire', 'jump', 'weapon', 'reload', 'pause', 'netricsa'];
  const LAYOUT = { move: 'stick', look: 'lookArea', fire: 'fire', jump: 'jump', weapon: 'weapon', reload: 'reload', pause: 'pause', netricsa: 'menu:pause' };

  function aimAssist(view, targets, level, dt, firing) {
    const t = TUNE.assist[clamp(level | 0, 0, TUNE.assist.length - 1)];
    let best = null, bestAng = Infinity;
    for (const g of targets) {
      const dx = g.x - view.x, dy = g.y - view.y, dz = g.z - view.z;
      const yawTo = Math.atan2(dx, dz), pitchTo = Math.atan2(dy, Math.hypot(dx, dz));
      const ey = wrapAng(yawTo - view.yaw), ep = pitchTo - view.pitch;
      const ang = Math.hypot(ey * Math.cos(view.pitch), ep) / DEG;
      if (ang < bestAng) { bestAng = ang; best = { target: g, ey, ep }; }
    }
    const out = { scale: 1, dyaw: 0, dpitch: 0, target: null, angle: bestAng };
    if (!best) return out;
    if (bestAng <= t.magnetCone) { out.scale = t.magnet; out.target = best.target; }
    if (firing && bestAng <= t.pullCone && t.pull > 0) {
      const step = t.pull * DEG * dt;
      out.dyaw = clamp(best.ey, -step, step);
      out.dpitch = clamp(best.ep, -step, step);
      out.target = best.target;
    }
    return out;
  }

  class Touch {
    static wanted() { return !!(TC && TC.wanted()); }

    constructor(ui) {
      this.ui = ui;
      this.bridge = globalThis.Parohod98Game || null;
      const T = k => ui.t(k), o = ui.options;
      if (o.touchSens == null) o.touchSens = 5;
      if (o.aim == null) o.aim = 2;
      if (this.bridge && !o.phonePreset) {
        let mem = {};
        try { mem = JSON.parse(this.bridge.memory()) || {}; } catch (e) {}
        const weak = !!mem.lowRam || (mem.totalMB > 0 && mem.totalMB < TUNE.weakPhoneMB);
        o.quality = weak ? 0 : 2;
        o.phonePreset = weak ? 'weak' : 'phone';
        ui.saveOptions();
      }
      if (this.bridge) ui.opts.onExit = () => this.bridge.exit();
      const tc = this.tc = TC.create({ className: 'ss98-touch' });
      this.stick = tc.stick({ zone: TUNE.stick.zone, radiusMm: TUNE.stick.radiusMm, deadZone: TUNE.stick.deadZone, cls: 'ss98-tstick' });
      this.lookArea = tc.look({ zone: TUNE.look.zone });
      this.fire = tc.button({ label: T('fireBtn'), at: TUNE.fire.at, size: TUNE.fire.size, look: this.lookArea, cls: 'ss98-tfire' });
      this.jump = tc.button({ label: T('jumpBtn'), at: TUNE.jump.at, size: TUNE.jump.size, cls: 'ss98-tbtn' });
      this.reload = tc.button({ label: 'R', at: TUNE.reload.at, size: TUNE.reload.size, cls: 'ss98-tbtn', onTap: () => { ui.pendReload = true; } });
      this.weapon = tc.button({ label: '', sub: '', at: TUNE.weapon.at, size: TUNE.weapon.size, cls: 'ss98-tbtn ss98-tweapon', onTap: () => this.cycle(1), onSwipe: d => this.cycle(d), onLong: () => this.weaponList() });
      this.pause = tc.button({ label: 'II', at: TUNE.pause.at, size: TUNE.pause.size, cls: 'ss98-tbtn', onTap: () => { if (ui.state === 'play' && !ui.menu) ui.openMenu('pause'); } });
      tc.onAny = () => ui.audio.resume();
      this.lastWeapon = null;
      this.lightT = 0;
      this.hinted = false;
      this.onTap = e => {
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        e.preventDefault();
        this.tap(e);
      };
      ui.root.addEventListener('pointerdown', this.onTap, { passive: false });
      if (this.bridge) {
        globalThis.parohod98Back = () => this.back();
        globalThis.parohod98Pause = on => this.pauseApp(on);
      }
      this.onLost = e => {
        e.preventDefault();
        ui.gfxReset = true;
        setTimeout(() => location.reload(), 1500);
      };
      ui.glc.addEventListener('webglcontextlost', this.onLost);
      this.injectStyle();
    }

    injectStyle() {
      if (document.getElementById('ss98-touch-style')) return;
      const st = document.createElement('style');
      st.id = 'ss98-touch-style';
      st.textContent = [
        '.ss98-touch .tc-btn{background:radial-gradient(circle at 50% 35%,rgba(40,90,150,.75),rgba(0,15,40,.75));border:2px solid rgba(120,200,255,.8);font-family:Impact,"Arial Black",sans-serif;letter-spacing:.5px}',
        '.ss98-touch .ss98-tfire{border-color:#ffb020;background:radial-gradient(circle at 50% 35%,rgba(200,90,20,.8),rgba(70,20,0,.8));font-size:16px}',
        '.ss98-touch .ss98-tweapon{border-radius:8px;font-size:11px}',
        '.ss98-touch .tc-stick{border:2px solid rgba(120,200,255,.7);background:rgba(0,20,50,.35)}',
        '.ss98-touch .tc-knob{background:rgba(120,200,255,.6);border:2px solid #cfe8ff}',
        '.tc-hint.ss98-touch div{background:rgba(0,15,40,.92);border:2px solid rgba(120,200,255,.8)}',
        '.tc-hint.ss98-touch h3{margin:0 0 8px;color:#ffe070;font:22px Impact,"Arial Black",sans-serif}',
        '.tc-hint.ss98-touch button,.tc-list.ss98-touch button{background:#0a2a50;color:#ffe070;border:2px solid #78c8ff}',
        '.tc-list.ss98-touch button:disabled{color:#777}'
      ].join('\n');
      document.head.appendChild(st);
    }

    hudInsets() {
      const now = performance.now();
      if (this.insets && now - this.insetsAt < 500) return this.insets;
      this.insetsAt = now;
      this.insets = this.measureInsets();
      return this.insets;
    }

    measureInsets() {
      const r = this.ui.root.getBoundingClientRect();
      if (!r.height) return { left: 10, right: 10 };
      const k = 600 / r.height, p = this.pause.el.getBoundingClientRect(), w = this.weapon.el.getBoundingClientRect();
      const left = this.pause.shown && p.width ? (Math.max(p.right, 0) - r.left) * k : 10;
      const right = this.weapon.shown && w.width ? (r.right - Math.min(w.left, r.right)) * k : 10;
      return this.tc.prefs.left ? { left: right, right: left } : { left, right };
    }

    cycle(d) { this.ui.mouse.wheel += d; }

    weaponList() {
      const g = this.ui.game;
      if (!g) return;
      const p = g.player;
      const opts = WEAPON_ORDER.filter(w => p.weapons.has(w)).map(w => {
        const d = WEAPONS[w];
        return { value: w, label: this.ui.L(d.name).toUpperCase() + (d.ammo ? ' · ' + p.ammo[d.ammo] : ''), disabled: !g.hasAmmo(w) };
      });
      this.tc.choose(opts, w => { this.ui.pendWeapon = w; this.ui.wsel = 1.6; });
    }

    merge(i) {
      i.fwd = clamp((i.fwd || 0) - this.stick.y, -1, 1);
      i.strafe = clamp((i.strafe || 0) + this.stick.x, -1, 1);
      if (this.fire.down) i.fire = true;
      if (this.jump.down) i.jump = true;
      return i;
    }

    targets(g) {
      const out = [];
      for (const e of g.enemies) if (!e.dead && !(e.spawnT > 0)) out.push({ x: e.x, y: e.y + e.h * 0.5, z: e.z, e });
      return out;
    }

    visible(g, p, t) {
      const eye = g.eye, dx = t.x - p.x, dy = t.y - eye, dz = t.z - p.z, L = Math.hypot(dx, dy, dz);
      if (L < 1e-3) return true;
      const tr = g.trace(p.x, eye, p.z, dx / L, dy / L, dz / L, L + 2);
      return tr.e === t.e;
    }

    look(dt, g, p) {
      const d = this.tc.takeLook(this.lookArea);
      const o = this.ui.options, k = TUNE.lookRadPerMm * o.touchSens;
      let dyaw = -d.dx * k, dpitch = -d.dy * k * (o.invert ? -1 : 1);
      if (o.aim > 0 && g && !p.dead) {
        const all = this.targets(g).filter(t => Math.hypot(t.x - p.x, t.z - p.z) < 120);
        const view = { x: p.x, y: g.eye, z: p.z, yaw: p.yaw, pitch: p.pitch };
        const near = all.map(t => ({ t, a: aimAssist(view, [t], o.aim, dt, false).angle })).sort((a, b) => a.a - b.a).slice(0, 3);
        const seen = near.filter(n => this.visible(g, p, n.t)).map(n => n.t);
        const r = aimAssist(view, seen, o.aim, dt, this.fire.down);
        dyaw = dyaw * r.scale + r.dyaw;
        dpitch = dpitch * r.scale + r.dpitch;
      }
      if (!p.dead && (dyaw || dpitch)) {
        p.yaw = wrapAng(p.yaw + dyaw);
        p.pitch = clamp(p.pitch + dpitch, -1.5, 1.5);
        this.ui.sway[0] = clamp(this.ui.sway[0] + d.dx * 0.0006, -0.03, 0.03);
      }
    }

    update(dt) {
      const ui = this.ui, g = ui.game, playing = !!g && ui.state === 'play' && !ui.menu && !ui.debug && !ui.gfxReset;
      this.tc.show(playing);
      if (!g) return;
      const p = g.player;
      this.tc.setShown(this.reload, p.cur === 'colt' && !p.infAmmo);
      const label = p.cur + ':' + (WEAPONS[p.cur].ammo ? p.ammo[WEAPONS[p.cur].ammo] : '');
      if (label !== this.lastWeapon) {
        this.lastWeapon = label;
        const d = WEAPONS[p.cur];
        this.weapon.el.querySelector('b').textContent = ui.L(d.name).split(' ')[0].slice(0, 9).toUpperCase();
        const sub = this.weapon.el.querySelector('small');
        if (sub) sub.textContent = d.ammo ? (p.infAmmo ? '∞' : String(p.ammo[d.ammo])) : '';
      }
      if (this.lightT > 0) this.lightT -= dt;
      if (playing && !this.hinted) {
        this.hinted = true;
        this.tc.hint('serioussam', ui.t('hintTitle'), ui.S.helpTouch, ui.lang === 'ru' ? 'Понятно' : 'Got it');
      }
    }

    event(e) {
      if (e.t === 'fire') {
        if (HEAVY.has(e.w)) this.tc.vibrate(TUNE.haptic.heavy);
        else if (this.lightT <= 0) { this.tc.vibrate(TUNE.haptic.light); this.lightT = TUNE.haptic.lightEvery; }
      } else if (e.t === 'hurt') this.tc.vibrate(TUNE.haptic.hurt);
    }

    tap(e) {
      const ui = this.ui;
      ui.audio.resume();
      if (ui.debug) { ui.debugHover(e); ui.debugClick(e); return; }
      if (ui.menu) { ui.menuHover(e); ui.menuClick(e); return; }
      if (ui.state === 'dead') { if (ui.deadT > 1) ui.restartLevel(); return; }
      if (ui.state === 'stats') { if (ui.statsT > 1) ui.nextLevel(); return; }
      if (ui.state === 'victory' && ui.victoryT > 3) { ui.state = 'title'; ui.loadDemo(); ui.openMenu('main'); }
    }

    back() {
      const ui = this.ui;
      if (document.querySelector('.tc-list')) { document.querySelector('.tc-list').remove(); return true; }
      if (ui.debug) { ui.closeDebug(); return true; }
      if (ui.menu === 'main') {
        const q = ui.menuItems.findIndex(m => m.label === ui.t('quit'));
        if (q < 0) return false;
        if (ui.menuSel === q) ui.menuItems[q].act(); else ui.menuSel = q;
        return true;
      }
      if (ui.menu) { ui.menuKey('Escape'); return true; }
      if (ui.state === 'play' || ui.state === 'dead') { ui.openMenu('pause'); return true; }
      if (ui.state === 'stats') { if (ui.statsT > 1) ui.nextLevel(); return true; }
      if (ui.state === 'victory') { ui.state = 'title'; ui.loadDemo(); ui.openMenu('main'); return true; }
      return true;
    }

    pauseApp(on) {
      const ui = this.ui;
      if (on) {
        if (ui.game && ui.state === 'play' && !ui.menu && !ui.debug) ui.openMenu('pause');
        ui.audio.pause(true);
      } else if (!(ui.game && ui.menu)) ui.audio.pause(false);
    }

    destroy() {
      this.tc.destroy();
      this.ui.root.removeEventListener('pointerdown', this.onTap);
      this.ui.glc.removeEventListener('webglcontextlost', this.onLost);
    }
  }

  Touch.TUNE = TUNE;
  Touch.ACTIONS = ACTIONS;
  Touch.LAYOUT = LAYOUT;
  Touch.aimAssist = aimAssist;
  S.Touch = Touch;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.SeriousSam98 = globalThis.SeriousSam98 || {});
