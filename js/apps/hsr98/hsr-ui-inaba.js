(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, C } = H.UI_CONST;
  const INTENT = { single: ['Удар', '#ffb070'], blast: ['Удар по группе', '#ff9050'], all: ['Удар по всем', '#ff5050'], charge: ['Заряд', '#ffd040'], lock: ['Прицел', '#ff70d0'], summon: ['Подмога', '#c0a0ff'], rally: ['Приказ', '#ffd090'], self: ['Усиление', '#90d0ff'] };
  const cl = v => Math.max(0, Math.min(1, v));

  Object.assign(H.UI.prototype, {
    inabaEvent(e) {
      const bt = this.bt;
      switch (e.t) {
        case 'oneMore':
          bt.oneMore = { u: e.u, t: 0, aoa: !!e.aoa };
          bt.shake = Math.max(bt.shake, 6);
          this.sfx('star4');
          return true;
        case 'aoa':
          bt.aoa = { u: e.u, team: e.team, foes: e.foes, t: 0 };
          bt.shake = Math.max(bt.shake, 10);
          this.sfx('ult');
          return true;
        case 'aoaEnd':
          if (e.win) { bt.big = { text: 'ФИНИШ!', sub: 'Атака всем отрядом', col: '#ffd040', t: 1 }; this.sfx('crit'); }
          return true;
        case 'persona':
          this.floatAt(e.u, 'Персона: ' + e.name, H.ELEMENTS[e.e].col, 12);
          this.sfx('glint');
          return true;
        case 'stitch':
          bt.stitch = e.a && e.b ? { a: e.a, b: e.b, t: 0 } : null;
          if (e.a) { this.floatAt(e.a, 'Стежок', '#f4f0ff', 11); this.floatAt(e.b, 'Стежок', '#f4f0ff', 11); this.sfx('debuff'); }
          return true;
        case 'intent': return true;
        case 'warn':
          this.floatAt(e.u, 'Осторожно!', '#ff8ac8', 14);
          bt.msg = e.text; bt.msgT = 1.2; bt.msgWarn = true;
          this.sfx('shield');
          return true;
        case 'scan': return true;
      }
      return false;
    },

    inabaUpdate(dt) {
      const bt = this.bt;
      if (bt.oneMore) { bt.oneMore.t += dt; if (bt.oneMore.t > 1.1) bt.oneMore = null; }
      if (bt.aoa) { bt.aoa.t += dt; if (bt.aoa.t > 1.5) bt.aoa = null; }
      if (bt.stitch) bt.stitch.t += dt;
    },

    askAllOut() {
      const b = this.game.battle, bt = this.bt;
      if (!b || bt.auto || !b.aoaReady()) return;
      bt.sub = { type: 'aoa', sel: 0 };
    },

    aoaOptions() {
      const b = this.game.battle;
      return [
        { label: 'Атака всем отрядом!', right: 'весь отряд', rcol: C.gold, fn: () => { b.allOut(); this.pullEvents(); } },
        { label: 'Нет, обычный ход', right: 'ещё раз', fn: () => { } }
      ];
    },

    drawStitch(c, lay) {
      const bt = this.bt, s = bt.stitch;
      if (!s || !lay.has(s.a) || !lay.has(s.b) || !H.battleStat.alive(s.a) || !H.battleStat.alive(s.b)) return;
      const pa = lay.get(s.a), pb = lay.get(s.b), ya = pa.y - pa.s * 0.45, yb = pb.y - pb.s * 0.45, n = 14;
      c.save();
      c.strokeStyle = 'rgba(250,246,255,0.85)'; c.lineWidth = 1.5;
      c.beginPath();
      for (let i = 0; i <= n; i++) { const k = i / n, x = pa.x + (pb.x - pa.x) * k, y = ya + (yb - ya) * k + Math.sin(k * Math.PI) * 18 + Math.sin(this.t * 4 + i) * 1.5; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      c.stroke();
      c.strokeStyle = '#c8243a'; c.lineWidth = 2;
      for (let i = 1; i < n; i += 2) { const k = i / n, x = pa.x + (pb.x - pa.x) * k, y = ya + (yb - ya) * k + Math.sin(k * Math.PI) * 18; c.beginPath(); c.moveTo(x - 3, y - 4); c.lineTo(x + 3, y + 4); c.stroke(); }
      c.restore();
    },

    intentTag(c, u, p) {
      const b = this.game.battle;
      if (!b || !b.intentOf) return;
      const sk = b.intentOf(u);
      if (!sk) return;
      const [label, col] = sk.t === 'charge' || u.charging != null ? INTENT.charge : INTENT[sk.t] || INTENT.single;
      const y = u.data.boss ? p.y - p.s - 20 : p.y - p.s - 76, txt = '▶ ' + label + ': ' + sk.n, w = Math.min(190, this.measure(txt, 9, true) + 12);
      c.fillStyle = 'rgba(30,6,24,0.82)'; c.fillRect(p.x - w / 2, y, w, 14);
      c.fillStyle = col; c.fillRect(p.x - w / 2, y, 2, 14);
      this.text(this.fitText(txt, 9, w - 8, true), p.x, y + 1, { align: 'center', size: 9, bold: true, col });
    },

    drawPersonaModes(c, u) {
      const P = H.INABA.PERSONAS, sel = u.flags.skillSel | 0, lock = !!u.flags.personaLock, w = 128, x = W - 8 - w, y = 248;
      c.fillStyle = 'rgba(4,6,20,0.82)'; c.fillRect(x, y, w, 56);
      c.fillStyle = 'rgba(255,216,80,0.6)'; c.fillRect(x, y, w, 1);
      this.text('Персона', x + 6, y + 3, { size: 9, bold: true, col: '#ffd850' });
      this.text(lock ? 'до след. хода' : '↑↓', x + w - 6, y + 3, { size: 9, align: 'right', col: lock ? '#ff9a8a' : C.sub });
      P.forEach((p, i) => {
        const yy = y + 16 + i * 13, on = i === sel;
        if (on) { c.fillStyle = 'rgba(255,216,80,0.18)'; c.fillRect(x + 2, yy - 1, w - 4, 13); }
        G.elemIcon(c, p.elem, x + 10, yy + 5, 4);
        this.text(p.name, x + 20, yy, { size: 10, bold: on, col: on ? '#ffe890' : lock ? C.dim : C.cream });
        if (!lock) this.hit(x, yy - 1, w, 13, () => this.setSkillMode(i));
      });
    },

    inabaTags(u, tags) {
      if (u.kit.personas) tags.unshift(H.INABA.PERSONAS[u.flags.skillSel | 0].name);
      if (u.flags.oneMore) tags.unshift('Ещё раз!');
      if (u.charId === 'yosuke' && u.flags.strike) tags.push('Подхват');
      if (u.charId === 'kanji' && u.flags.stitch) tags.push('Стежок ' + u.flags.stitch.turns);
      if (u.flags.freeSkill) tags.push('Навык 0');
    },

    drawOneMore(c) {
      const om = this.bt.oneMore;
      if (!om) return;
      const t = om.t, a = cl(t * 6) * cl((1.1 - t) * 5), slide = 1 - cl(t * 5), y = 200;
      c.save(); c.globalAlpha = a;
      c.translate(-slide * 300, 0);
      c.fillStyle = 'rgba(0,0,0,0.75)'; c.beginPath(); c.moveTo(0, y - 6); c.lineTo(W, y - 46); c.lineTo(W, y + 30); c.lineTo(0, y + 70); c.fill();
      c.fillStyle = '#ffd040'; c.beginPath(); c.moveTo(0, y - 6); c.lineTo(W, y - 46); c.lineTo(W, y - 40); c.lineTo(0, y); c.fill();
      c.beginPath(); c.moveTo(0, y + 64); c.lineTo(W, y + 24); c.lineTo(W, y + 30); c.lineTo(0, y + 70); c.fill();
      G.drawBust(c, G.lookOf(om.u.charId, this.game), 60, y - 64, 2);
      this.text('ЕЩЁ РАЗ!', W / 2 + 40, y - 14, { align: 'center', size: 36, bold: true, serif: true, col: '#ffe060' });
      this.text(om.aoa ? 'Все враги пробиты!' : om.u.name + ' ходит снова', W / 2 + 40, y + 26, { align: 'center', size: 12, bold: true, col: C.cream });
      c.restore();
    },

    drawAoa(c, lay) {
      const s = this.bt.aoa;
      if (!s) return;
      const t = s.t, a = cl(t * 5) * cl((1.5 - t) * 4), pts = s.foes.filter(u => lay.has(u)).map(u => lay.get(u));
      if (!pts.length) return;
      const cx = pts.reduce((v, p) => v + p.x, 0) / pts.length, cy = pts.reduce((v, p) => v + p.y - p.s * 0.45, 0) / pts.length, R = 90 + pts.length * 30;
      c.save(); c.globalAlpha = a;
      for (let i = 0; i < 22; i++) {
        const an = i / 22 * Math.PI * 2 + t * 2, r = R * (0.5 + 0.5 * G.hash(i, 3, 17)) * (0.8 + 0.2 * Math.sin(t * 9 + i)), x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r * 0.5;
        c.fillStyle = i % 3 ? '#e8e4dc' : '#bcb6ac'; c.beginPath(); c.arc(x, y, 22 + 14 * G.hash(i, 4, 17), 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = '#f4f0e8'; c.beginPath(); c.ellipse(cx, cy, R * 0.7, R * 0.38, 0, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 8; i++) {
        const k = (t * 3 + i * 0.37) % 1, an = G.hash(i, 5, 19) * Math.PI * 2, x = cx + Math.cos(an) * R * 0.45 * k, y = cy + Math.sin(an) * R * 0.25 * k;
        c.fillStyle = i % 2 ? '#ffd040' : '#ff6a40';
        c.beginPath(); for (let j = 0; j < 10; j++) { const rr = j % 2 ? 4 : 10, aa = j / 10 * Math.PI * 2; c.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); } c.closePath(); c.fill();
      }
      s.team.forEach((m, i) => {
        const k = (t * 2.4 + i * 0.27) % 1, an = i / s.team.length * Math.PI * 2 + t, x = cx + Math.cos(an) * R * 0.4, y = cy + Math.sin(an) * R * 0.2 - Math.sin(k * Math.PI) * 14;
        G.drawPortrait(c, G.lookOf(m.charId, this.game), x - 16, y - 16, 32);
      });
      this.text('АТАКА ВСЕМ ОТРЯДОМ', cx, cy - R * 0.5 - 30, { align: 'center', size: 18, bold: true, serif: true, col: '#ffd040' });
      c.restore();
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
