(function (FO) {
  'use strict';

  const SLOT_W = 64;
  const SLOT_H = 48;
  const ROWS = 6;
  const HANDS = FO.FLAG.LEFT_HAND | FO.FLAG.RIGHT_HAND | FO.FLAG.WORN;
  const scaled = new Map();

  FO.fitFrame = function (f, w, h) {
    if (!f) return null;
    if (f.w <= w && f.h <= h) return f;
    const key = f;
    const cache = scaled.get(key);
    if (cache && cache.w0 === w && cache.h0 === h) return cache.frame;
    const k = Math.min(w / f.w, h / f.h);
    const nw = Math.max(1, Math.floor(f.w * k));
    const nh = Math.max(1, Math.floor(f.h * k));
    const px = new Uint8Array(nw * nh);
    for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) px[y * nw + x] = f.px[Math.floor(y / k) * f.w + Math.floor(x / k)];
    const frame = { w: nw, h: nh, px };
    scaled.set(key, { w0: w, h0: h, frame });
    return frame;
  };

  FO.invArt = function (g, item) {
    if (!item || !item.proto || !(item.proto.invFid > 0)) return null;
    const frm = g.art.get(item.proto.invFid);
    return frm ? frm.dirs[0].frames[0] : null;
  };

  FO.drawItemIn = function (g, scr, item, x, y, w, h) {
    const f = FO.fitFrame(FO.invArt(g, item), w, h);
    if (f) scr.blit(f, x + ((w - f.w) >> 1), y + ((h - f.h) >> 1));
  };

  FO.weight = function (o) {
    let w = 0;
    for (const e of o.inventory || []) w += ((e.obj.proto && e.obj.proto.weight) | 0) * e.count + (e.obj.inventory && e.obj.inventory.length ? FO.weight(e.obj) : 0);
    return w;
  };

  FO.refreshDudeArt = function (play) {
    const d = play.w.dude;
    const armor = FO.equipped(d, FO.FLAG.WORN);
    const female = FO.statValue(d, FO.STAT.GENDER) === 1;
    let index = female ? 4 : 11;
    if (armor && armor.proto) {
      const fid = female ? armor.proto.femaleFid : armor.proto.maleFid;
      if (fid > 0) index = FO.fidIndex(fid);
    }
    const hand = FO.equipped(d, (d.hand | 0) === 0 ? FO.FLAG.LEFT_HAND : FO.FLAG.RIGHT_HAND);
    const weapon = hand && hand.proto && hand.proto.sub === FO.ITEM.WEAPON ? hand.proto.anim | 0 : 0;
    d.fid = FO.fid(FO.ART.CRITTER, index, FO.fidAnim(d.fid) >= 38 && FO.fidAnim(d.fid) <= 47 ? 0 : FO.fidAnim(d.fid), weapon);
    play.g.art.loadAll([FO.critterFid(d, FO.ANIM.STAND), FO.critterFid(d, FO.ANIM.WALK), FO.critterFid(d, FO.ANIM.RUN)]);
  };

  class InvList {
    constructor(win, x, y, owner, opts) {
      this.win = win;
      this.x = x;
      this.y = y;
      this.owner = owner;
      this.scroll = 0;
      this.opts = Object.assign({ rows: ROWS, slotW: SLOT_W, slotH: SLOT_H, box: [4, 4, SLOT_W - 8, SLOT_H - 8] }, opts);
    }

    entries() {
      const list = (this.owner.inventory || []).filter(e => !(this.opts.hideEquipped && (e.obj.flags & HANDS)));
      return list.slice().reverse();
    }

    clamp() {
      const n = this.entries().length;
      this.scroll = Math.max(0, Math.min(this.scroll, Math.max(0, n - this.opts.rows)));
    }

    draw(scr) {
      const g = this.win.g;
      const o = this.opts;
      this.clamp();
      const list = this.entries();
      for (let i = 0; i < o.rows; i++) {
        const e = list[this.scroll + i];
        if (!e) break;
        const sx = this.win.x + this.x;
        const sy = this.win.y + this.y + i * o.slotH;
        if (this.win.drag && this.win.drag.entry === e) continue;
        FO.drawItemIn(g, scr, e.obj, sx + o.box[0], sy + o.box[1], o.box[2], o.box[3]);
        if (e.count > 1) this.win.text('x' + e.count, this.x + o.box[0], this.y + i * o.slotH + o.box[1] - 2, this.win.color('white'), 101);
      }
    }

    at(m) {
      if (!this.inside(m)) return null;
      const ly = m.y - this.win.y - this.y;
      return this.entries()[this.scroll + Math.floor(ly / this.opts.slotH)] || null;
    }

    inside(m) {
      const lx = m.x - this.win.x - this.x;
      const ly = m.y - this.win.y - this.y;
      return lx >= 0 && ly >= 0 && lx < this.opts.slotW && ly < this.opts.slotH * this.opts.rows;
    }
  }

  FO.transfer = function (play, from, to, item, count) {
    const sc = play.sc;
    const e = (from.inventory || []).find(x => x.obj === item);
    if (!e) return null;
    const n = Math.max(1, Math.min(count === undefined ? e.count : count, e.count));
    if (n < e.count) {
      e.count -= n;
      const copy = Object.assign({}, item, { id: play.w.newId(), owner: null, inventory: [], flags: item.flags & ~HANDS });
      sc.addItem(to, copy, n);
      return copy;
    }
    sc.removeItem(from, item, n);
    sc.addItem(to, item, n);
    return item;
  };

  FO.askQuantity = function (play, item, max, then) {
    if (max <= 1) {
      then(1);
      return;
    }
    play.openModal(new FO.MoveItemsScreen(play, item, max, then));
  };

  FO.InvList = InvList;

  class InventoryBase extends FO.Win {
    constructor(play) {
      super(play);
      this.drag = null;
      this.info = null;
      this.menu = null;
      this.hold = null;
    }

    sc() {
      return this.p.sc;
    }

    msg(id) {
      return this.p.text(id, 'INVENTRY');
    }

    startDrag(entry, from, owner, m) {
      this.drag = { entry, item: entry.obj, from, owner, x: m.x, y: m.y };
      FO.uiSound(this.g, 'ipickup1');
    }

    drawDrag(scr) {
      if (!this.drag) return;
      const m = this.g.mouse;
      FO.drawItemIn(this.g, scr, this.drag.item, m.x - 28, m.y - 20, 56, 40);
    }

    moveItem(item, from, to, count) {
      return FO.transfer(this.p, from, to, item, count);
    }

    cursor() {
      return this.drag ? -1 : 286;
    }

    lookItem(item) {
      const g = this.g;
      const name = g.protos.name(item.pid);
      const desc = g.protos.desc(item.pid);
      this.info = { name, text: desc || name };
      const s = item.script ? this.sc().exec(item.script, FO.ACT.DESCRIPTION, { source: this.p.w.dude }) : null;
      if (s && s.overrides) this.info = null;
    }

    useItem(item) {
      const p = this.p;
      const d = p.w.dude;
      const s = item.script ? this.sc().exec(item.script, FO.ACT.USE, { source: d }) : null;
      if (s && s.overrides) return;
      if (item.proto && item.proto.sub === FO.ITEM.DRUG) FO.useItemOn(p, d, d, item);
      else FO.useItem(p, d, item);
    }

    dropItem(item, owner, count) {
      const p = this.p;
      const d = p.w.dude;
      const e = owner.inventory.find(x => x.obj === item);
      if (!e) return;
      const s = item.script ? this.sc().exec(item.script, FO.ACT.DROP, { source: d }) : null;
      if (s && s.overrides) return;
      const ground = { inventory: [] };
      const moved = FO.transfer(p, owner, ground, item, count === undefined ? e.count : count);
      if (!moved) return;
      moved.owner = null;
      moved.quantityOnGround = ground.inventory[0] ? ground.inventory[0].count : 1;
      p.w.add(moved, d.tile, d.elev);
      FO.refreshDudeArt(p);
    }

    unload(item, owner) {
      const sc = this.sc();
      const pack = this.g.protos.get(item.ammoPid);
      if (!pack || !(item.ammo > 0)) return;
      const size = Math.max(1, pack.quantity | 0);
      while (item.ammo > 0) {
        const ammo = sc.createObject(item.ammoPid, -1, 0);
        if (!ammo) break;
        ammo.quantity = Math.min(size, item.ammo);
        item.ammo -= ammo.quantity;
        sc.addItem(owner, ammo, 1);
      }
    }

    itemActions(item) {
      const p = item.proto || {};
      const list = ['look'];
      if (((p.flagsExt | 0) & 0x800) || p.sub === FO.ITEM.DRUG) list.push('use');
      list.push('drop');
      if (p.sub === FO.ITEM.WEAPON && (item.ammo | 0) > 0 && p.maxAmmo > 0) list.push('unload');
      list.push('cancel');
      return list;
    }

    itemAction(kind, entry, owner) {
      const item = entry.obj;
      if (kind === 'look') this.lookItem(item);
      else if (kind === 'use') this.useItem(item);
      else if (kind === 'drop') FO.askQuantity(this.p, item, entry.count, n => this.dropItem(item, owner, n));
      else if (kind === 'unload') this.unload(item, owner);
    }
  }

  class InventoryScreen extends InventoryBase {
    constructor(play, opts) {
      super(play);
      this.opts = opts || {};
      this.list = new InvList(this, 44, 35, play.w.dude, { hideEquipped: true });
      this.rot = 0;
      this.rotTime = 0;
      this.button({ id: 'up', x: 128, y: 39, up: 49, down: 50, onClick: () => { this.list.scroll--; } });
      this.button({ id: 'down', x: 128, y: 62, up: 51, down: 52, onClick: () => { this.list.scroll++; } });
      this.button({ id: 'done', x: 436, y: 328, w: 16, h: 17, up: -1, down: 9, baked: true, key: ['Escape', 'KeyI', 'Enter'], onClick: () => this.close() });
    }

    async enter() {
      const g = this.g;
      await g.art.loadAll([48, 49, 50, 51, 52, 9, 286].map(FO.IFACE));
      const fids = [];
      const walk = o => {
        for (const e of o.inventory || []) {
          if (e.obj.proto && e.obj.proto.invFid > 0) fids.push(e.obj.proto.invFid);
          walk(e.obj);
        }
      };
      walk(this.p.w.dude);
      await g.art.loadAll(fids);
    }

    update(dt) {
      this.rotTime += dt;
      if (this.rotTime > 0.25) {
        this.rotTime = 0;
        this.rot = (this.rot + 1) % 6;
      }
      const h = this.hold;
      if (h && !this.drag && !this.menu && !this.opts.useOn && (this.g.now || 0) - h.t > 300) {
        this.menu = new FO.ActionMenu(this.p, h, h.m.x, h.m.y, this.itemActions(h.entry.obj), this.g.scr.h);
      }
    }

    slots() {
      return {
        armor: [154, 183, 90, 61, FO.FLAG.WORN],
        left: [154, 286, 90, 61, FO.FLAG.LEFT_HAND],
        right: [247, 286, 90, 61, FO.FLAG.RIGHT_HAND]
      };
    }

    slotAt(m) {
      const lx = m.x - this.x;
      const ly = m.y - this.y;
      for (const [k, [x, y, w, h]] of Object.entries(this.slots())) if (lx >= x && ly >= y && lx < x + w && ly < y + h) return k;
      return null;
    }

    draw(scr) {
      const g = this.g;
      this.x = Math.max(0, (scr.w - 499) >> 1);
      this.y = Math.max(0, ((scr.h - FO.BAR_H) - 377) >> 1);
      this.blit(scr, 48, 0, 0);
      this.drawButtons(scr);
      this.list.draw(scr);
      const d = this.p.w.dude;
      for (const [k, [x, y, w, h, flag]] of Object.entries(this.slots())) {
        const item = FO.equipped(d, flag);
        if (item && !(this.drag && this.drag.item === item)) FO.drawItemIn(g, scr, item, this.x + x + 4, this.y + y + 4, w - 8, h - 8);
        void k;
      }
      const frm = g.art.get(FO.critterFid(d, FO.ANIM.STAND));
      if (frm) {
        const dir = frm.dirs[this.rot] || frm.dirs[0];
        const f = dir.frames[0];
        scr.blit(f, this.x + 176 + ((60 - f.w) >> 1), this.y + 37 + ((100 - f.h) >> 1));
      }
      this.drawInfo(scr);
      this.drawDrag(scr);
      if (this.menu) this.menu.draw(scr);
    }

    drawInfo(scr) {
      const g = this.g;
      const d = this.p.w.dude;
      const x = 297;
      let y = 44;
      const green = this.color('green');
      if (this.info) {
        this.text(this.info.name, x, y, green, 101);
        y += 14;
        for (const l of g.fonts[101].wrap(this.info.text, 150)) {
          this.text(l, x, y, green, 101);
          y += 10;
        }
        return;
      }
      this.text(d.name || 'None', x, y, green, 101);
      y += 12;
      scr.rect(this.x + x, this.y + y, 150, 1, green);
      y += 4;
      for (let i = 0; i < 7; i++) {
        this.text(this.msg(i), x, y + i * 10, green, 101);
        this.text(String(FO.statValue(d, i)), x + 22, y + i * 10, green, 101);
      }
      const right = (s, yy) => FO.textIn(g, s, this.x + x, this.y + yy, 150, green, 101, 'right');
      this.text(this.msg(7), x + 36, y, green, 101);
      right(FO.statValue(d, FO.STAT.HP) + '/' + FO.statValue(d, FO.STAT.MAX_HP), y);
      this.text(this.msg(8), x + 36, y + 10, green, 101);
      right(String(FO.statValue(d, FO.STAT.AC)), y + 10);
      const types = [0, 1, 2, 3, 6];
      types.forEach((t, i) => {
        this.text(this.msg(9 + i), x + 36, y + 20 + i * 10, green, 101);
        right(FO.statValue(d, FO.STAT.DT + t) + '/' + FO.statValue(d, FO.STAT.DR + t) + '%', y + 20 + i * 10);
      });
      y += 74;
      scr.rect(this.x + x, this.y + y, 150, 1, green);
      y += 4;
      for (const flag of [FO.FLAG.LEFT_HAND, FO.FLAG.RIGHT_HAND]) {
        const item = FO.equipped(d, flag);
        if (!item) {
          this.text(this.msg(14), x, y, green, 101);
          this.text(this.msg(24) + ' 1-' + (1 + FO.statValue(d, FO.STAT.MELEE_DMG)), x, y + 10, green, 101);
        } else {
          this.text(g.protos.name(item.pid), x, y, green, 101);
          const p = item.proto;
          if (p && p.sub === FO.ITEM.WEAPON) {
            this.text(this.msg(15) + ' ' + p.minDmg + '-' + p.maxDmg + '  ' + this.msg(16) + ' ' + p.range1, x, y + 10, green, 101);
            if (p.maxAmmo > 0) this.text(this.msg(17) + ' ' + (item.ammo | 0) + '/' + p.maxAmmo, x, y + 20, green, 101);
          }
        }
        y += 32;
      }
      const wt = this.msg(20) + ' ' + FO.weight(d) + '/' + FO.statValue(d, FO.STAT.CARRY);
      this.text(wt, x, 222, green, 101);
    }

    mouseDown(m, button) {
      if (button === 2) {
        this.info = null;
        return;
      }
      super.mouseDown(m, button);
      if (this.pressed || button !== 0) return;
      const d = this.p.w.dude;
      const e = this.list.at(m);
      if (e) {
        this.hold = { entry: e, from: 'list', t: this.g.now || 0, m: { x: m.x, y: m.y } };
        return;
      }
      const slot = this.slotAt(m);
      if (slot) {
        const flag = this.slots()[slot][4];
        const item = FO.equipped(d, flag);
        if (item) this.hold = { entry: d.inventory.find(x => x.obj === item), from: slot, t: this.g.now || 0, m: { x: m.x, y: m.y } };
      }
    }

    mouseMove(m) {
      if (this.menu) {
        this.menu.update(m);
        return;
      }
      if (this.hold && !this.drag && Math.abs(m.x - this.hold.m.x) + Math.abs(m.y - this.hold.m.y) > 4) {
        this.startDrag(this.hold.entry, this.hold.from, this.p.w.dude, m);
        this.hold = null;
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
      if (this.menu) {
        const menu = this.menu;
        this.menu = null;
        this.itemAction(menu.items[menu.hover], menu.obj.entry, this.p.w.dude);
        return;
      }
      if (this.drag) {
        FO.uiSound(this.g, 'iputdown');
        this.drop(m);
        this.drag = null;
        return;
      }
      if (hold) {
        if (this.opts.useOn) {
          this.close();
          if (this.p.useItemOn) this.p.useItemOn(hold.entry.obj, this.opts.useOn);
          return;
        }
        this.lookItem(hold.entry.obj);
      }
    }

    drop(m) {
      const d = this.p.w.dude;
      const was = FO.armorOf(d);
      this.place(m);
      const now = FO.armorOf(d);
      if (was !== now) FO.adjustArmor(d, was, now);
    }

    reloadByDrop(weapon, ammo) {
      const d = this.p.w.dude;
      const e = d.inventory.find(x => x.obj === ammo);
      const go = n => {
        let loaded = false;
        let pack = ammo;
        for (let i = 0; i < n && pack; i++) {
          const rest = FO.reloadWeapon(weapon, pack);
          if (rest === -1) break;
          loaded = true;
          if (rest !== 0) break;
          FO.spendPack(d, pack);
          const next = d.inventory.find(x => x.obj.pid === ammo.pid && !(x.obj.flags & HANDS));
          pack = next ? next.obj : null;
        }
        if (loaded) FO.reloadSound(this.g, weapon);
        if (this.refresh) this.refresh();
      };
      FO.askQuantity(this.p, ammo, e ? e.count : 1, go);
    }

    place(m) {
      const d = this.p.w.dude;
      const item = this.drag.item;
      const slot = this.slotAt(m);
      const under = slot ? FO.equipped(d, this.slots()[slot][4]) : this.list.inside(m) ? (this.list.at(m) || {}).obj : null;
      if (under && under !== item && FO.canReload(under, item)) {
        this.reloadByDrop(under, item);
        return;
      }
      if (slot) {
        const flag = this.slots()[slot][4];
        if (slot === 'armor' && (!item.proto || item.proto.sub !== FO.ITEM.ARMOR)) return;
        const prev = FO.equipped(d, flag);
        if (prev && prev !== item) prev.flags &= ~flag;
        if (this.drag.from === 'list') {
          const e = d.inventory.find(x => x.obj === item);
          if (e && e.count > 1) {
            e.count--;
            const copy = Object.assign({}, item, { id: this.p.w.newId(), inventory: [] });
            copy.flags = (copy.flags & ~HANDS) | flag;
            d.inventory.push({ count: 1, obj: copy });
          } else {
            item.flags = (item.flags & ~HANDS) | flag;
          }
        } else {
          item.flags = (item.flags & ~HANDS) | flag;
        }
        if (prev && prev !== item) this.restack(prev);
        FO.refreshDudeArt(this.p);
        return;
      }
      if (this.list.inside(m) && this.drag.from !== 'list') {
        item.flags &= ~HANDS;
        this.restack(item);
        FO.refreshDudeArt(this.p);
      }
    }

    restack(item) {
      const d = this.p.w.dude;
      const e = d.inventory.find(x => x.obj === item);
      if (!e) return;
      const other = d.inventory.find(x => x !== e && x.obj.pid === item.pid && !(x.obj.flags & HANDS) && this.p.w.stackable(x.obj, item));
      if (other) {
        other.count += e.count;
        d.inventory.splice(d.inventory.indexOf(e), 1);
      }
    }
  }

  class LootScreen extends InventoryBase {
    constructor(play, target, opts) {
      super(play);
      this.target = target;
      this.steal = !!(opts && opts.steal);
      this.stealCount = 0;
      this.stealExp = 0;
      this.nextExp = 10;
      this.caught = false;
      this.mine = new InvList(this, 44, 35, play.w.dude, { hideEquipped: true });
      this.theirs = new InvList(this, 424, 35, target, { hideEquipped: false });
      this.button({ id: 'up1', x: 128, y: 39, up: 49, down: 50, onClick: () => { this.mine.scroll--; } });
      this.button({ id: 'down1', x: 128, y: 62, up: 51, down: 52, onClick: () => { this.mine.scroll++; } });
      this.button({ id: 'up2', x: 388, y: 39, up: 49, down: 50, onClick: () => { this.theirs.scroll--; } });
      this.button({ id: 'down2', x: 388, y: 62, up: 51, down: 52, onClick: () => { this.theirs.scroll++; } });
      this.button({ id: 'done', x: 288, y: 329, w: 16, h: 17, up: -1, down: 9, baked: true, key: ['Escape', 'Enter'], onClick: () => this.close() });
    }

    async enter() {
      const g = this.g;
      await g.art.loadAll([114, 49, 50, 51, 52, 9, 286].map(FO.IFACE));
      const fids = [];
      for (const o of [this.p.w.dude, this.target]) for (const e of o.inventory || []) if (e.obj.proto && e.obj.proto.invFid > 0) fids.push(e.obj.proto.invFid);
      if (this.target.fid) fids.push(this.target.fid);
      await g.art.loadAll(fids);
    }

    leave() {
      const p = this.p;
      const w = p.w;
      if (!this.steal) return;
      const party = w.party && w.party.includes(this.target);
      if (!this.caught && this.stealExp > 0 && !party) {
        p.say(this.msg(29).replace('%d', this.stealExp));
        p.giveExp(this.stealExp);
      }
      if (this.caught && this.stealCount > 0 && this.target.script) p.exec(this.target, FO.ACT.PICKUP, { source: w.dude });
    }

    stealOne(item, planting, then) {
      this.stealCount++;
      if (FO.stealCheck(this.p, this.p.w.dude, this.target, item, planting, this.stealCount)) {
        then();
        if (!planting) {
          this.stealExp += this.nextExp;
          this.nextExp += 10;
        }
        return;
      }
      this.caught = true;
      this.close();
    }

    draw(scr) {
      const g = this.g;
      this.x = Math.max(0, (scr.w - 537) >> 1);
      this.y = Math.max(0, ((scr.h - FO.BAR_H) - 376) >> 1);
      this.blit(scr, 114, 0, 0);
      this.drawButtons(scr);
      this.mine.draw(scr);
      this.theirs.draw(scr);
      const d = this.p.w.dude;
      const doll = (o, x) => {
        const frm = g.art.get(FO.pidType(o.pid) === FO.PID.CRITTER ? (this.p.w.isDead(o) ? o.fid : FO.critterFid(o, FO.ANIM.STAND)) : o.fid);
        if (!frm) return;
        const dir = frm.dirs[FO.pidType(o.pid) === FO.PID.CRITTER ? (this.p.w.isDead(o) ? o.rot : 2) : 0] || frm.dirs[0];
        const f = FO.fitFrame(dir.frames[Math.min(o.frame | 0, dir.frames.length - 1)], 60, 100);
        scr.blit(f, this.x + x + ((60 - f.w) >> 1), this.y + 37 + ((100 - f.h) >> 1));
      };
      doll(d, 176);
      doll(this.target, 297);
      this.drawDrag(scr);
    }

    mouseDown(m, button) {
      super.mouseDown(m, button);
      if (this.pressed || button !== 0) return;
      const a = this.mine.at(m);
      const b = this.theirs.at(m);
      if (a) this.hold = { entry: a, from: 'mine', m: { x: m.x, y: m.y } };
      else if (b) this.hold = { entry: b, from: 'theirs', m: { x: m.x, y: m.y } };
    }

    mouseMove(m) {
      if (this.hold && !this.drag && Math.abs(m.x - this.hold.m.x) + Math.abs(m.y - this.hold.m.y) > 4) {
        const owner = this.hold.from === 'mine' ? this.p.w.dude : this.target;
        this.startDrag(this.hold.entry, this.hold.from, owner, m);
        this.hold = null;
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
      if (this.drag) {
        const dr = this.drag;
        this.drag = null;
        FO.uiSound(this.g, 'iputdown');
        const d = this.p.w.dude;
        if (dr.from === 'theirs' && this.mine.inside(m)) {
          const item = dr.item;
          FO.askQuantity(this.p, item, dr.entry.count, n => {
            if (FO.weight(d) + ((item.proto && item.proto.weight) | 0) * n > FO.statValue(d, FO.STAT.CARRY)) {
              this.p.say(this.msg(25));
              return;
            }
            const take = () => this.moveItem(item, this.target, d, n);
            if (this.steal) this.stealOne(item, false, take);
            else take();
          });
        } else if (dr.from === 'mine' && this.theirs.inside(m)) {
          FO.askQuantity(this.p, dr.item, dr.entry.count, n => {
            const give = () => this.moveItem(dr.item, d, this.target, n);
            if (this.steal) this.stealOne(dr.item, true, give);
            else give();
          });
        }
        return;
      }
      if (hold) this.lookItem(hold.entry.obj);
    }

    cursor() {
      return this.drag ? -1 : 286;
    }
  }

  class MoveItemsScreen extends FO.Win {
    constructor(play, item, max, then, opts) {
      super(play);
      this.item = item;
      this.timer = !!(opts && opts.timer);
      this.step = this.timer ? 10 : 1;
      this.min = this.timer ? 10 : 1;
      this.max = Math.max(this.min, Math.min(999, max | 0));
      this.qty = this.timer ? 60 : 1;
      this.typed = false;
      this.then = then;
      this.overBar = true;
      this.button({ id: 'plus', x: 200, y: 46, w: 16, h: 12, up: 193, down: 194, onClick: () => this.set(this.qty + this.step) });
      this.button({ id: 'minus', x: 200, y: 58, w: 17, h: 12, up: 191, down: 192, onClick: () => this.set(this.qty - this.step) });
      if (!this.timer) this.button({ id: 'all', x: 120, y: 80, w: 94, h: 33, up: 308, down: 307, onClick: () => this.set(this.max) });
      this.button({ id: 'done', x: 98, y: 128, w: 15, h: 16, up: 8, down: 9, key: ['Enter', 'NumpadEnter'], onClick: () => this.finish(true) });
      this.button({ id: 'cancel', x: 148, y: 128, w: 15, h: 16, up: 8, down: 9, key: ['Escape'], onClick: () => this.finish(false) });
    }

    async enter() {
      await this.g.art.loadAll([305, 307, 308, 191, 192, 193, 194, 170, 8, 9].map(FO.IFACE));
    }

    set(v) {
      this.typed = false;
      this.qty = Math.max(this.min, Math.min(this.max, v));
    }

    finish(ok) {
      if (ok && (this.qty < this.min || this.qty > this.max || this.qty % this.step)) return;
      this.close();
      if (ok) this.then(this.qty);
    }

    keyDown(e) {
      const digit = /^(?:Digit|Numpad)([0-9])$/.exec(e.code);
      if (digit && !this.timer) {
        const base = this.typed ? this.qty : 0;
        this.qty = (base * 10) % 1000 + +digit[1];
        this.typed = true;
        return true;
      }
      if (e.code === 'Backspace' && !this.timer) {
        this.qty = this.typed ? Math.floor(this.qty / 10) : 0;
        this.typed = true;
        return true;
      }
      return super.keyDown(e);
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = FO.screenOrigin(scr, this.g);
      this.x = ox + 140;
      this.y = oy + 80;
      this.blit(scr, 305, 0, 0);
      const title = this.p.text(this.timer ? 23 : 21, 'INVENTRY');
      FO.textIn(g, title, this.x, this.y + 9, 259, this.color('title'), 103, 'center');
      FO.drawItemIn(g, scr, this.item, this.x + 16, this.y + 46, 90, 61);
      this.drawButtons(scr);
      const pressed = this.pressed && this.pressed.id === 'all' && this.pressed.contains(g.mouse.x - this.x, g.mouse.y - this.y);
      if (!this.timer) FO.textIn(g, this.p.text(22, 'INVENTRY'), this.x + 120, this.y + 84, 94, this.color(pressed ? 'titleDown' : 'title'), 103, 'center');
      const nums = this.art(170);
      if (!nums) return;
      const digits = String(Math.max(0, Math.min(999, this.qty))).padStart(3, '0');
      for (let i = 0; i < 3; i++) scr.blitPart(nums, +digits[i] * 14, 0, 14, 24, this.x + 153 + i * 14, this.y + 45);
    }
  }

  FO.InventoryScreen = InventoryScreen;
  FO.LootScreen = LootScreen;
  FO.MoveItemsScreen = MoveItemsScreen;
})(globalThis.FO = globalThis.FO || {});
