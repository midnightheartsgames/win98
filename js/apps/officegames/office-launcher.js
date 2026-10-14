window.OfficeGamesRegistry = [
  {
    id: 'snake3d',
    title: '3D Змейка',
    category: 'Аркада / 3D',
    icon: 'game-manager',
    exePath: 'D:\\GAMES\\SNAKE3D\\SNAKE3D.EXE',
    appId: 'og_snake3d',
    desc: 'Трехмерная офисная змейка в изометрической проекции. Собирайте дискеты и чашки кофе, маневрируя между системными блоками и кактусами. С каждым уровнем скорость возрастает!',
    controls: 'Стрелки клавиатуры / A, D — поворот; Пробел — пауза; F12 — Тревожная кнопка.',
    scoreKey: 'office_games_scores_snake3d',
    open: () => {
      if (window.appOgSnake3d) window.appOgSnake3d.open();
      else window.winManager.openDialog({ title: '3D Змейка', icon: 'info', message: 'Модуль игры «3D Змейка» готовится к установке.' });
    }
  },
  {
    id: 'arkanoid',
    title: 'Офисный Арканоид',
    category: 'Классика',
    icon: 'game-manager',
    exePath: 'D:\\GAMES\\ARKANOID\\ARKANOID.EXE',
    appId: 'og_arkanoid',
    desc: 'Крушите стопки квартальных отчетов, папки-скоросшиватели и старые CRT-мониторы! Ловите выпадающие бонусы: лазерную указку, мультибол и расширенную ракетку.',
    controls: 'Мышь / Стрелки влево и вправо — ракетка; Пробел — пуск шарика / лазер; F12 — Тревожная кнопка.',
    scoreKey: 'office_games_scores_arkanoid',
    open: () => {
      if (window.appOgArkanoid) window.appOgArkanoid.open();
      else window.winManager.openDialog({ title: 'Офисный Арканоид', icon: 'info', message: 'Модуль игры «Офисный Арканоид» будет установлен на следующем этапе.' });
    }
  },
  {
    id: 'rush',
    title: 'Побег в 18:00',
    category: 'Платформер',
    icon: 'game-manager',
    exePath: 'D:\\GAMES\\PLATFORM\\OFFICERUN.EXE',
    appId: 'og_rush',
    desc: 'Рабочий день окончен! Бегите по офисным коридорам мимо злых начальников с кипами неоплаченных счетов, скользких луж от кулера и летающих самолетиков прямо к лифту!',
    controls: 'Стрелки влево/вправо — бег; Пробел / Стрелка вверх — прыжок; F12 — Тревожная кнопка.',
    scoreKey: 'office_games_scores_rush',
    open: () => {
      if (window.appOgRush) window.appOgRush.open();
      else window.winManager.openDialog({ title: 'Побег в 18:00', icon: 'info', message: 'Модуль игры «Побег в 18:00» готовится к установке.' });
    }
  },
  {
    id: 'hunt',
    title: 'Офисный Тир',
    category: 'Тир / Экшен',
    icon: 'game-manager',
    exePath: 'D:\\GAMES\\SHOOTER\\MOORHUNT.EXE',
    appId: 'og_hunt',
    desc: 'Легендарный тир в духе Морхухн! Стреляйте резиновыми пульками по назойливым скрепкам, офисным птицам и часам. Секретные цели на фоне open-space добавляют драгоценные секунды!',
    controls: 'Мышь — прицел; Левая кнопка — выстрел; Правая кнопка / Пробел — перезарядка обоймы; F12 — Тревожная кнопка.',
    scoreKey: 'office_games_scores_hunt',
    open: () => {
      if (window.appOgHunt) window.appOgHunt.open();
      else window.winManager.openDialog({ title: 'Офисный Тир', icon: 'info', message: 'Модуль игры «Офисный Тир» готовится к установке.' });
    }
  },
  {
    id: 'gems',
    title: 'Офисные Самоцветы',
    category: 'Головоломка',
    icon: 'game-manager',
    exePath: 'D:\\GAMES\\MATCH3\\GEMS98.EXE',
    appId: 'og_gems',
    desc: 'Классическая медитативная головоломка «Три в ряд». Собирайте цепочки из дискет, чашек кофе, степлеров и печатей. Взрывные степлеры и лазерные указки помогут закрыть квартал!',
    controls: 'Мышь — выбор и обмен соседних офисных фишек; F12 — Тревожная кнопка.',
    scoreKey: 'office_games_scores_gems',
    open: () => {
      if (window.appOgGems) window.appOgGems.open();
      else window.winManager.openDialog({ title: 'Офисные Самоцветы', icon: 'info', message: 'Модуль игры «Офисные Самоцветы» готовится к установке.' });
    }
  },
  {
    id: 'lines98',
    title: 'Цветные Линии 98',
    category: 'Логика',
    icon: 'game-manager',
    exePath: 'D:\\GAMES\\LINES98\\LINES98.EXE',
    appId: 'og_lines',
    desc: 'Культовая офисная головоломка! Перемещайте цветные шарики по полю 9x9, выстраивая линии из пяти и более одинаковых элементов. Каждые три хода поле пополняется новыми шариками.',
    controls: 'Мышь — выбор и перемещение шарика; F12 — Тревожная кнопка.',
    scoreKey: 'office_games_scores_lines98',
    open: () => {
      if (window.appOgLines) window.appOgLines.open();
      else window.winManager.openDialog({ title: 'Цветные Линии 98', icon: 'info', message: 'Модуль игры «Цветные Линии 98» готовится к установке.' });
    }
  },
  {
    id: 'tetris',
    title: 'Офисный Тетрис',
    category: 'Классика',
    icon: 'game-manager',
    exePath: 'D:\\GAMES\\TETRIS\\TETRIS.EXE',
    appId: 'og_tetris',
    desc: 'Укладывайте архивные папки, коробки документов и системные блоки в плотные ряды. Заполненные ряды отправляются в шредер! С каждым уровнем скорость падения возрастает.',
    controls: 'Стрелки влево/вправо — движение; Стрелка вверх / Пробел — поворот; Стрелка вниз — ускорение; F12 — Тревожная кнопка.',
    scoreKey: 'office_games_scores_tetris',
    open: () => {
      if (window.appOgTetris) window.appOgTetris.open();
      else window.winManager.openDialog({ title: 'Офисный Тетрис', icon: 'info', message: 'Модуль игры «Офисный Тетрис» готовится к установке.' });
    }
  },
  {
    id: 'chairs',
    title: 'Гонки на креслах',
    category: 'Аркада / Гонки',
    icon: 'game-manager',
    exePath: 'D:\\GAMES\\CHAIRS\\CHAIRS.EXE',
    appId: 'og_chairs',
    desc: 'Безумные офисные ралли на офисных креслах с колесиками! Мчитесь по коридорам офиса, уворачивайтесь от тележек уборщиц и луж от кулера, собирая бодрящий кофе для турбо-ускорения.',
    controls: 'Стрелки влево/вправо — руление; Стрелка вверх / Пробел — толчок ногой; Стрелка вниз — тормоз; F12 — Тревожная кнопка.',
    scoreKey: 'office_games_scores_chairs',
    open: () => {
      if (window.appOgChairs) window.appOgChairs.open();
      else window.winManager.openDialog({ title: 'Гонки на креслах', icon: 'info', message: 'Модуль игры «Гонки на креслах» готовится к установке.' });
    }
  }
];

