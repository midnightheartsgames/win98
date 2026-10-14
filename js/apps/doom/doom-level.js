/**
 * Doom 98 — level compiler. Maps are authored as sector polygons; nested polygons carve pits, pillars
 * and platforms out of the polygon that contains them ("innermost polygon wins"). The compiler splits
 * edges at T-junctions, derives one/two-sided linedefs with textures, then builds a BSP tree of convex
 * subsectors and a blockmap, exactly the structures the Doom engine renders and collides against.
 */
(function (D) {
  'use strict';
  const EPS = 1e-6;
  const LF = { UPPER_UNPEGGED: 1, LOWER_UNPEGGED: 2, SECRET: 4, MAPPED: 8, NEVERMAP: 16 };

  function polyArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return a / 2; }
  function pointInPoly(p, x, y) {
    let inside = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function buildLevel(map) {
    const defs = map.sectors;
    const polys = defs.map((def, i) => {
      if (!def.poly || def.poly.length < 3) throw new Error(`${map.id}: sector ${def.id || i} has no polygon`);
      return { def, index: i, pts: def.poly, area: Math.abs(polyArea(def.poly)), sector: -1 };
    });

    // ---- sectors (solid polygons are void pillars)
    const sectors = [];
    for (const p of polys) {
      const d = p.def;
      if (d.solid) continue;
      p.sector = sectors.length;
      const s = {
        index: sectors.length, id: d.id || `s${sectors.length}`, floor: d.floor || 0, ceil: d.ceil != null ? d.ceil : (d.floor || 0) + 128,
        ftex: d.ftex || map.ftex || 'FLOOR4', ctex: d.ctex || map.ctex || 'CEIL3', light: d.light != null ? d.light : (map.light || 160),
        tag: d.tag || null, hurt: d.hurt || 0, secret: !!d.secret, fx: d.fx || null, door: d.door || null, lift: d.lift || null,
        teleport: d.teleport || null, raiseTo: d.raiseTo != null ? d.raiseTo : null, moveSpeed: d.moveSpeed || 0, lines: [], neighbors: [], things: null, soundTarget: null, soundTraversed: 0, validcount: 0,
        bbox: [Infinity, Infinity, -Infinity, -Infinity], special: null
      };
      if (s.door) { s.doorOpen = s.ceil; if (!s.door.open) s.ceil = s.floor; }
      sectors.push(s);
    }

    // ---- vertices & T-junction splitting
    const vkey = (x, y) => `${x},${y}`;
    const vmap = new Map(), verts = [];
    const addV = (x, y) => { const k = vkey(x, y); let i = vmap.get(k); if (i == null) { i = verts.length; verts.push({ x, y }); vmap.set(k, i); } return i; };
    for (const p of polys) for (const [x, y] of p.pts) addV(x, y);
    // spatial hash for "vertex lies on edge" queries
    const CELL = 256, grid = new Map();
    verts.forEach((v, i) => { const k = `${Math.floor(v.x / CELL)},${Math.floor(v.y / CELL)}`; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
    const segMap = new Map();
    for (const p of polys) {
      const n = p.pts.length;
      for (let e = 0; e < n; e++) {
        const a = p.pts[e], b = p.pts[(e + 1) % n];
        const ia = addV(a[0], a[1]), ib = addV(b[0], b[1]);
        if (ia === ib) continue;
        const dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy;
        const on = [];
        const gx0 = Math.floor(Math.min(a[0], b[0]) / CELL), gx1 = Math.floor(Math.max(a[0], b[0]) / CELL);
        const gy0 = Math.floor(Math.min(a[1], b[1]) / CELL), gy1 = Math.floor(Math.max(a[1], b[1]) / CELL);
        for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
          const list = grid.get(`${gx},${gy}`); if (!list) continue;
          for (const vi of list) {
            if (vi === ia || vi === ib) continue;
            const v = verts[vi], cx = v.x - a[0], cy = v.y - a[1];
            if (dx * cy - dy * cx !== 0) continue;
            const t = cx * dx + cy * dy;
            if (t > 0 && t < len2) on.push({ vi, t });
          }
        }
        on.sort((u, w) => u.t - w.t);
        const chain = [ia, ...on.map(o => o.vi), ib];
        for (let k = 0; k + 1 < chain.length; k++) {
          const u = chain[k], w = chain[k + 1], key = u < w ? `${u}_${w}` : `${w}_${u}`;
          let sg = segMap.get(key);
          if (!sg) { sg = { a: Math.min(u, w), b: Math.max(u, w), owners: [] }; segMap.set(key, sg); }
          sg.owners.push({ poly: p, edge: e });
        }
      }
    }

    // ---- which polygon lies on each side of every edge
    const polyBoxes = polys.map(p => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of p.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; });
    function innermost(x, y) {
      let best = null;
      for (let i = 0; i < polys.length; i++) {
        const bb = polyBoxes[i]; if (x < bb[0] || x > bb[2] || y < bb[1] || y > bb[3]) continue;
        const p = polys[i];
        if (pointInPoly(p.pts, x, y) && (!best || p.area <= best.area)) best = p;
      }
      return best;
    }

    const lines = [], sides = [];
    const texOf = (p, key) => p && p.def[key];
    const ownerProps = (sg, poly) => { if (!poly) return null; for (const o of sg.owners) if (o.poly === poly) return (poly.def.edges && poly.def.edges[o.edge]) || null; return null; };
    function sideFor(sg, P, Q, twoSided) {
      const own = ownerProps(sg, P) || {}, other = ownerProps(sg, Q) || {};
      const props = Object.assign({}, other.out || (Q && Q.def.solid) ? other : {}, own.out ? {} : own);
      const d = P.def, wall = props.tex || (Q && Q.def.solid && Q.def.wall) || d.wall || map.wall || 'STARTAN';
      const side = { sector: P.sector, upper: null, lower: null, mid: null, xoff: props.xoff || 0, yoff: props.yoff || 0, props };
      if (!twoSided) side.mid = props.mid || wall;
      else {
        const qd = Q.def;
        side.upper = props.upper || props.tex || (qd.door ? qd.door.tex || 'DOOR1' : null) || qd.outer || d.upper || d.wall || map.wall || 'STARTAN';
        side.lower = props.lower || props.tex || (qd.lift ? qd.lift.tex || 'PLAT1' : null) || qd.outer || d.lower || d.wall || map.wall || 'STARTAN';
        side.mid = props.mid || null;
        if (qd.door && !props.upper && !props.tex) side.above = d.upper || d.wall || map.wall || 'STARTAN';
      }
      return side;
    }

    const segList = [...segMap.values()];
    segList.sort((u, w) => u.a - w.a || u.b - w.b);
    for (const sg of segList) {
      const A = verts[sg.a], B = verts[sg.b];
      const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, nx = -dy / len * 1e-5, ny = dx / len * 1e-5;
      const L = innermost(mx + nx, my + ny), R = innermost(mx - nx, my - ny);
      const ls = L && !L.def.solid ? L : null, rs = R && !R.def.solid ? R : null;
      if (!ls && !rs) continue;
      if (ls && rs && ls.sector === rs.sector) continue;
      // front side = left of v1->v2; orient so the front always exists
      let v1 = sg.a, v2 = sg.b, F = ls, Bk = rs, Fp = L, Bp = R;
      if (!ls) { v1 = sg.b; v2 = sg.a; F = rs; Bk = null; Fp = R; Bp = L; }
      const two = !!(F && Bk);
      const line = { index: lines.length, v1, v2, x1: verts[v1].x, y1: verts[v1].y, x2: verts[v2].x, y2: verts[v2].y, flags: 0, special: null, tag: null, sides: [-1, -1], front: F.sector, back: two ? Bk.sector : -1, validcount: 0 };
      line.dx = line.x2 - line.x1; line.dy = line.y2 - line.y1; line.len = len;
      line.bbox = [Math.min(line.x1, line.x2), Math.min(line.y1, line.y2), Math.max(line.x1, line.x2), Math.max(line.y1, line.y2)];
      const s0 = sideFor(sg, F, two ? Bk : Bp, two); s0.index = sides.length; s0.line = line.index; sides.push(s0); line.sides[0] = s0.index;
      if (two) { const s1 = sideFor(sg, Bk, F, true); s1.index = sides.length; s1.line = line.index; sides.push(s1); line.sides[1] = s1.index; }
      // specials from any owner edge
      for (const o of sg.owners) {
        const pr = o.poly.def.edges && o.poly.def.edges[o.edge]; if (!pr) continue;
        if (pr.special) { line.special = pr.special; line.tag = pr.tag || null; line.key = pr.key || null; line.once = pr.once !== false; line.onoff = pr.onoff || null; }
        if (pr.upeg) line.flags |= LF.UPPER_UNPEGGED;
        if (pr.lpeg) line.flags |= LF.LOWER_UNPEGGED;
        if (pr.secret) line.flags |= LF.SECRET;
        if (pr.hidden) line.flags |= LF.NEVERMAP;
        if (pr.block) line.block = true;
      }
      const fs = sectors[line.front], bs = two ? sectors[line.back] : null;
      if (!two && fs.door) line.flags |= LF.LOWER_UNPEGGED;             // door tracks stay put
      if (two && !line.special) {
        if (bs.door || fs.door) { line.special = 'door'; line.once = false; }
        else if (bs.lift || fs.lift) { line.special = 'liftUse'; line.once = false; }
      }
      if (two && (bs.door || fs.door) && !(fs.door && bs.door)) line.flags |= 0;
      lines.push(line);
      fs.lines.push(line.index); if (bs) bs.lines.push(line.index);
    }
    for (const l of lines) {
      for (const si of [l.front, l.back]) {
        if (si < 0) continue; const s = sectors[si];
        s.bbox[0] = Math.min(s.bbox[0], l.bbox[0]); s.bbox[1] = Math.min(s.bbox[1], l.bbox[1]); s.bbox[2] = Math.max(s.bbox[2], l.bbox[2]); s.bbox[3] = Math.max(s.bbox[3], l.bbox[3]);
      }
      if (l.back >= 0) {
        const a = sectors[l.front], b = sectors[l.back];
        if (!a.neighbors.includes(b.index)) a.neighbors.push(b.index);
        if (!b.neighbors.includes(a.index)) b.neighbors.push(a.index);
      }
    }
    for (const s of sectors) s.center = [(s.bbox[0] + s.bbox[2]) / 2, (s.bbox[1] + s.bbox[3]) / 2];

    // ---- segs (one per visible side) and BSP
    const segs = [];
    for (const l of lines) {
      segs.push({ x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, line: l.index, side: 0, sector: l.front, back: l.back, offset: 0 });
      if (l.back >= 0) segs.push({ x1: l.x2, y1: l.y2, x2: l.x1, y2: l.y1, line: l.index, side: 1, sector: l.back, back: l.front, offset: 0 });
    }
    const subsectors = [];
    const root = bsp(segs, subsectors, 0);

    // ---- blockmap (128-unit cells)
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (const v of verts) { bx0 = Math.min(bx0, v.x); by0 = Math.min(by0, v.y); bx1 = Math.max(bx1, v.x); by1 = Math.max(by1, v.y); }
    const BM = 128, bmx = Math.floor(bx0) - 8, bmy = Math.floor(by0) - 8;
    const bmw = Math.ceil((bx1 - bmx + 8) / BM) + 1, bmh = Math.ceil((by1 - bmy + 8) / BM) + 1;
    const blocks = Array.from({ length: bmw * bmh }, () => []);
    for (const l of lines) {
      const cx0 = Math.floor((l.bbox[0] - bmx) / BM), cx1 = Math.floor((l.bbox[2] - bmx) / BM);
      const cy0 = Math.floor((l.bbox[1] - bmy) / BM), cy1 = Math.floor((l.bbox[3] - bmy) / BM);
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        // exact: does the line pass through this cell (slightly padded)?
        const x0 = bmx + cx * BM - 1, y0 = bmy + cy * BM - 1, x1 = x0 + BM + 2, y1 = y0 + BM + 2;
        if (segBox(l.x1, l.y1, l.x2, l.y2, x0, y0, x1, y1)) blocks[cy * bmw + cx].push(l.index);
      }
    }

    return {
      id: map.id, name: map.name, map, sky: map.sky || 'SKY1', music: map.music || null, par: map.par || 0,
      vertexes: verts, lines, sides, sectors, segs, subsectors, root,
      blockmap: { x: bmx, y: bmy, w: bmw, h: bmh, size: BM, cells: blocks },
      bounds: [bx0, by0, bx1, by1], things: map.things || [], triggers: (map.triggers || []).map((t, i) => ({ index: i, x1: t.a[0], y1: t.a[1], x2: t.b[0], y2: t.b[1], action: t.action, tag: t.tag || null, once: t.once !== false, monsters: !!t.monsters, used: false, dest: t.dest || null, msg: t.msg || null }))
    };
  }

  function segBox(x1, y1, x2, y2, bx0, by0, bx1, by1) {
    // Liang–Barsky clip
    let t0 = 0, t1 = 1; const dx = x2 - x1, dy = y2 - y1;
    const p = [-dx, dx, -dy, dy], q = [x1 - bx0, bx1 - x1, y1 - by0, by1 - y1];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return false; continue; }
      const r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return true;
  }

  // ---------------------------------------------------------------- BSP
  // side of point relative to directed line (x,y,dx,dy): >0 left (front), <0 right (back)
  const sideOf = (px, py, x, y, dx, dy) => dx * (py - y) - dy * (px - x);

  function classify(sg, P) {
    const len = Math.hypot(P.dx, P.dy);
    const a = sideOf(sg.x1, sg.y1, P.x, P.y, P.dx, P.dy) / len, b = sideOf(sg.x2, sg.y2, P.x, P.y, P.dx, P.dy) / len;
    const e = 1e-4;
    const sa = a > e ? 1 : a < -e ? -1 : 0, sb = b > e ? 1 : b < -e ? -1 : 0;
    if (sa === 0 && sb === 0) { // collinear: same direction -> front
      const dot = (sg.x2 - sg.x1) * P.dx + (sg.y2 - sg.y1) * P.dy;
      return dot > 0 ? 1 : -1;
    }
    if (sa >= 0 && sb >= 0) return 1;
    if (sa <= 0 && sb <= 0) return -1;
    return 0; // spans
  }

  function isConvex(list) {
    const sec = list[0].sector;
    for (const s of list) if (s.sector !== sec) return false;
    for (const P of list) {
      const Pl = { x: P.x1, y: P.y1, dx: P.x2 - P.x1, dy: P.y2 - P.y1 };
      for (const Q of list) { if (Q === P) continue; if (classify(Q, Pl) !== 1) return false; }
    }
    return true;
  }

  function splitSeg(sg, P) {
    const dx = sg.x2 - sg.x1, dy = sg.y2 - sg.y1;
    const den = P.dy * dx - P.dx * dy;
    const t = (P.dx * (sg.y1 - P.y) - P.dy * (sg.x1 - P.x)) / den;
    const ix = sg.x1 + dx * t, iy = sg.y1 + dy * t;
    const a = Object.assign({}, sg, { x2: ix, y2: iy });
    const b = Object.assign({}, sg, { x1: ix, y1: iy, offset: sg.offset + Math.hypot(ix - sg.x1, iy - sg.y1) });
    return [a, b];
  }

  function bbox(list) {
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const s of list) { b[0] = Math.min(b[0], s.x1, s.x2); b[1] = Math.min(b[1], s.y1, s.y2); b[2] = Math.max(b[2], s.x1, s.x2); b[3] = Math.max(b[3], s.y1, s.y2); }
    return b;
  }

  function bsp(list, subsectors, depth) {
    if (depth > 200) throw new Error('BSP too deep');
    if (isConvex(list)) {
      const ss = { index: subsectors.length, segs: list, sector: list[0].sector, bbox: bbox(list) };
      subsectors.push(ss);
      return { leaf: ss };
    }
    // pick the partition that splits least and balances best
    const step = Math.max(1, Math.floor(list.length / 48));
    let best = null, bestScore = Infinity;
    for (let i = 0; i < list.length; i += step) {
      const c = list[i], P = { x: c.x1, y: c.y1, dx: c.x2 - c.x1, dy: c.y2 - c.y1 };
      let f = 0, b = 0, sp = 0;
      for (const s of list) { const k = classify(s, P); if (k > 0) f++; else if (k < 0) b++; else sp++; }
      if ((f + sp === 0) || (b + sp === 0)) continue;
      const score = sp * 8 + Math.abs(f - b);
      if (score < bestScore) { bestScore = score; best = P; }
    }
    if (!best) {
      // every candidate leaves one side empty: pick any seg whose line separates something
      for (const c of list) {
        const P = { x: c.x1, y: c.y1, dx: c.x2 - c.x1, dy: c.y2 - c.y1 };
        let f = 0, b = 0; for (const s of list) { const k = classify(s, P); if (k > 0) f++; else if (k < 0) b++; else { f++; b++; } }
        if (f && b) { best = P; break; }
      }
      if (!best) throw new Error('BSP: cannot partition');
    }
    const front = [], back = [];
    for (const s of list) {
      const k = classify(s, best);
      if (k > 0) front.push(s); else if (k < 0) back.push(s);
      else { const [a, b] = splitSeg(s, best); const ka = sideOf(a.x1, a.y1, best.x, best.y, best.dx, best.dy) + sideOf(a.x2, a.y2, best.x, best.y, best.dx, best.dy); if (ka > 0) { front.push(a); back.push(b); } else { back.push(a); front.push(b); } }
    }
    return { x: best.x, y: best.y, dx: best.dx, dy: best.dy, fbox: bbox(front), bbox: bbox(back), front: bsp(front, subsectors, depth + 1), back: bsp(back, subsectors, depth + 1) };
  }

  function locateSubsector(L, x, y) {
    let n = L.root;
    while (!n.leaf) n = sideOf(x, y, n.x, n.y, n.dx, n.dy) >= 0 ? n.front : n.back;
    return n.leaf;
  }
  // Exact sector lookup: BSP leaf, then verify with the leaf region (points outside the map return -1)
  function pointSector(L, x, y) { return locateSubsector(L, x, y).sector; }
  function pointInSectorExact(L, si, x, y) {
    // crossing test over the sector's lines (handles holes)
    let inside = false;
    for (const li of L.sectors[si].lines) {
      const l = L.lines[li];
      if ((l.y1 > y) !== (l.y2 > y) && x < (l.x2 - l.x1) * (y - l.y1) / (l.y2 - l.y1) + l.x1) inside = !inside;
    }
    return inside;
  }

  D.LF = LF; D.buildLevel = buildLevel; D.pointSector = pointSector; D.locateSubsector = locateSubsector; D.pointInSectorExact = pointInSectorExact;
  D.polyArea = polyArea; D.pointInPoly = pointInPoly; D.sideOf = sideOf;
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Doom98 = globalThis.Doom98 || {});
