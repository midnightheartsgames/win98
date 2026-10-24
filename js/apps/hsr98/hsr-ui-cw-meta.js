(function (H) {
  'use strict';
  const G = H.Gfx, CW = H.CW;
  const { W, HGT, C } = H.UI_CONST;
  const { K } = H.CW_UI;

  function rewardText(g) {
    if (!g) return '';
    if (g.plate) return 'Плашка «' + g.plate + '»';
    const out = [];
    if (g.jade) out.push(g.jade + ' нефрита');
    if (g.credits) out.push(H.fmt(g.credits) + ' кредитов');
    for (const [id, n] of Object.entries(g.items || {})) out.push(H.ITEMS[id].name + (n > 1 ? ' ×' + n : ''));
    return out.join(', ');
  }

  function rewardGlyph(ui, c, g, x, y, s, got, ready) {
    c.fillStyle = got ? '#1a2a1a' : ready ? '#3a2a08' : '#0e1230'; c.fillRect(x, y, s, s);
    c.strokeStyle = got ? '#3a7a4a' : ready ? K.gold : '#2a3460'; c.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
    const id = g && g.items ? Object.keys(g.items)[0] : null;
    if (id && G.itemIcon) G.itemIcon(c, id, x + 4, y + 4, s - 8);
    else if (g && g.jade) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + s / 2, y + 6); c.lineTo(x + s - 7, y + s / 2); c.lineTo(x + s / 2, y + s - 6); c.lineTo(x + 7, y + s / 2); c.closePath(); c.fill(); c.fillStyle = '#9ad8ff'; c.fillRect(x + s / 2 - 2, y + s / 2 - 2, 4, 4); }
    else if (g && g.credits) ui.cwCoin(x + s / 2, y + s / 2, s / 3);
    else if (g && g.plate) { c.fillStyle = K.gold; c.fillRect(x + 5, y + s / 2 - 4, s - 10, 8); }
    if (got) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x, y, s, s); ui.text('✓', x + s / 2, y + s / 2 - 8, { align: 'center', size: 14, bold: true, col: C.ok }); }
  }

  Object.assign(H.UI.prototype, {
    cwRewardText: rewardText,

    cwClaimSay(lines) {
      if (!lines) { this.sfx('deny'); return; }
      this.sfx('chest');
      this.toast('Получено: ' + lines.join(', '));
      this.game.emit({ t: 'autosave' });
    },

    openCwAsc() {
      const ui = this, g = this.game, M = CW.META;
      return this.push({
        full: true, cw: true, sel: Math.max(1, Math.min(M.ascMax, g.cwAscLvl() || 1)),
        draw(c) {
          const C0 = g.cwMeta(), lv = g.cwAscLvl();
          ui.cwBoardBack(c);
          ui.plate(16, 14, 'Уровень продвижения');
          ui.cwHex(W / 2, 74, 30, K.gold, '');
          ui.text(lv >= M.ascMax ? 'МАКС' : String(lv), W / 2, 62, { align: 'center', size: 20, bold: true, serif: true, col: '#141018', shadow: false });
          ui.text(lv >= M.ascMax ? 'Макс. уровень' : H.fmt(C0.asc.pts % M.ascPer) + ' / ' + M.ascPer + ' до уровня ' + (lv + 1), W / 2, 112, { align: 'center', size: 11, col: C.sub });
          ui.text('Всего очков продвижения: ' + H.fmt(C0.asc.pts), W / 2, 128, { align: 'center', size: 10, col: C.dim });
          const first = Math.max(1, Math.min(M.ascMax - 7, this.sel - 3)), y = 200;
          c.fillStyle = '#2a2a3a'; c.fillRect(16, y + 40, W - 32, 4); c.fillRect(16, y + 56, W - 32, 4);
          for (let x = 22; x < W - 20; x += 18) { c.fillStyle = '#4a3a2a'; c.fillRect(x, y + 36, 8, 28); }
          for (let i = 0; i < 8; i++) {
            const l = first + i, x = 26 + i * 74, R = M.asc[l], got = C0.asc.got.includes(l), ready = l <= lv && !got, on = l === this.sel;
            ui.text('Ур. ' + l, x + 30, y - 14, { align: 'center', size: 10, bold: true, col: on ? K.gold : l <= lv ? C.cream : C.dim });
            rewardGlyph(ui, c, R, x + 6, y, 48, got, ready);
            if (on) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(x + 4, y - 2, 52, 52); c.lineWidth = 1; }
            ui.hit(x + 6, y, 48, 48, () => { if (this.sel === l) this.claim(); else { this.sel = l; ui.sfx('select'); } });
          }
          const R = M.asc[this.sel], got = C0.asc.got.includes(this.sel);
          ui.win(80, 300, 480, 86, { corners: false, border: K.gold });
          ui.text('Уровень ' + this.sel, 96, 312, { size: 12, bold: true, col: K.gold });
          ui.text(rewardText(R), 96, 330, { size: 11, col: C.cream });
          ui.button(400, 348, 144, 26, got ? 'Получено' : this.sel <= lv ? 'Забрать' : 'Ещё не открыто', () => this.claim(), { disabled: got || this.sel > lv, active: !got && this.sel <= lv, bold: true });
          ui.wheelZone(0, 180, W, 100, d => { this.sel = Math.max(1, Math.min(M.ascMax, this.sel + d)); });
          ui.hints([['←→', 'Листать'], ['Enter', 'Забрать'], ['Esc', 'Назад']], W / 2, HGT - 22, { align: 'center' });
        },
        claim() { ui.cwClaimSay(g.cwClaimAsc(this.sel)); },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = Math.max(1, Math.min(M.ascMax, this.sel + (k === 'left' ? -1 : 1))); ui.sfx('select'); }
          if (k === 'ok') this.claim();
          if (k === 'back') ui.pop();
        }
      });
    },

    openCwWeek() {
      const ui = this, g = this.game, M = CW.META;
      return this.push({
        full: true, cw: true, sel: 0,
        draw(c) {
          const wk = g.cwMeta().week, wl = g.cwWeekLeft();
          ui.cwBoardBack(c);
          ui.plate(16, 14, 'Награды за очки');
          ui.text('Очки Валютных войн за неделю. Неделя режима длится 2 часа.', 16, 46, { size: 11, col: C.sub });
          const x0 = 20, w = 60, y = 150;
          M.week.forEach(([need, R], i) => {
            const x = x0 + i * w, got = wk.got.includes(i), ready = wk.pts >= need && !got, on = i === this.sel;
            rewardGlyph(ui, c, R, x + 6, y, 46, got, ready);
            if (on) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(x + 4, y - 2, 50, 50); c.lineWidth = 1; }
            ui.text(H.fmt(need), x + 29, y + 74, { align: 'center', size: 9, bold: true, col: wk.pts >= need ? K.gold : C.dim });
            ui.hit(x + 6, y, 46, 46, () => { if (this.sel === i) this.claim(); else { this.sel = i; ui.sfx('select'); } });
          });
          c.fillStyle = '#1a1e3e'; c.fillRect(x0 + 6, y + 58, w * 10 - 12, 8);
          c.fillStyle = K.gold; c.fillRect(x0 + 6, y + 58, Math.round((w * 10 - 12) * Math.min(1, wk.pts / M.weekMax)), 8);
          const R = M.week[this.sel];
          ui.win(80, 270, 480, 80, { corners: false, border: K.gold });
          ui.text(H.fmt(R[0]) + ' очков', 96, 282, { size: 12, bold: true, col: K.gold });
          ui.text(rewardText(R[1]), 96, 300, { size: 11, col: C.cream });
          const got = wk.got.includes(this.sel);
          ui.button(400, 314, 144, 26, got ? 'Получено' : wk.pts >= R[0] ? 'Забрать' : 'Не хватает очков', () => this.claim(), { disabled: got || wk.pts < R[0], active: !got && wk.pts >= R[0], bold: true });
          ui.text('Сейчас: ' + H.fmt(wk.pts) + ' / ' + H.fmt(M.weekMax), 16, 380, { size: 12, bold: true, col: C.cream });
          ui.text('Сброс через ' + Math.floor(wl / 3600000) + ' ч ' + Math.floor(wl % 3600000 / 60000) + ' мин. Запас двойных очков продвижения: ' + H.fmt(wk.dbl), 16, 398, { size: 10, col: C.sub });
          ui.hints([['←→', 'Выбор'], ['Enter', 'Забрать'], ['Esc', 'Назад']], W / 2, HGT - 22, { align: 'center' });
        },
        claim() { ui.cwClaimSay(g.cwClaimWeek(this.sel)); },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = (this.sel + (k === 'left' ? 9 : 1)) % 10; ui.sfx('select'); }
          if (k === 'ok') this.claim();
          if (k === 'back') ui.pop();
        }
      });
    },

    openCwRankRewards() {
      const ui = this, g = this.game, M = CW.META;
      return this.push({
        full: true, cw: true, sel: 0,
        draw(c) {
          const C0 = g.cwMeta(), best = g.cwRankBest();
          ui.cwBoardBack(c);
          ui.plate(16, 14, 'Награды за ранг');
          ui.win(40, 44, 560, 368, { corners: false, border: K.gold });
          ['Ранг', 'Награда', ''].forEach((h, i) => ui.text(h, [60, 240, 560][i], 56, { size: 10, bold: true, col: C.sub, align: i === 2 ? 'right' : 'left' }));
          CW.RANKS.forEach((R, t) => {
            const y = 76 + t * 36, got = C0.rankGot.includes(t), open = best.tier >= t, on = t === this.sel, Rw = M.rank[t];
            if (on) { c.fillStyle = 'rgba(255,212,113,0.15)'; c.fillRect(48, y - 4, 544, 32); }
            c.globalAlpha = open ? 1 : 0.35; ui.cwRankMark(t, 68, y + 12, 26); c.globalAlpha = 1;
            ui.text(R.name, 88, y + 5, { size: 11, bold: true, col: open ? C.cream : C.dim });
            ui.text(H.fmt(Rw.pts) + ' очков продвижения, ' + rewardText(Rw), 240, y + 5, { size: 10, col: open ? C.cream : C.dim });
            ui.button(500, y, 80, 22, got ? 'Получено' : open ? 'Забрать' : 'Закрыто', () => { this.sel = t; this.claim(); }, { disabled: got || !open, active: on && open && !got, size: 10 });
          });
          ui.hints([['↑↓', 'Ранг'], ['Enter', 'Забрать'], ['Esc', 'Назад']], W / 2, HGT - 22, { align: 'center' });
        },
        claim() { ui.cwClaimSay(g.cwClaimRank(this.sel)); },
        key(k) {
          if (k === 'up' || k === 'down') { this.sel = (this.sel + (k === 'up' ? CW.RANKS.length - 1 : 1)) % CW.RANKS.length; ui.sfx('select'); }
          if (k === 'ok') this.claim();
          if (k === 'back') ui.pop();
        }
      });
    },

    openCwHistory() {
      const ui = this, g = this.game;
      return this.push({
        full: true, cw: true, sel: 0,
        draw(c) {
          const hist = g.cw().hist;
          ui.cwBoardBack(c);
          ui.plate(16, 14, 'История партий');
          ui.win(16, 44, 608, 380, { corners: false, border: K.gold });
          if (!hist.length) { ui.text('Партий пока не было.', W / 2, 200, { align: 'center', size: 12, col: C.sub }); }
          ['Дата', 'Режим', 'Ранг', 'Итог', 'НР', 'Лучший', 'Связи'].forEach((h, i) => ui.text(h, [28, 102, 186, 232, 312, 352, 420][i], 54, { size: 9, bold: true, col: C.sub }));
          const top = Math.max(0, Math.min(this.sel - 10, hist.length - 18));
          hist.slice(top, top + 18).forEach((h, j) => {
            const i = top + j, y = 70 + j * 19, on = i === this.sel, d = new Date(h.at);
            if (on) { c.fillStyle = 'rgba(255,212,113,0.16)'; c.fillRect(22, y - 2, 596, 18); }
            ui.text(String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'), 28, y, { size: 9, col: C.cream });
            ui.text(h.mode === 'quick' ? 'Быстрая' : 'Стандарт', 102, y, { size: 9, col: C.cream });
            ui.text(h.rank, 186, y, { size: 9, bold: true, col: K.gold });
            ui.text(h.cleared ? 'победа' : 'без победы', 232, y, { size: 9, bold: true, col: h.cleared ? C.ok : C.bad });
            ui.text(String(h.hp), 312, y, { size: 9, col: C.cream });
            if (h.best && CW.UNITS[h.best.id]) ui.text(ui.clip(H.CHARS[CW.UNITS[h.best.id].kitOn].name, 64, 9), 352, y, { size: 9, col: C.cream });
            (h.bonds || []).slice(0, 8).forEach((b, k) => { if (!G.cwBondIcon(c, b.k, 418 + k * 13, y - 1, 12)) { c.fillStyle = '#888888'; c.fillRect(420 + k * 12, y + 1, 9, 9); } });
            if ((h.strats || []).length) ui.text((h.strats || []).length + ' стр.', 612, y, { align: 'right', size: 9, col: C.sub });
            ui.hit(22, y - 2, 596, 18, () => { if (this.sel === i) this.open(); else { this.sel = i; ui.sfx('select'); } });
          });
          ui.hints([['↑↓', 'Партия'], ['Enter', 'Годовой отчёт'], ['Esc', 'Назад']], W / 2, HGT - 22, { align: 'center' });
        },
        open() { const h = g.cw().hist[this.sel]; if (!h) { ui.sfx('deny'); return; } ui.openCwReport(Object.assign({}, h, { past: true })); },
        key(k) {
          const n = g.cw().hist.length;
          if ((k === 'up' || k === 'down') && n) { this.sel = (this.sel + (k === 'up' ? n - 1 : 1)) % n; ui.sfx('select'); }
          if (k === 'ok') this.open();
          if (k === 'back') ui.pop();
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
