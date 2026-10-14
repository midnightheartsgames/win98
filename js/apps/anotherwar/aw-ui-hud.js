(function (AW) {
  'use strict';

  const el = (t, c, p, s) => AW.el(t, c, p, s);
  const T = k => (AW.TEXT && AW.TEXT[k]) || '';
  const COLORS = { red: '#ff5a4a', green: '#7cff6b', yellow: '#fff27a', '': '#c8c8c8', white: '#ffffff' };

  const BUTTONS = [
    { r: [697, 482, 746, 506], tip: 'PanInventory', key: 'I', act: g => AW.InvUI.open(g.ui, { tab: 'pack' }) },
    { r: [698, 533, 747, 559], tip: 'PanSaveGame', key: 'Ctrl+S', act: g => AW.MenuUI.saveLoad(g.ui, false) },
    { r: [742, 533, 793, 559], tip: 'PanLoadGame', key: 'Ctrl+L', act: g => AW.MenuUI.saveLoad(g.ui, true) },
    { r: [747, 483, 797, 508], tip: 'PanStatictics', key: 'S', act: g => AW.InvUI.open(g.ui, { tab: 'stat' }) },
    { r: [700, 508, 749, 534], tip: 'PanMap', key: 'M', act: g => AW.InvUI.open(g.ui, { tab: 'map' }) },
    { r: [746, 508, 796, 533], tip: 'PanOptions', key: 'O', act: g => AW.MenuUI.options(g.ui) },
    { r: [702, 559, 752, 586], tip: 'PanPause', key: 'P', act: g => g.togglePause() },
    { r: [747, 569, 796, 596], tip: 'PanExit', key: 'Esc', act: g => AW.MenuUI.gameMenu(g.ui) },
    { r: [6, 481, 58, 506], tip: 'PanReload', key: 'R', act: g => AW.Combat.reload(g.W.hero, false) },
    { r: [4, 507, 58, 533], tip: 'PanRepair', key: 'E', act: g => g.repair() }
  ];

  const WSKAZ = [
    [266, 483, 526, 499, 'PanHP'], [267, 506, 364, 523, 'PanStamina'], [427, 507, 526, 522, 'PanSpecial'],
    [218, 528, 544, 536, 'PanExperience'], [67, 582, 200, 592, 'PanTimeToReload'], [5, 538, 14, 589, 'PanDrucik']
  ];

  AW.HudUI = class {
    constructor(ui, game) {
      this.ui = ui;
      this.game = game;
      this.el = el('div', 'aw-hud-root', ui.hudEl);
      this.msgs = [];
      this.msgFirst = 0;
      this.pressed = null;
      this.build();
      this.lastSig = {};
    }

    build() {
      const R = this.el;
      AW.spr('gui/panel/gora-sk1', 0, 0, R, 0, 0);
      this.spEls = [];
      for (let n = 0; n < 8; n++) {
        const x = n * 40 + (n > 3 ? 15 : 0);
        const d = AW.spr('gui/panel/spskills', 24, 0, R, x, 1, { cls: 'aw-hit' });
        d.addEventListener('mouseenter', () => this.spHover(n, true));
        d.addEventListener('mouseleave', () => this.spHover(n, false));
        d.addEventListener('mousedown', ev => { ev.stopPropagation(); AW.Specials.select(this.game, n); });
        this.spEls.push(d);
      }
      this.teamEl = el('div', 'aw-team', R);
      this.targetEl = el('div', 'aw-target', R);
      this.targetHp = el('div', 'aw-target-hp', R);
      AW.spr('gui/panel/dol-sk1', 0, 0, R, 0, 480);
      this.hpBar = el('div', 'aw-bar', R, { left: '275px', top: '492px', height: '8px', width: '0px' });
      AW.fillBar(this.hpBar, 'gui/panel/hp-sk1', 0, 0);
      this.hpText = el('div', 'aw-hptext', R);
      this.stBar = el('div', 'aw-bar', R, { left: '271px', top: '514px', height: '3px', width: '0px' });
      AW.fillBar(this.stBar, 'gui/panel/paskimale-sk1', 0, 0);
      this.spBar = el('div', 'aw-bar', R, { left: '431px', top: '514px', height: '3px', width: '0px' });
      AW.fillBar(this.spBar, 'gui/panel/paskimale-sk1', 0, 2);
      this.xpBar = el('div', 'aw-bar', R, { left: '228px', top: '533px', height: '2px', width: '0px' });
      AW.fillBar(this.xpBar, 'gui/panel/paskimale-sk1', 0, 1);
      this.handBox = el('div', 'aw-handbox', R, { left: '68px', top: '489px', width: '136px', height: '87px' });
      this.handDur = el('div', 'aw-small aw-gray', R, { left: '72px', top: '563px' });
      this.handAmmo = el('div', 'aw-small aw-gray aw-right', R, { right: (800 - 197) + 'px', top: '563px' });
      this.handFlag = el('div', 'aw-handflag', R);
      this.reloadBar = el('div', 'aw-bar', R, { left: '73px', top: '587px', height: '5px', width: '0px' });
      AW.fillBar(this.reloadBar, 'gui/panel/pasekbroni-sk1', 0, 0);
      this.reloadFull = false;
      this.beltEls = [];
      for (let n = 0; n < 7; n++) {
        const c = el('div', 'aw-beltcell aw-hit', R, { left: (215 + n * 47) + 'px', top: '547px', width: '47px', height: '50px' });
        c.addEventListener('mousedown', ev => { ev.stopPropagation(); if (ev.button === 0) this.game.useBelt(n); });
        c.addEventListener('mouseenter', () => { this.tipBelt = n; });
        c.addEventListener('mouseleave', () => { if (this.tipBelt === n) this.tipBelt = -1; });
        this.beltEls.push(c);
      }
      this.msgEl = el('div', 'aw-msgs aw-hit', R, { left: '562px', top: '487px', width: '118px', height: '100px' });
      this.msgEl.addEventListener('wheel', ev => { this.scrollMsgs(ev.deltaY > 0 ? 1 : -1); ev.stopPropagation(); }, { passive: true });
      this.msgUp = AW.spr('gui/panel/messscroll-sk1', 0, 1, R, 682, 488, { cls: 'aw-hit' });
      this.msgDn = AW.spr('gui/panel/messscroll-sk1', 0, 3, R, 682, 569, { cls: 'aw-hit' });
      this.msgUp.addEventListener('mousedown', ev => { ev.stopPropagation(); this.scrollMsgs(-1); });
      this.msgDn.addEventListener('mousedown', ev => { ev.stopPropagation(); this.scrollMsgs(1); });
      this.btnEls = [];
      BUTTONS.forEach((b, i) => {
        const d = el('div', 'aw-btnarea aw-hit', R, { left: b.r[0] + 'px', top: b.r[1] + 'px', width: (b.r[2] - b.r[0]) + 'px', height: (b.r[3] - b.r[1]) + 'px' });
        d.addEventListener('mousedown', ev => {
          ev.stopPropagation();
          if (ev.button !== 0) return;
          this.press(i);
          this.ui.audio.play('menu/click1');
          if (this.game.W && this.game.W.controlState === 1 && !this.game.W.dialog) b.act(this.game);
          else if (i === 6 || i === 7) b.act(this.game);
        });
        d.addEventListener('mouseenter', () => { this.tipBtn = i; });
        d.addEventListener('mouseleave', () => { if (this.tipBtn === i) this.tipBtn = -1; });
        this.btnEls.push(d);
      });
      this.pressEl = el('div', 'aw-spr', R, { display: 'none' });
      this.wsEls = WSKAZ.map((w, i) => {
        const d = el('div', 'aw-btnarea aw-hit', R, { left: w[0] + 'px', top: w[1] + 'px', width: (w[2] - w[0]) + 'px', height: (w[3] - w[1]) + 'px' });
        d.addEventListener('mouseenter', () => { this.tipWs = i; });
        d.addEventListener('mouseleave', () => { if (this.tipWs === i) this.tipWs = -1; });
        return d;
      });
      this.handHit = el('div', 'aw-btnarea aw-hit', R, { left: '68px', top: '489px', width: '136px', height: '87px' });
      this.handHit.addEventListener('mouseenter', () => { this.tipHand = true; });
      this.handHit.addEventListener('mouseleave', () => { this.tipHand = false; });
      this.handHit.addEventListener('mousedown', ev => { ev.stopPropagation(); if (this.game.canControl()) AW.InvUI.open(this.ui, { tab: 'pack' }); });
      this.tipBelt = -1;
      this.tipBtn = -1;
      this.tipWs = -1;
      this.levelFlash = 0;
    }

    press(i) {
      const b = BUTTONS[i];
      AW.setSpr(this.pressEl, 'gui/panel/buttons-sk1', 0, i);
      Object.assign(this.pressEl.style, { display: 'block', left: b.r[0] + 'px', top: b.r[1] + 'px' });
      this.pressT = 0.18;
    }

    setVisible(v) { this.el.style.display = v ? 'block' : 'none'; }

    setPause(p) { this.paused = p; }

    onLevel() { this.lastSig = {}; }

    spHover(n, on) {
      this.tipSp = on ? n : -1;
    }

    addMessage(text, color) {
      if (!text) return;
      const last = this.msgs[this.msgs.length - 1];
      if (last && last.text === String(text)) {
        last.count = (last.count || 1) + 1;
        this.renderMsgs();
        return;
      }
      const atEnd = this.msgFirst >= this.msgs.length - 9;
      this.msgs.push({ text: String(text), color: COLORS[color] || color || COLORS[''] });
      if (this.msgs.length > 200) this.msgs.shift();
      if (atEnd) this.msgFirst = Math.max(0, this.msgs.length - 9);
      this.renderMsgs();
    }

    scrollMsgs(d) {
      this.msgFirst = Math.max(0, Math.min(Math.max(0, this.msgs.length - 9), this.msgFirst + d));
      this.renderMsgs();
    }

    renderMsgs() {
      const m = this.msgEl;
      m.innerHTML = '';
      for (let i = this.msgFirst; i < Math.min(this.msgs.length, this.msgFirst + 9); i++) {
        const d = el('div', 'aw-msg', m);
        d.textContent = this.msgs[i].text + (this.msgs[i].count > 1 ? ' (x' + this.msgs[i].count + ')' : '');
        d.style.color = this.msgs[i].color;
      }
    }

    levelUp() {
      this.levelFlash = 6;
    }

    setTarget(t, name) {
      if (!t) { this.targetEl.textContent = ''; this.targetHp.textContent = ''; return; }
      this.targetEl.textContent = name || '';
      if (t.kind === 'human' && !t.obj.crate && !t.obj.dying) this.targetHp.textContent = Math.max(0, Math.floor(t.obj.hp)) + '/' + Math.floor(t.obj.hpMax);
      else this.targetHp.textContent = '';
    }

    itemSprite(parent, it, kind, box) {
      parent.innerHTML = '';
      if (!it) return;
      const ic = AW.Assets.itemIcon(it, kind) || AW.Assets.itemIcon(it, 'inv');
      if (!ic) return;
      const f = ic.f;
      const s = Math.min(1, box[0] / f[2], box[1] / f[3]);
      const d = AW.spr(ic.key, ic.anim, 0, parent, 0, 0, { centerBox: [box[0], box[1]] });
      if (s < 1) {
        d.style.transformOrigin = 'center center';
        d.style.transform = 'scale(' + s.toFixed(3) + ')';
      }
    }

    update(dt) {
      const g = this.game, W = g.W;
      if (!W || !W.hero) return;
      const h = W.hero;
      if (this.pressT > 0) { this.pressT -= dt; if (this.pressT <= 0) this.pressEl.style.display = 'none'; }
      const hp = Math.max(0, Math.min(1, h.hp / h.hpMax));
      this.hpBar.style.width = Math.floor(254 * hp) + 'px';
      if ((hp < 50 / 254) !== this.lowHp) { this.lowHp = hp < 50 / 254; AW.fillBar(this.hpBar, 'gui/panel/hp-sk1', 0, this.lowHp ? 1 : 0); }
      const ht = Math.floor(h.hp + 0.5) + '/' + Math.floor(h.hpMax + 0.5);
      if (this.hpText.textContent !== ht) this.hpText.textContent = ht;
      this.stBar.style.width = Math.floor(94 * h.stamina / 100) + 'px';
      const sel = h.spSel && h.sp[h.spSel] ? h.spSel : '';
      this.spBar.style.width = sel ? Math.floor(94 * (h.spCharge[sel] === undefined ? 100 : h.spCharge[sel]) / 100) + 'px' : '0px';
      const R = AW.Rules;
      const x0 = R.xpForLevel(h.level), x1 = R.xpNext(h.level);
      this.xpBar.style.width = Math.floor(311 * Math.max(0, Math.min(1, (h.xp - x0) / Math.max(1, x1 - x0)))) + 'px';
      const w = h.inv.hand;
      const sig = w ? w.uid + ':' + (w.link ? w.link.uid : '') : '';
      if (sig !== this.lastSig.hand) {
        this.lastSig.hand = sig;
        this.itemSprite(this.handBox, w, 'pan', [136, 87]);
      }
      if (w && AW.Items.isWeapon(w)) {
        this.handDur.textContent = w.maxdur ? Math.floor(w.dur / w.maxdur * 100) + '%' : '';
        this.handAmmo.textContent = AW.Combat.isMelee(h) ? '' : (w.link ? w.link.amount + '/' + w.link.maxamount : '0/0');
        const bad = w.jammed || (w.maxdur && w.dur <= 1);
        this.handFlag.textContent = bad && Math.floor(W.time * 3) % 2 ? (w.dur <= 1 ? T('Broken') || 'Сломано' : T('Jammed') || 'Заклинило') : '';
        const ready = h.cooldown > 0 ? Math.max(0, 1 - h.cooldown / Math.max(0.2, AW.Combat.shotInterval(h))) : 1;
        this.reloadBar.style.width = Math.floor(128 * ready) + 'px';
        const full = ready >= 1;
        if (full !== this.reloadFull) { this.reloadFull = full; AW.fillBar(this.reloadBar, 'gui/panel/pasekbroni-sk1', 0, full ? 1 : 0); }
      } else {
        this.handDur.textContent = '';
        this.handAmmo.textContent = '';
        this.handFlag.textContent = '';
        this.reloadBar.style.width = '0px';
      }
      for (let n = 0; n < 7; n++) {
        const it = h.inv.belt[n];
        const s = it ? it.uid + ':' + it.amount : '';
        if (s === this.lastSig['b' + n]) continue;
        this.lastSig['b' + n] = s;
        const c = this.beltEls[n];
        this.itemSprite(c, it, 'inv', [47, 50]);
        if (it && (AW.Items.isAmmo(it) || it.amount > 1)) {
          const a = el('div', 'aw-amount', c);
          a.textContent = String(it.amount);
        }
      }
      const cls = h.cls;
      const specs = AW.Rules.SPECIALS[cls] || [];
      for (let n = 0; n < 8; n++) {
        const s = specs[n];
        const lv = s ? h.sp[s.id] || 0 : 0;
        const charge = s && lv ? (h.spCharge[s.id] === undefined ? 100 : h.spCharge[s.id]) : 0;
        const k = !lv ? 0 : charge < 100 ? 0 : (h.spSel === s.id ? 2 : 1);
        const sig2 = lv ? s.icon + ':' + k : 'x';
        if (sig2 !== this.lastSig['s' + n]) {
          this.lastSig['s' + n] = sig2;
          AW.setSpr(this.spEls[n], 'gui/panel/spskills', lv ? s.icon - 1 : 24, lv ? k : 0);
          this.spEls[n].style.opacity = lv && charge < 100 ? '0.75' : '1';
        }
      }
      this.updateTeam(W);
      this.updateTip(W, h);
      if (this.levelFlash > 0) this.levelFlash -= dt;
    }

    updateTeam(W) {
      const team = W.teamMembers();
      const sig = team.map(m => m.id + ':' + Math.floor(37 * m.hp / m.hpMax) + (m.dead ? 'd' : '')).join('|');
      if (sig === this.lastSig.team) return;
      this.lastSig.team = sig;
      this.teamEl.innerHTML = '';
      team.forEach((m, i) => {
        const x = 625 + 45 * i;
        const key = m.id === 'Johann' ? 'gui/panel/johann' : 'gui/panel/johann';
        const p = AW.spr(key, 0, 0, this.teamEl, x, 1, { cls: 'aw-hit' });
        if (m.dead) p.style.filter = 'grayscale(1) brightness(0.6)';
        p.title = '';
        p.addEventListener('mousedown', ev => { ev.stopPropagation(); if (this.game.canControl()) AW.InvUI.open(this.ui, { tab: 'pack', who: m }); });
        p.addEventListener('mouseenter', () => { this.tipTeam = m; });
        p.addEventListener('mouseleave', () => { if (this.tipTeam === m) this.tipTeam = null; });
        let fr = Math.floor(37 * m.hp / Math.max(1, m.hpMax));
        if (m.hp > 0 && fr <= 0) fr = 1;
        AW.spr('gui/panel/podpasek-sk1', 0, Math.max(0, Math.min(37, fr)), this.teamEl, x + 30, 1);
      });
    }

    updateTip(W, h) {
      const ui = this.ui;
      let tip = '', tip2 = '';
      if (this.tipBtn >= 0) { const b = BUTTONS[this.tipBtn]; tip = (T(b.tip) || '') + ' (' + b.key + ')'; }
      else if (this.tipWs >= 0) {
        const w = WSKAZ[this.tipWs];
        tip = T(w[4]) || '';
        if (w[4] === 'PanExperience') tip += ' ' + h.xp + '/' + AW.Rules.xpNext(h.level);
        if (w[4] === 'PanDrucik') tip = AW.label('WagaEkwipunku', 'Вес снаряжения') + ': ' + h.inv.weight() + '/' + h.maxWeight();
      } else if (this.tipBelt >= 0) {
        const it = h.inv.belt[this.tipBelt];
        tip = it ? AW.Items.displayName(it) : (T('PanPasek') || 'Пояс');
      } else if (this.tipHand) {
        tip = h.inv.hand ? AW.Items.displayName(h.inv.hand) : (T('PanHand') || 'Рука');
      } else if (this.tipSp >= 0) {
        const s = (AW.Rules.SPECIALS[h.cls] || [])[this.tipSp];
        if (s && h.sp[s.id]) { tip = 'F' + (this.tipSp + 1) + ': ' + s.name + ' (' + h.sp[s.id] + ')'; tip2 = s.mech; }
      } else if (this.tipTeam) {
        tip = this.tipTeam.name;
        tip2 = Math.floor(this.tipTeam.hp) + '/' + Math.floor(this.tipTeam.hpMax);
      }
      this.tipActive = !!tip;
      if (tip) ui.tip(tip, tip2);
      else if (!this.game.inPlayArea(ui.mouse)) ui.tip('');
    }

    destroy() { this.el.remove(); }
  };
})(globalThis.AW = globalThis.AW || {});
