(function (B) {
  'use strict';
  const V = B.V, M = B.M;
  const COL = B.UI.COL;

  function newCurveData(main, name, cutype) {
    return main.add('CU', name, {
      cutype, nurbs: [], flag: { front: true, back: true, d3: false, uvorco: false, noPunoFlip: false, path: false, follow: false },
      width: 1, ext1: 0, ext2: 0, bevresol: 0, bevobj: null, resolu: 6, resolv: 6, pathlen: 100, mats: [], texspace: null,
      str: 'Text', pos: 4, fsize: 1, linedist: 1, spacing: 1, shear: 0, xof: 0, yof: 0, spacemode: 'left', textoncurve: null, family: '', vfont: 'Bfont', stamp: 0
    });
  }

  function bezt(p, h1, h2) {
    return { vec: [V.add(p, h1), p.slice(), V.add(p, h2)], h1: 'align', h2: 'align', f1: false, f2: true, f3: false, tilt: 0 };
  }

  function bp(x, y, z, w = 1) { return { co: [x, y, z, w], f: true }; }

  function primCurve(kind) {
    const R2 = Math.SQRT1_2;
    if (kind === 'bezier') return { type: 'bezier', bezt: [bezt([-1, 0, 0], [-0.5, -0.5, 0], [0.5, 0.5, 0]), bezt([1, 0, 0], [-0.5, 0.5, 0], [0.5, -0.5, 0])], cyclic: { u: false }, resolu: 6 };
    if (kind === 'bezcircle') {
      const k = 0.5523;
      const pts = [[-1, 0], [0, 1], [1, 0], [0, -1]];
      const tans = [[0, k], [k, 0], [0, -k], [-k, 0]];
      return { type: 'bezier', bezt: pts.map((p, i) => { const b = bezt([p[0], p[1], 0], [-tans[i][0], -tans[i][1], 0], [tans[i][0], tans[i][1], 0]); b.h1 = b.h2 = 'auto'; return b; }), cyclic: { u: true }, resolu: 6 };
    }
    if (kind === 'nurbs' || kind === 'path') {
      const pts = kind === 'path' ? [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]] : [[-1, 0], [-0.5, 1], [0.5, 1], [1, 0]];
      return { type: 'nurbs', bp: pts.map(p => bp(p[0], p[1], 0)), pntsu: pts.length, pntsv: 1, orderu: 4, orderv: 4, cyclic: { u: false, v: false }, knotsu: kind === 'path' ? 'endpoint' : 'uniform', knotsv: 'uniform', resolu: 6, resolv: 6 };
    }
    if (kind === 'nurbcircle') {
      const pts = [[-1, 0, 1], [-1, 1, R2], [0, 1, 1], [1, 1, R2], [1, 0, 1], [1, -1, R2], [0, -1, 1], [-1, -1, R2]];
      return { type: 'nurbs', bp: pts.map(p => bp(p[0], p[1], 0, p[2])), pntsu: 8, pntsv: 1, orderu: 3, orderv: 3, cyclic: { u: true, v: false }, knotsu: 'uniform', knotsv: 'uniform', resolu: 6, resolv: 6 };
    }
    return null;
  }

  function primSurf(kind) {
    const R2 = Math.SQRT1_2;
    const circ = [[-1, 0, 1], [-1, 1, R2], [0, 1, 1], [1, 1, R2], [1, 0, 1], [1, -1, R2], [0, -1, 1], [-1, -1, R2]];
    const S = (pts, nu, nv, cu, cv, ou, ov) => ({ type: 'nurbs', bp: pts, pntsu: nu, pntsv: nv, orderu: ou || Math.min(4, nu), orderv: ov || Math.min(4, nv), cyclic: { u: !!cu, v: !!cv }, knotsu: 'uniform', knotsv: 'uniform', resolu: 4, resolv: 4 });
    if (kind === 'curve') return S([[-1.5, 0], [-0.5, 1], [0.5, -1], [1.5, 0]].map(p => bp(p[0], p[1], 0)), 4, 1, false, false, 4, 1);
    if (kind === 'circle') return S(circ.map(p => bp(p[0], p[1], 0, p[2])), 8, 1, true, false, 3, 1);
    if (kind === 'surface') {
      const pts = [];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) pts.push(bp(-1.5 + i, -1.5 + j, 0));
      return S(pts, 4, 4, false, false, 4, 4);
    }
    if (kind === 'tube') {
      const pts = [];
      for (let j = 0; j < 2; j++) circ.forEach(p => pts.push(bp(p[0], p[1], -1 + 2 * j, p[2])));
      return S(pts, 8, 2, true, false, 3, 2);
    }
    if (kind === 'sphere') {
      const arc = [[0, -1, 1], [1, -1, R2], [1, 0, 1], [1, 1, R2], [0, 1, 1]];
      const pts = [];
      arc.forEach(a => circ.forEach(c => pts.push(bp(c[0] * a[0], c[1] * a[0], a[1], c[2] * a[2]))));
      return S(pts, 8, 5, true, false, 3, 3);
    }
    if (kind === 'donut') {
      const pts = [];
      circ.forEach(a => circ.forEach(c => { const r = 2 + a[0] * 0.75; pts.push(bp(c[0] * r, c[1] * r, a[1] * 0.75, c[2] * a[2])); }));
      return S(pts, 8, 8, true, true, 3, 3);
    }
    return null;
  }

  function knots(n, order, type, cyclic) {
    const k = [];
    if (cyclic) { for (let i = 0; i < n + order; i++) k.push(i); return k; }
    if (type === 'endpoint') {
      for (let i = 0; i < n + order; i++) k.push(i < order ? 0 : i >= n ? n - order + 1 : i - order + 1);
      return k;
    }
    if (type === 'bezier') {
      for (let i = 0; i < n + order; i++) k.push(Math.floor((i + 1) / (order - 1)));
      return k;
    }
    for (let i = 0; i < n + order; i++) k.push(i);
    return k;
  }

  function basis(kv, order, t, i) {
    const N = new Array(order + 1).fill(0);
    for (let j = 0; j < order; j++) N[j] = (t >= kv[i + j] && t < kv[i + j + 1]) ? 1 : 0;
    for (let d = 2; d <= order; d++) {
      for (let j = 0; j <= order - d; j++) {
        let v = 0;
        const a = kv[i + j + d - 1] - kv[i + j], b = kv[i + j + d] - kv[i + j + 1];
        if (a > 0) v += (t - kv[i + j]) / a * N[j];
        if (b > 0) v += (kv[i + j + d] - t) / b * N[j + 1];
        N[j] = v;
      }
    }
    return N[0];
  }

  function nurbsCurvePoints(pts, order, kt, cyclic, steps) {
    const n = pts.length;
    if (n < 2) return pts.map(p => p.slice(0, 3));
    order = Math.max(2, Math.min(order, n));
    const P = cyclic ? pts.concat(pts.slice(0, order - 1)) : pts;
    const kv = knots(P.length, order, kt, cyclic);
    const t0 = kv[order - 1], t1 = kv[P.length];
    const out = [];
    const total = Math.max(2, steps * (cyclic ? n : n - 1));
    for (let s = 0; s <= total; s++) {
      if (cyclic && s === total) break;
      const t = t0 + (t1 - t0) * s / total - (s === total ? 1e-6 : 0);
      let x = 0, y = 0, z = 0, w = 0;
      for (let i = 0; i < P.length; i++) {
        const b = basis(kv, order, t, i);
        if (!b) continue;
        const pw = P[i][3] == null ? 1 : P[i][3];
        x += P[i][0] * b * pw; y += P[i][1] * b * pw; z += P[i][2] * b * pw; w += b * pw;
      }
      if (w) out.push([x / w, y / w, z / w]);
    }
    return out;
  }

  function bezPoint(a, b, c, d, t) {
    const u = 1 - t;
    return [0, 1, 2].map(k => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]);
  }

  function calcBezHandles(nu) {
    const bz = nu.bezt, n = bz.length;
    for (let i = 0; i < n; i++) {
      const b = bz[i];
      const prev = bz[i - 1] || (nu.cyclic.u ? bz[n - 1] : null), next = bz[i + 1] || (nu.cyclic.u ? bz[0] : null);
      const p = b.vec[1];
      if (b.h1 === 'vect' && prev) b.vec[0] = V.add(p, V.mul(V.sub(prev.vec[1], p), 1 / 3));
      if (b.h2 === 'vect' && next) b.vec[2] = V.add(p, V.mul(V.sub(next.vec[1], p), 1 / 3));
      if (b.h1 === 'auto' || b.h2 === 'auto') {
        const pp = prev ? prev.vec[1] : V.sub(p, V.sub(next ? next.vec[1] : V.add(p, [1, 0, 0]), p));
        const np = next ? next.vec[1] : V.add(p, V.sub(p, pp));
        const tan = V.mul(V.sub(np, pp), 0.5);
        const l1 = V.dist(p, pp), l2 = V.dist(p, np), tl = V.len(tan) || 1;
        if (b.h1 === 'auto') b.vec[0] = V.sub(p, V.mul(tan, l1 / tl / 2.5));
        if (b.h2 === 'auto') b.vec[2] = V.add(p, V.mul(tan, l2 / tl / 2.5));
      }
    }
  }

  function splinePoints(nu, resol) {
    const steps = Math.max(1, nu.resolu || resol || 6);
    if (nu.type === 'bezier') {
      const bz = nu.bezt, n = bz.length;
      if (!n) return [];
      const out = [];
      const segs = nu.cyclic.u ? n : n - 1;
      for (let i = 0; i < segs; i++) {
        const a = bz[i], b = bz[(i + 1) % n];
        for (let s = 0; s < steps; s++) out.push(bezPoint(a.vec[1], a.vec[2], b.vec[0], b.vec[1], s / steps));
      }
      if (!nu.cyclic.u) out.push(bz[n - 1].vec[1].slice());
      if (n === 1) out.push(bz[0].vec[1].slice());
      return out;
    }
    if (nu.type === 'poly') return nu.bp.map(p => p.co.slice(0, 3));
    if (nu.pntsv > 1) return [];
    return nurbsCurvePoints(nu.bp.map(p => p.co), nu.orderu, nu.knotsu, nu.cyclic.u, steps);
  }

  function basisAll(kv, order, n, t) {
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = basis(kv, order, t, i);
    return out;
  }

  function nurbsSurface(nu) {
    const nU = nu.pntsu, nV = nu.pntsv;
    const ou = Math.max(2, Math.min(nu.orderu, nU)), ov = Math.max(2, Math.min(nu.orderv, nV));
    const idxU = [], idxV = [];
    for (let i = 0; i < nU + (nu.cyclic.u ? ou - 1 : 0); i++) idxU.push(i % nU);
    for (let j = 0; j < nV + (nu.cyclic.v ? ov - 1 : 0); j++) idxV.push(j % nV);
    const kvU = knots(idxU.length, ou, nu.knotsu, nu.cyclic.u), kvV = knots(idxV.length, ov, nu.knotsv, nu.cyclic.v);
    const ru = Math.max(2, (nu.resolu || 4) * (nu.cyclic.u ? nU : nU - 1)), rv = Math.max(2, (nu.resolv || 4) * (nu.cyclic.v ? nV : nV - 1));
    const tu0 = kvU[ou - 1], tu1 = kvU[idxU.length], tv0 = kvV[ov - 1], tv1 = kvV[idxV.length];
    const W = nu.cyclic.u ? ru : ru + 1, H = nu.cyclic.v ? rv : rv + 1;
    const Bu = [], Bv = [];
    for (let i = 0; i < W; i++) { const t = tu0 + (tu1 - tu0) * i / ru - (i === ru ? 1e-6 : 0); Bu.push(basisAll(kvU, ou, idxU.length, t)); }
    for (let j = 0; j < H; j++) { const t = tv0 + (tv1 - tv0) * j / rv - (j === rv ? 1e-6 : 0); Bv.push(basisAll(kvV, ov, idxV.length, t)); }
    const verts = [], faces = [];
    for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) {
      let x = 0, y = 0, z = 0, w = 0;
      const bu = Bu[i], bv = Bv[j];
      for (let a = 0; a < idxU.length; a++) {
        if (!bu[a]) continue;
        for (let c = 0; c < idxV.length; c++) {
          if (!bv[c]) continue;
          const p = nu.bp[idxV[c] * nU + idxU[a]].co;
          const f = bu[a] * bv[c] * (p[3] == null ? 1 : p[3]);
          x += p[0] * f; y += p[1] * f; z += p[2] * f; w += f;
        }
      }
      verts.push({ co: w ? [x / w, y / w, z / w] : [0, 0, 0], sel: false, hide: false });
    }
    const id = (i, j) => (((i % W) + W) % W) * H + (((j % H) + H) % H);
    const iu = nu.cyclic.u ? W : W - 1, jv = nu.cyclic.v ? H : H - 1;
    for (let i = 0; i < iu; i++) for (let j = 0; j < jv; j++) faces.push({ v: [id(i, j), id(i + 1, j), id(i + 1, j + 1), id(i, j + 1)], mat: nu.mat || 0, smooth: true });
    return { verts, faces };
  }

  function polyArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[i], r = p[(i + 1) % p.length]; a += q[0] * r[1] - r[0] * q[1]; } return a / 2; }

  function pointInPoly2(pt, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }

  function cleanLoop(loop) {
    const out = [];
    loop.forEach(p => { const q = out[out.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-6) out.push(p); });
    if (out.length > 2 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 1e-6) out.pop();
    return out;
  }

  function groupLoops(loops) {
    const items = loops.map(l => ({ l, area: polyArea(l), depth: 0 }));
    items.forEach(a => { a.depth = items.filter(b => b !== a && Math.abs(b.area) > Math.abs(a.area) && pointInPoly2(a.l[0], b.l)).length; });
    const outers = items.filter(i => i.depth % 2 === 0);
    return outers.map(o => ({
      outer: o.area < 0 ? o.l.slice().reverse() : o.l,
      holes: items.filter(h => h.depth === o.depth + 1 && pointInPoly2(h.l[0], o.l)).map(h => (h.area > 0 ? h.l.slice().reverse() : h.l))
    }));
  }

  function bridgeHoles(outer, holes) {
    let poly = outer.slice();
    holes.slice().sort((a, b) => Math.max(...b.map(p => p[0])) - Math.max(...a.map(p => p[0]))).forEach(h => {
      let hi = 0;
      h.forEach((p, i) => { if (p[0] > h[hi][0]) hi = i; });
      const hp = h[hi];
      let best = -1, bd = Infinity;
      poly.forEach((p, i) => {
        if (p[0] < hp[0] - 1e-9) return;
        const d = Math.hypot(p[0] - hp[0], p[1] - hp[1]);
        if (d >= bd) return;
        let ok = true;
        for (let k = 0; k < poly.length && ok; k++) {
          const a = poly[k], b = poly[(k + 1) % poly.length];
          if (k === i || (k + 1) % poly.length === i) continue;
          if (segIntersect(hp, p, a, b)) ok = false;
        }
        if (ok) { bd = d; best = i; }
      });
      if (best < 0) poly.forEach((p, i) => { const d = Math.hypot(p[0] - hp[0], p[1] - hp[1]); if (d < bd) { bd = d; best = i; } });
      const hr = h.slice(hi).concat(h.slice(0, hi));
      poly = poly.slice(0, best + 1).concat(hr, [hr[0], poly[best]], poly.slice(best + 1));
    });
    return poly;
  }

  function segIntersect(p1, p2, p3, p4) {
    const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
    if (Math.abs(d) < 1e-12) return false;
    const t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
    const u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
    return t > 1e-7 && t < 1 - 1e-7 && u > 1e-7 && u < 1 - 1e-7;
  }

  function offsetLoop(loop, d) {
    if (!d) return loop;
    const n = loop.length;
    return loop.map((p, i) => {
      const a = loop[(i + n - 1) % n], b = loop[(i + 1) % n];
      const n1 = V.norm([p[1] - a[1], a[0] - p[0], 0]), n2 = V.norm([b[1] - p[1], p[0] - b[0], 0]);
      let m = V.norm(V.add(n1, n2));
      const c = Math.max(0.3, V.dot(m, n1));
      return [p[0] - m[0] * d / c, p[1] - m[1] * d / c];
    });
  }

  function fillMesh(loops2d, cu, mat) {
    const verts = [], faces = [];
    const add = (x, y, z) => { verts.push({ co: [x, y, z], sel: false, hide: false }); return verts.length - 1; };
    const groups = groupLoops(loops2d.map(cleanLoop).filter(l => l.length >= 3));
    const e1 = cu.ext1 || 0, e2 = cu.ext2 || 0;
    const prof = [];
    if (e2 > 0) {
      const steps = Math.max(1, (cu.bevresol || 0) + 1);
      for (let k = 0; k <= steps; k++) { const a = (k / steps) * Math.PI / 2; prof.push([e2 * (1 - Math.sin(a)), e1 + e2 * Math.cos(a)]); }
      for (let k = steps; k >= 0; k--) { const a = (k / steps) * Math.PI / 2; prof.push([e2 * (1 - Math.sin(a)), -e1 - e2 * Math.cos(a)]); }
    } else if (e1 > 0) prof.push([0, e1], [0, -e1]);
    groups.forEach(g => {
      const capZ = [];
      if (cu.flag.front || e1 > 0 || e2 > 0) capZ.push({ z: prof.length ? prof[0][1] : 0, inset: prof.length ? prof[0][0] : 0, up: true });
      if (cu.flag.back && (e1 > 0 || e2 > 0)) capZ.push({ z: prof.length ? prof[prof.length - 1][1] : 0, inset: prof.length ? prof[prof.length - 1][0] : 0, up: false });
      else if (cu.flag.back && !capZ.length) capZ.push({ z: 0, inset: 0, up: false });
      capZ.forEach(c => {
        const outer = offsetLoop(g.outer, c.inset), holes = g.holes.map(h => offsetLoop(h, c.inset));
        const poly = bridgeHoles(outer, holes);
        const idx = poly.map(p => add(p[0], p[1], c.z));
        B.MeshOps.polyTriangulate(poly).forEach(t => faces.push({ v: c.up ? t.map(k => idx[k]) : [idx[t[0]], idx[t[2]], idx[t[1]]], mat, smooth: false }));
      });
      if (prof.length > 1) [g.outer, ...g.holes].forEach(loop => {
        const rings = prof.map(([ins, z]) => offsetLoop(loop, ins).map(p => add(p[0], p[1], z)));
        for (let r = 0; r < rings.length - 1; r++) {
          const A = rings[r], Bq = rings[r + 1], n = A.length;
          for (let i = 0; i < n; i++) faces.push({ v: [A[i], A[(i + 1) % n], Bq[(i + 1) % n], Bq[i]], mat, smooth: e2 > 0 });
        }
      });
    });
    return { verts, faces };
  }

  function frames(pts, closed) {
    const n = pts.length;
    const T = pts.map((p, i) => {
      const a = pts[i > 0 ? i - 1 : (closed ? n - 1 : 0)], b = pts[i < n - 1 ? i + 1 : (closed ? 0 : n - 1)];
      return V.norm(V.sub(b, a));
    });
    let N = Math.abs(T[0][2]) < 0.9 ? V.norm(V.cross(T[0], [0, 0, 1])) : V.norm(V.cross(T[0], [1, 0, 0]));
    const out = [];
    for (let i = 0; i < n; i++) {
      if (i > 0) { const bn = V.cross(T[i - 1], T[i]); if (V.len(bn) > 1e-6) { const ax = V.norm(bn); const ang = Math.acos(B.clamp(V.dot(T[i - 1], T[i]), -1, 1)); N = M.dir(M.fromQuat(B.Q.axisAngle(ax, ang)), N); } }
      out.push({ t: T[i], n: N, b: V.cross(T[i], N) });
    }
    return out;
  }

  function sweep(pts, closed, profile, profClosed, mat) {
    const verts = [], faces = [];
    const fr = frames(pts, closed);
    pts.forEach((p, i) => profile.forEach(q => verts.push({ co: V.add(p, V.add(V.mul(fr[i].n, q[0]), V.mul(fr[i].b, q[1]))), sel: false, hide: false })));
    const m = profile.length, n = pts.length;
    const su = closed ? n : n - 1, sv = profClosed ? m : m - 1;
    for (let i = 0; i < su; i++) for (let j = 0; j < sv; j++) {
      const a = i * m + j, b = ((i + 1) % n) * m + j, c = ((i + 1) % n) * m + (j + 1) % m, d = i * m + (j + 1) % m;
      faces.push({ v: [a, d, c, b], mat, smooth: true });
    }
    return { verts, faces };
  }

  function mergeMeshes(list) {
    const out = { verts: [], faces: [] };
    list.forEach(m => { const off = out.verts.length; out.verts.push(...m.verts); m.faces.forEach(f => out.faces.push(Object.assign({}, f, { v: f.v.map(i => i + off) }))); });
    return out;
  }

  function textLoops(cu) {
    const loops = [];
    const glyphs = B.BFONT || {};
    const scale = (cu.fsize || 1) / 1000 * 1.0;
    const lines = String(cu.str || '').split('\n');
    const lineW = lines.map(l => [...l].reduce((s, ch) => s + ((glyphs[ch.charCodeAt(0)] || glyphs[63] || [500])[0] * scale * (cu.spacing || 1)), 0));
    const maxW = Math.max(0, ...lineW);
    const res = Math.max(1, Math.round((cu.resolu || 6) / 2));
    lines.forEach((line, li) => {
      let x = 0;
      const y = -li * (cu.linedist || 1) * (cu.fsize || 1) * 1.15;
      let ofs = 0;
      if (cu.spacemode === 'middle') ofs = -lineW[li] / 2;
      else if (cu.spacemode === 'right') ofs = -lineW[li];
      const extra = cu.spacemode === 'flush' && line.length > 1 ? (maxW - lineW[li]) / (line.length - 1) : 0;
      [...line].forEach(ch => {
        const g = glyphs[ch.charCodeAt(0)] || (ch === ' ' ? [250, ''] : glyphs[63]);
        if (!g) return;
        const [w, path] = g;
        let cur = null, pen = [0, 0];
        const tok = path ? path.split(' ') : [];
        const P = (px, py) => [ofs + x + (px + py * (cu.shear || 0)) * scale + (cu.xof || 0), y + py * scale + (cu.yof || 0)];
        tok.forEach(t => {
          const c = t[0], nums = t.slice(1) ? t.slice(1).split(',').map(Number) : [];
          if (c === 'M') { if (cur && cur.length > 2) loops.push(cur); cur = [P(nums[0], nums[1])]; pen = [nums[0], nums[1]]; }
          else if (c === 'L') { cur && cur.push(P(nums[0], nums[1])); pen = [nums[0], nums[1]]; }
          else if (c === 'C') {
            for (let s = 1; s <= res; s++) { const tt = s / res; const q = bezPoint([pen[0], pen[1], 0], [nums[0], nums[1], 0], [nums[2], nums[3], 0], [nums[4], nums[5], 0], tt); cur && cur.push(P(q[0], q[1])); }
            pen = [nums[4], nums[5]];
          } else if (c === 'Z') { if (cur && cur.length > 2) loops.push(cur); cur = null; }
        });
        if (cur && cur.length > 2) loops.push(cur);
        x += w * scale * (cu.spacing || 1) + extra;
      });
    });
    return loops;
  }

  function dispMesh(ob, ctx) {
    const cu = ob.data;
    const key = JSON.stringify([cu.nurbs, cu.ext1, cu.ext2, cu.bevresol, cu.flag, cu.resolu, cu.str, cu.fsize, cu.spacing, cu.linedist, cu.shear, cu.xof, cu.yof, cu.spacemode, cu.width, cu.bevobj ? cu.bevobj.name + JSON.stringify(cu.bevobj.data.nurbs) : null, ctx && ctx.G.obedit === ob ? ctx.G.editCurve && ctx.G.editCurve.stamp : 0]);
    if (cu.disp && cu.dispKey === key) return cu.disp;
    const nurbs = ctx && ctx.G.obedit === ob && ctx.G.editCurve ? ctx.G.editCurve.nurbs : cu.nurbs;
    let mesh = { verts: [], faces: [] };
    const wires = [];
    if (cu.cutype === 'surf') {
      const parts = [];
      nurbs.forEach(nu => { if (nu.pntsv > 1) parts.push(nurbsSurface(nu)); else wires.push({ pts: nurbsCurvePoints(nu.bp.map(p => p.co), nu.orderu, nu.knotsu, nu.cyclic.u, nu.resolu || 4), closed: nu.cyclic.u }); });
      mesh = mergeMeshes(parts);
    } else {
      let loops = [];
      if (cu.cutype === 'font') loops = textLoops(cu).map(l => l.map(p => [p[0], p[1], 0]));
      const curves = cu.cutype === 'font' ? loops.map(l => ({ pts: l, closed: true })) : nurbs.map(nu => ({ pts: splinePoints(nu, cu.resolu), closed: !!nu.cyclic.u, nu }));
      curves.forEach(c => wires.push(c));
      const parts = [];
      const filled = !cu.flag.d3 && (cu.flag.front || cu.flag.back || cu.ext1 > 0 || cu.ext2 > 0);
      const closedLoops = curves.filter(c => c.closed && c.pts.length > 2).map(c => c.pts.map(p => [p[0], p[1]]));
      if (cu.bevobj && cu.bevobj.type === 'curve' && cu.bevobj.data.nurbs[0]) {
        const pn = cu.bevobj.data.nurbs[0];
        const prof = splinePoints(pn, cu.bevobj.data.resolu).map(p => [p[0], p[1]]);
        curves.forEach(c => { if (c.pts.length > 1) parts.push(sweep(c.pts, c.closed, prof, !!pn.cyclic.u, 0)); });
      } else if (filled && closedLoops.length) parts.push(fillMesh(closedLoops, cu, 0));
      else if ((cu.ext2 > 0 || cu.ext1 > 0)) {
        curves.forEach(c => {
          if (c.pts.length < 2) return;
          if (cu.ext2 > 0) {
            const n = Math.max(4, 4 + 2 * (cu.bevresol || 0));
            const prof = [];
            for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; prof.push([Math.cos(a) * cu.ext2, Math.sin(a) * cu.ext2 + 0]); }
            parts.push(sweep(c.pts, c.closed, prof, true, 0));
          } else parts.push(sweep(c.pts, c.closed, [[0, -cu.ext1], [0, cu.ext1]], false, 0));
        });
      }
      mesh = mergeMeshes(parts);
    }
    mesh.mats = cu.mats;
    mesh.flag = { twoside: true };
    mesh.wires = wires;
    mesh.stamp = (cu.stamp || 0) + 1;
    mesh.texspace = null;
    cu.disp = mesh;
    cu.dispKey = key;
    return mesh;
  }

  function pathPoint(cu, t) {
    const nu = cu.nurbs[0];
    if (!nu) return null;
    const pts = splinePoints(nu, Math.max(cu.resolu, 12));
    if (pts.length < 2) return null;
    const lens = [0];
    for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + V.dist(pts[i], pts[i - 1]));
    const total = lens[lens.length - 1] || 1;
    const d = B.clamp(t, 0, 1) * total;
    let i = 1;
    while (i < lens.length - 1 && lens[i] < d) i++;
    const f = (d - lens[i - 1]) / ((lens[i] - lens[i - 1]) || 1);
    return { pos: V.lerp(pts[i - 1], pts[i], f), dir: V.norm(V.sub(pts[i], pts[i - 1])) };
  }

  function editKey(ob) { return ob.data; }

  const EditCurve = {
    enter(ctx, ob) {
      ctx.G.obedit = ob;
      ctx.G.editMesh = null;
      ctx.G.editCurve = { nurbs: JSON.parse(JSON.stringify(ob.data.nurbs)), stamp: 1, orig: JSON.parse(JSON.stringify(ob.data.nurbs)), str: ob.data.str, pos: (ob.data.str || '').length };
      ctx.redrawAll();
      return true;
    },
    exit(ctx, save) {
      const ob = ctx.G.obedit, ec = ctx.G.editCurve;
      if (save && ec) { ob.data.nurbs = ec.nurbs; ob.data.disp = null; }
      ctx.G.editCurve = null;
    },
    points(ctx) {
      const ec = ctx.G.editCurve;
      if (!ec) return [];
      const out = [];
      ec.nurbs.forEach(nu => {
        if (nu.type === 'bezier') nu.bezt.forEach(b => out.push({ co: b.vec[1], sel: b.f2 || b.f1 || b.f3 }));
        else nu.bp.forEach(p => out.push({ co: p.co.slice(0, 3), sel: p.f }));
      });
      return out;
    },
    transPoints(ctx) {
      const ec = ctx.G.editCurve;
      const out = [];
      ec.nurbs.forEach(nu => {
        if (nu.type === 'bezier') nu.bezt.forEach(b => {
          const whole = b.f2;
          [0, 1, 2].forEach(k => {
            const sel = whole || (k === 0 && b.f1) || (k === 2 && b.f3);
            const ref = b.vec[k];
            out.push({ co: ref.slice(), sel, w: sel ? 1 : 0, apply: loc => { ref[0] = loc[0]; ref[1] = loc[1]; ref[2] = loc[2]; }, restore: o => { ref[0] = o[0]; ref[1] = o[1]; ref[2] = o[2]; } });
          });
        });
        else nu.bp.forEach(p => out.push({ co: p.co.slice(0, 3), sel: p.f, w: p.f ? 1 : 0, apply: loc => { p.co[0] = loc[0]; p.co[1] = loc[1]; p.co[2] = loc[2]; }, restore: o => { p.co[0] = o[0]; p.co[1] = o[1]; p.co[2] = o[2]; } }));
      });
      return out;
    },
    afterTransform(ctx) {
      const ec = ctx.G.editCurve;
      if (!ec) return;
      ec.nurbs.forEach(nu => { if (nu.type === 'bezier') calcBezHandles(nu); });
      ec.stamp++;
    },
    pick(ctx, area, ev) {
      const ob = ctx.G.obedit, ec = ctx.G.editCurve;
      if (!ec) return;
      const sv = B.View3D.setMatrices(ctx, area);
      let best = null, bd = 20;
      const P = co => B.View3D.project(sv, M.loc(ob.obmat, co));
      ec.nurbs.forEach(nu => {
        if (nu.type === 'bezier') nu.bezt.forEach(b => [0, 1, 2].forEach(k => { const s = P(b.vec[k]); if (!s) return; const d = Math.hypot(s[0] - ev.x, s[1] - ev.y) + (k === 1 ? 0 : 2); if (d < bd) { bd = d; best = { b, k }; } }));
        else nu.bp.forEach(p => { const s = P(p.co); if (!s) return; const d = Math.hypot(s[0] - ev.x, s[1] - ev.y); if (d < bd) { bd = d; best = { p }; } });
      });
      if (!ev.shift) EditCurve.selectAll(ec, false);
      if (best) {
        if (best.p) best.p.f = ev.shift ? !best.p.f : true;
        else if (best.k === 1) { const on = ev.shift ? !best.b.f2 : true; best.b.f1 = best.b.f2 = best.b.f3 = on; }
        else if (best.k === 0) best.b.f1 = ev.shift ? !best.b.f1 : true;
        else best.b.f3 = ev.shift ? !best.b.f3 : true;
      }
      ec.stamp++;
      ctx.redrawAll();
    },
    selectAll(ec, on) { ec.nurbs.forEach(nu => { if (nu.type === 'bezier') nu.bezt.forEach(b => { b.f1 = b.f2 = b.f3 = on; }); else nu.bp.forEach(p => { p.f = on; }); }); },
    anySel(ec) { return ec.nurbs.some(nu => (nu.type === 'bezier' ? nu.bezt.some(b => b.f1 || b.f2 || b.f3) : nu.bp.some(p => p.f))); },
    borderSelect(ctx, sv, inside, select) {
      const ob = ctx.G.obedit, ec = ctx.G.editCurve;
      ec.nurbs.forEach(nu => {
        if (nu.type === 'bezier') nu.bezt.forEach(b => { if (inside(B.View3D.project(sv, M.loc(ob.obmat, b.vec[1])))) b.f1 = b.f2 = b.f3 = select; });
        else nu.bp.forEach(p => { if (inside(B.View3D.project(sv, M.loc(ob.obmat, p.co)))) p.f = select; });
      });
      ec.stamp++;
    },
    key(ctx, area, ev) {
      const ob = ctx.G.obedit, ec = ctx.G.editCurve;
      const cu = ob.data;
      const k = ev.key;
      if (cu.cutype === 'font') return fontKey(ctx, area, ev);
      const plain = !ev.ctrl && !ev.alt && !ev.shift;
      const changed = () => { ec.nurbs.forEach(nu => { if (nu.type === 'bezier') calcBezHandles(nu); }); ec.stamp++; ctx.redrawAll(); };
      if (k === 'A' && plain) { EditCurve.selectAll(ec, !EditCurve.anySel(ec)); changed(); return true; }
      if ((k === 'X' || k === 'DEL') && plain) {
        B.UI.pupmenu(ctx, 'ERASE %t|Selected%x0|Segment%x1|All%x2').then(v => {
          if (v === 2) ec.nurbs = [];
          else if (v === 0) {
            ec.nurbs.forEach(nu => { if (nu.type === 'bezier') nu.bezt = nu.bezt.filter(b => !b.f2); else if (nu.pntsv <= 1) { nu.bp = nu.bp.filter(p => !p.f); nu.pntsu = nu.bp.length; } });
            ec.nurbs = ec.nurbs.filter(nu => (nu.type === 'bezier' ? nu.bezt.length : nu.bp.length));
          } else if (v === 1) {
            ec.nurbs.forEach(nu => { if (nu.type === 'bezier') { const i = nu.bezt.findIndex((b, j) => b.f2 && nu.bezt[j + 1] && nu.bezt[j + 1].f2); if (i >= 0) { if (nu.cyclic.u) { nu.bezt = nu.bezt.slice(i + 1).concat(nu.bezt.slice(0, i + 1)); nu.cyclic.u = false; } } } });
          }
          changed();
        });
        return true;
      }
      if (k === 'E' && plain) {
        let done = false;
        ec.nurbs.forEach(nu => {
          if (done) return;
          if (nu.type === 'bezier' && !nu.cyclic.u) {
            const last = nu.bezt[nu.bezt.length - 1], first = nu.bezt[0];
            if (last.f2) { const nb = JSON.parse(JSON.stringify(last)); last.f1 = last.f2 = last.f3 = false; nu.bezt.push(nb); done = true; }
            else if (first.f2) { const nb = JSON.parse(JSON.stringify(first)); first.f1 = first.f2 = first.f3 = false; nu.bezt.unshift(nb); done = true; }
          } else if (nu.type !== 'bezier') {
            if (nu.pntsv <= 1 && !nu.cyclic.u) {
              const last = nu.bp[nu.bp.length - 1], first = nu.bp[0];
              if (last.f) { last.f = false; nu.bp.push({ co: last.co.slice(), f: true }); nu.pntsu++; done = true; }
              else if (first.f) { first.f = false; nu.bp.unshift({ co: first.co.slice(), f: true }); nu.pntsu++; done = true; }
              else if (cu.cutype === 'surf' && nu.bp.every(p => p.f)) { const row = nu.bp.map(p => ({ co: p.co.slice(), f: true })); nu.bp.forEach(p => { p.f = false; }); nu.bp.push(...row); nu.pntsv = 2; nu.orderv = 2; done = true; }
            } else if (cu.cutype === 'surf' && nu.pntsv > 1) {
              const nu_ = nu.pntsu;
              const lastRow = nu.bp.slice((nu.pntsv - 1) * nu_);
              if (lastRow.every(p => p.f)) { const row = lastRow.map(p => ({ co: p.co.slice(), f: true })); lastRow.forEach(p => { p.f = false; }); nu.bp.push(...row); nu.pntsv++; nu.orderv = Math.min(4, nu.pntsv); done = true; }
            }
          }
        });
        if (!done) { B.UI.error(ctx, "Can't extrude"); return true; }
        changed();
        B.Transform.start(ctx, area, 'grab', { mouse: ctx.mouse });
        return true;
      }
      if (k === 'C' && plain) {
        ec.nurbs.forEach(nu => { const any = nu.type === 'bezier' ? nu.bezt.some(b => b.f2) : nu.bp.some(p => p.f); if (any) nu.cyclic.u = !nu.cyclic.u; });
        changed();
        return true;
      }
      if (k === 'H' || k === 'V') {
        const type = k === 'V' ? 'vect' : ev.shift ? 'auto' : null;
        ec.nurbs.forEach(nu => { if (nu.type !== 'bezier') return; nu.bezt.forEach(b => { if (!(b.f1 || b.f2 || b.f3)) return; if (type) { b.h1 = b.h2 = type; } else { const t = b.h1 === 'align' ? 'free' : 'align'; b.h1 = b.h2 = t; } }); });
        changed();
        return true;
      }
      if (k === 'W' && plain) {
        B.UI.pupmenu(ctx, 'Specials%t|Subdivide%x1|Switch Direction%x2').then(v => {
          if (v === 1) ec.nurbs.forEach(nu => {
            if (nu.type !== 'bezier') return;
            const out = [];
            nu.bezt.forEach((b, i) => {
              out.push(b);
              const nb = nu.bezt[i + 1] || (nu.cyclic.u ? nu.bezt[0] : null);
              if (nb && b.f2 && nb.f2) { const m = bezPoint(b.vec[1], b.vec[2], nb.vec[0], nb.vec[1], 0.5); const n = bezt(m, [0, 0, 0], [0, 0, 0]); n.h1 = n.h2 = 'auto'; n.f1 = n.f2 = n.f3 = true; out.push(n); }
            });
            nu.bezt = out;
          });
          else if (v === 2) ec.nurbs.forEach(nu => { if (nu.type === 'bezier') { nu.bezt.reverse(); nu.bezt.forEach(b => { b.vec.reverse(); [b.h1, b.h2] = [b.h2, b.h1]; }); } else if (nu.pntsv <= 1) nu.bp.reverse(); });
          changed();
        });
        return true;
      }
      if (k === 'F' && plain) {
        const sel = ec.nurbs.filter(nu => (nu.type === 'bezier' ? nu.bezt.some(b => b.f2) : nu.bp.some(p => p.f)));
        if (sel.length === 2 && sel[0].type === sel[1].type && sel[0].type === 'bezier') {
          sel[0].bezt.push(...sel[1].bezt);
          ec.nurbs.splice(ec.nurbs.indexOf(sel[1]), 1);
          changed();
        } else if (sel.length === 1) { sel[0].cyclic.u = true; changed(); }
        else B.UI.error(ctx, "Can't make segment");
        return true;
      }
      if (k === 'L' && plain) {
        ec.nurbs.forEach(nu => { const any = nu.type === 'bezier' ? nu.bezt.some(b => b.f2) : nu.bp.some(p => p.f); if (any) { if (nu.type === 'bezier') nu.bezt.forEach(b => { b.f1 = b.f2 = b.f3 = true; }); else nu.bp.forEach(p => { p.f = true; }); } });
        changed();
        return true;
      }
      if (k === 'U' && plain) {
        B.UI.okee(ctx, 'Reload Original data').then(ok => { if (ok) { ec.nurbs = JSON.parse(JSON.stringify(ec.orig)); changed(); } });
        return true;
      }
      if (k === 'T' && ev.ctrl) {
        B.UI.button(ctx, 'Tilt:', 0, -360, 360, 0).then(t => { if (t == null) return; ec.nurbs.forEach(nu => { if (nu.type === 'bezier') nu.bezt.forEach(b => { if (b.f2) b.tilt = t * B.DEG; }); }); changed(); });
        return true;
      }
      return false;
    }
  };

  function fontKey(ctx, area, ev) {
    const ob = ctx.G.obedit, ec = ctx.G.editCurve, cu = ob.data;
    const k = ev.key;
    const s = cu.str || '';
    if (k === 'TAB' && !ev.ctrl) return false;
    if (k === 'ESC') { B.Edit.exit(ctx, true); return true; }
    if (k === 'LEFTARROW') ec.pos = Math.max(0, ec.pos - 1);
    else if (k === 'RIGHTARROW') ec.pos = Math.min(s.length, ec.pos + 1);
    else if (k === 'HOME') ec.pos = 0;
    else if (k === 'END') ec.pos = s.length;
    else if (k === 'BACKSPACE') { if (ec.pos > 0) { cu.str = s.slice(0, ec.pos - 1) + s.slice(ec.pos); ec.pos--; } }
    else if (k === 'DEL') { cu.str = s.slice(0, ec.pos) + s.slice(ec.pos + 1); }
    else if (k === 'RET') { cu.str = s.slice(0, ec.pos) + '\n' + s.slice(ec.pos); ec.pos++; }
    else if (ev.char && ev.char.length === 1 && !ev.ctrl) { cu.str = s.slice(0, ec.pos) + ev.char + s.slice(ec.pos); ec.pos++; }
    else return true;
    cu.disp = null;
    ec.stamp++;
    ctx.redrawAll();
    return true;
  }

  function drawCurve(ctx, r, sv, base, col, dt, editing) {
    const ob = base.object;
    const cu = ob.data;
    const me = dispMesh(ob, ctx);
    const mat = M.mul(sv.persmat, ob.obmat);
    if ((dt === 'solid' || dt === 'shaded') && me.faces.length) {
      const fakeOb = Object.assign({}, ob, { data: me });
      r.depthTest = true;
      drawSolidFaces(ctx, r, sv, fakeOb, me, dt === 'shaded');
      r.depthOffset = 0.0004;
    }
    r.mvp = mat;
    const wcol = editing ? B.rgb(0, 0, 0) : col;
    if (dt === 'wire' || dt === 'bounds' || base.sel || editing || !me.faces.length) {
      if (me.faces.length && cu.cutype !== 'font' && (cu.ext1 > 0 || cu.ext2 > 0 || cu.cutype === 'surf')) B.View3D.drawMeshWire(ctx, r, sv, ob, me, wcol);
      me.wires.forEach(w => { const p = w.pts; for (let i = 0; i < p.length - 1; i++) r.line3(p[i], p[i + 1], wcol); if (w.closed && p.length > 2) r.line3(p[p.length - 1], p[0], wcol); });
    }
    r.depthTest = false;
    r.depthOffset = 0;
    if (editing && ctx.G.editCurve && cu.cutype !== 'font') {
      const ec = ctx.G.editCurve;
      r.mvp = mat;
      ec.nurbs.forEach(nu => {
        if (nu.type === 'bezier') {
          nu.bezt.forEach(b => {
            const hc = b.h1 === 'auto' ? B.rgb(144, 144, 0) : b.h1 === 'vect' ? B.rgb(64, 144, 64) : b.h1 === 'free' ? B.rgb(0, 0, 0) : B.rgb(128, 48, 96);
            r.line3(b.vec[0], b.vec[1], b.f2 || b.f1 ? B.shade(hc, 100) : hc);
            r.line3(b.vec[1], b.vec[2], b.f2 || b.f3 ? B.shade(hc, 100) : hc);
            [0, 1, 2].forEach(kk => B.Edit.drawVert(r, b.vec[kk], (kk === 0 ? b.f1 : kk === 1 ? b.f2 : b.f3) ? B.View3D.C.VERTSEL : B.View3D.C.VERT));
          });
        } else {
          const nu_ = nu.pntsu, nv = Math.max(1, nu.pntsv);
          for (let j = 0; j < nv; j++) for (let i = 0; i < nu_; i++) {
            const p = nu.bp[j * nu_ + i];
            if (i < nu_ - 1 || nu.cyclic.u) { const q = nu.bp[j * nu_ + (i + 1) % nu_]; r.line3(p.co, q.co, B.rgb(144, 112, 144), 0xCCCC); }
            if (j < nv - 1) { const q = nu.bp[(j + 1) * nu_ + i]; r.line3(p.co, q.co, B.rgb(144, 112, 144), 0xCCCC); }
          }
          nu.bp.forEach(p => B.Edit.drawVert(r, p.co, p.f ? B.View3D.C.VERTSEL : B.View3D.C.VERT));
        }
      });
    }
    if (editing && cu.cutype === 'font' && ctx.G.editCurve) {
      const ec = ctx.G.editCurve;
      const before = Object.assign({}, cu, { str: (cu.str || '').slice(0, ec.pos) });
      const lines = before.str.split('\n');
      const temp = Object.assign({}, cu, { str: lines[lines.length - 1] });
      const widths = [...temp.str].reduce((s, ch) => s + (((B.BFONT || {})[ch.charCodeAt(0)] || [250])[0] / 1000 * (cu.fsize || 1) * (cu.spacing || 1)), 0);
      const y = -(lines.length - 1) * (cu.linedist || 1) * (cu.fsize || 1) * 1.15;
      r.mvp = mat;
      r.line3([widths + (cu.xof || 0), y - 0.1 * cu.fsize + (cu.yof || 0), 0], [widths + (cu.xof || 0), y + 0.75 * cu.fsize + (cu.yof || 0), 0], B.rgb(255, 255, 255));
    }
  }

  function drawSolidFaces(ctx, r, sv, ob, me, shaded) {
    const viewv = B.View3D.viewVector(sv);
    const mat = ob.obmat;
    const nmat = M.transpose3(M.invert(mat));
    const world = me.verts.map(v => M.loc(mat, v.co));
    me.faces.forEach(f => {
      if (f.v.length < 3) return;
      const n = V.norm(M.dir(nmat, B.MeshOps.faceNormal(me, f)));
      const ma = me.mats && me.mats[f.mat || 0];
      const c = ma ? [ma.r, ma.g, ma.b] : [0.8, 0.8, 0.8];
      const d = Math.abs(V.dot(n, viewv));
      const k = shaded ? 0.2 + 0.8 * d : 0.25 + 0.75 * d;
      r.mvp = sv.persmat;
      r.polyClip(f.v.map(i => world[i]), B.rgbf(c[0] * k, c[1] * k, c[2] * k));
    });
  }

  function pickSegs(ob) {
    const me = dispMesh(ob, null);
    const segs = [];
    me.wires.forEach(w => { for (let i = 0; i < w.pts.length - 1; i++) segs.push([w.pts[i], w.pts[i + 1]]); });
    return segs;
  }

  function addCurveObject(ctx, cutype, sub) {
    if (ctx.G.obedit && ctx.G.obedit.type === (cutype === 'surf' ? 'surf' : 'curve') && ctx.G.editCurve && cutype !== 'font') {
      const nu = cutype === 'surf' ? primSurf(sub) : primCurve(sub);
      if (!nu) return;
      const ob = ctx.G.obedit;
      EditCurve.selectAll(ctx.G.editCurve, false);
      placeSpline(ctx, ob, nu);
      ctx.G.editCurve.nurbs.push(nu);
      ctx.G.editCurve.stamp++;
      ctx.redrawAll();
      return;
    }
    if (ctx.G.obedit) B.Edit.exit(ctx, true);
    const names = { curve: 'Curve', surf: 'Surf', font: 'Text' };
    const type = cutype === 'surf' ? 'surf' : cutype === 'font' ? 'font' : 'curve';
    const data = newCurveData(ctx.main, sub === 'path' ? 'CurvePath' : names[cutype], cutype);
    if (sub === 'path') { data.flag.path = true; data.flag.d3 = true; data.flag.front = data.flag.back = false; }
    if (cutype === 'curve' && (sub === 'bezier' || sub === 'nurbs')) { data.flag.front = data.flag.back = false; }
    const ob = B.ObjectOps.addObject(ctx, type, sub === 'path' ? 'CurvePath' : names[cutype], data);
    const area = B.Edit.viewArea(ctx);
    if (area) { const sv = B.View3D.setMatrices(ctx, area); ob.rot = M.toEul(M.transpose3(M.normalized3(sv.viewmat))); B.Data.whereIs(ob); }
    if (cutype === 'font') { data.str = 'Text'; B.Edit.enter(ctx, ob); return; }
    const nu = cutype === 'surf' ? primSurf(sub) : primCurve(sub);
    if (nu) data.nurbs.push(nu);
    B.Edit.enter(ctx, ob);
  }

  function placeSpline(ctx, ob, nu) {
    const area = B.Edit.viewArea(ctx);
    const inv = M.invert(ob.obmat);
    const rot = area ? M.transpose3(M.normalized3(B.View3D.setMatrices(ctx, area).viewmat)) : M.ident();
    const tf = co => M.loc(inv, V.add(M.dir(rot, co), ctx.scene.cursor));
    if (nu.type === 'bezier') nu.bezt.forEach(b => { b.vec = b.vec.map(tf); });
    else nu.bp.forEach(p => { const c = tf(p.co); p.co = [c[0], c[1], c[2], p.co[3]]; });
  }

  function editButtons(ctx, blk, ob, k, R) {
    const cu = ob.data;
    const ec = ctx.G.obedit === ob ? ctx.G.editCurve : null;
    if (cu.cutype === 'font') {
      ['Left', 'Middle', 'Right', 'Flush'].forEach((s, i) => k.row(R(430 + i * 32, 636, 460 + i * 32, 644), s, cu, 'spacemode', s.toLowerCase(), s, null, () => { cu.disp = null; }));
      k.tex(R(430, 650, 556, 658), 'TextOnCurve: ', () => (cu.textoncurve ? cu.textoncurve.name : ''), v => { cu.textoncurve = ctx.main.objects.find(o => o.name === v && o.type === 'curve') || null; }, 'Apply a deforming curve to the text');
      const N = (yt, s, key, mn, mx, st, pr) => k.num(R(430, yt, 556, yt + 8), s, cu, key, mn, mx, st, pr, s, () => { cu.disp = null; });
      N(664, 'Size:', 'fsize', 0.1, 10, 0.1, 3); N(674, 'Linedist:', 'linedist', 0, 10, 0.1, 3); N(684, 'Spacing:', 'spacing', 0, 10, 0.1, 3);
      N(694, 'Y offset:', 'yof', -50, 50, 0.1, 3); N(704, 'Shear:', 'shear', -1, 1, 0.05, 3); N(714, 'X offset:', 'xof', -50, 50, 0.1, 3);
      k.but(R(570, 636, 640, 644), 'Load Font', () => B.UI.error(ctx, 'Only the built-in Bfont is available'), 'Load a new font');
      k.tex(R(570, 650, 640, 658), 'Ob Family:', () => cu.family, v => { cu.family = v; }, 'Font family');
      k.but(R(570, 664, 640, 672), 'ToUpper', () => { cu.str = (cu.str || '').toUpperCase(); cu.disp = null; ctx.redrawAll(); }, 'Toggle between upper and lower case in editmode');
    } else {
      const nu = ec ? (ec.nurbs.find(n => (n.type === 'bezier' ? n.bezt.some(b => b.f2) : n.bp.some(p => p.f))) || ec.nurbs[0]) : cu.nurbs[0];
      if (nu) {
        const types = cu.cutype === 'surf' ? [['Poly', 'poly'], ['Nurb', 'nurbs']] : [['Poly', 'poly'], ['Bezier', 'bezier'], ['Nurb', 'nurbs']];
        types.forEach(([s, t], i) => k.but(R(430 + i * 38, 636, 466 + i * 38, 644), s, () => { if (ec) { convertSpline(nu, t); ec.stamp++; cu.disp = null; ctx.redrawAll(); } }, 'Convert spline to ' + s, nu.type === t ? COL.GREEN : null));
        if (nu.type === 'nurbs') {
          ['Uniform U', 'Endpoint U', 'Bezier U'].forEach((s, i) => k.but(R(430 + i * 42, 650, 470 + i * 42, 658), s, () => { nu.knotsu = ['uniform', 'endpoint', 'bezier'][i]; if (ec) ec.stamp++; cu.disp = null; ctx.redrawAll(); }, s, nu.knotsu === ['uniform', 'endpoint', 'bezier'][i] ? COL.GREEN : null));
          k.num(R(430, 664, 490, 672), 'Order U:', nu, 'orderu', 2, 6, 1, 0, 'Nurbs order in u-direction', () => { if (ec) ec.stamp++; cu.disp = null; });
          if (cu.cutype === 'surf') k.num(R(492, 664, 556, 672), 'Order V:', nu, 'orderv', 2, 6, 1, 0, 'Nurbs order in v-direction', () => { if (ec) ec.stamp++; cu.disp = null; });
          k.but(R(430, 676, 490, 684), 'Set Weight', () => { if (!ec) return; const w = ctx.G.curveWeight || 1; ec.nurbs.forEach(n => (n.bp || []).forEach(p => { if (p.f) p.co[3] = w; })); ec.stamp++; cu.disp = null; ctx.redrawAll(); }, 'Set weight of selected points');
          blk.num('Weight:', ...R(492, 676, 556, 684), () => ctx.G.curveWeight || 1, v => { ctx.G.curveWeight = v; }, 0.01, 100, 0.1, 3, 'Weight');
          [['1.0', 1], ['sqrt(2)/4', Math.SQRT2 / 4], ['0.25', 0.25], ['sqrt(0.5)', Math.SQRT1_2]].forEach(([s, v], i) => k.but(R(430 + i * 32, 688, 460 + i * 32, 696), s, () => { ctx.G.curveWeight = v; ctx.redrawAll(); }, 'Weight preset'));
        }
        k.num(R(430, 702, 490, 710), 'Resol U:', nu, 'resolu', 1, 128, 1, 0, 'Resolution in u-direction', () => { if (ec) ec.stamp++; cu.disp = null; });
        if (cu.cutype === 'surf') k.num(R(492, 702, 556, 710), 'Resol V:', nu, 'resolv', 1, 128, 1, 0, 'Resolution in v-direction', () => { if (ec) ec.stamp++; cu.disp = null; });
      }
    }
    if (cu.cutype !== 'surf') {
      k.num(R(570, 680, 640, 688), 'DefResolU:', cu, 'resolu', 1, 128, 1, 0, 'Default resolution', () => { cu.disp = null; });
      k.num(R(650, 636, 730, 644), 'Width:', cu, 'width', 0, 2, 0.01, 3, 'Width', () => { cu.disp = null; });
      k.num(R(650, 648, 730, 656), 'Ext1:', cu, 'ext1', 0, 5, 0.05, 3, 'Extrude depth', () => { cu.disp = null; });
      k.num(R(650, 658, 730, 666), 'Ext2:', cu, 'ext2', 0, 2, 0.02, 3, 'Bevel depth', () => { cu.disp = null; });
      k.num(R(650, 668, 730, 676), 'BevResol:', cu, 'bevresol', 0, 10, 1, 0, 'Bevel resolution', () => { cu.disp = null; });
      k.tex(R(650, 680, 730, 688), 'BevOb: ', () => (cu.bevobj ? cu.bevobj.name : ''), v => { cu.bevobj = ctx.main.objects.find(o => o.name === v && o.type === 'curve' && o !== ob) || null; cu.disp = null; }, 'Curve object name that defines the bevel shape');
      k.tog(R(740, 636, 780, 644), 'Front', cu.flag, 'front', 'Draw filled front for curves', null, () => { cu.disp = null; });
      k.tog(R(782, 636, 822, 644), 'Back', cu.flag, 'back', 'Draw filled back for curves', null, () => { cu.disp = null; });
      k.tog(R(740, 648, 822, 656), '3D', cu.flag, 'd3', 'Allow curve to be 3d, it doesn\'t fill then', null, () => { cu.disp = null; });
      if (cu.cutype === 'curve') {
        k.tog(R(740, 668, 822, 676), 'CurvePath', cu.flag, 'path', 'Make this curve a path for children');
        k.tog(R(740, 678, 822, 686), 'CurveFollow', cu.flag, 'follow', 'Children follow the path direction');
        k.num(R(740, 690, 822, 698), 'PathLen:', cu, 'pathlen', 1, 9000, 1, 0, 'Number of frames for the path');
      }
    }
    k.tog(R(740, 710, 822, 718), 'UV Orco', cu.flag, 'uvorco', 'Use UV values as original coordinates');
    k.tog(R(740, 720, 822, 728), 'No Puno Flip', cu.flag, 'noPunoFlip', "Don't flip vertex normals while render");
  }

  function convertSpline(nu, to) {
    if (nu.type === to) return;
    if (nu.type === 'bezier') {
      const pts = [];
      nu.bezt.forEach(b => { pts.push(b.vec[0], b.vec[1], b.vec[2]); });
      nu.bp = (to === 'poly' ? nu.bezt.map(b => b.vec[1]) : pts).map(c => ({ co: [c[0], c[1], c[2], 1], f: true }));
      nu.pntsu = nu.bp.length; nu.pntsv = 1; nu.orderu = to === 'poly' ? 2 : 4; nu.knotsu = to === 'poly' ? 'uniform' : 'bezier'; nu.knotsv = 'uniform'; nu.orderv = 1; nu.resolv = 1;
      delete nu.bezt;
    } else if (to === 'bezier') {
      nu.bezt = nu.bp.map(p => { const b = bezt(p.co.slice(0, 3), [-0.3, 0, 0], [0.3, 0, 0]); b.h1 = b.h2 = 'auto'; return b; });
      calcBezHandles(nu);
      delete nu.bp;
    }
    nu.type = to;
  }

  const ObCurve = {
    newData: (main, name) => newCurveData(main, name, 'curve'),
    add: (ctx, sub) => addCurveObject(ctx, 'curve', sub || 'bezier'),
    dispMesh, editButtons, convertMenu: 'Convert Curve to%t|Mesh%x0',
    convert(ctx, ob) { toMesh(ctx, ob); },
    points: cu => cu.nurbs.flatMap(nu => (nu.type === 'bezier' ? nu.bezt.map(b => b.vec[1]) : nu.bp.map(p => p.co.slice(0, 3)))),
    translate(cu, d) { cu.nurbs.forEach(nu => { if (nu.type === 'bezier') nu.bezt.forEach(b => { b.vec = b.vec.map(v => V.add(v, d)); }); else nu.bp.forEach(p => { p.co[0] += d[0]; p.co[1] += d[1]; p.co[2] += d[2]; }); }); cu.disp = null; },
    applyMat(cu, m) { cu.nurbs.forEach(nu => { if (nu.type === 'bezier') nu.bezt.forEach(b => { b.vec = b.vec.map(v => M.loc(m, v)); }); else nu.bp.forEach(p => { const c = M.loc(m, p.co); p.co = [c[0], c[1], c[2], p.co[3]]; }); }); cu.disp = null; }
  };

  function toMesh(ctx, ob) {
    const me = dispMesh(ob, ctx);
    const data = B.Data.newMesh(ctx.main, ob.data.name);
    data.verts = me.verts.map(v => ({ co: v.co.slice(), sel: false, hide: false }));
    data.faces = me.faces.map(f => ({ v: f.v.slice(), mat: f.mat || 0, smooth: f.smooth }));
    if (!data.faces.length && me.wires) {
      me.wires.forEach(w => { const off = data.verts.length; w.pts.forEach(p => data.verts.push({ co: p.slice(), sel: false, hide: false })); for (let i = 0; i < w.pts.length - 1; i++) data.faces.push({ v: [off + i, off + i + 1], mat: 0, smooth: false }); if (w.closed) data.faces.push({ v: [off + w.pts.length - 1, off], mat: 0, smooth: false }); });
    }
    data.mats = ob.data.mats.slice();
    ob.data.us--;
    ob.data = B.Data.idUser(data);
    ob.type = 'mesh';
    ob.dt = 'shaded';
  }

  B.ObTypes = B.ObTypes || {};
  B.ObTypes.curve = ObCurve;
  B.ObTypes.surf = Object.assign({}, ObCurve, { newData: (main, name) => newCurveData(main, name, 'surf'), add: (ctx, sub) => addCurveObject(ctx, 'surf', sub || 'surface'), convertMenu: 'Convert Nurbs Surf to%t|Mesh%x0' });
  B.ObTypes.font = Object.assign({}, ObCurve, { newData: (main, name) => newCurveData(main, name, 'font'), add: ctx => addCurveObject(ctx, 'font'), convertMenu: 'Convert Font to%t|Curve%x0|Mesh%x1', convert(ctx, ob, v) { if (v === 1) toMesh(ctx, ob); else fontToCurve(ctx, ob); }, points: cu => { const m = dispMesh({ data: cu }, null); return m.verts.map(x => x.co).concat(m.wires.flatMap(w => w.pts)); }, translate(cu, d) { cu.xof += d[0]; cu.yof += d[1]; cu.disp = null; } });

  function fontToCurve(ctx, ob) {
    const cu = ob.data;
    const loops = textLoops(cu);
    cu.nurbs = loops.map(l => ({ type: 'poly', bp: l.map(p => ({ co: [p[0], p[1], 0, 1], f: false })), pntsu: l.length, pntsv: 1, orderu: 2, cyclic: { u: true }, knotsu: 'uniform', resolu: 1 }));
    cu.cutype = 'curve';
    ob.type = 'curve';
    cu.disp = null;
  }

  B.EditExtra = B.EditExtra || {};
  B.EditExtra.curve = B.EditExtra.surf = B.EditExtra.font = EditCurve;
  B.DrawExtra = B.DrawExtra || {};
  B.DrawExtra.curve = B.DrawExtra.surf = B.DrawExtra.font = drawCurve;
  B.DrawExtra.pickPoints = B.DrawExtra.pickPoints || {};
  B.DrawExtra.pickPoints.curve = B.DrawExtra.pickPoints.surf = B.DrawExtra.pickPoints.font = pickSegs;
  B.Curve = { newCurveData, primCurve, primSurf, splinePoints, nurbsCurvePoints, nurbsSurface, dispMesh, pathPoint, textLoops, fillMesh, calcBezHandles, editKey };
})(globalThis.B204 = globalThis.B204 || {});
