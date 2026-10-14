/**
 * Diablo 98 — isometric Canvas renderer. All art is procedural (no bitmaps).
 * World viewport: 640x352 logical pixels (the classic control panel sits below it).
 */
(function (D) {
  'use strict';
  const T = D.T, TW = 64, TH = 32, WALL_H = 76, VIEW_W = 640, VIEW_H = 352;

  function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 144665) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function makeCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(Math.max(1, w), Math.max(1, h));
    const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c;
  }
  const diamond = (c, x, y, w = TW, h = TH) => { c.beginPath(); c.moveTo(x, y - h / 2); c.lineTo(x + w / 2, y); c.lineTo(x, y + h / 2); c.lineTo(x - w / 2, y); c.closePath(); };

  // ------------------------------------------------------------------ item icons (shared with UI)
  const iconCache = new Map();
  function itemIcon(item, cell = 28) {
    const b = D.baseOf(item);
    const key = `${item.base}|${b.color || ''}|${item.quality}|${item.unique || ''}|${item.spell || ''}|${cell}`;
    if (iconCache.has(key)) return iconCache.get(key);
    const w = b.w * cell, h = b.h * cell, R = 2;
    const cv = makeCanvas(w * R, h * R), c = cv.getContext('2d'); c.scale(R, R);
    drawIcon(c, b, item, w, h);
    iconCache.set(key, cv); return cv;
  }
  function metal(b) { const h = hash(b.id.length * 7, b.id.charCodeAt(0), b.id.charCodeAt(b.id.length - 1)); return ['#b8bcc4', '#a8acb4', '#c8c0a8', '#9aa0a8'][h % 4]; }
  function drawIcon(c, b, item, w, h) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    const m = metal(b), dark = '#2a2018', wood = '#7a5530', gold = '#d8b048';
    const uq = item.quality === 'unique';
    const outline = (fn) => { c.save(); c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 2; fn(); c.restore(); };
    outline(() => {
      switch (b.cls) {
        case 'sword': {
          const big = b.w > 1; c.save(); c.translate(w / 2, h / 2); c.rotate(big ? -0.62 : -0.1);
          const L = (big ? h * 1.05 : h * 0.92) / 2, bw = big ? 7 : b.id === 'dagger' ? 4 : 5;
          const grad = c.createLinearGradient(-bw, 0, bw, 0); grad.addColorStop(0, shade(m, -0.3)); grad.addColorStop(0.5, shade(m, 0.4)); grad.addColorStop(1, shade(m, -0.2));
          c.fillStyle = grad; c.beginPath(); c.moveTo(0, -L); c.lineTo(bw / 2, -L + 6); c.lineTo(bw / 2, L * 0.45); c.lineTo(-bw / 2, L * 0.45); c.lineTo(-bw / 2, -L + 6); c.closePath(); c.fill();
          if (b.id === 'sabre' || b.id === 'scimitar') { c.strokeStyle = shade(m, 0.5); c.lineWidth = 1; c.beginPath(); c.moveTo(bw / 2, -L + 6); c.quadraticCurveTo(bw * 2, 0, bw / 2, L * 0.45); c.stroke(); }
          c.fillStyle = uq ? gold : '#8a7040'; c.fillRect(-bw * 1.6, L * 0.45, bw * 3.2, 3);
          c.fillStyle = '#4a3020'; c.fillRect(-1.5, L * 0.45 + 3, 3, L * 0.38); c.fillStyle = uq ? gold : '#a08050'; c.beginPath(); c.arc(0, L * 0.9, 2.5, 0, 7); c.fill();
          c.restore(); break;
        }
        case 'axe': case 'mace': {
          c.save(); c.translate(w / 2, h / 2); c.rotate(b.w > 1 ? -0.45 : -0.12); const L = h * (b.w > 1 ? 0.48 : 0.4);
          c.strokeStyle = wood; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -L); c.lineTo(0, L); c.stroke();
          if (b.cls === 'axe') {
            const s = b.id.includes('great') || b.id.includes('battle') || b.id.includes('broad') ? 1.4 : 1;
            c.fillStyle = m; c.beginPath(); c.moveTo(2, -L + 2); c.quadraticCurveTo(16 * s, -L - 4 * s, 15 * s, -L + 14 * s); c.quadraticCurveTo(8, -L + 10, 2, -L + 12); c.closePath(); c.fill();
            if (s > 1) { c.beginPath(); c.moveTo(-2, -L + 2); c.quadraticCurveTo(-14, -L - 2, -13, -L + 12); c.quadraticCurveTo(-7, -L + 9, -2, -L + 11); c.fill(); }
            c.strokeStyle = shade(m, 0.5); c.lineWidth = 1; c.beginPath(); c.moveTo(15 * s, -L + 13 * s); c.quadraticCurveTo(16 * s, -L, 11 * s, -L - 1); c.stroke();
          } else {
            c.fillStyle = b.id.includes('club') ? '#5a3a20' : m;
            if (b.id === 'morningstar' || b.id === 'flail') { c.beginPath(); c.arc(0, -L + 3, 7, 0, 7); c.fill(); c.strokeStyle = m; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(a) * 6, -L + 3 + Math.sin(a) * 6); c.lineTo(Math.cos(a) * 10, -L + 3 + Math.sin(a) * 10); c.stroke(); } }
            else if (b.id === 'warhammer' || b.id === 'maul') { c.fillRect(-10, -L - 2, 20, 11); c.fillStyle = shade(m, 0.4); c.fillRect(-10, -L - 2, 20, 3); }
            else { c.beginPath(); c.ellipse(0, -L + 6, 6, 10, 0, 0, 7); c.fill(); if (b.id === 'spikedclub') { c.fillStyle = '#ccc'; for (let i = 0; i < 6; i++) c.fillRect(-7 + (i % 2) * 12, -L + i * 3, 2, 2); } }
          }
          c.restore(); break;
        }
        case 'bow': {
          c.save(); c.translate(w / 2, h / 2); c.rotate(-0.5); const L = h * 0.48;
          c.strokeStyle = b.id.includes('war') ? '#4a3018' : b.id.includes('battle') ? '#6a4420' : '#8a6030'; c.lineWidth = 4;
          c.beginPath(); c.moveTo(0, -L); c.quadraticCurveTo(w * 0.55, 0, 0, L); c.stroke();
          c.strokeStyle = '#ddd'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -L); c.lineTo(0, L); c.stroke();
          c.fillStyle = '#3a2010'; c.fillRect(w * 0.2, -4, 5, 8); c.restore(); break;
        }
        case 'staff': {
          c.save(); c.translate(w / 2, h / 2); c.rotate(-0.12); const L = h * 0.48;
          c.strokeStyle = b.id.includes('war') ? '#3a2a1a' : wood; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -L + 6); c.lineTo(0, L); c.stroke();
          const col = item.staffSpell ? D.DATA.SPELLS[item.staffSpell].color : '#80a0ff';
          const g = c.createRadialGradient(0, -L + 5, 1, 0, -L + 5, 7); g.addColorStop(0, '#fff'); g.addColorStop(0.4, col); g.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = g; c.beginPath(); c.arc(0, -L + 5, 7, 0, 7); c.fill(); c.restore(); break;
        }
        case 'shield': {
          const cx = w / 2, cy = h / 2, sw = w * 0.42, sh = h * 0.44;
          const col = { buckler: '#8a6a40', smallshield: '#6a5040', largeshield: '#5a5a6a', kiteshield: '#7a2a2a', towershield: '#4a5a7a', gothicshield: '#8a8a9a' }[b.id] || '#666';
          const g = c.createLinearGradient(cx - sw, cy - sh, cx + sw, cy + sh); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(1, shade(col, -0.4)); c.fillStyle = g;
          c.beginPath();
          if (b.id === 'buckler' || b.id === 'smallshield') c.arc(cx, cy, Math.min(sw, sh), 0, 7);
          else { c.moveTo(cx - sw, cy - sh); c.lineTo(cx + sw, cy - sh); c.lineTo(cx + sw, cy + sh * 0.1); c.quadraticCurveTo(cx + sw, cy + sh * 0.7, cx, cy + sh); c.quadraticCurveTo(cx - sw, cy + sh * 0.7, cx - sw, cy + sh * 0.1); c.closePath(); }
          c.fill(); c.strokeStyle = uq ? gold : shade(m, 0.2); c.lineWidth = 2; c.stroke();
          c.fillStyle = shade(m, 0.3); c.beginPath(); c.arc(cx, cy - sh * 0.1, 3, 0, 7); c.fill(); break;
        }
        case 'helm': {
          const cx = w / 2, cy = h * 0.58, r = w * 0.36;
          if (b.id === 'cap') { c.fillStyle = '#6a4a30'; c.beginPath(); c.arc(cx, cy, r, Math.PI, 0); c.lineTo(cx + r + 3, cy + 4); c.lineTo(cx - r - 3, cy + 4); c.fill(); break; }
          if (b.id === 'crown') { c.fillStyle = gold; c.beginPath(); c.moveTo(cx - r, cy + 6); c.lineTo(cx - r, cy - 6); c.lineTo(cx - r / 2, cy); c.lineTo(cx, cy - 10); c.lineTo(cx + r / 2, cy); c.lineTo(cx + r, cy - 6); c.lineTo(cx + r, cy + 6); c.closePath(); c.fill(); c.fillStyle = '#c02020'; c.beginPath(); c.arc(cx, cy + 1, 2.5, 0, 7); c.fill(); break; }
          const g = c.createLinearGradient(cx - r, 0, cx + r, 0); g.addColorStop(0, shade(m, -0.4)); g.addColorStop(0.5, shade(m, 0.3)); g.addColorStop(1, shade(m, -0.3));
          c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, Math.PI, 0); c.lineTo(cx + r, cy + (b.id === 'fullhelm' || b.id === 'greathelm' ? 12 : 5)); c.lineTo(cx - r, cy + (b.id === 'fullhelm' || b.id === 'greathelm' ? 12 : 5)); c.fill();
          if (b.id === 'skullcap') { c.fillStyle = '#e0d8c0'; c.beginPath(); c.arc(cx, cy - 2, r * 0.6, 0, 7); c.fill(); c.fillStyle = '#000'; c.fillRect(cx - 5, cy - 3, 3, 3); c.fillRect(cx + 2, cy - 3, 3, 3); }
          if (b.id === 'fullhelm' || b.id === 'greathelm') { c.fillStyle = '#111'; c.fillRect(cx - r + 4, cy + 2, r * 2 - 8, 3); c.fillRect(cx - 1, cy + 2, 2, 9); }
          break;
        }
        case 'armor': {
          const cx = w / 2, top = h * 0.12, bot = h * 0.9, sw = w * 0.42;
          const heavy = /plate|splint|breast|scale|chain|ring/.test(b.id), cloth = /rags|cape|cloak|robe/.test(b.id);
          const col = cloth ? (b.id === 'robe' ? '#4a3a6a' : b.id === 'rags' ? '#6a5a4a' : '#5a3a2a') : heavy ? m : '#7a5030';
          const g = c.createLinearGradient(cx - sw, 0, cx + sw, 0); g.addColorStop(0, shade(col, -0.4)); g.addColorStop(0.5, shade(col, 0.2)); g.addColorStop(1, shade(col, -0.4));
          c.fillStyle = g; c.beginPath(); c.moveTo(cx - sw * 0.5, top); c.lineTo(cx - sw, top + 8); c.lineTo(cx - sw * 0.85, top + 22); c.lineTo(cx - sw * 0.6, top + 20); c.lineTo(cx - sw * 0.6, bot); c.lineTo(cx + sw * 0.6, bot); c.lineTo(cx + sw * 0.6, top + 20); c.lineTo(cx + sw * 0.85, top + 22); c.lineTo(cx + sw, top + 8); c.lineTo(cx + sw * 0.5, top); c.quadraticCurveTo(cx, top + 10, cx - sw * 0.5, top); c.fill();
          if (heavy) { c.strokeStyle = shade(col, -0.5); c.lineWidth = 1; for (let y = top + 24; y < bot; y += 8) { c.beginPath(); c.moveTo(cx - sw * 0.6, y); c.lineTo(cx + sw * 0.6, y); c.stroke(); } }
          if (b.id === 'studded') { c.fillStyle = '#ccc'; for (let y = top + 24; y < bot - 4; y += 9) for (let x = -2; x <= 2; x++) c.fillRect(cx + x * 6, y, 2, 2); }
          if (uq) { c.strokeStyle = gold; c.lineWidth = 1.5; c.stroke(); }
          break;
        }
        case 'ring': { c.strokeStyle = uq ? gold : '#c8a040'; c.lineWidth = 3; c.beginPath(); c.arc(w / 2, h / 2 + 2, 7, 0, 7); c.stroke(); c.fillStyle = ['#e02020', '#2060e0', '#20c040', '#e0e0e0'][hash(item.uid || 1, 3) % 4]; c.beginPath(); c.arc(w / 2, h / 2 - 5, 3.5, 0, 7); c.fill(); break; }
        case 'amulet': { c.strokeStyle = '#c8a040'; c.lineWidth = 1.5; c.beginPath(); c.arc(w / 2, h / 2 - 4, 8, Math.PI * 0.1, Math.PI * 0.9, true); c.stroke(); c.fillStyle = uq ? gold : '#b08030'; c.beginPath(); c.moveTo(w / 2, h / 2 + 2); c.lineTo(w / 2 + 5, h / 2 + 7); c.lineTo(w / 2, h / 2 + 12); c.lineTo(w / 2 - 5, h / 2 + 7); c.closePath(); c.fill(); c.fillStyle = '#40c0ff'; c.beginPath(); c.arc(w / 2, h / 2 + 7, 2, 0, 7); c.fill(); break; }
        case 'potion': {
          const cx = w / 2, cy = h / 2 + 3, big = /full|elixir/.test(b.id);
          c.fillStyle = 'rgba(200,220,255,.35)'; c.beginPath(); c.arc(cx, cy, big ? 9 : 8, 0, 7); c.fill(); c.fillRect(cx - 3, cy - 14, 6, 8);
          c.fillStyle = b.color; c.beginPath(); c.arc(cx, cy + 1, big ? 8 : 7, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(cx - 3, cy - 2, 2, 0, 7); c.fill();
          c.fillStyle = '#6a4a2a'; c.fillRect(cx - 3, cy - 16, 6, 4); break;
        }
        case 'scroll': { c.fillStyle = '#d8c898'; c.fillRect(6, 6, w - 12, h - 12); c.fillStyle = '#b09860'; c.fillRect(4, 5, w - 8, 3); c.fillRect(4, h - 8, w - 8, 3); c.fillStyle = D.DATA.SPELLS[b.spell].color; c.fillRect(9, 11, w - 18, 2); c.fillRect(9, 15, w - 20, 1); c.fillRect(9, 18, w - 16, 1); break; }
        case 'book': {
          const col = D.DATA.SPELLS[item.spell] ? D.DATA.SPELLS[item.spell].color : '#a04040';
          c.fillStyle = shade(col, -0.55); c.fillRect(8, 6, w - 16, h - 12); c.fillStyle = '#e8e0c8'; c.fillRect(w - 10, 8, 3, h - 16);
          c.strokeStyle = gold; c.lineWidth = 1.5; c.strokeRect(11, 9, w - 24, h - 18);
          c.fillStyle = col; c.beginPath(); c.arc(w / 2 - 2, h / 2, 5, 0, 7); c.fill(); break;
        }
        case 'gold': { for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#e8c050' : '#c09030'; c.beginPath(); c.ellipse(8 + (i % 3) * 6, h - 7 - Math.floor(i / 3) * 5, 5, 3, 0, 0, 7); c.fill(); } break; }
        case 'quest': {
          if (b.id === 'anvil') { c.fillStyle = '#3a3a44'; c.fillRect(10, h * 0.4, w - 20, 12); c.beginPath(); c.moveTo(10, h * 0.4); c.lineTo(4, h * 0.3); c.lineTo(w - 4, h * 0.3); c.lineTo(w - 10, h * 0.4); c.fill(); c.fillRect(w / 2 - 6, h * 0.4 + 12, 12, 10); c.fillRect(w / 2 - 12, h - 10, 24, 5); c.fillStyle = '#ff5020'; c.fillRect(12, h * 0.3 + 1, w - 24, 2); }
          else { const g = c.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, 11); g.addColorStop(0, '#fff'); g.addColorStop(0.4, '#80ffff'); g.addColorStop(1, '#205060'); c.fillStyle = g; c.beginPath(); c.moveTo(w / 2, 3); c.lineTo(w - 5, h / 2); c.lineTo(w / 2, h - 3); c.lineTo(5, h / 2); c.closePath(); c.fill(); }
          break;
        }
      }
    });
  }

  // ------------------------------------------------------------------ renderer
  class Renderer {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.R = 1; this.tex = {}; this.cam = { x: 0, y: 0 }; this.time = 0; this.hover = null; this.showLabels = false; this.labelBoxes = [];
    }
    setResolution(R) {
      R = Math.max(1, Math.min(3, Math.round(R)));
      if (R === this.R && this.canvas.width === 640 * R) return;
      this.R = R; this.canvas.width = 640 * R; this.canvas.height = 480 * R; this.tex = {};
    }
    // textures per theme --------------------------------------------------
    themeTex(theme) {
      if (this.tex[theme.id]) return this.tex[theme.id];
      const R = this.R, t = { floors: [], left: null, right: null };
      const mk = (w, h, fn) => { const cv = makeCanvas(w * R, h * R), c = cv.getContext('2d'); c.scale(R, R); fn(c); return cv; };
      if (theme.id === 'town') {
        const floor = (base, spots, kind) => mk(TW, TH, c => {
          diamond(c, 32, 16); c.save(); c.clip(); c.fillStyle = base; c.fillRect(0, 0, TW, TH);
          for (let i = 0; i < 70; i++) { const h = hash(i, spots, kind.length); c.fillStyle = spots[(h >> 3) % spots.length]; c.fillRect(h % TW, (h >> 8) % TH, kind === 'grass' ? 1 : 2, kind === 'grass' ? 2 : 1); }
          c.restore();
        });
        for (let k = 0; k < 3; k++) t.floors.push(floor(['#3b5226', '#40582a', '#37501f'][k], ['#4c6a30', '#2c4018', '#5a7a3a', '#6a6a30'], 'grass' + k));
        t.dirt = [0, 1].map(k => floor(['#6a5438', '#62502f'][k], ['#7a6444', '#54432a', '#8a7454'], 'dirt' + k));
        t.bridge = mk(TW, TH, c => { diamond(c, 32, 16); c.save(); c.clip(); c.fillStyle = '#6a4a2a'; c.fillRect(0, 0, TW, TH); c.strokeStyle = '#3a2a18'; for (let i = -64; i < 64; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 64, 32); c.stroke(); } c.restore(); });
      } else {
        for (let k = 0; k < 4; k++) t.floors.push(mk(TW, TH, c => {
          diamond(c, 32, 16); c.save(); c.clip(); c.fillStyle = theme.floor[k % 3]; c.fillRect(0, 0, TW, TH);
          for (let i = 0; i < 90; i++) { const h = hash(i, k, theme.id.length); c.fillStyle = h & 1 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; c.fillRect(h % TW, (h >> 8) % TH, 2, 1); }
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1;
          if (theme.id === 'cathedral' || theme.id === 'hell') { c.beginPath(); c.moveTo(16, 8); c.lineTo(48, 24); c.moveTo(48, 8); c.lineTo(16, 24); c.stroke(); }
          else if (theme.id === 'catacombs') { for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(j * 16, 0); c.lineTo(j * 16 + 32, 16 + (j % 2) * 16); c.stroke(); } }
          else { c.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 5; i++) { const h = hash(i + 50, k, 3); c.beginPath(); c.ellipse(h % 50 + 7, (h >> 6) % 20 + 6, 5, 2, 0, 0, 7); c.fill(); } }
          c.strokeStyle = 'rgba(255,255,255,.06)'; diamond(c, 32, 16); c.stroke(); c.restore();
        }));
        const face = (left) => mk(32, WALL_H + 16, c => {
          c.beginPath();
          if (left) { c.moveTo(0, 0); c.lineTo(32, 16); c.lineTo(32, 16 + WALL_H); c.lineTo(0, WALL_H); }
          else { c.moveTo(0, 16); c.lineTo(32, 0); c.lineTo(32, WALL_H); c.lineTo(0, 16 + WALL_H); }
          c.closePath(); c.save(); c.clip();
          c.fillStyle = shade(theme.wall, left ? -0.35 : -0.1); c.fillRect(0, 0, 32, WALL_H + 16);
          const slope = left ? 0.5 : -0.5, off = left ? 0 : 16, rowH = theme.id === 'caves' ? 13 : 10;
          c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1;
          for (let y = rowH, r = 0; y < WALL_H + 20; y += rowH, r++) {
            c.beginPath(); c.moveTo(0, y + off - 16 * (left ? 0 : 0)); c.lineTo(32, y + off + 32 * slope); c.stroke();
            if (theme.id !== 'caves') for (let x = (r % 2) * 8 + 4; x < 32; x += 16) { c.beginPath(); c.moveTo(x, y + off + x * slope - rowH); c.lineTo(x, y + off + x * slope); c.stroke(); }
          }
          for (let i = 0; i < 60; i++) { const h = hash(i, left ? 1 : 2, theme.id.length); c.fillStyle = h & 1 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.15)'; c.fillRect(h % 32, (h >> 8) % (WALL_H + 16), 2, 2); }
          const g = c.createLinearGradient(0, 0, 0, WALL_H + 16); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = g; c.fillRect(0, 0, 32, WALL_H + 16);
          c.restore();
        });
        t.left = face(true); t.right = face(false);
      }
      this.tex[theme.id] = t; return t;
    }
    // coordinates ----------------------------------------------------------
    toScreen(x, y) { return { x: (x - y) * (TW / 2) + this.cam.x, y: (x + y) * (TH / 2) + this.cam.y }; }
    toTile(sx, sy) { const ax = (sx - this.cam.x) / (TW / 2), ay = (sy - this.cam.y) / (TH / 2); return { x: Math.round((ax + ay) / 2), y: Math.round((ay - ax) / 2) }; }

    render(game, dt, ui) {
      const c = this.ctx, R = this.R, L = game.level, h = game.hero;
      this.time += dt;
      c.setTransform(R, 0, 0, R, 0, 0); c.imageSmoothingEnabled = true;
      c.fillStyle = '#000'; c.fillRect(0, 0, VIEW_W, VIEW_H);
      c.save(); c.beginPath(); c.rect(0, 0, VIEW_W, VIEW_H); c.clip();
      this.cam.x = VIEW_W / 2 - (h.x - h.y) * (TW / 2); this.cam.y = VIEW_H / 2 + 20 - (h.x + h.y) * (TH / 2);
      const theme = L.theme, tex = this.themeTex(theme);
      const ctr = { x: Math.round(h.x), y: Math.round(h.y) }, RAD = 16;
      const x0 = Math.max(0, ctr.x - RAD), x1 = Math.min(L.w - 1, ctr.x + RAD), y0 = Math.max(0, ctr.y - RAD), y1 = Math.min(L.h - 1, ctr.y + RAD);
      const vis = (x, y) => L.visible[y * L.w + x];
      const on = (s, pad = 90) => s.x > -pad && s.x < VIEW_W + pad && s.y > -40 && s.y < VIEW_H + 160;
      const drawables = [];
      // ---- floor pass
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!vis(x, y)) continue;
        const t = L.get(x, y), s = this.toScreen(x, y); if (!on(s)) continue;
        if (t === T.ROCK) continue;
        if (t === T.WALL || t === T.HOUSE || t === T.TREE || t === T.DOOR) {
          if (t === T.TREE) this.floorTile(c, tex, T.GRASS, x, y, s);
          drawables.push({ k: x + y, kind: 'tile', t, x, y, s }); continue;
        }
        this.floorTile(c, tex, t, x, y, s);
        if (t === T.UP || t === T.DOWN || t === T.DOOR_OPEN) drawables.push({ k: x + y - 0.4, kind: 'tile', t, x, y, s });
      }
      // corpses & blood on the floor
      for (const cp of L.corpses) { if (!vis(cp.x, cp.y)) continue; const s = this.toScreen(cp.x, cp.y); if (on(s)) this.drawCorpse(c, cp, s); }
      // items
      for (const f of L.items) { if (!vis(f.x, f.y)) continue; drawables.push({ k: f.x + f.y - 0.3, kind: 'item', f, s: this.toScreen(f.x, f.y) }); }
      for (const o of L.objects) { if (!vis(o.x, o.y)) continue; drawables.push({ k: o.x + o.y + (o.solid ? 0.05 : -0.35), kind: 'obj', o, s: this.toScreen(o.x, o.y) }); }
      for (const m of L.monsters) { if (!vis(m.tx, m.ty) && !vis(Math.round(m.x), Math.round(m.y))) continue; drawables.push({ k: m.x + m.y + 0.1, kind: 'mon', m, s: this.toScreen(m.x, m.y) }); }
      for (const n of L.npcs) { if (!vis(n.tx, n.ty)) continue; drawables.push({ k: n.x + n.y + 0.1, kind: 'npc', n, s: this.toScreen(n.x, n.y) }); }
      drawables.push({ k: h.x + h.y + 0.1, kind: 'hero', s: this.toScreen(h.x, h.y) });
      for (const p of L.projectiles) drawables.push({ k: p.x + p.y + 0.2, kind: 'proj', p, s: this.toScreen(p.x, p.y) });
      for (const e of L.effects) drawables.push({ k: e.x + e.y + 0.3, kind: 'fx', e, s: this.toScreen(e.x, e.y) });
      drawables.sort((a, b) => a.k - b.k);
      const hover = this.hover;
      this.pickables = [];
      for (const d of drawables) {
        switch (d.kind) {
          case 'tile': this.drawTileBlock(c, L, tex, d, h); break;
          case 'item': this.drawFloorItem(c, d.f, d.s, hover && hover.f === d.f); break;
          case 'obj': this.drawObject(c, d.o, d.s, hover && hover.o === d.o, game); break;
          case 'mon': this.drawMonster(c, d.m, d.s, hover && hover.m === d.m); this.pickables.push({ m: d.m, x: d.s.x, y: d.s.y, r: this.monsterSize(d.m) }); break;
          case 'npc': this.drawNPC(c, d.n, d.s, hover && hover.n === d.n); this.pickables.push({ n: d.n, x: d.s.x, y: d.s.y, r: 1 }); break;
          case 'hero': this.drawHero(c, h, d.s, game); break;
          case 'proj': this.drawProjectile(c, d.p, d.s); break;
          case 'fx': this.drawEffect(c, d.e, d.s); break;
        }
      }
      // ---- lighting
      const hs = this.toScreen(h.x, h.y);
      if (!L.lit) {
        const rad = h.stats.light * 46;
        c.save(); c.translate(hs.x, hs.y - 16); c.scale(1, 0.55);
        const g = c.createRadialGradient(0, 0, rad * 0.15, 0, 0, rad);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,.18)'); g.addColorStop(0.8, 'rgba(0,0,0,.62)'); g.addColorStop(1, 'rgba(0,0,0,.94)');
        c.fillStyle = g; c.fillRect(-VIEW_W * 2, -VIEW_H * 4, VIEW_W * 4, VIEW_H * 8); c.restore();
        // light sources
        c.save(); c.globalCompositeOperation = 'lighter';
        for (const p of L.projectiles) if (p.kind !== 'arrow') { const s = this.toScreen(p.x, p.y); this.glow(c, s.x, s.y - 12, 60, p.kind === 'lightning' || p.kind === 'bolt' || p.kind === 'nova' ? 'rgba(90,120,255,.22)' : p.kind === 'acid' ? 'rgba(80,200,40,.2)' : 'rgba(255,110,20,.25)'); }
        for (const e of L.effects) if (e.kind === 'explosion' || e.kind === 'flash' || e.kind === 'nova') { const s = this.toScreen(e.x, e.y); this.glow(c, s.x, s.y - 10, 120 * (1 - e.t / e.dur), e.kind === 'explosion' ? 'rgba(255,120,30,.35)' : 'rgba(140,170,255,.35)'); }
        if (theme.lava) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (L.get(x, y) === T.LAVA && vis(x, y) && (x + y) % 2 === 0) { const s = this.toScreen(x, y); this.glow(c, s.x, s.y, 50, 'rgba(255,80,10,.10)'); }
        c.restore();
      } else {
        c.fillStyle = 'rgba(30,20,50,.12)'; c.fillRect(0, 0, VIEW_W, VIEW_H);
      }
      // ---- labels
      this.labelBoxes = [];
      if (this.showLabels) this.drawLabels(c, game);
      c.restore();
      if (ui && ui.automap) this.drawAutomap(c, game);
    }
    glow(c, x, y, r, col) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    floorTile(c, tex, t, x, y, s) {
      const R = this.R, img = t === T.DIRT || t === T.DOWN && !tex.left ? (tex.dirt ? tex.dirt[hash(x, y) % 2] : tex.floors[0]) : t === T.BRIDGE ? tex.bridge : tex.floors[hash(x, y) % tex.floors.length];
      if (t === T.WATER) {
        diamond(c, s.x, s.y); const w = 0.5 + 0.5 * Math.sin(this.time * 2 + x * 0.7 + y * 0.3);
        c.fillStyle = `rgb(${24 + w * 10 | 0},${48 + w * 14 | 0},${70 + w * 20 | 0})`; c.fill();
        c.strokeStyle = 'rgba(160,200,255,.15)'; c.beginPath(); c.moveTo(s.x - 12 + w * 8, s.y - 2); c.lineTo(s.x + 4 + w * 8, s.y + 2); c.stroke(); return;
      }
      if (t === T.LAVA) {
        diamond(c, s.x, s.y); const w = 0.5 + 0.5 * Math.sin(this.time * 1.5 + x * 1.3 + y * 0.9);
        c.fillStyle = `rgb(${190 + w * 60 | 0},${60 + w * 60 | 0},10)`; c.fill();
        c.fillStyle = 'rgba(255,230,120,.5)'; c.beginPath(); c.ellipse(s.x + Math.sin(x + this.time) * 8, s.y, 6, 2, 0, 0, 7); c.fill(); return;
      }
      c.drawImage(img, s.x - TW / 2, s.y - TH / 2, TW, TH);
      if (!img) void R;
    }
    drawTileBlock(c, L, tex, d, h) {
      const { t, x, y, s } = d;
      const near = x >= h.tx && y >= h.ty && (x - h.tx) + (y - h.ty) <= 3 && (x - h.tx) + (y - h.ty) >= 1;
      if (t === T.UP || t === T.DOWN) return this.drawStairs(c, L, t, x, y, s);
      if (t === T.DOOR_OPEN) return this.drawDoor(c, L, x, y, s, true, near);
      if (t === T.DOOR) return this.drawDoor(c, L, x, y, s, false, near);
      if (t === T.TREE) return this.drawTree(c, x, y, s, near);
      c.save(); if (near) c.globalAlpha = 0.32;
      if (t === T.HOUSE) this.drawHouseBlock(c, L, x, y, s);
      else {
        const pillar = L.get(x - 1, y) !== T.WALL && L.get(x + 1, y) !== T.WALL && L.get(x, y - 1) !== T.WALL && L.get(x, y + 1) !== T.WALL && L.walkable(x - 1, y) && L.walkable(x, y - 1);
        const top = s.y - WALL_H;
        const leftOpen = L.get(x, y + 1) !== T.WALL, rightOpen = L.get(x + 1, y) !== T.WALL;
        if (pillar) { this.drawPillar(c, L.theme, s); c.restore(); return; }
        if (leftOpen) c.drawImage(tex.left, s.x - 32, top, 32, WALL_H + 16);
        if (rightOpen) c.drawImage(tex.right, s.x, top, 32, WALL_H + 16);
        diamond(c, s.x, top); c.fillStyle = L.theme.wallTop; c.fill();
        c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1; c.stroke();
        if (L.theme.id === 'hell' && hash(x, y, 9) % 11 === 0) { c.fillStyle = 'rgba(255,90,20,.6)'; c.fillRect(s.x - 18, top + 30, 2, 18); }
        if ((L.theme.id === 'cathedral' || L.theme.id === 'catacombs') && hash(x, y, 4) % 17 === 0 && leftOpen && L.walkable(x, y + 1)) this.drawTorch(c, s.x - 16, top + 36);
      }
      c.restore();
    }
    drawTorch(c, x, y) {
      c.fillStyle = '#3a2a1a'; c.fillRect(x - 1, y, 3, 8);
      const f = Math.sin(this.time * 12 + x) * 1.5;
      c.fillStyle = '#ff9020'; c.beginPath(); c.ellipse(x + 0.5, y - 3 + f * 0.3, 3, 5 + f, 0, 0, 7); c.fill();
      c.fillStyle = '#ffe080'; c.beginPath(); c.ellipse(x + 0.5, y - 2, 1.5, 2.5, 0, 0, 7); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter'; this.glow(c, x, y, 40, 'rgba(255,140,40,.18)'); c.restore();
    }
    drawPillar(c, theme, s) {
      const H = WALL_H + 6, w = 14;
      c.fillStyle = shade(theme.wall, -0.35); c.fillRect(s.x - w, s.y - H, w, H); c.fillStyle = shade(theme.wall, -0.1); c.fillRect(s.x, s.y - H, w, H);
      c.fillStyle = theme.wallTop; c.beginPath(); c.ellipse(s.x, s.y - H, w + 3, 6, 0, 0, 7); c.fill();
      c.fillStyle = shade(theme.wall, -0.2); c.beginPath(); c.ellipse(s.x, s.y, w + 2, 6, 0, 0, Math.PI); c.fill();
    }
    drawHouseBlock(c, L, x, y, s) {
      const H = L.heights ? L.heights[y * L.w + x] : 50, b = L.buildings.find(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
      const roof = b ? b.roof : '#6a3a28', wall = b && b.kind === 'cathedral' ? '#7a7468' : '#8a7458', wallH = b && b.kind === 'cathedral' ? 70 : 42;
      const top = s.y - H;
      const leftOpen = L.get(x, y + 1) !== T.HOUSE, rightOpen = L.get(x + 1, y) !== T.HOUSE;
      const face = (left) => {
        c.beginPath();
        if (left) { c.moveTo(s.x - 32, top); c.lineTo(s.x, top + 16); c.lineTo(s.x, s.y + 16); c.lineTo(s.x - 32, s.y); }
        else { c.moveTo(s.x, top + 16); c.lineTo(s.x + 32, top); c.lineTo(s.x + 32, s.y); c.lineTo(s.x, s.y + 16); }
        c.closePath();
        c.fillStyle = shade(wall, left ? -0.35 : -0.1); c.fill();
        // roof band above wall height
        if (H > wallH) {
          c.save(); c.clip(); c.fillStyle = shade(roof, left ? -0.3 : -0.05);
          c.fillRect(s.x - 32, top - 20, 64, (H - wallH) + 20 + (left ? 0 : 0));
          c.restore();
        }
        c.strokeStyle = 'rgba(40,25,10,.6)'; c.lineWidth = 1;
        if (b && b.kind !== 'cathedral') { const sl = left ? 0.5 : -0.5; for (let i = 8; i < 32; i += 10) { c.beginPath(); c.moveTo(s.x + (left ? -32 + i : i), top + (H - wallH) + (left ? i * sl : 16 + i * sl)); c.lineTo(s.x + (left ? -32 + i : i), s.y + (left ? i * 0.5 : 16 - i * 0.5)); c.stroke(); } }
        else if (b) { for (let yy = top + (H - wallH) + 12; yy < s.y; yy += 12) { c.beginPath(); c.moveTo(s.x + (left ? -32 : 0), yy + (left ? 0 : 16)); c.lineTo(s.x + (left ? 0 : 32), yy + (left ? 16 : 0)); c.stroke(); } }
      };
      if (leftOpen) face(true); if (rightOpen) face(false);
      if (b && leftOpen && hash(x, y, 2) % 3 === 0 && b.kind !== 'cathedral') { c.fillStyle = hash(x, y) % 2 ? '#e0b050' : '#302018'; c.fillRect(s.x - 20, s.y - 26, 8, 10); }
      if (b && b.kind === 'cathedral' && leftOpen && (x + y) % 2 === 0) { c.fillStyle = '#304060'; c.beginPath(); c.moveTo(s.x - 20, s.y - 20); c.lineTo(s.x - 20, s.y - 40); c.arc(s.x - 16, s.y - 38, 4, Math.PI, 0); c.lineTo(s.x - 12, s.y - 16); c.fill(); }
      diamond(c, s.x, top); c.fillStyle = shade(roof, 0.05 - (H % 7) * 0.01); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.stroke();
      if (b && b.kind === 'cathedral' && x === b.x + 4 && y === b.y + 2) { c.fillStyle = '#4a4a56'; c.fillRect(s.x - 6, top - 60, 12, 60); c.beginPath(); c.moveTo(s.x - 9, top - 60); c.lineTo(s.x, top - 90); c.lineTo(s.x + 9, top - 60); c.fill(); c.fillStyle = '#c0a060'; c.fillRect(s.x - 1, top - 104, 2, 16); c.fillRect(s.x - 5, top - 100, 10, 2); }
      if (b && b.kind === 'smithy' && x === b.x + b.w - 1 && y === b.y + 1) { c.fillStyle = '#3a3030'; c.fillRect(s.x - 5, top - 26, 10, 26); c.fillStyle = 'rgba(120,120,120,.4)'; for (let i = 0; i < 3; i++) { const k = (this.time * 0.6 + i / 3) % 1; c.beginPath(); c.arc(s.x + k * 10, top - 30 - k * 30, 4 + k * 6, 0, 7); c.fill(); } }
    }
    drawTree(c, x, y, s, near) {
      const hsh = hash(x, y, 5), sc = 0.8 + (hsh % 5) * 0.08;
      c.save(); if (near) c.globalAlpha = 0.35;
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(s.x, s.y, 22 * sc, 9 * sc, 0, 0, 7); c.fill();
      c.fillStyle = '#3a2a18'; c.fillRect(s.x - 3, s.y - 30 * sc, 6, 30 * sc);
      const cols = hsh % 3 === 0 ? ['#1e3a18', '#2a4a20', '#36582a'] : ['#243a1a', '#2e4a22', '#3a5a2c'];
      for (let i = 0; i < 3; i++) { c.fillStyle = cols[i]; c.beginPath(); c.arc(s.x + ((hsh >> i) % 9 - 4), s.y - 44 * sc - i * 10 * sc, (22 - i * 4) * sc, 0, 7); c.fill(); }
      c.restore();
    }
    drawStairs(c, L, t, x, y, s) {
      if (L.index === 0) { // cathedral entrance
        c.fillStyle = '#16100c'; c.beginPath(); c.moveTo(s.x - 24, s.y + 4); c.lineTo(s.x - 24, s.y - 34); c.quadraticCurveTo(s.x - 8, s.y - 58, s.x + 8, s.y - 30); c.lineTo(s.x + 8, s.y + 12); c.closePath(); c.fill();
        c.strokeStyle = '#8a8070'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#6a3a1a'; c.fillRect(s.x - 20, s.y - 30, 3, 28);
        c.save(); c.globalCompositeOperation = 'lighter'; this.glow(c, s.x - 8, s.y - 18, 34, 'rgba(255,80,20,.12)'); c.restore(); return;
      }
      diamond(c, s.x, s.y); c.fillStyle = t === T.DOWN ? '#0c0806' : shade(L.theme.floor[0], 0.1); c.fill();
      for (let i = 0; i < 4; i++) {
        const k = i / 4, off = t === T.DOWN ? k * 10 : -k * 14;
        c.fillStyle = t === T.DOWN ? shade(L.theme.wall, -0.2 - k * 0.5) : shade(L.theme.wallTop, -k * 0.3);
        c.beginPath(); c.moveTo(s.x - 26 + k * 18, s.y - 3 + off + k * 4); c.lineTo(s.x + 6 + k * 18, s.y - 16 + off + k * 12); c.lineTo(s.x + 10 + k * 18, s.y - 13 + off + k * 12); c.lineTo(s.x - 22 + k * 18, s.y + off + k * 4); c.fill();
      }
      if (L.sealed && t === T.DOWN) { c.strokeStyle = `rgba(255,40,40,${0.5 + 0.3 * Math.sin(this.time * 4)})`; c.lineWidth = 2; diamond(c, s.x, s.y, 56, 28); c.stroke(); }
    }
    drawDoor(c, L, x, y, s, open, near) {
      const alongX = L.get(x - 1, y) === T.WALL || L.get(x + 1, y) === T.WALL;
      c.save(); if (near) c.globalAlpha = 0.4;
      const H = WALL_H - 10;
      if (open) {
        c.fillStyle = '#4a3420';
        if (alongX) { c.fillRect(s.x - 30, s.y - H - 2, 6, H); c.fillRect(s.x + 24, s.y - H - 2, 6, H); } else { c.fillRect(s.x - 30, s.y - H, 6, H); c.fillRect(s.x + 24, s.y - H, 6, H); }
        c.fillRect(s.x - 30, s.y - H - 6, 60, 6);
      } else {
        c.beginPath();
        if (alongX) { c.moveTo(s.x - 32, s.y - H); c.lineTo(s.x + 32, s.y - H + (-0)); c.lineTo(s.x + 32, s.y); c.lineTo(s.x - 32, s.y); }
        else { c.moveTo(s.x - 32, s.y - H); c.lineTo(s.x + 32, s.y - H); c.lineTo(s.x + 32, s.y); c.lineTo(s.x - 32, s.y); }
        c.closePath(); c.fillStyle = '#5a3a1e'; c.fill(); c.strokeStyle = '#2a1a0c'; c.lineWidth = 2; c.stroke();
        c.lineWidth = 1; for (let i = -24; i < 32; i += 10) { c.beginPath(); c.moveTo(s.x + i, s.y - H + 2); c.lineTo(s.x + i, s.y - 2); c.stroke(); }
        c.fillStyle = '#707070'; c.fillRect(s.x - 30, s.y - H + 12, 60, 4); c.fillRect(s.x - 30, s.y - 20, 60, 4); c.fillStyle = '#c0a040'; c.beginPath(); c.arc(s.x + 16, s.y - H / 2, 3, 0, 7); c.fill();
      }
      c.restore();
    }
    drawCorpse(c, cp, s) {
      const k = 1;
      c.fillStyle = 'rgba(90,0,0,.55)'; c.beginPath(); c.ellipse(s.x + 2, s.y + 2, 16 * (cp.big ? 1.6 : 1), 6 * (cp.big ? 1.6 : 1), 0, 0, 7); c.fill();
      c.fillStyle = shade(cp.color || '#666', -0.3); c.beginPath(); c.ellipse(s.x - 2, s.y - 2, 12 * k * (cp.big ? 1.5 : 1), 4 * (cp.big ? 1.5 : 1), 0.3, 0, 7); c.fill();
      c.fillStyle = shade(cp.color || '#666', -0.1); c.beginPath(); c.arc(s.x - 12 * (cp.big ? 1.5 : 1), s.y - 4, 4, 0, 7); c.fill();
    }
    drawFloorItem(c, f, s, hl) {
      const img = itemIcon(f.item), b = D.baseOf(f.item);
      const k = f.item.base === 'gold' ? 0.7 : Math.min(0.75, 30 / (Math.max(b.w, b.h) * 28));
      const bounce = f.t < 1 ? -Math.sin(f.t * Math.PI) * 20 : 0;
      const w = b.w * 28 * k, hh = b.h * 28 * k;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(s.x, s.y + 2, w * 0.5, 4, 0, 0, 7); c.fill();
      c.save(); c.translate(s.x, s.y - hh / 2 + bounce); if (f.item.base !== 'gold' && f.item.base !== 'potion' && b.cls !== 'potion') c.rotate(0.9);
      if (hl) { c.shadowColor = '#fff'; c.shadowBlur = 8; }
      c.drawImage(img, -w / 2, -hh / 2, w, hh); c.restore();
    }
    drawObject(c, o, s, hl, game) {
      c.save(); if (hl) { c.shadowColor = '#ffffff'; c.shadowBlur = 10; }
      const t = this.time;
      switch (o.type) {
        case 'barrel':
          if (o.used) { c.fillStyle = '#4a3018'; for (let i = 0; i < 5; i++) { const h = hash(o.x, o.y, i); c.fillRect(s.x - 14 + h % 26, s.y - 4 + (h >> 5) % 8, 7, 3); } break; }
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(s.x, s.y, 14, 6, 0, 0, 7); c.fill();
          c.fillStyle = o.explosive ? '#6a2a18' : '#6a4424'; c.fillRect(s.x - 11, s.y - 30, 22, 30); c.beginPath(); c.ellipse(s.x, s.y, 11, 4, 0, 0, Math.PI); c.fill();
          c.fillStyle = shade(o.explosive ? '#6a2a18' : '#6a4424', 0.2); c.beginPath(); c.ellipse(s.x, s.y - 30, 11, 4, 0, 0, 7); c.fill();
          c.strokeStyle = '#2a2a2a'; c.lineWidth = 2; for (const yy of [-24, -8]) { c.beginPath(); c.ellipse(s.x, s.y + yy, 11.5, 4, 0, 0, Math.PI); c.stroke(); }
          if (o.explosive) { c.fillStyle = '#ffcc00'; c.font = 'bold 9px serif'; c.textAlign = 'center'; c.fillText('!', s.x, s.y - 12); }
          break;
        case 'chest': case 'bigchest': {
          const big = o.type === 'bigchest', w = big ? 17 : 13;
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(s.x, s.y, w + 4, 7, 0, 0, 7); c.fill();
          c.fillStyle = big ? '#5a3a1a' : '#6a4a22'; c.fillRect(s.x - w, s.y - 16, w * 2, 16);
          c.fillStyle = big ? '#a08030' : '#606060'; c.fillRect(s.x - w, s.y - 12, w * 2, 2); c.fillRect(s.x - 2, s.y - 12, 4, 6);
          if (o.used) { c.fillStyle = '#2a1a0a'; c.fillRect(s.x - w, s.y - 30, w * 2, 12); c.fillStyle = '#100a04'; c.fillRect(s.x - w + 2, s.y - 18, w * 2 - 4, 4); }
          else { c.fillStyle = shade(big ? '#5a3a1a' : '#6a4a22', 0.15); c.beginPath(); c.moveTo(s.x - w, s.y - 16); c.quadraticCurveTo(s.x, s.y - 28, s.x + w, s.y - 16); c.fill(); }
          if (o.trap && game.hero.cls === 'rogue' && !o.used) { c.strokeStyle = `rgba(255,60,60,${0.5 + 0.4 * Math.sin(t * 5)})`; c.lineWidth = 1.5; c.strokeRect(s.x - w - 2, s.y - 22, w * 2 + 4, 24); }
          break;
        }
        case 'sarcophagus':
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(s.x, s.y, 30, 10, 0, 0, 7); c.fill();
          c.fillStyle = '#6a6660'; c.beginPath(); c.moveTo(s.x - 28, s.y - 4); c.lineTo(s.x + 4, s.y + 10); c.lineTo(s.x + 28, s.y - 2); c.lineTo(s.x - 4, s.y - 16); c.closePath(); c.fill();
          c.fillStyle = '#4a4640'; c.fillRect(s.x - 28, s.y - 4, 32, 6);
          c.fillStyle = o.used ? '#2a2620' : '#8a867e'; c.beginPath(); c.moveTo(s.x - 28 + (o.used ? 10 : 0), s.y - 14); c.lineTo(s.x + 4 + (o.used ? 10 : 0), s.y); c.lineTo(s.x + 28 + (o.used ? 10 : 0), s.y - 12); c.lineTo(s.x - 4 + (o.used ? 10 : 0), s.y - 26); c.closePath(); c.fill();
          if (!o.used) { c.strokeStyle = '#5a564e'; c.beginPath(); c.moveTo(s.x - 4, s.y - 20); c.lineTo(s.x + 4, s.y - 8); c.moveTo(s.x - 6, s.y - 13); c.lineTo(s.x + 6, s.y - 15); c.stroke(); }
          break;
        case 'shrine': {
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(s.x, s.y, 18, 7, 0, 0, 7); c.fill();
          c.fillStyle = '#5a5650'; c.fillRect(s.x - 12, s.y - 10, 24, 10); c.fillStyle = '#7a766e'; c.fillRect(s.x - 8, s.y - 36, 16, 26); c.fillStyle = '#8a867e'; c.fillRect(s.x - 14, s.y - 40, 28, 5);
          const g = o.used ? '#303030' : `hsl(${(t * 60) % 360},80%,60%)`;
          c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y - 47, 6, 0, 7); c.fill();
          if (!o.used) { c.save(); c.globalCompositeOperation = 'lighter'; this.glow(c, s.x, s.y - 47, 26, 'rgba(160,160,255,.3)'); c.restore(); }
          break;
        }
        case 'rack':
          c.fillStyle = '#4a3018'; c.fillRect(s.x - 18, s.y - 36, 4, 36); c.fillRect(s.x + 14, s.y - 36, 4, 36); c.fillRect(s.x - 18, s.y - 36, 36, 4); c.fillRect(s.x - 18, s.y - 14, 36, 3);
          if (!o.used) { c.strokeStyle = '#b0b4bc'; c.lineWidth = 3; for (const dx of [-8, 0, 8]) { c.beginPath(); c.moveTo(s.x + dx, s.y - 34); c.lineTo(s.x + dx, s.y - 4); c.stroke(); } }
          break;
        case 'bookcase':
          c.fillStyle = '#3a2412'; c.fillRect(s.x - 18, s.y - 48, 36, 48);
          for (let r = 0; r < 3; r++) { c.fillStyle = '#1a0e06'; c.fillRect(s.x - 15, s.y - 45 + r * 15, 30, 12); if (!o.used || r) for (let i = 0; i < 7; i++) { c.fillStyle = ['#7a2020', '#204a7a', '#2a5a2a', '#7a6a2a'][(i + r) % 4]; c.fillRect(s.x - 14 + i * 4, s.y - 44 + r * 15 + (i % 3), 3, 11 - (i % 3)); } }
          break;
        case 'fountain_blood': case 'fountain_mana': {
          const col = o.type === 'fountain_blood' ? '#a01010' : '#1030a0';
          c.fillStyle = '#5a5650'; c.beginPath(); c.ellipse(s.x, s.y - 6, 24, 11, 0, 0, 7); c.fill(); c.fillRect(s.x - 24, s.y - 6, 48, 8);
          c.fillStyle = col; c.beginPath(); c.ellipse(s.x, s.y - 8, 19, 8, 0, 0, 7); c.fill();
          c.fillStyle = shade(col, 0.4); c.beginPath(); c.ellipse(s.x + Math.sin(t * 3) * 4, s.y - 9, 6, 2, 0, 0, 7); c.fill();
          c.fillStyle = '#6a665e'; c.fillRect(s.x - 3, s.y - 30, 6, 22);
          break;
        }
        case 'pedestal':
          c.fillStyle = '#5a5650'; c.fillRect(s.x - 9, s.y - 34, 18, 34); c.fillStyle = '#7a766e'; c.fillRect(s.x - 12, s.y - 38, 24, 5);
          if (!o.used) { const img = itemIcon({ base: o.quest, quality: 'normal' }); c.drawImage(img, s.x - 12, s.y - 64, 24, 24); c.save(); c.globalCompositeOperation = 'lighter'; this.glow(c, s.x, s.y - 52, 30, 'rgba(120,255,255,.25)'); c.restore(); }
          break;
        case 'corpse':
          c.fillStyle = 'rgba(110,0,0,.7)'; c.beginPath(); c.ellipse(s.x, s.y, 18, 7, 0, 0, 7); c.fill();
          c.fillStyle = '#8a6a5a'; c.beginPath(); c.ellipse(s.x - 2, s.y - 3, 12, 4, 0.4, 0, 7); c.fill(); c.fillStyle = '#6a2a20'; c.fillRect(s.x - 3, s.y - 30, 2, 26);
          break;
        case 'well':
          c.fillStyle = '#6a665e'; c.beginPath(); c.ellipse(s.x, s.y - 8, 20, 10, 0, 0, 7); c.fill(); c.fillRect(s.x - 20, s.y - 8, 40, 10); c.fillStyle = '#101820'; c.beginPath(); c.ellipse(s.x, s.y - 10, 14, 6, 0, 0, 7); c.fill();
          c.fillStyle = '#4a3018'; c.fillRect(s.x - 18, s.y - 50, 3, 42); c.fillRect(s.x + 15, s.y - 50, 3, 42); c.fillStyle = '#6a3a22'; c.beginPath(); c.moveTo(s.x - 24, s.y - 46); c.lineTo(s.x, s.y - 64); c.lineTo(s.x + 24, s.y - 46); c.fill();
          break;
        case 'portal': {
          c.save(); c.translate(s.x, s.y - 34);
          for (let i = 0; i < 5; i++) { c.strokeStyle = `rgba(${80 + i * 30},${120 + i * 25},255,${0.8 - i * 0.12})`; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 14 - i * 2, 32 - i * 5, Math.sin(t * 2 + i) * 0.1, t * 3 + i, t * 3 + i + 4.5); c.stroke(); }
          c.fillStyle = 'rgba(100,150,255,.35)'; c.beginPath(); c.ellipse(0, 0, 13, 31, 0, 0, 7); c.fill();
          c.globalCompositeOperation = 'lighter'; this.glow(c, 0, 0, 50, 'rgba(60,100,255,.25)'); c.restore();
          break;
        }
      }
      c.restore();
    }
    monsterSize(m) { return m.boss === 'diablo' ? 1.9 : m.boss ? 1.4 : ({ brute: 1.3, balrog: 1.6, horned: 1.2, demon: 1.25, knight: 1.1, beast: 0.95, fallen: 0.75, bat: 0.8 })[m.look] || 1; }
    // ------------------------------------------------------------------ figures
    animState(a) {
      const act = a.action;
      return {
        walk: a.moving ? a.moveT : -1,
        attack: act && act.kind === 'attack' ? act.t / act.dur : -1,
        cast: act && act.kind === 'cast' ? act.t / act.dur : -1,
        hit: act && act.kind === 'hit' ? 1 : 0,
        block: act && act.kind === 'block' ? 1 : 0
      };
    }
    facing(a) { const sx = (a.dirX - a.dirY), sy = (a.dirX + a.dirY) / 2; return { f: sx < -0.05 ? -1 : 1, back: sy < -0.2 }; }
    humanoid(c, s, o) {
      const k = o.scale || 1, f = o.facing || 1, st = o.st;
      const walkPh = st.walk >= 0 ? Math.sin((st.walk + (o.phase || 0)) * Math.PI * 2) : 0;
      const bob = st.walk >= 0 ? Math.abs(walkPh) * 2 : Math.sin(this.time * 2 + (o.phase || 0) * 7) * 0.6;
      c.save(); c.translate(s.x, s.y); c.scale(k * f, k);
      if (o.alpha != null) c.globalAlpha = o.alpha;
      if (st.hit) c.translate(-3, 0);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, 0, 13, 5, 0, 0, 7); c.fill();
      const lean = (o.hunch || 0) + (st.hit ? -0.15 : 0) + (st.attack >= 0 ? Math.sin(st.attack * Math.PI) * 0.12 : 0);
      // legs
      c.fillStyle = o.legs || '#3a2a1a';
      c.save(); c.translate(-3, -18); c.rotate(walkPh * 0.5); c.fillRect(-3, 0, 5, 18); c.restore();
      c.save(); c.translate(3, -18); c.rotate(-walkPh * 0.5); c.fillRect(-2, 0, 5, 18); c.restore();
      c.translate(0, -18 - bob); c.rotate(lean);
      // cape behind
      if (o.cape) { c.fillStyle = o.cape; c.beginPath(); c.moveTo(-8, -26); c.lineTo(8, -26); c.lineTo(11 - walkPh * 2, 6); c.lineTo(-12 - walkPh * 2, 6); c.closePath(); c.fill(); }
      // back arm (shield side)
      const armSwing = st.walk >= 0 ? walkPh * 0.6 : 0;
      c.strokeStyle = o.arms || o.body; c.lineWidth = 5; c.lineCap = 'round';
      c.save(); c.translate(-7, -24); c.rotate(-armSwing + (st.cast >= 0 ? -2.2 * Math.sin(Math.min(1, st.cast * 1.6) * Math.PI / 2) : 0) + (st.block ? -1.2 : 0));
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 16); c.stroke();
      if (o.shield) { c.fillStyle = o.shieldColor || '#6a5a40'; c.beginPath(); c.ellipse(-2, 12, 7, 10, 0, 0, 7); c.fill(); c.strokeStyle = '#999'; c.lineWidth = 1.5; c.stroke(); }
      c.restore();
      // torso
      c.fillStyle = o.body; c.beginPath(); c.moveTo(-9, -28); c.lineTo(9, -28); c.lineTo(8 + (o.robe ? 4 : 0), o.robe ? 16 : 2); c.lineTo(-8 - (o.robe ? 4 : 0), o.robe ? 16 : 2); c.closePath(); c.fill();
      if (o.belt) { c.fillStyle = o.belt; c.fillRect(-8, -6, 16, 3); }
      if (o.chest) o.chest(c);
      // head
      c.fillStyle = o.skin || '#d0a080'; c.beginPath(); c.arc(1, -34, 6, 0, 7); c.fill();
      if (o.head) o.head(c, o.back);
      else if (!o.back) { c.fillStyle = '#000'; c.fillRect(3, -36, 2, 2); }
      // front arm + weapon
      let armA = armSwing * -1;
      if (st.attack >= 0) { const a = st.attack; armA = a < 0.55 ? -2.4 * (a / 0.55) : -2.4 + 3.6 * ((a - 0.55) / 0.45); }
      if (st.cast >= 0) armA = -2.0 * Math.sin(Math.min(1, st.cast * 1.6) * Math.PI / 2);
      if (o.weapon === 'bow' && st.attack >= 0) armA = -1.4;
      c.save(); c.translate(7, -24); c.rotate(armA);
      c.strokeStyle = o.arms || o.body; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 16); c.stroke();
      c.translate(0, 16); this.weapon(c, o.weapon, o.weaponColor, st);
      c.restore();
      c.restore();
    }
    weapon(c, w, col, st) {
      if (!w) return;
      c.lineCap = 'round';
      switch (w) {
        case 'sword': c.fillStyle = '#6a5030'; c.fillRect(-1.5, -2, 3, 6); c.fillStyle = '#8a7040'; c.fillRect(-5, 3, 10, 2); c.fillStyle = col || '#c8ccd4'; c.beginPath(); c.moveTo(-2, 5); c.lineTo(2, 5); c.lineTo(1, 30); c.lineTo(0, 33); c.lineTo(-1, 30); c.closePath(); c.fill(); break;
        case 'axe': c.strokeStyle = '#6a4424'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -4); c.lineTo(0, 28); c.stroke(); c.fillStyle = col || '#b8bcc4'; c.beginPath(); c.moveTo(1, 18); c.quadraticCurveTo(14, 16, 13, 30); c.quadraticCurveTo(7, 26, 1, 27); c.fill(); break;
        case 'cleaver': c.strokeStyle = '#4a2a14'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -4); c.lineTo(0, 12); c.stroke(); c.fillStyle = '#9a9a9a'; c.fillRect(-2, 10, 16, 22); c.fillStyle = '#801010'; c.fillRect(8, 20, 6, 10); break;
        case 'mace': c.strokeStyle = '#6a4424'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -3); c.lineTo(0, 22); c.stroke(); c.fillStyle = col || '#8a8e96'; c.beginPath(); c.arc(0, 26, 6, 0, 7); c.fill(); break;
        case 'club': c.strokeStyle = '#5a3a1e'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, -3); c.lineTo(2, 24); c.stroke(); break;
        case 'spear': c.strokeStyle = '#6a4424'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, -14); c.lineTo(0, 26); c.stroke(); c.fillStyle = '#c0c0c0'; c.beginPath(); c.moveTo(-3, 26); c.lineTo(3, 26); c.lineTo(0, 36); c.fill(); break;
        case 'staff': c.strokeStyle = '#6a4424'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -26); c.lineTo(0, 16); c.stroke(); c.fillStyle = col || '#80a0ff'; c.beginPath(); c.arc(0, -28, 4, 0, 7); c.fill(); if (st.cast >= 0) { c.save(); c.globalCompositeOperation = 'lighter'; this.glow(c, 0, -28, 18, 'rgba(160,180,255,.6)'); c.restore(); } break;
        case 'bow': c.strokeStyle = '#7a5020'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-2, -16); c.quadraticCurveTo(14, 0, -2, 16); c.stroke(); c.strokeStyle = '#ddd'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-2, -16); c.lineTo(st.attack >= 0 && st.attack < 0.55 ? -10 : -2, 0); c.lineTo(-2, 16); c.stroke(); break;
        case 'claw': c.strokeStyle = '#e0d0b0'; c.lineWidth = 1.5; for (const a of [-0.4, 0, 0.4]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(a) * 8, 8); c.stroke(); } break;
        case 'greatsword': c.fillStyle = '#6a5030'; c.fillRect(-2, -4, 4, 8); c.fillStyle = '#8a7040'; c.fillRect(-7, 4, 14, 3); c.fillStyle = col || '#d0d4dc'; c.beginPath(); c.moveTo(-3, 7); c.lineTo(3, 7); c.lineTo(2, 44); c.lineTo(0, 48); c.lineTo(-2, 44); c.closePath(); c.fill(); break;
      }
    }
    heroLook(game) {
      const h = game.hero, eq = h.equip, B = it => it ? D.baseOf(it) : null;
      const w = B(eq.weapon), body = B(eq.body), helm = B(eq.head);
      const wmap = { sword: w && w.two ? 'greatsword' : 'sword', axe: 'axe', mace: w && /club/.test(w.id) ? 'club' : 'mace', bow: 'bow', staff: 'staff' };
      const heavy = body && /plate|splint|breast|scale|chain|ring/.test(body.id), medium = body && /leather|studded|quilted/.test(body.id);
      const cls = h.cls;
      let bodyCol = cls === 'warrior' ? '#7a6a50' : cls === 'rogue' ? '#3a5a3a' : '#4a3a7a';
      if (heavy) bodyCol = '#8a8e96'; else if (medium) bodyCol = cls === 'sorcerer' ? '#5a4a6a' : '#6a4a2a';
      if (body && body.id === 'robe') bodyCol = '#4a3a7a';
      return {
        body: bodyCol, legs: heavy ? '#6a6e76' : cls === 'sorcerer' ? '#2a2040' : '#3a2a1a', arms: heavy ? '#7a7e86' : bodyCol,
        cape: cls === 'rogue' ? '#1e3a22' : cls === 'sorcerer' ? '#2a1a4a' : heavy ? '#5a1a1a' : null, robe: cls === 'sorcerer',
        weapon: w ? wmap[w.cls] : null, weaponColor: eq.weapon && eq.weapon.quality !== 'normal' ? (eq.weapon.quality === 'unique' ? '#e0c060' : '#a0b0ff') : null,
        shield: !!eq.shield, shieldColor: eq.shield ? (/tower|gothic|large|kite/.test(eq.shield.base) ? '#6a6e7a' : '#7a5a30') : null, belt: '#2a1a0a',
        head: (c, back) => {
          if (helm) { c.fillStyle = helm.id === 'crown' ? '#d8b048' : helm.id === 'cap' ? '#5a3a20' : '#9a9ea6'; c.beginPath(); c.arc(1, -36, 7, Math.PI, 0); c.fill(); if (helm.id === 'fullhelm' || helm.id === 'greathelm') { c.fillRect(-6, -36, 14, 8); if (!back) { c.fillStyle = '#111'; c.fillRect(2, -34, 6, 2); } } if (helm.id === 'crown') { c.fillRect(-6, -42, 2, 5); c.fillRect(0, -44, 2, 7); c.fillRect(6, -42, 2, 5); } }
          else if (cls === 'rogue') { c.fillStyle = '#1e3a22'; c.beginPath(); c.arc(1, -35, 7.5, Math.PI * 0.9, Math.PI * 2.1); c.fill(); }
          else if (cls === 'sorcerer') { c.fillStyle = '#3a2a6a'; c.beginPath(); c.moveTo(-7, -35); c.lineTo(1, -52); c.lineTo(9, -35); c.fill(); }
          else { c.fillStyle = '#4a2a14'; c.fillRect(-5, -41, 12, 4); }
          if (!back && !(helm && (helm.id === 'fullhelm' || helm.id === 'greathelm'))) { c.fillStyle = '#000'; c.fillRect(3, -35, 2, 2); }
        }
      };
    }
    drawHero(c, h, s, game) {
      if (h.dead) { this.drawCorpse(c, { color: this.heroLook(game).body, big: false }, s); return; }
      const fc = this.facing(h), look = this.heroLook(game);
      if (h.manaShield) { c.save(); c.strokeStyle = `rgba(100,130,255,${0.4 + 0.2 * Math.sin(this.time * 5)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(s.x, s.y - 26, 20, 32, 0, 0, 7); c.stroke(); c.restore(); }
      this.humanoid(c, s, Object.assign(look, { facing: fc.f, back: fc.back, st: this.animState(h), scale: 1.05 }));
      this.heroScreen = { x: s.x, y: s.y };
    }
    drawNPC(c, n, s, hl) {
      if (n.dead) { this.drawCorpse(c, { color: '#7a5a40' }, s); return; }
      const looks = {
        smith: { body: '#5a4030', arms: '#c09070', skin: '#c09070', weapon: 'mace', head: c2 => { c2.fillStyle = '#3a2a1a'; c2.fillRect(-5, -42, 12, 4); } , chest: c2 => { c2.fillStyle = '#3a2a1a'; c2.fillRect(-7, -22, 14, 22); } },
        healer: { body: '#d0c8b0', robe: true, head: c2 => { c2.fillStyle = '#9a8a70'; c2.beginPath(); c2.arc(1, -37, 6, Math.PI, 0); c2.fill(); } },
        witch: { body: '#3a2a4a', robe: true, cape: '#2a1a3a', head: c2 => { c2.fillStyle = '#e0e0e0'; c2.beginPath(); c2.arc(1, -34, 7, Math.PI * 0.8, Math.PI * 2.2); c2.fill(); } },
        elder: { body: '#6a5a8a', robe: true, weapon: 'staff', weaponColor: '#c0a060', hunch: 0.15, head: c2 => { c2.fillStyle = '#e0e0e0'; c2.beginPath(); c2.moveTo(-3, -30); c2.lineTo(5, -30); c2.lineTo(1, -20); c2.fill(); } },
        barkeep: { body: '#6a4a2a', chest: c2 => { c2.fillStyle = '#d8d0c0'; c2.fillRect(-6, -24, 12, 26); } },
        maid: { body: '#7a3a3a', robe: true, head: c2 => { c2.fillStyle = '#8a5a2a'; c2.beginPath(); c2.arc(1, -36, 7, Math.PI, 0); c2.fill(); c2.fillRect(-6, -36, 3, 10); } },
        drunk: { body: '#5a5a3a', hunch: 0.25 },
        boy: { body: '#6a5a4a', scale: 0.8 },
        wounded: { body: '#7a5a40' }
      };
      const o = Object.assign({ skin: '#d0a080', st: { walk: -1, attack: -1, cast: -1, hit: 0 }, facing: 1, phase: (n.id.length % 5) / 5 }, looks[n.look] || {});
      if (n.look === 'wounded') { this.drawCorpse(c, { color: '#7a5a40' }, s); c.fillStyle = 'rgba(140,0,0,.6)'; c.beginPath(); c.ellipse(s.x, s.y + 2, 20, 7, 0, 0, 7); c.fill(); return; }
      if (hl) { c.save(); c.shadowColor = '#ffffff'; c.shadowBlur = 10; }
      this.humanoid(c, s, o);
      if (hl) c.restore();
    }
    drawMonster(c, m, s, hl) {
      const st = this.animState(m), fc = this.facing(m), k = this.monsterSize(m);
      const stone = m.stoneT > 0;
      c.save();
      if (hl) { c.shadowColor = '#ff3030'; c.shadowBlur = 10; }
      if (stone) c.filter = 'grayscale(1) brightness(.8)';
      const col = stone ? '#8a8a8a' : m.color;
      const base = { facing: fc.f, back: fc.back, st, scale: k, phase: (m.uidm % 7) / 7, body: col, arms: col, legs: shade(col, -0.35), skin: col };
      let alpha = null;
      if (m.ai === 'hidden') alpha = m.invisible ? 0.12 + 0.08 * Math.sin(this.time * 6) : 0.85;
      if (m.elite && !stone) { c.save(); c.fillStyle = 'rgba(255,200,40,.15)'; c.beginPath(); c.ellipse(s.x, s.y, 18 * k, 7 * k, 0, 0, 7); c.fill(); c.restore(); }
      switch (m.look) {
        case 'zombie': this.humanoid(c, s, Object.assign(base, { hunch: 0.3, weapon: 'claw', body: shade(col, -0.2), head: c2 => { c2.fillStyle = shade(col, 0.2); c2.fillRect(-3, -40, 8, 3); } })); break;
        case 'fallen': this.humanoid(c, s, Object.assign(base, { weapon: m.id === 'carver' ? 'sword' : 'spear', head: c2 => { c2.fillStyle = shade(col, -0.3); c2.beginPath(); c2.moveTo(-4, -38); c2.lineTo(-8, -46); c2.lineTo(-1, -40); c2.fill(); c2.beginPath(); c2.moveTo(5, -38); c2.lineTo(9, -46); c2.lineTo(3, -40); c2.fill(); c2.fillStyle = '#ff0'; c2.fillRect(3, -35, 2, 2); } })); break;
        case 'skeleton': this.humanoid(c, s, Object.assign(base, { body: col, legs: col, arms: col, weapon: m.def.tags.includes('bow') ? 'bow' : m.def.tags.includes('axe') ? 'axe' : 'sword', shield: m.id === 'skeleton' || m.id === 'horror',
          chest: c2 => { c2.strokeStyle = '#3a342a'; c2.lineWidth = 1; for (let y = -24; y < -6; y += 4) { c2.beginPath(); c2.moveTo(-7, y); c2.lineTo(7, y); c2.stroke(); } },
          head: (c2, back) => { c2.fillStyle = col; c2.beginPath(); c2.arc(1, -34, 6.5, 0, 7); c2.fill(); if (!back) { c2.fillStyle = '#000'; c2.fillRect(-1, -36, 3, 3); c2.fillRect(4, -36, 3, 3); } if (m.id === 'burningdead') { c2.save(); c2.globalCompositeOperation = 'lighter'; this.glow(c2, 1, -40, 14, 'rgba(255,120,20,.6)'); c2.restore(); } } })); break;
        case 'king': this.humanoid(c, s, Object.assign(base, { body: '#5a1a1a', legs: '#d8d0b8', arms: '#d8d0b8', cape: '#6a1010', weapon: 'greatsword', skin: '#e8e0c0', head: (c2, back) => { c2.fillStyle = '#e8e0c0'; c2.beginPath(); c2.arc(1, -34, 7, 0, 7); c2.fill(); if (!back) { c2.fillStyle = '#300'; c2.fillRect(-1, -36, 3, 3); c2.fillRect(4, -36, 3, 3); } c2.fillStyle = '#d8b048'; c2.fillRect(-6, -44, 14, 4); c2.fillRect(-6, -48, 2, 4); c2.fillRect(0, -50, 2, 6); c2.fillRect(6, -48, 2, 4); } })); break;
        case 'butcher': this.humanoid(c, s, Object.assign(base, { body: '#c09080', arms: '#c09080', legs: '#5a3a2a', weapon: 'cleaver', skin: '#b08070', chest: c2 => { c2.fillStyle = '#e0d8c8'; c2.fillRect(-8, -22, 16, 24); c2.fillStyle = '#901010'; c2.fillRect(-6, -18, 6, 5); c2.fillRect(1, -8, 5, 7); c2.fillRect(-4, -4, 3, 4); }, head: c2 => { c2.fillStyle = '#8a1010'; c2.beginPath(); c2.arc(1, -36, 7, Math.PI, 0); c2.fill(); } })); break;
        case 'goat': this.humanoid(c, s, Object.assign(base, { weapon: m.def.tags.includes('bow') ? 'bow' : 'club', legs: shade(col, -0.45), head: (c2, back) => { c2.fillStyle = shade(col, -0.1); c2.beginPath(); c2.ellipse(3, -33, 5, 8, 0.3, 0, 7); c2.fill(); c2.strokeStyle = '#d8d0b0'; c2.lineWidth = 2.5; c2.beginPath(); c2.arc(-3, -40, 5, Math.PI * 0.2, Math.PI * 1.3); c2.stroke(); c2.beginPath(); c2.arc(6, -40, 5, Math.PI * 1.7, Math.PI * 0.8, true); c2.stroke(); if (!back) { c2.fillStyle = '#f00'; c2.fillRect(5, -35, 2, 2); } } })); break;
        case 'hidden': this.humanoid(c, s, Object.assign(base, { alpha, weapon: 'claw', robe: true, body: '#506070', head: c2 => { c2.fillStyle = '#304050'; c2.beginPath(); c2.arc(1, -35, 8, Math.PI, 0); c2.fill(); } })); break;
        case 'knight': this.humanoid(c, s, Object.assign(base, { body: col, arms: shade(col, 0.15), legs: shade(col, 0.1), weapon: 'greatsword', weaponColor: '#8a90a0', shield: true, shieldColor: '#2a2a34', cape: '#401010', head: (c2, back) => { c2.fillStyle = shade(col, 0.2); c2.beginPath(); c2.arc(1, -36, 7.5, 0, 7); c2.fill(); c2.fillRect(-6, -36, 15, 8); if (!back) { c2.fillStyle = '#f40'; c2.fillRect(2, -35, 6, 2); } c2.strokeStyle = shade(col, 0.3); c2.lineWidth = 2; c2.beginPath(); c2.moveTo(-5, -40); c2.lineTo(-10, -50); c2.moveTo(7, -40); c2.lineTo(12, -50); c2.stroke(); } })); break;
        case 'mage': this.humanoid(c, s, Object.assign(base, { robe: true, weapon: 'staff', weaponColor: m.boss === 'lazarus' ? '#ff4040' : '#ff8040', cape: shade(col, -0.4), head: c2 => { c2.fillStyle = m.boss === 'lazarus' ? '#d8b048' : shade(col, -0.3); c2.beginPath(); c2.moveTo(-8, -32); c2.lineTo(1, -54); c2.lineTo(10, -32); c2.fill(); c2.fillStyle = '#000'; c2.beginPath(); c2.arc(2, -34, 4, 0, 7); c2.fill(); c2.fillStyle = '#f33'; c2.fillRect(3, -35, 2, 1.5); } })); break;
        case 'succubus': this.drawWings(c, s, k, '#6a2040', st); this.humanoid(c, s, Object.assign(base, { body: '#c04070', skin: '#e08090', arms: '#e08090', legs: '#e08090', weapon: null, head: c2 => { c2.fillStyle = '#301020'; c2.beginPath(); c2.arc(1, -36, 7, Math.PI, 0); c2.fill(); c2.fillRect(-6, -36, 3, 12); c2.strokeStyle = '#300'; c2.lineWidth = 2; c2.beginPath(); c2.moveTo(-4, -41); c2.lineTo(-7, -48); c2.moveTo(6, -41); c2.lineTo(9, -48); c2.stroke(); } })); break;
        case 'brute': this.humanoid(c, s, Object.assign(base, { hunch: 0.2, weapon: 'club', chest: c2 => { c2.fillStyle = shade(col, 0.15); c2.beginPath(); c2.ellipse(0, -10, 12, 13, 0, 0, 7); c2.fill(); }, head: c2 => { c2.strokeStyle = '#d0c0a0'; c2.lineWidth = 3; c2.beginPath(); c2.moveTo(-3, -38); c2.lineTo(-10, -44); c2.moveTo(5, -38); c2.lineTo(12, -44); c2.stroke(); } })); break;
        case 'demon': case 'balrog': this.drawWings(c, s, k, shade(col, -0.4), st); this.humanoid(c, s, Object.assign(base, { weapon: m.look === 'balrog' ? 'axe' : 'claw', head: (c2, back) => { c2.strokeStyle = '#1a1010'; c2.lineWidth = 3; c2.beginPath(); c2.moveTo(-4, -39); c2.quadraticCurveTo(-12, -44, -9, -52); c2.moveTo(6, -39); c2.quadraticCurveTo(14, -44, 11, -52); c2.stroke(); if (!back) { c2.fillStyle = '#ff0'; c2.fillRect(3, -36, 2, 2); } } }));
          if (m.id === 'magma' || m.look === 'balrog') { c.save(); c.globalCompositeOperation = 'lighter'; this.glow(c, s.x, s.y - 30 * k, 30 * k, 'rgba(255,90,20,.25)'); c.restore(); }
          if (m.id === 'stormrider') { c.save(); c.globalCompositeOperation = 'lighter'; this.glow(c, s.x, s.y - 30 * k, 30 * k, 'rgba(90,120,255,.3)'); c.restore(); }
          break;
        case 'diablo': this.drawDiablo(c, s, m, st, fc); break;
        case 'beast': this.drawBeast(c, s, m, st, fc, col, false); break;
        case 'horned': this.drawBeast(c, s, m, st, fc, col, true); break;
        case 'bat': this.drawBat(c, s, m, st, fc, col); break;
        default: this.humanoid(c, s, base);
      }
      c.restore();
    }
    drawWings(c, s, k, col, st) {
      const flap = Math.sin(this.time * (st.walk >= 0 ? 10 : 3)) * 0.25;
      c.save(); c.translate(s.x, s.y - 40 * k); c.scale(k, k); c.fillStyle = col;
      for (const d of [-1, 1]) { c.save(); c.scale(d, 1); c.rotate(flap); c.beginPath(); c.moveTo(0, 0); c.lineTo(26, -18); c.lineTo(30, 6); c.lineTo(20, 2); c.lineTo(16, 12); c.lineTo(8, 6); c.closePath(); c.fill(); c.restore(); }
      c.restore();
    }
    drawBeast(c, s, m, st, fc, col, horned) {
      const k = this.monsterSize(m), ph = st.walk >= 0 ? Math.sin(st.walk * Math.PI * 2) : 0, lunge = st.attack >= 0 ? Math.sin(st.attack * Math.PI) * 8 : 0;
      c.save(); c.translate(s.x, s.y); c.scale(k * fc.f, k);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, 0, 20, 7, 0, 0, 7); c.fill();
      c.fillStyle = shade(col, -0.3); for (const [x, p] of [[-12, ph], [-6, -ph], [8, -ph], [14, ph]]) { c.save(); c.translate(x, -12); c.rotate(p * 0.5); c.fillRect(-2, 0, 4, 12); c.restore(); }
      c.translate(lunge, 0);
      c.fillStyle = col; c.beginPath(); c.ellipse(0, -18, 18, 9, 0, 0, 7); c.fill();
      if (horned) { c.fillStyle = shade(col, 0.1); c.beginPath(); c.ellipse(-2, -22, 14, 10, 0, 0, 7); c.fill(); }
      c.fillStyle = shade(col, 0.1); c.beginPath(); c.ellipse(18, -22, 8, 6, -0.3, 0, 7); c.fill();
      if (horned) { c.strokeStyle = '#e0d8c0'; c.lineWidth = 3; c.beginPath(); c.moveTo(20, -26); c.quadraticCurveTo(28, -34, 32, -26); c.moveTo(16, -27); c.quadraticCurveTo(18, -38, 26, -38); c.stroke(); }
      else { c.fillStyle = '#e0d8c0'; c.beginPath(); c.moveTo(22, -19); c.lineTo(28, -16); c.lineTo(22, -17); c.fill(); }
      c.fillStyle = m.id === 'acidbeast' ? '#9f0' : '#f20'; c.fillRect(20, -25, 2, 2);
      c.strokeStyle = shade(col, -0.2); c.lineWidth = 2; c.beginPath(); c.moveTo(-17, -20); c.quadraticCurveTo(-26, -24 + ph * 3, -28, -14); c.stroke();
      if (m.id === 'acidbeast') { c.fillStyle = '#6f2'; c.beginPath(); c.arc(26, -15 + (this.time * 20 % 6), 1.5, 0, 7); c.fill(); }
      c.restore();
    }
    drawBat(c, s, m, st, fc, col) {
      const k = this.monsterSize(m), fl = Math.sin(this.time * 18 + m.uidm) * 0.6, hov = Math.sin(this.time * 4 + m.uidm) * 4;
      c.save(); c.translate(s.x, s.y); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 0, 10, 4, 0, 0, 7); c.fill();
      c.translate(0, -34 + hov); c.scale(k * fc.f, k);
      c.fillStyle = shade(col, -0.2);
      for (const d of [-1, 1]) { c.save(); c.scale(d, 1); c.rotate(fl); c.beginPath(); c.moveTo(0, 0); c.lineTo(22, -10); c.lineTo(18, 0); c.lineTo(24, 4); c.lineTo(12, 4); c.lineTo(8, 8); c.closePath(); c.fill(); c.restore(); }
      c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 6, 8, 0, 0, 7); c.fill(); c.fillStyle = '#f00'; c.fillRect(1, -4, 2, 2); c.fillRect(-3, -4, 2, 2);
      c.restore();
    }
    drawDiablo(c, s, m, st, fc) {
      const k = 1.9;
      this.humanoid(c, s, { facing: fc.f, back: fc.back, st, scale: k, body: '#9a1a10', arms: '#8a1a10', legs: '#6a1008', skin: '#9a1a10', weapon: 'claw', hunch: 0.1,
        chest: c2 => { c2.fillStyle = '#c03020'; c2.beginPath(); c2.ellipse(0, -14, 8, 10, 0, 0, 7); c2.fill(); c2.strokeStyle = '#3a0a04'; c2.lineWidth = 1.5; for (let i = 0; i < 4; i++) { c2.beginPath(); c2.moveTo(-6, -24 + i * 5); c2.lineTo(6, -24 + i * 5); c2.stroke(); } c2.fillStyle = '#e0d0b0'; for (let i = 0; i < 5; i++) { c2.beginPath(); c2.moveTo(-9 + i * 1, -30 + i * 6); c2.lineTo(-15, -28 + i * 6); c2.lineTo(-9, -26 + i * 6); c2.fill(); } },
        head: (c2, back) => { c2.fillStyle = '#e0d0b0'; for (const d of [-1, 1]) { c2.beginPath(); c2.moveTo(1 + d * 4, -39); c2.quadraticCurveTo(1 + d * 14, -46, 1 + d * 10, -58); c2.lineTo(1 + d * 6, -42); c2.fill(); } if (!back) { c2.fillStyle = '#ff0'; c2.fillRect(2, -36, 3, 2); c2.fillRect(-3, -36, 3, 2); } } });
      c.save(); c.globalCompositeOperation = 'lighter'; this.glow(c, s.x, s.y - 50, 70, 'rgba(255,40,20,.18)'); c.restore();
    }
    drawProjectile(c, p, s) {
      const ang = Math.atan2((p.vx + p.vy) / 2, p.vx - p.vy);
      c.save();
      const y = s.y - 20;
      switch (p.kind) {
        case 'arrow': c.translate(s.x, y); c.rotate(ang); c.strokeStyle = '#c8b090'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-10, 0); c.lineTo(8, 0); c.stroke(); c.fillStyle = '#ddd'; c.beginPath(); c.moveTo(10, 0); c.lineTo(6, -2); c.lineTo(6, 2); c.fill(); c.fillStyle = '#a03030'; c.fillRect(-11, -2, 3, 4); break;
        case 'lightning': case 'bolt_': {
          const o = this.toScreen(p.ox, p.oy); c.strokeStyle = '#c0d8ff'; c.lineWidth = 2; c.shadowColor = '#6080ff'; c.shadowBlur = 8;
          c.beginPath(); c.moveTo(o.x, o.y - 20); const n = 8; for (let i = 1; i <= n; i++) { const tx = o.x + (s.x - o.x) * i / n + (i < n ? (Math.random() - 0.5) * 12 : 0), ty = o.y - 20 + (y - o.y + 20) * i / n + (i < n ? (Math.random() - 0.5) * 10 : 0); c.lineTo(tx, ty); } c.stroke(); break;
        }
        default: {
          const col = { firebolt: ['#ffe080', '#ff6010'], fireball: ['#fff0a0', '#ff4000'], magma: ['#ffd080', '#e03000'], acid: ['#e0ff80', '#40c010'], bolt: ['#ffffff', '#5070ff'], nova: ['#ffffff', '#80a0ff'], bloodstar: ['#ffc0d0', '#e01040'] }[p.kind] || ['#fff', '#f80'];
          const r = p.kind === 'fireball' ? 9 : p.kind === 'nova' ? 4 : 6;
          c.translate(s.x, y); c.rotate(ang);
          const g = c.createLinearGradient(-r * 4, 0, r, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, col[1]); c.fillStyle = g; c.beginPath(); c.moveTo(-r * 4, 0); c.lineTo(0, -r * 0.8); c.lineTo(0, r * 0.8); c.fill();
          const rg = c.createRadialGradient(0, 0, 0, 0, 0, r); rg.addColorStop(0, col[0]); rg.addColorStop(1, col[1]); c.fillStyle = rg; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
          if (p.kind === 'bloodstar') { c.rotate(this.time * 8); c.fillStyle = col[0]; for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.fillRect(0, -1, r + 4, 2); } }
        }
      }
      c.restore();
    }
    drawEffect(c, e, s) {
      const k = e.t / e.dur; c.save();
      switch (e.kind) {
        case 'explosion': { const r = 12 + k * 36; c.globalCompositeOperation = 'lighter'; this.glow(c, s.x, s.y - 14, r, `rgba(255,${120 - k * 80 | 0},20,${0.9 - k * 0.8})`); c.fillStyle = `rgba(255,220,120,${1 - k})`; for (let i = 0; i < 10; i++) { const a = i * 0.63 + e.x; c.fillRect(s.x + Math.cos(a) * r * 0.9, s.y - 14 + Math.sin(a) * r * 0.45, 2, 2); } break; }
        case 'burst': c.globalCompositeOperation = 'lighter'; this.glow(c, s.x, s.y - 20, 8 + k * 16, e.color ? e.color + '99' : 'rgba(255,160,40,.6)'); break;
        case 'flash': case 'nova': { const r = (e.kind === 'nova' ? 160 : 90) * k; c.strokeStyle = e.color || `rgba(200,220,255,${1 - k})`; c.globalAlpha = 1 - k; c.lineWidth = 6 * (1 - k) + 1; c.beginPath(); c.ellipse(s.x, s.y - 10, r, r * 0.5, 0, 0, 7); c.stroke(); break; }
        case 'bolt': { const b = this.toScreen(e.x2, e.y2); c.strokeStyle = `rgba(200,220,255,${1 - k})`; c.lineWidth = 2.5; c.shadowColor = '#6080ff'; c.shadowBlur = 10; c.beginPath(); c.moveTo(s.x, s.y - 22); for (let i = 1; i <= 7; i++) c.lineTo(s.x + (b.x - s.x) * i / 7 + (i < 7 ? (Math.random() - 0.5) * 14 : 0), s.y - 22 + (b.y - s.y) * i / 7 + (i < 7 ? (Math.random() - 0.5) * 12 : 0)); c.stroke(); break; }
        case 'heal': c.fillStyle = `rgba(255,80,80,${1 - k})`; for (let i = 0; i < 6; i++) { const a = i + e.t * 3; c.fillRect(s.x + Math.cos(a) * 14 - 1, s.y - 10 - k * 50 - i * 5, 3, 7); c.fillRect(s.x + Math.cos(a) * 14 - 3, s.y - 8 - k * 50 - i * 5, 7, 3); } break;
        case 'levelup': c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,220,100,${0.5 * (1 - k)})`; c.fillRect(s.x - 16, s.y - 90, 32, 90); c.fillStyle = `rgba(255,255,200,${1 - k})`; for (let i = 0; i < 12; i++) c.fillRect(s.x - 16 + (i * 13 % 32), s.y - ((e.t * 120 + i * 20) % 90), 2, 4); break;
        case 'shield': c.strokeStyle = `rgba(120,140,255,${1 - k})`; c.lineWidth = 3; c.beginPath(); c.ellipse(s.x, s.y - 26, 20 + k * 20, 32 + k * 20, 0, 0, 7); c.stroke(); break;
        case 'teleport': c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) { const a = i * 0.8 + e.t * 10; c.fillStyle = `rgba(200,150,255,${1 - k})`; c.fillRect(s.x + Math.cos(a) * 12, s.y - 30 + Math.sin(a) * 20 - k * 20, 3, 3); } break;
        case 'summon': c.fillStyle = `rgba(40,20,40,${0.7 * (1 - k)})`; c.beginPath(); c.ellipse(s.x, s.y - 10, 20 * (1 + k), 12 * (1 + k), 0, 0, 7); c.fill(); break;
        case 'warning': { c.strokeStyle = `rgba(255,30,30,${0.4 + 0.6 * k})`; c.lineWidth = 2; const r = 40 * (1 - k * 0.3); c.beginPath(); c.ellipse(s.x, s.y, r, r / 2, 0, 0, 7); c.stroke(); c.beginPath(); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 4 / 5 + e.t * 2; const px = s.x + Math.cos(a) * r, py = s.y + Math.sin(a) * r / 2; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.stroke(); break; }
      }
      c.restore();
    }
    drawLabels(c, game) {
      const L = game.level, boxes = [];
      c.font = '11px "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const f of L.items) {
        if (!L.visible[f.y * L.w + f.x]) continue;
        const s = this.toScreen(f.x, f.y), text = D.itemName(f.item), w = c.measureText(text).width + 8;
        let bx = s.x - w / 2, by = s.y - 34;
        for (let tries = 0; tries < 8 && boxes.some(b => bx < b.x + b.w && bx + w > b.x && by < b.y + 14 && by + 14 > b.y); tries++) by -= 15;
        const box = { x: bx, y: by, w, h: 14, f }; boxes.push(box);
        c.fillStyle = this.hover && this.hover.f === f ? 'rgba(60,40,20,.9)' : 'rgba(0,0,0,.72)'; c.fillRect(bx, by, w, 14);
        c.fillStyle = D.itemColor(f.item); c.fillText(text, s.x, by + 7);
      }
      this.labelBoxes = boxes;
    }
    drawAutomap(c, game) {
      const L = game.level, h = game.hero, S = 5;
      c.save(); c.beginPath(); c.rect(0, 0, VIEW_W, VIEW_H); c.clip();
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, VIEW_W, VIEW_H);
      const cx = VIEW_W / 2 - (h.x - h.y) * S, cy = VIEW_H / 2 - (h.x + h.y) * S / 2;
      for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
        if (!L.explored[y * L.w + x]) continue;
        const t = L.get(x, y), sx = cx + (x - y) * S, sy = cy + (x + y) * S / 2;
        if (t === T.WALL || t === T.HOUSE || t === T.TREE) { c.fillStyle = t === T.TREE ? 'rgba(80,140,60,.7)' : 'rgba(200,170,110,.85)'; c.fillRect(sx - 2, sy - 1, 4, 2); }
        else if (t === T.DOOR || t === T.DOOR_OPEN) { c.fillStyle = '#d08040'; c.fillRect(sx - 2, sy - 2, 4, 4); }
        else if (t === T.UP || t === T.DOWN) { c.fillStyle = '#40ff40'; c.fillRect(sx - 3, sy - 2, 6, 4); }
        else if (t === T.WATER || t === T.LAVA) { c.fillStyle = t === T.LAVA ? 'rgba(255,80,20,.5)' : 'rgba(60,100,200,.5)'; c.fillRect(sx - 2, sy - 1, 4, 2); }
      }
      for (const o of L.objects) if (o.type === 'portal') { c.fillStyle = '#60a0ff'; c.fillRect(cx + (o.x - o.y) * S - 2, cy + (o.x + o.y) * S / 2 - 3, 4, 6); }
      if (L.index === 0) for (const n of L.npcs) { if (n.dead) continue; c.fillStyle = '#ffd040'; c.fillRect(cx + (n.tx - n.ty) * S - 1.5, cy + (n.tx + n.ty) * S / 2 - 1.5, 3, 3); }
      c.fillStyle = '#ffff40'; c.beginPath(); c.arc(VIEW_W / 2, VIEW_H / 2, 3, 0, 7); c.fill();
      c.fillStyle = '#e0c080'; c.font = '12px "Times New Roman", serif'; c.textAlign = 'left'; c.fillText(L.index === 0 ? 'Тристрам' : `${L.theme.name}, уровень ${L.index}`, 8, 16);
      c.restore();
    }
    // picking --------------------------------------------------------------
    pick(game, sx, sy) {
      const L = game.level;
      for (const b of this.labelBoxes) if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) return { f: b.f };
      let best = null, bd = Infinity;
      for (const p of this.pickables || []) {
        const r = p.r || 1, dx = sx - p.x, dy = sy - (p.y - 26 * r);
        if (Math.abs(dx) < 16 * r && Math.abs(dy) < 30 * r) { const d = Math.hypot(dx, dy) - (p.m ? 6 : 0); if (d < bd) { bd = d; best = p; } }
      }
      if (best) return best.m ? { m: best.m } : { n: best.n };
      const t = this.toTile(sx, sy + 8);
      if (!L.inb(t.x, t.y) || !L.visible[t.y * L.w + t.x]) {
        const t2 = this.toTile(sx, sy); return { tile: t2 };
      }
      // objects: check tile and the one below (tall sprites)
      for (const [dx, dy] of [[0, 0], [1, 1], [1, 0], [0, 1]]) { const o = L.objAt(t.x + dx, t.y + dy); if (o && (o.type !== 'corpse' && o.type !== 'well') && (!o.used || o.type === 'portal' || o.type.startsWith('fountain')) && L.visible[(t.y + dy) * L.w + t.x + dx]) { const s = this.toScreen(o.x, o.y); if (Math.abs(sx - s.x) < 22 && sy > s.y - 60 && sy < s.y + 12) return { o }; } }
      const f = L.itemAt(t.x, t.y); if (f) return { f };
      const tt = L.get(t.x, t.y);
      if (tt === T.UP || tt === T.DOWN) return { stairs: t };
      for (const [dx, dy] of [[1, 1], [0, 1], [1, 0]]) { const t2 = L.get(t.x + dx, t.y + dy); if ((t2 === T.UP || t2 === T.DOWN) && L.index === 0) { const s = this.toScreen(t.x + dx, t.y + dy); if (Math.abs(sx - s.x) < 26 && sy > s.y - 56) return { stairs: { x: t.x + dx, y: t.y + dy } }; } }
      return { tile: t };
    }
  }

  D.Renderer = Renderer; D.itemIcon = itemIcon; D.VIEW_W = VIEW_W; D.VIEW_H = VIEW_H;
})(globalThis.Diablo98 = globalThis.Diablo98 || {});
