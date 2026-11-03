(function (S) {
  'use strict';
  const M = S.METRICS;
  const TN = 0, TE = 1, TS = 2, TW = 3;
  const FORMAT = 1;
  const MAX_COLOR = 15;
  const LIGHT_SCALE = 127.5;
  const DAY_LEVELS = 15;
  const DAY_DARK = 0.28, DAY_WINDOW = 0.46, DAY_GAIN = 0.75, DAY_REACH = 2.6;
  const LAMP_FILL = 0.3, LAMP_POOL = 0.8, LAMP_REACH = 2.4, LAMP_OUT_LIMIT = 7, LAMP_OUT_POOL = 0.55;
  const HIDE_STEP = 0.5;
  const FLAG_CUT = 32, FLAG_HIDDEN = 64, FLAG_DIM = 128;
  const STAIR_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  const orient = (x0, z0, x1, z1) => (x1 < x0 || (x1 === x0 && z1 < z0) ? [x1, z1, x0, z0] : [x0, z0, x1, z1]);
  const wallKey = (h, x0, z0, x1, z1) => {
    const s = h.w + 1, p = x0 + z0 * s, q = x1 + z1 * s;
    return p * s * (h.d + 1) + q;
  };

  const outward = seg => ({ x: seg.z1 - seg.z0, z: seg.x0 - seg.x1 });

  const floorOf = (h, k) => {
    while (h.floors.length <= k) {
      h.floors.push({ walls: new Map(), paint: new Uint8Array(h.w * h.d * 4), tri: null, rooms: null });
    }
    return h.floors[k];
  };

  const triAt = (h, x, z, t) => (x < 0 || z < 0 || x >= h.w || z >= h.d ? -1 : (x + z * h.w) * 4 + t);

  const triOfPoint = (x, z) => {
    const u = x - Math.floor(x) - 0.5, v = z - Math.floor(z) - 0.5;
    if (Math.abs(u) > Math.abs(v)) return u > 0 ? TE : TW;
    return v > 0 ? TS : TN;
  };

  const flood = (h, f) => {
    const size = h.w * h.d * 4, tri = new Int32Array(size).fill(-1), has = (x0, z0, x1, z1) => f.walls.has(wallKey(h, x0, z0, x1, z1));
    const near = (id, out) => {
      const t = id & 3, cell = id >> 2, x = cell % h.w, z = Math.floor(cell / h.w);
      out.length = 0;
      const main = has(x, z, x + 1, z + 1), anti = has(x, z + 1, x + 1, z);
      const step = (u, blocked) => { if (!blocked) out.push((cell << 2) | u); };
      if (t === TN || t === TE) step(t === TN ? TE : TN, anti);
      if (t === TS || t === TW) step(t === TS ? TW : TS, anti);
      if (t === TE || t === TS) step(t === TE ? TS : TE, main);
      if (t === TW || t === TN) step(t === TW ? TN : TW, main);
      if (t === TN && !has(x, z, x + 1, z) && z > 0) out.push(triAt(h, x, z - 1, TS));
      if (t === TS && !has(x, z + 1, x + 1, z + 1) && z < h.d - 1) out.push(triAt(h, x, z + 1, TN));
      if (t === TW && !has(x, z, x, z + 1) && x > 0) out.push(triAt(h, x - 1, z, TE));
      if (t === TE && !has(x + 1, z, x + 1, z + 1) && x < h.w - 1) out.push(triAt(h, x + 1, z, TW));
      return out;
    };
    const stack = [], list = [];
    const fill = (start, id) => {
      let count = 0;
      stack.length = 0;
      tri[start] = id;
      stack.push(start);
      while (stack.length) {
        const cur = stack.pop();
        count++;
        for (const n of near(cur, list)) {
          if (tri[n] < 0) {
            tri[n] = id;
            stack.push(n);
          }
        }
      }
      return count;
    };
    const rooms = [{ id: 0, color: 0, tris: 0 }];
    const edge = (x, z, t, blocked) => {
      if (blocked) return;
      const id = triAt(h, x, z, t);
      if (tri[id] < 0) rooms[0].tris += fill(id, 0);
    };
    for (let x = 0; x < h.w; x++) {
      edge(x, 0, TN, has(x, 0, x + 1, 0));
      edge(x, h.d - 1, TS, has(x, h.d, x + 1, h.d));
    }
    for (let z = 0; z < h.d; z++) {
      edge(0, z, TW, has(0, z, 0, z + 1));
      edge(h.w - 1, z, TE, has(h.w, z, h.w, z + 1));
    }
    for (let i = 0; i < size; i++) {
      if (tri[i] >= 0) continue;
      const id = rooms.length;
      rooms.push({ id, color: 0, tris: fill(i, id) });
    }
    f.tri = tri;
    f.rooms = rooms;
    f.low = [];
    for (const r of rooms) r.area = r.tris / 4;
    const links = rooms.map(() => new Set());
    for (const seg of f.walls.values()) {
      const [a, b] = sideRooms(h, f, seg);
      if (a !== b) {
        links[a].add(b);
        links[b].add(a);
      }
    }
    for (let id = 1; id < rooms.length; id++) {
      const used = new Set();
      links[id].forEach(o => used.add(rooms[o].color));
      let color = 1;
      while (used.has(color) && color < MAX_COLOR) color++;
      rooms[id].color = color;
    }
  };

  const sideTris = (h, seg) => {
    const { x0, z0, x1, z1 } = seg;
    if (z0 === z1) return [triAt(h, x0, z0 - 1, TS), triAt(h, x0, z0, TN)];
    if (x0 === x1) return [triAt(h, x0, z0, TW), triAt(h, x0 - 1, z0, TE)];
    if (z1 > z0) return [triAt(h, x0, z0, TE), triAt(h, x0, z0, TS)];
    return [triAt(h, x0, z1, TN), triAt(h, x0, z1, TS)];
  };

  const sideRooms = (h, f, seg) => {
    const [a, b] = sideTris(h, seg);
    return [a < 0 ? 0 : f.tri[a], b < 0 ? 0 : f.tri[b]];
  };

  const rooms = (h, k) => {
    const f = floorOf(h, k);
    if (!f.tri) flood(h, f);
    return f.rooms;
  };

  const roomAt = (h, k, x, z) => {
    rooms(h, k);
    const id = triAt(h, Math.floor(x), Math.floor(z), triOfPoint(x, z));
    return id < 0 ? 0 : h.floors[k].tri[id];
  };

  const footprint = (h, k) => {
    const out = new Uint8Array(h.w * h.d);
    if (k >= h.floors.length) return out;
    rooms(h, k);
    const tri = h.floors[k].tri;
    for (let i = 0; i < h.w * h.d; i++) {
      if (tri[i * 4] > 0 || tri[i * 4 + 1] > 0 || tri[i * 4 + 2] > 0 || tri[i * 4 + 3] > 0) out[i] = 1;
    }
    return out;
  };

  const lightBytes = (h, k) => {
    const list = rooms(h, k), f = h.floors[k], out = new Uint8Array(h.w * h.d * 4);
    const windows = list.map(() => []), lamps = list.map(() => []);
    for (const seg of f.walls.values()) {
      if (!seg.cut || !seg.cut.glass) continue;
      const [a, b] = sideRooms(h, f, seg), mx = (seg.x0 + seg.x1) / 2, mz = (seg.z0 + seg.z1) / 2;
      if (a > 0 && b === 0) windows[a].push([mx, mz]);
      if (b > 0 && a === 0) windows[b].push([mx, mz]);
    }
    for (const lamp of h.lamps) {
      if (lamp.floor !== k || !lamp.on) continue;
      lamps[roomAt(h, k, lamp.x, lamp.z)].push(lamp);
    }
    for (let z = 0; z < h.d; z++) {
      for (let x = 0; x < h.w; x++) {
        const cell = (x + z * h.w) * 4, cx = x + 0.5, cz = z + 0.5;
        let id = 0;
        for (let t = 0; t < 4 && !id; t++) id = f.tri[cell + t];
        let day = 1;
        if (id > 0) {
          day = windows[id].length ? DAY_WINDOW : DAY_DARK;
          for (const [wx, wz] of windows[id]) {
            const d = Math.hypot(cx - wx, cz - wz) / DAY_REACH;
            day += DAY_GAIN / (1 + d * d);
          }
        }
        let r = 0, g = 0, b = 0;
        for (const lamp of lamps[id]) {
          const dist = Math.hypot(cx - lamp.x, cz - lamp.z);
          if (id === 0 && dist > LAMP_OUT_LIMIT) continue;
          const d = dist / LAMP_REACH, edge = 1 - (dist / LAMP_OUT_LIMIT) ** 2;
          const power = lamp.power * (id ? LAMP_FILL + LAMP_POOL / (1 + d * d) : edge * edge * LAMP_OUT_POOL / (1 + d * d));
          r += lamp.color[0] * power;
          g += lamp.color[1] * power;
          b += lamp.color[2] * power;
        }
        out[cell] = Math.min(255, Math.round(r * LIGHT_SCALE));
        out[cell + 1] = Math.min(255, Math.round(g * LIGHT_SCALE));
        out[cell + 2] = Math.min(255, Math.round(b * LIGHT_SCALE));
        out[cell + 3] = (Math.round(Math.min(1, day) * DAY_LEVELS) << 4) | list[id].color;
      }
    }
    return out;
  };

  S.House = {
    TN, TE, TS, TW, FORMAT, FLAG_CUT, FLAG_HIDDEN, FLAG_DIM, STAIR_DIRS,
    roomAt, rooms, footprint, lightBytes, sideRooms, outward, triOfPoint,

    keyOf(h, x0, z0, x1, z1) {
      const [a, b, c, d] = orient(x0, z0, x1, z1);
      return wallKey(h, a, b, c, d);
    },

    create(o) {
      return {
        id: o.id, x: o.x, z: o.z, w: o.w, d: o.d, base: o.base || 0, lift: o.lift || 0,
        styles: o.styles || [], paints: Object.assign({}, o.paints),
        roof: Object.assign({ form: 'hip', pitch: M.roofPitch, over: M.roofOver }, o.roof),
        floors: [], lamps: [], items: [], stairs: []
      };
    },

    floorY: (h, k) => h.base + h.lift + k * M.floorStep,
    floorOf,
    wallAt: (h, k, x0, z0, x1, z1) => {
      const [a, b, c, d] = orient(x0, z0, x1, z1);
      return floorOf(h, k).walls.get(wallKey(h, a, b, c, d));
    },

    addWall(h, k, x0, z0, x1, z1) {
      const dx = Math.sign(x1 - x0), dz = Math.sign(z1 - z0), steps = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0));
      if (!steps || (dx && dz && Math.abs(x1 - x0) !== Math.abs(z1 - z0))) throw new Error('a wall runs along tile edges or diagonals');
      const f = floorOf(h, k);
      for (let i = 0; i < steps; i++) {
        const [a, b, c, d] = orient(x0 + dx * i, z0 + dz * i, x0 + dx * (i + 1), z0 + dz * (i + 1));
        if (a < 0 || b < 0 || c > h.w || b > h.d || d > h.d || d < 0) throw new Error('a wall leaves the lot');
        const key = wallKey(h, a, b, c, d);
        if (!f.walls.has(key)) f.walls.set(key, { x0: a, z0: b, x1: c, z1: d, a: h.paints.outside || 1, b: h.paints.outside || 1, cut: null });
      }
      f.tri = null;
    },

    addRoom(h, k, x0, z0, x1, z1) {
      S.House.addWall(h, k, x0, z0, x1, z0);
      S.House.addWall(h, k, x0, z1, x1, z1);
      S.House.addWall(h, k, x0, z0, x0, z1);
      S.House.addWall(h, k, x1, z0, x1, z1);
    },

    removeWall(h, k, x0, z0, x1, z1) {
      const [a, b, c, d] = orient(x0, z0, x1, z1), f = floorOf(h, k);
      f.walls.delete(wallKey(h, a, b, c, d));
      f.tri = null;
    },

    addOpening(h, k, x0, z0, x1, z1, kind, cut, glass) {
      const seg = S.House.wallAt(h, k, x0, z0, x1, z1);
      if (!seg) throw new Error('an opening needs a wall');
      seg.cut = { kind, y0: cut[0], y1: cut[1], glass: !!glass };
      return seg;
    },

    openingFacing(h, k, seg) {
      rooms(h, k);
      const [a, b] = sideRooms(h, h.floors[k], seg);
      const outA = a === 0 || (b !== 0 && a < b);
      if (seg.z0 === seg.z1) return outA ? 0 : 2;
      return outA ? 3 : 1;
    },

    paintRoom(h, k, id, style) {
      rooms(h, k);
      const f = h.floors[k];
      for (const seg of f.walls.values()) {
        const [a, b] = sideRooms(h, f, seg);
        if (a === id) seg.a = style;
        if (b === id) seg.b = style;
      }
    },

    floorRoom(h, k, id, style) {
      rooms(h, k);
      const f = h.floors[k];
      for (let i = 0; i < f.paint.length; i++) {
        if (f.tri[i] === id) f.paint[i] = style;
      }
    },

    addStair(h, k, x, z, dir, width) {
      const stair = { floor: k, x, z, dir, width };
      h.stairs.push(stair);
      const upper = floorOf(h, k + 1);
      for (const [tx, tz] of S.House.stairTiles(stair)) upper.paint.fill(0, (tx + tz * h.w) * 4, (tx + tz * h.w) * 4 + 4);
      return stair;
    },

    stairTiles(stair) {
      const [dx, dz] = STAIR_DIRS[stair.dir], px = -dz, pz = dx, out = [];
      for (let c = 0; c < stair.width; c++) {
        for (let i = 0; i < M.stairRun; i++) out.push([stair.x + dx * i + px * c, stair.z + dz * i + pz * c]);
      }
      return out;
    },

    stairColumns(stair) {
      const [dx, dz] = STAIR_DIRS[stair.dir], px = -dz, pz = dx, out = [], run = M.stairRun;
      for (let c = 0; c < stair.width; c++) {
        const bx = stair.x + px * c, bz = stair.z + pz * c, mx = bx + 0.5, mz = bz + 0.5;
        out.push({
          entry: [bx - dx, bz - dz], exit: [bx + dx * run, bz + dz * run],
          start: [mx - dx * 0.5, mz - dz * 0.5], end: [mx + dx * (run - 0.5), mz + dz * (run - 0.5)]
        });
      }
      return out;
    },

    addLamp(h, k, x, z, power, color) {
      const lamp = { floor: k, x, z, power, color, on: false };
      h.lamps.push(lamp);
      return lamp;
    },

    setLamps(h, on) {
      let changed = false;
      for (const lamp of h.lamps) {
        if (lamp.on !== on) {
          lamp.on = on;
          changed = true;
        }
      }
      return changed;
    },

    hidesRoom(h, k, seg, rot) {
      const [a, b, c, d] = S.TURNS[rot], wx = (-a - c) * Math.SQRT1_2, wz = (-b - d) * Math.SQRT1_2;
      const reach = M.wall / Math.tan(S.CAMERA.elevation), mx = (seg.x0 + seg.x1) / 2, mz = (seg.z0 + seg.z1) / 2;
      for (let t = HIDE_STEP / 2; t <= reach; t += HIDE_STEP) {
        if (roomAt(h, k, mx + wx * t, mz + wz * t) > 0) return true;
      }
      return false;
    },

    lowWalls(h, k, rot) {
      rooms(h, k);
      const f = h.floors[k];
      if (f.low[rot]) return f.low[rot];
      const low = new Set(), seen = new Set();
      for (const seg of f.walls.values()) {
        if (seen.has(seg)) continue;
        const run = [seg], dx = seg.x1 - seg.x0, dz = seg.z1 - seg.z0, pair = sideRooms(h, f, seg).join();
        seen.add(seg);
        for (const sign of [1, -1]) {
          let cur = seg;
          for (;;) {
            const x = sign > 0 ? cur.x1 : cur.x0 - dx, z = sign > 0 ? cur.z1 : cur.z0 - dz;
            const next = S.House.wallAt(h, k, x, z, x + dx, z + dz);
            if (!next || seen.has(next) || sideRooms(h, f, next).join() !== pair) break;
            run.push(next);
            seen.add(next);
            cur = next;
          }
        }
        if (run.some(s => S.House.hidesRoom(h, k, s, rot))) run.forEach(s => low.add(s));
      }
      f.low[rot] = low;
      return low;
    },

    wallIsLow(h, k, seg, view) {
      if (!view || view.floor !== k || view.mode === 'up') return false;
      return view.mode === 'down' || S.House.lowWalls(h, k, view.rot).has(seg);
    },

    itemFlags(h, item, view) {
      const floorBits = item.facing | (item.floor << 2) | (item.burnt ? FLAG_DIM : 0);
      if (item.gone) return floorBits | FLAG_HIDDEN;
      if (!view || item.outdoor || S.House.showsRoof(h, view)) return floorBits;
      if (item.floor > view.floor) return floorBits | FLAG_HIDDEN;
      if (item.floor < view.floor) return floorBits | FLAG_DIM;
      if (item.seg && S.House.wallIsLow(h, item.floor, item.seg, view)) return floorBits | FLAG_CUT;
      return floorBits;
    },

    showsRoof: (h, view) => !view || (view.mode === 'up' && view.floor >= h.floors.length - 1),

    toFile(h) {
      return {
        format: FORMAT, w: h.w, d: h.d, lift: h.lift, styles: h.styles, paints: h.paints, roof: h.roof,
        lamps: h.lamps.map(l => [l.floor, l.x, l.z, l.power, l.color]),
        stairs: h.stairs.map(s => [s.floor, s.x, s.z, s.dir, s.width]),
        items: h.items.map(i => (i.seg ? { kind: i.kind, floor: i.floor, seg: [i.seg.x0, i.seg.z0, i.seg.x1, i.seg.z1] } : { kind: i.kind, floor: i.floor, x: i.x, z: i.z, facing: i.facing, outdoor: !!i.outdoor })),
        floors: h.floors.map(f => ({
          walls: [...f.walls.values()].map(s => [s.x0, s.z0, s.x1, s.z1, s.a, s.b, s.cut ? [s.cut.kind, s.cut.y0, s.cut.y1, s.cut.glass ? 1 : 0] : 0]),
          paint: packBytes(f.paint)
        }))
      };
    },

    fromFile(file, place) {
      if (file.format !== FORMAT) throw new Error('unknown lot format ' + file.format);
      const h = S.House.create({ id: place.id, x: place.x, z: place.z, w: file.w, d: file.d, base: place.base, lift: file.lift, styles: file.styles, paints: file.paints, roof: file.roof });
      file.floors.forEach((fl, k) => {
        const f = floorOf(h, k);
        for (const [x0, z0, x1, z1, a, b, cut] of fl.walls) {
          f.walls.set(wallKey(h, x0, z0, x1, z1), { x0, z0, x1, z1, a, b, cut: cut ? { kind: cut[0], y0: cut[1], y1: cut[2], glass: !!cut[3] } : null });
        }
        f.paint = unpackBytes(fl.paint, h.w * h.d * 4);
      });
      for (const [floor, x, z, power, color] of file.lamps) S.House.addLamp(h, floor, x, z, power, color);
      for (const [floor, x, z, dir, width] of file.stairs) h.stairs.push({ floor, x, z, dir, width });
      for (const i of file.items) {
        if (i.seg) S.House.addSegItem(h, i.kind, i.floor, S.House.wallAt(h, i.floor, i.seg[0], i.seg[1], i.seg[2], i.seg[3]));
        else S.House.addItem(h, i.kind, i.floor, i.x, i.z, i.facing).outdoor = i.outdoor;
      }
      return h;
    },

    addItem(h, kind, k, x, z, facing) {
      const item = { kind, floor: k, x, z, facing, seg: null, index: -1 };
      h.items.push(item);
      return item;
    },

    addSegItem(h, kind, k, seg) {
      const item = { kind, floor: k, seg, x: (seg.x0 + seg.x1) / 2, z: (seg.z0 + seg.z1) / 2, facing: S.House.openingFacing(h, k, seg), index: -1 };
      h.items.push(item);
      return item;
    },

    inside: (h, x, z) => x >= h.x && z >= h.z && x <= h.x + h.w && z <= h.z + h.d
  };

  const packBytes = bytes => {
    const out = [];
    for (let i = 0; i < bytes.length;) {
      let run = 1;
      while (i + run < bytes.length && bytes[i + run] === bytes[i]) run++;
      out.push(run, bytes[i]);
      i += run;
    }
    return out;
  };

  const unpackBytes = (list, size) => {
    const out = new Uint8Array(size);
    let at = 0;
    for (let i = 0; i < list.length; i += 2) {
      out.fill(list[i + 1], at, at + list[i]);
      at += list[i];
    }
    return out;
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
