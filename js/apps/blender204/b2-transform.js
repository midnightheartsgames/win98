(function (B) {
  'use strict';
  const V = B.V, M = B.M, Q = B.Q;

  function selectedObjects(ctx, area) {
    const sv = area.space;
    const lay = B.View3D.areaLayers(ctx, sv);
    const bases = ctx.scene.bases.filter(b => b.sel && (b.object.lay & lay));
    const set = new Set(bases.map(b => b.object));
    return bases.map(b => b.object).filter(ob => {
      let p = ob.parent;
      while (p) { if (set.has(p)) return false; p = p.parent; }
      return true;
    });
  }

  function parentEffect(ob) {
    if (!ob.parent) return M.ident();
    const pm = B.Data.whereIs(ob.parent);
    return M.mul(pm, ob.parentInv);
  }

  function decompose(mat) {
    const size = M.colScale(mat);
    const n = M.normalized3(mat);
    if (M.invert(n) && det3(n) < 0) { size[0] = -size[0]; n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2]; }
    return { loc: [mat[12], mat[13], mat[14]], rot: M.toEul(n), size };
  }

  function det3(m) { return m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]); }

  function collect(ctx, area) {
    const G = ctx.G;
    if (G.obedit) {
      const ob = G.obedit;
      B.Data.whereIs(ob);
      const pts = B.Edit.editPoints(ctx);
      const items = [];
      if (ob.type === 'mesh' || !B.EditExtra[ob.type].transPoints) {
        pts.forEach(p => { items.push({ p, co: V.copy(p.co), world: M.loc(ob.obmat, p.co), w: p.sel ? 1 : 0 }); });
      } else {
        B.EditExtra[ob.type].transPoints(ctx).forEach(t => items.push(Object.assign({ world: M.loc(ob.obmat, t.co.slice()) }, t, { co: t.co.slice() })));
      }
      return { mode: 'edit', ob, items, inv: M.invert(ob.obmat) };
    }
    const obs = selectedObjects(ctx, area);
    const items = obs.map(ob => {
      B.Data.whereIs(ob);
      return { ob, loc: V.copy(ob.loc), rot: V.copy(ob.rot), size: V.copy(ob.size), world: ob.obmat.slice(), peff: parentEffect(ob) };
    });
    return { mode: 'object', items };
  }

  function pivotOf(ctx, area, data) {
    const around = area.space.around;
    const cursor = area.space.localview ? area.space.localview.cursor : ctx.scene.cursor;
    if (around === 'cursor') return V.copy(cursor);
    let pts;
    if (data.mode === 'edit') pts = data.items.filter(i => i.w === 1).map(i => i.world);
    else pts = data.items.map(i => [i.world[12], i.world[13], i.world[14]]);
    if (!pts.length) return V.copy(cursor);
    if (around === 'median' || around === 'individual') return V.mul(pts.reduce((a, b) => V.add(a, b), [0, 0, 0]), 1 / pts.length);
    const [mn, mx] = B.View3D.boundBox(pts);
    return V.mid(mn, mx);
  }

  function propWeights(ctx, data, radius) {
    const sel = data.items.filter(i => i.w === 1);
    data.items.forEach(it => {
      if (it.p && it.p.sel) { it.f = 1; return; }
      if (!ctx.G.f.proportional) { it.f = 0; return; }
      let d = Infinity;
      for (const s of sel) { const q = V.dist(s.world, it.world); if (q < d) d = q; }
      if (d >= radius) { it.f = 0; return; }
      const t = 1 - d / radius;
      it.f = ctx.G.f.propSmooth ? 3 * t * t - 2 * t * t * t : t * t;
    });
  }

  function axisVec(c) { return c === 'X' ? [1, 0, 0] : c === 'Y' ? [0, 1, 0] : [0, 0, 1]; }

  function start(ctx, area, mode, opts = {}) {
    if (!area || area.type !== 'view3d') return false;
    const data = collect(ctx, area);
    if (data.mode === 'object' && !data.items.length) return false;
    if (data.mode === 'edit' && !data.items.some(i => i.w === 1)) return false;
    const sv = B.View3D.setMatrices(ctx, area);
    const pivot = pivotOf(ctx, area, data);
    const ps = B.View3D.project(sv, pivot) || [ctx.mouse[0], ctx.mouse[1], 0.5];
    const m0 = (opts.mouse || ctx.mouse).slice();
    const st = { mode, axis: null, trackball: false, sv, data, pivot, ps, m0, m: m0.slice(), propsize: ctx.G.propsize || 1, releaseButton: opts.releaseButton };
    if (data.mode === 'edit') propWeights(ctx, data, st.propsize);
    const finish = ok => {
      if (!ok) restore(ctx, st);
      area.headerPrint = null;
      ctx.propCircle = null;
      if (ok && data.mode === 'edit' && ctx.G.editMesh) ctx.G.editMesh.stamp = (ctx.G.editMesh.stamp || 0) + 1;
      if (ok && data.mode === 'edit' && ctx.G.obedit && B.EditExtra && B.EditExtra[ctx.G.obedit.type] && B.EditExtra[ctx.G.obedit.type].afterTransform) B.EditExtra[ctx.G.obedit.type].afterTransform(ctx);
      ctx.redrawAll();
      return true;
    };
    const modal = {
      move(e) { st.m = [e.x, e.y]; st.shift = e.shift; st.ctrl = e.ctrl; apply(ctx, area, st); return false; },
      down(e) {
        if (e.button === 0) return finish(true);
        if (e.button === 2) return finish(false);
        if (e.button === 1) {
          if (st.mode === 'grab' || st.mode === 'size') {
            const d = [st.m[0] - st.m0[0], st.m[1] - st.m0[1]];
            let best = 'X', bd = -1;
            ['X', 'Y', 'Z'].forEach(c => {
              const s = B.View3D.project(st.sv, V.add(st.pivot, axisVec(c)));
              if (!s) return;
              const sd = [s[0] - st.ps[0], s[1] - st.ps[1]];
              const l = Math.hypot(sd[0], sd[1]) || 1;
              const dot = Math.abs((d[0] * sd[0] + d[1] * sd[1]) / l);
              if (dot > bd) { bd = dot; best = c; }
            });
            st.axis = st.axis ? null : best;
            apply(ctx, area, st);
          }
        }
        return false;
      },
      up(e) {
        if (st.releaseButton != null && e.button === st.releaseButton) return finish(true);
        return false;
      },
      wheel(e) {
        if (ctx.G.f.proportional && data.mode === 'edit') {
          st.propsize = B.clamp(st.propsize * (e.delta > 0 ? 1.1 : 1 / 1.1), 0.001, 100);
          ctx.G.propsize = st.propsize;
          propWeights(ctx, data, st.propsize);
          apply(ctx, area, st);
        }
        return false;
      },
      key(e) {
        const k = e.key;
        if (k === 'ESC') return finish(false);
        if (k === 'RET' || k === 'PADENTER' || k === 'SPACE') return finish(true);
        if (k === 'X' || k === 'Y' || k === 'Z') { st.axis = st.axis === k ? null : k; apply(ctx, area, st); return false; }
        if (k === 'R' && st.mode === 'rot') { st.trackball = !st.trackball; st.m0 = st.m.slice(); apply(ctx, area, st); return false; }
        if (k === 'G' && st.mode !== 'grab') { restore(ctx, st); st.mode = 'grab'; st.m0 = st.m.slice(); apply(ctx, area, st); return false; }
        if (k === 'R' && st.mode !== 'rot') { restore(ctx, st); st.mode = 'rot'; st.m0 = st.m.slice(); apply(ctx, area, st); return false; }
        if (k === 'S' && st.mode !== 'size') { restore(ctx, st); st.mode = 'size'; st.m0 = st.m.slice(); apply(ctx, area, st); return false; }
        if ((k === 'PAGEUP' || k === 'PADPLUS') && ctx.G.f.proportional) { st.propsize *= 1.1; ctx.G.propsize = st.propsize; propWeights(ctx, data, st.propsize); apply(ctx, area, st); return false; }
        if ((k === 'PAGEDOWN' || k === 'PADMINUS') && ctx.G.f.proportional) { st.propsize /= 1.1; ctx.G.propsize = st.propsize; propWeights(ctx, data, st.propsize); apply(ctx, area, st); return false; }
        return false;
      },
      cancel() { restore(ctx, st); area.headerPrint = null; ctx.propCircle = null; }
    };
    ctx.modal = modal;
    apply(ctx, area, st);
    return true;
  }

  function restore(ctx, st) {
    const d = st.data;
    if (d.mode === 'edit') {
      d.items.forEach(it => { if (it.restore) it.restore(it.co); else it.p.co = V.copy(it.co); });
    } else {
      d.items.forEach(it => { it.ob.loc = V.copy(it.loc); it.ob.rot = V.copy(it.rot); it.ob.size = V.copy(it.size); B.Data.whereIs(it.ob); });
    }
  }

  function gridStep(st) {
    const sv = st.sv;
    let step = sv.grid || 1;
    if (sv.persp === 0) {
      const pix = 1 / sv.pixsize;
      while (step * pix < 6) step *= 10;
    }
    return step;
  }

  function apply(ctx, area, st) {
    const d = st.data, sv = st.sv;
    restore(ctx, st);
    let fine = st.shift ? 0.1 : 1;
    const ctrl = st.ctrl || (st.mode === 'grab' && ctx.prefs.grabGrid) || (st.mode === 'rot' && ctx.prefs.rotGrid) || (st.mode === 'size' && ctx.prefs.sizeGrid);
    let xform;
    let text = '';
    if (st.mode === 'grab') {
      const dm = [(st.m[0] - st.m0[0]) * fine, (st.m[1] - st.m0[1]) * fine];
      let delta;
      if (st.axis) {
        const ax = axisVec(st.axis);
        const s = B.View3D.project(sv, V.add(st.pivot, ax));
        const sd = s ? [s[0] - st.ps[0], s[1] - st.ps[1]] : [1, 0];
        const l2 = sd[0] * sd[0] + sd[1] * sd[1];
        const t = l2 > 1e-6 ? (dm[0] * sd[0] + dm[1] * sd[1]) / l2 : 0;
        delta = V.mul(ax, t);
      } else delta = B.View3D.viewDelta(sv, dm[0], dm[1], st.pivot);
      if (ctrl) { const g = gridStep(st) * (st.shift ? 0.1 : 1); delta = delta.map(v => Math.round(v / g) * g); }
      xform = { type: 'grab', delta };
      text = `Dx: ${delta[0].toFixed(4)}   Dy: ${delta[1].toFixed(4)}  Dz: ${delta[2].toFixed(4)}`;
    } else if (st.mode === 'rot') {
      if (st.trackball) {
        const dx = (st.m[0] - st.m0[0]) * 0.01 * fine, dy = (st.m[1] - st.m0[1]) * 0.01 * fine;
        const vx = M.dir(sv.viewinv, [0, 1, 0]), vy = M.dir(sv.viewinv, [1, 0, 0]);
        let q = Q.mul(Q.axisAngle(vx, dx), Q.axisAngle(vy, -dy));
        xform = { type: 'rot', quat: q };
        text = `Rotx: ${(dx / B.DEG).toFixed(2)}  Roty: ${(dy / B.DEG).toFixed(2)}`;
      } else {
        const a0 = Math.atan2(st.m0[1] - st.ps[1], st.m0[0] - st.ps[0]);
        const a1 = Math.atan2(st.m[1] - st.ps[1], st.m[0] - st.ps[0]);
        let ang = (a1 - a0) * fine;
        while (ang > Math.PI) ang -= Math.PI * 2;
        while (ang < -Math.PI) ang += Math.PI * 2;
        if (ctrl) ang = Math.round(ang / (5 * B.DEG)) * 5 * B.DEG;
        let axis = B.View3D.viewVector(sv);
        if (st.axis) {
          const ax = axisVec(st.axis);
          axis = V.dot(ax, axis) < 0 ? V.neg(ax) : ax;
        }
        xform = { type: 'rot', quat: Q.axisAngle(axis, ang) };
        text = st.axis ? `Rot ${st.axis}: ${(ang / B.DEG).toFixed(2)}` : `Rot: ${(ang / B.DEG).toFixed(2)}`;
      }
    } else if (st.mode === 'size') {
      const d0 = Math.hypot(st.m0[0] - st.ps[0], st.m0[1] - st.ps[1]) || 1;
      const d1 = Math.hypot(st.m[0] - st.ps[0], st.m[1] - st.ps[1]);
      let f = 1 + (d1 / d0 - 1) * fine;
      const flip = ((st.m[0] - st.ps[0]) * (st.m0[0] - st.ps[0]) + (st.m[1] - st.ps[1]) * (st.m0[1] - st.ps[1])) < 0;
      if (flip) f = -f;
      if (ctrl) f = Math.round(f * 10) / 10;
      const s = st.axis ? axisVec(st.axis).map(v => (v ? f : 1)) : [f, f, f];
      xform = { type: 'size', size: s };
      text = `Sizex: ${s[0].toFixed(3)}   Sizey: ${s[1].toFixed(3)}  Sizez: ${s[2].toFixed(3)}`;
    } else if (st.mode === 'shear') {
      const dm = (st.m[0] - st.m0[0]) * 0.01 * fine;
      xform = { type: 'shear', fac: ctrl ? Math.round(dm * 10) / 10 : dm };
      text = `Shear: ${xform.fac.toFixed(3)} `;
    } else if (st.mode === 'warp') {
      const dm = (st.m[0] - st.m0[0]) * 0.5 * fine;
      xform = { type: 'warp', ang: ctrl ? Math.round(dm / 5) * 5 : dm };
      text = `Warp ${xform.ang.toFixed(3)}`;
    }
    if (st.axis && st.mode === 'grab') text += '   (' + st.axis + ')';
    applyXform(ctx, area, st, xform);
    area.headerPrint = text;
    if (ctx.G.f.proportional && d.mode === 'edit') {
      const s = B.View3D.project(sv, st.pivot), e = B.View3D.project(sv, V.add(st.pivot, V.mul(M.dir(sv.viewinv, [1, 0, 0]), st.propsize)));
      ctx.propCircle = s && e ? { x: s[0], y: s[1], r: Math.hypot(e[0] - s[0], e[1] - s[1]) } : null;
    }
    area.redraw();
    ctx.redrawType('buts');
    ctx.redrawType('info');
    ctx.schedule();
  }

  function pointXform(xf, p, pivot, sv, w) {
    if (xf.type === 'grab') return V.add(p, V.mul(xf.delta, w));
    if (xf.type === 'rot') {
      const q = w === 1 ? xf.quat : slerpIdent(xf.quat, w);
      return V.add(pivot, Q.rotate(q, V.sub(p, pivot)));
    }
    if (xf.type === 'size') {
      const s = xf.size.map(v => 1 + (v - 1) * w);
      return V.add(pivot, V.mulv(V.sub(p, pivot), s));
    }
    if (xf.type === 'shear') {
      const vx = M.dir(sv.viewinv, [1, 0, 0]), vy = M.dir(sv.viewinv, [0, 1, 0]);
      const rel = V.sub(p, pivot);
      return V.add(p, V.mul(vx, V.dot(rel, vy) * xf.fac * w));
    }
    if (xf.type === 'warp') {
      return p;
    }
    return p;
  }

  function slerpIdent(q, t) {
    const ang = 2 * Math.acos(B.clamp(q[0], -1, 1));
    const s = Math.sqrt(Math.max(0, 1 - q[0] * q[0]));
    if (s < 1e-6) return [1, 0, 0, 0];
    return Q.axisAngle([q[1] / s, q[2] / s, q[3] / s], ang * t);
  }

  function applyXform(ctx, area, st, xf) {
    const d = st.data, sv = st.sv;
    if (d.mode === 'edit') {
      if (xf.type === 'warp') {
        const items = d.items.filter(i => i.w === 1 || i.f > 0);
        const pts = items.map(i => i.world);
        const cursor = ctx.scene.cursor;
        const vx = M.dir(sv.viewinv, [1, 0, 0]), vy = M.dir(sv.viewinv, [0, 1, 0]);
        let minx = Infinity, maxx = -Infinity;
        pts.forEach(p => { const x = V.dot(V.sub(p, cursor), vx); minx = Math.min(minx, x); maxx = Math.max(maxx, x); });
        const width = (maxx - minx) || 1;
        const total = xf.ang * B.DEG;
        items.forEach(it => {
          const rel = V.sub(it.world, cursor);
          const x = V.dot(rel, vx), y = V.dot(rel, vy);
          const a = (x - minx) / width * total - total / 2;
          const r = y + width / (total || 1e-6);
          let np;
          if (Math.abs(total) < 1e-4) np = it.world;
          else np = V.add(cursor, V.add(V.mul(vx, Math.sin(a) * r), V.add(V.mul(vy, Math.cos(a) * r - width / total), V.mul(V.sub(rel, V.add(V.mul(vx, x), V.mul(vy, y))), 1))));
          const wv = it.p && it.p.sel ? 1 : it.f;
          const fin = V.lerp(it.world, np, wv);
          const loc = M.loc(d.inv, fin);
          if (it.apply) it.apply(loc); else it.p.co = loc;
        });
        return;
      }
      d.items.forEach(it => {
        const wv = (it.p && it.p.sel) || it.sel ? 1 : (it.f || 0);
        if (!wv) return;
        const np = pointXform(xf, it.world, st.pivot, sv, wv);
        const loc = M.loc(d.inv, np);
        if (it.apply) it.apply(loc); else it.p.co = loc;
      });
      return;
    }
    const individual = area.space.around === 'individual';
    d.items.forEach(it => {
      const ob = it.ob;
      const center = [it.world[12], it.world[13], it.world[14]];
      const piv = individual ? center : st.pivot;
      let world;
      if (xf.type === 'grab') {
        world = it.world.slice();
        world[12] += xf.delta[0]; world[13] += xf.delta[1]; world[14] += xf.delta[2];
      } else if (xf.type === 'rot') {
        const R = M.fromQuat(xf.quat);
        world = M.mul(M.translate(piv), M.mul(R, M.mul(M.translate(V.neg(piv)), it.world)));
      } else if (xf.type === 'size') {
        if (st.axis) {
          const local = it.size.slice();
          const ai = 'XYZ'.indexOf(st.axis);
          const fac = xf.size[ai];
          local[ai] *= fac;
          ob.size = local;
          if (!individual) {
            const c2 = V.add(piv, V.mulv(V.sub(center, piv), xf.size));
            const pl = M.dir(M.invert(it.peff), V.sub(c2, center));
            ob.loc = V.add(it.loc, pl);
          }
          B.Data.whereIs(ob);
          return;
        }
        const S = M.scale(xf.size);
        world = M.mul(M.translate(piv), M.mul(S, M.mul(M.translate(V.neg(piv)), it.world)));
      } else if (xf.type === 'shear') {
        return;
      } else return;
      const local = M.mul(M.invert(it.peff), world);
      const dcmp = decompose(local);
      ob.loc = V.sub(dcmp.loc, ob.dloc);
      if (xf.type === 'rot') ob.rot = V.sub(continuousEuler(dcmp.rot, it.rot), ob.drot);
      if (xf.type === 'size') ob.size = V.sub(dcmp.size, ob.dsize);
      B.Data.whereIs(ob);
    });
  }

  function continuousEuler(e, ref) {
    return e.map((v, i) => {
      let x = v;
      while (x - ref[i] > Math.PI) x -= Math.PI * 2;
      while (x - ref[i] < -Math.PI) x += Math.PI * 2;
      return x;
    });
  }

  function dragAfterSelect(ctx, area, ev) {
    const sx = ev.x, sy = ev.y;
    return {
      move(e) {
        if (Math.hypot(e.x - sx, e.y - sy) > 4) {
          ctx.modal = null;
          start(ctx, area, 'grab', { mouse: [sx, sy], releaseButton: 2 });
          if (ctx.modal) ctx.modal.move(e);
        }
        return false;
      },
      up() { return true; },
      key() { return true; }
    };
  }

  function key(ctx, area, ev) {
    const k = ev.key;
    const plain = !ev.ctrl && !ev.alt && !ev.shift;
    if (k === 'G' && plain) return start(ctx, area, 'grab') || true;
    if (k === 'R' && plain) return start(ctx, area, 'rot') || true;
    if (k === 'S' && plain) return start(ctx, area, 'size') || true;
    if (k === 'S' && ev.ctrl && !ev.alt && ctx.G.obedit) return start(ctx, area, 'shear') || true;
    if (k === 'W' && ev.shift && !ev.ctrl && ctx.G.obedit) return start(ctx, area, 'warp') || true;
    if (k === 'S' && ev.shift && !ev.ctrl && !ev.alt && !ctx.G.obedit) { B.Edit.snapMenu(ctx, area); return true; }
    return false;
  }

  function snap(ctx, area, mode) {
    const sv = B.View3D.setMatrices(ctx, area);
    const g = sv.grid || 1;
    const round = p => p.map(v => Math.round(v / g) * g);
    const sce = ctx.scene;
    const cursorTarget = sv.localview ? sv.localview : sce;
    if (ctx.G.obedit) {
      const ob = ctx.G.obedit;
      const inv = M.invert(ob.obmat);
      const pts = B.Edit.editPoints(ctx).filter(p => p.sel);
      if (mode === 1) pts.forEach(p => { p.co = M.loc(inv, round(M.loc(ob.obmat, p.co))); });
      else if (mode === 2) pts.forEach(p => { p.co = M.loc(inv, cursorTarget.cursor); });
      else if (mode === 3) cursorTarget.cursor = round(cursorTarget.cursor);
      else if (mode === 4 && pts.length) {
        const w = pts.map(p => M.loc(ob.obmat, p.co));
        cursorTarget.cursor = area.space.around === 'median' ? V.mul(w.reduce((a, b) => V.add(a, b), [0, 0, 0]), 1 / w.length) : V.mid(...B.View3D.boundBox(w));
      }
      B.Edit.changed(ctx);
      return;
    }
    const obs = selectedObjects(ctx, area);
    if (mode === 1 || mode === 2) {
      obs.forEach(ob => {
        B.Data.whereIs(ob);
        const peff = parentEffect(ob);
        const cur = [ob.obmat[12], ob.obmat[13], ob.obmat[14]];
        const target = mode === 1 ? round(cur) : cursorTarget.cursor;
        const d = M.dir(M.invert(peff), V.sub(target, cur));
        ob.loc = V.add(ob.loc, d);
        B.Data.whereIs(ob);
      });
    } else if (mode === 3) cursorTarget.cursor = round(cursorTarget.cursor);
    else if (mode === 4 && obs.length) {
      const w = obs.map(ob => [ob.obmat[12], ob.obmat[13], ob.obmat[14]]);
      cursorTarget.cursor = area.space.around === 'median' ? V.mul(w.reduce((a, b) => V.add(a, b), [0, 0, 0]), 1 / w.length) : V.mid(...B.View3D.boundBox(w));
    }
    ctx.redrawAll();
  }

  B.Transform = { start, key, snap, dragAfterSelect, selectedObjects, parentEffect, decompose };
})(globalThis.B204 = globalThis.B204 || {});
