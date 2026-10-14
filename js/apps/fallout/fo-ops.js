(function (FO) {
  'use strict';

  FO.CAPS_PID = 41;
  FO.INVEN = { WORN: 0, RIGHT: 1, LEFT: 2, COUNT: -2 };
  FO.OBJ_TRAIT = { AI: 5, TEAM: 6, ROT: 10, VISIBILITY: 666, WEIGHT: 669 };
  FO.METARULE = { END_GAME: 13, FIRST_RUN: 14, ELEVATOR: 15, PARTY_COUNT: 16, IS_LOADGAME: 22 };
  FO.DIALOG_BG = 2;

  FO.registerOps = function (sc) {
    const vm = sc.vm;
    const w = sc.w;
    const reg = (name, fn) => vm.register(name, fn);
    const isObj = o => !!o && typeof o === 'object';
    const host = () => sc.host || {};
    const isCritter = o => isObj(o) && FO.pidType(o.pid) === FO.PID.CRITTER;

    const nameOf = o => {
      if (!isObj(o)) return '';
      if (o.dude) return (sc.g.player && sc.g.player.name) || 'None';
      return sc.g.protos.name(o.pid);
    };

    const invOf = o => (isObj(o) && o.inventory) || [];

    const countPid = (o, pid) => invOf(o).reduce((n, e) => n + (e.obj.pid === pid ? e.count : 0), 0);

    const removeItem = (owner, item, count) => {
      const list = invOf(owner);
      const i = list.findIndex(e => e.obj === item);
      if (i < 0) return 0;
      const e = list[i];
      const n = count === undefined ? e.count : Math.min(count, e.count);
      e.count -= n;
      if (e.count <= 0) {
        list.splice(i, 1);
        item.owner = null;
        if (item.flags & FO.FLAG.WORN) FO.adjustArmor(owner, item, null);
        item.flags &= ~(FO.FLAG.LEFT_HAND | FO.FLAG.RIGHT_HAND | FO.FLAG.WORN);
        if (owner.dude || isCritter(owner)) refreshFid(owner);
      }
      return n;
    };

    const detach = item => {
      if (item.owner) removeItem(item.owner, item);
      else if (item.tile >= 0 && w.map) w.remove(item);
    };

    const addItem = (who, item, count) => {
      if (!isObj(who) || !isObj(item)) return;
      if (item.owner !== who) detach(item);
      if (item.tile >= 0) w.remove(item);
      item.owner = who;
      item.tile = -1;
      const same = who.inventory.find(e => e.obj === item);
      if (same) {
        same.count += count;
        return;
      }
      const stack = who.inventory.find(e => e.obj !== item && w.stackable(e.obj, item) && !(e.obj.flags & (FO.FLAG.LEFT_HAND | FO.FLAG.RIGHT_HAND | FO.FLAG.WORN)));
      if (stack) stack.count += count;
      else who.inventory.push({ count, obj: item });
    };

    const weaponCode = item => {
      if (!item || !item.proto || item.proto.sub !== FO.ITEM.WEAPON) return 0;
      return item.proto.anim | 0;
    };

    const refreshFid = who => {
      if (!isCritter(who)) return;
      const right = invOf(who).find(e => e.obj.flags & FO.FLAG.RIGHT_HAND);
      const anim = FO.fidAnim(who.fid);
      const code = right ? weaponCode(right.obj) : 0;
      who.fid = FO.fid(FO.ART.CRITTER, FO.fidIndex(who.fid), anim >= 38 && anim <= 47 && !code ? 0 : anim, code);
    };

    const createObject = (pid, tile, elev) => {
      const p = sc.g.protos.get(pid);
      if (!p) return null;
      const trans = FO.FLAG.TRANS_RED | FO.FLAG.TRANS_NONE | FO.FLAG.TRANS_WALL | FO.FLAG.TRANS_GLASS | FO.FLAG.TRANS_STEAM | FO.FLAG.TRANS_ENERGY;
      let flags = (p.flags & ~(FO.FLAG.LEFT_HAND | FO.FLAG.RIGHT_HAND | FO.FLAG.WORN)) >>> 0;
      if ((flags & trans) === trans) flags = (FO.FLAG.FLAT | FO.FLAG.LIGHT_THRU | FO.FLAG.SHOOT_THRU) >>> 0;
      const o = {
        id: w.newId(), pid, fid: p.fid, tile: -1, elev: elev | 0, rot: 0, frame: 0, flags, x: 0, y: 0,
        lightRadius: p.lightRadius | 0, lightIntensity: p.lightIntensity | 0, outline: 0, sid: -1, scriptIndex: -1, inventory: [], proto: p, owner: null
      };
      const type = FO.pidType(pid);
      if (type === FO.PID.CRITTER) {
        const maxHp = (p.base[FO.STAT.MAX_HP] | 0) + (p.bonus[FO.STAT.MAX_HP] | 0);
        o.critter = { damageLastTurn: 0, maneuver: 0, ap: 0, results: 0, ai: p.ai, team: p.team, whoHitMe: -1, hp: maxHp, rad: 0, poison: 0 };
      } else {
        o.dataFlags = 0;
        if (type === FO.PID.ITEM) {
          if (p.sub === FO.ITEM.WEAPON) {
            o.ammo = p.maxAmmo | 0;
            o.ammoPid = p.ammoPid;
          } else if (p.sub === FO.ITEM.AMMO) o.quantity = p.quantity | 0;
          else if (p.sub === FO.ITEM.MISC) o.charges = p.charges | 0;
          else if (p.sub === FO.ITEM.KEY) o.keyCode = p.keyCode | 0;
        } else if (type === FO.PID.SCENERY) {
          if (p.sub === FO.SCENERY.DOOR) o.openFlags = 0;
        }
      }
      if (tile >= 0 && w.map) w.add(o, tile, elev | 0);
      if (p.sid !== undefined && p.sid !== -1) sc.attach(o, p.sid & 0xFFFFFF, null, null);
      return o;
    };
    sc.createObject = createObject;
    sc.addItem = addItem;
    sc.removeItem = removeItem;

    const destroy = o => {
      if (!isObj(o) || o.dude) return;
      detach(o);
      o.destroyed = true;
      sc.removeTimers(o);
      if (o.script) {
        o.script.dead = true;
        if (w.map && w.map.scriptList) {
          const i = w.map.scriptList.indexOf(o.script);
          if (i >= 0) w.map.scriptList.splice(i, 1);
        }
      }
      for (const e of invOf(o)) if (e.obj.script) e.obj.script.dead = true;
    };
    sc.destroyObject = destroy;

    const kill = (o, anim) => {
      if (!isCritter(o) || w.isDead(o)) return;
      o.critter.hp = Math.min(0, o.critter.hp | 0);
      o.critter.results |= FO.DAM.DEAD;
      w.anim.cancel(o);
      const code = anim >= 48 && anim <= 63 ? anim : FO.ANIM.FALL_BACK_SF;
      o.fid = FO.fid(FO.ART.CRITTER, FO.fidIndex(o.fid), code, 0);
      o.frame = 0;
      o.x = 0;
      o.y = 0;
      o.flags |= FO.FLAG.NO_BLOCK | FO.FLAG.FLAT;
      w.baseLight[o.elev] = null;
      if (o.script) sc.exec(o.script, FO.ACT.DESTROY, { source: null });
      if (host().killed) host().killed(o);
    };
    sc.kill = kill;

    const statOf = (o, n) => FO.statValue(o, n);
    const maxHp = o => Math.max(1, statOf(o, FO.STAT.MAX_HP));

    reg('give_exp_points', p => {
      const n = p.popInt();
      if (host().giveExp) host().giveExp(n);
      else w.dude.exp = (w.dude.exp | 0) + n;
    });
    reg('scr_return', (p, c) => { c.script.ret = p.popInt(); });
    reg('play_sfx', p => {
      const s = p.popStr();
      if (w.g.audio) w.g.audio.sfx(s);
    });
    reg('obj_name', p => p.pushStr(nameOf(p.popObj())));
    reg('sfx_build_open_name', p => {
      const action = p.popInt();
      const o = p.popObj();
      p.pushStr(isObj(o) ? FO.sfxOpen(w.g, o, action) : '');
    });
    reg('get_pc_stat', p => {
      const n = p.popInt();
      const d = w.dude;
      const v = n === FO.PC_STAT.LEVEL ? (d.level || 1) : n === FO.PC_STAT.EXP ? (d.exp | 0) : n === FO.PC_STAT.SKILL_POINTS ? (d.skillPoints | 0)
        : n === FO.PC_STAT.REPUTATION ? (d.reputation | 0) : n === FO.PC_STAT.KARMA ? (d.karma | 0) : 0;
      p.pushInt(v);
    });
    reg('tile_contains_pid_obj', p => {
      const pid = p.popInt();
      const elev = p.popInt();
      const tile = p.popInt();
      p.pushObj(w.map ? w.at(tile, elev).find(o => o.pid === pid) || null : null);
    });
    reg('tile_contains_obj_pid', p => {
      const pid = p.popInt();
      const elev = p.popInt();
      const tile = p.popInt();
      p.pushInt(w.map && w.at(tile, elev).some(o => o.pid === pid) ? 1 : 0);
    });
    reg('set_map_start', p => {
      const rot = p.popInt();
      const elev = p.popInt();
      const y = p.popInt();
      const x = p.popInt();
      if (w.map) Object.assign(w.map.header, { tile: y * 200 + x, elev, rot });
    });
    reg('override_map_start', p => {
      const rot = p.popInt();
      const elev = p.popInt();
      const y = p.popInt();
      const x = p.popInt();
      const tile = y * 200 + x;
      if (w.map) {
        w.moveTo(w.dude, tile, elev);
        w.dude.rot = rot % 6;
        if (host().centerOn) host().centerOn(tile);
      }
    });
    reg('has_skill', p => {
      const s = p.popInt();
      p.pushInt(FO.skillValue(p.popObj(), s));
    });
    reg('using_skill', p => {
      const s = p.popInt();
      const o = p.popObj();
      p.pushInt(o && o.dude && s === FO.SKILL.SNEAK && FO.isSneaking(w.dude) ? 1 : 0);
    });
    reg('roll_vs_skill', p => {
      const mod = p.popInt();
      const s = p.popInt();
      const o = p.popObj();
      const [r, m] = FO.rollVs(FO.skillValue(o, s) + mod, o ? statOf(o, FO.STAT.CRIT_CHANCE) : 0, sc.rand);
      sc.howMuch = m;
      p.pushInt(r);
    });
    reg('skill_contest', p => {
      const s = p.popInt();
      const b = p.popObj();
      const a = p.popObj();
      p.pushInt(FO.skillValue(a, s) >= FO.skillValue(b, s) ? 1 : 0);
    });
    reg('do_check', p => {
      const mod = p.popInt();
      const stat = p.popInt();
      const o = p.popObj();
      const value = statOf(o, stat) + mod;
      const chance = sc.rand(1, 10);
      sc.howMuch = value - chance;
      p.pushInt(chance <= value ? FO.ROLL.SUCCESS : FO.ROLL.FAIL);
    });
    reg('is_success', p => {
      const r = p.popInt();
      p.pushInt(r === FO.ROLL.SUCCESS || r === FO.ROLL.CRIT_SUCCESS ? 1 : 0);
    });
    reg('is_critical', p => {
      const r = p.popInt();
      p.pushInt(r === FO.ROLL.CRIT_FAIL || r === FO.ROLL.CRIT_SUCCESS ? 1 : 0);
    });
    reg('how_much', p => {
      p.popInt();
      p.pushInt(sc.howMuch | 0);
    });
    reg('mark_area_known', p => {
      p.popInt();
      p.popInt();
      p.popInt();
    });
    reg('reaction_influence', p => {
      p.popInt();
      p.popInt();
      p.popInt();
      p.pushInt(0);
    });
    reg('random', p => {
      const b = p.popInt();
      const a = p.popInt();
      p.pushInt(sc.rand(Math.min(a, b), Math.max(a, b)));
    });
    reg('roll_dice', p => {
      const sides = p.popInt();
      const n = p.popInt();
      let s = 0;
      for (let i = 0; i < n; i++) s += sc.rand(1, Math.max(1, sides));
      p.pushInt(s);
    });
    reg('move_to', p => {
      const elev = p.popInt();
      const tile = p.popInt();
      const o = p.popObj();
      if (!isObj(o) || !w.map || tile < 0) {
        p.pushInt(-1);
        return;
      }
      w.anim.cancel(o);
      w.moveTo(o, tile, elev);
      if (o.dude && host().centerOn) host().centerOn(tile);
      p.pushInt(0);
    });
    reg('create_object_sid', p => {
      const sid = p.popInt();
      const elev = p.popInt();
      const tile = p.popInt();
      const pid = p.popInt();
      const o = createObject(pid, tile, elev);
      if (o && sid > 0) {
        if (o.script) {
          o.script.dead = true;
          o.script = null;
        }
        const s = sc.attach(o, sid - 1, null, null);
        if (s) sc.load(s);
      } else if (o && o.script) sc.load(o.script);
      p.pushObj(o);
    });
    reg('display_msg', (p, c) => {
      const s = FO.speakerText(p.popStr(), FO.isFemale(c.self));
      if (host().say) host().say(s);
    });
    reg('script_overrides', (p, c) => { c.script.overrides = true; });
    reg('obj_is_carrying_obj_pid', p => {
      const pid = p.popInt();
      p.pushInt(countPid(p.popObj(), pid));
    });
    reg('self_obj', (p, c) => p.pushObj(c.self));
    reg('source_obj', (p, c) => p.pushObj(c.source));
    reg('target_obj', (p, c) => p.pushObj(c.target));
    reg('dude_obj', p => p.pushObj(w.dude));
    reg('obj_being_used_with', (p, c) => p.pushObj(c.usedWith));
    reg('local_var', (p, c) => {
      const n = p.popInt();
      const v = c.script.lvars[n];
      p.pushAny(v === undefined ? 0 : v);
    });
    reg('set_local_var', (p, c) => {
      const v = p.popAny();
      const n = p.popInt();
      if (n >= 0) c.script.lvars[n] = v;
    });
    reg('map_var', p => {
      const n = p.popInt();
      const v = w.map ? w.map.gvars[n] : 0;
      p.pushAny(v === undefined ? 0 : v);
    });
    reg('set_map_var', p => {
      const v = p.popAny();
      const n = p.popInt();
      if (w.map && n >= 0) w.map.gvars[n] = v;
    });
    reg('global_var', p => {
      const n = p.popInt();
      const v = sc.gvars[n];
      p.pushAny(v === undefined ? 0 : v);
    });
    reg('set_global_var', p => {
      const v = p.popAny();
      const n = p.popInt();
      if (n >= 0) {
        sc.gvars[n] = v;
        if (host().globalChanged) host().globalChanged(n, v);
      }
    });
    reg('script_action', (p, c) => p.pushInt(c.action));
    reg('obj_type', p => {
      const o = p.popObj();
      p.pushInt(isObj(o) ? FO.pidType(o.pid) : -1);
    });
    reg('obj_item_subtype', p => {
      const o = p.popObj();
      p.pushInt(isObj(o) && FO.pidType(o.pid) === FO.PID.ITEM && o.proto ? o.proto.sub : -1);
    });
    reg('get_critter_stat', p => {
      const n = p.popInt();
      p.pushInt(statOf(p.popObj(), n));
    });
    reg('set_critter_stat', p => {
      const v = p.popInt();
      const n = p.popInt();
      const o = p.popObj();
      if (!o || !o.dude) {
        p.pushInt(-1);
        return;
      }
      FO.setBaseStat(o, n, FO.baseWithTraits(o, n) + v);
      p.pushInt(0);
    });
    reg('critter_mod_skill', p => {
      const v = p.popInt();
      const s = p.popInt();
      const o = p.popObj();
      if (isCritter(o) && o.dude && v > 0) {
        o.skillPoints = (o.skillPoints | 0) + v;
        for (let i = 0; i < v; i++) FO.skillIncPoint(o, s);
      }
      p.pushInt(0);
    });
    reg('animate_stand_obj', p => {
      const o = p.popObj();
      if (!isObj(o)) return;
      w.anim.cancel(o);
      if (isCritter(o) && !w.isDead(o)) w.anim.run([{ kind: 'anim', obj: o, code: FO.ANIM.STAND }]);
    });
    reg('animate_stand_reverse_obj', p => {
      const o = p.popObj();
      if (!isObj(o)) return;
      w.anim.cancel(o);
      if (isCritter(o) && !w.isDead(o)) w.anim.run([{ kind: 'anim', obj: o, code: FO.ANIM.STAND, reverse: true }]);
    });
    reg('animate_move_obj_to_tile', p => {
      const speed = p.popInt();
      const tile = p.popInt();
      const o = p.popObj();
      if (!isObj(o) || tile < 0 || w.isDead(o)) return;
      w.anim.cancel(o);
      w.anim.run([{ kind: 'move', obj: o, tile, run: (speed & 1) === 1 }]);
    });
    reg('tile_in_tile_rect', p => {
      const t = p.popInt();
      const br = p.popInt();
      const bl = p.popInt();
      const tr = p.popInt();
      const tl = p.popInt();
      const x = FO.hexX(t);
      const y = FO.hexY(t);
      const xs = [tl, tr, bl, br].map(FO.hexX);
      const ys = [tl, tr, bl, br].map(FO.hexY);
      p.pushInt(x >= Math.min(...xs) && x <= Math.max(...xs) && y >= Math.min(...ys) && y <= Math.max(...ys) ? 1 : 0);
    });
    reg('attack_complex', (p, c) => {
      const args = [];
      for (let i = 0; i < 7; i++) args.push(p.popInt());
      const target = p.popObj();
      if (isObj(target) && host().attack) host().attack(c.self, target, args.reverse());
    });
    reg('attack_setup', p => {
      const target = p.popObj();
      const attacker = p.popObj();
      if (isObj(attacker) && isObj(target) && host().attack) host().attack(attacker, target, []);
    });
    reg('make_daytime', () => {
      sc.time = sc.time - (sc.time % (864000)) + 120 * 3600 / 10;
    });
    reg('tile_distance', p => {
      const b = p.popInt();
      const a = p.popInt();
      p.pushInt(a < 0 || b < 0 ? 9999 : FO.hexDist(a, b));
    });
    reg('tile_distance_objs', p => {
      const b = p.popObj();
      const a = p.popObj();
      p.pushInt(!isObj(a) || !isObj(b) || a.tile < 0 || b.tile < 0 ? 9999 : FO.hexDist(a.tile, b.tile));
    });
    reg('tile_num', p => {
      const o = p.popObj();
      p.pushInt(isObj(o) ? (o.owner ? o.owner.tile : o.tile) : -1);
    });
    reg('tile_num_in_direction', p => {
      const n = p.popInt();
      const dir = p.popInt();
      const tile = p.popInt();
      const t = tile >= 0 ? FO.hexStep(tile, ((dir % 6) + 6) % 6, Math.max(0, n)) : -1;
      p.pushInt(t < 0 ? tile : t);
    });
    reg('pickup_obj', (p, c) => {
      const o = p.popObj();
      if (isObj(o) && isObj(c.self)) addItem(c.self, o, 1);
    });
    reg('drop_obj', (p, c) => {
      const o = p.popObj();
      if (isObj(o) && isObj(c.self) && o.owner === c.self) {
        removeItem(c.self, o);
        w.add(o, c.self.tile, c.self.elev);
      }
    });
    reg('add_obj_to_inven', p => {
      const item = p.popObj();
      const who = p.popObj();
      addItem(who, item, 1);
    });
    reg('rm_obj_from_inven', p => {
      const item = p.popObj();
      const who = p.popObj();
      if (isObj(who) && isObj(item)) removeItem(who, item, 1);
    });
    reg('add_mult_objs_to_inven', p => {
      const n = p.popInt();
      const item = p.popObj();
      const who = p.popObj();
      addItem(who, item, Math.max(1, n));
    });
    reg('rm_mult_objs_from_inven', p => {
      const n = p.popInt();
      const item = p.popObj();
      const who = p.popObj();
      p.pushInt(isObj(who) && isObj(item) ? removeItem(who, item, n) : 0);
    });
    reg('wield_obj_critter', p => {
      const item = p.popObj();
      const who = p.popObj();
      if (!isCritter(who) || !isObj(item)) return;
      if (item.owner !== who) addItem(who, item, 1);
      if (item.proto && item.proto.sub === FO.ITEM.ARMOR) {
        const was = FO.armorOf(who);
        for (const e of who.inventory) e.obj.flags &= ~FO.FLAG.WORN;
        item.flags |= FO.FLAG.WORN;
        if (was !== item) FO.adjustArmor(who, was, item);
      } else {
        for (const e of who.inventory) e.obj.flags &= ~FO.FLAG.RIGHT_HAND;
        item.flags |= FO.FLAG.RIGHT_HAND;
      }
      refreshFid(who);
    });
    reg('inven_unwield', (p, c) => {
      const who = c.self;
      if (!isCritter(who)) return;
      for (const e of who.inventory) e.obj.flags &= ~FO.FLAG.RIGHT_HAND;
      refreshFid(who);
    });
    reg('use_obj', (p, c) => {
      const o = p.popObj();
      if (isObj(o) && host().useObject) host().useObject(c.self, o);
    });
    reg('use_obj_on_obj', (p, c) => {
      const target = p.popObj();
      const item = p.popObj();
      if (isObj(target) && target.script) sc.exec(target.script, FO.ACT.USE_OBJ_ON, { source: c.self, usedWith: item });
    });
    reg('obj_can_see_obj', p => {
      const b = p.popObj();
      const a = p.popObj();
      p.pushInt(isObj(a) && isObj(b) && FO.canSee(w, a, b) ? 1 : 0);
    });
    reg('obj_can_hear_obj', p => {
      const b = p.popObj();
      const a = p.popObj();
      p.pushInt(isObj(a) && isObj(b) && FO.canHear(w, a, b) ? 1 : 0);
    });
    reg('start_gdialog', (p, c) => {
      const bg = p.popInt();
      const head = p.popInt();
      const mood = p.popInt();
      const o = p.popObj();
      const list = p.popInt();
      if (bg !== -1) sc.g.dialogBg = bg;
      const back = sc.g.dialogBg === undefined ? FO.DIALOG_BG : sc.g.dialogBg;
      sc.dialog = { npc: o || c.self, script: c.script, list, mood, head, bg: back, node: { reply: '', options: [], message: false }, waiting: null, barter: 0 };
      if (host().dialogStart) host().dialogStart(sc.dialog);
    });
    const node = () => {
      if (!sc.dialog) sc.dialog = { npc: null, script: null, list: 0, mood: 0, head: -1, bg: -1, node: { reply: '', options: [], message: false }, waiting: null, barter: 0 };
      return sc.dialog.node;
    };
    const text = (p, raw, type, list) => {
      if (typeof raw === 'string') return raw;
      return sc.message(list, raw | 0);
    };
    reg('gsay_start', () => {
      const d = node();
      d.reply = '';
      d.options = [];
      d.message = false;
    });
    reg('gsay_reply', p => {
      const msg = p.popAny();
      const list = p.popInt();
      node().reply = text(p, msg, 0, list);
      node().audio = sc.messageAudio(list, msg);
    });
    reg('gsay_option', p => {
      const reaction = p.popInt();
      const proc = p.popAny();
      const msg = p.popAny();
      const list = p.popInt();
      node().options.push({ text: text(p, msg, 0, list), proc, reaction });
    });
    reg('giq_option', p => {
      const reaction = p.popInt();
      const proc = p.popAny();
      const msg = p.popAny();
      const list = p.popInt();
      const iq = p.popInt();
      const intel = statOf(w.dude, FO.STAT.IN);
      if (iq > 0 && intel < iq) return;
      if (iq < 0 && intel > -iq) return;
      node().options.push({ text: text(p, msg, 0, list), proc, reaction, iq });
    });
    reg('gsay_message', p => {
      const reaction = p.popInt();
      const msg = p.popAny();
      const list = p.popInt();
      const d = node();
      d.reply = text(p, msg, 0, list);
      d.audio = sc.messageAudio(list, msg);
      d.message = true;
      d.reaction = reaction;
    });
    reg('gsay_end', (p, c) => {
      const d = sc.dialog;
      if (!d || (!d.node.reply && !d.node.options.length)) return null;
      d.waiting = c.script;
      if (host().dialogShow) host().dialogShow(d);
      return FO.SUSPEND;
    });
    reg('end_dialogue', () => {
      const d = sc.dialog;
      sc.dialog = null;
      if (host().dialogEnd) host().dialogEnd(d);
    });
    reg('dialogue_reaction', p => {
      const r = p.popInt();
      if (sc.dialog) sc.dialog.reaction = r;
    });
    reg('say_start', (p, c) => {
      if (!sc.dialog) sc.dialog = { npc: c.self, script: c.script, list: 0, mood: 0, head: -1, bg: -1, node: { reply: '', options: [], message: false }, waiting: null, barter: 0, old: true };
      sc.dialog.node = { reply: '', options: [], message: false };
    });
    reg('say_reply', p => {
      const t = p.popStr();
      p.popAny();
      node().reply = t;
    });
    reg('say_option', p => {
      const proc = p.popAny();
      const t = p.popStr();
      node().options.push({ text: t, proc, reaction: 0 });
    });
    reg('say_message', p => {
      const t = p.popStr();
      p.popAny();
      const d = node();
      d.reply = t;
      d.message = true;
    });
    reg('say_end', (p, c) => {
      const d = sc.dialog;
      if (!d || (!d.node.reply && !d.node.options.length)) return null;
      d.waiting = c.script;
      if (host().dialogShow) host().dialogShow(d);
      return FO.SUSPEND;
    });
    reg('gdialog_barter', p => {
      const mod = p.popInt();
      if (sc.dialog) sc.dialog.barterRequest = mod;
      if (host().barter) host().barter(mod);
    });
    reg('gdialog_set_barter_mod', p => {
      const mod = p.popInt();
      if (sc.dialog) sc.dialog.barter = mod;
    });
    reg('barter_offer', p => {
      p.popInt();
      p.popInt();
      p.popInt();
    });
    reg('barter_ask', p => {
      p.popInt();
      p.popInt();
      p.popInt();
    });
    reg('dialogue_system_enter', (p, c) => {
      if (c.self) sc.request('talk', { obj: c.self });
    });
    reg('set_obj_visibility', p => {
      const hide = p.popInt();
      const o = p.popObj();
      if (!isObj(o)) return;
      if (hide) o.flags |= FO.FLAG.HIDDEN;
      else o.flags &= ~FO.FLAG.HIDDEN;
      if (o.lightRadius > 0) w.baseLight[o.elev] = null;
    });
    reg('load_map', p => {
      const entrance = p.popInt();
      const map = p.popAny();
      sc.request('loadMap', { map, entrance });
    });
    reg('anim_busy', p => p.pushInt(w.anim.busy(p.popObj()) ? 1 : 0));
    reg('critter_heal', p => {
      const n = p.popInt();
      const o = p.popObj();
      if (isCritter(o)) o.critter.hp = Math.min(maxHp(o), (o.critter.hp | 0) + n);
      p.pushInt(0);
    });
    reg('set_light_level', p => {
      const level = Math.max(0, Math.min(100, p.popInt()));
      const v = level <= 50 ? 0x4000 + (0xA000 - 0x4000) * level / 50 : 0xA000 + (0x10000 - 0xA000) * (level - 50) / 50;
      w.setAmbient(Math.round(v));
    });
    reg('game_time', p => p.pushInt(sc.time));
    reg('game_time_in_seconds', p => p.pushInt(Math.floor(sc.time / FO.TICKS_PER_SEC)));
    reg('elevation', p => {
      const o = p.popObj();
      p.pushInt(isObj(o) ? o.elev : 0);
    });
    reg('kill_critter', p => {
      const anim = p.popInt();
      kill(p.popObj(), anim);
    });
    reg('kill_critter_type', p => {
      const anim = p.popInt();
      const pid = p.popInt();
      if (!w.map) return;
      for (let e = 0; e < 3; e++) for (const o of w.map.byElev[e].slice()) if (o.pid === pid) kill(o, anim);
    });
    reg('critter_damage', p => {
      p.popInt();
      const n = p.popInt();
      const o = p.popObj();
      if (!isCritter(o) || w.isDead(o)) return;
      if (host().damage) host().damage(o, n);
      else {
        o.critter.hp -= n;
        if (o.critter.hp <= 0) kill(o, FO.ANIM.FALL_BACK_SF);
      }
    });
    reg('critter_injure', p => {
      const how = p.popInt();
      const o = p.popObj();
      if (isCritter(o)) o.critter.results |= how & 0x7F;
    });
    reg('add_timer_event', p => {
      const fixed = p.popInt();
      const time = p.popInt();
      const o = p.popObj();
      if (isObj(o)) sc.addTimer(o, time, fixed);
    });
    reg('rm_timer_event', p => {
      const o = p.popObj();
      if (isObj(o)) sc.removeTimers(o, true);
    });
    reg('game_ticks', p => p.pushInt(p.popInt() * FO.TICKS_PER_SEC));
    reg('has_trait', p => {
      const trait = p.popInt();
      const o = p.popObj();
      const type = p.popInt();
      let v = 0;
      if (isObj(o)) {
        if (type === 0) v = trait >= 0 && trait < FO.PERK_COUNT ? FO.perkRank(w.dude, trait) : 0;
        else if (type === 1) v = trait === FO.OBJ_TRAIT.ROT ? o.rot : 0;
        else if (type === 2) v = trait >= 0 && trait < FO.TRAIT_COUNT && FO.hasTrait(w.dude, trait) ? 1 : 0;
      }
      p.pushInt(v);
    });
    reg('critter_add_trait', p => {
      const amount = p.popInt();
      const trait = p.popInt();
      const type = p.popInt();
      const o = p.popObj();
      if (!isCritter(o)) return;
      if (type === 0) FO.perkAdd(w.dude, trait);
      else if (type === 1 && trait === FO.OBJ_TRAIT.AI) o.critter.ai = amount;
      else if (type === 1 && trait === FO.OBJ_TRAIT.TEAM && amount !== o.critter.team) {
        o.critter.team = amount;
        const who = FO.whoHitMe(o);
        if (who && who.critter && who.critter.team === amount) FO.setWhoHitMe(o, null);
      }
    });
    reg('critter_rm_trait', p => {
      p.popInt();
      p.popInt();
      p.popInt();
      p.popObj();
    });
    reg('destroy_object', p => destroy(p.popObj()));
    reg('destroy_mult_objs', p => {
      const n = p.popInt();
      const o = p.popObj();
      if (!isObj(o)) {
        p.pushInt(0);
        return;
      }
      let removed = 0;
      if (o.owner) {
        removed = removeItem(o.owner, o, n);
        if (!o.owner) o.destroyed = true;
      } else {
        destroy(o);
        removed = 1;
      }
      p.pushInt(removed);
    });
    reg('game_time_hour', p => p.pushInt(sc.hour()));
    reg('fixed_param', (p, c) => p.pushInt(c.fixed));
    reg('tile_is_visible', p => {
      const t = p.popInt();
      p.pushInt(host().tileVisible ? (host().tileVisible(t) ? 1 : 0) : 1);
    });
    reg('action_being_used', (p, c) => p.pushInt(c.skill));
    reg('critter_state', p => {
      const o = p.popObj();
      if (!isCritter(o) || w.isDead(o)) {
        p.pushInt(1);
        return;
      }
      let s = 0;
      const anim = FO.fidAnim(o.fid);
      if (anim >= FO.ANIM.FALL_BACK_SF && anim <= FO.ANIM.FALL_BACK_SF + 1) s |= 2;
      s |= (o.critter.results & 0x3C) >> 2 << 2;
      p.pushInt(s);
    });
    reg('game_time_advance', p => {
      const t = p.popInt() >>> 0;
      for (let d = Math.floor(t / FO.WM.DAY); d > 0; d--) sc.advance(FO.WM.DAY);
      sc.advance(t % FO.WM.DAY);
    });
    reg('radiation_inc', p => {
      const n = p.popInt();
      const o = p.popObj();
      if (isCritter(o)) o.critter.rad = (o.critter.rad | 0) + n;
    });
    reg('radiation_dec', p => {
      const n = p.popInt();
      const o = p.popObj();
      if (isCritter(o)) o.critter.rad = Math.max(0, (o.critter.rad | 0) - n);
    });
    reg('poison', p => {
      const n = p.popInt();
      const o = p.popObj();
      if (isCritter(o)) o.critter.poison = Math.max(0, (o.critter.poison | 0) + n);
    });
    reg('get_poison', p => {
      const o = p.popObj();
      p.pushInt(isCritter(o) ? o.critter.poison | 0 : 0);
    });
    reg('critter_attempt_placement', p => {
      const elev = p.popInt();
      const tile = p.popInt();
      const o = p.popObj();
      if (!isObj(o) || !w.map || tile < 0) {
        p.pushInt(-1);
        return;
      }
      let dest = tile;
      if (w.blocker(tile, elev, o)) {
        for (let r = 1; r <= 5 && dest === tile; r++) {
          FO.hexRing(tile, r, t => {
            if (dest === tile && !w.blocker(t, elev, o)) dest = t;
          });
        }
      }
      w.moveTo(o, dest, elev);
      p.pushInt(0);
    });
    reg('obj_pid', p => {
      const o = p.popObj();
      p.pushInt(isObj(o) ? o.pid : -1);
    });
    reg('cur_map_index', p => p.pushInt(w.map ? w.map.index : -1));
    reg('proto_data', p => {
      const field = p.popInt();
      const pid = p.popInt();
      const pr = sc.g.protos.get(pid);
      p.pushInt(pr ? FO.protoField(pr, field) : 0);
    });
    reg('message_str', p => {
      const num = p.popInt();
      const list = p.popInt();
      p.pushStr(sc.message(list, num));
    });
    reg('critter_inven_obj', p => {
      const where = p.popInt();
      const o = p.popObj();
      if (!isObj(o)) {
        p.pushInt(0);
        return;
      }
      if (where === FO.INVEN.COUNT) {
        p.pushInt(o.inventory.length);
        return;
      }
      const flag = where === FO.INVEN.WORN ? FO.FLAG.WORN : where === FO.INVEN.RIGHT ? FO.FLAG.RIGHT_HAND : where === FO.INVEN.LEFT ? FO.FLAG.LEFT_HAND : 0;
      const e = flag ? o.inventory.find(x => x.obj.flags & flag) : null;
      p.pushObj(e ? e.obj : null);
    });
    reg('obj_set_light_level', p => {
      const dist = p.popInt();
      const intensity = p.popInt();
      const o = p.popObj();
      if (!isObj(o)) return;
      o.lightRadius = Math.max(0, Math.min(8, dist));
      o.lightIntensity = Math.round(Math.max(0, Math.min(100, intensity)) * FO.LIGHT_FULL / 100);
      if (o.elev !== undefined && !o.dude) w.baseLight[o.elev] = null;
    });
    reg('world_map', () => sc.request('worldMap'));
    reg('town_map', () => sc.request('townMap'));
    reg('float_msg', p => {
      const color = p.popInt();
      const s = p.popStr();
      const o = p.popObj();
      if (isObj(o) && host().floatMsg) host().floatMsg(o, s, color);
    });
    reg('metarule', p => {
      const val = p.popAny();
      const id = p.popInt();
      let r = 0;
      if (id === FO.METARULE.FIRST_RUN) r = w.map && w.map.firstRun !== false ? 1 : 0;
      else if (id === FO.METARULE.PARTY_COUNT) r = 1 + (w.party || []).filter(o => !(o.flags & FO.FLAG.HIDDEN)).length;
      else if (id === FO.METARULE.IS_LOADGAME) r = sc.loading ? 1 : 0;
      else if (id === FO.METARULE.END_GAME) sc.request('endGame');
      else if (id === FO.METARULE.ELEVATOR) sc.request('elevator', { type: val | 0 });
      p.pushInt(r);
    });
    reg('anim', p => {
      const dir = p.popInt();
      const anim = p.popInt();
      const o = p.popObj();
      if (!isObj(o)) return;
      if (anim === 1000) {
        if (dir >= 0 && dir < 6) o.rot = dir;
      } else if (anim === 1010) {
        o.frame = dir;
      } else if (anim >= 0 && anim < 65) {
        if (dir >= 0 && dir < 6) o.rot = dir;
        w.anim.run([{ kind: 'anim', obj: o, code: anim, hold: anim >= 20 && anim <= 35 }]);
      }
    });
    reg('obj_carrying_pid_obj', p => {
      const pid = p.popInt();
      const o = p.popObj();
      const e = invOf(o).find(x => x.obj.pid === pid);
      p.pushObj(e ? e.obj : null);
    });
    const animDelay = d => Math.max(0, d | 0) * 100;
    reg('reg_anim_func', p => {
      const arg = p.popAny();
      const type = p.popInt();
      if (type === 1) w.anim.begin();
      else if (type === 2) {
        if (isObj(arg)) w.anim.cancel(arg);
      } else if (type === 3) w.anim.end();
    });
    const regStep = step => {
      if (!step.obj || !isObj(step.obj) || step.obj.destroyed) return;
      w.anim.push(step);
    };
    reg('reg_anim_animate', p => {
      const delay = p.popInt();
      const anim = p.popInt();
      const o = p.popObj();
      if (delay > 0) regStep({ kind: 'wait', obj: o, ms: animDelay(delay) });
      regStep({ kind: 'anim', obj: o, code: anim, hold: anim >= 20 && anim <= 35 });
    });
    reg('reg_anim_animate_reverse', p => {
      const delay = p.popInt();
      const anim = p.popInt();
      const o = p.popObj();
      if (delay > 0) regStep({ kind: 'wait', obj: o, ms: animDelay(delay) });
      regStep({ kind: 'anim', obj: o, code: anim, reverse: true });
    });
    reg('reg_anim_animate_forever', p => {
      const anim = p.popInt();
      const o = p.popObj();
      regStep({ kind: 'anim', obj: o, code: anim, forever: true, hold: true });
    });
    reg('reg_anim_obj_move_to_obj', p => {
      const delay = p.popInt();
      const t = p.popObj();
      const o = p.popObj();
      if (!isObj(t)) return;
      if (delay > 0) regStep({ kind: 'wait', obj: o, ms: animDelay(delay) });
      regStep({ kind: 'move', obj: o, tile: t.owner ? t.owner.tile : t.tile, near: 1 });
    });
    reg('reg_anim_obj_run_to_obj', p => {
      const delay = p.popInt();
      const t = p.popObj();
      const o = p.popObj();
      if (!isObj(t)) return;
      if (delay > 0) regStep({ kind: 'wait', obj: o, ms: animDelay(delay) });
      regStep({ kind: 'move', obj: o, tile: t.owner ? t.owner.tile : t.tile, near: 1, run: true });
    });
    reg('reg_anim_obj_move_to_tile', p => {
      const delay = p.popInt();
      const tile = p.popInt();
      const o = p.popObj();
      if (delay > 0) regStep({ kind: 'wait', obj: o, ms: animDelay(delay) });
      regStep({ kind: 'move', obj: o, tile });
    });
    reg('reg_anim_obj_run_to_tile', p => {
      const delay = p.popInt();
      const tile = p.popInt();
      const o = p.popObj();
      if (delay > 0) regStep({ kind: 'wait', obj: o, ms: animDelay(delay) });
      regStep({ kind: 'move', obj: o, tile, run: true });
    });
    reg('reg_anim_play_sfx', p => {
      const delay = p.popInt();
      const sfx = p.popStr();
      const o = p.popObj();
      if (delay > 0) regStep({ kind: 'wait', obj: o, ms: animDelay(delay) });
      regStep({ kind: 'sfx', obj: o, sound: sfx });
    });
    reg('play_gmovie', (p, c) => {
      sc.request('movie', { movie: p.popInt(), script: c.script });
      return FO.SUSPEND;
    });
    reg('get_month', p => p.pushInt(FO.calendar(sc.time).month));
    reg('get_day', p => p.pushInt(FO.calendar(sc.time).day));
    reg('explosion', p => {
      const dmg = p.popInt();
      const elev = p.popInt();
      const tile = p.popInt();
      sc.request('explosion', { tile, elev, dmg });
    });
    reg('days_since_visited', p => {
      const last = w.map && w.map.lastVisit !== undefined ? w.map.lastVisit : sc.time;
      p.pushInt(Math.floor((sc.time - last) / (FO.TICKS_PER_SEC * 86400)));
    });
    reg('party_add', p => {
      const o = p.popObj();
      w.party = w.party || [];
      if (isObj(o) && !w.party.includes(o)) w.party.push(o);
    });
    reg('party_remove', p => {
      const o = p.popObj();
      if (w.party) w.party = w.party.filter(x => x !== o);
    });
    reg('party_member_obj', p => {
      const pid = p.popInt();
      p.pushObj((w.party || []).find(o => o.pid === pid) || null);
    });
    reg('combat_is_initialized', p => p.pushInt(w.inCombat ? 1 : 0));
    reg('difficulty_level', p => p.pushInt(sc.g.prefs && sc.g.prefs.gameDifficulty !== undefined ? sc.g.prefs.gameDifficulty : 1));
    reg('combat_difficulty', p => p.pushInt(sc.g.prefs && sc.g.prefs.combatDifficulty !== undefined ? sc.g.prefs.combatDifficulty : 1));
    reg('running_burning_guy', p => p.pushInt(1));
    reg('obj_is_locked', p => {
      const o = p.popObj();
      p.pushInt(isObj(o) && w.locked(o) ? 1 : 0);
    });
    const setLock = (o, on) => {
      if (!isObj(o)) return;
      if (w.isDoor(o)) o.openFlags = on ? (o.openFlags | 0) | FO.LOCKED : (o.openFlags | 0) & ~FO.LOCKED;
      else o.dataFlags = on ? (o.dataFlags | 0) | FO.LOCKED : (o.dataFlags | 0) & ~FO.LOCKED;
    };
    reg('obj_lock', p => setLock(p.popObj(), true));
    reg('obj_unlock', p => setLock(p.popObj(), false));
    reg('jam_lock', p => {
      const o = p.popObj();
      if (!isObj(o)) return;
      if (w.isDoor(o)) o.openFlags = (o.openFlags | 0) | FO.JAMMED;
      else o.dataFlags = (o.dataFlags | 0) | FO.JAMMED;
    });
    reg('obj_is_open', p => {
      const o = p.popObj();
      p.pushInt(isObj(o) && (w.isDoor(o) ? w.doorOpen(o) : o.frame !== 0) ? 1 : 0);
    });
    const toggleOpen = o => {
      const opening = o.frame === 0;
      const sound = FO.sfxOpen(w.g, o, opening ? FO.SFX_OPEN.OPEN : FO.SFX_OPEN.CLOSE);
      if (w.isDoor(o)) w.setDoor(o, opening, null, sound);
      else w.anim.run([{ kind: 'sfx', obj: o, sound }, { kind: 'anim', obj: o, hold: true, noOffset: true, reverse: !opening, delay: 0 }]);
    };
    const openable = o => isObj(o) && !w.locked(o) && (w.isDoor(o) || w.itemType(o) === FO.ITEM.CONTAINER);
    reg('obj_open', p => {
      const o = p.popObj();
      if (openable(o) && o.frame === 0) toggleOpen(o);
    });
    reg('obj_close', p => {
      const o = p.popObj();
      if (openable(o) && o.frame !== 0) toggleOpen(o);
    });
    reg('game_ui_disable', () => { sc.uiDisabled = true; });
    reg('game_ui_enable', () => { sc.uiDisabled = false; });
    reg('game_ui_is_disabled', p => p.pushInt(sc.uiDisabled ? 1 : 0));
    reg('gfade_out', (p, c) => {
      if (!p.popInt()) return null;
      sc.request('fade', { out: true, script: c.script });
      return FO.SUSPEND;
    });
    reg('gfade_in', (p, c) => {
      if (!p.popInt()) return null;
      sc.request('fade', { out: false, script: c.script });
      return FO.SUSPEND;
    });
    reg('item_caps_total', p => p.pushInt(countPid(p.popObj(), FO.CAPS_PID)));
    reg('item_caps_adjust', p => {
      const n = p.popInt();
      const o = p.popObj();
      if (!isObj(o)) {
        p.pushInt(-1);
        return;
      }
      if (n > 0) {
        const have = invOf(o).find(e => e.obj.pid === FO.CAPS_PID);
        if (have) have.count += n;
        else {
          const caps = createObject(FO.CAPS_PID, -1, o.elev);
          if (caps) addItem(o, caps, n);
        }
      } else if (n < 0) {
        let left = -n;
        if (countPid(o, FO.CAPS_PID) < left) {
          p.pushInt(-1);
          return;
        }
        for (const e of invOf(o).filter(x => x.obj.pid === FO.CAPS_PID)) {
          const take = Math.min(left, e.count);
          removeItem(o, e.obj, take);
          left -= take;
          if (!left) break;
        }
      }
      p.pushInt(0);
    });
    reg('anim_action_frame', p => {
      p.popInt();
      p.popObj();
      p.pushInt(0);
    });
    reg('sfx_build_char_name', p => {
      const extra = p.popInt();
      const anim = p.popInt();
      const o = p.popObj();
      p.pushStr((isObj(o) && FO.sfxArt(w.g, o, anim, extra)) || '');
    });
    reg('sfx_build_ambient_name', p => p.pushStr(FO.sfxAmbient(p.popStr())));
    reg('sfx_build_interface_name', p => p.pushStr(FO.sfxItem(p.popStr())));
    reg('sfx_build_item_name', p => p.pushStr(FO.sfxItem(p.popStr())));
    reg('sfx_build_weapon_name', p => {
      const target = p.popObj();
      const hitMode = p.popInt();
      const weapon = p.popObj();
      const effect = p.popInt();
      p.pushStr(FO.sfxWeapon(w.g, effect, isObj(weapon) ? weapon : null, hitMode, isObj(target) ? target : null));
    });
    reg('sfx_build_scenery_name', p => {
      const name = p.popStr();
      const action = p.popInt();
      const type = p.popInt();
      p.pushStr(FO.sfxScenery(type, action, name));
    });
    reg('endgame_slideshow', () => sc.request('endgameSlides'));
    reg('endgame_movie', () => sc.request('endgameMovie'));
    reg('move_obj_inven_to_obj', p => {
      const dst = p.popObj();
      const src = p.popObj();
      if (!isObj(src) || !isObj(dst)) return;
      for (const e of src.inventory.slice()) {
        const n = e.count;
        removeItem(src, e.obj, n);
        addItem(dst, e.obj, n);
      }
    });
    reg('obj_art_fid', p => {
      const o = p.popObj();
      p.pushInt(isObj(o) ? o.fid : 0);
    });
    reg('art_anim', p => p.pushInt(FO.fidAnim(p.popInt())));
    reg('rotation_to_tile', p => {
      const b = p.popInt();
      const a = p.popInt();
      p.pushInt(a < 0 || b < 0 ? 0 : FO.hexDir(a, b));
    });
    reg('obj_on_screen', p => {
      const o = p.popObj();
      p.pushInt(isObj(o) && host().onScreen ? (host().onScreen(o) ? 1 : 0) : 0);
    });
    reg('critter_is_fleeing', p => {
      const o = p.popObj();
      p.pushInt(isCritter(o) && o.fleeing ? 1 : 0);
    });
    reg('critter_set_flee_state', p => {
      const v = p.popInt();
      const o = p.popObj();
      if (isCritter(o)) o.fleeing = !!v;
    });
    reg('terminate_combat', () => sc.request('endCombat'));
    reg('critter_stop_attacking', p => {
      const o = p.popObj();
      if (isCritter(o)) o.hostile = false;
    });
    reg('debug_msg', p => {
      const s = p.popStr();
      sc.debug.push(s);
      if (sc.debug.length > 100) sc.debug.shift();
    });
  };

  FO.protoField = function (pr, field) {
    switch (field) {
      case 0: return pr.pid;
      case 1: return pr.text;
      case 2: return pr.fid;
      case 3: return pr.lightRadius;
      case 4: return pr.lightIntensity;
      case 5: return pr.flags | 0;
      case 6: return pr.flagsExt | 0;
      case 7: return pr.sid | 0;
      default: return 0;
    }
  };

  FO.carriedWeight = function (o) {
    let w = 0;
    for (const e of o.inventory || []) w += (e.obj.proto ? e.obj.proto.weight | 0 : 0) * e.count;
    return w;
  };

  FO.calendar = function (ticks) {
    const days = Math.floor(ticks / (FO.TICKS_PER_SEC * 86400));
    const months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let month = 11;
    let day = 5 + days;
    let year = 2161;
    for (;;) {
      if (day <= months[month]) break;
      day -= months[month];
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    return { year, month: month + 1, day };
  };

  FO.canSee = function (w, a, b) {
    if (a.tile < 0 || b.tile < 0) return false;
    if (!FO.withinPerception(w, a, b)) return false;
    return !FO.shotBlocked(w, a, b);
  };

  FO.canHear = () => false;

  FO.shotBlocked = function (w, a, b) {
    const line = FO.hexLine(a.tile, b.tile);
    for (let i = 1; i < line.length - 1; i++) {
      for (const o of w.at(line[i], a.elev)) {
        if (o === a || o === b || o.flags & FO.FLAG.HIDDEN) continue;
        const t = FO.pidType(o.pid);
        if ((t === FO.PID.WALL || t === FO.PID.SCENERY) && !(o.flags & FO.FLAG.SHOOT_THRU) && w.blocks(o)) return true;
      }
    }
    return false;
  };
})(globalThis.FO = globalThis.FO || {});
