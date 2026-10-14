(function (B) {
  'use strict';
  const rgb = B.rgb;
  const COL = B.UI.COL;
  const F = () => B.FileOps;

  const TYPE_NAMES = { SC: 'Scene', OB: 'Object', ME: 'Mesh', CU: 'Curve', MB: 'Metaball', MA: 'Material', TE: 'Texture', IM: 'Image', IK: 'Ika', LT: 'Lattice', LA: 'Lamp', CA: 'Camera', IP: 'Ipo', WO: 'World', TX: 'Text', VF: 'VFont', SO: 'Sound', KE: 'Key' };

  function init() { return { mode: 'load', dir: F().DEFAULT_DIR.slice(), file: '', sel: new Set(), scroll: 0, sort: 'alpha', longInfo: false, hideDot: true, title: 'LOAD FILE', libPath: null, libType: null, dataPath: [], link: 'append' }; }

  function chooseArea(ctx) {
    const s = ctx.screen;
    const cur = ctx.curarea && ctx.curarea.type !== 'info' ? ctx.curarea : null;
    if (cur && cur.winx > 300 && cur.winy > 150) return cur;
    return s.areas.filter(a => a.type !== 'info').sort((a, b) => b.winx * b.winy - a.winx * a.winy)[0];
  }

  function start(ctx, opts) {
    const area = chooseArea(ctx);
    if (!area) return;
    const prevType = area.type, prevHeader = area.headertype;
    ctx.setSpaceType(area, 'file');
    const sp = area.space;
    Object.assign(sp, { mode: opts.mode || 'load', title: opts.title || 'LOAD FILE', filter: opts.filter || null, onOk: opts.onOk, file: opts.file || '', sel: new Set(), scroll: 0, libPath: null, libType: null, restore: { type: prevType, header: prevHeader } });
    if (opts.dir) sp.dir = opts.dir.slice();
    if (!F().readVFS(sp.dir.slice(0, -1), sp.dir[sp.dir.length - 1]) && !(window.vfs && window.vfs.resolvePath(sp.dir))) sp.dir = F().DEFAULT_DIR.slice();
    ctx.redrawAll();
  }

  function close(ctx, area) {
    const sp = area.space;
    const r = sp.restore;
    sp.onOk = null;
    if (r) { area.type = r.type; area.headertype = r.header; sp.restore = null; }
    else ctx.setSpaceType(area, 'view3d');
    ctx.redrawAll();
  }

  function entries(ctx, sp) {
    if (sp.mode === 'data') {
      const main = ctx.main;
      if (!sp.dataPath.length) return Object.entries(B.LISTS).filter(([c]) => c !== 'SR' && main.list(c).length).map(([c]) => ({ name: (TYPE_NAMES[c] || c) + '/', dir: true, code: c }));
      const code = sp.dataPath[0];
      return main.list(code).map(id => ({ name: id.name, id, size: main.users(id) }));
    }
    if (sp.libPath) {
      const lib = F().libContents(sp.libPath) || {};
      if (!sp.libType) return Object.keys(lib).map(c => ({ name: (TYPE_NAMES[c] || c) + '/', dir: true, code: c }));
      return (lib[sp.libType] || []).map(n => ({ name: n, libItem: true }));
    }
    const fs = window.vfs;
    const node = fs && fs.resolvePath(sp.dir);
    if (!node || !node.children) return [];
    const list = Object.keys(node.children).map(k => {
      const n = node.children[k];
      const isDir = n.type === 'folder' || n.type === 'drive' || !!n.children;
      const size = typeof n.content === 'string' ? n.content.length : 0;
      return { name: k, dir: isDir, size, node: n, blend: !isDir && /\.blend\d*$/i.test(k) };
    }).filter(e => !(sp.hideDot && e.name.startsWith('.'))).filter(e => e.dir || !sp.filter || sp.filter.test(e.name) || sp.mode === 'save');
    list.sort((a, b) => {
      if (a.dir !== b.dir) return a.dir ? -1 : 1;
      if (sp.sort === 'size') return b.size - a.size;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    return list;
  }

  function fullList(ctx, sp) {
    const list = entries(ctx, sp);
    const up = [{ name: '.', dot: true }, { name: '..', parent: true, dir: true }];
    return up.concat(list.map(e => (e.dir && !e.name.endsWith('/') ? Object.assign({}, e, { label: e.name + '\\' }) : e)));
  }

  function geometry(area, sp) {
    const w = area.win;
    const rowH = 15, colW = Math.max(160, sp.longInfo ? 320 : 175);
    const listTop = w.y2 - 52, listBot = w.y1 + 8;
    const rows = Math.max(1, Math.floor((listTop - listBot - 4) / rowH));
    const cols = Math.max(1, Math.floor((w.x2 - 10 - 46) / colW));
    return { rowH, colW, listTop, listBot, rows, cols, lx: w.x1 + 46, lx2: w.x2 - 10 };
  }

  function draw(ctx, area, r) {
    const sp = area.space;
    const w = area.win;
    r.rect(w.x1, w.y1, w.x2 + 1, w.y2 + 1, rgb(144, 144, 144));
    if (area.headertype === 'top') for (let i = 0; i < 7; i++) r.hline(w.x1, w.x2, w.y2 - i, rgb(103 + i * 6, 103 + i * 6, 103 + i * 6));
    const blk = new B.UI.Block(r, { ox: w.x1, oy: w.y1, font: 'helv12', area });
    blk.col = COL.GREY;
    const top = w.y2 - w.y1;
    blk.but('P', 15, top - 28, 21, 18, () => goParent(ctx, area), 'Move to the parent directory (PKEY)');
    const dirText = sp.mode === 'data' ? sp.dataPath.map(c => (TYPE_NAMES[c] || c) + '/').join('') : sp.libPath ? sp.libPath + '\\' + (sp.libType ? (TYPE_NAMES[sp.libType] || sp.libType) + '/' : '') : F().partsToPath(sp.dir);
    blk.tex('', 46, top - 28, w.x2 - w.x1 - 56, 18, () => dirText, v => setDir(ctx, area, v), 159, 'Directory');
    const menu = blk.but('', 15, top - 49, 21, 18, () => recentMenu(ctx, area), 'Recent directories');
    menu.minusIcon = true;
    blk.tex('', 46, top - 49, w.x2 - w.x1 - 56, 18, () => sp.file, v => { sp.file = v; }, 79, 'File name');
    blk.draw();
    area.winBlock = blk;
    const g = geometry(area, sp);
    r.rect(g.lx, g.listBot, g.lx2 + 1, g.listTop + 1, rgb(128, 128, 128));
    r.frame(g.lx - 1, g.listBot - 1, g.lx2 + 1, g.listTop + 1, rgb(80, 80, 80));
    const list = fullList(ctx, sp);
    sp.listCache = list;
    const perPage = g.rows * g.cols;
    const maxScroll = Math.max(0, Math.ceil(list.length / g.rows) - g.cols);
    sp.scroll = Math.max(0, Math.min(sp.scroll, maxScroll));
    for (let c = 1; c < g.cols; c++) r.vline(g.lx + c * g.colW - 2, g.listBot, g.listTop, rgb(110, 110, 110));
    for (let k = 0; k < perPage; k++) {
      const idx = sp.scroll * g.rows + k;
      const e = list[idx];
      if (!e) break;
      const col = Math.floor(k / g.rows), row = k % g.rows;
      const x = g.lx + col * g.colW + 6, y = g.listTop - 4 - (row + 1) * g.rowH;
      const selected = sp.sel.has(e.name) || (!e.dir && sp.file === e.name);
      if (selected) r.rect(x - 4, y - 1, x + g.colW - 10, y + g.rowH - 1, rgb(110, 110, 170));
      const tc = e.dir ? rgb(255, 255, 255) : e.blend ? rgb(0, 0, 0) : rgb(30, 30, 30);
      r.pushClip(x - 2, g.listBot, x + g.colW - 12, g.listTop);
      r.text('helv12', e.label || e.name, x, y + 3, selected ? rgb(255, 255, 255) : tc);
      if ((sp.longInfo || sp.mode === 'data') && !e.dir && e.size != null && !e.dot) {
        const s = sp.mode === 'data' ? String(e.size) : (e.size / 1024).toFixed(1) + ' K';
        r.text('helv12', s, x + g.colW - 24 - B.textWidth('helv12', s), y + 3, selected ? rgb(255, 255, 255) : rgb(0, 0, 0));
      }
      r.popClip();
    }
    const sbx1 = w.x1 + 15, sbx2 = w.x1 + 35;
    r.rect(sbx1, g.listBot, sbx2 + 1, g.listTop + 1, rgb(120, 120, 120));
    r.frame(sbx1, g.listBot, sbx2, g.listTop, rgb(80, 80, 80));
    const pages = Math.max(1, Math.ceil(list.length / g.rows));
    const vis = Math.min(1, g.cols / pages);
    const pos = pages > g.cols ? sp.scroll / (pages - g.cols) : 0;
    const th = Math.max(10, (g.listTop - g.listBot - 4) * vis);
    const ty = g.listTop - 2 - th - pos * (g.listTop - g.listBot - 4 - th);
    B.UI.emboss(r, sbx1 + 2, Math.round(ty), sbx2 - 2, Math.round(ty + th), COL.GREY, false, true);
    sp.geom = g;
  }

  function header(ctx, area, blk) {
    const sp = area.space;
    B.ScreenDraw.stdHeaderButtons(blk, area, ctx);
    let x = 70;
    if (sp.mode !== 'data') {
      [['alpha', [14, 1], 'Sort files alphabetically'], ['time', [15, 1], 'Sort files by time'], ['size', [16, 1], 'Sort files by size']].forEach(([v, ic, tip], i) => blk.add('ROW', { icon: ic, x: x + i * 20, y: 0, w: 20, h: 22, get: () => sp.sort, set: s => { sp.sort = s; }, rowValue: v, tip }));
      x += 70;
      blk.icontog([17, 1], x, 0, 21, 22, () => sp.longInfo, v => { sp.longInfo = !!v; ctx.redraw(area); }, 'Toggle long info');
      blk.icontog([10, 5], x + 21, 0, 21, 22, () => sp.hideDot, v => { sp.hideDot = !!v; ctx.redraw(area); }, 'Hide dot files');
      x += 52;
    }
    if (sp.mode === 'append') {
      blk.add('ROW', { str: 'Append', x, y: 0, w: 60, h: 22, get: () => sp.link, set: v => { sp.link = v; }, rowValue: 'append', tip: 'Causes selected data to be copied into current file' });
      blk.add('ROW', { str: 'Link', x: x + 60, y: 0, w: 50, h: 22, get: () => sp.link, set: v => { sp.link = v; }, rowValue: 'link', tip: 'Causes selected data to be linked by current file' });
      x += 120;
    }
    const title = sp.title || 'LOAD FILE';
    const lab = blk.label(title, x + 4, 1, B.textWidth('helv12', title) + 8, 20);
    lab.font = 'helv12';
    x += B.textWidth('helv12', title) + 20;
    blk.but(sp.mode === 'save' ? 'SAVE' : sp.mode === 'data' ? 'OK' : 'LOAD', x, 0, 60, 22, () => execute(ctx, area), 'Execute').col = COL.SALMON;
    blk.but('Cancel', x + 62, 0, 60, 22, () => close(ctx, area), 'Cancel');
    const list = sp.listCache || [];
    const total = list.reduce((s, e) => s + (e.size || 0), 0) / (1024 * 1024);
    const info = `Free: ${(41.3).toFixed(3)} Mb   Files: (${sp.sel.size}) ${list.filter(e => !e.dir && !e.dot).length}    (${0}) ${total.toFixed(3)} Mb`;
    const t = blk.label(info, x + 140, 1, 400, 20);
    t.font = 'helv10';
  }

  function goParent(ctx, area) {
    const sp = area.space;
    if (sp.mode === 'data') { if (sp.dataPath.length) sp.dataPath.pop(); }
    else if (sp.libPath) { if (sp.libType) sp.libType = null; else sp.libPath = null; }
    else if (sp.dir.length > 1) sp.dir.pop();
    sp.scroll = 0; sp.sel.clear();
    ctx.redraw(area);
  }

  function setDir(ctx, area, text) {
    const sp = area.space;
    const parts = F().pathToParts(text);
    const fs = window.vfs;
    if (fs && fs.resolvePath(parts)) { sp.dir = parts; sp.libPath = null; sp.libType = null; }
    else {
      B.UI.okee(ctx, 'Makedir ' + text).then(ok => { if (ok) { F().ensureDir(parts); sp.dir = parts; ctx.redraw(area); } });
    }
    ctx.redraw(area);
  }

  function recentMenu(ctx, area) {
    const sp = area.space;
    const opts = ['C:\\', 'C:\\My Documents\\', 'C:\\My Documents\\Downloads\\', 'C:\\Program Files\\', 'D:\\'];
    B.UI.pupmenu(ctx, 'DIRECTORIES %t|' + opts.map((o, i) => `${o} %x${i}`).join('|')).then(v => { if (v >= 0) { sp.dir = F().pathToParts(opts[v]); sp.libPath = null; sp.libType = null; sp.scroll = 0; ctx.redraw(area); } });
  }

  function execute(ctx, area) {
    const sp = area.space;
    const ok = sp.onOk;
    if (sp.mode === 'data') { close(ctx, area); return; }
    if (sp.mode === 'append') {
      if (!sp.libPath || !sp.libType) { B.UI.error(ctx, 'No files selected'); return; }
      const names = sp.sel.size ? [...sp.sel] : sp.file ? [sp.file] : [];
      if (!names.length) { B.UI.error(ctx, 'No files selected'); return; }
      const lib = sp.libPath, type = sp.libType;
      close(ctx, area);
      if (ok) ok(lib, names.map(n => ({ code: type, name: n })));
      return;
    }
    if (!sp.file && sp.mode === 'load') { B.UI.error(ctx, 'No files selected'); return; }
    const path = F().partsToPath(sp.dir) + sp.file;
    close(ctx, area);
    if (ok) ok(path);
  }

  function itemAt(area, sp, x, y) {
    const g = sp.geom;
    if (!g || x < g.lx || x > g.lx2 || y < g.listBot || y > g.listTop - 4) return null;
    const col = Math.floor((x - g.lx) / g.colW), row = Math.floor((g.listTop - 4 - y) / g.rowH);
    if (row < 0 || row >= g.rows || col >= g.cols) return null;
    return (sp.listCache || [])[(sp.scroll + col) * g.rows + row] || null;
  }

  function activate(ctx, area, e, run) {
    const sp = area.space;
    if (e.dot) return;
    if (e.parent) { goParent(ctx, area); return; }
    if (sp.mode === 'data') {
      if (e.dir) { sp.dataPath = [e.code]; sp.scroll = 0; ctx.redraw(area); return; }
      if (e.id && e.id.code === 'OB') {
        const base = ctx.scene.bases.find(b => b.object === e.id);
        if (base) { ctx.scene.bases.forEach(b => { b.sel = false; }); base.sel = true; ctx.scene.basact = base; ctx.redrawAll(); }
      } else if (e.id && e.id.code === 'MA' && B.Shading) B.Shading.setActiveMaterial(ctx, e.id);
      sp.file = e.name;
      ctx.redraw(area);
      return;
    }
    if (sp.libPath) {
      if (e.dir) { sp.libType = e.code; sp.scroll = 0; sp.sel.clear(); ctx.redraw(area); return; }
      sp.file = e.name;
      if (run) execute(ctx, area); else ctx.redraw(area);
      return;
    }
    if (e.dir) { sp.dir = sp.dir.concat(e.name); sp.scroll = 0; sp.sel.clear(); ctx.redraw(area); return; }
    if (sp.mode === 'append' && e.blend) { sp.libPath = F().partsToPath(sp.dir) + e.name; sp.libType = null; sp.scroll = 0; ctx.redraw(area); return; }
    sp.file = e.name;
    if (run) execute(ctx, area); else ctx.redraw(area);
  }

  function event(ctx, area, ev) {
    const sp = area.space;
    if (ev.type === 'down' && area.inWin(ev.x, ev.y)) {
      const e = itemAt(area, sp, ev.x, ev.y);
      if (e) {
        if (ev.button === 2 || ev.shift) { if (!e.dir) { if (sp.sel.has(e.name)) sp.sel.delete(e.name); else sp.sel.add(e.name); } ctx.redraw(area); return true; }
        const now = performance.now();
        const dbl = sp.lastClick && sp.lastClick.name === e.name && now - sp.lastClick.t < 400;
        sp.lastClick = { name: e.name, t: now };
        activate(ctx, area, e, ev.button === 1 || dbl);
        return true;
      }
      if (ev.button === 1) {
        const sy = ev.x, s0 = sp.scroll;
        ctx.modal = { move: m => { sp.scroll = Math.max(0, s0 + Math.round((sy - m.x) / 60)); ctx.redraw(area); }, up: () => true };
        return true;
      }
      const g = sp.geom;
      if (g && ev.x >= area.win.x1 + 15 && ev.x <= area.win.x1 + 35 && ev.y >= g.listBot && ev.y <= g.listTop) {
        const list = sp.listCache || [];
        const pages = Math.max(1, Math.ceil(list.length / g.rows));
        const apply = m => { const f = 1 - (m.y - g.listBot) / (g.listTop - g.listBot); sp.scroll = Math.max(0, Math.round(f * (pages - g.cols))); ctx.redraw(area); };
        apply(ev);
        ctx.modal = { move: apply, up: () => true };
        return true;
      }
    }
    if (ev.type === 'wheel' && area.inWin(ev.x, ev.y)) { sp.scroll = Math.max(0, sp.scroll + ev.delta); ctx.redraw(area); return true; }
    if (ev.type === 'key') {
      if (ev.key === 'ESC') { close(ctx, area); return true; }
      if (ev.key === 'RET' || ev.key === 'PADENTER') { execute(ctx, area); return true; }
      if (ev.key === 'P' && !ev.ctrl) { goParent(ctx, area); return true; }
      if (ev.key === 'A' && !ev.ctrl) { const list = sp.listCache || []; if (sp.sel.size) sp.sel.clear(); else list.forEach(e => { if (!e.dir && !e.dot) sp.sel.add(e.name); }); ctx.redraw(area); return true; }
      if (ev.key === 'PAGEUP') { sp.scroll = Math.max(0, sp.scroll - 1); ctx.redraw(area); return true; }
      if (ev.key === 'PAGEDOWN') { sp.scroll++; ctx.redraw(area); return true; }
      if (ev.key === 'X' && !ev.ctrl && sp.mode !== 'data' && !sp.libPath && sp.sel.size) {
        B.UI.okee(ctx, 'Remove from ' + F().partsToPath(sp.dir)).then(ok => {
          if (!ok) return;
          sp.sel.forEach(n => window.vfs.deleteItem(sp.dir, n, true));
          sp.sel.clear();
          ctx.redraw(area);
        });
        return true;
      }
    }
    return false;
  }

  B.FileSpace = { start, close, entries, execute };
  B.SPACES.file = { name: 'File', headerTop: true, init, draw, header, event };
  B.SPACES.imasel = { name: 'ImageSelect', headerTop: true, init, draw, header, event };
})(globalThis.B204 = globalThis.B204 || {});
