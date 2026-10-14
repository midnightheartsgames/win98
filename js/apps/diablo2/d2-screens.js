(function (D) {
  'use strict';
  const { W, H, COL, FONT, CLASSES, CLASS_ORDER } = D;
  const TAU = Math.PI * 2;
  const HU = () => D.HUD;
  const mk = (w, h) => D.Terrain.mk(w, h);

  const BG = {};

  function nightScene(key, variant) {
    if (BG[key]) return BG[key];
    const cv = mk(W, H);
    const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#060a18'); g.addColorStop(0.55, '#10141e'); g.addColorStop(1, '#050404');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const rng = new D.RNG(77);
    for (let i = 0; i < 160; i++) { c.fillStyle = 'rgba(220,220,255,' + rng.range(0.2, 0.9) + ')'; c.fillRect(rng.int(0, W), rng.int(0, H * 0.5), 1, 1); }
    if (variant === 'gate') {
      c.fillStyle = '#1a1816';
      c.fillRect(0, 60, W, H * 0.6);
      for (let y = 60; y < H * 0.66; y += 22) for (let x = (y / 22 % 2) * 30; x < W; x += 60) { c.fillStyle = D.shade('#2a2622', rng.range(-0.3, 0.2)); c.fillRect(x + 1, y + 1, 58, 20); }
      c.fillStyle = '#050404';
      c.beginPath(); c.moveTo(W / 2 - 120, H * 0.66); c.lineTo(W / 2 - 120, 230); c.arc(W / 2, 230, 120, Math.PI, TAU); c.lineTo(W / 2 + 120, H * 0.66); c.fill();
      for (const x of [110, 690]) { c.fillStyle = '#2e2a26'; c.fillRect(x - 40, 40, 80, H * 0.62); c.fillStyle = '#3a3630'; c.fillRect(x - 46, 40, 92, 20); }
      for (const [x, y] of [[80, 220], [720, 220]]) { c.fillStyle = '#3a2410'; c.fillRect(x - 4, y, 8, 30); }
    } else {
      c.fillStyle = '#0a0c10';
      c.beginPath(); c.moveTo(0, H * 0.62);
      for (let x = 0; x <= W; x += 20) c.lineTo(x, H * 0.62 - D.fbm(x * 0.01, 3, 5, 3) * 110);
      c.lineTo(W, H); c.lineTo(0, H); c.fill();
      for (const [x, s] of [[70, 1.2], [160, 0.9], [640, 1.1], [735, 1.3], [590, 0.7]]) {
        c.fillStyle = '#07090c';
        c.fillRect(x - 5 * s, H * 0.62 - 100 * s, 10 * s, 110 * s);
        c.beginPath(); c.arc(x, H * 0.62 - 110 * s, 45 * s, 0, TAU); c.fill();
      }
      c.fillStyle = '#0c0a08';
      c.beginPath(); c.moveTo(500, 470); c.lineTo(560, 380); c.lineTo(620, 470); c.fill();
      c.beginPath(); c.moveTo(180, 470); c.lineTo(250, 390); c.lineTo(320, 470); c.fill();
      c.fillRect(600, 420, 120, 50);
    }
    const gy = variant === 'gate' ? H * 0.64 : H * 0.74;
    const gg = c.createLinearGradient(0, gy, 0, H);
    gg.addColorStop(0, '#1a1712'); gg.addColorStop(1, '#040302');
    c.fillStyle = gg; c.fillRect(0, gy, W, H - gy);
    if (variant === 'gate') for (let i = 0; i < 90; i++) { c.fillStyle = 'rgba(80,70,55,' + rng.range(0.1, 0.35) + ')'; c.beginPath(); c.ellipse(rng.int(0, W), rng.range(gy + 8, H), rng.range(6, 22), rng.range(2, 6), 0, 0, TAU); c.fill(); }
    BG[key] = cv;
    return cv;
  }

  function campfire(c, x, y, t, s) {
    s = s || 1;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const glow = c.createRadialGradient(x, y - 20, 5, x, y - 20, 280 * s);
    glow.addColorStop(0, 'rgba(255,140,40,0.45)'); glow.addColorStop(0.4, 'rgba(160,60,10,0.15)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow; c.beginPath(); c.arc(x, y - 20, 280 * s, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = '#2a1608'; c.lineWidth = 6 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 26 * s, y + 4); c.lineTo(x + 22 * s, y - 6); c.moveTo(x - 22 * s, y - 6); c.lineTo(x + 26 * s, y + 4); c.stroke();
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      const ph = t * 6 + i * 1.3;
      const fx = x + Math.sin(ph) * 6 * s + (i - 7) * 2.6 * s;
      const h = (30 + Math.sin(ph * 1.7) * 12 + (7 - Math.abs(i - 7)) * 4) * s;
      const g = c.createRadialGradient(fx, y - h * 0.4, 1, fx, y - h * 0.4, h * 0.6);
      g.addColorStop(0, 'rgba(255,240,190,0.85)'); g.addColorStop(0.4, 'rgba(255,130,30,0.55)'); g.addColorStop(1, 'rgba(120,20,0,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(fx, y - h * 0.4, h * 0.3, h * 0.65, 0, 0, TAU); c.fill();
    }
    for (let i = 0; i < 10; i++) { const p = ((t * 0.5 + i * 0.1) % 1); c.fillStyle = 'rgba(255,' + (140 + i * 8) + ',40,' + (1 - p) + ')'; c.fillRect(x + Math.sin(i * 7 + t) * 20 * s, y - 40 * s - p * 120 * s, 2, 2); }
    c.restore();
  }

  function logo(c, x, y, t, scale) {
    const s = scale || 1;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.font = 'bold 118px "Times New Roman",Georgia,serif';
    c.textAlign = 'center';
    const mg = c.createLinearGradient(0, -80, 0, 20);
    mg.addColorStop(0, '#f8d890'); mg.addColorStop(0.35, '#c08830'); mg.addColorStop(0.6, '#704010'); mg.addColorStop(1, '#2a1406');
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 38; i++) {
      const fx = -230 + (i / 37) * 460 + Math.sin(t * 3 + i) * 6;
      const h = 40 + Math.sin(t * 5 + i * 1.7) * 18 + (i % 5) * 6;
      const g = c.createRadialGradient(fx, -70 - h * 0.3, 1, fx, -70 - h * 0.3, h * 0.6);
      g.addColorStop(0, 'rgba(255,230,160,0.5)'); g.addColorStop(0.5, 'rgba(255,110,20,0.35)'); g.addColorStop(1, 'rgba(120,20,0,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(fx, -70 - h * 0.3, h * 0.25, h * 0.7, 0, 0, TAU); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    c.font = 'bold 150px "Times New Roman",Georgia,serif';
    const rg = c.createLinearGradient(0, -110, 0, 30);
    rg.addColorStop(0, '#b02010'); rg.addColorStop(0.5, '#601008'); rg.addColorStop(1, '#200404');
    c.fillStyle = rg; c.strokeStyle = '#100404'; c.lineWidth = 4;
    c.strokeText('II', 0, 26); c.fillText('II', 0, 26);
    c.font = 'bold 104px "Times New Roman",Georgia,serif';
    c.lineWidth = 6; c.strokeStyle = '#140a04';
    c.strokeText('DIABLO', 0, 0);
    c.fillStyle = mg; c.fillText('DIABLO', 0, 0);
    c.lineWidth = 1; c.strokeStyle = 'rgba(255,230,170,0.6)'; c.strokeText('DIABLO', 0, 0);
    c.restore();
  }

  function stoneButton(c, r, label, hov, small, disabled) {
    const g = c.createLinearGradient(0, r.y, 0, r.y + r.h);
    g.addColorStop(0, disabled ? '#3a3632' : '#8a8274'); g.addColorStop(0.5, disabled ? '#2a2724' : '#5a544a'); g.addColorStop(1, disabled ? '#1a1816' : '#35302a');
    c.fillStyle = g; c.fillRect(r.x, r.y, r.w, r.h);
    c.strokeStyle = '#1a140c'; c.lineWidth = 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    c.strokeStyle = disabled ? '#4a4030' : '#b09a60'; c.lineWidth = 1; c.strokeRect(r.x + 3.5, r.y + 3.5, r.w - 7, r.h - 7);
    for (const x of [r.x + 8, r.x + r.w - 8]) D.Sprites.ball(c, { x, y: r.y + r.h / 2 }, 3, disabled ? '#4a4030' : '#6a70c0');
    HU().text(c, label, r.x + r.w / 2, r.y + r.h / 2 + (small ? 5 : 6), disabled ? '#6a6050' : hov ? '#ffffff' : '#d8c8a0', small ? 13 : 16, 'center', true);
  }

  const inR = (mx, my, r) => mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h;

  const Menu = {
    buttons() {
      return [
        { id: 'single', r: { x: 250, y: 258, w: 300, h: 34 }, l: 'ОДИНОЧНАЯ ИГРА' },
        { id: 'bnet', r: { x: 250, y: 302, w: 300, h: 34 }, l: 'BATTLE.NET' },
        { id: 'gateway', r: { x: 280, y: 338, w: 240, h: 20 }, l: 'ШЛЮЗ: RUBATTLE.NET', small: true },
        { id: 'other', r: { x: 250, y: 364, w: 300, h: 34 }, l: 'ДРУГАЯ СЕТЕВАЯ ИГРА' },
        { id: 'credits', r: { x: 250, y: 470, w: 148, h: 26 }, l: 'АВТОРЫ', small: true },
        { id: 'cine', r: { x: 402, y: 470, w: 148, h: 26 }, l: 'ВИДЕОРОЛИКИ', small: true },
        { id: 'exit', r: { x: 250, y: 502, w: 300, h: 34 }, l: 'ВЫХОД ИЗ DIABLO II' }
      ];
    },
    draw(ui, c) {
      c.drawImage(nightScene('menu'), 0, 0);
      const heroes = ['amazon', 'barbarian', 'sorceress', 'paladin', 'necromancer'];
      heroes.forEach((cls, i) => {
        const a = (i - 2) * 0.55;
        const x = W / 2 + Math.sin(a) * 150, y = 470 - Math.cos(a) * 30 + 20;
        const sp = D.Sprites.sprite(D.Models.portraitModel(cls), 'idle', (ui.t * 0.3 + i * 0.2) % 1, Math.atan2(470 - y, W / 2 - x) + Math.PI / 4 - 0.2);
        c.filter = 'brightness(0.55) sepia(0.4)';
        c.drawImage(sp.cv, x - sp.ox * 1.3, y - sp.oy * 1.3, sp.w * 1.3, sp.h * 1.3);
        c.filter = 'none';
      });
      campfire(c, W / 2, 470, ui.t, 1);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 0, W, H);
      logo(c, W / 2, 150, ui.t, 0.85);
      for (const b of this.buttons()) stoneButton(c, b.r, b.l, inR(ui.mx, ui.my, b.r) && b.id !== 'gateway', b.small, b.id === 'gateway');
      HU().text(c, 'v 1.09', 16, H - 14, '#b0a080', 12);
      HU().text(c, 'Win 98 Edition', W - 16, H - 14, '#806a50', 11, 'right');
    },
    click(ui, mx, my) {
      for (const b of this.buttons()) if (inR(mx, my, b.r)) {
        ui.audio.sfx('ui_click');
        if (b.id === 'single') ui.go('select');
        else if (b.id === 'bnet') ui.modalConnect();
        else if (b.id === 'other') ui.modal = { text: 'Выберите тип подключения', buttons: [['tcp', 'TCP/IP'], ['direct', 'ПРЯМОЕ ПОДКЛЮЧЕНИЕ'], ['cancel', 'ОТМЕНА']], on: id => { if (id === 'tcp') ui.modal = { text: 'Поиск игр в локальной сети...\n\nИгр не найдено. Убедитесь, что протокол TCP/IP установлен и сеть подключена.', buttons: [['ok', 'ОК']] }; else if (id === 'direct') ui.modal = { text: 'Не найден модем или кабель прямого подключения.', buttons: [['ok', 'ОК']] }; else ui.modal = null; } };
        else if (b.id === 'credits') ui.go('credits');
        else if (b.id === 'cine') ui.modal = { text: 'Видеоролики', buttons: [['prologue', 'ПРОЛОГ']].concat(ui.anySeen('act1end') ? [['act1end', 'КОНЕЦ АКТА I']] : []).concat([['cancel', 'ОТМЕНА']]), on: id => { ui.modal = null; if (id !== 'cancel') ui.playCine(id, () => ui.go('menu')); } };
        else if (b.id === 'exit') ui.exit();
        return;
      }
    }
  };

  const Select = {
    draw(ui, c) {
      c.drawImage(nightScene('select'), 0, 0);
      campfire(c, W / 2, 560, ui.t, 0.6);
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, W, H);
      logo(c, W / 2, 86, ui.t, 0.45);
      const chars = ui.chars();
      const pr = { x: 90, y: 110, w: 620, h: 380 };
      c.fillStyle = 'rgba(10,8,6,0.8)'; c.fillRect(pr.x, pr.y, pr.w, pr.h);
      HU().frame(c, pr.x, pr.y, pr.w, pr.h);
      ui.selSlots = [];
      chars.forEach((ch, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const r = { x: pr.x + 16 + col * 300, y: pr.y + 16 + row * 88, w: 288, h: 80 };
        if (row > 3) return;
        const sel = ui.selIdx === i;
        c.fillStyle = sel ? 'rgba(90,70,30,0.55)' : inR(ui.mx, ui.my, r) ? 'rgba(60,50,30,0.4)' : 'rgba(0,0,0,0.3)';
        c.fillRect(r.x, r.y, r.w, r.h);
        c.strokeStyle = sel ? '#e0c070' : '#5a4a30'; c.lineWidth = 1; c.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        const sp = D.Sprites.sprite(D.Models.portraitModel(ch.cls), sel ? 'idle' : 'idle', (ui.t * 0.3) % 1, Math.PI / 4 + 0.3);
        c.save(); c.beginPath(); c.rect(r.x + 4, r.y + 4, 70, r.h - 8); c.clip();
        c.drawImage(sp.cv, r.x + 38 - sp.ox * 0.9, r.y + r.h + 4 - sp.oy * 0.9, sp.w * 0.9, sp.h * 0.9);
        c.restore();
        HU().text(c, ch.name, r.x + 82, r.y + 24, ch.dead ? COL.red : COL.gold, 16);
        HU().text(c, 'Уровень ' + ch.level + ' · ' + CLASSES[ch.cls].name, r.x + 82, r.y + 44, COL.white, 13);
        HU().text(c, (ch.hc ? (ch.dead ? 'Хардкор — погиб' : 'Хардкор') : 'Акт I') + ' · ' + D.DIFFS[Math.min(2, ch.maxDiff || 0)], r.x + 82, r.y + 62, ch.hc ? COL.red : COL.dim, 12);
        ui.selSlots.push({ i, r });
      });
      if (!chars.length) HU().text(c, 'Нет персонажей. Создайте нового.', W / 2, pr.y + 180, COL.dim, 16, 'center');
      this.btns = [
        { id: 'new', r: { x: 110, y: 500, w: 250, h: 32 }, l: 'СОЗДАТЬ ПЕРСОНАЖА' },
        { id: 'del', r: { x: 440, y: 500, w: 250, h: 32 }, l: 'УДАЛИТЬ ПЕРСОНАЖА', dis: ui.selIdx < 0 || !chars[ui.selIdx] },
        { id: 'exit', r: { x: 30, y: 552, w: 140, h: 32 }, l: 'ВЫХОД' },
        { id: 'ok', r: { x: 630, y: 552, w: 140, h: 32 }, l: 'ОК', dis: ui.selIdx < 0 || !chars[ui.selIdx] || chars[ui.selIdx].dead }
      ];
      for (const b of this.btns) stoneButton(c, b.r, b.l, inR(ui.mx, ui.my, b.r), false, b.dis);
    },
    click(ui, mx, my, dbl) {
      for (const s of ui.selSlots || []) if (inR(mx, my, s.r)) { ui.selIdx = s.i; ui.audio.sfx('ui_click'); if (dbl) this.play(ui); return; }
      for (const b of this.btns || []) if (inR(mx, my, b.r) && !b.dis) {
        ui.audio.sfx('ui_click');
        if (b.id === 'new') ui.go('create');
        else if (b.id === 'exit') ui.go('menu');
        else if (b.id === 'ok') this.play(ui);
        else if (b.id === 'del') { const ch = ui.chars()[ui.selIdx]; ui.modal = { text: 'Удалить персонажа «' + ch.name + '»?\nЭто действие нельзя отменить.', buttons: [['yes', 'УДАЛИТЬ'], ['no', 'ОТМЕНА']], on: id => { ui.modal = null; if (id === 'yes') ui.deleteChar(ch.name); } }; }
      }
    },
    play(ui) {
      const ch = ui.chars()[ui.selIdx];
      if (!ch || ch.dead) return;
      const max = Math.min(2, ch.maxDiff || 0);
      if (max === 0) { ui.startGame(ch.name, 0); return; }
      const btns = D.DIFFS.map((d, i) => [String(i), d.toUpperCase(), i > max]);
      btns.push(['cancel', 'ОТМЕНА']);
      ui.modal = { text: 'Выберите сложность', buttons: btns, on: id => { ui.modal = null; if (id !== 'cancel') ui.startGame(ch.name, +id); } };
    }
  };

  const Create = {
    pos(i) {
      const a = (i - 3) / 3.3;
      return { x: W / 2 + Math.sin(a * 1.45) * 310, y: 520 - Math.cos(a * 1.45) * 85 };
    },
    draw(ui, c) {
      c.drawImage(nightScene('create', 'gate'), 0, 0);
      HU().text(c, 'Выбор класса', W / 2, 40, COL.gold, 26, 'center', true);
      const sel = ui.createSel;
      ui.createSlots = [];
      const order = CLASS_ORDER.map((cls, i) => ({ cls, i, p: this.pos(i) })).sort((a, b) => a.p.y - b.p.y);
      for (const { cls, i, p } of order) {
        const isSel = sel === cls;
        const hov = !sel && inR(ui.mx, ui.my, { x: p.x - 30, y: p.y - 112, w: 60, h: 118 });
        const step = isSel ? Math.min(1, (ui.t - ui.createT) * 2) : 0;
        const x = p.x + (W / 2 - p.x) * step * 0.25, y = p.y + step * 34;
        const face = Math.atan2(540 - y, W / 2 - x) + Math.PI / 4;
        const anim = isSel && step < 1 ? 'walk' : isSel ? 'special' : 'idle';
        const ph = isSel && step >= 1 ? Math.min(0.999, (ui.t - ui.createT - 0.5) / 1.4) : (ui.t * 0.35 + i * 0.13) % 1;
        const sp = D.Sprites.sprite(D.Models.portraitModel(cls), anim, Math.max(0, ph), isSel && step >= 1 ? Math.PI / 4 : face);
        const sc = 1.55;
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(x + 4, y + 2, 22, 8, 0, 0, TAU); c.fill();
        c.filter = isSel || hov ? 'brightness(1.25)' : sel ? 'brightness(0.4) saturate(0.5)' : 'brightness(0.72)';
        c.drawImage(sp.cv, x - sp.ox * sc, y - sp.oy * sc, sp.w * sc, sp.h * sc);
        c.filter = 'none';
        if (hov) HU().text(c, CLASSES[cls].name, x, y - 120, COL.gold, 16, 'center');
        ui.createSlots.push({ cls, r: { x: p.x - 30, y: p.y - 112, w: 60, h: 118 } });
      }
      campfire(c, W / 2, 540, ui.t, 0.8);
      if (sel) {
        const C = CLASSES[sel];
        c.fillStyle = 'rgba(0,0,0,0.72)'; c.fillRect(20, 60, 300, 170);
        HU().frame(c, 20, 60, 300, 170);
        HU().text(c, C.name, 170, 90, COL.gold, 22, 'center', true);
        c.font = '13px ' + FONT;
        HU().wrap(c, C.desc, 270).forEach((l, i) => HU().text(c, l, 34, 116 + i * 17, COL.white, 13));
        HU().text(c, 'Сила ' + C.str + '  Ловкость ' + C.dex + '  Живучесть ' + C.vit + '  Энергия ' + C.ene, 170, 218, COL.dim, 11, 'center');
        const nb = { x: 290, y: 556, w: 220, h: 28 };
        c.fillStyle = '#0a0806'; c.fillRect(nb.x, nb.y, nb.w, nb.h);
        c.strokeStyle = '#8a7650'; c.strokeRect(nb.x + 0.5, nb.y + 0.5, nb.w - 1, nb.h - 1);
        HU().text(c, 'Имя персонажа', nb.x + nb.w / 2, nb.y - 6, COL.gold, 12, 'center');
        HU().text(c, ui.nameInput + (Math.floor(ui.t * 2) % 2 ? '|' : ''), nb.x + 8, nb.y + 19, COL.white, 15);
        const hc = { x: 530, y: 560, w: 20, h: 20 };
        c.fillStyle = '#0a0806'; c.fillRect(hc.x, hc.y, hc.w, hc.h); c.strokeStyle = '#8a7650'; c.strokeRect(hc.x + 0.5, hc.y + 0.5, 19, 19);
        if (ui.hardcore) HU().text(c, '✔', hc.x + 10, hc.y + 16, '#ff4040', 16, 'center');
        HU().text(c, 'Хардкор', hc.x + 28, hc.y + 15, ui.hardcore ? COL.red : COL.white, 13);
        this.hcBox = hc;
        if (ui.createErr) HU().text(c, ui.createErr, W / 2, 596, COL.red, 12, 'center');
      } else HU().text(c, 'Выберите героя у костра', W / 2, 575, COL.white, 16, 'center');
      this.btns = [{ id: 'cancel', r: { x: 30, y: 552, w: 140, h: 32 }, l: sel ? 'ОТМЕНА' : 'ВЫХОД' }, { id: 'ok', r: { x: 630, y: 552, w: 140, h: 32 }, l: 'ОК', dis: !sel || !ui.nameInput.trim() }];
      for (const b of this.btns) stoneButton(c, b.r, b.l, inR(ui.mx, ui.my, b.r), false, b.dis);
    },
    click(ui, mx, my) {
      for (const b of this.btns || []) if (inR(mx, my, b.r) && !b.dis) {
        ui.audio.sfx('ui_click');
        if (b.id === 'cancel') { if (ui.createSel) { ui.createSel = null; ui.createErr = ''; } else ui.go('select'); }
        else this.confirm(ui);
        return;
      }
      if (ui.createSel && this.hcBox && inR(mx, my, { x: this.hcBox.x, y: this.hcBox.y, w: 90, h: 20 })) { ui.hardcore = !ui.hardcore; return; }
      if (!ui.createSel) for (const s of ui.createSlots || []) if (inR(mx, my, s.r)) { ui.createSel = s.cls; ui.createT = ui.t; ui.audio.sfx('select_' + s.cls); ui.nameInput = ''; ui.createErr = ''; return; }
    },
    key(ui, e) {
      if (!ui.createSel) return;
      if (e.key === 'Backspace') { ui.nameInput = ui.nameInput.slice(0, -1); return; }
      if (e.key === 'Enter') { this.confirm(ui); return; }
      if (e.key.length === 1 && /[A-Za-zА-Яа-яЁё0-9_\- ]/.test(e.key) && ui.nameInput.length < 15) ui.nameInput += e.key;
    },
    confirm(ui) {
      const name = ui.nameInput.trim();
      if (name.length < 2) { ui.createErr = 'Имя должно содержать хотя бы 2 символа'; return; }
      if (ui.chars().some(ch => ch.name.toLowerCase() === name.toLowerCase())) { ui.createErr = 'Персонаж с таким именем уже существует'; return; }
      ui.createChar(name, ui.createSel, ui.hardcore);
    }
  };

  const CREDITS = [
    ['DIABLO II', 3], ['Win 98 Edition', 1], ['', 1],
    ['Акт I: Лагерь разбойниц', 2], ['', 1],
    ['Геймдизайн и программирование', 2], ['Тёмный странник и его последователи', 1], ['', 1],
    ['Графика', 2], ['Каждый пиксель нарисован кодом', 1], ['Изометрия 2:1, 800 × 600', 1], ['', 1],
    ['Звук и музыка', 2], ['Синтезатор Web Audio', 1], ['Гитара Тристрама и барабаны Катакомб', 1], ['', 1],
    ['Процедурные уровни', 2], ['Кровавая пустошь, которая каждый раз новая', 1], ['', 1],
    ['Отдельная благодарность', 2], ['Акаре — за исцеление', 1], ['Чарси — за молот', 1], ['Гиду — за честные ставки', 1], ['Декарду Каину — за мудрость', 1], ['Вирту — за ногу', 1], ['', 1],
    ['Ни одна разбойница не пострадала при создании игры.', 1], ['Кроме Кровавого Ворона.', 1], ['', 2],
    ['Оставайся ненадолго и послушай...', 2]
  ];

  const Credits = {
    draw(ui, c) {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      campfire(c, W / 2, H + 40, ui.t, 0.5);
      const t = ui.t - ui.creditsT;
      let y = H + 20 - t * 32;
      for (const [s, size] of CREDITS) {
        const fs = size === 3 ? 38 : size === 2 ? 20 : 15;
        if (y > -40 && y < H + 40) HU().text(c, s, W / 2, y, size >= 2 ? COL.gold : COL.white, fs, 'center', size === 3);
        y += fs + 12;
      }
      if (y < -40) ui.go('menu');
    },
    click(ui) { ui.go('menu'); }
  };

  const SCENES = {
    prologue: [
      { d: 8, text: 'Тристрам пал. Те немногие, кто выжил, рассказывают о страннике в чёрном плаще, что ушёл на восток, едва стихли крики в подземельях собора.', draw: 'tavern' },
      { d: 8, text: 'Там, где он проходит, земля чернеет, а мёртвые встают из могил. Он не спит и не ест. Что-то внутри него ведёт его дальше.', draw: 'road' },
      { d: 9, text: 'Первыми пали Сёстры Незрячего Ока. Демоница Андариэль, Дева Мук, захватила их монастырь. Уцелевшие разбойницы укрылись в лагере на краю Кровавой пустоши — и ждут героя.', draw: 'monastery' }
    ],
    act1end: [
      { d: 8, text: 'Андариэль повержена, и сёстры снова свободны. На рассвете караван Варрива трогается в путь — на восток, через перевал, в пески Арамата.', draw: 'caravan' },
      { d: 8, text: 'Но Тёмный странник уже далеко. Его путь лежит в Лут Голейн — к затерянной гробнице Тал Раши, где томится Баал, Владыка Разрушения.', draw: 'desert' },
      { d: 7, text: 'Конец Акта I. Открыт новый уровень сложности.', draw: 'title' }
    ]
  };

  function drawCineScene(c, kind, t, p) {
    const zoom = 1 + p * 0.06;
    c.save();
    c.translate(W / 2, H / 2); c.scale(zoom, zoom); c.translate(-W / 2, -H / 2);
    const rng = new D.RNG(D.strHash(kind));
    if (kind === 'tavern') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0e18'); g.addColorStop(1, '#040404'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (const [x, w, h] of [[80, 180, 260], [300, 240, 320], [580, 160, 230]]) {
        c.fillStyle = '#0e0c0a'; c.fillRect(x, H - 120 - h, w, h + 120);
        c.beginPath(); c.moveTo(x - 20, H - 120 - h); c.lineTo(x + w / 2, H - 200 - h); c.lineTo(x + w + 20, H - 120 - h); c.fill();
        for (let i = 0; i < 2; i++) { const wx = x + 30 + i * (w - 80), wy = H - h + 10; c.fillStyle = 'rgba(255,170,60,' + (0.6 + Math.sin(t * 7 + i) * 0.1) + ')'; c.fillRect(wx, wy, 26, 34); }
      }
      c.strokeStyle = 'rgba(160,170,200,0.3)'; c.lineWidth = 1;
      for (let i = 0; i < 120; i++) { const x = (rng.int(0, W) + t * 60) % W, y = (rng.int(0, H) + t * 400) % H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y + 14); c.stroke(); }
    } else if (kind === 'road') {
      c.fillStyle = '#05060a'; c.fillRect(0, 0, W, H);
      if (Math.sin(t * 3.1) > 0.97 || (t % 4 < 0.08)) { c.fillStyle = 'rgba(200,210,255,0.5)'; c.fillRect(0, 0, W, H); }
      c.fillStyle = '#1a1712'; c.beginPath(); c.moveTo(W / 2 - 30, H * 0.5); c.lineTo(W / 2 + 30, H * 0.5); c.lineTo(W, H); c.lineTo(0, H); c.fill();
      for (let i = 0; i < 12; i++) { const x = i % 2 ? rng.int(20, 280) : rng.int(520, 780), s = rng.range(0.6, 1.6); c.strokeStyle = '#0a0806'; c.lineWidth = 6 * s; c.beginPath(); c.moveTo(x, H * 0.75); c.lineTo(x + rng.range(-20, 20), H * 0.75 - 200 * s); c.stroke(); c.lineWidth = 2 * s; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x, H * 0.75 - 100 * s - k * 30 * s); c.lineTo(x + rng.range(-70, 70) * s, H * 0.75 - 160 * s - k * 30 * s); c.stroke(); } }
      const fy = H * 0.6 - p * 60, fs = 1.2 - p * 0.6;
      c.fillStyle = '#000'; c.beginPath(); c.moveTo(W / 2 - 18 * fs, fy + 60 * fs); c.lineTo(W / 2 - 10 * fs, fy); c.arc(W / 2, fy - 4 * fs, 10 * fs, Math.PI, TAU); c.lineTo(W / 2 + 18 * fs, fy + 60 * fs); c.fill();
    } else if (kind === 'monastery') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#300808'); g.addColorStop(0.6, '#801808'); g.addColorStop(1, '#100404'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = '#0a0404';
      c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.7); c.lineTo(250, H * 0.55); c.lineTo(420, H * 0.6); c.lineTo(W, H * 0.72); c.lineTo(W, H); c.fill();
      for (const [x, w, h] of [[300, 40, 190], [360, 120, 120], [500, 40, 170], [260, 260, 60]]) c.fillRect(x, H * 0.58 - h, w, h + 10);
      for (const x of [320, 520]) { c.beginPath(); c.moveTo(x - 25, H * 0.58 - (x === 320 ? 190 : 170)); c.lineTo(x, H * 0.58 - (x === 320 ? 250 : 225)); c.lineTo(x + 25, H * 0.58 - (x === 320 ? 190 : 170)); c.fill(); }
      c.fillStyle = 'rgba(255,120,40,0.7)'; for (let i = 0; i < 6; i++) c.fillRect(370 + i * 16, H * 0.58 - 80, 6, 12);
    } else if (kind === 'caravan') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d8a070'); g.addColorStop(0.5, '#f0c890'); g.addColorStop(0.6, '#c89050'); g.addColorStop(1, '#6a4a2a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const sg = c.createRadialGradient(W * 0.7, H * 0.52, 5, W * 0.7, H * 0.52, 90); sg.addColorStop(0, '#fff8d0'); sg.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = sg; c.beginPath(); c.arc(W * 0.7, H * 0.52, 90, 0, TAU); c.fill();
      c.fillStyle = '#5a3a20'; c.beginPath(); c.moveTo(0, H * 0.6); for (let x = 0; x <= W; x += 40) c.lineTo(x, H * 0.6 + Math.sin(x * 0.01) * 12); c.lineTo(W, H); c.lineTo(0, H); c.fill();
      for (let i = 0; i < 3; i++) { const x = 120 + i * 170 + p * 80, y = H * 0.66; c.fillStyle = '#2a1a10'; c.fillRect(x, y - 30, 90, 30); c.fillStyle = '#e8d8b0'; c.beginPath(); c.moveTo(x - 4, y - 30); c.quadraticCurveTo(x + 45, y - 80, x + 94, y - 30); c.fill(); for (const wx of [x + 15, x + 75]) { c.strokeStyle = '#1a1008'; c.lineWidth = 3; c.beginPath(); c.arc(wx, y + 2, 11, 0, TAU); c.stroke(); } }
    } else if (kind === 'desert') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a0a14'); g.addColorStop(1, '#3a2010'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = '#6a4a2a'; c.fillRect(0, H * 0.72, W, H * 0.28);
      c.fillStyle = '#4a3420'; c.fillRect(W / 2 - 160, H * 0.2, 320, H * 0.52);
      c.fillStyle = '#050302'; c.fillRect(W / 2 - 50, H * 0.4, 100, H * 0.32);
      for (let i = 0; i < 6; i++) { c.fillStyle = '#3a2818'; c.fillRect(W / 2 - 150 + i * 60, H * 0.2 - 20, 30, 20); }
      const a = 0.5 + Math.sin(t * 2) * 0.4;
      c.fillStyle = 'rgba(255,40,20,' + a + ')'; c.fillRect(W / 2 - 12, H * 0.5, 6, 3); c.fillRect(W / 2 + 6, H * 0.5, 6, 3);
    } else {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      logo(c, W / 2, H / 2 - 20, t, 0.8);
    }
    c.restore();
  }

  const Cine = {
    draw(ui, c) {
      const sc = SCENES[ui.cine.id];
      const t = ui.t - ui.cine.t0;
      let acc = 0, idx = 0;
      while (idx < sc.length && t > acc + sc[idx].d) { acc += sc[idx].d; idx++; }
      if (idx >= sc.length) { this.finish(ui); return; }
      const s = sc[idx];
      const lt = t - acc, p = lt / s.d;
      drawCineScene(c, s.draw, ui.t, p);
      const fade = Math.min(1, lt / 0.8, (s.d - lt) / 0.8);
      c.fillStyle = 'rgba(0,0,0,' + (1 - Math.max(0, fade)) + ')'; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, H - 110, W, 110);
      c.font = '17px ' + FONT;
      HU().wrap(c, s.text, W - 120).forEach((l, i) => HU().text(c, l, W / 2, H - 76 + i * 24, '#e8e0c8', 17, 'center'));
      HU().text(c, 'Esc — пропустить', W - 10, 18, 'rgba(200,200,200,0.4)', 11, 'right');
    },
    finish(ui) { const cb = ui.cine.done; ui.cine = null; if (cb) cb(); },
    click(ui) { this.finish(ui); }
  };

  function drawModal(ui, c) {
    const m = ui.modal;
    if (!m) return;
    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, W, H);
    c.font = '15px ' + FONT;
    const lines = HU().wrap(c, m.text, 380);
    const w = 440, h = 60 + lines.length * 22 + m.buttons.length * 40;
    const x = W / 2 - w / 2, y = H / 2 - h / 2;
    c.fillStyle = 'rgba(14,12,10,0.96)'; c.fillRect(x, y, w, h);
    HU().frame(c, x, y, w, h);
    lines.forEach((l, i) => HU().text(c, l, W / 2, y + 36 + i * 22, COL.white, 15, 'center'));
    m.rects = [];
    m.buttons.forEach(([id, lbl, dis], i) => {
      const r = { x: W / 2 - 130, y: y + 46 + lines.length * 22 + i * 40, w: 260, h: 32 };
      stoneButton(c, r, lbl, inR(ui.mx, ui.my, r), true, dis);
      m.rects.push({ id, r, dis });
    });
    if (m.spinner) { c.save(); c.translate(W / 2, y + h - 30); c.rotate(ui.t * 3); c.strokeStyle = '#c04020'; c.lineWidth = 2; star5(c, 14); c.restore(); }
  }

  function star5(c, r) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 4 * Math.PI / 5 - Math.PI / 2; if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r); else c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); c.beginPath(); c.arc(0, 0, r * 1.1, 0, TAU); c.stroke(); }

  function modalClick(ui, mx, my) {
    const m = ui.modal;
    if (!m || !m.rects) return;
    for (const b of m.rects) if (inR(mx, my, b.r) && !b.dis) { ui.audio.sfx('ui_click'); if (m.on) m.on(b.id); else ui.modal = null; return; }
  }

  function loading(ui, c) {
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W / 2, H / 2 - 20); c.rotate(ui.t * 2);
    c.strokeStyle = '#b02010'; c.lineWidth = 3; star5(c, 60);
    c.restore();
    HU().text(c, 'Загрузка...', W / 2, H / 2 + 80, COL.gold, 16, 'center');
  }

  D.Screens = { Menu, Select, Create, Credits, Cine, drawModal, modalClick, loading, logo, campfire, stoneButton, nightScene };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
