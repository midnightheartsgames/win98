class AppHyperTerminal {
  constructor() {
    this.winId = 'win-hypertrm';
    this.activeStationId = 'nightowl';
    this.connected = false;
    this.connecting = false;
    this.connectStartTime = 0;
    this.clockTimer = null;
    this.zmodemTimer = null;
    this.screenState = 'menu';
    this.selectedIcon = '🌐';

    this.traderGame = {
      cash: 450,
      day: 1,
      location: 'Савёловский радиорынок',
      inv: { celeron: 1, voodoo2: 0, sb64: 0 },
      prices: { celeron: 115, voodoo2: 210, sb64: 65 }
    };

    this.oneLiners = [
      '14.10.98 [2:5020/98] NightOwl: Поставил USRobotics Courier V.Everything — коннект 33600 железно!',
      '14.10.98 [2:5020/412] Shadow_98: Кто прошел Half-Life? Как убить тентакля в ракетной шахте?!',
      '15.10.98 [2:5030/404] DJ_Vortex: Качайте DEMO98.BAS и запускайте в Microslop QBasic 1.1!',
      '15.10.98 [2:5020/777] OverClocker: Celeron 300A взял 450 МГц при 2.0V на шине 100 МГц!'
    ];

    this.stations = {
      nightowl: {
        id: 'nightowl',
        name: 'Night Owl BBS (Москва • 2:5020/98)',
        phone: '095-932-4812',
        baud: '33600 V.34',
        sysop: 'Dmitry "NightOwl" Sokolov',
        modem: 'USRobotics Courier V.Everything',
        bannerColor: '#00ffff',
        titleAscii: [
          '╔══════════════════════════════════════════════════════════════════════╗',
          '║   _   _ ___ ____ _   _ _____    ____  _      _      ____  ____ ____  ║',
          '║  | \\ | |_ _/ ___| | | |_   _|  / _ \\ \\ \\ /\\ / / |  | __ )| __ ) ___| ║',
          '║  |  \\| || | |  _| |_| | | |   | | | | \\ V  V /| |  |  _ \\|  _ \\___ \\ ║',
          '║  |_|\\__|___\\____|_| |_| |_|    \\___/   \\_/\\_/ |____|____/|____/____/ ║',
          '║        МОСКВА • FIDONET 2:5020/98 • TORNADO/RA 2.50 • 22:00-08:00    ║',
          '╚══════════════════════════════════════════════════════════════════════╝'
        ].join('\n'),
        echoes: [
          {
            area: 'RU.GAME (Игры 1998)',
            from: 'Alex_Quake2 (2:5020/144.12)',
            subj: 'Quake II + 3dfx Voodoo2 = ФАНТАСТИКА!',
            body: 'Вчера купил Diamond Monster 3D II 12MB на Савёловском! В 800x600 цветное освещение OpenGL/Glide выдает 65 FPS. Советую также глянуть саундтрек Sonic Mayhem прямо на сентябрьском диске Игромании!'
          },
          {
            area: 'RU.ANECDOT (Юмор Фидо)',
            from: 'SysOp_Joke (2:5020/98.1)',
            subj: 'Программист и Win 98 SE',
            body: 'Звонок в техподдержку Microslop:\n— У меня модем не дозванивается до BBS!\n— А у вас какой пароль в BIOS стоит?\n— Год рождения тещи, но даже вирус Чернобыль боится его трогать!'
          },
          {
            area: 'SU.HARDW.PC (Железо и разгон)',
            from: 'Hardware_Guru (2:5030/88.5)',
            subj: 'Разгон по шине FSB в Award BIOS 4.51PG',
            body: 'Мужики! Заходите в Award BIOS при перезагрузке (DEL) -> Chipset Features -> ставьте шину 112 МГц или 133 МГц и тайминг SDRAM CAS Latency = 2. В бенчмарке Wintune 97 прирост сразу +25%!'
          }
        ],
        files: [
          {
            filename: 'VOODOO2.BAS',
            size: '2 480 байт',
            desc: 'Демо-бенчмарк 3dfx плазмы для Microslop QBasic 1.1 (SCREEN 13)',
            content: [
              '10 CLS',
              '20 SCREEN 13',
              '30 FOR R = 10 TO 85 STEP 5',
              '40   CIRCLE (160, 100), R, (R / 5) MOD 15 + 1',
              '50 NEXT R',
              '60 LINE (20, 20)-(300, 180), 14, B',
              '70 SOUND 523, 3',
              '80 SOUND 659, 3',
              '90 SOUND 784, 5',
              '100 END'
            ].join('\n')
          },
          {
            filename: 'FIDO_BEST98.TXT',
            size: '4 120 байт',
            desc: 'Золотой архив эхоконференций RU.ANECDOT и RU.GAME за октябрь 1998',
            content: [
              '=== ЗОЛОТОЙ АРХИВ FIDONET (УЗЕЛ 2:5020/98 NIGHT OWL BBS) ===',
              'Дата выгрузки: 15 Октября 1998 г. (Протокол ZMODEM CRC-32)',
              '',
              '[1] Как узнать настоящего фидошника в 1998 году:',
              '    В 23:00 домашний телефон всегда занят, потому что идет ZMH (Зональный Почтовый Час)!',
              '',
              '[2] Секрет диска Игромания №9:',
              '    На диске D: есть скрытые аудиодорожки RedBook CD-DA. Откройте CDex 0.14 или Лазерный проигрыватель!'
            ].join('\n')
          }
        ]
      },
      demosgate: {
        id: 'demosgate',
        name: 'Demos Gate BBS (СПб • 2:5030/404)',
        phone: '812-315-9800',
        baud: '50666 V.90',
        sysop: 'DJ_Vortex / Demoscene HQ',
        modem: 'ZyXEL Omni 56K Plus',
        bannerColor: '#ff66ff',
        titleAscii: [
          '╔══════════════════════════════════════════════════════════════════════╗',
          '║   ____  _____ __  __  ___  ____     ____    _  _____ _____           ║',
          '║  |  _ \\| ____|  \\/  |/ _ \\/ ___|   / ___|  / \\|_   _| ____|          ║',
          '║  | | | |  _| | |\\/| | | | \\___ \\  | |  _  / _ \\ | | |  _|            ║',
          '║  | |_| | |___| |  | | |_| |___) | | |_| |/ ___ \\| | | |___           ║',
          '║  |____/|_____|_|  |_|\\___/|____/   \\____/_/   \\_\\_| |_____|          ║',
          '║     САНКТ-ПЕТЕРБУРГ • ENLIGHT & ASSEMBLY DEMOSCENE HQ • 2:5030/404   ║',
          '╚══════════════════════════════════════════════════════════════════════╝'
        ].join('\n'),
        echoes: [
          {
            area: 'RU.DEMO.SCENE (Демосцена 98)',
            from: 'Coder_3D (2:5030/404.2)',
            subj: 'Итоги Assembly 98 и ENLiGHT!',
            body: 'Сценеры! В разделе [2] Файловый архив выложена свежая графическая интро DEMO98.BAS на 64К-стиль для QBasic 1.1. Качайте по ZMODEM и запускайте по F5!'
          }
        ],
        files: [
          {
            filename: 'DEMO98.BAS',
            size: '3 190 байт',
            desc: 'Интро Санкт-Петербургской демосцены ENLiGHT 98 для QBasic 1.1',
            content: [
              '10 CLS',
              '20 SCREEN 13',
              '30 FOR X = 0 TO 319 STEP 8',
              '40   LINE (160, 0)-(X, 199), (X / 8) MOD 14 + 1',
              '50   LINE (160, 199)-(X, 0), ((X / 8) + 5) MOD 14 + 1',
              '60 NEXT X',
              '70 CIRCLE (160, 100), 48, 15',
              '80 PLAY "O4L8CEG>C<GE"',
              '90 END'
            ].join('\n')
          }
        ]
      },
      redline: {
        id: 'redline',
        name: 'Red Line Overclockers BBS (Москва • 2:5020/777)',
        phone: '095-241-3360',
        baud: '33600 V.34',
        sysop: 'OverClocker_300A',
        modem: 'IDC 2814BXL/VR+',
        bannerColor: '#ff5555',
        titleAscii: [
          '╔══════════════════════════════════════════════════════════════════════╗',
          '║   ____  _____ ____    _     ___ _   _ _____   ____  ____ ____        ║',
          '║  |  _ \\| ____|  _ \\  | |   |_ _| \\ | | ____| | __ )| __ ) ___|       ║',
          '║  | |_) |  _| | | | | | |    | ||  \\| |  _|   |  _ \\|  _ \\___ \\       ║',
          '║  |  _ <| |___| |_| | | |___ | || |\\  | |___  | |_) | |_) |__) |      ║',
          '║  |_| \\_\\_____|____/  |_____|___|_| \\_|_____| |____/|____/____/       ║',
          '║     КЛУБ ОВЕРКЛОКЕРОВ • CELERON 300A @ 450 МГц • DOOR-ИГРЫ ОНЛАЙН    ║',
          '╚══════════════════════════════════════════════════════════════════════╝'
        ].join('\n'),
        echoes: [
          {
            area: 'RU.OVERCLOCK (Разгон ПК)',
            from: 'OverClocker_300A (2:5020/777)',
            subj: 'Заклейка контакта B21 на Slot 1 Celeron 300A',
            body: 'Если заклеить контакт B21 лаком для ногтей, материнская плата Intel 440BX сразу поднимает шину с 66 до 100 МГц! Итог — бесплатный Pentium II 450 МГц!'
          }
        ],
        files: [
          {
            filename: 'BIOS_MOD.TXT',
            size: '1 950 байт',
            desc: 'Шпаргалка по экстремальному разгону Award BIOS v4.51PG',
            content: [
              '=== СЕКРЕТЫ AWARD MODULAR BIOS v4.51PG (RED LINE BBS) ===',
              '1. CPU Host Clock (FSB): 112 MHz или 133 MHz',
              '2. SDRAM CAS Latency Time: 2T (максимальная пропускная способность)',
              '3. AGP 2X Mode: Enabled (ускоряет 3D полигоны в Wintune 97)',
              '4. Проверьте очки в Wintune 97 и температуру в Системном мониторе!'
            ].join('\n')
          }
        ]
      },
      msnet: {
        id: 'msnet',
        name: 'Microslop Win 98 SE TechNet BBS (095-745-9898)',
        phone: '095-745-9898',
        baud: '56000 V.90',
        sysop: 'Microslop Support Bot',
        modem: 'Microslop RAS X2/V.90 Server',
        bannerColor: '#55ff55',
        titleAscii: [
          '╔══════════════════════════════════════════════════════════════════════╗',
          '║   __  __ ___ ____ ____   ___  ____  _     ___  ____   ____  ____ ____║',
          '║  |  \\/  |_ _/ ___|  _ \\ / _ \\/ ___|| |   / _ \\|  _ \\ | __ )| __ ) ___║',
          '║  | |\\/| || | |   | |_) | | | \\___ \\| |  | | | | |_) ||  _ \\|  _ \\___ ║',
          '║  | |  | || | |___|  _ <| |_| |___) | |__| |_| |  __/ | |_) | |_) |__)║',
          '║  |_|  |_|___\\____|_| \\_\\\\___/|____/|_____\\___/|_|    |____/|____/____║',
          '║       ОФИЦИАЛЬНАЯ ТЕХПОДДЕРЖКА MICROSLOP WIN 98 SECOND EDITION       ║',
          '╚══════════════════════════════════════════════════════════════════════╝'
        ].join('\n'),
        echoes: [
          {
            area: 'MICROSLOP.WIN98.TIPS',
            from: 'Support_Lead (Microslop Corp.)',
            subj: 'Скрытые команды диалога Выполнить (Win+R)',
            body: 'Попробуйте ввести в диалоге Пуск -> Выполнить: qbasic, mon_test, cdex, wintune, clibench, cdplayer, sysmon, hypertrm, clipbrd, regedit, msconfig, dxdiag!'
          }
        ],
        files: [
          {
            filename: 'WIN98SE_TIPS.TXT',
            size: '2 140 байт',
            desc: 'Полный справочник секретных команд и утилит Microslop Win 98 SE',
            content: [
              '=== СПРАВОЧНИК ИНЖЕНЕРА MICROSLOP WIN 98 SE ===',
              '- QBASIC.EXE   : Среда разработки BASIC (SCREEN 13, SOUND, PLAY)',
              '- MON_TEST.EXE : Тестер ЭЛТ-монитора Nokia с размагничиванием (Degauss)',
              '- CDEX014.EXE  : Граббер CD-Audio дорожек с диска D: в формат WAV/MP3',
              '- WINTUNE.EXE  : Бенчмарк железа, реагирующий на разгон в BIOS',
              '- SYSMON.EXE   : Системный монитор реального времени',
              '- CLIPBRD.EXE  : Просмотр буфера обмена (Текст, Картинки Paint, Файлы)'
            ].join('\n')
          }
        ]
      }
    };
  }

  open(stationOrFile = null) {
    if (stationOrFile) {
      const key = String(stationOrFile).toLowerCase();
      if (key.includes('demos') || key.includes('404')) this.activeStationId = 'demosgate';
      else if (key.includes('red') || key.includes('777')) this.activeStationId = 'redline';
      else if (key.includes('microslop') || key.includes('msnet')) this.activeStationId = 'msnet';
      else if (this.stations[key]) this.activeStationId = key;
    }

    if (window.winManager && window.winManager.windows.has(this.winId)) {
      const existing = window.winManager.windows.get(this.winId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.winId);
      else window.winManager.bringToTop(this.winId);
      this.renderStationState();
      return existing;
    }

    const content = `
      <div class="ht-shell" id="${this.winId}-shell">
        <div class="ht-menubar">
          <div class="ht-menu-item" data-menu="file">
            <span><u>Ф</u>айл</span>
            <div class="ht-dropdown">
              <div class="ht-menu-opt" data-cmd="new-conn"><span>Новое подключение...</span></div>
              <div class="ht-menu-opt" data-cmd="save-ht"><span>Сохранить ярлык сеанса (.ht)</span></div>
              <div class="ht-menu-sep"></div>
              <div class="ht-menu-opt" data-cmd="exit"><span>Выход</span></div>
            </div>
          </div>
          <div class="ht-menu-item" data-menu="edit">
            <span><u>П</u>равка</span>
            <div class="ht-dropdown">
              <div class="ht-menu-opt" data-cmd="copy-screen"><span>Копировать экран в буфер обмена</span></div>
            </div>
          </div>
          <div class="ht-menu-item" data-menu="call">
            <span><u>В</u>ызов</span>
            <div class="ht-dropdown">
              <div class="ht-menu-opt" data-cmd="dial"><span>Набрать номер (Dial)...</span></div>
              <div class="ht-menu-opt" data-cmd="hangup"><span>Отключить (Disconnect)</span></div>
            </div>
          </div>
          <div class="ht-menu-item" data-menu="transfer">
            <span><u>П</u>ередача</span>
            <div class="ht-dropdown">
              <div class="ht-menu-opt" data-cmd="zmodem-dl"><span>Принять файл с BBS (ZMODEM)...</span></div>
            </div>
          </div>
          <div class="ht-menu-item" data-menu="help">
            <span><u>С</u>правка</span>
            <div class="ht-dropdown">
              <div class="ht-menu-opt" data-cmd="about"><span>О программе «HyperTerminal»</span></div>
            </div>
          </div>
        </div>

        <div class="ht-toolbar">
          <span>Станция BBS:</span>
          <select class="ht-bbs-select" id="${this.winId}-station-select">
            ${Object.values(this.stations).map((st) => (
              `<option value="${st.id}" ${st.id === this.activeStationId ? 'selected' : ''}>${st.name} [${st.phone}]</option>`
            )).join('')}
          </select>
          <div class="ht-tb-sep"></div>
          <button class="ht-tb-btn" data-cmd="dial" id="${this.winId}-btn-dial">&#128222; Вызов</button>
          <button class="ht-tb-btn" data-cmd="hangup" id="${this.winId}-btn-hangup">&#9742; Отбой</button>
          <div class="ht-tb-sep"></div>
          <button class="ht-tb-btn" data-cmd="zmodem-dl">&#128190; ZMODEM</button>
          <button class="ht-tb-btn" data-cmd="new-conn">&#9881; Новая</button>
        </div>

        <div class="ht-terminal-wrap">
          <div class="ht-ansi-screen" id="${this.winId}-ansi"></div>
          <div class="ht-cmd-bar">
            <div class="ht-quick-keys" id="${this.winId}-qkeys"></div>
            <div class="ht-input-box">
              <span style="color:#00ff66;font-family:monospace;">CMD&gt;</span>
              <input type="text" class="ht-cmd-input" id="${this.winId}-input" placeholder="Команда (1..5, M, G)">
              <button class="win-btn" id="${this.winId}-send-btn" style="min-width:44px;height:20px;padding:0 6px;">Ввод</button>
            </div>
          </div>
        </div>

        <div class="ht-statusbar">
          <div class="ht-status-cell" id="${this.winId}-st-conn">Отключено</div>
          <div class="ht-status-cell">Эмуляция: ANSI</div>
          <div class="ht-status-cell" id="${this.winId}-st-baud">57600 8-N-1</div>
          <div class="ht-status-cell" id="${this.winId}-st-modem">USRobotics 56K V.90 (COM2)</div>
          <div class="ht-status-cell">ZMODEM CRC-32</div>
        </div>

        <div class="ht-modal-backdrop" id="${this.winId}-zmodem-modal">
          <div class="ht-modal">
            <div class="ht-modal-titlebar">
              <span>Прием файла по протоколу ZMODEM</span>
              <button class="win-btn" id="${this.winId}-zm-close" style="min-width:16px;height:14px;padding:0;line-height:10px;">×</button>
            </div>
            <div class="ht-modal-body">
              <div class="ht-zmodem-grid">
                <span>Имя файла:</span><strong id="${this.winId}-zm-file">VOODOO2.BAS</strong>
                <span>Протокол:</span><span>ZMODEM с восстановлением (CRC-32)</span>
                <span>Принято блоков:</span><span id="${this.winId}-zm-blocks">0 / 16 (по 256 байт)</span>
                <span>Скорость:</span><span id="${this.winId}-zm-cps">3 680 CPS (Ошибок: 0)</span>
                <span>Папка назначения:</span><span>C:\\My Documents\\Downloads</span>
              </div>
              <div class="ht-zmodem-bar-outer" id="${this.winId}-zm-bar"></div>
              <div class="ht-modal-footer">
                <button class="win-btn" id="${this.winId}-zm-cancel">Отмена</button>
              </div>
            </div>
          </div>
        </div>

        <div class="ht-modal-backdrop" id="${this.winId}-new-modal">
          <div class="ht-modal">
            <div class="ht-modal-titlebar">
              <span>Описание нового подключения</span>
              <button class="win-btn" id="${this.winId}-nw-close" style="min-width:16px;height:14px;padding:0;line-height:10px;">×</button>
            </div>
            <div class="ht-modal-body">
              <div>Введите имя и выберите значок для нового BBS-подключения:</div>
              <input type="text" id="${this.winId}-nw-name" value="NightOwl_Fido98" style="height:20px;padding:1px 4px;">
              <div>Номер телефона узла:</div>
              <input type="text" id="${this.winId}-nw-phone" value="095-932-4812" style="height:20px;padding:1px 4px;">
              <div>Значок сеанса:</div>
              <div class="ht-icon-picker" id="${this.winId}-nw-icons">
                ${['🌐', '☎️', '🦉', '🚀', '💾', '⚡'].map((ic) => (
                  `<div class="ht-icon-choice ${ic === this.selectedIcon ? 'selected' : ''}" data-ic="${ic}">${ic}</div>`
                )).join('')}
              </div>
              <div class="ht-modal-footer">
                <button class="win-btn default" id="${this.winId}-nw-ok">ОК (Набрать)</button>
                <button class="win-btn" id="${this.winId}-nw-cancel">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.winId,
      title: `HyperTerminal — ${this.stations[this.activeStationId].name}`,
      icon: 'hypertrm',
      width: 660,
      height: 455,
      minWidth: 540,
      minHeight: 360,
      resizable: true,
      maximizable: true,
      minimizable: true,
      content,
      onClose: () => this.cleanup()
    });

    this.bindEvents();
    this.dialCurrentStation();
    return win;
  }

  bindEvents() {
    const shell = document.getElementById(`${this.winId}-shell`);
    if (!shell) return;

    const menuItems = shell.querySelectorAll('.ht-menu-item');
    menuItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.ht-menu-opt')) return;
        const wasOpen = item.classList.contains('open');
        menuItems.forEach((m) => m.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });

    shell.addEventListener('click', (e) => {
      if (!e.target.closest('.ht-menu-item')) {
        menuItems.forEach((m) => m.classList.remove('open'));
      }
      const cmdNode = e.target.closest('[data-cmd]');
      if (cmdNode) {
        menuItems.forEach((m) => m.classList.remove('open'));
        this.handleCommand(cmdNode.dataset.cmd);
      }
    });

    const stSel = document.getElementById(`${this.winId}-station-select`);
    if (stSel) {
      stSel.addEventListener('change', () => {
        this.activeStationId = stSel.value;
        if (window.winManager) {
          window.winManager.setTitle(this.winId, `HyperTerminal — ${this.stations[this.activeStationId].name}`);
        }
        this.dialCurrentStation();
      });
    }

    const inputEl = document.getElementById(`${this.winId}-input`);
    const sendBtn = document.getElementById(`${this.winId}-send-btn`);
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = inputEl.value.trim();
          inputEl.value = '';
          this.processTerminalCommand(val);
        }
      });
    }
    if (sendBtn && inputEl) {
      sendBtn.addEventListener('click', () => {
        const val = inputEl.value.trim();
        inputEl.value = '';
        this.processTerminalCommand(val);
      });
    }

    const onClick = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    onClick(`${this.winId}-zm-close`, () => this.cancelZmodem());
    onClick(`${this.winId}-zm-cancel`, () => this.cancelZmodem());
    onClick(`${this.winId}-nw-close`, () => this.closeNewModal());
    onClick(`${this.winId}-nw-cancel`, () => this.closeNewModal());
    onClick(`${this.winId}-nw-ok`, () => {
      this.saveSessionFile();
      this.closeNewModal();
      this.dialCurrentStation();
    });

    const iconPicker = document.getElementById(`${this.winId}-nw-icons`);
    if (iconPicker) {
      iconPicker.querySelectorAll('.ht-icon-choice').forEach((ch) => {
        ch.addEventListener('click', () => {
          this.selectedIcon = ch.dataset.ic;
          iconPicker.querySelectorAll('.ht-icon-choice').forEach((c) => {
            c.classList.toggle('selected', c.dataset.ic === this.selectedIcon);
          });
        });
      });
    }
  }

  handleCommand(cmd) {
    switch (cmd) {
      case 'dial':
        this.dialCurrentStation();
        break;
      case 'hangup':
        this.disconnectStation();
        break;
      case 'zmodem-dl':
        this.startZmodemDownload(0);
        break;
      case 'new-conn':
        this.openNewModal();
        break;
      case 'save-ht':
        this.saveSessionFile();
        break;
      case 'copy-screen':
        this.copyScreenToClipboard();
        break;
      case 'exit':
        if (window.winManager) window.winManager.closeWindow(this.winId);
        break;
      case 'about':
        if (window.winManager && typeof window.winManager.openDialog === 'function') {
          window.winManager.openDialog({
            title: 'О программе «HyperTerminal»',
            icon: 'hypertrm',
            message: 'HyperTerminal Private Edition для Microslop Win 98 SE (HYPERTRM.EXE)\nЭмуляция терминала ANSI/CP866, дозвон на узлы FidoNet/BBS и прием файлов по протоколу ZMODEM.'
          });
        }
        break;
    }
  }

  playModemDialAudio(phone) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const digits = String(phone || '0959324812').replace(/\D/g, '');
      const now = ctx.currentTime;

      digits.split('').forEach((d, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 697 + (Number(d) * 58);
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.045);
      });

      const carrier = ctx.createOscillator();
      const cGain = ctx.createGain();
      carrier.type = 'sawtooth';
      const cStart = now + digits.length * 0.06 + 0.05;
      carrier.frequency.setValueAtTime(1650, cStart);
      carrier.frequency.exponentialRampToValueAtTime(2400, cStart + 0.25);
      cGain.gain.setValueAtTime(0.035, cStart);
      cGain.gain.exponentialRampToValueAtTime(0.001, cStart + 0.35);
      carrier.connect(cGain);
      cGain.connect(ctx.destination);
      carrier.start(cStart);
      carrier.stop(cStart + 0.36);
    } catch (e) {}
  }

  dialCurrentStation() {
    const st = this.stations[this.activeStationId] || this.stations.nightowl;
    this.playModemDialAudio(st.phone);
    this.connected = true;
    this.connectStartTime = Date.now();
    this.screenState = 'menu';
    this.startClock();
    this.renderStationState();
  }

  disconnectStation() {
    this.connected = false;
    this.stopClock();
    const ansi = document.getElementById(`${this.winId}-ansi`);
    const stConn = document.getElementById(`${this.winId}-st-conn`);
    if (stConn) stConn.textContent = 'Отключено';
    if (ansi) {
      ansi.innerHTML = [
        '<span style="color:#ffff55;">ATH0</span>',
        'NO CARRIER (Связь с узлом завершена)',
        '',
        'Нажмите кнопку [Вызов] или введите ATDT для повторного дозвона на BBS.'
      ].join('\n');
    }
    this.renderQuickKeys([
      { cmd: 'DIAL', label: '[Вызов] Набрать номер BBS' }
    ]);
  }

  startClock() {
    this.stopClock();
    const update = () => {
      const stConn = document.getElementById(`${this.winId}-st-conn`);
      const stBaud = document.getElementById(`${this.winId}-st-baud`);
      const st = this.stations[this.activeStationId] || this.stations.nightowl;
      if (stBaud) stBaud.textContent = st.baud;
      if (!this.connected) {
        if (stConn) stConn.textContent = 'Отключено';
        return;
      }
      const sec = Math.max(0, Math.floor((Date.now() - this.connectStartTime) / 1000));
      const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
      const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
      const ss = String(sec % 60).padStart(2, '0');
      if (stConn) stConn.textContent = `Подключено ${hh}:${mm}:${ss}`;
    };
    update();
    this.clockTimer = setInterval(update, 1000);
  }

  stopClock() {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }

  renderQuickKeys(keys) {
    const qBox = document.getElementById(`${this.winId}-qkeys`);
    if (!qBox) return;
    qBox.innerHTML = keys.map((k) => (
      `<button class="ht-qkey" data-qcmd="${k.cmd}">${k.label}</button>`
    )).join('');
    qBox.querySelectorAll('.ht-qkey').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.processTerminalCommand(btn.dataset.qcmd);
      });
    });
  }

  renderStationState() {
    const ansi = document.getElementById(`${this.winId}-ansi`);
    if (!ansi) return;
    const st = this.stations[this.activeStationId] || this.stations.nightowl;

    if (!this.connected) {
      this.disconnectStation();
      return;
    }

    if (this.screenState === 'echoes') {
      const echoHtml = st.echoes.map((e, i) => [
        `<span style="color:#ffff55;">═══ Почта Фидо [${i + 1}/${st.echoes.length}] • Эрия: ${e.area} ═══</span>`,
        `<span style="color:#55ffff;">От кого : ${e.from}</span>`,
        `<span style="color:#55ff55;">Тема    : ${e.subj}</span>`,
        `<span style="color:#ffffff;">${e.body}</span>`
      ].join('\n')).join('\n\n');

      ansi.innerHTML = `${echoHtml}\n\n<span style="color:#00ff44;">[M] Возврат в главное меню BBS &gt; </span><span class="ht-cursor"></span>`;
      this.renderQuickKeys([
        { cmd: 'M', label: '[M] Главное меню' },
        { cmd: '2', label: '[2] Файлы (ZMODEM)' },
        { cmd: '3', label: '[3] Стена One-Liners' }
      ]);
      return;
    }

    if (this.screenState === 'files') {
      const filesHtml = st.files.map((f, i) => (
        `<span style="color:#ffff55;">[F${i + 1}] ${f.filename.padEnd(16, ' ')}</span> <span style="color:#55ffff;">${f.size.padEnd(12, ' ')}</span> — <span style="color:#ffffff;">${f.desc}</span>`
      )).join('\n');

      ansi.innerHTML = [
        `<span style="color:${st.bannerColor};">╔══ ФАЙЛОВЫЙ АРХИВ СТАНЦИИ ${st.name} (ПРОТОКОЛ ZMODEM) ══╗</span>`,
        filesHtml,
        '',
        '<span style="color:#55ff55;">Выберите файл для скачивания в C:\\My Documents\\Downloads:</span>',
        '<span style="color:#00ff44;">Команда (D1, D2 или M) &gt; </span><span class="ht-cursor"></span>'
      ].join('\n');

      const qKeys = st.files.map((f, i) => ({
        cmd: `D${i + 1}`,
        label: `[Скачать ${f.filename}]`
      }));
      qKeys.push({ cmd: 'M', label: '[M] Главное меню' });
      this.renderQuickKeys(qKeys);
      return;
    }

    if (this.screenState === 'oneliners') {
      const listHtml = this.oneLiners.map((line) => `<span style="color:#55ffff;">• ${line}</span>`).join('\n');
      ansi.innerHTML = [
        '<span style="color:#ff55ff;">╔══ СТЕНА ГРАФФИТИ ФИДОШНИКОВ (BBS ONE-LINERS 1998) ══╗</span>',
        listHtml,
        '',
        '<span style="color:#ffff55;">Введите любой текст в поле CMD ниже и нажмите Ввод, чтобы оставить запись на BBS!</span>',
        '<span style="color:#00ff44;">Ваша строка (или M для выхода) &gt; </span><span class="ht-cursor"></span>'
      ].join('\n');
      this.renderQuickKeys([
        { cmd: 'Привет из Microslop Win 98 SE!', label: '[Написать привет!]' },
        { cmd: 'M', label: '[M] Главное меню' }
      ]);
      return;
    }

    if (this.screenState === 'doorgame') {
      const g = this.traderGame;
      ansi.innerHTML = [
        '<span style="color:#ffff55;">╔══ BBS DOOR-ИГРА: «БАРЫГА САВЁЛОВСКОГО РЫНКА \'98» (ДЕНЬ ' + g.day + ') ══╗</span>',
        `<span style="color:#55ffff;">Точка: ${g.location}   |   Наличность: $${g.cash} у.е.</span>`,
        `<span style="color:#55ff55;">Ваш рюкзак: Celeron 300A (${g.inv.celeron} шт.) | Voodoo2 12MB (${g.inv.voodoo2} шт.) | SB AWE64 (${g.inv.sb64} шт.)</span>`,
        '──────────────────────────────────────────────────────────────────────',
        `<span style="color:#ffffff;">[B1] Купить Celeron 300A ($${g.prices.celeron})     [S1] Продать Celeron 300A ($${g.prices.celeron})</span>`,
        `<span style="color:#ffffff;">[B2] Купить 3dfx Voodoo2 ($${g.prices.voodoo2})     [S2] Продать 3dfx Voodoo2 ($${g.prices.voodoo2})</span>`,
        `<span style="color:#ffffff;">[T]  Поехать на другой радиорынок (Митино / Горбушка / Савёловский)</span>`,
        '',
        '<span style="color:#00ff44;">Ваш ход (B1, S1, B2, S2, T, M) &gt; </span><span class="ht-cursor"></span>'
      ].join('\n');

      this.renderQuickKeys([
        { cmd: 'B1', label: `[Купить Celeron $${g.prices.celeron}]` },
        { cmd: 'S1', label: `[Продать Celeron $${g.prices.celeron}]` },
        { cmd: 'B2', label: `[Купить Voodoo2 $${g.prices.voodoo2}]` },
        { cmd: 'S2', label: `[Продать Voodoo2 $${g.prices.voodoo2}]` },
        { cmd: 'T', label: '[T] Сменить рынок' },
        { cmd: 'M', label: '[M] Меню BBS' }
      ]);
      return;
    }

    if (this.screenState === 'sysop') {
      ansi.innerHTML = [
        `<span style="color:#ffff55;">*** Вызов сисопа станции ${st.sysop} (${st.modem})... ***</span>`,
        `<span style="color:#55ff55;">[${st.sysop}]: Привет, Alexey_98! Отличный коннект на ${st.baud}!</span>`,
        `<span style="color:#55ff55;">[${st.sysop}]: Обязательно скачай файлы из раздела [2] по ZMODEM — они падают прямо в папку C:\\My Documents\\Downloads!</span>`,
        '',
        '<span style="color:#00ff44;">Нажмите [M] для возврата в главное меню &gt; </span><span class="ht-cursor"></span>'
      ].join('\n');
      this.renderQuickKeys([
        { cmd: '2', label: '[2] Перейти к файлам ZMODEM' },
        { cmd: 'M', label: '[M] Главное меню' }
      ]);
      return;
    }

    ansi.innerHTML = [
      `<span style="color:#888888;">ATDT ${st.phone}</span>`,
      `<span style="color:#ffff55;">CONNECT ${st.baud}/ARQ/LAPM/V42BIS (${st.modem})</span>`,
      `<span style="color:${st.bannerColor};">${st.titleAscii}</span>`,
      `<span style="color:#ffffff;">Сисоп узла: <strong>${st.sysop}</strong>  |  Пользователь: <strong>Alexey_98</strong> (Доступ: Доверенный)</span>`,
      '──────────────────────────────────────────────────────────────────────',
      '  <span style="color:#ffff55;">[1]</span> Эхоконференции FidoNet (RU.GAME, RU.ANECDOT, SU.HARDW.PC)',
      '  <span style="color:#55ffff;">[2]</span> Файловый архив BBS (Скачивание по протоколу ZMODEM в Downloads)',
      '  <span style="color:#ff55ff;">[3]</span> Стена граффити Фидошников (BBS One-Liners 1998)',
      '  <span style="color:#55ff55;">[4]</span> Door-игра «Барыга Савёловского Рынка \'98» (Торговля железом)',
      '  <span style="color:#ffaa00;">[5]</span> Позвать Сисопа в чат (Page SysOp)',
      '  <span style="color:#ff5555;">[G]</span> Завершить сеанс связи (Goodbye / Hangup)',
      '',
      '<span style="color:#00ff44;">Выберите раздел (1-5, G) &gt; </span><span class="ht-cursor"></span>'
    ].join('\n');

    this.renderQuickKeys([
      { cmd: '1', label: '[1] Почта FidoNet' },
      { cmd: '2', label: '[2] Файлы (ZMODEM)' },
      { cmd: '3', label: '[3] Стена One-Liners' },
      { cmd: '4', label: '[4] Игра «Савёловский 98»' },
      { cmd: '5', label: '[5] Чат с Сисопом' },
      { cmd: 'G', label: '[G] Отбой' }
    ]);
  }

  processTerminalCommand(rawCmd) {
    const cmd = String(rawCmd || '').trim();
    const upper = cmd.toUpperCase();

    if (upper === 'DIAL' || upper.startsWith('ATDT')) {
      this.dialCurrentStation();
      return;
    }
    if (!this.connected) {
      this.dialCurrentStation();
      return;
    }

    if (this.screenState === 'oneliners' && upper !== 'M' && cmd.length > 1) {
      this.oneLiners.push(`15.10.98 [2:5020/98.99] Alexey_98: ${cmd}`);
      this.renderStationState();
      return;
    }

    if (this.screenState === 'doorgame' && upper !== 'M') {
      this.handleTraderAction(upper);
      return;
    }

    if (upper === '1') {
      this.screenState = 'echoes';
      this.renderStationState();
    } else if (upper === '2') {
      this.screenState = 'files';
      this.renderStationState();
    } else if (upper === '3') {
      this.screenState = 'oneliners';
      this.renderStationState();
    } else if (upper === '4') {
      this.screenState = 'doorgame';
      this.renderStationState();
    } else if (upper === '5') {
      this.screenState = 'sysop';
      this.renderStationState();
    } else if (upper === 'D1') {
      this.startZmodemDownload(0);
    } else if (upper === 'D2') {
      this.startZmodemDownload(1);
    } else if (upper === 'G') {
      this.disconnectStation();
    } else {
      this.screenState = 'menu';
      this.renderStationState();
    }
  }

  handleTraderAction(act) {
    const g = this.traderGame;
    if (act === 'B1' && g.cash >= g.prices.celeron) {
      g.cash -= g.prices.celeron;
      g.inv.celeron++;
    } else if (act === 'S1' && g.inv.celeron > 0) {
      g.cash += g.prices.celeron;
      g.inv.celeron--;
    } else if (act === 'B2' && g.cash >= g.prices.voodoo2) {
      g.cash -= g.prices.voodoo2;
      g.inv.voodoo2++;
    } else if (act === 'S2' && g.inv.voodoo2 > 0) {
      g.cash += g.prices.voodoo2;
      g.inv.voodoo2--;
    } else if (act === 'T') {
      const markets = ['Савёловский радиорынок', 'Митинский радиорынок', 'ДК Горбунова (Горбушка)'];
      g.day++;
      g.location = markets[g.day % markets.length];
      g.prices.celeron = 90 + Math.round(Math.random() * 65);
      g.prices.voodoo2 = 175 + Math.round(Math.random() * 90);
      g.prices.sb64 = 50 + Math.round(Math.random() * 35);
    }
    this.renderStationState();
  }

  startZmodemDownload(fileIdx = 0) {
    const st = this.stations[this.activeStationId] || this.stations.nightowl;
    const fileObj = st.files[fileIdx] || st.files[0];
    if (!fileObj) return;

    this.cancelZmodem();
    const modal = document.getElementById(`${this.winId}-zmodem-modal`);
    const fileEl = document.getElementById(`${this.winId}-zm-file`);
    const blocksEl = document.getElementById(`${this.winId}-zm-blocks`);
    const barEl = document.getElementById(`${this.winId}-zm-bar`);
    if (fileEl) fileEl.textContent = fileObj.filename;
    if (modal) modal.classList.add('open');

    const totalBlocks = 16;
    let curBlock = 0;

    const step = () => {
      curBlock += 4;
      if (blocksEl) {
        blocksEl.textContent = `${Math.min(totalBlocks, curBlock)} / ${totalBlocks} (по 256 байт)`;
      }
      if (barEl) {
        const count = Math.min(32, curBlock * 2);
        let html = '';
        for (let i = 0; i < count; i++) {
          html += '<div class="ht-zmodem-block"></div>';
        }
        barEl.innerHTML = html;
      }

      if (curBlock >= totalBlocks) {
        this.cancelZmodem();
        this.writeDownloadedFileToVfs(fileObj);
      }
    };

    step();
    this.zmodemTimer = setInterval(step, 140);
  }

  writeDownloadedFileToVfs(fileObj) {
    if (!window.vfs) return;
    const dlPath = ['My Computer', 'C:', 'My Documents', 'Downloads'];
    let dlFolder = window.vfs.resolvePath(dlPath);
    if (!dlFolder) {
      const myDocs = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents']);
      if (myDocs && myDocs.children) {
        myDocs.children['Downloads'] = { type: 'folder', children: {} };
        dlFolder = myDocs.children['Downloads'];
      }
    }
    if (dlFolder && dlFolder.children) {
      const isBas = fileObj.filename.toUpperCase().endsWith('.BAS');
      dlFolder.children[fileObj.filename] = {
        type: 'file',
        icon: isBas ? 'file-bas' : 'file-text',
        app: isBas ? 'qbasic' : 'notepad',
        size: fileObj.size,
        content: fileObj.content
      };
      if (typeof window.vfs.save === 'function') window.vfs.save();
    }
    if (window.appExplorer && typeof window.appExplorer.refresh === 'function') {
      window.appExplorer.refresh();
    }
    this.lastDownloadedFile = fileObj.filename;
  }

  cancelZmodem() {
    if (this.zmodemTimer) {
      clearInterval(this.zmodemTimer);
      this.zmodemTimer = null;
    }
    const modal = document.getElementById(`${this.winId}-zmodem-modal`);
    if (modal) modal.classList.remove('open');
  }

  openNewModal() {
    const modal = document.getElementById(`${this.winId}-new-modal`);
    if (modal) modal.classList.add('open');
  }

  closeNewModal() {
    const modal = document.getElementById(`${this.winId}-new-modal`);
    if (modal) modal.classList.remove('open');
  }

  saveSessionFile() {
    if (!window.vfs) return;
    const nameInput = document.getElementById(`${this.winId}-nw-name`);
    const rawName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'NightOwl_BBS';
    const fileName = rawName.toLowerCase().endsWith('.ht') ? rawName : `${rawName}.ht`;
    const myDocs = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents']);
    if (myDocs && myDocs.children) {
      myDocs.children[fileName] = {
        type: 'file',
        icon: 'file-ht',
        app: 'hypertrm',
        stationId: this.activeStationId,
        content: `HyperTerminal Session\nStation=${this.activeStationId}\nIcon=${this.selectedIcon}`
      };
      if (typeof window.vfs.save === 'function') window.vfs.save();
    }
  }

  copyScreenToClipboard() {
    const ansi = document.getElementById(`${this.winId}-ansi`);
    if (!ansi) return;
    const text = ansi.textContent || '';
    if (window.appClipboardViewer && typeof window.appClipboardViewer.setText === 'function') {
      window.appClipboardViewer.setText(text, 'HyperTerminal ANSI Screen');
    }
  }

  cleanup() {
    this.stopClock();
    this.cancelZmodem();
  }
}

window.appHyperTerminal = new AppHyperTerminal();
