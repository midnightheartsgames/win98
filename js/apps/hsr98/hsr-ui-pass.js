(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const fmt = H.fmt;
  const MEDAL = 100;
  const BOX = { x: 366, y: 122, w: 260, h: 176 };
  let medalCv = null;

  function paintMedal(g, s) {
    const cx = s / 2, cy = s * 0.52;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(cx, cy + 43, 30, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6a4a20'; g.beginPath(); g.moveTo(cx - 10, cy + 33); g.lineTo(cx, cy + 46); g.lineTo(cx + 10, cy + 33); g.fill();
    g.fillStyle = '#e8cf8a'; g.beginPath(); g.moveTo(cx - 7, cy + 33); g.lineTo(cx, cy + 43); g.lineTo(cx + 7, cy + 33); g.fill();
    g.fillStyle = '#5a3e18'; g.beginPath(); g.arc(cx, cy, 38, 0, Math.PI * 2); g.fill();
    const rim = g.createLinearGradient(0, cy - 38, 0, cy + 38);
    rim.addColorStop(0, '#fbeab4'); rim.addColorStop(0.5, '#d8b46a'); rim.addColorStop(1, '#9a7434');
    g.fillStyle = rim; g.beginPath(); g.arc(cx, cy, 36.5, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; g.fillStyle = i % 2 ? '#b8924a' : '#fff2c8'; g.fillRect(Math.round(cx + Math.cos(a) * 35), Math.round(cy + Math.sin(a) * 35), 1, 1); }
    const red = g.createRadialGradient(cx - 8, cy - 10, 4, cx, cy, 33);
    red.addColorStop(0, '#f05a40'); red.addColorStop(0.6, '#c42a26'); red.addColorStop(1, '#7a1216');
    g.fillStyle = '#3a0a0c'; g.beginPath(); g.arc(cx, cy, 33, 0, Math.PI * 2); g.fill();
    g.fillStyle = red; g.beginPath(); g.arc(cx, cy, 32, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,190,150,0.25)'; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; g.beginPath(); g.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12); g.lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30); g.stroke(); }
    g.strokeStyle = 'rgba(255,200,160,0.35)'; g.beginPath(); g.arc(cx, cy, 24, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    const kx = cx + 38, ky = cy + 2;
    g.fillStyle = '#9a7434'; g.fillRect(kx - 6, ky - 2, 8, 4);
    for (const dy of [-7, 7]) {
      g.fillStyle = '#7a5a28'; g.beginPath(); g.arc(kx + 6, ky + dy, 6.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#efdcae'; g.beginPath(); g.arc(kx + 6, ky + dy, 5.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3a2410'; g.beginPath(); g.arc(kx + 6, ky + dy, 2.4, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (1.02 + i * 0.13), r = 39, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2);
      g.fillStyle = '#5a4630'; g.fillRect(-7, -5, 14, 10);
      g.fillStyle = i === 4 ? '#f6ecd2' : '#ece0c0'; g.fillRect(-6.5, -4.5, 13, 9);
      g.fillStyle = '#d4c49a'; g.fillRect(-6.5, 2.5, 13, 2);
      g.fillStyle = '#3a2a24'; for (const wx of [-4.5, -0.5, 3.5]) g.fillRect(wx, -2.5, 2, 3);
      if (i === 4) { g.fillStyle = '#c8b88e'; g.fillRect(-3, -7, 6, 3); }
      g.restore();
    }
    g.fillStyle = '#4a0a10'; g.fillRect(cx - 4, cy - 22, 24, 34);
    g.fillStyle = '#e6ddc8'; g.fillRect(cx - 3, cy - 21, 22, 32);
    g.fillStyle = '#b02a2e'; g.fillRect(cx - 3, cy - 21, 22, 7);
    g.fillStyle = '#4a0a10'; g.beginPath(); g.arc(cx + 8, cy - 2, 2.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#b8ac90'; for (let i = 0; i < 4; i++) g.fillRect(cx, cy + 3 + i * 2, i === 3 ? 9 : 15, 1);
    const lx = cx - 14, ly = cy + 4;
    g.fillStyle = '#4a3a24'; g.fillRect(lx - 1, ly - 16, 3, 4);
    g.fillStyle = '#8a7444'; g.fillRect(lx - 7, ly - 13, 15, 3); g.fillRect(lx - 7, ly + 12, 15, 4);
    g.fillStyle = '#d8c48a'; g.fillRect(lx - 6, ly - 12, 13, 2); g.fillRect(lx - 6, ly + 13, 13, 2);
    g.fillStyle = '#5a4630'; g.fillRect(lx - 8, ly - 10, 2, 22); g.fillRect(lx + 7, ly - 10, 2, 22);
    const glow = g.createRadialGradient(lx, ly + 1, 1, lx, ly + 1, 18);
    glow.addColorStop(0, 'rgba(220,250,255,0.85)'); glow.addColorStop(1, 'rgba(160,220,255,0)');
    g.fillStyle = glow; g.fillRect(lx - 20, ly - 18, 40, 40);
    g.fillStyle = '#9ad8f4'; g.beginPath(); g.arc(lx + 0.5, ly + 1, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8fbff'; g.beginPath(); g.arc(lx - 1, ly - 1, 2.6, 0, Math.PI * 2); g.fill();
    const hx = cx + 18, hy = cy + 20;
    g.fillStyle = '#2a0c10'; g.beginPath(); g.ellipse(hx, hy, 11, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8a1a22'; g.beginPath(); g.moveTo(hx - 9, hy); g.lineTo(hx - 7, hy - 10); g.lineTo(hx + 7, hy - 10); g.lineTo(hx + 9, hy); g.fill();
    g.fillStyle = '#c03a3a'; g.fillRect(hx - 7, hy - 10, 14, 2);
    g.fillStyle = '#e8c870'; g.fillRect(hx - 2, hy - 7, 4, 4);
    g.fillStyle = '#1a1018'; g.beginPath(); g.ellipse(hx, hy + 1, 11, 2.4, 0, 0, Math.PI); g.fill();
    for (const [x, y, sz, col] of [[cx - 22, cy + 22, 4, '#9ae0ff'], [cx - 16, cy + 26, 3, '#f4b0d8'], [cx + 4, cy + 26, 3, '#b8e8ff']]) {
      g.fillStyle = col; g.beginPath(); g.moveTo(x, y - sz); g.lineTo(x + sz * 0.6, y); g.lineTo(x, y + sz * 0.7); g.lineTo(x - sz * 0.6, y); g.fill();
    }
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(255,240,200,' + (0.5 + G.hash(i, 2, 7) * 0.5) + ')'; const a = G.hash(i, 3, 7) * Math.PI * 2, d = 40 + G.hash(i, 4, 7) * 8; g.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), 1, 1); }
  }

  function medal() {
    if (!medalCv) { medalCv = G.mkCanvas(MEDAL, MEDAL); paintMedal(medalCv.getContext('2d'), MEDAL); }
    return medalCv;
  }

  function drawMedal(c, x, y, size) {
    const was = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    c.drawImage(medal(), Math.round(x), Math.round(y), size, size);
    c.imageSmoothingEnabled = was;
  }

  Object.assign(H.UI.prototype, {
    passMedal: drawMedal,

    drawPassSupply(c, scr) {
      const g = this.game, s = g.state, P = H.PASS, owed = g.passOwed(), active = g.passActive();
      this.supplyPill(W - 154, 10, 'jade', s.jade);
      const halo = c.createRadialGradient(262, 210, 10, 262, 210, 150);
      halo.addColorStop(0, 'rgba(255,214,150,0.22)'); halo.addColorStop(1, 'rgba(255,214,150,0)');
      c.fillStyle = halo; c.fillRect(160, 60, 220, 300);
      drawMedal(c, 162, 104, 200);
      const state = !active ? 'Пропуск не активен' : g.passClaimedToday() ? 'Сегодня награда уже получена' : 'Награда за сегодня ждёт';
      c.fillStyle = 'rgba(20,14,10,0.78)'; c.fillRect(176, 318, 172, 18);
      this.text(state, 262, 321, { size: 10, align: 'center', col: active ? C.cream : C.sub });
      this.text(active ? (owed ? 'Осталось ' + owed + ' дн.' : 'Сегодня последний день') : 'Купите пропуск, чтобы начать', 262, 342, { size: active ? 14 : 11, bold: active, align: 'center', col: active ? '#fff8ec' : C.dim });
      if (s.pass && s.pass.got) this.text('Получено по пропуску: ' + fmt(s.pass.got) + ' нефрита', 262, 364, { size: 9, align: 'center', col: C.sub });
      const rx = 382, ry = 44;
      c.strokeStyle = 'rgba(242,220,154,0.55)'; c.lineWidth = 1; c.beginPath(); c.arc(rx, ry + 8, 9, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#e8c060'; c.beginPath(); c.arc(rx, ry + 8, 7, 0, Math.PI * 2); c.fill();
      this.text('i', rx, ry + 2, { size: 11, bold: true, serif: true, align: 'center', col: '#2a1a08', shadow: false });
      this.text('Правила', rx + 14, ry + 2, { size: 12, col: C.cream });
      this.hit(rx - 10, ry - 2, 80, 22, () => this.openPassRules());
      this.text('Пропуск снабжения', BOX.x + BOX.w / 2, 70, { size: 20, bold: true, serif: true, align: 'center', col: C.gold });
      this.text('экспресса', BOX.x + BOX.w / 2, 94, { size: 20, bold: true, serif: true, align: 'center', col: C.gold });
      this.win(BOX.x, BOX.y, BOX.w, BOX.h, { alpha: 0.82, corners: false });
      c.strokeStyle = 'rgba(242,220,154,0.35)'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(BOX.x + BOX.w / 2 + 0.5, BOX.y + 12); c.lineTo(BOX.x + BOX.w / 2 + 0.5, BOX.y + BOX.h - 12); c.stroke(); c.setLineDash([]);
      const col = (x, head, n, foot) => {
        const cx = x + BOX.w / 4;
        this.wrap(head, BOX.w / 2 - 16, 10).slice(0, 2).forEach((l, i) => this.text(l, cx, BOX.y + 12 + i * 12, { size: 10, align: 'center', col: C.cream }));
        const orb = c.createRadialGradient(cx, BOX.y + 78, 4, cx, BOX.y + 78, 34);
        orb.addColorStop(0, 'rgba(30,26,60,0.95)'); orb.addColorStop(1, 'rgba(10,8,24,0.95)');
        c.fillStyle = orb; c.beginPath(); c.arc(cx, BOX.y + 78, 33, 0, Math.PI * 2); c.fill();
        c.strokeStyle = C.brass; c.beginPath(); c.arc(cx, BOX.y + 78, 33.5, 0, Math.PI * 2); c.stroke();
        G.itemIcon(c, 'jade', cx - 24, BOX.y + 54, 48);
        this.text(fmt(n), cx, BOX.y + 116, { size: 22, bold: true, align: 'center', col: '#fff8ec' });
        foot.forEach((f, i) => this.text(f, cx, BOX.y + 144 + i * 13, { size: 10, align: 'center', col: i ? C.gold : C.sub }));
      };
      col(BOX.x, 'После приобретения вы получите', P.now, ['Звёздный нефрит']);
      col(BOX.x + BOX.w / 2, 'Ежедневные награды на ' + P.days + ' дней', P.daily, ['Всего за ' + P.days + ' дней', fmt(P.daily * P.days) + ' нефрита']);
      const can = g.passCanBuy(), label = (active ? 'Обновить: ' : 'Купить: ') + P.priceText;
      const bx = BOX.x + 20, by = 314, bw = BOX.w - 40, bh = 30;
      c.fillStyle = '#000'; c.beginPath(); c.arc(bx + bh / 2, by + bh / 2, bh / 2 + 1, Math.PI / 2, Math.PI * 1.5); c.arc(bx + bw - bh / 2, by + bh / 2, bh / 2 + 1, -Math.PI / 2, Math.PI / 2); c.fill();
      const pill = c.createLinearGradient(0, by, 0, by + bh);
      if (can) { pill.addColorStop(0, '#fff2b0'); pill.addColorStop(0.5, '#f4c84a'); pill.addColorStop(1, '#c8902a'); } else { pill.addColorStop(0, '#3a3c50'); pill.addColorStop(1, '#22243a'); }
      c.fillStyle = pill; c.beginPath(); c.arc(bx + bh / 2, by + bh / 2, bh / 2, Math.PI / 2, Math.PI * 1.5); c.arc(bx + bw - bh / 2, by + bh / 2, bh / 2, -Math.PI / 2, Math.PI / 2); c.fill();
      if (can) { c.strokeStyle = 'rgba(140,90,20,0.6)'; c.beginPath(); c.arc(bx + bh / 2 + 4, by + bh / 2, bh / 2 - 5, Math.PI / 2, Math.PI * 1.5); c.arc(bx + bw - bh / 2 - 4, by + bh / 2, bh / 2 - 5, -Math.PI / 2, Math.PI / 2); c.closePath(); c.stroke(); }
      this.text(can ? label : 'Не больше ' + P.max + ' дней', bx + bw / 2, by + 8, { size: 13, bold: true, align: 'center', col: can ? '#2a1a08' : '#6a6e88', shadow: false });
      this.hit(bx, by, bw, bh, () => this.passBuy());
      this.text(can ? 'Оплата картой через Steam' : 'Пропуск уже действует ' + g.passLeft() + ' дн.', bx + bw / 2, by + bh + 6, { size: 9, align: 'center', col: C.dim });
      this.hints([['Enter', active ? 'Обновить' : 'Купить'], ['R', 'Правила'], ['Tab', 'Раздел'], ['Esc', 'Назад']], 170, HGT - 18);
    },

    passSupplyKey(scr, k, code) {
      if (code === 'KeyR') { this.openPassRules(); return; }
      if (k === 'ok') this.passBuy();
    },

    passBuy() {
      const g = this.game, P = H.PASS, store = this.opts.store;
      if (!g.passCanBuy()) { this.sfx('deny'); this.toast('Пропуск уже действует ' + g.passLeft() + ' дн. Больше ' + P.max + ' дней купить нельзя.'); return 'max'; }
      if (!store) { this.sfx('deny'); this.toast('В этом издании нет Steam: пропуск продаётся только в игре из Steam.'); return 'none'; }
      const r = store.buy({ sku: P.sku, title: P.name, text: P.text, price: P.price });
      if (r === 'nosteam') { this.sfx('deny'); this.toast('Для оплаты нужен клиент Steam. Его можно скачать на www.steampowered.com.'); }
      else if (r === 'open') { this.sfx('confirm'); this.toast('Steam открыл окно оплаты.'); }
      else { this.sfx('deny'); this.toast('Steam не отвечает. Попробуйте позже.'); }
      return r;
    },

    storeSync() {
      const g = this.game, store = this.opts.store;
      if (!store || !g || this.mode !== 'field') return 0;
      let last = null, n = 0;
      for (const o of store.take([H.PASS.sku])) { const r = g.passGrant(o.id); if (r) { last = r; n++; } }
      if (!n) return 0;
      this.writeSave('auto');
      this.openPassGot(last, n);
      return n;
    },

    passTick(dt) {
      this.passT = (this.passT || 0) + dt;
      if (this.passT < 1) return;
      this.passT = 0;
      this.storeSync();
      const g = this.game;
      if (this.screens.length || this.dlg || g.busy() || g.cg || !g.passReady()) return;
      this.openPassDaily(g.passClaim());
    },

    openPassGot(r, n) {
      const ui = this, P = H.PASS;
      this.sfx('star4');
      this.push({
        draw(c) {
          const x = W / 2 - 190, y = 130, w = 380, h = 214;
          c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: P.name });
          drawMedal(c, x + 12, y + 22, 110);
          ui.text(n > 1 ? 'Оплачено пропусков: ' + n : 'Оплата прошла, пропуск активен', x + 132, y + 26, { size: 12, bold: true, col: C.gold });
          let ty = y + 50;
          ui.money(x + 132, ty, 'jade', '+' + fmt(P.now * n), { col: C.cream }); ui.text('сразу после покупки', x + 200, ty + 1, { size: 10, col: C.sub }); ty += 22;
          if (r.day) { ui.money(x + 132, ty, 'jade', '+' + r.day.jade, { col: C.cream }); ui.text('награда за сегодня', x + 200, ty + 1, { size: 10, col: C.sub }); ty += 22; }
          ui.text('Осталось ' + r.left + ' дн. по ' + P.daily + ' нефрита', x + 132, ty + 4, { size: 11, col: C.cream });
          ui.wrap('Награда приходит, когда вы заходите в игру. День начинается в 04:00.', w - 150, 10).forEach((l, i) => ui.text(l, x + 132, ty + 24 + i * 12, { size: 10, col: C.dim }));
          ui.button(W / 2 - 60, y + h - 36, 120, 24, 'Отлично', () => ui.pop(), { active: true, size: 11 });
        },
        key(k) { if (k === 'ok' || k === 'back') ui.pop(); }
      });
    },

    openPassDaily(r) {
      const ui = this, P = H.PASS;
      this.sfx('chest');
      this.push({
        draw(c) {
          const x = W / 2 - 160, y = 120, w = 320, h = 232;
          c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Снабжение экспресса' });
          const tx = x + 40, ty = y + 22, tw = w - 80, th = 104;
          c.fillStyle = '#3a0c10'; c.fillRect(tx - 1, ty - 1, tw + 2, th + 2);
          const paper = c.createLinearGradient(0, ty, 0, ty + th);
          paper.addColorStop(0, '#f4ead2'); paper.addColorStop(1, '#ddcfae');
          c.fillStyle = paper; c.fillRect(tx, ty, tw, th);
          c.fillStyle = '#b02a2e'; c.fillRect(tx, ty, tw, 18);
          ui.text('ПРОПУСК СНАБЖЕНИЯ', tx + tw / 2, ty + 3, { size: 10, bold: true, align: 'center', col: '#fff4e0', shadow: false });
          c.strokeStyle = '#9a8a6a'; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(tx + tw - 44.5, ty + 20); c.lineTo(tx + tw - 44.5, ty + th - 2); c.stroke(); c.setLineDash([]);
          G.itemIcon(c, 'jade', tx + 18, ty + 30, 44);
          ui.text('+' + r.jade, tx + 70, ty + 40, { size: 22, bold: true, col: '#7a1a1e', shadow: false });
          ui.text('звёздного нефрита', tx + 70, ty + 66, { size: 10, col: '#5a4a3a', shadow: false });
          c.fillStyle = '#1a1018'; c.beginPath(); c.arc(tx + tw - 22, ty + 58, 7, 0, Math.PI * 2); c.fill();
          ui.text(r.left ? 'Осталось ' + r.left + ' дн.' : 'Это последний день пропуска', W / 2, ty + th + 12, { size: 12, bold: true, align: 'center', col: C.gold });
          ui.wrap(r.left ? P.quote : 'Продлить пропуск можно в Снабжении, раздел «Снабжение экспресса».', w - 40, 10).forEach((l, i) => ui.text(l, W / 2, ty + th + 32 + i * 12, { size: 10, align: 'center', col: C.sub }));
          ui.button(W / 2 - 60, y + h - 34, 120, 24, 'Получить', () => ui.pop(), { active: true, size: 11 });
        },
        key(k) { if (k === 'ok' || k === 'back') ui.pop(); }
      });
    },

    openPassRules() {
      const ui = this;
      this.push({
        draw(c) {
          const x = W / 2 - 210, y = 70, w = 420;
          const lines = H.PASS_RULES.map(p => ui.wrap(p, w - 56, 11));
          const h = 76 + lines.reduce((a, l) => a + l.length * 14 + 6, 0);
          c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Правила' });
          let ty = y + 22;
          lines.forEach((ls, i) => {
            ui.diamond(x + 24, ty + 6, 3, C.brassHi, '#1a1208');
            ls.forEach(l => { ui.text(l, x + 36, ty, { size: 11, col: i === H.PASS_RULES.length - 1 ? C.gold : C.cream }); ty += 14; });
            ty += 6;
          });
          ui.button(W / 2 - 60, y + h - 36, 120, 24, 'Понятно', () => ui.pop(), { active: true, size: 11 });
        },
        key(k, code) { if (k === 'ok' || k === 'back' || code === 'KeyR') ui.pop(); }
      });
    }
  });

  Object.assign(H, { passMedal: medal });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
