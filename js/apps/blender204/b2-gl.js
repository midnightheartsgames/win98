(function (B) {
  'use strict';

  const rgb = (r, g, b) => (0xff000000 | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0;
  const clampByte = v => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
  const rgbf = (r, g, b) => rgb(clampByte(r * 255), clampByte(g * 255), clampByte(b * 255));
  const shade = (c, d) => rgb(clampByte((c & 255) + d), clampByte(((c >> 8) & 255) + d), clampByte(((c >> 16) & 255) + d));
  const unpack = c => [c & 255, (c >> 8) & 255, (c >> 16) & 255];
  const hex = h => rgb((h >> 16) & 255, (h >> 8) & 255, h & 255);
  const mix = (a, b, t) => rgb(
    clampByte((a & 255) * (1 - t) + (b & 255) * t),
    clampByte(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t),
    clampByte(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t)
  );

  const fonts = {};
  function font(name) {
    if (fonts[name]) return fonts[name];
    const data = B.FONT_DATA && B.FONT_DATA[name];
    const f = { name, ascent: 8, descent: 2, glyphs: new Array(256).fill(null) };
    if (data) {
      f.ascent = data.ascent;
      f.descent = data.descent;
      data.glyphs.forEach((s, i) => {
        if (!s) return;
        const p = s.split(',');
        const w = +p[1], h = +p[2];
        const bits = new Uint8Array(w * h);
        const hx = p[5] || '';
        for (let k = 0; k < w * h; k++) {
          const nib = parseInt(hx[k >> 2], 16) || 0;
          bits[k] = (nib >> (3 - (k & 3))) & 1;
        }
        f.glyphs[32 + i] = { adv: +p[0], w, h, x: +p[3], y: +p[4], bits };
      });
    } else {
      for (let c = 32; c < 256; c++) f.glyphs[c] = { adv: 6, w: 0, h: 0, x: 0, y: 0, bits: new Uint8Array(0) };
    }
    fonts[name] = f;
    return f;
  }

  function textWidth(name, str) {
    const f = font(name);
    let w = 0;
    for (let i = 0; i < str.length; i++) {
      const g = f.glyphs[str.charCodeAt(i) & 255] || f.glyphs[63];
      if (g) w += g.adv;
    }
    return w;
  }

  class Raster {
    constructor(w, h) {
      this.icons = null;
      this.resize(w, h);
    }

    resize(w, h) {
      this.w = Math.max(1, w | 0);
      this.h = Math.max(1, h | 0);
      this.data = new Uint8ClampedArray(this.w * this.h * 4);
      this.buf = new Uint32Array(this.data.buffer);
      this.depth = new Float32Array(this.w * this.h);
      this.cx1 = 0; this.cy1 = 0; this.cx2 = this.w - 1; this.cy2 = this.h - 1;
      this.clipStack = [];
      this.vx = 0; this.vy = 0; this.vw = this.w; this.vh = this.h;
      this.mvp = B.M.ident();
      this.depthTest = false;
      this.depthWrite = true;
      this.depthOffset = 0;
    }

    clip(x1, y1, x2, y2) {
      this.cx1 = Math.max(0, x1 | 0); this.cy1 = Math.max(0, y1 | 0);
      this.cx2 = Math.min(this.w - 1, x2 | 0); this.cy2 = Math.min(this.h - 1, y2 | 0);
    }

    pushClip(x1, y1, x2, y2) {
      this.clipStack.push([this.cx1, this.cy1, this.cx2, this.cy2]);
      this.clip(Math.max(this.cx1, x1), Math.max(this.cy1, y1), Math.min(this.cx2, x2), Math.min(this.cy2, y2));
    }

    popClip() {
      const c = this.clipStack.pop();
      if (c) { this.cx1 = c[0]; this.cy1 = c[1]; this.cx2 = c[2]; this.cy2 = c[3]; }
    }

    resetClip() { this.clipStack = []; this.clip(0, 0, this.w - 1, this.h - 1); }

    px(x, y, c) {
      x |= 0; y |= 0;
      if (x < this.cx1 || x > this.cx2 || y < this.cy1 || y > this.cy2) return;
      this.buf[(this.h - 1 - y) * this.w + x] = c;
    }

    get(x, y) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
      return this.buf[(this.h - 1 - y) * this.w + x];
    }

    rect(x1, y1, x2, y2, c) {
      let a = Math.max(this.cx1, Math.ceil(Math.min(x1, x2))), b = Math.min(this.cx2, Math.ceil(Math.max(x1, x2)) - 1);
      let lo = Math.max(this.cy1, Math.ceil(Math.min(y1, y2))), hi = Math.min(this.cy2, Math.ceil(Math.max(y1, y2)) - 1);
      if (a > b || lo > hi) return;
      const w = this.w, h = this.h, buf = this.buf;
      for (let y = lo; y <= hi; y++) {
        const row = (h - 1 - y) * w;
        buf.fill(c, row + a, row + b + 1);
      }
    }

    rectBlend(x1, y1, x2, y2, c, alpha) {
      let a = Math.max(this.cx1, Math.ceil(Math.min(x1, x2))), b = Math.min(this.cx2, Math.ceil(Math.max(x1, x2)) - 1);
      let lo = Math.max(this.cy1, Math.ceil(Math.min(y1, y2))), hi = Math.min(this.cy2, Math.ceil(Math.max(y1, y2)) - 1);
      for (let y = lo; y <= hi; y++) {
        const row = (this.h - 1 - y) * this.w;
        for (let x = a; x <= b; x++) this.buf[row + x] = mix(this.buf[row + x], c, alpha);
      }
    }

    hline(x1, x2, y, c) { this.rect(Math.min(x1, x2), y, Math.max(x1, x2) + 1, y + 1, c); }
    vline(x, y1, y2, c) { this.rect(x, Math.min(y1, y2), x + 1, Math.max(y1, y2) + 1, c); }

    frame(x1, y1, x2, y2, c) {
      this.hline(x1, x2, y1, c); this.hline(x1, x2, y2, c);
      this.vline(x1, y1, y2, c); this.vline(x2, y1, y2, c);
    }

    line(x1, y1, x2, y2, c, stipple = 0) {
      x1 = Math.round(x1); y1 = Math.round(y1); x2 = Math.round(x2); y2 = Math.round(y2);
      if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) return;
      if (Math.abs(x1) > 1e5 || Math.abs(y1) > 1e5 || Math.abs(x2) > 1e5 || Math.abs(y2) > 1e5) {
        const r = this.clipSeg(x1, y1, x2, y2);
        if (!r) return;
        [x1, y1, x2, y2] = r.map(Math.round);
      }
      const dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
      let err = dx + dy, n = 0;
      for (;;) {
        if (!stipple || ((stipple >> (n & 15)) & 1)) this.px(x1, y1, c);
        n++;
        if (x1 === x2 && y1 === y2) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x1 += sx; }
        if (e2 <= dx) { err += dx; y1 += sy; }
      }
    }

    clipSeg(x1, y1, x2, y2) {
      const xmin = this.cx1 - 1, xmax = this.cx2 + 1, ymin = this.cy1 - 1, ymax = this.cy2 + 1;
      let t0 = 0, t1 = 1;
      const dx = x2 - x1, dy = y2 - y1;
      const p = [-dx, dx, -dy, dy], q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
      for (let i = 0; i < 4; i++) {
        if (p[i] === 0) { if (q[i] < 0) return null; continue; }
        const t = q[i] / p[i];
        if (p[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t; }
        else { if (t < t0) return null; if (t < t1) t1 = t; }
      }
      return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
    }

    text(name, str, x, y, c) {
      const f = font(name);
      x = Math.round(x); y = Math.round(y);
      str = String(str);
      for (let i = 0; i < str.length; i++) {
        const g = f.glyphs[str.charCodeAt(i) & 255] || f.glyphs[63];
        if (!g) continue;
        if (g.w) {
          const top = y + g.y + g.h - 1;
          for (let r = 0; r < g.h; r++) {
            const yy = top - r;
            if (yy < this.cy1 || yy > this.cy2) continue;
            const row = (this.h - 1 - yy) * this.w;
            for (let k = 0; k < g.w; k++) {
              if (!g.bits[r * g.w + k]) continue;
              const xx = x + g.x + k;
              if (xx < this.cx1 || xx > this.cx2) continue;
              this.buf[row + xx] = c;
            }
          }
        }
        x += g.adv;
      }
      return x;
    }

    setIcons(img) { this.icons = img; }

    iconScaled(col, row, x, y, tint, sc) {
      const ic = this.icons;
      if (!ic) return;
      if (sc >= 0.999) { this.icon(col, row, x, y, tint); return; }
      const sx = 3 + 20 * col, sy = 34 + 21 * (9 - row);
      const tr = tint ? (tint & 255) / 153 : 1, tg = tint ? ((tint >> 8) & 255) / 153 : 1, tb = tint ? ((tint >> 16) & 255) / 153 : 1;
      const w = Math.max(1, Math.round(15 * sc)), h = Math.max(1, Math.round(16 * sc));
      x = Math.round(x); y = Math.round(y);
      for (let r = 0; r < h; r++) {
        const yy = y + h - 1 - r;
        if (yy < this.cy1 || yy > this.cy2) continue;
        const drow = (this.h - 1 - yy) * this.w;
        const srow = (sy + Math.min(15, Math.floor(r / sc))) * ic.w;
        for (let k = 0; k < w; k++) {
          const xx = x + k;
          if (xx < this.cx1 || xx > this.cx2) continue;
          const s2 = ic.buf[srow + sx + Math.min(14, Math.floor(k / sc))];
          this.buf[drow + xx] = rgb(clampByte((s2 & 255) * tr), clampByte(((s2 >> 8) & 255) * tg), clampByte(((s2 >> 16) & 255) * tb));
        }
      }
    }

    icon(col, row, x, y, tint) {
      const ic = this.icons;
      if (!ic) return;
      const sx = 3 + 20 * col, sy = 34 + 21 * (9 - row);
      const tr = tint ? (tint & 255) / 153 : 1, tg = tint ? ((tint >> 8) & 255) / 153 : 1, tb = tint ? ((tint >> 16) & 255) / 153 : 1;
      x = Math.round(x); y = Math.round(y);
      for (let r = 0; r < 16; r++) {
        const yy = y + 15 - r;
        if (yy < this.cy1 || yy > this.cy2) continue;
        const drow = (this.h - 1 - yy) * this.w;
        const srow = (sy + r) * ic.w;
        for (let k = 0; k < 15; k++) {
          const xx = x + k;
          if (xx < this.cx1 || xx > this.cx2) continue;
          const s = ic.buf[srow + sx + k];
          this.buf[drow + xx] = rgb(clampByte((s & 255) * tr), clampByte(((s >> 8) & 255) * tg), clampByte(((s >> 16) & 255) * tb));
        }
      }
    }

    blit(img, x, y, zoom = 1, alphaKey = false) {
      x = Math.round(x); y = Math.round(y);
      const w = Math.floor(img.w * zoom), h = Math.floor(img.h * zoom);
      for (let r = 0; r < h; r++) {
        const yy = y + r;
        if (yy < this.cy1 || yy > this.cy2) continue;
        const srcRow = Math.min(img.h - 1, Math.floor(r / zoom));
        const drow = (this.h - 1 - yy) * this.w;
        const srow = (img.flipY ? srcRow : img.h - 1 - srcRow) * img.w;
        for (let k = 0; k < w; k++) {
          const xx = x + k;
          if (xx < this.cx1 || xx > this.cx2) continue;
          const s = img.buf[srow + Math.min(img.w - 1, Math.floor(k / zoom))];
          if (alphaKey && (s >>> 24) < 128) continue;
          this.buf[drow + xx] = s | 0xff000000;
        }
      }
    }

    viewport(x, y, w, h) { this.vx = x; this.vy = y; this.vw = w; this.vh = h; }

    clearDepth() {
      const d = this.depth;
      for (let y = this.cy1; y <= this.cy2; y++) {
        const row = (this.h - 1 - y) * this.w;
        d.fill(1e9, row + this.cx1, row + this.cx2 + 1);
      }
    }

    toScreen(p) {
      const v = B.M.proj(this.mvp, p);
      if (v[3] <= 1e-6) return null;
      const iw = 1 / v[3];
      return [this.vx + (v[0] * iw * 0.5 + 0.5) * this.vw, this.vy + (v[1] * iw * 0.5 + 0.5) * this.vh, v[2] * iw, v[3]];
    }

    clipToScreen(v) {
      const iw = 1 / v[3];
      return [this.vx + (v[0] * iw * 0.5 + 0.5) * this.vw, this.vy + (v[1] * iw * 0.5 + 0.5) * this.vh, v[2] * iw];
    }

    line3(a, b, c, stipple = 0) {
      let p = B.M.proj(this.mvp, a), q = B.M.proj(this.mvp, b);
      const near = 1e-4;
      if (p[3] < near && q[3] < near) return;
      if (p[3] < near || q[3] < near) {
        const t = (near - p[3]) / (q[3] - p[3]);
        const r = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t, near];
        if (p[3] < near) p = r; else q = r;
      }
      const s = this.clipToScreen(p), e = this.clipToScreen(q);
      if (!this.depthTest) { this.line(s[0], s[1], e[0], e[1], c, stipple); return; }
      this.lineZ(s, e, c, stipple);
    }

    lineZ(s, e, c, stipple = 0) {
      let x1 = Math.round(s[0]), y1 = Math.round(s[1]);
      const x2 = Math.round(e[0]), y2 = Math.round(e[1]);
      if (Math.abs(x1) > 1e5 || Math.abs(y1) > 1e5 || Math.abs(x2) > 1e5 || Math.abs(y2) > 1e5) {
        const r = this.clipSeg(s[0], s[1], e[0], e[1]);
        if (!r) return;
        const len = Math.hypot(e[0] - s[0], e[1] - s[1]) || 1;
        const t0 = Math.hypot(r[0] - s[0], r[1] - s[1]) / len, t1 = Math.hypot(r[2] - s[0], r[3] - s[1]) / len;
        const z0 = s[2] + (e[2] - s[2]) * t0, z1 = s[2] + (e[2] - s[2]) * t1;
        this.lineZ([r[0], r[1], z0], [r[2], r[3], z1], c, stipple);
        return;
      }
      const dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
      const steps = Math.max(dx, -dy) || 1;
      let err = dx + dy, n = 0;
      const off = this.depthOffset;
      for (;;) {
        if (x1 >= this.cx1 && x1 <= this.cx2 && y1 >= this.cy1 && y1 <= this.cy2 && (!stipple || ((stipple >> (n & 15)) & 1))) {
          const z = s[2] + (e[2] - s[2]) * (n / steps) - off;
          const i = (this.h - 1 - y1) * this.w + x1;
          if (z <= this.depth[i]) {
            this.buf[i] = c;
            if (this.depthWrite) this.depth[i] = z;
          }
        }
        n++;
        if (x1 === x2 && y1 === y2) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x1 += sx; }
        if (e2 <= dx) { err += dx; y1 += sy; }
      }
    }

    point3(p, c, size = 1) {
      const s = this.toScreen(p);
      if (!s) return;
      this.pointZ(s, c, size);
    }

    pointZ(s, c, size) {
      const x0 = Math.round(s[0] - (size - 1) / 2), y0 = Math.round(s[1] - (size - 1) / 2);
      for (let yy = y0; yy < y0 + size; yy++) {
        for (let xx = x0; xx < x0 + size; xx++) {
          if (xx < this.cx1 || xx > this.cx2 || yy < this.cy1 || yy > this.cy2) continue;
          const i = (this.h - 1 - yy) * this.w + xx;
          if (this.depthTest && s[2] - this.depthOffset * 2 > this.depth[i]) continue;
          this.buf[i] = c;
        }
      }
    }

    clipPoly(verts) {
      const near = 1e-4;
      let out = [];
      for (let i = 0; i < verts.length; i++) {
        const a = verts[i], b = verts[(i + 1) % verts.length];
        const ain = a.c[3] >= near, bin = b.c[3] >= near;
        if (ain) out.push(a);
        if (ain !== bin) {
          const t = (near - a.c[3]) / (b.c[3] - a.c[3]);
          const c = [0, 1, 2, 3].map(k => a.c[k] + (b.c[k] - a.c[k]) * t);
          const col = a.col && b.col ? a.col.map((v, k) => v + (b.col[k] - v) * t) : a.col;
          const uv = a.uv && b.uv ? a.uv.map((v, k) => v + (b.uv[k] - v) * t) : a.uv;
          out.push({ c, col, uv });
        }
      }
      return out;
    }

    polyClip(points, color, colors, uvs, shader) {
      const verts = points.map((p, i) => ({ c: B.M.proj(this.mvp, p), col: colors ? colors[i] : null, uv: uvs ? uvs[i] : null }));
      let vs = verts;
      if (verts.some(v => v.c[3] < 1e-4)) vs = this.clipPoly(verts);
      if (vs.length < 3) return;
      const sc = vs.map(v => { const s = this.clipToScreen(v.c); return { x: s[0], y: s[1], z: s[2], w: v.c[3], col: v.col, uv: v.uv }; });
      for (let k = 1; k < sc.length - 1; k++) this.triScreen(sc[0], sc[k], sc[k + 1], color, shader);
    }

    triScreen(a, b, c, color, shader) {
      const minX = Math.max(this.cx1, Math.floor(Math.min(a.x, b.x, c.x)));
      const maxX = Math.min(this.cx2, Math.ceil(Math.max(a.x, b.x, c.x)));
      const minY = Math.max(this.cy1, Math.floor(Math.min(a.y, b.y, c.y)));
      const maxY = Math.min(this.cy2, Math.ceil(Math.max(a.y, b.y, c.y)));
      if (minX > maxX || minY > maxY) return;
      const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (Math.abs(area) < 1e-9) return;
      const inv = 1 / area;
      const buf = this.buf, depth = this.depth, w = this.w, h = this.h;
      const test = this.depthTest, write = this.depthWrite;
      const gour = !!(a.col && b.col && c.col);
      const persp = !!shader;
      const iwa = 1 / a.w, iwb = 1 / b.w, iwc = 1 / c.w;
      for (let y = minY; y <= maxY; y++) {
        const py = y + 0.5;
        const row = (h - 1 - y) * w;
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5;
          let w0 = ((b.x - px) * (c.y - py) - (b.y - py) * (c.x - px)) * inv;
          let w1 = ((c.x - px) * (a.y - py) - (c.y - py) * (a.x - px)) * inv;
          let w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) {
            if (w0 < -1e-7 || w1 < -1e-7 || w2 < -1e-7) continue;
          }
          const z = w0 * a.z + w1 * b.z + w2 * c.z;
          const i = row + x;
          if (test && z > depth[i]) continue;
          let out = color;
          if (persp) {
            const q0 = w0 * iwa, q1 = w1 * iwb, q2 = w2 * iwc, qs = 1 / (q0 + q1 + q2);
            out = shader(q0 * qs, q1 * qs, q2 * qs, a, b, c, x, y);
            if (out === -1) continue;
          } else if (gour) {
            out = rgb(clampByte(w0 * a.col[0] + w1 * b.col[0] + w2 * c.col[0]), clampByte(w0 * a.col[1] + w1 * b.col[1] + w2 * c.col[1]), clampByte(w0 * a.col[2] + w1 * b.col[2] + w2 * c.col[2]));
          }
          buf[i] = out;
          if (write) depth[i] = z;
        }
      }
    }

    present(ctx) {
      if (!ctx) return;
      if (!this.image || this.image.width !== this.w || this.image.height !== this.h) {
        this.image = new ImageData(this.data, this.w, this.h);
      }
      ctx.putImageData(this.image, 0, 0);
    }
  }

  B.rgb = rgb;
  B.rgbf = rgbf;
  B.hex = hex;
  B.shade = shade;
  B.unpack = unpack;
  B.mix = mix;
  B.clampByte = clampByte;
  B.font = font;
  B.textWidth = textWidth;
  B.Raster = Raster;
})(globalThis.B204 = globalThis.B204 || {});
