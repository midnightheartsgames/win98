class EmuLandSite {
  constructor() {
    this.baseUrl = 'http://www.emuland98.ru';
    this.statsKey = 'win98_emuland_downloads_v1';
  }

  esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  gif(name, scale = 1) {
    return window.webGif ? window.webGif(name, scale) : '';
  }

  parseUrl(url) {
    const rest = String(url || '').replace(/^[a-z]+:\/{2}[^\/?#]*/i, '');
    const path = (rest.split(/[?#]/)[0] || '/').replace(/\/+$/, '') || '/';
    const query = rest.includes('?') ? rest.split('?')[1].split('#')[0] : '';
    return { path: path.toLowerCase(), params: new URLSearchParams(query) };
  }

  link(path, label, cls = '') {
    return `<a${cls ? ` class="${cls}"` : ''} data-url="${this.baseUrl}${path}">${label}</a>`;
  }

  getSystems() {
    return [
      { id: 'nes', name: 'Dendy', full: 'Dendy / NES / Famicom', bits: '8 бит', ext: '.NES', emu: 'NESticle' },
      { id: 'sega', name: 'Sega', full: 'Sega Mega Drive / Genesis', bits: '16 бит', ext: '.BIN', emu: 'Genecyst' },
      { id: 'snes', name: 'SNES', full: 'Super Nintendo', bits: '16 бит', ext: '.SMC', emu: 'ZSNES' },
      { id: 'gb', name: 'Game Boy', full: 'Nintendo Game Boy', bits: '8 бит', ext: '.GB', emu: 'Virtual GameBoy' }
    ];
  }

  getRoms() {
    return [
      { id: 'battlecity', sys: 'nes', title: 'Battle City', ru: 'Танчики', year: 1985, maker: 'Namco', genre: 'Стрелялка', size: '24 КБ', file: 'BATTLE_CITY.NES', dl: 4812, mapper: 'Mapper 0 (NROM)',
        desc: 'Защищайте штаб с орлом от двадцати вражеских танков на каждом уровне. Кирпич пробивается, бетон нет. Звёздочка усиливает танк, лопата обносит штаб бетоном. Вдвоём играть веселее.',
        cheat: 'На экране «STAGE 1» до начала уровня кнопки A и B меняют номер уровня. Всего уровней 35.' },
      { id: 'smb', sys: 'nes', title: 'Super Mario Bros.', ru: 'Марио', year: 1985, maker: 'Nintendo', genre: 'Платформер', size: '40 КБ', file: 'SUPER_MARIO_BROS.NES', dl: 4377, mapper: 'Mapper 0 (NROM)',
        desc: 'Водопроводчик Марио идёт через восемь миров спасать принцессу. Грибы делают его большим, цветок даёт огненные шары. В трубах бывают секретные комнаты.',
        cheat: 'После Game Over зажмите A и нажмите Start на заставке: игра продолжится с начала того же мира.' },
      { id: 'contra', sys: 'nes', title: 'Contra', ru: 'Контра', year: 1988, maker: 'Konami', genre: 'Стрелялка', size: '128 КБ', file: 'CONTRA.NES', dl: 3950, mapper: 'Mapper 2 (UNROM)',
        desc: 'Двое бойцов против пришельцев: джунгли, водопад, база, снега и логово. Летающие капсулы роняют оружие, лучшее из них S, раздвоенный выстрел. Вдвоём проходится намного проще.',
        cheat: 'На заставке: Вверх, Вверх, Вниз, Вниз, Влево, Вправо, Влево, Вправо, B, A, Start. На старте будет 30 жизней.' },
      { id: 'chipdale', sys: 'nes', title: 'Chip \'n Dale Rescue Rangers', ru: 'Чип и Дейл', year: 1990, maker: 'Capcom', genre: 'Платформер', size: '256 КБ', file: 'CHIP_N_DALE.NES', dl: 3211, mapper: 'Mapper 1 (MMC1)',
        desc: 'Бурундуки ищут пропавшего котёнка и выходят на Толстопуза. Ящики можно поднимать и кидать во врагов и друг в друга. Вдвоём играть смешнее, чем проходить.',
        cheat: 'Вдвоём бросайте напарника, как ящик: он долетает до врагов, которых ящиком не достать.' },
      { id: 'sonic2', sys: 'sega', title: 'Sonic the Hedgehog 2', ru: 'Соник 2', year: 1992, maker: 'Sega', genre: 'Платформер', size: '1024 КБ', file: 'SONIC2.BIN', dl: 3688, mapper: 'Картридж 8 Мбит',
        desc: 'Ёж Соник и лис Тейлз бегут через зелёные холмы, химический завод и казино. Кольца спасают от смерти, семь изумрудов хаоса превращают Соника в Супер Соника.',
        cheat: 'В «Options» в Sound Test сыграйте звуки 19, 65, 09, 17. Затем на заставке зажмите A и нажмите Start: откроется выбор уровня.' },
      { id: 'umk3', sys: 'sega', title: 'Ultimate Mortal Kombat 3', ru: 'Мортал Комбат', year: 1996, maker: 'Midway', genre: 'Драка', size: '4096 КБ', file: 'UMK3.BIN', dl: 4155, mapper: 'Картридж 32 Мбит',
        desc: 'Двадцать с лишним бойцов, добивания и комбо. Главная игра любого компьютерного клуба. Учите добивания по табличке ниже, на клавиатуре они делаются так же, как на джойстике.',
        cheat: 'На заставке: A, C, Вверх, B, Вверх, B, A, Вниз. Откроется меню с секретными настройками.' },
      { id: 'comixzone', sys: 'sega', title: 'Comix Zone', ru: 'Комикс Зон', year: 1995, maker: 'Sega', genre: 'Драка', size: '2048 КБ', file: 'COMIX_ZONE.BIN', dl: 1874, mapper: 'Картридж 16 Мбит',
        desc: 'Художник Скетч попадает в собственный комикс и дерётся с героями, которых нарисовал. Перебегаешь из клетки в клетку, а злодей дорисовывает врагов прямо на ходу.',
        cheat: 'В «Jukebox» в настройках включите треки 14, 15, 18, 5, 13, 1, 3, 18, 15, 6. Затем выбирайте номер страницы.' },
      { id: 'smw', sys: 'snes', title: 'Super Mario World', ru: 'Марио 4', year: 1990, maker: 'Nintendo', genre: 'Платформер', size: '512 КБ', file: 'SUPER_MARIO_WORLD.SMC', dl: 1502, mapper: 'LoROM',
        desc: 'Марио и динозавр Йоши проходят остров из 96 выходов. Перо даёт плащ и полёт. На ZSNES идёт без тормозов на Pentium 166.',
        cheat: 'Из уже пройденного уровня можно выйти на карту: поставьте паузу и нажмите Select.' },
      { id: 'tetris', sys: 'gb', title: 'Tetris', ru: 'Тетрис', year: 1989, maker: 'Nintendo', genre: 'Головоломка', size: '32 КБ', file: 'TETRIS.GB', dl: 2240, mapper: 'Без маппера',
        desc: 'Тот самый тетрис с карманной приставки. Четыре оттенка зелёного и музыка «Коробейники». Игра придумана в Москве, а прославилась на Game Boy.',
        cheat: 'На заставке зажмите Вниз и нажмите Start. Рядом с уровнем появится сердечко, и фигуры будут падать быстрее.' }
    ];
  }

  getNews() {
    return [
      ['27.11.1998', 'Добавлены Comix Zone и Super Mario World. Для SNES нужен ZSNES, ссылка в разделе «Эмуляторы».'],
      ['21.11.1998', 'Пересняли все скриншоты. Теперь видно, во что вы играете, до того как качать.'],
      ['14.11.1998', 'Таблица кодов дополнена. Код Contra проверили втроём на одном джойстике.'],
      ['02.11.1998', 'Сайт переехал на новый хостинг. Скорость скачивания теперь до 4 КБ/с.'],
      ['18.08.1998', 'Вышла последняя версия NESticle. Автор сказал, что больше обновлять не будет.']
    ];
  }

  getStats() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.statsKey);
        if (raw) return JSON.parse(raw) || {};
      }
    } catch (e) {}
    return {};
  }

  downloads(rom) {
    return rom.dl + (this.getStats()[rom.id] || 0);
  }

  downloadRom(id) {
    const rom = this.getRoms().find(r => r.id === id);
    if (!rom) return null;
    const sys = this.getSystems().find(s => s.id === rom.sys);
    const stats = this.getStats();
    stats[rom.id] = (stats[rom.id] || 0) + 1;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(this.statsKey, JSON.stringify(stats));
    } catch (e) {}
    const text = `[EMU-LAND ROM DUMP 1998]\nИгра=${rom.title} (${rom.year}, ${rom.maker})\nПлатформа=${sys ? sys.full : rom.sys}\nФайл=${rom.file}\nРазмер=${rom.size}\nМаппер=${rom.mapper}\nПроверено=GoodDump OK\nЭмулятор=${sys ? sys.emu : ''}\n\nСохраните картридж, если он у вас есть.\nДамп выложен для ознакомления. Удалите его через 24 часа.`;
    if (window.vfs && window.vfs.writeFile) window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Downloads'], rom.file, text);
    if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
    return rom.file;
  }

  sprite(ctx, rows, pal, x, y, k = 1) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const col = pal[row[i]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x + i * k, y + j * k, k, k);
      }
    });
  }

  drawShot(canvas, id) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 256;
    const H = 224;
    ctx.save();
    ctx.scale(canvas.width / W, canvas.height / H);
    ctx.imageSmoothingEnabled = false;
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const text = (s, x, y, c, size = 8) => { ctx.fillStyle = c; ctx.font = `bold ${size}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.fillText(s, x, y); };
    const tank = ['..aa..', '.abba.', 'aabbaa', 'aabbaa', 'a.aa.a', 'a....a'];
    if (id === 'battlecity') {
      R(0, 0, W, H, '#000000');
      R(16, 8, 208, 208, '#000000');
      R(224, 0, 32, H, '#7c7c7c');
      for (let i = 0; i < 16; i++) R(230 + (i % 2) * 10, 16 + Math.floor(i / 2) * 10, 8, 8, '#000000');
      const brick = (x, y, w, h) => { for (let yy = 0; yy < h; yy += 4) for (let xx = 0; xx < w; xx += 8) { R(x + xx + ((yy / 4) % 2) * 4, y + yy, 7, 3, '#b85010'); } };
      [[40, 40], [72, 40], [136, 40], [168, 40], [40, 104], [168, 104], [88, 136], [136, 136]].forEach(([x, y]) => brick(x, y, 16, 48));
      [[104, 88], [120, 88]].forEach(([x, y]) => { R(x, y, 16, 16, '#bcbcbc'); R(x + 2, y + 2, 12, 12, '#7c7c7c'); });
      brick(104, 184, 48, 8); brick(104, 192, 8, 24); brick(144, 192, 8, 24);
      this.sprite(ctx, ['..y..y..', '.yyyyyy.', 'yyy..yyy', '.yyyyyy.', '..y..y..'], { y: '#bcbcbc' }, 116, 200, 3);
      this.sprite(ctx, tank, { a: '#e8d020', b: '#a87800' }, 80, 192, 2.6);
      this.sprite(ctx, tank, { a: '#bcbcbc', b: '#7c7c7c' }, 24, 12, 2.6);
      this.sprite(ctx, tank, { a: '#bcbcbc', b: '#7c7c7c' }, 120, 12, 2.6);
      this.sprite(ctx, tank, { a: '#d82800', b: '#bcbcbc' }, 200, 60, 2.6);
      R(83, 150, 2, 6, '#ffffff');
      text('IP', 230, 150, '#000000'); text('2', 238, 162, '#000000');
      text('15', 232, 206, '#000000');
    } else if (id === 'smb') {
      R(0, 0, W, H, '#5c94fc');
      R(40, 40, 32, 10, '#fcfcfc'); R(46, 34, 20, 8, '#fcfcfc');
      R(170, 56, 40, 10, '#fcfcfc'); R(178, 50, 24, 8, '#fcfcfc');
      ctx.fillStyle = '#00a800'; ctx.beginPath(); ctx.moveTo(0, 192); ctx.lineTo(40, 150); ctx.lineTo(80, 192); ctx.fill();
      for (let x = 0; x < W; x += 16) { R(x, 192, 16, 32, '#c84c0c'); R(x, 192, 15, 1, '#fcbcb0'); R(x + 8, 200, 1, 8, '#000000'); R(x, 208, 16, 1, '#000000'); }
      [[88, 128], [104, 128], [136, 128]].forEach(([x, y]) => { R(x, y, 16, 16, '#c84c0c'); R(x, y + 7, 16, 1, '#000000'); R(x + 7, y, 1, 7, '#000000'); });
      R(120, 128, 16, 16, '#fca044'); text('?', 125, 140, '#c84c0c', 12);
      R(120, 80, 16, 16, '#fca044'); text('?', 125, 92, '#c84c0c', 12);
      R(192, 160, 32, 32, '#00a800'); R(188, 152, 40, 12, '#00a800'); R(196, 164, 4, 28, '#80d010'); R(192, 154, 4, 8, '#80d010');
      this.sprite(ctx, ['...rrrr...', '..rrrrrrr.', '..bbbssbs.', '.bsbsssbss', '.bsbbsssbs', '.bbsssbbb.', '...sssss..', '..rrbrr...', '.rrrbrrbrr', 'rrrrbbbbrr', 'ssrbybbybr', 'sssbbbbbb.', '..bbb.bbb.', '.bbb...bbb'], { r: '#d82800', b: '#887000', s: '#fca044', y: '#fcfc00' }, 52, 164, 2);
      this.sprite(ctx, ['...bbbb...', '..bbbbbb..', '.bwkbbkwb.', 'bbwkbbkwbb', 'bbbbbbbbbb', '.bbsssssb.', '..ssssss..', '.kk....kk.'], { b: '#c84c0c', w: '#fcfcfc', k: '#000000', s: '#fcbcb0' }, 150, 176, 2);
      text('MARIO', 16, 16, '#fcfcfc'); text('000400', 16, 26, '#fcfcfc'); text('WORLD', 140, 16, '#fcfcfc'); text('1-1', 146, 26, '#fcfcfc'); text('x07', 88, 26, '#fcfcfc');
    } else if (id === 'contra') {
      R(0, 0, W, H, '#000000');
      for (let i = 0; i < 9; i++) { R(i * 30, 30, 18, 110, '#005000'); R(i * 30 - 8, 30, 34, 20, '#00a800'); }
      R(0, 140, W, 14, '#787878'); R(0, 140, W, 2, '#bcbcbc');
      R(0, 186, W, 38, '#0058f8'); for (let x = 0; x < W; x += 12) R(x, 188, 8, 2, '#3cbcfc');
      R(150, 168, 80, 10, '#787878'); R(150, 168, 80, 2, '#bcbcbc');
      this.sprite(ctx, ['..kk..', '.ksk..', '.kkkk.', 'bbbbbs', '.bbb..', '.b.b..', 'b...b.'], { k: '#000000', s: '#fca044', b: '#0058f8' }, 40, 118, 3);
      this.sprite(ctx, ['..rr..', '.rsr..', '.rrrr.', 'rrrrrs', '.rrr..', '.r.r..', 'r...r.'], { s: '#fca044', r: '#d82800' }, 180, 146, 3);
      [70, 90, 110].forEach(x => R(x, 128, 3, 3, '#fcfcfc'));
      this.sprite(ctx, ['.ww.', 'wrrw', 'wrrw', '.ww.'], { w: '#bcbcbc', r: '#d82800' }, 130, 60, 3);
      text('1P', 10, 14, '#fcfcfc'); R(26, 7, 4, 7, '#0058f8'); R(32, 7, 4, 7, '#0058f8'); R(38, 7, 4, 7, '#0058f8');
    } else if (id === 'chipdale') {
      R(0, 0, W, H, '#fcbcb0');
      for (let x = 0; x < W; x += 32) R(x, 0, 16, 176, '#f8a8a0');
      for (let x = 0; x < W; x += 16) for (let y = 176; y < H; y += 16) R(x, y, 16, 16, ((x + y) / 16) % 2 ? '#a8a8a8' : '#fcfcfc');
      [[100, 160], [116, 160], [108, 144]].forEach(([x, y]) => { R(x, y, 16, 16, '#d82800'); R(x + 2, y + 2, 12, 12, '#f87858'); R(x + 6, y + 6, 4, 4, '#d82800'); });
      this.sprite(ctx, ['..kkkk..', '.kkkkkk.', 'kkbbbbbk', '.bwkbwkb', '.bbbbbbb', '..bsssb.', '.yyyyyy.', 'b.yyyy.b', '..b..b..'], { k: '#202020', b: '#a85000', w: '#fcfcfc', s: '#fcd8a8', y: '#0058f8' }, 50, 152, 3);
      this.sprite(ctx, ['..rr....', '.rrrr...', 'bbbbbb..', 'bwkbwkb.', 'bbbbbbb.', '.bsssb..', '.hhhhhh.', 'b.hhhh.b', '..b..b..'], { r: '#d82800', b: '#c86c00', w: '#fcfcfc', s: '#fcd8a8', h: '#f8d878' }, 180, 152, 3);
      text('CD', 10, 16, '#000000');
    } else if (id === 'sonic2') {
      R(0, 0, W, 110, '#2038ec'); R(0, 110, W, 30, '#5c94fc');
      R(0, 140, W, 84, '#00a800');
      for (let x = 0; x < W; x += 16) for (let y = 160; y < H; y += 16) R(x, y, 16, 16, ((x + y) / 16) % 2 ? '#a85000' : '#c86c00');
      R(0, 156, W, 6, '#00d800');
      R(190, 70, 6, 86, '#a85000');
      ctx.fillStyle = '#00a800';
      [[-30, -6], [30, -6], [-24, 8], [24, 8]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(193 + dx / 2, 70 + dy, 18, 5, dx > 0 ? 0.4 : -0.4, 0, Math.PI * 2); ctx.fill(); });
      ctx.lineWidth = 3; ctx.strokeStyle = '#fce000';
      [[90, 120], [110, 112], [130, 108], [150, 112]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 4, 6, 0, 0, Math.PI * 2); ctx.stroke(); });
      this.sprite(ctx, ['....bbbb..', '..bbbbbbb.', '.bbbbwwkb.', 'bbbbbwwkbs', '..bbbsssss', '.bbbbsss..', '..bbbb....', '..rr.rr...', '.rrr..rrr.'], { b: '#2038ec', w: '#fcfcfc', k: '#000000', s: '#fca044', r: '#d82800' }, 50, 128, 3);
      text('SCORE', 10, 16, '#fce000'); text('400', 60, 16, '#fcfcfc'); text('TIME', 10, 28, '#fce000'); text('0:42', 60, 28, '#fcfcfc'); text('RINGS', 10, 40, '#fce000'); text('17', 60, 40, '#fcfcfc');
    } else if (id === 'umk3') {
      R(0, 0, W, H, '#181830');
      for (let i = 0; i < 8; i++) R(i * 34, 60, 26, 120, '#282848');
      R(0, 180, W, 44, '#383838'); R(0, 180, W, 2, '#585858');
      R(10, 10, 100, 10, '#d82800'); R(10, 10, 72, 10, '#00a800'); R(146, 10, 100, 10, '#d82800'); R(146, 10, 90, 10, '#00a800');
      text('SCORPION', 12, 32, '#fce000'); text('SUB-ZERO', 190, 32, '#3cbcfc');
      const fighter = (x, c, d) => this.sprite(ctx, ['..kkk...', '.kssk...', '.kkkk...', 'cccccc' + (d ? 'ss' : '..'), 'cccccc..', '.cccc...', '.kkkk...', '.k..k...', '.k..k...', 'kk..kk..'], { k: '#202020', s: '#fca044', c }, x, 120, 6);
      fighter(60, '#d8c000', true); fighter(150, '#2878f8', false);
      text('FIGHT!', 104, 100, '#fcfcfc', 12);
    } else if (id === 'comixzone') {
      R(0, 0, W, H, '#fcfcfc');
      [[8, 8, 116, 100, '#f8d878'], [132, 8, 116, 100, '#a8e4fc'], [8, 116, 240, 100, '#fcbcb0']].forEach(([x, y, w, h, c]) => { R(x, y, w, h, '#000000'); R(x + 2, y + 2, w - 4, h - 4, c); });
      R(20, 20, 70, 26, '#fcfcfc'); text('AAARGH!', 26, 37, '#000000', 9);
      this.sprite(ctx, ['..kk..', '.kssk.', '.kkkk.', 'ssbbss', '.bbbb.', '.bbbb.', '.k..k.', 'kk..kk'], { k: '#000000', s: '#fca044', b: '#0058f8' }, 60, 130, 9);
      this.sprite(ctx, ['g..g', 'gggg', 'gwwg', 'gggg', 'g..g'], { g: '#00a800', w: '#fcfcfc' }, 170, 140, 12);
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(150, 90); ctx.lineTo(180, 40); ctx.lineTo(220, 70); ctx.stroke();
    } else if (id === 'smw') {
      R(0, 0, W, H, '#9cdcfc');
      ctx.fillStyle = '#58b858';
      [[40, 150, 50], [130, 160, 40], [210, 150, 46]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.ellipse(x, y, r * 0.6, r, 0, Math.PI, 0); ctx.fill(); });
      R(0, 176, W, 48, '#c8a050'); R(0, 176, W, 8, '#38a838');
      this.sprite(ctx, ['..gggg...', '.gwwgggg.', '.gwkgggg.', '..ggggggg', 'gggggg...', 'g.ww.....', 'gggggg...', '.rr.rr...'], { g: '#38c838', w: '#fcfcfc', k: '#000000', r: '#d82800' }, 70, 140, 4);
      this.sprite(ctx, ['.rrr.', 'rrrrr', '.sss.', '.bbb.', 'b.b.b'], { r: '#d82800', s: '#fca044', b: '#2038ec' }, 80, 118, 4);
      R(160, 120, 16, 16, '#fce000'); text('?', 165, 132, '#000000', 12);
      text('MARIO', 16, 16, '#fcfcfc'); text('x 5', 20, 28, '#fcfcfc'); text('TIME 287', 180, 16, '#fcfcfc');
    } else if (id === 'tetris') {
      const g = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];
      R(0, 0, W, H, g[3]);
      R(72, 0, 8, H, g[1]); R(160, 0, 8, H, g[1]);
      for (let y = 0; y < H; y += 8) { R(72, y, 8, 1, g[0]); R(160, y, 8, 1, g[0]); }
      const cell = (cx, cy, c) => { R(80 + cx * 8, cy * 8, 8, 8, c); R(81 + cx * 8, cy * 8 + 1, 6, 6, g[2]); R(82 + cx * 8, cy * 8 + 2, 4, 4, c); };
      const stack = ['..........', '..........', '#...##....', '##.###..##', '###.####.#', '####.#####', '#########.'];
      stack.forEach((row, j) => row.split('').forEach((ch, i) => { if (ch === '#') cell(i, 21 + j, g[0]); }));
      [[4, 6], [5, 6], [6, 6], [5, 7]].forEach(([x, y]) => cell(x, y, g[1]));
      R(176, 20, 72, 40, g[2]); text('SCORE', 182, 34, g[0]); text('2370', 200, 50, g[0]);
      R(176, 70, 72, 40, g[2]); text('LEVEL', 182, 84, g[0]); text('5', 214, 100, g[0]);
      R(176, 140, 56, 50, g[2]); text('NEXT', 186, 154, g[0]);
      [[0, 0], [1, 0], [2, 0], [3, 0]].forEach(([x, y]) => { R(188 + x * 8, 168 + y * 8, 8, 8, g[0]); });
    } else {
      R(0, 0, W, H, '#202020');
      text('NO SIGNAL', 90, 112, '#fcfcfc');
    }
    ctx.restore();
  }

  romRows(roms) {
    const systems = this.getSystems();
    return `
      <table class="emu-roms" cellspacing="0">
        <tr><th></th><th>Игра</th><th>Год</th><th>Жанр</th><th>Размер</th><th>Скачали</th></tr>
        ${roms.map(r => `
          <tr>
            <td class="emu-thumb-cell"><a data-url="${this.baseUrl}/rom?id=${r.id}"><canvas class="emu-shot emu-thumb" width="64" height="56" data-rom="${r.id}" role="img" aria-label="${this.esc(r.title)}"></canvas></a></td>
            <td>${this.link(`/rom?id=${r.id}`, `<b>${this.esc(r.title)}</b>`)}<div class="emu-sub">${this.esc(r.ru)}, ${this.esc(r.maker)}${roms.some(x => x.sys !== r.sys) && !r.maker.includes(systems.find(s => s.id === r.sys).name) ? `, ${systems.find(s => s.id === r.sys).name}` : ''}</div></td>
            <td>${r.year}</td>
            <td>${r.genre}</td>
            <td class="emu-r">${r.size}</td>
            <td class="emu-r">${this.downloads(r).toLocaleString('ru-RU')}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  renderHome() {
    const roms = this.getRoms();
    const top = roms.slice().sort((a, b) => this.downloads(b) - this.downloads(a)).slice(0, 5);
    return `
      <table class="emu-split" cellspacing="0">
        <tr>
          <td class="emu-split-main">
            <h2 class="emu-h">Обновления</h2>
            <dl class="emu-news">
              ${this.getNews().map(([d, t]) => `<dt>${d}</dt><dd>${t}</dd>`).join('')}
            </dl>
            <h2 class="emu-h">Новые дампы</h2>
            ${this.romRows(roms.filter(r => r.id === 'comixzone' || r.id === 'smw'))}
          </td>
          <td class="emu-split-side">
            <h2 class="emu-h">Чаще всего качают</h2>
            <ol class="emu-toplist">
              ${top.map(r => `<li>${this.link(`/rom?id=${r.id}`, this.esc(r.title))} <span class="emu-sub">${this.downloads(r).toLocaleString('ru-RU')}</span></li>`).join('')}
            </ol>
            <div class="emu-box">
              <b>Впервые здесь?</b><br>
              1. Скачайте эмулятор для своей приставки в разделе ${this.link('/emulators', '«Эмуляторы»')}.<br>
              2. Скачайте ROM, это образ картриджа.<br>
              3. Откройте ROM в эмуляторе.
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  renderSystem(id) {
    const sys = this.getSystems().find(s => s.id === id);
    if (!sys) return `<h2 class="emu-h">Нет такой приставки</h2><p>${this.link('', 'На главную')}</p>`;
    const roms = this.getRoms().filter(r => r.sys === id);
    return `
      <h2 class="emu-h">${sys.full} <span class="emu-sub">${sys.bits}, файлы ${sys.ext}, эмулятор ${sys.emu}</span></h2>
      ${this.romRows(roms)}
      <p class="emu-sub">Всего дампов: ${roms.length}. Хотите игру, которой нет? Напишите на <a href="mailto:roms@emuland98.ru">roms@emuland98.ru</a>.</p>
    `;
  }

  renderRom(id) {
    const rom = this.getRoms().find(r => r.id === id);
    if (!rom) return `<h2 class="emu-h">Дамп не найден</h2><p>${this.link('', 'На главную')}</p>`;
    const sys = this.getSystems().find(s => s.id === rom.sys);
    return `
      <div class="emu-crumbs">${this.link('', 'Emu-Land')} &gt; ${this.link(`/roms?sys=${sys.id}`, sys.name)} &gt; ${this.esc(rom.title)}</div>
      <h2 class="emu-rom-h">${this.esc(rom.title)} <span>(${this.esc(rom.ru)})</span></h2>
      <table class="emu-rom" cellspacing="0">
        <tr>
          <td class="emu-rom-shot"><canvas class="emu-shot emu-big" width="512" height="448" data-rom="${rom.id}" role="img" aria-label="Скриншот ${this.esc(rom.title)}"></canvas><div class="emu-sub">Скриншот из эмулятора ${sys.emu}</div></td>
          <td class="emu-rom-info">
            <table class="emu-facts" cellspacing="0">
              <tr><td>Приставка</td><td>${sys.full}</td></tr>
              <tr><td>Год</td><td>${rom.year}</td></tr>
              <tr><td>Фирма</td><td>${this.esc(rom.maker)}</td></tr>
              <tr><td>Жанр</td><td>${rom.genre}</td></tr>
              <tr><td>Файл</td><td class="emu-mono">${rom.file}</td></tr>
              <tr><td>Размер</td><td>${rom.size}</td></tr>
              <tr><td>Маппер</td><td>${rom.mapper}</td></tr>
              <tr><td>Скачали</td><td class="emu-dl-count">${this.downloads(rom).toLocaleString('ru-RU')} раз</td></tr>
            </table>
            <button class="emu-btn emu-btn-dl" data-id="${rom.id}">Скачать ${rom.file}</button>
            <div class="emu-status-msg" role="status"></div>
          </td>
        </tr>
      </table>
      <p class="emu-text">${this.esc(rom.desc)}</p>
      <div class="emu-cheat"><b>Секрет:</b> ${this.esc(rom.cheat)} ${this.link('/cheats', 'Все коды')}</div>
      <p class="emu-sub">Дамп выложен для ознакомления. Если у вас нет картриджа, удалите файл через 24 часа.</p>
    `;
  }

  renderCheats() {
    const roms = this.getRoms();
    const systems = this.getSystems();
    return `
      <h2 class="emu-h">Коды и секреты</h2>
      <p>Все коды проверены на настоящих приставках и в эмуляторах. Кнопки указаны как на джойстике.</p>
      <table class="emu-roms" cellspacing="0">
        <tr><th>Игра</th><th>Приставка</th><th>Что сделать</th></tr>
        ${roms.map(r => `<tr><td>${this.link(`/rom?id=${r.id}`, `<b>${this.esc(r.title)}</b>`)}</td><td>${systems.find(s => s.id === r.sys).name}</td><td>${this.esc(r.cheat)}</td></tr>`).join('')}
      </table>
      <p class="emu-sub">В Sonic 2 на экране выбора уровня есть свой Sound Test. Сыграйте там 04, 01, 02, 06, и у Соника сразу будут все семь изумрудов.</p>
    `;
  }

  renderEmulators() {
    return `
      <h2 class="emu-h">Эмуляторы для Win 98</h2>
      <table class="emu-roms" cellspacing="0">
        <tr><th>Программа</th><th>Приставка</th><th>Что нужно</th><th>Заметки</th></tr>
        <tr><td><b>NESticle</b><div class="emu-sub">Bloodlust Software</div></td><td>Dendy / NES</td><td>Pentium 90, 16 МБ</td><td>Самый популярный. Сохраняет игру в любом месте, пишет ролики. Курсор в виде окровавленной руки. Последняя версия вышла 18 августа 1998 года.</td></tr>
        <tr><td><b>Genecyst</b><div class="emu-sub">Bloodlust Software</div></td><td>Sega Mega Drive</td><td>Pentium 133, 16 МБ</td><td>Звук FM-синтеза похож на настоящую Сегу. Работает в DOS, из Win 98 запускайте в полноэкранном режиме.</td></tr>
        <tr><td><b>ZSNES</b><div class="emu-sub">zsKnight и _Demo_</div></td><td>Super Nintendo</td><td>Pentium 166, 32 МБ</td><td>Написан на ассемблере, поэтому быстрый. Новые версии выходят часто, следите за обновлениями.</td></tr>
        <tr><td><b>Virtual GameBoy</b></td><td>Game Boy</td><td>486DX, 8 МБ</td><td>Показывает картинку в четырёх оттенках зелёного, как на настоящем экране.</td></tr>
      </table>
      <div class="emu-box"><b>Джойстик.</b> Геймпад подключается в игровой порт звуковой карты. Если его нет, все эмуляторы работают с клавиатуры: стрелки и Z, X, Enter.</div>
    `;
  }

  renderHistory() {
    return `
      <h2 class="emu-h">Как это было: от Dendy до 16 бит</h2>
      <div class="emu-history">
        <p>В 1992 году компания «Стиплер» начала продавать в России приставку Dendy. Внутри стояла тайваньская копия японской Famicom, на коробке был слонёнок, а по телевизору пели «Денди, Денди, мы все любим Денди». Картриджи продавали на рынках, часто по несколько игр на одном.</p>
        <p>Через пару лет пришла Sega Mega Drive 2. Шестнадцать бит, быстрый Соник и кровавый Mortal Kombat. Во дворах спорили, что лучше, Денди или Сега, и спор этот не закончен до сих пор.</p>
        <p>Сейчас у многих дома стоит компьютер. Эмулятор превращает его в приставку, а ROM-файл заменяет картридж. Мы собираем дампы игр, в которые играли во дворе, и проверяем, что каждый работает.</p>
      </div>
    `;
  }

  renderSite(url) {
    const { path, params } = this.parseUrl(url);
    let content;
    let active = '';
    if (path === '/roms') { content = this.renderSystem(params.get('sys')); active = params.get('sys'); }
    else if (path === '/rom') { content = this.renderRom(params.get('id')); const r = this.getRoms().find(x => x.id === params.get('id')); active = r ? r.sys : ''; }
    else if (path === '/cheats') { content = this.renderCheats(); active = 'cheats'; }
    else if (path === '/emulators') { content = this.renderEmulators(); active = 'emulators'; }
    else if (path === '/history') { content = this.renderHistory(); active = 'history'; }
    else content = this.renderHome();

    const roms = this.getRoms();
    return `
      <div class="emu-page">
        <div class="emu-wrap">
          <table class="emu-top" cellspacing="0">
            <tr>
              <td class="emu-logo">${this.link('', '<span class="emu-logo-a">EMU</span><span class="emu-logo-b">-LAND</span>')}<div class="emu-tag">архив картриджей Dendy, Sega, SNES и Game Boy</div></td>
              <td class="emu-power"><span class="emu-led"></span> POWER</td>
            </tr>
          </table>
          <table class="emu-carts" cellspacing="0">
            <tr>
              ${this.getSystems().map(s => `
                <td>
                  <a class="emu-cart emu-cart-${s.id}${active === s.id ? ' is-active' : ''}" data-url="${this.baseUrl}/roms?sys=${s.id}">
                    <span class="emu-cart-label">${s.name}</span>
                    <span class="emu-cart-sub">${roms.filter(r => r.sys === s.id).length} игр</span>
                  </a>
                </td>
              `).join('')}
            </tr>
          </table>
          <div class="emu-links">
            ${[['', 'Главная', ''], ['/cheats', 'Коды', 'cheats'], ['/emulators', 'Эмуляторы', 'emulators'], ['/history', 'История', 'history']].map(([p, label, k]) => k === active && k ? `<b>${label}</b>` : this.link(p, label)).join(' :: ')}
          </div>
          <div class="emu-main">${content}</div>
          <div class="emu-footer">
            <div>&copy; 1998 Emu-Land. Все игры принадлежат их владельцам. Дампы для ознакомления, удаляйте через 24 часа.</div>
            <div><a href="mailto:roms@emuland98.ru">roms@emuland98.ru</a> | <button type="button" class="emu-linkbtn emu-btn-clippy">Спросить Скрепыша</button></div>
            ${window.retroSites && window.retroSites.renderWebRing ? window.retroSites.renderWebRing(this.baseUrl) : ''}
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(win, container, url) {
    container.querySelectorAll('canvas.emu-shot').forEach(cv => this.drawShot(cv, cv.dataset.rom));

    container.querySelectorAll('.emu-btn-dl').forEach(btn => {
      btn.addEventListener('click', () => {
        const file = this.downloadRom(btn.dataset.id);
        if (!file) return;
        const rom = this.getRoms().find(r => r.id === btn.dataset.id);
        const msg = container.querySelector('.emu-status-msg');
        if (msg) msg.innerHTML = `${this.gif('check')} <b>${this.esc(file)}</b> сохранён в C:\\My Documents\\Downloads`;
        const count = container.querySelector('.emu-dl-count');
        if (count && rom) count.textContent = `${this.downloads(rom).toLocaleString('ru-RU')} раз`;
      });
    });

    const btnClippy = container.querySelector('.emu-btn-clippy');
    if (btnClippy) {
      btnClippy.addEventListener('click', () => {
        if (window.appClippy) {
          window.appClippy.wakeUp();
          window.appClippy.onNavigateIE(this.baseUrl, 'emuland', 'Emu-Land');
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.emuLandSite = new EmuLandSite();
}
