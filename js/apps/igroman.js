/**
 * ИГРОМАНИЯ (Сентябрь 1998) - CD Multimedia Shell
 * Pixel-accurate web recreation of Macromedia Director 5/6 projector
 */
class AppIgroman {
  constructor() {
    this.currentPage = 2; // Default to Содержание (Table of Contents)
    this.selectedPatchIndex = 1; // Default to Fallout patch (matches screenshot 3)
    this.selectedSoftIndex = 0;
    this.winId = 'app_igroman';
    this.windowRef = null;

    if (window.gameManager) {
      window.gameManager.addListener(() => {
        if (this.currentPage === 10 || this.currentPage === 18) this.updateView();
      });
    }

    // Database of 16 demo games (Pages 4 to 19, Page 3 is Demo List)
    this.games = [
      {
        page: 4,
        title: 'PANZER COMMANDER',
        dev: 'Ultimation Inc.',
        pub: 'SSI',
        genre: 'симулятор танка',
        req: 'Pentium-133, 16 MB RAM, видео SVGA с 2MB, мышь, Win 95, Необходим DirectX 5.0',
        desc: 'Почувствуйте себя внутри стальной громадины времён Второй мировой войны! Исторически достоверные баллистика, бронирование, прицельные сетки и кампания за танковые дивизии СССР, США, Германии и Британии.',
        file: 'demo/pcdemo.exe',
        previewColor: '#3a3a3a'
      },
      {
        page: 5,
        title: 'NIGHTMARE CREATURES',
        dev: 'Kalisto',
        pub: 'Activision',
        genre: '3D action + fighting',
        req: 'Pentium-133, 16 MB RAM, видео SVGA с 1MB, мышь, Win 95',
        desc: 'Ужас бродит по ночным туманным улицам Лондона 1834 года. Безумный алхимик Адам Кроули выпустил полчища мутантов и зомби. Вооружитесь мечом или пистолями и очистите город от чудовищ в захватывающем слэшере!',
        file: 'demo/nic_demo.exe',
        previewColor: '#140152'
      },
      {
        page: 6,
        title: 'NEOPHYTE: KOPLIO’S STORY',
        dev: 'Alien Software Inc.',
        pub: 'Alien Software Inc.',
        genre: 'adventure',
        req: 'Pentium-60, 8 MB RAM, Win 95',
        desc: 'Вы – Коплио (Koplio), юный послушник, живущий в отдалённом монастыре. Спокойно жить ему не суждено: раскрывая древние тайны ордена, герою придётся исследовать подземелья, решать головоломки и сражаться с монстрами.',
        file: 'demo/kopinst.exe',
        previewColor: '#2b2d42'
      },
      {
        page: 7,
        title: 'ADDICTION PINBALL',
        dev: 'Team17',
        pub: 'MicroProse',
        genre: 'пинбол',
        req: 'Pentium-75, 16 MB RAM, видео 1MB, Win 95. Необходим DirectX 5.0',
        desc: 'Очередной пинбол, создатели которого постарались соблюсти все законы физики в поведении шарика и деталей стола. Два детализированных стола с множеством бонусов, секретных зон и великолепным звуковым сопровождением.',
        file: 'demo/addictiondemo.exe',
        previewColor: '#2b1055'
      },
      {
        page: 8,
        title: 'ULTIM@TE RACE PRO',
        dev: 'Kalisto',
        pub: 'MicroProse',
        genre: 'автогонки',
        req: 'Pentium-133, 16 MB RAM, видео SVGA с 1MB, Win 95, Необходим DirectX 5.0',
        desc: 'Демо-версия динамичных кольцевых гонок, в которой вам предлагаются две мощные спортивные машины и семь разнообразных трасс с переменными погодными условиями и ночными заездами.',
        file: 'demo/demour-nointro.exe',
        previewColor: '#800000'
      },
      {
        page: 9,
        title: 'SID MEIER’S GETTYSBURG!',
        dev: 'Firaxis Games',
        pub: 'Origin Systems',
        genre: 'real-time wargame',
        req: 'Pentium-90, 16 MB RAM, видео SVGA, мышь, Win 95, Необходим DirectX 5.0',
        desc: 'Данное демо известной исторической стратегии Сида Мейера позволит вам сыграть за северян или южан в величайшей битве Гражданской войны в США при Геттисберге. Полное тактическое управление пехотой, кавалерией и артиллерией.',
        file: 'demo/smgdemo_c.exe',
        previewColor: '#1c3144'
      },
      {
        page: 10,
        title: 'BURNOUT: CHAMPIONSHIP DRAG RACING',
        dev: 'Bethesda Softworks',
        pub: 'Bethesda Softworks',
        genre: 'автогонки',
        req: 'Pentium-75, 16 MB RAM, видео SVGA с 1MB, DOS или Win 95, Необходим DirectX 5.0',
        desc: 'Какой же русский не любит быстрой езды? Вот мы и предлагаем вам поучаствовать в настоящих соревнованиях по дрэг-рейсингу на бешеной скорости в четверть мили. Настройка двигателя, переключение передач и жжёная резина!',
        file: 'demo/burndemo.exe',
        previewColor: '#333333',
        isBurnout: true
      },
      {
        page: 11,
        title: 'SIN',
        dev: 'Ritual Entertainment',
        pub: 'Activision',
        genre: '3D-action',
        req: 'Pentium-133, 32 Mb RAM, Win 95, рекомендуется 3Dfx',
        desc: 'Игра, которую ждут очень многие! Игра, которая должна стать новым словом в жанре 3D-action. Полковник Блейд вступает в беспощадную войну с корпорацией SinTEK во главе с коварной Элексис Синклер. Реалистичные повреждения и интерактивное окружение.',
        file: 'demo/sin_demo.exe',
        previewColor: '#0a192f'
      },
      {
        page: 12,
        title: 'KKnD 2: KROSSFIRE',
        dev: 'Beam Software',
        pub: 'Melbourne House',
        genre: 'real-time strategy',
        req: 'Pentium-133, 16MB RAM, Win 95, DirectX',
        desc: '100 лет прошло после ядерной войны на Земле. 40 лет прошло после яростных битв, в которых сошлись Выжившие, Мутанты и киборги 9-й серии. Бескомпромиссная RTS старой школы с массивными штурмами и безумным арсеналом.',
        file: 'demo/kknd2_demoall.exe',
        previewColor: '#4a2810'
      },
      {
        page: 13,
        title: 'CROC: LEGEND OF THE GOBBOS',
        dev: 'Argonaut Software',
        pub: 'Fox Interactive',
        genre: '3D платформер',
        req: 'Pentium-133, 16 MB RAM, видео SVGA с 1MB, Win 95',
        desc: 'Попробуйте помочь симпатяге-крокодилу по имени Крок спасти его маленьких друзей-Gobbos от коварного злодея Барона Данте. Красочный трёхмерный платформер с отличной анимацией, прыжками и секретами.',
        file: 'demo/crocdem6.exe',
        previewColor: '#1a472a'
      },
      {
        page: 14,
        title: 'MICROSLOP GOLF 1998 EDITION',
        dev: 'Friendly Software',
        pub: 'Microslop',
        genre: 'спортивный имитатор',
        req: 'Pentium-90, 16 MB RAM, видео SVGA с 2MB, мышь, Win 95; Win NT',
        desc: 'Симуляторы гольфа пользуются в США огромной популярностью. Почему? Установите эту демонстрационную версию и прочувствуйте потрясающую медитативную атмосферу, физику ветра и идеальные газоны Президентского кубка.',
        file: 'demo/msgolf98.exe',
        previewColor: '#2d6a4f'
      },
      {
        page: 15,
        title: 'WORLD CUP 98',
        dev: 'EA Sports',
        pub: 'EA Sports',
        genre: 'спортивный симулятор',
        req: 'Pentium-100, 16 MB RAM, видео SVGA с 1MB, Win 95, Необходим DirectX 5.0',
        desc: 'Игра EA Sports World Cup 98 дарит вам ещё одну возможность пережить все волнения только что завершившегося во Франции мундиаля! Реалистичные стадионы, официальный саундтрек Chumbawamba и 3D-анимация футболистов.',
        file: 'demo/worldcup98.exe',
        previewColor: '#1d3557'
      },
      {
        page: 16,
        title: 'ПОЛНАЯ ТРУБА',
        dev: 'Никита',
        pub: 'Никита',
        genre: 'квест',
        req: 'Pentium-100, 16 MB RAM, видео SVGA с 1MB, Win 95, Необходим DirectX 5.0',
        desc: 'Один уровень из необычных приключений необычного существа в каком-то необычном месте. Вашего героя окружают необычные персонажи, которые заняты своими необычными делами.',
        file: 'demo/pipe.exe',
        isPolnayaTruba: true,
        previewColor: '#5c544d'
      },
      {
        page: 17,
        title: 'WARGAMES',
        dev: 'MGM Interactive',
        pub: 'MGM Interactive',
        genre: 'real-time strategy',
        req: 'Pentium-133, 16 MB RAM, Win 95, DirectX 5.0, рекомендуется 3Dfx',
        desc: 'Полностью трёхмерная стратегия реального времени по мотивам культового фильма Военные игры. Вы можете вращать карту, приближать камеру к любому танку и координировать действия армии против суперкомпьютера WOPR.',
        file: 'demo/wargames/setup.exe',
        previewColor: '#3d348b'
      },
      {
        page: 18,
        title: 'NHL \'98',
        dev: 'EA Sports',
        pub: 'EA Sports',
        genre: 'спортивный симулятор',
        req: 'Pentium-90, 16 MB RAM, видео SVGA с 1MB, мышь, Win 95',
        desc: 'Хоккей – игра увлекательная, но вот только на коньках кататься умеют далеко не все. С NHL 98 от EA Sports вы получите лучший хоккейный симулятор с реальными составами команд НХЛ, силовыми приёмами и комментаторами.',
        file: 'demo/nhl98demo.exe',
        isNhl98: true,
        previewColor: '#0b2545'
      },
      {
        page: 19,
        title: 'LONGBOW 2',
        dev: 'Jane\'s Combat Simulations',
        pub: 'Origin Systems',
        genre: 'симулятор вертолета',
        req: 'Pentium-133, 16 MB RAM, видео SVGA с 2MB, мышь, Win 95, Необходим DirectX 5.0',
        desc: 'Продолжение легендарного симулятора Jane\'s AH-64D Longbow. В новом Longbow 2 вы снова окажетесь за штурвалом боевого винтокрыла, управляя передовыми системами наведения, РЛС и ПТУР Hellfire в масштабных ночных операциях.',
        file: 'demo/lb2demo.exe',
        previewColor: '#2b3a2a'
      }
    ];

    // Database of 24 patches (Page 20)
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

    // Database of 6 video trailers (Page 21)
    this.videos = [
      { name: 'Ultima: Ascension (Origin)', sub: '320х240, 58 сек', file: 'content/igromania/ascension.mp4' },
      { name: 'Heretic II (Activision)', sub: '160х120, 2 мин 31 сек', file: 'content/igromania/heretic.mp4' },
      { name: 'Metro City (Melbourne House)', sub: '320х240, 25 сек', file: 'content/igromania/metro20.mp4' },
      { name: 'Alien Vs Predator (Fox Interactive)', sub: '320х240, 54 сек', file: 'content/igromania/AVPRED.mp4' },
      { name: 'Turok 2 (Acclaim)', sub: '320х240, 42 сек', file: 'content/igromania/TUROK2.mp4' },
      { name: 'Blackstone Chronicles (Mindscape)', sub: '320х240, 11 сек', file: 'content/igromania/Blckstn.mp4' }
    ];

    // Database of popular Winamp skins
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

  getThemeClass(page) {
    if (page === 1 || page === 2) return 'theme-red';
    if (page >= 3 && page <= 21) return 'theme-blue';
    if (page >= 22 && page <= 24) return 'theme-green';
    return 'theme-purple';
  }

  getSectionTitle(page) {
    if (page === 1) return 'ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ';
    if (page === 2) return 'СОДЕРЖАНИЕ';
    if (page >= 3 && page <= 21) return 'ИГРАЕМ';
    if (page >= 22 && page <= 24) return 'ВООРУЖАЕМСЯ';
    if (page === 25) return 'СУПЕРБОНУС';
    return 'ВЫХОД';
  }

  buildWindowHTML() {
    return `
      <div class="igroman-window ${this.getThemeClass(this.currentPage)}" id="igroman_container">
        <!-- Header -->
        <div class="igroman-header" id="igroman_header">
          <div class="igroman-watermark">ИГРОМАНИЯ</div>
          <div class="igroman-target-box">
            <div class="igroman-target-color-block"></div>
            <svg class="igroman-target-svg" viewBox="0 0 100 100" fill="none">
              <!-- Target circles -->
              <circle cx="50" cy="50" r="46" stroke="#ffffff" stroke-width="1.8" opacity="0.6"/>
              <circle cx="50" cy="50" r="36" stroke="#ffffff" stroke-width="1.8"/>
              <circle cx="50" cy="50" r="26" stroke="#ffffff" stroke-width="1.8"/>
              <circle cx="50" cy="50" r="16" stroke="#ffffff" stroke-width="2"/>
              <!-- Crosshair lines -->
              <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" stroke-width="2"/>
              <line x1="50" y1="0" x2="50" y2="100" stroke="#ffffff" stroke-width="2"/>
              <circle cx="50" cy="50" r="4.5" fill="#000000"/>
              <!-- Crosshair center notch -->
              <rect x="44" y="44" width="12" height="12" stroke="#000000" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <div class="igroman-header-title-wrap">
            <div class="igroman-header-title" id="igroman_header_title">${this.getSectionTitle(this.currentPage)}</div>
          </div>
        </div>

        <!-- Body Area -->
        <div class="igroman-body">
          <!-- Left Sidebar Menu -->
          <div class="igroman-sidebar" id="igroman_sidebar">
            <div class="igroman-nav-group">
              <div class="igroman-nav-title ${this.currentPage === 2 ? 'active' : ''}" data-nav="2">СОДЕРЖАНИЕ</div>
            </div>

            <div class="igroman-nav-group">
              <div class="igroman-nav-title ${this.currentPage >= 3 && this.currentPage <= 21 ? 'active' : ''}" data-nav="3">ИГРАЕМ</div>
              <div class="igroman-nav-subs">
                <div class="igroman-nav-subitem ${this.currentPage >= 3 && this.currentPage <= 19 ? 'active' : ''}" data-nav="3">демоверсии</div>
                <div class="igroman-nav-subitem ${this.currentPage === 20 ? 'active' : ''}" data-nav="20">патчи</div>
                <div class="igroman-nav-subitem ${this.currentPage === 21 ? 'active' : ''}" data-nav="21">видеоролики</div>
              </div>
            </div>

            <div class="igroman-nav-group">
              <div class="igroman-nav-title ${this.currentPage >= 22 && this.currentPage <= 24 ? 'active' : ''}" data-nav="22">ВООРУЖАЕМСЯ</div>
              <div class="igroman-nav-subs">
                <div class="igroman-nav-subitem ${this.currentPage === 22 ? 'active' : ''}" data-nav="22">программы для интернет</div>
                <div class="igroman-nav-subitem ${this.currentPage === 23 ? 'active' : ''}" data-nav="23">программы для всех</div>
                <div class="igroman-nav-subitem ${this.currentPage === 24 ? 'active' : ''}" data-nav="24">WinAMP и все-все-все</div>
              </div>
            </div>

            <div class="igroman-nav-group">
              <div class="igroman-nav-title ${this.currentPage === 25 ? 'active' : ''}" data-nav="25">СУПЕРБОНУС</div>
            </div>
          </div>

          <!-- Main Stage Content -->
          <div class="igroman-stage" id="igroman_stage">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Footer Bar -->
        <div class="igroman-footer">
          <div class="igroman-page-num-box" id="igroman_page_num">${this.currentPage}</div>
          <div class="igroman-footer-line"></div>
          <div class="igroman-footer-actions">
            <div class="igroman-btn-exit" id="igroman_btn_exit">ВЫХОД</div>
            <div class="igroman-arrow-btns">
              <div class="igroman-btn-arrow ${this.currentPage <= 1 ? 'disabled' : ''}" id="igroman_btn_prev">&#9668;</div>
              <div class="igroman-btn-arrow ${this.currentPage >= 26 ? 'disabled' : ''}" id="igroman_btn_next">&#9658;</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(win) {
    const el = win.element;

    // Sidebar navigation
    el.addEventListener('click', (e) => {
      const navTarget = e.target.closest('[data-nav]');
      if (navTarget) {
        const pageNum = parseInt(navTarget.getAttribute('data-nav'), 10);
        if (!isNaN(pageNum)) {
          this.goToPage(pageNum);
        }
      }
    });

    // Arrow buttons
    const btnPrev = el.querySelector('#igroman_btn_prev');
    const btnNext = el.querySelector('#igroman_btn_next');
    const btnExit = el.querySelector('#igroman_btn_exit');

    btnPrev.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.goToPage(this.currentPage - 1);
      }
    });

    btnNext.addEventListener('click', () => {
      if (this.currentPage < 26) {
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
    if (num > 26) num = 26;
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

    // Update Theme
    container.className = `igroman-window ${this.getThemeClass(this.currentPage)}`;
    headerTitle.textContent = this.getSectionTitle(this.currentPage);
    pageNumEl.textContent = this.currentPage;

    btnPrev.classList.toggle('disabled', this.currentPage <= 1);
    btnNext.classList.toggle('disabled', this.currentPage >= 26);

    // Update Sidebar Active state
    el.querySelectorAll('.igroman-nav-title, .igroman-nav-subitem').forEach(item => {
      item.classList.remove('active');
    });

    if (this.currentPage === 2) {
      const t = el.querySelector('.igroman-nav-title[data-nav="2"]');
      if (t) t.classList.add('active');
    } else if (this.currentPage >= 3 && this.currentPage <= 21) {
      const t = el.querySelector('.igroman-nav-title[data-nav="3"]');
      if (t) t.classList.add('active');
      if (this.currentPage >= 3 && this.currentPage <= 19) {
        const sub = el.querySelector('.igroman-nav-subitem[data-nav="3"]');
        if (sub) sub.classList.add('active');
      } else if (this.currentPage === 20) {
        const sub = el.querySelector('.igroman-nav-subitem[data-nav="20"]');
        if (sub) sub.classList.add('active');
      } else if (this.currentPage === 21) {
        const sub = el.querySelector('.igroman-nav-subitem[data-nav="21"]');
        if (sub) sub.classList.add('active');
      }
    } else if (this.currentPage >= 22 && this.currentPage <= 24) {
      const t = el.querySelector('.igroman-nav-title[data-nav="22"]');
      if (t) t.classList.add('active');
      if (this.currentPage === 22) {
        const sub = el.querySelector('.igroman-nav-subitem[data-nav="22"]');
        if (sub) sub.classList.add('active');
      } else if (this.currentPage === 23) {
        const sub = el.querySelector('.igroman-nav-subitem[data-nav="23"]');
        if (sub) sub.classList.add('active');
      } else if (this.currentPage === 24) {
        const sub = el.querySelector('.igroman-nav-subitem[data-nav="24"]');
        if (sub) sub.classList.add('active');
      }
    } else if (this.currentPage === 25) {
      const t = el.querySelector('.igroman-nav-title[data-nav="25"]');
      if (t) t.classList.add('active');
    }

    // Render Stage Body
    stage.innerHTML = this.renderStageContent();
    this.bindStageEvents(stage);
  }

  renderStageContent() {
    switch (this.currentPage) {
      case 1:
        return this.renderLicensePage();
      case 2:
        return this.renderContentsPage();
      case 3:
        return this.renderDemoListPage();
      case 20:
        return this.renderPatchesPage();
      case 21:
        return this.renderVideosPage();
      case 22:
        return this.renderSoftInternetPage();
      case 23:
        return this.renderSoftAllPage();
      case 24:
        return this.renderWinampPage();
      case 25:
        return this.renderSuperbonusPage();
      case 26:
        return this.renderExitPage();
      default:
        return this.renderGamePage(this.currentPage);
    }
  }

  // Page 1: Лицензионное соглашение
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

  // Page 2: Содержание (Screenshot 1)
  renderContentsPage() {
    return `
      <div class="igroman-toc-container">
        <!-- Section: ИГРАЕМ (3) -->
        <div class="igroman-toc-section">
          <div class="igroman-toc-header blue" data-nav="3">
            <div class="igroman-toc-title">ИГРАЕМ</div>
            <div class="igroman-toc-page-num">3</div>
          </div>
          <div class="igroman-toc-items">
            <div class="igroman-toc-item" data-nav="3">ДЕМОВЕРСИИ</div>
            <div class="igroman-toc-item" data-nav="20">ПАТЧИ</div>
            <div class="igroman-toc-item" data-nav="21">ВИДЕОРОЛИКИ</div>
          </div>
        </div>

        <!-- Section: ВООРУЖАЕМСЯ (22) -->
        <div class="igroman-toc-section">
          <div class="igroman-toc-header green" data-nav="22">
            <div class="igroman-toc-title">ВООРУЖАЕМСЯ</div>
            <div class="igroman-toc-page-num">22</div>
          </div>
          <div class="igroman-toc-items">
            <div class="igroman-toc-item" data-nav="22">ПРОГРАММЫ ДЛЯ ИНТЕРНЕТ</div>
            <div class="igroman-toc-item" data-nav="23">ПРОГРАММЫ ДЛЯ ВСЕХ</div>
            <div class="igroman-toc-item" data-nav="24">WINAMP И ВСЕ–ВСЕ–ВСЕ</div>
          </div>
        </div>

        <!-- Section: СУПЕРБОНУС (25) -->
        <div class="igroman-toc-section">
          <div class="igroman-toc-header purple" data-nav="25">
            <div class="igroman-toc-title">СУПЕРБОНУС</div>
            <div class="igroman-toc-page-num">25</div>
          </div>
          <div class="igroman-toc-items">
            <div class="igroman-toc-item" data-nav="25">BATTLECRUISER 3000</div>
          </div>
        </div>
      </div>
    `;
  }

  // Page 3: Список демоверсий (Screenshot media_1788550588341.png)
  renderDemoListPage() {
    const listHtml = this.games.map(g => `
      <div class="igroman-demo-list-item" data-demo-page="${g.page}">
        ${g.title}
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

  // Pages 4..19: Demo Games (Screenshot 2 for Page 16)
  renderGamePage(pageNum) {
    const game = this.games.find(g => g.page === pageNum) || this.games[0];

    // For Polnaya Truba (Page 16), render the authentic scene
    let screenshotHtml = '';
    if (game.isPolnayaTruba) {
      screenshotHtml = `
        <svg viewBox="0 0 190 130" width="190" height="130" style="background:#5c544d;">
          <!-- Concrete/metal wall -->
          <rect width="190" height="130" fill="#665f57"/>
          <line x1="0" y1="110" x2="190" y2="110" stroke="#333" stroke-width="1.5"/>
          <rect y="110" width="190" height="20" fill="#4d463f"/>
          <!-- Pipe details -->
          <rect x="10" y="20" width="16" height="85" fill="#3a332c"/>
          <rect x="165" y="15" width="18" height="90" fill="#3a332c"/>
          <!-- Wall Gauge & Indicator -->
          <circle cx="95" cy="45" r="14" fill="#332c25" stroke="#776e64" stroke-width="2"/>
          <circle cx="120" cy="42" r="4.5" fill="#ff2200"/>
          <!-- 02-107 text on wall -->
          <text x="100" y="80" font-family="'Courier New', monospace" font-weight="bold" font-size="12" fill="#201a14">02-107</text>
          <!-- Glass jar with spring -->
          <rect x="25" y="60" width="22" height="30" rx="3" fill="#88bbcc" opacity="0.75" stroke="#447788"/>
          <path d="M30 90 Q36 93 42 90 Q36 97 30 100 Q42 105 30 110" stroke="#111" stroke-width="2" fill="none"/>
          <!-- Seesaw and creatures -->
          <line x1="75" y1="108" x2="135" y2="98" stroke="#332211" stroke-width="3"/>
          <circle cx="105" cy="106" r="3" fill="#000"/>
          <!-- Little alien guy -->
          <ellipse cx="82" cy="100" rx="4" ry="7" fill="#e0e8d0"/>
          <circle cx="82" cy="91" r="3.5" fill="#e0e8d0"/>
          <!-- Slime puddle -->
          <ellipse cx="130" cy="112" rx="14" ry="4" fill="#6699aa" opacity="0.6"/>
          <!-- Funny character -->
          <circle cx="150" cy="102" r="7" fill="#ee9988"/>
          <ellipse cx="150" cy="93" rx="5" ry="4" fill="#ee9988"/>
        </svg>
      `;
    } else if (game.isBurnout) {
      screenshotHtml = `
        <svg viewBox="0 0 190 130" width="190" height="130" style="background:#0a0f18; cursor:pointer;" id="burnout_screenshot_click" title="Нажмите для запуска демо-версии">
          <defs>
            <linearGradient id="bo_sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0a192f"/>
              <stop offset="60%" stop-color="#d35400"/>
              <stop offset="100%" stop-color="#e67e22"/>
            </linearGradient>
          </defs>
          <!-- Dusk Sky -->
          <rect width="190" height="52" fill="url(#bo_sky)"/>
          <line x1="0" y1="52" x2="190" y2="52" stroke="#333" stroke-width="1.5"/>
          <!-- 3D Track Perspective -->
          <polygon points="15,130 175,130 110,52 80,52" fill="#1e1e24"/>
          <line x1="95" y1="52" x2="95" y2="130" stroke="#f1c40f" stroke-width="2"/>
          <!-- Christmas Tree -->
          <rect x="93.5" y="22" width="3" height="38" fill="#f1c40f"/>
          <rect x="89" y="24" width="12" height="30" fill="#111"/>
          <!-- Yellow Bulbs -->
          <circle cx="92" cy="27" r="1.3" fill="#fff"/>
          <circle cx="98" cy="27" r="1.3" fill="#fff"/>
          <circle cx="92" cy="32" r="1.3" fill="#f39c12"/>
          <circle cx="98" cy="32" r="1.3" fill="#f39c12"/>
          <circle cx="92" cy="37" r="1.3" fill="#f39c12"/>
          <circle cx="98" cy="37" r="1.3" fill="#f39c12"/>
          <circle cx="92" cy="43" r="1.6" fill="#2ecc71"/>
          <circle cx="98" cy="43" r="1.6" fill="#2ecc71"/>
          <!-- Red Muscle Dragster -->
          <rect x="42" y="84" width="40" height="22" rx="3" fill="#c0392b" stroke="#000" stroke-width="1"/>
          <rect x="36" y="86" width="9" height="18" fill="#111" rx="2"/>
          <rect x="76" y="91" width="7" height="11" fill="#111" rx="2"/>
          <rect x="52" y="77" width="8" height="8" fill="#ecf0f1"/>
          <polygon points="50,77 62,77 64,73 48,73" fill="#e74c3c"/>
          <!-- Smoke from Burnout -->
          <circle cx="36" cy="96" r="8" fill="#ecf0f1" opacity="0.75"/>
          <circle cx="27" cy="90" r="11" fill="#ecf0f1" opacity="0.6"/>
          <circle cx="20" cy="83" r="8" fill="#ecf0f1" opacity="0.4"/>
          <!-- Blue Rival Car -->
          <rect x="114" y="78" width="34" height="18" rx="2" fill="#2980b9" stroke="#000" stroke-width="1"/>
          <rect x="142" y="80" width="7" height="13" fill="#111"/>
          <rect x="110" y="82" width="7" height="11" fill="#111"/>
          <!-- Header Banner -->
          <rect x="4" y="4" width="82" height="12" fill="#cc0000" rx="1"/>
          <text x="45" y="13" fill="#ffff00" font-family="'Arial Black'" font-size="7" text-anchor="middle">HOT ROD RACING</text>
        </svg>
      `;
    } else if (game.isNhl98) {
      screenshotHtml = `
        <svg viewBox="0 0 190 130" width="190" height="130" style="background:#07192f; cursor:pointer;" id="nhl98_screenshot_click" title="Нажмите для запуска NHL '98">
          <defs>
            <linearGradient id="nhl_ice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#d6edfc"/>
              <stop offset="50%" stop-color="#eef7fd"/>
              <stop offset="100%" stop-color="#c5e3f6"/>
            </linearGradient>
          </defs>
          <!-- Stadium Rink Background -->
          <rect width="190" height="130" fill="#07192f"/>
          <!-- Hockey Ice Rink -->
          <rect x="15" y="15" width="160" height="100" rx="18" fill="url(#nhl_ice)" stroke="#3a6073" stroke-width="2"/>
          <!-- Red Center Line -->
          <line x1="95" y1="15" x2="95" y2="115" stroke="#cc2222" stroke-width="2"/>
          <!-- Blue Lines -->
          <line x1="55" y1="15" x2="55" y2="115" stroke="#1d4ed8" stroke-width="2"/>
          <line x1="135" y1="15" x2="135" y2="115" stroke="#1d4ed8" stroke-width="2"/>
          <!-- Center Face-off Circle -->
          <circle cx="95" cy="65" r="18" fill="none" stroke="#1d4ed8" stroke-width="1.5"/>
          <circle cx="95" cy="65" r="3" fill="#1d4ed8"/>
          <!-- Goal Creases -->
          <path d="M 23 57 A 8 8 0 0 1 23 73 Z" fill="#93c5fd" stroke="#cc2222" stroke-width="1.5"/>
          <line x1="23" y1="25" x2="23" y2="105" stroke="#cc2222" stroke-width="1.5"/>
          <path d="M 167 57 A 8 8 0 0 0 167 73 Z" fill="#93c5fd" stroke="#cc2222" stroke-width="1.5"/>
          <line x1="167" y1="25" x2="167" y2="105" stroke="#cc2222" stroke-width="1.5"/>
          <!-- Faceoff Spots -->
          <circle cx="40" cy="40" r="1.5" fill="#cc2222"/>
          <circle cx="40" cy="90" r="1.5" fill="#cc2222"/>
          <circle cx="150" cy="40" r="1.5" fill="#cc2222"/>
          <circle cx="150" cy="90" r="1.5" fill="#cc2222"/>
          <!-- EA SPORTS Header Banner -->
          <rect x="25" y="6" width="140" height="14" fill="#000066" rx="2"/>
          <text x="95" y="16" fill="#ffff00" font-family="'Arial Black', Impact, sans-serif" font-size="8" font-weight="bold" text-anchor="middle">EA SPORTS • NHL '98</text>
          <!-- Puck -->
          <ellipse cx="98" cy="67" rx="3" ry="1.8" fill="#111111"/>
        </svg>
      `;
    } else {
      screenshotHtml = `
        <svg viewBox="0 0 190 130" width="190" height="130" style="background:${game.previewColor || '#000000'};">
          <rect width="190" height="130" fill="${game.previewColor || '#111111'}"/>
          <circle cx="95" cy="65" r="35" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
          <line x1="20" y1="65" x2="170" y2="65" stroke="rgba(255,255,255,0.15)"/>
          <line x1="95" y1="15" x2="95" y2="115" stroke="rgba(255,255,255,0.15)"/>
          <text x="95" y="68" font-family="'Arial Black'" font-size="10" fill="#ffffff" text-anchor="middle" opacity="0.85">${game.title.slice(0, 20)}</text>
          <text x="95" y="85" font-family="'Tahoma'" font-size="9" fill="#00ffff" text-anchor="middle" opacity="0.8">1998 DEMO PREVIEW</text>
        </svg>
      `;
    }

    const isBurnoutInstalled = (game.isBurnout && window.gameManager && window.gameManager.isInstalled('burnout'));
    const isHockeyInstalled = (game.isNhl98 && window.gameManager && window.gameManager.isInstalled('hockey'));

    let actionBtnHtml = '';
    if (isBurnoutInstalled) {
      actionBtnHtml = `
        <button class="igroman-btn-install" id="btn_launch_burnout" style="background:#008800;">ЗАПУСТИТЬ ИГРУ</button>
        <button class="win-btn" id="btn_reinstall_burnout" data-file="${game.file}" data-title="${game.title}" style="padding:4px 10px; font-size:11px;">Переустановить</button>
      `;
    } else if (isHockeyInstalled) {
      actionBtnHtml = `
        <button class="igroman-btn-install" id="btn_launch_hockey" style="background:#008800;">ЗАПУСТИТЬ ИГРУ</button>
        <button class="win-btn" id="btn_reinstall_hockey" data-file="${game.file}" data-title="${game.title}" style="padding:4px 10px; font-size:11px;">Переустановить</button>
      `;
    } else {
      actionBtnHtml = `
        <button class="igroman-btn-install" id="btn_install_game" data-file="${game.file}" data-title="${game.title}">УСТАНОВИТЬ ИГРУ</button>
      `;
    }

    return `
      <div class="igroman-game-container">
        <div class="igroman-game-header-title">${game.title}</div>
        <div class="igroman-game-cols">
          <!-- Left Column: Description -->
          <div class="igroman-game-left-col">
            ${game.desc}
          </div>

          <!-- Right Column: Specs & Screenshot -->
          <div class="igroman-game-right-col">
            <div class="igroman-game-specs">
              <div><b>Разработчик:</b> ${game.dev}</div>
              <div><b>Издатель:</b> ${game.pub}</div>
              <div><b>Жанр:</b> ${game.genre}</div>
              <div><b>Системные требования:</b></div>
              <div style="margin-left:4px;">${game.req}</div>
            </div>

            <div class="igroman-game-screenshot-frame">
              ${screenshotHtml}
            </div>
          </div>
        </div>

        <div class="igroman-game-action-wrap" style="display:flex; gap:10px;">
          ${actionBtnHtml}
        </div>
      </div>
    `;
  }

  // Page 20: Патчи и обновления (Screenshot 3)
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

  // Page 21: Видеоролики (Screenshot 4)
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

  // Page 22: Вооружаемся - Интернет (Screenshot 5)
  renderSoftInternetPage() {
    return `
      <div style="display:flex; flex-direction:column; height:100%;">
        <!-- Section 1 -->
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

        <!-- Section 2 -->
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

  // Page 23: Программы для всех
  renderSoftAllPage() {
    return `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div style="font-family:'Arial Black'; font-size:15px; color:#00a800; margin-bottom:10px;">ПРОГРАММЫ И УТИЛИТЫ ДЛЯ ВСЕХ</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:11px;">
          <!-- Col 1 -->
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
              <span>Wintune 97 for Win95/NT</span>
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

          <!-- Col 2 -->
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
          </div>
        </div>
      </div>
    `;
  }

  // Page 24: Winamp, 159 скинов и плагины
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
          <div style="display:flex; gap:8px;">
            <button class="win-btn" id="btn_launch_winamp" style="font-weight:bold; padding:2px 8px;">Запустить WinAMP</button>
            <button class="win-btn" id="btn_open_skins_html" style="padding:2px 8px;">Каталог HTML</button>
          </div>
        </div>

        <div style="font-size:11px; margin-bottom:8px; line-height:1.4;">
          Коллекция из <b>159 лучших скинов</b> и 24 плагинов визуализации для культового проигрывателя <b>WinAMP 1.92</b>. Кликните по скину для предпросмотра и применения:
        </div>

        <div class="igroman-skins-gallery">
          ${skinCardsHtml}
        </div>
      </div>
    `;
  }

  // Page 25: Супербонус - Battlecruiser 3000AD
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

  // Page 26: Завершение
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
    // License Accept / Decline
    const btnAccept = stage.querySelector('#btn_license_accept');
    const btnDecline = stage.querySelector('#btn_license_decline');
    if (btnAccept) btnAccept.addEventListener('click', () => this.goToPage(2));
    if (btnDecline) btnDecline.addEventListener('click', () => window.winManager.closeWindow(this.winId));

    // Demo list items (Page 3)
    stage.querySelectorAll('.igroman-demo-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = parseInt(item.getAttribute('data-demo-page'), 10);
        if (!isNaN(page)) {
          this.goToPage(page);
        }
      });
    });

    // Install game button
    const btnInstallGame = stage.querySelector('#btn_install_game');
    if (btnInstallGame) {
      btnInstallGame.addEventListener('click', () => {
        const file = btnInstallGame.getAttribute('data-file');
        const title = btnInstallGame.getAttribute('data-title');
        this.runInstallWizard(title, file);
      });
    }

    // Burnout Launch & Reinstall Buttons
    const btnLaunchBurnout = stage.querySelector('#btn_launch_burnout');
    if (btnLaunchBurnout) {
      btnLaunchBurnout.addEventListener('click', () => {
        if (window.soundSys) window.soundSys.playClick();
        if (window.appBurnout) window.appBurnout.open();
      });
    }

    const btnReinstallBurnout = stage.querySelector('#btn_reinstall_burnout');
    if (btnReinstallBurnout) {
      btnReinstallBurnout.addEventListener('click', () => {
        if (window.gameManager) window.gameManager.openSetupWizard('burnout');
      });
    }

    const burnoutClickImg = stage.querySelector('#burnout_screenshot_click');
    if (burnoutClickImg) {
      burnoutClickImg.addEventListener('click', () => {
        if (window.gameManager && window.gameManager.isInstalled('burnout')) {
          if (window.appBurnout) window.appBurnout.open();
        } else {
          this.runInstallWizard('BURNOUT: CHAMPIONSHIP DRAG RACING', 'demo/burndemo.exe');
        }
      });
    }

    // NHL 98 Launch & Reinstall Buttons
    const btnLaunchHockey = stage.querySelector('#btn_launch_hockey');
    if (btnLaunchHockey) {
      btnLaunchHockey.addEventListener('click', () => {
        if (window.soundSys) window.soundSys.playClick();
        if (window.appHockey) window.appHockey.open();
      });
    }

    const btnReinstallHockey = stage.querySelector('#btn_reinstall_hockey');
    if (btnReinstallHockey) {
      btnReinstallHockey.addEventListener('click', () => {
        if (window.gameManager) window.gameManager.openSetupWizard('hockey');
      });
    }

    const nhlClickImg = stage.querySelector('#nhl98_screenshot_click');
    if (nhlClickImg) {
      nhlClickImg.addEventListener('click', () => {
        if (window.gameManager && window.gameManager.isInstalled('hockey')) {
          if (window.appHockey) window.appHockey.open();
        } else {
          this.runInstallWizard("NHL '98", 'demo/nhl98demo.exe');
        }
      });
    }

    // Patch selection and install
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

    // Video click
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

    // Soft install items
    stage.querySelectorAll('[data-install]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const file = btn.getAttribute('data-install');
        const title = btn.getAttribute('data-title');
        this.runInstallWizard(title, file);
      });
    });

    // Winamp actions
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

    // Battlecruiser buttons
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

    // Final exit
    const btnFinalExit = stage.querySelector('#btn_final_exit');
    if (btnFinalExit) {
      btnFinalExit.addEventListener('click', () => window.winManager.closeWindow(this.winId));
    }
  }

  // Retro InstallShield Wizard modal
  runInstallWizard(appName, exePath) {
    if (window.soundSys) window.soundSys.playClick();

    // Dedicated Bethesda Setup Wizard for Burnout Drag Racing
    if ((exePath === 'demo/burndemo.exe' || appName.toLowerCase().includes('burnout')) && window.gameManager) {
      window.gameManager.openSetupWizard('burnout');
      return;
    }

    // Dedicated EA Sports Setup Wizard for NHL 98
    if ((exePath === 'demo/nhl98demo.exe' || appName.toLowerCase().includes('nhl') || appName.toLowerCase().includes('хоккей')) && window.gameManager) {
      window.gameManager.openSetupWizard('hockey');
      return;
    }

    let percent = 0;
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
    });

    const interval = setInterval(() => {
      if (cancelled) {
        clearInterval(interval);
        return;
      }

      percent += Math.floor(Math.random() * 15) + 10;
      if (percent >= 100) {
        percent = 100;
        clearInterval(interval);
        barEl.style.width = '100%';
        percentEl.textContent = '100%';
        statusEl.textContent = 'Установка успешно завершена!';
        btnCancel.textContent = 'Готово';
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
