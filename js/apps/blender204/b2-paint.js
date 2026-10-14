(function (B) {
  'use strict';
  const V = B.V, M = B.M;

  function activeMeshOb(ctx) {
    const b = ctx.scene.basact;
    return b && b.object.type === 'mesh' && (b.object.lay & ctx.scene.lay) ? b.object : null;
  }

  function toggleVertexPaint(ctx) {
    if (ctx.G.f.vertexpaint) { ctx.G.f.vertexpaint = false; ctx.redrawAll(); return; }
    const ob = activeMeshOb(ctx);
    if (!ob) return;
    if (ob.data.smesh) { B.UI.error(ctx, "Vertex paint doesn't work with S-mesh"); return; }
    if (ctx.G.obedit) B.Edit.exit(ctx, true);
    if (!ob.data.vcols) ob.data.vcols = ob.data.verts.map(() => [1, 1, 1]);
    ctx.G.f.vertexpaint = true;
    ctx.G.f.faceselect = false;
    ctx.G.vpaint = ctx.G.vpaint || { r: 1, g: 1, b: 1, a: 0.2, size: 25, mode: 'mix', area: true, soft: true, normals: false, mul: 1, gamma: 1 };
    ctx.setButsContext('paint');
    ctx.redrawAll();
  }

  function toggleFaceSelect(ctx) {
    if (ctx.G.f.faceselect) { ctx.G.f.faceselect = false; ctx.redrawAll(); return; }
    const ob = activeMeshOb(ctx);
    if (!ob) return;
    if (ctx.G.obedit) B.Edit.exit(ctx, true);
    if (!ob.data.tfaces) B.Shading.toggleTexFace(ctx, ob);
    ctx.G.f.faceselect = true;
    ctx.G.f.vertexpaint = false;
    if (ob.data.actface == null) ob.data.actface = 0;
    ctx.redrawAll();
  }

  function blendCol(mode, c, p, a) {
    if (mode === 'add') return c.map((v, i) => Math.min(1, v + p[i] * a));
    if (mode === 'sub') return c.map((v, i) => Math.max(0, v - p[i] * a));
    if (mode === 'mul') return c.map((v, i) => v * (1 - a + p[i] * a));
    if (mode === 'filter') return c.map((v, i) => v * (1 - a) + v * p[i] * a);
    return c.map((v, i) => v * (1 - a) + p[i] * a);
  }

  function paintModal(ctx, area, ev) {
    const ob = activeMeshOb(ctx);
    if (!ob || !ob.data.vcols) return null;
    const vp = ctx.G.vpaint;
    const me = ob.data;
    const apply = e => {
      const sv = B.View3D.setMatrices(ctx, area);
      B.Data.whereIs(ob);
      const nrm = vp.normals ? B.MeshOps.vertexNormals(me) : null;
      const vv = B.View3D.viewVector(sv);
      me.verts.forEach((v, i) => {
        const s = B.View3D.project(sv, M.loc(ob.obmat, v.co));
        if (!s) return;
        const d = Math.hypot(s[0] - e.x, s[1] - e.y);
        if (d > vp.size) return;
        let a = vp.a * (vp.soft ? 1 - d / vp.size : 1);
        if (nrm) a *= Math.max(0, V.dot(V.norm(M.dir(ob.obmat, nrm[i])), vv));
        me.vcols[i] = blendCol(vp.mode, me.vcols[i], [vp.r, vp.g, vp.b], a);
      });
      area.redraw(); ctx.schedule();
    };
    apply(ev);
    return { move: e => { apply(e); return false; }, up: () => { ctx.redrawAll(); return true; } };
  }

  function setAll(ctx) {
    const ob = activeMeshOb(ctx);
    if (!ob) return;
    const vp = ctx.G.vpaint;
    if (!ob.data.vcols) ob.data.vcols = ob.data.verts.map(() => [1, 1, 1]);
    ob.data.vcols = ob.data.vcols.map(() => [vp.r * vp.mul, vp.g * vp.mul, vp.b * vp.mul].map(v => Math.pow(Math.min(1, v), 1 / (vp.gamma || 1))));
    ctx.redrawAll();
  }

  function pickFace(ctx, area, ev) {
    const ob = activeMeshOb(ctx);
    if (!ob) return;
    const me = ob.data;
    const sv = B.View3D.setMatrices(ctx, area);
    B.Data.whereIs(ob);
    const pts = me.verts.map(v => B.View3D.project(sv, M.loc(ob.obmat, v.co)));
    let best = -1, bz = Infinity;
    me.faces.forEach((f, i) => {
      if (f.v.length < 3) return;
      const poly = f.v.map(k => pts[k]);
      if (poly.some(p => !p)) return;
      if (!B.View3D.pointInPoly(ev.x, ev.y, poly)) return;
      const z = poly.reduce((s, p) => s + p[2], 0) / poly.length;
      if (z < bz) { bz = z; best = i; }
    });
    if (!ev.shift) me.faces.forEach(f => { f.sel = false; });
    if (best >= 0) { const f = me.faces[best]; f.sel = ev.shift ? !f.sel : true; me.actface = best; }
    ctx.redrawAll();
  }

  function activeTFace(ctx, ob) {
    const f = ob.data.faces[ob.data.actface || 0];
    return f && f.tf ? f.tf : null;
  }

  function copyActiveTFace(ctx, ob, key) {
    const tf = activeTFace(ctx, ob);
    if (!tf) return;
    ob.data.faces.forEach(f => { if (f.sel && f.tf && f.tf !== tf) f.tf.mode[key] = tf.mode[key]; });
  }

  function copyToSelected(ctx, what) {
    const ob = activeMeshOb(ctx);
    if (!ob) return;
    const me = ob.data;
    const act = me.faces[me.actface || 0];
    if (!act) return;
    me.faces.forEach(f => {
      if (!f.sel || f === act) return;
      if (what === 'mode' && f.tf && act.tf) { f.tf.mode = Object.assign({}, act.tf.mode); f.tf.transp = act.tf.transp; }
      if (what === 'uv' && act.uv) { f.uv = act.uv.slice(0, f.v.length).map(u => u.slice()); if (f.tf && act.tf) f.tf.image = act.tf.image; }
      if (what === 'col' && act.col) f.col = act.col.slice(0, f.v.length).map(c => c.slice());
    });
    ctx.redrawAll();
  }

  function key(ctx, area, ev) {
    const k = ev.key;
    if (k === 'V' && !ev.ctrl && !ev.shift) { toggleVertexPaint(ctx); return true; }
    if (k === 'K' && ev.shift) { setAll(ctx); return true; }
    return false;
  }

  function faceKey(ctx, area, ev) {
    const ob = activeMeshOb(ctx);
    if (!ob) return false;
    const me = ob.data;
    const k = ev.key;
    if (k === 'A' && !ev.ctrl) { const any = me.faces.some(f => f.sel); me.faces.forEach(f => { f.sel = !any; }); ctx.redrawAll(); return true; }
    if (k === 'U' && !ev.ctrl) {
      B.UI.pupmenu(ctx, 'UV Calculation %t|Cube %x2|Cylinder %x3|Sphere %x4|Bounds to 64 %x64|Bounds to 128 %x128|Standard 64 %x65|Standard 128 %x129|Standard 256 %x257| From Window %x5').then(v => {
        if (v == null || v < 0) return;
        const sv = B.View3D.setMatrices(ctx, area);
        me.faces.forEach(f => {
          if (!f.sel || f.v.length < 3) return;
          const pts = f.v.map(i => me.verts[i].co);
          if (v === 2) { const n = B.MeshOps.faceNormal(me, f).map(Math.abs); const ax = n[0] > n[1] && n[0] > n[2] ? [1, 2] : n[1] > n[2] ? [0, 2] : [0, 1]; f.uv = pts.map(p => [(p[ax[0]] + 1) / 2, (p[ax[1]] + 1) / 2]); }
          else if (v === 3) f.uv = pts.map(p => [(Math.atan2(p[1], p[0]) / Math.PI + 1) / 2, (p[2] + 1) / 2]);
          else if (v === 4) f.uv = pts.map(p => { const l = V.len(p) || 1; return [(Math.atan2(p[1], p[0]) / Math.PI + 1) / 2, Math.acos(B.clamp(p[2] / l, -1, 1)) / Math.PI]; });
          else if (v === 5) f.uv = pts.map(p => { const s = B.View3D.project(sv, M.loc(ob.obmat, p)); return s ? [(s[0] - sv.win.x1) / sv.winx, (s[1] - sv.win.y1) / sv.winy] : [0, 0]; });
          else f.uv = f.v.length === 4 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 0], [1, 0], [1, 1]];
        });
        ctx.redrawAll();
      });
      return true;
    }
    if (k === 'R' && ev.alt) { B.UI.pupmenu(ctx, 'OK? %t|Rot UV %x1| Rot VertexCol %x2').then(v => { me.faces.forEach(f => { if (!f.sel) return; if (v === 1 && f.uv) f.uv.push(f.uv.shift()); if (v === 2 && f.col) f.col.push(f.col.shift()); }); ctx.redrawAll(); }); return true; }
    if (k === 'H' && !ev.alt) { me.faces.forEach(f => { if (f.sel) { f.hideFace = true; f.sel = false; } }); ctx.redrawAll(); return true; }
    if (k === 'H' && ev.alt) { me.faces.forEach(f => { if (f.hideFace) { f.hideFace = false; f.sel = true; } }); ctx.redrawAll(); return true; }
    return false;
  }

  function drawFaceSel(ctx, r, sv, ob) {
    const me = ob.data;
    r.mvp = M.mul(sv.persmat, ob.obmat);
    me.faces.forEach((f, i) => {
      if (f.v.length < 3 || f.hideFace) return;
      const c = f.sel ? (i === me.actface ? B.rgb(255, 255, 255) : B.rgb(255, 255, 112)) : B.rgb(64, 64, 128);
      for (let k = 0; k < f.v.length; k++) r.line3(me.verts[f.v[k]].co, me.verts[f.v[(k + 1) % f.v.length]].co, c, f.sel ? 0 : 0xCCCC);
    });
  }

  B.Paint = { toggleVertexPaint, toggleFaceSelect, paintModal, setAll, pickFace, activeTFace, copyActiveTFace, copyToSelected, key, faceKey, drawFaceSel };
})(globalThis.B204 = globalThis.B204 || {});
