(function (Q) {
  'use strict';
  const SURF_EPS = 0.125;
  const ON_EPS = 0.05;
  const C = Q.CONTENTS;

  Q.MATS = {
    sky: { sky: true, nomarks: true, noimpact: true },
    clip: { nodraw: true, nomarks: true },
    nodraw: { nodraw: true, nomarks: true },
    lava: { liquid: 'lava', nomarks: true, fullbright: true },
    slime: { liquid: 'slime', nomarks: true, fullbright: true },
    lightpanel: { fullbright: true, nomarks: true },
    lightblue: { fullbright: true, nomarks: true },
    lightred: { fullbright: true, nomarks: true },
    jumppad: { fullbright: true, nomarks: true },
    glass: { nomarks: true },
    grate: { metal: true },
    techfloor: { metal: true },
    metal: { metal: true },
    rust: { metal: true }
  };
  const NOINFO = {};
  Q.matInfo = name => Q.MATS[name] || NOINFO;

  function baseWinding(n, d) {
    let x = 0, max = -1;
    for (let i = 0; i < 3; i++) { const v = Math.abs(n[i]); if (v > max) { max = v; x = i; } }
    let vup = x === 2 ? [1, 0, 0] : [0, 0, 1];
    const v = Q.vdot(vup, n);
    vup = Q.vnorm(Q.vma(vup, -v, n));
    const org = Q.vscale(n, d);
    const vright = Q.vcross(vup, n);
    const S = 131072;
    const up = Q.vscale(vup, S), rt = Q.vscale(vright, S);
    return [
      Q.vadd(Q.vsub(org, rt), up),
      Q.vadd(Q.vadd(org, rt), up),
      Q.vsub(Q.vadd(org, rt), up),
      Q.vsub(Q.vsub(org, rt), up)
    ];
  }

  function clipWinding(w, n, d) {
    const dists = new Array(w.length), sides = new Array(w.length);
    let front = 0, back = 0;
    for (let i = 0; i < w.length; i++) {
      const dd = Q.vdot(w[i], n) - d;
      dists[i] = dd;
      if (dd > ON_EPS) { sides[i] = 1; front++; } else if (dd < -ON_EPS) { sides[i] = -1; back++; } else sides[i] = 0;
    }
    if (!front) return w;
    if (!back) return null;
    const out = [];
    for (let i = 0; i < w.length; i++) {
      const p = w[i];
      if (sides[i] === 0) { out.push(p); continue; }
      if (sides[i] === -1) out.push(p);
      const j = (i + 1) % w.length;
      if (sides[j] === 0 || sides[j] === sides[i]) continue;
      const t = dists[i] / (dists[i] - dists[j]);
      const q = w[j];
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]);
    }
    return out.length >= 3 ? out : null;
  }
  Q.clipWinding = clipWinding;

  const snap = v => { const r = Math.round(v); return Math.abs(v - r) < 0.002 ? r : Math.round(v * 1000) / 1000; };

  function makeBrush(planes, contents, id) {
    const faces = [];
    const mins = [Infinity, Infinity, Infinity], maxs = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < planes.length; i++) {
      const p = planes[i];
      let w = baseWinding(p.n, p.d);
      for (let j = 0; j < planes.length && w; j++) {
        if (j === i) continue;
        const q = planes[j];
        if (Q.vdot(q.n, p.n) > 0.999 && Math.abs(q.d - p.d) < 0.01) { if (j < i) w = null; continue; }
        w = clipWinding(w, q.n, q.d);
      }
      if (!w) continue;
      w = w.map(v => [snap(v[0]), snap(v[1]), snap(v[2])]);
      const e1 = Q.vsub(w[1], w[0]), e2 = Q.vsub(w[2], w[0]);
      if (Q.vdot(Q.vcross(e1, e2), p.n) < 0) w.reverse();
      faces.push({ plane: i, verts: w });
      for (const v of w) for (let k = 0; k < 3; k++) { if (v[k] < mins[k]) mins[k] = v[k]; if (v[k] > maxs[k]) maxs[k] = v[k]; }
    }
    if (!faces.length) return null;
    const all = planes.slice();
    const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let k = 0; k < 3; k++) {
      for (const s of [1, -1]) {
        const n = Q.vscale(axes[k], s), d = s > 0 ? maxs[k] : -mins[k];
        if (!all.some(p => Q.vdot(p.n, n) > 0.9999 && Math.abs(p.d - d) < 0.01)) all.push({ n, d, mat: planes[0].mat, bevel: true });
      }
    }
    return { id, planes: all, faces, mins, maxs, contents };
  }

  function buildBVH(boxes) {
    const nodes = [];
    function rec(list) {
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      for (const b of list) for (let k = 0; k < 3; k++) { if (b.min[k] < min[k]) min[k] = b.min[k]; if (b.max[k] > max[k]) max[k] = b.max[k]; }
      const idx = nodes.length;
      const node = { min, max, left: -1, right: -1, items: null };
      nodes.push(node);
      if (list.length <= 3) { node.items = list.map(b => b.i); return idx; }
      let axis = 0;
      const ext = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
      if (ext[1] > ext[axis]) axis = 1;
      if (ext[2] > ext[axis]) axis = 2;
      list.sort((a, b) => (a.min[axis] + a.max[axis]) - (b.min[axis] + b.max[axis]));
      const mid = list.length >> 1;
      node.left = rec(list.slice(0, mid));
      node.right = rec(list.slice(mid));
      return idx;
    }
    if (boxes.length) rec(boxes);
    return nodes;
  }
  Q.buildBVH = buildBVH;

  function segBox(s, d, fmax, bmin, bmax) {
    let t0 = 0, t1 = fmax;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-9) {
        if (s[i] < bmin[i] || s[i] > bmax[i]) return false;
        continue;
      }
      let a = (bmin[i] - s[i]) / d[i], b = (bmax[i] - s[i]) / d[i];
      if (a > b) { const t = a; a = b; b = t; }
      if (a > t0) t0 = a;
      if (b < t1) t1 = b;
      if (t0 > t1) return false;
    }
    return true;
  }

  const ZERO = [0, 0, 0];

  class World {
    constructor(def, B) {
      this.def = def;
      this.id = def.id;
      this.brushes = B.brushes;
      this.ents = B.ents;
      this.lights = B.lights;
      this.decos = B.decos;
      this.decals = B.decals;
      this.bvh = buildBVH(this.brushes.map((b, i) => ({ i, min: b.mins, max: b.maxs })));
      this.stamp = 1;
      this.brushStamp = new Uint32Array(this.brushes.length);
      this.mins = [Infinity, Infinity, Infinity];
      this.maxs = [-Infinity, -Infinity, -Infinity];
      for (const b of this.brushes) {
        for (let k = 0; k < 3; k++) { this.mins[k] = Math.min(this.mins[k], b.mins[k]); this.maxs[k] = Math.max(this.maxs[k], b.maxs[k]); }
      }
      this.spawns = this.ents.filter(e => e.type === 'spawn');
      this.items = this.ents.filter(e => e.type === 'item');
      this.pads = this.ents.filter(e => e.type === 'jumppad');
      this.teles = this.ents.filter(e => e.type === 'teleport');
      this.hurts = this.ents.filter(e => e.type === 'hurt');
      this.intermission = this.ents.find(e => e.type === 'intermission') || { pos: [0, 0, 128], yaw: 0, pitch: 0 };
      this.buildFaces();
    }

    query(min, max, fn) {
      const nodes = this.bvh;
      if (!nodes.length) return;
      const stack = [0];
      while (stack.length) {
        const n = nodes[stack.pop()];
        if (n.min[0] > max[0] || n.max[0] < min[0] || n.min[1] > max[1] || n.max[1] < min[1] || n.min[2] > max[2] || n.max[2] < min[2]) continue;
        if (n.items) { for (const i of n.items) fn(this.brushes[i], i); continue; }
        stack.push(n.left, n.right);
      }
    }

    pointInBrush(p, b, eps) {
      for (const pl of b.planes) if (Q.vdot(p, pl.n) - pl.d > eps) return false;
      return true;
    }

    buildFaces() {
      const faces = [];
      for (let bi = 0; bi < this.brushes.length; bi++) {
        const b = this.brushes[bi];
        for (const f of b.faces) {
          const pl = b.planes[f.plane];
          const info = Q.matInfo(pl.mat);
          if (info.nodraw) continue;
          if (info.liquid && pl.n[2] < 0.7) continue;
          const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
          const c = [0, 0, 0];
          for (const v of f.verts) { for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], v[k]); max[k] = Math.max(max[k], v[k]); c[k] += v[k] / f.verts.length; } }
          let covered = false;
          if (!info.liquid) {
            this.query(min, max, (o, oi) => {
              if (covered || oi === bi || o.contents !== C.SOLID || o.noCover) return;
              if (Q.matInfo(o.planes[0].mat).nodraw && !o.coverAll) return;
              if (f.verts.every(v => this.pointInBrush(v, o, 0.1)) && this.pointInBrush(c, o, 0.1)) covered = true;
            });
          }
          if (covered) continue;
          let area = 0;
          for (let i = 1; i + 1 < f.verts.length; i++) area += Q.vlen(Q.vcross(Q.vsub(f.verts[i], f.verts[0]), Q.vsub(f.verts[i + 1], f.verts[0]))) / 2;
          if (area < 0.5) continue;
          faces.push({ id: faces.length, brush: bi, plane: f.plane, n: pl.n, d: pl.d, mat: pl.mat, verts: f.verts, min, max, center: c, area, uv: b.uv || ZERO });
        }
      }
      this.faces = faces;
    }

    trace(start, end, mins, maxs, mask) {
      mins = mins || ZERO; maxs = maxs || ZERO;
      mask = mask === undefined ? C.SOLID : mask;
      const tw = { fraction: 1, startSolid: false, allSolid: false, normal: null, dist: 0, brush: -1, plane: -1, mat: null, contents: 0, endpos: null };
      const d = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
      const nodes = this.bvh;
      if (nodes.length) {
        const stamp = ++this.stamp;
        const stack = [0];
        const emin = [0, 0, 0], emax = [0, 0, 0];
        while (stack.length) {
          const n = nodes[stack.pop()];
          for (let k = 0; k < 3; k++) { emin[k] = n.min[k] - maxs[k] - 1; emax[k] = n.max[k] - mins[k] + 1; }
          if (!segBox(start, d, tw.fraction, emin, emax)) continue;
          if (n.items) {
            for (const i of n.items) {
              if (this.brushStamp[i] === stamp) continue;
              this.brushStamp[i] = stamp;
              const b = this.brushes[i];
              if (!(b.contents & mask)) continue;
              this.traceBrush(tw, b, i, start, end, mins, maxs);
              if (tw.allSolid) break;
            }
            if (tw.allSolid) break;
            continue;
          }
          stack.push(n.left, n.right);
        }
      }
      tw.endpos = tw.fraction === 1 ? [end[0], end[1], end[2]] : [start[0] + d[0] * tw.fraction, start[1] + d[1] * tw.fraction, start[2] + d[2] * tw.fraction];
      return tw;
    }

    traceBrush(tw, b, bi, start, end, mins, maxs) {
      let enter = -1, leave = 1, clip = -1, getsOut = false, startsOut = false;
      const planes = b.planes;
      for (let i = 0; i < planes.length; i++) {
        const p = planes[i], n = p.n;
        const dist = p.d - ((n[0] < 0 ? maxs[0] : mins[0]) * n[0] + (n[1] < 0 ? maxs[1] : mins[1]) * n[1] + (n[2] < 0 ? maxs[2] : mins[2]) * n[2]);
        const d1 = start[0] * n[0] + start[1] * n[1] + start[2] * n[2] - dist;
        const d2 = end[0] * n[0] + end[1] * n[1] + end[2] * n[2] - dist;
        if (d2 > 0) getsOut = true;
        if (d1 > 0) startsOut = true;
        if (d1 > 0 && (d2 >= SURF_EPS || d2 >= d1)) return;
        if (d1 <= 0 && d2 <= 0) continue;
        if (d1 > d2) {
          const f = (d1 - SURF_EPS) / (d1 - d2);
          if (f > enter) { enter = f; clip = i; }
        } else {
          const f = (d1 + SURF_EPS) / (d1 - d2);
          if (f < leave) leave = f;
        }
      }
      if (!startsOut) {
        tw.startSolid = true;
        if (!getsOut) { tw.allSolid = true; tw.fraction = 0; tw.contents = b.contents; tw.brush = bi; }
        return;
      }
      if (enter < leave && enter > -1 && enter < tw.fraction) {
        if (enter < 0) enter = 0;
        const p = planes[clip];
        tw.fraction = enter;
        tw.normal = p.n;
        tw.dist = p.d;
        tw.brush = bi;
        tw.plane = clip;
        tw.mat = p.bevel ? this.nearestMat(b, p.n) : p.mat;
        tw.contents = b.contents;
      }
    }

    nearestMat(b, n) {
      let best = null, bd = -2;
      for (const p of b.planes) { if (p.bevel) continue; const d = Q.vdot(p.n, n); if (d > bd) { bd = d; best = p.mat; } }
      return best;
    }

    pointContents(p) {
      let c = 0;
      this.query(p, p, b => { if (this.pointInBrush(p, b, 0)) c |= b.contents; });
      return c;
    }

    testBox(origin, mins, maxs, mask) {
      const t = this.trace(origin, origin, mins, maxs, mask === undefined ? Q.MASK_PLAYER : mask);
      return t.startSolid || t.allSolid;
    }

    groundZ(x, y, zTop, zMin) {
      const t = this.trace([x, y, zTop], [x, y, zMin === undefined ? zTop - 4096 : zMin], ZERO, ZERO, C.SOLID);
      return t.fraction < 1 ? t.endpos[2] : null;
    }

    visible(a, b) {
      return this.trace(a, b, ZERO, ZERO, Q.MASK_OPAQUE).fraction >= 0.999;
    }
  }
  Q.World = World;

  class Builder {
    constructor(def) {
      this.def = def;
      this.brushes = [];
      this.ents = [];
      this.lights = [];
      this.decos = [];
      this.decals = [];
    }

    addPlanes(planes, o) {
      const contents = o.contents !== undefined ? o.contents : o.clip ? C.PLAYERCLIP : C.SOLID;
      const b = makeBrush(planes, contents, this.brushes.length);
      if (!b) return null;
      if (o.uv) b.uv = o.uv;
      if (o.noCover) b.noCover = true;
      if (o.coverAll) b.coverAll = true;
      this.brushes.push(b);
      return b;
    }

    matFor(n, mat, o) {
      if (o.clip) return 'clip';
      if (n[2] > 0.7) return o.top || mat;
      if (n[2] < -0.7) return o.bottom || mat;
      return o.side || mat;
    }

    prism(axis, poly, lo, hi, mat, o) {
      o = o || {};
      const to3 = axis === 'z' ? (u, v, w) => [u, v, w] : axis === 'x' ? (u, v, w) => [w, u, v] : (u, v, w) => [u, w, v];
      const ax = axis === 'z' ? [0, 0, 1] : axis === 'x' ? [1, 0, 0] : [0, 1, 0];
      let cu = 0, cv = 0;
      for (const p of poly) { cu += p[0] / poly.length; cv += p[1] / poly.length; }
      const planes = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        let nu = b[1] - a[1], nv = -(b[0] - a[0]);
        const l = Math.hypot(nu, nv);
        if (l < 1e-6) continue;
        nu /= l; nv /= l;
        if (nu * (cu - a[0]) + nv * (cv - a[1]) > 0) { nu = -nu; nv = -nv; }
        const n = to3(nu, nv, 0).map(x => (Math.abs(x) < 1e-9 ? 0 : x));
        const d = Q.vdot(n, to3(a[0], a[1], 0));
        planes.push({ n, d, mat: this.matFor(n, mat, o) });
      }
      const top = ax, bot = Q.vscale(ax, -1).map(x => x || 0);
      planes.push({ n: top, d: hi, mat: this.matFor(top, mat, o) });
      planes.push({ n: bot, d: -lo, mat: this.matFor(bot, mat, o) });
      return this.addPlanes(planes, o);
    }

    box(x0, y0, z0, x1, y1, z1, mat, o) {
      return this.prism('z', [[Math.min(x0, x1), Math.min(y0, y1)], [Math.max(x0, x1), Math.min(y0, y1)], [Math.max(x0, x1), Math.max(y0, y1)], [Math.min(x0, x1), Math.max(y0, y1)]], Math.min(z0, z1), Math.max(z0, z1), mat, o);
    }

    clip(x0, y0, z0, x1, y1, z1) {
      return this.box(x0, y0, z0, x1, y1, z1, 'clip', { clip: true });
    }

    ramp(x0, y0, x1, y1, zb, zlo, zhi, dir, mat, o) {
      const X0 = Math.min(x0, x1), X1 = Math.max(x0, x1), Y0 = Math.min(y0, y1), Y1 = Math.max(y0, y1);
      const alongX = dir === 'x+' || dir === 'x-';
      const rising = dir === 'x+' || dir === 'y+';
      const u0 = alongX ? X0 : Y0, u1 = alongX ? X1 : Y1;
      const za = rising ? zlo : zhi, zc = rising ? zhi : zlo;
      const poly = [[u0, zb], [u1, zb]];
      if (zc > zb + 0.01) poly.push([u1, zc]);
      if (za > zb + 0.01) poly.push([u0, za]);
      return alongX ? this.prism('y', poly, Y0, Y1, mat, o) : this.prism('x', poly, X0, X1, mat, o);
    }

    stairs(x0, y0, x1, y1, z0, z1, dir, n, mat, o) {
      const X0 = Math.min(x0, x1), X1 = Math.max(x0, x1), Y0 = Math.min(y0, y1), Y1 = Math.max(y0, y1);
      const h = (z1 - z0) / n;
      for (let i = 0; i < n; i++) {
        const top = z0 + h * (i + 1);
        const f = i / n;
        if (dir === 'x+') this.box(X0 + (X1 - X0) * f, Y0, z0, X1, Y1, top, mat, o);
        else if (dir === 'x-') this.box(X0, Y0, z0, X1 - (X1 - X0) * f, Y1, top, mat, o);
        else if (dir === 'y+') this.box(X0, Y0 + (Y1 - Y0) * f, z0, X1, Y1, top, mat, o);
        else this.box(X0, Y0, z0, X1, Y1 - (Y1 - Y0) * f, top, mat, o);
      }
      if (n < 2 || (o && o.noRamp)) return;
      const alongX = dir[0] === 'x';
      const L = alongX ? X1 - X0 : Y1 - Y0, d = L / n;
      const local = [[0, z0], [L, z0], [L, z1], [(n - 1) * d, z1], [0, z0 + h]];
      const at = u => (dir === 'x+' ? X0 + u : dir === 'x-' ? X1 - u : dir === 'y+' ? Y0 + u : Y1 - u);
      const poly = local.map(([u, z]) => [at(u), z]);
      if (alongX) this.prism('y', poly, Y0, Y1, 'clip', { clip: true });
      else this.prism('x', poly, X0, X1, 'clip', { clip: true });
    }

    cyl(cx, cy, r, z0, z1, sides, mat, o) {
      o = o || {};
      const poly = [];
      const rot = o.rot || Math.PI / sides;
      for (let i = 0; i < sides; i++) {
        const a = rot + i / sides * Q.TAU;
        poly.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      return this.prism('z', poly, z0, z1, mat, o);
    }

    ring(cx, cy, r0, r1, z0, z1, segs, mat, o) {
      o = o || {};
      const gaps = o.gaps || [];
      const a0 = o.a0 || 0, span = o.span || Q.TAU;
      for (let i = 0; i < segs; i++) {
        const aa = a0 + span * i / segs, ab = a0 + span * (i + 1) / segs;
        const mid = (aa + ab) / 2;
        if (gaps.some(g => Math.abs(Q.angDiff(mid, g[0])) < g[1])) continue;
        const poly = [
          [cx + Math.cos(aa) * r0, cy + Math.sin(aa) * r0],
          [cx + Math.cos(aa) * r1, cy + Math.sin(aa) * r1],
          [cx + Math.cos(ab) * r1, cy + Math.sin(ab) * r1],
          [cx + Math.cos(ab) * r0, cy + Math.sin(ab) * r0]
        ];
        this.prism('z', poly, z0, z1, mat, o);
      }
    }

    wall(axis, t0, t1, a0, a1, z0, z1, mat, holes, o) {
      o = o || {};
      holes = (holes || []).slice().sort((p, q) => p.a - q.a);
      const seg = (u0, u1, v0, v1) => {
        if (u1 - u0 < 0.5 || v1 - v0 < 0.5) return;
        if (axis === 'x') this.box(u0, t0, v0, u1, t1, v1, mat, o);
        else this.box(t0, u0, v0, t1, u1, v1, mat, o);
      };
      const fill = poly => {
        if (axis === 'x') this.prism('y', poly, t0, t1, mat, o);
        else this.prism('x', poly, t0, t1, mat, o);
      };
      let cur = a0;
      for (const h of holes) {
        seg(cur, h.a, z0, z1);
        const hz0 = h.z0 !== undefined ? h.z0 : z0;
        seg(h.a, h.b, z0, hz0);
        if (h.arch) {
          const w = h.b - h.a, rise = h.arch === 'gothic' ? w * 0.8 : w / 2;
          const top = Math.min(z1, h.top + rise);
          const pts = [];
          const N = 8;
          for (let i = 0; i <= N; i++) {
            const t = i / N;
            let z;
            if (h.arch === 'gothic') {
              const k = t < 0.5 ? t * 2 : (1 - t) * 2;
              z = h.top + rise * Math.sqrt(Math.max(0, 1 - (1 - k) * (1 - k)));
            } else z = h.top + rise * Math.sin(t * Math.PI);
            pts.push([h.a + w * t, Math.min(top, z)]);
          }
          for (let i = 0; i < N; i++) {
            const pa = pts[i], pb = pts[i + 1];
            if (top - Math.max(pa[1], pb[1]) < 0.5 && top - Math.min(pa[1], pb[1]) < 0.5) continue;
            const poly = [[pa[0], pa[1]], [pb[0], pb[1]], [pb[0], top], [pa[0], top]].filter((p, i2, arr) => i2 === 0 || Math.abs(p[0] - arr[i2 - 1][0]) > 0.01 || Math.abs(p[1] - arr[i2 - 1][1]) > 0.01);
            if (poly.length >= 3) fill(poly);
          }
          seg(h.a, h.b, top, z1);
        } else seg(h.a, h.b, h.top, z1);
        cur = h.b;
      }
      seg(cur, a1, z0, z1);
    }

    pyramid(cx, cy, z0, z1, r, sides, mat, o) {
      o = o || {};
      const rot = o.rot !== undefined ? o.rot : Math.PI / sides;
      const pts = [];
      for (let i = 0; i < sides; i++) {
        const a = rot + i / sides * Q.TAU;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z0]);
      }
      const apex = [cx, cy, z1], cen = [cx, cy, (z0 + z1) / 2];
      const planes = [{ n: [0, 0, -1], d: -z0, mat: this.matFor([0, 0, -1], mat, o) }];
      for (let i = 0; i < sides; i++) {
        const a = pts[i], b = pts[(i + 1) % sides];
        let n = Q.vnorm(Q.vcross(Q.vsub(b, a), Q.vsub(apex, a)));
        if (Q.vdot(n, Q.vsub(cen, a)) > 0) n = Q.vscale(n, -1);
        planes.push({ n, d: Q.vdot(n, a), mat: this.matFor(n, mat, o) });
      }
      return this.addPlanes(planes, o);
    }

    skyShell(x0, y0, z0, x1, y1, z1) {
      const t = 16;
      this.box(x0 - t, y0 - t, z0, x1 + t, y0, z1 + t, 'sky');
      this.box(x0 - t, y1, z0, x1 + t, y1 + t, z1 + t, 'sky');
      this.box(x0 - t, y0, z0, x0, y1, z1 + t, 'sky');
      this.box(x1, y0, z0, x1 + t, y1, z1 + t, 'sky');
      this.box(x0, y0, z1, x1, y1, z1 + t, 'sky');
    }

    carve(bx0, by0, bx1, by1, rooms, z0, z1, mat, o) {
      o = o || {};
      const xs = new Set([bx0, bx1]), ys = new Set([by0, by1]);
      for (const r of rooms) {
        xs.add(Q.clamp(r[0], bx0, bx1)); xs.add(Q.clamp(r[2], bx0, bx1));
        ys.add(Q.clamp(r[1], by0, by1)); ys.add(Q.clamp(r[3], by0, by1));
      }
      const X = [...xs].sort((a, b) => a - b), Y = [...ys].sort((a, b) => a - b);
      const nx = X.length - 1, ny = Y.length - 1;
      const solid = [], used = [];
      for (let j = 0; j < ny; j++) {
        solid.push([]); used.push([]);
        for (let i = 0; i < nx; i++) {
          const cx = (X[i] + X[i + 1]) / 2, cy = (Y[j] + Y[j + 1]) / 2;
          solid[j].push(!rooms.some(r => cx > r[0] && cx < r[2] && cy > r[1] && cy < r[3]));
          used[j].push(false);
        }
      }
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          if (!solid[j][i] || used[j][i]) continue;
          let i2 = i;
          while (i2 + 1 < nx && solid[j][i2 + 1] && !used[j][i2 + 1]) i2++;
          let j2 = j;
          for (;;) {
            if (j2 + 1 >= ny) break;
            let ok = true;
            for (let k = i; k <= i2; k++) if (!solid[j2 + 1][k] || used[j2 + 1][k]) { ok = false; break; }
            if (!ok) break;
            j2++;
          }
          for (let jj = j; jj <= j2; jj++) for (let ii = i; ii <= i2; ii++) used[jj][ii] = true;
          this.box(X[i], Y[j], z0, X[i2 + 1], Y[j2 + 1], z1, mat, o);
        }
      }
      for (const r of rooms) {
        const ceil = r[4], floor = r[5] !== undefined ? r[5] : z0;
        if (ceil !== undefined && ceil < z1) this.box(r[0], r[1], ceil, r[2], r[3], z1, mat, { bottom: r[7] || o.ceil || 'gceil', side: o.lintel || mat, top: mat });
        if (floor > z0) this.box(r[0], r[1], z0, r[2], r[3], floor, mat, { top: r[6] || o.floor || 'gfloor2', side: o.step || mat });
      }
    }

    column(x, y, z0, z1, r, mat, capMat) {
      capMat = capMat || mat;
      this.cyl(x, y, r * 1.4, z0, z0 + 16, 8, capMat);
      this.cyl(x, y, r, z0 + 16, z1 - 20, 8, mat);
      this.cyl(x, y, r * 1.45, z1 - 20, z1, 8, capMat);
    }

    torch(x, y, z, yawDeg) {
      const a = (yawDeg || 0) * Q.DEG;
      const dx = Math.cos(a), dy = Math.sin(a);
      const bx = x + dx * 10, by = y + dy * 10;
      this.box(bx - 5, by - 5, z - 24, bx + 5, by + 5, z, 'gmetal', { noCover: true });
      this.flame(bx, by, z + 2, 0.8);
    }

    wallX(y0, y1, x0, x1, z0, z1, mat, holes, o) { this.wall('x', Math.min(y0, y1), Math.max(y0, y1), x0, x1, z0, z1, mat, holes, o); }
    wallY(x0, x1, y0, y1, z0, z1, mat, holes, o) { this.wall('y', Math.min(x0, x1), Math.max(x0, x1), y0, y1, z0, z1, mat, holes, o); }

    lava(x0, y0, z0, x1, y1, z1, kind) {
      const b = this.box(x0, y0, z0, x1, y1, z1, kind || 'lava', { contents: kind === 'slime' ? C.SLIME : C.LAVA, side: 'nodraw', bottom: 'nodraw' });
      this.light([(x0 + x1) / 2, (y0 + y1) / 2, z1 + 40], Math.min(420, 120 + Math.max(x1 - x0, y1 - y0) * 0.9), kind === 'slime' ? [0.4, 1, 0.3] : [1, 0.45, 0.15]);
      return b;
    }

    light(pos, intensity, color, o) {
      this.lights.push(Object.assign({ pos: pos.slice(), intensity, color: color || [1, 1, 1] }, o || {}));
    }

    flame(x, y, z, scale) {
      this.decos.push({ kind: 'flame', pos: [x, y, z], scale: scale || 1 });
      this.light([x, y, z + 18], 240 * (scale || 1), [1, 0.62, 0.3]);
    }

    deco(kind, x, y, z, o) {
      this.decos.push(Object.assign({ kind, pos: [x, y, z], yaw: 0, scale: 1 }, o || {}));
    }

    decal(tex, x, y, z, size, o) {
      this.decals.push(Object.assign({ tex, pos: [x, y, z], size, rot: 0, n: [0, 0, 1] }, o || {}));
    }

    spawn(x, y, z, yawDeg) {
      this.ents.push({ type: 'spawn', pos: [x, y, z + 25], yaw: (yawDeg || 0) * Q.DEG });
    }

    item(key, x, y, z, o) {
      if (!Q.ITEMS[key]) throw new Error('unknown item ' + key);
      this.ents.push(Object.assign({ type: 'item', key, pos: [x, y, z + 16] }, o || {}));
    }

    jumppad(x, y, z, r, tx, ty, tz, o) {
      this.ents.push(Object.assign({ type: 'jumppad', pos: [x, y, z], r, min: [x - r, y - r, z - 2], max: [x + r, y + r, z + 30], target: [tx, ty, tz] }, o || {}));
      this.decals.push({ tex: 'jumppad', pos: [x, y, z + 0.6], size: r * 2.2, rot: 0, n: [0, 0, 1], glow: true });
      this.light([x, y, z + 24], 150, [1, 0.55, 0.2]);
    }

    teleporter(x0, y0, z0, x1, y1, z1, dest, yawDeg, o) {
      this.ents.push(Object.assign({ type: 'teleport', min: [Math.min(x0, x1), Math.min(y0, y1), z0], max: [Math.max(x0, x1), Math.max(y0, y1), z1], dest: [dest[0], dest[1], dest[2] + 25], yaw: (yawDeg || 0) * Q.DEG }, o || {}));
      this.light([(x0 + x1) / 2, (y0 + y1) / 2, z0 + 48], 170, [0.5, 0.6, 1]);
    }

    hurt(x0, y0, z0, x1, y1, z1, dmg, mod) {
      this.ents.push({ type: 'hurt', min: [x0, y0, z0], max: [x1, y1, z1], dmg: dmg || 1000, mod: mod || 'trigger_hurt' });
    }

    intermission(x, y, z, yawDeg, pitchDeg) {
      this.ents.push({ type: 'intermission', pos: [x, y, z], yaw: (yawDeg || 0) * Q.DEG, pitch: (pitchDeg || 0) * Q.DEG });
    }
  }
  Q.Builder = Builder;

  Q.MAPS = Q.MAPS || {};
  const cache = {};
  Q.loadWorld = function (id) {
    if (cache[id]) return cache[id];
    const def = Q.MAPS[id];
    if (!def) throw new Error('no map ' + id);
    const B = new Builder(def);
    def.build(B, Q);
    const w = new World(def, B);
    cache[id] = w;
    return w;
  };
  Q.clearWorldCache = () => { for (const k of Object.keys(cache)) delete cache[k]; };
})(globalThis.Quake3 = globalThis.Quake3 || {});
