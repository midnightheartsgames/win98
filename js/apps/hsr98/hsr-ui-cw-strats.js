(function (H) {
  'use strict';
  const CW = H.CW;
  const { W, HGT, C } = H.UI_CONST;
  const { K } = H.CW_UI;
  const Q_COL = { s: '#c8d4e8', g: '#ffd471', p: '#ff9ae0' };
  const Q_DK = { s: '#3a4458', g: '#5a4210', p: '#4a1a40' };

  Object.assign(H.UI.prototype, {
    cwStratChip(c, q, x, y) {
      c.fillStyle = '#000000'; c.fillRect(x, y, 13, 13);
      c.fillStyle = Q_COL[q]; c.fillRect(x + 1, y + 1, 11, 11);
      this.text(CW.STRAT_Q[q][0], x + 6.5, y + 1, { align: 'center', size: 9, bold: true, col: '#141018', shadow: false });
    },

    cwDanger(c, x, y, n) {
      for (let i = 0; i < Math.max(1, n); i++) {
        const ax = x + i * 5;
        c.fillStyle = n ? '#ff4a4a' : '#3a3a50';
        c.beginPath(); c.moveTo(ax, y + 10); c.lineTo(ax + 4, y + 2); c.lineTo(ax + 8, y + 10); c.closePath(); c.fill();
      }
    },

    cwStratDiff(r, q) { return [[0, 0], [1, 3], [3, 6]][['s', 'g', 'p'].indexOf(q)][r.tier >= 7 ? 1 : 0]; },

    openCwStrat() {
      const ui = this, g = this.game;
      return this.push({
        cw: true, stratPick: true, sel: 0,
        draw(c) {
          const r = g.cwRun(), pk = r && r.stratPick;
          if (!pk) { ui.screens = ui.screens.filter(s => s !== this); return; }
          const n = pk.opts.length, w = 184, gap = 12, x0 = W / 2 - (n * w + (n - 1) * gap) / 2, y = 122, qOf = i => (pk.qs ? pk.qs[i] : pk.q), d = ui.cwStratDiff(r, pk.q);
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x0 - 20, 84, n * w + (n - 1) * gap + 40, 320, { title: 'Инвестиционная стратегия: ' + (pk.qs ? 'три качества' : CW.STRAT_Q[pk.q]), border: Q_COL[pk.q] });
          if (pk.qs) ui.text('Серебро не поднимает сложность, золото +' + ui.cwStratDiff(r, 'g') + ', призма +' + ui.cwStratDiff(r, 'p') + '.', W / 2, 104, { align: 'center', size: 10, col: C.sub });
          else ui.text(d ? 'Выбор поднимет сложность врагов на ' + d + ' до конца партии.' : 'Серебряная стратегия не поднимает сложность врагов.', W / 2, 104, { align: 'center', size: 10, col: d ? C.bad : C.ok });
          pk.opts.forEach((id, i) => {
            const S = CW.STRATS[id], x = x0 + i * (w + gap), on = i === this.sel, q = qOf(i), col = Q_COL[q];
            c.fillStyle = 'rgba(6,10,34,0.92)'; c.fillRect(x, y, w, 240);
            c.fillStyle = Q_DK[q]; c.fillRect(x, y, w, 46);
            c.fillStyle = col; c.fillRect(x, y, w, 2); c.fillRect(x, y + 45, w, 1);
            c.strokeStyle = on ? '#ffffff' : col; c.lineWidth = on ? 2 : 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, 239); c.lineWidth = 1;
            ui.wrap(S.name, w - 16, 11, true).slice(0, 2).forEach((l, j) => ui.text(l, x + w / 2, y + 8 + j * 14, { align: 'center', size: 11, bold: true, col: on ? '#ffffff' : col }));
            ui.text(CW.STRAT_Q[q] + ' · измерения ' + S.pl.join(', '), x + w / 2, y + 52, { align: 'center', size: 9, col: C.sub });
            let ly = y + 70;
            for (const l of ui.wrap(S.text, w - 16, 10)) { if (ly > y + 200) break; ui.text(l, x + 8, ly, { size: 10, col: '#e0e4f4' }); ly += 13; }
            const rolls = pk.rolls[i] || 0;
            ui.button(x + 10, y + 210, w - 20, 22, rolls ? 'Обновить · ' + rolls : 'Без обновлений', () => this.roll(i), { disabled: !rolls, size: 10 });
            ui.hit(x, y, w, 204, () => { if (this.sel === i) this.take(); else { this.sel = i; ui.sfx('select'); } });
          });
          ui.hints([['←→', 'Выбор'], ['Enter', 'Взять'], ['R', 'Обновить']], W / 2, 372, { align: 'center' });
        },
        roll(i) { const err = g.cwStratReroll(i); if (err) { ui.sfx('deny'); return; } ui.sfx('text'); },
        take() {
          const res = g.cwTakeStrat(this.sel);
          if (!res || res === 'empty') { ui.sfx('deny'); return; }
          ui.sfx('confirm');
          ui.toast('Стратегия: ' + CW.STRATS[res.id].name);
          this.sel = 0;
        },
        key(k, code) {
          const r = g.cwRun(), n = r && r.stratPick ? r.stratPick.opts.length : 0;
          if ((k === 'left' || k === 'right') && n) { this.sel = (this.sel + (k === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); }
          if (code === 'KeyR') this.roll(this.sel);
          if (k === 'ok') this.take();
        }
      });
    },

    openCwStratList() {
      const ui = this, g = this.game;
      return this.push({
        cw: true, top: 0,
        draw(c) {
          const r = g.cwRun();
          if (!r) { ui.pop(); return; }
          const list = r.strats || [], x = 70, y = 50, w = 500, h = 380;
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Условия партии', border: K.gold });
          ui.text('Сложность врагов ' + ((r.diffPlus || 0) >= 0 ? '+' : '') + (r.diffPlus || 0) + ': НР +' + Math.round((r.diffPlus || 0) * 2) + '%, АТК +' + (r.diffPlus || 0) + '%.', x + 16, y + 20, { size: 10, col: C.sub });
          const rows = [];
          for (const id of r.envs || []) {
            const E = CW.ENVS[id];
            rows.push({ env: true, head: 'Среда: ' + E.name });
            for (const l of ui.wrap(E.text, w - 56, 10)) rows.push({ line: l });
            rows.push({});
          }
          const aff = r.affixes || [];
          if (aff.length) {
            rows.push({ sect: 'Аффиксы врагов' });
            for (const k of aff) {
              const A = CW.AFFIXES[k], off = (r.affixOff || []).includes(k);
              rows.push({ aff: A.danger, off, head: A.name + (off ? ' (отключён средой)' : '') });
              for (const l of ui.wrap(A.text, w - 56, 10)) rows.push({ line: l, dim: off });
            }
            rows.push({});
          }
          if (list.length) rows.push({ sect: 'Стратегии' });
          for (const s of list) {
            const S = CW.STRATS[s.id];
            rows.push({ q: s.q, head: S.name + ' · измерение ' + (s.plane + 1) });
            for (const l of ui.wrap(S.text, w - 56, 10)) rows.push({ line: l });
            rows.push({});
          }
          const Q = r.stratQ || [];
          for (const q of Q) rows.push({ line: 'Ждёт: ' + CW.STRAT_Q[q.q] + (q.due > r.step ? ' через ' + (q.due - r.step) + ' узл.' : ' в этом узле') });
          if (!list.length) rows.push({ line: 'Стратегий пока нет. Первую дают после первой битвы измерения.' });
          const max = 22, top = Math.max(0, Math.min(this.top, rows.length - max));
          this.top = top;
          rows.slice(top, top + max).forEach((row, i) => {
            const ry = y + 42 + i * 14;
            if (row.sect) ui.text(row.sect, x + 16, ry, { size: 10, bold: true, col: C.sub });
            else if (row.env) { ui.diamond(x + 22, ry + 6, 4, K.gold, '#1a1208'); ui.text(row.head, x + 36, ry, { size: 11, bold: true, col: K.gold }); }
            else if (row.aff) { ui.cwDanger(c, x + 16, ry, row.off ? 0 : row.aff); ui.text(row.head, x + 36, ry, { size: 11, bold: true, col: row.off ? C.dim : '#ff9a8a' }); }
            else if (row.head) { ui.cwStratChip(c, row.q, x + 16, ry - 1); ui.text(row.head, x + 36, ry, { size: 11, bold: true, col: Q_COL[row.q] }); }
            else if (row.line) ui.text(row.line, x + 36, ry, { size: 10, col: row.dim ? C.dim : C.cream });
          });
          ui.wheelZone(x, y + 40, w, max * 14, d => { this.top = Math.max(0, this.top + d * 2); });
          ui.hints([['↑↓', 'Листать'], ['Esc', 'Закрыть']], x + w / 2, y + h - 18, { align: 'center' });
        },
        key(k, code) {
          if (k === 'up') this.top = Math.max(0, this.top - 2);
          if (k === 'down') this.top += 2;
          if (k === 'back' || k === 'ok' || code === 'KeyT') ui.pop();
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
