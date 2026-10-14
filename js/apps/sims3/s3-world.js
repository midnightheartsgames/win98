(function (S) {
  'use strict';
  const { DX, DY, Heap, OBJECTS } = S;

  const TER = { grass: 0, grass2: 1, dirt: 2, flowers: 3, gravel: 4, sand: 5, pond: 6, sea: 7, road: 8, walk: 9, plaza: 10, path: 11, bridge: 12, rock: 13, pool: 14 };
  const TER_NAMES = Object.keys(TER);
  const WALKABLE = new Uint8Array(16).fill(1);
  WALKABLE[TER.pond] = 0; WALKABLE[TER.sea] = 0; WALKABLE[TER.rock] = 0; WALKABLE[TER.pool] = 0;
  const TER_COST = new Float32Array(16).fill(1);
  TER_COST[TER.road] = 1.7; TER_COST[TER.sand] = 1.1; TER_COST[TER.flowers] = 1.3; TER_COST[TER.bridge] = 1.2;
  const LAYERS = ['occ', 'surf', 'rug', 'ground', 'ceil'];
  const LEVELS = 4;
  const FLOOR_LIST = [null].concat(Object.keys(S.FLOORS));
  const FLOOR_ID = {};
  FLOOR_LIST.forEach((k, i) => { if (k) FLOOR_ID[k] = i; });

  function layerOf(def) {
    if (def.poolEdge) return 'ground';
    if (def.place === 'surface') return 'surf';
    if (def.place === 'rug') return def.key === 'rug_small' || def.key === 'rug_big' ? 'rug' : 'ground';
    if (def.place === 'ceiling') return 'ceil';
    if (def.place === 'wall') return 'wall';
    if (def.block === false) return 'ground';
    return 'occ';
  }

  function footprint(def, r) {
    const w = def.size[0], d = def.size[1];
    return r % 2 === 0 ? [w, d] : [d, w];
  }

  function slotKey(x, y, r, lv) { return (lv || 0) + ':' + x + ',' + y + ',' + r; }

  function objLevels(ob) {
    const def = OBJECTS[ob.t];
    const lv = ob.lv || 0;
    if (def.stairs) return [lv, lv + 1];
    if (def.elevator) { const out = []; for (let l = lv; l <= Math.max(lv, (ob.st && ob.st.top) || lv); l++) out.push(l); return out; }
    return [lv];
  }

  class World {
    constructor(W, H) {
      this.W = W; this.H = H; this.L = LEVELS;
      const n = W * H;
      this.n = n;
      this.hN = W * (H + 1); this.vN = (W + 1) * H;
      this.terrain = new Uint8Array(n);
      this.road = new Uint8Array(n);
      this.floor = new Uint8Array(n * LEVELS);
      this.lot = new Int16Array(n).fill(-1);
      this.room = new Int32Array(n * LEVELS);
      this.hwall = new Int32Array(this.hN * LEVELS);
      this.vwall = new Int32Array(this.vN * LEVELS);
      this.walls = [null];
      this.freeWalls = [];
      this.layer = {};
      for (const k of LAYERS) this.layer[k] = new Int32Array(n * LEVELS);
      this.wallSlots = new Map();
      this.objects = new Map();
      this.nextId = 1;
      this.lots = [];
      this.rooms = [{ id: 0, outdoor: true, tiles: 0, lv: 0 }];
      this.version = 1;
      this.wallVersion = 1;
      this.linkVersion = 1;
      this.linkBuilt = 0;
      this.links = new Map();
      this.envCache = new Map();
      this.pf = { g: new Float32Array(n * LEVELS), from: new Int32Array(n * LEVELS), seen: new Uint32Array(n * LEVELS), shut: new Uint32Array(n * LEVELS), gen: 0 };
    }

    idx(x, y) { return y * this.W + x; }
    li(x, y, lv) { return (lv || 0) * this.n + y * this.W + x; }
    inb(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; }
    ter(x, y) { return this.inb(x, y) ? this.terrain[y * this.W + x] : TER.grass; }
    isWater(x, y) { const t = this.ter(x, y); return t === TER.pond || t === TER.sea; }
    isPool(x, y) { return this.inb(x, y) && this.terrain[y * this.W + x] === TER.pool; }
    poolTiles(lotId) {
      if (!this.poolCache || this.poolCache.v !== this.version) this.poolCache = { v: this.version, m: new Map() };
      let list = this.poolCache.m.get(lotId);
      if (!list) {
        list = [];
        const lot = this.lots[lotId];
        if (lot) for (let y = lot.y; y < lot.y + lot.h; y++) for (let x = lot.x; x < lot.x + lot.w; x++) if (this.terrain[y * this.W + x] === TER.pool) list.push([x, y]);
        this.poolCache.m.set(lotId, list);
      }
      return list;
    }
    lotAt(x, y) { return this.inb(x, y) ? this.lot[y * this.W + x] : -1; }
    roomAt(x, y, lv) { return this.inb(x, y) && (lv || 0) < this.L ? this.room[this.li(x, y, lv)] : 0; }
    indoor(x, y, lv) { return this.roomAt(x, y, lv) > 0; }
    floorAt(x, y, lv) { return this.inb(x, y) && (lv || 0) < this.L ? FLOOR_LIST[this.floor[this.li(x, y, lv)]] : null; }
    hasFloor(x, y, lv) { if (!this.inb(x, y)) return false; return !lv || (lv < this.L && this.floor[this.li(x, y, lv)] > 0); }
    setFloor(x, y, key, lv) { if (!this.inb(x, y) || (lv || 0) >= this.L) return; this.floor[this.li(x, y, lv)] = key ? FLOOR_ID[key] || 0 : 0; this.version++; }

    edgeIndex(o, x, y, lv) {
      lv = lv || 0;
      if (lv < 0 || lv >= this.L) return -1;
      if (o === 'h') return x >= 0 && x < this.W && y >= 0 && y <= this.H ? lv * this.hN + y * this.W + x : -1;
      return x >= 0 && x <= this.W && y >= 0 && y < this.H ? lv * this.vN + y * (this.W + 1) + x : -1;
    }
    getWall(o, x, y, lv) {
      const i = this.edgeIndex(o, x, y, lv);
      if (i < 0) return null;
      const id = o === 'h' ? this.hwall[i] : this.vwall[i];
      return id ? this.walls[id] : null;
    }
    addWall(o, x, y, props) {
      const lv = (props && props.lv) || 0;
      const i = this.edgeIndex(o, x, y, lv);
      if (i < 0) return null;
      const arr = o === 'h' ? this.hwall : this.vwall;
      if (arr[i]) { Object.assign(this.walls[arr[i]], props || {}); this.wallVersion++; return this.walls[arr[i]]; }
      const rec = Object.assign({ o, x, y, lv: 0, a: 'paint_white', b: 'paint_white', door: null, win: null, fence: false }, props || {});
      rec.lv = lv;
      const id = this.freeWalls.length ? this.freeWalls.pop() : this.walls.length;
      rec.id = id;
      this.walls[id] = rec;
      arr[i] = id;
      this.wallVersion++;
      return rec;
    }
    removeWall(o, x, y, lv) {
      lv = lv || 0;
      const i = this.edgeIndex(o, x, y, lv);
      if (i < 0) return false;
      const arr = o === 'h' ? this.hwall : this.vwall;
      const id = arr[i];
      if (!id) return false;
      for (const [key, oid] of Array.from(this.wallSlots)) {
        const ob = this.objects.get(oid);
        if (ob && this.wallOfSlot(ob) === this.walls[id]) this.removeObject(oid);
        if (!this.objects.has(oid)) this.wallSlots.delete(key);
      }
      this.walls[id] = null;
      this.freeWalls.push(id);
      arr[i] = 0;
      this.wallVersion++;
      return true;
    }
    wallBetween(x0, y0, x1, y1, lv) {
      if (x0 === x1) { if (Math.abs(y1 - y0) !== 1) return null; return this.getWall('h', x0, Math.max(y0, y1), lv); }
      if (y0 === y1) { if (Math.abs(x1 - x0) !== 1) return null; return this.getWall('v', Math.max(x0, x1), y0, lv); }
      return null;
    }
    edgeOpen(x0, y0, x1, y1, lv) {
      const w = this.wallBetween(x0, y0, x1, y1, lv);
      return !w || !!w.door;
    }
    wallBehind(x, y, r, lv) {
      const d = (r + 2) % 4;
      return this.wallBetween(x, y, x + DX[d], y + DY[d], lv);
    }
    wallOfSlot(ob) { return this.wallBehind(ob.x, ob.y, ob.r, ob.lv || 0); }

    walkable(x, y, lv) {
      if (!this.inb(x, y)) return false;
      if (!lv) { const i = y * this.W + x; return WALKABLE[this.terrain[i]] === 1 && !this.layer.occ[i]; }
      if (lv >= this.L) return false;
      const j = this.li(x, y, lv);
      return this.floor[j] > 0 && !this.layer.occ[j];
    }
    canStep(x, y, nx, ny, lv) {
      const dx = nx - x, dy = ny - y;
      if (dx === 0 || dy === 0) return this.edgeOpen(x, y, nx, ny, lv);
      if (!this.walkable(x + dx, y, lv) || !this.walkable(x, y + dy, lv)) return false;
      const w1 = this.wallBetween(x, y, x + dx, y, lv), w2 = this.wallBetween(x, y, x, y + dy, lv);
      const w3 = this.wallBetween(x + dx, y, nx, ny, lv), w4 = this.wallBetween(x, y + dy, nx, ny, lv);
      return !w1 && !w2 && !w3 && !w4;
    }

    stairInfo(ob) {
      const def = OBJECTS[ob.t];
      const tiles = this.footTiles(def, ob.x, ob.y, ob.r);
      const fx = DX[ob.r], fy = DY[ob.r];
      tiles.sort((a, b) => (a[0] * fx + a[1] * fy) - (b[0] * fx + b[1] * fy));
      const bottom = tiles[0], top = tiles[tiles.length - 1];
      const lv = ob.lv || 0;
      return { lv, tiles, bottom, top, dir: [fx, fy], entry: [bottom[0] - fx, bottom[1] - fy, lv], exit: [top[0] + fx, top[1] + fy, lv + 1] };
    }
    elevInfo(ob) {
      const lv = ob.lv || 0, top = Math.max(lv, (ob.st && ob.st.top) || lv);
      const levels = [];
      for (let l = lv; l <= top; l++) levels.push(l);
      return { shaft: [ob.x, ob.y], front: [ob.x + DX[ob.r], ob.y + DY[ob.r]], levels };
    }
    ensureLinks() {
      if (this.linkBuilt === this.linkVersion) return;
      this.linkBuilt = this.linkVersion;
      this.links = new Map();
      const add = (a, b, cost, kind, ob) => {
        if (!this.links.has(a)) this.links.set(a, []);
        this.links.get(a).push({ to: b, cost, kind, ob });
      };
      for (const ob of this.objects.values()) {
        const def = OBJECTS[ob.t];
        if (def.stairs) {
          const s = this.stairInfo(ob);
          if (!this.inb(s.entry[0], s.entry[1]) || !this.inb(s.exit[0], s.exit[1]) || s.exit[2] >= this.L) continue;
          const a = this.li(s.entry[0], s.entry[1], s.entry[2]), b = this.li(s.exit[0], s.exit[1], s.exit[2]);
          const cost = (s.tiles.length + 1) * 1.6;
          add(a, b, cost, 'stairs', ob); add(b, a, cost, 'stairs', ob);
        } else if (def.elevator) {
          const e = this.elevInfo(ob);
          if (!this.inb(e.front[0], e.front[1])) continue;
          for (const l1 of e.levels) for (const l2 of e.levels) {
            if (l1 === l2) continue;
            add(this.li(e.front[0], e.front[1], l1), this.li(e.front[0], e.front[1], l2), 7 + 2.5 * Math.abs(l2 - l1), 'elevator', ob);
          }
        }
      }
    }
    stairsCheck(type, x, y, r, lv, lotId) {
      lv = lv || 0;
      if (lv + 1 >= this.L) return { ok: false, reason: 'Выше строить нельзя' };
      const c = this.canPlace(type, x, y, r, { lot: lotId, lv });
      if (!c.ok) return c;
      const s = this.stairInfo({ t: type, x, y, r, lv });
      const [ex, ey] = s.entry, [tx, ty] = s.exit;
      if (!this.inb(ex, ey) || this.lotAt(ex, ey) !== lotId || !this.walkable(ex, ey, lv)) return { ok: false, reason: 'Внизу у лестницы нужен проход' };
      if (!this.inb(tx, ty) || this.lotAt(tx, ty) !== lotId || !this.hasFloor(tx, ty, lv + 1) || this.layer.occ[this.li(tx, ty, lv + 1)]) return { ok: false, reason: 'Наверху у выхода нужен свободный пол' };
      const down = [[ex, ey]].concat(s.tiles), up = s.tiles.concat([[tx, ty]]);
      for (let i = 1; i < down.length; i++) if (!this.edgeOpen(down[i - 1][0], down[i - 1][1], down[i][0], down[i][1], lv)) return { ok: false, reason: 'Мешает стена' };
      for (let i = 1; i < up.length; i++) if (!this.edgeOpen(up[i - 1][0], up[i - 1][1], up[i][0], up[i][1], lv + 1)) return { ok: false, reason: 'Мешает стена наверху' };
      for (const [px, py] of s.tiles) {
        const j = this.li(px, py, lv + 1);
        for (const lay of LAYERS) if (this.layer[lay][j]) return { ok: false, reason: 'Над лестницей стоят вещи' };
      }
      return { ok: true };
    }
    elevatorTop(x, y, r, lv) {
      const fx = x + DX[r], fy = y + DY[r];
      let top = lv || 0;
      for (let l = top + 1; l < this.L; l++) {
        if (!this.hasFloor(fx, fy, l) || !this.hasFloor(x, y, l)) break;
        const j = this.li(x, y, l);
        if (this.layer.occ[j] || this.layer.surf[j] || this.layer.rug[j] || this.layer.ground[j]) break;
        if (!this.edgeOpen(x, y, fx, fy, l)) break;
        top = l;
      }
      return top;
    }
    elevatorCheck(type, x, y, r, lv, lotId) {
      lv = lv || 0;
      const c = this.canPlace(type, x, y, r, { lot: lotId, lv });
      if (!c.ok) return c;
      const fx = x + DX[r], fy = y + DY[r];
      if (!this.walkable(fx, fy, lv) || this.lotAt(fx, fy) !== lotId) return { ok: false, reason: 'Перед дверью лифта нужен проход' };
      if (!this.edgeOpen(x, y, fx, fy, lv)) return { ok: false, reason: 'Мешает стена' };
      const top = this.elevatorTop(x, y, r, lv);
      if (top === lv) return { ok: false, reason: 'На этаже выше нужен пол и в шахте, и у двери' };
      return { ok: true, top };
    }
    supported(x, y, lv) {
      if (!lv) return true;
      const ok = (px, py) => this.inb(px, py) && this.indoor(px, py, lv - 1);
      if (ok(x, y)) return true;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (ok(x + dx, y + dy)) return true;
      return false;
    }
    poolLadders(area) {
      const keys = new Set(area.map(p => p[0] + ',' + p[1]));
      const out = [];
      for (const ob of this.objects.values()) if (OBJECTS[ob.t].poolEdge && keys.has(ob.x + ',' + ob.y)) out.push(ob);
      return out;
    }
    linkOf(a, b) {
      this.ensureLinks();
      const list = this.links.get(a);
      return list ? list.find(l => l.to === b) || null : null;
    }
    nodeOk(ni, lv, ignore) {
      const i = ni - lv * this.n;
      if (!lv) { if (WALKABLE[this.terrain[i]] !== 1) return false; }
      else if (!this.floor[ni]) return false;
      const oc = this.layer.occ[ni];
      return !oc || oc === ignore;
    }

    findPath(sx, sy, goals, opt) {
      opt = opt || {};
      const W = this.W, H = this.H, n = this.n;
      const slv = Math.max(0, Math.min(this.L - 1, opt.lv || 0));
      if (!this.inb(sx, sy) || !goals || !goals.length) return null;
      this.ensureLinks();
      const pf = this.pf;
      pf.gen = (pf.gen + 1) >>> 0;
      if (pf.gen === 0) { pf.seen.fill(0); pf.shut.fill(0); pf.gen = 1; }
      const gen = pf.gen;
      const goalSet = new Set();
      const gl = [];
      for (const g of goals) {
        if (!this.inb(g[0], g[1])) continue;
        const gi = this.li(g[0], g[1], g[2]);
        if (!goalSet.has(gi)) { goalSet.add(gi); gl.push(g); }
      }
      if (!gl.length) return null;
      const start = this.li(sx, sy, slv);
      if (goalSet.has(start)) return [[sx, sy, slv]];
      const hasLinks = this.links.size > 0;
      const hfun = (x, y, l) => {
        let best = 1e9;
        for (let k = 0; k < gl.length && k < 12; k++) {
          const dx = Math.abs(gl[k][0] - x), dy = Math.abs(gl[k][1] - y);
          const h = (dx > dy ? dx + dy * 0.4142 : dy + dx * 0.4142) + Math.abs((gl[k][2] || 0) - l) * 3;
          if (h < best) best = h;
        }
        return best;
      };
      const heap = new Heap();
      pf.g[start] = 0; pf.from[start] = -1; pf.seen[start] = gen;
      heap.push(hfun(sx, sy, slv), start);
      const maxIter = opt.maxIter || 70000;
      const ignore = opt.ignoreObj || 0;
      let iter = 0, found = -1;
      while (heap.size) {
        const cur = heap.pop();
        if (pf.shut[cur] === gen) continue;
        pf.shut[cur] = gen;
        if (goalSet.has(cur)) { found = cur; break; }
        if (++iter > maxIter) break;
        const cl = (cur / n) | 0, ci = cur - cl * n;
        const cx = ci % W, cy = (ci / W) | 0;
        const base = cl * n;
        for (let k = 0; k < 8; k++) {
          const ddx = k < 4 ? DX[k] : (k === 4 || k === 7 ? 1 : -1);
          const ddy = k < 4 ? DY[k] : (k < 6 ? -1 : 1);
          const nx = cx + ddx, ny = cy + ddy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const ni = base + ny * W + nx;
          if (pf.shut[ni] === gen) continue;
          const isGoal = goalSet.has(ni);
          if (!isGoal) { if (!this.nodeOk(ni, cl, ignore)) continue; }
          else if (cl === 0 ? WALKABLE[this.terrain[ni]] !== 1 : !this.floor[ni]) continue;
          if (!this.canStep(cx, cy, nx, ny, cl)) continue;
          const step = (ddx && ddy ? 1.4142 : 1) * (cl ? 1 : TER_COST[this.terrain[ni - base]]);
          const ng = pf.g[cur] + step;
          if (pf.seen[ni] === gen && ng >= pf.g[ni]) continue;
          pf.seen[ni] = gen; pf.g[ni] = ng; pf.from[ni] = cur;
          heap.push(ng + hfun(nx, ny, cl), ni);
        }
        if (hasLinks) {
          const ls = this.links.get(cur);
          if (ls) for (const L of ls) {
            const ni = L.to;
            if (pf.shut[ni] === gen) continue;
            const nl = (ni / n) | 0;
            if (!goalSet.has(ni) && !this.nodeOk(ni, nl, ignore)) continue;
            const ng = pf.g[cur] + L.cost;
            if (pf.seen[ni] === gen && ng >= pf.g[ni]) continue;
            pf.seen[ni] = gen; pf.g[ni] = ng; pf.from[ni] = cur;
            const nii = ni - nl * n;
            heap.push(ng + hfun(nii % W, (nii / W) | 0, nl), ni);
          }
        }
      }
      if (found < 0) return null;
      const path = [];
      for (let c = found; c >= 0; c = pf.from[c]) { const l = (c / n) | 0, i = c - l * n; path.push([i % W, (i / W) | 0, l]); }
      path.reverse();
      return path;
    }

    nearestWalkable(x, y, maxR, pred, lv) {
      x = Math.round(x); y = Math.round(y);
      for (let r = 0; r <= (maxR || 12); r++) {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const nx = x + dx, ny = y + dy;
          if (this.walkable(nx, ny, lv) && (!pred || pred(nx, ny))) return lv ? [nx, ny, lv] : [nx, ny];
        }
      }
      return null;
    }

    footTiles(def, x, y, r) {
      const f = footprint(def, r);
      const out = [];
      for (let j = 0; j < f[1]; j++) for (let i = 0; i < f[0]; i++) out.push([x + i, y + j]);
      return out;
    }
    tilesOf(ob) { return this.footTiles(OBJECTS[ob.t], ob.x, ob.y, ob.r); }

    canPlace(type, x, y, r, opt) {
      opt = opt || {};
      const def = OBJECTS[type];
      if (!def) return { ok: false, reason: 'Неизвестный предмет' };
      const lv = opt.lv || 0;
      if (lv < 0 || lv >= this.L) return { ok: false, reason: 'Слишком высоко' };
      const lay = layerOf(def);
      const tiles = this.footTiles(def, x, y, r);
      for (const [tx, ty] of tiles) {
        if (!this.inb(tx, ty)) return { ok: false, reason: 'За пределами участка' };
        if (opt.lot !== undefined && this.lotAt(tx, ty) !== opt.lot) return { ok: false, reason: 'За пределами участка' };
        const i = ty * this.W + tx;
        const j = lv * this.n + i;
        if (def.poolEdge) {
          const bx = tx - DX[r], by = ty - DY[r];
          if (lv || this.terrain[i] !== TER.pool) return { ok: false, reason: 'Лестницу ставят на край бассейна' };
          if (!this.walkable(bx, by) || this.isPool(bx, by)) return { ok: false, reason: 'Сзади должна быть земля' };
          const cur = this.layer.ground[i];
          if (cur && cur !== opt.ignore) return { ok: false, reason: 'Место занято' };
          continue;
        }
        if (lv === 0) {
          const t = this.terrain[i];
          if (!def.water && (t === TER.pond || t === TER.sea)) return { ok: false, reason: 'Нельзя ставить на воду' };
          if (t === TER.pool) return { ok: false, reason: 'Здесь бассейн' };
        } else if (!this.floor[j]) return { ok: false, reason: 'Нужен пол' };
        if (lay === 'occ') {
          const o = this.layer.occ[j];
          if (o && o !== opt.ignore) return { ok: false, reason: 'Место занято' };
          if (this.layer.surf[j] && this.layer.surf[j] !== opt.ignore) return { ok: false, reason: 'Место занято' };
        } else if (lay === 'surf') {
          const base = this.objects.get(this.layer.occ[j]);
          if (!base || !OBJECTS[base.t].surface) return { ok: false, reason: 'Нужна поверхность: стол или стойка' };
          const cur = this.layer.surf[j];
          if (cur && cur !== opt.ignore) return { ok: false, reason: 'На поверхности уже что-то стоит' };
        } else if (lay === 'wall') {
          const w = this.wallBehind(tx, ty, r, lv);
          if (!w || w.fence) return { ok: false, reason: 'Нужна стена' };
          if (w.door || w.win) return { ok: false, reason: 'Здесь дверь или окно' };
          const cur = this.wallSlots.get(slotKey(tx, ty, r, lv));
          if (cur && cur !== opt.ignore) return { ok: false, reason: 'На стене уже что-то висит' };
        } else {
          const cur = this.layer[lay][j];
          if (cur && cur !== opt.ignore) return { ok: false, reason: 'Место занято' };
        }
      }
      if (lay === 'occ' && tiles.length > 1) {
        for (const [tx, ty] of tiles) {
          for (const [ux, uy] of tiles) {
            if (Math.abs(tx - ux) + Math.abs(ty - uy) === 1 && this.wallBetween(tx, ty, ux, uy, lv)) return { ok: false, reason: 'Мешает стена' };
          }
        }
      }
      return { ok: true };
    }

    placeObject(type, x, y, r, props) {
      const def = OBJECTS[type];
      const id = props && props.id ? props.id : this.nextId++;
      if (id >= this.nextId) this.nextId = id + 1;
      const ob = Object.assign({ id, t: type, x, y, r: r || 0, lv: 0, lot: this.lotAt(x, y), col: def.col.slice(), st: {}, dirt: 0, broken: false, upg: {}, use: {}, value: def.price }, props || {});
      ob.id = id;
      ob.lv = ob.lv || 0;
      ob.layer = layerOf(def);
      this.objects.set(id, ob);
      this.stamp(ob, id);
      this.version++;
      if (def.stairs || def.elevator) this.linkVersion++;
      this.envCache.clear();
      return ob;
    }
    stamp(ob, val) {
      const def = OBJECTS[ob.t];
      const tiles = this.footTiles(def, ob.x, ob.y, ob.r);
      if (ob.layer === 'wall') {
        for (const [tx, ty] of tiles) {
          const key = slotKey(tx, ty, ob.r, ob.lv);
          if (val) this.wallSlots.set(key, ob.id); else if (this.wallSlots.get(key) === ob.id) this.wallSlots.delete(key);
        }
        return;
      }
      const arr = this.layer[ob.layer];
      for (const lv of objLevels(ob)) {
        if (lv >= this.L) continue;
        for (const [tx, ty] of tiles) {
          if (!this.inb(tx, ty)) continue;
          const i = this.li(tx, ty, lv);
          if (val) arr[i] = val; else if (arr[i] === ob.id) arr[i] = 0;
        }
      }
    }
    removeObject(id) {
      const ob = this.objects.get(id);
      if (!ob) return null;
      this.stamp(ob, 0);
      if (ob.layer === 'occ') {
        for (const [tx, ty] of this.tilesOf(ob)) {
          const si = this.inb(tx, ty) ? this.layer.surf[this.li(tx, ty, ob.lv)] : 0;
          if (si) this.removeObject(si);
        }
      }
      this.objects.delete(id);
      this.version++;
      const def = OBJECTS[ob.t];
      if (def.stairs || def.elevator) this.linkVersion++;
      this.envCache.clear();
      return ob;
    }
    moveObject(id, x, y, r, lv) {
      const ob = this.objects.get(id);
      if (!ob) return false;
      const surf = [];
      if (ob.layer === 'occ') {
        for (const [tx, ty] of this.tilesOf(ob)) {
          const si = this.layer.surf[this.li(tx, ty, ob.lv)];
          if (si) surf.push([si, tx - ob.x, ty - ob.y]);
        }
      }
      this.stamp(ob, 0);
      const dx = x - ob.x, dy = y - ob.y;
      ob.x = x; ob.y = y; ob.r = r; ob.lot = this.lotAt(x, y);
      if (lv !== undefined) ob.lv = lv;
      this.stamp(ob, ob.id);
      for (const [si] of surf) {
        const so = this.objects.get(si);
        if (!so) continue;
        this.stamp(so, 0);
        so.x += dx; so.y += dy; so.lot = ob.lot; so.lv = ob.lv;
        if (r !== so.r && OBJECTS[so.t].size[0] === 1) so.r = r;
        this.stamp(so, so.id);
      }
      this.version++;
      const def = OBJECTS[ob.t];
      if (def.stairs || def.elevator) this.linkVersion++;
      this.envCache.clear();
      return true;
    }

    objAt(x, y, lay, lv) {
      if (!this.inb(x, y) || (lv || 0) >= this.L) return null;
      const id = this.layer[lay || 'occ'][this.li(x, y, lv)];
      return id ? this.objects.get(id) : null;
    }
    surfaceBase(x, y, lv) { return this.objAt(x, y, 'occ', lv); }
    objectsNear(x, y, r, pred) {
      const out = [];
      for (const ob of this.objects.values()) {
        if (Math.abs(ob.x - x) > r + 3 || Math.abs(ob.y - y) > r + 3) continue;
        if (!pred || pred(ob)) out.push(ob);
      }
      return out;
    }
    objectsInLot(lotId, pred) {
      const out = [];
      for (const ob of this.objects.values()) if (ob.lot === lotId && (!pred || pred(ob))) out.push(ob);
      return out;
    }
    center(ob) {
      const f = footprint(OBJECTS[ob.t], ob.r);
      return [ob.x + f[0] / 2, ob.y + f[1] / 2];
    }

    computeRooms() {
      const W = this.W, H = this.H, n = this.n;
      const room = this.room;
      room.fill(-1);
      const rooms = [{ id: 0, outdoor: true, tiles: 0, lot: -1, lv: 0 }];
      const used = new Set([0]);
      for (const wl of this.walls) if (wl && !wl.fence) used.add(wl.lv || 0);
      const stack = [];
      for (let lv = 0; lv < this.L; lv++) {
        const base = lv * n;
        if (!used.has(lv)) { room.fill(0, base, base + n); continue; }
        const fill = (sx, sy, id) => {
          stack.length = 0;
          stack.push(sy * W + sx);
          room[base + sy * W + sx] = id;
          let count = 0;
          const lotCount = new Map();
          while (stack.length) {
            const c = stack.pop();
            count++;
            const lt = this.lot[c];
            lotCount.set(lt, (lotCount.get(lt) || 0) + 1);
            const x = c % W, y = (c / W) | 0;
            for (let k = 0; k < 4; k++) {
              const nx = x + DX[k], ny = y + DY[k];
              if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
              const ni = ny * W + nx;
              if (room[base + ni] !== -1) continue;
              const w = this.wallBetween(x, y, nx, ny, lv);
              if (w && !w.fence) continue;
              room[base + ni] = id;
              stack.push(ni);
            }
          }
          let bestLot = -1, bestN = -1;
          for (const [l, k] of lotCount) if (k > bestN) { bestN = k; bestLot = l; }
          return { count, lot: bestLot };
        };
        const out = fill(0, 0, 0);
        if (lv === 0) rooms[0].tiles = out.count;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (room[base + y * W + x] !== -1) continue;
          const id = rooms.length;
          const r = fill(x, y, id);
          rooms.push({ id, outdoor: false, tiles: r.count, lot: r.lot, lv });
        }
      }
      this.rooms = rooms;
      this.envCache.clear();
      this.version++;
    }

    roomEnv(id) {
      if (this.envCache.has(id)) return this.envCache.get(id);
      const rm = this.rooms[id];
      if (!rm || rm.outdoor) { this.envCache.set(id, { score: 0, dirt: 0 }); return this.envCache.get(id); }
      let env = 0, dirt = 0, lux = 0;
      for (const ob of this.objects.values()) {
        if ((ob.lv || 0) !== (rm.lv || 0)) continue;
        const [cx, cy] = this.center(ob);
        const tx = Math.floor(cx - 0.01), ty = Math.floor(cy - 0.01);
        const rid = this.roomAt(ob.layer === 'wall' ? ob.x : tx, ob.layer === 'wall' ? ob.y : ty, ob.lv);
        if (rid !== id) continue;
        const def = OBJECTS[ob.t];
        env += def.env || 0;
        if (ob.art) env += ob.art;
        if (def.price > 1000) lux++;
        if (def.dirtyDish || def.pile) dirt += 2;
        if (def.puddle) dirt += 2;
        if (ob.dirt > 60) dirt += 1;
        if (def.trash && ob.st.fill >= (def.trash || 8)) dirt += 2;
      }
      const size = Math.max(12, rm.tiles);
      const score = (env - dirt) * 12 / size;
      const res = { score, dirt, lux };
      this.envCache.set(id, res);
      return res;
    }

    frontDoorOf(lot) {
      let best = null, bd = 1e9;
      const c = lot.curb || [lot.x + (lot.w >> 1), lot.y + lot.h];
      for (const wl of this.walls) {
        if (!wl || !wl.door || wl.fence || wl.lot !== lot.id || (wl.lv || 0) !== 0) continue;
        const a = wl.o === 'h' ? [wl.x, wl.y - 1] : [wl.x - 1, wl.y];
        const b = [wl.x, wl.y];
        const ia = this.indoor(a[0], a[1]), ib = this.indoor(b[0], b[1]);
        if (ia === ib) continue;
        const out = ia ? b : a, inn = ia ? a : b;
        if (!this.walkable(out[0], out[1]) || !this.walkable(inn[0], inn[1])) continue;
        const d = Math.hypot(out[0] - c[0], out[1] - c[1]);
        if (d < bd) { bd = d; best = { out, inn }; }
      }
      return best;
    }

    lotEntrance(lotId) {
      const lot = this.lots[lotId];
      if (!lot) return null;
      return lot.curb || [lot.x + (lot.w >> 1), lot.y + (lot.h >> 1)];
    }
  }

  Object.assign(S, { World, TER, TER_NAMES, FLOOR_LIST, FLOOR_ID, LEVELS, footprint, layerOf, slotKey, objLevels });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