class AppOfficeLauncher {
  constructor() {
    this.winId = 'app_office_launcher';
    this.selectedGameId = 'arkanoid';
    this.win = null;
  }

  getHighScore(game) {
    try {
      const raw = localStorage.getItem(game.scoreKey);
      if (raw) {
        const val = parseInt(raw, 10);
        if (!isNaN(val)) return val;
      }
    } catch (e) {}
    return 0;
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.bringToTop(this.winId);
      return;
    }

    if (window.soundSys && window.soundSys.playClick) {
      window.soundSys.playClick();
    }

    const title = window.i18n ? window.i18n.t('cdrom.officeLabel') : 'Офисные игры ’98 (D:)';
    this.win = window.winManager.createWindow({
      id: this.winId,
      title: title,
      icon: 'game-manager',
      width: 630,
      height: 470,
      resizable: false,
      maximizable: false,
      onClose: () => {
        this.win = null;
      }
    });

    if (this.win && !this.win.body) {
      this.win.body = this.win.bodyElement || (this.win.element ? this.win.element.querySelector('.win-window-body') : null);
    }

    this.render();
  }

  render() {
    if (!this.win) return;
    const body = this.win.body || this.win.bodyElement || (this.win.element ? this.win.element.querySelector('.win-window-body') : null);
    if (!body) return;
    this.win.body = body;

    this.win.body.innerHTML = `
      <div class="office-launcher-window">
        <div class="ol-header-banner">
          <div>
            <div class="ol-header-title">ЗОЛОТАЯ КОЛЛЕКЦИЯ: ЛУЧШИЕ ИГРЫ ДЛЯ ОФИСА ’98</div>
            <div class="ol-header-sub">Том: OFFICE_GAMES_98 &bull; Компакт-диск в приводе D: &bull; Версия 1.0</div>
          </div>
          <div class="ol-header-badge">CD-ROM EDITION</div>
        </div>

        <div class="ol-main-container">
          <div class="ol-sidebar">
            <div class="ol-sidebar-title">Список игр на диске</div>
            <div class="ol-games-list" id="ol-games-list"></div>
          </div>

          <div class="ol-details-panel">
            <div class="ol-preview-frame">
              <canvas class="ol-preview-canvas" id="ol-preview-canvas" width="360" height="140"></canvas>
              <div class="ol-preview-badge" id="ol-preview-badge">Preview</div>
            </div>

            <div class="ol-info-card">
              <div class="ol-game-title-row">
                <span class="ol-title-text" id="ol-card-title"></span>
                <span class="ol-category-tag" id="ol-card-cat"></span>
              </div>
              <div class="ol-desc-text" id="ol-card-desc"></div>
              <div class="ol-controls-box">
                <div class="ol-controls-label">Управление:</div>
                <div class="ol-controls-value" id="ol-card-controls"></div>
              </div>
              <div class="ol-actions-row">
                <button class="ol-btn ol-btn-primary" id="ol-btn-play">▶ Запустить игру</button>
                <button class="ol-btn" id="ol-btn-shortcut">Создать ярлык</button>
                <button class="ol-btn" id="ol-btn-help">Справка</button>
              </div>
            </div>
          </div>
        </div>

        <div class="ol-statusbar">
          <div class="ol-status-pane ol-status-main" id="ol-status-main">Готово к запуску</div>
          <div class="ol-status-pane ol-status-boss">Тревога: F12 (Boss Key)</div>
          <div class="ol-status-pane ol-status-drive">Привод D:</div>
        </div>
      </div>
    `;

    this.populateList();
    this.selectGame(this.selectedGameId);

    const playBtn = this.win.body.querySelector('#ol-btn-play');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const game = window.OfficeGamesRegistry.find(g => g.id === this.selectedGameId);
        if (game) {
          if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
          game.open();
        }
      });
    }

    const shortcutBtn = this.win.body.querySelector('#ol-btn-shortcut');
    if (shortcutBtn) {
      shortcutBtn.addEventListener('click', () => {
        const game = window.OfficeGamesRegistry.find(g => g.id === this.selectedGameId);
        if (game) this.createDesktopShortcut(game);
      });
    }

    const helpBtn = this.win.body.querySelector('#ol-btn-help');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => this.showHelp());
    }
  }

  populateList() {
    const listEl = this.win.body.querySelector('#ol-games-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    window.OfficeGamesRegistry.forEach(game => {
      const itemEl = document.createElement('div');
      itemEl.className = 'ol-game-item' + (game.id === this.selectedGameId ? ' active' : '');
      itemEl.dataset.id = game.id;

      const score = this.getHighScore(game);
      const iconSvg = (window.Icons && window.Icons[game.icon]) || '';

      itemEl.innerHTML = `
        <div class="ol-game-item-icon">${iconSvg}</div>
        <div class="ol-game-item-info">
          <div class="ol-game-item-name">${game.title}</div>
          <div class="ol-game-item-meta">${game.category} &bull; Рекорд: ${score}</div>
        </div>
      `;

      itemEl.addEventListener('click', () => {
        if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
        this.selectGame(game.id);
      });

      itemEl.addEventListener('dblclick', () => {
        game.open();
      });

      listEl.appendChild(itemEl);
    });
  }

  selectGame(id) {
    this.selectedGameId = id;
    const game = window.OfficeGamesRegistry.find(g => g.id === id) || window.OfficeGamesRegistry[0];

    const items = this.win.body.querySelectorAll('.ol-game-item');
    items.forEach(it => {
      it.classList.toggle('active', it.dataset.id === id);
    });

    const titleEl = this.win.body.querySelector('#ol-card-title');
    const catEl = this.win.body.querySelector('#ol-card-cat');
    const descEl = this.win.body.querySelector('#ol-card-desc');
    const ctrlEl = this.win.body.querySelector('#ol-card-controls');
    const statusEl = this.win.body.querySelector('#ol-status-main');
    const badgeEl = this.win.body.querySelector('#ol-preview-badge');

    if (titleEl) titleEl.textContent = game.title;
    if (catEl) catEl.textContent = `${game.category} (${game.exePath})`;
    if (descEl) descEl.textContent = game.desc;
    if (ctrlEl) ctrlEl.textContent = game.controls;
    if (statusEl) statusEl.textContent = `Выбрана игра: ${game.title} [${game.exePath}]`;
    if (badgeEl) badgeEl.textContent = game.category;

    const canvas = this.win.body.querySelector('#ol-preview-canvas');
    if (canvas) this.drawPreview(canvas, game.id);
  }

  drawPreview(canvas, gameId) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#101010';
    ctx.fillRect(0, 0, w, h);

    if (gameId === 'snake3d') {
      ctx.strokeStyle = '#203020';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 40, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const drawIsoBox = (bx, by, size, topCol, leftCol, rightCol) => {
        ctx.fillStyle = topCol;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + size, by - size * 0.5);
        ctx.lineTo(bx + size * 2, by);
        ctx.lineTo(bx + size, by + size * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = leftCol;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + size, by + size * 0.5);
        ctx.lineTo(bx + size, by + size * 1.5);
        ctx.lineTo(bx, by + size);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = rightCol;
        ctx.beginPath();
        ctx.moveTo(bx + size, by + size * 0.5);
        ctx.lineTo(bx + size * 2, by);
        ctx.lineTo(bx + size * 2, by + size);
        ctx.lineTo(bx + size, by + size * 1.5);
        ctx.closePath();
        ctx.fill();
      };

      drawIsoBox(80, 80, 16, '#00ff66', '#009933', '#00cc44');
      drawIsoBox(112, 64, 16, '#00ee55', '#008822', '#00bb33');
      drawIsoBox(144, 48, 16, '#00dd44', '#007711', '#00aa22');
      drawIsoBox(176, 48, 16, '#00cc33', '#006600', '#009911');
      drawIsoBox(240, 80, 14, '#ff3333', '#aa0000', '#dd2222');

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Tahoma';
      ctx.fillText('SCORE: 00480  SPEED: x2', 15, 20);
    } else if (gameId === 'arkanoid') {
      const colors = ['#ff3333', '#ffaa00', '#33cc33', '#3399ff', '#cc33ff'];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 10; c++) {
          ctx.fillStyle = colors[r % colors.length];
          const bx = 30 + c * 30;
          const by = 25 + r * 16;
          ctx.fillRect(bx, by, 26, 12);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx, by, 26, 2);
          ctx.fillRect(bx, by, 2, 12);
          ctx.fillStyle = '#000000';
          ctx.fillRect(bx + 24, by, 2, 12);
          ctx.fillRect(bx, by + 10, 26, 2);
        }
      }
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(150, 120, 60, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(150, 120, 60, 2);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(175, 95, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffff00';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(175, 95);
      ctx.lineTo(160, 115);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (gameId === 'rush') {
      ctx.fillStyle = '#2b2b36';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#404050';
      ctx.fillRect(0, 105, w, 35);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(0, 105, w, 2);

      ctx.fillStyle = '#808090';
      ctx.fillRect(300, 35, 45, 70);
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(322, 25, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#664422';
      ctx.fillRect(180, 80, 40, 25);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(190, 75, 12, 5);

      ctx.fillStyle = '#ff6600';
      ctx.fillRect(80, 65, 16, 22);
      ctx.fillStyle = '#ffddaa';
      ctx.fillRect(82, 55, 12, 10);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(86, 68, 4, 14);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Tahoma';
      ctx.fillText('18:00 P.M. - RUN TO ELEVATOR!', 15, 20);
    } else if (gameId === 'hunt') {
      ctx.fillStyle = '#3a506b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#5b708b';
      ctx.fillRect(40, 40, 90, 65);
      ctx.fillRect(180, 50, 90, 55);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(225, 60, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff9900';
      ctx.beginPath();
      ctx.moveTo(239, 60);
      ctx.lineTo(248, 63);
      ctx.lineTo(239, 66);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 12px Tahoma';
      ctx.fillText('+25', 242, 45);

      const cx = 150;
      const cy = 70;
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.moveTo(cx - 24, cy);
      ctx.lineTo(cx + 24, cy);
      ctx.moveTo(cx, cy - 24);
      ctx.lineTo(cx, cy + 24);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Tahoma';
      ctx.fillText('AMMO: [||||||||]  TIME: 84s', 15, 130);
    } else if (gameId === 'gems') {
      const gemColors = ['#ff3333', '#3399ff', '#33cc33', '#ffcc00', '#cc33ff', '#ff6600'];
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 12; c++) {
          const gx = 25 + c * 26;
          const gy = 15 + r * 19;
          const col = gemColors[(r * 4 + c * 3) % gemColors.length];
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(gx + 10, gy + 8, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(gx + 8, gy + 6, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(101, 32, 54, 21);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Tahoma';
      ctx.fillText('COMBO x3!', 165, 47);
    } else if (gameId === 'lines98') {
      ctx.fillStyle = '#222230';
      ctx.fillRect(0, 0, w, h);
      const cell = 14;
      const startX = 40;
      const startY = 12;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#323242' : '#2b2b3b';
          ctx.fillRect(startX + c * cell, startY + r * cell, cell - 1, cell - 1);
        }
      }
      const balls = [
        { r: 2, c: 2, col: '#ff3333' },
        { r: 2, c: 3, col: '#ff3333' },
        { r: 2, c: 4, col: '#ff3333' },
        { r: 2, c: 5, col: '#ff3333' },
        { r: 2, c: 6, col: '#ff3333' },
        { r: 4, c: 1, col: '#3388ff' },
        { r: 5, c: 7, col: '#33cc33' },
        { r: 7, c: 4, col: '#ffcc00' }
      ];
      balls.forEach(b => {
        const bx = startX + b.c * cell + cell / 2 - 0.5;
        const by = startY + b.r * cell + cell / 2 - 0.5;
        ctx.fillStyle = b.col;
        ctx.beginPath();
        ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx - 1.5, by - 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(startX + 2 * cell - 2, startY + 2 * cell - 2, cell * 5 + 3, cell + 3);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Tahoma';
      ctx.fillText('LINES ’98', 190, 45);
      ctx.font = '10px Tahoma';
      ctx.fillStyle = '#00ff00';
      ctx.fillText('+10 ОЧКОВ!', 190, 65);
    } else if (gameId === 'tetris') {
      ctx.fillStyle = '#181824';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#10101a';
      ctx.fillRect(50, 8, 90, 130);
      ctx.strokeStyle = '#505060';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(50, 8, 90, 130);
      const colors = ['#2060cc', '#e63946', '#2a9d8f', '#e76f51', '#f4a261'];
      for (let r = 8; r < 13; r++) {
        for (let c = 0; c < 9; c++) {
          if (r === 9 && (c === 4 || c === 5)) continue;
          ctx.fillStyle = colors[(r + c) % colors.length];
          ctx.fillRect(51 + c * 10, 8 + r * 10, 9, 9);
        }
      }
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(81, 38, 9, 9);
      ctx.fillRect(91, 38, 9, 9);
      ctx.fillRect(101, 38, 9, 9);
      ctx.fillRect(91, 48, 9, 9);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Tahoma';
      ctx.fillText('АРХИВ ТЕТРИС', 160, 40);
      ctx.font = '10px Tahoma';
      ctx.fillStyle = '#ffff00';
      ctx.fillText('ЛИНИЙ: 14', 160, 60);
      ctx.fillText('СЧЕТ: 4 200', 160, 78);
    } else if (gameId === 'chairs') {
      ctx.fillStyle = '#2c3340';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3a4454';
      ctx.fillRect(30, 0, w - 60, h);
      ctx.strokeStyle = '#505d72';
      ctx.lineWidth = 1;
      for (let y = 10; y < h; y += 25) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(w - 30, y);
        ctx.stroke();
      }
      ctx.fillStyle = '#4090ff';
      ctx.beginPath();
      ctx.ellipse(90, 50, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(200, 35, 14, 18);
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(150, 90, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2060cc';
      ctx.fillRect(144, 76, 12, 16);
      ctx.fillStyle = '#ffddaa';
      ctx.beginPath();
      ctx.arc(150, 72, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(150, 105); ctx.lineTo(150, 145);
      ctx.moveTo(142, 105); ctx.lineTo(142, 145);
      ctx.moveTo(158, 105); ctx.lineTo(158, 145);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Tahoma';
      ctx.fillText('CHAIR GP ’98', 220, 85);
      ctx.fillStyle = '#00ff88';
      ctx.font = '10px Tahoma';
      ctx.fillText('СКОРОСТЬ: 35 КМ/Ч', 220, 105);
    }
  }

  createDesktopShortcut(game) {
    if (!window.vfs) return;
    const shortcutName = `${game.title}.lnk`;
    window.vfs.writeFile([], shortcutName, {
      type: 'shortcut',
      name: shortcutName,
      icon: game.icon,
      app: game.appId,
      action: () => game.open()
    });

    if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
    if (window.winManager) {
      window.winManager.openDialog({
        title: 'Ярлык создан',
        icon: game.icon,
        message: `Ярлык для игры «${game.title}» успешно размещен на Рабочем столе!`
      });
    }
  }

  showHelp() {
    if (window.soundSys && window.soundSys.playQuestion) window.soundSys.playQuestion();
    if (window.winManager) {
      window.winManager.openDialog({
        title: 'Справка: Офисные игры ’98',
        icon: 'help',
        width: 420,
        message: '<b>Сборник «Лучшие игры для офиса ’98»</b><br><br>' +
          '&bull; Все игры запускаются напрямую с компакт-диска (D:).<br>' +
          '&bull; В любой игре действует <b>ТРЕВОЖНАЯ КНОПКА (Boss Key)</b> — клавиша <b>F12</b>.<br>' +
          'Нажмите F12, чтобы моментально замаскировать игру при шагах руководства!<br><br>' +
          '&bull; Вы можете разместить ярлык на любую игру прямо на Рабочий стол.'
      });
    }
  }
}

window.appOfficeLauncher = new AppOfficeLauncher();
