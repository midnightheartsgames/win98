(function (Q) {
  'use strict';
  const C = Q.CONTENTS;
  const S = 32;
  const CELL = 64;
  const PM = Q.PLAYER_MINS, PX = Q.PLAYER_MAXS;
  const ZERO = [0, 0, 0];

  class Heap {
    constructor() { this.k = []; this.v = []; }
    push(key, val) {
      const k = this.k, v = this.v;
      let i = k.length;
      k.push(key); v.push(val);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (k[p] <= key) break;
        k[i] = k[p]; v[i] = v[p]; i = p;
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
          k[i] = k[c]; v[i] = v[c]; i = c;
        }
        k[i] = lk; v[i] = lv;
      }
      return top;
    }
    get size() { return this.k.length; }
  }

  class Nav {
    constructor(world) {
      this.world = world;
      this.nodes = [];
      this.hash = new Map();
      this.t0 = Date.now();
      this.sample();
      this.linkWalk();
      this.linkDrops();
      this.linkJumps();
      this.linkSpecial();
      this.prune();
      this.components();
      this.compact();
      this.buildMs = Date.now() - this.t0;
    }

    key(x, y) { return (Math.floor(x / CELL) & 0xffff) * 65536 + (Math.floor(y / CELL) & 0xffff); }

    near(pos, r, fn) {
      const x0 = Math.floor((pos[0] - r) / CELL), x1 = Math.floor((pos[0] + r) / CELL);
      const y0 = Math.floor((pos[1] - r) / CELL), y1 = Math.floor((pos[1] + r) / CELL);
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          const l = this.hash.get((x & 0xffff) * 65536 + (y & 0xffff));
          if (l) for (const i of l) fn(this.nodes[i], i);
        }
      }
    }

    addNode(pos, flags) {
      let dup = false;
      this.near(pos, 14, n => { if (Math.abs(n.pos[2] - pos[2]) < 20 && Q.vdist2(n.pos, pos) < 14) dup = true; });
      if (dup) return -1;
      const id = this.nodes.length;
      this.nodes.push({ id, pos, links: [], flags: flags || 0, comp: -1 });
      const k = this.key(pos[0], pos[1]);
      if (!this.hash.has(k)) this.hash.set(k, []);
      this.hash.get(k).push(id);
      return id;
    }

    hazard(pos) {
      const w = this.world;
      const feet = [pos[0], pos[1], pos[2] - 23];
      if (w.pointContents(feet) & Q.MASK_LIQUID) return true;
      const mn = Q.vadd(pos, PM), mx = Q.vadd(pos, PX);
      for (const h of w.hurts) if (Q.boxOverlap(mn, mx, h.min, h.max)) return true;
      return false;
    }

    settle(pos) {
      const w = this.world;
      for (const lift of [0, 22]) {
        const p = [pos[0], pos[1], pos[2] + lift];
        if (w.testBox(p, PM, PX)) continue;
        const t = w.trace(p, [p[0], p[1], p[2] - 40 - lift], PM, PX, Q.MASK_PLAYER);
        if (t.fraction >= 1 || t.startSolid || !t.normal || t.normal[2] < Q.MIN_WALK_NORMAL) return null;
        return t.endpos;
      }
      return null;
    }

    sample() {
      const w = this.world;
      let zCap = -Infinity;
      for (const e of w.ents) if (e.pos && (e.type === 'item' || e.type === 'spawn')) zCap = Math.max(zCap, e.pos[2]);
      for (const p of w.pads) zCap = Math.max(zCap, p.target[2]);
      zCap += 200;
      const nud = [[0, 0], [16, 0], [-16, 0], [0, 16], [0, -16], [16, 16], [-16, 16], [16, -16], [-16, -16], [24, 0], [-24, 0], [0, 24], [0, -24]];
      for (const b of w.brushes) {
        if (!(b.contents & (C.SOLID | C.PLAYERCLIP))) continue;
        for (const f of b.faces) {
          const pl = b.planes[f.plane];
          if (pl.n[2] < Q.MIN_WALK_NORMAL || Q.matInfo(pl.mat).sky) continue;
          if (f.verts.every(v => v[2] > zCap)) continue;
          const vs = f.verts;
          let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
          for (const v of vs) { x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); y0 = Math.min(y0, v[1]); y1 = Math.max(y1, v[1]); }
          for (let x = Math.ceil(x0 / S) * S; x <= x1; x += S) {
            for (let y = Math.ceil(y0 / S) * S; y <= y1; y += S) {
              if (!this.inPoly(vs, x, y)) continue;
              const z = (pl.d - pl.n[0] * x - pl.n[1] * y) / pl.n[2];
              for (const d of nud) {
                const p = this.settle([x + d[0], y + d[1], z + 25]);
                if (!p) continue;
                if (this.hazard(p)) break;
                this.addNode(p, 0);
                break;
              }
            }
          }
        }
      }
    }

    inPoly(vs, x, y) {
      let inside = false;
      for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const a = vs[i], b = vs[j];
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1] + 1e-12) + a[0]) inside = !inside;
      }
      if (inside) return true;
      for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const a = vs[i], b = vs[j];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const l2 = dx * dx + dy * dy;
        const t = l2 > 0 ? Q.clamp(((x - a[0]) * dx + (y - a[1]) * dy) / l2, 0, 1) : 0;
        if (Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y) < 0.5) return true;
      }
      return false;
    }

    walkable(a, b) {
      const w = this.world;
      const up = w.trace(a, [a[0], a[1], a[2] + 18], PM, PX, Q.MASK_PLAYER);
      const hz = up.endpos[2];
      const across = w.trace(up.endpos, [b[0], b[1], hz], PM, PX, Q.MASK_PLAYER);
      if (across.fraction < 1) return false;
      const down = w.trace(across.endpos, [b[0], b[1], b[2] - 24], PM, PX, Q.MASK_PLAYER);
      if (down.fraction >= 1 || Math.abs(down.endpos[2] - b[2]) > 4) return false;
      for (const f of [0.25, 0.5, 0.75]) {
        const m = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.max(a[2], b[2]) + 18];
        const g = w.trace(m, [m[0], m[1], Math.min(a[2], b[2]) - 30], PM, PX, Q.MASK_PLAYER);
        if (g.fraction >= 1 || !g.normal || g.normal[2] < Q.MIN_WALK_NORMAL) return false;
        if (this.hazard(g.endpos)) return false;
      }
      return true;
    }

    link(a, b, cost, type) {
      const n = this.nodes[a];
      if (n.links.some(l => l.to === b)) return;
      n.links.push({ to: b, cost, type });
    }

    linkWalk() {
      for (const n of this.nodes) {
        this.near(n.pos, 64, (m, j) => {
          if (j === n.id) return;
          const dh = Q.vdist2(n.pos, m.pos);
          if (dh > 60 || dh < 1) return;
          const dz = m.pos[2] - n.pos[2];
          if (dz > 52 || dz < -40) return;
          if (dz <= 19 && this.walkable(n.pos, m.pos)) { this.link(n.id, j, Math.hypot(dh, dz) / 320, 'walk'); return; }
          if (dz <= 4 || dz > dh * 1.3 + 4) return;
          const w = this.world;
          if (w.trace([n.pos[0], n.pos[1], m.pos[2] + 20], [m.pos[0], m.pos[1], m.pos[2] + 20], PM, PX, Q.MASK_PLAYER).fraction < 1) return;
          const dir = Q.vnorm([m.pos[0] - n.pos[0], m.pos[1] - n.pos[1], 0]);
          const r = this.walkTo(n.pos, m.pos, dir);
          if (r) this.link(n.id, j, r + 0.05, 'walk');
        });
      }
    }

    walkTo(a, b, dir) {
      const w = this.world;
      const ps = { origin: a.slice(), velocity: [dir[0] * 250, dir[1] * 250, 0], yaw: Math.atan2(dir[1], dir[0]), pitch: 0, onGround: true, groundNormal: [0, 0, 1], ducked: false, viewheight: Q.VIEWHEIGHT, pmFlags: 0, pmTime: 0, waterLevel: 0, waterType: 0, dead: false, speed: 320, events: [], mins: PM, maxs: PX, time: 0 };
      const trace = (p0, p1, mn, mx) => w.trace(p0, p1, mn, mx, Q.MASK_PLAYER);
      const pc = p => w.pointContents(p);
      for (let i = 0; i < 40; i++) {
        const d = [b[0] - ps.origin[0], b[1] - ps.origin[1]];
        const yaw = Math.atan2(d[1], d[0]);
        ps.yaw = yaw;
        Q.pmove(ps, { forward: 127, right: 0, up: 0 }, Q.TICK, trace, pc);
        const dh = Math.hypot(b[0] - ps.origin[0], b[1] - ps.origin[1]), dz = ps.origin[2] - b[2];
        if (dh < 14 && dz > -6 && dz < 24) return (i + 1) * Q.TICK;
        if (!ps.onGround && ps.origin[2] < Math.min(a[2], b[2]) - 30) return 0;
      }
      return 0;
    }

    linkDrops() {
      const w = this.world;
      for (const n of this.nodes) {
        if (n.links.length >= 8) continue;
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4;
          const dir = [Math.cos(a), Math.sin(a), 0];
          const out = [n.pos[0] + dir[0] * 44, n.pos[1] + dir[1] * 44, n.pos[2]];
          const t = w.trace(n.pos, out, PM, PX, Q.MASK_PLAYER);
          if (t.fraction < 1) continue;
          const g = w.trace(out, [out[0], out[1], out[2] - 30], PM, PX, Q.MASK_PLAYER);
          if (g.fraction < 1) continue;
          const fall = w.trace(out, [out[0], out[1], out[2] - 3000], PM, PX, Q.MASK_PLAYER);
          if (fall.fraction >= 1 || !fall.normal || fall.normal[2] < Q.MIN_WALK_NORMAL) continue;
          const land = fall.endpos;
          if (this.hazard(land)) continue;
          const h = n.pos[2] - land[2];
          if (h < 24) continue;
          let best = -1, bd = 48;
          this.near(land, 48, (m, j) => {
            if (Math.abs(m.pos[2] - land[2]) > 12) return;
            const d = Q.vdist2(m.pos, land);
            if (d < bd) { bd = d; best = j; }
          });
          if (best >= 0) this.link(n.id, best, 44 / 320 + Math.sqrt(2 * h / Q.GRAVITY) + (h > 250 ? 1.5 : 0), 'drop');
        }
      }
    }

    simulate(start, vel, wish, jump, maxT, stopOnGround) {
      const w = this.world;
      const ps = { origin: start.slice(), velocity: vel.slice(), yaw: Math.atan2(wish[1], wish[0]), pitch: 0, onGround: false, groundNormal: null, ducked: false, viewheight: Q.VIEWHEIGHT, pmFlags: 0, pmTime: 0, waterLevel: 0, waterType: 0, dead: false, speed: 320, events: [], mins: PM, maxs: PX, time: 0 };
      const trace = (a, b, mn, mx) => w.trace(a, b, mn, mx, Q.MASK_PLAYER);
      const pc = p => w.pointContents(p);
      const move = wish[0] || wish[1] ? 127 : 0;
      let t = 0, left = false;
      for (let i = 0; i < maxT / Q.TICK; i++) {
        Q.pmove(ps, { forward: move, right: 0, up: jump && i < 2 ? 127 : 0 }, Q.TICK, trace, pc);
        t += Q.TICK;
        if (!ps.onGround) left = true;
        if (ps.waterLevel) return null;
        if (stopOnGround && left && ps.onGround) return { pos: ps.origin, t };
        if (ps.origin[2] < w.mins[2] - 64) return null;
      }
      return stopOnGround ? null : { pos: ps.origin, t };
    }

    linkJumps() {
      for (const n of this.nodes) {
        if (n.links.length >= 8) continue;
        this.near(n.pos, 80, (m, j) => {
          if (j === n.id) return;
          const dz = m.pos[2] - n.pos[2];
          const dh = Q.vdist2(n.pos, m.pos);
          if (dz <= 19 || dz > 42 || dh > 72 || dh < 8) return;
          if (n.links.some(l => l.to === j)) return;
          const dir = Q.vnorm([m.pos[0] - n.pos[0], m.pos[1] - n.pos[1], 0]);
          const r = this.simulate(n.pos, [0, 0, 0], dir, true, 1.5, true);
          if (!r || Q.vdist2(r.pos, m.pos) > 24 || Math.abs(r.pos[2] - m.pos[2]) > 6) return;
          this.link(n.id, j, r.t + 0.15, 'jump');
        });
      }
    }

    nearestTo(pos, maxH, maxDz) {
      let best = -1, bd = Infinity;
      this.near(pos, maxH, (m, j) => {
        const dz = Math.abs(m.pos[2] - pos[2]);
        if (dz > maxDz) return;
        const d = Q.vdist2(m.pos, pos) + dz * 2;
        if (d < bd) { bd = d; best = j; }
      });
      return best;
    }

    linkSpecial() {
      const w = this.world;
      this.padNodes = [];
      for (const pad of w.pads) {
        const center = [pad.pos[0], pad.pos[1], pad.pos[2] + 16];
        const height = pad.target[2] - center[2];
        const time = Math.sqrt(Math.max(1, height) / (0.5 * Q.GRAVITY));
        const flat = [pad.target[0] - center[0], pad.target[1] - center[1], 0];
        const dist = Q.vlen(flat);
        const dir = dist > 0 ? Q.vscale(flat, 1 / dist) : [0, 0, 0];
        const vel = [dir[0] * dist / time, dir[1] * dist / time, time * Q.GRAVITY];
        const start = [pad.pos[0], pad.pos[1], pad.pos[2] + 25];
        const r = this.simulate([start[0], start[1], start[2] + 2], vel, [0, 0, 0], false, 6, true);
        if (!r) { pad.navBroken = true; continue; }
        const land = this.nearestTo(r.pos, 64, 30);
        if (land < 0) { pad.navBroken = true; continue; }
        let ids = [];
        this.near(pad.pos, pad.r + 16, (m, j) => {
          if (Math.abs(m.pos[2] - start[2]) > 8) return;
          if (Q.boxOverlap(Q.vadd(m.pos, PM), Q.vadd(m.pos, PX), pad.min, pad.max)) ids.push(j);
        });
        if (!ids.length) {
          const id = this.addNode(start, 1);
          if (id >= 0) ids = [id];
          else ids = [this.nearestTo(start, 24, 12)].filter(i => i >= 0);
          for (const id2 of ids) {
            this.near(start, 72, (m, j) => {
              if (j === id2) return;
              if (Math.abs(m.pos[2] - start[2]) < 19 && this.walkable(m.pos, start)) this.link(j, id2, Q.vdist2(m.pos, start) / 320, 'walk');
            });
          }
        }
        for (const id of ids) {
          const nd = this.nodes[id];
          nd.links = [{ to: land, cost: r.t + 0.1, type: 'pad' }];
          nd.flags |= 1;
          nd.pad = pad;
          this.padNodes.push(id);
        }
      }
      for (const tp of w.teles) {
        const dest = this.nearestTo(tp.dest, 96, 40);
        if (dest < 0) { tp.navBroken = true; continue; }
        let ids = [];
        this.near([(tp.min[0] + tp.max[0]) / 2, (tp.min[1] + tp.max[1]) / 2, 0], 128, (m, j) => {
          if (Q.boxOverlap(Q.vadd(m.pos, PM), Q.vadd(m.pos, PX), tp.min, tp.max)) ids.push(j);
        });
        if (!ids.length) {
          const c = [(tp.min[0] + tp.max[0]) / 2, (tp.min[1] + tp.max[1]) / 2, tp.min[2] + 25];
          const g = w.trace(c, [c[0], c[1], c[2] - 64], PM, PX, Q.MASK_PLAYER);
          const p = g.fraction < 1 ? g.endpos : c;
          const id = this.addNode(p, 2);
          if (id >= 0) {
            ids = [id];
            this.near(p, 72, (m, j) => {
              if (j === id) return;
              if (Math.abs(m.pos[2] - p[2]) < 19 && this.walkable(m.pos, p)) this.link(j, id, Q.vdist2(m.pos, p) / 320, 'walk');
            });
          }
        }
        for (const id of ids) {
          const nd = this.nodes[id];
          nd.links = [{ to: dest, cost: 0.15, type: 'tele' }];
          nd.flags |= 2;
          nd.tele = tp;
        }
      }
    }

    prune() {
      for (const n of this.nodes) {
        if (n.flags & 3) continue;
        n.links = n.links.filter(l => {
          const m = this.nodes[l.to];
          return m && !(m.flags & 4);
        });
      }
    }

    components() {
      const N = this.nodes.length;
      const index = new Int32Array(N).fill(-1), low = new Int32Array(N), onStack = new Uint8Array(N);
      const stack = [];
      let idx = 0, comp = 0;
      const sizes = [];
      for (let s = 0; s < N; s++) {
        if (index[s] >= 0) continue;
        const work = [[s, 0]];
        index[s] = low[s] = idx++;
        stack.push(s); onStack[s] = 1;
        while (work.length) {
          const top = work[work.length - 1];
          const v = top[0];
          const links = this.nodes[v].links;
          if (top[1] < links.length) {
            const wv = links[top[1]++].to;
            if (index[wv] < 0) {
              index[wv] = low[wv] = idx++;
              stack.push(wv); onStack[wv] = 1;
              work.push([wv, 0]);
            } else if (onStack[wv]) low[v] = Math.min(low[v], index[wv]);
          } else {
            work.pop();
            if (work.length) { const u = work[work.length - 1][0]; low[u] = Math.min(low[u], low[v]); }
            if (low[v] === index[v]) {
              let size = 0, x;
              do { x = stack.pop(); onStack[x] = 0; this.nodes[x].comp = comp; size++; } while (x !== v);
              sizes.push(size);
              comp++;
            }
          }
        }
      }
      const votes = new Array(sizes.length).fill(0);
      for (const s of this.world.spawns) {
        const n = this.nearestTo(s.pos, 64, 40);
        if (n >= 0) votes[this.nodes[n].comp] += 1000;
      }
      for (let i = 0; i < sizes.length; i++) votes[i] += sizes[i] / 100000;
      let main = 0;
      for (let i = 1; i < sizes.length; i++) if (votes[i] > votes[main]) main = i;
      this.mainComp = main;
      this.compSizes = sizes;
    }

    compact() {
      const N = this.nodes.length;
      const rev = Array.from({ length: N }, () => []);
      for (const n of this.nodes) for (const l of n.links) rev[l.to].push(n.id);
      const keep = new Uint8Array(N);
      const q = [];
      for (const n of this.nodes) if (n.comp === this.mainComp) { keep[n.id] = 1; q.push(n.id); }
      while (q.length) { const v = q.pop(); for (const u of rev[v]) if (!keep[u]) { keep[u] = 1; q.push(u); } }
      const map = new Int32Array(N).fill(-1);
      const nodes = [];
      for (const n of this.nodes) if (keep[n.id]) { map[n.id] = nodes.length; nodes.push(n); }
      for (const n of nodes) {
        n.id = map[n.id];
        n.links = n.links.filter(l => map[l.to] >= 0).map(l => ({ to: map[l.to], cost: l.cost, type: l.type }));
      }
      this.nodes = nodes;
      this.hash = new Map();
      for (const n of nodes) {
        const k = this.key(n.pos[0], n.pos[1]);
        if (!this.hash.has(k)) this.hash.set(k, []);
        this.hash.get(k).push(n.id);
      }
      this.padNodes = (this.padNodes || []).map(i => map[i]).filter(i => i >= 0);
    }

    nearest(pos, maxDist) {
      maxDist = maxDist || 160;
      let best = -1;
      const w = this.world;
      const cands = [];
      this.near(pos, maxDist, (m, j) => {
        const dz = m.pos[2] - pos[2];
        if (dz > 40 || dz < -80) return;
        const d = Q.vdist2(m.pos, pos) + Math.abs(dz) * 1.5;
        if (d < maxDist) cands.push([d, j]);
      });
      cands.sort((a, b) => a[0] - b[0]);
      for (let i = 0; i < cands.length && i < 6; i++) {
        const m = this.nodes[cands[i][1]];
        const t = w.trace([pos[0], pos[1], pos[2] + 8], [m.pos[0], m.pos[1], m.pos[2] + 8], ZERO, ZERO, Q.MASK_PLAYER);
        if (t.fraction >= 1) { best = cands[i][1]; break; }
      }
      if (best < 0 && cands.length) best = cands[0][1];
      return best;
    }

    dijkstra(from) {
      const N = this.nodes.length;
      const dist = new Float32Array(N).fill(Infinity);
      const prev = new Int32Array(N).fill(-1);
      if (from < 0) return { dist, prev };
      const h = new Heap();
      dist[from] = 0;
      h.push(0, from);
      while (h.size) {
        const v = h.pop();
        const dv = dist[v];
        for (const l of this.nodes[v].links) {
          const nd = dv + l.cost;
          if (nd < dist[l.to]) { dist[l.to] = nd; prev[l.to] = v; h.push(nd, l.to); }
        }
      }
      return { dist, prev };
    }

    pathFrom(prev, to) {
      const path = [];
      let v = to;
      let guard = 0;
      while (v >= 0 && guard++ < 100000) { path.push(v); v = prev[v]; }
      return path.reverse();
    }

    path(a, b) {
      if (a < 0 || b < 0) return null;
      const N = this.nodes.length;
      const g = new Float32Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1);
      const closed = new Uint8Array(N);
      const goal = this.nodes[b].pos;
      const h = new Heap();
      g[a] = 0;
      h.push(Q.vdist(this.nodes[a].pos, goal) / 1200, a);
      while (h.size) {
        const v = h.pop();
        if (v === b) return this.pathFrom(prev, b);
        if (closed[v]) continue;
        closed[v] = 1;
        for (const l of this.nodes[v].links) {
          const nd = g[v] + l.cost;
          if (nd < g[l.to]) { g[l.to] = nd; prev[l.to] = v; h.push(nd + Q.vdist(this.nodes[l.to].pos, goal) / 1200, l.to); }
        }
      }
      return null;
    }

    linkType(a, b) {
      const l = this.nodes[a].links.find(x => x.to === b);
      return l ? l.type : null;
    }
  }
  Q.Nav = Nav;

  Q.getNav = function (world) {
    if (!world.nav) world.nav = new Nav(world);
    return world.nav;
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
