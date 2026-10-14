(function (H) {
  'use strict';
  const G = H.Gfx, FH = H.FH;
  const { W, HGT, C } = H.UI_CONST;
  const M = { blue: '#7ac8ff', ice: '#e8f6ff', deep: '#060a22', line: 'rgba(122,200,255,0.55)', dim: '#3a4a78', star: '#ffe08a', off: '#3a4060' };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
  const KIND_TEXT = {
    one: 'Один узел, один бой в две волны.',
    pair: 'Один узел, два боя. Порядок боёв выбираете вы.',
    nodes: 'Два узла по одному бою. Каждому узлу нужна своя команда.'
  };
  const star4 = G.star4;

  Object.assign(G.ITEM_ART, {
    lucent(p) {
      p.poly('#7a5a20', [5, 27, 9, 12, 14, 26]); p.poly('#ffcf6a', [6, 26, 9, 13, 11, 26]);
      p.poly('#6a4ab0', [19, 28, 24, 10, 28, 27]); p.poly('#c8a8ff', [20, 27, 24, 11, 24, 27]);
      p.poly('#2a5a9a', [10, 29, 16, 3, 22, 29]); p.poly('#9ad8ff', [11, 28, 16, 4, 16, 28]); p.poly('#e8f8ff', [14, 18, 16, 6, 16.4, 20]);
      p.ell('rgba(255,240,190,0.55)', 16, 17, 3.2, 3.2);
      star4(p, '#ffffff', 26, 6, 3.4, 0.9); star4(p, '#fff0c0', 6, 9, 2, 0.6);
    },
    feather(p) {
      p.poly('#1e6a5a', [6, 28, 24, 4, 27, 6, 10, 28]);
      p.poly('#3aa88a', [8, 24, 22, 5, 27, 5, 26, 12, 14, 24]);
      p.poly('#7ae0c0', [10, 21, 22, 7, 25, 7, 16, 19]);
      p.poly('#c8fff0', [13, 19, 23, 8, 24, 8.6, 15, 18]);
      for (let i = 0; i < 4; i++) p.poly('#1e6a5a', [12 + i * 3.4, 22 - i * 4, 16 + i * 3.4, 22 - i * 4, 14 + i * 3.4, 23.4 - i * 4]);
      p.rect('#e8c060', 5, 27, 3, 2);
      star4(p, '#ffffff', 26, 22, 3, 0.8);
    },
    resin(p) {
      p.poly('#3a2a14', [9, 6, 23, 6, 25, 28, 7, 28]);
      p.poly('#c8d8e8', [10, 7, 22, 7, 23.6, 27, 8.4, 27]);
      p.poly('#d8902a', [9, 15, 23, 13, 24, 27, 8, 27]);
      p.poly('#ffc860', [10, 16, 18, 14.6, 17, 26, 9, 26]);
      p.ell('#fff0b8', 13, 19, 2.6, 1.8);
      p.rect('#6a4a24', 11, 3, 10, 4); p.rect('#a87a40', 12, 3, 8, 1);
      p.rect('#ffffff', 11, 9, 1.4, 6);
      star4(p, '#ffffff', 26, 8, 3, 0.8);
    }
  });

  const look = (id, extra) => Object.assign({}, typeof id === 'string' ? G.lookOf(id, null) : id, extra || {});
  const FOX = { skin: '#f6dccc', eye: '#c08a3a', bangs: 'parted', sides: 'long', back: 'long', crown: 'smooth', body: 'f', coat: 'robe', collar: 'high', low: 'skirt', acc: [] };

  Object.assign(G.CONE_SCENES, {
    fermata(b) {
      b.sky(['#2a0c1a', '#5a1a2a', '#8a3a2a']);
      b.glow(30, 40, 46, 'rgba(255,170,90,0.45)');
      b.rect('#1a0a10', 0, 96, 100, 44); b.poly('#3a1a1a', [0, 96, 100, 92, 100, 100, 0, 104]);
      b.rect('#5a2a14', 8, 74, 34, 22); b.rect('#8a4a20', 8, 74, 34, 2); b.ell('#141014', 25, 72, 14, 4);
      b.ring('#3a3a40', 25, 72, 11, 3, 0.8); b.ell('#c84040', 25, 72, 3, 1);
      b.poly('#d8b060', [36, 68, 42, 40, 56, 30, 58, 34, 46, 44, 40, 70]);
      b.ell('#e8c070', 56, 30, 9, 7, -0.5); b.ell('#2a1a10', 57, 30, 4, 3, -0.5);
      for (let i = 0; i < 5; i++) b.line('rgba(255,210,160,0.55)', [62 + i * 2, 24 - i * 3, 70 + i * 3, 18 - i * 4, 78 + i * 2, 22 - i * 3], 0.8);
      b.figure(look('kafka'), 72, 92, 92);
      b.glow(72, 50, 22, 'rgba(255,120,170,0.25)');
    },
    quid(b) {
      b.sky(['#f4e6c8', '#e8d0a8', '#c89a6a']);
      b.glow(50, 30, 50, 'rgba(255,250,220,0.6)');
      b.rect('#8a5a34', 0, 98, 100, 42); b.rect('#a8744a', 0, 98, 100, 3);
      b.poly('#c8a070', [10, 98, 90, 98, 84, 84, 16, 84]);
      b.figure(look('bailu'), 34, 84, 66);
      b.figure(look(FOX, { hair: '#e8d8b8', top: '#e8e0d0', trim: '#c89a4a', inner: '#f4ecdc', lower: '#d8c8a8', acc: ['foxears:#e8d8b8'] }), 68, 86, 84);
      b.line('#f8e8d8', [56, 52, 46, 48], 2); b.ell('#ffd0c0', 44, 47, 2, 1.6);
      b.twinkle(40, 34, 3, '#fff8e0'); b.twinkle(60, 26, 2.4, '#fff8e0');
    },
    wildfire(b) {
      b.sky(['#1a1210', '#3a2418', '#5a3420']);
      b.glow(50, 70, 40, 'rgba(255,150,70,0.4)');
      b.rect('#20140e', 0, 110, 100, 30);
      for (let i = 0; i < 6; i++) b.rect('#2a1c14', i * 18 + 2, 0, 3, 110);
      b.figure(look('seele', { top: '#2a2a3a' }), 44, 108, 76);
      b.poly('#d02a2a', [36, 60, 52, 58, 54, 66, 40, 68]); b.poly('#a01a1a', [44, 66, 50, 66, 46, 84, 42, 82]);
      b.figure(look('oleg'), 70, 110, 104);
      b.ell('#c89070', 50, 40, 8, 4, -0.3); b.ell('#b07a5a', 46, 38, 4, 2.4, -0.3);
    },
    river(b) {
      b.sky(['#cfe8f4', '#a8d8e8', '#70b8c8']);
      b.glow(70, 24, 34, 'rgba(255,255,230,0.7)');
      b.poly('#7aa86a', [0, 54, 30, 44, 60, 52, 100, 40, 100, 70, 0, 74]);
      b.poly('#e8b8c8', [6, 40, 20, 30, 34, 38, 22, 46]); b.poly('#f4c8d8', [70, 34, 84, 26, 94, 34, 82, 42]);
      b.poly('#5aa8c8', [0, 74, 100, 66, 100, 140, 0, 140]);
      for (let i = 0; i < 8; i++) b.line('rgba(240,250,255,0.6)', [8 + i * 11, 84 + (i % 3) * 14, 16 + i * 11, 82 + (i % 3) * 14], 0.8);
      b.figure(look('yanqing', { shoes: '#f0d8c8', acc: ['barefoot'] }), 50, 112, 82);
      b.ring('rgba(255,255,255,0.7)', 50, 112, 12, 3, 0.8);
      b.line('#c8d0e0', [72, 70, 92, 46], 1.4);
    },
    pastfuture(b) {
      b.sky(['#3a0a0a', '#8a1a14', '#e8602a']);
      b.glow(50, 90, 50, 'rgba(255,170,60,0.55)');
      for (let i = 0; i < 5; i++) b.line('rgba(255,220,160,0.5)', [10 + i * 20, 0, 20 + i * 18, 40], 0.6);
      b.poly('#2a0a0a', [0, 118, 30, 108, 60, 116, 100, 104, 100, 140, 0, 140]);
      b.ell('#ff8a30', 22, 112, 10, 6); b.ell('#ffd060', 22, 110, 5, 4);
      b.figure(look(FOX, { hair: '#e8e0d0', top: '#3a2a4a', trim: '#d8b060', inner: '#e8d8c8', lower: '#2a2030', acc: ['foxears:#e8e0d0'] }), 56, 116, 72);
      b.poly('#f4e8d0', [60, 96, 78, 88, 74, 104]); b.line('#8a6a4a', [60, 96, 78, 88], 0.8); b.line('#8a6a4a', [68, 92, 66, 108], 0.6);
    },
    woof(b) {
      b.sky(['#04060e', '#0a1430', '#1a2a50']);
      b.stars(40, 7, 0, 140);
      b.ell('#3a6ab0', 82, 26, 14, 14); b.ell('#6a9ad8', 78, 22, 6, 5);
      b.rect('#c8ccd8', 0, 110, 100, 30); b.rect('#e8ecf4', 0, 110, 100, 2);
      for (let i = 0; i < 4; i++) b.rect('#8a90a8', i * 26 + 4, 114, 18, 22);
      b.ell('#f4f0e4', 50, 92, 15, 10); b.ell('#f4f0e4', 62, 82, 8, 8); b.ell('#d8a060', 66, 76, 4, 6, 0.4); b.ell('#d8a060', 58, 76, 4, 6, -0.4);
      b.ell('#2a2020', 64, 84, 1.4, 1.4); b.ell('#2a2020', 68, 86, 1.6, 1.2);
      b.rect('#f4f0e4', 40, 98, 4, 12); b.rect('#f4f0e4', 56, 98, 4, 12); b.line('#f4f0e4', [36, 88, 30, 80], 3);
      b.ring('rgba(140,200,255,0.8)', 50, 92, 24, 18, 1.2);
      b.rect('#e05a40', 56, 88, 10, 2);
    },
    breakfast(b) {
      b.sky(['#3a1a14', '#5a2a1e', '#7a3a24']);
      b.glow(50, 50, 50, 'rgba(255,220,150,0.45)');
      b.rect('#f4ecd8', 6, 86, 88, 4); b.rect('#e8dcc4', 6, 90, 88, 20); b.rect('#c8b898', 6, 108, 88, 2);
      b.ell('#ffffff', 26, 84, 9, 2.6); b.ell('#e8b040', 26, 82, 5, 2); b.ell('#ffffff', 74, 84, 9, 2.6); b.ell('#d06a3a', 74, 82, 5, 2);
      b.rect('#ffffff', 46, 76, 8, 9); b.ell('#6a3a1a', 50, 77, 3.4, 1);
      b.bust(look('pompom'), 50, 56, 40);
      for (const [x, s] of [[14, 22], [86, 22]]) b.ell('rgba(255,255,255,0.12)', x, 56, s * 0.4, s * 0.6);
    }
  });

  function hallCanvas() {
    const key = '_fhHall';
    if (hallCanvas[key]) return hallCanvas[key];
    const cv = G.mkCanvas(W, HGT), g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, HGT);
    gr.addColorStop(0, '#02030c'); gr.addColorStop(0.6, '#0c1236'); gr.addColorStop(1, '#18214e');
    g.fillStyle = gr; g.fillRect(0, 0, W, HGT);
    for (let i = 0; i < 5; i++) {
      const x = G.hash(i, 31, 3) * W, y = G.hash(i, 32, 4) * HGT, r = 90 + G.hash(i, 33, 5) * 140;
      const n = g.createRadialGradient(x, y, 0, x, y, r);
      n.addColorStop(0, i % 2 ? 'rgba(122,200,255,0.14)' : 'rgba(170,150,255,0.1)'); n.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = n; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 200; i++) { g.fillStyle = 'rgba(220,240,255,' + (0.15 + 0.6 * G.hash(i, 34, 6)).toFixed(2) + ')'; g.fillRect(Math.floor(G.hash(i, 35, 7) * W), Math.floor(G.hash(36, i, 8) * HGT), 1, 1); }
    for (let i = 0; i < 18; i++) {
      const x = G.hash(i, 37, 9) * W, y = G.hash(i, 38, 10) * HGT, r = 3 + G.hash(i, 39, 11) * 9;
      g.fillStyle = 'rgba(200,236,255,0.1)'; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.5, y); g.lineTo(x, y + r * 1.4); g.lineTo(x - r * 0.5, y); g.closePath(); g.fill();
    }
    for (let y = 0; y < HGT; y += 3) { g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(0, y, W, 1); }
    hallCanvas[key] = cv;
    return cv;
  }

  const nodePos = n => {
    const i = n - 1, tier = Math.floor(i / 5), col = i % 5, x = tier === 1 ? 4 - col : col;
    return { x: 54 + x * 74 + (tier === 1 ? 18 : 0), y: 318 - tier * 104 };
  };

  Object.assign(H.UI.prototype, {
    fhBackdrop(c) { c.drawImage(hallCanvas(), 0, 0); },

    fhBox(x, y, w, h, col) {
      const c = this.ctx;
      c.fillStyle = 'rgba(4,8,26,0.86)'; c.fillRect(x, y, w, h);
      c.strokeStyle = '#000208'; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.strokeStyle = col || M.line; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      c.fillStyle = col || M.blue;
      for (const [cx, cy] of [[x + 1, y + 1], [x + w - 7, y + 1], [x + 1, y + h - 3], [x + w - 7, y + h - 3]]) c.fillRect(cx, cy, 6, 2);
    },

    fhStar(x, y, r, on) {
      const c = this.ctx;
      c.fillStyle = on ? M.star : M.off;
      c.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      c.closePath(); c.fill();
      if (on) { c.strokeStyle = '#7a5a10'; c.lineWidth = 1; c.stroke(); }
    },

    fhCrystal(x, y, s, col, hi) {
      const c = this.ctx;
      c.fillStyle = '#000208'; c.beginPath(); c.moveTo(x, y - s - 1); c.lineTo(x + s * 0.8 + 1, y); c.lineTo(x, y + s + 1); c.lineTo(x - s * 0.8 - 1, y); c.closePath(); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.8, y); c.lineTo(x, y + s); c.lineTo(x - s * 0.8, y); c.closePath(); c.fill();
      c.fillStyle = hi; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x - s * 0.8, y); c.lineTo(x, y); c.closePath(); c.fill();
    },

    fhFoes(c, waves, x, y, size, max) {
      let cy = y;
      waves.forEach((w, wi) => {
        if (waves.length > 1) this.text('Волна ' + (wi + 1), x, cy + Math.round(size / 2) - 6, { size: 9, col: C.sub });
        const x0 = waves.length > 1 ? x + 46 : x;
        w.slice(0, max || 5).forEach((id, i) => { const d = H.ENEMIES[id]; G.foeIcon(c, d, x0 + i * (size + 3), cy, size, { round: false }); });
        cy += size + 4;
      });
      return cy;
    },

    fhWaves(c, waves, x, y, w, h, dim) {
      const rowH = Math.floor(h / waves.length);
      waves.forEach((wave, wi) => {
        const ry = y + wi * rowH, n = wave.length, size = Math.min(rowH - 18, Math.floor((w - 20) / n * 1.15));
        if (waves.length > 1) this.text('Волна ' + (wi + 1), x, ry, { size: 9, bold: true, col: C.sub });
        wave.forEach((id, i) => {
          const d = H.ENEMIES[id], cx = x + 10 + (w - 20) * (i + 0.5) / n, big = d.boss ? 1.25 : d.elite ? 1.1 : 0.9;
          G.drawEnemy(c, d, cx, ry + rowH - 14, Math.round(size * big), { t: this.t + i, alpha: dim ? 0.35 : 1, aura: !dim });
          if (d.boss || d.elite) this.text(d.boss ? 'БОСС' : 'ЭЛИТА', cx, ry + rowH - 12, { align: 'center', size: 8, bold: true, col: d.boss ? '#ff9a8a' : C.gold });
        });
      });
    },

    fhWeakRow(c, list, x, y) {
      list.forEach((e, i) => G.elemIcon(c, e, x + 7 + i * 17, y + 7, 7));
      return x + list.length * 17;
    },

    openFh(close) {
      const ui = this, g = this.game;
      close = close || (() => {});
      const firstOpen = () => { for (let n = 1; n <= 15; n++) if (!g.fhRec(n) || !g.fhRec(n).clear) return g.fhUnlocked(n) ? n : Math.max(1, n - 1); return 15; };
      const leave = () => { ui.screens.pop(); ui.sfx('cancel'); close(); };
      const claimAll = () => {
        const got = g.fhClaimAll();
        if (!got.length) { ui.sfx('deny'); return; }
        ui.sfx('chest'); ui.toast('Награды за звёзды: ' + got.join(', '));
      };
      this.push({
        full: true, fh: true, sel: firstOpen(),
        draw(c) {
          ui.fhBackdrop(c);
          ui.plate(12, 10, 'Зал забвения');
          const S = FH.SERIES[0];
          ui.text(S.name, 150, 12, { size: 13, bold: true, serif: true, col: M.ice });
          ui.text(S.world, 150, 28, { size: 10, col: C.sub });
          ui.fhStar(W - 132, 22, 7, true);
          ui.text(g.fhTotal() + ' / 45', W - 120, 15, { size: 13, bold: true, col: M.star });
          this.drawMap(c);
          this.drawCard(c);
          this.drawTiers(c);
          ui.hints([['←→↑↓', 'Этап'], ['Enter', 'Команда'], ['C', 'Забрать награды'], ['Esc', 'Выйти']], W / 2, HGT - 20, { align: 'center' });
        },
        drawMap(c) {
          const t = ui.t;
          c.lineWidth = 2;
          for (let n = 1; n < 15; n++) {
            const a = nodePos(n), b = nodePos(n + 1), lit = g.fhRec(n) && g.fhRec(n).clear;
            c.strokeStyle = lit ? 'rgba(122,200,255,0.7)' : 'rgba(80,90,140,0.4)';
            c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
          }
          c.lineWidth = 1;
          ['Белобог и окраины', 'Подземье', 'Холм Вечной Зимы'].forEach((l, i) => ui.text(l, 20, 318 - i * 104 - 46, { size: 10, bold: true, col: 'rgba(170,200,255,0.55)' }));
          for (let n = 1; n <= 15; n++) {
            const p = nodePos(n), on = n === this.sel, open = g.fhUnlocked(n), rec = g.fhRec(n);
            if (on) { const gl = c.createRadialGradient(p.x, p.y, 4, p.x, p.y, 34); gl.addColorStop(0, 'rgba(122,200,255,' + (0.35 + 0.15 * Math.sin(t * 4)) + ')'); gl.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gl; c.fillRect(p.x - 34, p.y - 34, 68, 68); }
            ui.fhCrystal(p.x, p.y, on ? 20 : 17, !open ? '#1a1e36' : rec && rec.clear ? '#3a7ac8' : '#24346a', !open ? '#2a2e4a' : rec && rec.clear ? '#9ad8ff' : '#4a6ab0');
            if (open) ui.text(ROMAN[n - 1], p.x, p.y - 7, { align: 'center', size: n > 9 ? 10 : 12, bold: true, serif: true, col: on ? '#ffffff' : M.ice });
            else ui.lockGlyph(p.x - 5, p.y - 7, '#6a7090');
            for (let i = 0; i < 3; i++) ui.fhStar(p.x - 12 + i * 12, p.y + 27, 4.5, !!(rec && rec.stars[i]));
            ui.hit(p.x - 22, p.y - 22, 44, 56, () => { if (this.sel === n) this.key('ok'); else { this.sel = n; ui.sfx('select'); } });
          }
        },
        drawCard(c) {
          const st = g.fhStage(this.sel), rec = g.fhRec(this.sel), open = g.fhUnlocked(this.sel);
          const x = 420, y = 44, w = 208;
          ui.fhBox(x, y, w, 342);
          ui.text('Этап ' + this.sel, x + 12, y + 10, { size: 16, bold: true, serif: true, col: C.gold });
          ui.text('ур. ' + st.lvl + ' · ' + st.budget + ' циклов', x + w - 12, y + 14, { align: 'right', size: 10, col: C.sub });
          ui.wrap(KIND_TEXT[st.kind], w - 24, 10).forEach((l, i) => ui.text(l, x + 12, y + 32 + i * 12, { size: 10, col: '#c8d4f4' }));
          let cy = y + 62;
          const goals = ['Победа, осталось циклов: ' + st.goals[0], 'Победа, осталось циклов: ' + st.goals[1], 'Пало не больше 1 персонажа'];
          goals.forEach((txt, i) => { ui.fhStar(x + 18, cy + 6, 5.5, !!(rec && rec.stars[i])); ui.text(txt, x + 30, cy, { size: 10, col: rec && rec.stars[i] ? M.star : C.cream }); cy += 15; });
          cy += 4;
          ui.text('Турбулентность памяти', x + 12, cy, { size: 10, bold: true, col: M.blue });
          cy += 14;
          ui.wrap(st.turb.text, w - 24, 10).slice(0, 4).forEach((l, i) => ui.text(l, x + 12, cy + i * 12, { size: 10, col: '#e0e8ff' }));
          cy += Math.min(4, ui.wrap(st.turb.text, w - 24, 10).length) * 12 + 6;
          st.nodes.forEach((node, ni) => {
            ui.text(st.nodes.length > 1 ? 'Узел ' + (ni + 1) : 'Враги', x + 12, cy, { size: 10, bold: true, col: C.cream });
            ui.fhWeakRow(c, g.fhWeak(st, ni), x + w - 12 - g.fhWeak(st, ni).length * 17, cy - 2);
            cy += 14;
            node.forEach((bt, bi) => {
              if (node.length > 1) ui.text('Бой ' + (bi + 1), x + 12, cy + 3, { size: 9, col: C.sub });
              cy = ui.fhFoes(c, bt.waves, x + (node.length > 1 ? 44 : 12), cy, 18, 5) + 1;
            });
            cy += 4;
          });
          if (!open) ui.text('Сначала пройдите этап ' + (this.sel - 1) + '.', x + 12, y + 342 - 22, { size: 10, bold: true, col: C.bad });
          else if (!rec || !rec.clear) {
            const rw = FH.memoryReward(this.sel), cells = [['credits', rw.credits], ...Object.entries(rw.items)];
            ui.text('За первое прохождение', x + 12, y + 342 - 54, { size: 9, col: C.sub });
            cells.forEach(([id, n], i) => ui.rewardCell(c, id, n, x + 12 + i * 36, y + 342 - 40, 32));
          } else ui.text('Пройден · лучший запас: ' + rec.best + ' циклов', x + 12, y + 342 - 22, { size: 10, col: C.ok });
        },
        drawTiers(c) {
          const tiers = g.fhTiers(), x = 16, y = 396;
          ui.text('Награды за звёзды: 200 нефрита, 5 000 кредитов и 80 нефритовых перьев за каждые 3', x, y - 2, { size: 10, col: C.sub });
          tiers.forEach((t, i) => {
            const cx = x + i * 40, cy = y + 14, ready = t.ready && !t.got;
            c.fillStyle = t.got ? 'rgba(40,60,100,0.5)' : ready ? 'rgba(255,224,138,' + (0.35 + 0.2 * Math.sin(ui.t * 5)) + ')' : 'rgba(8,10,30,0.8)';
            c.fillRect(cx, cy, 36, 30);
            c.strokeStyle = ready ? M.star : t.got ? M.blue : M.dim; c.strokeRect(cx + 0.5, cy + 0.5, 35, 29);
            G.itemIcon(c, t.got ? 'jade' : 'jade', cx + 2, cy + 2, 18);
            ui.text(String(t.need), cx + 33, cy + 4, { align: 'right', size: 10, bold: true, col: ready ? '#1a1208' : C.cream, shadow: !ready });
            if (t.got) ui.text('✓', cx + 18, cy + 15, { align: 'center', size: 11, bold: true, col: C.ok });
            ui.hit(cx, cy, 36, 30, () => { if (ready) { const got = g.fhClaim(t.i); ui.sfx('chest'); ui.toast('Награда за ' + t.need + ' звёзд: ' + got.join(', ')); } else ui.sfx('deny'); });
          });
        },
        key(k, code) {
          if (code === 'KeyC') { claimAll(); return; }
          if (k === 'back') { leave(); return; }
          if (k === 'left' || k === 'right') { this.sel = Math.max(1, Math.min(15, this.sel + (k === 'left' ? -1 : 1))); ui.sfx('select'); return; }
          if (k === 'up' || k === 'down') { this.sel = Math.max(1, Math.min(15, this.sel + (k === 'up' ? 5 : -5))); ui.sfx('select'); return; }
          if (k === 'ok') {
            if (!g.fhUnlocked(this.sel)) { ui.sfx('deny'); ui.toast('Этап ' + this.sel + ' откроется после этапа ' + (this.sel - 1) + '.'); return; }
            ui.sfx('confirm');
            ui.openFhTeam(this.sel, close);
          }
        }
      });
    },

    openFhTeam(n, close) {
      const ui = this, g = this.game, st = g.fhStage(n);
      const roster = () => Object.keys(g.state.roster).sort((a, b) => g.state.roster[b].lvl - g.state.roster[a].lvl || a.localeCompare(b));
      const COLS = 12, CELL = 44, ROWS = 3, PITCH = 62;
      const start = () => {
        if (!g.fhReady(n)) { ui.sfx('deny'); ui.toast(st.nodes.length > 1 ? 'Каждому узлу нужен хотя бы один персонаж.' : 'Выберите хотя бы одного персонажа.'); return; }
        g.fhBegin(n);
        ui.sfx('warp');
        ui.screens = ui.screens.filter(s => !s.fh);
        ui.openFhRun(close);
      };
      this.push({
        full: true, fh: true, node: 0, sel: 0, btn: false, top: 0,
        draw(c) {
          ui.fhBackdrop(c);
          ui.plate(12, 10, 'Этап ' + n + ' · Команда');
          ui.wrap('Турбулентность памяти: ' + st.turb.text, 456, 10).slice(0, 2).forEach((l, i) => ui.text(l, 172, 8 + i * 12, { size: 10, col: '#c8d4f4' }));
          const nodes = st.nodes.length, pw = nodes > 1 ? 300 : 608;
          for (let ni = 0; ni < nodes; ni++) {
            const x = 16 + ni * 308, y = 40, on = ni === this.node;
            ui.fhBox(x, y, pw, 168, on ? M.blue : 'rgba(80,100,160,0.5)');
            ui.text(nodes > 1 ? 'Узел ' + (ni + 1) : 'Команда', x + 12, y + 8, { size: 13, bold: true, serif: true, col: on ? C.gold : C.cream });
            const weak = g.fhWeak(st, ni);
            ui.text('Рекомендуется:', x + pw - 22 - weak.length * 17 - 76, y + 10, { size: 10, col: C.sub });
            ui.fhWeakRow(c, weak, x + pw - 16 - weak.length * 17, y + 6);
            const team = g.fhTeam(n, ni);
            for (let i = 0; i < 4; i++) {
              const k = team[i], sx = x + 12 + i * 70, sy = y + 30;
              if (k) {
                const kid = g.kitOf(k);
                ui.portraitCard(c, G.lookOf(kid, g), sx, sy, 60, { elem: H.CHARS[kid].elem, border: on ? C.brassHi : '#5a6a9a' });
                ui.text(ui.shortName(k), sx + 30, sy + 63, { align: 'center', size: 9, col: C.cream });
                ui.text('ур. ' + g.state.roster[k].lvl, sx + 30, sy + 75, { align: 'center', size: 9, col: C.sub });
              } else { c.fillStyle = 'rgba(10,14,40,0.8)'; c.fillRect(sx, sy, 60, 60); c.strokeStyle = M.dim; c.strokeRect(sx + 0.5, sy + 0.5, 59, 59); ui.text('+', sx + 30, sy + 20, { align: 'center', size: 18, col: M.dim }); }
            }
            const fx = nodes > 1 ? x + 12 : x + 300;
            let fy = nodes > 1 ? y + 122 : y + 30;
            st.nodes[ni].forEach(bt => { fy = ui.fhFoes(c, bt.waves, fx, fy, nodes > 1 ? 16 : 22, 5); });
            ui.hit(x, y, pw, 168, () => { if (this.node !== ni) { this.node = ni; ui.sfx('select'); } });
          }
          const list = roster(), used = new Map();
          st.nodes.forEach((_, ni) => g.fhTeam(n, ni).forEach((k, i) => used.set(k, [ni, i])));
          const rows = Math.ceil(list.length / COLS), row = Math.floor(this.sel / COLS);
          if (row < this.top) this.top = row;
          if (row >= this.top + ROWS) this.top = row - ROWS + 1;
          this.top = Math.max(0, Math.min(this.top, Math.max(0, rows - ROWS)));
          ui.text('Персонажи · ' + list.length, 16, 214, { size: 11, bold: true, col: C.cream });
          if (this.top > 0) ui.diamond(W - 24, 222, 4, C.brassHi);
          if (this.top + ROWS < rows) ui.diamond(W - 24, 230 + ROWS * PITCH, 4, C.brassHi);
          ui.wheelZone(16, 230, 608, ROWS * PITCH, d => { this.sel = Math.max(0, Math.min(list.length - 1, this.sel + d * COLS)); });
          list.forEach((k, i) => {
            const r = Math.floor(i / COLS) - this.top;
            if (r < 0 || r >= ROWS) return;
            const x = 16 + (i % COLS) * (CELL + 6), y = 232 + r * PITCH, kid = g.kitOf(k), u = used.get(k), on = i === this.sel && !this.btn;
            ui.portraitCard(c, G.lookOf(kid, g), x, y, CELL, { elem: H.CHARS[kid].elem, border: on ? '#ffffff' : u && u[0] === this.node ? C.brassHi : u ? '#8a6ac8' : '#3a4a7a' });
            if (u) { c.fillStyle = 'rgba(4,6,20,0.8)'; c.fillRect(x, y, 16, 14); ui.text(st.nodes.length > 1 ? (u[0] + 1) + '' : (u[1] + 1) + '', x + 8, y + 1, { align: 'center', size: 10, bold: true, col: u[0] === this.node ? C.gold : '#c8a8ff' }); }
            if (u && u[0] !== this.node) { c.fillStyle = 'rgba(4,6,20,0.45)'; c.fillRect(x, y, CELL, CELL); }
            ui.text('ур. ' + g.state.roster[k].lvl, x + CELL / 2, y + CELL + 2, { align: 'center', size: 9, col: on ? C.gold : C.sub });
            if (on) ui.cursor(x - 8, y + CELL / 2);
            ui.hit(x, y, CELL, CELL, () => { this.sel = i; this.btn = false; this.toggle(); });
          });
          ui.button(W - 196, 424, 180, 28, 'Войти в воспоминание', start, { active: this.btn, bold: true, icon: 'warp' });
          ui.hints([['←→↑↓', 'Выбор'], ['Enter', 'В команду'], ...(st.nodes.length > 1 ? [['Tab', 'Узел']] : []), ['F', 'Начать'], ['Esc', 'Назад']], 16, 432);
        },
        toggle() {
          const k = roster()[this.sel];
          if (!k) return;
          const team = g.fhTeam(n, this.node).slice(), i = team.indexOf(k);
          if (i >= 0) team.splice(i, 1);
          else { if (team.length >= 4) { ui.sfx('deny'); ui.toast('В команде не больше четырёх персонажей.'); return; } team.push(k); }
          g.fhSetTeam(n, this.node, team);
          ui.sfx('select');
        },
        key(k, code) {
          const list = roster();
          if (code === 'Tab' && st.nodes.length > 1) { this.node = 1 - this.node; ui.sfx('select'); return; }
          if (code === 'KeyF') { start(); return; }
          if (k === 'back') { ui.pop(); return; }
          if (this.btn) {
            if (k === 'up' || k === 'left') { this.btn = false; ui.sfx('select'); }
            if (k === 'ok') start();
            return;
          }
          if (k === 'left') this.sel = Math.max(0, this.sel - 1);
          if (k === 'right') this.sel = Math.min(list.length - 1, this.sel + 1);
          if (k === 'up') this.sel = Math.max(0, this.sel - COLS);
          if (k === 'down') { if (this.sel + COLS < list.length) this.sel += COLS; else this.btn = true; }
          if (['left', 'right', 'up', 'down'].includes(k)) ui.sfx('select');
          if (k === 'ok') this.toggle();
        }
      });
    },

    openFhRun(close) {
      const ui = this, g = this.game;
      close = close || (() => {});
      const fight = bi => {
        const run = g.fhRun();
        if (!run) return;
        ui.screens = ui.screens.filter(s => !s.fh);
        close();
        g.fhFight(bi);
        ui.drainGameEvents();
      };
      const abort = () => { g.fhAbort(); ui.screens = ui.screens.filter(s => !s.fh); ui.sfx('cancel'); ui.openFh(close); };
      this.push({
        full: true, fh: true, pick: 0,
        open() { const run = g.fhRun(); return run ? g.fhStage(run.n).nodes[run.node].map((_, i) => i).filter(i => !run.done[run.node].includes(i)) : []; },
        draw(c) {
          const run = g.fhRun();
          if (!run) return;
          const st = g.fhStage(run.n), node = st.nodes[run.node], left = st.budget - run.used, open = this.open();
          if (!open.includes(this.pick)) this.pick = open[0] || 0;
          ui.fhBackdrop(c);
          ui.plate(12, 10, 'Этап ' + run.n + (st.nodes.length > 1 ? ' · Узел ' + (run.node + 1) + ' из ' + st.nodes.length : ''));
          ui.fhBox(16, 40, 608, 58);
          ui.text('Циклы', 30, 50, { size: 11, bold: true, col: C.cream });
          const bx = 90, bw = 420;
          ui.bar(bx, 54, bw, 8, left / st.budget, M.blue);
          for (const goal of st.goals) { const gx = bx + Math.round(bw * goal / st.budget); c.fillStyle = M.star; c.fillRect(gx, 50, 1, 16); ui.fhStar(gx, 74, 4, left >= goal); }
          ui.text('осталось ' + left + ' из ' + st.budget, 520, 50, { size: 11, bold: true, col: left >= st.goals[1] ? M.star : C.cream });
          ui.text('Павших персонажей: ' + run.down, 520, 66, { size: 10, col: run.down > 1 ? C.bad : C.sub });
          const team = g.fhTeam(run.n, run.node);
          team.forEach((k, i) => { const kid = g.kitOf(k); ui.portraitCard(c, G.lookOf(kid, g), 30 + i * 52, 112, 44, { elem: H.CHARS[kid].elem }); });
          ui.text('Энергия на старте: 50%. Техники команды срабатывают в начале боя.', 248, 120, { size: 10, col: C.sub });
          ui.text('Турбулентность: ', 248, 136, { size: 10, bold: true, col: M.blue });
          ui.wrap(st.turb.text, 280, 10).slice(0, 2).forEach((l, i) => ui.text(l, 336, 136 + i * 12, { size: 10, col: '#e0e8ff' }));
          node.forEach((bt, bi) => {
            const x = 16 + bi * 308, y = 176, w = node.length > 1 ? 300 : 608, done = run.done[run.node].includes(bi), on = bi === this.pick && !done;
            ui.fhBox(x, y, w, 200, on ? C.brassHi : done ? 'rgba(80,100,160,0.4)' : M.line);
            ui.text(node.length > 1 ? 'Бой ' + (bi + 1) : 'Бой', x + 12, y + 10, { size: 14, bold: true, serif: true, col: done ? C.dim : on ? C.gold : C.cream });
            ui.fhWaves(c, bt.waves, x + 10, y + 34, w - 20, 158, done);
            if (done) ui.stamp(x + w - 70, y + 24, 'Пройден');
            ui.hit(x, y, w, 200, () => { if (done) return; if (this.pick === bi) fight(bi); else { this.pick = bi; ui.sfx('select'); } });
          });
          ui.button(W / 2 - 100, 392, 200, 30, 'В бой', () => fight(this.pick), { active: true, bold: true, icon: 'warp' });
          ui.hints([...(node.length > 1 ? [['←→', 'Бой']] : []), ['Enter', 'В бой'], ['Esc', 'Покинуть Зал']], W / 2, HGT - 20, { align: 'center' });
        },
        key(k) {
          const open = this.open();
          if ((k === 'left' || k === 'right') && open.length > 1) { const i = open.indexOf(this.pick); this.pick = open[(i + (k === 'left' ? open.length - 1 : 1)) % open.length]; ui.sfx('select'); }
          if (k === 'ok') fight(this.pick);
          if (k === 'back') abort();
        }
      });
    },

    openFhClear(info, close) {
      const ui = this, g = this.game, st = g.fhStage(info.n);
      const next = info.n < 15 && g.fhUnlocked(info.n + 1) ? info.n + 1 : null;
      this.push({
        full: true, fh: true, t: 0, sel: next ? 0 : 1,
        tick(dt) { this.t += dt; },
        draw(c) {
          ui.fhBackdrop(c);
          ui.text('ЭТАП ' + ROMAN[info.n - 1] + ' ПРОЙДЕН', W / 2, 54, { align: 'center', size: 28, bold: true, serif: true, col: M.ice });
          ui.text('Осталось циклов: ' + info.left + ' из ' + st.budget + ' · павших: ' + info.down, W / 2, 92, { align: 'center', size: 12, col: C.sub });
          const goals = ['Осталось не меньше ' + st.goals[0] + ' циклов', 'Осталось не меньше ' + st.goals[1] + ' циклов', 'Пало не больше 1 персонажа'];
          goals.forEach((txt, i) => {
            const x = W / 2 - 150 + i * 150, a = Math.max(0, Math.min(1, (this.t - 0.3 - i * 0.35) * 3)), on = info.stars[i];
            const r = 18 + (on ? (1 - a) * 14 : 0);
            c.globalAlpha = Math.max(0.25, a);
            ui.fhStar(x, 150, r, on);
            c.globalAlpha = 1;
            ui.wrap(txt, 130, 10).forEach((l, j) => ui.text(l, x, 178 + j * 12, { align: 'center', size: 10, col: on ? M.star : C.dim }));
            if (info.fresh[i] && a >= 1) ui.text('Новая!', x, 112, { align: 'center', size: 10, bold: true, col: C.ok });
          });
          ui.fhBox(W / 2 - 220, 222, 440, 112);
          if (info.first && info.got.length) {
            ui.text('Награда за первое прохождение', W / 2, 232, { align: 'center', size: 11, bold: true, col: C.gold });
            const rw = FH.memoryReward(info.n), cells = [['credits', rw.credits], ...Object.entries(rw.items)];
            cells.forEach(([id, n], i) => ui.rewardCell(c, id, n, W / 2 - cells.length * 22 + i * 44, 254, 40));
          } else ui.text(info.first ? 'Этап пройден.' : 'Награда за этот этап уже получена. Новые звёзды идут в общий счёт.', W / 2, 270, { align: 'center', size: 11, col: C.sub });
          ui.text('Всего звёзд: ' + g.fhTotal() + ' / 45', W / 2, 308, { align: 'center', size: 11, bold: true, col: M.star });
          if (next) ui.button(W / 2 - 210, 360, 200, 30, 'Этап ' + next, () => this.go(0), { active: this.sel === 0, bold: true });
          ui.button(next ? W / 2 + 10 : W / 2 - 100, 360, 200, 30, 'К Залу забвения', () => this.go(1), { active: this.sel === 1 });
          ui.hints([['←→', 'Выбор'], ['Enter', 'Дальше']], W / 2, HGT - 20, { align: 'center' });
        },
        go(i) {
          ui.screens = ui.screens.filter(s => !s.fh);
          ui.openFh(close);
          if (i === 0 && next) { ui.top().sel = next; ui.openFhTeam(next, close); }
        },
        key(k) {
          if ((k === 'left' || k === 'right') && next) { this.sel = 1 - this.sel; ui.sfx('select'); }
          if (k === 'ok') this.go(this.sel);
          if (k === 'back') this.go(1);
        }
      });
    },

    fhAfter(out) {
      const f = out.fh;
      if (!f) return;
      if (f.next === 'clear') this.openFhClear(f.clear);
      else if (f.next) this.openFhRun();
    },

    fhLoseOptions(out) {
      const g = this.game;
      return [
        { label: 'Повторить бой', fn: () => g.retryBattle() },
        { label: 'Покинуть Зал забвения', fn: () => { g.giveUpBattle(); this.openFh(); } }
      ];
    },

    drawFhResult(c, out) {
      const g = this.game, f = out.fh, st = g.fhStage(f.n);
      c.fillStyle = 'rgba(2,3,12,0.62)'; c.fillRect(0, 0, W, HGT);
      if (out.lost) {
        this.win(W / 2 - 190, 140, 380, 176, { title: 'Воспоминание рассыпалось', border: '#d86060' });
        this.text(f.out ? 'Циклы закончились раньше, чем враги.' : 'Команда не выдержала…', W / 2, 166, { align: 'center', serif: true, size: 14 });
        this.text('Бой начнётся заново, циклы прошлых боёв этапа сохранятся.', W / 2, 188, { align: 'center', size: 10, col: C.sub });
        this.fhLoseOptions(out).forEach((o, i) => this.button(W / 2 - 150, 222 + i * 34, 300, 26, o.label, () => this.loseChoice(i), { active: (this.bt.loseSel || 0) === i }));
        return;
      }
      this.win(W / 2 - 200, 130, 400, 190, { title: f.next === 'clear' ? 'Этап пройден' : 'Бой выигран', border: M.blue });
      this.text('Циклов на бой: ' + f.cyc, W / 2, 158, { align: 'center', size: 13, bold: true, col: M.ice });
      const run = g.fhRun(), used = f.next === 'clear' ? f.clear.used : run ? run.used : 0;
      this.text('Всего потрачено: ' + used + ' из ' + st.budget, W / 2, 180, { align: 'center', size: 11, col: C.sub });
      if (f.next === 'clear') for (let i = 0; i < 3; i++) this.fhStar(W / 2 - 30 + i * 30, 222, 11, f.clear.stars[i]);
      else this.text(f.next === 'node' ? 'Дальше: узел ' + (run.node + 1) + ', вторая команда.' : 'Дальше: оставшийся бой узла.', W / 2, 214, { align: 'center', size: 12, col: C.cream });
      this.hints([['Enter', 'Продолжить']], W / 2, 290, { align: 'center' });
      this.hit(0, 0, W, HGT, () => this.closeResult());
    },

    fhCycleEvent(e) {
      const bt = this.bt;
      bt.fhCyc = { n: e.n, left: e.left, budget: e.budget, t: 1.4 };
      if (e.n === (this.game.battle && this.game.battle.fh ? this.game.battle.fh.before + 1 : 1)) {
        const b = this.game.battle;
        if (b && b.fh && b.fh.turb) { bt.msg = 'Турбулентность памяти: ' + b.fh.turb.text; bt.msgT = 3.2; bt.msgWarn = false; }
      } else this.sfx('select');
    },

    drawFhHud(c, b) {
      const bt = this.bt, F = b.fh, used = F.before + F.cyc, left = Math.max(0, F.budget - used);
      const x = 66, y = 8, w = 128, h = 34, flash = bt.fhCyc && bt.fhCyc.t > 0 ? bt.fhCyc.t / 1.4 : 0;
      if (bt.fhCyc && bt.fhCyc.t > 0) bt.fhCyc.t = Math.max(0, bt.fhCyc.t - 1 / 60);
      c.fillStyle = 'rgba(4,8,26,0.78)'; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(122,200,255,' + (0.5 + 0.5 * flash) + ')'; c.fillRect(x, y, w, 1); c.fillRect(x, y + h - 1, w, 1);
      this.text('ЦИКЛ', x + 8, y + 4, { size: 9, bold: true, col: M.blue });
      this.text(String(used), x + 8, y + 14, { size: 16, bold: true, serif: true, col: flash ? '#ffffff' : M.ice });
      this.text('осталось ' + left, x + w - 6, y + 5, { align: 'right', size: 10, bold: true, col: left < 3 ? C.bad : C.cream });
      this.bar(x + 44, y + 22, w - 52, 4, left / F.budget, left < 3 ? '#ff8a8a' : M.blue);
    },

    openFhShop(close) {
      const ui = this, g = this.game;
      close = close || (() => {});
      const TABS = ['cones', 'jokes'];
      const buy = scr => {
        const tab = TABS[scr.tab], row = g.fhShop(tab)[scr.sel];
        if (!row) return;
        if (row.left <= 0) { ui.sfx('deny'); ui.toast('Товар закончился до обновления лавки.'); return; }
        const n = Math.max(1, Math.min(scr.qty, row.left === Infinity ? 99 : row.left));
        const got = g.fhBuy(tab, row.i, n);
        if (!got) { ui.sfx('deny'); ui.toast('Не хватает: ' + H.ITEMS[row.cur].name + '.'); return; }
        ui.sfx('chest');
        ui.toast('Получено: ' + (got.length > 1 && got.every(x => x === got[0]) ? got[0] + ' ×' + got.length : got.join(', ')));
        scr.qty = 1;
        if (row.row.item === 'resin') ui.openFhCraft();
      };
      this.push({
        full: true, fh: true, tab: 0, sel: 0, qty: 1,
        draw(c) {
          ui.fhBackdrop(c);
          ui.plate(12, 10, 'Бесценные ценности');
          TABS.forEach((t, i) => {
            const x = 214 + i * 176, on = i === this.tab;
            c.fillStyle = on ? 'rgba(122,200,255,0.3)' : 'rgba(4,8,26,0.7)'; c.fillRect(x, 10, 168, 22);
            c.fillStyle = on ? M.blue : M.dim; c.fillRect(x, 31, 168, 1);
            ui.text(FH.SHOP[t].name, x + 84, 14, { align: 'center', size: 11, bold: on, col: on ? '#ffffff' : C.sub });
            ui.hit(x, 10, 168, 22, () => { this.tab = i; this.sel = 0; this.qty = 1; ui.sfx('select'); });
          });
          const sh = FH.SHOP[TABS[this.tab]];
          ui.money(W - 100, 14, sh.cur, g.state.inv.items[sh.cur] || 0);
          if (this.tab === 0) this.drawCones(c); else this.drawJokes(c);
          ui.hints([['Q/E', 'Лавка'], ['↑↓←→', 'Товар'], ['Enter', 'Купить'], ...(this.tab === 1 ? [['R', 'Смола']] : []), ['Esc', 'Выйти']], W / 2, HGT - 20, { align: 'center' });
        },
        drawCones(c) {
          const rows = g.fhShop('cones');
          rows.forEach((r, i) => {
            const x = 22 + (i % 4) * 100, y = 46 + Math.floor(i / 4) * 178, on = i === this.sel, own = r.own;
            if (on) { c.fillStyle = 'rgba(242,220,154,0.25)'; c.fillRect(x - 4, y - 4, 92, 170); }
            G.drawConeCard(c, r.row.cone, x, y, 84, 118, { sup: own || null });
            ui.wrap(r.name, 88, 10).slice(0, 2).forEach((l, j) => ui.text(l, x + 42, y + 122 + j * 12, { align: 'center', size: 10, bold: on, col: on ? C.gold : C.cream }));
            G.itemIcon(c, 'lucent', x + 22, y + 148, 14);
            ui.text(String(r.price), x + 38, y + 149, { size: 10, bold: true, col: r.afford ? C.cream : C.bad });
            ui.hit(x - 4, y - 4, 92, 170, () => { if (this.sel === i) buy(this); else { this.sel = i; ui.sfx('select'); } });
          });
          const r = rows[this.sel];
          if (!r) return;
          const d = H.CONES[r.row.cone];
          ui.fhBox(424, 46, 200, 350);
          ui.text(d.name, 436, 58, { size: 14, bold: true, serif: true, col: C.gold });
          G.pathIcon(c, d.path, 436, 82, 14, C.brassHi);
          ui.text(H.PATHS[d.path].name + ' · 4★', 456, 83, { size: 11, col: C.cream });
          ui.text('Подходит:', 436, 104, { size: 10, col: C.sub });
          const fits = Object.keys(g.state.roster).filter(k => H.CHARS[g.kitOf(k)].path === d.path).map(k => ui.shortName(k));
          ui.wrap(fits.length ? fits.join(', ') : 'пока никому из команды', 176, 10).slice(0, 2).forEach((l, i) => ui.text(l, 436, 118 + i * 12, { size: 10, col: '#e0e8ff' }));
          ui.wrap(d.text, 176, 11).forEach((l, i) => ui.text(l, 436, 152 + i * 14, { size: 11, col: C.cream }));
          ui.text('ОЗ ' + d.stats.hp + ' · Атака ' + d.stats.atk + ' · Защита ' + d.stats.def, 436, 250, { size: 10, col: C.sub });
          ui.text('Есть: ' + (r.own ? 'S' + r.own : 'нет'), 436, 268, { size: 10, col: r.own ? C.ok : C.sub });
          ui.text('Сияющий отсвет дают этапы Зала забвения', 436, 330, { size: 9, col: C.sub });
          ui.text('и Эхо войны (3 раза в неделю).', 436, 342, { size: 9, col: C.sub });
          ui.button(436, 360, 176, 26, 'Купить · 200', () => buy(this), { active: r.afford, disabled: !r.afford, bold: true });
        },
        drawJokes(c) {
          const rows = g.fhShop('jokes');
          ui.fhBox(16, 46, 400, 350);
          rows.forEach((r, i) => {
            const y = 58 + i * 52, on = i === this.sel, id = r.row.item || 'credits', n = r.row.credits || 1;
            if (on) { c.fillStyle = 'rgba(242,220,154,0.22)'; c.fillRect(24, y - 4, 384, 48); c.fillStyle = C.brassHi; c.fillRect(24, y - 4, 2, 48); }
            ui.rewardCell(c, id, n, 32, y, 40);
            ui.text(r.name, 82, y + 4, { size: 12, bold: on, col: on ? C.gold : C.cream });
            ui.text(r.lim ? 'Осталось ' + Math.max(0, r.left) + ' из ' + r.lim : 'Без ограничений', 82, y + 22, { size: 10, col: r.left > 0 ? C.sub : C.bad });
            G.itemIcon(c, 'feather', 330, y + 10, 16);
            ui.text(String(r.price), 350, y + 12, { size: 12, bold: true, col: r.afford ? C.cream : C.bad });
            ui.hit(24, y - 4, 384, 48, () => { if (this.sel === i) buy(this); else { this.sel = i; this.qty = 1; ui.sfx('select'); } });
          });
          const r = rows[this.sel];
          ui.fhBox(424, 46, 200, 350);
          if (r) {
            const id = r.row.item;
            ui.text(r.name, 436, 58, { size: 13, bold: true, serif: true, col: C.gold });
            const text = id ? H.ITEMS[id].text : 'Кредиты для покупок и улучшений.';
            ui.wrap(text, 176, 11).slice(0, 7).forEach((l, i) => ui.text(l, 436, 82 + i * 14, { size: 11, col: C.cream }));
            const max = r.left === Infinity ? 99 : r.left;
            if (max > 1) {
              ui.text('Количество', 436, 196, { size: 10, col: C.sub });
              ui.button(436, 212, 26, 24, '−', () => { this.qty = Math.max(1, this.qty - 1); ui.sfx('select'); });
              ui.text(String(Math.min(this.qty, max)), 490, 216, { align: 'center', size: 14, bold: true, col: C.cream });
              ui.button(518, 212, 26, 24, '+', () => { this.qty = Math.min(max, this.qty + 1); ui.sfx('select'); });
              ui.text('Итого: ' + r.price * Math.min(this.qty, max), 552, 216, { size: 11, col: C.cream });
            }
            ui.button(436, 360, 176, 26, 'Купить', () => buy(this), { active: r.afford, disabled: !r.afford, bold: true });
          }
          const resin = g.state.inv.items.resin || 0;
          ui.text('Смола: ' + resin, 436, 262, { size: 11, bold: true, col: resin ? C.gold : C.sub });
          ui.button(436, 280, 176, 26, 'Создать реликвию', () => ui.openFhCraft(), { disabled: !resin, size: 11 });
          ui.text('Лавка обновляется раз в ' + FH.TUN.shopDays + ' дня.', 436, 318, { size: 9, col: C.sub });
          ui.text('Нефритовые перья дают награды за звёзды.', 436, 330, { size: 9, col: C.sub });
        },
        key(k, code) {
          const tab = TABS[this.tab], n = g.fhShop(tab).length;
          if (code === 'KeyQ' || code === 'KeyE') { this.tab = (this.tab + 1) % 2; this.sel = 0; this.qty = 1; ui.sfx('select'); return; }
          if (code === 'KeyR' && this.tab === 1) { if (g.state.inv.items.resin > 0) ui.openFhCraft(); else ui.sfx('deny'); return; }
          if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); close(); return; }
          if (k === 'ok') { buy(this); return; }
          if (this.tab === 0) {
            if (k === 'left') this.sel = Math.max(0, this.sel - 1);
            if (k === 'right') this.sel = Math.min(n - 1, this.sel + 1);
            if (k === 'up') this.sel = Math.max(0, this.sel - 4);
            if (k === 'down') this.sel = Math.min(n - 1, this.sel + 4);
          } else {
            if (k === 'up') { this.sel = (this.sel + n - 1) % n; this.qty = 1; }
            if (k === 'down') { this.sel = (this.sel + 1) % n; this.qty = 1; }
            if (k === 'left') this.qty = Math.max(1, this.qty - 1);
            if (k === 'right') this.qty = this.qty + 1;
          }
          if (['left', 'right', 'up', 'down'].includes(k)) ui.sfx('select');
        }
      });
    },

    openFhCraft() {
      const ui = this, g = this.game, sets = H.CAVERN_SETS, slots = H.CAVERN_SLOTS;
      this.push({
        fh: true, col: 0, set: 0, slot: 2, main: 0,
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(60, 70, 520, 320, { title: 'Самомоделирующаяся смола', border: M.blue });
          ui.text('Смолы: ' + (g.state.inv.items.resin || 0) + '. Выберите набор, слот и основную характеристику.', 80, 92, { size: 11, col: C.sub });
          const slot = slots[this.slot], mains = slot.mains;
          if (this.main >= mains.length) this.main = 0;
          const cols = [
            { title: 'Набор', items: sets.map(s => H.RELIC_SETS[s].name), sel: this.set, x: 80, w: 220 },
            { title: 'Слот', items: slots.map(s => s.name), sel: this.slot, x: 310, w: 100 },
            { title: 'Основная', items: mains.map(m => H.STAT_NAMES[m] || m), sel: this.main, x: 420, w: 140 }
          ];
          cols.forEach((col, ci) => {
            ui.text(col.title, col.x, 114, { size: 11, bold: true, col: ci === this.col ? C.gold : C.cream });
            ui.list(col.x, 132, col.w, col.items.map(l => ({ label: l })), col.sel, { rowH: 20, max: 10, size: 11, focus: ci === this.col, onClick: i => { this.col = ci; if (ci === 0) this.set = i; else if (ci === 1) this.slot = i; else this.main = i; } });
          });
          G.rarityCell(c, 80, 344, 32, 32, 5); G.itemIcon(c, 'relic:' + slot.key, 82, 346, 28, sets[this.set]);
          ui.text(H.RELIC_SETS[sets[this.set]].name + ' · ' + slot.name + ' · ' + (H.STAT_NAMES[mains[this.main]] || mains[this.main]), 120, 354, { size: 11, col: C.cream });
          ui.button(440, 346, 120, 26, 'Создать', () => this.make(), { active: true, bold: true });
          ui.hints([['←→', 'Столбец'], ['↑↓', 'Выбор'], ['Enter', 'Создать'], ['Esc', 'Назад']], W / 2, 398, { align: 'center' });
        },
        make() {
          const slot = slots[this.slot], rel = g.fhCraft(sets[this.set], slot.key, slot.mains[this.main]);
          if (!rel) { ui.sfx('deny'); ui.toast('Нет смолы.'); return; }
          ui.sfx('chest');
          ui.toast('Создана реликвия: ' + g.relicName(rel) + ' (' + (H.STAT_NAMES[rel.main] || rel.main) + ').');
          if (!(g.state.inv.items.resin > 0)) ui.pop();
        },
        key(k) {
          const lens = [sets.length, slots.length, slots[this.slot].mains.length], keys = ['set', 'slot', 'main'];
          if (k === 'left') this.col = Math.max(0, this.col - 1);
          if (k === 'right') this.col = Math.min(2, this.col + 1);
          if (k === 'up' || k === 'down') { const f = keys[this.col]; this[f] = (this[f] + (k === 'up' ? lens[this.col] - 1 : 1)) % lens[this.col]; }
          if (['left', 'right', 'up', 'down'].includes(k)) ui.sfx('select');
          if (k === 'ok') this.make();
          if (k === 'back') ui.pop();
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
