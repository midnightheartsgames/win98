(function (B) {
  'use strict';
  const rgb = B.rgb;
  const COL = B.UI.COL;
  const A = () => B.Anim;

  const CURVE_COLS = [rgb(255, 80, 80), rgb(80, 255, 80), rgb(100, 100, 255), rgb(255, 160, 80), rgb(160, 255, 160), rgb(160, 160, 255), rgb(255, 255, 80), rgb(80, 255, 255), rgb(255, 80, 255)];

  function init() { return { blocktype: 'OB', x1: -5, x2: 255, y1: -5, y2: 6, showkey: false, edit: false, lock: false }; }

  function owner(ctx, bt) {
    const ob = ctx.scene.basact ? ctx.scene.basact.object : null;
    if (bt === 'OB') return ob;
    if (bt === 'MA') return B.Shading ? B.Shading.activeMaterial(ctx) : null;
    if (bt === 'WO') return ctx.scene.world;
    if (bt === 'LA') return ob && ob.type === 'lamp' ? ob.data : null;
    if (bt === 'CA') return ob && ob.type === 'camera' ? ob.data : null;
    if (bt === 'KE') return ob && ob.data && ob.data.key ? ob.data.key : null;
    return null;
  }

  function ipoOf(ctx, sp) { const o = owner(ctx, sp.blocktype); return o ? o.ipo : null; }

  function map(area, sp) {
    const w = area.win;
    const cx2 = w.x2 - 66;
    return {
      x: f => w.x1 + (f - sp.x1) / (sp.x2 - sp.x1) * (cx2 - w.x1),
      y: v => w.y1 + 16 + (v - sp.y1) / (sp.y2 - sp.y1) * (w.y2 - w.y1 - 16),
      fx: px => sp.x1 + (px - w.x1) / (cx2 - w.x1) * (sp.x2 - sp.x1),
      fy: py => sp.y1 + (py - w.y1 - 16) / (w.y2 - w.y1 - 16) * (sp.y2 - sp.y1),
      cx2
    };
  }

  function niceStep(range, px) {
    const raw = range / Math.max(1, px / 50);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 2 ? 2 : m < 5 ? 5 : 10) * p;
  }

  function draw(ctx, area, r) {
    const sp = area.space;
    const w = area.win;
    const m = map(area, sp);
    r.rect(w.x1, w.y1, w.x2 + 1, w.y2 + 1, rgb(115, 115, 115));
    const sx = niceStep(sp.x2 - sp.x1, m.cx2 - w.x1), sy = niceStep(sp.y2 - sp.y1, w.y2 - w.y1 - 16);
    for (let f = Math.ceil(sp.x1 / sx) * sx; f <= sp.x2; f += sx) r.vline(Math.round(m.x(f)), w.y1 + 16, w.y2, rgb(100, 100, 100));
    for (let v = Math.ceil(sp.y1 / sy) * sy; v <= sp.y2; v += sy) {
      const y = Math.round(m.y(v));
      r.hline(w.x1, m.cx2, y, Math.abs(v) < 1e-9 ? rgb(70, 70, 70) : rgb(100, 100, 100));
      r.text('helv8', fmt(v), w.x1 + 2, y + 2, rgb(0, 0, 0));
    }
    r.rect(w.x1, w.y1, m.cx2 + 1, w.y1 + 16, rgb(115, 115, 115));
    for (let f = Math.ceil(sp.x1 / sx) * sx; f <= sp.x2; f += sx) { const x = Math.round(m.x(f)); r.text('helv10', fmt(f), x - 6, w.y1 + 4, rgb(0, 0, 0)); }
    const sce = ctx.scene;
    const sf = Math.round(m.x(sce.r.sfra)), ef = Math.round(m.x(sce.r.efra));
    r.rectBlend(w.x1, w.y1 + 16, sf, w.y2 + 1, rgb(0, 0, 0), 0.08);
    r.rectBlend(ef, w.y1 + 16, m.cx2, w.y2 + 1, rgb(0, 0, 0), 0.08);
    const ipo = ipoOf(ctx, sp);
    const names = A().CHANNELS[sp.blocktype] || [];
    if (ipo) {
      r.pushClip(w.x1, w.y1 + 16, m.cx2, w.y2);
      ipo.curves.forEach(cu => {
        if (cu.hide || !cu.bezt.length) return;
        const col = CURVE_COLS[names.indexOf(cu.name) % CURVE_COLS.length] || rgb(255, 255, 255);
        const c = cu.sel ? B.shade(col, 0) : B.mix(col, rgb(0, 0, 0), 0.45);
        let prev = null;
        const step = (sp.x2 - sp.x1) / Math.max(40, m.cx2 - w.x1);
        for (let f = sp.x1; f <= sp.x2 + step; f += step) {
          const v = A().evalCurve(cu, f);
          const p = [m.x(f), m.y(v)];
          if (prev) r.line(prev[0], prev[1], p[0], p[1], c);
          prev = p;
        }
        if (sp.showkey) return;
        cu.bezt.forEach(bz => {
          const p = bz.vec[1];
          const x = Math.round(m.x(p[0])), y = Math.round(m.y(p[1]));
          if (sp.edit && cu.sel && cu.ipo === 'bezier') {
            const h1 = bz.vec[0], h2 = bz.vec[2];
            const hc = bz.sel ? rgb(255, 160, 160) : rgb(130, 60, 60);
            r.line(m.x(h1[0]), m.y(h1[1]), x, y, hc);
            r.line(x, y, m.x(h2[0]), m.y(h2[1]), hc);
            [h1, h2].forEach((h, hi) => { const hs = (hi === 0 ? bz.sel1 : bz.sel3) ? rgb(255, 255, 112) : rgb(0, 0, 0); r.rect(Math.round(m.x(h[0])) - 1, Math.round(m.y(h[1])) - 1, Math.round(m.x(h[0])) + 2, Math.round(m.y(h[1])) + 2, hs); });
          }
          const pc = sp.edit && cu.sel ? (bz.sel ? rgb(255, 255, 112) : rgb(0, 0, 0)) : c;
          r.rect(x - 1, y - 1, x + 2, y + 2, pc);
        });
      });
      if (sp.showkey) {
        const keys = new Set();
        ipo.curves.forEach(cu => cu.bezt.forEach(bz => keys.add(Math.round(bz.vec[1][0] * 100) / 100)));
        keys.forEach(k => { const x = Math.round(m.x(k)); r.vline(x, w.y1 + 16, w.y2, rgb(0, 0, 0)); r.vline(x + 1, w.y1 + 16, w.y2, rgb(160, 160, 160)); });
      }
      r.popClip();
    }
    const cx = Math.round(m.x(sce.cfra));
    if (cx >= w.x1 && cx <= m.cx2) { r.vline(cx, w.y1, w.y2, rgb(96, 192, 64)); r.vline(cx + 1, w.y1, w.y2, rgb(32, 96, 0)); }
    r.rect(m.cx2 + 1, w.y1, w.x2 + 1, w.y2 + 1, rgb(160, 120, 120));
    r.vline(m.cx2 + 1, w.y1, w.y2, rgb(0, 0, 0));
    const blk = new B.UI.Block(r, { ox: m.cx2 + 4, oy: w.y2, font: 'helv10', area });
    blk.col = rgb(160, 120, 120);
    const lh = 17;
    names.forEach((n, i) => {
      const y = -(i + 1) * lh;
      if (w.y2 + y < w.y1) return;
      const cu = ipo ? ipo.curves.find(c => c.name === n) : null;
      const has = cu && cu.bezt.length;
      const col = CURVE_COLS[i % CURVE_COLS.length];
      if (has) {
        const vis = blk.but('', 0, y + 3, 10, 11, () => { cu.hide = !cu.hide; ctx.redraw(area); }, 'Toggle visibility');
        vis.col = cu.hide ? rgb(80, 80, 80) : col;
        vis.flat = true;
      }
      const b = blk.but(n, 12, y, 48, lh - 1, ev => selectChannel(ctx, area, n, ev && ev.shift), n);
      b.flat = true;
      b.col = cu && cu.sel ? rgb(200, 150, 150) : rgb(160, 120, 120);
      b.left = true;
      b.font = 'helv10';
      if (!has) b.col = rgb(150, 112, 112);
    });
    blk.draw();
    area.winBlock = blk;
  }

  function fmt(v) { const a = Math.abs(v); if (a >= 100 || Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v)); return v.toFixed(a < 1 ? 2 : 1); }

  function selectChannel(ctx, area, name, extend) {
    const sp = area.space;
    let ipo = ipoOf(ctx, sp);
    const own = owner(ctx, sp.blocktype);
    if (!own) return;
    if (!ipo) ipo = A().ensureIpo(ctx, own, sp.blocktype);
    const cu = A().curveOf(ipo, name, true);
    if (!extend) ipo.curves.forEach(c => { c.sel = false; });
    cu.sel = !cu.sel || !extend;
    ctx.redrawAll();
  }

  function header(ctx, area, blk) {
    const sp = area.space;
    B.ScreenDraw.stdHeaderButtons(blk, area, ctx);
    blk.icon([15, 0], 65, 0, 21, 22, () => viewAll(ctx, area), 'Home (HOMEKEY)');
    let x = 94;
    blk.icontog([18, 6], x, 0, 21, 22, () => sp.showkey, v => { sp.showkey = !!v; ctx.redraw(area); }, 'Toggles curve/key display (KKEY)');
    x += 30;
    const types = [['OB', [7, 8], 'Display Object Ipos'], ['MA', [8, 4], 'Display Material Ipos'], ['WO', [5, 7], 'Display World Ipos'], ['LA', [1, 7], 'Display Lamp Ipos'], ['CA', [2, 1], 'Display Camera Ipos'], ['KE', [7, 7], 'Display VertexKeys Ipos']];
    types.forEach(([v, ic, tip], i) => blk.add('ROW', { icon: ic, x: x + i * 20, y: 0, w: 20, h: 22, get: () => sp.blocktype, set: t => { sp.blocktype = t; sp.edit = false; viewAll(ctx, area); }, rowValue: v, tip }));
    x += types.length * 20 + 10;
    blk.icon([14, 7], x, 0, 20, 22, () => copyCurves(ctx, area), 'Copies the selected curves to the buffer');
    blk.icon([13, 7], x + 20, 0, 20, 22, () => pasteCurves(ctx, area), 'Pastes the curves from the buffer');
    x += 50;
    const ext = [['constant', [15, 6], 'Sets the extend mode to constant'], ['extrap', [16, 6], 'Sets the extend mode to extrapolation'], ['cyclic', [17, 6], 'Sets the extend mode to cyclic'], ['cyclicx', [17, 7], 'Sets the extend mode to cyclic extrapolation']];
    ext.forEach(([v, ic, tip], i) => blk.icon(ic, x + i * 20, 0, 20, 22, () => setExtend(ctx, area, v), tip));
    x += 90;
    blk.icon([14, 0], x, 0, 21, 22, null, 'Translate view (MiddleMouse)');
    blk.icon([13, 0], x + 21, 0, 20, 22, null, 'Zoom view (CTRL+MiddleMouse)');
    x += 50;
    blk.icontog([3, 4], x, 0, 21, 22, () => sp.lock, v => { sp.lock = !!v; }, 'Lock redraw of other windows while editing');
  }

  function selCurves(ctx, sp) { const ipo = ipoOf(ctx, sp); return ipo ? ipo.curves.filter(c => c.sel && !c.hide) : []; }

  function setExtend(ctx, area, v) {
    const cs = selCurves(ctx, area.space);
    (cs.length ? cs : ((ipoOf(ctx, area.space) || {}).curves || [])).forEach(c => { c.extend = v; });
    ctx.redrawAll();
  }

  function copyCurves(ctx, area) {
    const cs = selCurves(ctx, area.space);
    if (!cs.length) { B.UI.error(ctx, 'No visible splines'); return; }
    B.ipoCopyBuf = { type: area.space.blocktype, curves: JSON.parse(JSON.stringify(cs)) };
    B.UI.notice(ctx, 'copied!');
  }

  function pasteCurves(ctx, area) {
    const sp = area.space;
    const buf = B.ipoCopyBuf;
    if (!buf) { B.UI.error(ctx, 'Copybuf is empty'); return; }
    if (buf.type !== sp.blocktype) { B.UI.error(ctx, 'Incompatible paste'); return; }
    const own = owner(ctx, sp.blocktype);
    if (!own) return;
    const ipo = A().ensureIpo(ctx, own, sp.blocktype);
    buf.curves.forEach(c => { const cu = A().curveOf(ipo, c.name, true); Object.assign(cu, JSON.parse(JSON.stringify(c))); });
    A().setFrame(ctx, ctx.scene.cfra);
  }

  function viewAll(ctx, area) {
    const sp = area.space;
    const ipo = ipoOf(ctx, sp);
    let x1 = Infinity, x2 = -Infinity, y1 = Infinity, y2 = -Infinity;
    if (ipo) ipo.curves.forEach(c => { if (c.hide) return; c.bezt.forEach(b => b.vec.forEach(p => { x1 = Math.min(x1, p[0]); x2 = Math.max(x2, p[0]); y1 = Math.min(y1, p[1]); y2 = Math.max(y2, p[1]); })); });
    if (!isFinite(x1)) { x1 = ctx.scene.r.sfra; x2 = ctx.scene.r.efra; y1 = -1; y2 = 1; }
    if (x2 - x1 < 10) { x1 -= 5; x2 += 5; }
    if (y2 - y1 < 0.5) { y1 -= 0.5; y2 += 0.5; }
    const dx = (x2 - x1) * 0.08, dy = (y2 - y1) * 0.15;
    Object.assign(sp, { x1: x1 - dx, x2: x2 + dx, y1: y1 - dy, y2: y2 + dy });
    ctx.redraw(area);
  }

  function nearestPoint(ctx, area, ev) {
    const sp = area.space;
    const m = map(area, sp);
    const ipo = ipoOf(ctx, sp);
    if (!ipo) return null;
    let best = null, bd = 12;
    ipo.curves.forEach(cu => {
      if (cu.hide || (sp.edit && !cu.sel)) return;
      cu.bezt.forEach(bz => {
        const cands = sp.edit && cu.ipo === 'bezier' ? [0, 1, 2] : [1];
        cands.forEach(k => {
          const p = bz.vec[k];
          const d = Math.hypot(m.x(p[0]) - ev.x, m.y(p[1]) - ev.y) + (k !== 1 ? 1 : 0);
          if (d < bd) { bd = d; best = { cu, bz, k }; }
        });
      });
    });
    return best;
  }

  function curveAt(ctx, area, ev) {
    const sp = area.space;
    const m = map(area, sp);
    const ipo = ipoOf(ctx, sp);
    if (!ipo) return null;
    let best = null, bd = 8;
    const f = m.fx(ev.x);
    ipo.curves.forEach(cu => {
      if (cu.hide || !cu.bezt.length) return;
      const d = Math.abs(m.y(A().evalCurve(cu, f)) - ev.y);
      if (d < bd) { bd = d; best = cu; }
    });
    return best;
  }

  function transformKeys(ctx, area, mode, ev) {
    const sp = area.space;
    const m = map(area, sp);
    const ipo = ipoOf(ctx, sp);
    if (!ipo) return;
    const pts = [];
    ipo.curves.forEach(cu => {
      if (cu.hide) return;
      cu.bezt.forEach(bz => {
        const whole = bz.sel && (!sp.edit || (!bz.sel1 && !bz.sel3) || (bz.sel1 && bz.sel3));
        if (sp.edit && !cu.sel) return;
        if (!sp.edit && !cu.sel) return;
        if (!sp.edit || whole) bz.vec.forEach(p => pts.push({ p, o: p.slice(), cu }));
        else { if (bz.sel1) pts.push({ p: bz.vec[0], o: bz.vec[0].slice(), cu, h: 0, bz }); if (bz.sel3) pts.push({ p: bz.vec[2], o: bz.vec[2].slice(), cu, h: 2, bz }); }
      });
    });
    if (!sp.edit) {
      pts.length = 0;
      ipo.curves.forEach(cu => { if (cu.sel && !cu.hide) cu.bezt.forEach(bz => bz.vec.forEach(p => pts.push({ p, o: p.slice(), cu }))); });
    }
    if (!pts.length) return;
    const cx = pts.reduce((s, q) => s + q.o[0], 0) / pts.length, cy = pts.reduce((s, q) => s + q.o[1], 0) / pts.length;
    const sx = ev.x, sy = ev.y;
    let axis = null;
    const apply = e => {
      const dx = m.fx(e.x) - m.fx(sx), dy = m.fy(e.y) - m.fy(sy);
      pts.forEach(q => {
        if (mode === 'grab') { q.p[0] = q.o[0] + (axis === 'Y' ? 0 : dx); q.p[1] = q.o[1] + (axis === 'X' ? 0 : dy); }
        else if (mode === 'size') {
          const f0 = Math.hypot(sx - m.x(cx), sy - m.y(cy)) || 1, f1 = Math.hypot(e.x - m.x(cx), e.y - m.y(cy));
          const f = f1 / f0;
          q.p[0] = cx + (q.o[0] - cx) * (axis === 'Y' ? 1 : f);
          q.p[1] = cy + (q.o[1] - cy) * (axis === 'X' ? 1 : f);
        }
        if (e.ctrl && mode === 'grab') q.p[0] = Math.round(q.p[0]);
      });
      ipo.curves.forEach(cu => { if (cu.sel) cu.bezt.forEach(bz => { if (bz.h1 === 'auto' || bz.h2 === 'auto' || bz.h1 === 'vect') void 0; }); A().calcHandles(cu); });
      area.headerPrint = mode === 'grab' ? `X: ${dx.toFixed(3)}   Y: ${dy.toFixed(3)}  ` : `sizeX: ${(1).toFixed(3)}   sizeY: ${(1).toFixed(3)}  `;
      A().setFrame(ctx, ctx.scene.cfra, true);
      ctx.redrawAll();
    };
    ctx.modal = {
      move: e => { apply(e); return false; },
      down: e => {
        if (e.button === 2) pts.forEach(q => { q.p[0] = q.o[0]; q.p[1] = q.o[1]; });
        area.headerPrint = null;
        ipo.curves.forEach(cu => A().calcHandles(cu));
        A().setFrame(ctx, ctx.scene.cfra);
        return true;
      },
      key: e => {
        if (e.key === 'X' || e.key === 'Y') { axis = axis === e.key ? null : e.key; return false; }
        if (e.key === 'ESC') { pts.forEach(q => { q.p[0] = q.o[0]; q.p[1] = q.o[1]; }); area.headerPrint = null; A().setFrame(ctx, ctx.scene.cfra); return true; }
        if (e.key === 'RET' || e.key === 'SPACE') { area.headerPrint = null; A().setFrame(ctx, ctx.scene.cfra); return true; }
        return false;
      }
    };
  }

  function event(ctx, area, ev) {
    const sp = area.space;
    const m = map(area, sp);
    if (ev.type === 'down' && area.inWin(ev.x, ev.y) && ev.x <= m.cx2) {
      if (ev.button === 0) {
        const setf = e => { const f = Math.max(1, Math.round(m.fx(e.x))); if (f !== ctx.scene.cfra) { ctx.scene.cfra = f; A().setFrame(ctx, f); } };
        setf(ev);
        ctx.modal = { move: e => { setf(e); return false; }, up: () => true };
        return true;
      }
      if (ev.button === 1) {
        const s0 = { x1: sp.x1, x2: sp.x2, y1: sp.y1, y2: sp.y2 }, sx = ev.x, sy = ev.y;
        ctx.modal = {
          move: e => {
            if (ev.ctrl) {
              const fx = Math.exp((e.x - sx) * -0.01), fy = Math.exp((e.y - sy) * -0.01);
              const cx = (s0.x1 + s0.x2) / 2, cy = (s0.y1 + s0.y2) / 2;
              sp.x1 = cx - (cx - s0.x1) * fx; sp.x2 = cx + (s0.x2 - cx) * fx; sp.y1 = cy - (cy - s0.y1) * fy; sp.y2 = cy + (s0.y2 - cy) * fy;
            } else {
              const dx = (e.x - sx) / (m.cx2 - area.win.x1) * (s0.x2 - s0.x1), dy = (e.y - sy) / (area.win.y2 - area.win.y1 - 16) * (s0.y2 - s0.y1);
              sp.x1 = s0.x1 - dx; sp.x2 = s0.x2 - dx; sp.y1 = s0.y1 - dy; sp.y2 = s0.y2 - dy;
            }
            ctx.redraw(area);
            return false;
          },
          up: () => true
        };
        return true;
      }
      if (ev.button === 2) {
        const ipo = ipoOf(ctx, sp);
        if (!ipo) return true;
        if (sp.edit) {
          const p = nearestPoint(ctx, area, ev);
          if (!ev.shift) ipo.curves.forEach(c => c.bezt.forEach(b => { b.sel = false; b.sel1 = false; b.sel3 = false; }));
          if (p) {
            if (p.k === 1) { p.bz.sel = ev.shift ? !p.bz.sel : true; p.bz.sel1 = false; p.bz.sel3 = false; }
            else { p.bz.sel = true; if (p.k === 0) p.bz.sel1 = true; else p.bz.sel3 = true; }
          }
        } else {
          const cu = curveAt(ctx, area, ev);
          if (!ev.shift) ipo.curves.forEach(c => { c.sel = false; });
          if (cu) cu.sel = ev.shift ? !cu.sel : true;
        }
        ctx.redraw(area);
        const sx = ev.x, sy = ev.y;
        ctx.modal = { move: e => { if (Math.hypot(e.x - sx, e.y - sy) > 4) { ctx.modal = null; transformKeys(ctx, area, 'grab', { x: sx, y: sy }); } return false; }, up: () => true };
        return true;
      }
    }
    if (ev.type === 'wheel' && area.inWin(ev.x, ev.y)) {
      const f = ev.delta > 0 ? 1.15 : 1 / 1.15;
      const cx = (sp.x1 + sp.x2) / 2, cy = (sp.y1 + sp.y2) / 2;
      sp.x1 = cx - (cx - sp.x1) * f; sp.x2 = cx + (sp.x2 - cx) * f; sp.y1 = cy - (cy - sp.y1) * f; sp.y2 = cy + (sp.y2 - cy) * f;
      ctx.redraw(area);
      return true;
    }
    if (ev.type !== 'key') return false;
    const k = ev.key;
    const ipo = ipoOf(ctx, sp);
    const plain = !ev.shift && !ev.ctrl && !ev.alt;
    if (k === 'HOME') { viewAll(ctx, area); return true; }
    if (k === 'TAB') { sp.edit = !sp.edit; ctx.redraw(area); return true; }
    if (k === 'K' && plain) { sp.showkey = !sp.showkey; ctx.redraw(area); return true; }
    if (!ipo) return false;
    if (k === 'A' && plain) {
      if (sp.edit) { const any = ipo.curves.some(c => c.sel && c.bezt.some(b => b.sel)); ipo.curves.forEach(c => { if (c.sel) c.bezt.forEach(b => { b.sel = !any; b.sel1 = false; b.sel3 = false; }); }); }
      else { const any = ipo.curves.some(c => c.sel); ipo.curves.forEach(c => { c.sel = !any; }); }
      ctx.redraw(area);
      return true;
    }
    if ((k === 'G' || k === 'S') && plain) { transformKeys(ctx, area, k === 'G' ? 'grab' : 'size', ev); return true; }
    if ((k === 'X' || k === 'DEL') && plain) {
      B.UI.okee(ctx, 'Erase selected').then(ok => {
        if (!ok) return;
        if (sp.edit) ipo.curves.forEach(c => { if (c.sel) c.bezt = c.bezt.filter(b => !b.sel); });
        else ipo.curves = ipo.curves.filter(c => !c.sel);
        ipo.curves.forEach(c => A().calcHandles(c));
        A().setFrame(ctx, ctx.scene.cfra);
      });
      return true;
    }
    if (k === 'D' && ev.shift && sp.edit) {
      ipo.curves.forEach(c => {
        if (!c.sel) return;
        const dup = c.bezt.filter(b => b.sel).map(b => ({ vec: b.vec.map(p => p.slice()), h1: b.h1, h2: b.h2, sel: true }));
        c.bezt.forEach(b => { b.sel = false; });
        c.bezt.push(...dup);
      });
      transformKeys(ctx, area, 'grab', ev);
      return true;
    }
    if (k === 'T' && plain) {
      B.UI.pupmenu(ctx, 'Ipo Type %t|Constant %x1|Linear %x2|Bezier %x3').then(v => {
        if (v < 1 || v == null) return;
        ipo.curves.forEach(c => { if (c.sel) c.ipo = ['', 'constant', 'linear', 'bezier'][v]; });
        A().setFrame(ctx, ctx.scene.cfra);
      });
      return true;
    }
    if ((k === 'H' || k === 'V') && sp.edit) {
      const type = k === 'V' ? 'vect' : ev.shift ? 'auto' : 'align';
      ipo.curves.forEach(c => { if (!c.sel) return; c.bezt.forEach(b => { if (b.sel) { b.h1 = type === 'align' ? (b.h1 === 'free' ? 'align' : 'free') : type; b.h2 = b.h1; } }); A().calcHandles(c); });
      A().setFrame(ctx, ctx.scene.cfra);
      return true;
    }
    if (k === 'E' && ev.shift) {
      B.UI.pupmenu(ctx, 'Ipo extend mode %t|Constant %x1|Extrapolation %x2|Cyclic %x3|Cyclic Extrapolation %x4').then(v => { if (v > 0) setExtend(ctx, area, ['', 'constant', 'extrap', 'cyclic', 'cyclicx'][v]); });
      return true;
    }
    if (k === 'I' && plain) {
      const f = ctx.scene.cfra;
      ipo.curves.forEach(c => { if (c.sel && !c.hide) A().insertKey(c, f, A().evalCurve(c, f)); });
      ctx.redrawAll();
      return true;
    }
    if (k === 'C' && ev.ctrl) { copyCurves(ctx, area); return true; }
    if (k === 'V' && ev.ctrl) { pasteCurves(ctx, area); return true; }
    if (k === 'B' && plain) {
      let p0 = null;
      ctx.modal = {
        down: e => { if (e.button === 2) return true; p0 = [e.x, e.y]; return false; },
        up: e => {
          if (!p0) return false;
          const fx1 = Math.min(m.fx(p0[0]), m.fx(e.x)), fx2 = Math.max(m.fx(p0[0]), m.fx(e.x)), fy1 = Math.min(m.fy(p0[1]), m.fy(e.y)), fy2 = Math.max(m.fy(p0[1]), m.fy(e.y));
          ipo.curves.forEach(c => { if (c.hide) return; if (sp.edit) { if (c.sel) c.bezt.forEach(b => { const q = b.vec[1]; if (q[0] >= fx1 && q[0] <= fx2 && q[1] >= fy1 && q[1] <= fy2) b.sel = e.button !== 1; }); } else if (c.bezt.some(b => { const q = b.vec[1]; return q[0] >= fx1 && q[0] <= fx2 && q[1] >= fy1 && q[1] <= fy2; })) c.sel = true; });
          ctx.redraw(area);
          return true;
        },
        key: e => e.key === 'ESC'
      };
      return true;
    }
    return false;
  }

  B.IpoSpace = { viewAll, owner, ipoOf };
  B.SPACES.ipo = { name: 'IpoWindow', init, draw, header, event };
})(globalThis.B204 = globalThis.B204 || {});
