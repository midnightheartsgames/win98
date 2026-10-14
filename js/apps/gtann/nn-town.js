(function (N) {
  'use strict';

  const GT = N.GT;
  const recs = s => (s ? s.split('|') : []);
  const int36 = s => (s.charCodeAt(0) === 45 ? -parseInt(s.slice(1), 36) : parseInt(s, 36));
  const H = (x, z, s) => N.hash2(Math.round(x * 10), Math.round(z * 10), s);
  const TREE_GAP = 0.9;

  const KIND = {
    k: { styles: ['brick5', 'panel5', 'brick5'], fh: 2.8, mw: 3.2, base: 1.2, res: true },
    p: { styles: ['panel9', 'panel9b', 'panel9'], fh: 2.8, mw: 3.6, base: 1.6, res: true },
    t: { styles: ['panel16', 'panel16b'], fh: 2.8, mw: 3.4, base: 2.2, res: true },
    s: { styles: ['stalin', 'stalinb'], fh: 3.3, mw: 3.6, base: 1.4, res: true },
    c: { styles: ['soc'], fh: 3.2, mw: 5.2, base: 1.2, res: true },
    h: { styles: ['wood', 'wood', 'brickhouse'], fh: 2.9, base: 0.3 },
    g: { styles: ['garage'], fh: 2.6, base: 0 },
    u: { styles: ['booth', 'shed', 'booth'], fh: 2.8, base: 0.2 },
    r: { styles: ['shop'], fh: 3.8, base: 0.6 },
    o: { styles: ['brickoffice', 'office', 'brickoffice'], fh: 3.3, base: 1 },
    i: { styles: ['hall', 'factory'], fh: 6, base: 2 },
    w: { styles: ['warehouse', 'hall'], fh: 5, base: 2 },
    e: { styles: ['school'], fh: 3.4, base: 1.4 },
    d: { styles: ['kinder'], fh: 3.3, base: 1 },
    m: { styles: ['hospital'], fh: 3.1, base: 1.4 },
    q: { styles: ['tank'], fh: 3, base: 0 }
  };
  N.BUILD_KIND = KIND;

  Object.assign(N.City.prototype, {
    placeBuildings() {
      const D = this.district0;
      this.entrances = this.poiBy.E || [];
      for (const r of recs(D.bld)) {
        const f = r.split(':');
        const code = f[0];
        const k = code[0];
        let i = 1, lvs = '';
        while (i < code.length && /[0-9a-z]/.test(code[i])) lvs += code[i++];
        let h = 0, roof = '';
        const rest = code.slice(i);
        const m = rest.match(/~(\d+)/);
        if (m) h = +m[1];
        if (rest.includes('^')) roof = 'hip';
        else if (rest.includes('/')) roof = 'gable';
        const poly = N.decPts(f[3]);
        if (poly.length < 6) continue;
        this.addPolyBuilding(poly, { k, lv: parseInt(lvs, 36) || 1, h, roof, name: f[2] ? this.names[parseInt(f[2], 36)] : '', osm: f[1] });
      }
      this.buildEntrances();
    },

    addPolyBuilding(poly, o) {
      if (N.polyArea(poly) < 0) poly = N.reversePoly(poly);
      const K = KIND[o.k] || KIND.o;
      const b0 = N.polyBounds(poly);
      const cx = (b0.x0 + b0.x1) / 2, cz = (b0.z0 + b0.z1) / 2;
      const hv = H(cx, cz, 11);
      const style = o.style || K.styles[Math.floor(hv * K.styles.length) % K.styles.length];
      const area = Math.abs(N.polyArea(poly));
      const mb = this.mabr(poly);
      let lv = o.lv || 1;
      let h = o.h;
      if (!h) {
        if (o.k === 'i') h = area > 20000 ? 16 + hv * 4 : area > 6000 ? 13 + hv * 3 : 9 + hv * 3;
        else if (o.k === 'w') h = Math.max(7, lv * K.fh + K.base);
        else if (o.k === 'g') h = 2.6;
        else if (o.k === 'u') h = area < 20 ? 2.4 : 3 + (lv - 1) * 2.8;
        else h = lv * K.fh + K.base;
      }
      h = Math.max(h, 2.2);
      const b = {
        id: this.buildings.length, poly, x0: b0.x0, z0: b0.z0, x1: b0.x1, z1: b0.z1, cx, cz, y0: 0, h, style, floors: lv, kind: o.k, area, mb,
        roof: o.roof || (o.k === 'h' && mb.fill > 0.8 ? (hv < 0.55 ? 'gable' : 'hip') : o.k === 'i' && area > 1500 && mb.fill > 0.85 ? 'saw' : o.k === 'g' || o.k === 'u' && area < 20 ? 'flat' : 'flat'),
        ridge: o.k === 'h' ? 1.8 + hv * 1.4 : 2.4, name: o.name || '', osm: o.osm || '', res: !!K.res, walkRoof: h < 3.5 || !!o.walkRoof
      };
      if (o.k === 'h') b.roofTex = ['roofmetal', 'roofgreen', 'slate', 'roofmetal'][Math.floor(hv * 4)];
      if (o.k === 's' && hv > 0.45) b.roofShape = 'hip';
      if (o.k === 'k' && hv > 0.8) b.roofShape = 'gable';
      if (o.extra) Object.assign(b, o.extra);
      this.buildings.push(b);
      const parts = mb.fill > 0.93 ? [mb.poly] : N.convexParts(poly);
      b.parts = parts;
      for (const p of parts) if (p.length >= 6 && Math.abs(N.polyArea(p)) > 0.5) this.poly(p, b.y0 + b.h + (b.roof === 'gable' || b.roof === 'hip' ? b.ridge * 0.6 : 0), 'building', { ref: b.id, walkRoof: b.walkRoof });
      this.claimPoly(poly, 1.2, 'b');
      return b;
    },

    mabr(p) {
      let best = null;
      const n = p.length;
      for (let i = 0; i < n; i += 2) {
        const j = (i + 2) % n;
        const L = Math.hypot(p[j] - p[i], p[j + 1] - p[i + 1]);
        if (L < 1e-3) continue;
        const ux = (p[j] - p[i]) / L, uz = (p[j + 1] - p[i + 1]) / L;
        let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
        for (let k = 0; k < n; k += 2) { const u = p[k] * ux + p[k + 1] * uz, v = -p[k] * uz + p[k + 1] * ux; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; }
        const A = (u1 - u0) * (v1 - v0);
        if (!best || A < best.A) best = { A, ux, uz, u0, u1, v0, v1 };
      }
      const b = best;
      const cu = (b.u0 + b.u1) / 2, cv = (b.v0 + b.v1) / 2;
      const cx = cu * b.ux - cv * b.uz, cz = cu * b.uz + cv * b.ux;
      const hu = (b.u1 - b.u0) / 2, hv = (b.v1 - b.v0) / 2;
      const long = hu >= hv;
      const ax = long ? b.ux : -b.uz, az = long ? b.uz : b.ux;
      const hl = Math.max(hu, hv), hw = Math.min(hu, hv);
      const c = [[cx + ax * hl - az * hw, cz + az * hl + ax * hw], [cx - ax * hl - az * hw, cz - az * hl + ax * hw], [cx - ax * hl + az * hw, cz - az * hl - ax * hw], [cx + ax * hl + az * hw, cz + az * hl - ax * hw]];
      let poly = [c[0][0], c[0][1], c[1][0], c[1][1], c[2][0], c[2][1], c[3][0], c[3][1]];
      if (N.polyArea(poly) < 0) poly = N.reversePoly(poly);
      return { cx, cz, ax, az, hl, hw, poly, fill: Math.abs(N.polyArea(p)) / Math.max(1e-6, b.A) };
    },

    buildEntrances() {
      const bh = new N.SpatialHash(32);
      for (const b of this.buildings) bh.insert(b);
      const used = new Set();
      for (const e of this.entrances) {
        let best = null, bd = 1.6, bi = -1;
        bh.query(e.x - 2, e.z - 2, e.x + 2, e.z + 2, b => {
          if (!b.res) return;
          const p = b.poly;
          for (let i = 0; i < p.length; i += 2) {
            const j = (i + 2) % p.length;
            const [d2] = N.segDist2(e.x, e.z, p[i], p[i + 1], p[j], p[j + 1]);
            const d = Math.sqrt(d2);
            if (d < bd) { bd = d; best = b; bi = i; }
          }
        });
        if (!best) continue;
        this.addDoor(best, e.x, e.z);
        used.add(best.id);
      }
      for (const b of this.buildings) {
        if (!b.res || used.has(b.id) || b.area < 120) continue;
        const m = b.mb;
        const sides = [[1, m.hw], [-1, m.hw]];
        let pick = 1;
        const probe = s => { const x = m.cx - m.az * s * (m.hw + 12), z = m.cz + m.ax * s * (m.hw + 12); const ne = this.nearestEdge(x, z, e => !e.plant, 60); return ne ? ne.d : 99; };
        if (probe(1) < probe(-1)) pick = -1;
        const n = b.kind === 't' ? 1 : Math.max(1, Math.round(m.hl * 2 / 17));
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n * 2 - 1;
          const x = m.cx + m.ax * m.hl * u - m.az * pick * m.hw, z = m.cz + m.az * m.hl * u + m.ax * pick * m.hw;
          this.addDoor(b, x, z);
        }
        b.yardSide = pick;
      }
    },

    addDoor(b, x, z) {
      const K = KIND[b.kind] || {}, p = b.poly;
      let bi = 0, bt = 0, bd = Infinity;
      for (let i = 0; i < p.length; i += 2) {
        const j = (i + 2) % p.length;
        const [d2, t] = N.segDist2(x, z, p[i], p[i + 1], p[j], p[j + 1]);
        if (d2 < bd) { bd = d2; bi = i; bt = t; }
      }
      const j = (bi + 2) % p.length;
      const ex = p[j] - p[bi], ez = p[j + 1] - p[bi + 1], L = Math.hypot(ex, ez) || 1;
      let s = bt * L;
      if (K.mw && L >= K.mw * 0.7) {
        const mods = Math.max(1, Math.round(L / K.mw)), us = L / mods;
        s = (Math.min(mods - 1, Math.floor(s / us)) + 0.5) * us;
      }
      const dx = p[bi] + ex / L * s, dz = p[bi + 1] + ez / L * s;
      if (this.props.some(q => q.type === 'podezd' && q.b === b.id && Math.hypot(q.x - dx, q.z - dz) < 1)) return null;
      return this.prop('podezd', dx, dz, Math.atan2(ez / L, ex / L), { b: b.id });
    },

    doorFurniture() {
      this.doorPaths = [];
      const firm = [GT.YARD, GT.PATH, GT.PLAZA, GT.CONC];
      const inB = (x, z) => {
        let hit = false;
        this.hash.query(x, z, x, z, it => { if (!it.circle && it.kind === 'building' && it.poly && N.pointInPoly(it.poly, x, z)) { hit = true; return true; } });
        return hit;
      };
      for (const d of this.props) {
        if (d.type !== 'podezd' || d.b === undefined) continue;
        const b = this.buildings[d.b];
        if (!b || b.removed) continue;
        const nx = Math.sin(d.rot), nz = -Math.cos(d.rot), tx = -nz, tz = nx;
        let end = 0, blocked = inB(d.x + nx * 0.8, d.z + nz * 0.8);
        for (let t = 1.4; t <= 18 && !blocked; t += 0.5) {
          const x = d.x + nx * t, z = d.z + nz * t;
          if (inB(x, z) || this.ground(x, z) === GT.WATER) { blocked = t < 3.5; break; }
          if (this.surfaceAt(x, z) !== 3 || firm.includes(this.ground(x, z))) { end = t; break; }
        }
        if (blocked) continue;
        const len = end ? end + 0.6 : 3;
        const path = { ax: d.x + nx * 0.1, az: d.z + nz * 0.1, bx: d.x + nx * len, bz: d.z + nz * len, w: 1.6 };
        this.doorPaths.push(path);
        this.claimPoly(this.rectPoly(d.x + nx * len / 2, d.z + nz * len / 2, nx, nz, len / 2, 0.9), 0.2);
        if (H(d.x, d.z, 91) < 0.4) {
          const side = H(d.x, d.z, 92) < 0.5 ? 1 : -1;
          const bx = d.x + tx * side * 2.5 + nx * 0.85, bz = d.z + tz * side * 2.5 + nz * 0.85;
          if (!inB(bx, bz) && !inB(bx + tx * side * 0.9, bz + tz * side * 0.9) && this.surfaceAt(bx, bz) === 3) {
            this.propBox(this.prop('bench', bx, bz, d.rot), 0.86, 0.24, 0.9);
            this.claim(bx - 1, bz - 1, bx + 1, bz + 1);
          }
          const ux = d.x - tx * side * 1.5 + nx * 0.7, uz = d.z - tz * side * 1.5 + nz * 0.7;
          if (!inB(ux, uz) && this.surfaceAt(ux, uz) === 3) {
            this.circle(ux, uz, 0.26, 0.7, 'prop', { bp: this.prop('urn', ux, uz, d.rot) });
            this.claim(ux - 0.4, uz - 0.4, ux + 0.4, uz + 0.4);
          }
        }
      }
    },

    shopSign(b, text, style) {
      const p = b.poly;
      let best = -1, bd = Infinity, bi = 0;
      for (let i = 0; i < p.length; i += 2) {
        const j = (i + 2) % p.length;
        const mx = (p[i] + p[j]) / 2, mz = (p[i + 1] + p[j + 1]) / 2;
        const L = Math.hypot(p[j] - p[i], p[j + 1] - p[i + 1]);
        if (L < 6) continue;
        const ne = this.nearestEdge(mx, mz, e => !e.plant, 70);
        const d = ne ? ne.d : 99;
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) return null;
      bi = best;
      const j = (bi + 2) % p.length;
      const ex = p[j] - p[bi], ez = p[j + 1] - p[bi + 1], L = Math.hypot(ex, ez);
      const nx = ez / L, nz = -ex / L;
      const x = (p[bi] + p[j]) / 2 + nx * 0.08, z = (p[bi + 1] + p[j + 1]) / 2 + nz * 0.08;
      const s = { x, z, y: 3.6, w: Math.min(12, L - 2), h: 1.1, nx, nz, text, style: style || 'shop' };
      this.signs.push(s);
      return { s, wall: bi, x, z, nx, nz, L, ex: ex / L, ez: ez / L };
    },

    barriers() {
      this.fenceSegs = [];
      const TEX = { F: ['metalfence', 1.8, 0.12], C: ['concfence', 2.4, 0.2], W: ['concfence', 2.8, 0.35] };
      for (const f of this.fences) {
        const [tex, h, t] = TEX[f.k] || TEX.F;
        const p = f.pts;
        for (let i = 2; i < p.length; i += 2) {
          const ax = p[i - 2], az = p[i - 1], bx = p[i], bz = p[i + 1];
          const L = Math.hypot(bx - ax, bz - az);
          if (L < 0.3) continue;
          const n = Math.max(1, Math.ceil(L / 1.5));
          let run = -1;
          const emit = (k0, k1) => {
            const t0 = k0 / n, t1 = k1 / n;
            if (t1 - t0 < 0.02) return;
            const x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
            if (Math.hypot(x1 - x0, z1 - z0) < 0.4) return;
            this.segWall(x0, z0, x1, z1, t, h, 'fence', { tex });
            this.fenceSegs.push({ ax: x0, az: z0, bx: x1, bz: z1, h, t, tex });
          };
          for (let k = 0; k <= n; k++) {
            const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n;
            const blocked = k < n && (this.surfaceAt(x + (bx - ax) / n * 0.5, z + (bz - az) / n * 0.5) === 0 || this.ground(x + (bx - ax) / n * 0.5, z + (bz - az) / n * 0.5) === GT.PATH || this.nearGate(x, z));
            if (!blocked && k < n) { if (run < 0) run = k; }
            else if (run >= 0) { emit(run, k); run = -1; }
          }
          if (run >= 0) emit(run, n);
        }
      }
    },

    nearGate(x, z) {
      if (!this.gateHash) {
        this.gateHash = new N.SpatialHash(16);
        for (const g of this.poiBy.K || []) this.gateHash.insert({ x0: g.x - 2.6, z0: g.z - 2.6, x1: g.x + 2.6, z1: g.z + 2.6 });
      }
      let hit = false;
      this.gateHash.query(x, z, x, z, () => { hit = true; return true; });
      return hit;
    },

    shopFronts() {
      const names = N.SHOPS.filter(t => t !== 'УНИВЕРМАГ');
      for (const b of this.buildings) {
        if (b.removed || b.lm || b.name || b.shops || !'kpsc'.includes(b.kind) || b.h < 8) continue;
        const st = KIND[b.kind];
        const segs = [];
        for (let i = 0; i < b.poly.length; i += 2) {
          const w = this.wall(b, i);
          if (w.L < 14) continue;
          const ne = b.kind === 's' ? this.nearestEdge(w.mx + w.nx * 6, w.mz + w.nz * 6, e => e.rank >= 2, 30) : this.nearestEdge(w.mx + w.nx * 8, w.mz + w.nz * 8, e => !e.plant && e.rank >= 2, 26);
          if (!ne || b.kind !== 's' && (ne.x - w.mx) * w.nx + (ne.z - w.mz) * w.nz < 3) continue;
          const chance = b.kind === 's' ? 0.9 : b.kind === 'c' ? 0.6 : 0.42;
          if (H(b.cx + i, b.cz, 71) > chance) continue;
          const mods = Math.max(1, Math.round(w.L / st.mw)), us = w.L / mods;
          const cnt = b.kind === 's' ? Math.max(1, Math.min(3, Math.floor(mods / 5))) : 1;
          for (let k = 0; k < cnt; k++) {
            const len = Math.min(mods, 2 + Math.floor(H(b.cx + k, b.cz + i, 72) * 2));
            const slot = cnt === 1 ? H(b.cx, b.cz + k, 73) : (k + 0.5) / cnt;
            const m0 = Math.max(0, Math.min(mods - len, Math.round(slot * (mods - len))));
            const name = names[Math.floor(H(b.cx + k * 7, b.cz + i, 74) * names.length) % names.length];
            const s0 = m0 * us, s1 = (m0 + len) * us;
            segs.push({ i, s0, s1, name });
            const sm = (s0 + s1) / 2 - w.L / 2;
            const y = b.kind === 's' ? st.fh + 0.15 : 3.55;
            const [x, z] = this.at(w, sm, b.kind === 's' ? 0.12 : 0.16);
            this.signs.push({ x, z, y, w: Math.min(s1 - s0 - 0.4, 7), h: b.kind === 's' ? 0.75 : 0.55, nx: w.nx, nz: w.nz, text: name, style: 'shop' });
          }
        }
        if (segs.length) b.shopSegs = segs;
      }
    },

    furniture() {
      this.doorFurniture();
      this.shopFronts();
      this.spans = [];
      const rng = N.rng(this.seed + 404);
      this.tlights = [];
      for (const e of this.edges) {
        if (e.plant || e.outer) continue;
        const tp = this.trimmed(e);
        const cum = N.cumLen(tp), L = cum[cum.length - 1];
        if (L < 12) continue;
        const step = e.main ? 30 : e.rank >= 2 ? 33 : 38;
        const both = e.hw >= 5 || e.trolley;
        const stag = !e.trolley;
        let k = 0;
        for (let s = 8; s < L - 6; s += step, k++) {
          const p = N.plineAt(tp, cum, s);
          const rx = -p.dz, rz = p.dx;
          const pair = {};
          for (const side of both ? [1, -1] : [k % 2 ? 1 : -1]) {
            const sw = side > 0 ? e.swR : e.swL;
            const off = e.hw + (sw > 0 ? Math.min(sw - 0.5, 1.0) : 0.8);
            const x = p.x + rx * side * off + (side < 0 && stag ? p.dx * step / 2 : 0), z = p.z + rz * side * off + (side < 0 && stag ? p.dz * step / 2 : 0);
            if (this.surfaceAt(x, z) === 0) continue;
            if (this.lamp(x, z, Math.atan2(-rx * side, rz * side))) pair[side] = [x, z];
          }
          if (e.trolley && pair[1] && pair[-1]) this.spans.push({ ax: pair[1][0], az: pair[1][1], bx: pair[-1][0], bz: pair[-1][1], e: e.id });
        }
      }
      this.tramSupports();
      for (const n of this.nodes) {
        if (!n.light || !n.poly) continue;
        for (const en of n.ends) {
          const e = this.edges[en.e];
          const arriving = e.oneway ? !en.atA : true;
          if (!arriving || e.inner) continue;
          const x = en.mx + en.uz * 0.9 + en.ux * 1.2, z = en.mz - en.ux * 0.9 + en.uz * 1.2;
          const rot = Math.atan2(en.ux, -en.uz);
          const p = this.prop('trafficlight', x, z, rot, { node: n.id, grp: en.grp || 0 });
          this.tlights.push(p);
          this.circle(x, z, 0.15, 4, 'pole', { bp: p });
        }
      }
      const placedStops = [];
      for (const s of (this.poiBy.B || []).concat(this.poiBy.Q || [])) {
        if (!this.inPlay(s.x, s.z)) continue;
        if (placedStops.some(q => Math.hypot(q[0] - s.x, q[1] - s.z) < 30)) continue;
        const rs = this.roadSide(s.x, s.z, e => !e.plant && (e.swR > 0 || e.swL > 0));
        if (!rs || rs.d > 30 || rs.sw <= 0) continue;
        const off = rs.curb + rs.sw - 0.8;
        const x = rs.x + rs.nx * off, z = rs.z + rs.nz * off;
        if (!this.freeAt(x, z, 2.2)) continue;
        placedStops.push([s.x, s.z]);
        const rot = Math.atan2(-rs.nx, rs.nz);
        this.busStop(x, z, rot, rng, s.name, rs);
      }
      const stations = this.poiBy.V || [];
      const seenMetro = {};
      this.metroSpots = [];
      this.metroGates = [];
      for (const u of this.poiBy.U || []) {
        if (!this.inPlay(u.x, u.z)) continue;
        let st = null, bd = 500;
        for (const v of stations) { const d = Math.hypot(v.x - u.x, v.z - u.z); if (d < bd) { bd = d; st = v; } }
        const name = st ? st.name : 'Автозаводская';
        const rs = this.roadSide(u.x, u.z, e => !e.plant);
        const rot = rs ? Math.atan2(rs.dx, -rs.dz) : 0;
        const tx = rs ? -rs.nx : 1, tz = rs ? -rs.nz : 0;
        let mx = u.x, mz = u.z, ok = false;
        for (let k = 0; k < 12 && !ok; k++) {
          const along = [0, 3, -3, 6, -6, 9][k % 6], out = k < 6 ? 0 : 2.5;
          mx = u.x + (rs ? rs.dx : 1) * along - tx * out; mz = u.z + (rs ? rs.dz : 0) * along - tz * out;
          ok = this.surfaceAt(mx, mz) !== 0 && this.surfaceAt(mx + tx * 1.8, mz + tz * 1.8) !== 0 && this.freeAt(mx, mz, 0.5);
        }
        if (!ok && seenMetro[name]) continue;
        this.prop('metro', mx, mz, rot, { name, face: Math.sign(tx * Math.cos(rot) + tz * Math.sin(rot)) || 1 });
        this.obb(mx, mz, rot, 3.2, 1.6, 3.2, 'prop');
        this.claim(mx - 4, mz - 4, mx + 4, mz + 4);
        this.signs.push({ x: mx + tx * 1.45, y: 3.75, z: mz + tz * 1.45, w: 1.4, h: 1.4, nx: tx, nz: tz, text: 'М', style: 'metro' });
        this.metroGates.push({ name, ux: u.x, uz: u.z, px: mx, pz: mz, rot, tx, tz });
        if (!seenMetro[name]) {
          seenMetro[name] = true;
          const px = mx + tx * 3.4, pz = mz + tz * 3.4;
          this.put('metro_' + name, px, pz, rot, { metro: name });
          this.metroSpots.push({ name, x: px, z: pz, rot });
        }
        if (rng() < 0.7) this.kiosk(mx + Math.sin(rot) * 6, mz - Math.cos(rot) * 6, Math.atan2(tx, -tz), rng);
      }
      for (const m of (this.poiBy.Y || []).concat(this.poiBy.Z || [], this.poiBy.M || [])) {
        if (!this.inPlay(m.x, m.z)) continue;
        if (/Газель|Муравей|магазин|Son of|Пётр|Громозека|Капли|сказки|Шапочка|85 лет|100-летию/i.test(m.name)) continue;
        if (!this.freeAt(m.x, m.z, 1.2)) continue;
        const rs = this.roadSide(m.x, m.z, e => !e.plant);
        const rot = rs ? Math.atan2(-rs.nx, rs.nz) : 0;
        let kind = m.k === 'Y' ? 'lenin' : m.k === 'Z' ? 'bust' : /Победа/.test(m.name) ? 'pobeda' : /Зенит|пушк/i.test(m.name) ? 'cannon' : 'stele';
        this.prop('monument', m.x, m.z, rot, { kind });
        this.circle(m.x, m.z, kind === 'pobeda' ? 2.6 : kind === 'bust' ? 0.9 : 1.8, kind === 'stele' ? 9 : 5, 'monument');
        this.claim(m.x - 3, m.z - 3, m.x + 3, m.z + 3);
      }
      for (const c of this.poiBy.H || []) {
        if (!this.freeAtLoose(c.x, c.z)) continue;
        const inGaz = this.gaz.length && N.pointInPoly(this.gaz, c.x, c.z);
        const h = inGaz ? 70 + H(c.x, c.z, 3) * 30 : 36 + H(c.x, c.z, 3) * 18;
        this.prop('chimney', c.x, c.z, 0, { h, stripes: inGaz || h > 50 });
        this.circle(c.x, c.z, h > 60 ? 3.4 : 2.2, h, 'chimney');
      }
      for (const w of this.poiBy.W || []) { this.prop('watertower', w.x, w.z, 0); this.circle(w.x, w.z, 4, 26, 'prop'); }
      for (const t of this.poiBy.O || []) {
        if (!this.inPlay(t.x, t.z) || !this.freeAt(t.x, t.z, 0.8) || this.surfaceAt(t.x, t.z) === 0) continue;
        const rs = this.roadSide(t.x, t.z, e => !e.plant);
        this.circle(t.x, t.z, 0.5, 2.3, 'prop', { bp: this.prop('phone', t.x, t.z, rs ? Math.atan2(-rs.nx, rs.nz) : 0) });
      }
      for (const b of this.poiBy.N || []) {
        if (!this.inPlay(b.x, b.z) || !this.freeAt(b.x, b.z, 0.8) || this.surfaceAt(b.x, b.z) === 0) continue;
        this.propBox(this.prop('bench', b.x, b.z, H(b.x, b.z, 7) * 6.28), 0.86, 0.24, 0.9);
        this.claim(b.x - 1, b.z - 1, b.x + 1, b.z + 1);
      }
      for (const l of this.land) {
        if (l.k !== 'y' || l.area < 150 || !this.inPlay(l.box.x0, l.box.z0)) continue;
        const c = this.polyCenter(l.poly);
        if (!N.pointInPoly(l.poly, c[0], c[1])) continue;
        const rot = Math.atan2(this.mabr(l.poly).ax, -this.mabr(l.poly).az);
        if (!this.freeAt(c[0], c[1], 6)) continue;
        this.prop('playground', c[0], c[1], rot);
        this.circle(c[0], c[1], 1.2, 2.2, 'prop');
        this.claim(c[0] - 7, c[1] - 7, c[0] + 7, c[1] + 7);
      }
      this.billboards(rng);
    },

    freeAtLoose(x, z) { return this.surfaceAt(x, z) !== 0; },

    tramSupports() {
      this.tramPoles = [];
      const th = new N.SpatialHash(16);
      const tram = this.rails.filter(r => r.k === 'T');
      for (const r of tram) for (let i = 2; i < r.pts.length; i += 2) th.insert({ r, ax: r.pts[i - 2], az: r.pts[i - 1], bx: r.pts[i], bz: r.pts[i + 1], x0: Math.min(r.pts[i - 2], r.pts[i]), z0: Math.min(r.pts[i - 1], r.pts[i + 1]), x1: Math.max(r.pts[i - 2], r.pts[i]), z1: Math.max(r.pts[i - 1], r.pts[i + 1]) });
      const near = (r, x, z, d) => {
        let hit = false;
        th.query(x - d, z - d, x + d, z + d, it => { if (it.r !== r && N.segDist2(x, z, it.ax, it.az, it.bx, it.bz)[0] < d * d) { hit = true; return true; } });
        return hit;
      };
      for (const r of tram) {
        const cum = N.cumLen(r.pts), L = cum[cum.length - 1];
        for (let s = 10; s < L - 5; s += 34) {
          const p = N.plineAt(r.pts, cum, s);
          if (!this.inPlay(p.x, p.z)) continue;
          const nx = -p.dz, nz = p.dx;
          const side = near(r, p.x + nx * 3.3, p.z + nz * 3.3, 1.2) ? -1 : 1;
          const x = p.x + nx * side * 3.1, z = p.z + nz * side * 3.1;
          if (this.surfaceAt(x, z) === 0 || this.inWater(x, z) || near(r, x, z, 1.6) || !this.freeAt(x, z, 0.4)) continue;
          this.tramPoles.push({ x, z, tx: p.x, tz: p.z });
          this.circle(x, z, 0.14, 7.6, 'pole');
          this.claim(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
        }
      }
    },

    polyCenter(p) {
      let a = 0, cx = 0, cz = 0;
      for (let i = 0; i < p.length; i += 2) { const j = (i + 2) % p.length; const f = p[i] * p[j + 1] - p[j] * p[i + 1]; a += f; cx += (p[i] + p[j]) * f; cz += (p[i + 1] + p[j + 1]) * f; }
      if (Math.abs(a) < 1e-6) return [p[0], p[1]];
      return [cx / (3 * a), cz / (3 * a)];
    },

    lamp(x, z, rot, median) {
      if (!this.freeAt(x, z, 0.4)) return false;
      this.circle(x, z, 0.16, 8, 'lamp', { bp: this.prop('lamp', x, z, rot, { median: !!median }) });
      this.claim(x - 0.5, z - 0.5, x + 0.5, z + 0.5);
      return true;
    },

    busStop(x, z, rot, rng, name, rs) {
      this.prop('busstop', x, z, rot);
      this.obb(x, z, rot, 0.4, 2.2, 2.5, 'prop');
      this.claim(x - 2.3, z - 2.3, x + 2.3, z + 2.3);
      this.stopKit(x, z, rot);
      if (rng.chance(0.55)) {
        const dx = Math.cos(rot) * 5.4, dz = Math.sin(rot) * 5.4;
        this.kiosk(x + dx, z + dz, rot, rng);
      }
      this.pedAreas.push({ x0: x - 2, z0: z - 2, x1: x + 2, z1: z + 2, mix: this.district(x, z), n: 2, stop: true });
    },

    kiosk(x, z, rot, rng) {
      if (!this.freeAt(x, z, 1.6) || this.surfaceAt(x, z) === 0) return;
      const text = rng.pick(N.KIOSKS);
      this.prop('kiosk', x, z, rot, { text });
      this.obb(x, z, rot, 1.5, 1.5, 2.6, 'prop');
      this.claim(x - 2, z - 2, x + 2, z + 2);
      this.kioskCrates(x, z, rot);
    },

    billboards(rng) {
      const boards = ['ПЕЙДЖЕР «ВОЛГА-ПЕЙДЖ» — ВСЕГДА НА СВЯЗИ!', 'ПИВО «ОКСКОЕ» — ВКУС НИЖНЕГО', 'ВЫБОРЫ ГУБЕРНАТОРА — ВСЕ НА ВЫБОРЫ!', 'СОТОВАЯ СВЯЗЬ «НН-GSM» ОТ 0,49$/МИН', 'ГАЗель — КОРМИЛИЦА!', 'ДЖИНСЫ ИЗ ТУРЦИИ — РЫНОК «МОНЧЕГОРСКИЙ»', 'ИНТЕРНЕТ-КАФЕ «ПАУТИНА» 30 Р./ЧАС', 'ЗАЙМЫ ПОД ЗАЛОГ АВТО', '«ВОЛГА» ГАЗ-3110 — НОВАЯ ВОЛГА!', 'ГАЗ — ДВИЖЕНИЕ ВПЕРЁД'];
      let bi = 0;
      for (const e of this.edges) {
        if (e.plant || e.outer || !(e.main || e.rank >= 3) || e.len < 220) continue;
        const tp = this.trimmed(e), cum = N.cumLen(tp), L = cum[cum.length - 1];
        for (let s = 90; s < L - 60; s += 260) {
          const p = N.plineAt(tp, cum, s);
          const side = bi % 2 ? 1 : -1;
          const sw = side > 0 ? e.swR : e.swL;
          const off = e.hw + sw + 4;
          const x = p.x - p.dz * side * off, z = p.z + p.dx * side * off;
          if (!this.inPlay(x, z) || !this.freeAt(x, z, 4.5) || this.surfaceAt(x, z) !== 3 || this.ground(x, z) === GT.WATER) continue;
          const rot = Math.atan2(p.dz * side, p.dx * side) - Math.PI / 2;
          const text = boards[bi++ % boards.length];
          const fx = Math.sin(rot), fz = -Math.cos(rot);
          this.prop('billboard', x, z, rot, { text });
          const rx = -fz, rz = fx;
          this.circle(x - rx * 2.6, z - rz * 2.6, 0.25, 6, 'pole');
          this.circle(x + rx * 2.6, z + rz * 2.6, 0.25, 6, 'pole');
          this.signs.push({ x: x - fx * 0.09, y: 5.25, z: z - fz * 0.09, w: 8, h: 3, nx: fx, nz: fz, text, style: 'billboard', rot });
          this.claim(x - 5, z - 5, x + 5, z + 5);
        }
      }
    },

    greenery() {
      const rng = N.rng(this.seed + 23);
      this.treeCount = 0;
      const okGround = (x, z) => {
        const t = this.ground(x, z);
        return t === GT.GRASS || t === GT.FOREST || t === GT.FIELD;
      };
      const paths = new N.SpatialHash(16);
      const path = (ax, az, bx, bz, w) => paths.insert({ x0: Math.min(ax, bx) - w, z0: Math.min(az, bz) - w, x1: Math.max(ax, bx) + w, z1: Math.max(az, bz) + w, ax, az, bx, bz, w });
      for (const l of this.foot.concat(this.surf)) for (let i = 2; i < l.pts.length; i += 2) path(l.pts[i - 2], l.pts[i - 1], l.pts[i], l.pts[i + 1], l.w / 2 + TREE_GAP);
      for (const q of this.doorPaths || []) path(q.ax, q.az, q.bx, q.bz, q.w / 2 + TREE_GAP);
      const onPath = (x, z) => paths.query(x, z, x, z, it => N.segDist2(x, z, it.ax, it.az, it.bx, it.bz)[0] < it.w * it.w);
      const offStreet = (x, z) => [[0, 0], [TREE_GAP, 0], [-TREE_GAP, 0], [0, TREE_GAP], [0, -TREE_GAP]].every(([dx, dz]) => this.surfaceAt(x + dx, z + dz) === 3);
      const plant = (x, z, kind, s) => {
        if (!okGround(x, z) || !this.freeAt(x, z, 1.1) || onPath(x, z) || !offStreet(x, z)) return false;
        this.prop('tree', x, z, H(x, z, 9) * 6.28, { kind, s: s || 0.8 + H(x, z, 5) * 0.5 });
        this.circle(x, z, kind === 'pine' ? 0.3 : 0.26, 6, 'tree');
        this.claim(x - 0.7, z - 0.7, x + 0.7, z + 0.7);
        this.treeCount++;
        return true;
      };
      for (const t of this.poiBy.T || []) if (this.inPlay(t.x, t.z)) plant(t.x, t.z, rng.pick(['linden', 'birch', 'poplar', 'linden']));
      for (const e of this.edges) {
        if (e.plant || e.outer) continue;
        const tp = this.trimmed(e), cum = N.cumLen(tp), L = cum[cum.length - 1];
        const kinds = e.rank >= 3 ? ['poplar', 'poplar', 'linden'] : ['linden', 'birch', 'poplar', 'maple'];
        for (const side of [1, -1]) {
          const sw = side > 0 ? e.swR : e.swL;
          const off = e.hw + Math.max(sw, 0.5) + 1.8 + H(e.id, side, 3) * 1.2;
          let s = 5 + H(e.id, side, 4) * 6;
          while (s < L - 4) {
            const p = N.plineAt(tp, cum, s);
            const x = p.x - p.dz * side * off, z = p.z + p.dx * side * off;
            if (this.inPlay(x, z) || H(x, z, 2) < 0.25) plant(x, z, rng.pick(kinds));
            s += 12 + rng() * 6;
          }
        }
      }
      const fillArea = (l, step, kinds, prob, sc) => {
        const b = l.box;
        for (let x = b.x0 + step * rng(); x < b.x1; x += step) {
          for (let z = b.z0 + step * rng(); z < b.z1; z += step) {
            const px = x + (rng() - 0.5) * step * 0.9, pz = z + (rng() - 0.5) * step * 0.9;
            if (rng() > prob) continue;
            if (!N.pointInPoly(l.poly, px, pz)) continue;
            plant(px, pz, rng.pick(kinds), sc ? sc * (0.8 + rng() * 0.45) : 0);
          }
        }
      };
      const lands = this.land.slice().sort((p, q) => p.id - q.id);
      for (const l of lands) {
        if (l.custom) continue;
        const near = N.pointInPoly(this.play, (l.box.x0 + l.box.x1) / 2, (l.box.z0 + l.box.z1) / 2);
        const far = near ? 1 : 1.7;
        if (l.k === 'f') fillArea(l, 16 * far, l.area > 40000 ? ['pine', 'birch', 'pine', 'linden', 'birch'] : ['birch', 'linden', 'poplar', 'birch', 'maple'], 0.85, 1.25);
        else if (l.k === 'p') fillArea(l, 12.5 * far, ['linden', 'birch', 'maple', 'pine', 'linden'], 0.75, 1.1);
        else if (l.k === 'z') fillArea(l, 12, ['birch', 'pine', 'linden'], 0.8);
        else if (l.k === 'h' || l.k === 'd' || l.k === 'x') fillArea(l, 19 * far, ['linden', 'birch', 'poplar', 'apple'], 0.6);
        else if (l.k === 'R') fillArea(l, 30 * far, ['linden', 'birch', 'poplar', 'apple', 'maple'], 0.6);
        else if (l.k === 'g' || l.k === 'e') fillArea(l, 28 * far, ['birch', 'willow', 'linden'], 0.4);
        else if (l.k === 'a') fillArea(l, 24 * far, ['apple', 'apple', 'birch'], 0.4);
        else if (l.k === 'b') fillArea(l, 12, ['willow', 'birch'], 0.5);
      }
      if (this.water[0]) {
        for (let i = 1; i < this.water.length; i++) {
          const p = this.water[i];
          const b = N.polyBounds(p);
          fillArea({ poly: p, box: b }, 15, ['willow', 'birch', 'poplar'], 0.8, 1.2);
        }
      }
    },

    parkingSpots() {
      const rng = N.rng(this.seed + 61);
      for (const l of this.land) {
        if (l.k !== 'k' || l.area < 150 || !this.inPlay(l.box.x0 / 2 + l.box.x1 / 2, l.box.z0 / 2 + l.box.z1 / 2)) continue;
        const m = this.mabr(l.poly);
        const yaw = Math.atan2(-m.az, -m.ax);
        const cap = Math.min(40, Math.floor(l.area / 30));
        let n = 0;
        for (let v = -m.hw + 3; v <= m.hw - 2.5 && n < cap; v += 11) {
          for (let u = -m.hl + 1.8; u <= m.hl - 1.8 && n < cap; u += 2.7) {
            const x = m.cx + m.ax * u - m.az * v, z = m.cz + m.az * u + m.ax * v;
            if (!N.pointInPoly(l.poly, x, z) || !this.freeAt(x, z, 1.4) || this.surfaceAt(x, z) === 0) continue;
            if (rng() < 0.35) continue;
            this.park(x, z, yaw + (v > 0 ? Math.PI : 0), null, { yard: true });
            n++;
          }
        }
      }
      for (const s of this.surf) {
        if (s.cls !== 'Y') continue;
        const p = s.pts, cum = N.cumLen(p), L = cum[cum.length - 1];
        if (L < 14) continue;
        const mid = N.plineAt(p, cum, L / 2);
        if (!this.inPlay(mid.x, mid.z) || this.gaz.length && N.pointInPoly(this.gaz, mid.x, mid.z)) continue;
        const side = H(mid.x, mid.z, 13) < 0.5 ? 1 : -1;
        for (let t = 6; t < L - 6; t += 6.8) {
          if (rng() > 0.3) continue;
          const q = N.plineAt(p, cum, t);
          const off = s.w / 2 + 1.25;
          const x = q.x - q.dz * side * off, z = q.z + q.dx * side * off;
          if (!this.freeAt(x, z, 1.3) || this.surfaceAt(x, z) === 0 && this.isRoadNet(x, z)) continue;
          this.park(x, z, Math.atan2(q.dx, -q.dz), null, { yard: true });
          this.claim(x - 1.2, z - 1.2, x + 1.2, z + 1.2);
        }
      }
    },

    isRoadNet(x, z) {
      let r = false;
      this.roadHash.query(x, z, x, z, it => {
        if (it.t === 1 && N.pointInPoly(it.poly, x, z)) { r = true; return true; }
        if (it.t === 0) { const [d2] = N.segDist2(x, z, it.ax, it.az, it.bx, it.bz); if (d2 <= it.e.hw * it.e.hw) { r = true; return true; } }
      });
      return r;
    },

    peopleAreas() {
      for (const l of this.land) {
        const cx = (l.box.x0 + l.box.x1) / 2, cz = (l.box.z0 + l.box.z1) / 2;
        if (!this.inPlay(cx, cz)) continue;
        if (l.k === 'p' && l.area > 2000) this.pedArea(l.box.x0, l.box.z0, l.box.x1, l.box.z1, 'park', Math.min(8, Math.ceil(l.area / 20000)), l.poly);
        else if (l.k === 'P' || l.k === 'm') this.pedArea(l.box.x0, l.box.z0, l.box.x1, l.box.z1, l.k === 'm' ? 'market' : this.district(cx, cz), 4, l.poly);
      }
    },

    boundary() {
      const P = this.play;
      const n = P.length;
      this.edgeWalls = [];
      for (let i = 0; i < n; i += 2) {
        const j = (i + 2) % n;
        const ax = P[i], az = P[i + 1], bx = P[j], bz = P[j + 1];
        const L = Math.hypot(bx - ax, bz - az);
        const steps = Math.max(1, Math.ceil(L / 20));
        for (let k = 0; k < steps; k++) {
          const x0 = ax + (bx - ax) * k / steps, z0 = az + (bz - az) * k / steps, x1 = ax + (bx - ax) * (k + 1) / steps, z1 = az + (bz - az) * (k + 1) / steps;
          if (this.inWater((x0 + x1) / 2, (z0 + z1) / 2)) continue;
          this.segWall(x0, z0, x1, z1, 0.6, 30, 'edge', { hidden: true });
          this.edgeWalls.push([x0, z0, x1, z1]);
        }
      }
      for (const e of this.edges) {
        const p = e.pts;
        for (let i = 2; i < p.length; i += 2) {
          const ax = p[i - 2], az = p[i - 1], bx = p[i], bz = p[i + 1];
          const ia = this.inPlay(ax, az), ib = this.inPlay(bx, bz);
          if (ia === ib) continue;
          let lo = 0, hi = 1;
          for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; const inside = this.inPlay(ax + (bx - ax) * m, az + (bz - az) * m); if (inside === ia) lo = m; else hi = m; }
          const t = lo;
          const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1;
          const ux = (ia ? dx : -dx) / L, uz = (ia ? dz : -dz) / L;
          const x = ax + dx * t - ux * 4, z = az + dz * t - uz * 4;
          this.roadBlock(e, x, z, ux, uz);
          this.exits.push({ e: e.id, x, z, ux, uz });
        }
      }
    },

    roadBlock(e, x, z, ux, uz) {
      const rx = -uz, rz = ux;
      const half = e.hw + Math.max(e.swL, e.swR) * 0.5;
      const yaw = Math.atan2(rz, rx);
      const n = Math.max(1, Math.round(half * 2 / 3));
      for (let i = 0; i < n; i++) {
        const o = -half + (i + 0.5) * half * 2 / n;
        this.prop('barrier', x + rx * o, z + rz * o, yaw, { w: half * 2 / n - 0.2 });
      }
      this.segWall(x - rx * (half + 1), z - rz * (half + 1), x + rx * (half + 1), z + rz * (half + 1), 0.6, 1.1, 'barrier', { tex: 'barrier' });
      this.signs.push({ x: x + ux * 0.4, y: 1.7, z: z + uz * 0.4, w: Math.min(7, half * 1.4), h: 1.3, nx: -ux, nz: -uz, text: 'ДОРОЖНЫЕ РАБОТЫ', style: 'road', post: true });
      if (e.rank >= 3) {
        const gx = x - ux * 8 + rx * (half + 5), gz = z - uz * 8 + rz * (half + 5);
        if (this.freeAt(gx, gz, 2.5) && this.surfaceAt(gx, gz) !== 0) { this.prop('gaipost', gx, gz, Math.atan2(-ux, uz)); this.obb(gx, gz, 0, 2, 2, 3, 'post'); }
      }
    },

    club() {
      const x0 = N.INTERIOR_X + 100, z0 = 600, x1 = x0 + 40, z1 = z0 + 30;
      this.interiors.push({ x0, z0, x1, z1, id: 'club', dark: true });
      const t = 0.3, Hh = 7;
      this.box(x0 - t, z0, x0 + t, z1, Hh, 'wall');
      this.box(x1 - t, z0, x1 + t, z1, Hh, 'wall');
      this.box(x0, z0 - t, x1, z0 + t, Hh, 'wall');
      this.box(x0, z1 - t, x1, z1 + t, Hh, 'wall');
      this.box(x0 + 2, z0 + 2, x0 + 4, z0 + 20, 1.1, 'bar');
      this.box(x1 - 10, z0 + 1, x1 - 1, z0 + 8, 0.9, 'stage', { walkRoof: true });
      this.box(x0 + 26, z1 - 7, x0 + 38, z1 - 1, 0.5, 'vip', { walkRoof: true });
      this.put('club_in', x0 + 6, z1 - 3, Math.PI);
      this.put('club_lyova', x0 + 32, z1 - 4, Math.PI);
      this.put('club_dance', x0 + 20, z0 + 15, 0);
      this.put('club_backdoor', x1 - 2, z1 - 4, Math.PI / 2);
      this.teleports.push({ id: 'club', a: 'club_door', b: 'club_in', text: 'Войти в «Мираж»', back: 'Выйти на улицу' });
      this.clubRoom = { x0, z0, x1, z1, H: Hh };
    },

    collectibles() {
      const spots = this.stashSpots || [];
      let i = 0;
      for (const [x, z] of spots) {
        const p = this.freeSpot(x, z, 30);
        this.stashes.push({ id: 's' + (i++), x: p[0], z: p[1] });
      }
      const pk = (type, x, z, o) => { const p = this.freeSpot(x, z, 20); this.pickups.push(Object.assign({ type, x: p[0], z: p[1] }, o || {})); };
      for (const q of this.pickupSpots || []) pk(q[0], q[1], q[2], q[3]);
    }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
