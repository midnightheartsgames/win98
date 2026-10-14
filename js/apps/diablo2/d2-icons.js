(function (D) {
  'use strict';
  const { BASES } = D;
  const TAU = Math.PI * 2;
  const mk = (w, h) => D.Terrain.mk(w, h);

  function metal(c, x0, y0, x1, y1, col) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, D.shade(col, 0.55));
    g.addColorStop(0.45, col);
    g.addColorStop(0.55, D.shade(col, -0.35));
    g.addColorStop(1, D.shade(col, 0.15));
    return g;
  }

  function wood(c, x0, x1, col) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, D.shade(col, -0.4)); g.addColorStop(0.4, D.shade(col, 0.2)); g.addColorStop(1, D.shade(col, -0.5));
    return g;
  }

  function path(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }

  function outline(c, col) { c.strokeStyle = col || 'rgba(0,0,0,0.7)'; c.lineWidth = 1; c.stroke(); }

  function metalCol(it, b) {
    if (it.q === 'unique' || it.q === 'runeword') return '#d8c080';
    if (it.q === 'set') return '#a8d898';
    if (b.tier === 2) return '#a0a8d8';
    if (b.tier === 1) return '#a8a8b0';
    return '#c8ccd4';
  }

  function hashc(s, n) { return D.strHash(s) % n; }

  const DRAW = {
    sword(c, w, h, it, b) {
      const cx = w / 2, mc = metalCol(it, b);
      const bw = Math.max(3, w * (b.hands === 2 ? 0.2 : 0.16));
      path(c, [[cx, 3], [cx + bw / 2, 9], [cx + bw / 2, h * 0.68], [cx - bw / 2, h * 0.68], [cx - bw / 2, 9]]);
      c.fillStyle = metal(c, cx - bw / 2, 0, cx + bw / 2, 0, mc); c.fill(); outline(c);
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(cx - 0.5, 10, 1, h * 0.55);
      c.fillStyle = b.tier ? '#b09040' : '#8a6a30'; c.fillRect(cx - w * 0.32, h * 0.68, w * 0.64, 4); outline(c);
      c.fillStyle = '#4a3020'; c.fillRect(cx - 2, h * 0.68 + 4, 4, h * 0.2);
      c.fillStyle = '#b09040'; c.beginPath(); c.arc(cx, h * 0.92, 3, 0, TAU); c.fill();
    },
    dagger(c, w, h, it, b) { DRAW.sword(c, w, h, it, b); },
    axe(c, w, h, it, b) {
      const cx = w / 2;
      c.fillStyle = wood(c, cx - 2, cx + 2, '#6a4a2a'); c.fillRect(cx - 2, h * 0.12, 4, h * 0.85);
      const mc = metalCol(it, b);
      path(c, [[cx + 2, h * 0.12], [cx + w * 0.42, h * 0.04], [cx + w * 0.46, h * 0.38], [cx + 2, h * 0.3]]);
      c.fillStyle = metal(c, cx, 0, cx + w * 0.46, h * 0.3, mc); c.fill(); outline(c);
      if (b.hands === 2 || b.id === 'double_axe' || b.id === 'battle_axe') { path(c, [[cx - 2, h * 0.12], [cx - w * 0.42, h * 0.04], [cx - w * 0.46, h * 0.38], [cx - 2, h * 0.3]]); c.fillStyle = metal(c, cx, 0, cx - w * 0.46, h * 0.3, mc); c.fill(); outline(c); }
    },
    mace(c, w, h, it, b) {
      const cx = w / 2;
      c.fillStyle = wood(c, cx - 2, cx + 2, '#5a4a3a'); c.fillRect(cx - 2, h * 0.25, 4, h * 0.72);
      const g = c.createRadialGradient(cx - 3, h * 0.14, 1, cx, h * 0.18, w * 0.3);
      g.addColorStop(0, '#e0e0e8'); g.addColorStop(1, '#4a4a52');
      c.fillStyle = g; c.beginPath(); c.arc(cx, h * 0.18, w * 0.28, 0, TAU); c.fill(); outline(c);
      if (b.type === 'mace') for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.fillStyle = '#9a9aa2'; c.fillRect(cx + Math.cos(a) * w * 0.3 - 1.5, h * 0.18 + Math.sin(a) * w * 0.3 - 1.5, 3, 3); }
      if (b.type === 'scepter') { c.fillStyle = '#e0c060'; c.beginPath(); c.arc(cx, h * 0.18, w * 0.18, 0, TAU); c.fill(); c.fillStyle = '#c02040'; c.beginPath(); c.arc(cx, h * 0.18, w * 0.08, 0, TAU); c.fill(); }
    },
    scepter(c, w, h, it, b) { DRAW.mace(c, w, h, it, b); },
    club(c, w, h, it, b) {
      const cx = w / 2;
      path(c, [[cx - 2, h * 0.97], [cx + 2, h * 0.97], [cx + w * 0.22, h * 0.08], [cx - w * 0.22, h * 0.08]]);
      c.fillStyle = wood(c, cx - w * 0.22, cx + w * 0.22, '#7a5a34'); c.fill(); outline(c);
      if (b.id !== 'club') for (let i = 0; i < 6; i++) { c.fillStyle = '#b0b0b8'; c.fillRect(cx + (i % 2 ? w * 0.18 : -w * 0.24), h * (0.12 + i * 0.07), 4, 2); }
    },
    hammer(c, w, h, it, b) {
      const cx = w / 2;
      c.fillStyle = wood(c, cx - 2, cx + 2, '#5a4030'); c.fillRect(cx - 2, h * 0.15, 4, h * 0.82);
      c.fillStyle = metal(c, 0, h * 0.05, 0, h * 0.28, metalCol(it, b)); c.fillRect(cx - w * 0.38, h * 0.06, w * 0.76, h * 0.2); c.strokeStyle = 'rgba(0,0,0,0.7)'; c.strokeRect(cx - w * 0.38, h * 0.06, w * 0.76, h * 0.2);
    },
    spear(c, w, h, it, b) {
      const cx = w / 2;
      c.fillStyle = wood(c, cx - 1.5, cx + 1.5, '#7a5a34'); c.fillRect(cx - 1.5, h * 0.14, 3, h * 0.84);
      path(c, [[cx, 2], [cx + 4, h * 0.1], [cx + 2, h * 0.16], [cx - 2, h * 0.16], [cx - 4, h * 0.1]]);
      c.fillStyle = metal(c, cx - 4, 0, cx + 4, 0, metalCol(it, b)); c.fill(); outline(c);
      if (b.id === 'trident') { c.fillStyle = metalCol(it, b); c.fillRect(cx - 6, h * 0.06, 2, h * 0.1); c.fillRect(cx + 4, h * 0.06, 2, h * 0.1); }
    },
    javelin(c, w, h, it, b) { DRAW.spear(c, w, h, it, b); c.fillStyle = '#a02020'; c.fillRect(w / 2 - 2, h * 0.75, 4, 3); },
    polearm(c, w, h, it, b) {
      const cx = w * 0.4;
      c.fillStyle = wood(c, cx - 1.5, cx + 1.5, '#6a4a2a'); c.fillRect(cx - 1.5, h * 0.05, 3, h * 0.93);
      path(c, [[cx + 1.5, h * 0.06], [cx + w * 0.55, h * 0.02], [cx + w * 0.5, h * 0.24], [cx + 1.5, h * 0.2]]);
      c.fillStyle = metal(c, cx, 0, cx + w * 0.5, h * 0.2, metalCol(it, b)); c.fill(); outline(c);
    },
    staff(c, w, h, it, b) {
      const cx = w / 2;
      c.save(); c.translate(cx, 0);
      path(c, [[-2, h * 0.98], [2, h * 0.98], [3, h * 0.12], [-3, h * 0.12]]);
      c.fillStyle = wood(c, -3, 3, '#6a4a28'); c.fill(); outline(c);
      c.fillStyle = '#4a3018'; for (let i = 0; i < 3; i++) c.fillRect(-3, h * (0.3 + i * 0.2), 6, 2);
      c.restore();
      const gc = it.q === 'magic' ? '#6080ff' : it.q === 'rare' ? '#ffd040' : it.q === 'unique' ? '#ff8030' : '#a08060';
      const g = c.createRadialGradient(cx - 2, h * 0.07, 1, cx, h * 0.08, 7); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, gc); g.addColorStop(1, D.shade(gc, -0.6));
      c.fillStyle = g; c.beginPath(); c.arc(cx, h * 0.08, 6, 0, TAU); c.fill();
    },
    wand(c, w, h, it, b) {
      const cx = w / 2;
      const bone = b.id === 'bone_wand' || b.id === 'grim_wand' || b.id === 'lich_wand';
      path(c, [[cx - 1.5, h * 0.95], [cx + 1.5, h * 0.95], [cx + 2.5, h * 0.3], [cx - 2.5, h * 0.3]]);
      c.fillStyle = bone ? '#d8d0b8' : wood(c, cx - 3, cx + 3, '#7a5a34'); c.fill(); outline(c);
      if (bone) { c.fillStyle = '#e8e0c8'; c.beginPath(); c.arc(cx, h * 0.2, w * 0.3, 0, TAU); c.fill(); outline(c); c.fillStyle = '#1a1010'; c.fillRect(cx - 4, h * 0.18, 3, 3); c.fillRect(cx + 1, h * 0.18, 3, 3); }
      else { const g = c.createRadialGradient(cx, h * 0.2, 1, cx, h * 0.2, 6); g.addColorStop(0, '#fff'); g.addColorStop(0.5, '#60a0ff'); g.addColorStop(1, 'rgba(0,0,80,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, h * 0.2, 6, 0, TAU); c.fill(); }
    },
    claw(c, w, h, it, b) {
      const cx = w / 2;
      c.fillStyle = '#4a3020'; c.fillRect(cx - w * 0.3, h * 0.7, 3, h * 0.25); c.fillRect(cx + w * 0.3 - 3, h * 0.7, 3, h * 0.25); c.fillRect(cx - w * 0.3, h * 0.8, w * 0.6, 3);
      const mc = metalCol(it, b);
      const n = b.id === 'katar' || b.id === 'wrist_blade' ? 1 : 3;
      for (let i = 0; i < n; i++) {
        const ox = n === 1 ? 0 : (i - 1) * w * 0.18;
        path(c, [[cx + ox, 4], [cx + ox + 3, h * 0.18], [cx + ox + 3, h * 0.72], [cx + ox - 3, h * 0.72], [cx + ox - 3, h * 0.18]]);
        c.fillStyle = metal(c, cx + ox - 3, 0, cx + ox + 3, 0, mc); c.fill(); outline(c);
      }
    },
    orb(c, w, h, it) {
      const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.36;
      const col = it.q === 'unique' ? '#ff9040' : it.q === 'magic' ? '#6070ff' : it.q === 'rare' ? '#ffd040' : '#80c0ff';
      const g = c.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 1, cx, cy, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, col); g.addColorStop(1, D.shade(col, -0.7));
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); outline(c);
      c.strokeStyle = '#c0a040'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, r, 0.3, 1.2); c.stroke(); c.beginPath(); c.arc(cx, cy, r, 3.4, 4.3); c.stroke();
    },
    bow(c, w, h, it, b) {
      const cx = w * 0.42;
      c.strokeStyle = '#3a2410'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(cx + 2, 3); c.quadraticCurveTo(cx - w * 0.55, h / 2, cx + 2, h - 3); c.stroke();
      c.strokeStyle = b.tier ? '#9a7a40' : '#8a6a3a'; c.lineWidth = 3; c.stroke();
      c.strokeStyle = '#e0e0d0'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx + 2, 4); c.lineTo(cx + 2, h - 4); c.stroke();
      c.fillStyle = '#5a3a1a'; c.fillRect(cx - w * 0.2, h / 2 - 6, 5, 12);
    },
    xbow(c, w, h, it, b) {
      const cx = w / 2;
      c.fillStyle = wood(c, cx - 3, cx + 3, '#6a4a2a'); c.fillRect(cx - 3, h * 0.12, 6, h * 0.84);
      c.strokeStyle = '#8a8a90'; c.lineWidth = 3; c.beginPath(); c.moveTo(4, h * 0.3); c.quadraticCurveTo(cx, h * 0.12, w - 4, h * 0.3); c.stroke();
      c.strokeStyle = '#e0e0d0'; c.lineWidth = 1; c.beginPath(); c.moveTo(4, h * 0.3); c.lineTo(cx, h * 0.42); c.lineTo(w - 4, h * 0.3); c.stroke();
    },
    body(c, w, h, it, b) {
      const def = b.def[1];
      const col = it.q === 'unique' ? '#b09a60' : def < 26 ? '#7a5634' : def < 90 ? '#8a8a92' : '#b4b4bc';
      const pts = [[w * 0.22, 4], [w * 0.4, 8], [w * 0.6, 8], [w * 0.78, 4], [w - 3, h * 0.2], [w * 0.82, h * 0.42], [w * 0.8, h - 3], [w * 0.2, h - 3], [w * 0.18, h * 0.42], [3, h * 0.2]];
      path(c, pts);
      const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, D.shade(col, 0.35)); g.addColorStop(0.5, col); g.addColorStop(1, D.shade(col, -0.5));
      c.fillStyle = g; c.fill(); outline(c);
      if (def >= 26 && def < 90) { c.strokeStyle = 'rgba(0,0,0,0.25)'; for (let y = 10; y < h - 4; y += 3) { c.beginPath(); c.moveTo(w * 0.22, y); c.lineTo(w * 0.78, y); c.stroke(); } }
      if (def >= 90) { c.strokeStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.moveTo(w / 2, 10); c.lineTo(w / 2, h - 5); c.stroke(); for (const yy of [h * 0.45, h * 0.65]) { c.beginPath(); c.moveTo(w * 0.2, yy); c.lineTo(w * 0.8, yy); c.stroke(); } c.fillStyle = D.shade(col, 0.3); c.beginPath(); c.arc(w * 0.18, h * 0.16, 6, 0, TAU); c.arc(w * 0.82, h * 0.16, 6, 0, TAU); c.fill(); }
      if (def < 26) { c.fillStyle = '#3a2410'; for (let y = 14; y < h - 6; y += 8) c.fillRect(w / 2 - 1, y, 2, 3); }
    },
    helm(c, w, h, it, b) {
      const look = D.Models.HELM_LOOK[b.id] || { type: 'helm', col: '#8a8a92' };
      const cx = w / 2, cy = h * 0.55;
      const col = look.col || '#8a8a92';
      if (look.type === 'crown' || look.type === 'circlet') {
        c.fillStyle = look.type === 'crown' ? metal(c, 0, cy - 6, 0, cy + 6, '#d8b040') : metal(c, 0, cy - 3, 0, cy + 3, '#c0c0d0');
        c.fillRect(4, cy, w - 8, look.type === 'crown' ? 9 : 5);
        if (look.type === 'crown') for (let i = 0; i < 5; i++) { path(c, [[6 + i * (w - 12) / 4 - 3, cy], [6 + i * (w - 12) / 4, cy - 14], [6 + i * (w - 12) / 4 + 3, cy]]); c.fill(); }
        c.fillStyle = look.gem || '#c02040'; c.beginPath(); c.arc(cx, cy + 3, 3, 0, TAU); c.fill();
        return;
      }
      if (look.type === 'mask') { c.fillStyle = metal(c, 0, 4, w, h, col); c.beginPath(); c.ellipse(cx, cy, w * 0.36, h * 0.42, 0, 0, TAU); c.fill(); outline(c); c.fillStyle = '#100808'; c.fillRect(cx - 9, cy - 5, 6, 4); c.fillRect(cx + 3, cy - 5, 6, 4); c.fillRect(cx - 3, cy + 7, 6, 2); return; }
      if (look.type === 'bone') { c.fillStyle = '#e0d8c0'; c.beginPath(); c.ellipse(cx, cy, w * 0.36, h * 0.4, 0, 0, TAU); c.fill(); outline(c); c.fillStyle = '#1a1010'; c.beginPath(); c.arc(cx - 6, cy, 4, 0, TAU); c.arc(cx + 6, cy, 4, 0, TAU); c.fill(); for (let i = -1; i <= 1; i++) { path(c, [[cx + i * 8 - 2, cy - h * 0.3], [cx + i * 9, cy - h * 0.48], [cx + i * 8 + 2, cy - h * 0.3]]); c.fillStyle = '#e8e0c8'; c.fill(); } return; }
      c.fillStyle = metal(c, cx - w * 0.4, 0, cx + w * 0.4, h, col);
      c.beginPath(); c.arc(cx, cy, w * 0.36, Math.PI, TAU);
      if (look.type === 'cap') { c.lineTo(cx + w * 0.4, cy + 3); c.lineTo(cx - w * 0.4, cy + 3); }
      else { c.lineTo(cx + w * 0.36, cy + h * 0.3); c.lineTo(cx - w * 0.36, cy + h * 0.3); }
      c.closePath(); c.fill(); outline(c);
      if (look.type === 'great' || look.type === 'full') { c.fillStyle = '#100808'; c.fillRect(cx - w * 0.28, cy + 1, w * 0.56, 3); if (look.type === 'great') c.fillRect(cx - 1, cy + 4, 2, h * 0.2); }
      if (look.type === 'helm') { c.fillStyle = D.shade(col, -0.3); c.fillRect(cx - 1.5, cy - 2, 3, h * 0.28); }
      if (look.wings) { c.fillStyle = '#e8e8f0'; for (const s of [-1, 1]) { path(c, [[cx + s * w * 0.3, cy - 4], [cx + s * w * 0.48, cy - h * 0.42], [cx + s * w * 0.4, cy + 2]]); c.fill(); } }
      if (look.horns) { c.fillStyle = '#d8d0b0'; for (const s of [-1, 1]) { path(c, [[cx + s * w * 0.28, cy - 6], [cx + s * w * 0.48, cy - h * 0.45], [cx + s * w * 0.36, cy - 2]]); c.fill(); } }
    },
    circlet(c, w, h, it, b) { DRAW.helm(c, w, h, it, b); },
    shield(c, w, h, it, b) {
      const look = { type: 'round', col: '#7a5a3a', rim: '#a09070' };
      Object.assign(look, D.Models ? shieldType(b) : {});
      const cx = w / 2, cy = h / 2;
      const col = it.q === 'unique' ? '#8a6a30' : look.col;
      c.beginPath();
      if (look.type === 'kite') { c.moveTo(cx, 3); c.quadraticCurveTo(w - 3, 3, w - 4, h * 0.35); c.lineTo(cx, h - 3); c.lineTo(4, h * 0.35); c.quadraticCurveTo(3, 3, cx, 3); }
      else if (look.type === 'tower') { c.rect(4, 3, w - 8, h - 6); }
      else c.arc(cx, cy, Math.min(w, h) / 2 - 3, 0, TAU);
      const g = c.createRadialGradient(cx - w * 0.2, cy - h * 0.2, 2, cx, cy, Math.max(w, h) * 0.6);
      g.addColorStop(0, D.shade(col, 0.4)); g.addColorStop(0.6, col); g.addColorStop(1, D.shade(col, -0.6));
      c.fillStyle = g; c.fill();
      c.strokeStyle = look.rim; c.lineWidth = 2.5; c.stroke();
      if (look.type !== 'tower') { const gg = c.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, 6); gg.addColorStop(0, '#fff'); gg.addColorStop(1, look.rim); c.fillStyle = gg; c.beginPath(); c.arc(cx, cy, 5, 0, TAU); c.fill(); }
      else { c.fillStyle = '#c0a040'; c.fillRect(cx - 2, 8, 4, h - 16); c.fillRect(8, cy - 2, w - 16, 4); }
      if (b.id === 'spiked_shield') for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.fillStyle = '#d0d0d8'; c.fillRect(cx + Math.cos(a) * w * 0.3 - 1.5, cy + Math.sin(a) * h * 0.3 - 1.5, 3, 3); }
    },
    gloves(c, w, h, it, b) {
      const col = b.def[1] < 10 ? '#7a5634' : b.def[1] < 30 ? '#8a8a92' : '#b0b0b8';
      for (const s of [0, 1]) {
        const ox = s ? w * 0.52 : w * 0.04;
        path(c, [[ox + 2, h * 0.95], [ox + w * 0.4, h * 0.95], [ox + w * 0.42, h * 0.45], [ox + w * 0.36, h * 0.12], [ox + w * 0.24, h * 0.1], [ox + w * 0.2, h * 0.3], [ox + w * 0.08, h * 0.2], [ox + 2, h * 0.4]]);
        c.fillStyle = metal(c, ox, 0, ox + w * 0.45, 0, col); c.fill(); outline(c);
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(ox + 2, h * 0.7, w * 0.4, 3);
      }
    },
    boots(c, w, h, it, b) {
      const col = b.def[1] < 10 ? '#6a4a2a' : b.def[1] < 30 ? '#7a7a82' : '#a8a8b0';
      for (const s of [0, 1]) {
        const ox = s ? w * 0.5 : w * 0.02;
        path(c, [[ox + w * 0.08, 3], [ox + w * 0.34, 3], [ox + w * 0.34, h * 0.6], [ox + w * 0.46, h * 0.72], [ox + w * 0.46, h * 0.95], [ox + w * 0.04, h * 0.95], [ox + w * 0.06, h * 0.6]]);
        c.fillStyle = metal(c, ox, 0, ox + w * 0.46, 0, col); c.fill(); outline(c);
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(ox + w * 0.06, h * 0.25, w * 0.28, 2);
      }
    },
    belt(c, w, h, it, b) {
      const col = b.rows > 3 ? '#6a5030' : '#7a5a3a';
      c.fillStyle = wood(c, 0, w, col);
      c.fillRect(2, h * 0.25, w - 4, h * 0.5); c.strokeStyle = 'rgba(0,0,0,0.6)'; c.strokeRect(2, h * 0.25, w - 4, h * 0.5);
      c.fillStyle = metal(c, w / 2 - 6, 0, w / 2 + 6, 0, '#c0a040'); c.fillRect(w / 2 - 6, h * 0.18, 12, h * 0.64); c.strokeRect(w / 2 - 6, h * 0.18, 12, h * 0.64);
      if (b.rows > 3) for (let i = 0; i < 5; i++) { c.fillStyle = '#b0b0b8'; c.fillRect(6 + i * (w - 12) / 5, h * 0.42, 3, 3); }
    },
    ring(c, w, h, it) {
      const cx = w / 2, cy = h / 2 + 2;
      const gold = hashc(String(it.uid || it.base), 2) === 0;
      c.strokeStyle = gold ? '#d8b040' : '#c0c0cc'; c.lineWidth = 3.5;
      c.beginPath(); c.ellipse(cx, cy, w * 0.28, h * 0.22, 0, 0, TAU); c.stroke();
      c.strokeStyle = gold ? '#8a6010' : '#6a6a74'; c.lineWidth = 1; c.stroke();
      const gc = ['#ff3040', '#40a0ff', '#40ff80', '#ffe040', '#c060ff', '#ffffff'][hashc(String(it.uid || 0) + 'g', 6)];
      const g = c.createRadialGradient(cx - 1, cy - h * 0.24, 0, cx, cy - h * 0.22, 4); g.addColorStop(0, '#fff'); g.addColorStop(0.5, gc); g.addColorStop(1, D.shade(gc, -0.6));
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy - h * 0.22, 4, 0, TAU); c.fill();
    },
    amulet(c, w, h, it) {
      const cx = w / 2;
      c.strokeStyle = '#b09040'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(4, 4); c.quadraticCurveTo(cx, h * 0.7, w - 4, 4); c.stroke();
      const gc = ['#ff3040', '#40a0ff', '#40ff80', '#ffe040', '#c060ff'][hashc(String(it.uid || 0) + 'a', 5)];
      c.fillStyle = metal(c, cx - 7, 0, cx + 7, 0, '#d8b040'); c.beginPath(); c.moveTo(cx, h * 0.45); c.lineTo(cx + 7, h * 0.65); c.lineTo(cx, h * 0.95); c.lineTo(cx - 7, h * 0.65); c.closePath(); c.fill(); outline(c);
      const g = c.createRadialGradient(cx - 1, h * 0.64, 0, cx, h * 0.66, 4); g.addColorStop(0, '#fff'); g.addColorStop(0.5, gc); g.addColorStop(1, D.shade(gc, -0.6));
      c.fillStyle = g; c.beginPath(); c.arc(cx, h * 0.67, 3.5, 0, TAU); c.fill();
    },
    charm(c, w, h, it) {
      const gc = ['#a06030', '#6080a0', '#80a060', '#a08040', '#8060a0'][hashc(String(it.uid || 0) + 'c', 5)];
      path(c, [[w / 2, 3], [w - 4, h * 0.3], [w - 5, h - 4], [5, h - 4], [4, h * 0.3]]);
      c.fillStyle = metal(c, 0, 0, w, h, gc); c.fill(); outline(c);
      c.strokeStyle = 'rgba(255,255,220,0.5)'; c.beginPath(); c.arc(w / 2, h * 0.55, Math.min(w, h) * 0.2, 0, TAU); c.stroke();
    },
    hpot(c, w, h, it, b) { potion(c, w, h, '#d01818', b); },
    mpot(c, w, h, it, b) { potion(c, w, h, '#2040e0', b); },
    rpot(c, w, h, it, b) { potion(c, w, h, '#a020c0', b); },
    scroll(c, w, h, it, b) {
      c.fillStyle = '#d8c8a0'; c.fillRect(4, h * 0.3, w - 8, h * 0.4); c.strokeStyle = '#6a5a3a'; c.strokeRect(4, h * 0.3, w - 8, h * 0.4);
      c.fillStyle = '#b0a080'; c.beginPath(); c.ellipse(4, h / 2, 3, h * 0.22, 0, 0, TAU); c.ellipse(w - 4, h / 2, 3, h * 0.22, 0, 0, TAU); c.fill();
      c.fillStyle = b.spell === 'tp' ? '#2040c0' : '#c02020'; c.beginPath(); c.arc(w / 2, h / 2, 3, 0, TAU); c.fill();
    },
    tome(c, w, h, it, b) {
      const col = b.spell === 'tp' ? '#2a3a8a' : '#8a2a2a';
      c.fillStyle = metal(c, 0, 0, w, 0, col); c.fillRect(4, 4, w - 8, h - 8); c.strokeStyle = '#1a1010'; c.strokeRect(4, 4, w - 8, h - 8);
      c.fillStyle = '#d8c8a0'; c.fillRect(w - 7, 6, 3, h - 12);
      c.fillStyle = '#c0a040'; c.beginPath(); c.arc(w / 2 - 1, h / 2, 4, 0, TAU); c.fill();
    },
    key(c, w, h) {
      c.strokeStyle = '#8a8070'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(w * 0.35, h * 0.3, 5, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(w * 0.42, h * 0.4); c.lineTo(w * 0.75, h * 0.8); c.lineTo(w * 0.85, h * 0.7); c.moveTo(w * 0.65, h * 0.68); c.lineTo(w * 0.72, h * 0.6); c.stroke();
    },
    quiver(c, w, h, it, b) {
      c.fillStyle = wood(c, 3, w - 3, '#6a4424'); c.fillRect(4, h * 0.25, w - 8, h * 0.72); c.strokeStyle = '#2a1a0a'; c.strokeRect(4, h * 0.25, w - 8, h * 0.72);
      for (let i = 0; i < 4; i++) { c.fillStyle = '#8a6a3a'; c.fillRect(6 + i * (w - 12) / 4, 3, 2, h * 0.25); c.fillStyle = b.ammo === 'bow' ? '#e0e0e0' : '#6a6a70'; c.fillRect(5 + i * (w - 12) / 4, 3, 4, 5); }
    },
    gem(c, w, h, it, b) {
      const cx = w / 2, cy = h / 2;
      const gr = b.grade;
      const r = 5 + gr * 1.5;
      if (b.gem === 'skull') {
        c.fillStyle = D.shade('#e0d8c0', -0.3 + gr * 0.12); c.beginPath(); c.ellipse(cx, cy - 1, r, r * 1.05, 0, 0, TAU); c.fill(); outline(c);
        c.fillStyle = '#1a1010'; c.beginPath(); c.arc(cx - r * 0.35, cy - 1, r * 0.25, 0, TAU); c.arc(cx + r * 0.35, cy - 1, r * 0.25, 0, TAU); c.fill(); c.fillRect(cx - 1, cy + r * 0.4, 2, 2);
        return;
      }
      const n = gr < 1 ? 5 : 8;
      const pts = [];
      for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.3; const rr = r * (gr < 1 ? 0.7 + D.hash2(i, gr, 5) * 0.4 : 1); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.85]); }
      path(c, pts);
      const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, b.color); g.addColorStop(1, D.shade(b.color, -0.65 + gr * 0.08));
      c.fillStyle = g; c.fill(); outline(c);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(cx, cy); c.lineTo(pts[Math.floor(n / 2)][0], pts[Math.floor(n / 2)][1]); c.stroke();
    },
    rune(c, w, h, it, b) {
      const cx = w / 2, cy = h / 2;
      c.fillStyle = metal(c, 0, 0, w, h, '#6a6258');
      c.beginPath(); c.ellipse(cx, cy, w * 0.38, h * 0.4, 0.3, 0, TAU); c.fill(); outline(c);
      c.strokeStyle = '#ff9a30'; c.lineWidth = 1.5;
      const hsh = D.strHash(b.rune);
      c.beginPath();
      c.moveTo(cx - 4 + (hsh % 3), cy - 7); c.lineTo(cx - 3, cy + 7);
      if (hsh & 1) { c.moveTo(cx - 3, cy - 3); c.lineTo(cx + 5, cy - 7); }
      if (hsh & 2) { c.moveTo(cx - 3, cy + 1); c.lineTo(cx + 5, cy + 6); }
      if (hsh & 4) { c.moveTo(cx + 2, cy - 7); c.lineTo(cx + 2, cy + 7); }
      if (hsh & 8) { c.moveTo(cx - 3, cy); c.lineTo(cx + 4, cy); }
      c.stroke();
    },
    quest(c, w, h, it, b) {
      if (b.id === 'q_malus') { DRAW.hammer(c, w, h, { q: 'unique' }, { tier: 0 }); return; }
      if (b.id === 'q_tome') { c.fillStyle = metal(c, 0, 0, w, 0, '#4a5a2a'); c.fillRect(4, 4, w - 8, h - 8); c.strokeStyle = '#1a1a0a'; c.strokeRect(4, 4, w - 8, h - 8); return; }
      c.fillStyle = '#d0c090'; c.fillRect(6, 6, w - 12, h - 12); c.strokeStyle = '#5a4a2a'; c.strokeRect(6, 6, w - 12, h - 12);
      c.fillStyle = b.id === 'q_scroll2' ? '#2040a0' : '#a02020'; c.fillRect(w / 2 - 2, 6, 4, h - 12);
      c.strokeStyle = '#3a2a1a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(10, 12 + i * 8); c.lineTo(w / 2 - 5, 12 + i * 8); c.moveTo(w / 2 + 5, 12 + i * 8); c.lineTo(w - 10, 12 + i * 8); c.stroke(); }
    },
    questweapon(c, w, h) {
      const cx = w / 2;
      D.Sprites.capsule(c, { x: cx, y: h * 0.1 }, { x: cx, y: h * 0.8 }, 4, 3.5, '#d8c8b0');
      D.Sprites.capsule(c, { x: cx, y: h * 0.8 }, { x: cx + 7, y: h * 0.93 }, 3.5, 3, '#c8b8a0');
    }
  };

  function shieldType(b) {
    const id = b.id;
    if (id === 'buckler' || id === 'heater' || id === 'small_shield' || id === 'round_shield' || id === 'defender') return { type: 'round', col: '#7a5a3a', rim: '#a09070' };
    if (/kite|dragon|scutum|monarch/.test(id)) return { type: 'kite', col: '#6a2020', rim: '#c0b080' };
    if (/tower|pavise|gothic|aegis|ancient/.test(id)) return { type: 'tower', col: '#4a4a6a', rim: '#b0b0c0' };
    if (/bone/.test(id)) return { type: 'round', col: '#d8d0b8', rim: '#a09880' };
    return { type: 'round', col: '#5a5a60', rim: '#c0c0c8' };
  }

  function potion(c, w, h, col, b) {
    const tier = b.rejuv ? (b.rejuv > 0.5 ? 4 : 2) : Math.max(1, +b.id.slice(2) || 1);
    const s = 0.55 + tier * 0.09;
    const cx = w / 2, by = h - 3;
    const bw = w * 0.36 * s, bh = h * 0.5 * s;
    c.fillStyle = 'rgba(210,220,230,0.35)';
    c.beginPath(); c.ellipse(cx, by - bh * 0.6, bw, bh * 0.6, 0, 0, TAU); c.fill();
    const g = c.createRadialGradient(cx - bw * 0.4, by - bh * 0.8, 1, cx, by - bh * 0.5, bw * 1.1);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, col); g.addColorStop(1, D.shade(col, -0.65));
    c.fillStyle = g; c.beginPath(); c.ellipse(cx, by - bh * 0.5, bw * 0.92, bh * 0.5, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(200,210,220,0.5)'; c.fillRect(cx - 2.5, by - bh * 1.35, 5, bh * 0.35);
    c.fillStyle = '#8a6a3a'; c.fillRect(cx - 3, by - bh * 1.5, 6, 3);
  }

  const cache = new Map();
  function item(it, cell) {
    const b = BASES[it.base];
    const key = it.base + '|' + it.q + '|' + (cell || 28) + '|' + (b.cat === 'jewel' || b.cat === 'charm' ? it.uid : '');
    let cv = cache.get(key);
    if (cv) return cv;
    const cs = cell || 28;
    cv = mk(b.w * cs, b.h * cs);
    const c = cv.getContext('2d');
    const sc = cs / 28;
    c.save();
    c.scale(sc, sc);
    const w = b.w * 28, h = b.h * 28;
    let kind = b.type;
    if (kind === 'circlet') kind = 'helm';
    const fn = DRAW[kind] || DRAW[b.cat === 'armor' ? 'body' : 'sword'];
    fn(c, w, h, it, b);
    c.restore();
    cache.set(key, cv);
    if (cache.size > 600) cache.delete(cache.keys().next().value);
    return cv;
  }

  const GLYPH = {
    arrow: (c, s) => { line(c, s * 0.2, s * 0.8, s * 0.8, s * 0.2, 3); tri(c, s * 0.8, s * 0.2, -Math.PI / 4, s * 0.16); fletch(c, s * 0.24, s * 0.76); },
    arrows: (c, s) => { for (let i = -1; i <= 1; i++) { line(c, s * 0.25 + i * 7, s * 0.8, s * 0.7 + i * 7, s * 0.25, 2); tri(c, s * 0.7 + i * 7, s * 0.25, -Math.PI / 4, s * 0.1); } },
    firearrow: (c, s) => { GLYPH.arrow(c, s); flameG(c, s * 0.7, s * 0.3, s * 0.2); },
    guided: (c, s) => { c.beginPath(); c.moveTo(s * 0.2, s * 0.8); c.bezierCurveTo(s * 0.2, s * 0.3, s * 0.7, s * 0.6, s * 0.8, s * 0.2); c.lineWidth = 3; c.stroke(); tri(c, s * 0.8, s * 0.2, -Math.PI / 3, s * 0.14); },
    strafe: (c, s) => { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.4; line(c, s / 2, s * 0.8, s / 2 + Math.cos(a) * s * 0.4, s * 0.8 + Math.sin(a) * s * 0.55, 2); } },
    eye: (c, s) => { c.beginPath(); c.ellipse(s / 2, s / 2, s * 0.35, s * 0.18, 0, 0, TAU); c.lineWidth = 3; c.stroke(); c.beginPath(); c.arc(s / 2, s / 2, s * 0.1, 0, TAU); c.fill(); },
    crit: (c, s) => { star(c, s / 2, s / 2, s * 0.38, s * 0.14, 8); },
    dodge: (c, s) => { for (let i = 0; i < 3; i++) { c.globalAlpha = 0.4 + i * 0.3; figure(c, s * (0.3 + i * 0.18), s * 0.55, s * 0.5); } c.globalAlpha = 1; },
    pierce: (c, s) => { line(c, s * 0.1, s / 2, s * 0.9, s / 2, 3); tri(c, s * 0.9, s / 2, 0, s * 0.14); c.beginPath(); c.arc(s / 2, s / 2, s * 0.18, 0, TAU); c.lineWidth = 2; c.stroke(); },
    decoy: (c, s) => { c.globalAlpha = 0.5; figure(c, s * 0.38, s * 0.55, s * 0.6); c.globalAlpha = 1; figure(c, s * 0.62, s * 0.55, s * 0.6); },
    valkyrie: (c, s) => { figure(c, s / 2, s * 0.58, s * 0.66); wing(c, s * 0.35, s * 0.3, -1, s); wing(c, s * 0.65, s * 0.3, 1, s); },
    jab: (c, s) => { for (let i = 0; i < 3; i++) line(c, s * 0.15, s * (0.3 + i * 0.2), s * 0.85, s * (0.3 + i * 0.2), 2); },
    bolt: (c, s) => { boltG(c, s * 0.55, s * 0.12, s * 0.4, s * 0.88); },
    poison: (c, s) => { c.beginPath(); c.arc(s / 2, s * 0.6, s * 0.2, 0, TAU); c.moveTo(s / 2, s * 0.15); c.lineTo(s * 0.68, s * 0.5); c.lineTo(s * 0.32, s * 0.5); c.closePath(); c.fill(); },
    cbolt: (c, s) => { for (let i = 0; i < 3; i++) { const x = s * (0.3 + i * 0.2); boltG(c, x, s * 0.2, x - 5, s * 0.8, 0.6); } },
    lfury: (c, s) => { line(c, s * 0.2, s * 0.8, s * 0.6, s * 0.4, 3); for (let i = -1; i <= 1; i++) boltG(c, s * 0.6, s * 0.4, s * 0.6 + Math.cos(-Math.PI / 4 + i * 0.6) * s * 0.35, s * 0.4 + Math.sin(-Math.PI / 4 + i * 0.6) * s * 0.35, 0.5); },
    tiger: (c, s) => { for (let i = 0; i < 3; i++) line(c, s * (0.3 + i * 0.15), s * 0.2, s * (0.2 + i * 0.15), s * 0.8, 3); },
    kick: (c, s) => { c.beginPath(); c.moveTo(s * 0.3, s * 0.2); c.lineTo(s * 0.35, s * 0.55); c.lineTo(s * 0.75, s * 0.62); c.lineTo(s * 0.75, s * 0.75); c.lineTo(s * 0.3, s * 0.72); c.closePath(); c.fill(); },
    fist: (c, s) => { c.beginPath(); c.roundRect ? c.roundRect(s * 0.3, s * 0.3, s * 0.4, s * 0.4, 5) : c.rect(s * 0.3, s * 0.3, s * 0.4, s * 0.4); c.fill(); flameG(c, s / 2, s * 0.25, s * 0.2); },
    thunder: (c, s) => { GLYPH.claw(c, s); boltG(c, s * 0.7, s * 0.15, s * 0.55, s * 0.6, 0.6); },
    phoenix: (c, s) => { wing(c, s * 0.4, s * 0.45, -1, s); wing(c, s * 0.6, s * 0.45, 1, s); c.beginPath(); c.arc(s / 2, s * 0.4, s * 0.08, 0, TAU); c.fill(); },
    claw: (c, s) => { for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(s * (0.3 + i * 0.15), s * 0.8); c.quadraticCurveTo(s * (0.35 + i * 0.15), s * 0.4, s * (0.25 + i * 0.18), s * 0.15); c.lineWidth = 3; c.stroke(); } },
    speed: (c, s) => { for (let i = 0; i < 4; i++) line(c, s * (0.15 + i * 0.05), s * (0.3 + i * 0.13), s * (0.6 + i * 0.05), s * (0.3 + i * 0.13), 2); figure(c, s * 0.75, s * 0.55, s * 0.5); },
    wblock: (c, s) => { GLYPH.claw(c, s); c.beginPath(); c.arc(s / 2, s / 2, s * 0.38, -2.5, -0.6); c.lineWidth = 2; c.stroke(); },
    fade: (c, s) => { c.globalAlpha = 0.35; figure(c, s / 2, s * 0.55, s * 0.7); c.globalAlpha = 1; },
    shadow: (c, s) => { figure(c, s * 0.42, s * 0.55, s * 0.62); c.globalAlpha = 0.45; figure(c, s * 0.6, s * 0.55, s * 0.62); c.globalAlpha = 1; },
    bomb: (c, s) => { c.beginPath(); c.arc(s * 0.45, s * 0.55, s * 0.22, 0, TAU); c.fill(); line(c, s * 0.6, s * 0.38, s * 0.72, s * 0.22, 2); flameG(c, s * 0.74, s * 0.2, s * 0.12); },
    web: (c, s) => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; line(c, s / 2, s / 2, s / 2 + Math.cos(a) * s * 0.4, s / 2 + Math.sin(a) * s * 0.4, 1.5); } for (const r of [0.15, 0.28, 0.38]) { c.beginPath(); c.arc(s / 2, s / 2, s * r, 0, TAU); c.lineWidth = 1; c.stroke(); } },
    blade: (c, s) => { for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; c.beginPath(); c.moveTo(s / 2, s / 2); c.lineTo(s / 2 + Math.cos(a) * s * 0.4, s / 2 + Math.sin(a) * s * 0.4); c.lineTo(s / 2 + Math.cos(a + 0.5) * s * 0.3, s / 2 + Math.sin(a + 0.5) * s * 0.3); c.closePath(); c.fill(); } },
    sentry: (c, s) => { line(c, s / 2, s * 0.4, s * 0.25, s * 0.85, 2); line(c, s / 2, s * 0.4, s * 0.75, s * 0.85, 2); line(c, s / 2, s * 0.4, s / 2, s * 0.85, 2); c.beginPath(); c.arc(s / 2, s * 0.32, s * 0.12, 0, TAU); c.fill(); boltG(c, s * 0.62, s * 0.3, s * 0.85, s * 0.1, 0.4); },
    lsentry: (c, s) => { GLYPH.sentry(c, s); boltG(c, s * 0.38, s * 0.3, s * 0.15, s * 0.1, 0.4); },
    skeleton: (c, s) => { skull(c, s / 2, s * 0.3, s * 0.14); line(c, s / 2, s * 0.45, s / 2, s * 0.8, 2); for (let i = 0; i < 3; i++) line(c, s * 0.38, s * (0.5 + i * 0.08), s * 0.62, s * (0.5 + i * 0.08), 1.5); },
    skull: (c, s) => { skull(c, s / 2, s / 2, s * 0.28); },
    golem: (c, s) => { c.fillRect(s * 0.35, s * 0.3, s * 0.3, s * 0.35); c.fillRect(s * 0.25, s * 0.33, s * 0.1, s * 0.3); c.fillRect(s * 0.65, s * 0.33, s * 0.1, s * 0.3); c.fillRect(s * 0.37, s * 0.65, s * 0.1, s * 0.22); c.fillRect(s * 0.53, s * 0.65, s * 0.1, s * 0.22); c.beginPath(); c.arc(s / 2, s * 0.22, s * 0.08, 0, TAU); c.fill(); },
    bgolem: (c, s) => { GLYPH.golem(c, s); },
    fgolem: (c, s) => { GLYPH.golem(c, s); flameG(c, s / 2, s * 0.2, s * 0.15); },
    skelmage: (c, s) => { skull(c, s / 2, s * 0.35, s * 0.14); c.beginPath(); c.moveTo(s * 0.3, s * 0.85); c.lineTo(s / 2, s * 0.45); c.lineTo(s * 0.7, s * 0.85); c.closePath(); c.fill(); },
    teeth: (c, s) => { for (let i = 0; i < 5; i++) tri(c, s * 0.2 + i * s * 0.15, s * 0.5, -Math.PI / 2, s * 0.12); },
    bonearmor: (c, s) => { c.beginPath(); c.arc(s / 2, s / 2, s * 0.36, 0, TAU); c.lineWidth = 3; c.stroke(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; line(c, s / 2 + Math.cos(a) * s * 0.2, s / 2 + Math.sin(a) * s * 0.2, s / 2 + Math.cos(a) * s * 0.38, s / 2 + Math.sin(a) * s * 0.38, 2); } },
    cexplode: (c, s) => { star(c, s / 2, s / 2, s * 0.4, s * 0.15, 10); },
    bonespear: (c, s) => { c.beginPath(); c.moveTo(s * 0.85, s * 0.15); c.lineTo(s * 0.25, s * 0.68); c.lineTo(s * 0.15, s * 0.85); c.lineTo(s * 0.32, s * 0.75); c.closePath(); c.fill(); },
    pnova: (c, s) => { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.arc(s / 2 + Math.cos(a) * s * 0.34, s / 2 + Math.sin(a) * s * 0.34, 2.5, 0, TAU); c.fill(); } c.beginPath(); c.arc(s / 2, s / 2, s * 0.1, 0, TAU); c.fill(); },
    amplify: (c, s) => { mask(c, s); tri(c, s / 2, s * 0.15, -Math.PI / 2, s * 0.12); },
    weaken: (c, s) => { mask(c, s); tri(c, s / 2, s * 0.9, Math.PI / 2, s * 0.12); },
    maiden: (c, s) => { mask(c, s); for (let i = 0; i < 5; i++) line(c, s * (0.25 + i * 0.12), s * 0.15, s * (0.25 + i * 0.12), s * 0.3, 1.5); },
    lifetap: (c, s) => { mask(c, s); c.beginPath(); c.arc(s * 0.5, s * 0.82, s * 0.07, 0, TAU); c.fill(); },
    decrepify: (c, s) => { mask(c, s); line(c, s * 0.2, s * 0.2, s * 0.8, s * 0.85, 2); },
    bash: (c, s) => { GLYPH.mace(c, s); star(c, s * 0.7, s * 0.3, s * 0.15, s * 0.06, 6); },
    double: (c, s) => { line(c, s * 0.2, s * 0.8, s * 0.55, s * 0.2, 3); line(c, s * 0.45, s * 0.8, s * 0.8, s * 0.2, 3); },
    stun: (c, s) => { star(c, s / 2, s * 0.35, s * 0.3, s * 0.1, 5); c.beginPath(); c.ellipse(s / 2, s * 0.75, s * 0.3, s * 0.08, 0, 0, TAU); c.lineWidth = 2; c.stroke(); },
    leap: (c, s) => { c.beginPath(); c.moveTo(s * 0.15, s * 0.85); c.quadraticCurveTo(s / 2, -s * 0.1, s * 0.85, s * 0.85); c.lineWidth = 3; c.stroke(); figure(c, s / 2, s * 0.35, s * 0.35); },
    whirl: (c, s) => { for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(s / 2, s / 2, s * (0.15 + i * 0.12), i, i + 4); c.lineWidth = 2.5; c.stroke(); } },
    sword: (c, s) => { line(c, s * 0.25, s * 0.75, s * 0.8, s * 0.2, 4); line(c, s * 0.2, s * 0.6, s * 0.4, s * 0.8, 3); },
    axe: (c, s) => { line(c, s * 0.3, s * 0.85, s * 0.6, s * 0.2, 3); c.beginPath(); c.moveTo(s * 0.55, s * 0.2); c.quadraticCurveTo(s * 0.95, s * 0.2, s * 0.8, s * 0.55); c.lineTo(s * 0.5, s * 0.38); c.closePath(); c.fill(); },
    mace: (c, s) => { line(c, s * 0.25, s * 0.85, s * 0.55, s * 0.4, 3); c.beginPath(); c.arc(s * 0.62, s * 0.3, s * 0.16, 0, TAU); c.fill(); },
    skin: (c, s) => { c.beginPath(); c.moveTo(s / 2, s * 0.12); c.lineTo(s * 0.82, s * 0.28); c.lineTo(s * 0.75, s * 0.7); c.lineTo(s / 2, s * 0.88); c.lineTo(s * 0.25, s * 0.7); c.lineTo(s * 0.18, s * 0.28); c.closePath(); c.fill(); },
    natres: (c, s) => { c.beginPath(); c.ellipse(s / 2, s / 2, s * 0.18, s * 0.36, 0.6, 0, TAU); c.fill(); line(c, s * 0.3, s * 0.78, s * 0.7, s * 0.22, 1.5); },
    howl: (c, s) => { for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(s * 0.3, s / 2, s * (0.15 + i * 0.13), -0.7, 0.7); c.lineWidth = 2.5; c.stroke(); } },
    potion: (c, s) => { c.beginPath(); c.arc(s / 2, s * 0.62, s * 0.22, 0, TAU); c.fill(); c.fillRect(s * 0.44, s * 0.22, s * 0.12, s * 0.2); },
    shout: (c, s) => { c.beginPath(); c.moveTo(s * 0.2, s * 0.4); c.lineTo(s * 0.4, s * 0.4); c.lineTo(s * 0.65, s * 0.2); c.lineTo(s * 0.65, s * 0.8); c.lineTo(s * 0.4, s * 0.6); c.lineTo(s * 0.2, s * 0.6); c.closePath(); c.fill(); },
    bcry: (c, s) => { GLYPH.howl(c, s); star(c, s * 0.75, s / 2, s * 0.14, s * 0.05, 6); },
    borders: (c, s) => { c.fillRect(s * 0.45, s * 0.15, s * 0.06, s * 0.7); c.beginPath(); c.moveTo(s * 0.51, s * 0.15); c.lineTo(s * 0.85, s * 0.25); c.lineTo(s * 0.51, s * 0.38); c.closePath(); c.fill(); },
    sacrifice: (c, s) => { GLYPH.sword(c, s); c.beginPath(); c.arc(s * 0.3, s * 0.3, s * 0.1, 0, TAU); c.fill(); },
    holybolt: (c, s) => { cross(c, s / 2, s / 2, s * 0.3); },
    zeal: (c, s) => { for (let i = 0; i < 4; i++) line(c, s * 0.2, s * (0.25 + i * 0.15), s * 0.8, s * (0.2 + i * 0.15), 2); },
    hammer: (c, s) => { c.beginPath(); c.arc(s / 2, s / 2, s * 0.3, 0, 5); c.lineWidth = 2; c.stroke(); c.fillRect(s * 0.62, s * 0.2, s * 0.18, s * 0.12); line(c, s * 0.71, s * 0.3, s * 0.71, s * 0.48, 2); },
    hshield: (c, s) => { c.beginPath(); c.moveTo(s / 2, s * 0.12); c.lineTo(s * 0.82, s * 0.28); c.lineTo(s / 2, s * 0.9); c.lineTo(s * 0.18, s * 0.28); c.closePath(); c.fill(); },
    might: (c, s) => { aura(c, s); line(c, s * 0.35, s * 0.65, s * 0.65, s * 0.35, 3); },
    holyfire: (c, s) => { aura(c, s); flameG(c, s / 2, s * 0.6, s * 0.2); },
    thorns: (c, s) => { aura(c, s); star(c, s / 2, s / 2, s * 0.2, s * 0.06, 8); },
    holyfreeze: (c, s) => { aura(c, s); snow(c, s / 2, s / 2, s * 0.18); },
    fanat: (c, s) => { aura(c, s); line(c, s * 0.3, s * 0.7, s * 0.7, s * 0.3, 2); line(c, s * 0.3, s * 0.3, s * 0.7, s * 0.7, 2); },
    prayer: (c, s) => { aura(c, s); cross(c, s / 2, s / 2, s * 0.15); },
    defiance: (c, s) => { aura(c, s); GLYPH.hshield(c, s * 0.9); },
    cleansing: (c, s) => { aura(c, s); c.beginPath(); c.arc(s / 2, s * 0.58, s * 0.1, 0, TAU); c.fill(); tri(c, s / 2, s * 0.38, -Math.PI / 2, s * 0.1); },
    vigor: (c, s) => { aura(c, s); for (let i = 0; i < 3; i++) line(c, s * 0.3, s * (0.4 + i * 0.1), s * 0.7, s * (0.4 + i * 0.1), 1.5); },
    meditation: (c, s) => { aura(c, s); c.beginPath(); c.arc(s / 2, s / 2, s * 0.12, 0, TAU); c.fill(); },
    firebolt: (c, s) => { flameG(c, s * 0.6, s * 0.4, s * 0.26); line(c, s * 0.15, s * 0.85, s * 0.45, s * 0.55, 3); },
    inferno: (c, s) => { for (let i = 0; i < 4; i++) flameG(c, s * (0.25 + i * 0.17), s * (0.75 - i * 0.12), s * (0.12 + i * 0.04)); },
    fireball: (c, s) => { c.beginPath(); c.arc(s * 0.58, s * 0.42, s * 0.22, 0, TAU); c.fill(); line(c, s * 0.15, s * 0.85, s * 0.42, s * 0.58, 4); },
    firewall: (c, s) => { for (let i = 0; i < 5; i++) flameG(c, s * (0.15 + i * 0.17), s * 0.7, s * 0.14); },
    meteor: (c, s) => { c.beginPath(); c.arc(s * 0.62, s * 0.62, s * 0.18, 0, TAU); c.fill(); line(c, s * 0.15, s * 0.15, s * 0.5, s * 0.5, 5); },
    static: (c, s) => { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; boltG(c, s / 2, s / 2, s / 2 + Math.cos(a) * s * 0.4, s / 2 + Math.sin(a) * s * 0.4, 0.35); } },
    nova: (c, s) => { c.beginPath(); c.arc(s / 2, s / 2, s * 0.34, 0, TAU); c.lineWidth = 3; c.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; boltG(c, s / 2 + Math.cos(a) * s * 0.2, s / 2 + Math.sin(a) * s * 0.2, s / 2 + Math.cos(a) * s * 0.44, s / 2 + Math.sin(a) * s * 0.44, 0.2); } },
    teleport: (c, s) => { figure(c, s * 0.3, s * 0.6, s * 0.45); c.globalAlpha = 0.5; figure(c, s * 0.72, s * 0.45, s * 0.45); c.globalAlpha = 1; line(c, s * 0.38, s * 0.5, s * 0.62, s * 0.4, 1); },
    chain: (c, s) => { boltG(c, s * 0.1, s * 0.5, s * 0.4, s * 0.3, 0.5); boltG(c, s * 0.4, s * 0.3, s * 0.65, s * 0.7, 0.5); boltG(c, s * 0.65, s * 0.7, s * 0.9, s * 0.35, 0.5); },
    icebolt: (c, s) => { c.beginPath(); c.moveTo(s * 0.8, s * 0.2); c.lineTo(s * 0.35, s * 0.55); c.lineTo(s * 0.2, s * 0.8); c.lineTo(s * 0.45, s * 0.65); c.closePath(); c.fill(); },
    farmor: (c, s) => { GLYPH.hshield(c, s); c.fillStyle = '#ffffff'; snow(c, s / 2, s * 0.45, s * 0.12); },
    fnova: (c, s) => { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; snow(c, s / 2 + Math.cos(a) * s * 0.32, s / 2 + Math.sin(a) * s * 0.32, s * 0.08); } },
    blizzard: (c, s) => { for (let i = 0; i < 7; i++) line(c, s * (0.15 + i * 0.12), s * 0.15, s * (0.05 + i * 0.12), s * 0.85, 2); },
    forb: (c, s) => { c.beginPath(); c.arc(s / 2, s / 2, s * 0.16, 0, TAU); c.fill(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; line(c, s / 2 + Math.cos(a) * s * 0.22, s / 2 + Math.sin(a) * s * 0.22, s / 2 + Math.cos(a) * s * 0.42, s / 2 + Math.sin(a) * s * 0.42, 1.5); } },
    firestorm: (c, s) => { for (let i = 0; i < 3; i++) { flameG(c, s * (0.3 + i * 0.2), s * (0.35 + i * 0.1), s * 0.12); flameG(c, s * (0.25 + i * 0.2), s * (0.65 + i * 0.05), s * 0.1); } },
    arctic: (c, s) => { for (let i = 0; i < 4; i++) line(c, s * 0.2, s / 2, s * 0.85, s * (0.25 + i * 0.17), 2); },
    boulder: (c, s) => { c.beginPath(); c.arc(s / 2, s * 0.55, s * 0.26, 0, TAU); c.fill(); flameG(c, s * 0.25, s * 0.7, s * 0.1); },
    tornado: (c, s) => { for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(s / 2 + i * 1.5, s * (0.25 + i * 0.12), s * (0.35 - i * 0.05), s * 0.06, 0, 0, TAU); c.lineWidth = 2; c.stroke(); } },
    volcano: (c, s) => { c.beginPath(); c.moveTo(s * 0.1, s * 0.85); c.lineTo(s * 0.38, s * 0.4); c.lineTo(s * 0.62, s * 0.4); c.lineTo(s * 0.9, s * 0.85); c.closePath(); c.fill(); flameG(c, s / 2, s * 0.3, s * 0.15); },
    wolf: (c, s) => { c.beginPath(); c.moveTo(s * 0.2, s * 0.3); c.lineTo(s * 0.35, s * 0.15); c.lineTo(s * 0.45, s * 0.3); c.lineTo(s * 0.8, s * 0.45); c.lineTo(s * 0.55, s * 0.8); c.lineTo(s * 0.25, s * 0.65); c.closePath(); c.fill(); },
    lycan: (c, s) => { GLYPH.wolf(c, s); c.beginPath(); c.arc(s * 0.75, s * 0.25, s * 0.12, 0, TAU); c.fill(); },
    bear: (c, s) => { c.beginPath(); c.arc(s / 2, s * 0.6, s * 0.22, 0, TAU); c.fill(); for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(s * (0.27 + i * 0.15), s * 0.3, s * 0.07, 0, TAU); c.fill(); } },
    maul: (c, s) => { GLYPH.bear(c, s); },
    fury: (c, s) => { GLYPH.wolf(c, s); line(c, s * 0.6, s * 0.2, s * 0.9, s * 0.1, 2); },
    raven: (c, s) => { c.beginPath(); c.moveTo(s * 0.1, s * 0.4); c.quadraticCurveTo(s * 0.35, s * 0.2, s / 2, s * 0.45); c.quadraticCurveTo(s * 0.65, s * 0.2, s * 0.9, s * 0.4); c.lineTo(s / 2, s * 0.6); c.closePath(); c.fill(); },
    swolf: (c, s) => { GLYPH.wolf(c, s); },
    oak: (c, s) => { c.beginPath(); c.arc(s / 2, s * 0.4, s * 0.25, 0, TAU); c.fill(); c.fillRect(s * 0.45, s * 0.55, s * 0.1, s * 0.3); },
    wolverine: (c, s) => { c.beginPath(); c.moveTo(s / 2, s * 0.85); c.bezierCurveTo(s * 0.05, s * 0.45, s * 0.3, s * 0.1, s / 2, s * 0.35); c.bezierCurveTo(s * 0.7, s * 0.1, s * 0.95, s * 0.45, s / 2, s * 0.85); c.fill(); },
    grizzly: (c, s) => { GLYPH.bear(c, s); },
    attack: (c, s) => { GLYPH.sword(c, s); },
    throw: (c, s) => { line(c, s * 0.2, s * 0.8, s * 0.8, s * 0.2, 2.5); tri(c, s * 0.8, s * 0.2, -Math.PI / 4, s * 0.12); c.beginPath(); c.arc(s * 0.3, s * 0.4, s * 0.1, 0, TAU); c.lineWidth = 1; c.stroke(); },
    tp: (c, s) => { c.beginPath(); c.ellipse(s / 2, s / 2, s * 0.22, s * 0.36, 0, 0, TAU); c.lineWidth = 3; c.stroke(); },
    idtome: (c, s) => { c.font = 'bold ' + Math.round(s * 0.6) + 'px serif'; c.textAlign = 'center'; c.fillText('?', s / 2, s * 0.72); }
  };

  function line(c, x0, y0, x1, y1, w) { c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  function tri(c, x, y, a, s) { c.beginPath(); c.moveTo(x + Math.cos(a) * s, y + Math.sin(a) * s); c.lineTo(x + Math.cos(a + 2.4) * s * 0.7, y + Math.sin(a + 2.4) * s * 0.7); c.lineTo(x + Math.cos(a - 2.4) * s * 0.7, y + Math.sin(a - 2.4) * s * 0.7); c.closePath(); c.fill(); }
  function fletch(c, x, y) { line(c, x, y, x - 5, y - 1, 1.5); line(c, x, y, x + 1, y + 5, 1.5); }
  function star(c, x, y, r1, r2, n) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU - Math.PI / 2; const r = i % 2 ? r2 : r1; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); }
  function flameG(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r * 1.4); c.quadraticCurveTo(x + r, y - r * 0.2, x + r * 0.6, y + r * 0.6); c.quadraticCurveTo(x, y + r, x - r * 0.6, y + r * 0.6); c.quadraticCurveTo(x - r, y - r * 0.2, x, y - r * 1.4); c.fill(); }
  function boltG(c, x0, y0, x1, y1, w) { c.lineWidth = 2.5 * (w || 1) + 0.5; c.beginPath(); c.moveTo(x0, y0); const mx = (x0 + x1) / 2, my = (y0 + y1) / 2; c.lineTo(mx + (y1 - y0) * 0.15, my - (x1 - x0) * 0.15); c.lineTo(mx - (y1 - y0) * 0.15, my + (x1 - x0) * 0.15); c.lineTo(x1, y1); c.stroke(); }
  function figure(c, x, y, s) { c.beginPath(); c.arc(x, y - s * 0.38, s * 0.1, 0, TAU); c.fill(); c.fillRect(x - s * 0.08, y - s * 0.28, s * 0.16, s * 0.34); c.fillRect(x - s * 0.08, y + s * 0.05, s * 0.06, s * 0.3); c.fillRect(x + s * 0.02, y + s * 0.05, s * 0.06, s * 0.3); }
  function wing(c, x, y, d, s) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + d * s * 0.3, y - s * 0.2, x + d * s * 0.38, y + s * 0.05); c.quadraticCurveTo(x + d * s * 0.2, y + s * 0.05, x, y + s * 0.15); c.closePath(); c.fill(); }
  function skull(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.fillRect(x - r * 0.6, y + r * 0.5, r * 1.2, r * 0.6); const f = c.fillStyle; c.fillStyle = '#000'; c.beginPath(); c.arc(x - r * 0.4, y, r * 0.25, 0, TAU); c.arc(x + r * 0.4, y, r * 0.25, 0, TAU); c.fill(); c.fillStyle = f; }
  function mask(c, s) { c.beginPath(); c.ellipse(s / 2, s / 2, s * 0.26, s * 0.32, 0, 0, TAU); c.fill(); const f = c.fillStyle; c.fillStyle = '#000'; c.beginPath(); c.ellipse(s * 0.42, s * 0.45, s * 0.06, s * 0.04, 0, 0, TAU); c.ellipse(s * 0.58, s * 0.45, s * 0.06, s * 0.04, 0, 0, TAU); c.fill(); c.fillStyle = f; }
  function cross(c, x, y, r) { c.fillRect(x - r * 0.18, y - r, r * 0.36, r * 2); c.fillRect(x - r * 0.7, y - r * 0.4, r * 1.4, r * 0.36); }
  function aura(c, s) { c.save(); c.globalAlpha = 0.6; c.beginPath(); c.arc(s / 2, s / 2, s * 0.4, 0, TAU); c.lineWidth = 2; c.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line(c, s / 2 + Math.cos(a) * s * 0.36, s / 2 + Math.sin(a) * s * 0.36, s / 2 + Math.cos(a) * s * 0.46, s / 2 + Math.sin(a) * s * 0.46, 1); } c.restore(); }
  function snow(c, x, y, r) { for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; line(c, x - Math.cos(a) * r, y - Math.sin(a) * r, x + Math.cos(a) * r, y + Math.sin(a) * r, 2); } }

  const EL_BG = { fire: ['#5a1a04', '#1a0600'], cold: ['#123a5a', '#040c18'], light: ['#2a2a6a', '#06061a'], poison: ['#1a4a10', '#041004'], magic: ['#3a1a5a', '#0c0418'], holy: ['#5a4a14', '#140e02'], shadow: ['#2a1438', '#0a040e'], nature: ['#2a4a14', '#081004'], bone: ['#4a4436', '#0e0c08'], phys: ['#4a3a2a', '#100a06'] };
  const EL_FG = { fire: '#ffb040', cold: '#c0e8ff', light: '#e0e8ff', poison: '#a0ff70', magic: '#d0b0ff', holy: '#fff0a0', shadow: '#e0b0ff', nature: '#c0f080', bone: '#f0e8d0', phys: '#f0e0c0' };

  const scache = new Map();
  function skill(id, size, dim) {
    const key = id + '|' + (size || 48) + '|' + (dim ? 1 : 0);
    let cv = scache.get(key);
    if (cv) return cv;
    const sk = D.SKILLS[id] || D.BASIC[id];
    const s = size || 48;
    cv = mk(s, s);
    const c = cv.getContext('2d');
    const el = sk ? sk.el || 'phys' : 'phys';
    const [a, b] = EL_BG[el] || EL_BG.phys;
    const g = c.createRadialGradient(s * 0.35, s * 0.3, 2, s / 2, s / 2, s * 0.75);
    g.addColorStop(0, a); g.addColorStop(1, b);
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    c.fillStyle = EL_FG[el] || '#f0e0c0';
    c.strokeStyle = EL_FG[el] || '#f0e0c0';
    c.shadowColor = EL_FG[el]; c.shadowBlur = s * 0.12;
    const fn = GLYPH[sk ? sk.icon : 'attack'] || GLYPH.attack;
    fn(c, s);
    c.shadowBlur = 0;
    c.strokeStyle = '#8a7a5a'; c.lineWidth = 2; c.strokeRect(1, 1, s - 2, s - 2);
    c.strokeStyle = '#1a140c'; c.lineWidth = 1; c.strokeRect(3, 3, s - 6, s - 6);
    if (dim) { c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, s, s); }
    scache.set(key, cv);
    return cv;
  }

  D.Icons = { item, skill, GLYPH };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
