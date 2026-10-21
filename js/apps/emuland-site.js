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
        desc: 'Защищайте штаб с орлом от двадцати вражеских танков на каждом уровне. Кирпич пробивается по четвертинкам, бетон берёт только тяжёлый танк третьего ранга. Звёздочка усиливает пушку, лопата обносит штаб бетоном, часы замораживают врагов, каска даёт силовое поле.',
        controls: 'Стрелки — гусеницы (4 направления) | A / B — выстрел | Select — 1P/2P на заставке',
        cheat: 'На экране «STAGE 1» до начала уровня кнопки A и B меняют номер уровня. Всего уровней 35.' },
      { id: 'smb', sys: 'nes', title: 'Super Mario Bros.', ru: 'Марио', year: 1985, maker: 'Nintendo', genre: 'Платформер', size: '40 КБ', file: 'SUPER_MARIO_BROS.NES', dl: 4377, mapper: 'Mapper 0 (NROM)',
        desc: 'Водопроводчик Марио идёт через восемь миров спасать принцессу от Боузера. Супер-грибы позволяют разбивать кирпичи головой, огненный цветок даёт файерболы, звезда делает неуязвимым, а панцири черепах Купа сбивают целые шеренги врагов.',
        controls: 'Влево/Вправо — бег | A — прыжок | B — ускорение и огненный шар | Вниз — присесть',
        cheat: 'После Game Over зажмите A и нажмите Start на заставке: игра продолжится с начала того же мира.' },
      { id: 'contra', sys: 'nes', title: 'Contra', ru: 'Контра', year: 1988, maker: 'Konami', genre: 'Стрелялка', size: '128 КБ', file: 'CONTRA.NES', dl: 3950, mapper: 'Mapper 2 (UNROM)',
        desc: 'Бойцы Билл Райзер и Лэнс Бин штурмуют джунгли, водопад, снега и укреплённую стену пришельцев. Стрельба в восьми направлениях, сальто в прыжке, стрельба лёжа и капсулы с оружием S (веерный дробовик) и L (лазерный луч).',
        controls: 'Стрелки — прицел в 8 сторон / Вниз — лечь | A — прыжок сальто | B / C — огонь',
        cheat: 'На заставке: Вверх, Вверх, Вниз, Вниз, Влево, Вправо, Влево, Вправо, B, A, Start. На старте будет 30 жизней.' },
      { id: 'chipdale', sys: 'nes', title: 'Chip \'n Dale Rescue Rangers', ru: 'Чип и Дейл', year: 1990, maker: 'Capcom', genre: 'Платформер', size: '256 КБ', file: 'CHIP_N_DALE.NES', dl: 3211, mapper: 'Mapper 1 (MMC1)',
        desc: 'Спасатели Чип и Дейл сражаются с механическими псами и Толстопузом. Деревянные и стальные ящики, яблоки и даже напарника Дейла можно поднимать над головой и швырять во врагов, а муха Вжик даёт неуязвимость.',
        controls: 'Влево/Вправо — бег | A — прыжок | B — поднять / бросить ящик или Дейла | Вниз — спрятаться в ящик',
        cheat: 'Вдвоём бросайте напарника, как ящик: он долетает до врагов, которых ящиком не достать.' },
      { id: 'sonic2', sys: 'sega', title: 'Sonic the Hedgehog 2', ru: 'Соник 2', year: 1992, maker: 'Sega', genre: 'Платформер', size: '1024 КБ', file: 'SONIC2.BIN', dl: 3688, mapper: 'Картридж 8 Мбит',
        desc: 'Ёж Соник и двухвостый лисёнок Тейлз проносятся через Изумрудный Холм, Химический Завод и Ночное Казино с пинбольными бамперами и пружинами. При ударе кольца разлетаются во все стороны и их можно успеть собрать снова.',
        controls: 'Влево/Вправо — разгон | A / B / C — прыжок клубком | Вниз + A/B/C — Spin Dash с места',
        cheat: 'В «Options» в Sound Test сыграйте звуки 19, 65, 09, 17. Затем на заставке зажмите A и нажмите Start: откроется выбор уровня.' },
      { id: 'umk3', sys: 'sega', title: 'Ultimate Mortal Kombat 3', ru: 'Мортал Комбат', year: 1996, maker: 'Midway', genre: 'Драка', size: '4096 КБ', file: 'UMK3.BIN', dl: 4155, mapper: 'Картридж 32 Мбит',
        desc: 'Скорпион, Саб-Зиро, Сайракс, Нуб Сайбот и Шао Кан на арене смертельной битвы. Гарпун Скорпиона «GET OVER HERE!», ледяной шар Саб-Зиро, плазменная сеть, апперкот с выкриком «TOASTY!» и кровавые добивания Fatality.',
        controls: 'A — удар рукой | B — удар ногой | Вниз + A — апперкот | C — спецприём (Гарпун / Лёд) и Fatality',
        cheat: 'На заставке: A, C, Вверх, B, Вверх, B, A, Вниз. Откроется меню с секретными настройками.' },
      { id: 'comixzone', sys: 'sega', title: 'Comix Zone', ru: 'Комикс Зон', year: 1995, maker: 'Sega', genre: 'Драка', size: '2048 КБ', file: 'COMIX_ZONE.BIN', dl: 1874, mapper: 'Картридж 16 Мбит',
        desc: 'Художник Скетч Тёрнер попадает на страницы собственного комикса. Огромная рука злодея Мортуса дорисовывает мутантов карандашом прямо в кадре, а Скетч крушит их сериями ударов и запускает бумажные самолётики из уголка страницы.',
        controls: 'Влево/Вправо — шаг по кадру | A / B — серия ударов и удар в прыжке | C — бумажный самолётик',
        cheat: 'В «Jukebox» в настройках включите треки 14, 15, 18, 5, 13, 1, 3, 18, 15, 6. Затем выбирайте номер страницы.' },
      { id: 'smw', sys: 'snes', title: 'Super Mario World', ru: 'Марио 4', year: 1990, maker: 'Nintendo', genre: 'Платформер', size: '512 КБ', file: 'SUPER_MARIO_WORLD.SMC', dl: 1502, mapper: 'LoROM',
        desc: 'Марио верхом на динозаврике Йоши исследует карту Страны Динозавров из 96 выходов. Перо даёт плащ-парашют для полёта, а Йоши длинным языком хватает монеты, ягоды и черепах прямо на бегу.',
        controls: 'Влево/Вправо — бег | A / B — прыжок и планирование на плаще | C — длинный язык Йоши | Start + Select — карта',
        cheat: 'Из уже пройденного уровня можно выйти на карту: поставьте паузу и нажмите Select.' },
      { id: 'tetris', sys: 'gb', title: 'Tetris', ru: 'Тетрис', year: 1989, maker: 'Nintendo', genre: 'Головоломка', size: '32 КБ', file: 'TETRIS.GB', dl: 2240, mapper: 'Без маппера',
        desc: 'Карманный Тетрис с заставкой храма Василия Блаженного, четырьмя оттенками оливкового экрана DMG-01, фирменными узорами каждой из семи фигур, контуром посадки, мгновенным сбросом и стартом ракеты «Союз».',
        controls: 'Влево/Вправо — сдвиг | A / B / Вверх — поворот с отскоком от стен | Вниз — ускорить | C — мгновенный сброс',
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

  drawLiveCoreShot(ctx, id) {
    const nes = (typeof window !== 'undefined' && window.EmuNesCores) ? window.EmuNesCores : {};
    const bit16 = (typeof window !== 'undefined' && window.Emu16BitCores) ? window.Emu16BitCores : {};
    const CoreClass = nes[id] || bit16[id];
    if (!CoreClass) return false;
    const core = new CoreClass(null);
    core.mode = 'play';
    core.tick = 18;
    if (id === 'battlecity') {
      core.enemies.forEach(e => { e.spawnFlash = 0; e.y = 48; });
      core.powerup = { type: 'star', x: 112, y: 120 };
      core.fx.push({ kind: 'explosion', x: 120, y: 56, timer: 4, maxTimer: 20 });
    } else if (id === 'smb') {
      core.mario.power = 2;
      core.mario.x = 76;
      core.items.push({ x: 160, y: 112, vx: 0.9, vy: 0, kind: 'flower' });
      core.fireballs.push({ x: 108, y: 170, vx: 3, vy: -1 });
    } else if (id === 'contra') {
      core.weapon = 'S';
      core.shoot();
    } else if (id === 'chipdale') {
      core.chip.zipperTimer = 180;
    } else if (id === 'sonic2') {
      core.rings = 27;
      core.score = 14200;
    } else if (id === 'umk3') {
      core.p1.pose = 'uppercut';
      core.p2.hp = 24;
      core.toastyTimer = 30;
      core.projectiles.push({ x: 116, y: 134, vx: 4, kind: 'harpoon' });
    } else if (id === 'comixzone') {
      core.sketch.pose = 'kick';
      core.burstTimer = 12;
      core.burstText = 'POW!';
      core.handTimer = 20;
    } else if (id === 'smw') {
      core.tongueTimer = 10;
      core.mario.x = 84;
    } else if (id === 'tetris') {
      core.score = 4820;
      core.level = 6;
      core.lines = 28;
      core.heartMode = true;
      const sample = [
        [1, 0, 0, 2, 2, 0, 0, 3, 3, 3],
        [1, 4, 4, 2, 2, 0, 5, 5, 3, 0],
        [1, 4, 6, 6, 7, 7, 5, 1, 1, 0],
        [1, 4, 6, 6, 7, 7, 5, 2, 2, 3]
      ];
      sample.forEach((r, idx) => { core.board[16 + idx] = r; });
    }
    core.render(ctx);
    return true;
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
    if (this.drawLiveCoreShot(ctx, id)) {
      ctx.restore();
      return;
    }
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const text = (s, x, y, c, size = 8) => { ctx.fillStyle = c; ctx.font = `bold ${size}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.fillText(s, x, y); };
    const tank = ['..aa..', '.abba.', 'aabbaa', 'aabbaa', 'a.aa.a', 'a....a'];
    if (id === 'battlecity') {
      R(0, 0, W, H, '#000000');
      R(224, 0, 32, H, '#7c7c7c');
      this.sprite(ctx, tank, { a: '#e8d020', b: '#a87800' }, 80, 192, 2.6);
      text('1P', 230, 150, '#000000');
    } else {
      R(0, 0, W, H, '#202020');
      text(String(id || 'ROM').toUpperCase(), 80, 112, '#fcfcfc');
    }
    ctx.restore();
  }

  playRomInEmulator(id) {
    const rom = this.getRoms().find(r => r.id === id);
    if (!rom) return null;
    const file = this.downloadRom(id);
    const folder = ['My Computer', 'C:', 'My Documents', 'Downloads'];
    let content = null;
    if (window.vfs) {
      const lookup = window.vfs.resolvePath ? window.vfs.resolvePath([...folder, file]) : (window.vfs.getNode ? window.vfs.getNode([...folder, file]) : null);
      if (lookup && lookup.content) content = lookup.content;
    }
    if (window.appEmulator) {
      window.appEmulator.open(file, content, folder);
    }
    return file;
  }

  downloadEmulatorExe(exeName, core) {
    const cleanExe = String(exeName || 'EMULAND98.EXE').toUpperCase();
    const folder = ['My Computer', 'C:', 'My Documents', 'Downloads'];
    if (window.vfs) {
      const dir = window.vfs.resolvePath ? window.vfs.resolvePath(folder) : (window.vfs.getNode ? window.vfs.getNode(folder) : null);
      if (dir && dir.children) {
        dir.children[cleanExe] = {
          type: 'app',
          name: cleanExe,
          icon: 'emulator',
          app: 'emulator',
          core: core || null
        };
        if (window.vfs.saveToStorage) window.vfs.saveToStorage();
        else if (window.vfs.save) window.vfs.save();
      }
    }
    if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
    return cleanExe;
  }

  romRows(roms) {
    const systems = this.getSystems();
    return `
      <table class="emu-roms" cellspacing="0">
        <tr><th></th><th>Игра</th><th>Год</th><th>Жанр</th><th>Размер</th><th>Скачали</th><th>Картридж</th></tr>
        ${roms.map(r => `
          <tr>
            <td class="emu-thumb-cell"><a data-url="${this.baseUrl}/rom?id=${r.id}"><canvas class="emu-shot emu-thumb" width="64" height="56" data-rom="${r.id}" role="img" aria-label="${this.esc(r.title)}"></canvas></a></td>
            <td>${this.link(`/rom?id=${r.id}`, `<b>${this.esc(r.title)}</b>`)}<div class="emu-sub">${this.esc(r.ru)}, ${this.esc(r.maker)}${roms.some(x => x.sys !== r.sys) && !r.maker.includes(systems.find(s => s.id === r.sys).name) ? `, ${systems.find(s => s.id === r.sys).name}` : ''}</div></td>
            <td>${r.year}</td>
            <td>${r.genre}</td>
            <td class="emu-r">${r.size}</td>
            <td class="emu-r">${this.downloads(r).toLocaleString('ru-RU')}</td>
            <td class="emu-r"><button type="button" class="emu-btn emu-btn-sm emu-btn-play" data-play-rom="${r.id}">Играть</button></td>
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
              3. Откройте ROM в эмуляторе.<br><br>
              <button type="button" class="emu-btn emu-btn-sm" data-launch-core="nes">Открыть Emu-Land 98</button>
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
            <div class="emu-btn-row">
              <button class="emu-btn emu-btn-dl" data-id="${rom.id}">Скачать ${rom.file}</button>
              <button class="emu-btn emu-btn-alt emu-btn-play" data-play-rom="${rom.id}">Играть в ${sys.emu}</button>
            </div>
            <div class="emu-status-msg" role="status"></div>
          </td>
        </tr>
      </table>
      <p class="emu-text">${this.esc(rom.desc)}</p>
      ${rom.controls ? `<div class="emu-box" style="margin-bottom:8px;"><b>Управление и приёмы:</b> ${this.esc(rom.controls)}</div>` : ''}
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
        <tr><th>Игра</th><th>Приставка</th><th>Что сделать</th><th>Проверка</th></tr>
        ${roms.map(r => `<tr><td>${this.link(`/rom?id=${r.id}`, `<b>${this.esc(r.title)}</b>`)}</td><td>${systems.find(s => s.id === r.sys).name}</td><td>${this.esc(r.cheat)}</td><td class="emu-r"><button type="button" class="emu-btn emu-btn-sm emu-btn-play" data-play-rom="${r.id}">Проверить</button></td></tr>`).join('')}
      </table>
      <p class="emu-sub">В Sonic 2 на экране выбора уровня есть свой Sound Test. Сыграйте там 04, 01, 02, 06, и у Соника сразу будут все семь изумрудов.</p>
    `;
  }

  renderEmulators() {
    return `
      <h2 class="emu-h">Эмуляторы для Win 98</h2>
      <div class="emu-box" style="margin-bottom:8px;">
        <b>Сборка Emu-Land 98 Multi-System (v2.4 RU)</b> — объединяет ядра NESticle, Genecyst, ZSNES и Virtual GameBoy в одной оболочке с поддержкой быстрых сохранений (Save States F5/F7), встроенной шпаргалкой кодов и проверкой дампов из <code>C:\\My Documents\\Downloads</code>.<br>
        <div class="emu-btn-row" style="margin-top:6px;">
          <button type="button" class="emu-btn" data-launch-core="nes">Запустить Emu-Land 98</button>
          <button type="button" class="emu-btn emu-btn-alt" data-dl-emu="EMULAND98.EXE" data-core="nes">Скачать EMULAND98.EXE</button>
        </div>
      </div>
      <table class="emu-roms" cellspacing="0">
        <tr><th>Программа</th><th>Приставка</th><th>Что нужно</th><th>Заметки</th><th>Действие</th></tr>
        <tr><td><b>NESticle</b><div class="emu-sub">Bloodlust Software</div></td><td>Dendy / NES</td><td>Pentium 90, 16 МБ</td><td>Самый популярный. Сохраняет игру в любом месте, пишет ролики. Курсор в виде окровавленной руки. Последняя версия вышла 18 августа 1998 года.</td><td class="emu-r"><button type="button" class="emu-btn emu-btn-sm" data-launch-core="nes">Запуск</button> <button type="button" class="emu-btn emu-btn-alt emu-btn-sm" data-dl-emu="NESTICLE.EXE" data-core="nes">.EXE</button></td></tr>
        <tr><td><b>Genecyst</b><div class="emu-sub">Bloodlust Software</div></td><td>Sega Mega Drive</td><td>Pentium 133, 16 МБ</td><td>Звук FM-синтеза похож на настоящую Сегу. Работает в DOS, из Win 98 запускайте в полноэкранном режиме.</td><td class="emu-r"><button type="button" class="emu-btn emu-btn-sm" data-launch-core="sega">Запуск</button> <button type="button" class="emu-btn emu-btn-alt emu-btn-sm" data-dl-emu="GENECYST.EXE" data-core="sega">.EXE</button></td></tr>
        <tr><td><b>ZSNES</b><div class="emu-sub">zsKnight и _Demo_</div></td><td>Super Nintendo</td><td>Pentium 166, 32 МБ</td><td>Написан на ассемблере, поэтому быстрый. Новые версии выходят часто, следите за обновлениями.</td><td class="emu-r"><button type="button" class="emu-btn emu-btn-sm" data-launch-core="snes">Запуск</button> <button type="button" class="emu-btn emu-btn-alt emu-btn-sm" data-dl-emu="ZSNESW.EXE" data-core="snes">.EXE</button></td></tr>
        <tr><td><b>Virtual GameBoy</b></td><td>Game Boy</td><td>486DX, 8 МБ</td><td>Показывает картинку в четырёх оттенках зелёного, как на настоящем экране.</td><td class="emu-r"><button type="button" class="emu-btn emu-btn-sm" data-launch-core="gb">Запуск</button> <button type="button" class="emu-btn emu-btn-alt emu-btn-sm" data-dl-emu="VGB98.EXE" data-core="gb">.EXE</button></td></tr>
      </table>
      <div class="emu-status-msg" role="status"></div>
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
        const sys = rom ? this.getSystems().find(s => s.id === rom.sys) : null;
        const msg = container.querySelector('.emu-status-msg');
        if (msg) {
          msg.innerHTML = `${this.gif('check')} <b>${this.esc(file)}</b> сохранён в C:\\My Documents\\Downloads — <button type="button" class="emu-linkbtn-inline" data-play-rom="${this.esc(btn.dataset.id)}">Запустить в ${this.esc(sys ? sys.emu : 'эмуляторе')}</button>`;
          const inlineBtn = msg.querySelector('[data-play-rom]');
          if (inlineBtn) inlineBtn.addEventListener('click', () => this.playRomInEmulator(inlineBtn.dataset.playRom));
        }
        const count = container.querySelector('.emu-dl-count');
        if (count && rom) count.textContent = `${this.downloads(rom).toLocaleString('ru-RU')} раз`;
      });
    });

    container.querySelectorAll('[data-play-rom]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.playRomInEmulator(btn.dataset.playRom);
      });
    });

    container.querySelectorAll('[data-launch-core]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.appEmulator) window.appEmulator.open(btn.dataset.launchCore || null);
      });
    });

    container.querySelectorAll('[data-dl-emu]').forEach(btn => {
      btn.addEventListener('click', () => {
        const exe = this.downloadEmulatorExe(btn.dataset.dlEmu, btn.dataset.core);
        const msg = container.querySelector('.emu-status-msg');
        if (msg) {
          msg.innerHTML = `${this.gif('check')} <b>${this.esc(exe)}</b> сохранён в C:\\My Documents\\Downloads — <button type="button" class="emu-linkbtn-inline" data-launch-inline="${this.esc(btn.dataset.core || 'nes')}">Запустить сейчас</button>`;
          const inlineBtn = msg.querySelector('[data-launch-inline]');
          if (inlineBtn) inlineBtn.addEventListener('click', () => { if (window.appEmulator) window.appEmulator.open(inlineBtn.dataset.launchInline); });
        }
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
