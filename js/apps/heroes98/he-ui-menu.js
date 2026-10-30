(function (H) {
  'use strict';
  const A = H.Art;
  const hit = (b, x, y) => x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h;
  const PANGRAM = 'Съешь же ещё этих мягких французских булок, да выпей чаю. 0123456789';

  class TrialMenu {
    constructor(ui) {
      this.ui = ui;
      this.hot = -1;
      this.buttons = H.TRIALS.map((t, i) => ({ x: 220, y: 150 + i * 62, w: 360, h: 30, label: (i + 1) + '. ' + t.name, i }));
      this.buttons.push({ x: 220, y: 470, w: 176, h: 26, label: '6. Пробная карта', i: -3 }, { x: 404, y: 470, w: 176, h: 26, label: '0. Стиль-лист', i: -2 }, { x: 220, y: 502, w: 360, h: 22, label: 'В главное меню', i: -4 });
    }

    update() {}

    pointer(type, x, y, btn) {
      const b = this.buttons.find(o => hit(o, x, y));
      this.hot = b ? b.i : -1;
      this.ui.gfx.cursor('arrow');
      if (type !== 'down' || btn !== 0 || !b) return;
      if (b.i === -3) this.ui.startMap();
      else if (b.i === -4) this.ui.toTitle();
      else if (b.i === -2) this.ui.show(new StyleSheet(this.ui));
      else this.ui.startTrial(b.i);
    }

    key(code) {
      const n = code.startsWith('Digit') ? +code.slice(5) : -1;
      if (n === 0) this.ui.show(new StyleSheet(this.ui));
      else if (n === 6) this.ui.startMap();
      else if (n >= 1 && n <= H.TRIALS.length) this.ui.startTrial(n - 1);
    }

    draw(g) {
      const c = g.ctx;
      c.fillStyle = '#10183a';
      c.fillRect(0, 0, H.W, H.H);
      g.panel(190, 70, 420, 480);
      g.text('Пробные бои', H.W / 2, 100, { align: 'center', serif: true });
      g.text('Серый бой: вместо картинок заглушки', H.W / 2, 126, { align: 'center', color: '#c8b88a' });
      for (const b of this.buttons) {
        g.button({ ...b, hot: this.hot === b.i });
        if (b.i >= 0) g.text(H.TRIALS[b.i].about + (H.TRIALS[b.i].player ? ' · вы справа' : ' · вы слева'), b.x + 4, b.y + b.h + 12, { size: 10, color: '#c8b88a' });
      }
      g.text('Цифры 1–5 — бой, 6 — карта, 0 — стиль-лист, Esc — меню', H.W / 2, 536, { align: 'center', size: 10, color: '#a89870' });
    }
  }

  const PAGES = ['Шрифты, рамки, курсоры', 'Цвета игроков и народов', 'Существа на поле боя', 'Карта и город'];

  class StyleSheet {
    constructor(ui, page) {
      this.ui = ui;
      this.page = page || 0;
      this.hot = null;
      this.buttons = [{ id: 'prev', label: '← Назад', x: 470, y: 566, w: 96, h: 24 }, { id: 'next', label: 'Дальше →', x: 572, y: 566, w: 96, h: 24 }, { id: 'list', label: 'К боям', x: 674, y: 566, w: 112, h: 24 }];
      this.flag = null;
    }

    update() {}

    go(d) {
      this.page = (this.page + d + PAGES.length) % PAGES.length;
    }

    pointer(type, x, y, btn) {
      const b = this.buttons.find(o => hit(o, x, y));
      this.hot = b ? b.id : null;
      this.ui.gfx.cursor('arrow');
      if (type !== 'down' || btn !== 0 || !b) return;
      if (b.id === 'prev') this.go(-1);
      else if (b.id === 'next') this.go(1);
      else this.ui.showTrials();
    }

    key(code) {
      if (code === 'KeyA' || code === 'Digit1') this.go(-1);
      else if (code === 'KeyD' || code === 'Digit2') this.go(1);
    }

    flagSprite() {
      if (this.flag) return this.flag;
      const base = document.createElement('canvas'), mask = document.createElement('canvas');
      for (const c of [base, mask]) {
        c.width = 32;
        c.height = 40;
      }
      const b = base.getContext('2d'), m = mask.getContext('2d');
      b.fillStyle = '#5a3a1a';
      b.fillRect(4, 2, 3, 38);
      b.fillStyle = '#c8a040';
      b.fillRect(3, 0, 5, 3);
      for (let y = 0; y < 18; y++) {
        for (let x = 0; x < 22; x++) {
          const wave = Math.sin((x + y * 0.3) * 0.5) * 0.18, v = Math.round(255 * (0.62 + wave + (y < 2 ? 0.2 : 0)));
          m.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
          m.fillRect(7 + x, 4 + y + Math.round(Math.sin(x * 0.4) * 1.5), 1, 1);
        }
      }
      this.flag = { base, mask };
      return this.flag;
    }

    draw(g) {
      const c = g.ctx;
      c.fillStyle = '#0c1228';
      c.fillRect(0, 0, H.W, H.H);
      g.panel(0, 0, H.W, 40, 'plate');
      g.text('Стиль-лист Heroes 98 · ' + (this.page + 1) + '/' + PAGES.length + ' · ' + PAGES[this.page], 14, 20, { serif: true });
      [this.pageFonts, this.pageColors, this.pageCreatures, this.pageMap][this.page].call(this, g, c);
      g.text('A, D — листать', 14, 578, { size: 10, color: '#a89870' });
      for (const b of this.buttons) g.button({ ...b, hot: this.hot === b.id });
    }

    pageFonts(g, c) {
      let y = 58;
      for (const [font, label] of [['small', 'мелкий: числа на отрядах, подписи'], ['text', 'обычный: окна, журнал'], ['bold', 'жирный: имена, заголовки окон'], ['title', 'заголовок с засечками'], ['big', 'крупный: победа, раунд']]) {
        g.text(label, 14, y, { size: 10, color: '#a89870' });
        g.text(font === 'big' ? 'Тысячелетие Семилунья' : PANGRAM, 14, y + 16 + (font === 'big' ? 6 : 0), { font });
        y += font === 'big' ? 58 : font === 'title' ? 46 : 40;
      }
      g.panel(14, 318, 200, 120);
      g.text('Лунный металл', 114, 340, { align: 'center', bold: true });
      g.text('рамка окна', 114, 360, { align: 'center', size: 10, color: '#c8b88a' });
      g.panel(230, 318, 200, 44, 'plate');
      g.text('пластина: панели и полосы', 330, 340, { align: 'center', size: 10 });
      g.panel(230, 372, 200, 44, 'tip');
      g.text('подсказка у курсора', 330, 394, { align: 'center', size: 10 });
      [['Обычная', {}], ['Под курсором', { hot: true }], ['Нажата', { down: true }], ['Недоступна', { off: true }]].forEach(([label, st], i) => g.button({ x: 450 + (i % 2) * 168, y: 318 + Math.floor(i / 2) * 34, w: 160, h: 24, label, ...st }));
      g.text('Курсоры (32×32, рисуются кодом)', 14, 462, { bold: true });
      H.CURSORS.forEach((name, i) => {
        const x = 14 + i * 86;
        c.fillStyle = '#3a4a2a';
        c.fillRect(x, 476, 40, 40);
        c.drawImage(H.cursorImage(name), x + 4, 480);
        g.text(name, x, 528, { size: 10, color: '#c8b88a' });
      });
    }

    pageColors(g, c) {
      g.text('Цвета игроков: на картинках флаги, знамёна, паруса и вымпелы рисуются чистым пурпуром ' + A.TEAM_KEY.toUpperCase() + ' и его оттенками,', 14, 58, { size: 10 });
      g.text('инструмент снимает их в маску, игра красит маску в цвет игрока.', 14, 72, { size: 10 });
      const f = this.flagSprite();
      H.PLAYER_COLORS.forEach((col, i) => {
        const x = 14 + i * 96;
        c.fillStyle = '#3a4a2a';
        c.fillRect(x, 86, 88, 88);
        c.drawImage(H.tint(f.base, f.mask, col), x + 12, 92, 64, 80);
        c.fillStyle = col;
        c.fillRect(x, 178, 88, 10);
        g.text(H.PLAYER_NAMES[i], x + 44, 198, { align: 'center', size: 10 });
      });
      g.text('Палитры народов: опорные цвета для картинок; лист спрайтов не больше 256 цветов', 14, 226, { bold: true });
      Object.entries(A.PALETTES).forEach(([id, p], i) => {
        const y = 244 + i * 34, x = 14;
        g.text(p.name + (A.ADDON.includes(id) ? ' (дополнение)' : ''), x, y + 12, { size: 10 });
        [p.body, p.dark, ...p.colors].forEach((col, k) => {
          c.fillStyle = '#000';
          c.fillRect(x + 150 + k * 40, y, 36, 26);
          c.fillStyle = col;
          c.fillRect(x + 151 + k * 40, y + 1, 34, 24);
        });
        const sample = Object.values(A.UNITS).find(u => u.faction === id && u.tier === 2) || Object.values(A.UNITS).find(u => u.faction === id);
        A.drawUnit(c, sample.id, 560 + (i % 2) * 40, y + 30, { scale: 0.55, tier: false });
      });
    }

    pageCreatures(g, c) {
      g.text('Бой: вид сбоку, камера на 20° выше горизонта. Существа смотрят вправо, другая сторона — зеркало.', 14, 58, { size: 10 });
      g.text('Точка опоры (крест) — середина под ногами. Тени рисует игра, на кадрах теней нет.', 14, 72, { size: 10 });
      const sizes = [['small', '1–3 уровни', 'militia'], ['mid', '4–5 уровни', 'plated'], ['big', 'большие, 2 клетки', 'horseguard']];
      let x = 14;
      for (const [key, label, id] of sizes) {
        const [w, h] = A.FRAME[key], [ax, ay] = A.ANCHOR[key];
        c.strokeStyle = '#8a7a5a';
        c.lineWidth = 1;
        c.strokeRect(x + 0.5, 90.5, w, h);
        A.drawUnit(c, id, x + ax, 90 + ay, { scale: key === 'big' ? 1.2 : 1 });
        c.strokeStyle = '#ff5030';
        c.beginPath();
        c.moveTo(x + ax - 5, 90 + ay);
        c.lineTo(x + ax + 5, 90 + ay);
        c.moveTo(x + ax, 90 + ay - 5);
        c.lineTo(x + ax, 90 + ay + 5);
        c.stroke();
        g.text(w + '×' + h + ' · ' + label, x, 90 + h + 14, { size: 10 });
        x += w + 40;
      }
      g.text('Кадры анимаций', 520, 96, { bold: true });
      A.ANIMS.forEach(([n, k, about], i) => g.text(n + ' — ' + k + ' (' + about + ')', 520, 116 + i * 15, { size: 10 }));
      g.text('shoot — у стрелков, skill — у существ', 520, 116 + A.ANIMS.length * 15, { size: 10, color: '#a89870' });
      g.text('с особым действием', 520, 131 + A.ANIMS.length * 15, { size: 10, color: '#a89870' });
      g.text('Уровни 1–7 на поле (заглушки Лиги и Курганов, 48 пикселей на клетку)', 14, 290, { bold: true });
      const row = ['militia', 'crossbow', 'ringer', 'plated', 'aeronaut', 'horseguard', 'bombard', 'shade', 'horsebow', 'stonewoman', 'eaglespirit', 'saltnoyon', 'bonebull', 'stonekhan'];
      row.forEach((id, i) => {
        const u = A.UNITS[id], cx = 40 + i * 54, cy = 400;
        c.strokeStyle = 'rgba(200,190,150,0.35)';
        c.beginPath();
        c.ellipse(cx, cy + 4, u.big ? 30 : 16, 6, 0, 0, Math.PI * 2);
        c.stroke();
        A.drawUnit(c, id, cx, cy, {});
        g.text(u.name.split(' ')[0], cx, cy + (i % 2 ? 36 : 22), { align: 'center', size: 10, color: '#c8b88a' });
      });
      c.strokeStyle = '#c8b88a';
      c.beginPath();
      c.moveTo(60, 520);
      c.lineTo(300, 520);
      c.moveTo(60, 520);
      c.lineTo(60 + 230 * Math.cos(0.35), 520 - 230 * Math.sin(0.35));
      c.stroke();
      g.text('камера боя: 20°', 200, 500, { size: 10 });
      c.beginPath();
      c.moveTo(380, 540);
      c.lineTo(620, 540);
      c.moveTo(380, 540);
      c.lineTo(380 + 160 * Math.cos(0.87), 540 - 160 * Math.sin(0.87));
      c.stroke();
      g.text('камера карты: 50°', 500, 480, { size: 10 });
    }

    pageMap(g, c) {
      g.text('Карта: клетка 32×32, вид сверху под 50°. Края местности по углам клетки: 16 форм, по 3 варианта.', 14, 58, { size: 10 });
      const cols = { m: '#4a7a3a', w: '#2a5a8a', r: '#8a7448', s: '#c8b880' };
      const map = ['mmmmmmmm', 'mmrrrrmm', 'mmrmmrmm', 'mmrmmrss', 'wwrwwrss', 'wwwwwwss'];
      map.forEach((row, y) => [...row].forEach((ch, x) => {
        c.fillStyle = cols[ch];
        c.fillRect(14 + x * 32, 76 + y * 32, 32, 32);
        c.strokeStyle = 'rgba(0,0,0,0.25)';
        c.strokeRect(14.5 + x * 32, 76.5 + y * 32, 31, 31);
      }));
      g.text('16 форм края (углы, где лежит местность)', 290, 84, { bold: true });
      for (let m = 0; m < 16; m++) {
        const x = 290 + (m % 8) * 40, y = 96 + Math.floor(m / 8) * 40;
        c.fillStyle = '#8a7448';
        c.fillRect(x, y, 32, 32);
        c.fillStyle = '#4a7a3a';
        [[0, 0], [16, 0], [16, 16], [0, 16]].forEach(([dx, dy], k) => { if (m & (1 << k)) c.fillRect(x + dx, y + dy, 16, 16); });
        c.strokeStyle = '#000';
        c.strokeRect(x + 0.5, y + 0.5, 31, 31);
      }
      g.text('Герой на карте: кадр 64×64, 8 направлений × (стоит 1 + идёт 8), флаг пурпуром', 290, 196, { size: 10 });
      c.strokeStyle = '#c8b88a';
      c.strokeRect(290.5, 206.5, 64, 64);
      for (let d = 0; d < 8; d++) {
        const a = d * Math.PI / 4;
        c.beginPath();
        c.moveTo(322, 238);
        c.lineTo(322 + Math.cos(a) * 28, 238 + Math.sin(a) * 28);
        c.stroke();
      }
      g.text('Город: 3D-сцена 800×432, каждая постройка — отдельный слой с прозрачностью, один свет и одна камера', 14, 300, { size: 10 });
      const sx = 14, sy = 316, k = 0.5;
      c.fillStyle = '#2a3a5a';
      c.fillRect(sx, sy, 800 * k, 432 * k);
      const boxes = [['фон', 0, 0, 800, 432], ['управа', 320, 120, 160, 160], ['стены', 0, 300, 800, 132], ['гильдия', 600, 80, 120, 180], ['таверна', 80, 220, 140, 90], ['жилище 1', 220, 260, 100, 80], ['жилище 7', 500, 40, 120, 120], ['особое', 680, 260, 110, 100]];
      boxes.forEach(([name, x, y, w, h], i) => {
        c.strokeStyle = i ? '#e0c070' : '#8a7a5a';
        c.strokeRect(sx + x * k + 0.5, sy + y * k + 0.5, w * k - 1, h * k - 1);
        g.text(name, sx + x * k + 4, sy + y * k + 10, { size: 10 });
      });
      g.text('Слоёв у города около ' + A.TOWN_LAYERS.length + ':', 430, 330, { bold: true });
      A.TOWN_LAYERS.slice(0, 18).forEach(([id], i) => g.text(id, 430 + Math.floor(i / 9) * 90, 350 + (i % 9) * 14, { size: 10 }));
      g.text('и dwell1…dwell7u, special1–4, altar', 430, 350 + 9 * 14, { size: 10, color: '#a89870' });
      g.text('Всего картинок в списке: ' + A.all().length, 430, 500, { bold: true });
    }
  }

  const LABEL = { ok: '#f0e2b8', off: '#7c7466' };
  const rngOf = seed => H.rng(seed);

  const paintNight = (c, ending) => {
    const rows = ending === 'lose' ? ['#04040c', '#07060f', '#0c0a14', '#120d18', '#1a111a', '#22151a'] : ['#050a24', '#08103a', '#0c1a50', '#122462', '#1a3274', '#26447e'];
    rows.forEach((col, i) => {
      c.fillStyle = col;
      c.fillRect(0, i * 50, H.W, 52);
      if (!i) return;
      c.fillStyle = rows[i - 1];
      for (let y = 0; y < 24; y++) {
        const gap = y < 8 ? 2 : y < 16 ? 4 : 8;
        for (let x = (y % 2) * (gap >> 1); x < H.W; x += gap) c.fillRect(x, i * 50 + y, 1, 1);
      }
    });
    const r = rngOf(98);
    for (let i = 0; i < 180; i++) {
      c.fillStyle = r() < 0.2 ? '#ffffff' : '#9cb0dc';
      c.fillRect(Math.floor(r() * H.W), Math.floor(r() * 290), 1, 1);
    }
    const seven = H.MOONS.slice(0, 7);
    seven.forEach((m, i) => {
      const a = Math.PI * (0.92 - i * 0.84 / 6), x = 400 + Math.cos(a) * 340, y = 280 - Math.sin(a) * 160, s = 40;
      H.Art.drawMoon(c, m, x - s / 2, y - s / 2, s);
      c.fillStyle = m.color;
      c.globalAlpha = 0.25;
      for (let k = 0; k < 7; k++) c.fillRect(x - 10 + (k % 2) * 4, 312 + k * 14, 16 - (k % 3) * 4, 3);
      c.globalAlpha = 1;
    });
    const sea = ['#0c2348', '#0a1d3e', '#081834', '#07132a', '#050f20'];
    sea.forEach((col, i) => {
      c.fillStyle = ending === 'lose' ? '#0a0a12' : col;
      c.fillRect(0, 300 + i * 40, H.W, 40);
    });
    const glow = ending === 'lose' ? '#6a5a7a' : '#f4ecc0';
    c.fillStyle = glow;
    c.globalAlpha = 0.18;
    c.beginPath();
    c.arc(400, 288, 26, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.35;
    c.beginPath();
    c.arc(400, 288, 12, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
    c.fillRect(398, 280, 5, 16);
    c.fillRect(392, 286, 17, 4);
    c.globalAlpha = 0.6;
    for (let k = 0; k < 14; k++) c.fillRect(400 - (k % 3) * 3, 302 + k * 11, 2 + (k % 3) * 6, 2);
    c.globalAlpha = 1;
    c.fillStyle = '#141a2c';
    c.beginPath();
    c.moveTo(0, 470);
    for (let x = 0; x <= H.W; x += 40) c.lineTo(x, 452 + Math.sin(x * 0.017) * 12 + Math.sin(x * 0.051) * 5);
    c.lineTo(H.W, H.H);
    c.lineTo(0, H.H);
    c.closePath();
    c.fill();
  };

  const plate = (g, b, label, off, hot) => {
    const c = g.ctx, slant = b.slant || 0;
    const shape = (dx, dy, grow) => {
      c.beginPath();
      c.moveTo(b.x + dx - grow + slant, b.y + dy - grow);
      c.lineTo(b.x + b.w + dx + grow, b.y + dy - grow + 3);
      c.lineTo(b.x + b.w + dx + grow - slant, b.y + b.h + dy + grow);
      c.lineTo(b.x + dx - grow, b.y + b.h + dy + grow - 3);
      c.closePath();
    };
    shape(3, 4, 0);
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fill();
    shape(0, 0, 1);
    c.fillStyle = '#0c0a08';
    c.fill();
    shape(0, 0, 0);
    c.fillStyle = off ? '#3c3a38' : hot ? '#8c8678' : '#6e6a60';
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.fillRect(b.x + slant + 3, b.y + 3, b.w - slant - 8, 2);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(b.x + 6, b.y + b.h - 5, b.w - slant - 8, 2);
    H.Font.draw(c, 'title', label, b.x + b.w / 2 - H.Font.measure('title', label) / 2 + 1, b.y + b.h / 2 - H.Font.DATA.title.h / 2 + 1, off ? '#2a2826' : '#1a1610');
    H.Font.draw(c, 'title', label, b.x + b.w / 2 - H.Font.measure('title', label) / 2, b.y + b.h / 2 - H.Font.DATA.title.h / 2, off ? LABEL.off : hot ? '#fff6d0' : LABEL.ok);
  };

  const MAIN_PLATES = [
    { id: 'new', label: 'Новая игра', x: 60, y: 478, w: 170, h: 40, slant: 8 },
    { id: 'continue', label: 'Продолжить', x: 250, y: 462, w: 170, h: 40, slant: 6 },
    { id: 'load', label: 'Загрузить', x: 440, y: 470, w: 150, h: 40, slant: 9 },
    { id: 'editor', label: 'Редактор карт', x: 610, y: 482, w: 170, h: 38, slant: 5 },
    { id: 'fame', label: 'Зал славы', x: 110, y: 536, w: 150, h: 38, slant: 7 },
    { id: 'credits', label: 'Титры', x: 290, y: 522, w: 120, h: 38, slant: 5 },
    { id: 'workshop', label: 'Мастерская', x: 440, y: 530, w: 150, h: 38, slant: 8 },
    { id: 'exit', label: 'Выход', x: 620, y: 540, w: 120, h: 38, slant: 6 }
  ];
  const NEW_PLATES = [
    { id: 'campaign', label: 'Кампания', x: 90, y: 480, w: 160, h: 40, slant: 8 },
    { id: 'scenario', label: 'Сценарий', x: 280, y: 466, w: 160, h: 40, slant: 6 },
    { id: 'random', label: 'Случайная карта', x: 470, y: 480, w: 200, h: 40, slant: 9 },
    { id: 'duel', label: 'Поединок', x: 180, y: 534, w: 160, h: 38, slant: 7 },
    { id: 'back', label: 'Назад', x: 460, y: 536, w: 120, h: 38, slant: 5 }
  ];
  const CREDITS = ['Heroes 98', 'Пошаговая стратегия: восемь народов Семилунья', '', 'Sevenmoon Games (2000) / Win 98 Edition', '', 'Мир, народы и сюжет придуманы для этой игры.', 'Музыка играет на синтезаторе игры, ноты свои.'];

  class TitleView {
    constructor(ui) {
      this.ui = ui;
      this.theme = 'title';
      this.page = 'main';
      this.hot = null;
      this.tip = '';
      this.last = null;
      this.scene = null;
      H.Save.latest().then(m => { this.last = m; }, () => { this.last = null; });
      ui.music('title');
    }

    update() {}

    plates() {
      return this.page === 'new' ? NEW_PLATES : this.page === 'credits' ? [{ id: 'back', label: 'Назад', x: 340, y: 520, w: 120, h: 38, slant: 5 }] : MAIN_PLATES;
    }

    stateOf(id) {
      if (id === 'continue') return this.last ? '' : 'Сохранений пока нет';
      if (id === 'exit') return this.ui.opts.onExit ? '' : 'Закройте вкладку браузера';
      if (id === 'editor') return 'Редактор карт появится на этапе 11';
      if (id === 'fame') return 'Зал славы появится на этапе 25';
      if (id === 'campaign') return 'Кампании появятся на этапе 14';
      if (id === 'random') return 'Случайные карты появятся на этапе 12';
      if (id === 'duel') return 'Поединок появится на этапе 25';
      return '';
    }

    press(id) {
      if (id === 'new') this.page = 'new';
      else if (id === 'back') this.page = 'main';
      else if (id === 'credits') this.page = 'credits';
      else if (id === 'scenario') this.ui.show(new SetupView(this.ui, this));
      else if (id === 'continue') this.ui.loadFrom(this.last.id);
      else if (id === 'load') this.ui.show(new SaveView(this.ui, this, 'load'));
      else if (id === 'workshop') this.ui.showTrials();
      else if (id === 'exit') this.ui.opts.onExit();
    }

    pointer(type, x, y, btn) {
      const b = this.plates().find(o => hit(o, x, y));
      this.hot = b ? b.id : null;
      this.tip = b ? this.stateOf(b.id) : '';
      this.ui.gfx.cursor(b && !this.tip ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && b && !this.tip) {
        this.ui.sfx('click');
        this.press(b.id);
      }
    }

    key(code) {
      if (code === 'Enter' && this.page === 'main' && this.last) this.press('continue');
    }

    back() {
      this.page = 'main';
      return true;
    }

    draw(g) {
      const c = g.ctx;
      if (!this.scene) {
        this.scene = document.createElement('canvas');
        this.scene.width = H.W;
        this.scene.height = H.H;
        paintNight(this.scene.getContext('2d'));
      }
      c.drawImage(this.scene, 0, 0);
      H.Font.draw(c, 'big', H.TITLE, H.W / 2 - H.Font.measure('big', H.TITLE) / 2 + 2, 42, '#000000');
      H.Font.draw(c, 'big', H.TITLE, H.W / 2 - H.Font.measure('big', H.TITLE) / 2, 40, '#f4e2a8');
      if (this.page === 'credits') {
        g.panel(170, 110, 460, 200);
        CREDITS.forEach((s, i) => g.text(s, H.W / 2, 140 + i * 22, { align: 'center', bold: i === 0 }));
      } else g.text('Пошаговая стратегия: восемь народов Семилунья', H.W / 2, 88, { align: 'center', color: '#c8d4f0' });
      for (const b of this.plates()) plate(g, b, b.label, !!this.stateOf(b.id), this.hot === b.id);
      if (this.tip) g.text(this.tip, H.W / 2, 448, { align: 'center', size: 10, color: '#ffd080' });
      else if (this.page === 'main' && this.last && this.hot === 'continue') g.text(this.last.map + ': ' + this.last.date, H.W / 2, 448, { align: 'center', size: 10, color: '#c8d4f0' });
      else if (this.page === 'main' && this.hot === 'workshop') g.text('Пробные бои, пробная карта и стиль-лист', H.W / 2, 448, { align: 'center', size: 10, color: '#c8d4f0' });
      g.text('Sevenmoon Games (2000) / Win 98 Edition', H.W - 10, 590, { align: 'right', size: 10, color: '#8a94b0' });
    }
  }

  const WHO = { human: 'Человек', ai: 'ИИ', none: 'Нет' };
  const FACTION_NAMES = { random: 'Случайный', league: 'Лига', barrows: 'Курганы' };
  const DIFF_ORDER = ['easy', 'normal', 'hard', 'impossible'];

  class SetupView {
    constructor(ui, parent) {
      this.ui = ui;
      this.parent = parent;
      this.theme = 'title';
      this.regions = [];
      this.hot = null;
      this.size = 'все';
      this.pick(H.Maps.LIST[0]);
      this.difficulty = 'normal';
      this.seed = Math.floor(Math.random() * 1e9);
    }

    pick(rec) {
      this.rec = rec;
      this.slots = Array.from({ length: rec.players }, (_, i) => ({ who: i ? 'ai' : 'human', faction: i % 3 ? 'barrows' : 'league', hid: null }));
      const made = rec.make(), M = made.M, cv = document.createElement('canvas');
      cv.width = M.w;
      cv.height = M.h;
      const g = cv.getContext('2d');
      for (let r = 0; r < M.h; r++) {
        for (let c = 0; c < M.w; c++) {
          g.fillStyle = H.MapData.roadAt(M, 0, c, r) ? '#9a8452' : H.MapDraw.COLORS[H.MapData.terrainAt(M, 0, c, r).id][0];
          g.fillRect(c, r, 1, 1);
        }
      }
      for (const o of M.objs) {
        const def = H.OBJ[o.t];
        if (def.kind === 'decor') continue;
        g.fillStyle = def.kind === 'town' ? '#e8e8e8' : def.kind === 'monster' ? '#ff4030' : def.kind === 'mine' ? '#e8d060' : '#f0e0a0';
        g.fillRect(o.c, o.r, Math.max(1, def.foot[0] - 1), Math.max(1, def.foot[1] - 1));
      }
      made.starts.forEach((st, i) => {
        g.fillStyle = H.PLAYER_COLORS[i];
        g.fillRect(st.town.c - 1, st.town.r - 1, 6, 5);
      });
      this.preview = cv;
      this.goals = H.Adv.goalText(M, M.goals || { win: [{ kind: 'defeat' }], lose: [{ kind: 'all' }] });
    }

    update() {}

    pointer(type, x, y, btn) {
      const r = this.regionAt(x, y);
      this.hot = r ? r.id : null;
      this.ui.gfx.cursor(r && !r.off ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r && !r.off) {
        this.ui.sfx('click');
        r.act();
      }
    }

    key(code) {
      if (code === 'Enter') this.start();
    }

    back() {
      this.ui.show(this.parent);
      return true;
    }

    setHuman(i) {
      this.slots.forEach((s, k) => {
        if (s.who === 'human' && k !== i) s.who = 'ai';
      });
      this.slots[i].who = 'human';
    }

    cycleWho(i) {
      const s = this.slots[i];
      if (s.who === 'human') {
        const other = this.slots.findIndex((q, k) => k !== i && q.who !== 'none');
        if (other < 0) return;
        s.who = 'ai';
        if (!this.slots.some(q => q.who === 'human')) this.setHuman(other);
      } else if (s.who === 'ai') {
        if (this.slots.filter(q => q.who !== 'none').length > 2) s.who = 'none';
        else this.setHuman(i);
      } else s.who = 'ai';
    }

    cycleFaction(i) {
      const s = this.slots[i], all = Object.keys(FACTION_NAMES);
      s.faction = all[(all.indexOf(s.faction) + 1) % all.length];
      s.hid = null;
    }

    cycleHero(i) {
      const s = this.slots[i], pool = s.faction === 'random' ? [] : H.HEROES.filter(x => H.CLASSES[x.cls].faction === s.faction).map(x => x.id), all = [null, ...pool];
      s.hid = all[(all.indexOf(s.hid) + 1) % all.length];
    }

    start() {
      const roll = H.rng(this.seed), slots = this.slots.map(s => (s.who === 'none' ? null : { human: s.who === 'human', hid: s.hid, faction: s.faction === 'random' ? (roll() < 0.5 ? 'league' : 'barrows') : s.faction }));
      this.ui.startGame(H.Maps.build(this.rec.id, { seed: this.seed, slots, difficulty: this.difficulty }));
    }

    draw(g) {
      const c = g.ctx;
      this.regions = [];
      c.fillStyle = '#0a1028';
      c.fillRect(0, 0, H.W, H.H);
      g.text('Настройка партии', H.W / 2, 22, { align: 'center', serif: true });
      g.panel(10, 40, 230, 510);
      g.text('Карты', 26, 60, { bold: true });
      ['все', 'малая', 'средняя'].forEach((sz, i) => {
        this.button(g, 'size-' + sz, sz, 22 + i * 70, 72, 66, 20, () => { this.size = sz; });
      });
      H.Maps.LIST.filter(m => this.size === 'все' || m.size === this.size).forEach((m, i) => {
        const y = 102 + i * 44, id = 'map-' + m.id;
        this.region(id, 22, y, 206, 40, () => this.pick(m));
        c.fillStyle = m === this.rec ? '#22336e' : this.hot === id ? '#1a2850' : '#10183a';
        c.fillRect(22, y, 206, 40);
        g.text(m.name, 30, y + 13, { bold: true, color: m === this.rec ? '#fff6d0' : '#f0e2b8' });
        g.text(m.size + ' ' + m.w + '×' + m.w + ', игроков ' + m.players, 30, y + 29, { size: 10, color: '#c8b88a' });
      });
      g.panel(250, 40, 540, 510);
      c.fillStyle = '#000';
      c.fillRect(264, 54, 148, 148);
      c.imageSmoothingEnabled = false;
      c.drawImage(this.preview, 264, 54, 148, 148);
      g.text(this.rec.name, 424, 62, { serif: true });
      H.Font.wrap('text', this.rec.about, 350).slice(0, 4).forEach((s, i) => g.text(s, 424, 84 + i * 15));
      g.text('Победа: ' + this.goals.win.join(', '), 424, 156, { size: 10, color: '#a0e0a0' });
      g.text('Поражение: ' + this.goals.lose.join(', '), 424, 172, { size: 10, color: '#ffb0a0' });
      g.text('Без города: ' + H.MAP.townless + ' дней, чтобы взять новый', 424, 188, { size: 10, color: '#c8b88a' });
      g.text('Игроки', 264, 222, { bold: true });
      ['Цвет', 'Народ', 'Герой', 'Кто'].forEach((s, i) => g.text(s, [264, 320, 450, 650][i], 240, { size: 10, color: '#c8b88a' }));
      this.slots.forEach((s, i) => {
        const y = 252 + i * 30, off = s.who === 'none';
        c.fillStyle = H.PLAYER_COLORS[i];
        c.fillRect(264, y + 2, 40, 18);
        c.strokeStyle = '#000';
        c.strokeRect(264.5, y + 2.5, 39, 17);
        this.button(g, 'fac-' + i, FACTION_NAMES[s.faction], 320, y, 120, 22, () => this.cycleFaction(i), off);
        const rec = s.hid && H.HEROES.find(x => x.id === s.hid);
        this.button(g, 'hero-' + i, rec ? rec.name : 'Случайный', 450, y, 190, 22, () => this.cycleHero(i), off || s.faction === 'random');
        this.button(g, 'who-' + i, WHO[s.who], 650, y, 110, 22, () => this.cycleWho(i));
      });
      g.text('Сложность', 264, 396, { bold: true });
      DIFF_ORDER.forEach((id, i) => {
        const d = H.DIFFICULTY[id], x = 264 + i * 126;
        this.region('diff-' + id, x, 408, 120, 40, () => { this.difficulty = id; });
        g.button({ x, y: 408, w: 120, h: 40, label: d.name, hot: this.hot === 'diff-' + id, down: this.difficulty === id });
      });
      const d = H.DIFFICULTY[this.difficulty];
      g.text('Золото на старте: ' + Math.round(H.MAP.start.gold * d.start) + '. Доход ИИ ×' + d.income + ', прирост ИИ ×' + d.growth + (d.sees ? ', ИИ видит всю карту' : ''), 264, 466, { size: 10, color: '#c8b88a' });
      g.text('Номер партии: ' + this.seed, 264, 484, { size: 10, color: '#8a94b0' });
      this.button(g, 'start', 'Начать', 620, 500, 150, 30, () => this.start());
      this.button(g, 'back', 'Назад', 460, 500, 150, 30, () => this.back());
    }
  }
  Object.assign(SetupView.prototype, H.Regions);

  class SaveView {
    constructor(ui, parent, mode) {
      this.ui = ui;
      this.parent = parent;
      this.mode = mode;
      this.regions = [];
      this.hot = null;
      this.metas = {};
      this.images = {};
      this.ask = null;
      this.busy = false;
      this.reload();
    }

    reload() {
      H.Save.list().then(list => {
        this.metas = Object.fromEntries(list.map(m => [m.id, m]));
        for (const m of list) {
          if (!m.mini || this.images[m.id + m.when]) continue;
          const img = new Image();
          img.src = m.mini;
          this.images[m.id + m.when] = img;
        }
      }, () => { this.metas = {}; });
    }

    update() {}

    pointer(type, x, y, btn) {
      const r = this.regionAt(x, y);
      this.hot = r ? r.id : null;
      this.ui.gfx.cursor(r && !r.off ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r && !r.off) {
        this.ui.sfx('click');
        r.act();
      }
    }

    key() {}

    back() {
      if (this.ask) this.ask = null;
      else this.ui.show(this.parent);
      return true;
    }

    choose(id) {
      if (this.busy) return;
      if (this.mode === 'load') {
        this.busy = true;
        this.ui.loadFrom(id).then(ok => { this.busy = false; if (!ok) this.reload(); });
        return;
      }
      if (this.metas[id] && !this.ask) {
        this.ask = id;
        return;
      }
      this.ask = null;
      this.busy = true;
      this.ui.saveTo(id).then(ok => {
        this.busy = false;
        if (ok) {
          this.ui.note(H.Save.slotName(id) + ': сохранено');
          this.ui.show(this.parent);
        }
      });
    }

    draw(g) {
      const c = g.ctx;
      this.regions = [];
      c.fillStyle = '#0a0e20';
      c.fillRect(0, 0, H.W, H.H);
      g.text(this.mode === 'save' ? 'Сохранение' : 'Загрузка', H.W / 2, 22, { align: 'center', serif: true });
      H.Save.SLOTS.forEach((id, i) => {
        const col = i % 2, row = Math.floor(i / 2), x = 16 + col * 388, y = 40 + row * 74, m = this.metas[id], writable = id[0] === 'm', off = this.mode === 'save' ? !writable : !m, key = 'slot-' + id;
        this.region(key, x, y, 380, 70, () => this.choose(id), { off });
        c.fillStyle = this.hot === key && !off ? '#1d2c60' : '#121a40';
        c.fillRect(x, y, 380, 70);
        c.strokeStyle = '#6a5430';
        c.strokeRect(x + 0.5, y + 0.5, 379, 69);
        c.fillStyle = '#000';
        c.fillRect(x + 4, y + 3, 64, 64);
        const img = m && this.images[m.id + m.when];
        if (img && img.complete) c.drawImage(img, x + 4, y + 3);
        g.text(H.Save.slotName(id), x + 76, y + 13, { bold: true, color: off && !m ? '#7c7466' : '#f0e2b8' });
        if (m) {
          g.text(m.map + (m.debug ? ' (F7/F8)' : ''), x + 76, y + 30, {});
          g.text(m.date, x + 76, y + 44, { size: 10, color: '#c8b88a' });
          g.text(new Date(m.when).toLocaleString('ru-RU'), x + 76, y + 58, { size: 10, color: '#8a94b0' });
        } else g.text('пусто', x + 76, y + 30, { size: 10, color: '#7c7466' });
      });
      this.button(g, 'back', 'Назад', 340, 568, 120, 26, () => this.back());
      if (this.ask) {
        c.fillStyle = 'rgba(5,7,15,0.6)';
        c.fillRect(0, 0, H.W, H.H);
        g.panel(220, 220, 360, 130);
        g.text('Записать поверх?', H.W / 2, 250, { align: 'center', serif: true });
        g.text(H.Save.slotName(this.ask) + ': ' + this.metas[this.ask].map, H.W / 2, 276, { align: 'center' });
        this.button(g, 'ask-yes', 'Да', 270, 304, 110, 28, () => this.choose(this.ask));
        this.button(g, 'ask-no', 'Нет', 420, 304, 110, 28, () => { this.ask = null; });
      }
    }
  }
  Object.assign(SaveView.prototype, H.Regions);

  const STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1];
  const SPEEDS = [1, 2, 4];

  class SettingsView {
    constructor(ui, parent) {
      this.ui = ui;
      this.parent = parent;
      this.regions = [];
      this.hot = null;
    }

    update() {}

    pointer(type, x, y, btn) {
      const r = this.regionAt(x, y);
      this.hot = r ? r.id : null;
      this.ui.gfx.cursor(r && !r.off ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r && !r.off) {
        r.act();
        this.ui.saveSettings();
        this.ui.sfx('click');
      }
    }

    key() {}

    back() {
      this.ui.show(this.parent);
      return true;
    }

    draw(g) {
      const c = g.ctx, st = this.ui.settings, x = 180, y = 90;
      this.regions = [];
      c.fillStyle = '#0a0e20';
      c.fillRect(0, 0, H.W, H.H);
      g.panel(x, y, 440, 420);
      g.text('Настройки', H.W / 2, y + 28, { align: 'center', serif: true });
      const volume = (key, label, ry) => {
        g.text(label, x + 24, ry + 11, {});
        STEPS.forEach((v, i) => {
          const id = key + i;
          this.region(id, x + 170 + i * 40, ry, 36, 22, () => { st[key] = v; });
          g.button({ x: x + 170 + i * 40, y: ry, w: 36, h: 22, label: String(Math.round(v * 100)), hot: this.hot === id, down: Math.abs(st[key] - v) < 0.01 });
        });
      };
      const speed = (key, label, ry) => {
        g.text(label, x + 24, ry + 11, {});
        SPEEDS.forEach((v, i) => {
          const id = key + i;
          this.region(id, x + 170 + i * 60, ry, 56, 22, () => { st[key] = v; });
          g.button({ x: x + 170 + i * 60, y: ry, w: 56, h: 22, label: v + '×', hot: this.hot === id, down: st[key] === v });
        });
      };
      const flag = (key, label, ry) => {
        g.text(label, x + 24, ry + 11, {});
        this.region(key, x + 340, ry, 76, 22, () => { st[key] = !st[key]; });
        g.button({ x: x + 340, y: ry, w: 76, h: 22, label: st[key] ? 'Да' : 'Нет', hot: this.hot === key, down: st[key] });
      };
      volume('music', 'Музыка', y + 60);
      volume('sound', 'Звуки', y + 92);
      speed('heroSpeed', 'Скорость героя', y + 134);
      speed('battleSpeed', 'Скорость боя', y + 166);
      flag('showAI', 'Показывать ходы ИИ', y + 208);
      flag('autosave', 'Автосохранение', y + 240);
      flag('confirm', 'Спрашивать при конце дня', y + 272);
      this.button(g, 'back', 'Назад', H.W / 2 - 60, y + 370, 120, 28, () => this.back());
    }
  }
  Object.assign(SettingsView.prototype, H.Regions);

  class ResultView {
    constructor(ui, map) {
      this.ui = ui;
      this.map = map;
      this.S = map.S;
      this.regions = [];
      this.hot = null;
      const over = this.S.over;
      this.win = over.winner === map.pid;
      this.theme = this.win ? 'victory' : 'defeat';
      this.score = this.win ? H.Adv.score(this.S) : 0;
      this.scene = null;
      ui.game = null;
    }

    update() {}

    pointer(type, x, y, btn) {
      const r = this.regionAt(x, y);
      this.hot = r ? r.id : null;
      this.ui.gfx.cursor(r ? 'hand' : 'arrow');
      if (type === 'down' && btn === 0 && r) {
        this.ui.sfx('click');
        r.act();
      }
    }

    key() {}

    back() {
      return true;
    }

    draw(g) {
      const c = g.ctx, S = this.S, d = H.DIFFICULTY[S.difficulty], over = S.over;
      this.regions = [];
      if (!this.scene) {
        this.scene = document.createElement('canvas');
        this.scene.width = H.W;
        this.scene.height = H.H;
        paintNight(this.scene.getContext('2d'), this.win ? 'win' : 'lose');
      }
      c.drawImage(this.scene, 0, 0);
      const title = this.win ? 'Победа' : 'Поражение';
      H.Font.draw(c, 'big', title, H.W / 2 - H.Font.measure('big', title) / 2 + 2, 62, '#000000');
      H.Font.draw(c, 'big', title, H.W / 2 - H.Font.measure('big', title) / 2, 60, this.win ? '#ffe080' : '#ff9a8a');
      g.panel(200, 130, 400, 270);
      const lines = [
        ['Карта', S.mapName],
        ['Сложность', d.name],
        ['Народ', H.FACTIONS[S.players[this.map.pid].faction].full],
        ['Дней прошло', String(S.day)],
        ['Итог', this.win ? WHY_WIN[over.why] || 'Цель карты выполнена' : 'Все города и герои потеряны']
      ];
      lines.forEach(([a, b], i) => {
        g.text(a, 226, 168 + i * 28, { size: 10, color: '#c8b88a' });
        g.text(b, 336, 168 + i * 28, {});
      });
      g.text('Очки: ' + this.score, H.W / 2, 330, { align: 'center', serif: true, color: this.win ? '#ffe080' : '#a89870' });
      g.text('Зал славы появится на этапе 25', H.W / 2, 356, { align: 'center', size: 10, color: '#8a94b0' });
      this.button(g, 'menu', 'Главное меню', H.W / 2 - 170, 420, 160, 30, () => this.ui.toTitle());
      this.button(g, 'again', 'Новая партия', H.W / 2 + 10, 420, 160, 30, () => {
        const t = new TitleView(this.ui);
        this.ui.show(new SetupView(this.ui, t));
      });
    }
  }
  Object.assign(ResultView.prototype, H.Regions);
  const WHY_WIN = { defeat: 'Все враги разбиты', town: 'Город взят', gold: 'Золото собрано', hero: 'Вражеский герой побеждён' };

  H.TrialMenu = TrialMenu;
  H.StyleSheet = StyleSheet;
  H.TitleView = TitleView;
  H.SetupView = SetupView;
  H.SaveView = SaveView;
  H.SettingsView = SettingsView;
  H.ResultView = ResultView;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
