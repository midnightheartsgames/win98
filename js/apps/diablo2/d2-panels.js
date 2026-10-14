(function (D) {
  'use strict';
  const { W, H, BASES, SKILLS, COL, FONT, CLASSES } = D;
  const HU = () => D.HUD;
  const TAU = Math.PI * 2;
  const PW = 320, PH = 432, LX = 0, RX = 480, PY = 8;
  const CELL = 29;

  let BG = {};
  function panelBg(key) {
    if (BG[key]) return BG[key];
    const cv = D.Terrain.mk(PW, PH);
    const c = cv.getContext('2d');
    c.drawImage(HU().stoneTex(PW, PH, key === 'dark' ? '#3a3632' : '#4a4640', key === 'dark' ? 21 : 17), 0, 0);
    const g = c.createLinearGradient(0, 0, 0, PH);
    g.addColorStop(0, 'rgba(0,0,0,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
    c.fillStyle = g; c.fillRect(0, 0, PW, PH);
    HU().frame(c, 0, 0, PW, PH);
    for (const [x, y] of [[8, 8], [PW - 8, 8], [8, PH - 8], [PW - 8, PH - 8]]) D.Sprites.ball(c, { x, y }, 4, '#9a8a60');
    BG[key] = cv;
    return cv;
  }

  function slotBox(c, x, y, w, h, state) {
    c.fillStyle = state === 'bad' ? 'rgba(120,20,20,0.6)' : state === 'good' ? 'rgba(20,90,20,0.55)' : state === 'blue' ? 'rgba(20,30,90,0.55)' : 'rgba(8,6,4,0.85)';
    c.fillRect(x, y, w, h);
    HU().bevel(c, x, y, w, h, '#050404', '#6a5a40', 1);
  }

  function btn(c, r, label, ui, active, disabled) {
    const hov = HU().inR(ui.mx, ui.my, r) && !disabled;
    c.fillStyle = disabled ? '#2a2620' : active ? '#6a5424' : hov ? '#4a3e2a' : '#3a3024';
    c.fillRect(r.x, r.y, r.w, r.h);
    HU().bevel(c, r.x, r.y, r.w, r.h, '#a09060', '#120e08', 2);
    HU().text(c, label, r.x + r.w / 2, r.y + r.h / 2 + 5, disabled ? '#7a7060' : '#e8d8a8', 13, 'center');
  }

  function title(c, x, s) { HU().text(c, s, x + PW / 2, PY + 26, COL.gold, 17, 'center'); }

  const EQ = {
    head: { x: 137, y: 34, w: 58, h: 58 }, neck: { x: 207, y: 50, w: 26, h: 26 }, rh: { x: 22, y: 64, w: 58, h: 116 }, body: { x: 137, y: 100, w: 58, h: 87 },
    lh: { x: 252, y: 64, w: 58, h: 116 }, gloves: { x: 22, y: 194, w: 58, h: 58 }, ring1: { x: 99, y: 200, w: 26, h: 26 }, belt: { x: 137, y: 197, w: 58, h: 29 },
    ring2: { x: 207, y: 200, w: 26, h: 26 }, feet: { x: 252, y: 194, w: 58, h: 58 }
  };
  const GRID = { x: 15, y: 266 };

  function absR(r, x0) { return { x: x0 + r.x, y: PY + r.y, w: r.w, h: r.h }; }

  function drawInv(ui, c, g) {
    const x0 = RX;
    c.drawImage(panelBg('inv'), x0, PY);
    title(c, x0, 'Инвентарь');
    const ch = g.char;
    const held = g.held;
    for (const s in EQ) {
      const r = absR(EQ[s], x0);
      const real = (s === 'rh' || s === 'lh') && ch.swap ? s + '2' : s;
      const it = ch.equip[real];
      let state = null;
      if (held && HU().inR(ui.mx, ui.my, r)) state = D.slotAccepts(real, BASES[held.base]) && D.canEquip(ch, held, real) && g.reqsMet(held) ? 'good' : 'bad';
      else if (it && g.hero.inactive && g.hero.inactive.has(it.uid)) state = 'bad';
      else if (it) state = 'blue';
      slotBox(c, r.x, r.y, r.w, r.h, state);
      if (it) {
        const ic = D.Icons.item(it, CELL);
        const sc = Math.min(1, r.w / ic.width, r.h / ic.height);
        c.drawImage(ic, r.x + (r.w - ic.width * sc) / 2, r.y + (r.h - ic.height * sc) / 2, ic.width * sc, ic.height * sc);
        if (HU().inR(ui.mx, ui.my, r) && !held) ui.tipItem = { it, x: r.x + r.w / 2, y: r.y };
      } else if (!held) {
        const ghost = { head: 'Голова', neck: 'Шея', rh: 'Оружие', body: 'Броня', lh: 'Щит', gloves: 'Руки', ring1: 'Кольцо', belt: 'Пояс', ring2: 'Кольцо', feet: 'Ноги' }[s];
        c.globalAlpha = 0.25; HU().text(c, ghost, r.x + r.w / 2, r.y + r.h / 2 + 4, '#c0b090', 10, 'center'); c.globalAlpha = 1;
      }
    }
    for (const [i, lbl] of [[0, 'I'], [1, 'II']]) {
      for (const s of ['rh', 'lh']) {
        const r = { x: x0 + EQ[s].x + i * 29, y: PY + EQ[s].y - 18, w: 29, h: 16 };
        c.fillStyle = ch.swap === i ? '#6a5424' : '#2a2418'; c.fillRect(r.x, r.y, r.w, r.h);
        HU().bevel(c, r.x, r.y, r.w, r.h, '#9a8a60', '#0a0806', 1);
        HU().text(c, lbl, r.x + r.w / 2, r.y + 12, '#e0d0a0', 11, 'center');
      }
    }
    drawGrid(ui, c, g, 'inv', x0 + GRID.x, PY + GRID.y, D.INV_W, D.INV_H);
    const gr = { x: x0 + 15, y: PY + 392, w: 22, h: 22 };
    c.fillStyle = '#3a3024'; c.fillRect(gr.x, gr.y, gr.w, gr.h); HU().bevel(c, gr.x, gr.y, gr.w, gr.h, '#9a8a60', '#0a0806', 1);
    for (let i = 0; i < 3; i++) { c.fillStyle = '#e0c040'; c.beginPath(); c.ellipse(gr.x + 8 + i * 3, gr.y + 14 - i * 3, 5, 3, 0, 0, TAU); c.fill(); }
    HU().text(c, ch.gold.toLocaleString('ru'), x0 + 46, PY + 409, COL.white, 14);
    HU().text(c, 'макс. ' + D.goldMax(ch).toLocaleString('ru'), x0 + 180, PY + 409, COL.dim, 11);
    closeBtn(ui, c, x0);
    if (g.cursorMode) HU().text(c, g.cursorMode.k === 'identify' ? 'Выберите предмет для опознания' : 'Выберите обычную вещь', x0 + PW / 2, PY + 256, COL.gold, 12, 'center');
  }

  function closeBtn(ui, c, x0) {
    const r = { x: x0 + PW - 34, y: PY + 400, w: 22, h: 22 };
    c.fillStyle = HU().inR(ui.mx, ui.my, r) ? '#6a2a1a' : '#4a1a10'; c.fillRect(r.x, r.y, r.w, r.h);
    HU().bevel(c, r.x, r.y, r.w, r.h, '#c09060', '#0a0806', 1);
    HU().text(c, '×', r.x + 11, r.y + 17, '#f0d0b0', 16, 'center');
    return r;
  }

  function drawGrid(ui, c, g, where, gx, gy, gw, gh) {
    const ch = g.char;
    const grid = where === 'stash' ? D.stashGrid(ch) : D.invGrid(ch);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      c.fillStyle = 'rgba(6,5,4,0.8)'; c.fillRect(gx + x * CELL, gy + y * CELL, CELL - 1, CELL - 1);
      c.strokeStyle = 'rgba(90,80,60,0.35)'; c.strokeRect(gx + x * CELL + 0.5, gy + y * CELL + 0.5, CELL - 2, CELL - 2);
    }
    const held = g.held;
    if (held) {
      const b = BASES[held.base];
      const px = Math.round((ui.mx - gx) / CELL - b.w / 2), py = Math.round((ui.my - gy) / CELL - b.h / 2);
      if (ui.mx >= gx && ui.my >= gy && ui.mx < gx + gw * CELL && ui.my < gy + gh * CELL) {
        const ok = px >= 0 && py >= 0 && px + b.w <= gw && py + b.h <= gh && grid.overlaps(held, px, py).length <= 1;
        c.fillStyle = ok ? 'rgba(30,120,30,0.45)' : 'rgba(140,30,30,0.45)';
        c.fillRect(gx + Math.max(0, px) * CELL, gy + Math.max(0, py) * CELL, b.w * CELL, b.h * CELL);
      }
    }
    for (const it of grid.items) {
      const b = BASES[it.base];
      const x = gx + it.x * CELL, y = gy + it.y * CELL;
      const bad = !g.reqsMet(it) && (b.cat === 'weapon' || b.cat === 'armor' || b.cat === 'jewel');
      c.fillStyle = bad ? 'rgba(120,20,20,0.45)' : it.q === 'magic' || it.q === 'rare' || it.q === 'unique' || it.q === 'set' ? 'rgba(20,30,90,0.45)' : 'rgba(40,40,60,0.35)';
      c.fillRect(x, y, b.w * CELL - 1, b.h * CELL - 1);
      c.drawImage(D.Icons.item(it, CELL), x, y);
      if (it.qty !== undefined && (b.type === 'key' || b.type === 'tome' || b.type === 'quiver' || b.qty)) HU().text(c, String(it.qty), x + b.w * CELL - 3, y + b.h * CELL - 4, '#ffffff', 10, 'right');
      if (it.sockets && !g.held) for (let k = 0; k < it.sockets; k++) { const sx = x + 5 + (k % b.w) * CELL + (b.w === 1 ? 7 : 0), sy = y + 6 + Math.floor(k / b.w) * 22; c.fillStyle = it.socketed[k] ? D.GEMS[it.socketed[k].base] ? D.GEMS[it.socketed[k].base].color : '#ff9a30' : 'rgba(0,0,0,0.6)'; c.beginPath(); c.arc(sx + 5, sy + 5, 4, 0, TAU); c.fill(); c.strokeStyle = '#8a8a8a'; c.stroke(); }
      if (!held && ui.mx >= x && ui.my >= y && ui.mx < x + b.w * CELL && ui.my < y + b.h * CELL) {
        const extra = [];
        if (ui.left === 'trade' || ui.left === 'gamble') extra.push({ t: 'Продать: ' + D.sellPrice(it, ch.level) + ' зол. (Ctrl+щелчок)', c: COL.white });
        ui.tipItem = { it, x: x + b.w * CELL / 2, y, extra };
      }
    }
  }

  function gridClick(ui, g, where, gx, gy, gw, gh, mx, my, btnN, mods) {
    if (mx < gx || my < gy || mx >= gx + gw * CELL || my >= gy + gh * CELL) return false;
    const grid = where === 'stash' ? D.stashGrid(g.char) : D.invGrid(g.char);
    const cx = Math.floor((mx - gx) / CELL), cy = Math.floor((my - gy) / CELL);
    if (g.held) {
      const b = BASES[g.held.base];
      const px = Math.round((mx - gx) / CELL - b.w / 2), py = Math.round((my - gy) / CELL - b.h / 2);
      g.place(where, D.clamp(px, 0, gw - b.w), D.clamp(py, 0, gh - b.h));
      return true;
    }
    const it = grid.at(cx, cy);
    if (!it) return true;
    if (g.cursorMode) {
      if (g.cursorMode.k === 'identify') g.identifyWith(it);
      else if (g.cursorMode.k === 'imbue') { if (g.imbue(it)) g.cursorMode = null; }
      return true;
    }
    if (btnN === 2) {
      if (where === 'inv') g.useItem(it);
      return true;
    }
    if (mods.ctrl && where === 'inv' && (ui.left === 'trade' || ui.left === 'gamble')) { g.sell(ui.shopNpc, it); return true; }
    if (mods.shift && where === 'inv' && D.beltAccept(BASES[it.base])) { g.toBelt(it); return true; }
    if (mods.shift && where === 'inv' && ui.left === 'stash') { const sg = D.stashGrid(g.char); if (sg.spot(it)) { grid.remove(it); sg.add(it); } return true; }
    if (mods.shift && where === 'stash') { const ig = D.invGrid(g.char); if (ig.spot(it)) { grid.remove(it); ig.add(it); } return true; }
    g.take(it, where);
    return true;
  }

  function invClick(ui, g, mx, my, btnN, mods) {
    const x0 = RX;
    if (mx < x0 || mx >= x0 + PW || my < PY || my >= PY + PH) return false;
    const ch = g.char;
    if (HU().inR(mx, my, { x: x0 + PW - 34, y: PY + 400, w: 22, h: 22 })) { ui.right = null; return true; }
    for (const [i] of [[0], [1]]) for (const s of ['rh', 'lh']) {
      const r = { x: x0 + EQ[s].x + i * 29, y: PY + EQ[s].y - 18, w: 29, h: 16 };
      if (HU().inR(mx, my, r)) { if (ch.swap !== i) g.swapWeapons(); return true; }
    }
    for (const s in EQ) {
      if (!HU().inR(mx, my, absR(EQ[s], x0))) continue;
      if (g.held) g.equipHeld(s);
      else if (btnN === 0) {
        const real = (s === 'rh' || s === 'lh') && ch.swap ? s + '2' : s;
        const it = ch.equip[real];
        if (it && g.cursorMode && g.cursorMode.k === 'identify') { g.identifyWith(it); return true; }
        if (it && mods.ctrl && (ui.left === 'trade' || ui.left === 'gamble')) { g.unequip(s); g.sell(ui.shopNpc, g.held); return true; }
        g.unequip(s);
      }
      return true;
    }
    if (gridClick(ui, g, 'inv', x0 + GRID.x, PY + GRID.y, D.INV_W, D.INV_H, mx, my, btnN, mods)) return true;
    return true;
  }

  function drawChar(ui, c, g) {
    const x0 = LX;
    c.drawImage(panelBg('char'), x0, PY);
    const ch = g.char, st = g.hero.st, h = g.hero;
    const T = HU().text;
    const box = (x, y, w, hh, label, val, col) => {
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(x0 + x, PY + y, w, hh);
      HU().bevel(c, x0 + x, PY + y, w, hh, '#050404', '#6a5a40', 1);
      if (label) T(c, label, x0 + x + w / 2, PY + y + 13, COL.gold, 11, 'center');
      if (val !== undefined) T(c, String(val), x0 + x + w / 2, PY + y + (label ? 29 : 17), col || COL.white, 13, 'center');
    };
    box(12, 14, 150, 24, null, ch.name);
    box(166, 14, 142, 24, null, CLASSES[ch.cls].name);
    box(12, 44, 58, 36, 'Уровень', ch.level);
    box(74, 44, 118, 36, 'Опыт', ch.xp.toLocaleString('ru'));
    box(196, 44, 112, 36, 'След. уровень', ch.level >= 99 ? '—' : D.xpFor(ch.level + 1).toLocaleString('ru'));
    const rows = [
      ['str', 'Сила', st.str, ch.stats.str],
      ['dex', 'Ловкость', st.dex, ch.stats.dex],
      ['vit', 'Живучесть', st.vit, ch.stats.vit],
      ['ene', 'Энергия', st.ene, ch.stats.ene]
    ];
    ui.statBtns = [];
    rows.forEach(([k, label, v, base], i) => {
      const y = 92 + i * 52;
      box(12, y, 86, 24, null, label);
      box(100, y, 40, 24, null, v, v > base ? COL.blue : COL.white);
      if (ch.statPts > 0) {
        const r = { x: x0 + 142, y: PY + y + 1, w: 22, h: 22 };
        c.fillStyle = HU().inR(ui.mx, ui.my, r) ? '#8a6a2a' : '#5a4420'; c.fillRect(r.x, r.y, r.w, r.h);
        HU().bevel(c, r.x, r.y, r.w, r.h, '#d0b070', '#1a140c', 1);
        T(c, '+', r.x + 11, r.y + 17, '#fff0c0', 16, 'center', true);
        ui.statBtns.push({ k, r });
      }
    });
    const dmgL = skillDamageText(g, 'left'), dmgR = skillDamageText(g, 'right');
    const right = [
      [92, 'Урон (лев.)', dmgL], [116, 'Урон (прав.)', dmgR],
      [144, 'Рейтинг атаки', st.ar], [168, 'Защита', st.def],
      [196, 'Выносливость', Math.round(h.sp) + '/' + h.spMax], [220, 'Жизнь', Math.max(0, Math.round(h.hp)) + '/' + h.hpMax],
      [248, 'Мана', Math.round(h.mp) + '/' + h.mpMax]
    ];
    for (const [y, lbl, v] of right) {
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x0 + 170, PY + y, 138, 22);
      T(c, lbl, x0 + 175, PY + y + 15, COL.gold, 11);
      T(c, String(v), x0 + 303, PY + y + 15, COL.white, 12, 'right');
    }
    if (ch.statPts > 0) { box(12, 300, 128, 34, 'Очки характеристик', ch.statPts, COL.gold); }
    const res = st.res;
    const rr = [['Сопр. огню', res.f, '#ff6a3a'], ['Сопр. холоду', res.c, '#80c0ff'], ['Сопр. молнии', res.l, '#ffe060'], ['Сопр. яду', res.p, '#60e040']];
    rr.forEach(([lbl, v, col], i) => {
      const y = 280 + i * 24;
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x0 + 170, PY + y, 138, 22);
      T(c, lbl, x0 + 175, PY + y + 15, col, 11);
      T(c, v + '%', x0 + 303, PY + y + 15, v >= 75 ? COL.gold : v < 0 ? COL.red : COL.white, 12, 'right');
    });
    const extra = [['Шанс блока', Math.round(st.block) + '%'], ['Поиск магич. вещей', st.mf + '%'], ['Золото с врагов', st.gf + '%']];
    extra.forEach(([lbl, v], i) => { T(c, lbl + ': ' + v, x0 + 16, PY + 356 + i * 17, COL.dim, 11); });
    closeBtn(ui, c, x0);
  }

  function skillDamageText(g, side) {
    const h = g.hero, st = h.st;
    const sid = side === 'left' ? g.char.left : g.char.right;
    const sk = SKILLS[sid];
    if (sid === 'attack' || sid === 'throw' || (sk && (sk.kind === 'strike' || sk.kind === 'shot'))) {
      let wd = st.wdmg;
      if ((sid === 'throw' || (sk && sk.weapon === 'throw')) && st.rh && BASES[st.rh.base].tdmg) { const d = D.weaponDamage(st.rh); wd = { min: d.t[0], max: d.t[1] }; }
      const L = sk ? D.skillLevel(h, sid) : 1;
      const pct = (sid === 'throw' ? st.throwStat : st.statDmgPct) + st.ed + (sk ? D.val(sk.ed, L) : 0);
      const k = 1 + pct / 100;
      return Math.round(wd.min * k) + '-' + Math.round(wd.max * k);
    }
    if (sk && sk.dmg && !Array.isArray(sk.dmg)) {
      const p = D.Skills.spellPack(h, sk, D.skillLevel(h, sid));
      let a = 0, b = 0;
      for (const k in p) { if (Array.isArray(p[k])) { a += p[k][0]; b += p[k][1]; } else if (k === 'poison') { a += p.poison; b += p.poison; } }
      return Math.round(a) + '-' + Math.round(b);
    }
    return '—';
  }

  function charClick(ui, g, mx, my) {
    if (mx < LX || mx >= LX + PW || my < PY || my >= PY + PH) return false;
    if (HU().inR(mx, my, { x: LX + PW - 34, y: PY + 400, w: 22, h: 22 })) { ui.left = null; return true; }
    for (const b of ui.statBtns || []) if (HU().inR(mx, my, b.r)) { g.addStatPoint(b.k); return true; }
    return true;
  }

  const TREE_X = [40, 136, 232], TREE_Y0 = 86, TREE_DY = 64;

  function drawSkills(ui, c, g) {
    const x0 = RX;
    c.drawImage(panelBg('dark'), x0, PY);
    const ch = g.char;
    const C = CLASSES[ch.cls];
    ui.tree = ui.tree || 0;
    HU().text(c, 'Очки навыков: ' + ch.skillPts, x0 + PW / 2, PY + 24, ch.skillPts ? COL.gold : COL.white, 15, 'center');
    ui.treeTabs = [];
    C.trees.forEach((nm, i) => {
      const r = { x: x0 + 12 + i * 99, y: PY + 34, w: 97, h: 26 };
      c.fillStyle = ui.tree === i ? '#5a4a28' : '#2a2418'; c.fillRect(r.x, r.y, r.w, r.h);
      HU().bevel(c, r.x, r.y, r.w, r.h, '#a09060', '#0a0806', 1);
      c.save(); c.beginPath(); c.rect(r.x, r.y, r.w, r.h); c.clip();
      HU().text(c, nm, r.x + r.w / 2, r.y + 17, ui.tree === i ? '#fff0c0' : '#c0b090', nm.length > 14 ? 10 : 11, 'center');
      c.restore();
      ui.treeTabs.push({ i, r });
    });
    const skills = D.classSkills(ch.cls).filter(s => s.tree === ui.tree);
    const pos = s => ({ x: x0 + TREE_X[s.col], y: PY + TREE_Y0 + s.row * TREE_DY });
    c.strokeStyle = '#8a7a50'; c.lineWidth = 3;
    for (const s of skills) for (const p of s.pre) {
      const ps = D.SKILLS[p];
      if (ps.tree !== s.tree) continue;
      const a = pos(ps), b = pos(s);
      c.beginPath();
      c.moveTo(a.x + 24, a.y + 48);
      if (a.x === b.x) c.lineTo(b.x + 24, b.y - 4);
      else { c.lineTo(a.x + 24, b.y - 10); c.lineTo(b.x + 24, b.y - 10); c.lineTo(b.x + 24, b.y - 4); }
      c.stroke();
      c.fillStyle = '#8a7a50'; c.beginPath(); c.moveTo(b.x + 18, b.y - 8); c.lineTo(b.x + 30, b.y - 8); c.lineTo(b.x + 24, b.y - 1); c.fill();
    }
    for (let r = 0; r < 5; r++) HU().text(c, 'ур. ' + [1, 6, 12, 18, 24][r], x0 + 14, PY + TREE_Y0 + r * TREE_DY + 28, 'rgba(200,180,140,0.5)', 9);
    ui.skillSlots = [];
    for (const s of skills) {
      const p = pos(s);
      const hard = ch.skills[s.id] || 0;
      const eff = D.skillLevel(g.hero, s.id);
      const can = g.canLearn(s.id);
      c.drawImage(D.Icons.skill(s.id, 48, !hard && !can), p.x, p.y);
      if (can && ch.skillPts > 0) { c.strokeStyle = 'rgba(255,220,120,' + (0.5 + Math.sin(ui.t * 4) * 0.3) + ')'; c.lineWidth = 2; c.strokeRect(p.x - 1, p.y - 1, 50, 50); }
      if (hard || eff) {
        c.fillStyle = 'rgba(0,0,0,0.8)'; c.fillRect(p.x + 32, p.y + 34, 18, 15);
        HU().text(c, String(eff), p.x + 41, p.y + 46, eff > hard ? COL.blue : COL.white, 11, 'center');
      }
      ui.skillSlots.push({ id: s.id, r: { x: p.x, y: p.y, w: 48, h: 48 } });
      if (HU().inR(ui.mx, ui.my, { x: p.x, y: p.y, w: 48, h: 48 })) ui.tipSkill = { id: s.id, x: p.x + 24, y: p.y };
    }
    closeBtn(ui, c, x0);
  }

  function skillsClick(ui, g, mx, my) {
    if (mx < RX || mx >= RX + PW || my < PY || my >= PY + PH) return false;
    if (HU().inR(mx, my, { x: RX + PW - 34, y: PY + 400, w: 22, h: 22 })) { ui.right = null; return true; }
    for (const t of ui.treeTabs || []) if (HU().inR(mx, my, t.r)) { ui.tree = t.i; return true; }
    for (const s of ui.skillSlots || []) if (HU().inR(mx, my, s.r)) { g.learnSkill(s.id); return true; }
    return true;
  }

  function skillTip(ui, c, g) {
    const t = ui.tipSkill;
    if (!t) return;
    const lines = skillLines(g, t.id);
    c.font = '12px ' + FONT;
    let w = 0;
    for (const l of lines) w = Math.max(w, c.measureText(l.t).width);
    w = Math.min(360, w + 16);
    const wrapped = [];
    for (const l of lines) for (const s of HU().wrap(c, l.t, w - 14)) wrapped.push({ t: s, c: l.c });
    const hh = wrapped.length * 15 + 8;
    const x = D.clamp(t.x - w / 2, 2, W - w - 2);
    let y = t.y - hh - 6;
    if (y < 2) y = t.y + 54;
    c.fillStyle = 'rgba(0,0,0,0.9)'; c.fillRect(x, y, w, hh);
    c.textAlign = 'center';
    wrapped.forEach((l, i) => { c.fillStyle = l.c; c.fillText(l.t, x + w / 2, y + 16 + i * 15); });
  }

  function fmtR(v) { return Array.isArray(v) ? Math.round(v[0]) + '-' + Math.round(v[1]) : Math.round(v * 10) / 10; }

  function levelInfo(g, sk, L) {
    const out = [];
    if (!L) return out;
    const h = g.hero;
    const mc = D.manaCost(sk, L);
    const EL = { fire: 'огнём', cold: 'холодом', light: 'молнией', poison: 'ядом', magic: 'магией', phys: '' };
    if (sk.dmg && !Array.isArray(sk.dmg)) {
      const p = D.Skills.spellPack(h, sk, L);
      for (const k in p) {
        if (k === 'chill' || k === 'pdur') continue;
        if (k === 'poison') out.push('Урон ядом: ' + Math.round(p.poison) + ' за ' + (p.pdur || 2) + ' сек.');
        else out.push('Урон' + (k === 'ph' ? '' : ' ' + (EL[k] || k)) + ': ' + fmtR(p[k]));
      }
    }
    if (Array.isArray(sk.dmg)) out.push('Урон в секунду: ' + fmtR(D.val(sk.dmg, L)));
    if (sk.ed) out.push('Урон: ' + (D.val(sk.ed, L) >= 0 ? '+' : '') + Math.round(D.val(sk.ed, L)) + '%');
    if (sk.ar) out.push('Рейтинг атаки: +' + Math.round(D.val(sk.ar, L)) + '%');
    if (sk.add) for (const k in sk.add) out.push('Добавляет урон ' + EL[k] + ': ' + fmtR(D.val(sk.add[k], L)));
    if (sk.hits) out.push('Ударов: ' + Math.round(D.sval(sk, 'hits', L)));
    if (sk.count) out.push('Количество: ' + Math.round(D.sval(sk, 'count', L)));
    if (sk.strafe) out.push('Целей: ' + Math.round(D.sval(sk, 'strafe', L)));
    if (sk.stun) out.push('Оглушение: ' + fmtR(D.sval(sk, 'stun', L)) + ' сек.');
    if (sk.chargeEd) out.push('За заряд: +' + Math.round(D.val(sk.chargeEd, L)) + '% урона');
    if (sk.chargeDmg) out.push('Урон заряда: ' + fmtR(D.val(sk.chargeDmg, L)));
    if (sk.bolts) out.push('Разрядов: ' + Math.round(D.sval(sk, 'bolts', L)) + ', урон ' + fmtR(D.val(sk.boltDmg, L)));
    if (sk.explode && sk.explode.fire) out.push('Взрыв огнём: ' + fmtR(D.val(sk.explode.fire, L)));
    if (sk.trailDmg) out.push('Урон ядом: ' + fmtR(D.val(sk.trailDmg, L)));
    if (sk.conv) out.push('Урон молнией: ' + fmtR(D.val(sk.conv, L)));
    if (sk.split) out.push('Разрядов: ' + Math.round(D.sval(sk, 'split', L)));
    if (sk.r && sk.kind !== 'meteor' && sk.kind !== 'blizzard') out.push('Радиус: ' + fmtR(D.sval(sk, 'r', L)) + ' м');
    if (sk.dur && sk.kind !== 'firewall' && sk.kind !== 'blizzard') out.push('Длительность: ' + Math.round(D.val(sk.dur, L)) + ' сек.');
    if (sk.val && sk.sub === 'iron_maiden') out.push('Отражает: ' + Math.round(D.val(sk.val, L)) + '% урона');
    if (sk.val && sk.sub === 'inner_sight') out.push('Защита врагов: -' + Math.round(D.val(sk.val, L)));
    if (sk.val && sk.sub === 'shout') out.push('Защита: +' + Math.round(D.val(sk.val, L)) + '%');
    if (sk.val && sk.sub === 'battle_orders') out.push('Жизнь, мана и выносливость: +' + Math.round(D.val(sk.val, L)) + '%');
    if (sk.val && sk.sub === 'battle_cry') out.push('Защита врагов: -50%, урон врагов: -25%');
    if (sk.val && sk.sub === 'thorns') out.push('Отражает: ' + Math.round(D.val(sk.val, L)) + '% урона');
    if (sk.edef) out.push('Защита: +' + Math.round(D.val(sk.edef, L)) + '%');
    if (sk.absorb) out.push('Поглощает: ' + Math.round(D.val(sk.absorb, L)) + ' урона');
    if (sk.ias) out.push('Скорость атаки: +' + Math.round(D.val(sk.ias, L)) + '%');
    if (sk.frw) out.push('Скорость бега: +' + Math.round(D.val(sk.frw, L)) + '%');
    if (sk.resAll) out.push('Сопротивления: +' + Math.round(D.val(sk.resAll, L)) + '%');
    if (sk.block) out.push('Шанс блока: +' + Math.round(D.val(sk.block, L)) + '%');
    if (sk.heal && sk.kind === 'aura') out.push('Лечение: ' + fmtR(D.val(sk.heal, L)) + ' в сек.');
    if (sk.dps) out.push('Урон в секунду: ' + fmtR(D.val(sk.dps, L)));
    if (sk.slow) out.push('Замедление: ' + Math.round(D.val(sk.slow, L)) + '%');
    if (sk.cut) out.push('Сокращение яда и проклятий: ' + Math.round(D.val(sk.cut, L)) + '%');
    if (sk.regen) out.push('Восстановление маны: +' + Math.round(D.val(sk.regen, L)) + '%');
    if (sk.lifePct) out.push('Жизнь: +' + Math.round(D.val(sk.lifePct, L)) + '%');
    if (sk.fx) for (const k in sk.fx) {
      const v = D.val(sk.fx[k], L);
      const names = { crit: 'Шанс критического удара', dodge: 'Шанс уклонения', arPct: 'Рейтинг атаки', ar: 'Рейтинг атаки', ed: 'Урон', edef: 'Защита', resAll: 'Сопротивления', formLife: 'Жизнь в облике зверя', clawBlock: 'Шанс блока', skelLife: 'Жизнь скелетов', skelDmg: 'Урон скелетов' };
      out.push((names[k] || k) + ': +' + Math.round(v) + (k === 'skelLife' || k === 'skelDmg' || k === 'ar' ? '' : '%'));
    }
    if (sk.max === 'raise') out.push('Макс. количество: ' + D.raiseMax(L));
    else if (sk.max && sk.kind === 'summon' && D.sval(sk, 'max', L) > 1) out.push('Макс. количество: ' + Math.round(D.sval(sk, 'max', L)));
    if (sk.jumps) out.push('Прыжков: ' + Math.round(D.sval(sk, 'jumps', L)));
    if (sk.len) out.push('Длина: ' + fmtR(D.sval(sk, 'len', L)) + ' м');
    if (sk.range && sk.kind === 'stream') out.push('Дальность: ' + fmtR(D.sval(sk, 'range', L)) + ' м');
    if (sk.pct && sk.kind === 'corpse') out.push('Урон: 60-100% жизни трупа');
    if (sk.chance) out.push('Шанс: ' + Math.round(D.val(sk.chance, L)) + '%');
    if (mc) out.push((sk.kind === 'stream' ? 'Расход маны в сек.: ' : 'Расход маны: ') + (Math.round(mc * 10) / 10));
    return out;
  }

  function skillLines(g, id) {
    const sk = SKILLS[id] || D.BASIC[id];
    const out = [{ t: sk.name, c: COL.gold }];
    if (!SKILLS[id]) { out.push({ t: sk.desc, c: COL.white }); return out; }
    out.push({ t: sk.desc, c: COL.white });
    const hard = g.char.skills[id] || 0;
    const eff = D.skillLevel(g.hero, id);
    out.push({ t: 'Требуется уровень: ' + sk.req, c: g.char.level >= sk.req ? COL.white : COL.red });
    if (sk.pre.length) out.push({ t: 'Требует: ' + sk.pre.map(p => SKILLS[p].name).join(', '), c: sk.pre.every(p => g.char.skills[p]) ? COL.white : COL.red });
    if (sk.syn) out.push({ t: 'Синергия: ' + sk.syn.map(([s, p]) => SKILLS[s].name + ' +' + p + '%/ур.').join('; '), c: COL.green });
    if (eff) {
      out.push({ t: 'Текущий уровень: ' + eff + (eff > hard ? ' (' + hard + ' + ' + (eff - hard) + ')' : ''), c: COL.white });
      for (const l of levelInfo(g, sk, eff)) out.push({ t: l, c: COL.blue });
    }
    if (hard < 20) {
      out.push({ t: 'Следующий уровень', c: COL.white });
      for (const l of levelInfo(g, sk, eff + 1)) out.push({ t: l, c: COL.dim });
    }
    return out;
  }

  const QUEST_ICON = { den: 'skull', burial: 'arrow', cain: 'eye', tower: 'hshield', tools: 'hammer', andariel: 'poison' };

  function drawQuests(ui, c, g) {
    const x0 = LX;
    c.drawImage(panelBg('dark'), x0, PY);
    title(c, x0, 'Задания — Акт I (' + D.DIFFS[g.diff] + ')');
    ui.questSlots = [];
    ui.questSel = ui.questSel || 'den';
    D.QUESTS.forEach((q, i) => {
      const cx = x0 + 60 + (i % 3) * 100, cy = PY + 90 + Math.floor(i / 3) * 110;
      const st = g.q(q.id), last = q.log.length - 1;
      const done = st >= last, active = st > 0 && !done;
      const reward = (q.id === 'den' && st === 2) || (q.id === 'burial' && st === 2) || (q.id === 'cain' && (st === 2 || st === 5)) || (q.id === 'tools' && (st === 2 || st === 3)) || (q.id === 'andariel' && st === 2);
      const gr = c.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 36);
      gr.addColorStop(0, done ? '#5a5a5a' : active ? '#8a6a30' : '#3a3a3a'); gr.addColorStop(1, '#0a0806');
      c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, 34, 0, TAU); c.fill();
      c.strokeStyle = ui.questSel === q.id ? '#ffe080' : reward ? 'rgba(255,220,100,' + (0.5 + Math.sin(ui.t * 5) * 0.4) + ')' : '#6a5a3a';
      c.lineWidth = ui.questSel === q.id ? 3 : 2; c.stroke();
      c.save(); c.globalAlpha = done ? 0.5 : st ? 1 : 0.35; c.fillStyle = '#f0e0b0'; c.strokeStyle = '#f0e0b0';
      c.translate(cx - 24, cy - 24);
      (D.Icons.GLYPH[QUEST_ICON[q.id]] || D.Icons.GLYPH.skull)(c, 48);
      c.restore();
      if (done) { c.strokeStyle = '#40c040'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + 12, cy + 18); c.lineTo(cx + 20, cy + 26); c.lineTo(cx + 32, cy + 8); c.stroke(); }
      HU().text(c, q.name, cx, cy + 50, st ? COL.white : COL.dim, 11, 'center');
      ui.questSlots.push({ id: q.id, r: { x: cx - 36, y: cy - 36, w: 72, h: 90 } });
    });
    const q = D.QUEST_MAP[ui.questSel];
    const st = g.q(q.id);
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x0 + 16, PY + 300, PW - 32, 96);
    HU().text(c, q.name, x0 + PW / 2, PY + 318, COL.gold, 14, 'center');
    c.font = '12px ' + FONT;
    let txt = q.log[Math.min(st, q.log.length - 1)];
    if (q.id === 'den' && st === 1 && g.area.id === 'den') txt += ' Осталось: ' + g.ents.filter(e => e.kind === 'mon' && !e.dead).length + '.';
    const lines = HU().wrap(c, txt, PW - 50);
    lines.slice(0, 5).forEach((l, i) => HU().text(c, l, x0 + PW / 2, PY + 338 + i * 15, COL.white, 12, 'center'));
    closeBtn(ui, c, x0);
  }

  function questsClick(ui, g, mx, my) {
    if (mx < LX || mx >= LX + PW || my < PY || my >= PY + PH) return false;
    if (HU().inR(mx, my, { x: LX + PW - 34, y: PY + 400, w: 22, h: 22 })) { ui.left = null; return true; }
    for (const s of ui.questSlots || []) if (HU().inR(mx, my, s.r)) { ui.questSel = s.id; return true; }
    return true;
  }

  function drawWp(ui, c, g) {
    const x0 = LX;
    c.drawImage(panelBg('dark'), x0, PY);
    title(c, x0, 'Путевые точки');
    const tab = { x: x0 + 16, y: PY + 36, w: 70, h: 22 };
    c.fillStyle = '#5a4a28'; c.fillRect(tab.x, tab.y, tab.w, tab.h); HU().bevel(c, tab.x, tab.y, tab.w, tab.h, '#a09060', '#0a0806', 1);
    HU().text(c, 'Акт I', tab.x + 35, tab.y + 16, '#fff0c0', 12, 'center');
    for (let i = 1; i < 5; i++) { const r = { x: x0 + 16 + i * 72, y: PY + 36, w: 70, h: 22 }; c.fillStyle = '#1a1612'; c.fillRect(r.x, r.y, r.w, r.h); HU().text(c, 'Акт ' + ['I', 'II', 'III', 'IV', 'V'][i], r.x + 35, r.y + 16, '#5a5040', 12, 'center'); }
    ui.wpSlots = [];
    D.WAYPOINTS.forEach((id, i) => {
      const r = { x: x0 + 20, y: PY + 68 + i * 36, w: PW - 40, h: 32 };
      const on = !!g.prog.wp[id];
      const cur = g.area.id === id;
      const hov = HU().inR(ui.mx, ui.my, r) && on && !cur;
      c.fillStyle = hov ? 'rgba(90,70,30,0.6)' : 'rgba(0,0,0,0.45)'; c.fillRect(r.x, r.y, r.w, r.h);
      c.fillStyle = on ? '#2040a0' : '#2a2a2a'; c.fillRect(r.x + 4, r.y + 4, 24, 24);
      if (on) { const gg = c.createRadialGradient(r.x + 16, r.y + 16, 1, r.x + 16, r.y + 16, 12); gg.addColorStop(0, '#c0e0ff'); gg.addColorStop(1, 'rgba(40,80,200,0)'); c.fillStyle = gg; c.fillRect(r.x + 4, r.y + 4, 24, 24); }
      HU().text(c, D.AREAS[id].name, r.x + 38, r.y + 21, cur ? COL.gold : on ? COL.white : '#5a5a5a', 14);
      ui.wpSlots.push({ id, r, on });
    });
    closeBtn(ui, c, x0);
  }

  function wpClick(ui, g, mx, my) {
    if (mx < LX || mx >= LX + PW || my < PY || my >= PY + PH) return false;
    if (HU().inR(mx, my, { x: LX + PW - 34, y: PY + 400, w: 22, h: 22 })) { ui.left = null; return true; }
    for (const s of ui.wpSlots || []) if (HU().inR(mx, my, s.r) && s.on) { if (g.travelWp(s.id)) { ui.left = null; ui.right = null; } return true; }
    return true;
  }

  function packStock(items, gw, gh) {
    const occ = new Uint8Array(gw * gh);
    const out = [];
    const sorted = items.slice().sort((a, b2) => BASES[b2.base].w * BASES[b2.base].h - BASES[a.base].w * BASES[a.base].h);
    for (const it of sorted) {
      const b = BASES[it.base];
      let done = false;
      for (let y = 0; y <= gh - b.h && !done; y++) for (let x = 0; x <= gw - b.w && !done; x++) {
        let free = true;
        for (let yy = y; yy < y + b.h && free; yy++) for (let xx = x; xx < x + b.w; xx++) if (occ[yy * gw + xx]) { free = false; break; }
        if (!free) continue;
        for (let yy = y; yy < y + b.h; yy++) for (let xx = x; xx < x + b.w; xx++) occ[yy * gw + xx] = 1;
        out.push({ it, x, y });
        done = true;
      }
    }
    return out;
  }

  function drawTrade(ui, c, g) {
    const x0 = LX;
    c.drawImage(panelBg('dark'), x0, PY);
    const npc = ui.shopNpc;
    const gamble = ui.left === 'gamble';
    title(c, x0, D.NPCS[npc].name + (gamble ? ' — азартная игра' : ' — торговля'));
    const items = gamble ? g.gambleList() : g.shopStock(npc);
    const gx = x0 + 15, gy = PY + 44;
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) { c.fillStyle = 'rgba(6,5,4,0.8)'; c.fillRect(gx + x * CELL, gy + y * CELL, CELL - 1, CELL - 1); }
    const layout = packStock(items, 10, 10);
    ui.shopLayout = layout;
    for (const L of layout) {
      const b = BASES[L.it.base];
      const x = gx + L.x * CELL, y = gy + L.y * CELL;
      const bad = !g.reqsMet(L.it) && (b.cat === 'weapon' || b.cat === 'armor' || b.cat === 'jewel');
      c.fillStyle = bad ? 'rgba(120,20,20,0.45)' : L.it.q === 'magic' ? 'rgba(20,30,90,0.45)' : 'rgba(40,40,60,0.3)';
      c.fillRect(x, y, b.w * CELL - 1, b.h * CELL - 1);
      c.drawImage(D.Icons.item(L.it, CELL), x, y);
      if (!g.held && ui.mx >= x && ui.my >= y && ui.mx < x + b.w * CELL && ui.my < y + b.h * CELL) {
        const price = gamble ? g.gamblePrice(L.it) : g.priceOf(L.it);
        const extra = [{ t: (gamble ? 'Ставка: ' : 'Цена: ') + price + ' зол.', c: g.char.gold >= price ? COL.white : COL.red }];
        if (gamble) ui.tipItem = { it: { base: L.it.base, q: 'normal', idf: true, stats: {}, sockets: 0, socketed: [], def: BASES[L.it.base].def ? BASES[L.it.base].def[1] : undefined }, x: x + b.w * CELL / 2, y, extra, raw: true };
        else ui.tipItem = { it: L.it, x: x + b.w * CELL / 2, y, extra };
      }
    }
    HU().text(c, 'Золото: ' + g.char.gold.toLocaleString('ru'), x0 + 18, PY + 350, COL.gold, 13);
    HU().text(c, gamble ? 'Щелчок — сыграть' : 'Щелчок — купить, Ctrl+щелчок в сумке — продать', x0 + PW / 2, PY + 372, COL.dim, 11, 'center');
    if (!gamble && D.NPCS[npc].repair) {
      const cost = g.repairAllCost();
      const r = { x: x0 + 170, y: PY + 334, w: 138, h: 24 };
      btn(c, r, cost ? 'Починить всё: ' + cost : 'Всё исправно', ui, false, !cost);
      ui.repairBtn = r;
    } else ui.repairBtn = null;
    closeBtn(ui, c, x0);
  }

  function tradeClick(ui, g, mx, my, btnN) {
    if (mx < LX || mx >= LX + PW || my < PY || my >= PY + PH) return false;
    if (HU().inR(mx, my, { x: LX + PW - 34, y: PY + 400, w: 22, h: 22 })) { ui.left = null; return true; }
    if (g.held) { if (ui.left === 'trade') g.sell(ui.shopNpc, g.held); return true; }
    if (ui.repairBtn && HU().inR(mx, my, ui.repairBtn)) { g.repairAll(); return true; }
    const gx = LX + 15, gy = PY + 44;
    for (const L of ui.shopLayout || []) {
      const b = BASES[L.it.base];
      const x = gx + L.x * CELL, y = gy + L.y * CELL;
      if (mx >= x && my >= y && mx < x + b.w * CELL && my < y + b.h * CELL) {
        if (ui.left === 'gamble') { const it = g.gamble(L.it); if (it) g.msg('Выигрыш: ' + D.itemName(it), D.nameColor(it)); }
        else g.buy(ui.shopNpc, L.it, btnN === 2);
        return true;
      }
    }
    return true;
  }

  function drawStash(ui, c, g) {
    const x0 = LX;
    c.drawImage(panelBg('inv'), x0, PY);
    title(c, x0, 'Сундук');
    drawGrid(ui, c, g, 'stash', x0 + 73, PY + 50, D.STASH_W, D.STASH_H);
    HU().text(c, 'Золото в сундуке: ' + g.char.stash.gold.toLocaleString('ru'), x0 + PW / 2, PY + 300, COL.gold, 13, 'center');
    ui.stashBtns = [{ k: 'dep', r: { x: x0 + 30, y: PY + 314, w: 124, h: 24 }, l: 'Положить золото' }, { k: 'wd', r: { x: x0 + 166, y: PY + 314, w: 124, h: 24 }, l: 'Взять золото' }];
    for (const b of ui.stashBtns) btn(c, b.r, b.l, ui);
    HU().text(c, 'Shift+щелчок — переложить', x0 + PW / 2, PY + 360, COL.dim, 11, 'center');
    closeBtn(ui, c, x0);
  }

  function stashClick(ui, g, mx, my, btnN, mods) {
    if (mx < LX || mx >= LX + PW || my < PY || my >= PY + PH) return false;
    if (HU().inR(mx, my, { x: LX + PW - 34, y: PY + 400, w: 22, h: 22 })) { ui.left = null; return true; }
    for (const b of ui.stashBtns || []) if (HU().inR(mx, my, b.r)) { if (b.k === 'dep') g.stashGold(g.char.gold); else g.withdrawGold(g.char.stash.gold); return true; }
    gridClick(ui, g, 'stash', LX + 73, PY + 50, D.STASH_W, D.STASH_H, mx, my, btnN, mods);
    return true;
  }

  function drawHire(ui, c, g) {
    const x0 = LX;
    c.drawImage(panelBg('dark'), x0, PY);
    title(c, x0, 'Кашья — наёмницы');
    ui.hireSlots = [];
    const m = g.char.merc;
    if (m && m.dead) {
      const cost = g.reviveCost();
      HU().text(c, m.name + ' пала в бою.', x0 + PW / 2, PY + 80, COL.white, 14, 'center');
      const r = { x: x0 + 60, y: PY + 100, w: 200, h: 28 };
      btn(c, r, 'Воскресить: ' + cost + ' зол.', ui, false, g.char.gold < cost);
      ui.hireSlots.push({ revive: true, r });
    }
    const list = g.mercList();
    list.forEach((o, i) => {
      const r = { x: x0 + 16, y: PY + 150 + i * 56, w: PW - 32, h: 50 };
      const cost = g.mercCost(o);
      const hov = HU().inR(ui.mx, ui.my, r);
      c.fillStyle = hov ? 'rgba(90,70,30,0.6)' : 'rgba(0,0,0,0.45)'; c.fillRect(r.x, r.y, r.w, r.h);
      HU().text(c, o.name + ', уровень ' + o.lvl, r.x + 10, r.y + 20, COL.white, 14);
      HU().text(c, (o.type === 'fire' ? 'Огненная стрела' : 'Ледяная стрела') + ' · жизнь ' + Math.round((55 + 16 * o.lvl) * [1, 1.5, 2.2][g.diff]), r.x + 10, r.y + 40, o.type === 'fire' ? '#ff9a50' : '#90c8ff', 12);
      HU().text(c, cost ? cost + ' зол.' : 'бесплатно', r.x + r.w - 10, r.y + 30, g.char.gold >= cost ? COL.gold : COL.red, 13, 'right');
      ui.hireSlots.push({ o, r });
    });
    if (g.prog.freeMerc) HU().text(c, 'Кашья даёт первую наёмницу бесплатно', x0 + PW / 2, PY + 140, COL.green, 12, 'center');
    if (m && !m.dead) HU().text(c, 'Текущая: ' + m.name + ' (новая заменит её)', x0 + PW / 2, PY + 390, COL.dim, 11, 'center');
    closeBtn(ui, c, x0);
  }

  function hireClick(ui, g, mx, my) {
    if (mx < LX || mx >= LX + PW || my < PY || my >= PY + PH) return false;
    if (HU().inR(mx, my, { x: LX + PW - 34, y: PY + 400, w: 22, h: 22 })) { ui.left = null; return true; }
    for (const s of ui.hireSlots || []) if (HU().inR(mx, my, s.r)) { if (s.revive) g.reviveMerc(); else g.hireMerc(s.o); return true; }
    return true;
  }

  function skillPicker(ui, c, g) {
    const side = ui.skillPick;
    if (!side) return;
    const list = g.char && g.skillChoices(side);
    const rows = [];
    const basic = list.filter(id => !SKILLS[id]);
    if (basic.length) rows.push(basic);
    for (let t = 0; t < 3; t++) { const r = list.filter(id => SKILLS[id] && SKILLS[id].cls === g.char.cls && SKILLS[id].tree === t); if (r.length) rows.push(r); }
    const other = list.filter(id => SKILLS[id] && SKILLS[id].cls !== g.char.cls);
    if (other.length) rows.push(other);
    ui.pickSlots = [];
    const S = 44;
    rows.forEach((row, ri) => {
      row.forEach((id, i) => {
        const x = side === 'left' ? 120 + i * (S + 2) : 680 - (i + 1) * (S + 2), y = 506 - (ri + 1) * (S + 2);
        c.drawImage(D.Icons.skill(id, S), x, y);
        const hk = Object.keys(g.char.hot).find(k => g.char.hot[k] === id);
        if (hk) HU().text(c, hk, x + S - 3, y + 12, '#ffffff', 10, 'right');
        const r = { x, y, w: S, h: S };
        ui.pickSlots.push({ id, r });
        if (HU().inR(ui.mx, ui.my, r)) { c.strokeStyle = '#ffe080'; c.lineWidth = 2; c.strokeRect(x, y, S, S); ui.pickHover = id; HU().tipBox(c, (SKILLS[id] || D.BASIC[id]).name + (hk ? ' [' + hk + ']' : ' — наведите и нажмите F1–F8'), x + S / 2, y - 8); }
      });
    });
  }

  function pickClick(ui, g, mx, my) {
    for (const s of ui.pickSlots || []) if (HU().inR(mx, my, s.r)) { g.setSkill(ui.skillPick, s.id); ui.skillPick = null; return true; }
    ui.skillPick = null;
    return true;
  }

  function menuOverlay(ui, c) {
    const m = ui.menu;
    if (!m) return;
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, W, H);
    let items;
    if (m === 'main') items = [['opts', 'НАСТРОЙКИ'], ['save', 'СОХРАНИТЬ И ВЫЙТИ'], ['back', 'ВЕРНУТЬСЯ В ИГРУ']];
    else items = [['sfx', 'ЗВУК: ' + Math.round(ui.settings.sfx * 100) + '%'], ['music', 'МУЗЫКА: ' + Math.round(ui.settings.music * 100) + '%'], ['labels', 'МЕТКИ ПРЕДМЕТОВ: ' + (ui.settings.labels ? 'ВСЕГДА' : 'ALT')], ['light', 'ОСВЕЩЕНИЕ: ' + (ui.settings.lowLight ? 'ПРОСТОЕ' : 'ПОЛНОЕ')], ['back2', 'НАЗАД']];
    ui.menuItems = [];
    items.forEach(([id, lbl], i) => {
      const y = 220 + i * 52;
      c.font = 'bold 26px ' + FONT;
      const w = c.measureText(lbl).width + 40;
      const r = { x: W / 2 - w / 2, y: y - 30, w, h: 40 };
      const hov = HU().inR(ui.mx, ui.my, r);
      HU().text(c, lbl, W / 2, y, hov ? '#fff0b0' : '#c7a860', 26, 'center', true);
      if (hov) { D.HUD.text(c, '✦', r.x + 6, y - 4, '#ff7020', 18); D.HUD.text(c, '✦', r.x + r.w - 20, y - 4, '#ff7020', 18); }
      ui.menuItems.push({ id, r });
    });
  }

  function helpOverlay(ui, c) {
    c.fillStyle = 'rgba(0,0,0,0.78)'; c.fillRect(0, 0, W, H);
    HU().text(c, 'УПРАВЛЕНИЕ', W / 2, 50, COL.gold, 24, 'center', true);
    const lines = [
      ['Левая кнопка', 'идти, атаковать, подобрать, говорить'], ['Shift + левая', 'атаковать на месте'], ['Правая кнопка', 'применить правый навык'],
      ['C / A', 'персонаж'], ['I / B', 'инвентарь'], ['T', 'дерево навыков'], ['Q', 'задания'], ['Tab', 'автокарта'], ['Alt', 'показать предметы на земле'],
      ['1–4', 'зелья на поясе'], ['F1–F8', 'назначенные навыки'], ['S', 'выбор правого навыка'], ['W', 'сменить оружие (I/II)'], ['R', 'бег / шаг'],
      ['Правая по вещи', 'выпить / прочитать'], ['Shift + щелчок', 'зелье — на пояс'], ['Ctrl + щелчок', 'продать у торговца'], ['Пробел', 'закрыть панели'], ['Esc', 'меню игры'], ['H', 'эта справка']
    ];
    lines.forEach(([k, v], i) => {
      const y = 90 + i * 22;
      HU().text(c, k, W / 2 - 20, y, '#e8d090', 14, 'right');
      HU().text(c, v, W / 2 + 10, y, COL.white, 14);
    });
    HU().text(c, 'Нажмите H или Esc, чтобы закрыть', W / 2, H - 70, COL.dim, 12, 'center');
  }

  function deathOverlay(ui, c, g) {
    c.fillStyle = 'rgba(40,0,0,0.35)'; c.fillRect(0, 0, W, H);
    HU().text(c, g.char.hc ? 'ВАШ ГЕРОЙ ПОГИБ НАВСЕГДА' : 'ВЫ ПОГИБЛИ', W / 2, 250, '#d02020', 34, 'center', true);
    HU().text(c, g.char.hc ? 'Нажмите Esc для выхода' : 'Нажмите Esc, чтобы продолжить', W / 2, 290, COL.white, 16, 'center');
    if (!g.char.hc) HU().text(c, 'Ваше снаряжение осталось на теле', W / 2, 318, COL.dim, 13, 'center');
  }

  D.Panels = {
    PW, PH, LX, RX, PY, CELL, drawInv, invClick, drawChar, charClick, drawSkills, skillsClick, skillTip, drawQuests, questsClick, drawWp, wpClick,
    drawTrade, tradeClick, drawStash, stashClick, drawHire, hireClick, skillPicker, pickClick, menuOverlay, helpOverlay, deathOverlay, skillLines, panelBg, btn
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
