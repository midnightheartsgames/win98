(function (G) {
  'use strict';
  const { clamp, cumLen, pointAt, projectOn, offsetLine, subLine, reverseLine, SpatialHash, Heap, segT } = G;

  const RANK = [4, 3, 2, 1];
  const CYCLE = 28, GREEN = 11, AMBER = 2.5;

  function lineX(ax, ay, ux, uy, bx, by, vx, vy) {
    const den = ux * vy - uy * vx;
    if (Math.abs(den) < 0.08) return null;
    const t = ((bx - ax) * vy - (by - ay) * vx) / den;
    return [ax + ux * t, ay + uy * t, t];
  }

  function bezier(p0, p1, p2, p3, n) {
    const out = new Float32Array((n + 1) * 2);
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      out[i * 2] = a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0];
      out[i * 2 + 1] = a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1];
    }
    return out;
  }

  class Net {
    constructor(roads, opts) {
      const o = opts || {};
      this.M = o.M || 9.3;
      this.signals = o.signals || [];
      this.nodes = [];
      this.segs = [];
      this.lanes = [];
      this.lights = [];
      this.walkNodes = [];
      this.walkEdges = [];
      this.build(roads);
    }

    build(roads) {
      const M = this.M;
      const snap = 3.2 * M;
      const pts = [];
      for (const r of roads) { const p = r.pts; pts.push([p[0], p[1]], [p[p.length - 2], p[p.length - 1]]); }
      const parent = pts.map((_, i) => i);
      const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
      const hash = new SpatialHash(snap * 2);
      pts.forEach((p, i) => hash.insert(i, p[0], p[1], p[0], p[1]));
      const buf = [];
      pts.forEach((p, i) => {
        for (const j of hash.query(p[0] - snap, p[1] - snap, p[0] + snap, p[1] + snap, buf)) {
          if (j <= i) continue;
          const q = pts[j];
          if (Math.hypot(p[0] - q[0], p[1] - q[1]) <= snap) { const a = find(i), b = find(j); if (a !== b) parent[b] = a; }
        }
      });
      const nodeOf = new Map();
      const groups = new Map();
      pts.forEach((p, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(p); });
      for (const [r, list] of groups) {
        let x = 0, y = 0;
        for (const p of list) { x += p[0]; y += p[1]; }
        const node = { id: this.nodes.length, x: x / list.length, y: y / list.length, arms: [], kind: 0, light: -1, group: null, rank: 0 };
        this.nodes.push(node);
        nodeOf.set(r, node.id);
      }
      roads.forEach((r, k) => {
        const a = nodeOf.get(find(k * 2)), b = nodeOf.get(find(k * 2 + 1));
        if (a === b && G.lineLen(r.pts) < 6 * M) return;
        const p = new Float32Array(r.pts);
        p[0] = this.nodes[a].x; p[1] = this.nodes[a].y; p[p.length - 2] = this.nodes[b].x; p[p.length - 1] = this.nodes[b].y;
        const cum = cumLen(p);
        if (cum[cum.length - 1] < 1.5 * M) return;
        const lanes = r.lf + r.lb;
        const lw = clamp(r.w / lanes, 2.8 * M, 4.2 * M);
        const seg = {
          id: this.segs.length, road: r, pts: p, cum, len: cum[cum.length - 1], a, b, name: r.name, cls: r.cls,
          lf: r.lf, lb: r.lb, lw, w: Math.max(r.w, lanes * lw), sl: r.sl, sr: r.sr, median: r.median ? 1 : 0, bridge: r.bridge, da: 0, db: 0, fwd: [], back: []
        };
        this.segs.push(seg);
      });
      for (const s of this.segs) {
        for (const end of [0, 1]) {
          const node = this.nodes[end ? s.b : s.a];
          const p = s.pts, n = p.length / 2;
          const look = Math.min(s.len * 0.5, 8 * M);
          const q = pointAt(p, s.cum, end ? s.len - look : look);
          let ux = q[0] - node.x, uy = q[1] - node.y;
          const l = Math.hypot(ux, uy) || 1;
          ux /= l; uy /= l;
          node.arms.push({ seg: s.id, end, ux, uy, ang: Math.atan2(uy, ux), hw: s.w / 2, side: end ? s.sl : s.sr, sideL: end ? s.sr : s.sl, d: 0, rank: RANK[s.cls] || 1 });
        }
      }
      for (const node of this.nodes) {
        node.arms.sort((a, b) => a.ang - b.ang);
        const n = node.arms.length;
        node.rank = Math.max(0, ...node.arms.map(a => a.rank));
        if (n >= 3) node.kind = 2;
        else if (n === 2) {
          const a = node.arms[0], b = node.arms[1];
          const straight = -(a.ux * b.ux + a.uy * b.uy);
          node.kind = straight < 0.8 || Math.abs(a.hw - b.hw) > 2.5 * M ? 2 : 1;
        } else node.kind = 0;
      }
      for (const node of this.nodes) if (node.kind === 2) this.junctionGeom(node);
      for (const s of this.segs) {
        const nb = this.nodes[s.b], na = this.nodes[s.a];
        const armA = na.arms.find(a => a.seg === s.id && a.end === 0), armB = nb.arms.find(a => a.seg === s.id && a.end === 1);
        s.da = armA ? armA.d : 0; s.db = armB ? armB.d : 0;
        const room = s.len - 1.2 * M;
        if (s.da + s.db > room) { const k = Math.max(0, room) / (s.da + s.db || 1); s.da *= k; s.db *= k; if (armA) armA.d = s.da; if (armB) armB.d = s.db; }
      }
      for (const node of this.nodes) if (node.kind === 2) this.junctionPoly(node);
      for (const s of this.segs) this.makeLanes(s);
      for (const node of this.nodes) this.connect(node);
      this.makeLights();
      this.prune();
      this.makeWalk();
      this.index();
    }

    junctionGeom(node) {
      const M = this.M, arms = node.arms, n = arms.length;
      for (let i = 0; i < n; i++) {
        const a = arms[i], b = arms[(i + 1) % n];
        const ra = [-a.uy, a.ux], lb = [b.uy, -b.ux];
        const pa = [node.x + ra[0] * a.hw, node.y + ra[1] * a.hw], pb = [node.x + lb[0] * b.hw, node.y + lb[1] * b.hw];
        const x = lineX(pa[0], pa[1], a.ux, a.uy, pb[0], pb[1], b.ux, b.uy);
        a.cornerR = x && x[2] > -a.hw && x[2] < 30 * M ? [x[0], x[1]] : null;
        b.cornerL = a.cornerR;
        if (x) {
          const da = (x[0] - node.x) * a.ux + (x[1] - node.y) * a.uy;
          const db = (x[0] - node.x) * b.ux + (x[1] - node.y) * b.uy;
          if (da > 0 && da < 30 * M) a.d = Math.max(a.d, da);
          if (db > 0 && db < 30 * M) b.d = Math.max(b.d, db);
        }
      }
      for (const a of arms) a.d = clamp(a.d + 1.2 * M, a.hw * 0.4, 30 * M);
    }

    junctionPoly(node) {
      const M = this.M, arms = node.arms, n = arms.length;
      const poly = [];
      for (let i = 0; i < n; i++) {
        const a = arms[i], b = arms[(i + 1) % n];
        const cx = node.x + a.ux * a.d, cy = node.y + a.uy * a.d;
        const L = [cx + a.uy * a.hw, cy - a.ux * a.hw], R = [cx - a.uy * a.hw, cy + a.ux * a.hw];
        poly.push(L[0], L[1], R[0], R[1]);
        a.endL = L; a.endR = R;
        const bx = node.x + b.ux * b.d, by = node.y + b.uy * b.d;
        const BL = [bx + b.uy * b.hw, by - b.ux * b.hw];
        const C = a.cornerR;
        if (C && n >= 2) {
          const k = 6;
          for (let s = 1; s < k; s++) {
            const t = s / k, u = 1 - t;
            const x = u * u * R[0] + 2 * u * t * C[0] + t * t * BL[0], y = u * u * R[1] + 2 * u * t * C[1] + t * t * BL[1];
            poly.push(x, y);
          }
        }
      }
      node.poly = new Float32Array(poly);
      let r = 0;
      for (let i = 0; i < poly.length; i += 2) r = Math.max(r, Math.hypot(poly[i] - node.x, poly[i + 1] - node.y));
      node.r = r;
    }

    makeLanes(s) {
      const mk = (dir, k, n, twoWay) => {
        const off = twoWay ? s.lw * (n - 1 - k + 0.5) : s.lw * ((n - 1) / 2 - k);
        const base = dir > 0 ? s.pts : reverseLine(s.pts);
        const offp = offsetLine(base, off);
        const cum = cumLen(offp);
        const L = cum[cum.length - 1];
        const s0 = dir > 0 ? s.da : s.db, s1 = L - (dir > 0 ? s.db : s.da);
        const pts = s1 - s0 > 0.5 ? subLine(offp, cum, s0, s1) : subLine(offp, cum, Math.min(s0, L * 0.45), Math.max(s1, L * 0.55));
        const lane = { id: this.lanes.length, seg: s.id, dir, k, n, pts, cum: cumLen(pts), len: 0, next: [], prev: [], conn: false, node: -1, traffic: true, from: dir > 0 ? s.a : s.b, to: dir > 0 ? s.b : s.a, turn: 's', cls: s.cls, light: -1, group: -1 };
        lane.len = lane.cum[lane.cum.length - 1];
        this.lanes.push(lane);
        return lane.id;
      };
      const two = s.lb > 0;
      for (let k = 0; k < s.lf; k++) s.fwd.push(mk(1, k, s.lf, two));
      for (let k = 0; k < s.lb; k++) s.back.push(mk(-1, k, s.lb, two));
    }

    inLanes(node, arm) { const s = this.segs[arm.seg]; return arm.end === 1 ? s.fwd : s.back; }
    outLanes(node, arm) { const s = this.segs[arm.seg]; return arm.end === 0 ? s.fwd : s.back; }

    connector(a, b, turn, node) {
      const la = this.lanes[a], lb = this.lanes[b];
      const pa = la.pts, pb = lb.pts;
      const p0 = [pa[pa.length - 2], pa[pa.length - 1]], p3 = [pb[0], pb[1]];
      let ux = pa[pa.length - 2] - pa[pa.length - 4], uy = pa[pa.length - 1] - pa[pa.length - 3];
      let l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
      let vx = pb[2] - pb[0], vy = pb[3] - pb[1];
      l = Math.hypot(vx, vy) || 1; vx /= l; vy /= l;
      const D = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]);
      const c = D * (turn === 's' ? 0.34 : 0.5);
      const pts = D < 0.5 ? new Float32Array([p0[0], p0[1], p3[0] + 0.01, p3[1]]) : bezier(p0, [p0[0] + ux * c, p0[1] + uy * c], [p3[0] - vx * c, p3[1] - vy * c], p3, turn === 's' ? 3 : 8);
      const lane = { id: this.lanes.length, seg: -1, dir: 0, k: 0, n: 1, pts, cum: cumLen(pts), len: 0, next: [b], prev: [a], conn: true, node: node.id, traffic: true, from: la.from, to: lb.to, turn, cls: Math.min(la.cls, lb.cls), light: -1, group: -1, inLane: a, outLane: b };
      lane.len = lane.cum[lane.cum.length - 1];
      this.lanes.push(lane);
      la.next.push(lane.id);
      lb.prev.push(lane.id);
      return lane;
    }

    connect(node) {
      const arms = node.arms;
      if (arms.length === 1) return;
      const outs = [];
      for (const ai of arms) {
        const ins = this.inLanes(node, ai);
        if (!ins.length) continue;
        const iux = -ai.ux, iuy = -ai.uy;
        const made = new Set();
        const options = [];
        for (const ao of arms) {
          if (ao === ai) continue;
          const os = this.outLanes(node, ao);
          if (!os.length) continue;
          const cr = iux * ao.uy - iuy * ao.ux, dt = iux * ao.ux + iuy * ao.uy;
          const ang = Math.atan2(cr, dt);
          if (Math.abs(ang) > 2.7) continue;
          const turn = Math.abs(ang) < 0.55 ? 's' : ang > 0 ? 'r' : 'l';
          options.push({ ao, os, turn, ang });
        }
        const hasStraight = options.some(o => o.turn === 's');
        for (const o of options) {
          const nIn = ins.length, nOut = o.os.length;
          if (o.turn === 's' || arms.length === 2) {
            for (let k = 0; k < nIn; k++) {
              const kk = Math.min(k, nOut - 1);
              this.connector(ins[k], o.os[kk], 's', node).main = true;
              if (kk + 1 < nOut && (k + 1 >= nIn || kk + 1 > k)) this.connector(ins[k], o.os[kk + 1], 's', node);
              if (kk - 1 >= 0 && k > 0) this.connector(ins[k], o.os[kk - 1], 's', node);
              made.add(ins[k]);
            }
            for (let kk = nIn + 1; kk < nOut; kk++) this.connector(ins[nIn - 1], o.os[kk], 's', node);
          } else if (o.turn === 'r') {
            this.connector(ins[0], o.os[0], 'r', node).main = true; made.add(ins[0]);
            if (nOut > 1) this.connector(ins[0], o.os[1], 'r', node);
            if (!hasStraight && nIn > 1) { this.connector(ins[1], o.os[Math.min(1, nOut - 1)], 'r', node).main = true; made.add(ins[1]); }
          } else {
            this.connector(ins[nIn - 1], o.os[nOut - 1], 'l', node).main = true; made.add(ins[nIn - 1]);
            if (nOut > 1) this.connector(ins[nIn - 1], o.os[nOut - 2], 'l', node);
            if (!hasStraight && nIn > 1) { this.connector(ins[nIn - 2], o.os[Math.max(0, nOut - 2)], 'l', node).main = true; made.add(ins[nIn - 2]); }
          }
        }
        for (const k of ins) {
          if (made.has(k) || !options.length) continue;
          let best = options[0];
          for (const o of options) if (Math.abs(o.ang) < Math.abs(best.ang)) best = o;
          this.connector(k, best.os[Math.min(this.lanes[k].k, best.os.length - 1)], best.turn, node).main = true;
        }
      }
    }

    makeLights() {
      const M = this.M;
      const sig = this.signals;
      const cand = this.nodes.filter(n => n.kind === 2 && n.arms.length >= 3);
      const has = n => {
        for (const p of sig) if (Math.abs(p[0] - n.x) < 30 * M && Math.abs(p[1] - n.y) < 30 * M && Math.hypot(p[0] - n.x, p[1] - n.y) < Math.max(26 * M, n.r + 8 * M)) return true;
        const major = n.arms.filter(a => a.rank >= 3).length;
        return n.arms.length >= 4 && major >= 4;
      };
      const lit = cand.filter(has);
      const parent = new Map(lit.map(n => [n.id, n.id]));
      const find = i => { while (parent.get(i) !== i) { parent.set(i, parent.get(parent.get(i))); i = parent.get(i); } return i; };
      for (let i = 0; i < lit.length; i++) for (let j = i + 1; j < lit.length; j++) {
        const a = lit[i], b = lit[j];
        if (Math.abs(a.x - b.x) > 55 * M || Math.abs(a.y - b.y) > 55 * M) continue;
        const linked = a.arms.some(x => { const s = this.segs[x.seg]; return (s.a === b.id || s.b === b.id) && s.len < 55 * M; });
        if (linked) parent.set(find(b.id), find(a.id));
      }
      const groups = new Map();
      for (const n of lit) { const r = find(n.id); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(n); }
      for (const [, nodes] of groups) {
        let best = null;
        for (const n of nodes) for (const a of n.arms) { const s = this.segs[a.seg]; const key = a.rank * 1e6 + s.len; if (!best || key > best.key) best = { key, ang: a.ang }; }
        const id = this.lights.length;
        let cx = 0, cy = 0;
        for (const n of nodes) { cx += n.x; cy += n.y; }
        const L = { id, nodes: nodes.map(n => n.id), axis: best.ang, offset: (G.hash2(Math.round(cx / 97), Math.round(cy / 97), 5) * CYCLE), x: cx / nodes.length, y: cy / nodes.length };
        this.lights.push(L);
        for (const n of nodes) {
          n.light = id;
          for (const a of n.arms) a.group = Math.abs(Math.cos(a.ang - L.axis)) >= 0.7 ? 0 : 1;
        }
      }
      for (const lane of this.lanes) {
        if (lane.conn) continue;
        const node = this.nodes[lane.to];
        if (node.light < 0) continue;
        const s = this.segs[lane.seg];
        const arm = node.arms.find(a => a.seg === s.id && a.end === (lane.dir > 0 ? 1 : 0));
        if (!arm) continue;
        lane.light = node.light; lane.group = arm.group;
      }
    }

    lightState(id, group, t) {
      const L = this.lights[id];
      if (!L) return 0;
      const p = (t + L.offset) % CYCLE;
      const half = CYCLE / 2;
      const g = p < half ? 0 : 1;
      const local = p - g * half;
      if (g !== group) return 2;
      return local < GREEN ? 0 : 1;
    }

    prune() {
      const lanes = this.lanes;
      const n = lanes.length;
      const index = new Int32Array(n).fill(-1), low = new Int32Array(n), onStack = new Uint8Array(n), comp = new Int32Array(n).fill(-1);
      const stack = [];
      let idx = 0, nComp = 0;
      const work = [];
      for (let s = 0; s < n; s++) {
        if (index[s] >= 0) continue;
        work.push([s, 0]);
        while (work.length) {
          const top = work[work.length - 1];
          const v = top[0];
          if (top[1] === 0) { index[v] = low[v] = idx++; stack.push(v); onStack[v] = 1; }
          const nx = lanes[v].next;
          if (top[1] < nx.length) {
            const w = nx[top[1]++];
            if (index[w] < 0) work.push([w, 0]);
            else if (onStack[w]) low[v] = Math.min(low[v], index[w]);
            continue;
          }
          work.pop();
          if (work.length) { const u = work[work.length - 1][0]; low[u] = Math.min(low[u], low[v]); }
          if (low[v] === index[v]) {
            let w;
            do { w = stack.pop(); onStack[w] = 0; comp[w] = nComp; } while (w !== v);
            nComp++;
          }
        }
      }
      const size = new Map();
      for (let i = 0; i < n; i++) size.set(comp[i], (size.get(comp[i]) || 0) + lanes[i].len);
      let big = -1, bs = -1;
      for (const [c, s] of size) if (s > bs) { bs = s; big = c; }
      for (let i = 0; i < n; i++) lanes[i].traffic = comp[i] === big;
      this.sccShare = bs / [...size.values()].reduce((a, b) => a + b, 0);
    }

    makeWalk() {
      const M = this.M;
      const wn = this.walkNodes, we = this.walkEdges;
      const corner = new Map();
      const cornerNode = (node, i, x, y) => {
        const key = node.id + ':' + i;
        if (corner.has(key)) return corner.get(key);
        const id = wn.length;
        wn.push({ id, x, y, edges: [], node: node.id });
        corner.set(key, id);
        return id;
      };
      const addEdge = (a, b, pts, kind, extra) => {
        const id = we.length;
        const e = Object.assign({ id, a, b, pts, cum: cumLen(pts), len: 0, kind }, extra || {});
        e.len = e.cum[e.cum.length - 1];
        we.push(e);
        wn[a].edges.push(id); wn[b].edges.push(id);
        return id;
      };
      const armCorner = (node, i, right) => {
        const arms = node.arms, n = arms.length;
        const a = arms[i];
        const j = right ? (i + 1) % n : (i - 1 + n) % n;
        const b = arms[j];
        const sa = right ? a.side : a.sideL;
        const sb = right ? b.sideL : b.side;
        const offA = a.hw + Math.max(sa, 1.6 * M) / 2, offB = b.hw + Math.max(sb, 1.6 * M) / 2;
        const ra = right ? [-a.uy, a.ux] : [a.uy, -a.ux];
        const rb = right ? [b.uy, -b.ux] : [-b.uy, b.ux];
        let x = null;
        if (n > 1 && j !== i) x = lineX(node.x + ra[0] * offA, node.y + ra[1] * offA, a.ux, a.uy, node.x + rb[0] * offB, node.y + rb[1] * offB, b.ux, b.uy);
        let px, py;
        if (x && x[2] > -offA && x[2] < 32 * M) { px = x[0]; py = x[1]; }
        else { const d = Math.max(a.d, 0); px = node.x + ra[0] * offA + a.ux * d; py = node.y + ra[1] * offA + a.uy * d; }
        const key = right ? i : j;
        if (n === 1) return cornerNode(node, right ? 'r' : 'l', px, py);
        return cornerNode(node, key, px, py);
      };
      for (const s of this.segs) {
        const na = this.nodes[s.a], nb = this.nodes[s.b];
        const ia = na.arms.findIndex(a => a.seg === s.id && a.end === 0), ib = nb.arms.findIndex(a => a.seg === s.id && a.end === 1);
        for (const side of [1, -1]) {
          const w = side > 0 ? s.sr : s.sl;
          if (!w) continue;
          const ca = armCorner(na, ia, side > 0), cb = armCorner(nb, ib, side < 0);
          if (ca === cb) continue;
          const off = offsetLine(s.pts, side * (s.w / 2 + w / 2));
          const cum = cumLen(off);
          const L = cum[cum.length - 1];
          const mid = L - s.da - s.db > 2 ? subLine(off, cum, s.da, L - s.db) : new Float32Array(0);
          const pts = [wn[ca].x, wn[ca].y];
          for (let i = 2; i < mid.length - 2; i += 2) pts.push(mid[i], mid[i + 1]);
          pts.push(wn[cb].x, wn[cb].y);
          addEdge(ca, cb, new Float32Array(pts), 'side', { seg: s.id, side, w });
        }
      }
      for (const node of this.nodes) {
        const arms = node.arms, n = arms.length;
        if (n === 1) {
          const a = corner.get(node.id + ':r'), b = corner.get(node.id + ':l');
          if (a != null && b != null) addEdge(a, b, new Float32Array([wn[a].x, wn[a].y, wn[b].x, wn[b].y]), 'cross', { node: node.id, arm: 0 });
          continue;
        }
        if (node.kind !== 2) continue;
        for (let i = 0; i < n; i++) {
          const L = corner.get(node.id + ':' + ((i - 1 + n) % n)), R = corner.get(node.id + ':' + i);
          if (L == null || R == null || L === R) continue;
          const a = arms[i];
          const d = a.d + 1.8 * M;
          const cx = node.x + a.ux * d, cy = node.y + a.uy * d;
          const off = a.hw;
          const p1 = [cx + a.uy * off, cy - a.ux * off], p2 = [cx - a.uy * off, cy + a.ux * off];
          addEdge(L, R, new Float32Array([wn[L].x, wn[L].y, p1[0], p1[1], p2[0], p2[1], wn[R].x, wn[R].y]), 'cross', { node: node.id, arm: i, light: node.light, group: a.group, zebra: [p1[0], p1[1], p2[0], p2[1]], width: 3.2 * M });
        }
      }
    }

    index() {
      const M = this.M;
      this.laneHash = new SpatialHash(48 * M);
      this.laneSegs = [];
      for (const l of this.lanes) {
        if (l.conn) continue;
        const p = l.pts;
        for (let i = 0; i + 3 < p.length; i += 2) {
          const id = this.laneSegs.length / 2;
          this.laneSegs.push(l.id, i / 2);
          this.laneHash.insert(id, Math.min(p[i], p[i + 2]), Math.min(p[i + 1], p[i + 3]), Math.max(p[i], p[i + 2]), Math.max(p[i + 1], p[i + 3]));
        }
      }
      this.walkHash = new SpatialHash(48 * M);
      for (const e of this.walkEdges) {
        const p = e.pts;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); }
        this.walkHash.insert(e.id, x0, y0, x1, y1);
      }
      this.trafficLanes = this.lanes.filter(l => !l.conn && l.traffic && l.len > 4 * M).map(l => l.id);
      this.fields = new Map();
    }

    nearestLane(x, y, ang, maxD, onlyTraffic) {
      const R = maxD || 30 * this.M;
      const buf = this._nb || (this._nb = []);
      let best = null, bd = Infinity;
      for (const id of this.laneHash.query(x - R, y - R, x + R, y + R, buf)) {
        const lane = this.lanes[this.laneSegs[id * 2]];
        if (onlyTraffic && !lane.traffic) continue;
        const i = this.laneSegs[id * 2 + 1];
        const p = lane.pts;
        const ax = p[i * 2], ay = p[i * 2 + 1], bx = p[i * 2 + 2], by = p[i * 2 + 3];
        const t = segT(x, y, ax, ay, bx, by);
        const qx = ax + (bx - ax) * t, qy = ay + (by - ay) * t;
        let d = Math.hypot(x - qx, y - qy);
        if (d > R) continue;
        if (ang != null) { const la = Math.atan2(by - ay, bx - ax); const da = Math.abs(G.wrapAngle(la - ang)); d += da * 14 * this.M / 1.5; }
        if (d < bd) { bd = d; best = { lane: lane.id, s: lane.cum[i] + (lane.cum[i + 1] - lane.cum[i]) * t, x: qx, y: qy, a: Math.atan2(by - ay, bx - ax), d }; }
      }
      return best;
    }

    fieldTo(goalLane, goalS) {
      const key = goalLane;
      const cached = this.fields.get(key);
      if (cached) { this.fields.delete(key); this.fields.set(key, cached); return cached; }
      const lanes = this.lanes, n = lanes.length;
      const f = new Float32Array(n).fill(1e9);
      const heap = new Heap();
      const g = lanes[goalLane];
      f[goalLane] = Math.max(0, goalS != null ? goalS : g.len * 0.5);
      heap.push(f[goalLane], goalLane);
      while (heap.size) {
        const i = heap.pop();
        const c0 = f[i];
        for (const p of lanes[i].prev) {
          const lp = lanes[p];
          const nc = c0 + lp.len + (lp.conn && lp.turn !== 's' ? 6 * this.M : 0);
          if (nc < f[p]) { f[p] = nc; heap.push(nc, p); }
        }
      }
      this.fields.set(key, f);
      if (this.fields.size > 40) this.fields.delete(this.fields.keys().next().value);
      return f;
    }

    nearestWalk(x, y, maxD) {
      const R = maxD || 40 * this.M;
      const buf = this._wb || (this._wb = []);
      let best = null, bd = Infinity;
      for (const id of this.walkHash.query(x - R, y - R, x + R, y + R, buf)) {
        const e = this.walkEdges[id];
        const r = projectOn(e.pts, e.cum, x, y);
        if (r[1] < bd) { bd = r[1]; best = { edge: id, s: r[0], d: r[1] }; }
      }
      return best;
    }
  }

  G.Net = Net;
  G.LIGHT_CYCLE = CYCLE;
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
