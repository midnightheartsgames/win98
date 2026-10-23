(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const fmt = H.fmt;
  const GRID = { x: 170, y: 70, cols: 4, w: 108, h: 150, gap: 8 };
  const ART = { w: 48, h: 34 };
  const TAGS = { left: '#f0b040', version: '#e8602a', week: 'rgba(30,30,40,0.85)', none: '#c83434' };
  const LOOKS = {
    grand: { box: '#e2b244', dark: '#8a5c14', lid: '#f4d070', trim: '#fff0b0', inside: '#6a3a10', goods: 'tickets' },
    grandDark: { box: '#2c2834', dark: '#14121a', lid: '#3a3644', trim: '#e2b244', inside: '#4a3010', goods: 'coins' },
    aid: { box: '#2e2a3e', dark: '#16141e', lid: '#3a3650', trim: '#c8a058', inside: '#a8303a', goods: 'books' },
    fuel: { box: '#2c6a7a', dark: '#163a44', lid: '#3a8494', trim: '#d8e4ea', inside: '#14262c', goods: 'fuel' },
    quest: { box: '#e6ecf2', dark: '#9aa6b8', lid: '#f6f8fa', trim: '#3a6ab8', inside: '#5a3a24', goods: 'journal' },
    roam: { box: '#7a2a36', dark: '#3e1018', lid: '#ece8ee', trim: '#d8d0dc', inside: '#2a1828', goods: 'flask' },
    res2: { box: '#3e6a3a', dark: '#1e361c', lid: '#e8ecee', trim: '#c8d4c0', inside: '#1c2a20', goods: 'tears' }
  };
  const artCache = {};

  function paintGoods(g, kind, cx, top) {
    if (kind === 'tickets') {
      for (const [dx, a, col] of [[-10, -0.4, '#f4ead2'], [-3, -0.15, '#efe2c4'], [5, 0.2, '#f4ead2']]) {
        g.save(); g.translate(cx + dx, top + 2); g.rotate(a);
        g.fillStyle = '#5a3a18'; g.fillRect(-4, -10, 8, 12); g.fillStyle = col; g.fillRect(-3.5, -9.5, 7, 11); g.fillStyle = '#c83a3a'; g.fillRect(-3.5, -9.5, 7, 3);
        g.restore();
      }
      for (const [dx, dy] of [[10, -2], [14, 0], [-14, 1]]) { g.fillStyle = '#8a5c14'; g.beginPath(); g.ellipse(cx + dx, top + dy, 4, 2.4, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffe080'; g.beginPath(); g.ellipse(cx + dx, top + dy - 0.6, 3.4, 1.8, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#4ab0e8'; g.fillRect(cx + 16, top - 9, 4, 8); g.fillStyle = '#c8f0ff'; g.fillRect(cx + 17, top - 8, 1, 5);
    } else if (kind === 'coins') {
      for (let i = 0; i < 7; i++) { const x = cx - 14 + i * 4.6, y = top - (i % 3) * 2; g.fillStyle = '#8a5c14'; g.beginPath(); g.ellipse(x, y, 4, 2.4, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f4cc58'; g.beginPath(); g.ellipse(x, y - 0.6, 3.4, 1.8, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#7ac8f0'; g.beginPath(); g.moveTo(cx + 6, top - 12); g.lineTo(cx + 10, top - 4); g.lineTo(cx + 6, top); g.lineTo(cx + 2, top - 4); g.fill();
      g.fillStyle = '#e0f6ff'; g.fillRect(cx + 5, top - 9, 1, 4);
    } else if (kind === 'books') {
      for (const [dx, col] of [[-9, '#2a3a8a'], [-2, '#6a2a8a'], [5, '#2a3a8a']]) { g.fillStyle = '#10142a'; g.fillRect(cx + dx - 0.5, top - 11.5, 7, 13); g.fillStyle = col; g.fillRect(cx + dx, top - 11, 6, 12); g.fillStyle = '#e2c070'; g.fillRect(cx + dx + 1, top - 8, 4, 1); }
      g.fillStyle = '#c8c8d8'; g.fillRect(cx + 13, top - 13, 3, 13); g.fillStyle = '#f0a040'; g.fillRect(cx + 13, top - 13, 3, 3);
    } else if (kind === 'fuel') {
      g.fillStyle = '#5a2a10'; g.fillRect(cx - 7.5, top - 15.5, 15, 17); g.fillStyle = '#f08a2a'; g.fillRect(cx - 7, top - 15, 14, 16); g.fillStyle = '#ffc070'; g.fillRect(cx - 5, top - 13, 3, 12);
      g.fillStyle = '#3a3a44'; g.fillRect(cx + 2, top - 19, 4, 4); g.fillStyle = '#e8e0d0'; g.fillRect(cx - 4, top - 8, 8, 3);
      g.fillStyle = '#7ac8f0'; g.fillRect(cx + 11, top - 9, 4, 9); g.fillStyle = '#d8f4ff'; g.fillRect(cx + 12, top - 8, 1, 6);
    } else if (kind === 'journal') {
      g.fillStyle = '#3a2214'; g.fillRect(cx - 9.5, top - 12.5, 15, 14); g.fillStyle = '#8a5a30'; g.fillRect(cx - 9, top - 12, 14, 13); g.fillStyle = '#f0e2c0'; g.fillRect(cx - 8, top - 11, 2, 11); g.fillStyle = '#d8a050'; g.fillRect(cx - 4, top - 8, 6, 5);
      g.fillStyle = '#4a4a5a'; g.fillRect(cx + 9, top - 11, 5, 11); g.fillStyle = '#9aa4b8'; g.fillRect(cx + 10, top - 10, 3, 3);
    } else if (kind === 'flask') {
      g.fillStyle = '#2a1840'; g.beginPath(); g.arc(cx - 2, top - 6, 7.5, 0, Math.PI * 2); g.fill(); g.fillStyle = '#9a6ae8'; g.beginPath(); g.arc(cx - 2, top - 6, 6.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#e0d0ff'; g.fillRect(cx - 5, top - 10, 2, 3); g.fillStyle = '#2a1840'; g.fillRect(cx - 4, top - 17, 4, 5);
      g.fillStyle = '#1e2a6a'; g.fillRect(cx + 8, top - 11, 8, 11); g.fillStyle = '#e2c070'; g.fillRect(cx + 9, top - 7, 6, 1);
    } else {
      for (const [dx, h, col] of [[-6, 14, '#6a8af0'], [1, 18, '#9ab0ff'], [8, 12, '#7a9cf4']]) { g.fillStyle = '#1e1a52'; g.beginPath(); g.moveTo(cx + dx - 3.6, top); g.lineTo(cx + dx, top - h - 0.6); g.lineTo(cx + dx + 3.6, top); g.fill(); g.fillStyle = col; g.beginPath(); g.moveTo(cx + dx - 3, top); g.lineTo(cx + dx, top - h); g.lineTo(cx + dx + 3, top); g.fill(); g.fillStyle = '#e8eeff'; g.fillRect(cx + dx - 1, top - h * 0.7, 1, h * 0.4); }
      g.fillStyle = '#f2f0ec'; g.beginPath(); g.ellipse(cx - 14, top - 4, 5, 5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#c8c0b0'; g.fillRect(cx - 15, top - 10, 2, 3);
    }
  }

  function paintChest(g, look) {
    const L = LOOKS[look] || LOOKS.aid, w = ART.w, h = ART.h, x0 = 8, x1 = w - 8, top = 17, bot = h - 2;
    const glow = g.createRadialGradient(w / 2, top, 2, w / 2, top, 22);
    glow.addColorStop(0, 'rgba(255,250,220,0.55)'); glow.addColorStop(1, 'rgba(255,250,220,0)');
    g.fillStyle = glow; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0a0810'; g.beginPath(); g.moveTo(x0 + 1, top - 12); g.lineTo(x1 - 1, top - 12); g.lineTo(x1 + 1, top); g.lineTo(x0 - 1, top); g.fill();
    g.fillStyle = L.lid; g.beginPath(); g.moveTo(x0 + 2, top - 11); g.lineTo(x1 - 2, top - 11); g.lineTo(x1, top - 1); g.lineTo(x0, top - 1); g.fill();
    g.fillStyle = L.trim; g.fillRect(x0 + 2, top - 11, x1 - x0 - 4, 1.4);
    g.fillStyle = L.inside; g.fillRect(x0 + 1, top - 1, x1 - x0 - 2, 4);
    paintGoods(g, L.goods, w / 2, top + 2);
    g.fillStyle = '#0a0810'; g.fillRect(x0 - 1, top + 2, x1 - x0 + 2, bot - top - 1);
    g.fillStyle = L.box; g.fillRect(x0, top + 3, x1 - x0, bot - top - 3);
    g.fillStyle = L.dark; g.fillRect(x0, bot - 4, x1 - x0, 3); g.fillRect(x1 - 4, top + 3, 4, bot - top - 3);
    g.fillStyle = L.trim; g.fillRect(x0, top + 3, x1 - x0, 1.4); g.fillRect(x0 + 4, top + 3, 1.4, bot - top - 4); g.fillRect(x1 - 6, top + 3, 1.4, bot - top - 4);
    g.fillStyle = L.dark; g.fillRect(w / 2 - 3, top + 5, 6, 6); g.fillStyle = L.trim; g.fillRect(w / 2 - 2, top + 6, 4, 4); g.fillStyle = L.dark; g.fillRect(w / 2 - 0.5, top + 7.4, 1, 2);
  }

  function chest(look) {
    if (!artCache[look]) { const cv = G.mkCanvas(ART.w, ART.h); paintChest(cv.getContext('2d'), look); artCache[look] = cv; }
    return artCache[look];
  }

  function drawChest(c, look, cx, y, scale) {
    const was = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    c.drawImage(chest(look), Math.round(cx - ART.w * scale / 2), Math.round(y), ART.w * scale, ART.h * scale);
    c.imageSmoothingEnabled = was;
  }

  const timeLeft = ms => { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? Math.floor(m / 60) + ' ч. ' + (m % 60) + ' мин.' : m + ' мин.'; };
  const lotName = l => (l.id === 'credits' ? 'Кредиты' : H.ITEMS[l.id].name);
  const lotRar = l => (l.id === 'credits' ? 3 : H.ITEMS[l.id].rar);

  Object.assign(H.UI.prototype, {
    contractChest: drawChest,

    lotCell(c, l, x, y, s, on) {
      if (on) { c.fillStyle = C.brassHi; c.fillRect(x - 2, y - 2, s + 4, s + 4); }
      c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, s + 2, s + 2);
      G.rarityCell(c, x, y, s, s, lotRar(l));
      G.itemIcon(c, l.id, x + s * 0.1, y + s * 0.06, s * 0.8);
      const t = l.n >= 10000 ? fmt(l.n / 1000) + 'к' : fmt(l.n);
      c.fillStyle = 'rgba(6,6,18,0.72)'; c.fillRect(x, y + s - 11, s, 11);
      this.text(t, x + s - 2, y + s - 11, { size: 9, bold: true, align: 'right' });
    },

    contractCard(c, v, x, y, on) {
      const { w, h } = GRID, ct = v.c, foot = 24;
      if (on) { c.fillStyle = C.brassHi; c.fillRect(x - 2, y - 2, w + 4, h + 4); }
      c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
      G.rarityCell(c, x, y, w, h - foot, ct.rar);
      const gl = c.createRadialGradient(x + w / 2, y + 54, 4, x + w / 2, y + 54, 50);
      gl.addColorStop(0, 'rgba(255,255,255,0.24)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gl; c.fillRect(x, y, w, h - foot);
      drawChest(c, ct.look, x + w / 2, y + 22, 2);
      const big = this.wrap(ct.name, w - 8, 9, true), ns = big.length > 3 ? 8 : 9, lines = (ns === 9 ? big : this.wrap(ct.name, w - 6, 8, true)).slice(0, 4), lh = ns + 1;
      const ny = y + h - foot - 14 - lines.length * lh;
      const band = c.createLinearGradient(0, ny - 8, 0, ny + 4);
      band.addColorStop(0, 'rgba(8,8,24,0)'); band.addColorStop(1, 'rgba(8,8,24,0.55)');
      c.fillStyle = band; c.fillRect(x, ny - 8, w, 12);
      c.fillStyle = 'rgba(8,8,24,0.55)'; c.fillRect(x, ny + 4, w, y + h - foot - ny - 7);
      lines.forEach((l, i) => this.text(l, x + w / 2, ny + i * lh, { size: ns, bold: true, align: 'center' }));
      this.text('★'.repeat(ct.rar), x + w / 2, y + h - foot - 13, { size: 8, align: 'center', col: G.RARITY[ct.rar] });
      c.fillStyle = '#f2ead6'; c.fillRect(x, y + h - foot, w, foot);
      c.fillStyle = '#c8b890'; c.fillRect(x, y + h - foot, w, 1);
      const label = fmt(ct.price), lw = this.measure(label, 13, true) + 18, lx = x + (w - lw) / 2;
      G.itemIcon(c, 'jade', lx, y + h - foot + 4, 16);
      this.text(label, lx + 18, y + h - foot + 5, { size: 13, bold: true, col: v.block === 'jade' ? '#a8a098' : '#c84a1a', shadow: false });
      if (v.left > 0) this.supplyTag(x + 3, y + 3, 'Доступно: ' + v.left + '/' + ct.limit, TAGS.left, true);
      else this.supplyTag(x + 3, y + 3, 'Достигнут лимит', TAGS.none);
      if (ct.period) this.supplyTag(x + 3, y + 16, (ct.period === 'version' ? 'Ещё ' : '⟳ ') + timeLeft(v.ends - this.game.now()), TAGS[ct.period]);
      if (v.block === 'limit') { c.fillStyle = 'rgba(4,6,20,0.5)'; c.fillRect(x, y + 30, w, h - 30); }
    },

    drawContracts(c, scr) {
      const g = this.game, list = g.contractList();
      if (scr.csel >= list.length) scr.csel = list.length - 1;
      this.supplyPill(W - 154, 10, 'jade', g.state.jade);
      this.text('Контракты Герты', 170, 44, { size: 14, bold: true, serif: true, col: C.gold });
      this.text('Оплата звёздным нефритом', 170 + this.measure('Контракты Герты', 14, true, true) + 12, 48, { size: 10, col: C.sub });
      list.forEach((v, i) => {
        const x = GRID.x + (i % GRID.cols) * (GRID.w + GRID.gap), y = GRID.y + Math.floor(i / GRID.cols) * (GRID.h + GRID.gap);
        this.contractCard(c, v, x, y, i === scr.csel);
        this.hit(x, y, GRID.w, GRID.h, () => { if (scr.csel === i) this.contractAct(scr); else { scr.csel = i; this.sfx('select'); } });
      });
      const v = list[scr.csel];
      if (v) this.contractInfo(c, scr, v);
      this.hints([['←↑↓→', 'Контракт'], ['Tab', 'Раздел'], ['Enter', 'Купить'], ['Esc', 'Назад']], 170, HGT - 18);
    },

    contractInfo(c, scr, v) {
      const x = 166, y = 390, w = 462, h = 66, ct = v.c;
      this.win(x, y, w, h, { alpha: 0.9, corners: false });
      this.text(this.clip(ct.name, 196, 11, true), x + 10, y + 7, { size: 11, bold: true, col: C.gold });
      let lx = x + 10;
      for (const l of H.contractLots(ct.give)) { this.lotCell(c, l, lx, y + 24, 34); lx += 38; }
      if (ct.pick) {
        if (lx > x + 10) { this.text('+', lx + 2, y + 33, { size: 14, bold: true, col: C.brassHi }); lx += 16; }
        this.text('на выбор', lx, y + 26, { size: 10, col: C.sub });
        this.text(ct.pick + ' из ' + ct.from.length, lx, y + 40, { size: 12, bold: true, col: C.cream });
      }
      const rx = x + w - 10;
      const note = ct.period ? (ct.period === 'version' ? 'До конца версии: ' : 'До новой недели: ') + timeLeft(v.ends - this.game.now()) : 'Один раз за игру';
      this.text('Можно купить: ' + Math.max(0, v.left) + ' из ' + ct.limit, rx - 128, y + 8, { size: 10, bold: true, align: 'right', col: v.left > 0 ? C.cream : C.bad });
      this.text(note, rx - 128, y + 22, { size: 9, align: 'right', col: C.sub });
      const can = !v.block;
      this.button(rx - 118, y + 36, 118, 24, v.block === 'limit' ? 'Распродано' : 'Купить', () => this.contractAct(scr), { size: 11, active: can, disabled: !can });
    },

    contractAct(scr) {
      const v = this.game.contractList()[scr.csel];
      if (!v) return;
      if (v.block === 'limit') { this.sfx('deny'); this.toast(v.c.period ? 'Лимит исчерпан. Обновление через ' + timeLeft(v.ends - this.game.now()) + '.' : 'Этот контракт продаётся только один раз.'); return; }
      if (v.block === 'jade') { this.sfx('deny'); this.toast('Не хватает звёздного нефрита: нужно ' + fmt(v.c.price) + '.'); return; }
      this.openContractBuy(v.c.id);
    },

    contractsKey(scr, k) {
      const n = this.game.contractList().length, cols = GRID.cols, s0 = scr.csel;
      if (k === 'left' && scr.csel > 0) scr.csel--;
      if (k === 'right' && scr.csel < n - 1) scr.csel++;
      if (k === 'up' && scr.csel >= cols) scr.csel -= cols;
      if (k === 'down') scr.csel = Math.min(n - 1, scr.csel + cols);
      if (scr.csel !== s0) this.sfx('select');
      if (k === 'ok') this.contractAct(scr);
    },

    openContractBuy(id) {
      const ui = this, g = this.game;
      const ct = H.CONTRACTS.find(x => x.id === id), from = ct.from || [], fixed = H.contractLots(ct.give);
      const nOpt = from.length, BUY = nOpt, CANCEL = nOpt + 1;
      this.push({
        sel: nOpt ? 0 : BUY, picks: [],
        toggle(i) {
          const at = this.picks.indexOf(i);
          if (at >= 0) { this.picks.splice(at, 1); ui.sfx('cancel'); return; }
          if (this.picks.length >= ct.pick) { ui.sfx('deny'); ui.toast('Можно выбрать только ' + ct.pick + '. Снимите один из выбранных наборов.'); return; }
          this.picks.push(i); ui.sfx('select');
        },
        buy() {
          if (this.picks.length < (ct.pick || 0)) { ui.sfx('deny'); ui.toast('Выберите ещё ' + (ct.pick - this.picks.length) + '.'); return; }
          const r = g.contractBuy(id, this.picks.slice().sort((a, b) => a - b));
          if (!r) { ui.sfx('deny'); ui.toast('Покупка не прошла.'); return; }
          ui.screens.pop();
          ui.sfx('chest');
          ui.toast('Получено: ' + r.got.join(', ') + '.');
        },
        draw(c) {
          const w = 420, h = nOpt ? 330 : 238, x = W / 2 - w / 2, y = (HGT - h) / 2 - 6;
          c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Покупка контракта' });
          G.rarityCell(c, x + 16, y + 20, 104, 84, ct.rar);
          drawChest(c, ct.look, x + 68, y + 26, 2);
          ui.wrap(ct.name, w - 150, 12, true, true).slice(0, 2).forEach((l, i) => ui.text(l, x + 132, y + 20 + i * 15, { size: 12, bold: true, serif: true, col: C.gold }));
          ui.text('★'.repeat(ct.rar), x + 132, y + 52, { size: 10, col: G.RARITY[ct.rar] });
          ui.wrap(ct.text, w - 150, 9).slice(0, 4).forEach((l, i) => ui.text(l, x + 132, y + 66 + i * 11, { size: 9, col: C.sub }));
          let ty = y + 114;
          if (fixed.length) {
            ui.text('Сразу:', x + 16, ty, { size: 10, bold: true, col: C.cream });
            fixed.forEach((l, i) => { ui.lotCell(c, l, x + 70 + i * 52, ty - 4, 40); });
            ui.text(fixed.map(l => lotName(l) + ' ×' + fmt(l.n)).join(', '), x + 70, ty + 40, { size: 9, col: C.sub });
            ty += 58;
          }
          if (nOpt) {
            ui.text('На выбор ' + ct.pick + ' из ' + nOpt + ':', x + 16, ty, { size: 10, bold: true, col: C.cream });
            ui.text('Выбрано: ' + this.picks.length + '/' + ct.pick, x + w - 16, ty, { size: 10, bold: true, align: 'right', col: this.picks.length === ct.pick ? C.ok : C.gold });
            const cw = 84, gap = (w - 32 - nOpt * cw) / Math.max(1, nOpt - 1);
            from.forEach((opt, i) => {
              const l = H.contractLots(opt)[0], ox = x + 16 + i * (cw + gap), oy = ty + 16, on = this.picks.includes(i);
              if (this.sel === i) { c.fillStyle = C.brassHi; c.fillRect(ox - 2, oy - 2, cw + 4, 82); }
              c.fillStyle = on ? 'rgba(80,60,20,0.95)' : 'rgba(10,12,34,0.95)'; c.fillRect(ox, oy, cw, 78);
              c.strokeStyle = on ? C.brassHi : 'rgba(154,166,208,0.4)'; c.strokeRect(ox + 0.5, oy + 0.5, cw - 1, 77);
              ui.lotCell(c, l, ox + (cw - 40) / 2, oy + 6, 40);
              ui.wrap(lotName(l), cw - 6, 8).slice(0, 2).forEach((t, j) => ui.text(t, ox + cw / 2, oy + 50 + j * 9, { size: 8, align: 'center', col: on ? C.gold : C.cream }));
              if (on) { c.fillStyle = '#3a9a4a'; c.fillRect(ox + cw - 15, oy + 3, 12, 12); ui.text('✓', ox + cw - 9, oy + 3, { size: 10, bold: true, align: 'center', col: '#fff' }); }
              ui.hit(ox, oy, cw, 78, () => { this.sel = i; this.toggle(i); });
            });
            ty += 104;
          }
          c.fillStyle = 'rgba(242,220,154,0.3)'; c.fillRect(x + 14, ty - 6, w - 28, 1);
          ui.text('Цена', x + 16, ty + 2, { size: 11, col: C.sub });
          ui.money(x + 60, ty + 2, 'jade', ct.price, { col: C.gold });
          ui.text('Останется ' + fmt(g.state.jade - ct.price) + ' нефрита', x + w - 16, ty + 3, { size: 10, align: 'right', col: C.dim });
          const ready = this.picks.length === (ct.pick || 0);
          ui.button(x + 40, y + h - 36, 150, 26, 'Купить', () => { this.sel = BUY; this.buy(); }, { size: 12, active: this.sel === BUY, disabled: !ready && this.sel !== BUY });
          ui.button(x + w - 190, y + h - 36, 150, 26, 'Отмена', () => ui.pop(), { size: 12, active: this.sel === CANCEL });
          ui.hints(nOpt ? [['←→', 'Набор'], ['Enter', 'Выбрать'], ['↓', 'К кнопкам'], ['Esc', 'Отмена']] : [['←→', 'Кнопка'], ['Enter', 'Купить'], ['Esc', 'Отмена']], W / 2, y + h + 6, { align: 'center' });
        },
        key(k) {
          if (k === 'back') { ui.pop(); return; }
          const btns = this.sel >= BUY;
          if (k === 'left' || k === 'right') {
            const d = k === 'left' ? -1 : 1;
            if (btns) this.sel = this.sel === BUY ? CANCEL : BUY;
            else this.sel = (this.sel + d + nOpt) % nOpt;
            ui.sfx('select'); return;
          }
          if (k === 'down' && !btns) { this.sel = BUY; ui.sfx('select'); return; }
          if (k === 'up' && btns && nOpt) { this.sel = 0; ui.sfx('select'); return; }
          if (k !== 'ok') return;
          if (this.sel === CANCEL) { ui.pop(); return; }
          if (this.sel === BUY) { this.buy(); return; }
          this.toggle(this.sel);
          if (this.picks.length === ct.pick) this.sel = BUY;
        }
      });
    }
  });

  Object.assign(H, { CONTRACT_LOOKS: LOOKS, contractChestCanvas: chest });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
