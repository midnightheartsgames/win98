(function (B) {
  'use strict';
  const rgb = B.rgb;
  const COL = B.UI.COL;

  function init() { return { text: null, font: 0, top: 0, left: 0 }; }

  function fontName(sp) { return sp.font ? 'scr15' : 'scr12'; }
  function lineH(sp) { return sp.font ? 15 : 12; }
  function charW(sp) { return B.textWidth(fontName(sp), 'M') || 6; }

  function curText(ctx, sp) {
    if (sp.text && ctx.main.texts.includes(sp.text)) return sp.text;
    sp.text = ctx.main.texts[0] || null;
    return sp.text;
  }

  function expandTabs(s) { return s.replace(/\t/g, '    '); }

  function visCol(line, c) { return expandTabs(line.slice(0, c)).length; }

  function draw(ctx, area, r) {
    const sp = area.space;
    const w = area.win;
    r.rect(w.x1, w.y1, w.x2 + 1, w.y2 + 1, rgb(166, 166, 166));
    const tx = curText(ctx, sp);
    if (!tx) return;
    const lh = lineH(sp), cw = charW(sp), fn = fontName(sp);
    const rows = Math.floor((area.winy - 4) / lh);
    sp.rows = rows;
    const s1 = Math.min(tx.curl, tx.sell), s2 = Math.max(tx.curl, tx.sell);
    const c1 = tx.curl < tx.sell || (tx.curl === tx.sell && tx.curc < tx.selc) ? tx.curc : tx.selc;
    const c2 = tx.curl < tx.sell || (tx.curl === tx.sell && tx.curc < tx.selc) ? tx.selc : tx.curc;
    const hasSel = tx.curl !== tx.sell || tx.curc !== tx.selc;
    for (let i = 0; i < rows; i++) {
      const ln = sp.top + i;
      if (ln >= tx.lines.length) break;
      const line = tx.lines[ln];
      const y = w.y2 - 2 - (i + 1) * lh;
      if (hasSel && ln >= s1 && ln <= s2) {
        const a = ln === s1 ? visCol(line, c1) : 0, b = ln === s2 ? visCol(line, c2) : expandTabs(line).length + 1;
        r.rect(w.x1 + 4 + (a - sp.left) * cw, y + 1, w.x1 + 4 + (b - sp.left) * cw, y + lh + 1, rgb(110, 110, 140));
      }
      const vis = expandTabs(line).slice(sp.left);
      r.text(fn, vis, w.x1 + 4, y + 3, hasSel && ln >= s1 && ln <= s2 ? rgb(255, 255, 255) : rgb(0, 0, 0));
    }
    const cy = tx.curl - sp.top;
    if (cy >= 0 && cy < rows && ctx.curarea === area) {
      const cx = w.x1 + 4 + (visCol(tx.lines[tx.curl] || '', tx.curc) - sp.left) * cw;
      const y = w.y2 - 2 - (cy + 1) * lh;
      r.rect(cx - 1, y + 1, cx + 1, y + lh + 1, rgb(255, 0, 0));
    }
  }

  function header(ctx, area, blk) {
    const sp = area.space;
    B.ScreenDraw.stdHeaderButtons(blk, area, ctx);
    blk.col = blk.headerActive ? COL.PURPLE : COL.GREY;
    blk.menu('Screen 12 %x0|Screen 15%x1', 70, 0, 80, 22, () => sp.font, v => { sp.font = v; ctx.redraw(area); }, 'Font display menu');
    let x = 160;
    const tx = curText(ctx, sp);
    x = B.Buts.idBrowse(ctx, blk, x, 'TX', {
      get: () => tx, set: t => { sp.text = t; },
      open: true, openNew: () => openText(ctx, area),
      addNew: () => { sp.text = B.Data.newText(ctx.main, 'Text'); },
      unlink: () => B.UI.okee(ctx, 'Really delete text?').then(ok => { if (ok && tx) { ctx.main.remove(tx); sp.text = null; ctx.redrawAll(); } })
    });
    if (tx && tx.filename) blk.label(tx.filename, x, 1, 300, 20);
  }

  function openText(ctx, area) {
    B.FileSpace.start(ctx, {
      title: 'LOAD TEXT FILE', mode: 'load', dir: ['My Computer', 'C:', 'My Documents'],
      onOk: p => {
        const { dir, name } = B.FileOps.splitFile(p);
        const node = B.FileOps.readVFS(dir, name);
        if (!node || typeof node.content !== 'string') { B.UI.error(ctx, "Can't read file"); return; }
        const t = B.Data.newText(ctx.main, name);
        t.lines = node.content.replace(/\r\n/g, '\n').split('\n');
        t.filename = p;
        const a = ctx.screen.areas.find(x => x.type === 'text') || area;
        a.space.text = t;
        ctx.redrawAll();
      }
    });
  }

  function saveText(ctx, area, as) {
    const tx = curText(ctx, area.space);
    if (!tx) return;
    const write = p => {
      const { dir, name } = B.FileOps.splitFile(p);
      B.FileOps.ensureDir(dir);
      B.FileOps.writeVFS(dir, name, tx.lines.join('\r\n'), 'text');
      tx.filename = p;
      ctx.redrawAll();
    };
    if (!as && tx.filename) write(tx.filename);
    else B.FileSpace.start(ctx, { title: 'SAVE TEXT FILE', mode: 'save', dir: ['My Computer', 'C:', 'My Documents'], file: tx.name.replace(/\.(py|txt)$/i, '') + (/\.(py|txt)$/i.test(tx.name) ? tx.name.match(/\.(py|txt)$/i)[0] : '.txt'), onOk: write });
  }

  function clamp(tx) {
    tx.curl = Math.max(0, Math.min(tx.lines.length - 1, tx.curl));
    tx.curc = Math.max(0, Math.min(tx.lines[tx.curl].length, tx.curc));
  }

  function deleteSel(tx) {
    if (tx.curl === tx.sell && tx.curc === tx.selc) return false;
    let l1 = tx.curl, c1 = tx.curc, l2 = tx.sell, c2 = tx.selc;
    if (l1 > l2 || (l1 === l2 && c1 > c2)) { [l1, l2] = [l2, l1]; [c1, c2] = [c2, c1]; }
    tx.lines.splice(l1, l2 - l1 + 1, tx.lines[l1].slice(0, c1) + tx.lines[l2].slice(c2));
    tx.curl = tx.sell = l1; tx.curc = tx.selc = c1;
    return true;
  }

  function selection(tx) {
    let l1 = tx.curl, c1 = tx.curc, l2 = tx.sell, c2 = tx.selc;
    if (l1 > l2 || (l1 === l2 && c1 > c2)) { [l1, l2] = [l2, l1]; [c1, c2] = [c2, c1]; }
    if (l1 === l2) return tx.lines[l1].slice(c1, c2);
    return [tx.lines[l1].slice(c1), ...tx.lines.slice(l1 + 1, l2), tx.lines[l2].slice(0, c2)].join('\n');
  }

  function insert(tx, s) {
    deleteSel(tx);
    const parts = s.replace(/\r\n/g, '\n').split('\n');
    const line = tx.lines[tx.curl];
    const head = line.slice(0, tx.curc), tail = line.slice(tx.curc);
    if (parts.length === 1) { tx.lines[tx.curl] = head + parts[0] + tail; tx.curc += parts[0].length; }
    else {
      const mid = parts.slice(1, -1);
      tx.lines.splice(tx.curl, 1, head + parts[0], ...mid, parts[parts.length - 1] + tail);
      tx.curl += parts.length - 1;
      tx.curc = parts[parts.length - 1].length;
    }
    tx.sell = tx.curl; tx.selc = tx.curc;
  }

  function ensureVisible(area, tx) {
    const sp = area.space;
    const rows = sp.rows || 20;
    if (tx.curl < sp.top) sp.top = tx.curl;
    if (tx.curl >= sp.top + rows) sp.top = tx.curl - rows + 1;
    const vc = visCol(tx.lines[tx.curl], tx.curc);
    const cols = Math.max(10, Math.floor((area.winx - 10) / charW(sp)));
    if (vc < sp.left) sp.left = vc;
    if (vc >= sp.left + cols) sp.left = vc - cols + 1;
  }

  function posAt(area, tx, ev) {
    const sp = area.space;
    const lh = lineH(sp), cw = charW(sp);
    const row = Math.floor((area.win.y2 - 2 - ev.y) / lh) + sp.top;
    const l = Math.max(0, Math.min(tx.lines.length - 1, row));
    const vcol = Math.max(0, Math.round((ev.x - area.win.x1 - 4) / cw) + sp.left);
    const line = tx.lines[l];
    let c = 0;
    while (c < line.length && visCol(line, c + 1) <= vcol) c++;
    return [l, c];
  }

  function fileMenu(ctx, area) {
    B.UI.pupmenu(ctx, 'File %t|New %x0|Open... %x1|Save %x2|Save As...%x3').then(v => {
      if (v === 0) { area.space.text = B.Data.newText(ctx.main, 'Text'); ctx.redrawAll(); }
      else if (v === 1) openText(ctx, area);
      else if (v === 2) saveText(ctx, area, false);
      else if (v === 3) saveText(ctx, area, true);
    });
  }

  function editMenu(ctx, area, tx) {
    B.UI.pupmenu(ctx, 'Edit %t|Cut %x0|Copy %x1|Paste %x2|Print Cut Buffer %x3').then(v => {
      if (v === 0) { B.textCutBuffer = selection(tx); deleteSel(tx); }
      else if (v === 1) B.textCutBuffer = selection(tx);
      else if (v === 2 && B.textCutBuffer) insert(tx, B.textCutBuffer);
      else if (v === 3 && B.textCutBuffer) B.UI.notice(ctx, B.textCutBuffer.slice(0, 60));
      ctx.redraw(area);
    });
  }

  function viewMenu(ctx, area, tx) {
    B.UI.pupmenu(ctx, 'View %t|Top of File %x0|Bottom of File %x1|Page Up %x2|Page Down %x3').then(v => {
      const sp = area.space;
      if (v === 0) tx.curl = 0;
      else if (v === 1) tx.curl = tx.lines.length - 1;
      else if (v === 2) tx.curl -= sp.rows || 20;
      else if (v === 3) tx.curl += sp.rows || 20;
      else return;
      clamp(tx); tx.sell = tx.curl; tx.selc = tx.curc; ensureVisible(area, tx); ctx.redraw(area);
    });
  }

  function selectMenu(ctx, area, tx) {
    B.UI.pupmenu(ctx, 'Select %t|Select All %x0|Select Line %x1|Jump to Line %x3').then(v => {
      if (v === 0) { tx.sell = 0; tx.selc = 0; tx.curl = tx.lines.length - 1; tx.curc = tx.lines[tx.curl].length; }
      else if (v === 1) { tx.sell = tx.curl; tx.selc = 0; tx.curc = tx.lines[tx.curl].length; }
      else if (v === 3) { B.UI.button(ctx, 'Line: ', tx.curl + 1, 1, tx.lines.length, 0).then(n => { if (n != null) { tx.curl = n - 1; tx.curc = 0; tx.sell = tx.curl; tx.selc = 0; ensureVisible(area, tx); ctx.redraw(area); } }); return; }
      ctx.redraw(area);
    });
  }

  function event(ctx, area, ev) {
    const sp = area.space;
    const tx = curText(ctx, sp);
    if (ev.type === 'down' && area.inWin(ev.x, ev.y)) {
      if (!tx) { sp.text = B.Data.newText(ctx.main, 'Text'); ctx.redrawAll(); return true; }
      if (ev.button === 0) {
        const [l, c] = posAt(area, tx, ev);
        tx.curl = l; tx.curc = c;
        if (!ev.shift) { tx.sell = l; tx.selc = c; }
        ctx.modal = { move: e => { const [l2, c2] = posAt(area, tx, e); tx.curl = l2; tx.curc = c2; ctx.redraw(area); return false; }, up: () => true };
        ctx.redraw(area);
        return true;
      }
      if (ev.button === 1) {
        const sy = ev.y, t0 = sp.top;
        ctx.modal = { move: e => { sp.top = Math.max(0, Math.min(tx.lines.length - 1, t0 + Math.round((e.y - sy) / lineH(sp)))); ctx.redraw(area); return false; }, up: () => true };
        return true;
      }
      if (ev.button === 2) { editMenu(ctx, area, tx); return true; }
    }
    if (ev.type === 'wheel' && area.inWin(ev.x, ev.y) && tx) { sp.top = Math.max(0, Math.min(tx.lines.length - 1, sp.top + ev.delta * 3)); ctx.redraw(area); return true; }
    if (ev.type !== 'key' || !tx) return false;
    const k = ev.key;
    if (ev.alt && k === 'P') { if (B.Python) B.Python.runText(ctx, tx); else B.UI.error(ctx, 'Python not available'); return true; }
    if (ev.alt && k === 'F') { fileMenu(ctx, area); return true; }
    if (ev.alt && k === 'E') { editMenu(ctx, area, tx); return true; }
    if (ev.alt && k === 'V') { viewMenu(ctx, area, tx); return true; }
    if (ev.alt && k === 'S') { saveText(ctx, area, false); return true; }
    if (ev.alt && k === 'O') { openText(ctx, area); return true; }
    if (ev.alt && k === 'J') { selectMenu(ctx, area, tx); return true; }
    if (ev.ctrl && (k === 'C' || k === 'X')) {
      B.textCutBuffer = selection(tx);
      try { if (navigator.clipboard) navigator.clipboard.writeText(B.textCutBuffer).catch(() => {}); } catch {}
      if (k === 'X') deleteSel(tx);
      ctx.redraw(area);
      return true;
    }
    if (ev.ctrl && k === 'V') {
      const paste = s => { insert(tx, s); ensureVisible(area, tx); ctx.redraw(area); };
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(s => paste(s || B.textCutBuffer || '')).catch(() => paste(B.textCutBuffer || ''));
      else paste(B.textCutBuffer || '');
      return true;
    }
    if (ev.ctrl && k === 'A') { tx.sell = 0; tx.selc = 0; tx.curl = tx.lines.length - 1; tx.curc = tx.lines[tx.curl].length; ctx.redraw(area); return true; }
    const move = (dl, dc, home, end) => {
      if (home) tx.curc = 0;
      else if (end) tx.curc = tx.lines[tx.curl].length;
      else if (dc) {
        tx.curc += dc;
        if (tx.curc < 0 && tx.curl > 0) { tx.curl--; tx.curc = tx.lines[tx.curl].length; }
        else if (tx.curc > tx.lines[tx.curl].length && tx.curl < tx.lines.length - 1) { tx.curl++; tx.curc = 0; }
      } else tx.curl += dl;
      clamp(tx);
      if (!ev.shift) { tx.sell = tx.curl; tx.selc = tx.curc; }
    };
    if (k === 'LEFTARROW') move(0, -1);
    else if (k === 'RIGHTARROW') move(0, 1);
    else if (k === 'UPARROW') move(-1, 0);
    else if (k === 'DOWNARROW') move(1, 0);
    else if (k === 'HOME') move(0, 0, true);
    else if (k === 'END') move(0, 0, false, true);
    else if (k === 'PAGEUP') move(-(sp.rows || 20), 0);
    else if (k === 'PAGEDOWN') move(sp.rows || 20, 0);
    else if (k === 'RET' || k === 'PADENTER') {
      const indent = (tx.lines[tx.curl].match(/^[\t ]*/) || [''])[0];
      insert(tx, '\n' + indent);
    } else if (k === 'BACKSPACE') {
      if (!deleteSel(tx)) {
        if (tx.curc > 0) { const l = tx.lines[tx.curl]; tx.lines[tx.curl] = l.slice(0, tx.curc - 1) + l.slice(tx.curc); tx.curc--; }
        else if (tx.curl > 0) { const prev = tx.lines[tx.curl - 1]; tx.lines.splice(tx.curl - 1, 2, prev + tx.lines[tx.curl]); tx.curl--; tx.curc = prev.length; }
        tx.sell = tx.curl; tx.selc = tx.curc;
      }
    } else if (k === 'DEL') {
      if (!deleteSel(tx)) {
        const l = tx.lines[tx.curl];
        if (tx.curc < l.length) tx.lines[tx.curl] = l.slice(0, tx.curc) + l.slice(tx.curc + 1);
        else if (tx.curl < tx.lines.length - 1) tx.lines.splice(tx.curl, 2, l + tx.lines[tx.curl + 1]);
      }
    } else if (k === 'TAB') insert(tx, '\t');
    else if (ev.char && ev.char.length === 1 && !ev.ctrl && !ev.alt) {
      let ch = ev.char;
      if (ctx.prefs.noCapsLock && /[A-Z]/.test(ch) && !ev.shift) ch = ch.toLowerCase();
      insert(tx, ch);
    } else return false;
    ensureVisible(area, tx);
    ctx.redraw(area);
    return true;
  }

  B.TextSpace = { openText, saveText, curText };
  B.SPACES.text = { name: 'Text', init, draw, header, event };
})(globalThis.B204 = globalThis.B204 || {});
