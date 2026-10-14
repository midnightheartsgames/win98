(function (N) {
  'use strict';

  const PAL = [
    { top: '#1b1440', mid: '#b04a78', hor: '#ffb070', sun: '#ffd9a0', water: '#4a3a66', far: '#5a3a6a', city: '#241a36', lit: ['#ffcf70', '#ffa050', '#ffe6b0'] },
    { top: '#0a1030', mid: '#3a2a6a', hor: '#e0607a', sun: '#ff9a80', water: '#2a2450', far: '#3a2a55', city: '#140f24', lit: ['#ffd080', '#80c8ff', '#ffb060'] },
    { top: '#050814', mid: '#0e1638', hor: '#28305a', sun: '#e8ecff', water: '#10183a', far: '#1a2040', city: '#07080f', lit: ['#ffc860', '#ffe0a0', '#a0c8ff'] },
    { top: '#2a4a8a', mid: '#e89a6a', hor: '#ffe0a0', sun: '#fff4d0', water: '#6a6a8a', far: '#8a6a7a', city: '#3a2a3a', lit: ['#ffd890', '#ffc070', '#fff0c0'] }
  ];

  function curl(x, y, s) {
    const e = 0.9;
    const n = (a, b) => N.fbm(a * 0.006, b * 0.006, 3, s);
    const dx = (n(x, y + e) - n(x, y - e)) / (2 * e);
    const dy = (n(x + e, y) - n(x - e, y)) / (2 * e);
    return [dx, -dy];
  }

  function mixHex(a, b, t) {
    const A = N.hex(a), B = N.hex(b);
    return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
  }

  N.Art = {
    poster(c, seed, opts = {}) {
      const g = c.getContext('2d');
      const W = c.width, H = c.height;
      const r = N.rng(seed);
      const P = PAL[opts.palette !== undefined ? opts.palette : Math.floor(r() * PAL.length)];
      const hy = H * (0.52 + r() * 0.08);
      const sky = g.createLinearGradient(0, 0, 0, hy);
      sky.addColorStop(0, P.top);
      sky.addColorStop(0.55, P.mid);
      sky.addColorStop(1, P.hor);
      g.fillStyle = sky;
      g.fillRect(0, 0, W, hy + 2);
      const sx = W * (0.25 + r() * 0.5), sy = hy - H * (0.04 + r() * 0.1);
      const glow = g.createRadialGradient(sx, sy, 0, sx, sy, W * 0.45);
      glow.addColorStop(0, P.sun + 'cc');
      glow.addColorStop(0.15, P.sun + '55');
      glow.addColorStop(1, P.sun + '00');
      g.fillStyle = glow;
      g.fillRect(0, 0, W, hy);
      g.fillStyle = P.sun;
      g.beginPath();
      g.arc(sx, sy, H * 0.045, 0, 7);
      g.fill();
      for (let k = 0; k < 9; k++) {
        const y = hy * (0.15 + r() * 0.7);
        const h = H * (0.004 + r() * 0.012);
        g.fillStyle = `rgba(${k % 2 ? '255,200,220' : '40,20,60'},${0.12 + r() * 0.2})`;
        g.beginPath();
        for (let x = 0; x <= W; x += 8) {
          const yy = y + Math.sin(x * 0.004 + k) * h * 2 + N.noise2(x * 0.01, k, seed) * h * 3;
          if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy);
        }
        for (let x = W; x >= 0; x -= 8) g.lineTo(x, y + h + Math.sin(x * 0.005 + k * 2) * h);
        g.fill();
      }
      const bankX = W * (0.58 + r() * 0.1);
      g.fillStyle = mixHex(P.far, P.hor, 0.35);
      g.beginPath();
      g.moveTo(bankX, hy);
      for (let x = bankX; x <= W; x += 6) g.lineTo(x, hy - H * 0.08 - N.fbm(x * 0.01, 3, 3, seed) * H * 0.05 - Math.min(1, (x - bankX) / (W * 0.08)) * H * 0.04);
      g.lineTo(W, hy);
      g.fill();
      const kx = bankX + W * 0.08;
      g.fillStyle = mixHex(P.far, '#6a2020', 0.4);
      for (let x = kx; x < kx + W * 0.2; x += W * 0.012) g.fillRect(x, hy - H * 0.135, W * 0.008, H * 0.015);
      g.fillRect(kx, hy - H * 0.125, W * 0.2, H * 0.02);
      for (let i = 0; i < 4; i++) {
        const tx = kx + i * W * 0.065;
        g.fillRect(tx, hy - H * 0.17, W * 0.018, H * 0.06);
        g.beginPath(); g.moveTo(tx - W * 0.002, hy - H * 0.17); g.lineTo(tx + W * 0.009, hy - H * 0.2); g.lineTo(tx + W * 0.02, hy - H * 0.17); g.fill();
      }
      g.fillStyle = mixHex(P.far, P.top, 0.3);
      const tvx = bankX + W * 0.32;
      g.fillRect(tvx, hy - H * 0.3, W * 0.004, H * 0.2);
      g.fillRect(tvx - W * 0.006, hy - H * 0.22, W * 0.016, H * 0.01);
      const water = g.createLinearGradient(0, hy, 0, H);
      water.addColorStop(0, mixHex(P.water, P.hor, 0.45));
      water.addColorStop(1, P.water);
      g.fillStyle = water;
      g.fillRect(0, hy, W, H - hy);
      for (let k = 0; k < 420; k++) {
        const y = hy + Math.pow(r(), 1.6) * (H - hy);
        const x = sx + (r() - 0.5) * W * (0.08 + (y - hy) / H * 0.5);
        const w = 4 + r() * 30 * (y - hy) / H * 3;
        g.fillStyle = `rgba(255,${200 + r() * 55 | 0},${160 + r() * 60 | 0},${0.12 + r() * 0.4})`;
        g.fillRect(x, y, w, 1 + r() * 1.5);
      }
      const layers = [[0.9, 0.35, 0.08], [0.75, 0.55, 0.14], [0.55, 0.8, 0.22]];
      const litCells = [];
      layers.forEach(([depth, scale, hh], li) => {
        const col = mixHex(P.city, P.hor, depth * 0.45);
        let x = -20;
        const base = hy + H * (0.02 + li * 0.06);
        while (x < bankX - W * 0.02 * (2 - li)) {
          const bw = W * (0.03 + r() * 0.07) * scale;
          const tall = r() < 0.25;
          const bh = H * hh * (tall ? 1.8 : 0.6 + r() * 0.7);
          g.fillStyle = col;
          g.fillRect(x, base - bh, bw, bh + H);
          if (r() < 0.5) { g.fillRect(x + bw * 0.3, base - bh - H * 0.02, W * 0.002, H * 0.02); g.fillRect(x + bw * 0.2, base - bh - H * 0.015, bw * 0.3, H * 0.002); }
          const cw = Math.max(2, bw / (6 + r() * 6)), ch = Math.max(2, bh / (5 + (tall ? 11 : 4)));
          for (let wy = base - bh + ch * 0.6; wy < base - ch * 0.3; wy += ch) {
            for (let wx = x + cw * 0.5; wx < x + bw - cw * 0.4; wx += cw) {
              const n = N.fbm(wx * 0.02, wy * 0.02, 3, seed + li);
              if (n > 0.52 - (opts.night ? 0.08 : 0)) litCells.push([wx, wy, cw * 0.55, ch * 0.5, P.lit[Math.floor(r() * P.lit.length)], 0.5 + (n - 0.5) * 2]);
            }
          }
          x += bw + W * (r() < 0.2 ? 0.02 : 0.002);
        }
      });
      for (const [x, y, w, h, c, a] of litCells) { g.globalAlpha = N.clamp(a, 0.3, 1); g.fillStyle = c; g.fillRect(x, y, w, h); }
      g.globalAlpha = 1;
      const chimneys = [];
      for (let i = 0; i < 3; i++) chimneys.push([W * (0.08 + i * 0.07 + r() * 0.03), hy - H * (0.2 + r() * 0.08)]);
      for (const [cx, top] of chimneys) {
        const w = W * 0.012;
        for (let y = top; y < hy + H * 0.05; y += H * 0.03) { g.fillStyle = Math.floor((y - top) / (H * 0.03)) % 2 ? mixHex(P.city, '#c83a2a', 0.5) : mixHex(P.city, '#e8e0d0', 0.4); g.fillRect(cx - w / 2, y, w, H * 0.03); }
        g.fillStyle = '#ff3030';
        g.beginPath(); g.arc(cx, top - 3, 2.5, 0, 7); g.fill();
        for (let p = 0; p < 90; p++) {
          let x = cx + (r() - 0.5) * w, y = top;
          g.beginPath();
          g.moveTo(x, y);
          for (let s = 0; s < 60; s++) {
            const v = curl(x, y, seed + 9);
            x += v[0] * 600 + 1.2;
            y += v[1] * 300 - 1.6;
            g.lineTo(x, y);
          }
          g.strokeStyle = `rgba(${220 + r() * 30 | 0},${190 + r() * 40 | 0},${200 + r() * 40 | 0},0.035)`;
          g.lineWidth = 2 + r() * 5;
          g.stroke();
        }
      }
      const fy = H * 0.86;
      g.fillStyle = mixHex(P.city, '#000', 0.5);
      g.fillRect(0, fy, bankX, H - fy);
      for (let i = 0; i < 7; i++) {
        const tx = W * (0.02 + r() * 0.5), th = H * (0.25 + r() * 0.2), tw = W * (0.018 + r() * 0.02);
        for (let k = 0; k < 140; k++) {
          const a = r() * Math.PI * 2, rr = Math.sqrt(r());
          const px = tx + Math.cos(a) * tw * rr, py = fy - th * 0.55 + Math.sin(a) * th * 0.45 * rr;
          g.fillStyle = `rgba(${10 + r() * 20 | 0},${14 + r() * 20 | 0},${24 + r() * 20 | 0},0.6)`;
          g.beginPath(); g.ellipse(px, py, tw * 0.25, th * 0.05, a, 0, 7); g.fill();
        }
        g.fillRect(tx - 2, fy - th * 0.2, 4, th * 0.2);
      }
      const lx = W * (0.3 + r() * 0.15);
      g.fillStyle = '#08080c';
      g.fillRect(lx, fy - H * 0.3, 4, H * 0.3);
      g.fillRect(lx, fy - H * 0.3, W * 0.03, 4);
      const halo = g.createRadialGradient(lx + W * 0.03, fy - H * 0.29, 0, lx + W * 0.03, fy - H * 0.29, H * 0.12);
      halo.addColorStop(0, 'rgba(255,210,140,0.85)');
      halo.addColorStop(1, 'rgba(255,160,80,0)');
      g.fillStyle = halo;
      g.fillRect(lx - H * 0.12, fy - H * 0.42, H * 0.3, H * 0.3);
      const carX = W * (0.05 + r() * 0.2), carY = fy + H * 0.05, cl = W * 0.16, chh = H * 0.05;
      g.fillStyle = '#050508';
      g.beginPath();
      g.moveTo(carX, carY); g.lineTo(carX, carY - chh * 0.8); g.lineTo(carX + cl * 0.22, carY - chh);
      g.lineTo(carX + cl * 0.32, carY - chh * 1.9); g.lineTo(carX + cl * 0.66, carY - chh * 1.9); g.lineTo(carX + cl * 0.78, carY - chh);
      g.lineTo(carX + cl, carY - chh * 0.85); g.lineTo(carX + cl, carY); g.closePath(); g.fill();
      for (const wx of [0.2, 0.8]) { g.beginPath(); g.arc(carX + cl * wx, carY, chh * 0.55, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,60,50,0.9)';
      g.fillRect(carX, carY - chh * 0.7, 5, 4);
      const img = g.getImageData(0, 0, W, H);
      const d = img.data;
      for (let y = 0; y < H; y++) {
        const scan = y % 3 === 0 ? 0.93 : 1;
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const vx = x / W - 0.5, vy = y / H - 0.5;
          const vig = 1 - (vx * vx + vy * vy) * 0.9;
          const gr = (N.hash2(x, y, seed) - 0.5) * 18;
          d[i] = N.clamp(d[i] * vig * scan + gr, 0, 255);
          d[i + 1] = N.clamp(d[i + 1] * vig * scan + gr, 0, 255);
          d[i + 2] = N.clamp(d[i + 2] * vig * scan + gr, 0, 255);
        }
      }
      g.putImageData(img, 0, 0);
      return c;
    },

    logo(c, opts = {}) {
      const g = c.getContext('2d');
      const W = c.width, H = c.height;
      g.clearRect(0, 0, W, H);
      g.save();
      g.translate(W / 2, H / 2);
      g.transform(1, 0, -0.18, 1, 0, 0);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `900 ${H * 0.16 | 0}px "Arial Black", Impact, Arial`;
      g.lineWidth = H * 0.03;
      g.strokeStyle = '#000';
      g.strokeText('GRAND THEFT AUTO', 0, -H * 0.3);
      g.fillStyle = '#f4f0e8';
      g.fillText('GRAND THEFT AUTO', 0, -H * 0.3);
      g.font = `900 ${H * 0.42 | 0}px "Arial Black", Impact, Arial`;
      const gr = g.createLinearGradient(0, -H * 0.1, 0, H * 0.35);
      gr.addColorStop(0, '#ff5ab0');
      gr.addColorStop(0.5, '#ffb04a');
      gr.addColorStop(1, '#ffe07a');
      g.lineWidth = H * 0.06;
      g.strokeText('НИЖНИЙ', 0, H * 0.1);
      g.fillStyle = gr;
      g.fillText('НИЖНИЙ', 0, H * 0.1);
      g.font = `italic 900 ${H * 0.2 | 0}px "Brush Script MT", "Segoe Script", Georgia, serif`;
      g.lineWidth = H * 0.035;
      g.strokeText('Сити', W * 0.3, H * 0.36);
      g.fillStyle = '#7ae0ff';
      g.fillText('Сити', W * 0.3, H * 0.36);
      g.restore();
      return c;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
