(function (S) {
  'use strict';
  const M = S.METRICS, H = S.House;
  const STRIDE = 28;
  const AO_ROW = 0.55, AO_WALL = 0.74, AO_FLOOR = 0.76;
  const FASCIA = 0.14, PARAPET = 0.4, ROOF_LIFT = 0.08;
  const MANSARD_LOWER = 1.6, MANSARD_UPPER = 0.25, MANSARD_BREAK = 1;
  const HALF_HIP_SHARE = 0.55, SHED_SLOPE = 0.7, LOWER_ROOF_LIMIT = 0.9;
  const UP = [0, 1, 0];
  const FLAG_DIM = 1, FLAG_SKY = 2;
  const STAIR_RISE = 0.2, RAIL_HEIGHT = 0.9, RAIL_BAND = 0.07, RAIL_INSET = 0.04, BALUSTER = 0.02, SLAB = 0.25;

  const rowOf = (h, style) => (h.rowOf ? h.rowOf[style - 1] : style - 1);
  const aoAt = y => (y >= AO_ROW ? 1 : AO_WALL + (1 - AO_WALL) * y / AO_ROW);

  class Out {
    constructor(h) {
      this.h = h;
      this.f = [];
      this.b = [];
      this.i = [];
      this.n = 0;
      this.flags = 0;
      this.top = -Infinity;
      this.solidStart = 0;
    }

    vert(x, y, z, u, v, n, ao, row, room, layer) {
      this.f.push(x + this.h.x, y, z + this.h.z, u, v);
      this.b.push(Math.round(n[0] * 127), Math.round(n[1] * 127), Math.round(n[2] * 127), Math.round(ao * 255), row, room | (layer << 4), this.flags, 0);
      if (y > this.top) this.top = y;
      return this.n++;
    }

    quad(a, b, c, d) {
      this.i.push(a, b, c, a, c, d);
    }

    tri(a, b, c) {
      this.i.push(a, b, c);
    }

    pack() {
      const data = new ArrayBuffer(this.n * STRIDE), view = new DataView(data);
      for (let v = 0; v < this.n; v++) {
        const o = v * STRIDE;
        for (let k = 0; k < 5; k++) view.setFloat32(o + k * 4, this.f[v * 5 + k], true);
        for (let k = 0; k < 8; k++) {
          const value = this.b[v * 8 + k];
          if (k < 3) view.setInt8(o + 20 + k, value);
          else view.setUint8(o + 20 + k, value);
        }
      }
      return { data, index: new Uint32Array(this.i), vertices: this.n, count: this.i.length, solidStart: this.solidStart, top: this.top };
    }
  }

  const wallFace = (out, ax, az, bx, bz, ya, yb, n, along, row, room, layer, base) => {
    const u0 = ax * along[0] + az * along[1], u1 = bx * along[0] + bz * along[1];
    const splits = ya < AO_ROW && yb > AO_ROW ? [ya, AO_ROW, yb] : [ya, yb];
    for (let s = 0; s < splits.length - 1; s++) {
      const y0 = splits[s], y1 = splits[s + 1], lo = aoAt(y0), hi = aoAt(y1);
      out.quad(
        out.vert(ax, base + y0, az, u0, y0, n, lo, row, room, layer),
        out.vert(bx, base + y0, bz, u1, y0, n, lo, row, room, layer),
        out.vert(bx, base + y1, bz, u1, y1, n, hi, row, room, layer),
        out.vert(ax, base + y1, az, u0, y1, n, hi, row, room, layer)
      );
    }
  };

  const wallPieces = (cut, top) => {
    if (!cut) return [[0, top]];
    const list = [];
    if (cut.y0 > 0) list.push([0, Math.min(cut.y0, top)]);
    if (top > cut.y1) list.push([cut.y1, top]);
    return list;
  };

  const hasCap = (cut, top) => !cut || top > cut.y1 || (cut.y0 > 0 && top <= cut.y0);

  const buildWalls = (out, h, k, view) => {
    const f = h.floors[k], list = H.rooms(h, k), base = H.floorY(h, k), t = M.wallThick / 2, joints = new Map();
    const at = (x, z) => x + z * (h.w + 1);
    const line = seg => (seg.z0 === seg.z1 ? 1 : seg.x0 === seg.x1 ? 2 : seg.z1 > seg.z0 ? 4 : 8);
    for (const seg of f.walls.values()) {
      joints.set(at(seg.x0, seg.z0), (joints.get(at(seg.x0, seg.z0)) || 0) | line(seg));
      joints.set(at(seg.x1, seg.z1), (joints.get(at(seg.x1, seg.z1)) || 0) | line(seg));
    }
    const count = new Map();
    for (const seg of f.walls.values()) {
      count.set(at(seg.x0, seg.z0), (count.get(at(seg.x0, seg.z0)) || 0) + 1);
      count.set(at(seg.x1, seg.z1), (count.get(at(seg.x1, seg.z1)) || 0) + 1);
    }
    const above = k + 1 < h.floors.length && (!view || k + 1 <= view.floor) ? h.floors[k + 1] : null;
    for (const seg of f.walls.values()) {
      const top = H.wallIsLow(h, k, seg, view) ? M.wallLow : M.wall;
      const [ra, rb] = H.sideRooms(h, f, seg), ca = list[ra].color, cb = list[rb].color;
      const dx = seg.x1 - seg.x0, dz = seg.z1 - seg.z0, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
      const o = H.outward(seg), nx = o.x / len, nz = o.z / len, along = [ux, uz];
      const e0 = joints.get(at(seg.x0, seg.z0)) !== line(seg) ? t : 0, e1 = joints.get(at(seg.x1, seg.z1)) !== line(seg) ? t : 0;
      const sx = seg.x0 - ux * e0, sz = seg.z0 - uz * e0, ex = seg.x1 + ux * e1, ez = seg.z1 + uz * e1;
      for (const [ya, yb] of wallPieces(seg.cut, top)) {
        wallFace(out, sx + nx * t, sz + nz * t, ex + nx * t, ez + nz * t, ya, yb, [nx, 0, nz], along, rowOf(h, seg.a), ca, k, base);
        wallFace(out, ex - nx * t, ez - nz * t, sx - nx * t, sz - nz * t, ya, yb, [-nx, 0, -nz], along, rowOf(h, seg.b), cb, k, base);
      }
      if (hasCap(seg.cut, top)) {
        const y = base + top, cap = rowOf(h, h.paints.cap), room = ca;
        out.quad(
          out.vert(sx + nx * t, y, sz + nz * t, sx, sz, UP, 1, cap, room, k),
          out.vert(ex + nx * t, y, ez + nz * t, ex, ez, UP, 1, cap, room, k),
          out.vert(ex - nx * t, y, ez - nz * t, ex, ez, UP, 1, cap, room, k),
          out.vert(sx - nx * t, y, sz - nz * t, sx, sz, UP, 1, cap, room, k)
        );
      }
      if (above && H.wallAt(h, k + 1, seg.x0, seg.z0, seg.x1, seg.z1) && top === M.wall) {
        if (ra === 0) wallFace(out, sx + nx * t, sz + nz * t, ex + nx * t, ez + nz * t, M.wall, M.floorStep, [nx, 0, nz], along, rowOf(h, h.paints.band), 0, k, base);
        if (rb === 0) wallFace(out, ex - nx * t, ez - nz * t, sx - nx * t, sz - nz * t, M.wall, M.floorStep, [-nx, 0, -nz], along, rowOf(h, h.paints.band), 0, k, base);
      }
      for (const [others, px, pz, dir] of [[count.get(at(seg.x0, seg.z0)), seg.x0, seg.z0, -1], [count.get(at(seg.x1, seg.z1)), seg.x1, seg.z1, 1]]) {
        if (others > 1) continue;
        for (const [ya, yb] of wallPieces(seg.cut, top)) {
          wallFace(out, px - nx * t * dir, pz - nz * t * dir, px + nx * t * dir, pz + nz * t * dir, ya, yb, [ux * dir, 0, uz * dir], [nx, nz], rowOf(h, seg.a), ca, k, base);
        }
      }
    }
  };

  const buildFloors = (out, h, k) => {
    const f = h.floors[k], list = H.rooms(h, k), y = H.floorY(h, k), side = h.w + 1, corner = new Uint8Array(side * (h.d + 1));
    for (const seg of f.walls.values()) {
      corner[seg.x0 + seg.z0 * side] = 1;
      corner[seg.x1 + seg.z1 * side] = 1;
    }
    const ao = (x, z) => (corner[x + z * side] ? AO_FLOOR : 1);
    const v = (x, z, shade, row, room) => out.vert(x, y, z, x, z, UP, shade, row, room, k);
    for (let z = 0; z < h.d; z++) {
      for (let x = 0; x < h.w; x++) {
        const cell = (x + z * h.w) * 4, p = f.paint, q = f.tri;
        if (!p[cell] && !p[cell + 1] && !p[cell + 2] && !p[cell + 3]) continue;
        const whole = p[cell] === p[cell + 1] && p[cell] === p[cell + 2] && p[cell] === p[cell + 3] && q[cell] === q[cell + 1] && q[cell] === q[cell + 2] && q[cell] === q[cell + 3];
        if (whole) {
          const row = rowOf(h, p[cell]), room = list[q[cell]].color;
          out.quad(v(x, z, ao(x, z), row, room), v(x + 1, z, ao(x + 1, z), row, room), v(x + 1, z + 1, ao(x + 1, z + 1), row, room), v(x, z + 1, ao(x, z + 1), row, room));
          continue;
        }
        const ends = [[x, z, x + 1, z], [x + 1, z, x + 1, z + 1], [x + 1, z + 1, x, z + 1], [x, z + 1, x, z]];
        for (let t = 0; t < 4; t++) {
          if (!p[cell + t]) continue;
          const row = rowOf(h, p[cell + t]), room = list[q[cell + t]].color, [ax, az, bx, bz] = ends[t];
          out.tri(v(ax, az, ao(ax, az), row, room), v(bx, bz, ao(bx, bz), row, room), v(x + 0.5, z + 0.5, 1, row, room));
        }
      }
    }
  };

  const buildFoundation = (out, h) => {
    if (!h.lift || !h.floors.length) return;
    const f = h.floors[0], t = M.wallThick / 2, inside = H.footprint(h, 0), row = rowOf(h, h.paints.foundation);
    const built = (x, z) => {
      if (x < 0 || z < 0 || x >= h.w || z >= h.d) return false;
      const c = (x + z * h.w) * 4;
      return !!(inside[x + z * h.w] || f.paint[c] || f.paint[c + 1] || f.paint[c + 2] || f.paint[c + 3]);
    };
    const edges = [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1], [-1, 0, 0, 1, 0, 0]];
    for (let z = 0; z < h.d; z++) {
      for (let x = 0; x < h.w; x++) {
        if (!built(x, z)) continue;
        for (const [nx, nz, ax, az, bx, bz] of edges) {
          if (built(x + nx, z + nz)) continue;
          const px = x + ax, pz = z + az, qx = x + bx, qz = z + bz, dx = qx - px, dz = qz - pz;
          const off = H.wallAt(h, 0, px, pz, qx, qz) ? t : 0;
          wallFace(out, px + nx * off - dx * off, pz + nz * off - dz * off, qx + nx * off + dx * off, qz + nz * off + dz * off, 0, h.lift, [nx, 0, nz], [dx, dz], row, 0, 0, h.base);
        }
      }
    }
  };

  const flatQuad = (out, a, b, c, d, n, row, room, layer) => {
    const uvOf = p => (Math.abs(n[1]) > 0.5 ? [p[0], p[2]] : Math.abs(n[0]) > 0.5 ? [p[2], p[1]] : [p[0], p[1]]);
    const put = p => {
      const [u, v] = uvOf(p);
      return out.vert(p[0], p[1], p[2], u, v, n, 1, row, room, layer);
    };
    out.quad(put(a), put(b), put(c), put(d));
  };

  const buildStairs = (out, h, k, view) => {
    const stepCount = Math.round(M.floorStep / STAIR_RISE), run = M.stairRun, rise = M.floorStep / stepCount, stepRun = run / stepCount;
    const list = H.rooms(h, k), f = h.floors[k], base = H.floorY(h, k), wood = rowOf(h, h.paints.stair), trim = rowOf(h, h.paints.trim), block = rowOf(h, h.paints.band);
    for (const stair of h.stairs) {
      if (stair.floor !== k) continue;
      const [dx, dz] = H.STAIR_DIRS[stair.dir], px = -dz, pz = dx, room = list[f.tri[(stair.x + stair.z * h.w) * 4]].color;
      const ox = stair.x + 0.5 - dx * 0.5 - px * 0.5, oz = stair.z + 0.5 - dz * 0.5 - pz * 0.5;
      const at = (s, c, y) => [ox + dx * s + px * c, base + y, oz + dz * s + pz * c];
      const back = [-dx, 0, -dz], side = [px, 0, pz], other = [-px, 0, -pz], w = stair.width;
      for (let i = 0; i < stepCount; i++) {
        const s0 = i * stepRun, s1 = (i + 1) * stepRun, y0 = i * rise, y1 = (i + 1) * rise;
        flatQuad(out, at(s0, 0, y0), at(s0, w, y0), at(s0, w, y1), at(s0, 0, y1), back, trim, room, k);
        flatQuad(out, at(s0, 0, y1), at(s0, w, y1), at(s1, w, y1), at(s1, 0, y1), UP, wood, room, k);
        flatQuad(out, at(s0, 0, 0), at(s1, 0, 0), at(s1, 0, y1), at(s0, 0, y1), other, block, room, k);
        flatQuad(out, at(s0, w, 0), at(s1, w, 0), at(s1, w, y1), at(s0, w, y1), side, block, room, k);
      }
      flatQuad(out, at(run, 0, 0), at(run, w, 0), at(run, w, M.floorStep), at(run, 0, M.floorStep), [dx, 0, dz], block, room, k);
      for (const [c, n] of [[0, other], [w, side]]) {
        const tileX = stair.x + (c === w ? px * (w - 1) : 0), tileZ = stair.z + (c === w ? pz * (w - 1) : 0);
        let walled = true;
        for (let i = 0; i < run && walled; i++) {
          const tx = tileX + dx * i, tz = tileZ + dz * i;
          walled = tileHasWall(h, k, tx, tz, n[0], n[2]);
        }
        if (walled) continue;
        const inset = c === 0 ? RAIL_INSET : c - RAIL_INSET;
        flatQuad(out, at(0, inset, RAIL_HEIGHT - RAIL_BAND), at(run, inset, M.floorStep + RAIL_HEIGHT - RAIL_BAND), at(run, inset, M.floorStep + RAIL_HEIGHT), at(0, inset, RAIL_HEIGHT), n, trim, room, k);
        for (let s = 0.25; s < run; s += 0.5) {
          const y = Math.ceil(s / stepRun) * rise;
          flatQuad(out, at(s - BALUSTER, inset, y), at(s + BALUSTER, inset, y), at(s + BALUSTER, inset, y + RAIL_HEIGHT - RAIL_BAND), at(s - BALUSTER, inset, y + RAIL_HEIGHT - RAIL_BAND), n, trim, room, k);
        }
      }
    }
  };

  const tileHasWall = (h, k, x, z, nx, nz) => {
    if (nz === -1) return !!H.wallAt(h, k, x, z, x + 1, z);
    if (nz === 1) return !!H.wallAt(h, k, x, z + 1, x + 1, z + 1);
    if (nx === 1) return !!H.wallAt(h, k, x + 1, z, x + 1, z + 1);
    return !!H.wallAt(h, k, x, z, x, z + 1);
  };

  const buildStairHoles = (out, h, k) => {
    const list = H.rooms(h, k), f = h.floors[k], y = H.floorY(h, k), trim = rowOf(h, h.paints.trim), holes = new Set();
    for (const stair of h.stairs) {
      if (stair.floor + 1 !== k) continue;
      for (const [x, z] of H.stairTiles(stair)) holes.add(x + z * h.w);
    }
    if (!holes.size) return;
    const exits = new Set();
    for (const stair of h.stairs) {
      if (stair.floor + 1 !== k) continue;
      for (const col of H.stairColumns(stair)) exits.add(col.exit[0] + col.exit[1] * h.w);
    }
    const edges = [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1], [-1, 0, 0, 1, 0, 0]];
    holes.forEach(cell => {
      const x = cell % h.w, z = Math.floor(cell / h.w), room = list[f.tri[cell * 4]].color;
      for (const [nx, nz, ax, az, bx, bz] of edges) {
        const ox = x + nx, oz = z + nz, other = ox + oz * h.w;
        if (holes.has(other)) continue;
        const a = [x + ax, y, z + az], b = [x + bx, y, z + bz], inward = [-nx, 0, -nz];
        flatQuad(out, [a[0], y - SLAB, a[2]], [b[0], y - SLAB, b[2]], b, a, inward, trim, room, k);
        if (exits.has(other) || tileHasWall(h, k, x, z, nx, nz)) continue;
        const dx = b[0] - a[0], dz = b[2] - a[2], top = y + RAIL_HEIGHT, band = top - RAIL_BAND;
        flatQuad(out, [a[0], band, a[2]], [b[0], band, b[2]], [b[0], top, b[2]], [a[0], top, a[2]], inward, trim, room, k);
        for (const s of [0.25, 0.75]) {
          const px = a[0] + dx * s, pz = a[2] + dz * s, wx = dx * BALUSTER, wz = dz * BALUSTER;
          flatQuad(out, [px - wx, y, pz - wz], [px + wx, y, pz + wz], [px + wx, band, pz + wz], [px - wx, band, pz - wz], inward, trim, room, k);
        }
      }
    });
  };

  const grow = (cells, gw, gd, steps) => {
    let cur = cells;
    for (let s = 0; s < steps; s++) {
      const next = cur.slice();
      for (let j = 0; j < gd; j++) {
        for (let i = 0; i < gw; i++) {
          if (cur[i + j * gw]) continue;
          for (let b = -1; b <= 1 && !next[i + j * gw]; b++) {
            for (let a = -1; a <= 1; a++) {
              const p = i + a, q = j + b;
              if (p >= 0 && q >= 0 && p < gw && q < gd && cur[p + q * gw]) {
                next[i + j * gw] = 1;
                break;
              }
            }
          }
        }
      }
      cur = next;
    }
    return cur;
  };

  const chebyshev = (shape, gw, gd) => {
    const nw = gw + 1, nh = gd + 1, d = new Float32Array(nw * nh);
    const cell = (i, j) => i >= 0 && j >= 0 && i < gw && j < gd && shape[i + j * gw];
    for (let j = 0; j < nh; j++) {
      for (let i = 0; i < nw; i++) {
        d[i + j * nw] = cell(i - 1, j - 1) && cell(i, j - 1) && cell(i - 1, j) && cell(i, j) ? 1e6 : 0;
      }
    }
    for (let j = 1; j < nh; j++) {
      for (let i = 1; i < nw; i++) {
        const c = i + j * nw;
        d[c] = Math.min(d[c], d[c - 1] + 1, d[c - nw] + 1, d[c - nw - 1] + 1, i + 1 < nw ? d[c - nw + 1] + 1 : 1e6);
      }
    }
    for (let j = nh - 2; j >= 0; j--) {
      for (let i = nw - 2; i >= 0; i--) {
        const c = i + j * nw;
        d[c] = Math.min(d[c], d[c + 1] + 1, d[c + nw] + 1, d[c + nw + 1] + 1, i > 0 ? d[c + nw - 1] + 1 : 1e6);
      }
    }
    return d;
  };

  const lineDistance = (shape, gw, gd, acrossZ, oneSide) => {
    const nw = gw + 1, nh = gd + 1, d = new Float32Array(nw * nh);
    const cell = (i, j) => i >= 0 && j >= 0 && i < gw && j < gd && shape[i + j * gw];
    const lines = acrossZ ? nw : nh, steps = acrossZ ? nh : nw;
    for (let line = 0; line < lines; line++) {
      const open = s => (acrossZ ? cell(line - 1, s) || cell(line, s) : cell(s, line - 1) || cell(s, line));
      const put = (s, v) => { d[acrossZ ? line + s * nw : s + line * nw] = v; };
      let run = 0;
      const up = new Float32Array(steps);
      for (let s = 1; s < steps; s++) {
        run = open(s - 1) ? run + 1 : 0;
        up[s] = run;
      }
      run = 0;
      for (let s = steps - 2; s >= 0; s--) {
        run = open(s) ? run + 1 : 0;
        put(s, oneSide ? up[s] : Math.min(up[s], run));
      }
      put(steps - 1, oneSide ? up[steps - 1] : 0);
    }
    return d;
  };

  const boundsOf = (mask, w, d) => {
    let x0 = w, x1 = 0, z0 = d, z1 = 0, count = 0;
    for (let z = 0; z < d; z++) {
      for (let x = 0; x < w; x++) {
        if (!mask[x + z * w]) continue;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x + 1);
        z0 = Math.min(z0, z);
        z1 = Math.max(z1, z + 1);
        count++;
      }
    }
    return { x0, x1, z0, z1, sx: x1 - x0, sz: z1 - z0, count };
  };

  const roofHeights = (h, form, shape, gw, gd, over, box) => {
    const nodes = (gw + 1) * (gd + 1), out = new Float32Array(nodes), p = h.roof.pitch, lengthwise = box.sx >= box.sz;
    if (form === 'flat') return out;
    if (form === 'hip' || form === 'mansard' || form === 'pyramid') {
      const d = chebyshev(shape, gw, gd);
      for (let n = 0; n < nodes; n++) {
        const tiles = (d[n] - over) / 2;
        if (form === 'mansard') out[n] = tiles < MANSARD_BREAK ? MANSARD_LOWER * p * tiles : MANSARD_LOWER * p * MANSARD_BREAK + MANSARD_UPPER * p * (tiles - MANSARD_BREAK);
        else out[n] = p * tiles;
      }
      return out;
    }
    if (form === 'shed') {
      const d = lineDistance(shape, gw, gd, lengthwise, true);
      for (let n = 0; n < nodes; n++) out[n] = p * SHED_SLOPE * (d[n] - over) / 2;
      return out;
    }
    const acrossZ = form === 'gableCross' ? !lengthwise : lengthwise;
    const d = lineDistance(shape, gw, gd, acrossZ, false);
    for (let n = 0; n < nodes; n++) out[n] = p * (d[n] - over) / 2;
    if (form === 'halfHip') {
      const along = lineDistance(shape, gw, gd, !acrossZ, false), ridge = p * (acrossZ ? box.sz : box.sx) / 2;
      for (let n = 0; n < nodes; n++) out[n] = Math.min(out[n], ridge * HALF_HIP_SHARE + p * (along[n] - over) / 2);
    }
    return out;
  };

  const slopeUv = (n, x, z) => {
    const s = Math.hypot(n[0], n[1], n[2]) / (Math.abs(n[1]) || 1);
    return Math.abs(n[0]) > Math.abs(n[2]) ? [z, x * s] : [x, z * s];
  };

  const roofNormal = (a, b, c) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, len = Math.hypot(nx, ny, nz) || 1, sign = ny < 0 ? -1 : 1;
    return [nx * sign / len, ny * sign / len, nz * sign / len];
  };

  class RoofFaces {
    constructor(out, row) {
      this.out = out;
      this.row = row;
      this.known = new Map();
    }

    vertex(p, n) {
      const key = p.join() + '|' + n.map(v => Math.round(v * 127)).join();
      let id = this.known.get(key);
      if (id === undefined) {
        const uv = slopeUv(n, p[0], p[2]);
        id = this.out.vert(p[0], p[1], p[2], uv[0], uv[1], n, 1, this.row, 0, 0);
        this.known.set(key, id);
      }
      return id;
    }

    tri(a, b, c) {
      const n = roofNormal(a, b, c);
      this.out.tri(this.vertex(a, n), this.vertex(b, n), this.vertex(c, n));
    }

    quad(a, b, c, d) {
      const n = roofNormal(a, b, d);
      this.out.quad(this.vertex(a, n), this.vertex(b, n), this.vertex(c, n), this.vertex(d, n));
    }
  }

  const pyramidRoof = (out, h, box, base, over, row, trim) => {
    const e = over / 2, x0 = box.x0 - e, x1 = box.x1 + e, z0 = box.z0 - e, z1 = box.z1 + e;
    const low = base - h.roof.pitch * e, apex = [(x0 + x1) / 2, base + h.roof.pitch * (box.sx + box.sz) / 4, (z0 + z1) / 2];
    const corners = [[x0, low, z0], [x1, low, z0], [x1, low, z1], [x0, low, z1]];
    const normals = [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]];
    const faces = new RoofFaces(out, row);
    corners.forEach((p, i) => {
      const q = corners[(i + 1) % 4];
      faces.tri(p, q, apex);
      wallFace(out, p[0], p[2], q[0], q[2], 0, FASCIA, normals[i], [Math.abs(normals[i][2]), Math.abs(normals[i][0])], trim, 0, 0, low - FASCIA);
    });
  };

  const buildRoof = (out, h, k, form) => {
    const mine = H.footprint(h, k), above = H.footprint(h, k + 1), box = boundsOf(mine, h.w, h.d);
    if (!box.count) return;
    let exposed = 0;
    for (let i = 0; i < mine.length; i++) if (mine[i] && !above[i]) exposed++;
    if (!exposed) return;
    const over = form === 'flat' ? 0 : h.roof.over, pad = over + 1, gw = h.w * 2 + pad * 2, gd = h.d * 2 + pad * 2, nw = gw + 1;
    const toCell = (mask, value) => {
      const cells = new Uint8Array(gw * gd);
      for (let z = 0; z < h.d; z++) {
        for (let x = 0; x < h.w; x++) {
          if (!mask[x + z * h.w]) continue;
          for (let b = 0; b < 2; b++) {
            for (let a = 0; a < 2; a++) cells[pad + x * 2 + a + (pad + z * 2 + b) * gw] = value;
          }
        }
      }
      return cells;
    };
    const shape = grow(toCell(mine, 1), gw, gd, over), covered = toCell(above, 1);
    const top = H.floorY(h, k) + M.wall, row = rowOf(h, form === 'flat' ? h.paints.flat : h.roof.style), trim = rowOf(h, h.paints.trim), wallRow = rowOf(h, h.paints.outside);
    const roofForm = form === 'pyramid' && (k !== h.floors.length - 1 || box.count !== box.sx * box.sz) ? 'hip' : form;
    const heights = roofHeights(h, roofForm, shape, gw, gd, over, box);
    if (k !== h.floors.length - 1) {
      for (let n = 0; n < heights.length; n++) heights[n] = Math.min(heights[n], M.wall * LOWER_ROOF_LIMIT);
    }
    const nodeX = i => (i - pad) / 2, nodeZ = j => (j - pad) / 2;
    const at = (i, j) => [nodeX(i), top + ROOF_LIFT + heights[i + j * nw], nodeZ(j)];
    const shown = (i, j) => i >= 0 && j >= 0 && i < gw && j < gd && shape[i + j * gw] && !covered[i + j * gw];
    if (roofForm === 'pyramid') {
      pyramidRoof(out, h, box, top + ROOF_LIFT, over, row, trim);
    } else {
      const faces = new RoofFaces(out, row);
      for (let j = 0; j < gd; j++) {
        for (let i = 0; i < gw; i++) {
          if (!shown(i, j)) continue;
          const ha = heights[i + j * nw], hb = heights[i + 1 + j * nw], hc = heights[i + 1 + (j + 1) * nw], hd = heights[i + (j + 1) * nw];
          if (Math.abs(ha + hc - hb - hd) < 1e-5) {
            faces.quad(at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
          } else if (Math.abs(ha - hc) >= Math.abs(hb - hd)) {
            faces.tri(at(i, j), at(i + 1, j), at(i + 1, j + 1));
            faces.tri(at(i, j), at(i + 1, j + 1), at(i, j + 1));
          } else {
            faces.tri(at(i, j), at(i + 1, j), at(i, j + 1));
            faces.tri(at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
          }
        }
      }
      const sides = [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1], [-1, 0, 0, 1, 0, 0]];
      for (let j = 0; j < gd; j++) {
        for (let i = 0; i < gw; i++) {
          if (!shown(i, j)) continue;
          for (const [nx, nz, ax, az, bx, bz] of sides) {
            const oi = i + nx, oj = j + nz;
            if (oi >= 0 && oj >= 0 && oi < gw && oj < gd && shape[oi + oj * gw]) continue;
            const p = at(i + ax, j + az), q = at(i + bx, j + bz), n = [nx, 0, nz];
            const u0 = p[0] * Math.abs(nz) + p[2] * Math.abs(nx), u1 = q[0] * Math.abs(nz) + q[2] * Math.abs(nx);
            out.quad(
              out.vert(p[0], p[1] - FASCIA, p[2], u0, 0, n, 1, trim, 0, 0),
              out.vert(q[0], q[1] - FASCIA, q[2], u1, 0, n, 1, trim, 0, 0),
              out.vert(q[0], q[1], q[2], u1, FASCIA, n, 1, trim, 0, 0),
              out.vert(p[0], p[1], p[2], u0, FASCIA, n, 1, trim, 0, 0)
            );
          }
        }
      }
    }
    const t = M.wallThick / 2, tileSides = [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1], [-1, 0, 0, 1, 0, 0]];
    for (let z = 0; z < h.d; z++) {
      for (let x = 0; x < h.w; x++) {
        const cell = x + z * h.w;
        if (!mine[cell] || above[cell]) continue;
        for (const [nx, nz, ax, az, bx, bz] of tileSides) {
          const ox = x + nx, oz = z + nz;
          if (ox >= 0 && oz >= 0 && ox < h.w && oz < h.d && mine[ox + oz * h.w]) continue;
          if (roofForm === 'flat') {
            wallFace(out, x + ax + nx * t, z + az + nz * t, x + bx + nx * t, z + bz + nz * t, M.wall, M.wall + PARAPET, [nx, 0, nz], [Math.abs(nz), Math.abs(nx)], wallRow, 0, 0, H.floorY(h, k));
            const y = top + PARAPET;
            out.quad(
              out.vert(x + ax + nx * t, y, z + az + nz * t, x, z, UP, 1, trim, 0, 0),
              out.vert(x + bx + nx * t, y, z + bz + nz * t, x, z, UP, 1, trim, 0, 0),
              out.vert(x + bx - nx * t, y, z + bz - nz * t, x, z, UP, 1, trim, 0, 0),
              out.vert(x + ax - nx * t, y, z + az - nz * t, x, z, UP, 1, trim, 0, 0)
            );
            continue;
          }
          if (roofForm === 'pyramid') continue;
          const ix = pad + (x + ax) * 2, iz = pad + (z + az) * 2, jx = pad + (x + bx) * 2, jz = pad + (z + bz) * 2;
          const mx = (ix + jx) / 2, mz = (iz + jz) / 2, h0 = heights[ix + iz * nw], h1 = heights[mx + mz * nw], h2 = heights[jx + jz * nw];
          const halves = [[x + ax, z + az, (x + ax + x + bx) / 2, (z + az + z + bz) / 2, h0, h1], [(x + ax + x + bx) / 2, (z + az + z + bz) / 2, x + bx, z + bz, h1, h2]];
          for (const [px, pz, qx, qz, hp, hq] of halves) {
            if (hp <= 0.001 && hq <= 0.001) continue;
            const n = [nx, 0, nz], up = Math.abs(nz), side = Math.abs(nx), u0 = px * up + pz * side, u1 = qx * up + qz * side;
            const ux = (qx - px) * 2 * t, uz = (qz - pz) * 2 * t;
            const a = out.vert(px + nx * t - ux, top, pz + nz * t - uz, u0, M.wall, n, 1, wallRow, 0, 0), b = out.vert(qx + nx * t + ux, top, qz + nz * t + uz, u1, M.wall, n, 1, wallRow, 0, 0);
            const c = out.vert(qx + nx * t + ux, top + ROOF_LIFT + hq, qz + nz * t + uz, u1, M.wall + hq, n, 1, wallRow, 0, 0), d = out.vert(px + nx * t - ux, top + ROOF_LIFT + hp, pz + nz * t - uz, u0, M.wall + hp, n, 1, wallRow, 0, 0);
            out.quad(a, b, c, d);
          }
        }
      }
    }
  };

  S.HouseMesh = {
    STRIDE, ROOF_LIFT,

    build(h, view) {
      const out = new Out(h), lastFloor = h.floors.length - 1, last = view ? Math.min(view.floor, lastFloor) : lastFloor;
      const dims = k => (view && k < view.floor && !H.showsRoof(h, view) ? FLAG_DIM : 0);
      for (let k = 0; k <= last; k++) {
        out.flags = dims(k);
        buildFloors(out, h, k);
      }
      out.solidStart = out.i.length;
      out.flags = dims(0);
      buildFoundation(out, h);
      for (let k = 0; k <= last; k++) {
        out.flags = dims(k);
        buildWalls(out, h, k, view);
        buildStairs(out, h, k, view);
        buildStairHoles(out, h, k);
      }
      out.flags = FLAG_SKY;
      if (H.showsRoof(h, view)) {
        for (let k = 0; k <= lastFloor; k++) {
          buildRoof(out, h, k, k === lastFloor ? h.roof.form : h.roof.form === 'flat' ? 'flat' : 'hip');
        }
      }
      return out.pack();
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
