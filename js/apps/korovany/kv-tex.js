(function (K) {
  'use strict';
  const { hash2, fbm, clamp } = K;

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function fill(w, h, fn) {
    const c = canvas(w, h), x = c.getContext('2d'), img = x.createImageData(w, h), d = img.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const o = (j * w + i) * 4, v = fn(i, j);
      d[o] = clamp(v[0], 0, 255); d[o + 1] = clamp(v[1], 0, 255); d[o + 2] = clamp(v[2], 0, 255); d[o + 3] = v[3] == null ? 255 : clamp(v[3], 0, 255);
    }
    x.putImageData(img, 0, 0);
    return c;
  }
  const wrapN = (i, j, w, h, f, s) => {
    const u = i / w, v = j / h;
    const a = fbm(i / f, j / f, s, 3), b = fbm((i - w) / f, j / f, s, 3), c = fbm(i / f, (j - h) / f, s, 3), d = fbm((i - w) / f, (j - h) / f, s, 3);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };
  const rgb = (c, k) => [((c >> 16) & 255) * k, ((c >> 8) & 255) * k, (c & 255) * k];

  function planks(base, dark, n) {
    return fill(64, 64, (i, j) => {
      const row = Math.floor(j / (64 / n)), y = j % (64 / n);
      const off = hash2(row, 3, 9) * 64;
      const grain = wrapN((i + off) % 64, j * 4 % 64, 64, 64, 6, row + 3) * 0.35 + 0.75;
      const seam = y === 0 ? 0.55 : 1;
      const knot = Math.hypot(((i + off * 3) % 64) - 30, y - 4) < 2 && hash2(row, 7, 1) > 0.5 ? 0.7 : 1;
      const c = rgb(base, grain * seam * knot);
      const e = ((i + Math.floor(off)) % 64) === 0 ? 0.7 : 1;
      return [c[0] * e, c[1] * e, c[2] * e];
    });
  }
  function logs(base) {
    return fill(64, 64, (i, j) => {
      const y = j % 16, r = Math.abs(y - 8) / 8;
      const sh = 1 - r * r * 0.55;
      const grain = wrapN(i, j, 64, 64, 5, 31) * 0.3 + 0.8;
      const c = rgb(base, sh * grain * (y === 0 ? 0.5 : 1));
      return c;
    });
  }
  function stones(base, mortar, sz) {
    return fill(64, 64, (i, j) => {
      const row = Math.floor(j / sz), off = row % 2 ? sz : 0;
      const col = Math.floor((i + off) / (sz * 2));
      const lx = (i + off) % (sz * 2), ly = j % sz;
      const edge = lx < 1 || ly < 1;
      const tone = 0.78 + hash2(col, row, 5) * 0.3;
      const n = wrapN(i, j, 64, 64, 4, 8) * 0.25 + 0.85;
      return edge ? rgb(mortar, n) : rgb(base, tone * n);
    });
  }
  function noiseTex(base, var1, f, seed, alpha) {
    return fill(64, 64, (i, j) => { const n = wrapN(i, j, 64, 64, f, seed); const c = rgb(base, 1 - var1 + n * var1 * 2); return alpha ? [c[0], c[1], c[2], alpha(i, j, n)] : c; });
  }
  function thatch() {
    return fill(64, 64, (i, j) => {
      const s = hash2(i, Math.floor(j / 3), 4);
      const n = wrapN(i, j, 64, 64, 3, 12);
      const k = 0.65 + s * 0.3 + n * 0.25, row = j % 12 === 0 ? 0.7 : 1;
      return [190 * k * row, 160 * k * row, 90 * k * row];
    });
  }
  function shingles(base) {
    return fill(64, 64, (i, j) => {
      const row = Math.floor(j / 8), off = row % 2 ? 4 : 0, x = (i + off) % 8, y = j % 8;
      const t = 0.8 + hash2(Math.floor((i + off) / 8), row, 2) * 0.3;
      const edge = y === 7 || x === 0 ? 0.6 : 1 - y / 30;
      return rgb(base, t * edge);
    });
  }
  function leaves(base, kind) {
    return fill(64, 64, (i, j) => {
      let a = 0, k = 1;
      if (kind === 'needles') {
        const n = hash2(i, j, 3), s = Math.sin(i * 0.9 + j * 0.3) * 0.5 + 0.5;
        a = n > 0.42 || s > 0.8 ? 255 : 0; k = 0.7 + n * 0.4;
      } else {
        const cx = Math.floor(i / 8), cy = Math.floor(j / 8), lx = i % 8 - 4, ly = j % 8 - 4;
        const h = hash2(cx, cy, 11), rr = 3.6 + h * 1.8;
        a = (lx * lx * 0.8 + ly * ly) < rr * rr && hash2(cx, cy, 2) > 0.12 ? 255 : 0;
        const sx = (i + 3) % 8 - 4, sy = (j + 5) % 8 - 4;
        if (!a && (sx * sx + sy * sy) < 9 && hash2(cx + 9, cy, 5) > 0.3) a = 255;
        k = 0.65 + h * 0.5 - (ly > 0 ? 0.1 : 0);
      }
      const c = rgb(base, k);
      return [c[0], c[1], c[2], a];
    });
  }
  function birch() {
    return fill(64, 64, (i, j) => {
      const n = wrapN(i, j, 64, 64, 6, 21);
      const mark = hash2(Math.floor(i / 6), Math.floor(j / 3), 5) > 0.86;
      return mark ? [40, 40, 36] : [222 * (0.85 + n * 0.2), 222 * (0.85 + n * 0.2), 210 * (0.85 + n * 0.2)];
    });
  }
  function bark(base) {
    return fill(64, 64, (i, j) => {
      const n = wrapN(i * 3 % 64, j, 64, 64, 4, 17), v = Math.abs(Math.sin(i * 0.6 + n * 6));
      return rgb(base, 0.55 + v * 0.35 + n * 0.2);
    });
  }
  function cloth(base) {
    return fill(64, 64, (i, j) => { const w = ((i + j) % 2) ? 0.92 : 1; const n = wrapN(i, j, 64, 64, 8, 41) * 0.2 + 0.9; return rgb(base, w * n); });
  }
  function chronicle() {
    const c = canvas(64, 128), x = c.getContext('2d');
    x.fillStyle = '#8a8478'; x.fillRect(0, 0, 64, 128);
    for (let k = 0; k < 400; k++) { x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '40,40,36' : '200,200,190') + ',0.15)'; x.fillRect(Math.random() * 64, Math.random() * 128, 2, 2); }
    x.fillStyle = 'rgba(30,28,24,0.75)';
    for (let r = 0; r < 18; r++) { const y = 12 + r * 6, w = 30 + (r * 37 % 20); x.fillRect(8, y, w, 1.5); x.fillRect(8 + w + 3, y, 10, 1.5); }
    x.strokeStyle = 'rgba(220,210,190,0.9)'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(6, 72); x.lineTo(58, 76); x.stroke();
    x.beginPath(); x.moveTo(8, 74); x.lineTo(57, 72); x.stroke();
    return c;
  }
  function mapTex() {
    const c = canvas(64, 64), x = c.getContext('2d');
    x.fillStyle = '#d8c89a'; x.fillRect(0, 0, 64, 64);
    x.fillStyle = '#4a7a3a'; x.fillRect(0, 10, 22, 44);
    x.fillStyle = '#8a7a6a'; x.fillRect(44, 20, 20, 44);
    x.fillStyle = '#b02020'; x.fillRect(28, 4, 8, 6);
    x.strokeStyle = '#5a3a1a'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(32, 10); x.lineTo(32, 40); x.lineTo(54, 50); x.moveTo(32, 40); x.lineTo(12, 36); x.stroke();
    x.fillStyle = '#202020'; x.fillRect(52, 46, 6, 6);
    return c;
  }
  function boardTex() {
    const c = planks(0x6a4a2a, 0, 4), x = c.getContext('2d');
    for (let k = 0; k < 5; k++) { x.fillStyle = '#e8dcc0'; const px = 4 + (k % 3) * 20, py = 6 + Math.floor(k / 3) * 28; x.fillRect(px, py, 16, 22); x.fillStyle = '#403020'; for (let r = 0; r < 5; r++) x.fillRect(px + 2, py + 3 + r * 4, 12 - (r % 2) * 3, 1); }
    return c;
  }
  function targetTex() {
    return fill(64, 64, (i, j) => { const d = Math.hypot(i - 32, j - 32) / 32; if (d > 1) return [140, 110, 70]; const ring = Math.floor(d * 5); return ring % 2 ? [230, 220, 200] : (ring === 0 ? [200, 40, 30] : [40, 60, 120]); });
  }
  function gateTex() {
    const c = planks(0x5a3a1e, 0, 1), x = c.getContext('2d');
    x.save(); x.translate(64, 0); x.rotate(Math.PI / 2); x.drawImage(planks(0x5a3a1e, 0, 6), 0, 0); x.restore();
    x.fillStyle = '#2a2a2e'; x.fillRect(0, 10, 64, 5); x.fillRect(0, 48, 64, 5);
    x.fillStyle = '#6a6a70'; for (let k = 0; k < 8; k++) { x.fillRect(4 + k * 8, 11, 2, 2); x.fillRect(4 + k * 8, 49, 2, 2); }
    return c;
  }
  function chestTex() {
    const c = planks(0x7a5028, 0, 3), x = c.getContext('2d');
    x.fillStyle = '#3a3a40'; x.fillRect(0, 0, 64, 4); x.fillRect(0, 60, 64, 4); x.fillRect(0, 0, 4, 64); x.fillRect(60, 0, 4, 64);
    x.fillStyle = '#c8a040'; x.fillRect(28, 26, 8, 10);
    return c;
  }
  function carpet() { return fill(64, 64, (i, j) => { const b = i < 6 || i > 57 ? 1 : 0; const p = ((i >> 3) + (j >> 3)) % 2; return b ? [200, 160, 40] : p ? [150, 20, 24] : [130, 16, 20]; }); }
  function barrel() { return fill(64, 64, (i, j) => { const band = (j > 10 && j < 14) || (j > 50 && j < 54); const st = i % 8 === 0 ? 0.7 : 1; return band ? [60, 60, 64] : rgb(0x7a5230, st * (0.85 + hash2(i >> 3, 1, 3) * 0.2)); }); }
  function fence() { return planks(0x8a6a44, 0, 2); }
  function ground() {
    return fill(128, 128, (i, j) => {
      const n = wrapN(i, j, 128, 128, 10, 3) * 0.6 + wrapN(i, j, 128, 128, 3, 9) * 0.4;
      const sp = hash2(i, j, 7) > 0.93 ? 0.85 : 1;
      const v = (0.72 + n * 0.5) * sp * 255;
      return [v, v, v];
    });
  }
  function dirt() {
    return fill(64, 64, (i, j) => {
      const n = wrapN(i, j, 64, 64, 6, 13), r = Math.abs(i - 32) / 32;
      const rut = (Math.abs(i - 20) < 3 || Math.abs(i - 44) < 3) ? 0.86 : 1;
      const pebble = hash2(i, j, 31) > 0.95 ? 1.18 : 1;
      const k = (0.75 + n * 0.4) * rut * pebble;
      const a = r > 0.82 ? Math.max(0, (1 - (r - 0.82) / 0.18)) * 255 : 255;
      return [150 * k, 122 * k, 84 * k, a];
    });
  }
  function water() { return fill(64, 64, (i, j) => { const n = wrapN(i, j, 64, 64, 8, 51); const v = 0.8 + n * 0.4; return [50 * v, 90 * v, 120 * v, 255]; }); }
  function soft() { return fill(32, 32, (i, j) => { const d = Math.hypot(i - 15.5, j - 15.5) / 16; const a = clamp(1 - d, 0, 1); return [255, 255, 255, a * a * 255]; }); }
  function blood() { return fill(32, 32, (i, j) => { const d = Math.hypot(i - 15.5, j - 15.5) / 16, n = hash2(i >> 1, j >> 1, 3); const a = d < 0.55 + n * 0.45 ? 210 : 0; return [110 + n * 30, 8, 6, a]; }); }
  function cloud() { return fill(128, 128, (i, j) => { const n = wrapN(i, j, 128, 128, 22, 77) * 0.7 + wrapN(i, j, 128, 128, 8, 78) * 0.3; const a = clamp((n - 0.5) * 3, 0, 1); return [255, 255, 255, a * 255]; }); }
  function atlasBody() {
    const c = canvas(128, 128), x = c.getContext('2d');
    const cell = (k, fn) => { const t = fill(32, 32, fn); x.drawImage(t, (k % 4) * 32, Math.floor(k / 4) * 32); };
    cell(0, (i, j) => { const v = 235 + hash2(i, j, 1) * 20; return [v, v, v]; });
    cell(1, (i, j) => { const w = ((i + j) % 2) ? 222 : 248; const n = hash2(i >> 1, j >> 1, 4) * 15; return [w - n, w - n, w - n]; });
    cell(2, (i, j) => { const ring = ((i % 4) === 0 || ((j + (Math.floor(i / 4) % 2) * 2) % 4) === 0) ? 150 : 240; return [ring, ring, ring + 5]; });
    cell(3, (i, j) => { const v = 230 - (j % 10 === 0 ? 50 : 0) + hash2(i, j, 6) * 25; return [v, v, v]; });
    cell(4, (i, j) => { const g = 210 + Math.sin(i * 0.8 + hash2(1, j >> 2, 7) * 6) * 30; return [g, g, g]; });
    cell(5, (i, j) => { const v = 220 + hash2(i, j >> 2, 8) * 35 - (i % 5 === 0 ? 40 : 0); return [v, v, v]; });
    cell(6, (i, j) => { const v = 240 + hash2(i, j, 9) * 15; return [v, v, v]; });
    cell(7, (i, j) => { const v = (j > 12 && j < 20) ? 120 : 245; return [v, v, v]; });
    return c;
  }
  function signTex(text) {
    const c = canvas(128, 32), x = c.getContext('2d');
    x.drawImage(planks(0x6a4628, 0, 2), 0, 0, 128, 32);
    x.strokeStyle = '#2a1a0a'; x.lineWidth = 2; x.strokeRect(1, 1, 126, 30);
    x.fillStyle = '#f0e0b0'; x.font = 'bold 13px "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = 13; while (x.measureText(text).width > 118 && fs > 7) { fs--; x.font = 'bold ' + fs + 'px "Times New Roman", serif'; }
    x.fillText(text, 64, 17);
    return c;
  }

  function textures() {
    return {
      ground: ground(), dirt: dirt(), water: water(), particle: soft(), blood: blood(), cloud: cloud(), body: atlasBody(),
      plank: planks(0x9a7448, 0, 4), log: logs(0x8a6238), stone: stones(0x9a948a, 0x5a564e, 8), stone_light: stones(0xc8c0b0, 0x8a847a, 8), dark_stone: stones(0x5a5654, 0x2a2826, 8), rock: noiseTex(0x7a766e, 0.25, 5, 61),
      plaster: noiseTex(0xd8ccb0, 0.08, 6, 33), thatch: thatch(), shingle: shingles(0x6a4a32), roof_red: shingles(0xa03a28), roof_black: shingles(0x34302e), moss: shingles(0x4a6a32),
      cloth_red: cloth(0xb02828), cloth_green: cloth(0x3a7a34), cloth_blue: cloth(0x34548a), canvas: cloth(0xc8b890), canvas_green: cloth(0x5a6a3a), canvas_black: cloth(0x34302c),
      wood_dark: planks(0x4a3220, 0, 2), iron: noiseTex(0x6a6a70, 0.15, 3, 71), gold: noiseTex(0xd0a030, 0.15, 3, 72), throne_black: noiseTex(0x2a242a, 0.2, 3, 73),
      bark: bark(0x5a4228), barkdark: bark(0x3e2e20), birch: birch(), leaves: leaves(0x4a8a34, 'leaves'), leaves_dark: leaves(0x2e6a2a, 'leaves'), needles: leaves(0x2a5a30, 'needles'), leaves_big: leaves(0x3e7e30, 'leaves'), leaves_birch: leaves(0x7aa840, 'leaves'),
      straw: thatch(), chest: chestTex(), bed: cloth(0xd8d0b8), carpet: carpet(), chronicle: chronicle(), map: mapTex(), board: boardTex(), target: targetTex(), barrel: barrel(), fence: fence(), gate: gateTex()
    };
  }

  K.Tex = { textures, signTex, canvas, ALPHA: { leaves: 1, leaves_dark: 1, needles: 1, leaves_big: 1, leaves_birch: 1, particle: 1, blood: 1, cloud: 1, dirt: 1 } };
})(globalThis.Korovany = globalThis.Korovany || {});
