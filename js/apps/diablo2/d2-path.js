(function (D) {
  'use strict';

  class Heap {
    constructor() { this.k = []; this.v = []; }
    push(key, val) {
      const k = this.k, v = this.v;
      let i = k.length;
      k.push(key); v.push(val);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (k[p] <= key) break;
        k[i] = k[p]; v[i] = v[p];
        i = p;
      }
      k[i] = key; v[i] = val;
    }
    pop() {
      const k = this.k, v = this.v;
      const top = v[0];
      const lk = k.pop(), lv = v.pop();
      if (k.length) {
        let i = 0;
        const n = k.length;
        for (;;) {
          let c = 2 * i + 1;
          if (c >= n) break;
          if (c + 1 < n && k[c + 1] < k[c]) c++;
          if (k[c] >= lk) break;
          k[i] = k[c]; v[i] = v[c];
          i = c;
        }
        k[i] = lk; v[i] = lv;
      }
      return top;
    }
    get size() { return this.k.length; }
  }

  function prepare(area) {
    const n = area.w * area.h;
    if (!area._g || area._g.length !== n) {
      area._g = new Float32Array(n);
      area._from = new Int32Array(n);
      area._seen = new Uint32Array(n);
      area._gen = 0;
    }
  }

  const DX = [1, -1, 0, 0, 1, 1, -1, -1];
  const DY = [0, 0, 1, -1, 1, -1, 1, -1];
  const DC = [1, 1, 1, 1, 1.4142, 1.4142, 1.4142, 1.4142];

  function walkable(area, cx, cy) {
    return cx >= 0 && cy >= 0 && cx < area.w && cy < area.h && area.walk[cy * area.w + cx] === 1;
  }

  function flyable(area, cx, cy) {
    return cx >= 0 && cy >= 0 && cx < area.w && cy < area.h && area.fly[cy * area.w + cx] === 1;
  }

  function findPath(area, sx, sy, tx, ty, maxNodes) {
    prepare(area);
    const W = area.w;
    let scx = Math.floor(sx), scy = Math.floor(sy);
    let tcx = Math.floor(tx), tcy = Math.floor(ty);
    if (!walkable(area, tcx, tcy)) {
      const nw = nearestWalkable(area, tx, ty, 4);
      if (!nw) return null;
      tcx = Math.floor(nw.x); tcy = Math.floor(nw.y);
    }
    if (!walkable(area, scx, scy)) {
      const nw = nearestWalkable(area, sx, sy, 2);
      if (!nw) return null;
      scx = Math.floor(nw.x); scy = Math.floor(nw.y);
    }
    const gen = ++area._gen;
    const g = area._g, from = area._from, seen = area._seen;
    const start = scy * W + scx, goal = tcy * W + tcx;
    const h = (cx, cy) => { const ax = Math.abs(cx - tcx), ay = Math.abs(cy - tcy); return Math.max(ax, ay) + 0.4142 * Math.min(ax, ay); };
    const open = new Heap();
    g[start] = 0; from[start] = -1; seen[start] = gen;
    open.push(h(scx, scy), start);
    let best = start, bestH = h(scx, scy), count = 0;
    const limit = maxNodes || 6000;
    while (open.size) {
      const cur = open.pop();
      if (cur === goal) { best = cur; break; }
      if (++count > limit) break;
      const cx = cur % W, cy = (cur / W) | 0;
      const hc = h(cx, cy);
      if (hc < bestH) { bestH = hc; best = cur; }
      for (let d = 0; d < 8; d++) {
        const nx = cx + DX[d], ny = cy + DY[d];
        if (!walkable(area, nx, ny)) continue;
        if (d >= 4 && (!walkable(area, cx + DX[d], cy) || !walkable(area, cx, cy + DY[d]))) continue;
        const ni = ny * W + nx;
        const ng = g[cur] + DC[d];
        if (seen[ni] === gen && ng >= g[ni]) continue;
        seen[ni] = gen; g[ni] = ng; from[ni] = cur;
        open.push(ng + h(nx, ny), ni);
      }
    }
    const cells = [];
    for (let c = best; c !== -1; c = from[c]) cells.push(c);
    cells.reverse();
    if (cells.length <= 1) {
      if (best === goal) return [{ x: tx, y: ty }];
      return null;
    }
    const pts = cells.map(c => ({ x: (c % W) + 0.5, y: ((c / W) | 0) + 0.5 }));
    if (best === goal && walkable(area, Math.floor(tx), Math.floor(ty))) pts[pts.length - 1] = { x: tx, y: ty };
    return smooth(area, sx, sy, pts);
  }

  function smooth(area, sx, sy, pts) {
    const out = [];
    let ax = sx, ay = sy, i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !walkLine(area, ax, ay, pts[j].x, pts[j].y, 0.28)) j--;
      out.push(pts[j]);
      ax = pts[j].x; ay = pts[j].y;
      i = j + 1;
    }
    return out;
  }

  function walkLine(area, x0, y0, x1, y1, rad) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(d / 0.2));
    const r = rad || 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (!walkable(area, Math.floor(x), Math.floor(y))) return false;
      if (r) {
        if (!walkable(area, Math.floor(x + r), Math.floor(y)) || !walkable(area, Math.floor(x - r), Math.floor(y))) return false;
        if (!walkable(area, Math.floor(x), Math.floor(y + r)) || !walkable(area, Math.floor(x), Math.floor(y - r))) return false;
      }
    }
    return true;
  }

  function losLine(area, x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(d / 0.3));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (!flyable(area, Math.floor(x0 + (x1 - x0) * t), Math.floor(y0 + (y1 - y0) * t))) return false;
    }
    return true;
  }

  function nearestWalkable(area, x, y, maxR) {
    const cx = Math.floor(x), cy = Math.floor(y);
    if (walkable(area, cx, cy)) return { x, y };
    for (let r = 1; r <= (maxR || 6); r++) {
      let best = null, bd = 1e9;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (!walkable(area, cx + dx, cy + dy)) continue;
        const px = cx + dx + 0.5, py = cy + dy + 0.5;
        const dd = (px - x) * (px - x) + (py - y) * (py - y);
        if (dd < bd) { bd = dd; best = { x: px, y: py }; }
      }
      if (best) return best;
    }
    return null;
  }

  function floodFrom(area, sx, sy) {
    const W = area.w, n = W * area.h;
    const dist = new Int32Array(n).fill(-1);
    const q = new Int32Array(n);
    let qh = 0, qt = 0;
    const s = Math.floor(sy) * W + Math.floor(sx);
    if (area.walk[s] !== 1) return dist;
    dist[s] = 0; q[qt++] = s;
    while (qh < qt) {
      const c = q[qh++];
      const cx = c % W, cy = (c / W) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = cx + DX[d], ny = cy + DY[d];
        if (nx < 0 || ny < 0 || nx >= W || ny >= area.h) continue;
        const ni = ny * W + nx;
        if (dist[ni] >= 0 || area.walk[ni] !== 1) continue;
        dist[ni] = dist[c] + 1;
        q[qt++] = ni;
      }
    }
    return dist;
  }

  Object.assign(D, { findPath, walkLine, losLine, nearestWalkable, walkable, flyable, floodFrom, Heap });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
