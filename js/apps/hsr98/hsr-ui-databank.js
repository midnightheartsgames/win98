(function (H) {
  'use strict';
  const { W, HGT, C } = H.UI_CONST;
  const G = H.Gfx;

  const BANK_TABS = [
    { label: 'Враги', icon: 'foes' },
    { label: 'Слияния', icon: 'fusions' },
    { label: 'Слухи', icon: 'chat' },
    { label: 'Прыжки', icon: 'warp' },
    { label: 'Сюжет', icon: 'archive' }
  ];

  const ASTRO_NODES = [
    { id: 'cones', label: 'Световые конусы', rx: 0.15, ry: 0.44, r: 34 },
    { id: 'foes', label: 'Противники', rx: 0.32, ry: 0.25, r: 28 },
    { id: 'factions', label: 'Фракции', rx: 0.25, ry: 0.65, r: 25 },
    { id: 'aeons', label: 'Эоны', rx: 0.42, ry: 0.44, r: 26 },
    { id: 'chars', label: 'Персонажи', rx: 0.58, ry: 0.36, r: 44, main: true },
    { id: 'relics', label: 'Реликвии', rx: 0.74, ry: 0.62, r: 32 },
    { id: 'terms', label: 'Термины', rx: 0.86, ry: 0.31, r: 26 }
  ];

  const SEC_TITLES = {
    cones: 'Световые конусы',
    foes: 'Противники',
    factions: 'Фракции',
    aeons: 'Эоны',
    chars: 'Персонажи',
    relics: 'Реликвии',
    terms: 'Термины'
  };

  const PATH_FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'destruction', label: 'Разрушение' },
    { id: 'hunt', label: 'Охота' },
    { id: 'erudition', label: 'Эрудиция' },
    { id: 'harmony', label: 'Гармония' },
    { id: 'nihility', label: 'Небытие' },
    { id: 'preservation', label: 'Сохранение' },
    { id: 'abundance', label: 'Изобилие' }
  ];

  const FOE_FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'legion', label: 'Легион' },
    { id: 'fragmentum', label: 'Фрагментум' },
    { id: 'jarilo', label: 'Ярило-VI' },
    { id: 'luofu', label: 'Лофу' },
    { id: 'interworld', label: 'Междумирье' },
    { id: 'boss', label: 'Боссы' }
  ];

  const TAG_NAME = {
    joke: 'шутку', cute: 'милоту', threat: 'угрозу', science: 'науку',
    kind: 'доброту', sing: 'пение', bribe: 'подкуп', silent: 'молчание', weird: 'странность'
  };
  const RAR_TXT = { 3: '#9ec6ff', 4: '#d9b3ff', 5: '#ffe28a' };

  function warpName(e) {
    return e.kind === 'char' ? (H.CHARS[e.id] && H.CHARS[e.id].name || e.id) : (H.CONES[e.id] && H.CONES[e.id].name || e.id);
  }
  function warpIcon(c, e, x, y, size, g) {
    if (e.kind === 'char') { c.fillStyle = G.RARITY[e.rar]; c.fillRect(x - 1, y - 1, size + 2, size + 2); G.drawPortrait(c, G.lookOf(e.id, g), x, y, size); }
    else G.drawConeCard(c, e.id, x + Math.round(size * 0.15), y, Math.round(size * 0.72), size, { info: false });
  }
  function warpNote(e) {
    if (e.rar === 5) return e.Guarantee ? ['Гарант 5★', '#ffd978'] : e.win === false ? ['Проигрыш 50/50', '#ff9aa8'] : ['Победа 50/50', '#9ef0b8'];
    return [e.kind === 'char' ? 'Персонаж' : 'Световой конус', C.cream];
  }
  function warpPity(e) { return (e.pity || 1) + '-й прыжок'; }
  function warpWhen(e) {
    if (!e.at) return 'недавно';
    const d = new Date(e.at);
    const pad = n => String(n).padStart(2, '0');
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function drawStar4(c, x, y, r, col) {
    c.save();
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x, y - r);
    c.quadraticCurveTo(x + r * 0.18, y - r * 0.18, x + r, y);
    c.quadraticCurveTo(x + r * 0.18, y + r * 0.18, x, y + r);
    c.quadraticCurveTo(x - r * 0.18, y + r * 0.18, x - r, y);
    c.quadraticCurveTo(x - r * 0.18, y - r * 0.18, x, y - r);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawWatermark(c, cx, cy, r, alpha) {
    c.save();
    c.globalAlpha = alpha || 0.08;
    c.strokeStyle = '#c8b890';
    c.lineWidth = 1.2;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(cx, cy, r * 0.76, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(cx, cy, r * 0.28, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * r * 0.28, cy + Math.sin(a) * r * 0.28);
      c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      c.stroke();
    }
    drawStar4(c, cx, cy, r * 0.92, '#c8b890');
    c.restore();
  }

  function drawAstrolabeBg(c, ui, isHub) {
    const lx = ui.left, vw = ui.vw;
    const gr = c.createLinearGradient(lx, 0, lx + vw, HGT);
    gr.addColorStop(0, '#070d1c');
    gr.addColorStop(0.5, '#0f1b36');
    gr.addColorStop(1, '#091224');
    c.fillStyle = gr;
    c.fillRect(lx, 0, vw, HGT);

    const neb = c.createRadialGradient(lx + vw * 0.56, HGT * 0.4, 10, lx + vw * 0.56, HGT * 0.4, vw * 0.55);
    neb.addColorStop(0, 'rgba(64, 105, 180, 0.22)');
    neb.addColorStop(0.5, 'rgba(36, 68, 130, 0.12)');
    neb.addColorStop(1, 'rgba(8, 14, 28, 0)');
    c.fillStyle = neb;
    c.fillRect(lx, 0, vw, HGT);

    for (let i = 0; i < 56; i++) {
      const sx = lx + ((i * 173 + 29) % vw);
      const sy = (i * 97 + 13) % HGT;
      const sr = (i % 5 === 0) ? 1.5 : 0.9;
      c.fillStyle = (i % 7 === 0) ? 'rgba(245, 220, 160, 0.7)' : 'rgba(200, 220, 255, 0.45)';
      c.fillRect(sx, sy, sr, sr);
    }

    drawWatermark(c, lx + 42, 42, 54, 0.07);
    drawWatermark(c, lx + vw - 76, HGT - 72, 64, 0.08);

    if (!isHub) return;

    drawWatermark(c, lx + vw * 0.34, HGT * 0.48, 42, 0.09);

    c.save();
    const orbits = [
      { cx: lx + vw * 0.48, cy: HGT * 0.48, rx: vw * 0.36, ry: HGT * 0.38, rot: -0.22, col: 'rgba(218, 190, 128, 0.32)', w: 1.2 },
      { cx: lx + vw * 0.54, cy: HGT * 0.42, rx: vw * 0.24, ry: HGT * 0.34, rot: 0.35, col: 'rgba(218, 190, 128, 0.25)', w: 1 },
      { cx: lx + vw * 0.38, cy: HGT * 0.56, rx: vw * 0.28, ry: HGT * 0.26, rot: -0.48, col: 'rgba(180, 195, 225, 0.2)', w: 1 },
      { cx: lx + vw * 0.78, cy: HGT * 0.46, rx: vw * 0.22, ry: HGT * 0.36, rot: 0.18, col: 'rgba(218, 190, 128, 0.24)', w: 1 }
    ];
    for (const o of orbits) {
      c.save();
      c.translate(o.cx, o.cy);
      c.rotate(o.rot);
      c.strokeStyle = o.col;
      c.lineWidth = o.w;
      c.beginPath();
      c.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    const moons = [
      [0.16, 0.31], [0.27, 0.38], [0.20, 0.80], [0.36, 0.77], [0.81, 0.28], [0.85, 0.74]
    ];
    for (const [mx, my] of moons) {
      const x = lx + vw * mx, y = HGT * my;
      c.strokeStyle = 'rgba(226, 198, 136, 0.75)';
      c.lineWidth = 1;
      c.beginPath(); c.arc(x, y, 4.5, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(226, 198, 136, 0.85)';
      c.beginPath(); c.arc(x, y, 4.5, -Math.PI * 0.5, Math.PI * 0.5); c.fill();
    }
    c.restore();
  }

  function drawDbLogo(c, x, y, r) {
    c.save();
    c.fillStyle = 'rgba(26, 34, 54, 0.9)';
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#e0c078';
    c.lineWidth = 1.5;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#e6c884';
    c.fillRect(x - r * 0.45, y - r * 0.42, r * 0.9, r * 0.84);
    c.fillStyle = '#182238';
    c.fillRect(x - r * 0.32, y - r * 0.3, r * 0.64, r * 0.6);
    drawStar4(c, x + r * 0.08, y - r * 0.04, r * 0.48, '#f5dc98');
    c.restore();
  }

  function drawNodeEmblem(c, id, cx, cy, r, active, t) {
    c.save();
    const pulse = active ? 1 + Math.sin((t || 0) * 4) * 0.04 : 1;
    const R = r * pulse;

    const glow = c.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.45);
    glow.addColorStop(0, active ? 'rgba(245, 212, 135, 0.42)' : 'rgba(215, 185, 115, 0.18)');
    glow.addColorStop(1, 'rgba(15, 24, 42, 0)');
    c.fillStyle = glow;
    c.beginPath(); c.arc(cx, cy, R * 1.45, 0, Math.PI * 2); c.fill();

    c.fillStyle = active ? '#1e2842' : '#131c32';
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();

    const gold = active ? '#f6dc9a' : '#d6b676';
    const dark = '#121a2e';
    c.strokeStyle = gold;
    c.lineWidth = active ? 2 : 1.4;
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(230, 198, 130, 0.4)';
    c.lineWidth = 1;
    c.beginPath(); c.arc(cx, cy, R * 0.84, 0, Math.PI * 2); c.stroke();

    c.fillStyle = gold;
    c.strokeStyle = gold;

    if (id === 'cones') {
      c.strokeRect(cx - R * 0.56, cy - R * 0.56, R * 1.12, R * 1.12);
      c.save();
      c.translate(cx, cy);
      c.rotate(Math.PI / 4);
      c.strokeRect(-R * 0.52, -R * 0.52, R * 1.04, R * 1.04);
      c.restore();
      c.beginPath(); c.arc(cx, cy, R * 0.34, 0, Math.PI * 2); c.fill();
      c.fillStyle = dark;
      c.beginPath(); c.arc(cx, cy, R * 0.16, 0, Math.PI * 2); c.fill();
      drawStar4(c, cx, cy, R * 0.24, gold);
    } else if (id === 'foes') {
      c.beginPath();
      c.arc(cx - R * 0.1, cy + R * 0.05, R * 0.55, Math.PI * 0.7, Math.PI * 1.9);
      c.lineTo(cx + R * 0.45, cy - R * 0.55);
      c.quadraticCurveTo(cx + R * 0.55, cy + R * 0.2, cx + R * 0.15, cy + R * 0.55);
      c.closePath();
      c.fill();
      c.fillStyle = dark;
      c.beginPath(); c.arc(cx - R * 0.12, cy - R * 0.08, R * 0.14, 0, Math.PI * 2); c.fill();
      drawStar4(c, cx + R * 0.22, cy - R * 0.18, R * 0.28, gold);
    } else if (id === 'factions') {
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
        const ox = cx + Math.cos(a) * R * 0.24, oy = cy + Math.sin(a) * R * 0.24;
        c.lineWidth = 2;
        c.beginPath(); c.arc(ox, oy, R * 0.34, 0, Math.PI * 2); c.stroke();
      }
      drawStar4(c, cx, cy, R * 0.36, gold);
    } else if (id === 'aeons') {
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        const len = (i % 2 === 0) ? R * 0.92 : R * 0.68;
        c.beginPath();
        c.moveTo(cx + Math.cos(a - 0.16) * R * 0.22, cy + Math.sin(a - 0.16) * R * 0.22);
        c.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        c.lineTo(cx + Math.cos(a + 0.16) * R * 0.22, cy + Math.sin(a + 0.16) * R * 0.22);
        c.closePath();
        c.fill();
      }
      c.fillStyle = dark;
      c.beginPath(); c.ellipse(cx, cy, R * 0.36, R * 0.22, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = gold; c.lineWidth = 1.4;
      c.beginPath(); c.ellipse(cx, cy, R * 0.36, R * 0.22, 0, 0, Math.PI * 2); c.stroke();
      c.fillStyle = gold;
      c.beginPath(); c.arc(cx, cy, R * 0.11, 0, Math.PI * 2); c.fill();
    } else if (id === 'chars') {
      for (let s = -1; s <= 1; s += 2) {
        c.beginPath();
        c.arc(cx + s * R * 0.28, cy - R * 0.08, R * 0.36, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = dark;
      c.fillRect(cx - R * 0.05, cy - R * 0.65, R * 0.1, R * 1.3);
      drawStar4(c, cx, cy - R * 0.56, R * 0.32, gold);
      drawStar4(c, cx, cy + R * 0.34, R * 0.42, gold);
      c.strokeStyle = gold;
      c.lineWidth = 1.6;
      c.beginPath(); c.arc(cx, cy, R * 0.72, Math.PI * 0.18, Math.PI * 0.82); c.stroke();
    } else if (id === 'relics') {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + i * (Math.PI / 3);
        const ox = cx + Math.cos(a) * R * 0.56, oy = cy + Math.sin(a) * R * 0.56;
        c.fillStyle = gold;
        c.beginPath(); c.arc(ox, oy, R * 0.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = dark;
        c.beginPath(); c.arc(ox, oy, R * 0.1, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = gold;
      c.beginPath(); c.arc(cx, cy, R * 0.26, 0, Math.PI * 2); c.fill();
      c.fillStyle = dark;
      c.beginPath(); c.arc(cx - R * 0.08, cy, R * 0.05, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(cx + R * 0.08, cy, R * 0.05, 0, Math.PI * 2); c.fill();
    } else if (id === 'terms') {
      c.fillStyle = gold;
      c.beginPath(); c.ellipse(cx - R * 0.22, cy - R * 0.18, R * 0.34, R * 0.24, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(cx + R * 0.22, cy - R * 0.12, R * 0.3, R * 0.24, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = dark;
      c.fillRect(cx - R * 0.4, cy - R * 0.22, R * 0.06, R * 0.06);
      c.fillRect(cx - R * 0.26, cy - R * 0.22, R * 0.06, R * 0.06);
      c.fillRect(cx - R * 0.12, cy - R * 0.22, R * 0.06, R * 0.06);
      c.beginPath(); c.arc(cx + R * 0.16, cy - R * 0.14, R * 0.04, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(cx + R * 0.28, cy - R * 0.14, R * 0.04, 0, Math.PI * 2); c.fill();
      c.fillStyle = gold;
      c.fillRect(cx - R * 0.34, cy + R * 0.2, R * 0.68, R * 0.24);
    }
    c.restore();
  }

  function drawNewBadge(c, ui, x, y) {
    c.save();
    c.fillStyle = '#d8ae60';
    c.fillRect(x, y, 34, 12);
    c.strokeStyle = '#fff0c4';
    c.lineWidth = 1;
    c.strokeRect(x + 0.5, y + 0.5, 33, 11);
    drawStar4(c, x + 33, y + 1, 3.5, '#fff4d2');
    ui.text('Новое', x + 17, y + 1, { size: 8, bold: true, align: 'center', col: '#1c160c', shadow: false });
    c.restore();
  }

  function drawDivider(c, cx, y, halfW) {
    c.save();
    c.strokeStyle = 'rgba(216, 184, 120, 0.55)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx - halfW, y);
    c.lineTo(cx - 14, y);
    c.moveTo(cx + 14, y);
    c.lineTo(cx + halfW, y);
    c.stroke();
    c.fillStyle = '#dfc082';
    c.fillRect(cx - halfW - 2, y - 1.5, 3, 3);
    c.fillRect(cx + halfW - 1, y - 1.5, 3, 3);
    drawStar4(c, cx, y, 5.5, '#e8cb8e');
    drawStar4(c, cx - 9, y, 2.5, '#c8a868');
    drawStar4(c, cx + 9, y, 2.5, '#c8a868');
    c.restore();
  }

  function drawBookItemIcon(c, kind, x, y, w, h) {
    c.save();
    const cx = x + w / 2, cy = y + h / 2;
    if (kind === 'book') {
      c.translate(cx, cy);
      c.rotate(-0.18);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(-20, -24, 42, 50);
      c.fillStyle = '#3e2723';
      c.fillRect(-22, -26, 40, 48);
      c.fillStyle = '#e8dfd0';
      c.fillRect(-19, -24, 36, 45);
      c.fillStyle = '#4e3229';
      c.fillRect(-22, -26, 38, 44);
      c.strokeStyle = '#d4af64';
      c.lineWidth = 1.2;
      c.strokeRect(-18, -22, 30, 36);
      drawStar4(c, -3, -4, 7, '#e2c178');
    } else if (kind === 'letter') {
      c.translate(cx, cy);
      c.rotate(-0.2);
      c.fillStyle = 'rgba(0,0,0,0.4)';
      c.fillRect(-22, -14, 46, 32);
      c.fillStyle = '#e5dec9';
      c.fillRect(-24, -16, 46, 30);
      c.strokeStyle = '#9e8f70';
      c.lineWidth = 1;
      c.strokeRect(-24, -16, 46, 30);
      c.beginPath();
      c.moveTo(-24, -16);
      c.lineTo(-1, 2);
      c.lineTo(22, -16);
      c.stroke();
      c.fillStyle = '#b22222';
      c.beginPath(); c.arc(-1, 0, 5.5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#ff9a8a';
      c.beginPath(); c.arc(-1, 0, 3.5, 0, Math.PI * 2); c.stroke();
    } else if (kind === 'screen') {
      c.translate(cx, cy);
      c.rotate(-0.12);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(-20, -24, 42, 50);
      c.fillStyle = '#1e2c44';
      c.fillRect(-22, -26, 40, 48);
      c.strokeStyle = '#6aa8e8';
      c.lineWidth = 1.2;
      c.strokeRect(-22, -26, 40, 48);
      c.fillStyle = '#0c1d36';
      c.fillRect(-18, -20, 32, 36);
      c.fillStyle = '#d8b46a';
      c.fillRect(-18, -20, 32, 5);
      c.fillStyle = '#6cd4ff';
      for (let i = 0; i < 5; i++) c.fillRect(-14, -10 + i * 5, (i === 4) ? 16 : 24, 2);
    } else {
      c.translate(cx, cy);
      c.rotate(-0.16);
      c.fillStyle = 'rgba(0,0,0,0.4)';
      c.fillRect(-18, -24, 40, 48);
      c.fillStyle = '#d2cdc2';
      c.fillRect(-22, -26, 38, 46);
      c.rotate(0.08);
      c.fillStyle = '#ece8df';
      c.fillRect(-20, -25, 38, 46);
      c.strokeStyle = '#9aa0a8';
      c.strokeRect(-20, -25, 38, 46);
      c.fillStyle = '#5c626e';
      c.fillRect(-15, -18, 18, 2.5);
      for (let i = 0; i < 6; i++) c.fillRect(-15, -11 + i * 5, (i % 3 === 2) ? 20 : 28, 1.5);
    }
    c.restore();
  }

  function drawWorldTabIcon(c, crest, cx, cy, r, active) {
    c.save();
    if (active) {
      c.fillStyle = '#f2efe6';
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(242, 239, 230, 0.45)';
      c.lineWidth = 1.2;
      c.beginPath(); c.arc(cx, cy, r + 3, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#f2efe6';
      c.fillRect(cx - r, cy + r + 5, r * 2, 2);
    } else {
      c.fillStyle = 'rgba(24, 34, 56, 0.85)';
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(180, 190, 215, 0.45)';
      c.lineWidth = 1.2;
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    }
    const fg = active ? '#182034' : '#cbd2e2';
    c.fillStyle = fg;
    c.strokeStyle = fg;
    c.lineWidth = 1.5;
    if (crest === 'express') {
      drawStar4(c, cx, cy, r * 0.68, fg);
    } else if (crest === 'herta') {
      c.beginPath(); c.arc(cx, cy, r * 0.48, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(cx - r * 0.65, cy + r * 0.25); c.lineTo(cx + r * 0.65, cy - r * 0.25); c.stroke();
      c.beginPath(); c.arc(cx, cy, r * 0.18, 0, Math.PI * 2); c.fill();
    } else if (crest === 'jarilo') {
      c.beginPath();
      c.moveTo(cx, cy - r * 0.62);
      c.lineTo(cx + r * 0.48, cy);
      c.lineTo(cx, cy + r * 0.62);
      c.lineTo(cx - r * 0.48, cy);
      c.closePath();
      c.fill();
    } else if (crest === 'luofu') {
      c.beginPath();
      c.arc(cx, cy + r * 0.08, r * 0.5, Math.PI * 0.15, Math.PI * 1.45);
      c.stroke();
      drawStar4(c, cx + r * 0.12, cy - r * 0.18, r * 0.42, fg);
    } else {
      c.strokeRect(cx - r * 0.42, cy - r * 0.42, r * 0.84, r * 0.84);
      drawStar4(c, cx, cy, r * 0.36, fg);
    }
    c.restore();
  }

  function openBank(close, initSec, initEntry) {
    const ui = this, g = this.game;
    H.DB.sync(g);
    let startMode = 'hub', startSec = 'chars', startTab = 0;
    if (typeof initSec === 'number') {
      startMode = 'tabs';
      startTab = initSec;
    } else if (typeof initSec === 'string') {
      if (initSec === 'books') {
        return ui.openBookshelf(close);
      } else if (['fusions', 'rumors', 'warps', 'story'].includes(initSec)) {
        startMode = 'tabs';
        startTab = { fusions: 1, rumors: 2, warps: 3, story: 4 }[initSec] || 0;
      } else if (SEC_TITLES[initSec]) {
        startMode = 'sec';
        startSec = initSec;
      }
    }

    const scr = {
      full: true,
      mode: startMode,
      sec: startSec,
      _tab: startTab,
      hubSel: 4,
      sel: 0,
      sc: { top: 0 },
      bodySc: { top: 0 },
      subTab: 0,
      filterIdx: 0,
      coneRank: 1,
      relicSlot: 0,
      backStack: [],
      get tab() { return this._tab; },
      set tab(v) {
        this._tab = ((v % BANK_TABS.length) + BANK_TABS.length) % BANK_TABS.length;
        this.mode = 'tabs';
      },
      setTab(i) {
        this._tab = ((i % BANK_TABS.length) + BANK_TABS.length) % BANK_TABS.length;
        this.mode = 'tabs';
        this.sel = 0;
        this.sc = { top: 0 };
      },
      openSection(secId, entryId, pushHistory) {
        if (pushHistory && this.mode === 'sec') {
          this.backStack.push({ sec: this.sec, sel: this.sel, scTop: this.sc.top, subTab: this.subTab, filterIdx: this.filterIdx });
        }
        this.mode = 'sec';
        this.sec = secId;
        this.filterIdx = 0;
        this.subTab = 0;
        this.sc = { top: 0 };
        this.bodySc = { top: 0 };
        this.sel = 0;
        const list = this.secItems();
        if (entryId) {
          const idx = list.findIndex(x => x.id === entryId);
          if (idx >= 0) this.sel = idx;
        }
        this.markCurrentSeen();
      },
      markCurrentSeen() {
        const b = H.DB.sync(g);
        const list = this.secItems();
        const cur = list[this.sel];
        if (!cur) return;
        if (['aeons', 'factions', 'terms'].includes(this.sec)) {
          if (cur.unlocked) b.seen[cur.id] = true;
        } else if (this.sec === 'chars' && cur.owned) {
          b.seen['char_' + cur.id] = true;
        } else if (this.sec === 'cones' && cur.owned) {
          b.seen['cone_' + cur.id] = true;
        } else if (this.sec === 'foes' && cur.seen) {
          b.seen['foe_' + cur.id] = true;
        } else if (this.sec === 'relics') {
          b.seen['relic_' + cur.id] = true;
        }
      },
      secItems() {
        const b = H.DB.sync(g), s = g.state;
        if (this.sec === 'aeons' || this.sec === 'factions' || this.sec === 'terms') {
          const src = this.sec === 'aeons' ? H.DB_AEONS : this.sec === 'factions' ? H.DB_FACTIONS : H.DB_TERMS;
          const unlocked = [], locked = [];
          for (const e of src) {
            const ok = H.DB.isUnlocked(g, e);
            const item = { id: e.id, entry: e, unlocked: ok, label: ok ? e.title : '??? (неизвестно)', isNew: ok && !b.seen[e.id] && !/_intro$/.test(e.id), isIntro: /_intro$/.test(e.id) };
            if (ok) unlocked.push(item);
            else locked.push(item);
          }
          return unlocked.concat(locked);
        }
        if (this.sec === 'chars') {
          const pf = PATH_FILTERS[this.filterIdx % PATH_FILTERS.length].id;
          return Object.getOwnPropertyNames(H.CHARS).filter(id => pf === 'all' || H.CHARS[id].path === pf).map(id => {
            const ch = H.CHARS[id], owned = !!(s.roster && s.roster[id]);
            return { id, ch, owned, label: /^trail/.test(id) ? (s.name || ch.name) : ch.name, isNew: owned && !b.seen['char_' + id] };
          });
        }
        if (this.sec === 'cones') {
          const pf = PATH_FILTERS[this.filterIdx % PATH_FILTERS.length].id;
          return Object.entries(H.CONES).filter(([, d]) => pf === 'all' || d.path === pf).map(([id, d]) => {
            const owned = !!b.cones[id];
            return { id, d, owned, label: d.name, isNew: owned && !b.seen['cone_' + id] };
          });
        }
        if (this.sec === 'foes') {
          const ff = FOE_FILTERS[this.filterIdx % FOE_FILTERS.length].id;
          return Object.entries(H.ENEMIES).filter(([id, d]) => ff === 'all' || H.DB.foeGroup(id, d) === ff).map(([id, d]) => {
            const rec = b.enemies && b.enemies[id];
            return { id, d, seen: !!rec, rec, label: rec ? d.name : '??? (' + d.name + ')', isNew: !!rec && !b.seen['foe_' + id] };
          });
        }
        if (this.sec === 'relics') {
          return Object.entries(H.RELIC_SETS).map(([id, d]) => {
            let pieces = 0;
            for (const sl of ['head', 'hands', 'body', 'feet']) if (b.relics[id + ':' + sl]) pieces++;
            return { id, d, pieces, label: d.name, isNew: pieces > 0 && !b.seen['relic_' + id] };
          });
        }
        return [];
      },
      rows() {
        const s = g.state;
        if (this._tab === 0) return Object.entries(H.ENEMIES).filter(([id]) => s.bank.enemies[id]).map(([id, d]) => ({ id, d, label: d.name, right: '×' + s.bank.enemies[id].kills, icon: (cc, ix, iy) => G.foeIcon(cc, d, ix, iy - 9, 18), iconW: 22 }));
        if (this._tab === 1) return Object.entries(H.FUSIONS).map(([id, f]) => ({ id, f, label: s.bank.fusions.includes(id) ? f.name : '???', col: s.bank.fusions.includes(id) ? C.cream : C.dim, right: f.members.map(m => H.CHARS[m].name.split(' ')[0]).join(' + '), icon: (cc, ix, iy) => G.menuIcon(cc, 'fusions', ix + 1, iy - 8, 16), iconW: 20 }));
        if (this._tab === 2) return H.RUMORS.map(r => ({ r, label: s.flags[r.id] ? r.title : '???', col: s.flags[r.id] ? C.cream : C.dim, right: s.flags[r.id] ? 'правда' : '-', rcol: s.flags[r.id] ? C.ok : C.dim, icon: (cc, ix, iy) => G.menuIcon(cc, 'chat', ix + 1, iy - 8, 16), iconW: 20 }));
        if (this._tab === 4) return g.recapLog().map((x, i) => ({ x, label: x.title, right: String(i + 1), icon: (cc, ix, iy) => G.menuIcon(cc, 'archive', ix + 1, iy - 8, 16), iconW: 20 }));
        return s.warpLog.map(e => ({ e, label: warpName(e), col: RAR_TXT[e.rar], right: '★'.repeat(e.rar), rcol: G.RARITY[e.rar], icon: (cc, ix, iy) => warpIcon(cc, e, ix, iy - 8, 16, g), iconW: 22 }));
      },
      stats() {
        const s = g.state;
        if (this._tab === 0) return 'Изучено: ' + Object.keys(s.bank.enemies).filter(id => H.ENEMIES[id]).length + ' / ' + Object.keys(H.ENEMIES).length;
        if (this._tab === 1) return 'Открыто: ' + Object.keys(H.FUSIONS).filter(id => s.bank.fusions.includes(id)).length + ' / ' + Object.keys(H.FUSIONS).length;
        if (this._tab === 2) return 'В силе: ' + H.RUMORS.filter(r => s.flags[r.id]).length + ' / ' + H.RUMORS.length;
        if (this._tab === 3) return 'Записей: ' + s.warpLog.length;
        return 'Записей: ' + g.recapLog().length;
      },
      drawHub(c) {
        drawAstrolabeBg(c, ui, true);
        const lx = ui.left, vw = ui.vw, counts = H.DB.nodeCounts(g);

        drawDbLogo(c, lx + 26, 22, 12);
        ui.text('База данных', lx + 44, 15, { size: 13, bold: true, col: '#f2efe6' });

        const bk = counts.books;
        const bkBtnX = W - 216, chBtnX = W - 122;
        ui.button(bkBtnX, 10, 88, 22, 'Книги ' + bk.got + '/' + bk.total, () => { ui.sfx('select'); ui.openBookshelf(null); }, { size: 9, icon: 'archive', active: bk.hasNew });
        if (bk.hasNew) drawStar4(c, bkBtnX + 84, 12, 4, '#ffe28a');
        ui.button(chBtnX, 10, 84, 22, 'Хроники', () => { this.setTab(0); ui.sfx('select'); }, { size: 9, icon: 'fusions' });
        ui.closeBtn(W - 32, 10, () => this.key('back'));

        ASTRO_NODES.forEach((nd, i) => {
          const cx = Math.round(lx + vw * nd.rx), cy = Math.round(HGT * nd.ry);
          const active = this.hubSel === i;
          const cnt = counts[nd.id] || { got: 0, total: 0, hasNew: false };
          drawNodeEmblem(c, nd.id, cx, cy, nd.r, active, ui.t);
          if (cnt.hasNew) drawNewBadge(c, ui, cx + nd.r * 0.55, cy - nd.r - 4);
          const ly = cy + nd.r + 6;
          ui.text(nd.label, cx, ly, { size: nd.main ? 12 : 11, bold: true, align: 'center', col: active ? '#fff4d2' : '#e8e4da' });
          ui.text(cnt.got + '/' + cnt.total, cx, ly + 15, { size: 11, bold: true, align: 'center', col: '#d8b878' });
          ui.hit(cx - nd.r - 18, cy - nd.r - 10, (nd.r + 18) * 2, nd.r * 2 + 44, () => {
            this.hubSel = i;
            ui.sfx('select');
            this.openSection(nd.id, null, false);
          });
        });

        const dockW = 416, dockX = Math.round(lx + (vw - dockW) / 2), dockY = HGT - 54;
        c.fillStyle = 'rgba(12, 20, 38, 0.82)';
        c.fillRect(dockX, dockY, dockW, 28);
        c.strokeStyle = 'rgba(214, 182, 118, 0.45)';
        c.strokeRect(dockX + 0.5, dockY + 0.5, dockW - 1, 27);
        const chronItems = [
          { label: 'Сюжет', tab: 4, icon: 'archive' },
          { label: 'Слияния', tab: 1, icon: 'fusions' },
          { label: 'Слухи', tab: 2, icon: 'chat' },
          { label: 'Прыжки', tab: 3, icon: 'warp' }
        ];
        chronItems.forEach((it, idx) => {
          const bx = dockX + 6 + idx * 101;
          ui.button(bx, dockY + 3, 97, 22, it.label, () => { this.setTab(it.tab); ui.sfx('select'); }, { size: 9, icon: it.icon });
        });

        ui.hints([['←→↑↓', 'Выбор раздела'], ['Enter', 'Открыть'], ['B', 'Книги'], ['H', 'Хроники'], ['Esc', 'Закрыть']], lx + 16, HGT - 18);
      },
      drawSecHeader(c, title, got, total) {
        const lx = ui.left, rx = ui.right;
        drawDbLogo(c, lx + 26, 22, 12);
        ui.text('База данных', lx + 44, 9, { size: 9, col: '#c8b080' });
        ui.text(title, lx + 44, 20, { size: 13, bold: true, col: '#f2efe6' });

        const statTxt = '/' + total;
        const gotTxt = String(got);
        ui.text('Получено', rx - 120, 15, { size: 11, align: 'right', col: '#cfd6e6' });
        ui.text(gotTxt, rx - 94, 15, { size: 11, bold: true, align: 'right', col: '#e6c173' });
        ui.text(statTxt, rx - 94, 15, { size: 11, col: '#cfd6e6' });

        ui.button(rx - 62, 10, 24, 22, '↩', () => this.stepBack(), { size: 11 });
        ui.closeBtn(W - 32, 10, () => this.key('back'));
      },
      stepBack() {
        ui.sfx('cancel');
        if (this.backStack.length) {
          const prev = this.backStack.pop();
          this.sec = prev.sec;
          this.filterIdx = prev.filterIdx || 0;
          this.subTab = prev.subTab || 0;
          this.sel = prev.sel || 0;
          this.sc = { top: prev.scTop || 0 };
          this.bodySc = { top: 0 };
          return;
        }
        this.mode = 'hub';
      },
      drawEncyclopediaSec(c) {
        drawAstrolabeBg(c, ui, false);
        const counts = H.DB.nodeCounts(g)[this.sec] || { got: 0, total: 0 };
        this.drawSecHeader(c, SEC_TITLES[this.sec], counts.got, counts.total);

        const lx = ui.left + 16, listW = ui.vw > 700 ? 226 : 186;
        const cardX = lx + listW + 14, cardW = ui.right - 16 - cardX;
        const topY = 48, paneH = HGT - 72;

        const items = this.secItems();
        if (this.sel >= items.length) this.sel = Math.max(0, items.length - 1);
        const rowH = 36, visRows = Math.floor(paneH / rowH);
        if (this.sel < this.sc.top) this.sc.top = this.sel;
        if (this.sel >= this.sc.top + visRows) this.sc.top = this.sel - visRows + 1;
        this.sc.top = Math.max(0, Math.min(this.sc.top, Math.max(0, items.length - visRows)));

        for (let i = 0; i < visRows && this.sc.top + i < items.length; i++) {
          const idx = this.sc.top + i, it = items[idx], ry = topY + i * rowH;
          const on = idx === this.sel;
          if (on) {
            c.fillStyle = '#ebe7df';
            c.fillRect(lx, ry, listW - 8, rowH - 3);
            c.strokeStyle = '#c8b488';
            c.strokeRect(lx + 1.5, ry + 1.5, listW - 11, rowH - 6);
            drawStar4(c, lx - 6, ry + rowH / 2 - 1, 4.5, '#f2efe6');
          } else {
            c.fillStyle = 'rgba(16, 24, 44, 0.72)';
            c.fillRect(lx, ry, listW - 8, rowH - 3);
            c.fillStyle = it.isIntro ? '#c8a868' : '#586682';
            c.fillRect(lx, ry + 3, 3, rowH - 9);
            c.fillStyle = 'rgba(180, 195, 225, 0.14)';
            c.fillRect(lx, ry + rowH - 3, listW - 8, 1);
          }
          const tCol = on ? '#1a1e28' : it.isIntro ? '#dfc080' : it.unlocked ? '#e4e8f2' : '#6c768c';
          const lines = ui.wrap(it.label, listW - 26, 10).slice(0, 2);
          if (lines.length === 1) {
            ui.text(lines[0], lx + 10, ry + 11, { size: 10, bold: on || it.isIntro, col: tCol, shadow: !on });
          } else {
            ui.text(lines[0], lx + 10, ry + 5, { size: 10, bold: on, col: tCol, shadow: !on });
            ui.text(lines[1], lx + 10, ry + 18, { size: 10, bold: on, col: tCol, shadow: !on });
          }
          if (it.isNew) drawNewBadge(c, ui, lx + listW - 44, ry + 2);
          ui.hit(lx, ry, listW - 8, rowH - 3, () => {
            this.sel = idx;
            this.bodySc.top = 0;
            this.markCurrentSeen();
            ui.sfx('select');
          });
        }
        if (items.length > visRows) {
          const sbX = lx + listW - 4, maxT = items.length - visRows;
          const thumbH = Math.max(24, Math.round(paneH * visRows / items.length));
          const thumbY = topY + Math.round((paneH - thumbH) * (this.sc.top / maxT));
          c.fillStyle = 'rgba(255,255,255,0.12)';
          c.fillRect(sbX, topY, 3, paneH);
          c.fillStyle = '#c8cfd8';
          c.fillRect(sbX, thumbY, 3, thumbH);
        }
        ui.wheelZone(lx, topY, listW, paneH, dir => {
          this.sc.top = Math.max(0, Math.min(Math.max(0, items.length - visRows), this.sc.top + (dir > 0 ? 2 : -2)));
        });

        c.fillStyle = 'rgba(14, 22, 40, 0.78)';
        c.fillRect(cardX, topY, cardW, paneH);
        c.strokeStyle = 'rgba(180, 192, 216, 0.32)';
        c.strokeRect(cardX + 0.5, topY + 0.5, cardW - 1, paneH - 1);
        drawWatermark(c, cardX + cardW - 62, topY + paneH - 58, 56, 0.08);

        const cur = items[this.sel];
        if (!cur) return;
        const e = cur.entry, cx = cardX + Math.round(cardW / 2), pad = 20, innerW = cardW - pad * 2;

        ui.text(ui.fitText(cur.unlocked ? e.title : 'Запись закрыта', 13, innerW, true), cx, topY + 14, { size: 13, bold: true, align: 'center', col: '#e6c687' });
        drawDivider(c, cx, topY + 36, Math.round(innerW * 0.46));

        if (!cur.unlocked) {
          const hint = e.unlockHint || 'Продолжайте путешествие по Серебряной колее, чтобы открыть эту запись Базы данных.';
          ui.wrap(hint, innerW - 20, 11).forEach((l, i) => {
            ui.text(l, cx, topY + 140 + i * 16, { size: 11, align: 'center', col: '#8e9ab2' });
          });
          return;
        }

        const related = (e.related || []).map(rid => H.DB.findEntry(rid)).filter(Boolean);
        const relAreaH = related.length ? 54 : 8;
        const bodyTopY = topY + 46, bodyBotY = topY + paneH - relAreaH;
        const bodyLines = [];

        if (e.quote) {
          for (const ql of ui.wrap(e.quote, innerW, 10)) bodyLines.push({ t: ql, col: '#d8b878', italic: true, align: 'left' });
          if (e.quoteSrc) {
            for (const sl of ui.wrap(e.quoteSrc, innerW, 10)) bodyLines.push({ t: sl, col: '#d8b878', italic: true, align: 'right' });
          }
          bodyLines.push({ t: '' });
        }
        for (const para of String(e.body || '').split('\n')) {
          if (!para.trim()) { bodyLines.push({ t: '' }); continue; }
          for (const bl of ui.wrap(para, innerW, 11)) bodyLines.push({ t: bl, col: '#dce2ee', align: 'left' });
          bodyLines.push({ t: '' });
        }
        while (bodyLines.length && !bodyLines[bodyLines.length - 1].t) bodyLines.pop();

        const lh = 15, maxVis = Math.floor((bodyBotY - bodyTopY) / lh);
        const maxBodyTop = Math.max(0, bodyLines.length - maxVis);
        this.bodySc.top = Math.max(0, Math.min(this.bodySc.top, maxBodyTop));

        bodyLines.slice(this.bodySc.top, this.bodySc.top + maxVis).forEach((ln, i) => {
          if (!ln.t) return;
          const tx = ln.align === 'right' ? cardX + cardW - pad : cardX + pad;
          ui.text(ln.t, tx, bodyTopY + i * lh, { size: 11, align: ln.align, col: ln.col, serif: !!ln.italic });
        });

        if (maxBodyTop > 0) {
          const sbX = cardX + cardW - 6, trackH = bodyBotY - bodyTopY;
          const thH = Math.max(20, Math.round(trackH * maxVis / bodyLines.length));
          const thY = bodyTopY + Math.round((trackH - thH) * (this.bodySc.top / maxBodyTop));
          c.fillStyle = 'rgba(255,255,255,0.12)';
          c.fillRect(sbX, bodyTopY, 3, trackH);
          c.fillStyle = '#d8dde8';
          c.fillRect(sbX, thY, 3, thH);
        }
        ui.wheelZone(cardX, bodyTopY, cardW, bodyBotY - bodyTopY, dir => {
          this.bodySc.top = Math.max(0, Math.min(maxBodyTop, this.bodySc.top + (dir > 0 ? 2 : -2)));
        });

        if (related.length) {
          const ry = topY + paneH - 50;
          c.strokeStyle = 'rgba(180, 195, 225, 0.28)';
          c.beginPath();
          c.moveTo(cardX + pad, ry);
          c.lineTo(cx - 58, ry);
          c.moveTo(cx + 58, ry);
          c.lineTo(cardX + cardW - pad, ry);
          c.stroke();
          ui.text('Связанные записи', cx, ry - 6, { size: 9, align: 'center', col: '#a8b4ca' });

          const pills = related.slice(0, 3);
          const gap = 8, pillW = Math.min(138, Math.floor((innerW - gap * (pills.length - 1)) / pills.length));
          const startX = cx - Math.round((pills.length * pillW + (pills.length - 1) * gap) / 2);
          pills.forEach((rel, pi) => {
            const px = startX + pi * (pillW + gap), py = ry + 8, ph = 28;
            c.fillStyle = 'rgba(24, 34, 58, 0.88)';
            c.fillRect(px, py, pillW, ph);
            c.strokeStyle = '#7c8ca8';
            c.strokeRect(px + 0.5, py + 0.5, pillW - 1, ph - 1);
            const pLines = ui.wrap(rel.entry.title, pillW - 10, 9).slice(0, 2);
            if (pLines.length === 1) {
              ui.text(pLines[0], px + Math.round(pillW / 2), py + 9, { size: 9, align: 'center', col: '#e6ebf5' });
            } else {
              ui.text(pLines[0], px + Math.round(pillW / 2), py + 3, { size: 8, align: 'center', col: '#e6ebf5' });
              ui.text(pLines[1], px + Math.round(pillW / 2), py + 14, { size: 8, align: 'center', col: '#b8c4dc' });
            }
            ui.hit(px, py, pillW, ph, () => {
              ui.sfx('select');
              this.openSection(rel.sec, rel.entry.id, true);
            });
          });
        }
        ui.hints([['↑↓', 'Выбор записи'], ['Колесо', 'Текст'], ['1-3', 'Связанные'], ['Esc', 'Назад']], ui.left + 16, HGT - 18);
      },
      drawCombatOrItemSec(c) {
        drawAstrolabeBg(c, ui, false);
        const counts = H.DB.nodeCounts(g)[this.sec] || { got: 0, total: 0 };
        this.drawSecHeader(c, SEC_TITLES[this.sec], counts.got, counts.total);

        const lx = ui.left + 16, listW = ui.vw > 700 ? 226 : 196;
        const cardX = lx + listW + 12, cardW = ui.right - 16 - cardX;
        const topY = 46, paneH = HGT - 70;

        if (this.sec === 'chars' || this.sec === 'cones' || this.sec === 'foes') {
          const filters = this.sec === 'foes' ? FOE_FILTERS : PATH_FILTERS;
          const curF = filters[this.filterIdx % filters.length];
          ui.button(lx, topY, listW - 8, 20, 'Фильтр: ' + curF.label + ' (F)', () => {
            this.filterIdx = (this.filterIdx + 1) % filters.length;
            this.sel = 0;
            this.sc.top = 0;
            ui.sfx('select');
          }, { size: 9 });
        }

        const listTop = (this.sec === 'relics') ? topY : topY + 24;
        const listH = paneH - (listTop - topY);
        const items = this.secItems();
        if (this.sel >= items.length) this.sel = Math.max(0, items.length - 1);
        const rowH = 26, visRows = Math.floor(listH / rowH);
        if (this.sel < this.sc.top) this.sc.top = this.sel;
        if (this.sel >= this.sc.top + visRows) this.sc.top = this.sel - visRows + 1;
        this.sc.top = Math.max(0, Math.min(this.sc.top, Math.max(0, items.length - visRows)));

        for (let i = 0; i < visRows && this.sc.top + i < items.length; i++) {
          const idx = this.sc.top + i, it = items[idx], ry = listTop + i * rowH;
          const on = idx === this.sel;
          c.fillStyle = on ? '#ebe7df' : 'rgba(16, 24, 44, 0.72)';
          c.fillRect(lx, ry, listW - 8, rowH - 2);
          if (!on) {
            c.fillStyle = (it.owned || it.seen || it.pieces > 0) ? '#d6b676' : '#4a5670';
            c.fillRect(lx, ry + 2, 3, rowH - 6);
          }
          const unlocked = !!(it.owned || it.seen || it.pieces > 0 || this.sec === 'chars' || this.sec === 'cones' || this.sec === 'relics');
          const tCol = on ? '#1a1e28' : unlocked ? '#e4e8f2' : '#7c869c';
          ui.text(ui.fitText(it.label, 10, listW - 44, on), lx + 8, ry + 6, { size: 10, bold: on, col: tCol, shadow: !on });
          if (it.isNew) drawStar4(c, lx + listW - 18, ry + 12, 4, '#e6c173');
          ui.hit(lx, ry, listW - 8, rowH - 2, () => {
            this.sel = idx;
            this.bodySc.top = 0;
            this.markCurrentSeen();
            ui.sfx('select');
          });
        }
        ui.wheelZone(lx, listTop, listW, listH, dir => {
          this.sc.top = Math.max(0, Math.min(Math.max(0, items.length - visRows), this.sc.top + (dir > 0 ? 2 : -2)));
        });

        c.fillStyle = 'rgba(14, 22, 40, 0.82)';
        c.fillRect(cardX, topY, cardW, paneH);
        c.strokeStyle = 'rgba(180, 192, 216, 0.32)';
        c.strokeRect(cardX + 0.5, topY + 0.5, cardW - 1, paneH - 1);
        drawWatermark(c, cardX + cardW - 58, topY + paneH - 54, 52, 0.07);

        const cur = items[this.sel];
        if (!cur) return;
        const pad = 16, innerW = cardW - pad * 2, cx = cardX + Math.round(cardW / 2);

        if (this.sec === 'chars') {
          const ch = cur.ch, inf = (H.INFO && H.INFO[cur.id]) || {};
          ui.portraitCard(c, G.lookOf(cur.id, g), cardX + pad, topY + 12, 58, { elem: ch.elem, border: G.RARITY[ch.rar || 4] });
          ui.text(cur.label, cardX + pad + 68, topY + 12, { size: 13, bold: true, col: '#f2efe6' });
          ui.text((H.PATHS[ch.path] && H.PATHS[ch.path].name || ch.path) + ' · ' + (H.ELEMENTS[ch.elem] && H.ELEMENTS[ch.elem].name || ch.elem), cardX + pad + 68, topY + 30, { size: 10, col: '#d8b878' });
          ui.text((inf.faction || 'Звёздный экспресс') + (cur.owned ? ' · В отряде' : ' · Запись архива'), cardX + pad + 68, topY + 46, { size: 9, col: cur.owned ? C.ok : '#9aa6bc' });

          const tabs = ['Досье', 'Истории', 'Озвучка', 'Навыки'];
          const tw = Math.floor((innerW - 12) / 4);
          tabs.forEach((tl, ti) => {
            ui.button(cardX + pad + ti * (tw + 4), topY + 76, tw, 20, tl, () => { this.subTab = ti; this.bodySc.top = 0; ui.sfx('select'); }, { active: this.subTab === ti, size: 9 });
          });

          const lines = [];
          if (this.subTab === 0) {
            if (inf.bio) for (const l of ui.wrap(inf.bio, innerW, 10)) lines.push({ t: l, col: '#dce2ee' });
            if (inf.stories && inf.stories[0]) {
              lines.push({ t: '' });
              for (const l of ui.wrap(inf.stories[0], innerW, 10)) lines.push({ t: l, col: '#c8d2e6' });
            }
          } else if (this.subTab === 1) {
            (inf.stories || []).forEach((st, si) => {
              lines.push({ t: 'История персонажа ' + (si + 1), col: '#e6c173', bold: true });
              for (const l of ui.wrap(st, innerW, 10)) lines.push({ t: l, col: '#dce2ee' });
              lines.push({ t: '' });
            });
          } else if (this.subTab === 2) {
            (inf.voice || []).forEach(([vt, vd]) => {
              lines.push({ t: '«' + vt + '»', col: '#e6c173', bold: true });
              for (const l of ui.wrap(vd, innerW, 10)) lines.push({ t: l, col: '#dce2ee' });
              lines.push({ t: '' });
            });
          } else {
            if (H.SkillsInfo && H.SkillsInfo.buildNode) {
              for (const k of ['basic', 'skill', 'ult', 'talent', 'tech']) {
                const nd = H.SkillsInfo.buildNode(g, cur.id, cur.id, k, null);
                if (!nd || !nd.forms) continue;
                for (const fm of nd.forms) {
                  lines.push({ t: (fm.badge || nd.cat.badge) + ': ' + fm.title + ' [' + fm.tag + ']', col: '#e6c173', bold: true });
                  for (const l of ui.wrap(fm.short || '', innerW, 10)) lines.push({ t: l, col: '#dce2ee' });
                  const firstPara = String(fm.full || '').split('\n\n')[0];
                  if (firstPara && firstPara !== fm.short) {
                    for (const l of ui.wrap(firstPara, innerW, 10)) lines.push({ t: l, col: '#9aa8c4' });
                  }
                  lines.push({ t: '' });
                }
              }
            } else {
              for (const [k, lb] of [['basic', 'Базовая атака'], ['skill', 'Навык'], ['ult', 'Сверхспособность'], ['tech', 'Техника']]) {
                const ab = ch[k];
                if (!ab) continue;
                lines.push({ t: lb + ': ' + ab.name, col: '#e6c173', bold: true });
                for (const l of ui.wrap(ab.desc || ab.text || '', innerW, 10)) lines.push({ t: l, col: '#dce2ee' });
                lines.push({ t: '' });
              }
            }
          }
          const by = topY + 104, bh = paneH - 140, lh = 14, vis = Math.floor(bh / lh);
          const maxT = Math.max(0, lines.length - vis);
          this.bodySc.top = Math.max(0, Math.min(this.bodySc.top, maxT));
          lines.slice(this.bodySc.top, this.bodySc.top + vis).forEach((ln, i) => {
            if (ln.t) ui.text(ln.t, cardX + pad, by + i * lh, { size: 10, bold: !!ln.bold, col: ln.col });
          });
          ui.wheelZone(cardX, by, cardW, bh, dir => { this.bodySc.top = Math.max(0, Math.min(maxT, this.bodySc.top + (dir > 0 ? 2 : -2))); });
          if (cur.owned && ui.openChars) {
            ui.button(cardX + pad, topY + paneH - 30, innerW, 22, 'Открыть экран персонажа', () => { ui.sfx('select'); ui.openChars(cur.id); }, { size: 10, active: true });
          }
        } else if (this.sec === 'cones') {
          const d = cur.d;
          G.drawConeCard(c, cur.id, cardX + pad, topY + 12, 56, 78);
          ui.text(ui.fitText(d.name, 12, innerW - 66, true), cardX + pad + 66, topY + 12, { size: 12, bold: true, col: RAR_TXT[d.rar] || '#f2efe6' });
          ui.text('★'.repeat(d.rar) + ' · ' + (H.PATHS[d.path] && H.PATHS[d.path].name || d.path), cardX + pad + 66, topY + 30, { size: 10, col: '#d8b878' });
          ui.text(cur.owned ? 'Получено в коллекцию' : 'В архиве Сада Воспоминаний', cardX + pad + 66, topY + 46, { size: 9, col: cur.owned ? C.ok : '#8e9ab2' });
          ui.button(cardX + pad + 66, topY + 64, 110, 20, 'Наложение: ' + ['I', 'II', 'III', 'IV', 'V'][this.coneRank - 1] + ' (R)', () => {
            this.coneRank = (this.coneRank % 5) + 1;
            ui.sfx('select');
          }, { size: 9 });
          if (ui.openConeView) {
            ui.button(cardX + pad + 182, topY + 64, 108, 20, 'Крупный план', () => { ui.sfx('select'); ui.openConeView(cur.id); }, { size: 9 });
          }

          const lines = [];
          if (H.BD && H.BD.coneLines) {
            for (const cl of H.BD.coneLines(cur.id, this.coneRank)) {
              for (const l of ui.wrap(cl, innerW, 10)) lines.push({ t: l, col: '#e6c173' });
            }
            lines.push({ t: '' });
          }
          for (const para of String(d.desc || d.lore || 'Воспоминание, запечатанное в Световом конусе Сада Воспоминаний.').split('\n')) {
            for (const l of ui.wrap(para, innerW, 10)) lines.push({ t: l, col: '#dce2ee' });
          }
          const by = topY + 98, bh = paneH - 108, lh = 14, vis = Math.floor(bh / lh);
          const maxT = Math.max(0, lines.length - vis);
          this.bodySc.top = Math.max(0, Math.min(this.bodySc.top, maxT));
          lines.slice(this.bodySc.top, this.bodySc.top + vis).forEach((ln, i) => {
            if (ln.t) ui.text(ln.t, cardX + pad, by + i * lh, { size: 10, col: ln.col });
          });
          ui.wheelZone(cardX, by, cardW, bh, dir => { this.bodySc.top = Math.max(0, Math.min(maxT, this.bodySc.top + (dir > 0 ? 2 : -2))); });
        } else if (this.sec === 'foes') {
          const d = cur.d, rec = cur.rec || { seen: 0, kills: 0, contacts: {} };
          G.foeIcon(c, d, cardX + pad, topY + 12, 32);
          ui.text(ui.fitText(d.name, 12, innerW - 42, true), cardX + pad + 40, topY + 12, { size: 12, bold: true, col: '#f2efe6' });
          ui.text((d.boss ? 'Босс' : d.elite ? 'Элитный противник' : 'Обычный противник') + ' · Побед: ' + rec.kills, cardX + pad + 40, topY + 28, { size: 10, col: '#d8b878' });
          d.weak.forEach((e, i) => G.elemIcon(c, e, cardX + pad + 48 + i * 18, topY + 50, 7));

          const tabs = ['Описание', 'Боевые данные', 'Контакт'];
          const tw = Math.floor((innerW - 8) / 3);
          tabs.forEach((tl, ti) => {
            ui.button(cardX + pad + ti * (tw + 4), topY + 64, tw, 20, tl, () => { this.subTab = ti; this.bodySc.top = 0; ui.sfx('select'); }, { active: this.subTab === ti, size: 9 });
          });

          const by = topY + 92, bh = paneH - 102, lh = 14, vis = Math.floor(bh / lh);
          const lines = [];
          if (this.subTab === 0) {
            const loreTxt = (H.foeLore && H.foeLore(cur.id)) || d.desc || 'Противник, встреченный на пути Звёздного экспресса.';
            for (const para of String(loreTxt).split('\n')) {
              for (const l of ui.wrap(para, innerW, 10)) lines.push({ t: l, col: '#dce2ee' });
              lines.push({ t: '' });
            }
          } else if (this.subTab === 1) {
            (d.moves || []).forEach(mv => {
              const sk = (H.BD && H.BD.foeSkill) ? H.BD.foeSkill(cur.id, mv) : { name: mv.name, desc: '' };
              lines.push({ t: '• ' + (sk.name || mv.name), col: '#e6c173', bold: true });
              if (sk.desc) for (const l of ui.wrap(sk.desc, innerW - 8, 10)) lines.push({ t: '  ' + l, col: '#dce2ee' });
              lines.push({ t: '' });
            });
          } else {
            const fam = H.CONTACT[d.fam];
            if (fam) {
              lines.push({ t: 'Группа переговоров: ' + fam.name, col: '#e6c173', bold: true });
              const pos = Object.entries(fam.react).filter(([, v]) => v === 'eager' || v === 'happy').map(([t2]) => TAG_NAME[t2]).join(', ');
              for (const l of ui.wrap('Одобряет подходы: ' + pos, innerW, 10)) lines.push({ t: l, col: C.ok });
            } else {
              lines.push({ t: 'Противник не вступает в переговоры.', col: C.bad });
            }
          }
          const maxT = Math.max(0, lines.length - vis);
          this.bodySc.top = Math.max(0, Math.min(this.bodySc.top, maxT));
          lines.slice(this.bodySc.top, this.bodySc.top + vis).forEach((ln, i) => {
            if (ln.t) ui.text(ln.t, cardX + pad, by + i * lh, { size: 10, bold: !!ln.bold, col: ln.col });
          });
          ui.wheelZone(cardX, by, cardW, bh, dir => { this.bodySc.top = Math.max(0, Math.min(maxT, this.bodySc.top + (dir > 0 ? 2 : -2))); });
        } else if (this.sec === 'relics') {
          const d = cur.d, b = H.DB.sync(g);
          ui.text(d.name, cx, topY + 14, { size: 13, bold: true, align: 'center', col: '#e6c687' });
          drawDivider(c, cx, topY + 34, Math.round(innerW * 0.44));

          const slots = ['head', 'hands', 'body', 'feet'];
          const slotNames = { head: 'Голова', hands: 'Руки', body: 'Тело', feet: 'Ноги' };
          const sw = 48, gap = 14, sx0 = cx - Math.round((4 * sw + 3 * gap) / 2);
          slots.forEach((sl, si) => {
            const sx = sx0 + si * (sw + gap), sy = topY + 46;
            const got = !!b.relics[cur.id + ':' + sl], on = this.relicSlot === si;
            c.fillStyle = on ? 'rgba(230, 198, 130, 0.25)' : 'rgba(22, 32, 54, 0.85)';
            c.fillRect(sx, sy, sw, sw);
            c.strokeStyle = on ? '#f2dc9a' : got ? '#9aa8c4' : '#3e4a64';
            c.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sw - 1);
            if (H.RelicArt && H.RelicArt.draw) H.RelicArt.draw(c, cur.id, sl, sx + 6, sy + 6, sw - 12);
            ui.text(slotNames[sl], sx + sw / 2, sy + sw + 3, { size: 8, align: 'center', col: got ? '#e6c173' : '#7c869c' });
            ui.hit(sx, sy, sw, sw + 14, () => { this.relicSlot = si; ui.sfx('select'); });
          });

          const lines = [];
          if (d.desc2 || d.twoText) {
            for (const l of ui.wrap('2 предмета: ' + (d.desc2 || d.twoText), innerW, 10)) lines.push({ t: l, col: '#e6c173' });
          }
          if (d.desc4 || d.fourText) {
            for (const l of ui.wrap('4 предмета: ' + (d.desc4 || d.fourText), innerW, 10)) lines.push({ t: l, col: '#e6c173' });
          }
          lines.push({ t: '' });
          const curSl = slots[this.relicSlot % 4];
          const pieceLore = (d.lore && d.lore[curSl]) || d.story || ('Реликвия набора «' + d.name + '» (' + slotNames[curSl] + '), сохранённая в информационном контуре Фрагментума.');
          for (const l of ui.wrap(pieceLore, innerW, 10)) lines.push({ t: l, col: '#dce2ee' });

          const by = topY + 116, bh = paneH - 126, lh = 15;
          lines.slice(0, Math.floor(bh / lh)).forEach((ln, i) => {
            if (ln.t) ui.text(ln.t, cardX + pad, by + i * lh, { size: 10, col: ln.col });
          });
        }
        ui.hints([['↑↓', 'Выбор'], ['F', 'Фильтр'], ['←→', 'Вкладка'], ['Esc', 'Назад']], ui.left + 16, HGT - 18);
      },
      drawTabs(c) {
        ui.fullBg(c, false);
        c.fillStyle = 'rgba(4,6,20,0.45)'; c.fillRect(ui.left, 0, ui.vw, HGT);
        ui.plate(12, 10, 'База данных');
        BANK_TABS.forEach((t, i) => {
          const on = i === this._tab;
          ui.button(158 + i * 89, 8, 85, 24, t.label, () => { this.setTab(i); ui.sfx('select'); }, { active: on, size: 10, icon: t.icon });
        });
        ui.closeBtn(W - 32, 10, () => this.key('back'));
        const curTab = BANK_TABS[this._tab];
        ui.win(20, 42, 324, 390, { alpha: 0.85, corners: false });
        G.menuIcon(c, curTab.icon, 32, 50, 18);
        ui.text(curTab.label, 56, 53, { size: 12, bold: true, serif: true, col: C.gold });
        ui.text(this.stats(), 332, 54, { size: 11, align: 'right', col: C.sub });
        c.fillStyle = C.brassDk; c.fillRect(32, 73, 300, 1);
        const rows = this.rows();
        if (this.sel >= rows.length) this.sel = Math.max(0, rows.length - 1);
        ui.list(32, 80, 300, rows, this.sel, { rowH: 20, max: 17, size: 11, scroll: this.sc, onClick: i => { this.sel = i; } });
        if (!rows.length) ui.text('Записей пока нет.', 182, 232, { align: 'center', col: C.dim });
        ui.win(352, 42, 268, 390, { alpha: 0.9 });
        const r = rows[this.sel];
        if (!r) {
          G.menuIcon(c, curTab.icon, 470, 186, 32);
          const emptyMsg = this._tab === 0 ? 'Встреченные в боях противники появятся здесь.' : this._tab === 3 ? 'Сделайте Прыжок, чтобы увидеть историю.' : 'Записей в этом разделе пока нет.';
          ui.wrap(emptyMsg, 220, 11).forEach((l, i) => ui.text(l, 486, 232 + i * 15, { align: 'center', col: C.dim, size: 11 }));
        } else if (this._tab === 0) {
          const b = g.state.bank.enemies[r.id], d = r.d;
          ui.platform(c, 486, 178, 60);
          G.drawEnemy(c, d, 486, 180, d.boss ? 120 : d.elite ? 116 : 110, { t: ui.t });
          G.foeIcon(c, d, 366, 56, 32);
          ui.text(d.boss ? 'Босс' : d.elite ? 'Элитный враг' : 'Обычный враг', 606, 64, { size: 10, align: 'right', col: d.boss ? C.gold : d.elite ? '#cfa2ff' : C.sub });
          ui.wrap(d.name, 240, 12).slice(0, 2).forEach((l, i) => ui.text(l, 486, 190 + i * 14, { align: 'center', bold: true, serif: true, col: C.gold, size: 12 }));
          c.fillStyle = C.brassDk; c.fillRect(366, 222, 240, 1);
          ui.text('Уязвимости:', 366, 232, { size: 11, col: C.sub });
          d.weak.forEach((e, i) => G.elemIcon(c, e, 454 + i * 20, 239, 7));
          ui.text('Встречен: ' + b.seen, 366, 256, { size: 11, col: '#c8d8ff' });
          ui.text('Побед: ' + b.kills, 606, 256, { size: 11, align: 'right', col: '#c8d8ff' });
          const fam = H.CONTACT[d.fam];
          if (fam) {
            ui.text('Контакт: ' + fam.name, 366, 280, { size: 11, col: C.gold });
            const known = Object.entries(b.contacts || {});
            ui.wrap(known.length ? 'Исходы: ' + known.map(([m, n]) => ({ eager: 'интерес', happy: 'радость', scared: 'страх', angry: 'злость' }[m] || m) + '×' + n).join(', ') : 'Настроения ещё не изучены.', 240, 11).forEach((l, i) => ui.text(l, 366, 300 + i * 14, { size: 11, col: C.sub }));
            if (known.length) ui.wrap('Подсказка: ' + Object.entries(fam.react).filter(([, v]) => v === 'eager' || v === 'happy').map(([t2]) => TAG_NAME[t2]).join(', '), 240, 11).forEach((l, i) => ui.text(l, 366, 336 + i * 14, { size: 11, col: C.ok }));
          } else ui.text('На контакт не идёт.', 366, 280, { size: 11, col: C.bad });
        } else if (this._tab === 1) {
          const f = r.f, known = g.state.bank.fusions.includes(r.id);
          const n = f.members.length, gap = n > 2 ? 10 : 28, cs = Math.min(68, Math.floor((236 - gap * (n - 1)) / n));
          const cx0 = 486 - (n * cs + (n - 1) * gap) / 2, cy = 62 + (68 - cs);
          f.members.forEach((m, i) => ui.portraitCard(c, G.lookOf(m, g), cx0 + i * (cs + gap), cy, cs, { elem: H.CHARS[m].elem }));
          const who = { 2: 'обоих', 3: 'всех троих', 4: 'всех четверых' }[n] || 'всех';
          ui.wrap(known ? f.name : '??? - не открыто', 240, 13).slice(0, 2).forEach((l, i) => ui.text(l, 486, 146 + i * 16, { align: 'center', bold: true, serif: true, size: 13, col: known ? C.gold : C.dim }));
          ui.text('Участники: ' + f.members.map(m => H.CHARS[m].name).join(', '), 486, 182, { align: 'center', size: 10, col: C.sub });
          c.fillStyle = C.brassDk; c.fillRect(366, 200, 240, 1);
          ui.wrap(known ? f.text : 'Возьмите ' + who + ' в команду, накопите им энергию и нажмите R в бою.', 240, 11).forEach((l, i) => ui.text(l, 366, 212 + i * 15, { size: 11, col: known ? C.cream : C.sub }));
        } else if (this._tab === 2) {
          const on = !!g.state.flags[r.r.id];
          G.menuIcon(c, 'chat', 366, 58, 28);
          ui.text(on ? 'Слух подтверждён' : 'Слух не проверен', 402, 60, { size: 10, col: on ? C.ok : C.dim });
          ui.wrap(on ? r.r.title : 'Неизвестный слух', 200, 13).slice(0, 2).forEach((l, i) => ui.text(l, 402, 74 + i * 15, { size: 13, bold: true, serif: true, col: on ? C.gold : C.dim }));
          c.fillStyle = C.brassDk; c.fillRect(366, 108, 240, 1);
          if (on) {
            ui.wrap('«' + r.r.text + '»', 240, 11).forEach((l, i) => ui.text(l, 366, 120 + i * 15, { size: 11, col: '#fff0c0' }));
            c.fillStyle = C.brassDk; c.fillRect(366, 206, 240, 1);
            ui.text('Эффект в мире:', 366, 218, { size: 11, col: C.sub });
            ui.wrap(r.r.effect, 240, 11).forEach((l, i) => ui.text(l, 366, 236 + i * 15, { size: 11, col: C.ok }));
          } else ui.wrap('Этот слух ещё не распущен. Поговорите со сплетниками в мире, чтобы узнать подробности.', 240, 11).forEach((l, i) => ui.text(l, 366, 120 + i * 15, { size: 11, col: C.dim }));
        } else if (this._tab === 4) {
          G.menuIcon(c, 'archive', 366, 58, 28);
          ui.text('Запись ' + r.right, 402, 60, { size: 10, col: C.sub });
          ui.wrap(r.x.title, 200, 13).slice(0, 2).forEach((l, i) => ui.text(l, 402, 74 + i * 15, { size: 13, bold: true, serif: true, col: C.gold }));
          c.fillStyle = C.brassDk; c.fillRect(366, 108, 240, 1);
          ui.wrap(r.x.text, 240, 11).forEach((l, i) => ui.text(l, 366, 120 + i * 15, { size: 11 }));
        } else {
          const e = r.e, [note, ncol] = warpNote(e);
          if (e.kind === 'char') ui.portraitCard(c, G.lookOf(e.id, g), 450, 62, 72, { elem: H.CHARS[e.id].elem, border: G.RARITY[e.rar] });
          else G.drawConeCard(c, e.id, 456, 60, 60, 84);
          ui.wrap(warpName(e), 240, 13).slice(0, 2).forEach((l, i) => ui.text(l, 486, 154 + i * 16, { align: 'center', bold: true, serif: true, size: 13, col: RAR_TXT[e.rar] }));
          ui.text('★'.repeat(e.rar), 486, 190, { align: 'center', col: G.RARITY[e.rar] });
          c.fillStyle = C.brassDk; c.fillRect(366, 210, 240, 1);
          [['Прыжок №', String(e.n)], ['Итог', note, ncol], ['Гарант', warpPity(e)], ['Время', warpWhen(e)]].forEach(([k2, v, vc], i) => {
            ui.text(k2, 366, 224 + i * 22, { size: 11, col: C.sub });
            ui.text(v, 606, 224 + i * 22, { size: 11, align: 'right', col: vc || C.cream });
          });
          ui.button(366, 392, 240, 26, 'Вся история · Enter', () => ui.openWarpHistory(e.ban), { size: 11, icon: 'warp', active: true });
        }
        const hints = [['Q/E', 'Раздел'], ['←→', 'Раздел'], ['↑↓', 'Выбор'], ['H', 'Астролябия']];
        if (this._tab === 3 && rows.length) hints.push(['Enter', 'Вся история']);
        hints.push(['Esc', 'Закрыть']);
        ui.hints(hints, 20, HGT - 18);
      },
      draw(c) {
        if (this.mode === 'hub') return this.drawHub(c);
        if (this.mode === 'tabs') return this.drawTabs(c);
        if (['aeons', 'factions', 'terms'].includes(this.sec)) return this.drawEncyclopediaSec(c);
        return this.drawCombatOrItemSec(c);
      },
      key(k, code) {
        if (this.mode === 'hub') {
          if (k === 'right' || k === 'down') { this.hubSel = (this.hubSel + 1) % ASTRO_NODES.length; ui.sfx('move'); return; }
          if (k === 'left' || k === 'up') { this.hubSel = (this.hubSel + ASTRO_NODES.length - 1) % ASTRO_NODES.length; ui.sfx('move'); return; }
          if (code === 'KeyB') { ui.sfx('select'); ui.openBookshelf(null); return; }
          if (code === 'KeyH') { this.setTab(0); ui.sfx('select'); return; }
          if (k === 'ok') { ui.sfx('select'); this.openSection(ASTRO_NODES[this.hubSel].id, null, false); return; }
          if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); if (close) close(); return; }
          return;
        }
        if (this.mode === 'sec') {
          const items = this.secItems();
          if (k === 'up' || k === 'down' || code === 'PageUp' || code === 'PageDown') {
            if (ui.listNav(this, k, items.length)) {
              this.bodySc.top = 0;
              this.markCurrentSeen();
              return;
            }
          }
          if (['aeons', 'factions', 'terms'].includes(this.sec)) {
            const cur = items[this.sel];
            if (cur && cur.unlocked && cur.entry && cur.entry.related) {
              const idx = code === 'Digit1' ? 0 : code === 'Digit2' ? 1 : code === 'Digit3' ? 2 : -1;
              if (idx >= 0 && cur.entry.related[idx]) {
                const rel = H.DB.findEntry(cur.entry.related[idx]);
                if (rel) { ui.sfx('select'); this.openSection(rel.sec, rel.entry.id, true); return; }
              }
            }
          } else {
            if (code === 'KeyF' && (this.sec === 'chars' || this.sec === 'cones' || this.sec === 'foes')) {
              const filters = this.sec === 'foes' ? FOE_FILTERS : PATH_FILTERS;
              this.filterIdx = (this.filterIdx + 1) % filters.length;
              this.sel = 0; this.sc.top = 0; ui.sfx('select'); return;
            }
            if (code === 'KeyR' && this.sec === 'cones') {
              this.coneRank = (this.coneRank % 5) + 1; ui.sfx('select'); return;
            }
            if (k === 'left' || k === 'right') {
              if (this.sec === 'relics') { this.relicSlot = (this.relicSlot + (k === 'right' ? 1 : 3)) % 4; ui.sfx('move'); return; }
              const maxSub = this.sec === 'chars' ? 4 : this.sec === 'foes' ? 3 : 1;
              if (maxSub > 1) { this.subTab = (this.subTab + (k === 'right' ? 1 : maxSub - 1)) % maxSub; this.bodySc.top = 0; ui.sfx('move'); return; }
            }
            if (k === 'ok') {
              const cur = items[this.sel];
              if (this.sec === 'chars' && cur && cur.owned && ui.openChars) { ui.sfx('select'); ui.openChars(cur.id); return; }
              if (this.sec === 'cones' && cur && ui.openConeView) { ui.sfx('select'); ui.openConeView(cur.id); return; }
            }
          }
          if (k === 'back') { this.stepBack(); return; }
          return;
        }
        const rows = this.rows(), n = BANK_TABS.length;
        if (code === 'KeyH') { this.mode = 'hub'; ui.sfx('select'); return; }
        if (ui.listNav(this, k, rows.length)) return;
        if (k === 'left' || code === 'KeyQ') { this.setTab((this._tab + n - 1) % n); ui.sfx('select'); return; }
        if (k === 'right' || code === 'KeyE') { this.setTab((this._tab + 1) % n); ui.sfx('select'); return; }
        if (k === 'ok' && this._tab === 3 && rows.length) { ui.openWarpHistory(rows[this.sel].e.ban); return; }
        if (k === 'back' || (k === 'ok' && !rows.length)) { ui.screens.pop(); ui.sfx('cancel'); if (close) close(); }
      }
    };

    if (startMode === 'sec') scr.openSection(startSec, initEntry, false);
    this.push(scr);
  }

  const BOOK_FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'got', label: 'Собранные' },
    { id: 'missing', label: 'Несобранные' },
    { id: 'new', label: 'Новые' }
  ];

  function openBookshelf(close, initWorld, initSeries) {
    const ui = this, g = this.game;
    H.DB.sync(g);
    let startW = 0;
    if (initWorld) {
      const wi = H.BOOK_WORLDS.findIndex(w => w.id === initWorld);
      if (wi >= 0) startW = wi;
    }

    const scr = {
      full: true,
      worldIdx: startW,
      filterIdx: 0,
      sel: 0,
      volIdx: 0,
      rowTop: 0,
      world() { return H.BOOK_WORLDS[this.worldIdx] || H.BOOK_WORLDS[0]; },
      seriesList() {
        const w = this.world(), flt = BOOK_FILTERS[this.filterIdx].id;
        return H.BOOK_SERIES.filter(sr => {
          if (sr.world !== w.id) return false;
          const p = H.DB.seriesProgress(g, sr);
          if (flt === 'got') return p.got > 0;
          if (flt === 'missing') return p.got < p.total;
          if (flt === 'new') return p.hasNew;
          return true;
        });
      },
      selectSeries(idx) {
        const list = this.seriesList();
        this.sel = Math.max(0, Math.min(idx, Math.max(0, list.length - 1)));
        const sr = list[this.sel];
        this.volIdx = 0;
        if (sr) {
          const firstGot = sr.vols.findIndex(v => H.DB.isDocCollected(g, v.id));
          if (firstGot >= 0) this.volIdx = firstGot;
        }
      },
      readCurrent() {
        const list = this.seriesList(), sr = list[this.sel];
        if (!sr) return;
        const vol = sr.vols[this.volIdx] || sr.vols[0];
        if (!vol) return;
        if (!H.DB.isDocCollected(g, vol.id)) {
          const firstGot = sr.vols.findIndex(v => H.DB.isDocCollected(g, v.id));
          if (firstGot < 0) { ui.sfx('deny'); ui.toast('Эта книга ещё не найдена: ' + (vol.where || 'исследуйте мир')); return; }
          this.volIdx = firstGot;
        }
        const targetVol = sr.vols[this.volIdx];
        const b = H.DB.sync(g);
        b.booksSeen[targetVol.id] = true;
        const collectedVols = sr.vols.filter(v => H.DB.isDocCollected(g, v.id));
        ui.openDoc(targetVol.id, null, { series: sr, vols: collectedVols });
      },
      draw(c) {
        drawAstrolabeBg(c, ui, false);
        const lx = ui.left, rx = ui.right, vw = ui.vw;
        const wObj = this.world(), wCounts = H.DB.worldBookCounts(g, wObj.id);

        c.fillStyle = '#e0c078';
        for (let i = 0; i < 3; i++) {
          c.fillRect(lx + 18, 12 + i * 7, 16, 5);
          c.fillStyle = '#182238';
          c.fillRect(lx + 20, 13 + i * 7, 11, 3);
          c.fillStyle = '#e0c078';
        }
        ui.text('Книги', lx + 40, 9, { size: 9, col: '#c8b080' });
        ui.text(wObj.name, lx + 40, 20, { size: 13, bold: true, col: '#f2efe6' });

        const tabGap = 42, tabsW = (H.BOOK_WORLDS.length - 1) * tabGap;
        const tabStartX = Math.round(lx + vw * 0.45 - tabsW / 2);
        H.BOOK_WORLDS.forEach((wo, wi) => {
          const tx = tabStartX + wi * tabGap, ty = 23;
          const active = wi === this.worldIdx;
          const wc = H.DB.worldBookCounts(g, wo.id);
          drawWorldTabIcon(c, wo.crest, tx, ty, 14, active);
          if (wc.hasNew) drawStar4(c, tx + 11, ty - 11, 4, '#ffe28a');
          ui.hit(tx - 16, ty - 16, 32, 34, () => {
            this.worldIdx = wi;
            this.rowTop = 0;
            this.selectSeries(0);
            ui.sfx('select');
          });
        });

        ui.closeBtn(W - 32, 10, () => this.key('back'));

        const cols = vw > 700 ? 5 : 4;
        const cardW = 88, cardH = 114, gapX = 10, gapY = 10;
        const gridX = lx + 18, gridY = 52;
        const gridW = cols * cardW + (cols - 1) * gapX;
        const visRows = 3, gridH = visRows * cardH + (visRows - 1) * gapY;

        const list = this.seriesList();
        if (this.sel >= list.length) this.sel = Math.max(0, list.length - 1);
        const totalRows = Math.max(1, Math.ceil(list.length / cols));
        const curRow = Math.floor(this.sel / cols);
        if (curRow < this.rowTop) this.rowTop = curRow;
        if (curRow >= this.rowTop + visRows) this.rowTop = curRow - visRows + 1;
        this.rowTop = Math.max(0, Math.min(this.rowTop, Math.max(0, totalRows - visRows)));

        for (let r = 0; r < visRows; r++) {
          const rowIdx = this.rowTop + r;
          for (let col = 0; col < cols; col++) {
            const idx = rowIdx * cols + col;
            if (idx >= list.length) continue;
            const sr = list[idx], p = H.DB.seriesProgress(g, sr);
            const cx = gridX + col * (cardW + gapX), cy = gridY + r * (cardH + gapY);
            const on = idx === this.sel;

            c.fillStyle = p.got > 0 ? 'rgba(22, 30, 50, 0.88)' : 'rgba(14, 18, 32, 0.65)';
            c.fillRect(cx, cy, cardW, cardH);

            c.save();
            if (p.got === 0) c.globalAlpha = 0.42;
            drawBookItemIcon(c, sr.icon, cx + 6, cy + 4, cardW - 12, 64);
            c.restore();

            ui.text('Собрано: ' + p.got + '/' + p.total, cx + Math.round(cardW / 2), cy + 68, {
              size: 8, bold: true, align: 'center',
              col: p.got === p.total ? '#d8b068' : p.got > 0 ? '#b8c4dc' : '#6c768c'
            });

            c.fillStyle = on ? '#f5f2ea' : p.got > 0 ? '#dedad0' : '#8e94a0';
            c.fillRect(cx + 2, cy + 82, cardW - 4, 30);
            const tLines = ui.wrap(sr.title, cardW - 10, 8).slice(0, 2);
            if (tLines.length === 1) {
              ui.text(tLines[0], cx + Math.round(cardW / 2), cy + 92, { size: 8, bold: true, align: 'center', col: '#1c202b', shadow: false });
            } else {
              ui.text(tLines[0], cx + Math.round(cardW / 2), cy + 86, { size: 8, bold: true, align: 'center', col: '#1c202b', shadow: false });
              ui.text(tLines[1], cx + Math.round(cardW / 2), cy + 97, { size: 8, bold: true, align: 'center', col: '#1c202b', shadow: false });
            }

            if (p.hasNew) drawNewBadge(c, ui, cx + cardW - 35, cy + 2);

            if (on) {
              c.strokeStyle = '#ffffff';
              c.lineWidth = 2;
              c.strokeRect(cx - 1, cy - 1, cardW + 2, cardH + 2);
              c.lineWidth = 1;
            } else {
              c.strokeStyle = 'rgba(180, 192, 216, 0.28)';
              c.strokeRect(cx + 0.5, cy + 0.5, cardW - 1, cardH - 1);
            }

            ui.hit(cx, cy, cardW, cardH, () => {
              if (this.sel === idx) {
                this.readCurrent();
              } else {
                this.selectSeries(idx);
                ui.sfx('select');
              }
            });
          }
        }

        if (totalRows > visRows) {
          const sbX = gridX + gridW + 4, maxR = totalRows - visRows;
          const thH = Math.max(24, Math.round(gridH * visRows / totalRows));
          const thY = gridY + Math.round((gridH - thH) * (this.rowTop / maxR));
          c.fillStyle = 'rgba(255,255,255,0.12)';
          c.fillRect(sbX, gridY, 3, gridH);
          c.fillStyle = '#d8dde8';
          c.fillRect(sbX, thY, 3, thH);
        }
        ui.wheelZone(gridX, gridY, gridW, gridH, dir => {
          this.rowTop = Math.max(0, Math.min(Math.max(0, totalRows - visRows), this.rowTop + (dir > 0 ? 1 : -1)));
        });

        const paneX = gridX + gridW + 14, paneW = rx - 16 - paneX;
        c.fillStyle = 'rgba(180, 195, 225, 0.25)';
        c.fillRect(paneX, gridY, 1, gridH);
        c.fillStyle = '#e6c173';
        c.fillRect(paneX, gridY, 2, 16);
        drawWatermark(c, paneX + paneW - 48, gridY + gridH - 48, 48, 0.07);

        const sr = list[this.sel];
        if (sr) {
          const p = H.DB.seriesProgress(g, sr), px = paneX + 12, pw = paneW - 16;
          const headLines = ui.wrap(sr.title, pw, 12).slice(0, 2);
          headLines.forEach((hl, hi) => ui.text(hl, px, gridY + hi * 15, { size: 12, bold: true, col: '#f2efe6' }));
          const sy = gridY + headLines.length * 15 + 4;
          ui.text('Собрано: ' + p.got + '/' + p.total, px, sy, { size: 10, bold: true, col: '#d8b068' });

          let dy = sy + 20;
          ui.wrap(sr.desc, pw, 10).slice(0, 6).forEach(dl => {
            ui.text(dl, px, dy, { size: 10, col: '#cfd6e6' });
            dy += 14;
          });

          dy += 8;
          c.fillStyle = 'rgba(180, 195, 225, 0.2)';
          c.fillRect(px, dy, pw, 1);
          dy += 6;

          const maxVols = Math.min(7, sr.vols.length);
          for (let vi = 0; vi < maxVols; vi++) {
            const v = sr.vols[vi], got = H.DB.isDocCollected(g, v.id), vOn = vi === this.volIdx;
            const vy = dy + vi * 20;
            if (vy + 18 > gridY + gridH) break;
            c.fillStyle = vOn ? 'rgba(230, 198, 130, 0.22)' : 'rgba(18, 26, 46, 0.65)';
            c.fillRect(px, vy, pw, 18);
            const vTxt = (got ? '✓ ' : '· ') + v.label;
            ui.text(ui.fitText(vTxt, 9, pw - 8, vOn), px + 4, vy + 3, {
              size: 9, bold: vOn,
              col: got ? (vOn ? '#fff2c6' : '#dce2ee') : '#7c869c'
            });
            ui.hit(px, vy, pw, 18, () => {
              this.volIdx = vi;
              ui.sfx('select');
            });
          }
        } else {
          ui.text('Нет книг по фильтру.', paneX + Math.round(paneW / 2), gridY + 140, { size: 10, align: 'center', col: '#7c869c' });
        }

        const botY = HGT - 36;
        const curFlt = BOOK_FILTERS[this.filterIdx];
        ui.button(lx + 18, botY, 132, 24, 'Фильтр: ' + curFlt.label, () => {
          this.filterIdx = (this.filterIdx + 1) % BOOK_FILTERS.length;
          this.rowTop = 0;
          this.selectSeries(0);
          ui.sfx('select');
        }, { size: 9 });

        const readW = 148, readX = rx - 16 - readW;
        ui.text('Собрано: ' + wCounts.got + '/' + wCounts.total, readX - 12, botY + 6, { size: 10, align: 'right', col: '#dce2ee' });

        const canRead = sr && H.DB.seriesProgress(g, sr).got > 0;
        c.fillStyle = canRead ? '#e8e5dc' : 'rgba(60, 68, 86, 0.6)';
        c.fillRect(readX, botY, readW, 24);
        c.strokeStyle = canRead ? '#ffffff' : '#58627a';
        c.strokeRect(readX + 0.5, botY + 0.5, readW - 1, 23);
        ui.text('Читать', readX + Math.round(readW / 2), botY + 5, {
          size: 11, bold: true, align: 'center',
          col: canRead ? '#181c26' : '#8892a8', shadow: false
        });
        ui.hit(readX, botY, readW, 24, () => this.readCurrent());
      },
      key(k, code) {
        const list = this.seriesList(), cols = ui.vw > 700 ? 5 : 4;
        if (code === 'KeyQ') {
          this.worldIdx = (this.worldIdx + H.BOOK_WORLDS.length - 1) % H.BOOK_WORLDS.length;
          this.rowTop = 0; this.selectSeries(0); ui.sfx('select'); return;
        }
        if (code === 'KeyE') {
          this.worldIdx = (this.worldIdx + 1) % H.BOOK_WORLDS.length;
          this.rowTop = 0; this.selectSeries(0); ui.sfx('select'); return;
        }
        if (code === 'KeyF') {
          this.filterIdx = (this.filterIdx + 1) % BOOK_FILTERS.length;
          this.rowTop = 0; this.selectSeries(0); ui.sfx('select'); return;
        }
        if (k === 'right' && list.length) { this.selectSeries((this.sel + 1) % list.length); ui.sfx('move'); return; }
        if (k === 'left' && list.length) { this.selectSeries((this.sel + list.length - 1) % list.length); ui.sfx('move'); return; }
        if (k === 'down' && list.length) { this.selectSeries(Math.min(list.length - 1, this.sel + cols)); ui.sfx('move'); return; }
        if (k === 'up' && list.length) { this.selectSeries(Math.max(0, this.sel - cols)); ui.sfx('move'); return; }
        if (k === 'ok') { this.readCurrent(); return; }
        if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); if (close) close(); }
      }
    };

    if (initSeries) {
      const idx = scr.seriesList().findIndex(s => s.id === initSeries);
      if (idx >= 0) scr.selectSeries(idx);
    } else {
      scr.selectSeries(0);
    }
    this.push(scr);
  }

  const DOC_LOOK = {
    paper: { bg: '#efe6cf', edge: '#c8b48a', ink: '#2a2018', head: '#6a2a1a', rule: 'rgba(90,70,40,0.18)' },
    book: { bg: '#e8dcc0', edge: '#8a5a3a', ink: '#2a1e14', head: '#5a2a5a', rule: 'rgba(90,60,40,0.12)' },
    screen: { bg: '#081a30', edge: '#2a6aa8', ink: '#a8e0ff', head: '#ffd890', rule: 'rgba(86,212,255,0.08)' }
  };

  function docLines(ui, text, width, size) {
    const out = [];
    for (const para of String(text).split('\n')) {
      if (!para.trim()) { out.push({ t: '' }); continue; }
      const center = para.startsWith('^'), right = para.startsWith('>');
      const body = center || right ? para.slice(1) : para;
      for (const l of ui.wrap(body, width, size)) out.push({ t: l, align: center ? 'center' : right ? 'right' : 'left' });
    }
    return out;
  }

  function openDoc(id, close, opts) {
    const ui = this;
    const vols = opts && Array.isArray(opts.vols) && opts.vols.length > 1 ? opts.vols : null;
    let curId = id, volIdx = vols ? Math.max(0, vols.findIndex(v => v.id === id)) : 0;
    const markDoc = docId => {
      if (ui.game && ui.game.state && ui.game.state.flags && (H.DOCS || {})[docId]) {
        ui.game.state.flags['doc_' + docId] = true;
        const b = H.DB.sync(ui.game);
        b.booksSeen[docId] = true;
      }
    };
    const bw = 470, bh = 380, bx = (W - bw) / 2, by = 40, pad = 26, size = 12, lh = 17, view = Math.floor((bh - 90) / lh);
    let d, L, screen, lines, maxTop;
    const loadVol = docId => {
      curId = docId;
      markDoc(curId);
      d = (H.DOCS || {})[curId] || { title: '...', text: '' };
      L = DOC_LOOK[d.kind] || DOC_LOOK.paper;
      screen = d.kind === 'screen';
      lines = docLines(ui, ui.game && ui.game.fill ? ui.game.fill(d.text) : d.text, bw - pad * 2, size);
      maxTop = Math.max(0, lines.length - view);
    };
    loadVol(curId);
    ui.sfx('select');
    this.push({
      top: 0,
      docId: curId,
      switchVol(delta) {
        if (!vols) return;
        volIdx = (volIdx + delta + vols.length) % vols.length;
        loadVol(vols[volIdx].id);
        this.docId = curId;
        this.top = 0;
        ui.sfx('select');
      },
      draw(c) {
        c.fillStyle = 'rgba(2,3,10,0.66)'; c.fillRect(0, 0, W, HGT);
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(bx + 6, by + 6, bw, bh);
        c.fillStyle = L.edge; c.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
        c.fillStyle = L.bg; c.fillRect(bx, by, bw, bh);
        if (screen) {
          c.fillStyle = 'rgba(86,212,255,0.05)';
          for (let y = by; y < by + bh; y += 3) c.fillRect(bx, y, bw, 1);
          c.fillStyle = '#2a6aa8'; c.fillRect(bx, by, bw, 18);
          ui.text('ТЕРМИНАЛ КОСМИЧЕСКОЙ СТАНЦИИ «ГЕРТА»', bx + 10, by + 3, { size: 10, bold: true, col: '#e8f6ff', shadow: false });
        } else {
          for (let y = by + 72; y < by + bh - 20; y += lh) { c.fillStyle = L.rule; c.fillRect(bx + pad - 6, y + lh - 3, bw - pad * 2 + 12, 1); }
          if (d.kind === 'book') { c.fillStyle = 'rgba(60,30,20,0.25)'; c.fillRect(bx, by, 10, bh); }
        }
        ui.text(d.title, bx + bw / 2, by + (screen ? 28 : 18), { align: 'center', size: 15, bold: true, serif: !screen, col: L.head, shadow: false });
        if (d.sub) ui.text(d.sub, bx + bw / 2, by + (screen ? 48 : 40), { align: 'center', size: 10, col: screen ? '#6aa8d0' : '#7a6a50', shadow: false });
        c.fillStyle = L.head; c.globalAlpha = 0.5; c.fillRect(bx + pad, by + 60, bw - pad * 2, 1); c.globalAlpha = 1;
        lines.slice(this.top, this.top + view).forEach((l, i) => {
          const x = l.align === 'center' ? bx + bw / 2 : l.align === 'right' ? bx + bw - pad : bx + pad;
          ui.text(l.t, x, by + 70 + i * lh, { align: l.align, size, serif: !screen, col: L.ink, shadow: false });
        });
        if (maxTop) {
          const tx = bx + bw - 10, th = bh - 90, kh = Math.max(16, th * view / lines.length), ky = by + 70 + (th - kh) * this.top / maxTop;
          c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(tx, by + 70, 3, th);
          c.fillStyle = L.head; c.fillRect(tx, ky, 3, kh);
        }
        const hintList = maxTop ? [['↑↓', 'Листать']] : [];
        if (vols) hintList.push(['Q/E', 'Том ' + (volIdx + 1) + '/' + vols.length]);
        hintList.push(['Esc', 'Закрыть']);
        ui.hints(hintList, W / 2, by + bh + 14, { align: 'center' });
        ui.wheelZone(bx, by, bw, bh, s => this.key(s > 0 ? 'down' : 'up'));
        ui.hit(0, 0, W, HGT, () => this.key(this.top < maxTop ? 'down' : 'back'));
      },
      key(k, code) {
        if (vols && code === 'KeyQ') { this.switchVol(-1); return; }
        if (vols && code === 'KeyE') { this.switchVol(1); return; }
        if (k === 'up' || k === 'left') { this.top = Math.max(0, this.top - (k === 'left' ? view : 3)); return; }
        if (k === 'down' || k === 'right') {
          if (this.top >= maxTop && k === 'down') return;
          this.top = Math.min(maxTop, this.top + (k === 'right' ? view : 3));
          return;
        }
        if (k === 'ok' && this.top < maxTop) { this.top = Math.min(maxTop, this.top + view); return; }
        if (k === 'back' || k === 'ok') { ui.screens.pop(); ui.sfx('cancel'); if (close) close(); }
      }
    });
  }

  if (H.UI) {
    Object.assign(H.UI.prototype, { openBank, openBookshelf, openDoc });
  }
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
