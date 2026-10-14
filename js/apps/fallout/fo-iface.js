(function (FO) {
  'use strict';

  const BAR_H = 100;
  const HR800 = 'ART\\INTRFACE\\HR_IFACE_800.FRM';
  const WIDE = 800;
  FO.SIDE_ART = [null, ['ART\\INTRFACE\\HR_IFACELFT1.FRM', 'ART\\INTRFACE\\HR_IFACERHT1.FRM'], ['ART\\INTRFACE\\HR_IFACELFT2.FRM', 'ART\\INTRFACE\\HR_IFACERHT2.FRM']];
  FO.IFACE_ART = [HR800].concat(...FO.SIDE_ART.filter(Boolean));
  const MODE_TEXT = { 1: 42, 2: 41, 3: 44, 4: 45, 5: 117, 6: 43, 7: 40, 8: 40 };

  FO.ATTACK = { NONE: 0, PUNCH: 1, KICK: 2, SWING: 3, THRUST: 4, THROW: 5, SINGLE: 6, BURST: 7, FLAME: 8 };
  FO.ITEM_ACTION = { USE: 0, PRIMARY: 1, PRIMARY_AIMED: 2, SECONDARY: 3, SECONDARY_AIMED: 4, RELOAD: 5 };
  const ACT = FO.ITEM_ACTION;
  const USE_FLAG = 0x800;
  const USE_ON_FLAG = 0x1000;
  const AP_LIGHTS = { x: 316, y: 14, step: 9, green: 83, red: 85 };
  const PANEL_SOUND = { OPEN: 'iciboxx1', CLOSE: 'icibcxx1', LIT: 'icombat2', DARK: 'icombat1' };
  const INDICATOR = { art: 126, w: 130, h: 21, step: 127, overlap: 3, textBox: 24, msg: [102, 100, 101], color: ['red', 'green', 'green'] };

  FO.itemApCost = function (o, hitMode, aimed) {
    const item = FO.weaponFor(o, hitMode);
    if (item && item.proto && item.proto.sub !== FO.ITEM.WEAPON) return 2;
    return FO.apCost(o, hitMode, aimed);
  };

  FO.canUseItem = item => !!(item && item.proto && (item.proto.flagsExt & USE_FLAG));
  FO.canUseItemOn = item => !!(item && item.proto && (item.proto.sub === FO.ITEM.DRUG || (item.proto.flagsExt & USE_ON_FLAG)));

  class Iface {
    constructor(play) {
      this.p = play;
      this.g = play.g;
      this.pressed = null;
      this.scrollBack = 0;
      this.combatFrame = 0;
      this.combatTime = 0;
    }

    origin() {
      const scr = this.g.scr;
      const wide = scr.w >= WIDE && !!this.g.art.getPath(HR800);
      const barW = wide ? WIDE : 640;
      const bar = (scr.w - barW) >> 1;
      return { x: bar + barW - 640, y: scr.h - BAR_H, wide, bar, barW };
    }

    regions() {
      const o = this.origin();
      const r = (x, y, w, h) => [o.x + x, o.y + y, w, h];
      return {
        monitor: o.wide ? [o.bar + 8, o.y + 8, 352, 84] : r(8, 8, 192, 84),
        swap: r(218, 6, 22, 21),
        inv: r(211, 40, 32, 21),
        options: r(210, 61, 34, 34),
        item: r(267, 26, 188, 67),
        skilldex: r(523, 6, 105, 24),
        map: r(526, 39, 41, 19),
        cha: r(526, 58, 41, 19),
        pip: r(526, 77, 41, 19),
        endTurn: r(590, 43, 38, 22),
        endCombat: r(590, 65, 38, 22)
      };
    }

    contains(m) {
      return m.y >= this.g.scr.h - BAR_H;
    }

    at(m) {
      const R = this.regions();
      const w = this.p.w;
      for (const [k, [x, y, ww, hh]] of Object.entries(R)) {
        if ((k === 'endTurn' || k === 'endCombat') && !(w.inCombat && this.combatFrame >= 4)) continue;
        if (m.x >= x && m.y >= y && m.x < x + ww && m.y < y + hh) return k;
      }
      return null;
    }

    showCombatPanel() {
      FO.uiSound(this.g, PANEL_SOUND.OPEN);
      this.combatFrame = 4;
      this.combatTarget = 4;
      this.combatTime = 0;
    }

    update(dt) {
      const target = this.p.w.inCombat ? 4 : 0;
      if (target !== this.combatTarget) {
        if (this.combatTarget !== undefined) FO.uiSound(this.g, target ? PANEL_SOUND.OPEN : PANEL_SOUND.CLOSE);
        this.combatTarget = target;
      }
      if (this.combatFrame >= 4 && target) {
        const lit = !!(this.p.combat && this.p.combat.dudeTurn()) && this.lit !== undefined;
        if (lit !== this.lit) {
          this.lit = lit;
          FO.uiSound(this.g, lit ? PANEL_SOUND.LIT : PANEL_SOUND.DARK);
        }
      } else {
        this.lit = undefined;
      }
      if (this.combatFrame !== target) {
        this.combatTime += dt;
        if (this.combatTime > 0.08) {
          this.combatTime = 0;
          this.combatFrame += this.combatFrame < target ? 1 : -1;
        }
      }
    }

    draw(scr) {
      const g = this.g;
      const o = this.origin();
      scr.rect(0, o.y, scr.w, BAR_H, 0);
      const side = FO.SIDE_ART[FO.screenPref(g.prefs, 'sideArt')];
      if (side && o.bar > 0) {
        const l = FO.frameOfArt(g, side[0]);
        const r = FO.frameOfArt(g, side[1]);
        if (l) scr.blit(l, o.bar - l.w, o.y);
        if (r) scr.blit(r, o.bar + o.barW, o.y);
      }
      if (o.wide) FO.blitArt(g, scr, HR800, o.bar, o.y + 1);
      else FO.blitArt(g, scr, 16, o.x, o.y);
      const R = this.regions();
      const p = this.pressed;
      const mouseIn = k => {
        const [x, y, w, h] = R[k];
        const m = g.mouse;
        return m.x >= x && m.y >= y && m.x < x + w && m.y < y + h;
      };
      const down = k => p === k && mouseIn(k);
      if (down('swap')) FO.blitArt(g, scr, 7, R.swap[0], R.swap[1]);
      if (down('skilldex')) FO.blitArt(g, scr, 7, R.skilldex[0], R.skilldex[1]);
      if (down('inv')) FO.blitArt(g, scr, 46, R.inv[0], R.inv[1]);
      if (down('options')) FO.blitArt(g, scr, 17, R.options[0], R.options[1] + 1);
      if (down('map')) FO.blitArt(g, scr, 13, R.map[0], R.map[1]);
      if (down('cha')) FO.blitArt(g, scr, 57, R.cha[0], R.cha[1]);
      if (down('pip')) FO.blitArt(g, scr, 59, R.pip[0], R.pip[1]);
      this.drawItem(scr, R.item, down('item'));
      this.drawCounters(scr, o);
      this.drawLights(scr, o);
      this.drawCombat(scr, o, R, down);
      this.drawMonitor(scr, R.monitor);
      this.drawIndicators(scr, o);
    }

    drawIndicators(scr, o) {
      const d = this.p.w.dude;
      const lit = [FO.pcFlag(d, FO.PC_FLAG.ADDICTED), FO.isSneaking(d), FO.pcFlag(d, FO.PC_FLAG.LEVEL)];
      const shown = [0, 1, 2].filter(i => lit[i]);
      if (!shown.length) return;
      const g = this.g;
      const y = o.y - INDICATOR.h;
      const width = INDICATOR.step * shown.length;
      const box = FO.frameOfArt(g, INDICATOR.art);
      const font = g.fonts[101];
      const lh = font.height + font.lineGap;
      scr.rect(o.x, y, width, INDICATOR.h, g.color(0, 0, 0));
      shown.forEach((ind, k) => {
        const x = k ? INDICATOR.step * k - INDICATOR.overlap : 0;
        const w = Math.min(INDICATOR.w, width - x);
        if (box) scr.blitPart(box, 0, 0, w, INDICATOR.h, o.x + x, y);
        const s = this.p.text(INDICATOR.msg[ind], 'INTRFACE');
        FO.textIn(g, s, o.x + x + ((INDICATOR.w - font.width(s)) >> 1), y + ((INDICATOR.textBox - lh) >> 1), 0, FO.uiColor(g, INDICATOR.color[ind]), 101);
      });
    }

    activeItem() {
      return this.state().item;
    }

    refreshItems() {
      const d = this.p.w.dude;
      d.handState = d.handState || [{}, {}];
      for (let hand = 0; hand < 2; hand++) {
        const item = FO.equipped(d, hand ? FO.FLAG.RIGHT_HAND : FO.FLAG.LEFT_HAND);
        const st = d.handState[hand];
        if (st.ready && st.item === item) {
          if (item) st.disabled = FO.weaponDisabled(d, item);
          continue;
        }
        const weapon = !item || item.proto.sub === FO.ITEM.WEAPON;
        d.handState[hand] = {
          ready: true, item, weapon, disabled: item ? FO.weaponDisabled(d, item) : false,
          primary: item ? (hand ? FO.HIT_MODE.RIGHT_PRIMARY : FO.HIT_MODE.LEFT_PRIMARY) : FO.HIT_MODE.PUNCH,
          secondary: item ? (hand ? FO.HIT_MODE.RIGHT_SECONDARY : FO.HIT_MODE.LEFT_SECONDARY) : FO.HIT_MODE.PUNCH,
          action: weapon ? ACT.PRIMARY : ACT.USE
        };
      }
    }

    state() {
      const d = this.p.w.dude;
      this.refreshItems();
      return d.handState[d.hand | 0];
    }

    attackMode() {
      const st = this.state();
      if (st.action === ACT.PRIMARY || st.action === ACT.PRIMARY_AIMED) return { hitMode: st.primary, aimed: st.action === ACT.PRIMARY_AIMED };
      if (st.action === ACT.SECONDARY || st.action === ACT.SECONDARY_AIMED) return { hitMode: st.secondary, aimed: st.action === ACT.SECONDARY_AIMED };
      return { hitMode: -1, aimed: false };
    }

    cycle() {
      const d = this.p.w.dude;
      const st = this.state();
      if (!st.weapon) return;
      for (let guard = 0; guard < 12; guard++) {
        const old = st.action;
        st.action = old + 1;
        if (old === 0) return;
        if (old === 1 && FO.calledShotAllowed(d, st.primary)) return;
        const second = st.primary !== FO.HIT_MODE.PUNCH && FO.attackSubtype(st.item, st.secondary) !== FO.ATTACK_TYPE.NONE;
        if (old === 2 && second) return;
        if (old === 3 && second && FO.calledShotAllowed(d, st.secondary)) return;
        if (old === 4 && FO.ammoMax(st.item) !== ((st.item && st.item.ammo) | 0)) return;
        if (old >= 5) st.action = ACT.USE;
      }
    }

    mode() {
      const d = this.p.w.dude;
      const st = this.state();
      if (st.action === ACT.USE) return { type: 'use', ap: 2 };
      if (st.action === ACT.RELOAD) return { type: 'reload', ap: 2 };
      const { hitMode, aimed } = this.attackMode();
      const type = st.item ? FO.attackMode(st.item, hitMode) : FO.ATTACK.PUNCH;
      return { type, ap: FO.itemApCost(d, hitMode, aimed), aimed };
    }

    drawItem(scr, R, pressed) {
      const g = this.g;
      const [x, y, w, h] = R;
      const item = this.activeItem();
      FO.blitArt(g, scr, pressed ? 31 : 32, x, y);
      const mode = this.mode();
      if (item) {
        const inv = item.proto && item.proto.invFid > 0 ? g.art.get(item.proto.invFid) : null;
        if (inv) {
          const f = inv.dirs[0].frames[0];
          scr.blit(f, x + ((w - f.w) >> 1), y + ((h - f.h) >> 1) + (pressed ? 1 : 0));
        }
      } else {
        const f = FO.frameOfArt(g, 287);
        if (f) scr.blit(f, x + ((w - f.w) >> 1), y + ((h - f.h) >> 1));
      }
      let label = -1;
      if (mode.type === 'reload') label = 291;
      else if (mode.type === 'use') label = 292;
      else label = MODE_TEXT[mode.type] || -1;
      if (label >= 0) {
        const f = FO.frameOfArt(g, label);
        if (f) scr.blit(f, x + w - f.w - 5, y + 4);
      }
      if (mode.aimed) {
        const f = FO.frameOfArt(g, 288);
        if (f) scr.blit(f, x + w - f.w - 6, y + h - f.h - 5);
      }
      const ap = FO.frameOfArt(g, 289);
      const nums = FO.frameOfArt(g, 290);
      if (ap && nums && mode.ap !== undefined) {
        scr.blit(ap, x + 6, y + h - ap.h - 5);
        const n = Math.max(0, Math.min(9, mode.ap | 0));
        scr.blitPart(nums, n * 10, 0, 10, nums.h, x + 6 + ap.w + 2, y + h - nums.h - 5);
      }
      if (item && item.proto && item.proto.maxAmmo > 0) {
        const frac = Math.max(0, Math.min(1, (item.ammo | 0) / item.proto.maxAmmo));
        const bh = Math.round(frac * 70);
        scr.rect(x + 196, y + 2 + 70 - bh, 3, bh, g.color(0, 216, 0));
      }
    }

    counter(scr, x, y, value, color) {
      const nums = FO.frameOfArt(this.g, 82);
      if (!nums) return;
      const glyph = (idx, gx) => scr.blitPart(nums, color * 120 + idx * 9, 0, 9, 17, gx, y);
      const v = Math.max(-999, Math.min(999, value | 0));
      const s = String(Math.abs(v)).padStart(3, '0');
      if (v < 0) glyph(12, x);
      for (let i = 0; i < 3; i++) glyph(+s[i], x + 9 + i * 9);
    }

    drawCounters(scr, o) {
      const d = this.p.w.dude;
      const hp = d.critter.hp | 0;
      const max = Math.max(1, FO.statValue(d, FO.STAT.MAX_HP));
      const color = hp < max / 4 ? 2 : hp < max / 2 ? 1 : 0;
      this.counter(scr, o.x + 473, o.y + 40, hp, color);
      this.counter(scr, o.x + 473, o.y + 75, FO.statValue(d, FO.STAT.AC), 0);
    }

    drawLights(scr, o) {
      const p = this.p;
      if (!p.w.inCombat) return;
      const own = p.combat && p.combat.dudeTurn();
      const n = own ? Math.max(0, Math.min(10, p.w.dude.critter.ap | 0)) : 10;
      for (let i = 0; i < n; i++) FO.blitArt(this.g, scr, own ? AP_LIGHTS.green : AP_LIGHTS.red, o.x + AP_LIGHTS.x + i * AP_LIGHTS.step, o.y + AP_LIGHTS.y);
    }

    drawCombat(scr, o, R, down) {
      const g = this.g;
      if (this.combatFrame <= 0) return;
      FO.blitArt(g, scr, 104, o.x + 580, o.y + 38, this.combatFrame);
      if (this.combatFrame < 4) return;
      const own = this.p.combat && this.p.combat.dudeTurn();
      FO.blitArt(g, scr, own ? 109 : 110, o.x + 580, o.y + 38);
      FO.blitArt(g, scr, down('endTurn') ? 106 : 105, R.endTurn[0], R.endTurn[1]);
      FO.blitArt(g, scr, down('endCombat') ? 108 : 107, R.endCombat[0], R.endCombat[1]);
    }

    lines() {
      const g = this.g;
      const R = this.regions();
      const wrapW = R.monitor[2] - 30;
      const out = [];
      for (const e of this.p.log) for (const l of g.fonts[101].wrap(e.line, wrapW)) out.push(l);
      return out;
    }

    drawMonitor(scr, R) {
      const g = this.g;
      const [x, y] = R;
      const lines = this.lines();
      const rows = 6;
      const end = Math.max(0, lines.length - this.scrollBack);
      const shown = lines.slice(Math.max(0, end - rows), end);
      const col = g.color(0, 216, 0);
      shown.forEach((l, i) => g.text(l, x + 15, y + 18 + i * 10, col, 101));
    }

    mouseDown(m, button) {
      const k = this.at(m);
      if (button === 2 && k === 'item') {
        this.p.cycleMode();
        return;
      }
      if (button !== 0) return;
      if (k === 'monitor') {
        const R = this.regions().monitor;
        const total = this.lines().length;
        if (m.y < R[1] + R[3] / 2) this.scrollBack = Math.min(Math.max(0, total - 6), this.scrollBack + 1);
        else this.scrollBack = Math.max(0, this.scrollBack - 1);
        return;
      }
      this.pressed = k;
      if (k) FO.buttonSound(this.g, k === 'item' ? 'ib3' : 'ib2', false);
    }

    mouseUp(m, button) {
      if (button !== 0) return;
      const k = this.pressed;
      this.pressed = null;
      if (!k || this.at(m) !== k) return;
      FO.buttonSound(this.g, k === 'item' ? 'ib3' : 'ib2', true);
      const p = this.p;
      if (k === 'inv') p.openInventory();
      else if (k === 'options') p.openOptions();
      else if (k === 'skilldex') p.openSkilldex();
      else if (k === 'map') p.openAutomap();
      else if (k === 'cha') p.openCharacter();
      else if (k === 'pip') p.openPipboy();
      else if (k === 'swap') p.swapHands();
      else if (k === 'item') p.useActive();
      else if (k === 'endTurn') p.endTurn();
      else if (k === 'endCombat') p.endCombat();
    }

    cursorAt(m) {
      const k = this.at(m);
      if (k !== 'monitor') return 267;
      const R = this.regions().monitor;
      return m.y < R[1] + R[3] / 2 ? 268 : 269;
    }
  }

  FO.Iface = Iface;
  FO.BAR_H = BAR_H;
})(globalThis.FO = globalThis.FO || {});
