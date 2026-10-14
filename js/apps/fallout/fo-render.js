(function (FO) {
  'use strict';

  FO.FLAG = {
    HIDDEN: 0x1,
    FLAT: 0x8,
    NO_BLOCK: 0x10,
    MULTIHEX: 0x800,
    NO_HIGHLIGHT: 0x1000,
    TRANS_RED: 0x4000,
    TRANS_NONE: 0x8000,
    TRANS_WALL: 0x10000,
    TRANS_GLASS: 0x20000,
    TRANS_STEAM: 0x40000,
    TRANS_ENERGY: 0x80000,
    LEFT_HAND: 0x1000000,
    RIGHT_HAND: 0x2000000,
    WORN: 0x4000000,
    LIGHT_THRU: 0x20000000,
    SEEN: 0x40000000,
    SHOOT_THRU: 0x80000000
  };

  FO.LIGHT_FULL = 0x10000;

  class Screen {
    constructor(w, h) {
      this.resize(w, h);
    }

    resize(w, h) {
      this.w = w;
      this.h = h;
      this.px = new Uint8Array(w * h);
    }

    fill(c) {
      this.px.fill(c || 0);
    }

    rect(x, y, w, h, c) {
      const x0 = Math.max(0, x | 0);
      const y0 = Math.max(0, y | 0);
      const x1 = Math.min(this.w, (x + w) | 0);
      const y1 = Math.min(this.h, (y + h) | 0);
      for (let j = y0; j < y1; j++) this.px.fill(c, j * this.w + x0, j * this.w + x1);
    }

    shadeRect(x, y, w, h, table) {
      const x0 = Math.max(0, x | 0);
      const y0 = Math.max(0, y | 0);
      const x1 = Math.min(this.w, (x + w) | 0);
      const y1 = Math.min(this.h, (y + h) | 0);
      for (let j = y0; j < y1; j++) {
        for (let d = j * this.w + x0, e = j * this.w + x1; d < e; d++) {
          const c = this.px[d];
          if (c) this.px[d] = table[c];
        }
      }
    }

    blit(fr, x, y, shade) {
      x |= 0;
      y |= 0;
      const w = fr.w;
      const src = fr.px;
      const dst = this.px;
      const W = this.w;
      const i0 = x < 0 ? -x : 0;
      const j0 = y < 0 ? -y : 0;
      const i1 = Math.min(w, W - x);
      const j1 = Math.min(fr.h, this.h - y);
      if (i0 >= i1 || j0 >= j1) return;
      for (let j = j0; j < j1; j++) {
        let s = j * w + i0;
        let d = (y + j) * W + x + i0;
        const e = s + (i1 - i0);
        if (shade) {
          for (; s < e; s++, d++) {
            const c = src[s];
            if (c) dst[d] = shade[c];
          }
        } else {
          for (; s < e; s++, d++) {
            const c = src[s];
            if (c) dst[d] = c;
          }
        }
      }
    }

    blitPart(fr, sx, sy, w, h, x, y) {
      x |= 0;
      y |= 0;
      const W = this.w;
      const i0 = Math.max(0, -x);
      const j0 = Math.max(0, -y);
      const i1 = Math.min(w, W - x, fr.w - sx);
      const j1 = Math.min(h, this.h - y, fr.h - sy);
      for (let j = j0; j < j1; j++) {
        let s = (sy + j) * fr.w + sx + i0;
        let d = (y + j) * W + x + i0;
        for (let i = i0; i < i1; i++, s++, d++) {
          const c = fr.px[s];
          if (c) this.px[d] = c;
        }
      }
    }

    blitScaled(fr, src, dst) {
      const [sx, sy, sw, sh] = src;
      const [x, y, w, h] = dst.map(v => v | 0);
      if (w <= 0 || h <= 0) return;
      const i0 = Math.max(0, -x);
      const j0 = Math.max(0, -y);
      const i1 = Math.min(w, this.w - x);
      const j1 = Math.min(h, this.h - y);
      if (i0 >= i1 || j0 >= j1) return;
      const cols = new Int32Array(i1 - i0);
      for (let i = i0; i < i1; i++) cols[i - i0] = sx + Math.min(sw - 1, Math.floor(i * sw / w));
      for (let j = j0; j < j1; j++) {
        const row = (sy + Math.min(sh - 1, Math.floor(j * sh / h))) * fr.w;
        let d = (y + j) * this.w + x + i0;
        for (let k = 0; k < cols.length; k++, d++) this.px[d] = fr.px[row + cols[k]];
      }
    }

    blitBlend(fr, x, y, table) {
      x |= 0;
      y |= 0;
      const w = fr.w;
      const src = fr.px;
      const dst = this.px;
      const W = this.w;
      const i0 = x < 0 ? -x : 0;
      const j0 = y < 0 ? -y : 0;
      const i1 = Math.min(w, W - x);
      const j1 = Math.min(fr.h, this.h - y);
      for (let j = j0; j < j1; j++) {
        let s = j * w + i0;
        let d = (y + j) * W + x + i0;
        for (let i = i0; i < i1; i++, s++, d++) {
          const c = src[s];
          if (c) dst[d] = table[(c << 8) | dst[d]];
        }
      }
    }

    outline(fr, x, y, c) {
      const w = fr.w;
      const h = fr.h;
      const src = fr.px;
      const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && src[j * w + i] !== 0;
      for (let j = -1; j <= h; j++) {
        const py = y + j;
        if (py < 0 || py >= this.h) continue;
        for (let i = -1; i <= w; i++) {
          const px = x + i;
          if (px < 0 || px >= this.w || solid(i, j)) continue;
          if (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1)) this.px[py * this.w + px] = c;
        }
      }
    }

    toRGBA(out, lut) {
      const px = this.px;
      for (let i = 0; i < px.length; i++) out[i] = lut[px[i]];
    }
  }

  FO.Screen = Screen;

  FO.frameOf = function (frm, rot, frame) {
    const d = frm.dirs[(rot || 0) % 6] || frm.dirs[0];
    const n = d.frames.length;
    const f = d.frames[frame >= 0 && frame < n ? frame : 0];
    return [d, f];
  };

  FO.objectRect = function (obj, frm) {
    const [d, f] = FO.frameOf(frm, obj.rot, obj.frame);
    const cx = FO.hexLeft(obj.tile) + 16;
    const cy = FO.hexTop(obj.tile) + 8;
    const left = cx + (obj.x | 0) + d.sx - (f.w >> 1);
    const top = cy + (obj.y | 0) + d.sy - f.h + 1;
    return [left, top, f.w, f.h, f];
  };

  function transKind(flags) {
    const F = FO.FLAG;
    if (flags & F.TRANS_NONE) return null;
    if (flags & F.TRANS_GLASS) return 'glass';
    if (flags & F.TRANS_STEAM) return 'steam';
    if (flags & F.TRANS_ENERGY) return 'energy';
    if (flags & F.TRANS_RED) return 'red';
    if (flags & F.TRANS_WALL) return 'wall';
    return null;
  }

  FO.lightAt = function (v, tile) {
    if (!v.light) return v.ambient === undefined ? FO.LIGHT_FULL : v.ambient;
    const l = v.light[tile];
    return l > FO.LIGHT_FULL ? FO.LIGHT_FULL : l;
  };

  function drawSquares(scr, v, layer, dy) {
    const colors = v.colors;
    const ids = layer[v.elev];
    const W = scr.w;
    const H = scr.h;
    for (let sq = 0; sq < FO.SQUARES; sq++) {
      const id = ids[sq] & 0xFFF;
      if (id <= 1) continue;
      if (dy && v.hiddenRoof && v.hiddenRoof[sq]) continue;
      const x = FO.squareLeft(sq) - v.x;
      const y = FO.squareTop(sq) + dy - v.y;
      if (x <= -80 || y <= -36 || x >= W || y >= H) continue;
      const frm = v.art.get(FO.fid(FO.ART.TILE, id));
      if (!frm) continue;
      let light;
      if (dy) {
        light = v.ambient === undefined ? FO.LIGHT_FULL : v.ambient;
      } else {
        const tx = (sq % 100) * 2;
        const ty = ((sq / 100) | 0) * 2;
        const t = ty * 200 + tx;
        light = (FO.lightAt(v, t) + FO.lightAt(v, t + 1) + FO.lightAt(v, t + 200) + FO.lightAt(v, t + 201)) >> 2;
      }
      scr.blit(frm.dirs[0].frames[0], x, y, light >= FO.LIGHT_FULL ? null : colors.shade(light >> 9));
    }
  }

  FO.visibleObjects = function (scr, v) {
    const out = [];
    const list = v.objects[v.elev] || [];
    const W = scr.w;
    const H = scr.h;
    for (const o of list) {
      if (o.flags & FO.FLAG.HIDDEN || o.tile < 0) continue;
      const frm = v.art.get(o.fid);
      if (!frm) continue;
      const [left, top, w, h, f] = FO.objectRect(o, frm);
      const x = left - v.x;
      const y = top - v.y;
      if (x + w <= 0 || y + h <= 0 || x >= W || y >= H) continue;
      out.push({ o, f, x, y, bottom: top + h, flat: (o.flags & FO.FLAG.FLAT) ? 0 : 1 });
    }
    out.sort((a, b) => a.flat - b.flat || a.o.tile - b.o.tile || a.bottom - b.bottom);
    return out;
  };

  FO.drawOutlines = function (scr, v, vis) {
    for (const e of vis || []) {
      const o = e.o;
      if (!o.outline || !o.outlineColor) continue;
      scr.outline(e.f, e.x, e.y, v.colors.nearest(o.outlineColor[0], o.outlineColor[1], o.outlineColor[2]));
    }
  };

  FO.drawMap = function (scr, v) {
    scr.fill(0);
    drawSquares(scr, v, v.map.floors, 0);
    const vis = FO.visibleObjects(scr, v);
    for (const e of vis) {
      const kind = transKind(e.o.flags);
      if (kind) {
        scr.blitBlend(e.f, e.x, e.y, v.colors.blend(kind));
      } else {
        const light = FO.lightAt(v, e.o.tile);
        scr.blit(e.f, e.x, e.y, light >= FO.LIGHT_FULL ? null : v.colors.shade(light >> 9));
      }
    }
    if (v.roofs !== false) drawSquares(scr, v, v.map.roofs, -96);
    return vis;
  };
})(globalThis.FO = globalThis.FO || {});
