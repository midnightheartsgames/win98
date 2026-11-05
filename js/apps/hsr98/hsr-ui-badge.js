(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const { C } = H.UI_CONST;
  const PX = 188, PY = 40, PW = 440;
  const HALL = '#0a0c24', TRUSS = '#3a3e58', PAPER = '#f2ecdc', INK = '#2a2430';
  const SPOTS = { makoto: 0, amanda: 1, talleah: 2 };
  const MASK = { makoto: 'studentLook', amanda: null, talleah: 'rangerLook' };
  const REVEAL = { makoto: 'look', amanda: 'pinkLook', talleah: 'look' };

  const lookFor = (id, lit) => { const k = H.CHARS[id]; const key = lit ? REVEAL[id] : MASK[id]; return (key && k[key]) || k.look; };

  function hallBack(ui, c, bx, by, bw, bh, t) {
    const sky = c.createLinearGradient(0, by, 0, by + bh);
    sky.addColorStop(0, '#05061a'); sky.addColorStop(0.65, '#14123a'); sky.addColorStop(1, '#241a3a');
    c.fillStyle = sky; c.fillRect(bx, by, bw, bh);
    c.fillStyle = TRUSS;
    c.fillRect(bx, by + 10, bw, 2); c.fillRect(bx, by + 22, bw, 2);
    for (let x = bx; x < bx + bw; x += 16) { c.beginPath(); c.moveTo(x, by + 12); c.lineTo(x + 8, by + 22); c.lineTo(x + 10, by + 22); c.lineTo(x + 2, by + 12); c.fill(); }
    for (let i = 0; bx + 40 + i * 66 < bx + bw - 16; i++) {
      const lx = bx + 40 + i * 66, on = 0.6 + 0.4 * Math.sin(t * 2 + i);
      c.fillStyle = '#1a1c2a'; c.fillRect(lx - 4, by + 24, 8, 6);
      c.fillStyle = 'rgba(255,236,190,' + on.toFixed(2) + ')'; c.fillRect(lx - 2, by + 30, 4, 2);
    }
    const sx = Math.round(bx + bw / 2 - 155);
    c.fillStyle = '#16143a'; c.fillRect(sx, by + 40, 310, 30);
    c.fillStyle = '#2c2a6a'; c.fillRect(sx, by + 40, 310, 2);
    ui.text('КОН-ТОН × КЕЙП-СИТИ', bx + bw / 2, by + 46, { align: 'center', size: 14, bold: true, serif: true, col: '#f2d8ff' });
  }

  function crowd(c, bx, by, bw, bh, t, rows) {
    for (let r = 0; r < rows; r++) {
      const y0 = by + bh - 28 + r * 12;
      for (let i = 0; bx + 6 + i * 18 < bx + bw - 6; i++) {
        const x = bx + 6 + i * 18 + (r % 2) * 9, sway = Math.sin(t * 2.4 + i * 0.7 + r) * 2;
        c.fillStyle = r ? '#0a0818' : '#120e24';
        c.beginPath(); c.arc(x + sway * 0.4, y0, 6, 0, Math.PI * 2); c.fill();
        c.fillRect(x - 8 + sway * 0.4, y0 + 4, 16, 20);
        if ((i * 7 + r * 3) % 5 === 0) {
          const col = ['#ff5a9a', '#5ae8f8', '#ffd850', '#9a7aff'][(i + r) % 4];
          c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 6, y0 - 2); c.lineTo(x + 6 + sway * 2.2, y0 - 16); c.stroke(); c.lineWidth = 1;
        }
      }
    }
  }

  function beam(c, x, top, feet, col, a) {
    const gr = c.createLinearGradient(0, top, 0, feet);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, col);
    c.save(); c.globalAlpha = a;
    c.fillStyle = gr; c.beginPath(); c.moveTo(x - 10, top); c.lineTo(x + 10, top); c.lineTo(x + 54, feet); c.lineTo(x - 54, feet); c.closePath(); c.fill();
    c.fillStyle = col; c.globalAlpha = a * 0.7; c.beginPath(); c.ellipse(x, feet, 54, 10, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };

  Object.assign(H.UI.prototype, {
    contonBanner(c, bx, by, bw, bh, ban, star, pick, chan) {
      const g = this.game, t = this.t;
      if (!this.conFx || this.conFx.star !== star) { if (this.conFx) this.sfx('lever'); this.conFx = { star, t0: t }; }
      c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
      hallBack(this, c, bx, by, bw, bh, t);
      if (ban === 'alley') this.alleyScene(c, bx, by, bw, bh, star, pick);
      else this.stageScene(c, bx, by, bw, bh, star, pick);
      c.restore();
      this.conPlate(c, bx, by, ban, star);
      this.conChannels(c, bx + bw - 182, by + 8, ban, chan);
      this.conProgram(c, bx + bw - 140, by + 34, ban, star);
      if (ban === 'con') { this.conVisitor(c, bx + 12, by + bh - 96); this.conQueue(c, bx + 150, by + bh - 20, ban); }
      if (!g.conRegistered()) this.conDesk(c, bx, by, bw, bh);
    },

    stageScene(c, bx, by, bw, bh, star, pick) {
      const t = this.t, B = H.BANNERS.con, ids = Object.keys(B.stars), feet = by + bh - 40;
      c.fillStyle = '#1c1838'; c.beginPath(); c.ellipse(bx + 305, feet + 4, 190, 22, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2a2450'; c.fillRect(bx + 115, feet + 4, 380, 3);
      const fx = this.conFx, k = Math.min(1, (t - fx.t0) / 0.4);
      ids.forEach(id => {
        const x = bx + 205 + SPOTS[id] * 100, lit = id === star, S = B.stars[id];
        if (lit) beam(c, x, by + 32, feet, rgba(S.col, 0.55), 0.5 + 0.5 * k);
        c.save();
        c.globalAlpha = lit ? 1 : 0.5;
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(x, feet, 26, 6, 0, 0, Math.PI * 2); c.fill();
        if (lit && id === 'talleah') for (const dx of [-44, 44]) G.drawEnemy(c, { id: 'gynoid' }, x + dx, feet + 2, 84, { t, aura: false });
        G.drawFigure(c, lookFor(id, lit), x, feet, 1.8);
        c.restore();
        if (lit && k < 1) {
          c.save(); c.globalAlpha = 1 - k;
          for (let i = 0; i < 14; i++) { const an = i / 14 * Math.PI * 2 + k * 3, r = 20 + k * 60; c.fillStyle = i % 2 ? S.col : '#ffffff'; c.fillRect(x + Math.cos(an) * r - 2, feet - 90 + Math.sin(an) * r * 0.8 - 2, 4, 4); }
          c.restore();
        }
        this.hit(x - 36, feet - 180, 72, 184, () => pick(id));
      });
      crowd(c, bx, by, bw, bh, t, 2);
    },

    alleyScene(c, bx, by, bw, bh, star, pick) {
      const g = this.game, t = this.t, B = H.BANNERS.alley, S = B.stars[star], ids = Object.keys(B.stars);
      const floor = by + bh - 60;
      for (let i = 0; i < 5; i++) {
        const lx = bx + 90 + i * 110;
        c.fillStyle = 'rgba(255,236,190,0.08)'; c.beginPath(); c.moveTo(lx - 6, by + 30); c.lineTo(lx + 6, by + 30); c.lineTo(lx + 44, floor); c.lineTo(lx - 44, floor); c.fill();
      }
      c.fillStyle = '#1a1430'; c.fillRect(bx, floor, bw, bh - (floor - by));
      G.drawBust(c, lookFor(star, true), bx + 214, floor - 118 + Math.sin(t * 3) * 2, 1.5);
      c.fillStyle = '#5a3a2a'; c.fillRect(bx + 120, floor - 22, 370, 10);
      c.fillStyle = '#3a241a'; c.fillRect(bx + 120, floor - 12, 370, 34);
      c.fillStyle = '#e8e0f0'; c.fillRect(bx + 120, floor - 24, 370, 3);
      const ex = bx + 280, ey = by + 78;
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(ex + 40, ey); c.lineTo(ex + 10, floor - 22); c.moveTo(ex + 40, ey); c.lineTo(ex + 70, floor - 22); c.stroke(); c.lineWidth = 1;
      c.fillStyle = rgba(S.col, 0.35); c.fillRect(ex - 6, ey - 6, 92, 128);
      G.drawConeCard(c, S.cone, ex, ey, 80, 116, { info: false });
      c.save(); c.translate(ex + 72, ey + 104); c.rotate(-0.18);
      c.fillStyle = PAPER; c.fillRect(-18, -9, 36, 18);
      this.text('75%', 0, -7, { align: 'center', size: 12, bold: true, col: '#c8243a', shadow: false });
      c.restore();
      S.four.forEach((f, i) => {
        const sx = bx + 130 + (i === 2 ? 270 : i * 64), sy = floor - 92;
        c.fillStyle = '#2a2a3a'; c.fillRect(sx + 20, sy + 60, 4, 30);
        G.drawConeCard(c, f.slice(5), sx, sy, 44, 62, { info: false });
      });
      ids.forEach((id, i) => {
        const on = id === star, x = bx + 18, y = by + 140 + i * 30;
        c.fillStyle = on ? rgba(B.stars[id].col, 0.8) : 'rgba(10,10,30,0.7)'; c.fillRect(x, y, 112, 24);
        G.drawPortrait(c, G.lookOf(id, g), x + 3, y + 2, 20);
        this.text(this.fitText(H.CONES[B.stars[id].cone].name, 9, 82, on), x + 27, y + 7, { size: 9, bold: on, col: on ? '#fff' : C.sub });
        this.hit(x, y, 112, 24, () => pick(id));
      });
      crowd(c, bx, by, bw, bh, t, 1);
    },

    conPlate(c, bx, by, ban, star) {
      const S = H.BANNERS[ban].stars[star], ch = H.CHARS[star], x = bx + 12, y = by + 36, w = 134;
      c.fillStyle = 'rgba(6,6,24,0.86)'; c.fillRect(x, y, w, 92);
      c.fillStyle = S.col; c.fillRect(x, y, 3, 92);
      let ts = 16;
      while (ts > 10 && Math.max(...S.title.map(s => this.measure(s, ts, true, true))) > w - 14) ts--;
      S.title.forEach((l, i) => this.text(l, x + 10, y + 6 + i * (ts + 2), { size: ts, bold: true, serif: true, col: '#ffe8f4' }));
      const yy = y + 12 + 2 * (ts + 2);
      if (ban === 'alley') {
        const cd = H.CONES[S.cone];
        this.text('★★★★★ · ' + H.PATHS[cd.path].name, x + 10, yy, { size: 9, col: G.RARITY[5] });
        this.text('Подпись: ' + ch.name, x + 10, yy + 14, { size: 10, bold: true, col: '#ffd890' });
        return;
      }
      G.elemIcon(c, ch.elem, x + 16, yy + 6, 6);
      this.text(this.fitText(ch.fullName || ch.name, 11, w - 34, true), x + 26, yy, { size: 11, bold: true, col: '#ffd890' });
      this.text('★★★★★ · ' + H.PATHS[ch.path].name, x + 10, yy + 15, { size: 9, col: G.RARITY[5] });
      G.pathIcon(c, ch.path, x + 13 + this.measure('★★★★★ · ' + H.PATHS[ch.path].name, 9), yy + 14, 11, G.RARITY[5]);
    },

    conChannels(c, x, y, ban, chan) {
      [['con', 'Главная сцена'], ['alley', 'Аллея']].forEach(([id, label], i) => {
        const on = id === ban, w = i ? 64 : 104, tx = x + (i ? 108 : 0);
        c.fillStyle = on ? '#8a2a6a' : 'rgba(20,16,50,0.88)'; c.fillRect(tx, y, w, 18);
        c.strokeStyle = on ? '#ffb0d8' : '#4a3a70'; c.strokeRect(tx + 0.5, y + 0.5, w - 1, 17);
        this.text(label, tx + w / 2, y + 3, { align: 'center', size: 10, bold: on, col: on ? '#fff' : C.sub, shadow: false });
        this.hit(tx, y, w, 18, () => chan(id));
      });
    },

    conProgram(c, x, y, ban, star) {
      const g = this.game, B = g.bannerOf(ban), S = H.BANNERS[ban].stars[star], alley = ban === 'alley', w = 128, h = 176;
      c.fillStyle = '#1a1420'; c.fillRect(x + 3, y + 3, w, h);
      c.fillStyle = PAPER; c.fillRect(x, y, w, h);
      c.fillStyle = '#c8243a'; c.fillRect(x, y, w, 20);
      c.fillStyle = '#d8d0bc'; c.fillRect(x + w / 2 - 1, y + 20, 2, h - 20);
      this.text(alley ? 'ПРОГРАММКА · АЛЛЕЯ' : 'ПРОГРАММКА · СЦЕНА', x + w / 2, y + 5, { align: 'center', size: 9, bold: true, col: '#fff', shadow: false });
      const five = alley ? '«' + H.CONES[S.cone].name + '»' : H.CHARS[star].name;
      const rate5 = alley ? T.coneRate5 : T.rate5, pity5 = alley ? T.conePity5 : T.pity5, feat = Math.round((alley ? T.coneFeatured : T.conFeatured) * 100);
      const lines = alley
        ? ['5★ ' + (rate5 * 100).toFixed(1).replace('.', ',') + '%, точно за ' + pity5 + '.', feat + '% это ' + five + ', иначе конус из стандарта.', '4★ ' + Math.round(T.rate4 * 100) + '%, каждый ' + T.pity4 + '-й. ' + feat + '% из трёх ниже.']
        : ['5★ ' + (rate5 * 100).toFixed(1).replace('.', ',') + '%, точно за ' + pity5 + '.', feat + '% это ' + five + ', иначе герой стандарта.', '4★ ' + Math.round(T.rate4 * 100) + '%, каждый ' + T.pity4 + '-й. ' + feat + '% тройка ниже.'];
      let yy = y + 26;
      lines.forEach(l => this.wrap(l, w - 12, 9).forEach(s => { this.text(s, x + 6, yy, { size: 9, col: INK, shadow: false }); yy += 11; }));
      yy += 4;
      S.four.forEach((f, i) => {
        const fx = x + 8 + i * 40, fy = yy;
        c.fillStyle = G.RARITY[4]; c.fillRect(fx - 1, fy - 1, 34, 34);
        if (f.startsWith('cone:')) { c.fillStyle = '#1a1430'; c.fillRect(fx, fy, 32, 32); G.drawConeCard(c, f.slice(5), fx + 5, fy + 1, 22, 30, { info: false }); }
        else G.drawPortrait(c, G.lookOf(f, g), fx, fy, 32);
      });
      if (!alley && B.featRate) this.text('Казума: ' + Math.round(T.kazumaCameo * 100) + '% среди 4★', x + 6, yy + 38, { size: 8, col: '#6a6270', shadow: false });
    },

    conVisitor(c, x, y) {
      const g = this.game, pity = g.pityOf('con'), guar = !!pity.guar5;
      c.strokeStyle = '#2a3a8a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 20, y - 18); c.lineTo(x + 46, y + 6); c.lineTo(x + 72, y - 18); c.stroke(); c.lineWidth = 1;
      c.fillStyle = '#14141e'; c.fillRect(x + 4, y + 4, 86, 66);
      c.fillStyle = PAPER; c.fillRect(x + 5, y + 5, 84, 64);
      c.fillStyle = '#e0304a'; c.fillRect(x + 5, y + 5, 84, 6);
      c.fillStyle = '#ff6aa8'; c.fillRect(x + 5, y + 11, 84, 2);
      c.fillStyle = '#4a90e0'; c.fillRect(x + 5, y + 13, 84, 2);
      c.fillStyle = '#b8c0d0'; c.fillRect(x + 9, y + 19, 30, 30);
      G.drawPortrait(c, G.lookOf('trail', g), x + 9, y + 19, 30);
      this.text(this.fitText(g.state.name, 10, 44, true), x + 44, y + 21, { size: 10, bold: true, col: INK, shadow: false });
      this.text('Кон-Тон', x + 44, y + 35, { size: 8, col: '#6a6270', shadow: false });
      c.fillStyle = guar ? '#d8a020' : '#2a5ad8'; c.fillRect(x + 5, y + 53, 84, 14);
      this.text(guar ? 'ГАРАНТИЯ' : 'УЧАСТНИК', x + 47, y + 55, { align: 'center', size: 9, bold: true, col: '#fff', shadow: false });
    },

    conQueue(c, x, y, ban) {
      const g = this.game, pity = g.pityOf(ban), left = T.pity5 - pity.five, n = Math.min(10, Math.ceil(left / 6)), glow = left <= 10;
      c.fillStyle = 'rgba(6,6,24,0.8)'; c.fillRect(x - 4, y - 18, 300, 22);
      for (let i = 0; i < 10; i++) {
        const sx = x + i * 14, on = i < n;
        c.fillStyle = on ? (i === 0 && glow ? '#ffd850' : '#8a84b8') : '#2a2840';
        c.beginPath(); c.arc(sx + 5, y - 12, 3, 0, Math.PI * 2); c.fill();
        c.fillRect(sx + 1, y - 9, 8, 9);
      }
      this.text('Очередь к сцене: ' + left, x + 148, y - 15, { size: 10, bold: glow, col: glow ? C.gold : C.cream });
    },

    conDesk(c, bx, by, bw, bh) {
      const g = this.game, x = bx + 130, y = by + 34, w = 340, h = 222;
      c.fillStyle = 'rgba(2,2,14,0.74)'; c.fillRect(bx, by, bw, bh);
      c.fillStyle = '#2a1e3a'; c.fillRect(x, y, w, h);
      c.strokeStyle = '#ff9ac8'; c.lineWidth = 2; c.strokeRect(x + 3, y + 3, w - 6, h - 6); c.lineWidth = 1;
      this.text('СТОЙКА РЕГИСТРАЦИИ', x + w / 2, y + 12, { align: 'center', size: 15, bold: true, serif: true, col: '#ffd8ec' });
      G.drawBust(c, G.lookOf('pompom', g), x + 12, y + 40, 1.4);
      c.fillStyle = '#c8243a'; c.fillRect(x + 22, y + 124, 70, 10);
      this.text('STAFF', x + 57, y + 124, { align: 'center', size: 8, bold: true, col: '#fff', shadow: false });
      const fx = x + 120, fy = y + 40;
      c.fillStyle = PAPER; c.fillRect(fx, fy, 196, 108);
      c.fillStyle = '#e0304a'; c.fillRect(fx, fy, 196, 8);
      c.fillStyle = '#ff6aa8'; c.fillRect(fx, fy + 8, 196, 3);
      c.fillStyle = '#4a90e0'; c.fillRect(fx, fy + 11, 196, 3);
      c.fillStyle = '#b8c0d0'; c.fillRect(fx + 10, fy + 24, 48, 48);
      G.drawPortrait(c, G.lookOf('trail', g), fx + 10, fy + 24, 48);
      this.text(this.fitText(g.state.name, 13, 120, true), fx + 68, fy + 26, { size: 13, bold: true, col: INK, shadow: false });
      this.text('Участник Кон-Тона', fx + 68, fy + 44, { size: 9, col: '#6a6270', shadow: false });
      this.stamp(fx + 140, fy + 80, 'КОСПЛЕЕР');
      this.wrap('«Бейдж носить на шее! Без бейджа в зал не пускаем!»', w - 24, 10).forEach((l, i) => this.text(l, x + w / 2, y + 154 + i * 13, { align: 'center', size: 10, col: '#f0e0ec' }));
      this.button(x + w / 2 - 80, y + h - 38, 160, 26, 'Получить бейдж', () => this.contonRegister(), { bold: true, icon: 'mission' });
    },

    contonRegister() {
      if (!this.game.conRegister()) return false;
      this.sfx('confirm');
      this.toast('Регистрация пройдена. Получено: ' + H.ITEMS.badge.name + ' ×' + T.conRegBadges);
      return true;
    },

    contonPage(c, scr) {
      const g = this.game, t = this.t, D = H.CONTON_BANNER.DAYS, cd = g.conDays();
      const eb = this.eventBox ? this.eventBox() : { px: PX, py: PY, pw: PW, wide: false };
      const hx = eb.px + 4, hy = eb.py + 4, hw = eb.pw - 8, hh = 96;
      hallBack(this, c, hx, hy - 30, hw, hh + 30, t);
      c.fillStyle = 'rgba(6,6,24,0.6)'; c.fillRect(hx, hy, hw, hh);
      this.text('Четыре дня Кон-Тона', hx + 14, hy + 54, { size: 18, bold: true, serif: true, col: '#ffe8f4' });
      this.text('Заходите в игру четыре разных дня. Каждый день конвента даёт бейджи.', hx + 14, hy + 78, { size: 10, col: C.cream });
      const sy = hy + hh + 10, gap = eb.wide ? 8 : 3, cw = (hw - 8 - gap * 3) / 4;
      D.forEach(([day, n], i) => {
        const x = hx + 4 + i * (cw + gap), y = sy, open = i < cd.days, got = !!cd.got[i], sel = scr.pick === i;
        c.fillStyle = sel ? '#3a2a5a' : '#1c1838'; c.fillRect(x, y, cw, 230);
        c.strokeStyle = sel ? C.brassHi : '#4a3a70'; c.strokeRect(x + 0.5, y + 0.5, cw - 1, 229);
        c.fillStyle = ['#e0304a', '#ff6aa8', '#4a90e0', '#8a7aff'][i]; c.fillRect(x + 1, y + 1, cw - 2, 22);
        this.text(day, x + cw / 2, y + 5, { align: 'center', size: 11, bold: true, col: '#fff' });
        this.text('День ' + (i + 1), x + cw / 2, y + 32, { align: 'center', size: 10, col: C.sub });
        const cs = eb.wide ? 56 : 48;
        this.rewardCell(c, 'badge', n, x + cw / 2 - cs / 2, y + 54, cs);
        this.text(got ? 'Получено' : open ? 'Можно забрать' : 'Ещё не наступил', x + cw / 2, y + (eb.wide ? 122 : 116), { align: 'center', size: 10, bold: open && !got, col: got ? C.ok : open ? C.gold : C.dim });
        if (got) this.stamp(x + cw / 2, y + 160, 'БЫЛ');
        else if (eb.wide && open) {
          this.button(x + 14, y + 188, cw - 28, 26, 'Получить', () => this.conDayPick(scr, i), { active: sel, bold: true });
        }
        this.hit(x, y, cw, 230, () => this.conDayPick(scr, i));
      });
      this.text('Вход: ' + cd.days + ' из ' + D.length + ' · новый день в 04:00', hx + hw / 2, sy + 244, { align: 'center', size: 10, col: C.sub });
    },

    conDayPick(scr, i) {
      const g = this.game;
      scr.pick = i;
      if (scr.report(g.claimConDay(i))) return;
      this.toast(g.state.conton && g.state.conton.got[i] ? 'Эта награда уже получена.' : 'Этот день конвента ещё не наступил.');
    }
  });

  const TAB = {
    id: 'conton', title: 'Четыре дня Кон-Тона', icon: 'badge', page: 'contonPage',
    done: g => H.CONTON_BANNER.DAYS.every((d, i) => g.conDays().got[i]),
    sub: g => 'Вход: ' + g.conDays().days + ' из ' + H.CONTON_BANNER.DAYS.length,
    key(ui, scr, k) {
      const n = H.CONTON_BANNER.DAYS.length;
      if (k === 'left' || k === 'right') { scr.pick = (scr.pick + (k === 'left' ? n - 1 : 1)) % n; ui.sfx('select'); return; }
      if (k === 'ok') ui.conDayPick(scr, scr.pick);
    }
  };
  if (H.EVENT_TABS && !H.EVENT_TABS.some(e => e.id === TAB.id)) H.EVENT_TABS.push(TAB);

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
