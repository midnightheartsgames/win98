(function (H) {
  'use strict';
  const G = H.Gfx, CW = H.CW;
  const { W, HGT, C } = H.UI_CONST;
  const { K } = H.CW_UI;
  const PAPER = '#f2ead2', INK = '#2a2018', LINE = '#c8d8e8';

  Object.assign(H.UI.prototype, {
    openCwGuide() {
      const ui = this, g = this.game, GD = CW.GUIDE;
      return this.push({
        full: true, cw: true, chap: 0, sel: 0,
        draw(c) {
          const Gs = g.cwGoals(), ch = GD[this.chap];
          if (this.sel > ch.tasks.length) this.sel = ch.tasks.length;
          ui.cwBoardBack(c);
          ui.plate(16, 14, 'Руководство для предпринимателей');
          GD.forEach((h, i) => {
            const x = 52 + i * 110, on = i === this.chap, all = h.tasks.every((t, j) => Gs.got.includes(i + ':' + j));
            c.fillStyle = on ? PAPER : ['#e8b0a0', '#a8c8e8', '#b8e0a8', '#f0d890'][i]; c.fillRect(x, on ? 40 : 44, 100, on ? 26 : 22);
            ui.text('Глава ' + (i + 1) + (all ? ' ✓' : ''), x + 50, on ? 46 : 48, { align: 'center', size: 10, bold: true, col: INK, shadow: false });
            ui.hit(x, 40, 100, 26, () => { this.chap = i; this.sel = 0; ui.sfx('select'); });
          });
          c.fillStyle = '#000000'; c.fillRect(42, 64, 560, 368);
          c.fillStyle = PAPER; c.fillRect(40, 66, 556, 362);
          for (let y = 106; y < 420; y += 22) { c.fillStyle = LINE; c.fillRect(56, y, 528, 1); }
          c.fillStyle = '#e09090'; c.fillRect(80, 66, 1, 362);
          for (let y = 80; y < 420; y += 40) { c.fillStyle = '#2a2a3a'; c.beginPath(); c.arc(56, y, 4, 0, Math.PI * 2); c.fill(); }
          ui.text(ch.name, 92, 76, { size: 14, bold: true, serif: true, col: INK, shadow: false });
          ch.tasks.forEach(([k, need, text], i) => {
            const key = this.chap + ':' + i, done = Gs.done.includes(key), got = Gs.got.includes(key), y = 112 + i * 36, on = i === this.sel, cnt = k === 'links' ? g.cwPerks().links.done.length : Gs.cnt[k] || 0;
            if (on) { c.fillStyle = 'rgba(255,212,113,0.3)'; c.fillRect(84, y - 4, 504, 32); }
            c.strokeStyle = INK; c.strokeRect(92.5, y + 1.5, 12, 12);
            if (done) ui.text('✓', 98, y - 1, { align: 'center', size: 13, bold: true, col: '#2a7a3a', shadow: false });
            ui.text(text, 114, y, { size: 11, col: INK, shadow: false });
            ui.text(Math.min(cnt, need) + ' / ' + need + ' · ' + (i % 2 ? '6 Журналов приключений' : '4 Путеводителя') + ', 200 очков', 114, y + 14, { size: 9, col: '#6a5a44', shadow: false });
            ui.button(500, y + 2, 80, 22, got ? 'Получено' : done ? 'Забрать' : 'Не готово', () => { this.sel = i; this.claim(); }, { disabled: got || !done, active: done && !got, size: 10 });
          });
          const allGot = ch.tasks.every((t, j) => Gs.got.includes(this.chap + ':' + j)), chGot = Gs.chap.includes(this.chap), last = ch.tasks.length;
          const ry = 112 + last * 36 + 6;
          if (this.sel === last) { c.fillStyle = 'rgba(255,212,113,0.3)'; c.fillRect(84, ry - 4, 504, 30); }
          ui.wrap('Глава целиком: ' + ui.cwRewardText(ch.rew), 350, 10, true).slice(0, 2).forEach((l, m) => ui.text(l, 114, ry + m * 13, { size: 10, bold: true, col: INK, shadow: false }));
          ui.button(480, ry - 1, 100, 24, chGot ? 'Получено' : allGot ? 'Забрать главу' : 'Не готово', () => { this.sel = last; this.claim(); }, { disabled: chGot || !allGot, active: allGot && !chGot, size: 10, bold: true });
          ui.hints([['Q/E', 'Глава'], ['↑↓', 'Задание'], ['Enter', 'Забрать'], ['Esc', 'Назад']], W / 2, HGT - 16, { align: 'center' });
        },
        claim() {
          const n = GD[this.chap].tasks.length;
          ui.cwClaimSay(this.sel >= n ? g.cwChapterClaim(this.chap) : g.cwGuideClaim(this.chap, this.sel));
        },
        key(k, code) {
          const n = GD[this.chap].tasks.length + 1;
          if (code === 'KeyQ' || code === 'KeyE') { this.chap = (this.chap + (code === 'KeyQ' ? 3 : 1)) % 4; this.sel = 0; ui.sfx('select'); return; }
          if (k === 'up' || k === 'down') { this.sel = (this.sel + (k === 'up' ? n - 1 : 1)) % n; ui.sfx('select'); }
          if (k === 'ok') this.claim();
          if (k === 'back') ui.pop();
        }
      });
    },

    openCwProfit() {
      const ui = this, g = this.game, P = CW.PROFIT;
      return this.push({
        full: true, cw: true, grp: 0, sel: 0, top: 0,
        draw(c) {
          const Gs = g.cwGoals(), grp = P[this.grp];
          ui.cwBoardBack(c);
          ui.plate(16, 14, 'Ожидаемый доход');
          ui.text('Выполнено ' + Gs.profit.length + ' из ' + P.reduce((a, x) => a + x.tasks.length, 0), 300, 18, { size: 11, col: C.sub });
          P.forEach((x, i) => {
            const y = 46 + i * 50, on = i === this.grp, n = x.tasks.filter(t => Gs.profit.includes(t[0])).length, ready = x.tasks.some(t => Gs.profit.includes(t[0]) && !Gs.pgot.includes(t[0]));
            c.fillStyle = on ? 'rgba(255,212,113,0.2)' : 'rgba(6,10,34,0.88)'; c.fillRect(16, y, 168, 44);
            c.strokeStyle = on ? K.gold : '#2a3460'; c.strokeRect(16.5, y + 0.5, 167, 43);
            ui.text(x.name, 26, y + 8, { size: 10, bold: true, col: on ? K.gold : C.cream });
            ui.text(n + ' / ' + x.tasks.length + (x.min ? ' · с A5' : ''), 26, y + 24, { size: 9, col: C.sub });
            if (ready) { c.fillStyle = K.red; c.beginPath(); c.arc(174, y + 10, 5, 0, Math.PI * 2); c.fill(); }
            ui.hit(16, y, 168, 44, () => { this.grp = i; this.sel = 0; this.top = 0; ui.sfx('select'); });
          });
          const rows = grp.tasks, max = 9;
          this.top = Math.max(0, Math.min(this.top, rows.length - max, this.sel));
          if (this.sel >= this.top + max) this.top = this.sel - max + 1;
          rows.slice(this.top, this.top + max).forEach(([id, text], j) => {
            const i = this.top + j, y = 46 + j * 42, done = Gs.profit.includes(id), got = Gs.pgot.includes(id), on = i === this.sel, lastRow = i === rows.length - 1 && grp.id !== 'normal';
            c.fillStyle = on ? 'rgba(255,212,113,0.16)' : 'rgba(6,10,34,0.85)'; c.fillRect(196, y, 428, 38);
            ui.text(done ? '✓' : '·', 208, y + 10, { align: 'center', size: 13, bold: true, col: done ? C.ok : C.dim });
            ui.wrap(text, 300, 10).slice(0, 2).forEach((l, m) => ui.text(l, 220, y + 5 + m * 13, { size: 10, col: done ? C.cream : C.sub }));
            ui.text(lastRow ? '20 нефрита' : grp.id === 'normal' ? '20 нефрита, 3 Путеводителя' : grp.id === 'bonds' || grp.id === 'master' ? '20 Обломков, 5000 кр.' : '20 Обломков, 3 Журнала', 220, y + 26, { size: 8, col: C.dim });
            ui.button(540, y + 8, 76, 22, got ? 'Получено' : done ? 'Забрать' : 'Не готово', () => { this.sel = i; this.claim(); }, { disabled: got || !done, active: done && !got, size: 10 });
          });
          ui.wheelZone(196, 46, 428, max * 42, d => { this.sel = Math.max(0, Math.min(rows.length - 1, this.sel + d)); });
          ui.hints([['Q/E', 'Группа'], ['↑↓', 'Задание'], ['Enter', 'Забрать'], ['Esc', 'Назад']], W / 2, HGT - 16, { align: 'center' });
        },
        claim() { const t = P[this.grp].tasks[this.sel]; ui.cwClaimSay(t ? g.cwProfitClaim(t[0]) : null); },
        key(k, code) {
          const n = P[this.grp].tasks.length;
          if (code === 'KeyQ' || code === 'KeyE') { this.grp = (this.grp + (code === 'KeyQ' ? P.length - 1 : 1)) % P.length; this.sel = 0; this.top = 0; ui.sfx('select'); return; }
          if (k === 'up' || k === 'down') { this.sel = (this.sel + (k === 'up' ? n - 1 : 1)) % n; ui.sfx('select'); }
          if (k === 'ok') this.claim();
          if (k === 'back') ui.pop();
        }
      });
    },

    openCwLineups() {
      const ui = this, g = this.game, L = CW.LINEUPS;
      return this.push({
        full: true, cw: true, sel: 0,
        draw(c) {
          const Gs = g.cwGoals();
          ui.cwBoardBack(c);
          ui.plate(16, 14, 'Все руководства');
          const first = Math.max(0, Math.min(this.sel - 1, L.length - 3));
          L.slice(first, first + 3).forEach((Ln, j) => {
            const i = first + j, x = 16 + j * 206, y = 44, on = i === this.sel, applied = Gs.applied === Ln.id;
            ui.win(x, y, 198, 370, { corners: false, border: applied ? '#9affb0' : on ? K.gold : '#2a3460' });
            ui.text(Ln.name, x + 10, y + 8, { size: 12, bold: true, serif: true, col: on ? K.gold : C.cream });
            for (let s = 0; s < 3; s++) ui.fhStar(x + 186 - s * 12, y + 14, 5, s < Ln.stars);
            ui.text(Ln.bonds, x + 10, y + 28, { size: 9, bold: true, col: '#bfe8ff' });
            ui.text('На поле', x + 10, y + 46, { size: 9, bold: true, col: C.sub });
            Ln.on.forEach((id, k) => ui.portraitCard(c, G.lookOf(CW.UNITS[id].kitOn, g), x + 10 + (k % 5) * 36, y + 60 + Math.floor(k / 5) * 36, 32, { elem: H.CHARS[CW.UNITS[id].kitOn].elem, border: CW.COST_COL[CW.UNITS[id].cost] }));
            ui.text('Вне поля', x + 10, y + 134, { size: 9, bold: true, col: C.sub });
            Ln.off.forEach((id, k) => ui.portraitCard(c, G.lookOf(CW.UNITS[id].kitOff, g), x + 10 + (k % 5) * 36, y + 148 + Math.floor(k / 5) * 36, 32, { elem: H.CHARS[CW.UNITS[id].kitOn].elem, border: CW.COST_COL[CW.UNITS[id].cost] }));
            const items = [...new Set(Ln.on.concat(Ln.off).flatMap(id => g.cwRec(id)))].slice(0, 6);
            ui.text('Ключевые предметы', x + 10, y + 228, { size: 9, bold: true, col: C.sub });
            items.forEach((id, k) => ui.cwItemIcon(c, { id }, x + 10 + k * 30, y + 242, 24));
            ui.wrap(Ln.tip, 178, 10).slice(0, 3).forEach((l, k) => ui.text(l, x + 10, y + 278 + k * 13, { size: 10, col: C.cream }));
            ui.button(x + 10, y + 332, 178, 26, applied ? 'Применено · снять' : 'Применить', () => { this.sel = i; this.apply(); }, { active: on, bold: true });
            ui.hit(x, y, 198, 320, () => { this.sel = i; ui.sfx('select'); });
          });
          ui.text((this.sel + 1) + ' / ' + L.length, W - 20, 18, { align: 'right', size: 10, col: C.sub });
          ui.hints([['←→', 'Руководство'], ['Enter', 'Применить'], ['Esc', 'Назад']], W / 2, HGT - 16, { align: 'center' });
        },
        apply() {
          const on = g.cwApplyGuide(L[this.sel].id);
          ui.sfx(on ? 'confirm' : 'cancel');
          ui.toast(on ? 'Руководство «' + L[this.sel].name + '»: герои и предметы подсвечены' : 'Руководство снято');
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = (this.sel + (k === 'left' ? L.length - 1 : 1)) % L.length; ui.sfx('select'); }
          if (k === 'ok') this.apply();
          if (k === 'back') ui.pop();
        }
      });
    },

    cwMarked(r, id) {
      const g = this.game, T = g.cwTracked(r);
      return g.cwGuideHeroes().includes(id) || T.bonds.some(k => CW.UNITS[id] && CW.UNITS[id].bonds.includes(k));
    }
  });

  const recFor0 = H.Game.prototype.cwRecFor;
  H.Game.prototype.cwRecFor = function (run) {
    const m = recFor0.call(this, run);
    for (const id of this.cwTracked(run).heroes.concat(this.cwGuideHeroes())) for (const it of this.cwRec(id)) { if (!m.has(it)) m.set(it, []); if (!m.get(it).includes(id)) m.get(it).push(id); }
    return m;
  };

  const cardBtn0 = H.UI.prototype.cwSpecialCardButton;
  H.UI.prototype.cwSpecialCardButton = function (r, u, x, y) {
    cardBtn0.call(this, r, u, x, y);
    if (!r || !u || !CW.UNITS[u.id]) return;
    const on = this.game.cwTracked(r).heroes.includes(u.id);
    this.button(x, y + 24, 132, 20, on ? 'Отслеживается' : 'Отслеживать снаряжение', () => { const s = this.game.cwTrack('heroes', u.id); this.sfx(s === 'on' ? 'confirm' : 'cancel'); }, { size: 9, active: on });
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
