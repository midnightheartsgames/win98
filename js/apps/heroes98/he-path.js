(function (H) {
  'use strict';
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  const push = (heap, item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = heap => {
    const top = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const a = i * 2 + 1, b = a + 1;
        let m = i;
        if (a < heap.length && heap[a][0] < heap[m][0]) m = a;
        if (b < heap.length && heap[b][0] < heap[m][0]) m = b;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };

  const find = (w, h, start, goals, cost, terminal, minCost) => {
    const n = w * h, g = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
    const goalList = [...goals], diag = H.MAP.diagonal;
    const est = i => {
      const c = i % w, r = (i / w) | 0;
      let best = Infinity;
      for (const q of goalList) {
        const dx = Math.abs(q % w - c), dy = Math.abs(((q / w) | 0) - r);
        best = Math.min(best, (Math.max(dx, dy) - Math.min(dx, dy) + Math.min(dx, dy) * diag) * minCost);
      }
      return best;
    };
    const heap = [];
    g[start] = 0;
    push(heap, [est(start), start]);
    while (heap.length) {
      const [, u] = pop(heap);
      if (done[u]) continue;
      done[u] = 1;
      if (goals.has(u)) {
        const out = [];
        for (let i = u; i !== start; i = prev[i]) out.push(i);
        return { cells: out.reverse(), cost: g[u] };
      }
      if (u !== start && terminal(u)) continue;
      const uc = u % w, ur = (u / w) | 0;
      for (const [dc, dr] of DIRS) {
        const c = uc + dc, r = ur + dr;
        if (c < 0 || r < 0 || c >= w || r >= h) continue;
        const v = r * w + c, k = cost(v);
        if (!k || done[v]) continue;
        const isDiag = dc && dr;
        if (isDiag && !cost(ur * w + c) && !cost(r * w + uc)) continue;
        const ng = g[u] + k * (isDiag ? diag : 1);
        if (ng < g[v] - 1e-9) {
          g[v] = ng;
          prev[v] = u;
          push(heap, [ng + est(v), v]);
        }
      }
    }
    return null;
  };

  H.Path = { DIRS, find, push, pop };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
