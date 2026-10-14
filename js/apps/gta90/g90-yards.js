(function (G) {
  'use strict';
  const { hash2 } = G;

  const KINDS = [
    { type: 'hockey', clear: 21, spacing: 320, cap: 16 },
    { type: 'play', clear: 9, spacing: 95, cap: 160 },
    { type: 'laundry', clear: 4.5, spacing: 70, cap: 160 },
    { type: 'beat', clear: 3.5, spacing: 60, cap: 160 },
    { type: 'trash', clear: 3.5, max: 8, spacing: 75, cap: 200 }
  ];
  const PAINT = ['#c83a2a', '#e0b030', '#2a68b0', '#3a8a40', '#d06a20'];

  function distanceField(city, mask) {
    const GR = G.GR, W = city.CW, H = city.CH, C = city.cell;
    const D = new Uint16Array(W * H);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const i = r * W + c, g = city.surf[i];
      if (mask[i] || city.solid[i] || (g !== GR.YARD && g !== GR.GRASS && g !== GR.DIRT)) continue;
      if (city.playAt((c + 0.5) * C, (r + 0.5) * C)) D[i] = 65000;
    }
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const i = r * W + c;
      let v = D[i];
      if (!v) continue;
      if (c > 0) v = Math.min(v, D[i - 1] + 3);
      if (r > 0) { v = Math.min(v, D[i - W] + 3); if (c > 0) v = Math.min(v, D[i - W - 1] + 4); if (c < W - 1) v = Math.min(v, D[i - W + 1] + 4); }
      D[i] = v;
    }
    for (let r = H - 1; r >= 0; r--) for (let c = W - 1; c >= 0; c--) {
      const i = r * W + c;
      let v = D[i];
      if (!v) continue;
      if (c < W - 1) v = Math.min(v, D[i + 1] + 3);
      if (r < H - 1) { v = Math.min(v, D[i + W] + 3); if (c < W - 1) v = Math.min(v, D[i + W + 1] + 4); if (c > 0) v = Math.min(v, D[i + W - 1] + 4); }
      D[i] = v;
    }
    return D;
  }

  function boards(x, y, a, M) {
    const ca = Math.cos(a), sa = Math.sin(a);
    const hx = 18 * M, hy = 9 * M, c = 2.5 * M, g = 1.6 * M;
    const P = (u, v) => [x + u * ca - v * sa, y + u * sa + v * ca];
    const line = list => { const out = new Float32Array(list.length * 2); list.forEach(([u, v], k) => { const p = P(u, v); out[k * 2] = p[0]; out[k * 2 + 1] = p[1]; }); return out; };
    return [
      line([[-g, -hy], [-hx + c, -hy], [-hx, -hy + c], [-hx, hy - c], [-hx + c, hy], [-g, hy]]),
      line([[g, hy], [hx - c, hy], [hx, hy - c], [hx, -hy + c], [hx - c, -hy], [g, -hy]])
    ];
  }

  const Yards = {
    place(city) {
      const M = city.M, C = city.cell, W = city.CW, H = city.CH;
      const mask = new Uint8Array(W * H);
      for (const b of city.barriers) city.strokeLine(mask, C, W, H, b.pts, 1.2 * M, 1);
      for (const s of city.service) city.strokeLine(mask, C, W, H, s.pts, s.w / 2 + 0.6 * M, 1);
      for (const a of city.areas) if ('kvqscw'.includes(a.kind)) city.fillRings(mask, C, W, H, a.rings, 1);
      for (const g of Object.values(city.garages || {})) if (g.apron) city.strokeLine(mask, C, W, H, [g.apron[0], g.apron[1], g.apron[2], g.apron[3]], 5 * M, 1);
      const D = distanceField(city, mask);
      const toM = C / (3 * M);
      const SHIFT = 8388608;
      const keyed = [];
      for (let r = 1; r < H - 1; r += 2) for (let c = 1; c < W - 1; c += 2) {
        if (D[r * W + c] * toM >= 3.5) keyed.push(Math.floor(hash2(c, r, 5) * 1e6) * SHIFT + r * W + c);
      }
      const order = Float64Array.from(keyed).sort();
      const cand = new Int32Array(order.length);
      for (let k = 0; k < order.length; k++) cand[k] = order[k] % SHIFT;
      const items = city.yards = [];
      const hash = new G.SpatialHash(512);
      const buf = [];
      const clash = (x, y, r, type, spacing) => {
        const R = Math.max(spacing, r + 30 * M);
        for (const k of hash.query(x - R, y - R, x + R, y + R, buf)) {
          const it = items[k], d = Math.hypot(it.x - x, it.y - y);
          if (d < it.r + r + 2 * M || (it.type === type && d < spacing)) return true;
        }
        return false;
      };
      const add = it => { hash.insert(items.length, it.x - 1, it.y - 1, it.x + 1, it.y + 1); items.push(it); };
      for (const K of KINDS) {
        let n = 0;
        for (const i of cand) {
          if (n >= K.cap) break;
          const d = D[i] * toM;
          if (d < K.clear || (K.max && d > K.max)) continue;
          const x = (i % W + 0.5) * C, y = ((i / W | 0) + 0.5) * C;
          const r = K.clear * M * 0.9;
          if (clash(x, y, r, K.type, K.spacing * M)) continue;
          const a = hash2(i % W, i / W | 0, 6) < 0.5 ? 0 : Math.PI / 2;
          add({ type: K.type, x, y, r, a, s: hash2(i % W, i / W | 0, 7) });
          if (K.type === 'hockey') for (const pts of boards(x, y, a, M)) city.barriers.push({ kind: 'h', pts });
          n++;
        }
      }
      let benches = 0;
      for (const b of city.buildings) {
        if (!'pks'.includes(b.style) || b.lv < 3) continue;
        const r = b.rings[0];
        let made = 0;
        for (let i = 0, n = r.length, j = n - 2; i < n && made < 3; j = i, i += 2) {
          const ax = r[j], ay = r[j + 1], bx = r[i], by = r[i + 1], el = Math.hypot(bx - ax, by - ay);
          if (el < 14 * M) continue;
          let nx = (by - ay) / el, ny = -(bx - ax) / el;
          const mx = (ax + bx) / 2, my = (ay + by) / 2;
          if (G.inRings(mx + nx * 3 * M, my + ny * 3 * M, b.rings)) { nx = -nx; ny = -ny; }
          const qx = mx + nx * 4.5 * M, qy = my + ny * 4.5 * M;
          const c = Math.floor(qx / C), rr = Math.floor(qy / C);
          if (c < 0 || rr < 0 || c >= W || rr >= H || D[rr * W + c] * toM < 2) continue;
          if (hash2(Math.round(mx), Math.round(my), 8) < 0.35) continue;
          const ex = mx + nx * 2.6 * M, ey = my + ny * 2.6 * M;
          if (!city.inPlay(ex, ey) || city.buildingAt(ex, ey)) continue;
          add({ type: 'bench', x: ex, y: ey, r: 1.2 * M, a: Math.atan2(by - ay, bx - ax), s: hash2(b.id, i, 9) });
          made++; benches++;
        }
      }
      const lawn = city.lawn = new Uint8Array(W * H);
      const S = 9, LW = Math.ceil(W / S) + 2, LH = Math.ceil(H / S) + 2;
      const lat = new Float32Array(LW * LH);
      for (let gy = 0; gy < LH; gy++) for (let gx = 0; gx < LW; gx++) lat[gy * LW + gx] = hash2(gx, gy, 31);
      const minD = Math.ceil(2.2 / toM);
      for (let r = 0; r < H; r++) {
        const gy = Math.floor(r / S), fy = r / S - gy, sy = fy * fy * (3 - 2 * fy);
        for (let c = 0; c < W; c++) {
          const i = r * W + c;
          if (D[i] < minD) continue;
          const gx = Math.floor(c / S), fx = c / S - gx, sx = fx * fx * (3 - 2 * fx), o = gy * LW + gx;
          const a = lat[o], b = lat[o + 1], e = lat[o + LW], f = lat[o + LW + 1];
          if ((a + (b - a) * sx) * (1 - sy) + (e + (f - e) * sx) * sy < 0.46) continue;
          lawn[i] = 1;
        }
      }
      for (const it of items) {
        if (it.type === 'bench') continue;
        const R = it.r + 1.5 * M;
        for (let r = Math.max(0, Math.floor((it.y - R) / C)); r <= Math.min(H - 1, Math.floor((it.y + R) / C)); r++) for (let c = Math.max(0, Math.floor((it.x - R) / C)); c <= Math.min(W - 1, Math.floor((it.x + R) / C)); c++) {
          if (Math.hypot((c + 0.5) * C - it.x, (r + 0.5) * C - it.y) < R) lawn[r * W + c] = 0;
        }
      }
      for (let i = 0; i < W * H; i++) if (lawn[i]) city.surf[i] = G.GR.GRASS;
      for (const i of cand) {
        const d = D[i] * toM;
        if (d < 3.5 || hash2(i % W, i / W | 0, 9) > 0.03) continue;
        const x = (i % W + 0.5) * C + (hash2(i, 1, 9) - 0.5) * 2 * C, y = ((i / W | 0) + 0.5) * C + (hash2(i, 2, 9) - 0.5) * 2 * C;
        if (clash(x, y, 2.5 * M, 'tree', 0)) continue;
        city.trees.push([x, y]);
      }
      return { items: items.length, benches };
    },

    draw(x, it, M) {
      x.save();
      x.translate(it.x, it.y); x.rotate(it.a);
      const shadow = (f) => { x.save(); x.translate(0.6 * M, -0.7 * M); x.fillStyle = 'rgba(0,0,0,0.22)'; f(); x.restore(); };
      if (it.type === 'hockey') {
        const hx = 18 * M, hy = 9 * M, c = 2.5 * M;
        x.fillStyle = '#6e6658'; x.beginPath(); x.moveTo(-hx + c, -hy); x.lineTo(hx - c, -hy); x.lineTo(hx, -hy + c); x.lineTo(hx, hy - c); x.lineTo(hx - c, hy); x.lineTo(-hx + c, hy); x.lineTo(-hx, hy - c); x.lineTo(-hx, -hy + c); x.closePath(); x.fill();
        x.strokeStyle = 'rgba(200,60,50,0.35)'; x.lineWidth = 0.3 * M;
        x.beginPath(); x.moveTo(0, -9 * M); x.lineTo(0, 9 * M); x.stroke();
        x.beginPath(); x.arc(0, 0, 3 * M, 0, Math.PI * 2); x.stroke();
        x.strokeStyle = 'rgba(60,90,160,0.3)';
        x.beginPath(); x.moveTo(-8 * M, -9 * M); x.lineTo(-8 * M, 9 * M); x.moveTo(8 * M, -9 * M); x.lineTo(8 * M, 9 * M); x.stroke();
        x.strokeStyle = '#d8d0c0'; x.lineWidth = 0.25 * M;
        for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 15.5 * M, -1 * M); x.lineTo(s * 16.6 * M, -1 * M); x.lineTo(s * 16.6 * M, 1 * M); x.lineTo(s * 15.5 * M, 1 * M); x.stroke(); }
      } else if (it.type === 'play') {
        const c1 = PAINT[Math.floor(it.s * 5)], c2 = PAINT[Math.floor(it.s * 13) % 5], c3 = PAINT[Math.floor(it.s * 29) % 5];
        x.fillStyle = 'rgba(120,100,70,0.35)'; x.beginPath(); x.ellipse(0, 0, 8 * M, 6 * M, 0, 0, Math.PI * 2); x.fill();
        shadow(() => x.fillRect(-6 * M, -5 * M, 3.2 * M, 3.2 * M));
        x.fillStyle = '#8a6a44'; x.fillRect(-6 * M, -5 * M, 3.2 * M, 3.2 * M);
        x.fillStyle = '#d8c48c'; x.fillRect(-5.7 * M, -4.7 * M, 2.6 * M, 2.6 * M);
        x.strokeStyle = c1; x.lineWidth = 0.3 * M;
        x.beginPath(); x.moveTo(1 * M, -5.5 * M); x.lineTo(5 * M, -5.5 * M); x.stroke();
        x.lineWidth = 0.22 * M; x.strokeStyle = '#3a3a3a';
        x.beginPath(); x.moveTo(2.2 * M, -5.5 * M); x.lineTo(2.2 * M, -4.2 * M); x.moveTo(3.8 * M, -5.5 * M); x.lineTo(3.8 * M, -4.2 * M); x.stroke();
        x.fillStyle = '#5a4630'; x.fillRect(2 * M, -4.4 * M, 2 * M, 0.5 * M);
        shadow(() => x.fillRect(2 * M, 1 * M, 1.2 * M, 4.2 * M));
        x.fillStyle = '#a8acb0'; x.fillRect(2 * M, 1 * M, 1.2 * M, 4.2 * M);
        x.fillStyle = c2; x.fillRect(1.9 * M, 0.2 * M, 1.4 * M, 1 * M);
        x.strokeStyle = c3; x.lineWidth = 0.22 * M;
        x.beginPath(); x.arc(-4 * M, 3 * M, 1.7 * M, 0, Math.PI * 2); x.moveTo(-5.7 * M, 3 * M); x.lineTo(-2.3 * M, 3 * M); x.moveTo(-4 * M, 1.3 * M); x.lineTo(-4 * M, 4.7 * M); x.stroke();
        x.beginPath(); x.arc(-4 * M, 3 * M, 0.9 * M, 0, Math.PI * 2); x.stroke();
        x.fillStyle = '#6a5038'; x.fillRect(-1.2 * M, 5.6 * M, 2.4 * M, 0.6 * M);
      } else if (it.type === 'laundry') {
        x.fillStyle = '#3a3a3a'; for (const u of [-3.5, 3.5]) x.fillRect(u * M - 0.2 * M, -1.2 * M, 0.4 * M, 2.4 * M);
        x.strokeStyle = 'rgba(230,230,220,0.8)'; x.lineWidth = 0.08 * M;
        x.beginPath(); for (const v of [-0.9, 0, 0.9]) { x.moveTo(-3.5 * M, v * M); x.lineTo(3.5 * M, v * M); } x.stroke();
        for (let k = 0; k < 7; k++) {
          const u = -3 + hash2(k, Math.round(it.x), 3) * 6, v = [-0.9, 0, 0.9][k % 3];
          x.fillStyle = ['#e8e8e0', '#c8d8e8', '#e8c8c8', '#f0e8b0', '#ffffff'][k % 5];
          x.fillRect(u * M, v * M - 0.1 * M, (0.5 + hash2(k, 7, Math.round(it.y)) * 0.6) * M, 0.6 * M);
        }
      } else if (it.type === 'beat') {
        shadow(() => x.fillRect(-1.5 * M, -0.1 * M, 3 * M, 0.2 * M));
        x.fillStyle = '#4a5a4a'; x.fillRect(-1.5 * M, -0.12 * M, 3 * M, 0.24 * M);
        x.fillStyle = '#2a2a2a'; x.fillRect(-1.6 * M, -0.25 * M, 0.35 * M, 0.5 * M); x.fillRect(1.25 * M, -0.25 * M, 0.35 * M, 0.5 * M);
      } else if (it.type === 'trash') {
        x.fillStyle = '#a8a49a'; x.fillRect(-2.6 * M, -1.4 * M, 5.2 * M, 2.8 * M);
        for (let k = 0; k < 3; k++) {
          const u = (-1.7 + k * 1.7) * M;
          shadow(() => x.fillRect(u - 0.6 * M, -0.8 * M, 1.2 * M, 1.5 * M));
          x.fillStyle = k === 1 && it.s > 0.5 ? '#6a6a62' : '#2e5a3a'; x.fillRect(u - 0.6 * M, -0.8 * M, 1.2 * M, 1.5 * M);
          x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(u - 0.6 * M, -0.8 * M, 1.2 * M, 0.3 * M);
        }
        x.fillStyle = 'rgba(200,190,160,0.5)';
        for (let k = 0; k < 5; k++) x.fillRect((hash2(k, 1, Math.round(it.x)) - 0.5) * 6 * M, (1.5 + hash2(k, 2, Math.round(it.y)) * 1.2) * M, 0.4 * M, 0.3 * M);
      } else if (it.type === 'bench') {
        shadow(() => x.fillRect(-0.9 * M, -0.3 * M, 1.8 * M, 0.6 * M));
        x.fillStyle = '#7a5a3a'; x.fillRect(-0.9 * M, -0.3 * M, 1.8 * M, 0.6 * M);
        x.fillStyle = '#5a4028'; x.fillRect(-0.9 * M, -0.3 * M, 1.8 * M, 0.18 * M);
      }
      x.restore();
    }
  };

  G.Yards = Yards;
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
