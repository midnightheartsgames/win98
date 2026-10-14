(function (B) {
  'use strict';
  const V = B.V;

  function step(me) {
    const verts = me.verts.map(v => v.co);
    const faces = me.faces.filter(f => f.v.length >= 3);
    const loose = me.faces.filter(f => f.v.length === 2);
    const nv = verts.length;
    const edgeMap = new Map();
    const ekey = (a, b) => (a < b ? a + ':' + b : b + ':' + a);
    const facePts = faces.map(f => V.mul(f.v.reduce((s, i) => V.add(s, verts[i]), [0, 0, 0]), 1 / f.v.length));
    faces.forEach((f, fi) => {
      for (let i = 0; i < f.v.length; i++) {
        const a = f.v[i], b = f.v[(i + 1) % f.v.length], k = ekey(a, b);
        let e = edgeMap.get(k);
        if (!e) { e = { a, b, faces: [] }; edgeMap.set(k, e); }
        e.faces.push(fi);
      }
    });
    loose.forEach(f => { const k = ekey(f.v[0], f.v[1]); if (!edgeMap.has(k)) edgeMap.set(k, { a: f.v[0], b: f.v[1], faces: [], loose: true }); });
    const outVerts = [];
    const edgeIdx = new Map();
    const vAdjFaces = verts.map(() => []), vAdjEdges = verts.map(() => []);
    faces.forEach((f, fi) => f.v.forEach(i => vAdjFaces[i].push(fi)));
    edgeMap.forEach(e => { vAdjEdges[e.a].push(e); vAdjEdges[e.b].push(e); });
    for (let i = 0; i < nv; i++) {
      const P = verts[i];
      const es = vAdjEdges[i];
      const bnd = es.filter(e => e.faces.length < 2);
      let np;
      if (!es.length) np = P;
      else if (bnd.length >= 2 || vAdjFaces[i].length === 0) {
        const nb = bnd.slice(0, 2).map(e => verts[e.a === i ? e.b : e.a]);
        np = nb.length === 2 ? V.add(V.mul(P, 0.75), V.mul(V.add(nb[0], nb[1]), 0.125)) : P;
      } else {
        const n = es.length;
        const F = V.mul(vAdjFaces[i].reduce((s, fi) => V.add(s, facePts[fi]), [0, 0, 0]), 1 / vAdjFaces[i].length);
        const R = V.mul(es.reduce((s, e) => V.add(s, V.mid(verts[e.a], verts[e.b])), [0, 0, 0]), 1 / n);
        np = V.mul(V.add(V.add(F, V.mul(R, 2)), V.mul(P, n - 3)), 1 / n);
      }
      outVerts.push({ co: np, sel: false, hide: false });
    }
    edgeMap.forEach((e, k) => {
      let p;
      if (e.faces.length === 2) p = V.mul(V.add(V.add(verts[e.a], verts[e.b]), V.add(facePts[e.faces[0]], facePts[e.faces[1]])), 0.25);
      else p = V.mid(verts[e.a], verts[e.b]);
      edgeIdx.set(k, outVerts.length);
      outVerts.push({ co: p, sel: false, hide: false });
    });
    const outFaces = [];
    faces.forEach((f, fi) => {
      const fpi = outVerts.length;
      outVerts.push({ co: facePts[fi], sel: false, hide: false });
      const n = f.v.length;
      for (let i = 0; i < n; i++) {
        const a = f.v[i], prev = f.v[(i + n - 1) % n], next = f.v[(i + 1) % n];
        outFaces.push({ v: [a, edgeIdx.get(ekey(a, next)), fpi, edgeIdx.get(ekey(prev, a))], mat: f.mat || 0, smooth: true });
      }
    });
    loose.forEach(f => { const m = edgeIdx.get(ekey(f.v[0], f.v[1])); outFaces.push({ v: [f.v[0], m], mat: 0, smooth: false }, { v: [m, f.v[1]], mat: 0, smooth: false }); });
    return { verts: outVerts, faces: outFaces };
  }

  function subdivide(me, levels) {
    let cur = { verts: me.verts.filter(() => true).map(v => ({ co: v.co.slice(), sel: false, hide: false })), faces: me.faces.map(f => ({ v: f.v.slice(), mat: f.mat || 0, smooth: f.smooth })) };
    for (let i = 0; i < Math.max(1, Math.min(6, levels)); i++) {
      if (cur.faces.length * Math.pow(4, 1) > 200000) break;
      cur = step(cur);
    }
    return Object.assign({ mats: me.mats, flag: me.flag, smesh: false, sticky: null, vcols: null, texspace: me.texspace, name: me.name, code: 'ME', stamp: 'ss' }, cur);
  }

  const cache = new WeakMap();
  function cached(me, levels) {
    const c = cache.get(me);
    const key = (me.stamp || 0) + ':' + levels + ':' + me.verts.length + ':' + me.faces.length + ':' + (me.verts[0] ? me.verts[0].co.join(',') : '');
    if (c && c.key === key) return c.mesh;
    const mesh = subdivide(me, levels);
    cache.set(me, { key, mesh });
    return mesh;
  }

  B.Subsurf = { step, subdivide, cached };
})(globalThis.B204 = globalThis.B204 || {});
