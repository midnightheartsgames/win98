(function (H) {
  'use strict';
  const TS = 32;
  const cache = new Map();

  function mkCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }

  function hash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function perspectiveFloor(g, tex, w, h, hz, fog) {
    const tw = tex.width, th = tex.height, src = tex.getContext('2d').getImageData(0, 0, tw, th).data;
    const y0 = Math.ceil(hz), img = g.getImageData(0, y0, w, h - y0), d = img.data;
    const F = 300, cam = 0.8, fr = parseInt(fog.slice(1, 3), 16), fg = parseInt(fog.slice(3, 5), 16), fb = parseInt(fog.slice(5, 7), 16);
    for (let y = y0; y < h; y++) {
      const dy = Math.max(0.5, y - hz), dist = cam * F / dy, v = Math.floor(dist * 16) % th;
      const f = Math.min(1, Math.max(0, (dist - 4) / 26)), shade = 1 - Math.min(0.25, (y - hz) / (h - hz) * 0.25);
      for (let x = 0; x < w; x++) {
        const wx = (x - w / 2) * dist / F, u = ((Math.floor(wx * 16) % tw) + tw) % tw;
        const si = (v * tw + u) * 4, di = ((y - y0) * w + x) * 4;
        d[di] = (src[si] * (1 - f) + fr * f) * shade; d[di + 1] = (src[si + 1] * (1 - f) + fg * f) * shade; d[di + 2] = (src[si + 2] * (1 - f) + fb * f) * shade; d[di + 3] = 255;
      }
    }
    g.putImageData(img, 0, y0);
  }

  function bgCanvas(id, w, h) {
    const key = 'bg|' + id + '|' + w + 'x' + h;
    let c = cache.get(key);
    if (c) return c;
    c = mkCanvas(w, h);
    const g = c.getContext('2d');
    const P = {
      station: ['#05070f', '#1a2238', '#2a3450', '#40c8ff'], station2: ['#07060a', '#221a28', '#3a3040', '#ffa040'],
      snow: ['#6a7a98', '#c8d8ea', '#e8f0f8', '#ffffff'], city: ['#4a5470', '#a8b4c8', '#c0c8d4', '#ffd060'],
      under: ['#100804', '#3a2414', '#5a3a24', '#ff9a40'], mine: ['#050404', '#201a1c', '#3a3034', '#80e0ff'],
      rivet: ['#40464e', '#8a929c', '#a0a8b0', '#ff7040'], ice: ['#0a1828', '#2a4a68', '#6a90b0', '#c0f4ff'],
      hill: ['#1a2440', '#5a6a90', '#b8c8dc', '#a0e0ff'], sim: ['#000814', '#082038', '#0a3050', '#40ffc0'],
      stellaron: ['#02040c', '#0a1a3a', '#1a3a5a', '#80ffff'], express: ['#140a08', '#3a2418', '#6a2a2a', '#ffd070'],
      memory: ['#02030e', '#121a44', '#1c2a5a', '#9ad8ff'], meadow: ['#4a90d8', '#c4e6f6', '#7ab84a', '#ffe890']
    }[id] || ['#000', '#223', '#445', '#8cf'];
    const hz = h * 0.55;
    const sky = g.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, P[0]); sky.addColorStop(1, P[1]);
    g.fillStyle = sky; g.fillRect(0, 0, w, hz);
    const fl = g.createLinearGradient(0, hz, 0, h);
    fl.addColorStop(0, P[1]); fl.addColorStop(1, P[2]);
    g.fillStyle = fl; g.fillRect(0, hz, w, h - hz);
    if (id === 'station' || id === 'station2' || id === 'sim' || id === 'stellaron' || id === 'memory') for (let i = 0; i < 120; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + hash(i, 2, 9) * 0.6) + ')'; g.fillRect(hash(i, 1, 3) * w, hash(3, i, 1) * hz * 0.9, 1, 1); }
    if (id === 'snow' || id === 'hill' || id === 'city' || id === 'rivet') {
      g.fillStyle = shade(P[1], -0.25);
      g.beginPath(); g.moveTo(0, hz);
      for (let x = 0; x <= w; x += 20) g.lineTo(x, hz - 30 - hash(x, 1, 7) * 70 * (id === 'city' ? 0.2 : 1));
      g.lineTo(w, hz); g.fill();
      if (id === 'city' || id === 'rivet') for (let i = 0; i < 16; i++) { const bx = i * w / 16, bh = 30 + hash(i, 4, 2) * 90; g.fillStyle = shade(P[1], -0.4 - hash(i, 5, 5) * 0.2); g.fillRect(bx, hz - bh, w / 16 - 4, bh); for (let j = 0; j < 4; j++) { g.fillStyle = id === 'rivet' ? '#303038' : '#ffe8a0'; g.fillRect(bx + 6 + (j % 2) * 14, hz - bh + 10 + Math.floor(j / 2) * 18, 6, 8); } }
    }
    if (id === 'meadow') {
      for (let i = 0; i < 7; i++) { const cx = hash(i, 31, 3) * w, cy = 12 + hash(i, 32, 4) * hz * 0.4, cw = 26 + hash(i, 33, 5) * 40; g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(cx, cy, cw, cw * 0.28, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(cx - cw * 0.3, cy - cw * 0.16, cw * 0.4, cw * 0.24, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#8ab4b0'; g.beginPath(); g.moveTo(0, hz);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, hz - 26 - Math.sin(x / 70) * 14 - Math.sin(x / 23 + 1) * 4);
      g.lineTo(w, hz); g.fill();
      const kx = w * 0.72, ky = hz - 24 - Math.sin(kx / 70) * 14 - Math.sin(kx / 23 + 1) * 4;
      g.fillStyle = '#6e8a96'; g.fillRect(kx - 14, ky - 10, 28, 12); g.fillRect(kx - 18, ky - 18, 7, 20); g.fillRect(kx + 11, ky - 16, 7, 18); g.fillRect(kx - 3, ky - 26, 8, 16);
      g.fillStyle = '#5e9a48'; g.beginPath(); g.moveTo(0, hz);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, hz - 10 - Math.sin(x / 45 + 2) * 7);
      g.lineTo(w, hz); g.fill();
    }
    if (id === 'under' || id === 'mine') for (let i = 0; i < 10; i++) { const px2 = hash(i, 7, 7) * w; g.fillStyle = shade(P[1], -0.3); g.fillRect(px2, 0, 14 + hash(i, 8, 8) * 20, hz); g.fillStyle = P[3] + '55'; g.fillRect(px2 + 4, hz * 0.3 + hash(i, 9, 9) * hz * 0.4, 6, 6); }
    if (id === 'stellaron' || id === 'sim' || id === 'memory') { const gr = g.createRadialGradient(w / 2, hz * 0.55, 4, w / 2, hz * 0.55, 180); gr.addColorStop(0, P[3] + 'aa'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    if (id === 'memory') for (let i = 0; i < 26; i++) {
      const x = hash(i, 21, 5) * w, y = hash(i, 22, 6) * hz * 0.9, r = 4 + hash(i, 23, 7) * 12, a = hash(i, 24, 8) * Math.PI;
      g.fillStyle = 'rgba(200,236,255,' + (0.12 + 0.3 * hash(i, 25, 9)).toFixed(2) + ')';
      g.beginPath(); g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a + 2.2) * r * 0.5, y + Math.sin(a + 2.2) * r * 0.5); g.lineTo(x + Math.cos(a + 3.4) * r, y + Math.sin(a + 3.4) * r); g.lineTo(x + Math.cos(a + 5) * r * 0.4, y + Math.sin(a + 5) * r * 0.4); g.closePath(); g.fill();
    }
    const tex = G.floorTexture && id !== 'sim' && id !== 'stellaron' && id !== 'memory' ? G.floorTexture(id) : null;
    if (tex) perspectiveFloor(g, tex, w, h, hz, P[1]);
    else {
      g.strokeStyle = P[3] + '40'; g.lineWidth = 1;
      for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(w / 2 + i * 12, hz); g.lineTo(w / 2 + i * 90, h); g.stroke(); }
      for (let i = 0; i < 8; i++) { const yy = hz + Math.pow(i / 8, 1.8) * (h - hz); g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); }
    }
    if (id === 'snow' || id === 'hill' || id === 'ice') for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(hash(i, 11, 3) * w, hash(11, i, 4) * h, 2, 2); }
    cache.set(key, c);
    return c;
  }

  function drawCG(ctx, id, w, h, t, game) {
    if (H.Cine && H.Cine.still(ctx, id, w, h, t, game)) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
  }

  const G = { TS, shade, hash, bgCanvas, drawCG, mkCanvas };
  Object.assign(H, { Gfx: G });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
