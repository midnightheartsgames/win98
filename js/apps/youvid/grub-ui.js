(function () {
  const { rand } = window.P3D;
  const PI = Math.PI;

  const W = 960, H = 540;
  const FONT = '"Palatino Linotype", "Book Antiqua", Georgia, serif';
  const LAYOUT = { size: 17, row: 26, gap: 30, lastY: 510, numX: 233, textX: 250, markX: 211, wrap: 760, lineH: 22 };
  const GOLD = '#dcc27c';
  const WHITE = '#f4efe4';

  function spans(text) {
    const out = [];
    text.split('*').forEach((s, i) => { if (s) out.push({ s, it: i % 2 === 1 }); });
    return out;
  }

  function fontOf(it, size) {
    return `${it ? 'italic ' : ''}${size}px ${FONT}`;
  }

  function measure(ctx, text, size) {
    return spans(text).reduce((w, sp) => {
      ctx.font = fontOf(sp.it, size);
      return w + ctx.measureText(sp.s).width;
    }, 0);
  }

  function wrapLines(ctx, text, size, max) {
    const lines = [];
    let cur = '';
    text.split(' ').forEach(wd => {
      const next = cur ? cur + ' ' + wd : wd;
      if (cur && measure(ctx, next.replace(/\*/g, ''), size) > max) {
        lines.push(cur);
        cur = wd;
      } else {
        cur = next;
      }
    });
    if (cur) lines.push(cur);
    let open = false;
    return lines.map(l => {
      let t = (open ? '*' : '') + l;
      open = (t.match(/\*/g) || []).length % 2 === 1;
      if (open) t += '*';
      return t;
    });
  }

  function textRun(ctx, text, x, y, size, color, align) {
    const sp = spans(text);
    let total = 0;
    sp.forEach(s => { ctx.font = fontOf(s.it, size); total += ctx.measureText(s.s).width; });
    let cx = align === 'center' ? x - total / 2 : x;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    sp.forEach(s => {
      ctx.font = fontOf(s.it, size);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(s.s, cx + 1, y + 1);
      ctx.restore();
      ctx.fillStyle = color;
      ctx.fillText(s.s, cx, y);
      cx += ctx.measureText(s.s).width;
    });
    return total;
  }

  function roundButton(ctx, x, y, r0, icon) {
    const g = ctx.createRadialGradient(x - r0 * 0.3, y - r0 * 0.3, 1, x, y, r0);
    g.addColorStop(0, '#3a3430');
    g.addColorStop(1, '#141210');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r0, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a7656';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,180,140,0.45)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r0 - 2.5, 0, PI * 2);
    ctx.stroke();
    ctx.strokeStyle = icon === 'bars' ? '#d0303a' : '#d8ccb4';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 1.4;
    if (icon === 'bars') {
      [-4, 0, 4].forEach((dx, i) => ctx.fillRect(x + dx - 1, y + 4 - (4 + i * 2), 2.2, 4 + i * 2));
    } else if (icon === 'log') {
      [-3, 0, 3].forEach(dy => { ctx.beginPath(); ctx.moveTo(x - 5, y + dy); ctx.lineTo(x + 5, y + dy); ctx.stroke(); });
    } else if (icon === 'bag') {
      ctx.beginPath();
      ctx.arc(x, y + 1.5, 4.5, 0, PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - 4, 2, PI, 0);
      ctx.stroke();
    } else {
      ctx.strokeRect(x - 4.5, y - 5, 9, 10);
      ctx.beginPath();
      ctx.moveTo(x - 2.5, y - 1.5);
      ctx.lineTo(x + 2.5, y - 1.5);
      ctx.moveTo(x - 2.5, y + 1.5);
      ctx.lineTo(x + 2.5, y + 1.5);
      ctx.stroke();
    }
  }

  function optionRows(n) {
    const rows = [];
    for (let i = 0; i < n; i++) rows.push(LAYOUT.lastY - (n - 1 - i) * LAYOUT.row);
    return rows;
  }

  function dialog(st) {
    return (ctx) => {
      ctx.clearRect(0, 0, W, H);
      const L = LAYOUT;
      if (st.line) {
        const lines = wrapLines(ctx, st.line, L.size, L.wrap);
        let y;
        if (st.options) {
          const top = optionRows(st.options.length)[0];
          y = top - L.gap - (lines.length - 1) * L.lineH;
        } else {
          y = L.lastY - (lines.length - 1) * L.lineH;
        }
        lines.forEach((ln, i) => textRun(ctx, ln, W / 2, y + i * L.lineH, L.size, WHITE, 'center'));
      }
      if (st.options) {
        const rows = optionRows(st.options.length);
        st.options.forEach((opt, i) => {
          const gold = i === st.gold;
          const col = gold ? GOLD : WHITE;
          textRun(ctx, `${i + 1}.`, L.numX - 8, rows[i], L.size, col);
          textRun(ctx, opt, L.textX, rows[i], L.size, col);
          if (i === st.hover) textRun(ctx, '»', L.markX - 4, rows[i], L.size + 2, '#d8b45a');
        });
      }
      const icons = ['log', 'bag', 'sheet'];
      if (st.options) icons.push('bars');
      icons.forEach((ic, i) => roundButton(ctx, 22 + i * 26.5, 519, 11.5, ic));
    };
  }

  function cursor(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / 32, h / 32);
    ctx.translate(2, 2);
    ctx.rotate(-0.55);
    ctx.fillStyle = '#d8d4cc';
    ctx.strokeStyle = '#2a2420';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(4.5, 2);
    ctx.lineTo(14, 8);
    ctx.lineTo(17, 13);
    ctx.lineTo(13, 16);
    ctx.lineTo(7, 12);
    ctx.lineTo(2, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8a8478';
    ctx.fillRect(9, 9, 4, 3);
    ctx.restore();
  }

  function portrait(ctx, x, y, w, h, skin, hair, bg, hp, seed) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, bg[0]);
    g.addColorStop(1, bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.42, w * 0.36, h * 0.36, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.48, w * 0.26, h * 0.3, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(30,20,16,0.85)';
    [-1, 1].forEach(s => ctx.fillRect(x + w / 2 + s * w * 0.11 - 1.5, y + h * 0.44, 3, 1.6));
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y + h - 11, w, 11);
    ctx.fillStyle = '#e8e2d4';
    ctx.font = `8px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(hp, x + w / 2, y + h - 3);
    ctx.strokeStyle = '#8c7a5a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  function glyph(ctx, x, y, s, kind, col, seed) {
    const g = rand(seed);
    ctx.fillStyle = '#16171c';
    ctx.fillRect(x, y, s, s);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(x + 3 + g() * (s - 6), y + 3 + g() * (s - 6));
      ctx.quadraticCurveTo(x + g() * s, y + g() * s, x + 3 + g() * (s - 6), y + 3 + g() * (s - 6));
    }
    ctx.stroke();
    if (kind === 'fill') {
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.25, 0, PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = 'rgba(120,110,90,0.6)';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  }

  function hud(ctx) {
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e0d0';
    ctx.font = `13px ${FONT}`;
    ctx.save();
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.fillText('Grub', 476, 31);
    ctx.font = `7px ${FONT}`;
    ctx.fillText('Lv. 1', 504, 30);
    ctx.restore();
    ctx.fillStyle = '#1a0c0c';
    ctx.fillRect(395, 37, 172, 13);
    const bar = ctx.createLinearGradient(0, 39, 0, 48);
    bar.addColorStop(0, '#d2333e');
    bar.addColorStop(1, '#7a1018');
    ctx.fillStyle = bar;
    ctx.fillRect(398, 39, 166, 9);
    ctx.strokeStyle = '#5a4a36';
    ctx.lineWidth = 1;
    ctx.strokeRect(395.5, 37.5, 171, 12);
    ctx.fillStyle = '#f0e6e0';
    ctx.font = `7px ${FONT}`;
    ctx.fillText('1/1', 481, 46);

    const folks = [
      ['#d6a888', '#3a2a20', ['#5a6050', '#2a2c26'], '90/90'],
      ['#e2b8a6', '#6a3a8a', ['#5a4a70', '#2a2236'], '88/88'],
      ['#c0503c', '#2a1814', ['#7a3a2a', '#2a1410'], '115/115'],
      ['#8a5a42', '#1e1410', ['#6a4a30', '#2a1c12'], '88/88']
    ];
    folks.forEach((f, i) => portrait(ctx, 7, 184 + i * 53.5, 34, 50, f[0], f[1], f[2], f[3], i));
    ctx.fillStyle = '#2c3a36';
    [[50, 189], [64, 189], [50, 296], [50, 349]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a08a5a';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    ctx.fillStyle = 'rgba(16,12,10,0.88)';
    ctx.beginPath();
    ctx.moveTo(190, 540);
    ctx.lineTo(190, 470);
    ctx.lineTo(312, 470);
    ctx.lineTo(318, 420);
    ctx.lineTo(700, 420);
    ctx.lineTo(706, 470);
    ctx.lineTo(780, 470);
    ctx.lineTo(780, 540);
    ctx.fill();
    ctx.strokeStyle = '#6a5a40';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    const kinds = ['line', 'line', 'fill', 'line', 'fill'];
    const cols = ['#9ab8c8', '#9ab8c8', '#e0a050', '#e0a050', '#d8c060', '#9ab8c8', '#d06040', '#e07830', '#e09a40', '#e0b040'];
    for (let row = 0; row < 4; row++) {
      for (let c = 0; c < 6; c++) {
        if (row > 1 && c > 4) continue;
        glyph(ctx, 320 + c * 20, 427 + row * 21, 19, kinds[(c + row) % 5], cols[(c * 3 + row) % cols.length], 100 + row * 10 + c);
      }
    }
    for (let row = 0; row < 4; row++) {
      for (let c = 0; c < 2; c++) glyph(ctx, 530 + c * 21, 427 + row * 21, 19, 'fill', ['#40c0a0', '#e05030', '#c050c0', '#e0c050'][(row + c) % 4], 300 + row * 4 + c);
      for (let c = 0; c < 4; c++) glyph(ctx, 603 + c * 21, 427 + row * 21, 19, 'fill', ['#e0c050', '#60a0e0', '#c0c0c0', '#d04040'][(row * 2 + c) % 4], 400 + row * 4 + c);
    }
    ctx.fillStyle = '#7a1018';
    ctx.fillRect(522, 427, 3, 84);
    ctx.fillRect(597, 427, 3, 84);
    ctx.fillStyle = '#26201a';
    ctx.beginPath();
    ctx.arc(215, 495, 34, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a08a5a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(215, 495, 31, 0, PI * 2);
    ctx.clip();
    portrait(ctx, 184, 462, 62, 70, '#d6a888', '#4a4a48', ['#5a6050', '#2a2c26'], '', 9);
    ctx.restore();
    ctx.fillStyle = '#e8e2d4';
    ctx.font = `8px ${FONT}`;
    ctx.fillText('90/90', 215, 520);
    ['Common', 'Ranger', 'Items', 'Passives', 'Custom'].forEach((tab, i) => {
      const x = 395 + i * 48;
      ctx.fillStyle = '#1e1814';
      ctx.fillRect(x - 22, 521, 44, 14);
      ctx.strokeStyle = '#6a5a40';
      ctx.strokeRect(x - 21.5, 521.5, 43, 13);
      ctx.fillStyle = '#d8ccb0';
      ctx.font = `7.5px ${FONT}`;
      ctx.fillText(tab, x, 531);
    });
    ctx.fillStyle = '#2a2018';
    ctx.beginPath();
    ctx.arc(744, 495, 32, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a08a5a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#e8dcc0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(737, 484);
    ctx.lineTo(751, 484);
    ctx.lineTo(737, 506);
    ctx.lineTo(751, 506);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#2a2018';
    ctx.beginPath();
    ctx.arc(799, 500, 15, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a08a5a';
    ctx.stroke();
    ctx.fillStyle = '#e0a040';
    ctx.beginPath();
    ctx.moveTo(799, 491);
    ctx.quadraticCurveTo(806, 500, 799, 508);
    ctx.quadraticCurveTo(792, 500, 799, 491);
    ctx.fill();

    const mx = 873, my = 85, mr = 74;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, PI * 2);
    ctx.clip();
    ctx.fillStyle = '#5a5638';
    ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    const g = rand(77);
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(70,96,46,0.8)' : g() < 0.5 ? 'rgba(130,112,80,0.7)' : 'rgba(150,150,140,0.6)';
      ctx.beginPath();
      ctx.ellipse(mx - mr + g() * mr * 2, my - mr + g() * mr * 2, 6 + g() * 14, 4 + g() * 10, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(150,146,130,0.7)';
    ctx.fillRect(mx - 8, my - 50, 40, 90);
    [[mx - 52, my - 10, '#40d060'], [mx - 25, my - 30, '#40c8d0'], [mx + 70, my - 60, '#40c8d0'], [mx + 22, my - 36, '#e0d050'], [mx + 26, my - 32, '#e0d050'], [mx + 48, my - 22, '#40c8d0']].forEach(([x, y, c]) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x - 5, y + 18, 2.6, 0, PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(mx - 4, my + 2, 2.4, 0, PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#8a7656';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#2a2018';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mx, my, mr + 3, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#e8e0cc';
    ctx.font = `8px ${FONT}`;
    ctx.save();
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.fillText('CAMPSITE', mx, my + 59);
    ctx.font = `6.5px ${FONT}`;
    ctx.fillText('X:365 Y:-745', mx, my + 68);
    ctx.restore();
    [[927, 12], [949, 12], [952, 34], [944, 150], [917, 172], [866, 175]].forEach(([x, y]) => {
      ctx.fillStyle = '#1e1814';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a7656';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.fillStyle = '#1e1814';
    ctx.beginPath();
    ctx.arc(10, 163, 9, 0, PI * 2);
    ctx.arc(10, 412, 9, 0, PI * 2);
    ctx.arc(10, 434, 9, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e1814';
    ctx.beginPath();
    ctx.arc(945, 468, 10, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a7656';
    ctx.stroke();

    ctx.fillStyle = 'rgba(10,8,8,0.92)';
    ctx.fillRect(452, 262, 40, 16);
    ctx.fillStyle = '#ece6da';
    ctx.font = `9.5px ${FONT}`;
    ctx.fillText('Grub', 472, 274);
    ctx.fillStyle = '#d8d4cc';
    ctx.beginPath();
    ctx.ellipse(439, 271, 6, 4.4, 0, 0, PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(436, 274);
    ctx.lineTo(434, 278);
    ctx.lineTo(439, 275);
    ctx.fill();
    ctx.fillStyle = '#3a3430';
    [-2.5, 0, 2.5].forEach(dx => ctx.fillRect(439 + dx - 0.6, 270.4, 1.2, 1.2));
  }

  window.GrubUI = { W, H, LAYOUT, optionRows, dialog, hud, cursor, wrapLines };
})();
