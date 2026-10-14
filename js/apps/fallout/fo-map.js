(function (FO) {
  'use strict';

  FO.EXIT_GRID_MIN = 0x5000010;
  FO.EXIT_GRID_MAX = 0x5000017;
  FO.isExitGrid = pid => pid >= FO.EXIT_GRID_MIN && pid <= FO.EXIT_GRID_MAX;

  function readScript(r) {
    const s = { sid: r.i32(), next: r.i32() };
    const type = (s.sid >>> 24) & 0xFF;
    if (type === 1) {
      s.tile = r.i32();
      s.radius = r.i32();
    } else if (type === 2) {
      s.time = r.i32();
    }
    s.flags = r.i32();
    s.index = r.i32();
    r.skip(4);
    s.owner = r.i32();
    s.lvarOffset = r.i32();
    s.lvarCount = r.i32();
    s.ret = r.i32();
    s.action = r.i32();
    s.fixedParam = r.i32();
    s.actionUsed = r.i32();
    s.overrides = r.i32();
    s.unknown = r.i32();
    s.howMuch = r.i32();
    s.unknown2 = r.i32();
    return s;
  }

  function readObject(r, protos) {
    const o = {
      id: r.i32(), tile: r.i32(), x: r.i32(), y: r.i32(), sx: r.i32(), sy: r.i32(),
      frame: r.i32(), rot: r.i32(), fid: r.u32(), flags: r.u32(), elev: r.i32(), pid: r.i32(),
      cid: r.i32(), lightRadius: r.i32(), lightIntensity: r.i32(), outline: r.i32(), sid: r.i32(), scriptIndex: r.i32()
    };
    const invLen = r.i32();
    o.invCap = r.i32();
    r.skip(4);
    const type = FO.pidType(o.pid);
    if (type === FO.PID.CRITTER) {
      r.skip(4);
      o.critter = {
        damageLastTurn: r.i32(), maneuver: r.i32(), ap: r.i32(), results: r.i32(), ai: r.i32(), team: r.i32(), whoHitMe: r.i32(),
        hp: r.i32(), rad: r.i32(), poison: r.i32()
      };
    } else {
      o.dataFlags = r.u32() | 0;
      if (o.dataFlags === -858993460) o.dataFlags = 0;
      const p = protos.get(o.pid);
      if (!p && type !== FO.PID.MISC && type !== FO.PID.WALL) throw new Error('map object without prototype ' + o.pid.toString(16));
      if (type === FO.PID.ITEM) {
        if (p.sub === 3) {
          o.ammo = r.i32();
          o.ammoPid = r.i32();
        } else if (p.sub === 4) {
          o.quantity = r.i32();
        } else if (p.sub === 5) {
          o.charges = r.i32();
        } else if (p.sub === 6) {
          o.keyCode = r.i32();
        }
      } else if (type === FO.PID.SCENERY) {
        if (p.sub === 0) {
          o.openFlags = r.i32();
        } else if (p.sub === 1) {
          o.destTile = r.i32();
          o.destMap = r.i32();
        } else if (p.sub === 2) {
          o.elevator = r.i32();
          o.level = r.i32();
        } else if (p.sub === 3 || p.sub === 4) {
          o.destTile = r.i32();
        }
      } else if (type === FO.PID.MISC && FO.isExitGrid(o.pid)) {
        o.destMap = r.i32();
        o.destTile = r.i32();
        o.destElev = r.i32();
        o.destRot = r.i32();
      }
    }
    o.inventory = [];
    for (let i = 0; i < invLen; i++) {
      const count = r.i32();
      o.inventory.push({ count, obj: readObject(r, protos) });
    }
    return o;
  }

  FO.roofAt = function (roofs, sq) {
    return sq >= 0 && sq < FO.SQUARES ? roofs[sq] & 0xFFF : 0;
  };

  FO.roofHidden = function (roofs, sq) {
    if (FO.roofAt(roofs, sq) <= 1) return null;
    const hidden = new Uint8Array(FO.SQUARES);
    const stack = [sq];
    while (stack.length) {
      const s = stack.pop();
      if (hidden[s] || FO.roofAt(roofs, s) <= 1) continue;
      hidden[s] = 1;
      const x = s % 100;
      if (x > 0) stack.push(s - 1);
      if (x < 99) stack.push(s + 1);
      if (s >= 100) stack.push(s - 100);
      if (s < FO.SQUARES - 100) stack.push(s + 100);
    }
    return hidden;
  };

  FO.readMap = function (u8, protos) {
    const r = new FO.Bytes(u8);
    const h = {
      version: r.i32(), name: r.str(16), tile: r.i32(), elev: r.i32(), rot: r.i32(), localCount: r.i32(),
      script: r.i32(), flags: r.i32(), darkness: r.i32(), globalCount: r.i32(), index: r.i32(), time: r.u32()
    };
    r.skip(44 * 4);
    if (h.version !== 19) throw new Error('MAP: version ' + h.version);
    const gvars = r.ints(h.globalCount);
    const lvars = r.ints(h.localCount);
    const floors = [];
    const roofs = [];
    for (let e = 0; e < 3; e++) {
      const floor = new Uint16Array(FO.SQUARES);
      const roof = new Uint16Array(FO.SQUARES);
      if (h.flags & (2 << e)) {
        floor.fill(1);
        roof.fill(1);
      } else {
        for (let i = 0; i < FO.SQUARES; i++) {
          roof[i] = r.u16();
          floor[i] = r.u16();
        }
      }
      floors.push(floor);
      roofs.push(roof);
    }
    const scripts = [[], [], [], [], []];
    for (let t = 0; t < 5; t++) {
      const count = r.i32();
      if (count <= 0) continue;
      const blocks = Math.ceil(count / 16);
      for (let b = 0; b < blocks; b++) {
        const block = [];
        for (let i = 0; i < 16; i++) block.push(readScript(r));
        const len = r.i32();
        r.skip(4);
        for (let i = 0; i < Math.min(len, 16); i++) scripts[t].push(block[i]);
      }
    }
    const objects = [[], [], []];
    r.skip(4);
    for (let e = 0; e < 3; e++) {
      const n = r.i32();
      for (let i = 0; i < n; i++) objects[e].push(readObject(r, protos));
    }
    if (r.left !== 0) throw new Error('MAP: ' + r.left + ' bytes left');
    return { header: h, gvars, lvars, floors, roofs, scripts, objects };
  };
})(globalThis.FO = globalThis.FO || {});
