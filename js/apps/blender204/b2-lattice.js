(function (B) {
  'use strict';
  const V = B.V, M = B.M;

  function regularPoints(lt) {
    const pts = [];
    for (let w = 0; w < lt.pntsw; w++) for (let v = 0; v < lt.pntsv; v++) for (let u = 0; u < lt.pntsu; u++) {
      pts.push({ co: [lt.pntsu > 1 ? -0.5 + u / (lt.pntsu - 1) : 0, lt.pntsv > 1 ? -0.5 + v / (lt.pntsv - 1) : 0, lt.pntsw > 1 ? -0.5 + w / (lt.pntsw - 1) : 0], sel: false });
    }
    return pts;
  }

  function newData(main, name) {
    const lt = main.add('LT', name, { pntsu: 2, pntsv: 2, pntsw: 2, typeu: 'bspline', typev: 'bspline', typew: 'bspline', outside: false, def: [] });
    lt.def = regularPoints(lt);
    return lt;
  }

  function resize(lt, u, v, w) {
    const old = lt.def, ou = lt.pntsu, ov = lt.pntsv, ow = lt.pntsw;
    lt.pntsu = u; lt.pntsv = v; lt.pntsw = w;
    const reg = regularPoints(lt);
    reg.forEach(p => { p.co = sample(old, ou, ov, ow, p.co); });
    lt.def = reg;
  }

  function weights(n, t, type) {
    const out = new Array(n).fill(0);
    if (n === 1) { out[0] = 1; return out; }
    const f = (t + 0.5) * (n - 1);
    const i = Math.max(0, Math.min(n - 2, Math.floor(f)));
    let s = f - i;
    if (type === 'card' || type === 'bspline') s = s * s * (3 - 2 * s);
    out[i] = 1 - s; out[i + 1] = s;
    return out;
  }

  function sample(def, nu, nv, nw, p, types, outside) {
    const t = types || ['lin', 'lin', 'lin'];
    const cl = x => (outside ? x : Math.max(-0.5, Math.min(0.5, x)));
    const wu = weights(nu, cl(p[0]), t[0]), wv = weights(nv, cl(p[1]), t[1]), ww = weights(nw, cl(p[2]), t[2]);
    const reg = (u, v, w) => [nu > 1 ? -0.5 + u / (nu - 1) : 0, nv > 1 ? -0.5 + v / (nv - 1) : 0, nw > 1 ? -0.5 + w / (nw - 1) : 0];
    let d = [0, 0, 0];
    for (let w = 0; w < nw; w++) for (let v = 0; v < nv; v++) for (let u = 0; u < nu; u++) {
      const f = wu[u] * wv[v] * ww[w];
      if (!f) continue;
      const idx = (w * nv + v) * nu + u;
      const off = V.sub(def[idx].co, reg(u, v, w));
      d = V.add(d, V.mul(off, f));
    }
    return V.add(p, d);
  }

  function deformMesh(child, me, latOb) {
    const lt = latOb.data;
    B.Data.whereIs(latOb);
    const toLat = M.mul(M.invert(latOb.obmat), child.obmat), fromLat = M.invert(toLat);
    const out = { verts: me.verts.map(v => ({ co: M.loc(fromLat, sample(lt.def, lt.pntsu, lt.pntsv, lt.pntsw, M.loc(toLat, v.co), [lt.typeu, lt.typev, lt.typew], lt.outside)), sel: v.sel, hide: v.hide })), faces: me.faces };
    return Object.assign({}, me, out, { stamp: 'lat' + Math.random() });
  }

  function draw(ctx, r, sv, base, col, dt, editing) {
    const ob = base.object, lt = ob.data;
    const pts = editing && ctx.G.editLattice ? ctx.G.editLattice.def : lt.def;
    r.mvp = M.mul(sv.persmat, ob.obmat);
    const id = (u, v, w) => (w * lt.pntsv + v) * lt.pntsu + u;
    const c = editing ? B.rgb(0, 0, 0) : col;
    for (let w = 0; w < lt.pntsw; w++) for (let v = 0; v < lt.pntsv; v++) for (let u = 0; u < lt.pntsu; u++) {
      const p = pts[id(u, v, w)].co;
      if (u < lt.pntsu - 1) r.line3(p, pts[id(u + 1, v, w)].co, c, editing ? 0 : 0xCCCC);
      if (v < lt.pntsv - 1) r.line3(p, pts[id(u, v + 1, w)].co, c, editing ? 0 : 0xCCCC);
      if (w < lt.pntsw - 1) r.line3(p, pts[id(u, v, w + 1)].co, c, editing ? 0 : 0xCCCC);
    }
    if (editing) pts.forEach(p => B.Edit.drawVert(r, p.co, p.sel ? B.View3D.C.VERTSEL : B.View3D.C.VERT));
  }

  const Edit = {
    enter(ctx, ob) { ctx.G.obedit = ob; ctx.G.editLattice = { def: JSON.parse(JSON.stringify(ob.data.def)) }; ctx.redrawAll(); return true; },
    exit(ctx, save) { const ob = ctx.G.obedit; if (save && ctx.G.editLattice) ob.data.def = ctx.G.editLattice.def; ctx.G.editLattice = null; },
    points(ctx) { return ctx.G.editLattice ? ctx.G.editLattice.def : []; },
    transPoints(ctx) { return ctx.G.editLattice.def.map(p => ({ co: p.co.slice(), sel: p.sel, w: p.sel ? 1 : 0, apply: loc => { p.co = loc; }, restore: o => { p.co = o.slice(); } })); },
    pick(ctx, area, ev) {
      const ob = ctx.G.obedit, el = ctx.G.editLattice;
      const sv = B.View3D.setMatrices(ctx, area);
      let best = null, bd = 30;
      el.def.forEach(p => { const s = B.View3D.project(sv, M.loc(ob.obmat, p.co)); if (!s) return; const d = Math.hypot(s[0] - ev.x, s[1] - ev.y); if (d < bd) { bd = d; best = p; } });
      if (!ev.shift) el.def.forEach(p => { p.sel = false; });
      if (best) best.sel = ev.shift ? !best.sel : true;
      ctx.redrawAll();
    },
    borderSelect(ctx, sv, inside, select) { const ob = ctx.G.obedit; ctx.G.editLattice.def.forEach(p => { if (inside(B.View3D.project(sv, M.loc(ob.obmat, p.co)))) p.sel = select; }); },
    key(ctx, area, ev) {
      const el = ctx.G.editLattice;
      if (ev.key === 'A' && !ev.ctrl && !ev.shift) { const any = el.def.some(p => p.sel); el.def.forEach(p => { p.sel = !any; }); ctx.redrawAll(); return true; }
      return false;
    }
  };

  function add(ctx) {
    if (ctx.G.obedit) B.Edit.exit(ctx, true);
    B.ObjectOps.addObject(ctx, 'lattice', 'Lattice', newData(ctx.main, 'Lattice'));
  }

  function editButtons(ctx, blk, ob, k, R) {
    const lt = ob.data;
    if (ctx.G.obedit === ob) { k.label(430, 640, 'Not with VertexKeys / leave EditMode to resize', 200); }
    else {
      ['u', 'v', 'w'].forEach((a, i) => {
        const key = 'pnts' + a;
        blk.num(a.toUpperCase() + ':', ...R(430, 636 + i * 12, 480, 644 + i * 12), () => lt[key], v => { const nv = [lt.pntsu, lt.pntsv, lt.pntsw]; nv[i] = v; resize(lt, ...nv); ctx.redrawAll(); }, 1, 64, 1, 0, 'Points in ' + a.toUpperCase());
        const tk = 'type' + a;
        ['Lin', 'Card', 'B'].forEach((s, j) => k.row(R(484 + j * 24, 636 + i * 12, 506 + j * 24, 644 + i * 12), s, lt, tk, ['lin', 'card', 'bspline'][j], 'Interpolation type'));
      });
    }
    k.but(R(430, 680, 520, 688), 'Make Regular', () => { lt.def = regularPoints(lt); ctx.redrawAll(); }, 'Make lattice regular');
    k.tog(R(522, 680, 572, 688), 'Outside', lt, 'outside', 'Only draw, and take into account, the outer vertices');
  }

  function applyDeform(ctx) {
    B.UI.okee(ctx, 'Apply deform').then(ok => {
      if (!ok) return;
      B.ObjectOps.selectedBases(ctx).forEach(b => {
        const ob = b.object;
        if (ob.type === 'mesh' && ob.parent && ob.parent.type === 'lattice') {
          const d = deformMesh(ob, ob.data, ob.parent);
          ob.data.verts.forEach((v, i) => { v.co = d.verts[i].co; });
          ob.data.stamp = (ob.data.stamp || 0) + 1;
        }
      });
      ctx.redrawAll();
    });
  }

  function newIka(main, name) {
    return main.add('IK', name, { limbs: [{ len: 1, alpha: 0 }], eff: [1, 0, 0], effg: [1, 0, 0], xyconstraint: 0.5, mem: 0.3, iter: 6, lockXY: false });
  }

  function ikaJoints(ik) {
    const pts = [[0, 0, 0]];
    let ang = 0, p = [0, 0, 0];
    ik.limbs.forEach(l => { ang += l.alpha; p = [p[0] + Math.cos(ang) * l.len, p[1] + Math.sin(ang) * l.len, 0]; pts.push(p); });
    return pts;
  }

  function solveIka(ik, target) {
    for (let it = 0; it < Math.max(1, ik.iter) * 4; it++) {
      for (let i = ik.limbs.length - 1; i >= 0; i--) {
        const pts = ikaJoints(ik);
        const base = pts[i], end = pts[pts.length - 1];
        const a1 = Math.atan2(end[1] - base[1], end[0] - base[0]), a2 = Math.atan2(target[1] - base[1], target[0] - base[0]);
        let d = a2 - a1;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        ik.limbs[i].alpha += d * (1 - (ik.mem || 0) * 0.5);
      }
    }
    const pts = ikaJoints(ik);
    ik.eff = pts[pts.length - 1];
  }

  function limbMatrix(ik, idx) {
    let ang = 0, p = [0, 0, 0];
    for (let i = 0; i <= idx && i < ik.limbs.length; i++) {
      if (i > 0) { const l = ik.limbs[i - 1]; p = [p[0] + Math.cos(ang) * l.len, p[1] + Math.sin(ang) * l.len, 0]; }
      ang += ik.limbs[i].alpha;
    }
    return M.mul(M.translate(p), M.rotZ(ang));
  }

  function drawIka(ctx, r, sv, base, col, dt, editing) {
    const ob = base.object, ik = ob.data;
    const pts = ikaJoints(ik);
    r.mvp = M.mul(sv.persmat, ob.obmat);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const l = V.dist(a, b), w = Math.max(0.05, l * 0.12);
      const dir = V.norm(V.sub(b, a)), side = [-dir[1] * w, dir[0] * w, 0];
      const m1 = V.add(V.lerp(a, b, 0.2), side), m2 = V.sub(V.lerp(a, b, 0.2), side);
      r.line3(a, m1, col); r.line3(m1, b, col); r.line3(a, m2, col); r.line3(m2, b, col);
    }
    pts.forEach((p, i) => B.Edit.drawVert(r, p, editing && ctx.G.editIka && ctx.G.editIka.sel === i ? B.View3D.C.VERTSEL : (i === pts.length - 1 ? B.rgb(255, 200, 64) : B.View3D.C.VERT)));
  }

  const EditIka = {
    enter(ctx, ob) { ctx.G.obedit = ob; ctx.G.editIka = { sel: ob.data.limbs.length }; ctx.redrawAll(); return true; },
    exit(ctx) { ctx.G.editIka = null; },
    points(ctx) { return ikaJoints(ctx.G.obedit.data).map((p, i) => ({ co: p, sel: i === ctx.G.editIka.sel })); },
    transPoints(ctx) {
      const ik = ctx.G.obedit.data;
      const pts = ikaJoints(ik);
      const i = ctx.G.editIka.sel;
      const orig = JSON.parse(JSON.stringify(ik.limbs));
      return pts.map((p, k) => ({ co: p.slice(), sel: k === i && k > 0, w: k === i && k > 0 ? 1 : 0, apply: loc => { if (k !== i || k === 0) return; const sub = Object.assign({}, ik, { limbs: ik.limbs.slice(0, k) }); solveIka(sub, loc); ik.limbs.splice(0, k, ...sub.limbs); ik.eff = ikaJoints(ik).pop(); }, restore: () => { if (k === i) ik.limbs = JSON.parse(JSON.stringify(orig)); } }));
    },
    pick(ctx, area, ev) {
      const ob = ctx.G.obedit;
      const sv = B.View3D.setMatrices(ctx, area);
      let best = -1, bd = 30;
      ikaJoints(ob.data).forEach((p, i) => { const s = B.View3D.project(sv, M.loc(ob.obmat, p)); if (!s) return; const d = Math.hypot(s[0] - ev.x, s[1] - ev.y); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) ctx.G.editIka.sel = best;
      ctx.redrawAll();
    },
    borderSelect() { },
    key(ctx, area, ev) {
      const ob = ctx.G.obedit, ik = ob.data;
      if (ev.key === 'E' && !ev.ctrl) {
        const last = ik.limbs[ik.limbs.length - 1];
        ik.limbs.push({ len: last ? last.len : 1, alpha: 0 });
        ctx.G.editIka.sel = ik.limbs.length;
        ik.eff = ikaJoints(ik).pop();
        B.Transform.start(ctx, area, 'grab', { mouse: ctx.mouse });
        return true;
      }
      if ((ev.key === 'X' || ev.key === 'DEL') && ik.limbs.length > 1) { ik.limbs.pop(); ctx.G.editIka.sel = ik.limbs.length; ctx.redrawAll(); return true; }
      return false;
    }
  };

  function addIka(ctx) {
    if (ctx.G.obedit) B.Edit.exit(ctx, true);
    B.ObjectOps.addObject(ctx, 'ika', 'Ika', newIka(ctx.main, 'Ika'));
  }

  function ikaButtons(ctx, blk, ob, k, R) {
    const ik = ob.data;
    k.tog(R(430, 636, 520, 644), 'Lock XY Plane', ik, 'lockXY', 'New IK option: allows both X and Y axes to rotate');
    k.num(R(430, 648, 520, 656), 'XY constraint ', ik, 'xyconstraint', 0, 1, 0.05, 3, 'Constrain in radians');
    k.num(R(430, 658, 520, 666), 'Mem ', ik, 'mem', 0, 1, 0.05, 3, 'Memory');
    k.num(R(430, 668, 520, 676), 'Iter: ', ik, 'iter', 1, 50, 1, 0, 'Iterations');
    ik.limbs.forEach((l, i) => { if (i < 6) blk.num(`Limb ${i}:`, ...R(560, 636 + i * 10, 650, 644 + i * 10), () => l.len, v => { l.len = v; ctx.redrawAll(); }, 0.01, 100, 0.1, 3, 'Limb length'); });
  }

  B.ObTypes = B.ObTypes || {};
  B.ObTypes.lattice = { newData, add, editButtons, points: lt => lt.def.map(p => p.co), translate(lt, d) { lt.def.forEach(p => { p.co = V.add(p.co, d); }); } };
  B.ObTypes.ika = {
    newData: newIka, add: addIka, editButtons: ikaButtons,
    points: ik => ikaJoints(ik), translate() { }
  };
  B.EditExtra = B.EditExtra || {};
  B.EditExtra.lattice = Edit;
  B.EditExtra.ika = EditIka;
  B.DrawExtra = B.DrawExtra || {};
  B.DrawExtra.lattice = draw;
  B.DrawExtra.ika = drawIka;
  B.DrawExtra.pickPoints = B.DrawExtra.pickPoints || {};
  B.DrawExtra.pickPoints.lattice = ob => { const segs = []; const lt = ob.data; const id = (u, v, w) => (w * lt.pntsv + v) * lt.pntsu + u; for (let w = 0; w < lt.pntsw; w++) for (let v = 0; v < lt.pntsv; v++) for (let u = 0; u < lt.pntsu - 1; u++) segs.push([lt.def[id(u, v, w)].co, lt.def[id(u + 1, v, w)].co]); return segs; };
  B.DrawExtra.pickPoints.ika = ob => { const p = ikaJoints(ob.data); const segs = []; for (let i = 0; i < p.length - 1; i++) segs.push([p[i], p[i + 1]]); return segs; };
  B.Lattice = { regularPoints, sample, deformMesh, applyDeform, resize };
  B.Ika = { ikaJoints, solveIka, limbMatrix, makeSkeleton: ctx => B.UI.error(ctx, 'No skeleton available: use CTRL K') };
})(globalThis.B204 = globalThis.B204 || {});
