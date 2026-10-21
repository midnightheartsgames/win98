class AppEmulator {
  constructor() {
    this.winId = null;
    this.stateStorageKey = 'win98_emuland_states_v1';
    this.currentSys = 'nes';
    this.shelfFilter = 'all';
    this.inspectorTab = 'cheats';
    this.selectedSlot = 1;
    this.crtEnabled = true;
    this.turboEnabled = false;
    this.paused = false;
    this.muted = false;
    this.activeRom = null;
    this.activeCore = null;
    this.rawDumpText = '';
    this.rafId = null;
    this.frameCounter = 0;
    this.fps = 60;
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      c: false,
      x: false,
      y: false,
      z: false,
      start: false,
      select: false
    };
    this.keyDownHandler = null;
    this.keyUpHandler = null;
  }

  getConsoleDefs() {
    return {
      nes: {
        id: 'nes',
        short: 'Dendy / NES',
        emuName: 'NESticle x.xx',
        author: 'Bloodlust Software',
        cpu: 'MOS 6502 (RP2A03) @ 1.79 МГц',
        video: 'PPU 2C02 256x224, 64 спрайта',
        sound: 'APU 2A03 (2 Pulse, Triangle, Noise, DMC)',
        ext: '.NES',
        buttons: ['B', 'A']
      },
      sega: {
        id: 'sega',
        short: 'Sega Mega Drive',
        emuName: 'Genecyst x.xx',
        author: 'Bloodlust Software',
        cpu: 'Motorola 68000 @ 7.67 МГц + Z80',
        video: 'VDP 320x224, 64 цвета из 512',
        sound: 'Yamaha YM2612 FM + Texas SN76489 PSG',
        ext: '.BIN',
        buttons: ['A', 'B', 'C']
      },
      snes: {
        id: 'snes',
        short: 'Super Nintendo',
        emuName: 'ZSNES v0.80',
        author: 'zsKnight & _Demo_',
        cpu: 'WDC 65C816 @ 3.58 МГц',
        video: 'PPU Mode 7, 256 цветов из 32768',
        sound: 'Sony SPC700 8-канальный DSP',
        ext: '.SMC',
        buttons: ['Y', 'B', 'A']
      },
      gb: {
        id: 'gb',
        short: 'Game Boy',
        emuName: 'Virtual GameBoy 98',
        author: 'Marat Fayzullin',
        cpu: 'Sharp LR35902 @ 4.19 МГц',
        video: 'Dot Matrix LCD 160x144 (4 оттенка)',
        sound: 'DMG 4-канальный стерео синтезатор',
        ext: '.GB',
        buttons: ['B', 'A']
      }
    };
  }

  getCatalog() {
    if (window.emuLandSite && typeof window.emuLandSite.getRoms === 'function') {
      return window.emuLandSite.getRoms();
    }
    return [
      { id: 'battlecity', sys: 'nes', title: 'Battle City', ru: 'Танчики', year: 1985, maker: 'Namco', genre: 'Стрелялка', size: '24 КБ', file: 'BATTLE_CITY.NES', mapper: 'Mapper 0 (NROM)', cheat: 'На экране «STAGE 1» до начала уровня кнопки A и B меняют номер уровня. Всего уровней 35.' },
      { id: 'smb', sys: 'nes', title: 'Super Mario Bros.', ru: 'Марио', year: 1985, maker: 'Nintendo', genre: 'Платформер', size: '40 КБ', file: 'SUPER_MARIO_BROS.NES', mapper: 'Mapper 0 (NROM)', cheat: 'После Game Over зажмите A и нажмите Start на заставке: игра продолжится с начала того же мира.' },
      { id: 'contra', sys: 'nes', title: 'Contra', ru: 'Контра', year: 1988, maker: 'Konami', genre: 'Стрелялка', size: '128 КБ', file: 'CONTRA.NES', mapper: 'Mapper 2 (UNROM)', cheat: 'На заставке: Вверх, Вверх, Вниз, Вниз, Влево, Вправо, Влево, Вправо, B, A, Start. На старте будет 30 жизней.' },
      { id: 'chipdale', sys: 'nes', title: "Chip 'n Dale Rescue Rangers", ru: 'Чип и Дейл', year: 1990, maker: 'Capcom', genre: 'Платформер', size: '256 КБ', file: 'CHIP_N_DALE.NES', mapper: 'Mapper 1 (MMC1)', cheat: 'Вдвоём бросайте напарника, как ящик: он долетает до врагов, которых ящиком не достать.' },
      { id: 'sonic2', sys: 'sega', title: 'Sonic the Hedgehog 2', ru: 'Соник 2', year: 1992, maker: 'Sega', genre: 'Платформер', size: '1024 КБ', file: 'SONIC2.BIN', mapper: 'Картридж 8 Мбит', cheat: 'В «Options» в Sound Test сыграйте звуки 19, 65, 09, 17. Затем на заставке зажмите A и нажмите Start: откроется выбор уровня.' },
      { id: 'umk3', sys: 'sega', title: 'Ultimate Mortal Kombat 3', ru: 'Мортал Комбат', year: 1996, maker: 'Midway', genre: 'Драка', size: '4096 КБ', file: 'UMK3.BIN', mapper: 'Картридж 32 Мбит', cheat: 'На заставке: A, C, Вверх, B, Вверх, B, A, Вниз. Откроется меню с секретными настройками.' },
      { id: 'comixzone', sys: 'sega', title: 'Comix Zone', ru: 'Комикс Зон', year: 1995, maker: 'Sega', genre: 'Драка', size: '2048 КБ', file: 'COMIX_ZONE.BIN', mapper: 'Картридж 16 Мбит', cheat: 'В «Jukebox» в настройках включите треки 14, 15, 18, 5, 13, 1, 3, 18, 15, 6. Затем выбирайте номер страницы.' },
      { id: 'smw', sys: 'snes', title: 'Super Mario World', ru: 'Марио 4', year: 1990, maker: 'Nintendo', genre: 'Платформер', size: '512 КБ', file: 'SUPER_MARIO_WORLD.SMC', mapper: 'LoROM', cheat: 'Из уже пройденного уровня можно выйти на карту: поставьте паузу и нажмите Select.' },
      { id: 'tetris', sys: 'gb', title: 'Tetris', ru: 'Тетрис', year: 1989, maker: 'Nintendo', genre: 'Головоломка', size: '32 КБ', file: 'TETRIS.GB', mapper: 'Без маппера', cheat: 'На заставке зажмите Вниз и нажмите Start. Рядом с уровнем появится сердечко, и фигуры будут падать быстрее.' }
    ];
  }

  getDownloadedFilesMap() {
    const map = {};
    if (!window.vfs || !window.vfs.list) return map;
    const dirs = [
      ['My Computer', 'C:', 'My Documents', 'Downloads'],
      ['Desktop'],
      ['My Computer', 'C:', 'Program Files', 'EmuLand98']
    ];
    dirs.forEach(dir => {
      const list = window.vfs.list(dir) || [];
      list.forEach(item => {
        if (item && item.name) {
          map[item.name.toUpperCase()] = { item, dir };
        }
      });
    });
    return map;
  }

  resolveRom(target, content) {
    const catalog = this.getCatalog();
    if (!target) return null;
    const raw = String(target).trim();
    const clean = raw.split(/[\\/]/).pop().toLowerCase();

    const byId = catalog.find(r => r.id === clean);
    if (byId) return byId;

    const byFile = catalog.find(r => r.file.toLowerCase() === clean || r.file.toLowerCase().replace(/\.[a-z0-9]+$/, '') === clean);
    if (byFile) return byFile;

    if (typeof content === 'string') {
      const fileMatch = content.match(/Файл=([^\r\n]+)/i);
      if (fileMatch) {
        const fname = fileMatch[1].trim().toLowerCase();
        const found = catalog.find(r => r.file.toLowerCase() === fname);
        if (found) return found;
      }
      const titleMatch = content.match(/Игра=([^\r\n(]+)/i);
      if (titleMatch) {
        const tname = titleMatch[1].trim().toLowerCase();
        const found = catalog.find(r => r.title.toLowerCase() === tname);
        if (found) return found;
      }
    }

    if (clean.endsWith('.nes')) return catalog.find(r => r.sys === 'nes');
    if (clean.endsWith('.bin') || clean.endsWith('.smd') || clean.endsWith('.gen')) return catalog.find(r => r.sys === 'sega');
    if (clean.endsWith('.smc') || clean.endsWith('.sfc')) return catalog.find(r => r.sys === 'snes');
    if (clean.endsWith('.gb') || clean.endsWith('.gbc')) return catalog.find(r => r.sys === 'gb');
    return null;
  }

  createCoreInstance(romId) {
    const nes = (typeof window !== 'undefined' && window.EmuNesCores) ? window.EmuNesCores : {};
    const bit16 = (typeof window !== 'undefined' && window.Emu16BitCores) ? window.Emu16BitCores : {};
    const CoreClass = nes[romId] || bit16[romId] || nes.battlecity;
    if (!CoreClass) return null;
    return new CoreClass(window.emuAudio || null);
  }

  open(target = null, content = null, folderPath = null) {
    if (this.winId && window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.focusWindow(this.winId);
      if (target) this.handleTarget(target, content, folderPath);
      return;
    }

    const id = 'win_emulator_' + Date.now();
    this.winId = id;

    const win = window.winManager.createWindow({
      id,
      title: 'Emu-Land 98 Multi-System — NESticle / Genecyst / ZSNES / VGB',
      icon: 'emulator',
      width: 900,
      height: 590,
      x: Math.max(16, Math.floor((window.innerWidth - 900) / 2)),
      y: Math.max(12, Math.floor((window.innerHeight - 620) / 2)),
      resizable: true,
      content: this.renderShell(),
      onClose: () => {
        this.stopLoop();
        if (window.emuAudio) window.emuAudio.stopMusic();
        this.unbindKeyboard();
        this.winId = null;
      }
    });

    this.bindEvents(win.element);
    this.bindKeyboard();

    if (target) {
      this.handleTarget(target, content, folderPath);
    } else {
      const dlMap = this.getDownloadedFilesMap();
      const firstDownloaded = this.getCatalog().find(r => dlMap[r.file.toUpperCase()]);
      this.loadCartridge((firstDownloaded || this.getCatalog()[0]).id);
    }

    this.startLoop();
  }

  handleTarget(target, content, folderPath) {
    const s = String(target || '').trim();
    const lower = s.toLowerCase();
    const coreOnlyMap = {
      nes: 'nes',
      'nesticle.exe': 'nes',
      sega: 'sega',
      'genecyst.exe': 'sega',
      snes: 'snes',
      'zsnesw.exe': 'snes',
      gb: 'gb',
      'vgb98.exe': 'gb',
      'emuland98.exe': 'nes'
    };
    const baseName = lower.split(/[\\/]/).pop();
    if (coreOnlyMap[baseName]) {
      this.switchSystem(coreOnlyMap[baseName]);
      return;
    }

    if (baseName.endsWith('.sta')) {
      let rawText = content;
      if (!rawText && window.vfs && window.vfs.getNode) {
        const dir = folderPath || ['My Computer', 'C:', 'My Documents', 'Downloads'];
        const node = window.vfs.getNode([...dir, s.split(/[\\/]/).pop()]);
        if (node && node.content) rawText = node.content;
      }
      this.importStateFromText(rawText);
      return;
    }

    const rom = this.resolveRom(s, content);
    if (rom) {
      this.loadCartridge(rom.id, content);
    }
  }

  switchSystem(sysId) {
    const defs = this.getConsoleDefs();
    if (!defs[sysId]) return;
    this.currentSys = sysId;
    const firstRom = this.getCatalog().find(r => r.sys === sysId);
    if (firstRom && (!this.activeRom || this.activeRom.sys !== sysId)) {
      this.loadCartridge(firstRom.id);
    } else {
      this.refreshUI();
    }
  }

  loadCartridge(romId, customDumpText = null) {
    const rom = this.getCatalog().find(r => r.id === romId) || this.getCatalog()[0];
    if (!rom) return false;
    this.activeRom = rom;
    this.currentSys = rom.sys;
    this.paused = false;

    const dlMap = this.getDownloadedFilesMap();
    const existing = dlMap[rom.file.toUpperCase()];
    if (customDumpText) {
      this.rawDumpText = customDumpText;
    } else if (existing && existing.item && existing.item.content) {
      this.rawDumpText = existing.item.content;
    } else {
      const def = this.getConsoleDefs()[rom.sys];
      this.rawDumpText = `[EMU-LAND ROM DUMP 1998]\nИгра=${rom.title} (${rom.year}, ${rom.maker})\nПлатформа=${def ? def.short : rom.sys}\nФайл=${rom.file}\nРазмер=${rom.size}\nМаппер=${rom.mapper}\nПроверено=GoodDump OK\nЭмулятор=${def ? def.emuName : ''}`;
    }

    this.activeCore = this.createCoreInstance(rom.id);
    if (window.emuAudio && !this.muted) {
      window.emuAudio.startMusic(rom.id);
    }
    this.refreshUI();
    this.showToast(`Картридж ${rom.file} загружен (${this.getConsoleDefs()[rom.sys].emuName})`);
    return true;
  }

  downloadCurrentRomToVfs() {
    if (!this.activeRom) return null;
    let file = null;
    if (window.emuLandSite && typeof window.emuLandSite.downloadRom === 'function') {
      file = window.emuLandSite.downloadRom(this.activeRom.id);
    } else if (window.vfs && window.vfs.writeFile) {
      file = this.activeRom.file;
      window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Downloads'], file, this.rawDumpText);
    }
    this.refreshUI();
    this.showToast(`${file} сохранён в C:\\My Documents\\Downloads`);
    return file;
  }

  triggerActiveCheat() {
    if (!this.activeCore || typeof this.activeCore.activateCheat !== 'function') return null;
    const msg = this.activeCore.activateCheat();
    this.refreshInspector();
    this.showToast(`СЕКРЕТ: ${msg}`);
    return msg;
  }

  getAllStates() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.stateStorageKey);
        if (raw) return JSON.parse(raw) || {};
      }
    } catch (e) {}
    return {};
  }

  saveAllStates(obj) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.stateStorageKey, JSON.stringify(obj));
      }
    } catch (e) {}
  }

  saveState(slot = this.selectedSlot) {
    if (!this.activeRom || !this.activeCore) return false;
    const all = this.getAllStates();
    const key = `${this.activeRom.id}_slot_${slot}`;
    const snap = {
      romId: this.activeRom.id,
      file: this.activeRom.file,
      sys: this.activeRom.sys,
      slot,
      savedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      state: this.activeCore.serializeState()
    };
    all[key] = snap;
    this.saveAllStates(all);
    this.selectedSlot = slot;
    if (window.emuAudio) window.emuAudio.sfx('coin');
    this.refreshInspector();
    this.showToast(`Сохранено в слот #${slot} (${this.activeRom.file})`);
    return snap;
  }

  loadState(slot = this.selectedSlot) {
    if (!this.activeRom || !this.activeCore) return false;
    const all = this.getAllStates();
    const key = `${this.activeRom.id}_slot_${slot}`;
    const snap = all[key];
    if (!snap || !snap.state) {
      this.showToast(`Слот #${slot} пуст`);
      return false;
    }
    this.activeCore.restoreState(snap.state);
    this.selectedSlot = slot;
    if (window.emuAudio) window.emuAudio.sfx('powerup');
    this.refreshInspector();
    this.showToast(`Загружен слот #${slot} (${snap.savedAt})`);
    return true;
  }

  exportStateToVfs(slot = this.selectedSlot) {
    const snap = this.saveState(slot);
    if (!snap || !window.vfs || !window.vfs.writeFile) return null;
    const staName = `${this.activeRom.file.replace(/\.[A-Z0-9]+$/i, '')}_S${slot}.STA`;
    const payload = `[EMU-LAND SAVE STATE 1998]\nROM=${this.activeRom.id}\nFILE=${this.activeRom.file}\nSLOT=${slot}\nJSON=${JSON.stringify(snap)}`;
    window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Downloads'], staName, payload);
    this.showToast(`Файл ${staName} записан в Downloads`);
    return staName;
  }

  importStateFromText(text) {
    if (!text || typeof text !== 'string') return false;
    const match = text.match(/JSON=(\{.+\})/);
    if (!match) return false;
    try {
      const snap = JSON.parse(match[1]);
      if (snap && snap.romId && snap.state) {
        this.loadCartridge(snap.romId);
        this.activeCore.restoreState(snap.state);
        this.refreshInspector();
        this.showToast(`Состояние ${snap.file} восстановлено из .STA`);
        return true;
      }
    } catch (e) {}
    return false;
  }

  openRomFileDialog() {
    if (!window.FileDialog) return;
    window.FileDialog.open({
      mode: 'open',
      title: 'Открыть образ картриджа (ROM / Save State)',
      initialPath: ['My Computer', 'C:', 'My Documents', 'Downloads'],
      filters: [
        { label: 'Все образы картриджей (*.NES;*.BIN;*.SMC;*.GB;*.STA)', ext: ['nes', 'bin', 'smd', 'gen', 'smc', 'sfc', 'gb', 'gbc', 'sta'] },
        { label: 'Картриджи Dendy / NES (*.NES)', ext: ['nes'] },
        { label: 'Картриджи Sega Mega Drive (*.BIN)', ext: ['bin', 'smd', 'gen'] },
        { label: 'Картриджи Super Nintendo (*.SMC)', ext: ['smc', 'sfc'] },
        { label: 'Картриджи Game Boy (*.GB)', ext: ['gb', 'gbc'] }
      ],
      onSelect: (result) => {
        if (!result || !result.name) return;
        this.handleTarget(result.name, result.content, result.path);
      }
    });
  }

  renderShell() {
    return `
      <div class="emul-win-root" data-core="${this.currentSys}">
        <div class="emul-menubar">
          <div class="emul-menu-item" data-menu="file">
            <span>Файл</span>
            <div class="emul-menu-dropdown">
              <div class="emul-menu-opt" data-cmd="open-rom"><span>Открыть ROM (Downloads)...</span><span class="emul-menu-key">Ctrl+O</span></div>
              <div class="emul-menu-opt" data-cmd="save-rom-vfs"><span>Сохранить дамп картриджа в Downloads</span></div>
              <div class="emul-menu-sep"></div>
              <div class="emul-menu-opt" data-cmd="save-state"><span>Быстрое сохранение (Save State)</span><span class="emul-menu-key">F5</span></div>
              <div class="emul-menu-opt" data-cmd="load-state"><span>Быстрая загрузка (Load State)</span><span class="emul-menu-key">F7</span></div>
              <div class="emul-menu-opt" data-cmd="export-sta"><span>Экспорт сохранения (.STA) в Downloads</span></div>
              <div class="emul-menu-sep"></div>
              <div class="emul-menu-opt" data-cmd="open-downloads"><span>Открыть папку C:\\My Documents\\Downloads</span></div>
              <div class="emul-menu-opt" data-cmd="open-site"><span>Открыть сайт http://www.emuland98.ru</span></div>
              <div class="emul-menu-sep"></div>
              <div class="emul-menu-opt" data-cmd="exit"><span>Выход</span></div>
            </div>
          </div>
          <div class="emul-menu-item" data-menu="system">
            <span>Приставка</span>
            <div class="emul-menu-dropdown">
              <div class="emul-menu-opt" data-cmd="core-nes"><span>Dendy / NES (NESticle x.xx)</span></div>
              <div class="emul-menu-opt" data-cmd="core-sega"><span>Sega Mega Drive (Genecyst x.xx)</span></div>
              <div class="emul-menu-opt" data-cmd="core-snes"><span>Super Nintendo (ZSNES v0.80)</span></div>
              <div class="emul-menu-opt" data-cmd="core-gb"><span>Game Boy (Virtual GameBoy 98)</span></div>
              <div class="emul-menu-sep"></div>
              <div class="emul-menu-opt" data-cmd="reset-rom"><span>Сброс приставки (Hard Reset)</span><span class="emul-menu-key">Ctrl+R</span></div>
              <div class="emul-menu-opt" data-cmd="toggle-pause"><span>Пауза эмуляции</span><span class="emul-menu-key">P</span></div>
            </div>
          </div>
          <div class="emul-menu-item" data-menu="options">
            <span>Настройки</span>
            <div class="emul-menu-dropdown">
              <div class="emul-menu-opt is-checked" data-cmd="toggle-crt"><span>Эффект кинескопа ТВ (Scanlines)</span></div>
              <div class="emul-menu-opt" data-cmd="toggle-turbo"><span>Турбо-частота 120 Гц (2x Speed)</span></div>
              <div class="emul-menu-opt" data-cmd="toggle-mute"><span>Отключить звук APU / YM2612</span></div>
              <div class="emul-menu-sep"></div>
              <div class="emul-menu-opt" data-cmd="apply-cheat"><span>Ввести секретный код Emu-Land</span><span class="emul-menu-key">F8</span></div>
            </div>
          </div>
          <div class="emul-menu-item" data-menu="help">
            <span>Справка</span>
            <div class="emul-menu-dropdown">
              <div class="emul-menu-opt" data-cmd="tab-cheats"><span>Таблица кодов и секретов</span></div>
              <div class="emul-menu-opt" data-cmd="tab-debug"><span>Инспектор памяти PPU и дампа</span></div>
              <div class="emul-menu-sep"></div>
              <div class="emul-menu-opt" data-cmd="about"><span>О программе Emu-Land 98...</span></div>
            </div>
          </div>
        </div>

        <div class="emul-toolbar">
          <div class="emul-tool-group">
            <button type="button" class="emul-btn" data-cmd="open-rom">Открыть ROM...</button>
            <button type="button" class="emul-btn" data-cmd="reset-rom">Сброс</button>
            <button type="button" class="emul-btn" data-cmd="toggle-pause" id="emul-pause-btn">Пауза</button>
          </div>
          <div class="emul-tool-sep"></div>
          <div class="emul-tool-group">
            <button type="button" class="emul-btn emul-btn-core" data-core="nes" data-cmd="core-nes">Dendy (NESticle)</button>
            <button type="button" class="emul-btn emul-btn-core" data-core="sega" data-cmd="core-sega">Sega (Genecyst)</button>
            <button type="button" class="emul-btn emul-btn-core" data-core="snes" data-cmd="core-snes">SNES (ZSNES)</button>
            <button type="button" class="emul-btn emul-btn-core" data-core="gb" data-cmd="core-gb">Game Boy (VGB)</button>
          </div>
          <div class="emul-tool-sep"></div>
          <div class="emul-tool-group">
            <button type="button" class="emul-btn" data-cmd="save-state">Сохр. F5</button>
            <button type="button" class="emul-btn" data-cmd="load-state">Загр. F7</button>
            <button type="button" class="emul-btn" data-cmd="apply-cheat">Код F8</button>
            <button type="button" class="emul-btn is-active" data-cmd="toggle-crt" id="emul-crt-btn">ТВ-кинескоп</button>
            <button type="button" class="emul-btn" data-cmd="toggle-mute" id="emul-mute-btn">Звук</button>
          </div>
        </div>

        <div class="emul-workspace">
          <div class="emul-shelf">
            <div class="emul-pane-title">
              <span>Стойка картриджей</span>
              <span id="emul-shelf-count">9 ROM</span>
            </div>
            <div class="emul-filter-row">
              <button type="button" class="emul-filter-btn is-active" data-filter="all">Все</button>
              <button type="button" class="emul-filter-btn" data-filter="nes">NES</button>
              <button type="button" class="emul-filter-btn" data-filter="sega">Sega</button>
              <button type="button" class="emul-filter-btn" data-filter="snes">SNES</button>
              <button type="button" class="emul-filter-btn" data-filter="gb">GB</button>
            </div>
            <div class="emul-rom-list" id="emul-rom-list"></div>
            <div class="emul-shelf-footer">
              <button type="button" class="emul-btn" data-cmd="save-rom-vfs">Скачать дамп в Downloads</button>
              <button type="button" class="emul-btn" data-cmd="open-site">Архив http://www.emuland98.ru</button>
            </div>
          </div>

          <div class="emul-stage">
            <div class="emul-core-header">
              <div class="emul-core-brand">
                <span class="emul-power-led is-on"></span>
                <span id="emul-core-title">NESticle x.xx</span>
              </div>
              <div id="emul-rom-header-meta">BATTLE_CITY.NES [Mapper 0]</div>
            </div>

            <div class="emul-crt-frame is-crt" id="emul-crt-frame">
              <canvas class="emul-canvas" id="emul-canvas" width="256" height="224"></canvas>
              <div class="emul-scanlines"></div>
              <div class="emul-toast" id="emul-toast"></div>
            </div>

            <div class="emul-deck">
              <div class="emul-dpad">
                <div></div>
                <button type="button" class="emul-pad-btn" data-pad="up">▲</button>
                <div></div>
                <button type="button" class="emul-pad-btn" data-pad="left">◄</button>
                <div></div>
                <button type="button" class="emul-pad-btn" data-pad="right">►</button>
                <div></div>
                <button type="button" class="emul-pad-btn" data-pad="down">▼</button>
                <div></div>
              </div>

              <div class="emul-mid-btns">
                <div class="emul-mid-row">
                  <button type="button" class="emul-pad-btn emul-pill-btn" data-pad="select">SELECT (Shift)</button>
                  <button type="button" class="emul-pad-btn emul-pill-btn" data-pad="start">START (Enter)</button>
                </div>
                <div id="emul-controls-hint" style="font-size:9px; color:#b8b8c0; text-align:center;">Стрелки / Z (B), X (A), C, Enter</div>
              </div>

              <div class="emul-face-btns">
                <button type="button" class="emul-action-btn" data-pad="b" title="Кнопка B (Клавиша Z)">B</button>
                <button type="button" class="emul-action-btn" data-pad="a" title="Кнопка A (Клавиша X)">A</button>
                <button type="button" class="emul-action-btn" data-pad="c" title="Кнопка C / Турбо (Клавиша C)">C</button>
              </div>
            </div>
          </div>

          <div class="emul-inspector">
            <div class="emul-tabs">
              <div class="emul-tab is-active" data-tab="cheats">Коды</div>
              <div class="emul-tab" data-tab="states">Слоты (5)</div>
              <div class="emul-tab" data-tab="debug">Дамп/PPU</div>
            </div>
            <div class="emul-tab-body" id="emul-inspector-body"></div>
          </div>
        </div>

        <div class="emul-statusbar">
          <div class="emul-status-cell" id="emul-status-main">Готов к работе</div>
          <div class="emul-status-cell" id="emul-status-cpu">MOS 6502 @ 1.79 МГц</div>
          <div class="emul-status-cell" id="emul-status-file">C:\\My Documents\\Downloads</div>
          <div class="emul-status-cell" id="emul-status-fps">60 FPS / OK</div>
        </div>
      </div>
    `;
  }

  bindEvents(root) {
    root.querySelectorAll('.emul-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = item.classList.contains('is-open');
        root.querySelectorAll('.emul-menu-item.is-open').forEach(m => m.classList.remove('is-open'));
        if (!wasOpen) item.classList.add('is-open');
      });
    });

    root.addEventListener('click', () => {
      root.querySelectorAll('.emul-menu-item.is-open').forEach(m => m.classList.remove('is-open'));
    });

    root.querySelectorAll('[data-cmd]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        root.querySelectorAll('.emul-menu-item.is-open').forEach(m => m.classList.remove('is-open'));
        this.runCommand(el.dataset.cmd);
      });
    });

    root.querySelectorAll('.emul-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.shelfFilter = btn.dataset.filter || 'all';
        root.querySelectorAll('.emul-filter-btn').forEach(b => b.classList.toggle('is-active', b === btn));
        this.renderShelfList();
      });
    });

    root.querySelectorAll('.emul-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.inspectorTab = tab.dataset.tab || 'cheats';
        root.querySelectorAll('.emul-tab').forEach(t => t.classList.toggle('is-active', t === tab));
        this.refreshInspector();
      });
    });

    root.querySelectorAll('[data-pad]').forEach(btn => {
      const padKey = btn.dataset.pad;
      const press = (e) => {
        e.preventDefault();
        this.pressPadButton(padKey, true);
      };
      const release = (e) => {
        e.preventDefault();
        this.pressPadButton(padKey, false);
      };
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
    });
  }

  runCommand(cmd) {
    switch (cmd) {
      case 'open-rom':
        this.openRomFileDialog();
        break;
      case 'save-rom-vfs':
        this.downloadCurrentRomToVfs();
        break;
      case 'save-state':
        this.saveState(this.selectedSlot);
        break;
      case 'load-state':
        this.loadState(this.selectedSlot);
        break;
      case 'export-sta':
        this.exportStateToVfs(this.selectedSlot);
        break;
      case 'open-downloads':
        if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'My Documents', 'Downloads']);
        break;
      case 'open-site':
        if (window.appIE) window.appIE.open('http://www.emuland98.ru');
        break;
      case 'core-nes':
        this.switchSystem('nes');
        break;
      case 'core-sega':
        this.switchSystem('sega');
        break;
      case 'core-snes':
        this.switchSystem('snes');
        break;
      case 'core-gb':
        this.switchSystem('gb');
        break;
      case 'reset-rom':
        if (this.activeCore) {
          this.activeCore.reset();
          this.showToast('Картридж перезапущен (Hard Reset)');
        }
        break;
      case 'toggle-pause':
        this.paused = !this.paused;
        this.refreshUI();
        this.showToast(this.paused ? 'Эмуляция на паузе' : 'Эмуляция продолжена');
        break;
      case 'toggle-crt':
        this.crtEnabled = !this.crtEnabled;
        this.refreshUI();
        break;
      case 'toggle-turbo':
        this.turboEnabled = !this.turboEnabled;
        this.refreshUI();
        this.showToast(this.turboEnabled ? 'Турбо 120 Гц ВКЛ' : 'Штатная частота 60 Гц');
        break;
      case 'toggle-mute':
        this.muted = !this.muted;
        if (window.emuAudio) {
          window.emuAudio.muted = this.muted;
          if (this.muted) window.emuAudio.stopMusic();
          else if (this.activeRom) window.emuAudio.startMusic(this.activeRom.id);
        }
        this.refreshUI();
        break;
      case 'apply-cheat':
        this.triggerActiveCheat();
        break;
      case 'tab-cheats':
        this.inspectorTab = 'cheats';
        this.refreshUI();
        break;
      case 'tab-debug':
        this.inspectorTab = 'debug';
        this.refreshUI();
        break;
      case 'about':
        if (window.winManager) {
          window.winManager.openDialog({
            title: 'О программе Emu-Land 98 Multi-System',
            icon: 'emulator',
            message: '<b>Emu-Land 98 Multi-System v2.4 RU</b><br>Оболочка для Microslop Win 98 SE.<br><br>Включает ядра:<br>• NESticle x.xx (Dendy / NES)<br>• Genecyst x.xx (Sega Mega Drive)<br>• ZSNES v0.80 (Super Nintendo)<br>• Virtual GameBoy 98 (Game Boy)<br><br>Поддерживает все дампы и секретные коды с сайта <code>http://www.emuland98.ru</code>.'
          });
        }
        break;
      case 'exit':
        if (this.winId && window.winManager) window.winManager.closeWindow(this.winId);
        break;
    }
  }

  pressPadButton(padKey, isDown) {
    if (!padKey) return;
    const prev = this.input[padKey];
    this.input[padKey] = isDown;
    const root = this.getRootEl();
    if (root) {
      const btnEl = root.querySelector(`[data-pad="${padKey}"]`);
      if (btnEl) btnEl.classList.toggle('is-pressed', isDown);
    }
    if (isDown && !prev && this.activeCore && typeof this.activeCore.onButtonPress === 'function') {
      this.activeCore.onButtonPress(padKey, this.input);
      this.refreshInspector();
    }
  }

  bindKeyboard() {
    this.unbindKeyboard();
    const mapKey = (e) => {
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();
      if (code === 'ArrowUp' || key === 'w') return 'up';
      if (code === 'ArrowDown' || key === 's') return 'down';
      if (code === 'ArrowLeft' || key === 'a') return 'left';
      if (code === 'ArrowRight' || key === 'd') return 'right';
      if (key === 'x' || key === 'k' || code === 'Space') return 'a';
      if (key === 'z' || key === 'j') return 'b';
      if (key === 'c' || key === 'l') return 'c';
      if (code === 'Enter') return 'start';
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'Tab') return 'select';
      return null;
    };

    this.keyDownHandler = (e) => {
      if (!this.winId || !window.winManager || window.winManager.activeWindowId !== this.winId) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'F5') {
        e.preventDefault();
        this.saveState(this.selectedSlot);
        return;
      }
      if (e.key === 'F7') {
        e.preventDefault();
        this.loadState(this.selectedSlot);
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        this.triggerActiveCheat();
        return;
      }
      if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey) {
        e.preventDefault();
        this.runCommand('toggle-pause');
        return;
      }
      const pad = mapKey(e);
      if (pad) {
        e.preventDefault();
        this.pressPadButton(pad, true);
      }
    };

    this.keyUpHandler = (e) => {
      const pad = mapKey(e);
      if (pad) {
        this.pressPadButton(pad, false);
      }
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
  }

  unbindKeyboard() {
    if (this.keyDownHandler) window.removeEventListener('keydown', this.keyDownHandler);
    if (this.keyUpHandler) window.removeEventListener('keyup', this.keyUpHandler);
    this.keyDownHandler = null;
    this.keyUpHandler = null;
  }

  getRootEl() {
    if (!this.winId || !window.winManager) return null;
    const win = window.winManager.windows.get(this.winId);
    return win ? win.element : null;
  }

  getRomControls(romId) {
    const map = {
      battlecity: 'Стрелки: ход танка | X/Z (A/B): огонь | Shift: 1P/2P',
      smb: 'Стрелки: бег | X (A): прыжок | Z (B): ускорение / файербол',
      contra: 'Стрелки: прицел / Вниз: лечь | X (A): сальто | Z/C: огонь',
      chipdale: 'Стрелки: бег | X (A): прыжок | Z (B): поднять ящик или Дейла',
      sonic2: 'Стрелки: бег | X/Z/C: прыжок | Вниз + X/Z/C: Spin Dash',
      umk3: 'X (A): рукой | Z (B): ногой | Вниз+X: апперкот | C: Гарпун/Fatality',
      comixzone: 'Стрелки: шаг | X/Z (A/B): комбо-удары | C: бумажный самолётик',
      smw: 'Стрелки: бег | X/Z: прыжок / плащ | C: язык Йоши | Enter+Shift: карта',
      tetris: 'Влево/Вправо: сдвиг | X/Z/Вверх: поворот | C: быстрый сброс'
    };
    return map[romId] || 'Стрелки / Z (B), X (A), C, Enter';
  }

  showToast(msg) {
    const root = this.getRootEl();
    if (!root) return;
    const toast = root.querySelector('#emul-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2200);
    if (this.toastTimer && typeof this.toastTimer.unref === 'function') {
      this.toastTimer.unref();
    }
  }

  refreshUI() {
    const root = this.getRootEl();
    if (!root) return;
    const winRoot = root.querySelector('.emul-win-root');
    if (winRoot) winRoot.setAttribute('data-core', this.currentSys);

    const def = this.getConsoleDefs()[this.currentSys] || this.getConsoleDefs().nes;
    const titleEl = root.querySelector('#emul-core-title');
    if (titleEl) titleEl.textContent = `${def.emuName} (${def.short})`;

    const metaEl = root.querySelector('#emul-rom-header-meta');
    if (metaEl && this.activeRom) {
      metaEl.textContent = `${this.activeRom.file} [${this.activeRom.mapper}]`;
    }

    const hintEl = root.querySelector('#emul-controls-hint');
    if (hintEl && this.activeRom) {
      hintEl.textContent = this.getRomControls(this.activeRom.id);
    }

    root.querySelectorAll('.emul-btn-core').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.core === this.currentSys);
    });

    const crtFrame = root.querySelector('#emul-crt-frame');
    if (crtFrame) crtFrame.classList.toggle('is-crt', this.crtEnabled);

    const crtBtn = root.querySelector('#emul-crt-btn');
    if (crtBtn) crtBtn.classList.toggle('is-active', this.crtEnabled);

    const pauseBtn = root.querySelector('#emul-pause-btn');
    if (pauseBtn) pauseBtn.classList.toggle('is-active', this.paused);

    const muteBtn = root.querySelector('#emul-mute-btn');
    if (muteBtn) {
      muteBtn.classList.toggle('is-active', !this.muted);
      muteBtn.textContent = this.muted ? 'Без звука' : 'Звук ВКЛ';
    }

    const stMain = root.querySelector('#emul-status-main');
    if (stMain && this.activeRom) {
      stMain.textContent = `${this.activeRom.title} (${this.activeRom.ru}) — ${def.emuName}`;
    }
    const stCpu = root.querySelector('#emul-status-cpu');
    if (stCpu) stCpu.textContent = def.cpu;

    this.renderShelfList();
    this.refreshInspector();
  }

  renderShelfList() {
    const root = this.getRootEl();
    if (!root) return;
    const listEl = root.querySelector('#emul-rom-list');
    if (!listEl) return;

    const dlMap = this.getDownloadedFilesMap();
    const roms = this.getCatalog().filter(r => this.shelfFilter === 'all' || r.sys === this.shelfFilter);

    const countEl = root.querySelector('#emul-shelf-count');
    if (countEl) countEl.textContent = `${roms.length} ROM`;

    listEl.innerHTML = roms.map(r => {
      const isDl = !!dlMap[r.file.toUpperCase()];
      const isActive = this.activeRom && this.activeRom.id === r.id;
      return `
        <div class="emul-rom-card${isActive ? ' is-active' : ''}" data-rom-id="${r.id}">
          <div class="emul-rom-card-top">
            <span class="emul-rom-title">${r.title}</span>
            <span class="emul-sys-pill emul-sys-${r.sys}">${r.sys.toUpperCase()}</span>
          </div>
          <div class="emul-rom-meta">
            <span>${r.file} (${r.size})</span>
            <span class="emul-dump-badge${isDl ? '' : ' is-web'}">${isDl ? 'В Downloads' : 'Архив'}</span>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.emul-rom-card').forEach(card => {
      card.addEventListener('click', () => {
        this.loadCartridge(card.dataset.romId);
      });
    });
  }

  refreshInspector() {
    const root = this.getRootEl();
    if (!root) return;
    const body = root.querySelector('#emul-inspector-body');
    if (!body || !this.activeRom) return;

    const rom = this.activeRom;
    const def = this.getConsoleDefs()[rom.sys] || this.getConsoleDefs().nes;
    const dlMap = this.getDownloadedFilesMap();
    const isDl = !!dlMap[rom.file.toUpperCase()];

    if (this.inspectorTab === 'cheats') {
      const unlocked = !!(this.activeCore && this.activeCore.cheatUnlocked);
      body.innerHTML = `
        <div style="margin-bottom:6px;">
          <b>${rom.title} (${rom.ru})</b>
          <div style="color:#555555; font-size:10px;">${rom.year}, ${rom.maker} • ${rom.mapper}</div>
        </div>
        <div class="emul-cheat-box">
          <b>Секрет с сайта Emu-Land.ru:</b><br>
          <span>${rom.cheat}</span>
          <div class="emul-cheat-status${unlocked ? ' is-unlocked' : ''}">
            Статус: ${unlocked ? 'СЕКРЕТ АКТИВИРОВАН' : 'Ожидание ввода (или нажмите кнопку ниже)'}
          </div>
        </div>
        <button type="button" class="emul-btn" style="width:100%; margin-bottom:6px; font-weight:bold;" id="emul-btn-cheat-macro">
          Ввести секретный код (F8)
        </button>
        <div style="border-top:1px solid #cccccc; padding-top:5px; margin-bottom:5px; font-size:10px;">
          <b>Управление и приёмы:</b><br>
          <span>${rom.controls || this.getRomControls(rom.id)}</span>
        </div>
        <div style="border-top:1px solid #cccccc; padding-top:5px; font-size:10px;">
          <b>Статус файла картриджа:</b><br>
          Файл: <code>${rom.file}</code><br>
          Папка: <code>${isDl ? 'C:\\My Documents\\Downloads' : 'Образ с http://www.emuland98.ru'}</code><br>
          Проверка: <b style="color:#0f5200;">GoodDump OK</b>
        </div>
      `;
      const macroBtn = body.querySelector('#emul-btn-cheat-macro');
      if (macroBtn) macroBtn.addEventListener('click', () => this.triggerActiveCheat());
      return;
    }

    if (this.inspectorTab === 'states') {
      const all = this.getAllStates();
      const rows = [1, 2, 3, 4, 5].map(slot => {
        const snap = all[`${rom.id}_slot_${slot}`];
        const sel = this.selectedSlot === slot;
        return `
          <div class="emul-slot-row${sel ? ' is-selected' : ''}" data-slot="${slot}">
            <div class="emul-slot-info">
              <div class="emul-slot-title">Слот #${slot} ${snap ? `(${snap.savedAt})` : '— Пусто'}</div>
              <div class="emul-slot-sub">${snap ? `${snap.file} • Очки: ${snap.state.score || 0}` : 'Нажмите F5 для записи'}</div>
            </div>
            <button type="button" class="emul-btn" data-save-slot="${slot}">Сохр</button>
            <button type="button" class="emul-btn" data-load-slot="${slot}">Загр</button>
          </div>
        `;
      }).join('');
      body.innerHTML = `
        <div style="margin-bottom:5px; font-weight:bold;">Быстрые сохранения (${rom.file})</div>
        ${rows}
        <button type="button" class="emul-btn" style="width:100%; margin-top:6px;" id="emul-export-sta-btn">
          Экспортировать слот #${this.selectedSlot} (.STA)
        </button>
      `;
      body.querySelectorAll('[data-slot]').forEach(r => {
        r.addEventListener('click', () => {
          this.selectedSlot = Number(r.dataset.slot);
          this.refreshInspector();
        });
      });
      body.querySelectorAll('[data-save-slot]').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          this.saveState(Number(b.dataset.saveSlot));
        });
      });
      body.querySelectorAll('[data-load-slot]').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          this.loadState(Number(b.dataset.loadSlot));
        });
      });
      const expBtn = body.querySelector('#emul-export-sta-btn');
      if (expBtn) expBtn.addEventListener('click', () => this.exportStateToVfs(this.selectedSlot));
      return;
    }

    const pcHex = ((0x8000 + this.frameCounter * 7) & 0xffff).toString(16).toUpperCase().padStart(4, '0');
    const pals = ['#000000', '#fcfcfc', '#d82800', '#0058f8', '#00a800', '#fce000', '#fca044', '#5c94fc', '#38a838', '#c84c0c', '#7c7c7c', '#bcbcbc', '#8bac0f', '#0f380f', '#5040a0', '#a85000'];
    body.innerHTML = `
      <div style="margin-bottom:4px; font-weight:bold;">Регистры ${def.emuName}</div>
      <div class="emul-reg-grid">
        <div>PC: $${pcHex}</div>
        <div>FPS: ${this.fps}</div>
        <div>SCORE: ${this.activeCore ? (this.activeCore.score || 0) : 0}</div>
        <div>MODE: ${this.activeCore ? (this.activeCore.mode || 'play').toUpperCase() : 'IDLE'}</div>
      </div>
      <div style="margin-bottom:3px; font-weight:bold;">Палитра видеопамяти PPU</div>
      <div class="emul-pal-grid">
        ${pals.map(c => `<div class="emul-pal-cell" style="background:${c};"></div>`).join('')}
      </div>
      <div style="margin-bottom:3px; font-weight:bold;">Заголовок дампа картриджа</div>
      <pre class="emul-dump-pre">${this.rawDumpText}</pre>
    `;
  }

  stepFrame() {
    if (!this.activeCore) return;
    if (!this.paused) {
      const steps = this.turboEnabled ? 2 : 1;
      for (let i = 0; i < steps; i++) {
        this.activeCore.step(this.input);
      }
      this.frameCounter++;
    }
    const root = this.getRootEl();
    if (root) {
      const cv = root.querySelector('#emul-canvas');
      if (cv && cv.getContext) {
        const ctx = cv.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          this.activeCore.render(ctx);
        }
      }
    }
  }

  startLoop() {
    this.stopLoop();
    const tick = () => {
      if (!this.winId) return;
      this.stepFrame();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

if (typeof window !== 'undefined') {
  window.appEmulator = new AppEmulator();
}
