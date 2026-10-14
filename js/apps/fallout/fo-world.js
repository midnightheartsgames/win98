(function (FO) {
  'use strict';

  FO.DAM = {
    KNOCKED_OUT: 0x1, KNOCKED_DOWN: 0x2, CRIP_LEG_LEFT: 0x4, CRIP_LEG_RIGHT: 0x8,
    CRIP_ARM_LEFT: 0x10, CRIP_ARM_RIGHT: 0x20, BLIND: 0x40, DEAD: 0x80
  };
  FO.SCENERY = { DOOR: 0, STAIRS: 1, ELEVATOR: 2, LADDER_BOTTOM: 3, LADDER_TOP: 4, GENERIC: 5 };
  FO.ITEM = { ARMOR: 0, CONTAINER: 1, DRUG: 2, WEAPON: 3, AMMO: 4, MISC: 5, KEY: 6 };
  FO.DOOR_OPEN = 0x1;
  const BODY_BIPED = 0;
  const BODY_ROBOTIC = 2;
  FO.LOCKED = 0x02000000;
  FO.JAMMED = 0x04000000;
  FO.DUDE_PID = 0x01000000;
  FO.DUDE_ID = 18000;
  FO.SCROLL_BLOCKER_PID = 0x0500000C;
  FO.builtTile = (tile, elev) => (tile & 0x3FFFFFF) | ((elev & 7) << 29);
  FO.builtTileTile = b => b & 0x3FFFFFF;
  FO.builtTileElev = b => (b >>> 29) & 7;
  FO.mapSaved = index => FO.EXE.automap.includes(index);

  const EMPTY = [];
  const OPEN_FLAGS = FO.FLAG.NO_BLOCK | FO.FLAG.LIGHT_THRU | FO.FLAG.SHOOT_THRU;
  const WALK_BYTES = 5001;
  const ROW_BYTES = 25;

  class World {
    constructor(game) {
      this.g = game;
      this.data = game.data;
      this.art = game.art;
      this.protos = game.protos;
      this.mapNames = [];
      this.states = new Map();
      this.map = null;
      this.dude = null;
      this.elev = 0;
      this.ambient = FO.LIGHT_FULL;
      this.anim = new FO.Animator(this);
      this.nextId = 0x40000000;
      this.on = {};
      this.baseLight = [null, null, null];
      this.lightBuf = null;
      this.lightKey = '';
      this.walked = new Uint8Array(WALK_BYTES);
      this.movies = new Set();
    }

    markWalked(tile) {
      if (tile >= 0 && tile < FO.HEXES) this.walked[tile >> 3] |= 1 << (tile & 7);
    }

    processSeen() {
      if (!this.map) return;
      const src = this.walked;
      const grow = new Uint8Array(WALK_BYTES);
      for (let i = 0; i < WALK_BYTES; i++) {
        if (!src[i]) continue;
        for (let k = i - 16 * ROW_BYTES; k < i + 16 * ROW_BYTES; k += ROW_BYTES) {
          if (k < 0 || k >= WALK_BYTES) continue;
          grow[k] = 0xFF;
          if (k > 0) grow[k - 1] = 0xFF;
          if (k < WALK_BYTES - 1) grow[k + 1] = 0xFF;
          if (k > 1) grow[k - 2] = 0xFF;
          if (k < WALK_BYTES - 2) grow[k + 2] = 0xFF;
        }
      }
      const elev = this.dude.elev;
      for (let i = 0; i < WALK_BYTES; i++) {
        if (!grow[i]) continue;
        for (let b = 0; b < 8; b++) {
          const tile = i * 8 + b;
          if (tile >= FO.HEXES) break;
          for (const o of this.at(tile, elev)) o.flags |= FO.FLAG.SEEN;
        }
      }
    }

    async init() {
      const msg = FO.readMsg(await this.data.text(FO.textPath('GAME\\MAP.MSG')));
      for (let i = 0; i < 200; i++) {
        const m = msg.get(i);
        if (m && /\.MAP$/i.test(m.text)) this.mapNames[i] = m.text.replace(/\.MAP$/i, '').toUpperCase();
      }
      this.mapMsg = msg;
      this.dude = this.makeDude();
      this.wm = FO.newWorldMap();
    }

    mapIndex(name) {
      return this.mapNames.indexOf(String(name).toUpperCase().replace(/\.MAP$/, ''));
    }

    makeDude() {
      const d = {
        id: FO.DUDE_ID, pid: FO.DUDE_PID, fid: FO.fid(FO.ART.CRITTER, 11, 0, 0), tile: -1, elev: 0, rot: 0, frame: 0,
        flags: 0, x: 0, y: 0, lightRadius: 4, lightIntensity: FO.LIGHT_FULL, outline: 0, sid: -1, scriptIndex: -1,
        inventory: [], proto: null, dude: true, stats: FO.defaultDudeStats(), tags: [-1, -1, -1, -1], traits: [-1, -1], perks: {},
        level: 1, exp: 0, skillPoints: 0, lastLevel: 1, freePerk: false, pcFlags: 0, karma: 0,
        critter: { damageLastTurn: 0, maneuver: 0, ap: 0, results: 0, ai: 0, team: 0, whoHitMe: -1, hp: 0, rad: 0, poison: 0 }
      };
      FO.recalcDerived(d);
      d.critter.hp = FO.statValue(d, FO.STAT.MAX_HP);
      return d;
    }

    newId() {
      return this.nextId++;
    }

    adopt(o, elev, owner) {
      o.elev = elev;
      o.proto = this.protos.get(o.pid);
      o.owner = owner || null;
      if (o.id >= this.nextId) this.nextId = o.id + 1;
      for (const it of o.inventory || []) this.adopt(it.obj, elev, o);
      return o;
    }

    async staticState(name) {
      const m = FO.readMap(await this.data.get('MAPS\\' + name + '.MAP'), this.protos);
      return {
        name, index: m.header.index, header: m.header, gvars: m.gvars, lvars: m.lvars,
        floors: m.floors, roofs: m.roofs, scripts: m.scripts, byElev: [[], [], []], tiles: new Map(), visited: false, objects: m.objects
      };
    }

    async loadState(name) {
      const state = await this.staticState(name);
      const m = { objects: state.objects };
      delete state.objects;
      const prev = this.map;
      this.map = state;
      for (let e = 0; e < 3; e++) {
        for (const o of m.objects[e]) {
          this.adopt(o, e, null);
          state.byElev[e].push(o);
          this.index(o);
        }
      }
      this.map = prev;
      return state;
    }

    detach(o) {
      this.unindex(o);
      const list = this.map.byElev[o.elev];
      const i = list ? list.indexOf(o) : -1;
      if (i >= 0) list.splice(i, 1);
      if (!o.dude && o.lightRadius > 0) this.baseLight[o.elev] = null;
    }

    leave(time, party) {
      const st = this.map;
      if (!st) return [];
      this.anim.seqs = [];
      if (this.dude.tile >= 0) {
        this.processSeen();
        this.remove(this.dude);
      }
      const carried = (party || []).filter(o => o.tile >= 0 && st.byElev[o.elev] && st.byElev[o.elev].includes(o));
      for (const o of carried) this.detach(o);
      st.savedAt = time;
      if (FO.mapSaved(st.index)) this.states.set(st.name, st);
      else this.states.delete(st.name);
      this.map = null;
      return carried;
    }

    async enter(target, tile, elev, rot) {
      const name = typeof target === 'number' ? this.mapNames[target] : String(target).toUpperCase().replace(/\.MAP$/, '');
      if (!name) throw new Error('unknown map ' + target);
      this.anim.seqs = [];
      if (this.map) this.leave();
      this.walked = new Uint8Array(WALK_BYTES);
      const state = this.states.get(name) || await this.loadState(name);
      this.map = state;
      const h = state.header;
      const e = elev >= 0 && elev < 3 ? elev : h.elev;
      const t = tile >= 0 ? tile : h.tile;
      this.dude.rot = rot >= 0 && rot < 6 ? rot : h.rot;
      this.dude.x = 0;
      this.dude.y = 0;
      this.dude.frame = 0;
      this.add(this.dude, t, e);
      this.elev = e;
      this.baseLight = [null, null, null];
      await this.preload(e);
      state.visited = true;
      if (this.on.enter) this.on.enter(state);
      return state;
    }

    async setElevation(elev, tile) {
      this.processSeen();
      this.place(this.dude, tile >= 0 ? tile : this.dude.tile, elev);
      this.elev = elev;
      await this.preload(elev);
      if (this.on.enter) this.on.enter(this.map);
    }

    async preload(elev) {
      const fids = [];
      const m = this.map;
      for (let sq = 0; sq < FO.SQUARES; sq++) {
        const f = m.floors[elev][sq] & 0xFFF;
        const r = m.roofs[elev][sq] & 0xFFF;
        if (f > 1) fids.push(FO.fid(FO.ART.TILE, f));
        if (r > 1) fids.push(FO.fid(FO.ART.TILE, r));
      }
      for (const o of m.byElev[elev]) {
        fids.push(o.fid);
        if (FO.pidType(o.pid) === FO.PID.CRITTER) {
          fids.push(FO.critterFid(o, FO.ANIM.STAND), FO.critterFid(o, FO.ANIM.WALK));
        }
      }
      const d = this.dude;
      for (const a of [FO.ANIM.STAND, FO.ANIM.WALK, FO.ANIM.RUN, FO.ANIM.MAGIC_HANDS_GROUND, FO.ANIM.MAGIC_HANDS_MIDDLE, FO.ANIM.CLIMB_LADDER]) fids.push(FO.critterFid(d, a));
      await this.art.loadAll(fids);
    }

    key(tile, elev) {
      return elev * FO.HEXES + tile;
    }

    at(tile, elev) {
      return this.map.tiles.get(this.key(tile, elev)) || EMPTY;
    }

    index(o) {
      if (o.tile < 0) return;
      if (o.dude) this.markWalked(o.tile);
      const k = this.key(o.tile, o.elev);
      let list = this.map.tiles.get(k);
      if (!list) this.map.tiles.set(k, list = []);
      list.push(o);
    }

    unindex(o) {
      if (o.tile < 0) return;
      const k = this.key(o.tile, o.elev);
      const list = this.map.tiles.get(k);
      if (!list) return;
      const i = list.indexOf(o);
      if (i >= 0) list.splice(i, 1);
      if (!list.length) this.map.tiles.delete(k);
    }

    add(o, tile, elev) {
      o.tile = tile;
      o.elev = elev;
      o.owner = null;
      this.map.byElev[elev].push(o);
      this.index(o);
      if (!o.dude && o.lightRadius > 0) this.baseLight[elev] = null;
      return o;
    }

    remove(o) {
      this.unindex(o);
      const list = this.map.byElev[o.elev];
      const i = list ? list.indexOf(o) : -1;
      if (i >= 0) list.splice(i, 1);
      if (!o.dude && o.lightRadius > 0) this.baseLight[o.elev] = null;
      o.tile = -1;
    }

    place(o, tile, elev) {
      if (elev !== o.elev) {
        this.remove(o);
        this.add(o, tile, elev);
        return;
      }
      this.unindex(o);
      o.tile = tile;
      this.index(o);
      if (!o.dude && o.lightRadius > 0) this.baseLight[elev] = null;
    }

    moveTo(o, tile, elev) {
      const e = elev >= 0 && elev < 3 ? elev : o.elev;
      if (o.owner) return;
      if (o.tile < 0 || !this.map.byElev[o.elev] || !this.map.byElev[o.elev].includes(o)) this.add(o, tile, e);
      else this.place(o, tile, e);
      o.x = 0;
      o.y = 0;
      if (o.dude && e !== this.elev) {
        this.elev = e;
        this.preload(e);
        if (this.on.elevation) this.on.elevation(e);
      }
    }

    isCritter(o) {
      return FO.pidType(o.pid) === FO.PID.CRITTER;
    }

    isDead(o) {
      return this.isCritter(o) && !!o.critter && (o.critter.results & FO.DAM.DEAD) !== 0;
    }

    blocks(o) {
      if (o.flags & (FO.FLAG.HIDDEN | FO.FLAG.NO_BLOCK)) return false;
      const t = FO.pidType(o.pid);
      if (t === FO.PID.CRITTER) return !this.isDead(o);
      return t === FO.PID.SCENERY || t === FO.PID.WALL;
    }

    blocker(tile, elev, self) {
      for (const o of this.at(tile, elev)) if (o !== self && this.blocks(o)) return o;
      for (let d = 0; d < 6; d++) {
        const n = FO.hexStep(tile, d);
        if (n < 0) continue;
        for (const o of this.at(n, elev)) if (o !== self && (o.flags & FO.FLAG.MULTIHEX) && this.blocks(o)) return o;
      }
      return null;
    }

    findPath(o, goal, near) {
      return FO.findPath(o.tile, goal, { near: near || 0, blocked: t => {
        const b = this.blocker(t, o.elev, o);
        return !!b && !this.canUseDoor(o, b);
      } });
    }

    canUseDoor(o, door) {
      if (!o || o.dude || FO.fidType(o.fid) !== FO.ART.CRITTER) return false;
      const body = o.proto ? o.proto.body | 0 : 0;
      if (body !== BODY_BIPED && body !== BODY_ROBOTIC) return false;
      return FO.fidType(door.fid) === FO.ART.SCENERY && this.isDoor(door) && !this.locked(door);
    }

    stepped(o, st) {
      if (this.on.step) return this.on.step(o, st);
      return true;
    }

    exitAt(tile, elev) {
      for (const o of this.at(tile, elev)) if (FO.isExitGrid(o.pid)) return o;
      return null;
    }

    scrollBlocked(tile, elev) {
      for (const o of this.at(tile, elev)) if (o.pid === FO.SCROLL_BLOCKER_PID) return true;
      return false;
    }

    light() {
      const e = this.elev;
      if (!this.baseLight[e]) {
        this.baseLight[e] = FO.computeLight(this.map.byElev[e].filter(o => !o.dude), this.ambient);
        this.lightKey = '';
      }
      const d = this.dude;
      const key = e + ':' + d.tile + ':' + d.lightRadius + ':' + d.lightIntensity;
      if (key !== this.lightKey) {
        if (!this.lightBuf) this.lightBuf = new Int32Array(FO.HEXES);
        this.lightBuf.set(this.baseLight[e]);
        if (d.tile >= 0 && d.elev === e && d.lightRadius > 0 && d.lightIntensity > 0) {
          FO.addLight(this.lightBuf, FO.lightBlockers(this.map.byElev[e]), d.tile, Math.min(8, d.lightRadius), Math.min(FO.LIGHT_FULL, d.lightIntensity));
        }
        this.lightKey = key;
      }
      return this.lightBuf;
    }

    setAmbient(level) {
      this.ambient = Math.max(0, Math.min(FO.LIGHT_FULL, level | 0));
      this.baseLight = [null, null, null];
    }

    sceneryType(o) {
      return FO.pidType(o.pid) === FO.PID.SCENERY && o.proto ? o.proto.sub : -1;
    }

    itemType(o) {
      return FO.pidType(o.pid) === FO.PID.ITEM && o.proto ? o.proto.sub : -1;
    }

    isDoor(o) {
      return this.sceneryType(o) === FO.SCENERY.DOOR;
    }

    doorOpen(o) {
      return (o.openFlags & FO.DOOR_OPEN) !== 0 || o.frame !== 0;
    }

    locked(o) {
      if (this.isDoor(o)) return ((o.openFlags | 0) & FO.LOCKED) !== 0;
      return ((o.dataFlags | 0) & FO.LOCKED) !== 0;
    }

    doorBlockedByObject(door) {
      return this.at(door.tile, door.elev).some(o => o !== door && !(o.flags & FO.FLAG.HIDDEN) && FO.pidType(o.pid) !== FO.PID.MISC);
    }

    setDoor(door, open, done, sound) {
      const protoFlags = door.proto ? door.proto.flags : 0;
      if (!open) {
        door.flags = (door.flags & ~OPEN_FLAGS) | (protoFlags & OPEN_FLAGS & ~FO.FLAG.NO_BLOCK);
        door.openFlags = (door.openFlags | 0) & ~FO.DOOR_OPEN;
        this.baseLight[door.elev] = null;
      }
      const steps = sound ? [{ kind: 'sfx', obj: door, sound }] : [];
      this.anim.run([...steps, {
        kind: 'anim', obj: door, reverse: !open, hold: true, noOffset: true,
        done: () => {
          if (open) {
            door.flags |= OPEN_FLAGS;
            door.openFlags = (door.openFlags | 0) | FO.DOOR_OPEN;
            this.baseLight[door.elev] = null;
          }
          if (done) done();
        }
      }]);
    }

    take(o, item, count) {
      const n = count || 1;
      if (item.tile >= 0) this.remove(item);
      item.owner = o;
      const same = o.inventory.find(e => e.obj.pid === item.pid && FO.pidType(item.pid) === FO.PID.ITEM && this.stackable(e.obj, item));
      if (same) same.count += n;
      else o.inventory.push({ count: n, obj: item });
      return item;
    }

    stackable(a, b) {
      if (a === b) return true;
      if (a.pid !== b.pid) return false;
      if (a.inventory && a.inventory.length) return false;
      if (b.inventory && b.inventory.length) return false;
      return (a.ammo | 0) === (b.ammo | 0) && (a.charges | 0) === (b.charges | 0) && (a.quantity | 0) === (b.quantity | 0);
    }
  }

  FO.World = World;
})(globalThis.FO = globalThis.FO || {});
