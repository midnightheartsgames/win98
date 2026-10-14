(function (F) {
  'use strict';

  const C = F.col;
  const MAT = F.MAT;
  const LM = F.Models.LM;
  const TAU = Math.PI * 2;
  const S = 2048, PAD = 4;

  const REGIONS = [
    ['bh_front', 512, 960], ['dom_tower', 192, 768], ['schwab', 256, 672], ['peter_tower', 192, 672], ['peter_front', 512, 560],
    ['trav', 64, 512], ['tv_panel', 128, 512], ['dom_gable', 256, 272], ['academy', 128, 256], ['dz_siding', 128, 256],
    ['dz_lattice', 128, 256], ['nativity', 128, 256], ['opera', 128, 256], ['dom_aisle', 128, 246], ['bh_side', 128, 224],
    ['fm_base', 256, 208], ['latvija', 128, 208], ['air_facade', 128, 192], ['station', 128, 192], ['mk_end', 512, 352], ['mk_wing', 128, 80], ['mk_names', 512, 160],
    ['castle', 128, 128], ['turtle', 128, 128], ['brick', 128, 128], ['copper', 128, 128], ['granite', 128, 128], ['clock', 128, 128],
    ['laima', 128, 128], ['stone', 128, 128], ['tiles', 128, 128], ['seam', 128, 128], ['air_glass', 128, 128], ['clere', 128, 120],
    ['dz_gable', 256, 96], ['air_sign', 1024, 96], ['fm_text', 512, 64], ['flags', 192, 64], ['dz_ped', 256, 48], ['majori', 256, 48], ['gold', 32, 32], ['white', 16, 16],
    ['ltv_tower', 256, 256], ['ltv_band', 256, 64], ['ltv_sign', 256, 128], ['ltv_text', 512, 64], ['tv_text', 512, 64], ['lucav_plq', 96, 128],
    ['bisu_wall', 256, 128], ['bisu_ped', 256, 48], ['piens_wall', 256, 128], ['piens_sign', 384, 64], ['tram_side', 512, 64], ['tram_front', 64, 64]
  ];

  const A = (() => {
    const out = {};
    const list = REGIONS.slice().sort((a, b) => b[2] - a[2]);
    let x = 0, y = 0, row = 0;
    for (const [name, w, h] of list) {
      if (x + w > S) { x = 0; y += row + PAD; row = 0; }
      out[name] = [x, y, w, h];
      x += w + PAD;
      row = Math.max(row, h);
    }
    if (y + row > S) throw new Error('landmark atlas overflow');
    return out;
  })();

  function uvAt(name, u, v) {
    const r = A[name];
    return [(r[0] + 0.5 + (r[2] - 1) * u) / S, (r[1] + 0.5 + (r[3] - 1) * v) / S];
  }

  function uvRect(name, u0, v0, u1, v1) {
    const a = uvAt(name, u0, v1), b = uvAt(name, u1, v1), c = uvAt(name, u1, v0), d = uvAt(name, u0, v0);
    return [a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]];
  }

  const WHITE = uvAt('white', 0.5, 0.5);
  const GLASS = uvAt('air_glass', 0.3, 0.4);
  const WIN = a => C('#ffffff', a);

  const BH = [[0, 16, 0, 14], [1.5, 14.5, 14, 18], [3, 13, 18, 22], [4.5, 11.5, 22, 25.5], [6, 10, 25.5, 28], [7.25, 8.75, 28, 30]];
  const SW = [[0, 16], [1.2, 16.4], [1.3, 19], [2.4, 19.3], [2.5, 22.3], [3.4, 22.6], [3.5, 24.8], [5, 26], [6.5, 24.8], [6.6, 22.6], [7.5, 22.3], [7.6, 19.3], [8.7, 19], [8.8, 16.4], [10, 16]];
  const PG = [[0, 24], [0.3, 25.2], [1.6, 25.6], [2.2, 27], [5, 27.6], [5.6, 29], [8.6, 29.6], [11, 33]];

  function bricks(x, w, h, col, ppm, seed) {
    x.fillStyle = col; x.fillRect(0, 0, w, h);
    const ch = Math.max(3, Math.round(ppm * 0.16)), bw = Math.round(ch * 2.6);
    for (let r = 0, y = 0; y < h; r++, y += ch) {
      for (let k = 0, bx = (r % 2) * bw / 2 - bw; bx < w; k++, bx += bw) {
        const v = F.hash2(k, r, seed);
        x.fillStyle = v < 0.5 ? `rgba(0,0,0,${((0.5 - v) * 0.2).toFixed(3)})` : `rgba(255,238,222,${((v - 0.5) * 0.16).toFixed(3)})`;
        x.fillRect(bx, y, bw - 1, ch - 1);
        x.fillStyle = 'rgba(60,40,30,0.16)'; x.fillRect(bx + bw - 1, y, 1, ch);
      }
      x.fillStyle = 'rgba(225,215,200,0.2)'; x.fillRect(0, y + ch - 1, w, 1);
    }
  }

  function grime(x, w, h, amt, seed, drip) {
    const img = x.getImageData(0, 0, w, h), d = img.data;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const n = (F.noise2(i / 24, j / 24, seed) - 0.5) * amt + (F.noise2(i / 2.5, j / 30, seed + 7) - 0.5) * drip;
        const k = (j * w + i) * 4;
        d[k] += n; d[k + 1] += n; d[k + 2] += n;
      }
    }
    x.putImageData(img, 0, 0);
  }

  function siding(x, w, h, P) {
    x.fillStyle = '#f5f4ef'; x.fillRect(0, 0, w, h);
    const bd = Math.max(4, P * 0.2);
    for (let y = 0; y < h; y += bd) {
      x.fillStyle = 'rgba(0,0,0,0.13)'; x.fillRect(0, Math.round(y + bd - 2), w, 2);
      x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(0, Math.round(y), w, 1);
    }
  }

  function glassStyle(x, x0, y0, w, h) {
    const g = x.createLinearGradient(x0, y0, x0 + w * 0.6, y0 + h);
    g.addColorStop(0, '#6d8296'); g.addColorStop(0.45, '#34424f'); g.addColorStop(1, '#1b232c');
    x.fillStyle = g;
  }

  function pane(x, x0, y0, w, h, frame, fw, cols, rows) {
    if (frame) { x.fillStyle = frame; x.fillRect(x0 - fw, y0 - fw, w + fw * 2, h + fw * 2); }
    glassStyle(x, x0, y0, w, h); x.fillRect(x0, y0, w, h);
    x.fillStyle = frame || '#e8e4dc';
    for (let i = 1; i < cols; i++) x.fillRect(x0 + w * i / cols - 1, y0, 2, h);
    for (let j = 1; j < rows; j++) x.fillRect(x0, y0 + h * j / rows - 1, w, 2);
    return [x0, y0, w, h];
  }

  function lancet(x, cx, y0, y1, w, frame, trac) {
    const r = w / 2, fw = Math.max(2, w * 0.14), top = y0 + w * 0.85;
    const path = p => {
      x.beginPath(); x.moveTo(cx - r - p, y1 + p); x.lineTo(cx - r - p, top);
      x.quadraticCurveTo(cx - r - p, y0 - p * 1.5, cx, y0 - p * 2); x.quadraticCurveTo(cx + r + p, y0 - p * 1.5, cx + r + p, top);
      x.lineTo(cx + r + p, y1 + p); x.closePath();
    };
    if (frame) { path(fw); x.fillStyle = frame; x.fill(); }
    path(0); glassStyle(x, cx - r, y0, w, y1 - y0); x.fill();
    if (trac) {
      x.fillStyle = trac;
      x.fillRect(cx - 1, top - w * 0.2, 2, y1 - top + w * 0.2);
      for (let k = 1; k < 4; k++) x.fillRect(cx - r, top + (y1 - top) * k / 4, w, 2);
    }
    return [cx - r, y0, w, y1 - y0];
  }

  function arch(x, cx, y0, y1, w, frame) {
    const r = w / 2, fw = Math.max(2, w * 0.12);
    const path = p => { x.beginPath(); x.moveTo(cx - r - p, y1 + p); x.lineTo(cx - r - p, y0 + r); x.arc(cx, y0 + r, r + p, Math.PI, 0); x.lineTo(cx + r + p, y1 + p); x.closePath(); };
    if (frame) { path(fw); x.fillStyle = frame; x.fill(); }
    path(0); glassStyle(x, cx - r, y0, w, y1 - y0); x.fill();
    return [cx - r, y0, w, y1 - y0];
  }

  function oculus(x, cx, cy, r, frame) {
    x.fillStyle = frame; x.beginPath(); x.arc(cx, cy, r * 1.3, 0, TAU); x.fill();
    glassStyle(x, cx - r, cy - r, r * 2, r * 2); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
    return [cx - r * 0.7, cy - r * 0.7, r * 1.4, r * 1.4];
  }

  function figure(x, cx, y0, y1, col) {
    const h = y1 - y0, w = h * 0.28;
    x.fillStyle = col;
    x.beginPath(); x.moveTo(cx - w * 0.5, y1); x.lineTo(cx - w * 0.36, y0 + h * 0.3); x.lineTo(cx - w * 0.5, y0 + h * 0.2); x.lineTo(cx - w * 0.26, y0 + h * 0.15);
    x.lineTo(cx + w * 0.26, y0 + h * 0.15); x.lineTo(cx + w * 0.5, y0 + h * 0.2); x.lineTo(cx + w * 0.36, y0 + h * 0.3); x.lineTo(cx + w * 0.5, y1); x.closePath(); x.fill();
    x.beginPath(); x.arc(cx, y0 + h * 0.08, w * 0.2, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.16)'; x.fillRect(cx - w * 0.3, y0 + h * 0.2, w * 0.16, h * 0.62);
  }

  function text(x, s, cx, cy, size, col, font, maxW) {
    x.font = 'bold ' + Math.round(size) + 'px ' + font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col;
    x.fillText(s, cx, cy, maxW);
  }

  function outline(x, pts, X, Y) {
    x.beginPath();
    pts.forEach((p, i) => (i ? x.lineTo(X(p[0]), Y(p[1])) : x.moveTo(X(p[0]), Y(p[1]))));
    x.stroke();
  }

  function weather(x, w, h, n, seed) {
    for (let i = 0; i < n; i++) {
      x.fillStyle = `rgba(238,224,208,${(0.1 + 0.22 * F.hash2(i, 5, seed)).toFixed(3)})`;
      x.fillRect(F.hash2(i, 1, seed) * w, F.hash2(i, 2, seed) * h, 6 + F.hash2(i, 3, seed) * 30, 4 + F.hash2(i, 4, seed) * 14);
    }
  }

  const PAINT = {
    white(x, w, h) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); },
    gold(x, w, h) {
      const g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#fff0a8'); g.addColorStop(0.5, '#e0a82e'); g.addColorStop(1, '#8a5a12');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    },
    brick(x, w, h) { bricks(x, w, h, '#e4dcd4', 32, 101); },
    stone(x, w, h) {
      x.fillStyle = '#e8e4dc'; x.fillRect(0, 0, w, h); grime(x, w, h, 18, 7, 3);
      x.fillStyle = 'rgba(0,0,0,0.07)';
      for (let y = 0; y < h; y += 32) { x.fillRect(0, y, w, 1); for (let k = (y / 32) % 2 ? 0 : 32; k < w; k += 64) x.fillRect(k, y, 1, 32); }
    },
    copper(x, w, h) {
      x.fillStyle = '#dbe6e0'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        x.fillStyle = `rgba(${F.hash2(i, 1, 3) < 0.5 ? '30,50,40' : '255,255,255'},${(0.05 + 0.12 * F.hash2(i, 2, 3)).toFixed(3)})`;
        x.fillRect(F.hash2(i, 3, 3) * w, F.hash2(i, 4, 3) * h * 0.5, 1 + F.hash2(i, 5, 3) * 3, h * (0.3 + 0.7 * F.hash2(i, 6, 3)));
      }
      for (let i = 0; i < w; i += 16) { x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(i, 0, 1, h); x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillRect(i + 1, 0, 1, h); }
      grime(x, w, h, 16, 5, 6);
    },
    granite(x, w, h) {
      x.fillStyle = '#b07464'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) {
        const v = F.hash2(i, 1, 9);
        x.fillStyle = v < 0.45 ? 'rgba(40,22,18,0.4)' : v < 0.8 ? 'rgba(230,200,190,0.35)' : 'rgba(120,60,50,0.5)';
        x.fillRect(F.hash2(i, 2, 9) * w, F.hash2(i, 3, 9) * h, v > 0.9 ? 2 : 1, v > 0.95 ? 2 : 1);
      }
      x.fillStyle = 'rgba(0,0,0,0.14)'; x.fillRect(0, h - 2, w, 2); x.fillRect(w - 2, 0, 2, h);
    },
    tiles(x, w, h) {
      x.fillStyle = '#e8e0d8'; x.fillRect(0, 0, w, h);
      for (let r = 0, y = 0; y < h; r++, y += 12) {
        for (let k = (r % 2) * 8, i = 0; k < w; k += 16, i++) {
          const v = F.hash2(i, r, 61);
          x.fillStyle = `rgba(${v < 0.5 ? '0,0,0' : '255,245,235'},${(Math.abs(v - 0.5) * 0.2).toFixed(3)})`;
          x.fillRect(k, y, 15, 11);
          x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(k + 15, y, 1, 11);
        }
        x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, y + 10, w, 2);
      }
      grime(x, w, h, 14, 63, 6);
    },
    seam(x, w, h) {
      x.fillStyle = '#e4e7e8'; x.fillRect(0, 0, w, h); grime(x, w, h, 16, 65, 10);
      for (let k = 0; k < w; k += 16) { x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(k, 0, 1, h); x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(k + 1, 0, 1, h); }
    },
    clock(x, w) {
      const c = w / 2, r = w / 2 - 2;
      x.clearRect(0, 0, w, w);
      x.fillStyle = '#e2b640'; x.beginPath(); x.arc(c, c, r, 0, TAU); x.fill();
      x.fillStyle = '#1d2c3a'; x.beginPath(); x.arc(c, c, r * 0.86, 0, TAU); x.fill();
      x.fillStyle = '#f0c850';
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.save(); x.translate(c + Math.sin(a) * r * 0.7, c - Math.cos(a) * r * 0.7); x.rotate(a); x.fillRect(-2, -6, 4, 12); x.restore(); }
      x.lineCap = 'round'; x.strokeStyle = '#f0c850';
      x.lineWidth = 6; x.beginPath(); x.moveTo(c, c); x.lineTo(c + r * 0.34, c - r * 0.3); x.stroke();
      x.lineWidth = 4; x.beginPath(); x.moveTo(c, c); x.lineTo(c - r * 0.1, c - r * 0.62); x.stroke();
      x.beginPath(); x.arc(c, c, 5, 0, TAU); x.fill();
    },
    laima(x, w, h) {
      x.fillStyle = '#e6e1d4'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#b01e2e'; x.fillRect(0, 0, w, 24); text(x, 'LAIMA', w / 2, 13, 18, '#ffffff', 'Arial');
      x.fillStyle = '#1a1a1a'; x.beginPath(); x.arc(w / 2, 74, 44, 0, TAU); x.fill();
      x.fillStyle = '#f7f3e8'; x.beginPath(); x.arc(w / 2, 74, 39, 0, TAU); x.fill();
      x.fillStyle = '#1a1a1a';
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.fillRect(w / 2 + Math.sin(a) * 33 - 2, 74 - Math.cos(a) * 33 - 2, 4, 4); }
      x.strokeStyle = '#1a1a1a'; x.lineCap = 'round'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(w / 2, 74); x.lineTo(w / 2, 48); x.moveTo(w / 2, 74); x.lineTo(w / 2 + 20, 82); x.stroke();
    },
    turtle(x, w, h) {
      x.fillStyle = '#5e4020'; x.fillRect(0, 0, w, h);
      const n = 5;
      for (let j = -1; j <= n; j++) {
        for (let i = -1; i <= n; i++) {
          const cx = (i + (j % 2 ? 0.5 : 0)) * w / n, cy = j * h / n, r = w / n * 0.56;
          const g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 1, cx, cy, r);
          g.addColorStop(0, '#e2b77a'); g.addColorStop(0.55, '#9a6c36'); g.addColorStop(1, '#4a3016');
          x.fillStyle = g; x.beginPath();
          for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92); }
          x.closePath(); x.fill();
        }
      }
      grime(x, w, h, 16, 97, 4);
    },
    bh_front(x, w, h) {
      const P = w / 16, X = m => m * P, Y = m => h - m * P, g = [];
      const white = '#efe9dc', blue = '#1f3f8e', gold = '#e8b840';
      bricks(x, w, h, '#b4432e', P, 21);
      x.fillStyle = '#cfc6b6'; x.fillRect(0, Y(0.9), w, X(0.9));
      x.fillStyle = white; x.fillRect(0, Y(4.95), w, X(0.4)); x.fillRect(0, Y(14.1), w, X(0.5));
      for (const cx of [1.9, 4.4, 11.6, 14.1]) g.push(arch(x, X(cx), Y(3.9), Y(1.3), X(1.3), white));
      x.fillStyle = white; x.fillRect(X(6.3), Y(4.7), X(3.4), X(4.7));
      x.fillStyle = '#d8d0c0'; for (const s of [6.5, 9.1]) x.fillRect(X(s), Y(4.3), X(0.4), X(3.4));
      x.fillStyle = '#35261a'; x.beginPath(); x.moveTo(X(7.1), Y(0.9)); x.lineTo(X(7.1), Y(2.9)); x.arc(X(8), Y(2.9), X(0.9), Math.PI, 0); x.lineTo(X(8.9), Y(0.9)); x.fill();
      x.fillStyle = '#5a3c26'; x.fillRect(X(7.97), Y(3.5), 2, X(2.6));
      x.fillStyle = gold; x.beginPath(); x.arc(X(8), Y(4.35), X(0.22), 0, TAU); x.fill();
      for (const cx of [1.6, 4.8, 8, 11.2, 14.4]) g.push(lancet(x, X(cx), Y(13.3), Y(5.6), X(1.9), white, white));
      for (const cx of [3.2, 6.4, 9.6, 12.8]) {
        x.fillStyle = white; x.fillRect(X(cx - 0.55), Y(9.3), X(1.1), X(0.5)); x.fillRect(X(cx - 0.3), Y(8.8), X(0.6), X(0.5));
        x.beginPath(); x.moveTo(X(cx - 0.6), Y(12.5)); x.lineTo(X(cx), Y(13.2)); x.lineTo(X(cx + 0.6), Y(12.5)); x.fill();
        figure(x, X(cx), Y(12.2), Y(9.3), '#4a524c');
      }
      for (const [a, c, y0, y1] of BH.slice(1)) {
        x.fillStyle = white;
        x.fillRect(X(a), Y(y1), X(0.3), X(y1 - y0)); x.fillRect(X(c - 0.3), Y(y1), X(0.3), X(y1 - y0));
        x.fillRect(X(a), Y(y1), X(c - a), X(0.25));
      }
      for (const cx of [2.3, 4.2, 6.1, 8, 9.9, 11.8, 13.7]) g.push(lancet(x, X(cx), Y(17.5), Y(14.9), X(0.95), white, null));
      for (const cx of [5.2, 8, 10.8]) g.push(lancet(x, X(cx), Y(21), Y(18.6), X(1.0), white, null));
      x.fillStyle = blue; x.fillRect(X(3.3), Y(22.0), X(9.4), X(0.7));
      text(x, 'ANNO 1334', X(5.4), Y(21.65), P * 0.42, gold, 'Georgia');
      text(x, 'ANNO 1999', X(10.6), Y(21.65), P * 0.42, gold, 'Georgia');
      const cx = X(8), cy = Y(23.85), r = X(1.5);
      x.fillStyle = gold; x.beginPath(); x.arc(cx, cy, r + X(0.18), 0, TAU); x.fill();
      x.fillStyle = blue; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
      x.strokeStyle = gold; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, r * 0.62, 0, TAU); x.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.fillStyle = gold; x.beginPath(); x.arc(cx + Math.sin(a) * r * 0.8, cy - Math.cos(a) * r * 0.8, X(0.1), 0, TAU); x.fill(); }
      x.beginPath(); x.arc(cx, cy, X(0.25), 0, TAU); x.fill();
      x.lineWidth = 4; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + r * 0.55, cy - r * 0.35); x.moveTo(cx, cy); x.lineTo(cx - r * 0.2, cy - r * 0.75); x.stroke();
      x.fillStyle = white;
      for (const s of [-1, 1]) {
        x.beginPath(); x.moveTo(cx + s * X(2.1), Y(22.6)); x.quadraticCurveTo(cx + s * X(3.2), Y(23.8), cx + s * X(2.2), Y(25.2));
        x.lineTo(cx + s * X(1.9), Y(25.2)); x.quadraticCurveTo(cx + s * X(2.8), Y(23.8), cx + s * X(1.8), Y(22.6)); x.fill();
      }
      g.push(oculus(x, X(8), Y(26.9), X(0.42), white));
      grime(x, w, h, 14, 23, 10);
      return g;
    },
    schwab(x, w, h) {
      const P = w / 10, X = m => m * P, Y = m => h - m * P, g = [];
      const white = '#efe8da';
      bricks(x, w, h, '#b64c36', P, 23);
      x.fillStyle = '#d4cbbb'; x.fillRect(0, Y(0.8), w, X(0.8));
      x.fillStyle = white;
      for (const yy of [4.3, 7.6, 10.9, 14.2]) x.fillRect(0, Y(yy + 0.3), w, X(0.3));
      x.fillRect(0, Y(16.3), w, X(0.4));
      for (let fl = 0; fl < 4; fl++) for (const cx of [1.9, 5, 8.1]) g.push(pane(x, X(cx - 0.6), Y(4.95 + fl * 3.3 + 2), X(1.2), X(1.9), white, 3, 2, 3));
      x.fillStyle = '#3a2618'; x.fillRect(X(4.2), Y(3.1), X(1.6), X(2.3));
      x.fillStyle = white; x.fillRect(X(4.0), Y(3.4), X(2.0), X(0.3));
      for (const cx of [1.9, 8.1]) g.push(arch(x, X(cx), Y(3.7), Y(1.2), X(1.4), white));
      for (const cx of [3.3, 6.7]) g.push(pane(x, X(cx - 0.45), Y(19.1), X(0.9), X(1.6), white, 3, 2, 2));
      g.push(arch(x, X(5), Y(22.2), Y(20.2), X(1.1), white));
      g.push(oculus(x, X(5), Y(24.1), X(0.36), white));
      x.strokeStyle = white; x.lineWidth = X(0.35); x.lineJoin = 'round';
      outline(x, SW, X, Y);
      x.fillStyle = white;
      for (const [s, y] of [[1.3, 19], [2.5, 22.3], [3.5, 24.8], [8.7, 19], [7.5, 22.3], [6.5, 24.8]]) { x.beginPath(); x.arc(X(s), Y(y), X(0.35), 0, TAU); x.fill(); }
      grime(x, w, h, 12, 29, 8);
      return g;
    },
    bh_side(x, w, h) {
      const P = w / 4, X = m => m * P, Y = m => h - m * P, g = [];
      bricks(x, w, h, '#b04530', P, 25);
      for (const y0 of [0.9, 4.4]) g.push(pane(x, X(1.3), Y(y0 + 2.1), X(1.4), X(2.1), '#ece5d6', 3, 2, 3));
      x.fillStyle = '#ece5d6'; x.fillRect(0, Y(3.6), w, X(0.18));
      grime(x, w, h, 12, 31, 8);
      return g;
    },
    dom_tower(x, w, h) {
      const P = w / 12, X = m => m * P, Y = m => h - m * P, g = [];
      bricks(x, w, h, '#a0503a', P, 35);
      x.fillStyle = 'rgba(0,0,0,0.16)'; x.fillRect(0, 0, X(0.7), h); x.fillRect(w - X(0.7), 0, X(0.7), h);
      x.fillStyle = 'rgba(255,240,225,0.1)'; x.fillRect(X(0.7), 0, X(0.25), h);
      g.push(arch(x, X(6), Y(9), Y(0.4), X(3.4), '#d7c3a8'));
      for (const cx of [3.6, 8.4]) g.push(lancet(x, X(cx), Y(29), Y(19), X(1.7), '#c9a488', '#b89a80'));
      for (const cx of [3, 6, 9]) {
        const q = arch(x, X(cx), Y(41), Y(34.5), X(1.5), '#c9a488');
        x.fillStyle = 'rgba(12,10,8,0.6)'; x.fillRect(q[0], q[1] + q[2] / 2, q[2], q[3] - q[2] / 2);
      }
      x.fillStyle = '#d8c4aa'; for (const yy of [16.5, 32, 42.6]) x.fillRect(0, Y(yy), w, X(0.35));
      grime(x, w, h, 14, 37, 10);
      return g;
    },
    clere(x, w, h) {
      const P = w / 6, X = m => m * P, Y = m => h - m * P;
      bricks(x, w, h, '#9c4c37', P, 45);
      x.fillStyle = 'rgba(0,0,0,0.14)'; x.fillRect(0, 0, X(0.5), h); x.fillRect(w - X(0.5), 0, X(0.5), h);
      const g = [lancet(x, X(3), Y(5.0), Y(0.9), X(1.8), '#c49a7e', '#a8866c')];
      grime(x, w, h, 12, 47, 8);
      return g;
    },
    dom_aisle(x, w, h) {
      const P = w / 6, X = m => m * P, Y = m => h - m * P;
      bricks(x, w, h, '#9a4b36', P, 33);
      x.fillStyle = 'rgba(0,0,0,0.15)'; x.fillRect(0, 0, X(0.45), h); x.fillRect(w - X(0.45), 0, X(0.45), h);
      x.fillStyle = '#cdbba4'; x.fillRect(0, Y(1.2), w, X(0.25));
      const g = [lancet(x, X(3), Y(10.2), Y(2.2), X(2.3), '#c49a7e', '#a8866c')];
      grime(x, w, h, 12, 49, 9);
      return g;
    },
    dom_gable(x, w, h) {
      const P = w / 16, X = m => m * P, Y = m => h - m * P;
      bricks(x, w, h, '#9e4d37', P, 37);
      const niche = (cx, y0, top, bw) => {
        x.fillStyle = '#eadfce'; x.beginPath(); x.moveTo(X(cx - bw / 2), Y(y0)); x.lineTo(X(cx - bw / 2), Y(top - bw * 0.7));
        x.quadraticCurveTo(X(cx - bw / 2), Y(top), X(cx), Y(top + 0.3)); x.quadraticCurveTo(X(cx + bw / 2), Y(top), X(cx + bw / 2), Y(top - bw * 0.7));
        x.lineTo(X(cx + bw / 2), Y(y0)); x.fill();
        x.fillStyle = 'rgba(80,60,40,0.2)'; x.fillRect(X(cx - bw / 2), Y(top - bw * 0.7), X(0.12), X(top - bw * 0.7 - y0));
      };
      for (let k = 0; k < 7; k++) {
        if (k === 3) continue;
        const st = Math.min(k, 6 - k);
        niche((k + 0.5) * 16 / 7, 0.8, Math.min(2 * st + 2, 7) * 17 / 7 - 1.2, 1.25);
      }
      niche(8, 0.8, 6.2, 1.25); niche(8, 12, 15.6, 1.0);
      const g = [oculus(x, X(8), Y(9.3), X(1.3), '#eadfce')];
      x.strokeStyle = '#eadfce'; x.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; x.beginPath(); x.moveTo(X(8), Y(9.3)); x.lineTo(X(8) + Math.cos(a) * X(1.3), Y(9.3) + Math.sin(a) * X(1.3)); x.stroke(); }
      grime(x, w, h, 12, 39, 8);
      return g;
    },
    peter_front(x, w, h) {
      const P = w / 33, X = m => m * P, Y = m => h - m * P, g = [];
      const stoneC = '#ddd4c2', stoneD = '#bfb4a0';
      bricks(x, w, h, '#b77a64', P, 41);
      weather(x, w, h, 90, 7);
      x.fillStyle = stoneC; x.fillRect(0, Y(1), w, X(1)); x.fillRect(0, Y(10.4), w, X(0.4)); x.fillRect(0, Y(24), w, X(0.7));
      for (const s of [0, 10.6, 21.8, 32.4]) x.fillRect(X(s), Y(24), X(0.6), X(23));
      for (const [cx, pw, ph] of [[16.5, 5, 9.2], [5.5, 4, 7.8], [27.5, 4, 7.8]]) {
        x.fillStyle = stoneC; x.fillRect(X(cx - pw / 2), Y(ph), X(pw), X(ph));
        x.fillStyle = stoneD; for (const s of [-1, 1]) x.fillRect(X(cx + s * pw * 0.38 - 0.25), Y(ph * 0.86), X(0.5), X(ph * 0.86));
        x.fillStyle = '#2e241e'; x.beginPath(); x.moveTo(X(cx - pw * 0.24), Y(0)); x.lineTo(X(cx - pw * 0.24), Y(ph * 0.5));
        x.arc(X(cx), Y(ph * 0.5), X(pw * 0.24), Math.PI, 0); x.lineTo(X(cx + pw * 0.24), Y(0)); x.fill();
        x.fillStyle = stoneC; x.beginPath(); x.moveTo(X(cx - pw / 2 - 0.3), Y(ph)); x.lineTo(X(cx), Y(ph + 1.6)); x.lineTo(X(cx + pw / 2 + 0.3), Y(ph)); x.fill();
        x.fillStyle = '#b77a64'; x.beginPath(); x.moveTo(X(cx - 0.9), Y(ph)); x.lineTo(X(cx), Y(ph + 1.0)); x.lineTo(X(cx + 0.9), Y(ph)); x.fill();
        figure(x, X(cx), Y(ph + 2.3), Y(ph + 0.2), '#cfc6b4');
      }
      for (const cx of [5.5, 27.5]) g.push(arch(x, X(cx), Y(20.5), Y(12.2), X(2.6), stoneC));
      g.push(arch(x, X(16.5), Y(20.5), Y(12), X(2.4), stoneC));
      for (const cx of [5.5, 27.5]) g.push(oculus(x, X(cx), Y(26.4), X(0.6), stoneC));
      x.strokeStyle = stoneC; x.lineWidth = X(0.45); x.lineJoin = 'round';
      outline(x, PG, X, Y); outline(x, PG.map(p => [33 - p[0], p[1]]), X, Y);
      grime(x, w, h, 12, 43, 10);
      return g;
    },
    peter_tower(x, w, h) {
      const P = w / 11, X = m => m * P, Y = m => h - m * P, g = [];
      bricks(x, w, h, '#b47762', P, 47);
      weather(x, w, h, 50, 8);
      x.fillStyle = '#d8cfbd'; x.fillRect(0, 0, X(0.55), h); x.fillRect(w - X(0.55), 0, X(0.55), h);
      for (const [y0, y1] of [[2, 7], [12, 17], [22, 27.5]]) for (const cx of [3.4, 7.6]) g.push(arch(x, X(cx), Y(y1), Y(y0), X(1.8), '#d8cfbd'));
      x.fillStyle = '#d8cfbd'; for (const yy of [9.5, 19.5, 30]) x.fillRect(0, Y(yy), w, X(0.45));
      x.fillRect(0, Y(38.5), w, X(0.9));
      g.push(oculus(x, X(5.5), Y(33.6), X(0.9), '#d8cfbd'));
      grime(x, w, h, 12, 53, 10);
      return g;
    },
    tv_panel(x, w, h) {
      const Y = m => (176 - m) / 129 * h, g = [];
      x.fillStyle = '#7a2e30'; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(0,0,0,0.22)'; for (let yy = 0; yy < h; yy += 6) x.fillRect(0, yy, w, 1);
      x.fillStyle = 'rgba(255,190,190,0.07)'; for (let k = 0; k < w; k += 16) x.fillRect(k, 0, 2, h);
      grime(x, w, h, 18, 51, 6);
      const band = (y0, y1) => {
        const a = Y(y1), b = Y(y0);
        glassStyle(x, 6, a, w - 12, b - a); x.fillRect(6, a, w - 12, b - a);
        x.fillStyle = '#c9c4bc'; for (let k = 6; k < w - 6; k += 9) x.fillRect(k, a, 2, b - a);
        g.push([6, a, w - 12, b - a]);
      };
      band(74, 78); band(80.5, 86);
      return g;
    },
    trav(x, w, h) {
      x.fillStyle = '#ede4d0'; x.fillRect(0, 0, w, h);
      for (let yy = 0; yy < h; yy += 2) { x.fillStyle = `rgba(150,128,96,${(0.04 + 0.1 * F.noise2(0, yy / 9, 13)).toFixed(3)})`; x.fillRect(0, yy, w, 1); }
      x.fillStyle = 'rgba(90,80,60,0.18)'; for (let yy = 26; yy < h; yy += 27) x.fillRect(0, yy, w, 1);
      x.fillStyle = '#4a463e'; x.fillRect(Math.round(w * 0.42), 0, Math.round(w * 0.16), h);
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(Math.round(w * 0.42), 0, 2, h);
    },
    fm_base(x, w, h) {
      const P = w / 8.4, X = m => m * P, Y = m => h - m * P;
      x.fillStyle = '#e8dfcb'; x.fillRect(0, 0, w, h); grime(x, w, h, 12, 17, 0);
      x.fillStyle = 'rgba(0,0,0,0.08)'; for (let yy = X(1.1); yy < h; yy += X(1.1)) x.fillRect(0, yy, w, 1);
      x.fillStyle = '#d6ccb6'; x.fillRect(X(0.9), Y(5.9), X(6.6), X(4.6));
      x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(X(0.9), Y(5.9), X(6.6), X(0.12)); x.fillRect(X(0.9), Y(5.9), X(0.12), X(4.6));
      for (let k = 0; k < 7; k++) figure(x, X(1.5 + k * 0.9), Y(5.3), Y(1.6), k % 2 ? 'rgba(166,152,128,0.95)' : 'rgba(150,138,118,0.95)');
    },
    fm_text(x, w, h) {
      x.fillStyle = '#e8dfcb'; x.fillRect(0, 0, w, h);
      text(x, 'TĒVZEMEI UN BRĪVĪBAI', w / 2, h / 2 + 2, 34, '#5a4a30', 'Georgia', w - 24);
    },
    academy(x, w, h) {
      const P = w / 4, X = m => m * P, Y = m => h - m * P, g = [];
      x.fillStyle = '#e4d8ba'; x.fillRect(0, 0, w, h); grime(x, w, h, 12, 83, 5);
      x.fillStyle = '#efe6cf'; x.fillRect(0, 0, X(0.45), h); x.fillRect(w - X(0.45), 0, X(0.45), h);
      for (const y0 of [0.8, 4.8]) {
        g.push(pane(x, X(1.2), Y(y0 + 2.4), X(1.6), X(2.4), '#f2ead6', 3, 2, 3));
        x.fillStyle = '#cdbf9c'; x.fillRect(X(1.0), Y(y0 - 0.1), X(2), X(0.18));
      }
      x.fillStyle = '#d4c49e'; x.fillRect(0, Y(4.02), w, X(0.12)); x.fillRect(0, Y(8), w, X(0.12));
      return g;
    },
    dz_siding(x, w, h) {
      const P = w / 4, X = m => m * P, Y = m => h - m * P;
      siding(x, w, h, P);
      return [pane(x, X(0.8), Y(6.6), X(2.4), X(5.4), '#fbfbf8', 5, 3, 5)];
    },
    dz_lattice(x, w, h) {
      const P = w / 4, X = m => m * P, Y = m => h - m * P;
      siding(x, w, h, P);
      const x0 = X(0.8), y0 = Y(6.4), ww = X(2.4), hh = X(5);
      x.fillStyle = '#fbfbf8'; x.fillRect(x0 - 5, y0 - 5, ww + 10, hh + 10);
      glassStyle(x, x0, y0, ww, hh); x.fillRect(x0, y0, ww, hh);
      x.save(); x.beginPath(); x.rect(x0, y0, ww, hh); x.clip();
      x.strokeStyle = '#fbfbf8'; x.lineWidth = 2;
      for (let k = -hh; k < ww + hh; k += 14) {
        x.beginPath(); x.moveTo(x0 + k, y0); x.lineTo(x0 + k + hh * 0.6, y0 + hh); x.stroke();
        x.beginPath(); x.moveTo(x0 + k, y0); x.lineTo(x0 + k - hh * 0.6, y0 + hh); x.stroke();
      }
      x.restore();
      return [[x0, y0, ww, hh]];
    },
    nativity(x, w, h) {
      const P = w / 4, X = m => m * P, Y = m => h - m * P;
      bricks(x, w, h, '#e7cf9f', P, 87);
      x.fillStyle = 'rgba(160,110,60,0.16)'; for (let yy = 0; yy < h; yy += X(0.5)) x.fillRect(0, yy, w, X(0.1));
      x.fillStyle = '#f4e8cf'; x.fillRect(0, Y(1.1), w, X(0.25)); x.fillRect(0, Y(7.3), w, X(0.35));
      return [arch(x, X(2), Y(6.4), Y(1.8), X(1.5), '#f7eedb')];
    },
    opera(x, w, h) {
      const P = w / 8, X = m => m * P, Y = m => h - m * P, g = [];
      x.fillStyle = '#f0e9d8'; x.fillRect(0, 0, w, h); grime(x, w, h, 10, 73, 4);
      x.fillStyle = 'rgba(120,100,70,0.2)'; for (let m = 0.6; m < 6; m += 0.6) x.fillRect(0, Y(m), w, 1);
      for (const cx of [2, 6]) { g.push(pane(x, X(cx - 0.8), Y(4.6), X(1.6), X(2.6), '#fbf7ee', 2, 2, 3)); g.push(arch(x, X(cx), Y(12.8), Y(7.6), X(1.8), '#fbf7ee')); }
      x.fillStyle = '#e2d8c2'; x.fillRect(0, Y(6.6), w, X(0.6)); x.fillRect(0, Y(14.4), w, X(0.9));
      x.fillStyle = '#f7f1e3'; x.fillRect(X(3.7), Y(14), X(0.6), X(7.4)); x.fillRect(0, Y(14), X(0.3), X(7.4)); x.fillRect(w - X(0.3), Y(14), X(0.3), X(7.4));
      for (let k = 0; k < w; k += 6) x.fillRect(k, Y(15.6), 3, X(1));
      return g;
    },
    latvija(x, w, h) {
      const P = w / 4, X = m => m * P, Y = m => h - m * P, g = [];
      x.fillStyle = '#b8bcbb'; x.fillRect(0, 0, w, h); grime(x, w, h, 10, 89, 3);
      for (const y0 of [1.05, 4.3]) {
        const t = Y(y0 + 2.0), hh = X(2.0);
        glassStyle(x, 0, t, w, hh); x.fillRect(0, t, w, hh);
        x.fillStyle = '#a9aeae'; for (let k = 0; k < w; k += X(1)) x.fillRect(k, t, 2, hh);
        g.push([0, t, w, hh]);
      }
      return g;
    },
    air_facade(x, w, h) {
      const P = w / 8, X = m => m * P, Y = m => h - m * P, g = [];
      x.fillStyle = '#dfe2e4'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#6a6e72'; x.fillRect(0, Y(0.4), w, X(0.4));
      const band = (y0, y1, step) => {
        const t = Y(y1), hh = X(y1 - y0);
        glassStyle(x, 0, t, w, hh); x.fillRect(0, t, w, hh);
        x.fillStyle = '#c8ccd0'; for (let k = 0; k < w; k += X(step)) x.fillRect(k, t, 2, hh);
        g.push([0, t, w, hh]);
      };
      band(0.4, 4.4, 1.6); band(6.4, 9.6, 1.33);
      x.fillStyle = '#c9cdd0'; x.fillRect(0, Y(6.4), w, X(2));
      x.fillStyle = '#eceeef'; x.fillRect(0, Y(12), w, X(2.4));
      x.fillStyle = 'rgba(0,0,0,0.1)'; for (let k = 0; k < w; k += X(2)) { x.fillRect(k, Y(6.4), 1, X(2)); x.fillRect(k, Y(12), 1, X(2.4)); }
      return g;
    },
    station(x, w, h) {
      const P = w / 8, X = m => m * P, Y = m => h - m * P;
      x.fillStyle = '#cfccc4'; x.fillRect(0, 0, w, h); grime(x, w, h, 10, 91, 3);
      const t = Y(10.4), hh = X(9.9);
      glassStyle(x, 0, t, w, hh); x.fillRect(0, t, w, hh);
      x.fillStyle = '#b9b6ae'; for (let k = 0; k < w; k += X(1.33)) x.fillRect(k, t, 3, hh);
      x.fillRect(0, Y(4.2), w, 3); x.fillRect(0, Y(7.6), w, 3);
      return [[0, t, w, hh]];
    },
    mk_end(x, w, h) {
      const P = w / 26, X = m => m * P, Y = m => h - m * P, g = [];
      x.fillStyle = '#e4d6a8'; x.fillRect(0, 0, w, h); grime(x, w, h, 12, 83, 5);
      const arc = inset => {
        x.beginPath();
        for (let i = 0; i <= 32; i++) {
          const z = -13 + inset + (26 - inset * 2) * i / 32, y = 4.5 + (13.5 - inset) * Math.sqrt(Math.max(0, 1 - (z / (13 - inset)) ** 2));
          if (i) x.lineTo(X(z + 13), Y(y)); else x.moveTo(X(z + 13), Y(y));
        }
        x.closePath();
      };
      x.save(); arc(2.2); x.clip();
      glassStyle(x, X(2.2), Y(15.8), X(21.6), X(11.3)); x.fillRect(0, 0, w, h);
      x.fillStyle = '#f0e8cc';
      for (let z = 2.2; z < 24; z += 1.2) x.fillRect(X(z) - 1, 0, 2, h);
      for (const y of [6.6, 8.7, 10.8, 12.9, 15]) x.fillRect(0, Y(y) - 1, w, 2);
      x.fillStyle = '#d8cca2';
      for (const z of [7, 13, 19]) x.fillRect(X(z) - 2.5, 0, 5, h);
      x.restore();
      x.lineWidth = X(0.6); x.strokeStyle = '#c8b886'; arc(1.95); x.stroke();
      x.lineWidth = X(0.16); x.strokeStyle = '#f6eed4'; arc(1.5); x.stroke();
      x.save(); x.beginPath(); x.rect(0, Y(4.5), w, X(4.5)); x.clip(); bricks(x, w, h, '#9c5a44', P * 2, 85); x.restore();
      x.fillStyle = '#d8ca9e'; x.fillRect(0, Y(4.8), w, X(0.55));
      x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(0, Y(4.25), w, 2);
      x.fillStyle = '#7c7468'; x.fillRect(0, Y(0.5), w, X(0.5));
      x.fillStyle = '#34261c'; x.fillRect(X(10.6), Y(3.3), X(4.8), X(3.3));
      x.fillStyle = '#5c4232'; x.fillRect(X(12.92), Y(3.3), X(0.16), X(3.3));
      x.fillStyle = 'rgba(190,210,225,0.3)'; x.fillRect(X(11), Y(3.05), X(1.7), X(1.45)); x.fillRect(X(13.3), Y(3.05), X(1.7), X(1.45));
      for (const z of [3.2, 6.8, 17.2, 20.8]) g.push(pane(x, X(z), Y(3.5), X(2), X(2.2), '#e6dcc0', 2, 2, 2));
      x.fillStyle = 'rgba(0,0,0,0.1)'; x.fillRect(0, 0, X(0.3), h); x.fillRect(w - X(0.3), 0, X(0.3), h);
      g.push([X(2.2), Y(15.8), X(21.6), X(11.3)]);
      return g;
    },
    mk_wing(x, w, h) {
      const P = w / 8, X = m => m * P, Y = m => h - m * P, g = [];
      bricks(x, w, h, '#9c5a44', P * 2, 87);
      x.fillStyle = '#d2c6a0'; x.fillRect(0, 0, w, X(0.45));
      x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(0, X(0.45), w, 2);
      x.fillStyle = '#7c7468'; x.fillRect(0, Y(0.5), w, X(0.5));
      for (const z of [0.9, 4.9]) g.push(pane(x, X(z), Y(3.4), X(2.2), X(2), '#e6dcc0', 2, 3, 2));
      return g;
    },
    mk_names(x, w, h) {
      const rows = ['ZIVJU PAVILJONS', 'SAKŅU PAVILJONS', 'GASTRONOMIJAS PAVILJONS', 'PIENA PAVILJONS', 'GAĻAS PAVILJONS'], rh = h / rows.length;
      rows.forEach((s, i) => {
        x.fillStyle = '#1d4a33'; x.fillRect(0, i * rh, w, rh);
        x.strokeStyle = '#e8dcb8'; x.lineWidth = 2; x.strokeRect(3, i * rh + 3, w - 6, rh - 6);
        text(x, s, w / 2, i * rh + rh / 2 + 1, rh * 0.6, '#f2e8c8', 'Arial', w - 28);
      });
    },
    castle(x, w, h) {
      x.fillStyle = '#efe3c3'; x.fillRect(0, 0, w, h); grime(x, w, h, 14, 71, 4);
      const g = [pane(x, w * 0.33, h * 0.24, w * 0.34, h * 0.46, '#fbf6ea', 4, 2, 3)];
      x.fillStyle = 'rgba(150,120,80,0.2)'; x.fillRect(0, h - 3, w, 3);
      return g;
    },
    air_glass(x, w, h) {
      glassStyle(x, 0, 0, w, h); x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(0, 0, w, h * 0.3);
      x.fillStyle = '#e6eaec'; x.fillRect(0, 0, w, 3); x.fillRect(0, h - 3, w, 3); x.fillRect(0, 0, 3, h); x.fillRect(w - 3, 0, 3, h); x.fillRect(w / 2 - 1, 0, 2, h);
      return [[3, 3, w - 6, h - 6]];
    },
    dz_gable(x, w, h) {
      const P = w / 24, X = m => m * P, Y = m => h - m * P;
      siding(x, w, h, P * 1.5);
      const cx = X(12), cy = Y(4.1), r = X(2.1);
      x.fillStyle = '#fbfbf8'; x.beginPath(); x.arc(cx, cy, r + 5, 0, TAU); x.fill();
      glassStyle(x, cx - r, cy - r, r * 2, r * 2); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
      x.strokeStyle = '#fbfbf8'; x.lineWidth = 3;
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; x.beginPath(); x.moveTo(cx + Math.cos(a) * r * 0.3, cy + Math.sin(a) * r * 0.3); x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.stroke(); }
      x.beginPath(); x.arc(cx, cy, r * 0.3, 0, TAU); x.stroke();
      return [[cx - r * 0.7, cy - r * 0.7, r * 1.4, r * 1.4]];
    },
    air_sign(x, w, h) { x.clearRect(0, 0, w, h); text(x, 'LIDOSTA  RĪGA  AIRPORT', w / 2, h / 2 + 3, 80, '#c8202e', 'Arial', w - 16); },
    flags(x, w, h) {
      x.fillStyle = '#9e3039'; x.fillRect(0, 0, 64, h); x.fillStyle = '#ffffff'; x.fillRect(0, h * 0.4, 64, h * 0.2);
      x.fillStyle = '#1f3f9a'; x.fillRect(64, 0, 64, h);
      x.fillStyle = '#ffd700'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.beginPath(); x.arc(96 + Math.cos(a) * 17, h / 2 + Math.sin(a) * 17, 2.6, 0, TAU); x.fill(); }
      x.fillStyle = '#2f6fb8'; x.fillRect(128, 0, 64, h);
      x.fillStyle = '#ffffff'; x.fillRect(128, h * 0.36, 64, h * 0.08); x.fillRect(128, h * 0.56, 64, h * 0.08);
      x.fillStyle = '#f0c030'; x.beginPath(); x.arc(160, h * 0.2, 7, 0, TAU); x.fill();
    },
    majori(x, w, h) {
      x.fillStyle = '#1f4ea0'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#f4f4f0'; x.fillRect(3, 3, w - 6, 2); x.fillRect(3, h - 5, w - 6, 2);
      text(x, 'MAJORI', w / 2, h / 2 + 1, 30, '#ffffff', 'Arial');
    },
    dz_ped(x, w, h) {
      x.fillStyle = '#f6f5f0'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#4a4a48'; x.lineWidth = 3; x.beginPath();
      for (let k = 0; k <= 12; k++) { const px = w * 0.24 + k * w * 0.043, py = h * (k % 2 ? 0.5 : 0.82); if (k) x.lineTo(px, py); else x.moveTo(px, py); }
      x.stroke();
    },
    ltv_tower(x, w, h) {
      const g = [], fl = h / 4, bay = w / 8;
      x.fillStyle = '#4e4138'; x.fillRect(0, 0, w, h);
      for (let f = 0; f < 4; f++) {
        const y0 = f * fl, gy = y0 + fl * 0.26, gh = fl * 0.68;
        x.fillStyle = '#5f5045'; x.fillRect(0, y0, w, fl * 0.26);
        x.fillStyle = 'rgba(0,0,0,0.32)'; x.fillRect(0, gy - 2, w, 2);
        glassStyle(x, 0, gy, w, gh); x.fillRect(0, gy, w, gh);
        g.push([0, gy, w, gh]);
        x.fillStyle = '#4a3d35';
        for (let k = 0; k <= 8; k++) x.fillRect(k * bay - 3, gy, 6, gh);
        x.fillStyle = 'rgba(210,225,240,0.1)';
        for (let k = 0; k < 8; k++) x.fillRect(k * bay + 5, gy + 3, bay * 0.3, gh * 0.45);
      }
      grime(x, w, h, 16, 71, 8);
      return g;
    },
    ltv_band(x, w, h) {
      const g = [], py = h * 0.38;
      x.fillStyle = '#5a4b41'; x.fillRect(0, 0, w, py);
      x.fillStyle = 'rgba(255,240,225,0.08)'; x.fillRect(0, 2, w, 3);
      x.fillStyle = 'rgba(0,0,0,0.38)'; x.fillRect(0, py - 3, w, 3);
      glassStyle(x, 0, py, w, h - py); x.fillRect(0, py, w, h - py);
      g.push([0, py, w, h - py]);
      x.fillStyle = '#3e332c'; for (let k = 0; k < w; k += 16) x.fillRect(k, py, 3, h - py);
      x.fillStyle = '#4b3f37'; for (let k = 40; k < w; k += 96) x.fillRect(k, py, 22, h - py);
      grime(x, w, h, 14, 73, 4);
      return g;
    },
    ltv_sign(x, w, h) {
      x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#c8202e'; x.fillRect(0, h - 11, w, 7);
      const cx = h * 0.5, cy = h * 0.45, r = h * 0.32;
      x.fillStyle = '#c8202e'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
      text(x, 'a', cx, cy - 3, r * 1.5, '#f4f4f0', 'Arial');
      text(x, 'AMBERNET', w * 0.63, cy, h * 0.3, '#6a6e72', 'Arial', w * 0.6);
    },
    ltv_text(x, w, h) { x.clearRect(0, 0, w, h); text(x, 'LATVIJAS TELEVĪZIJA', w / 2, h / 2 + 2, h * 0.64, '#f2f0ea', 'Arial', w - 12); },
    tv_text(x, w, h) { x.clearRect(0, 0, w, h); text(x, 'RĪGAS TELETORNIS', w / 2, h / 2 + 2, h * 0.64, '#f2f0ea', 'Arial', w - 12); },
    lucav_plq(x, w, h) {
      PAINT.granite(x, w, h);
      const gold = '#e6c25a';
      x.beginPath(); x.moveTo(9, h - 7); x.lineTo(9, 44); x.quadraticCurveTo(11, 17, w / 2, 5); x.quadraticCurveTo(w - 11, 17, w - 9, 44); x.lineTo(w - 9, h - 7); x.closePath();
      x.fillStyle = '#2a2521'; x.fill();
      x.strokeStyle = gold; x.lineWidth = 2; x.stroke();
      x.fillStyle = gold;
      x.fillRect(w / 2 - 1.5, 15, 3, 24); x.fillRect(w / 2 - 5, 19, 10, 2.5); x.fillRect(w / 2 - 8, 24, 16, 3);
      x.save(); x.translate(w / 2, 34); x.rotate(-0.45); x.fillRect(-5, -1.2, 10, 2.4); x.restore();
      text(x, '1701', w / 2, 52, 15, gold, 'Georgia', w - 30);
      text(x, 'ПАМЯТИ', w / 2, 69, 11, gold, 'Georgia', w - 26);
      text(x, 'РУССКИХЪ', w / 2, 82, 11, gold, 'Georgia', w - 26);
      text(x, 'ВОИНОВЪ', w / 2, 95, 11, gold, 'Georgia', w - 26);
      x.fillRect(w / 2 - 22, 103, 44, 1.5);
      text(x, '1891', w / 2, 113, 11, gold, 'Georgia', w - 30);
    },
    bisu_wall(x, w, h) {
      const X = m => m * w / 7.5, Y = m => h - m * h / 4.4, g = [];
      x.fillStyle = '#ecdca4'; x.fillRect(0, 0, w, h); grime(x, w, h, 10, 121, 4);
      for (const cx of [1.875, 5.625]) {
        x.fillStyle = '#f6f2e4'; x.fillRect(X(cx - 0.85), Y(3.55), X(1.7), Y(0.75) - Y(3.55));
        g.push(pane(x, X(cx - 0.6), Y(3.3), X(1.2), Y(0.95) - Y(3.3), '#fbf8ee', 2, 2, 4));
        x.fillStyle = '#f6f2e4'; x.fillRect(X(cx - 0.95), Y(0.95), X(1.9), 4);
        x.fillStyle = 'rgba(90,70,30,0.25)'; x.fillRect(X(cx - 0.95), Y(0.95) + 4, X(1.9), 2);
      }
      x.fillStyle = '#f6f2e4'; x.fillRect(0, 0, w, 7); x.fillRect(0, h - 4, w, 4);
      x.fillStyle = 'rgba(90,70,30,0.22)'; x.fillRect(0, 7, w, 2);
      return g;
    },
    bisu_ped(x, w, h) {
      const r = h * 0.44, cy = h - 6;
      x.fillStyle = '#f6f2e4'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#ecdca4'; x.beginPath(); x.moveTo(w * 0.07, h - 4); x.lineTo(w / 2, h * 0.17); x.lineTo(w * 0.93, h - 4); x.closePath(); x.fill();
      x.fillStyle = '#fbf8ee'; x.beginPath(); x.arc(w / 2, cy, r + 3, Math.PI, 0); x.closePath(); x.fill();
      glassStyle(x, w / 2 - r, cy - r, r * 2, r); x.beginPath(); x.arc(w / 2, cy, r, Math.PI, 0); x.closePath(); x.fill();
      x.strokeStyle = '#fbf8ee'; x.lineWidth = 2;
      for (let k = 1; k < 4; k++) { const a = Math.PI + k * Math.PI / 4; x.beginPath(); x.moveTo(w / 2, cy); x.lineTo(w / 2 + Math.cos(a) * r, cy + Math.sin(a) * r); x.stroke(); }
      return [[w / 2 - r * 0.7, cy - r * 0.8, r * 1.4, r * 0.7]];
    },
    piens_wall(x, w, h) {
      const X = m => m * w / 8, Y = m => h - m * h / 5.5, t = Y(3.9), hh = Y(1.5) - Y(3.9);
      x.fillStyle = '#d8d6cc'; x.fillRect(0, 0, w, h); grime(x, w, h, 12, 123, 6);
      x.fillStyle = 'rgba(0,0,0,0.12)'; for (let m = 0; m < 8; m += 2) x.fillRect(X(m), 0, 1, h);
      glassStyle(x, 0, t, w, hh); x.fillRect(0, t, w, hh);
      x.fillStyle = '#b9bcb8'; for (let m = 0; m < 8; m++) x.fillRect(X(m), t, 2, hh);
      x.fillRect(0, t + hh / 2 - 1, w, 2);
      x.fillStyle = '#2a62a8'; x.fillRect(0, Y(5.1), w, Y(4.6) - Y(5.1));
      x.fillStyle = '#9a968c'; x.fillRect(0, Y(0.5), w, h - Y(0.5));
      return [[0, t, w, hh]];
    },
    piens_sign(x, w, h) {
      x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#2a62a8'; x.fillRect(0, 0, w, 5); x.fillRect(0, h - 5, w, 5);
      x.beginPath(); x.moveTo(30, 10); x.quadraticCurveTo(48, 36, 30, 54); x.quadraticCurveTo(12, 36, 30, 10); x.fill();
      text(x, 'RĪGAS PIENA KOMBINĀTS', w / 2 + 24, h / 2 + 2, 27, '#2a62a8', 'Arial', w - 72);
    },
    tram_side(x, w, h) {
      const X = m => m * w / 12.4, g = [];
      const glass = (m0, m1, y0, y1) => { glassStyle(x, X(m0), y0, X(m1 - m0), y1 - y0); x.fillRect(X(m0), y0, X(m1 - m0), y1 - y0); g.push([X(m0), y0, X(m1 - m0), y1 - y0]); };
      x.fillStyle = '#f1eee2'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#c9ccd0'; x.fillRect(0, 0, w, 4);
      x.fillStyle = '#2a5aa8'; x.fillRect(0, 40, w, h - 40);
      x.fillStyle = '#1c3f7c'; x.fillRect(0, 38, w, 3);
      for (const m of [0.5, 5.55, 10.6]) {
        x.fillStyle = '#1e3a6e'; x.fillRect(X(m), 8, X(1.3), h - 12);
        for (const k of [0, 1]) glass(m + 0.08 + k * 0.65, m + 0.58 + k * 0.65, 11, 45);
      }
      for (const [m0, m1] of [[2.0, 3.6], [3.8, 5.4], [7.05, 8.65], [8.85, 10.45]]) glass(m0, m1, 11, 34);
      x.fillStyle = '#16181a'; x.fillRect(0, h - 3, w, 3);
      return g;
    },
    tram_front(x, w, h) {
      x.fillStyle = '#f1eee2'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#c9ccd0'; x.fillRect(0, 0, w, 4);
      x.fillStyle = '#16181a'; x.fillRect(14, 5, w - 28, 9);
      text(x, '10', w / 2, 10, 9, '#ffd23a', 'Arial');
      glassStyle(x, 6, 16, w - 12, 21); x.fillRect(6, 16, w - 12, 21);
      x.fillStyle = '#f1eee2'; x.fillRect(w / 2 - 1, 16, 2, 21);
      x.fillStyle = '#2a5aa8'; x.fillRect(0, 40, w, h - 40);
      x.fillStyle = '#1c3f7c'; x.fillRect(0, 38, w, 3);
      x.fillStyle = '#fff4d0'; for (const cx of [14, w - 14]) { x.beginPath(); x.arc(cx, 49, 4.5, 0, TAU); x.fill(); }
      x.fillStyle = '#8a8e92'; x.fillRect(4, h - 8, w - 8, 3);
      x.fillStyle = '#16181a'; x.fillRect(0, h - 3, w, 3);
      return [[6, 16, w - 12, 21]];
    }
  };

  F.Tex.register('lmatlas', () => {
    const c = F.Tex.canvas(S, S), x = c.getContext('2d', { willReadFrequently: true });
    const glass = [], see = new Set(['clock', 'air_sign', 'ltv_text', 'tv_text']);
    x.fillStyle = '#7a746e'; x.fillRect(0, 0, S, S);
    for (const [name] of REGIONS) {
      const r = A[name], g2 = PAD / 2;
      const t = F.Tex.canvas(r[2], r[3]), tx = t.getContext('2d', { willReadFrequently: true });
      const g = PAINT[name](tx, r[2], r[3]) || [];
      if (see.has(name)) x.clearRect(r[0] - g2, r[1] - g2, r[2] + PAD, r[3] + PAD);
      for (const [ox, oy] of [[-g2, 0], [g2, 0], [0, -g2], [0, g2], [-g2, -g2], [g2, -g2], [-g2, g2], [g2, g2]]) x.drawImage(t, r[0] + ox, r[1] + oy);
      x.clearRect(r[0], r[1], r[2], r[3]);
      x.drawImage(t, r[0], r[1]);
      for (const q of g) glass.push([q[0] + r[0], q[1] + r[1], q[2], q[3]]);
    }
    const img = x.getImageData(0, 0, S, S), d = img.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] < 128 ? 0 : 255;
    for (const [gx, gy, gw, gh] of glass) {
      for (let y = Math.max(0, Math.ceil(gy)); y < Math.min(S, gy + gh); y++) {
        for (let k = Math.max(0, Math.ceil(gx)); k < Math.min(S, gx + gw); k++) {
          const i = (y * S + k) * 4;
          if (d[i + 3] === 255 && d[i + 2] >= d[i] - 6 && d[i] + d[i + 1] + d[i + 2] < 450) d[i + 3] = 254;
        }
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  });

  function tq(b, name, p0, p1, p2, p3, col, mat, u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
    b.quad(p0, p1, p2, p3, col, mat, uvRect(name, u0, v0, u1, v1));
  }

  function tiled(b, name, o, ea, eb, la, lb, ta, tb, col, mat) {
    const P = (a, c) => [o[0] + ea[0] * a + eb[0] * c, o[1] + ea[1] * a + eb[1] * c, o[2] + ea[2] * a + eb[2] * c];
    for (let a0 = 0; a0 < la - 1e-3; a0 += ta) {
      const a1 = Math.min(la, a0 + ta);
      for (let c0 = 0; c0 < lb - 1e-3; c0 += tb) {
        const c1 = Math.min(lb, c0 + tb);
        tq(b, name, P(a0, c0), P(a1, c0), P(a1, c1), P(a0, c1), col, mat, 0, 1 - (c1 - c0) / tb, (a1 - a0) / ta, 1);
      }
    }
  }

  function wall(b, name, x0, z0, x1, z1, y0, y1, ta, tb, col, mat) {
    const l = Math.hypot(x1 - x0, z1 - z0);
    tiled(b, name, [x0, y0, z0], [(x1 - x0) / l, 0, (z1 - z0) / l], [0, 1, 0], l, y1 - y0, ta || l, tb || y1 - y0, col, mat);
  }

  function walls4(b, name, x0, z0, x1, z1, y0, y1, ta, tb, col, mat) {
    wall(b, name, x1, z0, x0, z0, y0, y1, ta, tb, col, mat);
    wall(b, name, x0, z1, x1, z1, y0, y1, ta, tb, col, mat);
    wall(b, name, x0, z0, x0, z1, y0, y1, ta, tb, col, mat);
    wall(b, name, x1, z1, x1, z0, y0, y1, ta, tb, col, mat);
  }

  function tbox(b, name, x0, y0, z0, x1, y1, z1, t, col, mat) {
    walls4(b, name, x0, z0, x1, z1, y0, y1, t, t, col, mat);
    tiled(b, name, [x0, y1, z1], [1, 0, 0], [0, 0, -1], x1 - x0, z1 - z0, t, t, col, mat);
  }

  function roofZ(b, name, x0, x1, z0, z1, yE, yR, col, t = 4) {
    const h = yR - yE, hw = (x1 - x0) / 2, sl = Math.hypot(hw, h);
    tiled(b, name, [x0, yE, z0], [0, 0, 1], [hw / sl, h / sl, 0], z1 - z0, sl, t, t, col, 0);
    tiled(b, name, [x1, yE, z1], [0, 0, -1], [-hw / sl, h / sl, 0], z1 - z0, sl, t, t, col, 0);
  }

  function roofX(b, name, x0, x1, z0, z1, yE, yR, col, t = 4) {
    const h = yR - yE, hd = (z1 - z0) / 2, sl = Math.hypot(hd, h);
    tiled(b, name, [x1, yE, z0], [-1, 0, 0], [0, h / sl, hd / sl], x1 - x0, sl, t, t, col, 0);
    tiled(b, name, [x0, yE, z1], [1, 0, 0], [0, h / sl, -hd / sl], x1 - x0, sl, t, t, col, 0);
  }

  function facade(b, name, ox, oz, dx, dz, W, H, y0 = 0) {
    const nx = -dz, nz = dx;
    const P = (s, y, o = 0) => [ox + dx * s + nx * o, y0 + y, oz + dz * s + nz * o];
    const T = (s, y) => uvAt(name, F.clamp(s / W, 0, 1), F.clamp(1 - y / H, 0, 1));
    const f = {
      P,
      rect(s0, ya, s1, yb, col, mat, o = 0) {
        const q = [T(s0, ya), T(s1, ya), T(s1, yb), T(s0, yb)];
        b.quad(P(s0, ya, o), P(s1, ya, o), P(s1, yb, o), P(s0, yb, o), col, mat, [q[0][0], q[0][1], q[1][0], q[1][1], q[2][0], q[2][1], q[3][0], q[3][1]]);
      },
      tri(p, q, r, col, mat, o = 0) {
        const t = [T(p[0], p[1]), T(q[0], q[1]), T(r[0], r[1])];
        b.triangle(P(p[0], p[1], o), P(q[0], q[1], o), P(r[0], r[1], o), col, mat, [t[0][0], t[0][1], t[1][0], t[1][1], t[2][0], t[2][1]]);
      },
      fan(c, pts, col, mat, o = 0) { for (let i = 0; i + 1 < pts.length; i++) f.tri(c, pts[i], pts[i + 1], col, mat, o); },
      edges(pts, d, col) {
        for (let i = 0; i + 1 < pts.length; i++) {
          const p = pts[i], q = pts[i + 1];
          b.quad(P(p[0], p[1], 0), P(q[0], q[1], 0), P(q[0], q[1], -d), P(p[0], p[1], -d), col);
        }
      },
      back(c, pts, d, col) {
        for (let i = 0; i + 1 < pts.length; i++) b.triangle(P(c[0], c[1], -d), P(pts[i + 1][0], pts[i + 1][1], -d), P(pts[i][0], pts[i][1], -d), col);
      },
      box(s0, ya, s1, yb, o, col, mat) {
        f.rect(s0, ya, s1, yb, col, mat, o);
        b.quad(P(s0, ya, 0), P(s0, ya, o), P(s0, yb, o), P(s0, yb, 0), col);
        b.quad(P(s1, ya, o), P(s1, ya, 0), P(s1, yb, 0), P(s1, yb, o), col);
        b.quad(P(s0, yb, o), P(s1, yb, o), P(s1, yb, 0), P(s0, yb, 0), col);
      }
    };
    return f;
  }

  function stepGable(b, f, W, H, n, win, mat, col, cap, depth) {
    for (let k = 0; k < n; k++) {
      const s0 = k * W / 2 / n, s1 = W - s0, y0 = k * H / n, y1 = (k + 1) * H / n;
      f.rect(s0, y0, s1, y1, win, mat);
      b.quad(f.P(s0, y0, -depth), f.P(s0, y1, -depth), f.P(s1, y1, -depth), f.P(s1, y0, -depth), col);
      b.quad(f.P(s0, y0, 0), f.P(s0, y0, -depth), f.P(s0, y1, -depth), f.P(s0, y1, 0), col);
      b.quad(f.P(s1, y0, -depth), f.P(s1, y0, 0), f.P(s1, y1, 0), f.P(s1, y1, -depth), col);
      b.quad(f.P(s0 - 0.08, y1, 0.08), f.P(s1 + 0.08, y1, 0.08), f.P(s1 + 0.08, y1, -depth - 0.08), f.P(s0 - 0.08, y1, -depth - 0.08), cap);
    }
  }

  function lathe(b, cx, cz, prof, seg, col, mat, name, a0 = 0, per = false, pv = false) {
    const n = prof.length - 1;
    for (let k = 0; k < n; k++) {
      const [r0, y0] = prof[k], [r1, y1] = prof[k + 1];
      if (r0 < 1e-3 && r1 < 1e-3) continue;
      const v0 = pv ? 0 : 1 - (k + 1) / n, v1 = pv ? 1 : 1 - k / n;
      for (let i = 0; i < seg; i++) {
        const t0 = a0 + i / seg * TAU, t1 = a0 + (i + 1) / seg * TAU;
        const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
        const u0 = per ? 1 : 1 - i / seg, u1 = per ? 0 : 1 - (i + 1) / seg;
        const A0 = [cx + c0 * r0, y0, cz + s0 * r0], A1 = [cx + c1 * r0, y0, cz + s1 * r0], B1 = [cx + c1 * r1, y1, cz + s1 * r1], B0 = [cx + c0 * r1, y1, cz + s0 * r1];
        if (r1 < 1e-3) b.triangle(A0, A1, [cx, y1, cz], col, mat, name ? [...uvAt(name, u0, v1), ...uvAt(name, u1, v1), ...uvAt(name, (u0 + u1) / 2, v0)] : null);
        else if (r0 < 1e-3) b.triangle([cx, y0, cz], B1, B0, col, mat, name ? [...uvAt(name, (u0 + u1) / 2, v1), ...uvAt(name, u1, v0), ...uvAt(name, u0, v0)] : null);
        else b.quad(A0, A1, B1, B0, col, mat, name ? uvRect(name, u0, v0, u1, v1) : null);
      }
    }
  }

  function bands(r, y0, y1, step) {
    const out = [];
    const n = Math.max(1, Math.round((y1 - y0) / step));
    for (let i = 0; i <= n; i++) out.push([r, y0 + (y1 - y0) * i / n]);
    return out;
  }

  function flat(b, pts, o, ex, ey, col, mat) {
    const P = p => [o[0] + ex[0] * p[0] + ey[0] * p[1], o[1] + ex[1] * p[0] + ey[1] * p[1], o[2] + ex[2] * p[0] + ey[2] * p[1]];
    const c = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
    for (let i = 0; i < pts.length; i++) b.triangle(P(c), P(pts[i]), P(pts[(i + 1) % pts.length]), col, mat);
  }

  function rooster(b, x, y, z, s, col) {
    const pts = [[-0.5, 0], [0.3, 0], [0.55, 0.4], [0.62, 0.78], [0.44, 0.92], [0.34, 0.66], [0.02, 0.52], [-0.3, 0.98], [-0.62, 0.5]];
    flat(b, pts.map(p => [p[0] * s, p[1] * s + 0.12 * s]), [x, y, z], [1, 0, 0], [0, 1, 0], col, MAT.TRIM);
    b.box(x, y + 0.06 * s, z, 0.03 * s, 0.07 * s, 0.03 * s, col, MAT.TRIM);
  }

  function star(b, x, y, z, r, col) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? r * 0.42 : r; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    flat(b, pts, [x, y, z], [1, 0, 0], [0, 1, 0], col, MAT.TRIM);
  }

  function cross(b, x, y, z, h, col) {
    b.box(x, y + h / 2, z, 0.05 * h, h / 2, 0.05 * h, col, MAT.TRIM);
    b.box(x, y + h * 0.72, z, 0.3 * h, 0.04 * h, 0.04 * h, col, MAT.TRIM);
    b.box(x, y + h * 0.88, z, 0.16 * h, 0.035 * h, 0.035 * h, col, MAT.TRIM);
    b.beam([x - 0.2 * h, y + h * 0.26, z], [x + 0.2 * h, y + h * 0.4, z], 0.035 * h, col, MAT.TRIM);
  }

  function clockFace(b, cx, cy, cz, nx, nz, r) {
    const rx = nz, rz = -nx;
    tq(b, 'clock', [cx - rx * r, cy - r, cz - rz * r], [cx + rx * r, cy - r, cz + rz * r], [cx + rx * r, cy + r, cz + rz * r], [cx - rx * r, cy + r, cz - rz * r], C('#ffffff'), MAT.TRIM);
  }

  function dish(b, cx, cy, cz, nx, nz, r, col, back) {
    const ux = -nz, uz = nx, n = 10, rim = [];
    for (let i = 0; i < n; i++) { const t = i / n * TAU; rim.push([cx + ux * Math.cos(t) * r, cy + Math.sin(t) * r, cz + uz * Math.cos(t) * r]); }
    const f = [cx - nx * 0.15 * r, cy, cz - nz * 0.15 * r], k = [cx - nx * 0.5 * r, cy, cz - nz * 0.5 * r];
    for (let i = 0; i < n; i++) { const p = rim[i], q = rim[(i + 1) % n]; b.triangle(f, q, p, col); b.triangle(k, p, q, back); }
  }

  function gallery(b, cx, cz, y0, y1, rp, rf, col, dark) {
    lathe(b, cx, cz, [[0.01, y0 - 0.02], [rf, y0], [rf, y0 + 0.25], [0, y0 + 0.25]], 8, col, 0);
    b.cyl(cx, y0 + 0.25, cz, rp * 0.6, y1 - y0 - 0.25, 8, dark, 0);
    for (let i = 0; i < 8; i++) {
      const t = Math.PI / 8 + i / 8 * TAU;
      b.box(cx + Math.cos(t) * rp, (y0 + y1) / 2 + 0.12, cz + Math.sin(t) * rp, 0.13, (y1 - y0) / 2 - 0.12, 0.13, col);
      b.box(cx + Math.cos(t) * (rf - 0.08), y0 + 0.7, cz + Math.sin(t) * (rf - 0.08), 0.05, 0.45, 0.05, col);
    }
    lathe(b, cx, cz, [[rf - 0.05, y0 + 1.05], [rf - 0.05, y0 + 1.18]], 12, col, 0);
  }

  function tube(b, p0, p1, r0, r1, seg, col, name) {
    const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], l = Math.hypot(d[0], d[1], d[2]);
    const ax = d.map(v => v / l), ref = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u0 = [ax[1] * ref[2] - ax[2] * ref[1], ax[2] * ref[0] - ax[0] * ref[2], ax[0] * ref[1] - ax[1] * ref[0]], ul = Math.hypot(u0[0], u0[1], u0[2]);
    const u = u0.map(v => v / ul), v = [ax[1] * u[2] - ax[2] * u[1], ax[2] * u[0] - ax[0] * u[2], ax[0] * u[1] - ax[1] * u[0]];
    const P = (p, r, t) => [0, 1, 2].map(k => p[k] + (u[k] * Math.cos(t) + v[k] * Math.sin(t)) * r);
    for (let i = 0; i < seg; i++) {
      const t0 = i / seg * TAU, t1 = (i + 1) / seg * TAU;
      b.quad(P(p0, r0, t0), P(p0, r0, t1), P(p1, r1, t1), P(p1, r1, t0), col, 0, name ? uvRect(name, i / seg, 0, (i + 1) / seg, 1) : null);
    }
  }

  function ellipsoid(b, cx, cy, cz, rx, ry, rz, col, name) {
    const SEG = 8, RG = 4;
    const P = (i, j) => { const ph = -Math.PI / 2 + i / RG * Math.PI, th = j / SEG * TAU; return [cx + rx * Math.cos(ph) * Math.cos(th), cy + ry * Math.sin(ph), cz + rz * Math.cos(ph) * Math.sin(th)]; };
    const U = (u, v) => (name ? uvAt(name, u, v) : WHITE);
    for (let i = 0; i < RG; i++) {
      for (let j = 0; j < SEG; j++) {
        const u0 = j / SEG, u1 = (j + 1) / SEG, v0 = 1 - (i + 1) / RG, v1 = 1 - i / RG;
        if (i === 0) b.triangle([cx, cy - ry, cz], P(1, j + 1), P(1, j), col, 0, [...U((u0 + u1) / 2, v1), ...U(u1, v0), ...U(u0, v0)]);
        else if (i === RG - 1) b.triangle(P(i, j), P(i, j + 1), [cx, cy + ry, cz], col, 0, [...U(u0, v1), ...U(u1, v1), ...U((u0 + u1) / 2, v0)]);
        else b.quad(P(i, j), P(i, j + 1), P(i + 1, j + 1), P(i + 1, j), col, 0, name ? uvRect(name, u0, v0, u1, v1) : null);
      }
    }
  }

  LM.blackheads = b => {
    const redD = C('#9a3c2a'), white = C('#eee8db'), roofC = C('#c86a50'), gold = C('#e8b840'), grey = C('#8e8a84');
    const bh = facade(b, 'bh_front', 3, -10, -1, 0, 16, 30);
    for (const [a, c, y0, y1] of BH) bh.rect(a, y0, c, y1, WIN(0.55), MAT.WINDOWS);
    for (let k = 1; k < BH.length; k++) {
      const [a, c, y0, y1] = BH[k];
      b.quad(bh.P(a, y0, -0.8), bh.P(a, y1, -0.8), bh.P(c, y1, -0.8), bh.P(c, y0, -0.8), redD);
      b.quad(bh.P(a, y0, 0), bh.P(a, y0, -0.8), bh.P(a, y1, -0.8), bh.P(a, y1, 0), white);
      b.quad(bh.P(c, y0, -0.8), bh.P(c, y0, 0), bh.P(c, y1, 0), bh.P(c, y1, -0.8), white);
    }
    for (const [a, c, , y1] of BH) {
      b.box(3 - (a + c) / 2, y1 + 0.12, -9.55, (c - a) / 2 + 0.12, 0.12, 0.55, white);
      if (y1 >= 30) continue;
      for (const s of [a, c]) { b.box(3 - s, y1 + 0.84, -9.6, 0.16, 0.6, 0.16, white); b.cone(3 - s, y1 + 1.44, -9.6, 0.2, 0.7, 4, white); }
    }
    b.box(-5, 30.9, -9.6, 0.22, 0.66, 0.22, white);
    b.cyl(-5, 31.5, -9.6, 0.26, 0.42, 6, gold, MAT.TRIM);
    b.cone(-5, 31.92, -9.6, 0.09, 1.1, 4, gold, MAT.TRIM);
    bh.box(6.2, 0, 9.8, 4.8, 0.35, WIN(1), 0);
    b.box(-5, 0.15, -10.75, 2.2, 0.15, 0.4, grey);
    wall(b, 'bh_side', -13, -9.2, -13, 10, 0, 14, 4, 7, WIN(0.5), MAT.WINDOWS);
    wall(b, 'bh_side', -13, 10, 3, 10, 0, 14, 4, 7, WIN(0.5), MAT.WINDOWS);
    roofZ(b, 'tiles', -13.3, 3.3, -9.2, 10.3, 13.8, 27, roofC);
    b.triangle([-13, 14, 10], [3, 14, 10], [-5, 27, 10], redD);
    const sw = facade(b, 'schwab', 13, -10, -1, 0, 10, 26.25);
    sw.rect(0, 0, 10, 16, WIN(0.6), MAT.WINDOWS);
    sw.fan([5, 16], SW, WIN(0.6), MAT.WINDOWS);
    sw.edges(SW, 0.8, white);
    sw.back([5, 16], SW, 0.8, redD);
    lathe(b, 8, -9.6, [[0.55, 25.6], [0.55, 27.2]], 8, white, 0);
    lathe(b, 8, -9.6, [[0.75, 27.2], [0.75, 27.45], [0.62, 27.9], [0.3, 28.6], [0.12, 29.2], [0.03, 31.6]], 8, C('#6f9a86'), 0, 'copper');
    b.cyl(8, 29.6, -9.6, 0.16, 0.3, 6, gold, MAT.TRIM);
    wall(b, 'bh_side', 13, 10, 13, -9.2, 0, 16, 4, 7, WIN(0.5), MAT.WINDOWS);
    wall(b, 'bh_side', 3, 10, 13, 10, 0, 16, 4, 7, WIN(0.5), MAT.WINDOWS);
    b.quad([3, 14, -9.2], [3, 14, 10], [3, 16, 10], [3, 16, -9.2], redD);
    roofZ(b, 'tiles', 2.8, 13.2, -9.2, 10.3, 15.8, 24.5, roofC);
    b.triangle([3, 16, 10], [13, 16, 10], [8, 24.5, 10], redD);
    return 32.5;
  };

  LM.roland = b => {
    const st = C('#e4decf'), stD = C('#cdc5b3'), red = C('#b42a2a');
    lathe(b, 0, 0, [[1.7, 0], [1.7, 0.3], [1.35, 0.3], [1.35, 0.6], [0, 0.6]], 8, C('#ffffff'), 0, 'granite', Math.PI / 8, true);
    tbox(b, 'stone', -0.62, 0.6, -0.62, 0.62, 2.7, 0.62, 2.1, st, 0);
    b.box(0, 2.8, 0, 0.74, 0.1, 0.74, stD);
    b.box(-0.17, 3.35, 0, 0.13, 0.45, 0.15, st);
    b.box(0.17, 3.35, 0, 0.13, 0.45, 0.15, st);
    lathe(b, 0, 0, [[0.4, 3.55], [0.36, 4.0], [0.3, 4.75], [0.2, 4.9], [0, 4.9]], 8, st, 0);
    b.box(0, 4.72, 0, 0.42, 0.1, 0.2, st);
    lathe(b, 0, 0, [[0.14, 4.9], [0.17, 5.1], [0.16, 5.3], [0, 5.42]], 6, st, 0);
    b.beam([0.38, 4.7, 0], [0.42, 4.15, -0.2], 0.07, st);
    b.beam([-0.38, 4.7, 0], [-0.36, 4.2, -0.24], 0.07, st);
    b.box(-0.36, 4.05, -0.3, 0.24, 0.34, 0.04, stD);
    b.box(-0.36, 4.05, -0.35, 0.03, 0.26, 0.012, red);
    b.box(-0.36, 4.12, -0.35, 0.17, 0.03, 0.012, red);
    b.box(0.42, 5.0, -0.22, 0.03, 0.85, 0.03, stD);
    b.box(0.42, 4.22, -0.22, 0.14, 0.03, 0.03, stD);
    return 6;
  };

  LM.tvtower = b => {
    const ochre = C('#d4a24a'), ochreD = C('#b98a3a'), white = C('#ecebe6'), red = C('#cc3a2e'), grey = C('#9a9c9e'), conc = C('#b7b2a8'), marD = C('#6a2a2c');
    const TOP = 176, B0 = 47;
    const legR = y => 4 + 27 * Math.pow(1 - y / TOP, 1.8);
    const bodyR = y => 7.5 - 2.5 * (y - B0) / (TOP - B0);
    const ang = [0, 1, 2].map(k => -Math.PI / 2 + k * TAU / 3);
    const V = (k, y, s = 1) => { const a = ang[k % 3], r = bodyR(y) * s; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
    for (const a of ang) {
      const ca = Math.cos(a), sa = Math.sin(a), tx = -sa, tz = ca;
      let prev = null;
      for (let i = 0; i <= 16; i++) {
        const y = TOP * i / 16, r = legR(y), f = y / TOP, wt = 2.4 - 1.1 * f, wr = 1.8 - 0.6 * f, cx = ca * r, cz = sa * r;
        const ring = [[cx + ca * wr + tx * wt, y, cz + sa * wr + tz * wt], [cx - ca * wr + tx * wt, y, cz - sa * wr + tz * wt], [cx - ca * wr - tx * wt, y, cz - sa * wr - tz * wt], [cx + ca * wr - tx * wt, y, cz + sa * wr - tz * wt]];
        if (prev) for (let k = 0; k < 4; k++) b.quad(prev[k], prev[(k + 1) % 4], ring[(k + 1) % 4], ring[k], k % 2 ? ochreD : ochre);
        prev = ring;
      }
      b.box(ca * legR(0), 0.6, sa * legR(0), 3.4, 0.6, 3.4, conc);
      for (const y of [B0, 92, 142]) b.beam([ca * (bodyR(y) - 0.2), y, sa * (bodyR(y) - 0.2)], [ca * legR(y), y, sa * legR(y)], 0.8, ochreD);
    }
    for (const [y0, y1] of [[B0, 106], [120, TOP]]) {
      for (let k = 0; k < 3; k++) tq(b, 'tv_panel', V(k, y0), V(k + 1, y0), V(k + 1, y1), V(k, y1), WIN(0.9), MAT.WINDOWS, 0, (TOP - y1) / (TOP - B0), 1, (TOP - y0) / (TOP - B0));
    }
    for (let k = 0; k < 3; k++) {
      b.triangle([0, 40, 0], V(k + 1, B0), V(k, B0), marD);
      b.quad(V(k, 106, 0.55), V(k + 1, 106, 0.55), V(k + 1, 120, 0.55), V(k, 120, 0.55), white);
      const am = ang[k] + Math.PI / 3, nx = Math.cos(am), nz = Math.sin(am);
      for (const [y, off] of [[110, -1.6], [115.5, 1.6]]) {
        const ap = bodyR(y) * 0.275 + 0.5;
        dish(b, nx * ap - nz * off, y, nz * ap + nx * off, nx, nz, 1.3, white, grey);
      }
    }
    b.triangle(V(0, 106), V(1, 106), V(2, 106), white);
    b.triangle(V(0, 120), V(2, 120), V(1, 120), marD);
    const PV = (k, y) => [Math.cos(ang[k % 3]) * 9, y, Math.sin(ang[k % 3]) * 9];
    for (let k = 0; k < 3; k++) b.quad(PV(k, 176), PV(k + 1, 176), PV(k + 1, 178.5), PV(k, 178.5), white);
    b.triangle(PV(0, 178.5), PV(1, 178.5), PV(2, 178.5), white);
    b.triangle(PV(0, 176), PV(2, 176), PV(1, 176), grey);
    lathe(b, 0, 0, [[3.4, 178.5], [3.4, 186], [2.2, 186.6]], 6, grey, 0);
    const mastR = y => 2.1 - 1.2 * (y - 186) / 104;
    for (let i = 0; i < 9; i++) {
      const y0 = 186.6 + i * 11.5, y1 = y0 + 11.5;
      lathe(b, 0, 0, [[mastR(y0), y0], [mastR(y1), y1]], 8, i % 2 ? white : red, 0);
    }
    for (const y of [205, 236, 262]) {
      const R = mastR(y) + 1.4;
      lathe(b, 0, 0, [[mastR(y), y], [R, y], [R, y + 1.6], [mastR(y), y + 1.6]], 8, red, 0);
      for (const a of ang) b.box(Math.cos(a) * R, y + 1.9, Math.sin(a) * R, 0.35, 0.3, 0.35, red, MAT.LAMP);
    }
    lathe(b, 0, 0, [[0.9, 290.1], [0.35, 292], [0.1, 300]], 6, white, 0);
    b.box(0, 300.2, 0, 0.3, 0.3, 0.3, red, MAT.LAMP);
    walls4(b, 'station', -9, -9, 9, 9, 0, 6, 8, 12, WIN(0.8), MAT.WINDOWS);
    b.box(0, 6.15, 0, 9.3, 0.15, 9.3, conc);
    tq(b, 'tv_text', [-9.06, 4.3, -7], [-9.06, 4.3, 7], [-9.06, 5.7, 7], [-9.06, 5.7, -7], C('#ffffff'), 0);
    tq(b, 'tv_text', [-7, 4.3, 9.06], [7, 4.3, 9.06], [7, 5.7, 9.06], [-7, 5.7, 9.06], C('#ffffff'), 0);
    return 300;
  };

  LM.ltv = b => {
    const roofC = C('#6f675f'), brownD = C('#44372f'), brownL = C('#6d5d51'), white = C('#e6e4de'), grey = C('#8e9092'), steel = C('#a8acb0');
    const top = (x0, x1, z0, z1, y, col) => b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col);
    const under = (x0, x1, z0, z1, y, col) => b.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], col);
    let seed = 0;
    const lit = () => WIN(F.hash2(seed++, 7, 43) < 0.45 ? 0.97 : 0.04);
    const wallLit = (name, x0, z0, x1, z1, y0, y1, ta, tb, sa, sb) => {
      const l = Math.hypot(x1 - x0, z1 - z0), ex = (x1 - x0) / l, ez = (z1 - z0) / l;
      for (let a0 = 0; a0 < l - 1e-3; a0 += sa) {
        const a1 = Math.min(l, a0 + sa);
        for (let c0 = y0; c0 < y1 - 1e-3; c0 += sb) {
          const c1 = Math.min(y1, c0 + sb);
          tq(b, name, [x0 + ex * a0, c0, z0 + ez * a0], [x0 + ex * a1, c0, z0 + ez * a1], [x0 + ex * a1, c1, z0 + ez * a1], [x0 + ex * a0, c1, z0 + ez * a0], lit(), MAT.WINDOWS, 0, 1 - (c1 - c0) / tb, (a1 - a0) / ta, 1);
        }
      }
    };
    const tier = (x0, x1, z0, z1, y0, y1, soffit) => {
      for (const [ax, az, bx, bz] of [[x1, z0, x0, z0], [x0, z1, x1, z1], [x0, z0, x0, z1], [x1, z1, x1, z0]]) wallLit('ltv_band', ax, az, bx, bz, y0, y1, 12, y1 - y0, 6, y1 - y0);
      top(x0, x1, z0, z1, y1, roofC);
      if (soffit) under(x0, x1, z0, z1, y0, brownD);
    };
    tier(-102, 101, -22, 23, 0, 4.2, false);
    tier(-105, 104, -26, 26, 4.2, 8.4, true);
    tier(-104, 104, -25, 25, 8.4, 12.6, false);
    tier(-86, 100, -19, 20, 12.6, 16.8, false);
    tier(-60, 36, -6, 19, 16.8, 21, false);
    const plan = [[100, -15], [70, -15], [66, -11], [66, 7], [100, 7]];
    for (let i = 0; i < plan.length; i++) {
      const a = plan[i], c = plan[(i + 1) % plan.length];
      wallLit('ltv_tower', a[0], a[1], c[0], c[1], 0, 74.8, 13.6, 13.6, 6.8, 3.4);
    }
    b.box(83, 76.7, -4, 18.2, 1.9, 12.2, brownD, 0, { top: roofC });
    b.box(83, 78.9, -15.9, 17.8, 0.28, 0.25, brownL);
    for (const x of [79, 88, 95]) b.beam([x, 78.6, -13], [x, 84, -16.3], 0.12, grey);
    tq(b, 'ltv_sign', [97, 79.3, -16.45], [77, 79.3, -16.45], [77, 89.3, -16.45], [97, 89.3, -16.45], C('#ffffff'), MAT.AD);
    b.quad([77, 79.3, -16.35], [97, 79.3, -16.35], [97, 89.3, -16.35], [77, 89.3, -16.35], grey);
    for (const [x, z, h] of [[68, 5, 12], [72, 5, 8], [98, 4, 9]]) b.cyl(x, 78.6, z, 0.12, h, 4, steel);
    b.box(70, 90.6, 5, 0.25, 0.25, 0.25, C('#ff3020'), MAT.LAMP);
    b.box(98, 87.6, 4, 0.25, 0.25, 0.25, C('#ff3020'), MAT.LAMP);
    for (const x of [14, 30, 46]) b.beam([x, 12.6, -24.2], [x, 17.6, -24.2], 0.08, grey);
    tq(b, 'ltv_text', [52, 12.7, -24.6], [10, 12.7, -24.6], [10, 17.9, -24.6], [52, 17.9, -24.6], C('#ffffff'), 0);
    const nx = 0.622, nz = 0.783;
    for (const [x, z, y, r] of [[-54, 6, 21, 2.2], [-38, 10, 21, 1.6], [-22, 4, 21, 2.6], [-4, 12, 21, 1.8], [14, 6, 21, 2.2], [28, 13, 21, 1.4], [-78, -8, 16.8, 1.8], [-70, 10, 16.8, 1.4], [48, -10, 16.8, 2], [58, 12, 16.8, 1.6], [90, 14, 78.6, 1.4]]) {
      b.box(x, y + 0.5, z, 0.35, 0.5, 0.35, grey);
      dish(b, x, y + r + 0.9, z, nx, nz, r, white, grey);
    }
    for (const [x, y, z, w2, d2, hh] of [[-30, 21, 0, 5, 3, 2.2], [0, 21, 16, 3, 2, 1.8], [-80, 16.8, 14, 4, 3, 2], [44, 16.8, 10, 3, 3, 2.4]]) b.box(x, y + hh / 2, z, w2, hh / 2, d2, brownL);
    b.cyl(-8, 21, 16, 0.22, 13, 4, steel, 0, { r2: 0.08 });
    b.box(-8, 34.1, 16, 0.22, 0.22, 0.22, C('#ff3020'), MAT.LAMP);
    return 91;
  };

  LM.dom = b => {
    const brick = C('#9e4d37'), brickD = C('#8a4231'), roofC = C('#8aa196'), cop = C('#7a9c8c'), copD = C('#56786b'), gold = C('#e8b840'), stone = C('#dccfbc'), dark = C('#2e2c2a');
    const W = WIN(0.3), a8 = Math.PI / 8, NZ0 = -24, NZ1 = 30;
    walls4(b, 'dom_tower', -6, -36, 6, -24, 0, 46, 12, 48, W, MAT.WINDOWS);
    b.box(0, 46.25, -30, 6.45, 0.25, 6.45, stone);
    for (const [cx, cz, nx, nz] of [[0, -36.06, 0, -1], [0, -23.94, 0, 1], [-6.06, -30, -1, 0], [6.06, -30, 1, 0]]) clockFace(b, cx, 43.6, cz, nx, nz, 1.7);
    lathe(b, 0, -30, [[6.3, 46.5], [6.7, 47.4], [6.6, 49.2], [5.8, 51], [4.3, 52.6], [2.5, 53.9], [2.0, 54.5]], 8, copD, 0, 'copper', a8);
    b.cyl(0, 54.3, -30, 2.4, 0.3, 8, cop);
    b.cyl(0, 54.6, -30, 1.2, 4, 8, dark);
    for (let i = 0; i < 8; i++) { const t = a8 + i / 8 * TAU; b.box(Math.cos(t) * 1.85, 56.6, -30 + Math.sin(t) * 1.85, 0.16, 2.0, 0.16, stone); }
    b.cyl(0, 58.6, -30, 2.25, 0.4, 8, cop);
    lathe(b, 0, -30, [[2.1, 59], [2.55, 60], [2.2, 61.4], [1.2, 62.6], [0.6, 63.4], [0.42, 66], [0.04, 75.6]], 8, copD, 0, 'copper', a8);
    b.cyl(0, 75.4, -30, 0.32, 0.55, 6, gold, MAT.TRIM);
    rooster(b, 0, 75.95, -30, 1.4, gold);
    for (const s of [-1, 1]) {
      const x = 8 * s, xo = 19 * s;
      if (s < 0) {
        wall(b, 'clere', x, NZ0, x, NZ1, 14.5, 20, 6.75, 5.5, W, MAT.WINDOWS);
        wall(b, 'dom_aisle', xo, NZ0, xo, NZ1, 0, 11.5, 6.75, 11.5, W, MAT.WINDOWS);
      } else {
        wall(b, 'clere', x, NZ1, x, NZ0, 14.5, 20, 6.75, 5.5, W, MAT.WINDOWS);
        wall(b, 'dom_aisle', xo, NZ1, xo, NZ0, 0, 11.5, 6.75, 11.5, W, MAT.WINDOWS);
      }
      const ex = -s * 11.4, ey = 3.4, el = Math.hypot(ex, ey);
      tiled(b, 'seam', [s * 19.4, 11.3, s < 0 ? NZ0 : NZ1 + 0.3], [0, 0, -s], [ex / el, ey / el, 0], NZ1 + 0.3 - NZ0, el, 4, 4, roofC, 0);
      for (let i = 0; i <= 8; i++) b.box(s * 19.45, 5.2, NZ0 + i * 6.75, 0.45, 5.2, 0.55, brickD);
      for (const z of [NZ0, NZ1]) {
        const xa = s * 19, xb = s * 8, lo = Math.min(xa, xb), hi = Math.max(xa, xb);
        if (z === NZ0) wall(b, 'dom_aisle', hi, z, lo, z, 0, 11.5, 5.5, 11.5, W, MAT.WINDOWS);
        else wall(b, 'dom_aisle', lo, z, hi, z, 0, 11.5, 5.5, 11.5, W, MAT.WINDOWS);
        b.triangle([xa, 11.5, z], [xb, 11.5, z], [xb, 14.5, z], brick);
      }
    }
    b.quad([-8, 0, NZ0], [8, 0, NZ0], [8, 20, NZ0], [-8, 20, NZ0], brick);
    b.triangle([-8, 20, NZ0], [8, 20, NZ0], [0, 37, NZ0], brick);
    wall(b, 'dom_aisle', -8, NZ1, 8, NZ1, 0, 20, 5.33, 20, W, MAT.WINDOWS);
    roofZ(b, 'seam', -8.7, 8.7, NZ0, NZ1 - 0.4, 19.6, 37, roofC);
    stepGable(b, facade(b, 'dom_gable', -8, NZ1, 1, 0, 16, 17, 20), 16, 17, 7, W, MAT.WINDOWS, brick, brickD, 0.9);
    for (let k = 0; k < 7; k++) {
      const x0 = -8 + k * 8 / 7, y = 20 + (k + 1) * 17 / 7;
      for (const x of k < 6 ? [x0, -x0] : [0]) lathe(b, x, NZ1 - 0.45, [[0.28, y], [0.28, y + 0.5], [0.03, y + 1.6]], 4, cop, 0, null, Math.PI / 4);
    }
    lathe(b, 0, 8, [[1.0, 35.2], [1.0, 38.6], [0.9, 38.8], [0.1, 44]], 8, cop, 0, 'copper', a8);
    return 77;
  };

  LM.peter = b => {
    const pinkD = C('#9a6452'), pink = C('#b27862'), stone = C('#ddd3c1'), roofC = C('#945646'), cop = C('#76b89a'), copD = C('#5e9e84'), gold = C('#ecc04a'), dark = C('#2e2c2a');
    const W = WIN(0.3), TW = C('#f4e2dc', 0.3), FZ = -34, TZ1 = -23, TZ = -28.5, a8 = Math.PI / 8;
    const f = facade(b, 'peter_front', 16.5, FZ, -1, 0, 33, 36.1);
    f.rect(0, 0, 33, 24, W, MAT.WINDOWS);
    const GR = PG.map(p => [33 - p[0], p[1]]);
    for (const [c, pts] of [[[11, 24], PG], [[22, 24], GR]]) { f.fan(c, pts, W, MAT.WINDOWS); f.edges(pts, 0.8, stone); f.back(c, pts, 0.8, pinkD); }
    for (const [cx, pw, ph] of [[16.5, 5, 9.2], [5.5, 4, 7.8], [27.5, 4, 7.8]]) f.box(cx - pw / 2 - 0.3, 0, cx + pw / 2 + 0.3, ph + 1.6, 0.45, WIN(1), 0);
    for (const [s, y] of [[0.3, 25.2], [5.6, 29], [32.7, 25.2], [27.4, 29]]) {
      const p = f.P(s, y, -0.4);
      lathe(b, p[0], p[2], [[0.3, y], [0.3, y + 0.4], [0.18, y + 0.5], [0.02, y + 2.2]], 4, stone, 0, null, Math.PI / 4);
    }
    for (const [ox, oz, dx, dz] of [[5.5, FZ, -1, 0], [5.5, TZ1, 0, -1], [-5.5, FZ, 0, 1], [-5.5, TZ1, 1, 0]]) facade(b, 'peter_tower', ox, oz, dx, dz, 11, 38.5, 24).rect(0, 0, 11, 38, W, MAT.WINDOWS);
    for (const [x0, z0, x1, z1] of [[5.5, TZ1, 5.5, FZ], [-5.5, FZ, -5.5, TZ1], [-5.5, TZ1, 5.5, TZ1]]) b.quad([x0, 0, z0], [x1, 0, z1], [x1, 24, z1], [x0, 24, z0], pink);
    b.box(0, 62.2, TZ, 5.9, 0.4, 5.9, stone);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) lathe(b, sx * 5.2, TZ + sz * 5.2, [[0.4, 62.6], [0.4, 63.8], [0.02, 65.8]], 4, stone, 0, null, Math.PI / 4);
    lathe(b, 0, TZ, [[5.0, 62.6], [5.0, 69.6]], 8, cop, 0, 'copper', a8, true, true);
    for (const [nx, nz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) clockFace(b, nx * 4.66, 66.2, TZ + nz * 4.66, nx, nz, 1.6);
    lathe(b, 0, TZ, [[5.5, 69.6], [5.5, 70.1], [5.1, 70.1], [5.6, 71.3], [5.2, 73.2], [4.0, 75.0], [2.4, 76.4], [1.9, 77]], 8, copD, 0, 'copper', a8);
    gallery(b, 0, TZ, 77, 81.6, 1.9, 2.9, cop, dark);
    lathe(b, 0, TZ, [[2.2, 81.6], [2.7, 82.6], [2.4, 84.1], [1.3, 85.4], [1.0, 86]], 8, copD, 0, 'copper', a8);
    gallery(b, 0, TZ, 86, 89.4, 1.15, 1.9, cop, dark);
    lathe(b, 0, TZ, [[1.25, 89.4], [1.25, 89.8], [0.8, 91], [0.04, 105]], 8, copD, 0, 'copper', a8);
    b.cyl(0, 104.6, TZ, 0.36, 0.6, 6, gold, MAT.TRIM);
    rooster(b, 0, 105.2, TZ, 1.8, gold);
    for (const s of [-1, 1]) {
      if (s < 0) { wall(b, 'clere', -9, TZ1, -9, 22, 20, 26, 7.5, 6, TW, MAT.WINDOWS); wall(b, 'dom_aisle', -16.5, FZ, -16.5, 22, 0, 15, 7, 15, TW, MAT.WINDOWS); }
      else { wall(b, 'clere', 9, 22, 9, TZ1, 20, 26, 7.5, 6, TW, MAT.WINDOWS); wall(b, 'dom_aisle', 16.5, 22, 16.5, FZ, 0, 15, 7, 15, TW, MAT.WINDOWS); }
      const ex = -s * 7.9, ey = 5.4, el = Math.hypot(ex, ey);
      tiled(b, 'tiles', [s * 16.9, 14.8, s < 0 ? FZ : 22.4], [0, 0, -s], [ex / el, ey / el, 0], 22.4 - FZ, el, 4, 4, roofC, 0);
      wall(b, 'dom_aisle', Math.min(s * 16.5, s * 9), 22, Math.max(s * 16.5, s * 9), 22, 0, 15, 7.5, 15, TW, MAT.WINDOWS);
      b.triangle([s * 16.5, 15, 22], [s * 9, 15, 22], [s * 9, 20.2, 22], pink);
    }
    roofZ(b, 'tiles', -9.6, 9.6, FZ, 22, 25.6, 42, roofC);
    const AV = [0, 1, 2, 3, 4].map(i => { const p = -Math.PI / 2 + i * Math.PI / 4; return [9.5 * Math.sin(p), 22 + 9.5 * Math.cos(p)]; });
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = AV[i], [x1, z1] = AV[i + 1];
      wall(b, 'dom_aisle', x0, z0, x1, z1, 0, 26, null, 26, TW, MAT.WINDOWS);
      b.triangle([x0 * 1.04, 25.6, 22 + (z0 - 22) * 1.04], [x1 * 1.04, 25.6, 22 + (z1 - 22) * 1.04], [0, 42, 22], roofC);
    }
    return 108;
  };

  LM.freedom = b => {
    const trav = C('#ffffff'), travD = C('#ddd3bf'), cop = C('#7fb89e'), copD = C('#5f9c84'), gold = C('#f4c64c');
    tbox(b, 'granite', -7, 0, -7, 7, 0.5, 7, 3.5, trav, 0);
    tbox(b, 'granite', -6.3, 0.5, -6.3, 6.3, 1.0, 6.3, 3.15, trav, 0);
    tbox(b, 'granite', -5.6, 1.0, -5.6, 5.6, 1.5, 5.6, 2.8, trav, 0);
    walls4(b, 'fm_base', -4.2, -4.2, 4.2, 4.2, 1.5, 8.3, 8.4, 6.8, trav, 0);
    b.box(0, 8.43, 0, 4.45, 0.13, 4.45, travD);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const cx = sx * 4.3, cz = sz * 4.3;
        b.box(cx, 2.4, cz, 1.3, 0.9, 1.3, travD);
        for (const [ox, oz, h] of [[0.6, -0.3, 2.9], [-0.3, 0.6, 2.7], [0.35, 0.35, 3.3]]) {
          lathe(b, cx + sx * ox, cz + sz * oz, [[0.42, 3.3], [0.38, 3.3 + h * 0.55], [0.3, 3.3 + h * 0.82], [0.12, 3.3 + h * 0.86], [0.15, 3.3 + h * 0.9], [0.13, 3.3 + h], [0, 3.35 + h]], 6, travD, 0, 'stone');
        }
      }
    }
    tbox(b, 'stone', -2.6, 8.56, -2.2, 2.6, 11.5, 2.2, 2.95, C('#f4ecdc'), 0);
    tq(b, 'fm_text', [2.5, 10.1, -2.22], [-2.5, 10.1, -2.22], [-2.5, 10.72, -2.22], [2.5, 10.72, -2.22], trav, 0);
    const X0 = 1.6, Z0 = 1.2, X1 = 1.4, Z1 = 1.0, Y0 = 11.5, Y1 = 30.5;
    tq(b, 'trav', [X0, Y0, -Z0], [-X0, Y0, -Z0], [-X1, Y1, -Z1], [X1, Y1, -Z1], trav, 0);
    tq(b, 'trav', [-X0, Y0, Z0], [X0, Y0, Z0], [X1, Y1, Z1], [-X1, Y1, Z1], trav, 0);
    tq(b, 'trav', [-X0, Y0, -Z0], [-X0, Y0, Z0], [-X1, Y1, Z1], [-X1, Y1, -Z1], trav, 0, 0, 0, 0.35, 1);
    tq(b, 'trav', [X0, Y0, Z0], [X0, Y0, -Z0], [X1, Y1, -Z1], [X1, Y1, Z1], trav, 0, 0, 0, 0.35, 1);
    b.box(0, 31.25, 0, 1.55, 0.75, 1.15, cop);
    b.box(0, 32.1, 0, 1.7, 0.12, 1.3, copD);
    lathe(b, 0, 0, [[0.95, 32.2], [0.9, 32.6], [0.82, 34], [0.66, 35.8], [0.52, 37.1], [0.55, 37.9], [0.44, 38.5], [0.2, 38.7], [0, 38.7]], 8, cop, 0, 'copper');
    lathe(b, 0, 0, [[0.12, 38.7], [0.22, 38.9], [0.25, 39.2], [0.19, 39.5], [0.02, 39.62]], 6, cop, 0);
    for (const s of [-1, 1]) { b.beam([s * 0.4, 38.35, 0], [s * 0.5, 39.6, -0.1], 0.1, cop); b.beam([s * 0.5, 39.6, -0.1], [s * 0.62, 40.3, -0.15], 0.09, cop); }
    b.beam([-0.95, 40.35, -0.18], [0, 40.65, -0.18], 0.05, cop);
    b.beam([0, 40.65, -0.18], [0.95, 40.35, -0.18], 0.05, cop);
    for (const [x, y] of [[-0.95, 40.55], [0, 40.9], [0.95, 40.55]]) star(b, x, y, -0.22, 0.38, gold);
    return 41.5;
  };

  LM.terminal = b => {
    const white = C('#e8eaec'), dark = C('#4a4f55'), steel = C('#dfe3e6'), W = WIN(0.9);
    walls4(b, 'air_facade', -60, -5, 60, 23, 0, 12, 8, 12, W, MAT.WINDOWS);
    tiled(b, 'seam', [-60, 12, 23], [1, 0, 0], [0, 0, -1], 120, 28, 8, 8, C('#c9cccf'), 0);
    const sl = Math.hypot(17, 5);
    tiled(b, 'seam', [30, 12, -5], [-1, 0, 0], [0, 5 / sl, 17 / sl], 60, sl, 4, 4, dark, 0);
    b.quad([-30, 12, 12], [30, 12, 12], [30, 17, 12], [-30, 17, 12], dark);
    b.triangle([-30, 12, -5], [-30, 12, 12], [-30, 17, 12], dark);
    b.triangle([30, 12, 12], [30, 12, -5], [30, 17, 12], dark);
    b.box(0, 17.8, -5.3, 23.5, 1.9, 0.25, white);
    for (let x = -20; x <= 20; x += 10) b.box(x, 13.95, -5.3, 0.15, 1.95, 0.15, steel);
    tq(b, 'air_sign', [22, 16.1, -5.6], [-22, 16.1, -5.6], [-22, 19.5, -5.6], [22, 19.5, -5.6], C('#ffffff'), 0);
    wall(b, 'air_glass', 25, -17, -25, -17, 0, 9, 4, 4.5, W, MAT.WINDOWS);
    wall(b, 'air_glass', -25, -17, -25, -5, 0, 9, 4, 4.5, W, MAT.WINDOWS);
    wall(b, 'air_glass', 25, -5, 25, -17, 0, 9, 4, 4.5, W, MAT.WINDOWS);
    const VZ = -11, VY = 9, VR = 6, N = 10, arc = i => { const a = Math.PI * i / N; return [VZ - Math.cos(a) * VR, VY + Math.sin(a) * VR]; };
    for (let i = 0; i < N; i++) {
      const [z0, y0] = arc(i), [z1, y1] = arc(i + 1), l = Math.hypot(z1 - z0, y1 - y0);
      tiled(b, 'air_glass', [25, y0, z0], [-1, 0, 0], [0, (y1 - y0) / l, (z1 - z0) / l], 50, l, 5, l, W, MAT.WINDOWS);
      for (const x of [-25.05, 25.05]) b.triangle([x, VY, VZ], [x, y0, z0], [x, y1, z1], W, MAT.WINDOWS, [...GLASS, ...GLASS, ...GLASS]);
    }
    for (let r = 0; r <= 8; r++) {
      const x = -25 + r * 6.25;
      for (let i = 0; i < N; i++) { const [z0, y0] = arc(i), [z1, y1] = arc(i + 1); b.beam([x, y0 + 0.1, z0], [x, y1 + 0.1, z1], 0.16, steel); }
    }
    b.box(0, 5.5, -20, 58, 0.25, 3, white);
    for (const s of [-1, 1]) b.box(s * 41.5, 5.5, -11, 16.5, 0.25, 6, white);
    for (let x = -56; x <= 56; x += 8) b.cyl(x, 0, -22.3, 0.2, 5.25, 6, steel);
    lathe(b, 54, 14, [[2.6, 12], [2.6, 36], [3.4, 36.4]], 10, C('#e2e2de'), 0);
    lathe(b, 54, 14, [[3.6, 36.4], [4.7, 37.2], [4.9, 41.2], [4.1, 42]], 10, W, MAT.WINDOWS, 'air_glass', 0, true);
    lathe(b, 54, 14, [[4.3, 42], [4.3, 42.4], [0, 42.4]], 10, C('#b6babd'), 0);
    b.cyl(54, 42.4, 14, 0.12, 5, 4, C('#b6babd'));
    b.box(54, 47.5, 14, 0.2, 0.2, 0.2, C('#ff3020'), MAT.LAMP);
    return 48;
  };

  LM.dzintari = b => {
    const white = C('#f6f5f0'), grey = C('#8d9396'), brickR = C('#d27a5e'), W = WIN(0.5);
    walls4(b, 'dz_siding', -12, -13, 12, 17, 0, 9, 4, 9, W, MAT.WINDOWS);
    facade(b, 'dz_gable', 12, -13, -1, 0, 24, 9, 9).tri([0, 0], [24, 0], [12, 9], W, MAT.WINDOWS);
    facade(b, 'dz_gable', -12, 17, 1, 0, 24, 9, 9).tri([0, 0], [24, 0], [12, 9], W, MAT.WINDOWS);
    roofZ(b, 'seam', -12.7, 12.7, -13.7, 17.7, 8.7, 18.3, grey, 3);
    for (const x of [-4.5, -1.5, 1.5, 4.5]) lathe(b, x, -16.2, [[0.36, 0.45], [0.34, 6.9], [0.46, 7.05], [0.46, 7.25]], 8, white, 0);
    b.box(0, 7.6, -14.9, 5.7, 0.35, 1.95, white);
    facade(b, 'dz_ped', 5.7, -16.85, -1, 0, 11.4, 2.1, 7.95).tri([0, 0], [11.4, 0], [5.7, 2.1], WIN(1), 0);
    b.quad([-5.9, 7.9, -17], [-5.9, 7.9, -13], [0, 10.15, -13], [0, 10.15, -17], grey);
    b.quad([5.9, 7.9, -13], [5.9, 7.9, -17], [0, 10.15, -17], [0, 10.15, -13], grey);
    tbox(b, 'brick', -6.4, 0, -17, 6.4, 0.45, -12.9, 4, brickR, 0);
    walls4(b, 'dz_lattice', -26, -9, -12, 11, 0, 7, 4, 7, W, MAT.WINDOWS);
    roofX(b, 'seam', -26.5, -12, -9.5, 11.5, 6.8, 11.2, grey, 3);
    b.triangle([-26, 7, -9], [-26, 7, 11], [-26, 11, 1], white);
    walls4(b, 'dz_siding', 12, -5, 24, 11, 0, 6, 4, 6, W, MAT.WINDOWS);
    roofX(b, 'seam', 12, 24.5, -5.5, 11.5, 5.8, 9.6, grey, 3);
    b.triangle([24, 6, 11], [24, 6, -5], [24, 9.6, 3], white);
    for (const [x, k] of [[8.5, 1], [11, 0], [13.5, 2]]) {
      b.cyl(x, 0, -16.4, 0.07, 10, 5, C('#dcdcdc'));
      tq(b, 'flags', [x + 0.05, 8.6, -16.4], [x + 2.15, 8.6, -16.4], [x + 2.15, 9.9, -16.4], [x + 0.05, 9.9, -16.4], WIN(1), 0, k / 3, 0, (k + 1) / 3, 1);
    }
    return 18.5;
  };

  LM.turtle = b => {
    const skin = C('#8a6a3e'), skinD = C('#5e4426'), eye = C('#18120c');
    lathe(b, 0, 0, [[4.3, 0], [4.3, 0.12], [0, 0.12]], 16, C('#bdb7ab'), 0, 'stone', 0, true);
    const AX = 1.75, AZ = 2.15, AY = 1.3, Y0 = 0.62, SEG = 14, RG = 5;
    const sp = (i, j) => { const ph = i / RG * Math.PI / 2, th = j / SEG * TAU; return [AX * Math.cos(ph) * Math.cos(th), Y0 + AY * Math.sin(ph), AZ * Math.cos(ph) * Math.sin(th)]; };
    for (let i = 0; i < RG; i++) {
      for (let j = 0; j < SEG; j++) {
        const u0 = j / SEG, u1 = (j + 1) / SEG, v0 = 1 - (i + 1) / RG, v1 = 1 - i / RG;
        if (i === RG - 1) b.triangle(sp(i, j), sp(i, j + 1), [0, Y0 + AY, 0], WIN(1), 0, [...uvAt('turtle', u0, v1), ...uvAt('turtle', u1, v1), ...uvAt('turtle', (u0 + u1) / 2, v0)]);
        else tq(b, 'turtle', sp(i, j), sp(i, j + 1), sp(i + 1, j + 1), sp(i + 1, j), WIN(1), 0, u0, v0, u1, v1);
      }
    }
    const E = (t, k, y) => [AX * k * Math.cos(t), y, AZ * k * Math.sin(t)];
    for (let j = 0; j < SEG; j++) {
      const t0 = j / SEG * TAU, t1 = (j + 1) / SEG * TAU;
      b.quad(E(t0, 1.07, Y0 - 0.1), E(t1, 1.07, Y0 - 0.1), E(t1, 1.07, Y0 + 0.05), E(t0, 1.07, Y0 + 0.05), skinD);
      b.quad(E(t0, 1.07, Y0 + 0.05), E(t1, 1.07, Y0 + 0.05), E(t1, 0.99, Y0 + 0.08), E(t0, 0.99, Y0 + 0.08), skin);
      b.triangle([0, Y0 - 0.1, 0], E(t1, 1.07, Y0 - 0.1), E(t0, 1.07, Y0 - 0.1), skinD);
    }
    tube(b, [0, Y0 + 0.3, -AZ + 0.35], [0, 1.2, -AZ - 0.45], 0.42, 0.3, 8, WIN(1), 'turtle');
    tube(b, [0, 1.2, -AZ - 0.45], [0, 1.62, -AZ - 0.85], 0.3, 0.27, 8, WIN(1), 'turtle');
    ellipsoid(b, 0, 1.7, -AZ - 1.1, 0.36, 0.3, 0.5, WIN(1), 'turtle');
    for (const s of [-1, 1]) { ellipsoid(b, s * 0.27, 1.8, -AZ - 1.2, 0.1, 0.1, 0.12, eye); b.box(s * 0.12, 1.58, -AZ - 1.58, 0.05, 0.02, 0.02, eye); }
    for (const sx of [-1, 1]) {
      for (const [z0, z1] of [[-1.25, -1.95], [1.35, 2.0]]) {
        const fx = sx * 2.05, front = z1 < 0;
        tube(b, [sx * 1.3, Y0 + 0.2, z0], [sx * 1.75, 0.45, (z0 + z1) / 2], 0.34, 0.26, 6, WIN(1), 'turtle');
        tube(b, [sx * 1.75, 0.45, (z0 + z1) / 2], [fx, 0.16, z1], 0.26, 0.2, 6, WIN(1), 'turtle');
        b.box(fx, 0.12, z1 + (front ? -0.12 : 0.12), 0.3, 0.08, 0.3, skinD);
        for (const k of [-1, 0, 1]) b.box(fx + k * 0.15, 0.08, z1 + (front ? -0.45 : 0.45), 0.045, 0.05, 0.09, eye);
      }
    }
    tube(b, [0, Y0, AZ - 0.1], [0, 0.3, AZ + 0.6], 0.16, 0.03, 5, skin);
    return 3;
  };

  LM.castle = b => {
    const W = WIN(0.5), roofC = C('#d06850'), stoneC = C('#d9cfb8'), dark = C('#2e2620');
    const O = 25, D = 10, H = 14, I = O - D, T = O - 3;
    walls4(b, 'castle', -O, -O, O, O, 0, H, 4, 4.6, W, MAT.WINDOWS);
    wall(b, 'castle', -I, -I, I, -I, 0, H, 4, 4.6, W, MAT.WINDOWS);
    wall(b, 'castle', I, I, -I, I, 0, H, 4, 4.6, W, MAT.WINDOWS);
    wall(b, 'castle', -I, I, -I, -I, 0, H, 4, 4.6, W, MAT.WINDOWS);
    wall(b, 'castle', I, -I, I, I, 0, H, 4, 4.6, W, MAT.WINDOWS);
    roofX(b, 'tiles', -O - 0.4, O + 0.4, -O - 0.4, -I + 0.4, H - 0.2, H + 5.5, roofC);
    roofX(b, 'tiles', -O - 0.4, O + 0.4, I - 0.4, O + 0.4, H - 0.2, H + 5.5, roofC);
    roofZ(b, 'tiles', -O - 0.4, -I + 0.4, -I, I, H - 0.2, H + 5.5, roofC);
    roofZ(b, 'tiles', I - 0.4, O + 0.4, -I, I, H - 0.2, H + 5.5, roofC);
    for (const s of [-1, 1]) {
      b.triangle([s * (O + 0.4), H - 0.2, -O - 0.4], [s * (O + 0.4), H - 0.2, -I + 0.4], [s * (O + 0.4), H + 5.5, -O + D / 2], roofC);
      b.triangle([s * (O + 0.4), H - 0.2, I - 0.4], [s * (O + 0.4), H - 0.2, O + 0.4], [s * (O + 0.4), H + 5.5, O - D / 2], roofC);
    }
    lathe(b, -T, T, bands(7.2, 0, 22, 4.6), 16, W, MAT.WINDOWS, 'castle', 0, true, true);
    lathe(b, -T, T, [[7.6, 22], [7.6, 22.5], [7.8, 22.5], [0.1, 33], [0.05, 34]], 16, roofC, 0, 'tiles', 0, true);
    lathe(b, T, -T, bands(6.5, 0, 26, 4.6), 16, W, MAT.WINDOWS, 'castle', 0, true, true);
    lathe(b, T, -T, [[7, 26], [6.2, 28], [3.6, 31], [1.2, 34], [0.6, 36], [0.05, 44]], 16, roofC, 0, 'tiles', 0, true);
    b.cyl(T, 43, -T, 0.08, 5, 4, C('#dcdcdc'));
    tq(b, 'flags', [T + 0.05, 45.8, -T], [T + 2.6, 45.8, -T], [T + 2.6, 47.6, -T], [T + 0.05, 47.6, -T], WIN(1), 0, 0, 0, 1 / 3, 1);
    b.box(0, 3.8, -O - 0.3, 3.4, 3.8, 0.3, stoneC);
    b.box(0, 2.4, -O - 0.62, 1.7, 2.4, 0.03, dark);
    return 48;
  };

  LM.powder = b => {
    const brickT = C('#c27a60'), roofC = C('#8a5a48'), dark = C('#2a2420');
    lathe(b, 0, 0, [[6.8, 0], [6.8, 1.2], [6.5, 1.2]], 16, brickT, 0, 'brick', 0, true, true);
    lathe(b, 0, 0, bands(6.5, 1.2, 24.5, 3.9), 16, brickT, 0, 'brick', 0, true, true);
    for (let i = 0; i < 8; i++) {
      const t = i / 8 * TAU + 0.2, c = Math.cos(t), s = Math.sin(t);
      for (const y of [8, 15, 21]) b.quad([c * 6.53 + s * 0.2, y, s * 6.53 - c * 0.2], [c * 6.53 - s * 0.2, y, s * 6.53 + c * 0.2], [c * 6.53 - s * 0.2, y + 1.6, s * 6.53 + c * 0.2], [c * 6.53 + s * 0.2, y + 1.6, s * 6.53 - c * 0.2], dark);
    }
    lathe(b, 0, 0, [[7.0, 24.5], [7.0, 25], [6.8, 25], [0.4, 32.5], [0.05, 34]], 16, roofC, 0, 'tiles', 0, true);
    return 34;
  };

  LM.opera = b => {
    const W = WIN(0.5), creamF = C('#f4eedf'), roofC = C('#9aaaa2'), colC = C('#fbf8f0'), stoneC = C('#e6decc');
    walls4(b, 'opera', -28, -16, 28, 22, 0, 16, 8, 16, W, MAT.WINDOWS);
    tiled(b, 'seam', [-28, 16, 22], [1, 0, 0], [0, 0, -1], 56, 38, 4, 4, roofC, 0);
    tbox(b, 'stone', -14, 16, 4, 14, 25, 20, 4.5, creamF, 0);
    tbox(b, 'stone', -12.5, 0, -22, 12.5, 1.2, -16, 3, stoneC, 0);
    for (let i = 0; i < 6; i++) lathe(b, -10 + i * 4, -20.5, [[0.95, 1.2], [0.85, 1.5], [0.8, 12.2], [1.05, 12.6], [1.05, 13]], 10, colC, 0);
    b.box(0, 13.8, -19.2, 12.6, 0.8, 3.2, creamF);
    b.triangle([12.6, 14.6, -22.4], [-12.6, 14.6, -22.4], [0, 19, -22.4], creamF);
    b.quad([-12.9, 14.5, -22.6], [-12.9, 14.5, -16], [0, 19.1, -16], [0, 19.1, -22.6], roofC);
    b.quad([12.9, 14.5, -16], [12.9, 14.5, -22.6], [0, 19.1, -22.6], [0, 19.1, -16], roofC);
    return 26;
  };

  LM.station = b => {
    const W = WIN(0.85), conc = C('#d2cfc6'), dark = C('#5a5e62');
    walls4(b, 'station', -48, -12, 48, 17, 0, 11, 8, 12, W, MAT.WINDOWS);
    b.box(0, 11.3, 2.5, 48.4, 0.3, 14.9, conc);
    b.box(0, 5, -14.5, 46, 0.2, 2.6, conc);
    for (let x = -44; x <= 44; x += 8) b.cyl(x, 0, -16.6, 0.18, 4.8, 6, dark);
    tbox(b, 'stone', 41.6, 0, -16.4, 46.4, 40, -11.6, 4, conc, 0);
    for (const [nx, nz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) clockFace(b, 44 + nx * 2.46, 37.4, -14 + nz * 2.46, nx, nz, 1.6);
    b.box(44, 40.3, -14, 2.7, 0.3, 2.7, dark);
    return 41;
  };

  LM.market = b => {
    const T = F.MAP.TIRGUS, H = T.halls, M = T.meat, hw = H.hw, top = H.top, eave = H.eave, N = 12;
    const roofC = C('#bdb8a8'), flatC = C('#8e8a80'), W = WIN(0.5), plaster = C('#e4d6a8'), cap = C('#cfc196'), conc = C('#c9c4b6'), steel = C('#4a5258'), leaf = C('#3d5a48'), band = C('#2c4236');
    const prof = [];
    for (let i = 0; i <= N; i++) { const z = -hw + 2 * hw * i / N; prof.push([z, eave + (top - eave) * Math.sqrt(Math.max(0, 1 - (z / hw) ** 2))]); }
    const end = [[0, 0]].concat(prof.map(([z, y]) => [z + hw, y]), [[2 * hw, 0]]);
    const topAt = s => { const i = Math.min(N - 1, Math.floor(s / (2 * hw) * N)), a = end[i + 1], c = end[i + 2]; return a[1] + (c[1] - a[1]) * (s - a[0]) / (c[0] - a[0]); };
    const inner = (x, y) => { const dx = -x, dy = eave - y, l = Math.hypot(dx, dy) || 1; return [x + dx / l * 0.6, y + dy / l * 0.6]; };
    const [x0, x1] = H.u, len = x1 - x0, zs = H.v, [l0, l1] = H.link;
    const pylon = (x, z, hx, hz) => {
      b.box(x, 3.7, z, hx, 3.7, hz, plaster, 0, { top: cap });
      b.box(x, 7.85, z, hx * 0.72, 0.45, hz * 0.72, cap);
    };
    zs.forEach((cz, k) => {
      for (let i = 0; i < N; i++) {
        const [za, ya] = prof[i], [zb, yb] = prof[i + 1], l = Math.hypot(zb - za, yb - ya);
        tiled(b, 'seam', [x1, ya, cz + za], [-1, 0, 0], [0, (yb - ya) / l, (zb - za) / l], len, l, 8, l, roofC, 0);
      }
      walls4(b, 'air_glass', x0 + 3, cz - 1.3, x1 - 3, cz + 1.3, top - 0.5, top + 0.9, 4, 1.4, W, MAT.WINDOWS);
      tiled(b, 'seam', [x0 + 2.7, top + 0.9, cz + 1.6], [1, 0, 0], [0, 0, -1], len - 5.4, 3.2, 8, 3.2, roofC, 0);
      facade(b, 'mk_end', x0, cz - hw, 0, 1, 2 * hw, top).fan([hw, 0], end, W, MAT.WINDOWS);
      facade(b, 'mk_end', x1, cz + hw, 0, -1, 2 * hw, top).fan([hw, 0], end, W, MAT.WINDOWS);
      for (const [x, s] of [[x0, -1], [x1, 1]]) {
        for (const e of [-1, 1]) pylon(x + s * 0.3, cz + e * (hw - 1.3), 0.3, 1.3);
        b.box(x + s * 1.4, 3.5, cz, 1.4, 0.1, 3.4, conc);
        for (const e of [-1, 1]) b.cyl(x + s * 2.6, 0, cz + e * 3.1, 0.1, 3.4, 6, steel);
        const bx = x + s * 0.42;
        tq(b, 'mk_names', [bx, 3.72, cz + s * 4.4], [bx, 3.72, cz - s * 4.4], [bx, 4.27, cz - s * 4.4], [bx, 4.27, cz + s * 4.4], WIN(1), 0, 0, k / 5, 1, (k + 1) / 5);
      }
    });
    for (const s of [-1, 1]) {
      const zi = s < 0 ? zs[0] - hw : zs[zs.length - 1] + hw, zo = zi + s * H.wing;
      wall(b, 'mk_wing', s < 0 ? x1 : x0, zo, s < 0 ? x0 : x1, zo, 0, 5, 8, 5, W, MAT.WINDOWS);
      wall(b, 'mk_wing', x0, s < 0 ? zo : zi, x0, s < 0 ? zi : zo, 0, 5, 8, 5, W, MAT.WINDOWS);
      wall(b, 'mk_wing', x1, s < 0 ? zi : zo, x1, s < 0 ? zo : zi, 0, 5, 8, 5, W, MAT.WINDOWS);
      tiled(b, 'seam', [x0, 5, Math.max(zi, zo)], [1, 0, 0], [0, 0, -1], len, H.wing, 8, H.wing, flatC, 0);
    }
    for (let k = 0; k + 1 < zs.length; k++) {
      const za = zs[k] + hw, zb = zs[k + 1] - hw;
      wall(b, 'mk_wing', l0, za, l0, zb, 0, 5, 8, 5, W, MAT.WINDOWS);
      wall(b, 'mk_wing', l1, zb, l1, za, 0, 5, 8, 5, W, MAT.WINDOWS);
      tiled(b, 'seam', [l0, 5, zb], [1, 0, 0], [0, 0, -1], l1 - l0, zb - za, 8, zb - za, flatC, 0);
      wall(b, 'mk_wing', x0, za, l0, za, 0, eave, 8, 5, W, MAT.WINDOWS);
      wall(b, 'mk_wing', l0, zb, x0, zb, 0, eave, 8, 5, W, MAT.WINDOWS);
      wall(b, 'mk_wing', l1, za, x1, za, 0, eave, 8, 5, W, MAT.WINDOWS);
      wall(b, 'mk_wing', x1, zb, l1, zb, 0, eave, 8, 5, W, MAT.WINDOWS);
      for (const x of [l0 + 12, l1 - 12]) b.box(x, 5.5, (za + zb) / 2, 1.3, 0.5, 0.9, flatC);
    }
    const [mu0, mu1] = M.u, [mv0, mv1] = M.v, mc = (mu0 + mu1) / 2, mlen = mv1 - mv0, [d0, d1] = M.door;
    for (let i = 0; i < N; i++) {
      const [xa, ya] = prof[i], [xb, yb] = prof[i + 1], l = Math.hypot(xb - xa, yb - ya);
      tiled(b, 'seam', [mc + xa, ya, mv0], [0, 0, 1], [(xb - xa) / l, (yb - ya) / l, 0], mlen, l, 8, l, roofC, 0);
    }
    walls4(b, 'air_glass', mc - 1.3, mv0 + 3, mc + 1.3, mv1 - 3, top - 0.5, top + 0.9, 4, 1.4, W, MAT.WINDOWS);
    tiled(b, 'seam', [mc - 1.6, top + 0.9, mv1 - 2.7], [1, 0, 0], [0, 0, -1], 3.2, mlen - 5.4, 3.2, 8, roofC, 0);
    const cuts = [...new Set(prof.map(p => p[0] + hw).concat([hw - M.gate, hw + M.gate]))].sort((p, q) => p - q);
    const gable = f => {
      for (let i = 0; i + 1 < cuts.length; i++) {
        const sa = cuts[i], sb = cuts[i + 1], y0 = sa >= hw - M.gate - 1e-6 && sb <= hw + M.gate + 1e-6 ? M.portal : 0;
        f.tri([sa, y0], [sb, y0], [sb, topAt(sb)], W, MAT.WINDOWS);
        f.tri([sa, y0], [sb, topAt(sb)], [sa, topAt(sa)], W, MAT.WINDOWS);
      }
    };
    gable(facade(b, 'mk_end', mu1, mv0, -1, 0, 2 * hw, top));
    gable(facade(b, 'mk_end', mu0, mv1, 1, 0, 2 * hw, top));
    for (const [z, s] of [[mv0, -1], [mv1, 1]]) {
      for (const e of [-1, 1]) {
        pylon(mc + e * (hw - 1.3), z + s * 0.3, 1.3, 0.3);
        b.box(mc + e * (M.gate + 0.2), M.portal / 2, z + s * 0.12, 0.2, M.portal / 2, 0.34, conc);
        b.box(mc + e * (M.gate + 2.55), 3.05, z + s * 0.2, 2.15, 2.95, 0.07, leaf);
        for (const y of [1.2, 3.05, 4.9]) b.box(mc + e * (M.gate + 2.55), y, z + s * 0.29, 2.15, 0.1, 0.03, band);
      }
      b.box(mc, M.portal + 0.22, z + s * 0.12, M.gate + 0.4, 0.22, 0.34, conc);
      const bz = z + s * 0.5;
      tq(b, 'mk_names', [mc - s * 4.8, 6.75, bz], [mc + s * 4.8, 6.75, bz], [mc + s * 4.8, 7.35, bz], [mc - s * 4.8, 7.35, bz], WIN(1), 0, 0, 4 / 5, 1, 1);
    }
    for (const [za, zb] of [[mv0, d0], [d1, mv1]]) {
      wall(b, 'mk_wing', mu0, za, mu0, zb, 0, eave, 8, 5, W, MAT.WINDOWS);
      wall(b, 'mk_wing', mu1, zb, mu1, za, 0, eave, 8, 5, W, MAT.WINDOWS);
    }
    for (const u of [mu0, mu1]) {
      b.box(u, eave - 0.18, (d0 + d1) / 2, 0.32, 0.18, (d1 - d0) / 2 + 0.3, conc);
      for (const z of [d0, d1]) b.box(u, (eave - 0.36) / 2, z, 0.32, (eave - 0.36) / 2, 0.22, conc);
    }
    for (let z = mv0 + 6; z < mv1 - 1; z += 6) {
      for (let i = 0; i < N; i++) {
        const [xa, ya] = prof[i], [xb, yb] = prof[i + 1], ia = inner(xa, ya), ib = inner(xb, yb);
        b.quad([mc + xa, ya, z], [mc + xb, yb, z], [mc + ib[0], ib[1], z], [mc + ia[0], ia[1], z], steel);
      }
    }
    b.cyl(mc, top + 0.9, mv0 + 1.2, 0.07, 5, 5, C('#dcdcdc'));
    tq(b, 'flags', [mc + 0.06, top + 4.2, mv0 + 1.2], [mc + 2.5, top + 4.2, mv0 + 1.2], [mc + 2.5, top + 5.7, mv0 + 1.2], [mc + 0.06, top + 5.7, mv0 + 1.2], WIN(1), 0, 0, 0, 1 / 3, 1);
    return top + 6;
  };

  LM.academy = b => {
    const W = WIN(0.6), sand = C('#efe4c8'), orn = C('#d6c49a');
    const T = [[22, 20, 0, 22], [15, 13, 22, 46], [10, 9, 46, 64], [6.5, 6, 64, 76], [4, 4, 76, 82]];
    T.forEach(([hx, hz, y0, y1], k) => {
      walls4(b, 'academy', -hx, -hz, hx, hz, y0, y1, 4, 8, W, MAT.WINDOWS);
      b.box(0, y1 + 0.3, 0, hx + 0.4, 0.3, hz + 0.4, sand);
      if (k > 2) return;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          b.box(sx * (hx - 0.6), y1 + 1.8, sz * (hz - 0.6), 0.5, 1.2, 0.5, orn);
          b.cone(sx * (hx - 0.6), y1 + 3.0, sz * (hz - 0.6), 0.6, 2.4, 4, orn);
        }
      }
    });
    lathe(b, 0, 0, [[3.4, 82.6], [0.25, 99], [0.05, 101]], 4, orn, 0, null, Math.PI / 4);
    return 101;
  };

  LM.latvija = b => {
    const W = WIN(0.7);
    walls4(b, 'station', -17, -11, 17, 11, 0, 7, 8, 12, W, MAT.WINDOWS);
    b.box(0, 7.2, 0, 17.2, 0.2, 11.2, C('#9a9e9e'));
    walls4(b, 'latvija', -15, -9, 15, 9, 7.4, 86, 4, 6.5, W, MAT.WINDOWS);
    b.box(0, 86.3, 0, 15.3, 0.3, 9.3, C('#8e9292'));
    b.box(0, 88.6, 0, 7, 2, 4, C('#6e7274'));
    b.box(0, 88.6, -4.05, 5.5, 1.2, 0.05, C('#1f4ea0'));
    return 91;
  };

  LM.nativity = b => {
    const W = WIN(0.35), gold = C('#f0c24a'), wallC = C('#f6e2bc'), roofC = C('#7e9a8c');
    walls4(b, 'nativity', -13, -13, 13, 13, 0, 16, 4, 8, W, MAT.WINDOWS);
    tiled(b, 'seam', [-13.3, 16, 13.3], [1, 0, 0], [0, 0, -1], 26.6, 26.6, 4, 4, roofC, 0);
    walls4(b, 'nativity', -4.5, -20, 4.5, -13, 0, 28, 4.5, 8, W, MAT.WINDOWS);
    b.box(0, 28.2, -16.5, 4.8, 0.2, 3.8, wallC);
    lathe(b, 0, -16.5, [[3.2, 28.4], [3.2, 31]], 8, W, MAT.WINDOWS, 'nativity', Math.PI / 8, true, true);
    lathe(b, 0, -16.5, [[3.4, 31], [3.3, 32.2], [2.4, 33.6], [0.8, 34.6], [0.05, 35]], 8, gold, MAT.TRIM);
    cross(b, 0, 35, -16.5, 1.6, gold);
    lathe(b, 0, 0, [[6.2, 16], [6.2, 23]], 12, W, MAT.WINDOWS, 'nativity', 0, true, true);
    lathe(b, 0, 0, [[6.6, 23], [6.5, 24.8], [5.4, 27.4], [3.3, 29.4], [1.1, 30.5], [0.6, 30.8], [0.6, 31.8], [0.05, 32.2]], 12, gold, MAT.TRIM);
    cross(b, 0, 32.2, 0, 2.2, gold);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        lathe(b, sx * 8.5, sz * 8.5, [[2.3, 16], [2.3, 20]], 8, W, MAT.WINDOWS, 'nativity', Math.PI / 8, true, true);
        lathe(b, sx * 8.5, sz * 8.5, [[2.5, 20], [2.4, 21.2], [1.4, 22.6], [0.3, 23.2], [0.05, 23.4]], 8, gold, MAT.TRIM);
        cross(b, sx * 8.5, 23.4, sz * 8.5, 1.1, gold);
      }
    }
    lathe(b, 0, 13, bands(6, 0, 14, 7), 12, W, MAT.WINDOWS, 'nativity', 0, true, true);
    lathe(b, 0, 13, [[6.3, 14], [5.2, 16.5], [2.8, 18.2], [0.05, 18.8]], 12, roofC, 0, 'seam', 0, true);
    return 36;
  };

  LM.stjohn = b => {
    const W = WIN(0.3), roofC = C('#b8664e'), brick = C('#9e4d37'), brickD = C('#8a4231'), cop = C('#7fb49a'), gold = C('#ecc04a');
    wall(b, 'dom_aisle', -8, -22, -8, 23, 0, 14, 6.43, 14, W, MAT.WINDOWS);
    wall(b, 'dom_aisle', 8, 23, 8, -22, 0, 14, 6.43, 14, W, MAT.WINDOWS);
    wall(b, 'dom_aisle', 8, -22, -8, -22, 0, 14, 5.33, 14, W, MAT.WINDOWS);
    wall(b, 'dom_aisle', -8, 23, 8, 23, 0, 14, 5.33, 14, W, MAT.WINDOWS);
    roofZ(b, 'tiles', -8.6, 8.6, -21.4, 23.4, 13.8, 29, roofC);
    stepGable(b, facade(b, 'dom_gable', 8, -22, -1, 0, 16, 17, 14), 16, 17, 7, W, MAT.WINDOWS, brick, brickD, 0.9);
    b.triangle([-8, 14, 23], [8, 14, 23], [0, 29, 23], brick);
    lathe(b, 0, -12, [[1.7, 26.6], [1.7, 30.4], [1.9, 30.4], [1.9, 30.8], [1.2, 31.6], [0.05, 50]], 8, cop, 0, 'copper', Math.PI / 8);
    b.cyl(0, 49.4, -12, 0.3, 0.5, 6, gold, MAT.TRIM);
    rooster(b, 0, 49.9, -12, 1.2, gold);
    return 51;
  };

  LM.stjacob = b => {
    const W = WIN(0.3), roofC = C('#a45a48'), brick = C('#9e4d37'), cop = C('#78b096'), gold = C('#ecc04a'), stone = C('#d8ccb8');
    wall(b, 'dom_aisle', -9, -11, -9, 21, 0, 16, 6.4, 16, W, MAT.WINDOWS);
    wall(b, 'dom_aisle', 9, 21, 9, -11, 0, 16, 6.4, 16, W, MAT.WINDOWS);
    wall(b, 'dom_aisle', -9, 21, 9, 21, 0, 16, 6, 16, W, MAT.WINDOWS);
    roofZ(b, 'tiles', -9.6, 9.6, -11, 21.4, 15.8, 31, roofC);
    b.triangle([-9, 16, 21], [9, 16, 21], [0, 31, 21], brick);
    walls4(b, 'dom_tower', -5, -21, 5, -11, 0, 40, 10, 48, W, MAT.WINDOWS);
    b.box(0, 40.2, -16, 5.3, 0.2, 5.3, stone);
    lathe(b, 0, -16, [[5.6, 40.4], [5.2, 40.8], [0.04, 71]], 8, cop, 0, 'copper', Math.PI / 8);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) lathe(b, sx * 4.6, -16 + sz * 4.6, [[0.7, 40.4], [0.7, 42], [0.04, 46]], 6, cop, 0);
    b.cyl(0, 70.4, -16, 0.3, 0.5, 6, gold, MAT.TRIM);
    rooster(b, 0, 70.9, -16, 1.3, gold);
    return 73;
  };

  LM.riflemen = b => {
    const gr = C('#c47a6a'), grD = C('#9a5448');
    tbox(b, 'granite', -3.4, 0, -2.6, 3.4, 0.8, 2.6, 3.4, gr, 0);
    for (let k = 0; k < 3; k++) {
      const t = -Math.PI / 2 + k * TAU / 3;
      lathe(b, Math.cos(t) * 0.75, Math.sin(t) * 0.75, [[0.8, 0.8], [0.74, 2.5], [0.62, 4.6], [0.66, 5.4], [0.3, 5.7], [0.22, 5.75], [0.28, 6.1], [0.3, 6.4], [0.33, 6.45], [0.05, 6.62]], 8, grD, 0, 'granite', 0, true);
    }
    return 7;
  };

  LM.occupation = b => {
    tbox(b, 'granite', -14, 0, -7.5, 14, 1.2, 7.5, 4, C('#b0a09a'), 0);
    walls4(b, 'seam', -13.5, -7, 13.5, 7, 1.2, 8.8, 2.5, 7.6, C('#4a3a32'), 0);
    b.box(0, 8.95, 0, 13.7, 0.15, 7.2, C('#3a2e28'));
    wall(b, 'air_glass', 5, -7.05, -5, -7.05, 1.2, 3.8, 4, 2.6, WIN(0.3), MAT.WINDOWS);
    return 9;
  };

  LM.majori = b => {
    const W = WIN(0.6), wallC = C('#f3e6c4'), roofC = C('#a86a54'), conc = C('#bcb8b0'), steel = C('#6a6e72');
    walls4(b, 'castle', -9, -7, 9, 1, 0, 4.6, 3.6, 4.6, W, MAT.WINDOWS);
    roofX(b, 'tiles', -9.5, 9.5, -7.5, 1.5, 4.4, 7.6, roofC);
    for (const x of [-9, 9]) b.triangle([x, 4.6, -7], [x, 4.6, 1], [x, 7.4, -3], wallC);
    tq(b, 'majori', [3, 3.65, -7.06], [-3, 3.65, -7.06], [-3, 4.4, -7.06], [3, 4.4, -7.06], WIN(1), 0);
    tbox(b, 'stone', -20, 0, 2.5, 20, 0.9, 7.5, 4, conc, 0);
    for (let x = -12; x <= 12; x += 6) b.cyl(x, 0.9, 5, 0.12, 2.6, 6, steel);
    b.box(0, 3.6, 5, 13, 0.12, 2.6, C('#d8dcdc'));
    for (const x of [-15, -6, 6, 15]) b.box(x, 1.3, 4.2, 0.9, 0.05, 0.25, C('#8a5a30'));
    return 8;
  };

  LM.laima = b => {
    const dk = C('#4e4c48'), lt = C('#e2ddd0'), st = C('#bdb6a8');
    b.box(0, 0.15, 0, 0.75, 0.15, 0.75, st);
    b.box(0, 0.9, 0, 0.42, 0.6, 0.42, dk);
    b.box(0, 2.35, 0, 0.36, 0.85, 0.36, lt);
    const H0 = 3.2, H1 = 4.5, R = 0.62;
    b.box(0, H0 - 0.05, 0, R + 0.04, 0.05, R + 0.04, st);
    for (const [nx, nz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const rx = nz, rz = -nx;
      tq(b, 'laima', [nx * R - rx * R, H0, nz * R - rz * R], [nx * R + rx * R, H0, nz * R + rz * R], [nx * R + rx * R, H1, nz * R + rz * R], [nx * R - rx * R, H1, nz * R - rz * R], WIN(1), 0);
    }
    b.box(0, H1 + 0.08, 0, R + 0.08, 0.08, R + 0.08, st);
    lathe(b, 0, 0, [[0.85, H1 + 0.16], [0.05, H1 + 0.8]], 4, dk, 0, null, Math.PI / 4);
    return 5.5;
  };

  LM.lucav = b => {
    const gr = C('#ffffff'), grS = C('#d9c8c0'), grD = C('#9a5a4c'), grey = C('#c6c2ba'), gold = C('#f0c040'), iron = C('#2c2a28');
    tbox(b, 'stone', -2.7, 0, -2.7, 2.7, 0.25, 2.7, 2.7, grey, 0);
    tbox(b, 'granite', -2.1, 0.25, -2.1, 2.1, 0.55, 2.1, 2.1, grS, 0);
    tbox(b, 'granite', -1.7, 0.55, -1.7, 1.7, 0.85, 1.7, 1.7, gr, 0);
    tbox(b, 'granite', -1.25, 0.85, -1.25, 1.25, 1.75, 1.25, 1.25, gr, 0);
    tbox(b, 'granite', -1.36, 1.75, -1.36, 1.36, 1.91, 1.36, 1.36, grS, 0);
    walls4(b, 'granite', -0.95, -0.95, 0.95, 0.95, 1.91, 3.9, 1.9, 2, gr, 0);
    tbox(b, 'granite', -1.1, 3.9, -1.1, 1.1, 4.06, 1.1, 1.1, grS, 0);
    const gu = (u, v) => uvAt('granite', u, v);
    for (let k = 0; k < 4; k++) {
      const c = Math.round(Math.cos(k * TAU / 4)), s = Math.round(Math.sin(k * TAU / 4));
      const at = (r, o, y) => [c * o + s * r, y, s * o - c * r];
      tq(b, 'lucav_plq', at(-0.62, 0.965, 2.02), at(0.62, 0.965, 2.02), at(0.62, 0.965, 3.78), at(-0.62, 0.965, 3.78), gr, 0);
      b.triangle(at(-0.98, 1, 4.06), at(0.98, 1, 4.06), at(0, 1, 4.78), gr, 0, [...gu(0, 1), ...gu(1, 1), ...gu(0.5, 0.3)]);
      b.quad(at(-0.98, 1, 4.06), at(0, 1, 4.78), at(0, 0.2, 4.78), at(-0.98, 0.2, 4.06), grS, 0, [...gu(0, 1), ...gu(0, 0), ...gu(0.7, 0), ...gu(0.7, 1)]);
      b.quad(at(0.98, 1, 4.06), at(0.98, 0.2, 4.06), at(0, 0.2, 4.78), at(0, 1, 4.78), grS, 0, [...gu(0, 1), ...gu(0.7, 1), ...gu(0.7, 0), ...gu(0, 0)]);
      b.triangle(at(-0.84, 0.84, 4.06), at(0.84, 0.84, 4.06), [0, 6.05, 0], gr, 0, [...gu(0, 1), ...gu(1, 1), ...gu(0.5, 0)]);
    }
    b.box(0, 6.1, 0, 0.09, 0.07, 0.09, grD);
    cross(b, 0, 6.15, 0, 0.85, gold);
    const posts = [[-3.9, -3.9], [0, -3.9], [3.9, -3.9], [3.9, 0], [3.9, 3.9], [0, 3.9], [-3.9, 3.9], [-3.9, 0]];
    posts.forEach(([x, z], i) => {
      b.box(x, 0.36, z, 0.1, 0.36, 0.1, grD);
      b.box(x, 0.77, z, 0.13, 0.05, 0.13, grD);
      const [nx, nz] = posts[(i + 1) % posts.length], mx = (x + nx) / 2, mz = (z + nz) / 2;
      b.beam([x, 0.64, z], [mx, 0.42, mz], 0.035, iron);
      b.beam([mx, 0.42, mz], [nx, 0.64, nz], 0.035, iron);
    });
    return 7;
  };

  LM.bisumuiza = b => {
    const W = WIN(0.3), white = C('#f6f2e4'), plinth = C('#b4b0a4'), step = C('#c6c2b6'), green = C('#5c8666'), door = C('#5a3c26');
    const E = 6, R = 9.2, M = 8, T = 10.6, EX = 15.6, EZ = 7.6, RX = 8;
    const su = (u, v) => uvAt('seam', u, v);
    const slope = (p, q, r) => {
      const up = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]) > 0;
      b.triangle(p, up ? q : r, up ? r : q, green, 0, [...su(0, 1), ...su(up ? 1 : 0.5, up ? 1 : 0), ...su(up ? 0.5 : 1, up ? 0 : 1)]);
    };
    tbox(b, 'stone', -15, 0, -7, 15, 1.4, 7, 3, plinth, 0);
    wall(b, 'bisu_wall', 15, -7, -15, -7, 1.4, 5.8, 7.5, 4.4, W, MAT.WINDOWS);
    wall(b, 'bisu_wall', -15, 7, 15, 7, 1.4, 5.8, 7.5, 4.4, W, MAT.WINDOWS);
    wall(b, 'bisu_wall', -15, -7, -15, 7, 1.4, 5.8, 7, 4.4, W, MAT.WINDOWS);
    wall(b, 'bisu_wall', 15, 7, 15, -7, 1.4, 5.8, 7, 4.4, W, MAT.WINDOWS);
    b.box(0, 5.9, 0, 15.35, 0.1, 7.35, white);
    roofX(b, 'seam', -RX, RX, -EZ, EZ, E, R, green);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) slope([sx * EX, E, sz * EZ], [sx * RX, E, sz * EZ], [sx * RX, R, 0]);
      slope([sx * EX, E, -EZ], [sx * EX, E, EZ], [sx * RX, R, 0]);
      for (const z of [-7, 0]) {
        const z0 = sx < 0 ? z : z + 7, z1 = sx < 0 ? z + 7 : z;
        tq(b, 'bisu_wall', [sx * 6.5, E, z0], [sx * 6.5, E, z1], [sx * 6.5, M, z1], [sx * 6.5, M, z0], W, MAT.WINDOWS, 0, 0.15, 1, 0.61);
      }
      for (const sz of [-1, 1]) b.box(sx * 10.5, 8.9, sz * 1.3, 0.45, 0.95, 0.45, white);
    }
    roofZ(b, 'seam', -6.9, 6.9, -10.9, 10.9, M, T, green);
    for (const s of [-1, 1]) {
      tbox(b, 'stone', -6.6, 0, s < 0 ? -10.6 : 7, 6.6, 1.4, s < 0 ? -7 : 10.6, 3, plinth, 0);
      for (let k = 0; k < 4; k++) { const h = 1.4 - (k + 1) * 0.28; b.box(0, h / 2, s * (10.825 + k * 0.45), 4.4, h / 2, 0.225, step); }
      for (const x of [-5.3, -1.8, 1.8, 5.3]) lathe(b, x, s * 9.9, [[0.56, 1.4], [0.56, 1.58], [0.45, 1.66], [0.38, 6.35], [0.5, 6.5], [0.58, 6.62], [0.58, 6.9]], 10, white, 0);
      b.box(0, 7.45, s * 8.85, 6.7, 0.55, 1.95, white, 0, { bottom: true });
      facade(b, 'bisu_ped', -s * 6.9, s * 10.82, s, 0, 13.8, 2.6, M).tri([0, 0], [13.8, 0], [6.9, 2.6], W, MAT.WINDOWS);
      b.box(0, 2.85, s * 7.03, 0.95, 1.45, 0.04, door);
      b.box(0, 4.42, s * 7.04, 1.15, 0.12, 0.05, white);
    }
    return 11;
  };

  LM.piens = b => {
    const D = F.MAP.BIS.dairy, [hx0, hz0, hx1, hz1, hh] = D.hall, [bx0, bz0, bx1, bz1, bh] = D.boiler, [sx, sz, sr, sh] = D.stack, [tr, th] = D.silo;
    const W = WIN(0.45), conc = C('#c9c6bb'), roofC = C('#8e8a80'), brick = C('#b5644c'), steel = C('#d4d8dc'), dark = C('#4a5258'), white = C('#f2f2ee'), red = C('#c8302a');
    walls4(b, 'piens_wall', hx0, hz0, hx1, hz1, 0, hh, 8, 5.5, W, MAT.WINDOWS);
    b.box((hx0 + hx1) / 2, hh + 0.15, (hz0 + hz1) / 2, (hx1 - hx0) / 2 + 0.2, 0.15, (hz1 - hz0) / 2 + 0.2, roofC);
    for (const x of [-22, -6, 12, 26]) b.box(x, hh + 0.9, (hz0 + hz1) / 2 + 4, 2.2, 0.6, 2.2, conc);
    b.box(20, 4.5, hz0 - 1.9, 12, 0.12, 1.9, conc, 0, { bottom: true });
    b.box(20, 0.55, hz0 - 0.8, 12, 0.55, 0.8, conc);
    for (const x of [9, 17, 25, 31]) b.cyl(x, 0, hz0 - 3.5, 0.12, 4.4, 6, dark);
    wall(b, 'air_glass', -6, hz0 - 2.6, -14, hz0 - 2.6, 0, 3.3, 4, 3.3, WIN(0.6), MAT.WINDOWS);
    wall(b, 'air_glass', -14, hz0 - 2.6, -14, hz0, 0, 3.3, 2.6, 3.3, WIN(0.6), MAT.WINDOWS);
    wall(b, 'air_glass', -6, hz0, -6, hz0 - 2.6, 0, 3.3, 2.6, 3.3, WIN(0.6), MAT.WINDOWS);
    b.box(-10, 3.42, hz0 - 1.4, 4.3, 0.12, 1.6, white);
    for (const x of [-29, -21, -13]) b.beam([x, hh + 0.3, hz0 + 0.6], [x, hh + 3.9, hz0 + 0.6], 0.08, dark);
    tq(b, 'piens_sign', [-12, hh + 0.9, hz0 + 0.4], [-30, hh + 0.9, hz0 + 0.4], [-30, hh + 3.9, hz0 + 0.4], [-12, hh + 3.9, hz0 + 0.4], WIN(1), MAT.AD);
    b.quad([-30, hh + 0.9, hz0 + 0.5], [-12, hh + 0.9, hz0 + 0.5], [-12, hh + 3.9, hz0 + 0.5], [-30, hh + 3.9, hz0 + 0.5], conc);
    tbox(b, 'brick', bx0, 0, bz0, bx1, bh, bz1, 4, brick, 0);
    wall(b, 'air_glass', bx1 - 2, bz0 - 0.05, bx0 + 2, bz0 - 0.05, 5, 10.4, 3, 5.4, WIN(0.4), MAT.WINDOWS);
    const shaft = [];
    for (let k = 0; k <= 8; k++) shaft.push([sr * (1 - 0.26 * k / 8), bh + (44 - bh) * k / 8]);
    lathe(b, sx, sz, shaft, 12, brick, 0, 'brick', 0, true, true);
    [white, red, white, red].forEach((col, k) => lathe(b, sx, sz, [[sr * (0.74 - 0.03 * k), 44 + (sh - 44) * k / 4], [sr * (0.71 - 0.03 * k), 44 + (sh - 44) * (k + 1) / 4]], 12, col, 0));
    lathe(b, sx, sz, [[sr * 0.62, sh], [sr * 0.48, sh], [sr * 0.48, sh - 0.8]], 12, dark, 0);
    b.box(sx, sh + 0.35, sz, 0.22, 0.22, 0.22, C('#ff3020'), MAT.LAMP);
    for (const [u, v] of D.silos) {
      lathe(b, u, v, [[tr, 0], [tr, th - 1.6]], 12, steel, 0, 'seam', 0, true, true);
      lathe(b, u, v, [[tr + 0.08, th - 1.6], [0.5, th], [0.05, th]], 12, steel, 0);
      b.beam([u, th - 2.2, v - tr], [u, hh - 0.6, hz1], 0.12, dark);
    }
    return sh + 1;
  };

  LM.tram10 = b => {
    const W = WIN(1), cream = C('#f1eee2'), blue = C('#2a5aa8'), roofC = C('#c9ccd0'), dark = C('#1c1e20'), steel = C('#5a5e62');
    const Y0 = 0.33, YB = 1.35, Y1 = 3.05, HW = 1.25, Z = 6.2, N = 7, NW = 0.82;
    const side = (s, z0, z1, m0, m1) => tq(b, 'tram_side', [s * HW, Y0, z0], [s * HW, Y0, z1], [s * HW, Y1, z1], [s * HW, Y1, z0], W, MAT.WINDOWS, m0 / 12.4, 0, m1 / 12.4, 1);
    const panel = (p, q) => {
      b.quad([p[0], Y0, p[1]], [q[0], Y0, q[1]], [q[0], YB, q[1]], [p[0], YB, p[1]], blue);
      b.quad([p[0], YB, p[1]], [q[0], YB, q[1]], [q[0], Y1, q[1]], [p[0], Y1, p[1]], cream);
    };
    side(1, Z, -Z, 0, 12.4);
    side(-1, -Z, -5.4, 1.82, 1.98);
    for (const z of [-5.4, -1.8, 1.8]) side(-1, z, z + 3.6, 1.9, 5.5);
    side(-1, 5.4, Z, 1.82, 1.98);
    for (const e of [-1, 1]) {
      panel(e < 0 ? [HW, -Z] : [NW, N], e < 0 ? [NW, -N] : [HW, Z]);
      panel(e < 0 ? [-NW, -N] : [-HW, Z], e < 0 ? [-HW, -Z] : [-NW, N]);
      tq(b, 'tram_front', [-e * NW, Y0, e * N], [e * NW, Y0, e * N], [e * NW, Y1, e * N], [-e * NW, Y1, e * N], W, MAT.WINDOWS);
      b.quad([e * HW, Y1, e * Z], [-e * HW, Y1, e * Z], [-e * NW, Y1, e * N], [e * NW, Y1, e * N], roofC);
      b.box(0, 0.22, e * 4.1, 1, 0.22, 1.05, dark);
    }
    b.quad([-HW, Y1, Z], [HW, Y1, Z], [HW, Y1, -Z], [-HW, Y1, -Z], roofC);
    b.box(0, Y1 + 0.09, 0, 0.95, 0.09, 5.6, roofC);
    b.box(0, 0.45, 0, 1.1, 0.14, 6.6, dark);
    for (const x of [-0.46, 0.46]) b.box(x, 1.17, -N - 0.02, 0.1, 0.1, 0.02, C('#fff4d0'), MAT.LAMP);
    b.box(0, Y1 + 0.27, 1.2, 0.22, 0.09, 0.3, steel);
    b.beam([0, Y1 + 0.34, 1.2], [0, 5.42, 5.4], 0.035, steel);
    b.box(0, 5.45, 5.4, 0.05, 0.05, 0.12, dark);
    return 5.6;
  };

  F.Landmarks = { WHITE, uvAt, regions: A, size: S, BH, SW };
})(globalThis.Forza = globalThis.Forza || {});
