(function (N) {
  'use strict';

  const GT = N.GT;
  const H = (x, z, s) => N.hash2(Math.round(x * 10), Math.round(z * 10), s);
  const FRUIT = ['#c8281e', '#e8861a', '#7aa82e', '#8a6a3a', '#e0b828', '#b8c860'];
  const SOFT = [GT.ROAD, GT.WATER, GT.RAIL, GT.MEDIAN];

  Object.assign(N.City.prototype, {
    propBox(p, hx, hz, h, kind) {
      return this.obb(p.x, p.z, p.rot, hz, hx, h, kind || 'prop', { bp: p });
    },

    clearAt(x, z, r) {
      let ok = true;
      this.hash.query(x - r, z - r, x + r, z + r, it => {
        if (it.kind === 'edge') return;
        if (it.circle) { if ((it.x - x) * (it.x - x) + (it.z - z) * (it.z - z) < (it.r + r) * (it.r + r)) { ok = false; return true; } return; }
        if (it.poly ? N.pointInPoly(it.poly, x, z) || N.circlePoly(x, z, r, it.poly) : N.circleBox(x, z, r, it)) { ok = false; return true; }
      });
      return ok;
    },

    looseSpot(x, z, r) {
      return this.inPlay(x, z) && this.surfaceAt(x, z) !== 0 && !SOFT.includes(this.ground(x, z)) && this.clearAt(x, z, r);
    },

    streetKit() {
      this.binSites = [];
      this.yardBins();
      this.junctionSigns();
      this.crossRails();
      this.marketCrates();
      this.garageBarrels();
      this.pickets();
    },

    binSite(x, z, rot, n) {
      const ux = Math.cos(rot), uz = Math.sin(rot), step = 1.36, span = n * step;
      this.prop('binpad', x, z, rot, { w: span + 0.5 });
      for (let k = 0; k < n; k++) {
        const o = (k - (n - 1) / 2) * step;
        const bx = x + ux * o, bz = z + uz * o;
        if (this.surfaceAt(bx, bz) === 0 || this.surfaceAt(bx + ux * 0.6, bz + uz * 0.6) === 0 || this.surfaceAt(bx - ux * 0.6, bz - uz * 0.6) === 0) continue;
        const p = this.prop('bin', bx, bz, rot + (H(bx, bz, 3) - 0.5) * 0.1, { tone: Math.floor(H(bx, bz, 4) * 3) });
        this.propBox(p, 0.62, 0.42, 1.1);
      }
      this.claimPoly(this.rectPoly(x, z, ux, uz, span / 2 + 0.5, 0.9), 0.3);
      this.binSites.push({ x, z, rot, n });
    },

    yardBins() {
      const doors = new Map();
      for (const p of this.props) if (p.type === 'podezd' && p.b !== undefined) { if (!doors.has(p.b)) doors.set(p.b, []); doors.get(p.b).push(p); }
      const sites = new N.SpatialHash(64);
      const near = (x, z, d) => sites.query(x - d, z - d, x + d, z + d, s => Math.hypot(s.x - x, s.z - z) < d || undefined);
      const firm = [GT.YARD, GT.CONC, GT.PATH, GT.PLAZA];
      for (const g of this.poiBy.G || []) {
        if (!this.inPlay(g.x, g.z) || !this.freeAt(g.x, g.z, 1.4) || this.surfaceAt(g.x, g.z) === 0 || !this.clearAt(g.x, g.z, 1.2)) continue;
        this.binSite(g.x, g.z, H(g.x, g.z, 5) * 6.28, 2);
        sites.insert({ x: g.x, z: g.z, x0: g.x, z0: g.z, x1: g.x, z1: g.z });
      }
      for (const b of this.buildings) {
        if (b.removed || !b.res || b.lm || !this.inPlay(b.cx, b.cz) || H(b.cx, b.cz, 301) > 0.34) continue;
        const ds = doors.get(b.id);
        if (!ds) continue;
        const d = ds[Math.floor(H(b.cx, b.cz, 302) * ds.length) % ds.length];
        const nx = Math.sin(d.rot), nz = -Math.cos(d.rot), tx = -nz, tz = nx;
        let done = false;
        for (const out of [12, 9, 15, 18]) {
          for (const side of [7, -7, 11, -11, 4, -4]) {
            const x = d.x + nx * out + tx * side, z = d.z + nz * out + tz * side;
            if (!this.inPlay(x, z) || this.surfaceAt(x, z) !== 3 || !firm.includes(this.ground(x, z))) continue;
            if (!this.freeAt(x, z, 2) || !this.clearAt(x, z, 2.2) || near(x, z, 42)) continue;
            const n = 2 + (H(x, z, 303) < 0.4 ? 1 : 0);
            this.binSite(x, z, Math.atan2(-nx, nz), n);
            sites.insert({ x, z, x0: x, z0: z, x1: x, z1: z });
            done = true;
            break;
          }
          if (done) break;
        }
      }
    },

    stopKit(x, z, rot) {
      const ux = Math.cos(rot), uz = Math.sin(rot), fx = Math.sin(rot), fz = -Math.cos(rot);
      const sx = x - ux * 3.1 + fx * 0.85, sz = z - uz * 3.1 + fz * 0.85;
      if (this.looseSpot(sx, sz, 0.3)) {
        const p = this.prop('sign', sx, sz, rot - Math.PI / 2, { sign: 'bus' });
        this.circle(sx, sz, 0.06, 2.6, 'pole', { bp: p });
      }
      const ax = x + ux * 2.85 - fx * 0.1, az = z + uz * 2.85 - fz * 0.1;
      if (this.looseSpot(ax, az, 0.4)) {
        const p = this.prop('urn', ax, az, rot, { stop: true });
        this.circle(ax, az, 0.26, 0.7, 'prop', { bp: p });
      }
    },

    kioskCrates(x, z, rot) {
      const ux = Math.cos(rot), uz = Math.sin(rot), lzx = -Math.sin(rot), lzz = Math.cos(rot);
      const side = H(x, z, 71) < 0.5 ? 1 : -1, n = 2 + (H(x, z, 72) < 0.5 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const lx = side * 1.95, lz = -0.85 + k * 0.5;
        const cx = x + ux * lx + lzx * lz, cz = z + uz * lx + lzz * lz;
        const crot = rot + Math.PI / 2 + (H(cx, cz, 73) - 0.5) * 0.2;
        if (!this.looseSpot(cx, cz, 0.25)) continue;
        const fruit = FRUIT[Math.floor(H(cx, cz, 74) * FRUIT.length) % FRUIT.length];
        const stack = k === 0 && H(cx, cz, 75) < 0.6;
        const p = this.prop('crate', cx, cz, crot, { fruit });
        this.obb(cx, cz, crot, 0.2, 0.3, stack ? 0.6 : 0.3, 'prop', { bp: p });
        if (stack) this.prop('crate', cx, cz, crot + (H(cx, cz, 76) - 0.5) * 0.25, { fruit: FRUIT[Math.floor(H(cx, cz, 77) * FRUIT.length) % FRUIT.length], lift: 0.3, base: p });
      }
    },

    marketCrates() {
      for (const t of this.props.filter(q => q.type === 'tent')) {
        const ux = Math.cos(t.rot), uz = Math.sin(t.rot), lzx = -Math.sin(t.rot), lzz = Math.cos(t.rot);
        for (const lx of [-1.7, -0.95, 0.95, 1.7]) {
          if (H(t.x + lx, t.z, 81) < 0.35) continue;
          const cx = t.x + ux * lx + lzx * -3.3, cz = t.z + uz * lx + lzz * -3.3;
          if (!this.looseSpot(cx, cz, 0.25)) continue;
          const crot = t.rot + (H(cx, cz, 82) - 0.5) * 0.3;
          const p = this.prop('crate', cx, cz, crot, { fruit: FRUIT[Math.floor(H(cx, cz, 83) * FRUIT.length) % FRUIT.length] });
          this.obb(cx, cz, crot, 0.2, 0.3, 0.3, 'prop', { bp: p });
        }
      }
    },

    garageBarrels() {
      for (const b of this.buildings) {
        if (b.removed || b.kind !== 'g' || !this.inPlay(b.cx, b.cz) || H(b.cx, b.cz, 601) > 0.24) continue;
        const w = this.wallToRoad(b, null, 2.5);
        if (!w) continue;
        const n = 1 + (H(b.cx, b.cz, 602) < 0.45 ? 1 : 0);
        for (let k = 0; k < n; k++) {
          const u = (H(b.cx + k, b.cz, 603) - 0.5) * w.L * 0.8 + k * 0.7;
          const [x, z] = this.at(w, u, 0.6);
          if (!this.looseSpot(x, z, 0.32)) continue;
          const p = this.prop('barrel', x, z, H(x, z, 604) * 6.28, { tone: Math.floor(H(x, z, 605) * 4) });
          this.circle(x, z, 0.29, 0.88, 'prop', { bp: p });
          this.claim(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
        }
      }
    },

    signAt(x, z, rot, kind) {
      if (!this.inPlay(x, z) || this.surfaceAt(x, z) === 0 || SOFT.includes(this.ground(x, z)) || !this.freeAt(x, z, 0.45) || !this.clearAt(x, z, 0.35)) return null;
      const p = this.prop('sign', x, z, rot, { sign: kind });
      this.circle(x, z, 0.06, 2.6, 'pole', { bp: p });
      this.claim(x - 0.5, z - 0.5, x + 0.5, z + 0.5);
      return p;
    },

    junctionSigns() {
      const sideWalk = (e, en, right) => (right === en.atA ? e.swL : e.swR) || 0;
      for (const n of this.nodes) {
        if (!n.poly || n.ends.length < 3 || !this.inPlay(n.x, n.z)) continue;
        const roads = n.ends.map(q => this.edges[q.e]).filter(e => !e.plant);
        const top = Math.max(...roads.map(e => e.rank || 0)), low = Math.min(...roads.map(e => e.rank || 0));
        for (const en of n.ends) {
          const e = this.edges[en.e];
          if (e.plant || e.outer || e.stub || e.hw < 2 || en.mx === undefined) continue;
          const ux = en.ux, uz = en.uz, back = (en.sb || 0) + 1.4;
          const swM = sideWalk(e, en, true), swP = sideWalk(e, en, false);
          const offM = (en.hwM || e.hw) + (swM > 0.8 ? Math.min(swM - 0.4, 0.9) : 0.7), offP = (en.hwP || e.hw) + (swP > 0.8 ? Math.min(swP - 0.4, 0.9) : 0.7);
          const face = Math.atan2(ux, -uz);
          const arriving = e.oneway ? !en.atA : true;
          if (n.light) {
            if (!en.zebra) continue;
            this.signAt(n.x + ux * (back - 0.6) + uz * offM, n.z + uz * (back - 0.6) - ux * offM, face, 'cross');
            this.signAt(n.x + ux * (back - 0.6) - uz * offP, n.z + uz * (back - 0.6) + ux * offP, face, 'cross');
            continue;
          }
          if (arriving && top > low) {
            const r = e.rank || 0;
            const kind = r < top ? (top >= 3 && H(n.x, n.z + en.e, 701) < 0.25 ? 'stop' : 'yield') : H(n.x + en.e, n.z, 702) < 0.65 ? 'main' : null;
            if (kind) this.signAt(n.x + ux * back + uz * offM, n.z + uz * back - ux * offM, face, kind);
          }
          if (e.oneway && !arriving) this.signAt(n.x + ux * back - uz * offP, n.z + uz * back + ux * offP, Math.atan2(-ux, uz), 'noentry');
        }
      }
    },

    crossRails() {
      const W = this.walk, wh = new N.SpatialHash(16);
      for (const e of W.edges) {
        if (!e.cross) continue;
        const a = W.nodes[e.a], b = W.nodes[e.b];
        wh.insert({ ax: a.x, az: a.z, bx: b.x, bz: b.z, x0: Math.min(a.x, b.x), z0: Math.min(a.z, b.z), x1: Math.max(a.x, b.x), z1: Math.max(a.z, b.z) });
      }
      const blocksWalk = (ax, az, bx, bz) => wh.query(Math.min(ax, bx) - 1, Math.min(az, bz) - 1, Math.max(ax, bx) + 1, Math.max(az, bz) + 1, s => N.segSegDist(ax, az, bx, bz, s.ax, s.az, s.bx, s.bz) < 1.2 || undefined);
      for (const n of this.nodes) {
        if (!n.light || !n.poly || !this.inPlay(n.x, n.z)) continue;
        for (const en of n.ends) {
          const e = this.edges[en.e];
          if (e.plant || e.outer || !en.zebra || en.mx === undefined) continue;
          const tone = Math.floor(H(n.x, n.z, 801) * 2);
          for (const side of [1, -1]) {
            const sw = (side > 0 === en.atA ? e.swL : e.swR) || 0;
            if (sw < 1.2) continue;
            const off = Math.max(e.hw, (side > 0 ? en.hwM : en.hwP) || 0) + 0.32;
            const px = en.uz * side, pz = -en.ux * side;
            for (let k = 0; k < 3; k++) {
              const s0 = (en.sb || 0) + 3.4 + k * 2.04, s1 = s0 + 2;
              const ax = n.x + en.ux * s0 + px * off, az = n.z + en.uz * s0 + pz * off, bx = n.x + en.ux * s1 + px * off, bz = n.z + en.uz * s1 + pz * off;
              const mx = (ax + bx) / 2, mz = (az + bz) / 2;
              if (this.surfaceAt(mx, mz) !== 1 || this.surfaceAt(ax, az) !== 1 || this.surfaceAt(bx, bz) !== 1) break;
              if (!this.freeAt(mx, mz, 0.3) || !this.clearAt(ax + en.ux * 0.2, az + en.uz * 0.2, 0.12) || !this.clearAt(bx - en.ux * 0.2, bz - en.uz * 0.2, 0.12) || !this.clearAt(mx, mz, 0.12) || blocksWalk(ax, az, bx, bz)) break;
              const p = this.prop('rail', mx, mz, Math.atan2(bz - az, bx - ax), { w: 2, tone });
              this.segWall(ax, az, bx, bz, 0.08, 1.0, 'prop', { bp: p });
              this.claimPoly(this.rectPoly(mx, mz, en.ux, en.uz, 1.05, 0.2), 0.05);
            }
          }
        }
      }
    },

    pickets() {
      const W = this.walk, wh = new N.SpatialHash(16);
      for (const e of W.edges) {
        const a = W.nodes[e.a], b = W.nodes[e.b];
        wh.insert({ ax: a.x, az: a.z, bx: b.x, bz: b.z, x0: Math.min(a.x, b.x), z0: Math.min(a.z, b.z), x1: Math.max(a.x, b.x), z1: Math.max(a.z, b.z) });
      }
      const blocksWalk = (ax, az, bx, bz) => wh.query(Math.min(ax, bx) - 1, Math.min(az, bz) - 1, Math.max(ax, bx) + 1, Math.max(az, bz) + 1, s => N.segSegDist(ax, az, bx, bz, s.ax, s.az, s.bx, s.bz) < 0.7 || undefined);
      const fenceNear = (x, z, r) => {
        let hit = false;
        this.hash.query(x - r, z - r, x + r, z + r, it => { if (it.kind === 'fence' && !it.bp && it.poly && N.circlePoly(x, z, r, it.poly)) { hit = true; return true; } });
        return hit;
      };
      const panel = (ax, az, bx, bz, tone) => {
        const L = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2, ux = (bx - ax) / L, uz = (bz - az) / L;
        if (!this.inPlay(mx, mz) || this.surfaceAt(mx, mz) === 0 || this.surfaceAt(ax, az) === 0 || this.surfaceAt(bx, bz) === 0) return false;
        if (SOFT.includes(this.ground(mx, mz)) || !this.freeAt(mx, mz, 0.2)) return false;
        if (!this.clearAt(ax + ux * 0.25, az + uz * 0.25, 0.15) || !this.clearAt(bx - ux * 0.25, bz - uz * 0.25, 0.15) || !this.clearAt(mx, mz, 0.15) || blocksWalk(ax, az, bx, bz)) return false;
        const p = this.prop('picket', mx, mz, Math.atan2(uz, ux), { w: L, h: 1.25, tone });
        this.segWall(ax, az, bx, bz, 0.08, 1.25, 'fence', { tex: 'picket', bp: p });
        this.claimPoly(this.rectPoly(mx, mz, ux, uz, L / 2, 0.15), 0.05);
        return true;
      };
      const run = (sx, sz, ux, uz, len, tone, gate) => {
        const n = Math.max(1, Math.round(len / 2.4)), w = len / n;
        let placed = 0;
        for (let k = 0; k < n; k++) {
          const t0 = k * w, t1 = t0 + w;
          if (gate && t1 > gate[0] && t0 < gate[1]) continue;
          if (panel(sx + ux * t0, sz + uz * t0, sx + ux * t1, sz + uz * t1, tone)) placed++;
        }
        return placed;
      };
      this.picketCount = 0;
      for (const b of this.buildings) {
        if (b.removed || b.kind !== 'h' || b.lm || !this.inPlay(b.cx, b.cz) || H(b.cx, b.cz, 501) > 0.88) continue;
        const w = this.wallToRoad(b, e => !e.plant && e.hw >= 2.5, 4);
        if (!w) continue;
        const ne = this.nearestEdge(w.mx + w.nx * 3, w.mz + w.nz * 3, e => !e.plant && e.hw >= 2.5, 60);
        if (!ne) continue;
        const toward = (ne.x - w.mx) * w.nx + (ne.z - w.mz) * w.nz;
        const sw = Math.max(ne.e.swL || 0, ne.e.swR || 0);
        const gap = toward - ne.e.hw - sw;
        if (toward < 6 || gap < 3.4) continue;
        const off = Math.min(9, Math.max(2.2, Math.min(gap - 1.2, gap * 0.6)));
        if (fenceNear(w.mx + w.nx * off, w.mz + w.nz * off, 4)) continue;
        const ext = 1.6 + H(b.cx, b.cz, 502) * 2, len = w.L + ext * 2;
        const sx = w.mx - w.ux * len / 2 + w.nx * off, sz = w.mz - w.uz * len / 2 + w.nz * off;
        const g0 = len / 2 + (H(b.cx, b.cz, 503) - 0.5) * w.L * 0.5 - 0.6;
        const tone = Math.floor(H(b.cx, b.cz, 504) * 4);
        const front = run(sx, sz, w.ux, w.uz, len, tone, [g0, g0 + 1.2]);
        if (!front) continue;
        this.picketCount += front;
        const back = off - 0.4;
        if (back > 1.5) {
          this.picketCount += run(sx, sz, -w.nx, -w.nz, back, tone, null);
          this.picketCount += run(sx + w.ux * len, sz + w.uz * len, -w.nx, -w.nz, back, tone, null);
        }
      }
    },

    panelFences() {
      const live = new Set(this.boxes), dead = new Set(), out = [];
      for (const f of this.fenceSegs) {
        if (f.tex !== 'metalfence') { out.push(f); continue; }
        const mx = (f.ax + f.bx) / 2, mz = (f.az + f.bz) / 2;
        let col = null;
        this.hash.query(mx - 0.05, mz - 0.05, mx + 0.05, mz + 0.05, it => {
          if (it.kind !== 'fence' || !it.poly || it.bp || !live.has(it) || dead.has(it)) return;
          if (Math.abs((it.x0 + it.x1) / 2 - mx) < 0.02 && Math.abs((it.z0 + it.z1) / 2 - mz) < 0.02) { col = it; return true; }
        });
        if (!col) { out.push(f); continue; }
        dead.add(col);
        const L = Math.hypot(f.bx - f.ax, f.bz - f.az), n = Math.max(1, Math.round(L / 2.5)), w = L / n;
        const ux = (f.bx - f.ax) / L, uz = (f.bz - f.az) / L, rot = Math.atan2(uz, ux);
        for (let k = 0; k < n; k++) {
          const ax = f.ax + ux * w * k, az = f.az + uz * w * k, bx = ax + ux * w, bz = az + uz * w;
          const p = this.prop('fence', (ax + bx) / 2, (az + bz) / 2, rot, { w, h: f.h });
          this.segWall(ax, az, bx, bz, f.t, f.h, 'fence', { tex: f.tex, bp: p });
          out.push({ ax, az, bx, bz, h: f.h, t: f.t, tex: f.tex, panel: true });
        }
      }
      if (dead.size) this.boxes = this.boxes.filter(b => !dead.has(b));
      this.fenceSegs = out;
    },

    breakables() {
      this.panelFences();
      const alive = new Set(this.props);
      const key = (x, z) => Math.round(x * 100) + '|' + Math.round(z * 100);
      const byPos = new Map();
      for (const p of this.props) {
        if (!N.BREAK[p.type]) continue;
        const k = key(p.x, p.z);
        if (!byPos.has(k)) byPos.set(k, []);
        byPos.get(k).push(p);
      }
      this.brks = [];
      const recOf = new Map(), dead = new Set();
      const make = (p, col) => {
        const rec = { id: this.brks.length, kind: p.type, p, col, x: p.x, z: p.z, rot: p.rot || 0, y: p.y, hp: N.BREAK[p.type].hp || 0, base: null, stack: null };
        this.brks.push(rec);
        recOf.set(p, rec);
        p.brk = rec;
        if (col) col.brk = rec;
        return rec;
      };
      const bind = it => {
        let p = it.bp;
        if (!p && it.breakable && it.circle) p = (byPos.get(key(it.x, it.z)) || []).find(q => !recOf.has(q) && alive.has(q));
        if (!p) return;
        if (!alive.has(p) || recOf.has(p)) { if (it.bp) dead.add(it); return; }
        make(p, it);
      };
      for (const c of this.circles) bind(c);
      for (const b of this.boxes) bind(b);
      if (dead.size) {
        this.circles = this.circles.filter(c => !dead.has(c));
        this.boxes = this.boxes.filter(b => !dead.has(b));
      }
      for (const p of this.props) if (p.type === 'bench' && !recOf.has(p)) make(p, this.propBox(p, 0.86, 0.24, 0.9));
      for (const p of this.props) {
        if (!p.base || recOf.has(p) || !alive.has(p) || !recOf.has(p.base)) continue;
        const r = make(p, null), base = recOf.get(p.base);
        r.base = base;
        (base.stack || (base.stack = [])).push(r);
      }
      this.brkHash = new N.SpatialHash(32);
      for (const r of this.brks) {
        r.x0 = r.x - 1; r.x1 = r.x + 1; r.z0 = r.z - 1; r.z1 = r.z + 1;
        this.brkHash.insert(r);
      }
    }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
