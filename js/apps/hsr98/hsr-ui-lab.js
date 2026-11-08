(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const { W, HGT, C } = H.UI_CONST;

  const STYLE = {
    theherta: { top: '#0c0a24', mid: '#241a4a', low: '#4a2f78', title: '#f4eeff', sub: '#c8bcf0', mark: '#c8a8ff' },
    tribbie: { top: '#2a1408', mid: '#6a3414', low: '#c88a3a', title: '#fff6e0', sub: '#f4dcb0', mark: '#ffd890' }
  };
  const BTN_GRANT = T.labGrants.length;
  const PULLS = [1, 10];
  const GRANT_X = [36, 86, 136], GRANT_W = [46, 46, 54], PULL_X = [204, 410], PULL_W = 194;

  const baseFoeTags = H.UI.prototype.haresFoeTags, baseCard = H.UI.prototype.fivesCard, baseBack = H.UI.prototype.fivesBack;

  Object.assign(H.UI.prototype, {
    haresFoeTags(u, tags) {
      baseFoeTags.call(this, u, tags);
      if (u.side === 'enemy' && u.flags.th > 0) tags.push('Инт. ' + u.flags.th);
    },

    fivesCard(c, u, x, y, tags, tx) {
      const out = baseCard.call(this, c, u, x, y, tags, tx);
      if (u.charId === 'theherta') {
        if (u.flags.thInsp) tags.unshift('Вдх ' + u.flags.thInsp);
        if (u.flags.thAnswer) tags.push('Отв ' + u.flags.thAnswer);
      }
      if (u.charId === 'tribbie') {
        if (u.flags.trZone > 0) tags.unshift('Зона ' + u.flags.trZone);
        if (u.flags.trNum > 0) tags.push('Осв ' + u.flags.trNum);
      }
      return out;
    },

    fivesBack(c, lay) {
      baseBack.call(this, c, lay);
      const b = this.game.battle, tr = b && b.allies.find(a => a.charId === 'tribbie' && !a.dead && a.flags.trZone > 0);
      if (!tr) return;
      const pulse = 0.34 + 0.1 * Math.sin(this.t * 2);
      c.strokeStyle = 'rgba(255,214,120,' + pulse.toFixed(3) + ')'; c.lineWidth = 2;
      for (const [u, p] of lay) {
        if (u.dead || u.gone) continue;
        c.beginPath(); c.ellipse(p.x, p.y + 4, p.s * 0.46, 14, 0, 0, Math.PI * 2); c.stroke();
      }
      c.lineWidth = 1;
      for (let i = 0; i < 18; i++) {
        const ph = (this.t * (0.04 + G.hash(i, 5, 41) * 0.05) + G.hash(i, 6, 41)) % 1;
        c.fillStyle = i % 2 ? 'rgba(255,236,190,0.85)' : 'rgba(255,190,110,0.8)';
        c.fillRect(this.left + Math.round(G.hash(i, 7, 41) * this.vw), Math.round(ph * 320), 2, 2);
      }
    },

    labGrant(n) {
      const left = this.game.labGrant(n);
      if (left == null) return null;
      this.sfx('select');
      this.toast('Секретные пропуски +' + n + '.');
      return left;
    },

    labBackdrop(c, id, bx, by, bw, bh, t) {
      const own = H.LabScenes && H.LabScenes.BACKDROPS[id];
      if (own) own(c, bx, by, bw, bh, t, this);
      else {
        const P = STYLE[id] || STYLE.theherta, bg = c.createLinearGradient(0, by, 0, by + bh);
        bg.addColorStop(0, P.top); bg.addColorStop(0.6, P.mid); bg.addColorStop(1, P.low);
        c.fillStyle = bg; c.fillRect(bx, by, bw, bh);
        for (let i = 0; i < 70; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.2 + 0.7 * G.hash(i, 3, 91)) + ')'; c.fillRect(bx + Math.floor(G.hash(i, 1, 91) * bw), by + Math.floor(G.hash(i, 2, 91) * bh * 0.8), 1, 1); }
      }
      c.fillStyle = 'rgba(0,0,0,0.14)';
      for (let y = by; y < by + bh; y += 3) c.fillRect(bx, y, bw, 1);
      const sw = bw > 640 ? 350 : 300, shade = c.createLinearGradient(bx, 0, bx + sw, 0);
      shade.addColorStop(0, 'rgba(8,4,20,0.72)'); shade.addColorStop(0.75, 'rgba(8,4,20,0.5)'); shade.addColorStop(1, 'rgba(8,4,20,0)');
      c.fillStyle = shade; c.fillRect(bx, by, sw, bh);
    },

    labBanner(c, bx, by, bw, bh, id, pick) {
      const g = this.game, S = H.BANNERS.lab.stars[id], ch = H.CHARS[id], cd = H.CONES[S.cone], P = STYLE[id] || STYLE.theherta, t = this.t, r = g.state.roster[id], wide = bw > 640;
      const feet = by + bh - 10, mx = bx + (wide ? 566 : 452), cx = bx + (wide ? 326 : 256), cy = by + 62, cw = 104, chh = 146, starX = bx + (wide ? 276 : 226), lw = wide ? 264 : 214;
      const sup = g.state.inv.cones.filter(x => x.id === S.cone).reduce((a, x) => Math.max(a, x.sup || 1), 0);
      this.labBackdrop(c, id, bx, by, bw, bh, t);
      c.fillStyle = 'rgba(255,255,255,0.16)'; c.beginPath(); c.ellipse(mx, feet, 70, 10, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
      G.drawFigure(c, G.lookOf(id, g), mx, feet, 3);
      c.restore();
      G.drawConeCard(c, S.cone, cx, cy + Math.round(Math.sin(t * 1.3) * 2), cw, chh, { tilt: -0.05 });
      this.hit(cx, cy, cw, chh, () => this.openConeView(S.cone));
      this.text('ЗАКРЫТЫЙ ТЕСТ · Leveling_Solo', bx + 22, by + 12, { size: 10, bold: true, col: P.mark });
      this.text(S.title[0], bx + 22, by + 30, { size: 22, bold: true, serif: true, col: P.title });
      this.text(S.title[1], bx + 22, by + 56, { size: 20, bold: true, serif: true, col: P.title });
      G.elemIcon(c, ch.elem, bx + 32, by + 100, 7);
      this.text(ch.name, bx + 46, by + 93, { size: 14, bold: true, col: '#ffe6a8' });
      this.text('★★★★★', starX, by + 95, { size: 10, align: 'right', col: G.RARITY[5] });
      G.pathIcon(c, ch.path, bx + 45, by + 111, 12, P.sub);
      this.text(H.PATHS[ch.path].name + ' · ' + H.ELEMENTS[ch.elem].name + (r ? ' · эйдолон ' + r.eid : ' · нет в экипаже'), bx + 60, by + 111, { size: 10, col: P.sub });
      G.pathIcon(c, cd.path, bx + 24, by + 134, 14, '#f2dc9a');
      this.text(this.fitText(cd.name, 12, wide ? 230 : 180, true), bx + 44, by + 134, { size: 12, bold: true, col: '#ffe6a8' });
      this.text('★★★★★', starX, by + 151, { size: 10, align: 'right', col: G.RARITY[5] });
      this.text('Световой конус' + (sup ? ' · S' + sup : ' · нет'), bx + 44, by + 151, { size: 10, col: P.sub });
      const rows = ['5★: только эта пара, строго по очереди.', '3★ и 4★: статисты, в сохранение не идут.'];
      if (r && r.eid >= 6 && sup >= 5) rows.push('Эйдолоны и наложения открыты, дальше только копии.');
      rows.forEach((l, i) => this.wrap(l, lw, 10).forEach((s, j) => this.text(s, bx + 24, by + 186 + i * 28 + j * 12, { size: 10, col: C.cream })));
      this.evPicker(c, bx + bw - 62, by + 12, id, pick, 'lab');
    },

    openLabWarp() {
      const ui = this, g = this.game, have = () => g.state.inv.items.lpass || 0;
      return this.push({
        full: true, show: null, ban: 'lab', sel: have() >= 10 ? 4 : 1,
        setStar(id) { if (id === g.starOf('lab') || !g.setStarOf('lab', id)) return; ui.sfx('select'); },
        stepStar(d) { const ids = Object.keys(H.BANNERS.lab.stars), i = ids.indexOf(g.starOf('lab')); this.setStar(ids[(i + d + ids.length) % ids.length]); },
        act(i) { if (i < BTN_GRANT) ui.labGrant(T.labGrants[i]); else this.pull(PULLS[i - BTN_GRANT]); },
        pull(n) {
          const res = g.labWarp(n);
          if (!res) { ui.sfx('deny'); ui.toast('Не хватает секретных пропусков. Нажмите «+10».'); this.sel = 1; return; }
          this.show = new H.WarpShow(ui, res, { ban: 'lab' });
        },
        endShow() { if (this.show && this.show.done) { this.show = null; ui.sfx('confirm'); } },
        tick(dt) { if (this.show) { this.show.tick(dt); this.endShow(); } },
        draw(c) {
          if (this.show) { this.show.draw(c); return; }
          const id = g.starOf('lab'), pity = g.pityOf('lab'), next = g.labNext(id), n = have();
          const wb = ui.warpBox ? ui.warpBox() : { wide: false, lx: 12, rx: W, bx: 20, by: 44, bw: 600, bh: 290, fy: 346 };
          const { bx, by, bw, bh, fy } = wb, y = fy + 48, rx = bx + bw - 16;
          ui.fullBg(c, false);
          ui.plate(wb.lx, 10, 'Секретный прыжок');
          ui.button(wb.rx - 118, 10, 82, 22, 'История', () => ui.openWarpHistory('lab'), { icon: 'archive', size: 11 });
          ui.closeBtn(wb.rx - 32, 10, () => this.key('back'));
          c.fillStyle = '#000'; c.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
          ui.labBanner(c, bx, by, bw, bh, id, pick => this.setStar(pick));
          c.strokeStyle = C.brass; c.lineWidth = 2; c.strokeRect(bx + 1, by + 1, bw - 2, bh - 2); c.lineWidth = 1;
          ui.win(bx, fy, bw, 110, { alpha: 0.9 });
          ui.money(bx + 16, fy + 12, 'lpass', 'Секретные пропуски ' + H.fmt(n), { size: 20 });
          ui.text('До 5★: ' + (T.labPity5 - pity.five) + ' · до 4★: ' + (T.pity4 - pity.four), rx, fy + 12, { size: 11, align: 'right', col: C.sub });
          ui.text(ui.fitText('Следующий 5★: ' + next.name, 10, wb.wide ? 420 : 300, true), rx, fy + 27, { size: 10, align: 'right', bold: true, col: C.gold });
          ui.text('Выдать', bx + 16, fy + 36, { size: 9, col: C.sub });
          T.labGrants.forEach((v, i) => ui.button(bx - 20 + GRANT_X[i], y, GRANT_W[i], 34, '+' + v, () => { this.sel = i; this.act(i); }, { active: this.sel === i, bold: true, size: 11 }));
          const pw = wb.wide ? 230 : PULL_W;
          PULLS.forEach((v, i) => {
            const px = wb.wide ? (rx - 2 * pw - 14 + i * (pw + 14)) : PULL_X[i];
            ui.button(px, y, pw, 34, 'Прыжок ×' + v, () => { this.sel = BTN_GRANT + i; this.act(BTN_GRANT + i); }, { active: this.sel === BTN_GRANT + i, disabled: n < v, bold: true, icon: 'warp' });
          });
          ui.text('1 прыжок = 1 секретный пропуск · нефрит не принимается', W / 2, fy + 90, { align: 'center', size: 10, col: C.dim });
          ui.hints([['↑↓', 'Героиня'], ['←→', 'Выбор'], ['Enter', 'Действие'], ['G', 'Выдать +10'], ['H', 'История'], ['V', 'Конус'], ['Esc', 'Назад']], wb.lx, HGT - 18);
        },
        key(k, code) {
          if (this.show) { if (code === 'Enter' || code === 'NumpadEnter') this.show.enter(); else if (code === 'Escape') this.show.skip(); else if (this.show.key) this.show.key(k); this.endShow(); return; }
          if (code === 'KeyG') { ui.labGrant(10); return; }
          if (code === 'KeyH') { ui.openWarpHistory('lab'); return; }
          if (code === 'KeyV') { ui.openConeView(H.BANNERS.lab.stars[g.starOf('lab')].cone); return; }
          if (k === 'up' || k === 'down') { this.stepStar(k === 'up' ? -1 : 1); return; }
          if (k === 'left' || k === 'right') { const n = BTN_GRANT + PULLS.length; this.sel = (this.sel + (k === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); return; }
          if (k === 'ok') { this.act(this.sel); return; }
          if (k === 'back') ui.pop();
        }
      });
    },

    openUi_labwarp() {
      if (this.netSession) { this.sfx('deny'); this.finishPending(); return; }
      const s = this.openLabWarp();
      s.onClose = () => this.finishPending();
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
