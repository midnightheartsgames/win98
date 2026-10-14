(function (G) {
  'use strict';
  const { T, hash2, clamp, VEHICLES, WEAPONS, PICKUPS } = G;

  const FLOOR = 12;
  const D0 = 720;
  const ZMAX = 0.72;

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
    const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
    const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  const mix = (a, b, t) => {
    const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    const c = k => Math.round(((x >> k) & 255) * (1 - t) + ((y >> k) & 255) * t);
    return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
  };

  function rrect(x, a, b, w, h, r) {
    x.beginPath();
    x.moveTo(a + r, b); x.lineTo(a + w - r, b); x.quadraticCurveTo(a + w, b, a + w, b + r);
    x.lineTo(a + w, b + h - r); x.quadraticCurveTo(a + w, b + h, a + w - r, b + h);
    x.lineTo(a + r, b + h); x.quadraticCurveTo(a, b + h, a, b + h - r);
    x.lineTo(a, b + r); x.quadraticCurveTo(a, b, a + r, b);
    x.closePath();
  }

  function makeCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  }

  function drawCarBody(x, m, color, burnt) {
    const L = m.L, W = m.W;
    const body = burnt ? '#2a2622' : color;
    const dark = burnt ? '#141210' : shade(color, 0.62);
    const light = burnt ? '#3a3430' : shade(color, 1.18);
    const glass = burnt ? '#0c0c0c' : '#27313c';
    const glassHi = burnt ? '#1a1a1a' : '#4a5a6a';
    const sh = m.shape;
    x.lineWidth = 0.8;
    if (sh === 'bike') {
      x.fillStyle = '#1a1a1a'; x.fillRect(-L / 2, -1.2, 5, 2.4); x.fillRect(L / 2 - 5, -1.2, 5, 2.4);
      x.fillStyle = body; rrect(x, -L / 2 + 4, -W / 2 + 1.5, L - 8, W - 3, 2); x.fill();
      x.fillStyle = '#b0b0b0'; x.fillRect(L / 2 - 7, -W / 2, 1.2, W);
      return;
    }
    if (sh === 'tank') {
      x.fillStyle = '#23241e'; x.fillRect(-L / 2, -W / 2, L, 7); x.fillRect(-L / 2, W / 2 - 7, L, 7);
      x.fillStyle = '#3a3b30'; for (let k = -L / 2 + 2; k < L / 2; k += 4) { x.fillRect(k, -W / 2, 2, 7); x.fillRect(k, W / 2 - 7, 2, 7); }
      x.fillStyle = burnt ? body : '#4a5a36'; rrect(x, -L / 2 + 3, -W / 2 + 6, L - 6, W - 12, 3); x.fill();
      x.strokeStyle = dark; x.stroke();
      x.fillStyle = burnt ? body : '#56683e'; x.beginPath(); x.arc(2, 0, 9, 0, Math.PI * 2); x.fill(); x.stroke();
      x.fillStyle = '#2a3020'; x.fillRect(8, -1.6, 30, 3.2);
      x.fillStyle = '#c02020'; x.beginPath(); x.moveTo(-4, -3); x.lineTo(-2, 1); x.lineTo(-6, 1); x.closePath(); x.fill();
      return;
    }
    if (sh === 'boat' || sh === 'raketa') {
      x.fillStyle = body; x.strokeStyle = dark;
      x.beginPath(); x.moveTo(L / 2, 0); x.quadraticCurveTo(L * 0.25, -W / 2, -L / 2 + 2, -W / 2 + 1); x.lineTo(-L / 2, W / 2 - 1); x.quadraticCurveTo(L * 0.25, W / 2, L / 2, 0); x.closePath(); x.fill(); x.stroke();
      if (sh === 'raketa') {
        x.fillStyle = '#c8ccd4'; rrect(x, -L * 0.36, -W / 2 + 3, L * 0.62, W - 6, 4); x.fill();
        x.fillStyle = glass; for (let k = -L * 0.32; k < L * 0.22; k += 6) { x.fillRect(k, -W / 2 + 3.5, 4, 2); x.fillRect(k, W / 2 - 5.5, 4, 2); }
        x.fillStyle = '#c02020'; x.fillRect(-L * 0.36, -1, L * 0.62, 2);
      } else {
        x.fillStyle = '#6a4a2a'; x.fillRect(-L * 0.1, -W / 2 + 2.5, 4, W - 5); x.fillRect(-L * 0.35, -W / 2 + 2.5, 4, W - 5);
        x.fillStyle = glass; x.fillRect(L * 0.08, -W / 2 + 3, 3, W - 6);
        x.fillStyle = '#303030'; x.fillRect(-L / 2 - 3, -2, 4, 4);
      }
      return;
    }
    const round = sh === 'zaz' ? 6 : sh === 'merc' || sh === 'hatch' ? 4 : sh === 'bus' || sh === 'truck' ? 2 : 3.5;
    x.fillStyle = '#141414';
    x.fillRect(L * 0.22, -W / 2 - 0.8, L * 0.15, 1.6); x.fillRect(L * 0.22, W / 2 - 0.8, L * 0.15, 1.6);
    x.fillRect(-L * 0.36, -W / 2 - 0.8, L * 0.15, 1.6); x.fillRect(-L * 0.36, W / 2 - 0.8, L * 0.15, 1.6);
    if (sh === 'truck') {
      const cab = L * 0.3;
      x.fillStyle = body; rrect(x, L / 2 - cab, -W / 2, cab, W, 3); x.fill(); x.strokeStyle = dark; x.stroke();
      x.fillStyle = glass; x.fillRect(L / 2 - cab * 0.45, -W / 2 + 2, cab * 0.22, W - 4);
      x.fillStyle = light; x.fillRect(L / 2 - cab + 2, -W / 2 + 2, cab * 0.4, W - 4);
      const bedColor = burnt ? body : color === '#d06a20' ? '#6a5a3a' : '#7a6444';
      x.fillStyle = bedColor; x.fillRect(-L / 2, -W / 2 + 0.5, L - cab - 2, W - 1);
      x.strokeStyle = burnt ? dark : '#4a3a24';
      for (let k = -L / 2 + 4; k < L / 2 - cab - 2; k += 5) { x.beginPath(); x.moveTo(k, -W / 2 + 1); x.lineTo(k, W / 2 - 1); x.stroke(); }
      x.strokeStyle = dark; x.strokeRect(-L / 2, -W / 2 + 0.5, L - cab - 2, W - 1);
      x.fillStyle = '#ffe890'; x.fillRect(L / 2 - 1.5, -W / 2 + 1, 1.5, 3); x.fillRect(L / 2 - 1.5, W / 2 - 4, 1.5, 3);
      return;
    }
    if (sh === 'bus') {
      x.fillStyle = body; rrect(x, -L / 2, -W / 2, L, W, 3); x.fill(); x.strokeStyle = dark; x.stroke();
      x.fillStyle = light; x.fillRect(-L / 2 + 3, -W / 2 + 3, L - 8, W - 6);
      x.fillStyle = glass; x.fillRect(-L / 2 + 3, -W / 2 + 0.5, L - 8, 2); x.fillRect(-L / 2 + 3, W / 2 - 2.5, L - 8, 2);
      x.fillRect(L / 2 - 4, -W / 2 + 2, 3.5, W - 4);
      x.fillStyle = dark; for (let k = -L / 2 + 10; k < L / 2 - 10; k += 16) x.fillRect(k, -3, 7, 6);
      if (m.trolley) { x.strokeStyle = '#1a1a1a'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(-L * 0.05, -3.5); x.lineTo(-L * 0.62, -4.5); x.moveTo(-L * 0.05, 3.5); x.lineTo(-L * 0.62, 2.5); x.stroke(); }
      x.fillStyle = '#ffe890'; x.fillRect(L / 2 - 1.5, -W / 2 + 1, 1.5, 3); x.fillRect(L / 2 - 1.5, W / 2 - 4, 1.5, 3);
      return;
    }
    x.fillStyle = body; rrect(x, -L / 2, -W / 2, L, W, round); x.fill();
    x.strokeStyle = dark; x.stroke();
    const g = x.createLinearGradient(0, -W / 2, 0, W / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.22)');
    x.fillStyle = g; rrect(x, -L / 2, -W / 2, L, W, round); x.fill();
    let ws0, ws1, roof0, roof1, rw0, rw1;
    if (sh === 'van') { ws0 = L * 0.34; ws1 = L * 0.44; roof0 = -L * 0.46; roof1 = L * 0.34; rw0 = -L * 0.48; rw1 = -L * 0.46; }
    else if (sh === 'jeep') { ws0 = L * 0.12; ws1 = L * 0.2; roof0 = -L * 0.42; roof1 = L * 0.12; rw0 = -L * 0.46; rw1 = -L * 0.42; }
    else if (sh === 'hatch') { ws0 = L * 0.1; ws1 = L * 0.26; roof0 = -L * 0.3; roof1 = L * 0.1; rw0 = -L * 0.42; rw1 = -L * 0.3; }
    else if (sh === 'zaz') { ws0 = L * 0.02; ws1 = L * 0.18; roof0 = -L * 0.24; roof1 = L * 0.02; rw0 = -L * 0.34; rw1 = -L * 0.24; }
    else { ws0 = L * 0.1; ws1 = L * 0.26; roof0 = -L * 0.22; roof1 = L * 0.1; rw0 = -L * 0.34; rw1 = -L * 0.22; }
    const inset = W * 0.14;
    x.fillStyle = glass;
    x.beginPath(); x.moveTo(ws0, -W / 2 + inset); x.lineTo(ws1, -W / 2 + inset * 1.5); x.lineTo(ws1, W / 2 - inset * 1.5); x.lineTo(ws0, W / 2 - inset); x.closePath(); x.fill();
    x.fillStyle = glassHi; x.fillRect(ws0 + 1, -W / 2 + inset + 1, 1.2, W * 0.35);
    x.fillStyle = glass; x.fillRect(rw0, -W / 2 + inset, rw1 - rw0, W - inset * 2);
    x.fillStyle = sh === 'jeep' && !burnt && !m.police ? shade(color, 0.8) : light;
    rrect(x, roof0, -W / 2 + inset, roof1 - roof0, W - inset * 2, 2); x.fill();
    x.fillStyle = glass;
    x.fillRect(roof0 + 1, -W / 2 + inset - 1.2, roof1 - roof0 - 2, 1.4); x.fillRect(roof0 + 1, W / 2 - inset - 0.2, roof1 - roof0 - 2, 1.4);
    if (sh === 'zaz' && !burnt) { x.fillStyle = dark; for (let k = 0; k < 3; k++) x.fillRect(-L / 2 + 2 + k * 2.2, -W / 2 + 4, 1, W - 8); }
    if (sh === 'jeep') { x.fillStyle = '#1a1a1a'; x.beginPath(); x.arc(-L / 2 - 0.5, 0, 3, 0, Math.PI * 2); x.fill(); }
    if (!burnt) {
      x.fillStyle = '#fff4c0'; x.fillRect(L / 2 - 1.8, -W / 2 + 1.5, 1.8, 3); x.fillRect(L / 2 - 1.8, W / 2 - 4.5, 1.8, 3);
      x.fillStyle = '#a01818'; x.fillRect(-L / 2, -W / 2 + 1.5, 1.6, 3); x.fillRect(-L / 2, W / 2 - 4.5, 1.6, 3);
    }
    if (burnt) return;
    if (m.police) {
      x.fillStyle = m.kgb ? 'rgba(0,0,0,0)' : '#1e4aa8';
      if (!m.kgb) { x.fillRect(-L / 2 + 2, -W / 2 + 0.6, L - 4, 1.8); x.fillRect(-L / 2 + 2, W / 2 - 2.4, L - 4, 1.8); }
    }
    if (m.taxi) {
      x.fillStyle = '#111'; for (let k = 0; k < 6; k++) { x.fillRect(roof0 + 2 + k * 2.6, -W / 2 + 0.4, 1.3, 1.3); x.fillRect(roof0 + 2 + k * 2.6 + 1.3, -W / 2 + 1.7, 1.3, 1.3); }
      for (let k = 0; k < 6; k++) { x.fillRect(roof0 + 2 + k * 2.6, W / 2 - 1.7, 1.3, 1.3); x.fillRect(roof0 + 2 + k * 2.6 + 1.3, W / 2 - 3, 1.3, 1.3); }
      x.fillStyle = '#20e040'; x.fillRect(roof1 - 4, -1.5, 2.2, 3);
    }
    if (m.armored) { x.fillStyle = '#3a4a3a'; x.fillRect(-L * 0.4, -W / 2 + 2, L * 0.6, W - 4); x.fillStyle = '#e0e0c0'; x.font = 'bold 4px Arial'; x.save(); x.rotate(Math.PI / 2); x.textAlign = 'center'; x.fillText('ИНКАС', 0, L * 0.12); x.restore(); }
    if (m.id === 'raf' && color === '#e6e2d6') { x.fillStyle = '#c02020'; x.fillRect(-L * 0.2, -2, L * 0.3, 4); x.fillRect(-L * 0.05 - 2, -5, 4, 10); }
  }

  class Renderer {
    constructor(canvas, city) {
      this.cv = canvas;
      this.x = canvas.getContext('2d');
      this.city = city;
      this.chunks = new Map();
      this.sprites = new Map();
      this.W = canvas.width; this.H = canvas.height;
      this.cam = { x: 0, y: 0, zoom: 1 };
      this.time = 0;
      this.shake = 0;
      this.sx = 0; this.sy = 0;
      this.list = [];
      this.FLOOR = FLOOR;
      this.light = [0.42, -0.5];
      this.groundInit();
      this.bldgInit();
      this.heads = this.signalHeads();
    }

    resize(w, h) { this.W = w; this.H = h; this.cv.width = w; this.cv.height = h; }

    D() { return D0 / this.cam.zoom; }
    proj(x, y, z) {
      const c = this.cam;
      const D = D0 / c.zoom;
      const zz = Math.min(z || 0, D * ZMAX);
      const p = c.zoom * D / (D - zz);
      return [this.W / 2 + (x - c.x) * p + this.sx, this.H / 2 + (y - c.y) * p + this.sy];
    }
    pz(z) { const D = D0 / this.cam.zoom; const zz = Math.min(z, D * ZMAX); return D / (D - zz); }

    chunk(cx, cy) {
      const key = cx + ',' + cy;
      let c = this.chunks.get(key);
      if (c) { this.chunks.delete(key); this.chunks.set(key, c); return c; }
      c = this.groundChunk(cx, cy);
      this.chunks.set(key, c);
      if (this.chunks.size > 56) this.chunks.delete(this.chunks.keys().next().value);
      return c;
    }

    signalHeads() {
      const net = this.city.net, M = this.city.M, out = [];
      for (const n of net.nodes) {
        if (n.light < 0 || !n.arms) continue;
        for (const a of n.arms) {
          const d = a.d + 1.2 * M;
          const x = n.x + a.ux * d - a.uy * (a.hw + 1.4 * M), y = n.y + a.uy * d + a.ux * (a.hw + 1.4 * M);
          out.push({ type: 'signal', x, y, light: n.light, group: a.group, a: Math.atan2(-a.uy, -a.ux) });
        }
      }
      return out;
    }

    draw(world, cam, opts) {
      const o = opts || {};
      const x = this.x, city = this.city;
      this.time += o.dt || 0.016;
      this.cam = cam;
      this.shake = Math.max(0, this.shake - (o.dt || 0.016) * 2);
      this.sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 14 : 0;
      this.sy = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 14 : 0;
      const W = this.W, H = this.H, z = cam.zoom;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.imageSmoothingEnabled = true;
      x.fillStyle = '#141618';
      x.fillRect(0, 0, W, H);
      const hw = W / 2 / z, hh = H / 2 / z;
      const wx0 = cam.x - hw - Math.abs(this.sx) / z, wy0 = cam.y - hh - Math.abs(this.sy) / z, wx1 = cam.x + hw + Math.abs(this.sx) / z, wy1 = cam.y + hh + Math.abs(this.sy) / z;
      const cs = city.chunkSize;
      for (let cy = Math.floor(wy0 / cs); cy <= Math.floor(wy1 / cs); cy++) for (let cx = Math.floor(wx0 / cs); cx <= Math.floor(wx1 / cs); cx++) {
        if (cx < 0 || cy < 0 || cx * cs >= city.W || cy * cs >= city.H) continue;
        const c = this.chunk(cx, cy);
        const [sx, sy] = this.proj(cx * cs, cy * cs, 0);
        x.drawImage(c, Math.floor(sx), Math.floor(sy), Math.ceil(cs * z) + 1, Math.ceil(cs * z) + 1);
      }
      this.waterGlints(wx0, wy0, wx1, wy1);
      this.drawDecals(world, wx0, wy0, wx1, wy1);
      if (o.markers) this.drawGroundMarkers(o.markers);
      this.drawPickups(world, wx0, wy0, wx1, wy1);
      const inView = e => e.x > wx0 - 120 && e.x < wx1 + 120 && e.y > wy0 - 120 && e.y < wy1 + 120;
      for (const p of world.peds) if (p.dead && !p.hidden && inView(p)) this.drawPed(p);
      for (const c of world.cars) if (c.m.boat && inView(c)) this.drawCar(c);
      for (const c of world.cars) if (!c.m.boat && inView(c) && (c.dead || c.parked)) this.drawCar(c);
      for (const p of world.peds) if (!p.dead && !p.car && !p.invisible && inView(p)) this.drawPed(p);
      for (const c of world.cars) if (!c.m.boat && inView(c) && !c.dead && !c.parked) this.drawCar(c);
      this.drawTrams(world, inView);
      this.drawShots(world);
      this.drawTall(world, wx0, wy0, wx1, wy1);
      this.drawFx(world, inView);
      if (o.markers) this.drawMarkers(o.markers);
      this.drawTexts(world);
      this.edgeFog(wx0, wy0, wx1, wy1);
    }

    edgeFog(wx0, wy0, wx1, wy1) {
      const city = this.city, x = this.x;
      if (city.inPlay(wx0, wy0) && city.inPlay(wx1, wy0) && city.inPlay(wx0, wy1) && city.inPlay(wx1, wy1)) return;
      x.save();
      x.fillStyle = 'rgba(10,12,16,0.45)';
      x.beginPath();
      x.rect(0, 0, this.W, this.H);
      for (const r of city.plays) {
        const q = this.proj(r[0], r[1], 0);
        x.moveTo(q[0], q[1]);
        for (let i = r.length - 2; i >= 2; i -= 2) { const s = this.proj(r[i], r[i + 1], 0); x.lineTo(s[0], s[1]); }
        x.closePath();
      }
      x.fill('evenodd');
      x.restore();
    }

    waterGlints(wx0, wy0, wx1, wy1) {
      const x = this.x, city = this.city;
      const t = this.time, z = this.cam.zoom;
      x.fillStyle = 'rgba(200,225,255,0.2)';
      const step = 48;
      for (let gy = Math.floor(wy0 / step) * step; gy < wy1; gy += step) for (let gx = Math.floor(wx0 / step) * step; gx < wx1; gx += step) {
        if (!city.isWater(gx + 24, gy + 24)) continue;
        const h = hash2(gx / step | 0, gy / step | 0, 9);
        if (h > 0.4) continue;
        const ph = (t * 0.45 + h * 10) % 1;
        const [sx, sy] = this.proj(gx + 6 + ph * 30, gy + 10 + h * 60 % 26, 0);
        x.globalAlpha = Math.sin(ph * Math.PI) * 0.8;
        x.fillRect(sx, sy, 9 * z, 1.6 * z);
      }
      x.globalAlpha = 1;
    }

    drawTall(world, wx0, wy0, wx1, wy1) {
      const city = this.city, cam = this.cam;
      const list = this.list; list.length = 0;
      const key = (px, py) => { const dx = Math.abs(px - cam.x), dy = Math.abs(py - cam.y); return Math.max(dx, dy) + Math.min(dx, dy) * 0.5; };
      const C = 256, pad = 80;
      const near = this._nearB || (this._nearB = new Map());
      near.clear();
      for (let cy = Math.floor((wy0 - pad) / C); cy <= Math.floor((wy1 + pad) / C); cy++) for (let cx = Math.floor((wx0 - pad) / C); cx <= Math.floor((wx1 + pad) / C); cx++) {
        if (cx < 0 || cy < 0) continue;
        for (const pc of this.piecesFor(cx, cy)) {
          const d = key(pc.cx, pc.cy);
          list.push({ k: 0, pc, d });
          const b = pc.b;
          if (b.style !== 'r' && !b.kind) continue;
          const it = near.get(b.id);
          if (!it) { const deco = { k: 1, b, L: pc.L, d: d - 0.5 }; near.set(b.id, deco); list.push(deco); }
          else if (d - 0.5 < it.d) it.d = d - 0.5;
        }
      }
      const buf = this._pb || (this._pb = []);
      for (const k of city.propsNear((wx0 + wx1) / 2, (wy0 + wy1) / 2, Math.max(wx1 - wx0, wy1 - wy0) / 2 + 60, buf)) {
        const p = city.props[k];
        list.push({ k: 2, p, d: key(p.x, p.y) - 1 });
      }
      for (const h of this.heads) if (h.x > wx0 - 40 && h.x < wx1 + 40 && h.y > wy0 - 40 && h.y < wy1 + 40) list.push({ k: 2, p: h, d: key(h.x, h.y) - 1 });
      list.sort((a, b) => b.d - a.d);
      for (const it of list) {
        if (it.k === 0) this.drawPiece(it.pc);
        else if (it.k === 1) this.drawDeco(it.b, it.L);
        else this.drawProp(it.p, world);
      }
    }

    drawTrams(world, inView) {
      const x = this.x, z = this.cam.zoom;
      for (const tr of world.trams || []) {
        for (const car of tr.cars) {
          if (!inView(car)) continue;
          const [sx, sy] = this.proj(car.x, car.y, 0);
          const L = car.L, Wd = car.W;
          x.save(); x.translate(sx, sy); x.rotate(car.a); x.scale(z, z);
          x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(-L / 2 + 4, -Wd / 2 + 4, L, Wd);
          x.fillStyle = tr.color || '#c8282a'; rrect(x, -L / 2, -Wd / 2, L, Wd, 5); x.fill();
          x.fillStyle = '#efe6cf'; x.fillRect(-L / 2 + 4, -Wd / 2 + 1, L - 8, 4); x.fillRect(-L / 2 + 4, Wd / 2 - 5, L - 8, 4);
          x.fillStyle = '#b8b4ac'; rrect(x, -L / 2 + 6, -Wd / 2 + 6, L - 12, Wd - 12, 3); x.fill();
          x.fillStyle = '#3a3a3c'; for (let k = -L / 2 + 14; k < L / 2 - 14; k += 16) x.fillRect(k, -3, 8, 6);
          x.fillStyle = '#26303a';
          if (car.head) x.fillRect(L / 2 - 4, -Wd / 2 + 4, 3, Wd - 8);
          if (car.tail) x.fillRect(-L / 2 + 1, -Wd / 2 + 4, 3, Wd - 8);
          x.strokeStyle = '#202020'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-6, 0); x.lineTo(14, 0); x.stroke();
          if (car.head) { x.fillStyle = '#fff4c0'; x.fillRect(L / 2 - 1.5, -Wd / 2 + 3, 1.5, 4); x.fillRect(L / 2 - 1.5, Wd / 2 - 7, 1.5, 4); }
          x.restore();
        }
      }
    }

    drawProp(p, world) {
      const x = this.x, z = this.cam.zoom;
      if (p.type === 'tree') {
        const hgt = 34 + p.r;
        const [sx, sy] = this.proj(p.x, p.y, hgt);
        const k = this.pz(hgt) * z;
        const base = p.k ? '#9a8a2a' : p.c;
        x.fillStyle = shade(base, 0.7); x.beginPath(); x.arc(sx, sy, p.r * 1.25 * k, 0, Math.PI * 2); x.fill();
        x.fillStyle = base; x.beginPath(); x.arc(sx - p.r * k * 0.18, sy + p.r * k * 0.12, p.r * k * 0.95, 0, Math.PI * 2); x.fill();
        x.fillStyle = shade(base, 1.28); x.beginPath(); x.arc(sx - p.r * k * 0.4, sy + p.r * k * 0.3, p.r * k * 0.45, 0, Math.PI * 2); x.fill();
        if (p.k) { x.fillStyle = 'rgba(200,120,30,0.45)'; x.beginPath(); x.arc(sx + p.r * k * 0.3, sy - p.r * k * 0.2, p.r * k * 0.4, 0, Math.PI * 2); x.fill(); }
      } else if (p.type === 'lamp') {
        if (p.down) {
          const [gx, gy] = this.proj(p.x, p.y, 0);
          x.strokeStyle = '#6a6a66'; x.lineWidth = 2.5 * z; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + Math.cos(p.downA) * 30 * z, gy + Math.sin(p.downA) * 30 * z); x.stroke();
          return;
        }
        const [gx, gy] = this.proj(p.x, p.y, 0), [tx, ty] = this.proj(p.x, p.y, 36);
        x.strokeStyle = '#7a7a74'; x.lineWidth = 2.6 * z; x.beginPath(); x.moveTo(gx, gy); x.lineTo(tx, ty); x.stroke();
        const [hx, hy] = this.proj(p.x + Math.cos(p.a) * 14, p.y + Math.sin(p.a) * 14, 36);
        x.lineWidth = 1.8 * z; x.beginPath(); x.moveTo(tx, ty); x.lineTo(hx, hy); x.stroke();
        x.fillStyle = '#e8e4c8'; x.beginPath(); x.ellipse(hx, hy, 3.6 * z, 2.2 * z, p.a, 0, Math.PI * 2); x.fill();
      } else if (p.type === 'signal') {
        const st = this.city.lightState(p.light, p.group, world ? world.t : this.time);
        const [gx, gy] = this.proj(p.x, p.y, 0), [hx, hy] = this.proj(p.x, p.y, 26);
        x.strokeStyle = '#2a2a2a'; x.lineWidth = 2 * z; x.beginPath(); x.moveTo(gx, gy); x.lineTo(hx, hy); x.stroke();
        x.save(); x.translate(hx, hy); x.rotate(p.a); x.scale(z, z);
        x.fillStyle = '#151515'; x.fillRect(-3.5, -9, 7, 18);
        x.fillStyle = st === 2 ? '#ff2a20' : '#401010'; x.beginPath(); x.arc(0, -5.5, 2.4, 0, Math.PI * 2); x.fill();
        x.fillStyle = st === 1 ? '#ffc020' : '#403010'; x.beginPath(); x.arc(0, 0, 2.4, 0, Math.PI * 2); x.fill();
        x.fillStyle = st === 0 ? '#30e050' : '#103a18'; x.beginPath(); x.arc(0, 5.5, 2.4, 0, Math.PI * 2); x.fill();
        x.restore();
      } else if (p.type === 'phone') {
        const [gx, gy] = this.proj(p.x, p.y, 0), [tx, ty] = this.proj(p.x, p.y, 22);
        const k = this.pz(22) * z;
        x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(gx - 5 * z, gy - 3 * z, 12 * z, 10 * z);
        x.fillStyle = '#9a9a96'; x.fillRect(gx - 6 * z, gy - 6 * z, 12 * z, 12 * z);
        x.fillStyle = '#c02020'; x.fillRect(tx - 7 * k, ty - 7 * k, 14 * k, 14 * k);
        x.fillStyle = '#e8e0c8'; x.fillRect(tx - 5 * k, ty - 1.8 * k, 10 * k, 3.6 * k);
        if (world && world.ringing && world.ringing.has(p.id)) {
          const r = (this.time * 2) % 1;
          x.strokeStyle = 'rgba(255,230,60,' + (1 - r) + ')'; x.lineWidth = 2;
          x.beginPath(); x.arc(tx, ty, (9 + r * 24) * k, 0, Math.PI * 2); x.stroke();
        }
      } else if (p.type === 'monument') {
        const hgt = p.h || 30;
        const [gx, gy] = this.proj(p.x, p.y, 0), [tx, ty] = this.proj(p.x, p.y, hgt);
        const k0 = z, k1 = this.pz(hgt) * z, s = p.s || 12;
        x.fillStyle = '#8a8680'; x.fillRect(gx - s * k0, gy - s * k0, 2 * s * k0, 2 * s * k0);
        x.fillStyle = '#6a6660';
        x.beginPath(); x.moveTo(gx - s * k0, gy + s * k0); x.lineTo(tx - s * 0.7 * k1, ty + s * 0.7 * k1); x.lineTo(tx + s * 0.7 * k1, ty + s * 0.7 * k1); x.lineTo(gx + s * k0, gy + s * k0); x.closePath(); x.fill();
        x.fillStyle = '#9a968e'; x.fillRect(tx - s * 0.7 * k1, ty - s * 0.7 * k1, 1.4 * s * k1, 1.4 * s * k1);
        x.fillStyle = p.bronze ? '#5a4a30' : '#3a4a3c'; x.beginPath(); x.arc(tx, ty, s * 0.42 * k1, 0, Math.PI * 2); x.fill();
        if (this.cam.zoom > 0.6 && p.name) { x.font = 'bold ' + Math.round(9 * z) + 'px Tahoma'; x.textAlign = 'center'; x.fillStyle = 'rgba(255,255,230,0.85)'; x.fillText(p.name, tx, ty + s * 1.6 * k1); }
      } else if (p.type === 'stop') {
        const [gx, gy] = this.proj(p.x, p.y, 0), [tx, ty] = this.proj(p.x, p.y, 24);
        const k = this.pz(24) * z;
        x.save(); x.translate(tx, ty); x.rotate(p.a); x.scale(k, k);
        x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(-18, -4, 36, 12);
        x.fillStyle = '#7a8a98'; x.fillRect(-18, -7, 36, 12);
        x.fillStyle = '#a8c0d0'; x.fillRect(-16, -5, 32, 8);
        x.restore();
        x.fillStyle = p.tram ? '#e8e0c0' : '#e0d040'; x.fillRect(gx - 3 * z, gy - 9 * z, 6 * z, 6 * z);
        x.fillStyle = '#202020'; x.font = 'bold ' + Math.round(6 * z) + 'px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.tram ? 'Т' : 'А', gx, gy - 6 * z);
      } else if (p.type === 'fountain') {
        const [gx, gy] = this.proj(p.x, p.y, 0), [tx, ty] = this.proj(p.x, p.y, 8);
        const r = p.r * z;
        x.fillStyle = '#9a968e'; x.beginPath(); x.arc(gx, gy, r * 1.15, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#3c6a8a'; x.beginPath(); x.arc(gx, gy, r, 0, Math.PI * 2); x.fill();
        const w = 4 + Math.sin(this.time * 9) * 1.5;
        x.fillStyle = 'rgba(220,240,255,0.7)'; x.beginPath(); x.arc(tx, ty, w * z, 0, Math.PI * 2); x.fill();
      } else if ((p.type === 'kiosk' || p.type === 'stallrow') && p.down) {
        const ca = Math.cos(p.a || 0), sa = Math.sin(p.a || 0);
        for (let k = 0; k < 9; k++) {
          const u = (hash2(k, Math.round(p.x), 61) - 0.5) * p.w * 1.3, v = (hash2(k, Math.round(p.y), 62) - 0.5) * p.d * 2.2;
          const [gx, gy] = this.proj(p.x + u * ca - v * sa, p.y + u * sa + v * ca, 0);
          x.save(); x.translate(gx, gy); x.rotate(hash2(k, 3, 63) * 6.3); x.scale(z, z);
          x.fillStyle = k % 3 === 0 ? (p.color || '#3a7ac0') : '#7a5a3a'; x.fillRect(-6, -1.5, 12, 3);
          x.fillStyle = ['#c83020', '#e8a020', '#5a9a30', '#e8d040'][k % 4]; x.beginPath(); x.arc(4, 4, 1.6, 0, Math.PI * 2); x.fill();
          x.restore();
        }
      } else if (p.type === 'stallrow') {
        const L = p.w, Wd = p.d, ca = Math.cos(p.a), sa = Math.sin(p.a);
        const P = (u, v, h) => this.proj(p.x + u * ca - v * sa, p.y + u * sa + v * ca, h);
        const quad = (u0, v0, u1, v1, h) => { const a = P(u0, v0, h), b = P(u1, v0, h), c = P(u1, v1, h), d = P(u0, v1, h); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.closePath(); };
        x.fillStyle = 'rgba(0,0,0,0.22)'; const sh = this.light; x.save(); x.translate(sh[0] * 10 * z, sh[1] * 10 * z); quad(-L / 2, -Wd / 2, L / 2, Wd / 2, 0); x.fill(); x.restore();
        x.fillStyle = '#6a5038'; quad(-L / 2, 0, L / 2, Wd / 2, 9); x.fill();
        const n = Math.floor(L / 6);
        for (let k = 0; k < n; k++) {
          const q = P(-L / 2 + (k + 0.5) * L / n, Wd * 0.34, 9);
          x.fillStyle = ['#c83020', '#e8a020', '#5a9a30', '#e8d040', '#7a3a7a', '#d86a30'][Math.floor(hash2(k, Math.round(p.x), 64) * 6)];
          x.beginPath(); x.arc(q[0], q[1], 2.2 * z, 0, Math.PI * 2); x.fill();
        }
        x.fillStyle = p.color; quad(-L / 2 - 3, -Wd / 2 - 2, L / 2 + 3, Wd * 0.18, 21); x.fill();
        x.fillStyle = 'rgba(0,0,0,0.14)';
        for (let u = -L / 2; u < L / 2; u += 22) { quad(u, -Wd / 2 - 2, Math.min(L / 2, u + 11), Wd * 0.18, 21); x.fill(); }
        x.strokeStyle = 'rgba(20,20,20,0.5)'; x.lineWidth = 1; quad(-L / 2 - 3, -Wd / 2 - 2, L / 2 + 3, Wd * 0.18, 21); x.stroke();
      } else if (p.type === 'kiosk') {
        const hgt = 22;
        const L = p.w || 26, Wd = p.d || 18;
        const ca = Math.cos(p.a || 0), sa = Math.sin(p.a || 0);
        const pts = [[-L / 2, -Wd / 2], [L / 2, -Wd / 2], [L / 2, Wd / 2], [-L / 2, Wd / 2]].map(([u, v]) => [p.x + u * ca - v * sa, p.y + u * sa + v * ca]);
        x.fillStyle = shade(p.color || '#3a7ac0', 0.75);
        for (let i = 0; i < 4; i++) {
          const a = pts[i], b = pts[(i + 1) % 4];
          const g0 = this.proj(a[0], a[1], 0), g1 = this.proj(b[0], b[1], 0), t1 = this.proj(b[0], b[1], hgt), t0 = this.proj(a[0], a[1], hgt);
          x.beginPath(); x.moveTo(g0[0], g0[1]); x.lineTo(g1[0], g1[1]); x.lineTo(t1[0], t1[1]); x.lineTo(t0[0], t0[1]); x.closePath(); x.fill();
        }
        x.fillStyle = '#e8e4d8';
        x.beginPath(); pts.forEach((q, i) => { const s = this.proj(q[0], q[1], hgt); if (i) x.lineTo(s[0], s[1]); else x.moveTo(s[0], s[1]); }); x.closePath(); x.fill();
        if (p.label && this.cam.zoom > 0.7) { const s = this.proj(p.x, p.y, hgt); x.font = 'bold ' + Math.round(6.5 * z) + 'px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = p.color || '#3a7ac0'; x.fillText(p.label, s[0], s[1]); }
      } else if (p.type === 'block') {
        const [tx, ty] = this.proj(p.x, p.y, 10);
        x.save(); x.translate(tx, ty); x.rotate(p.a || 0); x.scale(z, z);
        x.fillStyle = '#b8b0a0'; x.fillRect(-16, -5, 32, 10);
        x.fillStyle = '#d02020'; for (let k = -14; k < 16; k += 8) x.fillRect(k, -5, 4, 10);
        x.restore();
      } else if (p.type === 'crane') {
        const top = this.proj(p.x, p.y, p.h || 240), base = this.proj(p.x, p.y, 0);
        x.strokeStyle = '#d8a818'; x.lineWidth = 3 * z; x.beginPath(); x.moveTo(base[0], base[1]); x.lineTo(top[0], top[1]); x.stroke();
        const jib = this.proj(p.x + Math.cos(p.a || 0) * 200, p.y + Math.sin(p.a || 0) * 200, p.h || 240);
        x.lineWidth = 2.5 * z; x.beginPath(); x.moveTo(top[0], top[1]); x.lineTo(jib[0], jib[1]); x.stroke();
        x.strokeStyle = '#303030'; x.lineWidth = 1; x.beginPath(); x.moveTo(jib[0], jib[1]); x.lineTo(jib[0], jib[1] + 14 * z); x.stroke();
      }
    }

    minimap(scale) {
      const city = this.city, s = scale || 0.04;
      const w = Math.ceil(city.W * s), h = Math.ceil(city.H * s);
      const c = makeCanvas(w, h);
      const x = c.getContext('2d');
      x.fillStyle = '#1a1c1e'; x.fillRect(0, 0, w, h);
      x.scale(s, s);
      const ring = r => { x.moveTo(r[0], r[1]); for (let i = 2; i < r.length; i += 2) x.lineTo(r[i], r[i + 1]); x.closePath(); };
      x.fillStyle = '#c8c2b0'; x.beginPath(); for (const m of city.margins) ring(m); x.fill();
      const col = { w: '#5a86b0', p: '#8ab070', g: '#9cbc80', f: '#78a060', q: '#ddd6c2', s: '#9cbc80', b: '#e0d4a0' };
      for (const a of city.areas) { if (!col[a.kind]) continue; x.fillStyle = col[a.kind]; x.beginPath(); for (const r of a.rings) ring(r); x.fill('evenodd'); }
      x.lineCap = 'round'; x.lineJoin = 'round';
      x.fillStyle = '#9c8e7a';
      x.beginPath(); for (const b of city.buildings) ring(b.rings[0]); x.fill();
      for (const r of city.roads.concat(city.decor)) { x.strokeStyle = r.cls <= 1 ? '#f4e8a0' : '#fbfaf4'; x.lineWidth = Math.max(r.w, 2 / s); x.beginPath(); x.moveTo(r.pts[0], r.pts[1]); for (let i = 2; i < r.pts.length; i += 2) x.lineTo(r.pts[i], r.pts[i + 1]); x.stroke(); }
      x.fillStyle = '#fbfaf4'; for (const n of city.net.nodes) if (n.poly) { x.beginPath(); ring(n.poly); x.fill(); }
      x.strokeStyle = '#b02020'; x.lineWidth = 1.2 / s; x.setLineDash([6 / s, 4 / s]);
      for (const r of city.rails) if (r.kind === 't') { x.beginPath(); x.moveTo(r.pts[0], r.pts[1]); for (let i = 2; i < r.pts.length; i += 2) x.lineTo(r.pts[i], r.pts[i + 1]); x.stroke(); }
      x.setLineDash([]);
      x.fillStyle = 'rgba(20,20,24,0.5)'; x.beginPath(); x.rect(0, 0, city.W, city.H); for (const p of city.plays) { x.moveTo(p[0], p[1]); for (let i = p.length - 2; i >= 2; i -= 2) x.lineTo(p[i], p[i + 1]); x.closePath(); } x.fill('evenodd');
      x.strokeStyle = '#7a2020'; x.lineWidth = 2 / s; x.beginPath(); for (const p of city.plays) ring(p); x.stroke();
      return c;
    }

    sprite(mid, color, burnt) {
      const key = mid + '|' + color + '|' + (burnt ? 1 : 0);
      let s = this.sprites.get(key);
      if (s) return s;
      const m = VEHICLES[mid];
      const S = 2;
      const w = Math.ceil(m.L * S + 8), h = Math.ceil(m.W * S + 8);
      s = makeCanvas(w, h);
      const x = s.getContext('2d');
      x.translate(w / 2, h / 2); x.scale(S, S);
      drawCarBody(x, m, color, burnt);
      this.sprites.set(key, s);
      return s;
    }

    drawDecals(world, wx0, wy0, wx1, wy1) {
      const x = this.x, z = this.cam.zoom;
      for (const d of world.decals) {
        if (d.x < wx0 - 20 || d.x > wx1 + 20 || d.y < wy0 - 20 || d.y > wy1 + 20) continue;
        const [sx, sy] = this.proj(d.x, d.y, 0);
        const age = world.t - d.t;
        if (d.type === 'skid') {
          x.fillStyle = `rgba(20,20,20,${Math.max(0.05, 0.4 - age * 0.01)})`;
          x.save(); x.translate(sx, sy); x.rotate(d.a); x.fillRect(-4 * z, -1.3 * z, 8 * z, 2.6 * z); x.restore();
        } else if (d.type === 'blood') {
          x.fillStyle = 'rgba(110,10,10,0.75)';
          x.beginPath(); x.ellipse(sx, sy, d.r * z, d.r * 0.7 * z, d.a, 0, Math.PI * 2); x.fill();
        } else if (d.type === 'scorch') {
          const g = x.createRadialGradient(sx, sy, 0, sx, sy, d.r * z);
          g.addColorStop(0, 'rgba(10,8,6,0.8)'); g.addColorStop(1, 'rgba(10,8,6,0)');
          x.fillStyle = g; x.beginPath(); x.arc(sx, sy, d.r * z, 0, Math.PI * 2); x.fill();
        }
      }
    }

    planeShape(x) {
      x.beginPath();
      x.moveTo(30, 0); x.lineTo(24, -3); x.lineTo(-24, -3); x.lineTo(-30, -1); x.lineTo(-30, 1); x.lineTo(-24, 3); x.lineTo(24, 3); x.closePath();
      x.moveTo(6, -3); x.lineTo(-6, -28); x.lineTo(-12, -28); x.lineTo(-6, -3); x.closePath();
      x.moveTo(6, 3); x.lineTo(-6, 28); x.lineTo(-12, 28); x.lineTo(-6, 3); x.closePath();
      x.moveTo(-22, -3); x.lineTo(-28, -11); x.lineTo(-31, -11); x.lineTo(-28, -3); x.closePath();
      x.moveTo(-22, 3); x.lineTo(-28, 11); x.lineTo(-31, 11); x.lineTo(-28, 3); x.closePath();
    }

    drawPickups(world, wx0, wy0, wx1, wy1) {
      const x = this.x, z = this.cam.zoom;
      for (const k of world.pickups) {
        if (!k.active || k.hidden) continue;
        if (k.x < wx0 - 20 || k.x > wx1 + 20 || k.y < wy0 - 20 || k.y > wy1 + 20) continue;
        const def = PICKUPS[k.type];
        const bob = Math.sin(this.time * 4 + k.x) * 2;
        const [sx, sy] = this.proj(k.x, k.y, 4 + bob);
        x.save(); x.translate(sx, sy); x.scale(z, z);
        x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.ellipse(3, 5 - bob, 9, 5, 0, 0, Math.PI * 2); x.fill();
        x.rotate(Math.sin(this.time * 2 + k.y) * 0.3);
        x.fillStyle = '#6a4a2a'; x.fillRect(-9, -9, 18, 18);
        x.fillStyle = def.color; x.fillRect(-7, -7, 14, 14);
        x.strokeStyle = '#2a1a0a'; x.lineWidth = 1; x.strokeRect(-9, -9, 18, 18);
        x.fillStyle = k.type === 'health' ? '#d02020' : '#fff';
        x.font = 'bold ' + (def.label.length > 2 ? 7 : 10) + 'px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(def.label, 0, 1);
        x.restore();
      }
    }

    drawCar(c) {
      const x = this.x, z = this.cam.zoom;
      const m = c.m;
      const [sx, sy] = this.proj(c.x, c.y, 0);
      const spr = this.sprite(c.mid, c.color, c.dead);
      const sink = c.sinking ? Math.max(0.2, 1 - c.sinking * 0.6) : 1;
      x.save();
      x.translate(sx, sy);
      x.rotate(c.a);
      x.scale(z * sink, z * sink);
      if (!m.boat) { x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(-m.L / 2 + 3, -m.W / 2 + 3, m.L, m.W); }
      else if (Math.abs(c.fwd) > 40) { x.fillStyle = 'rgba(230,240,255,0.5)'; x.beginPath(); x.moveTo(-m.L / 2, 0); x.lineTo(-m.L / 2 - Math.abs(c.fwd) * 0.18, -m.W * 0.7); x.lineTo(-m.L / 2 - Math.abs(c.fwd) * 0.18, m.W * 0.7); x.closePath(); x.fill(); }
      if (c.sinking) x.globalAlpha = sink;
      x.drawImage(spr, -spr.width / 4, -spr.height / 4, spr.width / 2, spr.height / 2);
      if (!c.dead && c.hp < c.maxHp * 0.6) {
        x.fillStyle = 'rgba(30,20,10,' + (0.35 * (1 - c.hp / c.maxHp)) + ')';
        x.fillRect(m.L * 0.2, -m.W / 2 + 1, m.L * 0.28, m.W - 2);
      }
      if (m.police && !c.dead) {
        const on = (c.siren || c.flash) && Math.floor(this.time * 8) % 2 === 0;
        const off = c.siren || c.flash;
        x.fillStyle = m.kgb ? (off ? (on ? '#4060ff' : '#101830') : '#101010') : (on ? '#40a0ff' : off ? '#ff3030' : '#3060a0');
        if (m.kgb) x.fillRect(-2, -2, 4, 4); else { x.fillRect(-3, -m.W / 2 + 4, 4, m.W - 8); x.fillStyle = on ? '#ff3030' : '#2040ff'; x.fillRect(-3, -m.W / 2 + 4, 4, (m.W - 8) / 2); }
      }
      if (c.driver && m.bike) this.pedBody(c.driver, 0, 1);
      if (c.driver && m.boat && m.shape === 'boat') { x.save(); x.translate(-m.L * 0.3, 0); this.pedBody(c.driver, 0, 1); x.restore(); }
      if (c.bomb && !c.dead) { x.fillStyle = Math.floor(this.time * 4) % 2 ? '#ff2020' : '#400000'; x.beginPath(); x.arc(-m.L * 0.3, 0, 2.5, 0, Math.PI * 2); x.fill(); }
      x.restore();
    }

    pedBody(p, anim, sc) {
      const x = this.x;
      const L = p.look;
      x.scale(sc, sc);
      if (p.dead) {
        x.fillStyle = L.pants; x.fillRect(-9, -2.5, 8, 5);
        x.fillStyle = L.shirt; x.fillRect(-2, -4, 8, 8);
        x.fillStyle = L.skin; x.beginPath(); x.arc(8, 0, 3, 0, Math.PI * 2); x.fill();
        x.fillStyle = L.skin; x.fillRect(0, -7, 5, 2.5); x.fillRect(1, 4.5, 5, 2.5);
        return;
      }
      const sw = Math.sin(anim) * 4;
      x.fillStyle = L.pants;
      x.fillRect(sw - 2, -3.6, 4, 2.6); x.fillRect(-sw - 2, 1, 4, 2.6);
      const armed = p.isPlayer ? (p.cur && p.cur !== 'fist') : !!p.weapon && (p.state === 'attack' || p.state === 'chase' || p.state === 'guard');
      if (armed) { x.fillStyle = '#1a1a1a'; x.fillRect(3, 1.5, 9, 2); }
      x.fillStyle = L.shirt;
      x.beginPath(); x.ellipse(0, 0, 3.8, 6, 0, 0, Math.PI * 2); x.fill();
      if (L.stripes) { x.fillStyle = '#f0f0f0'; x.fillRect(-1, -6, 1, 12); }
      if (p.def && p.def.cop && !L.helmet) { x.fillStyle = '#c8b040'; x.fillRect(-1.5, -5.6, 2, 1.4); x.fillRect(-1.5, 4.2, 2, 1.4); }
      x.fillStyle = L.skin;
      const arm = armed ? 0 : -sw * 0.6;
      x.beginPath(); x.arc(arm + 0.5, -5.5, 1.7, 0, Math.PI * 2); x.arc(-arm + 0.5 + (armed ? 5 : 0), 5.5 + (armed ? -2 : 0), 1.7, 0, Math.PI * 2); x.fill();
      if (L.bag) { x.fillStyle = '#6a4a2a'; x.fillRect(-2, 6, 4, 3); }
      x.fillStyle = L.skin; x.beginPath(); x.arc(0.8, 0, 3.1, 0, Math.PI * 2); x.fill();
      if (L.scarf) { x.fillStyle = L.scarf; x.beginPath(); x.arc(0.3, 0, 3.4, Math.PI * 0.35, Math.PI * 1.65); x.fill(); x.beginPath(); x.arc(0.3, 0, 3.4, Math.PI * 0.6, Math.PI * 1.4); x.fill(); }
      else if (L.helmet) { x.fillStyle = L.helmet; x.beginPath(); x.arc(0.5, 0, 3.6, 0, Math.PI * 2); x.fill(); x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(1.5, -2, 1.5, 4); }
      else if (L.hat) { x.fillStyle = L.hat; x.beginPath(); x.arc(0.4, 0, 3.5, 0, Math.PI * 2); x.fill(); if (L.band) { x.strokeStyle = L.band; x.lineWidth = 1; x.beginPath(); x.arc(0.4, 0, 3.1, 0, Math.PI * 2); x.stroke(); } if (p.def && p.def.cop) { x.fillStyle = '#1a1a1a'; x.fillRect(3, -2, 1.6, 4); } }
      else { x.fillStyle = L.hair; x.beginPath(); x.arc(0, 0, 3.2, Math.PI * 0.55, Math.PI * 1.45); x.fill(); if (L.fem) { x.fillRect(-3.4, -2, 2, 4); } }
      if (L.glasses) { x.fillStyle = '#101010'; x.fillRect(3, -2, 1, 4); }
    }

    drawPed(p) {
      const x = this.x, z = this.cam.zoom;
      const [sx, sy] = this.proj(p.x, p.y, 0);
      x.save();
      x.translate(sx, sy);
      x.scale(z * 1.25, z * 1.25);
      x.fillStyle = 'rgba(0,0,0,0.28)';
      x.beginPath(); x.ellipse(1.5, 1.5, 5, 6.5, p.a, 0, Math.PI * 2); x.fill();
      x.rotate(p.a);
      if (p.down > 0 && !p.dead) x.rotate(p.down * 3);
      if (p.hurtT > 0) x.globalAlpha = 0.7;
      this.pedBody(p, p.anim, 1);
      if (p.state === 'hail' && !p.dead) { x.fillStyle = p.look.skin; x.fillRect(2, -9 - Math.abs(Math.sin(p.wave * 6)) * 3, 2, 4); }
      x.restore();
    }

    drawShots(world) {
      const x = this.x, z = this.cam.zoom;
      for (const s of world.shots) {
        if (s.kind === 'bullet') {
          const [a, b] = this.proj(s.x, s.y, 0);
          const [c, d] = this.proj(s.x - s.vx * 0.018, s.y - s.vy * 0.018, 0);
          x.strokeStyle = 'rgba(255,240,160,0.9)'; x.lineWidth = 1.5 * z;
          x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke();
        } else if (s.kind === 'rocket') {
          const [a, b] = this.proj(s.x, s.y, 6);
          x.save(); x.translate(a, b); x.rotate(Math.atan2(s.vy, s.vx)); x.scale(z, z);
          x.fillStyle = s.shell ? '#303020' : '#4a5a30'; x.fillRect(-6, -2, 12, 4);
          x.fillStyle = '#ffc040'; x.fillRect(-9, -1.5, 3, 3);
          x.restore();
        } else if (s.kind === 'throw') {
          const [a, b] = this.proj(s.x, s.y, s.z || 0);
          x.save(); x.translate(a, b); x.rotate(world.t * 14); x.scale(z * this.pz(s.z || 0), z * this.pz(s.z || 0));
          x.fillStyle = '#3a6a3a'; x.fillRect(-3, -2, 6, 4); x.fillStyle = '#ff8020'; x.fillRect(3, -1, 2, 2);
          x.restore();
        }
      }
    }

    drawFx(world, inView) {
      const x = this.x, z = this.cam.zoom;
      for (const f of world.fx) {
        if (!inView(f)) continue;
        const k = f.life / f.max;
        if (f.t === 'smoke') {
          const [sx, sy] = this.proj(f.x, f.y, 20 + (1 - k) * 30);
          const r = (f.r || 6) * (1.4 - k * 0.6) * z * this.pz(30);
          x.fillStyle = f.light ? `rgba(200,200,200,${k * 0.35})` : `rgba(40,40,40,${k * 0.5})`;
          x.beginPath(); x.arc(sx, sy, r, 0, Math.PI * 2); x.fill();
        } else if (f.t === 'fire') {
          const [sx, sy] = this.proj(f.x, f.y, 8 + (1 - k) * 16);
          const r = (f.r || 6) * k * z;
          x.fillStyle = `rgba(255,${Math.round(120 + 100 * k)},30,${0.8 * k + 0.2})`;
          x.beginPath(); x.arc(sx, sy, r, 0, Math.PI * 2); x.fill();
        } else if (f.t === 'boom') {
          const [sx, sy] = this.proj(f.x, f.y, 10);
          const r = f.r * (1.1 - k * 0.7) * z;
          const g = x.createRadialGradient(sx, sy, 0, sx, sy, r);
          g.addColorStop(0, `rgba(255,255,200,${k})`); g.addColorStop(0.4, `rgba(255,160,40,${k * 0.9})`); g.addColorStop(1, 'rgba(120,30,0,0)');
          x.fillStyle = g; x.beginPath(); x.arc(sx, sy, r, 0, Math.PI * 2); x.fill();
        } else if (f.t === 'flash') {
          const [sx, sy] = this.proj(f.x, f.y, 4);
          x.fillStyle = `rgba(255,230,120,${k})`; x.beginPath(); x.arc(sx, sy, (f.big ? 10 : 4) * z, 0, Math.PI * 2); x.fill();
        } else if (f.t === 'spark') {
          const [sx, sy] = this.proj(f.x, f.y, 2);
          x.fillStyle = `rgba(255,240,180,${k})`; x.fillRect(sx - 1.5, sy - 1.5, 3, 3);
        } else if (f.t === 'splash') {
          const [sx, sy] = this.proj(f.x, f.y, 0);
          x.strokeStyle = `rgba(220,240,255,${k})`; x.lineWidth = 2; x.beginPath(); x.arc(sx, sy, (1 - k) * 30 * z + 4, 0, Math.PI * 2); x.stroke();
        }
      }
    }

    drawGroundMarkers(ms) {
      const x = this.x, z = this.cam.zoom;
      for (const m of ms) {
        if (m.ground === false) continue;
        const [sx, sy] = this.proj(m.x, m.y, 0);
        const r = (m.r || 24) * z;
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 5);
        x.strokeStyle = m.color || '#ffe040'; x.lineWidth = 3;
        x.globalAlpha = 0.5 + pulse * 0.4;
        x.beginPath(); x.arc(sx, sy, r, 0, Math.PI * 2); x.stroke();
        x.globalAlpha = 0.15; x.fillStyle = m.color || '#ffe040'; x.fill();
        x.globalAlpha = 1;
      }
    }

    drawMarkers(ms) {
      const x = this.x, z = this.cam.zoom;
      for (const m of ms) {
        if (m.arrowOnly) continue;
        const bob = Math.sin(this.time * 6) * 4;
        const [sx, sy] = this.proj(m.x, m.y, 40 + bob);
        x.fillStyle = m.color || '#ffe040'; x.strokeStyle = '#000'; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(sx, sy + 12 * z); x.lineTo(sx - 9 * z, sy - 2 * z); x.lineTo(sx - 3.5 * z, sy - 2 * z); x.lineTo(sx - 3.5 * z, sy - 12 * z); x.lineTo(sx + 3.5 * z, sy - 12 * z); x.lineTo(sx + 3.5 * z, sy - 2 * z); x.lineTo(sx + 9 * z, sy - 2 * z); x.closePath();
        x.fill(); x.stroke();
      }
    }

    drawTexts(world) {
      const x = this.x, z = this.cam.zoom;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      for (const t of world.texts) {
        const [sx, sy] = this.proj(t.x, t.y, 30);
        x.globalAlpha = Math.min(1, (1.6 - t.t) * 2);
        x.font = 'bold ' + Math.round(14 * Math.max(0.8, z)) + 'px Arial Black, Arial';
        x.fillStyle = '#000'; x.fillText(t.text, sx + 1.5, sy + 1.5);
        x.fillStyle = t.color; x.fillText(t.text, sx, sy);
      }
      x.globalAlpha = 1;
    }
  }

  Object.assign(Renderer.prototype, G.Ground, G.Bldg);
  Object.assign(G, { Renderer, FLOOR, shade, mix, drawCarBody });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
