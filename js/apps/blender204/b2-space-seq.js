(function (B) {
  'use strict';
  const rgb = B.rgb;
  const COL = B.UI.COL;

  const SEQ_COL = { image: rgb(120, 120, 180), scene: rgb(130, 170, 130), movie: rgb(160, 130, 180), plugin: rgb(200, 160, 100), cross: rgb(180, 140, 120), gammacross: rgb(180, 140, 120), add: rgb(170, 150, 110), sub: rgb(170, 150, 110), mul: rgb(170, 150, 110), alphaover: rgb(190, 160, 120), alphaunder: rgb(190, 160, 120), alphaoverdrop: rgb(190, 160, 120) };
  const EFFECTS = ['cross', 'gammacross', 'add', 'sub', 'mul', 'alphaover', 'alphaunder', 'alphaoverdrop'];

  function init() { return { x1: 0, x2: 250, y1: 0, y2: 8 }; }

  function seqs(ctx) { const ed = ctx.scene.ed || (ctx.scene.ed = { seqs: [] }); return ed.seqs; }

  function map(area, sp) {
    const w = area.win;
    return {
      x: f => w.x1 + (f - sp.x1) / (sp.x2 - sp.x1) * area.winx,
      y: c => w.y1 + 16 + (c - sp.y1) / (sp.y2 - sp.y1) * (area.winy - 16),
      fx: px => sp.x1 + (px - w.x1) / area.winx * (sp.x2 - sp.x1),
      fy: py => sp.y1 + (py - w.y1 - 16) / (area.winy - 16) * (sp.y2 - sp.y1)
    };
  }

  function strEnd(s) { return s.start + s.len; }

  function draw(ctx, area, r) {
    const sp = area.space;
    const w = area.win;
    const m = map(area, sp);
    r.rect(w.x1, w.y1, w.x2 + 1, w.y2 + 1, rgb(128, 128, 128));
    for (let c = Math.ceil(sp.y1); c <= sp.y2; c++) r.rect(w.x1, Math.round(m.y(c)), w.x2 + 1, Math.round(m.y(c + 0.5)), (c & 1) ? rgb(122, 122, 122) : rgb(128, 128, 128));
    const fps = ctx.scene.r.frs_sec || 25;
    const step = Math.max(1, Math.round((sp.x2 - sp.x1) / 10 / fps) * fps) || fps;
    for (let f = Math.ceil(sp.x1 / step) * step; f <= sp.x2; f += step) {
      const x = Math.round(m.x(f));
      r.vline(x, w.y1 + 16, w.y2, rgb(110, 110, 110));
      const sec = f / fps;
      r.text('helv10', Math.floor(sec / 60) + '.' + String(Math.floor(sec % 60)).padStart(2, '0'), x - 8, w.y1 + 4, rgb(0, 0, 0));
    }
    seqs(ctx).forEach(s => {
      const x1 = Math.round(m.x(s.start)), x2 = Math.round(m.x(strEnd(s))) - 1;
      const y1 = Math.round(m.y(s.machine + 0.1)), y2 = Math.round(m.y(s.machine + 0.9));
      const col = SEQ_COL[s.type] || rgb(150, 150, 150);
      B.UI.emboss(r, x1, y1, x2, y2, s.sel ? B.shade(col, 30) : col, false, true);
      if (s.sel === 'L' || s.selL) r.rect(x1 + 1, y1 + 1, x1 + 5, y2, rgb(255, 255, 255));
      if (s.sel === 'R' || s.selR) r.rect(x2 - 4, y1 + 1, x2, y2, rgb(255, 255, 255));
      r.pushClip(x1 + 2, y1, x2 - 2, y2);
      const label = s.type === 'scene' ? (s.scene ? s.scene.name : '?') : s.type === 'image' ? (s.name || 'images') : s.type.toUpperCase();
      r.text('helv10', `${label}: ${s.len}`, x1 + 6, Math.round((y1 + y2) / 2) - 3, rgb(0, 0, 0));
      r.popClip();
      if (EFFECTS.includes(s.type)) [s.seq1, s.seq2].forEach(src => {
        if (!src) return;
        const sx = m.x(src.start + src.len / 2), sy = m.y(src.machine + 0.5);
        r.line(Math.round((x1 + x2) / 2), y1, sx, sy, rgb(60, 60, 60), 0xCCCC);
      });
    });
    const cx = Math.round(m.x(ctx.scene.cfra));
    r.vline(cx, w.y1, w.y2, rgb(96, 192, 64));
  }

  function header(ctx, area, blk) {
    B.ScreenDraw.stdHeaderButtons(blk, area, ctx);
    blk.icon([15, 0], 65, 0, 21, 22, () => viewAll(ctx, area), 'Home (HOMEKEY)');
    blk.icon([5, 0], 100, 0, 21, 22, () => B.Seq.preview(ctx), 'Toggles image display');
    blk.icon([14, 0], 130, 0, 21, 22, null, 'Translate view (MiddleMouse)');
    blk.icon([13, 0], 151, 0, 20, 22, null, 'Zoom view (CTRL+MiddleMouse)');
    const c = blk.but('Clear', 190, 0, 50, 22, () => { B.Seq.cache = new Map(); }, 'Forces a clear of all buffered images in memory');
    c.col = COL.GREY;
  }

  function viewAll(ctx, area) {
    const sp = area.space;
    const list = seqs(ctx);
    if (!list.length) { Object.assign(sp, { x1: 0, x2: ctx.scene.r.efra + 10, y1: 0, y2: 8 }); }
    else {
      const x1 = Math.min(...list.map(s => s.start)), x2 = Math.max(...list.map(strEnd));
      const y2 = Math.max(...list.map(s => s.machine)) + 2;
      Object.assign(sp, { x1: x1 - 10, x2: x2 + 10, y1: 0, y2: Math.max(6, y2) });
    }
    ctx.redraw(area);
  }

  function freeChannel(list, start, len) {
    for (let c = 1; c < 32; c++) if (!list.some(s => s.machine === c && s.start < start + len && strEnd(s) > start)) return c;
    return 1;
  }

  function addMenu(ctx, area) {
    const list = seqs(ctx);
    B.UI.pupmenu(ctx, 'Add sequence%t|Images%x1|Movie%x102|Scene%x101|Plugin%x10|Cross%x2|GammaCross%x3|Add%x4|Sub%x5|Mul%x6|AlphaOver%x7|AlphaUnder%x8|AlphaOverDrop%x9').then(v => {
      if (v == null || v < 0) return;
      const cf = ctx.scene.cfra;
      if (v === 101) {
        const others = ctx.main.scenes.filter(s => s !== ctx.scene);
        if (!others.length) { B.UI.error(ctx, 'No other scenes'); return; }
        B.UI.pupmenu(ctx, 'Scene %t|' + others.map((s, i) => `${s.name} %x${i}`).join('|')).then(i => {
          if (i == null || i < 0) return;
          const sc = others[i];
          const len = sc.r.efra - sc.r.sfra + 1;
          list.forEach(s => { s.sel = false; });
          list.push({ type: 'scene', name: sc.name, scene: sc, start: cf, len, machine: freeChannel(list, cf, len), sel: true });
          ctx.redrawAll();
        });
      } else if (v === 1 || v === 102) {
        B.FileSpace.start(ctx, {
          title: 'SELECT IMAGES', mode: 'load', filter: /\.(bmp|jpg|jpeg|png|gif|tga)$/i, dir: ['My Computer', 'C:', 'My Documents'],
          onOk: p => {
            const { dir, name } = B.FileOps.splitFile(p);
            const fs = window.vfs;
            const folder = fs && fs.resolvePath(dir);
            const files = folder ? Object.keys(folder.children).filter(k => /\.(bmp|jpg|jpeg|png|gif|tga)$/i.test(k)).sort() : [name];
            const startIdx = Math.max(0, files.indexOf(name));
            const imgs = (v === 1 ? files.slice(startIdx) : [name]).map(f => B.FileOps.partsToPath(dir) + f);
            list.forEach(s => { s.sel = false; });
            const len = v === 102 ? 25 : imgs.length;
            list.push({ type: v === 1 ? 'image' : 'movie', name, images: imgs, start: cf, len, machine: freeChannel(list, cf, len), sel: true });
            ctx.redrawAll();
          }
        });
      } else if (v === 10) B.UI.error(ctx, 'Not a plugin');
      else {
        const sel = list.filter(s => s.sel);
        if (sel.length < 2) { B.UI.error(ctx, 'Select two strips'); return; }
        const [a, b] = sel;
        const start = Math.max(a.start, b.start), end = Math.min(strEnd(a), strEnd(b));
        if (end <= start) { B.UI.error(ctx, "Strips don't overlap"); return; }
        list.forEach(s => { s.sel = false; });
        list.push({ type: EFFECTS[v - 2], seq1: a, seq2: b, start, len: end - start, machine: Math.max(a.machine, b.machine) + 1, sel: true });
        ctx.redrawAll();
      }
    });
  }

  function hit(area, sp, list, ev) {
    const m = map(area, sp);
    const f = m.fx(ev.x), c = Math.floor(m.fy(ev.y));
    const s = list.find(q => q.machine === c && f >= q.start && f <= strEnd(q));
    if (!s) return null;
    const px1 = m.x(s.start), px2 = m.x(strEnd(s));
    return { s, side: ev.x - px1 < 6 ? 'L' : px2 - ev.x < 6 ? 'R' : null };
  }

  function grab(ctx, area, ev, side) {
    const sp = area.space;
    const m = map(area, sp);
    const list = seqs(ctx);
    const items = list.filter(s => s.sel).map(s => ({ s, start: s.start, len: s.len, machine: s.machine }));
    if (!items.length) return;
    const sx = ev.x, sy = ev.y;
    const apply = e => {
      const df = Math.round(m.fx(e.x) - m.fx(sx)), dc = side ? 0 : Math.round(m.fy(e.y) - m.fy(sy));
      items.forEach(it => {
        if (side === 'L') { it.s.start = Math.min(it.start + it.len - 1, it.start + df); it.s.len = it.len - (it.s.start - it.start); }
        else if (side === 'R') it.s.len = Math.max(1, it.len + df);
        else { it.s.start = it.start + df; it.s.machine = Math.max(1, it.machine + dc); }
      });
      list.forEach(s => { if (EFFECTS.includes(s.type) && s.seq1 && s.seq2) { s.start = Math.max(s.seq1.start, s.seq2.start); s.len = Math.max(1, Math.min(strEnd(s.seq1), strEnd(s.seq2)) - s.start); } });
      area.headerPrint = side ? `Len: ${items[0].s.len}` : `Ofs: ${df}  Channel: ${dc}`;
      ctx.redraw(area);
    };
    ctx.modal = {
      move: e => { apply(e); return false; },
      down: e => { if (e.button === 2) items.forEach(it => Object.assign(it.s, { start: it.start, len: it.len, machine: it.machine })); area.headerPrint = null; ctx.redrawAll(); return true; },
      up: e => (e.button === 2 && ev.drag ? (area.headerPrint = null, ctx.redrawAll(), true) : false),
      key: e => { if (e.key === 'ESC') { items.forEach(it => Object.assign(it.s, { start: it.start, len: it.len, machine: it.machine })); area.headerPrint = null; ctx.redrawAll(); return true; } if (e.key === 'RET' || e.key === 'SPACE') { area.headerPrint = null; ctx.redrawAll(); return true; } return false; }
    };
  }

  function event(ctx, area, ev) {
    const sp = area.space;
    const list = seqs(ctx);
    const m = map(area, sp);
    if (ev.type === 'down' && area.inWin(ev.x, ev.y)) {
      if (ev.button === 0) {
        const setf = e => { ctx.scene.cfra = Math.max(1, Math.round(m.fx(e.x))); B.Anim.setFrame(ctx, ctx.scene.cfra); };
        setf(ev);
        ctx.modal = { move: e => { setf(e); return false; }, up: () => true };
        return true;
      }
      if (ev.button === 1) {
        const s0 = Object.assign({}, sp), sx = ev.x, sy = ev.y;
        ctx.modal = { move: e => { const dx = (e.x - sx) / area.winx * (s0.x2 - s0.x1), dy = (e.y - sy) / area.winy * (s0.y2 - s0.y1); if (ev.ctrl) { const f = Math.exp((e.x - sx) * -0.01); const c = (s0.x1 + s0.x2) / 2; sp.x1 = c - (c - s0.x1) * f; sp.x2 = c + (s0.x2 - c) * f; } else { sp.x1 = s0.x1 - dx; sp.x2 = s0.x2 - dx; sp.y1 = s0.y1 - dy; sp.y2 = s0.y2 - dy; } ctx.redraw(area); return false; }, up: () => true };
        return true;
      }
      if (ev.button === 2) {
        const h = hit(area, sp, list, ev);
        if (!ev.shift) list.forEach(s => { s.sel = false; s.selL = false; s.selR = false; });
        if (h) { h.s.sel = true; h.s.selL = h.side === 'L'; h.s.selR = h.side === 'R'; }
        ctx.redraw(area);
        if (h) { const sx = ev.x, sy = ev.y; ctx.modal = { move: e => { if (Math.hypot(e.x - sx, e.y - sy) > 4) { ctx.modal = null; grab(ctx, area, { x: sx, y: sy, drag: true }, h.side); } return false; }, up: () => true }; }
        return true;
      }
    }
    if (ev.type === 'wheel' && area.inWin(ev.x, ev.y)) { const f = ev.delta > 0 ? 1.15 : 1 / 1.15; const c = (sp.x1 + sp.x2) / 2; sp.x1 = c - (c - sp.x1) * f; sp.x2 = c + (sp.x2 - c) * f; ctx.redraw(area); return true; }
    if (ev.type !== 'key') return false;
    const k = ev.key;
    if (k === 'HOME') { viewAll(ctx, area); return true; }
    if ((k === 'A' && ev.shift) || (k === 'SPACE' && !ev.ctrl)) { addMenu(ctx, area); return true; }
    if (k === 'A' && !ev.shift && !ev.ctrl) { const any = list.some(s => s.sel); list.forEach(s => { s.sel = !any; }); ctx.redraw(area); return true; }
    if (k === 'G' && !ev.ctrl && !ev.alt) { const s = list.find(q => q.sel); grab(ctx, area, ev, s && s.selL ? 'L' : s && s.selR ? 'R' : null); return true; }
    if ((k === 'X' || k === 'DEL') && !ev.ctrl) {
      B.UI.okee(ctx, 'Erase selected').then(ok => {
        if (!ok) return;
        const kill = new Set(list.filter(s => s.sel));
        list.forEach(s => { if (kill.has(s.seq1) || kill.has(s.seq2)) kill.add(s); });
        ctx.scene.ed.seqs = list.filter(s => !kill.has(s));
        ctx.redrawAll();
      });
      return true;
    }
    if (k === 'C' && !ev.ctrl) {
      const s = list.find(q => q.sel && EFFECTS.includes(q.type));
      if (!s) return true;
      B.UI.pupmenu(ctx, 'Change effect%t|Switch a-b %x1|Plugin%x11|Recalculate%x12|Cross%x2|GammaCross%x3|Add%x4|Sub%x5|Mul%x6|AlphaOver%x7|AlphaUnder%x8|AlphaOverdrop%x9').then(v => {
        if (v === 1) [s.seq1, s.seq2] = [s.seq2, s.seq1];
        else if (v >= 2 && v <= 9) s.type = EFFECTS[v - 2];
        ctx.redrawAll();
      });
      return true;
    }
    if (k === 'S' && ev.shift) { list.filter(s => s.sel).forEach(s => { s.start = Math.round(ctx.scene.cfra); }); ctx.redrawAll(); return true; }
    return false;
  }

  const Seq = {
    cache: new Map(),
    stripAt(list, f) {
      const act = list.filter(s => f >= s.start && f < strEnd(s)).sort((a, b) => b.machine - a.machine);
      return act[0] || null;
    },
    renderStrip(ctx, s, f, W, H) {
      if (EFFECTS.includes(s.type)) {
        const a = s.seq1 ? Seq.renderStrip(ctx, s.seq1, f, W, H) : null, b = s.seq2 ? Seq.renderStrip(ctx, s.seq2, f, W, H) : null;
        const fac = (f - s.start) / Math.max(1, s.len - 1);
        const out = new Float32Array(W * H * 4);
        for (let i = 0; i < W * H * 4; i++) {
          const x = a ? a[i] : 0, y = b ? b[i] : 0;
          const ab = b ? b[(i - (i % 4)) + 3] : 0, aa = a ? a[(i - (i % 4)) + 3] : 0;
          switch (s.type) {
            case 'cross': out[i] = x * (1 - fac) + y * fac; break;
            case 'gammacross': out[i] = Math.pow(Math.pow(x, 2) * (1 - fac) + Math.pow(y, 2) * fac, 0.5); break;
            case 'add': out[i] = x + y; break;
            case 'sub': out[i] = x - y; break;
            case 'mul': out[i] = x * y; break;
            case 'alphaover': out[i] = y * ab + x * (1 - ab); break;
            case 'alphaunder': out[i] = x * aa + y * (1 - aa); break;
            default: out[i] = y * ab + x * (1 - ab);
          }
        }
        return out;
      }
      if (s.type === 'scene' && s.scene) {
        const sce = s.scene;
        const cam = sce.camera || sce.bases.map(b => b.object).find(o => o.type === 'camera');
        if (!cam) return null;
        const saved = { cfra: sce.cfra, size: sce.r.size, xsch: sce.r.xsch, ysch: sce.r.ysch };
        sce.cfra = sce.r.sfra + (f - s.start);
        sce.r.xsch = W; sce.r.ysch = H; sce.r.size = 100;
        const old = ctx.G.scene;
        ctx.G.scene = sce;
        B.Anim.setFrame(ctx, sce.cfra, true);
        const res = B.Render.runSync(B.Render.renderJob(ctx, sce, { camera: cam }));
        ctx.G.scene = old;
        Object.assign(sce.r, { size: saved.size, xsch: saved.xsch, ysch: saved.ysch });
        sce.cfra = saved.cfra;
        return res ? res.img : null;
      }
      if ((s.type === 'image' || s.type === 'movie') && s.images) {
        const path = s.images[Math.min(s.images.length - 1, Math.max(0, f - s.start))];
        let im = ctx.main.images.find(i => i.path === path);
        if (!im) im = B.FileOps.imageFromPath(ctx, path);
        const out = new Float32Array(W * H * 4);
        if (im && im.pix) {
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const sx = Math.floor(x / W * im.pix.w), sy = Math.floor(y / H * im.pix.h);
            const c = im.pix.buf[(im.pix.h - 1 - sy) * im.pix.w + sx];
            const o = (y * W + x) * 4;
            out[o] = (c & 255) / 255; out[o + 1] = ((c >> 8) & 255) / 255; out[o + 2] = ((c >> 16) & 255) / 255; out[o + 3] = (c >>> 24) / 255;
          }
        }
        return out;
      }
      return null;
    },
    render(ctx, f) {
      const sce = ctx.scene;
      const W = Math.round(sce.r.xsch * sce.r.size / 100), H = Math.round(sce.r.ysch * sce.r.size / 100);
      const s = Seq.stripAt(seqs(ctx), f);
      const img = s ? Seq.renderStrip(ctx, s, f, W, H) : null;
      return { W, H, img: img || new Float32Array(W * H * 4), z: new Float32Array(W * H).fill(Infinity) };
    },
    preview(ctx) {
      if (!seqs(ctx).length) return;
      const res = Seq.render(ctx, ctx.scene.cfra);
      const im = B.Render.toImage(res);
      ctx.G.rendered = im;
      B.Render.openWindow(ctx);
      B.Render.showFinal(ctx, im, 0, 'Sequence ' + ctx.scene.cfra);
    }
  };

  B.Seq = Seq;
  B.SPACES.seq = { name: 'Sequence', init, draw, header, event };
})(globalThis.B204 = globalThis.B204 || {});
