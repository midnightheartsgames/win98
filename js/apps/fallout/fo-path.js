(function (FO) {
  'use strict';

  const G = new Int32Array(FO.HEXES);
  const FROM = new Int32Array(FO.HEXES);
  const MARK = new Uint32Array(FO.HEXES);
  let stamp = 0;

  class Heap {
    constructor() {
      this.t = [];
      this.f = [];
    }

    get size() { return this.t.length; }

    push(tile, f) {
      const t = this.t;
      const k = this.f;
      t.push(tile);
      k.push(f);
      let i = t.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (k[p] <= k[i]) break;
        [t[p], t[i]] = [t[i], t[p]];
        [k[p], k[i]] = [k[i], k[p]];
        i = p;
      }
    }

    pop() {
      const t = this.t;
      const k = this.f;
      const top = t[0];
      const lt = t.pop();
      const lk = k.pop();
      if (t.length) {
        t[0] = lt;
        k[0] = lk;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1;
          const r = l + 1;
          let m = i;
          if (l < t.length && k[l] < k[m]) m = l;
          if (r < t.length && k[r] < k[m]) m = r;
          if (m === i) break;
          [t[m], t[i]] = [t[i], t[m]];
          [k[m], k[i]] = [k[i], k[m]];
          i = m;
        }
      }
      return top;
    }
  }

  FO.findPath = function (from, goal, opts) {
    const o = opts || {};
    const blocked = o.blocked || (() => false);
    const near = o.near || 0;
    const max = o.max || 8000;
    if (from < 0 || goal < 0) return null;
    if (FO.hexDist(from, goal) <= near) return [];
    stamp = (stamp + 1) >>> 0;
    if (!stamp) {
      MARK.fill(0);
      stamp = 1;
    }
    const open = new Heap();
    MARK[from] = stamp;
    G[from] = 0;
    FROM[from] = -1;
    open.push(from, FO.hexDist(from, goal));
    let expanded = 0;
    let best = -1;
    while (open.size && expanded < max) {
      const cur = open.pop();
      expanded++;
      const d = FO.hexDist(cur, goal);
      if (d <= near || cur === goal) {
        best = cur;
        break;
      }
      for (let dir = 0; dir < 6; dir++) {
        const n = FO.hexStep(cur, dir);
        if (n < 0) continue;
        if (n !== goal || near === 0) {
          if (blocked(n)) continue;
        } else {
          continue;
        }
        const g = G[cur] + 1;
        if (MARK[n] === stamp && G[n] <= g) continue;
        MARK[n] = stamp;
        G[n] = g;
        FROM[n] = cur;
        open.push(n, g + FO.hexDist(n, goal) * 1.001);
      }
    }
    if (best < 0) return null;
    const path = [];
    for (let t = best; t !== from; t = FROM[t]) path.push(t);
    path.reverse();
    if (o.maxLen && path.length > o.maxLen) return null;
    return path;
  };
})(globalThis.FO = globalThis.FO || {});
