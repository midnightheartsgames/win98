(function (G) {
  'use strict';
  const { clamp, dist2, cumLen, pointAt, projectOn, SpatialHash } = G;

  const CAR_L = 140, CAR_W = 24, GAP = 10, VMAX = 105, ACC = 26, BRAKE = 70;
  const COLORS = ['#c8282a', '#c8282a', '#b83a2a', '#d0403a'];

  function buildTramNet(city) {
    const M = city.M;
    const edges = [];
    for (const r of city.rails) {
      if (r.kind !== 't' || r.pts.length < 4) continue;
      const cum = cumLen(r.pts);
      const len = cum[cum.length - 1];
      if (len < 6 * M) continue;
      edges.push({ id: edges.length, pts: r.pts, cum, len, dir: 0, a: -1, b: -1 });
    }
    const nodes = [];
    const snap = 3 * M;
    const hash = new SpatialHash(snap * 4);
    const nodeAt = (x, y) => {
      const buf = [];
      for (const id of hash.query(x - snap, y - snap, x + snap, y + snap, buf)) { const n = nodes[id]; if (Math.hypot(n.x - x, n.y - y) <= snap) return id; }
      const id = nodes.length;
      nodes.push({ id, x, y, out: [] });
      hash.insert(id, x, y, x, y);
      return id;
    };
    for (const e of edges) {
      const p = e.pts;
      e.a = nodeAt(p[0], p[1]); e.b = nodeAt(p[p.length - 2], p[p.length - 1]);
      nodes[e.a].out.push(e.id); nodes[e.b].out.push(e.id);
    }
    const eh = new SpatialHash(40 * M);
    edges.forEach(e => { const p = e.pts; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); } eh.insert(e.id, x0, y0, x1, y1); });
    for (const e of edges) {
      let votes = 0;
      for (const f of [0.25, 0.5, 0.75]) {
        const q = pointAt(e.pts, e.cum, e.len * f);
        const dx = Math.cos(q[2]), dy = Math.sin(q[2]);
        const buf = [];
        for (const id of eh.query(q[0] - 7 * M, q[1] - 7 * M, q[0] + 7 * M, q[1] + 7 * M, buf)) {
          if (id === e.id) continue;
          const o = edges[id];
          const pr = projectOn(o.pts, o.cum, q[0], q[1]);
          if (pr[1] < 1.5 * M || pr[1] > 6 * M) continue;
          const oq = pointAt(o.pts, o.cum, pr[0]);
          if (Math.abs(Math.cos(oq[2] - q[2])) < 0.9) continue;
          const cr = dx * (oq[1] - q[1]) - dy * (oq[0] - q[0]);
          votes += cr > 0 ? -1 : 1;
          break;
        }
      }
      e.dir = votes > 0 ? 1 : votes < 0 ? -1 : 0;
    }
    return { edges, nodes, hash: eh };
  }

  const Tram = {
    setupTrams() {
      this.trams = [];
      this.tramT = 0;
      this.tramNet = this.city.tramNet || (this.city.tramNet = buildTramNet(this.city));
      this.tramStops = this.city.pois.filter(p => p.kind === 'tram' && this.city.inMargin(p.x, p.y));
    },

    tramPath(edgeId, forward) {
      const net = this.tramNet, M = this.city.M;
      const out = [];
      let e = net.edges[edgeId], fw = forward;
      let total = 0;
      const used = new Set();
      for (let hop = 0; hop < 40 && e; hop++) {
        used.add(e.id);
        const p = e.pts;
        const n = p.length / 2;
        for (let i = 0; i < n; i++) {
          const k = fw ? i : n - 1 - i;
          if (out.length && i === 0) continue;
          out.push(p[k * 2], p[k * 2 + 1]);
        }
        total += e.len;
        if (total > 420 * M) break;
        const endNode = net.nodes[fw ? e.b : e.a];
        const ex = out[out.length - 2] - out[out.length - 4], ey = out[out.length - 1] - out[out.length - 3];
        const el = Math.hypot(ex, ey) || 1;
        let best = null, bd = -2;
        for (const id of endNode.out) {
          if (used.has(id)) continue;
          const o = net.edges[id];
          const startsHere = o.a === endNode.id;
          if (o.dir === 1 && !startsHere) continue;
          if (o.dir === -1 && startsHere) continue;
          const q = o.pts;
          const fx = startsHere ? q[2] - q[0] : q[q.length - 4] - q[q.length - 2], fy = startsHere ? q[3] - q[1] : q[q.length - 3] - q[q.length - 1];
          const cos = (ex * fx + ey * fy) / (el * (Math.hypot(fx, fy) || 1));
          if (cos < 0.3) continue;
          const score = cos + this.rng.next() * 0.35;
          if (score > bd) { bd = score; best = { e: o, fw: startsHere }; }
        }
        if (!best) break;
        e = best.e; fw = best.fw;
      }
      const pts = new Float32Array(out);
      return { pts, cum: cumLen(pts) };
    },

    spawnTram() {
      const net = this.tramNet, M = this.city.M;
      if (!net.edges.length) return false;
      const px = this.px, py = this.py;
      for (let tries = 0; tries < 12; tries++) {
        const a = this.rng.range(-Math.PI, Math.PI), r = this.rng.range(this.viewR + 260, this.viewR + 2400);
        const x = px + Math.cos(a) * r, y = py + Math.sin(a) * r;
        const buf = [];
        let best = null, bd = 140 * M;
        for (const id of net.hash.query(x - bd, y - bd, x + bd, y + bd, buf)) {
          const e = net.edges[id];
          const pr = projectOn(e.pts, e.cum, x, y);
          if (pr[1] < bd) { bd = pr[1]; best = { e, s: pr[0] }; }
        }
        if (!best) continue;
        const fw = best.e.dir === 0 ? this.rng.chance(0.5) : best.e.dir > 0;
        const path = this.tramPath(best.e.id, fw);
        const L = path.cum[path.cum.length - 1];
        const s0 = fw ? best.s : best.e.len - best.s;
        if (L - s0 < 120 * M) continue;
        const n = this.rng.chance(0.6) ? 2 : 1;
        const start = Math.max(s0, n * (CAR_L + GAP));
        const q = pointAt(path.pts, path.cum, start);
        if (Math.hypot(q[0] - px, q[1] - py) < this.viewR + 120) continue;
        if (this.trams.some(t => Math.abs(t.s - start) < 600 && t.path === path)) continue;
        const tr = { id: this.nextId++, path, s: start, v: VMAX * 0.8, n, color: COLORS[this.rng.int(0, COLORS.length - 1)], cars: [], wait: 0, stopped: -1, bell: 0 };
        for (let k = 0; k < n; k++) tr.cars.push({ kind: 'tram', tram: tr, x: q[0], y: q[1], a: q[2], vx: 0, vy: 0, L: CAR_L, W: CAR_W, m: { L: CAR_L, W: CAR_W }, head: k === 0, tail: k === n - 1, removed: false, dead: false });
        tr.stops = this.tramStops.map(st => projectOn(path.pts, path.cum, st.x, st.y)).filter(r => r[1] < 2.5 * M).map(r => r[0]).sort((a, b) => a - b).filter((v, k, list) => !k || v - list[k - 1] > 40 * M);
        this.placeTram(tr);
        this.trams.push(tr);
        return true;
      }
      return false;
    },

    placeTram(tr) {
      const P = tr.path;
      for (let k = 0; k < tr.cars.length; k++) {
        const c = tr.cars[k];
        const s = tr.s - k * (CAR_L + GAP) - CAR_L / 2;
        const f = pointAt(P.pts, P.cum, s + CAR_L * 0.42), b = pointAt(P.pts, P.cum, s - CAR_L * 0.42);
        c.x = (f[0] + b[0]) / 2; c.y = (f[1] + b[1]) / 2;
        c.a = Math.atan2(f[1] - b[1], f[0] - b[0]);
        c.vx = Math.cos(c.a) * tr.v; c.vy = Math.sin(c.a) * tr.v;
      }
    },

    tramBlocked(tr, look) {
      const P = tr.path;
      const buf = this._tb || (this._tb = []);
      let best = Infinity;
      for (let d = 10; d < look; d += 28) {
        const q = pointAt(P.pts, P.cum, tr.s + d);
        for (const e of this.near(q[0], q[1], 40, buf)) {
          if (e.removed || e.kind === 'tram' || (e.kind === 'ped' && (e.dead || e.car))) continue;
          if (e.kind === 'car' && e.dead && e.hp <= -50) continue;
          const lat = Math.abs(-(e.x - q[0]) * Math.sin(q[2]) + (e.y - q[1]) * Math.cos(q[2]));
          const lon = (e.x - q[0]) * Math.cos(q[2]) + (e.y - q[1]) * Math.sin(q[2]);
          const halfW = e.kind === 'car' ? Math.min(e.m.W, e.m.L) / 2 : 5;
          if (lat > CAR_W / 2 + halfW + 2 || Math.abs(lon) > 18) continue;
          best = Math.min(best, d - (e.kind === 'car' ? e.m.L / 2 : 6));
        }
        for (const o of this.trams) {
          if (o === tr) continue;
          for (const c of o.cars) {
            const dx = q[0] - c.x, dy = q[1] - c.y, ca = Math.cos(c.a), sa = Math.sin(c.a);
            const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
            if (Math.abs(lx) > CAR_L / 2 + 10 || Math.abs(ly) > CAR_W + 2) continue;
            if (Math.cos(c.a - q[2]) < -0.7 && Math.abs(ly) > 10) continue;
            best = Math.min(best, d - 12);
          }
        }
        if (best < Infinity) break;
      }
      return best;
    },

    updateTrams(dt) {
      const M = this.city.M;
      this.tramT -= dt;
      if (this.tramT <= 0) {
        this.tramT = 2.5;
        const want = Math.round(5 * this.density);
        for (let i = this.trams.length - 1; i >= 0; i--) {
          const tr = this.trams[i];
          const head = tr.cars[0];
          const far = Math.hypot(head.x - this.px, head.y - this.py) > this.viewR + 3000;
          const end = tr.s >= tr.path.cum[tr.path.cum.length - 1] - 2;
          if ((far || end) && !tr.cars.some(c => Math.hypot(c.x - this.px, c.y - this.py) < this.viewR + 100)) { for (const c of tr.cars) c.removed = true; this.trams.splice(i, 1); }
        }
        if (this.trams.length < want) this.spawnTram();
      }
      for (const tr of this.trams) {
        const L = tr.path.cum[tr.path.cum.length - 1];
        let target = VMAX;
        const stopD = tr.v * tr.v / (2 * BRAKE) + 12;
        const block = this.tramBlocked(tr, stopD + 60);
        if (block < Infinity) {
          target = Math.min(target, Math.max(0, block - 14) * 1.4);
          if (block < 70) { tr.bell -= dt; if (tr.bell <= 0) { tr.bell = 2.2; this.event('tramBell', tr.cars[0].x, tr.cars[0].y); } }
        }
        if (tr.wait > 0) { tr.wait -= dt; target = 0; }
        else {
          const next = tr.stops.find(s => s > tr.s - 2 && s !== tr.stopped);
          if (next != null) {
            const d = next - tr.s;
            if (d < 4 && tr.v < 12) { tr.wait = 5 + this.rng.next() * 3; tr.stopped = next; target = 0; }
            else target = Math.min(target, Math.max(8, Math.sqrt(2 * BRAKE * Math.max(0, d - 2))));
          }
        }
        if (L - tr.s < 60) target = Math.min(target, Math.max(0, L - tr.s) * 1.2);
        if (tr.v < target) tr.v = Math.min(target, tr.v + ACC * dt);
        else tr.v = Math.max(target, tr.v - BRAKE * 1.4 * dt);
        tr.s = Math.min(L, tr.s + tr.v * dt);
        this.placeTram(tr);
        this.tramHits(tr);
      }
    },

    tramHits(tr) {
      const buf = this._th || (this._th = []);
      for (const tc of tr.cars) {
        const ca = Math.cos(tc.a), sa = Math.sin(tc.a);
        for (const e of this.near(tc.x, tc.y, CAR_L / 2 + 40, buf)) {
          if (e.removed || e.kind === 'tram') continue;
          const dx = e.x - tc.x, dy = e.y - tc.y;
          const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
          if (e.kind === 'ped') {
            if (e.dead || e.car || e.invisible) continue;
            if (Math.abs(lx) < CAR_L / 2 + 3 && Math.abs(ly) < CAR_W / 2 + 3) {
              const side = ly < 0 ? -1 : 1;
              e.x = tc.x + ca * lx - sa * side * (CAR_W / 2 + 5); e.y = tc.y + sa * lx + ca * side * (CAR_W / 2 + 5);
              if (tr.v > 25 && (e.hitCd || 0) <= 0) { e.hitCd = 0.6; e.vx = ca * tr.v - sa * side * 90; e.vy = sa * tr.v + ca * side * 90; e.down = 1.2; this.pedDamage(e, 30 + tr.v * 0.6, null, 'train'); this.event('thud', e.x, e.y, { v: tr.v }); }
            }
            continue;
          }
          for (const c of G.carCircles(e)) {
            const cx = c.x - tc.x, cy = c.y - tc.y;
            const ux = cx * ca + cy * sa, uy = -cx * sa + cy * ca;
            if (Math.abs(ux) > CAR_L / 2 + c.r || Math.abs(uy) > CAR_W / 2 + c.r) continue;
            const side = uy < 0 ? -1 : 1;
            const pen = CAR_W / 2 + c.r - Math.abs(uy);
            if (pen <= 0) continue;
            e.x += -sa * side * pen; e.y += ca * side * pen;
            const vn = (e.vx * -sa + e.vy * ca) * side;
            if (vn < 0) { e.vx -= -sa * side * vn * 1.4; e.vy -= ca * side * vn * 1.4; }
            if (tr.v > 20 && (e.tramHitT || 0) < this.t) { e.tramHitT = this.t + 1; e.vx += ca * tr.v * 0.5; e.vy += sa * tr.v * 0.5; e.av += (this.rng.next() - 0.5) * 4; this.carDamage(e, 20 + tr.v * 0.35, null, 'train'); this.event('crash', e.x, e.y, { v: 120 + tr.v }); }
            break;
          }
        }
      }
    }
  };

  Object.assign(G.World.prototype, Tram);
  Object.assign(G, { Tram, buildTramNet });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
