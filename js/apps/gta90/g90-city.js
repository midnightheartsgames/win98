(function (G) {
  'use strict';
  const { T, RNG, hash2, clamp, decodePts, ringArea, inRing, inRings, ringBox, cumLen, pointAt, projectOn, offsetLine, segDist, segT, SpatialHash } = G;

  const GR = { VOID: 0, GRASS: 1, ROAD: 2, WALK: 3, WATER: 4, PLAZA: 5, YARD: 6, RAIL: 7, SLOPE: 8, STAIRS: 9, SAND: 10, PIER: 11, FIELD: 12, PARAPET: 13, BRIDGE: 14, DIRT: 15, TRACK: 16, BRICKS: 17 };
  const PED_OK = new Uint8Array(20);
  const CAR_OK = new Uint8Array(20);
  const DRAG = new Float32Array(20).fill(1);
  for (const g of [GR.GRASS, GR.ROAD, GR.WALK, GR.PLAZA, GR.YARD, GR.RAIL, GR.SLOPE, GR.STAIRS, GR.SAND, GR.PIER, GR.FIELD, GR.BRIDGE, GR.DIRT, GR.TRACK, GR.BRICKS]) PED_OK[g] = 1;
  for (const g of [GR.GRASS, GR.ROAD, GR.WALK, GR.PLAZA, GR.YARD, GR.RAIL, GR.SAND, GR.PIER, GR.FIELD, GR.BRIDGE, GR.DIRT, GR.TRACK, GR.BRICKS, GR.WATER]) CAR_OK[g] = 1;
  DRAG[GR.GRASS] = 2.2; DRAG[GR.SAND] = 3.2; DRAG[GR.RAIL] = 1.6; DRAG[GR.DIRT] = 1.5; DRAG[GR.WALK] = 1.1;

  const AREA_GR = { w: GR.WATER, p: GR.GRASS, g: GR.GRASS, v: GR.GRASS, f: GR.GRASS, q: GR.PLAZA, k: GR.YARD, c: GR.DIRT, r: GR.RAIL, s: GR.GRASS, b: GR.SAND, y: GR.YARD };
  const CELL = 16;
  const SEG = { BUILDING: 1, FENCE: 2, WATER: 4, EDGE: 8 };
  const FLOOR_M = 3.1;

  function parseRecord(rec) {
    const c = rec.indexOf(':');
    return [rec.slice(0, c).split(','), rec.slice(c + 1)];
  }

  class City {
    constructor(districts) {
      const list = districts || G.DISTRICTS || [];
      if (!list.length) throw new Error('no district data');
      const d0 = list[0];
      this.M = d0.scale;
      this.frame = d0.frame;
      this.origin = d0.origin;
      let x1 = 0, y1 = 0;
      for (const d of list) {
        const ox = (d.origin[0] - d0.origin[0]) * this.M, oy = (d.origin[1] - d0.origin[1]) * this.M;
        x1 = Math.max(x1, ox + d.size[0]); y1 = Math.max(y1, oy + d.size[1]);
      }
      this.W = Math.ceil(x1); this.H = Math.ceil(y1);
      this.cell = CELL;
      this.CW = Math.ceil(this.W / CELL); this.CH = Math.ceil(this.H / CELL);
      this.names = [];
      this.roads = []; this.decor = []; this.service = []; this.buildings = []; this.areas = []; this.rails = []; this.barriers = []; this.pois = [];
      this.trees = [];
      this.props = [];
      this.places = {}; this.garages = {}; this.spots = {}; this.parking = [];
      this.zones = []; this.closed = null;
      this.plays = []; this.margins = [];
      this.rng = new RNG(1990);
      for (const d of list) this.load(d, (d.origin[0] - d0.origin[0]) * this.M, (d.origin[1] - d0.origin[1]) * this.M);
      this.build();
    }

    load(d, ox, oy) {
      const nameBase = this.names.length;
      for (const n of d.names) this.names.push(n);
      const nameOf = i => (i >= 0 ? this.names[nameBase + i] : '') || '';
      const pts = s => { const p = decodePts(s); if (ox || oy) for (let i = 0; i < p.length; i += 2) { p[i] += ox; p[i + 1] += oy; } return p; };
      this.plays.push(pts(d.play));
      this.margins.push(pts(d.margin));
      for (const rec of d.roads) {
        const [f, g] = parseRecord(rec);
        const v = f.map(x => parseInt(x, 36));
        const flags = v[6];
        const r = { pts: pts(g), name: nameOf(v[0]), cls: v[1], lf: v[2], lb: v[3], w: v[4], sl: flags & 4 ? v[5] : 0, sr: flags & 8 ? v[5] : 0, bridge: !!(flags & 1), play: !!(flags & 2), median: !!(flags & 16) };
        if (r.lb === 0 && r.median) r.sl = 0;
        (r.play ? this.roads : this.decor).push(r);
      }
      for (const rec of d.service) { const [f, g] = parseRecord(rec); this.service.push({ w: parseInt(f[0], 36), pts: pts(g) }); }
      for (const rec of d.buildings) {
        const [f, g] = parseRecord(rec);
        const rings = g.split(';').map(pts).filter(r => r.length >= 6);
        if (!rings.length) continue;
        const lv = +f[0] || 1;
        const b = { id: this.buildings.length, rings, lv, style: f[1] || 'o', roof: f[2] || 'f', name: nameOf(+f[3]), wall: f[4] || null, roofC: f[5] || null, kind: f[6] || '' };
        this.buildings.push(b);
      }
      for (const rec of d.areas) {
        const [f, g] = parseRecord(rec);
        const rings = g.split(';').map(pts).filter(r => r.length >= 6);
        if (rings.length) this.areas.push({ kind: f[0], name: f[1] ? nameOf(parseInt(f[1], 36)) : '', rings, bb: ringBox(rings[0]) });
      }
      for (const rec of d.rails) { const [f, g] = parseRecord(rec); this.rails.push({ kind: f[0], pts: pts(g) }); }
      for (const rec of d.barriers) { const [f, g] = parseRecord(rec); this.barriers.push({ kind: f[0], pts: pts(g) }); }
      const tp = pts(d.trees);
      for (let i = 0; i + 1 < tp.length; i += 2) this.trees.push([tp[i], tp[i + 1]]);
      for (const rec of d.pois) { const [f, g] = parseRecord(rec); const p = pts(g); this.pois.push({ kind: f[0], name: nameOf(+f[1]), x: p[0], y: p[1] }); }
    }

    fromGeo(lat, lon) {
      const fr = this.frame;
      const KX = 111320 * Math.cos(fr.lat * Math.PI / 180), KY = 110540;
      const r = fr.rot * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
      const x = (lon - fr.lon) * KX, y = -(lat - fr.lat) * KY;
      return [((x * c - y * s) - this.origin[0]) * this.M, ((x * s + y * c) - this.origin[1]) * this.M];
    }

    toGeo(px, py) {
      const fr = this.frame;
      const KX = 111320 * Math.cos(fr.lat * Math.PI / 180), KY = 110540;
      const r = fr.rot * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
      const X = px / this.M + this.origin[0], Y = py / this.M + this.origin[1];
      const ex = X * c + Y * s, ey = -X * s + Y * c;
      return [fr.lat - ey / KY, fr.lon + ex / KX];
    }

    build() {
      const M = this.M;
      for (const b of this.buildings) {
        b.bb = ringBox(b.rings[0]);
        let cx = 0, cy = 0, n = 0;
        const r = b.rings[0];
        for (let i = 0; i < r.length; i += 2) { cx += r[i]; cy += r[i + 1]; n++; }
        b.cx = cx / n; b.cy = cy / n;
        b.area = Math.abs(ringArea(r)) / (M * M);
        b.seed = hash2(Math.round(b.cx), Math.round(b.cy), 3);
        b.h = b.lv * FLOOR_M * M;
      }
      this.net = new G.Net(this.roads, { M, signals: this.pois.filter(p => p.kind === 'sig').map(p => [p.x, p.y]) });
      this.rasterize();
      this.doorSegs = [];
      if (G.Sites) G.Sites.place(this);
      this.trimBarriers();
      this.yards = [];
      if (G.Yards) this.yardStats = G.Yards.place(this);
      this.collisionIndex();
      this.propsPass();
      if (G.Sites) G.Sites.apply(this);
      this.indexRender();
      this.indexProps();
    }

    addBuilding(rings, o) {
      const M = this.M;
      const b = { id: this.buildings.length, rings, lv: o.lv || 1, style: o.style || 'g', roof: o.roof || 'f', name: o.name || '', wall: o.wall || null, roofC: o.roofC || null, kind: o.kind || '' };
      b.bb = ringBox(rings[0]);
      let cx = 0, cy = 0, n = 0;
      for (let i = 0; i < rings[0].length; i += 2) { cx += rings[0][i]; cy += rings[0][i + 1]; n++; }
      b.cx = cx / n; b.cy = cy / n;
      b.area = Math.abs(ringArea(rings[0])) / (M * M);
      b.seed = hash2(Math.round(b.cx), Math.round(b.cy), 3);
      b.h = b.lv * FLOOR_M * M;
      this.buildings.push(b);
      this.fillRings(this.solid, CELL, this.CW, this.CH, rings, 1);
      this.bHash.insert(b.id, b.bb[0], b.bb[1], b.bb[2], b.bb[3]);
      return b;
    }

    inPlay(x, y) { for (const p of this.plays) if (inRing(x, y, p)) return true; return false; }
    inMargin(x, y) { for (const p of this.margins) if (inRing(x, y, p)) return true; return false; }

    fillRings(grid, cw, gw, gh, rings, val, keep) {
      let y0 = Infinity, y1 = -Infinity;
      for (const r of rings) for (let i = 1; i < r.length; i += 2) { if (r[i] < y0) y0 = r[i]; if (r[i] > y1) y1 = r[i]; }
      const r0 = Math.max(0, Math.floor(y0 / cw)), r1 = Math.min(gh - 1, Math.floor(y1 / cw));
      const xs = [];
      for (let row = r0; row <= r1; row++) {
        const y = (row + 0.5) * cw;
        xs.length = 0;
        for (const r of rings) for (let i = 0, n = r.length, j = n - 2; i < n; j = i, i += 2) {
          const ya = r[j + 1], yb = r[i + 1];
          if ((ya > y) !== (yb > y)) xs.push(r[j] + (r[i] - r[j]) * (y - ya) / (yb - ya));
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const c0 = Math.max(0, Math.ceil(xs[k] / cw - 0.5)), c1 = Math.min(gw - 1, Math.floor(xs[k + 1] / cw - 0.5));
          for (let c = c0; c <= c1; c++) { const i = row * gw + c; if (!keep || !keep(grid[i])) grid[i] = val; }
        }
      }
    }

    strokeLine(grid, cw, gw, gh, p, hw, val, keep) {
      for (let i = 0; i + 3 < p.length; i += 2) {
        const ax = p[i], ay = p[i + 1], bx = p[i + 2], by = p[i + 3];
        const c0 = Math.max(0, Math.floor((Math.min(ax, bx) - hw) / cw)), c1 = Math.min(gw - 1, Math.floor((Math.max(ax, bx) + hw) / cw));
        const r0 = Math.max(0, Math.floor((Math.min(ay, by) - hw) / cw)), r1 = Math.min(gh - 1, Math.floor((Math.max(ay, by) + hw) / cw));
        for (let row = r0; row <= r1; row++) for (let c = c0; c <= c1; c++) {
          if (segDist((c + 0.5) * cw, (row + 0.5) * cw, ax, ay, bx, by) > hw) continue;
          const k = row * gw + c;
          if (!keep || !keep(grid[k])) grid[k] = val;
        }
      }
    }

    rasterize() {
      const cw = CELL, gw = this.CW, gh = this.CH;
      const surf = this.surf = new Uint8Array(gw * gh);
      for (const m of this.margins) this.fillRings(surf, cw, gw, gh, [m], GR.YARD);
      const order = ['k', 'y', 'g', 'v', 'p', 'f', 's', 'b', 'c', 'q', 'r', 'w'];
      for (const k of order) for (const a of this.areas) if (a.kind === k) this.fillRings(surf, cw, gw, gh, a.rings, AREA_GR[k] || GR.YARD);
      const isWater = v => v === GR.WATER;
      for (const s of this.service) this.strokeLine(surf, cw, gw, gh, s.pts, s.w / 2, GR.YARD, isWater);
      const all = this.roads.concat(this.decor);
      for (const r of all) { const side = Math.max(r.sl, r.sr); if (side) this.strokeLine(surf, cw, gw, gh, r.pts, r.w / 2 + side, GR.WALK, v => v === GR.WATER && !r.bridge); }
      for (const r of all) this.strokeLine(surf, cw, gw, gh, r.pts, r.w / 2, r.bridge ? GR.BRIDGE : GR.ROAD);
      for (const n of this.net.nodes) if (n.poly) this.fillRings(surf, cw, gw, gh, [n.poly], GR.ROAD);
      for (const r of this.rails) if (r.kind === 'r') this.strokeLine(surf, cw, gw, gh, r.pts, 1.6 * this.M, GR.RAIL, v => v === GR.ROAD || v === GR.BRIDGE);
      const solid = this.solid = new Uint8Array(gw * gh);
      for (const b of this.buildings) this.fillRings(solid, cw, gw, gh, b.rings, 1);
      this.bHash = new SpatialHash(128);
      for (const b of this.buildings) this.bHash.insert(b.id, b.bb[0], b.bb[1], b.bb[2], b.bb[3]);
      const pc = 64, pw = Math.ceil(this.W / pc), ph = Math.ceil(this.H / pc);
      const play = this.playMask = new Uint8Array(pw * ph);
      this.pmW = pw; this.pmH = ph;
      for (const p of this.plays) this.fillRings(play, pc, pw, ph, [p], 1);
    }

    trimBarriers() {
      const out = [], step = 2 * this.M, net = this.net, near = 2.4 * this.M;
      const onRoad = (x, y) => { const g = this.surfAt(x, y); return g === GR.ROAD || g === GR.BRIDGE || !!net.nearestLane(x, y, null, near, true); };
      for (const b of this.barriers) {
        const p = b.pts;
        let run = [];
        const flush = () => { if (run.length >= 4) out.push(Object.assign({}, b, { pts: new Float32Array(run) })); run = []; };
        for (let i = 0; i + 3 < p.length; i += 2) {
          const ax = p[i], ay = p[i + 1], dx = p[i + 2] - ax, dy = p[i + 3] - ay;
          const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / step));
          const blocked = k => onRoad(ax + dx * (k + 0.5) / n, ay + dy * (k + 0.5) / n);
          let k = 0;
          while (k < n) {
            if (blocked(k)) { flush(); k++; continue; }
            let k1 = k;
            while (k1 + 1 < n && !blocked(k1 + 1)) k1++;
            if (!run.length) run.push(ax + dx * k / n, ay + dy * k / n);
            run.push(ax + dx * (k1 + 1) / n, ay + dy * (k1 + 1) / n);
            k = k1 + 1;
          }
        }
        flush();
      }
      this.barriers = out;
    }

    collisionIndex() {
      const M = this.M;
      const xs = [], kinds = [];
      const add = (ax, ay, bx, by, kind) => { if (Math.abs(ax - bx) + Math.abs(ay - by) < 0.5) return; xs.push(ax, ay, bx, by); kinds.push(kind); };
      const ring = (r, kind) => { for (let i = 0, n = r.length, j = n - 2; i < n; j = i, i += 2) add(r[j], r[j + 1], r[i], r[i + 1], kind); };
      const net = this.net, gap = 2.4 * M, step = 2 * M;
      const arch = (ax, ay, bx, by) => {
        const len = Math.hypot(bx - ax, by - ay);
        if (!net.nearestLane((ax + bx) / 2, (ay + by) / 2, null, len / 2 + gap, true)) { add(ax, ay, bx, by, SEG.BUILDING); return; }
        const n = Math.max(1, Math.ceil(len / step));
        let k0 = -1;
        for (let k = 0; k <= n; k++) {
          const open = k < n && !net.nearestLane(ax + (bx - ax) * (k + 0.5) / n, ay + (by - ay) * (k + 0.5) / n, null, gap, true);
          if (open && k0 < 0) k0 = k;
          if (!open && k0 >= 0) { add(ax + (bx - ax) * k0 / n, ay + (by - ay) * k0 / n, ax + (bx - ax) * k / n, ay + (by - ay) * k / n, SEG.BUILDING); k0 = -1; }
        }
      };
      for (const b of this.buildings) { if (!this.inMargin(b.cx, b.cy)) continue; for (const r of b.rings) for (let i = 0, n = r.length, j = n - 2; i < n; j = i, i += 2) arch(r[j], r[j + 1], r[i], r[i + 1]); }
      for (const b of this.barriers) { const p = b.pts; for (let i = 0; i + 3 < p.length; i += 2) add(p[i], p[i + 1], p[i + 2], p[i + 3], SEG.FENCE); }
      const decks = [];
      for (const r of this.roads.concat(this.decor)) if (r.bridge) decks.push(r);
      const underDeck = (x, y) => decks.some(r => { const p = r.pts; for (let i = 0; i + 3 < p.length; i += 2) if (segDist(x, y, p[i], p[i + 1], p[i + 2], p[i + 3]) < r.w / 2 + Math.max(r.sl, r.sr) + 4 * M) return true; return false; });
      for (const a of this.areas) {
        if (a.kind !== 'w') continue;
        for (const r of a.rings) for (let i = 0, n = r.length, j = n - 2; i < n; j = i, i += 2) {
          const ax = r[j], ay = r[j + 1], bx = r[i], by = r[i + 1];
          const L = Math.hypot(bx - ax, by - ay), steps = Math.max(1, Math.ceil(L / (6 * M)));
          for (let k = 0; k < steps; k++) {
            const t0 = k / steps, t1 = (k + 1) / steps;
            const x0 = ax + (bx - ax) * t0, y0 = ay + (by - ay) * t0, x1 = ax + (bx - ax) * t1, y1 = ay + (by - ay) * t1;
            if (underDeck((x0 + x1) / 2, (y0 + y1) / 2)) continue;
            add(x0, y0, x1, y1, SEG.WATER);
          }
        }
      }
      for (const r of decks) {
        if (!r.play) continue;
        for (const side of [1, -1]) {
          const off = offsetLine(r.pts, side * (r.w / 2 + Math.max(r.sl, r.sr, 1.2 * M)));
          for (let i = 0; i + 3 < off.length; i += 2) { const mx = (off[i] + off[i + 2]) / 2, my = (off[i + 1] + off[i + 3]) / 2; if (this.surfAt(mx, my) === GR.WATER || this.surfAt(mx + 6, my) === GR.WATER) add(off[i], off[i + 1], off[i + 2], off[i + 3], SEG.FENCE); }
        }
      }
      for (const p of this.plays) ring(p, SEG.EDGE);
      this.segXY = new Float32Array(xs);
      this.segKind = new Uint8Array(kinds);
      this.segHash = new SpatialHash(128);
      for (let i = 0; i < kinds.length; i++) {
        const ax = xs[i * 4], ay = xs[i * 4 + 1], bx = xs[i * 4 + 2], by = xs[i * 4 + 3];
        this.segHash.insert(i, Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by));
      }
    }

    collide(x, y, r, mask, out) {
      const o = out || { x: 0, y: 0, nx: 0, ny: 0, pen: 0, hit: 0 };
      o.x = 0; o.y = 0; o.pen = 0; o.hit = 0;
      const buf = this._cb || (this._cb = []);
      const S = this.segXY, K = this.segKind;
      let px = x, py = y;
      for (let pass = 0; pass < 2; pass++) {
        let moved = false;
        for (const i of this.segHash.query(px - r, py - r, px + r, py + r, buf)) {
          if (!(K[i] & mask)) continue;
          const ax = S[i * 4], ay = S[i * 4 + 1], bx = S[i * 4 + 2], by = S[i * 4 + 3];
          const t = segT(px, py, ax, ay, bx, by);
          const qx = ax + (bx - ax) * t, qy = ay + (by - ay) * t;
          let dx = px - qx, dy = py - qy;
          let d = Math.hypot(dx, dy);
          if (d >= r) continue;
          if (d < 1e-4) { const ex = bx - ax, ey = by - ay, l = Math.hypot(ex, ey) || 1; dx = -ey / l; dy = ex / l; d = 0; }
          else { dx /= d; dy /= d; }
          const pen = r - d;
          px += dx * pen; py += dy * pen;
          if (pen > o.pen) { o.pen = pen; o.nx = dx; o.ny = dy; }
          o.hit |= K[i];
          moved = true;
        }
        for (const d of this.doorSegs) {
          if (!d.closed) continue;
          const t = segT(px, py, d.ax, d.ay, d.bx, d.by);
          const qx = d.ax + (d.bx - d.ax) * t, qy = d.ay + (d.by - d.ay) * t;
          let dx = px - qx, dy = py - qy;
          const dd = Math.hypot(dx, dy);
          if (dd >= r || dd < 1e-4) continue;
          dx /= dd; dy /= dd;
          const pen = r - dd;
          px += dx * pen; py += dy * pen;
          if (pen > o.pen) { o.pen = pen; o.nx = dx; o.ny = dy; }
          o.hit |= SEG.BUILDING;
          moved = true;
        }
        if (!moved) break;
      }
      o.x = px - x; o.y = py - y;
      return o;
    }

    cross(x0, y0, x1, y1, mask) {
      const buf = this._xb || (this._xb = []);
      const S = this.segXY, K = this.segKind;
      const rx = x1 - x0, ry = y1 - y0;
      for (const i of this.segHash.query(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1), buf)) {
        if (!(K[i] & mask)) continue;
        const ax = S[i * 4], ay = S[i * 4 + 1], sx = S[i * 4 + 2] - ax, sy = S[i * 4 + 3] - ay;
        const den = rx * sy - ry * sx;
        if (Math.abs(den) < 1e-9) continue;
        const t = ((ax - x0) * sy - (ay - y0) * sx) / den, u = ((ax - x0) * ry - (ay - y0) * rx) / den;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
      }
      return false;
    }

    surfAt(x, y) {
      const c = Math.floor(x / CELL), r = Math.floor(y / CELL);
      if (c < 0 || r < 0 || c >= this.CW || r >= this.CH) return GR.VOID;
      return this.surf[r * this.CW + c];
    }
    solidAt(x, y) {
      const c = Math.floor(x / CELL), r = Math.floor(y / CELL);
      if (c < 0 || r < 0 || c >= this.CW || r >= this.CH) return true;
      return this.solid[r * this.CW + c] === 1 || this.buildingAt(x, y) !== null;
    }
    buildingAt(x, y) {
      let best = null;
      for (const id of this.bHash.query(x, y, x, y, this._bq || (this._bq = []))) {
        const b = this.buildings[id];
        if (x < b.bb[0] || x > b.bb[2] || y < b.bb[1] || y > b.bb[3] || !inRings(x, y, b.rings)) continue;
        if (!best || b.lv > best.lv) best = b;
      }
      return best;
    }
    playAt(x, y) {
      const c = Math.floor(x / 64), r = Math.floor(y / 64);
      if (c < 0 || r < 0 || c >= this.pmW || r >= this.pmH) return false;
      return this.playMask[r * this.pmW + c] === 1;
    }
    isWater(x, y) { return this.surfAt(x, y) === GR.WATER; }
    walkable(x, y) { const g = this.surfAt(x, y); return PED_OK[g] === 1 && !this.solidAt(x, y) && this.playAt(x, y); }
    drivable(x, y) { const g = this.surfAt(x, y); return CAR_OK[g] === 1 && g !== GR.WATER && !this.solidAt(x, y) && this.playAt(x, y); }

    losClear(x0, y0, x1, y1) { return !this.cross(x0, y0, x1, y1, SEG.BUILDING); }

    nearestPoint(x, y, pred, maxR) {
      const R = maxR || 30 * this.M;
      const step = 8;
      for (let r = 0; r <= R; r += step) {
        const n = Math.max(1, Math.round(2 * Math.PI * r / step));
        let best = null, bd = Infinity;
        for (let k = 0; k < n; k++) {
          const a = k / n * Math.PI * 2;
          const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
          if (!pred(px, py)) continue;
          const d = Math.hypot(px - x, py - y);
          if (d < bd) { bd = d; best = [px, py]; }
        }
        if (best) return best;
      }
      return null;
    }

    propsPass() {
      const M = this.M, rng = this.rng, net = this.net;
      const P = this.props;
      const treeOk = (x, y) => !this.solidAt(x, y) && this.surfAt(x, y) !== GR.ROAD && this.surfAt(x, y) !== GR.WATER && this.surfAt(x, y) !== GR.BRIDGE && this.surfAt(x, y) !== GR.RAIL;
      const tc = ['#3a6a2a', '#4a7a32', '#2e5a26', '#5a7a2a', '#46702e', '#3c6430'];
      const addTree = (x, y, big) => { if (!treeOk(x, y)) return; P.push({ type: 'tree', x, y, r: (big ? 11 : 8) + rng.next() * 6, c: rng.pick(tc), k: rng.next() < 0.18 ? 1 : 0 }); };
      for (const [x, y] of this.trees) addTree(x, y, true);
      for (const a of this.areas) {
        if (a.kind !== 'p' && a.kind !== 'f' && a.kind !== 'g') continue;
        const [x0, y0, x1, y1] = a.bb;
        const area = (x1 - x0) * (y1 - y0);
        const dens = a.kind === 'f' ? 1 / (55 * M * M) : a.kind === 'p' ? 1 / (110 * M * M) : 1 / (260 * M * M);
        const n = Math.min(900, Math.floor(area * dens));
        for (let k = 0; k < n; k++) {
          const x = x0 + rng.next() * (x1 - x0), y = y0 + rng.next() * (y1 - y0);
          if (!inRings(x, y, a.rings)) continue;
          if (this.surfAt(x, y) === GR.WALK || this.surfAt(x, y) === GR.PLAZA) continue;
          addTree(x, y, a.kind === 'f');
        }
      }
      for (let i = 0; i < this.CW * this.CH; i += 7) {
        if (this.surf[i] !== GR.YARD || this.solid[i] || rng.next() > 0.012) continue;
        const x = (i % this.CW + 0.5) * CELL, y = (Math.floor(i / this.CW) + 0.5) * CELL;
        if (this.playAt(x, y)) addTree(x, y, false);
      }
      for (const s of net.segs) {
        if (s.cls > 2) continue;
        for (const side of [1, -1]) {
          const w = side > 0 ? s.sr : s.sl;
          if (!w) continue;
          const off = offsetLine(s.pts, side * (s.w / 2 + 0.7 * M));
          const cum = cumLen(off);
          const L = cum[cum.length - 1];
          const step = 32 * M;
          for (let d = s.da + 8 * M + (side > 0 ? 0 : step / 2); d < L - s.db - 6 * M; d += step) {
            const q = pointAt(off, cum, d);
            if (this.solidAt(q[0], q[1])) continue;
            P.push({ type: 'lamp', x: q[0], y: q[1], a: q[2] + (side > 0 ? Math.PI / 2 : -Math.PI / 2) });
          }
          if (s.cls <= 1 && w >= 3.5 * M && s.len > 60 * M) {
            const offT = offsetLine(s.pts, side * (s.w / 2 + w * 0.62));
            const cumT = cumLen(offT);
            const LT = cumT[cumT.length - 1];
            for (let d = s.da + 5 * M; d < LT - s.db - 5 * M; d += 11 * M) {
              const q = pointAt(offT, cumT, d);
              if (rng.next() < 0.3) continue;
              addTree(q[0], q[1], true);
            }
          }
        }
      }
      for (const p of this.pois) {
        if (p.kind === 'tram' || p.kind === 'bus' || p.kind === 'trolley') {
          if (!this.playAt(p.x, p.y)) continue;
          const w = net.nearestWalk(p.x, p.y, 25 * M);
          if (!w) continue;
          const e = net.walkEdges[w.edge];
          const q = pointAt(e.pts, e.cum, w.s);
          P.push({ type: 'stop', x: q[0], y: q[1], a: q[2], tram: p.kind === 'tram', name: p.name });
        } else if (p.kind === 'fountain') P.push({ type: 'fountain', x: p.x, y: p.y, r: 3 * M });
      }
    }

    indexRender() {
      const C = 512;
      this.chunkSize = C;
      const idx = this.renderIndex = new Map();
      const put = (x0, y0, x1, y1, item) => {
        for (let cy = Math.floor(y0 / C); cy <= Math.floor(y1 / C); cy++) for (let cx = Math.floor(x0 / C); cx <= Math.floor(x1 / C); cx++) {
          const k = cx + ',' + cy;
          let a = idx.get(k);
          if (!a) { a = { areas: [], roads: [], nodes: [], service: [], rails: [], barriers: [], buildings: [], walks: [], trees: [], yards: [] }; idx.set(k, a); }
          a[item[0]].push(item[1]);
        }
      };
      const lineBox = (p, pad) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); } return [x0 - pad, y0 - pad, x1 + pad, y1 + pad]; };
      for (const a of this.areas) { const b = a.bb; put(b[0], b[1], b[2], b[3], ['areas', a]); }
      for (const s of this.net.segs) { const b = lineBox(s.pts, s.w / 2 + Math.max(s.sl, s.sr) + 6); put(b[0], b[1], b[2], b[3], ['roads', s]); }
      for (const r of this.decor) { const b = lineBox(r.pts, r.w / 2 + Math.max(r.sl, r.sr) + 6); put(b[0], b[1], b[2], b[3], ['roads', r]); }
      for (const n of this.net.nodes) if (n.poly) { const b = lineBox(n.poly, 40); put(b[0], b[1], b[2], b[3], ['nodes', n]); }
      for (const s of this.service) { const b = lineBox(s.pts, s.w); put(b[0], b[1], b[2], b[3], ['service', s]); }
      for (const r of this.rails) { const b = lineBox(r.pts, 20); put(b[0], b[1], b[2], b[3], ['rails', r]); }
      for (const r of this.barriers) { const b = lineBox(r.pts, 6); put(b[0], b[1], b[2], b[3], ['barriers', r]); }
      for (const y of this.yards) put(y.x - y.r - 40, y.y - y.r - 40, y.x + y.r + 40, y.y + y.r + 40, ['yards', y]);
      for (const e of this.net.walkEdges) if (e.kind === 'cross') { const b = lineBox(e.pts, 30); put(b[0], b[1], b[2], b[3], ['walks', e]); }
      for (const b of this.buildings) { const sh = b.h * 0.42 + 8; put(b.bb[0] - 4, b.bb[1] - 4, b.bb[2] + sh, b.bb[3] + sh, ['buildings', b]); }
      for (const p of this.props) if (p.type === 'tree') put(p.x - 30, p.y - 30, p.x + 40, p.y + 40, ['trees', p]);
    }

    indexProps() {
      this.propHash = new SpatialHash(64);
      this.props.forEach((p, k) => this.propHash.insert(k, p.x - 1, p.y - 1, p.x + 1, p.y + 1));
      const bc = 256;
      this.bChunks = new Map();
      for (const b of this.buildings) {
        for (let cy = Math.floor(b.bb[1] / bc); cy <= Math.floor(b.bb[3] / bc); cy++) for (let cx = Math.floor(b.bb[0] / bc); cx <= Math.floor(b.bb[2] / bc); cx++) {
          const k = cx + ',' + cy;
          if (!this.bChunks.has(k)) this.bChunks.set(k, []);
          this.bChunks.get(k).push(b.id);
        }
      }
      this.bChunkSize = bc;
    }

    propsNear(x, y, r, out) { return this.propHash.query(x - r, y - r, x + r, y + r, out); }

    zoneOf(x, y) {
      let best = null, bd = Infinity;
      for (const z of this.zones) {
        if (z.ring) { if (inRing(x, y, z.ring)) return z; continue; }
        const d = Math.hypot(x - z.x, y - z.y);
        if (d < z.r && d < bd) { bd = d; best = z; }
      }
      return best;
    }
    zoneName(x, y) { const z = this.zoneOf(x, y); return z ? z.name : (this.inPlay(x, y) ? 'Центр' : ''); }
    zoneKey(x, y) { const z = this.zoneOf(x, y); return z ? z.key : 'center'; }
    streetName(x, y) {
      const r = this.net.nearestLane(x, y, null, 28 * this.M);
      if (!r) return '';
      const lane = this.net.lanes[r.lane];
      return lane.seg >= 0 ? this.net.segs[lane.seg].name : '';
    }
    lightState(id, group, t) { return this.net.lightState(id, group, t); }
  }

  Object.assign(G, { City, GR, PED_OK, CAR_OK, DRAG, SEG, CELL, FLOOR_M });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
