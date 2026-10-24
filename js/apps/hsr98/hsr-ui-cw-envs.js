(function (H) {
  'use strict';
  const CW = H.CW;
  const { W, HGT, C } = H.UI_CONST;
  const { K } = H.CW_UI;
  const ENV_COL = '#9ae8d0', ENV_DK = '#10382e';

  Object.assign(H.UI.prototype, {
    openCwEnv() {
      const ui = this, g = this.game;
      return this.push({
        cw: true, envPick: true, sel: 0,
        draw(c) {
          const r = g.cwRun(), pk = r && r.envPick;
          if (!pk) { ui.screens = ui.screens.filter(s => s !== this); return; }
          const n = pk.opts.length, w = 184, gap = 12, x0 = W / 2 - (n * w + (n - 1) * gap) / 2, y = 132;
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x0 - 20, 84, n * w + (n - 1) * gap + 40, 316, { title: 'Инвестиционная среда', border: ENV_COL });
          ui.text('Среда действует всю партию. Выберите одну из трёх.', W / 2, 104, { align: 'center', size: 10, col: C.sub });
          const aff = r.affixes || [];
          if (aff.length) ui.text('Аффиксы врагов: ' + aff.map(k => CW.AFFIXES[k].name).join(', '), W / 2, 116, { align: 'center', size: 9, col: '#ff9a8a' });
          pk.opts.forEach((id, i) => {
            const E = CW.ENVS[id], x = x0 + i * (w + gap), on = i === this.sel, col = E.bond ? CW.BONDS[E.bond].col : ENV_COL;
            c.fillStyle = 'rgba(6,10,34,0.92)'; c.fillRect(x, y, w, 220);
            c.fillStyle = ENV_DK; c.fillRect(x, y, w, 46);
            c.fillStyle = col; c.fillRect(x, y, w, 2); c.fillRect(x, y + 45, w, 1);
            c.strokeStyle = on ? '#ffffff' : col; c.lineWidth = on ? 2 : 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, 219); c.lineWidth = 1;
            ui.wrap(E.name, w - 16, 11, true).slice(0, 2).forEach((l, j) => ui.text(l, x + w / 2, y + 8 + j * 14, { align: 'center', size: 11, bold: true, col: on ? '#ffffff' : col }));
            let ly = y + 58;
            for (const l of ui.wrap(E.text, w - 16, 10)) { if (ly > y + 206) break; ui.text(l, x + 8, ly, { size: 10, col: '#e0e4f4' }); ly += 13; }
            ui.hit(x, y, w, 220, () => { if (this.sel === i) this.take(); else { this.sel = i; ui.sfx('select'); } });
          });
          if (g.cwPerkOn('envRoll')) ui.button(W / 2 - 70, 376, 140, 20, r.envRolled ? 'Перетасовка использована' : 'Перетасовать · R', () => this.roll(), { disabled: !!r.envRolled, size: 9 });
          ui.hints([['←→', 'Выбор'], ['Enter', 'Взять']], W / 2, 356, { align: 'center' });
        },
        take() {
          const res = g.cwTakeEnv(this.sel);
          if (!res || res === 'empty') { ui.sfx('deny'); return; }
          ui.sfx('confirm');
          ui.toast('Среда: ' + CW.ENVS[res.id].name);
        },
        roll() { if (g.cwRerollEnv()) { ui.sfx('deny'); return; } ui.sfx('shuffle'); },
        key(k, code) {
          if (code === 'KeyR') { this.roll(); return; }
          const r = g.cwRun(), n = r && r.envPick ? r.envPick.opts.length : 0;
          if ((k === 'left' || k === 'right') && n) { this.sel = (this.sel + (k === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); }
          if (k === 'ok') this.take();
        }
      });
    }
  });

  const badges0 = H.UI.prototype.cwSpecialBadges;
  H.UI.prototype.cwSpecialBadges = function (c, r, u, p) {
    badges0.call(this, c, r, u, p);
    if (u.lockN > 0) {
      c.fillStyle = 'rgba(4,6,20,0.72)'; c.fillRect(p.x, p.y, p.s, p.s);
      this.text(String(u.lockN), p.x + p.s / 2, p.y + p.s / 2 - 8, { align: 'center', size: p.s >= 40 ? 14 : 11, bold: true, col: K.gold });
      this.text('узл.', p.x + p.s / 2, p.y + p.s / 2 + 4, { align: 'center', size: 8, col: C.sub });
    }
    if (u.grow) { c.fillStyle = '#5cff8a'; c.fillRect(p.x + p.s - 6, p.y + 1, 5, 5); }
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
