(function (Z) {
  'use strict';

  const CV = Z.COVER;
  const BLAST = [430, -820];

  const STYLE = {
    stalin: { fac: 'stalin', ground: 'stalinGround', floorH: 3.6, mod: 3.4, plain: 'plasterCream', roof: 'flat', parapet: 0.9, cornice: true, tints: [[128, 128, 128], [134, 126, 116], [138, 120, 112], [124, 130, 118], [136, 132, 112]] },
    low: { fac: 'stalin', ground: 'stalin', floorH: 3.3, mod: 3.2, plain: 'plasterCream', roof: 'gable', parapet: 0, tints: [[136, 128, 116], [140, 120, 116], [126, 132, 124], [132, 132, 132]] },
    khrushRed: { fac: 'khrushRed', ground: 'khrushRed', floorH: 2.8, mod: 2.9, plain: 'brickRed', roof: 'flat', parapet: 0.5, tints: [[128, 128, 128], [122, 124, 126]] },
    khrushWhite: { fac: 'khrushWhite', ground: 'khrushWhite', floorH: 2.8, mod: 2.9, plain: 'brickWhite', roof: 'flat', parapet: 0.5, tints: [[128, 128, 128], [124, 126, 128]] },
    khrushPanel: { fac: 'panel', ground: 'panel', floorH: 2.8, mod: 3.0, plain: 'panel', roof: 'flat', parapet: 0.5, tints: [[128, 128, 128], [126, 128, 132], [132, 128, 120]] },
    panel: { fac: 'panel', ground: 'panel', floorH: 2.8, mod: 3.0, plain: 'panel', roof: 'flat', parapet: 0.8, tints: [[128, 128, 128], [130, 126, 120], [120, 128, 134]] },
    modern: { fac: 'modern', ground: 'modern', floorH: 3.8, mod: 3.6, plain: 'plasterWhite', roof: 'flat', parapet: 0.7, tints: [[128, 128, 128], [130, 128, 122]] },
    industrial: { fac: 'industrial', ground: 'industrial', floorH: 5.0, mod: 6.0, plain: 'concrete', roof: 'flat', parapet: 0.6, tints: [[128, 128, 128], [122, 120, 118], [130, 124, 120]] },
    house: { fac: 'house', ground: 'house', floorH: 3.0, mod: 3.0, plain: 'plasterWhite', roof: 'gable', parapet: 0, tints: [[128, 128, 128], [134, 130, 126], [124, 128, 132]] },
    garage: { fac: null, ground: null, floorH: 2.7, mod: 3.0, plain: 'concrete', roof: 'flat', parapet: 0.2, tints: [[128, 128, 128], [120, 120, 118]] }
  };
  Z.BSTYLE = STYLE;

  class Town {
    constructor(map, seed = 77) {
      this.map = map;
      this.seed = seed;
      this.avenue = [];
      for (const r of map.roads) if (r.name === 'проспект Ленина' && !r.bridge) for (let i = 1; i < r.pts.length; i++) this.avenue.push([r.pts[i - 1], r.pts[i]]);
      this.buildings = map.buildings.map(b => this.styleOf(b));
      this.bHash = new Z.SpatialHash(24);
      for (const b of this.buildings) this.bHash.insert(b, b.box[0] - 1, b.box[1] - 1, b.box[2] + 1, b.box[3] + 1);
      this.trees = [];
      this.treeHash = new Z.SpatialHash(16);
      this.placeTrees();
      for (const fn of Z.TOWN_HOOKS || []) fn(this);
    }

    nearAvenue(x, z) {
      let d = Infinity;
      for (const [a, b] of this.avenue) { const q = Z.segDist(x, z, a[0], a[1], b[0], b[1]).d; if (q < d) d = q; }
      return d;
    }

    styleOf(b) {
      const h = (k) => Z.hash2(b.osm % 100003, k, this.seed);
      const area = Math.abs(Z.polyArea(b.poly));
      const obb = Z.obb(b.poly);
      let L = b.levels || 0;
      let style;
      const av = this.nearAvenue(b.c[0], b.c[1]);
      switch (b.type) {
        case 'h': style = 'house'; L = 1; break;
        case 'g': style = 'garage'; L = 1; break;
        case 'i': style = 'industrial'; L = Z.clamp(L || (area > 900 ? 2 : 1), 1, 4); break;
        case 's': style = h(1) < 0.5 ? 'modern' : 'khrushWhite'; L = Z.clamp(L || 3, 2, 4); break;
        case 'm': style = 'modern'; L = Z.clamp(L || 4, 2, 9); break;
        case 'r': style = 'low'; L = Z.clamp(L || 2, 1, 3); break;
        default: {
          if (!L) L = b.type === 'p' ? 3 : 5;
          if (av < 42 && L >= 3) { style = 'stalin'; L = Z.clamp(L, 4, 8); }
          else if (L >= 9) style = 'panel';
          else if (L <= 3) style = L <= 2 && area < 400 ? 'low' : (h(2) < 0.5 ? 'low' : 'khrushRed');
          else if (L >= 6 && L <= 8) style = h(3) < 0.6 ? 'stalin' : 'panel';
          else style = ['khrushRed', 'khrushWhite', 'khrushPanel'][Math.floor(h(4) * 3)];
          if (b.type === 'p' && area > 1400 && style !== 'stalin') { style = 'modern'; L = Z.clamp(L, 2, 6); }
        }
      }
      const S = STYLE[style];
      L = Math.min(L, style === 'panel' ? 16 : 12);
      const db = Math.hypot(b.c[0] - BLAST[0], b.c[1] - BLAST[1]);
      let damage = Z.clamp(0.18 + h(5) * 0.45 + Z.smooth(900, 150, db) * 0.4, 0, 1);
      if (!b.inside) damage = Z.clamp(damage + 0.15, 0, 1);
      const ruin = style !== 'garage' && style !== 'house' && damage > 0.72 && h(6) < 0.75;
      const tint = S.tints[Math.floor(h(7) * S.tints.length)];
      const gable = S.roof === 'gable' && obb && area / obb.area > 0.82 && obb.wid < 16;
      const floorH = S.floorH * (style === 'industrial' && area > 1500 ? 1.4 : 1);
      const height = L * floorH;
      return Object.assign({}, b, {
        style, S, floors: L, floorH, height, obb, area, damage, ruin, tint,
        seed: Math.floor(h(8) * 255), gable, shop: style === 'stalin' && av < 30,
        base: b.ground, top: b.ground + height
      });
    }

    buildingAt(x, z, pad = 0) {
      for (const b of this.bHash.at(x, z)) {
        if (x < b.box[0] - pad || x > b.box[2] + pad || z < b.box[1] - pad || z > b.box[3] + pad) continue;
        if (pad > 0) {
          if (Z.pointInPoly(x, z, b.poly)) return b;
          for (let i = 0; i < b.poly.length; i++) {
            const p = b.poly[i], q = b.poly[(i + 1) % b.poly.length];
            if (Z.segDist(x, z, p[0], p[1], q[0], q[1]).d < pad) return b;
          }
        } else if (Z.pointInPoly(x, z, b.poly)) return b;
      }
      return null;
    }

    treeSpecies(x, z, k, R) {
      const m = this.map, dw = m.distWater[m.cellIndex(x, z)] || 999;
      if (Math.hypot(x - BLAST[0], z - BLAST[1]) < 520 && R() < 0.55) return 'dead';
      if (R() < 0.07) return 'dead';
      if (dw < 14 || k === CV.wetland) return R() < 0.75 ? 'willow' : 'poplar';
      if (k === CV.wood) { const r = R(); return r < 0.5 ? 'oak' : r < 0.72 ? 'acacia' : r < 0.84 ? 'pine' : r < 0.94 ? 'maple' : 'poplar'; }
      if (k === CV.urban || k === CV.park || k === CV.cemetery) { const r = R(); return r < 0.35 ? 'chestnut' : r < 0.6 ? 'acacia' : r < 0.8 ? 'poplar' : 'maple'; }
      if (k === CV.garden) return R() < 0.7 ? 'apricot' : 'acacia';
      return R() < 0.5 ? 'acacia' : 'oak';
    }

    treeOK(x, z, r = 1.6) {
      const m = this.map;
      const k = m.cellIndex(x, z);
      if (k < 0 || m.cover[k] === CV.water || m.roadMask[k]) return false;
      if (m.groundH(x, z) < 0.25) return false;
      const n = m.normal(x, z);
      if (n[1] < 0.8) return false;
      if (this.buildingAt(x, z, r)) return false;
      for (const t of this.treeHash.at(x, z)) if (Math.hypot(t.x - x, t.z - z) < r * 1.4) return false;
      return true;
    }

    addTree(x, z, sp, R, scale) {
      const t = { x, z, y: this.map.groundH(x, z), sp, s: scale || (0.75 + R() * 0.5), yaw: R() * Math.PI * 2, tint: Math.floor(R() * 255) };
      this.trees.push(t);
      this.treeHash.insert(t, x - 1, z - 1, x + 1, z + 1);
    }

    placeTrees() {
      const m = this.map, R = Z.rng(this.seed * 31 + 5);
      const P = { [CV.wood]: 0.62, [CV.park]: 0.22, [CV.urban]: 0.035, [CV.scrub]: 0.1, [CV.wetland]: 0.08, [CV.grass]: 0.012, [CV.none]: 0.006, [CV.sand]: 0.004, [CV.cemetery]: 0.18, [CV.garden]: 0.16, [CV.pitch]: 0.0, [CV.field]: 0.002, [CV.industrial]: 0.012, [CV.rock]: 0.02 };
      const step = 4.2;
      for (let z = m.z0 + 2; z < m.z1 - 2; z += step) for (let x = m.x0 + 2; x < m.x1 - 2; x += step) {
        const jx = x + (R() - 0.5) * step * 0.9, jz = z + (R() - 0.5) * step * 0.9;
        const k = m.coverAt(jx, jz);
        const p = P[k] || 0;
        if (!p || R() > p) continue;
        if (!this.treeOK(jx, jz)) continue;
        this.addTree(jx, jz, this.treeSpecies(jx, jz, k, R), R);
      }
      for (const r of m.roads) {
        if (r.bridge || !(r.k === 'P' || r.k === 'S' || r.k === 'T')) continue;
        const L = Z.polyLen(r.pts);
        for (let s = 4; s < L; s += 9 + R() * 4) {
          const p = Z.alongPoly(r.pts, s);
          for (const side of [-1, 1]) {
            const off = r.w / 2 + 2.6;
            const x = p.x - p.dz * off * side, z = p.z + p.dx * off * side;
            const k = m.coverAt(x, z);
            if (k !== CV.urban && k !== CV.park && k !== CV.none && k !== CV.grass) continue;
            if (R() < 0.3 || !this.treeOK(x, z, 2.2)) continue;
            const sp = R() < 0.45 ? 'poplar' : R() < 0.6 ? 'chestnut' : 'acacia';
            this.addTree(x, z, Math.hypot(x - BLAST[0], z - BLAST[1]) < 480 && R() < 0.5 ? 'dead' : sp, R, sp === 'poplar' ? 0.95 + R() * 0.3 : 0);
          }
        }
      }
    }

    treesNear(x, z, r) {
      const out = [];
      this.treeHash.query(x - r, z - r, x + r, z + r).forEach(t => { if (Math.hypot(t.x - x, t.z - z) <= r) out.push(t); });
      return out;
    }
  }

  Z.Town = Town;
  Z.TREE_SPECIES = ['oak', 'acacia', 'pine', 'maple', 'poplar', 'willow', 'chestnut', 'apricot', 'dead'];
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
