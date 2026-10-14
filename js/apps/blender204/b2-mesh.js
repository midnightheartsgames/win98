(function (B) {
  'use strict';
  const V = B.V, M = B.M;

  function vert(co, sel = true) { return { co: co.slice(), sel, hide: false }; }

  function prim(kind, opts = {}) {
    const verts = [], faces = [];
    const add = co => { verts.push(vert(co)); return verts.length - 1; };
    const face = (...v) => faces.push({ v, mat: 0, smooth: false });
    const n = opts.verts || 32;
    if (kind === 'plane') {
      [[1, 1, 0], [1, -1, 0], [-1, -1, 0], [-1, 1, 0]].forEach(add);
      face(0, 1, 2, 3);
    } else if (kind === 'cube') {
      [[1, 1, -1], [1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, 1], [1, -1, 1], [-1, -1, 1], [-1, 1, 1]].forEach(add);
      face(0, 1, 2, 3); face(4, 7, 6, 5); face(0, 4, 5, 1); face(1, 5, 6, 2); face(2, 6, 7, 3); face(4, 0, 3, 7);
    } else if (kind === 'circle') {
      for (let i = 0; i < n; i++) { const a = -i / n * Math.PI * 2; add([Math.sin(a), Math.cos(a), 0]); }
      for (let i = 0; i < n; i++) face(i, (i + 1) % n);
    } else if (kind === 'cylinder' || kind === 'tube' || kind === 'cone') {
      const top = kind === 'cone' ? null : [];
      const bot = [];
      for (let i = 0; i < n; i++) {
        const a = -i / n * Math.PI * 2;
        const x = Math.sin(a), y = Math.cos(a);
        bot.push(add([x, y, -1]));
        if (top) top.push(add([x, y, 1]));
      }
      if (kind === 'cone') {
        const apex = add([0, 0, 1]);
        for (let i = 0; i < n; i++) face(bot[i], bot[(i + 1) % n], apex);
      } else {
        for (let i = 0; i < n; i++) face(bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]);
      }
      if (kind !== 'tube') {
        const cb = add([0, 0, -1]);
        for (let i = 0; i < n; i++) face(bot[(i + 1) % n], bot[i], cb);
        if (top) {
          const ct = add([0, 0, 1]);
          for (let i = 0; i < n; i++) face(top[i], top[(i + 1) % n], ct);
        }
      }
    } else if (kind === 'uvsphere') {
      const seg = opts.segments || 32, rings = opts.rings || 32;
      const np = add([0, 0, 1]);
      const ringIdx = [];
      for (let j = 1; j < rings; j++) {
        const th = j / rings * Math.PI;
        const row = [];
        for (let i = 0; i < seg; i++) {
          const ph = -i / seg * Math.PI * 2;
          row.push(add([Math.sin(th) * Math.sin(ph), Math.sin(th) * Math.cos(ph), Math.cos(th)]));
        }
        ringIdx.push(row);
      }
      const sp = add([0, 0, -1]);
      for (let i = 0; i < seg; i++) {
        const k = (i + 1) % seg;
        face(np, ringIdx[0][i], ringIdx[0][k]);
        for (let j = 0; j < ringIdx.length - 1; j++) face(ringIdx[j][i], ringIdx[j + 1][i], ringIdx[j + 1][k], ringIdx[j][k]);
        face(ringIdx[ringIdx.length - 1][k], ringIdx[ringIdx.length - 1][i], sp);
      }
    } else if (kind === 'icosphere') {
      const t = (1 + Math.sqrt(5)) / 2;
      const base = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v => V.norm(v));
      let tris = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
      const pts = base.slice();
      const sub = Math.max(0, Math.min(5, opts.subdiv == null ? 2 : opts.subdiv));
      for (let s = 0; s < sub; s++) {
        const cache = new Map();
        const midp = (a, b) => {
          const key = a < b ? a + ':' + b : b + ':' + a;
          if (cache.has(key)) return cache.get(key);
          pts.push(V.norm(V.mid(pts[a], pts[b])));
          cache.set(key, pts.length - 1);
          return pts.length - 1;
        };
        const nt = [];
        tris.forEach(([a, b, c]) => { const ab = midp(a, b), bc = midp(b, c), ca = midp(c, a); nt.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); });
        tris = nt;
      }
      pts.forEach(add);
      tris.forEach(([a, b, c]) => face(a, b, c));
    } else if (kind === 'grid') {
      const xr = Math.max(2, opts.xres || 32), yr = Math.max(2, opts.yres || 32);
      for (let j = 0; j < yr; j++) for (let i = 0; i < xr; i++) add([-1 + 2 * i / (xr - 1), -1 + 2 * j / (yr - 1), 0]);
      for (let j = 0; j < yr - 1; j++) for (let i = 0; i < xr - 1; i++) { const a = j * xr + i; face(a, a + 1, a + 1 + xr, a + xr); }
    }
    return { verts, faces };
  }

  function edgeKey(a, b) { return a < b ? a * 1048576 + b : b * 1048576 + a; }

  function edgesOf(me) {
    const map = new Map();
    me.faces.forEach((f, fi) => {
      const v = f.v;
      if (v.length === 2) { const k = edgeKey(v[0], v[1]); if (!map.has(k)) map.set(k, { v: [v[0], v[1]], faces: [] }); return; }
      for (let i = 0; i < v.length; i++) {
        const a = v[i], b = v[(i + 1) % v.length], k = edgeKey(a, b);
        let e = map.get(k);
        if (!e) { e = { v: [a, b], faces: [] }; map.set(k, e); }
        e.faces.push(fi);
      }
    });
    return map;
  }

  function looseEdgeIndex(me) {
    const idx = new Map();
    me.faces.forEach((f, i) => { if (f.v.length === 2) idx.set(edgeKey(f.v[0], f.v[1]), i); });
    return idx;
  }

  function cleanup(me) {
    const seen = new Set();
    const edgeInFace = new Set();
    me.faces.forEach(f => { if (f.v.length > 2) for (let i = 0; i < f.v.length; i++) edgeInFace.add(edgeKey(f.v[i], f.v[(i + 1) % f.v.length])); });
    me.faces = me.faces.filter(f => {
      if (new Set(f.v).size !== f.v.length) {
        const u = [...new Set(f.v)];
        if (u.length < 2) return false;
        f.v = u;
      }
      if (f.v.length === 2) {
        const k = edgeKey(f.v[0], f.v[1]);
        if (edgeInFace.has(k) || seen.has(k)) return false;
        seen.add(k);
      }
      return true;
    });
    me.stamp = (me.stamp || 0) + 1;
    return me;
  }

  function removeUnusedVerts(me, keepLooseSelected) {
    const used = new Uint8Array(me.verts.length);
    me.faces.forEach(f => f.v.forEach(i => { used[i] = 1; }));
    const remap = new Int32Array(me.verts.length).fill(-1);
    const verts = [];
    me.verts.forEach((v, i) => {
      if (used[i] || keepLooseSelected) { remap[i] = verts.length; verts.push(v); }
    });
    me.verts = verts;
    me.faces.forEach(f => { f.v = f.v.map(i => remap[i]); });
    me.stamp = (me.stamp || 0) + 1;
    return remap;
  }

  function compact(me, removeFn) {
    const remap = new Int32Array(me.verts.length).fill(-1);
    const verts = [];
    me.verts.forEach((v, i) => { if (!removeFn(v, i)) { remap[i] = verts.length; verts.push(v); } });
    me.verts = verts;
    me.faces = me.faces.filter(f => f.v.every(i => remap[i] >= 0)).map(f => Object.assign(f, { v: f.v.map(i => remap[i]) }));
    me.stamp = (me.stamp || 0) + 1;
  }

  function selected(me) { const s = []; me.verts.forEach((v, i) => { if (v.sel && !v.hide) s.push(i); }); return s; }

  function faceSelected(me, f) { return f.v.every(i => me.verts[i].sel && !me.verts[i].hide); }

  function del(me, mode) {
    const sel = v => v.sel && !v.hide;
    if (mode === 'verts') {
      compact(me, sel);
    } else if (mode === 'all') {
      me.verts = []; me.faces = [];
    } else if (mode === 'edges') {
      const kill = new Set();
      edgesOf(me).forEach((e, k) => { if (sel(me.verts[e.v[0]]) && sel(me.verts[e.v[1]])) kill.add(k); });
      me.faces = me.faces.filter(f => {
        if (f.v.length === 2) return !kill.has(edgeKey(f.v[0], f.v[1]));
        for (let i = 0; i < f.v.length; i++) if (kill.has(edgeKey(f.v[i], f.v[(i + 1) % f.v.length]))) return false;
        return true;
      });
      const used = new Set(); me.faces.forEach(f => f.v.forEach(i => used.add(i)));
      compact(me, (v, i) => sel(v) && !used.has(i));
    } else if (mode === 'faces') {
      const keepEdgeVerts = new Set();
      me.faces = me.faces.filter(f => !(f.v.length > 2 && faceSelected(me, f)));
      me.faces.forEach(f => f.v.forEach(i => keepEdgeVerts.add(i)));
      compact(me, (v, i) => sel(v) && !keepEdgeVerts.has(i));
    } else if (mode === 'edgesfaces') {
      me.faces = me.faces.filter(f => !faceSelected(me, f));
      const used = new Set(); me.faces.forEach(f => f.v.forEach(i => used.add(i)));
      compact(me, (v, i) => sel(v) && !used.has(i));
    } else if (mode === 'onlyfaces') {
      me.faces = me.faces.filter(f => !(f.v.length > 2 && faceSelected(me, f)));
    }
    cleanup(me);
  }

  function duplicateSel(me) {
    const map = new Map();
    selected(me).forEach(i => { map.set(i, me.verts.length); me.verts.push(vert(me.verts[i].co, true)); me.verts[i].sel = false; });
    const nf = [];
    me.faces.forEach(f => { if (f.v.every(i => map.has(i))) nf.push({ v: f.v.map(i => map.get(i)), mat: f.mat, smooth: f.smooth }); });
    const edgesInFaces = new Set();
    nf.forEach(f => { if (f.v.length > 2) for (let i = 0; i < f.v.length; i++) edgesInFaces.add(edgeKey(f.v[i], f.v[(i + 1) % f.v.length])); });
    edgesOf(me).forEach(e => {
      if (map.has(e.v[0]) && map.has(e.v[1])) {
        const a = map.get(e.v[0]), b = map.get(e.v[1]);
        if (!edgesInFaces.has(edgeKey(a, b))) nf.push({ v: [a, b], mat: 0, smooth: false });
      }
    });
    me.faces.push(...nf);
    cleanup(me);
    return map;
  }

  function extrude(me) {
    const sel = new Set(selected(me));
    if (!sel.size) return false;
    const edges = edgesOf(me);
    const selFaceSet = new Set();
    me.faces.forEach((f, fi) => { if (f.v.length > 2 && f.v.every(i => sel.has(i))) selFaceSet.add(fi); });
    const inSelFace = new Set();
    selFaceSet.forEach(fi => me.faces[fi].v.forEach(i => inSelFace.add(i)));
    const map = new Map();
    sel.forEach(i => { map.set(i, me.verts.length); me.verts.push(vert(me.verts[i].co, true)); });
    const newFaces = [];
    const edgeUsed = new Set();
    edges.forEach(e => {
      const [a, b] = e.v;
      if (!sel.has(a) || !sel.has(b)) return;
      const sf = e.faces.filter(fi => selFaceSet.has(fi));
      if (sf.length >= 2) return;
      edgeUsed.add(a); edgeUsed.add(b);
      if (sf.length === 1) {
        const src = me.faces[sf[0]];
        const f = src.v;
        const ia = f.indexOf(a), ib = f.indexOf(b);
        const va = (ia + 1) % f.length === ib ? a : b, vb = va === a ? b : a;
        newFaces.push({ v: [vb, va, map.get(va), map.get(vb)], mat: src.mat, smooth: src.smooth });
      } else newFaces.push({ v: [a, b, map.get(b), map.get(a)], mat: 0, smooth: false });
    });
    sel.forEach(i => { if (!edgeUsed.has(i) && !inSelFace.has(i)) newFaces.push({ v: [i, map.get(i)], mat: 0, smooth: false }); });
    selFaceSet.forEach(fi => { const f = me.faces[fi]; f.v = f.v.map(i => map.get(i)); });
    me.faces.push(...newFaces);
    sel.forEach(i => { me.verts[i].sel = false; });
    const used = new Set();
    me.faces.forEach(f => f.v.forEach(i => used.add(i)));
    compact(me, (v, i) => sel.has(i) && !used.has(i));
    cleanup(me);
    return true;
  }

  function makeEdgeFace(me) {
    const s = selected(me);
    if (s.length === 2) {
      const k = edgeKey(s[0], s[1]);
      if (edgesOf(me).has(k)) return 'Already a face';
      me.faces.push({ v: [s[0], s[1]], mat: 0, smooth: false });
      cleanup(me);
      return null;
    }
    if (s.length === 3 || s.length === 4) {
      let order = s;
      if (s.length === 4) order = orderQuad(me, s);
      const exists = me.faces.some(f => f.v.length === order.length && order.every(i => f.v.includes(i)));
      if (exists) return 'Already a face';
      me.faces.push({ v: order, mat: 0, smooth: false });
      cleanup(me);
      return null;
    }
    return "Can't make edge/face";
  }

  function orderQuad(me, s) {
    const p = s.map(i => me.verts[i].co);
    const c = V.mul(p.reduce((a, b) => V.add(a, b), [0, 0, 0]), 0.25);
    let n = V.cross(V.sub(p[1], p[0]), V.sub(p[2], p[0]));
    if (V.len(n) < 1e-9) n = V.cross(V.sub(p[2], p[0]), V.sub(p[3], p[0]));
    n = V.norm(n);
    let u = V.norm(V.sub(p[0], c));
    const w = V.cross(n, u);
    const ang = p.map(q => { const d = V.sub(q, c); return Math.atan2(V.dot(d, w), V.dot(d, u)); });
    return s.map((v, i) => [v, ang[i]]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
  }

  function selectAll(me, on) { me.verts.forEach(v => { if (!v.hide) v.sel = on; }); }
  function anySelected(me) { return me.verts.some(v => v.sel && !v.hide); }

  function selectLinked(me, seeds, on = true) {
    const adj = me.verts.map(() => []);
    me.faces.forEach(f => { for (let i = 0; i < f.v.length; i++) { const a = f.v[i], b = f.v[(i + 1) % f.v.length]; adj[a].push(b); adj[b].push(a); } });
    const stack = seeds.slice();
    const seen = new Set(stack);
    while (stack.length) {
      const i = stack.pop();
      if (!me.verts[i].hide) me.verts[i].sel = on;
      adj[i].forEach(j => { if (!seen.has(j) && !me.verts[j].hide) { seen.add(j); stack.push(j); } });
    }
  }

  function hide(me) { me.verts.forEach(v => { if (v.sel) { v.hide = true; v.sel = false; } }); }
  function reveal(me) { me.verts.forEach(v => { if (v.hide) { v.hide = false; v.sel = true; } }); }
  function selectSwap(me) { me.verts.forEach(v => { if (!v.hide) v.sel = !v.sel; }); }

  function flipNormals(me) { me.faces.forEach(f => { if (f.v.length > 2 && faceSelected(me, f)) f.v.reverse(); }); me.stamp = (me.stamp || 0) + 1; }

  function faceNormal(me, f) {
    const p = f.v.map(i => me.verts[i].co);
    let n = [0, 0, 0];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      n[0] += (a[1] - b[1]) * (a[2] + b[2]);
      n[1] += (a[2] - b[2]) * (a[0] + b[0]);
      n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return V.norm(n);
  }

  function faceCenter(me, f) { return V.mul(f.v.reduce((s, i) => V.add(s, me.verts[i].co), [0, 0, 0]), 1 / f.v.length); }

  function recalcNormals(me, inside) {
    const faces = me.faces.map((f, i) => i).filter(i => me.faces[i].v.length > 2 && faceSelected(me, me.faces[i]));
    if (!faces.length) return;
    const fset = new Set(faces);
    const edgeFaces = new Map();
    faces.forEach(fi => { const v = me.faces[fi].v; for (let i = 0; i < v.length; i++) { const k = edgeKey(v[i], v[(i + 1) % v.length]); if (!edgeFaces.has(k)) edgeFaces.set(k, []); edgeFaces.get(k).push(fi); } });
    const done = new Set();
    const centerAll = V.mul(faces.reduce((s, fi) => V.add(s, faceCenter(me, me.faces[fi])), [0, 0, 0]), 1 / faces.length);
    while (done.size < faces.length) {
      let seed = -1, far = -1;
      faces.forEach(fi => { if (done.has(fi)) return; const d = V.dist(faceCenter(me, me.faces[fi]), centerAll); if (d > far) { far = d; seed = fi; } });
      const sf = me.faces[seed];
      const out = V.sub(faceCenter(me, sf), centerAll);
      if (V.dot(faceNormal(me, sf), out) < 0) sf.v.reverse();
      done.add(seed);
      const queue = [seed];
      while (queue.length) {
        const fi = queue.shift();
        const v = me.faces[fi].v;
        for (let i = 0; i < v.length; i++) {
          const a = v[i], b = v[(i + 1) % v.length];
          (edgeFaces.get(edgeKey(a, b)) || []).forEach(nj => {
            if (done.has(nj) || !fset.has(nj)) return;
            const nv = me.faces[nj].v;
            const ia = nv.indexOf(a), ib = nv.indexOf(b);
            if ((ia + 1) % nv.length === ib) nv.reverse();
            done.add(nj);
            queue.push(nj);
          });
        }
      }
    }
    if (inside) faces.forEach(fi => me.faces[fi].v.reverse());
    me.stamp = (me.stamp || 0) + 1;
  }

  function subdivide(me, mode, randfac) {
    const sel = v => v.sel && !v.hide;
    const mids = new Map();
    const edges = edgesOf(me);
    const normals = mode === 'smooth' ? vertexNormals(me) : null;
    edges.forEach((e, k) => {
      const [a, b] = e.v;
      if (!sel(me.verts[a]) || !sel(me.verts[b])) return;
      let co = V.mid(me.verts[a].co, me.verts[b].co);
      const len = V.dist(me.verts[a].co, me.verts[b].co);
      if (mode === 'fractal') {
        const r = randfac || 1;
        co = V.add(co, [(Math.random() - 0.5) * len * r * 0.5, (Math.random() - 0.5) * len * r * 0.5, (Math.random() - 0.5) * len * r * 0.5]);
      } else if (mode === 'smooth') {
        const n = V.norm(V.add(normals[a], normals[b]));
        const na = normals[a], nb = normals[b];
        const bend = (V.dot(V.sub(me.verts[b].co, me.verts[a].co), V.sub(na, nb))) * 0.125;
        co = V.add(co, V.mul(n, bend));
      }
      mids.set(k, me.verts.length);
      me.verts.push(vert(co, true));
    });
    const out = [];
    me.faces.forEach(f => {
      const v = f.v;
      if (v.length === 2) {
        const m = mids.get(edgeKey(v[0], v[1]));
        if (m != null) out.push({ v: [v[0], m], mat: f.mat, smooth: f.smooth }, { v: [m, v[1]], mat: f.mat, smooth: f.smooth });
        else out.push(f);
        return;
      }
      const em = v.map((a, i) => mids.get(edgeKey(a, v[(i + 1) % v.length])));
      const cnt = em.filter(x => x != null).length;
      const F = arr => out.push({ v: arr, mat: f.mat, smooth: f.smooth });
      if (cnt === 0) { out.push(f); return; }
      if (v.length === 3) {
        if (cnt === 3) { F([v[0], em[0], em[2]]); F([em[0], v[1], em[1]]); F([em[2], em[1], v[2]]); F([em[0], em[1], em[2]]); }
        else if (cnt === 1) { const i = em.findIndex(x => x != null); F([v[i], em[i], v[(i + 2) % 3]]); F([em[i], v[(i + 1) % 3], v[(i + 2) % 3]]); }
        else { const j = em.findIndex(x => x == null); const a = v[j], b = v[(j + 1) % 3], c = v[(j + 2) % 3]; const m1 = em[(j + 1) % 3], m2 = em[(j + 2) % 3]; F([a, b, m1]); F([a, m1, m2]); F([m1, c, m2]); }
      } else {
        if (cnt === 4) {
          const c = me.verts.length;
          me.verts.push(vert(V.mul(v.reduce((s, i) => V.add(s, me.verts[i].co), [0, 0, 0]), 0.25), true));
          if (mode === 'fractal' || mode === 'smooth') {
            const cc = me.verts[c].co;
            const avg = V.mul(em.reduce((s, i) => V.add(s, me.verts[i].co), [0, 0, 0]), 0.25);
            me.verts[c].co = mode === 'smooth' ? V.add(avg, V.mul(V.sub(avg, cc), 0.5)) : avg;
          }
          F([v[0], em[0], c, em[3]]); F([em[0], v[1], em[1], c]); F([c, em[1], v[2], em[2]]); F([em[3], c, em[2], v[3]]);
        } else if (cnt === 2 && em[0] != null && em[2] != null) { F([v[0], em[0], em[2], v[3]]); F([em[0], v[1], v[2], em[2]]); }
        else if (cnt === 2 && em[1] != null && em[3] != null) { F([v[0], v[1], em[1], em[3]]); F([em[3], em[1], v[2], v[3]]); }
        else if (cnt === 1) { const i = em.findIndex(x => x != null); F([v[i], em[i], v[(i + 3) % 4]]); F([em[i], v[(i + 1) % 4], v[(i + 2) % 4]]); F([em[i], v[(i + 2) % 4], v[(i + 3) % 4]]); }
        else if (cnt === 2) { const i = em.findIndex((x, j) => x != null && em[(j + 1) % 4] != null); F([v[i], em[i], v[(i + 3) % 4]]); F([em[i], v[(i + 1) % 4], em[(i + 1) % 4]]); F([em[i], em[(i + 1) % 4], v[(i + 3) % 4]]); F([em[(i + 1) % 4], v[(i + 2) % 4], v[(i + 3) % 4]]); }
        else { const j = em.findIndex(x => x == null); const i = (j + 1) % 4; const c = me.verts.length; me.verts.push(vert(V.mul(v.reduce((s, q) => V.add(s, me.verts[q].co), [0, 0, 0]), 0.25), true)); F([v[i], em[i], c, v[j]]); F([em[i], v[(i + 1) % 4], em[(i + 1) % 4], c]); F([c, em[(i + 1) % 4], v[(i + 2) % 4], em[(i + 2) % 4]]); F([em[(j + 3) % 4], v[j], c]); }
      }
    });
    me.faces = out;
    cleanup(me);
  }

  function vertexNormals(me) {
    const n = me.verts.map(() => [0, 0, 0]);
    me.faces.forEach(f => { if (f.v.length < 3) return; const fn = faceNormal(me, f); f.v.forEach(i => { n[i] = V.add(n[i], fn); }); });
    return n.map(v => (V.len(v) > 0 ? V.norm(v) : [0, 0, 1]));
  }

  function removeDoubles(me, limit) {
    const sel = selected(me);
    const target = new Int32Array(me.verts.length).map((_, i) => i);
    let removed = 0;
    const cell = Math.max(limit, 1e-6) * 2;
    const grid = new Map();
    const key = co => Math.floor(co[0] / cell) + ',' + Math.floor(co[1] / cell) + ',' + Math.floor(co[2] / cell);
    sel.forEach(i => {
      const co = me.verts[i].co;
      const gx = Math.floor(co[0] / cell), gy = Math.floor(co[1] / cell), gz = Math.floor(co[2] / cell);
      let found = -1;
      for (let dx = -1; dx <= 1 && found < 0; dx++) for (let dy = -1; dy <= 1 && found < 0; dy++) for (let dz = -1; dz <= 1 && found < 0; dz++) {
        const list = grid.get((gx + dx) + ',' + (gy + dy) + ',' + (gz + dz));
        if (list) for (const j of list) if (V.dist(me.verts[j].co, co) <= limit) { found = j; break; }
      }
      if (found >= 0) { target[i] = found; removed++; }
      else { const k = key(co); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); }
    });
    if (!removed) return 0;
    me.faces.forEach(f => { f.v = f.v.map(i => target[i]); });
    me.faces = me.faces.filter(f => new Set(f.v).size >= 2);
    me.faces.forEach(f => { f.v = f.v.filter((x, i, a) => a.indexOf(x) === i); });
    const drop = new Set(); target.forEach((t, i) => { if (t !== i) drop.add(i); });
    compact(me, (v, i) => drop.has(i));
    cleanup(me);
    return removed;
  }

  function smooth(me) {
    const adj = me.verts.map(() => new Set());
    me.faces.forEach(f => { for (let i = 0; i < f.v.length; i++) { const a = f.v[i], b = f.v[(i + 1) % f.v.length]; adj[a].add(b); adj[b].add(a); } });
    const nc = me.verts.map((v, i) => {
      if (!v.sel || v.hide || !adj[i].size) return v.co;
      const avg = V.mul([...adj[i]].reduce((s, j) => V.add(s, me.verts[j].co), [0, 0, 0]), 1 / adj[i].size);
      return V.lerp(v.co, avg, 0.5);
    });
    me.verts.forEach((v, i) => { v.co = nc[i]; });
  }

  function toSphere(me, fac, center) {
    const s = selected(me);
    if (!s.length) return;
    const c = center || V.mul(s.reduce((a, i) => V.add(a, me.verts[i].co), [0, 0, 0]), 1 / s.length);
    const rad = s.reduce((a, i) => a + V.dist(me.verts[i].co, c), 0) / s.length;
    s.forEach(i => {
      const d = V.sub(me.verts[i].co, c);
      const l = V.len(d);
      if (l < 1e-9) return;
      me.verts[i].co = V.lerp(me.verts[i].co, V.add(c, V.mul(d, rad / l)), fac);
    });
  }

  function noise(me, tex, amount) {
    selected(me).forEach(i => {
      const co = me.verts[i].co;
      const n = B.Tex && tex ? B.Tex.sample(tex, co).tin : B.noise3(co[0] * 4, co[1] * 4, co[2] * 4) * 0.5 + 0.5;
      me.verts[i].co = [co[0], co[1], co[2] + (n - 0.5) * amount];
    });
  }

  function hashVerts(me, rnd = Math.random) {
    const s = selected(me);
    const perm = s.slice();
    for (let i = perm.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
    reorder(me, s, perm);
  }

  function xsort(me, viewDir) {
    const s = selected(me);
    const dir = viewDir || [1, 0, 0];
    const perm = s.slice().sort((a, b) => V.dot(me.verts[a].co, dir) - V.dot(me.verts[b].co, dir));
    reorder(me, s, perm);
  }

  function reorder(me, slots, order) {
    const old = me.verts.slice();
    const remap = new Int32Array(me.verts.length).map((_, i) => i);
    slots.forEach((slot, k) => { me.verts[slot] = old[order[k]]; remap[order[k]] = slot; });
    me.faces.forEach(f => { f.v = f.v.map(i => remap[i]); });
    me.stamp = (me.stamp || 0) + 1;
  }

  function spin(me, opts) {
    const steps = Math.max(1, opts.steps), deg = opts.degr * B.DEG;
    const axis = V.norm(opts.axis), center = opts.center;
    const dup = !!opts.dup;
    const turns = Math.max(1, opts.turns || 1);
    const offset = opts.offset || [0, 0, 0];
    const total = dup ? steps : steps * turns;
    const sel = selected(me);
    if (!sel.length) return false;
    const selSet = new Set(sel);
    const srcEdges = [];
    edgesOf(me).forEach(e => { if (selSet.has(e.v[0]) && selSet.has(e.v[1])) srcEdges.push(e.v); });
    const srcFaces = me.faces.filter(f => f.v.length > 2 && f.v.every(i => selSet.has(i))).map(f => ({ v: f.v.slice(), mat: f.mat, smooth: f.smooth }));
    let prev = new Map(sel.map(i => [i, i]));
    const rotAt = k => {
      const ang = (opts.clockwise ? -1 : 1) * deg * k / steps;
      const R = M.fromQuat(B.Q.axisAngle(axis, ang));
      const off = V.mul(offset, k / steps);
      return co => V.add(V.add(M.dir(R, V.sub(co, center)), center), off);
    };
    const origCo = new Map(sel.map(i => [i, me.verts[i].co.slice()]));
    const closed = !dup && Math.abs(Math.abs(opts.degr) - 360) < 1e-6 && !V.len(offset) && turns === 1;
    for (let k = 1; k <= total; k++) {
      const tf = rotAt(k);
      const cur = new Map();
      if (closed && k === total) sel.forEach(i => cur.set(i, i));
      else sel.forEach(i => { cur.set(i, me.verts.length); me.verts.push(vert(tf(origCo.get(i)), false)); });
      if (dup) {
        srcFaces.forEach(f => me.faces.push({ v: f.v.map(i => cur.get(i)), mat: f.mat, smooth: f.smooth }));
        srcEdges.forEach(([a, b]) => me.faces.push({ v: [cur.get(a), cur.get(b)], mat: 0, smooth: false }));
      } else {
        srcEdges.forEach(([a, b]) => me.faces.push({ v: [prev.get(a), prev.get(b), cur.get(b), cur.get(a)], mat: 0, smooth: false }));
        sel.forEach(i => {
          const lone = !srcEdges.some(e => e.includes(i));
          if (lone) me.faces.push({ v: [prev.get(i), cur.get(i)], mat: 0, smooth: false });
        });
      }
      prev = cur;
    }
    me.verts.forEach(v => { v.sel = false; });
    prev.forEach(i => { me.verts[i].sel = true; });
    if (dup && !opts.keepOriginal) compact(me, (v, i) => selSet.has(i));
    cleanup(me);
    return true;
  }

  function extrudeRepeat(me, steps, offsetVec) {
    for (let k = 0; k < steps; k++) {
      if (!extrude(me)) return false;
      selected(me).forEach(i => { me.verts[i].co = V.add(me.verts[i].co, offsetVec); });
    }
    return true;
  }

  function split(me) {
    const sel = new Set(selected(me));
    const selFaces = me.faces.filter(f => f.v.length > 2 && f.v.every(i => sel.has(i)));
    if (!selFaces.length) return false;
    const sharedWithOthers = new Set();
    me.faces.forEach(f => { if (!selFaces.includes(f)) f.v.forEach(i => { if (sel.has(i)) sharedWithOthers.add(i); }); });
    const map = new Map();
    sharedWithOthers.forEach(i => { map.set(i, me.verts.length); me.verts.push(vert(me.verts[i].co, true)); me.verts[i].sel = false; });
    selFaces.forEach(f => { f.v = f.v.map(i => (map.has(i) ? map.get(i) : i)); });
    me.faces = me.faces.filter(f => !(f.v.length === 2 && f.v.every(i => sel.has(i)) && !selFaces.some(sf => sf.v.includes(f.v[0]) && sf.v.includes(f.v[1]))));
    cleanup(me);
    return true;
  }

  function separate(me) {
    const sel = new Set(selected(me));
    if (!sel.size) return null;
    const out = { verts: [], faces: [] };
    const map = new Map();
    sel.forEach(i => { map.set(i, out.verts.length); out.verts.push(vert(me.verts[i].co, true)); });
    out.faces = me.faces.filter(f => f.v.every(i => sel.has(i))).map(f => ({ v: f.v.map(i => map.get(i)), mat: f.mat, smooth: f.smooth }));
    compact(me, (v, i) => sel.has(i));
    cleanup(me);
    cleanup(out);
    return out;
  }

  function polyTriangulate(points2d) {
    const n = points2d.length;
    if (n < 3) return [];
    let area = 0;
    for (let i = 0; i < n; i++) { const a = points2d[i], b = points2d[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
    const idx = [...Array(n).keys()];
    if (area < 0) idx.reverse();
    const tris = [];
    const isEar = (i0, i1, i2, list) => {
      const a = points2d[i0], b = points2d[i1], c = points2d[i2];
      const cr = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (cr <= 1e-12) return false;
      for (const j of list) {
        if (j === i0 || j === i1 || j === i2) continue;
        const p = points2d[j];
        const d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
        const d2 = (c[0] - b[0]) * (p[1] - b[1]) - (c[1] - b[1]) * (p[0] - b[0]);
        const d3 = (a[0] - c[0]) * (p[1] - c[1]) - (a[1] - c[1]) * (p[0] - c[0]);
        if (d1 >= 0 && d2 >= 0 && d3 >= 0) return false;
      }
      return true;
    };
    let guard = 0;
    while (idx.length > 3 && guard++ < 10000) {
      let cut = false;
      for (let i = 0; i < idx.length; i++) {
        const i0 = idx[(i + idx.length - 1) % idx.length], i1 = idx[i], i2 = idx[(i + 1) % idx.length];
        if (isEar(i0, i1, i2, idx)) { tris.push([i0, i1, i2]); idx.splice(i, 1); cut = true; break; }
      }
      if (!cut) { tris.push([idx[0], idx[1], idx[2]]); idx.splice(1, 1); }
    }
    if (idx.length === 3) tris.push([idx[0], idx[1], idx[2]]);
    return tris;
  }

  function edgeLoops(me) {
    const sel = new Set(selected(me));
    const adj = new Map();
    edgesOf(me).forEach(e => {
      const [a, b] = e.v;
      if (!sel.has(a) || !sel.has(b)) return;
      const inSelFace = e.faces.some(fi => me.faces[fi].v.every(i => sel.has(i)));
      if (inSelFace) return;
      if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []);
      adj.get(a).push(b); adj.get(b).push(a);
    });
    const used = new Set(), loops = [];
    adj.forEach((_, start) => {
      if (used.has(start)) return;
      const loop = [start];
      used.add(start);
      let prev = -1, cur = start;
      for (;;) {
        const nxt = (adj.get(cur) || []).find(n => n !== prev && !used.has(n));
        if (nxt == null) break;
        loop.push(nxt); used.add(nxt); prev = cur; cur = nxt;
      }
      if (loop.length >= 3) loops.push(loop);
    });
    return loops;
  }

  function fill(me) {
    const loops = edgeLoops(me);
    let made = 0;
    loops.forEach(loop => {
      const pts = loop.map(i => me.verts[i].co);
      const c = V.mul(pts.reduce((a, b) => V.add(a, b), [0, 0, 0]), 1 / pts.length);
      let n = [0, 0, 0];
      for (let i = 0; i < pts.length; i++) n = V.add(n, V.cross(V.sub(pts[i], c), V.sub(pts[(i + 1) % pts.length], c)));
      n = V.norm(n);
      if (V.len(n) < 0.5) n = [0, 0, 1];
      let u = Math.abs(n[0]) < 0.9 ? V.norm(V.cross(n, [1, 0, 0])) : V.norm(V.cross(n, [0, 1, 0]));
      const w = V.cross(n, u);
      const p2 = pts.map(p => { const d = V.sub(p, c); return [V.dot(d, u), V.dot(d, w)]; });
      polyTriangulate(p2).forEach(t => { me.faces.push({ v: t.map(k => loop[k]), mat: 0, smooth: false }); made++; });
    });
    cleanup(me);
    return made;
  }

  function beautyFill(me) {
    let changed = true, guard = 0;
    while (changed && guard++ < 50) {
      changed = false;
      const edges = edgesOf(me);
      for (const e of edges.values()) {
        if (e.faces.length !== 2) continue;
        const f1 = me.faces[e.faces[0]], f2 = me.faces[e.faces[1]];
        if (f1.v.length !== 3 || f2.v.length !== 3 || !faceSelected(me, f1) || !faceSelected(me, f2)) continue;
        const [a, b] = e.v;
        const c = f1.v.find(x => x !== a && x !== b), d = f2.v.find(x => x !== a && x !== b);
        if (c == null || d == null || c === d) continue;
        const P = i => me.verts[i].co;
        const minAng = (x, y, z) => {
          const ang = (p, q, r) => Math.acos(B.clamp(V.dot(V.norm(V.sub(q, p)), V.norm(V.sub(r, p))), -1, 1));
          return Math.min(ang(P(x), P(y), P(z)), ang(P(y), P(z), P(x)), ang(P(z), P(x), P(y)));
        };
        const before = Math.min(minAng(a, b, c), minAng(a, b, d));
        const after = Math.min(minAng(c, d, a), minAng(c, d, b));
        if (after > before + 1e-4) {
          const ia = f1.v.indexOf(a), ib = f1.v.indexOf(b);
          const forward = (ia + 1) % 3 === ib;
          f1.v = forward ? [a, d, c] : [d, a, c];
          f2.v = forward ? [d, b, c] : [b, d, c];
          if (V.dot(faceNormal(me, f1), faceNormal(me, f2)) < 0) f2.v.reverse();
          changed = true;
          break;
        }
      }
    }
    cleanup(me);
  }

  function centre(me, mode) {
    if (!me.verts.length) return [0, 0, 0];
    const pts = me.verts.map(v => v.co);
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    pts.forEach(p => { for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], p[i]); mx[i] = Math.max(mx[i], p[i]); } });
    return mode === 'median' ? V.mul(pts.reduce((a, b) => V.add(a, b), [0, 0, 0]), 1 / pts.length) : V.mid(mn, mx);
  }

  function translate(me, d) { me.verts.forEach(v => { v.co = V.add(v.co, d); }); me.stamp = (me.stamp || 0) + 1; }

  function copyMesh(me) {
    return { verts: me.verts.map(v => ({ co: v.co.slice(), sel: !!v.sel, hide: !!v.hide })), faces: me.faces.map(f => ({ v: f.v.slice(), mat: f.mat || 0, smooth: !!f.smooth, uv: f.uv ? f.uv.map(u => u.slice()) : undefined, col: f.col ? f.col.slice() : undefined, tf: f.tf ? Object.assign({}, f.tf) : undefined })) };
  }

  function triangulate(me) {
    const out = [];
    me.faces.forEach(f => {
      if (f.v.length === 4) { out.push([f.v[0], f.v[1], f.v[2], f], [f.v[0], f.v[2], f.v[3], f]); }
      else if (f.v.length === 3) out.push([f.v[0], f.v[1], f.v[2], f]);
    });
    return out;
  }

  function intersectSel(me) {
    const sel = new Set(selected(me));
    const faces = me.faces.filter(f => f.v.length >= 3 && f.v.every(i => sel.has(i)));
    const tris = [];
    faces.forEach(f => { if (f.v.length === 4) tris.push([f.v[0], f.v[1], f.v[2]], [f.v[0], f.v[2], f.v[3]]); else tris.push(f.v.slice()); });
    let added = 0;
    const P = i => me.verts[i].co;
    const segTri = (p, q, t) => {
      const a = P(t[0]), b = P(t[1]), c = P(t[2]);
      const n = V.cross(V.sub(b, a), V.sub(c, a));
      const dp = V.dot(V.sub(p, a), n), dq = V.dot(V.sub(q, a), n);
      if (dp * dq >= 0) return null;
      const tt = dp / (dp - dq);
      const x = V.lerp(p, q, tt);
      const e1 = V.dot(V.cross(V.sub(b, a), V.sub(x, a)), n), e2 = V.dot(V.cross(V.sub(c, b), V.sub(x, b)), n), e3 = V.dot(V.cross(V.sub(a, c), V.sub(x, c)), n);
      return e1 >= 0 && e2 >= 0 && e3 >= 0 ? x : null;
    };
    const cuts = [];
    for (let i = 0; i < tris.length; i++) for (let j = i + 1; j < tris.length; j++) {
      const A = tris[i], Bt = tris[j];
      if (A.some(v => Bt.includes(v))) continue;
      const pts = [];
      for (let k = 0; k < 3; k++) {
        const x1 = segTri(P(A[k]), P(A[(k + 1) % 3]), Bt); if (x1) pts.push(x1);
        const x2 = segTri(P(Bt[k]), P(Bt[(k + 1) % 3]), A); if (x2) pts.push(x2);
      }
      if (pts.length >= 2) cuts.push([pts[0], pts[1]]);
    }
    cuts.forEach(([p, q]) => {
      const a = me.verts.length; me.verts.push(vert(p, true));
      const b = me.verts.length; me.verts.push(vert(q, true));
      me.faces.push({ v: [a, b], mat: 0, smooth: false });
      added++;
    });
    cleanup(me);
    return added;
  }

  B.MeshOps = {
    vert, prim, edgeKey, edgesOf, looseEdgeIndex, cleanup, removeUnusedVerts, compact, selected, faceSelected, del, duplicateSel, extrude,
    makeEdgeFace, selectAll, anySelected, selectLinked, hide, reveal, selectSwap, flipNormals, faceNormal, faceCenter, recalcNormals,
    subdivide, vertexNormals, removeDoubles, smooth, toSphere, noise, hashVerts, xsort, spin, extrudeRepeat, split, separate,
    polyTriangulate, edgeLoops, fill, beautyFill, centre, translate, copyMesh, triangulate, intersectSel
  };
})(globalThis.B204 = globalThis.B204 || {});
