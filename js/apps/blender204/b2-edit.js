(function (B) {
  'use strict';
  const V = B.V, M = B.M, rgb = B.rgb;
  const MO = B.MeshOps;

  function editable(ob) { return ob && (ob.type === 'mesh' || (B.EditExtra && B.EditExtra[ob.type])); }

  function enter(ctx, ob) {
    if (!editable(ob)) return false;
    if (ob.data && ob.data.lib) { B.UI.error(ctx, "Can't edit libdata"); return false; }
    if (ob.type !== 'mesh') return B.EditExtra[ob.type].enter(ctx, ob);
    ctx.G.obedit = ob;
    ctx.G.editMesh = MO.copyMesh(ob.data);
    ctx.G.editOrig = MO.copyMesh(ob.data);
    ctx.G.f.vertexpaint = false;
    ctx.G.f.faceselect = false;
    ctx.redrawAll();
    return true;
  }

  function exit(ctx, save = true) {
    const ob = ctx.G.obedit;
    if (!ob) return;
    if (ob.type !== 'mesh') { B.EditExtra[ob.type].exit(ctx, save); ctx.G.obedit = null; ctx.redrawAll(); return; }
    if (save && ctx.G.editMesh) {
      const em = ctx.G.editMesh;
      ob.data.verts = em.verts.map(v => ({ co: v.co.slice(), sel: !!v.sel, hide: !!v.hide }));
      ob.data.faces = em.faces.map(f => Object.assign({}, f, { v: f.v.slice() }));
      ob.data.stamp = (ob.data.stamp || 0) + 1;
      if (ob.data.key && B.Anim) B.Anim.updateKeyFromEdit(ctx, ob);
    }
    ctx.G.obedit = null;
    ctx.G.editMesh = null;
    ctx.G.editOrig = null;
    ctx.redrawAll();
  }

  function toggle(ctx) {
    if (ctx.G.obedit) { exit(ctx, true); return; }
    const base = ctx.scene.basact;
    if (!base || !(base.object.lay & ctx.scene.lay)) return;
    if (!editable(base.object)) return;
    enter(ctx, base.object);
  }

  function editPoints(ctx) {
    const ob = ctx.G.obedit;
    if (!ob) return [];
    if (ob.type !== 'mesh') return B.EditExtra[ob.type].points(ctx);
    return ctx.G.editMesh.verts.filter(v => !v.hide);
  }

  function drawEdit(ctx, r, sv, ob, me, dt) {
    const mvp = M.mul(sv.persmat, ob.obmat);
    r.mvp = mvp;
    const verts = me.verts;
    const C = B.View3D.C;
    const opts = ctx.G.editOpts || {};
    r.depthTest = dt === 'solid' || dt === 'shaded';
    r.depthOffset = 0.0008;
    if (opts.drawFaces) {
      for (const f of me.faces) {
        if (f.v.length < 3 || !MO.faceSelected(me, f)) continue;
        const c = MO.faceCenter(me, f);
        f.v.forEach((i, k) => r.line3(V.lerp(verts[i].co, c, 0.15), V.lerp(verts[f.v[(k + 1) % f.v.length]].co, c, 0.15), C.FACESEL));
      }
    }
    for (const [a, b] of B.View3D.meshEdges(me)) {
      if (verts[a].hide || verts[b].hide) continue;
      r.line3(verts[a].co, verts[b].co, C.EDGE);
    }
    if (opts.drawNormals) {
      const ns = opts.normalSize || 0.1;
      for (const f of me.faces) {
        if (f.v.length < 3) continue;
        const c = MO.faceCenter(me, f), n = MO.faceNormal(me, f);
        r.line3(c, V.add(c, V.mul(n, ns)), C.NORMAL);
      }
    }
    r.depthOffset = 0.0016;
    const unsel = [], sel = [];
    verts.forEach(v => { if (!v.hide) (v.sel ? sel : unsel).push(v); });
    unsel.forEach(v => drawVert(r, v.co, C.VERT));
    sel.forEach(v => drawVert(r, v.co, C.VERTSEL));
    r.depthTest = false;
    r.depthOffset = 0;
  }

  function drawVert(r, co, col) {
    const s = r.toScreen(co);
    if (!s) return;
    const x = Math.floor(s[0]), y = Math.floor(s[1]);
    if (r.depthTest) {
      const i = (r.h - 1 - y) * r.w + x;
      if (x >= r.cx1 && x <= r.cx2 && y >= r.cy1 && y <= r.cy2 && s[2] - 0.003 > r.depth[i]) return;
    }
    r.px(x, y, col); r.px(x + 1, y, col); r.px(x, y + 1, col); r.px(x + 1, y + 1, col);
  }

  function pick(ctx, area, ev) {
    const ob = ctx.G.obedit;
    if (ob.type !== 'mesh') { B.EditExtra[ob.type].pick(ctx, area, ev); return; }
    const sv = B.View3D.setMatrices(ctx, area);
    const me = ctx.G.editMesh;
    let best = -1, bestD = 75;
    const lastPick = ctx.G.lastVertPick;
    const cands = [];
    me.verts.forEach((v, i) => {
      if (v.hide) return;
      const s = B.View3D.project(sv, M.loc(ob.obmat, v.co));
      if (!s) return;
      let d = Math.hypot(s[0] - ev.x, s[1] - ev.y);
      if (v.sel) d += 5;
      if (d < bestD) { bestD = d; best = i; }
      if (d < 8) cands.push(i);
    });
    if (cands.length > 1 && lastPick != null && cands.includes(lastPick)) best = cands[(cands.indexOf(lastPick) + 1) % cands.length];
    if (best < 0) return;
    ctx.G.lastVertPick = best;
    if (ev.shift) me.verts[best].sel = !me.verts[best].sel;
    else { MO.selectAll(me, false); me.verts[best].sel = true; }
    ctx.G.activeVert = best;
    ctx.redrawAll();
  }

  function borderSelect(ctx, sv, inside, select) {
    const ob = ctx.G.obedit;
    if (ob.type !== 'mesh') { B.EditExtra[ob.type].borderSelect(ctx, sv, inside, select); return; }
    ctx.G.editMesh.verts.forEach(v => { if (!v.hide && inside(B.View3D.project(sv, M.loc(ob.obmat, v.co)))) v.sel = select; });
  }

  function changed(ctx) {
    const em = ctx.G.editMesh;
    if (em) em.stamp = (em.stamp || 0) + 1;
    ctx.redrawAll();
  }

  function viewArea(ctx) {
    return ctx.screen.areas.find(a => a.type === 'view3d' && a === ctx.lastView3d) || ctx.screen.areas.find(a => a.type === 'view3d');
  }

  function viewAxis(ctx) {
    const a = viewArea(ctx);
    if (!a) return [0, 0, 1];
    const sv = B.View3D.setMatrices(ctx, a);
    return B.View3D.viewVector(sv);
  }

  function toLocal(ctx, worldVec, isDir) {
    const inv = M.invert(ctx.G.obedit.obmat);
    return isDir ? M.dir(inv, worldVec) : M.loc(inv, worldVec);
  }

  function addPrimitive(ctx, kind, opts) {
    const area = viewArea(ctx);
    const sv = area ? B.View3D.setMatrices(ctx, area) : null;
    const rot = sv ? M.transpose3(M.normalized3(sv.viewmat)) : M.ident();
    let ob = ctx.G.obedit;
    const sce = ctx.scene;
    const cursor = sv && sv.localview ? sv.localview.cursor : sce.cursor;
    if (!ob || ob.type !== 'mesh') {
      if (ob) exit(ctx, true);
      const names = { plane: 'Plane', cube: 'Cube', circle: 'Circle', uvsphere: 'Sphere', icosphere: 'Sphere', cylinder: 'Cylinder', tube: 'Tube', cone: 'Cone', grid: 'Grid' };
      ob = B.ObjectOps.addObject(ctx, 'mesh', names[kind] || 'Mesh');
      ob.loc = V.copy(cursor);
      B.Data.whereIs(ob);
      enter(ctx, ob);
    }
    const me = ctx.G.editMesh;
    MO.selectAll(me, false);
    const p = MO.prim(kind, opts);
    const inv = M.invert(ob.obmat);
    const off = me.verts.length;
    p.verts.forEach(v => {
      const world = V.add(M.dir(rot, v.co), cursor);
      v.co = M.loc(inv, world);
      v.sel = true;
      me.verts.push(v);
    });
    p.faces.forEach(f => { f.v = f.v.map(i => i + off); me.faces.push(f); });
    changed(ctx);
  }

  function selectedCount(me) { return me.verts.filter(v => v.sel && !v.hide).length; }

  function deleteMenu(ctx) {
    B.UI.pupmenu(ctx, 'ERASE %t|Vertices%x10|Edges%x1|Faces%x2|All%x3|Edges & Faces%x4|Only Faces%x5').then(v => {
      const map = { 10: 'verts', 1: 'edges', 2: 'faces', 3: 'all', 4: 'edgesfaces', 5: 'onlyfaces' };
      if (map[v] == null) return;
      MO.del(ctx.G.editMesh, map[v]);
      changed(ctx);
    });
  }

  function specials(ctx) {
    B.UI.pupmenu(ctx, 'Specials%t|Subdivide%x1|Subdivide Fractal%x2|Subdivide Smooth%x3|Remove Doubles%x4|Hide%x5|Reveal%x6|Select swap%x7|Flip Normals %x8|Smooth %x9').then(v => {
      const me = ctx.G.editMesh;
      if (v === 1) MO.subdivide(me, 'plain');
      else if (v === 2) { B.UI.button(ctx, 'Rand fac:', 5, -100, 100, 0).then(f => { if (f != null) { MO.subdivide(me, 'fractal', f / 10); changed(ctx); } }); return; }
      else if (v === 3) MO.subdivide(me, 'smooth');
      else if (v === 4) { const n = MO.removeDoubles(me, ctx.G.editOpts.limit || 0.001); B.UI.notice(ctx, 'Removed: ' + n); }
      else if (v === 5) MO.hide(me);
      else if (v === 6) MO.reveal(me);
      else if (v === 7) MO.selectSwap(me);
      else if (v === 8) MO.flipNormals(me);
      else if (v === 9) MO.smooth(me);
      else return;
      changed(ctx);
    });
  }

  function snapMenu(ctx, area) {
    B.UI.pupmenu(ctx, 'SNAP %t|Sel -> Grid%x1|Sel -> Curs%x2|Curs-> Grid%x3|Curs-> Sel%x4').then(v => {
      if (v < 1 || v == null) return;
      B.Transform.snap(ctx, area, v);
    });
  }

  function key(ctx, area, ev) {
    const ob = ctx.G.obedit;
    if (ob.type !== 'mesh') return B.EditExtra[ob.type].key ? B.EditExtra[ob.type].key(ctx, area, ev) : false;
    const me = ctx.G.editMesh;
    const k = ev.key;
    const plain = !ev.ctrl && !ev.alt && !ev.shift;
    if (k === 'A' && plain) { MO.selectAll(me, !MO.anySelected(me)); changed(ctx); return true; }
    if ((k === 'X' || k === 'DEL') && plain) { deleteMenu(ctx); return true; }
    if (k === 'E' && plain) {
      if (!selectedCount(me)) return true;
      B.UI.okee(ctx, 'Extrude').then(ok => {
        if (!ok) return;
        if (!MO.extrude(me)) { B.UI.error(ctx, "Can't extrude"); return; }
        changed(ctx);
        B.Transform.start(ctx, area, 'grab', { mouse: ctx.mouse });
      });
      return true;
    }
    if (k === 'D' && ev.shift && !ev.ctrl && !ev.alt) {
      if (!selectedCount(me)) return true;
      MO.duplicateSel(me);
      changed(ctx);
      B.Transform.start(ctx, area, 'grab', { mouse: ctx.mouse });
      return true;
    }
    if (k === 'F' && plain) { const err = MO.makeEdgeFace(me); if (err) B.UI.error(ctx, err); changed(ctx); return true; }
    if (k === 'F' && ev.shift && !ev.ctrl && !ev.alt) { MO.fill(me); changed(ctx); return true; }
    if (k === 'F' && ev.alt && !ev.ctrl) { MO.beautyFill(me); changed(ctx); return true; }
    if (k === 'W' && plain) { specials(ctx); return true; }
    if (k === 'H' && plain) { MO.hide(me); changed(ctx); return true; }
    if (k === 'H' && ev.alt) { MO.reveal(me); changed(ctx); return true; }
    if (k === 'L' && plain) {
      const sv = B.View3D.setMatrices(ctx, area);
      let best = -1, bd = 75;
      me.verts.forEach((v, i) => { if (v.hide) return; const s = B.View3D.project(sv, M.loc(ob.obmat, v.co)); if (!s) return; const d = Math.hypot(s[0] - ev.x, s[1] - ev.y); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) MO.selectLinked(me, [best], true);
      changed(ctx);
      return true;
    }
    if (k === 'L' && ev.shift && !ev.ctrl) {
      const sv = B.View3D.setMatrices(ctx, area);
      let best = -1, bd = 75;
      me.verts.forEach((v, i) => { if (v.hide) return; const s = B.View3D.project(sv, M.loc(ob.obmat, v.co)); if (!s) return; const d = Math.hypot(s[0] - ev.x, s[1] - ev.y); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) MO.selectLinked(me, [best], false);
      changed(ctx);
      return true;
    }
    if (k === 'L' && ev.ctrl) { MO.selectLinked(me, MO.selected(me), true); changed(ctx); return true; }
    if (k === 'N' && ev.ctrl) {
      B.UI.okee(ctx, ev.shift ? 'Recalc normals inside' : 'Recalc normals outside').then(ok => { if (ok) { MO.recalcNormals(me, ev.shift); changed(ctx); } });
      return true;
    }
    if (k === 'P' && plain) {
      B.UI.okee(ctx, 'Separate').then(ok => { if (ok) separate(ctx); });
      return true;
    }
    if (k === 'Y' && plain) {
      B.UI.okee(ctx, 'Split').then(ok => { if (ok) { MO.split(me); changed(ctx); } });
      return true;
    }
    if (k === 'U' && plain) {
      B.UI.okee(ctx, 'Reload Original data').then(ok => { if (ok && ctx.G.editOrig) { ctx.G.editMesh = MO.copyMesh(ctx.G.editOrig); changed(ctx); } });
      return true;
    }
    if (k === 'O' && plain) { ctx.G.f.proportional = !ctx.G.f.proportional; ctx.redrawAll(); return true; }
    if (k === 'S' && ev.shift && !ev.ctrl && !ev.alt) { snapMenu(ctx, area); return true; }
    if (k === 'N' && plain) { activeVertexNumbuts(ctx); return true; }
    if (k === 'K' && plain && B.Anim) { B.Anim.showKeys(ctx); return true; }
    if (k === 'I' && plain && B.Anim) { B.Anim.insertKeyMenu(ctx); return true; }
    if (k === 'J' && ev.alt) {
      B.UI.okee(ctx, 'Join triangles').then(ok => { if (ok) { joinTriangles(me); changed(ctx); } });
      return true;
    }
    return false;
  }

  function joinTriangles(me) {
    const edges = MO.edgesOf(me);
    const used = new Set();
    const out = [];
    const edgeList = [...edges.values()].filter(e => e.faces.length === 2).sort((a, b) => V.dist(me.verts[b.v[0]].co, me.verts[b.v[1]].co) - V.dist(me.verts[a.v[0]].co, me.verts[a.v[1]].co));
    edgeList.forEach(e => {
      const [f1, f2] = e.faces;
      if (used.has(f1) || used.has(f2)) return;
      const A = me.faces[f1], Bf = me.faces[f2];
      if (A.v.length !== 3 || Bf.v.length !== 3 || !MO.faceSelected(me, A) || !MO.faceSelected(me, Bf)) return;
      if (V.dot(MO.faceNormal(me, A), MO.faceNormal(me, Bf)) < 0.7) return;
      const [a, b] = e.v;
      const c = A.v.find(x => x !== a && x !== b), d = Bf.v.find(x => x !== a && x !== b);
      const ia = A.v.indexOf(a), ib = A.v.indexOf(b);
      const quad = (ia + 1) % 3 === ib ? [a, d, b, c] : [b, d, a, c];
      used.add(f1); used.add(f2);
      out.push({ v: quad, mat: A.mat, smooth: A.smooth });
    });
    me.faces = me.faces.filter((f, i) => !used.has(i)).concat(out);
    MO.cleanup(me);
  }

  function separate(ctx) {
    const me = ctx.G.editMesh;
    const ob = ctx.G.obedit;
    const part = MO.separate(me);
    if (!part) return;
    const nob = B.ObjectOps.duplicateObject(ctx, ob, false);
    nob.data = B.Data.newMesh(ctx.main, ob.data.name);
    nob.data.us = 1;
    nob.data.mats = ob.data.mats.slice();
    nob.data.verts = part.verts.map(v => ({ co: v.co, sel: false, hide: false }));
    nob.data.faces = part.faces;
    ctx.scene.bases.find(b => b.object === nob).sel = false;
    changed(ctx);
  }

  function activeVertexNumbuts(ctx) {
    const me = ctx.G.editMesh;
    const idx = ctx.G.activeVert != null && me.verts[ctx.G.activeVert] && me.verts[ctx.G.activeVert].sel ? ctx.G.activeVert : me.verts.findIndex(v => v.sel && !v.hide);
    if (idx < 0) return;
    const ob = ctx.G.obedit;
    const w = M.loc(ob.obmat, me.verts[idx].co);
    B.UI.numButtons(ctx, 'Active Vertex', [
      { label: 'LocX:', value: w[0], min: -1000, max: 1000, step: 0.1, prec: 3 },
      { label: 'LocY:', value: w[1], min: -1000, max: 1000, step: 0.1, prec: 3 },
      { label: 'LocZ:', value: w[2], min: -1000, max: 1000, step: 0.1, prec: 3 }
    ]).then(v => {
      if (!v) return;
      me.verts[idx].co = M.loc(M.invert(ob.obmat), v);
      changed(ctx);
    });
  }

  function spinTool(ctx, mode) {
    const ob = ctx.G.obedit;
    if (!ob || ob.type !== 'mesh') return;
    const me = ctx.G.editMesh;
    if (!selectedCount(me)) return;
    const eo = ctx.G.editOpts;
    const area = viewArea(ctx);
    const axisW = area ? viewAxis(ctx) : [0, 0, 1];
    const axis = V.norm(toLocal(ctx, axisW, true));
    const center = toLocal(ctx, ctx.scene.cursor, false);
    if (mode === 'spin' || mode === 'spindup') {
      MO.spin(me, { steps: eo.steps, degr: eo.degr, axis, center, dup: mode === 'spindup', keepOriginal: eo.keepOriginal, clockwise: eo.clockwise });
    } else if (mode === 'screw') {
      const loops = MO.edgesOf(me);
      const s = new Set(MO.selected(me));
      const ends = [];
      const deg = new Map();
      loops.forEach(e => { if (s.has(e.v[0]) && s.has(e.v[1])) { deg.set(e.v[0], (deg.get(e.v[0]) || 0) + 1); deg.set(e.v[1], (deg.get(e.v[1]) || 0) + 1); } });
      deg.forEach((d, i) => { if (d === 1) ends.push(i); });
      let offset = [0, 0, 0];
      if (ends.length === 2) offset = V.sub(me.verts[ends[1]].co, me.verts[ends[0]].co);
      else { B.UI.error(ctx, 'You have to select a curve with 2 endpoints'); return; }
      if (V.dot(offset, axis) < 0) offset = V.neg(offset);
      MO.spin(me, { steps: eo.steps, degr: 360, axis, center, dup: false, turns: eo.turns, offset: V.mul(axis, V.dot(offset, axis)), clockwise: eo.clockwise });
    } else if (mode === 'extruderepeat') {
      const sv = area ? B.View3D.setMatrices(ctx, area) : null;
      const dirW = sv ? V.mul(B.View3D.viewVector(sv), eo.offset) : [0, 0, eo.offset];
      MO.extrudeRepeat(me, eo.steps, toLocal(ctx, dirW, true));
    }
    changed(ctx);
  }

  function editTool(ctx, name) {
    const ob = ctx.G.obedit;
    if (!ob || ob.type !== 'mesh') return;
    const me = ctx.G.editMesh;
    const eo = ctx.G.editOpts;
    const area = viewArea(ctx);
    if (name === 'extrude') {
      const k = { type: 'key', key: 'E', shift: false, ctrl: false, alt: false };
      if (area) { ctx.mouse = [(area.win.x1 + area.win.x2) / 2, (area.win.y1 + area.win.y2) / 2]; key(ctx, area, k); }
      return;
    }
    if (name === 'intersect') { MO.intersectSel(me); }
    else if (name === 'split') MO.split(me);
    else if (name === 'tosphere') { B.UI.button(ctx, 'Percentage:', 100, 0, 100, 0).then(p => { if (p != null) { MO.toSphere(me, p / 100, toLocal(ctx, ctx.scene.cursor, false)); changed(ctx); } }); return; }
    else if (name === 'beauty') MO.beautyFill(me);
    else if (name === 'subdivide') MO.subdivide(me, 'plain');
    else if (name === 'fractsubd') { B.UI.button(ctx, 'Rand fac:', 5, -100, 100, 0).then(f => { if (f != null) { MO.subdivide(me, 'fractal', f / 10); changed(ctx); } }); return; }
    else if (name === 'noise') {
      const ma = B.View3D.obMaterial(ob, 0);
      const mt = ma && ma.mtex.find(t => t && t.tex && t.tex.type !== 'none');
      MO.noise(me, mt ? mt.tex : null, 0.25);
    }
    else if (name === 'smooth') MO.smooth(me);
    else if (name === 'xsort') { const sv = area ? B.View3D.setMatrices(ctx, area) : null; MO.xsort(me, sv ? toLocal(ctx, M.dir(sv.viewinv, [1, 0, 0]), true) : [1, 0, 0]); }
    else if (name === 'hash') MO.hashVerts(me);
    else if (name === 'remdoubles') { const n = MO.removeDoubles(me, eo.limit); B.UI.notice(ctx, 'Removed: ' + n); }
    else if (name === 'flip') MO.flipNormals(me);
    else if (name === 'hide') MO.hide(me);
    else if (name === 'reveal') MO.reveal(me);
    else if (name === 'selswap') MO.selectSwap(me);
    changed(ctx);
  }

  B.Edit = { enter, exit, toggle, editPoints, drawEdit, drawVert, pick, borderSelect, key, addPrimitive, changed, spinTool, editTool, viewArea, viewAxis, deleteMenu, specials, snapMenu, separate, editable };
})(globalThis.B204 = globalThis.B204 || {});
