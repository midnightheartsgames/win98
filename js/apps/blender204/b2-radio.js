(function (B) {
  'use strict';
  const V = B.V, M = B.M;

  function state(ctx) { return ctx.G.radio || { phase: 0 }; }

  function collect(ctx) {
    const patches = [];
    const obs = [];
    ctx.scene.bases.forEach(b => {
      const ob = b.object;
      if (!b.sel || ob.type !== 'mesh' || !(ob.lay & ctx.scene.lay)) return;
      B.Data.whereIs(ob);
      obs.push(ob);
      const me = B.displayMesh(ob, ctx);
      me.faces.forEach(f => {
        if (f.v.length < 3) return;
        const pts = f.v.map(i => M.loc(ob.obmat, me.verts[i].co));
        const ma = B.View3D.obMaterial(ob, f.mat || 0);
        addPatch(patches, pts, ob, f, ma);
      });
    });
    if (!patches.length) { B.UI.error(ctx, 'No selected meshes'); return; }
    ctx.G.radio = { phase: 1, patches, obs, info: `Patches: ${patches.length}` };
    ctx.redrawAll();
  }

  function addPatch(list, pts, ob, f, ma) {
    const n = pts.length === 4 ? V.normalQuad(pts[0], pts[1], pts[2], pts[3]) : V.normal(pts[0], pts[1], pts[2]);
    let area = V.len(V.cross(V.sub(pts[1], pts[0]), V.sub(pts[2], pts[0]))) / 2;
    if (pts.length === 4) area += V.len(V.cross(V.sub(pts[2], pts[0]), V.sub(pts[3], pts[0]))) / 2;
    const col = ma ? [ma.r, ma.g, ma.b] : [0.8, 0.8, 0.8];
    const emit = ma ? ma.emit : 0;
    const center = V.mul(pts.reduce((s, p) => V.add(s, p), [0, 0, 0]), 1 / pts.length);
    list.push({ pts, n, area, col, ref: ma ? ma.ref : 0.8, emit, center, rad: col.map(c => c * emit), unshot: col.map(c => c * emit * area), ob, face: f });
  }

  function subdivide(ctx) {
    const st = ctx.G.radio;
    if (!st) return;
    const lim = Math.max(0.05, (ctx.scene.radio.pama || 500) / 500);
    let changed = true, guard = 0;
    while (changed && guard++ < 6 && st.patches.length < (ctx.scene.radio.maxnode || 10000)) {
      changed = false;
      const out = [];
      st.patches.forEach(p => {
        const edge = Math.max(...p.pts.map((q, i) => V.dist(q, p.pts[(i + 1) % p.pts.length])));
        if (edge > lim && p.pts.length === 4) {
          const [a, b, c, d] = p.pts;
          const ab = V.mid(a, b), bc = V.mid(b, c), cd = V.mid(c, d), da = V.mid(d, a), m = V.mid(ab, cd);
          [[a, ab, m, da], [ab, b, bc, m], [m, bc, c, cd], [da, m, cd, d]].forEach(q => addPatch(out, q, p.ob, p.face, null));
          out.slice(-4).forEach(q => { q.col = p.col; q.ref = p.ref; q.emit = p.emit; q.rad = p.col.map(cc => cc * p.emit); q.unshot = p.col.map(cc => cc * p.emit * q.area); });
          changed = true;
        } else if (edge > lim && p.pts.length === 3) {
          const [a, b, c] = p.pts;
          const ab = V.mid(a, b), bc = V.mid(b, c), ca = V.mid(c, a);
          [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]].forEach(q => addPatch(out, q, p.ob, p.face, null));
          out.slice(-4).forEach(q => { q.col = p.col; q.ref = p.ref; q.emit = p.emit; q.rad = p.col.map(cc => cc * p.emit); q.unshot = p.col.map(cc => cc * p.emit * q.area); });
          changed = true;
        } else out.push(p);
      });
      st.patches = out;
    }
    st.info = `Patches: ${st.patches.length}`;
    ctx.redrawAll();
  }

  function go(ctx) {
    const st = ctx.G.radio;
    if (!st) { B.UI.error(ctx, 'Collect Meshes first'); return; }
    const rd = ctx.scene.radio;
    const P = st.patches;
    const total0 = P.reduce((s, p) => s + p.unshot[0] + p.unshot[1] + p.unshot[2], 0) || 1;
    let it = 0;
    const maxIt = rd.maxiter || 120;
    const step = () => {
      for (let k = 0; k < 20 && it < maxIt; k++, it++) {
        let best = null, be = 0;
        P.forEach(p => { const e = p.unshot[0] + p.unshot[1] + p.unshot[2]; if (e > be) { be = e; best = p; } });
        if (!best || be < total0 * (rd.convergence || 0.1) * 0.01) { it = maxIt; break; }
        const u = best.unshot.slice();
        best.unshot = [0, 0, 0];
        P.forEach(q => {
          if (q === best) return;
          const d = V.sub(q.center, best.center);
          const r2 = V.dot(d, d) || 1e-6;
          const dir = V.mul(d, 1 / Math.sqrt(r2));
          const ci = V.dot(best.n, dir), cj = -V.dot(q.n, dir);
          if (ci <= 0 || cj <= 0) return;
          const F = ci * cj * q.area / (Math.PI * r2 + q.area);
          for (let c = 0; c < 3; c++) {
            const add = u[c] * F / q.area * q.ref * q.col[c];
            q.rad[c] += add;
            q.unshot[c] += add * q.area;
          }
        });
      }
      st.phase = 2;
      st.info = `Iterations: ${it}   Patches: ${P.length}`;
      ctx.redrawAll();
      if (it < maxIt) setTimeout(step, 0);
    };
    step();
  }

  function patchColor(ctx, p) {
    const rd = ctx.scene.radio;
    const f = (rd.radfac || 30) / 30;
    return p.rad.map(v => Math.pow(Math.max(0, Math.min(1, v * f)), 1 / (rd.gamma || 1)));
  }

  function draw(ctx, r, sv) {
    const st = ctx.G.radio;
    if (!st || !st.patches) return;
    const rd = ctx.scene.radio;
    r.depthTest = true;
    r.mvp = sv.persmat;
    st.patches.forEach(p => {
      const c = patchColor(ctx, p);
      if (rd.drawtype === 'wire') { for (let i = 0; i < p.pts.length; i++) r.line3(p.pts[i], p.pts[(i + 1) % p.pts.length], B.rgbf(c[0], c[1], c[2])); }
      else r.polyClip(p.pts, B.rgbf(c[0] + 0.05, c[1] + 0.05, c[2] + 0.05));
    });
    r.depthTest = false;
  }

  function toMeshes(ctx, replace) {
    const st = ctx.G.radio;
    if (!st || st.phase < 2) { B.UI.error(ctx, 'Press GO first'); return; }
    const byOb = new Map();
    st.patches.forEach(p => { if (!byOb.has(p.ob)) byOb.set(p.ob, []); byOb.get(p.ob).push(p); });
    byOb.forEach((ps, ob) => {
      const me = B.Data.newMesh(ctx.main, ob.data.name);
      const inv = M.invert(ob.obmat);
      const keyIdx = new Map();
      const colAcc = [];
      ps.forEach(p => {
        const c = patchColor(ctx, p);
        const idx = p.pts.map(q => {
          const l = M.loc(inv, q);
          const key = l.map(v => v.toFixed(4)).join(',');
          if (!keyIdx.has(key)) { keyIdx.set(key, me.verts.length); me.verts.push({ co: l, sel: false, hide: false }); colAcc.push([0, 0, 0, 0]); }
          const i = keyIdx.get(key);
          colAcc[i][0] += c[0]; colAcc[i][1] += c[1]; colAcc[i][2] += c[2]; colAcc[i][3]++;
          return i;
        });
        me.faces.push({ v: idx, mat: 0, smooth: true });
      });
      me.vcols = colAcc.map(a => [a[0] / a[3], a[1] / a[3], a[2] / a[3]]);
      const ma = B.Data.newMaterial(ctx.main, 'RadioMat');
      ma.mode.vcolPaint = true;
      ma.mode.shadeless = true;
      me.mats = [B.Data.idUser(ma)];
      if (replace) { ob.data.us--; ob.data = B.Data.idUser(me); ob.colbits = 0; }
      else {
        const nob = B.ObjectOps.addObject(ctx, 'mesh', ob.name, me);
        nob.loc = ob.loc.slice(); nob.rot = ob.rot.slice(); nob.size = ob.size.slice(); nob.parent = ob.parent; nob.parentInv = ob.parentInv.slice();
        B.Data.whereIs(nob);
      }
    });
    ctx.G.radio = null;
    ctx.redrawAll();
  }

  function free(ctx) { ctx.G.radio = null; ctx.redrawAll(); }

  B.Radio = { state, collect, subdivide, go, draw, toMeshes, free };
})(globalThis.B204 = globalThis.B204 || {});
