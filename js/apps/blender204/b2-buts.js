(function (B) {
  'use strict';
  const rgb = B.rgb;
  const COL = B.UI.COL;

  const CONTEXTS = [
    ['view', [0, 7], 'View buttons'],
    ['lamp', [1, 7], 'Lamp buttons (F4)'],
    ['material', [2, 7], 'Material buttons (F5)'],
    ['texture', [3, 7], 'Texture buttons (F6)'],
    ['anim', [4, 7], 'Animation buttons (F7)'],
    ['game', [8, 7], 'Realtime buttons (F8)'],
    ['edit', [7, 7], 'Edit buttons (F9)'],
    ['world', [5, 7], 'World buttons'],
    ['paint', [9, 7], 'Paint buttons'],
    ['radio', [10, 7], 'Radiosity buttons'],
    ['script', [11, 7], 'Script buttons'],
    ['display', [6, 7], 'Display buttons (F10)']
  ];

  const LAYOUTS = {};

  function init() { return { context: 'display', scale: null, panx: 0, pany: 0, home: true, texfrom: 'mat' }; }

  function activeOb(ctx) { const b = ctx.scene.basact; return b ? b.object : null; }

  function idBrowse(ctx, blk, x, code, opts) {
    const main = ctx.main;
    const id = opts.get();
    const list = opts.list ? opts.list() : main.list(code);
    const prefix = (opts.prefix || code) + ':';
    const browse = blk.but('', x, 0, 21, 22, () => {
      const items = list.map((d, i) => `${d.name}${opts.showUsers && d.us > 1 ? '' : ''} %x${i}`);
      const extra = opts.noNew ? '' : (opts.open ? '|OPEN NEW %x32766|ADD NEW %x32767' : '|ADD NEW %x32767');
      const str = (items.length ? items.join('|') : '') + extra;
      if (!str) return;
      B.UI.pupmenu(ctx, str.replace(/^\|/, ''), { current: list.indexOf(id) }).then(v => {
        if (v == null || v < 0) return;
        if (v === 32767) opts.addNew();
        else if (v === 32766 && opts.openNew) opts.openNew();
        else opts.set(list[v]);
        ctx.redrawAll();
      });
    }, opts.addNew ? 'Browse Datablock or Add NEW' : 'Browse Datablock');
    browse.minusIcon = true;
    browse.col = opts.col || COL.GREY;
    x += 21;
    if (id) {
      const w = opts.width || 120;
      const t = blk.tex(prefix, x, 0, w, 22, () => id.name, v => { main.rename(id, v); ctx.redrawAll(); }, 19, 'Datablock name');
      t.col = opts.col || COL.GREY;
      x += w;
      const users = main.users(id);
      if (users > 1) {
        const ub = blk.but(String(users), x, 0, 21, 22, () => { if (opts.singleUser) opts.singleUser(); ctx.redrawAll(); }, 'Number of users,  press to make single-user');
        ub.col = COL.GREY;
        x += 21;
      }
      if (opts.unlink) {
        const del = blk.icon([0, 4], x, 0, 21, 22, () => { opts.unlink(); ctx.redrawAll(); }, 'Delete link to this Datablock');
        del.col = COL.GREY;
        x += 21;
      }
      if (opts.auto) {
        const ab = blk.icon([7, 4], x, 0, 21, 22, () => { opts.auto(); ctx.redrawAll(); }, 'Automatic name');
        ab.col = COL.GREY;
        x += 21;
      }
    }
    return x + 10;
  }

  function header(ctx, area, blk) {
    const sp = area.space;
    B.ScreenDraw.stdHeaderButtons(blk, area, ctx);
    blk.icon([15, 0], 65, 0, 21, 22, () => { sp.home = true; sp.panx = 0; sp.pany = 0; ctx.redraw(area); }, 'Home (HOMEKEY)');
    blk.col = COL.GREY;
    CONTEXTS.forEach(([name, icon, tip], i) => {
      const w = name === 'display' ? 51 : 31;
      blk.add('ROW', { icon, x: 125 + i * 30, y: 0, w, h: 22, get: () => sp.context, set: v => { sp.context = v; sp.home = true; }, rowValue: name, tip });
    });
    let x = 546;
    const L = LAYOUTS[sp.context];
    if (L && L.header) x = L.header(ctx, area, blk, x);
    const fr = blk.num('', x + 20, 0, 61, 22, () => ctx.scene.cfra, v => { ctx.scene.cfra = v; B.Anim && B.Anim.frameChanged(ctx); }, 1, 18000, 1, 0, 'Current Frame');
    fr.col = COL.GREY;
  }

  function draw(ctx, area, r) {
    const sp = area.space;
    const w = area.win;
    r.rect(w.x1, w.y1, w.x2 + 1, w.y2 + 1, rgb(144, 144, 144));
    if (area.headertype === 'top') {
      for (let i = 0; i < 7; i++) r.hline(w.x1, w.x2, w.y2 - i, rgb(103 + i * 6 - (i > 3 ? 1 : 0), 103 + i * 6 - (i > 3 ? 1 : 0), 103 + i * 6 - (i > 3 ? 1 : 0)));
    }
    const L = LAYOUTS[sp.context];
    if (!L) { area.winBlock = null; return; }
    const lw = L.w || 640, lh = L.h || 130;
    let s = B.clamp(area.winy / 168, 0.6, 3);
    if (lw * s > area.winx - 10) s = Math.max(0.5, (area.winx - 10) / lw);
    if (sp.zoom) s *= sp.zoom;
    const font = s < 1.15 ? 'helv8' : s < 1.5 ? 'helv10' : 'helv12';
    const ax = L.X0 != null ? L.X0 : 195, ay = L.Y0 != null ? L.Y0 + lh - 1 : 735;
    const ox = Math.round(w.x1 + area.winx / 2 + (ax - 509) * s + sp.panx);
    const oy = Math.round(w.y1 + area.winy / 2 + (678.5 - ay) * s + sp.pany);
    const blk = new B.UI.Block(r, { ox, oy, scale: s, font, area });
    blk.col = COL.GREY;
    blk.ctx = ctx;
    try { L.build(ctx, blk, area); } catch (err) { console.error(err); }
    blk.draw();
    if (blk.postDraw) blk.postDraw(r);
    area.winBlock = blk;
  }

  function event(ctx, area, ev) {
    const sp = area.space;
    const LL = LAYOUTS[sp.context];
    if (LL && LL.event && LL.event(ctx, area, ev)) return true;
    if (ev.type === 'down' && ev.button === 1 && area.inWin(ev.x, ev.y)) {
      const sx = ev.x, sy = ev.y, px = sp.panx, py = sp.pany, z0 = sp.zoom || 1;
      ctx.modal = {
        move: e => {
          if (ev.ctrl) sp.zoom = B.clamp(z0 * Math.exp((e.x - sx) * 0.01), 0.4, 3);
          else { sp.panx = px + e.x - sx; sp.pany = py + e.y - sy; }
          area.redraw(); ctx.schedule();
        },
        up: () => true
      };
      return true;
    }
    if (ev.type === 'wheel' && area.inWin(ev.x, ev.y)) {
      sp.pany += ev.delta * 20;
      area.redraw(); ctx.schedule();
      return true;
    }
    if (ev.type === 'key') {
      if (ev.key === 'HOME') { sp.panx = 0; sp.pany = 0; sp.zoom = 1; area.redraw(); ctx.schedule(); return true; }
      if (ev.key === 'PADPLUS' || ev.key === 'PADMINUS') { sp.zoom = B.clamp((sp.zoom || 1) * (ev.key === 'PADPLUS' ? 1.15 : 1 / 1.15), 0.4, 3); area.redraw(); ctx.schedule(); return true; }
      const L = LAYOUTS[sp.context];
      if (L && L.key && L.key(ctx, area, ev)) return true;
      const v3d = ctx.screen.areas.find(a => a.type === 'view3d');
      if (v3d && ['TAB', 'A', 'G', 'R', 'S', 'X', 'E', 'SPACE'].includes(ev.key) === false) return false;
    }
    return false;
  }

  function activeChanged(ctx) { ctx.redrawType('buts'); ctx.redrawType('info'); }

  function frameDraw(r, blk, x, y, w, h, title) {
    const x1 = blk.px(x), y1 = blk.py(y), x2 = blk.px(x + w), y2 = blk.py(y + h);
    r.frame(x1, y1, x2, y2, rgb(0, 0, 0));
    if (title) r.text(blk.font, title, x1 + 4, y2 + 3, rgb(0, 0, 0));
  }

  B.Buts = { CONTEXTS, LAYOUTS, activeOb, idBrowse, activeChanged, frameDraw };
  B.SPACES.buts = { name: 'Buttons', headerTop: true, init, header, draw, event };
})(globalThis.B204 = globalThis.B204 || {});
