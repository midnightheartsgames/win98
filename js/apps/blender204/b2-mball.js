(function (B) {
  'use strict';
  const V = B.V, M = B.M;

  function newData(main, name) {
    return main.add('MB', name, { elems: [], threshold: 0.6, wiresize: 0.4, rendersize: 0.2, update: 'always', mats: [], stamp: 0 });
  }

  function newElem(co) { return { type: 'ball', co: co.slice(), rad: 2, s: 2, len: 1, negative: false, sel: true }; }

  function field(elems, x, y, z) {
    let f = 0;
    for (const e of elems) {
      let dx = x - e.co[0], dy = y - e.co[1], dz = z - e.co[2];
      if (e.type === 'tubex') dx = Math.max(0, Math.abs(dx) - e.len);
      else if (e.type === 'tubey') dy = Math.max(0, Math.abs(dy) - e.len);
      else if (e.type === 'tubez') dz = Math.max(0, Math.abs(dz) - e.len);
      const d2 = dx * dx + dy * dy + dz * dz, r2 = e.rad * e.rad;
      if (d2 >= r2) continue;
      const t = 1 - d2 / r2;
      f += (e.negative ? -1 : 1) * e.s * t * t * t;
    }
    return f;
  }

  const TETS = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]];
  const CORNER = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];

  function polygonize(mb, size) {
    const elems = mb.elems;
    const verts = [], faces = [];
    if (!elems.length) return { verts, faces };
    const thr = mb.threshold;
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    elems.forEach(e => { const ex = e.rad + (e.type.startsWith('tube') ? e.len : 0); for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], e.co[i] - ex); mx[i] = Math.max(mx[i], e.co[i] + ex); } });
    size = Math.max(size, Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 60);
    const nx = Math.ceil((mx[0] - mn[0]) / size) + 1, ny = Math.ceil((mx[1] - mn[1]) / size) + 1, nz = Math.ceil((mx[2] - mn[2]) / size) + 1;
    const vals = new Float32Array(nx * ny * nz);
    const gi = (i, j, k) => (k * ny + j) * nx + i;
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) vals[gi(i, j, k)] = field(elems, mn[0] + i * size, mn[1] + j * size, mn[2] + k * size) - thr;
    const edgeVert = new Map();
    const pos = (i, j, k) => [mn[0] + i * size, mn[1] + j * size, mn[2] + k * size];
    const interp = (a, b) => {
      const ka = a[3], kb = b[3];
      const key = ka < kb ? ka * 1e8 + kb : kb * 1e8 + ka;
      let vi = edgeVert.get(key);
      if (vi != null) return vi;
      const t = a[4] / (a[4] - b[4]);
      verts.push({ co: V.lerp(a.slice(0, 3), b.slice(0, 3), t), sel: false, hide: false });
      vi = verts.length - 1;
      edgeVert.set(key, vi);
      return vi;
    };
    for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const c = CORNER.map(o => { const ii = i + o[0], jj = j + o[1], kk = k + o[2]; const p = pos(ii, jj, kk); return [p[0], p[1], p[2], gi(ii, jj, kk), vals[gi(ii, jj, kk)]]; });
      let any = false, all = true;
      c.forEach(q => { if (q[4] > 0) any = true; else all = false; });
      if (!any || all) continue;
      TETS.forEach(t => {
        const p = t.map(n => c[n]);
        const ins = p.map(q => q[4] > 0);
        const cnt = ins.filter(Boolean).length;
        if (cnt === 0 || cnt === 4) return;
        const inI = [0, 1, 2, 3].filter(n => ins[n]), outI = [0, 1, 2, 3].filter(n => !ins[n]);
        const orient = tri => {
          const a = verts[tri[0]].co, b = verts[tri[1]].co, cc = verts[tri[2]].co;
          const n = V.cross(V.sub(b, a), V.sub(cc, a));
          const centerIn = V.mul(inI.reduce((s, q) => V.add(s, p[q].slice(0, 3)), [0, 0, 0]), 1 / inI.length);
          if (V.dot(n, V.sub(centerIn, a)) > 0) tri.reverse();
          faces.push({ v: tri, mat: 0, smooth: true });
        };
        if (cnt === 1 || cnt === 3) {
          const lone = cnt === 1 ? inI[0] : outI[0];
          const others = [0, 1, 2, 3].filter(n => n !== lone);
          orient(others.map(o => interp(p[lone], p[o])));
        } else {
          const [a, b] = inI, [cc, d] = outI;
          const q = [interp(p[a], p[cc]), interp(p[a], p[d]), interp(p[b], p[d]), interp(p[b], p[cc])];
          orient([q[0], q[1], q[2]]);
          orient([q[0], q[2], q[3]]);
        }
      });
    }
    return { verts, faces };
  }

  function dispMesh(ob, ctx, render) {
    const mb = ob.data;
    const elems = ctx && ctx.G.obedit === ob && ctx.G.editMball ? ctx.G.editMball.elems : mb.elems;
    const size = render ? mb.rendersize : mb.wiresize * (mb.update === 'half' ? 2 : mb.update === 'fast' ? 3 : 1);
    const key = JSON.stringify([elems, mb.threshold, size]);
    const cache = render ? '_rdisp' : 'disp';
    if (mb[cache] && mb[cache + 'Key'] === key) return mb[cache];
    const me = polygonize(Object.assign({}, mb, { elems }), size);
    me.mats = mb.mats;
    me.flag = { twoside: false };
    me.stamp = Math.random();
    mb[cache] = me;
    mb[cache + 'Key'] = key;
    return me;
  }

  function draw(ctx, r, sv, base, col, dt, editing) {
    const ob = base.object;
    const me = dispMesh(ob, ctx, false);
    if (dt === 'solid' || dt === 'shaded') {
      r.depthTest = true;
      const world = me.verts.map(v => M.loc(ob.obmat, v.co));
      const nmat = M.transpose3(M.invert(ob.obmat));
      const vv = B.View3D.viewVector(sv);
      const ma = me.mats && me.mats[0];
      const c = ma ? [ma.r, ma.g, ma.b] : [0.8, 0.8, 0.8];
      r.mvp = sv.persmat;
      me.faces.forEach(f => {
        const n = V.norm(M.dir(nmat, B.MeshOps.faceNormal(me, f)));
        const k = 0.25 + 0.75 * Math.abs(V.dot(n, vv));
        r.polyClip(f.v.map(i => world[i]), B.rgbf(c[0] * k, c[1] * k, c[2] * k));
      });
      r.depthOffset = 0.0004;
    }
    if (dt === 'wire' || dt === 'bounds' || base.sel || editing) B.View3D.drawMeshWire(ctx, r, sv, ob, me, editing ? B.rgb(0, 0, 0) : col);
    r.depthTest = false;
    r.depthOffset = 0;
    if (editing && ctx.G.editMball) {
      const s0 = M.colScale(ob.obmat)[0];
      ctx.G.editMball.elems.forEach(e => {
        const c = B.View3D.project(sv, M.loc(ob.obmat, e.co));
        const px = B.View3D.project(sv, V.add(M.loc(ob.obmat, e.co), V.mul(M.dir(sv.viewinv, [1, 0, 0]), e.rad * s0)));
        if (!c || !px) return;
        const rr = Math.hypot(px[0] - c[0], px[1] - c[1]);
        B.View3D.circlePix(r, c[0], c[1], rr, e.sel ? B.rgb(255, 120, 120) : B.rgb(160, 60, 60));
        B.View3D.circlePix(r, c[0], c[1], rr * 0.85, e.sel ? B.rgb(255, 255, 120) : B.rgb(80, 80, 40));
        B.Edit.drawVert(r, e.co, e.sel ? B.View3D.C.VERTSEL : B.View3D.C.VERT);
      });
    }
  }

  const Edit = {
    enter(ctx, ob) { ctx.G.obedit = ob; ctx.G.editMball = { elems: JSON.parse(JSON.stringify(ob.data.elems)) }; ctx.redrawAll(); return true; },
    exit(ctx, save) { const ob = ctx.G.obedit; if (save && ctx.G.editMball) { ob.data.elems = ctx.G.editMball.elems; ob.data.disp = null; } ctx.G.editMball = null; },
    points(ctx) { return ctx.G.editMball ? ctx.G.editMball.elems.map(e => ({ co: e.co, sel: e.sel })) : []; },
    transPoints(ctx) {
      return ctx.G.editMball.elems.map(e => ({ co: e.co.slice(), sel: e.sel, w: e.sel ? 1 : 0, apply: loc => { e.co = loc; }, restore: o => { e.co = o.slice(); } }));
    },
    pick(ctx, area, ev) {
      const ob = ctx.G.obedit, em = ctx.G.editMball;
      const sv = B.View3D.setMatrices(ctx, area);
      let best = null, bd = 30;
      em.elems.forEach(e => { const s = B.View3D.project(sv, M.loc(ob.obmat, e.co)); if (!s) return; const d = Math.hypot(s[0] - ev.x, s[1] - ev.y); if (d < bd) { bd = d; best = e; } });
      if (!ev.shift) em.elems.forEach(e => { e.sel = false; });
      if (best) best.sel = ev.shift ? !best.sel : true;
      ctx.redrawAll();
    },
    borderSelect(ctx, sv, inside, select) { const ob = ctx.G.obedit; ctx.G.editMball.elems.forEach(e => { if (inside(B.View3D.project(sv, M.loc(ob.obmat, e.co)))) e.sel = select; }); },
    key(ctx, area, ev) {
      const em = ctx.G.editMball;
      const k = ev.key;
      if (k === 'A' && !ev.ctrl && !ev.shift) { const any = em.elems.some(e => e.sel); em.elems.forEach(e => { e.sel = !any; }); ctx.redrawAll(); return true; }
      if ((k === 'X' || k === 'DEL') && !ev.ctrl) { B.UI.okee(ctx, 'Erase selected').then(ok => { if (ok) { em.elems = em.elems.filter(e => !e.sel); ctx.redrawAll(); } }); return true; }
      if (k === 'D' && ev.shift) { const dup = em.elems.filter(e => e.sel).map(e => Object.assign({}, e, { co: e.co.slice() })); em.elems.forEach(e => { e.sel = false; }); em.elems.push(...dup); B.Transform.start(ctx, area, 'grab', { mouse: ctx.mouse }); return true; }
      return false;
    }
  };

  function add(ctx) {
    if (ctx.G.obedit && ctx.G.obedit.type === 'mball' && ctx.G.editMball) {
      const ob = ctx.G.obedit;
      ctx.G.editMball.elems.forEach(e => { e.sel = false; });
      ctx.G.editMball.elems.push(newElem(M.loc(M.invert(ob.obmat), ctx.scene.cursor)));
      ctx.redrawAll();
      return;
    }
    if (ctx.G.obedit) B.Edit.exit(ctx, true);
    const data = newData(ctx.main, 'Meta');
    data.elems.push(newElem([0, 0, 0]));
    const ob = B.ObjectOps.addObject(ctx, 'mball', 'Meta', data);
    B.Edit.enter(ctx, ob);
  }

  function editButtons(ctx, blk, ob, k, R) {
    const mb = ob.data;
    k.num(R(430, 636, 520, 644), 'Wiresize:', mb, 'wiresize', 0.05, 1, 0.05, 3, 'Polygonization resolution in 3D window', () => { mb.disp = null; });
    k.num(R(430, 646, 520, 654), 'Rendersize:', mb, 'rendersize', 0.05, 1, 0.05, 3, 'Polygonization resolution in rendering', () => { mb._rdisp = null; });
    k.num(R(430, 656, 520, 664), 'Threshold:', mb, 'threshold', 0.01, 5, 0.05, 3, 'Defines influence of meta elements', () => { mb.disp = null; });
    k.label(430, 668, 'Update:');
    ['always', 'half', 'fast', 'never'].forEach((v, i) => k.row(R(430 + i * 30, 676, 458 + i * 30, 684), ['Always', 'Half Res', 'Fast', 'Never'][i], mb, 'update', v, 'Update mode'));
    const em = ctx.G.obedit === ob ? ctx.G.editMball : null;
    const e = em && em.elems.find(x => x.sel);
    if (e) {
      k.num(R(560, 636, 650, 644), 'Stiffness:', e, 's', 0, 10, 0.1, 3, 'Stiffness of the active element');
      k.num(R(560, 646, 650, 654), 'Radius:', e, 'rad', 0.05, 20, 0.1, 3, 'Radius of the active element');
      if (e.type.startsWith('tube')) k.num(R(560, 656, 650, 664), 'Len:', e, 'len', 0, 20, 0.1, 3, 'Tube length');
      k.tog(R(560, 668, 650, 676), 'Negative', e, 'negative', 'Make the active element subtract influence');
      ['ball', 'tubex', 'tubey', 'tubez'].forEach((v, i) => k.row(R(560 + i * 24, 680, 582 + i * 24, 688), ['Ball', 'TubeX', 'TubeY', 'TubeZ'][i], e, 'type', v, 'Element type'));
    }
  }

  B.ObTypes = B.ObTypes || {};
  B.ObTypes.mball = {
    newData, add, dispMesh: (ob, ctx) => dispMesh(ob, ctx, true), editButtons, convertMenu: 'Convert MetaBall to%t|Mesh (keep orginal)%x0',
    convert(ctx, ob) {
      const me = dispMesh(ob, ctx, true);
      const data = B.Data.newMesh(ctx.main, ob.data.name);
      data.verts = me.verts.map(v => ({ co: v.co.slice(), sel: false, hide: false }));
      data.faces = me.faces.map(f => ({ v: f.v.slice(), mat: 0, smooth: true }));
      data.mats = ob.data.mats.slice();
      const nob = B.ObjectOps.addObject(ctx, 'mesh', ob.name, data);
      nob.loc = ob.loc.slice(); nob.rot = ob.rot.slice(); nob.size = ob.size.slice();
      B.Data.whereIs(nob);
    },
    points: mb => mb.elems.map(e => e.co),
    translate(mb, d) { mb.elems.forEach(e => { e.co = V.add(e.co, d); }); mb.disp = null; }
  };
  B.EditExtra = B.EditExtra || {};
  B.EditExtra.mball = Edit;
  B.DrawExtra = B.DrawExtra || {};
  B.DrawExtra.mball = draw;
  B.DrawExtra.pickPoints = B.DrawExtra.pickPoints || {};
  B.DrawExtra.pickPoints.mball = ob => { const me = dispMesh(ob, null, false); const segs = []; me.faces.forEach(f => { for (let i = 0; i < f.v.length; i++) segs.push([me.verts[f.v[i]].co, me.verts[f.v[(i + 1) % f.v.length]].co]); }); return segs.length ? segs : ob.data.elems.map(e => [e.co, e.co]); };
  B.MBall = { field, polygonize };
})(globalThis.B204 = globalThis.B204 || {});
