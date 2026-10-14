(function (N) {
  'use strict';

  const S = 256;

  function tileNoise(period, seed, oct) {
    const out = new Float32Array(S * S);
    for (let o = 0; o < oct; o++) {
      const P = period << o;
      const amp = Math.pow(0.5, o);
      const lat = new Float32Array(P * P);
      for (let i = 0; i < P * P; i++) lat[i] = N.hash2(i % P, (i / P) | 0, seed + o * 31);
      for (let y = 0; y < S; y++) {
        const fy = y / S * P, yi = Math.floor(fy), ty = fy - yi, sy = ty * ty * (3 - 2 * ty);
        const y0 = yi % P, y1 = (yi + 1) % P;
        for (let x = 0; x < S; x++) {
          const fx = x / S * P, xi = Math.floor(fx), tx = fx - xi, sx = tx * tx * (3 - 2 * tx);
          const x0 = xi % P, x1 = (xi + 1) % P;
          const a = lat[y0 * P + x0], b = lat[y0 * P + x1], c = lat[y1 * P + x0], d = lat[y1 * P + x1];
          out[y * S + x] += ((a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy) * amp;
        }
      }
    }
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < out.length; i++) { if (out[i] < mn) mn = out[i]; if (out[i] > mx) mx = out[i]; }
    for (let i = 0; i < out.length; i++) out[i] = (out[i] - mn) / (mx - mn || 1);
    return out;
  }

  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  N.hex = hex;

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h || w;
    return c;
  }

  class Tex {
    constructor() {
      this.names = {};
      this.layers = [];
      this.noise = [];
    }

    build(progress) {
      this.noise = [tileNoise(4, 11, 5), tileNoise(8, 23, 4), tileNoise(16, 37, 3), tileNoise(2, 41, 4), tileNoise(32, 53, 2), tileNoise(6, 67, 4)];
      const list = Object.keys(LAYERS);
      list.forEach((name, i) => {
        const c = canvas(S);
        const g = c.getContext('2d');
        const rng = N.rng(1000 + i * 77);
        LAYERS[name].call(this, g, rng, c);
        this.names[name] = i;
        this.layers.push(c);
        if (progress) progress(i / list.length);
      });
      return this;
    }

    pixels(g, fn) {
      const img = g.getImageData(0, 0, S, S);
      const d = img.data;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = (y * S + x) * 4; fn(x, y, d, i, y * S + x); }
      g.putImageData(img, 0, 0);
    }

    tone(g, base, amt, nidx, sat) {
      const [r, gg, b] = hex(base);
      const n = this.noise[nidx || 0];
      this.pixels(g, (x, y, d, i, k) => {
        const v = 1 + (n[k] - 0.5) * amt;
        d[i] = N.clamp(r * v, 0, 255); d[i + 1] = N.clamp(gg * v, 0, 255); d[i + 2] = N.clamp(b * v * (sat || 1), 0, 255); d[i + 3] = 255;
      });
    }

    grime(g, amt, nidx) {
      const n = this.noise[nidx || 1];
      this.pixels(g, (x, y, d, i, k) => {
        const v = 1 - Math.max(0, n[k] - 0.55) * amt - (y / S) * amt * 0.25;
        d[i] *= v; d[i + 1] *= v; d[i + 2] *= v;
      });
    }

    glassMask(g, x0, y0, w, h) {
      const img = g.getImageData(x0, y0, w, h);
      for (let i = 3; i < img.data.length; i += 4) img.data[i] = 0;
      g.putImageData(img, x0, y0);
    }

    window(g, x, y, w, h, o = {}) {
      const frame = o.frame || '#e8e4dc';
      g.fillStyle = o.recess || 'rgba(0,0,0,0.35)';
      g.fillRect(x - 3, y - 3, w + 6, h + 6);
      g.fillStyle = frame;
      g.fillRect(x, y, w, h);
      const fw = o.fw || 5;
      const panes = o.panes || 3;
      const glassCol = o.glass || '#2a3a4c';
      const inner = [];
      const colW = (w - fw * (panes + 1)) / panes;
      for (let p = 0; p < panes; p++) {
        const gx = x + fw + p * (colW + fw);
        if (o.transom) {
          const th = Math.round(h * 0.28);
          inner.push([gx, y + fw, colW, th - fw]);
          inner.push([gx, y + th + fw, colW, h - th - fw * 2]);
        } else inner.push([gx, y + fw, colW, h - fw * 2]);
      }
      for (const [gx, gy, gw, gh] of inner) {
        const gr = g.createLinearGradient(gx, gy, gx + gw, gy + gh);
        gr.addColorStop(0, glassCol);
        gr.addColorStop(0.5, o.glass2 || '#4a5a6c');
        gr.addColorStop(1, glassCol);
        g.fillStyle = gr;
        g.fillRect(gx, gy, gw, gh);
        if (o.curtain) {
          g.fillStyle = o.curtain;
          g.globalAlpha = 0.35;
          g.fillRect(gx, gy, gw * 0.35, gh);
          g.globalAlpha = 1;
        }
        this.glassMask(g, Math.round(gx), Math.round(gy), Math.max(1, Math.round(gw)), Math.max(1, Math.round(gh)));
      }
      if (o.sill) { g.fillStyle = o.sill; g.fillRect(x - 6, y + h, w + 12, 7); }
    }

    bricks(g, col, mortar, bw, bh, jitter) {
      g.fillStyle = mortar;
      g.fillRect(0, 0, S, S);
      const [r, gg, b] = hex(col);
      const rng = N.rng(77);
      for (let row = 0; row * bh < S; row++) {
        const off = (row % 2) * bw / 2;
        for (let x = -bw; x < S + bw; x += bw) {
          const v = 1 + (rng() - 0.5) * jitter;
          g.fillStyle = `rgb(${N.clamp(r * v, 0, 255) | 0},${N.clamp(gg * v, 0, 255) | 0},${N.clamp(b * v, 0, 255) | 0})`;
          g.fillRect(x + off + 1, row * bh + 1, bw - 2, bh - 2);
        }
      }
    }
  }

  const LAYERS = {
    grass(g) {
      const n = this.noise[0], m = this.noise[3], q = this.noise[5];
      this.pixels(g, (x, y, d, i, k) => {
        const v = n[k] * 0.6 + m[k] * 0.4;
        const dry = N.smooth(0.62, 0.9, q[k]) * 0.6;
        d[i] = 58 + v * 34 + dry * 40; d[i + 1] = 86 + v * 42 + dry * 16; d[i + 2] = 40 + v * 18; d[i + 3] = 255;
      });
      const rng = N.rng(5);
      for (let k = 0; k < 1400; k++) {
        g.fillStyle = rng() < 0.5 ? 'rgba(40,70,25,0.5)' : 'rgba(140,170,80,0.35)';
        const x = rng() * S, y = rng() * S;
        g.fillRect(x, y, 1, 2 + rng() * 3);
      }
      for (let k = 0; k < 12; k++) { g.fillStyle = rng() < 0.5 ? '#e8e070' : '#f0f0f0'; g.fillRect(rng() * S, rng() * S, 2, 2); }
    },
    sidewalk(g) {
      this.tone(g, '#9a9894', 0.25, 1);
      g.strokeStyle = 'rgba(40,40,40,0.35)';
      g.lineWidth = 2;
      for (let x = 0; x <= S; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S); g.stroke(); }
      for (let y = 0; y <= S; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
      const rng = N.rng(9);
      for (let k = 0; k < 30; k++) { g.strokeStyle = 'rgba(30,30,30,0.3)'; g.lineWidth = 1; g.beginPath(); let x = rng() * S, y = rng() * S; g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (rng() - 0.5) * 20; y += (rng() - 0.5) * 20; g.lineTo(x, y); } g.stroke(); }
      this.grime(g, 0.5, 4);
    },
    asphalt(g) {
      const n = this.noise[3], m = this.noise[1];
      this.pixels(g, (x, y, d, i, k) => {
        const h = N.hash2(x, y, 3);
        const v = 58 + n[k] * 22 + (h - 0.5) * 26 - Math.max(0, m[k] - 0.6) * 40;
        d[i] = v; d[i + 1] = v; d[i + 2] = v + 3; d[i + 3] = 255;
      });
      const rng = N.rng(12);
      g.strokeStyle = 'rgba(20,20,22,0.28)';
      for (let k = 0; k < 8; k++) { g.lineWidth = 0.8; g.beginPath(); let x = rng() * S, y = rng() * S; g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (rng() - 0.5) * 14; y += (rng() - 0.5) * 14; g.lineTo(x, y); } g.stroke(); }
      for (let k = 0; k < 2; k++) { g.fillStyle = 'rgba(30,30,32,0.22)'; g.fillRect(rng() * S, rng() * S, 20 + rng() * 40, 14 + rng() * 30); }
    },
    asphalt2(g) {
      LAYERS.asphalt.call(this, g);
      const rng = N.rng(19);
      for (let k = 0; k < 6; k++) { g.fillStyle = rng() < 0.5 ? 'rgba(90,90,92,0.6)' : 'rgba(40,40,42,0.6)'; g.fillRect(rng() * S, rng() * S, 30 + rng() * 80, 20 + rng() * 60); }
      for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(70,80,60,0.5)'; g.beginPath(); g.ellipse(rng() * S, rng() * S, 20 + rng() * 20, 10 + rng() * 10, 0, 0, 7); g.fill(); }
    },
    dirt(g) {
      const n = this.noise[0], m = this.noise[3];
      this.pixels(g, (x, y, d, i, k) => {
        const v = n[k] * 0.6 + m[k] * 0.4 + (N.hash2(x, y, 8) - 0.5) * 0.2;
        d[i] = 104 + v * 50; d[i + 1] = 88 + v * 40; d[i + 2] = 62 + v * 28; d[i + 3] = 255;
      });
      const rng = N.rng(21);
      for (let k = 0; k < 300; k++) { g.fillStyle = rng() < 0.5 ? 'rgba(60,50,40,0.6)' : 'rgba(170,160,140,0.6)'; g.fillRect(rng() * S, rng() * S, 2, 2); }
      g.fillStyle = 'rgba(70,58,40,0.35)';
      g.fillRect(40, 0, 22, S);
      g.fillRect(190, 0, 22, S);
    },
    concrete(g) {
      this.tone(g, '#8e8c86', 0.3, 0);
      g.strokeStyle = 'rgba(40,40,36,0.5)';
      g.lineWidth = 3;
      g.strokeRect(1, 1, S - 2, S / 2 - 2);
      g.strokeRect(1, S / 2 + 1, S - 2, S / 2 - 2);
      this.grime(g, 0.6, 1);
      const rng = N.rng(31);
      for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(40,36,30,0.25)'; g.beginPath(); g.ellipse(rng() * S, rng() * S, 18, 10, rng() * 3, 0, 7); g.fill(); }
    },
    gravel(g) {
      this.tone(g, '#b8a888', 0.2, 3);
      const rng = N.rng(41);
      for (let k = 0; k < 1500; k++) { const v = 120 + rng() * 100; g.fillStyle = `rgb(${v},${v * 0.92},${v * 0.8})`; g.fillRect(rng() * S, rng() * S, 2, 2); }
    },
    sand(g) {
      const n = this.noise[3];
      this.pixels(g, (x, y, d, i, k) => { const v = n[k] * 0.3 + N.hash2(x, y, 4) * 0.2; d[i] = 200 + v * 40; d[i + 1] = 180 + v * 40; d[i + 2] = 130 + v * 30; d[i + 3] = 255; });
    },
    ballast(g) {
      this.tone(g, '#6a6258', 0.3, 3);
      const rng = N.rng(55);
      for (let k = 0; k < 2000; k++) { const v = 70 + rng() * 80; g.fillStyle = `rgb(${v},${v * 0.95},${v * 0.9})`; g.fillRect(rng() * S, rng() * S, 3, 2); }
    },
    sleepers(g) {
      LAYERS.ballast.call(this, g);
      for (let y = 8; y < S; y += 42) { g.fillStyle = '#3a2e24'; g.fillRect(20, y, 216, 18); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(20, y + 14, 216, 4); }
    },
    plaza(g) {
      g.fillStyle = '#8a8680';
      g.fillRect(0, 0, S, S);
      const rng = N.rng(61);
      for (let y = 0; y < S; y += 32) for (let x = 0; x < S; x += 32) {
        const v = 150 + rng() * 40 + ((x + y) / 32 % 2 ? 10 : -10);
        g.fillStyle = `rgb(${v},${v * 0.96},${v * 0.9})`;
        g.fillRect(x + 1, y + 1, 30, 30);
      }
      this.grime(g, 0.5, 1);
    },
    pitch(g) {
      const n = this.noise[3];
      this.pixels(g, (x, y, d, i, k) => { const band = Math.floor(y / 64) % 2; const v = n[k] * 0.3; d[i] = 50 + v * 30 + band * 10; d[i + 1] = 120 + v * 40 + band * 16; d[i + 2] = 40 + v * 15; d[i + 3] = 255; });
    },
    granite(g) {
      const n = this.noise[3];
      this.pixels(g, (x, y, d, i, k) => { const h = N.hash2(x, y, 6); const v = 130 + n[k] * 40 + (h > 0.9 ? 40 : h < 0.08 ? -40 : 0); d[i] = v * 1.04; d[i + 1] = v * 0.96; d[i + 2] = v * 0.94; d[i + 3] = 255; });
      g.strokeStyle = 'rgba(40,36,34,0.6)';
      g.lineWidth = 2;
      for (let y = 0; y <= S; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
      for (let x = 0; x <= S; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S); g.stroke(); }
    },
    forestfloor(g) {
      const n = this.noise[0];
      this.pixels(g, (x, y, d, i, k) => { const v = n[k]; d[i] = 50 + v * 40; d[i + 1] = 58 + v * 40; d[i + 2] = 30 + v * 15; d[i + 3] = 255; });
      const rng = N.rng(71);
      for (let k = 0; k < 400; k++) { g.fillStyle = rng() < 0.5 ? '#6a4a2a' : '#8a7a3a'; g.fillRect(rng() * S, rng() * S, 3, 1); }
    },
    field(g) {
      const n = this.noise[1];
      this.pixels(g, (x, y, d, i, k) => { const v = n[k] + Math.sin(x * 0.4) * 0.05; d[i] = 130 + v * 50; d[i + 1] = 140 + v * 40; d[i + 2] = 70 + v * 20; d[i + 3] = 255; });
    },
    curb(g) {
      this.tone(g, '#aaa8a2', 0.3, 3);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let x = 0; x < S; x += 64) g.fillRect(x, 0, 2, S);
      this.grime(g, 0.8, 1);
    },
    paint(g) {
      const n = this.noise[3];
      this.pixels(g, (x, y, d, i, k) => { const wear = n[k] + (N.hash2(x, y, 2) - 0.5) * 0.4; d[i] = 235; d[i + 1] = 232; d[i + 2] = 220; d[i + 3] = wear > 0.28 ? 255 : 0; });
    },
    paintyellow(g) {
      const n = this.noise[3];
      this.pixels(g, (x, y, d, i, k) => { const wear = n[k] + (N.hash2(x, y, 2) - 0.5) * 0.4; d[i] = 230; d[i + 1] = 190; d[i + 2] = 40; d[i + 3] = wear > 0.3 ? 255 : 0; });
    },
    khrush(g) {
      this.tone(g, '#d4d2ca', 0.14, 1);
      g.fillStyle = 'rgba(60,60,60,0.42)';
      g.fillRect(0, 0, 3, S);
      g.fillRect(0, S - 3, S, 3);
      this.window(g, 58, 70, 140, 128, { panes: 3, frame: '#ece8dc', sill: '#9a968e', transom: true, curtain: '#e0d8c0' });
      this.grime(g, 0.45, 4);
    },
    brick5(g) {
      this.bricks(g, '#b0503a', '#c8b8a8', 32, 12, 0.25);
      g.fillStyle = '#c8c4bc';
      g.fillRect(50, 58, 156, 10);
      this.window(g, 60, 70, 136, 130, { panes: 3, frame: '#f0ece0', sill: '#b8b4ac', transom: true });
      this.grime(g, 0.5, 4);
    },
    panel9(g) {
      this.tone(g, '#dddad0', 0.12, 1);
      g.fillStyle = 'rgba(70,70,70,0.4)';
      g.fillRect(0, 0, 3, S);
      g.fillRect(0, S - 4, S, 4);
      this.window(g, 40, 50, 176, 118, { panes: 4, frame: '#eceae2', transom: true, glass2: '#5a6a7a' });
      g.fillStyle = '#b8b4a8';
      g.fillRect(24, 170, 208, 64);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(24, 232, 208, 6);
      for (let x = 30; x < 230; x += 12) { g.fillStyle = 'rgba(80,80,80,0.2)'; g.fillRect(x, 172, 2, 58); }
      this.grime(g, 0.4, 4);
    },
    panel9b(g) {
      g.fillStyle = '#d8c89a';
      g.fillRect(0, 0, S, S);
      g.strokeStyle = 'rgba(120,100,70,0.35)';
      g.lineWidth = 1;
      for (let x = 0; x <= S; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S); g.stroke(); }
      for (let y = 0; y <= S; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
      this.window(g, 48, 56, 160, 124, { panes: 3, frame: '#f4f0e4', transom: true, sill: '#a89878' });
      g.fillStyle = '#c0b088';
      g.fillRect(0, 200, S, 12);
      this.grime(g, 0.4, 4);
    },
    panel16(g) {
      this.tone(g, '#e2e2dc', 0.12, 1);
      g.fillStyle = '#5a7aa8';
      g.fillRect(0, 186, S, 52);
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.fillRect(0, 236, S, 4);
      this.window(g, 44, 46, 168, 130, { panes: 4, frame: '#f4f4f0', transom: true });
      this.grime(g, 0.45, 4);
    },
    panel16b(g) {
      this.tone(g, '#e0d0c8', 0.12, 1);
      g.fillStyle = '#b86a58';
      g.fillRect(0, 186, S, 52);
      this.window(g, 44, 46, 168, 130, { panes: 4, frame: '#f4f4f0', transom: true });
      this.grime(g, 0.45, 4);
    },
    stalin(g) {
      this.tone(g, '#e4c88e', 0.12, 1);
      g.fillStyle = '#f2e6c8';
      g.fillRect(0, 0, S, 18);
      g.fillStyle = 'rgba(80,60,30,0.3)';
      g.fillRect(0, 18, S, 4);
      g.fillStyle = '#ecdcb8';
      g.fillRect(70, 36, 116, 14);
      g.beginPath(); g.moveTo(64, 36); g.lineTo(128, 22); g.lineTo(192, 36); g.fill();
      this.window(g, 80, 56, 96, 160, { panes: 2, frame: '#f4ecd8', transom: true, sill: '#e8d8b0', fw: 6 });
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.fillRect(0, 236, S, 20);
      this.grime(g, 0.38, 4);
    },
    stalinb(g) {
      this.tone(g, '#dcb4a2', 0.12, 1);
      g.fillStyle = '#f0dccf';
      g.fillRect(0, 0, S, 16);
      g.fillRect(74, 38, 108, 12);
      this.window(g, 82, 56, 92, 160, { panes: 2, frame: '#f4ecd8', transom: true, sill: '#e0c8b8', fw: 6 });
      this.grime(g, 0.38, 4);
    },
    constr(g) {
      this.tone(g, '#ddcfb2', 0.12, 1);
      for (const x of [30, 150]) this.window(g, x, 62, 76, 132, { panes: 2, frame: '#f0ebe0', fw: 5, transom: true, sill: '#b8ab92', recess: 'rgba(60,45,25,0.3)', curtain: '#e8dcc4' });
      g.fillStyle = 'rgba(120,100,70,0.18)';
      g.fillRect(0, 0, S, 6);
      this.grime(g, 0.5, 4);
    },
    shopfront(g) {
      g.fillStyle = '#6a6862';
      g.fillRect(0, 0, S, S);
      g.fillStyle = '#8a2a2a';
      g.fillRect(0, 0, S, 60);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(0, 58, S, 4);
      this.window(g, 12, 76, 232, 170, { panes: 3, frame: '#3a3a3a', glass: '#1a2a38', glass2: '#3a4e60', fw: 6 });
      this.grime(g, 0.5, 4);
    },
    hotel(g) {
      this.tone(g, '#cfcbc0', 0.1, 1);
      this.window(g, 10, 30, 236, 150, { panes: 4, frame: '#8a8a88', glass: '#26384a', glass2: '#5a7a96', fw: 5 });
      g.fillStyle = '#e8e4dc';
      g.fillRect(0, 196, S, 40);
      this.grime(g, 0.4, 4);
    },
    club(g) {
      this.tone(g, '#1a1420', 0.2, 1);
      g.fillStyle = '#8a1a6a';
      g.fillRect(0, 20, S, 6);
      g.fillStyle = '#1a8aa8';
      g.fillRect(0, 230, S, 6);
      for (let x = 20; x < S; x += 64) { g.fillStyle = '#2a2030'; g.fillRect(x, 40, 30, 180); }
    },
    ovd(g) {
      this.tone(g, '#d8c8a8', 0.14, 1);
      this.window(g, 70, 60, 116, 130, { panes: 2, frame: '#f0ece0', transom: true, sill: '#b8a888' });
      g.strokeStyle = '#3a3a3a';
      g.lineWidth = 3;
      for (let x = 78; x < 186; x += 14) { g.beginPath(); g.moveTo(x, 62); g.lineTo(x, 188); g.stroke(); }
      this.grime(g, 0.6, 4);
    },
    hospital(g) {
      g.fillStyle = '#e8ece8';
      g.fillRect(0, 0, S, S);
      g.strokeStyle = 'rgba(120,130,130,0.3)';
      for (let x = 0; x <= S; x += 20) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S); g.stroke(); }
      for (let y = 0; y <= S; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
      this.window(g, 50, 60, 156, 126, { panes: 3, frame: '#ffffff', transom: true, glass: '#3a4a58' });
      this.grime(g, 0.5, 4);
    },
    school(g) {
      this.bricks(g, '#c86a4a', '#d8c8b8', 32, 12, 0.2);
      this.window(g, 20, 40, 216, 170, { panes: 4, frame: '#f4f0e8', transom: true, sill: '#d8d4cc' });
      this.grime(g, 0.4, 4);
    },
    kinder(g) {
      this.tone(g, '#e8d890', 0.12, 1);
      g.fillStyle = '#e07a5a';
      g.fillRect(0, 0, S, 24);
      this.window(g, 50, 60, 156, 130, { panes: 3, frame: '#ffffff', transom: true });
      this.grime(g, 0.4, 4);
    },
    cinema(g) {
      this.tone(g, '#b0aca4', 0.14, 1);
      const cols = ['#c83a2a', '#2a6ac8', '#e8c83a', '#3a9a5a', '#e8e4d8'];
      const rng = N.rng(91);
      for (let y = 30; y < 226; y += 14) for (let x = 20; x < 236; x += 14) { g.fillStyle = cols[Math.floor(rng() * cols.length)]; g.fillRect(x, y, 12, 12); }
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.fillRect(0, 240, S, 16);
    },
    dk(g) {
      this.tone(g, '#e0d0b0', 0.1, 1);
      g.fillStyle = '#f0e4c8';
      g.fillRect(0, 0, S, 24);
      g.fillRect(0, 232, S, 24);
      g.fillStyle = '#f0e4c8';
      g.fillRect(90, 40, 76, 190);
      this.window(g, 100, 60, 56, 150, { panes: 2, frame: '#f8f0e0', transom: true, fw: 5 });
      g.fillStyle = 'rgba(120,90,40,0.2)';
      g.fillRect(20, 40, 8, 190);
      g.fillRect(228, 40, 8, 190);
      this.grime(g, 0.35, 4);
    },
    factory(g) {
      this.bricks(g, '#9a4a36', '#b0a090', 32, 12, 0.3);
      this.window(g, 28, 40, 200, 170, { panes: 5, frame: '#5a6060', glass: '#4a5a58', glass2: '#6a7a74', fw: 4 });
      g.strokeStyle = '#5a6060';
      g.lineWidth = 3;
      for (let y = 40; y < 210; y += 28) { g.beginPath(); g.moveTo(28, y); g.lineTo(228, y); g.stroke(); }
      this.grime(g, 1.0, 4);
    },
    hall(g) {
      this.tone(g, '#a8a8a0', 0.2, 1);
      g.fillStyle = 'rgba(40,40,40,0.4)';
      g.fillRect(0, 0, 3, S);
      g.fillRect(0, 126, S, 3);
      this.window(g, 0, 150, S, 70, { panes: 6, frame: '#6a6e6e', glass: '#4a5a5c', fw: 4 });
      this.grime(g, 1.1, 4);
    },
    wood(g) {
      g.fillStyle = '#7a5a3a';
      g.fillRect(0, 0, S, S);
      const rng = N.rng(101);
      for (let y = 0; y < S; y += 16) {
        const v = 0.8 + rng() * 0.3;
        g.fillStyle = `rgb(${110 * v | 0},${80 * v | 0},${52 * v | 0})`;
        g.fillRect(0, y + 1, S, 14);
        g.fillStyle = 'rgba(0,0,0,0.3)';
        g.fillRect(0, y + 14, S, 2);
      }
      g.fillStyle = '#e8e0d0';
      g.fillRect(74, 50, 108, 136);
      g.beginPath(); g.moveTo(66, 50); g.lineTo(128, 30); g.lineTo(190, 50); g.fill();
      g.fillRect(66, 186, 124, 10);
      this.window(g, 86, 62, 84, 114, { panes: 2, frame: '#f0ead8', transom: true, fw: 6, curtain: '#e8c8a8' });
      g.fillStyle = '#3a7aa8';
      g.fillRect(74, 50, 8, 136);
      g.fillRect(174, 50, 8, 136);
    },
    plank(g) {
      const rng = N.rng(111);
      for (let x = 0; x < S; x += 16) {
        const v = 0.7 + rng() * 0.4;
        g.fillStyle = `rgb(${120 * v | 0},${96 * v | 0},${66 * v | 0})`;
        g.fillRect(x, 0, 15, S);
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(x + 15, 0, 1, S);
      }
      this.grime(g, 0.9, 1);
    },
    garage(g) {
      g.fillStyle = '#9a968e';
      g.fillRect(0, 0, S, S);
      const cols = ['#3a5a3a', '#3a4a6a', '#6a3a2a', '#5a5a5a'];
      g.fillStyle = cols[1];
      g.fillRect(14, 30, 228, 226);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(126, 30, 4, 226);
      for (let y = 40; y < 250; y += 24) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(14, y, 228, 3); }
      g.fillStyle = '#c8c0a8';
      g.fillRect(120, 140, 4, 18);
      this.grime(g, 1.2, 1);
      this.pixels(g, (x, y, d, i, k) => { const r = this.noise[0][k]; if (r > 0.72 && y > 30) { d[i] = d[i] * 0.6 + 120 * 0.4; d[i + 1] = d[i + 1] * 0.6 + 60 * 0.4; d[i + 2] *= 0.6; } });
    },
    container(g) {
      g.fillStyle = '#d0d0d0';
      g.fillRect(0, 0, S, S);
      for (let x = 0; x < S; x += 12) { g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(x, 0, 5, S); }
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(0, 0, S, 8);
      g.fillRect(0, S - 8, S, 8);
      this.grime(g, 0.7, 1);
    },
    warehouse(g) {
      g.fillStyle = '#b8bcbc';
      g.fillRect(0, 0, S, S);
      for (let x = 0; x < S; x += 16) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, 0, 7, S); }
      g.fillStyle = '#3a6a8a';
      g.fillRect(0, 0, S, 16);
      this.grime(g, 1.0, 1);
    },
    service(g) {
      this.tone(g, '#c0bcb0', 0.2, 1);
      g.fillStyle = '#4a5a6a';
      g.fillRect(40, 60, 176, 196);
      for (let y = 66; y < 256; y += 16) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(40, y, 176, 3); }
      this.grime(g, 1, 4);
    },
    booth(g) {
      this.tone(g, '#d8d8d0', 0.1, 1);
      this.window(g, 30, 60, 196, 120, { panes: 2, frame: '#4a6a4a' });
    },
    glass(g) {
      g.fillStyle = '#6a7a84';
      g.fillRect(0, 0, S, S);
      this.window(g, 0, 0, S, S, { panes: 2, frame: '#3a3e42', glass: '#2a3a48', glass2: '#6a8aa4', fw: 6, recess: 'rgba(0,0,0,0)' });
    },
    plaster(g) {
      this.tone(g, '#c8c0b0', 0.2, 1);
      this.grime(g, 0.6, 4);
    },
    tar(g) {
      const n = this.noise[1];
      this.pixels(g, (x, y, d, i, k) => { const v = 48 + n[k] * 26 + (N.hash2(x, y, 5) - 0.5) * 14; d[i] = v; d[i + 1] = v * 0.98; d[i + 2] = v * 0.95; d[i + 3] = 255; });
      g.strokeStyle = 'rgba(0,0,0,0.3)';
      for (let y = 0; y < S; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
    },
    roofmetal(g) {
      for (let x = 0; x < S; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#7a3a2a'); gr.addColorStop(0.5, '#9a5a42'); gr.addColorStop(1, '#6a3022'); g.fillStyle = gr; g.fillRect(x, 0, 16, S); }
      this.grime(g, 1, 1);
    },
    roofgreen(g) {
      for (let x = 0; x < S; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#3a5a3a'); gr.addColorStop(0.5, '#5a7a52'); gr.addColorStop(1, '#2a4a2a'); g.fillStyle = gr; g.fillRect(x, 0, 16, S); }
      this.grime(g, 1, 1);
    },
    slate(g) {
      for (let x = 0; x < S; x += 12) { const gr = g.createLinearGradient(x, 0, x + 12, 0); gr.addColorStop(0, '#8a8c88'); gr.addColorStop(0.5, '#a8aaa4'); gr.addColorStop(1, '#7a7c78'); g.fillStyle = gr; g.fillRect(x, 0, 12, S); }
      g.fillStyle = 'rgba(0,0,0,0.2)';
      for (let y = 0; y < S; y += 64) g.fillRect(0, y, S, 2);
      this.grime(g, 1, 1);
    },
    concfence(g) {
      this.tone(g, '#a4a29a', 0.2, 1);
      g.strokeStyle = 'rgba(60,60,56,0.55)';
      g.lineWidth = 3;
      g.strokeRect(2, 2, S - 4, S - 4);
      for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) {
        const cx = 32 + x * 64, cy = 44 + y * 84;
        g.fillStyle = 'rgba(255,255,255,0.18)';
        g.beginPath(); g.moveTo(cx, cy - 30); g.lineTo(cx + 26, cy); g.lineTo(cx, cy + 30); g.lineTo(cx - 26, cy); g.closePath(); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.beginPath(); g.moveTo(cx, cy + 30); g.lineTo(cx + 26, cy); g.lineTo(cx + 18, cy); g.lineTo(cx, cy + 20); g.closePath(); g.fill();
      }
      this.grime(g, 1, 4);
      g.fillStyle = 'rgba(40,40,120,0.5)';
      g.font = 'bold 30px Arial';
      g.fillText('ЦОЙ ЖИВ', 40, 200);
    },
    metal(g) {
      for (let x = 0; x < S; x += 10) { const gr = g.createLinearGradient(x, 0, x + 10, 0); gr.addColorStop(0, '#6a6e6a'); gr.addColorStop(0.5, '#8a8e88'); gr.addColorStop(1, '#5a5e5a'); g.fillStyle = gr; g.fillRect(x, 0, 10, S); }
      this.pixels(g, (x, y, d, i, k) => { const r = this.noise[0][k]; if (r > 0.6) { const t = (r - 0.6) * 2; d[i] = d[i] * (1 - t) + 130 * t; d[i + 1] = d[i + 1] * (1 - t) + 70 * t; d[i + 2] = d[i + 2] * (1 - t) + 40 * t; } });
    },
    barrier(g) {
      for (let x = -S; x < S * 2; x += 64) { g.fillStyle = '#d82a2a'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 32, 0); g.lineTo(x + 32 + S, S); g.lineTo(x + S, S); g.fill(); g.fillStyle = '#f0f0f0'; g.beginPath(); g.moveTo(x + 32, 0); g.lineTo(x + 64, 0); g.lineTo(x + 64 + S, S); g.lineTo(x + 32 + S, S); g.fill(); }
      this.grime(g, 0.6, 1);
    },
    metalfence(g) {
      g.clearRect(0, 0, S, S);
      g.strokeStyle = '#5e6a60';
      g.lineWidth = 2;
      for (let k = -S; k < S * 2; k += 14) {
        g.beginPath(); g.moveTo(k, 16); g.lineTo(k + S - 32, S - 16); g.stroke();
        g.beginPath(); g.moveTo(k, S - 16); g.lineTo(k + S - 32, 16); g.stroke();
      }
      g.fillStyle = '#4a524c';
      g.fillRect(0, 10, S, 7);
      g.fillRect(0, S - 17, S, 7);
      g.fillRect(0, 0, 8, S);
      g.fillStyle = 'rgba(120,70,40,0.6)';
      g.fillRect(0, 10, S, 2);
      g.fillRect(2, 0, 3, S);
    },
    picket(g) {
      g.clearRect(0, 0, S, S);
      const rng = N.rng(171);
      g.fillStyle = '#b8b0a0';
      g.fillRect(0, 54, S, 16);
      g.fillRect(0, S - 64, S, 16);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(0, 68, S, 2);
      g.fillRect(0, S - 50, S, 2);
      for (let k = 0; k < 6; k++) {
        const x = k * S / 6 + 8, w = 26, v = 0.86 + rng() * 0.18;
        g.fillStyle = `rgb(${236 * v | 0},${230 * v | 0},${216 * v | 0})`;
        g.beginPath();
        g.moveTo(x, S); g.lineTo(x, 16); g.lineTo(x + w / 2, 2); g.lineTo(x + w, 16); g.lineTo(x + w, S);
        g.closePath();
        g.fill();
        g.fillStyle = 'rgba(90,70,50,0.18)';
        for (let i = 0; i < 4; i++) g.fillRect(x + 3 + rng() * (w - 6), 20 + rng() * 60, 1, 60 + rng() * 120);
        g.fillStyle = 'rgba(0,0,0,0.22)';
        g.fillRect(x + w - 3, 14, 3, S - 14);
        g.fillStyle = 'rgba(60,40,30,0.7)';
        g.fillRect(x + w / 2 - 2, 60, 4, 4);
        g.fillRect(x + w / 2 - 2, S - 58, 4, 4);
      }
    },
    track(g) {
      const n = this.noise[3];
      this.pixels(g, (x, y, d, i, k) => { const v = n[k] * 0.4 + N.hash2(x, y, 9) * 0.3; d[i] = 118 + v * 50; d[i + 1] = 62 + v * 30; d[i + 2] = 46 + v * 22; d[i + 3] = 255; });
      const rng = N.rng(141);
      for (let k = 0; k < 500; k++) { g.fillStyle = rng() < 0.5 ? 'rgba(60,30,20,0.5)' : 'rgba(190,130,100,0.5)'; g.fillRect(rng() * S, rng() * S, 2, 2); }
    },
    allot(g) {
      const n = this.noise[0];
      this.pixels(g, (x, y, d, i, k) => { const v = n[k] * 0.5; d[i] = 84 + v * 30; d[i + 1] = 68 + v * 24; d[i + 2] = 46 + v * 16; d[i + 3] = 255; });
      const rng = N.rng(151);
      for (let py = 0; py < S; py += 128) for (let px = 0; px < S; px += 128) {
        const kind = rng();
        for (let y = py + 10; y < py + 118; y += 12) {
          g.fillStyle = kind < 0.4 ? 'rgba(70,110,40,0.85)' : kind < 0.7 ? 'rgba(110,140,60,0.8)' : 'rgba(60,90,40,0.6)';
          g.fillRect(px + 10, y, 108, kind < 0.7 ? 6 : 10);
        }
        g.fillStyle = '#a89878';
        g.fillRect(px, py, 128, 4);
        g.fillRect(px, py, 4, 128);
      }
    },
    office(g) {
      this.tone(g, '#c6c2b6', 0.16, 1);
      g.fillStyle = 'rgba(60,60,60,0.35)';
      g.fillRect(0, 0, 2, S);
      g.fillStyle = '#8e8a80';
      g.fillRect(0, 186, S, 10);
      this.window(g, 0, 64, S, 112, { panes: 4, frame: '#d8d6ce', glass: '#34465a', glass2: '#6a84a0', fw: 5, transom: true, recess: 'rgba(0,0,0,0.3)' });
      this.grime(g, 0.8, 4);
    },
    brickhouse(g) {
      this.bricks(g, '#a2553c', '#b8a898', 32, 12, 0.3);
      g.fillStyle = '#d8d0c0';
      g.fillRect(62, 46, 132, 12);
      g.fillRect(56, 190, 144, 10);
      this.window(g, 74, 62, 108, 124, { panes: 2, frame: '#f2eee2', transom: true, fw: 7, curtain: '#e0c8a0' });
      this.grime(g, 0.6, 4);
    },
    bark(g) {
      const n = this.noise[2];
      this.pixels(g, (x, y, d, i, k) => { const v = 0.9 + n[k] * 0.12; d[i] = 238 * v; d[i + 1] = 236 * v; d[i + 2] = 228 * v; d[i + 3] = 255; });
      const rng = N.rng(121);
      const lent = (x, y, w, h, c) => { g.fillStyle = c; for (const dx of [0, -S, S]) { g.beginPath(); g.ellipse(x + dx, y, w / 2, h / 2, 0, 0, 7); g.fill(); } };
      for (let k = 0; k < 80; k++) lent(rng() * S, rng() * S, 8 + rng() * 36, 1.5 + rng() * 3.2, `rgba(${30 + rng() * 26 | 0},${28 + rng() * 22 | 0},${26 + rng() * 18 | 0},${(0.55 + rng() * 0.4).toFixed(2)})`);
      for (let k = 0; k < 8; k++) {
        const x = 20 + rng() * (S - 40), y = 20 + rng() * (S - 40), r = 6 + rng() * 12;
        g.fillStyle = 'rgba(34,30,28,0.85)';
        g.beginPath(); g.moveTo(x - r * 1.4, y); g.quadraticCurveTo(x, y - r * 0.8, x + r * 1.4, y); g.quadraticCurveTo(x, y + r * 0.9, x - r * 1.4, y); g.fill();
      }
      for (let k = 0; k < 40; k++) lent(rng() * S, rng() * S, 14 + rng() * 30, 0.8, 'rgba(190,160,120,0.18)');
    },
    trunk(g) {
      const n = this.noise[1], m = this.noise[4], q = this.noise[0];
      this.pixels(g, (x, y, d, i, k) => {
        const f = Math.abs(Math.sin((x / S + m[k] * 0.12) * 13 * Math.PI));
        const ridge = N.smooth(0.12, 0.55, f) * (0.75 + q[k] * 0.5);
        const c = (0.42 + ridge * 0.5) * (0.82 + n[k] * 0.36);
        d[i] = 104 * c; d[i + 1] = 88 * c; d[i + 2] = 72 * c; d[i + 3] = 255;
      });
      const rng = N.rng(131);
      g.fillStyle = 'rgba(30,24,18,0.5)';
      for (let k = 0; k < 70; k++) g.fillRect(rng() * S, rng() * S, 3 + rng() * 8, 1 + rng() * 1.5);
      g.fillStyle = 'rgba(120,140,90,0.16)';
      for (let k = 0; k < 14; k++) { g.beginPath(); g.ellipse(rng() * S, rng() * S, 6 + rng() * 14, 10 + rng() * 22, 0, 0, 7); g.fill(); }
    },
    barkpine(g) {
      const n = this.noise[0];
      this.pixels(g, (x, y, d, i, k) => { const v = 0.72 + n[k] * 0.36; d[i] = 186 * v; d[i + 1] = 104 * v; d[i + 2] = 60 * v; d[i + 3] = 255; });
      const rng = N.rng(141);
      for (let k = 0; k < 70; k++) {
        const x = rng() * S, y = rng() * S, w = 20 + rng() * 34, h = 9 + rng() * 14, t = rng();
        g.fillStyle = `rgba(${196 + t * 40 | 0},${114 + t * 40 | 0},${66 + t * 30 | 0},0.5)`;
        g.strokeStyle = 'rgba(86,48,28,0.5)';
        g.lineWidth = 1 + rng();
        for (const dx of [0, -S, S]) {
          g.beginPath();
          g.moveTo(x + dx, y); g.lineTo(x + dx + w * 0.55, y - h * 0.2); g.lineTo(x + dx + w, y + h * 0.3); g.lineTo(x + dx + w * 0.4, y + h); g.closePath();
          g.fill(); g.stroke();
        }
      }
    },
    endgrain(g) {
      const n = this.noise[2];
      this.pixels(g, (x, y, d, i, k) => {
        const r = Math.hypot(x - 128, y - 128) + n[k] * 5;
        const ring = 0.5 + 0.5 * Math.sin(r * 0.9);
        let c = [196 - ring * 34, 160 - ring * 30, 112 - ring * 22];
        if (r > 112) c = [88, 70, 54];
        else if (r > 104) c = [150, 118, 84];
        if (r < 4) c = [120, 90, 60];
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      });
      const rng = N.rng(151);
      g.strokeStyle = 'rgba(70,50,30,0.6)';
      for (let k = 0; k < 5; k++) { const a = rng() * 6.28; g.lineWidth = 1 + rng() * 2; g.beginPath(); g.moveTo(128 + Math.cos(a) * 10, 128 + Math.sin(a) * 10); g.lineTo(128 + Math.cos(a + 0.05) * (40 + rng() * 60), 128 + Math.sin(a + 0.05) * (40 + rng() * 60)); g.stroke(); }
    },
    leaves_birch(g) { this.crown(g, { seed: 11, shape: (x, y) => ((x - 128) / 104) ** 2 + ((y - 122) / 124) ** 2 < 1 - 0.22 * N.noise2(x * 0.03, y * 0.03, 3), clumps: 120, r: 22, per: 60, leaf: [6, 4], dark: [52, 88, 30], light: [168, 206, 98], hang: 0.6 }); },
    leaves_linden(g) { this.crown(g, { seed: 12, shape: (x, y) => ((x - 128) / 122) ** 2 + ((y - 124) / 118) ** 2 < 1 - 0.2 * N.noise2(x * 0.025, y * 0.025, 5), clumps: 110, r: 26, per: 70, leaf: [8, 5], dark: [30, 62, 24], light: [116, 160, 66] }); },
    leaves_poplar(g) { this.crown(g, { seed: 13, shape: (x, y) => ((x - 128) / 70) ** 2 + ((y - 128) / 126) ** 2 < 1 - 0.18 * N.noise2(x * 0.04, y * 0.03, 7), clumps: 90, r: 20, per: 60, leaf: [7, 4], dark: [34, 58, 28], light: [112, 150, 70] }); },
    leaves_pine(g) { this.crown(g, { seed: 14, shape: (x, y) => ((x - 128) / 120) ** 2 + ((y - 118) / 100) ** 2 < 1 - 0.45 * N.noise2(x * 0.035, y * 0.035, 9), clumps: 90, r: 24, per: 90, needle: true, leaf: [10, 6], dark: [20, 44, 30], light: [74, 112, 64], twig: [110, 64, 40] }); },
    leaves_apple(g) { this.crown(g, { seed: 15, shape: (x, y) => ((x - 128) / 124) ** 2 + ((y - 134) / 108) ** 2 < 1 - 0.2 * N.noise2(x * 0.03, y * 0.03, 11), clumps: 110, r: 24, per: 60, leaf: [7, 4], dark: [42, 80, 30], light: [130, 170, 70], fruit: ['#d83a2a', '#e8a020', '#c02a24'] }); },
    leaves_spruce(g) { this.crown(g, { seed: 16, shape: (x, y) => y > 4 && Math.abs(x - 128) < (y / S) * 124 * (0.8 + 0.2 * Math.abs(Math.sin(y * 0.09))), clumps: 130, r: 18, per: 70, needle: true, leaf: [9, 5], dark: [16, 36, 30], light: [56, 92, 70], droop: true }); },
    leaves_willow(g) { this.crown(g, { seed: 17, shape: (x, y) => ((x - 128) / 124) ** 2 + ((y - 104) / 100) ** 2 < 1 - 0.15 * N.noise2(x * 0.03, y * 0.03, 13) || (y > 104 && y < 236 - 26 * N.noise2(x * 0.08, 1, 15) && Math.abs(x - 128) < 118), clumps: 140, r: 20, per: 60, leaf: [8, 3], dark: [70, 92, 60], light: [176, 196, 150], hang: 1 }); },
    leaves_bush(g) { this.crown(g, { seed: 18, shape: (x, y) => y < 252 && ((x - 128) / 126) ** 2 + ((y - 236) / 220) ** 2 < 1 - 0.25 * N.noise2(x * 0.04, y * 0.04, 17), clumps: 110, r: 24, per: 70, leaf: [7, 4], dark: [30, 60, 26], light: [110, 156, 64] }); },
    leafbroad(g) { this.cluster(g, { seed: 21, n: 820, leaf: [14, 9], wr: 0.62, dark: [30, 64, 26], light: [128, 176, 70], bg: [62, 104, 42], vein: true, twigs: 7 }); },
    leafsmall(g) { this.sprays(g, { seed: 22, n: 26, leaf: [9, 5], dark: [48, 86, 30], light: [170, 208, 100], bg: [90, 130, 54] }); },
    leafapple(g) { this.cluster(g, { seed: 23, n: 760, leaf: [13, 8], wr: 0.56, dark: [36, 70, 28], light: [126, 168, 72], bg: [66, 104, 44], vein: true, twigs: 8, fruit: { n: 16, r: 7, cols: ['#d8342a', '#e05a28', '#c8a02a'] } }); },
    leafrowan(g) { this.cluster(g, { seed: 24, n: 900, leaf: [11, 6], wr: 0.32, dark: [34, 70, 30], light: [120, 166, 70], bg: [64, 104, 46], twigs: 9, berries: { n: 6, cols: ['#e8541e', '#d8401a', '#f07028'] } }); },
    leafbloom(g) { this.cluster(g, { seed: 25, n: 760, leaf: [13, 8], wr: 0.6, dark: [34, 70, 30], light: [126, 172, 72], bg: [70, 110, 50], vein: true, twigs: 7, blooms: { n: 34, r: 7, col: '#f8f6ee', mid: '#e8d050' } }); },
    needles(g) { this.tufts(g, { seed: 26, n: 46, len: [16, 12], dark: [18, 40, 28], light: [70, 110, 62], bg: [36, 64, 40], twig: [112, 70, 44] }); },
    sprucebr(g) { this.spruceBranch(g, { seed: 27, dark: [14, 34, 26], light: [62, 98, 66], bg: [28, 54, 40], twig: [84, 60, 40] }); },
    hedge(g) { this.hedgeTex(g, { seed: 28, dark: [26, 56, 24], light: [104, 152, 60] }); },
    grasstuft(g) { this.blades(g, { seed: 29, n: 78, h: [120, 130], spread: 130, dark: [38, 70, 26], light: [112, 164, 62], dry: [160, 162, 90], dryP: 0.06, w: [3, 3], bg: [70, 100, 40] }); },
    meadow(g) {
      this.blades(g, { seed: 30, n: 56, h: [100, 150], spread: 150, dark: [44, 70, 28], light: [148, 176, 78], dry: [190, 178, 104], dryP: 0.2, w: [2.5, 2.5], bg: [80, 108, 46] });
      this.flowerHeads(g, N.rng(31), 14);
    },
    reeds(g) { this.reedTex(g, { seed: 32 }); },
    weeds(g) { this.weedTex(g, { seed: 33 }); },
    lily(g) { this.lilyTex(g, { seed: 34 }); },
    boulder(g) {
      const n = this.noise[0], m = this.noise[2], q = this.noise[5], l = this.noise[3];
      this.pixels(g, (x, y, d, i, k) => {
        const v = 0.7 + n[k] * 0.25 + m[k] * 0.12;
        const pink = N.smooth(0.55, 0.8, q[k]) * 0.12;
        d[i] = 136 * v + pink * 120; d[i + 1] = 132 * v + pink * 40; d[i + 2] = 126 * v; d[i + 3] = 255;
        const li = N.smooth(0.8, 0.86, l[k] * 0.55 + n[k] * 0.45) * 0.6, lg = N.smooth(0.74, 0.8, q[k] * 0.5 + n[k] * 0.5);
        if (li > 0) { d[i] = N.lerp(d[i], 190, li * 0.7); d[i + 1] = N.lerp(d[i + 1], 194, li * 0.7); d[i + 2] = N.lerp(d[i + 2], 170, li * 0.7); }
        if (lg > 0) { d[i] = N.lerp(d[i], 150, lg * 0.75); d[i + 1] = N.lerp(d[i + 1], 160, lg * 0.75); d[i + 2] = N.lerp(d[i + 2], 70, lg * 0.75); }
      });
      const rng = N.rng(161);
      for (let k = 0; k < 2600; k++) {
        const t = rng();
        g.fillStyle = t < 0.45 ? 'rgba(40,38,36,0.55)' : t < 0.8 ? 'rgba(236,232,224,0.45)' : 'rgba(170,110,96,0.45)';
        g.fillRect(rng() * S, rng() * S, 1 + rng() * 2, 1 + rng() * 2);
      }
    },
    chimney(g) {
      for (let y = 0; y < S; y += 64) {
        g.fillStyle = (y / 64) % 2 ? '#e8e4dc' : '#b8322a';
        g.fillRect(0, y, S, 64);
      }
      g.globalAlpha = 0.25;
      this.bricks(g, '#888', '#666', 32, 10, 0.1);
      g.globalAlpha = 1;
      for (let y = 0; y < S; y += 64) { g.fillStyle = (y / 64) % 2 ? 'rgba(232,228,220,0.8)' : 'rgba(184,50,42,0.8)'; g.fillRect(0, y, S, 64); }
      this.grime(g, 0.9, 1);
    },
    rust(g) {
      const n = this.noise[0], m = this.noise[3];
      this.pixels(g, (x, y, d, i, k) => { const v = n[k] * 0.6 + m[k] * 0.4; d[i] = 120 + v * 60; d[i + 1] = 70 + v * 30; d[i + 2] = 40 + v * 20; d[i + 3] = 255; });
    },
    cranepaint(g) {
      this.tone(g, '#d8a82a', 0.25, 1);
      this.grime(g, 1, 4);
    },
    kiosk(g) {
      g.fillStyle = '#e8e4dc';
      g.fillRect(0, 0, S, S);
      g.fillStyle = '#2a5aa8';
      g.fillRect(0, 0, S, 50);
      this.window(g, 10, 60, 236, 150, { panes: 3, frame: '#d8d4cc', glass: '#3a3a3a', fw: 5 });
      const rng = N.rng(131);
      const cols = ['#e83a2a', '#f0c030', '#3a8ae8', '#40c040', '#e8e8e8', '#8a2a8a', '#f08a20'];
      for (let row = 0; row < 4; row++) for (let x = 20; x < 236; x += 10) {
        g.fillStyle = cols[Math.floor(rng() * cols.length)];
        g.fillRect(x, 72 + row * 34, 7, 24);
      }
      g.fillStyle = '#9a9690';
      g.fillRect(0, 214, S, 42);
    },
    stands(g) {
      g.fillStyle = '#7a7a78';
      g.fillRect(0, 0, S, S);
      const cols = ['#2a5ac8', '#e8e8e8', '#2a5ac8', '#c83a2a'];
      for (let y = 0; y < S; y += 32) { g.fillStyle = cols[(y / 32) % 4]; for (let x = 4; x < S; x += 16) g.fillRect(x, y + 6, 12, 14); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, y + 28, S, 4); }
    },
    fabric(g) {
      for (let x = 0; x < S; x += 32) { g.fillStyle = (x / 32) % 2 ? '#f0f0f0' : '#c8c8c8'; g.fillRect(x, 0, 32, S); }
    },
    carbody(g) {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, S, S);
      g.fillStyle = 'rgba(0,0,0,0)';
      const img = g.getImageData(0, 0, S, S);
      for (let i = 3; i < img.data.length; i += 4) img.data[i] = 0;
      g.putImageData(img, 0, 0);
    },
    carglass(g) {
      const gr = g.createLinearGradient(0, 0, 0, S);
      gr.addColorStop(0, '#1a2430');
      gr.addColorStop(0.5, '#3a4e60');
      gr.addColorStop(1, '#141c24');
      g.fillStyle = gr;
      g.fillRect(0, 0, S, S);
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.beginPath(); g.moveTo(40, 0); g.lineTo(90, 0); g.lineTo(40, S); g.lineTo(0, S); g.fill();
      g.fillStyle = '#101010';
      g.fillRect(0, 0, S, 8); g.fillRect(0, S - 8, S, 8); g.fillRect(0, 0, 8, S); g.fillRect(S - 8, 0, 8, S);
    },
    tire(g) {
      g.fillStyle = '#1a1a1a';
      g.fillRect(0, 0, S, S);
      for (let x = 0; x < S; x += 16) { g.fillStyle = '#262626'; g.fillRect(x, 0, 8, S); }
    },
    rim(g) {
      g.fillStyle = '#1a1a1a';
      g.fillRect(0, 0, S, S);
      g.fillStyle = '#9a9a9a';
      g.beginPath(); g.arc(128, 128, 96, 0, 7); g.fill();
      g.fillStyle = '#c8c8c8';
      g.beginPath(); g.arc(128, 128, 70, 0, 7); g.fill();
      g.fillStyle = '#6a6a6a';
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.beginPath(); g.arc(128 + Math.cos(a) * 44, 128 + Math.sin(a) * 44, 10, 0, 7); g.fill(); }
      g.fillStyle = '#e0e0e0';
      g.beginPath(); g.arc(128, 128, 20, 0, 7); g.fill();
    },
    water(g) {
      const n = this.noise[1], m = this.noise[3];
      this.pixels(g, (x, y, d, i, k) => { const v = n[k] * 0.6 + m[k] * 0.4; d[i] = 40 + v * 30; d[i + 1] = 62 + v * 34; d[i + 2] = 60 + v * 30; d[i + 3] = 255; });
    },
    cliff(g) {
      const n = this.noise[0], m = this.noise[5];
      this.pixels(g, (x, y, d, i, k) => { const v = n[k] * 0.7 + m[k] * 0.3; const rock = N.smooth(0.62, 0.75, m[k]); d[i] = 50 + v * 40 + rock * 60; d[i + 1] = 80 + v * 50 + rock * 30; d[i + 2] = 40 + v * 20 + rock * 40; d[i + 3] = 255; });
    },
    kremlin(g) {
      this.bricks(g, '#a83a2a', '#8a3a2a', 24, 10, 0.2);
      g.clearRect(0, 0, S, 60);
      for (let x = 0; x < S; x += 64) {
        g.fillStyle = '#a83a2a';
        g.beginPath(); g.moveTo(x + 8, 60); g.lineTo(x + 8, 20); g.lineTo(x + 20, 0); g.lineTo(x + 44, 0); g.lineTo(x + 56, 20); g.lineTo(x + 56, 60); g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,0.3)';
      for (let x = 20; x < S; x += 64) g.fillRect(x, 120, 12, 24);
    },
    dancefloor(g) {
      const cols = ['#e03a9a', '#3ac0e0', '#e0d03a', '#8a3ae0', '#3ae07a', '#e0603a'];
      const rng = N.rng(141);
      for (let y = 0; y < S; y += 64) for (let x = 0; x < S; x += 64) {
        g.fillStyle = cols[Math.floor(rng() * cols.length)];
        g.fillRect(x + 2, y + 2, 60, 60);
        g.fillStyle = 'rgba(255,255,255,0.3)';
        g.fillRect(x + 6, y + 6, 20, 8);
      }
    },
    carpet(g) {
      g.fillStyle = '#1a1018';
      g.fillRect(0, 0, S, S);
      const rng = N.rng(151);
      const cols = ['#e03a3a', '#3a8ae0', '#e0c03a', '#e03ae0', '#3ae0a0'];
      for (let k = 0; k < 400; k++) { g.fillStyle = cols[Math.floor(rng() * cols.length)]; g.globalAlpha = 0.4 + rng() * 0.4; g.fillRect(rng() * S, rng() * S, 3, 3); }
      g.globalAlpha = 1;
    },
    clubwall(g) {
      this.tone(g, '#3a1a3a', 0.3, 1);
      g.fillStyle = '#e03aa0';
      g.fillRect(0, 60, S, 5);
      g.fillStyle = '#3ae0e0';
      g.fillRect(0, 200, S, 5);
    },
    barwood(g) {
      this.tone(g, '#5a2e1a', 0.4, 3);
      g.fillStyle = 'rgba(255,220,160,0.2)';
      g.fillRect(0, 0, S, 12);
      const rng = N.rng(161);
      for (let x = 10; x < S; x += 14) { g.fillStyle = ['#2a6a2a', '#8a5a1a', '#d8d8e8', '#6a1a1a'][Math.floor(rng() * 4)]; g.fillRect(x, 30, 8, 50); g.fillRect(x + 2, 20, 4, 12); }
    },
    wreck(g) {
      this.tone(g, '#221e1a', 0.5, 0);
      this.pixels(g, (x, y, d, i, k) => { if (this.noise[3][k] > 0.65) { d[i] = 110; d[i + 1] = 60; d[i + 2] = 30; } });
    },
    lampglow(g) {
      const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, '#fff6d8');
      gr.addColorStop(0.5, '#ffd890');
      gr.addColorStop(1, '#c89a50');
      g.fillStyle = gr;
      g.fillRect(0, 0, S, S);
    },
    darkmetal(g) {
      this.tone(g, '#3a3c3e', 0.3, 3);
    },
    white(g) {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, S, S);
    },
    skin(g) {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, S, S);
    },
    deck(g) {
      const rng = N.rng(171);
      for (let y = 0; y < S; y += 16) { const v = 0.8 + rng() * 0.3; g.fillStyle = `rgb(${130 * v | 0},${104 * v | 0},${74 * v | 0})`; g.fillRect(0, y, S, 15); }
      this.grime(g, 0.8, 1);
    },
    hullpaint(g) {
      this.tone(g, '#e8e4dc', 0.1, 1);
      g.fillStyle = '#2a4a8a';
      g.fillRect(0, 180, S, 76);
      g.fillStyle = '#c83a2a';
      g.fillRect(0, 170, S, 10);
      this.grime(g, 0.7, 4);
    },
    wires(g) {
      g.clearRect(0, 0, S, S);
      g.fillStyle = '#1a1a1a';
      g.fillRect(0, 124, S, 3);
    },
    cloth(g) {
      this.tone(g, '#ededed', 0.14, 4);
      g.fillStyle = 'rgba(0,0,0,0.05)';
      for (let i = 0; i < S; i += 2) { g.fillRect(0, i, S, 1); g.fillRect(i, 0, 1, S); }
    },
    leather(g) {
      this.tone(g, '#e6e6e6', 0.22, 0);
      const rng = N.rng(61);
      g.strokeStyle = 'rgba(0,0,0,0.12)';
      g.lineWidth = 1.5;
      for (let k = 0; k < 40; k++) { const x = rng() * S, y = rng() * S; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + rng() * 30 - 15, y + 10, x + rng() * 40 - 20, y + 22); g.stroke(); }
    },
    hair(g) {
      g.fillStyle = '#d8d8d8';
      g.fillRect(0, 0, S, S);
      const rng = N.rng(91);
      for (let k = 0; k < 900; k++) {
        const x = rng() * S, y = rng() * S, l = 20 + rng() * 60, v = rng();
        g.strokeStyle = v < 0.5 ? `rgba(0,0,0,${0.08 + v * 0.2})` : `rgba(255,255,255,${(v - 0.5) * 0.4})`;
        g.lineWidth = 1 + rng();
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rng() - 0.5) * 6, y + l); g.stroke();
      }
    },
    stripes(g) {
      g.clearRect(0, 0, S, S);
      g.fillStyle = 'rgba(28,46,128,1)';
      for (let y = 0; y < S; y += 32) g.fillRect(0, y, S, 12);
    },
    camo(g) {
      const a = this.noise[2], b = this.noise[5], c = this.noise[4];
      this.pixels(g, (x, y, d, i, k) => {
        let col = null;
        if (a[k] > 0.58) col = [48, 60, 38];
        if (b[k] > 0.64) col = [92, 74, 48];
        if (c[k] > 0.7) col = [30, 32, 26];
        if (col) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; } else d[i + 3] = 0;
      });
    },
    palms(g) {
      g.clearRect(0, 0, S, S);
      const rng = N.rng(33);
      const leaf = (x, y, a, l, col) => {
        g.save(); g.translate(x, y); g.rotate(a);
        g.fillStyle = col;
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * 0.5, -l * 0.25, l, 0); g.quadraticCurveTo(l * 0.5, l * 0.25, 0, 0); g.fill();
        g.restore();
      };
      for (let k = 0; k < 14; k++) {
        const x = rng() * S, y = rng() * S;
        for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
          const px = x + ox, py = y + oy;
          if (px < -60 || px > S + 60 || py < -60 || py > S + 60) continue;
          for (let i = 0; i < 6; i++) leaf(px, py, i / 6 * Math.PI * 2 + k, 26 + (i % 2) * 8, i % 2 ? 'rgba(240,200,40,1)' : 'rgba(20,110,60,1)');
          g.fillStyle = k % 2 ? 'rgba(240,80,120,1)' : 'rgba(250,250,240,1)';
          g.beginPath(); g.arc(px + 30, py + 18, 6, 0, 7); g.fill();
        }
      }
    },
    plaid(g) {
      g.fillStyle = '#ece8e0';
      g.fillRect(0, 0, S, S);
      for (let i = 0; i < S; i += 64) {
        g.fillStyle = 'rgba(190,30,40,0.85)'; g.fillRect(i, 0, 22, S); g.fillRect(0, i, S, 22);
        g.fillStyle = 'rgba(30,50,150,0.8)'; g.fillRect(i + 34, 0, 16, S); g.fillRect(0, i + 34, S, 16);
      }
    },
    face(g) {
      g.clearRect(0, 0, S, S);
      FACES.forEach((o, i) => drawFace(g, (i % 4) * 64, Math.floor(i / 4) * 64, o));
    },
    lamplens(g) {
      const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, '#ffffff');
      gr.addColorStop(0.55, '#e2e2e2');
      gr.addColorStop(1, '#b4b4b4');
      g.fillStyle = gr;
      g.fillRect(0, 0, S, S);
      g.strokeStyle = 'rgba(110,110,110,0.35)';
      g.lineWidth = 3;
      for (let r = 26; r < 128; r += 22) { g.beginPath(); g.arc(128, 128, r, 0, 7); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.18)';
      for (let y = 6; y < S; y += 16) g.fillRect(0, y, S, 5);
    },
    gauge(g) {
      g.fillStyle = '#0b0c0d';
      g.fillRect(0, 0, S, S);
      const tick = (x0, y0, x1, y1, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
      for (const [cx, n, needle] of [[64, 14, 2.5], [192, 8, 3.4]]) {
        g.strokeStyle = '#e6e6dc';
        g.beginPath(); g.arc(cx, 64, 56, Math.PI * 0.75, Math.PI * 2.25); g.lineWidth = 2; g.stroke();
        for (let k = 0; k <= n; k++) {
          const a = Math.PI * (0.75 + 1.5 * k / n), c = Math.cos(a), s = Math.sin(a), big = k % 2 === 0;
          tick(cx + c * (big ? 38 : 45), 64 + s * (big ? 38 : 45), cx + c * 55, 64 + s * 55, big ? 4 : 2);
        }
        g.strokeStyle = '#ff8a3c';
        tick(cx, 64, cx + Math.cos(needle) * 46, 64 + Math.sin(needle) * 46, 4);
        g.fillStyle = '#3a3a3a'; g.beginPath(); g.arc(cx, 64, 7, 0, 7); g.fill();
      }
      g.strokeStyle = '#e6e6dc';
      g.strokeRect(10, 150, 236, 44);
      for (let k = 0; k <= 22; k++) tick(16 + k * 10.6, 194, 16 + k * 10.6, k % 2 ? 184 : 176, k % 2 ? 2 : 3);
      g.fillStyle = '#ff8a3c';
      g.fillRect(14, 156, 92, 12);
      for (let k = 0; k < 6; k++) { g.fillStyle = ['#3ad45a', '#e6c23a', '#3a8ae6', '#e64a3a', '#3ad45a', '#e6c23a'][k]; g.fillRect(20 + k * 38, 214, 18, 12); }
    },
    mirror(g) {
      g.fillStyle = '#e4e8ec';
      g.fillRect(0, 0, S, S);
    },
    chrome(g) {
      this.tone(g, '#e2e2de', 0.06, 2);
    },
    trim(g) {
      this.tone(g, '#5a5a5c', 0.22, 4);
    },
    canvas(g) {
      this.tone(g, '#c4c6b2', 0.28, 1);
      g.fillStyle = 'rgba(40,44,30,0.12)';
      for (let y = 0; y < S; y += 4) g.fillRect(0, y, S, 1);
      for (let x = 0; x < S; x += 4) g.fillRect(x, 0, 1, S);
    },
    dkbay(g) {
      this.tone(g, '#dcb24e', 0.12, 1);
      g.fillStyle = '#f2ead6';
      g.fillRect(70, 52, 116, 160);
      g.fillRect(62, 46, 132, 10);
      g.fillStyle = 'rgba(90,60,20,0.35)';
      g.fillRect(62, 56, 132, 3);
      g.fillStyle = '#f2ead6';
      g.fillRect(64, 210, 128, 9);
      this.window(g, 80, 62, 96, 142, { panes: 2, frame: '#f6f2e8', transom: true, fw: 6, recess: 'rgba(60,40,10,0.35)', curtain: '#e8dcc0' });
      this.grime(g, 0.32, 4);
    },
    creambay(g) {
      this.tone(g, '#ece2c8', 0.08, 1);
      g.fillStyle = '#f8f4ea';
      g.fillRect(72, 56, 112, 156);
      g.fillStyle = 'rgba(110,90,50,0.22)';
      g.fillRect(72, 56, 112, 3);
      g.fillStyle = '#f4efe2';
      g.fillRect(66, 208, 124, 8);
      this.window(g, 82, 64, 92, 140, { panes: 2, frame: '#f6f2e8', transom: true, fw: 6, recess: 'rgba(80,60,30,0.3)', curtain: '#e8dcc0' });
      this.grime(g, 0.28, 4);
    },
    boards(g) {
      this.tone(g, '#f4f0e6', 0.05, 1);
      for (let x = 0; x < S; x += 21) { g.fillStyle = 'rgba(70,55,30,0.28)'; g.fillRect(x, 0, 2, S); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x + 2, 0, 1, S); }
      this.grime(g, 0.25, 1);
    },
    diagboards(g) {
      this.tone(g, '#f2ece0', 0.05, 1);
      g.lineWidth = 2;
      g.strokeStyle = 'rgba(80,60,30,0.3)';
      for (let k = -16; k < 32; k++) {
        const c = k * 16;
        g.beginPath(); g.moveTo(0, c); g.lineTo(128, c - 128); g.stroke();
        g.beginPath(); g.moveTo(256, c); g.lineTo(128, c - 128); g.stroke();
      }
      g.fillStyle = 'rgba(80,60,30,0.35)';
      g.fillRect(127, 0, 2, S);
      this.grime(g, 0.25, 1);
    },
    railing(g) {
      g.clearRect(0, 0, S, S);
      g.fillStyle = '#d8d8d4';
      g.fillRect(0, 0, S, 18);
      g.fillRect(0, S - 14, S, 14);
      for (let x = 6; x < S; x += 22) g.fillRect(x, 0, 7, S);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(0, 15, S, 3);
    },
    balcpanel(g) {
      this.tone(g, '#cfccc2', 0.12, 1);
      for (let x = 0; x < S; x += 16) { g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(x, 0, 5, S); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 6, 0, 3, S); }
      g.fillStyle = '#e6e2d8';
      g.fillRect(0, 0, S, 14);
      this.grime(g, 0.8, 4);
    },
    glazedbalc(g) {
      this.tone(g, '#c4b8a0', 0.15, 1);
      g.fillStyle = '#8a6a44';
      g.fillRect(0, 120, S, 136);
      this.window(g, 4, 6, 120, 106, { panes: 2, frame: '#9a7a50', glass: '#2a3644', glass2: '#5a6c7c', fw: 7, recess: 'rgba(0,0,0,0)', curtain: '#d8c8a0' });
      this.window(g, 132, 6, 120, 106, { panes: 2, frame: '#9a7a50', glass: '#2a3644', glass2: '#5a6c7c', fw: 7, recess: 'rgba(0,0,0,0)' });
      for (let x = 0; x < S; x += 32) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x, 122, 3, 134); }
      this.grime(g, 0.5, 4);
    },
    flowers(g) {
      this.tone(g, '#4a7a34', 0.4, 0);
      const rng = N.rng(97);
      const cols = ['#e8304a', '#f4d040', '#f070b0', '#f8f4f0', '#e86a20', '#c040c0'];
      for (let k = 0; k < 1400; k++) {
        const x = rng() * S, y = rng() * S, r = 1.5 + rng() * 2.5;
        g.fillStyle = cols[Math.floor(rng() * cols.length)];
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }
    },
    stucco(g) {
      this.tone(g, '#f2eee6', 0.06, 1);
      this.grime(g, 0.22, 4);
    },
    dkglass(g) {
      g.fillStyle = '#d4ccb8';
      g.fillRect(0, 0, S, S);
      this.window(g, 26, 8, 204, 240, { panes: 3, frame: '#efe8d8', glass: '#1e2a36', glass2: '#4a5e72', fw: 8, recess: 'rgba(0,0,0,0.3)', transom: true });
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(0, 0, 10, S);
      g.fillRect(S - 10, 0, 10, S);
    },
    balustrade(g) {
      g.clearRect(0, 0, S, S);
      g.fillStyle = '#f0ece2';
      g.fillRect(0, 0, S, 34);
      g.fillRect(0, 214, S, 42);
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(0, 30, S, 4);
      g.fillRect(0, 214, S, 3);
      for (let k = 0; k < 8; k++) {
        const cx = 16 + k * 32;
        g.fillStyle = '#ece6d8';
        g.beginPath();
        g.moveTo(cx - 7, 34); g.lineTo(cx + 7, 34);
        g.bezierCurveTo(cx + 5, 70, cx + 13, 120, cx + 12, 160);
        g.bezierCurveTo(cx + 11, 190, cx + 6, 200, cx + 8, 214);
        g.lineTo(cx - 8, 214);
        g.bezierCurveTo(cx - 6, 200, cx - 11, 190, cx - 12, 160);
        g.bezierCurveTo(cx - 13, 120, cx - 5, 70, cx - 7, 34);
        g.fill();
        g.fillStyle = 'rgba(70,60,40,0.25)';
        g.fillRect(cx + 4, 60, 4, 150);
      }
    },
    tallwin(g) {
      g.fillStyle = '#e8dcc8';
      g.fillRect(0, 0, S, S);
      const cols = 4, rows = 10, fw = 5;
      const pw = (S - fw * (cols + 1)) / cols, ph = (S - fw * (rows + 1)) / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = fw + c * (pw + fw), y = fw + r * (ph + fw);
        const gr = g.createLinearGradient(x, y, x + pw, y + ph);
        gr.addColorStop(0, '#22303e'); gr.addColorStop(0.5, '#4c6278'); gr.addColorStop(1, '#22303e');
        g.fillStyle = gr;
        g.fillRect(x, y, pw, ph);
        this.glassMask(g, Math.round(x), Math.round(y), Math.round(pw), Math.round(ph));
      }
    },
    panelwall(g) {
      this.tone(g, '#e6dcc4', 0.1, 1);
      g.fillStyle = 'rgba(120,100,70,0.28)';
      g.fillRect(34, 20, 188, 4);
      g.fillRect(34, 20, 4, 216);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(34, 232, 188, 4);
      g.fillRect(218, 20, 4, 216);
      g.fillStyle = 'rgba(120,100,70,0.12)';
      g.fillRect(42, 28, 172, 200);
      this.grime(g, 0.3, 4);
    },
    redgranite(g) {
      const n = this.noise[3];
      this.pixels(g, (x, y, d, i, k) => { const h = N.hash2(x, y, 9); const v = 0.8 + n[k] * 0.35 + (h > 0.93 ? 0.3 : h < 0.06 ? -0.35 : 0); d[i] = 128 * v; d[i + 1] = 60 * v; d[i + 2] = 52 * v; d[i + 3] = 255; });
      g.strokeStyle = 'rgba(30,12,10,0.7)';
      g.lineWidth = 2;
      for (let y = 0; y <= S; y += 86) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
      for (let y = 0; y < S; y += 86) for (let x = (y / 86) % 2 ? 64 : 0; x <= S; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 86); g.stroke(); }
    },
    brickpave(g) {
      g.fillStyle = '#6a4a40';
      g.fillRect(0, 0, S, S);
      const rng = N.rng(83);
      for (let y = 0; y < S; y += 16) for (let x = (y / 16) % 2 ? -16 : 0; x < S; x += 32) {
        const v = 0.85 + rng() * 0.3;
        g.fillStyle = `rgb(${158 * v | 0},${92 * v | 0},${78 * v | 0})`;
        g.fillRect(x + 1, y + 1, 30, 14);
      }
      this.grime(g, 0.45, 1);
    },
    marble(g) {
      const n = this.noise[2], m = this.noise[4];
      this.pixels(g, (x, y, d, i, k) => {
        const vein = Math.abs(Math.sin(x * 0.035 + y * 0.012 + n[k] * 7.5 + m[k] * 3));
        const v = 236 - Math.pow(1 - vein, 6) * 40 - n[k] * 16;
        d[i] = v; d[i + 1] = v * 0.99; d[i + 2] = v * 0.97; d[i + 3] = 255;
      });
      g.strokeStyle = 'rgba(90,86,80,0.45)';
      g.lineWidth = 1.5;
      for (let y = 0; y <= S; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
      for (let x = 0; x <= S; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S); g.stroke(); }
    },
    lino(g) {
      this.tone(g, '#6e4a36', 0.18, 3);
      const rng = N.rng(211);
      for (let k = 0; k < 1800; k++) { g.fillStyle = rng() < 0.5 ? 'rgba(40,24,16,0.5)' : 'rgba(160,120,90,0.4)'; g.fillRect(rng() * S, rng() * S, 2, 1); }
      g.fillStyle = 'rgba(0,0,0,0.12)';
      for (let x = 0; x < S; x += 16) g.fillRect(x, 0, 2, S);
    },
    metromap(g) {
      g.fillStyle = '#f4f2ea';
      g.fillRect(0, 0, S, S);
      g.strokeStyle = '#2a2a2c';
      g.lineWidth = 4;
      g.strokeRect(2, 2, S - 4, S - 4);
      g.fillStyle = '#1a1a1c';
      g.textAlign = 'center';
      g.font = 'bold 13px Arial';
      g.fillText('СХЕМА ЛИНИЙ МЕТРОПОЛИТЕНА', S / 2, 22);
      g.font = 'bold 9px Arial';
      g.fillText('НИЖНИЙ НОВГОРОД', S / 2, 36);
      const red = ['Парк культуры', 'Кировская', 'Комсомольская', 'Автозаводская', 'Пролетарская', 'Двигатель Революции', 'Заречная', 'Ленинская', 'Чкаловская', 'Московская'];
      const y0 = 176, x0 = 18, dx = 22;
      g.strokeStyle = '#d42a2a';
      g.lineWidth = 6;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + dx * 9, y0); g.stroke();
      g.strokeStyle = '#2a5ad4';
      g.beginPath(); g.moveTo(x0 + dx * 9, y0); g.lineTo(x0 + dx * 9 + 16, y0 - 44); g.lineTo(x0 + dx * 9 + 16, y0 - 104); g.stroke();
      const dot = (x, y, col, big) => { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, big ? 6 : 4.5, 0, 7); g.fill(); g.strokeStyle = col; g.lineWidth = 2.5; g.stroke(); };
      red.forEach((name, i) => {
        const x = x0 + dx * i;
        dot(x, y0, '#d42a2a', i < 4);
        g.save(); g.translate(x + 2, y0 - 10); g.rotate(-1.05);
        g.textAlign = 'left'; g.font = (i < 4 ? 'bold 10px' : '9px') + ' Arial'; g.fillStyle = '#1a1a1c';
        g.fillText(name, 0, 0); g.restore();
      });
      [['Канавинская', -44], ['Бурнаковская', -104]].forEach(([name, dy]) => {
        const x = x0 + dx * 9 + 16, y = y0 + dy;
        dot(x, y, '#2a5ad4', false);
        g.textAlign = 'right'; g.font = '9px Arial'; g.fillStyle = '#1a1a1c';
        g.fillText(name, x - 8, y + 3);
      });
      g.textAlign = 'left';
      g.fillStyle = '#d42a2a'; g.fillRect(14, 214, 18, 5);
      g.fillStyle = '#1a1a1c'; g.font = '9px Arial'; g.fillText('Автозаводская линия', 38, 220);
      g.fillStyle = '#2a5ad4'; g.fillRect(14, 228, 18, 5);
      g.fillStyle = '#1a1a1c'; g.fillText('Сормовская линия', 38, 234);
    },
    mosaic(g) {
      const sky = g.createLinearGradient(0, 0, 0, 150);
      sky.addColorStop(0, '#9cc4e8'); sky.addColorStop(1, '#e8eef0');
      g.fillStyle = sky; g.fillRect(0, 0, 128, 150);
      g.fillStyle = '#3a6a9a'; g.fillRect(0, 150, 128, 106);
      g.fillStyle = 'rgba(220,235,245,0.5)';
      for (let y = 158; y < 256; y += 9) for (let x = (y % 2) * 6; x < 128; x += 18) g.fillRect(x, y, 10, 2);
      g.fillStyle = '#3a7a3a';
      for (const [x, y, r] of [[10, 120, 26], [118, 116, 30], [22, 140, 18], [104, 140, 20]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
      g.fillStyle = '#f0ece0';
      g.fillRect(30, 132, 68, 8);
      for (let k = 0; k < 5; k++) g.fillRect(34 + k * 14, 86, 6, 46);
      g.beginPath(); g.ellipse(64, 86, 40, 22, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#c8c0b0'; g.fillRect(26, 82, 76, 5);
      g.fillStyle = 'rgba(240,236,224,0.45)';
      for (let k = 0; k < 5; k++) g.fillRect(34 + k * 14, 156, 6, 30);
      g.fillStyle = '#e8d8b8'; g.fillRect(128, 0, 128, 256);
      g.fillStyle = '#b07a4a';
      g.beginPath(); g.moveTo(168, 250); g.lineTo(216, 250); g.lineTo(208, 196); g.quadraticCurveTo(192, 176, 176, 196); g.closePath(); g.fill();
      g.strokeStyle = '#3a7a3a'; g.lineWidth = 4;
      const stems = [[150, 70], [172, 40], [192, 30], [214, 44], [236, 72], [160, 110], [226, 112]];
      for (const [x, y] of stems) { g.beginPath(); g.moveTo(192, 190); g.quadraticCurveTo((x + 192) / 2, y + 70, x, y); g.stroke(); }
      const cols = ['#d42a3a', '#f0c020', '#3a5ad4', '#e86a20', '#d42a8a', '#f4f0e8', '#d42a3a'];
      stems.forEach(([x, y], i) => {
        g.fillStyle = cols[i];
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.beginPath(); g.ellipse(x + Math.cos(a) * 8, y + Math.sin(a) * 8, 7, 4, a, 0, 7); g.fill(); }
        g.fillStyle = '#f0d040'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill();
      });
      g.fillStyle = '#3a7a3a';
      for (const [x, y, a] of [[166, 150, 0.6], [218, 146, -0.6], [180, 120, 0.9], [206, 124, -0.9]]) { g.beginPath(); g.ellipse(x, y, 12, 5, a, 0, 7); g.fill(); }
      const img = g.getImageData(0, 0, S, S), d = img.data;
      for (let ty = 0; ty < S; ty += 4) for (let tx = 0; tx < S; tx += 4) {
        let r = 0, gg = 0, b = 0;
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const i = ((ty + y) * S + tx + x) * 4; r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
        const j = 0.88 + N.hash2(tx, ty, 17) * 0.22;
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
          const i = ((ty + y) * S + tx + x) * 4, grout = x === 3 || y === 3;
          d[i] = grout ? 120 : r / 16 * j; d[i + 1] = grout ? 116 : gg / 16 * j; d[i + 2] = grout ? 108 : b / 16 * j; d[i + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    },
    mgranite(g) {
      const n = this.noise[3], m = this.noise[2];
      this.pixels(g, (x, y, d, i, k) => { const v = 152 + (n[k] - 0.5) * 24 + (m[k] - 0.5) * 12; d[i] = v * 1.02; d[i + 1] = v; d[i + 2] = v * 0.97; d[i + 3] = 255; });
      g.strokeStyle = 'rgba(46,44,42,0.45)';
      g.lineWidth = 2;
      for (let y = 0; y <= S; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
      for (let x = 0; x <= S; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S); g.stroke(); }
    },
    autopanel(g) {
      this.tone(g, '#8a6a3e', 0.25, 2);
      const hi = '#d8b878', lo = 'rgba(40,24,10,0.6)';
      const shape = fn => { g.save(); g.translate(3, 3); g.fillStyle = lo; fn(); g.restore(); g.fillStyle = hi; fn(); };
      shape(() => { g.beginPath(); g.arc(56, 78, 34, 0, 7); g.fill(); });
      g.fillStyle = '#8a6a3e'; g.beginPath(); g.arc(56, 78, 14, 0, 7); g.fill();
      shape(() => { for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; g.save(); g.translate(56 + Math.cos(a) * 36, 78 + Math.sin(a) * 36); g.rotate(a); g.fillRect(-6, -7, 12, 14); g.restore(); } });
      shape(() => { g.beginPath(); g.moveTo(108, 196); g.lineTo(116, 168); g.lineTo(150, 160); g.lineTo(176, 140); g.lineTo(212, 140); g.lineTo(232, 162); g.lineTo(248, 168); g.lineTo(250, 196); g.closePath(); g.fill(); });
      g.fillStyle = '#5a4424';
      for (const x of [134, 222]) { g.beginPath(); g.arc(x, 198, 14, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(60,40,20,0.7)'; g.fillRect(180, 146, 28, 14); g.fillRect(212, 148, 14, 12);
      shape(() => { for (const [x, h] of [[150, 90], [176, 110], [202, 80]]) g.fillRect(x, 120 - h, 14, h); g.fillRect(140, 112, 90, 10); });
      g.strokeStyle = hi; g.lineWidth = 3;
      for (const [x, h] of [[157, 90], [183, 110], [209, 80]]) { g.beginPath(); g.moveTo(x, 120 - h); g.bezierCurveTo(x + 10, 6, x + 30, 14, x + 44, 2); g.stroke(); }
      shape(() => { g.fillRect(8, 222, 240, 10); for (let x = 16; x < 248; x += 26) { g.beginPath(); g.arc(x, 236, 7, 0, 7); g.fill(); } });
      g.strokeStyle = 'rgba(40,24,10,0.5)'; g.lineWidth = 4; g.strokeRect(2, 2, S - 4, S - 4);
    }
  };

  const FACES = [
    {}, { stubble: 0.1 }, { mustache: 1 }, { brow: 1.6, frown: 1 }, { old: 1, brow: 0.6 }, { old: 1, mustache: 1.3, brow: 0.7 },
    { female: 1, lips: 0.85, lash: 1 }, { female: 1, lips: 0.45 }, { female: 1, old: 1, lips: 0.2 }, { stubble: 0.13, scar: 1, tired: 1, brow: 1.2 },
    { brow: 1.4, smile: 1, round: 1 }, { goatee: 1, stubble: 0.08 }, { female: 1, lips: 1, lash: 1, shadow: 1 }, { stubble: 0.12, bruise: 1, brow: 1.3, frown: 1 },
    { brow: 0.8, thin: 1 }, { beard: 1 }
  ];
  N.FACE_COUNT = FACES.length;

  function drawFace(g, ox, oy, o) {
    g.save();
    g.translate(ox, oy);
    const el = (x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 7); g.fill(); };
    if (o.stubble) { const rng = N.rng(7 + ox + oy); for (let k = 0; k < 300; k++) { const x = 18 + rng() * 28, y = 38 + rng() * 25; const dx = (x - 32) / 16, dy = (y - 52) / 14; if (dx * dx + dy * dy > 1 || y < 43 && Math.abs(x - 32) < 7) continue; g.fillStyle = `rgba(35,25,20,${o.stubble})`; g.fillRect(x, y, 1, 1); } }
    if (o.beard) el(32, 54, 14, 10, 'rgba(45,30,20,0.85)');
    if (o.goatee) { el(32, 55, 5, 6, 'rgba(45,30,20,0.85)'); g.fillStyle = 'rgba(45,30,20,0.8)'; g.fillRect(27, 45.5, 10, 1.6); }
    for (const s of [-1, 1]) {
      const ex = 32 + s * 7;
      el(ex, 29.5, 5.5, 3.6, 'rgba(70,35,25,0.16)');
      if (o.tired || o.old) el(ex, 32.2, 3.6, 1.2, 'rgba(80,40,40,0.18)');
      el(ex, 29.5, 3.2, 1.7, 'rgba(244,240,232,1)');
      el(ex + s * -0.3, 29.6, 1.45, 1.5, o.female ? 'rgba(60,90,120,1)' : 'rgba(70,48,30,1)');
      el(ex + s * -0.3, 29.6, 0.6, 0.6, 'rgba(10,8,8,1)');
      g.strokeStyle = o.lash ? 'rgba(10,8,8,0.95)' : 'rgba(45,25,18,0.75)';
      g.lineWidth = o.lash ? 1.2 : 0.8;
      g.beginPath(); g.ellipse(ex, 29.9, 3.3, 2, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      if (o.shadow) el(ex, 27.2, 3.6, 1.6, 'rgba(70,90,190,0.45)');
      const bw = o.thin ? 0.9 : 1.4 * (o.brow || 1);
      g.fillStyle = o.old ? 'rgba(150,140,130,0.6)' : `rgba(40,26,16,${o.female ? 0.75 : 0.85})`;
      g.save(); g.translate(ex, 25.2 - (o.frown ? 0 : 0.4)); g.rotate(s * (o.frown ? -0.18 : 0.08)); g.fillRect(-4.2, -bw / 2, 8.4, bw); g.restore();
      if (o.old) { g.fillStyle = 'rgba(70,40,30,0.18)'; g.fillRect(ex + s * 4.5, 28, s * 3, 0.8); g.fillRect(ex + s * 4.5, 30.5, s * 3, 0.8); }
    }
    if (o.old) { g.fillStyle = 'rgba(70,40,30,0.16)'; for (let y = 16; y < 22; y += 2.5) g.fillRect(24, y, 16, 0.8); g.fillRect(25, 44, 1, 7); g.fillRect(38, 44, 1, 7); }
    g.fillStyle = 'rgba(70,35,25,0.22)';
    g.fillRect(34, 30, 1.6, 10);
    el(32, 40.5, 4, 1.8, 'rgba(70,35,25,0.18)');
    el(30.2, 41, 0.9, 0.6, 'rgba(40,15,10,0.55)');
    el(33.8, 41, 0.9, 0.6, 'rgba(40,15,10,0.55)');
    if (o.mustache) el(32, 45, 6 * o.mustache, 1.6 * o.mustache, o.old ? 'rgba(130,120,110,0.85)' : 'rgba(45,30,20,0.9)');
    const lw = o.round ? 5.5 : o.female ? 4.6 : 5;
    el(32, 48.6, lw, o.female ? 1.9 : 1.4, o.female ? `rgba(180,30,50,${o.lips || 0.4})` : 'rgba(140,60,55,0.45)');
    g.strokeStyle = 'rgba(70,25,20,0.8)';
    g.lineWidth = 0.9;
    g.beginPath();
    if (o.smile) { g.moveTo(27, 48); g.quadraticCurveTo(32, 50.5, 37, 48); } else if (o.frown) { g.moveTo(27, 49.4); g.quadraticCurveTo(32, 47.8, 37, 49.4); } else { g.moveTo(27.5, 48.7); g.lineTo(36.5, 48.7); }
    g.stroke();
    el(32, 55.5, 4, 1.5, 'rgba(70,35,25,0.12)');
    if (o.female) { el(24, 38, 3.5, 2.5, 'rgba(220,90,90,0.16)'); el(40, 38, 3.5, 2.5, 'rgba(220,90,90,0.16)'); }
    if (o.scar) { g.strokeStyle = 'rgba(150,70,70,0.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(23, 21.5); g.lineTo(27, 27.5); g.stroke(); }
    if (o.bruise) el(40, 33, 3.5, 2.5, 'rgba(90,60,110,0.3)');
    g.restore();
  }

  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (c, a) => `rgba(${N.clamp(c[0], 0, 255) | 0},${N.clamp(c[1], 0, 255) | 0},${N.clamp(c[2], 0, 255) | 0},${a === undefined ? 1 : a})`;

  Tex.prototype.backdrop = function (g, c) {
    g.clearRect(0, 0, S, S);
    g.fillStyle = css(c, 0.2);
    g.fillRect(0, 0, S, S);
    g.lineCap = 'round';
  };

  Tex.prototype.leaf = function (g, x, y, a, L, W, col, vein) {
    const c = Math.cos(a), s = Math.sin(a), tx = x + c * L, ty = y + s * L, mx = x + c * L * 0.42, my = y + s * L * 0.42;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(mx - s * W, my + c * W, tx, ty);
    g.quadraticCurveTo(mx + s * W, my - c * W, x, y);
    g.fill();
    if (vein) {
      g.strokeStyle = vein;
      g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + c * L * 0.85, y + s * L * 0.85); g.stroke();
    }
  };

  Tex.prototype.cluster = function (g, o) {
    const rng = N.rng(o.seed);
    this.backdrop(g, o.bg);
    const cx = 128, cy = 124;
    for (let k = 0; k < o.twigs; k++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 3.4, r = 70 + rng() * 40;
      g.strokeStyle = css([70 + rng() * 20, 56 + rng() * 14, 40]);
      g.lineWidth = 2.5 + rng() * 2;
      g.beginPath(); g.moveTo(cx + (rng() - 0.5) * 20, 240);
      g.quadraticCurveTo(cx + Math.cos(a) * r * 0.3, cy + 40, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9);
      g.stroke();
    }
    const L = [];
    for (let k = 0; k < o.n; k++) {
      const a = rng() * Math.PI * 2, rr = Math.sqrt(rng());
      const edge = 0.94 - 0.22 * N.noise2(Math.cos(a) * 2.2 + 3, Math.sin(a) * 2.2 + 3, o.seed);
      L.push({ x: cx + Math.cos(a) * rr * 110 * edge, y: cy + Math.sin(a) * rr * 110 * edge, rr, a });
    }
    L.sort((p, q) => p.rr - q.rr);
    for (const l of L) {
      const light = N.clamp(0.22 + l.rr * 0.35 + (cy - l.y) / 220 * 0.55 - (l.x - cx) / 220 * 0.15 + (rng() - 0.5) * 0.35, 0, 1);
      const c = mixc(o.dark, o.light, light);
      const len = o.leaf[0] + rng() * o.leaf[1];
      this.leaf(g, l.x, l.y, l.a + (rng() - 0.5) * 1.6, len, len * o.wr, css(c), o.vein ? css(mixc(c, [230, 240, 190], 0.35), 0.5) : null);
    }
    if (o.fruit) for (let k = 0; k < o.fruit.n; k++) {
      const a = rng() * Math.PI * 2, rr = 0.25 + rng() * 0.6, x = cx + Math.cos(a) * rr * 100, y = cy + Math.sin(a) * rr * 100, r = o.fruit.r * (0.8 + rng() * 0.4);
      g.fillStyle = o.fruit.cols[k % o.fruit.cols.length];
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,240,200,0.5)';
      g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.35, 0, 7); g.fill();
    }
    if (o.berries) for (let k = 0; k < o.berries.n; k++) {
      const a = rng() * Math.PI * 2, rr = 0.2 + rng() * 0.6, x = cx + Math.cos(a) * rr * 96, y = cy + Math.sin(a) * rr * 96;
      g.strokeStyle = 'rgba(110,72,40,1)';
      g.lineWidth = 1.2;
      const B = [];
      for (let j = 0; j < 26; j++) B.push([x + (rng() - 0.5) * 30, y + (rng() - 0.3) * 22]);
      for (const [bx, by] of B) { g.beginPath(); g.moveTo(x, y - 14); g.lineTo(bx, by); g.stroke(); }
      B.forEach(([bx, by], j) => { g.fillStyle = o.berries.cols[j % o.berries.cols.length]; g.beginPath(); g.arc(bx, by, 3.4, 0, 7); g.fill(); });
    }
    if (o.blooms) for (let k = 0; k < o.blooms.n; k++) {
      const a = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * 0.9, x = cx + Math.cos(a) * rr * 104, y = cy + Math.sin(a) * rr * 104, r = o.blooms.r * (0.8 + rng() * 0.4);
      g.fillStyle = o.blooms.col;
      for (let j = 0; j < 5; j++) { const b = j / 5 * Math.PI * 2 + a; g.beginPath(); g.ellipse(x + Math.cos(b) * r * 0.6, y + Math.sin(b) * r * 0.6, r * 0.55, r * 0.36, b, 0, 7); g.fill(); }
      g.fillStyle = o.blooms.mid;
      g.beginPath(); g.arc(x, y, r * 0.26, 0, 7); g.fill();
    }
  };

  Tex.prototype.sprays = function (g, o) {
    const rng = N.rng(o.seed);
    this.backdrop(g, o.bg);
    const strands = [];
    for (let k = 0; k < o.n; k++) {
      const y = 4 + rng() * 56;
      strands.push({ x: 16 + rng() * 224, y, len: Math.min(250 - y, 150 + rng() * 110), sway: (rng() - 0.5) * 44, z: rng() });
    }
    strands.sort((a, b) => a.z - b.z);
    for (const s of strands) {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([s.x + s.sway * t * t, s.y + s.len * t]); }
      g.strokeStyle = 'rgba(84,64,46,0.9)';
      g.lineWidth = 1.3;
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
      for (let i = 1; i < pts.length; i++) {
        const [x, y] = pts[i];
        for (const side of [-1, 1]) {
          if (rng() < 0.12) continue;
          const light = N.clamp(0.3 + s.z * 0.45 - (y / S) * 0.35 + (rng() - 0.5) * 0.3, 0, 1);
          const len = o.leaf[0] + rng() * o.leaf[1];
          this.leaf(g, x, y, Math.PI / 2 - side * (0.6 + rng() * 0.7), len, len * 0.62, css(mixc(o.dark, o.light, light)));
        }
      }
    }
  };

  Tex.prototype.tufts = function (g, o) {
    const rng = N.rng(o.seed);
    this.backdrop(g, o.bg);
    const T = [];
    for (let k = 0; k < o.n; k++) { const a = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * 96; T.push({ x: 128 + Math.cos(a) * rr, y: 124 + Math.sin(a) * rr * 0.82, z: rng() }); }
    g.strokeStyle = css(o.twig);
    for (const t of T) { g.lineWidth = 2.2; g.beginPath(); g.moveTo(128, 240); g.quadraticCurveTo(128, t.y + 40, t.x, t.y); g.stroke(); }
    T.sort((a, b) => a.z - b.z);
    g.lineWidth = 1.7;
    for (const t of T) {
      for (let j = 0; j < 70; j++) {
        const a = rng() * Math.PI * 2, len = o.len[0] + rng() * o.len[1];
        const light = N.clamp(0.18 + t.z * 0.5 + (124 - t.y) / 250 * 0.45 - Math.sin(a) * 0.15 + (rng() - 0.5) * 0.25, 0, 1);
        g.strokeStyle = css(mixc(o.dark, o.light, light));
        g.beginPath(); g.moveTo(t.x + Math.cos(a) * 2, t.y + Math.sin(a) * 2); g.lineTo(t.x + Math.cos(a) * len, t.y + Math.sin(a) * len * 0.85); g.stroke();
      }
    }
  };

  Tex.prototype.spruceBranch = function (g, o) {
    const rng = N.rng(o.seed);
    this.backdrop(g, o.bg);
    const twigs = [[t => [4 + t * 246, 116 + t * t * 30], 3.2]];
    for (let k = 1; k < 15; k++) {
      const t0 = k / 15, bx = 4 + t0 * 246, by = 116 + t0 * t0 * 30;
      for (const side of [-1, 1]) {
        const len = (1 - t0) * 92 + 16, ang = side * (0.7 + rng() * 0.3), dx = Math.cos(ang), dy = Math.sin(ang);
        twigs.push([t => [bx + dx * len * t, by + dy * len * t * 0.85 + t * t * 9], 1.3]);
      }
    }
    g.strokeStyle = css(o.twig);
    for (const [f, w] of twigs) {
      g.lineWidth = w;
      g.beginPath();
      for (let i = 0; i <= 10; i++) { const p = f(i / 10); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
      g.stroke();
    }
    g.lineWidth = 1.7;
    for (const [f] of twigs) {
      for (let t = 0.04; t <= 1; t += 0.034) {
        const p = f(t), q = f(Math.min(1, t + 0.02)), da = Math.atan2(q[1] - p[1], q[0] - p[0]);
        for (const side of [-1, 1]) for (let j = 0; j < 2; j++) {
          const a = da + side * (0.6 + rng() * 0.7), len = 7 + rng() * 6;
          const light = N.clamp(0.35 + (side < 0 ? 0.3 : -0.18) + t * 0.2 + (rng() - 0.5) * 0.3, 0, 1);
          g.strokeStyle = css(mixc(o.dark, o.light, light));
          g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len); g.stroke();
        }
      }
    }
  };

  Tex.prototype.hedgeTex = function (g, o) {
    const rng = N.rng(o.seed);
    this.backdrop(g, o.dark);
    const top = x => 18 + 9 * Math.sin(x / S * Math.PI * 6 + 1) + 6 * Math.sin(x / S * Math.PI * 14 + 2);
    g.fillStyle = css(mixc(o.dark, [0, 0, 0], 0.3));
    g.fillRect(0, 46, S, S - 46);
    for (let k = 0; k < 3600; k++) {
      const x = rng() * S, y = rng() * S;
      if (y < top(x)) continue;
      const light = N.clamp(0.2 + (1 - y / S) * 0.5 + (rng() - 0.5) * 0.45, 0, 1);
      const len = 9 + rng() * 6, a = rng() * Math.PI * 2, c = css(mixc(o.dark, o.light, light));
      for (const dx of [0, -S, S]) if (x + dx > -20 && x + dx < S + 20) this.leaf(g, x + dx, y, a, len, len * 0.58, c);
    }
  };

  Tex.prototype.blades = function (g, o) {
    const rng = N.rng(o.seed);
    this.backdrop(g, o.bg);
    const B = [];
    for (let k = 0; k < o.n; k++) B.push({ x: 128 + (rng() - 0.5) * (o.base || 70), h: o.h[0] + rng() * o.h[1], lean: (rng() - 0.5) * o.spread, w: o.w[0] + rng() * o.w[1], z: rng(), dry: rng() < o.dryP });
    B.sort((a, b) => a.z - b.z);
    for (const b of B) {
      const tipX = b.x + b.lean, tipY = Math.max(4, 256 - b.h), cX = b.x + b.lean * 0.15, cY = 256 - b.h * 0.55;
      const gr = g.createLinearGradient(0, 256, 0, tipY);
      const base = mixc(o.dark, [0, 0, 0], 0.3), top = b.dry ? o.dry : mixc(o.dark, o.light, 0.45 + b.z * 0.55);
      gr.addColorStop(0, css(base)); gr.addColorStop(0.5, css(mixc(base, top, 0.65))); gr.addColorStop(1, css(top));
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(b.x - b.w, 256); g.quadraticCurveTo(cX - b.w * 0.5, cY, tipX, tipY); g.quadraticCurveTo(cX + b.w * 0.5, cY, b.x + b.w, 256); g.fill();
    }
  };

  Tex.prototype.bloom = function (g, kind, x, y, r, rng) {
    const dot = (px, py, pr, c) => { g.fillStyle = c; g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill(); };
    if (kind === 0) {
      g.fillStyle = '#f8f6f0';
      for (let j = 0; j < 9; j++) { const b = j / 9 * Math.PI * 2; g.beginPath(); g.ellipse(x + Math.cos(b) * r * 0.7, y + Math.sin(b) * r * 0.55, r * 0.5, r * 0.2, b, 0, 7); g.fill(); }
      dot(x, y, r * 0.32, '#f0c828');
    } else if (kind === 1) {
      g.fillStyle = '#3a6ae0';
      for (let j = 0; j < 8; j++) { const b = j / 8 * Math.PI * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b - 0.25) * r, y + Math.sin(b - 0.25) * r * 0.7); g.lineTo(x + Math.cos(b + 0.25) * r, y + Math.sin(b + 0.25) * r * 0.7); g.fill(); }
      dot(x, y, r * 0.25, '#28308a');
    } else if (kind === 2) {
      g.fillStyle = '#f4d020';
      for (let j = 0; j < 5; j++) { const b = j / 5 * Math.PI * 2; g.beginPath(); g.arc(x + Math.cos(b) * r * 0.45, y + Math.sin(b) * r * 0.4, r * 0.45, 0, 7); g.fill(); }
      dot(x, y, r * 0.2, '#c89010');
    } else if (kind === 3) {
      for (let j = 0; j < 14; j++) dot(x + (rng() - 0.5) * r, y + (rng() - 0.5) * r, r * 0.3, j % 2 ? '#d070a0' : '#e8a0c8');
    } else {
      g.fillStyle = '#8a50c8';
      g.beginPath(); g.moveTo(x - r * 0.6, y - r * 0.6); g.quadraticCurveTo(x, y + r * 1.2, x + r * 0.6, y - r * 0.6); g.fill();
    }
  };

  Tex.prototype.flowerHeads = function (g, rng, n) {
    for (let k = 0; k < n; k++) {
      const x = 34 + rng() * 188, y = 30 + rng() * 120, r = 5 + rng() * 4;
      g.strokeStyle = 'rgba(70,104,40,1)';
      g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(x + (rng() - 0.5) * 24, 256); g.quadraticCurveTo(x + (rng() - 0.5) * 10, (y + 256) / 2, x, y); g.stroke();
      this.bloom(g, k % 5, x, y, r, rng);
    }
  };

  Tex.prototype.reedTex = function (g, o) {
    const rng = N.rng(o.seed);
    this.blades(g, { seed: o.seed, n: 40, h: [170, 80], spread: 80, base: 120, dark: [62, 88, 40], light: [160, 176, 92], dry: [188, 170, 104], dryP: 0.22, w: [3, 2.5], bg: [96, 116, 60] });
    for (let k = 0; k < 6; k++) {
      const x = 70 + rng() * 116, top = 18 + rng() * 60, lean = (rng() - 0.5) * 24;
      g.strokeStyle = 'rgba(96,110,56,1)';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, 256); g.quadraticCurveTo(x + lean * 0.2, 140, x + lean, top); g.stroke();
      g.fillStyle = '#5a3a24';
      g.beginPath(); g.ellipse(x + lean * 0.95, top + 26, 5, 18, lean * 0.004, 0, 7); g.fill();
      g.fillStyle = 'rgba(140,100,70,0.6)';
      g.fillRect(x + lean * 0.95 - 3, top + 14, 2, 22);
    }
  };

  Tex.prototype.weedTex = function (g, o) {
    const rng = N.rng(o.seed);
    this.backdrop(g, [58, 92, 40]);
    const quad = (qx, qy, fn) => { g.save(); g.beginPath(); g.rect(qx + 2, qy + 2, 124, 124); g.clip(); g.translate(qx, qy); g.scale(0.5, 0.5); fn(); g.restore(); };
    quad(0, 0, () => {
      g.strokeStyle = '#6a7a3a'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(128, 250); g.quadraticCurveTo(122, 140, 132, 46); g.stroke();
      for (let k = 0; k < 7; k++) { g.fillStyle = k % 2 ? '#7a4a6a' : '#6a3a5a'; g.beginPath(); g.arc(120 + (k % 3) * 9, 40 + Math.floor(k / 3) * 12 + (k % 2) * 4, 8, 0, 7); g.fill(); }
      for (let k = 0; k < 8; k++) {
        const a = -Math.PI / 2 + (k / 7 - 0.5) * 2.8, L = 92 + rng() * 40, c = mixc([34, 66, 26], [106, 150, 62], 0.3 + rng() * 0.5);
        this.leaf(g, 128, 248, a, L, L * 0.95, css(c), css(mixc(c, [220, 230, 180], 0.4), 0.7));
      }
    });
    quad(128, 0, () => {
      for (let s = 0; s < 4; s++) {
        const x = 70 + s * 36 + (rng() - 0.5) * 10, top = 24 + rng() * 40;
        g.strokeStyle = '#4a6a2a'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x, 252); g.lineTo(x + (rng() - 0.5) * 12, top); g.stroke();
        for (let y = 230; y > top + 10; y -= 26) for (const side of [-1, 1]) {
          const L = 30 + (y - top) * 0.08 + rng() * 8, c = mixc([30, 60, 24], [96, 136, 56], 0.3 + rng() * 0.5);
          this.leaf(g, x, y, -Math.PI / 2 + side * (1.1 + rng() * 0.3), L, L * 0.5, css(c));
        }
      }
    });
    quad(0, 128, () => {
      for (let f = 0; f < 7; f++) {
        const a = -Math.PI / 2 + (f / 6 - 0.5) * 2.6, L = 150 + rng() * 70, bend = 0.5 + rng() * 0.3;
        const at = t => [128 + Math.cos(a) * L * t + Math.cos(a + bend) * 20 * t * t, 250 + Math.sin(a) * L * t + Math.sin(a + bend) * 30 * t * t];
        g.strokeStyle = '#5a7a30'; g.lineWidth = 2.4;
        g.beginPath(); for (let i = 0; i <= 10; i++) { const p = at(i / 10); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.stroke();
        for (let t = 0.12; t < 0.98; t += 0.05) {
          const p = at(t), q = at(t + 0.02), da = Math.atan2(q[1] - p[1], q[0] - p[0]), L2 = 30 * (1 - t) + 6;
          const c = css(mixc([40, 80, 30], [130, 170, 70], 0.3 + rng() * 0.5));
          this.leaf(g, p[0], p[1], da - 1.2, L2, L2 * 0.36, c);
          this.leaf(g, p[0], p[1], da + 1.2, L2, L2 * 0.36, c);
        }
      }
    });
    quad(128, 128, () => {
      g.strokeStyle = '#5a7a34'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(128, 252); g.quadraticCurveTo(124, 140, 130, 14); g.stroke();
      for (let k = 0; k < 5; k++) { const L = 46 + rng() * 20, c = mixc([40, 76, 30], [110, 150, 60], 0.4 + rng() * 0.4); this.leaf(g, 128, 236 - k * 12, -Math.PI / 2 + (k % 2 ? 1 : -1) * (1.0 + rng() * 0.4), L, L * 0.9, css(c)); }
      for (let k = 0; k < 9; k++) {
        const y = 24 + k * 16, x = 128 + (k % 2 ? 14 : -14), r = 13 - k * 0.5;
        g.fillStyle = k % 3 === 0 ? '#f0a0c0' : k % 3 === 1 ? '#e070a0' : '#f8d0e0';
        for (let j = 0; j < 5; j++) { const b = j / 5 * Math.PI * 2 + k; g.beginPath(); g.arc(x + Math.cos(b) * r * 0.45, y + Math.sin(b) * r * 0.45, r * 0.55, 0, 7); g.fill(); }
        g.fillStyle = '#f8f0c0'; g.beginPath(); g.arc(x, y, r * 0.2, 0, 7); g.fill();
      }
    });
  };

  Tex.prototype.lilyTex = function (g, o) {
    const rng = N.rng(o.seed);
    this.backdrop(g, [52, 84, 40]);
    const P = [];
    for (let k = 0; k < 60 && P.length < 8; k++) {
      const r = 26 + rng() * 20, x = r + rng() * (S - 2 * r), y = r + rng() * (S - 2 * r);
      if (P.some(p => Math.hypot(p.x - x, p.y - y) < (p.r + r) * 0.85)) continue;
      P.push({ x, y, r });
    }
    for (const p of P) {
      const a = rng() * Math.PI * 2, c = mixc([40, 82, 32], [104, 146, 60], 0.3 + rng() * 0.5);
      g.fillStyle = css(c);
      g.beginPath(); g.moveTo(p.x, p.y); g.arc(p.x, p.y, p.r, a + 0.18, a + Math.PI * 2 - 0.18); g.closePath(); g.fill();
      g.strokeStyle = css(mixc(c, [210, 230, 160], 0.35), 0.7);
      g.lineWidth = 1;
      for (let j = 0; j < 9; j++) { const b = a + 0.3 + j / 9 * (Math.PI * 2 - 0.6); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + Math.cos(b) * p.r * 0.9, p.y + Math.sin(b) * p.r * 0.9); g.stroke(); }
    }
    for (let k = 0; k < 3; k++) {
      const p = P[k % P.length], x = p.x + (rng() - 0.5) * p.r * 0.6, y = p.y + (rng() - 0.5) * p.r * 0.6;
      for (const [n, r, col] of [[10, 13, '#f4f2ee'], [8, 9, '#fbfaf8']]) {
        g.fillStyle = col;
        for (let j = 0; j < n; j++) { const b = j / n * Math.PI * 2 + r; g.beginPath(); g.ellipse(x + Math.cos(b) * r * 0.55, y + Math.sin(b) * r * 0.55, r * 0.55, r * 0.22, b, 0, 7); g.fill(); }
      }
      g.fillStyle = '#f0c828'; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill();
    }
  };

  Tex.prototype.crown = function (g, o) {
    const rng = N.rng(o.seed);
    this.backdrop(g, mixc(o.dark, o.light, 0.4));
    g.strokeStyle = css(o.twig || [70, 58, 46]);
    for (let k = 0; k < 10; k++) {
      const x = 128 + (rng() - 0.5) * 210, y = 30 + rng() * 170;
      if (!o.shape(x, y)) continue;
      g.lineWidth = 2 + rng() * 3;
      g.beginPath(); g.moveTo(128, 256); g.quadraticCurveTo(128, y + 60, x, y); g.stroke();
    }
    const P = [];
    for (let k = 0; k < 4000 && P.length < o.clumps; k++) {
      const x = rng() * S, y = rng() * S;
      if (o.shape(x, y)) P.push({ x, y });
    }
    P.sort((a, b) => b.y - a.y);
    for (const p of P) {
      const top = 1 - p.y / S;
      for (let j = 0; j < o.per; j++) {
        const a = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * o.r;
        const x = p.x + Math.cos(a) * rr, y = p.y + Math.sin(a) * rr * 0.85 + (o.hang ? rr * 0.4 * o.hang : 0);
        if (!o.shape(x, y)) continue;
        const hl = (-Math.cos(a) * 0.35 - Math.sin(a) * 0.65) * rr / o.r;
        const t = N.clamp(0.12 + top * 0.45 + hl * 0.32 + (rng() - 0.5) * 0.25, 0, 1);
        const c = css(mixc(o.dark, o.light, t)), len = o.leaf[0] + rng() * o.leaf[1];
        if (o.needle) {
          const b = rng() * Math.PI * 2;
          g.strokeStyle = c;
          g.lineWidth = 2.4;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * len, y + Math.sin(b) * len * (o.droop ? 0.45 : 0.85) + (o.droop ? len * 0.35 : 0)); g.stroke();
        } else this.leaf(g, x, y, o.hang ? Math.PI / 2 + (rng() - 0.5) * 1.3 : rng() * Math.PI * 2, len, len * 0.6, c);
      }
    }
    if (o.fruit) for (let k = 0; k < 40; k++) {
      const x = rng() * S, y = rng() * S;
      if (!o.shape(x, y)) continue;
      g.fillStyle = o.fruit[k % o.fruit.length];
      g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill();
    }
  };

  N.Tex = Tex;
  N.TEX_NAMES = Object.keys(LAYERS);
  N.TEX = {};
  N.TEX_NAMES.forEach((n, i) => { N.TEX[n] = i; });

  const GUT = 4;
  const PLATE_CAP = 6;
  const LETTERING = ['МИЛИЦИЯ', 'ТАКСИ', 'СКОРАЯ', 'ОМОН', 'ДПС', 'ГАИ'];
  const ARIAL = 'bold {s}px Arial';
  const TIMES = 'bold {s}px "Times New Roman", serif';
  const SCRIPT = 'italic bold {s}px "Brush Script MT", "Segoe Script", Georgia, serif';
  N.SIGN_STYLE = {
    shop: { h: 64, size: 44, pad: 14, font: ARIAL, plate: true },
    road: { h: 64, size: 44, pad: 14, font: ARIAL, plate: true },
    boat: { h: 64, size: 44, pad: 14, font: ARIAL, plate: true },
    gov: { h: 64, size: 40, pad: 14, font: TIMES, plate: true },
    park: { h: 64, size: 40, pad: 14, font: TIMES, plate: true },
    board: { h: 64, size: 36, pad: 12, font: ARIAL, plate: true },
    roof: { h: 80, size: 70, pad: 6, font: ARIAL, track: true },
    roofsmall: { h: 80, size: 70, pad: 6, font: ARIAL, track: true },
    neon: { h: 128, size: 100, pad: 18, font: SCRIPT },
    neonsmall: { h: 64, size: 40, pad: 14, font: SCRIPT },
    relief: { h: 112, size: 80, pad: 10, font: TIMES, track: true },
    paint: { h: 112, size: 84, pad: 10, sx: 0.86, font: ARIAL, track: true },
    metro: { fix: [64, 64] },
    msign: { h: 64, size: 40, pad: 14, font: ARIAL, plate: true },
    mled: { fix: [40, 64] },
    mname: { h: 112, size: 80, pad: 22, font: TIMES, track: true },
    boxletter: { fix: [64, 80] },
    gazlogo: { fix: [512, 160] },
    mosaic: { fix: [256, 320] },
    billboard: { fix: [512, 192] },
    poster: { fix: [192, 288] }
  };

  N.atlasItems = (city, extra) => {
    const by = new Map();
    for (const s of city.signs.concat(extra || [])) {
      const key = s.style + '|' + s.text, a = s.w && s.h ? s.w / s.h : Infinity;
      const it = by.get(key);
      if (it) it.minA = Math.min(it.minA, a);
      else by.set(key, { key, style: s.style, text: s.text, s, minA: a });
    }
    const items = [...by.values()];
    for (const [cls, list] of Object.entries(N.PLATES)) list.forEach((text, i) => items.push({ key: 'plate|' + cls + '|' + i, style: 'plate', text, cls, fix: [150, 32] }));
    items.push({ key: 'checker', style: 'checker', fix: [128, 64] });
    for (const t of LETTERING) items.push({ key: 'text|' + t, style: 'lettering', text: t, fix: [256, 48] });
    items.push({ key: 'cross', style: 'cross', fix: [64, 64] });
    return items;
  };

  N.atlasLayout = (items, measure, W) => {
    const max = W - 2 * GUT;
    const cells = items.map(it => {
      const st = N.SIGN_STYLE[it.style] || {};
      const fix = it.fix || st.fix;
      if (fix) return Object.assign({ w: fix[0], h: fix[1], cap: 0 }, it);
      const fin = isFinite(it.minA);
      let h = st.h, size = st.size, sx = st.sx || 1, tr = 0;
      if (st.track && fin && it.minA * h > max) {
        const k = Math.max(48, Math.floor(max / it.minA)) / h;
        h = Math.round(h * k);
        size = Math.round(size * k);
      }
      const room = Math.min(max, fin ? it.minA * h : max) - 2 * st.pad;
      const n = [...it.text].length;
      let tw = measure(it.text, st.font.replace('{s}', size)) * sx;
      if (tw > room) {
        const k = room / tw;
        if (k >= 0.8) sx *= k;
        else { sx *= 0.8; size = Math.max(10, Math.floor(size * k / 0.8)); }
        tw = measure(it.text, st.font.replace('{s}', size)) * sx;
      } else if (st.track && fin && n > 1) tr = Math.min(size * 0.5, (room - tw) / ((n - 1) * sx));
      const w = Math.min(max, Math.ceil(tw + tr * sx * (n - 1) + 2 * st.pad));
      return Object.assign({ w, h, size, sx, tr, cap: st.plate ? PLATE_CAP : 0 }, it);
    });
    const order = cells.map((c, i) => i).sort((a, b) => cells[b].h - cells[a].h || a - b);
    const shelves = [];
    let used = 0;
    for (const i of order) {
      const c = cells[i], cw = c.w + 2 * GUT, ch = c.h + 2 * GUT;
      let sh = shelves.find(r => r.h >= ch && r.x + cw <= W);
      if (!sh) { sh = { y: used, h: ch, x: 0 }; shelves.push(sh); used += ch; }
      c.x = sh.x + GUT;
      c.y = sh.y + GUT;
      sh.x += cw;
    }
    return { cells, W, H: used <= W ? W : W * 2, used, gut: GUT };
  };

  N.atlasMap = L => {
    const map = {};
    for (const c of L.cells) map[c.key] = [(c.x + 0.5) / L.W, (c.y + 0.5) / L.H, (c.x + c.w - 0.5) / L.W, (c.y + c.h - 0.5) / L.H, c.w / c.h, c.cap ? c.cap / c.w : 0];
    return map;
  };

  const shadeCss = (h, k) => { const c = hex(h); return 'rgb(' + (c[0] * k | 0) + ',' + (c[1] * k | 0) + ',' + (c[2] * k | 0) + ')'; };
  const rrect = (g, x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };
  const adWheel = (g, x, y, r) => {
    g.fillStyle = '#1c1c1e';
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = '#b8bcc0';
    g.beginPath(); g.arc(x, y, r * 0.48, 0, 7); g.fill();
  };
  const AD_ART = [
    [/ПЕЙДЖ/, g => {
      g.fillStyle = '#26282c'; rrect(g, -52, -34, 104, 68, 12); g.fill();
      g.fillStyle = '#a8d088'; rrect(g, -42, -24, 64, 30, 4); g.fill();
      g.fillStyle = '#2e4a24';
      for (let k = 0; k < 3; k++) g.fillRect(-36, -19 + k * 8, 46 - k * 12, 4);
      g.fillStyle = '#c84a3a'; g.beginPath(); g.arc(36, -12, 7, 0, 7); g.fill();
      g.fillStyle = '#8a8e94'; g.beginPath(); g.arc(36, 10, 6, 0, 7); g.fill();
      g.fillStyle = '#3a3c42'; g.fillRect(-40, 14, 56, 8);
    }],
    [/ПИВО/, g => {
      g.fillStyle = '#5a2e0e'; rrect(g, -58, -20, 30, 86, 6); g.fill(); g.fillRect(-50, -62, 14, 46);
      g.fillStyle = '#e8c860'; g.fillRect(-58, 10, 30, 26);
      g.fillStyle = '#c8302a'; g.fillRect(-58, 18, 30, 8);
      g.fillStyle = 'rgba(232,170,40,0.95)'; rrect(g, -10, -30, 50, 92, 6); g.fill();
      g.strokeStyle = 'rgba(232,170,40,0.95)'; g.lineWidth = 8; g.beginPath(); g.arc(44, 14, 16, -1.3, 1.3); g.stroke();
      g.fillStyle = '#fbf6e8'; g.beginPath(); g.ellipse(15, -32, 30, 12, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, -16, 6, 66);
    }],
    [/ВЫБОР/, g => {
      g.fillStyle = '#f4f4f0'; g.fillRect(-56, -6, 112, 70);
      g.strokeStyle = '#8a8a8a'; g.lineWidth = 2; g.strokeRect(-56, -6, 112, 70);
      g.fillStyle = '#2a4ab0'; g.fillRect(-56, 18, 112, 12);
      g.fillStyle = '#1a1a1a'; g.fillRect(-26, -8, 52, 5);
      g.save();
      g.rotate(-0.15);
      g.fillStyle = '#ffffff'; g.fillRect(-22, -66, 40, 56);
      g.strokeStyle = '#999999'; g.lineWidth = 2; g.strokeRect(-22, -66, 40, 56);
      g.strokeStyle = '#c81e1e'; g.lineWidth = 5; g.beginPath(); g.moveTo(-12, -40); g.lineTo(-4, -30); g.lineTo(10, -54); g.stroke();
      g.restore();
      g.fillStyle = '#444444'; g.fillRect(30, -70, 3, 52);
      [['#f4f4f0', 0], ['#2a4ab0', 1], ['#c82a2a', 2]].forEach(([c, k]) => { g.fillStyle = c; g.fillRect(33, -70 + k * 9, 28, 9); });
    }],
    [/GSM|СОТОВ/, g => {
      g.fillStyle = '#2c2e32'; rrect(g, -26, -50, 52, 116, 10); g.fill();
      g.fillRect(12, -70, 8, 24);
      g.fillStyle = '#9cc8a0'; rrect(g, -18, -38, 36, 28, 3); g.fill();
      g.fillStyle = '#d8d8d4';
      for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) { rrect(g, -18 + q * 13, 2 + r * 13, 10, 9, 2); g.fill(); }
    }],
    [/ГАЗель/, g => {
      g.fillStyle = '#f2f2f0'; g.beginPath(); g.moveTo(-72, 30); g.lineTo(-72, -8); g.lineTo(-50, -30); g.lineTo(-24, -30); g.lineTo(-24, 30); g.closePath(); g.fill();
      g.fillStyle = '#3a6ec8'; g.fillRect(-26, -46, 98, 76);
      g.fillStyle = '#9ec4e8'; g.beginPath(); g.moveTo(-66, -8); g.lineTo(-50, -24); g.lineTo(-32, -24); g.lineTo(-32, -8); g.closePath(); g.fill();
      g.fillStyle = '#ffffff'; g.font = 'bold 20px Arial'; g.textAlign = 'center'; g.fillText('ГАЗ', 23, -8);
      adWheel(g, -48, 34, 13); adWheel(g, 46, 34, 13);
    }],
    [/ДЖИНС/, g => {
      g.fillStyle = '#2c4e8a'; g.beginPath(); g.moveTo(-40, -60); g.lineTo(40, -60); g.lineTo(46, 64); g.lineTo(12, 64); g.lineTo(0, -12); g.lineTo(-12, 64); g.lineTo(-46, 64); g.closePath(); g.fill();
      g.strokeStyle = '#e8b048'; g.lineWidth = 2; g.setLineDash([4, 3]);
      g.beginPath(); g.moveTo(-40, -46); g.lineTo(40, -46); g.moveTo(0, -46); g.lineTo(0, -14); g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#c8a050'; g.beginPath(); g.arc(0, -53, 4, 0, 7); g.fill();
    }],
    [/ИНТЕРНЕТ/, g => {
      g.fillStyle = '#d8d0bc'; rrect(g, -58, -56, 116, 88, 8); g.fill();
      g.fillStyle = '#1c2c6a'; rrect(g, -46, -46, 92, 64, 6); g.fill();
      g.fillStyle = '#ffffff'; g.font = 'bold 52px Arial'; g.textAlign = 'center'; g.fillText('@', 0, -12);
      g.fillStyle = '#b8b0a0'; g.fillRect(-14, 32, 28, 12); g.fillRect(-36, 44, 72, 10);
    }],
    [/ЗАЙМ/, g => {
      g.strokeStyle = '#a07818'; g.lineWidth = 2;
      for (let k = 0; k < 5; k++) { g.fillStyle = '#e8c048'; g.beginPath(); g.ellipse(26, 50 - k * 12, 30, 9, 0, 0, 7); g.fill(); g.stroke(); }
      g.fillStyle = '#26282c'; rrect(g, -66, -50, 46, 34, 10); g.fill();
      g.fillStyle = '#c8ccd0'; g.fillRect(-22, -38, 58, 10);
      for (let k = 0; k < 4; k++) g.fillRect(-14 + k * 12, -28, 6, 6 + (k % 2) * 4);
      g.fillStyle = '#9a9ea4'; g.beginPath(); g.arc(-43, -33, 6, 0, 7); g.fill();
    }],
    [/3110|«ВОЛГА»/, g => {
      g.fillStyle = '#e8e8ea'; g.beginPath(); g.moveTo(-72, 22); g.lineTo(-70, 2); g.lineTo(-40, -2); g.lineTo(-24, -24); g.lineTo(26, -24); g.lineTo(44, -2); g.lineTo(72, 2); g.lineTo(72, 22); g.closePath(); g.fill();
      g.fillStyle = '#7a9cbc';
      g.beginPath(); g.moveTo(-34, -4); g.lineTo(-21, -20); g.lineTo(0, -20); g.lineTo(0, -4); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(4, -4); g.lineTo(4, -20); g.lineTo(23, -20); g.lineTo(37, -4); g.closePath(); g.fill();
      g.fillStyle = '#9aa0a8'; g.fillRect(-72, 14, 144, 4);
      adWheel(g, -42, 24, 13); adWheel(g, 44, 24, 13);
    }],
    [/ГАЗ/, g => {
      g.fillStyle = '#e8ecf0'; g.beginPath(); g.moveTo(-44, -54); g.lineTo(44, -54); g.lineTo(54, -16); g.lineTo(0, 62); g.lineTo(-54, -16); g.closePath(); g.fill();
      g.fillStyle = '#1c3c8a'; g.beginPath(); g.moveTo(-36, -46); g.lineTo(36, -46); g.lineTo(45, -16); g.lineTo(0, 50); g.lineTo(-45, -16); g.closePath(); g.fill();
      g.fillStyle = '#f2f4f8'; g.beginPath(); g.ellipse(2, -8, 20, 8, -0.08, 0, 7); g.fill();
      g.strokeStyle = '#f2f4f8'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(16, -12); g.lineTo(26, -30); g.lineTo(20, -40); g.moveTo(26, -30); g.lineTo(32, -38); g.moveTo(-10, -2); g.lineTo(-16, 16); g.moveTo(12, -2); g.lineTo(18, 16); g.stroke();
      g.font = 'bold 18px Arial'; g.textAlign = 'center'; g.fillText('ГАЗ', 0, 30);
    }]
  ];

  N.buildAtlas = (city, extra) => {
    const W = 2048;
    const probe = canvas(8, 8).getContext('2d');
    const L = N.atlasLayout(N.atlasItems(city, extra), (t, font) => { probe.font = font; return probe.measureText(t).width; }, W);
    const c = canvas(W, L.H);
    const g = c.getContext('2d');
    g.clearRect(0, 0, W, L.H);
    const line = (t, cx, cy, sx, tr, paint) => {
      g.save();
      g.translate(cx, cy);
      g.scale(sx, 1);
      if (!tr) { g.textAlign = 'center'; paint(t, 0); }
      else {
        const chars = [...t], ws = chars.map(ch => g.measureText(ch).width);
        let x = -(ws.reduce((a, b) => a + b, 0) + tr * (chars.length - 1)) / 2;
        g.textAlign = 'left';
        chars.forEach((ch, i) => { paint(ch, x); x += ws[i] + tr; });
      }
      g.restore();
    };
    const fill = (t, x) => g.fillText(t, x, 0);
    const fitSize = (t, maxW, size, min) => {
      let s = size;
      g.font = ARIAL.replace('{s}', s);
      while (g.measureText(t).width > maxW && s > min) { s--; g.font = ARIAL.replace('{s}', s); }
      return s;
    };
    const plate = cell => {
      const { w, h, text, style } = cell;
      let bg, fg, border = false;
      if (style === 'shop' || style === 'road' || style === 'boat') {
        bg = style === 'road' ? '#e8e4d0' : style === 'boat' ? '#e8e4dc' : ['#8a1a1a', '#1a3a8a', '#1a5a2a', '#e8e4d8', '#2a2a2a'][Math.abs(N.hash2(text.length, text.charCodeAt(0), 3) * 5 | 0) % 5];
        const light = bg === '#e8e4d8' || bg === '#e8e4d0' || bg === '#e8e4dc';
        fg = style === 'road' ? '#c81a1a' : light ? '#1a1a1a' : '#f4f0e0';
        border = true;
      } else if (style === 'board') { bg = '#1a1a1a'; fg = '#f0d040'; }
      else if (style === 'msign') { bg = '#f6f4ec'; fg = '#18181a'; border = true; }
      else { bg = style === 'park' ? '#2a5a2a' : '#1a2a5a'; fg = '#e8d890'; }
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      if (border) { g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); }
      g.font = N.SIGN_STYLE[style].font.replace('{s}', cell.size);
      g.fillStyle = fg;
      line(text, w / 2, h / 2 + 2, cell.sx, 0, fill);
    };
    const poster = cell => {
      const { w, h, text } = cell, brat = /БРАТ/.test(text);
      g.fillStyle = brat ? '#141210' : '#5a6436';
      g.fillRect(0, 0, w, h);
      g.save();
      g.translate(w / 2, h * 0.52);
      if (brat) {
        g.fillStyle = '#b8261e';
        g.beginPath(); g.arc(0, 0, 70, 0, 7); g.fill();
        g.fillStyle = '#0c0a08';
        g.beginPath(); g.ellipse(0, -34, 18, 22, 0, 0, 7); g.fill();
        g.beginPath(); g.moveTo(-38, 70); g.lineTo(-30, -6); g.quadraticCurveTo(0, -18, 30, -6); g.lineTo(38, 70); g.closePath(); g.fill();
        g.fillRect(-58, 8, 80, 8);
      } else {
        g.fillStyle = '#3c4626';
        g.beginPath(); g.moveTo(-60, 20); g.quadraticCurveTo(0, -48, 60, 20); g.closePath(); g.fill();
        g.fillStyle = '#c8302a';
        g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 7 : 16; g.lineTo(Math.cos(a) * rr, -8 + Math.sin(a) * rr); } g.closePath(); g.fill();
        g.fillStyle = '#e8d8a0'; g.fillRect(-60, 20, 120, 6);
      }
      g.restore();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = ARIAL.replace('{s}', brat ? 46 : 58);
      g.fillStyle = brat ? '#e8e2d2' : '#f2e8b0';
      g.fillText(text, w / 2, 40);
      g.font = ARIAL.replace('{s}', 15);
      g.fillStyle = '#e0d8c0';
      g.fillText('В КИНОТЕАТРЕ «РОДИНА»', w / 2, h - 34);
      g.fillText('СЕАНСЫ 18.00 · 20.00 · 22.00', w / 2, h - 14);
      g.strokeStyle = '#e8e2d2';
      g.lineWidth = 6;
      g.strokeRect(3, 3, w - 6, h - 6);
    };
    const billboard = cell => {
      const { w, h, text } = cell;
      const hue = Math.abs(N.hash2(text.length, text.charCodeAt(2), 9) * 360 | 0);
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, `hsl(${hue},70%,45%)`);
      gr.addColorStop(1, `hsl(${(hue + 60) % 360},70%,30%)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.92)';
      rrect(g, 12, 14, 168, h - 28, 14);
      g.fill();
      const art = AD_ART.find(a => a[0].test(text));
      if (art) { g.save(); g.translate(96, h / 2); art[1](g); g.restore(); }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.lineJoin = 'round';
      g.strokeStyle = 'rgba(0,0,0,0.6)';
      g.lineWidth = 5;
      const words = text.split(' — '), head = words[0], tag = words[1];
      const tx = 192 + (w - 204) / 2, tw = w - 216;
      let hs = fitSize(head, tw, 40, 22), lines = [head];
      if (g.measureText(head).width > tw) {
        const sp = [...head].map((ch, i) => (ch === ' ' ? i : -1)).filter(i => i > 0);
        if (sp.length) {
          const m = sp.reduce((a, b) => (Math.abs(b - head.length / 2) < Math.abs(a - head.length / 2) ? b : a));
          lines = [head.slice(0, m), head.slice(m + 1)];
          hs = Math.min(...lines.map(l => fitSize(l, tw, 36, 14)));
        }
      }
      const top = tag ? h * 0.36 : h * 0.5;
      g.font = ARIAL.replace('{s}', hs);
      g.fillStyle = '#ffffff';
      lines.forEach((l, i) => { const y = top + (i - (lines.length - 1) / 2) * hs * 1.1; g.strokeText(l, tx, y); g.fillText(l, tx, y); });
      if (tag) {
        g.font = ARIAL.replace('{s}', fitSize(tag, tw, 28, 12));
        g.fillStyle = '#ffe860';
        g.strokeText(tag, tx, h * 0.76);
        g.fillText(tag, tx, h * 0.76);
      }
      g.lineWidth = 8;
      g.strokeStyle = '#e8e8e8';
      g.strokeRect(0, 0, w, h);
    };
    const draw = cell => {
      const { style, w, h, text } = cell, s = cell.s;
      const cx = w / 2, cy = h / 2;
      if (N.SIGN_STYLE[style] && N.SIGN_STYLE[style].plate) plate(cell);
      else if (style === 'roof' || style === 'roofsmall') {
        g.font = ARIAL.replace('{s}', cell.size);
        g.fillStyle = style === 'roof' ? '#e83a3a' : '#e8e0c8';
        line(text, cx, cy + 3, cell.sx, cell.tr, fill);
      } else if (style === 'neon' || style === 'neonsmall') {
        g.font = SCRIPT.replace('{s}', cell.size);
        g.shadowColor = '#ff40c0';
        g.shadowBlur = 14;
        g.fillStyle = '#ffd0f4';
        line(text, cx, cy + 4, cell.sx, 0, fill);
        g.shadowBlur = 0;
        g.strokeStyle = '#ff40c0';
        g.lineWidth = 2;
        line(text, cx, cy + 4, cell.sx, 0, (t, x) => g.strokeText(t, x, 0));
      } else if (style === 'relief') {
        const k = h / 112, col = s.color || '#efe2b8', edge = shadeCss(col, 0.55);
        g.font = TIMES.replace('{s}', cell.size);
        g.fillStyle = 'rgba(40,30,15,0.9)';
        line(text, cx + 2 * k, cy + 5 * k, cell.sx, cell.tr, fill);
        g.lineWidth = 3 * k;
        g.strokeStyle = edge;
        g.fillStyle = col;
        line(text, cx, cy + 3 * k, cell.sx, cell.tr, (t, x) => { g.strokeText(t, x, 0); g.fillText(t, x, 0); });
      } else if (style === 'paint') {
        const k = h / 112;
        g.font = ARIAL.replace('{s}', cell.size);
        g.lineWidth = 2.5 * k;
        g.strokeStyle = 'rgba(70,50,20,0.55)';
        g.fillStyle = s.color || '#fbf8f0';
        line(text, cx, cy + 3 * k, cell.sx, cell.tr, (t, x) => { g.strokeText(t, x, 0); g.fillText(t, x, 0); });
      } else if (style === 'mname') {
        const k = h / 112, col = s.color || '#efe2b8';
        g.fillStyle = s.bg || '#3a3634';
        g.fillRect(0, 0, w, h);
        g.font = TIMES.replace('{s}', cell.size);
        g.fillStyle = 'rgba(0,0,0,0.45)';
        line(text, cx + 2 * k, cy + 5 * k, cell.sx, cell.tr, fill);
        g.lineWidth = 2.5 * k;
        g.strokeStyle = shadeCss(col, 0.6);
        g.fillStyle = col;
        line(text, cx, cy + 3 * k, cell.sx, cell.tr, (t, x) => { g.strokeText(t, x, 0); g.fillText(t, x, 0); });
      } else if (style === 'mled') {
        g.fillStyle = '#0a0606';
        g.fillRect(0, 0, w, h);
        g.font = 'bold 50px "Courier New", monospace';
        g.shadowColor = '#ff2a10';
        g.shadowBlur = 8;
        g.fillStyle = '#ff4a2a';
        g.fillText(text, cx, cy + 3);
        g.shadowBlur = 0;
      } else if (style === 'metro') {
        g.fillStyle = '#e8e8e8';
        g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill();
        g.fillStyle = '#d81a1a';
        g.font = 'bold 44px Arial';
        g.fillText('М', 32, 34);
      } else if (style === 'billboard') billboard(cell);
      else if (style === 'poster') poster(cell);
      else if (style === 'boxletter') {
        g.fillStyle = '#e8e6e0';
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#2c2e30';
        g.fillRect(6, 6, w - 12, h - 12);
        g.fillStyle = '#ff6a7e';
        g.font = 'bold 58px Arial';
        g.fillText(text, cx, cy + 4);
        g.strokeStyle = '#fff0f2';
        g.lineWidth = 2;
        g.strokeText(text, cx, cy + 4);
      } else if (style === 'gazlogo') {
        const wing = dir => {
          g.save();
          g.translate(cx, cy + 6);
          g.scale(dir, 1);
          g.fillStyle = '#d8dce0';
          g.beginPath(); g.moveTo(40, -34); g.lineTo(236, -26); g.quadraticCurveTo(250, -2, 236, 22); g.lineTo(40, 30); g.closePath(); g.fill();
          g.fillStyle = '#7a8088';
          for (let k = 0; k < 8; k++) g.fillRect(60 + k * 21, -20, 12, 38);
          g.strokeStyle = '#f4f6f8'; g.lineWidth = 3; g.stroke();
          g.restore();
        };
        wing(1); wing(-1);
        g.save();
        g.translate(cx, cy);
        g.fillStyle = '#e8ecf0';
        g.beginPath(); g.moveTo(-58, -64); g.lineTo(58, -64); g.lineTo(70, -20); g.lineTo(0, 74); g.lineTo(-70, -20); g.closePath(); g.fill();
        g.fillStyle = '#1c3c8a';
        g.beginPath(); g.moveTo(-50, -56); g.lineTo(50, -56); g.lineTo(60, -20); g.lineTo(0, 62); g.lineTo(-60, -20); g.closePath(); g.fill();
        g.fillStyle = '#f2f4f8';
        g.beginPath();
        g.ellipse(4, -6, 26, 10, -0.08, 0, 7);
        g.fill();
        g.beginPath(); g.moveTo(24, -12); g.lineTo(34, -34); g.lineTo(42, -32); g.lineTo(32, -8); g.fill();
        g.beginPath(); g.ellipse(40, -36, 9, 5, 0.4, 0, 7); g.fill();
        g.strokeStyle = '#f2f4f8'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(38, -40); g.lineTo(30, -54); g.lineTo(22, -60); g.moveTo(30, -54); g.lineTo(34, -62); g.moveTo(42, -40); g.lineTo(48, -54); g.lineTo(46, -62); g.moveTo(48, -54); g.lineTo(56, -58); g.stroke();
        g.lineWidth = 4;
        g.beginPath(); g.moveTo(-14, 0); g.lineTo(-22, 22); g.moveTo(-6, 2); g.lineTo(-4, 24); g.moveTo(18, 0); g.lineTo(24, 22); g.moveTo(24, -2); g.lineTo(34, 18); g.stroke();
        g.font = 'bold 26px Arial';
        g.fillText('ГАЗ', 0, 40);
        g.restore();
      } else if (style === 'mosaic') {
        const rng = N.rng(text.charCodeAt(0) * 17 + 5);
        const t = 8;
        const sky = yy => { const k = yy / h; return [70 + 150 * k, 110 + 80 * k, 170 - 60 * k]; };
        const fig = text === '2';
        const inFig = (x, y) => {
          const fx = x / w, fy = y / h;
          const head = Math.hypot(fx - 0.5, fy - 0.2) < 0.09;
          const body = fx > 0.34 && fx < 0.66 && fy > 0.28 && fy < 0.66;
          const legs = fy >= 0.66 && fy < 0.96 && (Math.abs(fx - 0.42) < 0.07 || Math.abs(fx - 0.58) < 0.07);
          const arm = fig ? fy > 0.3 && fy < 0.38 && fx > 0.6 && fx < 0.86 : fx > 0.18 && fx < 0.36 && fy > 0.12 && fy < 0.3 + (0.36 - fx) * 0.6;
          return head ? 1 : body || legs || arm ? 2 : 0;
        };
        g.fillStyle = '#b8b2a6';
        g.fillRect(0, 0, w, h);
        const flag = (x, y) => !fig && x / w > 0.06 && x / w < 0.3 && y / h > 0.04 && y / h < 0.16;
        const car = (x, y) => fig && y / h > 0.7 && y / h < 0.9 && x / w > 0.62 && x / w < 0.98;
        for (let y = 0; y < h; y += t) for (let x = 0; x < w; x += t) {
          const k = inFig(x + 4, y + 4);
          let col = sky(y);
          if (flag(x + 4, y + 4)) col = [196, 40, 34];
          else if (car(x + 4, y + 4)) col = [60, 120, 70];
          else if (k === 1) col = [222, 178, 140];
          else if (k === 2) col = fig ? [60, 70, 120] : [90, 90, 150];
          else if (y > h * 0.8) col = [150, 120, 70];
          const v = 0.82 + rng() * 0.3;
          g.fillStyle = `rgb(${col[0] * v | 0},${col[1] * v | 0},${col[2] * v | 0})`;
          g.fillRect(x + 1, y + 1, t - 1, t - 1);
        }
        g.strokeStyle = '#e8e8e4';
        g.lineWidth = 8;
        g.strokeRect(0, 0, w, h);
      } else if (style === 'plate') {
        const cls = cell.cls;
        const bg = cls === 'militia' ? '#1c3c90' : cls === 'army' ? '#141414' : '#f2f2ee', fg = cls === 'civil' ? '#141414' : '#f2f2ee';
        const sp = text.lastIndexOf(' '), main = text.slice(0, sp).replace(/(\d)(?=\D)|(\D)(?=\d)/g, '$1$2 '), reg = text.slice(sp + 1);
        g.fillStyle = bg; g.fillRect(0, 0, 150, 32);
        g.strokeStyle = fg; g.lineWidth = 2; g.strokeRect(1.5, 1.5, 147, 29);
        g.fillStyle = fg; g.fillRect(111, 3, 2, 26);
        g.font = 'bold 21px Arial'; g.fillText(main, 56, 17);
        g.font = 'bold 15px Arial'; g.fillText(reg, 130, 12);
        g.font = 'bold 7px Arial'; g.fillText('RUS', 126, 25);
        if (cls === 'civil') {
          [['#f2f2ee', 0], ['#2a4ab0', 1], ['#c82a2a', 2]].forEach(([col, k]) => { g.fillStyle = col; g.fillRect(138, 21 + k * 2, 7, 2); });
          g.lineWidth = 1; g.strokeRect(137.5, 20.5, 8, 7);
        }
      } else if (style === 'checker') {
        for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 8; xx++) { g.fillStyle = (xx + yy) % 2 ? '#1a1a1a' : '#f0d020'; g.fillRect(xx * 16, yy * 16, 16, 16); }
      } else if (style === 'lettering') {
        g.fillStyle = text === 'СКОРАЯ' ? '#c81e1e' : text === 'ТАКСИ' ? '#1a1a1a' : text === 'ОМОН' ? '#e8e8e8' : '#1a3a8a';
        g.font = 'bold 38px Arial';
        g.fillText(text, 128, 26);
      } else if (style === 'cross') {
        g.fillStyle = '#e8e8e8'; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill();
        g.fillStyle = '#d81a1a'; g.fillRect(24, 8, 16, 48); g.fillRect(8, 24, 48, 16);
      }
    };
    const bleed = r => {
      const { x, y, w, h } = r;
      g.drawImage(c, x, y, 1, h, x - GUT, y, GUT, h);
      g.drawImage(c, x + w - 1, y, 1, h, x + w, y, GUT, h);
      g.drawImage(c, x - GUT, y, w + 2 * GUT, 1, x - GUT, y - GUT, w + 2 * GUT, GUT);
      g.drawImage(c, x - GUT, y + h - 1, w + 2 * GUT, 1, x - GUT, y + h, w + 2 * GUT, GUT);
    };
    for (const cell of L.cells) {
      g.save();
      g.translate(cell.x, cell.y);
      g.beginPath();
      g.rect(0, 0, cell.w, cell.h);
      g.clip();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      draw(cell);
      g.restore();
      bleed(cell);
    }
    return { canvas: c, map: N.atlasMap(L), layout: L };
  };

  N.buildParticles = () => {
    const W = 512;
    const c = canvas(W, W);
    const g = c.getContext('2d');
    const cell = 128;
    const at = (i, fn) => { g.save(); g.translate((i % 4) * cell, Math.floor(i / 4) * cell); fn(); g.restore(); };
    at(0, () => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, cell, cell); });
    at(1, () => { const rng = N.rng(3); for (let k = 0; k < 26; k++) { const x = 64 + (rng() - 0.5) * 60, y = 64 + (rng() - 0.5) * 60, r = 14 + rng() * 22; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, cell, cell); } });
    at(2, () => { const gr = g.createRadialGradient(64, 70, 0, 64, 64, 60); gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(0.25, 'rgba(255,200,60,0.95)'); gr.addColorStop(0.6, 'rgba(230,80,10,0.6)'); gr.addColorStop(1, 'rgba(120,20,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(64, 70, 44, 58, 0, 0, 7); g.fill(); });
    at(3, () => { g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(60, 0, 8, 128); });
    at(4, () => { const rng = N.rng(8); g.fillStyle = 'rgba(150,10,10,0.9)'; for (let k = 0; k < 14; k++) { g.beginPath(); g.arc(64 + (rng() - 0.5) * 70, 64 + (rng() - 0.5) * 70, 4 + rng() * 14, 0, 7); g.fill(); } });
    at(5, () => { g.fillStyle = 'rgba(255,240,180,1)'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const r = k % 2 ? 20 : 62; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.fill(); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, cell, cell); });
    at(6, () => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.7, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, cell, cell); });
    const pool = g.createImageData(cell, cell);
    for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) {
      const t = (cell - y) / cell, edge = 0.12 + t * 0.85;
      const k = (1 - N.smooth(edge * 0.45, edge, Math.abs(x + 0.5 - 64) / 64)) * N.smooth(0, 0.18, t) * Math.pow(1 - t, 1.6);
      const i = (y * cell + x) * 4;
      pool.data[i] = pool.data[i + 1] = pool.data[i + 2] = 255;
      pool.data[i + 3] = Math.round(230 * k);
    }
    g.putImageData(pool, (7 % 4) * cell, Math.floor(7 / 4) * cell);
    at(8, () => { g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 10; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.stroke(); g.lineWidth = 4; g.beginPath(); g.arc(64, 64, 36, 0, 7); g.stroke(); });
    at(9, () => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(64, 64); g.arc(64, 64, 64, -0.5, 0.5); g.fill(); });
    at(10, () => { g.fillStyle = 'rgba(40,30,20,0.85)'; const rng = N.rng(12); for (let k = 0; k < 10; k++) { g.beginPath(); g.ellipse(64 + (rng() - 0.5) * 60, 64 + (rng() - 0.5) * 60, 10 + rng() * 20, 6 + rng() * 10, rng() * 3, 0, 7); g.fill(); } });
    at(11, () => { g.fillStyle = 'rgba(255,255,255,1)'; g.beginPath(); g.arc(64, 64, 10, 0, 7); g.fill(); });
    at(12, () => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.75, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0.9)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    at(13, () => { g.fillStyle = 'rgba(255,255,255,1)'; g.beginPath(); g.moveTo(14, 20); g.lineTo(114, 20); g.lineTo(64, 110); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineWidth = 6; g.stroke(); });
    at(14, () => { const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    at(15, () => { g.fillStyle = 'rgba(255,255,255,1)'; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2, a2 = a + Math.PI / 5; g.lineTo(64 + Math.cos(a) * 56, 64 + Math.sin(a) * 56); g.lineTo(64 + Math.cos(a2) * 22, 64 + Math.sin(a2) * 22); } g.fill(); });
    return c;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
