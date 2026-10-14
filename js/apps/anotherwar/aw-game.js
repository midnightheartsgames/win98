(function (AW) {
  'use strict';

  const C = AW.C;
  const STEP = 1 / 30;

  AW.SaveStore = {
    db: null,
    open() {
      if (this.db) return this.db;
      this.db = new Promise((res, rej) => {
        if (typeof indexedDB === 'undefined') { rej(new Error('no idb')); return; }
        const r = indexedDB.open('anotherwar98', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('saves');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      return this.db;
    },
    async put(key, val) {
      try {
        const db = await this.open();
        await new Promise((res, rej) => { const tx = db.transaction('saves', 'readwrite'); tx.objectStore('saves').put(val, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
        return true;
      } catch (e) {
        try { localStorage.setItem('anotherwar_' + key, JSON.stringify(val)); return true; } catch (e2) { return false; }
      }
    },
    async get(key) {
      try {
        const db = await this.open();
        return await new Promise((res, rej) => { const tx = db.transaction('saves', 'readonly'); const q = tx.objectStore('saves').get(key); q.onsuccess = () => res(q.result || null); q.onerror = () => rej(q.error); });
      } catch (e) {
        try { return JSON.parse(localStorage.getItem('anotherwar_' + key) || 'null'); } catch (e2) { return null; }
      }
    },
    async del(key) {
      try {
        const db = await this.open();
        await new Promise(res => { const tx = db.transaction('saves', 'readwrite'); tx.objectStore('saves').delete(key); tx.oncomplete = res; tx.onerror = res; });
      } catch (e) { try { localStorage.removeItem('anotherwar_' + key); } catch (e2) { } }
    }
  };

  AW.Game = class {
    constructor(ui) {
      this.ui = ui;
      this.W = null;
      this.acc = 0;
      this.running = false;
      this.paused = false;
      this.floats = [];
      this.hover = null;
      this.walkHold = 0;
      this.guiMode = 2;
      this.fadeA = 0;
      this.fadeTo = 0;
      this.fadeSpeed = 1;
      this.assetsBusy = false;
    }

    env() {
      const g = this, ui = this.ui;
      return {
        options: { get blood() { return ui.settings.blood; } },
        sound(p, x, y, vol) { ui.audio.play(p, x, y, vol); },
        voice(k, actor) { if (ui.settings.speech > 0) ui.audio.voice(k, actor); },
        stopVoice(actor) { ui.audio.stopVoice(actor); },
        music(name) { g.levelMusic = name; ui.audio.music(name); },
        message(text, color) { if (g.hud) g.hud.addMessage(text, color); },
        float(actor, text, color) { g.addFloat(actor, text, color); },
        popup(name, sec, cb) { AW.MenuUI.popup(ui, name, sec, cb); },
        fade(dir, t) { g.fadeTo = dir ? 1 : 0; g.fadeSpeed = 1 / Math.max(0.1, t || 1); },
        beforeLevel() { ui.audio.stopLoops(); ui.audio.stopAllVoices(); g.clearFloats(); g.assetsBusy = true; ui.showLoading('Загрузка...', 0.1); },
        levelLoaded(data) { g.onLevelLoaded(data); },
        dialog(d) { AW.DialogUI.open(ui, d); },
        dialogClosed() { AW.DialogUI.close(ui); },
        trade(npc) { AW.InvUI.open(ui, { trade: npc }); },
        tradeClosed() {},
        heroDied(canContinue) { g.onHeroDied(canContinue); },
        control(v) { g.control = v; },
        guiMode(m) { g.setGuiMode(m); },
        levelUp(a) { if (g.hud) g.hud.levelUp(a); },
        note() { if (g.hud) g.hud.addMessage('Новая запись в дневнике (N)', 'yellow'); ui.audio.play('menu/page-write'); },
        quest() {},
        departure() { g.onDeparture(); },
        actEnd(n) { g.onActEnd(n); },
        loopSound(s) { ui.audio.loop(s); },
        stopLoop(s) { ui.audio.stopLoop(s); }
      };
    }

    async newGame(opts) {
      const ui = this.ui;
      ui.clearLayer();
      ui.showLoading('Загрузка...', 0.05);
      this.W = new AW.World(this.env());
      this.bindWorld();
      this.hud = new AW.HudUI(ui, this);
      this.running = true;
      await this.W.newGame(opts);
    }

    bindWorld() {
      const W = this.W;
      W.onScriptError = (e, raw) => { if (globalThis.console) console.warn('[AW script]', raw, e && e.message); };
      W.onUnknownCommand = raw => { if (globalThis.console) console.warn('[AW cmd]', raw); };
      W.cheatGod = false;
    }

    async onLevelLoaded(data) {
      const ui = this.ui, W = this.W;
      this.assetsBusy = true;
      ui.showLoading('Загрузка: ' + (AW.LEVEL_NAMES[data.id] || ''), 0.2);
      try {
        await ui.gl.setLevel(data);
        ui.showLoading('Загрузка: ' + (AW.LEVEL_NAMES[data.id] || ''), 0.5);
        const anims = ['ambient1', 'walk', 'run', 'talk1'];
        const list = W.actors.filter(a => a.visible || a.id === 'Hero' || a.id === 'Pierre' || a.team === 1).slice(0, 40);
        let k = 0;
        await Promise.all(list.map(a => ui.gl.preloadActor(a, anims.concat(a.ambients.map(x => x[1])).concat(a.fixedAmb ? [a.fixedAmb] : [])).then(() => {
          k++;
          ui.showLoading('Загрузка: ' + (AW.LEVEL_NAMES[data.id] || ''), 0.5 + 0.5 * k / list.length);
        })));
      } catch (e) {
        if (globalThis.console) console.warn(e);
      }
      for (const s of W.sounds) if (!s.interval && s.active) ui.audio.loop(s);
      if (W.rain) ui.audio.loop({ snd: 'locations/deszcz_loop', vol: 45, global: true, active: 1 });
      ui.hideLoading();
      this.assetsBusy = false;
      this.visited = true;
      if (this.hud) this.hud.onLevel();
    }

    setGuiMode(m) {
      this.guiMode = m;
      if (this.hud) this.hud.setVisible(m >= 2);
    }

    frame(dt) {
      const ui = this.ui, W = this.W;
      if (!W || !this.running) return;
      const blocked = this.assetsBusy || this.paused || ui.screenPause;
      if (!blocked) {
        this.acc += dt;
        let n = 0;
        while (this.acc >= STEP && n++ < 5) {
          this.step();
          this.acc -= STEP;
        }
        if (this.acc > STEP * 5) this.acc = 0;
      } else if (W.dialog) {
        W.update(0);
      }
      if (this.fadeA !== this.fadeTo) {
        const d = this.fadeSpeed * dt;
        this.fadeA = this.fadeA < this.fadeTo ? Math.min(this.fadeTo, this.fadeA + d) : Math.max(this.fadeTo, this.fadeA - d);
      }
      if (!this.assetsBusy && W.level) {
        ui.gl.render(W, this);
        ui.audio.update(W.cam.x + 400, W.cam.y + 300);
      }
      this.updateOverlay(dt);
      if (this.hud) this.hud.update(dt);
      AW.DialogUI.update(ui, dt);
    }

    step() {
      const W = this.W;
      this.inputTick();
      W.update(STEP);
      if (W.pendingLevel) {
        const p = W.pendingLevel;
        W.pendingLevel = null;
        W.changeLevel(p.id, p.opts);
      }
      if (W.inCombat() && W.level && W.level.battlemusic) this.ui.audio.music(W.level.battlemusic);
      else if (W.level && W.combatT <= 0 && this.levelMusic) this.ui.audio.music(this.levelMusic);
      if (W.hero && W.hero.lazyTarget && (W.hero.lazyTarget.dead || !W.hero.lazyTarget.visible)) W.hero.lazyTarget = null;
    }

    worldPoint(p) { const c = this.W.cam; return { x: p.x + Math.round(c.x), y: p.y + Math.round(c.y) }; }

    canControl() {
      const W = this.W;
      return !!(W && W.hero && !W.hero.dead && W.controlState === 1 && !W.dialog && !W.tradeWith && !this.assetsBusy && !this.ui.screen && this.guiMode >= 2);
    }

    inPlayArea(p) { return p.y > C.PANEL_TOP && p.y < C.VIEW_H - C.PANEL_BOTTOM; }

    onMouseMove(p) {
      if (!this.W || !this.running) return;
      this.updateHover();
    }

    updateHover() {
      const ui = this.ui, W = this.W;
      const p = ui.mouse;
      this.hover = null;
      this.hoverActor = null;
      this.hoverItem = null;
      if (!W || !W.level || this.assetsBusy || ui.screen || W.dialog) { ui.setCursor('CURSOR'); ui.tip(''); return; }
      if (W.controlState !== 1) { ui.setCursor('EMPTY'); ui.tip(''); if (this.hud) this.hud.setTarget(null); return; }
      if (!this.inPlayArea(p)) { ui.setCursor('CURSOR'); if (this.hud && !this.hud.tipActive) ui.tip(''); if (this.hud) this.hud.setTarget(null); return; }
      const wp = this.worldPoint(p);
      const t = W.pick(wp.x, wp.y);
      const h = W.hero;
      if (h && h.fight) {
        let cur = 'Aim_neutral';
        if (t && t.kind === 'human') cur = t.obj.team === 1 ? 'Aim_friendly' : (W.hostile(h, t.obj) ? 'Aim_enemy' : 'Aim_neutral');
        ui.setCursor(cur);
      }
      if (!t) {
        if (!h || !h.fight) ui.setCursor('CURSOR');
        ui.tip('');
        if (this.hud) this.hud.setTarget(null);
        return;
      }
      this.hover = t;
      if (t.kind === 'human') this.hoverActor = t.obj;
      if (t.kind === 'item') this.hoverItem = t.obj;
      if (!h || !h.fight) {
        let icon = 'ZOOM';
        if (t.kind === 'item') icon = 'TAKE';
        else if (t.kind === 'human') icon = t.obj.dlg ? 'Talk' : 'ZOOM';
        else {
          const ic = String(t.obj.icon || 'Zoom').toUpperCase();
          icon = ic === 'TALK' ? 'Talk' : ic === 'DOOR' ? 'DOOR' : ic === 'EXIT' ? 'EXIT' : ic === 'USE' ? 'Use' : 'ZOOM';
        }
        ui.setCursor(icon);
      }
      const name = this.targetName(t);
      ui.tip(name);
      if (this.hud) this.hud.setTarget(t, name);
    }

    targetName(t) {
      if (t.kind === 'item') return AW.Items.displayName(t.obj.item) + (t.obj.item.amount > 1 && AW.Items.isAmmo(t.obj.item) ? ' (' + t.obj.item.amount + ')' : '');
      let n = String(t.obj.name || '');
      if (t.kind === 'area' && AW.areaText) n = AW.areaText(this.W.levelId, t.obj, 'name', n);
      const f = n.indexOf('~');
      if (f >= 0) n = t.obj.looked ? n.slice(f + 1) : n.slice(0, f);
      return n.trim();
    }

    onMouseDown(p, button, ev) {
      const W = this.W;
      if (!this.canControl() || !this.inPlayArea(p)) return;
      const h = W.hero;
      this.updateHover();
      const t = this.hover;
      const wp = this.worldPoint(p);
      if (this.pendingSpecial) { AW.Specials.aimAt(this, wp); return; }
      if (button === 2) {
        if (t) this.interactTarget(t, 2);
        return;
      }
      if (button !== 0) return;
      h.lazyTarget = null;
      if (h.fight && (ev.ctrlKey || (t && t.kind === 'human' && W.hostile(h, t.obj)))) {
        this.fireAt(t && t.kind === 'human' ? t.obj : null, wp);
        this.fireHold = true;
        return;
      }
      if (t) { this.interactTarget(t, 1); return; }
      this.walkTo(wp.x, wp.y);
      this.walkHold = 0.25;
    }

    onMouseUp(p, button) {
      if (button === 0) { this.fireHold = false; this.walkHold = 0; }
    }

    interactTarget(t, mode) {
      const W = this.W, h = W.hero;
      if (t.kind === 'item') { this.pickUp(t.obj); return; }
      if (t.kind === 'human' && h.fight && W.hostile(h, t.obj) && mode === 1) { this.fireAt(t.obj, t.obj); return; }
      if (t.kind === 'human' && t.obj.crate) {
        h.seq.reset();
        h.seq.play('WT:' + t.obj.id + ',50|W|OPENBOX:' + t.obj.id);
        return;
      }
      W.interact(t.obj, mode);
    }

    walkTo(x, y) {
      const h = this.W.hero;
      h.seq.reset();
      h.attack = null;
      h.walkTo(x, y, { goalRadius: 30 });
    }

    pickUp(g) {
      const W = this.W, h = W.hero;
      h.seq.reset();
      h.walkTo(g.x, g.y, {
        goalRadius: 12,
        onArrive: () => {
          if (W.ground.indexOf(g) < 0) return;
          const it = g.item;
          if (!h.inv.add(it)) { W.message('Здесь нет места!', 'red'); h.sayText(AW.TEXT.dupa1 || 'Здесь нет места!', { voice: 'dupa1' }); return; }
          W.ground.splice(W.ground.indexOf(g), 1);
          h.setAnim('take', { loop: false, onEnd: () => h.idle() });
          W.playSound(it.snd.pick || 'item/take-item', h.x, h.y, 80);
          W.message('Взято: ' + AW.Items.displayName(it), '');
          if (AW.Scripts.onPickup) AW.Scripts.onPickup(W, it);
        }
      });
    }

    fireAt(target, pt) {
      const W = this.W, h = W.hero;
      if (h.attack || h.cooldown > 0) { this.queuedFire = { target, pt }; return; }
      if (!h.fight) W.setFight(h, 1);
      if (!h.fight) return;
      if (!h.weaponReady() && h.weapon() && !AW.Combat.isMelee(h)) {
        if (AW.Combat.reload(h, true)) return;
      }
      if (target && (AW.Combat.isMelee(h) || !h.weaponReady()) && AW.isoDist(h.x, h.y, target.x, target.y) > C.HCLOSE) {
        const ang = Math.atan2(h.y - target.y, h.x - target.x);
        h.walkTo(target.x + Math.cos(ang) * 26, target.y + Math.sin(ang) * 13, { goalRadius: 12, onArrive: () => AW.Combat.startAttack(h, target) });
        return;
      }
      h.stopWalk();
      AW.Combat.startAttack(h, target, pt.x, pt.y);
    }

    inputTick() {
      const W = this.W, ui = this.ui;
      if (!this.canControl()) return;
      const h = W.hero;
      if (h.attack) AW.Combat.update(h);
      if (this.fireHold && ui.mouse.l && h.fight && !h.attack && h.cooldown <= 0) {
        const wp = this.worldPoint(ui.mouse);
        const t = this.hover && this.hover.kind === 'human' ? this.hover.obj : null;
        this.fireAt(t, wp);
      } else if (this.queuedFire && !h.attack && h.cooldown <= 0) {
        const q = this.queuedFire;
        this.queuedFire = null;
        this.fireAt(q.target, q.pt);
      }
      if (this.walkHold > 0 && ui.mouse.l && !this.fireHold && !h.fight) {
        this.walkHold -= STEP;
        if (this.walkHold <= 0 && this.inPlayArea(ui.mouse)) {
          const wp = this.worldPoint(ui.mouse);
          this.walkHold = 0.3;
          if (!this.hover) h.walkTo(wp.x, wp.y, { goalRadius: 30 });
        }
      }
      if (h.lazyTarget) this.lazyTick();
      const shift = ui.keys.has('ShiftLeft') || ui.keys.has('ShiftRight');
      h.runOverride = shift && !h.overweight() ? true : undefined;
    }

    lazyTick() {
      const W = this.W, h = W.hero;
      const t = h.lazyTarget;
      if (!t || t.dead || !t.visible) { h.lazyTarget = null; return; }
      if (h.attack || h.cooldown > 0) return;
      this.fireAt(t, t);
    }

    lazyAttack() {
      const W = this.W, h = W.hero;
      if (!h.fight && !W.isSafe(h)) W.setFight(h, 1);
      if (!h.fight) return;
      const t = AW.AI.nearestHostile(h, C.SEE_M + 1, true);
      if (t) { h.lazyTarget = t; this.ui.audio.play('specials/mine2'); }
    }

    onKey(ev) {
      const ui = this.ui, W = this.W;
      ui.keys.add(ev.code);
      if (!W || !this.running) return false;
      if (AW.DialogUI.onKey(ui, ev)) return true;
      if (ui.screen && ui.screen.onKey && ui.screen.onKey(ev)) return true;
      if (ui.screen) {
        if (ev.code === 'Escape') { AW.InvUI.close(ui); return true; }
        return false;
      }
      if (this.assetsBusy) return false;
      const h = W.hero;
      const k = ev.code;
      if (k === 'F11') { this.quickSave(); return true; }
      if (k === 'F12') { this.quickLoad(); return true; }
      if (k === 'KeyP' || k === 'Pause') { this.togglePause(); return true; }
      if (k === 'Escape') { AW.MenuUI.gameMenu(ui); return true; }
      if (W.controlState !== 1 && (k === 'Space' || k === 'Enter')) { this.skipSpeech(); return true; }
      if (!this.canControl()) return false;
      if (ev.ctrlKey && k === 'KeyS') { AW.MenuUI.saveLoad(ui, false); return true; }
      if (ev.ctrlKey && k === 'KeyL') { AW.MenuUI.saveLoad(ui, true); return true; }
      if (k === 'KeyI') { AW.InvUI.open(ui, { tab: 'pack' }); return true; }
      if (k === 'KeyS') { AW.InvUI.open(ui, { tab: 'stat' }); return true; }
      if (k === 'KeyN') { if (W.flag('diary') || W.state.notes.length) AW.InvUI.open(ui, { tab: 'diary' }); return true; }
      if (k === 'KeyM') { AW.InvUI.open(ui, { tab: 'map' }); return true; }
      if (k === 'KeyO') { AW.MenuUI.options(ui); return true; }
      if (k === 'KeyH' || k === 'F10') { AW.MenuUI.help(ui); return true; }
      if (k === 'KeyW') { h.wmode = h.wmode ? 0 : 1; if (h.overweight()) h.wmode = 0; this.hud.addMessage(h.wmode ? 'Бег' : 'Шаг', ''); return true; }
      if (k === 'KeyD') {
        if (h.fight) W.setFight(h, 0);
        else if (W.isSafe(h)) this.hud.addMessage('Здесь не место для драки', 'yellow');
        else W.setFight(h, 1);
        return true;
      }
      if (k === 'KeyR') { AW.Combat.reload(h, false); return true; }
      if (k === 'KeyE') { this.repair(); return true; }
      if (k === 'Enter') { this.lazyAttack(); return true; }
      if (/^Digit[1-7]$/.test(k)) { this.useBelt(parseInt(k.slice(5), 10) - 1); return true; }
      if (/^F[1-8]$/.test(k)) { AW.Specials.select(this, parseInt(k.slice(1), 10) - 1); return true; }
      if (k === 'Backspace') { h.spSel = ''; this.pendingSpecial = null; return true; }
      if (k === 'Space') { AW.Specials.use(this); return true; }
      return false;
    }

    skipSpeech() {
      const W = this.W;
      for (const a of W.actors) if (a.say) a.skipSay();
    }

    togglePause() {
      this.paused = !this.paused;
      if (this.hud) this.hud.setPause(this.paused);
    }

    repair() {
      const W = this.W, h = W.hero;
      const w = h.weapon();
      if (!w || !w.maxdur) { this.hud.addMessage('Чинить нечего', ''); return; }
      const kit = h.inv.all().find(it => it.name === 'tools' || it.name === 'weaponkit');
      if (!kit) { this.hud.addMessage('Нет инструментов', 'red'); return; }
      W.useHealth(h, kit);
    }

    useBelt(i) {
      const W = this.W, h = W.hero;
      const it = h.inv.belt[i];
      this.ui.audio.play('menu/click1');
      if (!it) return;
      AW.InvUI.useFromBelt(this, h, i);
    }

    clearFloats() {
      for (const f of this.floats) if (f.el) f.el.remove();
      this.floats = [];
    }

    addFloat(actor, text, color) {
      if (!actor) return;
      this.floats.push({ a: actor, text, color: color || '#fff', t: 0, dy: 0, el: null });
    }

    updateOverlay(dt) {
      const ui = this.ui, W = this.W;
      const ov = ui.overlay;
      if (!W || !W.level || this.assetsBusy) { ov.style.display = 'none'; return; }
      ov.style.display = 'block';
      const cx = Math.round(W.cam.x), cy = Math.round(W.cam.y);
      if (!this.sayEls) this.sayEls = new Map();
      const seen = new Set();
      for (const a of W.actors) {
        if (!a.say || !a.say.cur || !a.visible) continue;
        if (!ui.settings.subtitles && a.say.voice) continue;
        if (a.x - cx < -60 || a.x - cx > 860 || a.y - cy < 0 || a.y - cy > 640) continue;
        seen.add(a);
        let e = this.sayEls.get(a);
        if (!e) { e = AW.el('div', 'aw-say', ov); this.sayEls.set(a, e); }
        if (e._t !== a.say.cur) { e.textContent = a.say.cur; e._t = a.say.cur; }
        e.style.color = a.color;
        const w = e.offsetWidth || 120;
        let x = a.x - cx - w / 2, y = a.y - cy - 118 - (e.offsetHeight || 16);
        x = Math.max(4, Math.min(796 - w, x));
        y = Math.max(44, Math.min(460, y));
        e.style.left = x + 'px';
        e.style.top = y + 'px';
      }
      for (const [a, e] of this.sayEls) if (!seen.has(a)) { e.remove(); this.sayEls.delete(a); }
      for (const f of this.floats) {
        f.t += dt;
        if (!f.el) { f.el = AW.el('div', 'aw-float', ov); f.el.textContent = f.text; f.el.style.color = f.color; }
        const x = f.a.x - cx, y = f.a.y - cy - 100 - f.t * 24;
        f.el.style.left = (x - (f.el.offsetWidth || 60) / 2) + 'px';
        f.el.style.top = y + 'px';
        f.el.style.opacity = String(Math.max(0, 1 - Math.max(0, f.t - 1) / 0.6));
      }
      this.floats = this.floats.filter(f => { if (f.t > 1.6) { f.el.remove(); return false; } return true; });
      if (!this.fadeEl) this.fadeEl = AW.el('div', 'aw-fade', ov);
      this.fadeEl.style.opacity = String(this.fadeA);
      if (!this.pauseEl) { this.pauseEl = AW.el('div', 'aw-pausemsg', ov); this.pauseEl.textContent = AW.TEXT.PauseMessage || 'ПАУЗА'; }
      this.pauseEl.style.display = this.paused ? 'block' : 'none';
    }

    onHeroDied(canContinue) {
      const ui = this.ui;
      if (!canContinue) {
        ui.confirm([AW.TEXT.GameOverOK1 || 'И это конец', AW.TEXT.GameOverOK2 || 'ваших приключений...'], () => this.endGame(), null);
        return;
      }
      ui.confirm(['Игра окончена?'], () => this.endGame(), () => this.W.continueAfterDeath(), { yes: 'Да', no: 'Нет' });
    }

    onDeparture() {
      const W = this.W;
      if (AW.Scripts.canDepart && AW.Scripts.canDepart(W)) AW.MenuUI.departure(this.ui);
      else if (this.hud) this.hud.addMessage(AW.TEXT.NoTeleport2 || 'Я не готов', 'yellow');
    }

    onActEnd() {
      AW.MenuUI.actEnd(this.ui);
    }

    endGame() {
      this.running = false;
      this.ui.audio.stopLoops();
      this.ui.audio.stopAllVoices();
      if (this.hud) this.hud.destroy();
      this.hud = null;
      this.W = null;
      this.ui.overlay.innerHTML = '';
      this.sayEls = null;
      this.fadeEl = null;
      this.pauseEl = null;
      this.floats = [];
      AW.MenuUI.showMain(this.ui);
    }

    saveData(label) {
      const W = this.W;
      const data = W.serialize();
      return {
        v: 1,
        meta: { label: label || '', name: W.hero.name, cls: W.hero.cls, level: W.hero.level, place: AW.LEVEL_NAMES[W.levelId] || W.levelId, date: Date.now(), play: Math.floor(W.state.playTime) },
        world: data
      };
    }

    async save(slot, label) {
      if (!this.W || !this.W.hero || this.W.controlState !== 1 || this.W.dialog) { if (this.hud) this.hud.addMessage('Сейчас сохраниться нельзя', 'red'); return false; }
      const ok = await AW.SaveStore.put('slot' + slot, this.saveData(label));
      if (this.hud) this.hud.addMessage(ok ? 'Игра сохранена' : 'Не удалось сохранить игру', ok ? 'green' : 'red');
      return ok;
    }

    async load(slot) {
      const s = await AW.SaveStore.get('slot' + slot);
      if (!s || !s.world) return false;
      const ui = this.ui;
      ui.clearLayer();
      AW.DialogUI.close(ui);
      ui.audio.stopLoops();
      ui.audio.stopAllVoices();
      if (this.hud) this.hud.destroy();
      ui.overlay.innerHTML = '';
      this.sayEls = null;
      this.fadeEl = null;
      this.pauseEl = null;
      this.floats = [];
      this.paused = false;
      this.W = new AW.World(this.env());
      this.bindWorld();
      this.hud = new AW.HudUI(ui, this);
      this.running = true;
      ui.showLoading('Загрузка...', 0.1);
      await this.W.deserialize(JSON.parse(JSON.stringify(s.world)));
      return true;
    }

    quickSave() {
      this.save('quick', 'Быстрое сохранение').then(ok => { if (ok && this.hud) this.hud.addMessage(AW.TEXT.QuickSaveMessage || 'Быстрое сохранение', 'green'); });
    }

    quickLoad() {
      AW.SaveStore.get('slotquick').then(s => {
        if (!s) { if (this.hud) this.hud.addMessage('Нет быстрого сохранения', 'red'); return; }
        this.load('quick');
      });
    }

    destroy() {
      this.running = false;
      if (this.hud) this.hud.destroy();
    }
  };

  AW.LEVEL_NAMES = {
    StoryRoom: 'Пивная, 1947', A_Death: 'Пивная, 1947', AKT1: '', A01_Rynek: 'Рыночная площадь', A02_CafeRene: 'Кафе «Аннет»',
    A03_Lochy: 'Подземелья замка', A04_cmentarz: 'Кладбище', A05_Church: 'Церковь', A06_Antyk: 'Книжная лавка', A07_Przedzamcze: 'Перед замком',
    A08_KryptaMala: 'Склеп', A09_Katakumby: 'Под церковью', A11_Las: 'Лесной домик', A12_LasSE: 'Лес у замка', A12_LasNE: 'Темный лес',
    A12_LasNW: 'Страшный лес', A12_LasSW: 'Дремучий лес'
  };
})(globalThis.AW = globalThis.AW || {});
