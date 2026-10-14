(function (S) {
  'use strict';
  const { C } = S;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const dith = (x, y, t) => t > BAYER[((y & 3) << 2) | (x & 3)];

  class Buf {
    constructor(w, h, fill) {
      this.w = w; this.h = h;
      this.px = new Uint8Array(w * h);
      if (fill) this.px.fill(fill);
    }
    get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.px[y * this.w + x]; }
    set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c; }
    clone() { const b = new Buf(this.w, this.h); b.px.set(this.px); return b; }
  }

  class Mask {
    constructor(x0, y0, w, h) {
      this.x0 = x0; this.y0 = y0;
      this.w = Math.max(1, w); this.h = Math.max(1, h);
      this.m = new Uint8Array(this.w * this.h);
    }
    has(x, y) {
      x -= this.x0; y -= this.y0;
      return x >= 0 && y >= 0 && x < this.w && y < this.h && this.m[y * this.w + x] === 1;
    }
    put(x, y, v) {
      x -= this.x0; y -= this.y0;
      if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.m[y * this.w + x] = v;
    }
    each(fn) {
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.m[y * this.w + x]) fn(x + this.x0, y + this.y0);
    }
    count() { let n = 0; for (let i = 0; i < this.m.length; i++) n += this.m[i]; return n; }
    union(o) {
      const x0 = Math.min(this.x0, o.x0), y0 = Math.min(this.y0, o.y0);
      const x1 = Math.max(this.x0 + this.w, o.x0 + o.w), y1 = Math.max(this.y0 + this.h, o.y0 + o.h);
      const r = new Mask(x0, y0, x1 - x0, y1 - y0);
      this.each((x, y) => r.put(x, y, 1));
      o.each((x, y) => r.put(x, y, 1));
      return r;
    }
    minus(o) {
      const r = new Mask(this.x0, this.y0, this.w, this.h);
      this.each((x, y) => { if (!o.has(x, y)) r.put(x, y, 1); });
      return r;
    }
    and(o) {
      const r = new Mask(this.x0, this.y0, this.w, this.h);
      this.each((x, y) => { if (o.has(x, y)) r.put(x, y, 1); });
      return r;
    }
    shift(dx, dy) {
      const r = new Mask(this.x0 + dx, this.y0 + dy, this.w, this.h);
      r.m.set(this.m);
      return r;
    }
  }

  function ringsMask(rings) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of rings) for (let i = 0; i < r.length; i += 2) {
      if (r[i] < minX) minX = r[i]; if (r[i] > maxX) maxX = r[i];
      if (r[i + 1] < minY) minY = r[i + 1]; if (r[i + 1] > maxY) maxY = r[i + 1];
    }
    if (minX === Infinity) return new Mask(0, 0, 1, 1);
    const x0 = Math.floor(minX) - 1, y0 = Math.floor(minY) - 1;
    const x1 = Math.ceil(maxX) + 1, y1 = Math.ceil(maxY) + 1;
    const m = new Mask(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    const xs = [];
    for (let y = y0; y <= y1; y++) {
      const cy = y + 0.5;
      xs.length = 0;
      for (const r of rings) {
        const n = r.length >> 1;
        for (let i = 0, j = n - 1; i < n; j = i++) {
          const yi = r[i * 2 + 1], yj = r[j * 2 + 1];
          if ((yi > cy) !== (yj > cy)) {
            const xi = r[i * 2], xj = r[j * 2];
            xs.push(xi + (cy - yi) * (xj - xi) / (yj - yi));
          }
        }
      }
      if (xs.length < 2) continue;
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const a = Math.ceil(xs[k] - 0.5), b = Math.ceil(xs[k + 1] - 0.5) - 1;
        for (let x = a; x <= b; x++) m.put(x, y, 1);
      }
    }
    return m;
  }

  function ellipseMask(cx, cy, rx, ry, rot) {
    rx = Math.max(0.5, Math.abs(rx)); ry = Math.max(0.5, Math.abs(ry));
    const R = Math.max(rx, ry) + 1;
    const x0 = Math.floor(cx - R), y0 = Math.floor(cy - R);
    const w = Math.ceil(R * 2) + 2, h = w;
    const m = new Mask(x0, y0, w, h);
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    let any = false;
    for (let y = 0; y < h; y++) {
      const dy = y0 + y + 0.5 - cy;
      for (let x = 0; x < w; x++) {
        const dx = x0 + x + 0.5 - cx;
        const u = dx * c + dy * s, v = -dx * s + dy * c;
        if ((u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1) { m.m[y * w + x] = 1; any = true; }
      }
    }
    if (!any) m.put(Math.floor(cx), Math.floor(cy), 1);
    return m;
  }

  function flattenPath(d) {
    const tok = d.match(/[MLHVQCZmlhvqcz]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
    const rings = [];
    let cur = null, x = 0, y = 0, sx = 0, sy = 0, cmd = 'M', i = 0;
    const num = () => parseFloat(tok[i++]);
    while (i < tok.length) {
      if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
      const rel = cmd === cmd.toLowerCase();
      const C0 = cmd.toUpperCase();
      if (C0 === 'Z') {
        if (cur) { x = sx; y = sy; }
        cur = null;
        continue;
      }
      if (C0 === 'M') {
        x = (rel ? x : 0) + num(); y = (rel ? y : 0) + num();
        sx = x; sy = y;
        cur = [x, y]; rings.push(cur);
        cmd = rel ? 'l' : 'L';
      } else if (C0 === 'L') {
        x = (rel ? x : 0) + num(); y = (rel ? y : 0) + num();
        cur.push(x, y);
      } else if (C0 === 'H') {
        x = (rel ? x : 0) + num(); cur.push(x, y);
      } else if (C0 === 'V') {
        y = (rel ? y : 0) + num(); cur.push(x, y);
      } else if (C0 === 'Q') {
        const cx = (rel ? x : 0) + num(), cy = (rel ? y : 0) + num();
        const ex = (rel ? x : 0) + num(), ey = (rel ? y : 0) + num();
        const n = Math.max(3, Math.ceil((Math.hypot(cx - x, cy - y) + Math.hypot(ex - cx, ey - cy)) / 2));
        for (let k = 1; k <= n; k++) {
          const t = k / n, u = 1 - t;
          cur.push(u * u * x + 2 * u * t * cx + t * t * ex, u * u * y + 2 * u * t * cy + t * t * ey);
        }
        x = ex; y = ey;
      } else if (C0 === 'C') {
        const ax = (rel ? x : 0) + num(), ay = (rel ? y : 0) + num();
        const bx = (rel ? x : 0) + num(), by = (rel ? y : 0) + num();
        const ex = (rel ? x : 0) + num(), ey = (rel ? y : 0) + num();
        const n = Math.max(4, Math.ceil((Math.hypot(ax - x, ay - y) + Math.hypot(bx - ax, by - ay) + Math.hypot(ex - bx, ey - by)) / 2));
        for (let k = 1; k <= n; k++) {
          const t = k / n, u = 1 - t;
          cur.push(u * u * u * x + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * ex,
            u * u * u * y + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * ey);
        }
        x = ex; y = ey;
      } else {
        i++;
      }
    }
    return rings;
  }

  function capsulePts(x0, y0, x1, y1, r0, r1) {
    let dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 0.0001;
    dx /= len; dy /= len;
    const nx = -dy, ny = dx;
    const pts = [];
    const seg = 6;
    for (let k = 0; k <= seg; k++) {
      const a = -Math.PI / 2 + Math.PI * k / seg;
      const ca = Math.cos(a), sa = Math.sin(a);
      pts.push(x1 + (dx * ca - nx * sa) * r1, y1 + (dy * ca - ny * sa) * r1);
    }
    for (let k = 0; k <= seg; k++) {
      const a = Math.PI / 2 + Math.PI * k / seg;
      const ca = Math.cos(a), sa = Math.sin(a);
      pts.push(x0 + (dx * ca - nx * sa) * r0, y0 + (dy * ca - ny * sa) * r0);
    }
    return pts;
  }

  function fill(buf, m, c) { m.each((x, y) => buf.set(x, y, c)); }

  function fillFn(buf, m, fn) {
    m.each((x, y) => { const c = fn(x, y); if (c) buf.set(x, y, c); });
  }

  function edgeOf(m, x, y) {
    return !m.has(x - 1, y) || !m.has(x + 1, y) || !m.has(x, y - 1) || !m.has(x, y + 1);
  }

  function part(buf, m, ramp, o) {
    o = o || {};
    if (typeof ramp === 'number') ramp = [ramp, ramp, ramp, ramp, ramp];
    const b = o.b !== undefined ? o.b : 2;
    const base = ramp[Math.min(b, ramp.length - 1)];
    const sh = ramp[Math.max(0, b - 1)];
    const deep = ramp[Math.max(0, b - 2)];
    const hi = ramp[Math.min(ramp.length - 1, b + 1)];
    const sd = o.sh === undefined ? 2 : o.sh;
    const hd = o.hi === undefined ? 1 : o.hi;
    const lx = o.lx === undefined ? -1 : o.lx, ly = o.ly === undefined ? -1 : o.ly;
    const ol = o.ol === undefined ? C.black : o.ol;
    const deepOn = o.deep !== false;
    m.each((x, y) => {
      let c = base;
      if (o.grad) {
        const t = o.grad(x, y);
        const f = Math.max(0, Math.min(ramp.length - 1.001, t * (ramp.length - 1)));
        const i = Math.floor(f);
        c = dith(x, y, f - i) ? ramp[i + 1] : ramp[i];
      }
      if (sd > 0 && !m.has(x - lx * sd, y - ly * sd)) c = sh;
      if (deepOn && sd > 1 && !m.has(x - lx, y - ly)) c = deep;
      if (hd > 0 && !m.has(x + lx * hd, y + ly * hd) && m.has(x - lx * sd, y - ly * sd)) c = hi;
      if (ol && edgeOf(m, x, y)) c = ol;
      buf.set(x, y, c);
    });
  }

  function outline(buf, m, c) {
    m.each((x, y) => { if (edgeOf(m, x, y)) buf.set(x, y, c === undefined ? C.black : c); });
  }

  function outerLine(buf, m, c) {
    const col = c === undefined ? C.black : c;
    m.each((x, y) => {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!m.has(x + dx, y + dy)) buf.set(x + dx, y + dy, col);
    });
  }

  function shade(buf, m, t, fnT) {
    const DARKER = S.pal.DARKER;
    m.each((x, y) => {
      const tt = fnT ? fnT(x, y) : t;
      if (tt <= 0) return;
      const i = y * buf.w + x;
      if (x < 0 || y < 0 || x >= buf.w || y >= buf.h) return;
      let c = buf.px[i];
      if (!c) return;
      let k = tt;
      while (k >= 1) { c = DARKER[c]; k -= 1; }
      if (k > 0 && dith(x, y, k)) c = DARKER[c];
      buf.px[i] = c;
    });
  }

  function light(buf, m, t, fnT) {
    const LIGHTER = S.pal.LIGHTER;
    m.each((x, y) => {
      const tt = fnT ? fnT(x, y) : t;
      if (tt <= 0) return;
      if (x < 0 || y < 0 || x >= buf.w || y >= buf.h) return;
      const i = y * buf.w + x;
      let c = buf.px[i];
      if (!c || c === C.black) return;
      let k = tt;
      while (k >= 1) { c = LIGHTER[c]; k -= 1; }
      if (k > 0 && dith(x, y, k)) c = LIGHTER[c];
      buf.px[i] = c;
    });
  }

  function grad(buf, m, ramp, fn) {
    m.each((x, y) => {
      const t = fn(x, y);
      const f = Math.max(0, Math.min(ramp.length - 1.001, t * (ramp.length - 1)));
      const i = Math.floor(f);
      buf.set(x, y, dith(x, y, f - i) ? ramp[i + 1] : ramp[i]);
    });
  }

  function line(buf, x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let guard = 0; guard < 4000; guard++) {
      buf.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  function dotLine(buf, x0, y0, x1, y1, c, gap) {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
    for (let k = 0; k <= n; k += gap) buf.set(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), c);
  }

  function blit(dst, src, dx, dy, flip, solid) {
    dx = Math.round(dx); dy = Math.round(dy);
    const w = src.w, h = src.h;
    for (let y = 0; y < h; y++) {
      const ty = dy + y;
      if (ty < 0 || ty >= dst.h) continue;
      const row = y * w, trow = ty * dst.w;
      for (let x = 0; x < w; x++) {
        const c = src.px[row + (flip ? w - 1 - x : x)];
        if (!c) continue;
        const tx = dx + x;
        if (tx < 0 || tx >= dst.w) continue;
        dst.px[trow + tx] = solid || c;
      }
    }
  }

  function crop(buf) {
    let x0 = buf.w, y0 = buf.h, x1 = -1, y1 = -1;
    for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) {
      if (buf.px[y * buf.w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return { buf: new Buf(1, 1), x: 0, y: 0 };
    const out = new Buf(x1 - x0 + 1, y1 - y0 + 1);
    for (let y = y0; y <= y1; y++) out.px.set(buf.px.subarray(y * buf.w + x0, y * buf.w + x1 + 1), (y - y0) * out.w);
    return { buf: out, x: x0, y: y0 };
  }

  function scaleBuf(src, s) {
    const w = Math.max(1, Math.round(src.w * s)), h = Math.max(1, Math.round(src.h * s));
    const out = new Buf(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      out.px[y * w + x] = src.px[Math.min(src.h - 1, Math.floor(y / s)) * src.w + Math.min(src.w - 1, Math.floor(x / s))];
    }
    return out;
  }

  class Pen {
    constructor(buf) { this.b = buf; this.ox = 0; this.oy = 0; this.sx = 1; this.sy = 1; }
    at(ox, oy, s, flip) {
      s = s || 1;
      this.ox = ox; this.oy = oy; this.sx = flip ? -s : s; this.sy = s;
      return this;
    }
    scaled(cx, cy, k) {
      const q = new Pen(this.b);
      q.ox = this.X(cx) - cx * this.sx * k; q.oy = this.Y(cy) - cy * this.sy * k;
      q.sx = this.sx * k; q.sy = this.sy * k;
      return q;
    }
    X(x) { return this.ox + x * this.sx; }
    Y(y) { return this.oy + y * this.sy; }
    tr(pts) {
      const r = new Array(pts.length);
      for (let i = 0; i < pts.length; i += 2) { r[i] = this.X(pts[i]); r[i + 1] = this.Y(pts[i + 1]); }
      return r;
    }
    poly(pts) { return ringsMask([this.tr(pts)]); }
    polys(list) { return ringsMask(list.map(p => this.tr(p))); }
    path(d) { return ringsMask(flattenPath(d).map(r => this.tr(r))); }
    ell(cx, cy, rx, ry, rot) {
      const s = Math.abs(this.sx);
      return ellipseMask(this.X(cx), this.Y(cy), rx * s, ry * s, (rot || 0) * Math.sign(this.sx));
    }
    rect(x, y, w, h) { return this.poly([x, y, x + w, y, x + w, y + h, x, y + h]); }
    cap(x0, y0, x1, y1, r0, r1) { return ringsMask([this.tr(capsulePts(x0, y0, x1, y1, r0, r1 === undefined ? r0 : r1))]); }
    part(m, ramp, o) { part(this.b, m, ramp, o); return m; }
    fill(m, c) { fill(this.b, m, c); return m; }
    line(x0, y0, x1, y1, c) { line(this.b, this.X(x0), this.Y(y0), this.X(x1), this.Y(y1), c === undefined ? C.black : c); }
    px(x, y, c) { this.b.set(Math.round(this.X(x)), Math.round(this.Y(y)), c); }
    curve(d, c) {
      for (const r of flattenPath(d)) {
        const t = this.tr(r);
        for (let i = 2; i < t.length; i += 2) line(this.b, t[i - 2], t[i - 1], t[i], t[i + 1], c === undefined ? C.black : c);
      }
    }
  }

  Object.assign(S, { Buf, Mask, Pen, BAYER, dith, ringsMask, ellipseMask, flattenPath, capsulePts, fill, fillFn, part, outline, outerLine, shade, light, grad, line, dotLine, blit, crop, scaleBuf });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
