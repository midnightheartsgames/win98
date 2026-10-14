(function (G) {
  'use strict';
  const { hash2, offsetLine, cumLen, pointAt } = G;

  const C = {
    void: '#141618', yard: '#69675f', asphalt: '#4b4c50', asphaltOld: '#55554f', curb: '#bdb8ac', walk: '#8f8c84', plaza: '#a49f92', grass: '#557538', park: '#4d6f33', wood: '#3f6129',
    water: '#2c4f6a', parking: '#5c5c5a', dirt: '#7a6648', sand: '#c9b98c', rail: '#5e544a', pitch: '#5b8040', service: '#58585a', line: 'rgba(232,230,218,0.86)', yellow: 'rgba(226,190,60,0.9)'
  };
  const AREA_FILL = { w: 'water', p: 'park', g: 'grass', v: 'grass', f: 'wood', q: 'plaza', k: 'parking', c: 'dirt', r: 'rail', s: 'pitch', b: 'sand', y: 'yard' };

  function makeCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  }

  function noiseTile(size, seed, dots, color, alpha) {
    const c = makeCanvas(size, size), x = c.getContext('2d');
    for (let k = 0; k < dots; k++) {
      const a = hash2(k, seed, 1), b = hash2(k, seed, 2), s = 1 + hash2(k, seed, 3) * 2.5;
      x.fillStyle = color(hash2(k, seed, 4));
      x.globalAlpha = alpha * (0.4 + hash2(k, seed, 5) * 0.6);
      x.fillRect(a * size, b * size, s, s);
    }
    return c;
  }

  function ringPath(x, r) {
    x.moveTo(r[0], r[1]);
    for (let i = 2; i < r.length; i += 2) x.lineTo(r[i], r[i + 1]);
    x.closePath();
  }
  function linePath(x, p) {
    x.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) x.lineTo(p[i], p[i + 1]);
  }

  const Ground = {
    groundInit() {
      if (this.pat) return;
      const mk = (cv) => this.x.createPattern(cv, 'repeat');
      this.pat = {
        noise: mk(noiseTile(128, 1, 900, v => v < 0.5 ? '#000' : '#fff', 0.09)),
        grass: mk(noiseTile(96, 2, 700, v => v < 0.33 ? '#2e4a1c' : v < 0.66 ? '#7a9a48' : '#9aa858', 0.35)),
        dirt: mk(noiseTile(96, 3, 500, v => v < 0.5 ? '#4a3a24' : '#a08a64', 0.35)),
        asphalt: mk(noiseTile(128, 4, 1100, v => v < 0.6 ? '#2a2a2c' : '#77777a', 0.18)),
        walk: mk(noiseTile(96, 5, 600, v => v < 0.5 ? '#55524a' : '#b6b2a6', 0.2)),
        water: mk(noiseTile(128, 6, 120, v => v < 0.5 ? '#6a8aa8' : '#1c3448', 0.25)),
        leaves: mk(noiseTile(64, 7, 160, v => v < 0.4 ? '#c09030' : v < 0.7 ? '#a85a20' : '#d8b048', 0.55))
      };
    },

    groundChunk(cx, cy) {
      const city = this.city, CS = city.chunkSize;
      const cv = makeCanvas(CS, CS);
      const x = cv.getContext('2d');
      const X0 = cx * CS, Y0 = cy * CS;
      x.fillStyle = C.void; x.fillRect(0, 0, CS, CS);
      const items = city.renderIndex.get(cx + ',' + cy);
      x.translate(-X0, -Y0);
      x.fillStyle = C.yard;
      x.beginPath(); for (const m of city.margins) ringPath(x, m); x.fill();
      x.fillStyle = this.pat.noise; x.fill();
      if (items) this.drawGroundItems(x, items, X0, Y0, CS);
      x.setTransform(1, 0, 0, 1, 0, 0);
      return cv;
    },

    drawGroundItems(x, it, X0, Y0, CS) {
      const city = this.city, M = city.M;
      const fillArea = (a, style) => { x.beginPath(); for (const r of a.rings) ringPath(x, r); x.fillStyle = style; x.fill('evenodd'); };
      for (const k of ['k', 'y', 'g', 'v', 'p', 'f', 's', 'b', 'c', 'q', 'r', 'w']) for (const a of it.areas) {
        if (a.kind !== k) continue;
        fillArea(a, C[AREA_FILL[k]] || C.yard);
        if (k === 'g' || k === 'p' || k === 'f' || k === 's') { fillArea(a, this.pat.grass); if (k !== 's') { x.globalAlpha = 0.3; fillArea(a, this.pat.leaves); x.globalAlpha = 1; } }
        else if (k === 'c') fillArea(a, this.pat.dirt);
        else if (k === 'v') { fillArea(a, this.pat.grass); this.beds(x, a); }
        else if (k === 'w') { fillArea(a, this.pat.water); this.shore(x, a); }
        else if (k === 'q') this.paving(x, a);
        else if (k === 'k') fillArea(a, this.pat.asphalt);
        if (k === 's') this.pitchLines(x, a);
      }
      if (city.lawn) this.lawns(x, X0, Y0, CS);
      x.lineJoin = 'round'; x.lineCap = 'round';
      for (const s of it.service) { x.strokeStyle = C.service; x.lineWidth = s.w; x.beginPath(); linePath(x, s.pts); x.stroke(); }
      x.strokeStyle = this.pat.asphalt; x.globalAlpha = 0.6;
      for (const s of it.service) { x.lineWidth = s.w; x.beginPath(); linePath(x, s.pts); x.stroke(); }
      x.globalAlpha = 1;
      x.lineCap = 'butt';
      for (const r of it.roads) this.sidewalks(x, r);
      for (const n of it.nodes) this.nodeWalk(x, n);
      x.lineCap = 'round';
      for (const r of it.roads) { if (r.bridge) this.deck(x, r); }
      for (const r of it.roads) { x.strokeStyle = C.curb; x.lineWidth = r.w + 3; x.beginPath(); linePath(x, r.pts); x.stroke(); }
      for (const n of it.nodes) { x.fillStyle = C.curb; x.beginPath(); ringPath(x, this.grow(n.poly, n.x, n.y, 1.5)); x.fill(); }
      for (const r of it.roads) { x.strokeStyle = C.asphalt; x.lineWidth = r.w; x.beginPath(); linePath(x, r.pts); x.stroke(); }
      for (const n of it.nodes) { x.fillStyle = C.asphalt; x.beginPath(); ringPath(x, n.poly); x.fill(); }
      x.globalAlpha = 0.85;
      for (const r of it.roads) { x.strokeStyle = this.pat.asphalt; x.lineWidth = r.w; x.beginPath(); linePath(x, r.pts); x.stroke(); }
      for (const n of it.nodes) { x.fillStyle = this.pat.asphalt; x.beginPath(); ringPath(x, n.poly); x.fill(); }
      x.globalAlpha = 1;
      for (const r of it.roads) this.patches(x, r);
      x.lineCap = 'butt';
      for (const r of it.roads) if (r.fwd) this.markings(x, r);
      for (const e of it.walks) this.zebra(x, e);
      for (const r of it.rails) this.rail(x, r);
      if (G.Yards) for (const y of it.yards) G.Yards.draw(x, y, M);
      for (const b of it.barriers) this.barrier(x, b);
      this.shadows(x, it);
    },

    grow(poly, cx, cy, d) {
      const out = new Float32Array(poly.length);
      for (let i = 0; i < poly.length; i += 2) {
        const dx = poly[i] - cx, dy = poly[i + 1] - cy, l = Math.hypot(dx, dy) || 1;
        out[i] = poly[i] + dx / l * d; out[i + 1] = poly[i + 1] + dy / l * d;
      }
      return out;
    },

    sidewalks(x, r) {
      const sl = r.sl, sr = r.sr;
      for (const [side, w] of [[1, sr], [-1, sl]]) {
        if (!w) continue;
        const off = offsetLine(r.pts, side * (r.w / 2 + w / 2));
        x.strokeStyle = C.walk; x.lineWidth = w + 1; x.beginPath(); linePath(x, off); x.stroke();
        x.strokeStyle = this.pat.walk; x.stroke();
        x.strokeStyle = 'rgba(40,38,34,0.18)'; x.lineWidth = 1;
        const edge = offsetLine(r.pts, side * (r.w / 2 + w));
        x.beginPath(); linePath(x, edge); x.stroke();
      }
    },

    nodeWalk(x, n) {
      let side = 0;
      for (const a of n.arms) side = Math.max(side, a.side || 0, a.sideL || 0);
      if (!side) return;
      x.fillStyle = C.walk; x.beginPath(); ringPath(x, this.grow(n.poly, n.x, n.y, side)); x.fill();
      x.fillStyle = this.pat.walk; x.fill();
    },

    deck(x, r) {
      x.strokeStyle = '#6e6c66'; x.lineWidth = r.w + 2 * Math.max(r.sl, r.sr, 12) + 8; x.beginPath(); linePath(x, r.pts); x.stroke();
      x.strokeStyle = '#3a3a3c'; x.lineWidth = 2;
      for (const side of [1, -1]) { const off = offsetLine(r.pts, side * (r.w / 2 + Math.max(r.sl, r.sr, 12) + 3)); x.beginPath(); linePath(x, off); x.stroke(); }
    },

    patches(x, r) {
      const p = r.pts, cum = r.cum || (r.cum = cumLen(p));
      const L = cum[cum.length - 1];
      const n = Math.floor(L / 140);
      x.fillStyle = 'rgba(30,30,32,0.22)';
      const seed = Math.round(p[0] * 7 + p[1] * 13);
      for (let k = 0; k < n; k++) {
        const q = pointAt(p, cum, hash2(seed, k, 1) * L);
        const off = (hash2(seed, k, 2) - 0.5) * r.w * 0.7;
        const nx = -Math.sin(q[2]), ny = Math.cos(q[2]);
        const w = 8 + hash2(seed, k, 3) * 26, h = 5 + hash2(seed, k, 4) * 12;
        x.save(); x.translate(q[0] + nx * off, q[1] + ny * off); x.rotate(q[2]); x.fillRect(-w / 2, -h / 2, w, h); x.restore();
      }
    },

    markings(x, s) {
      const lw = s.lw, two = s.lb > 0;
      const dash = [26, 26];
      x.lineWidth = 2;
      if (two) {
        const wide = s.lf + s.lb >= 4;
        x.strokeStyle = C.line;
        const ctr = this.trimmed(s, s.pts, 0);
        if (wide) {
          for (const o of [-2.2, 2.2]) { x.setLineDash([]); x.beginPath(); linePath(x, offsetLine(ctr, o)); x.stroke(); }
        } else { x.setLineDash(dash); x.beginPath(); linePath(x, ctr); x.stroke(); }
      }
      x.setLineDash(dash);
      x.strokeStyle = C.line;
      const lines = [];
      if (two) {
        for (let k = 1; k < s.lf; k++) lines.push(lw * k);
        for (let k = 1; k < s.lb; k++) lines.push(-lw * k);
      } else for (let k = 1; k < s.lf; k++) lines.push(lw * (k - s.lf / 2));
      for (const o of lines) { x.beginPath(); linePath(x, offsetLine(this.trimmed(s, s.pts, 0), o)); x.stroke(); }
      x.setLineDash([]);
      const net = this.city.net;
      x.lineWidth = 4; x.strokeStyle = C.line;
      for (const ids of [s.fwd, s.back]) {
        if (!ids.length) continue;
        const l0 = net.lanes[ids[0]];
        if (l0.light < 0) continue;
        const a = net.lanes[ids[0]].pts, b = net.lanes[ids[ids.length - 1]].pts;
        const n = a.length;
        const ux = a[n - 2] - a[n - 4], uy = a[n - 1] - a[n - 3], ul = Math.hypot(ux, uy) || 1;
        const nx = -uy / ul, ny = ux / ul;
        const back = 6;
        x.beginPath();
        x.moveTo(a[n - 2] + nx * lw / 2 - ux / ul * back, a[n - 1] + ny * lw / 2 - uy / ul * back);
        x.lineTo(b[b.length - 2] - nx * lw / 2 - ux / ul * back, b[b.length - 1] - ny * lw / 2 - uy / ul * back);
        x.stroke();
      }
    },

    trimmed(s, p, off) {
      const cum = s.cum;
      return G.subLine(p, cum, s.da, s.len - s.db);
    },

    zebra(x, e) {
      if (!e.zebra) return;
      const [ax, ay, bx, by] = e.zebra;
      const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      const w = e.width || 30;
      x.fillStyle = 'rgba(232,230,218,0.82)';
      for (let d = 4; d < L - 4; d += 12) {
        const cx = ax + ux * d, cy = ay + uy * d;
        x.beginPath();
        x.moveTo(cx - nx * w / 2, cy - ny * w / 2); x.lineTo(cx - nx * w / 2 + ux * 6, cy - ny * w / 2 + uy * 6);
        x.lineTo(cx + nx * w / 2 + ux * 6, cy + ny * w / 2 + uy * 6); x.lineTo(cx + nx * w / 2, cy + ny * w / 2);
        x.closePath(); x.fill();
      }
    },

    rail(x, r) {
      const M = this.city.M, g = 1.524 * M / 2;
      x.lineCap = 'butt';
      if (r.kind === 'r') {
        x.strokeStyle = '#5e544a'; x.lineWidth = 3.4 * M; x.beginPath(); linePath(x, r.pts); x.stroke();
        x.strokeStyle = '#3e342c'; x.lineWidth = 2.6 * M; x.setLineDash([3, 5]); x.beginPath(); linePath(x, r.pts); x.stroke(); x.setLineDash([]);
      } else {
        const on = (px, py) => { const g2 = this.city.surfAt(px, py); return g2 === G.GR.ROAD || g2 === G.GR.BRIDGE; };
        const mid = r.pts.length >= 4 ? [(r.pts[0] + r.pts[2]) / 2, (r.pts[1] + r.pts[3]) / 2] : [r.pts[0], r.pts[1]];
        if (!on(mid[0], mid[1])) {
          x.strokeStyle = '#6a6054'; x.lineWidth = 2.8 * M; x.beginPath(); linePath(x, r.pts); x.stroke();
          x.strokeStyle = '#4a3c30'; x.lineWidth = 2.3 * M; x.setLineDash([3, 6]); x.beginPath(); linePath(x, r.pts); x.stroke(); x.setLineDash([]);
        } else {
          x.strokeStyle = 'rgba(30,30,30,0.35)'; x.lineWidth = 2.4 * M; x.beginPath(); linePath(x, r.pts); x.stroke();
        }
      }
      for (const o of [-g, g]) {
        const off = offsetLine(r.pts, o);
        x.strokeStyle = '#2a2a2c'; x.lineWidth = 2.2; x.beginPath(); linePath(x, off); x.stroke();
        x.strokeStyle = 'rgba(200,205,210,0.7)'; x.lineWidth = 0.9; x.beginPath(); linePath(x, off); x.stroke();
      }
    },

    lawns(x, X0, Y0, CS) {
      const city = this.city, S = city.cell, W = city.CW;
      const c0 = Math.max(0, Math.floor(X0 / S) - 1), r0 = Math.max(0, Math.floor(Y0 / S) - 1);
      const c1 = Math.min(W - 1, Math.floor((X0 + CS) / S) + 1), r1 = Math.min(city.CH - 1, Math.floor((Y0 + CS) / S) + 1);
      x.beginPath();
      let any = false;
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        if (!city.lawn[r * W + c]) continue;
        const cx = (c + 0.5) * S, cy = (r + 0.5) * S, rad = S * (0.82 + hash2(c, r, 41) * 0.3);
        x.moveTo(cx + rad, cy); x.arc(cx, cy, rad, 0, Math.PI * 2);
        any = true;
      }
      if (!any) return;
      x.fillStyle = '#5a6e3c'; x.fill();
      x.fillStyle = this.pat.grass; x.fill();
      x.globalAlpha = 0.22; x.fillStyle = this.pat.leaves; x.fill(); x.globalAlpha = 1;
    },

    beds(x, a) {
      const M = this.city.M, r = a.rings[0];
      if (r.length < 8) return;
      let ux = r[2] - r[0], uy = r[3] - r[1];
      const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
      const nx = r[6] - r[0], ny = r[7] - r[1], depth = Math.hypot(nx, ny);
      const vx = nx / (depth || 1), vy = ny / (depth || 1);
      const h = hash2(Math.round(r[0]), Math.round(r[1]), 17);
      x.save();
      x.beginPath(); ringPath(x, r); x.clip();
      x.lineCap = 'butt';
      const d0 = depth * (0.42 + h * 0.12);
      for (let s = 1.2 * M, k = 0; s < l - 0.8 * M; s += 1.5 * M, k++) {
        const ax = r[0] + ux * s + vx * d0, ay = r[1] + uy * s + vy * d0, bx = r[0] + ux * s + vx * (depth - M), by = r[1] + uy * s + vy * (depth - M);
        x.strokeStyle = '#4e3c28'; x.lineWidth = 0.9 * M; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
        if (hash2(k, Math.round(r[0]), 19) < 0.55) { x.strokeStyle = 'rgba(90,130,50,0.8)'; x.lineWidth = 0.35 * M; x.setLineDash([0.5 * M, 0.4 * M]); x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); x.setLineDash([]); }
      }
      x.restore();
    },

    barrier(x, b) {
      x.lineCap = 'butt';
      if (b.kind === 'p') {
        const p = b.pts, cum = cumLen(p), L = cum[cum.length - 1];
        x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2.4; x.save(); x.translate(this.light[0] * 6, this.light[1] * 6); x.beginPath(); linePath(x, p); x.restore(); x.stroke();
        x.strokeStyle = '#7a6448'; x.lineWidth = 2.2; x.beginPath(); linePath(x, p); x.stroke();
        x.fillStyle = '#4a3a28'; for (let d = 0; d <= L; d += 24) { const q = pointAt(p, cum, d); x.fillRect(q[0] - 1.6, q[1] - 1.6, 3.2, 3.2); }
        return;
      }
      if (b.kind === 'h') {
        const M = this.city.M;
        x.lineJoin = 'miter';
        x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 0.4 * M; x.save(); x.translate(this.light[0] * 0.8 * M, this.light[1] * 0.8 * M); x.beginPath(); linePath(x, b.pts); x.restore(); x.stroke();
        x.strokeStyle = '#8a6a40'; x.lineWidth = 0.35 * M; x.beginPath(); linePath(x, b.pts); x.stroke();
        x.strokeStyle = 'rgba(255,240,200,0.35)'; x.lineWidth = 0.1 * M; x.stroke();
        return;
      }
      if (b.kind === 'w') { x.strokeStyle = '#8c857a'; x.lineWidth = 4; }
      else if (b.kind === 'r') { x.strokeStyle = '#77736a'; x.lineWidth = 3; }
      else { x.strokeStyle = 'rgba(40,38,36,0.85)'; x.lineWidth = 1.6; }
      x.beginPath(); linePath(x, b.pts); x.stroke();
      if (b.kind === 'f') { x.fillStyle = 'rgba(30,30,30,0.9)'; const p = b.pts, cum = cumLen(p), L = cum[cum.length - 1]; for (let d = 0; d < L; d += 22) { const q = pointAt(p, cum, d); x.fillRect(q[0] - 1.5, q[1] - 1.5, 3, 3); } }
    },

    shore(x, a) {
      x.lineJoin = 'round';
      x.strokeStyle = '#a8a294'; x.lineWidth = 5;
      x.beginPath(); for (const r of a.rings) ringPath(x, r); x.stroke();
      x.strokeStyle = 'rgba(20,30,40,0.35)'; x.lineWidth = 2;
      x.stroke();
    },

    paving(x, a) {
      x.save();
      x.beginPath(); for (const r of a.rings) ringPath(x, r); x.clip('evenodd');
      const [x0, y0, x1, y1] = a.bb;
      x.strokeStyle = 'rgba(70,64,56,0.22)'; x.lineWidth = 1;
      x.beginPath();
      for (let gx = Math.floor(x0 / 18) * 18; gx < x1; gx += 18) { x.moveTo(gx + 0.5, y0); x.lineTo(gx + 0.5, y1); }
      for (let gy = Math.floor(y0 / 18) * 18; gy < y1; gy += 18) { x.moveTo(x0, gy + 0.5); x.lineTo(x1, gy + 0.5); }
      x.stroke();
      x.restore();
    },

    pitchLines(x, a) {
      x.strokeStyle = 'rgba(240,240,230,0.45)'; x.lineWidth = 1.5;
      x.beginPath(); for (const r of a.rings) ringPath(x, this.grow(r, (a.bb[0] + a.bb[2]) / 2, (a.bb[1] + a.bb[3]) / 2, -6)); x.stroke();
    },

    shadows(x, it) {
      const L = this.light, CS = this.city.chunkSize;
      const sc = this.shadowCanvas || (this.shadowCanvas = makeCanvas(CS, CS));
      const s = sc.getContext('2d');
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.clearRect(0, 0, CS, CS);
      const m = x.getTransform();
      s.setTransform(1, 0, 0, 1, m.e, m.f);
      s.fillStyle = '#000';
      for (const b of it.buildings) {
        const h = Math.min(b.lv * this.FLOOR, 300) * 0.6;
        const sx = L[0] * h, sy = L[1] * h;
        const r = b.rings[0], n = r.length;
        for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
          const ax = r[j], ay = r[j + 1], bx = r[i], by = r[i + 1];
          s.beginPath(); s.moveTo(ax, ay); s.lineTo(bx, by); s.lineTo(bx + sx, by + sy); s.lineTo(ax + sx, ay + sy); s.closePath(); s.fill();
        }
        s.beginPath(); s.moveTo(r[0] + sx, r[1] + sy);
        for (let i = 2; i < n; i += 2) s.lineTo(r[i] + sx, r[i + 1] + sy);
        s.closePath(); s.fill();
      }
      for (const t of it.trees) { s.beginPath(); s.arc(t.x + L[0] * 26, t.y + L[1] * 26, t.r * 0.95, 0, Math.PI * 2); s.fill(); }
      x.save();
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalAlpha = 0.24;
      x.drawImage(sc, 0, 0);
      x.restore();
    }
  };

  G.Ground = Ground;
  G.GROUND_COLORS = C;
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
