(function (F) {
  'use strict';

  const S = F.S;
  const CS = 10;
  const OC = 2;
  const STACKED = 2.5;

  const KINDS = {
    hwy: { w: 17, lanes: 4, surf: S.ASPHALT, tex: 'road4', side: 0, speed: 24, traffic: 1, lamps: 50, r: 120 },
    ave: { w: 14, lanes: 4, surf: S.ASPHALT, tex: 'road4', side: 3, speed: 16, traffic: 1, lamps: 34, r: 45 },
    str: { w: 10, lanes: 2, surf: S.ASPHALT, tex: 'road2', side: 2.5, speed: 13, traffic: 0.8, lamps: 34, r: 30 },
    old: { w: 8, lanes: 2, surf: S.COBBLE, tex: 'cobble', side: 1.6, speed: 8, traffic: 0.25, lamps: 24, r: 10 },
    lane: { w: 7.5, lanes: 2, surf: S.ASPHALT, tex: 'lane', side: 0, speed: 11, traffic: 0.4, lamps: 0, r: 25 },
    yard: { w: 7, lanes: 2, surf: S.COBBLE, tex: 'cobble', side: 0, speed: 7, traffic: 0, lamps: 0, r: 10 },
    gravel: { w: 8, lanes: 0, surf: S.GRAVEL, tex: 'gravel', side: 0, speed: 0, traffic: 0, lamps: 0, r: 40 },
    dirt: { w: 7.5, lanes: 0, surf: S.DIRT, tex: 'dirt', side: 0, speed: 0, traffic: 0, lamps: 0, r: 35 },
    sand: { w: 12, lanes: 0, surf: S.SAND, tex: 'sandtrack', side: 0, speed: 0, traffic: 0, lamps: 0, r: 50 },
    grass: { w: 10, lanes: 0, surf: S.GRASS, tex: 'grasstrack', side: 0, speed: 0, traffic: 0, lamps: 0, r: 40 },
    track: { w: 13, lanes: 0, surf: S.ASPHALT, tex: 'track', side: 0, speed: 0, traffic: 0, lamps: 0, r: 50 },
    runway: { w: 44, lanes: 0, surf: S.ASPHALT, tex: 'runway', side: 0, speed: 0, traffic: 0, lamps: 0, r: 0 }
  };

  const STYLES = {
    hansa: { mode: 'block', depth: [10, 16], width: [7, 13], corner: [10, 15], floors: [3, 5], floorH: 3.3, ground: 4, attic: 0.8, roof: 'gable', shops: 0.7, fac: ['hansa1', 'hansa2', 'hansa3', 'hansa4'], cols: ['#e8d8a8', '#f0c8a0', '#d8e0c0', '#f2e2c8', '#e6b88a', '#c8d8e0', '#f0d0c8', '#dcc090', '#e8e4dc', '#c89878'] },
    jugend: { mode: 'block', depth: [13, 19], width: [15, 24], corner: [16, 22], floors: [5, 6], floorH: 3.5, ground: 4.4, attic: 1.2, roof: 'mansard', shops: 0.6, fac: ['jugend1', 'jugend2', 'jugend3', 'jugend4'], cols: ['#e8dcc4', '#d8c8b0', '#c8d4dc', '#e8d0b8', '#d0c8a8', '#b8c8c0', '#e0e0d4', '#d8b8a8'] },
    wood: { mode: 'front', setback: [4, 8], depth: [9, 12], width: [9, 13], gap: [5, 10], floors: [1, 2], floorH: 3.2, roof: 'gable', fac: ['wood1', 'wood2'], cols: ['#8a6a48', '#6a7a58', '#a88a5a', '#7a8a9a', '#b89a6a', '#9a6a5a'], fill: 0.85, fence: 0.5 },
    villa: { mode: 'front', setback: [8, 14], depth: [11, 15], width: [11, 16], gap: [12, 22], floors: [2, 3], floorH: 3.3, roof: 'hip', fac: ['villa1', 'wood1', 'villa2'], cols: ['#e8e0d0', '#d8c8a8', '#c8d0c0', '#e0c8b0', '#b8b0a0'], fill: 0.75, fence: 0.6 },
    khrush: { mode: 'front', setback: [10, 16], depth: [11, 12], width: [40, 60], gap: [14, 24], floors: [5, 5], floorH: 2.9, roof: 'flat', fac: ['brick5', 'panel5'], cols: ['#c8b8a8', '#d8d0c0', '#b8a898'], fill: 0.9 },
    soviet: { mode: 'scatter', floorH: 2.8, roof: 'flat', fac: ['panel9', 'panel9b', 'panel16'], cols: ['#d8d8d0', '#e0dcd0', '#c8ccc8', '#d8d0c4'], density: 0.9,
      types: [{ w: [70, 110], d: [11, 13], floors: [9, 9], fac: 0 }, { w: [20, 24], d: [20, 24], floors: [12, 16], fac: 2 }, { w: [45, 70], d: [11, 12], floors: [5, 5], fac: 1 }, { w: [60, 90], d: [12, 13], floors: [12, 12], fac: 1 }] },
    industry: { mode: 'scatter', floorH: 5, roof: 'flat', fac: ['factory1', 'factory2', 'brick5'], cols: ['#a8a098', '#b8b0a0', '#98a0a0', '#c0b0a0'], density: 0.6,
      types: [{ w: [40, 80], d: [20, 36], floors: [2, 3], fac: 0 }, { w: [24, 40], d: [16, 24], floors: [2, 2], fac: 1 }, { w: [30, 50], d: [12, 14], floors: [4, 5], fac: 2 }] },
    port: { mode: 'scatter', floorH: 5, roof: 'flat', fac: ['factory1', 'factory2'], cols: ['#a0a8b0', '#b0a898', '#8898a8'], density: 0.5,
      types: [{ w: [60, 100], d: [24, 36], floors: [2, 3], fac: 0 }, { w: [30, 50], d: [20, 26], floors: [3, 3], fac: 1 }] },
    airport: { mode: 'scatter', floorH: 6, roof: 'flat', fac: ['factory2'], cols: ['#c8ccd0', '#b8c0c8'], density: 0,
      types: [{ w: [50, 70], d: [40, 50], floors: [2, 2], fac: 0 }] },
    none: { mode: 'none' }
  };

  const RESORT = { cols: ['#efe6cc', '#e2ead2', '#d6e2ea', '#f4f1e8', '#f0dcc4', '#e6d6e4', '#f2e6b8'], roofs: ['#9ad0b0', '#e09a86', '#c8ccd0', '#a8b8e8', '#d8b890'], fac: ['wood1', 'wood2', 'wood1', 'villa1'] };

  const LMK = {
    tvtower: { r: 33 }, peter: { box: [34, 68] }, dom: { box: [38, 72] }, castle: { box: [56, 56] }, blackheads: { box: [26, 20] },
    powder: { r: 7 }, freedom: { r: 10 }, academy: { box: [56, 56] }, market: { box: [104, 132], soft: true }, station: { box: [104, 34] },
    opera: { box: [64, 44] }, latvija: { box: [34, 22] }, bandstand: { box: [70, 50] }, festival: { box: [270, 212], soft: true },
    ferris: { r: 9 }, spilve: { box: [110, 26] }, lighthouse: { r: 5 }, dzintari: { box: [52, 34] }, grandstand: { box: [178, 18] },
    terminal: { box: [130, 46] }, crane: { box: [12, 12] }, containers: { box: [60, 24] }, tower: { box: [22, 22] },
    nativity: { box: [40, 40] }, stjohn: { box: [18, 46] }, stjacob: { box: [20, 42] }, riflemen: { r: 5 }, laima: { r: 1.5 }, turtle: { r: 3.5 },
    roland: { r: 1.8 }, occupation: { box: [28, 15] }, majori: { box: [40, 16] }, ltv: { box: [212, 54] }, lucav: { r: 5 },
    bisumuiza: { box: [32, 26] }, piens: { box: [72, 60], soft: true }, tram10: { box: [2.8, 15.2] }
  };

  function fillPoly(grid, nx, nz, x0, z0, cell, poly, fn) {
    const bb = F.polyBox(poly);
    const iz0 = Math.max(0, Math.floor((bb.z0 - z0) / cell)), iz1 = Math.min(nz - 1, Math.ceil((bb.z1 - z0) / cell));
    const xs = [];
    for (let iz = iz0; iz <= iz1; iz++) {
      const z = z0 + iz * cell;
      xs.length = 0;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const zi = poly[i][1], zj = poly[j][1];
        if ((zi > z) !== (zj > z)) xs.push(poly[i][0] + ((z - zi) / (zj - zi)) * (poly[j][0] - poly[i][0]));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const ix0 = Math.max(0, Math.ceil((xs[k] - x0) / cell)), ix1 = Math.min(nx - 1, Math.floor((xs[k + 1] - x0) / cell));
        for (let ix = ix0; ix <= ix1; ix++) fn(iz * nx + ix, ix, iz);
      }
    }
  }

  function riverPoly(r) {
    const pts = F.catmull(r.line.map((p, i) => [p[0], p[1], r.w[i]]), 30, false);
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
      const rx = -dz / l, rz = dx / l, hw = pts[i][2] / 2;
      right.push([pts[i][0] + rx * hw, pts[i][1] + rz * hw]);
      left.push([pts[i][0] - rx * hw, pts[i][1] - rz * hw]);
    }
    return { poly: right.concat(left.reverse()), center: pts, right, left: left.slice().reverse() };
  }

  class World {
    constructor(opts = {}) {
      this.map = F.MAP;
      this.seed = opts.seed || 1991;
      this.wet = false;
      this.lastSurf = 0;
      this.lastEdge = null;
      const b = this.map.BOUNDS;
      this.b = b;
      this.nx = Math.round((b.x1 - b.x0) / CS) + 1;
      this.nz = Math.round((b.z1 - b.z0) / CS) + 1;
      this.onx = Math.round((b.x1 - b.x0) / OC);
      this.onz = Math.round((b.z1 - b.z0) / OC);
      this.phases = [
        ['Даугава и залив', () => this.buildWater()],
        ['Дороги Риги', () => this.buildNetwork()],
        ['Рельеф', () => this.buildTerrain()],
        ['Районы', () => this.buildDistricts()],
        ['Достопримечательности', () => this.buildLandmarks()],
        ['Застройка', () => this.buildBuildings()],
        ['Тротуары и парковки', () => this.buildCity()],
        ['Деревья', () => this.buildTrees()],
        ['Фонари и заборы', () => this.buildProps()],
        ['Железная дорога', () => this.buildRail()],
        ['Реклама', () => this.buildAds()],
        ['Площадка фестиваля', () => this.buildFest()],
        ['Коллизии', () => this.buildColliders()],
        ['Фестиваль', () => this.buildHorizon()],
        ['Кусты и камни', () => this.buildFlora()],
        ['Окрестности', () => this.buildOutskirts()]
      ];
      this.phase = 0;
      if (!opts.lazy) while (this.phase < this.phases.length) this.stepBuild();
    }

    stepBuild() {
      const ph = this.phases[this.phase++];
      ph[1]();
      return this.phase >= this.phases.length;
    }

    get ready() { return this.phase >= this.phases.length; }

    gi(x, z) {
      const ix = F.clamp(Math.round((x - this.b.x0) / CS), 0, this.nx - 1);
      const iz = F.clamp(Math.round((z - this.b.z0) / CS), 0, this.nz - 1);
      return iz * this.nx + ix;
    }

    oi(x, z) {
      const ix = Math.floor((x - this.b.x0) / OC), iz = Math.floor((z - this.b.z0) / OC);
      if (ix < 0 || iz < 0 || ix >= this.onx || iz >= this.onz) return -1;
      return iz * this.onx + ix;
    }

    buildWater() {
      const n = this.nx * this.nz;
      this.water = new Uint8Array(n);
      this.biome = new Uint8Array(n);
      this.district = new Uint8Array(n);
      this.h = new Float32Array(n);
      const W = this.water, b = this.b;
      const fill = (poly, v) => fillPoly(W, this.nx, this.nz, b.x0, b.z0, CS, poly, i => { W[i] = v; });
      fill(this.map.SEA, 2);
      this.rivers = this.map.RIVERS.map(r => Object.assign({ id: r.id, name: r.name, canal: !!r.canal }, r.poly ? { poly: r.poly } : riverPoly(r)));
      for (const r of this.rivers) fill(r.poly, r.canal ? 3 : 1);
      for (const l of this.map.LAKES) fill(l.poly, 1);
      for (const isl of this.map.ISLANDS) fill(isl.poly, 0);
      this.occ = new Uint8Array(this.onx * this.onz);
      const O = this.occ;
      const ofill = (poly) => fillPoly(O, this.onx, this.onz, b.x0 + OC / 2, b.z0 + OC / 2, OC, poly, i => { O[i] = 2; });
      ofill(this.map.SEA);
      for (const r of this.rivers) ofill(r.poly);
      for (const l of this.map.LAKES) ofill(l.poly);
      for (const isl of this.map.ISLANDS) fillPoly(O, this.onx, this.onz, b.x0 + OC / 2, b.z0 + OC / 2, OC, isl.poly, i => { O[i] = 0; });
      const dist = new Float32Array(n).fill(1e9);
      const q = [];
      for (let i = 0; i < n; i++) if (!W[i]) { dist[i] = 0; q.push(i); }
      for (let h = 0; h < q.length; h++) {
        const i = q[h], ix = i % this.nx, iz = (i / this.nx) | 0;
        const d = dist[i] + 1;
        const nb = [ix > 0 ? i - 1 : -1, ix < this.nx - 1 ? i + 1 : -1, iz > 0 ? i - this.nx : -1, iz < this.nz - 1 ? i + this.nx : -1];
        for (const j of nb) if (j >= 0 && dist[j] > d) { dist[j] = d; q.push(j); }
      }
      this.shoreDist = dist;
    }

    isWaterAt(x, z) {
      const i = this.oi(x, z);
      return i >= 0 && this.occ[i] === 2;
    }

    buildNetwork() {
      const rng = F.rng(this.seed);
      const roads = this.map.ROADS.map((r, idx) => {
        const k = KINDS[r.kind];
        const closed = !!r.closed;
        let ctrl = r.pts.map(p => [p[0], p[1]]);
        if (closed && (ctrl[0][0] !== ctrl[ctrl.length - 1][0] || ctrl[0][1] !== ctrl[ctrl.length - 1][1])) ctrl.push([ctrl[0][0], ctrl[0][1]]);
        const radius = r.r !== undefined ? r.r : k.r;
        let pts = closed ? F.fillet(ctrl.slice(0, -1), radius, true) : F.fillet(ctrl, radius, false);
        pts = F.resample(pts, 6);
        return { idx, id: r.id || null, name: r.name, kind: r.kind, k, w: r.w || k.w, surf: k.surf, closed, bridge: r.bridge || null, own: !!r.own, pts, cuts: [] };
      });
      for (const r of roads) {
        const n = r.pts.length;
        const s = new Float32Array(n);
        for (let i = 1; i < n; i++) s[i] = s[i - 1] + Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]);
        r.s = s;
        r.len = s[n - 1];
        r.y = new Float32Array(n);
        if (r.bridge) {
          const ramp = Math.min(r.len * 0.32, r.bridge.ramp || 120);
          for (let i = 0; i < n; i++) {
            const e = Math.min(s[i], r.len - s[i]);
            r.y[i] = r.bridge.h * F.smooth(0, ramp, e) + 0.05;
          }
        }
      }
      const nodes = [];
      const parent = [];
      const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
      const nodeAt = (x, z, tol = 7) => {
        for (let i = 0; i < nodes.length; i++) {
          const nd = nodes[i];
          if (parent[i] === i && Math.abs(nd.x - x) < tol && Math.abs(nd.z - z) < tol && Math.hypot(nd.x - x, nd.z - z) < tol) return i;
        }
        nodes.push({ x, z });
        parent.push(nodes.length - 1);
        return nodes.length - 1;
      };
      const grid = new F.Grid(40);
      const segs = [];
      for (const r of roads) {
        for (let i = 0; i + 1 < r.pts.length; i++) {
          if (r.bridge && (r.y[i] > 1.2 || r.y[i + 1] > 1.2)) continue;
          const a = r.pts[i], c = r.pts[i + 1];
          const sg = { r, i, ax: a[0], az: a[1], bx: c[0], bz: c[1] };
          segs.push(sg);
          grid.add(sg, Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[0], c[0]), Math.max(a[1], c[1]));
        }
      }
      for (const r of roads) {
        if (r.closed) continue;
        for (const end of [0, r.pts.length - 1]) {
          const p = r.pts[end];
          let best = null;
          const tol = Math.max(10, r.w * 0.8);
          const near = grid.query(p[0] - tol, p[1] - tol, p[0] + tol, p[1] + tol, [], F.stamp());
          for (const sg of near) {
            if (sg.r === r) continue;
            const q = F.segDist(p[0], p[1], sg.ax, sg.az, sg.bx, sg.bz);
            if (q.d < tol && (!best || q.d < best.d)) best = { d: q.d, x: q.x, z: q.z, sg, t: q.t };
          }
          if (best) { p[0] = best.x; p[1] = best.z; }
        }
      }
      for (const r of roads) {
        for (let i = 1; i < r.pts.length; i++) r.s[i] = r.s[i - 1] + Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]);
        r.len = r.s[r.pts.length - 1];
      }
      for (const sg of segs) { sg.ax = sg.r.pts[sg.i][0]; sg.az = sg.r.pts[sg.i][1]; sg.bx = sg.r.pts[sg.i + 1][0]; sg.bz = sg.r.pts[sg.i + 1][1]; }
      const addCut = (r, s, node) => r.cuts.push({ s, node });
      const seen = new Set();
      for (const own of [false, true]) {
        for (const r of roads) {
          if (r.own !== own) continue;
          if (r.closed) {
            const nd = nodeAt(r.pts[0][0], r.pts[0][1]);
            addCut(r, 0, nd);
            addCut(r, r.len, nd);
          } else {
            addCut(r, 0, nodeAt(r.pts[0][0], r.pts[0][1]));
            addCut(r, r.len, nodeAt(r.pts[r.pts.length - 1][0], r.pts[r.pts.length - 1][1]));
          }
        }
        for (const sg of segs) {
          const near = grid.query(Math.min(sg.ax, sg.bx), Math.min(sg.az, sg.bz), Math.max(sg.ax, sg.bx), Math.max(sg.az, sg.bz), [], F.stamp());
          for (const o of near) {
            if (o.r === sg.r || (sg.r.own || o.r.own) !== own) continue;
            const key = sg.r.idx < o.r.idx ? sg.r.idx + ':' + sg.i + '|' + o.r.idx + ':' + o.i : o.r.idx + ':' + o.i + '|' + sg.r.idx + ':' + sg.i;
            if (seen.has(key)) continue;
            seen.add(key);
            const hit = F.segIntersect(sg.ax, sg.az, sg.bx, sg.bz, o.ax, o.az, o.bx, o.bz);
            if (!hit) continue;
            const nd = nodeAt(hit.x, hit.z);
            addCut(sg.r, sg.r.s[sg.i] + (sg.r.s[sg.i + 1] - sg.r.s[sg.i]) * hit.t, nd);
            addCut(o.r, o.r.s[o.i] + (o.r.s[o.i + 1] - o.r.s[o.i]) * hit.u, nd);
          }
        }
      }
      for (const r of roads) {
        if (r.closed) continue;
        for (const end of [0, r.pts.length - 1]) {
          const p = r.pts[end];
          const tol = 3;
          const near = grid.query(p[0] - tol, p[1] - tol, p[0] + tol, p[1] + tol, [], F.stamp());
          for (const sg of near) {
            if (sg.r === r) continue;
            const q = F.segDist(p[0], p[1], sg.ax, sg.az, sg.bx, sg.bz);
            if (q.d < 1.5) {
              const nd = r.cuts.find(c => Math.abs(c.s - (end === 0 ? 0 : r.len)) < 0.01).node;
              addCut(sg.r, sg.r.s[sg.i] + (sg.r.s[sg.i + 1] - sg.r.s[sg.i]) * q.t, nd);
            }
          }
        }
      }
      for (const r of roads) {
        r.cuts.sort((a, b) => a.s - b.s);
        for (let i = 1; i < r.cuts.length; i++) {
          if (r.cuts[i].s - r.cuts[i - 1].s < 5 && !(r.closed && i === r.cuts.length - 1)) {
            const a = find(r.cuts[i - 1].node), c = find(r.cuts[i].node);
            if (a !== c) parent[c] = a;
          }
        }
      }
      const finalId = new Map();
      const outNodes = [];
      for (let i = 0; i < nodes.length; i++) {
        const root = find(i);
        if (!finalId.has(root)) {
          finalId.set(root, outNodes.length);
          outNodes.push({ id: outNodes.length, x: nodes[root].x, z: nodes[root].z, y: 0, edges: [] });
        }
      }
      const nid = i => finalId.get(find(i));
      const edges = [];
      for (const r of roads) {
        const cuts = [];
        for (const c of r.cuts) {
          const id = nid(c.node);
          if (cuts.length && cuts[cuts.length - 1].id === id && c.s - cuts[cuts.length - 1].s < 5) continue;
          cuts.push({ s: c.s, id });
        }
        for (let k = 0; k + 1 < cuts.length; k++) {
          const a = cuts[k], c = cuts[k + 1];
          if (c.s - a.s < 1) continue;
          if (a.id === c.id && c.s - a.s < 20) continue;
          const pts = [], ys = [];
          const na = outNodes[a.id], nc = outNodes[c.id];
          pts.push([na.x, na.z]); ys.push(sampleY(r, a.s));
          for (let i = 0; i < r.pts.length; i++) {
            if (r.s[i] > a.s + 2 && r.s[i] < c.s - 2) { pts.push([r.pts[i][0], r.pts[i][1]]); ys.push(r.y[i]); }
          }
          pts.push([nc.x, nc.z]); ys.push(sampleY(r, c.s));
          const e = { id: edges.length, road: r.idx, rid: r.id, name: r.name, kind: r.kind, k: r.k, w: r.w, hw: r.w / 2, surf: r.surf, bridge: r.bridge, own: r.own, a: a.id, b: c.id, pts, y: ys };
          edges.push(e);
          na.edges.push(e.id);
          if (a.id !== c.id) nc.edges.push(e.id);
        }
      }
      this.nodes = outNodes;
      this.edges = edges;
      this.roadsRaw = roads;
      for (const e of edges) this.finishEdge(e);
      this.roadIds = {};
      for (const e of edges) if (e.rid) (this.roadIds[e.rid] = this.roadIds[e.rid] || []).push(e.id);
      void rng;
    }

    finishEdge(e) {
      const n = e.pts.length;
      e.s = new Float32Array(n);
      for (let i = 1; i < n; i++) e.s[i] = e.s[i - 1] + Math.hypot(e.pts[i][0] - e.pts[i - 1][0], e.pts[i][1] - e.pts[i - 1][1]);
      e.len = e.s[n - 1];
      e.x0 = Infinity; e.z0 = Infinity; e.x1 = -Infinity; e.z1 = -Infinity;
      for (const p of e.pts) {
        if (p[0] < e.x0) e.x0 = p[0];
        if (p[0] > e.x1) e.x1 = p[0];
        if (p[1] < e.z0) e.z0 = p[1];
        if (p[1] > e.z1) e.z1 = p[1];
      }
    }

    baseHeight(x, z) {
      return this.terrainH(x, z);
    }

    buildTerrain() {
      const { nx, nz, b } = this;
      const H = this.h, W = this.water;
      const n = nx * nz;
      const hillAmp = new Float32Array(n), hillScale = new Float32Array(n), dune = new Uint8Array(n);
      for (const hl of this.map.HILLS) {
        fillPoly(hillAmp, nx, nz, b.x0, b.z0, CS, hl.poly, i => { hillAmp[i] = hl.amp; hillScale[i] = hl.scale; dune[i] = hl.dunes ? 1 : 0; });
      }
      const blurred = blur(hillAmp, nx, nz, 7);
      const beachZone = new Float32Array(n);
      for (let iz = 0; iz < nz; iz++) {
        for (let ix = 0; ix < nx; ix++) {
          const i = iz * nx + ix;
          const x = b.x0 + ix * CS, z = b.z0 + iz * CS;
          if (W[i]) {
            const d = this.shoreDist[i];
            H[i] = -1.6 - Math.min(W[i] === 3 ? 1.5 : 4.5, d * 0.9);
            continue;
          }
          let h = 0;
          const amp = blurred[i];
          if (amp > 0.01) {
            const sc = hillScale[i] || 150;
            let nv = F.fbm(x / sc, z / sc, 3, 7);
            if (dune[i]) nv = Math.pow(Math.abs(Math.sin(nv * 9 + x * 0.004)), 1.6) * 0.8 + F.fbm(x / 40, z / 40, 2, 3) * 0.3;
            else nv = F.smooth(0.25, 0.8, nv);
            h += nv * amp;
          }
          for (const bp of this.map.BUMPS) {
            const d = Math.hypot(x - bp.x, z - bp.z);
            if (d < bp.r) h += bp.h * (0.5 + 0.5 * Math.cos((d / bp.r) * Math.PI));
          }
          H[i] = h;
        }
      }
      const seaD = new Float32Array(n).fill(1e9);
      const q = [];
      for (let i = 0; i < n; i++) if (W[i] === 2) { seaD[i] = 0; q.push(i); }
      for (let h = 0; h < q.length; h++) {
        const i = q[h], ix = i % nx, iz = (i / nx) | 0;
        const d = seaD[i] + 1;
        if (d > 9) continue;
        const nb = [ix > 0 ? i - 1 : -1, ix < nx - 1 ? i + 1 : -1, iz > 0 ? i - nx : -1, iz < nz - 1 ? i + nx : -1];
        for (const j of nb) if (j >= 0 && seaD[j] > d && W[j] !== 1) { seaD[j] = d; q.push(j); }
      }
      for (let i = 0; i < n; i++) {
        if (W[i] || seaD[i] > 8) continue;
        const d = seaD[i];
        beachZone[i] = 1;
        if (d <= 6) H[i] = Math.min(H[i], 0.15 + d * 0.12) * F.smooth(0, 6, d) + (0.15 + d * 0.12) * (1 - F.smooth(0, 6, d));
      }
      this.beach = beachZone;
      this.flattenFest();
      this.flattenRoads();
    }

    flattenFest() {
      const area = this.map.PARKS.find(p => p.id === 'festival');
      if (!area) return;
      const { nx, nz, b } = this, H = this.h, bb = F.polyBox(area.poly), M = 45;
      let sum = 0, n = 0;
      for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
        const x = b.x0 + ix * CS, z = b.z0 + iz * CS;
        if (x < bb.x0 || x > bb.x1 || z < bb.z0 || z > bb.z1 || !F.inPoly(x, z, area.poly)) continue;
        sum += H[iz * nx + ix]; n++;
      }
      if (!n) return;
      const level = sum / n;
      this.festY = level;
      for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
        const x = b.x0 + ix * CS, z = b.z0 + iz * CS, i = iz * nx + ix;
        if (x < bb.x0 - M || x > bb.x1 + M || z < bb.z0 - M || z > bb.z1 + M || this.water[i]) continue;
        const k = F.inPoly(x, z, area.poly) ? 1 : 1 - F.smooth(0, M, F.polyEdgeDist(x, z, area.poly));
        H[i] += (level - H[i]) * k;
      }
    }

    flattenRoads() {
      const { nx, nz, b } = this;
      const H = this.h;
      const n = nx * nz;
      for (const e of this.edges) {
        if (e.bridge) continue;
        const raw = e.pts.map(p => Math.max(this.terrainH(p[0], p[1]), 0));
        const win = e.kind === 'hwy' || e.kind === 'ave' ? 11 : e.kind === 'str' || e.kind === 'lane' || e.kind === 'old' || e.kind === 'track' ? 7 : 4;
        for (let i = 0; i < raw.length; i++) {
          let sum = 0, wsum = 0;
          for (let k = -win; k <= win; k++) {
            const j = F.clamp(i + k, 0, raw.length - 1);
            const w = 1 - Math.abs(k) / (win + 1);
            sum += raw[j] * w; wsum += w;
          }
          e.y[i] = sum / wsum + 0.05;
        }
      }
      this.levelJunctions();
      const bestW = new Float32Array(n);
      const bestD = new Float32Array(n).fill(1e9);
      const target = new Float32Array(n);
      for (const e of this.edges) {
        const elevated = !!e.bridge;
        const inner = e.hw + (elevated ? 2 : 3 + (e.k.side || 0));
        const outer = inner + (elevated ? 9 : 14);
        for (let i = 0; i < e.pts.length; i++) {
          const px = e.pts[i][0], pz = e.pts[i][1], py = e.y[i];
          if (elevated) {
            const base = this.terrainH(px, pz);
            if (base < -0.4 || py < 0.3) continue;
          }
          const ix0 = Math.max(0, Math.floor((px - outer - b.x0) / CS)), ix1 = Math.min(nx - 1, Math.ceil((px + outer - b.x0) / CS));
          const iz0 = Math.max(0, Math.floor((pz - outer - b.z0) / CS)), iz1 = Math.min(nz - 1, Math.ceil((pz + outer - b.z0) / CS));
          for (let iz = iz0; iz <= iz1; iz++) {
            for (let ix = ix0; ix <= ix1; ix++) {
              const j = iz * nx + ix;
              if (this.water[j] && !elevated) continue;
              const d = Math.hypot(b.x0 + ix * CS - px, b.z0 + iz * CS - pz);
              const w = d <= inner ? 1 : d >= outer ? 0 : 1 - F.smooth(inner, outer, d);
              if (w > bestW[j] + 1e-6 || (w > 0 && w >= bestW[j] - 1e-6 && d < bestD[j])) { bestW[j] = w; bestD[j] = d; target[j] = py - (elevated ? 0.5 : 0.08); }
            }
          }
        }
      }
      for (let i = 0; i < n; i++) if (bestW[i] > 0) H[i] = F.lerp(H[i], target[i], bestW[i]);
      this.keepBelowRoads();
      this.buildRoadIndex();
      this.buildJunctions();
    }

    keepBelowRoads() {
      const { nx, nz, b } = this;
      const H = this.h;
      for (const e of this.edges) {
        const edge = e.hw + (e.k.side || 0) + 0.5, reach = edge + 12;
        for (let i = 0; i + 1 < e.pts.length; i++) {
          const ya = e.y[i], yb = e.y[i + 1];
          if (e.bridge && Math.max(ya, yb) > 1.2) continue;
          const ax = e.pts[i][0], az = e.pts[i][1], cx = e.pts[i + 1][0], cz = e.pts[i + 1][1];
          const ix0 = Math.max(0, Math.floor((Math.min(ax, cx) - reach - b.x0) / CS)), ix1 = Math.min(nx - 1, Math.ceil((Math.max(ax, cx) + reach - b.x0) / CS));
          const iz0 = Math.max(0, Math.floor((Math.min(az, cz) - reach - b.z0) / CS)), iz1 = Math.min(nz - 1, Math.ceil((Math.max(az, cz) + reach - b.z0) / CS));
          for (let iz = iz0; iz <= iz1; iz++) {
            for (let ix = ix0; ix <= ix1; ix++) {
              const j = iz * nx + ix;
              const q = F.segDist(b.x0 + ix * CS, b.z0 + iz * CS, ax, az, cx, cz);
              if (q.d > reach) continue;
              const cap = ya + (yb - ya) * q.t - 0.08 + 0.4 * Math.max(0, q.d - edge);
              if (H[j] > cap) H[j] = cap;
            }
          }
        }
      }
    }

    buildJunctions() {
      for (const e of this.edges) e.cuts = [[null, null], [null, null]];
      for (const nd of this.nodes) {
        const arms = [];
        for (const id of nd.edges) {
          const e = this.edges[id];
          if (e.a === nd.id) arms.push(this.armOf(nd, e, 0));
          if (e.b === nd.id) arms.push(this.armOf(nd, e, 1));
        }
        arms.sort((p, q) => p.ang - q.ang);
        nd.arms = arms;
        nd.corners = [];
        if (arms.length > 1) {
          for (let k = 0; k < arms.length; k++) {
            const A = arms[k], B = arms[(k + 1) % arms.length];
            const c = this.corner(A, B);
            nd.corners.push(c);
            A.ccw = c.a;
            B.cw = c.b;
          }
        }
        for (const A of arms) {
          A.ccw = A.ccw || { sIn: 0, sOut: 0, cap: true };
          A.cw = A.cw || { sIn: 0, sOut: 0, cap: true };
          A.mouth = Math.max(0.5, A.ccw.sIn, A.ccw.sOut, A.cw.sIn, A.cw.sOut);
          A.e.cuts[A.end][A.lat > 0 ? 1 : 0] = A.ccw;
          A.e.cuts[A.end][A.lat > 0 ? 0 : 1] = A.cw;
        }
      }
      for (const e of this.edges) {
        const band = e.bridge ? 0.6 : e.k.side || 0;
        e.walks = band ? { 1: this.walkRuns(e, 1, band), '-1': this.walkRuns(e, -1, band) } : null;
      }
    }

    armOf(nd, e, end) {
      const L = Math.min(10, e.len * 0.5);
      const far = this.edgePoint(e, end ? e.len - L : L);
      const dx = far.x - nd.x, dz = far.z - nd.z, l = Math.hypot(dx, dz) || 1;
      const side = e.bridge ? 0 : e.k.side || 0;
      return { nd, e, end, lat: end ? -1 : 1, hw: e.hw, side, band: e.bridge ? 0.6 : side, dx: dx / l, dz: dz / l, ang: Math.atan2(dz, dx), lim: Math.min(e.len * 0.5 - 0.25, 40) };
    }

    armAt(A, s, l = 0) {
      const p = this.edgeAt(A.e, A.end ? A.e.len - s : s);
      const k = l * A.lat;
      return { x: p.x + p.rx * k, z: p.z + p.rz * k, y: p.y };
    }

    armProj(B, x, z) {
      const e = B.e, reach = B.lim + B.hw + 12;
      let best = null;
      for (let i = 0; i + 1 < e.pts.length; i++) {
        const near = B.end ? e.len - e.s[i + 1] : e.s[i];
        if (near > reach) { if (B.end) continue; break; }
        const a = e.pts[i], c = e.pts[i + 1];
        const q = F.segDist(x, z, a[0], a[1], c[0], c[1]);
        if (best && q.d >= best.d) continue;
        const s = e.s[i] + (e.s[i + 1] - e.s[i]) * q.t;
        const lat = ((x - q.x) * (a[1] - c[1]) + (z - q.z) * (c[0] - a[0])) * B.lat;
        best = { d: q.d, s: B.end ? e.len - s : s, lat, x: q.x, z: q.z };
      }
      return best;
    }

    corner(A, B) {
      let phi = B.ang - A.ang;
      if (phi <= 0) phi += Math.PI * 2;
      if (phi < Math.PI - 0.02) {
        const R = Math.max(A.side, B.side) || 3;
        for (const r of [R, R * 0.6, R * 0.35]) {
          const f = this.fillet(A, B, r);
          if (f) return f;
        }
        if (phi < 2.2) return { type: 'none', A, B, a: { sIn: 0, sOut: 0, cap: true }, b: { sIn: 0, sOut: 0, cap: true } };
      }
      return this.join(A, B);
    }

    fillet(A, B, R) {
      const dA = A.hw + R, dB = B.hw + R;
      const gap = s => {
        const c = this.armAt(A, s, dA);
        const q = this.armProj(B, c.x, c.z);
        return q.lat < 0 ? q.d - dB : -dB;
      };
      if (gap(0) >= 0) return null;
      let lo = 0, hi = -1;
      for (let s = 0.25; s <= A.lim; s += 0.25) {
        if (gap(s) >= 0) { hi = s; break; }
        lo = s;
      }
      if (hi < 0) return null;
      for (let k = 0; k < 10; k++) {
        const m = (lo + hi) / 2;
        if (gap(m) >= 0) hi = m; else lo = m;
      }
      const sA = hi;
      const c = this.armAt(A, sA, dA);
      const q = this.armProj(B, c.x, c.z);
      if (q.s < 0.05 || q.s > B.lim || Math.abs(q.d - dB) > 1) return null;
      const ta = this.armAt(A, sA, A.hw);
      const k = B.hw / q.d;
      const tb = { x: q.x + (c.x - q.x) * k, z: q.z + (c.z - q.z) * k, y: this.armAt(B, q.s).y };
      const a0 = Math.atan2(ta.z - c.z, ta.x - c.x);
      const da = F.wrap(Math.atan2(tb.z - c.z, tb.x - c.x) - a0);
      const n = Math.max(2, Math.ceil(Math.abs(da) / 0.2));
      const arc = [ta];
      for (let i = 1; i < n; i++) {
        const a = a0 + da * i / n;
        arc.push({ x: c.x + Math.cos(a) * R, z: c.z + Math.sin(a) * R, y: F.lerp(ta.y, tb.y, i / n) });
      }
      arc.push(tb);
      return { type: 'fillet', A, B, R, x: c.x, z: c.z, y: (ta.y + tb.y) / 2, arc, a: { sIn: sA, sOut: sA, cap: false }, b: { sIn: q.s, sOut: q.s, cap: false } };
    }

    join(A, B) {
      const cr = A.dx * B.dz - A.dz * B.dx;
      const hit = (la, lb) => {
        const rx = B.dz * lb + A.dz * la, rz = -B.dx * lb - A.dx * la;
        const t = (-rx * B.dz + B.dx * rz) / -cr, u = (A.dx * rz - A.dz * rx) / -cr;
        return Math.abs(t) <= A.lim && Math.abs(u) <= B.lim ? { t, u } : null;
      };
      const inner = Math.abs(cr) < 0.03 ? null : hit(A.hw, B.hw);
      const outer = inner && hit(A.hw + A.band, B.hw + B.band);
      if (!inner || !outer) {
        const cap = Math.abs(A.hw - B.hw) > 0.1 || Math.abs(A.band - B.band) > 0.1;
        return { type: 'join', A, B, i: null, a: { sIn: 0, sOut: 0, cap }, b: { sIn: 0, sOut: 0, cap } };
      }
      const i = this.armAt(A, 0, A.hw);
      i.x += A.dx * inner.t;
      i.z += A.dz * inner.t;
      return { type: 'join', A, B, i, a: { sIn: inner.t, sOut: outer.t, cap: false }, b: { sIn: inner.u, sOut: outer.u, cap: false } };
    }

    walkRuns(e, lat, band) {
      const k = lat > 0 ? 1 : 0, ca = e.cuts[0][k], cb = e.cuts[1][k];
      const start = { sIn: ca.sIn, sOut: ca.sOut, cap: ca.cap };
      const end = { sIn: e.len - cb.sIn, sOut: e.len - cb.sOut, cap: cb.cap };
      const s0 = Math.max(start.sIn, start.sOut), s1 = Math.min(end.sIn, end.sOut);
      if (s1 - s0 < 0.5) return [];
      const free = s => !this.bandBlocked(e, lat, band, s);
      const runs = [];
      let open = null, prevS = s0, prevFree = free(s0);
      if (prevFree) open = start;
      for (let s = Math.min(s1, s0 + 0.5); ; s = Math.min(s1, s + 0.5)) {
        const f = free(s);
        if (f !== prevFree) {
          let lo = prevS, hi = s;
          for (let i = 0; i < 8; i++) {
            const m = (lo + hi) / 2;
            if (free(m) === prevFree) lo = m; else hi = m;
          }
          if (prevFree) { runs.push({ a: open, b: { sIn: lo, sOut: lo, cap: true } }); open = null; }
          else open = { sIn: hi, sOut: hi, cap: true };
        }
        prevS = s;
        prevFree = f;
        if (s >= s1) break;
      }
      if (open) runs.push({ a: open, b: end });
      return runs.filter(r => Math.min(r.b.sIn, r.b.sOut) - Math.max(r.a.sIn, r.a.sOut) > 0.3);
    }

    bandBlocked(e, lat, band, s) {
      const p = this.edgeAt(e, s);
      for (const l of [e.hw + 0.05, e.hw + band * 0.5, e.hw + band - 0.05]) {
        if (this.onCarriageway(p.x + p.rx * l * lat, p.z + p.rz * l * lat, p.y, e)) return true;
      }
      return false;
    }

    onCarriageway(x, z, y, except = null) {
      const grid = this.segGrid;
      const arr = grid.map.get(grid.key(Math.floor(x / grid.cell), Math.floor(z / grid.cell)));
      if (!arr) return false;
      for (const sg of arr) {
        if (sg.e === except) continue;
        const dx = sg.bx - sg.ax, dz = sg.bz - sg.az, l2 = dx * dx + dz * dz;
        let t = l2 > 0 ? ((x - sg.ax) * dx + (z - sg.az) * dz) / l2 : 0;
        if ((t < 0 && sg.i === 0) || (t > 1 && sg.i === sg.e.pts.length - 2)) continue;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = sg.ax + dx * t - x, qz = sg.az + dz * t - z, r = sg.hw - 0.05;
        if (qx * qx + qz * qz < r * r && Math.abs(sg.ay + (sg.by - sg.ay) * t - y) < 1.5) return true;
      }
      return false;
    }

    levelJunctions() {
      for (const nd of this.nodes) {
        let sum = 0, cnt = 0, hw = 0;
        for (const eid of nd.edges) {
          const e = this.edges[eid];
          hw = Math.max(hw, e.hw);
          if (e.a === nd.id) { sum += e.y[0]; cnt++; }
          if (e.b === nd.id) { sum += e.y[e.y.length - 1]; cnt++; }
        }
        nd.y = cnt ? sum / cnt : 0;
        nd.flat = nd.edges.length >= 3 ? hw + 4 : 0;
      }
      for (const e of this.edges) {
        const na = this.nodes[e.a], nb = this.nodes[e.b];
        const m = e.y.length;
        const da = na.y - e.y[0], db = nb.y - e.y[m - 1];
        const reach = Math.min(30, e.len * 0.8);
        const fa = Math.min(na.flat, e.len * 0.4), fb = Math.min(nb.flat, e.len * 0.4), ramp = Math.min(25, e.len * 0.3);
        for (let i = 0; i < m; i++) {
          const sa = e.s[i], sb = e.len - e.s[i];
          const y = e.y[i] + da * F.clamp(1 - sa / reach, 0, 1) + db * F.clamp(1 - sb / reach, 0, 1);
          let pa = na.flat ? 1 - F.smooth(fa, fa + ramp, sa) : 0;
          let pb = nb.flat ? 1 - F.smooth(fb, fb + ramp, sb) : 0;
          const ps = pa + pb;
          if (ps > 1) { pa /= ps; pb /= ps; }
          e.y[i] = y * (1 - pa - pb) + na.y * pa + nb.y * pb;
        }
      }
    }

    buildRoadIndex() {
      const grid = new F.Grid(24);
      this.segGrid = grid;
      this.segs = [];
      for (const e of this.edges) {
        const side = e.k.side || 0;
        for (let i = 0; i + 1 < e.pts.length; i++) {
          const a = e.pts[i], c = e.pts[i + 1];
          const sg = { e, i, ax: a[0], az: a[1], bx: c[0], bz: c[1], ay: e.y[i], by: e.y[i + 1], hw: e.hw, side };
          this.segs.push(sg);
          const m = e.hw + side + 0.5;
          grid.add(sg, Math.min(a[0], c[0]) - m, Math.min(a[1], c[1]) - m, Math.max(a[0], c[0]) + m, Math.max(a[1], c[1]) + m);
        }
      }
      for (const nd of this.nodes) {
        let r = 0;
        for (const eid of nd.edges) r = Math.max(r, this.edges[eid].hw);
        nd.r = r + 1;
      }
      const O = this.occ;
      for (const sg of this.segs) {
        const m = sg.hw + sg.side + 1.2;
        this.rasterSeg(sg.ax, sg.az, sg.bx, sg.bz, m, i => { O[i] = 1; });
      }
      for (const nd of this.nodes) this.rasterDisc(nd.x, nd.z, nd.r + 2, i => { O[i] = 1; });
    }

    rasterSeg(ax, az, bx, bz, r, fn) {
      const x0 = Math.min(ax, bx) - r, x1 = Math.max(ax, bx) + r, z0 = Math.min(az, bz) - r, z1 = Math.max(az, bz) + r;
      const b = this.b;
      const ix0 = Math.max(0, Math.floor((x0 - b.x0) / OC)), ix1 = Math.min(this.onx - 1, Math.floor((x1 - b.x0) / OC));
      const iz0 = Math.max(0, Math.floor((z0 - b.z0) / OC)), iz1 = Math.min(this.onz - 1, Math.floor((z1 - b.z0) / OC));
      for (let iz = iz0; iz <= iz1; iz++) {
        const cz = b.z0 + (iz + 0.5) * OC;
        for (let ix = ix0; ix <= ix1; ix++) {
          const cx = b.x0 + (ix + 0.5) * OC;
          if (F.segDist(cx, cz, ax, az, bx, bz).d <= r) fn(iz * this.onx + ix);
        }
      }
    }

    rasterDisc(x, z, r, fn) { this.rasterSeg(x, z, x, z, r, fn); }

    rasterRect(cx, cz, tx, tz, hl, hw, fn) {
      const nx = -tz, nz = tx;
      const rx = Math.abs(tx) * hl + Math.abs(nx) * hw, rz = Math.abs(tz) * hl + Math.abs(nz) * hw;
      const b = this.b;
      const ix0 = Math.max(0, Math.floor((cx - rx - b.x0) / OC)), ix1 = Math.min(this.onx - 1, Math.floor((cx + rx - b.x0) / OC));
      const iz0 = Math.max(0, Math.floor((cz - rz - b.z0) / OC)), iz1 = Math.min(this.onz - 1, Math.floor((cz + rz - b.z0) / OC));
      if (ix0 > ix1 || iz0 > iz1) return false;
      for (let iz = iz0; iz <= iz1; iz++) {
        const pz = b.z0 + (iz + 0.5) * OC - cz;
        for (let ix = ix0; ix <= ix1; ix++) {
          const px = b.x0 + (ix + 0.5) * OC - cx;
          const u = px * tx + pz * tz, v = px * nx + pz * nz;
          if (Math.abs(u) <= hl && Math.abs(v) <= hw) { if (fn(iz * this.onx + ix) === false) return false; }
        }
      }
      return true;
    }

    rectFree(cx, cz, tx, tz, hl, hw, margin = 1) {
      if (cx - hl < this.b.x0 + 20 || cx + hl > this.b.x1 - 20 || cz - hl < this.b.z0 + 20 || cz + hl > this.b.z1 - 20) return false;
      return this.rasterRect(cx, cz, tx, tz, hl + margin, hw + margin, i => this.occ[i] === 0);
    }

    buildDistricts() {
      const { nx, nz, b } = this;
      this.districts = this.map.DISTRICTS.map((d, i) => Object.assign({ idx: i + 1 }, d));
      for (const d of this.districts) fillPoly(this.district, nx, nz, b.x0, b.z0, CS, d.poly, i => { this.district[i] = d.idx; });
      const B = this.biome;
      const n = nx * nz;
      for (let i = 0; i < n; i++) {
        if (this.water[i]) { B[i] = 0; continue; }
        const d = this.district[i] ? this.districts[this.district[i] - 1] : null;
        if (d && d.style === 'hansa') B[i] = 5;
        else if (d && d.style === 'jugend') B[i] = 9;
        else if (d && (d.style === 'industry' || d.style === 'port')) B[i] = 6;
        else if (d && d.style === 'airport') B[i] = 7;
        else if (d && (d.style === 'soviet' || d.style === 'khrush')) B[i] = 3;
        else B[i] = 2;
      }
      for (const f of this.map.FORESTS) fillPoly(B, nx, nz, b.x0, b.z0, CS, f.poly, i => { if (!this.water[i]) B[i] = 4; });
      for (const p of this.map.PARKS) fillPoly(B, nx, nz, b.x0, b.z0, CS, p.poly, i => { if (!this.water[i]) B[i] = p.plaza ? 8 : 3; });
      for (let i = 0; i < n; i++) if (this.beach[i] && !this.water[i]) B[i] = 1;
      const O = this.occ;
      for (const p of this.map.PARKS) fillPoly(O, this.onx, this.onz, b.x0 + OC / 2, b.z0 + OC / 2, OC, p.poly, i => { if (O[i] === 0) O[i] = p.plaza || p.field ? 6 : 7; });
    }

    districtAt(x, z) {
      const d = this.district[this.gi(x, z)];
      return d ? this.districts[d - 1] : null;
    }

    buildLandmarks() {
      this.landmarks = [];
      for (const l of this.map.LANDMARKS) {
        const def = LMK[l.type] || { r: 10 };
        const yaw = l.yaw || 0;
        const y = this.terrainH(l.x, l.z);
        const lm = Object.assign({ yaw, y, def }, l);
        this.landmarks.push(lm);
        const tx = Math.cos(yaw), tz = Math.sin(yaw);
        if (def.box) this.rasterRect(l.x, l.z, tx, tz, def.box[0] / 2 + 2, def.box[1] / 2 + 2, i => { if (this.occ[i] !== 1 && this.occ[i] !== 2) this.occ[i] = def.soft ? 6 : 4; });
        else this.rasterDisc(l.x, l.z, def.r + 3, i => { if (this.occ[i] !== 1 && this.occ[i] !== 2) this.occ[i] = 4; });
      }
    }

    polyFree(poly) {
      const b = this.b;
      for (const p of poly) if (p[0] < b.x0 + 20 || p[0] > b.x1 - 20 || p[1] < b.z0 + 20 || p[1] > b.z1 - 20) return false;
      let ok = true;
      fillPoly(this.occ, this.onx, this.onz, b.x0 + OC / 2, b.z0 + OC / 2, OC, poly, i => { if (this.occ[i] !== 0) ok = false; });
      return ok;
    }

    frontAt(e, s, lat, off) {
      const p = this.edgeAt(e, s);
      return { x: p.x + p.rx * off * lat, z: p.z + p.rz * off * lat, nx: p.rx * lat, nz: p.rz * lat, tx: p.tx, tz: p.tz };
    }

    depthAt(x, z, nx, nz, max) {
      for (let d = 2; d <= max; d += 1) {
        const i = this.oi(x + nx * d, z + nz * d);
        if (i < 0 || this.occ[i] !== 0) return d - 1.2;
      }
      return max;
    }

    blockBuildings(rng) {
      const dense = d => d && STYLES[d.style] && STYLES[d.style].mode === 'block';
      const taken = new Map();
      const key = (e, lat, end) => e.id + ':' + lat + ':' + end;
      const runAt = (e, lat, end) => {
        const runs = e.walks && e.walks[lat];
        if (!runs || !runs.length) return null;
        const r = end ? runs[runs.length - 1] : runs[0];
        if (end ? r.b.cap : r.a.cap) return null;
        return Math.min(r.b.sIn, r.b.sOut) - Math.max(r.a.sIn, r.a.sOut);
      };
      for (const nd of this.nodes) {
        for (const c of nd.corners || []) {
          if (c.type !== 'fillet') continue;
          const A = c.A, B = c.B;
          if (!A.side || !B.side || A.e.bridge || B.e.bridge) continue;
          const d = this.districtAt(c.x, c.z);
          if (!dense(d)) continue;
          const lenA = runAt(A.e, A.lat, A.end), lenB = runAt(B.e, -B.lat, B.end);
          if (!lenA || !lenB || lenA < 12 || lenB < 12) continue;
          const st = STYLES[d.style];
          const pa = this.edgeAt(A.e, A.end ? A.e.len - c.a.sIn : c.a.sIn), pb = this.edgeAt(B.e, B.end ? B.e.len - c.b.sIn : c.b.sIn);
          const ua = [pa.tx * (A.end ? -1 : 1), pa.tz * (A.end ? -1 : 1)], ub = [pb.tx * (B.end ? -1 : 1), pb.tz * (B.end ? -1 : 1)];
          if (Math.abs(ua[0] * ub[1] - ua[1] * ub[0]) < 0.5) continue;
          const wa = Math.min(rng.range(st.corner[0], st.corner[1]), lenA * 0.5), wb = Math.min(rng.range(st.corner[0], st.corner[1]), lenB * 0.5);
          const C = [c.x, c.z];
          const poly = [C, [C[0] + ua[0] * wa, C[1] + ua[1] * wa], [C[0] + ua[0] * wa + ub[0] * wb, C[1] + ua[1] * wa + ub[1] * wb], [C[0] + ub[0] * wb, C[1] + ub[1] * wb]];
          const inner = [[C[0] + (ua[0] + ub[0]) * 1.6, C[1] + (ua[1] + ub[1]) * 1.6], [poly[1][0] + ub[0] * 1.6, poly[1][1] + ub[1] * 1.6], poly[2], [poly[3][0] + ua[0] * 1.6, poly[3][1] + ua[1] * 1.6]];
          if (!this.polyFree(inner) || poly.some(p => this.districtAt(p[0], p[1]) !== d)) continue;
          const fl = rng.int(st.floors[0], st.floors[1]) + (d.style === 'jugend' ? 1 : 0);
          this.addBuilding(this.lotBuilding(d, st, poly, fl, ['s', 'p', 'p', 's'], rng, { corner: true }));
          taken.set(key(A.e, A.lat, A.end), { w: wa, p: poly[1] });
          taken.set(key(B.e, -B.lat, B.end), { w: wb, p: poly[3] });
        }
      }
      for (const e of this.edges) {
        if (e.bridge || !e.walks || !e.k.side) continue;
        for (const lat of [-1, 1]) {
          const runs = e.walks[lat];
          runs.forEach((run, ri) => {
            let s0 = Math.max(run.a.sIn, run.a.sOut), s1 = Math.min(run.b.sIn, run.b.sOut);
            const mid = this.frontAt(e, (s0 + s1) / 2, lat, e.hw + e.k.side + 2);
            const d = this.districtAt(mid.x, mid.z);
            if (!dense(d)) return;
            const st = STYLES[d.style];
            const ca = ri === 0 && !run.a.cap ? taken.get(key(e, lat, 0)) : null;
            const cb = ri === runs.length - 1 && !run.b.cap ? taken.get(key(e, lat, 1)) : null;
            const snap = (t, raw, lo, hi) => { const q = this.nearestRoad(t.p[0], t.p[1], 40, x => x === e); return q ? F.clamp(q.s, lo, hi) : raw; };
            s0 = ca ? snap(ca, s0 + ca.w, s0, s0 + ca.w + 4) : s0 + 0.4;
            s1 = cb ? snap(cb, s1 - cb.w, s1 - cb.w - 4, s1) : s1 - 0.4;
            const off = e.hw + e.k.side + 0.25;
            let s = s0;
            while (s1 - s >= st.width[0] * 0.7) {
              let w = rng.range(st.width[0], st.width[1]);
              if (s1 - s - w < st.width[0] * 0.7) w = s1 - s;
              if (w > st.width[1] * 1.6) w = st.width[1];
              const f0 = this.frontAt(e, s, lat, off), f1 = this.frontAt(e, s + w, lat, off);
              const fm = this.frontAt(e, s + w / 2, lat, off), m = Math.min(1.2, w * 0.2);
              const g0 = this.frontAt(e, s + m, lat, off), g1 = this.frontAt(e, s + w - m, lat, off);
              const want = rng.range(st.depth[0], st.depth[1]);
              const probe = f => this.depthAt(f.x + f.nx * 1.6, f.z + f.nz * 1.6, f.nx, f.nz, want) + 1.6;
              let dp = Math.min(want, probe(g0), probe(g1), probe(fm));
              if (dp < st.depth[0] * 0.65) { s += 0.7; continue; }
              const poly = [[f0.x, f0.z], [f1.x, f1.z], [f1.x + f1.nx * dp, f1.z + f1.nz * dp], [f0.x + f0.nx * dp, f0.z + f0.nz * dp]];
              const inner = [[g0.x + g0.nx * 1.6, g0.z + g0.nz * 1.6], [g1.x + g1.nx * 1.6, g1.z + g1.nz * 1.6], [g1.x + g1.nx * dp, g1.z + g1.nz * dp], [g0.x + g0.nx * dp, g0.z + g0.nz * dp]];
              if (!this.polyFree(inner) || this.districtAt(poly[2][0], poly[2][1]) !== d || this.districtAt(poly[3][0], poly[3][1]) !== d) { s += 0.7; continue; }
              const fl = rng.int(st.floors[0], st.floors[1]);
              this.addBuilding(this.lotBuilding(d, st, poly, fl, ['s', 'p', 'b', 'p'], rng, {}));
              s += w;
            }
          });
        }
      }
    }

    lotBuilding(d, st, poly, fl, faces, rng, o) {
      const fx = poly[1][0] - poly[0][0], fz = poly[1][1] - poly[0][1], w = Math.hypot(fx, fz) || 1;
      const dx = poly[3][0] - poly[0][0], dz = poly[3][1] - poly[0][1], dp = Math.hypot(dx, dz) || 1;
      const x = (poly[0][0] + poly[1][0] + poly[2][0] + poly[3][0]) / 4, z = (poly[0][1] + poly[1][1] + poly[2][1] + poly[3][1]) / 4;
      let roof = st.roof;
      if (d.style === 'hansa') roof = w < 11.5 && !o.corner ? 'front' : rng() < 0.2 ? 'hip' : 'gable';
      else if (d.style === 'jugend') roof = o.corner ? 'mansard' : rng() < 0.55 ? 'mansard' : rng() < 0.6 ? 'gable' : 'hip';
      const y = Math.min(...poly.map(p => this.terrainH(p[0], p[1]))) - 0.3, gy = this.streetLevel(poly, faces, y + 0.3);
      const h = gy - y + st.ground + (fl - 1) * st.floorH + st.attic;
      const gable = d.style === 'hansa' && roof === 'front' ? rng.pick(['step', 'step', 'curve', 'plain', 'plain']) : null;
      return {
        x, z, tx: fx / w, tz: fz / w, w, d: dp, poly, faces, floors: fl, h, gy, style: d.style, fac: rng.pick(st.fac), roof, col: rng.pick(st.cols),
        front: 1, y, shop: rng() < st.shops, corner: !!o.corner, gable,
        tower: o.corner && d.style === 'jugend' && rng() < 0.75, seed: Math.floor(rng() * 1e6)
      };
    }

    streetLevel(poly, faces, base) {
      const n = poly.length, cx = poly.reduce((s, p) => s + p[0], 0) / n, cz = poly.reduce((s, p) => s + p[1], 0) / n;
      let top = base;
      for (let i = 0; i < n; i++) {
        if (faces[i] !== 's') continue;
        const a = poly[i], c = poly[(i + 1) % n], L = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1;
        let nx = (c[1] - a[1]) / L, nz = -(c[0] - a[0]) / L;
        if (((a[0] + c[0]) / 2 - cx) * nx + ((a[1] + c[1]) / 2 - cz) * nz < 0) { nx = -nx; nz = -nz; }
        for (let k = 0; k <= 6; k++) {
          const t = 0.04 + 0.92 * k / 6, x = a[0] + (c[0] - a[0]) * t + nx * 0.7, z = a[1] + (c[1] - a[1]) * t + nz * 0.7;
          const y = this.ground(x, z, 1e4, false);
          top = Math.max(top, y + (this.lastSurf === S.PAVE && !this.lastEdge ? 0.16 : 0));
        }
      }
      return top;
    }

    partyWalls() {
      const grid = new F.Grid(32);
      for (const b of this.buildings) { const q = F.polyBox(b.poly); grid.add(b, q.x0, q.z0, q.x1, q.z1); }
      for (const bd of this.buildings) if (bd.faces && bd.faces.includes('p')) bd.party = bd.faces.map((f, i) => (f === 'p' ? this.partyRuns(bd, i, grid) : null));
    }

    partyRuns(bd, i, grid) {
      const p = bd.poly, a = p[i], c = p[(i + 1) % p.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1;
      let nx = (c[1] - a[1]) / L, nz = -(c[0] - a[0]) / L;
      if (((a[0] + c[0]) / 2 - bd.x) * nx + ((a[1] + c[1]) / 2 - bd.z) * nz < 0) { nx = -nx; nz = -nz; }
      const n = Math.max(2, Math.ceil(L / 0.5)), runs = [];
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, x = a[0] + (c[0] - a[0]) * t + nx * 0.6, z = a[1] + (c[1] - a[1]) * t + nz * 0.6;
        let top = -1e9;
        for (const o of grid.query(x, z, x, z)) if (o !== bd && F.inPoly(x, z, o.poly)) top = Math.max(top, o.y + o.h);
        const r = runs[runs.length - 1];
        if (r && Math.abs(r[2] - top) < 0.05) r[1] = (k + 1) / n;
        else runs.push([k / n, (k + 1) / n, top]);
      }
      return runs;
    }

    buildBuildings() {
      const rng = F.rng(this.seed + 11);
      this.buildings = [];
      const rp = this.railPath();
      for (let i = 0; i + 1 < rp.length; i++) this.rasterSeg(rp[i][0], rp[i][1], rp[i + 1][0], rp[i + 1][1], 4.5, k => { if (this.occ[k] === 0 || this.occ[k] >= 6) this.occ[k] = 1; });
      this.blockBuildings(rng);
      for (const e of this.edges) {
        if (e.bridge || !e.k.lanes) continue;
        const mid = e.pts[e.pts.length >> 1];
        const d = this.districtAt(mid[0], mid[1]);
        if (!d) continue;
        const st = STYLES[d.style];
        if (!st || st.mode !== 'front') continue;
        for (const side of [-1, 1]) {
          let s = 4 + rng() * 4;
          while (s < e.len - 4) {
            if (rng() > st.fill) { s += rng.range(st.width[0], st.width[1]); continue; }
            const w = rng.range(st.width[0], st.width[1]);
            const dp = rng.range(st.depth[0], st.depth[1]);
            const sb = rng.range(st.setback[0], st.setback[1]);
            const p = this.edgePoint(e, s + w / 2);
            const off = e.hw + (e.k.side || 0) + sb + dp / 2 + 1.3;
            const cx = p.x + p.rx * off * side, cz = p.z + p.rz * off * side;
            const dd = this.districtAt(cx, cz);
            if (dd !== d) { s += 5; continue; }
            if (this.rectFree(cx, cz, p.tx, p.tz, w / 2, dp / 2, 0.6)) {
              const fl = rng.int(st.floors[0], st.floors[1]);
              const bld = { x: cx, z: cz, tx: p.tx, tz: p.tz, w, d: dp, floors: fl, h: fl * st.floorH + (st.roof === 'flat' ? 1 : 0), style: d.style, fac: rng.pick(st.fac), roof: st.roof, col: rng.pick(st.cols), front: side, y: this.terrainH(cx, cz) - 0.3 };
              if (d.id === 'jurmala') this.resortVilla(bld, p, side);
              this.addBuilding(bld);
              if (st.fence && rng() < st.fence) this.pendingFence(e, s, w + 2, side, e.hw + (e.k.side || 0) + 1.8, rng);
              s += w + rng.range(st.gap[0], st.gap[1]);
            } else s += 3;
          }
        }
      }
      for (const d of this.districts) {
        const st = STYLES[d.style];
        if (!st || st.mode !== 'scatter') continue;
        const area = F.polyArea(d.poly);
        const bb = F.polyBox(d.poly);
        const tries = Math.round(area / 900 * st.density);
        for (let t = 0; t < tries; t++) {
          const x = rng.range(bb.x0, bb.x1), z = rng.range(bb.z0, bb.z1);
          if (!F.inPoly(x, z, d.poly)) continue;
          const nr = this.nearestRoad(x, z, 140, e => !e.own);
          let tx = 1, tz = 0;
          if (nr) { tx = nr.tx; tz = nr.tz; if (rng() < 0.4) { const ttx = tx; tx = -tz; tz = ttx; } }
          const ty = rng.pick(st.types);
          const w = rng.range(ty.w[0], ty.w[1]), dp = rng.range(ty.d[0], ty.d[1]);
          const margin = d.style === 'soviet' ? 10 : 5;
          if (!this.rectFree(x, z, tx, tz, w / 2, dp / 2, margin)) continue;
          const fl = rng.int(ty.floors[0], ty.floors[1]);
          this.addBuilding({ x, z, tx, tz, w, d: dp, floors: fl, h: fl * st.floorH + 1, style: d.style, fac: st.fac[ty.fac] || st.fac[0], roof: st.roof, col: rng.pick(st.cols), front: 1, y: this.terrainH(x, z) - 0.3 });
        }
      }
      this.partyWalls();
    }

    resortVilla(bld, p, side) {
      const r = F.rng(Math.abs(Math.round(bld.x * 7.31) * 131 + Math.round(bld.z * 3.17)) + 1);
      bld.fac = r.pick(RESORT.fac);
      bld.col = r.pick(RESORT.cols);
      bld.jv = { fx: -p.rx * side, fz: -p.rz * side, veranda: r() < 0.8, turret: r() < 0.35, gable: r() < 0.6, roof: r.pick(RESORT.roofs) };
    }

    addBuilding(bld) {
      bld.id = this.buildings.length;
      if (!bld.poly) {
        const hw = bld.w / 2, hd = bld.d / 2, nx = -bld.tz, nz = bld.tx;
        const P = (a, c) => [bld.x + bld.tx * a + nx * c, bld.z + bld.tz * a + nz * c];
        bld.poly = [P(-hw, -hd), P(hw, -hd), P(hw, hd), P(-hw, hd)];
        bld.faces = ['s', 's', 's', 's'];
      }
      this.buildings.push(bld);
      const b = this.b;
      fillPoly(this.occ, this.onx, this.onz, b.x0 + OC / 2, b.z0 + OC / 2, OC, bld.poly, i => { this.occ[i] = 3; });
    }

    pendingFence(e, s, len, side, off, rng) {
      if (!this.fences) this.fences = [];
      this.fences.push({ e, s, len, side, off, col: rng() < 0.5 ? '#6a5236' : '#4a6a3a' });
    }

    edgePoint(e, s) {
      s = F.clamp(s, 0, e.len);
      let i = 0;
      let lo = 0, hi = e.pts.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (e.s[mid] <= s) lo = mid; else hi = mid;
      }
      i = lo;
      const a = e.pts[i], c = e.pts[Math.min(i + 1, e.pts.length - 1)];
      const segL = (e.s[i + 1] || e.s[i]) - e.s[i];
      const t = segL > 0 ? (s - e.s[i]) / segL : 0;
      let tx = c[0] - a[0], tz = c[1] - a[1];
      const l = Math.hypot(tx, tz) || 1;
      tx /= l; tz /= l;
      return { x: a[0] + (c[0] - a[0]) * t, z: a[1] + (c[1] - a[1]) * t, y: e.y[i] + ((e.y[i + 1] ?? e.y[i]) - e.y[i]) * t, tx, tz, rx: -tz, rz: tx, i };
    }

    slicePath(e, s0, s1) {
      const a = this.edgeAt(e, s0), c = this.edgeAt(e, s1);
      const pts = [[a.x, a.z]], ys = [a.y];
      for (let i = 0; i < e.pts.length; i++) if (e.s[i] > s0 + 0.3 && e.s[i] < s1 - 0.3) { pts.push(e.pts[i]); ys.push(e.y[i]); }
      pts.push([c.x, c.z]);
      ys.push(c.y);
      return { pts, ys };
    }

    edgeAt(e, s) {
      if (s >= 0 && s <= e.len) return this.edgePoint(e, s);
      const p = this.edgePoint(e, s < 0 ? 0 : e.len);
      const d = s < 0 ? s : s - e.len;
      p.x += p.tx * d;
      p.z += p.tz * d;
      return p;
    }

    buildTrees() {
      const rng = F.rng(this.seed + 23);
      this.trees = [];
      const O = this.occ;
      const put = (x, z, kind, s) => {
        const i = this.oi(x, z);
        if (i < 0 || (O[i] !== 0 && O[i] !== 7)) return false;
        const i2 = this.oi(x + 1.5, z), i3 = this.oi(x - 1.5, z), i4 = this.oi(x, z + 1.5), i5 = this.oi(x, z - 1.5);
        if ([i2, i3, i4, i5].some(k => k < 0 || (O[k] !== 0 && O[k] !== 5 && O[k] !== 7))) return false;
        O[i] = 5;
        this.trees.push({ x, z, y: this.terrainH(x, z), kind, s });
        return true;
      };
      const scatter = (poly, density, kinds) => {
        const cell = 1 / Math.sqrt(density);
        const bb = F.polyBox(poly);
        for (let z = bb.z0; z < bb.z1; z += cell) {
          for (let x = bb.x0; x < bb.x1; x += cell) {
            const px = x + rng() * cell, pz = z + rng() * cell;
            if (!F.inPoly(px, pz, poly)) continue;
            put(px, pz, rng.pick(kinds), rng.range(0.8, 1.3));
          }
        }
      };
      for (const f of this.map.FORESTS) scatter(f.poly, f.density, f.kind === 'pine' ? ['pine', 'pine', 'pine', 'spruce'] : ['pine', 'birch', 'spruce', 'birch', 'oak']);
      for (const p of this.map.PARKS) if (p.trees !== 'none') scatter(p.poly, p.density, ['linden', 'linden', 'oak', 'birch']);
      for (const d of this.districts) {
        if (d.own) continue;
        const kinds = d.style === 'soviet' || d.style === 'khrush' ? ['birch', 'linden', 'birch', 'spruce'] : d.style === 'wood' || d.style === 'villa' ? ['oak', 'linden', 'birch', 'pine', 'apple'] : d.style === 'industry' ? ['birch'] : ['linden'];
        const dens = d.style === 'soviet' ? 0.0018 : d.style === 'khrush' ? 0.0018 : d.style === 'wood' ? 0.002 : d.style === 'villa' ? 0.003 : d.style === 'industry' ? 0.0004 : d.style === 'none' ? 0.001 : d.style === 'jugend' ? 0.0022 : d.style === 'airport' ? 0 : 0.0004;
        scatter(d.poly, dens, kinds);
      }
      for (const e of this.edges) {
        if (e.kind !== 'ave' || e.bridge) continue;
        const d = this.districtAt(e.pts[0][0], e.pts[0][1]);
        if (!d || (d.style !== 'jugend' && d.style !== 'soviet')) continue;
        for (let s = 8; s < e.len - 8; s += 14) {
          const p = this.edgePoint(e, s);
          for (const side of [-1, 1]) {
            const off = e.hw + (e.k.side || 0) + 2.2;
            const x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
            const i = this.oi(x, z);
            if (i >= 0 && O[i] === 0) { O[i] = 5; this.trees.push({ x, z, y: this.terrainH(x, z), kind: 'linden', s: 0.9 + rng() * 0.2, street: true }); }
          }
        }
      }
      const B = this.biome;
      const fieldRng = F.rng(this.seed + 31);
      for (let k = 0; k < 2600; k++) {
        const x = fieldRng.range(this.b.x0 + 40, this.b.x1 - 40), z = fieldRng.range(this.b.z0 + 40, this.b.z1 - 40);
        const bi = B[this.gi(x, z)];
        if (bi !== 2) continue;
        put(x, z, fieldRng.pick(['oak', 'birch', 'pine', 'linden']), fieldRng.range(0.8, 1.4));
      }
      this.planTrees();
    }

    buildProps() {
      const rng = F.rng(this.seed + 41);
      this.props = [];
      const O = this.occ;
      const add = (type, x, z, yaw, o = {}) => {
        const p = Object.assign({ type, x, z, y: this.groundY(x, z), yaw }, o);
        this.props.push(p);
        return p;
      };
      for (const e of this.edges) {
        const k = e.k;
        if (e.bridge) {
          for (let s = 20; s < e.len - 20; s += 45) {
            const p = this.edgePoint(e, s);
            if (p.y < 2) continue;
            for (const side of [-1, 1]) add('blamp', p.x + p.rx * (e.hw + 0.4) * side, p.z + p.rz * (e.hw + 0.4) * side, Math.atan2(p.tx, -p.tz) + (side > 0 ? -Math.PI / 2 : Math.PI / 2), { y: p.y, solid: true });
          }
          continue;
        }
        if (k.lamps && !e.own) {
          const off = e.hw + Math.max(0.6, (k.side || 0) - 0.5);
          let s = 10 + rng() * 10;
          let side = rng() < 0.5 ? -1 : 1;
          while (s < e.len - 10) {
            const p = this.edgePoint(e, s);
            const x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
            if (!this.nearNode(x, z, 4) && this.offRoad(x, z, 0.8, e)) add('lamp', x, z, Math.atan2(p.tx, -p.tz) + (side > 0 ? -Math.PI / 2 : Math.PI / 2), { smash: true, mass: 90 });
            s += k.lamps;
            if (e.kind !== 'hwy') side = -side;
          }
        }
      }
      if (this.fences) {
        for (const f of this.fences) {
          const n = Math.max(1, Math.round(f.len / 3));
          for (let j = 0; j < n; j++) {
            const s = f.s + (j + 0.5) * (f.len / n);
            if (s < 2 || s > f.e.len - 2) continue;
            const p = this.edgePoint(f.e, s);
            const x = p.x + p.rx * f.off * f.side, z = p.z + p.rz * f.off * f.side;
            const i = this.oi(x, z);
            if (i < 0 || O[i] === 2 || O[i] === 3) continue;
            if (this.nearNode(x, z, 8) || !this.offRoad(x, z, 1.4, f.e)) continue;
            add('fence', x, z, Math.atan2(p.tx, -p.tz), { smash: true, mass: 30, len: f.len / n, col: f.col });
          }
        }
        this.fences = null;
      }
      for (const d of this.districts) {
        if (d.style !== 'hansa' && d.style !== 'jugend' && d.style !== 'soviet') continue;
        const bb = F.polyBox(d.poly);
        const count = Math.round(F.polyArea(d.poly) / (d.style === 'soviet' ? 40000 : 20000));
        for (let k = 0; k < count; k++) {
          const x = rng.range(bb.x0, bb.x1), z = rng.range(bb.z0, bb.z1);
          if (!F.inPoly(x, z, d.poly)) continue;
          const nr = this.nearestRoad(x, z, 30, e => !e.own);
          if (!nr || nr.e.bridge || !nr.e.k.lanes) continue;
          const off = nr.e.hw + (nr.e.k.side || 0) * 0.5 + 0.8;
          const side = nr.side || 1;
          const px = nr.x + nr.rx * off * side, pz = nr.z + nr.rz * off * side;
          const i = this.oi(px, pz);
          if (i < 0 || O[i] === 3 || O[i] === 2 || !this.offRoad(px, pz, 1, nr.e)) continue;
          const t = rng();
          add(t < 0.45 ? 'bin' : t < 0.75 ? 'kiosk' : 'bench', px, pz, Math.atan2(nr.tx, -nr.tz) + (side > 0 ? -Math.PI / 2 : Math.PI / 2), { smash: t < 0.45 || t >= 0.75, mass: t < 0.45 ? 20 : 60, solid: t >= 0.45 && t < 0.75, kind: F.City.KIOSKS[Math.floor(rng() * F.City.KIOSKS.length)] });
        }
      }
      const trackIds = this.roadIds.bik_track || [];
      for (const id of trackIds) {
        const e = this.edges[id];
        for (let s = 6; s < e.len - 6; s += 9) {
          const p = this.edgePoint(e, s);
          for (const side of [-1, 1]) {
            const off = e.hw + 3.5;
            const x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
            if (this.nearNode(x, z, 14)) continue;
            let clash = false;
            for (const k of [-5, 0, 5]) {
              const qx = x + p.tx * k, qz = z + p.tz * k;
              const other = this.nearestRoad(qx, qz, 14, oe => oe.rid !== 'bik_track');
              if (other && other.d < other.e.hw + 2.5) { clash = true; break; }
            }
            if (clash) continue;
            add('tires', x, z, Math.atan2(p.tx, -p.tz), { solid: true, len: 9 });
          }
        }
      }
      this.resortProps(add);
      this.cityProps(add);
    }

    resortProps(add) {
      const O = this.occ;
      const face = (p, side) => Math.atan2(p.tx, -p.tz) + (side > 0 ? -Math.PI / 2 : Math.PI / 2);
      for (const id of this.roadIds.beach || []) {
        const e = this.edges[id];
        for (let s = 12, k = 0; s < e.len - 12; s += 55, k++) {
          const p = this.edgePoint(e, s);
          const side = this.isWaterAt(p.x + p.rx * 45, p.z + p.rz * 45) ? 1 : this.isWaterAt(p.x - p.rx * 45, p.z - p.rz * 45) ? -1 : 0;
          if (!side) continue;
          const put = (type, off, along, turn, o) => {
            const x = p.x + p.rx * off * side + p.tx * along, z = p.z + p.rz * off * side + p.tz * along;
            const i = this.oi(x, z);
            if (i < 0 || O[i] === 2 || O[i] === 3 || O[i] === 4 || this.isWaterAt(x, z) || !this.offRoad(x, z, 1.5)) return;
            add(type, x, z, face(p, side) + turn, o);
          };
          const kind = k % 6;
          if (kind === 0) {
            put('cafe', e.hw + 6, 0, 0, { solid: true, r: 2.8 });
            for (const [off, along] of [[11, -4.5], [12, 0], [11, 4.5], [14.5, -2.2], [14.5, 2.2]]) put('parasol', e.hw + off, along, 0, { smash: true, mass: 25 });
          } else if (kind === 3) put('lifeguard', e.hw + 15, 0, Math.PI, { solid: true, r: 1.7 });
          else for (let j = -2; j <= 2; j++) put('cabin', e.hw + 5, j * 3.2, 0, { solid: true, r: 0.9 });
        }
      }
      for (const e of this.edges) {
        if (e.name !== 'Юрмала Йомас') continue;
        const off = e.hw + (e.k.side || 0) * 0.55 + 0.6;
        for (let s = 8, k = 0; s < e.len - 8; s += 16, k++) {
          const p = this.edgePoint(e, s);
          if (p.x > -2700 || p.x < -3150) continue;
          const side = k % 2 ? 1 : -1;
          const x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
          const i = this.oi(x, z);
          if (i < 0 || O[i] === 3 || O[i] === 2 || this.nearNode(x, z, 6) || !this.offRoad(x, z, 0.8, e)) continue;
          const t = k % 4;
          add(t === 1 ? 'parasol' : t === 2 ? 'bench' : 'flowers', x, z, face(p, side), { smash: true, mass: t === 1 ? 25 : t === 2 ? 60 : 80 });
        }
      }
    }

    buildFest() {
      const FS = this.map.FEST, y = this.festY === undefined ? this.terrainH(FS.lm[0], FS.lm[1]) : this.festY;
      const cols = this.festCols = [], lane = z => 860 + (-1598 - z) * 0.098;
      const ring = (cx, cz, r) => Array.from({ length: 16 }, (_, k) => [cx + Math.cos(k / 16 * Math.PI * 2) * r, cz + Math.sin(k / 16 * Math.PI * 2) * r]);
      const list = FS.pads.map(pd => {
        const poly = pd.ring ? ring(pd.ring[0], pd.ring[1], pd.ring[2]) : pd.poly;
        return { poly, bb: F.polyBox(poly), surf: pd.surf === 'gravel' ? S.GRAVEL : S.PAVE };
      });
      const all = list.flatMap(p => p.poly), bb = F.polyBox(all);
      this.festPads = { list, x0: bb.x0, x1: bb.x1, z0: bb.z0, z1: bb.z1 };
      const box = (x, z, hx, hz, h, yaw = 0) => cols.push({ k: 'box', x, z, hx, hz, c: Math.cos(yaw), s: Math.sin(yaw), y0: y - 2, y1: y + h });
      const circ = (x, z, r, h) => cols.push({ k: 'circ', x, z, r, y0: y - 2, y1: y + h });
      const seg = (x1, z1, x2, z2, r, h) => cols.push({ k: 'seg', x1, z1, x2, z2, r, y0: y - 2, y1: y + h });
      const st = FS.stage, pit = FS.pit;
      box(st.x, st.z, st.w / 2 + 6, st.d / 2, 24);
      box(FS.foh.x, FS.foh.z, 2.6, 2.1, 4);
      seg(pit.x0, pit.z1, pit.x1, pit.z1, 0.35, 1.3);
      seg(pit.x0, pit.z1, pit.x0, pit.z0, 0.35, 1.3);
      seg(pit.x1, pit.z1, pit.x1, pit.z0, 0.35, 1.3);
      for (const sc of FS.showcase) circ(sc.x, sc.z, 4.6, 1.2);
      seg(FS.backdrop.x - FS.backdrop.w / 2, FS.backdrop.z, FS.backdrop.x + FS.backdrop.w / 2, FS.backdrop.z, 0.6, 8);
      for (const b of FS.booths) box(b.x, b.z, 3.2, 4, 5);
      box(FS.store.x, FS.store.z, 4, 5, 5);
      for (const t of FS.trucks) box(t.x, t.z, 1.3, 3, 3.4, Math.PI / 2);
      for (const zn of FS.zones) {
        seg(zn.x0, zn.z0, zn.x1, zn.z0, 0.35, 1.3); seg(zn.x1, zn.z0, zn.x1, zn.z1, 0.35, 1.3);
        seg(zn.x1, zn.z1, zn.x0, zn.z1, 0.35, 1.3); seg(zn.x0, zn.z1, zn.x0, zn.z0, 0.35, 1.3);
      }
      for (const t of FS.tables) circ(t[0], t[1], 1.3, 2.5);
      box(FS.letters.x, FS.letters.z, 15, 0.9, 5, FS.letters.yaw);
      for (const t of FS.towers) circ(t[0], t[1], 1.1, 18);
      const az = FS.arch, ac = lane(az);
      for (const s of [-1, 1]) circ(ac + s * 12.5, az, 0.9, 10);
      for (const z of FS.festoons) for (const s of [-1, 1]) circ(lane(z) + s * 11.5, z, 0.25, 8);
      for (const z of FS.flags) for (const s of [-1, 1]) {
        const x = lane(z) + s * 9.8;
        this.props.push({ type: 'fflag', x, z, y, yaw: s > 0 ? -Math.PI / 2 : Math.PI / 2, smash: true, mass: 12, theme: 'fest', k: Math.round(z) + s });
      }
      const rng = F.rng(this.seed + 83), ids = F.Cars.CARS.filter(c => !c.barn && c.price < 60000).map(c => c.id);
      const pk = FS.parking;
      this.parked = this.parked || [];
      FS.parking.rows.forEach((rz, r) => {
        for (let x = pk.x0; x <= pk.x1; x += 3.4) {
          if (rng() < 0.35) continue;
          const id = ids[Math.floor(rng() * ids.length)], car = F.Cars.get(id), yaw = r ? Math.PI : 0;
          this.parked.push({ id, x, z: rz, y, yaw, col: rng() < 0.6 ? car.col : F.PAINTS[Math.floor(rng() * F.PAINTS.length)], lot: 'fest' });
          box(x, rz, car.sh.wid / 2 + 0.1, car.sh.len / 2 + 0.1, 1.6, yaw);
        }
      });
      this.festY = y;
    }

    adTheme(x, z) {
      const h = this.map.HUB;
      if (Math.hypot(x - h.x, z - h.z) < 950) return 'fest';
      const d = this.districtAt(x, z);
      if (!d) return 'city';
      if (d.id === 'jurmala') return 'jurmala';
      if (d.id === 'bikernieki') return 'track';
      if (d.style === 'airport') return 'air';
      if (d.style === 'hansa') return 'old';
      if (d.style === 'jugend') return 'centre';
      if (d.style === 'port' || d.style === 'industry') return 'port';
      return 'city';
    }

    buildAds() {
      const rng = F.rng(this.seed + 57), O = this.occ;
      this.ads = [];
      const near = new F.Grid(16);
      for (const p of this.props) near.add(p, p.x - 1, p.z - 1, p.x + 1, p.z + 1);
      const busy = (x, z, r) => near.query(x - r - 1, z - r - 1, x + r + 1, z + r + 1, [], F.stamp()).some(p => Math.hypot(p.x - x, p.z - z) < r);
      const keep = (x, z, r = 1) => near.add({ x, z }, x - r, z - r, x + r, z + r);
      const clear = (x, z, tx, tz, hl, hw, ok) => this.rasterRect(x, z, tx, tz, hl, hw, i => ok(O[i]));
      const land = v => v === 0 || v === 7;
      const walk = v => v === 0 || v === 1 || v === 6 || v === 7;
      const mark = (x, z, tx, tz, hl, hw) => this.rasterRect(x, z, tx, tz, hl, hw, i => { if (O[i] !== 1 && O[i] !== 2) O[i] = 4; });
      const yawTo = (fx, fz) => Math.atan2(fx, -fz);
      const site = o => {
        o.seed = this.ads.length * 7919 + 13;
        o.theme = o.theme || this.adTheme(o.x, o.z);
        if (o.y === undefined) o.y = this.terrainH(o.x, o.z);
        o.cols = o.cols || [];
        this.ads.push(o);
        keep(o.x, o.z, 3);
        return o;
      };
      const circ = (o, x, z, r, h) => o.cols.push({ k: 'circ', x, z, r, y0: o.y - 1, y1: o.y + h });
      const spaced = (kind, x, z, d) => this.ads.some(a => a.kind === kind && Math.abs(a.x - x) < d && Math.abs(a.z - z) < d && Math.hypot(a.x - x, a.z - z) < d);
      for (const e of this.edges) {
        if (e.bridge || e.own || (e.kind !== 'hwy' && e.kind !== 'ave')) continue;
        const big = e.kind === 'hwy';
        for (let s = 60 + rng() * 140; s < e.len - 45; s += (big ? 340 : 280) + rng() * 220) {
          const p = this.edgePoint(e, s), d = this.districtAt(p.x, p.z), style = d ? d.style : 'none';
          if (style === 'hansa' || style === 'jugend' || this.isWaterAt(p.x, p.z)) continue;
          const side = rng() < 0.5 ? -1 : 1, W = big ? 12.4 : 6.8, off = e.hw + (e.k.side || 0) + (big ? 10 : 7.5);
          const x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
          if (this.nearNode(x, z, 12) || !this.offRoad(x, z, W * 0.6) || spaced('bill', x, z, 180) || !clear(x, z, p.tx, p.tz, W * 0.6, 3.2, land)) continue;
          const o = site({ kind: 'bill', big, x, z, yaw: yawTo(-p.rx * side, -p.rz * side), w: W });
          mark(x, z, p.tx, p.tz, W * 0.55, 3);
          const c = Math.cos(o.yaw), sn = Math.sin(o.yaw);
          for (const lx of big ? [-2.6, 2.6] : [0]) circ(o, x + c * lx - sn * 1.65, z + sn * lx + c * 1.65, big ? 0.5 : 0.45, 14);
        }
      }
      const corner = [];
      for (const nd of this.nodes) {
        if (!nd.arms || nd.arms.length < 4 || nd.arms.some(A => A.e.bridge || A.e.own || (A.e.kind !== 'ave' && A.e.kind !== 'str'))) continue;
        const th = this.adTheme(nd.x, nd.z);
        if (th !== 'centre' && th !== 'city' && th !== 'old') continue;
        corner.push(nd);
      }
      corner.sort((a, b) => F.hash2(Math.round(a.x), Math.round(a.z), 3) - F.hash2(Math.round(b.x), Math.round(b.z), 3));
      for (const nd of corner) {
        if (this.ads.filter(a => a.kind === 'tri').length >= 9) break;
        if (spaced('tri', nd.x, nd.z, 450)) continue;
        for (let k = 0; k < nd.arms.length; k++) {
          const A = nd.arms[k], B = nd.arms[(k + 1) % nd.arms.length];
          let bx = Math.cos(A.ang) + Math.cos(B.ang), bz = Math.sin(A.ang) + Math.sin(B.ang);
          const bl = Math.hypot(bx, bz);
          if (bl < 0.4) continue;
          bx /= bl; bz /= bl;
          const r = nd.r + 6, x = nd.x + bx * r, z = nd.z + bz * r;
          if (!this.offRoad(x, z, 3.8) || busy(x, z, 5) || !clear(x, z, -bz, bx, 3.6, 1.2, walk)) continue;
          const o = site({ kind: 'tri', x, z, yaw: yawTo(-bx, -bz) });
          mark(x, z, -bz, bx, 3.4, 1);
          circ(o, x, z, 0.45, 9);
          break;
        }
      }
      const walkSite = (e, s, side, off, test) => {
        const p = this.edgePoint(e, s), x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
        if (this.nearNode(x, z, 14) || this.isWaterAt(x, z) || !this.offRoad(x, z, test) || busy(x, z, 3)) return null;
        return { p, x, z };
      };
      for (const e of this.edges) {
        if (e.bridge || e.own || !e.k.lanes) continue;
        const th = this.adTheme(e.pts[0][0], e.pts[0][1]), sd = e.k.side || 0;
        if (e.kind === 'ave' && sd >= 3 && th !== 'track' && th !== 'air') {
          for (let s = 50 + rng() * 120; s < e.len - 40; s += 320 + rng() * 260) {
            const side = rng() < 0.5 ? -1 : 1, q = walkSite(e, s, side, e.hw + sd - 0.85, 0.3);
            if (!q || spaced('shelter', q.x, q.z, 220)) continue;
            const o = site({ kind: 'shelter', x: q.x, z: q.z, y: q.p.y, yaw: yawTo(-q.p.rx * side, -q.p.rz * side) });
            o.cols.push({ k: 'box', x: q.x, z: q.z, hx: 2.3, hz: 0.7, c: Math.cos(o.yaw), s: Math.sin(o.yaw), y0: o.y - 1, y1: o.y + 3 });
            this.stopExtras(o, q.p, side);
          }
        }
        if ((th === 'old' || th === 'centre' || th === 'jurmala') && sd >= 2.5) {
          for (let s = 30 + rng() * 60; s < e.len - 30; s += 140 + rng() * 120) {
            const side = rng() < 0.5 ? -1 : 1, q = walkSite(e, s, side, e.hw + sd - 0.8, 0.5);
            if (!q || spaced('column', q.x, q.z, 110)) continue;
            const o = site({ kind: 'column', x: q.x, z: q.z, y: q.p.y + 0.14, yaw: yawTo(-q.p.rx * side, -q.p.rz * side) });
            circ(o, q.x, q.z, 0.65, 4);
          }
        }
        if ((th === 'old' || th === 'centre' || (th === 'city' && e.kind === 'ave')) && sd >= 2) {
          for (let s = 25 + rng() * 60; s < e.len - 25; s += (th === 'city' ? 220 : 110) + rng() * 180) {
            const side = rng() < 0.5 ? -1 : 1, q = walkSite(e, s, side, e.hw + Math.min(sd - 0.5, 1.6), 0.4);
            if (!q || spaced('citylight', q.x, q.z, 70)) continue;
            this.ads.push({ kind: 'citylight', x: q.x, z: q.z, y: q.p.y, seed: this.ads.length * 7919 + 13, theme: th, cols: [] });
            keep(q.x, q.z, 2);
            this.props.push({ type: 'citylight', x: q.x, z: q.z, y: q.p.y + 0.15, yaw: Math.atan2(q.p.tx, -q.p.tz), smash: true, mass: 70, ad: this.ads.length * 7919 + 5, theme: th });
          }
        }
      }
      for (const pk of this.map.PARKS) {
        if (!pk.plaza || F.polyArea(pk.poly) < 1500 || this.adTheme(pk.poly[0][0], pk.poly[0][1]) !== 'old') continue;
        const bb = F.polyBox(pk.poly);
        for (let k = 0; k < 6; k++) {
          const x = F.lerp(bb.x0, bb.x1, F.hash2(k, 1, Math.round(bb.x0))), z = F.lerp(bb.z0, bb.z1, F.hash2(k, 2, Math.round(bb.z0)));
          if (!F.inPoly(x, z, pk.poly) || F.polyEdgeDist(x, z, pk.poly) < 2 || !this.offRoad(x, z, 2) || busy(x, z, 4) || spaced('column', x, z, 40) || !clear(x, z, 1, 0, 1, 1, v => v === 6)) continue;
          const o = site({ kind: 'column', x, z, yaw: F.hash2(k, 3, 7) * 6.28 });
          circ(o, x, z, 0.65, 4);
          break;
        }
      }
      const BANNERS = { 'Межапарка проспект': 'fest', 'Густава Земгала': 'fest', 'Ганибу дамбис': 'fest', 'Бривибас': 'fest', 'Бульвар Райня': 'old', 'Бульвар Аспазияс': 'old', 'Набережная 11 Ноября': 'old', 'Юрмала Йомас': 'jurmala', 'Кр. Валдемара': 'centre' };
      let flip = 0;
      for (const p of this.props) {
        if (p.type !== 'lamp') continue;
        const nr = this.nearestRoad(p.x, p.z, 12);
        if (!nr) continue;
        let th = BANNERS[nr.e.name];
        if (!th && this.adTheme(p.x, p.z) === 'old' && F.hash2(Math.round(p.x), Math.round(p.z), 11) < 0.35) th = 'old';
        if (!th) continue;
        p.banner = { theme: th === 'centre' ? 'fest' : th, k: flip++ };
      }
      const SPANS = [['Межапарка проспект', 3], ['Густава Земгала', 1], ['Бривибас', 2], ['Юрмала Йомас', 2], ['Краста', 1], ['Кр. Валдемара', 1], ['Бульвар Аспазияс', 1], ['Калнциема', 1], ['Карла Улманя', 1]];
      for (const [name, count] of SPANS) {
        const list = this.edges.filter(e => e.name === name && !e.bridge && e.len > 70).sort((a, b) => b.len - a.len);
        let n = 0;
        for (const e of list) {
          for (let s = e.len * 0.3; s < e.len - 30 && n < count; s += 60) {
            const p = this.edgePoint(e, s), off = e.hw + (e.k.side || 0) * 0.55 + 0.5;
            const a = [p.x + p.rx * off, p.z + p.rz * off], b = [p.x - p.rx * off, p.z - p.rz * off];
            if (this.nearNode(p.x, p.z, 25) || [a, b].some(q => this.isWaterAt(q[0], q[1]) || !this.offRoad(q[0], q[1], 0.3, e) || busy(q[0], q[1], 1.5))) continue;
            if (spaced('span', p.x, p.z, 260)) continue;
            const o = site({ kind: 'span', x: p.x, z: p.z, y: p.y, yaw: yawTo(p.tx, p.tz), w: off * 2, road: name });
            for (const q of [a, b]) { circ(o, q[0], q[1], 0.25, 9); keep(q[0], q[1], 1.5); }
            n++;
            s += 200;
          }
        }
      }
      for (const id of this.roadIds.bik_track || []) {
        const e = this.edges[id];
        for (let s = 10, k = 0; s < e.len - 10; s += 13, k++) {
          if (k % 3 === 2) continue;
          const p = this.edgePoint(e, s);
          for (const side of [Math.floor(s / 160) % 2 ? 1 : -1]) {
            const off = e.hw + 6.2, x = p.x + p.rx * off * side, z = p.z + p.rz * off * side;
            if (this.nearNode(x, z, 16) || this.isWaterAt(x, z)) continue;
            const other = this.nearestRoad(x, z, 16, oe => oe.rid !== 'bik_track');
            if (other && other.d < other.e.hw + 3) continue;
            const o = site({ kind: 'hoard', x, z, yaw: yawTo(-p.rx * side, -p.rz * side), theme: 'track' });
            o.cols.push({ k: 'seg', x1: x - p.tx * 4, z1: z - p.tz * 4, x2: x + p.tx * 4, z2: z + p.tz * 4, r: 0.3, y0: o.y - 1, y1: o.y + 2 });
          }
        }
      }
      for (const q of this.extraStops || []) {
        const o = site({ kind: 'shelter', x: q.x, z: q.z, y: q.y, yaw: q.yaw });
        o.cols.push({ k: 'box', x: q.x, z: q.z, hx: 2.3, hz: 0.7, c: Math.cos(o.yaw), s: Math.sin(o.yaw), y0: o.y - 1, y1: o.y + 3 });
        this.stopExtras(o, q.p, q.side);
      }
      const roofs = this.buildings.filter(b => b.roof === 'flat' && b.h > 15 && b.poly.length === 4);
      roofs.sort((a, b) => F.hash2(Math.round(a.x), Math.round(a.z), 5) - F.hash2(Math.round(b.x), Math.round(b.z), 5));
      for (const b of roofs) {
        if (this.ads.filter(a => a.kind === 'roof').length >= 26) break;
        const th = this.adTheme(b.x, b.z);
        if (th === 'old' || th === 'jurmala' || th === 'track') continue;
        const nr = this.nearestRoad(b.x, b.z, 70, e => (e.kind === 'ave' || e.kind === 'hwy') && !e.bridge);
        if (!nr || spaced('roof', b.x, b.z, 260)) continue;
        let best = null;
        for (let i = 0; i < 4; i++) {
          const a = b.poly[i], c = b.poly[(i + 1) % 4], l = Math.hypot(c[0] - a[0], c[1] - a[1]);
          if (l < 10) continue;
          const mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2;
          let nx = (c[1] - a[1]) / l, nz = -(c[0] - a[0]) / l;
          if (nx * (mx - b.x) + nz * (mz - b.z) < 0) { nx = -nx; nz = -nz; }
          const dot = nx * (nr.x - mx) + nz * (nr.z - mz);
          if (dot > 0 && (!best || dot > best.dot)) best = { dot, mx, mz, nx, nz, l, tx: (c[0] - a[0]) / l, tz: (c[1] - a[1]) / l };
        }
        if (!best) continue;
        const w = Math.min(18, best.l * 0.78);
        site({ kind: 'roof', x: best.mx - best.nx * 1.6, z: best.mz - best.nz * 1.6, y: b.y + b.h, yaw: yawTo(best.nx, best.nz), w, bd: b.id });
      }
      this.bisAds();
    }

    offRoad(x, z, margin, except = null) {
      const segs = this.segGrid.query(x - 30, z - 30, x + 30, z + 30, [], F.stamp());
      for (const sg of segs) {
        if (sg.e === except) continue;
        const d = F.segDist(x, z, sg.ax, sg.az, sg.bx, sg.bz).d;
        if (d < sg.hw + margin) return false;
      }
      return true;
    }

    nearNode(x, z, extra) {
      for (const nd of this.nodes) {
        if (Math.abs(nd.x - x) > 40 || Math.abs(nd.z - z) > 40) continue;
        if (Math.hypot(nd.x - x, nd.z - z) < nd.r + extra) return nd;
      }
      return null;
    }

    railPath() { return F.resample(F.fillet(this.map.RAIL.line, 150, false), 8); }

    buildRail() {
      const R = this.map.RAIL;
      const pts = this.railPath();
      const ys = pts.map(p => 0.25);
      const s = [0];
      for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      for (let i = 0; i < pts.length; i++) {
        let best = 0;
        for (const br of R.bridges) {
          const q = F.segDist(pts[i][0], pts[i][1], br[0], br[1], br[2], br[3]);
          if (q.d < 20) {
            const L = Math.hypot(br[2] - br[0], br[3] - br[1]);
            const e = Math.min(q.t * L, (1 - q.t) * L);
            best = Math.max(best, 4 * F.smooth(0, 60, e));
          }
        }
        ys[i] = Math.max(this.isWaterAt(pts[i][0], pts[i][1]) ? 4 : 0, best, this.terrainH(pts[i][0], pts[i][1])) + 0.25;
      }
      this.rail = { pts, y: ys, s, len: s[s.length - 1], stations: R.stations };
      for (let i = 0; i + 1 < pts.length; i++) {
        this.rasterSeg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 3.5, k => { if (this.occ[k] === 5) this.occ[k] = 1; });
      }
      this.trees = this.trees.filter(t => {
        for (let i = 0; i + 1 < pts.length; i += 1) {
          if (Math.abs(pts[i][0] - t.x) > 30 && Math.abs(pts[i][1] - t.z) > 30) continue;
          if (F.segDist(t.x, t.z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]).d < 5) return false;
        }
        return true;
      });
    }

    railPoint(s) {
      const r = this.rail;
      s = F.clamp(s, 0, r.len);
      let lo = 0, hi = r.pts.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (r.s[mid] <= s) lo = mid; else hi = mid;
      }
      const a = r.pts[lo], c = r.pts[hi];
      const L = r.s[hi] - r.s[lo] || 1;
      const t = (s - r.s[lo]) / L;
      let tx = c[0] - a[0], tz = c[1] - a[1];
      const l = Math.hypot(tx, tz) || 1;
      return { x: a[0] + (c[0] - a[0]) * t, z: a[1] + (c[1] - a[1]) * t, y: r.y[lo] + (r.y[hi] - r.y[lo]) * t, tx: tx / l, tz: tz / l };
    }

    addCollider(c) {
      this.cols.push(c);
      const grid = this.colGrid;
      const r = c.k === 'box' ? Math.hypot(c.hx, c.hz) : c.k === 'seg' ? 0 : c.r;
      if (c.k === 'seg') grid.add(c, Math.min(c.x1, c.x2) - c.r, Math.min(c.z1, c.z2) - c.r, Math.max(c.x1, c.x2) + c.r, Math.max(c.z1, c.z2) + c.r);
      else grid.add(c, c.x - r, c.z - r, c.x + r, c.z + r);
      return c;
    }

    buildColliders() {
      this.colGrid = new F.Grid(32);
      this.cols = [];
      const add = c => this.addCollider(c);
      for (const bd of this.buildings) add({ k: 'poly', pts: bd.poly, x: bd.x, z: bd.z, r: Math.max(...bd.poly.map(p => Math.hypot(p[0] - bd.x, p[1] - bd.z))), y0: bd.y - 2, y1: bd.y + bd.h, src: bd });
      for (const t of this.trees) add({ k: 'circ', x: t.x, z: t.z, r: t.kind === 'apple' ? 0.3 : 0.45 * t.s, y0: t.y - 2, y1: t.y + 12, src: t });
      for (const p of this.props) {
        if (p.type === 'fence') p.col_ = add({ k: 'smash', x: p.x, z: p.z, r: 1.3, mass: p.mass, y0: p.y - 1, y1: p.y + 2, src: p });
        else if (p.smash) p.col_ = add({ k: 'smash', x: p.x, z: p.z, r: p.r || (p.type === 'kiosk' ? 1.6 : p.type === 'citylight' ? 0.75 : 0.4), mass: p.mass, y0: p.y - 1, y1: p.y + 4, src: p });
        else if (p.type === 'tires') {
          const fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw);
          add({ k: 'seg', x1: p.x - fx * 4.5, z1: p.z - fz * 4.5, x2: p.x + fx * 4.5, z2: p.z + fz * 4.5, r: 0.6, y0: p.y - 1, y1: p.y + 1.5, src: p });
        } else if (p.solid) add({ k: 'circ', x: p.x, z: p.z, r: p.r || (p.type === 'kiosk' ? 1.8 : 0.35), y0: p.y - 1, y1: p.y + 4, src: p });
      }
      for (const a of this.ads || []) for (const c of a.cols) add(Object.assign({ src: a }, c));
      for (const c of this.festCols || []) add(c);
      for (const c of this.cityCols || []) add(c);
      for (const lm of this.landmarks) {
        const d = lm.def;
        if (d.soft) continue;
        if (d.box) add({ k: 'box', x: lm.x, z: lm.z, hx: d.box[0] / 2, hz: d.box[1] / 2, c: Math.cos(lm.yaw), s: Math.sin(lm.yaw), y0: lm.y - 2, y1: lm.y + 200, src: lm });
        else add({ k: 'circ', x: lm.x, z: lm.z, r: d.r, y0: lm.y - 2, y1: lm.y + 400, src: lm });
      }
      for (const e of this.edges) {
        if (!e.bridge) continue;
        for (const lat of [-1, 1]) {
          for (const run of e.walks[lat]) {
            const { pts, ys } = this.slicePath(e, Math.max(run.a.sIn, run.a.sOut), Math.min(run.b.sIn, run.b.sOut));
            for (let i = 0; i + 1 < pts.length; i++) {
              const a = pts[i], c = pts[i + 1], ya = ys[i], yb = ys[i + 1];
              const l = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1, off = (e.hw + 0.5) * lat;
              const ox = -(c[1] - a[1]) / l * off, oz = (c[0] - a[0]) / l * off;
              add({ k: 'seg', x1: a[0] + ox, z1: a[1] + oz, x2: c[0] + ox, z2: c[1] + oz, r: 0.5, y0: Math.min(ya, yb) - 1.4, y1: Math.max(ya, yb) + 1.2, rail: true });
            }
          }
        }
      }
      this.colBuf = [];
    }

    freeSpot(x, z, r, maxR = 80) {
      const ok = (px, pz) => {
        for (let dz = -r; dz <= r; dz += OC) for (let dx = -r; dx <= r; dx += OC) {
          const i = this.oi(px + dx, pz + dz);
          if (i < 0 || (this.occ[i] !== 0 && this.occ[i] !== 6 && this.occ[i] !== 7)) return false;
        }
        return true;
      };
      if (ok(x, z)) return [x, z];
      for (let rad = 3; rad <= maxR; rad += 3) {
        const n = Math.max(8, Math.round(rad * 1.2));
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2;
          const px = x + Math.cos(a) * rad, pz = z + Math.sin(a) * rad;
          if (ok(px, pz)) return [px, pz];
        }
      }
      return null;
    }

    buildHorizon() {
      const EV = F.EV;
      this.ramps = []; this.boards = []; this.barns = []; this.signs = [];
      if (!EV) return;
      for (const st of EV.STUNTS) {
        if (st.kind === 'jump') {
          const nr = this.nearestRoad(st.at[0], st.at[1], 40);
          let x = st.at[0], z = st.at[1], yaw = Math.atan2(st.dir[0], -st.dir[1]), y0 = this.terrainH(x, z);
          if (nr) {
            x = nr.x; z = nr.z; y0 = nr.y;
            const sgn = nr.tx * st.dir[0] + nr.tz * st.dir[1] >= 0 ? 1 : -1;
            yaw = Math.atan2(nr.tx * sgn, -nr.tz * sgn);
          }
          const len = 9, ys = this.ground(x - Math.sin(yaw) * len, z + Math.cos(yaw) * len, y0 + 3);
          this.ramps.push({ id: st.id, x, z, yaw, len, w: 5.5, h: 1.9, y0, ys });
          continue;
        }
        const pos = st.kind === 'trap' ? st.at : st.a;
        const nr = this.nearestRoad(pos[0], pos[1], 60);
        if (!nr) continue;
        let off = nr.e.hw + (nr.e.k.side || 0) + 1.5;
        let sx = nr.x + nr.rx * off, sz = nr.z + nr.rz * off;
        for (let k = 0; k < 6 && !this.offRoad(sx, sz, 1.2); k++) { off += 2; sx = nr.x + nr.rx * off; sz = nr.z + nr.rz * off; }
        if (!this.offRoad(sx, sz, 1.2)) continue;
        const sg = { id: st.id, kind: st.kind, x: sx, z: sz, y: this.terrainH(sx, sz), yaw: Math.atan2(nr.tx, -nr.tz) };
        this.signs.push(sg);
        sg.col = this.addCollider({ k: 'smash', x: sx, z: sz, r: 0.5, mass: 60, y0: -50, y1: 500, sign: st.id });
      }
      for (const b of EV.BOARDS) {
        const p = b.fixed ? b.at : this.freeSpot(b.at[0], b.at[1], 4, 90);
        if (!p) continue;
        const nr = this.nearestRoad(p[0], p[1], 200);
        const yaw = nr ? Math.atan2(nr.x - p[0], -(nr.z - p[1])) : 0;
        const y = this.terrainH(p[0], p[1]);
        const bd = { id: b.id, kind: b.kind, x: p[0], z: p[1], y, yaw };
        bd.col = this.addCollider({ k: 'smash', x: p[0], z: p[1], r: 2.6, mass: 140, y0: y - 2, y1: y + 8, board: b.id });
        this.boards.push(bd);
        this.rasterDisc(p[0], p[1], 3, i => { if (this.occ[i] === 0) this.occ[i] = 4; });
      }
      for (const bf of EV.BARNS) {
        const p = this.freeSpot(bf.at[0], bf.at[1], 7, 120);
        if (!p) continue;
        const nr = this.nearestRoad(p[0], p[1], 200);
        const yaw = nr ? Math.atan2(nr.x - p[0], -(nr.z - p[1])) : 0;
        const y = this.terrainH(p[0], p[1]);
        const fx = Math.sin(yaw), fz = -Math.cos(yaw);
        const barn = { id: bf.id, car: bf.car, x: p[0], z: p[1], y, yaw, door: [p[0] + fx * 6, p[1] + fz * 6] };
        this.barns.push(barn);
        this.addCollider({ k: 'box', x: p[0] - fx * 1.5, z: p[1] - fz * 1.5, hx: 4.5, hz: 3.2, c: Math.cos(yaw), s: Math.sin(yaw), y0: y - 2, y1: y + 6, barn: bf.id });
        this.rasterDisc(p[0], p[1], 7, i => { if (this.occ[i] === 0) this.occ[i] = 4; });
      }
    }

    colliders(x0, z0, x1, z1) {
      this.colBuf.length = 0;
      return this.colGrid.query(x0, z0, x1, z1, this.colBuf, F.stamp());
    }

    terrainH(x, z) {
      if (this.out && (x < this.b.x0 || x > this.b.x1 || z < this.b.z0 || z > this.b.z1)) return this.outTerrain(x, z);
      const fx = (x - this.b.x0) / CS, fz = (z - this.b.z0) / CS;
      const ix = F.clamp(Math.floor(fx), 0, this.nx - 2), iz = F.clamp(Math.floor(fz), 0, this.nz - 2);
      const tx = F.clamp(fx - ix, 0, 1), tz = F.clamp(fz - iz, 0, 1);
      const H = this.h, i = iz * this.nx + ix;
      const a = H[i], c = H[i + 1], d = H[i + this.nx], e = H[i + this.nx + 1];
      return (a * (1 - tx) + c * tx) * (1 - tz) + (d * (1 - tx) + e * tx) * tz;
    }

    surfaceBiome(x, z) {
      const fp = this.festPads;
      if (fp && x > fp.x0 && x < fp.x1 && z > fp.z0 && z < fp.z1) {
        for (const pd of fp.list) if (x > pd.bb.x0 && x < pd.bb.x1 && z > pd.bb.z0 && z < pd.bb.z1 && F.inPoly(x, z, pd.poly)) return pd.surf;
      }
      const ps = this.patchSurf, pi = ps ? this.oi(x, z) : -1;
      if (pi >= 0 && ps[pi]) return ps[pi] - 1;
      const bi = this.biome[this.gi(x, z)];
      switch (bi) {
        case 0: return S.WATER;
        case 1: return S.SAND;
        case 4: return S.DIRT;
        case 5: return S.PAVE;
        case 9: return S.PAVE;
        case 6: return S.GRAVEL;
        case 8: return S.PAVE;
        default: return S.GRASS;
      }
    }

    ground(x, z, yRef = 1e4, withRamps = true) {
      let best = -1e9, surf = -1, edge = null;
      let roadY = -1e9, roadE = null, sideY = -1e9;
      const cell = this.segGrid;
      const k = cell.key(Math.floor(x / cell.cell), Math.floor(z / cell.cell));
      const arr = cell.map.get(k);
      if (arr) {
        let j = 0;
        while (j < arr.length) {
          const e = arr[j].e;
          let cd2 = Infinity, cy = 0, cOn = false;
          for (; j < arr.length && arr[j].e === e; j++) {
            const sg = arr[j];
            const dx = sg.bx - sg.ax, dz = sg.bz - sg.az;
            const l2 = dx * dx + dz * dz;
            let t = l2 > 0 ? ((x - sg.ax) * dx + (z - sg.az) * dz) / l2 : 0;
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            const qx = sg.ax + dx * t - x, qz = sg.az + dz * t - z;
            const d2 = qx * qx + qz * qz;
            const lim = sg.hw + sg.side;
            if (d2 > lim * lim || d2 >= cd2) continue;
            cd2 = d2;
            cy = sg.ay + (sg.by - sg.ay) * t;
            cOn = d2 <= sg.hw * sg.hw;
          }
          if (cd2 === Infinity || cy > yRef + 0.8) continue;
          if (cOn) { if (cy > roadY) { roadY = cy; roadE = e; } }
          else if (cy > sideY) sideY = cy;
        }
      }
      if (roadE && sideY < roadY + STACKED) { best = roadY; surf = roadE.surf; edge = roadE; }
      else if (sideY > -1e9) { best = sideY; surf = S.PAVE; }
      const th = this.terrainH(x, z);
      let res;
      if (surf >= 0 && best > th - 0.4) {
        this.lastSurf = surf;
        this.lastEdge = edge;
        res = edge ? best : Math.max(best, th);
      } else {
        this.lastSurf = this.surfaceBiome(x, z);
        this.lastEdge = null;
        res = th;
      }
      const rs = this.ramps;
      if (rs && withRamps) {
        for (let k = 0; k < rs.length; k++) {
          const rp = rs[k];
          const dx = x - rp.x, dz = z - rp.z;
          if (dx * dx + dz * dz > 110) continue;
          const fx = Math.sin(rp.yaw), fz = -Math.cos(rp.yaw);
          const u = dx * fx + dz * fz, v = -dx * fz + dz * fx;
          if (u < -rp.len || u > 0 || Math.abs(v) > rp.w / 2) continue;
          const h = rp.ys + (rp.y0 + rp.h - rp.ys) * (1 + u / rp.len);
          if (h > res && h <= yRef + 0.2) { res = h; this.lastSurf = S.METAL; }
        }
      }
      return res;
    }

    groundY(x, z) { return this.ground(x, z, 1e4); }

    waterDepth(x, z) {
      if (!this.isWaterAt(x, z)) return 0;
      return Math.max(0, F.WATER_Y - this.terrainH(x, z));
    }

    nearestRoad(x, z, maxD = 60, filter = null) {
      let best = null;
      const segs = this.segGrid.query(x - maxD, z - maxD, x + maxD, z + maxD, [], F.stamp());
      for (const sg of segs) {
        if (filter && !filter(sg.e)) continue;
        const q = F.segDist(x, z, sg.ax, sg.az, sg.bx, sg.bz);
        if (q.d < maxD && (!best || q.d < best.d)) {
          let tx = sg.bx - sg.ax, tz = sg.bz - sg.az;
          const l = Math.hypot(tx, tz) || 1;
          tx /= l; tz /= l;
          const side = (x - q.x) * -tz + (z - q.z) * tx >= 0 ? 1 : -1;
          best = { d: q.d, x: q.x, z: q.z, y: sg.ay + (sg.by - sg.ay) * q.t, e: sg.e, i: sg.i, t: q.t, tx, tz, rx: -tz, rz: tx, side, s: sg.e.s[sg.i] + q.t * (sg.e.s[sg.i + 1] - sg.e.s[sg.i]) };
        }
      }
      return best;
    }

    nearestNode(x, z, filter = null) {
      let best = null, bd = Infinity;
      for (const nd of this.nodes) {
        if (filter && !filter(nd)) continue;
        const d = Math.hypot(nd.x - x, nd.z - z);
        if (d < bd) { bd = d; best = nd; }
      }
      return best;
    }

    route(fromId, toId, pref = null, forbid = null) {
      if (fromId === toId) return [];
      const n = this.nodes.length;
      const g = new Float64Array(n).fill(Infinity);
      const prev = new Int32Array(n).fill(-1);
      const prevE = new Int32Array(n).fill(-1);
      const open = new F.Heap();
      const goal = this.nodes[toId];
      g[fromId] = 0;
      open.push(fromId, 0);
      const cost = e => {
        let c = e.len;
        if (pref) {
          const m = pref[e.kind];
          if (m !== undefined) c *= m;
        }
        return c;
      };
      while (open.size) {
        const cur = open.pop();
        if (cur === toId) break;
        const nd = this.nodes[cur];
        for (const eid of nd.edges) {
          if (forbid && forbid.has(eid)) continue;
          const e = this.edges[eid];
          const nxt = e.a === cur ? e.b : e.a;
          const ng = g[cur] + cost(e);
          if (ng < g[nxt]) {
            g[nxt] = ng; prev[nxt] = cur; prevE[nxt] = eid;
            const gn = this.nodes[nxt];
            open.push(nxt, ng + Math.hypot(gn.x - goal.x, gn.z - goal.z) * (pref ? 0.3 : 1));
          }
        }
      }
      if (prev[toId] < 0) return null;
      const path = [];
      let c = toId;
      while (c !== fromId) {
        const e = this.edges[prevE[c]];
        path.push({ e, dir: e.b === c ? 1 : -1 });
        c = prev[c];
      }
      return path.reverse();
    }

    pathPoints(path, step = 5) {
      const pts = [];
      for (const { e, dir } of path) {
        const n = e.pts.length;
        for (let k = 0; k < n; k++) {
          const i = dir > 0 ? k : n - 1 - k;
          if (pts.length && k === 0) continue;
          pts.push([e.pts[i][0], e.pts[i][1], e.y[i], e.hw, e.surf, e.id]);
        }
      }
      return pts;
    }

    stats() {
      return { nodes: this.nodes.length, edges: this.edges.length, buildings: this.buildings.length, trees: this.trees.length, flora: (this.flora || []).length, props: this.props.length, cols: this.cols.length, parked: (this.parked || []).length, patches: (this.patches || []).length, roadKm: this.edges.reduce((a, e) => a + e.len, 0) / 1000 };
    }
  }

  function sampleY(r, s) {
    if (!r.bridge) return 0.05;
    let i = 0;
    while (i + 1 < r.s.length && r.s[i + 1] < s) i++;
    const L = (r.s[i + 1] ?? r.s[i]) - r.s[i];
    const t = L > 0 ? (s - r.s[i]) / L : 0;
    return r.y[i] + ((r.y[i + 1] ?? r.y[i]) - r.y[i]) * t;
  }

  function blur(src, nx, nz, rad) {
    const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
    const win = rad * 2 + 1;
    for (let iz = 0; iz < nz; iz++) {
      let sum = 0;
      const row = iz * nx;
      for (let k = -rad; k <= rad; k++) sum += src[row + F.clamp(k, 0, nx - 1)];
      for (let ix = 0; ix < nx; ix++) {
        tmp[row + ix] = sum / win;
        sum += src[row + F.clamp(ix + rad + 1, 0, nx - 1)] - src[row + F.clamp(ix - rad, 0, nx - 1)];
      }
    }
    for (let ix = 0; ix < nx; ix++) {
      let sum = 0;
      for (let k = -rad; k <= rad; k++) sum += tmp[F.clamp(k, 0, nz - 1) * nx + ix];
      for (let iz = 0; iz < nz; iz++) {
        out[iz * nx + ix] = sum / win;
        sum += tmp[F.clamp(iz + rad + 1, 0, nz - 1) * nx + ix] - tmp[F.clamp(iz - rad, 0, nz - 1) * nx + ix];
      }
    }
    return out;
  }

  class Heap {
    constructor() { this.k = []; this.p = []; }
    get size() { return this.k.length; }
    push(k, p) {
      const K = this.k, P = this.p;
      K.push(k); P.push(p);
      let i = K.length - 1;
      while (i > 0) {
        const j = (i - 1) >> 1;
        if (P[j] <= P[i]) break;
        [K[i], K[j]] = [K[j], K[i]]; [P[i], P[j]] = [P[j], P[i]];
        i = j;
      }
    }
    pop() {
      const K = this.k, P = this.p;
      const top = K[0];
      const lk = K.pop(), lp = P.pop();
      if (K.length) {
        K[0] = lk; P[0] = lp;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let m = i;
          if (l < K.length && P[l] < P[m]) m = l;
          if (r < K.length && P[r] < P[m]) m = r;
          if (m === i) break;
          [K[i], K[m]] = [K[m], K[i]]; [P[i], P[m]] = [P[m], P[i]];
          i = m;
        }
      }
      return top;
    }
  }
  F.Heap = Heap;

  F.fillPoly = fillPoly;
  F.KINDS = KINDS;
  F.STYLES = STYLES;
  F.LMK = LMK;
  F.World = World;
})(globalThis.Forza = globalThis.Forza || {});
