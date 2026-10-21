(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const { W, C } = H.UI_CONST;
  const STEEL = '#e8ecf4', STAR = '#ffd850', VIOLET = '#c88aff', VOLT = '#d8f040', HARE = '#e8e040';
  const cl = v => Math.max(0, Math.min(1, v));
  const PANEL = { w: 380, h: 126, y: 238 };

  function starPath(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath();
  }

  Object.assign(H.UI.prototype, {
    haresEvent(e) {
      const bt = this.bt;
      switch (e.t) {
        case 'steady':
          e.u.dSteady = e.v;
          if (e.text) this.floatAt(e.u, e.text, STEEL, 10);
          if (e.v > 0) this.sfx('buff');
          return true;
        case 'star':
          e.u.dStar = e.v;
          if (e.text) { this.floatAt(e.u, e.text, STAR, 11); this.sfx('glint'); }
          return true;
        case 'series':
          e.u.dSeries = e.v;
          if (e.v >= T.seriesMax) { this.floatAt(e.u, 'Серия ' + e.v, VOLT, 11); this.sfx('buff'); }
          return true;
        case 'case':
          e.u.dCase = e.v;
          return true;
        case 'field':
          if (e.on) {
            if (!bt.field || bt.field.off) { this.floatAt(e.src, e.text || 'Энергетическое поле', VIOLET, 12); this.sfx('debuff'); }
            bt.field = { turns: e.turns, a: bt.field ? bt.field.a : 0, t: bt.field ? bt.field.t : 0, off: false };
          } else if (bt.field) bt.field.off = true;
          return true;
        case 'chainAsk':
          bt.chainSel = null;
          bt.chainT = 0;
          this.sfx('star4');
          return true;
        case 'chainSkip':
          this.floatAt(e.u, 'Без цепочки', C.sub, 10);
          return true;
        case 'chainEnd':
          bt.chainSel = null;
          return true;
      }
      return false;
    },

    haresUpdate(dt) {
      const bt = this.bt, f = bt.field;
      if (f) {
        f.t += dt;
        f.a = f.off ? Math.max(0, f.a - dt * 2.5) : Math.min(1, f.a + dt * 3);
        if (f.off && f.a <= 0) bt.field = null;
      }
      if (this.chainOpen()) bt.chainT = (bt.chainT || 0) + dt;
    },

    chainOpen() {
      const b = this.game.battle, bt = this.bt;
      return !!(b && bt && !bt.result && !bt.ult && !bt.queue.length && !bt.cur && b.chainReady && b.chainReady());
    },

    chainIndex() {
      const b = this.game.battle, bt = this.bt, cands = b.chainCur.cands;
      if (bt.chainSel == null || bt.chainSel >= cands.length) bt.chainSel = Math.max(0, cands.indexOf(b.chainAuto()));
      return bt.chainSel;
    },

    chainPick(p) {
      const b = this.game.battle;
      if (!b || !b.chainReady()) return;
      this.sfx(p ? 'confirm' : 'cancel');
      this.bt.chainSel = null;
      b.chain(p);
      this.pullEvents();
    },

    chainKey(k, code) {
      const b = this.game.battle, bt = this.bt, cands = b.chainCur.cands;
      if (k === 'left' || k === 'right') { bt.chainSel = (this.chainIndex() + (k === 'left' ? -1 : 1) + cands.length) % cands.length; this.sfx('select'); return; }
      if (/^Digit[1-4]$/.test(code)) {
        const a = b.allies[+code.slice(5) - 1], i = cands.indexOf(a);
        if (i >= 0) { if (bt.chainSel === i) this.chainPick(a); else { bt.chainSel = i; this.sfx('select'); } }
        return;
      }
      if (k === 'ok') { this.chainPick(cands[this.chainIndex()]); return; }
      if (k === 'back') this.chainPick(null);
    },

    haresBack(c, lay) {
      const f = this.bt.field;
      if (!f || f.a <= 0) return;
      const pts = [...lay.entries()].filter(([u]) => !u.dead && !u.gone).map(([, p]) => p);
      if (!pts.length) return;
      const x0 = Math.min(...pts.map(p => p.x - p.s * 0.4)), x1 = Math.max(...pts.map(p => p.x + p.s * 0.4)), cy = Math.max(...pts.map(p => p.y)) + 4;
      const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2 + 30, ry = 26, top = Math.min(...pts.map(p => p.y - p.s));
      c.save();
      c.globalAlpha = f.a;
      const gr = c.createRadialGradient(cx, cy, 4, cx, cy, rx);
      gr.addColorStop(0, 'rgba(200,138,255,0.42)'); gr.addColorStop(0.7, 'rgba(140,70,220,0.22)'); gr.addColorStop(1, 'rgba(90,40,160,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(214,170,255,0.55)'; c.lineWidth = 1.5;
      c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = 'rgba(214,170,255,0.18)';
      c.beginPath(); c.ellipse(cx, cy, rx, cy - top + 20, 0, Math.PI, Math.PI * 2); c.stroke();
      c.lineWidth = 1;
      for (let i = 0; i < 18; i++) {
        const k = (f.t * 0.45 + G.hash(i, 7, 3)) % 1, an = G.hash(i, 2, 9) * Math.PI * 2, r = 1 - k;
        c.fillStyle = i % 3 ? 'rgba(232,200,255,0.8)' : 'rgba(255,120,200,0.8)';
        c.fillRect(cx + Math.cos(an) * rx * r - 1, cy - 20 + Math.sin(an) * (ry + 30) * r - 1, 3, 3);
      }
      c.restore();
      this.text('Поле · ' + f.turns, cx - rx + 14, cy + ry - 6, { size: 9, bold: true, col: VIOLET });
    },

    haresField(c, lay) {
      if (!this.chainOpen()) return;
      const b = this.game.battle, p = lay.get(b.chainCur.tgt);
      if (!p) return;
      const t = this.bt.chainT || 0, k = 0.5 + 0.5 * Math.sin(t * 8);
      c.save();
      c.strokeStyle = 'rgba(232,240,64,' + (0.5 + 0.4 * k).toFixed(2) + ')'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(p.x, p.y + 4, p.s * 0.42, 13, 0, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 6; i++) {
        const an = i / 6 * Math.PI * 2 + t * 2, r = p.s * 0.48;
        const x = p.x + Math.cos(an) * r, y = p.y - p.s * 0.45 + Math.sin(an) * r * 0.6;
        c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 3, y); c.lineTo(x - 1, y); c.lineTo(x + 2, y + 6); c.stroke();
      }
      c.restore();
    },

    haresOver(c) {
      if (!this.chainOpen()) return;
      const b = this.game.battle, bt = this.bt, ch = b.chainCur, cands = ch.cands, sel = this.chainIndex();
      const a = cl((bt.chainT || 0) * 6), x = W / 2 - PANEL.w / 2, y = PANEL.y + (1 - a) * 20;
      c.save(); c.globalAlpha = a;
      this.win(x, y, PANEL.w, PANEL.h, { border: HARE, alpha: 0.94 });
      this.text('ЦЕПОЧКА АТАК!', x + 14, y + 7, { size: 18, bold: true, serif: true, col: HARE });
      this.text(this.fitText(ch.tgt.name + ' пробит. Кто бьёт следом?', 10, PANEL.w - 28), x + 14, y + 30, { size: 10, col: C.cream });
      const step = 70, x0 = x + PANEL.w / 2 - (cands.length * step - 10) / 2;
      cands.forEach((u, i) => {
        const px = x0 + i * step, py = y + 48, on = i === sel;
        c.fillStyle = on ? 'rgba(232,224,64,0.25)' : 'rgba(0,0,0,0.4)'; c.fillRect(px - 2, py - 2, 64, 54);
        G.drawPortrait(c, G.lookOf(u.charId, this.game), px + 6, py, 48);
        c.strokeStyle = on ? HARE : 'rgba(255,255,255,0.25)'; c.lineWidth = on ? 2 : 1; c.strokeRect(px - 1.5, py - 1.5, 63, 53); c.lineWidth = 1;
        G.elemIcon(c, u.elem, px + 54, py + 8, 6);
        this.text(this.fitText(u.name, 9, 62), px + 30, py + 54, { size: 9, bold: on, align: 'center', col: on ? HARE : C.cream });
        this.hit(px - 2, py - 2, 64, 64, () => { if (bt.chainSel === i) this.chainPick(u); else { bt.chainSel = i; this.sfx('select'); } });
      });
      const p = cands[sel];
      if (p && H.battleStat.alive(ch.tgt)) {
        const o = { e: p.elem, kind: 'follow' }, lo = b.dmgCalc(p, ch.tgt, T.chainAtk, o, false), hi = b.dmgCalc(p, ch.tgt, T.chainAtk, o, true);
        this.text(H.fmt(lo) + '~' + H.fmt(hi), x + PANEL.w - 14, y + 12, { size: 10, bold: true, align: 'right', col: '#ffb0b0' });
        if (b.hareLink(b.allies.find(u => u.charId === 'anby'))) this.text('+' + T.chainEnergy + ' энергии', x + PANEL.w - 14, y + 26, { size: 9, align: 'right', col: '#9ad0ff' });
      }
      this.hints([['←→', 'Выбор'], ['Enter', 'Удар'], ['Esc', 'Пропустить']], x + 14, y + PANEL.h - 16, { col: C.sub });
      this.hit(x + PANEL.w - 96, y + PANEL.h - 20, 84, 16, () => this.chainPick(null));
      c.restore();
    },

    haresCard(c, u, x, y, tags, tx) {
      const b = this.game.battle;
      const val = (d, k) => (u[d] == null ? u.flags[k] || 0 : u[d]);
      if (u.charId === 'billy') {
        const st = val('dSteady', 'steady'), sr = val('dStar', 'star');
        for (let k = 0; k < T.steadyMax; k++) this.diamond(x + 9 + k * 8, y + 93, 3, k < st ? STEEL : '#20263e', '#0a1020');
        for (let k = 0; k < T.starMax; k++) { starPath(c, x + 9 + (T.steadyMax + k) * 8 + 2, y + 93, 4); c.fillStyle = k < sr ? STAR : '#20263e'; c.fill(); }
        tx = x + 14 + (T.steadyMax + T.starMax) * 8;
      }
      if (u.charId === 'nicole') {
        const n = val('dCase', 'caseShots');
        for (let k = 0; k < T.caseShots; k++) this.diamond(x + 9 + k * 8, y + 93, 3, k < n ? VIOLET : '#20263e', '#0a1020');
        tx = x + 12 + T.caseShots * 8;
      }
      if (u.charId === 'anby') {
        const n = val('dSeries', 'series');
        for (let k = 0; k < T.seriesMax; k++) this.diamond(x + 9 + k * 8, y + 93, 3, k < n ? VOLT : '#20263e', '#0a1020');
        tx = x + 12 + T.seriesMax * 8;
        if (n >= T.seriesMax) tags.unshift('Гром');
      }
      if (b && u.kit && u.kit.faction === 'hares' && b.hareLink(u)) {
        c.strokeStyle = HARE; c.lineWidth = 1.5;
        c.beginPath(); c.ellipse(x + 50, y + 9, 3.5, 2.5, 0, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.ellipse(x + 55, y + 9, 3.5, 2.5, 0, 0, Math.PI * 2); c.stroke();
        c.lineWidth = 1;
      }
      if (this.chainOpen() && b.chainCur.cands.includes(u)) {
        const on = b.chainCur.cands[this.chainIndex()] === u;
        c.strokeStyle = on ? HARE : 'rgba(232,224,64,0.45)'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, 106, 98); c.lineWidth = 1;
      }
      return tx;
    },

    haresFoeTags(u, tags) {
      const f = this.bt.field;
      if (f && !f.off && u.side === 'enemy') tags.push('Защ −' + Math.round(T.fieldDef * 100) + '%');
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
