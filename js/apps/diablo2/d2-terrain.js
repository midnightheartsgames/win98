(function (D) {
  'use strict';
  const { pfbm, pnoise, hash2, vnoise, clamp } = D;
  const TS = 256, TPM = 64;
  const TAU = Math.PI * 2;

  function mk(w, h) {
    const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : document.createElement('canvas');
    cv.width = w; cv.height = h;
    return cv;
  }

  function texGen(name) {
    const d = new Uint8ClampedArray(TS * TS * 3);
    const put = (i, r, g, b) => { d[i * 3] = r; d[i * 3 + 1] = g; d[i * 3 + 2] = b; };
    const S = D.strHash(name) % 1000;
    const vor = (x, y, cells, seed) => {
      const fx = x * cells, fy = y * cells;
      const ix = Math.floor(fx), iy = Math.floor(fy);
      let d1 = 9, d2 = 9, id = 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const cx = ix + ox, cy = iy + oy;
        const wx = ((cx % cells) + cells) % cells, wy = ((cy % cells) + cells) % cells;
        const px = cx + hash2(wx, wy, seed) * 0.8 + 0.1, py = cy + hash2(wy, wx, seed + 3) * 0.8 + 0.1;
        const dd = Math.hypot(px - fx, py - fy);
        if (dd < d1) { d2 = d1; d1 = dd; id = hash2(wx, wy, seed + 9); } else if (dd < d2) d2 = dd;
      }
      return { d1, d2, id };
    };
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const u = x / TS, v = y / TS;
      const i = y * TS + x;
      const n1 = pfbm(u * 8, v * 8, 8, S, 4);
      const n2 = pnoise(u * 64, v * 64, 64, S + 5);
      const n3 = pfbm(u * 3, v * 3, 3, S + 7, 3);
      let r, g, b;
      switch (name) {
        case 'grass': case 'grassl': case 'darkgrass': case 'deadgrass': case 'moss': {
          const base = { grass: [52, 66, 30], grassl: [70, 80, 38], darkgrass: [32, 46, 26], deadgrass: [74, 66, 40], moss: [40, 58, 30] }[name];
          const blade = pnoise(u * 128, v * 40, 128, S + 11) * 0.6 + pnoise(u * 40, v * 128, 40, S + 13) * 0.4;
          const k = 0.62 + n1 * 0.55 + (blade - 0.5) * 0.45 + (n2 - 0.5) * 0.18;
          r = base[0] * k + (n3 - 0.5) * 18; g = base[1] * k + (n3 - 0.5) * 10; b = base[2] * k;
          if (name === 'moss' && n2 > 0.72) { r += 10; g += 18; }
          if (hash2(x, y, S) > 0.985) { r += 30; g += 30; b += 12; }
          break;
        }
        case 'dirt': case 'road': case 'mud': case 'cavefloor': case 'ash': {
          const base = { dirt: [78, 60, 40], road: [96, 80, 56], mud: [54, 46, 32], cavefloor: [70, 56, 42], ash: [52, 48, 46] }[name];
          const peb = vor(u, v, 22, S);
          const k = 0.7 + n1 * 0.45 + (n2 - 0.5) * 0.25;
          r = base[0] * k; g = base[1] * k; b = base[2] * k;
          if (peb.d1 < 0.22 && peb.id > 0.55) { const t = 1 - peb.d1 / 0.22; r += 24 * t; g += 20 * t; b += 16 * t; }
          if (peb.d1 < 0.3 && peb.id > 0.55 && peb.d1 > 0.22) { r -= 14; g -= 12; b -= 10; }
          if (name === 'road') { const rut = Math.abs(Math.sin(v * TAU * 6)) ; if (rut < 0.1) { r -= 10; g -= 10; b -= 8; } }
          if (name === 'mud' && n2 > 0.7) { r += 6; g += 10; b += 10; }
          if (name === 'ash' && hash2(x, y, S + 1) > 0.992) { r = 200; g = 80; b = 20; }
          break;
        }
        case 'stone': {
          const vc = vor(u, v, 10, S);
          const edge = vc.d2 - vc.d1;
          const k = 0.72 + vc.id * 0.35 + (n2 - 0.5) * 0.2;
          r = 92 * k; g = 86 * k; b = 76 * k;
          if (edge < 0.06) { const t = 1 - edge / 0.06; r *= 1 - t * 0.5; g *= 1 - t * 0.5; b *= 1 - t * 0.5; }
          if (n1 < 0.38) { r = r * 0.6 + 40; g = g * 0.6 + 48; b = b * 0.6 + 24; }
          break;
        }
        case 'cobble': {
          const vc = vor(u, v, 16, S);
          const edge = vc.d2 - vc.d1;
          const k = 0.6 + vc.id * 0.4 + (n2 - 0.5) * 0.15;
          r = 88 * k; g = 84 * k; b = 80 * k;
          if (edge < 0.1) { const t = 1 - edge / 0.1; r = r * (1 - t) + 34 * t; g = g * (1 - t) + 30 * t; b = b * (1 - t) + 26 * t; }
          break;
        }
        case 'flag': case 'catafloor': {
          const gx = u * 4 + (Math.floor(v * 4) % 2) * 0.5, gy = v * 4;
          const fx = gx - Math.floor(gx), fy = gy - Math.floor(gy);
          const id = hash2(Math.floor(gx) % 4, Math.floor(gy), S);
          const edge = Math.min(fx, 1 - fx, fy, 1 - fy);
          const base = name === 'flag' ? [84, 80, 76] : [62, 54, 50];
          const k = 0.72 + id * 0.3 + (n2 - 0.5) * 0.22 + (n1 - 0.5) * 0.2;
          r = base[0] * k; g = base[1] * k; b = base[2] * k;
          if (edge < 0.035) { r *= 0.45; g *= 0.45; b *= 0.45; }
          else if (edge < 0.06) { r *= 1.12; g *= 1.12; b *= 1.12; }
          if (name === 'catafloor' && n3 > 0.66) { const t = (n3 - 0.66) * 3; r += 40 * t; g -= 10 * t; b -= 10 * t; }
          break;
        }
        case 'tiles': {
          const gx = u * 4, gy = v * 4;
          const fx = gx - Math.floor(gx), fy = gy - Math.floor(gy);
          const chk = (Math.floor(gx) + Math.floor(gy)) % 2;
          const edge = Math.min(fx, 1 - fx, fy, 1 - fy);
          const k = 0.8 + (n2 - 0.5) * 0.2 + (n1 - 0.5) * 0.25;
          if (chk) { r = 96 * k; g = 56 * k; b = 44 * k; } else { r = 78 * k; g = 74 * k; b = 70 * k; }
          if (edge < 0.03) { r *= 0.4; g *= 0.4; b *= 0.4; }
          const inner = Math.abs(fx - 0.5) + Math.abs(fy - 0.5);
          if (chk === 0 && Math.abs(inner - 0.3) < 0.02) { r += 20; g += 16; b += 10; }
          break;
        }
        case 'water': {
          const w = pfbm(u * 5, v * 5, 5, S, 4);
          r = 18 + w * 16; g = 34 + w * 22; b = 32 + w * 20;
          if (n2 > 0.8) { r += 10; g += 14; b += 14; }
          break;
        }
        default: r = 10; g = 10; b = 10;
      }
      put(i, r, g, b);
    }
    return d;
  }

  const TEX = {};
  function tex(name) { if (!TEX[name]) TEX[name] = texGen(name); return TEX[name]; }

  class Ground {
    constructor(area) {
      this.area = area;
      this.chunks = new Map();
      this.queue = [];
      this.CH = 8;
      const { w, h } = area;
      this.occ = new Float32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let open = 0, n = 0;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx, ny = y + dy;
          n++;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const i = ny * w + nx;
          if (area.walk[i] === 1 || area.wall[i] === 7 || (area.wall[i] === 0 && area.ter[i] !== 0 && !area.objCell[i])) open++;
        }
        this.occ[y * w + x] = open / n;
      }
      this.texs = D.TER.map(n => n === 'void' ? null : tex(n));
    }

    chunkKey(cx, cy) { return cx + ',' + cy; }

    build(cx, cy) {
      const a = this.area;
      const CH = this.CH;
      const W = CH * 64, H = CH * 32;
      const cv = mk(W, H);
      const ctx = cv.getContext('2d');
      const img = ctx.createImageData(W, H);
      const px = img.data;
      const x0 = cx * CH, y0 = cy * CH;
      const seed = a.seed;
      const texs = this.texs;
      const occ = this.occ;
      const aw = a.w, ah = a.h;
      const dark = a.dungeon;
      for (let sy = 0; sy < H; sy++) {
        for (let sx = 0; sx < W; sx++) {
          const lx = sx - W / 2 + 0.5, ly = sy + 0.5;
          const wxr = (ly / 16 + lx / 32) / 2, wyr = (ly / 16 - lx / 32) / 2;
          if (wxr < 0 || wyr < 0 || wxr >= CH || wyr >= CH) continue;
          const wx = x0 + wxr, wy = y0 + wyr;
          const wn1 = vnoise(wx * 0.9, wy * 0.9, seed) - 0.5, wn2 = vnoise(wx * 0.9 + 31, wy * 0.9 + 17, seed) - 0.5;
          const qx = Math.floor(wx + wn1 * 0.95), qy = Math.floor(wy + wn2 * 0.95);
          let tid = 0;
          if (qx >= 0 && qy >= 0 && qx < aw && qy < ah) tid = a.ter[qy * aw + qx];
          const cxi = Math.min(aw - 1, Math.floor(wx)), cyi = Math.min(ah - 1, Math.floor(wy));
          if (tid === 0) tid = a.ter[cyi * aw + cxi];
          const o = (sy * W + sx) * 4;
          if (tid === 0) { px[o + 3] = 0; continue; }
          const T = texs[tid];
          const tx = ((Math.floor(wx * TPM) % TS) + TS) % TS, ty = ((Math.floor(wy * TPM) % TS) + TS) % TS;
          const ti = (ty * TS + tx) * 3;
          const fx = wx - 0.5, fy = wy - 0.5;
          const ix = clamp(Math.floor(fx), 0, aw - 2), iy = clamp(Math.floor(fy), 0, ah - 2);
          const ax = clamp(fx - ix, 0, 1), ay = clamp(fy - iy, 0, 1);
          const oc = (occ[iy * aw + ix] * (1 - ax) + occ[iy * aw + ix + 1] * ax) * (1 - ay) + (occ[(iy + 1) * aw + ix] * (1 - ax) + occ[(iy + 1) * aw + ix + 1] * ax) * ay;
          const lf = 0.86 + (vnoise(wx * 0.18, wy * 0.18, seed + 5) - 0.5) * 0.3;
          const k = lf * (dark ? 0.45 + oc * 0.6 : 0.62 + oc * 0.45);
          px[o] = T[ti] * k; px[o + 1] = T[ti + 1] * k; px[o + 2] = T[ti + 2] * k; px[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      for (const dcl of a.decals) {
        if (dcl.x < x0 - 1 || dcl.y < y0 - 1 || dcl.x > x0 + CH + 1 || dcl.y > y0 + CH + 1) continue;
        const lx = (dcl.x - x0 - (dcl.y - y0)) * 32 + W / 2, ly = (dcl.x - x0 + dcl.y - y0) * 16;
        drawDecal(ctx, dcl, lx, ly);
      }
      return cv;
    }

    get(cx, cy, force) {
      const k = this.chunkKey(cx, cy);
      let c = this.chunks.get(k);
      if (c) return c;
      if (!force) { if (!this.queue.includes(k)) this.queue.push(k); return null; }
      c = this.build(cx, cy);
      this.chunks.set(k, c);
      if (this.chunks.size > 60) { const first = this.chunks.keys().next().value; this.chunks.delete(first); }
      return c;
    }

    pump(budget) {
      const t0 = performance.now();
      while (this.queue.length && performance.now() - t0 < budget) {
        const k = this.queue.shift();
        if (this.chunks.has(k)) continue;
        const [cx, cy] = k.split(',').map(Number);
        this.chunks.set(k, this.build(cx, cy));
      }
    }
  }

  function drawDecal(c, d, x, y) {
    c.save();
    c.translate(x, y);
    const v = d.v || 0;
    if (d.k === 'blood') {
      c.fillStyle = 'rgba(90,6,6,0.75)';
      c.beginPath(); c.ellipse(0, 0, 12 + v * 3, 5 + v, 0.3 * v, 0, TAU); c.fill();
      c.fillStyle = 'rgba(60,0,0,0.6)';
      c.beginPath(); c.ellipse(8, 3, 5, 2, 0, 0, TAU); c.fill();
    } else if (d.k === 'bones') {
      c.strokeStyle = '#c8c0a8'; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-8, 1); c.lineTo(6, -2); c.moveTo(-3, 4); c.lineTo(9, 5); c.stroke();
      c.fillStyle = '#d8d0b8'; c.beginPath(); c.arc(-11, -2, 3.5, 0, TAU); c.fill();
      c.fillStyle = '#201810'; c.fillRect(-12.5, -3, 1.2, 1.2); c.fillRect(-10.5, -3, 1.2, 1.2);
    } else if (d.k === 'embers') {
      for (let i = 0; i < 14; i++) { c.fillStyle = i % 3 ? 'rgba(40,30,26,0.8)' : 'rgba(200,70,20,0.8)'; c.fillRect(Math.sin(i * 3.1) * 22, Math.cos(i * 2.3) * 10, 3, 2); }
    } else if (d.k === 'reed') {
      c.strokeStyle = '#6a7a3a'; c.lineWidth = 1;
      for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(i * 3 - 9, 4); c.quadraticCurveTo(i * 3 - 10, -6, i * 3 - 7 + v, -14 - (i % 3) * 3); c.stroke(); }
    }
    c.restore();
  }

  const WALL_H = { 1: 1.5, 3: 0.65, 4: 2.1, 5: 2.0, 6: 1.0, 8: 2.3 };

  function rockShade(u, v, seed) {
    const n = D.fbm(u * 0.09, v * 0.13, seed, 4);
    const strata = Math.sin(v * 0.42 + n * 5) * 0.5 + 0.5;
    const crack = Math.abs(D.fbm(u * 0.05 + 9, v * 0.05, seed + 3, 3) - 0.5) < 0.018 ? 0.45 : 1;
    const spot = D.hash2(Math.floor(u), Math.floor(v), seed) > 0.97 ? 1.25 : 1;
    return (0.62 + n * 0.55 - strata * 0.16) * crack * spot;
  }

  function faceTex(kind, theme, side, v, hOverride) {
    const hM = hOverride || WALL_H[kind] || 2;
    const key = kind + ':' + theme + ':' + side + ':' + v + ':' + hM;
    if (FACE[key]) return FACE[key];
    const hPx = Math.round(hM * D.ZS);
    const cv = mk(34, 18 + hPx);
    const c = cv.getContext('2d');
    const pal = wallPal(kind, theme);
    c.save();
    c.beginPath();
    if (side === 'L') { c.moveTo(0, 0); c.lineTo(32, 16); c.lineTo(32, 16 + hPx); c.lineTo(0, hPx); }
    else { c.moveTo(32, 0); c.lineTo(0, 16); c.lineTo(0, 16 + hPx); c.lineTo(32, hPx); }
    c.closePath();
    c.clip();
    const base = side === 'L' ? pal.l : pal.r;
    const rocky = kind === 1 || theme === 'cave';
    if (rocky) {
      const img = c.createImageData(34, 18 + hPx);
      const [r0, g0, b0] = D.rgb(base);
      const seed = 31 + v * 7 + (side === 'L' ? 0 : 100);
      for (let y = 0; y < 18 + hPx; y++) for (let x = 0; x < 34; x++) {
        const yy = y - (side === 'L' ? x / 2 : (32 - x) / 2);
        const k = rockShade(x + v * 34, yy, seed) * (0.75 + 0.35 * (1 - Math.max(0, yy) / hPx));
        const i = (y * 34 + x) * 4;
        img.data[i] = r0 * k; img.data[i + 1] = g0 * k; img.data[i + 2] = b0 * k; img.data[i + 3] = 255;
      }
      const tmp = mk(34, 18 + hPx);
      tmp.getContext('2d').putImageData(img, 0, 0);
      c.drawImage(tmp, 0, 0);
    } else {
      c.fillStyle = base;
      c.fillRect(0, 0, 34, 18 + hPx);
      const rows = Math.max(2, Math.round(hM * 4));
      const rng = new D.RNG(D.strHash(key));
      for (let r = 0; r < rows; r++) {
        const y0 = r * hPx / rows;
        for (let k = 0; k < 3; k++) {
          const x0 = (k + (r % 2) * 0.5) * 32 / 3;
          const x1 = x0 + 32 / 3;
          const yA = side === 'L' ? x0 / 2 : (32 - x0) / 2, yB = side === 'L' ? x1 / 2 : (32 - x1) / 2;
          c.fillStyle = D.shade(base, rng.range(-0.15, 0.15));
          c.beginPath();
          c.moveTo(x0 + 1, y0 + yA + 1); c.lineTo(x1 - 1, y0 + yB + 1); c.lineTo(x1 - 1, y0 + yB + hPx / rows - 1); c.lineTo(x0 + 1, y0 + yA + hPx / rows - 1);
          c.closePath(); c.fill();
        }
        c.strokeStyle = D.shade(base, -0.55);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, y0 + (side === 'L' ? 0 : 16)); c.lineTo(32, y0 + (side === 'L' ? 16 : 0));
        c.stroke();
      }
    }
    const g = c.createLinearGradient(0, 0, 0, 18 + hPx);
    g.addColorStop(0, 'rgba(255,240,220,0.08)');
    g.addColorStop(1, 'rgba(0,0,0,0.5)');
    c.fillStyle = g;
    c.fillRect(0, 0, 34, 18 + hPx);
    c.restore();
    FACE[key] = { cv, h: hPx };
    return FACE[key];
  }
  const FACE = {};

  function wallPal(kind, theme) {
    if (kind === 1) return { l: '#5a5146', r: '#3a332c', top: '#322c26' };
    if (kind === 3) return { l: '#6a6458', r: '#4a4640', top: '#7a746a' };
    if (kind === 6) return { l: '#3a3430', r: '#2a2624', top: '#4a423a' };
    if (kind === 8) return { l: '#6a6058', r: '#4a4440', top: '#7a7068' };
    const t = {
      cave: { l: '#54463a', r: '#382e26', top: '#1c1712' }, brick: { l: '#5a4a44', r: '#3e3430', top: '#1c1616' },
      monastery: { l: '#6a6258', r: '#4a4440', top: '#2a2622' }, jail: { l: '#4a4a50', r: '#34343a', top: '#1a1a1e' },
      catacomb: { l: '#4a3e3a', r: '#342a28', top: '#140e0e' }
    }[theme] || { l: '#5a5a5a', r: '#3a3a3a', top: '#1a1a1a' };
    return t;
  }

  function wallTop(kind, theme, v) {
    const key = 'top:' + kind + ':' + theme + ':' + (v || 0);
    if (FACE[key]) return FACE[key];
    const cv = mk(64, 32);
    const c = cv.getContext('2d');
    const pal = wallPal(kind, theme);
    c.beginPath(); c.moveTo(32, 0); c.lineTo(64, 16); c.lineTo(32, 32); c.lineTo(0, 16); c.closePath();
    if (kind === 1 || theme === 'cave') {
      c.save(); c.clip();
      const img = c.createImageData(64, 32);
      const [r0, g0, b0] = D.rgb(pal.top);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) {
        const k = 0.55 + D.fbm((x + (v || 0) * 64) * 0.08, y * 0.16, 77, 4) * 0.8 + (D.hash2(x, y, 5 + (v || 0)) > 0.93 ? 0.3 : 0);
        const i = (y * 64 + x) * 4;
        img.data[i] = r0 * k; img.data[i + 1] = g0 * k; img.data[i + 2] = b0 * k; img.data[i + 3] = 255;
      }
      const tmp = mk(64, 32); tmp.getContext('2d').putImageData(img, 0, 0);
      c.drawImage(tmp, 0, 0);
      c.restore();
    } else {
      c.fillStyle = pal.top; c.fill();
      c.strokeStyle = D.shade(pal.top, 0.25); c.lineWidth = 1; c.stroke();
    }
    FACE[key] = { cv };
    return FACE[key];
  }

  function voidPattern(c) {
    if (!OBJ.voidTex) {
      const cv = mk(128, 64);
      const x = cv.getContext('2d');
      const img = x.createImageData(128, 64);
      for (let y = 0; y < 64; y++) for (let xx = 0; xx < 128; xx++) {
        const k = 0.5 + D.pfbm(xx / 128 * 4, y / 64 * 2, 4, 91, 4) * 0.7;
        const i = (y * 128 + xx) * 4;
        img.data[i] = 46 * k; img.data[i + 1] = 41 * k; img.data[i + 2] = 35 * k; img.data[i + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      OBJ.voidTex = cv;
    }
    return c.createPattern(OBJ.voidTex, 'repeat');
  }

  const OBJ = {};
  function objSprite(type, v, extra) {
    const key = type + ':' + (v || 0) + ':' + (extra || '');
    if (OBJ[key]) return OBJ[key];
    const spec = OBJ_DRAW[type];
    if (!spec) return null;
    const cv = mk(spec.w, spec.h);
    const c = cv.getContext('2d');
    const rng = new D.RNG(D.strHash(key) + 7);
    spec.draw(c, spec.w / 2, spec.oy, v || 0, rng, extra);
    OBJ[key] = { cv, ox: spec.w / 2, oy: spec.oy, w: spec.w, h: spec.h, tall: spec.tall || 0 };
    return OBJ[key];
  }

  const ball = (c, x, y, r, col, ry) => D.Sprites.ball(c, { x, y }, r, col, ry ? { ry } : undefined);

  function foliage(c, x, y, r, base, rng, n) {
    c.fillStyle = D.shade(base, -0.62);
    c.beginPath();
    for (let i = 0; i <= 18; i++) {
      const a = i / 18 * TAU, rr = r * (0.82 + rng.range(-0.1, 0.12));
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.82;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.fill();
    const N = Math.max(24, Math.round((n || 20) * 2.6));
    const pts = [];
    for (let i = 0; i < N; i++) {
      let u, v, w;
      do { u = rng.range(-1, 1); v = rng.range(-1, 1); w = rng.range(-1, 1); } while (u * u + v * v + w * w > 1);
      pts.push([u, v, w]);
    }
    pts.sort((p1, p2) => p1[2] - p2[2]);
    for (const [u, v, w] of pts) {
      const px = x + u * r * 0.85, py = y + v * r * 0.7 - w * r * 0.18;
      const light = D.clamp(0.55 - u * 0.32 - v * 0.42 + w * 0.3, 0, 1);
      const col = D.shade(base, -0.55 + light * 0.75);
      const rr = r * rng.range(0.13, 0.22);
      c.fillStyle = col;
      c.beginPath();
      for (let k = 0; k < 7; k++) {
        const a = k / 7 * TAU + rng.range(-0.3, 0.3), q = rr * rng.range(0.75, 1.15);
        const qx = px + Math.cos(a) * q, qy = py + Math.sin(a) * q * 0.85;
        if (k === 0) c.moveTo(qx, qy); else c.lineTo(qx, qy);
      }
      c.fill();
      if (light > 0.55) { c.fillStyle = D.shade(base, 0.05 + light * 0.25); c.beginPath(); c.arc(px - rr * 0.3, py - rr * 0.35, rr * 0.35, 0, TAU); c.fill(); }
    }
    for (let i = 0; i < N; i++) {
      const a = rng.range(Math.PI * 0.9, Math.PI * 1.9), d = rng.range(0.3, 0.95) * r;
      c.fillStyle = D.shade(base, rng.range(0.1, 0.35));
      c.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.75, 1.5, 1.5);
    }
  }

  const OBJ_DRAW = {
    tree: {
      w: 130, h: 180, oy: 160, tall: 3, draw: (c, x, y, v, rng) => {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 10, y + 2, 38, 14, 0, 0, TAU); c.fill();
        const tc = '#3a2a1c';
        D.Sprites.capsule(c, { x, y }, { x: x + rng.range(-4, 4), y: y - 70 }, 7, 4.5, tc);
        for (let i = 0; i < 3; i++) D.Sprites.capsule(c, { x, y: y - 50 - i * 8 }, { x: x + rng.range(-30, 30), y: y - 80 - rng.range(0, 20) }, 3, 1.5, tc);
        const hue = ['#3a5a2a', '#44602e', '#3c5228', '#4a582c', '#365024', '#506030', '#384c28', '#42582e'][v % 8];
        foliage(c, x, y - 100, 46, hue, rng, 30);
      }
    },
    deadtree: {
      w: 110, h: 170, oy: 150, tall: 3, draw: (c, x, y, v, rng) => {
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x + 6, y + 2, 22, 8, 0, 0, TAU); c.fill();
        const tc = v % 2 ? '#3a3028' : '#2e2620';
        D.Sprites.capsule(c, { x, y }, { x: x + rng.range(-6, 6), y: y - 90 }, 6, 2.5, tc);
        const br = (sx, sy, a, l, w, d) => {
          if (d > 3 || l < 6) return;
          const ex = sx + Math.cos(a) * l, ey = sy + Math.sin(a) * l;
          D.Sprites.capsule(c, { x: sx, y: sy }, { x: ex, y: ey }, w, w * 0.6, tc);
          br(ex, ey, a + rng.range(0.2, 0.7), l * 0.7, w * 0.6, d + 1);
          br(ex, ey, a - rng.range(0.2, 0.7), l * 0.7, w * 0.6, d + 1);
        };
        br(x, y - 60, -Math.PI / 2 - 0.5, 30, 3, 0);
        br(x, y - 75, -Math.PI / 2 + 0.5, 28, 3, 0);
        br(x, y - 88, -Math.PI / 2, 22, 2.4, 1);
      }
    },
    rock: {
      w: 60, h: 50, oy: 38, draw: (c, x, y, v, rng) => {
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x + 4, y + 2, 20, 8, 0, 0, TAU); c.fill();
        const col = ['#6a645a', '#5a5650', '#72685a', '#5e584e'][v % 4];
        for (let i = 0; i < 3; i++) ball(c, x + rng.range(-10, 10), y - 8 - rng.range(0, 8), rng.range(9, 14), col, rng.range(7, 11));
      }
    },
    bigrock: {
      w: 120, h: 100, oy: 76, tall: 1, draw: (c, x, y, v, rng) => {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 8, y + 4, 48, 18, 0, 0, TAU); c.fill();
        const col = ['#6a645a', '#5a5650', '#72685a', '#5e584e'][v % 4];
        for (let i = 0; i < 6; i++) ball(c, x + rng.range(-26, 26), y - 18 - rng.range(0, 22), rng.range(16, 26), col, rng.range(12, 20));
      }
    },
    bush: {
      w: 64, h: 50, oy: 40, draw: (c, x, y, v, rng) => {
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x + 3, y + 1, 18, 7, 0, 0, TAU); c.fill();
        foliage(c, x, y - 10, 18, v % 2 ? '#2e4a24' : '#3a4a24', rng, 12);
      }
    },
    grave: {
      w: 50, h: 60, oy: 48, draw: (c, x, y, v) => {
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x + 3, y + 1, 14, 6, 0, 0, TAU); c.fill();
        c.fillStyle = '#4a4034'; c.beginPath(); c.ellipse(x, y + 2, 16, 6, 0, 0, TAU); c.fill();
        if (v % 2) { c.fillStyle = '#6a665e'; c.fillRect(x - 3, y - 36, 6, 34); c.fillRect(x - 11, y - 28, 22, 6); c.fillStyle = '#4a4640'; c.fillRect(x + 2, y - 36, 1, 34); }
        else { const g = c.createLinearGradient(x - 9, 0, x + 9, 0); g.addColorStop(0, '#7a766c'); g.addColorStop(1, '#4a4640'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x - 9, y - 24); c.arc(x, y - 24, 9, Math.PI, TAU); c.lineTo(x + 9, y); c.fill(); c.fillStyle = '#3a3632'; c.fillRect(x - 4, y - 24, 8, 1.5); c.fillRect(x - 3, y - 20, 6, 1.5); }
      }
    },
    cross: { w: 40, h: 60, oy: 50, draw: (c, x, y) => { c.fillStyle = '#5a4a36'; c.fillRect(x - 2, y - 40, 4, 40); c.fillRect(x - 10, y - 32, 20, 4); } },
    rubble: {
      w: 60, h: 40, oy: 30, draw: (c, x, y, v, rng) => {
        for (let i = 0; i < 7; i++) { c.fillStyle = D.shade('#4a4038', rng.range(-0.2, 0.2)); c.fillRect(x + rng.range(-18, 14), y - rng.range(0, 12), rng.range(5, 10), rng.range(3, 7)); }
      }
    },
    stash: {
      w: 60, h: 50, oy: 38, draw: (c, x, y) => {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 3, y + 2, 20, 8, 0, 0, TAU); c.fill();
        box(c, x, y, 18, 12, 16, '#6a4424');
        c.fillStyle = '#c0a040'; c.fillRect(x - 3, y - 18, 6, 6);
        c.strokeStyle = '#2a1a0a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 18, y - 16); c.lineTo(x, y - 7); c.lineTo(x + 18, y - 16); c.stroke();
      }
    },
    chest: {
      w: 50, h: 44, oy: 34, draw: (c, x, y, v, rng, ex) => {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 3, y + 2, 16, 7, 0, 0, TAU); c.fill();
        box(c, x, y, 14, 9, 11, ex === 'open' ? '#4a3018' : '#6a4424');
        if (ex === 'open') { c.fillStyle = '#1a1008'; c.beginPath(); c.moveTo(x - 14, y - 11); c.lineTo(x, y - 18); c.lineTo(x + 14, y - 11); c.lineTo(x, y - 4); c.fill(); }
        else { c.fillStyle = '#a08030'; c.fillRect(x - 2, y - 11, 4, 5); }
      }
    },
    barrel: {
      w: 40, h: 50, oy: 40, draw: (c, x, y, v, rng, ex) => {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 3, y + 1, 12, 5, 0, 0, TAU); c.fill();
        if (ex === 'open') { for (let i = 0; i < 5; i++) { c.fillStyle = '#5a3a1c'; c.fillRect(x + rng.range(-12, 10), y - rng.range(0, 6), rng.range(3, 7), 2); } return; }
        const g = c.createLinearGradient(x - 10, 0, x + 10, 0); g.addColorStop(0, '#7a5028'); g.addColorStop(0.4, '#9a6a38'); g.addColorStop(1, '#4a3016');
        c.fillStyle = g; c.beginPath(); c.moveTo(x - 9, y); c.quadraticCurveTo(x - 12, y - 11, x - 9, y - 22); c.lineTo(x + 9, y - 22); c.quadraticCurveTo(x + 12, y - 11, x + 9, y); c.fill();
        c.fillStyle = '#3a2a1a'; c.beginPath(); c.ellipse(x, y - 22, 9, 3.5, 0, 0, TAU); c.fill();
        c.strokeStyle = '#3a3a3a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 11, y - 6); c.lineTo(x + 11, y - 6); c.moveTo(x - 11, y - 16); c.lineTo(x + 11, y - 16); c.stroke();
      }
    },
    urn: {
      w: 40, h: 50, oy: 40, draw: (c, x, y, v, rng, ex) => {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 3, y + 1, 11, 5, 0, 0, TAU); c.fill();
        if (ex === 'open') { for (let i = 0; i < 6; i++) { c.fillStyle = '#8a7a6a'; c.fillRect(x + rng.range(-12, 10), y - rng.range(0, 6), rng.range(3, 6), 2); } return; }
        ball(c, x, y - 11, 10, '#8a7868', 11);
        c.fillStyle = '#6a5a4a'; c.fillRect(x - 4, y - 25, 8, 5);
      }
    },
    shrine: {
      w: 60, h: 90, oy: 76, draw: (c, x, y, v, rng, ex) => {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 3, y + 2, 18, 7, 0, 0, TAU); c.fill();
        box(c, x, y, 16, 10, 8, '#5a5650');
        const g = c.createLinearGradient(x - 8, 0, x + 8, 0); g.addColorStop(0, '#8a867c'); g.addColorStop(1, '#4a4640');
        c.fillStyle = g; c.beginPath(); c.moveTo(x - 7, y - 8); c.lineTo(x - 5, y - 52); c.lineTo(x, y - 58); c.lineTo(x + 5, y - 52); c.lineTo(x + 7, y - 8); c.fill();
        if (ex !== 'open') { c.fillStyle = '#80c0ff'; c.fillRect(x - 1.5, y - 44, 3, 20); }
      }
    },
    fire: {
      w: 60, h: 40, oy: 30, draw: (c, x, y) => {
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ball(c, x + Math.cos(a) * 14, y + Math.sin(a) * 6, 4, '#5a5650', 3); }
        c.strokeStyle = '#3a2410'; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x - 10, y + 2); c.lineTo(x + 8, y - 4); c.moveTo(x - 8, y - 4); c.lineTo(x + 10, y + 2); c.stroke();
      }
    },
    torch: {
      w: 30, h: 90, oy: 80, draw: (c, x, y) => {
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x + 2, y, 8, 3, 0, 0, TAU); c.fill();
        c.strokeStyle = '#3a2a1a'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x, y - 50); c.lineTo(x + 7, y); c.moveTo(x, y - 50); c.lineTo(x, y + 2); c.stroke();
        ball(c, x, y - 52, 3.5, '#3a3028');
      }
    },
    tent: {
      w: 220, h: 170, oy: 120, tall: 2, draw: (c, x, y, v, rng) => {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 10, y + 6, 92, 34, 0, 0, TAU); c.fill();
        const col = v === 1 ? '#6a5a44' : '#7a5a3a';
        const L = { x: x - 90, y: y }, R = { x: x + 90, y: y }, F = { x: x + 10, y: y + 40 }, B = { x: x - 10, y: y - 45 }, T = { x: x, y: y - 95 };
        const tri = (a, b, col2) => { c.fillStyle = col2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(T.x, T.y); c.closePath(); c.fill(); c.strokeStyle = D.shade(col2, -0.4); c.lineWidth = 1; c.stroke(); };
        tri(B, R, D.shade(col, -0.35)); tri(L, B, D.shade(col, -0.2)); tri(L, F, D.shade(col, 0.05)); tri(F, R, D.shade(col, -0.15));
        c.fillStyle = '#1a1008'; c.beginPath(); c.moveTo(x + 2, y + 38); c.lineTo(x + 20, y + 30); c.lineTo(x + 5, y - 30); c.closePath(); c.fill();
        for (let i = 0; i < 6; i++) { c.strokeStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.moveTo(T.x, T.y); c.lineTo(L.x + (F.x - L.x) * i / 5, L.y + (F.y - L.y) * i / 5); c.stroke(); }
        c.strokeStyle = '#3a2a1a'; c.lineWidth = 3; c.beginPath(); c.moveTo(T.x, T.y); c.lineTo(T.x + 3, T.y - 14); c.stroke();
        for (let i = 0; i < 5; i++) { const px = x + rng.range(40, 80), py = y + rng.range(0, 30); ball(c, px, py - 8, 6, i % 2 ? '#8a7a6a' : '#c8b8a0', 8); }
      }
    },
    wagon: {
      w: 180, h: 140, oy: 100, tall: 1.5, draw: (c, x, y, v) => {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 6, y + 4, 60, 24, 0, 0, TAU); c.fill();
        box(c, x, y - 10, 46, 24, 16, '#6a4a2a');
        c.fillStyle = v ? '#c8b890' : '#b8a080';
        c.beginPath(); c.moveTo(x - 46, y - 26); c.quadraticCurveTo(x - 20, y - 80, x + 10, y - 60); c.lineTo(x + 46, y - 44); c.quadraticCurveTo(x + 14, y - 58, x + 2, y - 2); c.lineTo(x - 46, y - 26); c.fill();
        c.strokeStyle = '#6a5a40'; c.lineWidth = 1; c.stroke();
        for (const [wx, wy] of [[x - 30, y + 2], [x + 30, y + 4], [x + 8, y + 14]]) { c.strokeStyle = '#3a2410'; c.lineWidth = 3; c.beginPath(); c.ellipse(wx, wy, 10, 12, 0.4, 0, TAU); c.stroke(); }
      }
    },
    anvil: { w: 50, h: 40, oy: 30, draw: (c, x, y) => { box(c, x, y, 8, 5, 8, '#4a3a2a'); c.fillStyle = '#3a3a40'; c.beginPath(); c.moveTo(x - 14, y - 10); c.lineTo(x + 12, y - 16); c.lineTo(x + 16, y - 12); c.lineTo(x - 10, y - 6); c.fill(); } },
    forge: {
      w: 110, h: 110, oy: 80, tall: 1.2, draw: (c, x, y) => {
        box(c, x, y, 34, 20, 30, '#5a4a40');
        c.fillStyle = '#1a0a04'; c.fillRect(x - 10, y - 26, 20, 12);
        c.fillStyle = '#ff6a10'; c.fillRect(x - 8, y - 22, 16, 8);
        c.fillStyle = '#4a3a30'; c.fillRect(x - 6, y - 70, 12, 40);
      }
    },
    crates: { w: 60, h: 60, oy: 44, draw: (c, x, y) => { box(c, x, y, 14, 9, 14, '#7a5a34'); box(c, x + 6, y - 14, 10, 6, 10, '#8a6a3a'); } },
    well: {
      w: 70, h: 80, oy: 56, draw: (c, x, y) => {
        c.fillStyle = '#5a5650'; c.beginPath(); c.ellipse(x, y - 6, 20, 9, 0, 0, TAU); c.fill();
        c.fillStyle = '#10181a'; c.beginPath(); c.ellipse(x, y - 9, 14, 6, 0, 0, TAU); c.fill();
        c.strokeStyle = '#4a3420'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 17, y - 6); c.lineTo(x - 17, y - 44); c.lineTo(x + 17, y - 44); c.lineTo(x + 17, y - 6); c.stroke();
        c.fillStyle = '#5a3a1c'; c.beginPath(); c.moveTo(x - 24, y - 42); c.lineTo(x, y - 58); c.lineTo(x + 24, y - 42); c.fill();
      }
    },
    cave: {
      w: 200, h: 160, oy: 110, tall: 2, draw: (c, x, y, v, rng) => {
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(x + 10, y + 10, 90, 34, 0, 0, TAU); c.fill();
        for (let i = 0; i < 12; i++) ball(c, x + rng.range(-70, 60), y - rng.range(10, 70), rng.range(22, 36), '#5e584e', rng.range(18, 26));
        c.fillStyle = '#050302'; c.beginPath(); c.ellipse(x + 30, y + 16, 26, 22, -0.4, Math.PI, TAU); c.lineTo(x + 56, y + 20); c.lineTo(x + 6, y + 30); c.closePath(); c.fill();
        c.strokeStyle = '#3a342c'; c.lineWidth = 3; c.stroke();
      }
    },
    tower: {
      w: 230, h: 260, oy: 190, tall: 4, draw: (c, x, y, v, rng) => {
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(x + 10, y + 8, 100, 40, 0, 0, TAU); c.fill();
        const g = c.createLinearGradient(x - 70, 0, x + 70, 0); g.addColorStop(0, '#6a6258'); g.addColorStop(0.45, '#8a8278'); g.addColorStop(1, '#3a342e');
        c.fillStyle = g;
        c.beginPath(); c.moveTo(x - 70, y); c.lineTo(x - 70, y - 120); for (let i = 0; i <= 10; i++) c.lineTo(x - 70 + i * 14, y - 120 - (i % 2 ? rng.range(10, 40) : rng.range(0, 10)) - (i > 5 ? 30 : 0)); c.lineTo(x + 70, y); c.quadraticCurveTo(x, y + 30, x - 70, y); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.3)'; for (let r = 0; r < 9; r++) { c.beginPath(); c.moveTo(x - 70, y - r * 14); c.quadraticCurveTo(x, y - r * 14 + 28, x + 70, y - r * 14); c.stroke(); }
        c.fillStyle = '#050302'; c.beginPath(); c.moveTo(x + 10, y + 24); c.lineTo(x + 10, y - 20); c.arc(x + 30, y - 20, 20, Math.PI, TAU); c.lineTo(x + 50, y + 18); c.fill();
      }
    },
    cairn: {
      w: 50, h: 90, oy: 76, draw: (c, x, y, v, rng, ex) => {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 3, y + 2, 14, 6, 0, 0, TAU); c.fill();
        const g = c.createLinearGradient(x - 10, 0, x + 10, 0); g.addColorStop(0, '#8a867e'); g.addColorStop(1, '#46423c');
        c.fillStyle = g; c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x - 8, y - 50); c.quadraticCurveTo(x, y - 62, x + 8, y - 52); c.lineTo(x + 10, y); c.fill();
        c.fillStyle = ex === 'lit' ? '#ff4030' : '#2a2824';
        c.font = 'bold 14px serif'; c.textAlign = 'center'; c.fillText(D.CAIRN_RUNES[v % 5], x, y - 28);
      }
    },
    inifuss: {
      w: 260, h: 300, oy: 250, tall: 5, draw: (c, x, y, v, rng) => {
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(x + 16, y + 6, 100, 36, 0, 0, TAU); c.fill();
        const tc = '#3a2c20';
        for (let i = 0; i < 5; i++) D.Sprites.capsule(c, { x: x + rng.range(-30, 30), y: y + 10 }, { x: x + rng.range(-10, 10), y: y - 60 }, 10, 12, tc);
        D.Sprites.capsule(c, { x, y }, { x: x + 4, y: y - 140 }, 24, 14, tc);
        for (let i = 0; i < 7; i++) D.Sprites.capsule(c, { x, y: y - 100 - i * 10 }, { x: x + rng.range(-90, 90), y: y - 150 - rng.range(0, 60) }, 7, 3, tc);
        foliage(c, x, y - 190, 90, '#2a3a1e', rng, 40);
        c.fillStyle = '#1a1008'; c.beginPath(); c.ellipse(x + 6, y - 60, 7, 12, 0, 0, TAU); c.fill();
      }
    },
    cage: {
      w: 120, h: 150, oy: 110, tall: 2, draw: (c, x, y) => {
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x + 6, y + 4, 40, 16, 0, 0, TAU); c.fill();
        c.fillStyle = '#4a3a28'; c.beginPath(); c.moveTo(x - 36, y); c.lineTo(x, y + 18); c.lineTo(x + 36, y); c.lineTo(x, y - 18); c.fill();
        c.strokeStyle = '#5a4430'; c.lineWidth = 3;
        for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x + i * 10, y + 18 - Math.abs(i) * 5); c.lineTo(x + i * 10, y - 72 + 18 - Math.abs(i) * 5); c.stroke(); }
        c.beginPath(); c.moveTo(x - 36, y - 72); c.lineTo(x, y - 54); c.lineTo(x + 36, y - 72); c.lineTo(x, y - 90); c.closePath(); c.stroke();
      }
    },
    tome: {
      w: 50, h: 60, oy: 48, draw: (c, x, y) => {
        c.fillStyle = '#4a3420'; c.fillRect(x - 2, y - 26, 4, 26);
        c.fillStyle = '#5a3a1e'; c.beginPath(); c.moveTo(x - 14, y - 28); c.lineTo(x, y - 22); c.lineTo(x + 14, y - 28); c.lineTo(x, y - 34); c.fill();
        c.fillStyle = '#d8c8a0'; c.beginPath(); c.moveTo(x - 12, y - 30); c.lineTo(x, y - 25); c.lineTo(x + 12, y - 30); c.lineTo(x, y - 35); c.fill();
      }
    },
    malus: { w: 50, h: 50, oy: 40, draw: (c, x, y) => { box(c, x, y, 12, 8, 10, '#5a5650'); } },
    wp: {
      w: 130, h: 70, oy: 36, draw: (c, x, y) => {
        c.fillStyle = '#4a4640'; c.beginPath(); c.ellipse(x, y, 60, 28, 0, 0, TAU); c.fill();
        c.fillStyle = '#6a665e'; c.beginPath(); c.ellipse(x, y - 2, 56, 25, 0, 0, TAU); c.fill();
        c.strokeStyle = '#3a3630'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y - 2, 40, 18, 0, 0, TAU); c.stroke();
        c.fillStyle = '#2a2824';
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.font = '9px serif'; c.textAlign = 'center'; c.fillText(D.CAIRN_RUNES[i % 5], x + Math.cos(a) * 48, y - 2 + Math.sin(a) * 21 + 3); }
        for (const [px, py] of [[-44, -8], [44, -8], [0, -22], [0, 18]]) { c.fillStyle = '#5a5650'; c.fillRect(x + px - 4, y + py - 14, 8, 16); c.fillStyle = '#7a766e'; c.fillRect(x + px - 4, y + py - 16, 8, 3); }
      }
    },
    stairs_down: {
      w: 110, h: 70, oy: 36, draw: (c, x, y) => {
        c.fillStyle = '#050302'; c.beginPath(); c.moveTo(x - 40, y); c.lineTo(x, y - 20); c.lineTo(x + 40, y); c.lineTo(x, y + 20); c.fill();
        for (let i = 0; i < 5; i++) { c.fillStyle = D.shade('#4a4038', -i * 0.15); c.beginPath(); c.moveTo(x - 36 + i * 6, y + 2 - i * 3); c.lineTo(x + 4 + i * 6, y + 22 - i * 3 - 4); c.lineTo(x + 8 + i * 6, y + 20 - i * 3 - 4); c.lineTo(x - 32 + i * 6, y - i * 3); c.fill(); }
        c.strokeStyle = '#6a6058'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 40, y); c.lineTo(x, y - 20); c.lineTo(x + 40, y); c.stroke();
      }
    },
    stairs_up: {
      w: 110, h: 110, oy: 70, draw: (c, x, y) => {
        for (let i = 0; i < 7; i++) { c.fillStyle = D.shade('#6a6058', -i * 0.08); c.beginPath(); c.moveTo(x - 30 - i * 2, y - i * 8); c.lineTo(x + 30 - i * 2, y - i * 8 - 15); c.lineTo(x + 30 - i * 2, y - i * 8 - 21); c.lineTo(x - 30 - i * 2, y - i * 8 - 6); c.fill(); }
        c.fillStyle = '#050302'; c.fillRect(x - 20, y - 70, 40, 16);
      }
    },
    gate: {
      w: 220, h: 230, oy: 150, tall: 3, draw: (c, x, y) => {
        const g = c.createLinearGradient(x - 90, 0, x + 90, 0); g.addColorStop(0, '#6a625a'); g.addColorStop(1, '#3a342e');
        c.fillStyle = g;
        c.fillRect(x - 90, y - 140, 40, 150); c.fillRect(x + 50, y - 140, 40, 150);
        c.beginPath(); c.moveTo(x - 90, y - 140); c.lineTo(x + 90, y - 140); c.lineTo(x + 90, y - 110); c.lineTo(x + 50, y - 110); c.arc(x, y - 110, 50, 0, Math.PI, true); c.lineTo(x - 90, y - 110); c.fill();
        for (let i = 0; i < 9; i++) { c.fillStyle = '#4a443e'; c.fillRect(x - 90 + i * 20, y - 152, 12, 12); }
        c.strokeStyle = 'rgba(0,0,0,0.3)'; for (let r = 0; r < 10; r++) { c.beginPath(); c.moveTo(x - 90, y - r * 14); c.lineTo(x - 50, y - r * 14); c.moveTo(x + 50, y - r * 14); c.lineTo(x + 90, y - r * 14); c.stroke(); }
        c.fillStyle = 'rgba(20,14,10,0.5)'; c.fillRect(x - 50, y - 110, 100, 120);
        c.strokeStyle = '#2a2420'; c.lineWidth = 2; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(x + i * 11, y - 150 + 40); c.lineTo(x + i * 11, y - 115 - Math.sqrt(Math.max(0, 2500 - i * i * 121)) * 0.1); c.stroke(); }
      }
    },
    wirt: {
      w: 60, h: 40, oy: 30, draw: (c, x, y) => {
        c.fillStyle = 'rgba(80,10,10,0.6)'; c.beginPath(); c.ellipse(x, y, 18, 7, 0, 0, TAU); c.fill();
        D.Sprites.capsule(c, { x: x - 12, y: y - 2 }, { x: x + 8, y: y - 6 }, 4, 3.5, '#5a4a3a');
        D.Sprites.ball(c, { x: x - 14, y: y - 3 }, 4, '#d8b898');
        D.Sprites.capsule(c, { x: x + 8, y: y - 6 }, { x: x + 16, y: y }, 2, 2, '#8a6a3a');
      }
    },
    altar: {
      w: 110, h: 90, oy: 60, draw: (c, x, y) => {
        box(c, x, y, 40, 18, 22, '#6a6058');
        c.fillStyle = '#a02020'; c.beginPath(); c.moveTo(x - 30, y - 24); c.lineTo(x + 6, y - 38); c.lineTo(x + 34, y - 24); c.lineTo(x - 2, y - 12); c.fill();
        for (const dx of [-26, 26]) { c.fillStyle = '#d8c090'; c.fillRect(x + dx - 2, y - 44, 4, 14); }
      }
    },
    throne: {
      w: 120, h: 150, oy: 100, tall: 2, draw: (c, x, y) => {
        box(c, x, y, 36, 20, 16, '#3a2020');
        c.fillStyle = '#4a1818'; c.beginPath(); c.moveTo(x - 30, y - 16); c.lineTo(x - 26, y - 96); c.lineTo(x, y - 110); c.lineTo(x + 26, y - 96); c.lineTo(x + 30, y - 16); c.fill();
        c.fillStyle = '#d8c8a0'; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * 12 - 3, y - 96); c.lineTo(x + i * 12, y - 122); c.lineTo(x + i * 12 + 3, y - 96); c.fill(); }
      }
    },
    wtorch: {
      w: 30, h: 60, oy: 50, draw: (c, x, y) => {
        c.fillStyle = '#3a3a3a'; c.fillRect(x - 2, y - 50, 4, 14);
        c.fillStyle = '#5a3a1a'; c.fillRect(x - 3, y - 56, 6, 8);
      }
    }
  };

  function box(c, x, y, hw, hd, h, col) {
    c.fillStyle = D.shade(col, -0.35);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + hw, y - hd * 0.5 - hd * 0.5); c.lineTo(x + hw, y - hd - h); c.lineTo(x, y - h); c.fill();
    c.fillStyle = D.shade(col, -0.1);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - hw, y - hd); c.lineTo(x - hw, y - hd - h); c.lineTo(x, y - h); c.fill();
    c.fillStyle = D.shade(col, 0.15);
    c.beginPath(); c.moveTo(x, y - h); c.lineTo(x - hw, y - hd - h); c.lineTo(x, y - 2 * hd - h); c.lineTo(x + hw, y - hd - h); c.closePath(); c.fill();
  }

  function palisade(c, x, y, v) {
    const rng = new D.RNG(v * 977 + 13);
    for (let i = 0; i < 3; i++) {
      const px = x - 20 + i * 18 + rng.range(-2, 2), py = y + (i - 1) * 3;
      const h = 70 + rng.range(-6, 8);
      const g = c.createLinearGradient(px - 7, 0, px + 7, 0);
      g.addColorStop(0, '#5a4028'); g.addColorStop(0.4, '#7a5838'); g.addColorStop(1, '#2e2014');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(px - 7, py); c.lineTo(px - 7, py - h); c.lineTo(px, py - h - 12); c.lineTo(px + 7, py - h); c.lineTo(px + 7, py); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px - 2, py - 10); c.lineTo(px - 2, py - h + 10); c.stroke();
    }
    c.strokeStyle = '#3a2a18'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x - 28, y - 24); c.lineTo(x + 28, y - 18); c.moveTo(x - 28, y - 52); c.lineTo(x + 28, y - 46); c.stroke();
  }

  function palSprite(v) {
    const key = 'pal:' + v;
    if (OBJ[key]) return OBJ[key];
    const cv = mk(80, 110);
    palisade(cv.getContext('2d'), 40, 96, v);
    OBJ[key] = { cv, ox: 40, oy: 96, w: 80, h: 110 };
    return OBJ[key];
  }

  function pillarSprite(theme) {
    const key = 'pillar:' + theme;
    if (OBJ[key]) return OBJ[key];
    const cv = mk(70, 130);
    const c = cv.getContext('2d');
    const x = 35, y = 112;
    box(c, x, y, 26, 13, 10, '#4a4440');
    const g = c.createLinearGradient(x - 16, 0, x + 16, 0);
    g.addColorStop(0, '#5a544e'); g.addColorStop(0.4, '#8a847c'); g.addColorStop(1, '#2e2a26');
    c.fillStyle = g; c.fillRect(x - 15, y - 100, 30, 88);
    box(c, x, y - 96, 22, 11, 8, '#5a544e');
    OBJ[key] = { cv, ox: x, oy: y, w: 70, h: 130 };
    return OBJ[key];
  }

  function cliffSprite(v) {
    const key = 'cliff:' + v;
    if (OBJ[key]) return OBJ[key];
    const cv = mk(90, 110);
    const c = cv.getContext('2d');
    const rng = new D.RNG(v * 131 + 5);
    const x = 45, y = 86;
    for (let i = 0; i < 5; i++) ball(c, x + rng.range(-24, 24), y - 20 - rng.range(0, 36), rng.range(16, 24), ['#5e584e', '#6a6254', '#524c44'][i % 3], rng.range(14, 20));
    OBJ[key] = { cv, ox: x, oy: y, w: 90, h: 110 };
    return OBJ[key];
  }

  function ruinSprite(v) {
    const key = 'ruin:' + v;
    if (OBJ[key]) return OBJ[key];
    const cv = mk(80, 90);
    const c = cv.getContext('2d');
    const rng = new D.RNG(v * 71 + 9);
    const x = 40, y = 70;
    const h = 14 + rng.range(0, 36);
    box(c, x, y, 32, 16, h, '#4a403a');
    c.fillStyle = 'rgba(0,0,0,0.5)';
    for (let i = 0; i < 4; i++) c.fillRect(x + rng.range(-28, 20), y - h - rng.range(0, 10), rng.range(4, 10), rng.range(3, 8));
    OBJ[key] = { cv, ox: x, oy: y, w: 80, h: 90 };
    return OBJ[key];
  }

  function fenceSprite(v) {
    const key = 'fence:' + v;
    if (OBJ[key]) return OBJ[key];
    const cv = mk(80, 70);
    const c = cv.getContext('2d');
    const rng = new D.RNG(v * 53 + 3);
    const x = 40, y = 50;
    box(c, x, y, 32, 16, 20, '#6a645a');
    for (let i = 0; i < 9; i++) { c.fillStyle = D.shade('#6a645a', rng.range(-0.3, 0.15)); c.beginPath(); c.ellipse(x + rng.range(-24, 24), y - 20 - 12 + rng.range(-8, 8), rng.range(5, 9), rng.range(3, 5), 0, 0, TAU); c.fill(); }
    OBJ[key] = { cv, ox: x, oy: y, w: 80, h: 70 };
    return OBJ[key];
  }

  D.Terrain = { Ground, tex, faceTex, wallTop, voidPattern, objSprite, palSprite, pillarSprite, cliffSprite, ruinSprite, fenceSprite, WALL_H, box, mk };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
