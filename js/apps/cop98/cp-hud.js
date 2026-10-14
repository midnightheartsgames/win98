(function (C) {
  'use strict';
  const { clamp, wrapAngle } = C;
  const D = C.DATA, M = C.MAP;
  const FONT = 'Tahoma, Verdana, sans-serif';

  function msgGlyph(m) {
    const t = m.text;
    if (/RU\b|Получено|Взято|денег/.test(t)) return ['money', '#e4c05a'];
    if (/Подобрано|Использовано|Получен|артефакт/.test(t)) return ['item', '#c8d0a8'];
    if (/Новая локация/.test(t)) return ['loc', '#a8d888'];
    if (/КПК|энциклопед/.test(t)) return ['pda', '#9fd08a'];
    if (/Нет |Не хватает|Клин|заклинило|Перегруз|нельзя|Слишком|Выброс|заперт/.test(t)) return ['warn', '#e8905a'];
    return ['info', '#c8c0a0'];
  }

  function plate(c, x, y, w, h, s) {
    c.fillStyle = 'rgba(10,10,8,0.66)'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(0,0,0,0.9)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    c.strokeStyle = 'rgba(200,188,150,0.16)'; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  }

  function bolt(c, x, y, r) {
    const gr = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    gr.addColorStop(0, '#b8b09a'); gr.addColorStop(1, '#3a3630');
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, C.TAU); c.fill();
  }

  const methods = {
    hudIcon(id, px) {
      this.hudIcons = this.hudIcons || new Map();
      const key = id + '@' + px;
      if (this.hudIcons.has(key)) return this.hudIcons.get(key);
      const img = C.Icons.cached(id, px);
      if (!img) { this.queueAsset({ id, px }, true); return null; }
      const cv = C.Skin.imageToCanvas(img);
      this.hudIcons.set(key, cv);
      return cv;
    },

    hudFace(look) {
      if (!look) return null;
      this.hudFaces = this.hudFaces || new Map();
      if (this.hudFaces.has(look)) return this.hudFaces.get(look);
      if (!this.bank.hasPortrait(look)) { this.queuePortrait(look); return null; }
      const cv = C.Skin.imageToCanvas(this.bank.portrait(look));
      this.hudFaces.set(look, cv);
      return cv;
    },

    drawHud(g, dt, dim) {
      const c = this.hctx, W = this.hud.width, H = this.hud.height, p = g.player;
      c.clearRect(0, 0, W, H);
      if (dim || p.sleepT > 0) return;
      const s = clamp(H / 620, 0.75, 1.6);
      c.save();
      c.textBaseline = 'top';
      const wit = g.activeWeapon();
      const zoomed = wit && D.WEAPONS[wit.id].zoom && p.aimK > 0.85;
      if (zoomed) this.drawScope(c, W, H);
      else if (!g.inSafeZone()) this.drawCrosshair(c, W, H, s, g, wit);
      if (g.focus && g.focus.label) this.hudLabel(c, g.focus.label, 'F', W / 2, H / 2 + 28 * s, s);
      this.drawMinimap(c, s, g);
      this.drawClock(c, s, g);
      this.drawStatusPanel(c, W, H, s, g);
      this.drawQuick(c, H, s, g);
      this.drawFeed(c, H, s, g, dt);
      this.drawIndicators(c, W, H, s, g);
      this.drawEmission(c, W, s, g);
      if (this.hint) {
        this.hint.t -= dt;
        const w = Math.min(W * 0.62, 560 * s), x = W / 2 - w / 2, y = H * 0.7;
        c.globalAlpha = clamp(this.hint.t, 0, 1);
        plate(c, x, y, w, 44 * s, s);
        C.Skin.glyph(c, 'info', x + 18 * s, y + 22 * s, 18 * s, '#e0c870');
        c.fillStyle = '#efe4b8'; c.font = `${Math.round(12 * s)}px ${FONT}`;
        this.wrap(c, this.hint.text, x + 34 * s, y + 7 * s, w - 44 * s, 15 * s, 2);
        c.globalAlpha = 1;
        if (this.hint.t <= 0) this.hint = null;
      }
      if (this.detScreen && g.detector) this.drawDetector(c, W, H, s, g);
      if (p.reload > 0) { c.font = `${Math.round(12 * s)}px ${FONT}`; c.textAlign = 'center'; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillText('Перезарядка…', W / 2 + 1, H / 2 + 52 * s + 1); c.fillStyle = '#e8dca0'; c.fillText('Перезарядка…', W / 2, H / 2 + 52 * s); c.textAlign = 'left'; }
      c.restore();
    },

    drawScope(c, W, H) {
      const r = Math.min(W, H) * 0.46;
      c.fillStyle = '#000';
      c.beginPath(); c.rect(0, 0, W, H); c.arc(W / 2, H / 2, r, 0, C.TAU, true); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.9)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(W / 2 - r, H / 2); c.lineTo(W / 2 + r, H / 2); c.moveTo(W / 2, H / 2); c.lineTo(W / 2, H / 2 + r); c.stroke();
      c.fillStyle = 'rgba(200,40,20,0.9)';
      for (let k = 1; k <= 4; k++) c.fillRect(W / 2 - 1.5, H / 2 + k * r * 0.08 - 1.5, 3, 3);
    },

    drawCrosshair(c, W, H, s, g, wit) {
      const p = g.player, w = wit ? g.weaponStats(wit) : null;
      const spread = w && !w.melee ? (w.spread * (1 + Math.hypot(p.vx, p.vy) * 0.35) * (1 - p.aimK * 0.55) + p.bloom + p.recoil * 0.2) : 0.01;
      const gap = 4 * s + spread * 700 * s, len = 9 * s;
      c.lineWidth = Math.max(1, s * 1.1);
      for (const [col, off] of [['rgba(0,0,0,0.55)', 1], [g.focus ? 'rgba(170,236,150,0.95)' : 'rgba(236,230,200,0.9)', 0]]) {
        c.strokeStyle = col; c.beginPath();
        c.moveTo(W / 2 - gap - len + off, H / 2 + off); c.lineTo(W / 2 - gap + off, H / 2 + off); c.moveTo(W / 2 + gap + off, H / 2 + off); c.lineTo(W / 2 + gap + len + off, H / 2 + off);
        c.moveTo(W / 2 + off, H / 2 - gap - len + off); c.lineTo(W / 2 + off, H / 2 - gap + off); c.moveTo(W / 2 + off, H / 2 + gap + off); c.lineTo(W / 2 + off, H / 2 + gap + len + off);
        c.stroke();
      }
    },

    hudLabel(c, text, key, x, y, s) {
      c.font = `${Math.round(12 * s)}px ${FONT}`;
      const kw = 18 * s, tw = c.measureText(text).width, w = tw + kw + 22 * s, h = 22 * s, x0 = x - w / 2;
      plate(c, x0, y, w, h, s);
      c.fillStyle = '#e4d08a'; c.fillRect(x0 + 6 * s, y + 4 * s, kw, h - 8 * s);
      c.fillStyle = '#1a1810'; c.font = `bold ${Math.round(11 * s)}px ${FONT}`; c.textAlign = 'center'; c.fillText(key, x0 + 6 * s + kw / 2, y + 5 * s);
      c.textAlign = 'left'; c.fillStyle = '#e8e2c4'; c.font = `${Math.round(12 * s)}px ${FONT}`; c.fillText(text, x0 + kw + 14 * s, y + 5 * s);
    },

    drawMinimap(c, s, g) {
      const p = g.player, R = 64 * s, cx = 16 * s + R, cy = 14 * s + R, rim = 9 * s;
      c.save();
      c.beginPath(); c.arc(cx, cy, R, 0, C.TAU); c.fillStyle = '#0c120c'; c.fill(); c.clip();
      const scale = 1.35 * s, k = this.mapImg.width / M.SIZE;
      c.translate(cx, cy); c.rotate(p.yaw - Math.PI / 2); c.scale(scale, scale);
      c.globalAlpha = 0.95;
      c.drawImage(this.mapImg, -p.x * k, -(M.SIZE - p.y) * k);
      c.globalAlpha = 1;
      for (const a of g.actors) {
        if (!a.online || (a.invis && a.visibleT <= 0 && !a.dead)) continue;
        const dx = (a.x - p.x) * k, dy = -(a.y - p.y) * k;
        if (dx * dx + dy * dy > (R / scale) ** 2) continue;
        c.fillStyle = a.dead ? '#707070' : g.hostileToPlayer(a) ? '#ff4030' : a.friendly || a.follow ? '#40ff60' : a.faction === 'monster' ? '#ff4030' : '#e8d040';
        const d = 3.2 / scale * s;
        c.beginPath(); c.arc(dx, dy, d * 0.6, 0, C.TAU); c.fill();
      }
      c.restore();
      const gr = c.createRadialGradient(cx - R * 0.4, cy - R * 0.5, R * 0.2, cx, cy, R + rim);
      gr.addColorStop(0, '#8a8676'); gr.addColorStop(0.6, '#4a4740'); gr.addColorStop(1, '#1e1d1a');
      c.lineWidth = rim; c.strokeStyle = gr; c.beginPath(); c.arc(cx, cy, R + rim / 2, 0, C.TAU); c.stroke();
      c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,0.9)'; c.beginPath(); c.arc(cx, cy, R, 0, C.TAU); c.stroke(); c.beginPath(); c.arc(cx, cy, R + rim, 0, C.TAU); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,0.5)';
      for (let k = 0; k < 24; k++) { const a = k / 24 * C.TAU; c.beginPath(); c.moveTo(cx + Math.cos(a) * (R + 2 * s), cy + Math.sin(a) * (R + 2 * s)); c.lineTo(cx + Math.cos(a) * (R + rim - 2 * s), cy + Math.sin(a) * (R + rim - 2 * s)); c.stroke(); }
      for (const a of [0.8, 2.35, 3.9, 5.45]) bolt(c, cx + Math.cos(a) * (R + rim * 1.25), cy + Math.sin(a) * (R + rim * 1.25), 3.2 * s);
      const na = -(p.yaw - Math.PI / 2) - Math.PI / 2;
      const nx = cx + Math.cos(na) * (R + rim / 2), ny = cy + Math.sin(na) * (R + rim / 2);
      c.fillStyle = '#1a1814'; c.beginPath(); c.arc(nx, ny, 7 * s, 0, C.TAU); c.fill();
      c.fillStyle = '#e8e0c0'; c.font = `bold ${Math.round(10 * s)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('С', nx, ny + 0.5); c.textBaseline = 'top'; c.textAlign = 'left';
      c.fillStyle = '#f0f0d8'; c.strokeStyle = '#000'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx, cy - 7 * s); c.lineTo(cx - 5 * s, cy + 5 * s); c.lineTo(cx, cy + 2 * s); c.lineTo(cx + 5 * s, cy + 5 * s); c.closePath(); c.fill(); c.stroke();
      const o = this.trackedObjective(g);
      if (o && o.at) {
        const a = Math.atan2(o.at.y - p.y, o.at.x - p.x) - p.yaw, d = Math.hypot(o.at.x - p.x, o.at.y - p.y);
        const inside = d * scale * k < R - 6 * s, rr = inside ? d * scale * k : R + rim / 2;
        const ox = cx - Math.sin(a) * rr, oy = cy - Math.cos(a) * rr;
        c.fillStyle = o.main ? '#f0d050' : '#8cc0ff'; c.strokeStyle = '#000';
        c.save(); c.translate(ox, oy);
        if (inside) { c.rotate(Math.PI / 4); c.fillRect(-4 * s, -4 * s, 8 * s, 8 * s); c.strokeRect(-4 * s, -4 * s, 8 * s, 8 * s); }
        else { c.rotate(-a); c.beginPath(); c.moveTo(0, -7 * s); c.lineTo(-5 * s, 4 * s); c.lineTo(5 * s, 4 * s); c.closePath(); c.fill(); c.stroke(); }
        c.restore();
      }
    },

    drawClock(c, s, g) {
      const R = 64 * s, x = 14 * s, y = 14 * s + R * 2 + 14 * s;
      c.font = `bold ${Math.round(13 * s)}px ${FONT}`;
      const t = C.formatClock(g.time), tw = c.measureText(t).width;
      plate(c, x, y, tw + 16 * s, 22 * s, s);
      c.fillStyle = '#e6d9a4'; c.fillText(t, x + 8 * s, y + 5 * s);
      const o = this.trackedObjective(g);
      if (!o) return;
      c.font = `${Math.round(11 * s)}px ${FONT}`;
      const dist = o.at ? `  ${Math.round(Math.hypot(o.at.x - g.player.x, o.at.y - g.player.y))} м` : '';
      const text = o.text.length > 46 ? o.text.slice(0, 44) + '…' : o.text;
      const w = c.measureText(text + dist).width + 30 * s;
      plate(c, x + tw + 22 * s, y, w, 22 * s, s);
      C.Skin.glyph(c, 'target', x + tw + 33 * s, y + 11 * s, 12 * s, o.main ? '#f0d050' : '#8cc0ff');
      c.fillStyle = '#d8d0b0'; c.fillText(text, x + tw + 44 * s, y + 5 * s);
      if (dist) { c.fillStyle = '#f0d050'; c.fillText(dist, x + tw + 44 * s + c.measureText(text).width, y + 5 * s); }
    },

    drawStatusPanel(c, W, H, s, g) {
      const p = g.player, w = 250 * s, h = 76 * s, x = W - w - 14 * s, y = H - h - 14 * s;
      plate(c, x, y, w, h, s);
      bolt(c, x + 5 * s, y + 5 * s, 2.2 * s); bolt(c, x + w - 5 * s, y + 5 * s, 2.2 * s);
      const bx = x + 26 * s, bw = w - 36 * s;
      C.Skin.glyph(c, 'health', x + 14 * s, y + 13 * s, 12 * s, p.hp < 30 ? '#ff5a40' : '#d05a48');
      C.Skin.segBar(c, bx, y + 7 * s, bw, 11 * s, p.hp / 100, p.hp < 30 && this.frame % 30 < 15 ? '#ff5a3a' : '#c43c2c', 'rgba(24,10,8,0.85)', 3 * s);
      C.Skin.glyph(c, 'stamina', x + 14 * s, y + 29 * s, 12 * s, '#6a9ad0');
      C.Skin.segBar(c, bx, y + 23 * s, bw, 9 * s, p.stamina / 100, '#4a86c8', 'rgba(8,14,24,0.85)', 3 * s);
      const wit = g.activeWeapon();
      c.textBaseline = 'alphabetic';
      if (p.active === 'grenade') {
        const ic = this.hudIcon('f1', Math.round(34 * s));
        if (ic) c.drawImage(ic, x + 8 * s, y + 38 * s, 34 * s, 34 * s);
        c.fillStyle = '#efe6c0'; c.font = `bold ${Math.round(24 * s)}px ${FONT}`; c.textAlign = 'right'; c.fillText(String(g.countItem('f1')), x + w - 12 * s, y + h - 10 * s);
        c.font = `${Math.round(11 * s)}px ${FONT}`; c.fillStyle = '#b8b090'; c.textAlign = 'left'; c.fillText('Граната Ф-1', x + 48 * s, y + h - 12 * s);
      } else if (wit) {
        const wd = D.WEAPONS[wit.id];
        if (wd.melee) { c.font = `${Math.round(12 * s)}px ${FONT}`; c.fillStyle = '#d8d0b0'; c.fillText(wd.name, x + 12 * s, y + h - 14 * s); }
        else {
          const ammoId = 'ammo_' + wit.ammoType, ic = this.hudIcon(ammoId, Math.round(30 * s));
          if (ic) c.drawImage(ic, x + w - 40 * s, y + 38 * s, 30 * s, 30 * s);
          c.textAlign = 'right';
          c.font = `bold ${Math.round(28 * s)}px ${FONT}`; c.fillStyle = p.jammed ? '#ff6040' : '#f0e8c4'; c.fillText(String(wit.mag), x + w - 96 * s, y + h - 9 * s);
          c.font = `bold ${Math.round(14 * s)}px ${FONT}`; c.fillStyle = '#b8b090'; c.fillText(String(g.countItem(ammoId)), x + w - 48 * s, y + h - 12 * s);
          c.textAlign = 'left';
          const mode = wd.modes ? (wd.modes[wit.mode] === 'auto' ? 'A' : '1') : '';
          if (mode) { c.fillStyle = '#1a1810'; c.fillRect(x + 12 * s, y + 40 * s, 16 * s, 16 * s); c.strokeStyle = '#8a8068'; c.strokeRect(x + 12.5 * s, y + 40.5 * s, 15 * s, 15 * s); c.fillStyle = '#e8dca0'; c.font = `bold ${Math.round(11 * s)}px ${FONT}`; c.textAlign = 'center'; c.fillText(mode, x + 20 * s, y + 52.5 * s); c.textAlign = 'left'; }
          c.font = `${Math.round(10 * s)}px ${FONT}`; c.fillStyle = '#a8a088';
          c.fillText(wd.name, x + 34 * s, y + 51 * s);
          c.fillText(D.AMMO[wit.ammoType].name, x + 34 * s, y + 65 * s);
          if (p.jammed) { c.fillStyle = '#ff6040'; c.fillText('Клин — R', x + 34 * s, y + 37 * s + 0 * s); }
        }
      } else { c.font = `${Math.round(11 * s)}px ${FONT}`; c.fillStyle = '#8a8470'; c.fillText(p.detectorOut ? 'Детектор в руке' : 'Оружие убрано', x + 12 * s, y + h - 14 * s); }
      c.textAlign = 'left'; c.textBaseline = 'top';
    },

    drawQuick(c, H, s, g) {
      const p = g.player, bw = 46 * s, bh = 40 * s, y = H - bh - 14 * s;
      for (let i = 0; i < 4; i++) {
        const id = p.quick[i], x = 14 * s + i * (bw + 5 * s), n = id ? g.countItem(id) : 0;
        c.fillStyle = 'rgba(10,10,8,0.5)'; c.fillRect(x, y, bw, bh);
        c.strokeStyle = 'rgba(0,0,0,0.8)'; c.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
        if (id) {
          const ic = this.hudIcon(id, Math.round(34 * s));
          if (ic) { c.globalAlpha = n ? 1 : 0.35; c.drawImage(ic, x + (bw - 34 * s) / 2, y + 1 * s, 34 * s, 34 * s); c.globalAlpha = 1; }
          c.font = `bold ${Math.round(10 * s)}px ${FONT}`; c.textAlign = 'right'; c.fillStyle = n ? '#efe6c0' : '#6a6450'; c.fillText('×' + n, x + bw - 3 * s, y + 2 * s); c.textAlign = 'left';
        }
        c.fillStyle = '#1e1c16'; c.fillRect(x + bw / 2 - 11 * s, y + bh - 3 * s, 22 * s, 13 * s);
        c.fillStyle = '#c8bc90'; c.font = `bold ${Math.round(9 * s)}px ${FONT}`; c.textAlign = 'center'; c.fillText('F' + (i + 1), x + bw / 2, y + bh - 1 * s); c.textAlign = 'left';
      }
    },

    drawFeed(c, H, s, g, dt) {
      const x = 14 * s, bottom = H - 76 * s;
      let y = bottom;
      c.font = `${Math.round(11 * s)}px ${FONT}`;
      if (this.newsPop) {
        this.newsPop.t -= dt;
        const np = this.newsPop, w = 330 * s, h = 60 * s;
        y -= h + 6 * s;
        c.globalAlpha = clamp(np.t, 0, 1);
        plate(c, x, y, w, h, s);
        const look = C.senderLook ? C.senderLook(np.from) : null, face = this.hudFace(look);
        if (face) c.drawImage(face, x + 5 * s, y + 5 * s, 57 * s, 50 * s);
        else { c.fillStyle = '#0c120c'; c.fillRect(x + 5 * s, y + 5 * s, 57 * s, 50 * s); C.Skin.glyph(c, np.from === 'Центр' ? 'info' : 'pda', x + 33 * s, y + 30 * s, 26 * s, '#8fbf7a'); }
        c.strokeStyle = np.important ? '#e0c060' : '#3a4a36'; c.strokeRect(x + 4.5 * s, y + 4.5 * s, 58 * s, 51 * s);
        c.fillStyle = np.important ? '#f0d878' : '#a8d890'; c.font = `bold ${Math.round(11 * s)}px ${FONT}`; c.fillText(np.from, x + 70 * s, y + 6 * s);
        c.fillStyle = '#d8e0c8'; c.font = `${Math.round(11 * s)}px ${FONT}`;
        this.wrap(c, np.text, x + 70 * s, y + 21 * s, w - 78 * s, 13 * s, 3);
        c.globalAlpha = 1;
        if (np.t <= 0) this.newsPop = null;
      }
      for (const m of this.msgs) { m.t -= dt; if (!m.at) m.at = C.formatClock(g.time); }
      const list = this.msgs.slice(-5);
      for (let i = list.length - 1; i >= 0; i--) {
        const m = list[i];
        const [gl, gc] = msgGlyph(m);
        c.font = `${Math.round(11 * s)}px ${FONT}`;
        const text = m.text.length > 70 ? m.text.slice(0, 68) + '…' : m.text;
        const tw = c.measureText(text).width, w = tw + 70 * s, h = 20 * s;
        y -= h + 3 * s;
        c.globalAlpha = clamp(m.t, 0, 1);
        c.fillStyle = 'rgba(10,10,8,0.55)'; c.fillRect(x, y, w, h);
        C.Skin.glyph(c, gl, x + 11 * s, y + h / 2, 13 * s, gc);
        c.fillStyle = '#8a846c'; c.fillText(m.at, x + 22 * s, y + 4 * s);
        c.fillStyle = m.color || '#e8e0b0'; c.fillText(text, x + 60 * s, y + 4 * s);
      }
      c.globalAlpha = 1;
      this.msgs = this.msgs.filter(m => m.t > 0);
    },

    drawIndicators(c, W, H, s, g) {
      const p = g.player, list = [];
      if (p.bleed > 0.05) list.push(['bleed', p.bleed > 1.5 ? '#ff3a2a' : '#e05a3a', 'Кровотечение']);
      if (p.rad > 30 || g.radRate > 1) list.push(['rad', p.rad > 150 ? '#ff5020' : p.rad > 60 ? '#f0a030' : '#e8d840', g.radRate > 1 ? g.radRate.toFixed(1) : Math.round(p.rad) + '']);
      if (p.food < 20) list.push(['hunger', p.food < 8 ? '#ff6a3a' : '#e0a040', 'Голод']);
      if (g.totalWeight() > g.maxWeight()) list.push(['weight', '#e08040', 'Перегруз']);
      if (p.psy > 5) list.push(['psy', '#c080ff', 'Пси']);
      if (p.drunk > 20) list.push(['drunk', '#c0a0e0', 'Пьян']);
      if (g.inSafeZone()) list.push(['safe', '#90d890', 'Безопасно']);
      const sz = 28 * s, x = W - 14 * s - sz;
      let y = H - 76 * s - 14 * s - 8 * s - sz;
      c.font = `bold ${Math.round(9 * s)}px ${FONT}`; c.textAlign = 'center';
      for (const [gl, col, label] of list) {
        c.fillStyle = 'rgba(10,10,8,0.6)'; c.fillRect(x, y, sz, sz);
        c.strokeStyle = col; c.globalAlpha = 0.6; c.strokeRect(x + 0.5, y + 0.5, sz - 1, sz - 1); c.globalAlpha = 1;
        C.Skin.glyph(c, gl, x + sz / 2, y + sz / 2 - 2 * s, sz * 0.62, col);
        c.fillStyle = '#e8e0c0'; c.fillText(label.length > 6 ? '' : label, x + sz / 2, y + sz - 9 * s);
        y -= sz + 5 * s;
      }
      c.textAlign = 'left';
    },

    drawEmission(c, W, s, g) {
      const e = g.emission, p = g.player;
      if (e.phase !== 'warning' && e.phase !== 'strike') return;
      const left = e.phase === 'warning' ? Math.ceil(100 - e.t) : 0, safe = g.inShelter();
      const txt = e.phase === 'warning' ? `ВЫБРОС через ${left} с. ${safe ? 'Вы в укрытии.' : 'Срочно в укрытие!'}` : (safe ? 'Выброс. Вы в укрытии.' : 'ВЫБРОС!');
      c.font = `bold ${Math.round(16 * s)}px ${FONT}`;
      const tw = c.measureText(txt).width, x = W / 2 - tw / 2 - 30 * s, y = 20 * s;
      plate(c, x, y, tw + 60 * s, 30 * s, s);
      C.Skin.glyph(c, 'rad', x + 16 * s, y + 15 * s, 18 * s, safe ? '#a0e0a0' : '#ff6040');
      c.fillStyle = safe ? '#a0e0a0' : (this.frame % 30 < 15 ? '#ff6040' : '#ffb080'); c.fillText(txt, x + 34 * s, y + 7 * s);
      if (!safe) {
        const sh = C.shelterNearest(g);
        if (sh) { const d = Math.hypot(sh.x - p.x, sh.y - p.y); c.font = `${Math.round(12 * s)}px ${FONT}`; const t2 = `Ближайшее укрытие: ${sh.name || 'помещение'} — ${Math.round(d)} м`; const w2 = c.measureText(t2).width; plate(c, W / 2 - w2 / 2 - 10 * s, y + 34 * s, w2 + 20 * s, 20 * s, s); c.fillStyle = '#ffd0a0'; c.fillText(t2, W / 2 - w2 / 2, y + 38 * s); }
      }
    }
  };

  Object.assign(C.UI.prototype, methods);
})(globalThis.Cop98 = globalThis.Cop98 || {});
