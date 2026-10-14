(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const LW = 320, LH = 240, BAR = 30;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const hx = G.hash;
  const cl = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = t => { t = cl(t); return t * t * (3 - 2 * t); };
  const eOut = t => 1 - Math.pow(1 - cl(t), 3);
  const eIn = t => Math.pow(cl(t), 2.2);
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const cache = new Map();

  function layer(key, w, h, fn) {
    let c = cache.get(key);
    if (!c) {
      c = G.mkCanvas(w, h);
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      fn(g, w, h);
      cache.set(key, c);
    }
    return c;
  }

  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + cl(a).toFixed(3) + ')';
  }
  function vgrad(g, y0, y1, stops, x, w) {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    g.fillStyle = gr;
    g.fillRect(x || 0, y0, w || LW, y1 - y0);
  }
  function hgrad(g, x0, x1, y0, y1, stops) {
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    g.fillStyle = gr;
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  function glow(g, x, y, r, hex, a) {
    if (r <= 0 || a <= 0) return;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgba(hex, a)); gr.addColorStop(0.45, rgba(hex, a * 0.45)); gr.addColorStop(1, rgba(hex, 0));
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function lighter(g, fn) { g.save(); g.globalCompositeOperation = 'lighter'; fn(); g.restore(); }
  function poly(g, col, pts) {
    g.fillStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath(); g.fill();
  }
  function rect(g, col, x, y, w, h) { g.fillStyle = col; g.fillRect(x, y, w, h); }
  function ell(g, col, x, y, rx, ry, rot) { if (rx <= 0 || ry <= 0) return; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); g.fill(); }
  function line(g, col, w, x0, y0, x1, y1) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function ring(g, col, w, x, y, r) { if (r <= 0) return; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); }
  function stars(g, t, n, seed, a, h, dx) {
    for (let i = 0; i < n; i++) {
      const tw = 0.6 + 0.4 * Math.sin(t * (1 + hx(i, seed, 4) * 3) + i);
      const x = ((hx(i, seed, 2) * LW - (dx || 0) * (0.4 + hx(i, seed, 6))) % LW + LW) % LW, y = hx(seed, i, 3) * (h || LH);
      g.fillStyle = rgba(hx(i, seed, 5) > 0.8 ? '#ffe8c0' : '#e8f0ff', a * tw * (0.35 + 0.65 * hx(i, seed, 1)));
      g.fillRect(Math.floor(x), Math.floor(y), hx(i, seed, 7) > 0.93 ? 2 : 1, 1);
    }
  }
  function snowfall(g, t, n, seed, o = {}) {
    const sp = o.speed || 30, wind = o.wind || 8, a = o.a || 0.9, h = o.h || LH;
    for (let i = 0; i < n; i++) {
      const k = 0.5 + hx(i, seed, 1);
      const x = ((hx(i, seed, 2) * LW + t * wind * k + Math.sin(t * 1.3 + i) * 3) % LW + LW) % LW;
      const y = ((hx(seed, i, 3) * h + t * sp * k) % h + h) % h;
      g.fillStyle = rgba('#ffffff', a * (0.4 + 0.6 * hx(i, seed, 4)));
      const s = k > 1.2 ? 2 : 1;
      if (o.streak) g.fillRect(Math.floor(x), Math.floor(y), 3 + s * 2, 1);
      else g.fillRect(Math.floor(x), Math.floor(y), s, s);
    }
  }
  function embers(g, t, n, seed, x0, x1, y0, col) {
    lighter(g, () => {
      for (let i = 0; i < n; i++) {
        const life = 1.4 + hx(i, seed, 1) * 1.8, ph = ((t + hx(i, seed, 2) * life) % life) / life;
        const x = lerp(x0, x1, hx(i, seed, 3)) + Math.sin(t * 2 + i) * 4, y = y0 - ph * (40 + hx(i, seed, 4) * 60);
        g.fillStyle = rgba(col || '#ff9a40', (1 - ph) * 0.9);
        g.fillRect(Math.floor(x), Math.floor(y), 1, 1);
      }
    });
  }
  function smoke(g, t, x, y, n, spread, col, a) {
    for (let i = 0; i < n; i++) {
      const ph = (t * 0.35 + hx(i, 3, 9)) % 1, r = 10 + ph * spread * (0.6 + hx(i, 4, 9));
      ell(g, rgba(col || '#8a8a94', (a || 0.5) * (1 - ph) * 0.8), x + (hx(i, 5, 9) - 0.5) * spread * 1.4 * ph, y - ph * spread * 0.6, r, r * 0.8);
    }
  }
  function sparks(g, t, x, y, n, seed, col, spread) {
    lighter(g, () => {
      for (let i = 0; i < n; i++) {
        const ph = ((t * 1.7 + hx(i, seed, 1)) % 1), a = hx(i, seed, 2) * Math.PI * 2, v = (spread || 30) * (0.4 + hx(i, seed, 3));
        const px = x + Math.cos(a) * v * ph, py = y + Math.sin(a) * v * ph + 30 * ph * ph;
        line(g, rgba(col || '#ffd070', 1 - ph), 1, px, py, px - Math.cos(a) * 3, py - Math.sin(a) * 3);
      }
    });
  }
  function speedLines(g, t, cx, cy, n, col, a, inner) {
    lighter(g, () => {
      for (let i = 0; i < n; i++) {
        const ang = hx(i, 7, 1) * Math.PI * 2, ph = (t * (1.5 + hx(i, 7, 2)) + hx(i, 7, 3)) % 1;
        const r0 = (inner || 20) + ph * 200, r1 = r0 + 12 + ph * 40;
        line(g, rgba(col || '#c8e8ff', (a || 0.7) * ph), 1, cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0, cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      }
    });
  }
  function hStreaks(g, t, n, seed, speed, col, a, y0, y1) {
    for (let i = 0; i < n; i++) {
      const y = lerp(y0 || 0, y1 || LH, hx(i, seed, 1)), len = 10 + hx(i, seed, 2) * 40;
      const x = ((hx(i, seed, 3) * (LW + 80) - t * speed * (0.6 + hx(i, seed, 4))) % (LW + 80) + LW + 80) % (LW + 80) - 40;
      line(g, rgba(col || '#c8d8ff', (a || 0.6) * (0.3 + 0.7 * hx(i, seed, 5))), 1, x, y, x + len, y);
    }
  }
  function glitch(g, t, x, y, w, h, a, seed) {
    for (let i = 0; i < 18; i++) {
      if (hx(i, Math.floor(t * 12), seed || 1) > a) continue;
      const bx = x + hx(i, 2, Math.floor(t * 12)) * w, by = y + hx(i, 3, Math.floor(t * 12)) * h;
      rect(g, ['#ff4aa8', '#4ae8ff', '#b07aff', '#ffffff'][i % 4], Math.floor(bx), Math.floor(by), 2 + Math.floor(hx(i, 4, 5) * 10), 1 + Math.floor(hx(i, 5, 5) * 4));
    }
  }
  function shards(g, t, x, y, n, seed, col, spread, hi) {
    for (let i = 0; i < n; i++) {
      const ph = cl(t), a = hx(i, seed, 1) * Math.PI * 2, v = (spread || 40) * (0.3 + hx(i, seed, 2)), s = 2 + hx(i, seed, 3) * 4;
      const px = x + Math.cos(a) * v * ph, py = y + Math.sin(a) * v * ph + 40 * ph * ph, r = t * 6 + i;
      poly(g, rgba(i % 3 ? col : (hi || '#ffffff'), 1 - ph * 0.8), [px + Math.cos(r) * s, py + Math.sin(r) * s, px + Math.cos(r + 2.3) * s * 0.6, py + Math.sin(r + 2.3) * s * 0.6, px + Math.cos(r + 4) * s * 0.8, py + Math.sin(r + 4) * s * 0.8]);
    }
  }
  function flash(g, hex, a) { if (a > 0) rect(g, rgba(hex, a), 0, 0, LW, LH); }
  function vignette(g, a, col) {
    const gr = g.createRadialGradient(LW / 2, LH / 2, LH * 0.3, LW / 2, LH / 2, LW * 0.72);
    gr.addColorStop(0, rgba(col || '#000000', 0)); gr.addColorStop(1, rgba(col || '#000000', a));
    g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
  }
  function hexShield(g, x, y, r, a, t, col) {
    if (a <= 0) return;
    lighter(g, () => {
      glow(g, x, y, r * 1.3, col || '#80e0ff', a * 0.35);
      for (let i = 0; i < 7; i++) {
        const ang = i / 6 * Math.PI * 2, hr = r * 0.34, cx = i === 6 ? x : x + Math.cos(ang) * r * 0.6, cy = i === 6 ? y : y + Math.sin(ang) * r * 0.6;
        g.strokeStyle = rgba(col || '#b8f4ff', a * (0.6 + 0.4 * Math.sin(t * 6 + i)));
        g.lineWidth = 1; g.beginPath();
        for (let k = 0; k <= 6; k++) { const q = k / 6 * Math.PI * 2 + Math.PI / 6; const px = cx + Math.cos(q) * hr, py = cy + Math.sin(q) * hr; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
        g.stroke();
      }
    });
  }
  function stellaron(g, x, y, r, t, a) {
    const k = a == null ? 1 : a, p = 1 + Math.sin(t * 3) * 0.08;
    lighter(g, () => {
      glow(g, x, y, r * 4 * p, '#3a6ad8', 0.45 * k);
      glow(g, x, y, r * 2.2 * p, '#9ae8ff', 0.7 * k);
      for (let i = 0; i < 9; i++) {
        const an = i * 0.7 + t * 0.4 + Math.sin(t * 2 + i) * 0.2, l1 = r * (1.1 + hx(i, 2, 2) * 0.6), l2 = r * (2 + hx(i, 3, 2) * 1.6) * p;
        g.strokeStyle = rgba('#e8ffff', 0.8 * k); g.lineWidth = 1; g.beginPath();
        g.moveTo(x + Math.cos(an) * r * 0.6, y + Math.sin(an) * r * 0.6);
        g.lineTo(x + Math.cos(an + 0.25) * l1, y + Math.sin(an + 0.25) * l1);
        g.lineTo(x + Math.cos(an - 0.1) * l2, y + Math.sin(an - 0.1) * l2);
        g.stroke();
      }
    });
    ell(g, rgba('#101830', k), x, y, r * 0.72, r * 0.72);
    ell(g, rgba('#ffffff', k), x, y, r * 0.42, r * 0.42);
    lighter(g, () => glow(g, x, y, r * 1.2, '#ffffff', 0.8 * k));
  }

  const BG = {
    black(g) { rect(g, '#000000', 0, 0, LW, LH); },

    space(g, t, o = {}) {
      g.drawImage(layer('space|' + (o.tint || ''), LW, LH, (c) => {
        vgrad(c, 0, LH, [[0, '#02030c'], [0.55, o.tint === 'jarilo' ? '#0c1830' : '#0a0f2c'], [1, o.tint === 'jarilo' ? '#1a2a48' : '#1c1238']]);
        glow(c, 70, 60, 130, '#4a2a8a', 0.32);
        glow(c, 250, 170, 150, '#1a4a8a', 0.28);
        glow(c, 190, 90, 90, '#6a3aa0', 0.18);
      }), 0, 0);
      stars(g, t, 170, 7, 1, LH, (o.drift || 0) * t);
      if (o.planet) planet(g, o.planet.x, o.planet.y, o.planet.r, o.planet.kind || 'jarilo', t);
      if (o.station) hertaStation(g, o.station.x, o.station.y, o.station.s || 1, t, o.station.hit);
    },

    station(g, t, o = {}) {
      const kind = o.kind || 'hall';
      g.drawImage(layer('station|' + kind, LW, LH, c => stationRoom(c, kind)), -(o.pan || 0), 0);
      if (kind === 'hall' || kind === 'platform') lighter(g, () => { for (let i = 0; i < 5; i++) glow(g, 32 + i * 64 - (o.pan || 0), 24, 22, '#b8d8ff', 0.18); });
      if (kind === 'vault') {
        stellaron(g, 160 - (o.pan || 0), 96, 10, t, o.orb == null ? 1 : o.orb);
        for (let i = 0; i < 4; i++) { const x = 70 + i * 60 - (o.pan || 0); rect(g, rgba('#ff5ac8', 0.18 + 0.08 * Math.sin(t * 3 + i)), x, 52 + (i % 2) * 18, 34, 22); glitch(g, t + i, x, 52 + (i % 2) * 18, 34, 22, 0.25, i + 2); }
      }
      if (kind === 'control') for (let i = 0; i < 6; i++) rect(g, rgba('#5af0ff', 0.25 + 0.2 * Math.sin(t * 4 + i * 1.7)), 48 + i * 40 - (o.pan || 0), 186, 26, 3);
      if (o.alert) {
        const a = 0.14 + 0.12 * Math.sin(t * 5);
        flash(g, '#ff2030', a);
        lighter(g, () => { glow(g, 20 + Math.sin(t * 4) * 12, 20, 60, '#ff3040', 0.45); glow(g, 300 - Math.sin(t * 4) * 12, 20, 60, '#ff3040', 0.45); });
      }
      if (o.fire) { embers(g, t, 40, 5, 0, LW, LH, '#ff8a3a'); lighter(g, () => { glow(g, 30, 220, 70, '#ff6020', 0.4 + 0.1 * Math.sin(t * 9)); glow(g, 290, 225, 60, '#ff7030', 0.35); }); }
    },

    parlor(g, t, o = {}) {
      g.drawImage(layer('parlor', LW, LH, parlorRoom), 0, 0);
      g.save();
      for (const wx of [18, 118, 218]) {
        g.save(); g.beginPath(); g.rect(wx + 4, 30, 76, 92); g.clip();
        rect(g, '#050818', wx + 4, 30, 76, 92);
        if (o.planet) planet(g, wx + 40, 80, 26, 'jarilo', t);
        stars(g, t, 50, 11, 1, LH, o.moving ? t * 60 : t * 2);
        if (o.moving) hStreaks(g, t, 14, 3, 220, '#b8d0ff', 0.5, 30, 122);
        if (o.warp) lighter(g, () => { speedLines(g, t, wx + 40, 76, 30, '#d8f0ff', 0.9, 4); glow(g, wx + 40, 76, 40, '#9ad8ff', 0.5); });
        g.restore();
      }
      g.restore();
      lighter(g, () => { for (const x of [104, 204]) glow(g, x, 58, 14, '#ffd890', 0.55); });
    },

    snow(g, t, o = {}) {
      g.drawImage(layer('snow|' + (o.wall ? 'w' : '') + (o.ruins ? 'r' : '') + (o.storm ? 's' : ''), LW, LH, c => snowField(c, o)), 0, 0);
      if (o.wall) lighter(g, () => { glow(g, 232, 132, 16, '#ffc860', 0.4 + 0.1 * Math.sin(t * 2)); });
      snowfall(g, t, o.storm ? 260 : 120, 4, { speed: o.storm ? 60 : 24, wind: o.storm ? 90 : 10, streak: !!o.storm });
      if (o.storm) flash(g, '#dfe8f4', 0.18 + 0.06 * Math.sin(t * 1.7));
    },

    city(g, t, o = {}) {
      const mode = o.night ? 'n' : o.sun ? 's' : 'd';
      g.drawImage(layer('city|' + mode + (o.monument ? 'm' : '') + (o.fort ? 'f' : ''), LW, LH, c => cityStreet(c, mode, o)), -(o.pan || 0), 0);
      if (o.night) lighter(g, () => { for (const x of [40, 132, 228, 300]) glow(g, x - (o.pan || 0), 150, 26, '#ffcf70', 0.5 + 0.06 * Math.sin(t * 3 + x)); });
      if (o.monument) lighter(g, () => glow(g, 160 - (o.pan || 0), 150, 40, '#7ad8ff', 0.25 + 0.05 * Math.sin(t * 2)));
      if (o.sun) { lighter(g, () => { glow(g, 250, 40, 130, '#fff0c0', 0.5); for (let i = 0; i < 6; i++) { g.save(); g.translate(250, 40); g.rotate(0.9 + i * 0.22 + Math.sin(t * 0.5) * 0.02); rect(g, rgba('#fff4d0', 0.08), 0, -3, 320, 6); g.restore(); } }); }
      else snowfall(g, t, 70, 8, { speed: 18, wind: 6 });
    },

    fort(g, t, o = {}) {
      g.drawImage(layer('fort', LW, LH, fortHall), 0, 0);
      lighter(g, () => { glow(g, 160, 40, 70, '#ffe8b0', 0.3); for (let i = 0; i < 8; i++) { const ph = (t * 0.1 + hx(i, 2, 8)) % 1; g.fillStyle = rgba('#fff0c8', 0.5 * (1 - ph)); g.fillRect(120 + hx(i, 3, 8) * 80, 30 + ph * 110, 1, 1); } });
      if (o.voice) lighter(g, () => { for (let i = 0; i < 3; i++) { const ph = (t * 0.4 + i / 3) % 1; ring(g, rgba('#7ad8ff', 0.4 * (1 - ph)), 1, o.voice[0], o.voice[1], 10 + ph * 60); } });
    },

    hotel(g, t, o = {}) {
      g.drawImage(layer('hotel|' + (o.night ? 'n' : 'd'), LW, LH, c => hotelLobby(c, o.night)), 0, 0);
      lighter(g, () => glow(g, 160, 26, 60, '#ffd890', o.night ? 0.25 : 0.45));
    },

    alley(g, t, o = {}) {
      g.drawImage(layer('alley', LW, LH, alleyWay), 0, 0);
      lighter(g, () => {
        glow(g, 160, 110, 70 + Math.sin(t * 2) * 6, '#b03aff', 0.35);
        for (let i = 0; i < 12; i++) {
          const x = 60 + hx(i, 1, 4) * 200, y = 40 + hx(i, 2, 4) * 120 + Math.sin(t + i) * 4, r = t * (0.3 + hx(i, 3, 4)) + i;
          poly(g, rgba(i % 2 ? '#ff4ad8' : '#8a4aff', 0.5), [x + Math.cos(r) * 4, y + Math.sin(r) * 4, x + Math.cos(r + 2) * 3, y + Math.sin(r + 2) * 3, x + Math.cos(r + 4) * 5, y + Math.sin(r + 4) * 5]);
        }
      });
      glitch(g, t, 110, 70, 100, 90, 0.2, 7);
    },

    under(g, t, o = {}) {
      const kind = o.kind || 'town';
      g.drawImage(layer('under|' + kind, LW, LH, c => underworld(c, kind)), 0, 0);
      lighter(g, () => {
        if (kind === 'town') for (let i = 0; i < 9; i++) glow(g, 20 + i * 36, 70 + (i % 3) * 22, 12, '#ffb050', 0.45 + 0.08 * Math.sin(t * 2 + i));
        else glow(g, 150, 40, 70, '#ffc070', 0.45 + 0.05 * Math.sin(t * 7));
      });
      if (kind === 'town') embers(g, t, 18, 12, 0, LW, 200, '#ffb060');
    },

    mine(g, t) {
      g.drawImage(layer('mine', LW, LH, mineCave), 0, 0);
      lighter(g, () => { glow(g, 165, 110, 70 + Math.sin(t * 1.5) * 5, '#40c8ff', 0.4); glow(g, 40, 70, 20, '#ffb050', 0.4); glow(g, 280, 64, 20, '#ffb050', 0.4); });
      for (let i = 0; i < 20; i++) { const ph = (t * 0.2 + hx(i, 1, 13)) % 1; g.fillStyle = rgba('#c8f0ff', 0.4 * (1 - ph)); g.fillRect(120 + hx(i, 2, 13) * 90, 150 - ph * 90, 1, 1); }
    },

    rivet(g, t, o = {}) {
      const kind = o.kind || 'ruins';
      g.drawImage(layer('rivet|' + kind, LW, LH, c => rivetTown(c, kind)), 0, 0);
      if (kind === 'factory') lighter(g, () => { glow(g, 250, 150, 80, '#ff7a30', 0.45 + 0.08 * Math.sin(t * 5)); for (let i = 0; i < 5; i++) glow(g, 30 + i * 22, 90 + (i % 2) * 8, 4, '#ff3a2a', 0.6 * (0.5 + 0.5 * Math.sin(t * 3 + i))); });
      else snowfall(g, t, 50, 21, { speed: 12, wind: 4, a: 0.6 });
    },

    workshop(g, t) {
      g.drawImage(layer('workshop', LW, LH, workshopRoom), 0, 0);
      lighter(g, () => { glow(g, 110, 34, 70, '#ffd08a', 0.45 + 0.04 * Math.sin(t * 6)); glow(g, 262, 120, 16, '#ff5a3a', 0.4 + 0.3 * Math.sin(t * 2)); });
    },

    front(g, t) {
      g.drawImage(layer('front', LW, LH, frontLine), 0, 0);
      lighter(g, () => { glow(g, 160, 60, 140, '#c03a8a', 0.18 + 0.05 * Math.sin(t)); });
      snowfall(g, t, 140, 31, { speed: 40, wind: 40, streak: true });
    },

    hill(g, t, o = {}) {
      g.drawImage(layer('hill|' + (o.summit ? 's' : 'p'), LW, LH, c => hillSlope(c, o.summit)), 0, 0);
      if (o.summit) stellaron(g, 160, 44, 12, t, 1);
      snowfall(g, t, o.summit ? 180 : 240, 41, { speed: 50, wind: 110, streak: true, a: 0.8 });
      flash(g, '#d8e4f4', 0.1);
    },

    void(g, t, o = {}) {
      vgrad(g, 0, LH, [[0, '#010208'], [1, o.amber ? '#1a0e04' : '#060816']]);
      stars(g, t, 140, 17, 0.9);
      lighter(g, () => { g.save(); g.translate(160, 120); g.rotate(-0.4); rect(g, rgba(o.amber ? '#ffb040' : '#5a6aff', 0.06), -300, -18, 600, 36); rect(g, rgba(o.amber ? '#ffd080' : '#8a9aff', 0.05), -300, -6, 600, 12); g.restore(); });
      if (o.eye) nanookEye(g, 160, 100, o.eye, t);
      if (o.amber) amberWall(g, t, o.amber);
      if (o.shards) for (let i = 0; i < o.shards.length; i++) memoryShard(g, t, i, o.shards[i]);
    },

    panel(g, t, o = {}) { storyPanel(g, t, o.kind || 'fire'); }
  };

  function planet(g, x, y, r, kind, t) {
    const warm = kind === 'blue';
    glow(g, x, y, r * 1.35, warm ? '#6ab0ff' : '#b8e0ff', 0.35);
    const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.1, x, y, r);
    gr.addColorStop(0, warm ? '#bfe0ff' : '#ffffff'); gr.addColorStop(0.5, warm ? '#4a86c8' : '#c8dcee'); gr.addColorStop(1, warm ? '#12305a' : '#4a5e7a');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
    for (let i = 0; i < 6; i++) ell(g, rgba('#ffffff', 0.18), x + Math.sin(t * 0.1 + i) * r * 0.2, y - r * 0.6 + i * r * 0.24, r * (0.9 - Math.abs(i - 2.5) * 0.12), r * 0.05);
    hgrad(g, x - r * 0.1, x + r, y - r, y + r, [[0, 'rgba(0,0,10,0)'], [1, 'rgba(0,0,10,0.75)']]);
    g.restore();
  }

  function hertaStation(g, x, y, s, t, hit) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.strokeStyle = '#8a92a8'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 70, 20, -0.12, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = '#d8dce8'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -1, 70, 20, -0.12, Math.PI, Math.PI * 2); g.stroke();
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; line(g, '#6a7088', 1.5, 0, 0, Math.cos(a) * 68, Math.sin(a) * 19 - Math.cos(a) * 8); }
    poly(g, '#b8bed0', [-9, -52, 9, -52, 13, 30, -13, 30]);
    poly(g, '#e8ecf4', [-9, -52, 0, -52, 0, 30, -13, 30]);
    ell(g, '#d8b060', 0, -56, 12, 5); ell(g, '#f8e8b8', 0, -58, 6, 2.4);
    poly(g, '#8a90a4', [-5, 30, 5, 30, 3, 52, -3, 52]);
    for (let i = 0; i < 12; i++) rect(g, rgba('#ffd890', 0.6 + 0.4 * Math.sin(t * 2 + i)), -6 + (i % 3) * 5, -44 + Math.floor(i / 3) * 16, 2, 2);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; rect(g, rgba('#9ad8ff', 0.8), Math.cos(a) * 70 - 1, Math.sin(a) * 20 - Math.cos(a) * 8 - 1, 2, 2); }
    if (hit) lighter(g, () => { for (let i = 0; i < 5; i++) { const ph = (t * 0.9 + i * 0.21) % 1; glow(g, -60 + hx(i, 3, 3) * 120, -30 + hx(i, 4, 3) * 50, 6 + ph * 16, '#ff7a30', (1 - ph) * 0.9); } });
    g.restore();
  }

  function stationRoom(g, kind) {
    const dark = kind === 'vault';
    vgrad(g, 0, LH, dark ? [[0, '#07060e'], [0.6, '#14102a'], [1, '#0a0a14']] : [[0, '#161c30'], [0.55, '#2a3352'], [1, '#141828']]);
    if (kind !== 'vault') {
      rect(g, '#0a0e1c', 20, 40, 280, 70);
      for (let i = 0; i < 80; i++) { g.fillStyle = rgba('#e8f0ff', 0.3 + 0.7 * hx(i, 1, 9)); g.fillRect(22 + Math.floor(hx(i, 2, 9) * 276), 42 + Math.floor(hx(i, 3, 9) * 66), 1, 1); }
      if (kind === 'platform') { planet(g, 230, 96, 40, 'blue', 0); }
      for (let i = 0; i <= 7; i++) rect(g, '#b8964e', 18 + i * 40, 38, 4, 74);
      rect(g, '#d8b868', 16, 36, 288, 4); rect(g, '#8a6e3a', 16, 110, 288, 4);
    }
    poly(g, dark ? '#0e0c18' : '#20263c', [0, 0, 40, 26, 40, 150, 0, 190]);
    poly(g, dark ? '#0e0c18' : '#20263c', [LW, 0, 280, 26, 280, 150, LW, 190]);
    rect(g, dark ? '#1a1628' : '#3a4262', 0, 0, LW, 20);
    for (let i = 0; i < 5; i++) rect(g, dark ? '#4a3a8a' : '#d8e8ff', 16 + i * 64, 18, 32, 2);
    vgrad(g, 150, LH, dark ? [[0, '#16122a'], [1, '#08060e']] : [[0, '#3a4262'], [1, '#161a2a']]);
    g.strokeStyle = dark ? 'rgba(160,90,255,0.25)' : 'rgba(216,184,104,0.35)'; g.lineWidth = 1;
    for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(160 + i * 12, 150); g.lineTo(160 + i * 60, LH); g.stroke(); }
    for (let i = 1; i < 6; i++) { const y = 150 + Math.pow(i / 6, 1.7) * 90; g.beginPath(); g.moveTo(0, y); g.lineTo(LW, y); g.stroke(); }
    if (kind === 'hall') {
      for (const x of [60, 240]) { rect(g, '#141a2a', x, 70, 26, 80); rect(g, '#5af0ff', x + 4, 74, 18, 2); rect(g, '#b8964e', x - 2, 68, 30, 3); }
    }
    if (kind === 'control') {
      rect(g, '#0e1426', 90, 44, 140, 60); rect(g, '#2a8ac8', 94, 48, 132, 52);
      for (let i = 0; i < 6; i++) rect(g, '#8ae8ff', 100 + i * 20, 56 + (i % 3) * 12, 14, 2);
      g.strokeStyle = '#d8f4ff'; g.lineWidth = 1; g.beginPath(); for (let x = 0; x < 120; x += 4) g.lineTo(100 + x, 88 - Math.abs(Math.sin(x * 0.2)) * 10); g.stroke();
      poly(g, '#1c2238', [20, 240, 40, 176, 280, 176, 300, 240]);
      poly(g, '#2e3654', [40, 176, 280, 176, 272, 190, 48, 190]);
      rect(g, '#d8b868', 40, 175, 240, 2);
    }
    if (kind === 'storage') {
      for (const [x, y, w, h, c] of [[8, 112, 50, 60, '#4a4a58'], [14, 70, 40, 42, '#5a5a6a'], [262, 104, 54, 70, '#4a4a58'], [268, 66, 40, 38, '#5a5a6a'], [70, 130, 30, 40, '#3a3a48']]) { rect(g, c, x, y, w, h); rect(g, '#b8964e', x, y, w, 2); rect(g, '#2a2a34', x + 3, y + 6, w - 6, 2); }
      for (const [x, col] of [[120, '#ff9a4a'], [200, '#9a6aff']]) { rect(g, rgba('#a8d8ff', 0.2), x, 100, 22, 60); ell(g, col, x + 11, 128, 5, 5); rect(g, '#b8964e', x - 2, 158, 26, 6); rect(g, '#b8964e', x - 2, 96, 26, 4); }
    }
    if (kind === 'vault') {
      rect(g, '#120e20', 140, 110, 40, 60); poly(g, '#221a3a', [128, 170, 192, 170, 200, 186, 120, 186]);
      for (let i = 0; i < 3; i++) { g.strokeStyle = '#6a4aff'; g.lineWidth = 1; g.beginPath(); g.ellipse(160, 96, 26 + i * 8, 7 + i * 2, 0, 0, Math.PI * 2); g.stroke(); }
    }
    if (kind === 'platform') { rect(g, '#6a7088', 0, 148, LW, 4); for (let x = 0; x < LW; x += 16) rect(g, '#6a7088', x, 136, 2, 12); rect(g, '#2a2e3a', 0, 206, LW, 6); rect(g, '#8a8e9a', 0, 204, LW, 2); rect(g, '#8a8e9a', 0, 228, LW, 2); }
  }

  function parlorRoom(g) {
    vgrad(g, 0, LH, [[0, '#24100c'], [0.6, '#3a1812'], [1, '#1a0a08']]);
    rect(g, '#2a120c', 0, 0, LW, 22); rect(g, '#b8904a', 0, 20, LW, 2);
    for (const wx of [18, 118, 218]) {
      rect(g, '#7a5424', wx, 26, 84, 100); rect(g, '#d8b060', wx + 1, 27, 82, 1);
      ell(g, '#7a5424', wx + 42, 30, 42, 10);
    }
    rect(g, '#4a2016', 0, 126, LW, 34); rect(g, '#b8904a', 0, 126, LW, 2); rect(g, '#b8904a', 0, 158, LW, 1);
    for (let x = 6; x < LW; x += 40) rect(g, '#5a2a1c', x, 132, 28, 20);
    for (const sx of [24, 128, 224]) { rect(g, '#e8dcc4', sx, 118, 72, 22); rect(g, '#c8b894', sx, 132, 72, 8); rect(g, '#f4ecdc', sx + 2, 112, 68, 8); }
    for (const x of [104, 204]) { rect(g, '#b8904a', x - 1, 50, 2, 20); ell(g, '#ffe0a0', x, 58, 4, 5); }
    vgrad(g, 160, LH, [[0, '#6a1a22'], [1, '#3a0c12']]);
    g.strokeStyle = 'rgba(216,176,96,0.35)'; g.lineWidth = 1;
    for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(160 + i * 18, 160); g.lineTo(160 + i * 70, LH); g.stroke(); }
    for (let r = 0; r < 4; r++) for (let i = -4; i <= 4; i++) { const y = 172 + r * 18, x = 160 + i * (40 + r * 12); poly(g, 'rgba(216,176,96,0.4)', [x, y - 3, x + 5, y, x, y + 3, x - 5, y]); }
  }

  function snowField(g, o) {
    vgrad(g, 0, 150, o.storm ? [[0, '#6a7890'], [1, '#c4d0de']] : [[0, '#7890b0'], [0.7, '#c8d6e6'], [1, '#e4ecf4']]);
    for (let layerI = 0; layerI < 3; layerI++) {
      const base = 110 + layerI * 14, col = ['#9aaac4', '#aebcd2', '#c4d0e0'][layerI];
      g.fillStyle = col; g.beginPath(); g.moveTo(0, 160);
      for (let x = 0; x <= LW; x += 10) g.lineTo(x, base - hx(x, layerI, 5) * (40 - layerI * 10) - Math.sin(x * 0.02 + layerI) * 10);
      g.lineTo(LW, 160); g.fill();
    }
    if (o.wall) {
      rect(g, '#5a6478', 150, 104, 170, 40); rect(g, '#6a7488', 150, 100, 170, 6);
      for (let x = 150; x < LW; x += 12) rect(g, '#5a6478', x, 96, 6, 6);
      for (const tx of [170, 280]) { rect(g, '#4a5468', tx, 80, 20, 64); poly(g, '#3a4458', [tx - 3, 80, tx + 10, 66, tx + 23, 80]); }
      rect(g, '#2a3040', 222, 118, 20, 26); ell(g, '#2a3040', 232, 118, 10, 8);
      for (let i = 0; i < 8; i++) rect(g, '#ffd880', 158 + i * 19, 112, 2, 3);
      for (let i = 0; i < 4; i++) { poly(g, '#7a8498', [190 + i * 30, 100, 200 + i * 30, 84, 210 + i * 30, 100]); }
    }
    vgrad(g, 140, LH, [[0, '#dce6f0'], [1, '#f4f8fc']]);
    for (let i = 0; i < 14; i++) ell(g, 'rgba(160,184,214,0.35)', hx(i, 3, 7) * LW, 150 + hx(i, 4, 7) * 80, 20 + hx(i, 5, 7) * 40, 3 + hx(i, 6, 7) * 5);
    if (o.ruins) for (let i = 0; i < 4; i++) { const x = 20 + i * 80, y = 170 + (i % 2) * 20; poly(g, '#6a6070', [x, y, x + 20, y - 14, x + 40, y]); poly(g, '#f4f8fc', [x + 4, y - 2, x + 20, y - 12, x + 36, y - 2, x + 30, y - 6, x + 10, y - 6]); }
  }

  function building(g, x, w, h, col, mode, roof) {
    const base = 170, lit = mode === 'n' ? '#ffd070' : mode === 's' ? '#fff0c0' : '#ffe4a0';
    rect(g, col, x, base - h, w, h);
    rect(g, G.shade(col, -0.25), x + w - 4, base - h, 4, h);
    poly(g, G.shade(col, -0.35), [x - 3, base - h, x + w / 2, base - h - (roof || 16), x + w + 3, base - h]);
    poly(g, mode === 's' ? '#f8f0e0' : '#f0f4fa', [x - 3, base - h, x + w / 2, base - h - (roof || 16), x + w + 3, base - h, x + w / 2, base - h - (roof || 16) + 4]);
    rect(g, G.shade(col, 0.2), x - 2, base - h + 2, w + 4, 2);
    const cols = Math.max(1, Math.floor((w - 6) / 10)), rows = Math.max(1, Math.floor((h - 14) / 16));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const on = hx(x + c, r, 3) > (mode === 'n' ? 0.35 : 0.5);
      rect(g, on ? lit : G.shade(col, -0.5), x + 5 + c * 10, base - h + 10 + r * 16, 5, 8);
      rect(g, '#f4f8fc', x + 4 + c * 10, base - h + 18 + r * 16, 7, 1);
    }
  }

  function cityStreet(g, mode, o) {
    vgrad(g, 0, 170, mode === 'n' ? [[0, '#060a18'], [1, '#1a2440']] : mode === 's' ? [[0, '#f0b070'], [0.6, '#f8d8a0'], [1, '#fff0d0']] : [[0, '#5a6a88'], [1, '#aab8cc']]);
    if (o.fort) { const c = mode === 'n' ? '#1a2238' : '#4a5470'; rect(g, c, 120, 40, 80, 130); poly(g, c, [112, 40, 160, 6, 208, 40]); rect(g, G.shade(c, -0.2), 150, 70, 20, 100); for (let i = 0; i < 6; i++) rect(g, '#ffd880', 128 + i * 12, 60, 3, 6); }
    const pal = mode === 'n' ? ['#1c2438', '#242c44', '#1a2032', '#2a3048'] : mode === 's' ? ['#9a7a64', '#b08a6a', '#8a6a58', '#a8826a'] : ['#6a7890', '#7a8498', '#5e6a80', '#8a90a4'];
    let x = -6;
    for (let i = 0; x < LW + 10; i++) {
      const w = 34 + Math.floor(hx(i, 1, 21) * 24), h = 60 + Math.floor(hx(i, 2, 21) * 70);
      if (!(o.fort && x > 100 && x < 200)) building(g, x, w, h, pal[i % 4], mode, 12 + hx(i, 3, 21) * 12);
      x += w + 4;
    }
    vgrad(g, 170, LH, mode === 'n' ? [[0, '#2a3048'], [1, '#141828']] : mode === 's' ? [[0, '#d8c4a8'], [1, '#b89a80']] : [[0, '#8a93a6'], [1, '#5a6276']]);
    for (let i = 0; i < 40; i++) rect(g, 'rgba(255,255,255,0.08)', hx(i, 1, 33) * LW, 176 + hx(i, 2, 33) * 60, 8, 3);
    rect(g, mode === 's' ? '#f8f0e4' : '#e8eef6', 0, 168, LW, 4);
    for (const lx of [40, 132, 228, 300]) { rect(g, '#1a1a22', lx - 1, 138, 2, 34); rect(g, '#2a2a34', lx - 4, 134, 8, 5); rect(g, mode === 'n' ? '#fff0b0' : '#ffe8a0', lx - 2, 139, 4, 3); }
    if (o.monument) {
      ell(g, mode === 'n' ? '#3a4460' : '#8a94a8', 160, 176, 34, 7);
      g.strokeStyle = mode === 's' ? '#6a5a4a' : '#4a5270'; g.lineWidth = 6; g.beginPath(); g.arc(160, 140, 24, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; rect(g, mode === 's' ? '#6a5a4a' : '#4a5270', 160 + Math.cos(a) * 29 - 3, 140 + Math.sin(a) * 29 - 3, 6, 6); }
      for (const [dx, h, w] of [[-6, 56, 8], [4, 48, 7], [-14, 34, 6], [12, 30, 6]]) poly(g, '#7ad0f0', [160 + dx, 176 - h, 160 + dx + w, 176 - h + 10, 160 + dx + w - 2, 176, 160 + dx - 2, 176]);
      for (const [dx, h] of [[-6, 56], [4, 48]]) rect(g, '#d8f8ff', 160 + dx + 1, 176 - h + 4, 1, h - 10);
    }
  }

  function fortHall(g) {
    vgrad(g, 0, LH, [[0, '#1a1e34'], [0.6, '#2a2e4a'], [1, '#141626']]);
    rect(g, '#2a2e48', 0, 0, LW, 30);
    ell(g, '#3a3050', 160, 60, 40, 46); rect(g, '#f0e0b0', 132, 30, 56, 70); ell(g, '#f0e0b0', 160, 32, 28, 14);
    for (let i = 0; i < 4; i++) rect(g, '#6a5a3a', 136 + i * 14, 34, 2, 66); rect(g, '#6a5a3a', 132, 60, 56, 2);
    for (const px of [30, 80, 240, 290]) { rect(g, '#d8d0bc', px - 9, 20, 18, 150); rect(g, '#b8ae98', px + 3, 20, 6, 150); rect(g, '#d8b060', px - 12, 18, 24, 5); rect(g, '#d8b060', px - 12, 166, 24, 5); }
    for (const bx of [55, 265]) { poly(g, '#2e5ab0', [bx - 12, 30, bx + 12, 30, bx + 12, 110, bx, 118, bx - 12, 110]); poly(g, '#e8c060', [bx - 6, 58, bx + 6, 58, bx + 6, 76, bx, 82, bx - 6, 76]); rect(g, '#f0f4ff', bx - 12, 30, 24, 3); }
    vgrad(g, 150, LH, [[0, '#4a4e6a'], [1, '#22243a']]);
    poly(g, '#2e5ab0', [146, 150, 174, 150, 220, LH, 100, LH]); poly(g, '#d8b060', [146, 150, 148, 150, 104, LH, 100, LH]); poly(g, '#d8b060', [172, 150, 174, 150, 220, LH, 216, LH]);
    rect(g, '#3a3450', 120, 128, 80, 8); rect(g, '#4a4460', 128, 120, 64, 8); rect(g, '#d8b060', 120, 128, 80, 1);
    rect(g, '#6a4a2a', 150, 96, 20, 26); poly(g, '#d8b060', [148, 96, 160, 84, 172, 96]);
  }

  function hotelLobby(g, night) {
    vgrad(g, 0, LH, night ? [[0, '#140c10'], [1, '#2a1a16']] : [[0, '#3a2418'], [1, '#5a3a24']]);
    for (let x = 0; x < LW; x += 32) { rect(g, night ? '#2a1a14' : '#6a4428', x + 2, 40, 28, 110); rect(g, night ? '#3a261c' : '#8a5a34', x + 4, 44, 24, 50); }
    rect(g, '#c8a060', 0, 38, LW, 2); rect(g, '#c8a060', 0, 150, LW, 2);
    for (const wx of [40, 250]) { rect(g, night ? '#1a2a4a' : '#8ab0d0', wx, 52, 30, 50); rect(g, '#c8a060', wx + 14, 52, 2, 50); rect(g, '#c8a060', wx, 76, 30, 2); }
    poly(g, night ? '#2a1a14' : '#5a3a24', [100, 150, 150, 70, 170, 70, 124, 150]);
    for (let i = 0; i < 8; i++) rect(g, '#c8a060', 104 + i * 6, 146 - i * 10, 14, 1);
    rect(g, night ? '#3a2418' : '#7a4a2a', 190, 120, 90, 32); rect(g, '#c8a060', 190, 120, 90, 2);
    vgrad(g, 152, LH, night ? [[0, '#3a1a1a'], [1, '#1a0a0a']] : [[0, '#7a2a2a'], [1, '#4a1616']]);
    ell(g, night ? '#4a2020' : '#9a3a3a', 160, 200, 110, 22); ell(g, 'rgba(216,176,96,0.5)', 160, 200, 100, 18);
    ell(g, '#d8b060', 160, 18, 16, 4); for (let i = 0; i < 5; i++) ell(g, '#ffe8b0', 146 + i * 7, 24, 2, 3);
  }

  function alleyWay(g) {
    vgrad(g, 0, LH, [[0, '#1a0620'], [0.5, '#3a0a3a'], [1, '#0a0410']]);
    poly(g, '#140a1c', [0, 0, 110, 60, 110, 170, 0, LH]);
    poly(g, '#140a1c', [LW, 0, 210, 60, 210, 170, LW, LH]);
    for (let i = 0; i < 5; i++) { rect(g, '#2a1430', 10 + i * 18, 60 + i * 10, 8, 14); rect(g, '#2a1430', 300 - i * 18, 60 + i * 10, 8, 14); }
    vgrad(g, 170, LH, [[0, '#1a0c20'], [1, '#08040c']]);
    poly(g, '#221028', [110, 170, 210, 170, LW, LH, 0, LH]);
    g.strokeStyle = '#ff5ae8'; g.lineWidth = 1;
    for (let i = 0; i < 9; i++) { g.beginPath(); let x = 110 + hx(i, 1, 3) * 100, y = 60 + hx(i, 2, 3) * 110; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (hx(i, k, 4) - 0.5) * 20; y += 6 + hx(i, k, 5) * 10; g.lineTo(x, y); } g.stroke(); }
    rect(g, '#e8c8ff', 150, 100, 20, 70);
    rect(g, '#6a2a8a', 146, 96, 28, 4);
  }

  function underworld(g, kind) {
    if (kind === 'clinic' || kind === 'hotel') {
      vgrad(g, 0, LH, [[0, '#1a0e08'], [1, '#3a2414']]);
      for (let x = 0; x < LW; x += 24) { rect(g, '#4a2e1a', x, 30, 22, 130); rect(g, '#3a2212', x + 20, 30, 2, 130); }
      rect(g, '#2a1a0e', 0, 0, LW, 30); rect(g, '#6a4a2a', 0, 28, LW, 3);
      if (kind === 'clinic') {
        for (let s = 0; s < 3; s++) { rect(g, '#6a4a2a', 20, 60 + s * 26, 70, 3); for (let i = 0; i < 6; i++) rect(g, ['#8ac8a0', '#e8e0c8', '#c86a4a', '#6aa0d8'][(i + s) % 4], 24 + i * 11, 50 + s * 26, 6, 10); }
        rect(g, '#e8e4dc', 180, 124, 110, 20); rect(g, '#b8b0a0', 180, 144, 110, 8); rect(g, '#f4f0e8', 184, 116, 30, 10); rect(g, '#5a3a24', 178, 124, 4, 40); rect(g, '#5a3a24', 288, 124, 4, 40);
        rect(g, '#d8d4cc', 120, 70, 30, 40); rect(g, '#c83a3a', 131, 76, 8, 20); rect(g, '#c83a3a', 125, 82, 20, 8);
      } else {
        rect(g, '#5a3a22', 30, 110, 110, 40); rect(g, '#8a6a42', 30, 110, 110, 3);
        rect(g, '#3a2414', 200, 60, 90, 40); for (let i = 0; i < 4; i++) rect(g, '#d8b060', 206 + i * 22, 70, 12, 6);
        rect(g, '#6a4a2a', 60, 40, 60, 16); rect(g, '#f0d8a0', 66, 44, 48, 8);
      }
      vgrad(g, 160, LH, [[0, '#4a2e1a'], [1, '#2a180c']]);
      for (let x = 0; x < LW; x += 20) rect(g, '#3a2212', x, 160, 1, 80);
      ell(g, '#ffd890', 150, 40, 6, 4); rect(g, '#2a1a0e', 149, 30, 2, 8);
      return;
    }
    vgrad(g, 0, LH, [[0, '#0c0604'], [0.5, '#2a1a10'], [1, '#3a2414']]);
    for (let i = 0; i < 24; i++) { const x = i * 14 - 6, h = 16 + hx(i, 1, 41) * 40; poly(g, i % 2 ? '#1a100a' : '#221610', [x, 0, x + 18, 0, x + 12, h, x + 4, h * 0.8]); }
    for (const [y, c] of [[34, '#5a4a3a'], [46, '#4a3a2c']]) { rect(g, c, 0, y, LW, 6); rect(g, G.shade(c, 0.3), 0, y, LW, 1); for (let x = 20; x < LW; x += 60) rect(g, G.shade(c, -0.3), x, y - 1, 4, 8); }
    for (let i = 0; i < 9; i++) {
      const x = i * 36 - 4, h = 40 + hx(i, 2, 43) * 40, y = 170 - h, c = ['#5a3a24', '#4a3020', '#6a4a2e'][i % 3];
      rect(g, c, x, y, 32, h); poly(g, G.shade(c, -0.3), [x - 2, y, x + 16, y - 10, x + 34, y]);
      rect(g, '#ffb050', x + 6, y + 10, 6, 7); rect(g, '#ffb050', x + 20, y + 10, 6, 7); rect(g, '#2a1a0e', x + 12, y + h - 18, 8, 18);
    }
    vgrad(g, 170, LH, [[0, '#4a3020'], [1, '#2a1a0e']]);
    for (let i = 0; i < 30; i++) rect(g, 'rgba(0,0,0,0.2)', hx(i, 1, 44) * LW, 174 + hx(i, 2, 44) * 60, 10, 2);
    g.strokeStyle = '#2a1a0e'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 62); for (let x = 0; x <= LW; x += 36) g.quadraticCurveTo(x + 18, 76, x + 36, 62); g.stroke();
  }

  function mineCave(g) {
    vgrad(g, 0, LH, [[0, '#050404'], [0.5, '#141014'], [1, '#221a1c']]);
    for (let i = 0; i < 30; i++) { const x = hx(i, 1, 51) * LW, y = hx(i, 2, 51) * 120; poly(g, i % 2 ? '#1a1418' : '#221a20', [x, y, x + 30, y + 10, x + 20, y + 40, x - 10, y + 30]); }
    poly(g, '#100c10', [0, 0, 70, 0, 50, 240, 0, 240]); poly(g, '#100c10', [LW, 0, 250, 0, 270, 240, LW, 240]);
    for (let s = 0; s < 4; s++) line(g, 'rgba(90,70,60,0.5)', 1, 0, 60 + s * 30, LW, 50 + s * 34);
    for (const [x, y, s] of [[150, 100, 1], [175, 92, 1.3], [190, 112, 0.9], [138, 118, 0.8], [165, 124, 1.1]]) { poly(g, '#3aa8e0', [x, y - 20 * s, x + 7 * s, y, x, y + 8 * s, x - 7 * s, y]); poly(g, '#c8f4ff', [x, y - 20 * s, x + 2 * s, y - 4 * s, x - 2 * s, y - 2 * s]); }
    vgrad(g, 160, LH, [[0, '#2a2024'], [1, '#141014']]);
    for (let i = 0; i < 8; i++) { const y = 170 + Math.pow(i / 8, 1.5) * 70, w = 20 + i * 18; rect(g, '#4a3a2a', 160 - w, y, w * 2, 3); }
    line(g, '#8a8a94', 2, 150, 160, 60, LH); line(g, '#8a8a94', 2, 170, 160, 260, LH);
    for (const x of [40, 280]) { rect(g, '#3a2a1a', x - 1, 50, 2, 30); ell(g, '#ffd890', x, 70, 3, 4); }
  }

  function rivetTown(g, kind) {
    if (kind === 'factory') {
      vgrad(g, 0, LH, [[0, '#0a0a0e'], [0.6, '#1a1618'], [1, '#2a2020']]);
      for (let i = 0; i < 5; i++) { const x = 30 + i * 70, r = 18 + (i % 2) * 10; ring(g, '#3a3a44', 5, x, 50 + (i % 2) * 14, r); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; rect(g, '#3a3a44', x + Math.cos(a) * (r + 4) - 2, 50 + (i % 2) * 14 + Math.sin(a) * (r + 4) - 2, 4, 4); } }
      for (const y of [96, 112]) { rect(g, '#4a3a34', 0, y, LW, 6); rect(g, '#6a5a4a', 0, y, LW, 1); }
      rect(g, '#2a2224', 200, 100, 110, 80); rect(g, '#ff7a30', 222, 130, 66, 36); rect(g, '#ffd080', 230, 138, 50, 20);
      vgrad(g, 170, LH, [[0, '#3a3034'], [1, '#18141a']]);
      for (let x = 0; x < LW; x += 24) rect(g, '#2a2226', x, 170, 1, 70);
      return;
    }
    vgrad(g, 0, 170, [[0, '#6a7280'], [1, '#aab0b8']]);
    for (let i = 0; i < 6; i++) {
      const x = i * 58 - 10, h = 50 + hx(i, 1, 61) * 50, c = ['#6a6460', '#5a5450', '#7a726a'][i % 3];
      rect(g, c, x, 170 - h, 50, h);
      poly(g, '#aab0b8', [x + 10 + hx(i, 2, 61) * 20, 170 - h, x + 30 + hx(i, 3, 61) * 20, 170 - h, x + 24 + hx(i, 4, 61) * 10, 170 - h + 14]);
      for (let k = 0; k < 3; k++) rect(g, '#2a2626', x + 6 + k * 14, 170 - h + 14, 8, 10);
      rect(g, '#e8ecf0', x - 2, 170 - h - 2, 54, 3);
    }
    rect(g, '#7a5a4a', 110, 70, 100, 100); poly(g, '#5a3a2e', [104, 70, 160, 42, 216, 70]); rect(g, '#d8d0c0', 136, 80, 48, 10);
    for (let k = 0; k < 4; k++) rect(g, '#2a2020', 120 + k * 22, 100, 12, 16); rect(g, '#3a2a24', 150, 140, 20, 30);
    vgrad(g, 170, LH, [[0, '#c8ccd2'], [1, '#8a8e96']]);
    g.strokeStyle = '#6a4a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(250, 170); g.lineTo(262, 130); g.lineTo(290, 130); g.lineTo(302, 170); g.stroke(); line(g, '#4a3a30', 1, 272, 130, 272, 158); rect(g, '#6a4a3a', 266, 158, 12, 3);
  }

  function workshopRoom(g) {
    vgrad(g, 0, LH, [[0, '#1c1814'], [1, '#3a2c20']]);
    for (let x = 0; x < LW; x += 28) { rect(g, '#4a3a2a', x, 24, 26, 136); rect(g, '#3a2c20', x + 26, 24, 2, 136); }
    rect(g, '#2a2018', 0, 0, LW, 24); rect(g, '#8a7050', 0, 22, LW, 2);
    rect(g, '#5a6a8a', 20, 40, 60, 44); rect(g, '#c8a060', 20, 40, 60, 2); for (let i = 0; i < 4; i++) rect(g, '#e8e0d0', 26 + i * 13, 50, 9, 26);
    ring(g, '#2a2a30', 4, 150, 64, 14); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; rect(g, '#2a2a30', 150 + Math.cos(a) * 17 - 2, 64 + Math.sin(a) * 17 - 2, 4, 4); }
    g.save(); g.translate(214, 96); g.rotate(-0.35);
    ell(g, '#c83a2a', 0, 24, 14, 16); ell(g, '#c83a2a', 0, 6, 10, 11); ell(g, '#1a1414', 0, 14, 4, 4); rect(g, '#6a4a2a', -2, -44, 4, 50); rect(g, '#2a2020', -4, -52, 8, 10); rect(g, '#e8e0c8', -1, -40, 1, 60);
    g.restore();
    rect(g, '#1a1a1e', 240, 110, 46, 50); rect(g, '#3a3a40', 244, 114, 38, 30); ell(g, '#2a2a30', 263, 129, 12, 12); ell(g, '#5a5a64', 263, 129, 5, 5); for (let k = 0; k < 4; k++) ell(g, '#d8d0b0', 248 + k * 10, 150, 2, 2);
    rect(g, '#6a4a2e', 30, 126, 170, 12); rect(g, '#8a6a44', 30, 126, 170, 2); rect(g, '#4a3420', 36, 138, 6, 30); rect(g, '#4a3420', 188, 138, 6, 30);
    for (const [x, w, c] of [[44, 18, '#8a8e9a'], [70, 12, '#c8a060'], [90, 26, '#5a6a7a'], [124, 10, '#d85a3a'], [150, 30, '#6a7a8a']]) rect(g, c, x, 118, w, 8);
    vgrad(g, 160, LH, [[0, '#4a3a2c'], [1, '#261c14']]);
    for (let x = 0; x < LW; x += 22) rect(g, '#3a2c20', x, 160, 1, 80);
    ell(g, '#5a2a24', 160, 206, 90, 16);
    rect(g, '#2a2018', 108, 24, 4, 8); ell(g, '#ffe0a0', 110, 34, 6, 4);
  }

  function frontLine(g) {
    vgrad(g, 0, 150, [[0, '#2a2438'], [0.6, '#5a5068'], [1, '#8a8aa0']]);
    for (let i = 0; i < 10; i++) { const x = i * 34; poly(g, '#3a3450', [x, 150, x + 17, 110 - hx(i, 1, 71) * 30, x + 34, 150]); }
    rect(g, '#4a5064', 0, 96, LW, 70); rect(g, '#5a6074', 0, 92, LW, 6);
    for (let x = 0; x < LW; x += 14) rect(g, '#4a5064', x, 84, 8, 8);
    rect(g, '#2a2e3c', 130, 110, 60, 56); ell(g, '#2a2e3c', 160, 110, 30, 18); rect(g, '#6a7080', 136, 116, 48, 50); for (let x = 140; x < 184; x += 8) rect(g, '#3a4050', x, 116, 2, 50);
    for (const bx of [60, 260]) { rect(g, '#2a2a34', bx, 60, 2, 50); poly(g, '#2e5ab0', [bx + 2, 60, bx + 26, 64, bx + 22, 72, bx + 26, 80, bx + 2, 84]); rect(g, '#f0f4ff', bx + 6, 66, 12, 2); }
    vgrad(g, 166, LH, [[0, '#d8e0ea'], [1, '#aab4c4']]);
    for (let i = 0; i < 8; i++) poly(g, '#b8e0f4', [20 + i * 40, LH, 26 + i * 40, 200 - hx(i, 2, 72) * 20, 32 + i * 40, LH]);
  }

  function hillSlope(g, summit) {
    vgrad(g, 0, LH, [[0, '#101830'], [0.5, '#3a4a6a'], [1, '#9aaac4']]);
    if (summit) {
      vgrad(g, 150, LH, [[0, '#5a6a88'], [1, '#2a3450']]);
      for (let i = 0; i < 5; i++) { const x = 40 + i * 60, h = 90 + (i === 2 ? 30 : hx(i, 3, 81) * 20); poly(g, '#3a3e4c', [x - 12, 170, x - 6, 170 - h, x + 8, 170 - h - 8, x + 14, 170]); poly(g, '#5a5e70', [x - 6, 170 - h, x + 8, 170 - h - 8, x + 4, 170 - h + 6]); rect(g, '#d8b060', x - 4, 170 - h + 20, 10, 2); }
      poly(g, '#4a4e5e', [20, 190, 300, 190, 280, 170, 40, 170]); rect(g, '#d8b060', 40, 170, 240, 2);
      return;
    }
    for (let l = 0; l < 3; l++) { g.fillStyle = ['#2a3450', '#4a5878', '#7a8aa8'][l]; g.beginPath(); g.moveTo(0, LH); for (let x = 0; x <= LW; x += 16) g.lineTo(x, 100 + l * 30 - hx(x, l, 83) * 40 + (x / LW) * 30); g.lineTo(LW, LH); g.fill(); }
    for (let i = 0; i < 3; i++) { const x = 50 + i * 100, y = 190 - (i % 2) * 20; rect(g, 'rgba(180,230,255,0.45)', x - 14, y - 44, 30, 46); rect(g, 'rgba(255,255,255,0.5)', x - 14, y - 44, 30, 2); poly(g, 'rgba(40,20,70,0.7)', [x - 6, y - 36, x + 6, y - 36, x + 8, y - 6, x + 2, y, x - 4, y, x - 8, y - 6]); }
    vgrad(g, 196, LH, [[0, '#c8d4e4'], [1, '#8a98b0']]);
  }

  function nanookEye(g, x, y, k, t) {
    lighter(g, () => {
      glow(g, x, y, 120 * k, '#ff3a10', 0.35 * k);
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2 + t * 0.05; line(g, rgba('#ff7a30', 0.5 * k), 1, x + Math.cos(a) * 44 * k, y + Math.sin(a) * 44 * k, x + Math.cos(a) * (70 + hx(i, 2, 91) * 50) * k, y + Math.sin(a) * (70 + hx(i, 2, 91) * 50) * k); }
    });
    ell(g, rgba('#ff5a1a', k), x, y, 46 * k, 46 * k);
    ell(g, rgba('#ffd080', k), x, y, 40 * k, 40 * k);
    ell(g, rgba('#1a0404', k), x, y, 34 * k, 34 * k * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.8))));
    ell(g, rgba('#ff2010', k), x, y, 6 * k, 26 * k);
  }

  function amberWall(g, t, k) {
    lighter(g, () => glow(g, 160, 110, 160, '#ffa030', 0.45 * k));
    for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) {
      const x = c * 38 - (r % 2) * 19, y = 20 + r * 36, sh = 0.4 + hx(c, r, 93) * 0.5;
      poly(g, rgba(sh > 0.7 ? '#ffd070' : '#c88a30', 0.55 * k), [x, y, x + 34, y, x + 38, y + 16, x + 34, y + 32, x, y + 32, x - 4, y + 16]);
      rect(g, rgba('#fff0c0', 0.3 * k * (0.5 + 0.5 * Math.sin(t * 2 + c + r))), x + 4, y + 3, 26, 1);
    }
  }

  function memoryShard(g, t, i, kind) {
    const x = 40 + (i % 3) * 110 + Math.sin(t * 0.7 + i) * 6, y = 36 + Math.floor(i / 3) * 90 + Math.cos(t * 0.6 + i) * 5, w = 70, h = 46;
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(Math.sin(i * 1.7) * 0.18);
    const pal = { snow: ['#c8d8ec', '#6a7a98'], fire: ['#ff9a4a', '#3a0a0a'], ice: ['#7ad0f0', '#1a2a4a'], city: ['#d8b870', '#2a3048'] }[kind] || ['#8a8aff', '#1a1a3a'];
    vgrad(g, -h / 2, h / 2, [[0, pal[0]], [1, pal[1]]], -w / 2, w);
    for (let k = 0; k < 4; k++) rect(g, rgba(pal[1], 0.7), -w / 2 + 6 + k * 16, h / 2 - 16 - (k % 2) * 8, 10, 16 + (k % 2) * 8);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; g.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
    g.restore();
  }

  function storyPanel(g, t, kind) {
    vgrad(g, 0, LH, [[0, '#1a1208'], [1, '#0a0804']]);
    const x0 = 36, y0 = 34, w = 248, h = 172;
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    if (kind === 'fire') {
      vgrad(g, y0, y0 + h, [[0, '#3a0a04'], [0.5, '#c84a14'], [1, '#ffb040']], x0, w);
      for (let i = 0; i < 10; i++) { const bx = x0 + i * 26, bh = 30 + hx(i, 1, 101) * 50; rect(g, '#1a0804', bx, y0 + h - bh, 22, bh); }
      for (let i = 0; i < 7; i++) { const sx = x0 + 20 + i * 34, sy = y0 + 20 + (i % 3) * 14 + t * 6; poly(g, '#140404', [sx, sy, sx + 10, sy + 6, sx + 4, sy + 8, sx + 8, sy + 18, sx, sy + 10, sx - 8, sy + 18, sx - 4, sy + 8, sx - 10, sy + 6]); }
      embers(g, t, 50, 103, x0, x0 + w, y0 + h, '#ffd070');
    } else if (kind === 'freeze') {
      vgrad(g, y0, y0 + h, [[0, '#5a6a88'], [1, '#e8f0f8']], x0, w);
      for (let i = 0; i < 12; i++) { const sx = x0 + 10 + i * 20, sy = y0 + h - 30 - (i % 3) * 8; poly(g, rgba('#2a1a3a', 0.8 - seg(t, 0, 3) * 0.6), [sx, sy, sx + 6, sy + 4, sx + 3, sy + 16, sx - 3, sy + 16, sx - 6, sy + 4]); }
      vgrad(g, y0 + h - 30 - t * 8, y0 + h, [[0, 'rgba(244,248,252,0)'], [0.3, 'rgba(244,248,252,0.9)'], [1, '#f4f8fc']], x0, w);
      snowfall(g, t, 160, 105, { speed: 50, wind: 120, streak: true });
    } else {
      vgrad(g, y0, y0 + h, [[0, '#6a5a3a'], [1, '#d8c090']], x0, w);
      lighter(g, () => glow(g, 160, y0 + 40, 80, '#ffd070', 0.6));
      poly(g, '#e8c060', [150, y0 + 22, 170, y0 + 22, 176, y0 + 46, 160, y0 + 60, 144, y0 + 46]);
      rect(g, '#5a4a36', x0, y0 + 110, w, 62); for (let x = x0; x < x0 + w; x += 14) rect(g, '#6a5a44', x, y0 + 100, 10, 12);
      for (let i = 0; i < 9; i++) { const fx = x0 + 20 + i * 26, fy = y0 + 150 + (i % 2) * 6 - (i === Math.floor(t * 2) % 9 ? 2 : 0); ell(g, '#2a2014', fx, fy - 14, 3, 3); rect(g, '#2a2014', fx - 3, fy - 11, 6, 11); }
    }
    g.restore();
    g.strokeStyle = '#d8b060'; g.lineWidth = 3; g.strokeRect(x0 - 2, y0 - 2, w + 4, h + 4);
    g.strokeStyle = '#6a4a20'; g.lineWidth = 1; g.strokeRect(x0 - 6.5, y0 - 6.5, w + 13, h + 13);
    for (const [cx, cy] of [[x0 - 6, y0 - 6], [x0 + w + 6, y0 - 6], [x0 - 6, y0 + h + 6], [x0 + w + 6, y0 + h + 6]]) poly(g, '#d8b060', [cx, cy - 5, cx + 5, cy, cx, cy + 5, cx - 5, cy]);
    const sep = g.createLinearGradient(0, 0, 0, LH); sep.addColorStop(0, 'rgba(120,80,30,0.18)'); sep.addColorStop(1, 'rgba(60,40,10,0.28)');
    g.fillStyle = sep; g.fillRect(0, 0, LW, LH);
  }

  function expressSide(g, x, y, s, t, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s);
    for (let c = 0; c < (o.cars || 2); c++) {
      const cx = -c * 118;
      rect(g, '#1a1c28', cx - 110, -26, 112, 30); rect(g, '#2c3044', cx - 110, -26, 112, 6); rect(g, '#b89048', cx - 110, 2, 112, 2);
      for (let k = 0; k < 6; k++) { rect(g, '#ffe8a8', cx - 102 + k * 18, -16, 10, 8); lighter(g, () => glow(g, cx - 97 + k * 18, -12, 8, '#ffd890', 0.35)); }
      rect(g, '#8a1a26', cx - 110, -4, 112, 6);
      for (const wx of [-96, -22]) { ell(g, '#101014', cx + wx, 8, 7, 7); ell(g, '#6a6a74', cx + wx, 8, 3, 3); }
    }
    poly(g, '#161822', [0, -30, 30, -30, 48, -14, 52, 6, 0, 6]); rect(g, '#b89048', 0, 2, 52, 2);
    rect(g, '#8a1a26', 0, -10, 40, 6);
    rect(g, '#1a1c28', 8, -44, 10, 16); rect(g, '#b89048', 6, -46, 14, 3);
    lighter(g, () => { glow(g, 52, -6, 26, '#c8ecff', 0.8); glow(g, 52, -6, 8, '#ffffff', 1); });
    g.restore();
  }

  function drone(g, x, y, t, i) {
    ell(g, '#2a2e3a', x, y, 7, 3); ell(g, '#d8b060', x, y - 1, 5, 1.5);
    lighter(g, () => glow(g, x, y + 2, 5, '#ff7a30', 0.7 + 0.3 * Math.sin(t * 20 + i)));
  }

  function capsule(g, x, y, look, t, open) {
    rect(g, '#1a1628', x - 16, y - 90, 32, 94); rect(g, '#6a4aff', x - 16, y - 90, 32, 2); rect(g, '#6a4aff', x - 16, y + 2, 32, 2);
    const img = tinted(G.figureCanvas(look), '#3a4a9a', 0.55);
    g.save(); g.globalAlpha = 0.9; g.drawImage(img, Math.round(x - 24), Math.round(y - 93)); g.restore();
    rect(g, rgba('#a8c8ff', 0.25 - (open || 0) * 0.2), x - 14, y - 88, 28, 90);
    rect(g, rgba('#ffffff', 0.35), x - 11, y - 84, 2, 70);
  }

  function engine(g, x, y, s, t, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const B = '#57506a', Bh = '#8a82a0', Bd = '#342e44', Au = '#e0b050', Ic = '#a8e0f4';
    const arm = (side, lift, gone) => {
      if (gone) { sparks(g, t, side * 70, -150, 18, 9, '#ffb060', 34); lighter(g, () => glow(g, side * 70, -150, 20, '#ff9a40', 0.6)); return; }
      g.save(); g.translate(side * 70, -150); g.rotate(side * (0.35 + lift));
      poly(g, Bd, [-16, 0, 16, 0, 14, 70, -14, 70]); poly(g, B, [-14, 0, 6, 0, 4, 70, -12, 70]);
      rect(g, Au, -16, 30, 32, 3); ell(g, Bd, 0, 74, 16, 12);
      poly(g, Bd, [-18, 80, 18, 80, 24, 116, -24, 116]); poly(g, B, [-16, 82, 8, 82, 12, 112, -20, 112]); rect(g, Au, -18, 96, 36, 2);
      for (let f = 0; f < 4; f++) poly(g, Bh, [-20 + f * 11, 116, -12 + f * 11, 116, -13 + f * 11, 134, -19 + f * 11, 134]);
      g.restore();
    };
    arm(-1, o.armL || 0, o.noLeft);
    poly(g, Bd, [-64, -170, 64, -170, 52, -60, 40, 0, -40, 0, -52, -60]);
    poly(g, B, [-60, -168, 0, -168, 0, 0, -38, 0, -48, -60]);
    poly(g, Bh, [-54, -164, -10, -164, -14, -120, -50, -126]);
    for (let i = 0; i < 4; i++) rect(g, Au, -46 + i * 3, -150 + i * 30, 92 - i * 6, 2);
    ell(g, Bd, 0, -104, 20, 22); lighter(g, () => { glow(g, 0, -104, 30, '#ffc060', 0.7 + 0.2 * Math.sin(t * 3)); glow(g, 0, -104, 10, '#fff0c0', 1); });
    for (const sd of [-1, 1]) { ell(g, Bd, sd * 66, -160, 26, 20); ell(g, Bh, sd * 62, -166, 18, 11); rect(g, Au, sd * 66 - 20, -150, 40, 2); }
    poly(g, Bd, [-24, -170, 24, -170, 30, -200, 20, -226, -20, -226, -30, -200]);
    poly(g, B, [-20, -172, 4, -172, 4, -222, -16, -222, -26, -200]);
    rect(g, '#10141e', -22, -206, 44, 10);
    lighter(g, () => { rect(g, rgba('#9af0ff', 0.9), -20, -203, 40, 3); glow(g, 0, -201, 26, '#7ad8ff', 0.6 + 0.3 * Math.sin(t * 5)); });
    poly(g, Au, [-6, -226, 6, -226, 0, -244]);
    arm(1, o.armR || 0, false);
    for (let i = 0; i < 7; i++) poly(g, Ic, [-84 + i * 28, 2, -76 + i * 28, -22 - hx(i, 1, 111) * 24, -66 + i * 28, 2]);
    g.restore();
  }

  const tints = new WeakMap();
  function tinted(c, col, a) {
    let m = tints.get(c);
    if (!m) tints.set(c, m = new Map());
    const key = col + '|' + a;
    let out = m.get(key);
    if (!out) {
      out = G.mkCanvas(c.width, c.height);
      const g = out.getContext('2d');
      g.drawImage(c, 0, 0);
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = rgba(col, a);
      g.fillRect(0, 0, c.width, c.height);
      m.set(key, out);
    }
    return out;
  }

  const lookCache = new Map();
  const softBuf = { cv: null };
  function lookFor(who, v, game) {
    const fem = game && game.state && game.state.gender === 'f';
    const key = (typeof who === 'string' ? who : JSON.stringify(who)) + '|' + (who === 'trail' || who === '@' ? (fem ? 'f' : 'm') : '') + '|' + (v ? JSON.stringify(v) : '');
    let L = lookCache.get(key);
    if (!L) {
      const base = typeof who === 'string' ? (H.SPEAKERS[who] && H.SPEAKERS[who].look && !H.SPEAKERS[who].char ? H.SPEAKERS[who].look : G.lookOf(who, game)) : who;
      L = v ? Object.assign({}, base, v) : base;
      lookCache.set(key, L);
    }
    return L;
  }

  function stage(g, game, T) {
    const S = {
      g, game, T,
      look: (who, v) => lookFor(who, v, game),
      fig(who, x, y, o = {}) {
        const k = o.k || 1, c = G.figureCanvas(S.look(who, o.v), k), s = o.s || 1;
        const w = c.width * s, h = c.height * s, fy = G.FIG_FOOT * k * s;
        g.save();
        if (o.a != null) g.globalAlpha = cl(o.a);
        g.translate(Math.round(x), Math.round(y));
        if (o.rot) g.rotate(o.rot);
        if (o.flip) g.scale(-1, 1);
        g.drawImage(o.tint ? tinted(c, o.tint, o.ta == null ? 1 : o.ta) : c, Math.round(-w / 2), Math.round(-fy), Math.round(w), Math.round(h));
        g.restore();
      },
      bust(who, x, y, size, o = {}) {
        const c = G.bustCanvas(S.look(who, o.v), size), s = o.s || 1;
        g.save();
        if (o.a != null) g.globalAlpha = cl(o.a);
        g.translate(Math.round(x), Math.round(y));
        if (o.flip) g.scale(-1, 1);
        g.drawImage(o.tint ? tinted(c, o.tint, o.ta == null ? 1 : o.ta) : c, Math.round(-size * s / 2), Math.round(-size * s), Math.round(size * s), Math.round(size * s));
        g.restore();
      },
      foe(id, x, y, size, o = {}) {
        const m = G.FOE_META[id] || {}, c = G.foeCanvas(id, size, m.anim ? Math.floor(T * 2.2) % 2 : 0);
        g.save();
        if (o.a != null) g.globalAlpha = cl(o.a);
        g.translate(Math.round(x), Math.round(y));
        if (o.rot) g.rotate(o.rot);
        if (o.flip) g.scale(-1, 1);
        g.drawImage(o.tint ? tinted(c, o.tint, o.ta == null ? 1 : o.ta) : c, Math.round(-size / 2), Math.round(-size), size, size);
        if (o.flash) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = cl(o.flash); g.drawImage(c, Math.round(-size / 2), Math.round(-size), size, size); }
        g.restore();
      },
      sprite(who, dir, frame, x, y, o = {}) {
        const c = G.spriteCanvas(S.look(who, o.v), dir, frame);
        g.save();
        if (o.a != null) g.globalAlpha = cl(o.a);
        g.drawImage(o.tint ? tinted(c, o.tint, o.ta == null ? 1 : o.ta) : c, Math.round(x - c.width / 4), Math.round(y - c.height / 2), c.width / 2, c.height / 2);
        g.restore();
      },
      bg(name, t, o) { BG[name](g, t, o || {}); },
      soft(name, t, o, dim) {
        const tmp = softBuf.cv || (softBuf.cv = G.mkCanvas(LW / 2, LH / 2)), tg = tmp.getContext('2d');
        tg.save(); tg.scale(0.5, 0.5); BG[name](tg, t, o || {}); tg.restore();
        g.save(); g.imageSmoothingEnabled = true; g.drawImage(tmp, 0, 0, LW, LH); g.restore();
        if (dim) rect(g, rgba('#000000', dim), 0, 0, LW, LH);
      },
      cam(x, y, z, fn) { g.save(); g.translate(LW / 2, LH / 2); g.scale(z, z); g.translate(-x, -y); fn(); g.restore(); },
      shake(t, amp) { g.translate(Math.round(Math.sin(t * 61) * amp), Math.round(Math.cos(t * 47) * amp)); }
    };
    return S;
  }

  const Kit = {
    LW, LH, BAR, cl, lerp, sm, eOut, eIn, seg, hx, rgba, vgrad, hgrad, glow, lighter, poly, rect, ell, line, ring, stars, snowfall, embers, smoke, sparks, speedLines, hStreaks, glitch, shards, flash, vignette, hexShield, stellaron, planet, hertaStation, expressSide, drone, capsule, engine, BG, tinted
  };

  function closeup(bg, who, o = {}) {
    return S => {
      const t = S.t, d = S.d, g = S.g;
      S.soft(bg, S.T, o.bgo, o.dim == null ? 0.25 : o.dim);
      if (o.under) o.under(S);
      const push = lerp(1, o.push || 1.05, sm(t / d)), size = o.size || 132;
      const x = o.x != null ? o.x : o.side === 'l' ? 96 : o.side === 'r' ? 224 : 160;
      const drift = (o.drift || 0) * t;
      g.save(); g.translate(x + drift, LH - BAR + 6); g.scale(push, push);
      S.bust(who, 0, 0, size, { v: o.v, flip: o.flip, tint: o.tint, ta: o.ta });
      g.restore();
      if (o.fx) o.fx(S);
    };
  }

  function two(bg, left, right, o = {}) {
    return S => {
      const t = S.t, g = S.g;
      S.soft(bg, S.T, o.bgo, 0.3);
      const k = eOut(t / 0.5);
      S.bust(left, lerp(70, 88, k), LH - BAR + 6, o.size || 116, { v: o.vl, flip: true });
      S.bust(right, lerp(250, 232, k), LH - BAR + 6, o.size || 116, { v: o.vr });
      if (o.fx) o.fx(S);
    };
  }

  function dither(g) {
    const img = g.getImageData(0, 0, LW, LH), d = img.data;
    for (let y = 0, i = 0; y < LH; y++) {
      const row = (y & 3) << 2;
      for (let x = 0; x < LW; x++, i += 4) {
        const b = BAYER[row | (x & 3)] * 0.5 - 4;
        const r = d[i] + b, gg = d[i + 1] + b, bb = d[i + 2] + b;
        d[i] = r < 0 ? 0 : r > 255 ? 248 : (r >> 3) << 3;
        d[i + 1] = gg < 0 ? 0 : gg > 255 ? 248 : (gg >> 3) << 3;
        d[i + 2] = bb < 0 ? 0 : bb > 255 ? 248 : (bb >> 3) << 3;
        d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }

  const STILLS = {
    black: S => S.bg('black', S.T),
    vault: S => { S.bg('station', S.T, { kind: 'vault' }); vignette(S.g, 0.5); },
    wake: S => { S.soft('station', S.T, { kind: 'storage' }, 0.1); vignette(S.g, 0.8, '#1a0a2a'); lighter(S.g, () => glow(S.g, 160, 90, 120, '#c07aff', 0.2)); },
    station: S => S.bg('station', S.T, { kind: 'control' }),
    cargo: S => S.bg('station', S.T, { kind: 'storage' }),
    express: S => S.bg('parlor', S.T, { moving: true }),
    jarilo: S => S.bg('snow', S.T, { ruins: true }),
    snowgate: S => S.bg('snow', S.T, { wall: true }),
    belobog: S => S.bg('city', S.T, { fort: true }),
    fort: S => S.bg('fort', S.T),
    workshop: S => S.bg('workshop', S.T),
    hotel: S => S.bg('hotel', S.T, { night: true }),
    nightstreet: S => S.bg('city', S.T, { night: true }),
    alley: S => S.bg('alley', S.T),
    clinic: S => S.bg('under', S.T, { kind: 'clinic' }),
    boulder: S => S.bg('under', S.T, { kind: 'town' }),
    grandhotel: S => S.bg('under', S.T, { kind: 'hotel' }),
    mine: S => S.bg('mine', S.T),
    rivet: S => S.bg('rivet', S.T),
    settlement: S => S.bg('rivet', S.T, { kind: 'factory' }),
    restricted: S => S.bg('front', S.T),
    everwinter: S => S.bg('hill', S.T),
    summit: S => { S.bg('hill', S.T, { summit: true }); },
    pathspace: S => S.bg('void', S.T, { shards: ['city', 'snow', 'ice', 'fire'] }),
    monument: S => S.bg('city', S.T, { sun: true, monument: true })
  };

  const stillBuf = { cv: null };
  function still(ctx, id, w, h, t, game) {
    const fn = STILLS[id];
    if (!fn) return false;
    if (!stillBuf.cv) stillBuf.cv = G.mkCanvas(LW, LH);
    const cv = stillBuf.cv, g = cv.getContext('2d');
    g.save(); g.imageSmoothingEnabled = false;
    const S = stage(g, game, t);
    S.t = t; S.d = 1;
    fn(S);
    g.restore();
    dither(g);
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, 0, 0, w, h);
    ctx.imageSmoothingEnabled = was;
    return true;
  }

  class Player {
    constructor(ui, id) {
      this.ui = ui; this.game = ui.game; this.id = id;
      this.def = H.Cine.CINES[id];
      this.shots = this.def.shots;
      this.i = 0; this.t = 0; this.T = 0; this.cue = 0; this.done = false; this.fadeOut = 0;
      this.cv = G.mkCanvas(LW, LH); this.g = this.cv.getContext('2d');
      this.prevMusic = ui.audio && ui.audio.track;
      if (this.def.music && ui.audio) ui.audio.music(this.def.music);
    }

    shot() { return this.shots[Math.min(this.i, this.shots.length - 1)]; }

    tick(dt) {
      if (this.done) return;
      if (this.fadeOut > 0) { this.fadeOut += dt; if (this.fadeOut > 0.45) this.finish(); return; }
      this.t += dt; this.T += dt;
      const s = this.shot();
      const cues = s.sfx || [];
      while (this.cue < cues.length && cues[this.cue][0] <= this.t) this.ui.sfx(cues[this.cue++][1]);
      if (this.t >= s.d) this.next();
    }

    next() {
      if (this.i >= this.shots.length - 1) { this.fadeOut = Math.max(this.fadeOut, 0.001); return; }
      this.i++; this.t = 0; this.cue = 0;
    }

    finish() {
      this.done = true;
      if (this.def.music && !this.def.keepMusic && this.prevMusic && this.ui.audio) this.ui.audio.music(this.prevMusic);
    }

    key(k) {
      if (this.done) return;
      if (k === 'ok') this.next();
      else if (k === 'back') this.fadeOut = Math.max(this.fadeOut, 0.2);
    }

    sub() {
      const s = this.shot(), subs = s.sub || [];
      let cur = null;
      for (const sb of subs) if (sb[0] <= this.t) cur = sb;
      if (!cur) return null;
      const line = cur[1], i = line.indexOf('|'), head = line.slice(0, i), eq = head.indexOf('=');
      const spk = eq < 0 ? head : head.slice(0, eq);
      const name = eq >= 0 ? head.slice(eq + 1) : spk === '@' ? this.game.state.name : spk ? (H.SPEAKERS[spk] || { name: spk }).name : '';
      return { name: this.game.fill(name), text: this.game.fill(line.slice(i + 1)), age: this.t - cur[0] };
    }

    draw(c) {
      const g = this.g, s = this.shot(), ui = this.ui;
      g.save();
      g.imageSmoothingEnabled = false;
      const S = stage(g, this.game, this.T);
      S.t = Math.min(this.t, s.d); S.d = s.d; S.i = this.i;
      s.draw(S);
      g.restore();
      const inA = this.i === 0 ? 1 - cl(this.t / 0.4) : 0;
      const cut = s.cut === false ? 0 : 1 - cl(this.t / 0.12);
      if (inA > 0) flash(g, '#000000', inA);
      if (cut > 0 && this.i > 0 && s.fadeIn) flash(g, s.fadeIn, cut);
      dither(g);
      const was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(this.cv, 0, 0, W, HGT);
      c.imageSmoothingEnabled = was;
      c.fillStyle = '#000000';
      c.fillRect(0, 0, W, BAR * 2);
      c.fillRect(0, HGT - BAR * 2, W, BAR * 2);
      const sb = this.sub();
      if (sb) {
        const a = cl(sb.age / 0.15);
        c.globalAlpha = a;
        const lines = ui.wrap(sb.text, W - 120, 13).slice(0, 2), y0 = HGT - BAR * 2 + (lines.length > 1 ? 8 : 16);
        if (sb.name) ui.text(sb.name, W / 2, y0 - 2, { align: 'center', size: 11, bold: true, serif: true, col: C.gold });
        lines.forEach((l, j) => ui.text(l, W / 2, y0 + 13 + j * 16, { align: 'center', size: 13, col: C.cream }));
        c.globalAlpha = 1;
      }
      ui.hints([['Enter', 'Дальше'], ['Esc', 'Пропустить']], W - 12, 20, { align: 'right' });
      ui.hit(0, 0, W, HGT, () => this.key('ok'));
      if (this.fadeOut > 0) { c.fillStyle = 'rgba(0,0,0,' + cl(this.fadeOut / 0.45).toFixed(3) + ')'; c.fillRect(0, 0, W, HGT); }
    }
  }

  H.Cine = { CINES: {}, STILLS, Player, still, Kit, closeup, two, stage, dither };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
