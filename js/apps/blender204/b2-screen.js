(function (B) {
  'use strict';
  const rgb = B.rgb;
  const HEADERY = 22;
  const EDGE_LIGHT = rgb(240, 240, 240), EDGE_MID = rgb(144, 144, 144), EDGE_DARK = rgb(80, 80, 80);

  const SPACE_ORDER = ['view3d', 'ipo', 'oops', 'buts', 'file', 'image', 'info', 'seq', 'text', 'imasel', 'sound'];

  class Area {
    constructor(screen, v1, v2, v3, v4, type) {
      this.screen = screen;
      this.v1 = v1; this.v2 = v2; this.v3 = v3; this.v4 = v4;
      this.type = type;
      this.spaces = {};
      this.headertype = type === 'buts' || type === 'info' || type === 'file' || type === 'imasel' ? 'top' : 'bottom';
      this.hdrBlock = null;
      this.winBlock = null;
      this.dirty = true;
    }

    get space() {
      if (!this.spaces[this.type]) {
        const S = B.SPACES[this.type];
        this.spaces[this.type] = S && S.init ? S.init(this) : {};
      }
      return this.spaces[this.type];
    }

    frame() {
      const W = this.screen.w, H = this.screen.h;
      const x1 = this.v1.x <= 0 ? 0 : this.v1.x + 2;
      const y1 = this.v1.y <= 0 ? 0 : this.v1.y + 2;
      const x2 = this.v3.x >= W - 1 ? W - 1 : this.v3.x - 2;
      const y2 = this.v3.y >= H - 1 ? H - 1 : this.v3.y - 2;
      return { x1, y1, x2, y2 };
    }

    layout() {
      const f = this.frame();
      this.fr = f;
      const ix1 = f.x1 + 1, ix2 = f.x2 - 1;
      if (this.headertype === 'top') {
        this.hdr = { x1: ix1, x2: ix2, y1: f.y2 - HEADERY + 1, y2: f.y2 };
        this.win = { x1: ix1, x2: ix2, y1: f.y1 + 1, y2: f.y2 - HEADERY };
      } else if (this.headertype === 'bottom') {
        this.hdr = { x1: ix1, x2: ix2, y1: f.y1, y2: f.y1 + HEADERY - 1 };
        this.win = { x1: ix1, x2: ix2, y1: f.y1 + HEADERY, y2: f.y2 - 1 };
      } else {
        this.hdr = null;
        this.win = { x1: ix1, x2: ix2, y1: f.y1 + 1, y2: f.y2 - 1 };
      }
      this.winx = Math.max(1, this.win.x2 - this.win.x1 + 1);
      this.winy = Math.max(1, this.win.y2 - this.win.y1 + 1);
    }

    inWin(x, y) { const w = this.win; return w && x >= w.x1 && x <= w.x2 && y >= w.y1 && y <= w.y2; }
    inHdr(x, y) { const h = this.hdr; return h && x >= h.x1 && x <= h.x2 && y >= h.y1 && y <= h.y2; }
    inFrame(x, y) { const f = this.fr; return f && x >= f.x1 && x <= f.x2 && y >= f.y1 && y <= f.y2; }
    redraw() { this.dirty = true; }
  }

  class Screen {
    constructor(name, w, h) {
      this.name = name;
      this.w = w; this.h = h;
      this.verts = [];
      this.areas = [];
      this.full = null;
      this.scene = null;
    }

    vert(x, y) {
      let v = this.verts.find(p => p.x === x && p.y === y);
      if (!v) { v = { x, y }; this.verts.push(v); }
      return v;
    }

    addArea(x1, y1, x2, y2, type) {
      const a = new Area(this, this.vert(x1, y1), this.vert(x1, y2), this.vert(x2, y2), this.vert(x2, y1), type);
      this.areas.push(a);
      return a;
    }

    layout() {
      this.areas.forEach(a => a.layout());
    }

    resize(w, h) {
      if (w === this.w && h === this.h) return;
      const ow = this.w, oh = this.h;
      const fixed = new Map();
      this.areas.forEach(a => {
        if (a.type === 'info' && a.v1.y > 0 && a.v2.y >= oh - 1) fixed.set(a.v1, oh - 1 - a.v1.y);
      });
      this.verts.forEach(v => {
        if (v.x >= ow - 1) v.x = w - 1; else if (v.x > 0) v.x = Math.round(v.x * (w - 1) / (ow - 1));
        if (v.y >= oh - 1) v.y = h - 1;
        else if (fixed.has(v)) v.y = h - 1 - fixed.get(v);
        else if (v.y > 0) v.y = Math.round(v.y * (h - 1) / (oh - 1));
      });
      this.areas.forEach(a => {
        if (a.type === 'info' && a.v2.y >= h - 1) {
          const want = h - 1 - (fixed.get(a.v1) != null ? fixed.get(a.v1) : HEADERY + 1);
          this.moveEdgeY(a.v1, a.v4, want);
        }
      });
      this.w = w; this.h = h;
      this.areas.forEach(a => a.redraw());
    }

    moveEdgeY(va, vb, y) {
      const old = va.y;
      const xs = [Math.min(va.x, vb.x), Math.max(va.x, vb.x)];
      this.verts.forEach(v => { if (v.y === old && v.x >= xs[0] && v.x <= xs[1]) v.y = y; });
    }

    areaAt(x, y) {
      if (this.full) return this.full.inFrame(x, y) ? this.full : null;
      return this.areas.find(a => a.inFrame(x, y)) || null;
    }

    visibleAreas() { return this.full ? [this.full] : this.areas; }

    edgeAt(x, y) {
      if (this.full) return null;
      for (const a of this.areas) {
        const v1 = a.v1, v3 = a.v3;
        if (v1.y > 0 && Math.abs(y - v1.y) <= 2 && x > v1.x + 2 && x < v3.x - 2) return this.edgeLine('h', v1.y, x);
        if (v3.y < this.h - 1 && Math.abs(y - v3.y) <= 2 && x > v1.x + 2 && x < v3.x - 2) return this.edgeLine('h', v3.y, x);
        if (v1.x > 0 && Math.abs(x - v1.x) <= 2 && y > v1.y + 2 && y < v3.y - 2) return this.edgeLine('v', v1.x, y);
        if (v3.x < this.w - 1 && Math.abs(x - v3.x) <= 2 && y > v1.y + 2 && y < v3.y - 2) return this.edgeLine('v', v3.x, y);
      }
      return null;
    }

    edgeLine(dir, pos, along) {
      const segs = [];
      this.areas.forEach(a => {
        if (dir === 'h') {
          if (a.v1.y === pos || a.v3.y === pos) segs.push([a.v1.x, a.v3.x, a]);
        } else if (a.v1.x === pos || a.v3.x === pos) segs.push([a.v1.y, a.v3.y, a]);
      });
      let lo = along, hi = along;
      let grew = true;
      const hit = segs.filter(s => s[0] <= along && s[1] >= along);
      if (!hit.length) return null;
      lo = Math.min(...hit.map(s => s[0])); hi = Math.max(...hit.map(s => s[1]));
      while (grew) {
        grew = false;
        segs.forEach(s => {
          if (s[0] < lo && s[1] >= lo) { lo = s[0]; grew = true; }
          if (s[1] > hi && s[0] <= hi) { hi = s[1]; grew = true; }
        });
      }
      const verts = this.verts.filter(v => (dir === 'h' ? v.y === pos && v.x >= lo && v.x <= hi : v.x === pos && v.y >= lo && v.y <= hi));
      const areas = segs.filter(s => s[0] >= lo && s[1] <= hi).map(s => s[2]);
      return { dir, pos, lo, hi, verts, areas, along };
    }

    edgeLimits(edge) {
      let min = 0, max = edge.dir === 'h' ? this.h - 1 : this.w - 1;
      edge.areas.forEach(a => {
        const minSize = a.type === 'info' ? HEADERY + 1 : (a.headertype === 'none' ? 12 : HEADERY + 12);
        if (edge.dir === 'h') {
          if (a.v1.y === edge.pos) max = Math.min(max, a.v3.y - minSize);
          if (a.v3.y === edge.pos) min = Math.max(min, a.v1.y + minSize);
        } else {
          if (a.v1.x === edge.pos) max = Math.min(max, a.v3.x - 40);
          if (a.v3.x === edge.pos) min = Math.max(min, a.v1.x + 40);
        }
      });
      return [min, max];
    }

    moveEdge(edge, pos) {
      const [min, max] = this.edgeLimits(edge);
      pos = Math.round(B.clamp(pos, min, max));
      edge.verts.forEach(v => { if (edge.dir === 'h') v.y = pos; else v.x = pos; });
      edge.pos = pos;
      this.areas.forEach(a => a.redraw());
    }

    split(area, dir, pos) {
      const a = area;
      if (dir === 'h') {
        if (pos <= a.v1.y + HEADERY + 8 || pos >= a.v3.y - HEADERY - 8) return null;
        const l = this.vert(a.v1.x, pos), r = this.vert(a.v3.x, pos);
        const top = new Area(this, l, a.v2, a.v3, r, a.type);
        top.headertype = a.headertype;
        top.spaces = B.cloneSpaces ? B.cloneSpaces(a) : {};
        a.v2 = l; a.v3 = r;
        this.areas.push(top);
        this.areas.forEach(x => x.redraw());
        return top;
      }
      if (pos <= a.v1.x + 40 || pos >= a.v3.x - 40) return null;
      const b = this.vert(pos, a.v1.y), t = this.vert(pos, a.v3.y);
      const right = new Area(this, b, t, a.v3, a.v4, a.type);
      right.headertype = a.headertype;
      right.spaces = B.cloneSpaces ? B.cloneSpaces(a) : {};
      a.v3 = t; a.v4 = b;
      this.areas.push(right);
      this.areas.forEach(x => x.redraw());
      return right;
    }

    join(keep, gone) {
      if (keep.v1.x === gone.v1.x && keep.v3.x === gone.v3.x) {
        if (keep.v3.y === gone.v1.y) { keep.v2 = gone.v2; keep.v3 = gone.v3; }
        else if (keep.v1.y === gone.v3.y) { keep.v1 = gone.v1; keep.v4 = gone.v4; }
        else return false;
      } else if (keep.v1.y === gone.v1.y && keep.v3.y === gone.v3.y) {
        if (keep.v3.x === gone.v1.x) { keep.v3 = gone.v3; keep.v4 = gone.v4; }
        else if (keep.v1.x === gone.v3.x) { keep.v1 = gone.v1; keep.v2 = gone.v2; }
        else return false;
      } else return false;
      this.areas.splice(this.areas.indexOf(gone), 1);
      const used = new Set();
      this.areas.forEach(a => { used.add(a.v1); used.add(a.v2); used.add(a.v3); used.add(a.v4); });
      this.verts = this.verts.filter(v => used.has(v));
      this.areas.forEach(x => x.redraw());
      return true;
    }

    neighbours(area) {
      return this.areas.filter(o => o !== area && (
        (o.v1.x === area.v1.x && o.v3.x === area.v3.x && (o.v1.y === area.v3.y || o.v3.y === area.v1.y)) ||
        (o.v1.y === area.v1.y && o.v3.y === area.v3.y && (o.v1.x === area.v3.x || o.v3.x === area.v1.x))
      ));
    }

    drawEdges(r) {
      r.resetClip();
      r.rect(0, 0, this.w, this.h, EDGE_MID);
      if (this.full) return;
      this.areas.forEach(a => {
        if (a.v3.y < this.h - 1) {
          r.hline(a.v1.x, a.v3.x, a.v3.y + 1, EDGE_LIGHT);
          r.hline(a.v1.x, a.v3.x, a.v3.y - 1, EDGE_DARK);
        }
        if (a.v3.x < this.w - 1) {
          r.vline(a.v3.x - 1, a.v1.y, a.v3.y, EDGE_LIGHT);
          r.vline(a.v3.x + 1, a.v1.y, a.v3.y, EDGE_DARK);
        }
      });
    }
  }

  function headerColor(active) { return active ? rgb(191, 191, 191) : rgb(166, 166, 166); }

  function drawHeaderBack(r, area, active) {
    const h = area.hdr;
    const body = headerColor(active);
    r.rect(h.x1, h.y1, h.x2 + 1, h.y2 + 1, body);
    r.hline(h.x1, h.x2, h.y1, rgb(0, 0, 0));
    r.hline(h.x1, h.x2, h.y1 + 1, rgb(64, 64, 64));
    r.hline(h.x1, h.x2, h.y1 + 2, rgb(128, 128, 128));
    r.hline(h.x1, h.x2, h.y2 - 1, rgb(176, 176, 176));
    r.hline(h.x1, h.x2, h.y2, rgb(220, 220, 220));
  }

  function headerBlock(r, area, active) {
    const h = area.hdr;
    const blk = new B.UI.Block(r, { ox: h.x1 - 1 - (area.space.hdrScroll || 0), oy: h.y1, font: 'helv12', area });
    blk.col = active ? B.UI.COL.PURPLE : B.UI.COL.GREY;
    blk.headerActive = active;
    return blk;
  }

  function stdHeaderButtons(blk, area, ctx) {
    const b = blk.iconrow([0, 0], SPACE_ORDER.length, 6, 0, 21, 22, () => SPACE_ORDER.indexOf(area.type), v => ctx.setSpaceType(area, SPACE_ORDER[v]), 'Current window type');
    b.icons = SPACE_ORDER.map((_, i) => [i, 0]);
    const full = !!area.screen.full;
    blk.icon(full ? [1, 8] : [0, 8], 45, 0, 21, 22, () => ctx.toggleFull(area), full ? 'Restore smaller windows (CTRL+Up arrow)' : 'Make fullscreen window (CTRL+Down arrow)');
    return 86;
  }

  B.HEADERY = HEADERY;
  B.SPACE_ORDER = SPACE_ORDER;
  B.Area = Area;
  B.Screen = Screen;
  B.ScreenDraw = { drawHeaderBack, headerBlock, stdHeaderButtons, headerColor };
  B.SPACES = B.SPACES || {};
})(globalThis.B204 = globalThis.B204 || {});
