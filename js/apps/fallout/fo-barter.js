(function (FO) {
  'use strict';

  const ART = { PANEL: 111, UP: 49, UP_IN: 50, DOWN: 51, DOWN_IN: 52, RED_UP: 95, RED_DOWN: 96 };
  const PANEL_Y = 290;
  const IN_X = 80;
  const ROWS = 3;
  const MONEY_PID = 41;
  const HANDS = FO.FLAG.LEFT_HAND | FO.FLAG.RIGHT_HAND | FO.FLAG.WORN;
  const NO_TRADE = 0x2000;

  FO.itemCost = function (protos, item) {
    const p = item.proto || protos.get(item.pid);
    if (!p) return 0;
    let cost = p.cost | 0;
    if (p.sub === FO.ITEM.CONTAINER) cost += FO.totalCost(protos, item);
    else if (p.sub === FO.ITEM.WEAPON && (item.ammo | 0) > 0 && item.ammoPid > 0) {
      const ammo = protos.get(item.ammoPid);
      if (ammo && ammo.quantity > 0) cost += Math.trunc((ammo.cost | 0) * item.ammo / ammo.quantity);
    } else if (p.sub === FO.ITEM.AMMO && p.quantity > 0) {
      cost = Math.trunc(cost * (item.quantity | 0) / p.quantity);
    }
    return cost;
  };

  FO.totalCost = function (protos, o) {
    let sum = 0;
    for (const e of o.inventory || []) {
      const p = e.obj.proto || protos.get(e.obj.pid);
      if (p && p.sub === FO.ITEM.AMMO) sum += FO.itemCost(protos, e.obj) + (p.cost | 0) * (e.count - 1);
      else sum += FO.itemCost(protos, e.obj) * e.count;
    }
    return sum;
  };

  FO.moneyOf = function (protos, o) {
    let sum = 0;
    for (const e of o.inventory || []) {
      if (e.obj.pid === MONEY_PID) sum += e.count;
      else {
        const p = e.obj.proto || protos.get(e.obj.pid);
        if (p && p.sub === FO.ITEM.CONTAINER) sum += FO.moneyOf(protos, e.obj);
      }
    }
    return sum;
  };

  FO.reactionOf = function (play, npc) {
    const s = npc && npc.script;
    const lv = s && s.lvars;
    if (!lv || lv.length < 4) return 50;
    if (!lv[2]) {
      const gv = play.sc ? play.sc.gvars : [];
      const d = play.w.dude;
      let r = 50 + FO.statValue(d, FO.STAT.CH) * 5 - 25;
      r += FO.perkRank(d, FO.PERK.PRESENCE) * 10;
      const karma = gv[155] | 0;
      if (FO.perkRank(d, FO.PERK.CULT_OF_PERSONALITY) > 0) r += karma > 0 ? karma : -karma;
      else r += lv[3] === 1 ? -karma : karma;
      if ((gv[158] | 0) > 2) r -= 30;
      if ((gv[160] | 0) > (gv[159] | 0) * 3 || (gv[157] | 0) === 1) r += 20;
      if ((gv[159] | 0) > (gv[160] | 0) * 2 || (gv[156] | 0) === 1) r -= 20;
      lv[0] = r;
      lv[1] = r <= 25 ? 1 : r <= 75 ? 2 : 3;
      lv[2] = 1;
    }
    return lv[0] | 0;
  };

  FO.barterMood = function (play, npc) {
    const r = FO.reactionOf(play, npc);
    return r <= 25 ? -25 : r <= 75 ? 0 : 50;
  };

  FO.barterAsk = function (play, npc, table, mod) {
    const d = play.w.dude;
    const protos = play.g.protos;
    let pct = FO.perkRank(d, FO.PERK.MASTER_TRADER) > 0 ? 125 : 100;
    pct += FO.skillValue(d, FO.SKILL.BARTER) - FO.skillValue(npc, FO.SKILL.BARTER) + mod;
    pct = Math.max(10, Math.min(300, pct));
    const money = FO.moneyOf(protos, table);
    return Math.trunc((FO.totalCost(protos, table) - money) * 100 / pct) + money;
  };

  FO.untradable = function (o) {
    if ((o.flags | 0) & NO_TRADE) return true;
    return (o.inventory || []).some(e => ((e.obj.flags | 0) & NO_TRADE) || FO.untradable(e.obj));
  };

  class BarterScreen extends FO.Win {
    constructor(play, npc, mod, talk) {
      super(play);
      this.npc = npc;
      this.talk = talk || null;
      this.mod = FO.barterMood(play, npc) + (mod | 0);
      this.overBar = true;
      this.myTable = { id: -1, pid: -1, inventory: [] };
      this.theirTable = { id: -1, pid: -1, inventory: [] };
      const d = play.w.dude;
      this.mine = new FO.InvList(this, IN_X + 29, 35, d, { hideEquipped: true, rows: ROWS, box: [-3, 4, 59, 40] });
      this.theirs = new FO.InvList(this, IN_X + 395, 35, npc, { hideEquipped: true, rows: ROWS, box: [2, 4, 56, 40] });
      this.myOffer = new FO.InvList(this, IN_X + 165, 20, this.myTable, { rows: ROWS, box: [4, 4, 56, 40] });
      this.theirOffer = new FO.InvList(this, IN_X + 250, 20, this.theirTable, { rows: ROWS, box: [4, 4, 56, 40] });
      this.button({ id: 'up1', x: IN_X + 109, y: 56, up: ART.UP, down: ART.UP_IN, key: 'ArrowUp', onClick: () => { this.mine.scroll--; } });
      this.button({ id: 'down1', x: IN_X + 109, y: 82, up: ART.DOWN, down: ART.DOWN_IN, key: 'ArrowDown', onClick: () => { this.mine.scroll++; } });
      this.button({ id: 'up2', x: IN_X + 342, y: 56, up: ART.UP, down: ART.UP_IN, onClick: () => { this.theirs.scroll--; } });
      this.button({ id: 'down2', x: IN_X + 342, y: 82, up: ART.DOWN, down: ART.DOWN_IN, onClick: () => { this.theirs.scroll++; } });
      this.button({ id: 'offer', x: 41, y: 163, w: 14, h: 14, up: -1, down: ART.RED_DOWN, baked: true, sound: 'ib2', key: 'KeyM', onClick: () => this.offer() });
      this.button({ id: 'talk', x: 584, y: 162, w: 14, h: 14, up: -1, down: ART.RED_DOWN, baked: true, sound: 'ib2', key: ['KeyT', 'Escape'], onClick: () => this.finish() });
      this.drag = null;
      this.hold = null;
    }

    async enter() {
      const g = this.g;
      await g.art.loadAll(Object.values(ART).map(FO.IFACE).concat([FO.IFACE(286)]));
      const fids = [];
      for (const o of [this.p.w.dude, this.npc]) for (const e of o.inventory || []) if (e.obj.proto && e.obj.proto.invFid > 0) fids.push(e.obj.proto.invFid);
      await g.art.loadAll(fids);
    }

    say(id) {
      const text = this.p.text(id, 'INVENTRY');
      if (this.talk) this.talk.notice = text;
      else this.p.say(text);
    }

    offer() {
      const p = this.p;
      const d = p.w.dude;
      if (!this.myTable.inventory.length || FO.untradable(this.myTable)) {
        this.say(28);
        return;
      }
      const offered = FO.totalCost(this.g.protos, this.myTable);
      if (FO.barterAsk(p, this.npc, this.theirTable, this.mod) > offered) {
        this.say(28);
        return;
      }
      this.empty(this.theirTable, d);
      this.empty(this.myTable, this.npc);
      this.say(27);
    }

    empty(table, to) {
      for (const e of table.inventory.slice()) FO.transfer(this.p, table, to, e.obj, e.count);
    }

    finish() {
      this.empty(this.myTable, this.p.w.dude);
      this.empty(this.theirTable, this.npc);
      if (this.talk) this.talk.notice = null;
      FO.refreshDudeArt(this.p);
      this.close();
    }

    lists() {
      return [['mine', this.mine], ['theirs', this.theirs], ['myOffer', this.myOffer], ['theirOffer', this.theirOffer]];
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = FO.screenOrigin(scr, this.g);
      this.x = ox;
      this.y = oy + PANEL_Y;
      this.blit(scr, ART.PANEL, 0, 0);
      this.drawButtons(scr);
      for (const [, l] of this.lists()) l.draw(scr);
      const white = this.color('white');
      FO.textIn(g, '$' + FO.totalCost(g.protos, this.myTable), this.x + IN_X + 169, this.y + 168, 80, white, 101);
      FO.textIn(g, '$' + FO.barterAsk(this.p, this.npc, this.theirTable, this.mod), this.x + IN_X + 254, this.y + 168, 80, white, 101);
      if (this.drag) FO.drawItemIn(g, scr, this.drag.item, g.mouse.x - 28, g.mouse.y - 20, 56, 40);
    }

    mouseDown(m, button) {
      super.mouseDown(m, button);
      if (this.pressed || button !== 0) return;
      for (const [name, l] of this.lists()) {
        const e = l.at(m);
        if (e) {
          this.hold = { name, list: l, entry: e, m: { x: m.x, y: m.y } };
          return;
        }
      }
    }

    mouseMove(m) {
      const h = this.hold;
      if (h && !this.drag && Math.abs(m.x - h.m.x) + Math.abs(m.y - h.m.y) > 4) {
        this.drag = { from: h.name, owner: h.list.owner, entry: h.entry, item: h.entry.obj };
        this.hold = null;
        FO.uiSound(this.g, 'ipickup1');
      }
    }

    mouseUp(m, button) {
      if (this.pressed) {
        super.mouseUp(m, button);
        return;
      }
      if (button !== 0) return;
      const hold = this.hold;
      this.hold = null;
      const dr = this.drag;
      this.drag = null;
      if (!dr) {
        if (hold && this.talk) this.talk.notice = this.g.protos.desc(hold.entry.obj.pid) || this.g.protos.name(hold.entry.obj.pid);
        return;
      }
      FO.uiSound(this.g, 'iputdown');
      const routes = { mine: ['myOffer'], myOffer: ['mine'], theirs: ['theirOffer'], theirOffer: ['theirs'] };
      const target = this.lists().find(([name, l]) => routes[dr.from].includes(name) && l.inside(m));
      if (!target) return;
      FO.askQuantity(this.p, dr.item, dr.entry.count, n => {
        const moved = FO.transfer(this.p, dr.owner, target[1].owner, dr.item, n);
        if (moved) moved.flags &= ~HANDS;
        FO.refreshDudeArt(this.p);
      });
    }

    cursor() {
      return this.drag ? -1 : 286;
    }
  }

  FO.BarterScreen = BarterScreen;
})(globalThis.FO = globalThis.FO || {});
