/**
 * League of Legends 98 — Summoner's Rift layout: lanes, base, river, jungle corridors, camps, brush and structures
 * (blue side is defined, red is its point reflection), a walkability grid with terrain types and A* path finding.
 */
(function (L) {
  'use strict';
  const { MAP, CELL, GRID } = L.DATA;
  const refl = p => [MAP - p[0], MAP - p[1]];

  // terrain codes: 0 wall, 1 grass, 2 lane, 3 river, 4 base floor, 5 jungle path
  const T = { WALL: 0, GRASS: 1, LANE: 2, RIVER: 3, BASE: 4, PATH: 5 };

  const NEXUS = [1800, 12200];
  const FOUNTAIN = [620, 13380];
  // lane paths from the blue nexus to the red nexus (red minions walk them reversed)
  const LANES = {
    top: [[1800, 12200], [1500, 11000], [1500, 2400], [2400, 1500], [11000, 1500], [12200, 1800]],
    mid: [[1800, 12200], [2600, 11400], [11400, 2600], [12200, 1800]],
    bot: [[1800, 12200], [3000, 12500], [11600, 12500], [12500, 11600], [12500, 3000], [12200, 1800]]
  };
  const BLUE_STRUCT = [
    { kind: 'tower', lane: 'top', tier: 'outer', p: [1500, 4300] }, { kind: 'tower', lane: 'top', tier: 'inner', p: [1500, 7000] }, { kind: 'tower', lane: 'top', tier: 'inhib', p: [1500, 9700] },
    { kind: 'tower', lane: 'mid', tier: 'outer', p: [5900, 8100] }, { kind: 'tower', lane: 'mid', tier: 'inner', p: [4800, 9200] }, { kind: 'tower', lane: 'mid', tier: 'inhib', p: [3700, 10300] },
    { kind: 'tower', lane: 'bot', tier: 'outer', p: [9700, 12500] }, { kind: 'tower', lane: 'bot', tier: 'inner', p: [7000, 12500] }, { kind: 'tower', lane: 'bot', tier: 'inhib', p: [4300, 12500] },
    { kind: 'inhib', lane: 'top', p: [1500, 10450] }, { kind: 'inhib', lane: 'mid', p: [3050, 10950] }, { kind: 'inhib', lane: 'bot', p: [3550, 12500] },
    { kind: 'tower', lane: 'mid', tier: 'nexus', p: [2331, 12023] }, { kind: 'tower', lane: 'mid', tier: 'nexus', p: [1977, 11669] },
    { kind: 'nexus', lane: 'mid', p: NEXUS }
  ];
  const BLUE_CAMPS = [
    { id: 'blue', p: [3800, 7900], mobs: [['blue', 0, 0]], respawn: 300, first: 100 },
    { id: 'gromp', p: [2150, 8350], mobs: [['gromp', 0, 0]], respawn: 120, first: 100 },
    { id: 'wolves', p: [3800, 6400], mobs: [['wolf', 0, 0], ['wolfling', -140, 110], ['wolfling', 140, 110]], respawn: 120, first: 100 },
    { id: 'raptors', p: [7000, 9400], mobs: [['raptor', 0, 0], ['raptorling', -130, 90], ['raptorling', 130, 90], ['raptorling', 0, 170]], respawn: 120, first: 100 },
    { id: 'red', p: [7600, 10700], mobs: [['red', 0, 0]], respawn: 300, first: 100 },
    { id: 'krugs', p: [8400, 11600], mobs: [['krug', 0, 0], ['krug', 150, -60]], respawn: 120, first: 100 }
  ];
  const OBJECTIVES = [
    { id: 'dragon', p: [9800, 9500], mobs: [['dragon', 0, 0]], respawn: 360, first: 150 },
    { id: 'baron', p: [4300, 3900], mobs: [['baron', 0, 0]], respawn: 420, first: 720 }
  ];
  const CORRIDORS = [
    [[1500, 8900], [2150, 8350], [3800, 7900], [5100, 8900]],
    [[3800, 7900], [3800, 6400], [5200, 5200]],
    [[3800, 6400], [1500, 5700]],
    [[2000, 11000], [2700, 9600], [3800, 7900]],
    [[3300, 11800], [5200, 11200], [7600, 10700]],
    [[7600, 10700], [8400, 11600], [9000, 12500]],
    [[7600, 10700], [7000, 9400], [6400, 7600]],
    [[7000, 9400], [8700, 8700]],
    [[10500, 12500], [10200, 11000], [9900, 10000]],
    [[5200, 11200], [6000, 10100], [7000, 9400]]
  ];
  const BRUSH = [
    [1130, 6200, 260], [1870, 3300, 230], [6150, 7250, 260], [5850, 6350, 240], [4200, 12880, 250], [10200, 11250, 300], [11000, 12880, 250],
    [2950, 9350, 230], [5650, 10950, 240], [4500, 5800, 230], [10000, 10450, 220], [2300, 5950, 200], [8900, 12150, 220]
  ];

  function mirrorLane(l) { return l === 'top' ? 'bot' : l === 'bot' ? 'top' : l; }

  class Map {
    constructor() {
      this.n = GRID; this.cell = CELL;
      this.t = new Uint8Array(GRID * GRID);         // terrain type
      this.brushId = new Uint16Array(GRID * GRID);  // connected brush region, 0 = none
      this.lanes = LANES;
      this.nexus = [NEXUS, refl(NEXUS)];
      this.fountain = [FOUNTAIN, refl(FOUNTAIN)];
      this.structs = [];
      for (const s of BLUE_STRUCT) this.structs.push(Object.assign({}, s, { team: 0 }));
      for (const s of BLUE_STRUCT) this.structs.push(Object.assign({}, s, { team: 1, p: refl(s.p), lane: mirrorLane(s.lane) }));
      this.camps = [];
      for (const c of BLUE_CAMPS) this.camps.push(Object.assign({}, c, { side: 0, key: 'b_' + c.id }));
      for (const c of BLUE_CAMPS) this.camps.push(Object.assign({}, c, { side: 1, key: 'r_' + c.id, p: refl(c.p), mobs: c.mobs.map(m => [m[0], -m[1], -m[2]]) }));
      for (const c of OBJECTIVES) this.camps.push(Object.assign({}, c, { side: 2, key: c.id }));
      this.build();
    }
    idx(x, y) { const i = Math.floor(x / CELL), j = Math.floor(y / CELL); return (i < 0 || j < 0 || i >= GRID || j >= GRID) ? -1 : j * GRID + i; }
    terrain(x, y) { const k = this.idx(x, y); return k < 0 ? 0 : this.t[k]; }
    walkable(x, y) { const k = this.idx(x, y); return k >= 0 && this.t[k] > 0; }
    brushAt(x, y) { const k = this.idx(x, y); return k < 0 ? 0 : this.brushId[k]; }

    paint(fn, code, onlyIf) {
      for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
        const x = (i + 0.5) * CELL, y = (j + 0.5) * CELL, k = j * GRID + i;
        if (onlyIf && !onlyIf(this.t[k])) continue;
        if (fn(x, y)) this.t[k] = code;
      }
    }
    static segDist(px, py, ax, ay, bx, by) {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
      let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      return Math.hypot(px - ax - dx * t, py - ay - dy * t);
    }
    static polyDist(px, py, pts) { let d = 1e9; for (let i = 0; i + 1 < pts.length; i++) d = Math.min(d, Map.segDist(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; }
    build() {
      const both = (pts) => [pts, pts.map(refl)];
      // jungle: paths and clearings (grass so they look wild) — painted first, lanes/river/base overwrite them
      for (const c of CORRIDORS) for (const pts of both(c)) this.paint((x, y) => Map.polyDist(x, y, pts) < 240, T.PATH);
      for (const c of this.camps) this.paint((x, y) => Math.hypot(x - c.p[0], y - c.p[1]) < (c.side === 2 ? 620 : 440), T.PATH);
      // river
      this.paint((x, y) => Map.segDist(x, y, 1700, 1700, 12300, 12300) < 470, T.RIVER);
      for (const o of OBJECTIVES) this.paint((x, y) => Math.hypot(x - o.p[0], y - o.p[1]) < 640, T.RIVER);
      for (const o of OBJECTIVES) this.paint((x, y) => Math.hypot(x - o.p[0], y - o.p[1]) < 420, T.PATH);
      // lanes
      for (const k in LANES) this.paint((x, y) => Map.polyDist(x, y, LANES[k]) < 430, T.LANE);
      // bases
      for (const c of [[0, MAP], [MAP, 0]]) this.paint((x, y) => Math.hypot(x - c[0], y - c[1]) < 4000, T.BASE);
      // keep a 1-cell wall around the world
      for (let i = 0; i < GRID; i++) { this.t[i] = 0; this.t[(GRID - 1) * GRID + i] = 0; this.t[i * GRID] = 0; this.t[i * GRID + GRID - 1] = 0; }
      // brush: circles on walkable cells, then label connected regions
      const bm = new Uint8Array(GRID * GRID);
      for (const b of BRUSH) for (const bb of [b, [MAP - b[0], MAP - b[1], b[2]]]) {
        for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
          const k = j * GRID + i; if (!this.t[k] || this.t[k] === T.BASE) continue;
          if (Math.hypot((i + 0.5) * CELL - bb[0], (j + 0.5) * CELL - bb[1]) < bb[2]) bm[k] = 1;
        }
      }
      let id = 0;
      for (let k = 0; k < bm.length; k++) if (bm[k] && !this.brushId[k]) {
        id++; const st = [k]; this.brushId[k] = id;
        while (st.length) { const a = st.pop(), ai = a % GRID, aj = (a / GRID) | 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const bi = ai + dx, bj = aj + dy; if (bi < 0 || bj < 0 || bi >= GRID || bj >= GRID) continue; const b = bj * GRID + bi; if (bm[b] && !this.brushId[b]) { this.brushId[b] = id; st.push(b); } } }
      }
      this.brushCount = id;
    }

    // ------------------------------------------------------------ geometry helpers
    lanePath(lane, team) { const p = LANES[lane]; return team === 0 ? p : p.slice().reverse(); }
    // distance along a polyline of the closest point, plus the lateral distance
    project(pts, x, y) {
      let best = 1e18, s = 0, bs = 0, bd = 0;
      for (let i = 0; i + 1 < pts.length; i++) {
        const ax = pts[i][0], ay = pts[i][1], dx = pts[i + 1][0] - ax, dy = pts[i + 1][1] - ay, l = Math.hypot(dx, dy);
        let t = ((x - ax) * dx + (y - ay) * dy) / (l * l); t = t < 0 ? 0 : t > 1 ? 1 : t;
        const d = Math.hypot(x - ax - dx * t, y - ay - dy * t);
        if (d < best) { best = d; bs = s + t * l; bd = d; }
        s += l;
      }
      return { s: bs, d: bd };
    }
    pointAt(pts, s) {
      for (let i = 0; i + 1 < pts.length; i++) {
        const ax = pts[i][0], ay = pts[i][1], dx = pts[i + 1][0] - ax, dy = pts[i + 1][1] - ay, l = Math.hypot(dx, dy);
        if (s <= l || i + 2 === pts.length) { const t = Math.max(0, Math.min(1, s / l)); return [ax + dx * t, ay + dy * t]; }
        s -= l;
      }
      return pts[pts.length - 1].slice();
    }
    pathLength(pts) { let s = 0; for (let i = 0; i + 1 < pts.length; i++) s += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return s; }
    laneOf(x, y) { let best = null, bd = 1e9; for (const k in LANES) { const d = Map.polyDist(x, y, LANES[k]); if (d < bd) { bd = d; best = k; } } return { lane: best, d: bd }; }

    nearestWalkable(x, y) {
      if (this.walkable(x, y)) return [x, y];
      const ci = Math.floor(x / CELL), cj = Math.floor(y / CELL);
      for (let r = 1; r < 40; r++) {
        let best = null, bd = 1e18;
        for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
          if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r || i < 0 || j < 0 || i >= GRID || j >= GRID) continue;
          if (!this.t[j * GRID + i]) continue;
          const px = (i + 0.5) * CELL, py = (j + 0.5) * CELL, d = (px - x) ** 2 + (py - y) ** 2;
          if (d < bd) { bd = d; best = [px, py]; }
        }
        if (best) return best;
      }
      return [x, y];
    }
    // straight walk test sampled every 40 units with a lateral margin
    clearLine(ax, ay, bx, by, margin = 30) {
      const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 40);
      const nx = d ? -(by - ay) / d * margin : 0, ny = d ? (bx - ax) / d * margin : 0;
      for (let i = 1; i <= n; i++) {
        const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
        if (!this.walkable(x, y) || !this.walkable(x + nx, y + ny) || !this.walkable(x - nx, y - ny)) return false;
      }
      return true;
    }
    // A* over the grid (8-neighbour, octile), returns smoothed waypoints [[x,y],...] excluding the start
    findPath(ax, ay, bx, by) {
      [bx, by] = this.nearestWalkable(bx, by);
      if (this.clearLine(ax, ay, bx, by)) return [[bx, by]];
      const N = GRID, s0 = this.idx(...this.nearestWalkable(ax, ay)), goal = this.idx(bx, by);
      if (s0 < 0 || goal < 0) return [[bx, by]];
      if (!this._g) { this._g = new Float32Array(N * N); this._from = new Int32Array(N * N); this._stamp = new Uint32Array(N * N); this._closed = new Uint32Array(N * N); this._run = 0; }
      const g = this._g, from = this._from, stamp = this._stamp, closed = this._closed, run = ++this._run;
      const gi = goal % N, gj = (goal / N) | 0;
      const h = k => { const dx = Math.abs(k % N - gi), dy = Math.abs(((k / N) | 0) - gj); return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy); };
      const heap = [], push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top[1]; };
      stamp[s0] = run; g[s0] = 0; from[s0] = -1; push(s0, h(s0));
      let found = false, iter = 0;
      while (heap.length && iter++ < 30000) {
        const a = pop(); if (closed[a] === run) continue; closed[a] = run;
        if (a === goal) { found = true; break; }
        const ai = a % N, aj = (a / N) | 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue; const bi = ai + di, bj = aj + dj; if (bi < 0 || bj < 0 || bi >= N || bj >= N) continue;
          const b = bj * N + bi; if (!this.t[b] || closed[b] === run) continue;
          if (di && dj && (!this.t[aj * N + bi] || !this.t[bj * N + ai])) continue; // no corner cutting
          const ng = g[a] + (di && dj ? Math.SQRT2 : 1);
          if (stamp[b] !== run || ng < g[b]) { stamp[b] = run; g[b] = ng; from[b] = a; push(b, ng + h(b)); }
        }
      }
      if (!found) return [[bx, by]];
      const cells = []; for (let k = goal; k !== -1; k = from[k]) cells.push(k); cells.reverse();
      const pts = cells.map(k => [(k % N + 0.5) * CELL, (((k / N) | 0) + 0.5) * CELL]); pts[pts.length - 1] = [bx, by];
      // string pulling
      const out = []; let cx = ax, cy = ay, i = 0;
      while (i < pts.length) {
        let j = pts.length - 1;
        while (j > i && !this.clearLine(cx, cy, pts[j][0], pts[j][1])) j--;
        out.push(pts[j]); cx = pts[j][0]; cy = pts[j][1]; i = j + 1;
      }
      return out;
    }
  }
  Map.T = T; Map.refl = refl;
  L.Map = Map; L.MAPDEF = { LANES, BLUE_STRUCT, BLUE_CAMPS, OBJECTIVES, CORRIDORS, BRUSH, NEXUS, FOUNTAIN };
  if (typeof module !== 'undefined') module.exports = L;
})(globalThis.LoL98 = globalThis.LoL98 || {});
