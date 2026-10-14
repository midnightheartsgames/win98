(function (Z) {
  'use strict';

  class NavGrid {
    constructor(x0, z0, cols, rows, cell) {
      this.x0 = x0; this.z0 = z0; this.cols = cols; this.rows = rows; this.cell = cell;
      this.w = new Uint8Array(cols * rows);
      this.h = new Float32Array(cols * rows);
      this.gen = 0;
      this.mark = new Uint32Array(cols * rows);
      this.g = new Float32Array(cols * rows);
      this.from = new Int32Array(cols * rows);
    }
    idx(x, z) {
      const c = Math.floor((x - this.x0) / this.cell), r = Math.floor((z - this.z0) / this.cell);
      if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
      return r * this.cols + c;
    }
    center(i) { return [this.x0 + (i % this.cols + 0.5) * this.cell, this.z0 + (Math.floor(i / this.cols) + 0.5) * this.cell]; }
    ok(i, mask) { return i >= 0 && (this.w[i] & mask) !== 0; }
    nearestOK(x, z, mask, maxR = 6) {
      const i0 = this.idx(x, z);
      if (this.ok(i0, mask)) return i0;
      const c0 = Math.floor((x - this.x0) / this.cell), r0 = Math.floor((z - this.z0) / this.cell);
      for (let rad = 1; rad <= maxR; rad++) {
        let best = -1, bd = Infinity;
        for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue;
          const c = c0 + dc, r = r0 + dr;
          if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) continue;
          const i = r * this.cols + c;
          if (!this.ok(i, mask)) continue;
          const d = dr * dr + dc * dc;
          if (d < bd) { bd = d; best = i; }
        }
        if (best >= 0) return best;
      }
      return -1;
    }
    lineOK(a, b, mask) {
      const [ax, az] = this.center(a), [bx, bz] = this.center(b);
      const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / (this.cell * 0.5));
      for (let k = 1; k < n; k++) {
        const t = k / n, i = this.idx(Z.lerp(ax, bx, t), Z.lerp(az, bz, t));
        if (!this.ok(i, mask)) return false;
        if (Math.abs(this.h[i] - this.h[a]) > 30) return false;
      }
      return true;
    }
    find(sx, sz, tx, tz, mask = 1, maxExp = 9000) {
      const s = this.nearestOK(sx, sz, mask), t = this.nearestOK(tx, tz, mask);
      if (s < 0 || t < 0) return null;
      if (s === t) return [[tx, tz]];
      this.gen++;
      const gen = this.gen, cols = this.cols, G = this.g, F = this.from, mk = this.mark;
      const [txc, tzc] = this.center(t);
      const heap = [];
      const push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
      const hfn = i => { const [x, z] = this.center(i); const dx = Math.abs(x - txc), dz = Math.abs(z - tzc); return (Math.max(dx, dz) + 0.4142 * Math.min(dx, dz)); };
      mk[s] = gen; G[s] = 0; F[s] = -1;
      push(s, hfn(s));
      let exp = 0, found = false;
      const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
      while (heap.length && exp < maxExp) {
        const [, i] = pop();
        if (i === t) { found = true; break; }
        exp++;
        const c = i % cols, r = (i - c) / cols;
        for (const [dc, dr, cost] of D) {
          const nc = c + dc, nr = r + dr;
          if (nc < 0 || nr < 0 || nc >= cols || nr >= this.rows) continue;
          const j = nr * cols + nc;
          if (!this.ok(j, mask)) continue;
          if (dc && dr && (!this.ok(r * cols + nc, mask) || !this.ok(nr * cols + c, mask))) continue;
          const climb = Math.abs(this.h[j] - this.h[i]);
          if (climb > this.cell * 0.9 && !(this.w[j] & 64)) continue;
          const ng = G[i] + cost * this.cell * (1 + climb * 0.3);
          if (mk[j] === gen && G[j] <= ng) continue;
          mk[j] = gen; G[j] = ng; F[j] = i;
          push(j, ng + hfn(j));
        }
      }
      if (!found) return null;
      const raw = [];
      for (let i = t; i >= 0; i = F[i]) raw.push(i);
      raw.reverse();
      const out = [];
      let anchor = 0;
      for (let k = 2; k < raw.length; k++) {
        if (!this.lineOK(raw[anchor], raw[k], mask)) { out.push(this.center(raw[k - 1])); anchor = k - 1; }
      }
      out.push([tx, tz]);
      return out;
    }
  }
  Z.NavGrid = NavGrid;

  Z.buildExteriorNav = (map, town, extra) => {
    const cell = 2, cols = map.cols, rows = map.rows;
    const nav = new NavGrid(map.x0, map.z0, cols, rows, cell);
    const W = nav.w, H = nav.h;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = map.x0 + (c + 0.5) * cell, z = map.z0 + (r + 0.5) * cell;
      const h = map.groundH(x, z);
      H[i] = h;
      const n = map.normal(x, z);
      let f = 0;
      const depth = -h;
      if (depth < 0.6 && n[1] > 0.72) f |= 1;
      if (depth > 0.4) f |= 2;
      if (depth < 1.2 && depth > -1.5) f |= 4;
      if (depth < 0.6 && n[1] > 0.6) f |= 8;
      if (depth > 0.2 || (depth > -1.2 && n[1] > 0.7)) f |= 16;
      W[i] = f;
    }
    for (const b of town.buildings) {
      const box = b.box;
      const c0 = Math.max(0, Math.floor((box[0] - 0.4 - map.x0) / cell)), c1 = Math.min(cols - 1, Math.floor((box[2] + 0.4 - map.x0) / cell));
      const r0 = Math.max(0, Math.floor((box[1] - 0.4 - map.z0) / cell)), r1 = Math.min(rows - 1, Math.floor((box[3] + 0.4 - map.z0) / cell));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const x = map.x0 + (c + 0.5) * cell, z = map.z0 + (r + 0.5) * cell;
        if (Z.pointInPoly(x, z, b.poly) || town.buildingAt(x, z, 0.6) === b) W[r * cols + c] = 0;
      }
    }
    if (extra) extra(nav);
    return nav;
  };
  Z.NAV = { walk: 1, swim: 2, shore: 4, beast: 8, fish: 16 };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
