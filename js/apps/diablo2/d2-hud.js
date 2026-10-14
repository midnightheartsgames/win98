(function (D) {
  'use strict';
  const { W, H, SKILLS, COL, FONT } = D;
  const TAU = Math.PI * 2;
  const mk = (w, h) => D.Terrain.mk(w, h);

  const L = {
    barY: 553,
    lorb: { x: 72, y: 546, r: 43 }, rorb: { x: 728, y: 546, r: 43 },
    lskill: { x: 120, y: 553, w: 48, h: 47 }, rskill: { x: 632, y: 553, w: 48, h: 47 },
    run: { x: 175, y: 579, w: 18, h: 18 }, stam: { x: 197, y: 582, w: 112, h: 11 }, xp: { x: 175, y: 563, w: 134, h: 7 },
    minibtn: { x: 386, y: 567, w: 28, h: 28 }, belt: { x: 434, y: 566, s: 31 },
    mini: { x: 296, y: 527, w: 208, h: 26 },
    lvlStat: { x: 124, y: 505, w: 42, h: 42 }, lvlSkill: { x: 636, y: 505, w: 42, h: 42 }
  };

  function stoneTex(w, h, base, seed) {
    const cv = mk(w, h);
    const c = cv.getContext('2d');
    const img = c.createImageData(w, h);
    const [r0, g0, b0] = D.rgb(base);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = D.fbm(x * 0.06, y * 0.06, seed || 3, 4) * 0.7 + D.hash2(x, y, seed || 3) * 0.3;
      const crack = Math.abs(D.fbm(x * 0.03 + 40, y * 0.03, (seed || 3) + 9, 3) - 0.5) < 0.012 ? 0.55 : 1;
      const k = (0.6 + n * 0.6) * crack;
      const i = (y * w + x) * 4;
      img.data[i] = r0 * k; img.data[i + 1] = g0 * k; img.data[i + 2] = b0 * k; img.data[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    return cv;
  }

  function bevel(c, x, y, w, h, light, dark, t) {
    t = t || 2;
    c.fillStyle = light; c.fillRect(x, y, w, t); c.fillRect(x, y, t, h);
    c.fillStyle = dark; c.fillRect(x, y + h - t, w, t); c.fillRect(x + w - t, y, t, h);
  }

  function frame(c, x, y, w, h) {
    c.strokeStyle = '#2a2418'; c.lineWidth = 3; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    c.strokeStyle = '#8a7650'; c.lineWidth = 1; c.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    c.strokeStyle = '#3a3020'; c.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
  }

  function text(c, s, x, y, col, size, align, bold) {
    c.font = (bold ? 'bold ' : '') + (size || 13) + 'px ' + FONT;
    c.textAlign = align || 'left';
    c.fillStyle = '#000';
    c.fillText(s, x + 1, y + 1);
    c.fillStyle = col || COL.white;
    c.fillText(s, x, y);
  }

  function wrap(c, s, maxW) {
    const out = [];
    for (const para of String(s).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
      }
      out.push(line);
    }
    return out;
  }

  let BAR = null;
  function barImage() {
    if (BAR) return BAR;
    const cv = mk(W, 120);
    const c = cv.getContext('2d');
    const y0 = 120 - 47;
    const st = stoneTex(W, 47, '#5a544c', 11);
    c.drawImage(st, 0, y0);
    const g = c.createLinearGradient(0, y0, 0, 120);
    g.addColorStop(0, 'rgba(255,240,210,0.18)'); g.addColorStop(0.2, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.4)');
    c.fillStyle = g; c.fillRect(0, y0, W, 47);
    c.fillStyle = '#1a1612'; c.fillRect(0, y0, W, 2);
    c.fillStyle = '#8a7a5a'; c.fillRect(0, y0 + 2, W, 1);
    for (const x of [L.lskill.x - 4, L.rskill.x + L.rskill.w + 1, 170, 314, 380, 420, 560, 626]) { c.fillStyle = '#1a1612'; c.fillRect(x, y0 + 3, 3, 44); c.fillStyle = '#7a6a4a'; c.fillRect(x + 3, y0 + 3, 1, 44); }
    for (const [x, y] of [[180, y0 + 8], [300, y0 + 8], [560, y0 + 8], [412, y0 + 8]]) { D.Sprites.ball(c, { x, y }, 2.5, '#8a7a5a'); }
    statue(c, 0, 0, false);
    statue(c, W, 0, true);
    orbFrame(c, L.lorb.x, L.lorb.y - (H - 120), L.lorb.r);
    orbFrame(c, L.rorb.x, L.rorb.y - (H - 120), L.rorb.r);
    c.fillStyle = '#0a0806';
    c.fillRect(L.belt.x - 4, L.belt.y - (H - 120) - 3, L.belt.s * 4 + 6, L.belt.s + 5);
    for (let i = 0; i < 4; i++) { const x = L.belt.x + i * L.belt.s, y = L.belt.y - (H - 120); c.fillStyle = '#16120e'; c.fillRect(x, y, 29, 29); bevel(c, x, y, 29, 29, '#050404', '#4a4032', 1); }
    const dark = (r) => { c.fillStyle = '#0a0806'; c.fillRect(r.x - 2, r.y - (H - 120) - 2, r.w + 4, r.h + 4); };
    dark(L.lskill); dark(L.rskill);
    c.fillStyle = '#0a0806'; c.fillRect(L.stam.x - 2, L.stam.y - (H - 120) - 2, L.stam.w + 4, L.stam.h + 4);
    c.fillRect(L.xp.x - 1, L.xp.y - (H - 120) - 1, L.xp.w + 2, L.xp.h + 2);
    BAR = cv;
    return cv;
  }

  function orbFrame(c, x, y, r) {
    const g = c.createRadialGradient(x, y, r - 4, x, y, r + 10);
    g.addColorStop(0, '#2a2620'); g.addColorStop(0.4, '#8a806c'); g.addColorStop(0.7, '#4a443a'); g.addColorStop(1, '#1a1814');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r + 9, 0, TAU); c.fill();
    c.fillStyle = '#050404'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }

  function statue(c, x, y, demon) {
    const s = demon ? -1 : 1;
    c.save();
    c.translate(x, y);
    c.scale(s, 1);
    const stone = (x0, y0, x1, y1) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#9a948a'); g.addColorStop(0.5, '#6a645c'); g.addColorStop(1, '#2e2a26'); return g; };
    c.fillStyle = stone(0, 30, 44, 120);
    c.beginPath();
    c.moveTo(0, 120); c.lineTo(0, 60); c.quadraticCurveTo(6, 40, 16, 34);
    c.lineTo(22, 20); c.quadraticCurveTo(30, 12, 34, 24); c.lineTo(32, 38);
    c.quadraticCurveTo(46, 50, 42, 78); c.lineTo(44, 120); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; c.stroke();
    if (!demon) {
      c.fillStyle = stone(0, 0, 30, 80);
      c.beginPath(); c.moveTo(12, 42); c.quadraticCurveTo(-8, 10, 4, 0); c.quadraticCurveTo(10, 24, 20, 40); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.4)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(4 + i * 3, 8 + i * 8); c.lineTo(14 + i, 36); c.stroke(); }
      D.Sprites.ball(c, { x: 28, y: 22 }, 7, '#8a847a');
    } else {
      D.Sprites.ball(c, { x: 28, y: 24 }, 8, '#7a746a');
      c.fillStyle = '#5a544c';
      c.beginPath(); c.moveTo(23, 18); c.quadraticCurveTo(12, 6, 18, -2); c.quadraticCurveTo(20, 10, 27, 16); c.fill();
      c.beginPath(); c.moveTo(32, 18); c.quadraticCurveTo(44, 4, 40, -4); c.quadraticCurveTo(38, 10, 30, 16); c.fill();
      c.fillStyle = '#d02010'; c.fillRect(24, 22, 2, 2); c.fillRect(30, 22, 2, 2);
    }
    c.restore();
  }

  function drawOrb(c, o, frac, col, t) {
    c.save();
    c.beginPath(); c.arc(o.x, o.y, o.r, 0, TAU); c.clip();
    const top = o.y + o.r - frac * o.r * 2;
    const g = c.createRadialGradient(o.x - o.r * 0.3, o.y - o.r * 0.3, 2, o.x, o.y, o.r * 1.1);
    g.addColorStop(0, D.shade(col, 0.4)); g.addColorStop(0.6, col); g.addColorStop(1, D.shade(col, -0.7));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(o.x - o.r, o.y + o.r);
    for (let x = -o.r; x <= o.r; x += 4) c.lineTo(o.x + x, top + Math.sin(x * 0.15 + t * 3) * 1.5);
    c.lineTo(o.x + o.r, o.y + o.r);
    c.closePath(); c.fill();
    c.restore();
    const hg = c.createRadialGradient(o.x - o.r * 0.35, o.y - o.r * 0.45, 1, o.x - o.r * 0.2, o.y - o.r * 0.3, o.r * 0.7);
    hg.addColorStop(0, 'rgba(255,255,255,0.55)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = hg; c.beginPath(); c.arc(o.x, o.y, o.r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(o.x - o.r * 0.1, o.y - o.r * 0.05, 2.5, 0, TAU); c.fill();
  }

  function inR(mx, my, r) { return mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h; }
  function inCircle(mx, my, o) { return Math.hypot(mx - o.x, my - o.y) <= o.r; }

  const MINI_BTNS = [['char', 'Персонаж (C)'], ['inv', 'Инвентарь (I)'], ['skills', 'Навыки (T)'], ['party', 'Отряд (P)'], ['map', 'Карта (Tab)'], ['msg', 'Сообщения (M)'], ['quest', 'Задания (Q)'], ['menu', 'Меню (Esc)']];

  function drawBar(ui, c, g) {
    const h = g.hero, ch = g.char;
    c.drawImage(barImage(), 0, H - 120);
    drawOrb(c, L.lorb, h.hpMax ? Math.max(0, h.hp / h.hpMax) : 0, h.fx.poison ? '#30a018' : '#b01010', ui.t);
    drawOrb(c, L.rorb, h.mpMax ? Math.max(0, h.mp / h.mpMax) : 0, '#1a28c0', ui.t + 1);
    if (inCircle(ui.mx, ui.my, L.lorb)) tipBox(c, 'Жизнь: ' + Math.max(0, Math.round(h.hp)) + ' / ' + h.hpMax, L.lorb.x + 30, L.lorb.y - 60);
    if (inCircle(ui.mx, ui.my, L.rorb)) tipBox(c, 'Мана: ' + Math.round(h.mp) + ' / ' + h.mpMax, L.rorb.x - 30, L.rorb.y - 60);
    skillBtn(c, L.lskill, ch.left, g, ui);
    skillBtn(c, L.rskill, ch.right, g, ui);
    c.fillStyle = ch.runOn ? '#6a5a30' : '#3a3228';
    c.fillRect(L.run.x, L.run.y, L.run.w, L.run.h);
    bevel(c, L.run.x, L.run.y, L.run.w, L.run.h, '#9a8a60', '#1a140c', 1);
    c.strokeStyle = '#e0d0a0'; c.lineWidth = 1.5;
    c.beginPath();
    if (ch.runOn) { c.moveTo(L.run.x + 5, L.run.y + 13); c.lineTo(L.run.x + 9, L.run.y + 5); c.lineTo(L.run.x + 13, L.run.y + 13); c.moveTo(L.run.x + 8, L.run.y + 9); c.lineTo(L.run.x + 14, L.run.y + 8); }
    else { c.moveTo(L.run.x + 7, L.run.y + 14); c.lineTo(L.run.x + 9, L.run.y + 5); c.lineTo(L.run.x + 11, L.run.y + 14); }
    c.stroke();
    const sf = h.spMax ? h.sp / h.spMax : 0;
    const sg = c.createLinearGradient(0, L.stam.y, 0, L.stam.y + L.stam.h);
    sg.addColorStop(0, sf < 0.25 ? '#d04020' : '#e8c040'); sg.addColorStop(1, sf < 0.25 ? '#6a1a08' : '#806010');
    c.fillStyle = sg; c.fillRect(L.stam.x, L.stam.y, L.stam.w * sf, L.stam.h);
    const cur = D.xpFor(ch.level), nxt = D.xpFor(ch.level + 1);
    const xf = ch.level >= 99 ? 1 : (ch.xp - cur) / Math.max(1, nxt - cur);
    c.fillStyle = '#c8b870'; c.fillRect(L.xp.x, L.xp.y, L.xp.w * D.clamp(xf, 0, 1), L.xp.h);
    for (let i = 1; i < 10; i++) { c.fillStyle = '#0a0806'; c.fillRect(L.xp.x + L.xp.w * i / 10, L.xp.y, 1, L.xp.h); }
    if (inR(ui.mx, ui.my, L.stam)) tipBox(c, 'Выносливость: ' + Math.round(h.sp) + ' / ' + h.spMax, L.stam.x + L.stam.w / 2, L.stam.y - 14);
    if (inR(ui.mx, ui.my, L.xp)) tipBox(c, 'Опыт: ' + ch.xp.toLocaleString('ru') + ' / ' + nxt.toLocaleString('ru'), L.xp.x + L.xp.w / 2, L.xp.y - 14);
    if (inR(ui.mx, ui.my, L.run)) tipBox(c, ch.runOn ? 'Бег (R)' : 'Шаг (R)', L.run.x + 9, L.run.y - 14);
    const mb = L.minibtn;
    c.fillStyle = ui.miniOpen ? '#5a4a2a' : '#3a3024'; c.fillRect(mb.x, mb.y, mb.w, mb.h);
    bevel(c, mb.x, mb.y, mb.w, mb.h, '#9a8a60', '#1a140c', 2);
    c.fillStyle = '#d0c090';
    c.beginPath();
    if (ui.miniOpen) { c.moveTo(mb.x + 8, mb.y + 11); c.lineTo(mb.x + 20, mb.y + 11); c.lineTo(mb.x + 14, mb.y + 19); }
    else { c.moveTo(mb.x + 8, mb.y + 18); c.lineTo(mb.x + 20, mb.y + 18); c.lineTo(mb.x + 14, mb.y + 9); }
    c.fill();
    const rows = D.beltRows(ch);
    const hovBelt = inR(ui.mx, ui.my, { x: L.belt.x, y: L.belt.y - (rows - 1) * L.belt.s * (ui.beltOpen ? 1 : 0), w: L.belt.s * 4, h: L.belt.s * (ui.beltOpen ? rows : 1) });
    ui.beltOpen = hovBelt || (ui.beltOpen && inR(ui.mx, ui.my, { x: L.belt.x - 4, y: L.belt.y - rows * L.belt.s, w: L.belt.s * 4 + 8, h: L.belt.s * (rows + 1) }));
    const showRows = ui.beltOpen ? rows : 1;
    if (showRows > 1) { c.fillStyle = 'rgba(10,8,6,0.92)'; c.fillRect(L.belt.x - 4, L.belt.y - (showRows - 1) * L.belt.s - 4, L.belt.s * 4 + 6, (showRows - 1) * L.belt.s + 4); }
    for (let r = 0; r < showRows; r++) for (let col = 0; col < 4; col++) {
      const x = L.belt.x + col * L.belt.s, y = L.belt.y - r * L.belt.s;
      if (r > 0) { c.fillStyle = '#16120e'; c.fillRect(x, y, 29, 29); bevel(c, x, y, 29, 29, '#050404', '#4a4032', 1); }
      const it = ch.belt[r * 4 + col];
      if (it) { const ic = D.Icons.item(it, 29); c.drawImage(ic, x, y, 29, 29); }
      if (r === 0) text(c, String(col + 1), x + 25, y + 27, '#e0d0a0', 10, 'right');
      if (it && inR(ui.mx, ui.my, { x, y, w: 29, h: 29 })) ui.tipItem = { it, x: x + 15, y: y - 4 };
    }
    if (ch.statPts > 0) lvlButton(c, L.lvlStat, 'Новые характеристики', ui);
    if (ch.skillPts > 0) lvlButton(c, L.lvlSkill, 'Новые навыки', ui);
    if (ui.miniOpen) {
      const m = L.mini;
      c.fillStyle = '#1a1612'; c.fillRect(m.x, m.y, m.w, m.h);
      bevel(c, m.x, m.y, m.w, m.h, '#8a7a5a', '#0a0806', 2);
      MINI_BTNS.forEach(([id, label], i) => {
        const x = m.x + 3 + i * 25.5, y = m.y + 2;
        const on = (id === 'inv' && ui.right === 'inv') || (id === 'skills' && ui.right === 'skills') || (id === 'char' && ui.left === 'char') || (id === 'quest' && ui.left === 'quest') || (id === 'map' && ui.automap);
        c.fillStyle = on ? '#6a5a30' : '#3a3024'; c.fillRect(x, y, 23, 22);
        bevel(c, x, y, 23, 22, '#9a8a60', '#0a0806', 1);
        miniGlyph(c, id, x + 11.5, y + 11);
        if (inR(ui.mx, ui.my, { x, y, w: 23, h: 22 })) tipBox(c, label, x + 12, y - 12);
      });
    }
    drawBuffs(ui, c, g);
    if (ui.hoverSkillBtn) {
      const sid = ui.hoverSkillBtn === 'left' ? ch.left : ch.right;
      const sk = SKILLS[sid] || D.BASIC[sid];
      const Lv = SKILLS[sid] ? D.skillLevel(h, sid) : 0;
      tipBox(c, sk.name + (Lv ? ' (ур. ' + Lv + ')' : ''), ui.hoverSkillBtn === 'left' ? L.lskill.x + 24 : L.rskill.x + 24, L.lskill.y - 14);
    }
  }

  function lvlButton(c, r, label, ui) {
    const pulse = 0.6 + Math.sin(ui.t * 4) * 0.25;
    c.fillStyle = '#2a2014'; c.fillRect(r.x, r.y, r.w, r.h);
    bevel(c, r.x, r.y, r.w, r.h, '#c0a060', '#1a140c', 2);
    c.fillStyle = 'rgba(255,200,80,' + pulse * 0.4 + ')'; c.fillRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
    text(c, '+', r.x + r.w / 2, r.y + r.h / 2 + 10, '#fff0b0', 30, 'center', true);
    if (inR(ui.mx, ui.my, r)) tipBox(c, label, r.x + r.w / 2, r.y - 12);
  }

  function miniGlyph(c, id, x, y) {
    c.strokeStyle = '#e0d0a0'; c.fillStyle = '#e0d0a0'; c.lineWidth = 1.5;
    c.beginPath();
    switch (id) {
      case 'char': c.arc(x, y - 5, 3, 0, TAU); c.moveTo(x - 5, y + 7); c.lineTo(x, y - 1); c.lineTo(x + 5, y + 7); c.stroke(); break;
      case 'inv': c.rect(x - 6, y - 4, 12, 10); c.moveTo(x - 3, y - 4); c.lineTo(x - 3, y - 7); c.lineTo(x + 3, y - 7); c.lineTo(x + 3, y - 4); c.stroke(); break;
      case 'skills': c.moveTo(x, y - 7); c.lineTo(x - 6, y + 6); c.moveTo(x, y - 7); c.lineTo(x + 6, y + 6); c.moveTo(x, y - 7); c.lineTo(x, y + 6); c.stroke(); break;
      case 'party': c.arc(x - 3, y - 3, 2.5, 0, TAU); c.arc(x + 4, y - 3, 2.5, 0, TAU); c.fill(); break;
      case 'map': c.rect(x - 6, y - 5, 12, 10); c.moveTo(x - 2, y - 5); c.lineTo(x - 2, y + 5); c.moveTo(x + 2, y - 5); c.lineTo(x + 2, y + 5); c.stroke(); break;
      case 'msg': c.rect(x - 6, y - 5, 12, 8); c.moveTo(x - 2, y + 3); c.lineTo(x - 4, y + 7); c.stroke(); break;
      case 'quest': c.arc(x, y, 6, 0, TAU); c.moveTo(x, y - 3); c.lineTo(x, y + 3); c.stroke(); break;
      case 'menu': c.moveTo(x - 6, y - 4); c.lineTo(x + 6, y - 4); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.moveTo(x - 6, y + 4); c.lineTo(x + 6, y + 4); c.stroke(); break;
    }
  }

  function skillBtn(c, r, sid, g, ui) {
    const ic = D.Icons.skill(sid, 46);
    c.drawImage(ic, r.x + 1, r.y);
    const hk = Object.keys(g.char.hot).find(k => g.char.hot[k] === sid);
    if (hk) text(c, hk, r.x + 44, r.y + 12, '#e0d0a0', 10, 'right');
    const sk = SKILLS[sid];
    if (sk && g.hero.cd[sid] > g.time) { c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(r.x + 1, r.y, 46, 46); }
    if (sk && g.hero.mp < D.manaCost(sk, D.skillLevel(g.hero, sid))) { c.fillStyle = 'rgba(0,0,80,0.45)'; c.fillRect(r.x + 1, r.y, 46, 46); }
    if (sid === 'tp' || sid === 'id') { const t = g.char.inv.find(i => i.base === (sid === 'tp' ? 'tp_tome' : 'id_tome')); text(c, String(t ? t.qty : 0), r.x + 44, r.y + 44, '#ffffff', 11, 'right'); }
  }

  function drawBuffs(ui, c, g) {
    const h = g.hero;
    const list = [];
    for (const k in h.fx.buffs) {
      const map = { frozen_armor: 'frozen_armor', bone_armor: 'bone_armor', burst: 'burst_of_speed', fade: 'fade', holy_shield: 'holy_shield', shout: 'shout', battle_orders: 'battle_orders' };
      if (map[k]) list.push([map[k], k]);
      else if (k.startsWith('shrine_')) list.push(['shrine', k]);
    }
    for (const a of h.activeAuras || []) list.push([a, 'aura']);
    if (h.form) list.push([h.form === 'wolf' ? 'werewolf' : 'werebear', 'form']);
    if (h.fx.curse) list.push(['amplify_damage', 'curse']);
    const x0 = W / 2 - list.length * 13;
    list.forEach(([sid, k], i) => {
      const x = x0 + i * 26, y = 498;
      if (sid === 'shrine') { c.fillStyle = '#20406a'; c.fillRect(x, y, 22, 22); text(c, '✦', x + 11, y + 16, '#a0d0ff', 14, 'center'); }
      else c.drawImage(D.Icons.skill(sid, 22), x, y);
      if (k === 'curse') { c.strokeStyle = '#ff2020'; c.lineWidth = 2; c.strokeRect(x, y, 22, 22); }
      if (inR(ui.mx, ui.my, { x, y, w: 22, h: 22 })) tipBox(c, k === 'curse' ? 'Вы прокляты' : sid === 'shrine' ? 'Благословение святилища' : (SKILLS[sid] ? SKILLS[sid].name : k), x + 11, y - 10);
    });
  }

  function tipBox(c, s, x, y, col) {
    c.font = '12px ' + FONT;
    const w = c.measureText(s).width + 12;
    const bx = D.clamp(x - w / 2, 2, W - w - 2);
    c.fillStyle = 'rgba(0,0,0,0.85)'; c.fillRect(bx, y - 13, w, 17);
    c.fillStyle = col || COL.white; c.textAlign = 'center'; c.fillText(s, bx + w / 2, y);
  }

  function itemTip(c, g, it, x, y, extra) {
    const lines = D.describe(it, g.itemCtx());
    if (extra) for (const e of extra) lines.push(e);
    c.font = '12px ' + FONT;
    let w = 0;
    for (const l of lines) w = Math.max(w, c.measureText(l.t).width);
    w += 16;
    const h = lines.length * 15 + 8;
    let bx = D.clamp(x - w / 2, 2, W - w - 2);
    let by = y - h - 6;
    if (by < 2) by = Math.min(H - h - 2, y + 34);
    c.fillStyle = 'rgba(0,0,0,0.88)'; c.fillRect(bx, by, w, h);
    c.textAlign = 'center';
    lines.forEach((l, i) => { c.fillStyle = l.c; c.fillText(l.t, bx + w / 2, by + 16 + i * 15); });
  }

  function targetBox(ui, c, g) {
    const hv = ui.hover;
    if (!hv) return;
    let name = null, frac = null, sub = null, col = COL.white;
    if (hv.kind === 'ent') {
      const e = hv.ref;
      if (e.kind === 'mon') {
        name = e.name; frac = e.hp / e.hpMax;
        col = e.su || e.unique ? COL.gold : e.champ ? COL.blue : COL.white;
        const mods = (e.mods || []).map(m => D.MODS[m].name);
        if (e.mon.undead) mods.unshift('Нежить'); else if (e.mon.demon) mods.unshift('Демон');
        const im = [];
        for (const [k, n] of [['f', 'огню'], ['c', 'холоду'], ['l', 'молнии'], ['p', 'яду'], ['ph', 'физ. урону']]) if (e.res[k] >= 100) im.push(n);
        if (im.length) mods.push('Невосприимчив к ' + im.join(', '));
        sub = mods.join(', ');
      } else if (e.kind === 'npc') { name = e.name; col = COL.white; sub = D.NPCS[e.npc].title; }
      else if (e.kind === 'merc' || e.kind === 'pet') { name = e.name; frac = e.hp / e.hpMax; col = COL.green; }
    } else if (hv.kind === 'obj') {
      const o = hv.ref;
      name = o.label || objName(o, g);
    } else if (hv.kind === 'corpse') { name = hv.ref.name; sub = 'Труп'; }
    if (!name) return;
    c.font = '13px ' + FONT;
    const w = Math.max(160, c.measureText(name).width + 30);
    const x = W / 2 - w / 2, y = 6;
    c.fillStyle = 'rgba(0,0,0,0.75)'; c.fillRect(x, y, w, 22);
    if (frac !== null) { c.fillStyle = '#6a0808'; c.fillRect(x + 2, y + 2, (w - 4) * D.clamp(frac, 0, 1), 18); }
    text(c, name, W / 2, y + 16, col, 13, 'center');
    if (sub) { c.font = '11px ' + FONT; const sw = c.measureText(sub).width + 12; c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(W / 2 - sw / 2, y + 23, sw, 15); text(c, sub, W / 2, y + 34, COL.blue, 11, 'center'); }
  }

  function objName(o, g) {
    const n = { chest: 'Сундук', barrel: 'Бочка', urn: 'Урна', body: 'Мёртвое тело', shrine: 'Святилище', stash: 'Сундук', wp: 'Путевая точка', stairs_down: 'Вниз', stairs_up: 'Вверх', cairn: 'Камень Каирна', inifuss: 'Древо Инифус', cage: 'Клетка', tome: 'Заплесневелый фолиант', malus: 'Молот Хорадрима', wirt: 'Тело Вирта', corpse: 'Ваше тело', portal: 'Городской портал', redportal: 'Портал', gate: 'Врата' }[o.type];
    if (o.type === 'chest' && o.locked && !o.open) return 'Запертый сундук';
    return n || null;
  }

  function messages(ui, c) {
    let y = 488;
    const now = ui.t;
    for (let i = ui.msgs.length - 1; i >= 0 && y > 360; i--) {
      const m = ui.msgs[i];
      const age = now - m.t;
      if (age > 8) continue;
      c.globalAlpha = D.clamp(1.4 - age / 6, 0, 1);
      text(c, m.text, 12, y, m.c, 13);
      c.globalAlpha = 1;
      y -= 17;
    }
    if (ui.areaTitle && ui.t - ui.areaTitle.t < 3) {
      const a = D.clamp(1.5 - (ui.t - ui.areaTitle.t) / 2, 0, 1);
      c.globalAlpha = a;
      text(c, ui.areaTitle.text, W / 2, 110, COL.gold, 26, 'center');
      c.globalAlpha = 1;
    }
  }

  function mercPortrait(ui, c, g) {
    const m = g.pets.find(p => p.kind === 'merc');
    if (!m) return;
    const x = 8, y = 8;
    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x, y, 44, 58);
    bevel(c, x, y, 44, 58, '#8a7a5a', '#1a140c', 1);
    const sp = D.Sprites.sprite(D.Models.entModel(m), 'idle', 0.2, Math.PI / 4);
    c.save(); c.beginPath(); c.rect(x + 2, y + 2, 40, 44); c.clip();
    c.drawImage(sp.cv, x + 22 - sp.ox * 0.7, y + 64 - sp.oy * 0.7, sp.w * 0.7, sp.h * 0.7);
    c.restore();
    c.fillStyle = '#300'; c.fillRect(x + 3, y + 48, 38, 6);
    c.fillStyle = m.dead ? '#444' : '#1c9a1c'; c.fillRect(x + 3, y + 48, 38 * D.clamp(m.hp / m.hpMax, 0, 1), 6);
    if (inR(ui.mx, ui.my, { x, y, w: 44, h: 58 })) tipBox(c, m.name + ', ур. ' + m.lvl + ' — ' + Math.round(m.hp) + '/' + m.hpMax, x + 60, y + 70);
  }

  function automap(ui, c, g) {
    const a = g.area, h = g.hero;
    const S = 0.33;
    const cx = W / 2 + (ui.left ? 160 : 0) - (ui.right ? 160 : 0), cy = H / 2 - 30;
    const toS = (x, y) => ({ x: cx + (x - y - (h.x - h.y)) * 32 * S, y: cy + (x + y - (h.x + h.y)) * 16 * S });
    c.save();
    c.globalAlpha = 0.75;
    c.strokeStyle = '#9ab0d0';
    c.lineWidth = 1;
    c.beginPath();
    for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
      const i = y * a.w + x;
      if (!a.seen[i]) continue;
      if (a.walk[i] === 1) continue;
      const blocked = a.wall[i] || (a.border && a.border[i]);
      if (!blocked || a.wall[i] === 7) continue;
      const nb = (dx, dy) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < a.w && ny < a.h && a.walk[ny * a.w + nx] === 1; };
      if (nb(0, 1)) { const p = toS(x, y + 1), q = toS(x + 1, y + 1); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); }
      if (nb(0, -1)) { const p = toS(x, y), q = toS(x + 1, y); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); }
      if (nb(1, 0)) { const p = toS(x + 1, y), q = toS(x + 1, y + 1); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); }
      if (nb(-1, 0)) { const p = toS(x, y), q = toS(x, y + 1); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); }
    }
    c.stroke();
    c.fillStyle = 'rgba(60,90,160,0.5)';
    for (let y = 0; y < a.h; y += 1) for (let x = 0; x < a.w; x += 1) { const i = y * a.w + x; if (a.seen[i] && a.wall[i] === 7) { const p = toS(x + 0.5, y + 0.5); c.fillRect(p.x - 1, p.y - 1, 2, 2); } }
    for (const o of a.objs.concat(a.dyn)) {
      if (!a.seen[Math.floor(o.y) * a.w + Math.floor(o.x)]) continue;
      const p = toS(o.x, o.y);
      if (o.type === 'wp') { c.fillStyle = '#6090ff'; c.beginPath(); c.arc(p.x, p.y, 4, 0, TAU); c.fill(); }
      else if (['stairs_down', 'stairs_up', 'cave', 'tower', 'gate', 'portal', 'redportal'].includes(o.type)) { c.fillStyle = o.type === 'redportal' ? '#ff4040' : '#e0d060'; c.fillRect(p.x - 3, p.y - 3, 6, 6); }
      else if (o.type === 'stash' || o.type === 'shrine') { c.fillStyle = '#c0c0c0'; c.fillRect(p.x - 2, p.y - 2, 4, 4); }
    }
    c.font = '11px ' + FONT; c.textAlign = 'center';
    for (const lb of a.labels) {
      if (!a.seen[Math.floor(lb.y) * a.w + Math.floor(lb.x)]) continue;
      const p = toS(lb.x, lb.y);
      c.fillStyle = '#e8d890'; c.fillText(lb.text, p.x, p.y - 6);
    }
    for (const e of g.ents) {
      if (e.dead) continue;
      const p = toS(e.x, e.y);
      if (e.kind === 'npc') { c.fillStyle = '#ffd040'; c.fillRect(p.x - 2, p.y - 2, 4, 4); }
      else if (e.kind === 'merc' || e.kind === 'pet') { c.fillStyle = '#40ff40'; c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
    }
    const hp = toS(h.x, h.y);
    c.globalAlpha = 1;
    c.strokeStyle = '#ffffff'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(hp.x - 4, hp.y - 4); c.lineTo(hp.x + 4, hp.y + 4); c.moveTo(hp.x + 4, hp.y - 4); c.lineTo(hp.x - 4, hp.y + 4); c.stroke();
    text(c, a.def.name, W - 12, 24, COL.gold, 14, 'right');
    text(c, D.DIFFS[g.diff], W - 12, 42, COL.white, 12, 'right');
    c.restore();
  }

  function talkBox(ui, c) {
    const tb = ui.talk;
    if (!tb) return;
    const w = 520, x = W / 2 - w / 2, y = 20, h = 128;
    c.save();
    c.fillStyle = 'rgba(12,10,8,0.82)'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#8a7a50'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
    c.beginPath(); c.rect(x + 10, y + 10, w - 20, h - 20); c.clip();
    c.font = '15px ' + FONT;
    if (!tb.lines) tb.lines = wrap(c, tb.text, w - 30);
    const lh = 21;
    const total = tb.lines.length * lh;
    const scroll = Math.max(0, Math.min(total - (h - 30), (ui.t - tb.t0 - 1.2) * 16));
    c.textAlign = 'left';
    tb.lines.forEach((l, i) => { c.fillStyle = '#000'; c.fillText(l, x + 16, y + 30 + i * lh - scroll + 1); c.fillStyle = '#e8e0d0'; c.fillText(l, x + 15, y + 30 + i * lh - scroll); });
    tb.done = scroll >= total - (h - 30) - 1;
    c.restore();
    if (tb.name) text(c, tb.name, x + w - 12, y + h + 16, COL.gold, 12, 'right');
  }

  function npcMenu(ui, c, g) {
    const m = ui.npcMenu;
    if (!m) return;
    const opts = g.npcMenu(m.npc);
    const n = D.NPCS[m.npc];
    c.font = '15px ' + FONT;
    let w = c.measureText(n.name).width;
    for (const [, lbl] of opts) w = Math.max(w, c.measureText(lbl).width);
    w += 40;
    const h = 30 + opts.length * 22;
    const x = W / 2 - w / 2, y = 140;
    m.rect = { x, y, w, h };
    c.fillStyle = 'rgba(10,8,6,0.85)'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#6a5a3a'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    text(c, n.name, W / 2, y + 20, COL.gold, 15, 'center');
    m.items = [];
    opts.forEach(([id, lbl], i) => {
      const yy = y + 30 + i * 22;
      const hov = inR(ui.mx, ui.my, { x, y: yy, w, h: 22 });
      text(c, lbl, W / 2, yy + 16, hov ? '#e8c060' : COL.white, 15, 'center');
      m.items.push({ id, x, y: yy, w, h: 22 });
    });
  }

  D.HUD = { L, drawBar, targetBox, messages, mercPortrait, automap, talkBox, npcMenu, tipBox, itemTip, text, bevel, frame, stoneTex, wrap, inR, inCircle, MINI_BTNS };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
