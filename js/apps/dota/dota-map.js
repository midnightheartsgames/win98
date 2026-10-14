(function (D) {
  'use strict';
  const { MAP, CELL, GRID } = D.DATA;
  const SLOT = 128, SN = MAP / SLOT;
  const R = (p) => [MAP - p[0], MAP - p[1]];
  const segDist = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(px - ax - dx * t, py - ay - dy * t);
  };
  const polyDist = (px, py, pts) => { let m = 1e9; for (let i = 0; i < pts.length - 1; i++) { const d = segDist(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); if (d < m) m = d; } return m; };
  function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y) => vnoise(x, y) * 0.6 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.1;

  const LAYOUT = {
    fountain: [650, 12150], ancient: [1750, 11050], shop: [1250, 12500],
    towers: [
      { lane: 'top', tier: 1, p: [1180, 4200] }, { lane: 'top', tier: 2, p: [1180, 6800] }, { lane: 'top', tier: 3, p: [1230, 9250] },
      { lane: 'mid', tier: 1, p: [5420, 7720] }, { lane: 'mid', tier: 2, p: [4320, 8820] }, { lane: 'mid', tier: 3, p: [2950, 10250] },
      { lane: 'bot', tier: 1, p: [8600, 11620] }, { lane: 'bot', tier: 2, p: [6000, 11620] }, { lane: 'bot', tier: 3, p: [3500, 11580] },
      { lane: 'base', tier: 4, p: [1300, 10650] }, { lane: 'base', tier: 4, p: [2150, 11500] }
    ],
    rax: [
      { lane: 'top', type: 'melee', p: [600, 9900] }, { lane: 'top', type: 'ranged', p: [1350, 9800] },
      { lane: 'mid', type: 'melee', p: [2150, 10050] }, { lane: 'mid', type: 'ranged', p: [2750, 10650] },
      { lane: 'bot', type: 'melee', p: [3000, 12200] }, { lane: 'bot', type: 'ranged', p: [3050, 11450] }
    ],
    ramps: [[900, 8600], [2970, 9830], [4150, 11900], [2000, 9100], [3700, 10800]],
    camps: [
      { type: 'small_kobold', p: [4700, 10650] }, { type: 'medium_wolf', p: [6300, 10250] }, { type: 'large_centaur', p: [7800, 10800] },
      { type: 'large_hellbear', p: [5600, 9050] }, { type: 'ancient_golem', dire: 'ancient_dragon', p: [8300, 9350] }, { type: 'medium_satyr', p: [7150, 8300] },
      { type: 'large_centaur', dire: 'large_hellbear', p: [2450, 5650] }, { type: 'medium_satyr', dire: 'medium_wolf', p: [3700, 6800] }, { type: 'small_troll', p: [2000, 7450] }
    ],
    secret: [3000, 4700], bounty: [[3300, 8400], [6950, 9500]],
    paths: [
      [[4300, 11500], [4700, 10650], [6300, 10250], [7800, 10800], [8700, 11600]],
      [[6300, 10250], [5600, 9050], [4700, 8100]],
      [[5600, 9050], [6950, 9500], [8300, 9350], [9500, 11600]],
      [[8300, 9350], [8850, 8850]],
      [[5600, 9050], [7150, 8300], [7650, 7650]],
      [[900, 5400], [2450, 5650], [3000, 4700], [3800, 3950]],
      [[2450, 5650], [3700, 6800], [5300, 7500]],
      [[3700, 6800], [5000, 5350]],
      [[900, 7600], [2000, 7450], [3300, 8400], [3900, 8900]],
      [[2000, 7450], [3700, 6800]],
      [[2000, 9100], [2000, 7450]],
      [[3700, 10800], [4700, 10650]],
      [[4700, 4700], [5150, 4250]]
    ],
    wards: [[4300, 5600], [6200, 8350], [8350, 7900], [2800, 8000], [3300, 3300], [7300, 10200]],
    lanes: {
      top: [[1500, 10500], [950, 9500], [900, 8600], [900, 1500], [1150, 1150]],
      bot: [[2250, 11350], [3300, 11850], [4200, 11900], [11300, 11900], [11650, 11650]],
      mid: [[2250, 10550], [2900, 9900], [6400, 6400]]
    }
  };
  const POWER_RUNE_SPOTS = [[3950, 3950], [8850, 8850]];
  const ROSHAN_PIT = [5150, 4250];

  class GameMap {
    constructor() {
      this.N = GRID; this.SN = SN; this.SLOT = SLOT;
      this.h = new Uint8Array(GRID * GRID);
      this.block = new Uint8Array(GRID * GRID);
      this.bld = new Uint8Array(GRID * GRID);
      this.slot = new Int16Array(SN * SN);
      this.slotH = new Uint8Array(SN * SN);
      this.trees = [];
      this.build();
    }
    build() {
      const L = LAYOUT, N = GRID;
      this.fountain = [L.fountain, R(L.fountain)];
      this.ancient = [L.ancient, R(L.ancient)];
      this.shop = [L.shop, R(L.shop)];
      this.secret = [L.secret, R(L.secret)];
      this.roshan = ROSHAN_PIT.slice();
      this.powerRunes = POWER_RUNE_SPOTS.map(p => p.slice());
      this.bountyRunes = [...L.bounty, ...L.bounty.map(R)];
      this.wardSpots = [L.wards, L.wards.map(R)];
      const topD = L.lanes.bot.map(R).reverse(), botD = L.lanes.top.map(R).reverse(), midD = L.lanes.mid.map(R).reverse();
      this.lanes = {
        top: [...L.lanes.top, ...topD.slice(1)],
        mid: [...L.lanes.mid, ...midD.slice(1)],
        bot: [...L.lanes.bot, ...botD.slice(1)]
      };
      this.laneLen = {}; for (const k in this.lanes) { let s = 0; const p = this.lanes[k]; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); this.laneLen[k] = s; }
      this.structs = [];
      for (let t = 0; t < 2; t++) {
        const f = t ? R : (p) => p.slice();
        for (const tw of L.towers) this.structs.push({ kind: 'tower', team: t, lane: tw.lane, tier: tw.tier, p: f(tw.p) });
        for (const rx of L.rax) this.structs.push({ kind: 'rax', team: t, lane: rx.lane, type: rx.type, p: f(rx.p) });
        this.structs.push({ kind: 'ancient', team: t, p: f(L.ancient) });
        this.structs.push({ kind: 'fountain', team: t, p: f(L.fountain) });
      }
      this.camps = [];
      for (const c of L.camps) {
        this.camps.push({ type: c.type, side: 0, p: c.p.slice() });
        this.camps.push({ type: c.dire || c.type, side: 1, p: R(c.p) });
      }
      this.ramps = [...L.ramps, ...L.ramps.map(R)];
      this.paths = [...L.paths, ...L.paths.map(pl => pl.map(R))];
      for (let cy = 0; cy < N; cy++) for (let cx = 0; cx < N; cx++) {
        const x = (cx + 0.5) * CELL, y = (cy + 0.5) * CELL;
        this.h[cy * N + cx] = this.heightFn(x, y);
      }
      for (let cy = 0; cy < N; cy++) for (let cx = 0; cx < N; cx++) {
        const i = cy * N + cx;
        if (cx < 3 || cy < 3 || cx >= N - 3 || cy >= N - 3) { this.block[i] = 1; continue; }
        const h = this.h[i]; if (h !== 2) continue;
        let edge = false;
        for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) if (this.h[i + dy * N + dx] === 1) { edge = true; break; }
        if (!edge) continue;
        const x = (cx + 0.5) * CELL, y = (cy + 0.5) * CELL;
        if (this.ramps.some(r => Math.hypot(x - r[0], y - r[1]) < 330)) continue;
        this.block[i] = 1;
      }
      for (let sy = 0; sy < SN; sy++) for (let sx = 0; sx < SN; sx++) {
        const cx = sx * 2, cy = sy * 2; let m = 0;
        for (let k = 0; k < 4; k++) m = Math.max(m, this.h[(cy + (k >> 1)) * N + cx + (k & 1)]);
        this.slotH[sy * SN + sx] = m;
      }
      this.plantTrees();
      for (const s of this.structs) this.setFootprint(s, 1);
    }
    heightFn(x, y) {
      if (Math.hypot(x, y - MAP) < 4200 || Math.hypot(x - MAP, y) < 4200) return 2;
      const m = Math.sin((x + y) / 1700) * 230 + Math.sin((x + y) / 610 + 1.3) * 60;
      const d = Math.abs(x - y - m);
      if (d < 470 && x + y > 1400 && x + y < MAP * 2 - 1400) return 0;
      return 1;
    }
    riverDist(x, y) { const m = Math.sin((x + y) / 1700) * 230 + Math.sin((x + y) / 610 + 1.3) * 60; return Math.abs(x - y - m); }
    footprint(s) { return s.kind === 'tower' ? 90 : s.kind === 'rax' ? 150 : s.kind === 'ancient' ? 260 : s.kind === 'fountain' ? 140 : 0; }
    setFootprint(s, on) {
      const r = this.footprint(s), N = GRID; if (!r) return;
      const x0 = Math.floor((s.p[0] - r) / CELL), x1 = Math.floor((s.p[0] + r) / CELL), y0 = Math.floor((s.p[1] - r) / CELL), y1 = Math.floor((s.p[1] + r) / CELL);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (cx >= 0 && cy >= 0 && cx < N && cy < N) {
        const x = (cx + 0.5) * CELL, y = (cy + 0.5) * CELL;
        if (Math.hypot(x - s.p[0], y - s.p[1]) <= r + 20) this.bld[cy * N + cx] = on ? 1 : 0;
      }
    }
    clearance(x, y) {
      const L = LAYOUT;
      if (Math.hypot(x, y - MAP) < 4500 || Math.hypot(x - MAP, y) < 4500) return true;
      if (this.riverDist(x, y) < 560) return true;
      for (const k in this.lanes) if (polyDist(x, y, this.lanes[k]) < 330) return true;
      for (const pl of this.paths) if (polyDist(x, y, pl) < 175) return true;
      for (const c of this.camps) if (Math.hypot(x - c.p[0], y - c.p[1]) < 400) return true;
      for (const s of this.secret) if (Math.hypot(x - s[0], y - s[1]) < 360) return true;
      for (const b of this.bountyRunes) if (Math.hypot(x - b[0], y - b[1]) < 280) return true;
      if (Math.hypot(x - ROSHAN_PIT[0], y - ROSHAN_PIT[1]) < 480) return true;
      for (const s of this.structs) if (s.kind === 'tower' && Math.hypot(x - s.p[0], y - s.p[1]) < 360) return true;
      for (const w of this.wardSpots[0].concat(this.wardSpots[1])) if (Math.hypot(x - w[0], y - w[1]) < 150) return true;
      void L; return false;
    }
    plantTrees() {
      for (let sy = 0; sy < SN; sy++) for (let sx = 0; sx < SN; sx++) {
        const x = (sx + 0.5) * SLOT, y = (sy + 0.5) * SLOT;
        const edge = sx < 2 || sy < 2 || sx >= SN - 2 || sy >= SN - 2;
        if (!edge) {
          if (this.clearance(x, y)) continue;
          const n = fbm(x / 1400, y / 1400);
          if (n < 0.3) continue;
          if (hash2(sx * 7 + 3, sy * 13 + 1) < 0.1) continue;
          let bad = false;
          for (let k = 0; k < 4; k++) if (this.block[(sy * 2 + (k >> 1)) * GRID + sx * 2 + (k & 1)]) bad = true;
          if (bad) continue;
        }
        const side = x - y > 0 ? 1 : 0;
        const t = { id: this.trees.length, sx, sy, x: x + (hash2(sx, sy) - 0.5) * 36, y: y + (hash2(sy, sx + 99) - 0.5) * 36, alive: true, perm: edge, side,
          v: Math.floor(hash2(sx * 3, sy * 5) * 4), regrowAt: 0 };
        this.trees.push(t); this.slot[sy * SN + sx] = t.id + 1;
      }
    }
    inMap(x, y) { return x >= 0 && y >= 0 && x < MAP && y < MAP; }
    cell(x, y) { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID) ? -1 : cy * GRID + cx; }
    heightAt(x, y) { const c = this.cell(x, y); return c < 0 ? 1 : this.h[c]; }
    treeAtSlot(sx, sy) { if (sx < 0 || sy < 0 || sx >= SN || sy >= SN) return null; const i = this.slot[sy * SN + sx]; if (!i) return null; const t = this.trees[i - 1]; return t.alive ? t : null; }
    treeAt(x, y) { return this.treeAtSlot(Math.floor(x / SLOT), Math.floor(y / SLOT)); }
    passCell(cx, cy) {
      if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID) return false;
      const i = cy * GRID + cx; if (this.block[i] || this.bld[i]) return false;
      const t = this.slot[(cy >> 1) * SN + (cx >> 1)]; return !t || !this.trees[t - 1].alive;
    }
    walkable(x, y) { return this.passCell(Math.floor(x / CELL), Math.floor(y / CELL)); }
    treesNear(x, y, r) {
      const out = [], s0x = Math.max(0, Math.floor((x - r) / SLOT)), s1x = Math.min(SN - 1, Math.floor((x + r) / SLOT)), s0y = Math.max(0, Math.floor((y - r) / SLOT)), s1y = Math.min(SN - 1, Math.floor((y + r) / SLOT));
      for (let sy = s0y; sy <= s1y; sy++) for (let sx = s0x; sx <= s1x; sx++) { const t = this.treeAtSlot(sx, sy); if (t && Math.hypot(t.x - x, t.y - y) <= r) out.push(t); }
      return out;
    }
    nearestTree(x, y, r) { let best = null, bd = r; for (const t of this.treesNear(x, y, r)) { if (t.perm) continue; const d = Math.hypot(t.x - x, t.y - y); if (d < bd) { bd = d; best = t; } } return best; }
    nearestWalkable(x, y, maxR = 800) {
      if (this.walkable(x, y)) return [x, y];
      for (let r = CELL; r <= maxR; r += CELL / 2) {
        const n = Math.max(8, Math.round(r / 20));
        for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (this.walkable(px, py)) return [px, py]; }
      }
      return [x, y];
    }
    lineWalkable(x0, y0, x1, y1) {
      const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / (CELL * 0.5));
      for (let i = 1; i <= n; i++) { const t = i / n; if (!this.walkable(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false; }
      return true;
    }
    findPath(sx, sy, tx, ty, maxNodes = 24000) {
      const N = GRID;
      if (!this._g) { this._g = new Float32Array(N * N); this._f = new Float32Array(N * N); this._from = new Int32Array(N * N); this._gen = new Uint32Array(N * N); this._closed = new Uint32Array(N * N); this._heap = new Int32Array(N * N * 2); this._genN = 0; }
      const [ax, ay] = this.nearestWalkable(sx, sy, 400), [bx, by] = this.nearestWalkable(tx, ty, 1200);
      const s = this.cell(ax, ay), goal = this.cell(bx, by); if (s < 0 || goal < 0) return null;
      if (this.lineWalkable(ax, ay, bx, by)) return [[bx, by]];
      const gen = ++this._genN, G = this._g, F = this._f, from = this._from, gn = this._gen, closed = this._closed, heap = this._heap;
      const gx = goal % N, gy = (goal / N) | 0;
      const hfn = (i) => { const dx = Math.abs(i % N - gx), dy = Math.abs(((i / N) | 0) - gy); return dx + dy + (1.4142 - 2) * Math.min(dx, dy); };
      let hn = 0;
      const push = (i) => { let k = hn++; heap[k] = i; while (k > 0) { const p = (k - 1) >> 1; if (F[heap[p]] <= F[heap[k]]) break; const t = heap[p]; heap[p] = heap[k]; heap[k] = t; k = p; } };
      const pop = () => { const top = heap[0]; heap[0] = heap[--hn]; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < hn && F[heap[l]] < F[heap[m]]) m = l; if (r < hn && F[heap[r]] < F[heap[m]]) m = r; if (m === k) break; const t = heap[m]; heap[m] = heap[k]; heap[k] = t; k = m; } return top; };
      G[s] = 0; F[s] = hfn(s); from[s] = -1; gn[s] = gen; push(s);
      let best = s, bestH = hfn(s), expanded = 0, found = false;
      while (hn > 0) {
        const cur = pop(); if (closed[cur] === gen) continue; closed[cur] = gen;
        if (cur === goal) { found = true; break; }
        if (++expanded > maxNodes) break;
        const cx = cur % N, cy = (cur / N) | 0;
        for (let d = 0; d < 8; d++) {
          const dx = [1, -1, 0, 0, 1, 1, -1, -1][d], dy = [0, 0, 1, -1, 1, -1, 1, -1][d];
          const nx = cx + dx, ny = cy + dy; if (!this.passCell(nx, ny)) continue;
          if (dx && dy && (!this.passCell(cx + dx, cy) || !this.passCell(cx, cy + dy))) continue;
          const ni = ny * N + nx; if (closed[ni] === gen) continue;
          const ng = G[cur] + (dx && dy ? 1.4142 : 1);
          if (gn[ni] !== gen || ng < G[ni]) { gn[ni] = gen; G[ni] = ng; const h = hfn(ni); F[ni] = ng + h * 1.05; from[ni] = cur; push(ni); if (h < bestH) { bestH = h; best = ni; } }
        }
      }
      let end = found ? goal : best; const cells = [];
      while (end >= 0 && cells.length < 4000) { cells.push(end); end = from[end]; if (end === s) break; }
      cells.reverse();
      const pts = cells.map(i => [(i % N + 0.5) * CELL, ((i / N | 0) + 0.5) * CELL]);
      if (found) pts[pts.length - 1] = [bx, by];
      const out = []; let ox = ax, oy = ay, i = 0;
      while (i < pts.length) {
        let j = pts.length - 1;
        while (j > i && !this.lineWalkable(ox, oy, pts[j][0], pts[j][1])) j--;
        out.push(pts[j]); ox = pts[j][0]; oy = pts[j][1]; i = j + 1;
      }
      return out.length ? out : null;
    }
    initVision(maxR = 17) {
      if (this.rays) return;
      const offs = [];
      for (let dy = -maxR; dy <= maxR; dy++) for (let dx = -maxR; dx <= maxR; dx++) { const d = Math.hypot(dx, dy); if (d <= maxR + 0.01) offs.push([dx, dy, d]); }
      offs.sort((a, b) => a[2] - b[2]);
      const idx = new Map(); offs.forEach((o, i) => idx.set(o[0] + ',' + o[1], i));
      const n = offs.length, dxA = new Int8Array(n), dyA = new Int8Array(n), par = new Int32Array(n), dist = new Float32Array(n);
      offs.forEach((o, i) => {
        dxA[i] = o[0]; dyA[i] = o[1]; dist[i] = o[2];
        if (i === 0) { par[i] = -1; return; }
        const k = (o[2] - 1) / o[2]; let px = Math.round(o[0] * k), py = Math.round(o[1] * k);
        let pi = idx.get(px + ',' + py); if (pi === undefined || pi >= i) pi = 0; par[i] = pi;
      });
      this.rays = { n, dxA, dyA, par, dist };
      this._vis = new Uint8Array(n);
    }
    castVision(out, x, y, radius, flying) {
      this.initVision();
      const r = this.rays, SNn = SN, sx0 = Math.floor(x / SLOT), sy0 = Math.floor(y / SLOT);
      if (sx0 < 0 || sy0 < 0 || sx0 >= SNn || sy0 >= SNn) return;
      const rs = radius / SLOT, hs = this.slotH[sy0 * SNn + sx0], vis = this._vis, slot = this.slot, trees = this.trees, sh = this.slotH;
      const lim = Math.min(r.n, rs >= 17 ? r.n : this.countWithin(rs));
      vis[0] = 1; out[sy0 * SNn + sx0] = 1;
      for (let i = 1; i < lim; i++) {
        const sx = sx0 + r.dxA[i], sy = sy0 + r.dyA[i];
        if (sx < 0 || sy < 0 || sx >= SNn || sy >= SNn) { vis[i] = 0; continue; }
        const si = sy * SNn + sx;
        if (flying) { vis[i] = 1; out[si] = 1; continue; }
        const p = r.par[i];
        let ok = vis[p] === 1;
        if (ok && p > 0) { const psx = sx0 + r.dxA[p], psy = sy0 + r.dyA[p], pi = psy * SNn + psx; if (sh[pi] > hs) ok = false; else { const t = slot[pi]; if (t && trees[t - 1].alive) ok = false; } }
        if (ok && sh[si] > hs) ok = false;
        vis[i] = ok ? 1 : 0; if (ok) out[si] = 1;
      }
    }
    countWithin(rs) {
      const d = this.rays.dist; let lo = 0, hi = d.length;
      while (lo < hi) { const m = (lo + hi) >> 1; if (d[m] <= rs) lo = m + 1; else hi = m; }
      return lo;
    }
    lanePoint(lane, t) {
      const p = this.lanes[lane]; let rem = t * this.laneLen[lane];
      for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (rem <= l) { const k = l ? rem / l : 0; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; } rem -= l; }
      return p[p.length - 1].slice();
    }
    laneProgress(lane, x, y) {
      const p = this.lanes[lane]; let acc = 0, best = 1e9, bt = 0;
      for (let i = 1; i < p.length; i++) {
        const ax = p[i - 1][0], ay = p[i - 1][1], bx = p[i][0], by = p[i][1], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, l = Math.sqrt(l2);
        let k = l2 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0; k = k < 0 ? 0 : k > 1 ? 1 : k;
        const d = Math.hypot(x - ax - dx * k, y - ay - dy * k);
        if (d < best) { best = d; bt = (acc + l * k) / this.laneLen[lane]; }
        acc += l;
      }
      return [bt, best];
    }
    nearestLane(x, y) { let bl = 'mid', bd = 1e9, bt = 0; for (const k in this.lanes) { const [t, d] = this.laneProgress(k, x, y); if (d < bd) { bd = d; bl = k; bt = t; } } return { lane: bl, t: bt, d: bd }; }
  }
  GameMap.LAYOUT = LAYOUT; GameMap.SLOT = SLOT; GameMap.SN = SN;
  D.Map = GameMap; D.fbm = fbm; D.hash2 = hash2; D.polyDist = polyDist;
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Dota98 = globalThis.Dota98 || {});
