window.Og2 = (() => {
  const SCORE_PREFIX = 'office_games2_best_';
  const memoryScores = {};
  const scoreListeners = new Set();
  const bossScreens = new Map();

  const games = [
    {
      id: 'cable3d',
      appId: 'og2_cable3d',
      title: 'Патч-корд 3D',
      genre: 'Змейка в 3D',
      exe: 'D:\\GAMES\\CABLE3D\\CABLE3D.EXE',
      blurb: 'Вы ведёте сетевой кабель по офису из первого лица за плечом. Собирайте письма, чтобы кабель рос, и не врезайтесь в перегородки и в самого себя.',
      controls: 'Влево / Вправо или A / D — поворот; Пробел — пауза; F12 — начальник идёт.'
    },
    {
      id: 'archive',
      appId: 'og2_archive',
      title: 'Разгром архива',
      genre: 'Арканоид',
      exe: 'D:\\GAMES\\ARCHIVE\\ARCHIVE.EXE',
      blurb: 'Мячик из скомканной бумаги против стеллажей с папками. Выбейте весь архив и поймайте бонусы, пока они не упали за край.',
      controls: 'Мышь или Влево / Вправо — платформа; Пробел — запуск мяча; F12 — начальник идёт.'
    },
    {
      id: 'lift',
      appId: 'og2_lift',
      title: 'Последний лифт',
      genre: 'Платформер',
      exe: 'D:\\GAMES\\LIFT\\LIFT.EXE',
      blurb: 'Рабочий день кончился, а лифт уже подъезжает. Прыгайте через коробки и лужи, добегите до дверей раньше, чем они закроются.',
      controls: 'Влево / Вправо — бег; Пробел или Вверх — прыжок; F12 — начальник идёт.'
    },
    {
      id: 'range',
      appId: 'og2_range',
      title: 'Тир Open-space',
      genre: 'Тир',
      exe: 'D:\\GAMES\\RANGE\\RANGE.EXE',
      blurb: 'Бумажные самолётики, голуби и часы летят через опен-спейс. Стреляйте по движущимся целям, пока не кончится время.',
      controls: 'Мышь — прицел и выстрел; Пробел или правая кнопка — перезарядка; F12 — начальник идёт.'
    },
    {
      id: 'mix',
      appId: 'og2_mix',
      title: 'Канцелярский микс',
      genre: 'Три в ряд',
      exe: 'D:\\GAMES\\MIX\\MIX.EXE',
      blurb: 'Меняйте местами соседние предметы со стола и собирайте ряды из трёх и более. Цепочки приносят больше очков.',
      controls: 'Мышь — выбрать и поменять соседние фишки; F12 — начальник идёт.'
    },
    {
      id: 'five',
      appId: 'og2_five',
      title: 'Пять в линию',
      genre: 'Логическая головоломка с шариками',
      exe: 'D:\\GAMES\\FIVE\\FIVE.EXE',
      blurb: 'Двигайте цветные шарики по клетчатому полю и стройте линии из пяти. Каждый ход поле заполняется новыми шарами.',
      controls: 'Мышь — выбрать шарик и клетку назначения; F12 — начальник идёт.'
    },
    {
      id: 'stack',
      appId: 'og2_stack',
      title: 'Стопка',
      genre: 'Тетрис',
      exe: 'D:\\GAMES\\STACK\\STACK.EXE',
      blurb: 'Падающие фигуры из папок нужно уложить без щелей. Заполненные ряды исчезают, а скорость растёт.',
      controls: 'Влево / Вправо — сдвиг; Вверх — поворот; Вниз — ускорить; Пробел — сбросить; F12 — начальник идёт.'
    },
    {
      id: 'rally',
      appId: 'og2_rally',
      title: 'Ралли на колёсиках',
      genre: 'Гонки на офисных креслах',
      exe: 'D:\\GAMES\\RALLY\\RALLY.EXE',
      blurb: 'Заезд по длинному коридору на кресле с колёсиками. Объезжайте тележки и лужи и подбирайте кофе для ускорения.',
      controls: 'Влево / Вправо — руль; Вверх — разгон; Вниз — тормоз; F12 — начальник идёт.'
    }
  ];

  function find(id) {
    return games.find(g => g.id === id) || null;
  }

  function isOg2App(app) {
    return typeof app === 'string' && app.indexOf('og2_') === 0;
  }

  function openApp(app) {
    if (app === 'og2_launcher') {
      if (window.appOg2Launcher) window.appOg2Launcher.open();
      return;
    }
    const game = games.find(g => g.appId === app);
    if (!game) return;
    if (game.open) {
      game.open();
      return;
    }
    window.winManager.openDialog({
      title: game.title,
      icon: 'info',
      message: 'Эта игра ещё не установлена с диска. Она появится в одном из следующих выпусков сборника.'
    });
  }

  function attach(id, implementation) {
    const game = find(id);
    if (!game) throw new Error('Unknown Og2 game: ' + id);
    game.open = implementation.open;
    game.drawIcon = implementation.drawIcon;
  }

  function bestScore(id) {
    try {
      const raw = localStorage.getItem(SCORE_PREFIX + id);
      if (raw !== null) return Math.max(0, parseInt(raw, 10) || 0);
    } catch (e) {}
    return memoryScores[id] || 0;
  }

  function submitScore(id, score) {
    const value = Math.max(0, Math.floor(score));
    if (value <= bestScore(id)) return false;
    memoryScores[id] = value;
    try {
      localStorage.setItem(SCORE_PREFIX + id, String(value));
    } catch (e) {}
    scoreListeners.forEach(listener => listener(id, value));
    return true;
  }

  function subscribeScores(listener) {
    scoreListeners.add(listener);
    return () => scoreListeners.delete(listener);
  }

  function beep(freq, duration = 0.06, type = 'square', volume = 0.05) {
    const sound = window.soundSys;
    if (!sound || typeof sound.playSpeakerBeep !== 'function') return;
    try {
      sound.playSpeakerBeep(freq, duration, type, volume);
    } catch (e) {}
  }

  function createWindow(options) {
    const win = window.winManager.createWindow({
      id: options.id,
      title: options.title,
      icon: 'game-manager',
      width: options.width,
      height: options.height,
      resizable: false,
      maximizable: false,
      content: options.content || '',
      onClose: options.onClose
    });
    win.body.classList.add('og2-body');
    return win;
  }

  const SHEET_ROWS = [
    ['Статья расходов', 'Янв', 'Фев', 'Мар', 'Итого'],
    ['Канцтовары', '4 210', '3 980', '4 560', '12 750'],
    ['Картриджи', '8 900', '9 150', '8 400', '26 450'],
    ['Связь', '15 300', '15 300', '15 750', '46 350'],
    ['Командировки', '22 000', '0', '31 500', '53 500'],
    ['Обслуживание ПК', '6 400', '7 900', '5 200', '19 500'],
    ['Прочее', '1 120', '860', '1 430', '3 410'],
    ['Всего', '57 930', '37 190', '66 840', '161 960']
  ];

  function bossMarkup() {
    const letters = ['', 'A', 'B', 'C', 'D', 'E'];
    const head = '<tr>' + letters.map(l => `<th>${l}</th>`).join('') + '</tr>';
    const rows = SHEET_ROWS.map((row, i) => {
      const cells = row.map((cell, c) => `<td class="${c > 0 && i > 0 ? 'og2-num' : ''}">${cell}</td>`).join('');
      return `<tr><th>${i + 1}</th>${cells}</tr>`;
    }).join('');
    return `
      <div class="og2-boss-title">Бюджет_Q1_финал.xls</div>
      <div class="og2-boss-formula">fx&nbsp;&nbsp;=СУММ(B2:D2)</div>
      <table class="og2-boss-table">${head}${rows}</table>
    `;
  }

  function isBossShown(winId) {
    return bossScreens.has(winId);
  }

  function listenKeys(winId, handlers) {
    const isActive = () => window.winManager && window.winManager.activeWindowId === winId;
    const onDown = (e) => {
      if (!isActive()) return;
      if (e.key === 'F12') {
        e.preventDefault();
        switchBoss(winId, handlers.boss);
        return;
      }
      if (isBossShown(winId)) return;
      if (handlers.down) handlers.down(e);
    };
    const onUp = (e) => {
      if (!isActive() || isBossShown(winId)) return;
      if (handlers.up) handlers.up(e);
    };
    document.addEventListener('keydown', onDown);
    document.addEventListener('keyup', onUp);
    return () => {
      document.removeEventListener('keydown', onDown);
      document.removeEventListener('keyup', onUp);
      const screen = bossScreens.get(winId);
      if (screen) {
        screen.element.remove();
        bossScreens.delete(winId);
      }
    };
  }

  function switchBoss(winId, onChange) {
    const shown = bossScreens.get(winId);
    if (shown) {
      shown.element.remove();
      bossScreens.delete(winId);
      if (onChange) onChange(false);
      return;
    }
    const win = window.winManager.windows.get(winId);
    if (!win) return;
    const element = document.createElement('div');
    element.className = 'og2-boss';
    element.innerHTML = bossMarkup();
    win.body.appendChild(element);
    bossScreens.set(winId, { element });
    if (onChange) onChange(true);
  }

  return {
    games,
    find,
    isOg2App,
    openApp,
    attach,
    bestScore,
    submitScore,
    subscribeScores,
    beep,
    createWindow,
    listenKeys,
    isBossShown
  };
})();
