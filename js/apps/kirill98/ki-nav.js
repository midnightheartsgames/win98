(function (K) {
  'use strict';

  const TILE = 64, SHIFT = 6, RADIUS = 0.35, STEP = 0.45, HEIGHT = 1.78, SLOPE = Math.cos(40 * Math.PI / 180), DEEP = 1.2;
  const BRUSH = 1 / 0.7, MARGIN = 40, SPAN = 360, NEAR = 170, ROAD_REACH = 200, POPS = 70000, SQRT2 = Math.SQRT2;
  const FREE = 0, WALL = 1, BUSH = 2, SAMPLES = [[0, 0], [0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]], ALL = 31;
  const cache = new WeakMap();

  function make(W) {
    const size = Math.round(W.terrain.SIZE || K.MAP.size);
    return { W, size, nt: Math.ceil(size / TILE), tiles: new Map(), graph: null, built: 0 };
  }

  const of = W => {
    let N = cache.get(W);
    if (!N) { N = make(W); cache.set(W, N); }
    return N;
  };

  const inside = (bx, x, z, margin) => {
    const dx = x - bx.x, dz = z - bx.z, u = dx * bx.c + dz * bx.s, v = -dx * bx.s + dz * bx.c;
    return Math.abs(u) <= bx.hw + margin && Math.abs(v) <= bx.hd + margin;
  };

  function build(N, ti, tj) {
    const W = N.W, T = W.terrain, F = W.flora, x0 = ti * TILE, z0 = tj * TILE, cells = new Uint8Array(TILE * TILE), ground = new Float32Array(TILE * TILE);
    for (let j = 0; j < TILE; j++) {
      for (let i = 0; i < TILE; i++) {
        const x = x0 + i + 0.5, z = z0 + j + 0.5, k = j * TILE + i;
        if (x >= N.size || z >= N.size) { cells[k] = WALL; continue; }
        const h = T.heightAt(x, z);
        ground[k] = h;
        if (T.normalAt(x, z)[1] < SLOPE || T.waterAt(x, z) - h > DEEP || (T.cascadeAt && T.cascadeAt(x, z))) cells[k] = WALL;
        else if (F && F.bushAt && F.bushAt(x, z, 0.45)) cells[k] = BUSH;
      }
    }
    const open = new Uint8Array(TILE * TILE).fill(ALL), edges = new Uint8Array(TILE * TILE).fill(63);
    const EDGE = [[1, 0], [1, 0.3], [1, -0.3], [0, 0.5], [0.3, 0.5], [-0.3, 0.5]];
    const paint = (bx, margin, fn) => {
      const ex = Math.abs(bx.hw * bx.c) + Math.abs(bx.hd * bx.s) + margin + 0.3, ez = Math.abs(bx.hw * bx.s) + Math.abs(bx.hd * bx.c) + margin + 0.3;
      const i0 = Math.max(0, Math.floor(bx.x - ex) - x0), i1 = Math.min(TILE - 1, Math.floor(bx.x + ex) - x0);
      const j0 = Math.max(0, Math.floor(bx.z - ez) - z0), j1 = Math.min(TILE - 1, Math.floor(bx.z + ez) - z0);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(j * TILE + i, x0 + i + 0.5, z0 + j + 0.5);
    };
    const boxes = W.near ? W.near(x0 + TILE / 2, z0 + TILE / 2, TILE * 0.75) : [];
    for (const bx of boxes) if (bx.deck || bx.floor) paint(bx, 0, (k, x, z) => { if (inside(bx, x, z, 0)) { cells[k] = FREE; ground[k] = bx.y1; } });
    for (const bx of boxes) {
      if (bx.deck || bx.floor) continue;
      paint(bx, RADIUS, (k, x, z) => {
        if (bx.y1 <= ground[k] + STEP || bx.y0 >= ground[k] + HEIGHT) return;
        for (let s = 0; s < 5; s++) if (inside(bx, x + SAMPLES[s][0], z + SAMPLES[s][1], RADIUS)) open[k] &= ~(1 << s);
        for (let e = 0; e < 6; e++) { const ex = e < 3 ? 0.5 : EDGE[e][0], ez = e < 3 ? EDGE[e][1] : 0.5; if (inside(bx, x + ex, z + ez, RADIUS)) edges[k] &= ~(1 << e); }
      });
    }
    const disc = (cx, cz, r) => {
      const i0 = Math.max(0, Math.floor(cx - r - 0.3) - x0), i1 = Math.min(TILE - 1, Math.floor(cx + r + 0.3) - x0);
      const j0 = Math.max(0, Math.floor(cz - r - 0.3) - z0), j1 = Math.min(TILE - 1, Math.floor(cz + r + 0.3) - z0);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const k = j * TILE + i, x = x0 + i + 0.5, z = z0 + j + 0.5;
        for (let s = 0; s < 5; s++) if (Math.hypot(x + SAMPLES[s][0] - cx, z + SAMPLES[s][1] - cz) < r) open[k] &= ~(1 << s);
        for (let e = 0; e < 6; e++) { const ex = e < 3 ? 0.5 : EDGE[e][0], ez = e < 3 ? EDGE[e][1] : 0.5; if (Math.hypot(x + ex - cx, z + ez - cz) < r) edges[k] &= ~(1 << e); }
      }
    };
    if (F && F.trunksNear) {
      const tr = F.trees;
      F.trunksNear(x0 + TILE / 2, z0 + TILE / 2, TILE * 0.75, t => disc(tr.X[t], tr.Z[t], tr.RAD[t] + RADIUS));
      if (F.elder) disc(F.elder.x, F.elder.z, F.elder.r + RADIUS);
    }
    const portal = new Map();
    if (K.Places && K.Places.town) {
      const o = K.Places.town(T);
      for (const d of Object.values(o.doors)) {
        if (!d.inside || Math.abs(d.at[0] - (x0 + TILE / 2)) > TILE || Math.abs(d.at[1] - (z0 + TILE / 2)) > TILE) continue;
        const dx = d.inside[0] - d.at[0], dz = d.inside[1] - d.at[1], len = Math.hypot(dx, dz), n = Math.ceil(len / 0.2);
        for (let s = 0; s <= n; s++) {
          const x = d.at[0] + dx * s / n, z = d.at[1] + dz * s / n, i = Math.floor(x) - x0, j = Math.floor(z) - z0;
          if (i < 0 || j < 0 || i >= TILE || j >= TILE) continue;
          const k = j * TILE + i;
          open[k] = ALL;
          if (cells[k] === WALL) cells[k] = FREE;
          if (!portal.has(k)) portal.set(k, [x, z]);
        }
      }
    }
    const spot = new Uint8Array(TILE * TILE);
    for (let k = 0; k < TILE * TILE; k++) {
      if (!open[k]) { cells[k] = WALL; continue; }
      let s = 0;
      while (!(open[k] & (1 << s))) s++;
      spot[k] = s;
    }
    cells.spot = spot;
    cells.open = open;
    cells.portal = portal;
    cells.edges = edges;
    N.built++;
    return cells;
  }

  const tileOf = (N, i, j) => { cell(N, i, j); return N.tiles.get((j >> SHIFT) * N.nt + (i >> SHIFT)); };
  const slot = (i, j) => (j & (TILE - 1)) * TILE + (i & (TILE - 1));
  const LANE_X = [1, 8, 16], LANE_Z = [1, 2, 4];
  const links = (N, i, j, di, dj) => {
    if (di && dj) return links(N, i, j, di, 0) && links(N, i, j, 0, dj) && links(N, i + di, j, 0, dj) && links(N, i, j + dj, di, 0);
    if (cell(N, i, j) === WALL || cell(N, i + di, j + dj) === WALL) return false;
    const ta = tileOf(N, i, j), tb = tileOf(N, i + di, j + dj), ka = slot(i, j), kb = slot(i + di, j + dj);
    if (ta.portal.has(ka) || tb.portal.has(kb)) return true;
    const ei = di < 0 ? i - 1 : i, ej = dj < 0 ? j - 1 : j, te = tileOf(N, ei, ej), edge = te.edges[slot(ei, ej)], ma = ta.open[ka], mb = tb.open[kb];
    for (let l = 0; l < 3; l++) {
      const lane = di ? LANE_X[l] : LANE_Z[l], eb = di ? 1 << l : 1 << (l + 3);
      if ((ma & lane) && (mb & lane) && (edge & eb)) return true;
    }
    return false;
  };

  function cell(N, i, j) {
    if (i < 0 || j < 0 || i >= N.size || j >= N.size) return WALL;
    const key = (j >> SHIFT) * N.nt + (i >> SHIFT);
    let t = N.tiles.get(key);
    if (!t) { t = build(N, i >> SHIFT, j >> SHIFT); N.tiles.set(key, t); }
    return t[(j & (TILE - 1)) * TILE + (i & (TILE - 1))];
  }

  const blocked = (N, x, z) => cell(N, Math.floor(x), Math.floor(z)) === WALL;

  const roomy = (N, x, z) => {
    const i = Math.floor(x), j = Math.floor(z);
    if (cell(N, i, j) === WALL) return false;
    const t = N.tiles.get((j >> SHIFT) * N.nt + (i >> SHIFT)), k = (j & (TILE - 1)) * TILE + (i & (TILE - 1)), m = t.open[k];
    if (t.portal.has(k)) return true;
    if (!(m & 1)) return false;
    const fx = x - i - 0.5, fz = z - j - 0.5, s = Math.abs(fx) < 0.15 && Math.abs(fz) < 0.15 ? 0 : Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 1 : 2) : (fz > 0 ? 3 : 4);
    return !!(m & (1 << s));
  };

  function point(N, i, j) {
    cell(N, i, j);
    const t = N.tiles.get((j >> SHIFT) * N.nt + (i >> SHIFT)), k = (j & (TILE - 1)) * TILE + (i & (TILE - 1));
    if (t && t.portal && t.portal.has(k)) return t.portal.get(k).slice();
    const s = t && t.spot ? SAMPLES[t.spot[k]] : SAMPLES[0];
    return [i + 0.5 + s[0], j + 0.5 + s[1]];
  }

  const avoided = (avoid, x, z) => {
    for (const a of avoid) if (Math.hypot(x - a[0], z - a[1]) < a[2]) return true;
    return false;
  };

  function brushOn(N, a, b, o) {
    const avoid = (o && o.avoid) || [], dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), n = Math.max(1, Math.ceil(d / 0.3));
    let bush = 0, last = -1;
    for (let s = 1; s <= n; s++) {
      const x = a[0] + dx * s / n, z = a[1] + dz * s / n;
      if (!roomy(N, x, z) || (avoid.length && avoided(avoid, x, z))) return -1;
      const key = Math.floor(z) * N.size + Math.floor(x);
      if (key !== last && cell(N, Math.floor(x), Math.floor(z)) === BUSH) bush++;
      last = key;
    }
    return bush;
  }

  const line = (N, a, b, o) => brushOn(N, a, b, o) >= 0;

  function nearestFree(N, i, j, ok) {
    for (let r = 1; r <= 4; r++) {
      let best = null, bd = Infinity;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r || !ok(i + di, j + dj)) continue;
        const d = di * di + dj * dj;
        if (d < bd) { bd = d; best = [i + di, j + dj]; }
      }
      if (best) return best;
    }
    return null;
  }

  const buf = { n: 0, stamp: 0 };
  function arrays(n) {
    if (buf.n < n) {
      buf.n = n;
      buf.g = new Float32Array(n);
      buf.from = new Int32Array(n);
      buf.seen = new Uint32Array(n);
      buf.shut = new Uint32Array(n);
      buf.heap = new Int32Array(n * 2);
      buf.f = new Float32Array(n * 2);
      buf.stamp = 0;
    }
    buf.stamp++;
    if (buf.stamp > 4e9) { buf.seen.fill(0); buf.shut.fill(0); buf.stamp = 1; }
    return buf;
  }

  function smooth(N, cells, o) {
    const out = [], elf = o && o.side === 'elf', sum = [0];
    for (let k = 1; k < cells.length; k++) sum.push(sum[k - 1] + (cell(N, Math.floor(cells[k][0]), Math.floor(cells[k][1])) === BUSH ? 1 : 0));
    const fits = (i, j) => { const b = brushOn(N, cells[i], cells[j], o); return b >= 0 && (elf || b <= sum[j] - sum[i] + 1); };
    let i = 0;
    while (i < cells.length - 1) {
      let j = cells.length - 1;
      while (j > i + 1 && !fits(i, j)) j--;
      out.push(cells[j]);
      i = j;
    }
    return out;
  }

  function find(N, from, to, o) {
    const opt = o || {}, elf = opt.side === 'elf', avoid = opt.avoid || [];
    const si = Math.floor(from[0]), sj = Math.floor(from[1]);
    const open = (i, j) => cell(N, i, j) !== WALL && !(avoid.length && avoided(avoid, i + 0.5, j + 0.5));
    let gi = Math.floor(to[0]), gj = Math.floor(to[1]), exact = true;
    if (!open(gi, gj)) {
      const n = nearestFree(N, gi, gj, open);
      if (!n) return { ok: false, pts: [] };
      [gi, gj] = n;
      exact = false;
    }
    if (si === gi && sj === gj) return { ok: true, pts: [exact ? [to[0], to[1]] : point(N, gi, gj)] };
    const ox = Math.min(si, gi) - MARGIN, oz = Math.min(sj, gj) - MARGIN, wx = Math.abs(gi - si) + MARGIN * 2 + 1, wz = Math.abs(gj - sj) + MARGIN * 2 + 1;
    if (wx > SPAN || wz > SPAN) return null;
    const A = arrays(wx * wz), st = A.stamp, g = A.g, from_ = A.from, seen = A.seen, shut = A.shut, heap = A.heap, f = A.f;
    const idx = (i, j) => (j - oz) * wx + (i - ox);
    const hOf = (i, j) => { const dx = Math.abs(i - gi), dz = Math.abs(j - gj); return dx + dz + (SQRT2 - 2) * Math.min(dx, dz); };
    let size = 0;
    const push = (k, v) => {
      if (size >= heap.length) return;
      let p = size++;
      while (p > 0) { const q = (p - 1) >> 1; if (f[q] <= v) break; heap[p] = heap[q]; f[p] = f[q]; p = q; }
      heap[p] = k;
      f[p] = v;
    };
    const pop = () => {
      const top = heap[0], lk = heap[--size], lv = f[size];
      let p = 0;
      while (true) {
        let c = p * 2 + 1;
        if (c >= size) break;
        if (c + 1 < size && f[c + 1] < f[c]) c++;
        if (f[c] >= lv) break;
        heap[p] = heap[c]; f[p] = f[c]; p = c;
      }
      heap[p] = lk;
      f[p] = lv;
      return top;
    };
    const s0 = idx(si, sj), goal = idx(gi, gj);
    g[s0] = 0;
    seen[s0] = st;
    from_[s0] = -1;
    push(s0, hOf(si, sj));
    let best = s0, bestH = hOf(si, sj), pops = 0, found = false;
    while (size > 0 && pops < POPS) {
      const k = pop();
      if (shut[k] === st) continue;
      shut[k] = st;
      pops++;
      if (k === goal) { found = true; break; }
      const i = k % wx + ox, j = (k / wx | 0) + oz, gk = g[k];
      const hk = hOf(i, j);
      if (hk < bestH) { bestH = hk; best = k; }
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const ni = i + di, nj = j + dj;
          if (ni < ox || nj < oz || ni >= ox + wx || nj >= oz + wz) continue;
          const c = cell(N, ni, nj);
          if (c === WALL || (avoid.length && avoided(avoid, ni + 0.5, nj + 0.5))) continue;
          if (di && dj && (cell(N, i + di, j) === WALL || cell(N, i, j + dj) === WALL)) continue;
          if (!links(N, i, j, di, dj)) continue;
          const nk = idx(ni, nj);
          if (shut[nk] === st) continue;
          const step = (di && dj ? SQRT2 : 1) * (c === BUSH && !elf ? BRUSH : 1), ng = gk + step;
          if (seen[nk] === st && g[nk] <= ng) continue;
          seen[nk] = st;
          g[nk] = ng;
          from_[nk] = k;
          push(nk, ng + hOf(ni, nj));
        }
      }
    }
    const end = found ? goal : best, chain = [];
    for (let k = end; k >= 0; k = from_[k]) chain.push(point(N, k % wx + ox, (k / wx | 0) + oz));
    chain.reverse();
    chain[0] = [from[0], from[1]];
    if (found && exact) chain[chain.length - 1] = [to[0], to[1]];
    return { ok: found, pts: chain.length > 1 ? smooth(N, chain, opt) : [], pops };
  }

  function graph(N) {
    if (N.graph) return N.graph;
    const nodes = [], index = new Map();
    const node = p => {
      const key = Math.round(p[0]) + ',' + Math.round(p[1]);
      if (!index.has(key)) { index.set(key, nodes.length); nodes.push({ x: p[0], z: p[1], out: [] }); }
      return index.get(key);
    };
    for (const r of K.Places.ROADS) {
      for (let i = 1; i < r.pts.length; i++) {
        const a = node(r.pts[i - 1]), b = node(r.pts[i]), len = Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]);
        const e = { a, b, len, trail: r.kind === 'trail' };
        nodes[a].out.push(e);
        nodes[b].out.push(e);
      }
    }
    N.graph = { nodes };
    return N.graph;
  }

  function roads(N, from, to, elf) {
    const G = graph(N), n = G.nodes.length, dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
    const far = (nd, p) => Math.hypot(nd.x - p[0], nd.z - p[1]);
    G.nodes.forEach((nd, i) => { const d = far(nd, from); if (d < ROAD_REACH) dist[i] = d * 1.3; });
    for (;;) {
      let u = -1;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0) break;
      done[u] = 1;
      for (const e of G.nodes[u].out) {
        if (e.trail && !elf) continue;
        const v = e.a === u ? e.b : e.a;
        if (dist[u] + e.len < dist[v]) { dist[v] = dist[u] + e.len; prev[v] = u; }
      }
    }
    let end = -1, bestCost = Infinity;
    G.nodes.forEach((nd, i) => { const d = far(nd, to); if (d < ROAD_REACH && dist[i] + d * 1.3 < bestCost) { bestCost = dist[i] + d * 1.3; end = i; } });
    if (end < 0) return null;
    const chain = [];
    for (let k = end; k >= 0; k = prev[k]) chain.push(G.nodes[k]);
    return chain.reverse().map(nd => [nd.x, nd.z]);
  }

  function route(N, from, to, o) {
    const d = Math.hypot(to[0] - from[0], to[1] - from[1]);
    if (d < NEAR) {
      const r = find(N, from, to, o);
      if (r && r.ok) return r;
    }
    const chain = roads(N, from, to, o && o.side === 'elf');
    if (!chain || !chain.length) return find(N, from, to, o) || { ok: false, pts: [] };
    const head = find(N, from, chain[0], o) || { ok: false, pts: [chain[0]] }, tail = find(N, chain[chain.length - 1], to, o) || { ok: false, pts: [to.slice()] };
    return { ok: head.ok && tail.ok, pts: [...head.pts, ...chain.slice(1), ...tail.pts], road: true };
  }

  K.Nav = { TILE, RADIUS, FREE, WALL, BUSH, of, cell, point, blocked, line, find, graph, route };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
