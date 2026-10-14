(function (Z) {
  'use strict';

  const U = Z.UI.prototype;

  U.onAttach = function (g) {
    g.ev.on('cell', ev => {
      this.scene.setCell(g.cell);
      this.view.yaw = g.player.yaw;
      this.view.pitch = 0;
      this.fx.parts = [];
      this.fade = 1;
    });
    g.ev.on('playerDied', () => this.onPlayerDeath && this.onPlayerDeath());
    g.ev.on('levelup', () => { if (this.audio) this.audio.uiSound('level'); });
  };

  U.onPlayKeys = function (inp, dt) {
    const g = this.game, p = g.player;
    if (this.mode !== 'play' || !g || p.dead) return;
    const c = this.cam, cp = Math.cos(c.pitch);
    const dir = [Math.sin(c.yaw) * cp, Math.sin(c.pitch), -Math.cos(c.yaw) * cp];
    const origin = this.view.third ? g.eyeOf(p) : [c.x, c.y, c.z];
    const tgt = g.lookTarget(this.view.third ? [c.x, c.y, c.z] : origin, dir);
    this.lookTgt = tgt;
    this.prompt = g.promptFor(tgt);
    if (inp.use) {
      inp.use = false;
      const r = g.activate(tgt);
      if (r) this.routeActivation(r);
    }
    if (this.pressed.has('Tab') && this.openPioneer) { this.openPioneer(); return; }
    if (this.pressed.has('KeyV') && this.startVats) { this.startVats(); return; }
    if (this.pressed.has('KeyT')) { this.openWait(false); return; }
    if (this.pressed.has('Escape') && this.openPauseMenu) { this.openPauseMenu(); return; }
    if (this.pressed.has('F5') && this.quickSave) this.quickSave();
    if (this.pressed.has('F9') && this.quickLoad) { this.quickLoad(); return; }
    if (this.pressed.has('F7') && this.openDebug) { this.openDebug(); return; }
    for (let k = 1; k <= 8; k++) if (this.pressed.has('Digit' + k)) this.useHotkey(k);
    if (this.mouse.wheel && !(this.mouse.b & 2)) this.cycleWeapon(this.mouse.wheel > 0 ? 1 : -1);
    if (this.pressed.has('KeyH')) { p.holstered = !p.holstered; }
    if (this.pressed.has('KeyG')) this.quickThrow();
    if (this.pressed.has('KeyQ') && this.view.third) this.view.dist = this.view.dist > 2.2 ? 1.6 : 2.8;
  };

  U.compassMarks = function () { return this.game ? this.game.compassMarks() : []; };

  U.modeTick = function (dt) {
    if (this.mode === 'panel') {
      if (this.talk) this.talkCamera(dt);
      if (this.vats && this.vatsTick) this.vatsTick(dt);
    }
    if (this.mode === 'vats' && this.vatsTick) this.vatsTick(dt);
    if (this.mode === 'dead' && this.deathTick) this.deathTick(dt);
  };

  U.routeActivation = function (r) {
    switch (r.ui) {
      case 'container': this.openContainer(r.obj); break;
      case 'loot': this.openContainer(null, r.actor); break;
      case 'talk': if (this.startDialogue) this.startDialogue(r.actor); break;
      case 'lockpick': if (this.openLockpick) this.openLockpick(r.obj); break;
      case 'hack': if (this.openHack) this.openHack(r.obj); break;
      case 'terminal': if (this.openTerminal) this.openTerminal(r.obj); break;
      case 'craft': this.openCraft(r.at); break;
      case 'sleep': this.openWait(true); break;
      case 'barter': if (this.openBarter) this.openBarter(r.actor); break;
      default: break;
    }
  };

  U.useHotkey = function (k) {
    const g = this.game, p = g.player;
    const id = (p.hotkeys || {})[k];
    if (!id) { if (k === 1) { p.equip.weapon = null; } return; }
    const e = p.inv.find(x => x.id === id);
    if (!e) return;
    const d = Z.item(id);
    if (d.cat === 'weapon') p.equipEntry(e);
    else if (d.cat === 'aid' && g.useItem) g.useItem(e);
    else if (d.cat === 'apparel') p.equipEntry(e);
  };

  U.cycleWeapon = function (dir) {
    const p = this.game.player;
    const ws = p.inv.filter(e => Z.item(e.id).cat === 'weapon');
    if (!ws.length) return;
    const uniq = [];
    for (const e of ws) if (!uniq.some(u => u.id === e.id && Z.item(e.id).stack)) uniq.push(e);
    let i = uniq.indexOf(p.equip.weapon);
    i = (i + dir + uniq.length + 1) % (uniq.length + 1);
    p.equip.weapon = i === uniq.length ? null : uniq[i];
    p.cool = Math.max(p.cool || 0, 0.35);
  };

  U.quickThrow = function () {
    const g = this.game, p = g.player;
    const gr = p.inv.find(e => ['f1', 'rgd', 'molotov', 'tnt'].includes(e.id));
    if (!gr || !g.canAttack(p)) return;
    const keep = p.equip.weapon;
    p.equip.weapon = gr;
    p.quickSwap = true;
    g.throwItem(p, Z.item(gr.id), {});
    this.quick = { model: Z.item(gr.id).model || gr.id, keep: keep ? keep.id : 'fists', t: 0 };
    g.later(0.4, () => { if (keep && p.inv.includes(keep)) p.equip.weapon = keep; else if (p.equip.weapon === gr && !p.inv.includes(gr)) p.equip.weapon = null; p.wieldEntry = p.equip.weapon; p.quickSwap = false; });
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
