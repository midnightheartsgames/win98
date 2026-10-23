(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;

  const BOOTH = { x: 12, y: 40, w: 200, h: 412 };
  const BOOK = { x: 222, y: 40, w: 406, h: 412 };
  const ROW = { h: 52, gap: 6, vis: 7 };
  const STUB = 66, CELL = 30;
  const PAPER = { ready: ['#f6e8c2', '#e2cc94'], locked: ['#a8a090', '#8a8272'], got: ['#cfc6b0', '#b4aa92'] };
  const INK = { ready: '#3a2414', locked: '#4a443a', got: '#6a604e' };
  const PUNCH = '#d0343e';

  const levels = () => Object.keys(H.TL_REWARDS).map(Number).sort((a, b) => a - b);

  function cellsOf(r) {
    const out = [];
    if (r.jade) out.push({ id: 'jade', n: r.jade });
    for (const [id, n] of Object.entries(r.items || {})) out.push({ id, n });
    if (r.cone) out.push({ cone: r.cone });
    for (const p of r.relics || []) out.push({ relic: p });
    out.push({ id: 'credits', n: r.credits });
    return out;
  }

  Object.assign(H.UI.prototype, {
    openTlRewards(onClose) {
      const ui = this, g = this.game, list = levels();
      const firstReady = () => list.findIndex(l => g.tlRewardState(l) === 'ready');
      const start = firstReady() >= 0 ? firstReady() : Math.max(0, list.findIndex(l => l > g.trailLevel()));
      this.push({
        full: true, sel: start, sc: { top: Math.max(0, start - 1), sel: null },
        close() { ui.pop(); if (onClose) onClose(); },
        report(got) {
          if (!got || !got.length) { ui.sfx('deny'); return false; }
          ui.sfx('chest'); ui.toast('Получено: ' + got.join(', '));
          return true;
        },
        claim(i) {
          const lvl = list[i], st = g.tlRewardState(lvl);
          this.pick(i);
          if (this.report(g.claimTl(lvl))) return;
          ui.toast(st === 'got' ? 'Этот билет уже погашен.' : 'Нужен уровень Освоения ' + lvl + '.');
        },
        claimAll() { if (!this.report(g.claimAllTl())) ui.toast('Новых наград пока нет.'); },
        pick(i) {
          const v = Math.max(0, Math.min(list.length - 1, i));
          if (v !== this.sel) { this.sel = v; ui.sfx('select'); }
        },
        draw(c) {
          ui.fullBg(c, false);
          ui.plate(12, 10, 'Награды проводника');
          ui.closeBtn(W - 32, 10, () => this.close());
          ui.tlBooth(c, this);
          ui.tlBook(c, this, list);
          ui.hints([['↑↓', 'Билет'], ['Enter', 'Получить'], ['F', 'Получить всё'], ['Esc', 'Назад']], 12, HGT - 18);
        },
        key(k, code) {
          if (k === 'back') { this.close(); return; }
          if (code === 'KeyF') { this.claimAll(); return; }
          if (k === 'ok') { this.claim(this.sel); return; }
          if (k === 'up' || k === 'down') this.pick(this.sel + (k === 'up' ? -1 : 1));
          if (k === 'left' || k === 'right') this.pick(this.sel + (k === 'left' ? -ROW.vis : ROW.vis));
        }
      });
    },

    tlBooth(c, scr) {
      const g = this.game, tl = g.state.tl, { x, y, w, h } = BOOTH, ready = g.tlReadyCount();
      this.win(x, y, w, h, { top: '#121848', bottom: '#060924' });
      const wx = x + 14, wy = y + 14, ww = w - 28, wh = 150;
      const sky = c.createLinearGradient(0, wy, 0, wy + wh);
      sky.addColorStop(0, '#0a0c2e'); sky.addColorStop(0.7, '#1e1a4e'); sky.addColorStop(1, '#3a2a5a');
      c.fillStyle = '#000'; c.fillRect(wx - 1, wy - 1, ww + 2, wh + 2);
      c.fillStyle = sky; c.fillRect(wx, wy, ww, wh);
      for (let i = 0; i < 40; i++) {
        const sx = (G.hash(i, 41, 3) * ww + this.t * (6 + G.hash(i, 42, 3) * 14)) % ww;
        c.fillStyle = 'rgba(230,236,255,' + (0.3 + 0.6 * G.hash(i, 43, 3)) + ')';
        c.fillRect(Math.round(wx + ww - sx), Math.round(wy + G.hash(44, i, 3) * (wh - 30)), 2, 1);
      }
      c.fillStyle = '#5a2a1c'; c.fillRect(wx, wy + wh - 26, ww, 26);
      c.fillStyle = '#7a3e26'; c.fillRect(wx, wy + wh - 26, ww, 3);
      for (let i = 0; i < ww; i += 12) { c.fillStyle = '#4a2216'; c.fillRect(wx + i, wy + wh - 20, 1, 20); }
      G.drawBust(c, G.lookOf('pompom', g), wx + Math.round((ww - 128) / 2), wy + wh - 134, 2);
      c.strokeStyle = C.brass; c.strokeRect(wx - 0.5, wy - 0.5, ww + 1, wh + 1);
      for (const fx of [wx + ww / 3, wx + ww * 2 / 3]) { c.fillStyle = 'rgba(242,220,154,0.18)'; c.fillRect(Math.round(fx), wy, 1, wh - 26); }
      let ty = wy + wh + 12;
      this.text('Уровень Освоения', x + 16, ty, { size: 11, col: C.sub });
      this.text(String(tl.lvl), x + w - 16, ty - 6, { align: 'right', size: 24, bold: true, serif: true, col: C.gold });
      ty += 28;
      const max = tl.lvl >= H.TL_MAX;
      this.rail(x + 18, ty, w - 36, max ? 1 : tl.exp / H.tlExpToNext(tl.lvl));
      this.text(max ? 'Максимальный уровень' : 'Опыт ' + H.fmt(tl.exp) + ' / ' + H.fmt(H.tlExpToNext(tl.lvl)), x + w / 2, ty + 8, { align: 'center', size: 10, col: C.sub });
      ty += 30;
      const next = levels().find(l => l > tl.lvl);
      const say = ready ? 'Пом-Пом всё приготовил! Билетов к погашению: ' + ready + '.'
        : next ? 'Следующая награда ждёт на ' + next + ' уровне. Пом-Пом будет следить!'
          : 'Ты {прошёл|прошла} весь путь до конца. Пом-Пом тобой гордится!';
      c.fillStyle = 'rgba(246,232,194,0.1)'; c.fillRect(x + 12, ty, w - 24, 74);
      c.strokeStyle = 'rgba(242,220,154,0.4)'; c.strokeRect(x + 12.5, ty + 0.5, w - 25, 73);
      c.fillStyle = 'rgba(246,232,194,0.1)'; c.beginPath(); c.moveTo(x + 40, ty); c.lineTo(x + 48, ty - 7); c.lineTo(x + 56, ty); c.fill();
      this.text('Пом-Пом', x + 20, ty + 6, { size: 10, bold: true, col: C.gold });
      this.wrap(g.fill(say), w - 40, 11).slice(0, 4).forEach((l, i) => this.text(l, x + 20, ty + 22 + i * 13, { size: 11, col: C.cream }));
      this.button(x + 16, y + h - 40, w - 32, 26, ready ? 'Получить всё (' + ready + ')' : 'Получить всё', () => scr.claimAll(), { active: ready > 0, disabled: !ready, size: 12, bold: true });
    },

    tlBook(c, scr, list) {
      const { x, y, w, h } = BOOK, step = ROW.h + ROW.gap, bar = list.length > ROW.vis;
      this.win(x, y, w, h, { top: '#20180e', bottom: '#0e0a06', border: '#8a6a3a' });
      const top = this.listTop(scr.sc, scr.sel, list.length, ROW.vis);
      const rw = w - 24 - (bar ? 14 : 0);
      this.wheelZone(x, y, w, h, d => { scr.sc.top += d; });
      for (let i = top; i < Math.min(list.length, top + ROW.vis); i++) this.tlTicket(c, scr, list[i], i, x + 12, y + 12 + (i - top) * step, rw);
      if (bar) this.scrollBar(x + w - 22, y + 12, ROW.vis * step - ROW.gap, scr.sc, list.length, ROW.vis);
    },

    tlTicket(c, scr, lvl, i, x, y, w) {
      const g = this.game, st = g.tlRewardState(lvl), on = scr.sel === i, rh = ROW.h, [pa, pb] = PAPER[st], ink = INK[st];
      const gr = c.createLinearGradient(0, y, 0, y + rh);
      gr.addColorStop(0, pa); gr.addColorStop(1, pb);
      c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, w + 2, rh + 2);
      c.fillStyle = gr; c.fillRect(x, y, w, rh);
      c.fillStyle = 'rgba(0,0,0,0.06)';
      for (let k = 0; k < 6; k++) c.fillRect(x + Math.round(G.hash(lvl, k, 5) * w), y + 2 + Math.round(G.hash(k, lvl, 6) * (rh - 6)), 3, 1);
      c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x, y + rh - 2, w, 2);
      const px = x + STUB;
      c.fillStyle = '#100c08';
      for (const cy of [y, y + rh]) { c.beginPath(); c.arc(px, cy, 5, 0, Math.PI * 2); c.fill(); }
      c.setLineDash([2, 3]); c.strokeStyle = 'rgba(58,36,20,0.55)';
      c.beginPath(); c.moveTo(px + 0.5, y + 6); c.lineTo(px + 0.5, y + rh - 6); c.stroke(); c.setLineDash([]);
      this.text('УР.', x + STUB / 2, y + 7, { align: 'center', size: 9, bold: true, col: ink, shadow: false });
      this.text(String(lvl), x + STUB / 2, y + 17, { align: 'center', size: 22, bold: true, serif: true, col: st === 'ready' ? '#8a2a1a' : ink, shadow: false });
      const cells = cellsOf(H.TL_REWARDS[lvl]);
      cells.forEach((cl, j) => {
        const cx = px + 10 + j * (CELL + 3), cy = y + (rh - CELL) / 2;
        if (cl.cone) { G.rarityCell(c, cx, cy, CELL, CELL, H.CONES[cl.cone].rarity); G.drawConeCard(c, cl.cone, cx + 5, cy + 2, 20, CELL - 4, { info: false }); }
        else if (cl.relic) {
          G.rarityCell(c, cx, cy, CELL, CELL, cl.relic.stars);
          G.itemIcon(c, 'relic:' + cl.relic.slot, cx + 3, cy + 2, CELL - 6, cl.relic.set);
        } else this.rewardCell(c, cl.id, cl.n, cx, cy, CELL);
        if (st === 'got') { c.fillStyle = 'rgba(30,24,16,0.35)'; c.fillRect(cx, cy, CELL, CELL); }
      });
      const ax = x + w - 84, ay = y + rh / 2;
      if (st === 'got') {
        c.fillStyle = '#2a2018'; c.beginPath(); c.arc(ax + 14, ay, 7, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.arc(ax + 13, ay - 1, 4, Math.PI, Math.PI * 1.6); c.stroke();
        this.tlPunchStamp(ax + 50, ay);
      } else if (st === 'ready') this.button(ax, ay - 12, 76, 24, 'Получить', () => scr.claim(i), { active: on, size: 11 });
      else this.text('С ' + lvl + ' уровня', ax + 38, ay - 6, { align: 'center', size: 10, col: ink, shadow: false });
      if (on) {
        c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(x - 2, y - 2, w + 4, rh + 4); c.lineWidth = 1;
        this.cursor(x - 10, y + rh / 2);
      }
      this.hit(x, y, w - 90, rh, () => scr.pick(i));
    },

    tlPunchStamp(x, y) {
      const c = this.ctx, label = 'Погашен', w = Math.round(this.measure(label, 10, true) + 12), h = 16;
      c.save();
      c.translate(Math.round(x), Math.round(y)); c.rotate(-0.14);
      c.globalAlpha = 0.85;
      c.strokeStyle = PUNCH; c.lineWidth = 2; c.strokeRect(-w / 2, -h / 2, w, h);
      this.text(label, 0, -6, { align: 'center', size: 10, bold: true, col: PUNCH, shadow: false });
      c.restore();
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
