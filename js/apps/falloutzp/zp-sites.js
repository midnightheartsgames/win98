(function (Z) {
  'use strict';

  Z.TERRAIN_EDITS = Z.TERRAIN_EDITS || [];
  Z.TOWN_HOOKS = Z.TOWN_HOOKS || [];
  Z.SITES = [];
  Z.SITE_PIECES = [];
  Z.TOWN_CLEAR = [];
  Z.SITE_DOORS = [];
  Z.SITE_OBJECTS = [];
  Z.SITE_ENTRANCES = [];
  Z.SITE_LIGHTS = [];
  Z.SITE_MARKS = {};
  Z.BRIDGE_SPECS = Z.BRIDGE_SPECS || {};

  const SEG = { wall: 1, fence: 1, picket: 1, palisade: 1, ruinwall: 1, sandbags: 1, wire: 1, pier: 1, deck: 1, arch: 1 };
  const SPLIT = { wall: 1, fence: 1, picket: 1, palisade: 1, ruinwall: 1, sandbags: 1, wire: 1 };
  const BUILDING = { shack: 1, hut: 1, church: 1, kiosk: 1, booth: 1, tower: 1, tent: 1, container: 1, statue: 1, tank: 1 };
  const FOOT = {
    church: [8, 14, 12], tower: [4.4, 9, 4.4], kiosk: [2.8, 2.6, 2.4], booth: [2.2, 2.6, 2.2], container: [2.4, 2.6, 6], tank: [3.6, 4.6, 7.2], statue: [3, 6, 3]
  };

  const frameOf = s => ({ x: s.at[0], z: s.at[1], a: s.rot || 0 });
  const toW = (f, u, v) => [f.x + u * Math.cos(f.a) - v * Math.sin(f.a), f.z + u * Math.sin(f.a) + v * Math.cos(f.a)];
  Z.siteToWorld = (s, u, v) => toW(frameOf(s), u, v);
  Z.siteYaw = (s, yaw) => (yaw || 0) + (s.rot || 0);

  const footOf = p => p.size || FOOT[p.kind] || [4, 3, 4];

  Z.defineSite = s => {
    const f = frameOf(s);
    s.pieces = s.pieces || [];
    const out = [];
    const add = p => { p.site = s.id; out.push(p); Z.SITE_PIECES.push(p); return p; };
    for (const e of s.parts || []) {
      const kind = e[0];
      if (SEG[kind]) {
        const [, u1, v1, u2, v2, o] = e;
        const a = toW(f, u1, v1), b = toW(f, u2, v2);
        if (SPLIT[kind]) {
          const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 5));
          for (let i = 0; i < n; i++) {
            const t0 = i / n, t1 = (i + 1) / n;
            add(Object.assign({ kind, x: Z.lerp(a[0], b[0], t0), z: Z.lerp(a[1], b[1], t0), x2: Z.lerp(a[0], b[0], t1), z2: Z.lerp(a[1], b[1], t1), seg: true }, o || {}));
          }
        } else add(Object.assign({ kind, x: a[0], z: a[1], x2: b[0], z2: b[1], seg: true }, o || {}));
        continue;
      }
      const [, u, v, yaw, o] = e;
      const w = toW(f, u, v);
      const p = add(Object.assign({ kind, x: w[0], z: w[1], yaw: Z.siteYaw(s, yaw) }, o || {}));
      if (BUILDING[kind] && p.pad !== false) {
        const sz = footOf(p);
        Z.TERRAIN_EDITS.push({ t: 'rect', x: p.x, z: p.z, sx: sz[0] + 2.4, sz: sz[2] + 2.4, yaw: p.yaw, soft: p.padSoft || 3.5, cover: p.padCover, y: p.padY });
      }
      if (p.door) {
        const sz = footOf(p), d = typeof p.door === 'string' ? { to: p.door } : p.door;
        const dx = p.doorX || 0, hd = sz[2] / 2;
        const lx = dx, lz = -hd - 0.06;
        const c = Math.cos(p.yaw), sn = Math.sin(p.yaw);
        const wx = p.x + lx * c - lz * sn, wz = p.z + lx * sn + lz * c;
        Z.SITE_DOORS.push(Object.assign({ x: wx, z: wz, yaw: p.yaw, piece: p, site: s.id, name: d.name || p.sign && p.sign.replace(/^[!^~*]/, '') }, d));
      }
      if (p.light) Z.SITE_LIGHTS.push({ x: p.x, z: p.z, dy: p.light.dy || 3, r: p.light.r || 9, c: p.light.c || [1.4, 1.0, 0.6], night: p.light.night !== false, flicker: p.light.flicker });
    }
    for (const c of s.clear || []) {
      if (c.length === 3) { const w = toW(f, c[0], c[1]); Z.TOWN_CLEAR.push({ x: w[0], z: w[1], r: c[2] }); }
      else Z.TOWN_CLEAR.push({ poly: c.map(q => toW(f, q[0], q[1])) });
    }
    for (const e of s.edits || []) {
      const w = toW(f, e.u || 0, e.v || 0);
      Z.TERRAIN_EDITS.push(Object.assign({}, e, { x: w[0], z: w[1], yaw: (e.yaw || 0) + f.a }));
    }
    for (const o of s.objects || []) {
      const w = toW(f, o.u, o.v);
      Z.SITE_OBJECTS.push(Object.assign({}, o, { x: w[0], z: w[1], yaw: Z.siteYaw(s, o.yaw), site: s.id }));
    }
    for (const en of s.entrances || []) Z.SITE_ENTRANCES.push(Object.assign({ site: s.id }, en));
    for (const k in s.marks || {}) { const m = s.marks[k], w = toW(f, m[0], m[1]); Z.SITE_MARKS[k] = { x: w[0], z: w[1], yaw: Z.siteYaw(s, m[2]) }; }
    if (s.loc) {
      const c = s.loc.at ? toW(f, s.loc.at[0], s.loc.at[1]) : [f.x, f.z];
      const arrive = s.loc.arrive ? toW(f, s.loc.arrive[0], s.loc.arrive[1]).concat([Z.siteYaw(s, s.loc.arrive[2])]) : null;
      Z.LOCATIONS.push(Object.assign({ id: s.id, name: s.name, x: c[0], z: c[1], r: 40, xp: 20 }, s.loc, { at: undefined, arrive }));
    }
    s.out = out;
    Z.SITES.push(s);
    return s;
  };

  const inClear = (x, z, pad = 0) => {
    for (const c of Z.TOWN_CLEAR) {
      if (c.r !== undefined) { if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true; }
      else if (Z.pointInPoly(x, z, c.poly)) return true;
    }
    return false;
  };
  Z.inSiteClear = inClear;

  const footprint = p => {
    if (!Z.PIECE_SOLID[p.kind] || !Z.PIECE_SOLID[p.kind](p)) return null;
    const b = Z.pieceBox(p);
    const clears = !!(BUILDING[p.kind] || p.clears);
    if (b.r !== undefined) return { cx: p.x, cz: p.z, r: b.r, clears };
    const c = Math.cos(b.yaw), s = Math.sin(b.yaw), hx = b.sx / 2, hz = b.sz / 2;
    return { cx: b.cx, cz: b.cz, poly: [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([x, z]) => [b.cx + x * c - z * s, b.cz + x * s + z * c]), r: Math.hypot(hx, hz), clears };
  };

  const polysTouch = (A, B) => {
    for (const p of A) if (Z.pointInPoly(p[0], p[1], B)) return true;
    for (const p of B) if (Z.pointInPoly(p[0], p[1], A)) return true;
    return false;
  };

  Z.TOWN_HOOKS.push(town => {
    const map = town.map;
    const pieces = Z.SITE_PIECES.slice();
    for (const p of pieces) {
      if (p.y === undefined) p.y = map.groundH(p.x, p.z) + (p.dy || 0);
      if (p.kind === 'pier' && p.deckY === undefined) p.deckY = Math.max(0.6, map.groundH(p.x, p.z) + 0.6) - p.y;
    }
    const foot = pieces.map(footprint).filter(Boolean);
    const fHash = new Z.SpatialHash(16);
    for (const f of foot) fHash.insert(f, f.cx - f.r, f.cz - f.r, f.cx + f.r, f.cz + f.r);
    const hitsPiece = (x, z, pad) => {
      for (const f of fHash.query(x - pad - 1, z - pad - 1, x + pad + 1, z + pad + 1)) {
        if (f.poly) { if (Z.pointInPoly(x, z, f.poly) || Math.hypot(x - f.cx, z - f.cz) < pad + 0.3) return true; }
        else if (Math.hypot(x - f.cx, z - f.cz) < f.r + pad) return true;
      }
      return false;
    };
    const keepB = b => {
      if (inClear(b.c[0], b.c[1])) return false;
      for (const q of b.poly) if (inClear(q[0], q[1])) return false;
      for (const f of fHash.query(b.box[0], b.box[1], b.box[2], b.box[3])) {
        if (!f.clears) continue;
        if (f.poly ? polysTouch(f.poly, b.poly) : Z.pointInPoly(f.cx, f.cz, b.poly)) return false;
      }
      return true;
    };
    const before = town.buildings.length;
    town.removed = town.buildings.filter(b => !keepB(b));
    town.buildings = town.buildings.filter(keepB);
    town.bHash = new Z.SpatialHash(24);
    for (const b of town.buildings) town.bHash.insert(b, b.box[0] - 1, b.box[1] - 1, b.box[2] + 1, b.box[3] + 1);
    town.trees = town.trees.filter(t => !inClear(t.x, t.z, -2) && !hitsPiece(t.x, t.z, 1.6));
    for (const st of Z.SITE_TREES || []) town.addTree(st.x, st.z, st.sp, Z.rng(Math.round(st.x * 7 + st.z)), st.s);
    town.treeHash = new Z.SpatialHash(16);
    for (const t of town.trees) town.treeHash.insert(t, t.x - 1, t.z - 1, t.x + 1, t.z + 1);
    town.pieces = pieces.concat(Z.buildBridges(map));
    town.siteStats = { removed: before - town.buildings.length, pieces: town.pieces.length };
    town.entrances = Z.SITE_ENTRANCES.map(en => Z.resolveEntrance(town, en)).filter(Boolean);
  });

  Z.resolveEntrance = (town, en) => {
    const map = town.map;
    let b = town.buildingAt(en.at[0], en.at[1], 0);
    if (!b) { let bd = 30; for (const c of town.bHash.query(en.at[0] - 30, en.at[1] - 30, en.at[0] + 30, en.at[1] + 30)) { const d = Math.hypot(c.c[0] - en.at[0], c.c[1] - en.at[1]); if (d < bd) { bd = d; b = c; } } }
    if (!b) return null;
    let best = null;
    for (let i = 0; i < b.poly.length; i++) {
      const p = b.poly[i], q = b.poly[(i + 1) % b.poly.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (L < 2.4) continue;
      const nx = (q[1] - p[1]) / L, nz = -(q[0] - p[0]) / L;
      let mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2;
      if (en.face) { const fl = Math.hypot(en.face[0], en.face[1]); const score = -(nx * en.face[0] + nz * en.face[1]) / fl * 10 - L * 0.02; if (!best || score < best.score) best = { score, mx, mz, nx, nz }; continue; }
      const probe = [mx + nx * 6, mz + nz * 6];
      const rd = map.roadAt(probe[0], probe[1]) ? 0 : 1;
      const d = Math.hypot(mx - en.at[0], mz - en.at[1]);
      const score = rd * 40 + d - L * 0.1;
      if (!best || score < best.score) best = { score, mx, mz, nx, nz };
    }
    if (!best) return null;
    const yaw = Math.atan2(best.nx, -best.nz);
    return Object.assign({}, en, { b, x: best.mx + best.nx * 0.06, z: best.mz + best.nz * 0.06, yaw, y: b.base });
  };

  Z.buildBridges = map => {
    const out = [];
    for (const r of map.roads) {
      if (!r.bridge || r.pts.length < 2) continue;
      const spec = Z.BRIDGE_SPECS[r.name] || Z.BRIDGE_SPECS['@' + Math.round(r.pts[0][0]) + ',' + Math.round(r.pts[0][1])] || {};
      if (spec.skip) continue;
      const L = Z.polyLen(r.pts);
      if (L < 3) continue;
      const end = (pt, nb) => { const dx = pt[0] - nb[0], dz = pt[1] - nb[1], l = Math.hypot(dx, dz) || 1; let h = -99; for (const k of [1, 3, 6]) h = Math.max(h, map.groundH(pt[0] + dx / l * k, pt[1] + dz / l * k)); return h; };
      const yA = Math.max(0.5, end(r.pts[0], r.pts[1])) + (r.k === 'F' ? 0.05 : 0.12);
      const yB = Math.max(0.5, end(r.pts[r.pts.length - 1], r.pts[r.pts.length - 2])) + (r.k === 'F' ? 0.05 : 0.12);
      const camber = spec.camber !== undefined ? spec.camber : Math.min(4, L * 0.02);
      const yAt = s => { const t = s / L; let y = Z.lerp(yA, yB, t) + Math.sin(t * Math.PI) * camber; return y; };
      let s0 = 0;
      const step = spec.pierStep || 26;
      for (let i = 1; i < r.pts.length; i++) {
        const a = r.pts[i - 1], b = r.pts[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len < 0.2) { s0 += len; continue; }
        const gap = spec.gap && s0 + len > spec.gap[0] && s0 < spec.gap[1];
        if (!gap) out.push({ kind: 'deck', x: a[0], z: a[1], x2: b[0], z2: b[1], y: 0, y0: yAt(s0), y1: yAt(s0 + len), w: r.w * (spec.wMul || 1) + 1, thick: spec.thick || (r.k === 'F' ? 0.4 : 1.2), rail: true, mat: r.k === 'F' ? 'wood' : 'asphalt', bridge: r.name || 'мост', walk: true });
        if (!spec.noPiers) for (let s = Math.ceil((s0 + 0.01) / step) * step; s < s0 + len; s += step) {
          if (s < 5 || s > L - 5) continue;
          const t = (s - s0) / len, x = Z.lerp(a[0], b[0], t), z = Z.lerp(a[1], b[1], t);
          const top = yAt(s) - (spec.thick || 1.2), bot = Math.min(map.groundH(x, z), 0) - 1.5;
          if (top - bot < 2) continue;
          out.push({ kind: 'box', x, z, y: bot, yaw: Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2, size: [r.w * 0.7, top - bot, 2.4], mat: 'concrete', tint: [128, 126, 120], uvs: 0.3 });
        }
        s0 += len;
      }
      if (spec.arch) {
        const a = r.pts[0], b = r.pts[r.pts.length - 1];
        const t0 = spec.arch[0], t1 = spec.arch[1];
        const ax = Z.lerp(a[0], b[0], t0), az = Z.lerp(a[1], b[1], t0), bx = Z.lerp(a[0], b[0], t1), bz = Z.lerp(a[1], b[1], t1);
        out.push({ kind: 'arch', x: ax, z: az, x2: bx, z2: bz, y: 0, base: spec.archBase === undefined ? -2 : spec.archBase, rise: spec.archRise || 20, top: spec.archTop !== undefined ? spec.archTop : yAt(L * (t0 + t1) / 2) - 1.3, w: r.w + 1 });
      }
      if (spec.tier2) {
        const T2 = spec.tier2, sa = T2.from * L, sb = T2.to * L;
        let acc = 0;
        for (let i = 1; i < r.pts.length; i++) {
          const a = r.pts[i - 1], b = r.pts[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const c0 = Math.max(sa, acc), c1 = Math.min(sb, acc + len);
          if (c1 > c0 + 0.2) {
            const ta = (c0 - acc) / len, tb = (c1 - acc) / len;
            const pa = [Z.lerp(a[0], b[0], ta), Z.lerp(a[1], b[1], ta)], pb = [Z.lerp(a[0], b[0], tb), Z.lerp(a[1], b[1], tb)];
            out.push({ kind: 'deck', x: pa[0], z: pa[1], x2: pb[0], z2: pb[1], y: 0, y0: yAt(c0) - T2.drop, y1: yAt(c1) - T2.drop, w: T2.w, thick: 1.0, rail: true, mat: T2.mat || 'railbed', bridge: (r.name || 'мост') + ' (нижний ярус)', walk: true, tier: 2 });
            const ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len;
            for (let s2 = Math.ceil(c0 / 12) * 12; s2 < c1; s2 += 12) {
              const t = (s2 - acc) / len, x = Z.lerp(a[0], b[0], t), z = Z.lerp(a[1], b[1], t), lo = yAt(s2) - T2.drop, hi = yAt(s2) - 1.2;
              for (const sd of [-1, 1]) out.push({ kind: 'box', x: x - uz * sd * (T2.w / 2 - 0.4), z: z + ux * sd * (T2.w / 2 - 0.4), y: lo, yaw: 0, size: [0.6, hi - lo, 0.6], mat: 'concrete', tint: [140, 136, 128], uvs: 0.3 });
            }
          }
          acc += len;
        }
      }
    }
    return out;
  };

  if (Z.Scene) Z.Scene.prototype.extraStatic = function () {
    for (const p of this.town.pieces || []) Z.buildPieceMesh(this.chunkFor(p.x, p.z).mb, p);
    for (const en of this.town.entrances || []) if (en.sign) {
      const s = { kind: 'sign', x: en.x + Math.sin(en.yaw) * 0.04, z: en.z - Math.cos(en.yaw) * 0.04, yaw: en.yaw, y: en.y, y0: en.signY || 2.6, w: en.signW || 3.6, hh: en.signH || 0.6, text: en.sign, posts: false };
      Z.buildPieceMesh(this.chunkFor(s.x, s.z).mb, s);
    }
    this.uploadSigns();
  };

  Z.EXTERIOR_BUILDERS.push((g, cell) => {
    const town = g.town, cw = cell.cw;
    Z.addPieceColliders(cw, (town.pieces || []).filter(p => !p.ghost));
    for (const p of town.pieces || []) {
      if (p.kind === 'deck' && p.walk) {
        const dx = p.x2 - p.x, dz = p.z2 - p.z, L = Math.hypot(dx, dz) || 1, lx = -dz / L * p.w / 2, lz = dx / L * p.w / 2;
        const poly = [[p.x - lx, p.z - lz], [p.x2 - lx, p.z2 - lz], [p.x2 + lx, p.z2 + lz], [p.x + lx, p.z + lz]];
        if (Z.polyArea(poly) < 0) poly.reverse();
        const k = (p.y1 - p.y0) / L;
        cw.addFloor(poly, p.y + p.y0, { deck: p }, { x: p.x, z: p.z, gx: dx / L * k, gz: dz / L * k });
        if (p.rail !== false) for (const s of [-1, 1]) {
          const ox = lx * s * 0.98, oz = lz * s * 0.98;
          const r = cw.addBox((p.x + p.x2) / 2 + ox, (p.z + p.z2) / 2 + oz, L, 0.14, Math.atan2(dz, dx), Math.min(p.y0, p.y1) + p.y - 0.3, Math.max(p.y0, p.y1) + p.y + 1.0, { rail: p });
          r.noRay = true;
        }
      }
      if (p.kind === 'pier') {
        const dx = p.x2 - p.x, dz = p.z2 - p.z, L = Math.hypot(dx, dz) || 1, w = (p.w || 2.4) / 2, lx = -dz / L * w, lz = dx / L * w;
        const poly = [[p.x - lx, p.z - lz], [p.x2 - lx, p.z2 - lz], [p.x2 + lx, p.z2 + lz], [p.x + lx, p.z + lz]];
        if (Z.polyArea(poly) < 0) poly.reverse();
        cw.addFloor(poly, p.y + p.deckY, { pier: p });
      }
    }
    cell.marks = cell.marks || {};
    const addDoor = d => {
      const y = d.y !== undefined ? d.y : (d.piece ? d.piece.y : cw.groundAt(d.x, d.z, 200));
      const ob = g.addObject(cell, { id: 'door_' + d.to, type: 'door', x: d.x, z: d.z, y, yaw: d.yaw, to: d.to, mark: d.mark || 'A', name: d.name || 'Дверь', dest: d.dest || '', lock: d.lock || 0, key: d.key, mat: d.mat, tint: d.tint, noCollide: true });
      ob.ext = true;
      cell.marks['door_' + d.to] = { x: d.x + Math.sin(d.yaw) * 1.6, z: d.z - Math.cos(d.yaw) * 1.6, y, yaw: d.yaw };
      return ob;
    };
    for (const d of Z.SITE_DOORS) addDoor(d);
    for (const en of town.entrances || []) if (en.to) addDoor(Object.assign({}, en, { piece: null }));
    for (const k in Z.SITE_MARKS) cell.marks[k] = Z.SITE_MARKS[k];
    Z.SITE_OBJECTS.forEach((o, i) => {
      const ob = g.addObject(cell, Object.assign({ id: o.site + '_' + o.type + '_' + i }, o));
      if (ob.T.door && ob.to) cell.marks['door_' + ob.to] = { x: ob.x + Math.sin(ob.yaw) * 1.6, z: ob.z - Math.cos(ob.yaw) * 1.6, y: ob.y, yaw: ob.yaw };
    });
    cell.lights = cell.lights || [];
    for (const l of Z.SITE_LIGHTS) cell.lights.push({ x: l.x, y: cw.groundAt(l.x, l.z, 200) + l.dy, z: l.z, r: l.r, c: l.c, night: l.night, flicker: l.flicker });
  });

  Z.NAV_HOOKS = Z.NAV_HOOKS || [];
  Z.NAV_HOOKS.push((g, nav) => {
    const town = g.town;
    const block = (x, z) => { const i = nav.idx(x, z); if (i >= 0) nav.w[i] = 0; };
    for (const p of town.pieces || []) {
      if (p.ghost) continue;
      if (p.kind === 'deck' && p.walk) {
        if (p.tier === 2) continue;
        const dx = p.x2 - p.x, dz = p.z2 - p.z, L = Math.hypot(dx, dz);
        const n = Math.ceil(L / 1), m = Math.max(1, Math.floor(p.w / 2 / 1.2));
        for (let i = 0; i <= n; i++) for (let k = -m; k <= m; k++) {
          const t = i / n, x = p.x + dx * t - dz / L * k * 1.2, z = p.z + dz * t + dx / L * k * 1.2;
          const j = nav.idx(x, z);
          if (j < 0) continue;
          nav.w[j] = 1 | 8;
          nav.h[j] = p.y + Z.lerp(p.y0, p.y1, t);
        }
        continue;
      }
      if (p.kind === 'pier') {
        const dx = p.x2 - p.x, dz = p.z2 - p.z, L = Math.hypot(dx, dz);
        for (let s = 0; s <= L; s += 1) { const j = nav.idx(p.x + dx * s / L, p.z + dz * s / L); if (j >= 0) { nav.w[j] = 1 | 4 | 8; nav.h[j] = p.y + p.deckY; } }
        continue;
      }
      const solid = Z.PIECE_SOLID[p.kind];
      if (!solid || !solid(p)) continue;
      const b = Z.pieceBox(p);
      if (b.r !== undefined) { for (let x = p.x - b.r; x <= p.x + b.r; x += 1) for (let z = p.z - b.r; z <= p.z + b.r; z += 1) if (Math.hypot(x - p.x, z - p.z) <= b.r + 0.3) block(x, z); continue; }
      const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
      for (let u = -b.sx / 2 - 0.3; u <= b.sx / 2 + 0.3; u += 0.8) for (let v = -b.sz / 2 - 0.3; v <= b.sz / 2 + 0.3; v += 0.8) block(b.cx + u * c - v * s, b.cz + u * s + v * c);
    }
  });
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
