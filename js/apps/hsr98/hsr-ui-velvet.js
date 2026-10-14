(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const { C } = H.UI_CONST;

  const VELVET = '#1a2a8a', VELVET_HI = '#3a5ae0', FOG = '255,224,96';
  const WEATHER = [[30, 'Ясно', 'sun'], [15, 'Облачно', 'cloud'], [6, 'Дождь', 'rain'], [0, 'Туман', 'fog']];
  const weatherOf = days => WEATHER.find(w => days > w[0]) || WEATHER[WEATHER.length - 1];

  function weatherIcon(c, kind, x, y, t) {
    if (kind === 'sun') {
      c.fillStyle = '#ffcc40'; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.4; c.fillRect(x + Math.cos(a) * 9 - 1, y + Math.sin(a) * 9 - 1, 2, 2); }
      return;
    }
    c.fillStyle = kind === 'fog' ? '#d8c870' : '#c8d0e0';
    c.beginPath(); c.arc(x - 4, y + 1, 5, 0, Math.PI * 2); c.arc(x + 3, y - 1, 6, 0, Math.PI * 2); c.arc(x + 8, y + 2, 4, 0, Math.PI * 2); c.fill();
    if (kind === 'rain') { c.fillStyle = '#6ab0ff'; for (let i = 0; i < 4; i++) c.fillRect(x - 6 + i * 4, y + 7 + ((t * 30 + i * 5) % 6), 1, 3); }
    if (kind === 'fog') { c.fillStyle = 'rgba(' + FOG + ',0.8)'; for (let i = 0; i < 3; i++) c.fillRect(x - 10 + (i % 2) * 3, y + 7 + i * 3, 20, 1.5); }
  }

  function glasses(c, x, y, on, t) {
    c.lineWidth = 2;
    c.strokeStyle = on ? '#f0c020' : '#5a5a6a';
    c.fillStyle = on ? 'rgba(255,220,90,' + (0.25 + 0.1 * Math.sin(t * 3)).toFixed(2) + ')' : 'rgba(40,40,60,0.6)';
    for (const dx of [-9, 9]) { c.beginPath(); c.rect(x + dx - 7, y - 5, 14, 10); c.fill(); c.stroke(); }
    c.beginPath(); c.moveTo(x - 2, y - 1); c.lineTo(x + 2, y - 1); c.stroke();
    c.lineWidth = 1;
  }

  Object.assign(H.UI.prototype, {
    tarotCard(c, x, y, w, h, arcana, opt = {}) {
      const V = H.VELVET;
      c.fillStyle = '#05061a'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
      c.fillStyle = opt.on ? '#f2e4b0' : '#c8bc94'; c.fillRect(x, y, w, h);
      c.fillStyle = VELVET; c.fillRect(x + 2, y + 2, w - 4, h - 4);
      c.strokeStyle = opt.on ? C.gold : '#8a7a50'; c.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
      this.text(V.ROMAN[arcana], x + w / 2, y + 5, { align: 'center', size: Math.max(8, Math.round(w / 5)), bold: true, serif: true, col: '#f2e4b0', shadow: false });
      if (opt.draw) opt.draw(x + 4, y + 8 + w / 5, w - 8, h - 22 - w / 5);
      this.text(this.fitText(V.ARCANA[arcana], 8, w - 6), x + w / 2, y + h - 12, { align: 'center', size: 8, col: '#f2e4b0', shadow: false });
    },

    midnightBanner(c, bx, by, bw, bh, ban, star, pick, chan) {
      const g = this.game, t = this.t, V = H.VELVET, B = H.BANNERS[ban], S = B.stars[star], comp = ban === 'comp';
      const pity = g.pityOf(ban), BB = g.bannerOf(ban), pity5 = BB.pity5 || T.pity5, left = pity5 - pity.five;
      c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
      const sky = c.createLinearGradient(0, by, 0, by + bh);
      sky.addColorStop(0, '#04061a'); sky.addColorStop(0.7, '#0e1640'); sky.addColorStop(1, '#1a1a2a');
      c.fillStyle = sky; c.fillRect(bx, by, bw, bh);
      c.fillStyle = '#080a1c';
      for (let i = 0; i < 9; i++) { const hx = bx + i * 70 - 10, hh = 40 + G.hash(i, 3, 9) * 50; c.fillRect(hx, by + bh - 70 - hh, 62, hh + 70); if (G.hash(i, 4, 9) > 0.4) { c.fillStyle = 'rgba(255,214,120,0.55)'; c.fillRect(hx + 12, by + bh - 60 - hh * 0.6, 6, 6); c.fillStyle = '#080a1c'; } }
      c.fillStyle = 'rgba(150,170,230,0.35)';
      for (let i = 0; i < 70; i++) { const rx = bx + ((G.hash(i, 7, 1) * bw + t * 30) % bw), ry = by + ((G.hash(7, i, 2) * bh + t * 260 + i * 13) % bh); c.fillRect(rx, ry, 1, 6); }
      const fog = Math.min(1, pity.five / pity5), fh = 26 + fog * 90;
      const fg = c.createLinearGradient(0, by + bh - fh, 0, by + bh);
      fg.addColorStop(0, 'rgba(' + FOG + ',0)'); fg.addColorStop(1, 'rgba(' + FOG + ',' + (0.25 + fog * 0.4).toFixed(2) + ')');
      c.fillStyle = fg; c.fillRect(bx, by + bh - fh, bw, fh);

      const cx = bx + 250, cardW = 132, cardH = 214, cy = by + 30;
      c.fillStyle = 'rgba(58,90,224,' + (0.18 + 0.06 * Math.sin(t * 2)).toFixed(2) + ')';
      c.fillRect(cx - cardW / 2 - 8, cy - 8, cardW + 16, cardH + 16);
      if (comp) {
        this.tarotCard(c, cx - cardW / 2, cy, cardW, cardH, S.arcana, { on: true, draw: (x, y, w, h) => G.drawConeCard(c, S.cone, x + 6, y + 2, w - 12, h - 4, { info: false }) });
      } else {
        this.tarotCard(c, cx - cardW / 2, cy, cardW, cardH, S.arcana, { on: true, draw: (x, y, w, h) => { const gr = c.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#2a3a9a'); gr.addColorStop(1, '#0a0e3a'); c.fillStyle = gr; c.fillRect(x, y, w, h); } });
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(cx, by + bh - 14, 46, 8, 0, 0, Math.PI * 2); c.fill();
        G.drawFigure(c, G.lookOf(star, g), cx, by + bh - 12, 2.2);
      }
      c.restore();

      const lx = bx + 16, ly = by + 14, lw = 118;
      c.fillStyle = '#f2ece0'; c.fillRect(lx, ly, lw, 100);
      c.fillStyle = '#c8243a'; c.fillRect(lx, ly, lw, 18);
      this.text('ПРОГНОЗ · ИНАБА', lx + lw / 2, ly + 4, { align: 'center', size: 9, bold: true, col: '#fff', shadow: false });
      c.fillStyle = '#8a8478'; for (let i = 0; i < 6; i++) c.fillRect(lx + 10 + i * 19, ly - 3, 3, 6);
      const w = weatherOf(left);
      this.text(String(left), lx + 40, ly + 26, { align: 'center', size: 34, bold: true, serif: true, col: left <= 6 ? '#b88a10' : '#2a2430', shadow: false });
      weatherIcon(c, w[2], lx + 92, ly + 42, t);
      this.text('дней до тумана', lx + lw / 2, ly + 68, { align: 'center', size: 10, col: '#4a4250', shadow: false });
      this.text(w[1] + ' · до 4★: ' + (T.pity4 - pity.four), lx + lw / 2, ly + 84, { align: 'center', size: 9, col: '#6a6270', shadow: false });
      glasses(c, lx + 26, ly + 124, !!pity.guar5, t);
      const five = comp ? '«' + H.CONES[S.cone].name + '»' : H.CHARS[star].name;
      this.wrap(pity.guar5 ? 'Очки надеты: следующий 5★ точно ' + five : '5★: ' + Math.round(BB.featRate * 100) + '% на ' + five + '. Промах наденет очки.', lw - 50, 9).slice(0, 3).forEach((l, i) => this.text(l, lx + 50, ly + 110 + i * 11, { size: 9, bold: !!pity.guar5, col: pity.guar5 ? C.gold : C.sub }));

      const ix = bx + 340, rw = 170;
      c.fillStyle = 'rgba(4,6,26,0.85)'; c.fillRect(ix - 8, by + 8, rw + 16, bh - 16);
      c.fillStyle = 'rgba(4,6,26,0.62)'; c.fillRect(lx - 4, ly + 104, lw + 8, 48);
      [['mid', 'Канал'], ['comp', 'Компендиум']].forEach(([id, label], i) => {
        const on = id === ban, tx = ix + i * 72;
        c.fillStyle = on ? VELVET_HI : 'rgba(20,24,60,0.85)'; c.fillRect(tx, by + 12, 68, 16);
        this.text(label, tx + 34, by + 14, { align: 'center', size: 9, bold: on, col: on ? '#fff' : C.sub, shadow: false });
        this.hit(tx, by + 12, 68, 16, () => chan(id));
      });
      let ts = 22;
      while (ts > 11 && Math.max(...S.title.map(x => this.measure(x, ts, true, true))) > rw) ts--;
      this.text(S.title[0], ix, by + 36, { size: ts, bold: true, serif: true, col: '#f2e4b0' });
      this.text(S.title[1], ix, by + 38 + ts + 2, { size: ts, bold: true, serif: true, col: '#f2e4b0' });
      let y = by + 92;
      if (comp) {
        const cd = H.CONES[S.cone];
        this.text('★★★★★ · ' + H.PATHS[cd.path].name, ix, y, { size: 9, col: G.RARITY[5] });
        this.text('Подпись: ' + H.CHARS[cd.sig].name, ix, y + 13, { size: 10, bold: true, col: '#ffd890' });
      } else {
        const ch = H.CHARS[star];
        G.elemIcon(c, ch.elem, ix + 6, y + 6, 6);
        this.text(ch.fullName || ch.name, ix + 16, y, { size: 12, bold: true, col: '#ffd890' });
        this.text('★★★★★ · ' + H.PATHS[ch.path].name + ' · ' + V.arcanaName(S.arcana), ix, y + 14, { size: 9, col: G.RARITY[5] });
      }
      y += 34;
      S.four.forEach((fid, i) => {
        const mx = ix + 16 + i * 42, my = y + 16;
        c.fillStyle = '#05070e'; c.beginPath(); c.arc(mx, my, 17, 0, Math.PI * 2); c.fill();
        if (fid.startsWith('cone:')) G.drawConeCard(c, fid.slice(5), mx - 11, my - 15, 22, 30, { info: false });
        else { c.save(); c.beginPath(); c.arc(mx, my, 15, 0, Math.PI * 2); c.clip(); c.fillStyle = '#1a2250'; c.fillRect(mx - 15, my - 15, 30, 30); G.drawPortrait(c, G.lookOf(fid, g), mx - 15, my - 15, 30); c.restore(); }
        c.strokeStyle = G.RARITY[4]; c.lineWidth = 2; c.beginPath(); c.arc(mx, my, 16, 0, Math.PI * 2); c.stroke(); c.lineWidth = 1;
      });
      y += 40;
      const rules = comp
        ? ['5★: ' + Math.round(T.coneFeatured * 100) + '% на «' + H.CONES[S.cone].name + '», промах даёт гарант. 4★: ' + Math.round(T.coneFeatured * 100) + '% на эти три конуса.', '5★ за ' + T.conePity5 + ', 4★ за ' + T.pity4 + ' прыжков.']
        : ['5★: ' + Math.round(T.midFeatured * 100) + '% на ' + H.CHARS[star].name + ', иначе 5★ стандарта и гарант. 4★: ' + Math.round(T.midFeatured * 100) + '% на Ёсуке, Чие и Юкико.', '5★ за ' + T.pity5 + ', 4★ за ' + T.pity4 + ' прыжков.'];
      rules.forEach(r => this.wrap(r, rw, 9).forEach(l => { this.text(l, ix, y, { size: 9, col: C.cream }); y += 11; }));

      const px = bx + bw - 54, ids = Object.keys(B.stars);
      ids.forEach((id, i) => {
        const on = id === star, sx = px + (on ? -6 : 0), sy = by + 14 + i * 90;
        this.tarotCard(c, sx, sy, 44, 78, B.stars[id].arcana, { on, draw: (x, yy, ww, hh) => { if (comp) G.drawConeCard(c, B.stars[id].cone, x + 2, yy, ww - 4, hh, { info: false }); else { c.fillStyle = '#0a0e3a'; c.fillRect(x, yy, ww, hh); G.drawPortrait(c, G.lookOf(id, g), x + (ww - Math.min(ww, hh)) / 2, yy + (hh - Math.min(ww, hh)) / 2, Math.min(ww, hh)); } } });
        if (!on) { c.fillStyle = 'rgba(4,6,26,0.45)'; c.fillRect(sx, sy, 44, 78); }
        this.hit(sx, sy, 44, 78, () => pick(id));
      });
      if (!g.contractSigned()) this.velvetContract(c, bx, by, bw, bh);
    },

    velvetContract(c, bx, by, bw, bh) {
      const g = this.game, V = H.VELVET, x = bx + 150, y = by + 40, w = 300, h = 200;
      c.fillStyle = 'rgba(2,4,16,0.72)'; c.fillRect(bx, by, bw, bh);
      c.fillStyle = '#efe6cc'; c.fillRect(x, y, w, h);
      c.strokeStyle = VELVET; c.lineWidth = 3; c.strokeRect(x + 6, y + 6, w - 12, h - 12); c.lineWidth = 1;
      this.text('КОНТРАКТ', x + w / 2, y + 16, { align: 'center', size: 16, bold: true, serif: true, col: VELVET, shadow: false });
      this.text('Бархатная комната', x + w / 2, y + 36, { align: 'center', size: 9, col: '#5a5260', shadow: false });
      this.wrap('«' + V.CONTRACT + '»', w - 50, 11).forEach((l, i) => this.text(l, x + w / 2, y + 60 + i * 15, { align: 'center', size: 11, serif: true, col: '#2a2430', shadow: false }));
      this.text('Подпишите, чтобы войти. В подарок ' + T.contractKeys + ' бархатный ключ.', x + w / 2, y + 120, { align: 'center', size: 9, col: '#5a5260', shadow: false });
      this.button(x + w / 2 - 70, y + 148, 140, 28, 'Подписать', () => this.signVelvet(), { bold: true, icon: 'mission' });
    },

    signVelvet() {
      if (!this.game.signContract()) return false;
      this.sfx('confirm');
      this.toast('Контракт подписан. Получено: ' + H.ITEMS.vkey.name + ' ×' + T.contractKeys);
      return true;
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
