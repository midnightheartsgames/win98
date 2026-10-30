class AppIgroman {
  constructor() {
    this.currentPage = 2;
    this.selectedPatchIndex = 1;
    this.selectedSoftIndex = 0;
    this.winId = 'app_igroman';
    this.windowRef = null;

    this.games = [
      { gameId: 'burnout', pub: 'Bethesda Softworks', genre: 'автогонки', art: 'burnout', req: 'Pentium-75, 16 MB RAM, видео SVGA с 1MB, DOS или Win 95, Необходим DirectX 5.0', desc: 'Какой же русский не любит быстрой езды? Вот мы и предлагаем вам поучаствовать в настоящих соревнованиях по дрэг-рейсингу на бешеной скорости в четверть мили. Настройка двигателя, переключение передач и жжёная резина!' },
      { gameId: 'worldcup98', pub: 'EA Sports', genre: 'спортивный симулятор', art: 'worldcup98', req: 'Pentium-100, 16 MB RAM, видео SVGA с 1MB, Win 95, Необходим DirectX 5.0', desc: 'Игра EA Sports World Cup 98 дарит вам ещё одну возможность пережить все волнения только что завершившегося во Франции мундиаля! Реалистичные стадионы, официальный саундтрек Chumbawamba и 3D-анимация футболистов.' },
      { gameId: 'hockey', pub: 'EA Sports', genre: 'спортивный симулятор', art: 'nhl98', req: 'Pentium-90, 16 MB RAM, видео SVGA с 1MB, мышь, Win 95', desc: 'Хоккей – игра увлекательная, но вот только на коньках кататься умеют далеко не все. С NHL 98 от EA Sports вы получите лучший хоккейный симулятор с реальными составами команд НХЛ, силовыми приёмами и комментаторами.' },
      { gameId: 'quest_demo', pub: 'Retro Quest Games', req: 'Pentium-75, 16 MB RAM, SVGA 256 цветов, звуковая карта, Win 95/98' },
      { gameId: 'fallout98_demo', pub: 'Interplay', req: 'Pentium-90, 16 MB RAM, SVGA 640x480 256 цветов, Win 95/98, Необходим DirectX 3.0a' },
      { gameId: 'half-life_demo', pub: 'Sierra On-Line', req: 'Pentium-133, 24 MB RAM, видео SVGA, Win 95/98, рекомендуется 3D-ускоритель' },
      { gameId: 'neon-racer_demo', pub: 'RetroSpeed Studios', req: 'Pentium-166, 32 MB RAM, видео с 4MB, Win 95/98, Необходим DirectX 6.0' },
      { gameId: 'homm1_demo', pub: 'New World Computing / 3DO', req: 'Pentium-90, 16 MB RAM, SVGA 640x480, мышь, Win 95/98, Необходим DirectX 5.0' },
      { gameId: 'tekken98_demo', pub: 'Namco', req: 'Pentium II-233, 32 MB RAM, 3D-ускоритель с 8MB, Win 95/98, Необходим DirectX 6.0' },
      { gameId: 'stalker98_demo', pub: 'GSC Game World', req: 'Pentium II-300, 64 MB RAM, 3D-ускоритель с 16MB, Win 98, Необходим DirectX 7.0' },
      { gameId: 'mc98_demo', pub: 'Mojang Specifications', req: 'Pentium II-266, 64 MB RAM, 3D-ускоритель с поддержкой OpenGL, Win 95/98' },
      { gameId: 'sammax202_demo', pub: 'LucasArts', req: 'Pentium-133, 32 MB RAM, SVGA 256 цветов, Win 95/98, Необходим DirectX 6.0' },
      { gameId: 'kotor98_demo', pub: 'LucasArts', req: 'Pentium II-300, 64 MB RAM, 3D-ускоритель с 16MB, Win 98, Необходим DirectX 7.0' },
      { gameId: 'xiii_demo', pub: 'Ubisoft', req: 'Pentium II-350, 64 MB RAM, 3D-ускоритель с 16MB (TNT2 / Voodoo3 / Rage 128), Необходим DirectX 7.0' },
      { gameId: 'dmc98_demo', pub: 'Capcom', req: 'Pentium II-400, 64 MB RAM, 3D-ускоритель с 16MB, Win 98, Необходим DirectX 7.0' },
      { gameId: 'korovany_demo', pub: 'Джва Года Софт', req: 'Pentium II-350, 64 MB RAM, 3D-ускоритель с 16MB, Win 98, Необходим DirectX 7.0' },
      { gameId: 'dao98_demo', pub: 'Electronic Arts', req: 'Pentium II-400, 128 MB RAM, 3D-ускоритель с 32MB, Win 98, Необходим DirectX 8.0' },
      { gameId: 'maxpayne_demo', pub: 'Gathering of Developers', req: 'Pentium II-450, 96 MB RAM, 3D-ускоритель с 16MB (TNT2 / Voodoo3 / Rage 128), Необходим DirectX 7.0' },
      { gameId: 'falloutzp_demo', pub: 'Interplay', req: 'Pentium III-600, 128 MB RAM, 3D-ускоритель с 32MB (GeForce2 / Radeon), Необходим DirectX 8.0' },
      { gameId: 'hl2_demo', pub: 'Sierra / Valve Software', req: 'Pentium III-700, 128 MB RAM, 3D-ускоритель с 32MB (GeForce2 / Radeon), Необходим DirectX 8.0' },
      { gameId: 'moh98_demo', pub: 'Electronic Arts', req: 'Pentium II-266, 64 MB RAM, 3D-ускоритель с 8MB, Win 95/98, Необходим DirectX 6.1' },
      { gameId: 'sims3_demo', pub: 'Electronic Arts', req: 'Pentium II-300, 64 MB RAM, 3D-ускоритель с 16MB (TNT2 / Voodoo3 / Rage 128), Необходим DirectX 7.0' }
    ];
    this.games.forEach((g, i) => { g.page = 4 + i; });
    const afterGames = 4 + this.games.length;
    this.pages = {
      patches: afterGames,
      videos: afterGames + 1,
      softInternet: afterGames + 2,
      softAll: afterGames + 3,
      winamp: afterGames + 4,
      superbonus: afterGames + 5,
      exit: afterGames + 6
    };
    this.lastPage = this.pages.exit;
    this.shotIndex = {};

    if (window.gameManager) {
      window.gameManager.addListener(() => {
        if (this.isGamePage(this.currentPage)) this.updateView();
      });
    }

    this.patches = [
      { name: 'The Summoning', file: 'patch/SUMM_12.exe', desc: 'Данный патч сменит вашу версию игры на версию 1.2, устраняя некоторые ошибки предыдущей версии, в частности, проблемы со сбором камнеметательной машины гномов.' },
      { name: 'Fallout', file: 'patch/FALL11.exe', desc: 'Этот патч устраняет некоторые сбои в игре и убирает второе ограничение по времени. Теперь, найдя чип управления системой очистки воды, вам можно расслабиться: нападения супермутантов на Vault 13 не будет вообще.' },
      { name: 'Wetlands', file: 'patch/WETUP11.exe', desc: 'Данный патч сменит вашу версию игры на версию 1.1, устраняя некоторые ошибки предыдущей версии.' },
      { name: 'Privateer 2: The Darkening', file: 'patch/P2PATCH.exe', desc: 'Этот патч устраняет ошибки предыдущей версии, добавляет клавиши для управления кораблем на клавиатуре и дает вам долгожданную возможность задействовать неуязвимость из меню Spaceflight Options.' },
      { name: 'Descent 2', file: 'patch/Descent2p.exe', desc: 'Этот патч позволит игре поддерживать графические ускорители на чипсетах Voodoo (карточка Diamond Monster 3D). Внимание! У вас должны быть установлены драйвера Glide 2.31 или выше!' },
      { name: 'Descent: Freespace', file: 'patch/Fs10x-uk.exe', desc: 'Этот патч ускоряет игру по сети за счет перераспределения функций client-server и устраняет проблемы, возникающие иногда при взаимодействии с вспомогательными эскадрильями в бою для одиночной игры. Для английской версии.' },
      { name: 'Descent: Freespace', file: 'patch/Fs10x-us.exe', desc: 'Этот патч ускоряет игру по сети за счет перераспределения функций client-server и устраняет проблемы, возникающие иногда при взаимодействии с вспомогательными эскадрильями в бою для одиночной игры. Для американской версии.' },
      { name: 'Shadows of the Empire', file: 'patch/SOTE1_1.exe', desc: 'Данный патч сменит вашу версию игры на версию 1.1. При этом, помимо всего прочего, несколько улучшится управление прицелом при помощи мыши.' },
      { name: 'Star Wars: Rebellion', file: 'patch/RSUPD101.exe', desc: 'Патч обновляет стратегическую игру до версии 1.01, устраняя критические ошибки в тактическом модуле и ускоряя расчет галактических перемещений.' },
      { name: 'Dark Reign: The Future of War', file: 'patch/PATCH1_2.EXE', desc: 'Официальное обновление до версии 1.2. Улучшен баланс сторон, искусственный интеллект противников и сетевой код.' },
      { name: 'Heavy Gear', file: 'patch/Hgp187patch.exe', desc: 'Данный патч устраняет проблемы с зависанием на некоторых моделях 3D-ускорителей и улучшает физику движения мехов.' },
      { name: 'The Terminator: Rampage', file: 'patch/TR_PENT.exe', desc: 'Данный патч позволит вам играть в Rampage на современных Pentium и Pentium II без проблем, связанных с излишним ускорением игрового процесса.' },
      { name: 'The Terminator: Future Shock', file: 'patch/TFS_130.exe', desc: 'Патч устраняет ошибки первоначальной версии (частые зависания при посещении баз роботов или пуске ракет против Flencers). Предназначен для версии игры, выпущенной в США.' },
      { name: 'The Terminator: Future Shock', file: 'patch/TFS130UK.exe', desc: 'Патч устраняет ошибки первоначальной версии (частые зависания при посещении баз роботов или пуске ракет против Flencers). Предназначен для версии игры, выпущенной в Великобритании.' },
      { name: 'SKYNET: No Limits', file: 'patch/SKY101.exe', desc: 'Обновление v1.01 для культового шутера. Устраняет вылеты в DOS-сессиях и оптимизирует работу с памятью EMS/XMS.' },
      { name: 'F–15 Eagle', file: 'patch/f15patch.exe', desc: 'Патч устраняет ошибки текстурирования ландшафта и добавляет поддержку новых моделей джойстиков с обратной связью.' },
      { name: 'Unreal', file: 'patch/unrealpatch101.exe', desc: 'Патч v101 устраняет утечки памяти, повышает стабильность рендерера Glide и исправляет сетевой протокол Unreal Engine.' },
      { name: 'M.A.X. 2', file: 'patch/max2p13.exe', desc: 'Обновление 1.3 для тактической стратегии MAX 2. Улучшает баланс бронетехники и алгоритмы поиска пути.' },
      { name: 'Stonekeep', file: 'patch/SK_P12.exe', desc: 'Очень редкий патч для одной из самых лучших ролевых игр прошлых лет. Обладателей этого раритета несомненно порадует возможность сменить версию игры на 1.2, благодаря чему будут устранены ошибки предыдущей версии.' },
      { name: 'Battlezone', file: 'patch/bzpat131.exe', desc: 'Патч v1.3.1 для инновационного гибрида 3D-action и стратегии от Activision. Исправляет ошибки сетевой синхронизации.' },
      { name: 'Wing Commander: Prophecy', file: 'patch/WCPVOOD2.exe', desc: 'Данный патч устраняет проблемы при использовании графических ускорителей на чипсетах Voodoo (карточка Diamond Monster 3D) и Voodoo 2.' },
      { name: 'Wing Commander IV: The Price of Freedom', file: 'patch/WC4JOY.exe', desc: 'Устраняет ошибки калибровки джойстика и добавляет поддержку 4-осевых манипуляторов.' },
      { name: 'Wing Commander IV: The Price of Freedom', file: 'patch/WC4WIN95.exe', desc: 'Этот патч позволит вам запускать игру Wing Commander IV прямо из Win 95 без необходимости перезагрузки в режим MS-DOS.' },
      { name: 'Jedi Knight: Dark Forces II', file: 'patch/jkupd101.exe', desc: 'Официальное обновление v1.01 для Dark Forces II: исправляет ошибки дуэлей на световых мечах и сетевой протокол DirectPlay.' }
    ];

    this.videos = [
      { name: 'Ultima: Ascension (Origin)', sub: '320х240, 58 сек', file: 'content/igromania/ascension.mp4' },
      { name: 'Heretic II (Activision)', sub: '160х120, 2 мин 31 сек', file: 'content/igromania/heretic.mp4' },
      { name: 'Metro City (Melbourne House)', sub: '320х240, 25 сек', file: 'content/igromania/metro20.mp4' },
      { name: 'Alien Vs Predator (Fox Interactive)', sub: '320х240, 54 сек', file: 'content/igromania/AVPRED.mp4' },
      { name: 'Turok 2 (Acclaim)', sub: '320х240, 42 сек', file: 'content/igromania/TUROK2.mp4' },
      { name: 'Blackstone Chronicles (Mindscape)', sub: '320х240, 11 сек', file: 'content/igromania/Blckstn.mp4' }
    ];

    this.popularSkins = [
      'ampman-s', 'antamp', 'atomamp', 'besttitanic', 'bfampski',
      'calamp', 'camo', 'cocaskin', 'commodore', 'daeskin',
      'descent2amp', 'digitali', 'digol10', 'doomamp', 'dragon',
      'drw-skin', 'exc_sa11', 'fireskin', 'flyampsk12', 'fusion',
      'gold', 'heidiski', 'hmamp', 'icqamp', 'insidious',
      'neonamp103', 'prodigy-Amp20', 'psxamp', 'q2ampski', 'quicksil',
      'roachamp', 'sony4000', 'southpark', 'speed', 'SpiceAmp202a',
      'startrek', 'swank', 'windows_\x2798_AMP', 'xfiles10', 'zoonamp'
    ];
  }

  open(initialPage = 2) {
    if (window.soundSys) {
      window.soundSys.playCdSpinUp();
    }

    if (window.winManager && window.winManager.windows.has(this.winId)) {
      const win = window.winManager.windows.get(this.winId);
      if (win.isMinimized) {
        window.winManager.restoreWindow(this.winId);
      } else {
        window.winManager.bringToTop(this.winId);
      }
      this.goToPage(initialPage);
      return;
    }

    this.currentPage = initialPage;

    const win = window.winManager.createWindow({
      id: this.winId,
      title: 'igroman',
      icon: 'igroman',
      width: 780,
      height: 560,
      resizable: true,
      content: this.buildWindowHTML(),
      onClose: () => {
        this.windowRef = null;
      }
    });

    this.windowRef = win;
    this.attachEvents(win);
    this.updateView();
  }

  openGame(gameId) {
    const game = this.games.find(g => g.gameId === gameId);
    this.open(game ? game.page : 3);
  }

  isGamePage(page) {
    return page >= 4 && page < this.pages.patches;
  }

  isPlaySection(page) {
    return page >= 3 && page <= this.pages.videos;
  }

  isArmSection(page) {
    return page >= this.pages.softInternet && page <= this.pages.winamp;
  }

  getThemeClass(page) {
    if (page === 1 || page === 2) return 'theme-red';
    if (this.isPlaySection(page)) return 'theme-blue';
    if (this.isArmSection(page)) return 'theme-green';
    return 'theme-purple';
  }

  getSectionTitle(page) {
    if (page === 1) return 'ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ';
    if (page === 2) return 'СОДЕРЖАНИЕ';
    if (this.isPlaySection(page)) return 'ИГРАЕМ';
    if (this.isArmSection(page)) return 'ВООРУЖАЕМСЯ';
    if (page === this.pages.superbonus) return 'СУПЕРБОНУС';
    return 'ВЫХОД';
  }

  buildWindowHTML() {
    return `
      <div class="igroman-window ${this.getThemeClass(this.currentPage)}" id="igroman_container">
                <div class="igroman-header" id="igroman_header">
          <div class="igroman-watermark">ИГРОМАНИЯ</div>
          <div class="igroman-target-box">
            <div class="igroman-target-color-block"></div>
            <svg class="igroman-target-svg" viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="46" stroke="#ffffff" stroke-width="1.8" opacity="0.6"/>
              <circle cx="50" cy="50" r="36" stroke="#ffffff" stroke-width="1.8"/>
              <circle cx="50" cy="50" r="26" stroke="#ffffff" stroke-width="1.8"/>
              <circle cx="50" cy="50" r="16" stroke="#ffffff" stroke-width="2"/>
                            <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" stroke-width="2"/>
              <line x1="50" y1="0" x2="50" y2="100" stroke="#ffffff" stroke-width="2"/>
              <circle cx="50" cy="50" r="4.5" fill="#000000"/>
                            <rect x="44" y="44" width="12" height="12" stroke="#000000" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <div class="igroman-header-title-wrap">
            <div class="igroman-header-title" id="igroman_header_title">${this.getSectionTitle(this.currentPage)}</div>
          </div>
        </div>

                <div class="igroman-body">
                    <div class="igroman-sidebar" id="igroman_sidebar">
            <div class="igroman-nav-group">
              <div class="igroman-nav-title" data-nav="2">СОДЕРЖАНИЕ</div>
            </div>

            <div class="igroman-nav-group">
              <div class="igroman-nav-title" data-nav="3">ИГРАЕМ</div>
              <div class="igroman-nav-subs">
                <div class="igroman-nav-subitem" data-nav="3">демоверсии</div>
                <div class="igroman-nav-subitem" data-nav="${this.pages.patches}">патчи</div>
                <div class="igroman-nav-subitem" data-nav="${this.pages.videos}">видеоролики</div>
              </div>
            </div>

            <div class="igroman-nav-group">
              <div class="igroman-nav-title" data-nav="${this.pages.softInternet}">ВООРУЖАЕМСЯ</div>
              <div class="igroman-nav-subs">
                <div class="igroman-nav-subitem" data-nav="${this.pages.softInternet}">программы для интернет</div>
                <div class="igroman-nav-subitem" data-nav="${this.pages.softAll}">программы для всех</div>
                <div class="igroman-nav-subitem" data-nav="${this.pages.winamp}">WinAMP и все-все-все</div>
              </div>
            </div>

            <div class="igroman-nav-group">
              <div class="igroman-nav-title" data-nav="${this.pages.superbonus}">СУПЕРБОНУС</div>
            </div>
          </div>

                    <div class="igroman-stage" id="igroman_stage">
                      </div>
        </div>

                <div class="igroman-footer">
          <div class="igroman-page-num-box" id="igroman_page_num">${this.currentPage}</div>
          <div class="igroman-footer-line"></div>
          <div class="igroman-footer-actions">
            <div class="igroman-btn-exit" id="igroman_btn_exit">ВЫХОД</div>
            <div class="igroman-arrow-btns">
              <div class="igroman-btn-arrow ${this.currentPage <= 1 ? 'disabled' : ''}" id="igroman_btn_prev">&#9668;</div>
              <div class="igroman-btn-arrow ${this.currentPage >= this.lastPage ? 'disabled' : ''}" id="igroman_btn_next">&#9658;</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(win) {
    const el = win.element;

    el.addEventListener('click', (e) => {
      const navTarget = e.target.closest('[data-nav]');
      if (navTarget) {
        const pageNum = parseInt(navTarget.getAttribute('data-nav'), 10);
        if (!isNaN(pageNum)) {
          this.goToPage(pageNum);
        }
      }
    });

    const btnPrev = el.querySelector('#igroman_btn_prev');
    const btnNext = el.querySelector('#igroman_btn_next');
    const btnExit = el.querySelector('#igroman_btn_exit');

    btnPrev.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.goToPage(this.currentPage - 1);
      }
    });

    btnNext.addEventListener('click', () => {
      if (this.currentPage < this.lastPage) {
        this.goToPage(this.currentPage + 1);
      }
    });

    btnExit.addEventListener('click', () => {
      window.winManager.openDialog({
        title: 'Выход из Игромании',
        icon: 'warning',
        message: 'Вы действительно хотите завершить работу с компакт-диском журнала «Игромания»?',
        buttons: [
          {
            text: 'Да',
            isDefault: true,
            primary: true,
            onClick: () => {
              window.winManager.closeWindow(this.winId);
            },
            action: () => {
              window.winManager.closeWindow(this.winId);
            }
          },
          { text: 'Нет', onClick: () => {} }
        ]
      });
    });
  }

  goToPage(num) {
    if (num < 1) num = 1;
    if (num > this.lastPage) num = this.lastPage;
    this.currentPage = num;

    if (window.soundSys) {
      window.soundSys.playPageFlip();
    }

    this.updateView();
  }

  updateView() {
    if (!this.windowRef || !this.windowRef.element) return;
    const el = this.windowRef.element;

    const container = el.querySelector('#igroman_container');
    const headerTitle = el.querySelector('#igroman_header_title');
    const pageNumEl = el.querySelector('#igroman_page_num');
    const btnPrev = el.querySelector('#igroman_btn_prev');
    const btnNext = el.querySelector('#igroman_btn_next');
    const stage = el.querySelector('#igroman_stage');

    container.className = `igroman-window ${this.getThemeClass(this.currentPage)}`;
    headerTitle.textContent = this.getSectionTitle(this.currentPage);
    pageNumEl.textContent = this.currentPage;

    btnPrev.classList.toggle('disabled', this.currentPage <= 1);
    btnNext.classList.toggle('disabled', this.currentPage >= this.lastPage);

    el.querySelectorAll('.igroman-nav-title, .igroman-nav-subitem').forEach(item => {
      item.classList.remove('active');
    });

    const page = this.currentPage;
    const activeTitle = page === 2 ? 2
      : this.isPlaySection(page) ? 3
      : this.isArmSection(page) ? this.pages.softInternet
      : page === this.pages.superbonus ? this.pages.superbonus : null;
    const activeSub = page >= 3 && page < this.pages.patches ? 3
      : this.isPlaySection(page) || this.isArmSection(page) ? page : null;
    const title = activeTitle && el.querySelector(`.igroman-nav-title[data-nav="${activeTitle}"]`);
    if (title) title.classList.add('active');
    const sub = activeSub && el.querySelector(`.igroman-nav-subitem[data-nav="${activeSub}"]`);
    if (sub) sub.classList.add('active');

    stage.innerHTML = this.renderStageContent();
    this.bindStageEvents(stage);
  }

  renderStageContent() {
    const page = this.currentPage;
    if (page === 1) return this.renderLicensePage();
    if (page === 2) return this.renderContentsPage();
    if (page === 3) return this.renderDemoListPage();
    if (this.isGamePage(page)) return this.renderGamePage(page);
    if (page === this.pages.patches) return this.renderPatchesPage();
    if (page === this.pages.videos) return this.renderVideosPage();
    if (page === this.pages.softInternet) return this.renderSoftInternetPage();
    if (page === this.pages.softAll) return this.renderSoftAllPage();
    if (page === this.pages.winamp) return this.renderWinampPage();
    if (page === this.pages.superbonus) return this.renderSuperbonusPage();
    return this.renderExitPage();
  }

  renderLicensePage() {
    return `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div style="font-family:'Arial Black'; font-size:16px; color:#e60000; margin-bottom:8px;">ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ</div>
        <div class="igroman-license-box">
          <b>ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ С КОНЕЧНЫМ ПОЛЬЗОВАТЕЛЕМ</b><br><br>
          Конечный пользователь имеет право:<br>
          - использовать эти программы на отдельном компьютере;<br>
          - использовать программы в локальной сети с обязательным соблюдением наличия у каждого пользователя копии данного соглашения;<br>
          - копировать программы с целью резервного сохранения с обязательным сохранением лицензии.<br><br>
          Конечный пользователь НЕ ИМЕЕТ права:<br>
          - изменять, декомпилировать или дисассемблировать исходный код программ;<br>
          - продавать, тиражировать или распространять программы с целью извлечения коммерческой выгоды;<br>
          - удалять любые товарные знаки и лицензионные документы.<br><br>
          Все программы были тщательно протестированы, однако пользователь использует их на свой риск. Журнал «Игромания» не несет ответственности за любой ущерб, который может возникнуть от использования размещенных на диске программ.
        </div>
        <div style="font-size:12px; margin-bottom:10px;"><b>Вы согласны со всеми пунктами данного лицензионного соглашения?</b></div>
        <div class="igroman-license-btns">
          <button class="igroman-btn-install" id="btn_license_accept" style="font-size:12px; padding:4px 14px;">СОГЛАСЕН</button>
          <button class="win-btn" id="btn_license_decline" style="font-size:12px; padding:4px 14px;">НЕ СОГЛАСЕН</button>
        </div>
      </div>
    `;
  }

  renderContentsPage() {
    return `
      <div class="igroman-toc-container">
                <div class="igroman-toc-section">
          <div class="igroman-toc-header blue" data-nav="3">
            <div class="igroman-toc-title">ИГРАЕМ</div>
            <div class="igroman-toc-page-num">3</div>
          </div>
          <div class="igroman-toc-items">
            <div class="igroman-toc-item" data-nav="3">ДЕМОВЕРСИИ</div>
            <div class="igroman-toc-item" data-nav="${this.pages.patches}">ПАТЧИ</div>
            <div class="igroman-toc-item" data-nav="${this.pages.videos}">ВИДЕОРОЛИКИ</div>
          </div>
        </div>

        <div class="igroman-toc-section">
          <div class="igroman-toc-header green" data-nav="${this.pages.softInternet}">
            <div class="igroman-toc-title">ВООРУЖАЕМСЯ</div>
            <div class="igroman-toc-page-num">${this.pages.softInternet}</div>
          </div>
          <div class="igroman-toc-items">
            <div class="igroman-toc-item" data-nav="${this.pages.softInternet}">ПРОГРАММЫ ДЛЯ ИНТЕРНЕТ</div>
            <div class="igroman-toc-item" data-nav="${this.pages.softAll}">ПРОГРАММЫ ДЛЯ ВСЕХ</div>
            <div class="igroman-toc-item" data-nav="${this.pages.winamp}">WINAMP И ВСЕ–ВСЕ–ВСЕ</div>
          </div>
        </div>

        <div class="igroman-toc-section">
          <div class="igroman-toc-header purple" data-nav="${this.pages.superbonus}">
            <div class="igroman-toc-title">СУПЕРБОНУС</div>
            <div class="igroman-toc-page-num">${this.pages.superbonus}</div>
          </div>
          <div class="igroman-toc-items">
            <div class="igroman-toc-item" data-nav="${this.pages.superbonus}">BATTLECRUISER 3000</div>
          </div>
        </div>
      </div>
    `;
  }

  renderDemoListPage() {
    const listHtml = this.games.map(g => `
      <div class="igroman-demo-list-item" data-demo-page="${g.page}">
        ${this.gameInfo(g).title}
      </div>
    `).join('');

    return `
      <div class="igroman-demo-list-container">
        <div class="igroman-demo-list">
          ${listHtml}
        </div>
      </div>
    `;
  }

  gameInfo(g) {
    const entry = (window.gameManager && window.gameManager.catalog[g.gameId]) || {};
    return {
      title: entry.title || g.gameId,
      dev: entry.developer || '',
      genre: g.genre || entry.genre || '',
      desc: g.desc || entry.desc || '',
      shots: entry.shots || []
    };
  }

  renderArt(art) {
    if (art === 'burnout') return `
        <svg viewBox="0 0 190 130" width="190" height="130" style="background:#0a0f18;">
          <defs>
            <linearGradient id="bo_sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0a192f"/>
              <stop offset="60%" stop-color="#d35400"/>
              <stop offset="100%" stop-color="#e67e22"/>
            </linearGradient>
          </defs>
          <rect width="190" height="52" fill="url(#bo_sky)"/>
          <line x1="0" y1="52" x2="190" y2="52" stroke="#333" stroke-width="1.5"/>
          <polygon points="15,130 175,130 110,52 80,52" fill="#1e1e24"/>
          <line x1="95" y1="52" x2="95" y2="130" stroke="#f1c40f" stroke-width="2"/>
          <rect x="93.5" y="22" width="3" height="38" fill="#f1c40f"/>
          <rect x="89" y="24" width="12" height="30" fill="#111"/>
          <circle cx="92" cy="27" r="1.3" fill="#fff"/>
          <circle cx="98" cy="27" r="1.3" fill="#fff"/>
          <circle cx="92" cy="32" r="1.3" fill="#f39c12"/>
          <circle cx="98" cy="32" r="1.3" fill="#f39c12"/>
          <circle cx="92" cy="37" r="1.3" fill="#f39c12"/>
          <circle cx="98" cy="37" r="1.3" fill="#f39c12"/>
          <circle cx="92" cy="43" r="1.6" fill="#2ecc71"/>
          <circle cx="98" cy="43" r="1.6" fill="#2ecc71"/>
          <rect x="42" y="84" width="40" height="22" rx="3" fill="#c0392b" stroke="#000" stroke-width="1"/>
          <rect x="36" y="86" width="9" height="18" fill="#111" rx="2"/>
          <rect x="76" y="91" width="7" height="11" fill="#111" rx="2"/>
          <rect x="52" y="77" width="8" height="8" fill="#ecf0f1"/>
          <polygon points="50,77 62,77 64,73 48,73" fill="#e74c3c"/>
          <circle cx="36" cy="96" r="8" fill="#ecf0f1" opacity="0.75"/>
          <circle cx="27" cy="90" r="11" fill="#ecf0f1" opacity="0.6"/>
          <circle cx="20" cy="83" r="8" fill="#ecf0f1" opacity="0.4"/>
          <rect x="114" y="78" width="34" height="18" rx="2" fill="#2980b9" stroke="#000" stroke-width="1"/>
          <rect x="142" y="80" width="7" height="13" fill="#111"/>
          <rect x="110" y="82" width="7" height="11" fill="#111"/>
          <rect x="4" y="4" width="82" height="12" fill="#cc0000" rx="1"/>
          <text x="45" y="13" fill="#ffff00" font-family="'Arial Black'" font-size="7" text-anchor="middle">HOT ROD RACING</text>
        </svg>`;
    if (art === 'worldcup98') return `
        <svg viewBox="0 0 190 130" width="190" height="130" style="background:#09152e;">
          <rect width="190" height="130" fill="#09152e"/>
          <rect x="12" y="20" width="166" height="98" rx="4" fill="#1e7e34" stroke="#ffffff" stroke-width="1.5"/>
          <rect x="28" y="20" width="22" height="98" fill="#238c3b"/>
          <rect x="72" y="20" width="22" height="98" fill="#238c3b"/>
          <rect x="116" y="20" width="22" height="98" fill="#238c3b"/>
          <line x1="95" y1="20" x2="95" y2="118" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="95" cy="69" r="16" fill="none" stroke="#ffffff" stroke-width="1.5"/>
          <rect x="12" y="45" width="24" height="48" fill="none" stroke="#ffffff" stroke-width="1.5"/>
          <rect x="154" y="45" width="24" height="48" fill="none" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="78" cy="64" r="4" fill="#dc2626" stroke="#ffffff" stroke-width="1"/>
          <circle cx="114" cy="72" r="4" fill="#1d4ed8" stroke="#ffffff" stroke-width="1"/>
          <circle cx="97" cy="68" r="3" fill="#ffffff" stroke="#111111" stroke-width="1"/>
          <rect x="18" y="4" width="154" height="13" fill="#1d4ed8" stroke="#facc15" stroke-width="1" rx="2"/>
          <text x="95" y="13" fill="#fde047" font-family="'Arial Black', Impact, sans-serif" font-size="8" font-weight="bold" text-anchor="middle">EA SPORTS • WORLD CUP 98</text>
        </svg>`;
    return `
        <svg viewBox="0 0 190 130" width="190" height="130" style="background:#07192f;">
          <defs>
            <linearGradient id="nhl_ice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#d6edfc"/>
              <stop offset="50%" stop-color="#eef7fd"/>
              <stop offset="100%" stop-color="#c5e3f6"/>
            </linearGradient>
          </defs>
          <rect width="190" height="130" fill="#07192f"/>
          <rect x="15" y="15" width="160" height="100" rx="18" fill="url(#nhl_ice)" stroke="#3a6073" stroke-width="2"/>
          <line x1="95" y1="15" x2="95" y2="115" stroke="#cc2222" stroke-width="2"/>
          <line x1="55" y1="15" x2="55" y2="115" stroke="#1d4ed8" stroke-width="2"/>
          <line x1="135" y1="15" x2="135" y2="115" stroke="#1d4ed8" stroke-width="2"/>
          <circle cx="95" cy="65" r="18" fill="none" stroke="#1d4ed8" stroke-width="1.5"/>
          <circle cx="95" cy="65" r="3" fill="#1d4ed8"/>
          <path d="M 23 57 A 8 8 0 0 1 23 73 Z" fill="#93c5fd" stroke="#cc2222" stroke-width="1.5"/>
          <line x1="23" y1="25" x2="23" y2="105" stroke="#cc2222" stroke-width="1.5"/>
          <path d="M 167 57 A 8 8 0 0 0 167 73 Z" fill="#93c5fd" stroke="#cc2222" stroke-width="1.5"/>
          <line x1="167" y1="25" x2="167" y2="105" stroke="#cc2222" stroke-width="1.5"/>
          <circle cx="40" cy="40" r="1.5" fill="#cc2222"/>
          <circle cx="40" cy="90" r="1.5" fill="#cc2222"/>
          <circle cx="150" cy="40" r="1.5" fill="#cc2222"/>
          <circle cx="150" cy="90" r="1.5" fill="#cc2222"/>
          <rect x="25" y="6" width="140" height="14" fill="#000066" rx="2"/>
          <text x="95" y="16" fill="#ffff00" font-family="'Arial Black', Impact, sans-serif" font-size="8" font-weight="bold" text-anchor="middle">EA SPORTS • NHL '98</text>
          <ellipse cx="98" cy="67" rx="3" ry="1.8" fill="#111111"/>
        </svg>`;
  }

  renderShot(g, info) {
    if (g.art) {
      return `<div class="igroman-game-screenshot-frame" data-shot-launch="${g.gameId}" title="Нажмите, чтобы установить или запустить">${this.renderArt(g.art)}</div>`;
    }
    const count = info.shots.length;
    const idx = Math.min(this.shotIndex[g.gameId] || 0, Math.max(0, count - 1));
    return `
      <div class="igroman-game-screenshot-frame is-photo" data-shot-next="${g.gameId}" title="Следующий кадр">
        <img class="igroman-game-screenshot-img" src="content/igromania/demos/${g.gameId}-${idx + 1}.jpg" alt="${info.shots[idx] || ''}">
      </div>
      <div class="igroman-game-shot-caption">
        <span>${info.shots[idx] || ''}</span>
        <span class="igroman-game-shot-count">кадр ${idx + 1} из ${count}</span>
      </div>
    `;
  }

  renderGamePage(pageNum) {
    const game = this.games.find(g => g.page === pageNum) || this.games[0];
    const info = this.gameInfo(game);
    const installed = !!(window.gameManager && window.gameManager.isInstalled(game.gameId));

    const actionBtnHtml = installed
      ? `
        <button class="igroman-btn-install" data-game-launch="${game.gameId}" style="background:#008800;">ЗАПУСТИТЬ ИГРУ</button>
        <button class="win-btn" data-game-setup="${game.gameId}" style="padding:4px 10px; font-size:11px;">Переустановить</button>
      `
      : `
        <button class="igroman-btn-install" data-game-setup="${game.gameId}">УСТАНОВИТЬ ИГРУ</button>
      `;

    return `
      <div class="igroman-game-container">
        <div class="igroman-game-header-title">${info.title}</div>
        <div class="igroman-game-cols">
          <div class="igroman-game-left-col">
            ${info.desc}
          </div>

          <div class="igroman-game-right-col">
            <div class="igroman-game-specs">
              <div><b>Разработчик:</b> ${info.dev}</div>
              <div><b>Издатель:</b> ${game.pub}</div>
              <div><b>Жанр:</b> ${info.genre}</div>
              <div><b>Системные требования:</b></div>
              <div style="margin-left:4px;">${game.req}</div>
            </div>

            ${this.renderShot(game, info)}
          </div>
        </div>

        <div class="igroman-game-action-wrap" style="display:flex; gap:10px;">
          ${actionBtnHtml}
        </div>
      </div>
    `;
  }

  launchGame(gameId) {
    const entry = window.gameManager && window.gameManager.catalog[gameId];
    if (window.soundSys) window.soundSys.playClick();
    if (entry && entry.launch) entry.launch();
  }

  setupGame(gameId) {
    if (window.soundSys) window.soundSys.playClick();
    if (window.gameManager) window.gameManager.openSetupWizard(gameId);
  }

  renderPatchesPage() {
    const selectedPatch = this.patches[this.selectedPatchIndex] || this.patches[0];

    const patchItemsHtml = this.patches.map((p, idx) => `
      <div class="igroman-patch-item ${idx === this.selectedPatchIndex ? 'selected' : ''}" data-patch-idx="${idx}" title="${p.name}">
        ${p.name}
      </div>
    `).join('');

    return `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div class="igroman-patches-title">ПАТЧИ И ОБНОВЛЕНИЯ ИГР</div>
        <div class="igroman-patches-grid">
          ${patchItemsHtml}
        </div>

        <div class="igroman-patch-desc-box">
          <div style="font-weight:bold; color:#0078d7; margin-bottom:4px;">${selectedPatch.name} (${selectedPatch.file})</div>
          <div>${selectedPatch.desc}</div>
        </div>

        <div style="margin-top:10px; display:flex; align-items:center; gap:12px;">
          <button class="igroman-btn-install" id="btn_install_patch" data-file="${selectedPatch.file}" data-title="${selectedPatch.name}">УСТАНОВИТЬ ПАТЧ</button>
        </div>
      </div>
    `;
  }

  renderVideosPage() {
    const videoItemsHtml = this.videos.map((v, idx) => `
      <div class="igroman-video-item" data-video-file="${v.file}" data-video-name="${v.name}">
        <div>
          <div class="igroman-video-name">${v.name}</div>
          <div class="igroman-video-info">${v.sub} &bull; Формат: AVI (Cinepak)</div>
        </div>
        <div class="igroman-video-play-badge">
          &#9658; СМОТРЕТЬ
        </div>
      </div>
    `).join('');

    return `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div style="font-family:'Arial Black'; font-size:16px; color:#0078d7; margin-bottom:10px;">ЭКСКЛЮЗИВНЫЕ ВИДЕОРОЛИКИ И ТРЕЙЛЕРЫ</div>
        <div class="igroman-video-list">
          ${videoItemsHtml}
        </div>
      </div>
    `;
  }

  renderSoftInternetPage() {
    return `
      <div style="display:flex; flex-direction:column; height:100%;">
                <div class="igroman-soft-category">
          <div class="igroman-soft-subheading">ЛУЧШИЕ ИНТЕРНЕТ–БРОДИЛКИ</div>
          <div class="igroman-soft-list">
            <div class="igroman-soft-item" data-install="soft_int/cc32r405.exe" data-title="Netscape Communicator 4.05 (русская версия)">
              <span>Netscape Communicator 4.05 (русская версия)</span>
              <button class="win-btn" style="padding:1px 8px; font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_int/cc32e405.exe" data-title="Netscape Communicator 4.05 (английская версия)">
              <span>Netscape Communicator 4.05 (английская версия)</span>
              <button class="win-btn" style="padding:1px 8px; font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_int/ie401rus/IE4SETUP.EXE" data-title="Microslop Internet Explorer 4.01 (русская версия)">
              <span>Microslop Internet Explorer 4.01 (русская версия)</span>
              <button class="win-btn" style="padding:1px 8px; font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_int/ie401eng/IE4SETUP.EXE" data-title="Microslop Internet Explorer 4.01 (английская версия)">
              <span>Microslop Internet Explorer 4.01 (английская версия)</span>
              <button class="win-btn" style="padding:1px 8px; font-size:10px;">Установить</button>
            </div>
          </div>
        </div>

                <div class="igroman-soft-category">
          <div class="igroman-soft-subheading">ПРОГРАММЫ, КОТОРЫЕ ДЕЛАЮТ РАБОТУ В СЕТИ ПРОЩЕ И ПРИЯТНЕЕ</div>
          <div class="igroman-soft-list">
            <div class="igroman-soft-item" data-install="soft_int/cppro.exe" data-title="ConnectionPal Professional">
              <span>ConnectionPal Professional <small style="color:#555;">(Звонилка для выхода в Интернет)</small></span>
              <button class="win-btn" style="padding:1px 8px; font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_int/nm.exe" data-title="Net.Medic">
              <span>Net.Medic <small style="color:#555;">(Диагностика Dial-up каналов)</small></span>
              <button class="win-btn" style="padding:1px 8px; font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_int/icq98a.exe" data-title="ICQ98a">
              <span>ICQ98a <small style="color:#555;">(Ваш сетевой пейджер реального времени)</small></span>
              <button class="win-btn" style="padding:1px 8px; font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_int/mirc32.exe" data-title="mIRC 32 v5.41 (RusNet)">
              <span>mIRC 32 v5.41 <small style="color:#555;">(IRC-клиент для RusNet, DALnet и EFnet)</small></span>
              <button class="win-btn" style="padding:1px 8px; font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_int/the_bat.exe" data-title="The Bat!">
              <span>The Bat! <small style="color:#555;">(Один из лучших почтовых клиентов)</small></span>
              <button class="win-btn" style="padding:1px 8px; font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_int/windownload.exe" data-title="WinDownload 4.01">
              <span>WinDownload 4.01 <small style="color:#555;">(Докачка файлов по расписанию)</small></span>
              <button class="win-btn" style="padding:1px 8px; font-size:10px;">Установить</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSoftAllPage() {
    return `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div style="font-family:'Arial Black'; font-size:15px; color:#00a800; margin-bottom:10px;">ПРОГРАММЫ И УТИЛИТЫ ДЛЯ ВСЕХ</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:11px;">
                    <div>
            <div style="font-family:'Arial Black'; color:#e60000; margin-bottom:4px;">ГРАФИКА И ВЬЮВЕРЫ</div>
            <div class="igroman-soft-item" data-install="soft_u/acdc3223.exe" data-title="ACDSee 32 v2.23">
              <span>ACDSee 32 v2.23</span>
              <button class="win-btn" style="font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_u/iview283.exe" data-title="IrfanView 32 v2.83">
              <span>IrfanView 32 v2.83</span>
              <button class="win-btn" style="font-size:10px;">Установить</button>
            </div>

            <div style="font-family:'Arial Black'; color:#e60000; margin:8px 0 4px 0;">ТЕСТЫ И ДИАГНОСТИКА</div>
            <div class="igroman-soft-item" data-install="soft_u/wintn975_616.exe" data-title="Wintune 97">
              <span>Wintune 97 for Win 98</span>
              <button class="win-btn" style="font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_u/clibench.exe" data-title="CliBench MK II">
              <span>CliBench MK II (CPU & HDD)</span>
              <button class="win-btn" style="font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_u/mon_test.exe" data-title="Nokia Monitor Tester">
              <span>Nokia Monitor Tester</span>
              <button class="win-btn" style="font-size:10px;">Установить</button>
            </div>
          </div>

          <div>
            <div style="font-family:'Arial Black'; color:#e60000; margin-bottom:4px;">АНТИВИРУСЫ</div>
            <div class="igroman-soft-item" data-install="soft_u/v95i319e.exe" data-title="McAfee VirusScan 3.19">
              <span>McAfee VirusScan 3.19</span>
              <button class="win-btn" style="font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_u/tbw95807.exe" data-title="Thunderbyte Anti-Virus">
              <span>Thunderbyte Anti-Virus 8.07</span>
              <button class="win-btn" style="font-size:10px;">Установить</button>
            </div>

            <div style="font-family:'Arial Black'; color:#e60000; margin:8px 0 4px 0;">ДРАЙВЕРА И АРХИВАТОРЫ</div>
            <div class="igroman-soft-item" data-install="soft_u/dx6rus.exe" data-title="DirectX 6.0 Russian">
              <span>DirectX 6.0 (русский пакет)</span>
              <button class="win-btn" style="font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_u/winzip95.exe" data-title="WinZip 6.3">
              <span>WinZip 6.3 для Win 95</span>
              <button class="win-btn" style="font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_u/pd98eval.exe" data-title="PowerDesk Utilities 98">
              <span>PowerDesk Utilities 98</span>
              <button class="win-btn" style="font-size:10px;">Установить</button>
            </div>
            <div class="igroman-soft-item" data-install="soft_u/ft2.exe" data-title="FastTracker 98 v2.09">
              <span>FastTracker 98 v2.09 (XM/MOD Tracker)</span>
              <button class="win-btn" style="font-size:10px;">Установить</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderWinampPage() {
    const skinCardsHtml = this.popularSkins.map(name => `
      <div class="igroman-skin-card" data-skin-name="${name}">
        <img class="igroman-skin-thumb" src="ИгроманияСентябрь1998CD/winamp/skins/${name}.jpg" alt="${name}" onerror="this.style.display='none';">
        <div class="igroman-skin-name" title="${name}">${name}</div>
      </div>
    `).join('');

    return `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <div style="font-family:'Arial Black'; font-size:15px; color:#00a800;">WINAMP И ВСЕ–ВСЕ–ВСЕ</div>
          <div style="display:flex; gap:6px;">
            <button class="win-btn" id="btn_launch_winamp" style="font-weight:bold; padding:2px 8px;">Запустить WinAMP</button>
            <button class="win-btn" data-install="winamp/cdex014.exe" data-title="CDex 0.14 Audio Ripper" style="padding:2px 8px;">CDex 0.14 (Граббер CD)</button>
            <button class="win-btn" id="btn_open_skins_html" style="padding:2px 8px;">Каталог HTML</button>
          </div>
        </div>

        <div style="font-size:11px; margin-bottom:8px; line-height:1.4;">
          Коллекция из <b>159 лучших скинов</b> и 24 плагинов визуализации для культового проигрывателя <b>WinAMP 1.92</b>, а также граббер аудиодисков <b>CDex 0.14</b>. Кликните по скину для предпросмотра и применения:
        </div>

        <div class="igroman-skins-gallery">
          ${skinCardsHtml}
        </div>
      </div>
    `;
  }

  renderSuperbonusPage() {
    return `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div style="font-family:'Arial Black'; font-size:18px; color:#d60093; margin-bottom:8px;">СУПЕРБОНУС: BATTLECRUISER 3000AD</div>
        <div style="display:flex; gap:18px; font-size:12px; line-height:1.6; text-align:justify;">
          <div style="flex:1.2;">
            В качестве специального подарка читателям «Игромании» на этом диске размещена <b>полная коммерческая версия</b> грандиозного космического симулятора <b>Battlecruiser 3000AD</b>!
            <br><br>
            Вы управляете гигантским звездным крейсером длиной в несколько километров, командуя экипажем, истребителями перехвата, наземным десантом и решая судьбы звёздных систем в бескрайней галактике.
            <br><br>
            В комплекте: обновление до версии <b>1.04b</b> и полное иллюстрированное руководство пилота в формате PDF.
          </div>
          <div style="flex:0.8; display:flex; flex-direction:column; gap:8px;">
            <button class="igroman-btn-install" id="btn_install_bc3k" data-file="bc3k/bc3k.exe" data-title="Battlecruiser 3000AD">УСТАНОВИТЬ ИГРУ</button>
            <button class="win-btn" id="btn_patch_bc3k" data-file="bc3k/bc3k104b.exe" data-title="BC3K Patch 1.04b" style="padding:4px;">Установить патч 1.04b</button>
            <button class="win-btn" id="btn_acrobat_bc3k" data-file="bc3k/ar32e301.exe" data-title="Adobe Acrobat 3.01" style="padding:4px;">Установить Acrobat Reader</button>
          </div>
        </div>
      </div>
    `;
  }

  renderExitPage() {
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center;">
        <div style="font-family:'Arial Black'; font-size:24px; color:#e60000; margin-bottom:12px;">ИГРОМАНИЯ #9 (12) 1998</div>
        <div style="font-size:13px; line-height:1.8; max-width:440px;">
          Спасибо за использование компакт-диска журнала «Игромания» за сентябрь 1998 года!
          <br><br>
          Главный редактор: Денис Давыдов<br>
          Редактор CD: Игорь Варнавский, Олег Хажинский<br>
          Оболочка: Macromedia Director Projector<br><br>
          До встречи в следующем номере!
        </div>
        <button class="igroman-btn-install" id="btn_final_exit" style="margin-top:20px;">ВЫЙТИ В WIN</button>
      </div>
    `;
  }

  bindStageEvents(stage) {
    const btnAccept = stage.querySelector('#btn_license_accept');
    const btnDecline = stage.querySelector('#btn_license_decline');
    if (btnAccept) btnAccept.addEventListener('click', () => this.goToPage(2));
    if (btnDecline) btnDecline.addEventListener('click', () => window.winManager.closeWindow(this.winId));

    stage.querySelectorAll('.igroman-demo-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = parseInt(item.getAttribute('data-demo-page'), 10);
        if (!isNaN(page)) {
          this.goToPage(page);
        }
      });
    });

    stage.querySelectorAll('[data-game-launch]').forEach(btn => {
      btn.addEventListener('click', () => this.launchGame(btn.dataset.gameLaunch));
    });

    stage.querySelectorAll('[data-game-setup]').forEach(btn => {
      btn.addEventListener('click', () => this.setupGame(btn.dataset.gameSetup));
    });

    stage.querySelectorAll('[data-shot-launch]').forEach(frame => {
      frame.addEventListener('click', () => {
        const id = frame.dataset.shotLaunch;
        if (window.gameManager && window.gameManager.isInstalled(id)) this.launchGame(id);
        else this.setupGame(id);
      });
    });

    stage.querySelectorAll('[data-shot-next]').forEach(frame => {
      frame.addEventListener('click', () => {
        const id = frame.dataset.shotNext;
        const game = this.games.find(g => g.gameId === id);
        const count = Math.max(1, this.gameInfo(game).shots.length);
        this.shotIndex[id] = ((this.shotIndex[id] || 0) + 1) % count;
        if (window.soundSys) window.soundSys.playClick();
        this.updateView();
      });
    });

    stage.querySelectorAll('.igroman-patch-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-patch-idx'), 10);
        if (!isNaN(idx)) {
          this.selectedPatchIndex = idx;
          if (window.soundSys) window.soundSys.playClick();
          this.updateView();
        }
      });
    });

    const btnInstallPatch = stage.querySelector('#btn_install_patch');
    if (btnInstallPatch) {
      btnInstallPatch.addEventListener('click', () => {
        const file = btnInstallPatch.getAttribute('data-file');
        const title = btnInstallPatch.getAttribute('data-title');
        this.runInstallWizard(`Патч для ${title}`, file);
      });
    }

    stage.querySelectorAll('.igroman-video-item').forEach(item => {
      item.addEventListener('click', () => {
        const file = item.getAttribute('data-video-file');
        const name = item.getAttribute('data-video-name');
        if (window.soundSys) window.soundSys.playClick();
        if (window.appVideoPlayer) {
          window.appVideoPlayer.open(name, file, true);
        }
      });
    });

    stage.querySelectorAll('[data-install]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const file = btn.getAttribute('data-install');
        const title = btn.getAttribute('data-title');
        this.runInstallWizard(title, file);
      });
    });

    const btnLaunchWinamp = stage.querySelector('#btn_launch_winamp');
    if (btnLaunchWinamp) {
      btnLaunchWinamp.addEventListener('click', () => {
        if (window.appWinamp) window.appWinamp.open();
      });
    }

    const btnOpenSkinsHtml = stage.querySelector('#btn_open_skins_html');
    if (btnOpenSkinsHtml) {
      btnOpenSkinsHtml.addEventListener('click', () => {
        if (window.appIE) {
          window.appIE.open('ИгроманияСентябрь1998CD/winamp/skins/_skins.html');
        }
      });
    }

    stage.querySelectorAll('.igroman-skin-card').forEach(card => {
      card.addEventListener('click', () => {
        const skinName = card.getAttribute('data-skin-name');
        if (window.soundSys) window.soundSys.playClick();
        window.winManager.openDialog({
          title: `Скин: ${skinName}`,
          icon: 'winamp',
          message: `<b>Скин для WinAMP: ${skinName}</b><br><br><img src="ИгроманияСентябрь1998CD/winamp/skins/${skinName}.jpg" style="max-width:240px; border:2px solid #000;"><br><br>Установить этот скин в ваш проигрыватель WinAMP?`,
          buttons: [
            {
              text: 'Применить',
              isDefault: true,
              action: () => {
                if (window.appWinamp) {
                  window.appWinamp.open();
                }
              }
            },
            { text: 'Закрыть' }
          ]
        });
      });
    });

    const btnBc3k = stage.querySelector('#btn_install_bc3k');
    if (btnBc3k) {
      btnBc3k.addEventListener('click', () => this.runInstallWizard('Battlecruiser 3000AD', 'bc3k/bc3k.exe'));
    }
    const btnBc3kPatch = stage.querySelector('#btn_patch_bc3k');
    if (btnBc3kPatch) {
      btnBc3kPatch.addEventListener('click', () => this.runInstallWizard('Battlecruiser 3000AD Patch 1.04b', 'bc3k/bc3k104b.exe'));
    }
    const btnBc3kAcrobat = stage.querySelector('#btn_acrobat_bc3k');
    if (btnBc3kAcrobat) {
      btnBc3kAcrobat.addEventListener('click', () => this.runInstallWizard('Adobe Acrobat Reader 3.01', 'bc3k/ar32e301.exe'));
    }

    const btnFinalExit = stage.querySelector('#btn_final_exit');
    if (btnFinalExit) {
      btnFinalExit.addEventListener('click', () => window.winManager.closeWindow(this.winId));
    }
  }

  launchInstalledSoft(exePath) {
    const p = String(exePath || '').toLowerCase();
    if (p.includes('wintn975_616')) {
      if (window.appWintune) window.appWintune.open('wintune');
      return true;
    }
    if (p.includes('clibench')) {
      if (window.appWintune) window.appWintune.open('clibench');
      return true;
    }
    if (p.includes('mon_test')) {
      if (window.appMonTest) window.appMonTest.open();
      return true;
    }
    if (p.includes('cdex014')) {
      if (window.appCDex) window.appCDex.open();
      return true;
    }
    if (p.includes('acdc3223') || p.includes('acdsee')) {
      if (window.appACDSee) window.appACDSee.open();
      return true;
    }
    if (p.includes('ar32e301') || p.includes('acrobat')) {
      if (window.appAcrobat) window.appAcrobat.open('BC3000AD_MANUAL.PDF');
      return true;
    }
    if (p.includes('mirc32') || p.includes('mirc')) {
      if (window.appMIRC) window.appMIRC.open();
      return true;
    }
    if (p.includes('ft2') || p.includes('fasttracker')) {
      if (window.appFastTracker) window.appFastTracker.open('ENLIGHT98.XM');
      return true;
    }
    return false;
  }

  runInstallWizard(appName, exePath) {
    if (window.soundSys) window.soundSys.playClick();

    let percent = 0;
    let finished = false;
    const dialogId = 'dlg_install_' + Date.now();

    const dlg = window.winManager.createWindow({
      id: dialogId,
      title: `Установка — ${appName}`,
      icon: 'setup-installer',
      width: 420,
      height: 240,
      content: `
        <div style="padding:15px; display:flex; flex-direction:column; height:100%; box-sizing:border-box; justify-content:space-between;">
          <div style="display:flex; gap:12px;">
            <div style="width:36px; height:36px;">${Icons['setup-installer'] || Icons['file-exe']}</div>
            <div>
              <div style="font-weight:bold; font-size:12px; margin-bottom:4px;">Мастер установки программного пакета</div>
              <div style="font-size:11px; color:#444;" id="${dialogId}_status">Копирование файлов: D:\\${exePath}...</div>
            </div>
          </div>

          <div style="margin:12px 0;">
            <div class="retro-progress-bar" style="height:20px; border:2px inset #ffffff; background:#c0c0c0; position:relative; overflow:hidden;">
              <div id="${dialogId}_bar" style="width:0%; height:100%; background:#000080; transition:width 0.1s linear;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:10px; margin-top:3px;">
              <span id="${dialogId}_percent">0%</span>
              <span>CD-ROM Drive 32X</span>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="win-btn" id="${dialogId}_btn_cancel" style="padding:3px 14px;">Отмена</button>
          </div>
        </div>
      `
    });

    const statusEl = dlg.element.querySelector(`#${dialogId}_status`);
    const barEl = dlg.element.querySelector(`#${dialogId}_bar`);
    const percentEl = dlg.element.querySelector(`#${dialogId}_percent`);
    const btnCancel = dlg.element.querySelector(`#${dialogId}_btn_cancel`);

    let cancelled = false;
    btnCancel.addEventListener('click', () => {
      cancelled = true;
      window.winManager.closeWindow(dialogId);
      if (finished) {
        this.launchInstalledSoft(exePath);
      }
    });

    const interval = setInterval(() => {
      if (cancelled) {
        clearInterval(interval);
        return;
      }

      percent += Math.floor(Math.random() * 15) + 10;
      if (percent >= 100) {
        percent = 100;
        finished = true;
        clearInterval(interval);
        barEl.style.width = '100%';
        percentEl.textContent = '100%';
        statusEl.textContent = 'Установка успешно завершена!';
        btnCancel.textContent = 'Запустить / Готово';
        btnCancel.focus();

        if (window.soundSys) {
          window.soundSys.playAsterisk();
        }
      } else {
        barEl.style.width = percent + '%';
        percentEl.textContent = percent + '%';
      }
    }, 120);
  }
}

window.appIgroman = new AppIgroman();
