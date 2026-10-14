(function (B) {
  'use strict';
  const rgb = B.rgb;
  const COL = B.UI.COL;

  const TYPES = [
    ['SC', 'scene', [6, 8], rgb(200, 200, 140)],
    ['OB', 'object', [7, 8], rgb(160, 180, 200)],
    ['ME', 'mesh', [8, 8], rgb(190, 160, 190)],
    ['CU', 'curve', [9, 8], rgb(160, 190, 160)],
    ['MB', 'mball', [10, 8], rgb(190, 190, 160)],
    ['LT', 'lattice', [11, 8], rgb(170, 170, 200)],
    ['LA', 'lamp', [12, 8], rgb(220, 220, 140)],
    ['CA', 'camera', [2, 1], rgb(170, 170, 170)],
    ['MA', 'material', [13, 8], rgb(220, 160, 160)],
    ['TE', 'texture', [14, 8], rgb(200, 170, 120)],
    ['IP', 'ipo', [15, 8], rgb(160, 200, 200)],
    ['IM', 'image', [17, 8], rgb(180, 200, 160)],
    ['WO', 'world', [5, 7], rgb(150, 180, 220)]
  ];

  function init() {
    const vis = {};
    TYPES.forEach(t => { vis[t[0]] = true; });
    return { vis, layOnly: false, x: 0, y: 0, zoom: 1, pos: {}, sel: new Set() };
  }

  function links(ctx, ids) {
    const out = [];
    const has = id => ids.has(id);
    ids.forEach(id => {
      const add = to => { if (to && has(to)) out.push([id, to]); };
      if (id.code === 'SC') id.bases.forEach(b => add(b.object));
      if (id.code === 'OB') { add(id.data); add(id.ipo); add(id.parent); (id.mats || []).forEach(add); }
      if (id.mats) id.mats.forEach(add);
      if (id.mtex) id.mtex.forEach(m => m && add(m.tex));
      if (id.code === 'TE') add(id.image);
      if (id.code === 'SC') add(id.world);
      if (id.ipo && id.code !== 'OB') add(id.ipo);
    });
    return out;
  }

  function collect(ctx, sp) {
    const main = ctx.main;
    const ids = new Set();
    TYPES.forEach(([code]) => {
      if (!sp.vis[code]) return;
      const list = code === 'CU' ? main.curves : main.list(code);
      (list || []).forEach(id => {
        if (code === 'OB' && sp.layOnly && !(id.lay & ctx.scene.lay)) return;
        ids.add(id);
      });
    });
    return ids;
  }

  function layout(ctx, sp, ids) {
    const cols = {};
    TYPES.forEach(([code], i) => { cols[code] = i; });
    const count = {};
    ids.forEach(id => {
      const key = id.code + ':' + id.uid;
      if (!sp.pos[key]) {
        const c = cols[id.code] || 0;
        const n = count[id.code] = (count[id.code] || 0) + 1;
        sp.pos[key] = [c * 90 - 500, 200 - n * 24];
      } else count[id.code] = (count[id.code] || 0) + 1;
    });
  }

  function toScr(area, sp, p) { const w = area.win; return [w.x1 + area.winx / 2 + (p[0] + sp.x) * sp.zoom, w.y1 + area.winy / 2 + (p[1] + sp.y) * sp.zoom]; }

  function draw(ctx, area, r) {
    const sp = area.space;
    const w = area.win;
    r.rect(w.x1, w.y1, w.x2 + 1, w.y2 + 1, rgb(160, 160, 160));
    const ids = collect(ctx, sp);
    layout(ctx, sp, ids);
    sp.idList = [...ids];
    const bw = 70 * sp.zoom, bh = 16 * sp.zoom;
    links(ctx, ids).forEach(([a, b]) => {
      const pa = toScr(area, sp, sp.pos[a.code + ':' + a.uid]), pb = toScr(area, sp, sp.pos[b.code + ':' + b.uid]);
      r.line(pa[0] + bw / 2, pa[1] + bh / 2, pb[0] + bw / 2, pb[1] + bh / 2, rgb(80, 80, 80));
    });
    const act = ctx.scene.basact ? ctx.scene.basact.object : null;
    ids.forEach(id => {
      const t = TYPES.find(x => x[0] === id.code);
      const p = toScr(area, sp, sp.pos[id.code + ':' + id.uid]);
      const sel = sp.sel.has(id) || (id.code === 'OB' && ctx.scene.bases.some(b => b.object === id && b.sel));
      const x1 = Math.round(p[0]), y1 = Math.round(p[1]);
      B.UI.emboss(r, x1, y1, x1 + Math.round(bw), y1 + Math.round(bh), sel ? B.shade(t[3], 30) : t[3], false, false);
      if (id === act) r.frame(x1 - 1, y1 - 1, x1 + Math.round(bw) + 1, y1 + Math.round(bh) + 1, rgb(255, 255, 255));
      const sc = Math.min(1, (bh - 2) / 16);
      r.iconScaled(t[2][0], t[2][1], x1 + 2, y1 + 1, t[3], sc);
      if (sp.zoom > 0.55) {
        r.pushClip(x1 + 2, y1, x1 + Math.round(bw) - 2, y1 + Math.round(bh));
        r.text(sp.zoom > 1.2 ? 'helv12' : 'helv8', id.name, x1 + 4 + 15 * sc, y1 + Math.round(bh / 2) - 3, sel ? rgb(255, 255, 255) : rgb(0, 0, 0));
        r.popClip();
      }
    });
  }

  function header(ctx, area, blk) {
    const sp = area.space;
    B.ScreenDraw.stdHeaderButtons(blk, area, ctx);
    blk.icon([15, 0], 65, 0, 21, 22, () => viewAll(ctx, area), 'Home (HOMEKEY)');
    blk.icon([14, 0], 120, 0, 21, 22, null, 'Translate view (MiddleMouse)');
    blk.icon([13, 0], 141, 0, 20, 22, null, 'Zoom view (CTRL+MiddleMouse)');
    let x = 190;
    blk.tog('lay', x, 0, 30, 22, () => sp.layOnly, v => { sp.layOnly = !!v; ctx.redraw(area); }, 'Display Objects based on layer');
    x += 32;
    TYPES.forEach(([code, name, icon], i) => blk.icontog(icon, x + i * 20, 0, 20, 22, () => sp.vis[code], v => { sp.vis[code] = !!v; ctx.redraw(area); }, 'Display ' + name.charAt(0).toUpperCase() + name.slice(1) + ' data'));
  }

  function viewAll(ctx, area) {
    const sp = area.space;
    const ids = sp.idList || [];
    if (!ids.length) return;
    const ps = ids.map(id => sp.pos[id.code + ':' + id.uid]).filter(Boolean);
    const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
    const x1 = Math.min(...xs), x2 = Math.max(...xs) + 70, y1 = Math.min(...ys), y2 = Math.max(...ys) + 16;
    sp.zoom = Math.max(0.3, Math.min(2, Math.min(area.winx / (x2 - x1 + 40), area.winy / (y2 - y1 + 40))));
    sp.x = -(x1 + x2) / 2; sp.y = -(y1 + y2) / 2;
    ctx.redraw(area);
  }

  function hit(area, sp, ev) {
    const ids = sp.idList || [];
    for (let i = ids.length - 1; i >= 0; i--) {
      const id = ids[i];
      const p = toScr(area, sp, sp.pos[id.code + ':' + id.uid]);
      if (ev.x >= p[0] && ev.x <= p[0] + 70 * sp.zoom && ev.y >= p[1] && ev.y <= p[1] + 16 * sp.zoom) return id;
    }
    return null;
  }

  function grab(ctx, area, ev) {
    const sp = area.space;
    const moving = [...sp.sel].map(id => ({ key: id.code + ':' + id.uid, o: sp.pos[id.code + ':' + id.uid].slice() }));
    if (!moving.length) return;
    const sx = ev.x, sy = ev.y;
    ctx.modal = {
      move: e => { moving.forEach(m => { sp.pos[m.key] = [m.o[0] + (e.x - sx) / sp.zoom, m.o[1] + (e.y - sy) / sp.zoom]; }); ctx.redraw(area); return false; },
      down: e => { if (e.button === 2) moving.forEach(m => { sp.pos[m.key] = m.o; }); ctx.redraw(area); return true; },
      up: e => (e.button === 2 ? (ctx.redraw(area), true) : false),
      key: e => { if (e.key === 'ESC') { moving.forEach(m => { sp.pos[m.key] = m.o; }); ctx.redraw(area); return true; } if (e.key === 'RET' || e.key === 'SPACE') return true; return false; }
    };
  }

  function event(ctx, area, ev) {
    const sp = area.space;
    if (ev.type === 'down' && area.inWin(ev.x, ev.y)) {
      if (ev.button === 1) {
        const sx = ev.x, sy = ev.y, x0 = sp.x, y0 = sp.y, z0 = sp.zoom;
        ctx.modal = { move: e => { if (ev.ctrl) sp.zoom = Math.max(0.2, Math.min(4, z0 * Math.exp((e.x - sx) * 0.01))); else { sp.x = x0 + (e.x - sx) / sp.zoom; sp.y = y0 + (e.y - sy) / sp.zoom; } ctx.redraw(area); return false; }, up: () => true };
        return true;
      }
      if (ev.button === 2 || ev.button === 0) {
        const id = hit(area, sp, ev);
        if (!ev.shift) sp.sel.clear();
        if (id) {
          sp.sel.add(id);
          if (id.code === 'OB') {
            const base = ctx.scene.bases.find(b => b.object === id);
            if (base) { if (!ev.shift) ctx.scene.bases.forEach(b => { b.sel = false; }); base.sel = true; ctx.scene.basact = base; }
          }
          if (id.code === 'SC' && id !== ctx.scene) B.SceneOps.setScene(ctx, id);
          if (id.code === 'MA' && B.Shading) B.Shading.setActiveMaterial && void 0;
        }
        ctx.redrawAll();
        if (ev.button === 2 && id) { const sx = ev.x, sy = ev.y; ctx.modal = { move: e => { if (Math.hypot(e.x - sx, e.y - sy) > 4) { ctx.modal = null; grab(ctx, area, { x: sx, y: sy }); } return false; }, up: () => true }; }
        return true;
      }
    }
    if (ev.type === 'wheel' && area.inWin(ev.x, ev.y)) { sp.zoom = Math.max(0.2, Math.min(4, sp.zoom * (ev.delta > 0 ? 1 / 1.15 : 1.15))); ctx.redraw(area); return true; }
    if (ev.type === 'key') {
      if (ev.key === 'HOME') { viewAll(ctx, area); return true; }
      if (ev.key === 'G' && !ev.ctrl && !ev.alt) { grab(ctx, area, ev); return true; }
      if (ev.key === 'A' && !ev.ctrl) { if (sp.sel.size) sp.sel.clear(); else (sp.idList || []).forEach(id => sp.sel.add(id)); ctx.redraw(area); return true; }
      if (ev.key === 'PADPLUS' || ev.key === 'PADMINUS') { sp.zoom = Math.max(0.2, Math.min(4, sp.zoom * (ev.key === 'PADPLUS' ? 1.2 : 1 / 1.2))); ctx.redraw(area); return true; }
    }
    return false;
  }

  B.SPACES.oops = { name: 'OOPS', init, draw, header, event };
})(globalThis.B204 = globalThis.B204 || {});
