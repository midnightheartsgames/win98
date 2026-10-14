(function (X) {
  'use strict';
  const INK = '#120a06';
  const COMIC = '"Comic Sans MS", "Comic Neue", "Chalkboard SE", cursive';
  const HUDF = '"Trebuchet MS", Verdana, sans-serif';

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function wrap(c, text, maxW) {
    const words = String(text).split(/\s+/), lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  X.hudWrap = wrap;
  X.hudRR = rr;

  function balloon(c, x, y, w, h, tx, ty, kind) {
    c.save();
    c.lineWidth = 2.5; c.strokeStyle = INK; c.fillStyle = kind === 'radio' ? '#f4f4e8' : '#ffffff';
    if (kind === 'think') {
      c.beginPath();
      const n = Math.max(6, Math.round((w + h) / 26));
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        const px = x + w / 2 + Math.cos(a) * w / 2, py = y + h / 2 + Math.sin(a) * h / 2;
        c.moveTo(px + 16, py); c.arc(px, py, 16, 0, 7);
      }
      c.fill(); c.stroke();
      c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 7); c.fill();
      if (tx !== undefined) for (let i = 1; i <= 3; i++) { const k = i / 4; c.beginPath(); c.arc(x + w / 2 + (tx - x - w / 2) * k, y + h + (ty - y - h) * k, 7 - i * 1.5, 0, 7); c.fill(); c.stroke(); }
      c.restore();
      return;
    }
    if (kind === 'shout') {
      c.beginPath();
      const n = 22;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, k = i % 2 ? 1.18 : 0.98;
        const px = x + w / 2 + Math.cos(a) * w / 2 * k, py = y + h / 2 + Math.sin(a) * h / 2 * k;
        if (i) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.closePath(); c.fill(); c.stroke();
    } else if (kind === 'radio') {
      c.beginPath(); c.rect(x, y, w, h); c.fill(); c.stroke();
    } else {
      c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2 + 6, h / 2 + 4, 0, 0, 7); c.fill(); c.stroke();
    }
    if (tx !== undefined) {
      const bx = X.clamp(tx, x + w * 0.2, x + w * 0.8), by = y + h;
      c.beginPath();
      if (kind === 'radio') { c.moveTo(bx - 8, by); c.lineTo(bx + 4, by + 10); c.lineTo(bx - 2, by + 12); c.lineTo(tx, ty); c.lineTo(bx + 10, by + 6); c.lineTo(bx + 8, by); }
      else { c.moveTo(bx - 10, by - 2); c.quadraticCurveTo(bx, by + 8, tx, ty); c.quadraticCurveTo(bx + 4, by + 4, bx + 10, by - 2); }
      c.fill(); c.stroke();
      c.beginPath(); c.moveTo(bx - 9, by - 3); c.lineTo(bx + 9, by - 3); c.lineWidth = 5; c.strokeStyle = c.fillStyle; c.stroke();
    }
    c.restore();
  }
  X.hudBalloon = balloon;

  function caption(c, x, y, w, text, o) {
    o = o || {};
    const fs = o.size || 14;
    c.save();
    c.font = `bold ${fs}px ${COMIC}`;
    const lines = wrap(c, o.upper === false ? text : String(text).toUpperCase(), w - 16);
    const h = lines.length * (fs + 3) + 12;
    c.fillStyle = o.bg || '#f6e27a'; c.strokeStyle = INK; c.lineWidth = 2.5;
    c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h);
    c.fillStyle = o.fg || INK; c.textBaseline = 'top';
    lines.forEach((l, i) => c.fillText(l, x + 8, y + 6 + i * (fs + 3)));
    c.restore();
    return h;
  }
  X.hudCaption = caption;

  function onomatopoeia(c, text, x, y, size, style, alpha, seed, t) {
    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y);
    const r = X.rng(seed || 1);
    c.rotate((r() - 0.5) * 0.35);
    c.lineJoin = 'round';
    let font, fill, stroke, lw = Math.max(2, size * 0.1), shrink = 0;
    switch (style) {
      case 'scream': case 'pain': font = `italic bold ${size}px Georgia, "Times New Roman", serif`; fill = '#c83226'; stroke = '#5a0a06'; shrink = 0.09; break;
      case 'explode': font = `${size}px Impact, "Arial Black", sans-serif`; fill = '#ffcc30'; stroke = INK; lw = size * 0.14; break;
      case 'hit': font = `${size}px Impact, "Arial Black", sans-serif`; fill = '#ffffff'; stroke = INK; break;
      case 'alert': font = `${size}px Impact, "Arial Black", sans-serif`; fill = '#e82818'; stroke = INK; break;
      case 'question': font = `${size}px Impact, "Arial Black", sans-serif`; fill = '#ffd440'; stroke = INK; break;
      case 'steps': font = `italic bold ${size}px ${COMIC}`; fill = '#f4ecd8'; stroke = INK; lw = Math.max(2, size * 0.14); break;
      case 'shot': font = `${size}px Impact, "Arial Black", sans-serif`; fill = '#fff2a0'; stroke = INK; break;
      default: font = `bold ${size}px Impact, "Arial Black", sans-serif`; fill = '#ffffff'; stroke = INK;
    }
    c.font = font;
    c.textBaseline = 'middle';
    if (style === 'explode') {
      const w = c.measureText(text).width;
      c.beginPath();
      const n = 16;
      for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, k = i % 2 ? 0.62 : 1; const px = Math.cos(a) * (w * 0.62) * k, py = Math.sin(a) * size * 0.95 * k; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
      c.closePath(); c.fillStyle = '#f07a18'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    }
    if (shrink) {
      const letters = text.split('');
      let total = 0;
      const sizes = letters.map((ch, i) => size * Math.max(0.45, 1 - i * shrink));
      letters.forEach((ch, i) => { c.font = font.replace(`${size}px`, `${Math.round(sizes[i])}px`); total += c.measureText(ch).width * 0.92; });
      let px = -total / 2;
      letters.forEach((ch, i) => {
        c.font = font.replace(`${size}px`, `${Math.round(sizes[i])}px`);
        const w = c.measureText(ch).width;
        const py = (size - sizes[i]) * 0.35 + Math.sin(i * 1.3 + (t || 0) * 0) * 2;
        c.lineWidth = Math.max(2, sizes[i] * 0.12); c.strokeStyle = stroke; c.strokeText(ch, px, py);
        c.fillStyle = fill; c.fillText(ch, px, py);
        px += w * 0.92;
      });
    } else {
      c.textAlign = 'center';
      c.lineWidth = lw; c.strokeStyle = stroke; c.strokeText(text, 0, 0);
      c.fillStyle = fill; c.fillText(text, 0, 0);
    }
    c.restore();
  }
  X.hudWord = onomatopoeia;

  class HUD {
    constructor(canvas, ui) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.ui = ui;
      this.words = [];
      this.msgs = [];
      this.notes = [];
      this.says = [];
      this.pickups = [];
      this.caption = null;
      this.hurts = [];
      this.wselT = -10;
      this.sense = {};
      this.cpT = -10;
      this.W = 0; this.H = 0;
      this.time = 0;
    }
    resize(w, h) {
      const dpr = 1;
      if (this.cv.width !== w * dpr || this.cv.height !== h * dpr) { this.cv.width = w * dpr; this.cv.height = h * dpr; }
      this.W = w; this.H = h;
    }
    clear() { this.ctx.clearRect(0, 0, this.cv.width, this.cv.height); }
    reset() { this.words = []; this.msgs = []; this.notes = []; this.says = []; this.pickups = []; this.caption = null; this.hurts = []; this.sense = {}; }
    word(text, p, style, o) {
      if (this.words.length > 40) this.words.shift();
      this.words.push(Object.assign({ text, p: p.slice(), style: style || 'hit', t: 0, life: style === 'steps' ? 0.7 : style === 'explode' ? 1.3 : 1.1, seed: Math.floor(Math.random() * 1e6) }, o || {}));
    }
    msg(text, dur) { this.msgs = this.msgs.filter(m => m.text !== text); this.msgs.push({ text, t: 0, life: dur || 3 }); if (this.msgs.length > 3) this.msgs.shift(); }
    note(kind, text) { this.notes.push({ kind, text, t: 0, life: 4.5 }); if (this.notes.length > 3) this.notes.shift(); }
    say(id, text, dur, radio) { this.says = this.says.filter(s => s.id !== id); this.says.push({ id, text, t: 0, life: dur || 3, radio }); if (this.says.length > 4) this.says.shift(); }
    pick(text) { this.pickups.push({ text, t: 0, life: 2.6 }); if (this.pickups.length > 5) this.pickups.shift(); }
    hurt(dir) { this.hurts.push({ dir, t: 0, life: 0.9 }); }

    project(p) {
      const v = this.ui.r && this.ui.r.lastView;
      if (!v) return null;
      const q = X.M4.project(v.VP, p);
      if (!q) return null;
      return [(q[0] * 0.5 + 0.5) * this.W, (1 - (q[1] * 0.5 + 0.5)) * this.H, q[2]];
    }

    update(dt) {
      this.time += dt;
      for (const L of [this.words, this.msgs, this.notes, this.says, this.pickups, this.hurts]) {
        for (let i = L.length - 1; i >= 0; i--) { L[i].t += dt; if (L[i].t > L[i].life) L.splice(i, 1); }
      }
      if (this.caption) { this.caption.t += dt; if (this.caption.t > this.caption.life) this.caption = null; }
    }

    draw(game, ui) {
      const c = this.ctx, W = this.W, H = this.H;
      c.clearRect(0, 0, W, H);
      if (!game) return;
      const p = game.player;
      const k = Math.max(0.75, Math.min(1.6, H / 600));
      this.k = k;
      this.drawSense(c, game, ui, k);
      this.drawWords(c, k);
      this.capTop = this.caption && !ui.hideHud ? this.drawCaption(c, W, H, k) : H - 58 * k;
      this.drawSays(c, game, k);
      if (ui.panels) ui.panels.drawCaptions(c, k);
      if (ui.scoped) this.drawScope(c, W, H);
      else if (p.alive && !ui.hideHud) this.drawCross(c, W, H, k);
      if (ui.hideHud) return;
      this.drawHealth(c, p, W, H, k);
      this.drawAmmo(c, p, W, H, k);
      this.drawHurts(c, W, H, k, game);
      this.drawNotes(c, W, H, k);
      this.drawMsgs(c, W, H, k);
      this.drawPickups(c, W, H, k);
      this.drawPrompt(c, game, ui, W, H, k);
      this.drawWeaponStrip(c, game, W, H, k);
      if (p.lock) this.drawBar(c, W / 2 - 110 * k, H * 0.62, 220 * k, 16 * k, p.lockT, 'ВЗЛОМ ЗАМКА');
      this.drawBoss(c, game, W, H, k);
      if (p.swim && p.air < 19.5) this.drawBar(c, W / 2 - 90 * k, H * 0.12, 180 * k, 12 * k, p.air / 20, 'ВОЗДУХ', '#6ac0e8');
      if (game.time - this.cpT < 2.5) {
        c.save(); c.globalAlpha = Math.min(1, (2.5 - (game.time - this.cpT)) * 2);
        caption(c, W - 250 * k, H - 150 * k, 230 * k, 'Контрольная точка', { size: 12 * k, bg: '#ffffff' });
        c.restore();
      }
      if (ui.showObjectives) this.drawObjectives(c, game, W, H, k);
    }

    drawCross(c, W, H, k) {
      const x = W / 2, y = H / 2;
      c.save();
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(x, y, 3 * k, 0, 7); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1;
      c.beginPath(); c.arc(x, y, 4.3 * k, 0, 7); c.stroke();
      c.restore();
    }
    drawScope(c, W, H) {
      const r = Math.min(W, H) * 0.44;
      c.save();
      c.fillStyle = '#050505';
      c.beginPath(); c.rect(0, 0, W, H); c.arc(W / 2, H / 2, r, 0, 7, true); c.fill();
      c.strokeStyle = '#000'; c.lineWidth = 3;
      c.beginPath(); c.arc(W / 2, H / 2, r, 0, 7); c.stroke();
      c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(W / 2 - r, H / 2); c.lineTo(W / 2 + r, H / 2); c.moveTo(W / 2, H / 2 - r); c.lineTo(W / 2, H / 2 + r); c.stroke();
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(W / 2 - r, H / 2); c.lineTo(W / 2 - r * 0.25, H / 2); c.moveTo(W / 2 + r * 0.25, H / 2); c.lineTo(W / 2 + r, H / 2); c.moveTo(W / 2, H / 2 + r * 0.25); c.lineTo(W / 2, H / 2 + r); c.stroke();
      c.restore();
    }
    pill(c, x, y, w, h) {
      c.save(); rr(c, x, y, w, h, h / 2); c.fillStyle = 'rgba(20,16,12,0.45)'; c.fill(); c.restore();
    }
    drawHealth(c, p, W, H, k) {
      const h = 30 * k, x = 22 * k, y = H - h - 20 * k;
      const w = 104 * k;
      this.pill(c, x, y, w, h);
      const low = p.health < 25;
      const blink = low && Math.sin(this.time * 8) > 0;
      c.save();
      const cx = x + 18 * k, cy = y + h / 2, s = 8 * k;
      c.fillStyle = blink ? '#e83a2a' : '#d6d2a8'; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 2;
      c.beginPath(); c.rect(cx - s * 0.36, cy - s, s * 0.72, s * 2); c.rect(cx - s, cy - s * 0.36, s * 2, s * 0.72); c.stroke(); c.fill();
      c.font = `${Math.round(20 * k)}px ${HUDF}`; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillText(String(Math.ceil(p.health)), x + 35 * k + 1, cy + 1);
      c.fillStyle = low ? '#ff6a50' : '#ece6c8'; c.fillText(String(Math.ceil(p.health)), x + 35 * k, cy);
      if (p.armor > 0) {
        const ax = x + w + 8 * k;
        this.pill(c, ax, y, 86 * k, h);
        const sx = ax + 16 * k;
        c.fillStyle = '#a8b8c8'; c.strokeStyle = 'rgba(0,0,0,0.6)';
        c.beginPath(); c.moveTo(sx - 8 * k, cy - 8 * k); c.lineTo(sx + 8 * k, cy - 8 * k); c.lineTo(sx + 7 * k, cy + 2 * k); c.lineTo(sx, cy + 9 * k); c.lineTo(sx - 7 * k, cy + 2 * k); c.closePath(); c.stroke(); c.fill();
        c.fillStyle = '#ece6c8'; c.fillText(String(Math.round(p.armor)), ax + 30 * k, cy);
      }
      let ix = x + 4 * k;
      const iy = y - 22 * k;
      c.font = `bold ${Math.round(12 * k)}px ${HUDF}`;
      if (p.medkits > 0) {
        this.pill(c, ix, iy, 50 * k, 18 * k);
        c.fillStyle = '#f0ece0'; c.fillRect(ix + 6 * k, iy + 4 * k, 14 * k, 10 * k);
        c.fillStyle = '#d02010'; c.fillRect(ix + 11.5 * k, iy + 5 * k, 3 * k, 8 * k); c.fillRect(ix + 8.5 * k, iy + 7.5 * k, 9 * k, 3 * k);
        c.fillStyle = '#ece6c8'; c.fillText('×' + p.medkits + '  H', ix + 23 * k, iy + 9 * k);
        ix += 56 * k;
      }
      const tags = [];
      if (p.gadgets.lockpick) tags.push('отмычка');
      if (p.gadgets.hook) tags.push('кошка');
      for (const key of p.keys) tags.push(key);
      if (tags.length) {
        const t = tags.join(' · ');
        const tw = c.measureText(t).width + 16 * k;
        this.pill(c, ix, iy, tw, 18 * k);
        c.fillStyle = '#d8d0b0'; c.fillText(t, ix + 8 * k, iy + 9 * k);
      }
      c.restore();
    }
    drawAmmo(c, p, W, H, k) {
      const wd = X.WEAPONS[p.weapon];
      if (!wd || p.weapon === 'fists') return;
      let text;
      if (p.weapon === 'object') text = (X.OBJECTS[p.object] || {}).name || '';
      else if (wd.kind === 'throw') text = String(p.res.knife || 0);
      else if (wd.kind === 'grenade') text = String(p.res.grenade || 0);
      else text = (p.clip[p.weapon] || 0) + ' | ' + (p.res[p.weapon] || 0);
      const h = 30 * k;
      c.save();
      c.font = `${Math.round(20 * k)}px ${HUDF}`;
      const tw = c.measureText(text).width;
      const w = tw + 48 * k, x = W - w - 22 * k, y = H - h - 20 * k;
      this.pill(c, x, y, w, h);
      const bx = x + 14 * k, by = y + h / 2;
      c.fillStyle = '#d6d2a8'; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(bx - 4 * k, by + 8 * k); c.lineTo(bx - 4 * k, by - 3 * k); c.quadraticCurveTo(bx, by - 12 * k, bx + 4 * k, by - 3 * k); c.lineTo(bx + 4 * k, by + 8 * k); c.closePath(); c.stroke(); c.fill();
      c.textBaseline = 'middle';
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillText(text, x + 30 * k + 1, by + 1);
      const empty = wd.clip && (p.clip[p.weapon] || 0) === 0;
      c.fillStyle = empty ? '#ff7050' : '#ece6c8'; c.fillText(text, x + 30 * k, by);
      if (p.reloadT > 0) { c.font = `bold ${Math.round(11 * k)}px ${HUDF}`; c.fillStyle = '#f0d060'; c.fillText('ПЕРЕЗАРЯДКА', x + 4 * k, y - 10 * k); }
      c.restore();
    }
    drawHurts(c, W, H, k, game) {
      const p = game.player;
      for (const h of this.hurts) {
        if (!h.dir) continue;
        const a = Math.atan2(h.dir[0], h.dir[2]);
        const rel = X.wrap(a - Math.atan2(-Math.sin(p.yaw), -Math.cos(p.yaw)) + Math.PI);
        const r = Math.min(W, H) * 0.3;
        const x = W / 2 + Math.sin(-rel) * r, y = H / 2 - Math.cos(rel) * r;
        c.save(); c.globalAlpha = 1 - h.t / h.life; c.translate(x, y); c.rotate(-rel);
        c.fillStyle = '#c01810'; c.strokeStyle = INK; c.lineWidth = 2;
        c.beginPath(); c.moveTo(-26 * k, 6 * k); c.lineTo(0, -16 * k); c.lineTo(26 * k, 6 * k); c.lineTo(0, -2 * k); c.closePath(); c.fill(); c.stroke();
        c.restore();
      }
    }
    drawNotes(c, W, H, k) {
      let y = 16 * k;
      for (const n of this.notes) {
        const a = Math.min(1, n.t * 4, (n.life - n.t) * 2);
        const slide = (1 - Math.min(1, n.t * 5)) * -300 * k;
        c.save(); c.globalAlpha = a;
        const head = n.kind === 'done' ? 'ЦЕЛЬ ВЫПОЛНЕНА' : n.kind === 'failed' ? 'ЦЕЛЬ ПРОВАЛЕНА' : n.kind === 'optional' ? 'ДОПОЛНИТЕЛЬНО' : n.kind === 'doc' ? 'НАЙДЕН ДОКУМЕНТ' : n.kind === 'memory' ? 'ВОСПОМИНАНИЕ' : 'НОВАЯ ЦЕЛЬ';
        const w = Math.min(W * 0.46, 380 * k);
        c.font = `bold ${Math.round(11 * k)}px ${COMIC}`;
        const hh = 18 * k;
        c.fillStyle = n.kind === 'failed' ? '#d23a2a' : '#1a1a1a'; c.fillRect(16 * k + slide, y, c.measureText(head).width + 16 * k, hh);
        c.fillStyle = n.kind === 'failed' ? '#ffffff' : '#f6e27a'; c.textBaseline = 'middle'; c.fillText(head, 24 * k + slide, y + hh / 2 + 1);
        const h2 = caption(c, 16 * k + slide, y + hh - 2, w, n.text, { size: 13 * k, bg: n.kind === 'done' ? '#d8f0c0' : '#f6e27a' });
        if (n.kind === 'done') { c.strokeStyle = 'rgba(20,80,20,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(24 * k + slide, y + hh + h2 / 2); c.lineTo(16 * k + w - 10 + slide, y + hh + h2 / 2 - 4); c.stroke(); }
        c.restore();
        y += hh + h2 + 8 * k;
      }
    }
    drawMsgs(c, W, H, k) {
      let y = H * 0.74;
      for (let i = this.msgs.length - 1; i >= 0; i--) {
        const m = this.msgs[i];
        const a = Math.min(1, m.t * 5, (m.life - m.t) * 2);
        c.save(); c.globalAlpha = a;
        c.font = `bold ${Math.round(13 * k)}px ${COMIC}`;
        const lines = wrap(c, m.text, W * 0.6);
        const w = Math.max(...lines.map(l => c.measureText(l).width)) + 24 * k, h = lines.length * 17 * k + 10 * k;
        const x = W / 2 - w / 2;
        c.fillStyle = 'rgba(255,255,255,0.93)'; c.strokeStyle = INK; c.lineWidth = 2;
        rr(c, x, y - h, w, h, 6 * k); c.fill(); c.stroke();
        c.fillStyle = INK; c.textBaseline = 'top'; c.textAlign = 'center';
        lines.forEach((l, j) => c.fillText(l, W / 2, y - h + 5 * k + j * 17 * k));
        c.restore();
        y -= h + 6 * k;
      }
    }
    drawPickups(c, W, H, k) {
      let y = H - 92 * k;
      c.save();
      c.font = `bold ${Math.round(12 * k)}px ${HUDF}`;
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const p = this.pickups[i];
        c.globalAlpha = Math.min(1, (p.life - p.t) * 2);
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillText('+ ' + p.text, 25 * k, y + 1);
        c.fillStyle = '#f4e8b0'; c.fillText('+ ' + p.text, 24 * k, y);
        y -= 16 * k;
      }
      c.restore();
    }
    drawPrompt(c, game, ui, W, H, k) {
      const t = ui.prompt;
      if (!t) return;
      c.save();
      c.font = `bold ${Math.round(13 * k)}px ${HUDF}`;
      c.textAlign = 'center';
      const w = c.measureText(t).width + 20 * k;
      this.pill(c, W / 2 - w / 2, H / 2 + 34 * k, w, 22 * k);
      c.fillStyle = '#f6eed0'; c.textBaseline = 'middle';
      c.fillText(t, W / 2, H / 2 + 45 * k);
      c.restore();
    }
    drawWeaponStrip(c, game, W, H, k) {
      const dt = game.time - this.wselT;
      if (dt > 1.6 || dt < 0) return;
      const list = game.ownedList();
      const p = game.player;
      c.save();
      c.globalAlpha = Math.min(1, (1.6 - dt) * 3);
      const bw = 64 * k, bh = 42 * k, gap = 6 * k;
      const total = list.length * (bw + gap);
      let x = W / 2 - total / 2;
      const y = H - bh - 70 * k;
      for (const w of list) {
        const cur = w === p.weapon;
        c.fillStyle = cur ? '#f6e27a' : 'rgba(246,240,220,0.85)'; c.strokeStyle = INK; c.lineWidth = cur ? 3 : 2;
        c.fillRect(x, y, bw, bh); c.strokeRect(x, y, bw, bh);
        X.drawWeaponIcon(c, w, x + bw / 2, y + bh / 2 - 3 * k, bw * 0.8, p.object);
        c.font = `bold ${Math.round(9 * k)}px ${HUDF}`; c.fillStyle = INK; c.textAlign = 'right'; c.textBaseline = 'bottom';
        c.fillText(String(X.WEAPONS[w].slot), x + bw - 3 * k, y + bh - 1);
        x += bw + gap;
      }
      const wd = X.WEAPONS[p.weapon];
      c.font = `bold ${Math.round(13 * k)}px ${COMIC}`; c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.lineWidth = 3; c.strokeStyle = INK; c.fillStyle = '#ffffff';
      const nm = p.weapon === 'object' ? ((X.OBJECTS[p.object] || {}).name || '') : wd.name;
      c.strokeText(nm, W / 2, y - 6 * k); c.fillText(nm, W / 2, y - 6 * k);
      c.restore();
    }
    drawBoss(c, game, W, H, k) {
      let best = null;
      for (const v of game.vehicles) if (v.boss && v.active && !v.dead) { best = { name: v.name || 'Вертолёт', v: v.hp / (v.maxHp || v.hp) }; break; }
      if (!best) {
        for (const ch of game.chars) {
          if (!ch.boss || ch.invuln || ch.state !== 'alive' || !ch.ai) continue;
          const engaged = ch.ai.alert === 2 && ch.ai.target === game.player && game.time - ch.ai.seeT < 6;
          if (!engaged && ch.health >= ch.maxHealth) continue;
          if (X.vdist(ch.pos, game.player.pos) > 60) continue;
          best = { name: ch.spawn.bossName || ch.def.name, v: ch.health / ch.maxHealth };
          break;
        }
      }
      if (!best) return;
      const w = Math.min(W * 0.4, 380 * k);
      this.drawBar(c, W / 2 - w / 2, H - 34 * k, w, 13 * k, best.v, best.name.toUpperCase(), '#c8281a');
    }
    drawBar(c, x, y, w, h, v, label, col) {
      c.save();
      c.fillStyle = '#ffffff'; c.strokeStyle = INK; c.lineWidth = 2;
      c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h);
      c.fillStyle = col || '#e8b020'; c.fillRect(x + 3, y + 3, (w - 6) * X.clamp(v, 0, 1), h - 6);
      c.font = `bold ${Math.round(h * 0.8)}px ${COMIC}`; c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText(label, x + w / 2, y - 2);
      c.restore();
    }
    drawCaption(c, W, H, k) {
      const cp = this.caption;
      const a = Math.min(1, cp.t * 4, (cp.life - cp.t) * 2);
      c.save(); c.globalAlpha = 0;
      const w = Math.min(W * 0.56, 520 * k);
      const h = caption(c, -9999, -9999, w, cp.text, { size: 14 * k });
      c.globalAlpha = a;
      const y = H - 58 * k - h;
      caption(c, W / 2 - w / 2, y, w, cp.text, { size: 14 * k, bg: cp.bg || '#f6e27a' });
      c.restore();
      return y;
    }
    drawWords(c, k) {
      for (const w of this.words) {
        const s = this.project(w.p);
        if (!s || s[2] > 90) continue;
        const life = w.t / w.life;
        const pop = Math.min(1, w.t * 9);
        const dist = Math.max(3, s[2]);
        let size = (w.style === 'explode' ? 110 : w.style === 'scream' ? 70 : w.style === 'steps' ? 22 : w.style === 'alert' || w.style === 'question' ? 44 : 38) * k * Math.min(1.6, 9 / dist + 0.35) * (0.7 + 0.3 * pop);
        if (w.style === 'steps') size = Math.max(14 * k, size);
        const alpha = Math.min(1, (1 - life) * 2.5) * (w.style === 'steps' ? 0.85 : 1);
        onomatopoeia(c, w.text, s[0], s[1] - w.t * 18 * k, size, w.style, alpha, w.seed, w.t);
      }
    }
    drawSense(c, game, ui, k) {
      if (!ui.opts.sense || !game.player.skills.includes('sense')) return;
      const eye = game.eyePos();
      for (const ch of game.chars) {
        if (ch.state !== 'alive' || ch.team === 'ally' || ch.team === 'neutral') continue;
        if (!ch.lastStep || game.time - ch.lastStep > 0.05) continue;
        const d = X.vdist(ch.pos, game.player.pos);
        if (d > 22 || d < 2) continue;
        const key = ch.id;
        if (this.sense[key] && game.time - this.sense[key] < 0.33) continue;
        const vis = game.world.visible(eye, [ch.pos[0], ch.pos[1] + 1.2, ch.pos[2]]);
        if (vis) continue;
        this.sense[key] = game.time;
        this.word('TAP', [ch.pos[0] + (Math.random() - 0.5) * 0.4, ch.pos[1] + 0.25, ch.pos[2] + (Math.random() - 0.5) * 0.4], 'steps');
      }
    }
    drawSays(c, game, k) {
      const eye = game.eyePos();
      let sub = (this.capTop || this.H - 58 * k) - 8 * k;
      for (const s of this.says) {
        const ch = game.char(s.id);
        const a = Math.min(1, s.t * 6, (s.life - s.t) * 3);
        let placed = false;
        if (ch && ch.state !== 'hidden' && !s.radio) {
          const head = ch.headWorld || [ch.pos[0], ch.pos[1] + 1.65, ch.pos[2]];
          const d = X.vdist(head, eye);
          if (d < 32 && game.world.visible(eye, head)) {
            const sp = this.project([head[0], head[1] + 0.35, head[2]]);
            if (sp && sp[0] > 0 && sp[0] < this.W && sp[1] > 0 && sp[1] < this.H) {
              c.save(); c.globalAlpha = a;
              c.font = `bold ${Math.round(12 * k)}px ${COMIC}`;
              const lines = wrap(c, s.text.toUpperCase(), 190 * k);
              const w = Math.max(...lines.map(l => c.measureText(l).width)) + 16 * k, h = lines.length * 15 * k + 8 * k;
              const x = X.clamp(sp[0] - w / 2, 6, this.W - w - 6), y = Math.max(6, sp[1] - h - 34 * k);
              balloon(c, x, y, w, h, sp[0], sp[1] - 4 * k, 'speech');
              c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'top';
              lines.forEach((l, i) => c.fillText(l, x + w / 2, y + 4 * k + i * 15 * k));
              c.restore();
              placed = true;
            }
          }
        }
        if (!placed) {
          c.save(); c.globalAlpha = a;
          const name = ch ? (ch.def.name || '') : (s.id === 'radio' ? 'Рация' : (X.CHARS[s.id] ? X.CHARS[s.id].name : s.id));
          c.font = `bold ${Math.round(13 * k)}px ${COMIC}`;
          const text = (name ? name.toUpperCase() + ': ' : '') + s.text;
          const lines = wrap(c, text, this.W * 0.6);
          const w = Math.max(...lines.map(l => c.measureText(l).width)) + 22 * k, h = lines.length * 17 * k + 10 * k;
          const x = this.W / 2 - w / 2;
          c.fillStyle = s.radio ? '#e8f4ff' : '#ffffff'; c.strokeStyle = INK; c.lineWidth = 2;
          c.fillRect(x, sub - h, w, h); c.strokeRect(x, sub - h, w, h);
          if (s.radio) { c.fillStyle = INK; c.fillRect(x - 12 * k, sub - h, 10 * k, h); }
          c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'top';
          lines.forEach((l, i) => c.fillText(l, this.W / 2, sub - h + 5 * k + i * 17 * k));
          c.restore();
          sub -= h + 6 * k;
        }
      }
    }
    drawObjectives(c, game, W, H, k) {
      const w = Math.min(W * 0.7, 560 * k), h = Math.min(H * 0.8, 520 * k);
      const x = W / 2 - w / 2, y = H / 2 - h / 2;
      c.save();
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#f2ead4'; c.strokeStyle = INK; c.lineWidth = 4;
      c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h);
      c.fillStyle = '#c82818'; c.font = `${Math.round(30 * k)}px Impact, "Arial Black", sans-serif`; c.textBaseline = 'top';
      c.fillText(game.def.name.toUpperCase(), x + 18 * k, y + 14 * k);
      c.fillStyle = INK; c.font = `bold ${Math.round(12 * k)}px ${COMIC}`;
      c.fillText((game.def.sub || '') + ' · ' + X.fmtTime(game.stats.time), x + 20 * k, y + 50 * k);
      let yy = y + 78 * k;
      c.font = `bold ${Math.round(14 * k)}px ${COMIC}`;
      for (const o of game.objectives) {
        const mark = o.done ? '✔' : o.failed ? '✘' : '□';
        c.fillStyle = o.done ? '#2a6a2a' : o.failed ? '#a02010' : INK;
        const lines = wrap(c, mark + ' ' + o.text + (o.optional ? ' (доп.)' : ''), w - 50 * k);
        for (const l of lines) { c.fillText(l, x + 24 * k, yy); yy += 19 * k; }
        if (o.done) { c.strokeStyle = 'rgba(30,90,30,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 40 * k, yy - 10 * k); c.lineTo(x + 40 * k + Math.min(w - 80 * k, c.measureText(o.text).width), yy - 10 * k); c.stroke(); }
        yy += 6 * k;
      }
      yy += 8 * k;
      c.fillStyle = INK; c.font = `bold ${Math.round(12 * k)}px ${COMIC}`;
      const st = game.stats;
      const pl = game.player;
      const lines = [
        'Документы: ' + st.secrets + ' / ' + st.secretsTotal,
        'Убито: ' + st.kills + '   Выстрелов в голову: ' + st.headshots + '   Оглушено: ' + st.ko,
        'Навыки: ' + pl.skills.map(s => (X.SKILLS[s] || {}).name).filter(Boolean).join(', ')
      ];
      for (const l of lines) { for (const ll of wrap(c, l, w - 50 * k)) { c.fillText(ll, x + 24 * k, yy); yy += 17 * k; } }
      c.font = `${Math.round(11 * k)}px ${COMIC}`; c.fillStyle = '#5a4a3a';
      c.fillText('[Tab] — закрыть', x + 24 * k, y + h - 24 * k);
      c.restore();
    }
  }
  X.HUD = HUD;

  X.drawWeaponIcon = function (c, w, cx, cy, size, obj) {
    c.save();
    c.translate(cx, cy);
    const s = size / 60;
    c.scale(s, s);
    c.fillStyle = '#2a2622'; c.strokeStyle = '#2a2622'; c.lineWidth = 2;
    const R = (x, y, ww, hh) => c.fillRect(x, y, ww, hh);
    switch (w) {
      case 'fists': c.beginPath(); c.arc(-4, 0, 11, 0, 7); c.fill(); R(-14, -6, 20, 14); c.fillStyle = '#f6f0dc'; for (let i = 0; i < 3; i++) R(-10 + i * 6, -8, 1.5, 7); break;
      case 'object': c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(((X.OBJECTS[obj] || {}).name || '?').slice(0, 8), 0, 0); break;
      case 'knife': c.beginPath(); c.moveTo(-24, 2); c.lineTo(10, -3); c.lineTo(10, 4); c.closePath(); c.fill(); R(10, -4, 14, 9); break;
      case 'beretta': case 'silenced': R(-14, -8, 28, 7); R(8, -2, 7, 12); if (w === 'silenced') R(-30, -7, 17, 5); break;
      case 'magnum': R(-22, -7, 30, 5); c.beginPath(); c.arc(4, -4, 6, 0, 7); c.fill(); R(8, -2, 8, 13); break;
      case 'shotgun': R(-28, -6, 44, 5); R(-18, -1, 16, 4); R(10, -5, 18, 9); break;
      case 'm16': case 'kalash': R(-28, -6, 30, 5); R(0, -8, 16, 8); R(4, 0, 5, 10); R(14, -6, 14, 8); if (w === 'kalash') { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-2, 10, -6, 12); c.lineTo(-10, 10); c.lineTo(-4, 0); c.fill(); } break;
      case 'sniper': R(-30, -4, 44, 4); R(-8, -11, 18, 5); R(8, -4, 20, 8); break;
      case 'crossbow': R(-20, -3, 44, 5); R(-18, -13, 4, 26); break;
      case 'harpoon': R(-30, -2, 50, 4); R(10, -5, 12, 8); c.beginPath(); c.moveTo(-34, 0); c.lineTo(-28, -5); c.lineTo(-28, 5); c.fill(); break;
      case 'm60': R(-30, -6, 34, 6); R(4, -9, 18, 10); R(22, -5, 10, 8); R(-6, 0, 3, 9); break;
      case 'bazooka': R(-30, -6, 60, 10); R(-2, 4, 6, 8); break;
      case 'grenade': c.beginPath(); c.ellipse(0, 3, 9, 11, 0, 0, 7); c.fill(); R(-3, -12, 7, 5); break;
    }
    c.restore();
  };
})(globalThis.XIII = globalThis.XIII || {});
