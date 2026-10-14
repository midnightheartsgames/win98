(function (B) {
  'use strict';
  const rgb = B.rgb;
  const COL = B.UI.COL;

  function init() { return { image: null, zoom: 1, x: 0, y: 0, sel: new Set(), square: false, clip: false, lock: true, anim: false }; }

  function faceSelOb(ctx) {
    const b = ctx.scene.basact;
    return ctx.G.f.faceselect && b && b.object.type === 'mesh' && b.object.data.tfaces ? b.object : null;
  }

  function selFaces(ob) { return ob.data.faces.map((f, i) => [f, i]).filter(([f]) => f.sel && f.uv); }

  function curImage(ctx, sp) {
    const ob = faceSelOb(ctx);
    if (ob) {
      const act = ob.data.faces[ob.data.actface];
      if (act && act.tf && act.tf.image) return act.tf.image;
    }
    return sp.image;
  }

  function frameOf(area, sp, im) {
    const w = area.win;
    const iw = im && im.pix ? im.pix.w : 256, ih = im && im.pix ? im.pix.h : 256;
    const s = sp.zoom;
    const x0 = w.x1 + area.winx / 2 - iw * s / 2 + sp.x, y0 = w.y1 + area.winy / 2 - ih * s / 2 + sp.y;
    return { x0, y0, iw, ih, s, toS: uv => [x0 + uv[0] * iw * s, y0 + uv[1] * ih * s], toUV: (x, y) => [(x - x0) / (iw * s), (y - y0) / (ih * s)] };
  }

  function draw(ctx, area, r) {
    const sp = area.space;
    const w = area.win;
    r.rect(w.x1, w.y1, w.x2 + 1, w.y2 + 1, rgb(48, 48, 48));
    const im = curImage(ctx, sp);
    const fr = frameOf(area, sp, im);
    if (im && im.pix) r.blit(im.pix, fr.x0, fr.y0, fr.s);
    else {
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) r.rect(fr.x0 + i * 32 * fr.s, fr.y0 + j * 32 * fr.s, fr.x0 + (i + 1) * 32 * fr.s, fr.y0 + (j + 1) * 32 * fr.s, (i + j) & 1 ? rgb(64, 64, 64) : rgb(80, 80, 80));
    }
    const ob = faceSelOb(ctx);
    if (!ob) return;
    selFaces(ob).forEach(([f, fi]) => {
      const pts = f.uv.map(fr.toS);
      for (let k = 0; k < pts.length; k++) r.line(pts[k][0], pts[k][1], pts[(k + 1) % pts.length][0], pts[(k + 1) % pts.length][1], fi === ob.data.actface ? rgb(255, 255, 255) : rgb(180, 180, 255));
      pts.forEach((p, k) => { const s = sp.sel.has(fi + ':' + k); r.rect(Math.round(p[0]) - 1, Math.round(p[1]) - 1, Math.round(p[0]) + 2, Math.round(p[1]) + 2, s ? rgb(255, 255, 112) : rgb(255, 112, 255)); });
    });
  }

  function header(ctx, area, blk) {
    const sp = area.space;
    B.ScreenDraw.stdHeaderButtons(blk, area, ctx);
    blk.icon([15, 0], 65, 0, 21, 22, () => { sp.zoom = 1; sp.x = 0; sp.y = 0; ctx.redraw(area); }, 'Home (HOMEKEY)');
    blk.icontog([12, 4], 100, 0, 21, 22, () => sp.square, v => { sp.square = !!v; }, 'Keep UV polygons square while editing');
    blk.icontog([16, 0], 121, 0, 21, 22, () => sp.clip, v => { sp.clip = !!v; }, 'Clip UV with image size');
    blk.col = blk.headerActive ? COL.PURPLE : COL.GREY;
    let x = 152;
    x = B.Buts.idBrowse(ctx, blk, x, 'IM', { get: () => curImage(ctx, sp), set: im => assignImage(ctx, area, im) });
    blk.but('Load', x, 0, 50, 22, () => B.FileOps.selectImageFor(ctx, p => { const im = B.FileOps.imageFromPath(ctx, p, () => ctx.redrawAll()); if (im) assignImage(ctx, area, im); }), 'Load Image').col = COL.SALMON;
    blk.but('Replace', x + 52, 0, 60, 22, () => B.FileOps.selectImageFor(ctx, p => { const im = curImage(ctx, sp); if (im) { im.path = p; B.FileOps.imageFromPath(ctx, p); } }), 'Replace current Image');
    blk.tog('Anim', x + 120, 0, 40, 22, () => sp.anim, v => { sp.anim = !!v; }, 'Anim');
    blk.icontog([3, 4], x + 170, 0, 21, 22, () => sp.lock, v => { sp.lock = !!v; }, 'Lock redraw of other windows while editing');
  }

  function assignImage(ctx, area, im) {
    const sp = area.space;
    sp.image = im;
    const ob = faceSelOb(ctx);
    if (ob) selFaces(ob).forEach(([f]) => { if (f.tf) { if (f.tf.image) f.tf.image.us--; f.tf.image = B.Data.idUser(im); } });
    ctx.redrawAll();
  }

  function pickUV(ctx, area, ev) {
    const sp = area.space;
    const ob = faceSelOb(ctx);
    if (!ob) return null;
    const fr = frameOf(area, sp, curImage(ctx, sp));
    let best = null, bd = 12;
    selFaces(ob).forEach(([f, fi]) => f.uv.forEach((uv, k) => { const p = fr.toS(uv); const d = Math.hypot(p[0] - ev.x, p[1] - ev.y); if (d < bd) { bd = d; best = fi + ':' + k; } }));
    return best;
  }

  function sharedKeys(ob, key) {
    const [fi, k] = key.split(':').map(Number);
    const f = ob.data.faces[fi];
    const vi = f.v[k];
    const uv = f.uv[k];
    const out = [key];
    ob.data.faces.forEach((g, gi) => { if (!g.sel || !g.uv || gi === fi) return; g.v.forEach((v, gk) => { if (v === vi && Math.hypot(g.uv[gk][0] - uv[0], g.uv[gk][1] - uv[1]) < 1e-5) out.push(gi + ':' + gk); }); });
    return out;
  }

  function transformUV(ctx, area, mode, ev) {
    const sp = area.space;
    const ob = faceSelOb(ctx);
    if (!ob || !sp.sel.size) return;
    const fr = frameOf(area, sp, curImage(ctx, sp));
    const items = [...sp.sel].map(key => { const [fi, k] = key.split(':').map(Number); return { uv: ob.data.faces[fi].uv[k], o: ob.data.faces[fi].uv[k].slice() }; });
    const c = [items.reduce((s, i) => s + i.o[0], 0) / items.length, items.reduce((s, i) => s + i.o[1], 0) / items.length];
    const cs = fr.toS(c);
    const sx = ev.x, sy = ev.y;
    const apply = e => {
      items.forEach(it => {
        if (mode === 'grab') { it.uv[0] = it.o[0] + (e.x - sx) / (fr.iw * fr.s); it.uv[1] = it.o[1] + (e.y - sy) / (fr.ih * fr.s); }
        else if (mode === 'size') { const f = Math.hypot(e.x - cs[0], e.y - cs[1]) / (Math.hypot(sx - cs[0], sy - cs[1]) || 1); it.uv[0] = c[0] + (it.o[0] - c[0]) * f; it.uv[1] = c[1] + (it.o[1] - c[1]) * f; }
        else { const a = Math.atan2(e.y - cs[1], e.x - cs[0]) - Math.atan2(sy - cs[1], sx - cs[0]); const dx = it.o[0] - c[0], dy = it.o[1] - c[1]; it.uv[0] = c[0] + dx * Math.cos(a) - dy * Math.sin(a); it.uv[1] = c[1] + dx * Math.sin(a) + dy * Math.cos(a); }
        if (sp.clip) { it.uv[0] = Math.max(0, Math.min(1, it.uv[0])); it.uv[1] = Math.max(0, Math.min(1, it.uv[1])); }
      });
      ctx.redrawAll();
    };
    ctx.modal = {
      move: e => { apply(e); return false; },
      down: e => { if (e.button === 2) items.forEach(it => { it.uv[0] = it.o[0]; it.uv[1] = it.o[1]; }); ctx.redrawAll(); return true; },
      key: e => { if (e.key === 'ESC') { items.forEach(it => { it.uv[0] = it.o[0]; it.uv[1] = it.o[1]; }); ctx.redrawAll(); return true; } return e.key === 'RET' || e.key === 'SPACE'; }
    };
  }

  function event(ctx, area, ev) {
    const sp = area.space;
    if (ev.type === 'down' && area.inWin(ev.x, ev.y)) {
      if (ev.button === 1) {
        const sx = ev.x, sy = ev.y, x0 = sp.x, y0 = sp.y, z0 = sp.zoom;
        ctx.modal = { move: e => { if (ev.ctrl) sp.zoom = Math.max(0.1, Math.min(16, z0 * Math.exp((e.y - sy) * 0.01))); else { sp.x = x0 + e.x - sx; sp.y = y0 + e.y - sy; } ctx.redraw(area); return false; }, up: () => true };
        return true;
      }
      if (ev.button === 2) {
        const ob = faceSelOb(ctx);
        const key = pickUV(ctx, area, ev);
        if (!ev.shift) sp.sel.clear();
        if (key && ob) sharedKeys(ob, key).forEach(k => { if (ev.shift && sp.sel.has(key)) sp.sel.delete(k); else sp.sel.add(k); });
        ctx.redraw(area);
        return true;
      }
    }
    if (ev.type === 'wheel' && area.inWin(ev.x, ev.y)) { sp.zoom = Math.max(0.1, Math.min(16, sp.zoom * (ev.delta > 0 ? 0.8 : 1.25))); ctx.redraw(area); return true; }
    if (ev.type !== 'key') return false;
    const k = ev.key;
    const ob = faceSelOb(ctx);
    if (k === 'HOME') { sp.zoom = 1; sp.x = 0; sp.y = 0; ctx.redraw(area); return true; }
    if (k === 'PADPLUS' || k === 'PADMINUS') { sp.zoom *= k === 'PADPLUS' ? 2 : 0.5; ctx.redraw(area); return true; }
    if (!ob) return false;
    if (k === 'A' && !ev.ctrl) { if (sp.sel.size) sp.sel.clear(); else selFaces(ob).forEach(([f, fi]) => f.uv.forEach((_, j) => sp.sel.add(fi + ':' + j))); ctx.redraw(area); return true; }
    if (k === 'G' || k === 'S' || k === 'R') { transformUV(ctx, area, k === 'G' ? 'grab' : k === 'S' ? 'size' : 'rot', ev); return true; }
    if (k === 'B') {
      const fr = frameOf(area, sp, curImage(ctx, sp));
      let p0 = null;
      ctx.modal = {
        down: e => { p0 = [e.x, e.y]; return false; },
        up: e => {
          if (!p0) return false;
          const x1 = Math.min(p0[0], e.x), x2 = Math.max(p0[0], e.x), y1 = Math.min(p0[1], e.y), y2 = Math.max(p0[1], e.y);
          selFaces(ob).forEach(([f, fi]) => f.uv.forEach((uv, j) => { const p = fr.toS(uv); if (p[0] >= x1 && p[0] <= x2 && p[1] >= y1 && p[1] <= y2) sp.sel.add(fi + ':' + j); }));
          ctx.redraw(area);
          return true;
        },
        key: e => e.key === 'ESC'
      };
      return true;
    }
    return false;
  }

  B.SPACES.image = { name: 'ImageWindow', init, draw, header, event };
})(globalThis.B204 = globalThis.B204 || {});
