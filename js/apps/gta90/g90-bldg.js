(function (G) {
  'use strict';
  const { hash2, clamp } = G;

  const STY = {
    w: { walls: ['#7a5a3e', '#8a6a48', '#6a5640', '#9a8a6c', '#5e6e7e', '#7e8a6a', '#8a7058'], trim: '#e8e0cc', win: '#262a30', bay: 2.7, ww: 0.42, wh: 0.55, roof: ['#5a5a5e', '#6a4038', '#4a5a48', '#7a7a76', '#585048'], planks: true },
    o: { walls: ['#d8b878', '#d89484', '#a8c8a0', '#e6dcc8', '#c4a8cc', '#e0c890', '#9ab8c8', '#d8a070', '#c8b8a0', '#b8c8b0'], trim: '#f2ece0', win: '#283038', bay: 3.3, ww: 0.42, wh: 0.62, roof: ['#4a7a5a', '#8a4a3a', '#6a6a70', '#3a6a6a', '#7a5a4a', '#5a7a8a', '#9a9aa0'] },
    c: { walls: ['#cfcbc2', '#bdb9b0', '#d8d2c4', '#b8b0a2', '#c6beb0'], trim: '#e0dcd2', win: '#26303a', bay: 3.0, ww: 0.82, wh: 0.44, ribbon: true, roof: ['#55575a', '#4c4e52'] },
    s: { walls: ['#d8c090', '#e2cea2', '#c8a878', '#d6b890', '#d8b0a0', '#c4b49a', '#e0c8a8'], trim: '#efe6d0', win: '#283038', bay: 3.2, ww: 0.44, wh: 0.6, cornice: true, roof: ['#6a5a50', '#5a5a5a', '#7a4a3a', '#4a6a5a', '#6a6a6e'] },
    k: { walls: ['#c8c8c0', '#bcbcb4', '#e0dcd0', '#b87458', '#d0ccc0', '#a86850', '#c4c0b4'], trim: '#e4e0d8', win: '#263038', bay: 3.0, ww: 0.5, wh: 0.55, balcony: 0.3, roof: ['#4a4a4c', '#545456', '#505050'] },
    p: { walls: ['#d8dcd8', '#cfd4d4', '#e2e2dc', '#d6d2c8', '#c8ccc8'], trim: '#f0f0ea', win: '#24303a', bay: 3.0, ww: 0.5, wh: 0.55, balcony: 0.55, panels: true, roof: ['#4a4a4c', '#545456', '#505052'] },
    q: { walls: ['#c8ccd0', '#d4d0c6', '#b4bcc4', '#e0dcd4', '#c0c4c4'], trim: '#e8e8e4', win: '#344a60', bay: 3.0, ww: 0.86, wh: 0.55, ribbon: true, roof: ['#4e5054', '#56585a'] },
    i: { walls: ['#9a5040', '#8a8a88', '#a86a50', '#7a7a76', '#8a6a58'], trim: '#a0a09a', win: '#3e4e58', bay: 4.5, ww: 0.62, wh: 0.5, roof: ['#5a5a5c', '#6a6a6a', '#4e4e50'] },
    g: { walls: ['#8a8a84', '#7a7a76', '#6a7a8a', '#8a7a68', '#7a6a5a'], trim: '#9a9a94', win: null, bay: 3, roof: ['#5a5a5a', '#4a4a4c', '#6a5a4a', '#5c4a3c'] },
    r: { walls: ['#efeae0', '#e8e0d0', '#f0e8d8'], trim: '#ffffff', win: '#3a4048', bay: 4, ww: 0.32, wh: 0.7, roof: ['#4a7a5a', '#3a6a8a', '#7a8a9a'] }
  };
  const SIGNS = ['ГАСТРОНОМ', 'ПРОДУКТЫ', 'ХЛЕБ', 'МОЛОКО', 'ОВОЩИ', 'ГАЛАНТЕРЕЯ', 'ТКАНИ', 'ОБУВЬ', 'КНИГИ', 'АПТЕКА', 'ПАРИКМАХЕРСКАЯ', 'КАФЕ', 'СТОЛОВАЯ', 'ПЕЛЬМЕННАЯ', 'ЧАСЫ', 'ФОТО', 'СБЕРКАССА', 'УНИВЕРМАГ', 'ДЕТСКИЙ МИР', 'МЕЛОДИЯ', 'СПОРТТОВАРЫ', 'ЮВЕЛИРТОРГ', 'ОПТИКА', 'ВИНО', 'СОКИ-ВОДЫ', 'ПИВО', 'РЕМОНТ ОБУВИ', 'ХОЗТОВАРЫ', 'ВИДЕОСАЛОН', 'КООПЕРАТИВ', 'УРАЛЬСКИЕ САМОЦВЕТЫ', 'ПОЧТА', 'ТЕЛЕГРАФ', 'МЯСО', 'РЫБА', 'КУЛИНАРИЯ', 'ПОДАРКИ', 'ТАБАК'];
  const SIGN_COLORS = ['#b02020', '#1e4aa0', '#1e7a3a', '#c08020', '#6a2a8a', '#202020'];
  const SUN = [-0.55, 0.62];
  const SUN_L = Math.hypot(SUN[0], SUN[1]);
  const CAST = [0.42, -0.5];
  const FLAT = {
    p: ['#7c7872', '#6f6b66', '#86847f', '#949699', '#706a62'],
    k: ['#6f6a63', '#7b756d', '#635f59', '#8e9092', '#75706a'],
    q: ['#8c8e90', '#7c7e80', '#6f7173', '#989a9a'],
    c: ['#6f6a63', '#7b756d', '#86837c'],
    s: ['#6f6a63', '#7b756d', '#635f59', '#857f76'],
    o: ['#6f6a63', '#7b756d', '#635f59'],
    i: ['#7e8084', '#717377', '#8a8a86', '#6a6a66'],
    g: ['#4f4c49', '#5a5653', '#46423f', '#6a5444'],
    w: ['#5f5b56'],
    r: ['#7b756d']
  };
  const PARAPET = { p: '#cfcdc6', q: '#d4d4d0', k: '#aaa69e', c: '#b4b0a6', i: '#a2a09a', g: '#7a7672' };
  const ANTENNA_DIR = [Math.cos(-2.2), Math.sin(-2.2)];

  function makeCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  }
  function shadeHex(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
    const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
    const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  function mainAxis(b) {
    const r = b.rings[0];
    let best = 0, ux = 1, uy = 0;
    for (let i = 0, n = r.length, j = n - 2; i < n; j = i, i += 2) {
      const dx = r[i] - r[j], dy = r[i + 1] - r[j + 1], l = Math.hypot(dx, dy);
      if (l > best) { best = l; ux = dx / l; uy = dy / l; }
    }
    return [ux, uy];
  }
  function rgbOf(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  function clipRingRect(r, x0, y0, x1, y1) {
    let out = [];
    for (let i = 0; i < r.length; i += 2) out.push(r[i], r[i + 1]);
    const pass = (inside, cut) => {
      const src = out; out = [];
      const n = src.length / 2;
      for (let i = 0; i < n; i++) {
        const cx = src[i * 2], cy = src[i * 2 + 1], j = (i - 1 + n) % n, px = src[j * 2], py = src[j * 2 + 1];
        const ci = inside(cx, cy), pi = inside(px, py);
        if (ci) { if (!pi) out.push(...cut(px, py, cx, cy)); out.push(cx, cy); }
        else if (pi) out.push(...cut(px, py, cx, cy));
      }
    };
    pass((x) => x >= x0, (ax, ay, bx, by) => [x0, ay + (by - ay) * (x0 - ax) / (bx - ax)]);
    if (out.length) pass((x) => x <= x1, (ax, ay, bx, by) => [x1, ay + (by - ay) * (x1 - ax) / (bx - ax)]);
    if (out.length) pass((x, y) => y >= y0, (ax, ay, bx, by) => [ax + (bx - ax) * (y0 - ay) / (by - ay), y0]);
    if (out.length) pass((x, y) => y <= y1, (ax, ay, bx, by) => [ax + (bx - ax) * (y1 - ay) / (by - ay), y1]);
    return out.length >= 6 ? new Float32Array(out) : null;
  }
  function clipSeg(ax, ay, bx, by, x0, y0, x1, y1) {
    let t0 = 0, t1 = 1;
    const dx = bx - ax, dy = by - ay;
    for (const [p, q] of [[-dx, ax - x0], [dx, x1 - ax], [-dy, ay - y0], [dy, y1 - ay]]) {
      if (p === 0) { if (q < 0) return null; continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
      else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
    if (t1 - t0 < 1e-4) return null;
    return [t0, t1];
  }

  const PIECE = 64, CELL = 256;

  const Bldg = {
    bldgInit() {
      if (this.pieceCache) return;
      this.pieceCache = new Map();
      this.roofCache = new Map();
      this.look = new Map();
    },

    lookOf(b) {
      let L = this.look.get(b.id);
      if (L) return L;
      const st = STY[b.style] || STY.o;
      const h1 = b.seed, h2 = hash2(b.id, 7, 9), h3 = hash2(b.id, 11, 13);
      const wall = b.kind === 'tvtower' ? '#b4b0a6' : b.wall && /^#[0-9a-f]{6}$/i.test(b.wall) ? b.wall : st.walls[Math.floor(h1 * st.walls.length)];
      const edges = b.rings.reduce((t, r) => t + r.length / 2, 0);
      const pitched = (b.roof === 'h' || b.roof === 'g' || b.roof === 'p') && b.area < 9000 && edges <= 90 && !b.kind;
      const pal = FLAT[b.style] || FLAT.o;
      const custom = b.roofC && /^#[0-9a-f]{6}$/i.test(b.roofC) ? b.roofC : null;
      const roof = custom || (pitched ? st.roof[Math.floor(h2 * st.roof.length)] : pal[Math.floor(h2 * pal.length)]);
      const parapet = PARAPET[b.style] || shadeHex(wall, 1.04);
      L = { st, wall, roof, parapet, pitched, trim: st.trim, win: st.win, bay: st.bay * this.city.M, zt: Math.min(b.lv * this.FLOOR, b.kind === 'tvtower' ? 2000 : 900), shop: b.style !== 'w' && b.style !== 'g' && b.style !== 'i' && b.style !== 'r', h3, axis: mainAxis(b), noRoof: b.kind === 'tvtower' };
      this.look.set(b.id, L);
      return L;
    },

    innerCircle(b) {
      const L = this.lookOf(b);
      if (L.ic) return L.ic;
      const M = this.city.M, bb = b.bb;
      let best = [b.cx, b.cy, 0];
      const scan = (x0, y0, x1, y1, step) => {
        for (let y = y0; y <= y1; y += step) for (let x = x0; x <= x1; x += step) {
          if (!G.inRings(x, y, b.rings)) continue;
          let d = Infinity;
          for (const r of b.rings) for (let i = 0, n = r.length, j = n - 2; i < n; j = i, i += 2) d = Math.min(d, G.segDist(x, y, r[j], r[j + 1], r[i], r[i + 1]));
          if (d > best[2]) best = [x, y, d];
        }
      };
      const step = Math.max(M, Math.max(bb[2] - bb[0], bb[3] - bb[1]) / 40);
      scan(bb[0], bb[1], bb[2], bb[3], step);
      scan(best[0] - step, best[1] - step, best[0] + step, best[1] + step, step / 6);
      L.ic = best;
      return best;
    },

    piecesFor(cx, cy) {
      const key = cx + ',' + cy;
      let list = this.pieceCache.get(key);
      if (list) { this.pieceCache.delete(key); this.pieceCache.set(key, list); return list; }
      list = [];
      const city = this.city;
      const ids = city.bChunks.get(key) || [];
      const X0 = cx * CELL, Y0 = cy * CELL;
      for (const id of ids) {
        const b = city.buildings[id];
        const L = this.lookOf(b);
        const sx0 = Math.max(X0, Math.floor(b.bb[0] / PIECE) * PIECE), sy0 = Math.max(Y0, Math.floor(b.bb[1] / PIECE) * PIECE);
        const sx1 = Math.min(X0 + CELL, b.bb[2]), sy1 = Math.min(Y0 + CELL, b.bb[3]);
        for (let py = sy0; py < sy1; py += PIECE) for (let px = sx0; px < sx1; px += PIECE) {
          const x0 = px, y0 = py, x1 = px + PIECE, y1 = py + PIECE;
          const rings = [];
          for (const r of b.rings) { const c = clipRingRect(r, x0, y0, x1, y1); if (c) rings.push(c); }
          if (!rings.length) continue;
          const walls = [];
          for (const r of b.rings) {
            const n = r.length;
            for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
              const ax = r[j], ay = r[j + 1], bx = r[i], by = r[i + 1];
              const t = clipSeg(ax, ay, bx, by, x0, y0, x1, y1);
              if (!t) continue;
              const ex = bx - ax, ey = by - ay, el = Math.hypot(ex, ey) || 1;
              const nx = ey / el, ny = -ex / el;
              const qx = ax + ex * t[0], qy = ay + ey * t[0], rx = ax + ex * t[1], ry = ay + ey * t[1];
              const mx = (qx + rx) / 2, my = (qy + ry) / 2;
              const nb = city.buildingAt(mx + nx * 5, my + ny * 5);
              const hn = nb && nb !== b ? Math.min(this.lookOf(nb).zt, L.zt) : 0;
              if (hn >= L.zt - 0.5) continue;
              let shop = false;
              if (L.shop && !hn) { const g = city.surfAt(mx + nx * 14, my + ny * 14); shop = g === G.GR.WALK || g === G.GR.PLAZA; }
              walls.push({ ax: qx, ay: qy, bx: rx, by: ry, nx, ny, hn, u0: el * t[0], el, shop, light: 0.74 + 0.26 * Math.max(0, (nx * SUN[0] + ny * SUN[1]) / SUN_L) });
            }
          }
          let cxp = 0, cyp = 0, k = 0;
          for (const r of rings) for (let i = 0; i < r.length; i += 2) { cxp += r[i]; cyp += r[i + 1]; k++; }
          list.push({ b, L, rings, walls, cx: cxp / k, cy: cyp / k });
        }
      }
      this.pieceCache.set(key, list);
      if (this.pieceCache.size > 260) this.pieceCache.delete(this.pieceCache.keys().next().value);
      return list;
    },

    roofTex(b, L) {
      let t = this.roofCache.get(b.id);
      if (t) { this.roofCache.delete(b.id); this.roofCache.set(b.id, t); return t; }
      const bb = b.bb;
      const bw = bb[2] - bb[0], bh = bb[3] - bb[1];
      const RS = Math.min(0.5, 320 / Math.max(bw, bh, 1));
      const w = Math.max(2, Math.ceil(bw * RS) + 2), h = Math.max(2, Math.ceil(bh * RS) + 2);
      const cv = makeCanvas(w, h);
      const x = cv.getContext('2d');
      x.setTransform(RS, 0, 0, RS, (-bb[0] + 1 / RS) * RS, (-bb[1] + 1 / RS) * RS);
      const path = () => { x.beginPath(); for (const r of b.rings) { x.moveTo(r[0], r[1]); for (let i = 2; i < r.length; i += 2) x.lineTo(r[i], r[i + 1]); x.closePath(); } };
      path();
      x.fillStyle = L.roof; x.fill('evenodd');
      if (L.pitched) this.roofFacets(x, cv, b, L, RS, w, h);
      x.save(); path(); x.clip('evenodd');
      if (this.pat && this.pat.noise) { x.fillStyle = this.pat.noise; x.fillRect(bb[0] - 4, bb[1] - 4, bw + 8, bh + 8); }
      if (L.pitched) this.pitchedDetails(x, b, L, RS, path);
      else this.flatDetails(x, b, L, RS, path);
      x.restore();
      t = { cv, RS, ox: bb[0] - 1 / RS, oy: bb[1] - 1 / RS, w, h };
      this.roofCache.set(b.id, t);
      if (this.roofCache.size > 420) this.roofCache.delete(this.roofCache.keys().next().value);
      return t;
    },

    roofFacets(x, cv, b, L, RS, w, h) {
      const edges = [];
      let maxLen = 0;
      for (const r of b.rings) for (let i = 0, n = r.length, j = n - 2; i < n; j = i, i += 2) {
        const ax = r[j], ay = r[j + 1], bx = r[i], by = r[i + 1];
        const len = Math.hypot(bx - ax, by - ay);
        if (len < 0.5) continue;
        maxLen = Math.max(maxLen, len);
        edges.push([ax, ay, bx, by, len, (by - ay) / len, -(bx - ax) / len]);
      }
      const use = b.roof === 'g' ? edges.filter(e => e[4] >= maxLen * 0.55) : edges;
      if (!use.length) return;
      const img = x.getImageData(0, 0, w, h);
      const d = img.data;
      const base = rgbOf(L.roof);
      const idx = new Int16Array(w * h).fill(-1);
      const bb = b.bb;
      const cap = 7.5 * this.city.M;
      for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
        const o = (py * w + px) * 4;
        if (d[o + 3] < 8) continue;
        const X = bb[0] - 1 / RS + (px + 0.5) / RS, Y = bb[1] - 1 / RS + (py + 0.5) / RS;
        let best = Infinity, bi = -1;
        for (let k = 0; k < use.length; k++) {
          const e = use[k];
          const dist = b.roof === 'g' ? Math.abs((X - e[0]) * e[5] + (Y - e[1]) * e[6]) : G.segDist(X, Y, e[0], e[1], e[2], e[3]);
          if (dist < best) { best = dist; bi = k; }
        }
        if (best > cap) {
          idx[py * w + px] = 32000;
          d[o] = clamp(base[0] * 0.9, 0, 255); d[o + 1] = clamp(base[1] * 0.9, 0, 255); d[o + 2] = clamp(base[2] * 0.9, 0, 255);
          continue;
        }
        idx[py * w + px] = bi;
        const e = use[bi];
        const lit = 0.8 + 0.42 * ((e[5] * SUN[0] + e[6] * SUN[1]) / SUN_L);
        d[o] = clamp(base[0] * lit, 0, 255); d[o + 1] = clamp(base[1] * lit, 0, 255); d[o + 2] = clamp(base[2] * lit, 0, 255);
      }
      for (let py = 1; py < h; py++) for (let px = 1; px < w; px++) {
        const i = py * w + px;
        if (idx[i] < 0) continue;
        if ((idx[i - 1] >= 0 && idx[i - 1] !== idx[i]) || (idx[i - w] >= 0 && idx[i - w] !== idx[i])) {
          const o = i * 4;
          d[o] = clamp(d[o] * 1.25 + 12, 0, 255); d[o + 1] = clamp(d[o + 1] * 1.25 + 12, 0, 255); d[o + 2] = clamp(d[o + 2] * 1.25 + 12, 0, 255);
        }
      }
      x.save();
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.putImageData(img, 0, 0);
      x.restore();
    },

    flatDetails(x, b, L, RS, path) {
      const M = this.city.M;
      const [ux, uy] = L.axis, vx = -uy, vy = ux;
      let s0 = Infinity, s1 = -Infinity, t0 = Infinity, t1 = -Infinity;
      for (const r of b.rings) for (let i = 0; i < r.length; i += 2) {
        const dx = r[i] - b.cx, dy = r[i + 1] - b.cy;
        const s = dx * ux + dy * uy, t = dx * vx + dy * vy;
        if (s < s0) s0 = s; if (s > s1) s1 = s; if (t < t0) t0 = t; if (t > t1) t1 = t;
      }
      const P = (s, t) => [b.cx + ux * s + vx * t, b.cy + uy * s + vy * t];
      const inside = (s, t) => { const q = P(s, t); return G.inRings(q[0], q[1], b.rings); };
      const quad = (s, t, hs, ht) => { const a = P(s - hs, t - ht), c = P(s + hs, t - ht), e = P(s + hs, t + ht), f = P(s - hs, t + ht); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); x.lineTo(e[0], e[1]); x.lineTo(f[0], f[1]); x.closePath(); };
      const rnd = k => hash2(b.id, k, 61);
      const garage = b.style === 'g';
      x.lineCap = 'butt';
      x.strokeStyle = garage ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.07)';
      x.lineWidth = 0.25 * M;
      x.beginPath();
      if (garage) for (let s = s0 + 0.5 * M; s < s1; s += 0.6 * M) { const a = P(s, t0), c = P(s, t1); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); }
      else for (let t = t0 + 0.9 * M; t < t1; t += 0.95 * M) { const a = P(s0, t), c = P(s1, t); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); }
      x.stroke();
      const np = Math.min(14, 2 + Math.floor(b.area / 160));
      for (let k = 0; k < np; k++) {
        const s = s0 + rnd(k * 7) * (s1 - s0), t = t0 + rnd(k * 7 + 1) * (t1 - t0);
        if (!inside(s, t)) continue;
        x.fillStyle = rnd(k * 7 + 2) < 0.6 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,240,0.07)';
        x.beginPath(); quad(s, t, (1 + rnd(k * 7 + 3) * 2.5) * M, (0.5 + rnd(k * 7 + 4) * 1.2) * M); x.fill();
      }
      for (let k = 0; k < Math.min(4, 1 + Math.floor(b.area / 500)); k++) {
        const s = s0 + rnd(k * 5 + 200) * (s1 - s0), t = t0 + rnd(k * 5 + 201) * (t1 - t0);
        if (!inside(s, t)) continue;
        const q = P(s, t);
        x.fillStyle = 'rgba(24,24,26,0.13)';
        x.beginPath(); x.ellipse(q[0], q[1], (1.5 + rnd(k * 5 + 202) * 3) * M, (1 + rnd(k * 5 + 203) * 1.6) * M, Math.atan2(uy, ux), 0, Math.PI * 2); x.fill();
      }
      if (b.style === 'i' && b.area > 500) this.skylights(x, b, P, inside, quad, s0, s1, t0, t1);
      else if (!garage && b.lv >= 3) this.roofKit(x, b, L, P, inside, quad, s0, s1, t0, t1);
      x.lineJoin = 'miter';
      x.strokeStyle = 'rgba(0,0,0,0.2)'; x.lineWidth = 2.6 * M; path(); x.stroke();
      x.strokeStyle = L.parapet; x.lineWidth = (garage ? 0.5 : 1.0) * M; path(); x.stroke();
      x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 0.3 * M; x.save(); x.translate(-CAST[0] * 0.25 * M, -CAST[1] * 0.25 * M); path(); x.restore(); x.stroke();
    },

    roofKit(x, b, L, P, inside, quad, s0, s1, t0, t1) {
      const M = this.city.M;
      const tc = (t0 + t1) / 2, span = s1 - s0, depth = t1 - t0;
      const sec = 17 * M;
      const n = Math.max(1, Math.round(span / sec));
      const box = (s, t, hs, ht, hgt, top, side) => {
        if (!inside(s - hs, t - ht) || !inside(s + hs, t + ht) || !inside(s - hs, t + ht) || !inside(s + hs, t - ht)) return false;
        x.save(); x.translate(CAST[0] * hgt, CAST[1] * hgt); x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); quad(s, t, hs, ht); x.fill(); x.restore();
        x.fillStyle = side; x.beginPath(); quad(s, t, hs, ht); x.fill();
        x.fillStyle = top; x.beginPath(); quad(s - hs * 0.06, t - ht * 0.1, hs * 0.94, ht * 0.86); x.fill();
        return true;
      };
      const brick = /^#(b8|a8)/.test(L.wall) || b.style === 's' || b.style === 'o' || b.style === 'c';
      const ventTop = brick ? shadeHex(L.wall, 0.95) : '#b9b5ac', ventSide = brick ? shadeHex(L.wall, 0.7) : '#8e8a82';
      const res = b.style === 'p' || b.style === 'k' || b.style === 's' || b.style === 'c';
      for (let k = 0; k < n; k++) {
        const s = s0 + (k + 0.5) * span / n;
        if (depth > 6 * M) {
          if (b.lv >= 9) box(s, tc, 2.6 * M, 1.9 * M, 3.2 * M, shadeHex(L.parapet, 0.92), shadeHex(L.parapet, 0.7));
          else box(s, tc, 1.2 * M, 1.0 * M, 1.8 * M, '#8a8680', '#6a6660');
          box(s - 5 * M, tc + 1.4 * M, 0.75 * M, 0.45 * M, 1.4 * M, ventTop, ventSide);
          box(s + 5 * M, tc - 1.4 * M, 0.75 * M, 0.45 * M, 1.4 * M, ventTop, ventSide);
        }
        if (!res && b.lv < 9) continue;
        const na = 1 + Math.floor(hash2(b.id, k, 71) * 3);
        for (let a = 0; a < na; a++) {
          const as = s + (hash2(b.id, k * 5 + a, 72) - 0.5) * span / n * 0.8, at = tc + (hash2(b.id, k * 5 + a, 73) - 0.5) * depth * 0.6;
          if (!inside(as, at)) continue;
          this.antenna(x, P(as, at), (2.6 + hash2(b.id, k * 5 + a, 74) * 1.6) * M);
        }
      }
    },

    antenna(x, q, len) {
      const M = this.city.M;
      const dx = ANTENNA_DIR[0], dy = ANTENNA_DIR[1], px = -dy, py = dx;
      const draw = (ox, oy) => {
        x.beginPath();
        x.moveTo(q[0] + ox - dx * len * 0.5, q[1] + oy - dy * len * 0.5); x.lineTo(q[0] + ox + dx * len * 0.5, q[1] + oy + dy * len * 0.5);
        const n = Math.max(3, Math.round(len / (0.55 * M)));
        for (let i = 0; i <= n; i++) {
          const f = i / n - 0.5, e = (0.9 - 0.35 * (i / n)) * M;
          const cx = q[0] + ox + dx * len * f, cy = q[1] + oy + dy * len * f;
          x.moveTo(cx - px * e, cy - py * e); x.lineTo(cx + px * e, cy + py * e);
        }
        x.stroke();
      };
      x.lineWidth = 0.16 * M;
      x.strokeStyle = 'rgba(0,0,0,0.22)'; draw(CAST[0] * 2.2 * M, CAST[1] * 2.2 * M);
      x.strokeStyle = 'rgba(28,30,32,0.85)'; draw(0, 0);
      x.fillStyle = '#2a2a2c'; x.beginPath(); x.arc(q[0], q[1], 0.22 * M, 0, Math.PI * 2); x.fill();
    },

    skylights(x, b, P, inside, quad, s0, s1, t0, t1) {
      const M = this.city.M;
      for (let t = t0 + 4 * M; t < t1 - 3 * M; t += 7 * M) {
        let a = null;
        for (let s = s0 + 2 * M; s <= s1 - 2 * M; s += M) {
          const ok = inside(s, t - 1 * M) && inside(s, t + 1 * M);
          if (ok && a === null) a = s;
          if ((!ok || s + M > s1 - 2 * M) && a !== null) {
            const e = ok ? s : s - M;
            if (e - a > 3 * M) {
              const m = (a + e) / 2, hs = (e - a) / 2;
              x.save(); x.translate(CAST[0] * 0.8 * M, CAST[1] * 0.8 * M); x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); quad(m, t, hs, 0.9 * M); x.fill(); x.restore();
              x.fillStyle = '#9aa8ae'; x.beginPath(); quad(m, t, hs, 0.9 * M); x.fill();
              x.fillStyle = 'rgba(255,255,255,0.22)'; x.beginPath(); quad(m, t - 0.45 * M, hs, 0.42 * M); x.fill();
              x.strokeStyle = 'rgba(40,44,46,0.55)'; x.lineWidth = 0.18 * M; x.beginPath();
              for (let u = a + 1.2 * M; u < e; u += 1.2 * M) { const p0 = P(u, t - 0.9 * M), p1 = P(u, t + 0.9 * M); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); }
              x.stroke();
            }
            a = null;
          }
        }
      }
    },

    pitchedDetails(x, b, L, RS, path) {
      const M = this.city.M, bb = b.bb, bw = bb[2] - bb[0], bh = bb[3] - bb[1];
      x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 0.35 * M; path(); x.stroke();
      if (b.area < 40) return;
      const n = Math.max(1, Math.min(6, Math.round(b.area / (b.style === 'w' ? 90 : 180))));
      for (let k = 0; k < n; k++) {
        const px = bb[0] + (0.25 + hash2(b.id, k, 31) * 0.5) * bw, py = bb[1] + (0.25 + hash2(b.id, k, 32) * 0.5) * bh;
        if (!G.inRings(px, py, b.rings)) continue;
        const s = (b.style === 'w' ? 0.7 : 0.8) * M;
        x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(px + CAST[0] * 2 * M, py + CAST[1] * 2 * M, s, s);
        x.fillStyle = b.style === 'w' ? '#9a5a44' : '#8a5a48'; x.fillRect(px, py, s, s);
        x.fillStyle = '#3a2a24'; x.fillRect(px + s * 0.22, py + s * 0.22, s * 0.56, s * 0.56);
      }
      if (b.style === 'w' || b.style === 'o') {
        if (hash2(b.id, 3, 81) < 0.55) this.antenna(x, [b.cx + (hash2(b.id, 4, 81) - 0.5) * bw * 0.3, b.cy + (hash2(b.id, 5, 81) - 0.5) * bh * 0.3], 2.4 * M);
      }
    },

    drawPiece(pc) {
      const x = this.x, cam = this.cam;
      const b = pc.b, L = pc.L;
      const zt = L.zt;
      const detail = cam.zoom > 0.5;
      for (const w of pc.walls) {
        const mx = (w.ax + w.bx) / 2, my = (w.ay + w.by) / 2;
        if ((cam.x - mx) * w.nx + (cam.y - my) * w.ny <= 0) continue;
        const z0 = w.hn;
        const p0 = this.proj(w.ax, w.ay, z0), p1 = this.proj(w.bx, w.by, z0), p2 = this.proj(w.bx, w.by, zt), p3 = this.proj(w.ax, w.ay, zt);
        x.fillStyle = shadeHex(L.wall, w.light);
        x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); x.lineTo(p2[0], p2[1]); x.lineTo(p3[0], p3[1]); x.closePath(); x.fill();
        if (detail) this.facade(w, b, L, z0, zt, p0, p1, p2, p3);
      }
      if (L.noRoof) return;
      const t = this.roofTex(b, L);
      const p = this.pz(zt) * cam.zoom;
      x.save();
      x.beginPath();
      for (const r of pc.rings) {
        const q = this.proj(r[0], r[1], zt);
        x.moveTo(q[0], q[1]);
        for (let i = 2; i < r.length; i += 2) { const s = this.proj(r[i], r[i + 1], zt); x.lineTo(s[0], s[1]); }
        x.closePath();
      }
      x.clip('evenodd');
      const o = this.proj(t.ox, t.oy, zt);
      x.drawImage(t.cv, o[0], o[1], t.w / t.RS * p + 0.6, t.h / t.RS * p + 0.6);
      x.restore();
    },

    facade(w, b, L, z0, zt, p0, p1, p2, p3) {
      const x = this.x;
      const st = L.st, F = this.FLOOR;
      const lv = b.lv;
      const f0 = Math.ceil(z0 / F - 0.01);
      const nf = Math.min(lv, Math.floor(zt / F));
      const len = Math.hypot(w.bx - w.ax, w.by - w.ay);
      const ux = (w.bx - w.ax) / (len || 1), uy = (w.by - w.ay) / (len || 1);
      const P = (u, z) => this.proj(w.ax + ux * u, w.ay + uy * u, z);
      if (b.kind === 'tvtower') {
        x.strokeStyle = 'rgba(60,58,54,0.35)'; x.lineWidth = 1;
        x.beginPath();
        for (let z = z0 + 60; z < zt; z += 60) { const a = P(0, z), c = P(len, z); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); }
        x.stroke();
        return;
      }
      if (st.cornice || b.style === 'o' || b.style === 'r') {
        x.fillStyle = shadeHex(L.trim, w.light * 0.95);
        const a = P(0, zt - 2.2), c = P(len, zt - 2.2);
        x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); x.lineTo(p2[0], p2[1]); x.lineTo(p3[0], p3[1]); x.closePath(); x.fill();
      }
      if (!st.win || len < 4) return;
      const bay = L.bay;
      const first = Math.ceil((w.u0 - bay * 0.5) / bay) * bay + bay * 0.5 - w.u0;
      if (st.planks) {
        x.strokeStyle = 'rgba(40,24,10,0.25)'; x.lineWidth = 1;
        x.beginPath();
        for (let z = z0 + 2; z < zt; z += 2.4) { const a = P(0, z), c = P(len, z); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); }
        x.stroke();
      }
      if (st.panels && nf > 1) {
        x.strokeStyle = 'rgba(60,60,60,0.18)'; x.lineWidth = 1;
        x.beginPath();
        for (let f = Math.max(1, f0); f < nf; f++) { const a = P(0, f * F), c = P(len, f * F); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); }
        for (let u = first - bay * 0.5; u < len; u += bay * 2) { if (u <= 0) continue; const a = P(u, z0), c = P(u, zt); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); }
        x.stroke();
      }
      x.fillStyle = st.win;
      x.beginPath();
      const winH = F * st.wh, winOff = F * (1 - st.wh) * 0.55;
      for (let f = Math.max(0, f0); f < nf; f++) {
        if (f === 0 && w.shop) continue;
        const za = f * F + winOff, zb = za + winH;
        if (zb > zt) break;
        if (st.ribbon) {
          const a = P(Math.max(0.6, first - bay * 0.45), za), c = P(Math.min(len - 0.6, len), za), d = P(Math.min(len - 0.6, len), zb), e = P(Math.max(0.6, first - bay * 0.45), zb);
          x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.lineTo(e[0], e[1]); x.closePath();
          continue;
        }
        for (let u = first; u < len; u += bay) {
          const hw = bay * st.ww * 0.5;
          const ua = u - hw, ub = u + hw;
          if (ua < 0.5 || ub > len - 0.5) continue;
          const a = P(ua, za), c = P(ub, za), d = P(ub, zb), e = P(ua, zb);
          x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.lineTo(e[0], e[1]); x.closePath();
        }
      }
      x.fill();
      if (st.balcony && nf > 2) {
        x.fillStyle = shadeHex(L.trim, w.light * 0.9);
        x.beginPath();
        for (let u = first; u < len; u += bay * 2) {
          if (hash2(b.id, Math.round((w.u0 + u) / bay), 41) > st.balcony) continue;
          const hw = bay * 0.42;
          if (u - hw < 0.5 || u + hw > len - 0.5) continue;
          for (let f = Math.max(1, f0); f < nf; f++) {
            const za = f * F, zb = za + F * 0.32;
            const a = P(u - hw, za), c = P(u + hw, za), d = P(u + hw, zb), e = P(u - hw, zb);
            x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.lineTo(e[0], e[1]); x.closePath();
          }
        }
        x.fill();
      }
      if (w.shop && f0 === 0 && this.cam.zoom > 0.62) this.shopfront(w, b, L, len, P, first, bay);
    },

    shopfront(w, b, L, len, P, first, bay) {
      const x = this.x, F = this.FLOOR;
      x.fillStyle = '#2c3a44';
      x.beginPath();
      for (let u = first; u < len; u += bay) {
        const hw = bay * 0.4;
        if (u - hw < 0.5 || u + hw > len - 0.5) continue;
        const a = P(u - hw, 1), c = P(u + hw, 1), d = P(u + hw, F * 0.72), e = P(u - hw, F * 0.72);
        x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.lineTo(e[0], e[1]); x.closePath();
      }
      x.fill();
      const h = hash2(b.id, Math.round(w.u0 / 50), 51);
      if (h > 0.55 || len < 40) return;
      const text = SIGNS[Math.floor(hash2(b.id, Math.round(w.u0), 52) * SIGNS.length)];
      const col = SIGN_COLORS[Math.floor(h * 10) % SIGN_COLORS.length];
      const um = len / 2, sw = Math.min(len - 8, text.length * 7 + 14);
      const a = P(um - sw / 2, F * 0.78), c = P(um + sw / 2, F * 0.78), d = P(um + sw / 2, F * 1.05), e = P(um - sw / 2, F * 1.05);
      x.fillStyle = col;
      x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.lineTo(e[0], e[1]); x.closePath(); x.fill();
      let ux = a[0] - c[0], uy = a[1] - c[1];
      const vx = e[0] - a[0], vy = e[1] - a[1];
      const lw = Math.hypot(ux, uy), lh = Math.hypot(vx, vy);
      if (lw < 18 || lh < 3) return;
      ux /= lw; uy /= lw;
      if (ux * vy - uy * vx > 0) { ux = -ux; uy = -uy; }
      const ox = (a[0] + c[0] + d[0] + e[0]) / 4, oy = (a[1] + c[1] + d[1] + e[1]) / 4;
      x.save();
      x.setTransform(ux, uy, -vx / lh, -vy / lh, ox, oy);
      x.font = 'bold ' + Math.max(6, Math.min(11, lh * 0.9)) + 'px Arial';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = col === '#202020' ? '#e04040' : '#f8f0d8';
      const tw = x.measureText(text).width;
      if (tw > lw * 0.95) x.scale(lw * 0.95 / tw, 1);
      x.fillText(text, 0, 0);
      x.restore();
    },

    decoItems(b, L, list, d) {
      if (b.style === 'r' || b.kind) list.push({ k: 1, b, L, d: d - 60 });
    },

    drawDeco(b, L) {
      const x = this.x, z = this.cam.zoom, M = this.city.M;
      const zt = L.zt;
      const cx = b.cx, cy = b.cy;
      if (b.kind === 'tvtower') {
        const top = this.proj(cx, cy, zt), r = 9 * M * this.pz(zt) * z;
        x.fillStyle = '#9c9a94'; x.beginPath(); x.arc(top[0], top[1], r, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#5c5a56'; x.beginPath(); x.arc(top[0], top[1], r * 0.62, 0, Math.PI * 2); x.fill();
        x.strokeStyle = '#d0a020'; x.lineWidth = 2 * z;
        const arm = this.proj(cx + 28 * M, cy - 6 * M, zt + 30);
        const mast = this.proj(cx, cy, zt + 30);
        x.beginPath(); x.moveTo(top[0], top[1]); x.lineTo(mast[0], mast[1]); x.lineTo(arm[0], arm[1]); x.stroke();
        x.fillStyle = '#e02020'; x.beginPath(); x.arc(mast[0], mast[1], 2.5 * z, 0, Math.PI * 2); x.fill();
        return;
      }
      if (b.kind === 'mast') {
        const base = this.proj(cx, cy, 0), top = this.proj(cx, cy, Math.min(600, this.D() * 0.62));
        x.strokeStyle = '#c84030'; x.lineWidth = 3 * z;
        x.beginPath(); x.moveTo(base[0], base[1]); x.lineTo(top[0], top[1]); x.stroke();
        x.strokeStyle = '#f0f0f0'; x.setLineDash([10 * z, 10 * z]); x.stroke(); x.setLineDash([]);
        x.strokeStyle = 'rgba(40,40,40,0.6)'; x.lineWidth = 1;
        for (const a of [0, 2.1, 4.2]) { const g = this.proj(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40, 0); x.beginPath(); x.moveTo(g[0], g[1]); x.lineTo((base[0] + top[0]) / 2, (base[1] + top[1]) / 2); x.stroke(); }
        return;
      }
      const R = Math.sqrt(b.area) * M;
      const ic = this.innerCircle(b);
      if (b.kind === 'circus') { this.dome(ic[0], ic[1], zt, ic[2] * 0.94, '#b8c4cc', true); return; }
      if (b.kind === 'opera') { this.dome(ic[0], ic[1], zt, Math.min(ic[2] * 0.8, 9 * M), '#6a8a7a', false); return; }
      if (b.kind === 'whitehouse') {
        const top = this.proj(ic[0], ic[1], zt), pole = this.proj(ic[0], ic[1], zt + 28);
        x.strokeStyle = '#d8d8d8'; x.lineWidth = 1.5 * z; x.beginPath(); x.moveTo(top[0], top[1]); x.lineTo(pole[0], pole[1]); x.stroke();
        const wave = Math.sin(this.time * 3) * 2;
        x.fillStyle = '#d02020'; x.beginPath(); x.moveTo(pole[0], pole[1]); x.lineTo(pole[0] + 16 * z, pole[1] + wave * z); x.lineTo(pole[0] + 16 * z, pole[1] + 10 * z + wave * z); x.lineTo(pole[0], pole[1] + 10 * z); x.closePath(); x.fill();
        return;
      }
      if (b.style === 'r') {
        const r0 = clamp(Math.min(R * 0.16, ic[2] * 0.7), 2 * M, 6 * M);
        this.dome(ic[0], ic[1], zt + 8, r0, b.seed < 0.4 ? '#d8b040' : b.seed < 0.7 ? '#3a7a5a' : '#3a5a9a', false, true);
        if (b.area > 250) for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const qx = ic[0] + dx * r0 * 1.8, qy = ic[1] + dy * r0 * 1.8; if (G.inRings(qx, qy, b.rings)) this.dome(qx, qy, zt + 4, r0 * 0.5, '#d8b040', false, true); }
      }
    },

    dome(cx, cy, zb, r, color, ribs, cross) {
      const x = this.x, z = this.cam.zoom;
      const [sx, sy] = this.proj(cx, cy, zb + r * 0.5);
      const k = this.pz(zb + r * 0.5) * z;
      x.fillStyle = shadeHex(color, 0.78); x.beginPath(); x.arc(sx, sy, r * k, 0, Math.PI * 2); x.fill();
      const g = x.createRadialGradient(sx - r * k * 0.35, sy + r * k * 0.25, 1, sx, sy, r * k);
      g.addColorStop(0, shadeHex(color, 1.5)); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(sx, sy, r * k, 0, Math.PI * 2); x.fill();
      if (ribs) {
        x.strokeStyle = 'rgba(40,50,60,0.45)'; x.lineWidth = 1;
        for (let a = 0; a < Math.PI; a += Math.PI / 6) { x.beginPath(); x.moveTo(sx + Math.cos(a) * r * k, sy + Math.sin(a) * r * k); x.lineTo(sx - Math.cos(a) * r * k, sy - Math.sin(a) * r * k); x.stroke(); }
        x.beginPath(); x.arc(sx, sy, r * k * 0.5, 0, Math.PI * 2); x.stroke();
      }
      if (cross) {
        const [tx, ty] = this.proj(cx, cy, zb + r * 1.8);
        x.strokeStyle = '#e8d060'; x.lineWidth = 1.4 * z;
        x.beginPath(); x.moveTo(sx, sy); x.lineTo(tx, ty); x.moveTo(tx - 3 * z, ty + 2 * z); x.lineTo(tx + 3 * z, ty + 2 * z); x.stroke();
      }
    }
  };

  G.Bldg = Bldg;
  G.BLDG_STYLES = STY;
  G.shadeHex = shadeHex;
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
