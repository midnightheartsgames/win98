(function (Z) {
  'use strict';

  const AMBER = '#ffb53c', AMBER_DIM = 'rgba(255,181,60,0.45)', RED = '#ff5a3c';

  class Hud {
    constructor(ui) {
      this.ui = ui;
      this.cv = ui.hud;
      this.g = this.cv.getContext('2d');
      this.notes = [];
      this.xpPops = [];
      this.hitFlash = 0;
      this.radFlash = 0;
      this.time = 0;
    }

    onEvent(ev) {
      if (ev.t === 'msg') this.notes.push({ text: ev.text, kind: ev.kind, t: 0 });
      if (ev.t === 'xp') this.xpPops.push({ n: ev.n, t: 0 });
      if (ev.t === 'hurt' && ev.a && ev.a.kind === 'player') this.hitFlash = Math.min(1, this.hitFlash + 0.5);
      if (ev.t === 'rads' && ev.a && ev.a.kind === 'player') this.radFlash = 1.5;
      if (this.notes.length > 6) this.notes.shift();
    }

    resize() {
      const c = this.cv, dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      this.k = Math.max(0.6, h / 720);
      return [w, h];
    }

    font(px, bold = true) { this.g.font = (bold ? 'bold ' : '') + Math.round(px * this.k) + "px 'Courier New', monospace"; }

    glowText(t, x, y, col = AMBER, align = 'left') {
      const g = this.g;
      g.textAlign = align;
      g.shadowColor = 'rgba(255,150,30,0.7)';
      g.shadowBlur = 6 * this.k;
      g.fillStyle = col;
      g.fillText(t, x, y);
      g.shadowBlur = 0;
    }

    bar(x, y, w, h, frac, ticks, col = AMBER, dir = 1) {
      const g = this.g, k = this.k;
      g.strokeStyle = col; g.lineWidth = 1.5 * k;
      g.shadowColor = 'rgba(255,150,30,0.6)'; g.shadowBlur = 5 * k;
      const n = ticks || 20, gap = 2 * k, tw = (w - gap * (n - 1)) / n;
      const filled = Math.round(Z.clamp(frac, 0, 1) * n);
      for (let i = 0; i < n; i++) {
        const ix = dir > 0 ? i : n - 1 - i;
        const bx = x + ix * (tw + gap);
        g.fillStyle = i < filled ? col : 'rgba(255,181,60,0.12)';
        g.fillRect(bx, y, tw, h);
      }
      g.shadowBlur = 0;
    }

    compass(x, y, w, h) {
      const g = this.g, k = this.k, ui = this.ui, game = ui.game, p = game.player;
      const yaw = ui.view.yaw;
      g.save();
      g.beginPath(); g.rect(x, y, w, h); g.clip();
      g.strokeStyle = AMBER_DIM; g.lineWidth = 1 * k;
      g.strokeRect(x, y, w, h);
      const span = Math.PI * 0.9;
      const toX = a => x + w / 2 + Z.wrap(a - yaw) / span * w;
      const dirs = [['С', 0], ['СВ', Math.PI / 4], ['В', Math.PI / 2], ['ЮВ', Math.PI * 0.75], ['Ю', Math.PI], ['ЮЗ', -Math.PI * 0.75], ['З', -Math.PI / 2], ['СЗ', -Math.PI / 4]];
      this.font(12);
      for (const [n, a] of dirs) {
        const px = toX(a);
        if (px < x - 20 || px > x + w + 20) continue;
        this.glowText(n, px, y + h * 0.66, n.length === 1 ? AMBER : AMBER_DIM, 'center');
      }
      g.fillStyle = AMBER_DIM;
      for (let a = -Math.PI; a < Math.PI; a += Math.PI / 16) { const px = toX(a); g.fillRect(px, y + h - 4 * k, 1 * k, 3 * k); }
      for (const m of ui.compassMarks ? ui.compassMarks() : []) {
        const a = Z.yawOf(m.x - p.x, m.z - p.z), px = toX(a);
        if (px < x || px > x + w) continue;
        g.fillStyle = m.col || AMBER;
        if (m.kind === 'enemy') { g.fillStyle = RED; g.fillRect(px - 2 * k, y + 3 * k, 4 * k, 4 * k); }
        else if (m.kind === 'quest') { g.beginPath(); g.moveTo(px, y + h - 6 * k); g.lineTo(px - 5 * k, y + 3 * k); g.lineTo(px + 5 * k, y + 3 * k); g.closePath(); g.fill(); }
        else { g.fillRect(px - 2 * k, y + 3 * k, 4 * k, 4 * k); }
      }
      g.restore();
    }

    draw(dt) {
      const [W, H] = this.resize();
      const g = this.g, k = this.k, ui = this.ui, game = ui.game;
      this.time += dt;
      g.clearRect(0, 0, W, H);
      if (ui.fade > 0) { g.fillStyle = 'rgba(0,0,0,' + Math.min(1, ui.fade) + ')'; g.fillRect(0, 0, W, H); ui.fade = Math.max(0, ui.fade - dt * 1.6); }
      if (!game || !game.player || ui.mode !== 'play' && ui.mode !== 'fly' && ui.mode !== 'vats') return;
      if (ui.hideHud) return;
      const p = game.player;
      if (this.hitFlash > 0) {
        const grd = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
        grd.addColorStop(0, 'rgba(160,0,0,0)'); grd.addColorStop(1, 'rgba(160,0,0,' + (this.hitFlash * 0.45) + ')');
        g.fillStyle = grd; g.fillRect(0, 0, W, H);
        this.hitFlash = Math.max(0, this.hitFlash - dt * 1.5);
      }
      const m = 24 * k;
      this.font(13);
      this.glowText('ОЗ', m, H - m - 34 * k);
      this.bar(m + 32 * k, H - m - 44 * k, 190 * k, 12 * k, p.hp / p.hpMax, 24);
      const cr = Object.keys(p.crippled);
      if (cr.length) { this.font(11); this.glowText('УВЕЧЬЕ: ' + cr.map(l => Z.LIMB_NAMES[l]).join(', ').toUpperCase(), m + 32 * k, H - m - 52 * k, RED); }
      this.compass(m, H - m - 26 * k, 222 * k, 24 * k);
      this.font(13);
      this.glowText('ОД', W - m, H - m - 34 * k, AMBER, 'right');
      this.bar(W - m - 32 * k - 190 * k, H - m - 44 * k, 190 * k, 12 * k, p.ap / p.sheet.maxAP(), 24, AMBER, -1);
      const wd = p.weapon(), we = p.equip.weapon;
      if (we && wd && Z.itemIcon) {
        const sz = Math.round(46 * k), ic = Z.itemIcon(we.id, sz);
        g.globalAlpha = p.holstered ? 0.45 : 1;
        g.drawImage(ic, W - m - 74 * k - sz, H - m - sz + 4 * k, sz, sz);
        g.globalAlpha = 1;
      }
      if (wd && wd.mag && we) {
        this.font(18);
        this.glowText((we.loaded || 0) + '/' + p.count(wd.ammo), W - m, H - m - 6 * k, AMBER, 'right');
      } else if (wd && wd.thrown && we) {
        this.font(18);
        this.glowText(String(p.count(we.id)), W - m, H - m - 6 * k, AMBER, 'right');
      }
      if (we && wd.durab) {
        this.font(10);
        this.glowText('СОСТ', W - m - 232 * k, H - m - 10 * k, AMBER_DIM, 'left');
        this.bar(W - m - 196 * k, H - m - 16 * k, 76 * k, 6 * k, we.cond, 10, we.cond < 0.35 ? RED : AMBER_DIM, 1);
      }
      if (ui.scoped) this.scope(W, H);
      else this.crosshair(W, H);
      if (ui.stealthState) {
        const st = ui.stealthState();
        if (st) { this.font(12); this.glowText('[' + st.text + ']', W / 2, H / 2 - 28 * k, st.danger ? RED : AMBER, 'center'); }
      }
      if (ui.target) {
        const t = ui.target;
        this.font(13);
        this.glowText(t.name, W / 2, 46 * k, t.hostile ? RED : AMBER, 'center');
        if (t.hpFrac !== undefined) this.bar(W / 2 - 80 * k, 54 * k, 160 * k, 7 * k, t.hpFrac, 16, t.hostile ? RED : AMBER);
      }
      if (ui.prompt) {
        this.font(14);
        const pr = ui.prompt;
        this.glowText(pr.key + ') ' + pr.verb, W / 2, H / 2 + 48 * k, AMBER, 'center');
        if (pr.name) { this.font(13); this.glowText(pr.name, W / 2, H / 2 + 66 * k, pr.red ? RED : AMBER, 'center'); }
        if (pr.extra) { this.font(11); this.glowText(pr.extra, W / 2, H / 2 + 82 * k, AMBER_DIM, 'center'); }
      }
      let ny = 34 * k;
      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        n.t += dt;
        const a = n.t < 0.25 ? n.t / 0.25 : n.t > 5.5 ? Math.max(0, 1 - (n.t - 5.5) / 0.6) : 1;
        if (a <= 0) continue;
        g.globalAlpha = a;
        this.font(13);
        const lines = this.wrap(n.text, 420 * k);
        for (const ln of lines) { this.glowText(ln, m, ny, n.kind === 'warn' ? RED : AMBER); ny += 17 * k; }
        ny += 5 * k;
        g.globalAlpha = 1;
      }
      this.notes = this.notes.filter(n => n.t < 6.2);
      let xy = H - m - 70 * k;
      for (const x of this.xpPops) {
        x.t += dt;
        g.globalAlpha = Math.max(0, 1 - x.t / 3);
        this.font(13);
        this.glowText('ОПЫТ +' + x.n, W - m, xy - x.t * 10 * k, AMBER, 'right');
        xy -= 18 * k;
        g.globalAlpha = 1;
      }
      this.xpPops = this.xpPops.filter(x => x.t < 3);
      if (this.radFlash > 0) {
        this.radFlash -= dt;
        this.font(13);
        this.glowText('+РАД', m, H - m - 70 * k, RED);
      }
      if (ui.mode === 'fly') { this.font(12); this.glowText('СВОБОДНАЯ КАМЕРА (F8)', W / 2, 20 * k, AMBER, 'center'); }
    }

    crosshair(W, H) {
      const g = this.g, k = this.k, ui = this.ui;
      const fade = ui.view.third ? 1 : 1 - Z.clamp(((ui.aimT || 0) - 0.3) / 0.5, 0, 1);
      if (fade <= 0) return;
      const spread = ui.spreadPx || 10;
      const s = Math.max(6, spread) * k * (ui.view.third ? 1 - 0.4 * (ui.aimT || 0) : 1);
      g.globalAlpha = fade;
      g.strokeStyle = AMBER; g.lineWidth = 1.5 * k;
      g.shadowColor = 'rgba(255,150,30,0.7)'; g.shadowBlur = 4 * k;
      const cx = W / 2, cy = H / 2, l = 6 * k;
      g.beginPath();
      g.moveTo(cx - s - l, cy); g.lineTo(cx - s, cy);
      g.moveTo(cx + s, cy); g.lineTo(cx + s + l, cy);
      g.moveTo(cx, cy - s - l); g.lineTo(cx, cy - s);
      g.moveTo(cx, cy + s); g.lineTo(cx, cy + s + l);
      g.stroke();
      g.shadowBlur = 0;
      g.globalAlpha = 1;
    }

    scope(W, H) {
      const g = this.g, k = this.k, p = this.ui.game.player;
      const d = p.wv ? Z.item(p.wv.id) : null, kind = d ? Z.holdOf(d.model || d.id).scope : null;
      const cx = W / 2, cy = H / 2, R = H * 0.46;
      g.save();
      const lens = g.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
      lens.addColorStop(0, 'rgba(0,0,0,0)'); lens.addColorStop(0.85, 'rgba(0,0,0,0.35)'); lens.addColorStop(1, 'rgba(0,0,0,0.95)');
      g.fillStyle = lens;
      g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#000';
      g.beginPath(); g.rect(0, 0, W, H); g.arc(cx, cy, R, 0, Math.PI * 2, true); g.fill();
      g.strokeStyle = 'rgba(8,8,8,0.92)'; g.fillStyle = 'rgba(8,8,8,0.92)';
      if (kind === 'pso') {
        const u = R / 9;
        g.lineWidth = 1.6 * k;
        const chev = (y, s) => { g.beginPath(); g.moveTo(cx - s, y + s * 1.3); g.lineTo(cx, y); g.lineTo(cx + s, y + s * 1.3); g.stroke(); };
        chev(cy, u * 0.55);
        for (let i = 1; i <= 3; i++) chev(cy + u * (0.9 + i * 0.75), u * 0.32);
        g.beginPath(); g.moveTo(cx - u * 5, cy); g.lineTo(cx - u * 0.9, cy); g.moveTo(cx + u * 0.9, cy); g.lineTo(cx + u * 5, cy); g.stroke();
        for (let i = 1; i <= 5; i++) for (const sgn of [-1, 1]) { const x = cx + sgn * (u * 0.9 + i * u * 0.8); g.beginPath(); g.moveTo(x, cy); g.lineTo(x, cy + (i % 2 ? u * 0.25 : u * 0.45)); g.stroke(); }
        g.beginPath(); g.moveTo(cx - u * 6.2, cy + u * 4.6); g.lineTo(cx - u * 2.2, cy + u * 4.6);
        for (let i = 0; i <= 20; i++) { const t = i / 20, x = cx - u * 6.2 + t * u * 4, y = cy + u * 4.6 - u * 1.3 / (0.6 + t * 2.4); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
        g.stroke();
      } else {
        const w = 3.2 * k;
        g.beginPath(); g.moveTo(cx - w, cy + R); g.lineTo(cx - w, cy + w * 3); g.lineTo(cx, cy); g.lineTo(cx + w, cy + w * 3); g.lineTo(cx + w, cy + R); g.closePath(); g.fill();
        g.fillRect(cx - R, cy - w * 0.7, R * 0.82, w * 1.4);
        g.fillRect(cx + R * 0.18, cy - w * 0.7, R * 0.82, w * 1.4);
      }
      g.restore();
    }

    wrap(text, maxW) {
      const g = this.g, words = String(text).split(' '), lines = [];
      let cur = '';
      for (const w of words) {
        const t = cur ? cur + ' ' + w : w;
        if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
      }
      if (cur) lines.push(cur);
      return lines;
    }
  }

  Z.Hud = Hud;
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
