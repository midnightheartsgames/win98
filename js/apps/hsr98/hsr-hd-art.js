(function (H) {
  'use strict';
  const G = H.Gfx;
  const ELEM_RGB = { phys: '224,224,224', fire: '255,106,48', ice: '138,223,255', elec: '192,122,255', wind: '95,224,168', quant: '138,122,255', imag: '255,216,80', heal: '134,227,154' };
  const RIFT_COL = {
    legion: ['rgba(176,80,255,0.55)', 'rgba(200,120,255,0.9)', '#ffb0ff', '#b050ff'],
    silvermane: ['rgba(120,170,255,0.55)', 'rgba(170,210,255,0.9)', '#e8f0ff', '#6a9aff'],
    automaton: ['rgba(255,120,60,0.55)', 'rgba(255,160,90,0.9)', '#ffe0a0', '#ff6a30'],
    winter: ['rgba(120,220,255,0.55)', 'rgba(190,240,255,0.9)', '#ffffff', '#8adfff']
  };
  const rgb = (e, a) => 'rgba(' + (ELEM_RGB[e] || ELEM_RGB.phys) + ',' + a.toFixed(3) + ')';
  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

  function hdRift(c, x, y, t, glow, threat) {
    const k = 0.6 + 0.4 * Math.sin(t * 3), P = RIFT_COL[threat] || RIFT_COL.legion;
    c.save();
    c.fillStyle = 'rgba(10,4,24,0.85)'; c.beginPath(); c.ellipse(x, y + 6, 22, 9, 0, 0, Math.PI * 2); c.fill();
    const gr = c.createRadialGradient(x, y - 6, 2, x, y - 6, 26);
    gr.addColorStop(0, 'rgba(255,240,255,' + (0.7 * k).toFixed(3) + ')'); gr.addColorStop(0.4, P[0]); gr.addColorStop(1, 'rgba(20,10,40,0)');
    c.fillStyle = gr; c.fillRect(x - 28, y - 34, 56, 56);
    c.strokeStyle = P[1]; c.lineWidth = 2;
    c.beginPath(); c.ellipse(x, y - 8, 10 + 2 * k, 20, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1;
    c.beginPath(); c.ellipse(x, y - 8, 5 + k, 13, 0, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 6; i++) {
      const a = t * 2 + i * 1.05, r = 14 + 6 * Math.sin(t * 4 + i);
      c.fillStyle = i % 2 ? P[2] : P[3];
      c.fillRect(Math.round(x + Math.cos(a) * r * 0.6), Math.round(y - 8 + Math.sin(a) * r), 2, 2);
    }
    if (glow > 0) {
      c.strokeStyle = 'rgba(255,74,58,' + (0.5 + 0.5 * Math.sin(t * 12)).toFixed(3) + ')'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(x, y + 4, 28, 12, 0, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(255,74,58,' + (0.15 + 0.1 * Math.sin(t * 12)).toFixed(3) + ')'; c.beginPath(); c.ellipse(x, y - 8, 16, 26, 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }

  function hdTurret(c, x, y, t, dead, ang, fire) {
    c.save();
    c.fillStyle = 'rgba(2,4,12,0.45)'; c.beginPath(); c.ellipse(x, y + 10, 16, 6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = dead ? '#2a2e38' : '#3e4a64'; c.fillRect(x - 13, y - 4, 26, 14);
    c.fillStyle = dead ? '#3a3e48' : '#5a6a8a'; c.fillRect(x - 13, y - 4, 26, 3);
    c.fillStyle = dead ? '#1a1c22' : '#ff9a40'; c.fillRect(x - 13, y + 8, 26, 2);
    c.fillStyle = dead ? '#22242c' : '#2a3448'; c.fillRect(x - 10, y + 1, 4, 5); c.fillRect(x + 6, y + 1, 4, 5);
    if (dead) {
      c.fillStyle = '#4a4e58'; c.fillRect(x - 6, y - 12, 7, 9); c.fillRect(x + 2, y - 8, 5, 5);
      c.fillStyle = '#5a3020'; c.fillRect(x - 3, y - 10, 2, 2);
      for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; c.fillStyle = 'rgba(120,120,130,' + (0.4 * (1 - ph)).toFixed(3) + ')'; c.fillRect(x - 2 + Math.sin(t * 2 + i) * 3, y - 14 - ph * 18, 3, 3); }
      c.restore();
      return;
    }
    c.fillStyle = '#26304a'; c.fillRect(x - 8, y - 18, 16, 15);
    c.fillStyle = '#7a8aaa'; c.fillRect(x - 8, y - 18, 16, 2);
    c.fillStyle = '#56d4ff'; c.fillRect(x - 3, y - 13, 6, 4);
    c.fillStyle = 'rgba(86,212,255,' + (0.25 + 0.2 * Math.sin(t * 4)).toFixed(3) + ')'; c.fillRect(x - 5, y - 15, 10, 8);
    c.translate(x, y - 11); c.rotate(ang || 0);
    c.fillStyle = '#1a2236'; c.fillRect(0, -3, 16, 6);
    c.fillStyle = '#9aa6c0'; c.fillRect(0, -3, 16, 1);
    c.fillStyle = 'rgba(86,212,255,' + (0.6 + 0.4 * Math.sin(t * 5)).toFixed(3) + ')'; c.fillRect(14, -2, 3, 4);
    if (fire > 0) { c.fillStyle = 'rgba(200,240,255,' + Math.min(1, fire * 6).toFixed(3) + ')'; c.beginPath(); c.moveTo(16, -5); c.lineTo(26, 0); c.lineTo(16, 5); c.closePath(); c.fill(); }
    c.restore();
  }

  function hdShot(c, x, y, ang, elem, kind) {
    c.save(); c.translate(x, y); c.rotate(ang || 0);
    if (kind === 'turret') {
      c.fillStyle = 'rgba(86,212,255,0.35)'; c.fillRect(-14, -2, 14, 4);
      c.fillStyle = '#c8f4ff'; c.fillRect(-4, -2, 8, 4);
      c.fillStyle = '#ffffff'; c.fillRect(1, -1, 3, 2);
      c.restore();
      return;
    }
    c.fillStyle = rgb(elem, 0.3); c.fillRect(-12, -3, 12, 6);
    if (elem === 'fire') { c.fillStyle = '#ffd080'; c.beginPath(); c.arc(0, 0, 4, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,90,30,0.8)'; c.fillRect(-9, -2, 6, 4); c.fillRect(-13, -1, 4, 2); }
    else if (elem === 'ice') { c.fillStyle = '#e8faff'; c.beginPath(); c.moveTo(6, 0); c.lineTo(-2, -3); c.lineTo(-6, 0); c.lineTo(-2, 3); c.closePath(); c.fill(); c.strokeStyle = rgb('ice', 1); c.stroke(); }
    else if (elem === 'elec') { c.strokeStyle = '#f0d0ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, 0); c.lineTo(-6, -3); c.lineTo(-2, 2); c.lineTo(2, -2); c.lineTo(6, 0); c.stroke(); }
    else if (elem === 'wind') { c.strokeStyle = rgb('wind', 1); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 4, Math.PI * 0.2, Math.PI * 1.6); c.stroke(); c.fillStyle = '#e0fff0'; c.fillRect(-1, -1, 3, 2); }
    else if (elem === 'quant') { c.fillStyle = rgb('quant', 1); c.fillRect(-3, -3, 6, 6); c.fillStyle = '#e0dcff'; c.fillRect(-1, -1, 2, 2); c.fillStyle = rgb('quant', 0.6); c.fillRect(-9, -2, 3, 3); }
    else if (elem === 'imag') { c.strokeStyle = rgb('imag', 1); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 4, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#fff8d0'; c.fillRect(-1, -1, 2, 2); }
    else { c.fillStyle = rgb(elem, 1); c.fillRect(-4, -2, 8, 4); c.fillStyle = '#ffffff'; c.fillRect(1, -1, 3, 2); }
    c.restore();
  }

  function hdAreaFx(c, ar, x, y, t) {
    const e = ar.elem || 'heal', r = ar.r || 40, n = Math.min(14, Math.max(4, Math.round(r / 14)));
    c.save();
    c.beginPath();
    if (ar.shape === 'cone') { c.moveTo(x, y); c.arc(x, y, r, ar.ang - ar.arc / 2, ar.ang + ar.arc / 2); c.closePath(); }
    else if (ar.shape === 'line') { c.restore(); return; }
    else c.arc(x, y, r, 0, Math.PI * 2);
    c.clip();
    for (let i = 0; i < n; i++) {
      const a = hash(i, ar.r || 1) * Math.PI * 2, d = Math.sqrt(hash(ar.r || 1, i)) * r, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.9, ph = (t * 0.8 + hash(i, 7)) % 1;
      if (e === 'fire') { c.fillStyle = rgb('fire', 0.7 * (1 - ph)); c.fillRect(px, py - ph * 10, 2, 3); }
      else if (e === 'ice') { c.strokeStyle = rgb('ice', 0.55); c.beginPath(); c.moveTo(px - 3, py); c.lineTo(px + 3, py); c.moveTo(px, py - 3); c.lineTo(px, py + 3); c.stroke(); }
      else if (e === 'elec') { if (ph < 0.3) { c.strokeStyle = rgb('elec', 0.8); c.beginPath(); c.moveTo(px - 4, py - 2); c.lineTo(px, py + 1); c.lineTo(px + 4, py - 2); c.stroke(); } }
      else if (e === 'wind') { c.strokeStyle = rgb('wind', 0.45); c.beginPath(); c.arc(px, py, 4, t * 4 + i, t * 4 + i + 2); c.stroke(); }
      else if (e === 'quant') { c.fillStyle = rgb('quant', 0.5 * (1 - ph)); c.fillRect(px - 2, py - 2 - ph * 4, 4, 4); }
      else if (e === 'imag') { c.strokeStyle = rgb('imag', 0.5 * (1 - ph)); c.beginPath(); c.arc(px, py, 2 + ph * 4, 0, Math.PI * 2); c.stroke(); }
      else if (e === 'heal') { c.fillStyle = rgb('heal', 0.6 * (1 - ph)); c.fillRect(px - 1, py - 3 - ph * 8, 2, 6); c.fillRect(px - 3, py - 1 - ph * 8, 6, 2); }
      else { c.fillStyle = rgb('phys', 0.35 * (1 - ph)); c.fillRect(px, py, 2, 2); }
    }
    c.restore();
  }

  function slotSign(c, slot, x, y, s, col) {
    c.save(); c.translate(x, y); c.scale(s / 16, s / 16);
    c.fillStyle = col; c.strokeStyle = '#05060e'; c.lineWidth = 1.5;
    c.beginPath();
    if (slot === 'q') { c.moveTo(2, 14); c.lineTo(4, 12); c.lineTo(12, 4); c.lineTo(14, 2); c.lineTo(13, 6); c.lineTo(5, 14); c.closePath(); }
    else if (slot === 'e') { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 3 : 7; c.lineTo(8 + Math.cos(a) * r, 8 + Math.sin(a) * r); } c.closePath(); }
    else if (slot === 't') { c.moveTo(8, 1); c.lineTo(15, 8); c.lineTo(8, 15); c.lineTo(1, 8); c.closePath(); }
    else { for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, r = k % 2 ? 3 : 8; c.lineTo(8 + Math.cos(a) * r, 8 + Math.sin(a) * r); } c.closePath(); }
    c.stroke(); c.fill();
    c.restore();
  }

  const abilImages = {};

  function abilImage(key) {
    const src = H.ABIL_PIX && H.ABIL_PIX[key];
    if (!src) return null;
    if (!abilImages[key]) { abilImages[key] = new Image(); abilImages[key].src = src; }
    return abilImages[key].complete && abilImages[key].naturalWidth ? abilImages[key] : null;
  }

  function hdAbilIcon(c, look, slot, elem, x, y, s, hero) {
    const art = hero && abilImage(hero + '-' + slot);
    if (art) {
      c.drawImage(art, x, y, s, s);
      slotSign(c, slot, x + s - s * 0.34 - 1, y + 1, s * 0.34, rgb(elem, 1));
      return;
    }
    c.save(); c.beginPath(); c.rect(x, y, s, s); c.clip();
    c.fillStyle = '#10142e'; c.fillRect(x, y, s, s);
    const off = { q: [-12, -10], e: [-20, -8], t: [-6, -14], r: [-12, -4] }[slot] || [-12, -10], big = slot === 'r' ? 72 : 64;
    c.drawImage(G.bustCanvas(look, 64), x + off[0] * s / 40, y + off[1] * s / 40, big * s / 40, big * s / 40);
    const gr = c.createLinearGradient(x, y, x + s, y + s);
    gr.addColorStop(0, rgb(elem, 0)); gr.addColorStop(1, rgb(elem, 0.55));
    c.fillStyle = gr; c.fillRect(x, y, s, s);
    c.restore();
    slotSign(c, slot, x + s - s * 0.45 - 1, y + 1, s * 0.45, rgb(elem, 1));
  }

  function hdAttrIcon(c, attr, x, y, s) {
    const col = { str: '#ff8a6a', agi: '#86e39a', int: '#80c8ff' }[attr];
    c.save(); c.translate(x, y); c.scale(s / 12, s / 12);
    c.fillStyle = col; c.strokeStyle = '#05060e'; c.lineWidth = 1;
    c.beginPath();
    if (attr === 'str') { c.moveTo(1, 5); c.lineTo(4, 2); c.lineTo(8, 2); c.lineTo(11, 5); c.lineTo(11, 10); c.lineTo(1, 10); c.closePath(); }
    else if (attr === 'agi') { c.moveTo(1, 11); c.lineTo(6, 1); c.lineTo(8, 5); c.lineTo(11, 1); c.lineTo(9, 11); c.closePath(); }
    else { c.arc(6, 6, 5, 0, Math.PI * 2); }
    c.fill(); c.stroke();
    if (attr === 'int') { c.fillStyle = '#05060e'; c.fillRect(5, 3, 2, 6); c.fillRect(3, 5, 6, 2); }
    c.restore();
  }

  function hdAtkIcon(c, type, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s / 12, s / 12);
    c.lineWidth = 1.5;
    if (type === 'weapon') { c.strokeStyle = '#e0e0e8'; c.beginPath(); c.moveTo(2, 10); c.lineTo(10, 2); c.moveTo(3, 6); c.lineTo(6, 9); c.stroke(); }
    else if (type === 'magic') { c.fillStyle = '#c090ff'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; c.fillRect(6 + Math.cos(a) * 4 - 1, 6 + Math.sin(a) * 4 - 1, 2, 2); } c.fillStyle = '#ffffff'; c.fillRect(5, 5, 2, 2); }
    else { c.strokeStyle = '#ffd471'; c.beginPath(); c.arc(6, 6, 4.5, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#ffd471'; c.fillRect(5, 1, 2, 10); }
    c.restore();
  }

  function hdArmorIcon(c, type, x, y, s) {
    const fill = { none: '#3a3e50', light: '#8aa0c0', medium: '#9aa8b8', heavy: '#c0c8d8', divine: '#ffd471' }[type] || '#3a3e50';
    c.save(); c.translate(x, y); c.scale(s / 12, s / 12);
    c.fillStyle = fill; c.strokeStyle = '#05060e'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(6, 1); c.lineTo(11, 3); c.lineTo(10, 8); c.lineTo(6, 11); c.lineTo(2, 8); c.lineTo(1, 3); c.closePath(); c.fill(); c.stroke();
    const bars = { none: 0, light: 1, medium: 2, heavy: 3, divine: 3 }[type] || 0;
    c.fillStyle = '#05060e'; for (let i = 0; i < bars; i++) c.fillRect(4, 4 + i * 2, 4, 1);
    if (type === 'none') { c.strokeStyle = '#ff8a6a'; c.beginPath(); c.moveTo(3, 3); c.lineTo(9, 9); c.stroke(); }
    c.restore();
  }

  function deviceGlyph(c, id, x, y, s) {
    const k = s / 24;
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = '#141830'; c.fillRect(0, 0, 24, 24);
    if (id === 'grenade') {
      c.fillStyle = '#3a4a3a'; c.beginPath(); c.arc(12, 14, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6a8a6a'; c.fillRect(8, 10, 3, 3);
      c.fillStyle = '#c8ccd4'; c.fillRect(10, 4, 4, 4); c.fillRect(14, 3, 5, 2);
      c.strokeStyle = '#ffd471'; c.lineWidth = 1.5; c.beginPath(); c.arc(18, 6, 2.5, 0, Math.PI * 2); c.stroke();
    } else if (id === 'anchor') {
      c.strokeStyle = '#80c8ff'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(12, 4); c.lineTo(12, 19); c.moveTo(7, 8); c.lineTo(17, 8); c.stroke();
      c.beginPath(); c.arc(12, 12, 8, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke();
      c.fillStyle = '#ffd471'; c.beginPath(); c.arc(12, 4, 2.5, 0, Math.PI * 2); c.fill();
    } else if (id === 'garrison') {
      c.fillStyle = '#3a5aa0'; c.beginPath(); c.moveTo(12, 3); c.lineTo(20, 6); c.lineTo(19, 14); c.lineTo(12, 21); c.lineTo(5, 14); c.lineTo(4, 6); c.closePath(); c.fill();
      c.strokeStyle = '#f0d890'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#f0d890'; c.fillRect(11, 7, 2, 9); c.fillRect(8, 10, 8, 2);
    } else if (id === 'rz_key') {
      c.fillStyle = '#2a2040'; c.fillRect(4, 6, 16, 12);
      c.fillStyle = '#c070ff'; c.fillRect(6, 8, 12, 2); c.fillRect(6, 12, 8, 2);
      c.fillStyle = '#5affa0'; c.fillRect(15, 12, 3, 4);
      c.fillStyle = '#c8ccd4'; c.fillRect(10, 18, 4, 3);
    } else if (id === 'probe') {
      c.fillStyle = '#8a6a3a'; c.fillRect(11, 3, 2, 16);
      c.fillStyle = '#ffb040'; c.beginPath(); c.moveTo(12, 21); c.lineTo(8, 15); c.lineTo(16, 15); c.closePath(); c.fill();
      c.fillStyle = '#86e39a'; c.beginPath(); c.arc(12, 6, 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff'; c.fillRect(11, 4, 2, 2);
    } else if (id === 'findie') {
      c.fillStyle = '#f0c838'; c.beginPath(); c.ellipse(12, 14, 8, 6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f8e070'; c.fillRect(8, 11, 8, 3);
      c.fillStyle = '#e8a0a0'; c.fillRect(18, 13, 3, 3);
      c.fillStyle = '#3a2a10'; c.fillRect(10, 7, 4, 2); c.fillRect(9, 12, 1, 1);
    } else if (id === 'gold_watch') {
      c.strokeStyle = '#ffd471'; c.lineWidth = 2; c.beginPath(); c.arc(12, 13, 7, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#fff0b0'; c.beginPath(); c.arc(12, 13, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#3a2a10'; c.fillRect(11, 9, 2, 5); c.fillRect(12, 13, 4, 1);
      c.fillStyle = '#ffd471'; c.fillRect(10, 3, 4, 3);
    }
    c.restore();
  }

  const DEVICE_IDS = ['grenade', 'anchor', 'garrison', 'rz_key', 'probe', 'findie', 'gold_watch'];

  function hdItemIcon(c, it, x, y, s) {
    if (!it) return;
    if (it.id === 'relic') { G.itemIcon(c, 'relic:' + it.slot, x, y, s, it.set); return; }
    if (DEVICE_IDS.includes(it.id)) { deviceGlyph(c, it.id, x, y, s); return; }
    G.itemIcon(c, it.id, x, y, s);
  }

  function hdLord(c, x, y, t, hits, strike) {
    const k = 0.75 + 0.25 * Math.sin(t * 3), a = Math.min(1, 0.55 + hits * 0.045);
    c.save();
    c.globalAlpha = a;
    const gr = c.createRadialGradient(x, y - 30, 4, x, y - 30, 40);
    gr.addColorStop(0, 'rgba(216,176,255,' + (0.45 * k).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(120,60,200,0)');
    c.fillStyle = gr; c.fillRect(x - 40, y - 72, 80, 80);
    c.fillStyle = '#4a2a8a'; c.beginPath(); c.moveTo(x - 12, y - 2); c.lineTo(x - 16, y - 36); c.lineTo(x, y - 46); c.lineTo(x + 16, y - 36); c.lineTo(x + 12, y - 2); c.closePath(); c.fill();
    c.fillStyle = '#8a5ae0'; c.fillRect(x - 10, y - 40, 20, 4); c.fillRect(x - 14, y - 34, 4, 10); c.fillRect(x + 10, y - 34, 4, 10);
    c.fillStyle = '#e8d8ff'; c.beginPath(); c.arc(x, y - 52, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd471'; c.beginPath(); c.moveTo(x - 9, y - 56); c.lineTo(x - 4, y - 66); c.lineTo(x, y - 58); c.lineTo(x + 4, y - 66); c.lineTo(x + 9, y - 56); c.closePath(); c.fill();
    c.fillStyle = '#5a2aa0'; c.fillRect(x - 3, y - 53, 2, 2); c.fillRect(x + 1, y - 53, 2, 2);
    c.strokeStyle = '#f0d0ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 18, y - 6); c.lineTo(x + 22, y - 70); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + 22, y - 80); c.lineTo(x + 26, y - 70); c.lineTo(x + 18, y - 70); c.closePath(); c.fill();
    for (let i = 0; i < 3; i++) { const ph = (t * 1.6 + i / 3) % 1; c.strokeStyle = 'rgba(232,200,255,' + (0.8 * (1 - ph)).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 18 + i * 12, y - 20 - ph * 30); c.lineTo(x - 14 + i * 12, y - 26 - ph * 30); c.lineTo(x - 18 + i * 12, y - 30 - ph * 30); c.stroke(); }
    if (strike) {
      c.globalAlpha = 1; c.strokeStyle = 'rgba(240,220,255,0.95)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 22, y - 80);
      for (let i = 1; i <= 6; i++) c.lineTo(x + 22 + (strike.x - x - 22) * i / 6 + (i < 6 ? (hash(i, Math.floor(t * 10)) - 0.5) * 16 : 0), y - 80 + (strike.y - y + 80) * i / 6);
      c.stroke();
    }
    c.restore();
  }

  Object.assign(G, { hdRift, hdTurret, hdShot, hdAreaFx, hdAbilIcon, hdSlotSign: slotSign, hdAttrIcon, hdAtkIcon, hdArmorIcon, hdDeviceGlyph: deviceGlyph, hdItemIcon, hdLord, HD_ELEM_RGB: ELEM_RGB, HD_RIFT_COL: RIFT_COL });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
