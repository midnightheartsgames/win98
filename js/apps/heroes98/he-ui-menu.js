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
      return this.page === 'new' ? NEW_PLATES : MAIN_PLATES;
    }

    stateOf(id) {
      if (id === 'continue') return this.last ? '' : 'Сохранений пока нет';
      if (id === 'exit') return this.ui.opts.onExit ? '' : 'Закройте вкладку браузера';
      return '';
    }

    press(id) {
      if (id === 'new') this.page = 'new';
      else if (id === 'back') this.page = 'main';
      else if (id === 'credits') this.ui.show(new H.CreditsView(this.ui, this));
      else if (id === 'scenario') this.ui.show(new SetupView(this.ui, this));
      else if (id === 'campaign') this.ui.show(new H.CampaignView(this.ui, this));
      else if (id === 'random') this.ui.show(new RandomView(this.ui, this));
      else if (id === 'duel') this.ui.show(new H.DuelView(this.ui, this));
      else if (id === 'fame') this.ui.show(new H.FameView(this.ui, this));
      else if (id === 'continue') this.ui.loadFrom(this.last.id);
      else if (id === 'load') this.ui.show(new SaveView(this.ui, this, 'load'));
      else if (id === 'workshop') this.ui.showTrials();
      else if (id === 'editor') this.ui.openEditor();
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
      g.text('Пошаговая стратегия: восемь народов Семилунья', H.W / 2, 88, { align: 'center', color: '#c8d4f0' });
      for (const b of this.plates()) plate(g, b, b.label, !!this.stateOf(b.id), this.hot === b.id);
      if (this.tip) g.text(this.tip, H.W / 2, 448, { align: 'center', size: 10, color: '#ffd080' });
      else if (this.page === 'main' && this.last && this.hot === 'continue') g.text(this.last.map + ': ' + this.last.date, H.W / 2, 448, { align: 'center', size: 10, color: '#c8d4f0' });
      else if (this.page === 'main' && this.hot === 'workshop') g.text('Пробные бои, пробная карта и стиль-лист', H.W / 2, 448, { align: 'center', size: 10, color: '#c8d4f0' });
      g.text('Sevenmoon Games (2000) / Win 98 Edition', H.W - 10, 590, { align: 'right', size: 10, color: '#8a94b0' });
    }
  }

  const WHO = { human: 'Человек', ai: 'ИИ', none: 'Нет' };
  const TEAMS = [null, 1, 2, 3, 4];
  const MAP_SIZES = ['все', 'малая', 'средняя', 'большая', 'огромная'];
  const MAP_PLAYERS = [['все', () => true], ['2', n => n === 2], ['3–4', n => n >= 3 && n <= 4], ['5–8', n => n >= 5]];
  const LIST_ROWS = 12;
  const teamText = t => (t == null ? 'Нет' : 'Союз ' + t);
  const sharedTeams = players => players.some((p, i) => p.team != null && players.some((q, k) => k !== i && q.team === p.team));
  const oneTeam = slots => {
    const on = slots.filter(s => s.who !== 'none');
    return on.length > 1 && on.every(s => s.team != null && s.team === on[0].team);
  };
  const nextWho = (slots, i, canHuman) => {
    const s = slots[i], active = slots.filter(q => q.who !== 'none').length, humans = slots.filter(q => q.who === 'human').length;
    const order = ['ai', 'human', 'none'];
    for (let k = 1; k <= 3; k++) {
      const who = order[(order.indexOf(s.who) + k) % 3];
      if (who === 'human' && !canHuman) continue;
      if (who === 'none' && active <= 2) continue;
      if (s.who === 'human' && humans <= 1) continue;
      return who;
    }
    return s.who;
  };
  const FACTION_NAMES = { random: 'Случайный', league: 'Лига', barrows: 'Курганы', thicket: 'Чаща', tide: 'Прилив', forge: 'Горнила', throne: 'Престол' };
  const DIFF_ORDER = ['easy', 'normal', 'hard', 'impossible'];

  const mapThumb = (doc, l) => {
    const M = doc.map, cv = document.createElement('canvas');
    cv.width = M.w;
    cv.height = M.h;
    const g = cv.getContext('2d');
    for (let r = 0; r < M.h; r++) {
      for (let c = 0; c < M.w; c++) {
        g.fillStyle = H.MapData.roadAt(M, l, c, r) ? '#9a8452' : H.MapDraw.COLORS[H.MapData.terrainAt(M, l, c, r).id][0];
        g.fillRect(c, r, 1, 1);
      }
    }
    for (const o of M.objs) {
      const def = H.OBJ[o.t];
      if (def.kind === 'decor' || o.l !== l) continue;
      g.fillStyle = def.kind === 'town' ? '#e8e8e8' : def.kind === 'monster' ? '#ff4030' : def.kind === 'mine' ? '#e8d060' : '#f0e0a0';
      g.fillRect(o.c, o.r, Math.max(1, def.foot[0] - 1), Math.max(1, def.foot[1] - 1));
    }
    doc.players.forEach((p, i) => {
      const st = H.MapFile.startOf(doc, i), at = st.town || st.hero;
      if (!at || (at.l || 0) !== l) return;
      g.fillStyle = H.PLAYER_COLORS[i];
      g.fillRect(at.c - 1, at.r - 1, 6, 5);
    });
    return cv;
  };

  const ownRecord = row => ({ id: row.id, name: row.name, size: H.MapFile.sizeName(row.w), w: row.w, players: row.players, about: row.about || 'Карта из редактора.', own: true, get doc() { return H.MapFile.read(row.text); } });

  class SetupView {
    constructor(ui, parent) {
      this.ui = ui;
      this.parent = parent;
      this.theme = 'title';
      this.regions = [];
      this.hot = null;
      this.size = 'все';
      this.count = 0;
      this.top = 0;
      this.own = [];
      this.pick(H.Maps.LIST[0]);
      H.Maps.loadFiles().then(() => { if (this.rec.make) this.pick(this.rec); });
      H.Save.maps.all().then(rows => { this.own = rows.map(ownRecord); }, () => { this.own = []; });
      this.difficulty = 'normal';
      this.seed = Math.floor(Math.random() * 1e9);
    }

    pick(rec) {
      this.rec = rec;
      const doc = H.Maps.docOf(rec), M = doc.map;
      this.doc = doc;
      const first = doc.players.findIndex(p => p.who !== 'ai');
      this.fixedTeams = sharedTeams(doc.players);
      this.slots = doc.players.map((p, i) => ({ who: i === first || (rec.hotseat && p.who !== 'ai') ? 'human' : 'ai', faction: rec.make ? (i % 3 ? 'barrows' : 'league') : this.startFaction(i), hid: null, team: this.fixedTeams ? p.team : null }));
      this.preview = mapThumb(doc, 0);
      this.goals = H.Adv.goalText(M, doc.goals);
    }

    allowed(i) {
      const list = this.doc.players[i].factions;
      return list && list.length ? list : Object.keys(FACTION_NAMES);
    }

    startFaction(i) {
      const st = H.MapFile.startOf(this.doc, i);
      return st.town ? st.town.faction : this.allowed(i)[0];
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

    cycleWho(i) {
      this.slots[i].who = nextWho(this.slots, i, this.doc.players[i].who !== 'ai');
    }

    cycleTeam(i) {
      const s = this.slots[i];
      s.team = TEAMS[(TEAMS.indexOf(s.team) + 1) % TEAMS.length];
    }

    maps() {
      const fits = MAP_PLAYERS[this.count][1];
      return [...H.Maps.LIST.filter(m => m.make || m.doc), ...this.own].filter(m => (this.size === 'все' || m.size === this.size) && fits(m.players));
    }

    scroll(step) {
      this.top = H.clamp(this.top + step * LIST_ROWS, 0, Math.max(0, this.maps().length - LIST_ROWS));
    }

    cycleFaction(i) {
      const s = this.slots[i], all = this.allowed(i);
      s.faction = all[(all.indexOf(s.faction) + 1) % all.length];
      s.hid = null;
    }

    cycleHero(i) {
      const s = this.slots[i], pool = s.faction === 'random' ? [] : H.HEROES.filter(x => !x.story && H.CLASSES[x.cls].faction === s.faction).map(x => x.id), all = [null, ...pool];
      s.hid = all[(all.indexOf(s.hid) + 1) % all.length];
    }

    start() {
      if (oneTeam(this.slots)) return;
      const roll = H.rng(this.seed), slots = this.slots.map(s => (s.who === 'none' ? null : { human: s.who === 'human', hid: s.hid, team: s.team, faction: s.faction === 'random' ? Object.keys(H.FACTIONS)[Math.floor(roll() * Object.keys(H.FACTIONS).length)] : s.faction }));
      this.ui.startGame(H.Maps.play(this.doc, { seed: this.seed, slots, difficulty: this.difficulty }));
    }

    draw(g) {
      const c = g.ctx;
      this.regions = [];
      c.fillStyle = '#0a1028';
      c.fillRect(0, 0, H.W, H.H);
      g.text('Настройка партии', H.W / 2, 22, { align: 'center', serif: true });
      g.panel(10, 40, 230, 510);
      g.text('Карты', 26, 60, { bold: true });
      this.button(g, 'size', 'Размер: ' + this.size, 22, 72, 102, 20, () => {
        this.size = MAP_SIZES[(MAP_SIZES.indexOf(this.size) + 1) % MAP_SIZES.length];
        this.top = 0;
      });
      this.button(g, 'count', 'Игроков: ' + MAP_PLAYERS[this.count][0], 128, 72, 100, 20, () => {
        this.count = (this.count + 1) % MAP_PLAYERS.length;
        this.top = 0;
      });
      const list = this.maps();
      this.top = Math.min(this.top, Math.max(0, list.length - LIST_ROWS));
      list.slice(this.top, this.top + LIST_ROWS).forEach((m, i) => {
        const y = 98 + i * 34, id = 'map-' + m.id;
        this.region(id, 22, y, 206, 32, () => this.pick(m));
        c.fillStyle = m === this.rec ? '#22336e' : this.hot === id ? '#1a2850' : '#10183a';
        c.fillRect(22, y, 206, 32);
        g.text(m.name, 30, y + 11, { bold: true, color: m === this.rec ? '#fff6d0' : '#f0e2b8' });
        g.text(m.size + ' ' + m.w + '×' + m.w + ', игроков ' + m.players + (m.own ? ', своя' : ''), 30, y + 25, { size: 10, color: '#c8b88a' });
      });
      if (!list.length) g.text('Таких карт нет', 125, 120, { align: 'center', size: 10, color: '#c8b88a' });
      this.button(g, 'up', 'Выше', 22, 512, 100, 22, () => this.scroll(-1), this.top <= 0);
      this.button(g, 'down', 'Ниже', 128, 512, 100, 22, () => this.scroll(1), this.top + LIST_ROWS >= list.length);
      g.panel(250, 40, 540, 510);
      c.fillStyle = '#000';
      c.fillRect(264, 54, 148, 148);
      c.imageSmoothingEnabled = false;
      c.drawImage(this.preview, 264, 54, 148, 148);
      g.text(this.rec.name, 424, 62, { serif: true });
      H.Font.wrap('text', this.rec.about, 350).slice(0, 5).forEach((t, i) => g.text(t, 424, 82 + i * 14));
      g.text('Победа: ' + this.goals.win.join(', '), 424, 160, { size: 10, color: '#a0e0a0' });
      g.text('Поражение: ' + this.goals.lose.join(', '), 424, 174, { size: 10, color: '#ffb0a0' });
      g.text('Без города: ' + H.MAP.townless + ' дней, чтобы взять новый', 424, 188, { size: 10, color: '#c8b88a' });
      ['Цвет', 'Народ', 'Герой', 'Союз', 'Кто'].forEach((t, i) => g.text(t, [264, 310, 428, 596, 664][i], 220, { size: 10, color: '#c8b88a' }));
      this.slots.forEach((s, i) => {
        const y = 230 + i * 22, off = s.who === 'none';
        c.fillStyle = H.PLAYER_COLORS[i];
        c.fillRect(264, y + 2, 38, 16);
        c.strokeStyle = '#000';
        c.strokeRect(264.5, y + 2.5, 37, 15);
        this.button(g, 'fac-' + i, FACTION_NAMES[s.faction], 310, y, 112, 20, () => this.cycleFaction(i), off);
        const rec = s.hid && H.HEROES.find(x => x.id === s.hid);
        this.button(g, 'hero-' + i, rec ? rec.name : 'Случайный', 428, y, 162, 20, () => this.cycleHero(i), off || s.faction === 'random');
        this.button(g, 'team-' + i, teamText(s.team), 596, y, 62, 20, () => this.cycleTeam(i), off || this.fixedTeams);
        this.button(g, 'who-' + i, WHO[s.who], 664, y, 96, 20, () => this.cycleWho(i));
      });
      g.text('Сложность', 264, 420, { bold: true });
      DIFF_ORDER.forEach((id, i) => {
        const d = H.DIFFICULTY[id], x = 264 + i * 126;
        this.region('diff-' + id, x, 430, 120, 30, () => { this.difficulty = id; });
        g.button({ x, y: 430, w: 120, h: 30, label: d.name, hot: this.hot === 'diff-' + id, down: this.difficulty === id });
      });
      const d = H.DIFFICULTY[this.difficulty], humans = this.slots.filter(q => q.who === 'human').length;
      g.text('Золото на старте: ' + Math.round(H.MAP.start.gold * d.start) + '. Доход ИИ ×' + d.income + ', прирост ИИ ×' + d.growth + (d.sees ? ', ИИ видит всю карту' : ''), 264, 474, { size: 10, color: '#c8b88a' });
      g.text(oneTeam(this.slots) ? 'Все игроки в одном союзе: с кем тогда воевать?' : humans > 1 ? 'Игра за одним ПК: людей ' + humans + ', перед каждым ходом экран передачи хода.' : this.fixedTeams ? 'Союзы заданы картой.' : 'Номер партии: ' + this.seed, 264, 490, { size: 10, color: oneTeam(this.slots) ? '#ff9080' : '#8a94b0' });
      this.button(g, 'start', 'Начать', 620, 504, 150, 30, () => this.start(), oneTeam(this.slots));
      this.button(g, 'back', 'Назад', 460, 504, 150, 30, () => this.back());
    }
  }
  Object.assign(SetupView.prototype, H.Regions);

  const RMG_SIZES = [[48, 'малая'], [80, 'средняя'], [112, 'большая'], [144, 'огромная']];

  class RandomView {
    constructor(ui, parent) {
      this.ui = ui;
      this.parent = parent;
      this.theme = 'title';
      this.regions = [];
      this.hot = null;
      this.template = 'ring';
      this.w = 48;
      this.levels = 1;
      this.water = 'none';
      this.neutrals = 'normal';
      this.difficulty = 'normal';
      this.seed = Math.floor(Math.random() * 1e9);
      this.typing = false;
      this.slots = [{ who: 'human', faction: 'league', hid: null, team: null }, { who: 'ai', faction: 'barrows', hid: null, team: null }];
      this.result = null;
      this.preview = [];
      this.level = 0;
      this.stale = true;
      this.busy = false;
    }

    update() {}

    options() {
      return { template: this.template, w: this.w, levels: this.levels, water: this.water, neutrals: this.neutrals, seed: this.seed, players: this.slots.map(s => ({ faction: s.faction, team: s.team })) };
    }

    changed() {
      this.stale = true;
    }

    fitPlayers() {
      const allowed = H.Rmg.playersFor(this.template, this.w);
      if (!allowed.length) {
        const sizes = H.Rmg.sizesFor(this.template, H.Rmg.TEMPLATES[this.template].min);
        this.w = sizes.includes(this.w) ? this.w : sizes[0];
      }
      const fits = H.Rmg.playersFor(this.template, this.w), want = H.clamp(this.slots.length, fits[0], fits[fits.length - 1]);
      while (this.slots.length < want) this.slots.push({ who: 'ai', faction: this.slots.length % 3 ? 'barrows' : 'league', hid: null, team: null });
      this.slots.length = want;
      if (!this.slots.some(s => s.who === 'human')) this.slots[0].who = 'human';
      this.changed();
    }

    setTemplate(id) {
      this.template = id;
      const T = H.Rmg.TEMPLATES[id];
      if (T.sea) this.water = 'many';
      this.fitPlayers();
    }

    setSize(w) {
      this.w = w;
      this.fitPlayers();
    }

    addPlayer(step) {
      const fits = H.Rmg.playersFor(this.template, this.w), next = this.slots.length + step;
      if (!fits.includes(next)) {
        const sizes = H.Rmg.sizesFor(this.template, next);
        if (next > H.Rmg.TEMPLATES[this.template].max || next < H.Rmg.TEMPLATES[this.template].min || !sizes.length) return;
        this.w = sizes[0];
      }
      if (step > 0) this.slots.push({ who: 'ai', faction: this.slots.length % 3 ? 'barrows' : 'league', hid: null, team: null });
      else this.slots.length = next;
      this.fitPlayers();
    }

    build(then) {
      if (this.busy) return;
      this.busy = true;
      setTimeout(() => {
        this.busy = false;
        this.buildNow();
        if (then && this.result.doc) then();
      }, 30);
    }

    buildNow() {
      this.result = H.Rmg.make(this.options());
      this.stale = false;
      this.level = 0;
      this.preview = this.result.doc ? Array.from({ length: this.result.doc.map.levels }, (_, l) => mapThumb(this.result.doc, l)) : [];
    }

    start() {
      if (oneTeam(this.slots)) return;
      if (this.stale || !this.result || !this.result.doc) {
        this.build(() => this.launch());
        return;
      }
      this.launch();
    }

    launch() {
      const r = this.result, slots = this.slots.map((s, i) => ({ faction: r.factions[i], human: s.who === 'human', hid: s.hid, team: s.team }));
      this.ui.startGame(H.Maps.play(r.doc, { seed: r.seed, slots, difficulty: this.difficulty }));
    }

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
      if (!this.typing) {
        if (code === 'Enter') this.start();
        return;
      }
      const text = String(this.seed);
      if (code.startsWith('Digit') && text.length < 9) this.seed = +(text === '0' ? code.slice(5) : text + code.slice(5));
      else if (code === 'Backspace') this.seed = +text.slice(0, -1) || 0;
      else if (code === 'Enter') this.typing = false;
      else return;
      this.changed();
    }

    back() {
      if (this.typing) {
        this.typing = false;
        return true;
      }
      this.ui.show(this.parent);
      return true;
    }

    option(g, id, label, x, y, w, h, on, act, off) {
      this.region(id, x, y, w, h, act, { off });
      g.button({ x, y, w, h, label, hot: this.hot === id, down: on, off });
    }

    head(g, text, x, y) {
      g.text(text, x, y, { bold: true });
    }

    drawSettings(g) {
      const c = g.ctx, T = H.Rmg.TEMPLATES, sea = !!T[this.template].sea, under = !!T[this.template].under;
      g.panel(10, 40, 250, 510);
      this.head(g, 'Шаблон', 26, 58);
      Object.entries(T).forEach(([id, t], i) => {
        const y = 68 + i * 24, key = 'tpl-' + id;
        this.region(key, 22, y, 226, 22, () => this.setTemplate(id));
        c.fillStyle = id === this.template ? '#22336e' : this.hot === key ? '#1a2850' : '#10183a';
        c.fillRect(22, y, 226, 22);
        g.text(t.name, 30, y + 11, { bold: true, color: id === this.template ? '#fff6d0' : '#f0e2b8' });
        g.text(t.min === t.max ? 'игроков ' + t.min : 'игроков ' + t.min + '–' + t.max, 240, y + 11, { align: 'right', size: 10, color: '#c8b88a' });
      });
      H.Font.wrap('text', T[this.template].about, 222).slice(0, 3).forEach((s, i) => g.text(s, 26, 246 + i * 15, { color: '#c8b88a' }));
      this.head(g, 'Размер', 26, 298);
      const sizes = H.Rmg.sizesFor(this.template, this.slots.length);
      RMG_SIZES.forEach(([w, name], i) => this.option(g, 'size-' + w, name, 22 + i * 57, 308, 56, 22, this.w === w, () => this.setSize(w), !sizes.includes(w)));
      this.head(g, 'Уровни', 26, 342);
      this.option(g, 'lv-1', 'Один уровень', 22, 352, 112, 22, this.levels === 1 && !under, () => { this.levels = 1; this.changed(); }, under);
      this.option(g, 'lv-2', 'С Подлуньем', 136, 352, 112, 22, this.levels === 2 || under, () => { this.levels = 2; this.changed(); }, under);
      this.head(g, 'Вода', 26, 386);
      Object.entries(H.Rmg.WATER).forEach(([id, name], i) => this.option(g, 'water-' + id, name, 22 + i * 76, 396, 74, 22, this.water === id, () => { this.water = id; this.changed(); }, sea && id !== 'many'));
      this.head(g, 'Нейтралы', 26, 430);
      Object.entries(H.Rmg.STRENGTH).forEach(([id, row], i) => this.option(g, 'mob-' + id, row[0], 22 + i * 57, 440, 56, 22, this.neutrals === id, () => { this.neutrals = id; this.changed(); }));
    }

    drawPreview(g) {
      const c = g.ctx, r = this.result, doc = r && r.doc;
      c.fillStyle = '#000';
      c.fillRect(284, 54, 180, 180);
      if (doc && this.preview[this.level]) {
        c.imageSmoothingEnabled = false;
        c.drawImage(this.preview[this.level], 284, 54, 180, 180);
      }
      if (!doc || this.stale) {
        c.fillStyle = 'rgba(5,7,15,0.62)';
        c.fillRect(284, 54, 180, 180);
        g.text(this.busy ? 'Строю карту...' : 'Карта не показана', 374, 144, { align: 'center', bold: true });
      }
      if (doc && doc.map.levels > 1) this.option(g, 'level', this.level ? 'Подлунье' : 'Поверхность', 284, 238, 180, 18, false, () => { this.level = (this.level + 1) % doc.map.levels; });
      g.text('Номер партии', 478, 60, { bold: true });
      this.region('seed', 478, 70, 130, 22, () => { this.typing = !this.typing; });
      c.fillStyle = this.typing ? '#22336e' : '#05070f';
      c.fillRect(478, 70, 130, 22);
      c.strokeStyle = this.typing ? '#ffe080' : '#6a5430';
      c.strokeRect(478.5, 70.5, 129, 21);
      g.text(this.seed + (this.typing ? '_' : ''), 486, 81, { color: '#fff6d0' });
      this.button(g, 'reseed', 'Новый номер', 614, 70, 110, 22, () => {
        this.seed = Math.floor(Math.random() * 1e9);
        this.typing = false;
        this.changed();
      });
      g.text(this.typing ? 'Наберите цифры, Enter: готово' : 'Щёлкните номер, чтобы набрать свой', 478, 104, { size: 10, color: '#a89870' });
      this.button(g, 'show', 'Показать карту', 478, 116, 246, 28, () => this.build(), this.busy);
      if (!r) return;
      if (!doc) {
        g.text('Карту построить не удалось', 478, 160, { bold: true, color: '#ff9080' });
        H.Font.wrap('text', r.log.length ? r.log[r.log.length - 1].why : '', 300).slice(0, 3).forEach((s, i) => g.text(s, 478, 178 + i * 15, { size: 10, color: '#ffb0a0' }));
        return;
      }
      const m = r.meta;
      g.text('Зон ' + m.zones + ', проходов ' + m.passes + ', объектов ' + doc.map.objs.length, 478, 158, { size: 10, color: '#c8b88a' });
      g.text(r.seed === (this.seed >>> 0) ? 'Карта построена с первого раза' : 'Построен следующий номер: ' + r.seed, 478, 174, { size: 10, color: '#c8b88a' });
      if (r.log.length) H.Font.wrap('text', 'Журнал: ' + r.log[r.log.length - 1].why, 300).slice(0, 3).forEach((s, i) => g.text(s, 478, 190 + i * 14, { size: 10, color: '#a89870' }));
      if (this.stale) g.text('Настройки изменились', 478, 236, { size: 10, color: '#ffd080' });
    }

    drawPlayers(g) {
      const c = g.ctx, T = H.Rmg.TEMPLATES[this.template], factions = this.result && !this.stale ? this.result.factions : null;
      g.text('Игроки: ' + this.slots.length, 284, 272, { bold: true });
      const can = step => {
        const next = this.slots.length + step;
        return next >= T.min && next <= T.max;
      };
      this.button(g, 'less', '−', 350, 262, 22, 20, () => this.addPlayer(-1), !can(-1));
      this.button(g, 'more', '+', 374, 262, 22, 20, () => this.addPlayer(1), !can(1));
      ['Народ', 'Герой', 'Союз', 'Кто'].forEach((s, i) => g.text(s, [330, 460, 606, 674][i], 272, { size: 10, color: '#c8b88a' }));
      this.slots.forEach((s, i) => {
        const y = 284 + i * 21;
        c.fillStyle = H.PLAYER_COLORS[i];
        c.fillRect(284, y + 2, 38, 15);
        c.strokeStyle = '#000';
        c.strokeRect(284.5, y + 2.5, 37, 14);
        const known = factions && s.faction === 'random' ? 'Случайный: ' + FACTION_NAMES[factions[i]] : FACTION_NAMES[s.faction];
        this.button(g, 'fac-' + i, known, 330, y, 124, 19, () => this.cycleFaction(i));
        const rec = s.hid && H.HEROES.find(x => x.id === s.hid);
        this.button(g, 'hero-' + i, rec ? rec.name : 'Случайный', 460, y, 140, 19, () => this.cycleHero(i), s.faction === 'random');
        this.button(g, 'team-' + i, teamText(s.team), 606, y, 62, 19, () => {
          s.team = TEAMS[(TEAMS.indexOf(s.team) + 1) % TEAMS.length];
          this.changed();
        });
        this.button(g, 'who-' + i, WHO[s.who], 674, y, 80, 19, () => {
          if (s.who !== 'human') s.who = 'human';
          else if (this.slots.filter(q => q.who === 'human').length > 1) s.who = 'ai';
        });
      });
    }

    cycleFaction(i) {
      const s = this.slots[i], all = Object.keys(FACTION_NAMES);
      s.faction = all[(all.indexOf(s.faction) + 1) % all.length];
      s.hid = null;
      this.changed();
    }

    cycleHero(i) {
      const s = this.slots[i], all = [null, ...H.HEROES.filter(x => !x.story && H.CLASSES[x.cls].faction === s.faction).map(x => x.id)];
      s.hid = all[(all.indexOf(s.hid) + 1) % all.length];
    }


    draw(g) {
      const c = g.ctx;
      this.regions = [];
      c.fillStyle = '#0a1028';
      c.fillRect(0, 0, H.W, H.H);
      g.text('Случайная карта', H.W / 2, 22, { align: 'center', serif: true });
      this.drawSettings(g);
      g.panel(270, 40, 520, 510);
      this.drawPreview(g);
      this.drawPlayers(g);
      DIFF_ORDER.forEach((id, i) => this.option(g, 'diff-' + id, H.DIFFICULTY[id].name, 284 + i * 118, 462, 114, 26, this.difficulty === id, () => { this.difficulty = id; }));
      this.button(g, 'back', 'Назад', 460, 500, 150, 30, () => this.back());
      if (oneTeam(this.slots)) g.text('Все в одном союзе', 284, 516, { size: 10, color: '#ff9080' });
      this.button(g, 'start', 'Начать', 620, 500, 150, 30, () => this.start(), this.busy || oneTeam(this.slots));
    }
  }
  Object.assign(RandomView.prototype, H.Regions);

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
      const S = this.S, w = S.over.winner;
      this.pid = w >= 0 && S.players[w].human ? w : map.pid;
      this.win = w >= 0 && (w === this.pid || H.Adv.allied(S, w, this.pid));
      this.seat = S.players.filter(p => p.human).length > 1;
      this.theme = this.win ? 'victory' : 'defeat';
      this.score = this.win ? H.Adv.score(S) : 0;
      this.place = this.win && !S.debug ? H.Fame.add(Object.assign(H.Fame.entryOf(S, this.pid), { when: new Date().toLocaleDateString('ru-RU') })) : 0;
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
      g.panel(200, 120, 400, 280);
      const lines = [
        ['Карта', S.mapName],
        ['Сложность', d.name],
        ['Народ', H.FACTIONS[S.players[this.pid].faction].full],
        ...(this.seat || this.win && over.winner !== this.pid ? [['Победитель', over.winner >= 0 ? H.PLAYER_NAMES[S.players[over.winner].color] + ' игрок' + (over.winner !== this.pid ? ', ваш союзник' : '') : 'никто']] : []),
        ['Дней прошло', String(S.day)],
        ['Итог', this.win ? WHY_WIN[over.why] || 'Цель карты выполнена' : 'Все города и герои потеряны']
      ];
      lines.forEach(([a, b], i) => {
        g.text(a, 226, 150 + i * 28, { size: 10, color: '#c8b88a' });
        g.text(b, 336, 150 + i * 28, {});
      });
      g.text('Очки: ' + this.score + (this.win ? ', звание: ' + H.Fame.rankOf(this.score) : ''), H.W / 2, 338, { align: 'center', serif: true, color: this.win ? '#ffe080' : '#a89870' });
      if (this.win) g.text(S.debug ? 'Партия с F7/F8: в Зал славы не идёт' : this.place ? 'Место в Зале славы: ' + this.place + ' из ' + H.Fame.MAX : 'До Зала славы не хватило очков', H.W / 2, 364, { align: 'center', size: 10, color: '#c8b88a' });
      this.button(g, 'menu', 'Главное меню', H.W / 2 - 170, 420, 160, 30, () => this.ui.toTitle());
      this.button(g, 'again', 'Новая партия', H.W / 2 + 10, 420, 160, 30, () => {
        const t = new TitleView(this.ui);
        this.ui.show(new SetupView(this.ui, t));
      });
    }
  }
  Object.assign(ResultView.prototype, H.Regions);
  const WHY_WIN = { defeat: 'Все враги разбиты', town: 'Город взят', gold: 'Золото собрано', hero: 'Вражеский герой побеждён' };

  H.mapThumb = mapThumb;
  H.paintNight = paintNight;
  H.FACTION_NAMES = FACTION_NAMES;
  H.TrialMenu = TrialMenu;
  H.StyleSheet = StyleSheet;
  H.TitleView = TitleView;
  H.SetupView = SetupView;
  H.SaveView = SaveView;
  H.SettingsView = SettingsView;
  H.ResultView = ResultView;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
